import React, { useState, useEffect } from 'react';

export default function ScanForm({ onScanStart, isLoading }) {
  const [username, setUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');

  // Load token from localStorage if present
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setGithubToken(savedToken);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !username.trim()) return;

    // Save token if provided
    if (githubToken) {
      localStorage.setItem('github_token', githubToken);
    } else {
      localStorage.removeItem('github_token');
    }

    onScanStart(username.trim(), githubToken.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto mono-panel p-8 rounded-3xl shadow-xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4 shadow-md text-white font-extrabold text-2xl">
          🚀
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Start Profile Audit
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          Audit your public repositories for secrets leaks, smells, and structural neglects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-zinc-300 mb-2">
            GitHub Username <span className="text-white">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500 font-medium">
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
              className="block w-full pl-28 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition duration-150 disabled:opacity-50 text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label htmlFor="token" className="block text-sm font-semibold text-zinc-300 mb-1">
            GitHub Personal Access Token (Optional)
          </label>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500">
              Recommended to avoid rate limits (needs <code>read:user</code> / public repo access).
            </span>
          </div>
          <input
            type="password"
            id="token"
            disabled={isLoading}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            className="block w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-850 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition duration-150 disabled:opacity-50 text-sm font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !username}
          className="w-full py-4 px-6 rounded-xl font-bold text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-1 focus:ring-white transition duration-200 transform active:scale-[0.98] shadow-md disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Auditing Profile...</span>
            </span>
          ) : (
            <span>Analyze Profile</span>
          )}
        </button>
      </form>
    </div>
  );
}
