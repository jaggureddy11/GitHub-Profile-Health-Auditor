import React, { useState } from 'react';
import { ShieldCheck, Zap, FolderSearch, Bot, CheckCircle2, ArrowRight, ArrowLeft, X, Compass, Sparkles, Code, Terminal, Play } from 'lucide-react';

export default function DashboardTourModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: "Welcome to GitHub Profile Auditor",
      badge: "Step 1 of 4 • Architecture",
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      color: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "border-emerald-500/30",
      description: "An enterprise-grade security auditing platform designed to audit public GitHub profiles and repositories for secret leaks, code vulnerabilities, and Git hygiene anti-patterns.",
      highlights: [
        { icon: <Zap className="w-4 h-4 text-emerald-400" />, text: "Multi-Engine Scans (TruffleHog secret detector & Semgrep AST rules)" },
        { icon: <Sparkles className="w-4 h-4 text-teal-300" />, text: "AI Security Copilot studio with 1-click executable .patch generation" },
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Real-time SSE telemetry streams & exportable PDF security reports" }
      ]
    },
    {
      title: "Target Any Profile or Repository",
      badge: "Step 2 of 4 • Input & Scans",
      icon: <Terminal className="w-8 h-8 text-teal-400" />,
      color: "from-teal-500/20 via-emerald-500/10 to-transparent",
      borderColor: "border-teal-500/30",
      description: "Use the left sidebar search panel to initiate instant security scans. You can enter any public GitHub username or direct repository URL.",
      highlights: [
        { icon: <Code className="w-4 h-4 text-teal-300" />, text: "Enter Username (e.g., @torvalds) for profile-wide multi-repo discovery" },
        { icon: <Play className="w-4 h-4 text-emerald-400" />, text: "Enter Repo Link (e.g., facebook/react) for single repository deep scans" },
        { icon: <Compass className="w-4 h-4 text-teal-400" />, text: "Try 1-click sample targets like @octocat or @gaearon" }
      ]
    },
    {
      title: "Repository Grid & Bulk Audits",
      badge: "Step 3 of 4 • Portfolio Analysis",
      icon: <FolderSearch className="w-8 h-8 text-emerald-400" />,
      color: "from-emerald-500/20 via-cyan-500/10 to-transparent",
      borderColor: "border-emerald-500/30",
      description: "When auditing a profile, all public repositories are fetched into an interactive Grid. Audit single repositories individually or trigger parallel batch scans.",
      highlights: [
        { icon: <Zap className="w-4 h-4 text-emerald-400" />, text: "Single Repo Audit: Dedicated page with live telemetry & side-by-side Copilot" },
        { icon: <CheckCircle2 className="w-4 h-4 text-teal-300" />, text: "Audit All Repositories: Concurrent portfolio scanning with batch progress" },
        { icon: <Sparkles className="w-4 h-4 text-emerald-400" />, text: "Zero-data fabrication — all findings are verified against clone trees" }
      ]
    },
    {
      title: "AI Security Copilot & Remediation",
      badge: "Step 4 of 4 • AI Assistance",
      icon: <Bot className="w-8 h-8 text-emerald-400" />,
      color: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "border-emerald-500/30",
      description: "The built-in Security Copilot AI Studio resides on the right panel. Ask questions about your scan findings, get OWASP risk breakdowns, or download direct git patches.",
      highlights: [
        { icon: <Code className="w-4 h-4 text-emerald-400" />, text: "Copy 1-Click .patch code snippets for immediate git apply" },
        { icon: <Sparkles className="w-4 h-4 text-teal-300" />, text: "Ask custom queries like 'How do I remediate CVE-2024-X in this repo?'" },
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Export clean PDF reports & public GitHub security badges" }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className={`relative max-w-xl w-full bg-zinc-950 border ${step.borderColor} rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col transition-all duration-300`}>
        
        {/* Top Decorative Gradient Header */}
        <div className={`p-6 bg-gradient-to-br ${step.color} border-b border-zinc-900 relative`}>
          <button
            onClick={finishTour}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-black/40 hover:bg-zinc-800 transition"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              {step.badge}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl shrink-0 shadow-lg">
              {step.icon}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{step.title}</h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Tour Step Highlights Content */}
        <div className="p-6 space-y-4 bg-zinc-950">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Key Capabilities:</span>
          <div className="space-y-2.5">
            {step.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-black/60 border border-zinc-900 rounded-xl hover:border-zinc-800 transition">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <span className="text-xs text-zinc-200 font-medium leading-normal">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-900 flex items-center justify-between">
          
          {/* Step Progress Dots */}
          <div className="flex items-center space-x-1.5 pl-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx 
                    ? 'w-6 bg-emerald-400' 
                    : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>{currentStep === tourSteps.length - 1 ? "Got It! Start Auditing" : "Next Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
