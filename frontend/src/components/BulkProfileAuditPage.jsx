import React from 'react';
import LiveScanTelemetry from './LiveScanTelemetry';
import ReportDashboard from './ReportDashboard';
import QuickStatsCard from './QuickStatsCard';

/**
 * Dedicated Page View for Bulk Profile & All Repositories Audit.
 * Renders full profile health metrics & findings in clean full-width layout.
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
          {scanState === 'loading' ? (
            <span className="px-3 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-lg font-bold flex items-center space-x-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>MULTI-REPO AUDIT RUNNING</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-lg font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>PROFILE AUDIT COMPLETED</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Full-Width Content Container */}
      <div className="w-full space-y-8">
        
        {/* Telemetry & QuickStats during loading */}
        {scanState === 'loading' && (
          <div className="space-y-6">
            <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />
            <LiveScanTelemetry report={scanReport} />
          </div>
        )}

        {/* Report Dashboard when completed (ReportDashboard renders QuickStatsCard automatically) */}
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
