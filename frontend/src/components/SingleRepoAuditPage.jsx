import React from 'react';
import LiveScanTelemetry from './LiveScanTelemetry';
import ReportDashboard from './ReportDashboard';

/**
 * Dedicated Page View for Single Repository Audit.
 * Renders target repository findings in clean full-width layout.
 */
export default function SingleRepoAuditPage({
  scanState,
  scanReport,
  activeUsername,
  onBack,
  onReset,
  onReRun,
  token,
  quickstats,
  quickstatsLoading,
  isCopilotCollapsed,
  setIsCopilotCollapsed
}) {
  const fullTargetName = scanReport?.repo_name 
    ? `@${scanReport.username || activeUsername} / ${scanReport.repo_name}` 
    : `@${activeUsername}`;

  return (
    <div className="min-h-screen space-y-6 font-sans animate-in fade-in zoom-in-95 duration-300">
      
      {/* Dedicated Header Back Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-950 p-4 px-6 rounded-2xl border border-zinc-800 shadow-xl gap-4">
        <button
          onClick={onBack}
          className="py-2.5 px-5 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl text-xs font-sans transition flex items-center space-x-2 shadow-md active:scale-98 cursor-pointer"
        >
          <span>← Back to Profile &amp; Repositories</span>
        </button>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-zinc-400">Target Repository: <span className="text-emerald-400 font-bold">{fullTargetName}</span></span>
          {scanState === 'loading' ? (
            <span className="px-3 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-lg font-bold flex items-center space-x-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>LIVE AUDIT RUNNING</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-lg font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>AUDIT COMPLETED</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Full-Width Content Container */}
      <div className="w-full space-y-8">
        {scanState === 'loading' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 border-b border-zinc-900 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  🔍
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Single Repository Security Audit</h2>
                  <p className="text-xs text-zinc-400 font-mono">Target: {fullTargetName}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Interception pipeline is currently executing TruffleHog secret checks, Semgrep AST code smell analysis, and repository hygiene verification.
              </p>
            </div>

            <LiveScanTelemetry report={scanReport} />
          </div>
        )}

        {scanState === 'completed' && scanReport && (
          <ReportDashboard 
            report={scanReport} 
            onReset={onReset} 
            onReRun={(username) => onReRun(username, '')}
            token={token}
            quickstats={quickstats}
            quickstatsLoading={quickstatsLoading}
            onOpenCopilot={() => setIsCopilotCollapsed(false)}
          />
        )}
      </div>

    </div>
  );
}
