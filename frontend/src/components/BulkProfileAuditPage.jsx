import React from 'react';
import LiveScanTelemetry from './LiveScanTelemetry';
import ReportDashboard from './ReportDashboard';
import SecurityCopilot from './SecurityCopilot';
import QuickStatsCard from './QuickStatsCard';

/**
 * Dedicated Page View for Bulk Profile & All Repositories Audit.
 * Renders full profile health metrics & findings on the left, with the Security Copilot Studio beside it!
 */
export default function BulkProfileAuditPage({
  scanState,
  scanReport,
  activeUsername,
  onBack,
  onReset,
  onReRun,
  token,
  quickstats,
  quickstatsLoading,
  isBatchScanning,
  batchProgress,
  isCopilotCollapsed,
  setIsCopilotCollapsed
}) {
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
          <span className="text-zinc-400">Target Profile: <span className="text-emerald-400 font-bold">@{activeUsername}</span></span>
          {scanState === 'loading' || isBatchScanning ? (
            <span className="px-3 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-lg font-bold flex items-center space-x-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>BULK PROFILE AUDIT RUNNING {batchProgress?.total > 0 ? `(${batchProgress.current}/${batchProgress.total})` : ''}</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-lg font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>PROFILE AUDIT COMPLETED</span>
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout: Audit Findings on Left, Copilot Studio on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile Stats, Telemetry & Report Findings (7 Cols on LG) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          
          {/* QuickStats Profile Header */}
          <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />

          {/* Telemetry during loading */}
          {scanState === 'loading' && (
            <div className="space-y-6">
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
                <div className="flex items-center space-x-3 border-b border-zinc-900 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Full Profile &amp; Multi-Repository Audit</h2>
                    <p className="text-xs text-zinc-400 font-mono">Profile: @{activeUsername}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  Executing multi-repo static analysis across all public repositories. Progress is streamed in real-time.
                </p>
              </div>

              <LiveScanTelemetry report={scanReport} />
            </div>
          )}

          {/* Report Dashboard when completed */}
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

        {/* Right Column: Embedded Security Copilot Studio (5 Cols on LG) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden h-[680px] flex flex-col">
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-xs text-white">Security Copilot AI Studio</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded-full">
                Profile Mode
              </span>
            </div>

            <div className="flex-1 overflow-hidden">
              <SecurityCopilot 
                scanReport={scanReport}
                activeUsername={activeUsername}
                token={token}
                isCollapsed={false}
                onToggleCollapse={() => setIsCopilotCollapsed(!isCopilotCollapsed)}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
