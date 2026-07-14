import React, { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import ReportDashboard from './components/ReportDashboard';
import RepoBreakdown from './components/RepoBreakdown';

// API Base URL (assumes local dev on port 8000)
const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [scanState, setScanState] = useState('idle'); // idle, loading, completed, error
  const [scanReport, setScanReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentScanId, setCurrentScanId] = useState('');
  
  // Custom cycling loading messages for recruiter audit feel
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

  useEffect(() => {
    let intervalId;
    if (scanState === 'loading' && currentScanId) {
      // Cycle loading messages every 3.5 seconds
      intervalId = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(intervalId);
  }, [scanState, currentScanId]);

  // Handle starting a scan
  const handleStartScan = async (username, githubToken) => {
    setScanState('loading');
    setErrorMessage('');
    setLoadingStep(0);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      // Start polling status
      pollScanStatus(initialReport.scan_id);
    } catch (err) {
      console.error(err);
      setScanState('error');
      setErrorMessage(err.message || 'Failed to establish connection with scanning servers.');
    }
  };

  // Poll scan status until completed/failed
  const pollScanStatus = (scanId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch scan progress.');
        }

        const report = await response.json();
        
        if (report.status === 'completed') {
          clearInterval(pollInterval);
          setScanReport(report);
          setScanState('completed');
        } else if (report.status === 'failed') {
          clearInterval(pollInterval);
          setScanState('error');
          setErrorMessage('Repository scan background job failed. Please verify your username is correct and try again.');
        }
      } catch (err) {
        console.error("Polling error:", err);
        // We don't clear the interval immediately on a single transient network error
      }
    }, 2000);

    // Timeout polling after 4 minutes
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

  // Handle resetting state for a new audit
  const handleReset = () => {
    setScanState('idle');
    setScanReport(null);
    setCurrentScanId('');
    setErrorMessage('');
  };

  // Handle Phase 7 Auto-Fix patch trigger (Stretch)
  const handleTriggerFix = async (finding) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      
      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/75 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20 text-white">
              🛡️
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Profile Health Auditor
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                AI Engine Active
              </span>
            </div>
          </div>
          {scanState === 'completed' && (
            <button
              onClick={handleReset}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-lg border border-slate-800 transition duration-150"
            >
              New Scan
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-center">
        
        {scanState === 'idle' && (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
                Audit Your GitHub Profile <br className="hidden sm:inline" />
                Like a Recruiter Would
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Our automated auditor combs through your public repositories checking for committed API keys, structural hygiene failures (.gitignore/README), and general code smells.
              </p>
            </div>
            <ScanForm onScanStart={handleStartScan} isLoading={false} />
          </div>
        )}

        {scanState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 max-w-lg mx-auto text-center space-y-8 animate-pulse">
            {/* Spinning Radar */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-500/20 animate-spin" style={{ animationDuration: '15s' }}></div>
              <div className="absolute inset-2 rounded-full border-4 border-dashed border-blue-500/40 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30 text-white animate-pulse">
                🔍
              </div>
            </div>

            <div className="space-y-3 w-full">
              <h3 className="text-lg font-bold text-slate-200">Analyzing Developer Repositories</h3>
              <p className="text-xs text-cyan-400 font-semibold font-mono h-8">
                {loadingMessages[loadingStep]}
              </p>
              
              {/* Progress Pulse Bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000 ease-out"
                  style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                ></div>
              </div>
              
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block pt-2">
                This may take a minute depending on repository size
              </span>
            </div>
          </div>
        )}

        {scanState === 'completed' && scanReport && (
          <div className="space-y-10">
            <ReportDashboard report={scanReport} onReset={handleReset} />
            <RepoBreakdown 
              repositories={scanReport.repositories} 
              findings={scanReport.findings} 
              // We pass the auto-fix trigger. If backend supports Phase 7, it's clickable.
              onTriggerFix={handleTriggerFix} 
            />
          </div>
        )}

        {scanState === 'error' && (
          <div className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl border border-rose-950/40 p-8 rounded-3xl text-center space-y-6 shadow-2xl shadow-rose-950/10">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Audit Interrupted</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="py-3 px-6 w-full rounded-xl bg-rose-950/30 hover:bg-rose-500 text-rose-400 hover:text-white font-bold transition duration-200 border border-rose-500/30 hover:border-rose-500 shadow-md active:scale-95"
            >
              Reset & Try Again
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/50 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} Profile Health Auditor. Enabled with static analysis & AI synthesis.</p>
      </footer>
    </div>
  );
}
