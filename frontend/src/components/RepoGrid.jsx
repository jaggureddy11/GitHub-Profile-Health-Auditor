import React from 'react';
import RepoCard from './RepoCard';
import { Layers, Play, CheckCircle2, Loader2 } from 'lucide-react';

export default function RepoGrid({ 
  repositories = [], 
  repoStatuses = {}, 
  onAnalyzeRepo, 
  onAuditAll,
  isBatchScanning = false,
  batchProgress = { current: 0, total: 0 },
  isLoading = false 
}) {
  if (isLoading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-pulse shadow-2xl">
        <div className="h-6 bg-zinc-900 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-zinc-900 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return null;
  }

  const completedCount = Object.values(repoStatuses).filter(s => s === 'completed').length;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-850">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>Public Repositories</span>
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold">
              {repositories.length} repos
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 font-normal">
            Audit repositories individually or run an automated sequential audit across all profile repositories.
          </p>
        </div>

        {/* Action Header: Audit Profile (Batch) */}
        {onAuditAll && (
          <div className="shrink-0 flex items-center gap-3">
            {isBatchScanning ? (
              <div className="py-2.5 px-5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-bold font-mono flex items-center gap-2 shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Auditing Profile ({batchProgress.current} / {batchProgress.total})</span>
              </div>
            ) : completedCount === repositories.length ? (
              <div className="py-2.5 px-5 bg-emerald-950/90 border border-emerald-700 text-emerald-400 rounded-2xl text-xs font-bold font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All {repositories.length} Repos Audited</span>
              </div>
            ) : (
              <button
                onClick={() => onAuditAll(repositories)}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 transition shadow-lg shadow-emerald-950/40 active:scale-98"
                title="Automatically queue and audit all repositories sequentially"
              >
                <Play className="w-4 h-4 fill-black shrink-0" />
                <span>Audit Profile (All {repositories.length} Repos)</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {repositories.map((repo) => (
          <RepoCard
            key={repo.name}
            repo={repo}
            status={repoStatuses[repo.name] || 'idle'}
            onAnalyze={onAnalyzeRepo}
          />
        ))}
      </div>
    </div>
  );
}
