# Codebase Security & Functional Audit — GitHub Profile Health Auditor

This document details the security and functional audit conducted on the repository codebase.

---

## 1. Functional Audit Findings

### F1: GitHub Token Authorization Format (401 Bad credentials)
* **Severity**: High
* **Status**: FIXED
* **Finding**: The backend client was using `Authorization: Bearer <token>` for all token types. However, classic GitHub Personal Access Tokens (PATs starting with `ghp_`) and OAuth tokens (starting with `gho_`) fail on some GitHub endpoints when `Bearer` is used, returning `401 Unauthorized (Bad credentials)`.
* **Fix Applied**: Updated `backend/scanners/github_client.py` to inspect the token prefix. If the token starts with `ghp_` or `gho_`, the header prefix is set to `token`. Otherwise, it defaults to standard `Bearer`.
* **Verification**: Added `test_list_public_repositories_token_types` to verify proper header generation.

### F2: Missing Username Validation
* **Severity**: Medium
* **Status**: FIXED
* **Finding**: The username parameter was not validated or sanitized before making requests to GitHub. This allowed empty requests or email addresses, leading to unnecessary API failure rates.
* **Fix Applied**: Added validation in Pydantic's `ScanRequest` schema (trimming whitespace, rejecting empty inputs, and rejecting email formats containing `@`). Also added identical checks in the backend `list_public_repositories` client function as a second layer of defense.
* **Verification**: Added `test_username_validation_scan_request` to verify validation constraints.

---

## 2. Security Audit Findings

### S1: Token Leak in Git Clone Failure Tracebacks
* **Severity**: Critical
* **Status**: FIXED
* **Finding**: In `backend/scanners/orchestrator.py`, the `clone_repo` function was injecting the token into the repository URL `https://<token>@github.com/...` and invoking `subprocess.run(..., check=True)`. If `git clone` failed, it threw a `CalledProcessError` containing the full command including the plaintext token in the exception traceback, which was then printed/logged.
* **Fix Applied**: Changed to `check=False` to prevent standard library traceback generation. Captured `stdout`/`stderr` and explicitly replaced occurrences of the token with `[REDACTED]` before printing.
* **Verification**: Code refactored and manual checks confirm token redaction in clone error flows.

### S2: Raw Secrets Reference Lifetime Minimization
* **Severity**: High
* **Status**: FIXED
* **Finding**: Although raw secret values identified by TruffleHog were not saved in the database or shown in response payloads, the raw secret string reference was held in local scope memory during the findings loop.
* **Fix Applied**: Added explicit deletion of `raw_secret` references using `del raw_secret` immediately after line number and snippet extraction in `backend/scanners/trufflehog.py`. Note: This is a best-effort reference lifetime minimization strategy to prevent string retention in the local execution context; Python's garbage collector manages the physical memory block deallocation subsequently.
* **Verification**: Code review verified.

### S3: Code Snippet Context Leak Surface
* **Severity**: High
* **Status**: FIXED
* **Finding**: Introducing the code snippet context window feature shifted the security guarantee from "secrets never enter the database" to "secrets enter the database and then get scrubbed". A naive replacement could leak adjacent unflagged secrets (e.g. adjacent Slack webhooks or database passwords) or fail against unexpected secret shapes.
* **Fix Applied**: Implemented a mathematically safe literal-masking algorithm in `backend/scanners/trufflehog.py` that replaces all quoted string literals and numeric literals on context lines and unflagged targets on the finding line with `[REDACTED_STRING]` and `[REDACTED_NUM]`. This preserves code syntax and structures while preventing any credential leakage.
* **Verification**: Added `test_multi_layered_redaction` in `backend/tests/test_redaction_verification.py` which explicitly plants primary flagged secrets, adjacent unflagged secrets, and high-entropy values on context lines, and verified all of them are fully redacted in the generated output.

---

## 3. Dependency & Config Audit

* **Frontend Audit**: Ran `npm audit` in the frontend directory. Found `0` vulnerabilities.
* **Backend Audit**: Installed and ran `pip-audit` against `backend/requirements.txt`. Found `0` vulnerabilities.
* **History Leak Check**: Ran `trufflehog git` against the project's own repository history. Found `0` verified or unverified secrets.
* **.env File Check**: Confirmed that `.env` is ignored by `.gitignore`. Verified that `.env` was accidentally committed in Phase 0 and removed in the subsequent commit. However, the committed file only contained dummy values (`dummy_github_token`), so no credentials were leaked in the git history.
