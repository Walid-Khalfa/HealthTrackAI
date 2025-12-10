
import React, { useState, useEffect, useMemo } from 'react';
import { HealthReport, HealthRiskLevel } from '../types';
import { getHealthReports, getAllHealthReports, updateReportDetails, deleteHealthReport } from '../services/supabaseClient';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from './RoleGuard';

interface DashboardProps {
  onViewDetails?: (report: HealthReport) => void;
  onNewAnalysis?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewDetails, onNewAnalysis }) => {
  const { user, profile, isAdmin } = useAuth();
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterConcern, setFilterConcern] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editConcern, setEditConcern] = useState<HealthRiskLevel>('Medium');
  const [isSaving, setIsSaving] = useState(false);

  // --- Data Fetching ---
  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (!user) return;
      let data: HealthReport[] = [];
      if (isAdmin && isAdminMode) {
        data = await getAllHealthReports();
      } else {
        data = await getHealthReports(user.id);
      }
      setReports(data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, isAdmin, isAdminMode]);

  // --- Stats Calculation (Memoized) ---
  const stats = useMemo(() => {
    const total = reports.length;
    
    // Type Distribution
    const types = {
      Image: reports.filter(r => r.input_type?.toLowerCase().includes('image')).length,
      Audio: reports.filter(r => r.input_type?.toLowerCase().includes('audio')).length,
      Text: reports.filter(r => r.input_type?.toLowerCase().includes('text') && !r.input_type.includes('image') && !r.input_type.includes('audio')).length,
      Doc: reports.filter(r => r.input_type?.toLowerCase().includes('document')).length,
    };

    // Risk Stats
    const risks = {
      High: reports.filter(r => (r.concern_override || r.preliminary_concern) === 'High').length,
      Medium: reports.filter(r => (r.concern_override || r.preliminary_concern) === 'Medium').length,
      Low: reports.filter(r => (r.concern_override || r.preliminary_concern) === 'Low').length,
    };

    // Determine Avg Concern
    let avgConcern = 'Low';
    if (risks.High > risks.Medium && risks.High > risks.Low) avgConcern = 'High';
    else if (risks.Medium > risks.Low) avgConcern = 'Medium';

    // Mock Monthly Data (Grouping by month)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      return { month: monthKey, count: 0, high: 0, med: 0, low: 0 };
    }).reverse();

    reports.forEach(r => {
      const d = new Date(r.created_at);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      const found = last6Months.find(m => m.month === monthKey);
      if (found) {
        found.count++;
        const risk = r.concern_override || r.preliminary_concern || 'Medium';
        if (risk === 'High') found.high++;
        else if (risk === 'Medium') found.med++;
        else found.low++;
      }
    });

    return { total, types, risks, avgConcern, timeline: last6Months };
  }, [reports]);

  // --- Handlers ---
  const handleOpenReport = (report: HealthReport) => {
    setSelectedReport(report);
    setIsEditMode(false);
    setDeleteConfirmation(false);
    setEditTitle(report.custom_title || '');
    setEditNotes(report.user_notes || '');
    setEditConcern(report.concern_override || report.preliminary_concern || 'Medium');
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
    setIsEditMode(false);
    setDeleteConfirmation(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedReport) return;
    setIsSaving(true);
    try {
      await updateReportDetails(selectedReport.id, {
        custom_title: editTitle,
        user_notes: editNotes,
        concern_override: editConcern
      });
      const updatedReport = { ...selectedReport, custom_title: editTitle, user_notes: editNotes, concern_override: editConcern };
      setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
      setSelectedReport(updatedReport);
      setIsEditMode(false);
    } catch (err) { alert("Failed to save changes."); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    setIsDeleting(true);
    try {
      await deleteHealthReport(selectedReport.id);
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      handleCloseModal();
    } catch (err) { alert("Failed to delete report."); } finally { setIsDeleting(false); }
  };

  // --- Filtering ---
  const filteredData = reports.filter(item => {
    const matchesSearch = (item.custom_title || item.input_summary || item.user_notes || item.ai_summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All Types' || item.input_type.toLowerCase().includes(filterType.toLowerCase().replace('all types', ''));
    const currentRisk = item.concern_override || item.preliminary_concern || 'Medium';
    const matchesConcern = filterConcern === 'All' || currentRisk === filterConcern;
    return matchesSearch && matchesType && matchesConcern;
  });

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, filterConcern]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Helper Components ---

  const getConcernBadge = (level: string) => {
    const l = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    const colors = {
      High: 'bg-red-500/10 text-red-500 border-red-500/20',
      Medium: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      Low: 'bg-green-500/10 text-green-500 border-green-500/20',
    } as any;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[l] || colors.Medium}`}>
        {l}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('image')) return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    if (type.includes('audio')) return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
    if (type.includes('document')) return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  };

  // --- SVG Charts Helpers ---
  const DonutChart = () => {
    const data = [
      { label: 'Image', value: stats.types.Image, color: '#3b82f6' }, // blue-500
      { label: 'Audio', value: stats.types.Audio, color: '#22c55e' }, // green-500
      { label: 'Text', value: stats.types.Text, color: '#f59e0b' }, // amber-500
      { label: 'Doc', value: stats.types.Doc, color: '#a855f7' }, // purple-500
    ].filter(d => d.value > 0);

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    if (total === 0) return (
      <div className="relative w-32 h-32 rounded-full border-4 border-gray-700 opacity-20 mx-auto flex items-center justify-center">
        <span className="text-xs">No Data</span>
      </div>
    );

    return (
      <div className="flex items-center gap-8 justify-center">
        <div className="relative w-40 h-40">
           <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
             {data.map((slice, i) => {
               const percent = slice.value / total;
               const dashArray = `${percent * 314} 314`; // 2 * pi * r (r=50) ~= 314
               const offset = cumulativePercent * 314;
               cumulativePercent += percent;
               return (
                 <circle
                   key={i}
                   cx="50" cy="50" r="40" // radius 40
                   fill="transparent"
                   stroke={slice.color}
                   strokeWidth="16"
                   strokeDasharray={dashArray}
                   strokeDashoffset={-offset}
                   className="transition-all duration-1000 ease-out"
                 />
               );
             })}
           </svg>
           {/* Center Text */}
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-sm font-bold text-gray-400">Total</span>
             <span className="text-2xl font-bold text-white">{total}</span>
           </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
           {data.map(d => (
             <div key={d.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-xs text-gray-400">{d.label} ({Math.round(d.value/total*100)}%)</span>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const BarChart = () => {
    const maxVal = Math.max(...stats.timeline.map(t => t.count), 1);
    
    return (
      <div className="h-48 flex items-end justify-between gap-2 pt-6">
        {stats.timeline.map((item, i) => {
          const height = (item.count / maxVal) * 100;
          return (
            <div key={i} className="flex flex-col items-center flex-1 group">
               {/* Tooltip */}
               <div className="opacity-0 group-hover:opacity-100 absolute -mt-8 bg-gray-800 text-xs text-white px-2 py-1 rounded pointer-events-none transition-opacity z-10 whitespace-nowrap border border-gray-700">
                  {item.month}: {item.high} High, {item.med} Med
               </div>
               
               {/* Stacked Bar */}
               <div className="w-full max-w-[24px] bg-gray-700/30 rounded-t-sm relative overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(height, 5)}%` }}>
                  {item.count > 0 && (
                    <>
                      <div style={{ height: `${(item.high / item.count) * 100}%` }} className="bg-red-500/80 w-full transition-all duration-500"></div>
                      <div style={{ height: `${(item.med / item.count) * 100}%` }} className="bg-orange-500/80 w-full transition-all duration-500"></div>
                      <div style={{ height: `${(item.low / item.count) * 100}%` }} className="bg-green-500/80 w-full transition-all duration-500"></div>
                    </>
                  )}
               </div>
               
               <span className="text-[10px] text-gray-500 mt-2">{item.month}</span>
            </div>
          )
        })}
        {/* Y-Axis Lines simulation */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-[10px] text-gray-600 px-1 pb-6 pt-6 -z-10 h-48">
           <div className="w-full border-t border-dashed border-gray-700/50"></div>
           <div className="w-full border-t border-dashed border-gray-700/50"></div>
           <div className="w-full border-t border-dashed border-gray-700/50"></div>
           <div className="w-full border-t border-dashed border-gray-700/50"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-200 font-sans overflow-hidden transition-colors">
      
      {/* Sidebar Filters */}
      <aside className="w-64 bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-gray-800 p-6 flex-shrink-0 hidden md:block overflow-y-auto transition-colors">
        <RoleGuard allowedRoles={['admin', 'super_admin']}>
           <div className="mb-8 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
             <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">VIEW MODE</span>
             </div>
             <div className="flex bg-gray-200 dark:bg-gray-900 rounded p-1">
                 <button onClick={() => setIsAdminMode(false)} className={`flex-1 py-1 text-xs rounded transition-colors ${!isAdminMode ? 'bg-white dark:bg-blue-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>My Data</button>
                 <button onClick={() => setIsAdminMode(true)} className={`flex-1 py-1 text-xs rounded transition-colors ${isAdminMode ? 'bg-white dark:bg-blue-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Admin</button>
             </div>
           </div>
        </RoleGuard>

        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Analysis Type</h3>
          <div className="space-y-2">
            {['All Types', 'Image', 'Audio', 'Text', 'Document'].map(opt => (
              <div key={opt} onClick={() => setFilterType(opt)} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filterType === opt ? 'border-blue-500' : 'border-gray-600 group-hover:border-gray-500'}`}>
                  {filterType === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={`text-sm ${filterType === opt ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Concern Level</h3>
          <div className="space-y-2">
            {['All', 'Low', 'Medium', 'High'].map(opt => (
               <div key={opt} onClick={() => setFilterConcern(opt)} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filterConcern === opt ? 'border-blue-500' : 'border-gray-600 group-hover:border-gray-500'}`}>
                  {filterConcern === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={`text-sm ${filterConcern === opt ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="secondary" onClick={() => { setFilterType('All Types'); setFilterConcern('All'); setSearchQuery(''); }} className="w-full text-sm">
          Clear Filters
        </Button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Analysis History</h1>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, notes, or AI summary..."
              className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8">
          
          {/* ANALYTICS CARDS (Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Total */}
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /></svg>
               </div>
               <p className="text-sm text-gray-500 font-medium">Total Reports</p>
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h2>
               <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mt-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
            </div>

            {/* Card 2: Avg Concern */}
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
               <p className="text-sm text-gray-500 font-medium">Avg. Concern Level</p>
               <h2 className={`text-3xl font-bold mt-1 ${stats.avgConcern === 'High' ? 'text-red-500' : stats.avgConcern === 'Medium' ? 'text-orange-500' : 'text-green-500'}`}>{stats.avgConcern}</h2>
               <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mt-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
            </div>

             {/* Card 3: Types breakdown (Mini text) */}
             <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
               <p className="text-sm text-gray-500 font-medium mb-3">Analysis Types Breakdown</p>
               <div className="flex justify-between items-end">
                  <div className="text-center">
                    <span className="block text-xs text-gray-400">Image</span>
                    <span className="text-lg font-bold text-white">{stats.types.Image}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400">Audio</span>
                    <span className="text-lg font-bold text-white">{stats.types.Audio}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400">Text</span>
                    <span className="text-lg font-bold text-white">{stats.types.Text}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400">Doc</span>
                    <span className="text-lg font-bold text-white">{stats.types.Doc}</span>
                  </div>
               </div>
            </div>
            
            {/* Card 4: Recent Trend */}
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
               <div>
                 <p className="text-sm text-gray-500 font-medium">Last 30 Days</p>
                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                   {stats.timeline[stats.timeline.length-1]?.count || 0} <span className="text-lg font-normal text-gray-500">Analyses</span>
                 </h2>
               </div>
               <div className="h-10 w-full flex items-end gap-1 mt-2">
                 {/* Mini Sparkline simulation */}
                  <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
                    <path 
                      d="M0 20 C20 20, 20 5, 40 10 S 60 15, 80 5 S 100 0, 100 0" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="2"
                    />
                  </svg>
               </div>
            </div>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
             {/* Left: Donut Chart */}
             <div className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm lg:col-span-1">
                <h3 className="text-lg font-bold text-white mb-6">Analysis Distribution by Type</h3>
                <DonutChart />
             </div>
             
             {/* Right: Bar/Line Chart */}
             <div className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm lg:col-span-2 relative">
                <h3 className="text-lg font-bold text-white mb-2">Analysis Timeline & Concern Levels</h3>
                <div className="flex items-center gap-4 mb-4">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-xs text-gray-400">Low</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-xs text-gray-400">Medium</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-xs text-gray-400">High</span></div>
                </div>
                <BarChart />
             </div>
          </div>

          {/* REPORT LIST TABLE */}
          {loading ? (
             <div className="flex justify-center items-center h-32 text-gray-500">Loading history...</div>
          ) : paginatedData.length > 0 ? (
            <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1c2128]">
                    <th className="p-4 pl-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Title / Summary</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Concern</th>
                    <th className="p-4 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedData.map((row) => (
                    <tr 
                      key={row.id} 
                      onClick={() => handleOpenReport(row)}
                      className="group hover:bg-gray-50 dark:hover:bg-[#1c2128]/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4 pl-6 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-gray-200 truncate max-w-xs">
                          {row.custom_title || row.input_summary || row.input_text || "Untitled Analysis"}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-500 flex items-center gap-2">
                         {getTypeIcon(row.input_type)}
                         <span className="capitalize">{row.input_type}</span>
                      </td>
                      <td className="p-4">
                        {getConcernBadge(row.concern_override || row.preliminary_concern || 'Medium')}
                      </td>
                      <td className="p-4 pr-6 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onViewDetails?.(row); }}
                              className="text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                              View
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenReport(row); setIsEditMode(true); }}
                              className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenReport(row); setDeleteConfirmation(true); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-2xl bg-[#161b22]/50">
               <div className="w-16 h-16 mb-4 text-gray-600">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No reports found.</h3>
              <p className="text-gray-500 mb-6 text-center max-w-sm">Get started by creating your first health analysis.</p>
              <button onClick={onNewAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">Start Analysis</button>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-[#161b22] border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#0d1117]">
                 <h3 className="text-lg font-bold text-white">
                   {deleteConfirmation ? 'Delete Analysis?' : isEditMode ? 'Edit Details' : 'Analysis Details'}
                 </h3>
                 <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              {/* Body */}
              <div className="p-6 overflow-y-auto">
                 {deleteConfirmation ? (
                    <div className="text-center sm:text-left">
                       <p className="text-gray-300 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
                       <div className="flex justify-end gap-3">
                          <Button variant="secondary" onClick={() => setDeleteConfirmation(false)}>Cancel</Button>
                          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</Button>
                       </div>
                    </div>
                 ) : isEditMode ? (
                    <div className="space-y-4">
                       <div><label className="block text-xs font-medium text-gray-400 mb-1">Custom Title</label><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" /></div>
                       <div><label className="block text-xs font-medium text-gray-400 mb-1">Notes</label><textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" /></div>
                       <div><label className="block text-xs font-medium text-gray-400 mb-1">Concern Override</label><select value={editConcern} onChange={e => setEditConcern(e.target.value as HealthRiskLevel)} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                       <div className="pt-4 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsEditMode(false)}>Cancel</Button><Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button></div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <div className="flex justify-between items-start">
                          <div><h2 className="text-xl font-bold text-white mb-1">{selectedReport.custom_title || selectedReport.input_summary || "Untitled"}</h2><p className="text-sm text-gray-500">{new Date(selectedReport.created_at).toLocaleString()}</p></div>
                          <div className="text-right"><div className="mb-1">{getConcernBadge(selectedReport.concern_override || selectedReport.preliminary_concern || 'Medium')}</div><span className="text-xs text-gray-500 capitalize bg-gray-800 px-2 py-0.5 rounded">{selectedReport.input_type}</span></div>
                       </div>
                       {selectedReport.user_notes && <div className="bg-yellow-900/20 border border-yellow-800/50 p-4 rounded-lg"><span className="text-xs font-bold text-yellow-500 uppercase block mb-1">Notes</span><p className="text-sm text-gray-300">{selectedReport.user_notes}</p></div>}
                       <div><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AI Summary</h4><p className="text-gray-300 text-sm leading-relaxed">{selectedReport.ai_summary}</p></div>
                       <div className="pt-4 border-t border-gray-700 flex gap-3"><Button className="w-full" onClick={() => onViewDetails?.(selectedReport)}>Open Full Chat</Button><Button variant="secondary" onClick={() => setIsEditMode(true)}>Edit</Button></div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
