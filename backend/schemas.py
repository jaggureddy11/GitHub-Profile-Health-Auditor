from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class ScanRequest(BaseModel):
    username: str
    github_token: Optional[str] = None

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

class FullReportResponse(BaseModel):
    scan_id: str = Field(validation_alias="id")
    username: str
    status: str
    overall_score: Optional[int] = None
    summary: Optional[Dict[str, Any]] = None # Synthesized JSON
    repositories: List[RepositorySchema]
    findings: List[FindingSchema]
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


