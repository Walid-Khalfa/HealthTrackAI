import React, { useState, useEffect } from 'react';
import { Button } from './Button';

const WELCOME_MODAL_SEEN_KEY = 'healthtrackai_welcome_modal_seen';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal only on first visit
    const hasSeenModal = localStorage.getItem(WELCOME_MODAL_SEEN_KEY);
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-slide-in-up">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-medical-500 to-teal-500 flex items-center justify-center shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Welcome to HealthTrackAI!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">This is an interactive demo for a hackathon submission.</p>
          
          <div className="text-left bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3 mb-8 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">🚀 Quick Demo Guide:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li>Click **"Get Started"** to create a secure account.</li>
              <li>Describe a symptom like <strong className="text-medical-600 dark:text-medical-400">"sore throat and fever"</strong> and submit for AI analysis.</li>
              <li>Explore your **Dashboard** to see your analysis history and trends.</li>
            </ol>
          </div>

          <Button onClick={handleClose} size="lg" className="w-full">
            Let's Go!
          </Button>
        </div>
      </div>
    </div>
  );
};
