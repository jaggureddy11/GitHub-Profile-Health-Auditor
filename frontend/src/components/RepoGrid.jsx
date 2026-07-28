import React from 'react';
import RepoCard from './RepoCard';
import { Layers } from 'lucide-react';

export default function RepoGrid({ repositories = [], repoStatuses = {}, onAnalyzeRepo, isLoading = false }) {
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

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-850">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>Public Repositories</span>
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold">
              {repositories.length} repos
            </span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5 font-normal">
            Select any repository below to perform an instant, isolated security &amp; hygiene audit.
          </p>
        </div>
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
