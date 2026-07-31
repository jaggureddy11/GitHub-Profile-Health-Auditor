import React, { useState } from 'react';
import { ShieldCheck, Zap, FolderSearch, Bot, CheckCircle2, ArrowRight, ArrowLeft, X, Terminal, Code, Play } from 'lucide-react';

export default function DashboardTourModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: "Welcome to GitHub Profile Health Auditor",
      category: "Architecture & Security Overview",
      stepNumber: "Step 1 of 4",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      description: "An enterprise-grade static security auditing platform engineered to inspect public GitHub profiles and repositories for credential leaks, AST code vulnerabilities, and Git documentation gaps.",
      highlights: [
        { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: "Multi-Engine Scans: TruffleHog secret detection & Semgrep AST rule checks" },
        { icon: <Bot className="w-4 h-4 text-emerald-400" />, text: "AI Security Copilot Studio: Instant analysis and executable .patch generation" },
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Live Telemetry & Reporting: Real-time SSE streaming and PDF export support" }
      ]
    },
    {
      title: "Target Profiles & Single Repositories",
      category: "Scan Input & Target Selection",
      stepNumber: "Step 2 of 4",
      icon: <Terminal className="w-6 h-6 text-teal-400" />,
      description: "Initiate instant security audits from the left navigation panel by providing any public GitHub username or exact repository URL.",
      highlights: [
        { icon: <Code className="w-4 h-4 text-teal-400" />, text: "Profile Search: Enter username (e.g. @torvalds) for full public repository discovery" },
        { icon: <Play className="w-4 h-4 text-teal-400" />, text: "Direct Repo Audit: Enter repository link (e.g. facebook/react) for targeted analysis" },
        { icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />, text: "Sample Targets: Click preset quick-select targets for rapid evaluation" }
      ]
    },
    {
      title: "Repository Grid & Batch Auditing",
      category: "Portfolio Analysis",
      stepNumber: "Step 3 of 4",
      icon: <FolderSearch className="w-6 h-6 text-emerald-400" />,
      description: "Repositories are presented in a structured grid. Audit individual projects or execute parallel batch security scans across entire developer portfolios.",
      highlights: [
        { icon: <FolderSearch className="w-4 h-4 text-emerald-400" />, text: "Single Repo Page: Dedicated workspace with live log telemetry & copilot" },
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Batch Scan: Concurrent repository inspection with progress tracking" },
        { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: "Verified Results: All findings are calculated dynamically from clone trees" }
      ]
    },
    {
      title: "AI Security Copilot & Remediation",
      category: "Automated Fixes",
      stepNumber: "Step 4 of 4",
      icon: <Bot className="w-6 h-6 text-emerald-400" />,
      description: "The embedded Security Copilot Studio resides on the right side panel, providing OWASP risk explanations, interactive remediation queries, and unified git patches.",
      highlights: [
        { icon: <Code className="w-4 h-4 text-emerald-400" />, text: "1-Click Patches: Download unified diffs for immediate git apply execution" },
        { icon: <Bot className="w-4 h-4 text-emerald-400" />, text: "Interactive Querying: Ask custom questions regarding secret purging & hygiene" },
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Export Artifacts: Generate formal PDF security audit reports and badges" }
      ]
    }
  ];

  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTour = () => {
    localStorage.setItem('auditor_has_seen_tour', 'true');
    if (onComplete) onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative max-w-lg w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col transition-all duration-300">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/80 relative">
          <button
            onClick={finishTour}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 mb-3">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 rounded-full">
              {step.stepNumber}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              • {step.category}
            </span>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shrink-0 text-emerald-600 dark:text-emerald-400 shadow-sm">
              {step.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{step.title}</h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Modal Body / Highlights */}
        <div className="p-6 space-y-3 bg-white dark:bg-zinc-950">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block font-mono">
            Key Capabilities
          </span>
          <div className="space-y-2.5">
            {step.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 rounded-xl">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <span className="text-xs text-slate-700 dark:text-zinc-300 font-normal leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
          
          {/* Progress Indicators */}
          <div className="flex items-center space-x-1.5 pl-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx 
                    ? 'w-6 bg-emerald-500' 
                    : 'w-2 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-600'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
            >
              <span>{currentStep === tourSteps.length - 1 ? "Complete Tour" : "Next Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
