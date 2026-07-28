from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    github_username = Column(String, nullable=True)
    github_oauth_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String, index=True, nullable=True)
    username = Column(String, index=True, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, running, completed, failed
    overall_score = Column(Integer, nullable=True)
    summary = Column(String, nullable=True) # JSON/text containing the synthesized AI report
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="scans")
    repositories = relationship("Repository", back_populates="scan", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    last_commit = Column(String, nullable=True)
    default_branch = Column(String, nullable=True)

    scan = relationship("Scan", back_populates="repositories")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    repo_name = Column(String, nullable=False)
    type = Column(String, nullable=False) # structural, secret, smell
    file_path = Column(String, nullable=False)
    line_number = Column(Integer, nullable=True)
    rule_id = Column(String, nullable=True)
    severity = Column(String, nullable=False) # low, medium, high, critical
    description = Column(String, nullable=False)
    verification_status = Column(String, nullable=True) # live, unverified, or NULL
    code_snippet = Column(String, nullable=True) # Redacted code snippet for key/smell context

    scan = relationship("Scan", back_populates="findings")

class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String, index=True, nullable=True)
    role = Column(String, nullable=False) # user or assistant
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class PublicBadge(Base):
    __tablename__ = "public_badges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    overall_score = Column(Integer, nullable=False)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verification_method = Column(String, nullable=False) # oauth or bio_token
    verification_token = Column(String, nullable=True)
    revocation_token = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class BadgeChallenge(Base):
    __tablename__ = "badge_challenges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, index=True, nullable=False)
    verification_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)

