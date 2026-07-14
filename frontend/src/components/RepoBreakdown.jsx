import React, { useState } from 'react';

export default function RepoBreakdown({ repositories, findings, onTriggerFix }) {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter findings
  const filteredFindings = findings.filter(f => {
    const matchesType = filterType === 'all' || f.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || f.severity === filterSeverity;
    const matchesSearch = (
      f.repo_name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
      f.file_path.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
      f.description.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
    );

    return matchesType && matchesSeverity && matchesSearch;
  });

  const getSeverityBadgeClass = (severity) => {
    const sev = severity.toLowerCase();
    if (sev === 'critical') return 'bg-white text-black border-white';
    if (sev === 'high') return 'bg-zinc-900 text-white border-zinc-700';
    return 'bg-zinc-950 text-zinc-400 border-zinc-900';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'secret') return 'bg-zinc-900 text-white border-zinc-800';
    return 'bg-zinc-950 text-zinc-400 border-zinc-900';
  };

  const canAutoFix = (finding) => {
    return finding.type === 'structural' && (
      finding.rule_id === 'missing-license' ||
      finding.rule_id === 'missing-gitignore' ||
      finding.rule_id === 'missing-readme'
    );
  };

  return (
    <div className="mono-panel p-8 rounded-3xl shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Detailed Findings</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Explore scanned repositories and filter results</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search repo, file, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition duration-150 text-xs w-48"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-xs cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="secret">Secrets Only</option>
            <option value="structural">Hygiene Only</option>
            <option value="smell">Smells Only</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-xs cursor-pointer"
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
        <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/20">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6">Repository</th>
                <th className="py-4 px-3">Type</th>
                <th className="py-4 px-3">File / Location</th>
                <th className="py-4 px-3">Severity</th>
                <th className="py-4 px-6">Description</th>
                {onTriggerFix && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredFindings.map((finding, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/10 transition duration-100 text-zinc-300">
                  <td className="py-4 px-6 font-bold text-white">{finding.repo_name}</td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getTypeBadgeClass(finding.type)}`}>
                      {finding.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono text-[11px] text-zinc-450 select-all">
                    {finding.file_path}
                    {finding.line_number && <span className="text-white">:L{finding.line_number}</span>}
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
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
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
                          className="py-1 px-2.5 rounded bg-white hover:bg-zinc-200 text-black font-bold transition duration-150 border border-white text-[10px]"
                        >
                          Generate Fix
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[10px] font-semibold italic">Manual Fix</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="text-sm text-zinc-400">No findings matching active filters.</p>
        </div>
      )}
    </div>
  );
}
