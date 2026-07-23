import os
import json
import subprocess
from typing import List, Dict, Any, Optional

def find_line_number(file_path: str, secret_value: str) -> Optional[int]:
    """
    Finds the line number in a file that contains the specified secret value.
    """
    try:
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f, 1):
                if secret_value in line:
                    return idx
    except Exception:
        pass
    return None

def get_redacted_code_snippet(file_path: str, line_number: int, secret_value: str = None) -> Optional[str]:
    """
    Reads 3 lines of context around line_number (1-based) from file_path,
    redacting specific secrets and running a generic high-entropy/credential scrubber.
    Format: 'line_num|line_content\n'
    """
    import re
    try:
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        
        idx = line_number - 1
        if idx < 0 or idx >= len(lines):
            return None
            
        start = max(0, idx - 1)
        end = min(len(lines), idx + 2)
        
        snippet_lines = []
        for i in range(start, end):
            line_content = lines[i]
            
            # 1. Redact specific secret flagged by TruffleHog
            if secret_value and secret_value in line_content:
                line_content = line_content.replace(secret_value, "[REDACTED]")
            
            # 2. Redact common assignment targets (e.g. password = "...", api_key: '...')
            assignment_pattern = re.compile(
                r'(?i)(key|token|secret|password|auth|passwd|credential|private_key|token_id)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.\+/]{8,})["\']?'
            )
            def replace_assignment(match):
                prefix = match.group(1)
                val = match.group(2)
                if len(val) >= 8:
                    return f'{prefix} = "[REDACTED_SENSITIVE_DATA]"'
                return match.group(0)
            line_content = assignment_pattern.sub(replace_assignment, line_content)

            # 3. Redact common credential patterns (AWS, GitHub, Slack)
            line_content = re.sub(r'(?i)AKIA[0-9A-Z]{16}', '[REDACTED_AWS_KEY]', line_content)
            line_content = re.sub(r'gh[pous]_[A-Za-z0-9_]{36,255}', '[REDACTED_GITHUB_TOKEN]', line_content)

            # 4. Redact high-entropy alphanumeric strings (length >= 32 chars)
            line_content = re.sub(r'\b[a-zA-Z0-9]{32,}\b', '[REDACTED_HIGH_ENTROPY_STRING]', line_content)

            # 5. Redact PEM private key headers/footers
            if "BEGIN" in line_content and "PRIVATE KEY" in line_content:
                line_content = "[REDACTED_PRIVATE_KEY_HEADER]\n"
            elif "END" in line_content and "PRIVATE KEY" in line_content:
                line_content = "[REDACTED_PRIVATE_KEY_FOOTER]\n"

            snippet_lines.append(f"{i+1}|{line_content}")
            
        return "".join(snippet_lines)
    except Exception:
        return None

def scan_secrets(repo_path: str, repo_name: str) -> List[Dict[str, Any]]:
    """
    Runs TruffleHog against the local repo path.
    Parses and normalizes findings, ensuring absolute redaction of secret values.
    """
    findings = []
    import shutil
    trufflehog_path = shutil.which("trufflehog") or "/usr/local/bin/trufflehog"

    if not trufflehog_path or not os.path.exists(trufflehog_path):
        print(f"Warning: TruffleHog binary not found at {trufflehog_path}. Skipping secret scan.")
        return findings

    try:
        # Run trufflehog filesystem scan outputting JSON with 30s timeout
        result = subprocess.run(
            [trufflehog_path, "filesystem", "--json", repo_path],
            capture_output=True,
            text=True,
            check=False,
            timeout=30
        )
    except subprocess.TimeoutExpired:
        print(f"Warning: TruffleHog scan timed out for repository {repo_path} after 30s.")
        return findings
    except Exception as e:
        print(f"Error running TruffleHog: {e}")
        return findings

    stdout = result.stdout
    if not stdout:
        return findings

    for line in stdout.splitlines():
        if not line.strip():
            continue
        try:
            data = json.loads(line)
            
            # Extract basic details
            detector_name = data.get("DetectorName", "Generic Secret")
            raw_secret = data.get("Raw", "")
            verified = data.get("Verified", False)

            # Get file path from SourceMetadata
            file_info = data.get("SourceMetadata", {}).get("Filesystem", {})
            raw_file_path = file_info.get("file", "unknown")
            
            # Make the file path relative to repo_path
            if raw_file_path.startswith(repo_path):
                rel_file_path = os.path.relpath(raw_file_path, repo_path)
            else:
                rel_file_path = raw_file_path

            # Attempt to find the line number using the raw secret before redacting it
            full_abs_path = os.path.join(repo_path, rel_file_path)
            line_number = find_line_number(full_abs_path, raw_secret) if raw_secret else None
            
            # Fetch the actual redacted code snippet around the finding
            code_snippet = None
            if line_number:
                code_snippet = get_redacted_code_snippet(full_abs_path, line_number, raw_secret)

            # Explicitly discard raw secret from memory
            raw_secret = None
            del raw_secret

            # Determine severity: critical if verified live, else high
            severity = "critical" if verified else "high"
            verification_str = "live" if verified else "unverified"

            # Create finding with absolute redaction of secret values
            findings.append({
                "repo_name": repo_name,
                "type": "secret",
                "file_path": rel_file_path,
                "line_number": line_number,
                "rule_id": f"secret-{detector_name.lower().replace(' ', '-')}",
                "severity": severity,
                "description": f"Potential {detector_name} credential leaked. Never commit active secrets or keys to public repositories.",
                "verification_status": verification_str,
                "code_snippet": code_snippet
            })

        except json.JSONDecodeError:
            # Skip invalid JSON lines
            continue
        except Exception:
            print("Error parsing TruffleHog finding: raw output omitted for security.")
            continue

    return findings
