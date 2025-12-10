
import { supabase } from './supabaseClient';
import { AppRole } from '../types';

export const getCurrentUserRole = async (): Promise<AppRole> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return 'user_free'; // Default for anon/not found

  // Fetch role from profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    // If profile doesn't exist yet (race condition on signup), default to free
    return 'user_free';
  }
  
  return data.role as AppRole;
};
