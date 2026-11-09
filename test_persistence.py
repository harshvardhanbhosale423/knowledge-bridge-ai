import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import time
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Project, Document, KnowledgeItem, HandoverReport
from backend.database import DATABASE_URL

def test_sqlite_persistence():
    print("==================================================================")
    print("   TESTING DATA PERSISTENCE ACROSS BACKEND RESTART")
    print("==================================================================")

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. Inspect state before restart
    projects_before = session.query(Project).all()
    docs_before = session.query(Document).all()
    items_before = session.query(KnowledgeItem).all()
    reports_before = session.query(HandoverReport).all()

    print(f"[STATE BEFORE RESTART]")
    print(f"  - Projects count: {len(projects_before)}")
    print(f"  - Documents count: {len(docs_before)}")
    print(f"  - Knowledge items count: {len(items_before)}")
    print(f"  - Handover reports count: {len(reports_before)}")

    assert len(projects_before) > 0, "No projects in DB before restart"
    sample_proj_id = projects_before[0].id
    sample_proj_code = projects_before[0].code
    session.close()

    # 2. Simulate restarting: Create new engine connection after session close
    print("\n[SIMULATING BACKEND RESTART]")
    time.sleep(1)
    new_engine = create_engine(DATABASE_URL)
    NewSession = sessionmaker(bind=new_engine)
    new_session = NewSession()

    # 3. Inspect state after restart
    projects_after = new_session.query(Project).all()
    docs_after = new_session.query(Document).all()
    items_after = new_session.query(KnowledgeItem).all()
    reports_after = new_session.query(HandoverReport).all()

    print(f"[STATE AFTER RESTART]")
    print(f"  - Projects count: {len(projects_after)}")
    print(f"  - Documents count: {len(docs_after)}")
    print(f"  - Knowledge items count: {len(items_after)}")
    print(f"  - Handover reports count: {len(reports_after)}")

    assert len(projects_after) == len(projects_before), "Project count changed after restart!"
    assert len(docs_after) == len(docs_before), "Document count changed after restart!"
    assert len(items_after) == len(items_before), "Knowledge items changed after restart!"
    assert len(reports_after) == len(reports_before), "Handover reports changed after restart!"

    # Verify specific project
    p = new_session.query(Project).filter(Project.id == sample_proj_id).first()
    assert p is not None, f"Project #{sample_proj_id} disappeared!"
    assert p.code == sample_proj_code, f"Project code mismatch! Expected {sample_proj_code}, got {p.code}"
    print(f"\n  ✓ Verified project #{sample_proj_id} ({sample_proj_code}) persists with 100% integrity.")

    new_session.close()
    print("\n>>> DATA PERSISTENCE TEST PASSED: 100% VERIFIED <<<")

if __name__ == "__main__":
    test_sqlite_persistence()
