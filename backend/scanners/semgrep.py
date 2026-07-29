import os
import json
import subprocess
from typing import List, Dict, Any

def scan_smells(repo_path: str, repo_name: str) -> List[Dict[str, Any]]:
    """
    Runs Semgrep against the local repository path.
    Parses and normalizes code smell findings.
    """
    findings = []
    import shutil
    semgrep_path = shutil.which("semgrep") or "/Library/Frameworks/Python.framework/Versions/3.13/bin/semgrep"

    if not semgrep_path or not os.path.exists(semgrep_path):
        print(f"Warning: Semgrep binary not found at {semgrep_path}. Skipping code smell scan.")
        return findings

    try:
        # Run semgrep with auto config in JSON mode with 30s timeout and folder exclusions
        result = subprocess.run(
            [
                semgrep_path, "--config", "auto", "--offline", "--quiet", "--json", 
                "--max-target-bytes", "5000000",
                "--exclude", "node_modules",
                "--exclude", "venv",
                "--exclude", "dist",
                "--exclude", "build",
                repo_path
            ],
            capture_output=True,
            text=True,
            check=False,
            timeout=15
        )
    except subprocess.TimeoutExpired:
        print(f"Warning: Semgrep scan timed out for repository {repo_path} after 30s.")
        return findings
    except Exception as e:
        print(f"Error running Semgrep: {e}")
        return findings

    stdout = result.stdout
    if not stdout:
        return findings

    try:
        # Locate the JSON start to bypass any leading text output
        json_start_idx = stdout.find("{")
        if json_start_idx == -1:
            print("Error: Semgrep output did not contain a valid JSON object.")
            return findings
            
        json_data = json.loads(stdout[json_start_idx:])
        results = json_data.get("results", [])

        for item in results:
            check_id = item.get("check_id", "generic-smell")
            
            # File path relative to repo_path
            raw_file_path = item.get("path", "")
            if raw_file_path.startswith(repo_path):
                rel_file_path = os.path.relpath(raw_file_path, repo_path)
            else:
                rel_file_path = raw_file_path

            start_info = item.get("start", {})
            line_number = start_info.get("line")

            extra = item.get("extra", {})
            message = extra.get("message", "Potential code smell detected.")
            semgrep_severity = extra.get("severity", "WARNING").upper()

            # Map Semgrep severity to our schema
            if semgrep_severity == "ERROR":
                severity = "high"
            elif semgrep_severity == "WARNING":
                severity = "medium"
            else:
                severity = "low"

            from scanners.trufflehog import get_redacted_code_snippet
            code_snippet = None
            if line_number:
                full_abs_path = os.path.join(repo_path, rel_file_path)
                code_snippet = get_redacted_code_snippet(full_abs_path, line_number)

            findings.append({
                "repo_name": repo_name,
                "type": "smell",
                "file_path": rel_file_path,
                "line_number": line_number,
                "rule_id": check_id,
                "severity": severity,
                "description": message,
                "verification_status": None,
                "code_snippet": code_snippet
            })

    except json.JSONDecodeError as e:
        print(f"Error decoding Semgrep JSON: {e}")
    except Exception as e:
        print(f"Error parsing Semgrep results: {e}")

    return findings
