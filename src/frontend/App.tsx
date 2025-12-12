import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { Message, MessageRole, Attachment, HealthReport } from '../../shared/types';

import { signOut } from '../../backend/services/supabaseClient';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { SymptomForm } from './components/SymptomForm';
import { Dashboard } from './components/Dashboard';
import { SettingsPage } from './components/SettingsPage';
import { LandingPage } from './components/LandingPage';
import { LegalPage, LegalSection } from './components/LegalPage';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHealthAnalysisChat } from './hooks/useHealthAnalysisChat';
import { useDarkMode } from './hooks/useDarkMode';
import { WelcomeModal } from './components/WelcomeModal'; // Import WelcomeModal

// ProtectedRoute component
const ProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-medical-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading HealthTrackAI...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
};

const AppContent = () => {
  const { user, role, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { messages, isLoading, handleSendMessage, setMessages } = useHealthAnalysisChat();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Sync with Auth State
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // If logged in and on a public route (landing, legal, auth), redirect to dashboard
        if (location.pathname === '/' || location.pathname.startsWith('/legal') || location.pathname.startsWith('/auth')) {
          navigate('/app/dashboard', { replace: true });
        }
      } else {
        // If not logged in and on a protected route, ProtectedRoute will redirect to /auth.
        // If not logged in and on /auth, no redirect needed.
        // If not logged in and on /legal or /, no redirect needed.
        // Otherwise, if somehow on an unknown non-public route, redirect to landing.
        if (!location.pathname.startsWith('/app') && location.pathname !== '/' && !location.pathname.startsWith('/legal') && !location.pathname.startsWith('/auth')) {
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, authLoading, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname === '/chat') {
      scrollToBottom();
    }
  }, [messages, location.pathname]);

  const handleStartAnalysis = () => {
    if (user) {
      navigate('/app/form');
    } else {
      navigate('/auth');
    }
  };

  const handleOpenLegal = (section: LegalSection) => {
    navigate(`/legal?section=${section}`);
    window.scrollTo(0, 0);
  };

  const handleViewReport = (report: HealthReport) => {
    // Reconstruct the conversation from the saved report
    const userMessage: Message = {
      id: `req-${report.id}`,
      role: MessageRole.User,
      content: report.input_text || report.input_summary || "Requested analysis",
      timestamp: new Date(report.created_at).getTime(),
      attachments: [] // In a full implementation, we would fetch and link the files here
    };

    // Use the full markdown response if saved in meta, otherwise construct it
    const aiContent = report.meta?.full_response || 
      `### 1. Executive Summary\n${report.ai_summary}\n\n` +
      `### 2. Detailed Analysis\n${report.ai_details || 'Not available'}\n\n` +
      `### 4. Recommendations\n${report.ai_recommendations || 'Not available'}`;

    const aiMessage: Message = {
      id: `res-${report.id}`,
      role: MessageRole.Model,
      content: aiContent,
      timestamp: new Date(report.created_at).getTime() + 1000,
    };

    setMessages([userMessage, aiMessage]);
    navigate('/chat');
  };



  return (
    <Routes>
      <Route path="/" element={
        !user ? (
          <LandingPage
            onStart={handleStartAnalysis}
            onSignIn={() => navigate('/auth')}
            onOpenLegal={handleOpenLegal}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        ) : (
          <Navigate to="/app/dashboard" replace />
        )
      } />
      <Route path="/auth" element={<AuthForm onSuccess={() => navigate('/app/dashboard')} onCancel={() => navigate('/')} />} />
      <Route path="/legal" element={<LegalPage section={new URLSearchParams(location.search).get('section') as LegalSection || 'privacy'} onBack={() => navigate('/')} />} />

      {/* Protected routes with shared Layout */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout // Layout wrapper for all protected routes
            onSignOut={signOut}
            userEmail={user?.email}
            userProfile={profile}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <Outlet /> {/* Renders child routes here */}
          </Layout>
        </ProtectedRoute>
      }>
        {/* Child routes for /app */}
        <Route index element={<Dashboard onNewAnalysis={() => navigate('/app/form')} onViewDetails={handleViewReport} />} /> {/* /app */}
        <Route path="dashboard" element={<Dashboard onNewAnalysis={() => navigate('/app/form')} onViewDetails={handleViewReport} />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="form" element={<SymptomForm onSubmit={handleSendMessage} isLoading={isLoading} />} />
        <Route path="chat" element={<ChatPage messages={messages} isLoading={isLoading} handleSendMessage={handleSendMessage} />} />
      </Route>
      {/* Catch-all for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <WelcomeModal />
    </AuthProvider>
  );
};

export default App;
