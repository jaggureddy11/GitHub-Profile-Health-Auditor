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

def scan_secrets(repo_path: str, repo_name: str) -> List[Dict[str, Any]]:
    """
    Runs TruffleHog against the local repo path.
    Parses and normalizes findings, ensuring absolute redaction of secret values.
    """
    findings = []
    trufflehog_path = "/usr/local/bin/trufflehog"

    if not os.path.exists(trufflehog_path):
        print(f"Warning: TruffleHog binary not found at {trufflehog_path}. Skipping secret scan.")
        return findings

    try:
        # Run trufflehog filesystem scan outputting JSON
        result = subprocess.run(
            [trufflehog_path, "filesystem", "--json", repo_path],
            capture_output=True,
            text=True,
            check=False # TruffleHog may exit with non-zero if findings are found
        )
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
                "verification_status": verification_str
            })

        except json.JSONDecodeError:
            # Skip invalid JSON lines
            continue
        except Exception as e:
            print(f"Error parsing TruffleHog finding: {e}")
            continue

    return findings
