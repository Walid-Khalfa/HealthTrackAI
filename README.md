
# HealthTrackAI 🏥✨

**Multimodal Health Insights Powered by Gemini 3 Pro**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Beta-orange.svg)
![AI](https://img.shields.io/badge/AI-Gemini%203%20Pro-purple.svg)

## 📖 Overview

**HealthTrackAI** is an intelligent, educational medical assistant designed to help users organize their health data and understand their symptoms. 

Built for the **Google DeepMind / Kaggle Hackathon**, it leverages the advanced multimodal reasoning capabilities of **Gemini 3 Pro** to analyze complex combinations of:
*   📝 **Text:** Symptom descriptions and history.
*   📸 **Images:** Visual evidence (rashes, swelling, injuries).
*   🎙️ **Audio:** Voice notes and cough/breathing sounds.
*   📄 **Documents:** PDF medical reports and lab results.

> **⚠️ Disclaimer:** HealthTrackAI is an educational tool, not a medical device. It does not provide medical diagnoses or prescriptions. Always consult a professional healthcare provider.

## 🚀 Key Features

*   **Multimodal Analysis:** Fuses text, vision, and audio data into a single coherent report.
*   **Structured Reports:** Generates Executive Summaries, Detailed Findings, and "Doctor Summaries" for clinical handoff.
*   **Safety Guardrails:** Automatically detects "Red Flags" and advises on urgent care needs.
*   **Secure Dashboard:** Encrypted history of all past analyses with Role-Based Access Control (RBAC).
*   **PDF Export:** Download professional, printable reports.
*   **Smart Parsing:** Extracts structured data from unstructured user input using GenAI.

## 🏗️ Architecture

HealthTrackAI follows a secure, modern Single Page Application (SPA) architecture:

```mermaid
graph TD
    User[User] -->|Interact| Frontend[React + Tailwind]
    Frontend -->|Auth & Data| Supabase[Supabase (Auth, DB, RLS)]
    Frontend -->|Multimodal Input| Gemini[Gemini 3 Pro API]
    Supabase -->|Storage| S3[Supabase Storage]
    Gemini -->|Analysis JSON/MD| Frontend
```

### Tech Stack
*   **AI:** Google Gemini 3 Pro (via `@google/genai` SDK)
*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
*   **Development:** Google AI Studio (Vibe Coding)

## 📂 Project Structure

```text
src/
├── backend/          # API & Service Layer
│   ├── ai.ts         # Gemini Integration
│   └── supabaseClient.ts
├── frontend/         # UI Layer
│   ├── components/   # Reusable UI Atoms & Features
│   ├── pages/        # Full Application Screens
│   └── context/      # Global State (Auth)
├── config/           # Environment & Constants
└── types/            # TypeScript Definitions
```

## 🛠️ Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/healthtrackai.git
    cd healthtrackai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory based on `src/config/env.example`:
    ```env
    VITE_GOOGLE_API_KEY=your_gemini_api_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    Ensure your Supabase project has the following tables:
    *   `profiles` (linked to auth.users)
    *   `health_reports`
    *   `health_files`
    *   Enable **RLS (Row Level Security)** policies for all tables.

5.  **Run Locally**
    ```bash
    npm run dev
    ```

## 🛡️ Security

*   **RLS (Row Level Security):** Strictly enforced in Postgres. Users can only access their own data.
*   **Input Sanitization:** All AI prompts use XML tagging to separate user data from system instructions.
*   **Privacy:** No data is used for model training without explicit consent.

## 🔮 Future Roadmap

*   **Multi-language Support:** Native French/Spanish support via Gemini translation.
*   **Clinician Portal:** A dedicated view for doctors to review patient-shared reports.
*   **Wearable Integration:** Ingest Apple Health / Google Fit data.

---
*Built with ❤️ using Google AI Studio*
