import React from 'react';

export default function ReportDashboard({ report, onReset }) {
  const { overall_score, summary, repositories, findings, username } = report;
  
  // Calculate stats
  const totalRepos = repositories.length;
  const totalFindings = findings.length;
  const secretsCount = findings.filter(f => f.type === 'secret').length;
  const hygieneCount = findings.filter(f => f.type === 'structural').length;
  const smellCount = findings.filter(f => f.type === 'smell').length;

  const getSeverityBadgeClass = (severity) => {
    const sev = severity.toLowerCase();
    if (sev === 'critical') return 'bg-white text-black border-white';
    if (sev === 'high') return 'bg-zinc-900 text-white border-zinc-700';
    return 'bg-zinc-950 text-zinc-400 border-zinc-850';
  };

  const topIssues = summary?.top_issues || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Radial Score Gauge */}
        <div className="mono-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl">
          <h3 className="text-sm font-semibold text-zinc-450 uppercase tracking-wider mb-6">Profile Health</h3>
          <div className="relative w-36 h-36">
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
                className="stroke-white text-white transition-all duration-1000 ease-out"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * overall_score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tight text-white">{overall_score}</span>
              <span className="text-xs text-zinc-500 font-bold uppercase mt-0.5">Score</span>
            </div>
          </div>
          <span className="mt-6 px-3 py-1 text-xs font-bold rounded-full border bg-zinc-950 text-white border-zinc-800">
            {overall_score >= 90 ? 'Excellent Standing' : (overall_score >= 70 ? 'Fair - Needs Attention' : 'Critical Action Required')}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-2 mono-panel p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Audit Statistics</h3>
                <p className="text-sm text-zinc-400 mt-1">Scan overview for developer profile: <span className="text-white font-semibold font-mono">@{username}</span></p>
              </div>
              <button
                onClick={onReset}
                className="py-1.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-xs font-bold text-white transition duration-150 border border-zinc-800"
              >
                Scan Another User
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                <span className="text-xs text-zinc-550 font-semibold block">Total Repos</span>
                <span className="text-2xl font-bold text-white mt-1 block">{totalRepos}</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                <span className="text-xs text-zinc-400 font-semibold block">Secret Leaks</span>
                <span className="text-2xl font-bold mt-1 block text-white">
                  {secretsCount}
                </span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                <span className="text-xs text-zinc-400 font-semibold block">Hygiene Gaps</span>
                <span className="text-2xl font-bold text-white mt-1 block">{hygieneCount}</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                <span className="text-xs text-zinc-400 font-semibold block">Code Smells</span>
                <span className="text-2xl font-bold text-white mt-1 block">{smellCount}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-zinc-500 gap-2">
            <span>Scan finished: {new Date().toLocaleTimeString()}</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-white mr-1.5 inline-block"></span>Secrets</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-zinc-500 mr-1.5 inline-block"></span>Hygiene</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-zinc-800 mr-1.5 inline-block"></span>Smells</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized AI Recommendations */}
      <div className="mono-panel p-8 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm shadow-sm">
            🤖
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Synthesized Recommendations</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Top prioritized corrections flagged for recruiters and interviewers</p>
          </div>
        </div>

        {topIssues.length > 0 ? (
          <div className="space-y-4">
            {topIssues.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-450 border border-zinc-800">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-white text-sm md:text-base">{item.issue}</h4>
                  </div>
                  <p className="text-sm text-zinc-400 pl-8 leading-relaxed">{item.justification}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shrink-0 ${getSeverityBadgeClass(item.severity)}`}>
                  {item.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-zinc-950 rounded-2xl border border-dashed border-zinc-900">
            <span className="text-3xl block mb-2">🎉</span>
            <p className="text-sm text-zinc-400">No major issues found! Your profile health is excellent.</p>
          </div>
        )}
      </div>
    </div>
  );
}
