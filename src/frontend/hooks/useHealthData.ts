import { useEffect, useMemo, useState } from 'react';
import { HealthReport } from '@shared/types';
import { getAllHealthReports, getHealthReports } from '@backend/services/supabaseClient';
import { safeJsonParse, validateHealthReportList } from '@utils/security';

export const useHealthData = (user: any, isAdmin: boolean, isAdminMode: boolean) => {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    
    const CACHE_KEY = `healthtrackai_cached_reports_${user.id}`;

    try {
      setLoading(true);
      
      if (!navigator.onLine) {
        throw new Error("Device is offline");
      }

      let data: HealthReport[] = [];
      if (isAdmin && isAdminMode) {
        data = await getAllHealthReports('admin');
      } else {
        data = await getHealthReports(user.id);
      }
      
      setReports(data || []);
      setIsOfflineMode(false);

      if (!isAdminMode && data && data.length > 0) {
        try {
          const toCache = data.slice(0, 10); // Cache last 10
          localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        } catch (e) {
          console.warn("Failed to cache reports", e);
        }
      }

    } catch (err) {
      console.warn("Failed to load history from network, attempting cache...", err);
      
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = safeJsonParse<HealthReport[]>(cached, validateHealthReportList);
          
          if (parsed) {
            setReports(parsed);
            setIsOfflineMode(true);
          } else {
            localStorage.removeItem(CACHE_KEY);
            setReports([]);
          }
        } else {
          setReports([]);
        }
      } catch (cacheErr) {
        console.error("Cache system error", cacheErr);
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const handleOnline = () => fetchHistory();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, isAdmin, isAdminMode]);

  // Memoized Stats Calculation
  const stats = useMemo(() => {
    const total = reports.length;
    
    const typesData = [
      { name: 'Image', value: reports.filter(r => r.input_type?.toLowerCase().includes('image')).length, color: '#3b82f6' },
      { name: 'Audio', value: reports.filter(r => r.input_type?.toLowerCase().includes('audio')).length, color: '#22c55e' },
      { name: 'Text', value: reports.filter(r => r.input_type?.toLowerCase().includes('text') && !r.input_type.includes('image') && !r.input_type.includes('audio')).length, color: '#f59e0b' },
      { name: 'Doc', value: reports.filter(r => r.input_type?.toLowerCase().includes('document')).length, color: '#a855f7' },
    ].filter(d => d.value > 0);

    const risks = {
      High: reports.filter(r => (r.concern_override || r.preliminary_concern) === 'High').length,
      Medium: reports.filter(r => (r.concern_override || r.preliminary_concern) === 'Medium').length,
      Low: reports.filter(r => (r.concern_override || r.preliminary_concern) === 'Low').length,
    };

    let avgConcern = 'Low';
    if (risks.High > risks.Medium && risks.High > risks.Low) avgConcern = 'High';
    else if (risks.Medium > risks.Low) avgConcern = 'Medium';

    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      return { month: monthKey, count: 0, High: 0, Medium: 0, Low: 0 };
    }).reverse();

    reports.forEach(r => {
      const d = new Date(r.created_at);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      const found = last6Months.find(m => m.month === monthKey);
      if (found) {
        found.count++;
        const risk = r.concern_override || r.preliminary_concern || 'Medium';
        if (risk === 'High') found.High++;
        else if (risk === 'Medium') found.Medium++;
        else found.Low++;
      }
    });

    return { total, typesData, risks, avgConcern, timeline: last6Months };
  }, [reports]);

  return { reports, setReports, loading, isOfflineMode, stats };
};
