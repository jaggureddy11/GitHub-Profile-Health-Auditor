import React, { useState, useEffect } from 'react';
import { Lock, Play, Zap, CheckCircle2, UserCheck } from 'lucide-react';

export default function ScanForm({ user, onScanStart, isLoading, defaultUser = '' }) {
  const loggedInGithubUser = user?.github_username;
  const [username, setUsername] = useState(defaultUser || loggedInGithubUser || '');

  // Synchronize username if defaultUser or loggedInGithubUser changes
  useEffect(() => {
    if (defaultUser) {
      setUsername(defaultUser);
    } else if (loggedInGithubUser && !username) {
      setUsername(loggedInGithubUser);
    }
  }, [defaultUser, loggedInGithubUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !username.trim()) return;

    onScanStart(username.trim());
  };

  const handleQuickSample = (sampleUsername) => {
    setUsername(sampleUsername);
    onScanStart(sampleUsername);
  };

  const handleAnalyzeSelf = () => {
    if (loggedInGithubUser) {
      setUsername(loggedInGithubUser);
      onScanStart(loggedInGithubUser);
    }
  };

  return (
    <div className="space-y-5 font-mono text-xs">
      
      {/* Logged-In GitHub Profile Quick Analyze Card */}
      {loggedInGithubUser && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-xl space-y-3 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Detected GitHub Account</span>
                <span className="text-white font-extrabold text-sm">@{loggedInGithubUser}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] bg-emerald-900/80 text-emerald-300 rounded border border-emerald-700 uppercase font-bold">Connected</span>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleAnalyzeSelf}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black font-extrabold text-xs rounded-lg shadow-md transition duration-200 hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-black text-black" />
            <span>Analyze @{loggedInGithubUser} Now</span>
          </button>
        </div>
      )}

      {/* Manual Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="username" className="block font-bold text-zinc-300">
              {loggedInGithubUser ? 'Or Scan Any Public Profile' : 'GitHub Username'} <span className="text-white">*</span>
            </label>
            <span className="text-[10px] text-zinc-500">Public repos only</span>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-bold select-none">
              github.com/
            </span>
            <input
              type="text"
              id="username"
              required
              disabled={isLoading}
              placeholder={loggedInGithubUser || "octocat"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-24 pr-3 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50 text-xs font-mono transition duration-150"
            />
          </div>
        </div>

        {/* Quick Sample Targets */}
        <div className="space-y-1 pt-1">
          <span className="text-[10px] text-zinc-500 font-semibold block">Try a quick sample target:</span>
          <div className="flex flex-wrap gap-2">
            {['octocat', 'torvalds', 'gaearon', 'sindresorhus'].map((sample) => (
              <button
                key={sample}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickSample(sample)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono border border-zinc-800 transition duration-150 disabled:opacity-50"
              >
                @{sample}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full py-2.5 px-4 rounded-lg font-bold text-black bg-white hover:bg-zinc-200 transition duration-150 text-xs disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-white/5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing Repositories...</span>
            </>
          ) : (
            <>
              <span>Run Repository Scan</span>
              <Play className="w-3.5 h-3.5 fill-black" />
            </>
          )}
        </button>

        <div className="pt-1 flex items-center justify-center space-x-1.5 text-[10px] text-zinc-550 border-t border-zinc-900/60 font-mono">
          <Lock className="w-3 h-3" />
          <span>Authenticated via GitHub API &amp; Server Tokens</span>
        </div>
      </form>
    </div>
  );
}
