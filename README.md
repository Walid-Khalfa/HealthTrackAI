# HealthTrackAI 🏥

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-beta-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20TypeScript%20%7C%20Supabase%20%7C%20Gemini-lightgrey)

**HealthTrackAI** is a secure, educational, **multimodal medical assistant** built on the **Google Gemini 3 Pro** architecture. It empowers users to analyze symptoms through various inputs—text descriptions, audio recordings, medical images, and PDF documents—to receive preliminary, non-diagnostic insights.

> **⚠️ DISCLAIMER:** This application is for **educational purposes only**. It does not provide medical diagnosis, treatment, or prescriptions. In case of emergency, users are strictly advised to contact professional emergency services.

---

## 📖 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [Database Schema](#-database-schema-supabase)
- [Security & Privacy](#-security--privacy)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Key Features

*   **🧠 Multimodal Analysis:**
    *   **Text:** Detailed symptom description processing.
    *   **Audio:** Voice-to-text symptom transcription and analysis.
    *   **Vision:** Image analysis for dermatological issues or visible symptoms.
    *   **Documents:** Parsing and explanation of PDF medical reports/lab results.
*   **🤖 Advanced AI Integration:**
    *   **Gemini 3 Pro:** Handles complex reasoning and synthesis for health insights.
    *   **Gemini 2.5 Flash:** Ensures rapid request classification and structured data extraction.
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

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A [Google Cloud Project](https://console.cloud.google.com/) with the **Gemini API** enabled.
*   A [Supabase](https://supabase.com/) project.

---

## ⚙️ Installation & Setup

Follow these steps to get the project running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/healthtrackai.git
cd healthtrackai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your API keys. You can duplicate a `.env.example` if available, or use the template below:

```env
# Google Gemini API
API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Set up the required tables and storage in your Supabase project. See the [Database Schema](#-database-schema-supabase) section for the SQL scripts.

### 5. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`.

---

## 💡 Usage Guide

### Getting Started
1.  **Sign Up/Login**: Create an account using the authentication page.
2.  **Dashboard**: Once logged in, you'll see your dashboard with past reports and analytics.

### Creating a New Analysis
1.  Click **"New Analysis"** or **"Start Analysis"**.
2.  **Describe Symptoms**: Type your symptoms in the text box.
3.  **Upload Media** (Optional):
    *   **Audio**: Record or upload a voice note describing how you feel.
    *   **Image**: Upload photos of visible symptoms (e.g., rashes).
    *   **Document**: Upload PDF lab reports for analysis.
4.  **Submit**: Click the send button. The AI will analyze the inputs and provide a summary, details, and recommendations.

### Managing Reports
*   **View History**: Click on any past report in the dashboard to view the full details.
*   **Export PDF**: Use the export button to download a summary to share with your healthcare provider.

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

*   **Prompt Injection Protection:** User inputs are sanitized and wrapped in XML tags (`<user_input>`) before processing.
*   **Session Management:** Automatic logout after **15 minutes of inactivity** to protect sensitive data.
*   **File Validation:** Uploads are validated via Magic Bytes signatures to ensure file integrity.
*   **Row Level Security (RLS):** Database policies strictly enforce that users can only access their own records.

---

## 📂 Project Structure

```
/
├── components/          # React UI Components (Dashboard, Chat, Forms)
├── context/             # Auth Context & Global State
├── services/            # API integrations (Gemini, Supabase wrappers)
├── utils/               # Helper functions (Parsers, Formatters)
├── App.tsx              # Main Routing & Layout Logic
├── Layout.tsx           # App Shell & Navigation
├── constants.ts         # Global Constants
├── types.ts             # TypeScript interfaces
├── index.tsx            # Entry point
└── index.html           # HTML Template
```

---

## ❓ Troubleshooting

### Common Issues

*   **Authentication Failed:**
    *   Ensure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in the `.env` file.
    *   Check if Email Auth provider is enabled in your Supabase dashboard.

*   **AI Analysis Not Working:**
    *   Verify your `API_KEY` for Gemini is valid and has quota available.
    *   Check the browser console for specific error messages regarding the API call.

*   **Database Errors:**
    *   Ensure you have run the SQL scripts in the [Database Schema](#-database-schema-supabase) section.
    *   Verify RLS policies if you are unable to view your own data.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps to contribute:

1.  **Fork the repository**.
2.  Create your feature branch: `git checkout -b feature/AmazingFeature`.
3.  Commit your changes: `git commit -m 'Add some AmazingFeature'`.
4.  Push to the branch: `git push origin feature/AmazingFeature`.
5.  Open a **Pull Request**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ using Google AI Studio*
