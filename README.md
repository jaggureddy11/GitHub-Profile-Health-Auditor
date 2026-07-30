<p align="center">
  <img src="frontend/public/logo.png" alt="GitHub Profile Health Auditor Logo" width="128" height="128" style="border-radius: 24px;" />
</p>

<h1 align="center">GitHub Profile Health Auditor</h1>

<p align="center">
  <strong>Automated Multi-Engine Static Security Analysis &amp; Git Hygiene Auditor for GitHub Profiles &amp; Repositories</strong>
</p>

<p align="center">
  <a href="https://github.com/jaggureddy11/GitHub-Profile-Health-Auditor/actions"><img src="https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github-actions&logoColor=white" alt="Build Status" /></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-Vite%20%2B%20React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Vite React" /></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
</p>

---

## 💡 Overview

**GitHub Profile Health Auditor** is a privacy-first, production-grade security and static analysis platform. It analyzes public GitHub profiles and individual repository URLs — intercepting committed API credentials, detecting code smells, evaluating Git hygiene debt, and synthesizing executive AI security reports with 1-click downloadable `.patch` fixes.

Scans are fully anonymous by default (session-scoped, no account required), with an opt-in public badge system for verified owners who want to display their score.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **⚡ Instant Profile Quickstats** | Renders avatar, bio, followers, star count, top languages, and last-active date in **<2 seconds** via a dedicated lightweight endpoint with 15-minute Redis caching — no cloning, no AI calls. |
| **🗂️ Repo Grid View** | Interactive grid of all public repos with live per-repo status indicators (`queued → running → completed / timed_out`) and an "Analyze All" bulk action. |
| **🔐 Secret Leak Interception** | Integrated **TruffleHog** scanner detects exposed API keys, AWS credentials, Slack webhooks, and database tokens across full Git commit histories. All discovered values are immediately redacted before storage. |
| **🧹 Semgrep AST Code Smell Audit** | Automated AST analysis checks for unhandled exceptions, dangerous `eval()` calls, hardcoded secrets, and missing error handlers using Semgrep's `auto` rule pack. |
| **🤖 Groq AI Security Synthesis** | Leverages `llama-3.3-70b-versatile` to synthesize audit findings into actionable remediation guidance, recruiter risk ratings, and clean executive summary reports. |
| **🩹 1-Click `.patch` Remediation** | Generates standardized `.patch` files for instant application via `git apply`, fixing `.gitignore` gaps, README shields, and license debt. |
| **🛡️ Opt-In Verifiable Badges** | Generates embeddable SVG profile badges (`A+`, `B-`, `SECURITY SHIELD`) verified via GitHub OAuth or 15-minute bio challenge tokens. |
| **🔒 Session-Scoped Privacy** | Anonymous scans are bound to HttpOnly session cookies. Reports are strictly private to the originating session and cannot be retrieved by username alone. |
| **🤖 Anti-Bot Guardrails** | Honeypot field rejection, per-IP rate limiting, per-scan repo caps, and hard job timeouts prevent abuse and runaway compute costs. |

---

## ⚡ Architecture

```
                        ┌────────────────────────────────────────┐
                        │              React Frontend            │
                        │       (Vite + React + Tailwind CSS)    │
                        └───────────────────┬────────────────────┘
                                            │
                                 POST/GET Scan Requests
                                            │
                                            ▼
                        ┌────────────────────────────────────────┐
                        │             FastAPI Backend            │
                        │     (Endpoints · RQ Enqueue · DB)      │
                        └─────────┬───────────────────┬──────────┘
                                  │                   │
                           Submit Jobs           Save Info
                                  │                   │
                                  ▼                   ▼
      ┌─────────────────────────────────┐   ┌──────────────────────┐
      │         Redis Queue (RQ)        │   │   SQLite / Postgres  │
      │   N independent per-repo jobs   │   │     (SQLAlchemy)     │
      └──────────────┬──────────────────┘   └───────────▲──────────┘
                     │                                  │
                  Pulls Job                             │
                     │                                  │
                     ▼                                  │
      ┌─────────────────────────────────┐               │
      │         Background Worker       │               │
      │           (worker.py)           ├───────────────┘
      │  Per-repo · isolated timeout    │         Writes Findings
      └──────────────┬──────────────────┘
                     │
             Clones Repository
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
                     │
                     ▼
          GroupProgress Aggregation
       (partial reports while jobs run)
```

---

## 🔒 Security Hardening & Privacy

- **Zero Secret Storage**: Discovered credentials (AWS, Stripe, database tokens) are processed inside isolated worker RAM and immediately sanitized to `[REDACTED]` before persisting or rendering.
- **Session-Scoped Findings**: Anonymous scans are bound to `HttpOnly` session cookies / `X-Session-ID` headers. Findings cannot be retrieved by username alone — only by the originating session.
- **Per-IP Rate Limiting**: Independent limits for deep scans (`RATE_LIMIT_SCANS_PER_IP_24H`, default 5/24h) and quickstats (`RATE_LIMIT_QUICKSTATS_PER_IP_24H`, default 30/24h). Providing a GitHub token does **not** bypass server-side compute limits.
- **Honeypot Protection**: `website_url` honeypot field in `ScanRequest` auto-rejects bot submissions with `400 Bad Request`.
- **Repo & Timeout Caps**: `MAX_REPOS_PER_SCAN` (default 10) and `SCAN_JOB_TIMEOUT_SECONDS` (default 180s) prevent runaway jobs.
- **IP Data Retention**: Per-IP rate-limit counters expire automatically after 24 hours.
- **Multi-Tenant Isolation**: Database-level constraints and session enforcement ensure scan reports are strictly scoped to their originating user or session.

---

## 🛠️ Installation & Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **Redis Server** (`redis-server`)
- **TruffleHog CLI** (on executable `PATH`)
- **Semgrep CLI** (`pip install semgrep`)

### 1. Environment Configuration

Copy the sample config and fill in your API keys:
```bash
cp .env.example .env
```

Key parameters:

| Variable | Description |
| :--- | :--- |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for higher REST API quota) |
| `GROQ_API_KEY` | Groq API key for AI synthesis (`llama-3.3-70b-versatile`) |
| `REDIS_URL` | RQ worker connection (default: `redis://localhost:6379/0`) |
| `JWT_SECRET` | Secret key for signing session tokens |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth app credentials (optional — for badge verification) |
| `RATE_LIMIT_SCANS_PER_IP_24H` | Max deep scans per IP per 24h (default: `5`) |
| `RATE_LIMIT_QUICKSTATS_PER_IP_24H` | Max quickstats requests per IP per 24h (default: `30`) |
| `MAX_REPOS_PER_SCAN` | Max repos analyzed per scan (default: `10`) |
| `SCAN_JOB_TIMEOUT_SECONDS` | Hard timeout per background job (default: `180`) |

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

Spin up Postgres, Redis, the FastAPI backend, the RQ worker, and the Nginx-served frontend SPA in one command:

```bash
docker compose up --build
```

| Service | Port |
| :--- | :--- |
| Frontend (Nginx) | `http://localhost:3000` |
| Backend (FastAPI) | `http://localhost:8000` |
| Redis | `localhost:6380` |
| PostgreSQL | `localhost:5433` |

---

## 🧪 Running Tests

Run the full pytest suite — covering rate limiters, database isolation, secret redaction, anonymous sessions, badge verification, repo jobs, quickstats, guardrails, and E2E flows:

```bash
cd backend
python -m pytest -v
```

```text
============================= 53 passed in 42.24s ==============================
```

**Test modules:**

| Test File | Coverage Area |
| :--- | :--- |
| `test_github.py` | GitHub API pagination & rate-limit handling |
| `test_hygiene.py` | Structural hygiene scanner |
| `test_trufflehog.py` | Secret scanning & redaction |
| `test_semgrep.py` | Code smell (AST) scanning |
| `test_ai.py` | AI synthesis fallback & retry logic |
| `test_fix.py` | `.patch` file generation |
| `test_rate_limiter.py` | Per-IP rate limiting & Redis fallback |
| `test_anonymous_scan.py` | Anonymous session isolation |
| `test_badge_system.py` | Opt-in badge ownership verification |
| `test_guardrails.py` | Repo caps, timeouts, honeypot rejection |
| `test_quickstats.py` | Quickstats metrics, caching, rate limiting |
| `test_repo_listing.py` | Repo listing endpoint & caching |
| `test_repo_jobs.py` | Per-repo async job fan-out & aggregation |
| `test_repo_rate_limit.py` | Per-repo scan rate limits |
| `test_redaction_verification.py` | Code snippet redaction scrubber |
| `test_saas.py` | JWT auth, OAuth flow, multi-tenant isolation |
| `test_e2e.py` | End-to-end pipeline validation |
| `test_cors.py` | CORS policy |
| `test_refinement.py` | Report refinement logic |

---

## 📁 Project Structure

```
GitHub-Profile-Health-Auditor/
├── backend/
│   ├── main.py               # FastAPI app — all API endpoints
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
│   ├── tests/                # Full pytest test suite (53 tests)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── components/
│   │       ├── LandingPage.jsx       # Main scan entry + featured profiles
│   │       ├── ReportDashboard.jsx   # Full audit report view
│   │       ├── QuickStatsCard.jsx    # Instant profile stats card
│   │       ├── RepoGrid.jsx          # Repository grid with per-repo status
│   │       ├── RepoCard.jsx          # Individual repository card
│   │       ├── RepoBreakdown.jsx     # Per-repo findings detail
│   │       ├── LiveScanTelemetry.jsx # Real-time scan progress steps
│   │       ├── ScanForm.jsx          # Username / URL scan input form
│   │       ├── SecurityCopilot.jsx   # AI copilot chat panel
│   │       ├── PublicBadgeModal.jsx  # Opt-in badge verification flow
│   │       └── ContactPage.jsx       # Contact & info page
│   ├── public/
│   ├── index.html
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

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting issues, feature requests, and pull requests. GitHub issue and PR templates are provided in `.github/`.

---

## 👤 Developer & Maintainer

Developed with ❤️ by **R Jagadishwar Reddy** (`jaggureddy11`)

* **LinkedIn**: [linkedin.com/in/jaggureddy/](https://www.linkedin.com/in/jaggureddy/)
* **GitHub**: [github.com/jaggureddy11](https://github.com/jaggureddy11)
* **Email**: [jaggureddy2004@gmail.com](mailto:jaggureddy2004@gmail.com)

---

## 📄 License


This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
