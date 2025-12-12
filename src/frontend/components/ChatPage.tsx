import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { InputArea } from './InputArea';
import { Message, Attachment } from '../../../shared/types';

interface ChatPageProps {
  messages: Message[];
  isLoading: boolean;
  handleSendMessage: (text: string, attachments: Attachment[]) => Promise<void>;
}

export const ChatPage: React.FC<ChatPageProps> = ({ messages, isLoading, handleSendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
               <p>No messages yet.</p>
            </div>
          ) : (
            messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
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
  );
};
