import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function LiveScanTelemetry({ report }) {
  const group = report?.group_progress || {};
  const total = group.total_repos || report?.repositories?.length || 1;
  const completed = group.completed_count || (report?.status === 'completed' ? 1 : 0);
  const running = group.running_count || (report?.status === 'running' ? 1 : 0);
  const queued = group.queued_count || 0;
  const percent = Math.min(100, Math.round((completed / Math.max(1, total)) * 100));

  const findingsList = report?.findings || [];
  const secretsCount = findingsList.filter(f => f.type === 'secret').length;
  const hygieneCount = findingsList.filter(f => f.type === 'structural').length;
  const smellCount = findingsList.filter(f => f.type === 'smell').length;

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 rounded-3xl space-y-5 shadow-2xl font-mono text-xs animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-500/50 animate-spin" style={{ animationDuration: '3s' }}></div>
            <ShieldCheck className="w-5 h-5 text-zinc-200" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide font-sans">Live Security Scan Pipeline</h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Target: <span className="text-zinc-200 font-bold">@{report?.username || 'user'}</span> • Redis Queue Background Workers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px]">
          <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse"></span>
            <span>Live Analysis Active</span>
          </span>
        </div>
      </div>

      {/* Real Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
          <span>Repositories Scanned: <strong className="text-white">{completed} / {total}</strong></span>
          <span className="text-zinc-200 font-bold">{percent}% COMPLETE</span>
        </div>
        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div 
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      {/* Real Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5">
          <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Queued</div>
          <div className="text-sm font-bold text-zinc-300 mt-0.5">{queued}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5">
          <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Scanning</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">{running}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5">
          <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Completed</div>
          <div className="text-sm font-bold text-zinc-200 mt-0.5">{completed}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5">
          <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Discovered Findings</div>
          <div className="text-sm font-bold text-red-400 mt-0.5">{findingsList.length}</div>
        </div>
      </div>

      {/* Real Live Findings Stream */}
      {findingsList.length > 0 && (
        <div className="border-t border-zinc-900 pt-3 space-y-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center justify-between">
            <span>Live Discovered Findings ({findingsList.length})</span>
            <span className="text-zinc-500">{secretsCount} Secrets • {hygieneCount} Hygiene • {smellCount} Smells</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
            {findingsList.slice(-5).reverse().map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-black/60 border border-zinc-900 p-2 rounded-lg text-[10px]">
                <div className="flex items-center space-x-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${f.type === 'secret' ? 'bg-red-500' : f.type === 'structural' ? 'bg-amber-500' : 'bg-cyan-500'}`}></span>
                  <span className="font-bold text-white font-mono">{f.repo_name}</span>
                  <span className="text-zinc-500 truncate">{f.file_path}:{f.line_number || 1}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${f.severity === 'critical' || f.severity === 'high' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-zinc-900 text-zinc-400'}`}>
                  {f.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
