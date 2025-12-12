
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { getUserProfile, updateUserProfile, upgradeToPro } from '../services/supabaseClient';
import { UserProfile } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, role, refreshRole } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserProfile(user.id);
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage(null);
    try {
      // Call updateUserProfile without userId arg (handled by session)
      await updateUserProfile({ full_name: fullName, avatar_url: avatarUrl });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      // Update local state
      if (profile) setProfile({ ...profile, full_name: fullName, avatar_url: avatarUrl });
      await refreshRole(); // Update context immediately
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await upgradeToPro();
      await refreshRole(); // Update context
      setShowUpgradeModal(false);
      setMessage({ type: 'success', text: 'Plan upgraded successfully to Pro!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Upgrade failed. Please try again.' });
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanBadge = () => {
    if (role === 'admin' || role === 'super_admin') return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Administrator</span>;
    if (role === 'user_pro') return <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Pro Plan</span>;
    return <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Free Plan</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
         <div className="animate-spin h-8 w-8 border-4 border-medical-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h1>

      {/* Plan Card */}
      <div className="bg-white dark:bg-[#161b22] shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-8 transition-colors">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Plan</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
               You are currently subscribed to the <strong className="text-gray-800 dark:text-gray-200">{role === 'user_pro' ? 'Pro' : 'Free'}</strong> tier.
             </p>
           </div>
           {getPlanBadge()}
         </div>
         {role === 'user_free' && (
           <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between">
               <p className="text-sm text-medical-600 dark:text-medical-400 font-medium">Upgrade to Pro for unlimited history and PDF exports.</p>
               <Button 
                 variant="primary" 
                 className="text-xs"
                 onClick={() => setShowUpgradeModal(true)}
               >
                 View Upgrade Options
               </Button>
             </div>
           </div>
         )}
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-[#161b22] shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-8 transition-colors">
         <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>
         
         <form onSubmit={handleSave} className="space-y-6">
           <div className="grid grid-cols-1 gap-y-6 gap-x-8 sm:grid-cols-6">
             <div className="sm:col-span-4">
               <label htmlFor="email" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                 Email address
               </label>
               <div className="mt-1">
                 <input
                   type="text"
                   name="email"
                   id="email"
                   value={user?.email || ''}
                   disabled
                   className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed sm:text-sm focus:border-medical-500 focus:ring-medical-500"
                 />
                 <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Email cannot be changed.</p>
               </div>
             </div>

             <div className="sm:col-span-4">
               <label htmlFor="fullName" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                 Display Name
               </label>
               <div className="mt-1">
                 <input
                   type="text"
                   name="fullName"
                   id="fullName"
                   autoComplete="name"
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1117] px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-medical-500 focus:ring-1 focus:ring-medical-500 focus:outline-none sm:text-sm transition-shadow"
                   placeholder="e.g. John Doe"
                 />
               </div>
             </div>

             <div className="sm:col-span-6">
               <label htmlFor="avatarUrl" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                 Avatar URL
               </label>
               <div className="mt-1 flex gap-4 items-center">
                 <div className="flex-1">
                   <input
                     type="text"
                     name="avatarUrl"
                     id="avatarUrl"
                     value={avatarUrl}
                     onChange={(e) => setAvatarUrl(e.target.value)}
                     className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1117] px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-medical-500 focus:ring-1 focus:ring-medical-500 focus:outline-none sm:text-sm transition-shadow"
                     placeholder="https://example.com/avatar.jpg"
                   />
                 </div>
                 {avatarUrl && (
                   <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100">
                     <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                   </div>
                 )}
               </div>
               <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Link to a public image for your profile picture.</p>
             </div>
             
             <div className="sm:col-span-6 pt-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  User ID
                </label>
                <div className="mt-1 text-xs font-mono bg-gray-50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 select-all">
                  {user?.id}
                </div>
             </div>
           </div>

           {message && (
             <div className={`p-4 rounded-xl text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
               {message.text}
             </div>
           )}

           <div className="pt-6 flex items-center justify-end border-t border-gray-100 dark:border-gray-700">
             <Button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl">
               {saving ? 'Saving...' : 'Save Changes'}
             </Button>
           </div>
         </form>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
             {/* Backdrop */}
             <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}></div>
             <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
             
             <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-medical-600 to-teal-600 p-8">
                   <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h3>
                   <p className="text-white/90 text-sm">Unlock the full potential of HealthTrackAI.</p>
                </div>
                
                <div className="p-8">
                   <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      {/* Free Tier */}
                      <div className="flex-1 p-5 border border-gray-200 dark:border-gray-600 rounded-xl opacity-60 bg-gray-50 dark:bg-slate-700/50">
                         <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3">Free Plan</h4>
                         <ul className="text-sm space-y-3 text-gray-600 dark:text-gray-400">
                            <li>• Limited history</li>
                            <li>• Basic Analysis</li>
                            <li>• Standard Support</li>
                         </ul>
                      </div>
                      
                      {/* Pro Tier */}
                      <div className="flex-1 p-5 border-2 border-medical-500 rounded-xl bg-medical-50 dark:bg-medical-900/20 relative overflow-hidden shadow-sm">
                         <div className="absolute top-0 right-0 bg-medical-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">RECOMMENDED</div>
                         <h4 className="font-bold text-medical-700 dark:text-medical-300 uppercase text-xs tracking-wider mb-3">Pro Plan</h4>
                         <ul className="text-sm space-y-3 text-gray-900 dark:text-gray-200 font-medium">
                            <li className="flex items-center gap-2">
                               <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                               Unlimited History
                            </li>
                            <li className="flex items-center gap-2">
                               <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                               PDF Exports
                            </li>
                            <li className="flex items-center gap-2">
                               <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                               Priority Analysis
                            </li>
                         </ul>
                      </div>
                   </div>
                   
                   <p className="text-xs text-center text-gray-500 mb-6 bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg">
                     Note: This is a demo application. No payment is required.
                   </p>

                   <div className="flex gap-4">
                      <Button 
                         variant="secondary" 
                         className="flex-1 rounded-xl py-3"
                         onClick={() => setShowUpgradeModal(false)}
                         disabled={upgrading}
                      >
                         Cancel
                      </Button>
                      <Button 
                         variant="primary" 
                         className="flex-[2] rounded-xl py-3 shadow-lg shadow-medical-500/20"
                         onClick={handleUpgrade}
                         disabled={upgrading}
                      >
                         {upgrading ? 'Upgrading...' : 'Upgrade Now (Free)'}
                      </Button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
