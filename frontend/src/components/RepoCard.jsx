import React from 'react';
import { GitFork, Star, ExternalLink, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-400/20 text-yellow-300 border-yellow-500/30',
  TypeScript: 'bg-blue-400/20 text-blue-300 border-blue-500/30',
  Python: 'bg-emerald-400/20 text-emerald-300 border-emerald-500/30',
  Go: 'bg-cyan-400/20 text-cyan-300 border-cyan-500/30',
  Rust: 'bg-orange-400/20 text-orange-300 border-orange-500/30',
  Java: 'bg-red-400/20 text-red-300 border-red-500/30',
  C: 'bg-gray-400/20 text-gray-300 border-gray-500/30',
  'C++': 'bg-pink-400/20 text-pink-300 border-pink-500/30',
  HTML: 'bg-orange-500/20 text-orange-400 border-orange-600/30',
  CSS: 'bg-indigo-400/20 text-indigo-300 border-indigo-500/30',
};

export default function RepoCard({ repo, status = 'idle', onAnalyze }) {
  const langColorClass = repo.language && LANGUAGE_COLORS[repo.language]
    ? LANGUAGE_COLORS[repo.language]
    : 'bg-slate-700/50 text-slate-300 border-slate-600/40';

  const formattedDate = repo.pushed_at
    ? new Date(repo.pushed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20 group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 truncate">
            {repo.name}
          </h3>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors shrink-0 p-1 rounded-md hover:bg-slate-800"
            title="Open on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[2rem]">
          {repo.description || 'No description provided.'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {repo.language && (
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${langColorClass}`}>
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {repo.stargazers_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-slate-400" />
              {repo.forks_count || 0}
            </span>
          </div>

          {formattedDate && (
            <span className="text-[11px] text-slate-500">
              Updated {formattedDate}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {status === 'idle' && (
            <button
              onClick={() => onAnalyze(repo)}
              className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Analyze this repo
            </button>
          )}

          {status === 'queued' && (
            <div className="w-full py-2 px-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg font-medium text-xs flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Queued for audit...
            </div>
          )}

          {status === 'running' && (
            <div className="w-full py-2 px-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg font-medium text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Scanning code...
            </div>
          )}

          {status === 'completed' && (
            <div className="w-full py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Scan Completed
            </div>
          )}

          {(status === 'failed' || status === 'timed_out') && (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="py-2 px-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg font-medium text-xs flex items-center gap-1.5 flex-1 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">{status === 'timed_out' ? 'Timed Out' : 'Scan Failed'}</span>
              </div>
              <button
                onClick={() => onAnalyze(repo)}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                title="Retry Scan"
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
