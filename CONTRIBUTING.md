# Contributing to GitHub Profile Health Auditor

Thank you for your interest in contributing to the **GitHub Profile Health Auditor**! We welcome contributions that improve security analysis, performance, accessibility, and documentation.

## Core Architectural Principles

Before submitting code, please keep these mandatory design principles in mind:

1. **Anonymous Scans by Default**: Core scan features must remain accessible without mandatory account registration. Scans are session-scoped and private by default.
2. **Zero-Secret Storage Guarantee**: Raw secrets discovered by TruffleHog or scanners MUST be redacted in temporary memory (`[REDACTED]`). Raw secret values must NEVER be stored in databases, log files, or terminal outputs.
3. **Verified Opt-In Public Badges**: Public SVG badges read strictly from the `PublicBadge` table and require explicit proof-of-ownership (GitHub bio challenge token or OAuth verification).
4. **Test-Driven Verification**: Every bug fix or feature addition must include accompanying automated tests under `backend/tests/`.

## Local Development Setup

### Backend (Python FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m pytest -v
```

### Frontend (React Vite)

```bash
cd frontend
npm install
npm run dev
```

## Running Automated Tests

```bash
cd backend
python3 -m pytest -v
```

All backend tests must pass before opening a pull request.

## Submitting Pull Requests

1. Fork the repository and create your feature branch (`git checkout -b feature/my-cool-feature`).
2. Commit your changes with clear, descriptive commit messages.
3. Verify that all tests pass (`pytest`) and frontend builds without warnings (`npm run build`).
4. Open a Pull Request targeting `main` with a detailed description of your changes.
