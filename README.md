<p align="center">
  <img src="frontend/public/logo.png" alt="GitHub Profile Health Auditor Logo" width="128" height="128" style="border-radius: 28px;" />
</p>

<h1 align="center">🛡️ GitHub Profile Health Auditor</h1>

<p align="center">
  <strong>Automated Multi-Engine Static Security Analysis, AI Security Copilot &amp; Git Hygiene Auditor for GitHub Profiles &amp; Repositories</strong>
</p>

<p align="center">
  <a href="https://github.com/jaggureddy11/GitHub-Profile-Health-Auditor/actions"><img src="https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github-actions&logoColor=white" alt="Build Status" /></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-Vite%20%2B%20React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Vite React" /></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://pytest.org"><img src="https://img.shields.io/badge/Tests-57%2F57%20Passed-10B981?style=for-the-badge&logo=pytest&logoColor=white" alt="Pytest Suite" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <a href="https://github.com/jaggureddy11/GitHub-Profile-Health-Auditor"><strong>🔗 Source Code Repository: https://github.com/jaggureddy11/GitHub-Profile-Health-Auditor</strong></a>
</p>

---

## 💡 Overview

**GitHub Profile Health Auditor** is a privacy-first, production-grade security and static analysis platform. It empowers developers, hiring managers, and security auditors to evaluate public GitHub profiles or individual repository URLs in seconds — intercepting committed API credentials, detecting AST code smells, auditing Git hygiene debt, and synthesizing executive AI security reports with 1-click downloadable `.patch` fixes.

Scans are fully anonymous by default (session-scoped, zero account required), with an opt-in public badge verification system for profile owners who want to showcase their security posture.

---

## ✨ Key Features & Highlights

| Feature | Description |
| :--- | :--- |
| **⚡ Dual-Path Smart Routing** | **Username Mode**: Fetches user details, metadata & repo list (<1s) without auto-scanning all repos. <br/> **Repo URL Mode**: Directly scans that specific target repository immediately. |
| **🔐 In-Memory Secret Interception** | Integrated **TruffleHog** scanner detects 800+ secret signatures (AWS keys, Stripe, database tokens, Slack webhooks) across full Git commit histories. All secrets are redacted in RAM before storage. |
| **🧹 Semgrep AST Code Smell Audit** | Automated AST static analysis flags unhandled exceptions, dangerous `eval()` invocations, hardcoded credentials, and missing error handlers using Semgrep's `auto` rule pack. |
| **🤖 AI Security Copilot Studio** | Interactive copilot powered by Llama-3.3-70B / Qwen2.5-Coder and smart rule synthesis. Provides structured Markdown remediation steps, `git-filter-repo` reflog purging guides, and copyable code snippets. |
| **📊 Dedicated Audit Findings Page** | Clicking any audit button redirects to a dedicated, animated Audit Findings Page (`animate-in fade-in zoom-in-95`), separating profile browsing from scan results. |
| **💯 100% Authentic Data Findings** | Displays strictly real backend scanner findings (`findings`, `overall_score`, `summary`, `redacted_snippets`). Zero fake or fabricated data anywhere. |
| **🗂️ Repo Grid & Load More** | Capped at 10 repos initially with a **"View Remaining Repositories"** expander. Offers individual **"Scan Repo"** buttons and a bulk **"Audit All Repositories"** action. |
| **🩹 1-Click `.patch` Remediation** | Generates standardized `.patch` files for instant application via `git apply`, fixing `.gitignore` gaps, README shields, and license debt. |
| **🛡️ Opt-In Verifiable Badges** | Generates embeddable SVG profile badges (`A+`, `B-`, `SECURITY SHIELD`) verified via GitHub OAuth or 15-minute bio challenge tokens. |
| **🔒 Session-Scoped Privacy** | Anonymous scans are bound to HttpOnly session cookies (`scan_session_id`). Reports are strictly private to the originating session and cannot be queried publicly by username alone. |

---

## ⚡ System Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   Vite + React SPA                      │
                    │        (Dark Mode · Tailwind CSS · Glassmorphism)       │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                                      POST / GET API Requests
                                                 │
                                                 ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                  FastAPI Backend Server                 │
                    │  (Endpoints · Redis Rate Limiter · Auth · Session DB)   │
                    └──────────────┬───────────────────────────┬──────────────┘
                                   │                           │
                            Submit Jobs                   Save Metadata
                                   │                           │
                                   ▼                           ▼
        ┌────────────────────────────────────┐   ┌──────────────────────────┐
        │          Redis Queue (RQ)          │   │    SQLite / PostgreSQL   │
        │    N independent per-repo jobs     │   │       (SQLAlchemy)       │
        └──────────────────┬─────────────────┘   └─────────────▲────────────┘
                           │                                   │
                        Pulls Job                              │
                           │                                   │
                           ▼                                   │
        ┌────────────────────────────────────┐                 │
        │         Background Worker          │                 │
        │            (worker.py)             ├─────────────────┘
        │   Per-repo · isolated timeout      │           Writes Findings
        └──────────────────┬─────────────────┘
                           │
                   Clones Repository
                   Executes Scanners
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
     TruffleHog         Semgrep           Hygiene
   (Secret Leaks)     (Code Smells)     (Structure)
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
             Groq AI Engine (llama-3.3-70b)
                           │
                           ▼
              Dedicated Audit Findings Studio
              (Real-time live telemetry stream)
```

---

## 🔒 Security Hardening & Privacy Policy

- **Zero Secret Storage**: Discovered credentials (AWS, Stripe, database tokens) are processed inside isolated worker RAM and immediately sanitized to `[REDACTED_BY_AUDITOR]` before persisting or rendering.
- **Session-Scoped Findings**: Anonymous scans are bound to `HttpOnly` session cookies / `X-Session-ID` headers. Findings cannot be retrieved by username alone — only by the originating session.
- **Per-IP Rate Limiting**: Independent limits for deep scans (`RATE_LIMIT_SCANS_PER_IP_24H`, default 5/24h) and quickstats (`RATE_LIMIT_QUICKSTATS_PER_IP_24H`, default 30/24h). Providing a GitHub token does **not** bypass server-side compute limits.
- **Honeypot Protection**: `website_url` honeypot field in `ScanRequest` auto-rejects bot submissions with `400 Bad Request`.
- **Repo & Timeout Caps**: `MAX_REPOS_PER_SCAN` (default 10) and `SCAN_JOB_TIMEOUT_SECONDS` (default 180s) prevent runaway jobs.
- **IP Data Retention**: Per-IP rate-limit counters expire automatically after 24 hours.

---

## 🌐 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/scan` | Initiates deep profile security audit across user repositories. |
| `POST` | `/api/repo-scan` | Initiates targeted security audit for a single specific repository. |
| `GET` | `/api/scan/{scan_id}` | Retrieves scan findings and real-time live telemetry progress. |
| `GET` | `/api/profile/{username}/quickstats` | Fast user metadata endpoint (<1s) returning avatar, bio, stars, languages. |
| `GET` | `/api/profile/{username}/repos` | Fast repository listing endpoint (<1s) returning public repos list. |
| `POST` | `/api/scan/{scan_id}/copilot-chat` | Interactive AI Copilot endpoint for structured remediation guidance. |
| `POST` | `/api/fix` | Generates downloadable unified `.patch` remediation file (`git apply`). |
| `GET` | `/api/badge/{username}.svg` | Renders verified opt-in SVG security badge (`A+`, `SECURITY SHIELD`). |
| `POST` | `/api/badge/challenge` | Generates 15-minute bio challenge verification token. |
| `POST` | `/api/badge/verify` | Verifies bio token proof-of-control and publishes badge. |

---

## 🛠️ Installation & Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **Redis Server** (`redis-server`)
- **TruffleHog CLI** (on executable `PATH`)
- **Semgrep CLI** (`pip install semgrep`)

### 1. Environment Setup

Copy the sample configuration file:
```bash
cp .env.example .env
```

### 2. Backend & RQ Worker

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

In a **second terminal**, start the background worker:
```bash
cd backend
python worker.py
```

### 3. Frontend SPA

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Compose (Full Stack)

Spin up Postgres, Redis, FastAPI backend, RQ worker, and Nginx frontend in one command:

```bash
docker compose up --build
```

| Service | Address |
| :--- | :--- |
| **Frontend (Nginx SPA)** | `http://localhost:3000` |
| **Backend (FastAPI)** | `http://localhost:8000` |
| **Redis** | `localhost:6380` |
| **PostgreSQL** | `localhost:5433` |

---

## 🧪 Automated Test Suite

Run the full pytest suite — covering secret redaction, rate limiters, session isolation, badge verification, repo jobs, quickstats, guardrails, and E2E flows:

```bash
cd backend
python -m pytest -v
```

```text
============================= 57 passed in 51.70s ==============================
```

---

## 📁 Project Structure

```
GitHub-Profile-Health-Auditor/
├── backend/
│   ├── main.py               # FastAPI app — REST API endpoints
│   ├── worker.py             # RQ background worker entrypoint
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── database.py           # DB session & engine setup
│   ├── conftest.py           # Pytest fixtures
│   ├── scanners/
│   │   ├── orchestrator.py   # Background job runner & fan-out logic
│   │   ├── hygiene.py        # Git hygiene checker
│   │   ├── trufflehog.py     # TruffleHog secret scanner wrapper
│   │   ├── semgrep.py        # Semgrep code smell scanner wrapper
│   │   └── ai_synthesizer.py # Groq AI report synthesizer
│   ├── tests/                # Full pytest test suite (57 tests)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx       # Main scan entry + featured profiles
│   │   │   ├── ReportDashboard.jsx   # Audit findings report dashboard
│   │   │   ├── QuickStatsCard.jsx    # Instant profile stats card
│   │   │   ├── RepoGrid.jsx          # Repository grid with per-repo status
│   │   │   ├── RepoCard.jsx          # Individual repository card
│   │   │   ├── RepoBreakdown.jsx     # Per-repo findings detail
│   │   │   ├── LiveScanTelemetry.jsx # Real-time scan progress steps
│   │   │   ├── ScanForm.jsx          # Username / URL scan input form
│   │   │   ├── SecurityCopilot.jsx   # AI copilot chat panel
│   │   │   ├── CopilotPage.jsx       # Standalone Security Copilot studio page
│   │   │   ├── PublicBadgeModal.jsx  # Opt-in badge verification flow
│   │   │   └── ContactPage.jsx       # Contact & info page
│   │   ├── App.jsx                   # Main routing & state controller
│   │   ├── index.css                 # Global CSS & design system tokens
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf            # Nginx config for Docker SPA serving
│   └── Dockerfile
├── docker-compose.yml        # Full-stack Docker Compose config
├── .env.example              # Environment variable template
├── CONTRIBUTING.md
├── DECISIONS.md              # Architecture decision records
├── PROGRESS.md               # Phase-by-phase build log
├── AUDIT.md                  # Security audit findings & patches
└── LICENSE                   # MIT License
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting issues, feature requests, and pull requests.

---

## 👤 Developer & Maintainer

Developed with ❤️ by **R Jagadishwar Reddy** (`jaggureddy11`)

* **LinkedIn**: [linkedin.com/in/jaggureddy/](https://www.linkedin.com/in/jaggureddy/)
* **GitHub**: [github.com/jaggureddy11](https://github.com/jaggureddy11)
* **Email**: [jaggureddy2004@gmail.com](mailto:jaggureddy2004@gmail.com)

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
