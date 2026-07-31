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
  XCircle,
  Mail,
  ExternalLink,
  Globe,
  Star,
  GitBranch,
  Code,
  Shield
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
  const [demoTab, setDemoTab] = useState('terminal');
  const [activeFaq, setActiveFaq] = useState(null);
  const [copied, setCopied] = useState(false);

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
    if (raw.includes('github.com/')) {
      raw = raw.split('github.com/')[1].split('/')[0];
    }
    raw = raw.replace(/^@/, '').trim();
    if (raw) onStartQuickScan(raw);
  };

  const badgeMarkdown = `![GitHub Profile Health](https://img.shields.io/badge/Profile_Health-88%2F100-10B981?style=for-the-badge&logo=github)`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = calcScore();
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreTier = score >= 80 ? 'Optimal (Top Profile)' : score >= 50 ? 'Moderate Risk' : 'Critical Risk';

  return (
    <div className="w-full text-slate-900 dark:text-white relative font-sans transition-colors duration-200">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 px-4">
        {/* Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-slate-200/20 dark:via-zinc-900/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
        
        {/* Watermark octocat */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[480px] pointer-events-none z-0 flex items-center justify-center opacity-[0.06] select-none">
          <img
            src="/octocat-user-outline.png"
            alt=""
            className="w-[500px] sm:w-[700px] max-w-none object-contain dark:invert-0 invert"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Multi-engine Static Security Analysis
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.06] font-display animate-fade-in">
            <span className="text-slate-900 dark:text-white block">Uncover Leaked Secrets.</span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent block pt-1">
              Elevate Profile Security.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed tracking-tight animate-slide-up-1">
            Automated static analysis across public GitHub repositories. Intercept committed API credentials, fix Git hygiene debt, and generate 1-click auto-fix patches.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto space-y-4 animate-slide-up-1">
            <form
              onSubmit={handleQuickSubmit}
              className="flex flex-col sm:flex-row items-stretch gap-2.5 bg-white/90 dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 shadow-xl dark:shadow-2xl focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all duration-300 backdrop-blur-xl"
            >
              <div className="flex items-center flex-1 px-3 gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="text-slate-500 dark:text-zinc-600 font-mono text-xs sm:text-sm font-semibold select-none shrink-0">github.com/</span>
                <input
                  type="text"
                  id="hero-username-input"
                  placeholder="username or full repo URL"
                  value={quickUsername}
                  onChange={(e) => setQuickUsername(e.target.value)}
                  className="flex-1 min-w-0 py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none font-mono text-xs sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-extrabold text-sm rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Audit Profile</span>
                <ArrowRight className="w-4 h-4 text-white dark:text-black" />
              </button>
            </form>

            {/* Featured profile chips */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">Try:</span>
              {['torvalds', 'gaearon', 'octocat'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setQuickUsername(u); if (onStartQuickScan) onStartQuickScan(u); }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 hover:border-zinc-700 text-xs font-mono font-semibold transition-all duration-150 active:scale-95"
                >
                  @{u}
                </button>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-zinc-500 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Instant ~10s Audit
              </span>
              <span className="flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-cyan-500" />
                In-Memory Redaction
              </span>
              <button
                onClick={onGitHubOAuth}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-150 font-semibold underline underline-offset-2"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                Log in with GitHub
              </button>
              <a
                href="https://github.com/jaggureddy11/GitHub-Profile-Health-Auditor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-150 font-semibold underline underline-offset-2 ml-2"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                Source Code
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS TRUST BANNER ─────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto border border-slate-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950 rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-xl animate-slide-up-1 backdrop-blur-xl">
          {[
            { value: '100%', label: 'In-Memory Redaction', color: 'text-emerald-600 dark:text-emerald-400' },
            { value: '< 10s', label: 'Average Scan Runtime', color: 'text-cyan-600 dark:text-cyan-400' },
            { value: '3 Engines', label: 'TruffleHog · Semgrep · Hygiene', color: 'text-purple-600 dark:text-purple-400' },
            { value: '0', label: 'Credentials Stored', color: 'text-amber-600 dark:text-amber-400' },
          ].map(({ value, label, color }) => (
            <div key={label} className="space-y-1.5">
              <span className={`text-3xl sm:text-4xl font-black block font-mono ${color}`}>{value}</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider block">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERACTIVE PRODUCT PREVIEW ──────────────────────────── */}
      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-6 animate-slide-up-2">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Interactive Preview</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Auditor Studio</h2>
          </div>

          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="bg-black/90 border-b border-zinc-900 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-xs font-mono text-zinc-500 ml-2 hidden sm:inline">auditor-engine --target @octocat</span>
              </div>

              {/* Tab controls */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono overflow-x-auto max-w-full no-scrollbar gap-0.5">
                {[
                  { key: 'terminal', icon: <Terminal className="w-3 h-3 text-emerald-400" />, label: 'Live Execution' },
                  { key: 'findings', icon: <ShieldCheck className="w-3 h-3 text-cyan-400" />, label: 'Findings' },
                  { key: 'scorecard', icon: <Activity className="w-3 h-3 text-purple-400" />, label: 'AI Score' },
                  { key: 'patches', icon: <Wrench className="w-3 h-3 text-amber-400" />, label: 'Auto-Fix' },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setDemoTab(key)}
                    className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      demoTab === key
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6 bg-black/95 font-mono text-xs min-h-[320px]">
              {demoTab === 'terminal' && (
                <div className="space-y-2.5 leading-relaxed text-zinc-300 animate-fade-in">
                  <p className="text-zinc-600"># Initializing ephemeral Redis Queue scanning worker...</p>
                  <p className="text-emerald-400">&gt; GitHub REST API: Enumerating public non-fork repositories for @octocat</p>
                  <p className="text-zinc-400 flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" />Found 6 repositories [api-service, frontend-app, ml-pipeline, dotfiles, utils-cli, docs]</p>
                  <p className="text-cyan-400">&gt; Executing Hygiene Scanner...</p>
                  <p className="text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 shrink-0" />api-service: Missing standard LICENSE file</p>
                  <p className="text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 shrink-0" />ml-pipeline: Missing root .gitignore file</p>
                  <p className="text-red-400 font-bold">&gt; Executing TruffleHog Filesystem Scanner v3.63...</p>
                  <p className="text-red-400 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 shrink-0" />CRITICAL: AWS Access Key found in api-service/config/aws.json [line 14]</p>
                  <p className="text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" />Redaction Engine: Secret stripped from RAM: 'AKIA... [REDACTED]'</p>
                  <p className="text-purple-400">&gt; Executing Semgrep Rule Pack (auto)...</p>
                  <p className="text-amber-300 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 shrink-0" />frontend-app: Hardcoded localhost binding in production build</p>
                  <p className="text-white font-bold bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 flex items-center gap-2 shadow-lg mt-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    Profile Health Score: <span className="text-emerald-400 text-sm ml-1">88 / 100</span> — Strong Senior Profile, 1 Security Risk
                    <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-cursor" />
                  </p>
                </div>
              )}

              {demoTab === 'findings' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-900">
                    <span>Discovered Audit Findings (3 Total)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />Secrets Auto-Redacted
                    </span>
                  </div>
                  <div className="p-3.5 bg-red-950/20 border border-red-900/50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-red-500 text-black rounded uppercase">Critical Secret</span>
                      <span className="text-zinc-600 text-[10px]">api-service/config/aws.json:14</span>
                    </div>
                    <p className="font-bold text-white text-xs">AWS Access Key ID Leaked in Commit</p>
                    <p className="text-zinc-400 text-[11px]">Raw Secret: <code className="bg-black px-1.5 py-0.5 rounded text-emerald-400">AKIA... [REDACTED_BY_AUDITOR]</code></p>
                  </div>
                  <div className="p-3.5 bg-amber-950/20 border border-amber-900/50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500 text-black rounded uppercase">Git Hygiene</span>
                      <span className="text-zinc-600 text-[10px]">ml-pipeline/</span>
                    </div>
                    <p className="font-bold text-white text-xs">Missing Standard .gitignore File</p>
                    <p className="text-zinc-400 text-[11px]">Risk of committing virtualenv and local cache binaries.</p>
                  </div>
                  <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-zinc-700 text-zinc-300 rounded uppercase">Code Smell</span>
                      <span className="text-zinc-600 text-[10px]">frontend-app/src/api.js:42</span>
                    </div>
                    <p className="font-bold text-white text-xs">Semgrep: Hardcoded Localhost API URL</p>
                    <p className="text-zinc-400 text-[11px]">Replace hardcoded string with environment variable <code className="text-zinc-300">VITE_API_URL</code>.</p>
                  </div>
                </div>
              )}

              {demoTab === 'scorecard' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-5 rounded-xl text-center space-y-2 flex flex-col items-center">
                      <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-emerald-500 shadow-lg shadow-emerald-500/20">
                        <div className="text-center">
                          <span className="text-2xl font-black text-slate-900 dark:text-white block">88</span>
                          <span className="text-[9px] text-slate-600 dark:text-zinc-400 font-mono font-bold">/100</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800 uppercase">
                        Strong Profile
                      </span>
                    </div>
                    <div className="md:col-span-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-4 rounded-xl space-y-2">
                      <h4 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                        <Cpu className="w-4 h-4" />AI Recruiter Assessment
                      </h4>
                      <p className="text-slate-800 dark:text-zinc-200 text-xs leading-relaxed font-medium">
                        "Candidate demonstrates excellent commit consistency, clean documentation structure, and strong modularity across 6 repositories. Resolving 1 committed AWS credential and adding a missing LICENSE file will bring profile health to 96/100."
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <span className="text-slate-800 dark:text-zinc-300 font-bold">Recruiter Damage Index: <strong className="text-amber-700 dark:text-amber-400 font-extrabold">Low (1 minor patch needed)</strong></span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />Verified Audit Shield Generated
                    </span>
                  </div>
                </div>
              )}

              {demoTab === 'patches' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-900">
                    <span>Generated Unified Patch File</span>
                    <span className="text-emerald-400 text-[11px]">ml-pipeline-missing-gitignore.patch</span>
                  </div>
                  <pre className="p-3.5 bg-black border border-zinc-800 rounded-xl text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
{`--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,12 @@
+# Python cache files
+__pycache__/
+*.py[cod]
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
                    <span className="text-[10px] text-zinc-500">Apply with: <code className="text-zinc-300">git apply patchfile.patch</code></span>
                    <button className="px-3 py-1.5 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition flex items-center gap-1">
                      <Wrench className="w-3 h-3" />Download .patch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SCORING WEIGHT ARCHITECTURE ──────────────────────────── */}
      <section className="px-4 pb-24 animate-slide-up-2">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Scoring Engine</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">How Profile Health is Weighted</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Secret Security', weight: 40, bar: 'bg-emerald-400', color: 'text-emerald-400', desc: 'Detects exposed AWS, Stripe, GitHub, and API tokens across commit history.' },
              { label: 'Repository Hygiene', weight: 30, bar: 'bg-cyan-400', color: 'text-cyan-400', desc: 'Evaluates presence of standard LICENSE, root .gitignore, and README documentation.' },
              { label: 'Code Quality', weight: 30, bar: 'bg-purple-400', color: 'text-purple-400', desc: 'Scans for hardcoded localhost URLs, debug statements, and build smells via Semgrep.' },
            ].map(({ label, weight, bar, color, desc }) => (
              <div key={label} className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{label}</span>
                  <span className={`font-mono ${color} font-bold text-xs`}>{weight}% Weight</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className={`${bar} h-full rounded-full`} style={{ width: `${weight}%` }} />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE RISK SIMULATOR ───────────────────────────── */}
      <section className="px-4 pb-24 animate-slide-up-2">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Interactive Simulator</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Test Your Profile Score Impact</h2>
            <p className="text-sm text-zinc-500 max-w-lg mx-auto">Toggle common security flaws to see how automated recruiter scanners rank your profile.</p>
          </div>

          <div className="bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start shadow-2xl">
            {/* Toggles */}
            <div className="lg:col-span-7 space-y-3 font-mono">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Toggle conditions:</span>
              {[
                { key: 'hasSecrets', icon: AlertTriangle, label: 'Exposed API Keys / AWS Secrets', penalty: -40, activeClass: 'bg-red-950/40 border-red-800/70 text-red-300', badge: ['EXPOSED', 'CLEAN'], badgeActive: 'bg-red-950 text-red-300', badgeInactive: 'bg-zinc-800 text-zinc-500' },
                { key: 'missingGitignore', icon: FileCode, label: 'Missing Root .gitignore', penalty: -15, activeClass: 'bg-amber-950/40 border-amber-800/70 text-amber-300', badge: ['MISSING', 'PRESENT'], badgeActive: 'bg-amber-950 text-amber-300', badgeInactive: 'bg-zinc-800 text-zinc-500' },
                { key: 'hardcodedUrls', icon: Code, label: 'Hardcoded Localhost URLs', penalty: -20, activeClass: 'bg-amber-950/40 border-amber-800/70 text-amber-300', badge: ['DETECTED', 'CLEAN'], badgeActive: 'bg-amber-950 text-amber-300', badgeInactive: 'bg-zinc-800 text-zinc-500' },
                { key: 'missingLicense', icon: ShieldAlert, label: 'Missing Open-Source License', penalty: -10, activeClass: 'bg-purple-950/40 border-purple-800/70 text-purple-300', badge: ['MISSING', 'PRESENT'], badgeActive: 'bg-purple-950 text-purple-300', badgeInactive: 'bg-zinc-800 text-zinc-500' },
                { key: 'noReadme', icon: Lock, label: 'Empty / Missing README.md', penalty: -15, activeClass: 'bg-purple-950/40 border-purple-800/70 text-purple-300', badge: ['MISSING', 'PRESENT'], badgeActive: 'bg-purple-950 text-purple-300', badgeInactive: 'bg-zinc-800 text-zinc-500' },
              ].map(({ key, icon: Icon, label, penalty, activeClass, badge, badgeActive, badgeInactive }) => {
                const isOn = riskItems[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleRiskItem(key)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                      isOn ? activeClass : 'bg-slate-100 dark:bg-zinc-900/50 border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isOn ? 'opacity-100' : 'opacity-60'}`} />
                      <span className="text-slate-900 dark:text-zinc-200">{label} ({penalty} pts)</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${isOn ? badgeActive : 'bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {isOn ? badge[0] : badge[1]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Score display */}
            <div className="lg:col-span-5 bg-black p-6 rounded-2xl border border-zinc-800 text-center space-y-5 font-mono sticky top-4">
              <span className="text-xs text-zinc-500 uppercase tracking-widest block font-bold">Simulated Health Score</span>
              <div className="text-6xl font-black transition-all duration-300">
                <span className={scoreColor}>{score}</span>
                <span className="text-2xl text-zinc-700">/100</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-500 block pb-1">Recruiter Risk Tier:</span>
                <span className={`font-extrabold uppercase ${scoreColor}`}>{scoreTier}</span>
              </div>
              <button
                onClick={onStartRegister}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Scan Your Actual Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-STAGE PIPELINE ─────────────────────────────────────── */}
      <section className="px-4 pb-24 animate-slide-up-3">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Automated Pipeline</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">4-Stage Static Analysis Pass</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stage: '01', label: 'Repo Discovery', color: 'text-emerald-400', desc: 'Enumerates public non-fork repos via GitHub REST API with rate limit handling.' },
              { stage: '02', label: 'Static Engine Pass', color: 'text-cyan-400', desc: 'Executes TruffleHog, Semgrep, and hygiene checks concurrently.' },
              { stage: '03', label: 'In-Memory Redaction', color: 'text-purple-400', desc: 'Strips secret strings from RAM before writing any findings to database.' },
              { stage: '04', label: 'AI Score & Patches', color: 'text-amber-400', desc: 'Generates health score (0-100), resume risks, and downloadable patch files.' },
            ].map(({ stage, label, color, desc }) => (
              <div key={stage} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between font-mono">
                  <span className={`text-xs font-bold ${color}`}>STAGE {stage}</span>
                  <span className="text-zinc-700 text-xs">{stage}/04</span>
                </div>
                <h3 className="font-bold text-white text-sm">{label}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BADGE EMBED ──────────────────────────────────────────── */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 text-emerald-400 rounded-full border border-zinc-800 uppercase">Feature</span>
              <h3 className="text-2xl font-extrabold text-white">Embeddable README Health Shield</h3>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                Showcase your verified profile score on your GitHub Profile README. Automatically updates with your latest scan.
              </p>
            </div>
            <div className="shrink-0 p-4 bg-black rounded-2xl border border-zinc-800 text-center space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Live SVG Badge</span>
              <div className="inline-flex items-center rounded-md overflow-hidden font-mono text-xs font-bold shadow-md">
                <span className="bg-zinc-800 text-white px-3 py-1.5">octocat</span>
                <span className="bg-emerald-500 text-black px-3 py-1.5">health: 88/100</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Copy Markdown for your README.md</span>
              {copied && <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" />Copied!</span>}
            </div>
            <div className="p-3.5 bg-black border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
              <code className="truncate text-emerald-400 text-xs flex-1 min-w-0">{badgeMarkdown}</code>
              <button
                onClick={handleCopyBadge}
                className="shrink-0 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs transition flex items-center gap-1.5 border border-zinc-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Common Questions</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {[
              { id: 1, q: 'Are my GitHub tokens or passwords stored?', a: 'No. If you provide a GitHub access token to lift rate limits during scanning, it is processed strictly in temporary worker RAM for API requests and is never saved to the database.' },
              { id: 2, q: 'What happens if a secret or API key is found in my repository?', a: 'Our Absolute Secret Redaction engine immediately sanitizes raw secret strings in memory (replacing them with [REDACTED]). Only file paths, rule identifiers, and line numbers are saved.' },
              { id: 3, q: 'Do you access or clone my private repositories?', a: 'By default, the auditor only enumerates public, non-fork repositories accessible on GitHub. Private repositories are never touched or scanned.' },
              { id: 4, q: 'How are the 1-Click Auto-Fix patches generated?', a: 'When a missing file (such as a LICENSE or .gitignore) is flagged, the system creates a standard unified .patch file. Download and apply it with: git apply patchfile.patch' },
            ].map(({ id, q, a }) => (
              <div key={id} className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm">
                <button
                  onClick={() => setActiveFaq(activeFaq === id ? null : id)}
                  className="w-full p-5 text-left font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between gap-3"
                >
                  <span>{q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-600 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${activeFaq === id ? 'rotate-180 text-emerald-700 dark:text-emerald-400' : ''}`} />
                </button>
                {activeFaq === id && (
                  <div className="px-5 pb-5 text-sm sm:text-base text-slate-800 dark:text-zinc-300 leading-relaxed border-t border-slate-200 dark:border-zinc-900 pt-4 font-medium">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-zinc-950 via-zinc-950 to-emerald-950/20 p-12 rounded-3xl border border-zinc-800 space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Ready to Audit Your GitHub Profile?</h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
              Scan your public repositories, sanitize security leaks, and elevate your recruiter profile score — for free.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <button
              onClick={onStartRegister}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGitHubOAuth}
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl font-semibold text-zinc-200 text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Continue with GitHub</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-zinc-900 bg-slate-100 dark:bg-black px-6 pt-14 pb-12 transition-colors duration-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="GitHub Profile Health Auditor" className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-zinc-800 shrink-0" />
              <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">GitHub Profile Health Auditor</span>
              <span className="px-2.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 font-mono font-extrabold rounded-full border border-emerald-300 dark:border-emerald-800/70 uppercase">BETA</span>
            </div>
            <p className="text-slate-800 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-md font-medium">
              Automated multi-engine static analysis for public GitHub profiles. Intercept committed credentials, clean repository hygiene debt, and boost your recruiter hiring rank.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { href: 'https://www.linkedin.com/in/jaggureddy/', icon: <LinkedinIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />, label: 'LinkedIn' },
                { href: 'https://github.com/jaggureddy11', icon: <GithubIcon className="w-4 h-4 text-slate-800 dark:text-zinc-300" />, label: 'GitHub' },
                { href: 'mailto:jaggureddy2004@gmail.com', icon: <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, label: 'Email' },
              ].map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm"
                >
                  {icon}<span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Engine Features */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Analysis Engines</h4>
            <ul className="space-y-2.5 text-slate-800 dark:text-zinc-300 text-xs sm:text-sm font-semibold">
              {['TruffleHog Redaction', 'Semgrep AST Hygiene', 'AI Recruiter Score', 'Unified .patch Fixes', 'README Health Shield'].map((item, i) => (
                <li key={item} className="flex items-center gap-2 hover:text-slate-950 dark:hover:text-white transition-colors">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${['text-emerald-600 dark:text-emerald-400', 'text-cyan-600 dark:text-cyan-400', 'text-purple-600 dark:text-purple-400', 'text-amber-600 dark:text-amber-400', 'text-emerald-600 dark:text-emerald-400'][i]}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Security Architecture */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Security Architecture</h4>
            <div className="p-5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm">
              {[
                { label: 'Clone RAM Wiping', value: '100% In-Memory', vc: 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Stored Credentials', value: '0 Secrets Saved', vc: 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Scanner Queue', value: 'Redis Ephemeral', vc: 'text-cyan-700 dark:text-cyan-400' },
              ].map(({ label, value, vc }) => (
                <div key={label} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-700 dark:text-zinc-400 font-bold">{label}:</span>
                  <span className={`${vc} font-extrabold`}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-700 dark:text-zinc-400 leading-relaxed font-medium">
              Designed for software engineers, security auditors, and recruiters.
            </p>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-300 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-800 dark:text-zinc-400 font-semibold">
          <p>© {new Date().getFullYear()} R Jagadishwar R (jaggureddy11). All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-900 dark:text-zinc-300 font-extrabold">All Engines Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
