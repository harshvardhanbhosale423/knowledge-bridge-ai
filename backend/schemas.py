from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "admin"
    department: str = "Engineering"
    avatar_color: str = "blue"

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    department: str = "Platform Engineering"
    lead_name: str = "Alex Chen"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    lead_name: Optional[str] = None
    handover_status: Optional[str] = None

class ProjectOut(ProjectBase):
    id: int
    status: str
    handover_status: str
    created_at: datetime
    updated_at: datetime
    document_count: Optional[int] = 0
    item_count: Optional[int] = 0
    pending_review_count: Optional[int] = 0
    approved_count: Optional[int] = 0
    has_approved_handover: Optional[bool] = False
    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentOut(BaseModel):
    id: int
    project_id: int
    filename: str
    original_name: str
    file_type: str
    file_size: int
    page_count: int
    char_count: int
    is_processed: bool
    upload_timestamp: datetime
    class Config:
        from_attributes = True

# --- Knowledge Item Schemas ---
class KnowledgeItemBase(BaseModel):
    category: str
    title: str
    content: str
    priority: str = "medium"
    assignee: Optional[str] = None
    source_document_name: Optional[str] = None
    source_page: Optional[str] = None
    source_excerpt: Optional[str] = None

class KnowledgeItemCreate(KnowledgeItemBase):
    project_id: int
    document_id: Optional[int] = None
    confidence_score: float = 0.95
    is_demo_mode: bool = False
    ai_provider: str = "Gemini-Flash"

class KnowledgeItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[str] = None # approved, rejected, modified
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None

class KnowledgeItemOut(KnowledgeItemBase):
    id: int
    project_id: int
    document_id: Optional[int] = None
    status: str
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    evidence_verified: bool
    missing_evidence_flag: bool
    confidence_score: float
    is_ai_generated: bool
    is_demo_mode: bool
    ai_provider: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Batch Review Schemas ---
class BatchReviewRequest(BaseModel):
    item_ids: List[int]
    action: str # "approve" or "reject"
    reviewer_name: str = "Admin Reviewer"
    review_notes: Optional[str] = None

# --- Handover Report Schemas ---
class HandoverReportCreate(BaseModel):
    project_id: int
    title: Optional[str] = None
    executive_summary: Optional[str] = None

class HandoverApprovalRequest(BaseModel):
    approved_by: str
    signature_notes: Optional[str] = None

class HandoverReportOut(BaseModel):
    id: int
    project_id: int
    title: str
    version: str
    executive_summary: Optional[str] = None
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    stats_json: str
    markdown_content: str
    generated_at: datetime
    class Config:
        from_attributes = True

# --- Activity Log Schemas ---
class ActivityLogOut(BaseModel):
    id: int
    project_id: Optional[int] = None
    user_name: str
    action: str
    details: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

# --- Dashboard Overview Stats ---
class DashboardStats(BaseModel):
    total_projects: int
    uploaded_documents: int
    pending_reviews: int
    approved_handovers: int
    critical_risks: int
    total_extracted_items: int
    demo_mode_active: bool
    configured_ai_provider: str
    estimated_monthly_cost: Optional[str] = "₹0.00 / Zero Cost"
    is_zero_budget: Optional[bool] = True
    quota_status: Optional[str] = "HEALTHY_FREE_TIER"

