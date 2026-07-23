import React, { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import ReportDashboard from './components/ReportDashboard';
import RepoBreakdown from './components/RepoBreakdown';
import LandingPage from './components/LandingPage';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Navigation & view states: 'landing', 'auth', 'dashboard', 'privacy'
  const [view, setView] = useState('landing');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Scan state
  const [scanState, setScanState] = useState('idle'); // 'idle', 'loading', 'completed', 'error'
  const [scanReport, setScanReport] = useState(null);
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
    "Synthesizing findings via Hugging Face AI Inference Layer...",
    "Finalizing Health Score calculation..."
  ];

  // Load user profile if token is set
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
      fetchScanHistory();
      setView('dashboard');
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setScanHistory([]);
      if (view === 'dashboard') setView('landing');
    }
  }, [token]);

  // Handle GitHub OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      handleGitHubCallback(code);
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
  }, [scanState]);

  const fetchUserProfile = async () => {
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
  };

  const fetchScanHistory = async () => {
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
  };

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

  const handleGitHubOAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/github/url`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to start GitHub OAuth:", err);
    }
  };

  const handleGitHubCallback = async (code) => {
    setView('auth');
    setAuthError('Logging in with GitHub...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/github/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'GitHub OAuth callback failed');
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

  const handleStartScan = async (username, githubToken) => {
    setScanState('loading');
    setErrorMessage('');
    setLoadingStep(0);
    setScanReport(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  const pollScanStatus = (scanId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch scan progress.');
        }

        const report = await response.json();
        
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

  const handleTriggerFix = async (finding) => {
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
      <header className="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView(token ? 'dashboard' : 'landing')}>
            <img 
              src="/logo.png" 
              alt="GitHub Profile Auditor" 
              className="w-9 h-9 rounded-lg object-cover border border-zinc-800 bg-black"
            />
            <div className="flex items-center space-x-3">
              <span className="font-bold text-base tracking-tight text-white font-mono">
                GitHub Profile Auditor
              </span>
              <span className="hidden sm:inline px-2 py-0.5 text-[9px] font-bold bg-zinc-900 text-zinc-400 rounded-full border border-zinc-800 uppercase tracking-wider font-mono">
                v2.0 saas
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-4 text-xs font-semibold">
            <button 
              onClick={() => setView('privacy')}
              className={`hover:text-white transition ${view === 'privacy' ? 'text-white' : 'text-zinc-400'}`}
            >
              Data Privacy
            </button>
            {token ? (
              <>
                <span className="text-zinc-650 hidden md:inline font-mono">| {user?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 rounded border border-zinc-850 transition font-mono"
                >
                  logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setView('auth'); setAuthMode('login'); }}
                className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded font-semibold transition"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-grow flex flex-col justify-center">
        
        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <LandingPage 
            onStartRegister={() => { setView('auth'); setAuthMode('register'); }}
            onGitHubOAuth={handleGitHubOAuth}
            onStartQuickScan={(username) => {
              if (token) {
                setView('dashboard');
                handleStartScan(username, '');
              } else {
                setView('auth');
                setAuthMode('register');
              }
            }}
          />
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
                <h3 className="font-bold text-white text-sm border-b border-zinc-850 pb-1">3. Data Retention & Deletion</h3>
                <p>
                  Scan results are saved to your multi-tenant account. You have full ownership of your data. Clicking "Delete Account" immediately deletes your user profile and cascades an absolute database wipe of all repositories, findings, and history linked to your ID.
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
              <span className="flex-shrink mx-4 text-zinc-650 text-[10px] uppercase font-bold font-mono">or</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <button 
              onClick={handleGitHubOAuth}
              className="w-full py-3 bg-black hover:bg-zinc-900 border border-zinc-800 rounded-lg font-bold text-xs text-zinc-300 transition flex items-center justify-center space-x-2 font-mono"
            >
              <span>Continue with GitHub</span>
            </button>

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
                  <span className="mr-2">⚡</span> New Repository Scan
                </h3>
                <ScanForm onScanStart={handleStartScan} isLoading={scanState === 'loading'} />
              </div>

              {/* Scan History list */}
              <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white font-mono flex items-center justify-between">
                  <span>📂 Scan History</span>
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
                  <span className="text-4xl block">🔍</span>
                  <h4 className="font-bold text-sm text-zinc-400">Ready for scan analysis</h4>
                  <p className="text-xs text-zinc-550 max-w-sm mx-auto leading-relaxed">
                    Provide a public GitHub profile username in the scanner on the left to start a profile health check.
                  </p>
                </div>
              )}

              {scanState === 'loading' && (
                <div className="border border-zinc-900 bg-zinc-950 p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-zinc-850 animate-spin" style={{ animationDuration: '10s' }}></div>
                    <div className="absolute inset-2 rounded-full border-4 border-dashed border-zinc-800 animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}></div>
                    <div className="absolute inset-4 rounded-full bg-black border border-zinc-900 flex items-center justify-center text-2xl animate-pulse">
                      🔍
                    </div>
                  </div>

                  <div className="space-y-3 w-full max-w-md">
                    <h3 className="text-sm font-bold text-white font-mono">Running Static Code Analysis</h3>
                    <p className="text-[11px] text-white font-semibold font-mono h-8 leading-normal">
                      {loadingMessages[loadingStep]}
                    </p>
                    
                    {/* Progress Pulse Bar */}
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                      <div 
                        className="h-full bg-white transition-all duration-1000 ease-out"
                        style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                      ></div>
                    </div>
                    
                    <span className="text-[9px] text-zinc-650 uppercase tracking-widest block pt-1 font-mono">
                      Temporary repo clone folders will be destroyed on completion
                    </span>
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
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 text-white flex items-center justify-center text-xl mx-auto">
                    ⚠️
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
