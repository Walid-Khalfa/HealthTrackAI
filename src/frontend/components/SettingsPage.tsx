

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { getUserProfile, updateUserProfile, upgradeToPro } from '../../backend/services/supabaseClient';
import { UserProfile } from '../../shared/types';

export const SettingsPage: React.FC = () => {
  const { user, role, refreshRole } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
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
      await updateUserProfile(user.id, { full_name: fullName });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      // Update local state
      if (profile) setProfile({ ...profile, full_name: fullName });
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
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h1>

      {/* Plan Card */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
               You are currently subscribed to the <strong className="text-gray-800 dark:text-gray-200">{role === 'user_pro' ? 'Pro' : 'Free'}</strong> tier.
             </p>
           </div>
           {getPlanBadge()}
         </div>
         {role === 'user_free' && (
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
             <p className="text-sm text-medical-600 dark:text-medical-400 mb-2">Upgrade to Pro for unlimited history and PDF exports.</p>
             <Button 
               variant="primary" 
               className="text-xs"
               onClick={() => setShowUpgradeModal(true)}
             >
               View Upgrade Options
             </Button>
           </div>
         )}
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
         
         <form onSubmit={handleSave} className="space-y-6">
           <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
             <div className="sm:col-span-4">
               <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                 Email address
               </label>
               <div className="mt-1">
                 <input
                   type="text"
                   name="email"
                   id="email"
                   value={user?.email || ''}
                   disabled
                   className="shadow-sm focus:ring-medical-500 focus:border-medical-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                 />
                 <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
               </div>
             </div>

             <div className="sm:col-span-4">
               <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                   className="shadow-sm focus:ring-medical-500 focus:border-medical-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                   placeholder="e.g. John Doe"
                 />
               </div>
             </div>
             
             <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User ID
                </label>
                <div className="mt-1 text-xs font-mono bg-gray-50 dark:bg-slate-900/50 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 select-all">
                  {user?.id}
                </div>
             </div>
           </div>

           {message && (
             <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
               {message.text}
             </div>
           )}

           <div className="pt-4 flex items-center justify-end border-t border-gray-100 dark:border-gray-700">
             <Button type="submit" disabled={saving}>
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
             
             <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div className="bg-gradient-to-r from-medical-600 to-teal-600 p-6">
                   <h3 className="text-xl font-bold text-white mb-1">Upgrade to Pro</h3>
                   <p className="text-white/80 text-sm">Unlock the full potential of HealthTrackAI.</p>
                </div>
                
                <div className="p-6">
                   <div className="flex gap-4 mb-6">
                      {/* Free Tier */}
                      <div className="flex-1 p-4 border border-gray-200 dark:border-gray-600 rounded-lg opacity-60">
                         <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Free Plan</h4>
                         <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                            <li>• Limited history</li>
                            <li>• Basic Analysis</li>
                            <li>• Standard Support</li>
                         </ul>
                      </div>
                      
                      {/* Pro Tier */}
                      <div className="flex-1 p-4 border-2 border-medical-500 rounded-lg bg-medical-50 dark:bg-medical-900/20 relative overflow-hidden">
                         <div className="absolute top-0 right-0 bg-medical-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">RECOMMENDED</div>
                         <h4 className="font-bold text-medical-700 dark:text-medical-300 uppercase text-xs tracking-wider mb-2">Pro Plan</h4>
                         <ul className="text-sm space-y-2 text-gray-900 dark:text-gray-200 font-medium">
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
                   
                   <p className="text-xs text-center text-gray-500 mb-6">
                     This is a demo application. No actual payment is required.
                   </p>

                   <div className="flex gap-3">
                      <Button 
                         variant="secondary" 
                         className="w-full"
                         onClick={() => setShowUpgradeModal(false)}
                         disabled={upgrading}
                      >
                         Cancel
                      </Button>
                      <Button 
                         variant="primary" 
                         className="w-full"
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