import os
from typing import List, Dict, Any

def scan_hygiene(repo_path: str, repo_name: str) -> List[Dict[str, Any]]:
    """
    Scans a local repository directory for structural hygiene issues:
    - Missing README.md, LICENSE, .gitignore
    - Presence of leaked files/folders (.env, node_modules, __pycache__)
    """
    findings = []

    # 1. Check for files at root level
    root_files = []
    try:
        root_files = os.listdir(repo_path)
    except Exception as e:
        print(f"Error listing files in {repo_path}: {e}")
        return findings

    # Case-insensitive checks for root files
    root_files_lower = [f.lower() for f in root_files]

    # README check
    has_readme = any(f.startswith("readme") for f in root_files_lower)
    if not has_readme:
        findings.append({
            "repo_name": repo_name,
            "type": "structural",
            "file_path": "README.md",
            "line_number": None,
            "rule_id": "missing-readme",
            "severity": "medium",
            "description": "Missing README.md file at root. A README is critical for introducing visitors and recruiters to your project.",
            "verification_status": None
        })

    # LICENSE check
    has_license = any(f.startswith("license") for f in root_files_lower)
    if not has_license:
        findings.append({
            "repo_name": repo_name,
            "type": "structural",
            "file_path": "LICENSE",
            "line_number": None,
            "rule_id": "missing-license",
            "severity": "medium",
            "description": "Missing LICENSE file at root. Public repositories without a license default to exclusive copyright, preventing others from legally using or contributing to the code.",
            "verification_status": None
        })

    # .gitignore check
    has_gitignore = ".gitignore" in root_files_lower
    if not has_gitignore:
        findings.append({
            "repo_name": repo_name,
            "type": "structural",
            "file_path": ".gitignore",
            "line_number": None,
            "rule_id": "missing-gitignore",
            "severity": "high",
            "description": "Missing .gitignore file at root. This often leads to accidentally committing local environment files, caches, and dependency folders.",
            "verification_status": None
        })

    # 2. Walk directory tree to find leaked files/folders
    for root, dirs, files in os.walk(repo_path):
        # Check for committed node_modules or __pycache__ folders
        for d in dirs:
            rel_dir_path = os.path.relpath(os.path.join(root, d), repo_path)
            if d == "node_modules":
                findings.append({
                    "repo_name": repo_name,
                    "type": "structural",
                    "file_path": rel_dir_path,
                    "line_number": None,
                    "rule_id": "leaked-node-modules",
                    "severity": "high",
                    "description": "Committed 'node_modules/' directory. Dependency folders should be excluded via .gitignore to keep repository sizes small and clean.",
                    "verification_status": None
                })
            elif d == "__pycache__":
                findings.append({
                    "repo_name": repo_name,
                    "type": "structural",
                    "file_path": rel_dir_path,
                    "line_number": None,
                    "rule_id": "leaked-pycache",
                    "severity": "low",
                    "description": "Committed '__pycache__/' Python bytecode directory. Compiled caches should be ignored.",
                    "verification_status": None
                })

        # Skip walking into dependency folders or version control directories to speed up and avoid false positives
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "venv", ".venv", "env", ".env", "dist", "build", "__pycache__")]


        # Check files for sensitive leaks like .env files
        for f in files:
            # Check for .env file leaks (case insensitive and matches .env.development, etc.)
            if f.lower().startswith(".env") and not f.lower().endswith(".example"):
                rel_file_path = os.path.relpath(os.path.join(root, f), repo_path)
                findings.append({
                    "repo_name": repo_name,
                    "type": "structural",
                    "file_path": rel_file_path,
                    "line_number": None,
                    "rule_id": "leaked-env-file",
                    "severity": "critical",
                    "description": f"Committed sensitive environment file '{rel_file_path}'. This file may contain private credentials and API keys.",
                    "verification_status": "unverified"
                })

    return findings
