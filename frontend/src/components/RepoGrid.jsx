import React from 'react';
import RepoCard from './RepoCard';
import { Layers, PlayCircle, Loader2 } from 'lucide-react';

export default function RepoGrid({ repositories = [], repoStatuses = {}, onAnalyzeRepo, onAnalyzeAll, isAnalyzingAll = false }) {
  if (!repositories || repositories.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Public Repositories
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              {repositories.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze individual repositories independently or run a bulk audit across all public codebases.
          </p>
        </div>

        <button
          onClick={onAnalyzeAll}
          disabled={isAnalyzingAll}
          className="py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 disabled:opacity-50 shrink-0"
        >
          {isAnalyzingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Auditing All Repos...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              Analyze All Repos
            </>
          )}
        </button>
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
