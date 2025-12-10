import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile } from '../services/supabaseClient';
import { AppRole, UserProfile } from '../types';

interface AuthContextType {
  role: AppRole;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  user: any;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  role: 'user_free', 
  profile: null,
  loading: true, 
  isAdmin: false, 
  isModerator: false,
  user: null,
  refreshRole: async () => {}
});

interface AuthProviderProps {
  children?: ReactNode;
}

// 15 Minutes in milliseconds
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; 

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [role, setRole] = useState<AppRole>('user_free');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshRole = async () => {
    // We use getUserProfile instead of getCurrentUserRole to get full data
    if (!user) return;
    try {
      const p = await getUserProfile(user.id);
      if (p) {
        setProfile(p);
        setRole(p.role);
      } else {
        // Fallback if no profile row exists (race condition)
        setRole('user_free');
        setProfile(null);
      }
    } catch (e) {
      console.error("Error refreshing profile:", e);
    }
  };

  // --- Session Management & Inactivity Timer ---
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;

    const handleLogout = async () => {
      await supabase.auth.signOut();
      alert("Session expired due to inactivity. Please log in again.");
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    // Events to monitor for activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Add listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  useEffect(() => {
    // Initial fetch
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        // Must wait for this fetch
        try {
          const p = await getUserProfile(currentUser.id);
          if (p) {
            setProfile(p);
            setRole(p.role);
          }
        } catch (e) { console.error(e) }
      }
      setLoading(false);
    };
    init();

    // Listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        if (event === 'SIGNED_IN') {
           // Small delay to allow trigger to run if it's a new signup
           setTimeout(async () => {
             try {
                const p = await getUserProfile(currentUser.id);
                if (p) {
                  setProfile(p);
                  setRole(p.role);
                }
             } catch (e) { console.error(e) }
           }, 500);
        }
      } else {
        setRole('user_free');
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = ['admin', 'super_admin'].includes(role);
  const isModerator = role === 'moderator';

  return (
    <AuthContext.Provider value={{ role, profile, loading, isAdmin, isModerator, user, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);