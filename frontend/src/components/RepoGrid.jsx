import React, { useState } from 'react';
import RepoCard from './RepoCard';
import { Layers, Play, CheckCircle2, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function RepoGrid({ 
  repositories = [], 
  otherRepositories = [],
  targetRepoName = null,
  activeUsername = '',
  repoStatuses = {}, 
  onAnalyzeRepo, 
  onAuditAll,
  isBatchScanning = false,
  batchProgress = { current: 0, total: 0 },
  isLoading = false 
}) {
  const [showOtherRepos, setShowOtherRepos] = useState(false);

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
  const isSingleTargetMode = Boolean(targetRepoName) || (repositories.length === 1 && otherRepositories.length > 0);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-850">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{isSingleTargetMode ? "Targeted Repository Audit" : "Public Repositories"}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold">
              {isSingleTargetMode ? `1 repo target` : `${repositories.length} repos`}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            {isSingleTargetMode 
              ? `Direct scan isolated to repository ${targetRepoName || repositories[0]?.name}. Audit this repository or view remaining user repositories.`
              : "Audit repositories individually or run an automated sequential audit across all profile repositories."
            }
          </p>
        </div>

        {/* Action Header: Audit Profile (Batch) */}
        {onAuditAll && !isSingleTargetMode && (
          <div className="shrink-0 flex items-center gap-3">
            {isBatchScanning ? (
              <div className="py-2.5 px-4 bg-zinc-900 border border-zinc-750 text-zinc-200 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                <span>Auditing Profile ({batchProgress.current} / {batchProgress.total})</span>
              </div>
            ) : completedCount === repositories.length ? (
              <div className="py-2.5 px-4 bg-zinc-900 border border-zinc-750 text-zinc-200 rounded-xl text-xs font-bold font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

      {/* Primary Target / Main Repositories Grid */}
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

      {/* Option to View Remaining Repositories of User Profile */}
      {otherRepositories && otherRepositories.length > 0 && (
        <div className="pt-6 border-t border-zinc-850">
          {!showOtherRepos ? (
            <button
              onClick={() => setShowOtherRepos(true)}
              className="w-full py-4 px-6 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl text-zinc-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-between transition shadow-xl group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>View Remaining {otherRepositories.length} Repositories of @{activeUsername || 'user'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 group-hover:text-emerald-400">
                <span>Expand List</span>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>Other Public Repositories</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 text-[11px]">
                    {otherRepositories.length} repos
                  </span>
                </h3>
                <button
                  onClick={() => setShowOtherRepos(false)}
                  className="text-xs font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800"
                >
                  <span>Hide Repositories</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherRepositories.map((repo) => (
                  <RepoCard
                    key={repo.name}
                    repo={repo}
                    status={repoStatuses[repo.name] || 'idle'}
                    onAnalyze={onAnalyzeRepo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
