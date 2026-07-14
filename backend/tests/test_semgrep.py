import os
import pytest
from unittest.mock import patch, MagicMock
from scanners.semgrep import scan_smells

@patch("subprocess.run")
@patch("os.path.exists")
def test_scan_smells_success(mock_exists, mock_run):
    """
    Test parsing Semgrep results and mapping them to our findings schema.
    """
    mock_exists.return_value = True

    # Simulate Semgrep json output
    semgrep_json_output = """
    Some warnings or info from Semgrep...
    {
      "results": [
        {
          "check_id": "rules.python.security.eval-detected",
          "path": "/tmp/test-repo/src/main.py",
          "start": {"line": 15, "col": 5},
          "extra": {
            "message": "Use of eval() detected, which can lead to remote code execution.",
            "severity": "ERROR"
          }
        },
        {
          "check_id": "rules.python.best-practice.print-detected",
          "path": "/tmp/test-repo/src/helper.py",
          "start": {"line": 42, "col": 1},
          "extra": {
            "message": "Avoid using print statement in production.",
            "severity": "INFO"
          }
        }
      ]
    }
    """
    
    mock_result = MagicMock()
    mock_result.stdout = semgrep_json_output
    mock_run.return_value = mock_result

    findings = scan_smells("/tmp/test-repo", "my-repo")
    
    assert len(findings) == 2
    
    # Check first finding (eval, ERROR -> high)
    f1 = findings[0]
    assert f1["repo_name"] == "my-repo"
    assert f1["type"] == "smell"
    assert f1["file_path"] == "src/main.py"
    assert f1["line_number"] == 15
    assert f1["rule_id"] == "rules.python.security.eval-detected"
    assert f1["severity"] == "high"
    assert "eval()" in f1["description"]

    # Check second finding (print, INFO -> low)
    f2 = findings[1]
    assert f2["file_path"] == "src/helper.py"
    assert f2["line_number"] == 42
    assert f2["rule_id"] == "rules.python.best-practice.print-detected"
    assert f2["severity"] == "low"
    assert "print statement" in f2["description"]
