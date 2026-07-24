import React, { useState, useEffect, useMemo } from 'react';
import { FolderOpen, FolderClosed, Wrench, Clipboard, ClipboardCheck, Download, CheckCircle2, X, Search, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function RepoBreakdown({ _repositories, findings, token, scanId }) {
  const [expandedRepos, setExpandedRepos] = useState({});
  const [expandedFiles, setExpandedFiles] = useState({});
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
        f.repo_name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        f.file_path.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        f.description.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
      );
      return matchesType && matchesSeverity && matchesSearch;
    });
  }, [findings, filterType, filterSeverity, searchQuery]);

  // Group findings by repo, and then by file path
  const grouped = useMemo(() => {
    const res = {};
    filteredFindings.forEach(f => {
      if (!res[f.repo_name]) {
        res[f.repo_name] = {};
      }
      if (!res[f.repo_name][f.file_path]) {
        res[f.repo_name][f.file_path] = [];
      }
      res[f.repo_name][f.file_path].push(f);
    });
    return res;
  }, [filteredFindings]);

  // Auto-expand all repos and file trees by default
  useEffect(() => {
    const defaultExpandedRepos = {};
    const defaultExpandedFiles = {};
    Object.keys(grouped).forEach(repoName => {
      defaultExpandedRepos[repoName] = true;
      Object.keys(grouped[repoName]).forEach(filePath => {
        defaultExpandedFiles[`${repoName}:${filePath}`] = true;
      });
    });
    setExpandedRepos(defaultExpandedRepos);
    setExpandedFiles(defaultExpandedFiles);
  }, [grouped]);

  const toggleRepo = (repoName) => {
    setExpandedRepos(prev => ({ ...prev, [repoName]: !prev[repoName] }));
  };

  const toggleFile = (fileKey) => {
    setExpandedFiles(prev => ({ ...prev, [fileKey]: !prev[fileKey] }));
  };

  const getSeverityBadgeClass = (severity) => {
    const sev = severity ? severity.toLowerCase() : '';
    if (sev === 'critical') return 'bg-red-950 text-red-300 border-red-800 font-extrabold animate-critical-pulse';
    if (sev === 'high') return 'bg-orange-950 text-orange-300 border-orange-800 font-bold';
    if (sev === 'medium') return 'bg-amber-950 text-amber-300 border-amber-800 font-bold';
    return 'bg-zinc-900 text-zinc-300 border-zinc-700 font-medium';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'secret') return 'bg-red-950/80 text-red-300 border-red-800 font-extrabold';
    if (type === 'structural') return 'bg-amber-950/80 text-amber-300 border-amber-800 font-bold';
    return 'bg-cyan-950/80 text-cyan-300 border-cyan-800 font-bold';
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
          'Authorization': `Bearer ${token}`
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

  // Helper to render real redacted code preview snippets
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
      <div className="mt-3 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs bg-zinc-950 shadow-inner">
        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center text-zinc-400 text-xs">
          <span>{finding.file_path}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-300 bg-green-950/60 px-2 py-0.5 rounded border border-green-800/60">
            Redacted Memory Snippet
          </span>
        </div>
        <div className="p-3 space-y-1 overflow-x-auto">
          {codeLines.map((l, i) => (
            <div key={i} className={`flex items-start ${l.highlight ? 'bg-red-950/30 text-red-200 font-semibold py-1 -mx-3 px-3 border-l-4 border-red-500' : 'text-zinc-400'}`}>
              <span className="w-10 select-none text-zinc-600 text-right pr-4">{l.num}</span>
              <span className="flex-1 whitespace-pre select-all text-left">{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
      
      {/* Filters & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center">
            <FolderClosed className="w-5 h-5 mr-2.5 text-zinc-400" /> Detailed Repository Findings
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Audited file locations, severities, and remediation steps. <span className="text-green-400 font-bold underline decoration-dotted">Secrets are strictly redacted.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files or rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-xs w-56 font-mono"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-black border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none text-xs cursor-pointer font-medium"
          >
            <option value="all">All Categories</option>
            <option value="secret">Secret Leaks Only</option>
            <option value="structural">Structural Hygiene</option>
            <option value="smell">Code Smells</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-black border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none text-xs cursor-pointer font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Repo Tree List */}
      <div className="space-y-5">
        {Object.keys(grouped).length > 0 ? (
          Object.keys(grouped).map(repoName => {
            const repoFiles = grouped[repoName];
            const isRepoExpanded = expandedRepos[repoName] !== false; // Default open
            
            let criticalCount = 0;
            let highCount = 0;
            let otherCount = 0;
            Object.values(repoFiles).forEach(fileFindings => {
              fileFindings.forEach(f => {
                if (f.severity === 'critical') criticalCount++;
                else if (f.severity === 'high') highCount++;
                else otherCount++;
              });
            });

            return (
              <div key={repoName} className="border border-zinc-850 hover:border-zinc-750 rounded-2xl overflow-hidden bg-black shadow-md transition duration-300">
                {/* Repo Header */}
                <div 
                  onClick={() => toggleRepo(repoName)}
                  className="bg-zinc-950 hover:bg-zinc-900/60 p-5 flex items-center justify-between cursor-pointer select-none transition duration-150 border-b border-zinc-900"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-zinc-400">
                      {isRepoExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                    </span>
                    <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-extrabold text-base text-white font-mono">{repoName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {criticalCount > 0 && (
                      <span className="px-2.5 py-1 text-xs font-extrabold bg-red-950 text-red-300 border border-red-800 rounded-full shadow-sm">
                        {criticalCount} Critical
                      </span>
                    )}
                    {highCount > 0 && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-orange-950 text-orange-300 border border-orange-800 rounded-full shadow-sm">
                        {highCount} High
                      </span>
                    )}
                    {otherCount > 0 && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-750 rounded-full">
                        {otherCount} Info
                      </span>
                    )}
                  </div>
                </div>

                {/* Repo Files (Collapsible) */}
                {isRepoExpanded && (
                  <div className="p-5 space-y-4 bg-zinc-950/30 divide-y divide-zinc-900">
                    {Object.keys(repoFiles).map(filePath => {
                      const fileFindings = repoFiles[filePath];
                      const fileKey = `${repoName}:${filePath}`;
                      const isFileExpanded = expandedFiles[fileKey] !== false; // Default open

                      return (
                        <div key={filePath} className="pt-4 first:pt-0">
                          {/* File Path Header */}
                          <div 
                            onClick={() => toggleFile(fileKey)}
                            className="flex items-center justify-between cursor-pointer select-none hover:text-white py-1 transition duration-150"
                          >
                            <div className="flex items-center space-x-2 font-mono text-sm text-zinc-200 font-semibold">
                              {isFileExpanded ? <FolderOpen className="w-4 h-4 text-zinc-400" /> : <FolderClosed className="w-4 h-4 text-zinc-500" />}
                              <span className="underline decoration-zinc-700">{filePath}</span>
                              <span className="text-xs text-zinc-500 font-normal">({fileFindings.length} issue{fileFindings.length > 1 ? 's' : ''})</span>
                            </div>
                            <span className="text-zinc-500 text-xs font-mono">
                              {isFileExpanded ? 'collapse' : 'expand'}
                            </span>
                          </div>

                          {/* Findings in File */}
                          {isFileExpanded && (
                            <div className="pl-6 mt-4 space-y-5">
                              {fileFindings.map((finding, idx) => (
                                <div key={idx} className="border-l-2 border-zinc-800 pl-5 py-1 space-y-2.5">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${getTypeBadgeClass(finding.type)}`}>
                                      {finding.type.toUpperCase()}
                                    </span>
                                    <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${getSeverityBadgeClass(finding.severity)}`}>
                                      {finding.severity ? finding.severity.toUpperCase() : 'INFO'}
                                    </span>
                                    {finding.line_number && (
                                      <span className="text-xs font-mono text-zinc-400">
                                        Line {finding.line_number}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-sm text-zinc-100 leading-relaxed font-semibold">
                                    {finding.description}
                                  </p>

                                  {/* Render redacted code snippet */}
                                  {finding.code_snippet && renderCodeSnippet(finding)}

                                  {/* Auto-Fix Trigger */}
                                  {canAutoFix(finding) && (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => handleOpenFixModal(finding)}
                                        className="py-1.5 px-3.5 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-lg text-xs transition duration-150 border border-white flex items-center space-x-1.5 shadow-md"
                                      >
                                        <Wrench className="w-3.5 h-3.5" /><span>View &amp; Copy 1-Click Auto-Fix Patch</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-black rounded-2xl border border-dashed border-zinc-850">
            <div className="flex justify-center mb-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">No issues found matching your filter criteria!</p>
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
                  <Wrench className="w-4 h-4 text-white" /><span>Unified Auto-Fix Patch Inspector</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Repo: <span className="font-mono text-white font-bold">{activePatchFinding.repo_name}</span> | Rule: <span className="font-mono text-white font-bold">{activePatchFinding.rule_id}</span>
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
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                <p>Synthesizing unified git patch...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black border border-zinc-850 rounded-xl p-4 font-mono text-xs text-zinc-200 max-h-80 overflow-y-auto whitespace-pre select-all shadow-inner">
                  {patchText}
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5 font-mono">
                  <p className="font-bold text-white">How to apply this patch locally in your repository:</p>
                  <p className="text-zinc-400">1. Download or copy the `.patch` file into your local git repository folder.</p>
                  <p className="text-zinc-200 bg-black px-3 py-1.5 rounded-lg border border-zinc-800 inline-block text-xs mt-1">
                    git apply {activePatchFinding.repo_name}-{activePatchFinding.rule_id}-fix.patch
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-900">
                  <button
                    onClick={handleCopyPatch}
                    className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-700 rounded-xl transition duration-150 flex items-center space-x-1.5"
                  >
                    {copiedPatch ? <><ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /><span>Copied!</span></> : <><Clipboard className="w-3.5 h-3.5" /><span>Copy Patch</span></>}
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
