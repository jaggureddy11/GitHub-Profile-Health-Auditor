# GitHub Profile Health Auditor

A privacy-first, production-grade security and static analysis scanner for public GitHub profiles. It aggregates developer repository metadata, evaluates codebases for credential leaks, structural neglect, and configuration smells, and produces a synthesized AI report card with auto-fix patches and embeddable badges.

---

## ⚡ Hybrid Performance Architecture

The application implements a decoupled, multi-layered processing architecture designed to match competitor initial loading speeds while delivering deep security telemetry:

1. **Instant Overview Layer (<2s)**: Fret-free, unauthenticated endpoint (`GET /api/profile/{username}/quickstats`) that collects profile metadata, followers, star/fork aggregates, top language distributions, and active history via REST API without cloning. Cached for 15 minutes in Redis.
2. **Progressive Scan Pipeline**: Concurrently submits the target username to the background queue worker. The frontend immediately displays the metadata card and updates a live checklist for:
   - *Stage 1*: Repository Discovery & Cap Checks (Truncated to top 10 most active repositories).
   - *Stage 2*: Git Hygiene Audits (Flags missing README, LICENSE, `.gitignore`, and committed configs).
   - *Stage 3*: TruffleHog Commit Log Scanning (Runs across full git history).
   - *Stage 4*: Semgrep Code Smell Static Analysis.
   - *Stage 5*: AI Report Synthesis.
3. **Decoupled Verification Badge**: Public score indexing is strictly opt-in. Unverified usernames render a default `Unverified` SVG. Score publication is gated behind proof-of-ownership (OAuth integration or server-issued 15-minute challenge tokens placed in the user's GitHub bio).

```
                        ┌────────────────────────────────────────┐
                        │              React Frontend            │
                        │               (Vite, React)            │
                        └───────────────────┬────────────────────┘
                                            │
                                 POST/GET Scan Requests
                                            │
                                            ▼
                        ┌────────────────────────────────────────┐
                        │             FastAPI Backend            │
                        │           (Database & Jobs)            │
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
          Hugging Face API (AI Synthesis)
```

---

## 🔒 Security Hardening & Abuse Prevention

- **Absolute Secret Redaction**: Discovered credentials (AWS, Slack, Stripe, database keys) are processed inside local worker scopes and immediately replaced with `[REDACTED]` prior to DB persistence or API serialization.
- **Session-Scoped Isolation**: Anonymous scans are mapped to cryptographically signed HttpOnly session cookies (`scan_session_id`). Scan findings are private to the session and cannot be queried by username.
- **Universal Per-IP Rate Limiting**: Limiters (`RATE_LIMIT_SCANS_PER_IP_24H`, default: 5 scans/IP/24h) apply universally to all users. Custom GitHub tokens are used solely for GitHub REST API calls and cannot bypass compute rate limits.
- **Honeypot Bot Protection**: A hidden honeypot field (`website_url`) catches automated scrapers, rejecting requests immediately with `400 Bad Request`.
- **Resource Constraints**: Scans are bounded by `MAX_REPOS_PER_SCAN` (capped at 10 repos) and a hard execution timeout (`SCAN_JOB_TIMEOUT_SECONDS` = 180s) to protect CPU and memory usage.

---

## 🚀 Installation & Running Locally

### Prerequisites
- **Python 3.11+**
- **Node.js & npm**
- **Redis Server** (e.g. `redis-server`)
- **TruffleHog CLI** (must be on executable PATH)
- **Semgrep CLI** (installed via pip or package manager)

### 1. Configuration Setup
Create a `.env` file in the root folder based on `.env.example`:
```bash
cp .env.example .env
```
Key parameters:
- `GITHUB_TOKEN`: Classic/OAuth GitHub token to raise public API extraction limits.
- `HF_API_TOKEN`: Hugging Face token for AI synthesis (`meta-llama/Llama-3.3-70B-Instruct`).
- `REDIS_URL`: RQ worker connection (default: `redis://localhost:6379/0`).

### 2. Run Backend & Background Worker
Install Python dependencies and start the API server:
```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal tab, run the background worker:
```bash
cd backend
python3 worker.py
```

### 3. Run Frontend SPA
Install frontend node modules and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

To run the complete automated test suite covering database isolation, secret redaction, rate limiting, and the caching/quickstats API:

```bash
cd backend
python3 -m pytest -v
```

```text
============================= 45 passed in 37.47s ==============================
```

---

## 📄 License & Governance

Distributed under the **MIT License**. Check out [LICENSE](LICENSE) and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
