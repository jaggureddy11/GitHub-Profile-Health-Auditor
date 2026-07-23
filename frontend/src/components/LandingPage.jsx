import React, { useState } from 'react';
import { 
  Zap, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  Wrench, 
  Cpu, 
  Lock, 
  Shield, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Copy, 
  CheckCircle2, 
  Plus, 
  Minus, 
  ArrowRight, 
  FileCode2, 
  KeyRound, 
  FileText
} from 'lucide-react';

export default function LandingPage({ onStartRegister, onGitHubOAuth, onStartQuickScan }) {
  const [quickUsername, setQuickUsername] = useState('');
  const [demoTab, setDemoTab] = useState('terminal'); // 'terminal', 'findings', 'scorecard', 'patches'
  const [activeFaq, setActiveFaq] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (quickUsername.trim()) {
      if (onStartQuickScan) {
        onStartQuickScan(quickUsername.trim());
      } else {
        onStartRegister();
      }
    }
  };

  const badgeMarkdown = `![GitHub Profile Health](https://img.shields.io/badge/Profile_Health-88%2F100-10B981?style=for-the-badge&logo=github)`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-24 py-6 text-white relative overflow-hidden font-sans">
      
      {/* Background Decorative Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none -z-10"></div>
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-600/15 via-cyan-500/10 to-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10 animate-pulse-glow"></div>
      <div className="absolute top-[600px] left-1/4 w-[500px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* HERO SECTION */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-4 relative">
        
        {/* Live Status Badge */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 bg-zinc-900/90 border border-zinc-800/80 rounded-full text-xs font-mono text-zinc-300 shadow-xl shadow-black/40 backdrop-blur-md hover:border-zinc-700 transition cursor-default">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-medium">Static Security Analysis &amp; AI Synthesis Engine v2.0</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            Zero-Secret Retention
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
          Audit &amp; Elevate Your <br />
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            GitHub Profile Health
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Intercept committed API credentials, resolve Git hygiene technical debt, and discover code smells. Receive AI recruiter-aligned health scores and 1-click unified code patches.
        </p>

        {/* Instant Scan Quick Bar */}
        <div className="pt-4 max-w-xl mx-auto">
          <form onSubmit={handleQuickSubmit} className="glass-card p-2 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full flex items-center">
              <span className="absolute left-4 text-zinc-500 font-mono text-xs">github.com/</span>
              <input
                type="text"
                placeholder="username (e.g. octocat)"
                value={quickUsername}
                onChange={(e) => setQuickUsername(e.target.value)}
                className="w-full pl-24 pr-4 py-3 bg-black/60 border border-zinc-850 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 font-mono text-xs transition"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 shimmer-btn transition active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <span>Scan Profile</span>
              <Zap className="w-3.5 h-3.5 text-black fill-black" />
            </button>
          </form>
          
          <div className="mt-3 flex items-center justify-center space-x-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> 
              <span>No installation needed</span>
            </span>
            <span>•</span>
            <button 
              onClick={onGitHubOAuth}
              className="text-zinc-400 hover:text-white underline font-medium transition flex items-center space-x-1 inline-flex"
            >
              <span>Log in with GitHub</span>
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE LIVE AUDIT DEMO TERMINAL */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Interactive Product Preview</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">See the Security Auditor Engine in Action</h2>
        </div>

        {/* Mock Window Container */}
        <div className="glass-card rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Top Bar with macOS Window Dots & Tabs */}
          <div className="bg-black/80 border-b border-zinc-850 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-xs font-mono text-zinc-500 ml-2 hidden sm:inline">auditor-engine --target @octocat</span>
            </div>

            {/* Interactive Tab Controls */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-850 text-xs font-mono overflow-x-auto max-w-full">
              <button
                onClick={() => setDemoTab('terminal')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'terminal' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Execution</span>
              </button>
              <button
                onClick={() => setDemoTab('findings')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'findings' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Secret &amp; Code Findings</span>
              </button>
              <button
                onClick={() => setDemoTab('scorecard')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'scorecard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Health Score</span>
              </button>
              <button
                onClick={() => setDemoTab('patches')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                  demoTab === 'patches' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Fix Patch</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 bg-black/90 font-mono text-xs min-h-[320px]">
            
            {/* TAB 1: TERMINAL LOGS */}
            {demoTab === 'terminal' && (
              <div className="space-y-3 leading-relaxed text-zinc-300">
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
                <p className="text-white font-bold bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 flex items-center">
                  <Sparkles className="w-4 h-4 text-emerald-400 inline mr-2 shrink-0" />
                  <span>Profile Health Score Synthesized: <span className="text-emerald-400 text-sm ml-1">88 / 100</span> (Strong Senior Profile with 1 Security Risk)</span>
                </p>
              </div>
            )}

            {/* TAB 2: FINDINGS PREVIEW */}
            {demoTab === 'findings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-850">
                  <span>Audited Discovered Issues (3 Total)</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
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
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Gauge Box */}
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center space-y-2 flex flex-col items-center justify-center">
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-emerald-500 shadow-lg shadow-emerald-500/20">
                      <span className="text-2xl font-extrabold text-white">88</span>
                      <span className="text-[10px] text-zinc-400 block font-mono">/100</span>
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 rounded-full border border-emerald-800 uppercase">
                      Strong Profile
                    </span>
                  </div>

                  {/* Recruiter Evaluation */}
                  <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-emerald-400 text-xs flex items-center">
                      <Cpu className="w-4 h-4 text-emerald-400 mr-1.5" />
                      <span>AI Recruiter Assessment</span>
                    </h4>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      "Candidate demonstrates excellent commit consistency, clean documentation structure, and strong modularity across 6 repositories. Resolving 1 committed AWS credential and adding a missing LICENSE file will bring profile health to 96/100."
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Recruiter Damage Index: <strong className="text-amber-400">Low (1 minor patch needed)</strong></span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                    <span>Verified Audit Shield Generated</span>
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: AUTO-FIX PATCH */}
            {demoTab === 'patches' && (
              <div className="space-y-3">
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

      {/* TRUST & ZERO-KNOWLEDGE PROOF GRID */}
      <section className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Security Architecture</span>
          <h2 className="text-3xl font-extrabold text-white">Built for Complete Trust &amp; Privacy</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            We treat your code with military-grade privacy. Security scans run inside isolated ephemeral memory containers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">100% In-Memory Secret Redaction</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              TruffleHog extracts raw credentials to verify validity, then wipes secret values from worker RAM before writing to DB.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Ephemeral Clone Memory</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Temporary repository checkout directories are destroyed within milliseconds of completing static hygiene and semgrep passes.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Multi-Tenant Isolation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Database rows are bound directly to verified user IDs with strict row-level authorization and cascade deletion on account removal.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">1-Click Auto-Fix Patches</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly download unified `.patch` files to apply standard MIT licenses, `.gitignore`, and README skeletons directly to Git.
            </p>
          </div>

        </div>
      </section>

      {/* STEP-BY-STEP AUDIT WORKFLOW */}
      <section className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">How It Works</span>
          <h2 className="text-3xl font-extrabold text-white">4-Stage Automated Pipeline</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1 */}
          <div className="glass-card p-5 rounded-2xl space-y-3 border border-zinc-850 relative">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-emerald-400">STEP 01</span>
              <span className="text-zinc-600">01/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">Public Repo Discovery</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enumerates all non-fork public repositories via GitHub REST API with rate-limit protection.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card p-5 rounded-2xl space-y-3 border border-zinc-850 relative">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-emerald-400">STEP 02</span>
              <span className="text-zinc-600">02/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">Static Engine Pass</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Executes TruffleHog secret detector, Semgrep rules, and Git hygiene checks concurrently.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card p-5 rounded-2xl space-y-3 border border-zinc-850 relative">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-emerald-400">STEP 03</span>
              <span className="text-zinc-600">03/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">In-Memory Redaction</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Identifies credential line positions and strips raw secret values before database storage.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-card p-5 rounded-2xl space-y-3 border border-zinc-850 relative">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-emerald-400">STEP 04</span>
              <span className="text-zinc-600">04/04</span>
            </div>
            <h3 className="font-bold text-white text-sm">AI Score &amp; Patches</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generates overall score (0-100), top resume risks, and downloadable unified `.patch` fixes.
            </p>
          </div>

        </div>
      </section>

      {/* EMBEDDABLE BADGE PREVIEW SECTION */}
      <section className="max-w-4xl mx-auto glass-card p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800">
              NEW FEATURE
            </span>
            <h3 className="text-2xl font-extrabold text-white">Embeddable README Health Shield</h3>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Showcase your verified profile score directly on your GitHub Profile README. Automatically updates with your latest scan.
            </p>
          </div>

          {/* Live Badge Component */}
          <div className="shrink-0 p-4 bg-black/80 rounded-2xl border border-zinc-800 text-center space-y-3">
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
            {copied && <span className="text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-3.5 h-3.5 text-emerald-400 inline" /> <span>Copied to clipboard!</span></span>}
          </div>
          <div className="p-3 bg-black border border-zinc-850 rounded-xl flex items-center justify-between text-zinc-300">
            <code className="truncate pr-4 text-emerald-400">{badgeMarkdown}</code>
            <button
              onClick={handleCopyBadge}
              className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center space-x-1"
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
          <div className="glass-card rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>Are my GitHub tokens or passwords stored?</span>
              <span className="text-emerald-400 font-mono">{activeFaq === 1 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
            </button>
            {activeFaq === 1 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900/60">
                No. If you provide a GitHub access token to lift rate limits during scanning, it is processed strictly in temporary worker RAM for API requests and is never saved to the database.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="glass-card rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>What happens if a secret or API key is found in my repository?</span>
              <span className="text-emerald-400 font-mono">{activeFaq === 2 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
            </button>
            {activeFaq === 2 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900/60">
                Our Absolute Secret Redaction engine immediately sanitizes raw secret strings in memory (e.g. replacing them with `[REDACTED]`). Only file paths, rule identifiers, and line numbers are saved.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="glass-card rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>Do you access or clone my private repositories?</span>
              <span className="text-emerald-400 font-mono">{activeFaq === 3 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
            </button>
            {activeFaq === 3 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900/60">
                By default, the auditor only enumerates public, non-fork repositories accessible on GitHub. Private repositories are never touched or scanned.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="glass-card rounded-2xl border border-zinc-850 overflow-hidden transition">
            <button
              onClick={() => setActiveFaq(activeFaq === 4 ? null : 4)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between"
            >
              <span>How are the 1-Click Auto-Fix patches generated?</span>
              <span className="text-emerald-400 font-mono">{activeFaq === 4 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
            </button>
            {activeFaq === 4 && (
              <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-900/60">
                When a missing file (such as a LICENSE or .gitignore) is flagged, the system creates a standard unified `.patch` file. You can download and apply it to your repository using `git apply patchfile.patch`.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* BOTTOM HERO CTA BANNER */}
      <section className="max-w-4xl mx-auto text-center glass-card p-10 rounded-3xl border border-zinc-800 space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none"></div>
        <div className="space-y-3 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Audit Your GitHub Profile?</h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Create a free account or log in with GitHub to scan your public repositories, fix security leaks, and boost your profile score.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
          <button
            onClick={onStartRegister}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-black font-bold text-sm rounded-xl shadow-xl shadow-emerald-500/20 shimmer-btn transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
          <button
            onClick={onGitHubOAuth}
            className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-zinc-200 text-sm transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Continue with GitHub</span>
          </button>
        </div>
      </section>

    </div>
  );
}
