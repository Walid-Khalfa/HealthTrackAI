import { useState, useEffect } from 'react';
import { HealthReport, UserProfile } from '../../shared/types';
import { getHealthReports, getAllHealthReports } from '../../backend/services/supabaseClient';
import { useAuth } from '../context/AuthContext'; // Assuming useAuth is in ../context/AuthContext

interface UseReportDataProps {
  // Potentially accept filters or admin mode toggle if they affect the initial fetch
  // For now, isAdminMode is managed inside the hook as it's directly tied to fetching all reports
}

export const useReportData = (isAdminMode: boolean) => {
  const { user, profile, isAdmin } = useAuth();
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const fetchHistory = async () => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }
    
    // Unique cache key for this user
    const CACHE_KEY = `healthtrackai_cached_reports_${user.id}`;

    try {
      setLoading(true);
      
      if (!navigator.onLine) {
        throw new Error("Device is offline");
      }

      let data: HealthReport[] = [];
      if (isAdmin && isAdminMode) {
        data = await getAllHealthReports(profile?.role || '');
      } else {
        data = await getHealthReports(user.id);
      }
      
      setReports(data || []);
      setIsOfflineMode(false);

      if (!isAdminMode && data && data.length > 0) {
        try {
          const toCache = data.slice(0, 5);
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
          const parsed = JSON.parse(cached);
          setReports(parsed);
          setIsOfflineMode(true);
        } else {
          setReports([]);
        }
      } catch (cacheErr) {
        console.error("Cache parse error", cacheErr);
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
  }, [user, isAdmin, isAdminMode]); // Dependencies for refetching

  return { reports, loading, isOfflineMode, fetchHistory, setReports };
};
