# Decisions Log

This document records the architectural and design decisions made during the development of the GitHub Profile Health Auditor.

## Queue & Workers
- **Choice**: RQ (Redis Queue)
- **Rationale**: RQ is exceptionally easy to configure and run in Python. It does not require the overhead of Celery (which requires complex configurations and broker setups). We can run a worker process simply with `rq worker` or a custom `worker.py` script. It integrates perfectly with our SQLite database because the worker can access the SQLite database directly or return the results to Redis to be updated by the API server.

## Database
- **Choice**: SQLite
- **Rationale**: SQLite requires zero setup and is stored in a single file, making it perfect for local development. By using SQLAlchemy ORM, the schema is easily portable to PostgreSQL if the application needs to scale.

## AI Layer / Model Selection
- **Choice**: Hugging Face Inference API calling `meta-llama/Llama-3.3-70B-Instruct` or `Qwen/Qwen2.5-Coder-32B-Instruct`.
- **Rationale**: These models are larger and perform much better at structured JSON output than the smaller 8B model. If these are rate-limited or unavailable, we will fallback to `meta-llama/Meta-Llama-3.1-8B-Instruct`.

## Frontend Styling
- **Choice**: Tailwind CSS v3
- **Rationale**: Standard, highly reliable, and integrates cleanly with Vite via standard postcss configuration.

## Secret Redaction
- **Decision**: The backend will immediately redact any secret values found by TruffleHog. We will only store the first/last characters or entirely replace it with `[REDACTED]` in the DB and response payloads. The actual secret is never logged or saved.

## SaaS Database Upgrade
- **Decision**: Support both SQLite (local development fallback) and PostgreSQL (production).
- **Rationale**: Implemented using SQLAlchemy dialects and dynamic `postgres://` to `postgresql://` string normalization to prevent deployment errors.

## Authentication (Python 3.13 Compatibility)
- **Decision**: JWT with standard `bcrypt` hashing (bypassing `passlib`).
- **Rationale**: Python 3.13 removed the standard library `crypt` module, causing `passlib` to throw errors or fail. Using `bcrypt` directly provides a lightweight, highly compatible hashing solution.

## Rate Limiting & Abuse Prevention
- **Decision**: Custom Redis-based rate limiting (5 scans per hour per user).
- **Rationale**: Bypasses heavy dependencies (like `slowapi`) by leveraging the existing Redis connection already used for RQ queue workers.

## SPA Routing & Collapsible Tree UI
- **Decision**: Custom state-based routing in React, rather than `react-router-dom`, with a nested tree folder expansion pattern for repository findings.
- **Rationale**: Simplifies client-side bundling, matches GitHub's actual tree layout, and enables on-the-fly rendering of simulated syntax-highlighted code panels.

## Anonymous Session Scoping vs Public Identity Privacy
- **Decision**: Scoped anonymous scans using random, opaque `scan_session_id` cookies / `X-Session-ID` headers rather than exposing scan reports by GitHub username lookups.
- **Rationale**: Usernames are public identifiers, not secrets. Allowing scan report retrieval by username alone would expose private findings to anyone guessing the username. Scoping reports strictly to session ID/user ID preserves default privacy.

## Universal Per-IP Rate Limiting (No Token Bypass)
- **Decision**: Per-IP scan rate limiting (`RATE_LIMIT_SCANS_PER_IP_24H`) applies universally to all scan submissions regardless of whether a user supplies a `github_token`.
- **Rationale**: User-supplied tokens only solve GitHub REST API rate limits; they do not offset backend server compute costs (Semgrep, TruffleHog, LLM synthesis). Disallowing token bypass prevents malicious users from generating dummy GitHub access tokens to circumvent server compute rate limits.

## Git History TruffleHog Audit & Verification Expiration
- **Decision**: Enforced `trufflehog git file:///...` scans across the entire Git commit log history, embedded 15-minute expiration timestamps on bio challenge tokens, and enforced exact username case matching on OAuth identity checks.
- **Rationale**: Scanning disk files alone is insufficient for open-sourcing; full Git history scanning guarantees no historical commit contains verified secrets. Expiring challenge tokens and enforcing single-use rules prevents replay attacks.

## Compute Cost Guardrails & Honeypot Bot Mitigation
- **Decision**: Configured environment-bounded `MAX_REPOS_PER_SCAN` and `SCAN_JOB_TIMEOUT_SECONDS` alongside a honeypot `website_url` parameter.
- **Rationale**: Unauthenticated public scan endpoints are vulnerable to automated scraping and denial-of-wallet/compute attacks. Enforcing repo truncation and a honeypot field prevents malicious scripts from consuming excessive background worker resources.

## Opt-In Public Badges & Ownership Proof Isolation
- **Decision**: Public SVG badges read strictly from a separate `PublicBadge` table populated only after GitHub bio token or OAuth ownership verification.
- **Rationale**: Unverified public badges could be weaponized to shame or publicly score users without their consent. Restricting SVG rendering to verified `PublicBadge` entries ensures public visibility is strictly an explicit, revocable opt-in choice.

## Instant Anonymous Scanning & Decoupled Opt-In UX
- **Decision**: Main scan input flow on `LandingPage.jsx` executes without authentication. The badge publishing flow is surfaced as a secondary modal requiring explicit proof of ownership.
- **Rationale**: Frictionless zero-signup scanning maximizes user utility while maintaining strict data isolation. Separating badge publishing into a modal enforces informed consent before any identity association occurs.

## Automated Secret Auditing & Community Governance Standard
- **Decision**: Sanitized `.env` credentials, added explicit MIT license, contributing guidelines, issue/PR templates, and enforced pre-commit TruffleHog audits.
- **Rationale**: Preparing an application for open-sourcing requires zero secret leaks in codebase history, explicit licensing, clear contribution guardrails, and environment variable documentation.

## Instant Profile Layer (Matching Competitor UX with Deep Scan Underlying)
- **Decision**: Implemented `GET /api/profile/{username}/quickstats` returning aggregated profile metadata (followers, stars, forks, top languages, active dates) in <2s with 15-minute caching and independent per-IP rate limiting (`RATE_LIMIT_QUICKSTATS_PER_IP_24H`).
- **Rationale**: Competitor tools provide fast superficial metadata viewing. Our deep scan (TruffleHog/Semgrep/AI synthesis) is valuable and inherently slower. Adding a fast front layer matches competitor initial load times while allowing the deep security scan to stream progress and merge on the same page.

