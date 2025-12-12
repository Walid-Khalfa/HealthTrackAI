
import React, { useState, useEffect, useRef } from 'react';
import { HealthReport, HealthRiskLevel } from '../types';
import { updateReportDetails, deleteHealthReport } from '../services/supabaseClient';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from './RoleGuard';
import { HealthReportView } from './HealthReportView';
import { Icons } from './Icons';
import { useHealthData } from '../hooks/useHealthData';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onViewDetails?: (report: HealthReport) => void;
  onNewAnalysis?: () => void;
}

// Notification Banner
const NotificationBanner = ({ type, message, onClose }: { type: 'success' | 'error', message: string, onClose: () => void }) => (
  <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in-down ${
    type === 'success' 
      ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/80 dark:text-green-100 dark:border-green-800' 
      : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/80 dark:text-red-100 dark:border-red-800'
  }`}>
    {type === 'success' ? <Icons.Check className="w-5 h-5" /> : <Icons.Close className="w-5 h-5" />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70"><Icons.Close className="w-4 h-4" /></button>
  </div>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const title = label || (payload[0] && payload[0].name);
    return (
      <div className="bg-white dark:bg-slate-800 p-3 px-4 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl text-xs z-50 min-w-[150px]">
        <p className="font-bold text-gray-800 dark:text-gray-100 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">{title}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.payload.fill }} />
                <span className="text-gray-500 dark:text-gray-400 capitalize font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ onViewDetails, onNewAnalysis }) => {
  const { user, isAdmin } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Use Custom Hook for Logic
  const { reports, setReports, loading, isOfflineMode, stats } = useHealthData(user, isAdmin, isAdminMode);

  // Local State
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterConcern, setFilterConcern] = useState('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editConcern, setEditConcern] = useState<HealthRiskLevel>('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const savedSearches = localStorage.getItem('ht_recent_searches');
    if (savedSearches) {
      try { setRecentSearches(JSON.parse(savedSearches)); } catch (e) { console.error(e); }
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem('ht_recent_searches', JSON.stringify(newSearches));
  };

  const handleOpenReport = (report: HealthReport) => {
    setSelectedReport(report);
    setIsEditMode(false);
    setDeleteConfirmation(false);
    setEditTitle(report.custom_title || '');
    setEditNotes(report.user_notes || '');
    setEditConcern(report.concern_override || report.preliminary_concern || 'Medium');
    setEditDueDate(report.due_date || '');
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
    setIsEditMode(false);
    setDeleteConfirmation(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedReport) return;
    if (isOfflineMode) { showNotification('error', "Offline: Cannot save changes."); return; }
    setIsSaving(true);
    try {
      await updateReportDetails(selectedReport.id, {
        custom_title: editTitle, user_notes: editNotes, concern_override: editConcern, due_date: editDueDate || undefined
      });
      const updated = { ...selectedReport, custom_title: editTitle, user_notes: editNotes, concern_override: editConcern, due_date: editDueDate };
      setReports(prev => prev.map(r => r.id === selectedReport.id ? updated : r));
      setSelectedReport(updated);
      setIsEditMode(false);
      showNotification('success', "Changes saved.");
    } catch (err: any) { showNotification('error', err.message || "Failed to save."); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    if (isOfflineMode) { showNotification('error', "Offline: Cannot delete."); return; }
    setIsDeleting(true);
    try {
      await deleteHealthReport(selectedReport.id);
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      handleCloseModal();
      showNotification('success', "Report deleted.");
    } catch (err: any) { showNotification('error', err.message || "Failed to delete."); } finally { setIsDeleting(false); }
  };

  const filteredData = reports.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (item.custom_title && item.custom_title.toLowerCase().includes(query)) ||
      (item.input_summary && item.input_summary.toLowerCase().includes(query)) ||
      (item.user_notes && item.user_notes.toLowerCase().includes(query)) ||
      (item.ai_summary && item.ai_summary.toLowerCase().includes(query));
    const matchesType = filterType === 'All Types' || item.input_type.toLowerCase().includes(filterType.toLowerCase().replace('all types', ''));
    const currentRisk = item.concern_override || item.preliminary_concern || 'Medium';
    const matchesConcern = filterConcern === 'All' || currentRisk === filterConcern;
    return matchesSearch && matchesType && matchesConcern;
  });

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, filterConcern]);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getConcernBadge = (level: string) => {
    const l = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    const colors: any = {
      High: 'bg-red-500/10 text-red-500 border-red-500/20',
      Medium: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      Low: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[l] || colors.Medium}`}>{l}</span>;
  };

  const getDueDateBadge = (dateStr?: string) => {
    if (!dateStr) return <span className="text-gray-400 text-xs">-</span>;
    const d = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
    const isPast = d < today; const isToday = d.getTime() === today.getTime();
    let cls = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    if (isPast) cls = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold';
    else if (isToday) cls = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-bold';
    else cls = 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    return <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${cls}`}>{new Date(dateStr).toLocaleDateString()}</span>;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-200 font-sans overflow-hidden transition-colors relative">
      {notification && <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

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
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filterType === opt ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'}`}>
                  {filterType === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={`text-sm ${filterType === opt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Concern Level</h3>
          <div className="space-y-2">
            {['All', 'Low', 'Medium', 'High'].map(opt => (
               <div key={opt} onClick={() => setFilterConcern(opt)} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filterConcern === opt ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'}`}>
                  {filterConcern === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={`text-sm ${filterConcern === opt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="secondary" onClick={() => { setFilterType('All Types'); setFilterConcern('All'); setSearchQuery(''); }} className="w-full text-sm">Clear Filters</Button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-6 md:p-8 pb-4">
          {isOfflineMode && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-xl flex items-center gap-3 text-yellow-800 dark:text-yellow-200 shadow-sm animate-fade-in">
               <div className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg"><Icons.Offline className="w-5 h-5" /></div>
               <div><p className="font-bold text-sm">You are currently offline</p><p className="text-xs opacity-90">Showing cached reports. Editing disabled.</p></div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Analysis History</h1>
            <Button onClick={onNewAnalysis} className="flex items-center gap-2"><Icons.NewAnalysis className="w-5 h-5" /> New Analysis</Button>
          </div>

          <div className="relative" ref={searchContainerRef}>
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') { saveRecentSearch(searchQuery); setShowSuggestions(false); } }}
              placeholder="Search by title, notes, or AI summary..."
              className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 pl-12 pr-10 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Icons.Close className="w-4 h-4" /></button>}
            {showSuggestions && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1c2128] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-down">
                 <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-[#0d1117] flex justify-between items-center border-b border-gray-100 dark:border-gray-800"><span>Recent Searches</span><button onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.removeItem('ht_recent_searches'); }} className="hover:text-red-500 transition-colors">Clear History</button></div>
                 {recentSearches.map(term => (<button key={term} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0" onClick={() => { setSearchQuery(term); setShowSuggestions(false); }}><Icons.Search className="w-4 h-4 text-gray-400 shrink-0" /><span className="truncate">{term}</span></button>))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icons.Dashboard className="w-16 h-16 text-blue-500" /></div>
               <p className="text-sm text-gray-500 font-medium">Total Reports</p>
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h2>
            </div>
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
               <p className="text-sm text-gray-500 font-medium">Avg. Concern Level</p>
               <h2 className={`text-3xl font-bold mt-1 ${stats.avgConcern === 'High' ? 'text-red-500' : stats.avgConcern === 'Medium' ? 'text-orange-500' : 'text-green-500'}`}>{stats.avgConcern}</h2>
            </div>
             <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
               <p className="text-sm text-gray-500 font-medium mb-3">Analysis Types Breakdown</p>
               <div className="flex justify-between items-end">
                  {stats.typesData.map(t => (
                    <div key={t.name} className="text-center"><span className="block text-xs text-gray-400">{t.name}</span><span className="text-lg font-bold text-gray-900 dark:text-white">{t.value}</span></div>
                  ))}
               </div>
            </div>
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
               <div><p className="text-sm text-gray-500 font-medium">Last 30 Days</p><h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.timeline[stats.timeline.length-1]?.count || 0} <span className="text-lg font-normal text-gray-500">Analyses</span></h2></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
             <div className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm lg:col-span-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Analysis Distribution by Type</h3>
                <div className="flex-1 min-h-[200px] flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={stats.typesData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {stats.typesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm lg:col-span-2 relative flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Analysis Timeline & Concern Levels</h3>
                <div className="flex-1 min-h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.timeline} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#71717a', opacity: 0.1 }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="Low" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Medium" stackId="a" fill="#f97316" />
                      <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

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
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow Up</th>
                    <th className="p-4 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedData.map((row) => (
                    <tr key={row.id} onClick={() => handleOpenReport(row)} className="group hover:bg-gray-50 dark:hover:bg-[#1c2128]/50 transition-colors cursor-pointer">
                      <td className="p-4 pl-6 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="p-4"><div className="font-bold text-gray-900 dark:text-gray-200 truncate max-w-xs">{row.custom_title || row.input_summary || row.input_text || "Untitled Analysis"}</div></td>
                      <td className="p-4 text-sm text-gray-500 flex items-center gap-2"><span className="capitalize">{row.input_type}</span></td>
                      <td className="p-4">{getConcernBadge(row.concern_override || row.preliminary_concern || 'Medium')}</td>
                      <td className="p-4">{getDueDateBadge(row.due_date)}</td>
                      <td className="p-4 pr-6 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onViewDetails?.(row); }} className="text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium">View</button>
                            <button onClick={(e) => { e.stopPropagation(); handleOpenReport(row); setIsEditMode(true); }} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors" disabled={isOfflineMode}><Icons.Edit className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleOpenReport(row); setDeleteConfirmation(true); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-700 transition-colors" disabled={isOfflineMode}><Icons.Delete className="w-4 h-4" /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-2xl bg-[#161b22]/50">
              <h3 className="text-xl font-medium text-white mb-2">No reports found.</h3>
              <p className="text-gray-500 mb-6 text-center max-w-sm">Get started by creating your first health analysis.</p>
              <button onClick={onNewAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">Start Analysis</button>
            </div>
          )}
        </div>
      </main>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#0d1117]">
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{deleteConfirmation ? 'Delete Analysis?' : isEditMode ? 'Edit Details' : 'Analysis Report'}</h3>
                   {!deleteConfirmation && !isEditMode && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generated on {new Date(selectedReport.created_at).toLocaleDateString()}</p>}
                 </div>
                 <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Icons.Close className="w-6 h-6" /></button>
              </div>
              <div className="p-0 overflow-y-auto bg-gray-50 dark:bg-[#0d1117]">
                 {deleteConfirmation ? (
                    <div className="p-6 text-center sm:text-left">
                       <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
                       <div className="flex justify-end gap-3">
                          <Button variant="secondary" onClick={() => setDeleteConfirmation(false)}>Cancel</Button>
                          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</Button>
                       </div>
                    </div>
                 ) : isEditMode ? (
                    <div className="p-6 space-y-4">
                       <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Custom Title</label><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" /></div>
                       <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label><input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" /></div>
                       <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label><textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" /></div>
                       <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Concern Override</label><select value={editConcern} onChange={e => setEditConcern(e.target.value as HealthRiskLevel)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                       <div className="pt-4 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsEditMode(false)}>Cancel</Button><Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button></div>
                    </div>
                 ) : (
                    <div>
                       {(() => {
                         const reconstructedMarkdown = selectedReport.meta?.full_response || `### 1. Executive Summary\n${selectedReport.ai_summary}\n\n### 2. Detailed Analysis\n${selectedReport.ai_details || 'No details.'}\n\n### 4. Recommendations\n${selectedReport.ai_recommendations || 'No recommendations.'}`;
                         return (
                           <div className="pb-6">
                             <HealthReportView markdownContent={reconstructedMarkdown} timestamp={new Date(selectedReport.created_at).getTime()} />
                             <div className="px-6 md:px-8 mt-4">
                               {selectedReport.user_notes && <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-4 rounded-lg mb-6"><span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase block mb-1">Notes</span><p className="text-sm text-yellow-800 dark:text-gray-300">{selectedReport.user_notes}</p></div>}
                               {selectedReport.due_date && <div className="flex items-center gap-2 mb-6"><span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Follow Up Due:</span>{getDueDateBadge(selectedReport.due_date)}</div>}
                               <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                                 {!isOfflineMode && <><Button variant="secondary" onClick={() => setIsEditMode(true)}>Edit Details</Button><Button variant="danger" onClick={() => setDeleteConfirmation(true)}>Delete</Button></>}
                                 <Button onClick={() => onViewDetails?.(selectedReport)}>Open in Chat</Button>
                               </div>
                             </div>
                           </div>
                         );
                       })()}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
