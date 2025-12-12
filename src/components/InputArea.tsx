
import React, { useState, useRef } from 'react';
import { Attachment, AttachmentType } from '../types';
import { Button } from './Button';
import { AttachmentPreview } from './AttachmentPreview';
import { getSecureUUID } from '../services/supabaseClient';
import { Icons } from './Icons';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[], title?: string, dueDate?: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Camera Controls State
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoom] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1 });
  const [isZoomSupported, setIsZoomSupported] = useState(false);
  
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
          let type: AttachmentType | undefined;

          if (file.type.startsWith('image')) {
            type = AttachmentType.Image;
          } else if (file.type === 'application/pdf') {
            type = AttachmentType.Pdf;
          } else if (file.type.startsWith('audio')) {
            type = AttachmentType.Audio;
          } else {
             // Basic fallback based on extension if mime type is missing/generic
             if (file.name.endsWith('.pdf')) type = AttachmentType.Pdf;
             else if (file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) type = AttachmentType.Audio;
             else if (file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) type = AttachmentType.Image;
          }

          if (type) {
            const newAtt: Attachment = {
              id: getSecureUUID(),
              type,
              mimeType: file.type || 'application/octet-stream',
              data: base64String, 
              name: file.name,
              size: file.size // Capture size
            };
            setAttachments(prev => [...prev, newAtt]);
          } else {
            console.warn("Unsupported file type:", file.type, file.name);
            alert(`File type not supported: ${file.name}`);
          }
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
      
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType }); 
        
        const reader = new FileReader();
        reader.onloadend = () => {
           const base64String = reader.result as string;
           
           let ext = 'webm';
           if (finalMimeType.includes('mp4') || finalMimeType.includes('aac')) ext = 'm4a';
           else if (finalMimeType.includes('ogg')) ext = 'ogg';
           else if (finalMimeType.includes('wav')) ext = 'wav';

           const newAtt: Attachment = {
             id: getSecureUUID(),
             type: AttachmentType.Audio,
             mimeType: finalMimeType,
             data: base64String,
             name: `Voice_Note.${ext}`,
             size: audioBlob.size
           };
           setAttachments(prev => [...prev, newAtt]);
        };
        reader.readAsDataURL(audioBlob);
        
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
  const startCamera = async (mode: 'user' | 'environment' = 'environment') => {
    setShowCamera(true);
    setFacingMode(mode);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check Zoom Support
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      
      if (capabilities.zoom) {
        setIsZoomSupported(true);
        setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max });
        setZoom(capabilities.zoom.min);
      } else {
        setIsZoomSupported(false);
      }

    } catch (err) {
      console.error("Error accessing camera", err);
      setShowCamera(false);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const toggleCameraMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(newMode);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      try {
        track.applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
      } catch (error) {
        console.warn('Zoom not supported:', error);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        if (facingMode === 'user') {
          context.translate(canvasRef.current.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(videoRef.current, 0, 0);
        
        if (facingMode === 'user') {
           context.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        const approxSize = Math.ceil((dataUrl.length * 3) / 4);

        const newAtt: Attachment = {
          id: getSecureUUID(),
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
    setZoom(1); 
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
      <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover transition-transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Top Controls: Flip */}
        <div className="absolute top-6 right-6 z-10">
           <button 
             onClick={toggleCameraMode}
             className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
             title="Flip Camera"
           >
             <Icons.FlipCamera className="w-6 h-6" />
           </button>
        </div>

        {/* Zoom Slider */}
        {isZoomSupported && (
          <div className="absolute bottom-32 w-64 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-3 border border-white/10">
             <span className="text-xs text-white font-medium min-w-[20px]">1x</span>
             <input 
               type="range" 
               min={zoomRange.min} 
               max={zoomRange.max} 
               step="0.1" 
               value={zoom} 
               onChange={handleZoomChange} 
               className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white" 
             />
             <span className="text-xs text-white font-medium min-w-[20px] text-right">{zoom.toFixed(1)}x</span>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-8 flex gap-12 items-center">
          <button 
            onClick={closeCamera}
            className="p-4 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 transition-colors backdrop-blur-sm border border-white/10"
            aria-label="Close camera"
          >
            <Icons.Close className="w-6 h-6" />
          </button>
          
          <button 
            onClick={capturePhoto}
            className="p-1 bg-transparent rounded-full border-4 border-white hover:scale-105 transition-transform"
            aria-label="Take photo"
          >
             <div className="w-16 h-16 bg-white rounded-full border-4 border-black/20" />
          </button>
          
          <div className="w-14 h-14" /> 
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors">
      {/* Attachments Preview */}
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
             <input 
               type="file" 
               multiple 
               accept="image/*,.pdf,audio/*" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
             />
             
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Upload files"
             >
                <Icons.Attach className="w-6 h-6" />
             </button>

             <button
                type="button"
                onClick={() => startCamera('environment')}
                className="p-2 text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Use Camera"
             >
                <Icons.Camera className="w-6 h-6" />
             </button>
             
             <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse' : 'text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                title="Record Audio"
             >
                <Icons.Mic className="w-6 h-6" />
             </button>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? "Recording... (Tap mic to stop)" : "Describe symptoms or ask anything..."}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 transition-colors"
            disabled={isLoading}
          />
          
          <Button 
            type="submit" 
            disabled={isLoading || (!text.trim() && attachments.length === 0) || isRecording}
            className="rounded-full !p-2"
          >
             {isLoading ? (
               <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             ) : (
               <Icons.Send className="w-6 h-6" />
             )}
          </Button>
        </div>
      </form>
    </div>
  );
};
