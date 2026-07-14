import React from 'react';

export default function ReportDashboard({ report, onReset }) {
  const { overall_score, summary, repositories, findings, username } = report;
  
  // Calculate stats
  const totalRepos = repositories.length;
  const totalFindings = findings.length;
  const secretsCount = findings.filter(f => f.type === 'secret').length;
  const hygieneCount = findings.filter(f => f.type === 'structural').length;
  const smellCount = findings.filter(f => f.type === 'smell').length;

  const scoreColor = (score) => {
    if (score >= 90) return 'stroke-emerald-500 text-emerald-400';
    if (score >= 70) return 'stroke-amber-500 text-amber-400';
    return 'stroke-rose-500 text-rose-400';
  };

  const scoreBgColor = (score) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  const getSeverityBadgeClass = (severity) => {
    const sev = severity.toLowerCase();
    if (sev === 'critical') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (sev === 'high') return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    if (sev === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  };

  // Extract top issues from AI summary or compile from findings
  const topIssues = summary?.top_issues || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Radial Score Gauge */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Profile Health</h3>
          <div className="relative w-36 h-36">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-1000 ease-out ${scoreColor(overall_score)}`}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * overall_score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tight text-slate-100">{overall_score}</span>
              <span className="text-xs text-slate-500 font-bold uppercase mt-0.5">Score</span>
            </div>
          </div>
          <span className={`mt-6 px-3 py-1 text-xs font-semibold rounded-full border ${scoreBgColor(overall_score)}`}>
            {overall_score >= 90 ? 'Excellent Standing' : (overall_score >= 70 ? 'Fair - Needs Attention' : 'Critical Action Required')}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-100">Audit Statistics</h3>
                <p className="text-sm text-slate-400 mt-1">Scan overview for developer profile: <span className="text-cyan-400 font-semibold font-mono">@{username}</span></p>
              </div>
              <button
                onClick={onReset}
                className="py-1.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition duration-150 border border-slate-700/50"
              >
                Scan Another User
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-xs text-slate-500 font-semibold block">Total Repos</span>
                <span className="text-2xl font-bold text-slate-200 mt-1 block">{totalRepos}</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-xs text-rose-500/80 font-semibold block">Secret Leaks</span>
                <span className={`text-2xl font-bold mt-1 block ${secretsCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {secretsCount}
                </span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-xs text-amber-500/80 font-semibold block">Hygiene Gaps</span>
                <span className="text-2xl font-bold text-slate-200 mt-1 block">{hygieneCount}</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-xs text-sky-500/80 font-semibold block">Code Smells</span>
                <span className="text-2xl font-bold text-slate-200 mt-1 block">{smellCount}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
            <span>Scan finished: {new Date().toLocaleTimeString()}</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5 inline-block"></span>Secrets</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5 inline-block"></span>Hygiene</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-1.5 inline-block"></span>Smells</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized AI Recommendations */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-sm shadow shadow-cyan-500/30">
            🤖
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">AI Synthesized Recommendations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Top prioritized corrections flagged for recruiters and interviewers</p>
          </div>
        </div>

        {topIssues.length > 0 ? (
          <div className="space-y-4">
            {topIssues.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-800">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-slate-200 text-sm md:text-base">{item.issue}</h4>
                  </div>
                  <p className="text-sm text-slate-400 pl-8 leading-relaxed">{item.justification}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shrink-0 ${getSeverityBadgeClass(item.severity)}`}>
                  {item.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
            <span className="text-3xl block mb-2">🎉</span>
            <p className="text-sm text-slate-400">No major issues found! Your profile health is excellent.</p>
          </div>
        )}
      </div>
    </div>
  );
}
