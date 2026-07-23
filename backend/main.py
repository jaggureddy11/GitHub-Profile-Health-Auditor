import os
# Fix macOS Python 3.13 fork crash (SIGABRT on child side of fork pre-exec)
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

import uuid
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone
from typing import List, Optional
from dotenv import load_dotenv

# Load env variables from parent folder .env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import redis
from rq import Queue

from database import engine, Base, get_db
import models
import schemas
from scanners.github_client import list_public_repositories, GitHubRateLimitError, GitHubAPIError

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GitHub Profile Health Auditor API",
    description="SaaS Backend API for scanning public GitHub profiles for security and quality issues.",
    version="2.0.0"
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_conn = redis.from_url(REDIS_URL)
    # Ping Redis to verify connection
    redis_conn.ping()
    scan_queue = Queue("scans", connection=redis_conn)
except Exception as e:
    print(f"Warning: Failed to connect to Redis at {REDIS_URL}. Queue and rate-limiting functionality will be disabled. Error: {e}")
    redis_conn = None
    scan_queue = None

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-change-in-prod-for-saas-audit-tool")
JWT_ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Password Hashing Helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Redis-based Rate Limiter (5 scans per hour)
def check_rate_limit(user: models.User = Depends(get_current_user)):
    if not redis_conn:
        return
    
    user_id = user.id
    current_hour = datetime.now(timezone.utc).strftime("%Y-%m-%d-%H")
    rate_limit_key = f"rate_limit:{user_id}:{current_hour}"
    
    current_count = redis_conn.get(rate_limit_key)
    if current_count:
        count = int(current_count)
        if count >= 5:
            import time
            seconds_remaining = 3600 - (int(time.time()) % 3600)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. You can perform up to 5 scans per hour. Try again in {seconds_remaining // 60} minutes."
            )
        redis_conn.incr(rate_limit_key)
    else:
        redis_conn.set(rate_limit_key, 1, ex=3600)

# Health Check
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Service is healthy"}

# SaaS Auth Endpoints
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(request: schemas.UserRegister, db: Session = Depends(get_db)):
    if "@" not in request.email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    existing = db.query(models.User).filter(models.User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already registered with this email")
    
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(request.password)
    db_user = models.User(
        id=user_id,
        email=request.email,
        hashed_password=hashed_pwd,
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login_user(request: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# GitHub OAuth settings
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "dummy_client_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "dummy_client_secret")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/github/callback")

@app.get("/api/auth/github/url")
def get_github_oauth_url():
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&scope=read:user,public_repo"
    )
    return {"url": url}

@app.post("/api/auth/demo-github")
def demo_github_login(payload: dict, db: Session = Depends(get_db)):
    username = payload.get("username", "octocat").strip().lstrip("@")
    if not username:
        username = "octocat"
    email = f"{username.lower()}@github.com"
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user_id = str(uuid.uuid4())
        user = models.User(
            id=user_id,
            email=email,
            hashed_password=hash_password(str(uuid.uuid4())),
            github_username=username,
            created_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.github_username = username
        db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/github/callback", response_model=schemas.TokenResponse)
async def github_oauth_callback(payload: dict, db: Session = Depends(get_db)):
    code = payload.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="OAuth code is missing")
    
    # 1. Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve token from GitHub")
        
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {token_data.get('error_description', 'No access token returned')}")
        
        # 2. Fetch user profile
        user_res = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json"
            }
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve profile from GitHub")
        
        user_profile = user_res.json()
        github_username = user_profile.get("login")
        email = user_profile.get("email")
        
        # If email is private, try to fetch it
        if not email:
            emails_res = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json"
                }
            )
            if emails_res.status_code == 200:
                for mail_info in emails_res.json():
                    if mail_info.get("primary") and mail_info.get("verified"):
                        email = mail_info.get("email")
                        break
            if not email:
                email = f"{github_username}@github.com"
                
        # 3. Create or update user
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user_id = str(uuid.uuid4())
            random_pw = hash_password(str(uuid.uuid4()))
            user = models.User(
                id=user_id,
                email=email,
                hashed_password=random_pw,
                github_username=github_username,
                github_oauth_token=access_token,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
        else:
            user.github_username = github_username
            user.github_oauth_token = access_token
        
        db.commit()
        db.refresh(user)
        
        # 4. Generate JWT
        jwt_token = create_access_token(data={"sub": user.id})
        return {"access_token": jwt_token, "token_type": "bearer"}

@app.post("/api/auth/delete-account")
def delete_account(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account and all associated audit data deleted successfully"}

# Public Quick Scan (No Auth Required) — Returns Basic Report
@app.post("/api/public-scan")
async def public_scan(request: schemas.ScanRequest):
    """
    Zero-auth lightweight scan using GitHub API metadata.
    No cloning, no TruffleHog — returns instantly with repo hygiene signals and basic score.
    """
    github_token = os.getenv("GITHUB_TOKEN")

    # Parse GitHub URL if full URL passed
    username = request.username.strip()
    if "github.com/" in username:
        username = username.split("github.com/")[1].split("/")[0]
    username = username.lstrip("@").strip()

    try:
        repos = await list_public_repositories(username, token=github_token)
    except GitHubRateLimitError:
        raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded. Try again in a minute.")
    except GitHubAPIError as e:
        raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found or API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    if not repos:
        raise HTTPException(status_code=404, detail=f"No public repositories found for '{username}'.")

    # Lightweight hygiene analysis using repo metadata (no cloning)
    hygiene_issues = []
    score = 100
    capped = len(repos) > 15
    repos_checked = repos[:15]

    for repo in repos_checked:
        repo_name = repo.get("name", "unknown")
        # No README check (repos without description are likely undocumented)
        if not repo.get("description"):
            hygiene_issues.append({
                "repo": repo_name,
                "issue": f"Repository '{repo_name}' has no description",
                "severity": "low"
            })
            score -= 2

    # Summary metrics
    total_repos = len(repos)
    checked_repos = len(repos_checked)

    basic_report = {
        "username": username,
        "total_repos": total_repos,
        "checked_repos": checked_repos,
        "capped": capped,
        "basic_score": max(0, score),
        "hygiene_issues": hygiene_issues[:10],
        "repositories": [
            {
                "name": r.get("name"),
                "url": r.get("url"),
                "last_commit": r.get("last_commit"),
                "default_branch": r.get("default_branch"),
                "description": r.get("description", "")
            }
            for r in repos_checked[:8]
        ],
        "is_basic_report": True,
        "upgrade_message": "Sign in or create a free account to unlock secret scanning, AI analysis, 1-click fixes, and the AI Security Copilot."
    }

    return basic_report

# Authenticated Full Scan Endpoints (Multi-tenant)
@app.post("/api/scan", response_model=schemas.FullReportResponse)
async def start_scan(

    request: schemas.ScanRequest,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _ = Depends(check_rate_limit)
):
    # Prefer request token, then user's github oauth token, then global GITHUB_TOKEN
    token = request.github_token or current_user.github_oauth_token or os.getenv("GITHUB_TOKEN")
    
    # 2. List public repositories
    try:
        repos = await list_public_repositories(request.username, token=token)
    except GitHubRateLimitError as e:
        raise HTTPException(
            status_code=403,
            detail=f"GitHub API rate limit exceeded: {str(e)}"
        )
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=400,
            detail=f"GitHub API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

    # 3. Create scan record scoped to user
    scan_id = str(uuid.uuid4())
    db_scan = models.Scan(
        id=scan_id,
        user_id=current_user.id,
        username=request.username,
        status="pending",
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_scan)
    db.commit()

    # 4. Save repositories to the database
    db_repos = []
    for r in repos:
        db_repo = models.Repository(
            scan_id=scan_id,
            name=r["name"],
            url=r["url"],
            last_commit=r["last_commit"],
            default_branch=r["default_branch"]
        )
        db.add(db_repo)
        db_repos.append(db_repo)
    db.commit()

    # 5. Queue background scan job (prefer Redis queue, fallback to BackgroundTasks)
    from scanners.orchestrator import run_scan_job
    enqueued = False
    if scan_queue:
        try:
            from rq import Worker
            workers = Worker.all(connection=scan_queue.connection)
            if workers:
                scan_queue.enqueue(
                    "scanners.orchestrator.run_scan_job",
                    scan_id=scan_id,
                    username=request.username,
                    token=token
                )
                db_scan.status = "queued"
                db.commit()
                enqueued = True
        except Exception as e:
            print(f"Warning: Failed to enqueue job to Redis queue: {e}")

    if not enqueued:
        print(f"[Scan {scan_id}] Executing scan via FastAPI BackgroundTasks fallback")
        db_scan.status = "pending"
        db.commit()
        background_tasks.add_task(run_scan_job, scan_id, request.username, token)

    # Reload from database to populate relationships
    db.refresh(db_scan)
    return db_scan

@app.get("/api/scans", response_model=List[schemas.ScanResponse])
def get_user_scan_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    scans = db.query(models.Scan).filter(models.Scan.user_id == current_user.id).order_by(models.Scan.created_at.desc()).all()
    return scans

@app.get("/api/scan/{scan_id}", response_model=schemas.FullReportResponse)
def get_scan_report(
    scan_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce multi-tenancy: scan must belong to the logged-in user
    db_scan = db.query(models.Scan).filter(
        models.Scan.id == scan_id, 
        models.Scan.user_id == current_user.id
    ).first()
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")
    
    # Safely load the JSON summary if present
    import json
    summary_data = None
    if db_scan.summary:
        try:
            summary_data = json.loads(db_scan.summary)
        except json.JSONDecodeError:
            summary_data = {"error": "Failed to parse AI summary", "raw": db_scan.summary}

    # Return report structure
    return schemas.FullReportResponse(
        scan_id=db_scan.id,
        username=db_scan.username,
        status=db_scan.status,
        overall_score=db_scan.overall_score,
        summary=summary_data,
        repositories=[
            schemas.RepositorySchema(
                name=r.name,
                url=r.url,
                last_commit=r.last_commit,
                default_branch=r.default_branch
            ) for r in db_scan.repositories
        ],
        findings=[
            schemas.FindingSchema(
                repo_name=f.repo_name,
                type=f.type,
                file_path=f.file_path,
                line_number=f.line_number,
                rule_id=f.rule_id,
                severity=f.severity,
                description=f.description,
                verification_status=f.verification_status,
                code_snippet=f.code_snippet
            ) for f in db_scan.findings
        ],
        created_at=db_scan.created_at,
        completed_at=db_scan.completed_at
    )

@app.get("/api/badge/{username}.svg")
@app.get("/api/badge/{username}")
def get_user_health_badge(username: str, db: Session = Depends(get_db)):
    from sqlalchemy import func
    db.expire_all()
    scans = db.query(models.Scan).filter(
        func.lower(models.Scan.username) == username.lower(),
        models.Scan.status == "completed"
    ).all()

    scan = None
    if scans:
        scan = scans[-1]

    score = scan.overall_score if (scan and scan.overall_score is not None) else "N/A"
    
    if score == "N/A":
        color = "#6e7681"
        score_str = "N/A"
    elif score >= 90:
        color = "#238636"
        score_str = f"{score}%"
    elif score >= 70:
        color = "#d29922"
        score_str = f"{score}%"
    else:
        color = "#da3633"
        score_str = f"{score}%"

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="180" height="20" role="img" aria-label="Profile Health: {score_str}">
  <title>Profile Health: {score_str}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="180" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="110" height="20" fill="#161b22"/>
    <rect x="110" width="70" height="20" fill="{color}"/>
    <rect width="180" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="560" y="140" transform="scale(.1)" fill="#010101" fill-opacity=".3">Profile Health</text>
    <text x="560" y="130" transform="scale(.1)" fill="#fff">Profile Health</text>
    <text x="1440" y="140" transform="scale(.1)" fill="#010101" fill-opacity=".3">{score_str}</text>
    <text x="1440" y="130" transform="scale(.1)" fill="#fff">{score_str}</text>
  </g>
</svg>"""

    return Response(content=svg_content, media_type="image/svg+xml")

@app.get("/api/scan/{scan_id}/export")
def export_scan_report(
    scan_id: str,
    format: str = "markdown",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_scan = db.query(models.Scan).filter(
        models.Scan.id == scan_id,
        models.Scan.user_id == current_user.id
    ).first()
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")

    if format.lower() == "json":
        report_data = get_scan_report(scan_id, db, current_user)
        import json
        dump_func = getattr(report_data, "model_dump", None) or getattr(report_data, "dict")
        return Response(
            content=json.dumps(dump_func(), indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=audit-report-{db_scan.username}-{scan_id[:8]}.json"}
        )

    import json
    summary_data = {}
    if db_scan.summary:
        try:
            summary_data = json.loads(db_scan.summary)
        except Exception:
            pass

    md_lines = [
        f"# Executive Audit Report — @{db_scan.username}",
        f"**Scan ID:** `{db_scan.id}`  ",
        f"**Audit Date:** {db_scan.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if db_scan.created_at else 'N/A'}  ",
        f"**Overall Profile Health Score:** `{db_scan.overall_score}/100`  \n",
        "---",
        "## Executive Summary",
        summary_data.get("summary", "Audit completed successfully."),
        "\n### AI Recommendations & Top Priorities",
    ]
    for issue in summary_data.get("top_issues", []):
        md_lines.append(f"- **[{issue.get('severity', 'HIGH').upper()}] {issue.get('issue')}**: {issue.get('justification')}")

    md_lines.append("\n---\n## Audited Repositories")
    for r in db_scan.repositories:
        md_lines.append(f"- **[{r.name}]({r.url})** (Branch: `{r.default_branch}`) - Last Commit: `{r.last_commit}`")

    md_lines.append("\n---\n## Discovered Findings")
    if not db_scan.findings:
        md_lines.append("No security, structural, or code quality issues found.")
    else:
        for f in db_scan.findings:
            md_lines.append(f"### `{f.repo_name}` — `{f.file_path}`")
            md_lines.append(f"- **Type:** {f.type} | **Severity:** {f.severity.upper()} | **Rule:** `{f.rule_id}`")
            if f.line_number:
                md_lines.append(f"- **Line Number:** {f.line_number}")
            md_lines.append(f"- **Description:** {f.description}")
            if f.code_snippet:
                md_lines.append("```")
                md_lines.append(f.code_snippet)
                md_lines.append("```")
            md_lines.append("")

    md_content = "\n".join(md_lines)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=audit-report-{db_scan.username}-{scan_id[:8]}.md"}
    )

@app.post("/api/scan/{scan_id}/generate-readme")
def generate_ai_profile_readme(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    scan = db.query(models.Scan).filter(
        models.Scan.id == scan_id,
        models.Scan.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")

    username = scan.username
    score = scan.overall_score
    repos = scan.repositories
    repo_names = [r.name for r in repos]

    badge_url = f"http://localhost:8000/api/badge/{username}.svg"

    from datetime import datetime
    readme_content = f"""# 👋 Hi, I'm @{username}

[![Profile Health Shield]({badge_url})](https://github.com/{username})
![GitHub followers](https://img.shields.io/github/followers/{username}?style=for-the-badge&color=10B981&logo=github)
![GitHub stars](https://img.shields.io/github/stars/{username}?style=for-the-badge&color=06B6D4&logo=github)

---

## ⚡ Developer Bio & Security Status
- 🔭 **Focus**: Building scalable, secure, and production-grade software applications.
- 🛡️ **Verified Health Score**: **`{score} / 100`** (Audited with 0 secret retention).
- 💬 **Core Priorities**: Systems Architecture, Static Security Analysis, & High-Performance Engineering.

---

## 🛠️ Tech Stack & Verified Architecture

```javascript
const developer = {{
  username: "{username}",
  healthScore: "{score}/100",
  auditedRepos: {json.dumps(repo_names[:6])},
  status: "Verified Recruiter-Ready Profile"
}};
```

---

## 📦 Audited Repositories Overview

"""
    for r in repos[:5]:
        readme_content += f"""### 🔹 [{r.name}]({r.url})
> Active on branch `{r.default_branch}` • Last commit: `{r.last_commit}`

"""

    readme_content += f"""---

## 🛡️ Profile Security Verification
- 🔒 **Secrets Status**: 100% In-Memory Redaction Verified (Zero Leaked Credentials Saved)
- ⚡ **Audited via**: [GitHub Profile Health Auditor](https://github.com/{username})

*AI-Generated Profile README — Last Synthesized {datetime.utcnow().strftime('%B %d, %Y')}*
"""

    return {"username": username, "score": score, "readme_markdown": readme_content}

@app.post("/api/fix")
def generate_fix_patch(
    request: schemas.FixRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Verify scan exists and belongs to current user
    scan = db.query(models.Scan).filter(
        models.Scan.id == request.scan_id,
        models.Scan.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")
        
    # 2. Check if a corresponding finding exists
    finding = db.query(models.Finding).filter(
        models.Finding.scan_id == request.scan_id,
        models.Finding.repo_name == request.repo_name,
        models.Finding.rule_id == request.rule_id
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Corresponding finding not found for this repository")

    # 3. Generate content based on the rule ID
    file_path = finding.file_path
    file_content = ""
    
    if request.rule_id == "missing-license":
        file_path = "LICENSE"
        file_content = """MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""
    elif request.rule_id == "missing-gitignore":
        file_path = ".gitignore"
        file_content = """# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*

# Dependency directories
node_modules/

# Production builds
dist/
build/

# Python compiled bytecode
__pycache__/
*.pyc

# Environment files
.env
.env.local
.env.production
"""
    elif request.rule_id == "missing-readme":
        file_path = "README.md"
        file_content = f"""# {request.repo_name}

A public repository by {scan.username}.

## Overview
This project was automatically audited and is missing a description. Update this README to detail project features and usage.

## Installation
```bash
npm install
# or
pip install -r requirements.txt
```

## License
MIT License. See LICENSE for details.
"""
    elif request.rule_id == "leaked-env":
        file_path = ".gitignore"
        file_content = "\n# Ignore committed environment credentials\n.env\n.env.*\n*.env\n"
    elif request.rule_id == "leaked-node-modules":
        file_path = ".gitignore"
        file_content = "\n# Ignore node_modules directory\nnode_modules/\n"
    elif request.rule_id == "leaked-pycache":
        file_path = ".gitignore"
        file_content = "\n# Ignore Python byte code\n__pycache__/\n*.pyc\n"
    else:
        raise HTTPException(status_code=400, detail="Auto-fix not supported for this finding category")

    # 4. Format unified diff
    lines = file_content.splitlines()
    num_lines = len(lines)
    
    patch = []
    patch.append(f"diff --git a/{file_path} b/{file_path}")
    patch.append("new file mode 100644")
    patch.append("index 0000000..0000000")
    patch.append("--- /dev/null")
    patch.append(f"+++ b/{file_path}")
    patch.append(f"@@ -0,0 +1,{num_lines} @@")
    for line in lines:
         patch.append(f"+{line}")
    patch.append("") # Trailing newline
    
    patch_text = "\n".join(patch)
    
    return Response(
        content=patch_text,
        media_type="text/x-diff",
        headers={
            "Content-Disposition": f"attachment; filename={request.repo_name}-{request.rule_id}-fix.patch"
        }
    )

@app.get("/api/scan/{scan_id}/copilot-chat", response_model=List[schemas.CopilotMessageSchema])
def get_copilot_chat_history(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    scan = db.query(models.Scan).filter(
        models.Scan.id == scan_id,
        models.Scan.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")

    messages = db.query(models.CopilotMessage).filter(
        models.CopilotMessage.scan_id == scan_id,
        models.CopilotMessage.user_id == current_user.id
    ).order_by(models.CopilotMessage.id.asc()).all()

    return messages

@app.post("/api/scan/{scan_id}/copilot-chat", response_model=List[schemas.CopilotMessageSchema])
async def post_copilot_chat(
    scan_id: str,
    payload: schemas.CopilotChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    scan = db.query(models.Scan).filter(
        models.Scan.id == scan_id,
        models.Scan.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")

    user_msg_text = payload.message.strip()
    if not user_msg_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_msg = models.CopilotMessage(
        scan_id=scan_id,
        user_id=current_user.id,
        role="user",
        content=user_msg_text,
        created_at=datetime.now(timezone.utc)
    )
    db.add(user_msg)
    db.commit()

    findings_summary = [f"{f.type.upper()}: {f.repo_name} -> {f.description} ({f.severity})" for f in scan.findings[:8]]
    findings_text = "\n".join(findings_summary) if findings_summary else "No severe security leaks found."

    prompt = f"""You are the Security Copilot AI assistant for GitHub Profile Health Auditor.
Target Profile: @{scan.username}
Profile Health Score: {scan.overall_score}/100
Key Audit Findings:
{findings_text}

User Question: {user_msg_text}

Provide a concise, expert, and actionable answer. Explain any security risks or git purge steps clearly with code snippets if applicable.
"""

    groq_token = os.getenv("GROQ_API_TOKEN")
    hf_token = os.getenv("HF_API_TOKEN")
    reply_text = ""

    if groq_token and not groq_token.startswith("dummy"):
        try:
            from scanners.ai_synthesizer import call_groq_api
            reply_text = await call_groq_api(prompt, groq_token)
        except Exception as e:
            print("Copilot Groq LLM call failed:", e)

    if not reply_text and hf_token and not hf_token.startswith("dummy"):
        try:
            from scanners.ai_synthesizer import call_hf_api
            reply_text = await call_hf_api(prompt, hf_token)
        except Exception as e:
            print("Copilot HF LLM call failed:", e)

    if not reply_text or len(reply_text.strip()) < 5:
        lowered = user_msg_text.lower()
        if "secret" in lowered or "key" in lowered or "aws" in lowered or "purge" in lowered:
            reply_text = f"To completely remove a leaked secret or key from git commit history in **@{scan.username}**, use `git-filter-repo`:\n\n```bash\n# 1. Revoke the key immediately on your provider dashboard\n# 2. Purge file from history\ngit filter-repo --invert-paths --path <file_path>\n# 3. Force push clean history\ngit push origin main --force\n```"
        elif "score" in lowered or "raise" in lowered or "improve" in lowered:
            reply_text = f"To raise @{scan.username}'s Profile Health score from **{scan.overall_score}/100**:\n1. Add missing LICENSE files across repositories.\n2. Ensure root `.gitignore` ignores `node_modules/` and `.env`.\n3. Add concise `README.md` overviews to empty repositories."
        else:
            reply_text = f"Regarding @{scan.username}'s profile audit (Score: **{scan.overall_score}/100**): All findings have been scanned in memory with 0 credentials stored. You can download 1-Click `.patch` fixes from the Repo Breakdown tab or generate an AI README.md profile template."

    assistant_msg = models.CopilotMessage(
        scan_id=scan_id,
        user_id=current_user.id,
        role="assistant",
        content=reply_text,
        created_at=datetime.now(timezone.utc)
    )
    db.add(assistant_msg)
    db.commit()

    messages = db.query(models.CopilotMessage).filter(
        models.CopilotMessage.scan_id == scan_id,
        models.CopilotMessage.user_id == current_user.id
    ).order_by(models.CopilotMessage.id.asc()).all()

    return messages

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
