
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, Attachment, HealthReport, HealthRiskLevel, FeedbackRating } from './types';
import { generateHealthAnalysis, classifyHealthRequest } from './services/gemini';
import { 
  createPendingReport, 
  uploadReportFiles, 
  updateReportWithAIResult, 
  signOut,
  submitFeedback
} from './services/supabaseClient';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { SymptomForm } from './components/SymptomForm';
import { Dashboard } from './components/Dashboard';
import { SettingsPage } from './components/SettingsPage';
import { TaskList } from './components/TaskList';
import { LandingPage } from './components/LandingPage';
import { LegalPage, LegalSection } from './components/LegalPage';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { parseHealthReport } from './utils/reportParser';

type ViewState = 'landing' | 'form' | 'chat' | 'dashboard' | 'settings' | 'legal' | 'tasks';

// Inner component to use Auth Context
const AppContent = () => {
  const { user, role, profile, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewState>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // State for Legal Page navigation
  const [legalSection, setLegalSection] = useState<LegalSection>('privacy');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  // Sync View with Auth State
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setShowAuth(false);
        // Only redirect to form if currently on landing or legal.
        // If user is already on dashboard or settings, stays there.
        if (view === 'landing' || view === 'legal') setView('form');
      } else {
        // If not logged in, force landing unless viewing legal pages
        if (view !== 'landing' && view !== 'legal') setView('landing');
      }
    }
  }, [user, authLoading, view]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  const handleStartAnalysis = () => {
    if (user) {
      setView('form');
    } else {
      setShowAuth(true);
    }
  };

  const handleOpenLegal = (section: LegalSection) => {
    setLegalSection(section);
    setView('legal');
    window.scrollTo(0, 0);
  };

  const handleViewReport = (report: HealthReport) => {
    // Reconstruct the conversation from the saved report
    const userMessage: Message = {
      id: `req-${report.id}`,
      role: MessageRole.User,
      content: report.input_text || report.input_summary || "Requested analysis",
      timestamp: new Date(report.created_at).getTime(),
      attachments: [], // In a full implementation, we would fetch and link the files here
      reportId: report.id
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
      reportId: report.id,
      feedback: report.meta?.user_feedback?.rating
    };

    setMessages([userMessage, aiMessage]);
    setView('chat');
  };

  // Feedback Handler
  const handleFeedback = async (messageId: string, rating: FeedbackRating) => {
    // Find the message
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.reportId) {
      console.warn("Cannot submit feedback: No report ID linked to message.");
      return;
    }

    // Optimistic Update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: rating } : m));

    try {
      await submitFeedback(targetMsg.reportId, rating);
    } catch (e) {
      console.error("Feedback submission failed", e);
      // Revert if needed (omitted for brevity)
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[], title?: string, dueDate?: string) => {
    if (view === 'form') {
      setView('chat');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      content: text || (attachments.length > 0 ? "Provided attachments for analysis." : "Requested analysis."),
      attachments,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let reportId: string | undefined = undefined;
      if (user) {
        try {
          // Now passing title and dueDate to the DB service
          const report = await createPendingReport(user.id, text, attachments, title, dueDate);
          reportId = report.id;
          await uploadReportFiles(reportId, user.id, attachments);
        } catch (dbErr: any) {
          console.warn("History save unavailable:", dbErr.message);
        }
      }

      const historyContext = messages
        .filter(m => m.role === MessageRole.Model)
        .map(m => `AI Response: ${m.content}`)
        .slice(-2)
        .join('\n\n');

      const [responseText, classification] = await Promise.all([
        generateHealthAnalysis(text, attachments, historyContext),
        classifyHealthRequest(text, attachments)
      ]);

      if (reportId) {
        // Parse the FULL text response to extract the concern level that matches the PDF/Chat view
        const parsedReport = parseHealthReport(responseText);
        
        // Normalize 'Moderate' (from parser) to 'Medium' (for DB schema)
        let synchronizedConcern = parsedReport.riskLevel as string;
        if (synchronizedConcern === 'Moderate') synchronizedConcern = 'Medium';
        
        const summaryMatch = responseText.match(/### 1\. Executive Summary\s*([\s\S]*?)(?=### 2|$)/i);
        const aiSummary = summaryMatch ? summaryMatch[1].trim() : responseText.slice(0, 200) + '...';
        
        const detailsMatch = responseText.match(/### 2\. Detailed Analysis\s*([\s\S]*?)(?=### 3|$)/i);
        const aiDetails = detailsMatch ? detailsMatch[1].trim() : '';

        const recsMatch = responseText.match(/### 4\. Actionable Recommendations\s*([\s\S]*?)(?=### 5|$)/i);
        const aiRecs = recsMatch ? recsMatch[1].trim() : '';

        try {
          await updateReportWithAIResult(reportId, {
            summary: aiSummary,
            details: aiDetails,
            recommendations: aiRecs,
            preliminary_concern: synchronizedConcern as HealthRiskLevel, // Use synchronized concern
            input_type: classification.analysis_type,
            full_response: responseText
          });
        } catch (updateErr) {
          console.warn("Could not save analysis result.");
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.Model,
        content: responseText,
        timestamp: Date.now(),
        reportId: reportId, // Link this AI response to the report ID so we can rate it later
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Failed to generate response", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.Model,
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (showAuth) {
    return <AuthForm onSuccess={() => setShowAuth(false)} onCancel={() => { setShowAuth(false); if (!user) setView('landing'); }} />;
  }

  if (view === 'legal') {
    return (
      <LegalPage 
        section={legalSection} 
        onBack={() => setView('landing')} 
      />
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage 
        onStart={handleStartAnalysis} 
        onSignIn={() => setShowAuth(true)}
        onOpenLegal={handleOpenLegal}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <Layout 
      currentView={view} 
      onNavigate={setView} 
      onSignOut={signOut}
      userEmail={user?.email}
      userProfile={profile}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    >
      {view === 'dashboard' && (
        <Dashboard 
          onNewAnalysis={() => setView('form')} 
          onViewDetails={handleViewReport} 
        />
      )}

      {view === 'settings' && (
        <SettingsPage />
      )}

      {view === 'tasks' && (
        <TaskList />
      )}

      {view === 'form' && (
        <SymptomForm onSubmit={handleSendMessage} isLoading={isLoading} />
      )}

      {view === 'chat' && (
        <div className="relative flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 pb-32">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                   <p>No messages yet.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onFeedback={handleFeedback}
                  />
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start mb-6">
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white dark:from-slate-900 pt-10 pb-4 px-4">
             <div className="max-w-4xl mx-auto">
               <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
