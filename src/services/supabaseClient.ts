
import { createClient } from '@supabase/supabase-js';
import { HealthReport, Attachment, AttachmentType, HealthRiskLevel, UserProfile } from '../types';
import { validateInputLength, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_REPORT, getSecureUUID } from '../utils/security';
import { logger } from './logger';

// Helper to safely access environment variables without crashing in browser
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

// SECURITY: Configuration must come from environment variables.
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment."
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/**
 * 1. Create a pending report row.
 * SECURITY: Derives userId from session to prevent IDOR.
 */
export const createPendingReport = async (
  inputText: string,
  attachments: Attachment[]
): Promise<HealthReport> => {
  // Get current user from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be authenticated to create a report.");

  // SECURITY: Validate input length (DoS Prevention)
  const safeInputText = validateInputLength(inputText, 'text');

  const hasImages = attachments.some(a => a.type === AttachmentType.Image);
  const hasAudio = attachments.some(a => a.type === AttachmentType.Audio);
  const hasDocs = attachments.some(a => a.type === AttachmentType.Pdf);

  const inputTypes = [];
  if (safeInputText) inputTypes.push('text');
  if (hasImages) inputTypes.push('image');
  if (hasAudio) inputTypes.push('audio');
  if (hasDocs) inputTypes.push('document');

  const { data, error } = await supabase
    .from('health_reports')
    .insert([
      {
        user_id: user.id, // Enforced from session
        input_text: safeInputText,
        input_summary: safeInputText.slice(0, 100) + (safeInputText.length > 100 ? '...' : ''),
        input_type: inputTypes.join(', ') || 'mixed',
        has_images: hasImages,
        has_audio: hasAudio,
        has_documents: hasDocs,
        status: 'pending',
        preliminary_concern: 'Medium',
        flagged: false,
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code !== '42501' && error.code !== 'P0001') {
      console.error('Error creating pending report:', error.message);
      logger.log('API_ERROR_CRITICAL', 'HIGH', `DB Insert Failure: ${error.message}`, { table: 'health_reports' });
    }
    throw error;
  }
  return data;
};

/**
 * 2. Upload files to Storage.
 * SECURITY: Uses session ID for path construction to prevent path traversal/uploading to others' folders.
 * SECURITY: Enforces MAX_FILE_SIZE and MAX_FILES_PER_REPORT (Insecure Design Prevention)
 */
export const uploadReportFiles = async (
  reportId: string,
  attachments: Attachment[]
) => {
  if (attachments.length === 0) return;

  // SECURITY: Enforce Max Files Count
  if (attachments.length > MAX_FILES_PER_REPORT) {
    logger.log('FILE_UPLOAD_VIOLATION', 'MEDIUM', 'Max files per report exceeded');
    throw new Error(`Security Violation: Maximum ${MAX_FILES_PER_REPORT} files allowed per report.`);
  }

  // Get current user from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be authenticated to upload files.");

  const uploadPromises = attachments.map(async (att) => {
    try {
      const blob = await base64ToBlob(att.data, att.mimeType);

      // SECURITY: Enforce Max File Size
      if (blob.size > MAX_FILE_SIZE_BYTES) {
        logger.log('FILE_UPLOAD_VIOLATION', 'MEDIUM', `File size exceeded: ${att.name} (${blob.size} bytes)`);
        throw new Error(`Security Violation: File ${att.name} exceeds maximum allowed size of 10MB.`);
      }

      // SECURITY: Validate File Signature (Magic Numbers)
      const isValid = await validateFileSignature(blob, att.mimeType);
      if (!isValid) {
        // AUDIT: Critical security event - potential malware upload attempt
        logger.log(
          'FILE_UPLOAD_VIOLATION', 
          'CRITICAL', 
          `Magic Byte mismatch. Pretended to be ${att.mimeType} but signature invalid.`, 
          { fileName: att.name, claimedMime: att.mimeType }
        );
        throw new Error(`Security Alert: File signature does not match MIME type ${att.mimeType}`);
      }

      const fileExt = att.mimeType.split('/')[1] || 'bin';
      
      // SECURITY: Use CSPRNG UUID for filename
      const secureFileName = `${getSecureUUID()}.${fileExt}`;
      const folder = att.type === AttachmentType.Image ? 'images' : att.type === AttachmentType.Audio ? 'audio' : 'documents';
      
      // SECURITY: Enforce strict path structure: folder/USER_ID/report_id/filename
      const filePath = `${folder}/${user.id}/${reportId}/${secureFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('health_files')
        .upload(filePath, blob, {
          contentType: att.mimeType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('health_files')
        .insert([{
          report_id: reportId,
          user_id: user.id, // Enforced from session
          file_type: att.type === AttachmentType.Pdf ? 'document' : att.type,
          storage_path: filePath,
          original_name: att.name || 'untitled',
          mime_type: att.mimeType,
          size_bytes: blob.size
        }]);

      if (dbError) throw dbError;

    } catch (err: any) {
      // Re-throw security violations to stop process if critical
      if (err.message.includes('Security Violation') || err.message.includes('Security Alert')) {
        throw err;
      }

      if (
        err.statusCode === '403' || 
        err.code === '42501' || 
        (err.message && err.message.includes('row-level security'))
      ) {
        console.warn(`Skipped upload for ${att.name}: Backend storage permissions not configured.`);
      } else {
        console.error(`Failed to upload file ${att.id}:`, err);
        logger.log('SYSTEM_ERROR', 'LOW', `File upload failure: ${err.message}`);
      }
    }
  });

  await Promise.all(uploadPromises);
};

/**
 * 3. Update report with AI results.
 */
export const updateReportWithAIResult = async (
  reportId: string,
  aiResult: {
    summary: string;
    details: string;
    recommendations: string;
    preliminary_concern: string;
    input_type: string;
    full_response: string;
  }
) => {
  // We don't check session explicitly here as RLS on 'update' will handle ownership check
  const { error } = await supabase
    .from('health_reports')
    .update({
      ai_summary: aiResult.summary,
      ai_details: aiResult.details,
      ai_recommendations: aiResult.recommendations,
      preliminary_concern: aiResult.preliminary_concern,
      input_type: aiResult.input_type,
      status: 'completed',
      meta: { full_response: aiResult.full_response }
    })
    .eq('id', reportId);

  if (error) {
    if (error.code !== '42501' && error.code !== 'P0001') {
      console.error('Error updating report with AI result:', error.message);
    }
    throw error;
  }
};

/**
 * 4. Update Report Details (CRUD - Update)
 */
export const updateReportDetails = async (
  reportId: string,
  updates: {
    custom_title?: string;
    user_notes?: string;
    concern_override?: HealthRiskLevel;
  }
) => {
  // SECURITY: Validate inputs (DoS / Spam prevention)
  const safeUpdates = {
    ...updates,
    custom_title: updates.custom_title ? validateInputLength(updates.custom_title, 'title') : undefined,
    user_notes: updates.user_notes ? validateInputLength(updates.user_notes, 'text') : undefined,
  };

  const { error } = await supabase
    .from('health_reports')
    .update(safeUpdates)
    .eq('id', reportId);

  if (error) {
    console.error('Error updating report details:', error);
    throw error;
  }
};

/**
 * 5. Delete Report and Files (CRUD - Delete)
 */
export const deleteHealthReport = async (reportId: string) => {
  const { data: files } = await supabase
    .from('health_files')
    .select('storage_path')
    .eq('report_id', reportId);

  if (files && files.length > 0) {
    const paths = files.map(f => f.storage_path);
    await supabase.storage.from('health_files').remove(paths);
  }

  await supabase.from('health_files').delete().eq('report_id', reportId);
  
  const { error } = await supabase
    .from('health_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

/**
 * Helper: Fetch User's Own History
 * SECURITY: Removed userId argument. Always fetches for current session user.
 */
export const getHealthReports = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('health_reports')
    .select('*')
    .eq('user_id', user.id) // Enforced from session
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (error.code !== '42501' && error.code !== 'P0001') {
       console.error('Error fetching health reports:', error);
    }
    return [];
  }
  return data as HealthReport[];
};

/**
 * Helper: Fetch ALL reports (Admin only)
 */
export const getAllHealthReports = async () => {
  // The security here relies entirely on RLS policies for the 'admin' role.
  const { data, error } = await supabase
    .from('health_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching all reports:', error);
    return [];
  }
  return data as HealthReport[];
};

/**
 * Helper: Auth Sign Out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error);
};

// --- PROFILE MANAGEMENT ---

/**
 * Fetch User Profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
       console.error('Error fetching profile:', error);
    }
    return null;
  }
  return data as UserProfile;
};

/**
 * Update User Profile
 * SECURITY: Removed userId argument. Updates current user only.
 */
export const updateUserProfile = async (updates: { full_name?: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // SECURITY: Validate Name Length
  const safeUpdates = {
    ...updates,
    full_name: updates.full_name ? validateInputLength(updates.full_name, 'title') : undefined
  };

  const { error } = await supabase
    .from('profiles')
    .update({ 
      ...safeUpdates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id); // Enforced from session

  if (error) {
    throw error;
  }
};

/**
 * Upgrade to Pro (Calls Secure RPC)
 */
export const upgradeToPro = async () => {
  const { error } = await supabase.rpc('upgrade_to_pro');
  if (error) {
    console.error("Upgrade failed:", error);
    throw error;
  }
};


// --- Utilities ---

const base64ToBlob = async (base64Data: string, contentType: string): Promise<Blob> => {
  const base64 = base64Data.replace(/^data:.*,/, '');
  
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
};

/**
 * SECURITY: Verify file magic numbers to prevent malicious uploads (SSRF/XSS via SVG)
 * IMPORTANT: Default behavior must be FALSE (Deny All) for security.
 */
const validateFileSignature = async (blob: Blob, mimeType: string): Promise<boolean> => {
  const arr = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  let header = "";
  for(let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16).toUpperCase().padStart(2, '0');
  }

  // Strict Allowlist Check
  switch(mimeType) {
    case 'image/jpeg':
      return header.startsWith('FFD8FF');
    case 'image/png':
      return header.startsWith('89504E47');
    case 'application/pdf':
      return header.startsWith('25504446'); // %PDF
    case 'audio/mpeg': // MP3 ID3
      return header.startsWith('494433') || header.startsWith('FFF'); 
    default:
      // SECURITY: REJECT ALL UNKNOWN TYPES (e.g. SVG which can cause XSS/SSRF)
      console.warn(`Blocked upload of unsupported type: ${mimeType}`);
      return false; 
  }
};

export { getSecureUUID } from '../utils/security';
