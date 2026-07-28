import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, Tag, Bot, Download, Printer, RefreshCw, X, Copy, Check, CheckCircle2, FileJson, BadgeCheck } from 'lucide-react';
import SecurityCopilot from './SecurityCopilot';
import PublicBadgeModal from './PublicBadgeModal';
import QuickStatsCard from './QuickStatsCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function ReportDashboard({ report, onReset, onReRun, token, quickstats, quickstatsLoading }) {
  const { scan_id, overall_score, summary, repositories, findings, username, created_at } = report;
  const [copiedType, setCopiedType] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Smooth Score Counter Animation on Mount/Change
  useEffect(() => {
    let start = 0;
    const target = overall_score || 0;
    const duration = 1000;
    const steps = 40;
    const stepTime = duration / steps;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [overall_score]);

  // Calculate stats
  const totalRepos = repositories.length;
  const secretsCount = findings.filter(f => f.type === 'secret').length;
  const hygieneCount = findings.filter(f => f.type === 'structural').length;
  const smellCount = findings.filter(f => f.type === 'smell').length;

  const getSeverityBadgeClass = (severity) => {
    const sev = severity ? severity.toLowerCase() : '';
    if (sev === 'critical') return 'bg-red-950 text-red-300 border-red-800 font-extrabold';
    if (sev === 'high') return 'bg-orange-950 text-orange-300 border-orange-800 font-bold';
    return 'bg-zinc-900 text-zinc-300 border-zinc-700 font-semibold';
  };

  const topIssues = summary?.top_issues || [];
  const scanDate = created_at ? new Date(created_at).toLocaleString() : new Date().toLocaleString();

  // Badge URL & Snippets
  const badgeUrl = `${API_BASE_URL}/api/badge/${username}.svg`;
  const markdownSnippet = `[![Profile Health](${badgeUrl})](https://github.com/${username})`;
  const htmlSnippet = `<a href="https://github.com/${username}"><img src="${badgeUrl}" alt="Profile Health"/></a>`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/${scan_id}/export?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Export failed.");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${username}-${scan_id.substring(0, 8)}.${format === 'json' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error exporting report: " + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [aiReadmeText, setAiReadmeText] = useState('');
  const [isGeneratingReadme, setIsGeneratingReadme] = useState(false);

  const handleGenerateAiReadme = async () => {
    setIsGeneratingReadme(true);
    setShowReadmeModal(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/${scan_id}/generate-readme`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to generate AI README.");
      const data = await response.json();
      setAiReadmeText(data.readme_markdown);
    } catch (err) {
      alert("Error generating README: " + err.message);
    } finally {
      setIsGeneratingReadme(false);
    }
  };

  const handleDownloadReadmeFile = () => {
    const blob = new Blob([aiReadmeText], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README-${username}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-8 animate-fade-in print:space-y-6">
      
      {/* Instant Profile Stats Card (Phase 2 Instant View) */}
      <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />

      {/* Redaction Guarantee Banner */}
      <div className="border border-green-900/80 bg-green-950/30 p-5 rounded-2xl flex items-center justify-between text-green-300 print:hidden shadow-lg animate-slide-up-1 animate-border-glow">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-green-900/60 border border-green-800/60 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-green-300" />
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-sm sm:text-base text-green-200">Absolute Secret Redaction Guarantee Active</p>
            <p className="text-xs sm:text-sm text-green-400/90 leading-relaxed">
              Secret values are never logged, stored in databases, or output in plain text. Repositories are cloned to ephemeral memory and wiped immediately after static analysis.
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center space-x-2 border border-green-800/60 bg-black/60 px-3.5 py-2 rounded-xl text-xs font-mono text-green-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>100% Ephemeral RAM</span>
        </div>
      </div>

      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 animate-slide-up-2">
        
        {/* Radial Score Gauge */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Overall Profile Score</h3>
          <div className="relative w-36 h-36 sm:w-44 sm:h-44">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-zinc-900"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400 text-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * animatedScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white transition-all duration-300">{animatedScore}</span>
              <span className="text-xs text-zinc-500 font-bold uppercase mt-1">/ 100</span>
            </div>
          </div>
          <span className="mt-5 px-4 py-1.5 text-xs font-extrabold rounded-full border bg-zinc-900 text-white border-zinc-700 shadow-sm">
            {overall_score >= 90 ? (
              <span className="flex items-center space-x-1.5"><Sparkles className="w-4 h-4 text-emerald-400" /><span>Excellent Standing</span></span>
            ) : overall_score >= 70 ? (
              <span className="flex items-center space-x-1.5"><AlertTriangle className="w-4 h-4 text-amber-300" /><span>Fair - Action Recommended</span></span>
            ) : (
              <span className="flex items-center space-x-1.5"><AlertTriangle className="w-4 h-4 text-red-400" /><span>Critical Fixes Required</span></span>
            )}
          </span>
        </div>

        {/* Stats Grid & Action Bar */}
        <div className="md:col-span-2 border border-zinc-800 bg-zinc-950 p-6 sm:p-8 rounded-3xl flex flex-col justify-between shadow-xl space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Audit Summary Dashboard
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Target Profile: <span className="text-white font-bold font-mono">@{username}</span>
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 print:hidden w-full sm:w-auto">
                <button
                  onClick={() => setShowBadgeModal(true)}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 text-xs font-bold transition duration-150 border border-emerald-800/80 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
                  title="Opt-in to publish public README badge"
                >
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>Make Score Public</span>
                </button>
                <button
                  onClick={handleGenerateAiReadme}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition duration-150 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                  title="Generate AI Profile README.md"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>AI README</span>
                </button>
                <button
                  onClick={() => handleExport('markdown')}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition duration-150 border border-zinc-700 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
                  title="Export Markdown file"
                >
                  <Download className="w-4 h-4" /><span>Export .md</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition duration-150 border border-zinc-700 rounded-xl flex items-center justify-center space-x-1.5"
                  title="Export JSON file"
                >
                  <FileJson className="w-4 h-4" /><span>Export JSON</span>
                </button>
                <button
                  onClick={() => onReRun(username)}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-white hover:bg-zinc-200 text-xs font-bold text-black transition duration-150 rounded-xl shadow-md flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /><span>Re-run</span>
                </button>
                <button
                  onClick={onReset}
                  className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-400 transition duration-150 border border-zinc-800 rounded-xl flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-inner">
                <span className="text-xs text-zinc-400 font-bold block uppercase tracking-wider">Repositories</span>
                <span className="text-3xl sm:text-4xl font-black text-white mt-1 block">{totalRepos}</span>
              </div>
              <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-inner">
                <span className="text-xs text-zinc-400 font-bold block uppercase tracking-wider">Secret Leaks</span>
                <span className={`text-3xl sm:text-4xl font-black mt-1 block ${secretsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {secretsCount}
                </span>
              </div>
              <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-inner">
                <span className="text-xs text-zinc-400 font-bold block uppercase tracking-wider">Hygiene Gaps</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-400 mt-1 block">{hygieneCount}</span>
              </div>
              <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-inner">
                <span className="text-xs text-zinc-400 font-bold block uppercase tracking-wider">Code Smells</span>
                <span className="text-3xl sm:text-4xl font-black text-cyan-400 mt-1 block">{smellCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-zinc-900 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-zinc-400 gap-3">
            <span>Audit Date: <span className="font-mono text-white font-semibold">{scanDate}</span></span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 inline-block"></span>Secrets ({secretsCount})</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-2 inline-block"></span>Hygiene ({hygieneCount})</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mr-2 inline-block"></span>Smells ({smellCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embeddable Health Badge Generator */}
      <div className="border border-zinc-800 bg-zinc-950 p-7 rounded-2xl print:hidden shadow-xl space-y-4 animate-slide-up-3 hover:border-zinc-700 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Embeddable README Health Shield</h3>
              <p className="text-xs sm:text-sm text-zinc-400">Embed your verified profile health badge directly on your GitHub profile README.md</p>
            </div>
          </div>
          <div className="shrink-0 bg-black p-2.5 rounded-xl border border-zinc-800 flex items-center shadow-inner">
            <img src={badgeUrl} alt="Profile Health Shield" className="h-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-black p-4 rounded-xl border border-zinc-850 space-y-2">
            <div className="flex justify-between items-center text-zinc-400 text-xs">
              <span className="font-bold text-zinc-200">Markdown Code (README.md)</span>
              <button
                onClick={() => copyToClipboard(markdownSnippet, 'md')}
                className="hover:text-white text-zinc-300 font-bold underline cursor-pointer"
              >
                {copiedType === 'md' ? <span className="flex items-center space-x-1"><Check className="w-3 h-3 text-emerald-400" /><span>Copied!</span></span> : <span className="flex items-center space-x-1"><Copy className="w-3 h-3" /><span>Copy</span></span>}
              </button>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg text-zinc-200 truncate text-xs select-all border border-zinc-900">
              {markdownSnippet}
            </div>
          </div>

          <div className="bg-black p-4 rounded-xl border border-zinc-850 space-y-2">
            <div className="flex justify-between items-center text-zinc-400 text-xs">
              <span className="font-bold text-zinc-200">HTML Code</span>
              <button
                onClick={() => copyToClipboard(htmlSnippet, 'html')}
                className="hover:text-white text-zinc-300 font-bold underline cursor-pointer"
              >
                {copiedType === 'html' ? <span className="flex items-center space-x-1"><Check className="w-3 h-3 text-emerald-400" /><span>Copied!</span></span> : <span className="flex items-center space-x-1"><Copy className="w-3 h-3" /><span>Copy</span></span>}
              </button>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg text-zinc-200 truncate text-xs select-all border border-zinc-900">
              {htmlSnippet}
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized AI Recommendations & AI Copilot Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up-3">
        
        {/* AI Prioritized Insights */}
        <div className="border border-zinc-800 bg-zinc-950 p-7 rounded-2xl shadow-xl space-y-6 hover:border-zinc-700 transition-all duration-300">
          <div className="flex items-center space-x-3 border-b border-zinc-900 pb-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Prioritized Insights</h3>
              <p className="text-xs sm:text-sm text-zinc-400">Targeted corrections recommended for profile readiness</p>
            </div>
          </div>

          {topIssues.length > 0 ? (
            <div className="space-y-4">
              {topIssues.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="bg-black border border-zinc-850 p-4 rounded-xl flex flex-col items-start justify-between gap-3 shadow-sm hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-300 border border-zinc-750 shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-white text-xs sm:text-sm">{item.issue}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border shrink-0 ${getSeverityBadgeClass(item.severity)}`}>
                        {item.severity ? item.severity.toUpperCase() : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 pl-7 leading-relaxed font-normal">{item.justification}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-black rounded-xl border border-dashed border-zinc-850">
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-zinc-300">No major issues found! Profile has excellent standing.</p>
            </div>
          )}
        </div>

        {/* AI Security Copilot Interactive Assistant */}
        {token ? (
          <SecurityCopilot scanId={scan_id} token={token} username={username} score={overall_score} />
        ) : (
          <div className="border border-zinc-850 bg-zinc-950 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-4 font-mono">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Unlock AI Security Copilot Assistant</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Sign in to chat directly with AI Security Copilot about your audit findings, secret purging steps, and custom git fixes.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* AI PROFILE README GENERATOR MODAL */}
      {showReadmeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">AI Profile README.md Generator</h3>
                  <p className="text-xs text-zinc-400">Recruiter-aligned profile README synthesized for @{username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReadmeModal(false)}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {isGeneratingReadme ? (
              <div className="py-16 text-center space-y-4 font-mono">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-zinc-300 font-bold">Synthesizing recruiter-aligned README.md for @{username}...</p>
                <p className="text-xs text-zinc-500">Embedding health shield badges, verified tech stack, and portfolio highlights</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Generated Markdown Code (Ready to paste into GitHub Profile README)</span>
                  <button
                    onClick={() => copyToClipboard(aiReadmeText, 'readme')}
                    className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-white font-bold rounded-lg transition flex items-center space-x-1.5"
                  >
                    {copiedType === 'readme' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copiedType === 'readme' ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  value={aiReadmeText}
                  className="w-full h-80 bg-black border border-zinc-850 rounded-2xl p-4 font-mono text-xs text-emerald-400 focus:outline-none resize-none leading-relaxed shadow-inner"
                />

                {/* Footer Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs font-mono text-zinc-500">
                    <span>File target: </span>
                    <code className="text-zinc-300">github.com/{username}/{username}/README.md</code>
                  </div>
                  
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <button
                      onClick={handleDownloadReadmeFile}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4 text-black" />
                      <span>Download README.md</span>
                    </button>
                    <button
                      onClick={() => setShowReadmeModal(false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {showBadgeModal && (
        <PublicBadgeModal
          username={username}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

    </div>
  );
}
