import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, User, Sparkles, RefreshCw, ChevronRight, ChevronLeft,
  Copy, Check, Trash2, Terminal, Lock, LogIn, Cpu, Zap, Shield, ArrowUp,
  Key, TrendingUp, FileCode, FileText, MessageSquare, BarChart2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SecurityCopilot({
  scanId, token, username, score, onRequireAuth,
  isCollapsed, onToggleCollapse, sessionId, width, isMobileOpen
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
    { text: 'Purge Secrets', query: 'Purge Git secret history' },
    { text: 'Raise Score 95+', query: 'Raise score to 95+' },
    { text: 'Patch Guide', query: 'How do .patch fixes work?' },
    { text: 'README Template', query: 'Generate README template' },
    { text: 'Hygiene Rules', query: 'What are the hygiene rules?' },
    { text: 'Recruiter Rank', query: 'How to improve recruiter rank?' }
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
        return `### Overview & Diagnosis
Hello! I am your **Security Copilot AI Assistant** for GitHub Profile Health Auditor.

### Capabilities
- **Secret Detection & Reflog Purging**: Step-by-step guides for removing leaked API keys via \`git-filter-repo\`.
- **Git Hygiene Optimization**: Audit root \`.gitignore\`, \`LICENSE\`, and \`README.md\` documentation gaps.
- **1-Click .patch Fixes**: Guidance on applying automated unified git patch files.
- **Recruiter Hiring Rank**: Recommendations to boost your developer profile health score.

Ask me any question about your scan results!`;
      }

      // Developer jokes
      if (q.includes('joke') || q.includes('funny')) {
        const jokes = [
          "Why do programmers wear glasses? Because they can't C#!",
          "There are 10 types of people in this world: Those who understand binary, and those who don't.",
          "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
          "A SQL query goes into a bar, walks up to two tables and asks: 'Can I join you?'"
        ];
        return `### Dev Humor\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
      }

      // Git secret history
      if (q.includes('purge') || q.includes('secret') || q.includes('history') || q.includes('leak') || q.includes('key') || q.includes('aws') || q.includes('stripe') || q.includes('token')) {
        return `### Overview & Diagnosis
Committed API tokens or credentials remain stored permanently in your Git reflog commit history even if deleted in a later commit.

### Security Risk
- **Impact**: Exposed AWS/Stripe keys can be exploited by automated scanners within seconds of push.
- **Score Deduction**: Exposed secrets penalize profile health by **-40 to -50 pts**.

### Remediation Workflow
1. **Revoke Token Immediately**: Deactivate the secret in your provider console.
2. **Purge Commit Reflog**: Install and run \`git-filter-repo\` to strip the file from history.
3. **Force Push**: Update remote repositories cleanly.

### Command Snippet
\`\`\`bash
# 1. Install git-filter-repo tool
pip install git-filter-repo

# 2. Filter out file containing the leaked credential
git filter-repo --invert-paths --path path/to/leaked-file.env

# 3. Force push cleaned refs to origin
git push origin main --force --all
\`\`\``;
      }

      // Raising score
      if (q.includes('score') || q.includes('raise') || q.includes('95') || q.includes('improve') || q.includes('100') || q.includes('rank')) {
        return `### Overview & Diagnosis
Steps to raise **@${username || 'profile'}**'s Profile Health Rating to **95+ (Gold Security Shield)**.

### Actionable Checklist
1. **Remediate Exposed Secrets (-40 pts)**: Revoke and purge committed credentials from Git history.
2. **Add Root \`.gitignore\` (-15 pts)**: Ensure build artifacts (\`node_modules/\`, \`dist/\`, \`.env\`) are excluded.
3. **Add Open-Source \`LICENSE\` (-10 pts)**: Include standard MIT or Apache-2.0 license files.
4. **Write Comprehensive \`README.md\` (-15 pts)**: Add project overviews, setup commands, and health badges.

### Fast Remediation Command
\`\`\`bash
# Apply 1-Click patch file from your Auditor Dashboard
git apply hygiene-fix.patch
git add . && git commit -m "fix(security): resolve auditor findings"
\`\`\``;
      }

      // Patches
      if (q.includes('patch') || q.includes('fixes') || q.includes('apply')) {
        return `### Overview & Diagnosis
**1-Click Unified \`.patch\` Fixes** automatically generate Git-compliant diffs for missing hygiene files across your repositories.

### How to Apply
1. Select any repository card in your **Repo Breakdown** tab.
2. Click **Download .patch** to download the generated patch file.
3. Apply the patch in your project repository directory.

### Command Snippet
\`\`\`bash
# Check patch statistics
git apply --stat repo-fix.patch

# Apply patch to local workspace
git apply repo-fix.patch

# Commit and push changes
git add .
git commit -m "fix: apply security auditor hygiene patch"
git push origin main
\`\`\``;
      }

      // README template & templates
      if (q.includes('readme') || q.includes('template') || q.includes('documentation') || q.includes('env') || q.includes('gitignore') || q.includes('license')) {
        return `### Overview & Diagnosis
Standardized \`.env.example\` & \`README.md\` templates for **@${username || 'profile'}**'s repositories.

### \`.env.example\` Template
\`\`\`bash
# Environment Configuration (DO NOT commit real keys)
PORT=8000
DATABASE_URL=postgresql://localhost:5432/app_db
GROQ_API_TOKEN=your_groq_api_token_here
\`\`\`

### Production \`README.md\` Template
\`\`\`markdown
# Project Name

[![Profile Health](https://img.shields.io/badge/Profile_Health-95%2F100-10B981?style=for-the-badge&logo=github)](https://github.com)

## Security & Setup
Copy \`.env.example\` to \`.env\` and configure environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

## Installation
\`\`\`bash
npm install
npm run dev
\`\`\`
\`\`\``;
      }

      // Hygiene rules explanation
      if (q.includes('hygiene') || q.includes('rule') || q.includes('semgrep') || q.includes('trufflehog')) {
        return `### Overview & Diagnosis
**GitHub Profile Health Auditor** uses 3 static analysis engines to calculate profile safety:

### Scanning Engines
- **TruffleHog**: Scans git commit diffs for 800+ secret signatures (AWS keys, Stripe, GitHub PATs, RSA private keys).
- **Semgrep AST**: Intercepts code smells, dangerous \`eval()\` usage, hardcoded endpoints, and insecure HTTP URLs.
- **Hygiene Checker**: Verifies root \`.gitignore\`, open-source \`LICENSE\`, and project \`README.md\` files.

### Privacy Promise
All scans execute in ephemeral RAM. Credentials are **redacted in-memory** before logging.`;
      }

      // Generic help
      return `### Overview & Diagnosis
I'm your **Security Copilot AI**. Ask me anything about securing your GitHub profile!

### Sample Questions
- *"How do I purge leaked AWS keys from git history?"*
- *"What steps raise my score to 95+?"*
- *"How do 1-Click .patch fixes work?"*
- *"Show me a secure README template."*`;
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

  // Enhanced Organized Markdown Renderer for Copilot Output
  const renderFormattedMessage = (content, msgId) => {
    if (!content) return null;
    const codeBlockParts = content.split(/(```[\s\S]*?```)/g);

    return codeBlockParts.map((part, index) => {
      // Code Block Handling
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const language = ['bash', 'javascript', 'python', 'json', 'yaml', 'sh', 'ts', 'markdown', 'sql'].includes(firstLine)
          ? firstLine
          : '';
        const codeText = language ? lines.slice(1).join('\n') : lines.join('\n');
        const snippetId = `${msgId}-${index}`;

        return (
          <div key={index} className="my-2.5 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden text-[11px] font-mono shadow-md">
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

      // Markdown Text Line-by-Line Processing
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1 my-1">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-1.5" />;

            // Headings (###, ##, #)
            if (line.startsWith('### ')) {
              return (
                <h4 key={lIdx} className="font-bold text-emerald-400 text-[12px] pt-2 pb-0.5 border-b border-zinc-800/60 flex items-center gap-1.5 tracking-tight">
                  {renderInlineFormatting(line.slice(4))}
                </h4>
              );
            }
            if (line.startsWith('## ') || line.startsWith('# ')) {
              const text = line.startsWith('## ') ? line.slice(3) : line.slice(2);
              return (
                <h3 key={lIdx} className="font-extrabold text-white text-[13px] pt-2.5 pb-1 border-b border-zinc-700/80 flex items-center gap-1.5 tracking-tight">
                  {renderInlineFormatting(text)}
                </h3>
              );
            }

            // Callout blockquote (> )
            if (trimmed.startsWith('> ')) {
              return (
                <div key={lIdx} className="pl-3 py-1 my-1 border-l-2 border-emerald-500 bg-emerald-950/20 text-emerald-300 rounded-r text-[11px] italic">
                  {renderInlineFormatting(line.replace(/^>\s*/, ''))}
                </div>
              );
            }

            // Bullet List Items (- or * or •)
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
              const bulletText = trimmed.replace(/^[-*•]\s*/, '');
              return (
                <div key={lIdx} className="flex items-start gap-1.5 ml-1 text-[11px]">
                  <span className="text-emerald-400 font-bold mt-0.5 shrink-0">•</span>
                  <span className="flex-1">{renderInlineFormatting(bulletText)}</span>
                </div>
              );
            }

            // Numbered List Items (1. 2. 3.)
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 ml-1 text-[11px]">
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-emerald-400 font-mono font-bold rounded text-[9px] mt-0.5 shrink-0">
                    {numMatch[1]}
                  </span>
                  <span className="flex-1">{renderInlineFormatting(numMatch[2])}</span>
                </div>
              );
            }

            // Regular text
            return (
              <p key={lIdx} className="text-[11px] leading-relaxed">
                {renderInlineFormatting(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((sub, sIdx) => {
      if (sub.startsWith('**') && sub.endsWith('**'))
        return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
      if (sub.startsWith('`') && sub.endsWith('`'))
        return <code key={sIdx} className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[10px] border border-zinc-700/50">{sub.slice(1, -1)}</code>;
      return sub;
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
      style={isMobileOpen ? {} : { width: width || 340, minWidth: 260 }}
      className={`bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 transition-colors duration-200 ${isMobileOpen ? 'w-full h-full' : ''}`}
    >

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* VS Code Copilot robot icon */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-600 dark:text-emerald-400">
              <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.5" />
              <path d="M5 6.5C5 5.67 5.67 5 6.5 5S8 5.67 8 6.5 7.33 8 6.5 8 5 7.33 5 6.5Z" fill="currentColor"/>
              <path d="M8 6.5C8 5.67 8.67 5 9.5 5S11 5.67 11 6.5 10.33 8 9.5 8 8 7.33 8 6.5Z" fill="currentColor"/>
              <path d="M5.5 10c0-.83 1.12-1.5 2.5-1.5s2.5.67 2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-900 dark:text-white font-bold text-[13px] leading-none">Security Copilot</span>
              <span className="px-1 py-px rounded text-[8px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 uppercase tracking-wider">AI</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
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
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-600 hover:text-slate-800 dark:hover:text-zinc-300 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            title="Collapse panel"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-600 hover:text-slate-800 dark:hover:text-zinc-300 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ENGINE STATUS BAR ── */}
      <div className="px-3 py-1 bg-slate-100 dark:bg-black/50 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-zinc-400 font-mono font-bold">
          <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          AI Security Engine
        </span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-extrabold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          Ready
        </span>
      </div>

      {/* ── CHAT MESSAGES (scrollable, flex-1) ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0 bg-white dark:bg-zinc-950" style={{ overscrollBehavior: 'contain' }}>

        {/* Guest Mode Banner */}
        {!token && (
          <div className="p-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl space-y-1 text-center">
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">GUEST SANDBOX</span>
            <p className="text-[11px] text-slate-700 dark:text-zinc-400 leading-normal pt-1 font-medium">
              Ask questions, get guides, or request a dev joke. Log in to sync logs.
            </p>
          </div>
        )}

        {/* Welcome status if no messages */}
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-[13px]">Security Copilot Active</h4>
            <p className="text-[11px] text-slate-700 dark:text-zinc-500 max-w-[210px] mx-auto leading-relaxed font-medium">
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
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}

            <div className={`
              max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed
              ${msg.role === 'user'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-semibold rounded-br-sm shadow-sm'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-bl-sm whitespace-pre-wrap font-medium'
              }
            `}>
              {msg.role === 'assistant'
                ? renderFormattedMessage(msg.content, msg.id)
                : msg.content
              }
              <div className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-emerald-100 dark:text-emerald-950/70 text-right' : 'text-slate-600 dark:text-zinc-500 font-medium'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mb-0.5">
                <User className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR (always at bottom) ── */}
      <div className="shrink-0 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-2.5 space-y-2">
        
        {/* Suggested preloaded prompts - fully visible flex wrap */}
        <div className="flex flex-wrap items-center gap-1.5 py-1">
          {starterPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p.query || p.text)}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-800 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-95 shadow-sm"
            >
              {p.text}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex flex-col gap-2"
        >
          <div className="relative flex items-end bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus-within:border-emerald-500/60 rounded-xl transition overflow-hidden">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything or request a joke..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 text-xs leading-relaxed px-3 pt-2.5 pb-2 focus:outline-none font-sans min-h-[38px] max-h-[120px]"
              style={{ scrollbarWidth: 'none' }}
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="m-1.5 w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-200 dark:disabled:bg-zinc-850 disabled:text-slate-400 dark:disabled:text-zinc-650 text-black flex items-center justify-center transition shrink-0 self-end"
            >
              <ArrowUp className="w-4 h-4 text-black" />
            </button>
          </div>

          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] text-slate-600 dark:text-zinc-550 font-mono font-medium">⏎ Send · ⇧⏎ New line</span>
            {!token ? (
              <button 
                type="button"
                onClick={handleSignInRedirect}
                className="flex items-center gap-1.5 text-[9px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-bold font-mono transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in to start chatting
              </button>
            ) : (
              <span className="text-[9px] text-slate-600 dark:text-zinc-550 font-mono flex items-center gap-1 font-semibold">
                <Cpu className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                Llama-3.3-70B
              </span>
            )}
          </div>
        </form>
      </div>

    </aside>
  );
}
