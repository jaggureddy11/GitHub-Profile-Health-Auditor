from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, index=True, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, running, completed, failed
    overall_score = Column(Integer, nullable=True)
    summary = Column(String, nullable=True) # JSON/text containing the synthesized AI report
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

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

    scan = relationship("Scan", back_populates="findings")
