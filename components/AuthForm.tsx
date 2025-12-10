
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Button } from './Button';
import { Logo } from './Logo';
import { BetaBadge } from './BetaBadge';

interface AuthFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Validation Logic
  const passwordRequirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const isPasswordStrong = passwordRequirements.every(req => req.valid);
  const validRequirementsCount = passwordRequirements.filter(req => req.valid).length;
  const doPasswordsMatch = password === confirmPassword;

  const getStrengthStyles = () => {
    if (password.length === 0) return { label: '', color: 'bg-slate-700', text: 'text-slate-400' };
    if (validRequirementsCount <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (validRequirementsCount <= 4) return { label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500', text: 'text-green-500' };
  };

  const strength = getStrengthStyles();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!isPasswordStrong) {
          throw new Error("Please ensure your password meets all requirements.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!fullName.trim()) {
          throw new Error("Please enter your full name.");
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_url: '', // Can be extended later
            }
          }
        });
        
        if (error) throw error;
        alert('Signup successful! Please check your email for confirmation (if enabled) or sign in.');
        setIsSignUp(false);
        setConfirmPassword('');
        setFullName('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#050b14] transition-colors duration-300 font-sans">
      
      {/* Left Side: Form Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-[#050b14] w-full lg:w-[500px] xl:w-[600px] relative z-20 border-r border-transparent dark:border-white/5 transition-colors">
        
        <button 
          onClick={onCancel}
          className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-2 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full"></div>
              <Logo className="w-16 h-16 relative z-10" />
              <div className="absolute -top-2 -right-8 rotate-12 z-20">
                 <BetaBadge />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {isSignUp ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              {isSignUp 
                ? 'Start your journey to better health insights.' 
                : 'Access your secure AI health dashboard.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            
            {/* Full Name Field (Sign Up Only) */}
            {isSignUp && (
              <div className="animate-fade-in-up">
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                     </svg>
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-[#0f1623] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                   </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-[#0f1623] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-[#0f1623] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength */}
              {isSignUp && (
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Security Check</span>
                    <span className={`text-xs font-bold ${strength.text}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mb-3">
                    <div 
                      className={`h-1 rounded-full transition-all duration-500 ease-out ${strength.color}`} 
                      style={{ width: `${Math.max(5, (validRequirementsCount / 5) * 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className={`flex items-center gap-1.5 text-[10px] ${req.valid ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${req.valid ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (SignUp Only) */}
            {isSignUp && (
              <div className="animate-fade-in-up">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    className={`block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-[#0f1623] border rounded-xl focus:outline-none focus:ring-2 sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm ${
                      confirmPassword && !doPasswordsMatch 
                        ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/50'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-100 dark:border-red-500/20 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Authentication Error
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 disabled:shadow-none"
              >
                {loading ? (
                   <span className="flex items-center justify-center gap-2">
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Processing...
                   </span>
                ) : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#050b14] text-slate-500 transition-colors">
                    {isSignUp ? 'Already have an account?' : 'New to HealthTrackAI?'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                   setIsSignUp(!isSignUp);
                   setError(null);
                   setConfirmPassword('');
                   setFullName('');
                }}
                className="w-full py-3 px-4 bg-transparent border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </button>
            </div>
          </form>
          
          {/* Trust Footer */}
          <div className="mt-12 flex justify-between items-center text-[10px] text-slate-400 font-medium border-t border-slate-100 dark:border-slate-900 pt-6">
             <div className="flex items-center gap-1.5">
               <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
               <span>256-bit Encryption</span>
             </div>
             <div className="flex items-center gap-1.5">
               <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span>Gemini 3 Powered</span>
             </div>
             <div className="flex items-center gap-1.5 text-orange-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Educational Tool</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Visual Section */}
      <div className="hidden lg:block relative w-0 flex-1 bg-blue-50 dark:bg-[#050b14] overflow-hidden transition-colors duration-500">
         {/* Background Gradients */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-400/10 dark:bg-teal-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 transition-colors"></div>
         <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors"></div>
         
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

         <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
           
           {/* Abstract Phone/Interface Visual */}
           <div className="relative w-full max-w-md aspect-[4/5] bg-white/40 dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-slate-700/50 shadow-2xl p-6 flex flex-col transform hover:scale-[1.02] transition-all duration-700">
              <div className="w-16 h-1.5 bg-slate-300 dark:bg-slate-700/50 rounded-full mx-auto mb-8 transition-colors"></div>
              
              {/* Fake UI Elements */}
              <div className="space-y-4 flex-1">
                 <div className="flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/50 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="h-2 w-20 bg-slate-200 dark:bg-slate-600 rounded transition-colors"></div>
                       <div className="h-2 w-32 bg-slate-100 dark:bg-slate-700 rounded transition-colors"></div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-slate-800/30 rounded-xl border border-white/30 dark:border-slate-700/30 shadow-sm transition-colors">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 transition-colors">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="h-2 w-24 bg-slate-200 dark:bg-slate-600 rounded transition-colors"></div>
                       <div className="h-2 w-16 bg-slate-100 dark:bg-slate-700 rounded transition-colors"></div>
                    </div>
                 </div>

                 <div className="mt-8 p-6 bg-blue-50/80 dark:bg-blue-600/10 rounded-xl border border-blue-100 dark:border-blue-500/20 text-left transition-colors">
                    <p className="text-sm text-slate-600 dark:text-blue-100/80 italic leading-relaxed transition-colors">
                       "HealthTrackAI has revolutionized how I track my symptoms. It's like having a medical assistant in my pocket."
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                       <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                       <span className="text-xs font-bold text-slate-700 dark:text-blue-200 transition-colors">Dr. Sarah J.</span>
                    </div>
                 </div>
              </div>

              {/* Bottom Nav Mock */}
              <div className="mt-auto pt-6 flex justify-around opacity-50">
                 <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 transition-colors"></div>
                 <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 transition-colors"></div>
                 <div className="w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                 <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 transition-colors"></div>
              </div>
           </div>
         </div>
      </div>

    </div>
  );
};
