import pytest
import json
from unittest.mock import patch, AsyncMock
from scanners.ai_synthesizer import (
    calculate_fallback_score,
    build_fallback_report,
    synthesize_report,
    clean_llm_json
)

def test_calculate_fallback_score():
    """
    Test score calculation based on finding severities.
    """
    findings = [
        {"severity": "critical"}, # -25
        {"severity": "high"},     # -15
        {"severity": "medium"},   # -5
        {"severity": "low"},      # -2
    ]
    score = calculate_fallback_score(findings)
    assert score == 53 # 100 - 25 - 15 - 5 - 2 = 53

def test_build_fallback_report():
    """
    Test fallback report structuring.
    """
    findings = [
        {"repo_name": "repo1", "rule_id": "missing-readme", "severity": "medium", "description": "No readme"},
        {"repo_name": "repo1", "rule_id": "secret-aws", "severity": "critical", "description": "AWS leaked"},
    ]
    report = build_fallback_report(findings)
    
    assert report["overall_score"] == 70 # 100 - 25 - 5
    assert len(report["top_issues"]) == 2
    assert "repo1" in report["repo_summaries"]
    assert report["repo_summaries"]["repo1"]["score_impact"] == -30

def test_clean_llm_json():
    """
    Test cleaning markdown wrappers from LLM responses.
    """
    wrapped_json = "```json\n{\n  \"overall_score\": 90\n}\n```"
    cleaned = clean_llm_json(wrapped_json)
    assert cleaned == '{\n  "overall_score": 90\n}'

@pytest.mark.asyncio
@patch("os.getenv")
async def test_synthesize_report_fallback_on_no_token(mock_getenv):
    """
    Verify fallback is used if no HF API token is provided.
    """
    mock_getenv.return_value = None # No token
    
    findings = [{"repo_name": "repo1", "severity": "high", "description": "test"}]
    score, report_str = await synthesize_report(findings)
    
    assert score == 85 # 100 - 15
    report = json.loads(report_str)
    assert "top_issues" in report
    assert report["overall_score"] == 85

@pytest.mark.asyncio
@patch("os.getenv")
@patch("scanners.ai_synthesizer.call_hf_api")
async def test_synthesize_report_success(mock_call, mock_getenv):
    """
    Test successful LLM synthesis returning valid JSON.
    """
    mock_getenv.return_value = "fake-token-123"
    
    mock_response_json = {
        "overall_score": 92,
        "top_issues": [{"issue": "Missing LICENSE", "justification": "Hurts credibility.", "severity": "medium"}],
        "repo_summaries": {"my-repo": {"score_impact": -8, "summary": "Missing LICENSE."}}
    }
    mock_call.return_value = json.dumps(mock_response_json)

    findings = [{"repo_name": "my-repo", "severity": "medium", "description": "No license"}]
    score, report_str = await synthesize_report(findings)
    
    assert score == 92
    report = json.loads(report_str)
    assert report["overall_score"] == 92
    assert len(report["top_issues"]) == 1

@pytest.mark.asyncio
@patch("os.getenv")
@patch("scanners.ai_synthesizer.call_hf_api")
async def test_synthesize_report_retry_success(mock_call, mock_getenv):
    """
    Test LLM synthesis retries if first attempt returns malformed JSON, and succeeds on second.
    """
    mock_getenv.return_value = "fake-token-123"
    
    # First call returns malformed JSON, second call returns correct JSON
    mock_response_json = {
        "overall_score": 88,
        "top_issues": [],
        "repo_summaries": {}
    }
    mock_call.side_effect = ["MALFORMED RESPONSE text {", json.dumps(mock_response_json)]

    findings = [{"repo_name": "my-repo", "severity": "medium", "description": "No license"}]
    score, report_str = await synthesize_report(findings)
    
    assert score == 88
    report = json.loads(report_str)
    assert report["overall_score"] == 88
    assert mock_call.call_count == 2
