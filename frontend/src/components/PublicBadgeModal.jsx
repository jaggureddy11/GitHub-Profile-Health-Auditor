import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, AlertCircle, ExternalLink, X, Lock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function PublicBadgeModal({ username, onClose }) {
  const [step, setStep] = useState('initial'); // 'initial', 'challenge', 'verified', 'error'
  const [token, setToken] = useState('');
  const [instructions, setInstructions] = useState('');
  const [badgeData, setBadgeData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartChallenge = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/badge/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate verification challenge.');
      setToken(data.verification_token);
      setInstructions(data.instructions);
      setStep('challenge');
    } catch (err) {
      setErrorMessage(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBioToken = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/badge/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          verification_token: token,
          method: 'bio_token'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed.');
      setBadgeData(data);
      setStep('verified');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateBadge = async () => {
    if (!badgeData?.revocation_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/badge/${username}/deactivate?revocation_token=${badgeData.revocation_token}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Deactivation failed.');
      alert('Your public badge has been deactivated and removed from public listings.');
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  const badgeMarkdown = badgeData ? `[![Profile Health](${window.location.origin}${badgeData.badge_svg_url})](https://github.com/${username})` : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-fade-in text-slate-900 dark:text-white font-sans transition-colors duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400 text-[10px] font-mono font-bold rounded-full uppercase">
            <Lock className="w-3 h-3" />
            <span>OPT-IN IDENTITY VERIFICATION</span>
          </div>
          <h3 className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">Make Score Public for @{username}</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            By default, scan results are private to your session. Public badges require proof of GitHub profile ownership.
          </p>
        </div>

        {/* STEP 1: INITIAL CHOICE */}
        {step === 'initial' && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-850 p-4 rounded-xl space-y-2 text-xs text-slate-700 dark:text-zinc-300 font-mono">
              <p className="font-bold text-slate-900 dark:text-white">Verification Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-zinc-400">
                <td>1. Generate a temporary proof-of-ownership token</td>
                <dd className="pl-4 text-[11px]">2. Add token to your GitHub bio temporarily</dd>
                <dd className="pl-4 text-[11px]">3. Click Verify to publish your aggregate score badge</dd>
              </ol>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-mono rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleStartChallenge}
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-extrabold text-xs rounded-xl shadow-lg transition font-mono flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Generating Challenge...' : 'Start Ownership Verification'}</span>
            </button>
          </div>
        )}

        {/* STEP 2: CHALLENGE TOKEN GENERATED */}
        {step === 'challenge' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 font-bold block">1. Add this verification token to your GitHub Bio:</label>
              <div className="p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs">
                <code className="text-emerald-700 dark:text-emerald-400 font-bold truncate pr-2">{token}</code>
                <button
                  onClick={() => copyToClipboard(token, 'token')}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition shrink-0 flex items-center space-x-1"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
                Go to <a href={`https://github.com/settings/profile`} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline inline-flex items-center">github.com/settings/profile <ExternalLink className="w-3 h-3 ml-0.5" /></a> and paste this token into your Bio. You can remove it after verification.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-mono rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleVerifyBioToken}
                disabled={loading}
                className="flex-grow py-3 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-extrabold text-xs rounded-xl shadow-lg transition font-mono flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Verifying Bio Token...' : 'Verify Token & Publish Badge'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFIED & ACTIVE BADGE */}
        {step === 'verified' && badgeData && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>PROFILE OWNERSHIP VERIFIED</span>
              </div>
              <div className="pt-2">
                <img 
                  src={`${API_BASE_URL}${badgeData.badge_svg_url}`} 
                  alt="Verified Profile Badge" 
                  className="mx-auto h-6 shadow-md"
                />
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <label className="text-slate-600 dark:text-zinc-400 font-bold block">README Markdown Embed Code:</label>
              <div className="p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-slate-800 dark:text-zinc-300">
                <code className="truncate pr-2 text-emerald-700 dark:text-emerald-400 text-xs">{badgeMarkdown}</code>
                <button
                  onClick={() => copyToClipboard(badgeMarkdown, 'markdown')}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center space-x-1"
                >
                  {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
                  <span>{copiedMarkdown ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl text-[10px] font-mono text-slate-600 dark:text-zinc-400 space-y-1">
              <p className="font-bold text-slate-800 dark:text-zinc-300">Revocation Access Token:</p>
              <p className="truncate text-slate-500 dark:text-zinc-500">{badgeData.revocation_token}</p>
              <p>Save this token if you ever wish to deactivate public badge visibility later.</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleDeactivateBadge}
                disabled={loading}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-mono"
              >
                Deactivate Badge
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-zinc-200 transition font-mono"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {step === 'error' && (
          <div className="space-y-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 dark:text-red-400 font-mono">{errorMessage || 'An error occurred during verification.'}</p>
            <button
              onClick={() => setStep('initial')}
              className="px-5 py-2 bg-slate-900 dark:bg-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition font-mono"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
