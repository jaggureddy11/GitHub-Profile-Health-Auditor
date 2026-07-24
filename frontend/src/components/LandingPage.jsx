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
  EyeOff
} from 'lucide-react';

export default function LandingPage({ onStartRegister, onGitHubOAuth, onStartQuickScan }) {
  const [quickUsername, setQuickUsername] = useState('');
  const [demoTab, setDemoTab] = useState('terminal'); // 'terminal', 'findings', 'scorecard', 'patches'
  const [activeFaq, setActiveFaq] = useState(null);
  const [copied, setCopied] = useState(false);

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
    <div className="space-y-16 sm:space-y-24 lg:space-y-28 py-4 sm:py-6 text-white relative overflow-hidden font-sans">
      
      {/* Background Subtle Grid & Ambient Radial Beam */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none -z-10"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-950/25 via-zinc-900/10 to-transparent blur-[160px] rounded-full pointer-events-none -z-10"></div>

      {/* Expansive Ambient Octocat Watermark Artwork (Lifted Higher Position) */}
      <div className="absolute -top-6 sm:-top-10 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[720px] pointer-events-none z-0 flex items-center justify-center opacity-[0.10] sm:opacity-[0.13] select-none">
        <img 
          src="/octocat-user-outline.png" 
          alt="GitHub Profile Auditor Background Artwork" 
          className="w-[660px] sm:w-[840px] lg:w-[960px] max-w-none transform -translate-y-8 sm:-translate-y-12" 
        />
      </div>


      {/* HERO SECTION - DEVELOPER-GRADE ELEGANCE */}
      <section className="text-center space-y-9 max-w-4xl mx-auto pt-2 sm:pt-4 relative z-10 animate-fade-in">
        
        {/* Version Badge */}
        <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-full text-xs font-mono text-zinc-300 shadow-lg backdrop-blur-md hover:border-zinc-700 transition duration-200 cursor-default">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="font-semibold text-zinc-200 tracking-wider text-[11px] uppercase">SECURITY ENGINE (BETA)</span>
          <span className="text-zinc-700 font-bold">•</span>
          <span className="text-zinc-400 font-medium flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero-Secret Retention</span>
          </span>
        </div>

        {/* High-Impact Headline */}
        <div className="space-y-4 relative">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-sans">
            Uncover Leaked Secrets. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Elevate Profile Security.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal pt-1">
            Automated static analysis across public GitHub repositories. Intercept committed API credentials, fix Git hygiene debt, and generate 1-click patches.
          </p>
        </div>

        {/* Developer Command Line Search Box */}
        <div className="pt-2 max-w-2xl mx-auto space-y-4">
          <form 
            onSubmit={handleQuickSubmit} 
            className="bg-zinc-950/90 p-2 rounded-2xl border border-zinc-800 shadow-2xl focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all duration-200 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative w-full flex items-center pl-3">
              <Search className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />
              <span className="text-zinc-500 font-mono text-xs font-semibold select-none shrink-0 pr-1">
                github.com/
              </span>
              <input
                type="text"
                placeholder="username (e.g. octocat)"
                value={quickUsername}
                onChange={(e) => setQuickUsername(e.target.value)}
                className="w-full py-3 bg-transparent text-white placeholder-zinc-600 focus:outline-none font-mono text-xs text-left"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Audit Profile</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>
          </form>

          {/* Quick Target Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-xs text-zinc-500">
            <span className="text-[11px] text-zinc-500">Try sample:</span>
            {['octocat', 'torvalds', 'gaearon', 'sindresorhus'].map((sampleUser) => (
              <button
                key={sampleUser}
                type="button"
                onClick={() => {
                  setQuickUsername(sampleUser);
                  if (onStartQuickScan) onStartQuickScan(sampleUser);
                  else onStartRegister();
                }}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-[11px] transition duration-150"
              >
                @{sampleUser}
              </button>
            ))}
          </div>

          {/* Trust Highlights */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-zinc-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant 10s Audit</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>In-Memory Redaction</span>
            </span>
            <button 
              onClick={onGitHubOAuth}
              className="text-zinc-400 hover:text-white underline font-semibold transition duration-200 flex items-center space-x-1"
            >
              <span>Log in with GitHub</span>
            </button>
          </div>
        </div>
      </section>

      {/* METRICS TRUST BANNER */}
      <section className="max-w-5xl mx-auto border-y border-zinc-900 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono animate-slide-up-1">
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-white block">100%</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">In-Memory Secret Redaction</span>
        </div>
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-emerald-400 block">&lt; 10s</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">Average Scan Runtime</span>
        </div>
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-white block">3 Engines</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">TruffleHog • Semgrep • Hygiene</span>
        </div>
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-cyan-400 block">0</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">Credentials Stored</span>
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
                <p className="text-emerald-400">➜ GitHub REST API: Enumerating public non-fork repositories for user @octocat</p>
                <p className="text-zinc-400 flex items-center"><Check className="w-3 h-3 text-emerald-400 inline mr-1.5 shrink-0" /><span>Found 6 public repositories [api-service, frontend-app, ml-pipeline, dotfiles, utils-cli, docs]</span></p>
                <p className="text-cyan-400">➜ Executing Hygiene Scanner...</p>
                <p className="text-amber-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 text-amber-400 inline mr-1.5 shrink-0" />
                  <span>api-service: Missing standard LICENSE file</span>
                </p>
                <p className="text-amber-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 text-amber-400 inline mr-1.5 shrink-0" />
                  <span>ml-pipeline: Missing root .gitignore file</span>
                </p>
                <p className="text-red-400 font-bold">➜ Executing TruffleHog Filesystem Scanner v3.63...</p>
                <p className="text-red-400 flex items-center">
                  <KeyRound className="w-3.5 h-3.5 text-red-400 inline mr-1.5 shrink-0" />
                  <span>CRITICAL FINDING: Identified AWS Access Key in repo 'api-service/config/aws.json' [line 14]</span>
                </p>
                <p className="text-emerald-400 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline mr-1.5 shrink-0" />
                  <span>Absolute Redaction Engine: Secret stripped from memory: 'AKIA... [REDACTED]'</span>
                </p>
                <p className="text-purple-400">➜ Executing Semgrep Rule Pack (auto)...</p>
                <p className="text-amber-300 flex items-center"><AlertTriangle className="w-3 h-3 text-amber-300 inline mr-1.5 shrink-0" /><span>frontend-app: Hardcoded localhost binding detected in production build</span></p>
                <p className="text-emerald-400">➜ Invoking Hugging Face AI Synthesis Model (Qwen2.5-Coder-32B)...</p>
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
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Live SVG Badge Preview</span>
            <div className="inline-flex items-center rounded-md overflow-hidden font-mono text-xs font-bold shadow-md">
              <span className="bg-zinc-800 text-white px-3 py-1.5 flex items-center space-x-1.5">
                <span>octocat</span>
              </span>
              <span className="bg-emerald-500 text-black px-3 py-1.5">
                health: 88/100
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
              className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center space-x-1.5"
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

    </div>
  );
}
