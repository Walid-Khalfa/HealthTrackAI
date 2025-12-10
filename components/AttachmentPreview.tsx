
import React, { useState } from 'react';
import { Attachment, AttachmentType } from '../types';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: (id: string) => void;
}

// Helper to format bytes
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || isNaN(bytes)) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper to convert Base64 to Blob URL for previewing
const getBlobUrl = (base64Data: string, mimeType: string) => {
  try {
    const byteCharacters = atob(base64Data.replace(/^data:.*,/, ''));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error creating blob", e);
    return '';
  }
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onRemove }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Calculate size if not provided (approximate from base64)
  const size = attachment.size || Math.ceil((attachment.data.length * 3) / 4);
  const formattedSize = formatFileSize(size);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRemove) return; // Don't trigger preview if we are in "edit/remove" mode (e.g. input area)

    if (attachment.type === AttachmentType.Image) {
      setShowModal(true);
    } else if (attachment.type === AttachmentType.Pdf) {
      const url = getBlobUrl(attachment.data, attachment.mimeType);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (attachment.type === AttachmentType.Audio) {
      // For audio, we can either open in new tab or just play. 
      // Since specific UI wasn't requested for player, new tab is safest for compatibility.
      const url = getBlobUrl(attachment.data, attachment.mimeType);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderIcon = () => {
    switch (attachment.type) {
      case AttachmentType.Image:
        return (
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
             <img 
               src={attachment.previewUrl || `data:${attachment.mimeType};base64,${attachment.data.replace(/^data:.*,/, '')}`} 
               alt={attachment.name} 
               className="h-full w-full object-cover"
             />
          </div>
        );
      case AttachmentType.Pdf:
        return (
          <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center shrink-0 text-red-500 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case AttachmentType.Audio:
        return (
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center shrink-0 text-purple-500 dark:text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return <div className="h-10 w-10 bg-gray-200 rounded-lg" />;
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className={`
          group relative flex items-center gap-3 p-2 pr-4
          bg-white dark:bg-slate-800 
          border border-gray-200 dark:border-gray-700 
          rounded-xl shadow-sm hover:shadow-md 
          transition-all duration-200 cursor-pointer
          max-w-[240px] sm:max-w-[280px]
          ${onRemove ? 'hover:border-red-300 dark:hover:border-red-800' : 'hover:border-medical-300 dark:hover:border-medical-600'}
        `}
      >
        {renderIcon()}
        
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={attachment.name || 'Untitled'}>
            {attachment.name || 'Untitled File'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {attachment.type === AttachmentType.Pdf ? 'Document' : attachment.type}
            </span>
            <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              {formattedSize}
            </span>
          </div>
        </div>

        {/* Remove Button (if applicable) */}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(attachment.id); }}
            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-transform hover:scale-110 z-10"
            title="Remove attachment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Image Preview Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-5xl max-h-screen w-full flex flex-col items-center">
            <img 
              src={attachment.previewUrl || `data:${attachment.mimeType};base64,${attachment.data.replace(/^data:.*,/, '')}`} 
              alt="Full preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="mt-4 flex items-center gap-4 text-white">
              <span className="font-medium text-lg">{attachment.name}</span>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-300">{formattedSize}</span>
            </div>
            <button 
              className="absolute top-4 right-4 md:-top-12 md:-right-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              onClick={() => setShowModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
