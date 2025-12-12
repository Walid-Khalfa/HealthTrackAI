
import React, { useState, useRef } from 'react';
import { Attachment, AttachmentType } from '../../shared/types';
import { AttachmentPreview } from './AttachmentPreview';

interface SymptomFormProps {
  onSubmit: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

export const SymptomForm: React.FC<SymptomFormProps> = ({ onSubmit, isLoading }) => {
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // --- File Handling ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: AttachmentType) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newAtt: Attachment = {
            id: Date.now().toString() + Math.random(),
            type,
            mimeType: file.type,
            data: reader.result as string,
            name: file.name,
            size: file.size
          };
          setAttachments(prev => [...prev, newAtt]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // --- Audio Recording Logic ---

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
             name: `Voice_Note_${formatTime(recordingTime)}.mp3`,
             size: audioBlob.size
           };
           setAttachments(prev => [...prev, newAtt]);
           setRecordingTime(0);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start Timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Submission ---

  const handleSubmit = () => {
    if (!description && attachments.length === 0) return;
    onSubmit(description, attachments);
  };

  // --- UI Components ---

  const StepIndicator = ({ step, title }: { step: string; title: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-medical-100 dark:bg-medical-900 text-medical-600 dark:text-medical-300 font-bold text-sm border-2 border-white dark:border-slate-800 ring-2 ring-medical-50 dark:ring-medical-900/50">
        {step}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      
      {/* HEADER */}
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Non-diagnostic • Educational Only
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
          Start a New Health Analysis
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
          Describe your symptoms and optionally upload images, audio, or documents. Our AI will analyze the data to provide a preliminary, educational summary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Inputs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STEP 1: TEXT */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <StepIndicator step="1" title="Describe your main symptoms" />
              <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Recommended</span>
            </div>
            
            <div className="relative">
              <textarea
                className="w-full h-48 p-4 text-base border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent resize-none bg-gray-50 dark:bg-slate-700/50 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                placeholder="Example: I've had a persistent dry cough for 3 days, mild fever in the evenings, and fatigue. No chest pain. It started after a trip to..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="absolute bottom-4 right-4 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
                {description.length} chars
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Include duration, intensity, triggers, and any relevant history.
            </p>
          </section>

          {/* STEP 2: MULTIMEDIA */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
             <div className="flex justify-between items-center mb-6">
              <StepIndicator step="2" title="Add clinical evidence" />
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Image Card */}
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="group cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-medical-400 dark:hover:border-medical-500 hover:ring-1 hover:ring-medical-400 rounded-xl p-5 transition-all bg-gray-50 dark:bg-slate-700/30"
              >
                <div className="flex items-start justify-between mb-3">
                   <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Images</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Upload Visuals</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rashes, swelling, injuries (JPG/PNG)</p>
                <input type="file" ref={imageInputRef} multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, AttachmentType.Image)} />
              </div>

              {/* Document Card */}
              <div 
                onClick={() => docInputRef.current?.click()}
                className="group cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:ring-1 hover:ring-red-400 rounded-xl p-5 transition-all bg-gray-50 dark:bg-slate-700/30"
              >
                <div className="flex items-start justify-between mb-3">
                   <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   </div>
                   <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PDF</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Medical Reports</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lab results, prescriptions, notes</p>
                <input type="file" ref={docInputRef} multiple accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileChange(e, AttachmentType.Pdf)} />
              </div>

              {/* Audio Card (Full Width) */}
              <div className="md:col-span-2 border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-slate-700/30">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full">
                       <div className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900 dark:text-white mb-0.5">
                           {isRecording ? `Recording... ${formatTime(recordingTime)}` : "Record or Upload Audio"}
                         </h4>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Describe symptoms verbally or upload a file</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isRecording ? (
                         <button 
                           onClick={stopRecording}
                           className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                         >
                           Stop & Save
                         </button>
                      ) : (
                         <>
                           <button 
                             onClick={startRecording}
                             className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                           >
                             Record
                           </button>
                           <span className="text-gray-400 text-xs">OR</span>
                           <button 
                             onClick={() => audioInputRef.current?.click()}
                             className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                           >
                             Upload
                           </button>
                         </>
                      )}
                      <input type="file" ref={audioInputRef} accept="audio/*" className="hidden" onChange={(e) => handleFileChange(e, AttachmentType.Audio)} />
                    </div>
                 </div>
              </div>

            </div>
            
            {/* Attachments Preview - Styled using Grid */}
            {attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attached Files ({attachments.length})</h4>
                <div className="flex flex-wrap gap-3">
                  {attachments.map(att => (
                     <AttachmentPreview key={att.id} attachment={att} onRemove={removeAttachment} />
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN: Action & Safety */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            
            {/* Action Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Ready to Analyze?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Our AI will process your inputs to generate a safety assessment and preliminary insights.
              </p>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading || (!description && attachments.length === 0)}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isLoading || (!description && attachments.length === 0)
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-medical-600 to-teal-500 hover:from-medical-700 hover:to-teal-600 text-white hover:shadow-lg hover:shadow-medical-500/30'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>Generate Analysis</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
              
              {!description && attachments.length === 0 && (
                <p className="text-xs text-center text-red-500 mt-3 animate-pulse">
                  Please describe your symptoms or add a file first.
                </p>
              )}
            </div>

            {/* Safety Disclaimer */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
               <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-bold text-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span>Secure & Private</span>
               </div>
               <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed mb-4">
                 Your data is encrypted end-to-end. This tool is <strong>not a doctor</strong>. If you feel severe pain, confusion, or difficulty breathing, call emergency services immediately.
               </p>
               <div className="flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 System Operational
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
