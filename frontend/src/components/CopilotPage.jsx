import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  Sparkles, 
  KeyRound, 
  Wrench, 
  Terminal, 
  ArrowLeft,
  ArrowRight,
  Send,
  Lock,
  Zap,
  Activity,
  Cpu
} from 'lucide-react';

export default function CopilotPage({ onBackToDashboard }) {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: "Hi! I'm your Security Copilot. I analyze your repositories' static analysis findings to help you understand threats, write secure code, and generate patches. Ask me anything about your scan results!",
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sampleQuestions = [
    { q: "How do I fix the AWS credential leak?", a: "To fix the AWS credential leak, you must: 1. Immediately revoke the active key (AKIA...) in the AWS console. 2. Remove the plaintext key from your config file. 3. Use git-filter-repo or BFG Repo-Cleaner to purge the file containing the leak from your repository commit history. 4. Re-configure the application to load the key via environment variables (e.g., process.env.AWS_ACCESS_KEY_ID)." },
    { q: "What does Hygiene Score mean?", a: "The Hygiene Score is calculated by evaluating the general safety and documentation standards of your repositories. You lose points for missing root files: .gitignore (-15 pts), LICENSE (-10 pts), or README.md (-15 pts). Maintaining these files ensures other contributors don't commit build garbage and can legally verify your code's license status." },
    { q: "How does the in-memory redaction work?", a: "Our scanning pipeline runs in ephemeral RAM. When TruffleHog matches a secret signature (like a Stripe or Slack key), the raw secret value is instantly intercepted and replaced with `[REDACTED_BY_AUDITOR]` in memory before any data is logged or written to the database. Your raw private credentials never touch our disks." }
  ];

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newMsg = {
      sender: 'user',
      text: textToSend,
      time: 'Just now'
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    // Look for matching sample answer
    const match = sampleQuestions.find(sq => textToSend.toLowerCase().includes(sq.q.toLowerCase()) || sq.q.toLowerCase().includes(textToSend.toLowerCase()));
    
    setTimeout(() => {
      setIsTyping(false);
      const reply = {
        sender: 'copilot',
        text: match 
          ? match.a 
          : "I can help clarify specific details about static analysis findings, write patches, or guide you on secret cleanup. Try clicking one of the sample questions below to see how I work!",
        time: 'Just now'
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-10 px-4 font-sans text-zinc-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot Engine v1.2</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Security Copilot</h1>
          <p className="text-sm text-zinc-400">
            Real-time interactive threat intelligence, code patching, and remediation advisor.
          </p>
        </div>
        
        <button
          onClick={onBackToDashboard}
          className="py-2.5 px-5 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>

      {/* CORE FEATURES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-mono">Natural Language Queries</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Chat naturally about scan results. Ask what a vulnerability means, how recruiters view your hygiene gaps, or what action is needed.
          </p>
        </div>

        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-900/60 flex items-center justify-center text-cyan-400">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-mono">1-Click Auto-Fix Patches</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Copilot automatically creates unified `.patch` files to cure hygiene flaws. Download the patch and apply it locally in one step.
          </p>
        </div>

        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-900/60 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-mono">Private & Secure</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Copilot runs on sanitized data. Exposed secrets are stripped *before* sending context to the AI, ensuring complete data security.
          </p>
        </div>

      </div>

      {/* CHAT SIMULATOR INTERACTIVE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
        
        {/* Left Side: Detail & Tech Info */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Under the Hood</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Security Copilot pairs static engine outputs from **TruffleHog** and **Semgrep** with custom reasoning models to construct remediation blueprints customized to your repositories.
            </p>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 bg-black border border-zinc-900 rounded-xl flex items-center justify-between">
                <span className="text-zinc-500">Processing Latency</span>
                <span className="text-emerald-400 font-bold">&lt; 1.5s (Streaming)</span>
              </div>
              <div className="p-3.5 bg-black border border-zinc-900 rounded-xl flex items-center justify-between">
                <span className="text-zinc-500">Context Window</span>
                <span className="text-white font-bold">Wiped per Session</span>
              </div>
              <div className="p-3.5 bg-black border border-zinc-900 rounded-xl flex items-center justify-between">
                <span className="text-zinc-500">Integration</span>
                <span className="text-cyan-400 font-bold">GitHub Actions ready</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Try a Quick Sandbox Query
            </h4>
            <p className="text-xs text-zinc-400">
              Click one of the frequently asked questions to run it against the mock copilot instance on the right:
            </p>
            <div className="flex flex-col gap-2">
              {sampleQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sq.q)}
                  className="p-2.5 bg-black hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-left text-xs text-zinc-300 font-mono rounded-lg transition-colors truncate"
                >
                  {sq.q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Chat Window */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden flex flex-col min-h-[440px] shadow-2xl">
          
          {/* Chat header */}
          <div className="bg-black/90 px-5 py-4 border-b border-zinc-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <span className="font-bold text-white text-xs block font-mono">Copilot Session Sandbox</span>
                <span className="text-[10px] text-zinc-500 font-mono block">Context: Clean Sandbox Environment</span>
              </div>
            </div>
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-455 px-2 py-0.5 rounded font-mono">
              SECURE LOGS
            </span>
          </div>

          {/* Messages container */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[300px] no-scrollbar">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-500 text-black font-semibold rounded-tr-sm shadow-md'
                      : 'bg-black/80 border border-zinc-850 text-zinc-300 rounded-tl-sm'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-zinc-600 mt-1 px-1 font-mono">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="mr-auto items-start max-w-[85%] space-y-1">
                <div className="p-3 bg-black/85 border border-zinc-850 text-zinc-500 rounded-2xl rounded-tl-sm text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="p-4 bg-black/60 border-t border-zinc-900 flex gap-2 shrink-0 items-center"
          >
            <input
              type="text"
              placeholder="Ask Copilot a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 focus:border-emerald-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
