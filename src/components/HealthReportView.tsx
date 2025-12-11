
import React, { useState } from 'react';
import { parseHealthReport, ParsedReport } from '../utils/reportParser';
import { Logo } from './Logo';

interface HealthReportViewProps {
  markdownContent: string;
  timestamp: number;
}

declare var html2pdf: any;

export const HealthReportView: React.FC<HealthReportViewProps> = ({ markdownContent, timestamp }) => {
  const report: ParsedReport = parseHealthReport(markdownContent);
  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = () => {
    const element = document.getElementById(`report-${timestamp}`);
    const opt = {
      margin: [10, 10, 10, 10], 
      filename: `HealthTrackAI_Report_${new Date(timestamp).toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      const logoEl = document.getElementById(`report-logo-${timestamp}`);
      if(logoEl) { logoEl.classList.remove('hidden'); logoEl.classList.add('flex'); }
      element?.classList.add('pdf-print-mode');

      html2pdf().set(opt).from(element).save().then(() => {
         if(logoEl) { logoEl.classList.add('hidden'); logoEl.classList.remove('flex'); }
         element?.classList.remove('pdf-print-mode');
      });
    } else {
      alert("PDF Generator is initializing. Please try again in a moment.");
    }
  };

  const copyDoctorSummary = () => {
    navigator.clipboard.writeText(report.doctorSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskStyles = (risk: string) => {
    switch(risk) {
      case 'High': 
        return {
          bg: 'bg-red-50 dark:bg-red-900/10',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          badge: 'bg-red-600 text-white',
          barColor: 'bg-red-500'
        };
      case 'Medium': 
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/10',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          badge: 'bg-orange-500 text-white',
          barColor: 'bg-orange-500'
        };
      case 'Low': 
        return {
          bg: 'bg-green-50 dark:bg-green-900/10',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          badge: 'bg-green-600 text-white',
          barColor: 'bg-green-500'
        };
      default: 
         return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
          badge: 'bg-slate-500 text-white',
          barColor: 'bg-slate-500'
        };
    }
  };

  const riskStyles = getRiskStyles(report.riskLevel);

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
           <div className={`w-2.5 h-2.5 rounded-full ${riskStyles.barColor}`}></div>
           Analysis Ready
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export PDF
        </button>
      </div>

      {/* Main Report Container */}
      <div 
        id={`report-${timestamp}`} 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* PDF Header (Hidden usually) */}
        <div id={`report-logo-${timestamp}`} className="hidden items-center justify-between p-8 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3">
             <Logo className="w-12 h-12" />
             <div>
               <h1 className="text-2xl font-bold text-slate-900">HealthTrackAI</h1>
               <p className="text-sm text-slate-500">Multimodal Medical Analysis</p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-sm font-medium text-slate-700">{new Date(timestamp).toLocaleDateString()}</p>
             <p className="text-xs text-slate-400 font-mono">{timestamp}</p>
           </div>
        </div>

        {/* 1. Executive Summary Panel */}
        <div className={`p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 relative overflow-hidden ${riskStyles.bg}`}>
           {/* Decorative background accent */}
           <div className={`absolute top-0 left-0 w-2 h-full ${riskStyles.barColor}`}></div>
           
           <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-1">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Executive Summary</h2>
                 <p className={`text-lg md:text-xl font-medium leading-relaxed ${riskStyles.text}`}>
                   {report.executiveSummary}
                 </p>
              </div>
              
              {/* Risk Badge */}
              <div className="shrink-0">
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm min-w-[140px] text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Concern Level</span>
                    <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold ${riskStyles.badge}`}>
                      {report.riskLevel}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Red Flags Alert */}
        {report.redFlags.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 p-4 px-6 md:px-8">
             <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <div>
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">Potential Warning Signs</h3>
                  <ul className="list-disc pl-4 space-y-1">
                    {report.redFlags.map((flag, i) => (
                      <li key={i} className="text-sm font-medium text-red-800 dark:text-red-200 leading-snug">{flag}</li>
                    ))}
                  </ul>
                </div>
             </div>
          </div>
        )}

        {/* 3. Detailed Grid */}
        <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Clinical Data Breakdown</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text / History */}
              {report.detailedAnalysis.text && (
                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <h4 className="text-xs font-bold uppercase">Patient History</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.detailedAnalysis.text}</p>
                </div>
              )}

              {/* Visuals */}
              {report.detailedAnalysis.image && (
                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <h4 className="text-xs font-bold uppercase">Visual Findings</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.detailedAnalysis.image}</p>
                </div>
              )}

              {/* Audio */}
              {report.detailedAnalysis.audio && (
                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      <h4 className="text-xs font-bold uppercase">Audio Analysis</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.detailedAnalysis.audio}</p>
                </div>
              )}

              {/* Documents */}
              {report.detailedAnalysis.document && (
                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <h4 className="text-xs font-bold uppercase">Document Insights</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.detailedAnalysis.document}</p>
                </div>
              )}
           </div>
        </div>

        {/* 4. Logic & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
           
           {/* LEFT: Reasoning */}
           <div className="p-6 md:p-8 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Medical Reasoning</h3>
              
              <div className="space-y-6">
                 <div>
                   <span className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Key Observations</span>
                   <p className="text-sm text-slate-600 dark:text-slate-300">{report.reasoning.observations}</p>
                 </div>
                 
                 <div>
                   <span className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Potential Hypotheses</span>
                   <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">{report.reasoning.possibilities}</p>
                   </div>
                 </div>

                 {report.reasoning.limitations && (
                   <div className="text-xs text-slate-500 dark:text-slate-400">
                     <strong>Note:</strong> {report.reasoning.limitations}
                   </div>
                 )}
              </div>
           </div>

           {/* RIGHT: Action Plan */}
           <div className="p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/30">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Action Plan</h3>
              
              <ul className="space-y-3 mb-8">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 items-start">
                     <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">✓</div>
                     <span className="text-sm text-slate-700 dark:text-slate-200">{rec}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                 <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">Next Steps</h4>
                 <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                   {report.careAdvice}
                 </p>
              </div>
           </div>
        </div>

        {/* 5. Doctor Summary (Footer) */}
        <div className="bg-slate-100 dark:bg-slate-900 p-6 md:p-8 border-t border-slate-200 dark:border-slate-700">
           <div className="bg-white dark:bg-slate-800 border-l-4 border-slate-400 dark:border-slate-500 p-5 rounded-r-xl shadow-sm relative">
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                   <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Physician Handoff Note</h4>
                </div>
                <button 
                  onClick={copyDoctorSummary}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>Copy Note</>
                  )}
                </button>
              </div>
              
              <div className="font-mono text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {report.doctorSummary}
              </div>
           </div>
           
           <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                Generated by AI • Not a diagnosis • Verify with a professional
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};
