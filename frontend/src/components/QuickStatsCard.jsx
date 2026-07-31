import React from 'react';
import { 
  Users, 
  BookOpen, 
  Star, 
  GitFork, 
  Calendar, 
  Code2, 
  ExternalLink 
} from 'lucide-react';

export default function QuickStatsCard({ quickstats, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-zinc-950 p-8 sm:p-10 rounded-3xl border border-zinc-800 space-y-6 shadow-2xl relative overflow-hidden font-sans animate-pulse">
        {/* Top Loading Badge */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Fetching Profile Metadata &amp; Repo Stats...
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Target Response: &lt;1s</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-full border border-zinc-800 shrink-0 flex items-center justify-center">
            <span className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          </div>
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="h-7 bg-zinc-900 rounded-xl w-48 mx-auto sm:mx-0 border border-zinc-850"></div>
            <div className="h-4 bg-zinc-900/80 rounded-lg w-32 mx-auto sm:mx-0"></div>
            <div className="h-10 bg-zinc-900/60 rounded-xl w-3/4 mx-auto sm:mx-0"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-zinc-900/70 rounded-2xl border border-zinc-850 p-4 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-12"></div>
              <div className="h-6 bg-zinc-800 rounded w-16"></div>
            </div>
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
    <div className="bg-white dark:bg-zinc-950 p-5 sm:p-10 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-6 sm:space-y-8 shadow-xl relative overflow-hidden font-sans transition-colors duration-200">
      
      {/* Prominent Enlarged Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 text-center sm:text-left w-full">
          
          {/* Enlarged Avatar Image */}
          {avatar_url ? (
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src={avatar_url} 
                alt={username} 
                className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-full border-2 border-slate-300 dark:border-zinc-800 group-hover:border-emerald-500/60 transition-all duration-300 shadow-xl object-cover" 
              />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-slate-100 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold text-2xl font-mono shrink-0 shadow-xl">
              @{username.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Enlarged Typography */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2.5">
              <h2 className="text-2xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight break-words">{name || username}</h2>
              <a 
                href={`https://github.com/${username}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 shrink-0"
                title="Open GitHub Profile"
              >
                <ExternalLink className="w-5 h-5 sm:w-7 sm:h-7" />
              </a>
            </div>

            <p className="text-sm sm:text-lg font-mono text-slate-600 dark:text-zinc-300 font-bold">@{username}</p>

            {bio && (
              <p className="text-xs sm:text-base text-slate-600 dark:text-zinc-300 max-w-2xl font-normal leading-relaxed pt-1">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metric Counters Grid - Enlarged & Minimalistic */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-sm">
        <div className="bg-slate-50 dark:bg-black p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-slate-500 dark:text-zinc-500">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Public Repos</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white block">{public_repos}</span>
        </div>

        <div className="bg-slate-50 dark:bg-black p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-slate-500 dark:text-zinc-500">
            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Stars</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 block">{total_stars}</span>
        </div>

        <div className="bg-slate-50 dark:bg-black p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-slate-500 dark:text-zinc-500">
            <GitFork className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Forks</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400 block">{total_forks}</span>
        </div>

        <div className="bg-slate-50 dark:bg-black p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-slate-500 dark:text-zinc-500">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Followers</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 block">{followers}</span>
        </div>

        <div className="bg-slate-50 dark:bg-black p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-1.5 text-center sm:text-left col-span-2 sm:col-span-1 hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-slate-500 dark:text-zinc-500">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Joined</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 block pt-1.5">{formatDate(account_created_at)}</span>
        </div>
      </div>

      {/* Top Languages Section */}
      {top_languages && top_languages.length > 0 && (
        <div className="space-y-4 font-mono text-sm pt-4 border-t border-slate-200 dark:border-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 dark:text-zinc-200 text-sm font-bold flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
              <span>Top Languages (across public repos)</span>
            </span>
            {last_active_at && (
              <span className="text-xs text-slate-500 dark:text-zinc-500">
                Last active: {formatDate(last_active_at)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top_languages.map((lang, idx) => {
              const barColors = [
                'bg-gradient-to-r from-emerald-500 to-teal-400',
                'bg-gradient-to-r from-cyan-500 to-blue-400',
                'bg-gradient-to-r from-purple-500 to-violet-400',
                'bg-gradient-to-r from-amber-500 to-orange-400',
                'bg-gradient-to-r from-pink-500 to-rose-400',
              ];
              const barColor = barColors[idx % barColors.length];
              return (
                <div key={lang.name} className="bg-slate-50 dark:bg-black p-4 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-2 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="text-slate-900 dark:text-white">{lang.name}</span>
                    <span className="text-slate-500 dark:text-zinc-400">{lang.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`${barColor} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
