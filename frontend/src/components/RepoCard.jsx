import React from 'react';
import { GitFork, Star, ExternalLink, Play, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function RepoCard({ repo, status = 'idle', onAnalyze }) {
  const formattedDate = repo.pushed_at
    ? new Date(repo.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg font-sans">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-sans font-bold text-base text-white group-hover:text-zinc-200 transition-colors flex items-center gap-2 truncate">
              {repo.name}
            </h3>
            {repo.is_target_repo && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 uppercase tracking-wider">
                🎯 Target Repo
              </span>
            )}
          </div>
          <a
            href={repo.html_url || repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 p-1.5 rounded-lg hover:bg-zinc-900"
            title="Open repository on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2.5rem] font-sans leading-relaxed">
          {repo.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 pb-3.5 border-b border-zinc-900 font-mono flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {repo.language && (
              <span className="px-2.5 py-0.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-bold font-mono">
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 font-mono">
              <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {repo.stargazers_count ? repo.stargazers_count.toLocaleString() : 0}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 font-mono">
              <GitFork className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {repo.forks_count ? repo.forks_count.toLocaleString() : 0}
            </span>
          </div>

          {formattedDate && (
            <span className="text-[11px] text-zinc-500 font-mono shrink-0">
              {formattedDate}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between font-sans">
          {status === 'idle' && (
            <button
              onClick={() => onAnalyze(repo)}
              className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
              <span>Audit Repo</span>
            </button>
          )}

          {status === 'queued' && (
            <div className="w-full py-2.5 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-300"></span>
              </span>
              Queued...
            </div>
          )}

          {status === 'running' && (
            <div className="w-full py-2.5 px-4 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
              Scanning...
            </div>
          )}

          {status === 'completed' && (
            <button
              onClick={() => onAnalyze(repo)}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-zinc-300" />
              <span>View Report</span>
            </button>
          )}

          {(status === 'failed' || status === 'timed_out') && (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="py-2 px-3 bg-red-950/50 border border-red-900 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 flex-1 truncate">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{status === 'timed_out' ? 'Timed Out' : 'Audit Failed'}</span>
              </div>
              <button
                onClick={() => onAnalyze(repo)}
                className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-colors"
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
