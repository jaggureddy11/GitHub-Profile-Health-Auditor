import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, User, Sparkles, RefreshCw, ChevronRight, ChevronLeft,
  Copy, Check, Trash2, Terminal, Lock, LogIn, Cpu, Zap, Shield, ArrowUp,
  Key, TrendingUp, FileCode, FileText, MessageSquare, BarChart2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SecurityCopilot({
  scanId, token, username, score, onRequireAuth,
  isCollapsed, onToggleCollapse, sessionId, width
}) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    if (!scanId || !token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      if (sessionId) headers['X-Session-ID'] = sessionId;
      const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}/copilot-chat`, { headers });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (err) {
      console.error('Failed to load user-specific chat history:', err);
    }
  }, [scanId, token, sessionId]);

  useEffect(() => {
    if (token && scanId) fetchChatHistory();
  }, [token, scanId, fetchChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMsg]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopySnippet = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSignInRedirect = () => {
    sessionStorage.setItem('redirect_after_login', window.location.href);
    if (onRequireAuth) onRequireAuth();
  };

  const starterPrompts = [
    { text: 'Purge Git secret history' },
    { text: 'Raise score to 95+' },
    { text: 'How do .patch fixes work?' },
    { text: 'Generate README template' },
    { text: 'Who are you?' },
    { text: 'Tell me a dev joke' }
  ];

  const handleSendMessage = async (msgText) => {
    const textToSend = (msgText || inputMsg).trim();
    if (!textToSend || loading) return;

    setInputMsg('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Conversational smart local fallback
    const getLocalResponse = (query) => {
      const q = query.toLowerCase();
      
      // Greetings
      if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('who are you') || q.includes('who is this')) {
        return `Hello! I'm your **Security Copilot**. 🤖\n\nI can analyze your GitHub repositories for exposed API tokens, build debt, and formatting smells. I also generate automated Git patches. How can I help you improve your codebase safety today?`;
      }
      
      // Developer jokes
      if (q.includes('joke') || q.includes('funny')) {
        const jokes = [
          "Why do programmers wear glasses? Because they can't C#! 🤓",
          "There are 10 types of people in this world: Those who understand binary, and those who don't. 🔢",
          "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
          "A SQL query goes into a bar, walks up to two tables and asks: 'Can I join you?' 📊"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
      }

      // Git secret history
      if (q.includes('purge') || q.includes('secret') || q.includes('history') || q.includes('leak') || q.includes('key') || q.includes('aws') || q.includes('stripe')) {
        return `**How to Purge Exposed Secrets from Git Commit History:**\n\nRemoving a file or line in your latest commit is not enough since the secret remains in the Git reflog history. Use these steps:\n\n1. **Revoke the key** in the provider dashboard (AWS, Stripe, GitHub, etc.) immediately.\n2. Install \`git-filter-repo\` and run:\n\`\`\`bash\ngit filter-repo --path path/to/leaked-file.json --invert-paths\n\`\`\`\n3. Push the clean history back to origin:\n\`\`\`bash\ngit push origin main --force --all\n\`\`\``;
      }

      // Raising score
      if (q.includes('score') || q.includes('raise') || q.includes('95') || q.includes('improve')) {
        return `**Steps to Raise @${username || 'profile'}'s Score to 95+:**\n\n1. **Purge committed credentials** (exposures in commit history decrease score by **40 pts**).\n2. **Git Hygiene**: Ensure each repository contains a root \`.gitignore\` file (missing: -15 pts), an open-source \`LICENSE\` file (missing: -10 pts), and a descriptive \`README.md\` (missing: -15 pts).\n3. **Smells**: Replace hardcoded development endpoints (e.g. \`http://localhost:3000\`) with configuration variables.`;
      }

      // Patches
      if (q.includes('patch') || q.includes('fixes') || q.includes('apply')) {
        return `**Applying 1-Click .patch Security Fixes:**\n\nWhen a missing hygiene file (like a LICENSE or .gitignore) is identified, we generate a unified patch file. To apply it:\n\n1. Click **Download .patch** on the repository findings panel.\n2. In your local repository terminal, run:\n\`\`\`bash\ngit apply name-of-file.patch\n\`\`\`\n3. Add, commit, and push the changes to GitHub.`;
      }

      // README template
      if (q.includes('readme') || q.includes('template') || q.includes('documentation')) {
        return `Here is a **security-optimized README.md template** for your repositories:\n\n\`\`\`markdown\n# Project Title\n\n## Security & Environment Variables\nNever commit plaintext API keys. Copy \`.env.example\` to \`.env\` and define config values there.\n\n## Getting Started\n1. Install dependencies: npm install\n2. Run development build: npm run dev\n\`\`\``;
      }

      // Generic help
      return `I'm a helper chatbot focused on securing GitHub profiles. You can ask me:\n- "How do I fix the AWS credential leak?"\n- "Top steps to raise my score?"\n- "Tell me a developer joke!"\n- "Generate a secure README template."`;
    };

    // If authenticated, attempt backend call
    if (token) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        if (sessionId) headers['X-Session-ID'] = sessionId;
        const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}/copilot-chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message: textToSend })
        });
        if (response.ok) {
          setMessages(await response.json());
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend chat failed, falling back to smart local chatbot:', err);
      }
    }

    // Run local chatbot fallback (used for guest sandboxes & offline fallback)
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: getLocalResponse(textToSend),
        created_at: new Date().toISOString()
      }]);
      setLoading(false);
    }, 850);
  };

  // Format messages with code blocks and inline bold
  const renderFormattedMessage = (content, msgId) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const language = ['bash', 'javascript', 'python', 'json', 'yaml', 'sh', 'ts'].includes(firstLine) ? firstLine : '';
        const codeText = language ? lines.slice(1).join('\n') : lines.join('\n');
        const snippetId = `${msgId}-${index}`;
        return (
          <div key={index} className="my-2 rounded-lg bg-zinc-950 border border-zinc-700/60 overflow-hidden text-[11px] font-mono">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-700/60">
              <span className="flex items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <Terminal className="w-3 h-3 text-emerald-400 mr-1.5" />
                {language || 'code'}
              </span>
              <button
                onClick={() => handleCopySnippet(codeText, snippetId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                {copiedCodeId === snippetId
                  ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
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

      // Handle bullet lists starting with -
      const lines = part.split('\n');
      return (
        <span key={index}>
          {lines.map((line, lIdx) => {
            const isBullet = line.trimStart().startsWith('- ');
            const inlineParts = line.split(/(\*\*.*?\*\*|`[^`]+`)/g);
            const rendered = inlineParts.map((sub, sIdx) => {
              if (sub.startsWith('**') && sub.endsWith('**'))
                return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
              if (sub.startsWith('`') && sub.endsWith('`'))
                return <code key={sIdx} className="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[10px]">{sub.slice(1, -1)}</code>;
              return sub;
            });
            return (
              <span key={lIdx}>
                {isBullet ? <span className="flex items-start gap-1.5 my-0.5"><span className="text-emerald-400 mt-0.5 shrink-0">•</span><span>{rendered}</span></span> : rendered}
                {lIdx < lines.length - 1 && !isBullet && '\n'}
              </span>
            );
          })}
        </span>
      );
    });
  };

  // ────────── COLLAPSED RAIL ──────────
  if (isCollapsed) {
    return (
      <div
        style={{ width: width || 44 }}
        className="bg-zinc-950 border-l border-zinc-800 flex flex-col items-center py-3 gap-3 shrink-0 overflow-hidden"
      >
        <button
          onClick={onToggleCollapse}
          title="Open Copilot"
          className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-emerald-400 rounded-lg transition group"
        >
          {/* VS Code Copilot robot icon */}
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
            <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.4" />
            <path d="M5 6.5C5 5.67 5.67 5 6.5 5S8 5.67 8 6.5 7.33 8 6.5 8 5 7.33 5 6.5Z" fill="currentColor"/>
            <path d="M8 6.5C8 5.67 8.67 5 9.5 5S11 5.67 11 6.5 10.33 8 9.5 8 8 7.33 8 6.5Z" fill="currentColor"/>
            <path d="M5.5 10c0-.83 1.12-1.5 2.5-1.5s2.5.67 2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>
        <span
          className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest whitespace-nowrap mt-6"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Copilot
        </span>
        {messages.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center border border-emerald-500/30">
            {messages.length}
          </span>
        )}
      </div>
    );
  }

  // ────────── FULL PANEL ──────────
  return (
    <aside
      style={{ width: width || 340, minWidth: 260 }}
      className="bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0"
    >

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* VS Code Copilot robot icon */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-400">
              <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.5" />
              <path d="M5 6.5C5 5.67 5.67 5 6.5 5S8 5.67 8 6.5 7.33 8 6.5 8 5 7.33 5 6.5Z" fill="currentColor"/>
              <path d="M8 6.5C8 5.67 8.67 5 9.5 5S11 5.67 11 6.5 10.33 8 9.5 8 8 7.33 8 6.5Z" fill="currentColor"/>
              <path d="M5.5 10c0-.83 1.12-1.5 2.5-1.5s2.5.67 2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-[13px] leading-none">Security Copilot</span>
              <span className="px-1 py-px rounded text-[8px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">AI</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-mono">
                {username ? `@${username}` : 'No profile'} · {score ?? 100}/100
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {token && messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Clear chat"
              className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            title="Collapse panel"
            className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ENGINE STATUS BAR ── */}
      <div className="px-3 py-1 bg-black/50 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
          <Cpu className="w-2.5 h-2.5 text-cyan-500" />
          HF Router · Groq fallback
        </span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono font-semibold">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          Ready
        </span>
      </div>

      {/* ── CHAT MESSAGES (scrollable, flex-1) ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0" style={{ overscrollBehavior: 'contain' }}>

        {/* Guest Mode Banner */}
        {!token && (
          <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl space-y-1 text-center">
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">GUEST SANDBOX</span>
            <p className="text-[11px] text-zinc-400 leading-normal pt-1">
              Ask questions, get guides, or request a dev joke. Log in to sync logs.
            </p>
          </div>
        )}

        {/* Welcome status if no messages */}
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="font-bold text-white text-[13px]">Security Copilot Active</h4>
            <p className="text-[11px] text-zinc-500 max-w-[210px] mx-auto leading-relaxed">
              Ask about findings, Git history sanitization, or request a funny dev joke.
            </p>
          </div>
        )}

        {/* Render message history */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            )}

            <div className={`
              max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed
              ${msg.role === 'user'
                ? 'bg-emerald-500 text-white font-semibold rounded-br-sm shadow-sm'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm whitespace-pre-wrap'
              }
            `}>
              {msg.role === 'assistant'
                ? renderFormattedMessage(msg.content, msg.id)
                : msg.content
              }
              <div className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-emerald-950/70 text-right' : 'text-zinc-650'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mb-0.5">
                <User className="w-3.5 h-3.5 text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR (always at bottom) ── */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2">
        
        {/* Suggested preloaded prompts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {starterPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p.text)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-full text-[10px] whitespace-nowrap transition-all duration-150 active:scale-95 shrink-0"
            >
              {p.text}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex flex-col gap-2"
        >
          <div className="relative flex items-end bg-zinc-900 border border-zinc-800 focus-within:border-emerald-500/60 rounded-xl transition overflow-hidden">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything or request a joke..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-white placeholder-zinc-600 text-xs leading-relaxed px-3 pt-2.5 pb-2 focus:outline-none font-sans min-h-[38px] max-h-[120px]"
              style={{ scrollbarWidth: 'none' }}
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="m-1.5 w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-850 disabled:text-zinc-650 text-black flex items-center justify-center transition shrink-0 self-end"
            >
              <ArrowUp className="w-4 h-4 text-black" />
            </button>
          </div>

          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] text-zinc-650 font-mono">⏎ Send · ⇧⏎ New line</span>
            {!token ? (
              <button 
                type="button"
                onClick={handleSignInRedirect}
                className="flex items-center gap-1.5 text-[9px] text-emerald-400 hover:text-emerald-300 font-bold font-mono transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in to start chatting
              </button>
            ) : (
              <span className="text-[9px] text-zinc-650 font-mono flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-yellow-500" />
                Llama-3.3-70B
              </span>
            )}
          </div>
        </form>
      </div>

    </aside>
  );
}
