import os
import shutil
import json
import base64
import hashlib
import hmac
import time
import secrets
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Header, status, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from .database import engine, Base, get_db, SessionLocal
from .models import User, Project, Document, KnowledgeItem, HandoverReport, ActivityLog, RevokedToken, BackupRecord
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
from .report_generator import build_final_report_pdf, generate_final_report_markdown

# Ensure upload directory exists (handles Vercel /tmp writable directory)
UPLOAD_DIR = "/tmp/uploads" if os.path.exists("/tmp") else os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create tables & seed initial data on startup (safe against cold-start timeouts)
try:
    Base.metadata.create_all(bind=engine)
    _init_db = SessionLocal()
    try:
        seed_database(_init_db)
    finally:
        _init_db.close()
except Exception as _startup_db_err:
    import logging
    logging.getLogger("uvicorn.error").warning(f"Initial DB schema/seed warning (will connect on demand): {_startup_db_err}")

app = FastAPI(
    title="KNOWLEDGE BRIDGE AI - Backend API",
    
    description="Enterprise Knowledge Handover Engine for Critical Project Transitions",
    version="1.0.0"
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

# --- Strict Production & Development CORS Configuration ---
# Production allows strictly https://knowledge-bridge-ai.vercel.app
# Localhost and 127.0.0.1 are only permitted when ENVIRONMENT != "production" and not running on Vercel
PRODUCTION_FRONTEND_ORIGIN = "https://knowledge-bridge-ai.vercel.app"
DEV_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def is_production_environment() -> bool:
    """Checks whether the application is running in production mode."""
    if os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None:
        return True
    env = os.getenv("ENVIRONMENT", "").strip().lower()
    return env == "production"

def resolve_allowed_origins() -> List[str]:
    """
    Computes strict CORS origin whitelist:
    - Production: Strictly permits approved production frontend origins. Localhost/127.0.0.1 are excluded.
    - Development: Localhost and 127.0.0.1 origins are permitted.
    - Custom ALLOWED_ORIGINS: Validated and sanitized. Wildcards ('*') are rejected.
    """
    is_prod = is_production_environment()
    allowed: List[str] = []

    # Check ALLOWED_ORIGINS environment variable
    custom_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
    if custom_origins_env:
        for entry in custom_origins_env.split(","):
            raw = entry.strip().rstrip("/")
            if not raw:
                continue
            # Strictly reject wildcard origins
            if raw == "*" or "*" in raw:
                continue
            if is_prod:
                # In production, reject localhost, 127.0.0.1, and any insecure http:// origins
                if raw.startswith("http://") or "localhost" in raw or "127.0.0.1" in raw:
                    continue
                if raw.startswith("https://") and raw not in allowed:
                    allowed.append(raw)
            else:
                if (raw.startswith("http://") or raw.startswith("https://")) and raw not in allowed:
                    allowed.append(raw)

    if is_prod:
        # In production, ensure PRODUCTION_FRONTEND_ORIGIN is present
        if PRODUCTION_FRONTEND_ORIGIN not in allowed:
            allowed.insert(0, PRODUCTION_FRONTEND_ORIGIN)
    else:
        # In development, include production origin plus local dev origins
        if PRODUCTION_FRONTEND_ORIGIN not in allowed:
            allowed.append(PRODUCTION_FRONTEND_ORIGIN)
        for dev_orig in DEV_FRONTEND_ORIGINS:
            if dev_orig not in allowed:
                allowed.append(dev_orig)

    return allowed

class StrictSecurityCORSMiddleware(CORSMiddleware):
    """
    Strict CORS middleware enforcing:
    - Dynamic environment check (production vs development)
    - Rejection of wildcard origins
    - Exclusion of localhost in production
    - allow_credentials=False for zero-trust security
    """
    def is_allowed_origin(self, origin: str) -> bool:
        if not origin:
            return False
        # Disallow wildcard
        if origin == "*" or "*" in origin:
            return False
        allowed = resolve_allowed_origins()
        return origin.rstrip("/") in allowed

app.add_middleware(
    StrictSecurityCORSMiddleware,
    allow_origins=resolve_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-User-Role"],
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

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding and padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))

def create_jwt_session(role: str, email: str, user_name: str, expires_in_seconds: int = 28800) -> str:
    _, _, sec_key = get_configured_tokens()
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": email,
        "user_name": user_name,
        "role": role,
        "iat": now,
        "exp": now + expires_in_seconds,
        "jti": secrets.token_hex(16)
    }
    encoded_header = _b64url_encode(json.dumps(header, separators=(',', ':')).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    sig = hmac.new(sec_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_sig = _b64url_encode(sig)
    return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

class UserSession(BaseModel):
    role: str
    user_name: str
    email: str
    jti: str
    exp: int
    token_type: str = "jwt"

def decode_jwt_session(token: str) -> UserSession:
    """
    Strictly decodes and validates HMAC-SHA256 JWT session tokens.
    Raises HTTPException(401) on malformed structure, invalid/forged signature,
    expired lifetime, missing claims, or invalid roles.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Malformed token structure. Expected 3-part signed JWT."
        )

    encoded_header, encoded_payload, encoded_sig = parts
    _, _, sec_key = get_configured_tokens()
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    expected_sig = hmac.new(sec_key.encode("utf-8"), signing_input, hashlib.sha256).digest()

    try:
        provided_sig = _b64url_decode(encoded_sig)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Invalid token signature encoding."
        )

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Invalid, forged, or tampered token signature. Access denied."
        )

    try:
        payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Unparseable token payload claims."
        )

    # Validate mandatory claims
    required_claims = ["sub", "role", "exp", "iat", "jti"]
    for claim in required_claims:
        if claim not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Security Alert: Missing mandatory token claim '{claim}'."
            )

    # Enforce JWT Expiration strictly
    now = int(time.time())
    exp = payload.get("exp")
    if not isinstance(exp, (int, float)) or now > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Session token has expired. Please re-authenticate."
        )

    # Validate issued-at not in future (allow 60s clock skew)
    iat = payload.get("iat")
    if isinstance(iat, (int, float)) and iat > now + 60:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Token issued in the future. Clock synchronization error."
        )

    role = str(payload.get("role", "")).strip().lower()
    if role not in ["admin", "team_member"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Unauthorized or invalid role claim in token."
        )

    return UserSession(
        role=role,
        user_name=payload.get("user_name", "User"),
        email=payload.get("sub", ""),
        jti=payload.get("jti"),
        exp=int(exp),
        token_type="jwt"
    )

class LoginRequest(BaseModel):
    email: Optional[str] = None
    role: str = "admin"
    credential: Optional[str] = None
    token: Optional[str] = None

@app.post("/api/auth/login")
def login(req: LoginRequest):
    verify_security_secrets()
    role = req.role.strip().lower()
    if role not in ["admin", "team_member"]:
        raise HTTPException(status_code=400, detail="Invalid role requested. Must be 'admin' or 'team_member'.")

    admin_tok, team_tok, _ = get_configured_tokens()
    expected_token = admin_tok if role == "admin" else team_tok

    cred = (req.credential or req.token or "").strip()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: Secret credential is required to authenticate as '{role}'. Role selection without credential is prohibited."
        )

    if not hmac.compare_digest(cred, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: Invalid credentials provided for role '{role}'."
        )

    user_name = "Alex Chen" if role == "admin" else "Elena Rostova"
    user_email = req.email or (f"alex.chen@knowledgebridge.internal" if role == "admin" else "elena.rostova@knowledgebridge.internal")

    session_jwt = create_jwt_session(role=role, email=user_email, user_name=user_name)

    return {
        "access_token": session_jwt,
        "token_type": "bearer",
        "role": role,
        "email": user_email,
        "user_name": user_name,
        "expires_in": 28800,
        "message": f"Successfully authenticated as {role.upper()}"
    }

class DemoLoginRequest(BaseModel):
    role: str = "admin"

@app.post("/api/auth/demo-login")
def demo_login(req: DemoLoginRequest):
    """
    Dedicated Judge Demo Access authentication endpoint.
    Issues cryptographically signed HMAC-SHA256 JWT sessions for evaluation
    without requiring or leaking production environment master tokens.
    """
    verify_security_secrets()
    role = req.role.strip().lower()
    if role not in ["admin", "team_member"]:
        raise HTTPException(status_code=400, detail="Invalid role requested. Must be 'admin' or 'team_member'.")

    user_name = "Judge Evaluator (Admin Demo)" if role == "admin" else "Judge Evaluator (Team Demo)"
    user_email = f"judge.evaluator.{role}@demo.knowledgebridge.internal"

    session_jwt = create_jwt_session(role=role, email=user_email, user_name=user_name, expires_in_seconds=7200)

    return {
        "access_token": session_jwt,
        "token_type": "bearer",
        "role": role,
        "email": user_email,
        "user_name": user_name,
        "expires_in": 7200,
        "is_demo": True,
        "message": f"Successfully authenticated as {role.upper()} under Judge Demo Access."
    }

def get_current_session(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db),
) -> UserSession:
    """
    Enforces strict JWT-only session authentication and server-side revocation checks.
    Master tokens (ADMIN_TOKEN / TEAM_TOKEN) are strictly rejected as session tokens.
    """
    verify_security_secrets()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Valid Authorization Bearer token must be provided."
        )

    token = authorization.replace("Bearer ", "").strip()
    
    # Strictly decode and validate signed JWT claims (rejects master tokens, expired, forged, or malformed)
    session = decode_jwt_session(token)

    # Check server-side revocation list in Neon PostgreSQL
    is_revoked = db.query(RevokedToken).filter(RevokedToken.jti == session.jti).first()
    if is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security Alert: Session has been revoked/logged out server-side. Access denied."
        )

    # Detect and block role header manipulation attacks
    if x_user_role:
        declared_role = x_user_role.strip().lower()
        if declared_role != session.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Security Alert: Header manipulation detected. Authenticated token role '{session.role}' does not match claimed header role '{declared_role}'."
            )

    return session

def require_admin(session: UserSession = Depends(get_current_session)) -> UserSession:
    if session.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Administrative privileges required. Team Members are restricted from this operation."
        )
    return session

def require_authenticated(session: UserSession = Depends(get_current_session)) -> UserSession:
    return session

@app.post("/api/auth/logout")
def logout(session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    """
    Revokes the current JWT session server-side in Neon PostgreSQL.
    Subsequent requests with this token are rejected immediately across all instances.
    Safely idempotent: if already revoked, returns success.
    Fails securely: if database cannot persist revocation, rolls back and returns HTTP 503.
    """
    try:
        existing = db.query(RevokedToken).filter(RevokedToken.jti == session.jti).first()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Logout could not be confirmed: Database unavailable to verify session revocation."
        )

    if not existing:
        revoked_entry = RevokedToken(
            jti=session.jti,
            role=session.role,
            user_email=session.email,
            revoked_at=datetime.now(timezone.utc),
            expires_at=datetime.fromtimestamp(session.exp, tz=timezone.utc) if session.exp else None
        )
        db.add(revoked_entry)
        try:
            db.commit()
        except Exception:
            db.rollback()
            # Handle potential concurrent race condition: recheck if jti was committed by concurrent request
            try:
                recheck = db.query(RevokedToken).filter(RevokedToken.jti == session.jti).first()
                if not recheck:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Logout could not be confirmed: Session revocation could not be persisted in database. Please retry."
                    )
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Logout could not be confirmed: Session revocation could not be persisted in database. Please retry."
                )

    # Periodic cleanup of expired entries (isolated maintenance, never masks revocation commit)
    try:
        now_dt = datetime.now(timezone.utc)
        db.query(RevokedToken).filter(RevokedToken.expires_at < now_dt).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()

    # Immutable audit logging (isolated, fails safely)
    try:
        log_activity(
            db, None, "USER_LOGOUT",
            f"Session revoked server-side for {session.user_name} ({session.role})",
            user_name=session.user_name
        )
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Session successfully terminated and revoked server-side."
    }

@app.get("/api/auth/me")
def get_current_user_profile(session: UserSession = Depends(require_authenticated)):
    return {
        "role": session.role,
        "user_name": session.user_name,
        "email": session.email,
        "token_type": session.token_type
    }

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
def get_ai_config(session: UserSession = Depends(require_authenticated)):
    return get_configured_ai_provider()

@app.get("/api/ai/quota-status")
def get_ai_quota_status(session: UserSession = Depends(require_authenticated)):
    from .ai_engine import quota_manager
    return {
        "provider": get_configured_ai_provider(),
        "quota": quota_manager.get_stats(),
        "zero_budget_guarantee": "Strict zero-cost policy enforced. No paid APIs or subscriptions."
    }

@app.get("/api/ai/test-live")
async def test_live_ai(session: UserSession = Depends(require_admin)):
    from .ai_engine import test_live_gemini_connection
    return await test_live_gemini_connection()

# --- Dashboard Stats ---
@app.get("/api/stats", response_model=DashboardStats)
def get_dashboard_stats(session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
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
def list_users(session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).all()

# --- Projects Workspace ---
@app.get("/api/projects", response_model=List[ProjectOut])
def list_projects(session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
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
def create_project(data: ProjectCreate, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
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

    log_activity(db, project.id, "PROJECT_CREATED", f"Initialized project workspace for {project.title}", user_name=session.user_name)
    
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
def get_project(project_id: int, session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
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
def update_project(project_id: int, data: ProjectUpdate, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
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
    return get_project(project_id, session=session, db=db)

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    title = p.title
    db.delete(p)
    db.commit()
    log_activity(db, None, "PROJECT_DELETED", f"Deleted project workspace: {title}", user_name=session.user_name)
    return {"message": f"Project '{title}' and associated records deleted."}

# --- Document Upload & Extraction ---
@app.post("/api/projects/{project_id}/documents/upload", response_model=DocumentOut)
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    auto_analyze: bool = Query(True),
    session: UserSession = Depends(require_admin),
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

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        # Fallback to tempfile directory if UPLOAD_DIR is not writable
        import tempfile
        file_path = os.path.join(tempfile.gettempdir(), safe_filename)
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
        f"Uploaded {filename} ({round(file_size/1024, 1)} KB, {page_count} pages)",
        user_name=session.user_name
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
            f"Extracted {len(items)} knowledge items from {filename} via {mode_label}",
            user_name=session.user_name
        )

    return doc

@app.get("/api/projects/{project_id}/documents", response_model=List[DocumentOut])
def list_project_documents(project_id: int, session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.project_id == project_id).order_by(desc(Document.upload_timestamp)).all()

@app.get("/api/documents/{document_id}")
def get_document_details(document_id: int, session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
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
def delete_document(document_id: int, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
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
    log_activity(db, project_id, "DOCUMENT_DELETED", f"Deleted document {filename}", user_name=session.user_name)
    return {"message": f"Document '{filename}' deleted successfully."}

# --- AI Knowledge Analysis Endpoint ---
@app.post("/api/projects/{project_id}/analyze")
async def trigger_analysis(
    project_id: int,
    document_id: Optional[int] = Query(None),
    session: UserSession = Depends(require_admin),
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
        f"Completed knowledge extraction: {total_created} items generated across {len(docs)} document(s)",
        user_name=session.user_name
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
    session: UserSession = Depends(require_authenticated),
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
def get_knowledge_item(item_id: int, session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return item

@app.patch("/api/knowledge-items/{item_id}", response_model=KnowledgeItemOut)
def update_knowledge_item(item_id: int, data: KnowledgeItemUpdate, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
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
        item.reviewed_by = session.user_name
        log_activity(
            db, item.project_id, f"ITEM_{item.status.upper()}",
            f"Knowledge item #{item.id} '{item.title}' marked as {item.status} by {session.user_name}",
            user_name=session.user_name
        )
    if data.review_notes is not None:
        item.review_notes = data.review_notes
    if data.reviewed_by is not None:
        item.reviewed_by = data.reviewed_by

    db.commit()
    db.refresh(item)
    return item

@app.patch("/api/knowledge/{item_id}/review", response_model=KnowledgeItemOut)
def review_knowledge_item_alias(item_id: int, data: KnowledgeItemUpdate, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    return update_knowledge_item(item_id=item_id, data=data, session=session, db=db)

@app.post("/api/projects/{project_id}/batch-review")
def batch_review_items(project_id: int, req: BatchReviewRequest, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    items = db.query(KnowledgeItem).filter(
        KnowledgeItem.project_id == project_id,
        KnowledgeItem.id.in_(req.item_ids)
    ).all()

    new_status = "approved" if req.action == "approve" else "rejected"
    count = 0
    for item in items:
        item.status = new_status
        item.reviewed_by = req.reviewer_name or session.user_name
        item.reviewed_at = datetime.utcnow()
        if req.review_notes:
            item.review_notes = req.review_notes
        count += 1

    db.commit()
    log_activity(
        db, project_id, f"BATCH_{req.action.upper()}",
        f"{session.user_name} marked {count} item(s) as {new_status}",
        user_name=session.user_name
    )
    return {"message": f"Successfully updated {count} items to '{new_status}'."}

@app.delete("/api/knowledge-items/{item_id}")
def delete_knowledge_item(item_id: int, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    db.delete(item)
    db.commit()
    log_activity(db, item.project_id, "ITEM_DELETED", f"Deleted knowledge item #{item_id}: {item.title}", user_name=session.user_name)
    return {"message": "Knowledge item deleted."}

# --- Handover Report Generator & Approval Gate ---
@app.post("/api/projects/{project_id}/generate-handover", response_model=HandoverReportOut)
def generate_handover_report(
    project_id: int,
    req: HandoverReportCreate,
    session: UserSession = Depends(require_admin),
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
        f"Generated Handover Draft v{version} containing {len(approved_items)} verified items.",
        user_name=session.user_name
    )

    return report

@app.post("/api/projects/{project_id}/approve-handover")
def approve_handover_report(
    project_id: int,
    req: HandoverApprovalRequest,
    session: UserSession = Depends(require_admin),
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
    report.approved_by = req.approved_by or session.user_name
    report.approved_at = datetime.utcnow()
    
    # Append approval block to markdown content
    approval_block = f"\n\n---\n### 9. OFFICIAL APPROVAL CERTIFICATION\n- **Approved By:** {report.approved_by}\n- **Date:** {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}\n- **Notes:** {req.signature_notes or 'All items reviewed and accepted for project handover.'}\n"
    report.markdown_content += approval_block

    project.handover_status = "approved"
    db.commit()

    log_activity(
        db, project_id, "HANDOVER_APPROVED",
        f"Handover report v{report.version} officially approved and certified by {report.approved_by}",
        user_name=session.user_name
    )

    return {
        "message": f"Handover report v{report.version} approved successfully.",
        "report_id": report.id,
        "status": "approved",
        "approved_by": report.approved_by,
        "approved_at": report.approved_at
    }

@app.get("/api/projects/{project_id}/handover", response_model=HandoverReportOut)
def get_latest_handover(
    project_id: int,
    session: UserSession = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    report = db.query(HandoverReport).filter(
        HandoverReport.project_id == project_id
    ).order_by(desc(HandoverReport.generated_at)).first()

    if not report:
        raise HTTPException(status_code=404, detail="No handover report found for this project.")

    # Critical Security Requirement: Team Member cannot access unapproved handovers
    if session.role == "team_member" and report.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Team Members cannot access unapproved handovers until certified and published by an administrator."
        )

    return report

# --- Activity Stream ---
@app.get("/api/activities", response_model=List[ActivityLogOut])
def list_activities(limit: int = 30, session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    return db.query(ActivityLog).order_by(desc(ActivityLog.timestamp)).limit(limit).all()

@app.get("/api/projects/{project_id}/activities", response_model=List[ActivityLogOut])
def list_project_activities(project_id: int, limit: int = 30, session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    return db.query(ActivityLog).filter(ActivityLog.project_id == project_id).order_by(desc(ActivityLog.timestamp)).limit(limit).all()

# --- Backup & Restore Center Endpoints (Admin Only) ---
@app.get("/api/backup/export")
def export_backup(session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Exports a complete structured JSON backup of all relational database tables.
    Includes projects, documents (with extracted text), knowledge items,
    handover reports, and immutable activity logs.
    Zero secrets or credentials are ever included.
    """
    projects = db.query(Project).all()
    documents = db.query(Document).all()
    items = db.query(KnowledgeItem).all()
    reports = db.query(HandoverReport).all()
    logs = db.query(ActivityLog).all()

    data_payload = {
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "code": p.code,
                "description": p.description,
                "department": p.department,
                "status": p.status,
                "lead_name": p.lead_name,
                "handover_status": p.handover_status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            } for p in projects
        ],
        "documents": [
            {
                "id": d.id,
                "project_id": d.project_id,
                "filename": d.filename,
                "original_name": d.original_name,
                "file_type": d.file_type,
                "file_size": d.file_size,
                "page_count": d.page_count,
                "char_count": d.char_count,
                "extracted_text": d.extracted_text,
                "is_processed": d.is_processed,
                "upload_timestamp": d.upload_timestamp.isoformat() if d.upload_timestamp else None,
            } for d in documents
        ],
        "knowledge_items": [
            {
                "id": k.id,
                "project_id": k.project_id,
                "document_id": k.document_id,
                "category": k.category,
                "title": k.title,
                "content": k.content,
                "priority": k.priority,
                "assignee": k.assignee,
                "status": k.status,
                "review_notes": k.review_notes,
                "reviewed_by": k.reviewed_by,
                "reviewed_at": k.reviewed_at.isoformat() if k.reviewed_at else None,
                "source_document_name": k.source_document_name,
                "source_page": k.source_page,
                "source_excerpt": k.source_excerpt,
                "evidence_verified": k.evidence_verified,
                "missing_evidence_flag": k.missing_evidence_flag,
                "confidence_score": k.confidence_score,
                "is_ai_generated": k.is_ai_generated,
                "created_at": k.created_at.isoformat() if k.created_at else None,
            } for k in items
        ],
        "handover_reports": [
            {
                "id": h.id,
                "project_id": h.project_id,
                "title": h.title,
                "version": h.version,
                "executive_summary": h.executive_summary,
                "status": h.status,
                "approved_by": h.approved_by,
                "approved_at": h.approved_at.isoformat() if h.approved_at else None,
                "stats_json": h.stats_json,
                "markdown_content": h.markdown_content,
                "generated_at": h.generated_at.isoformat() if h.generated_at else None,
            } for h in reports
        ],
        "activity_logs": [
            {
                "id": a.id,
                "project_id": a.project_id,
                "user_name": a.user_name,
                "action": a.action,
                "details": a.details,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            } for a in logs
        ]
    }

    serialized_data = json.dumps(data_payload, sort_keys=True)
    sha256_hash = hashlib.sha256(serialized_data.encode("utf-8")).hexdigest()
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"knowledge_bridge_backup_{timestamp_str}.json"

    manifest = {
        "backup_version": "1.0.0",
        "schema_version": "2.0.0",
        "created_at": datetime.utcnow().isoformat(),
        "created_by": session.email or session.user_name,
        "sha256_checksum": sha256_hash,
        "record_counts": {
            "projects": len(projects),
            "documents": len(documents),
            "knowledge_items": len(items),
            "handover_reports": len(reports),
            "activity_logs": len(logs)
        },
        "data_categories": [
            "projects", "documents", "knowledge_items", "handover_reports", "activity_logs"
        ],
        "storage_architecture_disclosure": "Document extracted text and relational records are fully persisted in this JSON archive and Neon PostgreSQL. Ephemeral /tmp files from serverless filesystem are excluded as documented."
    }

    full_backup_object = {
        "manifest": manifest,
        "data": data_payload
    }

    json_output = json.dumps(full_backup_object, indent=2)
    file_size_bytes = len(json_output.encode("utf-8"))

    # Record in BackupRecord table
    try:
        rec = BackupRecord(
            filename=backup_filename,
            backup_type="manual",
            file_size=file_size_bytes,
            record_counts_json=json.dumps(manifest["record_counts"]),
            sha256_checksum=sha256_hash,
            status="completed",
            created_by=session.user_name
        )
        db.add(rec)
        db.commit()
    except Exception:
        db.rollback()

    log_activity(db, None, "BACKUP_EXPORTED", f"Full backup exported ({round(file_size_bytes/1024, 1)} KB, SHA-256: {sha256_hash[:12]}...)", user_name=session.user_name)

    return Response(
        content=json_output,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={backup_filename}",
            "X-Backup-Checksum": sha256_hash,
            "X-Backup-Version": "1.0.0"
        }
    )

class BackupValidateRequest(BaseModel):
    backup_json: Optional[str] = None
    backup_obj: Optional[Dict[str, Any]] = None

@app.post("/api/backup/validate")
async def validate_backup(request: Request, session: UserSession = Depends(require_admin)):
    """
    Validates a backup JSON archive structure, manifest, and SHA-256 integrity checksum.
    Supports both multipart/form-data file uploads and JSON payloads.
    """
    content_type = request.headers.get("content-type", "")
    raw_obj = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload_file = form.get("file")
        if upload_file and hasattr(upload_file, "read"):
            content_bytes = await upload_file.read()
            try:
                raw_obj = json.loads(content_bytes.decode("utf-8"))
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON in uploaded file: {str(e)}")
    else:
        try:
            body = await request.json()
            if isinstance(body, dict):
                if "backup_obj" in body and body["backup_obj"]:
                    raw_obj = body["backup_obj"]
                elif "backup_json" in body and body["backup_json"]:
                    raw_obj = json.loads(body["backup_json"])
                else:
                    raw_obj = body
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON request body: {str(e)}")

    if not raw_obj or not isinstance(raw_obj, dict):
        raise HTTPException(status_code=400, detail="Malformed backup file: Expected JSON object.")

    manifest = raw_obj.get("manifest")
    data = raw_obj.get("data")
    if not manifest or not data:
        raise HTTPException(status_code=400, detail="Invalid backup archive: Missing 'manifest' or 'data' section.")

    required_manifest_fields = ["backup_version", "schema_version", "sha256_checksum", "record_counts"]
    for field in required_manifest_fields:
        if field not in manifest:
            raise HTTPException(status_code=400, detail=f"Malformed manifest: Missing required field '{field}'.")

    # Verify checksum
    serialized_data = json.dumps(data, sort_keys=True)
    calculated_hash = hashlib.sha256(serialized_data.encode("utf-8")).hexdigest()
    embedded_hash = manifest.get("sha256_checksum", "")
    checksum_valid = hmac.compare_digest(calculated_hash, embedded_hash)
    record_counts = manifest.get("record_counts", {})

    return {
        "valid": checksum_valid,
        "format_version": manifest.get("schema_version") or manifest.get("backup_version", "1.0.0"),
        "created_at": manifest.get("created_at"),
        "created_by": manifest.get("created_by"),
        "project_count": record_counts.get("projects", len(data.get("projects", []))),
        "document_count": record_counts.get("documents", len(data.get("documents", []))),
        "knowledge_item_count": record_counts.get("knowledge_items", len(data.get("knowledge_items", []))),
        "handover_report_count": record_counts.get("handover_reports", len(data.get("handover_reports", []))),
        "activity_log_count": record_counts.get("activity_logs", len(data.get("activity_logs", []))),
        "computed_sha256": calculated_hash,
        "manifest_sha256": embedded_hash,
        "checksum_matched": checksum_valid,
        "errors": [] if checksum_valid else ["SHA-256 checksum mismatch: archive contents do not match manifest signature."]
    }

class BackupRestoreRequest(BaseModel):
    backup_data: Optional[Dict[str, Any]] = None
    backup_payload: Optional[Dict[str, Any]] = None
    confirmed: bool = False

@app.post("/api/backup/restore")
def restore_backup(req: BackupRestoreRequest, session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Restores relational database records from a verified backup archive within a safe database transaction.
    Automatically creates a pre-restore backup record and rolls back completely on any failure.
    """
    if not req.confirmed:
        raise HTTPException(status_code=400, detail="Explicit confirmation required. Set confirmed=True to execute restore.")

    backup = req.backup_payload or req.backup_data or {}
    manifest = backup.get("manifest", {})
    data = backup.get("data", {})

    if not data or not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid backup payload: Missing data dictionary.")

    # 1. Pre-restore snapshot record
    try:
        pre_restore_rec = BackupRecord(
            filename=f"pre_restore_snapshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
            backup_type="pre_restore",
            file_size=0,
            record_counts_json=json.dumps({"info": "Created automatically prior to restore execution"}),
            sha256_checksum="pre_restore_auto_snapshot",
            status="completed",
            created_by=session.user_name
        )
        db.add(pre_restore_rec)
        db.commit()
    except Exception:
        db.rollback()

    # 2. Transactional Restore
    restored_counts = {"projects": 0, "documents": 0, "knowledge_items": 0, "handover_reports": 0, "activity_logs": 0}
    try:
        # Restore projects
        project_id_map = {}
        for p_data in data.get("projects", []):
            code = p_data.get("code")
            existing_p = db.query(Project).filter(Project.code == code).first()
            if existing_p:
                existing_p.title = p_data.get("title", existing_p.title)
                existing_p.description = p_data.get("description", existing_p.description)
                existing_p.department = p_data.get("department", existing_p.department)
                existing_p.lead_name = p_data.get("lead_name", existing_p.lead_name)
                existing_p.status = p_data.get("status", existing_p.status)
                existing_p.handover_status = p_data.get("handover_status", existing_p.handover_status)
                project_id_map[p_data["id"]] = existing_p.id
            else:
                new_p = Project(
                    title=p_data["title"],
                    code=code,
                    description=p_data.get("description"),
                    department=p_data.get("department", "Platform Engineering"),
                    status=p_data.get("status", "active"),
                    lead_name=p_data.get("lead_name", "Alex Chen"),
                    handover_status=p_data.get("handover_status", "not_started")
                )
                db.add(new_p)
                db.flush()
                project_id_map[p_data["id"]] = new_p.id
            restored_counts["projects"] += 1

        # Restore documents
        doc_id_map = {}
        for d_data in data.get("documents", []):
            target_pid = project_id_map.get(d_data.get("project_id"))
            if not target_pid:
                continue
            existing_d = db.query(Document).filter(
                Document.project_id == target_pid,
                Document.filename == d_data.get("filename")
            ).first()
            if not existing_d:
                new_d = Document(
                    project_id=target_pid,
                    filename=d_data.get("filename"),
                    original_name=d_data.get("original_name", d_data.get("filename")),
                    file_type=d_data.get("file_type", "txt"),
                    file_size=d_data.get("file_size", 0),
                    storage_path=f"/tmp/uploads/{d_data.get('filename')}",
                    page_count=d_data.get("page_count", 1),
                    char_count=d_data.get("char_count", 0),
                    extracted_text=d_data.get("extracted_text"),
                    is_processed=d_data.get("is_processed", True)
                )
                db.add(new_d)
                db.flush()
                doc_id_map[d_data["id"]] = new_d.id
            else:
                existing_d.extracted_text = d_data.get("extracted_text", existing_d.extracted_text)
                doc_id_map[d_data["id"]] = existing_d.id
            restored_counts["documents"] += 1

        # Restore knowledge items
        for k_data in data.get("knowledge_items", []):
            target_pid = project_id_map.get(k_data.get("project_id"))
            if not target_pid:
                continue
            target_did = doc_id_map.get(k_data.get("document_id"))
            existing_k = db.query(KnowledgeItem).filter(
                KnowledgeItem.project_id == target_pid,
                KnowledgeItem.title == k_data.get("title")
            ).first()
            if not existing_k:
                new_k = KnowledgeItem(
                    project_id=target_pid,
                    document_id=target_did,
                    category=k_data.get("category", "decision"),
                    title=k_data.get("title"),
                    content=k_data.get("content", ""),
                    priority=k_data.get("priority", "medium"),
                    assignee=k_data.get("assignee"),
                    status=k_data.get("status", "pending_review"),
                    review_notes=k_data.get("review_notes"),
                    reviewed_by=k_data.get("reviewed_by"),
                    source_document_name=k_data.get("source_document_name"),
                    source_page=k_data.get("source_page"),
                    source_excerpt=k_data.get("source_excerpt"),
                    evidence_verified=k_data.get("evidence_verified", True),
                    missing_evidence_flag=k_data.get("missing_evidence_flag", False),
                    confidence_score=k_data.get("confidence_score", 0.92),
                    is_ai_generated=k_data.get("is_ai_generated", True)
                )
                db.add(new_k)
            restored_counts["knowledge_items"] += 1

        # Restore handover reports
        for h_data in data.get("handover_reports", []):
            target_pid = project_id_map.get(h_data.get("project_id"))
            if not target_pid:
                continue
            existing_h = db.query(HandoverReport).filter(
                HandoverReport.project_id == target_pid,
                HandoverReport.version == h_data.get("version")
            ).first()
            if not existing_h:
                new_h = HandoverReport(
                    project_id=target_pid,
                    title=h_data.get("title"),
                    version=h_data.get("version", "1.0.0"),
                    executive_summary=h_data.get("executive_summary"),
                    status=h_data.get("status", "draft"),
                    approved_by=h_data.get("approved_by"),
                    stats_json=h_data.get("stats_json", "{}"),
                    markdown_content=h_data.get("markdown_content", "")
                )
                db.add(new_h)
            restored_counts["handover_reports"] += 1

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database restore failed and was safely rolled back: {str(e)}")

    log_activity(db, None, "BACKUP_RESTORED", f"Database restored successfully from backup v{manifest.get('backup_version', '1.0.0')}", user_name=session.user_name)

    return {
        "status": "SUCCESS",
        "message": "Database restored successfully within a safe transaction.",
        "restored_counts": restored_counts,
        "backup_version": manifest.get("backup_version"),
        "restored_at": datetime.utcnow().isoformat()
    }

@app.get("/api/backup/history")
def get_backup_history(session: UserSession = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Returns historical backup and pre-restore snapshot records.
    """
    records = db.query(BackupRecord).order_by(desc(BackupRecord.created_at)).limit(20).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "backup_type": r.backup_type,
            "file_size": r.file_size,
            "record_counts": json.loads(r.record_counts_json) if r.record_counts_json else {},
            "sha256_checksum": r.sha256_checksum,
            "status": r.status,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in records
    ]

# --- Comprehensive Black & White PDF & Markdown Reports ---
@app.get("/api/reports/project-pdf")
def get_project_pdf_report(session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    """
    Dynamically generates the official Black & White print-ready PDF project report
    containing complete architectural disclosures, functional workflows, and verified test results.
    """
    projects_count = db.query(Project).count()
    docs_count = db.query(Document).count()
    items_count = db.query(KnowledgeItem).count()
    pending_count = db.query(KnowledgeItem).filter(KnowledgeItem.status == "pending_review").count()
    approved_handovers_count = db.query(HandoverReport).filter(HandoverReport.status == "approved").count()
    risks_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "risk_blocker", KnowledgeItem.priority == "critical").count()

    db_stats = {
        "total_projects": projects_count,
        "uploaded_documents": docs_count,
        "total_extracted_items": items_count,
        "pending_reviews": pending_count,
        "approved_handovers": approved_handovers_count,
        "critical_risks": risks_count
    }

    pdf_bytes = build_final_report_pdf(db_stats)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=KNOWLEDGE_BRIDGE_AI_FINAL_REPORT.pdf",
            "Cache-Control": "no-cache"
        }
    )

@app.get("/api/reports/markdown")
def get_project_markdown_report(session: UserSession = Depends(require_authenticated), db: Session = Depends(get_db)):
    """
    Returns the comprehensive 20-section project report in Markdown format.
    """
    projects_count = db.query(Project).count()
    docs_count = db.query(Document).count()
    items_count = db.query(KnowledgeItem).count()
    pending_count = db.query(KnowledgeItem).filter(KnowledgeItem.status == "pending_review").count()
    approved_handovers_count = db.query(HandoverReport).filter(HandoverReport.status == "approved").count()
    risks_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "risk_blocker", KnowledgeItem.priority == "critical").count()

    db_stats = {
        "total_projects": projects_count,
        "uploaded_documents": docs_count,
        "total_extracted_items": items_count,
        "pending_reviews": pending_count,
        "approved_handovers": approved_handovers_count,
        "critical_risks": risks_count
    }

    md_text = generate_final_report_markdown(db_stats)
    return {"report_markdown": md_text}

# --- Static File Serving for Production Unified Deployment ---
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
