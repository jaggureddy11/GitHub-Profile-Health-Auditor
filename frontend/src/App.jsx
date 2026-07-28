import React, { useState, useEffect, useCallback } from 'react';
import { Zap, FolderOpen, Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import ScanForm from './components/ScanForm';
import ReportDashboard from './components/ReportDashboard';
import RepoBreakdown from './components/RepoBreakdown';
import LandingPage from './components/LandingPage';
import QuickStatsCard from './components/QuickStatsCard';
import RepoGrid from './components/RepoGrid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Navigation & view states: 'landing', 'auth', 'dashboard', 'privacy'
  const [view, setView] = useState('landing');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Scan state
  const [scanState, setScanState] = useState('idle'); // 'idle', 'loading', 'completed', 'error'
  const [scanReport, setScanReport] = useState(null);
  const [publicScanReport, setPublicScanReport] = useState(null); // zero-auth quick scan result
  const [quickstats, setQuickstats] = useState(null);
  const [quickstatsLoading, setQuickstatsLoading] = useState(false);
  const [userRepos, setUserRepos] = useState([]);
  const [userReposLoading, setUserReposLoading] = useState(false);
  const [repoStatuses, setRepoStatuses] = useState({});
  const [activeUsername, setActiveUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentScanId, setCurrentScanId] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Custom cycling loading messages
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Enumerating public, non-fork repositories...",
    "Initializing Redis Queue background worker...",
    "Cloning repository branches securely...",
    "Scanning codebases for structural hygiene (.gitignore, README, LICENSE)...",
    "Invoking TruffleHog scanner to intercept API keys and credentials...",
    "Redacting and checking verification status of discovered secrets...",
    "Running Semgrep to parse configuration smells and dangerous eval statements...",
    "Aggregating security and hygiene logs...",
    "Synthesizing findings via Groq AI Engine (llama-3.3-70b)...",
    "Finalizing Health Score calculation..."
  ];


  // Handle GitHub OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    if (code) {
      window.history.replaceState({}, document.title, '/');
      handleGitHubCallback(code);
    } else if (errorParam) {
      window.history.replaceState({}, document.title, '/');
      setAuthError(`GitHub OAuth login declined or failed: ${errorParam}`);
      setView('auth');
    }
  }, []);

  const handleGitHubOAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/github/url`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve GitHub OAuth URL");
      }
    } catch (err) {
      console.error("Failed to start GitHub OAuth:", err);
      // Fallback to instant GitHub login prompt
      handlePromptInstantGitHubLogin();
    }
  };

  const handlePromptInstantGitHubLogin = async (prefilledUsername = '') => {
    const targetUser = window.prompt("Enter your GitHub Username to Sign In instantly:", prefilledUsername || "octocat");
    if (targetUser && targetUser.trim()) {
      handleInstantGitHubLogin(targetUser.trim());
    }
  };

  const handleInstantGitHubLogin = async (githubUsername) => {
    setView('auth');
    setAuthError('Logging in with GitHub profile...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/demo-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: githubUsername })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'GitHub authentication failed');
      }
      setToken(data.access_token);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleGitHubCallback = async (code) => {
    setView('auth');
    setAuthError('Exchanging authorization code with GitHub...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/github/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'GitHub OAuth authorization failed');
      }
      setToken(data.access_token);
    } catch (err) {
      console.error("GitHub OAuth Callback Error:", err);
      setAuthError(`GitHub OAuth failed: ${err.message}. You can sign in directly using your GitHub username below.`);
    }
  }

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setToken('');
      }
    } catch (err) {
      console.error(err);
      setToken('');
    }
  }, [token]);

  const fetchScanHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/scans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const history = await response.json();
        setScanHistory(history);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Load user profile if token is set
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
      fetchScanHistory();
      setView((prevView) => prevView === 'landing' || prevView === 'auth' ? 'dashboard' : prevView);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setScanHistory([]);
      setView((prevView) => prevView === 'dashboard' ? 'landing' : prevView);
    }
  }, [token, fetchUserProfile, fetchScanHistory]);

  // Handle GitHub OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    if (code) {
      window.history.replaceState({}, document.title, '/');
      handleGitHubCallback(code);
    } else if (errorParam) {
      window.history.replaceState({}, document.title, '/');
      setAuthError(`GitHub OAuth login declined or failed: ${errorParam}`);
      setView('auth');
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (scanState === 'loading') {
      intervalId = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(intervalId);
  }, [scanState, loadingMessages.length]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      // Automatical login
      handleLogin(e);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      setToken(data.access_token);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setView('landing');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you absolutely sure you want to delete your account? All scanning history, reports, and linked tokens will be permanently erased. This action is irreversible.")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Account and all associated audit data deleted successfully.");
        handleLogout();
      } else {
        alert("Account deletion failed.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleStartQuickScan = async (username) => {
    // Zero-auth public scan — no login required
    let cleanUsername = username.trim();
    if (cleanUsername.includes('github.com/')) {
      cleanUsername = cleanUsername.split('github.com/')[1].split('/')[0];
    }
    cleanUsername = cleanUsername.replace(/^@/, '').trim();
    if (!cleanUsername) return;

    setScanState('loading');
    setErrorMessage('');
    setLoadingStep(0);
    setPublicScanReport(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/public-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Public scan failed');
      }
      setPublicScanReport(data);
      setScanState('public-completed');
    } catch (err) {
      setScanState('error');
      setErrorMessage(err.message || 'Failed to connect to scanning server.');
    }
  };

  const fetchQuickStats = async (username, githubToken) => {
    setQuickstatsLoading(true);
    setQuickstats(null);
    try {
      let url = `${API_BASE_URL}/api/profile/${encodeURIComponent(username)}/quickstats`;
      if (githubToken) {
        url += `?github_token=${encodeURIComponent(githubToken)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuickstats(data);
      }
    } catch (err) {
      console.warn("Failed to fetch quickstats:", err);
    } finally {
      setQuickstatsLoading(false);
    }
  };

  const fetchUserRepos = async (username, githubToken) => {
    setUserReposLoading(true);
    setUserRepos([]);
    setRepoStatuses({});
    try {
      let url = `${API_BASE_URL}/api/profile/${encodeURIComponent(username)}/repos`;
      if (githubToken) {
        url += `?github_token=${encodeURIComponent(githubToken)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUserRepos(data.repositories || []);
      }
    } catch (err) {
      console.warn("Failed to fetch user repos:", err);
    } finally {
      setUserReposLoading(false);
    }
  };

  const handleStartSingleRepoScan = async (repo) => {
    const repoName = repo.name;
    const targetUsername = activeUsername || repo.owner?.login || 'octocat';
    setRepoStatuses((prev) => ({ ...prev, [repoName]: 'queued' }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/repo-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUsername,
          repo_name: repoName,
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Repo scan request failed');
      }
      const data = await res.json();
      setRepoStatuses((prev) => ({ ...prev, [repoName]: 'running' }));
      pollScanStatus(data.scan_id, repoName);
    } catch (err) {
      console.error(`Single repo scan error for ${repoName}:`, err);
      setRepoStatuses((prev) => ({ ...prev, [repoName]: 'failed' }));
    }
  };

  const handleStartScan = async (username, githubToken) => {
    setActiveUsername(username);
    setScanState('loading');
    setErrorMessage('');
    setLoadingStep(0);
    setScanReport(null);

    // Concurrently trigger quickstats fetch and repo listing (<2s target)
    fetchQuickStats(username, githubToken);
    fetchUserRepos(username, githubToken);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username,
          github_token: githubToken || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }

      const initialReport = await response.json();
      setCurrentScanId(initialReport.scan_id);
      pollScanStatus(initialReport.scan_id);
    } catch (err) {
      console.error(err);
      setScanState('error');
      setErrorMessage(err.message || 'Failed to establish connection with scanning servers.');
    }
  };

  const pollScanStatus = (scanId, singleRepoName = null) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch scan progress.');
        }

        const report = await response.json();

        if (singleRepoName) {
          if (report.status === 'completed') {
            setRepoStatuses((prev) => ({ ...prev, [singleRepoName]: 'completed' }));
          } else if (report.status === 'failed') {
            setRepoStatuses((prev) => ({ ...prev, [singleRepoName]: 'failed' }));
          } else if (report.status === 'timed_out') {
            setRepoStatuses((prev) => ({ ...prev, [singleRepoName]: 'timed_out' }));
          }
        } else if (report.repositories && report.repositories.length > 0) {
          setRepoStatuses((prev) => {
            const updated = { ...prev };
            report.repositories.forEach((r) => {
              updated[r.name] = report.status === 'completed' ? 'completed' : 'running';
            });
            return updated;
          });
        }
        
        if (report.status === 'completed') {
          clearInterval(pollInterval);
          setScanReport(report);
          setScanState('completed');
          fetchScanHistory();
        } else if (report.status === 'failed') {
          clearInterval(pollInterval);
          setScanState('error');
          setErrorMessage('Repository scan background job failed. Please verify your username is correct and try again.');
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    // Timeout after 4 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setScanState((currentState) => {
        if (currentState === 'loading') {
          setErrorMessage('Scan process timed out. The profile may have too many files to process.');
          return 'error';
        }
        return currentState;
      });
    }, 240000);
  };

  const handleSelectPastScan = async (scanId) => {
    setScanState('loading');
    setErrorMessage('');
    setLoadingStep(7); // Start closer to completion message
    setScanReport(null);
    setCurrentScanId(scanId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load past report.");
      }
      const report = await response.json();
      setScanReport(report);
      setScanState('completed');
    } catch (err) {
      setScanState('error');
      setErrorMessage(err.message);
    }
  };

  const _handleTriggerFix = async (finding) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scan_id: currentScanId,
          repo_name: finding.repo_name,
          rule_id: finding.rule_id
        })
      });

      if (!response.ok) {
        throw new Error('Auto-fix patch generation failed.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${finding.repo_name}-${finding.rule_id}-fix.patch`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Auto-fix error: ${err.message}`);
    }
  };

  const handleReset = () => {
    setScanState('idle');
    setScanReport(null);
    setCurrentScanId('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-white/20 font-sans">
      
      {/* Global Header */}
      <header className="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => setView(token ? 'dashboard' : 'landing')}>
            <img 
              src="/logo.png" 
              alt="GitHub Profile Auditor" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-zinc-800 bg-black shrink-0"
            />
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="font-bold text-xs sm:text-base tracking-tight text-white font-mono truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                GitHub Profile Auditor
              </span>
              <span className="hidden sm:inline px-2 py-0.5 text-[9px] font-bold bg-emerald-950/80 text-emerald-400 rounded-full border border-emerald-800/80 uppercase tracking-wider font-mono">
                Beta
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4 text-xs font-semibold shrink-0">
            <button 
              onClick={() => setView('privacy')}
              className={`hover:text-white transition text-xs sm:text-sm ${view === 'privacy' ? 'text-white' : 'text-zinc-400'}`}
            >
              Privacy
            </button>
            {token ? (
              <>
                <span className="text-zinc-650 hidden md:inline font-mono">| {user?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 rounded border border-zinc-850 transition font-mono text-[11px] sm:text-xs"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setView('auth'); setAuthMode('login'); }}
                className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded font-semibold transition text-xs"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10 flex-grow flex flex-col justify-start">
        
        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <LandingPage 
            onStartRegister={() => { setView('auth'); setAuthMode('register'); }}
            onGitHubOAuth={handleGitHubOAuth}
            onStartQuickScan={(username) => {
              setView('dashboard');
              handleStartScan(username, '');
            }}
          />
        )}

        {/* VIEW: PUBLIC SCAN — Zero-auth quick scan results */}
        {view === 'public-scan' && (
          <div className="max-w-3xl mx-auto w-full space-y-8 py-6 animate-fade-in">
            {scanState === 'loading' && (
              <div className="border border-zinc-900 bg-zinc-950 p-8 sm:p-10 rounded-2xl flex flex-col justify-start space-y-6 max-w-lg mx-auto">
                <div className="flex items-center space-x-3 border-b border-zinc-900 pb-4">
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin" style={{ animationDuration: '6s' }}></div>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white font-mono">Profile Health Audit Pipeline</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Running live telemetry checks on public repositories</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-left">
                  {loadingMessages.map((msg, idx) => {
                    const isCompleted = idx < loadingStep;
                    const isActive = idx === loadingStep;
                    const isPending = idx > loadingStep;

                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center space-x-3 transition-all duration-300 ${
                          isCompleted ? 'text-zinc-500' : (isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-700')
                        }`}
                      >
                        {isCompleted && (
                          <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px] text-emerald-400 shrink-0 font-bold font-mono">
                            ✓
                          </span>
                        )}
                        {isActive && (
                          <span className="relative flex h-2 w-2 shrink-0 ml-1 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                        {isPending && (
                          <span className="w-2 h-2 rounded-full bg-zinc-800 shrink-0 ml-1 mr-1"></span>
                        )}
                        <span className="text-xs font-mono tracking-tight leading-none">{msg}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                      style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono">
                    <span>STEP {loadingStep + 1} OF {loadingMessages.length}</span>
                    <span>{Math.round(((loadingStep + 1) / loadingMessages.length) * 100)}% COMPLETE</span>
                  </div>
                </div>
              </div>
            )}

            {scanState === 'error' && (
              <div className="text-center py-16 space-y-4">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-white font-bold">{errorMessage || 'Scan failed.'}</p>
                <button onClick={() => { setScanState('idle'); setView('landing'); }} className="px-5 py-2.5 bg-white text-black font-bold rounded-lg text-xs hover:bg-zinc-200 transition">
                  Try Again
                </button>
              </div>
            )}

            {scanState === 'public-completed' && publicScanReport && (
              <div className="space-y-6">
                {/* Basic Report Header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-emerald-400 text-[10px] font-mono font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>PUBLIC BASIC AUDIT REPORT</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white font-mono">@{publicScanReport.username}</h2>
                  <p className="text-zinc-400 text-xs">{publicScanReport.checked_repos} of {publicScanReport.total_repos} repositories analyzed{publicScanReport.capped ? ' (top 15 most active)' : ''}</p>
                </div>

                {/* Basic Score Card */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-extrabold text-white font-mono">{publicScanReport.basic_score}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">HYGIENE SCORE</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-extrabold text-white font-mono">{publicScanReport.total_repos}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">PUBLIC REPOS</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-extrabold text-amber-400 font-mono">{publicScanReport.hygiene_issues?.length || 0}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">ISSUES FOUND</div>
                  </div>
                </div>

                {/* Repositories Preview */}
                {publicScanReport.repositories?.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-white font-mono">Repositories Preview</h3>
                    <div className="divide-y divide-zinc-900">
                      {publicScanReport.repositories.map((repo, i) => (
                        <div key={i} className="flex items-center justify-between py-2.5">
                          <div>
                            <a href={repo.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-white hover:text-emerald-400 transition font-mono">{repo.name}</a>
                            {repo.description && <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-xs">{repo.description}</p>}
                          </div>
                          <span className="text-[9px] text-zinc-600 font-mono">{repo.default_branch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upgrade CTA */}
                <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-950 border border-emerald-800/50 rounded-2xl p-6 text-center space-y-4">
                  <h3 className="text-base font-extrabold text-white">Unlock the Full Security Audit</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {publicScanReport.upgrade_message}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => { setView('auth'); setAuthMode('register'); setScanState('idle'); }}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-lg transition font-mono"
                    >
                      Create Free Account
                    </button>
                    <button
                      onClick={() => { setView('auth'); setAuthMode('login'); setScanState('idle'); }}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition font-mono"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={() => { setScanState('idle'); setView('landing'); setPublicScanReport(null); }} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition font-mono">
                    ← Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: DATA PRIVACY */}
        {view === 'privacy' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-4">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-mono">What We Do With Your Data</h2>
              <p className="text-xs text-zinc-400">Last updated: July 2026</p>
            </div>

            <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-mono">
              <section className="space-y-2">
                <h3 className="font-bold text-white text-sm border-b border-zinc-850 pb-1">1. Scanning Pipeline Security</h3>
                <p>
                  When you initiate a scan, our background Redis Queue (RQ) workers clone your repository branch securely into an ephemeral temp directory. Once static scan checks (Hygiene, TruffleHog, Semgrep) complete, the temporary directory is deleted immediately.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-white text-sm border-b border-zinc-850 pb-1">2. Absolute Secrets Redaction</h3>
                <p>
                  Any credentials extracted during the scan are parsed locally in temporary worker files. Once the exact file paths and line numbers are identified, the raw secret value is wiped and deleted from memory. Only file locations, rules, and severities are saved in the database.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-white text-sm border-b border-zinc-850 pb-1">3. Anonymous Privacy & Opt-In Public Badges</h3>
                <p>
                  All scans are anonymous and session-scoped by default using HttpOnly session cookies. Scan findings are private to your session and are never queryable or exposed publicly by username.
                </p>
                <p className="pt-1">
                  Public score badges are strictly optional and require explicit proof-of-ownership (such as adding a challenge token to your GitHub bio or logging in with GitHub OAuth). You can deactivate or revoke your public badge at any time using your revocation access token.
                </p>
              </section>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                onClick={() => setView(token ? 'dashboard' : 'landing')}
                className="px-6 py-2 bg-white text-black font-bold rounded-lg text-xs hover:bg-zinc-200 transition"
              >
                Go Back
              </button>
              
              {token && (
                <button 
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 border border-red-950 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-bold rounded-lg transition"
                >
                  Delete My Account & Data
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW: AUTHENTICATION */}
        {view === 'auth' && (
          <div className="max-w-md w-full mx-auto bg-zinc-950 border border-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-mono">
                {authMode === 'login' ? 'Sign In to Profile Auditor' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-zinc-500">
                {authMode === 'login' ? 'Manage your dashboard and track scan histories' : 'Get access to automated security scans and reports'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-lg text-xs font-medium font-mono text-center">
                {authError}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4 text-xs font-semibold font-mono">
              <div className="space-y-1.5">
                <label className="text-zinc-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="octocat@github.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-800 focus:outline-none focus:border-zinc-700 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-800 focus:outline-none focus:border-zinc-700 font-mono text-xs"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold text-xs transition active:scale-98"
              >
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink mx-4 text-zinc-550 text-[10px] uppercase font-bold font-mono">or</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={handleGitHubOAuth}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 font-extrabold text-xs text-black rounded-lg transition flex items-center justify-center space-x-2 font-mono shadow-md shadow-emerald-500/20 active:scale-98"
              >
                <span>Continue with GitHub</span>
              </button>

              <button 
                onClick={() => handlePromptInstantGitHubLogin()}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg font-bold text-xs text-zinc-300 transition flex items-center justify-center space-x-2 font-mono"
              >
                <span>Sign in via GitHub Username</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-zinc-550 font-mono">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-zinc-300 font-bold hover:underline"
              >
                {authMode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        )}

        {/* VIEW: DASHBOARD (AUTHENTICATED) */}
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Sidebar: ScanForm & Scan History */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Scan Form Panel */}
              <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white font-mono flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-emerald-400" /> New Repository Scan
                </h3>
                <ScanForm user={user} onScanStart={handleStartScan} isLoading={scanState === 'loading'} />
              </div>

              {/* Scan History list */}
              <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white font-mono flex items-center justify-between">
                  <span className="flex items-center space-x-1.5"><FolderOpen className="w-4 h-4 text-zinc-400" /><span>Scan History</span></span>
                  <span className="text-[10px] text-zinc-550">({scanHistory.length} total)</span>
                </h3>
                
                {scanHistory.length > 0 ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {scanHistory.map((pastScan) => (
                      <div 
                        key={pastScan.scan_id}
                        onClick={() => scanState !== 'loading' && handleSelectPastScan(pastScan.scan_id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition select-none flex items-center justify-between ${
                          currentScanId === pastScan.scan_id 
                            ? 'bg-zinc-900 border-zinc-750' 
                            : 'bg-black border-zinc-900 hover:border-zinc-800'
                        } ${scanState === 'loading' ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-xs text-white truncate font-mono">@{pastScan.username}</p>
                          <p className="text-[9px] text-zinc-550 font-mono">
                            {new Date(pastScan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase border ${
                            pastScan.status === 'completed' 
                              ? 'bg-zinc-950 text-green-400 border-green-950' 
                              : (pastScan.status === 'failed' ? 'bg-red-950/20 text-red-400 border-red-950' : 'bg-zinc-900 text-zinc-400 border-zinc-800')
                          }`}>
                            {pastScan.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-zinc-650 py-6 font-mono">No past repository scans recorded.</p>
                )}
              </div>

              {/* Data Deletion under dashboard */}
              <div className="p-4 border border-zinc-950 rounded-xl text-center">
                <button
                  onClick={() => setView('privacy')}
                  className="text-[10px] text-zinc-650 hover:text-zinc-500 font-bold uppercase tracking-wider font-mono hover:underline"
                >
                  Manage Account & Data Retention
                </button>
              </div>

            </div>

            {/* Right Main Panel: Scan Output / State */}
            <div className="lg:col-span-2 space-y-6">
              
              {scanState === 'idle' && (
                <div className="border border-dashed border-zinc-800 p-20 rounded-2xl text-center space-y-3">
                  <div className="flex justify-center">
                    <Search className="w-10 h-10 text-zinc-700" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-400">Ready for scan analysis</h4>
                  <p className="text-xs text-zinc-550 max-w-sm mx-auto leading-relaxed">
                    Provide a public GitHub profile username in the scanner on the left to start a profile health check.
                  </p>
                </div>
              )}

              {scanState === 'loading' && (
                <div className="space-y-6">
                  {/* Instant Profile QuickStats Card */}
                  <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />

                  {/* Public Repositories Grid View */}
                  <RepoGrid 
                    repositories={userRepos} 
                    repoStatuses={repoStatuses} 
                    isLoading={userReposLoading}
                    onAnalyzeRepo={handleStartSingleRepoScan}
                  />

                  <div className="border border-zinc-900 bg-zinc-950 p-8 sm:p-10 rounded-2xl flex flex-col justify-start space-y-6">
                    {/* Header */}
                    <div className="flex items-center space-x-3 border-b border-zinc-900 pb-4">
                      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin" style={{ animationDuration: '6s' }}></div>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-white font-mono">Profile Health Audit Pipeline</h3>
                        <p className="text-[10px] text-zinc-500 font-mono">Running live telemetry checks on public repositories</p>
                      </div>
                    </div>

                    {/* Progressive steps checklist */}
                    <div className="space-y-3.5 text-left max-w-lg">
                      {loadingMessages.map((msg, idx) => {
                        const isCompleted = idx < loadingStep;
                        const isActive = idx === loadingStep;
                        const isPending = idx > loadingStep;

                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center space-x-3 transition-all duration-300 ${
                              isCompleted ? 'text-zinc-500' : (isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-700')
                            }`}
                          >
                            {isCompleted && (
                              <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px] text-emerald-400 shrink-0 font-bold font-mono">
                                ✓
                              </span>
                            )}
                            {isActive && (
                              <span className="relative flex h-2 w-2 shrink-0 ml-1 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            {isPending && (
                              <span className="w-2 h-2 rounded-full bg-zinc-800 shrink-0 ml-1 mr-1"></span>
                            )}
                            <span className="text-xs font-mono tracking-tight leading-none">{msg}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 max-w-lg">
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                          style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                        <span>STEP {loadingStep + 1} OF {loadingMessages.length}</span>
                        <span>{Math.round(((loadingStep + 1) / loadingMessages.length) * 100)}% COMPLETE</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {scanState === 'completed' && scanReport && (
                <div className="space-y-6">
                  <ReportDashboard 
                    report={scanReport} 
                    onReset={handleReset} 
                    onReRun={(username) => handleStartScan(username, '')}
                    token={token}
                    quickstats={quickstats}
                    quickstatsLoading={quickstatsLoading}
                  />

                  {/* Public Repositories Grid View */}
                  <RepoGrid 
                    repositories={userRepos.length > 0 ? userRepos : scanReport.repositories} 
                    repoStatuses={repoStatuses} 
                    isLoading={userReposLoading}
                    onAnalyzeRepo={handleStartSingleRepoScan}
                  />

                  <RepoBreakdown 
                    repositories={scanReport.repositories} 
                    findings={scanReport.findings}
                    token={token}
                    scanId={currentScanId || scanReport?.scan_id}
                  />
                </div>
              )}

              {scanState === 'error' && (
                <div className="border border-zinc-900 bg-zinc-950 p-10 rounded-2xl text-center space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/60 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white font-mono">Audit Interrupted</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="py-2.5 px-6 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition border border-white"
                  >
                    Close & Reset
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Global Footer */}
      <footer className="border-t border-zinc-950 py-5 text-center text-[10px] text-zinc-600 bg-black font-mono">
        <p>&copy; {new Date().getFullYear()} GitHub Profile Auditor. Enabled with static analysis &amp; AI synthesis. Ephemeral clone memory wiping.</p>
      </footer>
    </div>
  );
}
