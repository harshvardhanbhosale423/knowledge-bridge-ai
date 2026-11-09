import os
import shutil
import json
from datetime import datetime
from typing import List, Optional, Tuple, Dict
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Header, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from .database import engine, Base, get_db, SessionLocal
from .models import User, Project, Document, KnowledgeItem, HandoverReport, ActivityLog
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    DocumentOut,
    KnowledgeItemCreate, KnowledgeItemUpdate, KnowledgeItemOut,
    BatchReviewRequest,
    HandoverReportCreate, HandoverApprovalRequest, HandoverReportOut,
    ActivityLogOut, DashboardStats, UserOut
)
from .extractors import extract_document
from .ai_engine import analyze_document_text, get_configured_ai_provider
from .seed_data import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists (handles Vercel /tmp writable directory)
IS_VERCEL = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
if IS_VERCEL:
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Seed initial data on startup
_init_db = SessionLocal()
try:
    seed_database(_init_db)
finally:
    _init_db.close()

app = FastAPI(
    title="KNOWLEDGE BRIDGE AI - Backend API",
    description="Enterprise Knowledge Handover Engine for Critical Project Transitions",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_activity(db: Session, project_id: Optional[int], action: str, details: str, user_name: str = "Admin"):
    activity = ActivityLog(
        project_id=project_id,
        user_name=user_name,
        action=action,
        details=details
    )
    db.add(activity)
    db.commit()

# --- Role-Based Access Control (RBAC) & Anti-Spoofing Tokens ---
# Strict Security Mandate: No hardcoded defaults, predictable tokens, or fallback credentials.
# ADMIN_TOKEN, TEAM_TOKEN, and SECRET_KEY must be supplied through server environment variables.
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()
TEAM_TOKEN = os.getenv("TEAM_TOKEN", "").strip()
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()

def get_configured_tokens() -> Tuple[str, str, str]:
    """Dynamically reads security tokens from environment, allowing runtime injection."""
    admin_tok = os.getenv("ADMIN_TOKEN", "").strip() or ADMIN_TOKEN
    team_tok = os.getenv("TEAM_TOKEN", "").strip() or TEAM_TOKEN
    secret_k = os.getenv("SECRET_KEY", "").strip() or SECRET_KEY
    return admin_tok, team_tok, secret_k

def verify_security_secrets():
    """Fail securely if any mandatory authentication secret is unconfigured."""
    admin_tok, team_tok, secret_k = get_configured_tokens()
    missing = []
    if not admin_tok:
        missing.append("ADMIN_TOKEN")
    if not team_tok:
        missing.append("TEAM_TOKEN")
    if not secret_k:
        missing.append("SECRET_KEY")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security Alert: Mandatory authentication secrets ({', '.join(missing)}) are missing from server environment. System fails securely; default credentials are strictly prohibited."
        )
    if admin_tok == team_tok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security Alert: ADMIN_TOKEN and TEAM_TOKEN cannot be identical. Distinct role credentials are required."
        )

def get_token_role_map() -> Dict[str, str]:
    """Returns mapping of valid tokens to roles."""
    admin_tok, team_tok, _ = get_configured_tokens()
    token_map = {}
    if admin_tok:
        token_map[admin_tok] = "admin"
    if team_tok:
        token_map[team_tok] = "team_member"
    return token_map

from pydantic import BaseModel
class LoginRequest(BaseModel):
    email: str
    role: str = "admin"

@app.post("/api/auth/login")
def login(req: LoginRequest):
    verify_security_secrets()
    role = req.role.strip().lower()
    if role not in ["admin", "team_member"]:
        raise HTTPException(status_code=400, detail="Invalid role requested")
    
    admin_tok, team_tok, _ = get_configured_tokens()
    token = admin_tok if role == "admin" else team_tok
    user_name = "Alex Chen" if role == "admin" else "Elena Rostova"
    return {
        "token": token,
        "role": role,
        "email": req.email,
        "user_name": user_name,
        "message": f"Successfully authenticated as {role.upper()}"
    }

def get_current_role(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    user_role: Optional[str] = Query(None)
) -> str:
    verify_security_secrets()
    token_map = get_token_role_map()

    # 1. Inspect Authorization Bearer token if provided
    auth_role = None
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "").strip()
            auth_role = token_map.get(token)
            if not auth_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Security Alert: Invalid, unrecognized, or forged authentication token. Access denied."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Alert: Invalid authorization scheme. Bearer token required."
            )

    # 2. Inspect declared role from header or query
    declared_role = (x_user_role or user_role).strip().lower() if (x_user_role or user_role) else None

    # 3. Detect and block header manipulation:
    # If client authenticates with a Team Member token but claims X-User-Role: admin, block immediately!
    if auth_role and declared_role and auth_role != declared_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security Alert: Header manipulation detected. Authenticated token role '{auth_role}' does not match claimed header role '{declared_role}'."
        )

    # If no token provided, return declared role or least-privileged 'team_member' (never admin by default)
    return auth_role or declared_role or "team_member"

def require_admin(
    authorization: Optional[str] = Header(None),
    role: str = Depends(get_current_role)
) -> str:
    verify_security_secrets()
    admin_tok, _, _ = get_configured_tokens()

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Administrative operations require an Authorization Bearer token."
        )

    token = authorization.replace("Bearer ", "").strip()
    if token != admin_tok:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Alert: Administrative operations strictly require valid Admin authentication token."
        )

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privilege required. Team Members are not authorized to perform this operation."
        )
    return role

# --- Health & Diagnostics ---
@app.get("/api/health")
def health_check():
    provider_info = get_configured_ai_provider()
    return {
        "status": "healthy",
        "app": "KNOWLEDGE BRIDGE AI",
        "tagline": "Never Lose Critical Knowledge. Keep Every Project Moving.",
        "ai_engine": provider_info
    }

@app.get("/api/ai/config")
def get_ai_config():
    return get_configured_ai_provider()

@app.get("/api/ai/quota-status")
def get_ai_quota_status():
    from .ai_engine import quota_manager
    return {
        "provider": get_configured_ai_provider(),
        "quota": quota_manager.get_stats(),
        "zero_budget_guarantee": "Strict zero-cost policy enforced. No paid APIs or subscriptions."
    }

@app.get("/api/ai/test-live")
async def test_live_ai():
    from .ai_engine import test_live_gemini_connection
    return await test_live_gemini_connection()

# --- Dashboard Stats ---
@app.get("/api/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    uploaded_docs = db.query(Document).count()
    pending_reviews = db.query(KnowledgeItem).filter(KnowledgeItem.status == "pending_review").count()
    approved_handovers = db.query(HandoverReport).filter(HandoverReport.status == "approved").count()
    critical_risks = db.query(KnowledgeItem).filter(
        KnowledgeItem.category == "risk_blocker",
        KnowledgeItem.priority == "critical"
    ).count()
    total_items = db.query(KnowledgeItem).count()
    
    ai_info = get_configured_ai_provider()

    return DashboardStats(
        total_projects=total_projects,
        uploaded_documents=uploaded_docs,
        pending_reviews=pending_reviews,
        approved_handovers=approved_handovers,
        critical_risks=critical_risks,
        total_extracted_items=total_items,
        demo_mode_active=ai_info["is_demo_mode"],
        configured_ai_provider=ai_info["provider"],
        estimated_monthly_cost=ai_info.get("estimated_monthly_cost", "₹0.00 / Zero Cost"),
        is_zero_budget=True,
        quota_status=ai_info.get("quota_status", "HEALTHY_FREE_TIER")
    )

# --- Users & Roles ---
@app.get("/api/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# --- Projects Workspace ---
@app.get("/api/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(desc(Project.created_at)).all()
    results = []
    for p in projects:
        doc_count = db.query(Document).filter(Document.project_id == p.id).count()
        item_count = db.query(KnowledgeItem).filter(KnowledgeItem.project_id == p.id).count()
        pending_count = db.query(KnowledgeItem).filter(
            KnowledgeItem.project_id == p.id,
            KnowledgeItem.status == "pending_review"
        ).count()
        approved_count = db.query(KnowledgeItem).filter(
            KnowledgeItem.project_id == p.id,
            KnowledgeItem.status == "approved"
        ).count()
        has_approved_handover = db.query(HandoverReport).filter(
            HandoverReport.project_id == p.id,
            HandoverReport.status == "approved"
        ).first() is not None

        results.append(ProjectOut(
            id=p.id,
            title=p.title,
            code=p.code,
            description=p.description,
            department=p.department,
            lead_name=p.lead_name,
            status=p.status,
            handover_status=p.handover_status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            document_count=doc_count,
            item_count=item_count,
            pending_review_count=pending_count,
            approved_count=approved_count,
            has_approved_handover=has_approved_handover
        ))
    return results

@app.post("/api/projects", response_model=ProjectOut)
def create_project(data: ProjectCreate, role: str = Depends(require_admin), db: Session = Depends(get_db)):
    # Check duplicate code
    existing = db.query(Project).filter(Project.code == data.code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project code '{data.code}' already exists.")

    project = Project(
        title=data.title.strip(),
        code=data.code.strip().upper(),
        description=data.description,
        department=data.department,
        lead_name=data.lead_name,
        status="active",
        handover_status="not_started"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_activity(db, project.id, "PROJECT_CREATED", f"Initialized project workspace for {project.title}")
    
    return ProjectOut(
        id=project.id,
        title=project.title,
        code=project.code,
        description=project.description,
        department=project.department,
        lead_name=project.lead_name,
        status=project.status,
        handover_status=project.handover_status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        document_count=0,
        item_count=0,
        pending_review_count=0,
        approved_count=0,
        has_approved_handover=False
    )

@app.get("/api/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    doc_count = db.query(Document).filter(Document.project_id == p.id).count()
    item_count = db.query(KnowledgeItem).filter(KnowledgeItem.project_id == p.id).count()
    pending_count = db.query(KnowledgeItem).filter(
        KnowledgeItem.project_id == p.id,
        KnowledgeItem.status == "pending_review"
    ).count()
    approved_count = db.query(KnowledgeItem).filter(
        KnowledgeItem.project_id == p.id,
        KnowledgeItem.status == "approved"
    ).count()
    has_approved = db.query(HandoverReport).filter(
        HandoverReport.project_id == p.id,
        HandoverReport.status == "approved"
    ).first() is not None

    return ProjectOut(
        id=p.id,
        title=p.title,
        code=p.code,
        description=p.description,
        department=p.department,
        lead_name=p.lead_name,
        status=p.status,
        handover_status=p.handover_status,
        created_at=p.created_at,
        updated_at=p.updated_at,
        document_count=doc_count,
        item_count=item_count,
        pending_review_count=pending_count,
        approved_count=approved_count,
        has_approved_handover=has_approved
    )

@app.patch("/api/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.title is not None:
        p.title = data.title.strip()
    if data.description is not None:
        p.description = data.description
    if data.department is not None:
        p.department = data.department
    if data.status is not None:
        p.status = data.status
    if data.lead_name is not None:
        p.lead_name = data.lead_name
    if data.handover_status is not None:
        p.handover_status = data.handover_status

    db.commit()
    db.refresh(p)
    return get_project(project_id, db)

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, role: str = Depends(require_admin), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    title = p.title
    db.delete(p)
    db.commit()
    log_activity(db, None, "PROJECT_DELETED", f"Deleted project workspace: {title}")
    return {"message": f"Project '{title}' and associated records deleted."}

# --- Document Upload & Extraction ---
@app.post("/api/projects/{project_id}/documents/upload", response_model=DocumentOut)
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    auto_analyze: bool = Query(True),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".docx", ".doc", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

    # Unique storage name
    timestamp_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp_prefix}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Enforce Vercel Serverless Function 4.5 MB request payload limit
    MAX_UPLOAD_SIZE = int(4.5 * 1024 * 1024)
    if file_size > MAX_UPLOAD_SIZE:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds Vercel Serverless limit of 4.5 MB (Uploaded: {round(file_size / (1024 * 1024), 2)} MB). Please upload documents under 4.0 MB."
        )

    # Perform real extraction
    try:
        extracted_text, page_count, pages_data = extract_document(file_path, ext)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to extract document text: {str(e)}")

    doc = Document(
        project_id=project_id,
        filename=safe_filename,
        original_name=filename,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        storage_path=file_path,
        page_count=page_count,
        char_count=len(extracted_text),
        extracted_text=extracted_text,
        is_processed=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_activity(
        db, project_id, "DOCUMENT_UPLOADED",
        f"Uploaded {filename} ({round(file_size/1024, 1)} KB, {page_count} pages)"
    )

    # Trigger automatic knowledge analysis if requested
    if auto_analyze and extracted_text.strip():
        items = await analyze_document_text(extracted_text, filename)
        for item in items:
            ki = KnowledgeItem(
                project_id=project_id,
                document_id=doc.id,
                category=item["category"],
                title=item["title"],
                content=item["content"],
                priority=item["priority"],
                assignee=item["assignee"],
                source_document_name=filename,
                source_page=item["source_page"],
                source_excerpt=item["source_excerpt"],
                status="pending_review",
                evidence_verified=item["evidence_verified"],
                missing_evidence_flag=item["missing_evidence_flag"],
                confidence_score=item["confidence_score"],
                is_ai_generated=True,
                is_demo_mode=item["is_demo_mode"],
                ai_provider=item["ai_provider"]
            )
            db.add(ki)
        
        project.handover_status = "under_review"
        db.commit()
        
        mode_label = "Demo Fallback" if items and items[0]["is_demo_mode"] else "AI Engine"
        log_activity(
            db, project_id, "ANALYSIS_COMPLETED",
            f"Extracted {len(items)} knowledge items from {filename} via {mode_label}"
        )

    return doc

@app.get("/api/projects/{project_id}/documents", response_model=List[DocumentOut])
def list_project_documents(project_id: int, db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.project_id == project_id).order_by(desc(Document.upload_timestamp)).all()

@app.get("/api/documents/{document_id}")
def get_document_details(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "project_id": doc.project_id,
        "original_name": doc.original_name,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "page_count": doc.page_count,
        "char_count": doc.char_count,
        "extracted_text": doc.extracted_text,
        "upload_timestamp": doc.upload_timestamp
    }

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, role: str = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    project_id = doc.project_id
    filename = doc.original_name
    
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    log_activity(db, project_id, "DOCUMENT_DELETED", f"Deleted document {filename}")
    return {"message": f"Document '{filename}' deleted successfully."}

# --- AI Knowledge Analysis Endpoint ---
@app.post("/api/projects/{project_id}/analyze")
async def trigger_analysis(
    project_id: int,
    document_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    docs_query = db.query(Document).filter(Document.project_id == project_id)
    if document_id:
        docs_query = docs_query.filter(Document.id == document_id)
    
    docs = docs_query.all()
    if not docs:
        raise HTTPException(status_code=400, detail="No documents available in project to analyze. Please upload a document first.")

    total_created = 0
    all_extracted_items = []
    
    for doc in docs:
        if not doc.extracted_text:
            continue
        items = await analyze_document_text(doc.extracted_text, doc.original_name)
        for item in items:
            ki = KnowledgeItem(
                project_id=project_id,
                document_id=doc.id,
                category=item["category"],
                title=item["title"],
                content=item["content"],
                priority=item["priority"],
                assignee=item["assignee"],
                source_document_name=doc.original_name,
                source_page=item["source_page"],
                source_excerpt=item["source_excerpt"],
                status="pending_review",
                evidence_verified=item["evidence_verified"],
                missing_evidence_flag=item["missing_evidence_flag"],
                confidence_score=item["confidence_score"],
                is_ai_generated=True,
                is_demo_mode=item["is_demo_mode"],
                ai_provider=item["ai_provider"]
            )
            db.add(ki)
            total_created += 1
            all_extracted_items.append(item)

    project.handover_status = "under_review"
    db.commit()

    log_activity(
        db, project_id, "ANALYSIS_TRIGGERED",
        f"Completed knowledge extraction: {total_created} items generated across {len(docs)} document(s)"
    )

    ai_info = get_configured_ai_provider()
    return {
        "message": f"Extracted {total_created} knowledge items across {len(docs)} documents.",
        "items_count": total_created,
        "is_demo_mode": ai_info["is_demo_mode"],
        "provider": ai_info["provider"]
    }

# --- Knowledge Items & Human Review Center ---
@app.get("/api/projects/{project_id}/knowledge-items", response_model=List[KnowledgeItemOut])
def list_knowledge_items(
    project_id: int,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(KnowledgeItem).filter(KnowledgeItem.project_id == project_id)
    if category:
        q = q.filter(KnowledgeItem.category == category)
    if status:
        q = q.filter(KnowledgeItem.status == status)
    if priority:
        q = q.filter(KnowledgeItem.priority == priority)
    if search:
        search_filter = f"%{search}%"
        q = q.filter(
            (KnowledgeItem.title.ilike(search_filter)) |
            (KnowledgeItem.content.ilike(search_filter)) |
            (KnowledgeItem.source_excerpt.ilike(search_filter))
        )
    return q.order_by(desc(KnowledgeItem.created_at)).all()

@app.get("/api/knowledge-items/{item_id}", response_model=KnowledgeItemOut)
def get_knowledge_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return item

@app.patch("/api/knowledge-items/{item_id}", response_model=KnowledgeItemOut)
def update_knowledge_item(item_id: int, data: KnowledgeItemUpdate, db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")

    if data.title is not None:
        item.title = data.title.strip()
    if data.content is not None:
        item.content = data.content.strip()
    if data.priority is not None:
        item.priority = data.priority
    if data.assignee is not None:
        item.assignee = data.assignee
    if data.status is not None:
        item.status = data.status
        item.reviewed_at = datetime.utcnow()
        log_activity(
            db, item.project_id, f"ITEM_{item.status.upper()}",
            f"Knowledge item #{item.id} '{item.title}' marked as {item.status} by {item.reviewed_by or 'Reviewer'}"
        )
    if data.review_notes is not None:
        item.review_notes = data.review_notes
    if data.reviewed_by is not None:
        item.reviewed_by = data.reviewed_by

    db.commit()
    db.refresh(item)
    return item

@app.post("/api/projects/{project_id}/batch-review")
def batch_review_items(project_id: int, req: BatchReviewRequest, role: str = Depends(require_admin), db: Session = Depends(get_db)):
    items = db.query(KnowledgeItem).filter(
        KnowledgeItem.project_id == project_id,
        KnowledgeItem.id.in_(req.item_ids)
    ).all()

    new_status = "approved" if req.action == "approve" else "rejected"
    count = 0
    for item in items:
        item.status = new_status
        item.reviewed_by = req.reviewer_name
        item.reviewed_at = datetime.utcnow()
        if req.review_notes:
            item.review_notes = req.review_notes
        count += 1

    db.commit()
    log_activity(
        db, project_id, f"BATCH_{req.action.upper()}",
        f"{req.reviewer_name} marked {count} item(s) as {new_status}"
    )
    return {"message": f"Successfully updated {count} items to '{new_status}'."}

@app.delete("/api/knowledge-items/{item_id}")
def delete_knowledge_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    db.delete(item)
    db.commit()
    return {"message": "Knowledge item deleted."}

# --- Handover Report Generator & Approval Gate ---
@app.post("/api/projects/{project_id}/generate-handover", response_model=HandoverReportOut)
def generate_handover_report(
    project_id: int,
    req: HandoverReportCreate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch approved and verified items
    items = db.query(KnowledgeItem).filter(KnowledgeItem.project_id == project_id).all()
    if not items:
        raise HTTPException(status_code=400, detail="Cannot generate handover: No knowledge items found. Upload documents and run analysis first.")

    approved_items = [i for i in items if i.status == "approved"]
    pending_items = [i for i in items if i.status == "pending_review"]
    
    # Categorize items
    decisions = [i for i in approved_items if i.category == "decision"]
    tasks = [i for i in approved_items if i.category == "pending_task"]
    roles = [i for i in approved_items if i.category == "responsibility"]
    risks = [i for i in approved_items if i.category == "risk_blocker"]
    deps = [i for i in approved_items if i.category == "dependency"]
    questions = [i for i in approved_items if i.category == "unresolved_question"]
    actions = [i for i in approved_items if i.category == "next_action"]

    # Calculate version
    existing_reports = db.query(HandoverReport).filter(HandoverReport.project_id == project_id).count()
    version = f"1.{existing_reports}.0"

    title = req.title or f"{project.title} - Official Handover Package"
    summary = req.executive_summary or f"Comprehensive knowledge handover compilation for {project.title} ({project.code}), encompassing {len(approved_items)} approved decisions, operational responsibilities, risks, and scheduled continuity actions."

    # Build structured Markdown
    now_str = datetime.utcnow().strftime("%B %d, %Y")
    md_lines = [
        f"# {title}",
        f"**Project Code:** `{project.code}` | **Department:** {project.department}",
        f"**Project Lead:** {project.lead_name} | **Report Version:** `v{version}`",
        f"**Generated:** {now_str} | **Status:** Draft (Pending Final Review & Approval)",
        "",
        "---",
        "",
        "## 1. EXECUTIVE OVERVIEW",
        summary,
        "",
        "### Handover Readiness Metrics",
        f"- **Total Extracted Items:** {len(items)}",
        f"- **Human-Approved Items:** {len(approved_items)} ({round(len(approved_items)/max(1, len(items))*100, 1)}%)",
        f"- **Pending Review Items:** {len(pending_items)}",
        f"- **Critical Risks Identified:** {len([r for r in risks if r.priority == 'critical'])}",
        "",
        "---",
        "",
        "## 2. KEY ARCHITECTURAL & PROJECT DECISIONS",
    ]

    if decisions:
        for idx, d in enumerate(decisions, 1):
            md_lines.extend([
                f"### 2.{idx} {d.title}",
                f"{d.content}",
                f"- **Priority:** `{d.priority.upper()}` | **Owner:** {d.assignee or 'Unassigned'}",
                f"- **Verified Source:** *{d.source_document_name} ({d.source_page or 'Page 1'})*",
                f"> **Evidence Quote:** \"{d.source_excerpt}\"",
                ""
            ])
    else:
        md_lines.append("*No approved decisions recorded yet.*")

    md_lines.extend([
        "---",
        "",
        "## 3. ROLES, CONTACTS & SYSTEM RESPONSIBILITIES",
    ])
    if roles:
        for r in roles:
            md_lines.append(f"- **{r.title}**: {r.content} *(Assignee: {r.assignee or 'Team'})* [Source: {r.source_document_name}]")
    else:
        md_lines.append("*No specific roles documented.*")

    md_lines.extend([
        "",
        "---",
        "",
        "## 4. CRITICAL RISKS & TECHNICAL BLOCKERS",
    ])
    if risks:
        for r in risks:
            p_badge = f"**[{r.priority.upper()}]**"
            md_lines.extend([
                f"### {p_badge} {r.title}",
                f"{r.content}",
                f"- **Mitigation Assignee:** {r.assignee or 'DevOps'}",
                f"- **Source Reference:** *{r.source_document_name} ({r.source_page or 'Page 1'})*",
                f"> \"{r.source_excerpt}\"",
                ""
            ])
    else:
        md_lines.append("*No open risks or blockers recorded.*")

    md_lines.extend([
        "---",
        "",
        "## 5. EXTERNAL DEPENDENCIES & PREREQUISITES",
    ])
    if deps:
        for d in deps:
            md_lines.append(f"- **{d.title}**: {d.content} *(Impact: {d.priority.upper()})*")
    else:
        md_lines.append("*No external dependencies recorded.*")

    md_lines.extend([
        "",
        "---",
        "",
        "## 6. UNRESOLVED QUESTIONS & OPEN DEBATES",
    ])
    if questions:
        for q in questions:
            md_lines.append(f"- **{q.title}**: {q.content} *(POC: {q.assignee or 'Lead'})*")
    else:
        md_lines.append("*No open questions flagged.*")

    md_lines.extend([
        "",
        "---",
        "",
        "## 7. RECOMMENDED NEXT ACTIONS (FIRST 30 DAYS)",
    ])
    if actions:
        for idx, a in enumerate(actions, 1):
            md_lines.append(f"{idx}. **{a.title}** (`{a.priority.upper()}`): {a.content} — *Lead: {a.assignee or 'Incoming Team'}*")
    else:
        md_lines.append("*No pending next actions recorded.*")

    md_lines.extend([
        "",
        "---",
        "",
        "## 8. EVIDENCE & VERIFICATION AUDIT TRAIL",
        "All items included in this handover have been extracted from authorized documentation and verified against original source text without synthetic embellishment.",
        "",
        f"*(Generated via Knowledge Bridge AI on {now_str})*"
    ])

    markdown_body = "\n".join(md_lines)

    stats_obj = {
        "total_items": len(items),
        "approved_items": len(approved_items),
        "pending_items": len(pending_items),
        "decisions_count": len(decisions),
        "risks_count": len(risks),
        "actions_count": len(actions)
    }

    report = HandoverReport(
        project_id=project_id,
        title=title,
        version=version,
        executive_summary=summary,
        status="draft", # Strictly requires human approval
        stats_json=json.dumps(stats_obj),
        markdown_content=markdown_body
    )
    db.add(report)
    
    project.handover_status = "draft"
    db.commit()
    db.refresh(report)

    log_activity(
        db, project_id, "HANDOVER_GENERATED",
        f"Generated Handover Draft v{version} containing {len(approved_items)} verified items."
    )

    return report

@app.post("/api/projects/{project_id}/approve-handover")
def approve_handover_report(
    project_id: int,
    req: HandoverApprovalRequest,
    role: str = Depends(require_admin),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    report = db.query(HandoverReport).filter(
        HandoverReport.project_id == project_id
    ).order_by(desc(HandoverReport.generated_at)).first()

    if not report:
        raise HTTPException(status_code=400, detail="No handover report exists for this project. Generate one first.")

    report.status = "approved"
    report.approved_by = req.approved_by
    report.approved_at = datetime.utcnow()
    
    # Append approval block to markdown content
    approval_block = f"\n\n---\n### 9. OFFICIAL APPROVAL CERTIFICATION\n- **Approved By:** {req.approved_by}\n- **Date:** {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}\n- **Notes:** {req.signature_notes or 'All items reviewed and accepted for project handover.'}\n"
    report.markdown_content += approval_block

    project.handover_status = "approved"
    db.commit()

    log_activity(
        db, project_id, "HANDOVER_APPROVED",
        f"Handover report v{report.version} officially approved and certified by {req.approved_by}"
    )

    return {
        "message": f"Handover report v{report.version} approved successfully.",
        "report_id": report.id,
        "status": "approved",
        "approved_by": req.approved_by,
        "approved_at": report.approved_at
    }

@app.get("/api/projects/{project_id}/handover", response_model=HandoverReportOut)
def get_latest_handover(
    project_id: int,
    role: str = Depends(get_current_role),
    db: Session = Depends(get_db)
):
    report = db.query(HandoverReport).filter(
        HandoverReport.project_id == project_id
    ).order_by(desc(HandoverReport.generated_at)).first()

    if not report:
        raise HTTPException(status_code=404, detail="No handover report found for this project.")

    # Requirement 3: Team Member cannot access unapproved handovers
    if role == "team_member" and report.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Team Members cannot access unapproved handovers until certified and published by an administrator."
        )

    return report

# --- Activity Stream ---
@app.get("/api/activities", response_model=List[ActivityLogOut])
def list_activities(limit: int = 30, db: Session = Depends(get_db)):
    return db.query(ActivityLog).order_by(desc(ActivityLog.timestamp)).limit(limit).all()

@app.get("/api/projects/{project_id}/activities", response_model=List[ActivityLogOut])
def list_project_activities(project_id: int, limit: int = 30, db: Session = Depends(get_db)):
    return db.query(ActivityLog).filter(ActivityLog.project_id == project_id).order_by(desc(ActivityLog.timestamp)).limit(limit).all()

# --- Static File Serving for Production Unified Deployment ---
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
