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
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-850">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-zinc-300 shrink-0" />
            <span>Public Repositories</span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold">
              {repositories.length} repos
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            Audit repositories individually or run an automated sequential audit across all profile repositories.
          </p>
        </div>

        {/* Action Header: Audit Profile (Batch) */}
        {onAuditAll && (
          <div className="shrink-0 flex items-center gap-3">
            {isBatchScanning ? (
              <div className="py-2.5 px-4 bg-zinc-900 border border-zinc-750 text-zinc-200 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                <span>Auditing Profile ({batchProgress.current} / {batchProgress.total})</span>
              </div>
            ) : completedCount === repositories.length ? (
              <div className="py-2.5 px-4 bg-zinc-900 border border-zinc-750 text-zinc-200 rounded-xl text-xs font-bold font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                <span>All {repositories.length} Repos Audited</span>
              </div>
            ) : (
              <button
                onClick={() => onAuditAll(repositories)}
                className="py-2.5 px-5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition shadow-md active:scale-98"
                title="Automatically queue and audit all repositories sequentially"
              >
                <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                <span>Audit All ({repositories.length} Repos)</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
