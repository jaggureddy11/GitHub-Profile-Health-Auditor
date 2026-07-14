import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load env variables from parent folder .env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
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
    description="Backend API for scanning public GitHub profiles for security and quality issues.",
    version="1.0.0"
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
    print(f"Warning: Failed to connect to Redis at {REDIS_URL}. Queue functionality will be disabled. Error: {e}")
    scan_queue = None

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Service is healthy"}

@app.post("/api/scan", response_model=schemas.FullReportResponse)
async def start_scan(request: schemas.ScanRequest, db: Session = Depends(get_db)):
    # 1. Resolve token (prefer request payload, fall back to env var)
    token = request.github_token or os.getenv("GITHUB_TOKEN")
    
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

    # 3. Create scan record
    scan_id = str(uuid.uuid4())
    db_scan = models.Scan(
        id=scan_id,
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

    # 5. Queue background scan job (if Redis queue is active)
    if scan_queue:
        try:
            # We will implement run_scan_job in scanners/orchestrator.py
            scan_queue.enqueue(
                "scanners.orchestrator.run_scan_job",
                scan_id=scan_id,
                username=request.username,
                token=token
            )
            # Update status to queued
            db_scan.status = "queued"
            db.commit()
        except Exception as e:
            # If queueing fails, log and keep status as pending
            print(f"Error queueing scan job: {e}")

    # Reload from database to populate relationships
    db.refresh(db_scan)
    return db_scan

@app.get("/api/scan/{scan_id}", response_model=schemas.FullReportResponse)
def get_scan_report(scan_id: str, db: Session = Depends(get_db)):
    db_scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
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
                verification_status=f.verification_status
            ) for f in db_scan.findings
        ],
        created_at=db_scan.created_at,
        completed_at=db_scan.completed_at
    )

@app.post("/api/fix")
def generate_fix_patch(request: schemas.FixRequest, db: Session = Depends(get_db)):
    # 1. Verify scan exists
    scan = db.query(models.Scan).filter(models.Scan.id == request.scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
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
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
.tsbuildinfo

# Output directory for production build
dist/
build/

# Python compiled bytecode
__pycache__/
*.pyc
*.pyo
*.pyd

# Environment files
.env
.env.local
.env.development
.env.test
.env.production
"""
    elif request.rule_id == "missing-readme":
        file_path = "README.md"
        file_content = f"""# {request.repo_name}

A public repository by {scan.username}.

## Description
This project was automatically audited and is missing a description. Update this README to describe the features and architecture of your application.

## Installation
```bash
npm install
# or
pip install -r requirements.txt
```

## License
MIT License. See LICENSE for details.
"""
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

