import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

# Detect Vercel serverless environment
IS_VERCEL = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

raw_db_url = os.getenv("DATABASE_URL", "").strip()

if raw_db_url:
    # Neon or external PostgreSQL URL normalization
    if raw_db_url.startswith("postgres://"):
        DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
    else:
        DATABASE_URL = raw_db_url

    # Serverless-friendly engine options for PostgreSQL / Neon
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Tests connection liveness before borrowing from pool
        pool_recycle=300,        # Recycles connections every 5 mins to prevent stale drops
        pool_size=5,             # Conservative pool for serverless instances
        max_overflow=10,
        echo=False
    )
    logger.info("Database configured: Connected to external PostgreSQL (Neon)")
else:
    # Zero-Cost Local SQLite Fallback
    # On Vercel, the app root is read-only; use /tmp for SQLite
    if IS_VERCEL:
        DATABASE_URL = "sqlite:////tmp/knowledge_bridge.db"
    else:
        DATABASE_URL = "sqlite:///./knowledge_bridge.db"

    connect_args = {"check_same_thread": False, "timeout": 20}
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
    logger.info(f"Database configured: Connected to local SQLite ({DATABASE_URL})")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
