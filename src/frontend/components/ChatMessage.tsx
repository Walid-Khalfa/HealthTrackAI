
import React from 'react';
import { Message, MessageRole } from '../../shared/types';
import { AttachmentPreview } from './AttachmentPreview';
import { HealthReportView } from './HealthReportView';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.User;
  const isModel = message.role === MessageRole.Model;

  // Check if content looks like a structured report (contains specific headers)
  // MODIFIED: now checks for "### 1." to support multiple languages (English/French)
  const isReport = isModel && (message.content.includes("### 1.") || message.content.includes("### 1 "));

  // Basic Markdown rendering helper (for user messages or fallback)
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold handling
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-2 last:mb-0">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  if (isReport) {
    return (
      <div className="flex w-full mb-8 justify-start animate-fade-in">
        <HealthReportView markdownContent={message.content} timestamp={message.timestamp} />
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[90%] md:max-w-[80%] rounded-2xl p-5 shadow-sm transition-colors relative
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm text-gray-800 dark:text-gray-100'}
        `}
      >
        {/* Text Content */}
        <div className="text-sm md:text-base leading-relaxed mb-3">
          {renderContent(message.content)}
        </div>

        {/* Attachment Grid - Styled to look good on the blue background or white background */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 dark:border-gray-700">
             <div className="flex flex-wrap gap-3">
                {message.attachments.map((att) => (
                   <AttachmentPreview key={att.id} attachment={att} />
                ))}
             </div>
          </div>
        )}

        <div className={`text-[10px] mt-2 opacity-70 ${isUser ? 'text-blue-50 text-right' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    </div>
  );
};
