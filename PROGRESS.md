# Progress Log — GitHub Profile Health Auditor

This log tracks the build process and testing outcomes for each phase.

## Phase 0 — Project Scaffolding
- Status: Completed
- Completed features:
  - Initialized repository structures (`/backend`, `/frontend`, `/docs`).
  - Set up FastAPI backend with SQLite, SQLAlchemy models, and schemas.
  - Set up Vite + React + Tailwind CSS v3 frontend skeleton (build verified).
  - Wrote environment config template (`.env.example`) and decisions log (`DECISIONS.md`).
  - Added unit smoke test for backend `/health` endpoint and verified clean execution.
## Phase 1 — GitHub Repo Enumeration
- Status: Completed
- Completed features:
  - Developed `github_client.py` using `httpx` to list public, non-fork repositories for a user.
  - Implemented pagination and rate-limit handling using GitHub headers.
  - Exposed `POST /api/scan` and `GET /api/scan/{scan_id}` endpoints in `main.py`.
  - Added unit tests in `test_github.py` covering pagination and rate-limiting using mocked API responses.

## Phase 2 — Structural Hygiene Scan
- Status: Completed
- Completed features:
  - Implemented `scan_hygiene` in `scanners/hygiene.py` to check for missing README, LICENSE, and `.gitignore`.
  - Added scanning for committed leaks of `.env` files, `node_modules`, and `__pycache__` with path normalization.
  - Wrote comprehensive unit tests in `test_hygiene.py` covering clean repo structure, missing standard files, and committed leaks.

## Phase 3 — Secret Scanning via TruffleHog
- Status: Completed
- Completed features:
  - Installed and verified TruffleHog CLI tool.
  - Implemented `scan_secrets` in `scanners/trufflehog.py` that runs TruffleHog in filesystem mode and processes JSON stdout stream.
  - Resolved dynamic line numbers for raw findings and implemented absolute redaction of secret values.
  - Configured `scanners/orchestrator.py` background job framework and wrote `worker.py` utilizing Redis Queue (RQ).
  - Wrote unit and integration tests verifying cloning, scanning, and database persistence with redacted credentials.

## Phase 4 — Code Smell Scanning via Semgrep
- Status: Completed
- Completed features:
  - Installed and verified Semgrep CLI tool.
  - Developed `scan_smells` in `scanners/semgrep.py` to run Semgrep inside the cloned repository with the `auto` rule pack.
  - Implemented logic to parse Semgrep JSON output bypass leading warnings, map severities, and record relative paths.
  - Integrated Semgrep into the background orchestrator (`run_scan_job`) and wrote unit tests in `test_semgrep.py`.

## Phase 5 — AI Synthesis Layer
- Status: Completed
- Completed features:
  - Developed `scanners/ai_synthesizer.py` utilizing the Hugging Face Inference API.
  - Formulated a detailed prompt with a strict schema template for Llama/Qwen.
  - Implemented cleanup helper, JSON validation, retry-on-failure re-prompting, and a robust deterministic fallback report logic.
  - Refactored `run_scan_job` to run the async AI synthesizer using `asyncio.run`.
  - Added unit tests in `test_ai.py` covering fallback calculations, cleanups, successful API calls, and retry mechanisms.

## Phase 6 — Frontend Integration
- Status: Completed
- Completed features:
  - Integrated custom dark mode aesthetics with glassmorphic cards and glowing radial gauges.
  - Implemented dynamic forms storing GITHUB_TOKEN locally.
  - Built real-time polling logic to display active background scanner sub-steps.
  - Integrated filter controls to search and sort findings by type (secret, structural, smell) or severity.
  - Handled rate-limiting and username failure states using specialized error banners.

## Phase 7 — Auto-Fix Generator (Stretch)
- Status: Completed
- Completed features:
  - Added a `/api/fix` endpoint to generate compliant unified `.patch` files for structural issues.
  - Supported MIT LICENSE, python/node `.gitignore` templates, and descriptive `README.md` skeletons.
  - Integrated the auto-fix trigger into the frontend, enabling one-click file patch downloads.
  - Added test suite `test_fix.py` verifying patch generation formats.

## Stage A — Full Audit & Fixes
- Status: Completed
- Completed features:
  - Addressed 401 Unauthorized errors by dynamically adapting headers based on GITHUB_TOKEN prefix (`ghp_`/`gho_` vs `Bearer` tokens).
  - Wrote robust username sanitization and validation in `schemas.py` and `github_client.py` (rejecting empty values and email patterns).
  - Patched critical plaintext token leak in `clone_repo` by replacing the raw GITHUB_TOKEN with `[REDACTED]` from standard error logging.
  - Implemented explicit deletion of raw TruffleHog secrets from memory.
  - Documented findings, severities, and patches in `AUDIT.md`.

## Stage B — SaaS Upgrade
- Status: Completed
- Completed features:
  - Developed a robust User database entity and linked scans dynamically using foreign keys.
  - Implemented JWT-based password authentication, user details retrieval, and account deletion endpoints.
  - Added full OAuth2 GitHub login flow (code-to-token callback exchange).
  - Added Redis-based rate limiting (max 5 scans/hour per user).
  - Containerized services with Docker Compose (Postgres, Redis, API Backend, RQ Worker, Nginx Frontend SPA).
  - Redesigned frontend to mimic GitHub UI (dark-mode first, badge severities, collapsible folder structures, and mock syntax-highlighted code panels).
  - Added integration and E2E Playwright tests verifying registration, login, rate limits, multi-tenant isolation, and dashboard views.
  - Upgraded code preview functionality from simulated templates to dynamic, database-backed snippets, securing them with a multi-layered, regex-based regex scrubber.
  - Implemented database-level `NOT NULL` constraint on `Scan.user_id` to strictly enforce multi-tenant isolation.
  - Wrote a dedicated automated test suite verifying code snippet redaction logic.
