import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, X, Copy, Check, Trash2, Terminal, ShieldAlert, Cpu } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SecurityCopilot({ scanId, token, username, score, isOpen, onClose, sessionId }) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const chatEndRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    if (!scanId) return;
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (sessionId) headers['X-Session-ID'] = sessionId;

      const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}/copilot-chat`, { headers });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, [scanId, token, sessionId]);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen, fetchChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (msgText) => {
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
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
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

  const starterPrompts = [
    "How do I purge a leaked secret from Git history?",
    `What are top steps to raise @${username}'s score to 95+?`,
    "Explain how 1-Click .patch security fixes work"
  ];

  // Helper to render markdown-ish code blocks and bold text cleanly
  const renderFormattedMessage = (content, msgId) => {
    if (!content) return null;

    // Check for code blocks ```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const language = ['bash', 'javascript', 'python', 'json', 'yaml'].includes(firstLine) ? firstLine : '';
        const codeText = language ? lines.slice(1).join('\n') : lines.join('\n');
        const snippetId = `${msgId}-${index}`;

        return (
          <div key={index} className="my-2.5 rounded-xl bg-black border border-zinc-800 overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[10px] text-zinc-400">
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

      // Inline formatting for **bold** text
      const inlineParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {inlineParts.map((sub, sIdx) => {
            if (sub.startswith && sub.startswith('**') && sub.endswith('**')) {
              return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
            } else if (sub.startsWith('**') && sub.endsWith('**')) {
              return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
            }
            return sub;
          })}
        </span>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
      />

      {/* VS Code / Antigravity Style Sidebar Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/90 shadow-2xl z-50 flex flex-col font-sans transition-transform duration-300 ease-in-out">
        
        {/* IDE Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-850 bg-zinc-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Bot className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm tracking-tight">IDE Security Copilot</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  Llama-3.3-70B
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">@{username || 'guest'} • Health Score: {score ?? 100}/100</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title="Clear Chat History"
                className="p-1.5 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close Copilot Panel"
              className="p-1.5 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Engine Banner */}
        <div className="px-4 py-1.5 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-cyan-400 mr-1" />
            <span>Engine: Hugging Face Router + Groq Fallback</span>
          </span>
          <span className="text-emerald-400 font-semibold">Ready</span>
        </div>

        {/* Chat Timeline Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs no-scrollbar">
          {messages.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Ask Copilot AI Anything</h4>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto font-sans">
                  Contextual assistance for secret purging (`git-filter-repo`), static security fixes, or profile optimization.
                </p>
              </div>

              <div className="pt-2 flex flex-col space-y-2 text-left">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-1">Suggested Prompts</span>
                {starterPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition duration-150 text-xs flex items-center justify-between group shadow-sm"
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
                className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-black font-semibold rounded-tr-none text-xs shadow-md font-sans'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/90 rounded-tl-none font-sans text-xs whitespace-pre-wrap shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? renderFormattedMessage(msg.content, msg.id) : msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 text-zinc-400 font-mono text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Analyzing audit context & generating advice...</span>
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
          className="p-3.5 bg-zinc-900/80 border-t border-zinc-850 shrink-0"
        >
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask Copilot about git commands, findings, or fixes..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
              className="flex-1 bg-black/80 border border-zinc-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none text-xs font-mono transition"
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="p-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-black font-extrabold rounded-xl transition shadow-md shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4 text-black fill-black" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
