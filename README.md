# HealthTrackAI: Your Secure, AI-Powered Health Companion

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-submission--ready-brightgreen.svg)
![Tech](https://img.shields.io/badge/tech-React%2C%20Supabase%2C%20Gemini-purple)
![License](https://img.shields.io/badge/license-MIT-gray)

**HealthTrackAI is a secure, privacy-focused, multimodal health analysis platform designed for a competitive hackathon.** It leverages Google's **Gemini Pro** model to provide preliminary insights from user-provided health data, including text descriptions, audio recordings, medical images, and PDF lab reports.

> **⚠️ IMPORTANT DISCLAIMER:** HealthTrackAI is an **educational tool** and proof-of-concept. It is **NOT** a diagnostic device and does not replace professional medical advice. If you have a medical emergency, please consult a healthcare professional immediately.

---

## ✨ Key Features

*   **🧠 Multimodal Analysis**: Seamlessly fuses data from Text, Audio, Images, and Documents for a holistic health assessment.
*   **🛡️ Enterprise-Grade Security**: Built with a "Security First" mindset using OWASP principles.
*   **🔒 Private Dashboard**: User data is isolated using Row Level Security (RLS).
*   **📂 Smart Document Parsing**: Extracts values and ranges from medical PDFs.
*   **📊 Visual Analytics**: Tracks symptom trends and concern levels over time.
*   **🔌 Offline Mode**: Access cached reports even without an internet connection.

---

## ▶️ Live Demo

Experience HealthTrackAI firsthand!

*   **Google AI Studio App**: [https://ai.studio/apps/drive/1l7b1dG4a-hxZfNuoW64kyabcRonFnwUB](https://ai.studio/apps/drive/1l7b1dG4a-hxZfNuoW64kyabcRonFnwUB)
*   **YouTube Demo Video**: [https://youtu.be/qJBWB4I5ECM](https://youtu.be/qJBWB4I5ECM)

---

## 🎯 The Problem & Our Solution

**Problem:** Individuals often struggle to understand complex medical data, track their symptoms effectively, and communicate their health history concisely to doctors. This can lead to anxiety, delayed care, and miscommunication.

**Solution:** HealthTrackAI empowers users to take control of their health narrative. By providing a secure platform to consolidate and analyze their health data with the power of generative AI, we provide:
*   **Clarity:** AI-powered summaries of symptoms and lab reports in easy-to-understand language.
*   **Insight:** A visual dashboard to track symptom trends and concern levels over time.
*   **Preparedness:** A shareable, structured health report that users can take to their doctor's appointments.

**Impact:** Our goal is to reduce patient anxiety, improve the quality of patient-doctor communication, and help users become more informed participants in their own healthcare journey.

---

## 🛠️ Tech Stack & Architecture

### Tech Stack
*   **Frontend**: React, TypeScript, Vite, Tailwind CSS
*   **AI Model**: Google Gemini Pro via `@google/genai`
*   **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
*   **Data Visualization**: Recharts (via an SVG-based custom implementation for this demo)

### Architecture Overview

HealthTrackAI is built on a modern, secure Jamstack architecture:

1.  **Client (React App)**: The user interacts with the React single-page application. The app handles all UI, state management, and user input.
2.  **AI Service (Gemini Pro)**: When a user requests an analysis, the frontend calls a secure cloud function (or directly from a secure client in this demo) which sends a structured prompt to the Gemini Pro API.
3.  **Backend (Supabase)**:
    *   **Authentication**: Supabase Auth handles user sign-up, login, and session management.
    *   **Database**: A PostgreSQL database stores user profiles and encrypted health report metadata. **Row Level Security (RLS)** is strictly enforced to ensure users can only ever access their own data.
    *   **Storage**: Encrypted files (images, audio, PDFs) are uploaded to Supabase Storage, with RLS policies ensuring only the data owner can access them.

This architecture ensures that the application is fast, scalable, and secure by default, with a clear separation between the client, AI services, and backend infrastructure.

---

## 🚀 Getting Started: Setup Instructions

### Method 1: Google AI Studio (Recommended for Quick Demo)

This application is optimized for one-click setup in Google AI Studio.

1.  **Secrets**: In the AI Studio editor, open the "Secrets" panel (key icon).
2.  **Add Secrets**: Create the following secrets. The app will automatically use them.
    *   `GEMINI_API_KEY`: Your Google Gemini API key.
    *   `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxx.supabase.co`).
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase project's `public` anonymous key.
3.  **Run the App**: Click the **"Run"** button in the top bar. The preview panel will open and display the application.

### Method 2: Local Development

1.  **Prerequisites**:
    *   Node.js (v18 or higher)
    *   npm / yarn / pnpm

2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/healthtrackai.git
    cd healthtrackai
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Configure Environment Variables**:
    *   Create a file named `.env` in the root of the project.
    *   Copy the contents of `.env.example` into your new `.env` file.
    *   Fill in the values with your credentials from Google AI Studio and Supabase.

5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### 🧪 Running tests (Vitest)

Run the full test suite once:

```bash
npm run test
```

Run in watch mode while developing:

```bash
npm run test:watch
```

### Module import aliases

TypeScript and Vite are configured with `baseUrl: ./src` and the following path aliases:

- `@frontend/*` → `src/frontend/*`
- `@backend/*` → `src/backend/*`
- `@shared/*` → `src/shared/*`
- `@utils/*` → `src/utils/*`

Prefer these aliases over long relative imports when working across folders.

---

## 🗄️ Supabase Setup (Required)

To get Supabase working, follow these steps after creating your project:

1.  **Get Credentials**: Navigate to `Project Settings` > `API` in your Supabase dashboard to find your `URL` and `anon` key. Use these for your environment variables/secrets.

2.  **Run SQL Scripts**:
    *   Go to the **SQL Editor** in your Supabase dashboard.
    *   Copy the entire contents of `src/backend/security/db_setup.sql` and run it. This creates the tables.
    *   Copy the entire contents of `src/backend/security/supabase_security.sql` and run it. This enables Row Level Security and applies the security policies.

3.  **Configure CORS**: For file uploads to work from the browser, you must allow the app's origin.
    *   Go to `Project Settings` > `API`.
    *   Under "CORS Configuration," add `http://localhost:5173` for local development or the Google AI Studio preview URL.

---

## 🕹️ Demo Instructions for Judges

To experience the core functionality of HealthTrackAI quickly:

1.  **Launch the App**: The app starts on the landing page.
2.  **Start an Analysis**: Click the "Get Started" button. You will be prompted to sign up or log in. An account is required to save your analysis history securely.
3.  **Create a New Analysis**:
    *   You are now on the "New Analysis" page.
    *   **Describe symptoms** in the text box (e.g., "I've had a dry cough and a headache for two days.").
    *   (Optional) Use the buttons to **upload an image, a PDF, or record audio**.
    *   Click **"Generate Analysis"**.
4.  **View the AI Report**: You will be taken to a chat view where the AI provides a structured summary, risk assessment, and recommendations.
5.  **Explore the Dashboard**:
    *   Click the **"Dashboard"** icon in the sidebar.
    *   Here you can see your analysis history, view charts of your data, and manage past reports by clicking on them.

---

## ⚠️ Known Limitations

*   **No Real-time PDF Exports**: The "Export to PDF" feature is a placeholder and is not implemented.
*   **Basic Audio Analysis**: The AI's ability to analyze coughs or speech patterns from audio is rudimentary and for demonstration purposes only.
*   **Admin View**: The admin view in the dashboard is for demonstration and does not include advanced moderation tools.
*   **Scalability**: The current implementation of some dashboard calculations may slow down with a very large number of reports.

---

## 🏆 Hackathon Context

This project was developed for the **Google DeepMind · Featured Hackathon**. Our team's goal was to explore the intersection of generative AI and personal health management, with a strong emphasis on user privacy and data security. We believe that by making health data more accessible and understandable, we can empower individuals to lead healthier lives.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.