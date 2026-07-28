## Description
Provide a concise summary of the changes introduced in this Pull Request.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Security / Hardening improvement
- [ ] Documentation update

## Architectural Verification Checklist
- [ ] Scan endpoints remain unauthenticated/anonymous by default.
- [ ] Zero secrets are stored in databases or logs (`[REDACTED]` in RAM).
- [ ] Public SVG badges render ONLY from verified `PublicBadge` records.
- [ ] Added or updated automated unit/integration tests (`pytest`).
- [ ] Ran `trufflehog filesystem .` locally with zero verified secrets found.
- [ ] Frontend build succeeds cleanly (`npm run build`).

## Test Results
Describe the automated tests executed and attach pass logs.
