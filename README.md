# HealthTrackAI 🏥

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-beta-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20TypeScript%20%7C%20Supabase%20%7C%20Gemini-lightgrey)

**HealthTrackAI** is a secure, educational, **multimodal medical assistant** built on the **Google Gemini 3 Pro** architecture. It allows users to analyze symptoms via text, audio recordings, medical images, and PDF documents to receive preliminary, non-diagnostic insights.

> **⚠️ DISCLAIMER:** This application is for **educational purposes only**. It does not provide medical diagnosis, treatment, or prescriptions. In case of emergency, users are strictly advised to contact professional emergency services.

---

## 🚀 Key Features

*   **🧠 Multimodal Analysis:**
    *   **Text:** Symptom description processing.
    *   **Audio:** Voice-to-text symptom transcription and analysis.
    *   **Vision:** Analysis of dermatological issues or visible symptoms via images.
    *   **Documents:** Parsing and explanation of PDF medical reports/lab results.
*   **🤖 Advanced AI Integration:**
    *   Uses **Gemini 3 Pro** for complex reasoning and synthesis.
    *   Uses **Gemini 2.5 Flash** for rapid request classification and structured data extraction.
*   **🔒 Secure Dashboard:**
    *   User authentication via Supabase Auth.
    *   Encrypted storage for sensitive health history.
    *   Role-based access control (Free vs. Pro users).
*   **📊 Analytics & Tracking:**
    *   Visual dashboard for tracking symptom frequency and concern levels over time.
    *   Filtering by modality (Audio, Image, Doc) and risk level.
*   **📄 PDF Report Generation:**
    *   One-click export of AI analysis into a professional "Doctor Summary" PDF.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React 19
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Dark Mode supported)
*   **Build Tool:** Vite

### Backend & Database
*   **BaaS:** Supabase
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth
*   **Storage:** Supabase Storage (for images/audio/PDFs)

### AI & ML
*   **SDK:** Google GenAI SDK (`@google/genai`)
*   **Models:**
    *   `gemini-3-pro-preview` (Reasoning)
    *   `gemini-2.5-flash` (Classification & JSON extraction)

---

## ⚙️ Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A Google Cloud Project with the **Gemini API** enabled.
*   A **Supabase** project.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/healthtrackai.git
cd healthtrackai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
Create a `.env` file in the root directory:

```env
# Google Gemini API
API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server
```bash
npm run dev
```

---

## 🗄️ Database Schema (Supabase)

To run this application, you must set up the following tables in your Supabase SQL Editor:

### 1. Profiles Table
Extends the default `auth.users` table.

```sql
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'user_free', -- 'user_free', 'user_pro', 'admin'
  avatar_url text,
  updated_at timestamp with time zone
);

-- Enable RLS
alter table public.profiles enable row level security;
```

### 2. Health Reports Table
Stores the metadata and AI analysis results.

```sql
create table public.health_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Inputs
  input_text text,
  input_summary text,
  input_type text, -- 'text', 'image', 'audio', 'document'
  
  -- Flags
  has_images boolean default false,
  has_audio boolean default false,
  has_documents boolean default false,
  flagged boolean default false,
  
  -- AI Outputs
  ai_summary text,
  ai_details text,
  ai_recommendations text,
  preliminary_concern text, -- 'Low', 'Medium', 'High'
  
  -- User Edits
  custom_title text,
  user_notes text,
  concern_override text,
  
  status text default 'pending',
  meta jsonb
);

-- Enable RLS
alter table public.health_reports enable row level security;
```

### 3. Health Files Table
Links uploaded files to specific reports.

```sql
create table public.health_files (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.health_reports on delete cascade,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  file_type text, -- 'image', 'audio', 'document'
  storage_path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint
);

-- Enable RLS
alter table public.health_files enable row level security;
```

### 4. Storage Buckets
Create a new public bucket named `health_files` in Supabase Storage.

---

## 🛡️ Security & Privacy

*   **Prompt Injection Protection:** All user inputs are wrapped in XML tags (`<user_input>`) before being sent to the LLM to prevent prompt injection attacks.
*   **Session Management:** Automatic logout triggered after **15 minutes of inactivity** (no mouse movements or key presses) to protect sensitive health data on shared devices.
*   **File Validation:** All uploads are validated via Magic Bytes signatures (in `supabaseClient.ts`) to ensure file integrity (e.g., ensuring a `.jpg` is actually an image).
*   **RLS (Row Level Security):** Database policies ensure users can only access their own health records.

---

## 📂 Project Structure

```
/
├── public/              # Static assets
├── src/
│   ├── backend/         # Supabase client & Logic (Singleton)
│   ├── components/      # React UI Components (Dashboard, Chat, Forms)
│   ├── context/         # Auth Context & Global State
│   ├── services/        # API integrations (Gemini, Supabase wrappers)
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Helper functions (Parsers, Formatters)
│   ├── App.tsx          # Main Routing & Layout Logic
│   └── index.tsx        # Entry point
├── index.html           # HTML Template (CSP Headers included)
├── metadata.json        # Project metadata
└── README.md            # Documentation
```

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 🔮 Future Roadmap

*   **Multi-language Support:** Native French/Spanish support via Gemini translation.
*   **Clinician Portal:** A dedicated view for doctors to review patient-shared reports.
*   **Wearable Integration:** Ingest Apple Health / Google Fit data.

---
*Built with ❤️ using Google AI Studio*

