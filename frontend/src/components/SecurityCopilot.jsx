import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SecurityCopilot({ scanId, token, username, score }) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    if (!scanId || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}/copilot-chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, [scanId, token]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMsg;
    if (!textToSend || !textToSend.trim() || loading) return;

    setInputMsg('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg = { id: Date.now(), role: 'user', content: textToSend, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}/copilot-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (response.ok) {
        const updatedMessages = await response.json();
        setMessages(updatedMessages);
      } else {
        throw new Error("Copilot response failed");
      }
    } catch (err) {
      console.error(err);
      const errorMsg = { id: Date.now() + 1, role: 'assistant', content: "⚠️ Sorry, I encountered an issue generating a response. Please try asking again.", created_at: new Date().toISOString() };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    "How do I purge a leaked AWS key from Git history?",
    `What are top steps to raise @${username}'s score to 95+?`,
    "Explain how the 1-Click .patch files work"
  ];

  return (
    <div className="border border-zinc-850 bg-zinc-950 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm flex items-center">
              <span>AI Security Copilot</span>
              <span className="ml-2 px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-400 rounded border border-emerald-800 uppercase font-bold">Live Context</span>
            </h4>
            <p className="text-[10px] text-zinc-400">Target Profile: @{username} (Health Score: {score}/100)</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 no-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-10 space-y-4 text-zinc-500">
            <Sparkles className="w-8 h-8 text-emerald-500/60 mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="font-bold text-zinc-300">Ask Security Copilot Anything</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">Get contextual answers about secret purging, git hygiene fixes, or profile score optimization.</p>
            </div>

            <div className="pt-2 flex flex-col space-y-2 max-w-md mx-auto">
              {starterPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(promptText)}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-left text-zinc-300 hover:text-white transition duration-150 text-[11px] flex items-center justify-between"
                >
                  <span>"{promptText}"</span>
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 ml-2" />
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
                <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-black font-semibold rounded-tr-none'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none font-sans text-xs whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-zinc-400 font-mono text-[11px]">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Copilot is analyzing context...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-2 pt-2 border-t border-zinc-850 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask Copilot about findings, git commands, or fixes..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          disabled={loading}
          className="flex-1 bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 text-xs font-mono"
        />
        <button
          type="submit"
          disabled={loading || !inputMsg.trim()}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-xl transition shadow-md shrink-0"
        >
          <Send className="w-4 h-4 text-black fill-black" />
        </button>
      </form>
    </div>
  );
}
