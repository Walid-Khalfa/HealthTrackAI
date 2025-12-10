import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Attachment, AttachmentType } from '../types';
import { Button } from './Button';
import { AttachmentPreview } from './AttachmentPreview';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const type = file.type.startsWith('image') 
            ? AttachmentType.Image 
            : file.type === 'application/pdf' 
              ? AttachmentType.Pdf 
              : AttachmentType.Audio; // Fallback

          const newAtt: Attachment = {
            id: Date.now().toString() + Math.random(),
            type,
            mimeType: file.type,
            data: base64String, 
            name: file.name,
            size: file.size // Capture size
          };
          setAttachments(prev => [...prev, newAtt]);
        };
        
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); 
        const reader = new FileReader();
        reader.onloadend = () => {
           const base64String = reader.result as string;
           const newAtt: Attachment = {
             id: Date.now().toString(),
             type: AttachmentType.Audio,
             mimeType: audioBlob.type || 'audio/mp3',
             data: base64String,
             name: 'Voice_Note.mp3',
             size: audioBlob.size
           };
           setAttachments(prev => [...prev, newAtt]);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Camera Logic
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setShowCamera(false);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        // Calculate rough size from base64 (3/4 length)
        const approxSize = Math.ceil((dataUrl.length * 3) / 4);

        const newAtt: Attachment = {
          id: Date.now().toString(),
          type: AttachmentType.Image,
          mimeType: 'image/jpeg',
          data: dataUrl,
          name: `Camera_Capture_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
          size: approxSize
        };
        setAttachments(prev => [...prev, newAtt]);
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Submit
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((text.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(text, attachments);
      setText('');
      setAttachments([]);
    }
  };

  // Camera Modal
  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-8 flex gap-4">
          <button 
            onClick={closeCamera}
            className="p-4 bg-gray-800 text-white rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            onClick={capturePhoto}
            className="p-5 bg-white rounded-full border-4 border-gray-300 ring-2 ring-white"
          >
             <div className="w-6 h-6 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors">
      {/* Attachments Preview - Using our new flexible grid */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {attachments.map(att => (
            <AttachmentPreview 
              key={att.id} 
              attachment={att} 
              onRemove={(id) => setAttachments(prev => prev.filter(p => p.id !== id))} 
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <div className="flex gap-1">
             {/* File Input Hidden */}
             <input 
               type="file" 
               multiple 
               accept="image/*,.pdf,audio/*" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
             />
             
             {/* Attach Button */}
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Attach file"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
             </button>

             {/* Camera Button */}
             <button
                type="button"
                onClick={startCamera}
                className="p-2 text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Use Camera"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
             </button>
             
             {/* Mic Button */}
             <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse' : 'text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                title="Record Audio"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
             </button>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? "Recording..." : "Describe symptoms or ask anything..."}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
            disabled={isLoading || isRecording}
          />
          
          <Button 
            type="submit" 
            disabled={isLoading || (!text.trim() && attachments.length === 0) || isRecording}
            className="rounded-full !p-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
};