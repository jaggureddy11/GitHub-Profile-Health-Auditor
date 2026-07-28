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
      <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-6 animate-pulse shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-zinc-900 rounded-full shrink-0"></div>
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="h-6 bg-zinc-900 rounded-lg w-1/2 mx-auto sm:mx-0"></div>
            <div className="h-4 bg-zinc-900 rounded-lg w-1/4 mx-auto sm:mx-0"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-900 rounded-2xl"></div>
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
    <div className="bg-zinc-950 p-8 sm:p-10 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl relative overflow-hidden font-sans">
      {/* Subtle Glow Header Beam */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none"></div>

      {/* Prominent Enriched Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-7 text-center sm:text-left">
          {avatar_url ? (
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-75 blur group-hover:opacity-100 transition duration-300"></div>
              <img 
                src={avatar_url} 
                alt={username} 
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-zinc-950 shadow-2xl object-cover" 
              />
            </div>
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-zinc-900 border-2 border-emerald-500/40 flex items-center justify-center text-zinc-300 font-bold text-2xl font-mono shrink-0">
              @{username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{name || username}</h2>
              <a 
                href={`https://github.com/${username}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-zinc-500 hover:text-emerald-400 transition p-1.5 rounded-lg hover:bg-zinc-900"
                title="Open GitHub Profile"
              >
                <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            </div>
            <p className="text-sm sm:text-base font-mono text-emerald-400 font-bold">@{username}</p>
            {bio && (
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl font-normal leading-relaxed pt-1">
                {bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-4 py-2 rounded-2xl shrink-0">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">Instant Profile Metadata</span>
        </div>
      </div>

      {/* Metric Counters Grid - Enlarged & Minimalistic */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-sm">
        <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Public Repos</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">{public_repos}</span>
        </div>

        <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Stars</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">{total_stars}</span>
        </div>

        <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Forks</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">{total_forks}</span>
        </div>

        <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-1.5 text-center sm:text-left hover:border-zinc-700 transition">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Followers</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">{followers}</span>
        </div>

        <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-1.5 text-center sm:text-left col-span-2 sm:col-span-1 hover:border-zinc-700 transition">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-zinc-400">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Joined</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-zinc-200 block pt-1">{formatDate(account_created_at)}</span>
        </div>
      </div>

      {/* Top Languages Section */}
      {top_languages && top_languages.length > 0 && (
        <div className="space-y-4 font-mono text-sm pt-2 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 text-sm font-bold flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
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
              <div key={lang.name} className="bg-black/90 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-white">{lang.name}</span>
                  <span className="text-emerald-400 font-bold">{lang.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
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
