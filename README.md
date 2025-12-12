
# HealthTrackAI 🏥

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Security](https://img.shields.io/badge/security-hardened-green.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini%203%20Pro-purple)
![License](https://img.shields.io/badge/license-MIT-gray)

**HealthTrackAI** is a secure, privacy-focused, multimodal medical assistant. It leverages Google's **Gemini 3 Pro** model to analyze symptoms described in text, audio recordings of coughs/speech, medical images (rashes, injuries), and PDF documents (lab reports).

> **⚠️ IMPORTANT DISCLAIMER:** HealthTrackAI is an **educational tool** for preliminary information only. It is **NOT** a diagnostic device and does not replace professional medical advice.

---

## ✨ Key Features

*   **🧠 Multimodal Analysis**: Seamlessly fuses data from Text, Audio, Images, and Documents for a holistic health assessment.
*   **🛡️ Enterprise-Grade Security**: Built with a "Security First" mindset using OWASP principles.
*   **🔒 Private Dashboard**: User data is isolated using Row Level Security (RLS).
*   **📂 Smart Document Parsing**: Extracts values and ranges from medical PDFs.
*   **📊 Visual Analytics**: Tracks symptom trends and concern levels over time.
*   **🔌 Offline Mode**: Access cached reports even without an internet connection.

---

## 🔐 Security Architecture

HealthTrackAI implements rigorous security controls to protect user data and prevent abuse:

1.  **Row Level Security (RLS)**: Database policies ensure users can *only* access their own records.
2.  **Input Sanitization**: All inputs are scrubbed to prevent Prompt Injection (XML fencing) and XSS.
3.  **SSRF Protection**: URLs are stripped from inputs to prevent Server-Side Request Forgery.
4.  **Rate Limiting**: Client-side throttling (5 req/min) to prevent API abuse and DoS.
5.  **File Integrity Checks**: Uploads are validated via "Magic Bytes" to prevent malicious file execution (e.g., stopping an `.exe` disguised as a `.jpg`).
6.  **Audit Logging**: Critical security events (auth failures, potential attacks) are logged to a secured audit table.

---

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
*   **AI Model**: Google Gemini 3 Pro (`gemini-3-pro-preview`) via `@google/genai` SDK
*   **Backend / DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
*   **Visualization**: Recharts
*   **PDF Generation**: html2pdf.js

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A **Supabase** project (Free tier works).
*   A **Google Cloud** project with Gemini API enabled.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/healthtrackai.git
cd healthtrackai
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Gemini API Key (Required for AI features)
API_KEY=your_gemini_api_key_here

# Supabase Configuration (Required for Auth/DB)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)

Go to your Supabase SQL Editor and run the following schema to set up Auth, Tables, Storage, and RLS policies.

```sql
-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user_free', 
  updated_at timestamp with time zone
);
alter table public.profiles enable row level security;
create policy "Users view own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- 2. Health Reports Table
create table public.health_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  input_text text,
  input_summary text,
  input_type text,
  ai_summary text,
  ai_details text,
  ai_recommendations text,
  preliminary_concern text,
  custom_title text,
  user_notes text,
  concern_override text,
  due_date timestamp with time zone,
  has_images boolean default false,
  has_audio boolean default false,
  has_documents boolean default false,
  status text default 'pending',
  meta jsonb,
  flagged boolean default false
);
alter table public.health_reports enable row level security;
create policy "Users manage own reports" on health_reports for all using (auth.uid() = user_id);

-- 3. Health Files Table
create table public.health_files (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.health_reports on delete cascade,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  file_type text,
  storage_path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint
);
alter table public.health_files enable row level security;
create policy "Users manage own files" on health_files for all using (auth.uid() = user_id);

-- 4. Security Audit Logs (Admin Only)
create table public.security_audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  event_type text,
  severity text,
  user_id uuid,
  user_email text,
  details jsonb
);
alter table public.security_audit_logs enable row level security;
create policy "Enable insert for authenticated users" on security_audit_logs for insert with check (auth.role() = 'authenticated');

-- 5. Storage Buckets
insert into storage.buckets (id, name, public) values ('health_files', 'health_files', true);
create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check (bucket_id = 'health_files');
create policy "Users can view own files" on storage.objects for select to authenticated using (bucket_id = 'health_files' and auth.uid()::text = (storage.foldername(name))[2]);
```

### 5. Running the App

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173` (or the port shown in your terminal) to view the app.

---

## 🔧 Troubleshooting

### "Supabase credentials missing"
The app includes a hard-coded fallback for demo purposes. If you see this, check that your `.env` file is present and named correctly. In production, ensure environment variables are set in your platform dashboard (Vercel, Netlify, etc.).

### "html2pdf not found"
The PDF export feature relies on an external CDN script. If you are offline or your firewall blocks CDNs, the button will automatically fallback to the native browser print dialog (`window.print()`).

### CORS Errors
If you see CORS errors when uploading files, ensure your Supabase Storage bucket CORS policy is configured to allow requests from your domain (or `*` for development).

---

## 📖 Usage Guide

1.  **Sign Up/Login**: Create an account to securely save your history.
2.  **New Analysis**:
    *   Type your symptoms.
    *   (Optional) Upload photos, audio recordings, or PDF reports.
    *   Click "Generate Analysis".
3.  **Review Report**: Read the structured AI breakdown, concern level, and recommendations.
4.  **Dashboard**: View your history, track trends, and manage tasks.
5.  **Export**: Download a PDF summary to share with your doctor.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
