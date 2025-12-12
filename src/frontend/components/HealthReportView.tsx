

import React from 'react';
import { parseHealthReport, ParsedReport } from '../../shared/utils/reportParser';
import { Logo } from './Logo';

interface HealthReportViewProps {
  markdownContent: string;
  timestamp: number;
}

export const HealthReportView: React.FC<HealthReportViewProps> = ({ markdownContent, timestamp }) => {
  const report: ParsedReport = parseHealthReport(markdownContent);

  const handleDownloadPDF = () => {
    // Graceful fallback to the browser's print functionality, which is more reliable
    // and avoids Content Security Policy (CSP) issues with external scripts.
    const logoEl = document.getElementById(`report-logo-${timestamp}`);
    const reportEl = document.getElementById(`report-${timestamp}`);

    // Temporarily apply print-specific styles
    document.body.classList.add('print-mode');
    if (logoEl) logoEl.classList.replace('hidden', 'flex');
    if (reportEl) reportEl.classList.add('print-styles');

    // Trigger the print dialog
    window.print();

    // Clean up styles after printing
    document.body.classList.remove('print-mode');
    if (logoEl) logoEl.classList.replace('flex', 'hidden');
    if (reportEl) reportEl.classList.remove('print-styles');
  };

  const getRiskStyles = (risk: string) => {
    switch(risk) {
      case 'High': 
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: (
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'Medium': 
      // Treat Medium as the standard "Elevated" concern
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          icon: (
            <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'Low': 
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: (
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default: 
        // Fallback for unexpected values, acts like Medium/Neutral to ensure visibility
         return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          icon: (
            <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const riskStyles = getRiskStyles(report.riskLevel);

  return (
    <div className="w-full flex flex-col gap-4 font-sans">
      
      {/* Header / Actions */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           <span className="font-medium">AI Health Analysis</span>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-medical-600 hover:bg-medical-700 rounded-lg shadow transition-all hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </button>
      </div>

      {/* Main Report Card (PDF Target) */}
      <div 
        id={`report-${timestamp}`} 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* PDF-Only Logo Header */}
        <div id={`report-logo-${timestamp}`} className="hidden items-center justify-between p-8 border-b border-gray-200 bg-slate-50">
           <div className="flex items-center gap-3">
             <Logo className="w-10 h-10" />
             <div>
               <h1 className="text-2xl font-bold text-gray-900">HealthTrackAI</h1>
               <p className="text-sm text-gray-500">Intelligent Medical Assistant Analysis</p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-sm font-medium text-gray-600">Date: {new Date(timestamp).toLocaleDateString()}</p>
             <p className="text-xs text-gray-400">ID: {timestamp}</p>
           </div>
        </div>

        {/* 1. Executive Summary & Risk Gauge */}
        <div className={`p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 ${riskStyles.bg}`}>
           <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                 <h2 className={`text-xs font-bold uppercase tracking-widest mb-2 ${riskStyles.text}`}>Executive Summary</h2>
                 <p className="text-lg md:text-xl font-medium text-gray-900 dark:text-white leading-relaxed">
                   {report.executiveSummary}
                 </p>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm min-w-[140px]">
                 {riskStyles.icon}
                 <span className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-wider">Concern Level</span>
                 <span className={`text-lg font-extrabold ${riskStyles.text}`}>{report.riskLevel}</span>
              </div>
           </div>
        </div>

        {/* 2. Red Flags (Critical) */}
        {report.redFlags.length > 0 && (
          <div className="p-6 md:p-8 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-gray-700">
             <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-700 dark:text-red-400 uppercase mb-2">Potential Warning Signs</h3>
                  <ul className="space-y-2">
                    {report.redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-red-800 dark:text-red-200 text-sm font-medium">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2">
           {/* LEFT COLUMN */}
           <div className="p-6 md:p-8 border-r border-gray-100 dark:border-gray-700 space-y-8">
              
              {/* Detailed Findings */}
              <section>
                 <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                   <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs">1</span>
                   Detailed Analysis
                 </h3>
                 <div className="space-y-3">
                   {report.detailedAnalysis.text && (
                     <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                       <strong className="block text-xs uppercase text-gray-500 mb-1">Reported Symptoms</strong>
                       {report.detailedAnalysis.text}
                     </div>
                   )}
                   {report.detailedAnalysis.image && (
                     <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                       <strong className="block text-xs uppercase text-blue-600 dark:text-blue-400 mb-1">Visual Analysis</strong>
                       {report.detailedAnalysis.image}
                     </div>
                   )}
                   {report.detailedAnalysis.audio && (
                     <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                       <strong className="block text-xs uppercase text-purple-600 dark:text-purple-400 mb-1">Audio Findings</strong>
                       {report.detailedAnalysis.audio}
                     </div>
                   )}
                   {report.detailedAnalysis.document && (
                     <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                       <strong className="block text-xs uppercase text-amber-600 dark:text-amber-400 mb-1">Document Insights</strong>
                       {report.detailedAnalysis.document}
                     </div>
                   )}
                 </div>
              </section>

              {/* Reasoning */}
              <section>
                 <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                   <span className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs">2</span>
                   Medical Reasoning
                 </h3>
                 <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1">Key Observations:</span>
                      <p>{report.reasoning.observations}</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1">Possibilities:</span>
                      <p>{report.reasoning.possibilities}</p>
                    </div>
                 </div>
              </section>

           </div>

           {/* RIGHT COLUMN */}
           <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-slate-800/50 space-y-8">
              
              {/* Recommendations */}
              <section>
                 <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                   <span className="w-6 h-6 rounded bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">3</span>
                   Action Plan
                 </h3>
                 <ul className="space-y-3">
                   {report.recommendations.map((rec, i) => (
                     <li key={i} className="flex gap-3 items-start bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                        <div className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                        <span className="text-sm text-gray-700 dark:text-gray-200">{rec}</span>
                     </li>
                   ))}
                 </ul>
              </section>

              {/* Next Steps */}
              <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                 <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">When to seek care</h4>
                 <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                   {report.careAdvice}
                 </p>
              </section>

              {/* Doctor Summary (Cut-out) */}
              <section className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 bg-white dark:bg-slate-800">
                 <div className="flex justify-between items-center mb-3">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Physician Summary</h4>
                   <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                   "{report.doctorSummary}"
                 </p>
              </section>

           </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-100 dark:bg-slate-900 p-4 text-center border-t border-gray-200 dark:border-gray-800">
           <p className="text-[10px] text-gray-500 uppercase tracking-wide">
             Generated by HealthTrackAI • Educational Use Only • Not a Diagnosis
           </p>
        </div>
      </div>

    </div>
  );
};