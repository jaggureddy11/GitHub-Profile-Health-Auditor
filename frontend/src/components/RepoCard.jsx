import React from 'react';
import { GitFork, Star, ExternalLink, Play, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-950/60 text-yellow-300 border-yellow-800/60',
  TypeScript: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
  Python: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  Go: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
  Rust: 'bg-orange-950/60 text-orange-300 border-orange-800/60',
  Java: 'bg-red-950/60 text-red-300 border-red-800/60',
  C: 'bg-zinc-900 text-zinc-300 border-zinc-800',
  'C++': 'bg-pink-950/60 text-pink-300 border-pink-800/60',
  HTML: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
  CSS: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60',
};

export default function RepoCard({ repo, status = 'idle', onAnalyze }) {
  const langColorClass = repo.language && LANGUAGE_COLORS[repo.language]
    ? LANGUAGE_COLORS[repo.language]
    : 'bg-zinc-900 text-zinc-400 border-zinc-800';

  const formattedDate = repo.pushed_at
    ? new Date(repo.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-200 group shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <h3 className="font-mono font-bold text-sm text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 truncate">
            {repo.name}
          </h3>
          <a
            href={repo.html_url || repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0 p-1 rounded-md hover:bg-zinc-900"
            title="Open on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-zinc-400 mb-4 line-clamp-2 min-h-[2.25rem] font-sans">
          {repo.description || 'No description provided.'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3.5 pb-2.5 border-b border-zinc-900 font-mono">
          <div className="flex items-center gap-2.5">
            {repo.language && (
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${langColorClass}`}>
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px]">
              <Star className="w-3 h-3 text-amber-400" />
              {repo.stargazers_count || 0}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <GitFork className="w-3 h-3 text-zinc-500" />
              {repo.forks_count || 0}
            </span>
          </div>

          {formattedDate && (
            <span className="text-[10px] text-zinc-500">
              {formattedDate}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between font-mono">
          {status === 'idle' && (
            <button
              onClick={() => onAnalyze(repo)}
              className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/20 active:scale-98"
            >
              <Play className="w-3 h-3 fill-current" />
              Audit this repo
            </button>
          )}

          {status === 'queued' && (
            <div className="w-full py-2 px-3 bg-amber-950/40 border border-amber-900/60 text-amber-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Queued...
            </div>
          )}

          {status === 'running' && (
            <div className="w-full py-2 px-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Scanning code...
            </div>
          )}

          {status === 'completed' && (
            <div className="w-full py-2 px-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Audit Completed
            </div>
          )}

          {(status === 'failed' || status === 'timed_out') && (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="py-2 px-2.5 bg-red-950/40 border border-red-900/60 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-1 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{status === 'timed_out' ? 'Timed Out' : 'Failed'}</span>
              </div>
              <button
                onClick={() => onAnalyze(repo)}
                className="py-2 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
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
