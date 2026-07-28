import React from 'react';
import { 
  Users, 
  BookOpen, 
  Star, 
  GitFork, 
  Calendar, 
  Code2, 
  Zap, 
  ExternalLink 
} from 'lucide-react';

export default function QuickStatsCard({ quickstats, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 space-y-4 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-zinc-900 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-900 rounded w-1/3"></div>
            <div className="h-3 bg-zinc-900 rounded w-1/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-zinc-900 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!quickstats) return null;

  const {
    username,
    name,
    avatar_url,
    bio,
    followers,
    following,
    public_repos,
    total_stars,
    total_forks,
    top_languages,
    account_created_at,
    last_active_at
  } = quickstats;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-6 shadow-xl relative overflow-hidden font-sans">
      {/* Accent Beam */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-emerald-500/10 to-transparent blur-2xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {avatar_url ? (
            <img 
              src={avatar_url} 
              alt={username} 
              className="w-16 h-16 rounded-full border-2 border-emerald-500/40 shadow-md object-cover" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-lg font-mono">
              @{username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white">{name || username}</h3>
              <a 
                href={`https://github.com/${username}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-zinc-500 hover:text-emerald-400 transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs font-mono text-emerald-400 font-semibold">@{username}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Instant Metadata Layer</span>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-850">
          "{bio}"
        </p>
      )}

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className="bg-black p-3 rounded-xl border border-zinc-850 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-zinc-400">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Public Repos</span>
          </div>
          <span className="text-base font-extrabold text-white block">{public_repos}</span>
        </div>

        <div className="bg-black p-3 rounded-xl border border-zinc-850 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-zinc-400">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Total Stars</span>
          </div>
          <span className="text-base font-extrabold text-white block">{total_stars}</span>
        </div>

        <div className="bg-black p-3 rounded-xl border border-zinc-850 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-zinc-400">
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Forks</span>
          </div>
          <span className="text-base font-extrabold text-white block">{total_forks}</span>
        </div>

        <div className="bg-black p-3 rounded-xl border border-zinc-850 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-zinc-400">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px]">Followers</span>
          </div>
          <span className="text-base font-extrabold text-white block">{followers}</span>
        </div>

        <div className="bg-black p-3 rounded-xl border border-zinc-850 space-y-1 text-center sm:text-left col-span-2 sm:col-span-1">
          <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Joined</span>
          </div>
          <span className="text-xs font-bold text-zinc-200 block">{formatDate(account_created_at)}</span>
        </div>
      </div>

      {/* Top Languages Section */}
      {top_languages && top_languages.length > 0 && (
        <div className="space-y-3 font-mono text-xs pt-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-bold flex items-center space-x-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Languages (across public repos)</span>
            </span>
            {last_active_at && (
              <span className="text-[10px] text-zinc-500">
                Last active: {formatDate(last_active_at)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {top_languages.map((lang) => (
              <div key={lang.name} className="bg-black p-2.5 rounded-xl border border-zinc-850 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">{lang.name}</span>
                  <span className="text-emerald-400 font-bold">{lang.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${lang.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
