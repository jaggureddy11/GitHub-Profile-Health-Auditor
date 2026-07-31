import React, { useState, useMemo } from 'react';
import { Wrench, Clipboard, ClipboardCheck, Download, CheckCircle2, X, Search, ShieldAlert, Lightbulb } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getBeginnerExplanation(finding) {
  const type = finding.type;
  const rule = (finding.rule_id || '').toLowerCase();
  
  if (type === 'secret') {
    return {
      title: "Secret Key or Credential Detected",
      what: finding.description || "A sensitive API key, access token, or password was found in your source code.",
      why: "If committed to GitHub, automated scanners and attacker bots can scrape this key within seconds to access your cloud services or compromise your account.",
      fix: "1. Remove the key from source code. 2. Move secrets to a local .env file. 3. Immediately revoke and regenerate the key on your provider dashboard."
    };
  }
  if (rule.includes('readme')) {
    return {
      title: "Missing Project README.md File",
      what: "Your repository is missing a README documentation file.",
      why: "Recruiters, hiring managers, and developers look at the README first to understand what your application does and how to run it.",
      fix: "Use the 'AI README' button above to generate a complete markdown README file for your project."
    };
  }
  if (rule.includes('gitignore')) {
    return {
      title: "Missing .gitignore Configuration",
      what: "Your repository lacks a .gitignore file.",
      why: "Without a .gitignore file, build files, dependencies (node_modules), and secret environment files (.env) accidentally get pushed to GitHub.",
      fix: "Click '1-Click Auto-Fix Patch' below to add a standard .gitignore file."
    };
  }
  if (rule.includes('license')) {
    return {
      title: "Missing Open-Source License",
      what: "No open-source LICENSE file was found in your repository root.",
      why: "Without a license, legal default copyright applies, meaning other developers cannot legally reuse or fork your code.",
      fix: "Click '1-Click Auto-Fix Patch' below to add an MIT License file."
    };
  }
  return {
    title: finding.rule_id || "Code Hygiene / Best Practice Warning",
    what: finding.description || "Potential code smell or anti-pattern detected.",
    why: "Resolving code quality warnings prevents unexpected runtime errors, improves code readability, and shows recruiters clean coding practices.",
    fix: "Review the code line snippet below and refactor according to standard language best practices."
  };
}

export default function RepoBreakdown({ findings, token, scanId }) {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Patch Modal state
  const [activePatchFinding, setActivePatchFinding] = useState(null);
  const [patchText, setPatchText] = useState('');
  const [isFetchingPatch, setIsFetchingPatch] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      const matchesType = filterType === 'all' || f.type === filterType;
      const matchesSeverity = filterSeverity === 'all' || f.severity === filterSeverity;
      const matchesSearch = (
        (f.repo_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.file_path || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesType && matchesSeverity && matchesSearch;
    });
  }, [findings, filterType, filterSeverity, searchQuery]);

  const getSeverityBadgeClass = (severity) => {
    const sev = severity ? severity.toLowerCase() : '';
    if (sev === 'critical') return 'bg-red-950 text-red-300 border-red-800 font-black';
    if (sev === 'high') return 'bg-orange-950 text-orange-300 border-orange-800 font-bold';
    if (sev === 'medium') return 'bg-amber-950 text-amber-300 border-amber-800 font-bold';
    return 'bg-zinc-900 text-zinc-300 border-zinc-700 font-medium';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'secret') return 'bg-red-950/80 text-red-300 border-red-800 font-extrabold';
    if (type === 'structural') return 'bg-amber-950/80 text-amber-300 border-amber-800 font-bold';
    return 'bg-zinc-900 text-zinc-300 border-zinc-750 font-bold';
  };

  const canAutoFix = (finding) => {
    const fixableRules = [
      'missing-license',
      'missing-gitignore',
      'missing-readme',
      'leaked-env',
      'leaked-node-modules',
      'leaked-pycache'
    ];
    return finding.type === 'structural' && fixableRules.includes(finding.rule_id);
  };

  const handleOpenFixModal = async (finding) => {
    setActivePatchFinding(finding);
    setPatchText('');
    setIsFetchingPatch(true);
    setCopiedPatch(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          scan_id: scanId,
          repo_name: finding.repo_name,
          rule_id: finding.rule_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate auto-fix patch');
      }

      const text = await response.text();
      setPatchText(text);
    } catch (err) {
      setPatchText(`// Error generating patch: ${err.message}`);
    } finally {
      setIsFetchingPatch(false);
    }
  };

  const handleCopyPatch = () => {
    if (!patchText) return;
    navigator.clipboard.writeText(patchText);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2500);
  };

  const handleDownloadPatch = () => {
    if (!patchText || !activePatchFinding) return;
    const blob = new Blob([patchText], { type: 'text/x-diff' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePatchFinding.repo_name}-${activePatchFinding.rule_id}-fix.patch`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const renderCodeSnippet = (finding) => {
    if (!finding.code_snippet) return null;
    
    const lines = finding.code_snippet.split('\n').filter(line => line.trim() !== '');
    const codeLines = lines.map(line => {
      const pipeIndex = line.indexOf('|');
      if (pipeIndex === -1) return { num: '', text: line, highlight: false };
      const numStr = line.substring(0, pipeIndex);
      const num = parseInt(numStr, 10);
      const text = line.substring(pipeIndex + 1);
      const highlight = num === finding.line_number;
      return { num, text, highlight };
    });

    return (
      <div className="mt-3 border border-zinc-850 rounded-xl overflow-hidden font-mono text-xs bg-black shadow-inner">
        <div className="bg-zinc-900/80 px-4 py-2 border-b border-zinc-850 flex justify-between items-center text-zinc-400 text-xs">
          <span className="font-bold text-zinc-300">{finding.file_path}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            Redacted Code Context
          </span>
        </div>
        <div className="p-3 space-y-1 overflow-x-auto">
          {codeLines.map((l, i) => (
            <div key={i} className={`flex items-start ${l.highlight ? 'bg-red-950/40 text-red-200 font-bold py-1 -mx-3 px-3 border-l-4 border-red-500' : 'text-zinc-400'}`}>
              <span className="w-10 select-none text-zinc-600 text-right pr-4">{l.num}</span>
              <span className="flex-1 whitespace-pre select-all text-left">{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h3 className="text-xl font-black text-white flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2.5 text-zinc-300" /> Discovered Audit Findings &amp; Action Guide
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Plain-English breakdown of issues found, why they matter, and step-by-step instructions to fix them.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search findings or files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-xs w-56 font-mono"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none text-xs cursor-pointer font-medium"
          >
            <option value="all">All Categories ({findings.length})</option>
            <option value="secret">Secret Leaks ({findings.filter(f => f.type === 'secret').length})</option>
            <option value="structural">Setup &amp; Hygiene ({findings.filter(f => f.type === 'structural').length})</option>
            <option value="smell">Code Quality ({findings.filter(f => f.type === 'smell').length})</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none text-xs cursor-pointer font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Beginner Guidance Box */}
      <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-300 font-bold text-xs">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Beginner's Action Plan</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-800 dark:text-zinc-300 font-sans font-medium">
          <div className="bg-white dark:bg-black/60 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl space-y-1">
            <span className="font-extrabold text-red-700 dark:text-red-400 block">1. Fix Secret Leaks First</span>
            <p className="text-slate-700 dark:text-zinc-400 text-[11px] leading-relaxed">Rotate active API keys immediately on provider dashboards (AWS, GitHub, Slack) and remove keys from source code.</p>
          </div>
          <div className="bg-white dark:bg-black/60 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl space-y-1">
            <span className="font-extrabold text-amber-700 dark:text-amber-300 block">2. Add Missing Files</span>
            <p className="text-slate-700 dark:text-zinc-400 text-[11px] leading-relaxed">Add a README.md, LICENSE, and .gitignore file to show recruiters professional repository management.</p>
          </div>
          <div className="bg-white dark:bg-black/60 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl space-y-1">
            <span className="font-extrabold text-slate-900 dark:text-zinc-300 block">3. Use 1-Click Patches</span>
            <p className="text-slate-700 dark:text-zinc-400 text-[11px] leading-relaxed">Click the "1-Click Auto-Fix Patch" button on any issue card below to download or copy ready-to-use fixes.</p>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length > 0 ? (
          filteredFindings.map((finding, idx) => {
            const exp = getBeginnerExplanation(finding);
            return (
              <div key={idx} className="border border-slate-200 dark:border-zinc-850 bg-white dark:bg-black hover:border-slate-300 dark:hover:border-zinc-750 p-5 sm:p-6 rounded-2xl space-y-4 transition duration-200 shadow-md">
                
                {/* Header & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-900 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-black rounded-lg border ${getTypeBadgeClass(finding.type)}`}>
                      {finding.type === 'secret' ? 'SECRET LEAK' : finding.type === 'structural' ? 'REPO HYGIENE' : 'CODE SMELL'}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getSeverityBadgeClass(finding.severity)}`}>
                      {finding.severity ? finding.severity.toUpperCase() : 'INFO'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1 rounded-lg break-all max-w-full">
                      {finding.file_path} {finding.line_number ? `: Line ${finding.line_number}` : ''}
                    </span>
                  </div>

                  {canAutoFix(finding) && (
                    <button
                      onClick={() => handleOpenFixModal(finding)}
                      className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold rounded-lg text-xs transition duration-150 flex items-center space-x-1.5 shadow-md active:scale-95 shrink-0 font-sans"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>1-Click Auto-Fix Patch</span>
                    </button>
                  )}
                </div>

                {/* Plain English Explanation Grid */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">{exp.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-300 mt-1 leading-relaxed font-medium">{exp.what}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-900 space-y-1">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wider block">Why this matters:</span>
                      <p className="text-slate-800 dark:text-zinc-300 leading-relaxed text-xs font-medium">{exp.why}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-900 space-y-1">
                      <span className="text-[10px] text-slate-900 dark:text-zinc-300 font-extrabold uppercase tracking-wider block">How to fix it:</span>
                      <p className="text-slate-800 dark:text-zinc-300 leading-relaxed text-xs font-medium">{exp.fix}</p>
                    </div>
                  </div>
                </div>

                {/* Redacted Code Snippet Context */}
                {finding.code_snippet && renderCodeSnippet(finding)}
              </div>
            );
          })
        ) : (
          <div className="text-center py-14 bg-black rounded-2xl border border-dashed border-zinc-850 space-y-2">
            <div className="flex justify-center mb-1">
              <CheckCircle2 className="w-10 h-10 text-zinc-400" />
            </div>
            <h4 className="text-sm font-bold text-white">No findings matched your criteria!</h4>
            <p className="text-xs text-zinc-500">Try adjusting your category or severity filters above.</p>
          </div>
        )}
      </div>

      {/* Auto-Fix Patch Inspector Modal */}
      {activePatchFinding && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-7 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-zinc-300" />
                  <span>1-Click Auto-Fix Patch Generator</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Target File: <span className="text-white font-bold">{activePatchFinding.file_path}</span>
                </p>
              </div>
              <button
                onClick={() => setActivePatchFinding(null)}
                className="text-zinc-400 hover:text-white p-1 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isFetchingPatch ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-400 space-y-3">
                <div className="animate-spin h-6 w-6 border-2 border-zinc-200 border-t-transparent rounded-full mx-auto"></div>
                <p>Generating unified git patch for {activePatchFinding.rule_id}...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black border border-zinc-850 rounded-xl p-4 font-mono text-xs text-zinc-200 max-h-80 overflow-y-auto whitespace-pre select-all shadow-inner">
                  {patchText}
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5 font-mono">
                  <p className="font-bold text-white">How to apply this patch to your code in 1 step:</p>
                  <p className="text-zinc-400">Save the patch file into your project folder and run:</p>
                  <p className="text-zinc-200 bg-black px-3 py-1.5 rounded-lg border border-zinc-800 inline-block text-xs mt-1 font-mono font-bold">
                    git apply {activePatchFinding.repo_name}-{activePatchFinding.rule_id}-fix.patch
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-900">
                  <button
                    onClick={handleCopyPatch}
                    className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-700 rounded-xl transition duration-150 flex items-center space-x-1.5"
                  >
                    {copiedPatch ? <><ClipboardCheck className="w-3.5 h-3.5 text-zinc-300" /><span>Copied to Clipboard!</span></> : <><Clipboard className="w-3.5 h-3.5" /><span>Copy Patch</span></>}
                  </button>
                  <button
                    onClick={handleDownloadPatch}
                    className="py-2 px-5 bg-white hover:bg-zinc-200 text-xs font-extrabold text-black rounded-xl transition duration-150 shadow-md flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /><span>Download .patch File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
