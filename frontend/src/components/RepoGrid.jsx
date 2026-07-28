import React from 'react';
import RepoCard from './RepoCard';
import { Layers, PlayCircle, Loader2 } from 'lucide-react';

export default function RepoGrid({ repositories = [], repoStatuses = {}, onAnalyzeRepo, onAnalyzeAll, isAnalyzingAll = false, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-zinc-900 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-zinc-900 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-xl mb-6 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Public Repositories Grid
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[11px] font-bold">
              {repositories.length} repos
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Inspect metadata, open repositories on GitHub, or trigger individual &amp; bulk asynchronous scans.
          </p>
        </div>

        {onAnalyzeAll && (
          <button
            onClick={onAnalyzeAll}
            disabled={isAnalyzingAll}
            className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/20 active:scale-98 disabled:opacity-50 shrink-0"
          >
            {isAnalyzingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditing All Repos...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Audit All Repositories
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
