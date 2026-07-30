<p align="center">
  <img src="frontend/public/logo.png" alt="GitHub Profile Health Auditor Logo" width="128" height="128" style="border-radius: 24px;" />
</p>

<h1 align="center">GitHub Profile Health Auditor</h1>

<p align="center">
  <strong>Automated Multi-Engine Static Security Analysis & Git Hygiene Auditor for GitHub Profiles & Repositories</strong>
</p>

<p align="center">
  <a href="https://github.com/jaggureddy11/GitHub-Profile-Health-Auditor/actions"><img src="https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github-actions&logoColor=white" alt="Build Status" /></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-Vite%20%2B%20React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Vite React" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
</p>

---

## 💡 Overview

**GitHub Profile Health Auditor** is a privacy-first, production-grade security and static analysis platform. It analyzes public GitHub profiles and single repository URLs, intercepting committed API credentials, detecting code smells, evaluating Git hygiene debt, and synthesizing executive AI security reports with 1-click downloadable `.patch` fixes.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🎯 Single Repository Audit** | Pass any direct repository link (`https://github.com/torvalds/linux` or `torvalds/linux`) to isolate and audit **only** that target repository, with an option to reveal remaining profile repos. |
| **🔐 Secret Leak Interception** | Integrated **TruffleHog** scanner to detect exposed API keys, AWS credentials, Slack webhooks, and database tokens across full Git commit histories. |
| **🧹 Semgrep AST Code Smell Audit** | Automated AST analysis checking for unhandled exceptions, dangerous `eval()` calls, hardcoded secrets, and missing error handlers. |
| **🤖 Groq AI Security Synthesis** | Leverages `llama-3.3-70b-versatile` to synthesize audit findings into actionable remediation guidance, recruiter risk ratings, and clean summary reports. |
| **🩹 1-Click `.patch` Remediation** | Generates standardized `.patch` files for instant application via `git apply`, fixing `.gitignore` gaps, README shields, and license debt. |
| **🛡️ Opt-In Verifiable Badges** | Generates embeddable SVG profile badges (`A+`, `B-`, `SECURITY SHIELD`) verified via GitHub OAuth or 15-minute bio challenge tokens. |
| **⚡ Hybrid Performance Architecture** | Lightweight `<2s` profile quickstats endpoint using Redis 15-minute caching and asynchronous background queue processing via RQ. |

---

## ⚡ Hybrid Architecture Flow

```
                        ┌────────────────────────────────────────┐
                        │              React Frontend            │
                        │          (Vite, Tailwind, React)       │
                        └───────────────────┬────────────────────┘
                                            │
                                 POST/GET Scan Requests
                                            │
                                            ▼
                        ┌────────────────────────────────────────┐
                        │             FastAPI Backend            │
                        │        (Endpoints, RQ Enqueue, DB)     │
                        └─────────┬───────────────────┬──────────┘
                                  │                   │
                             Submit Job           Save Info
                                  │                   │
                                  ▼                   ▼
      ┌────────────────────────────────┐   ┌───────────────────────┐
      │        Redis Queue (RQ)        │   │    SQLite Database    │
      │      Background Jobs Queue     │   │      (SQLAlchemy)     │
      └──────────────┬─────────────────┘   └───────────▲───────────┘
                     │                                 │
                  Pulls Job                            │
                     │                                 │
                     ▼                                 │
      ┌────────────────────────────────┐               │
      │          Background            │               │
      │         Python Worker          ├───────────────┘
      │          (worker.py)           │          Writes Findings
      └──────────────┬─────────────────┘
                     │
             Clones Repositories
             Executes Scanners
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   TruffleHog     Semgrep       Hygiene
   (Secrets)     (Smells)      (Structure)
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
           Groq AI Engine (llama-3.3-70b)
```

---

## 🔒 Security Hardening & Isolation

- **Zero Secret Storage**: Discovered credentials (AWS, Stripe, Database keys) are processed inside isolated worker RAM and immediately sanitized into `[REDACTED]` before saving or rendering.
- **Session-Scoped Findings**: Anonymous scans are bound to HttpOnly session IDs. Findings remain private to the active browser session.
- **Per-IP Rate Limiting**: Intelligent rate limiters prevent API abuse while custom GitHub tokens increase REST extraction limits.
- **Honeypot Protection**: Built-in honeypot parameters automatically block automated scraping bots.

---

## 🛠️ Installation & Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **Redis Server** (`redis-server`)
- **TruffleHog CLI** (added to executable `PATH`)
- **Semgrep CLI** (`pip install semgrep`)

### 1. Environment Configuration
Copy the sample configuration file and configure your API keys:
```bash
cp .env.example .env
```
Key parameters:
- `GITHUB_TOKEN`: GitHub OAuth/Personal Access Token for API extraction.
- `GROQ_API_KEY`: Groq API Key for AI synthesis (`llama-3.3-70b-versatile`).
- `REDIS_URL`: RQ worker connection (default: `redis://localhost:6379/0`).

### 2. Backend & RQ Worker Startup
Install dependencies and run the API server:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

In a second terminal window, start the RQ background worker:
```bash
cd backend
python worker.py
```

### 3. Frontend SPA Startup
Install frontend dependencies and launch Vite:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🧪 Running Unit & Integration Tests

Run the full pytest suite covering rate limiters, database isolation, secret redactions, and endpoints:

```bash
cd backend
python -m pytest -v
```

```text
============================= 45 passed in 37.47s ==============================
```

---

## 👤 Developer & Maintainer

Developed with ❤️ by **R Jagadishwar Reddy** (`jaggureddy11`)

* **LinkedIn**: [linkedin.com/in/jaggureddy/](https://www.linkedin.com/in/jaggureddy/)
* **GitHub**: [github.com/jaggureddy11](https://github.com/jaggureddy11)
* **Email**: [jaggureddy2004@gmail.com](mailto:jaggureddy2004@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
