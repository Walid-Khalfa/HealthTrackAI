import { useState } from 'react';
import { Attachment, HealthRiskLevel, Message, MessageRole } from '@shared/types';
import { classifyHealthRequest, generateHealthAnalysis } from '@backend/services/gemini';
import {
  createPendingReport,
  updateReportWithAIResult,
  uploadReportFiles,
} from '@backend/services/supabaseClient';
import { parseHealthReport } from '@shared/utils/reportParser';
import { useAuth } from '@frontend/context/AuthContext';

export const useHealthAnalysisChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
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
      let reportId: string | null = null;
      if (user) {
        try {
          const report = await createPendingReport(user.id, text, attachments);
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
        
        const summaryMatch = responseText.match(/### 1. Executive Summary\s*([\s\S]*?)(?=### 2|$)/i);
        const aiSummary = summaryMatch ? summaryMatch[1].trim() : responseText.slice(0, 200) + '...';
        
        const detailsMatch = responseText.match(/### 2. Detailed Analysis\s*([\s\S]*?)(?=### 3|$)/i);
        const aiDetails = detailsMatch ? detailsMatch[1].trim() : '';

        const recsMatch = responseText.match(/### 4. Actionable Recommendations\s*([\s\S]*?)(?=### 5|$)/i);
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

  return { messages, isLoading, handleSendMessage, setMessages };
};
