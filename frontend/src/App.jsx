import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, FolderOpen, Search, AlertTriangle, ShieldCheck, Bot, ChevronLeft, ChevronRight, Shield, Clock, Target } from 'lucide-react';
import ScanForm from './components/ScanForm';
import ReportDashboard from './components/ReportDashboard';
import RepoBreakdown from './components/RepoBreakdown';
import LandingPage from './components/LandingPage';
import QuickStatsCard from './components/QuickStatsCard';
import RepoGrid from './components/RepoGrid';
import LiveScanTelemetry from './components/LiveScanTelemetry';
import ContactPage from './components/ContactPage';
import SecurityCopilot from './components/SecurityCopilot';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const LinkedinIcon = (props) => (
  <svg className={props.className || "w-3.5 h-3.5"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
  </svg>
);

const GithubIcon = (props) => (
  <svg className={props.className || "w-3.5 h-3.5"} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Theme state: 'dark' or 'light'
  const [theme, setTheme] = useState(localStorage.getItem('auditor_theme') || 'dark');

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
  const [otherRepos, setOtherRepos] = useState([]);
  const [targetRepoName, setTargetRepoName] = useState(null);
  const [userReposLoading, setUserReposLoading] = useState(false);
  const [repoStatuses, setRepoStatuses] = useState({});
  const [activeUsername, setActiveUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentScanId, setCurrentScanId] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [isCopilotCollapsed, setIsCopilotCollapsed] = useState(false);

  // Resizable panel widths (in px)
  const [leftWidth, setLeftWidth] = useState(288);
  const [copilotWidth, setCopilotWidth] = useState(340);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Left sidebar resize
  const startResizeLeft = (e) => {
    isResizingLeft.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = leftWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Right copilot resize
  const startResizeRight = (e) => {
    isResizingRight.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = copilotWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isResizingLeft.current) {
        const diff = e.clientX - resizeStartX.current;
        setLeftWidth(Math.max(200, Math.min(480, resizeStartWidth.current + diff)));
      }
      if (isResizingRight.current) {
        const diff = resizeStartX.current - e.clientX;
        setCopilotWidth(Math.max(260, Math.min(620, resizeStartWidth.current + diff)));
      }
    };
    const onMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Batch scan progress state
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
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

  // Save active view in sessionStorage when view changes
  const handleNavView = (targetView) => {
    setView(targetView);
    sessionStorage.setItem('auditor_current_view', targetView);
    if (targetView === 'landing') {
      const url = new URL(window.location.href);
      url.searchParams.delete('user');
      window.history.replaceState({}, '', url.pathname);
    }
  };

  // Rehydrate state on initial mount from URL, sessionStorage, or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('user');
    const savedView = sessionStorage.getItem('auditor_current_view');

    if (urlUser) {
      setActiveUsername(urlUser);
      setView('dashboard');
      sessionStorage.setItem('auditor_current_view', 'dashboard');
      
      const savedQuickstats = localStorage.getItem('auditor_quickstats');
      if (savedQuickstats) {
        try {
          const parsed = JSON.parse(savedQuickstats);
          if (parsed && (parsed.login === urlUser || parsed.username === urlUser)) {
            setQuickstats(parsed);
          } else {
            fetchQuickStats(urlUser, null);
          }
        } catch (e) {
          fetchQuickStats(urlUser, null);
        }
      } else {
        fetchQuickStats(urlUser, null);
      }

      const savedUserRepos = localStorage.getItem('auditor_user_repos');
      if (savedUserRepos) {
        try { setUserRepos(JSON.parse(savedUserRepos)); } catch (e) {}
      } else {
        fetchUserRepos(urlUser, null);
      }

      const savedRepoStatuses = localStorage.getItem('auditor_repo_statuses');
      if (savedRepoStatuses) {
        try { setRepoStatuses(JSON.parse(savedRepoStatuses)); } catch (e) {}
      }

      const savedScanReport = localStorage.getItem('auditor_scan_report');
      if (savedScanReport) {
        try {
          const report = JSON.parse(savedScanReport);
          if (report && (report.username === urlUser || report.github_username === urlUser)) {
            setScanReport(report);
            setScanState('completed');
          }
        } catch (e) {}
      }
    } else if (savedView) {
      setView(savedView);
      const savedUser = localStorage.getItem('auditor_username');
      if (savedUser) {
        setActiveUsername(savedUser);
      }
    } else {
      const savedUser = localStorage.getItem('auditor_username');
      if (savedUser && savedUser.trim() !== '') {
        setActiveUsername(savedUser);
        setView('dashboard');
        sessionStorage.setItem('auditor_current_view', 'dashboard');
        fetchQuickStats(savedUser, null);
        fetchUserRepos(savedUser, null);
      } else {
        setView('landing');
        sessionStorage.setItem('auditor_current_view', 'landing');
      }
    }
  }, []);

  // Save session state to localStorage and sync URL
  useEffect(() => {
    if (activeUsername && view === 'dashboard') {
      localStorage.setItem('auditor_username', activeUsername);
      const url = new URL(window.location.href);
      if (url.searchParams.get('user') !== activeUsername) {
        url.searchParams.set('user', activeUsername);
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } else if (view === 'landing') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('user')) {
        url.searchParams.delete('user');
        window.history.replaceState({}, '', url.pathname);
      }
    }
    
    if (quickstats) {
      localStorage.setItem('auditor_quickstats', JSON.stringify(quickstats));
    }
    if (userRepos && userRepos.length > 0) {
      localStorage.setItem('auditor_user_repos', JSON.stringify(userRepos));
    }
    if (repoStatuses && Object.keys(repoStatuses).length > 0) {
      localStorage.setItem('auditor_repo_statuses', JSON.stringify(repoStatuses));
    }
    if (scanReport) {
      localStorage.setItem('auditor_scan_report', JSON.stringify(scanReport));
    } else {
      localStorage.removeItem('auditor_scan_report');
    }
  }, [activeUsername, view, quickstats, userRepos, repoStatuses, scanReport]);

  // Enforce Dark Mode
  useEffect(() => {
    localStorage.setItem('auditor_theme', 'dark');
    document.documentElement.classList.remove('light');
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

      // Return to exact scan view if login was requested from Copilot sign-in redirect
      const redirectUrl = sessionStorage.getItem('redirect_after_login');
      if (redirectUrl) {
        sessionStorage.removeItem('redirect_after_login');
        try {
          const urlObj = new URL(redirectUrl);
          const redirectUser = urlObj.searchParams.get('user');
          if (redirectUser) {
            setActiveUsername(redirectUser);
            setView('dashboard');
            return;
          }
        } catch (err) {
          console.error("Error evaluating redirect url:", err);
        }
      }

      setView((prevView) => prevView === 'landing' || prevView === 'auth' ? 'dashboard' : prevView);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setScanHistory([]);
      const savedUser = localStorage.getItem('auditor_username');
      if (!savedUser && !activeUsername) {
        setView((prevView) => prevView === 'dashboard' ? 'landing' : prevView);
      }
    }
  }, [token, fetchUserProfile, fetchScanHistory, activeUsername]);

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
    let cleanUsername = username.trim();
    if (cleanUsername.includes('github.com/')) {
      cleanUsername = cleanUsername.split('github.com/')[1].split('/')[0];
    }
    cleanUsername = cleanUsername.replace(/^@/, '').trim();
    if (!cleanUsername) return;

    handleStartScan(cleanUsername, null);
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
    setOtherRepos([]);
    setTargetRepoName(null);
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
        setOtherRepos(data.other_repositories || []);
        setTargetRepoName(data.target_repo_name || null);
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
    
    setScanState('loading');
    setErrorMessage('');
    setScanReport(null);
    setRepoStatuses((prev) => ({ ...prev, [repoName]: 'running' }));
    
    // Smooth scroll to top of page where live telemetry / report is displayed
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/repo-scan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          username: targetUsername,
          repo_name: repoName,
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Single repo scan request failed');
      }
      const data = await res.json();
      setCurrentScanId(data.scan_id);
      setScanReport(data);
      pollSingleRepoScanStatus(data.scan_id, repoName);
    } catch (err) {
      console.error(`Single repo scan error for ${repoName}:`, err);
      setScanState('error');
      setErrorMessage(err.message || `Failed to start audit for ${repoName}`);
      setRepoStatuses((prev) => ({ ...prev, [repoName]: 'failed' }));
    }
  };

  const pollFullScanStatus = (scanId) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scan/${scanId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) return;
        const report = await res.json();
        setScanReport(report);

        if (report.status === 'completed') {
          clearInterval(pollInterval);
          setScanState('completed');
          fetchScanHistory();
        } else if (report.status === 'failed' || report.status === 'timed_out') {
          clearInterval(pollInterval);
          setScanState('completed');
        }
      } catch (err) {
        console.error("Poll scan error:", err);
      }
    }, 1200);

    setTimeout(() => clearInterval(pollInterval), 180000);
  };

  const handleStartScan = async (username, githubToken) => {
    let cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) return;

    setActiveUsername(cleanUsername);
    setView('dashboard');
    setScanState('loading');
    setErrorMessage('');
    setScanReport(null);

    // Concurrently fetch quickstats and repo listing (<1s)
    fetchQuickStats(cleanUsername, githubToken);
    fetchUserRepos(cleanUsername, githubToken);

    // Trigger deep background scan
    try {
      const res = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ username: cleanUsername, github_token: githubToken || undefined })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentScanId(data.scan_id);
        setScanReport(data);
        pollFullScanStatus(data.scan_id);
      } else {
        const errData = await res.json();
        console.warn("Scan initiation notice:", errData.detail);
      }
    } catch (err) {
      console.error("Failed to initiate deep scan:", err);
    }
  };

  const pollSingleRepoScanStatus = (scanId, repoName) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) return;

        const report = await response.json();
        setScanReport(report);

        if (report.status === 'completed') {
          clearInterval(pollInterval);
          setScanState('completed');
          setRepoStatuses((prev) => ({ ...prev, [repoName]: 'completed' }));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          fetchScanHistory();
        } else if (report.status === 'failed' || report.status === 'timed_out') {
          clearInterval(pollInterval);
          setRepoStatuses((prev) => ({ ...prev, [repoName]: report.status }));
          setScanState('completed');
        }
      } catch (err) {
        console.error("Polling error for repo scan:", err);
      }
    }, 1200);

    setTimeout(() => {
      clearInterval(pollInterval);
    }, 180000);
  };

  const pollScanJobToCompletion = (scanId) => {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/scan/${scanId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const report = await res.json();
            if (report.status === 'completed' || report.status === 'failed' || report.status === 'timed_out') {
              clearInterval(interval);
              resolve(report);
            }
          }
        } catch (err) {
          console.warn("Poll scan job error:", err);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, 90000);
    });
  };

  const handleAuditAllRepos = async (repos) => {
    if (!repos || repos.length === 0) return;
    const targetUsername = activeUsername || repos[0]?.owner?.login || 'octocat';
    
    setIsBatchScanning(true);
    setBatchProgress({ current: 0, total: repos.length });
    setScanState('idle');
    setErrorMessage('');

    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      const repoName = repo.name;
      setBatchProgress({ current: i + 1, total: repos.length });
      setRepoStatuses((prev) => ({ ...prev, [repoName]: 'running' }));
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/repo-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: targetUsername,
            repo_name: repoName
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          const report = await pollScanJobToCompletion(data.scan_id);
          if (report && report.status === 'completed') {
            setRepoStatuses((prev) => ({ ...prev, [repoName]: 'completed' }));
          } else {
            setRepoStatuses((prev) => ({ ...prev, [repoName]: 'failed' }));
          }
        } else {
          setRepoStatuses((prev) => ({ ...prev, [repoName]: 'failed' }));
        }
      } catch (err) {
        console.error(`Batch audit error for ${repoName}:`, err);
        setRepoStatuses((prev) => ({ ...prev, [repoName]: 'failed' }));
      }
    }

    setIsBatchScanning(false);
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
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden selection:bg-white/20 font-sans">
      
      {/* Global Header / Navbar */}
      <header className="border-b border-zinc-900 bg-black/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 lg:px-12 py-4">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3.5 cursor-pointer group" onClick={() => handleNavView('landing')}>
            <img 
              src="/logo.png" 
              alt="GitHub Profile Auditor" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-zinc-800 bg-zinc-950 shrink-0 group-hover:border-emerald-500/50 transition"
            />
            <div className="flex items-center space-x-3">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                GitHub Profile Auditor
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 rounded-full border border-emerald-800/80 uppercase tracking-wider">
                Beta
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-3 sm:space-x-5 text-sm font-semibold shrink-0">
            <button 
              onClick={() => setIsCopilotCollapsed(!isCopilotCollapsed)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition text-xs font-bold border ${
                isCopilotCollapsed
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title={isCopilotCollapsed ? 'Open Copilot' : 'Close Copilot'}
            >
              {/* VS Code Copilot robot SVG icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.4" />
                <path d="M5 6.5C5 5.67 5.67 5 6.5 5S8 5.67 8 6.5 7.33 8 6.5 8 5 7.33 5 6.5Z" fill="currentColor"/>
                <path d="M8 6.5C8 5.67 8.67 5 9.5 5S11 5.67 11 6.5 10.33 8 9.5 8 8 7.33 8 6.5Z" fill="currentColor"/>
                <path d="M5.5 10c0-.83 1.12-1.5 2.5-1.5s2.5.67 2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline font-mono">Copilot</span>
            </button>

            <button 
              onClick={() => handleNavView(activeUsername ? 'dashboard' : 'landing')}
              className={`hover:text-white transition text-sm ${view === 'dashboard' || view === 'landing' ? 'text-white font-bold' : 'text-zinc-400'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavView('privacy')}
              className={`hover:text-white transition text-sm ${view === 'privacy' ? 'text-white font-bold' : 'text-zinc-400'}`}
            >
              Privacy &amp; Security
            </button>
            <button 
              onClick={() => handleNavView('contact')}
              className={`hover:text-white transition text-sm ${view === 'contact' ? 'text-white font-bold' : 'text-zinc-400'}`}
            >
              Contact
            </button>

            {token ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-zinc-850">
                <span className="text-xs text-zinc-400 font-mono hidden md:inline">{user?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-800 transition font-mono text-xs font-bold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { handleNavView('auth'); setAuthMode('login'); }}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition text-xs shadow-md"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main 3-Column IDE Layout Container */}
      <div className="flex-1 flex overflow-hidden w-full font-sans bg-black border-0 rounded-none">
        
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
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
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

        {/* VIEW: DEVELOPER CONTACT DETAILS */}
        {view === 'contact' && (
          <ContactPage onBackToDashboard={() => setView(token ? 'dashboard' : 'landing')} />
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

        {/* VIEW: DASHBOARD (AUTHENTICATED / 3-COLUMN IDE BLOCK LAYOUT) */}
        {view === 'dashboard' && (
          <div className="flex-1 flex overflow-hidden w-full font-sans bg-black border-0 rounded-none">
            
            {/* COLUMN 1: LEFT SIDEBAR (Resizable) */}
            <aside
              style={{ width: leftWidth, minWidth: 200, maxWidth: 480 }}
              className="border-r border-zinc-800 bg-zinc-950 p-4 space-y-5 overflow-y-auto no-scrollbar shrink-0 rounded-none flex flex-col justify-between hidden md:flex"
            >
              <div className="space-y-5">
                
                {/* Scan Form Panel */}
                <div className="border border-zinc-800 bg-black p-4 rounded-xl space-y-3 shadow-lg">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center font-mono">
                    <Zap className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> New Repository Scan
                  </h3>
                  <ScanForm user={user} onScanStart={handleStartScan} isLoading={scanState === 'loading'} />
                </div>

                {/* Scan History list */}
                <div className="border border-zinc-800 bg-black p-4 rounded-xl space-y-3 shadow-lg">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center justify-between font-mono">
                    <span className="flex items-center space-x-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Scan History</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">({scanHistory.length})</span>
                  </h3>
                  
                  {scanHistory.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                      {scanHistory.map((pastScan) => (
                        <div 
                          key={pastScan.scan_id}
                          onClick={() => scanState !== 'loading' && handleSelectPastScan(pastScan.scan_id)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex items-center justify-between ${
                            currentScanId === pastScan.scan_id 
                              ? 'bg-zinc-900 border-zinc-700' 
                              : 'bg-zinc-950 border-zinc-850 hover:border-zinc-750'
                          } ${scanState === 'loading' ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-xs text-white truncate font-mono">@{pastScan.username}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {new Date(pastScan.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border font-mono ${
                            pastScan.status === 'completed' 
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' 
                              : (pastScan.status === 'failed' ? 'bg-red-950/40 text-red-400 border-red-900' : 'bg-zinc-900 text-zinc-400 border-zinc-800')
                          }`}>
                            {pastScan.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-zinc-500 py-4 font-mono">No past scans recorded.</p>
                  )}
                </div>

                {/* Additional Sidebar Sections (as drawn in wireframe: "add some more sections here") */}
                <div className="border border-zinc-800 bg-black p-4 rounded-xl space-y-2.5 shadow-lg font-mono text-xs">
                  <h4 className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider border-b border-zinc-900 pb-1 flex items-center justify-between">
                    <span>Security Pipeline Rules</span>
                    <span className="text-emerald-400 text-[9px]">4/4 Active</span>
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center"><ShieldCheck className="w-3 h-3 text-emerald-400 mr-1.5" /> TruffleHog Secrets</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center"><ShieldCheck className="w-3 h-3 text-cyan-400 mr-1.5" /> Semgrep Static Rules</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-bold">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center"><ShieldCheck className="w-3 h-3 text-emerald-400 mr-1.5" /> In-Memory RAM Wipe</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">100%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Target Shortcuts */}
                <div className="border border-zinc-800 bg-black p-4 rounded-xl space-y-2 shadow-lg font-mono text-xs">
                  <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Quick Target Audits</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['octocat', 'torvalds', 'gaearon', 'sindresorhus'].map((sample) => (
                      <button
                        key={sample}
                        onClick={() => handleStartScan(sample, '')}
                        className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded border border-zinc-800 transition text-[11px] truncate text-left"
                      >
                        @{sample}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-zinc-900 text-center">
                <button
                  onClick={() => setView('privacy')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono transition"
                >
                  Manage Account &amp; Data Retention
                </button>
              </div>
            </aside>

            {/* LEFT RESIZE HANDLE */}
            <div
              onMouseDown={startResizeLeft}
              className="w-1 cursor-col-resize bg-transparent hover:bg-emerald-500/40 active:bg-emerald-500/60 transition shrink-0 group relative"
              title="Drag to resize sidebar"
            >
              <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-emerald-500/20 transition rounded" />
            </div>

            {/* COLUMN 2: CENTER MAIN CONTENT AREA */}
            <main className="flex-1 bg-black overflow-y-auto no-scrollbar rounded-none min-w-0" style={{ containerType: 'inline-size', containerName: 'centerMain' }}>
              <div className="p-4 sm:p-6 lg:p-8">
              
              {/* VIEW: IDLE / REPOS LOADED */}
              {scanState === 'idle' && (
                <div className="space-y-8">
                  <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />
                  
                  {userRepos && userRepos.length > 0 ? (
                    <RepoGrid 
                      repositories={userRepos} 
                      otherRepositories={otherRepos}
                      targetRepoName={targetRepoName}
                      activeUsername={activeUsername}
                      repoStatuses={repoStatuses} 
                      isLoading={userReposLoading}
                      onAnalyzeRepo={handleStartSingleRepoScan}
                      onAuditAll={handleAuditAllRepos}
                      isBatchScanning={isBatchScanning}
                      batchProgress={batchProgress}
                    />
                  ) : (
                    <div className="border border-dashed border-zinc-800 p-16 rounded-3xl text-center space-y-3 font-sans">
                      <div className="flex justify-center">
                        <Search className="w-10 h-10 text-zinc-600" />
                      </div>
                      <h4 className="font-bold text-base text-zinc-300">Ready for scan analysis</h4>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        Enter a public GitHub username in the scanner on the left or select a sample target to audit.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: LOADING REPO SCAN — REAL LIVE TELEMETRY */}
              {scanState === 'loading' && (
                <div className="space-y-8">
                  <LiveScanTelemetry report={scanReport} />
                  <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />
                  
                  {userRepos && userRepos.length > 0 && (
                    <RepoGrid 
                      repositories={userRepos} 
                      repoStatuses={repoStatuses} 
                      isLoading={userReposLoading}
                      onAnalyzeRepo={handleStartSingleRepoScan}
                      onAuditAll={handleAuditAllRepos}
                      isBatchScanning={isBatchScanning}
                      batchProgress={batchProgress}
                    />
                  )}
                </div>
              )}

              {/* VIEW: COMPLETED AUDIT REPORT */}
              {scanState === 'completed' && scanReport && (
                <div className="space-y-8 animate-fade-in font-sans">
                  {/* Top Navigation Bar back to Repositories list */}
                  <div className="flex items-center justify-between bg-zinc-950 p-4 px-6 rounded-2xl border border-zinc-800 shadow-lg">
                    <button
                      onClick={handleReset}
                      className="py-2.5 px-5 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl text-xs font-sans transition flex items-center space-x-2 shadow-md"
                    >
                      <span>← Back to Repositories Grid</span>
                    </button>
                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <span className="text-zinc-400">Target Repo: <span className="text-white font-bold">{scanReport.repo_name || activeUsername}</span></span>
                      <span className="text-zinc-200 font-bold bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                        Audit Complete
                      </span>
                    </div>
                  </div>

                  <ReportDashboard 
                    report={scanReport} 
                    onReset={handleReset} 
                    onReRun={(username) => handleStartScan(username, '')}
                    token={token}
                    quickstats={quickstats}
                    quickstatsLoading={quickstatsLoading}
                    onOpenCopilot={() => setIsCopilotCollapsed(false)}
                  />

                  {/* Public Repositories Grid View */}
                  <RepoGrid 
                    repositories={userRepos.length > 0 ? userRepos : scanReport.repositories} 
                    repoStatuses={repoStatuses} 
                    isLoading={userReposLoading}
                    onAnalyzeRepo={handleStartSingleRepoScan}
                    onAuditAll={handleAuditAllRepos}
                    isBatchScanning={isBatchScanning}
                    batchProgress={batchProgress}
                  />
                </div>
              )}

              {/* VIEW: ERROR / INTERRUPTED */}
              {scanState === 'error' && (
                <div className="space-y-8 font-sans">
                  <QuickStatsCard quickstats={quickstats} isLoading={quickstatsLoading} />

                  <div className="border border-red-900/60 bg-zinc-950 p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center mx-auto text-red-400">
                      <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold text-white">Audit Interrupted</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                        {errorMessage}
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="py-3 px-8 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black transition shadow-lg"
                    >
                      Return to Repositories
                    </button>
                  </div>

                  {userRepos && userRepos.length > 0 && (
                    <RepoGrid 
                      repositories={userRepos} 
                      repoStatuses={repoStatuses} 
                      isLoading={userReposLoading}
                      onAnalyzeRepo={handleStartSingleRepoScan}
                      onAuditAll={handleAuditAllRepos}
                      isBatchScanning={isBatchScanning}
                      batchProgress={batchProgress}
                    />
                  )}
                </div>
              )}

              </div>{/* end padding wrapper */}
            </main>

            {/* RIGHT RESIZE HANDLE (only when copilot is open) */}
            {!isCopilotCollapsed && (
              <div
                onMouseDown={startResizeRight}
                className="w-1 cursor-col-resize bg-transparent hover:bg-emerald-500/40 active:bg-emerald-500/60 transition shrink-0 group relative"
                title="Drag to resize Copilot panel"
              >
                <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-emerald-500/20 transition rounded" />
              </div>
            )}

            {/* COLUMN 3: RIGHT SIDEBAR — SECURITY COPILOT PANEL */}
            <SecurityCopilot 
              scanId={currentScanId || scanReport?.scan_id || 'guest'} 
              token={token} 
              username={activeUsername || scanReport?.username || user?.github_username || 'guest'} 
              score={scanReport?.overall_score || 100} 
              onRequireAuth={() => { setView('auth'); setAuthMode('login'); }} 
              isCollapsed={isCopilotCollapsed}
              onToggleCollapse={() => setIsCopilotCollapsed(!isCopilotCollapsed)}
              width={isCopilotCollapsed ? 44 : copilotWidth}
            />

          </div>
        )}

      </div>
    </div>
  );
}
