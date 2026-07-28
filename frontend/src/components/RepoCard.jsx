import React from 'react';
import { GitFork, Star, ExternalLink, Play, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/80',
  TypeScript: 'bg-blue-950/70 text-blue-300 border-blue-800/80',
  Python: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
  Go: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80',
  Rust: 'bg-orange-950/70 text-orange-300 border-orange-800/80',
  Java: 'bg-red-950/70 text-red-300 border-red-800/80',
  C: 'bg-zinc-900 text-zinc-300 border-zinc-700',
  'C++': 'bg-pink-950/70 text-pink-300 border-pink-800/80',
  HTML: 'bg-orange-950/70 text-orange-400 border-orange-800/80',
  CSS: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80',
};

export default function RepoCard({ repo, status = 'idle', onAnalyze }) {
  const langColorClass = repo.language && LANGUAGE_COLORS[repo.language]
    ? LANGUAGE_COLORS[repo.language]
    : 'bg-zinc-900 text-zinc-400 border-zinc-800';

  const formattedDate = repo.pushed_at
    ? new Date(repo.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-black/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:shadow-emerald-950/10">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-mono font-bold text-base sm:text-lg text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2 truncate">
            {repo.name}
          </h3>
          <a
            href={repo.html_url || repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-emerald-400 transition-colors shrink-0 p-1.5 rounded-lg hover:bg-zinc-900"
            title="Open on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem] font-sans leading-relaxed">
          {repo.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-900 font-mono">
          <div className="flex items-center gap-3">
            {repo.language && (
              <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold ${langColorClass}`}>
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-bold text-zinc-300">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {repo.stargazers_count || 0}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-zinc-300">
              <GitFork className="w-3.5 h-3.5 text-zinc-500" />
              {repo.forks_count || 0}
            </span>
          </div>

          {formattedDate && (
            <span className="text-xs text-zinc-500">
              {formattedDate}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between font-mono">
          {status === 'idle' && (
            <button
              onClick={() => onAnalyze(repo)}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/30 active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              Audit this repo
            </button>
          )}

          {status === 'queued' && (
            <div className="w-full py-3 px-4 bg-amber-950/50 border border-amber-900 text-amber-400 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              Queued for audit...
            </div>
          )}

          {status === 'running' && (
            <div className="w-full py-3 px-4 bg-emerald-950/50 border border-emerald-900 text-emerald-300 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              Scanning code...
            </div>
          )}

          {status === 'completed' && (
            <div className="w-full py-3 px-4 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Audit Completed
            </div>
          )}

          {(status === 'failed' || status === 'timed_out') && (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="py-2.5 px-3 bg-red-950/50 border border-red-900 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 flex-1 truncate">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{status === 'timed_out' ? 'Timed Out' : 'Audit Failed'}</span>
              </div>
              <button
                onClick={() => onAnalyze(repo)}
                className="py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-colors"
                title="Retry Audit"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
