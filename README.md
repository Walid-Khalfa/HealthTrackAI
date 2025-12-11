
# HealthTrackAI hc

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Security](https://img.shields.io/badge/security-hardened-green.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)
![Tech](https://img.shields.io/badge/stack-React%20%7C%20Supabase%20%7C%20Gemini%203%20Pro-purple)

**HealthTrackAI** is a secure, educational, **multimodal medical assistant** built on the **Google Gemini 3 Pro** architecture. It empowers users to analyze symptoms via text, audio recordings, medical images, and PDF documents to receive preliminary, non-diagnostic insights.

> **⚠️ DISCLAIMER:** This application is for **educational purposes only**. It does not provide medical diagnosis, treatment, or prescriptions. In case of emergency, users are strictly advised to contact professional emergency services.

---

## 🛡️ Security Architecture (OWASP Compliant)

HealthTrackAI is built with a **Security-First** approach, implementing specific defenses against top web vulnerabilities:

| Vulnerability Category | Mitigation Strategy Implemented |
| :--- | :--- |
| **A01: Broken Access Control** | Strict **Row Level Security (RLS)** policies in Supabase ensure users can *only* access their own data. Service functions derive User ID strictly from the authenticated session. |
| **A03: Injection** | **XML Tagging** isolates user input from system instructions to prevent LLM Prompt Injection. All inputs are sanitized. |
| **A04: Insecure Design** | Implementation of **Rate Limiting** (client-side) and **File Constraints** (size & count limits) to prevent Denial of Service (DoS). |
| **A08: Software & Data Integrity** | **Safe JSON Parsing** with schema validation prevents crashes from malformed AI responses. **Magic Byte analysis** verifies file uploads (prevents renaming `.exe` to `.jpg`). |
| **A09: Logging & Monitoring** | Centralized **Security Logger** records critical events (Auth failures, Attack attempts, File violations) to a secure audit table. |
| **A10: Server-Side Request Forgery** | **URL Stripping** removes potential malicious links from user input before sending to the AI. Strict file type allow-listing prevents XML/SVG injection. |

---

## 🚀 Key Features

### 🧠 Multimodal Analysis
*   **Text:** Symptom description processing.
*   **Audio:** Voice-to-text symptom transcription and analysis (using native browser APIs).
*   **Vision:** Analysis of dermatological issues or visible symptoms via images.
*   **Documents:** Parsing and explanation of PDF medical reports/lab results.

### 🤖 Advanced AI Integration
*   **Reasoning Engine:** Uses **Gemini 3 Pro Preview** for complex medical reasoning and cross-modal synthesis.
*   **Classification Engine:** Uses **Gemini 2.5 Flash** for rapid request classification and structured JSON data extraction.

### 🔒 Secure Dashboard
*   **Session Management:** Automatic logout after 15 minutes of inactivity.
*   **Encrypted Storage:** All health data is stored in Supabase with RLS.
*   **Role-Based Access:** Distinction between Free and Pro users.

### 📄 Professional Reporting
*   **PDF Export:** Generate a clean, professional "Doctor Summary" PDF to share with healthcare providers.
*   **Visual Analytics:** Track symptom frequency and concern levels over time via interactive charts.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (Dark Mode supported).
*   **Backend (BaaS):** Supabase (Auth, PostgreSQL DB, Storage, Edge Functions).
*   **AI SDK:** Google GenAI SDK (`@google/genai`).
*   **PDF Generation:** `html2pdf.js`.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   A Google Cloud Project with **Gemini API** enabled.
*   A **Supabase** project.

### 2. Installation
```bash
git clone https://github.com/your-username/healthtrackai.git
cd healthtrackai
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:

```env
# Google Gemini API
API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Locally
```bash
npm run dev
```

---

## 🗄️ Database Schema & Security Setup

To run this application, execute the following SQL in your Supabase SQL Editor. This sets up the tables and the **mandatory security policies**.

### 1. Profiles & Reports
```sql
-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'user_free', 
  updated_at timestamp with time zone
);
alter table public.profiles enable row level security;
create policy "Users view own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- HEALTH REPORTS
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
  status text default 'pending',
  meta jsonb
);
alter table public.health_reports enable row level security;
create policy "Users manage own reports" on health_reports for all using (auth.uid() = user_id);
```

### 2. Files & Storage
```sql
-- HEALTH FILES METADATA
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
```

### 3. Security Audit Logs (Critical)
```sql
-- AUDIT LOGS (For OWASP A09)
create table public.security_audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  event_type text, -- 'AUTH_FAILURE', 'FILE_VIOLATION', etc.
  severity text,   -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  user_id uuid,
  user_email text,
  details jsonb
);
alter table public.security_audit_logs enable row level security;

-- Only allows inserts from authenticated users or service role
create policy "Enable insert for authenticated users" on security_audit_logs for insert with check (auth.role() = 'authenticated');
-- Users generally should NOT see logs, only admins.
create policy "Admins view logs" on security_audit_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);
```

### 4. Storage Buckets
In Supabase Storage, create a bucket named `health_files` and add RLS policies to restrict access to `(bucket_id = 'health_files' AND auth.uid()::text = (storage.foldername(name))[2])`.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License.
