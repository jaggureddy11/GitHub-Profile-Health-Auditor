import os
import tempfile
import pytest
from scanners.trufflehog import get_redacted_code_snippet

def test_multi_layered_redaction():
    # Arrange: Put adjacent secret, primary secret, and high-entropy value consecutively on lines 2, 3, and 4
    content = """# Line 1: Header
api_secret = "supersecret1234567"
github_token = "ghp_ABC123xyz789012345678901234567890123"
checksum = "c3ab8e9f28d84091a18274a9058b8f2c"
"""
    with tempfile.NamedTemporaryFile(mode="w+", suffix=".py", delete=False) as f:
        f.write(content)
        temp_path = f.name

    try:
        # Act: Target line 3 (github_token), which creates a window of lines 2, 3, and 4
        snippet = get_redacted_code_snippet(temp_path, 3, "ghp_ABC123xyz789012345678901234567890123")
        assert snippet is not None

        # Print for manual inspection verification
        print("\nGenerated Snippet:")
        print(snippet)

        # Assert:
        # 1. Primary secret must be redacted
        assert "ghp_ABC123xyz789012345678901234567890123" not in snippet
        assert "[REDACTED]" in snippet or "[REDACTED_GITHUB_TOKEN]" in snippet

        # 2. Adjacent variable assignment secret (line 2) must be redacted by generic pattern
        assert "supersecret1234567" not in snippet
        assert "[REDACTED_SENSITIVE_DATA]" in snippet

        # 3. High-entropy string (line 4) must be redacted by high-entropy block scrubber
        assert "c3ab8e9f28d84091a18274a9058b8f2c" not in snippet
        assert "[REDACTED_HIGH_ENTROPY_STRING]" in snippet

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
