

import { createClient } from '@supabase/supabase-js';
import { HealthReport, Attachment, AttachmentType, HealthRiskLevel, UserProfile } from '../../shared/types';

// --- Supabase Initialization ---

// Hard-coded fallback credentials to ensure the app runs in preview environments (like AI Studio)
// where .env files might not be loaded reliably.
const FALLBACK_SUPABASE_URL = "https://cfdvtdqjxlequhnmknsk.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZHZ0ZHFqeGxlcXVobm1rbnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDEyMDIsImV4cCI6MjA4MDY3NzIwMn0.uPQayxZ2bPLxWaVLqCYxVchRE85dk1nIeHp876KN4qA";

// Safely get Supabase credentials from Vite's env variables, ensuring they are not empty.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim() !== ''
  ? import.meta.env.VITE_SUPABASE_URL
  : FALLBACK_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== ''
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : FALLBACK_SUPABASE_ANON_KEY;

// Initialize the client. The logic above guarantees we never pass empty strings.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 1. Create a pending report row.
 */
export const createPendingReport = async (
  userId: string,
  inputText: string,
  attachments: Attachment[]
): Promise<HealthReport> => {
  const hasImages = attachments.some(a => a.type === AttachmentType.Image);
  const hasAudio = attachments.some(a => a.type === AttachmentType.Audio);
  const hasDocs = attachments.some(a => a.type === AttachmentType.Pdf);

  const inputTypes = [];
  if (inputText) inputTypes.push('text');
  if (hasImages) inputTypes.push('image');
  if (hasAudio) inputTypes.push('audio');
  if (hasDocs) inputTypes.push('document');

  const { data, error } = await supabase
    .from('health_reports')
    .insert([
      {
        user_id: userId,
        input_text: inputText,
        input_summary: inputText.slice(0, 100) + (inputText.length > 100 ? '...' : ''),
        input_type: inputTypes.join(', ') || 'mixed',
        has_images: hasImages,
        has_audio: hasAudio,
        has_documents: hasDocs,
        status: 'pending',
        preliminary_concern: 'Unknown',
        flagged: false, // Default unflagged
      }
    ])
    .select()
    .single();

  if (error) {
    // Only log actual errors, not RLS/Permissions denials which are expected in demo mode
    if (error.code !== '42501' && error.code !== 'P0001') {
      console.error('Error creating pending report:', error.message);
    }
    throw error;
  }
  return data;
};

/**
 * 2. Upload files to Storage and link them in `health_files`.
 */
export const uploadReportFiles = async (
  reportId: string,
  userId: string,
  attachments: Attachment[]
) => {
  if (attachments.length === 0) return;

  const uploadPromises = attachments.map(async (att) => {
    try {
      // Convert Base64 to Blob
      const blob = await base64ToBlob(att.data, att.mimeType);

      // SECURITY: Validate File Signature (Magic Numbers)
      // This prevents uploading .exe renamed as .jpg
      const isValid = await validateFileSignature(blob, att.mimeType);
      if (!isValid) {
        throw new Error(`Security Alert: File signature does not match MIME type ${att.mimeType}`);
      }

      const fileExt = att.mimeType.split('/')[1] || 'bin';
      
      // SECURITY: Use UUID for filename to prevent path traversal or overwrites
      const secureFileName = `${getUUID()}.${fileExt}`;
      
      const folder = att.type === AttachmentType.Image ? 'images' : att.type === AttachmentType.Audio ? 'audio' : 'documents';
      
      // SECURITY: Enforce strict path structure including User ID
      const filePath = `${folder}/${userId}/${reportId}/${secureFileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('health_files')
        .upload(filePath, blob, {
          contentType: att.mimeType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Insert record into health_files table
      const { error: dbError } = await supabase
        .from('health_files')
        .insert([{
          report_id: reportId,
          user_id: userId,
          file_type: att.type === AttachmentType.Pdf ? 'document' : att.type,
          storage_path: filePath,
          original_name: att.name || 'untitled',
          mime_type: att.mimeType,
          size_bytes: blob.size
        }]);

      if (dbError) throw dbError;

    } catch (err: any) {
      // Handle RLS/Permission errors gracefully (common in demos)
      if (
        err.statusCode === '403' || 
        err.code === '42501' || 
        (err.message && err.message.includes('row-level security'))
      ) {
        console.warn(`Skipped upload for ${att.name}: Backend storage permissions not configured.`);
      } else {
        console.error(`Failed to upload file ${att.id}:`, err);
      }
      // We allow other files to proceed
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
    try {
        await supabase.from('health_reports').update({ status: 'failed' }).eq('id', reportId);
    } catch (e) { /* ignore cleanup error */ }
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
  const { error } = await supabase
    .from('health_reports')
    .update(updates)
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
  // 1. Get files linked to this report to delete from storage
  const { data: files } = await supabase
    .from('health_files')
    .select('storage_path')
    .eq('report_id', reportId);

  // 2. Delete files from storage (if any)
  if (files && files.length > 0) {
    const paths = files.map(f => f.storage_path);
    await supabase.storage.from('health_files').remove(paths);
  }

  // 3. Delete DB rows (Cascading delete handles health_files usually, but strict RLS might require explicit)
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
 * Helper: Fetch History
 * If userId is provided, filter by it. If not (and admin), fetch all via RLS.
 */
export const getHealthReports = async (userId: string) => {
  const { data, error } = await supabase
    .from('health_reports')
    .select('*')
    .eq('user_id', userId)
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
    // Only log if it's NOT a "Row not found" error (PGRST116)
    if (error.code !== 'PGRST116') {
       console.error('Error fetching profile:', error);
    }
    return null;
  }
  return data as UserProfile;
};

/**
 * Update User Profile
 */
export const updateUserProfile = async (userId: string, updates: { full_name?: string }) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);

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
  // Strip data URI prefix if present
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
 * SECURITY: Verify file magic numbers to prevent malicious uploads
 */
const validateFileSignature = async (blob: Blob, mimeType: string): Promise<boolean> => {
  const arr = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  let header = "";
  for(let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16).toUpperCase().padStart(2, '0');
  }

  // Simple Magic Number Check
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
      return true; 
  }
};

const getUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}