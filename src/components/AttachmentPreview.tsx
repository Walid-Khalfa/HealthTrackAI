
import React, { useState } from 'react';
import { Attachment, AttachmentType } from '../types';
import { Icons } from './Icons';

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
  
  const size = attachment.size || Math.ceil((attachment.data.length * 3) / 4);
  const formattedSize = formatFileSize(size);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRemove) return; 

    if (attachment.type === AttachmentType.Image) {
      setShowModal(true);
    } else if (attachment.type === AttachmentType.Pdf) {
      const url = getBlobUrl(attachment.data, attachment.mimeType);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (attachment.type === AttachmentType.Audio) {
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
            <Icons.FilePdf className="w-6 h-6" />
          </div>
        );
      case AttachmentType.Audio:
        return (
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center shrink-0 text-purple-500 dark:text-purple-400">
            <Icons.FileAudio className="w-6 h-6" />
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

        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(attachment.id); }}
            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-transform hover:scale-110 z-10"
            title="Remove attachment"
          >
            <Icons.Close className="w-3 h-3" />
          </button>
        )}
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <button 
            className="fixed top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
            aria-label="Close Preview"
          >
            <Icons.Close className="w-6 h-6" />
          </button>

          <div 
            className="relative max-w-5xl max-h-screen w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
              src={attachment.previewUrl || `data:${attachment.mimeType};base64,${attachment.data.replace(/^data:.*,/, '')}`} 
              alt={attachment.name}
              className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
            />
            <div className="mt-4 flex items-center gap-4 text-white/90">
              <span className="font-medium text-lg">{attachment.name}</span>
              <span className="text-white/40">|</span>
              <span className="text-sm text-white/60 font-mono">{formattedSize}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
