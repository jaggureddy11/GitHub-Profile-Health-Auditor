import os
# Fix macOS Python 3.13 fork crash (SIGABRT on child side of fork pre-exec)
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

import uuid
import bcrypt
import jwt
import httpx
import time
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from dotenv import load_dotenv

# Load env variables from parent folder .env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Response, Cookie, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import or_
from sqlalchemy.orm import Session
import redis
from rq import Queue

from database import engine, Base, get_db
import models
import schemas
from scanners.github_client import list_public_repositories, get_user_quickstats, get_user_repositories, get_single_repository, GitHubRateLimitError, GitHubAPIError
from scanners.orchestrator import run_scan_job, run_single_repo_scan_job

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migration for new session_id columns & nullable user_id in SQLite
try:
    with engine.connect() as conn:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "scans" in inspector.get_table_names():
            columns = inspector.get_columns("scans")
            user_id_col = next((c for c in columns if c["name"] == "user_id"), None)
            session_id_col = next((c for c in columns if c["name"] == "session_id"), None)
            
            if not session_id_col:
                conn.execute(text("ALTER TABLE scans ADD COLUMN session_id VARCHAR"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_scans_session_id ON scans (session_id)"))
                conn.commit()

            col_names = [c["name"] for c in columns]
            if "parent_scan_id" not in col_names:
                conn.execute(text("ALTER TABLE scans ADD COLUMN parent_scan_id VARCHAR"))
            if "scan_type" not in col_names:
                conn.execute(text("ALTER TABLE scans ADD COLUMN scan_type VARCHAR DEFAULT 'group'"))
            if "repo_name" not in col_names:
                conn.execute(text("ALTER TABLE scans ADD COLUMN repo_name VARCHAR"))
            if "repo_url" not in col_names:
                conn.execute(text("ALTER TABLE scans ADD COLUMN repo_url VARCHAR"))
            if "error_message" not in col_names:
                conn.execute(text("ALTER TABLE scans ADD COLUMN error_message VARCHAR"))
            conn.commit()

            if user_id_col and not user_id_col.get("nullable", True):
                conn.execute(text("PRAGMA foreign_keys=OFF;"))
                conn.execute(text("""
                    CREATE TABLE scans_new (
                        id VARCHAR NOT NULL PRIMARY KEY,
                        user_id VARCHAR,
                        session_id VARCHAR,
                        username VARCHAR NOT NULL,
                        status VARCHAR NOT NULL,
                        overall_score INTEGER,
                        summary VARCHAR,
                        created_at DATETIME NOT NULL,
                        completed_at DATETIME,
                        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                    );
                """))
                conn.execute(text("""
                    INSERT INTO scans_new (id, user_id, session_id, username, status, overall_score, summary, created_at, completed_at)
                    SELECT id, user_id, session_id, username, status, overall_score, summary, created_at, completed_at FROM scans;
                """))
                conn.execute(text("DROP TABLE scans;"))
                conn.execute(text("ALTER TABLE scans_new RENAME TO scans;"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_scans_id ON scans (id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_scans_username ON scans (username);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_scans_session_id ON scans (session_id);"))
                conn.execute(text("PRAGMA foreign_keys=ON;"))
                conn.commit()

        if "copilot_messages" in inspector.get_table_names():
            columns = inspector.get_columns("copilot_messages")
            session_id_col = next((c for c in columns if c["name"] == "session_id"), None)
            if not session_id_col:
                conn.execute(text("ALTER TABLE copilot_messages ADD COLUMN session_id VARCHAR"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_copilot_messages_session_id ON copilot_messages (session_id)"))
                conn.commit()
except Exception as e:
    print(f"Database migration notice: {e}")

app = FastAPI(
    title="GitHub Profile Health Auditor API",
    description="SaaS Backend API for scanning public GitHub profiles for security and quality issues.",
    version="2.0.0"
)

# CORS middleware config
raw_origins = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", ""))
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

default_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
]
for default_origin in default_origins:
    if default_origin not in allowed_origins:
        allowed_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*",
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
JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET:
    if os.getenv("ENVIRONMENT", "development").lower() in ("prod", "production"):
        raise RuntimeError("CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be explicitly set in production!")
    JWT_SECRET = "dev-only-secret-key-change-in-production-12345"

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

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_optional_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            return db.query(models.User).filter(models.User.id == user_id).first()
    except Exception:
        pass
    return None

def get_session_id(
    request: Request,
    response: Response,
    scan_session_id: Optional[str] = Cookie(None),
    x_session_id: Optional[str] = Header(None)
) -> str:
    session_id = scan_session_id or x_session_id
    if not session_id:
        session_id = f"sess_{uuid.uuid4().hex}"
        response.set_cookie(
            key="scan_session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
            max_age=86400 * 30
        )
    return session_id

def parse_github_target(raw_input: str) -> tuple[str, Optional[str]]:
    """
    Parses raw input string into (username, target_repo_name).
    Supports:
    - 'octocat' -> ('octocat', None)
    - '@octocat' -> ('octocat', None)
    - 'github.com/octocat' -> ('octocat', None)
    - 'https://github.com/octocat/Hello-World' -> ('octocat', 'Hello-World')
    - 'octocat/Hello-World' -> ('octocat', 'Hello-World')
    """
    if not raw_input:
        return ("", None)
    s = raw_input.strip()
    if "github.com/" in s:
        s = s.split("github.com/")[1]
    s = s.lstrip("@").strip()
    if s.endswith(".git"):
        s = s[:-4]
    
    parts = [p.strip() for p in s.split("/") if p.strip()]
    if not parts:
        return ("", None)
    if len(parts) == 1:
        return (parts[0], None)
    return (parts[0], parts[1])

def verify_scan_access(
    scan_id: str,
    db: Session,
    current_user: Optional[models.User],
    session_id: str
) -> models.Scan:
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")
    
    allowed = False
    if current_user and scan.user_id and scan.user_id == current_user.id:
        allowed = True
    elif scan.session_id and scan.session_id == session_id:
        allowed = True
    
    if not allowed:
        raise HTTPException(status_code=404, detail="Scan not found or access denied")
    
    return scan

import collections
from threading import Lock

class InMemoryRateLimiter:
    def __init__(self):
        self._lock = Lock()
        self._requests = collections.defaultdict(list)

    def is_rate_limited(self, ip: str, max_requests: int, window_seconds: int = 86400) -> tuple[bool, int]:
        now = time.time()
        with self._lock:
            timestamps = self._requests[ip]
            valid_timestamps = [t for t in timestamps if now - t < window_seconds]
            self._requests[ip] = valid_timestamps
            
            if len(valid_timestamps) >= max_requests:
                oldest = valid_timestamps[0]
                retry_after = int(window_seconds - (now - oldest))
                return True, max(1, retry_after)
            
            valid_timestamps.append(now)
            return False, 0

in_memory_limiter = InMemoryRateLimiter()

RATE_LIMIT_SCANS_PER_IP_24H = int(os.getenv("RATE_LIMIT_SCANS_PER_IP_24H", "100"))
RATE_LIMIT_QUICKSTATS_PER_IP_24H = int(os.getenv("RATE_LIMIT_QUICKSTATS_PER_IP_24H", "500"))

import json
_quickstats_memory_cache = {}
_quickstats_cache_lock = Lock()

def get_cached_quickstats(username: str) -> Optional[dict]:
    cache_key = f"quickstats:{username.lower()}"
    if redis_conn:
        try:
            cached_data = redis_conn.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass
    
    with _quickstats_cache_lock:
        if cache_key in _quickstats_memory_cache:
            entry, ts = _quickstats_memory_cache[cache_key]
            if time.time() - ts < 900:  # 15 minutes TTL
                return entry
            else:
                del _quickstats_memory_cache[cache_key]
    return None

def set_cached_quickstats(username: str, data: dict):
    cache_key = f"quickstats:{username.lower()}"
    if redis_conn:
        try:
            redis_conn.set(cache_key, json.dumps(data), ex=900)
            return
        except Exception:
            pass
    
    with _quickstats_cache_lock:
        _quickstats_memory_cache[cache_key] = (data, time.time())

_repos_memory_cache = {}
_repos_cache_lock = Lock()

def get_cached_repos(username: str) -> Optional[dict]:
    cache_key = f"repos_list:{username.lower()}"
    if redis_conn:
        try:
            cached_data = redis_conn.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass
    
    with _repos_cache_lock:
        if cache_key in _repos_memory_cache:
            entry, ts = _repos_memory_cache[cache_key]
            if time.time() - ts < 900:  # 15 minutes TTL
                return entry
            else:
                del _repos_memory_cache[cache_key]
    return None

def set_cached_repos(username: str, data: dict):
    cache_key = f"repos_list:{username.lower()}"
    if redis_conn:
        try:
            redis_conn.set(cache_key, json.dumps(data), ex=900)
            return
        except Exception:
            pass
    
    with _repos_cache_lock:
        _repos_memory_cache[cache_key] = (data, time.time())

def check_quickstats_ip_rate_limit(request: Request):
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "127.0.0.1"

    max_reqs = RATE_LIMIT_QUICKSTATS_PER_IP_24H
    window_secs = 86400

    redis_used = False
    if redis_conn:
        try:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            rate_limit_key = f"rate_limit:quickstats:ip:{client_ip}:{today_str}"
            current_count = redis_conn.get(rate_limit_key)
            if current_count:
                count = int(current_count)
                if count >= max_reqs:
                    raise HTTPException(
                        status_code=429,
                        detail=f"Per-IP quickstats rate limit reached ({max_reqs} requests / 24h). Please try again later."
                    )
                redis_conn.incr(rate_limit_key)
            else:
                redis_conn.set(rate_limit_key, 1, ex=window_secs)
            redis_used = True
        except HTTPException:
            raise
        except Exception:
            redis_used = False

    if not redis_used:
        is_limited, _ = in_memory_limiter.is_rate_limited(f"quickstats:{client_ip}", max_requests=max_reqs, window_seconds=window_secs)
        if is_limited:
            raise HTTPException(
                status_code=429,
                detail=f"Per-IP quickstats rate limit reached ({max_reqs} requests / 24h). Please try again later."
            )

def check_ip_rate_limit(request: Request, scan_req: Optional[schemas.ScanRequest] = None):
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "127.0.0.1"

    max_scans = RATE_LIMIT_SCANS_PER_IP_24H
    window_secs = 86400

    redis_used = False
    if redis_conn:
        try:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            rate_limit_key = f"rate_limit:ip:{client_ip}:{today_str}"
            current_count = redis_conn.get(rate_limit_key)
            if current_count:
                count = int(current_count)
                if count >= max_scans:
                    raise HTTPException(
                        status_code=429,
                        detail=f"Per-IP scan rate limit reached ({max_scans} scans / 24h). Please try again later."
                    )
                redis_conn.incr(rate_limit_key)
            else:
                redis_conn.set(rate_limit_key, 1, ex=window_secs)
            redis_used = True
        except HTTPException:
            raise
        except Exception as e:
            print(f"[RateLimiter] Redis connection error ({e}), falling back to in-memory limiter.")
            redis_used = False

    if not redis_used:
        is_limited, _ = in_memory_limiter.is_rate_limited(client_ip, max_requests=max_scans, window_seconds=window_secs)
        if is_limited:
            raise HTTPException(
                status_code=429,
                detail=f"Per-IP scan rate limit reached ({max_scans} scans / 24h). Please try again later."
            )

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
    enable_demo = os.getenv("ENABLE_DEMO_LOGIN", "false").lower() in ("true", "1", "yes")
    env = os.getenv("ENVIRONMENT", "production").lower()
    if not enable_demo or env not in ("dev", "development"):
        raise HTTPException(
            status_code=403,
            detail="Demo login endpoint is disabled in this environment for security. Use standard login or GitHub OAuth."
        )

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
@app.get("/api/profile/{username:path}/quickstats", response_model=schemas.QuickStatsResponse)
async def get_profile_quickstats(
    username: str,
    request: Request,
    github_token: Optional[str] = None
):
    """
    Lightweight, fast endpoint (<2s) returning GitHub profile statistics (avatar, bio, followers, stars, top languages).
    Does NOT clone repos, run static analysis (TruffleHog/Semgrep), or call AI synthesis.
    """
    clean_username, target_repo = parse_github_target(username)

    if not clean_username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    # 1. Check 15-minute cache
    cached = get_cached_quickstats(clean_username)
    if cached:
        return cached

    # 2. Check independent per-IP quickstats rate limit
    check_quickstats_ip_rate_limit(request)

    token_to_use = github_token or os.getenv("GITHUB_TOKEN")
    try:
        stats = await get_user_quickstats(clean_username, token=token_to_use)
        # Store in 15-minute cache
        set_cached_quickstats(clean_username, stats)
        return stats
    except GitHubAPIError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except GitHubRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quickstats: {str(e)}")

@app.get("/api/profile/{username:path}/repos", response_model=schemas.RepoListResponse)
async def get_profile_repositories(
    username: str,
    request: Request,
    github_token: Optional[str] = None
):
    """
    Lightweight, fast endpoint (<2s) returning GitHub repositories list with metadata (stars, forks, language).
    Does NOT clone repos, run static analysis (TruffleHog/Semgrep), or call AI synthesis.
    """
    clean_username, target_repo = parse_github_target(username)

    if not clean_username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    token_to_use = github_token or os.getenv("GITHUB_TOKEN")
    max_repos_cap = int(os.getenv("MAX_REPOS_PER_SCAN", "10"))

    # If a specific repository link was entered (e.g. torvalds/linux), return target repo AND remaining repos
    if target_repo:
        try:
            single_repo = await get_single_repository(clean_username, target_repo, token=token_to_use)
            if single_repo:
                single_repo["is_target_repo"] = True
                all_repos_data = await get_user_repositories(clean_username, token=token_to_use, max_repos=max_repos_cap)
                all_repos = all_repos_data.get("repositories", [])
                other_repos = [r for r in all_repos if r.get("name", "").lower() != target_repo.lower()]
                return {
                    "username": clean_username,
                    "total_repos": len(all_repos) or 1,
                    "capped": False,
                    "target_repo_name": target_repo,
                    "repositories": [single_repo],
                    "other_repositories": other_repos
                }
        except Exception:
            pass

    # 1. Check 15-minute cache
    cached = get_cached_repos(clean_username)
    if cached:
        return cached

    # 2. Check per-IP rate limit
    check_quickstats_ip_rate_limit(request)

    try:
        repos_data = await get_user_repositories(clean_username, token=token_to_use, max_repos=max_repos_cap)
        set_cached_repos(clean_username, repos_data)
        return repos_data
    except GitHubAPIError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except GitHubRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")

@app.post("/api/repo-scan", response_model=schemas.FullReportResponse)
async def start_single_repo_scan(
    request: schemas.RepoScanRequest,
    req_obj: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    if request.website_url and request.website_url.strip():
        raise HTTPException(status_code=400, detail="Automated bot submission rejected via honeypot.")

    # Apply per-IP rate limit for single-repo scans
    check_ip_rate_limit(req_obj, scan_req=request)

    token = request.github_token or (current_user.github_oauth_token if current_user else None) or os.getenv("GITHUB_TOKEN")
    repo_url = request.repo_url or f"https://github.com/{request.username}/{request.repo_name}"

    scan_id = str(uuid.uuid4())
    db_scan = models.Scan(
        id=scan_id,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        username=request.username,
        parent_scan_id=request.parent_scan_id,
        scan_type="single_repo",
        repo_name=request.repo_name,
        repo_url=repo_url,
        status="queued",
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_scan)
    db.commit()

    db_repo = models.Repository(
        scan_id=scan_id,
        name=request.repo_name,
        url=repo_url,
        default_branch="main"
    )
    db.add(db_repo)
    db.commit()

    enqueued = False
    if scan_queue:
        try:
            from rq import Worker
            workers = Worker.all(connection=scan_queue.connection)
            if workers:
                scan_queue.enqueue(
                    "scanners.orchestrator.run_single_repo_scan_job",
                    scan_id=scan_id,
                    username=request.username,
                    repo_name=request.repo_name,
                    repo_url=repo_url,
                    token=token
                )
                enqueued = True
        except Exception as e:
            print(f"Warning: Failed to enqueue repo scan job to Redis queue: {e}")

    if not enqueued:
        background_tasks.add_task(run_single_repo_scan_job, scan_id, request.username, request.repo_name, repo_url, token)

    db.refresh(db_scan)
    return schemas.FullReportResponse(
        scan_id=db_scan.id,
        username=db_scan.username,
        status=db_scan.status,
        is_partial=False,
        repositories=[schemas.RepositorySchema(name=request.repo_name, url=repo_url, default_branch="main")],
        findings=[],
        created_at=db_scan.created_at
    )

@app.post("/api/scan", response_model=schemas.FullReportResponse)
async def start_scan(
    request: schemas.ScanRequest,
    req_obj: Request,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    if request.website_url and request.website_url.strip():
        raise HTTPException(status_code=400, detail="Automated bot submission rejected via honeypot.")

    check_ip_rate_limit(req_obj, scan_req=request)
    token = request.github_token or (current_user.github_oauth_token if current_user else None) or os.getenv("GITHUB_TOKEN")
    
    clean_username, target_repo = parse_github_target(request.username)

    # 1. List public repositories
    try:
        if target_repo:
            single_repo = await get_single_repository(clean_username, target_repo, token=token)
            if single_repo:
                repos = [single_repo]
            else:
                all_repos = await list_public_repositories(clean_username, token=token)
                repos = [r for r in all_repos if r["name"].lower() == target_repo.lower()] or all_repos[:1]
        else:
            repos = await list_public_repositories(clean_username, token=token)
    except GitHubRateLimitError as e:
        raise HTTPException(status_code=403, detail=f"GitHub API rate limit exceeded: {str(e)}")
    except GitHubAPIError as e:
        raise HTTPException(status_code=400, detail=f"GitHub API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    # 2. Create parent group scan record
    parent_scan_id = str(uuid.uuid4())
    parent_scan = models.Scan(
        id=parent_scan_id,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        username=clean_username,
        scan_type="group",
        status="running",
        created_at=datetime.now(timezone.utc)
    )
    db.add(parent_scan)
    db.commit()

    # 3. Create repositories and child scans for each repo
    db_repos = []
    child_scan_ids = []

    for r in repos:
        db_repo = models.Repository(
            scan_id=parent_scan_id,
            name=r["name"],
            url=r["url"],
            last_commit=r["last_commit"],
            default_branch=r["default_branch"]
        )
        db.add(db_repo)
        db_repos.append(db_repo)

        child_id = str(uuid.uuid4())
        child_scan = models.Scan(
            id=child_id,
            user_id=current_user.id if current_user else None,
            session_id=session_id,
            username=clean_username,
            parent_scan_id=parent_scan_id,
            scan_type="single_repo",
            repo_name=r["name"],
            repo_url=r["url"],
            status="queued",
            created_at=datetime.now(timezone.utc)
        )
        db.add(child_scan)
        child_scan_ids.append(child_id)

        # Enqueue each repo job independently
        enqueued = False
        if scan_queue:
            try:
                from rq import Worker
                workers = Worker.all(connection=scan_queue.connection)
                if workers:
                    scan_queue.enqueue(
                        "scanners.orchestrator.run_single_repo_scan_job",
                        scan_id=child_id,
                        username=clean_username,
                        repo_name=r["name"],
                        repo_url=r["url"],
                        token=token
                    )
                    enqueued = True
            except Exception as e:
                print(f"Warning: Failed to enqueue child scan to Redis queue: {e}")

        if not enqueued:
            background_tasks.add_task(run_single_repo_scan_job, child_id, clean_username, r["name"], r["url"], token)

    db.commit()
    db.refresh(parent_scan)

    progress = schemas.GroupProgress(
        total_repos=len(repos),
        queued_count=len(repos),
        running_count=0,
        completed_count=0,
        failed_count=0,
        timed_out_count=0
    )

    return schemas.FullReportResponse(
        scan_id=parent_scan.id,
        username=parent_scan.username,
        status="running",
        is_partial=True,
        repositories=[
            schemas.RepositorySchema(
                name=r.name,
                url=r.url,
                last_commit=r.last_commit,
                default_branch=r.default_branch
            ) for r in db_repos
        ],
        findings=[],
        group_progress=progress,
        child_scan_ids=child_scan_ids,
        created_at=parent_scan.created_at
    )

@app.get("/api/scans", response_model=List[schemas.ScanResponse])
def get_user_scan_history(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    if current_user:
        scans = db.query(models.Scan).filter(
            models.Scan.user_id == current_user.id
        ).order_by(models.Scan.created_at.desc()).all()
    else:
        scans = db.query(models.Scan).filter(
            models.Scan.session_id == session_id
        ).order_by(models.Scan.created_at.desc()).all()
    return scans

@app.get("/api/scan/{scan_id}", response_model=schemas.FullReportResponse)
def get_scan_report(
    scan_id: str, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    db_scan = verify_scan_access(scan_id, db, current_user, session_id)
    
    group_progress = None
    is_partial = False
    all_findings = []
    all_repos = list(db_scan.repositories)

    if db_scan.scan_type == "group":
        child_scans = db.query(models.Scan).filter(models.Scan.parent_scan_id == db_scan.id).all()
        total_count = len(child_scans)
        queued_c = sum(1 for c in child_scans if c.status == "queued")
        running_c = sum(1 for c in child_scans if c.status == "running")
        completed_c = sum(1 for c in child_scans if c.status == "completed")
        failed_c = sum(1 for c in child_scans if c.status == "failed")
        timed_out_c = sum(1 for c in child_scans if c.status == "timed_out")

        group_progress = schemas.GroupProgress(
            total_repos=total_count,
            queued_count=queued_c,
            running_count=running_c,
            completed_count=completed_c,
            failed_count=failed_c,
            timed_out_count=timed_out_c
        )

        all_findings = list(db_scan.findings)
        finished_c = completed_c + failed_c + timed_out_c

        if total_count > 0 and finished_c < total_count:
            is_partial = True
            if not db_scan.overall_score:
                partial_score = max(0, 100 - (len(all_findings) * 5))
                summary_data = {
                    "is_partial": True,
                    "scanned_repos": finished_c,
                    "total_repos": total_count,
                    "findings_count": len(all_findings),
                    "summary_text": f"Scanned {finished_c} of {total_count} repositories. Audit in progress..."
                }
                return schemas.FullReportResponse(
                    scan_id=db_scan.id,
                    username=db_scan.username,
                    status="running",
                    is_partial=True,
                    overall_score=partial_score,
                    summary=summary_data,
                    repositories=[
                        schemas.RepositorySchema(
                            name=r.name, url=r.url, last_commit=r.last_commit, default_branch=r.default_branch
                        ) for r in all_repos
                    ],
                    findings=[
                        schemas.FindingSchema(
                            repo_name=f.repo_name, type=f.type, file_path=f.file_path, line_number=f.line_number,
                            rule_id=f.rule_id, severity=f.severity, description=f.description,
                            verification_status=f.verification_status, code_snippet=f.code_snippet
                        ) for f in all_findings
                    ],
                    group_progress=group_progress,
                    child_scan_ids=[c.id for c in child_scans],
                    created_at=db_scan.created_at
                )
    else:
        all_findings = list(db_scan.findings)

    import json
    summary_data = None
    if db_scan.summary:
        try:
            summary_data = json.loads(db_scan.summary)
        except json.JSONDecodeError:
            summary_data = {"error": "Failed to parse AI summary", "raw": db_scan.summary}

    child_scan_ids = []
    if db_scan.scan_type == "group":
        child_scans = db.query(models.Scan).filter(models.Scan.parent_scan_id == db_scan.id).all()
        child_scan_ids = [c.id for c in child_scans]

    return schemas.FullReportResponse(
        scan_id=db_scan.id,
        username=db_scan.username,
        status=db_scan.status,
        is_partial=is_partial,
        overall_score=db_scan.overall_score,
        summary=summary_data,
        repositories=[
            schemas.RepositorySchema(
                name=r.name,
                url=r.url,
                last_commit=r.last_commit,
                default_branch=r.default_branch
            ) for r in all_repos
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
            ) for f in all_findings
        ],
        group_progress=group_progress,
        child_scan_ids=child_scan_ids,
        created_at=db_scan.created_at,
        completed_at=db_scan.completed_at
    )

@app.post("/api/badge/challenge", response_model=schemas.BadgeChallengeResponse)
def create_badge_challenge(payload: schemas.BadgeChallengeRequest, db: Session = Depends(get_db)):
    username = payload.username.strip().lstrip("@")
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    token = f"health-auditor-verify-{uuid.uuid4().hex[:16]}"
    
    # Store server-issued challenge record in DB
    challenge = models.BadgeChallenge(
        username=username,
        verification_token=token,
        created_at=datetime.now(timezone.utc),
        is_used=False
    )
    db.add(challenge)
    db.commit()

    instructions = f"Add the verification token '{token}' to your GitHub bio or a public Gist, then click 'Verify Badge'."
    return schemas.BadgeChallengeResponse(
        username=username,
        verification_token=token,
        instructions=instructions
    )

@app.post("/api/badge/verify", response_model=schemas.BadgeVerifyResponse)
async def verify_and_activate_badge(
    payload: schemas.BadgeVerifyRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    username = payload.username.strip().lstrip("@")
    method = payload.method.lower()

    if method == "oauth":
        if not current_user or not current_user.github_username or current_user.github_username.lower() != username.lower():
            raise HTTPException(
                status_code=403,
                detail="GitHub OAuth username mismatch or user not logged in with matching GitHub account."
            )
    else:
        from sqlalchemy import func
        # 1. Lookup server-issued challenge record for this specific username and token
        challenge = db.query(models.BadgeChallenge).filter(
            func.lower(models.BadgeChallenge.username) == username.lower(),
            models.BadgeChallenge.verification_token == payload.verification_token,
            models.BadgeChallenge.is_used == False
        ).first()

        if not challenge:
            raise HTTPException(
                status_code=400,
                detail="Invalid or unissued verification challenge token. Call /api/badge/challenge first to request a server-issued token."
            )

        # 2. Enforce 15-minute server-side expiration
        now = datetime.now(timezone.utc)
        created_at = challenge.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if (now - created_at).total_seconds() > 900: # 15 minutes
            raise HTTPException(
                status_code=400,
                detail="Verification challenge token has expired (tokens expire 15 minutes after issuance). Generate a new challenge and try again."
            )

        # 3. Check bio content via GitHub REST API
        url = f"https://api.github.com/users/{username}"
        headers = {"Accept": "application/vnd.github+json", "User-Agent": "GitHub-Profile-Health-Auditor"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch GitHub profile for @{username}.")
            profile_data = res.json()
            bio = profile_data.get("bio") or ""
            if payload.verification_token not in bio:
                raise HTTPException(
                    status_code=400,
                    detail=f"Verification token '{payload.verification_token}' was not found in @{username}'s GitHub bio."
                )

    from sqlalchemy import func
    scans = db.query(models.Scan).filter(
        func.lower(models.Scan.username) == username.lower(),
        models.Scan.status == "completed"
    ).all()
    if not scans:
        raise HTTPException(
            status_code=404,
            detail=f"No completed scan report found for @{username}. Please run a scan first before publishing a public badge."
        )
    latest_scan = scans[-1]
    score = latest_scan.overall_score if latest_scan.overall_score is not None else 100

    badge = db.query(models.PublicBadge).filter(
        func.lower(models.PublicBadge.username) == username.lower()
    ).first()

    rev_token = badge.revocation_token if badge else uuid.uuid4().hex
    if not badge:
        badge = models.PublicBadge(
            username=username,
            overall_score=score,
            verified_at=datetime.now(timezone.utc),
            verification_method=method,
            verification_token=payload.verification_token,
            revocation_token=rev_token,
            is_active=True
        )
        db.add(badge)
    else:
        badge.overall_score = score
        badge.is_active = True
        badge.verified_at = datetime.now(timezone.utc)
        badge.verification_method = method
        badge.verification_token = payload.verification_token

    if method != "oauth" and challenge:
        challenge.is_used = True

    db.commit()
    db.refresh(badge)

    badge_url = f"/api/badge/{username}.svg"
    return schemas.BadgeVerifyResponse(
        username=badge.username,
        overall_score=badge.overall_score,
        revocation_token=badge.revocation_token,
        badge_svg_url=badge_url,
        is_active=badge.is_active
    )

@app.post("/api/badge/{username}/deactivate")
def deactivate_public_badge(
    username: str,
    revocation_token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    from sqlalchemy import func
    badge = db.query(models.PublicBadge).filter(
        func.lower(models.PublicBadge.username) == username.lower()
    ).first()
    if not badge or not badge.is_active:
        raise HTTPException(status_code=404, detail="Active public badge not found for this username.")

    allowed = False
    if revocation_token and revocation_token == badge.revocation_token:
        allowed = True
    elif current_user and current_user.github_username and current_user.github_username.lower() == username.lower():
        allowed = True

    if not allowed:
        raise HTTPException(status_code=403, detail="Invalid revocation token or unauthorized owner.")

    badge.is_active = False
    db.commit()
    return {"status": "ok", "message": f"Public badge for @{username} has been deactivated."}

@app.get("/api/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_public_leaderboard(db: Session = Depends(get_db)):
    badges = db.query(models.PublicBadge).filter(
        models.PublicBadge.is_active == True
    ).order_by(models.PublicBadge.overall_score.desc(), models.PublicBadge.verified_at.desc()).all()

    entries = []
    for b in badges:
        entries.append(schemas.LeaderboardEntry(
            username=b.username,
            overall_score=b.overall_score,
            verified_at=b.verified_at,
            badge_svg_url=f"/api/badge/{b.username}.svg"
        ))
    return entries

@app.get("/api/badge/{username}.svg")
@app.get("/api/badge/{username}")
def get_user_health_badge(username: str, db: Session = Depends(get_db)):
    if username.endswith(".svg"):
        username = username[:-4]
    from sqlalchemy import func
    db.expire_all()
    badge = db.query(models.PublicBadge).filter(
        func.lower(models.PublicBadge.username) == username.lower(),
        models.PublicBadge.is_active == True
    ).first()

    if not badge:
        color = "#6e7681"
        score_str = "Unverified"
    else:
        score = badge.overall_score
        if score >= 90:
            color = "#238636"
        elif score >= 70:
            color = "#d29922"
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
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    db_scan = verify_scan_access(scan_id, db, current_user, session_id)

    if format.lower() == "json":
        report_data = get_scan_report(scan_id, db, current_user, session_id)
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
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    scan = verify_scan_access(scan_id, db, current_user, session_id)

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
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    # 1. Verify scan exists and belongs to current session/user
    scan = verify_scan_access(request.scan_id, db, current_user, session_id)
        
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
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    scan = verify_scan_access(scan_id, db, current_user, session_id)

    if current_user:
        messages = db.query(models.CopilotMessage).filter(
            models.CopilotMessage.scan_id == scan_id,
            or_(models.CopilotMessage.user_id == current_user.id, models.CopilotMessage.session_id == session_id)
        ).order_by(models.CopilotMessage.id.asc()).all()
    else:
        messages = db.query(models.CopilotMessage).filter(
            models.CopilotMessage.scan_id == scan_id,
            models.CopilotMessage.session_id == session_id
        ).order_by(models.CopilotMessage.id.asc()).all()

    return messages

@app.post("/api/scan/{scan_id}/copilot-chat", response_model=List[schemas.CopilotMessageSchema])
async def post_copilot_chat(
    scan_id: str,
    payload: schemas.CopilotChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    session_id: str = Depends(get_session_id)
):
    scan = verify_scan_access(scan_id, db, current_user, session_id)

    user_msg_text = payload.message.strip()
    if not user_msg_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_msg = models.CopilotMessage(
        scan_id=scan_id,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
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
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        role="assistant",
        content=reply_text,
        created_at=datetime.now(timezone.utc)
    )
    db.add(assistant_msg)
    db.commit()

    if current_user:
        messages = db.query(models.CopilotMessage).filter(
            models.CopilotMessage.scan_id == scan_id,
            or_(models.CopilotMessage.user_id == current_user.id, models.CopilotMessage.session_id == session_id)
        ).order_by(models.CopilotMessage.id.asc()).all()
    else:
        messages = db.query(models.CopilotMessage).filter(
            models.CopilotMessage.scan_id == scan_id,
            models.CopilotMessage.session_id == session_id
        ).order_by(models.CopilotMessage.id.asc()).all()

    return messages

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
