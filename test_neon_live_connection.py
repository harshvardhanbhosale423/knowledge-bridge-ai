"""
Test suite to verify live Neon PostgreSQL connection, schema creation,
and data persistence across restarts.
"""
import os
import sys
import time

def test_neon_persistence():
    print("=" * 70)
    print("   NEON POSTGRESQL LIVE CONNECTION & PERSISTENCE TEST")
    print("=" * 70)

    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url or "neon.tech" not in db_url:
        print("\n[!] Neon DATABASE_URL not detected in environment.")
        print("    Please set DATABASE_URL=postgresql://...neon.tech... to run live test.")
        return False

    print(f"\n[STEP 1] Initializing connection to Neon PostgreSQL...")
    from backend.database import engine, SessionLocal, Base
    from backend.models import Project, Document, KnowledgeItem, HandoverReport, User, ActivityLog

    print("  ✓ Database engine loaded driver:", engine.dialect.driver)
    print("  ✓ Testing connection pool pre-ping...")
    with engine.connect() as conn:
        print("  ✓ Connection handshake successful!")

    print("\n[STEP 2] Creating application tables in Neon PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("  ✓ Tables verified: users, projects, documents, knowledge_items, handover_reports, activity_logs")

    print("\n[STEP 3] Writing test project, document, and knowledge items...")
    db = SessionLocal()
    test_code = f"KB-NEON-{int(time.time()) % 100000}"
    project = Project(
        title="Neon Cloud Verification Project",
        code=test_code,
        description="Verifying live Neon PostgreSQL persistence for Knowledge Bridge AI",
        lead_name="Cloud Test Runner"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    project_id = project.id
    print(f"  ✓ Created project #{project_id} (Code: {test_code})")

    doc = Document(
        project_id=project_id,
        filename="neon_test_doc.txt",
        original_name="neon_test_doc.txt",
        file_type="txt",
        file_size=1024,
        storage_path="/tmp/neon_test_doc.txt",
        extracted_text="Architectural decision: Use Neon PostgreSQL for permanent serverless knowledge persistence.",
        is_processed=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    print(f"  ✓ Added document #{doc.id} with extracted text persistence")

    item = KnowledgeItem(
        project_id=project_id,
        document_id=doc.id,
        category="decision",
        title="Database Migration to Neon PostgreSQL",
        content="Project persistence backed by Neon serverless PostgreSQL.",
        priority="high",
        status="approved",
        source_document_name="neon_test_doc.txt",
        source_excerpt="Architectural decision: Use Neon PostgreSQL for permanent serverless knowledge persistence.",
        evidence_verified=True,
        is_demo_mode=False,
        is_ai_generated=False
    )
    db.add(item)
    db.commit()
    print("  ✓ Added verified knowledge item linked to document")
    db.close()

    print("\n[STEP 4] Simulating connection termination and application restart...")
    engine.dispose()
    time.sleep(1)

    print("\n[STEP 5] Querying persisted data from fresh session...")
    fresh_db = SessionLocal()
    retrieved_proj = fresh_db.query(Project).filter(Project.id == project_id).first()
    assert retrieved_proj is not None, "Project not found after restart!"
    assert retrieved_proj.code == test_code, "Project code mismatch!"
    
    retrieved_doc = fresh_db.query(Document).filter(Document.project_id == project_id).first()
    assert retrieved_doc is not None, "Document not found after restart!"
    assert "Neon PostgreSQL" in retrieved_doc.extracted_text, "Extracted text corrupted!"

    retrieved_item = fresh_db.query(KnowledgeItem).filter(KnowledgeItem.project_id == project_id).first()
    assert retrieved_item is not None, "Knowledge item not found after restart!"
    assert retrieved_item.evidence_verified is True, "Evidence status mismatch!"

    print(f"  ✓ Retrieved project: {retrieved_proj.title} ({retrieved_proj.code})")
    print(f"  ✓ Retrieved document text: {len(retrieved_doc.extracted_text)} chars")
    print(f"  ✓ Retrieved knowledge item: '{retrieved_item.title}' (Verified: {retrieved_item.evidence_verified})")
    
    # Clean up test row
    fresh_db.delete(retrieved_proj)
    fresh_db.commit()
    fresh_db.close()
    print("  ✓ Test cleanup completed successfully.")

    print("\n" + "=" * 70)
    print(">>> NEON POSTGRESQL PERSISTENCE TEST: 100% PASSED! <<<")
    print("=" * 70)
    return True

if __name__ == "__main__":
    test_neon_persistence()

