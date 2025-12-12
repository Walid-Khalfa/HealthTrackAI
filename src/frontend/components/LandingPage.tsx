
import React from 'react';
import { APP_NAME } from '../../shared/constants';
import { Logo } from './Logo';
import { LegalSection } from './LegalPage';
import { BetaBadge } from './BetaBadge';

interface LandingPageProps {
  onStart: () => void;
  onSignIn: () => void;
  onOpenLegal: (section: LegalSection) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onSignIn, onOpenLegal, darkMode, toggleDarkMode }) => {
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <Logo className="w-10 h-10" />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{APP_NAME}</span>
            <BetaBadge />
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
              <button onClick={() => scrollToSection('features')} className="hover:text-medical-600 dark:hover:text-medical-400 transition-colors">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-medical-600 dark:hover:text-medical-400 transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-medical-600 dark:hover:text-medical-400 transition-colors">About</button>
              <button onClick={() => scrollToSection('support')} className="hover:text-medical-600 dark:hover:text-medical-400 transition-colors">Support</button>
            </div>
            
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

            <button 
              onClick={onSignIn}
              className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Bar (Simple inline for small screens) */}
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 px-4 py-2 flex justify-between text-xs text-gray-500 dark:text-gray-400 overflow-x-auto">
           <button onClick={() => scrollToSection('features')} className="whitespace-nowrap px-2">Features</button>
           <button onClick={() => scrollToSection('pricing')} className="whitespace-nowrap px-2">Pricing</button>
           <button onClick={() => scrollToSection('about')} className="whitespace-nowrap px-2">About</button>
           <button onClick={() => scrollToSection('support')} className="whitespace-nowrap px-2">Support</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column: Text */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-medical-50 dark:bg-medical-900/30 border border-medical-100 dark:border-medical-800 text-medical-600 dark:text-medical-300 text-xs font-medium uppercase tracking-wide">
                Powered by Gemini 3 Pro
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                Your Intelligent <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-500 to-teal-400">Medical Assistant</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                Experience the next generation of health tracking. Analyze symptoms, visualize trends, and get educational insights from images, audio, and documents instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={onStart}
                  className="bg-medical-600 hover:bg-medical-700 text-white text-lg font-semibold py-4 px-8 rounded-xl shadow-lg shadow-medical-500/20 transition-all hover:-translate-y-0.5"
                >
                  Start Free Analysis
                </button>
                <button 
                   onClick={() => scrollToSection('features')}
                   className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-white text-lg font-semibold py-4 px-8 rounded-xl transition-colors"
                >
                  Explore Features
                </button>
              </div>
              
              <div className="pt-6 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Private & Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>24/7 Availability</span>
                </div>
              </div>
            </div>

            {/* Right Column: Illustration */}
            <div className="flex justify-center lg:justify-end relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-medical-200/30 to-teal-200/30 dark:from-medical-900/20 dark:to-teal-900/20 rounded-full blur-3xl -z-10"></div>
               <div className="relative w-full max-w-lg aspect-square lg:aspect-auto flex items-center justify-center p-6 z-10 hover:scale-[1.02] transition-transform duration-500">
                  {/* Abstract Tech/Medical Illustration using SVG */}
                  <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                     {/* Base Plate */}
                     <rect x="100" y="50" width="200" height="200" rx="24" fill="white" className="dark:fill-slate-800" stroke="url(#paint0_linear)" strokeWidth="4"/>
                     
                     {/* Screen Content */}
                     <rect x="120" y="70" width="160" height="120" rx="8" fill="#F0F9FF" className="dark:fill-slate-700"/>
                     <path d="M130 90H270" stroke="#BAE6FD" strokeWidth="4" strokeLinecap="round" className="dark:stroke-slate-600"/>
                     <path d="M130 110H200" stroke="#BAE6FD" strokeWidth="4" strokeLinecap="round" className="dark:stroke-slate-600"/>
                     
                     {/* Pulse Graph */}
                     <path d="M130 150 L150 150 L160 130 L180 170 L200 150 L270 150" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                     
                     {/* Floating Icons */}
                     <circle cx="90" cy="90" r="30" fill="#0EA5E9" fillOpacity="0.1" stroke="#0EA5E9" strokeWidth="2"/>
                     <path d="M80 90 L90 100 L105 80" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                     
                     <circle cx="310" cy="220" r="35" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="2"/>
                     <path d="M300 220 H320 M310 210 V230" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>

                     <defs>
                       <linearGradient id="paint0_linear" x1="100" y1="50" x2="300" y2="250" gradientUnits="userSpaceOnUse">
                         <stop stopColor="#E2E8F0" className="dark:stop-color-slate-700"/>
                         <stop offset="1" stopColor="#CBD5E1" className="dark:stop-color-slate-600"/>
                       </linearGradient>
                     </defs>
                  </svg>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-slate-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-medical-600 dark:text-medical-400 uppercase tracking-wide">Capabilities</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Complete Health Intelligence
            </p>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Powerful tools designed to interpret your health data safely and securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Multimodal Input",
                desc: "Upload photos of skin issues, record cough sounds, or scan PDF lab reports. Our AI fuses data sources for a holistic view.",
                icon: "📸"
              },
              {
                title: "Preliminary Insights",
                desc: "Get instant, educational explanations of symptoms and test results written in plain language you can actually understand.",
                icon: "🧠"
              },
              {
                title: "Safety First",
                desc: "Built with strict guardrails. We flag potential emergencies and always prioritize professional medical consultation.",
                icon: "🛡️"
              },
              {
                title: "Secure History",
                desc: "Your analyses are saved to your private, encrypted dashboard. Track how symptoms change over time.",
                icon: "🔒"
              },
              {
                title: "Smart Document Parsing",
                desc: "Don't understand your blood work? Upload the PDF and let HealthTrackAI explain the values and ranges.",
                icon: "📄"
              },
              {
                title: "Doctor Summary",
                desc: "Generate a concise, professional summary of your symptoms to share with your healthcare provider.",
                icon: "👨‍⚕️"
              },
              {
                title: "Private & Anonymous",
                desc: "We prioritize your privacy. Your health data is yours, and we use enterprise-grade encryption.",
                icon: "👁️"
              },
              {
                title: "24/7 Availability",
                desc: "Health concerns don't keep office hours. Get preliminary guidance whenever you need it, day or night.",
                icon: "🌙"
              },
              {
                title: "Dark Mode Support",
                desc: "A comfortable viewing experience for late-night health checks, reducing eye strain.",
                icon: "🌗"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300">
                <div className="w-12 h-12 bg-medical-50 dark:bg-medical-900/30 rounded-xl flex items-center justify-center text-2xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-medical-600 dark:text-medical-400 uppercase tracking-wide">Pricing</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Choose the plan that fits your journey
            </p>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Start with our free educational tools, or upgrade for comprehensive health tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Free Plan */}
            <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-white">Free Plan</h3>
              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">Get started with essential features.</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">$0</span>
                <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">/month</span>
              </p>
              <button 
                onClick={onSignIn}
                className="mt-6 block rounded-xl py-2 px-3 text-center text-sm font-semibold leading-6 text-medical-600 ring-1 ring-inset ring-medical-200 hover:ring-medical-300 dark:ring-medical-800 dark:text-medical-400 dark:hover:bg-medical-900/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 transition-all"
              >
                Sign Up Free
              </button>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300 xl:mt-10 flex-1">
                {['Up to 5 analyses / month', 'Single user', 'Multimodal input (Text, Audio, Photo)', 'Basic Dashboard History (30 days)', 'Educational insights'].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-medical-600 dark:text-medical-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col relative rounded-2xl border-2 border-medical-500 bg-white dark:bg-slate-800 p-8 shadow-xl hover:scale-105 transition-all duration-300 z-10">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 md:translate-x-0 md:-mt-4 md:mr-4">
                 <span className="inline-flex items-center rounded-full bg-medical-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                   Most Popular
                 </span>
              </div>
              <h3 className="text-lg font-semibold leading-8 text-medical-600 dark:text-medical-400">Pro Plan</h3>
              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">Best for active users requiring full history.</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">$19</span>
                <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">/month</span>
              </p>
              <button 
                onClick={onSignIn}
                className="mt-6 block rounded-xl bg-medical-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 transition-all"
              >
                Upgrade to Pro
              </button>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300 xl:mt-10 flex-1">
                {[
                  'Unlimited analyses',
                  'Full lifetime history access',
                  'Priority AI Processing',
                  'PDF Report Exports',
                  'Secure attachment storage',
                  'Doctor Summary Generator'
                ].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-medical-600 dark:text-medical-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Team Plan */}
            <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-white">Clinic / Team</h3>
              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">For small health teams or clinics.</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Custom</span>
              </p>
              <a 
                href="mailto:sales@healthtrackai.com"
                className="mt-6 block rounded-xl py-2 px-3 text-center text-sm font-semibold leading-6 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
              >
                Contact Sales
              </a>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300 xl:mt-10 flex-1">
                {['Multiple seats', 'Centralized billing', 'Shared dashboard access', 'API Access', 'Dedicated Support'].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Testimonials */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-10">Trusted by early adopters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Testimonial 1 */}
               <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl relative">
                  <svg className="absolute top-4 left-4 w-8 h-8 text-medical-200 dark:text-medical-900" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.896 14.321 15.298 14.93 13.92C15.42 12.812 16.342 11.233 17.151 10.59C16.582 10.662 16.291 10.742 15.862 10.742C14.12 10.742 12.722 9.426 12.722 7.74999C12.722 6.01499 14.192 4.63099 16.035 4.63099C18.156 4.63099 19.866 6.55199 19.866 9.99899C19.866 14.499 17.652 18.995 14.017 21ZM5.98602 21L5.98602 18C5.98602 16.896 6.29 15.298 6.89902 13.92C7.38902 12.812 8.31102 11.233 9.12002 10.59C8.55102 10.662 8.26002 10.742 7.83102 10.742C6.08902 10.742 4.69102 9.426 4.69102 7.74999C4.69102 6.01499 6.16102 4.63099 8.00402 4.63099C10.125 4.63099 11.835 6.55199 11.835 9.99899C11.835 14.499 9.62102 18.995 5.98602 21Z" /></svg>
                  <p className="text-gray-600 dark:text-gray-300 italic relative z-10 pl-4">
                    "HealthTrackAI helped me understand my lab results before my doctor's appointment. I felt much more prepared and less anxious."
                  </p>
                  <div className="mt-4 flex items-center gap-3 pl-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">SL</div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Sarah L.</span>
                  </div>
               </div>
               {/* Testimonial 2 */}
               <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl relative">
                  <svg className="absolute top-4 left-4 w-8 h-8 text-medical-200 dark:text-medical-900" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.896 14.321 15.298 14.93 13.92C15.42 12.812 16.342 11.233 17.151 10.59C16.582 10.662 16.291 10.742 15.862 10.742C14.12 10.742 12.722 9.426 12.722 7.74999C12.722 6.01499 14.192 4.63099 16.035 4.63099C18.156 4.63099 19.866 6.55199 19.866 9.99899C19.866 14.499 17.652 18.995 14.017 21ZM5.98602 21L5.98602 18C5.98602 16.896 6.29 15.298 6.89902 13.92C7.38902 12.812 8.31102 11.233 9.12002 10.59C8.55102 10.662 8.26002 10.742 7.83102 10.742C6.08902 10.742 4.69102 9.426 4.69102 7.74999C4.69102 6.01499 6.16102 4.63099 8.00402 4.63099C10.125 4.63099 11.835 6.55199 11.835 9.99899C11.835 14.499 9.62102 18.995 5.98602 21Z" /></svg>
                  <p className="text-gray-600 dark:text-gray-300 italic relative z-10 pl-4">
                    "The symptom tracker is a game changer. I can finally show my specialist exactly how my condition has progressed over the last month."
                  </p>
                  <div className="mt-4 flex items-center gap-3 pl-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-xs">MT</div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Mike T.</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="mt-16 max-w-2xl mx-auto divide-y divide-gray-100 dark:divide-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h3>
            {[
               { q: "Is this a medical diagnosis tool?", a: "No. HealthTrackAI is purely educational. It helps organize your thoughts and provides general information, but it never replaces a doctor's diagnosis." },
               { q: "Can I cancel my Pro plan anytime?", a: "Yes, you can cancel your subscription at any time from your account settings. You will retain access until the end of your billing cycle." },
               { q: "How is my data protected?", a: "We use enterprise-grade encryption for all data storage and transfer. We do not sell your personal health data to third parties." }
            ].map((faq, idx) => (
              <div key={idx} className="py-6">
                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">{faq.q}</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">{faq.a}</dd>
              </div>
            ))}
          </div>
          
          {/* Disclaimer */}
          <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Disclaimer:</strong> HealthTrackAI is not a medical device. It does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-10 lg:mb-0">
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-6">
                 Bridging the Gap Between <br/> Uncertainty and Care
               </h2>
               <div className="prose prose-lg text-gray-600 dark:text-gray-300">
                 <p className="mb-4">
                   HealthTrackAI was founded on a simple mission: to empower individuals with accessible, easy-to-understand health information.
                 </p>
                 <p className="mb-4">
                   We believe that while AI cannot replace doctors, it can be a powerful tool to help you articulate your symptoms, understand complex medical documents, and decide when to seek professional help.
                 </p>
                 <p>
                   By combining advanced computer vision, audio processing, and large language models, we provide a "second pair of eyes" that is always available, patient, and safe.
                 </p>
               </div>
            </div>
            <div className="relative">
               <div className="absolute inset-0 bg-medical-600 rounded-3xl transform rotate-3 opacity-10"></div>
               <div className="relative bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Our Commitments</h3>
                  <ul className="space-y-4">
                    {[
                      "We never sell your personal health data.",
                      "We always prioritize safety over convenience.",
                      "We provide sources and reasoning, not just answers.",
                      "We are transparent about the limitations of AI."
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support / FAQ Section */}
      <section id="support" className="py-20 bg-medical-50 dark:bg-slate-800/30 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Support</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Get help with using HealthTrackAI.</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "Is HealthTrackAI a replacement for my doctor?", a: "No. HealthTrackAI is an educational tool designed to provide preliminary information. It cannot diagnose medical conditions or prescribe treatment. Always consult a qualified healthcare professional." },
              { q: "Is my data secure?", a: "Yes. We use industry-standard encryption for data in transit and at rest. Your health reports are private to your account." },
              { q: "How accurate is the AI?", a: "Our system uses state-of-the-art models (Gemini 3 Pro) optimized for medical reasoning. However, like all AI, it can make errors. We encourage users to verify all information with a professional." },
              { q: "Can I delete my history?", a: "Yes, you can cancel your subscription at any time from your account settings. You will retain access until the end of your billing cycle." }
            ].map((faq, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Still have questions?</p>
            <button className="text-medical-600 dark:text-medical-400 font-semibold hover:underline">
              Contact Support Team &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <div className="bg-blue-600 dark:bg-blue-900 py-6 px-4">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
           <svg className="w-8 h-8 text-white/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <p className="text-white/90 text-sm md:text-base font-medium max-w-4xl">
             <strong>IMPORTANT:</strong> This application is for demonstration and educational purposes only. If you are experiencing a medical emergency, please call emergency services immediately.
           </p>
         </div>
      </div>

       {/* Footer */}
       <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6">
             <div className="flex items-center gap-2 opacity-75 grayscale hover:grayscale-0 transition-all">
               <Logo className="w-8 h-8" />
               <span className="font-bold text-gray-900 dark:text-white">{APP_NAME}</span>
             </div>
             
             <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
               <button onClick={() => onOpenLegal('privacy')} className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</button>
               <button onClick={() => onOpenLegal('terms')} className="hover:text-gray-900 dark:hover:text-white">Terms of Service</button>
               <button onClick={() => onOpenLegal('cookies')} className="hover:text-gray-900 dark:hover:text-white">Cookie Policy</button>
             </div>

             <div className="text-gray-400 dark:text-gray-600 text-sm">
                © 2025 {APP_NAME}. All rights reserved.
             </div>
          </div>
       </footer>
    </div>
  );
};
