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
      <div className="bg-zinc-950 p-8 sm:p-10 rounded-3xl border border-zinc-800 space-y-6 animate-pulse shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="w-36 h-36 sm:w-40 sm:h-40 bg-zinc-900 rounded-full shrink-0"></div>
          <div className="space-y-4 flex-1 text-center sm:text-left">
            <div className="h-8 bg-zinc-900 rounded-lg w-1/2 mx-auto sm:mx-0"></div>
            <div className="h-5 bg-zinc-900 rounded-lg w-1/4 mx-auto sm:mx-0"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-2xl"></div>
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
    <div className="bg-zinc-950 p-8 sm:p-10 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Prominent Enlarged Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-5 sm:space-y-0 sm:space-x-8 text-center sm:text-left">
          
          {/* Enlarged Avatar Image */}
          {avatar_url ? (
            <div className="relative shrink-0">
              <img 
                src={avatar_url} 
                alt={username} 
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-zinc-800 hover:border-zinc-600 transition-all duration-300 shadow-2xl object-cover" 
              />
            </div>
          ) : (
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-3xl font-mono shrink-0 shadow-2xl">
              @{username.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Enlarged Typography */}
          <div className="space-y-2">
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{name || username}</h2>
              <a 
                href={`https://github.com/${username}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-zinc-500 hover:text-white transition p-2 rounded-xl hover:bg-zinc-900"
                title="Open GitHub Profile"
              >
                <ExternalLink className="w-6 h-6 sm:w-7 sm:h-7" />
              </a>
            </div>

            <p className="text-base sm:text-lg font-mono text-zinc-300 font-bold">@{username}</p>

            {bio && (
              <p className="text-sm sm:text-base text-zinc-300 max-w-2xl font-normal leading-relaxed pt-1">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metric Counters Grid - Enlarged & Minimalistic */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-sm">
        <div className="bg-black p-5 rounded-2xl border border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Public Repos</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-white block">{public_repos}</span>
        </div>

        <div className="bg-black p-5 rounded-2xl border border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Stars</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-white block">{total_stars}</span>
        </div>

        <div className="bg-black p-5 rounded-2xl border border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <GitFork className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Forks</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-white block">{total_forks}</span>
        </div>

        <div className="bg-black p-5 rounded-2xl border border-zinc-850 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Followers</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-white block">{followers}</span>
        </div>

        <div className="bg-black p-5 rounded-2xl border border-zinc-850 space-y-1.5 text-center sm:text-left col-span-2 sm:col-span-1 hover:border-zinc-700 transition shadow-inner">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Joined</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-zinc-200 block pt-1.5">{formatDate(account_created_at)}</span>
        </div>
      </div>

      {/* Top Languages Section */}
      {top_languages && top_languages.length > 0 && (
        <div className="space-y-4 font-mono text-sm pt-4 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-zinc-200 text-sm font-bold flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-zinc-300" />
              <span>Top Languages (across public repos)</span>
            </span>
            {last_active_at && (
              <span className="text-xs text-zinc-500">
                Last active: {formatDate(last_active_at)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top_languages.map((lang) => (
              <div key={lang.name} className="bg-black p-4 rounded-2xl border border-zinc-850 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-white">{lang.name}</span>
                  <span className="text-zinc-300 font-bold">{lang.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-zinc-200 h-full rounded-full transition-all duration-500" 
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
