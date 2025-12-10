

import React from 'react';
import { APP_NAME } from '../constants';
import { Logo } from './Logo';
import { AppRole, UserProfile } from '../types';
import { BetaBadge } from './BetaBadge';

type ViewState = 'landing' | 'form' | 'chat' | 'dashboard' | 'settings';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onSignOut: () => void;
  userEmail?: string;
  userProfile?: UserProfile | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onNavigate, 
  onSignOut, 
  userEmail,
  userProfile,
  darkMode,
  toggleDarkMode 
}) => {
  const userRole = userProfile?.role || 'user_free';
  const displayName = userProfile?.full_name || userEmail?.split('@')[0] || 'User';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    )},
    { id: 'form', label: 'New Analysis', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    )},
    { id: 'settings', label: 'Settings', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.42 24.42 0 010 3.46" />
      </svg>
    )},
  ];

  const getPlanLabel = () => {
    switch (userRole) {
      case 'user_pro': return 'Pro Active';
      case 'admin':
      case 'super_admin': return 'Admin';
      case 'moderator': return 'Moderator';
      default: return 'Free Plan';
    }
  };

  const getPlanColor = () => {
    switch (userRole) {
      case 'user_pro': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
      case 'admin':
      case 'super_admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
      case 'moderator': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  // Generate Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(displayName);

  // Gradient based on role or simple default
  const avatarGradient = userRole === 'user_pro' 
    ? 'from-teal-400 to-medical-600' 
    : userRole === 'admin' 
      ? 'from-purple-500 to-indigo-600'
      : 'from-blue-400 to-indigo-500';

  const DarkModeToggle = () => (
    <button
      onClick={toggleDarkMode}
      className="p-2 text-gray-500 hover:text-medical-600 dark:text-gray-400 dark:hover:text-medical-400 rounded-lg transition-colors"
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 shadow-soft z-20 transition-colors">
        <div className="flex items-center justify-between px-6 h-20 border-b border-gray-100 dark:border-gray-700">
           <div 
             className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
             onClick={() => onNavigate('landing')}
           >
             <Logo className="w-8 h-8" />
             <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">{APP_NAME}</span>
             <BetaBadge className="!ml-0 scale-90 origin-left" />
           </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewState)}
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentView === item.id || (currentView === 'chat' && item.id === 'form')
                  ? 'bg-medical-50 text-medical-600 shadow-sm dark:bg-medical-900/30 dark:text-medical-400 border-l-4 border-medical-500'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200 border-l-4 border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Appearance</span>
             <DarkModeToggle />
          </div>
          {/* User Profile Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-medical-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            <div 
               className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2 transition-all cursor-pointer border border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-600"
               onClick={() => onNavigate('settings')}
            >
               {/* Gradient Avatar */}
               <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-700`}>
                  {initials}
               </div>
               
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-medical-700 dark:group-hover:text-medical-300 transition-colors" title={displayName}>
                   {displayName}
                 </p>
                 <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPlanColor()}`}>
                   {getPlanLabel()}
                 </span>
               </div>
               
               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.preventDefault(); onSignOut(); }}
            type="button" 
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sticky top-0 z-20 transition-colors">
           <div 
             className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
             onClick={() => onNavigate('landing')}
           >
             <Logo className="w-8 h-8" />
             <span className="font-bold text-gray-900 dark:text-white">{APP_NAME}</span>
             <BetaBadge className="scale-75 origin-left !ml-0" />
           </div>
           <div className="flex items-center gap-2">
             <DarkModeToggle />
             <button onClick={onSignOut} className="text-gray-500 dark:text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
               </svg>
             </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden h-16 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center px-4 pb-safe transition-colors z-30">
           {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewState)}
              type="button"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                currentView === item.id || (currentView === 'chat' && item.id === 'form')
                  ? 'text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-900/20'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
           ))}
        </nav>
      </main>
    </div>
  );
};
