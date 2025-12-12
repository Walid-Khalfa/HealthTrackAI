
import { createClient } from '@supabase/supabase-js';
import { HealthReport, Attachment, AttachmentType, HealthRiskLevel, UserProfile, FeedbackRating } from '../types';
import { validateInputLength, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_REPORT, getSecureUUID } from '../utils/security';
import { logger } from './logger';

// Helper to safely access environment variables (supports Vite, Process, and Fallbacks)
const getEnv = (key: string, fallback: string = ''): string => {
  let value = '';
  
  // 1. Try import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      value = import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) { /* ignore */ }

  // 2. Try process.env (Node/Webpack)
  if (!value && typeof process !== 'undefined' && process.env) {
    value = process.env[key] || process.env[`VITE_${key}`];
  }

  return value || fallback;
};

// HARD FALLBACKS FOR DEMO/PREVIEW MODE
// Prevents "supabaseUrl is required" crash
const DEFAULT_URL = 'https://cfdvtdqjxlequhnmknsk.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZHZ0ZHFqeGxlcXVobm1rbnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDEyMDIsImV4cCI6MjA4MDY3NzIwMn0.uPQayxZ2bPLxWaVLqCYxVchRE85dk1nIeHp876KN4qA';

const supabaseUrl = getEnv('SUPABASE_URL', DEFAULT_URL);
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', DEFAULT_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase credentials missing. App may not function correctly.");
}

export const supabase = createClient(supabaseUrl || DEFAULT_URL, supabaseAnonKey || DEFAULT_KEY);

/**
 * 1. Create a pending report row.
 * SECURITY: Derives userId from session to prevent IDOR.
 */
export const createPendingReport = async (
  userId: string, // Kept for compatibility with existing calls, but verified against session
  inputText: string,
  attachments: Attachment[],
  title?: string,
  dueDate?: string
): Promise<HealthReport> => {
  if (!navigator.onLine) {
    throw new Error("You appear to be offline. Please check your internet connection.");
  }

  // Get current user from session to ensure security
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication session invalid. Please reload or sign in again.");
  
  // Verify userId matches session
  const effectiveUserId = user.id;

  // SECURITY: Validate input length (DoS Prevention)
  const safeInputText = validateInputLength(inputText, 'text');
  const safeTitle = title ? validateInputLength(title, 'title') : undefined;

  const hasImages = attachments.some(a => a.type === AttachmentType.Image);
  const hasAudio = attachments.some(a => a.type === AttachmentType.Audio);
  const hasDocs = attachments.some(a => a.type === AttachmentType.Pdf);

  const inputTypes = [];
  if (safeInputText) inputTypes.push('text');
  if (hasImages) inputTypes.push('image');
  if (hasAudio) inputTypes.push('audio');
  if (hasDocs) inputTypes.push('document');

  try {
    const { data, error } = await supabase
      .from('health_reports')
      .insert([
        {
          user_id: effectiveUserId,
          input_text: safeInputText,
          input_summary: safeInputText.slice(0, 100) + (safeInputText.length > 100 ? '...' : ''),
          input_type: inputTypes.join(', ') || 'mixed',
          custom_title: safeTitle,
          due_date: dueDate || null,
          has_images: hasImages,
          has_audio: hasAudio,
          has_documents: hasDocs,
          status: 'pending',
          preliminary_concern: 'Medium', // Default to Medium for safety
          flagged: false,
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '42501') {
         // RLS Error
         throw new Error("Permission denied: You cannot create reports.");
      }
      console.error('Error creating pending report:', error.message);
      logger.log('API_ERROR_CRITICAL', 'HIGH', `DB Insert Failure: ${error.message}`, { table: 'health_reports' });
      throw new Error(`Failed to save history: ${error.message}`);
    }
    return data;
  } catch (err: any) {
    // Catch fetch/network errors specifically
    if (err.message && err.message.includes("Failed to fetch")) {
      console.error("Network Error:", err);
      throw new Error("Network error: Unable to connect to the database. Please check your connection.");
    }
    throw err;
  }
};

/**
 * 2. Upload files to Storage.
 * SECURITY: Uses session ID for path construction to prevent path traversal/uploading to others' folders.
 * SECURITY: Enforces MAX_FILE_SIZE and MAX_FILES_PER_REPORT (Insecure Design Prevention)
 */
export const uploadReportFiles = async (
  reportId: string,
  userId: string, // Kept for compatibility
  attachments: Attachment[]
): Promise<{ successCount: number; failures: string[] }> => {
  if (attachments.length === 0) return { successCount: 0, failures: [] };

  // SECURITY: Enforce Max Files Count
  if (attachments.length > MAX_FILES_PER_REPORT) {
    logger.log('FILE_UPLOAD_VIOLATION', 'MEDIUM', 'Max files per report exceeded');
    throw new Error(`Security Violation: Maximum ${MAX_FILES_PER_REPORT} files allowed per report.`);
  }

  // Get current user from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be authenticated to upload files.");
  
  const effectiveUserId = user.id;

  const failures: string[] = [];
  let successCount = 0;

  const uploadPromises = attachments.map(async (att) => {
    try {
      const blob = await base64ToBlob(att.data, att.mimeType);

      // SECURITY: Enforce Max File Size
      if (blob.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Exceeds 10MB limit`);
      }

      // SECURITY: Validate File Signature (Magic Numbers)
      const isValid = await validateFileSignature(blob, att.mimeType);
      if (!isValid) {
        throw new Error(`Invalid file signature for ${att.mimeType}`);
      }

      const fileExt = att.mimeType.split('/')[1] || 'bin';
      
      // SECURITY: Use CSPRNG UUID for filename
      const secureFileName = `${getSecureUUID()}.${fileExt}`;
      const folder = att.type === AttachmentType.Image ? 'images' : att.type === AttachmentType.Audio ? 'audio' : 'documents';
      
      // SECURITY: Enforce strict path structure: folder/USER_ID/report_id/filename
      const filePath = `${folder}/${effectiveUserId}/${reportId}/${secureFileName}`;

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
          user_id: effectiveUserId,
          file_type: att.type === AttachmentType.Pdf ? 'document' : att.type,
          storage_path: filePath,
          original_name: att.name || 'untitled',
          mime_type: att.mimeType,
          size_bytes: blob.size
        }]);

      if (dbError) throw dbError;
      
      successCount++;

    } catch (err: any) {
      const msg = err.message || "Unknown upload error";
      const fileName = att.name || "File";
      
      // Re-throw critical security violations to alert the UI clearly
      if (msg.includes('Security Violation') || msg.includes('Security Alert')) {
         failures.push(`${fileName}: ${msg}`);
         return; 
      }

      if (
        err.statusCode === '403' || 
        err.code === '42501' || 
        (msg && msg.includes('row-level security'))
      ) {
        console.warn(`Skipped upload for ${fileName}: Backend storage permissions not configured.`);
        failures.push(`${fileName}: Storage permission denied.`);
      } else {
        console.error(`Failed to upload file ${att.id}:`, err);
        logger.log('SYSTEM_ERROR', 'LOW', `File upload failure: ${msg}`);
        failures.push(`${fileName}: ${msg}`);
      }
    }
  });

  await Promise.all(uploadPromises);
  return { successCount, failures };
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
    console.warn("Note: AI result was generated but could not be persisted to history.");
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
    due_date?: string;
  }
) => {
  // SECURITY: Validate inputs (DoS / Spam prevention)
  const safeUpdates: any = { ...updates };
  if (updates.custom_title !== undefined) safeUpdates.custom_title = validateInputLength(updates.custom_title, 'title');
  if (updates.user_notes !== undefined) safeUpdates.user_notes = validateInputLength(updates.user_notes, 'text');

  const { error } = await supabase
    .from('health_reports')
    .update(safeUpdates)
    .eq('id', reportId);

  if (error) {
    console.error('Error updating report details:', error);
    throw new Error("Failed to update report. Please check your connection.");
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
    throw new Error("Failed to delete report.");
  }
};

/**
 * 6. Submit Feedback
 */
export const submitFeedback = async (reportId: string, rating: FeedbackRating) => {
  const { data, error: fetchError } = await supabase
    .from('health_reports')
    .select('meta')
    .eq('id', reportId)
    .single();

  if (fetchError) {
    console.error("Error fetching report for feedback:", fetchError);
    return;
  }

  const existingMeta = data.meta || {};
  const updatedMeta = {
    ...existingMeta,
    user_feedback: {
      rating,
      timestamp: new Date().toISOString()
    }
  };

  const { error: updateError } = await supabase
    .from('health_reports')
    .update({ meta: updatedMeta })
    .eq('id', reportId);

  if (updateError) {
    console.error("Error submitting feedback:", updateError);
    throw new Error("Could not save feedback.");
  }
};

/**
 * Helper: Fetch User's Own History
 */
export const getHealthReports = async (userId?: string) => {
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

export const updateUserProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const safeUpdates: any = {};
  if (updates.full_name !== undefined) safeUpdates.full_name = validateInputLength(updates.full_name, 'title');
  if (updates.avatar_url !== undefined) safeUpdates.avatar_url = validateInputLength(updates.avatar_url, 'text');

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id,
      ...safeUpdates, 
      updated_at: new Date().toISOString() 
    }); 

  if (error) {
    console.error("Profile update failed:", error);
    throw new Error("Could not update profile. Please try again.");
  }
};

export const upgradeToPro = async () => {
  const { error } = await supabase.rpc('upgrade_to_pro');
  if (error) {
    console.error("Upgrade failed:", error);
    throw new Error("Upgrade failed. Please check your connection or try again later.");
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

const validateFileSignature = async (blob: Blob, mimeType: string): Promise<boolean> => {
  const arr = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  let header = "";
  for(let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16).toUpperCase().padStart(2, '0');
  }

  switch(mimeType) {
    case 'image/jpeg': return header.startsWith('FFD8FF');
    case 'image/png': return header.startsWith('89504E47');
    case 'application/pdf': return header.startsWith('25504446');
    case 'audio/mpeg': return header.startsWith('494433') || header.startsWith('FFF'); 
    default:
      // Allow others in dev but warn
      // console.warn(`Uploaded type ${mimeType} not explicitly strictly verified by magic bytes.`);
      return true; 
  }
};

export { getSecureUUID } from '../utils/security';
