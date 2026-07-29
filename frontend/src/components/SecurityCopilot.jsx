import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, User, Sparkles, RefreshCw, ChevronRight, ChevronLeft,
  Copy, Check, Trash2, Terminal, Lock, LogIn, Cpu, Zap, Shield, ArrowUp
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

  const handleSendMessage = async (msgText) => {
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
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
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Copilot response failed');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `**Security Context for @${username || 'profile'}** (Score: ${score ?? 100}/100)\n\nAll repository findings were scanned **in-memory only** — zero credentials stored. You can:\n- Run \`git filter-repo --path <file> --invert-paths\` to purge leaked secrets\n- Apply 1-Click **.patch** fixes in the Repo Breakdown tab\n- Generate an AI **README.md** profile template from the dashboard`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

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
    { icon: '🔐', text: 'How do I purge a leaked secret from Git history?' },
    { icon: '📈', text: `Top steps to raise @${username || 'profile'}'s score to 95+?` },
    { icon: '🛡️', text: 'Explain how 1-Click .patch security fixes work' },
    { icon: '📝', text: 'Generate a security-optimized README.md template' },
  ];

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

        {/* NOT SIGNED IN */}
        {!token && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4 px-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Sign in to Use Copilot</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[200px] mx-auto">
                Chat with AI Security Copilot and save private, user-specific conversation history.
              </p>
            </div>

            <button
              onClick={handleSignInRedirect}
              className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Continue
            </button>

            <div className="w-full pt-3 border-t border-zinc-800/80 text-left space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Capabilities</p>
              {[
                { icon: '🔐', label: 'Secret purge assistance' },
                { icon: '💬', label: 'Private per-user chat history' },
                { icon: '🛡️', label: '1-Click patch fix explanations' },
                { icon: '📊', label: 'Score optimization guidance' },
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>{cap.icon}</span>
                  <span>{cap.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIGNED IN — NO MESSAGES YET */}
        {token && messages.length === 0 && (
          <div className="flex flex-col h-full justify-between">
            {/* Welcome */}
            <div className="text-center py-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="font-bold text-white text-sm">Ask me anything</h4>
              <p className="text-[11px] text-zinc-500 max-w-[210px] mx-auto leading-relaxed">
                I have full context on <span className="text-zinc-300 font-semibold">@{username || 'this profile'}'s</span> audit findings.
              </p>
            </div>

            {/* Starter prompts */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold px-0.5">Suggested</p>
              {starterPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition group flex items-start gap-2.5"
                >
                  <span className="text-sm shrink-0 mt-0.5">{p.icon}</span>
                  <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition leading-relaxed line-clamp-2">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SIGNED IN — MESSAGES */}
        {token && messages.length > 0 && messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI avatar */}
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            )}

            {/* Bubble */}
            <div className={`
              max-w-[85%] rounded-2xl px-3 py-2.5 text-[12px] leading-relaxed
              ${msg.role === 'user'
                ? 'bg-emerald-500 text-white font-medium rounded-br-sm'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm whitespace-pre-wrap'
              }
            `}>
              {msg.role === 'assistant'
                ? renderFormattedMessage(msg.content, msg.id)
                : msg.content
              }
              <div className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-emerald-200/70 text-right' : 'text-zinc-600'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* User avatar */}
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0 mb-0.5">
                <User className="w-3.5 h-3.5 text-white" />
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR (always at bottom) ── */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/60 p-2.5">
        {token ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex flex-col gap-2"
          >
            {/* Textarea */}
            <div className="relative flex items-end bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus-within:border-emerald-500/70 rounded-xl transition overflow-hidden">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask about findings, fixes, or optimizations…"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-white placeholder-zinc-600 text-[12px] leading-relaxed px-3 pt-2.5 pb-2 focus:outline-none font-sans disabled:opacity-50 min-h-[38px] max-h-[120px]"
                style={{ scrollbarWidth: 'none' }}
              />
              <button
                type="submit"
                disabled={loading || !inputMsg.trim()}
                className="m-1.5 w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition shrink-0 self-end"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-0.5">
              <span className="text-[9px] text-zinc-600 font-mono">⏎ Send · ⇧⏎ New line</span>
              <span className="text-[9px] text-zinc-600 font-mono flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-yellow-500" />
                Llama-3.3-70B
              </span>
            </div>
          </form>
        ) : (
          <button
            onClick={handleSignInRedirect}
            className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in to start chatting
          </button>
        )}
      </div>

    </aside>
  );
}
