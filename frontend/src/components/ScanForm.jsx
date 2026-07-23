import React, { useState, useEffect } from 'react';
import { Lock, Play } from 'lucide-react';

export default function ScanForm({ onScanStart, isLoading, defaultUser = '' }) {
  const [username, setUsername] = useState(defaultUser || '');

  // Synchronize defaultUser if passed
  useEffect(() => {
    if (defaultUser) {
      setUsername(defaultUser);
    }
  }, [defaultUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !username.trim()) return;

    onScanStart(username.trim());
  };

  const handleQuickSample = (sampleUsername) => {
    setUsername(sampleUsername);
    onScanStart(sampleUsername);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="username" className="block font-bold text-zinc-300">
            GitHub Username <span className="text-white">*</span>
          </label>
          <span className="text-[10px] text-zinc-500">Public profiles only</span>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-550 font-bold select-none">
            github.com/
          </span>
          <input
            type="text"
            id="username"
            required
            disabled={isLoading}
            placeholder="octocat"
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
  );
}
