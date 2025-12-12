
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
*   A **Supabase** project (Free tier works).
*   A **Google AI Studio** project with the Gemini API enabled.

### 2. Environment Configuration (Google AI Studio)

This application is optimized for Google AI Studio.

1.  **Secrets**: In the AI Studio editor, go to the "Secrets" panel (key icon).
2.  **Add Secrets**: Create the following secrets. The app will automatically use them.
    *   `GEMINI_API_KEY`: Your Gemini API key.
    *   `VITE_SUPABASE_URL`: Your Supabase project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase publishable anonymous key.

> **Note**: The app includes a fallback for Supabase credentials, allowing the UI to run even if secrets are not configured. However, database and authentication features will not work until the secrets are set.

### 3. Database Setup (Supabase)

Go to your Supabase SQL Editor and run the `db_setup.sql` script located in the root of this project. This will set up all the necessary tables, policies, and storage buckets.

### 4. Running the App

Click the **"Run"** button in the Google AI Studio toolbar. The preview panel will open automatically and display the application.

---

## 🔧 Troubleshooting

### Content Security Policy (CSP) Errors
*   **Problem**: The browser console shows errors related to blocked scripts or resources.
*   **Cause**: This app is designed to run without external CDN scripts to enhance security. It relies on locally served or browser-native features. The `index.html` file includes a restrictive CSP.
*   **Solution**: Do not add external script tags. If a feature is needed, find a way to implement it locally or use a browser-native alternative (like `window.print()` instead of a PDF library).

### CORS Errors
*   **Problem**: Network errors in the console when uploading files or connecting to Supabase.
*   **Cause**: Your Supabase project is not configured to accept requests from the AI Studio preview domain.
*   **Solution**:
    1.  Go to your Supabase Project Dashboard.
    2.  Navigate to `Project Settings` -> `API`.
    3.  Under the "CORS Configuration" section, add the AI Studio preview URL (e.g., `https://*.google.aistudio.dev`) to the list of allowed origins. For local development, you can add `http://localhost:3000`.

### Supabase Preview Mode / "Credentials Missing"
*   **Problem**: The app shows a "Fallback Mode" banner or you can't log in.
*   **Cause**: The AI Studio environment may not have loaded your secrets correctly, or they are missing.
*   **Solution**:
    1.  Verify that the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets are correctly set in the AI Studio "Secrets" panel.
    2.  The app has a built-in fallback Supabase configuration that allows the UI to render without valid credentials. This is normal for a read-only preview. Full functionality is restored once the secrets are loaded.

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
