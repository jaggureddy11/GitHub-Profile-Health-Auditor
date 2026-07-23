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
