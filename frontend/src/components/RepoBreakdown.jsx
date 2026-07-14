import React, { useState } from 'react';

export default function RepoBreakdown({ repositories, findings, onTriggerFix }) {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique repositories list
  const repoNames = repositories.map(r => r.name);

  // Filter findings
  const filteredFindings = findings.filter(f => {
    const matchesType = filterType === 'all' || f.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || f.severity === filterSeverity;
    const matchesSearch = searchQuery.strip ? (
      f.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.file_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) : (
      f.repo_name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
      f.file_path.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
      f.description.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
    );

    return matchesType && matchesSeverity && matchesSearch;
  });

  const getSeverityBadgeClass = (severity) => {
    const sev = severity.toLowerCase();
    if (sev === 'critical') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (sev === 'high') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (sev === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'secret') return 'bg-rose-600/20 text-rose-300 border-rose-500/30';
    if (type === 'structural') return 'bg-amber-600/20 text-amber-300 border-amber-500/30';
    return 'bg-sky-600/20 text-sky-300 border-sky-500/30';
  };

  const canAutoFix = (finding) => {
    // Missing LICENSE, README, or .gitignore can be auto-fixed in Phase 7
    return finding.type === 'structural' && (
      finding.rule_id === 'missing-license' ||
      finding.rule_id === 'missing-gitignore' ||
      finding.rule_id === 'missing-readme'
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Detailed Findings</h3>
          <p className="text-xs text-slate-400 mt-0.5">Explore scanned repositories and filter results</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search repo, file, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition duration-150 text-xs w-48"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="secret">Secrets Only</option>
            <option value="structural">Hygiene Only</option>
            <option value="smell">Smells Only</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Findings Table */}
      {filteredFindings.length > 0 ? (
        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/20">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6">Repository</th>
                <th className="py-4 px-3">Type</th>
                <th className="py-4 px-3">File / Location</th>
                <th className="py-4 px-3">Severity</th>
                <th className="py-4 px-6">Description</th>
                {onTriggerFix && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {filteredFindings.map((finding, idx) => (
                <tr key={idx} className="hover:bg-slate-900/20 transition duration-100 text-slate-300">
                  <td className="py-4 px-6 font-bold text-slate-200">{finding.repo_name}</td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getTypeBadgeClass(finding.type)}`}>
                      {finding.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono text-[11px] text-slate-400 select-all">
                    {finding.file_path}
                    {finding.line_number && <span className="text-cyan-500">:L{finding.line_number}</span>}
                  </td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSeverityBadgeClass(finding.severity)}`}>
                      {finding.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 leading-relaxed max-w-xs md:max-w-md">
                    {finding.description}
                    {finding.type === 'secret' && (
                      <span className={`ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded border uppercase ${
                        finding.verification_status === 'live'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700/50'
                      }`}>
                        {finding.verification_status || 'unverified'}
                      </span>
                    )}
                  </td>
                  {onTriggerFix && (
                    <td className="py-4 px-6 text-right">
                      {canAutoFix(finding) ? (
                        <button
                          onClick={() => onTriggerFix(finding)}
                          className="py-1 px-2.5 rounded bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white font-bold transition duration-150 border border-cyan-500/30 text-[10px]"
                        >
                          Generate Fix
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-semibold italic">Manual Fix Required</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-950/20 rounded-2xl border border-dashed border-slate-850">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="text-sm text-slate-400">No findings matching active filters.</p>
        </div>
      )}
    </div>
  );
}
