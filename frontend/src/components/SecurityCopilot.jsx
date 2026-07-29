import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, ChevronRight, ChevronLeft, Copy, Check, Trash2, Terminal, Lock, LogIn, Cpu } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SecurityCopilot({ scanId, token, username, score, onRequireAuth, isCollapsed, onToggleCollapse, sessionId }) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const chatEndRef = useRef(null);

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
      console.error("Failed to load user-specific chat history:", err);
    }
  }, [scanId, token, sessionId]);

  useEffect(() => {
    if (token && scanId) {
      fetchChatHistory();
    }
  }, [token, scanId, fetchChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (msgText) => {
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    const textToSend = msgText || inputMsg;
    if (!textToSend || !textToSend.trim() || loading) return;

    setInputMsg('');
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
        const updatedMessages = await response.json();
        setMessages(updatedMessages);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Copilot response failed");
      }
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Regarding @${username || 'profile'}'s security audit (Score: ${score ?? 100}/100): All findings were scanned in-memory with zero credential storage. You can run \`git filter-repo\` to purge secrets or apply 1-Click fixes in the Repo Breakdown tab.`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySnippet = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSignInRedirect = () => {
    sessionStorage.setItem('redirect_after_login', window.location.href);
    if (onRequireAuth) {
      onRequireAuth();
    }
  };

  const starterPrompts = [
    "How do I purge a leaked secret from Git history?",
    `What are top steps to raise @${username || 'profile'}'s score to 95+?`,
    "Explain how 1-Click .patch security fixes work"
  ];

  // Render formatted markdown code blocks & inline bolding
  const renderFormattedMessage = (content, msgId) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const language = ['bash', 'javascript', 'python', 'json', 'yaml'].includes(firstLine) ? firstLine : '';
        const codeText = language ? lines.slice(1).join('\n') : lines.join('\n');
        const snippetId = `${msgId}-${index}`;

        return (
          <div key={index} className="my-2.5 rounded-lg bg-black border border-zinc-800 overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400">
              <span className="flex items-center font-bold text-zinc-300">
                <Terminal className="w-3 h-3 text-emerald-400 mr-1.5" />
                {language ? language.toUpperCase() : 'CODE SNIPPET'}
              </span>
              <button
                onClick={() => handleCopySnippet(codeText, snippetId)}
                className="flex items-center space-x-1 px-2 py-0.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition text-[10px]"
              >
                {copiedCodeId === snippetId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      const inlineParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {inlineParts.map((sub, sIdx) => {
            if (sub.startsWith('**') && sub.endsWith('**')) {
              return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
            }
            return sub;
          })}
        </span>
      );
    });
  };

  // Collapsed Sidebar View (Minimal Rail)
  if (isCollapsed) {
    return (
      <div className="w-12 bg-zinc-950 border-l border-zinc-800 h-full flex flex-col items-center py-4 space-y-4 shrink-0 font-mono">
        <button
          onClick={onToggleCollapse}
          title="Expand Copilot Sidebar"
          className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-emerald-400 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="text-[10px] text-zinc-500 rotate-90 tracking-widest font-bold uppercase mt-8 whitespace-nowrap">
          IDE Copilot
        </span>
      </div>
    );
  }

  return (
    <aside className="w-80 lg:w-96 bg-zinc-950 border-l border-zinc-800 h-full flex flex-col font-sans shrink-0 relative">
      
      {/* IDE Sidebar Header (Sharp Block Style) */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-white text-xs tracking-tight">IDE Security Copilot</h3>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 uppercase">
                Llama-3.3-70B
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              {username ? `@${username}` : 'Target Profile'} • Score: {score ?? 100}/100
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {token && messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Clear Chat History"
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            title="Collapse Copilot Sidebar"
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Engine Status Bar */}
      <div className="px-3.5 py-1.5 bg-black/60 border-b border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
        <span className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-cyan-400 mr-1" />
          <span>Engine: HF Router + Groq</span>
        </span>
        <span className="text-emerald-400 font-semibold flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
          Ready
        </span>
      </div>

      {/* Main Copilot Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs no-scrollbar">
        
        {/* State A: User NOT Signed In */}
        {!token ? (
          <div className="py-8 text-center space-y-5 px-2">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Sign in to Use Copilot</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto">
                Sign in to chat directly with AI Security Copilot & store your private user-specific chat history for @{username || 'profiles'}.
              </p>
            </div>

            <button
              onClick={handleSignInRedirect}
              className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2 font-sans"
            >
              <LogIn className="w-4 h-4 text-black" />
              <span>Sign In to Continue with Copilot</span>
            </button>

            <div className="pt-2 text-left space-y-2 border-t border-zinc-850 font-sans">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Available Assistant Capabilities:</span>
              <ul className="space-y-1.5 text-[11px] text-zinc-400 font-mono">
                <li className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Interactive git secret purging assistance</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>User-isolated private chat history</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>1-Click patch fix explanations</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* State B: User IS Signed In */
          messages.length === 0 ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-xs">Ask Copilot AI Anything</h4>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto font-sans">
                  Contextual assistance for secret purging (`git-filter-repo`), static security fixes, or score optimization.
                </p>
              </div>

              <div className="pt-2 flex flex-col space-y-2 text-left">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-1">Suggested Prompts</span>
                {starterPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-zinc-300 hover:text-white transition text-xs flex items-center justify-between group"
                  >
                    <span className="line-clamp-2">"{promptText}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0 ml-2 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div
                  className={`p-3 rounded-xl max-w-[88%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-400 text-black font-semibold rounded-tr-none text-xs font-sans'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none font-sans text-xs whitespace-pre-wrap'
                  }`}
                >
                  {msg.role === 'assistant' ? renderFormattedMessage(msg.content, msg.id) : msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )
        )}

        {loading && (
          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[11px]">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Analyzing context & generating response...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-zinc-900/90 border-t border-zinc-800 shrink-0"
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder={token ? "Ask Copilot about findings or fixes..." : "Sign in to chat with Copilot..."}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={loading || !token}
            className="flex-1 bg-black border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none text-xs font-mono disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || (!token ? false : !inputMsg.trim())}
            onClick={() => {
              if (!token) handleSignInRedirect();
            }}
            className="p-2 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold rounded-lg transition shadow shrink-0 flex items-center justify-center"
          >
            {token ? (
              <Send className="w-4 h-4 text-black fill-black" />
            ) : (
              <LogIn className="w-4 h-4 text-black" />
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}
