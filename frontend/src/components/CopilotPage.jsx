import React, { useState, useRef, useEffect } from 'react';
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
  Cpu,
  Check,
  Copy,
  Trash2,
  Bot,
  User,
  HelpCircle
} from 'lucide-react';

export default function CopilotPage({ onBackToDashboard }) {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: "### Welcome to Security Copilot\nHi! I'm your **Security Copilot AI**. I analyze your GitHub repositories for exposed API tokens, build debt, and code hygiene gaps.\n\nClick any quick query on the left or type below to see how I generate real-time remediation steps and **1-Click .patch** fixes!",
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const chatEndRef = useRef(null);

  const sampleQuestions = [
    {
      q: "How do I fix the AWS credential leak?",
      a: "### Overview & Diagnosis\nCommitted AWS Access Keys (`AKIA...`) in Git repositories remain permanently exposed in past commit history even if deleted in latest commits.\n\n### Security Risk\n- Automated bots scan public commits within 2 seconds of push.\n- Severe penalty (-40 pts) on your Profile Health rating.\n\n### Step-by-Step Remediation\n1. **Revoke Key**: Immediately deactivate the key in your AWS IAM Console.\n2. **Purge Commit History**: Install and run `git-filter-repo`.\n3. **Force Push**: Push clean history back to origin.\n\n### Command Snippet\n```bash\npip install git-filter-repo\ngit filter-repo --invert-paths --path path/to/aws-credentials.json\ngit push origin main --force --all\n```"
    },
    {
      q: "What does Hygiene Score mean?",
      a: "### Overview & Diagnosis\nThe **Hygiene Score** assesses open-source documentation standards and repository hygiene across your profile.\n\n### Point Cost Breakdown\n- **Missing `.gitignore`**: -15 pts (exposes `node_modules/`, `.env`, and build debt)\n- **Missing `LICENSE`**: -10 pts (prevents legal open-source reuse)\n- **Missing `README.md`**: -15 pts (prevents recruiter & developer onboarding)\n\n### Quick Remediation\nDownload 1-Click `.patch` files from your auditor dashboard to auto-generate missing root files."
    },
    {
      q: "How does in-memory redaction work?",
      a: "### Overview & Diagnosis\nOur static analysis pipeline operates with **Strict In-Memory Zero-Storage Safeguards**.\n\n### Security Principles\n1. **Ephemeral RAM Scanning**: Cloned repository files are held only in temporary RAM during analysis.\n2. **TruffleHog Interception**: Secret signatures are matched and immediately redacted with `[REDACTED_BY_AUDITOR]`.\n3. **Zero Credential Persistence**: Raw API tokens never touch disk, database logs, or persistent cache."
    },
    {
      q: "How to raise profile score to 95+?",
      a: "### Overview & Diagnosis\nTo reach a **95+ Gold Rating** for your GitHub profile:\n\n### 4-Step Action Plan\n1. **Purge Leaked Secrets**: Remove all exposed credentials from Git history.\n2. **Add Root `.gitignore`**: Exclude `.env` and node dependencies.\n3. **Add Open-Source `LICENSE`**: Add MIT or Apache-2.0 licenses.\n4. **Create `README.md`**: Include setup instructions and badges.\n\n### Apply 1-Click Fixes\n```bash\ngit apply repository-hygiene-fix.patch\ngit add . && git commit -m 'fix(security): apply auditor hygiene patch'\n```"
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCopySnippet = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const newMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    const match = sampleQuestions.find((sq) =>
      query.toLowerCase().includes(sq.q.toLowerCase()) || sq.q.toLowerCase().includes(query.toLowerCase())
    );

    setTimeout(() => {
      setIsTyping(false);
      const reply = {
        sender: 'copilot',
        text: match 
          ? match.a 
          : `### 💡 Copilot Analysis & Remediation\nRegarding your query about **"${query}"**:\n\n### 🛠️ Security & Hygiene Workflow\n- **Static Analysis**: Our engine scans for credential leaks, dangerous eval calls, and missing root docs.\n- **Reflog Purging**: Use \`git-filter-repo\` to purge past secret commits completely.\n- **Automated Diffs**: Click **Download .patch** on any flagged repository card to apply fixes.\n\nAsk me specific questions like *"How do I fix AWS leaks?"* or *"How to raise score to 95+"*!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, reply]);
    }, 700);
  };

  const renderFormattedText = (content, msgId) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const language = ['bash', 'javascript', 'python', 'json', 'yaml', 'sh', 'ts', 'markdown', 'sql'].includes(firstLine)
          ? firstLine
          : '';
        const codeText = language ? lines.slice(1).join('\n') : lines.join('\n');
        const snippetId = `${msgId}-${index}`;

        return (
          <div key={index} className="my-2.5 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden text-[11px] font-mono shadow-lg">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800">
              <span className="flex items-center text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                <Terminal className="w-3 h-3 text-emerald-400 mr-1.5 shrink-0" />
                {language || 'code'}
              </span>
              <button
                type="button"
                onClick={() => handleCopySnippet(codeText, snippetId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
              >
                {copiedCodeId === snippetId
                  ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 font-semibold">Copied</span></>
                  : <><Copy className="w-3 h-3" /><span>Copy</span></>
                }
              </button>
            </div>
            <pre className="p-3 text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed text-[11px]">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1 my-1">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-1.5" />;

            if (line.startsWith('### ')) {
              return (
                <h4 key={lIdx} className="font-bold text-emerald-400 text-xs pt-2 pb-0.5 border-b border-zinc-800/60 flex items-center gap-1.5 tracking-tight">
                  {renderInline(line.slice(4))}
                </h4>
              );
            }
            if (line.startsWith('## ') || line.startsWith('# ')) {
              const text = line.startsWith('## ') ? line.slice(3) : line.slice(2);
              return (
                <h3 key={lIdx} className="font-extrabold text-white text-sm pt-2.5 pb-1 border-b border-zinc-700/80 tracking-tight">
                  {renderInline(text)}
                </h3>
              );
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
              const bulletText = trimmed.replace(/^[-*•]\s*/, '');
              return (
                <div key={lIdx} className="flex items-start gap-1.5 ml-1 text-xs">
                  <span className="text-emerald-400 font-bold mt-0.5 shrink-0">•</span>
                  <span className="flex-1">{renderInline(bulletText)}</span>
                </div>
              );
            }

            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 ml-1 text-xs">
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-emerald-400 font-mono font-bold rounded text-[9px] mt-0.5 shrink-0">
                    {numMatch[1]}
                  </span>
                  <span className="flex-1">{renderInline(numMatch[2])}</span>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-xs leading-relaxed text-zinc-300">
                {renderInline(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((sub, sIdx) => {
      if (sub.startsWith('**') && sub.endsWith('**'))
        return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
      if (sub.startsWith('`') && sub.endsWith('`'))
        return <code key={sIdx} className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[10px] border border-zinc-700/50">{sub.slice(1, -1)}</code>;
      return sub;
    });
  };

  return (
    <div className="relative max-w-6xl mx-auto space-y-10 animate-fade-in py-10 px-4 sm:px-6 font-sans text-slate-800 dark:text-zinc-300">
      
      {/* Glow background pattern */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-200 dark:border-zinc-900 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/70 rounded-full text-emerald-800 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>AI Copilot Engine v1.2</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Security <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">Copilot</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-400 max-w-2xl leading-relaxed font-medium">
            Real-time threat intelligence, Git reflog purging advisor, and 1-Click patch generator.
          </p>
        </div>
        
        <button
          onClick={onBackToDashboard}
          className="py-3 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-xl shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>

      {/* CORE FEATURES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="group bg-white dark:bg-zinc-950/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 hover:border-emerald-500/40 hover:shadow-2xl transition-all duration-300 space-y-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-slate-50 dark:from-emerald-950 dark:to-zinc-900 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">Natural Language Queries</h3>
          <p className="text-xs text-slate-700 dark:text-zinc-400 leading-relaxed font-medium">
            Ask what a vulnerability means, how recruiters view your hygiene gaps, or what steps restore your rating to 95+.
          </p>
        </div>

        <div className="group bg-white dark:bg-zinc-950/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 hover:border-cyan-500/40 hover:shadow-2xl transition-all duration-300 space-y-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-100 to-slate-50 dark:from-cyan-950 dark:to-zinc-900 border border-cyan-300 dark:border-cyan-800/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-hover:scale-110 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">1-Click Auto-Fix Patches</h3>
          <p className="text-xs text-slate-700 dark:text-zinc-400 leading-relaxed font-medium">
            Copilot automatically creates unified <code className="text-cyan-700 dark:text-cyan-300 font-mono text-[11px] bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded border border-slate-300 dark:border-zinc-800 font-bold">.patch</code> files to cure hygiene flaws across your repositories.
          </p>
        </div>

        <div className="group bg-white dark:bg-zinc-950/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 hover:border-purple-500/40 hover:shadow-2xl transition-all duration-300 space-y-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-100 to-slate-50 dark:from-purple-950 dark:to-zinc-900 border border-purple-300 dark:border-purple-800/60 flex items-center justify-center text-purple-700 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">Private &amp; In-Memory</h3>
          <p className="text-xs text-slate-700 dark:text-zinc-400 leading-relaxed font-medium">
            Exposed secrets are redacted <strong className="text-slate-900 dark:text-zinc-200 font-bold">in-memory</strong> before sending prompt context to AI inference engines. Zero raw tokens are logged.
          </p>
        </div>

      </div>

      {/* INTERACTIVE CHAT & TECH PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        
        {/* Left Side: Tech Info & Quick Queries */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4 bg-white dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-850 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Under the Hood Architecture</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-zinc-400 leading-relaxed font-medium">
              Security Copilot pairs static engine outputs from{' '}
              <code className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400 font-mono rounded text-[11px] font-bold">TruffleHog</code>{' '}
              and{' '}
              <code className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800/80 text-cyan-800 dark:text-cyan-400 font-mono rounded text-[11px] font-bold">Semgrep AST</code>{' '}
              with reasoning models to generate remediation blueprints.
            </p>
            
            <div className="space-y-2.5 text-xs font-mono pt-1">
              <div className="p-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-700 dark:text-zinc-400 font-semibold">Processing Latency</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  &lt; 1.5s (High Speed)
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-700 dark:text-zinc-400 font-semibold">Context Window</span>
                <span className="text-slate-900 dark:text-white font-extrabold">Wiped per Session</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-700 dark:text-zinc-400 font-semibold">Inference Engine</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-extrabold">Llama-3.3-70B / Qwen2.5</span>
              </div>
            </div>
          </div>

          {/* Quick Sandbox Queries Box */}
          <div className="p-5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Try a Quick Sandbox Query</span>
            </h4>
            <p className="text-xs text-slate-700 dark:text-zinc-500 font-medium">
              Click any sample prompt to trigger instant Copilot analysis on the right:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              {sampleQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(sq.q)}
                  className="p-3 bg-slate-50 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800/90 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 text-left text-xs text-slate-900 dark:text-zinc-300 font-mono rounded-xl transition-all duration-200 flex items-center justify-between group active:scale-98 shadow-sm"
                >
                  <span className="truncate pr-2 font-bold">{sq.q}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: High-Capacity Interactive Chat Simulator */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[560px] shadow-2xl">
          
          {/* Chat Header */}
          <div className="bg-slate-50 dark:bg-zinc-900/90 px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="text-left border-l border-slate-200 dark:border-zinc-800 pl-3">
                <span className="font-extrabold text-slate-900 dark:text-white text-xs block font-mono">Copilot Session Sandbox</span>
                <span className="text-[10px] text-slate-600 dark:text-zinc-500 font-mono block font-medium">Context: Ephemeral RAM Environment</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear chat"
                className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded font-mono font-bold">
                LIVE DEMO
              </span>
            </div>
          </div>

          {/* Messages Container (Full Height Scrollable) */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 no-scrollbar min-h-0 bg-black/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-end gap-2.5 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'copilot' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed shadow-lg ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold rounded-br-xs'
                      : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                  }`}
                >
                  {m.sender === 'copilot' ? renderFormattedText(m.text, i) : m.text}
                  <div className={`text-[9px] mt-1.5 font-mono ${m.sender === 'user' ? 'text-emerald-950/80 text-right' : 'text-zinc-600'}`}>
                    {m.time}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mb-1">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Interactive Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 bg-zinc-900/80 border-t border-zinc-800 flex gap-2 shrink-0 items-center"
          >
            <input
              type="text"
              placeholder="Ask Copilot a question or select a sample query..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none font-mono transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-95 shrink-0 shadow-md"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}

