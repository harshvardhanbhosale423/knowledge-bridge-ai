from datetime import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, Enum
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="admin") # "admin" or "team_member"
    avatar_color = Column(String(50), default="blue")
    department = Column(String(100), default="Engineering")
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. KB-APOLLO
    description = Column(Text, nullable=True)
    department = Column(String(100), default="Platform Engineering")
    status = Column(String(50), default="active") # active, archived
    lead_name = Column(String(100), default="Alex Chen")
    handover_status = Column(String(50), default="not_started") # not_started, draft, under_review, approved
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    knowledge_items = relationship("KnowledgeItem", back_populates="project", cascade="all, delete-orphan")
    handover_reports = relationship("HandoverReport", back_populates="project", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="project", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False) # pdf, docx, txt
    file_size = Column(Integer, default=0) # in bytes
    storage_path = Column(String(500), nullable=False)
    page_count = Column(Integer, default=1)
    char_count = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    is_processed = Column(Boolean, default=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="documents")
    knowledge_items = relationship("KnowledgeItem", back_populates="document", cascade="all, delete-orphan")

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # Categories: decision, pending_task, responsibility, risk_blocker, dependency, unresolved_question, next_action
    category = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(50), default="medium") # critical, high, medium, low
    assignee = Column(String(255), nullable=True) # owner / responsible party
    
    # Review workflow: pending_review, approved, rejected, modified
    status = Column(String(50), default="pending_review", index=True)
    review_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Evidence linkage
    source_document_name = Column(String(255), nullable=True)
    source_page = Column(String(100), nullable=True)
    source_excerpt = Column(Text, nullable=True)
    evidence_verified = Column(Boolean, default=True) # True if excerpt confirmed in doc text
    missing_evidence_flag = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.92) # 0.0 - 1.0
    
    # AI info
    is_ai_generated = Column(Boolean, default=True)
    is_demo_mode = Column(Boolean, default=False)
    ai_provider = Column(String(255), default="Gemini-Flash")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="knowledge_items")
    document = relationship("Document", back_populates="knowledge_items")

class HandoverReport(Base):
    __tablename__ = "handover_reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    version = Column(String(20), default="1.0.0")
    executive_summary = Column(Text, nullable=True)
    
    # Status: draft, under_review, approved
    status = Column(String(50), default="draft")
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    stats_json = Column(Text, default="{}") # JSON of totals, decisions count, risks count, etc.
    markdown_content = Column(Text, nullable=False)
    
    generated_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="handover_reports")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    user_name = Column(String(100), default="System")
    action = Column(String(100), nullable=False) # e.g. "DOCUMENT_UPLOADED", "ANALYSIS_COMPLETED", "ITEM_APPROVED", "HANDOVER_GENERATED"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="activity_logs")

class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(50), nullable=True)
    user_email = Column(String(255), nullable=True)
    revoked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

class BackupRecord(Base):
    __tablename__ = "backup_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    backup_type = Column(String(50), default="manual") # manual, pre_restore
    file_size = Column(Integer, default=0) # in bytes
    record_counts_json = Column(Text, default="{}")
    sha256_checksum = Column(String(64), nullable=False)
    status = Column(String(50), default="completed") # completed, restored, failed
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



