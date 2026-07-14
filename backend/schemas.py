from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ScanRequest(BaseModel):
    username: str
    github_token: Optional[str] = None

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

    model_config = {"from_attributes": True}

class ScanResponse(BaseModel):
    scan_id: str = Field(validation_alias="id")
    username: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

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

    model_config = {"from_attributes": True}
