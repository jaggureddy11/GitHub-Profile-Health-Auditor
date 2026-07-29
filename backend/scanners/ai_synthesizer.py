import os
import json
import httpx
from typing import List, Dict, Any, Tuple

# Default model IDs
HF_MODEL_ID = "Qwen/Qwen2.5-Coder-32B-Instruct"
GROQ_MODEL_ID = "llama-3.3-70b-versatile"

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
    
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_findings = sorted(findings, key=lambda x: severity_order.get(x.get("severity", "low"), 4))
    
    top_issues = []
    for f in sorted_findings[:5]:
        top_issues.append({
            "issue": f.get("description", "Potential quality issue."),
            "justification": f"Automated fallback report: flagged {f.get('type')} issue in '{f.get('file_path')}' with {f.get('severity')} severity.",
            "severity": f.get("severity", "medium")
        })

    repo_summaries = {}
    for f in findings:
        repo_name = f.get("repo_name", "unknown")
        if repo_name not in repo_summaries:
            repo_summaries[repo_name] = {
                "score_impact": 0,
                "summary": "Flagged issues: "
            }
        
        sev = f.get("severity", "low").lower()
        impact = -25 if sev == "critical" else (-15 if sev == "high" else (-5 if sev == "medium" else -2))
        repo_summaries[repo_name]["score_impact"] += impact
        repo_summaries[repo_name]["summary"] += f"{f.get('rule_id')} ({f.get('severity')}); "

    for r in repo_summaries:
        repo_summaries[r]["summary"] = repo_summaries[r]["summary"].rstrip("; ")
        repo_summaries[r]["score_impact"] = max(-100, repo_summaries[r]["score_impact"])

    return {
        "overall_score": score,
        "top_issues": top_issues,
        "repo_summaries": repo_summaries
    }

async def call_groq_api(prompt: str, token: str) -> str:
    """
    High-speed LLM inference via Groq API (sub-second response).
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": GROQ_MODEL_ID,
        "messages": [
            {"role": "system", "content": "You are a senior Application Security and Code Hygiene auditor. Return requested output strictly in requested format."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1500
    }
    
    async with httpx.AsyncClient(timeout=15.0, trust_env=False) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Groq API returned status {response.status_code}: {response.text}")
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def call_hf_api(prompt: str, token: str) -> str:
    """
    Makes HTTP request to Hugging Face Inference API.
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
    
    async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
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
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

async def synthesize_report(findings: List[Dict[str, Any]], repo_name: str = None, repo_path: str = None) -> Tuple[int, str]:
    """
    Aggregates findings, inspects repo architecture/README (if path provided),
    and calls Groq (or Hugging Face) LLM to synthesize report.
    Returns: (overall_score, summary_json_string)
    """
    groq_token = os.getenv("GROQ_API_TOKEN")
    hf_token = os.getenv("HF_API_TOKEN")

    file_structure = []
    readme_text = ""
    if repo_path and os.path.exists(repo_path):
        try:
            for root, dirs, files in os.walk(repo_path):
                # Ignore heavy or hidden folders
                dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "venv", "__pycache__", "dist", "build")]
                rel_root = os.path.relpath(root, repo_path)
                if rel_root == ".":
                    rel_root = ""
                for f in files:
                    rel_file = os.path.join(rel_root, f) if rel_root else f
                    file_structure.append(rel_file)
                    if f.lower().startswith("readme") and not readme_text:
                        readme_file_path = os.path.join(root, f)
                        try:
                            with open(readme_file_path, "r", encoding="utf-8", errors="ignore") as rf:
                                readme_text = rf.read(1200)
                        except Exception:
                            pass
        except Exception as ex:
            print(f"Error inspecting repo path for AI synthesis: {ex}")

    findings_summary = []
    for f in findings:
        findings_summary.append({
            "repo": f.get("repo_name") or repo_name or "repository",
            "type": f.get("type"),
            "file": f.get("file_path"),
            "severity": f.get("severity"),
            "description": f.get("description")
        })

    prompt_schema_desc = """
    Return ONLY a raw valid JSON object matching the following structure exactly. Do not include any explanation or markdown block wrappers (do not wrap in ```json).
    {
      "overall_score": 85,
      "architecture_summary": "Python/FastAPI backend with SQLite database and React frontend containerized with Docker.",
      "readme_evaluation": "Good README structure with overview and setup commands.",
      "top_issues": [
        {
          "issue": "Committed sensitive environment file '.env'",
          "justification": "Exposing active API keys or credentials allows unauthorized access and potential data leaks.",
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

    prompt = f"""You are a senior Lead Software Architect and Application Security Auditor.
Analyze the following public repository and its security findings to synthesize an accurate, professional Health Audit report.

Target Repository: {repo_name or 'Public Repository'}
File Structure Sample (top 30 files):
{json.dumps(file_structure[:30], indent=2)}

README Preview (first 1000 chars):
{readme_text or 'No README file found.'}

Aggregated Security & Code Findings ({len(findings_summary)} items):
{json.dumps(findings_summary, indent=2)}

{prompt_schema_desc}
"""

    # 1. Try Groq API (High Speed) with retry on malformed JSON
    if groq_token and not groq_token.startswith("dummy"):
        for attempt in range(2):
            try:
                print(f"Invoking Groq API AI Engine for '{repo_name or 'repo'}' (attempt {attempt+1})...")
                response_text = await call_groq_api(prompt, groq_token)
                cleaned_text = clean_llm_json(response_text)
                parsed_json = json.loads(cleaned_text)
                overall_score = int(parsed_json.get("overall_score", calculate_fallback_score(findings)))
                return overall_score, json.dumps(parsed_json)
            except Exception as e:
                print(f"Groq API synthesis attempt {attempt+1} failed: {e}")

    # 2. Try Hugging Face API with retry on malformed JSON
    if hf_token and not hf_token.startswith("dummy"):
        for attempt in range(2):
            try:
                print(f"Invoking Hugging Face API AI Engine for '{repo_name or 'repo'}' (attempt {attempt+1})...")
                response_text = await call_hf_api(prompt, hf_token)
                cleaned_text = clean_llm_json(response_text)
                parsed_json = json.loads(cleaned_text)
                overall_score = int(parsed_json.get("overall_score", calculate_fallback_score(findings)))
                return overall_score, json.dumps(parsed_json)
            except Exception as e:
                print(f"Hugging Face API synthesis attempt {attempt+1} failed: {e}")

    # 3. Deterministic Fallback
    print("Using deterministic fallback report engine.")
    fallback_report = build_fallback_report(findings)
    return fallback_report["overall_score"], json.dumps(fallback_report)
