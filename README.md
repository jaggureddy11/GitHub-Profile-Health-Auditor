# GitHub Profile Health Auditor

A production-quality tool that scans public GitHub repositories for security leaks, structural neglect, and code quality issues, producing a synthesized AI health report and overall profile score.

## Architecture Overview

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

## Features

- **P0 - Repo Enumeration**: Calls the GitHub REST API to list all public, non-fork repositories for a given username.
- **P0 - Structural Hygiene Scan**: Automatically checks for the presence of `README.md`, `LICENSE`, and `.gitignore`, and flags committed `.env`, `node_modules/`, or `__pycache__/` files.
- **P0 - Secret Leak Scanning (TruffleHog)**: Clones repositories and executes TruffleHog in filesystem mode to find credentials and verify them. **Absolute secret redaction** ensures that raw secrets are never logged, stored in the DB, or returned in API payloads.
- **P0 - AI Synthesis Layer**: Aggregates all findings and calls a Hugging Face open-source LLM (default `Qwen2.5-Coder-32B-Instruct`) to score the profile (0-100), rank the top 5 resume-damaging issues, and provide recruiter-focused justifications. Uses robust JSON-repair and deterministic local fallbacks.
- **P1 - Code Smell Scan (Semgrep)**: Runs Semgrep auto-rules inside the repositories to check for config issues and common bugs.
- **P1 - Auto-Fix Generator**: Instantly generates downloadable unified `.patch` files to fix structural issues (MIT LICENSE, standard `.gitignore`, README skeletons) that can be applied with `git apply`.
- **P2 - Async Queue & Progress**: Backend worker pool powered by Redis Queue (RQ) handles long-running multi-repo scans in parallel. Frontend displays active progress steps and polls status.
- **Instant Profile Layer (Matching Competitor UX)**: Concurrently calls `GET /api/profile/{username}/quickstats` returning user metadata (avatar, bio, followers, stars, forks, top languages, last active date) in <2s while starting the deep static analysis scan in the background. The frontend renders the quickstats card immediately and streams deep scan checklist updates below it. Includes a 15-minute cache (`quickstats:{username}`) and independent rate limits.


---

## Installation & Running Locally

### Prerequisites

Ensure you have the following installed on your machine:
- Python 3.11+
- Node.js & npm
- Redis (running locally, e.g. `redis-server`)
- TruffleHog (binary must be available at `/usr/local/bin/trufflehog`)
- Semgrep (installed via pip or available at `/Library/Frameworks/Python.framework/Versions/3.13/bin/semgrep`)

### 1. Environment Configuration

Copy the `.env.example` file to `.env` in the root folder and configure the keys:
```bash
cp .env.example .env
```
- `GITHUB_TOKEN`: A personal access token to lift rate limits during scans.
- `HF_API_TOKEN`: A Hugging Face token to run the AI synthesis model.
- `REDIS_URL`: Redis connection URL (default `redis://localhost:6379/0`).

---

### 2. Running the Backend & Worker

Navigate to the `backend` directory, install requirements, and run the FastAPI server:
```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal tab, run the background job worker:
```bash
cd backend
python3 worker.py
```

---

### 3. Running the Frontend

Navigate to the `frontend` directory, install dependencies, and run the dev server:
```bash
cd frontend
npm install
npm run dev
```

Open your browser and navigate to the local URL (e.g. `http://localhost:5173`).

---

## Testing

To run the complete Python test suite covering GitHub client, structural hygiene checks, TruffleHog scanning, Semgrep parsing, AI synthesis, and fix generators:

```bash
cd backend
python3 -m pytest -v
```
All 45 tests will execute, verifying database migrations, absolute secret redaction, rate limits, multi-tenant isolation, quickstats API, 15-minute caching, and API error states.

---

## Known Limitations & Architecture Tradeoffs

1. **In-Memory Rate Limiting Fallback**: Rate limiting relies on Redis. If Redis is offline during a scan, rate limiting degrades gracefully to allow execution rather than blocking scans entirely.
2. **Synchronous Subprocess Scanners**: TruffleHog and Semgrep are executed via `subprocess.run` with 30-second timeouts per repository inside background worker tasks.
3. **Unpinned Direct Dependencies**: `requirements.txt` targets latest versions for local development compatibility (e.g. Python 3.13 bcrypt/FastAPI changes). Production deployments should pin exact SHAs/versions.

---

## Data Retention & Privacy Policy

1. **Anonymous Scan Reports**: Scan reports are strictly session-scoped using HttpOnly `scan_session_id` tokens. Scan reports are **never** indexable or queryable by GitHub username.
2. **IP Rate Limit Retention**: Requesters' IP addresses are stored temporarily in Redis / memory for rolling 24-hour rate limiting (`RATE_LIMIT_SCANS_PER_IP_24H`). IP keys automatically expire after 24 hours.
3. **In-Memory Credential Redaction**: TruffleHog secrets and code snippets are redacted in memory before database persistence. Raw secret tokens are never written to disk or logs.

