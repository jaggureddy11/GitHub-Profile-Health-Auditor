from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class ScanRequest(BaseModel):
    username: str
    github_token: Optional[str] = None
    website_url: Optional[str] = None # Honeypot anti-bot field (must remain empty for legitimate users)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        if "@" in v:
            raise ValueError("Username cannot be an email address")
        return v

class RepositorySchema(BaseModel):
    name: str
    url: str
    last_commit: Optional[str] = None
    default_branch: Optional[str] = None

    model_config = {"from_attributes": True}

class FindingSchema(BaseModel):
    repo_name: str
    type: str
    file_path: str
    line_number: Optional[int] = None
    rule_id: Optional[str] = None
    severity: str
    description: str
    verification_status: Optional[str] = None
    code_snippet: Optional[str] = None

    model_config = {"from_attributes": True}

class ScanResponse(BaseModel):
    scan_id: str = Field(validation_alias="id")
    username: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "populate_by_name": True}

class RepoScanRequest(BaseModel):
    username: str
    repo_name: str
    repo_url: Optional[str] = None
    github_token: Optional[str] = None
    parent_scan_id: Optional[str] = None
    website_url: Optional[str] = None # Honeypot anti-bot field

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        if "@" in v:
            raise ValueError("Username cannot be an email address")
        return v

class GroupProgress(BaseModel):
    total_repos: int = 0
    queued_count: int = 0
    running_count: int = 0
    completed_count: int = 0
    failed_count: int = 0
    timed_out_count: int = 0

class FullReportResponse(BaseModel):
    scan_id: str = Field(validation_alias="id")
    username: str
    repo_name: Optional[str] = None
    status: str
    is_partial: bool = False
    overall_score: Optional[int] = None
    summary: Optional[Dict[str, Any]] = None # Synthesized JSON
    repositories: List[RepositorySchema] = []
    other_repositories: Optional[List[RepositorySchema]] = []
    findings: List[FindingSchema] = []
    group_progress: Optional[GroupProgress] = None
    child_scan_ids: List[str] = []
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "populate_by_name": True}

class FixRequest(BaseModel):
    scan_id: str
    repo_name: str
    rule_id: str

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    github_username: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class CopilotChatRequest(BaseModel):
    message: str

class CopilotMessageSchema(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}

class BadgeChallengeRequest(BaseModel):
    username: str

class BadgeChallengeResponse(BaseModel):
    username: str
    verification_token: str
    instructions: str

class BadgeVerifyRequest(BaseModel):
    username: str
    verification_token: str
    method: str = "bio_token"

class BadgeVerifyResponse(BaseModel):
    username: str
    overall_score: int
    revocation_token: str
    badge_svg_url: str
    is_active: bool

class LeaderboardEntry(BaseModel):
    username: str
    overall_score: int
    verified_at: datetime
    badge_svg_url: str

    model_config = {"from_attributes": True}

class QuickStatsLanguage(BaseModel):
    name: str
    count: int
    percentage: float

class QuickStatsResponse(BaseModel):
    username: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    followers: int = 0
    following: int = 0
    public_repos: int = 0
    total_stars: int = 0
    total_forks: int = 0
    top_languages: List[QuickStatsLanguage] = []
    account_created_at: Optional[str] = None
    last_active_at: Optional[str] = None

class RepoItem(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: int = 0
    forks_count: int = 0
    pushed_at: Optional[str] = None
    html_url: str
    default_branch: str = "main"
    is_target_repo: Optional[bool] = False

class RepoListResponse(BaseModel):
    username: str
    total_repos: int
    capped: bool
    repositories: List[RepoItem]
    other_repositories: Optional[List[RepoItem]] = []
    target_repo_name: Optional[str] = None


