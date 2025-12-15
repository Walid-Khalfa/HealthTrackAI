import { useEffect, useState } from 'react';
import { HealthReport } from '@shared/types';
import { getAllHealthReports, getHealthReports } from '@backend/services/supabaseClient';
import { useAuth } from '@frontend/context/AuthContext';

export const useReportData = (isAdminMode: boolean) => {
  const { user, role, isAdmin } = useAuth();
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
        data = await getAllHealthReports(role);
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
