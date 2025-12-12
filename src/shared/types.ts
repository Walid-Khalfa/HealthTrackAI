

export enum MessageRole {
  User = 'user',
  Model = 'model',
}

export enum AttachmentType {
  Image = 'image',
  Audio = 'audio',
  Pdf = 'pdf',
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  mimeType: string;
  data: string; // Base64 string
  previewUrl?: string; // For display
  name?: string;
  size?: number; // Size in bytes
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface AppState {
  messages: Message[];
  isLoading: boolean;
  input: string;
  attachments: Attachment[];
}

// Supabase Schema Types

export type AppRole = 'user_free' | 'user_pro' | 'moderator' | 'admin' | 'super_admin';

// MODIFIED: Removed 'Unknown' to enforce strict categorization
export type HealthRiskLevel = 'Low' | 'Medium' | 'High';
export type ReportStatus = 'pending' | 'completed' | 'failed';

export interface UserProfile {
  id: string;
  email?: string; // Often from auth.users, but useful to have in type
  role: AppRole;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface HealthReport {
  id: string;
  user_id: string;
  created_at: string;
  
  // Inputs
  input_text: string; // Replaces input_summary for full text storage
  input_summary?: string; // Optional short summary
  input_type: string; // "text, image, audio"
  
  // User Editable Fields (CRUD)
  custom_title?: string;
  user_notes?: string;
  concern_override?: HealthRiskLevel;

  // Flags
  has_images: boolean;
  has_documents: boolean;
  has_audio: boolean;
  flagged?: boolean; // Moderation flag
  
  // AI Outputs
  ai_summary: string;
  ai_details?: string;
  ai_recommendations?: string;
  
  // NEW: Matches DB schema
  preliminary_concern: HealthRiskLevel; 
  
  // State
  status: ReportStatus;
  meta: any; // JSONB for detailed logs or errors
}

export interface HealthFile {
  id: string;
  report_id: string;
  user_id: string;
  file_type: 'image' | 'document' | 'audio';
  storage_path: string;
  original_name?: string;
  mime_type: string;
  size_bytes?: number;
  created_at: string;
}