import os
import json
import httpx
from typing import List, Dict, Any, Tuple

# Default model ID
HF_MODEL_ID = "Qwen/Qwen2.5-Coder-32B-Instruct"

def calculate_fallback_score(findings: List[Dict[str, Any]]) -> int:
    """
    Computes a deterministic health score based on finding severities if AI synthesis fails.
    """
    score = 100
    for f in findings:
        sev = f.get("severity", "low").lower()
        if sev == "critical":
            score -= 25
        elif sev == "high":
            score -= 15
        elif sev == "medium":
            score -= 5
        elif sev == "low":
            score -= 2
    return max(0, score)

def build_fallback_report(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates a structured fallback report when AI parsing fails.
    """
    score = calculate_fallback_score(findings)
    
    # Extract top 5 issues by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_findings = sorted(findings, key=lambda x: severity_order.get(x.get("severity", "low"), 4))
    
    top_issues = []
    for f in sorted_findings[:5]:
        top_issues.append({
            "issue": f.get("description", "Potential quality issue."),
            "justification": f"Automated fallback report: flagged {f.get('type')} issue in '{f.get('file_path')}' with {f.get('severity')} severity.",
            "severity": f.get("severity", "medium")
        })

    # Group summaries by repo
    repo_summaries = {}
    for f in findings:
        repo_name = f.get("repo_name", "unknown")
        if repo_name not in repo_summaries:
            repo_summaries[repo_name] = {
                "score_impact": 0,
                "summary": "Flagged issues: "
            }
        
        # Calculate impact
        sev = f.get("severity", "low").lower()
        impact = -25 if sev == "critical" else (-15 if sev == "high" else (-5 if sev == "medium" else -2))
        repo_summaries[repo_name]["score_impact"] += impact
        repo_summaries[repo_name]["summary"] += f"{f.get('rule_id')} ({f.get('severity')}); "

    # Clean up trailing semicolons
    for r in repo_summaries:
        repo_summaries[r]["summary"] = repo_summaries[r]["summary"].rstrip("; ")
        # Ensure score impact is capped/clamped reasonably
        repo_summaries[r]["score_impact"] = max(-100, repo_summaries[r]["score_impact"])

    return {
        "overall_score": score,
        "top_issues": top_issues,
        "repo_summaries": repo_summaries
    }

async def call_hf_api(prompt: str, token: str) -> str:
    """
    Makes the HTTP request to Hugging Face Inference API.
    """
    url = f"https://api-inference.huggingface.co/models/{HF_MODEL_ID}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 1500,
            "temperature": 0.1,
            "return_full_text": False
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Hugging Face API returned status {response.status_code}: {response.text}")
            
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            return data[0].get("generated_text", "")
        elif isinstance(data, dict):
            return data.get("generated_text", "")
        return str(data)

def clean_llm_json(response_text: str) -> str:
    """
    Cleans markdown wrappers (like ```json ... ```) from the LLM output.
    """
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

async def synthesize_report(findings: List[Dict[str, Any]]) -> Tuple[int, str]:
    """
    Aggregates findings and calls Hugging Face LLM to synthesize report.
    Returns: (overall_score, summary_json_string)
    """
    # If no findings, return perfect score
    if not findings:
        empty_report = {
            "overall_score": 100,
            "top_issues": [],
            "repo_summaries": {}
        }
        return 100, json.dumps(empty_report)

    hf_token = os.getenv("HF_API_TOKEN")
    if not hf_token or hf_token.startswith("dummy"):
        print("Warning: HF_API_TOKEN is missing or dummy. Using fallback synthesizer.")
        fallback_report = build_fallback_report(findings)
        return fallback_report["overall_score"], json.dumps(fallback_report)

    # Format findings summary for the prompt
    findings_summary = []
    for f in findings:
        findings_summary.append({
            "repo": f.get("repo_name"),
            "type": f.get("type"),
            "file": f.get("file_path"),
            "severity": f.get("severity"),
            "description": f.get("description")
        })

    prompt_schema_desc = """
    Return ONLY a raw valid JSON object matching the following structure exactly. Do not include any explanation or markdown block wrappers (do not wrap in ```json).
    {
      "overall_score": 85,
      "top_issues": [
        {
          "issue": "Committed sensitive environment file '.env'",
          "justification": "A recruiter or security-conscious reviewer will immediately flag committed credentials as a critical security concern.",
          "severity": "critical"
        }
      ],
      "repo_summaries": {
        "repo-name": {
          "score_impact": -15,
          "summary": "1 critical security leak (committed .env file) and missing LICENSE."
        }
      }
    }
    """

    prompt = f"""You are a senior full-stack engineer and recruiter auditor.
Analyze the following list of findings across a developer's public repositories and synthesize them into a health report.

Aggregated Findings:
{json.dumps(findings_summary, indent=2)}

{prompt_schema_desc}
"""

    response_text = ""
    try:
        # First attempt
        response_text = await call_hf_api(prompt, hf_token)
        cleaned_text = clean_llm_json(response_text)
        parsed_json = json.loads(cleaned_text)
        
        # Verify basic structure
        overall_score = int(parsed_json.get("overall_score", 50))
        return overall_score, json.dumps(parsed_json)
        
    except Exception as e:
        print(f"First AI synthesis attempt failed: {e}. Retrying once...")
        try:
            # Re-prompt once with error context
            retry_prompt = f"""{prompt}
            
            Your previous output failed validation with the following error: {str(e)}
            Your previous output was:
            {response_text}
            
            Please correct the JSON format and ensure it conforms STRICTLY to the requested schema. Return ONLY the valid raw JSON.
            """
            response_text = await call_hf_api(retry_prompt, hf_token)
            cleaned_text = clean_llm_json(response_text)
            parsed_json = json.loads(cleaned_text)
            overall_score = int(parsed_json.get("overall_score", 50))
            return overall_score, json.dumps(parsed_json)
            
        except Exception as retry_err:
            print(f"Second AI synthesis attempt failed: {retry_err}. Using fallback report.")
            fallback_report = build_fallback_report(findings)
            return fallback_report["overall_score"], json.dumps(fallback_report)
