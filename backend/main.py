import os
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
