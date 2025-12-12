
import React, { useState } from 'react';
import { Message, MessageRole, FeedbackRating } from '../types';
import { AttachmentPreview } from './AttachmentPreview';
import { HealthReportView } from './HealthReportView';
import { Icons } from './Icons';

interface ChatMessageProps {
  message: Message;
  onFeedback?: (messageId: string, rating: FeedbackRating) => void;
}

// --- Custom Lightweight Markdown Parser ---

const parseInline = (text: string, isUser: boolean): React.ReactNode[] => {
  // 1. Code: `text`
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code 
          key={i} 
          className={`
            px-1.5 py-0.5 rounded text-sm font-mono border
            ${isUser 
              ? 'bg-blue-700 text-blue-100 border-blue-500' 
              : 'bg-slate-200 dark:bg-slate-900/50 text-pink-600 dark:text-pink-400 border-slate-300 dark:border-slate-700'}
          `}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return processLinks(part, i, isUser);
  });
};

const processLinks = (text: string, keyPrefix: number, isUser: boolean): React.ReactNode => {
  // 2. Links: [text](url)
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <React.Fragment key={keyPrefix}>
      {parts.map((part, i) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a 
              key={i} 
              href={linkMatch[2]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`
                break-words hover:underline
                ${isUser ? 'text-white underline decoration-blue-300' : 'text-blue-600 dark:text-blue-400'}
              `}
            >
              {linkMatch[1]}
            </a>
          );
        }
        return processBold(part, i, isUser);
      })}
    </React.Fragment>
  );
};

const processBold = (text: string, keyPrefix: number, isUser: boolean): React.ReactNode => {
  // 3. Bold: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <React.Fragment key={keyPrefix}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong 
              key={i} 
              className={`font-bold ${isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}
            >
              {processItalic(part.slice(2, -2), i, isUser)}
            </strong>
          );
        }
        return processItalic(part, i, isUser);
      })}
    </React.Fragment>
  );
};

const processItalic = (text: string, keyPrefix: number, isUser: boolean): React.ReactNode => {
  // 4. Italic: *text*
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <React.Fragment key={keyPrefix}>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </React.Fragment>
  );
};

const MarkdownRenderer: React.FC<{ content: string, isUser: boolean }> = ({ content, isUser }) => {
  // Split by Code Blocks first
  const blocks = content.split(/(```[\s\S]*?```)/g);

  const headerClass = isUser ? 'text-white' : 'text-slate-900 dark:text-white';
  const subHeaderClass = isUser 
    ? 'text-white border-blue-400' 
    : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700';
  const listBulletClass = isUser ? 'text-blue-200' : 'text-blue-500/60 dark:text-blue-400/60';
  const listNumClass = isUser ? 'text-blue-200' : 'text-slate-400';
  const blockquoteClass = isUser 
    ? 'border-blue-300 bg-blue-700/30 text-blue-50' 
    : 'border-blue-200 dark:border-blue-900 bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400';

  return (
    <div className="space-y-1 text-sm md:text-base leading-relaxed break-words">
      {blocks.map((block, index) => {
        // Code Block
        if (block.startsWith('```') && block.endsWith('```')) {
          const innerContent = block.slice(3, -3);
          const firstLineBreak = innerContent.indexOf('\n');
          let lang = 'Code';
          let code = innerContent;
          
          if (firstLineBreak > -1) {
             const possibleLang = innerContent.substring(0, firstLineBreak).trim();
             // Simple check if first line looks like a lang identifier
             if (possibleLang && !possibleLang.includes(' ') && possibleLang.length < 15) {
                lang = possibleLang;
                code = innerContent.substring(firstLineBreak + 1);
             }
          }

          return (
            <div 
              key={index} 
              className={`
                my-3 rounded-lg overflow-hidden border shadow-sm
                ${isUser 
                  ? 'bg-blue-800/40 border-blue-500/30' 
                  : 'bg-slate-50 dark:bg-[#0d1117] border-slate-200 dark:border-slate-700'}
              `}
            >
              <div 
                className={`
                  px-3 py-1.5 text-xs font-mono border-b uppercase tracking-wider
                  ${isUser 
                    ? 'bg-blue-900/40 text-blue-200 border-blue-500/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                `}
              >
                {lang}
              </div>
              <pre className={`p-3 overflow-x-auto font-mono text-xs sm:text-sm ${isUser ? 'text-blue-50' : 'text-slate-800 dark:text-slate-300'}`}>
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Standard Text Block (Split by lines for lists/headers)
        return (
          <div key={index}>
            {block.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-2"></div>;

              // Headers
              if (trimmed.startsWith('### ')) return <h3 key={i} className={`text-base font-bold mt-4 mb-2 ${headerClass}`}>{parseInline(trimmed.slice(4), isUser)}</h3>;
              if (trimmed.startsWith('## ')) return <h2 key={i} className={`text-lg font-bold mt-5 mb-2 pb-1 border-b ${subHeaderClass}`}>{parseInline(trimmed.slice(3), isUser)}</h2>;
              if (trimmed.startsWith('# ')) return <h1 key={i} className={`text-xl font-bold mt-6 mb-3 ${headerClass}`}>{parseInline(trimmed.slice(2), isUser)}</h1>;

              // Lists
              if (trimmed.match(/^[\*\-]\s/)) {
                return (
                  <div key={i} className="flex gap-3 ml-1 mb-1">
                    <span className={`mt-2 w-1.5 h-1.5 rounded-full bg-current shrink-0 ${listBulletClass}`}></span>
                    <div className="flex-1">{parseInline(trimmed.replace(/^[\*\-]\s/, ''), isUser)}</div>
                  </div>
                );
              }
              if (trimmed.match(/^\d+\.\s/)) {
                const num = trimmed.match(/^\d+\./)?.[0];
                return (
                  <div key={i} className="flex gap-2 ml-1 mb-1">
                    <span className={`font-mono text-xs mt-1 min-w-[18px] text-right select-none ${listNumClass}`}>{num}</span>
                    <div className="flex-1">{parseInline(trimmed.replace(/^\d+\.\s/, ''), isUser)}</div>
                  </div>
                );
              }

              // Blockquotes
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote key={i} className={`border-l-4 pl-4 py-1 my-2 italic rounded-r ${blockquoteClass}`}>
                    {parseInline(trimmed.slice(2), isUser)}
                  </blockquote>
                );
              }

              return <p key={i} className="mb-1">{parseInline(line, isUser)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFeedback }) => {
  const isUser = message.role === MessageRole.User;
  const isModel = message.role === MessageRole.Model;
  const [localFeedback, setLocalFeedback] = useState<FeedbackRating | undefined>(message.feedback);

  // Check if content looks like a structured report (contains specific headers)
  const isReport = isModel && (message.content.includes("### 1.") || message.content.includes("### 1 "));

  const getStatusIcon = () => {
    if (!isUser || !message.status) return null;

    switch (message.status) {
      case 'sending':
        return <span title="Sending..." className="animate-pulse text-blue-200"><Icons.Sending className="w-3 h-3" /></span>;
      case 'sent':
        return <span title="Sent" className="text-blue-200"><Icons.Sent className="w-3 h-3" /></span>;
      case 'error':
        return <span title="Failed to send" className="text-red-300"><Icons.Error className="w-3 h-3" /></span>;
      default:
        return null;
    }
  };

  const handleFeedbackClick = (rating: FeedbackRating) => {
    if (localFeedback === rating) return; 
    setLocalFeedback(rating);
    if (onFeedback) {
      onFeedback(message.id, rating);
    }
  };

  const renderFeedbackButtons = () => {
    if (!isModel || message.content === "I apologize, but I encountered an error. Please try again.") return null;

    return (
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mr-1">Was this helpful?</span>
        
        <button
          onClick={() => handleFeedbackClick('positive')}
          className={`p-1.5 rounded-full transition-colors ${
            localFeedback === 'positive'
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10'
          }`}
          title="Helpful"
        >
          <Icons.ThumbsUp className="w-4 h-4" strokeWidth={localFeedback === 'positive' ? 2 : 1.5} />
        </button>

        <button
          onClick={() => handleFeedbackClick('negative')}
          className={`p-1.5 rounded-full transition-colors ${
            localFeedback === 'negative'
              ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
          }`}
          title="Not Helpful"
        >
          <Icons.ThumbsDown className="w-4 h-4" strokeWidth={localFeedback === 'negative' ? 2 : 1.5} />
        </button>
      </div>
    );
  };

  if (isReport) {
    return (
      <div className="flex w-full mb-8 justify-start animate-fade-in flex-col">
        <HealthReportView 
          markdownContent={message.content} 
          timestamp={message.timestamp}
          attachments={message.attachments} 
        />
        {/* Render feedback for full reports too */}
        <div className="max-w-[90%] md:max-w-[80%] pl-2">
           {renderFeedbackButtons()}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[90%] md:max-w-[80%] rounded-2xl p-5 shadow-sm transition-colors relative group
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm text-slate-800 dark:text-slate-100'}
        `}
      >
        {/* Render content via Markdown Renderer */}
        <MarkdownRenderer content={message.content} isUser={isUser} />

        {/* Attachment Grid */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`mt-4 pt-4 border-t ${isUser ? 'border-white/20' : 'border-slate-100 dark:border-slate-700'}`}>
             <div className="flex flex-wrap gap-3">
                {message.attachments.map((att) => (
                   <AttachmentPreview key={att.id} attachment={att} />
                ))}
             </div>
          </div>
        )}

        <div className={`text-[10px] mt-2 opacity-70 flex items-center justify-between gap-4 ${isUser ? 'text-blue-50' : 'text-gray-400'}`}>
          <div className="flex items-center gap-2">
             <span>{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             {isUser && getStatusIcon()}
          </div>
        </div>
        
        {/* Feedback Controls for Model */}
        {isModel && renderFeedbackButtons()}
      </div>
    </div>
  );
};
