import React, { useState } from 'react';
import { Mail, Phone, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';

const LinkedinIcon = (props) => (
  <svg className={props.className || "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
  </svg>
);

const GithubIcon = (props) => (
  <svg className={props.className || "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function ContactPage({ onBackToDashboard }) {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 py-6 animate-fade-in font-sans">
      
      {/* Navigation Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 px-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-md dark:shadow-xl transition-colors duration-200">
        <button
          onClick={onBackToDashboard}
          className="py-2.5 px-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-md shrink-0"
        >
          <span>← Back to Dashboard</span>
        </button>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
          <span>Verified Developer &amp; Creator Profile</span>
        </div>
      </div>

      {/* Developer Profile Main Card */}
      <div className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 sm:p-12 rounded-3xl space-y-10 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
        
        {/* Profile Intro with Avatar Image */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-6 sm:space-y-0 sm:space-x-8 text-center sm:text-left">
          <img 
            src="https://github.com/jaggureddy11.png" 
            alt="R Jagadishwar Reddy" 
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 transition-all duration-300 shadow-xl object-cover shrink-0" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://avatars.githubusercontent.com/u/152912448?v=4';
            }}
          />
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">R Jagadishwar Reddy</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 w-fit mx-auto sm:mx-0">
                Lead Developer
              </span>
            </div>
            <p className="text-base sm:text-lg font-mono text-slate-600 dark:text-zinc-300 font-bold">Software Developer</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal pt-1">
              Creator of GitHub Profile Health Auditor. Specialized in high-performance web architecture, static code analysis engines, and security auditing tools.
            </p>
          </div>
        </div>

        {/* Contact Method Cards Grid (Spacious Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          
          {/* LinkedIn Card */}
          <div className="bg-slate-50 dark:bg-black p-6 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5 text-slate-900 dark:text-white min-w-0">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 shrink-0">
                  <LinkedinIcon className="w-6 h-6 text-slate-700 dark:text-zinc-200" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-base block text-slate-900 dark:text-white">LinkedIn Profile</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono block truncate">linkedin.com/in/jaggureddy</span>
                </div>
              </div>
              <a
                href="https://www.linkedin.com/in/jaggureddy/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-2 shadow shrink-0"
              >
                <span>Connect</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* GitHub Card */}
          <div className="bg-slate-50 dark:bg-black p-6 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5 text-slate-900 dark:text-white min-w-0">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 shrink-0">
                  <GithubIcon className="w-6 h-6 text-slate-700 dark:text-zinc-200" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-base block text-slate-900 dark:text-white">GitHub Profile</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono block truncate">github.com/jaggureddy11</span>
                </div>
              </div>
              <a
                href="https://github.com/jaggureddy11"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-2 shadow shrink-0"
              >
                <span>Follow</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Email Card (No Overflow) */}
          <div className="bg-slate-50 dark:bg-black p-6 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5 text-slate-900 dark:text-white min-w-0">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 shrink-0">
                  <Mail className="w-6 h-6 text-slate-700 dark:text-zinc-200" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-base block text-slate-900 dark:text-white">Email Address</span>
                  <span className="text-xs text-slate-700 dark:text-zinc-300 font-mono block truncate">
                    jaggureddy2004@gmail.com
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 justify-end sm:justify-start">
                <button
                  onClick={() => handleCopy('jaggureddy2004@gmail.com', 'email')}
                  className="p-2.5 bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-300 dark:border-zinc-800 transition"
                  title="Copy email address to clipboard"
                >
                  {copiedField === 'email' ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href="mailto:jaggureddy2004@gmail.com"
                  className="py-2.5 px-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-extrabold rounded-xl transition flex items-center space-x-2 shadow"
                >
                  <span>Send</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-slate-50 dark:bg-black p-6 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5 text-slate-900 dark:text-white min-w-0">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 shrink-0">
                  <Phone className="w-6 h-6 text-slate-700 dark:text-zinc-200" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-base block text-slate-900 dark:text-white">Phone Number</span>
                  <span className="text-xs text-slate-700 dark:text-zinc-300 font-mono block">
                    +91 9110300509
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 justify-end sm:justify-start">
                <button
                  onClick={() => handleCopy('9110300509', 'phone')}
                  className="p-2.5 bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-300 dark:border-zinc-800 transition"
                  title="Copy phone number to clipboard"
                >
                  {copiedField === 'phone' ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href="tel:9110300509"
                  className="py-2.5 px-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-extrabold rounded-xl transition flex items-center space-x-2 shadow"
                >
                  <span>Call</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
