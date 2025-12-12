
import React from 'react';
import { APP_NAME } from '../constants';
import { Logo } from './Logo';
import { AppRole, UserProfile } from '../types';
import { BetaBadge } from './BetaBadge';
import { Icons } from './Icons';

type ViewState = 'landing' | 'form' | 'chat' | 'dashboard' | 'settings' | 'tasks';

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
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.Dashboard className="w-5 h-5" /> },
    { id: 'tasks', label: 'My Tasks', icon: <Icons.Tasks className="w-5 h-5" /> },
    { id: 'form', label: 'New Analysis', icon: <Icons.NewAnalysis className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Icons.Settings className="w-5 h-5" /> },
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

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
      {darkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
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
               {userProfile?.avatar_url ? (
                 <img 
                   src={userProfile.avatar_url} 
                   alt={displayName} 
                   className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-700 bg-gray-200"
                   onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                 />
               ) : (
                 <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-700`}>
                    {initials}
                 </div>
               )}
               
               {userProfile?.avatar_url && (
                 <div className={`hidden w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-700`}>
                    {initials}
                 </div>
               )}
               
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-medical-700 dark:group-hover:text-medical-300 transition-colors" title={displayName}>
                   {displayName}
                 </p>
                 <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPlanColor()}`}>
                   {getPlanLabel()}
                 </span>
               </div>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.preventDefault(); onSignOut(); }}
            type="button" 
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <Icons.SignOut className="w-4 h-4" />
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
               <Icons.SignOut className="w-6 h-6" />
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
