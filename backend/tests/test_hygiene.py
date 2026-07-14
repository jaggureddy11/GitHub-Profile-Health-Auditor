import os
import tempfile
import pytest
from scanners.hygiene import scan_hygiene

def test_scan_hygiene_clean():
    """
    Test hygiene scanner on a repository with perfect structure.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Create standard good files
        open(os.path.join(tmp_dir, "README.md"), "w").close()
        open(os.path.join(tmp_dir, "LICENSE"), "w").close()
        open(os.path.join(tmp_dir, ".gitignore"), "w").close()

        findings = scan_hygiene(tmp_dir, "clean-repo")
        assert len(findings) == 0

def test_scan_hygiene_missing_standard_files():
    """
    Test hygiene scanner flags missing README, LICENSE, and .gitignore.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Empty directory has no README, LICENSE, or .gitignore
        findings = scan_hygiene(tmp_dir, "neglected-repo")
        
        # Should return 3 findings
        assert len(findings) == 3
        rule_ids = [f["rule_id"] for f in findings]
        assert "missing-readme" in rule_ids
        assert "missing-license" in rule_ids
        assert "missing-gitignore" in rule_ids

def test_scan_hygiene_leaked_files():
    """
    Test hygiene scanner detects committed node_modules, pycache, and .env files.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Create standard files to avoid missing file errors
        open(os.path.join(tmp_dir, "README.md"), "w").close()
        open(os.path.join(tmp_dir, "LICENSE"), "w").close()
        open(os.path.join(tmp_dir, ".gitignore"), "w").close()

        # Create committed node_modules directory
        os.makedirs(os.path.join(tmp_dir, "node_modules"))
        open(os.path.join(tmp_dir, "node_modules", "some-pkg"), "w").close()

        # Create committed pycache directory
        os.makedirs(os.path.join(tmp_dir, "src", "__pycache__"))
        open(os.path.join(tmp_dir, "src", "__pycache__", "module.pyc"), "w").close()

        # Create committed .env file
        open(os.path.join(tmp_dir, ".env"), "w").close()
        open(os.path.join(tmp_dir, "src", ".env.development"), "w").close()
        # .env.example should NOT be flagged
        open(os.path.join(tmp_dir, ".env.example"), "w").close()

        findings = scan_hygiene(tmp_dir, "leaky-repo")
        
        # We expect findings for:
        # 1. node_modules folder
        # 2. __pycache__ folder
        # 3. root .env file
        # 4. src/.env.development file
        assert len(findings) == 4
        rule_ids = [f["rule_id"] for f in findings]
        assert "leaked-node-modules" in rule_ids
        assert "leaked-pycache" in rule_ids
        
        env_findings = [f for f in findings if f["rule_id"] == "leaked-env-file"]
        assert len(env_findings) == 2
        file_paths = [f["file_path"] for f in env_findings]
        assert ".env" in file_paths
        assert os.path.join("src", ".env.development") in file_paths
