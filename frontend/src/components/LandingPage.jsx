import React, { useState } from 'react';
import { 
  Terminal, 
  ShieldCheck, 
  Activity, 
  Wrench, 
  Cpu, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  ChevronDown,
  Search,
  EyeOff,
  ShieldAlert,
  FileCode,
  Lock,
  Zap,
  Layers,
  XCircle,
  Mail,
  Phone,
  ExternalLink,
  Globe
} from 'lucide-react';

const LinkedinIcon = (props) => (
  <svg className={props.className || "w-3.5 h-3.5"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
  </svg>
);

const GithubIcon = (props) => (
  <svg className={props.className || "w-3.5 h-3.5"} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function LandingPage({ onStartRegister, onGitHubOAuth, onStartQuickScan }) {
  const [quickUsername, setQuickUsername] = useState('');
  const [demoTab, setDemoTab] = useState('terminal'); // 'terminal', 'findings', 'scorecard', 'patches'
  const [activeFaq, setActiveFaq] = useState(null);
  const [copied, setCopied] = useState(false);

  // Interactive Recruiter Risk Simulator State
  const [riskItems, setRiskItems] = useState({
    hasSecrets: true,
    missingGitignore: true,
    missingLicense: false,
    noReadme: false,
    hardcodedUrls: true
  });

  const toggleRiskItem = (key) => {
    setRiskItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calcScore = () => {
    let score = 100;
    if (riskItems.hasSecrets) score -= 40;
    if (riskItems.missingGitignore) score -= 15;
    if (riskItems.missingLicense) score -= 10;
    if (riskItems.noReadme) score -= 15;
    if (riskItems.hardcodedUrls) score -= 20;
    return Math.max(0, score);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    let raw = quickUsername.trim();
    if (!raw) return;

    // Support full URLs like https://github.com/username or github.com/username
    if (raw.includes('github.com/')) {
      raw = raw.split('github.com/')[1].split('/')[0];
    }
    raw = raw.replace(/^@/, '').trim();

    if (raw) {
      onStartQuickScan(raw);
    }
  };

  const badgeMarkdown = `![GitHub Profile Health](https://img.shields.io/badge/Profile_Health-88%2F100-10B981?style=for-the-badge&logo=github)`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-16 sm:space-y-24 lg:space-y-28 py-0 sm:py-1 text-white relative overflow-hidden font-sans">
      
      {/* Background Subtle Grid & Ambient Radial Beam */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none -z-10"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-[160px] rounded-full pointer-events-none -z-10"></div>

      {/* Expansive Ambient Octocat Watermark Artwork (Fully Mobile Responsive) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[480px] sm:h-[720px] pointer-events-none z-0 flex items-center justify-center opacity-[0.10] sm:opacity-[0.13] select-none">
        <img 
          src="/octocat-user-outline.png" 
          alt="GitHub Profile Auditor Background Artwork" 
          className="w-[340px] xs:w-[460px] sm:w-[840px] lg:w-[960px] max-w-none transform -translate-y-6 sm:-translate-y-12" 
        />
      </div>


      {/* HERO SECTION - WORLD-CLASS DEVELOPER SECURITY STUDIO */}
      <section className="text-center space-y-8 max-w-5xl mx-auto -mt-4 sm:-mt-8 pt-0 relative z-10 animate-fade-in">

        {/* High-Impact Headline */}
        <div className="space-y-4 relative">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.08] font-display">
            <span className="text-white block">Uncover Leaked Secrets.</span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent block pt-1">
              Elevate Profile Security.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal pt-1 tracking-tight font-sans">
            Automated static analysis across public GitHub repositories. Intercept committed API credentials, fix Git hygiene debt, and generate 1-click auto-fix patches.
          </p>
        </div>

        {/* Developer Command Line Search Box */}
        <div className="pt-1 max-w-2xl mx-auto space-y-4">
          <form 
            onSubmit={handleQuickSubmit} 
            className="bg-white dark:bg-zinc-950/90 p-2.5 rounded-3xl border border-slate-300 dark:border-zinc-800 shadow-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300 flex flex-col sm:flex-row items-center gap-2.5 backdrop-blur-xl"
          >
            <div className="relative w-full flex items-center pl-4">
              <Search className="w-5 h-5 text-slate-400 dark:text-zinc-400 shrink-0 mr-2.5" />
              <span className="text-slate-500 dark:text-zinc-500 font-mono text-xs sm:text-sm font-bold select-none shrink-0 pr-1">
                github.com/
              </span>
              <input
                type="text"
                placeholder="username or repo URL (e.g. torvalds/linux or octocat)"
                value={quickUsername}
                onChange={(e) => setQuickUsername(e.target.value)}
                className="w-full py-3.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none font-mono text-xs sm:text-sm text-left font-semibold"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 px-8 py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-98 flex items-center justify-center space-x-2.5"
            >
              <span>Audit Profile</span>
              <ArrowRight className="w-4 h-4 text-white dark:text-black shrink-0" />
            </button>
          </form>

          {/* Quick Target Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 font-mono text-xs text-zinc-400">
            <span className="text-xs text-zinc-400 font-bold">Featured profiles:</span>
            {['torvalds', 'gaearon', 'octocat'].map((sampleUser) => (
              <button
                key={sampleUser}
                type="button"
                onClick={() => {
                  setQuickUsername(sampleUser);
                  if (onStartQuickScan) onStartQuickScan(sampleUser);
                  else onStartRegister();
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold transition duration-200 flex items-center space-x-1 shadow-sm active:scale-95"
              >
                <span>@{sampleUser}</span>
              </button>
            ))}
          </div>

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-mono text-zinc-400">
            <span className="flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-zinc-300" />
              <span>Instant 10s Audit</span>
            </span>
            <span className="flex items-center space-x-2 font-semibold">
              <EyeOff className="w-4 h-4 text-zinc-300" />
              <span>In-Memory Redaction</span>
            </span>
            <button 
              onClick={onGitHubOAuth}
              className="text-zinc-400 hover:text-white underline font-bold transition duration-200 flex items-center space-x-1"
            >
              <span>Log in with GitHub</span>
            </button>
          </div>
        </div>
      </section>

      {/* METRICS TRUST BANNER */}
      <section className="max-w-5xl mx-auto -mt-20 sm:-mt-24 lg:-mt-28 border border-zinc-850 bg-zinc-950/90 rounded-3xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono shadow-2xl animate-slide-up-1 backdrop-blur-xl relative z-10">
        <div className="space-y-1.5">
          <span className="text-3xl sm:text-4xl font-black text-emerald-400 block">100%</span>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">In-Memory Redaction</span>
        </div>
        <div className="space-y-1.5">
          <span className="text-3xl sm:text-4xl font-black text-cyan-400 block">&lt; 10s</span>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Average Scan Runtime</span>
        </div>
        <div className="space-y-1.5">
          <span className="text-3xl sm:text-4xl font-black text-white block">3 Engines</span>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">TruffleHog • Semgrep • Hygiene</span>
        </div>
        <div className="space-y-1.5">
          <span className="text-3xl sm:text-4xl font-black text-amber-400 block">0</span>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Credentials Stored</span>
        </div>
      </section>

      {/* INTERACTIVE PRODUCT STUDIO PREVIEW */}
      <section className="max-w-5xl mx-auto space-y-5 animate-slide-up-2">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Interactive Product Preview</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Auditor Studio</h2>
        </div>

        {/* Mock Window Container */}
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
          
          {/* Top Bar with macOS Window Dots & Tabs */}
          <div className="bg-black/90 border-b border-zinc-850 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-xs font-mono text-zinc-500 ml-2 hidden sm:inline">auditor-engine --target @octocat</span>
            </div>

            {/* Interactive Tab Controls */}
            <div className="flex items-center bg-black p-1 rounded-xl border border-zinc-850 text-xs font-mono overflow-x-auto max-w-full no-scrollbar">
              <button
                onClick={() => setDemoTab('terminal')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'terminal' 
                    ? 'bg-zinc-850 text-white border border-zinc-700 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Execution</span>
              </button>
              <button
                onClick={() => setDemoTab('findings')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'findings' 
                    ? 'bg-zinc-850 text-white border border-zinc-700 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Discovered Findings</span>
              </button>
              <button
                onClick={() => setDemoTab('scorecard')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'scorecard' 
                    ? 'bg-zinc-850 text-white border border-zinc-700 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Health Score</span>
              </button>
              <button
                onClick={() => setDemoTab('patches')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'patches' 
                    ? 'bg-zinc-850 text-white border border-zinc-700 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Fix Patch</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 bg-black/95 font-mono text-xs min-h-[340px]">
            
            {/* TAB 1: TERMINAL LOGS */}
            {demoTab === 'terminal' && (
              <div className="space-y-3 leading-relaxed text-zinc-300 animate-fade-in">
                <p className="text-zinc-500"># Initializing ephemeral Redis Queue scanning worker...</p>
                <p className="text-emerald-400">&gt; GitHub REST API: Enumerating public non-fork repositories for user @octocat</p>
                <p className="text-zinc-400 flex items-center"><Check className="w-3 h-3 text-emerald-400 inline mr-1.5 shrink-0" /><span>Found 6 public repositories [api-service, frontend-app, ml-pipeline, dotfiles, utils-cli, docs]</span></p>
                <p className="text-cyan-400">&gt; Executing Hygiene Scanner...</p>
                <p className="text-amber-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 text-amber-400 inline mr-1.5 shrink-0" />
                  <span>api-service: Missing standard LICENSE file</span>
                </p>
                <p className="text-amber-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 text-amber-400 inline mr-1.5 shrink-0" />
                  <span>ml-pipeline: Missing root .gitignore file</span>
                </p>
                <p className="text-red-400 font-bold">&gt; Executing TruffleHog Filesystem Scanner v3.63...</p>
                <p className="text-red-400 flex items-center">
                  <KeyRound className="w-3.5 h-3.5 text-red-400 inline mr-1.5 shrink-0" />
                  <span>CRITICAL FINDING: Identified AWS Access Key in repo 'api-service/config/aws.json' [line 14]</span>
                </p>
                <p className="text-emerald-400 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline mr-1.5 shrink-0" />
                  <span>Absolute Redaction Engine: Secret stripped from memory: 'AKIA... [REDACTED]'</span>
                </p>
                <p className="text-purple-400">&gt; Executing Semgrep Rule Pack (auto)...</p>
                <p className="text-amber-300 flex items-center"><AlertTriangle className="w-3 h-3 text-amber-300 inline mr-1.5 shrink-0" /><span>frontend-app: Hardcoded localhost binding detected in production build</span></p>
                <p className="text-emerald-400">&gt; Invoking Hugging Face AI Synthesis Model (Qwen2.5-Coder-32B)...</p>
                <p className="text-white font-bold bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex items-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-emerald-400 inline mr-2 shrink-0 animate-pulse" />
                  <span>Profile Health Score Synthesized: <span className="text-emerald-400 text-sm ml-1.5 font-extrabold">88 / 100</span> (Strong Senior Profile with 1 Security Risk)</span>
                  <span className="inline-block w-2 h-4 bg-emerald-400 ml-2 animate-cursor"></span>
                </p>
              </div>
            )}

            {/* TAB 2: FINDINGS PREVIEW */}
            {demoTab === 'findings' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-850">
                  <span>Discovered Audit Findings (3 Total)</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Secrets Auto-Redacted</span>
                  </span>
                </div>

                {/* Finding 1: Secret */}
                <div className="p-3 bg-red-950/20 border border-red-900/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500 text-black rounded uppercase">Critical Secret</span>
                    <span className="text-zinc-500 font-mono text-[10px]">api-service/config/aws.json:14</span>
                  </div>
                  <p className="font-bold text-white text-xs">AWS Access Key ID Leaked in Commit</p>
                  <p className="text-zinc-400 text-[11px]">
                    Raw Secret: <code className="bg-black px-2 py-0.5 rounded text-emerald-400 font-mono">AKIA... [REDACTED_BY_AUDITOR]</code>
                  </p>
                </div>

                {/* Finding 2: Hygiene */}
                <div className="p-3 bg-amber-950/20 border border-amber-900/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500 text-black rounded uppercase">Git Hygiene</span>
                    <span className="text-zinc-500 font-mono text-[10px]">ml-pipeline/</span>
                  </div>
                  <p className="font-bold text-white text-xs">Missing Standard .gitignore File</p>
                  <p className="text-zinc-400 text-[11px]">Risk of committing virtualenv and local cache binaries.</p>
                </div>

                {/* Finding 3: Code Smell */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-zinc-700 text-zinc-300 rounded uppercase">Code Smell</span>
                    <span className="text-zinc-500 font-mono text-[10px]">frontend-app/src/api.js:42</span>
                  </div>
                  <p className="font-bold text-white text-xs">Semgrep: Hardcoded Localhost API URL</p>
                  <p className="text-zinc-400 text-[11px]">Replace hardcoded string with environment variable `VITE_API_URL`.</p>
                </div>
              </div>
            )}

            {/* TAB 3: SCORECARD */}
            {demoTab === 'scorecard' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Gauge Box */}
                  <div className="bg-black border border-zinc-850 p-4 rounded-xl text-center space-y-2 flex flex-col items-center justify-center">
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-emerald-500 shadow-lg">
                      <span className="text-2xl font-extrabold text-white">88</span>
                      <span className="text-[10px] text-zinc-400 block font-mono">/100</span>
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-zinc-900 text-emerald-300 rounded-full border border-zinc-800 uppercase">
                      Strong Profile
                    </span>
                  </div>

                  {/* Recruiter Evaluation */}
                  <div className="md:col-span-2 bg-black border border-zinc-850 p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-emerald-400 text-xs flex items-center">
                      <Cpu className="w-4 h-4 text-emerald-400 mr-1.5" />
                      <span>AI Recruiter Assessment</span>
                    </h4>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      "Candidate demonstrates excellent commit consistency, clean documentation structure, and strong modularity across 6 repositories. Resolving 1 committed AWS credential and adding a missing LICENSE file will bring profile health to 96/100."
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Recruiter Damage Index: <strong className="text-amber-400">Low (1 minor patch needed)</strong></span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Audit Shield Generated</span>
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: AUTO-FIX PATCH */}
            {demoTab === 'patches' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-850">
                  <span>Generated Unified Patch File</span>
                  <span className="text-emerald-400 font-mono text-[11px]">ml-pipeline-missing-gitignore.patch</span>
                </div>

                <pre className="p-3 bg-black border border-zinc-850 rounded-xl text-emerald-400 text-[11px] overflow-x-auto">
{`--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,12 @@
+# Python cache files
+__pycache__/
+*.py[cod]
+*$py.class
+
+# Virtual Environments
+venv/
+env/
+.venv/
+
+# Environment variables
+.env`}
                </pre>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Apply with: <code className="text-zinc-300">git apply patchfile.patch</code></span>
                  <button className="px-3 py-1.5 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition flex items-center space-x-1">
                    <Wrench className="w-3.5 h-3.5 text-black" />
                    <span>Download .patch File</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* HEALTH SCORE WEIGHT ARCHITECTURE */}
      <section className="max-w-5xl mx-auto space-y-8 animate-slide-up-2">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Scoring Engine</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">How Profile Health is Weighted</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Secret Security</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">40% Weight</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[40%] rounded-full"></div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Detects exposed AWS, Stripe, GitHub, and API tokens across commit history.
            </p>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Repository Hygiene</span>
              <span className="font-mono text-cyan-400 font-bold text-xs">30% Weight</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full w-[30%] rounded-full"></div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Evaluates presence of standard LICENSE, root .gitignore, and README documentation.
            </p>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Code Quality</span>
              <span className="font-mono text-purple-400 font-bold text-xs">30% Weight</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full w-[30%] rounded-full"></div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Scans for hardcoded localhost URLs, debug statements, and build smells via Semgrep.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE RECRUITER RISK SIMULATOR */}
      <section className="max-w-5xl mx-auto space-y-8 animate-slide-up-2">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Interactive Simulator</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Test Your Profile Score Impact</h2>
          <p className="text-xs text-zinc-400 font-mono max-w-lg mx-auto">Toggle common repository security flaws to see how automated recruiter scanners rank your profile health.</p>
        </div>

        <div className="bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-850 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
          {/* Risk Toggles (7 cols) */}
          <div className="lg:col-span-7 space-y-3 font-mono">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block pb-1">Toggle Profile Security Conditions:</span>

            <button
              type="button"
              onClick={() => toggleRiskItem('hasSecrets')}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between ${
                riskItems.hasSecrets 
                  ? 'bg-red-950/40 border-red-800/80 text-red-300' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${riskItems.hasSecrets ? 'text-red-400' : 'text-zinc-500'}`} />
                <span>Exposed API Keys / AWS Secrets (-40 pts)</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono ${riskItems.hasSecrets ? 'bg-red-900/60 text-red-200' : 'bg-zinc-800 text-zinc-500'}`}>
                {riskItems.hasSecrets ? 'EXPOSED' : 'CLEAN'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleRiskItem('missingGitignore')}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between ${
                riskItems.missingGitignore 
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileCode className={`w-4 h-4 shrink-0 ${riskItems.missingGitignore ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span>Missing Root .gitignore (-15 pts)</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono ${riskItems.missingGitignore ? 'bg-amber-900/60 text-amber-200' : 'bg-zinc-800 text-zinc-500'}`}>
                {riskItems.missingGitignore ? 'MISSING' : 'PRESENT'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleRiskItem('hardcodedUrls')}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between ${
                riskItems.hardcodedUrls 
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Terminal className={`w-4 h-4 shrink-0 ${riskItems.hardcodedUrls ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span>Hardcoded Localhost URLs (-20 pts)</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono ${riskItems.hardcodedUrls ? 'bg-amber-900/60 text-amber-200' : 'bg-zinc-800 text-zinc-500'}`}>
                {riskItems.hardcodedUrls ? 'DETECTED' : 'CLEAN'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleRiskItem('missingLicense')}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between ${
                riskItems.missingLicense 
                  ? 'bg-purple-950/40 border-purple-800/80 text-purple-300' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${riskItems.missingLicense ? 'text-purple-400' : 'text-zinc-500'}`} />
                <span>Missing Open-Source License (-10 pts)</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono ${riskItems.missingLicense ? 'bg-purple-900/60 text-purple-200' : 'bg-zinc-800 text-zinc-500'}`}>
                {riskItems.missingLicense ? 'MISSING' : 'PRESENT'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleRiskItem('noReadme')}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between ${
                riskItems.noReadme 
                  ? 'bg-purple-950/40 border-purple-800/80 text-purple-300' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock className={`w-4 h-4 shrink-0 ${riskItems.noReadme ? 'text-purple-400' : 'text-zinc-500'}`} />
                <span>Empty / Missing README.md (-15 pts)</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono ${riskItems.noReadme ? 'bg-purple-900/60 text-purple-200' : 'bg-zinc-800 text-zinc-500'}`}>
                {riskItems.noReadme ? 'MISSING' : 'PRESENT'}
              </span>
            </button>
          </div>

          {/* Dynamic Score Output Display (5 cols) */}
          <div className="lg:col-span-5 bg-black p-6 rounded-2xl border border-zinc-800 text-center space-y-4 font-mono">
            <span className="text-xs text-zinc-400 uppercase tracking-widest block font-bold">Simulated Health Score</span>
            
            <div className="text-5xl sm:text-6xl font-black transition-all">
              <span className={calcScore() >= 80 ? 'text-emerald-400' : calcScore() >= 50 ? 'text-amber-400' : 'text-red-400'}>
                {calcScore()}
              </span>
              <span className="text-2xl text-zinc-600">/100</span>
            </div>

            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs">
              <span className="text-zinc-400 block pb-1">Recruiter Risk Tier:</span>
              <span className={`font-extrabold uppercase ${calcScore() >= 80 ? 'text-emerald-400' : calcScore() >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {calcScore() >= 80 ? 'Optimal (Top Profile)' : calcScore() >= 50 ? 'Moderate Risk' : 'Critical Risk'}
              </span>
            </div>

            <button
              onClick={onStartRegister}
              className="w-full py-3 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-zinc-200 transition shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Scan Your Actual Profile Now</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </section>

      {/* STEP-BY-STEP AUDIT WORKFLOW */}
      <section className="max-w-5xl mx-auto space-y-10 animate-slide-up-3">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Automated Pipeline</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">4-Stage Static Analysis Pass</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-zinc-950 p-5 rounded-2xl space-y-3 border border-zinc-850">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-emerald-400">STAGE 01</span>
              <span className="text-zinc-600">01/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">Repo Discovery</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enumerates public non-fork repositories via GitHub REST API with rate limit handling.
            </p>
          </div>

          <div className="bg-zinc-950 p-5 rounded-2xl space-y-3 border border-zinc-850">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-cyan-400">STAGE 02</span>
              <span className="text-zinc-600">02/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">Static Engine Pass</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Executes TruffleHog secret detector, Semgrep rules, and hygiene checks concurrently.
            </p>
          </div>

          <div className="bg-zinc-950 p-5 rounded-2xl space-y-3 border border-zinc-850">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-purple-400">STAGE 03</span>
              <span className="text-zinc-600">03/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">In-Memory Redaction</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Strips secret strings in temporary RAM before writing findings to database.
            </p>
          </div>

          <div className="bg-zinc-950 p-5 rounded-2xl space-y-3 border border-zinc-850">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-amber-400">STAGE 04</span>
              <span className="text-zinc-600">04/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">AI Score &amp; Patches</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generates overall health score (0-100), top resume risks, and downloadable patches.
            </p>
          </div>

        </div>
      </section>

      {/* EMBEDDABLE BADGE PREVIEW SECTION */}
      <section className="max-w-4xl mx-auto bg-zinc-950 p-8 rounded-3xl border border-zinc-850 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 text-emerald-400 rounded-full border border-zinc-800">
              FEATURE
            </span>
            <h3 className="text-2xl font-extrabold text-white">Embeddable README Health Shield</h3>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Showcase your verified profile score directly on your GitHub Profile README. Automatically updates with your latest scan.
            </p>
          </div>

          {/* Live Badge Component */}
          <div className="shrink-0 p-4 bg-black rounded-2xl border border-zinc-800 text-center space-y-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Live SVG Badge Preview</span>
            <div className="inline-flex items-center rounded-md overflow-hidden font-mono text-xs font-bold shadow-md">
              <span className="bg-zinc-800 text-white badge-dark-label px-3 py-1.5 flex items-center space-x-1.5">
                <span>octocat</span>
              </span>
              <span className="bg-emerald-500 text-black badge-green-label px-3 py-1.5">
                <span>health: 88/100</span>
              </span>
            </div>
          </div>
        </div>

        {/* Copyable Markdown Box */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Copy Markdown for your README.md</span>
            {copied && <span className="text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> <span>Copied to clipboard!</span></span>}
          </div>
          <div className="p-3 bg-black border border-zinc-850 rounded-xl flex items-center justify-between text-zinc-300">
            <code className="truncate pr-4 text-emerald-400 text-xs">{badgeMarkdown}</code>
            <button
              onClick={handleCopyBadge}
              className="copy-btn-dark px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Common Questions</span>
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          
          {/* FAQ 1 */}
          <div className="bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>Are my GitHub tokens or passwords stored?</span>
              <span className={`text-emerald-400 font-mono transition-transform duration-200 ${activeFaq === 1 ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>
            {activeFaq === 1 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900">
                No. If you provide a GitHub access token to lift rate limits during scanning, it is processed strictly in temporary worker RAM for API requests and is never saved to the database.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>What happens if a secret or API key is found in my repository?</span>
              <span className={`text-emerald-400 font-mono transition-transform duration-200 ${activeFaq === 2 ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>
            {activeFaq === 2 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900">
                Our Absolute Secret Redaction engine immediately sanitizes raw secret strings in memory (e.g. replacing them with `[REDACTED]`). Only file paths, rule identifiers, and line numbers are saved.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>Do you access or clone my private repositories?</span>
              <span className={`text-emerald-400 font-mono transition-transform duration-200 ${activeFaq === 3 ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>
            {activeFaq === 3 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900">
                By default, the auditor only enumerates public, non-fork repositories accessible on GitHub. Private repositories are never touched or scanned.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 4 ? null : 4)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>How are the 1-Click Auto-Fix patches generated?</span>
              <span className={`text-emerald-400 font-mono transition-transform duration-200 ${activeFaq === 4 ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>
            {activeFaq === 4 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900">
                When a missing file (such as a LICENSE or .gitignore) is flagged, the system creates a standard unified `.patch` file. You can download and apply it to your repository using `git apply patchfile.patch`.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* BOTTOM HERO CTA BANNER */}
      <section className="max-w-4xl mx-auto text-center bg-zinc-950 p-10 rounded-3xl border border-zinc-850 space-y-6 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Audit Your GitHub Profile?</h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-mono">
            Scan your public repositories, sanitize security leaks, and elevate your recruiter profile score.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10 pt-2 font-mono">
          <button
            onClick={onStartRegister}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
          <button
            onClick={onGitHubOAuth}
            className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-zinc-200 text-xs transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Continue with GitHub</span>
          </button>
        </div>
      </section>

      {/* RICH MODERN DEVELOPER FOOTER */}
      <footer className="mt-16 border-t border-zinc-850 pt-14 pb-10 bg-black font-mono text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand & Developer Bio (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="GitHub Profile Auditor Logo" 
                className="w-8 h-8 rounded-xl object-cover border border-zinc-800 bg-zinc-950 shrink-0" 
              />
              <span className="font-extrabold text-white text-base tracking-tight font-sans">
                GitHub Profile Auditor
              </span>
              <span className="px-2.5 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 font-mono font-bold rounded-full border border-emerald-800/80 uppercase tracking-wider">
                BETA
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm font-sans">
              Automated multi-engine static analysis for public GitHub profiles. Intercept committed credentials, clean repository hygiene debt, and boost your recruiter hiring rank.
            </p>
            
            {/* Developer Contact Quick Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href="https://www.linkedin.com/in/jaggureddy/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition flex items-center space-x-2 text-[11px] font-bold"
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://github.com/jaggureddy11"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition flex items-center space-x-2 text-[11px] font-bold"
              >
                <GithubIcon className="w-3.5 h-3.5 text-zinc-300" />
                <span>GitHub</span>
              </a>
              <a
                href="mailto:jaggureddy2004@gmail.com"
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition flex items-center space-x-2 text-[11px] font-bold"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* Engine Features (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Analysis Engines</h4>
            <ul className="space-y-2 text-zinc-400 text-[11px]">
              <li className="flex items-center space-x-1.5 hover:text-zinc-200 transition">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>TruffleHog Redaction</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-zinc-200 transition">
                <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Semgrep AST Hygiene</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-zinc-200 transition">
                <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                <span>AI Recruiter Score</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-zinc-200 transition">
                <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Unified .patch Fixes</span>
              </li>
              <li className="flex items-center space-x-1.5 hover:text-zinc-200 transition">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>README Health Shield</span>
              </li>
            </ul>
          </div>

          {/* Security & System Info (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Security Architecture</h4>
            <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-semibold">Clone RAM Wiping:</span>
                <span className="text-emerald-400 font-bold">100% In-Memory</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-semibold">Stored Credentials:</span>
                <span className="text-emerald-400 font-bold">0 Secrets Saved</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-semibold">Scanner Queue:</span>
                <span className="text-cyan-400 font-bold">Redis Ephemeral</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
              Designed for open-source software engineers, security auditors, and recruiters.
            </p>
          </div>

        </div>

        {/* Sub-Footer Copyright Bar */}
        <div className="max-w-6xl mx-auto px-4 mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} R Jagadishwar R (jaggureddy11). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400 font-bold">All Engines Operational</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
