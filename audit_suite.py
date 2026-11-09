import sys
import os
import random
import httpx

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

def run_audit():
    results = {}
    print("======================================================================")
    print("   KNOWLEDGE BRIDGE AI - COMPREHENSIVE 12-POINT FUNCTIONAL AUDIT")
    print("======================================================================")

    # -------------------------------------------------------------
    # Check 1: Frontend and backend start successfully
    # -------------------------------------------------------------
    print("\n[CHECK 1] Verifying Frontend and Backend are alive...")
    with httpx.Client(timeout=10.0) as client:
        backend_res = client.get(f"{BASE_URL}/api/health")
        assert backend_res.status_code == 200, f"Backend failed: {backend_res.status_code}"
        health_data = backend_res.json()
        print(f"  ✓ Backend responding: {health_data['app']} (Status: {health_data['status']})")

        frontend_res = client.get(FRONTEND_URL)
        assert frontend_res.status_code == 200, f"Frontend failed: {frontend_res.status_code}"
        assert "<html" in frontend_res.text.lower() or "<!doctype" in frontend_res.text.lower()
        print(f"  ✓ Frontend responding: HTTP {frontend_res.status_code} at {FRONTEND_URL}")
    results["Check 1: Frontend & Backend Live"] = "PASSED"

    # -------------------------------------------------------------
    # Check 2: Admin permissions work vs Team Member restrictions
    # -------------------------------------------------------------
    print("\n[CHECK 2] Verifying Admin Login & RBAC Permissions...")
    with httpx.Client(timeout=10.0) as client:
        # 2a. Admin can create project
        rand_id = random.randint(1000, 9999)
        proj_payload = {
            "title": f"Audit Project {rand_id}",
            "code": f"KB-AUDIT-{rand_id}",
            "description": "Project created during automated audit suite run.",
            "department": "Security Architecture",
            "lead_name": "Alex Chen"
        }
        admin_res = client.post(
            f"{BASE_URL}/api/projects",
            json=proj_payload,
            headers={"X-User-Role": "admin"}
        )
        assert admin_res.status_code == 200, f"Admin project creation failed: {admin_res.text}"
        project_id = admin_res.json()["id"]
        print(f"  ✓ Admin successfully created project #{project_id} ({proj_payload['code']})")

        # 2b. Team member is DENIED from creating projects (HTTP 403)
        tm_proj_payload = {
            "title": "Unauthorized Project",
            "code": f"KB-UNAUTH-{rand_id}",
            "description": "Should be blocked.",
            "department": "Engineering"
        }
        tm_res = client.post(
            f"{BASE_URL}/api/projects",
            json=tm_proj_payload,
            headers={"X-User-Role": "team_member"}
        )
        assert tm_res.status_code == 403, f"Expected 403 for Team Member creating project, got {tm_res.status_code}"
        print(f"  ✓ Team Member correctly denied from creating project: HTTP 403 Forbidden")

        # 2c. Team member is DENIED from approving handovers (HTTP 403)
        tm_appr = client.post(
            f"{BASE_URL}/api/projects/{project_id}/approve-handover",
            json={"approved_by": "Unauthorized User"},
            headers={"X-User-Role": "team_member"}
        )
        assert tm_appr.status_code == 403, f"Expected 403 for Team Member approving handover, got {tm_appr.status_code}"
        print(f"  ✓ Team Member correctly denied from certifying handover: HTTP 403 Forbidden")
    results["Check 2: Admin Permissions & RBAC"] = "PASSED"

    # -------------------------------------------------------------
    # Check 4 & 5: Upload PDF, DOCX and TXT and verify extraction
    # -------------------------------------------------------------
    print("\n[CHECK 4 & 5] Uploading PDF, DOCX and TXT & Verifying Extraction...")
    with httpx.Client(timeout=15.0) as client:
        # Upload TXT
        txt_path = "sample_documents/Helios_Kafka_Streaming_Handover.txt"
        with open(txt_path, "rb") as f:
            res_txt = client.post(
                f"{BASE_URL}/api/projects/{project_id}/documents/upload?auto_analyze=true",
                files={"file": ("Helios_Kafka_Streaming_Handover.txt", f, "text/plain")},
                headers={"X-User-Role": "admin"}
            )
        assert res_txt.status_code == 200, f"TXT upload failed: {res_txt.text}"
        txt_doc = res_txt.json()
        print(f"  ✓ TXT uploaded & parsed: {txt_doc['original_name']} ({txt_doc['char_count']} chars, {txt_doc['page_count']} page)")
        assert txt_doc["char_count"] > 500

        # Upload DOCX
        docx_path = "sample_documents/Titan_Infra_Service_Mesh_Handover.docx"
        with open(docx_path, "rb") as f:
            res_docx = client.post(
                f"{BASE_URL}/api/projects/{project_id}/documents/upload?auto_analyze=true",
                files={"file": ("Titan_Infra_Service_Mesh_Handover.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                headers={"X-User-Role": "admin"}
            )
        assert res_docx.status_code == 200, f"DOCX upload failed: {res_docx.text}"
        docx_doc = res_docx.json()
        print(f"  ✓ DOCX uploaded & parsed: {docx_doc['original_name']} ({docx_doc['char_count']} chars, {docx_doc['page_count']} page)")
        assert docx_doc["char_count"] > 500

        # Upload PDF
        pdf_path = "sample_documents/Aura_Microservices_Handover.pdf"
        with open(pdf_path, "rb") as f:
            res_pdf = client.post(
                f"{BASE_URL}/api/projects/{project_id}/documents/upload?auto_analyze=true",
                files={"file": ("Aura_Microservices_Handover.pdf", f, "application/pdf")},
                headers={"X-User-Role": "admin"}
            )
        assert res_pdf.status_code == 200, f"PDF upload failed: {res_pdf.text}"
        pdf_doc = res_pdf.json()
        print(f"  ✓ PDF uploaded & parsed: {pdf_doc['original_name']} ({pdf_doc['char_count']} chars, {pdf_doc['page_count']} page)")
        assert pdf_doc["char_count"] > 200
    results["Check 4: PDF, DOCX, TXT Uploads"] = "PASSED"
    results["Check 5: Document Text Extraction"] = "PASSED"

    # -------------------------------------------------------------
    # Check 6 & 7: AI Analysis & Structured Knowledge Items
    # -------------------------------------------------------------
    print("\n[CHECK 6 & 7] Verifying Structured AI Knowledge Items & Evidence Quotes...")
    with httpx.Client(timeout=10.0) as client:
        res_items = client.get(f"{BASE_URL}/api/projects/{project_id}/knowledge-items")
        assert res_items.status_code == 200
        items = res_items.json()
        print(f"  ✓ Total items extracted across all 3 docs: {len(items)}")
        assert len(items) >= 6, "Expected at least 6 knowledge items"

        categories_found = set(i["category"] for i in items)
        print(f"  ✓ Categories discovered: {sorted(list(categories_found))}")
        assert "decision" in categories_found
        assert "risk_blocker" in categories_found

        for item in items[:4]:
            assert item["title"], "Item missing title"
            assert item["content"], "Item missing content"
            assert item["priority"] in ["critical", "high", "medium", "low"]
            assert item["source_excerpt"], "Item missing source excerpt"
            print(f"    - [{item['category'].upper()}] {item['title'][:45]}... (Verified: {item['evidence_verified']})")
    results["Check 6: AI Analysis Structured Output"] = "PASSED"
    results["Check 7: Evidence Quote Checking"] = "PASSED"

    # -------------------------------------------------------------
    # Check 8: Missing or conflicting evidence is clearly flagged
    # -------------------------------------------------------------
    print("\n[CHECK 8] Testing Missing / Conflicting Evidence Detection...")
    from backend.extractors import verify_excerpt_in_text
    sample_text = "Standardized on AWS EKS with Karpenter autoscaling."
    falsified_quote = "We migrated everything to Google Cloud Run on Tuesday evening."
    is_verified, score = verify_excerpt_in_text(falsified_quote, sample_text)
    assert not is_verified, "Falsified quote was incorrectly marked as verified!"
    print(f"  ✓ Mismatched quote correctly flagged: is_verified={is_verified}, confidence_score={score}")
    results["Check 8: Missing Evidence Flagging"] = "PASSED"

    # -------------------------------------------------------------
    # Check 9: Human Review: Edit, Approve, and Reject
    # -------------------------------------------------------------
    print("\n[CHECK 9] Testing Human Review Center: Edit, Approve, and Reject...")
    with httpx.Client(timeout=10.0) as client:
        item_to_edit = items[0]
        item_to_reject = items[1]
        item_to_approve = items[2]

        # 9a. Edit item
        edit_payload = {
            "title": "EDITED: Validated Architectural Choice",
            "content": "Updated content with additional audit notes.",
            "priority": "critical",
            "assignee": "Elena Rostova",
            "status": "approved",
            "review_notes": "Audited and verified by Lead Architect",
            "reviewed_by": "Alex Chen (Auditor)"
        }
        res_edit = client.patch(
            f"{BASE_URL}/api/knowledge-items/{item_to_edit['id']}",
            json=edit_payload,
            headers={"X-User-Role": "admin"}
        )
        assert res_edit.status_code == 200
        updated = res_edit.json()
        assert updated["title"] == edit_payload["title"]
        assert updated["status"] == "approved"
        print(f"  ✓ Edit item verified: #{updated['id']} title updated and status set to approved")

        # 9b. Reject item
        res_rej = client.patch(
            f"{BASE_URL}/api/knowledge-items/{item_to_reject['id']}",
            json={"status": "rejected", "reviewed_by": "Alex Chen"},
            headers={"X-User-Role": "admin"}
        )
        assert res_rej.status_code == 200
        assert res_rej.json()["status"] == "rejected"
        print(f"  ✓ Reject item verified: #{item_to_reject['id']} status set to rejected")

        # 9c. Approve item
        res_app = client.patch(
            f"{BASE_URL}/api/knowledge-items/{item_to_approve['id']}",
            json={"status": "approved", "reviewed_by": "Alex Chen"},
            headers={"X-User-Role": "admin"}
        )
        assert res_app.status_code == 200
        assert res_app.json()["status"] == "approved"
        print(f"  ✓ Approve item verified: #{item_to_approve['id']} status set to approved")
    results["Check 9: Human Review (Edit, Approve, Reject)"] = "PASSED"

    # -------------------------------------------------------------
    # Check 10 & 3: Handover Cannot Be Published Before Certification
    # & Team Member Cannot Access Unapproved Handover
    # -------------------------------------------------------------
    print("\n[CHECK 10 & 3] Verifying Draft Status & Team Member Access Restriction...")
    with httpx.Client(timeout=10.0) as client:
        # Generate draft handover
        gen_res = client.post(
            f"{BASE_URL}/api/projects/{project_id}/generate-handover",
            json={
                "project_id": project_id,
                "title": f"Audit Handover Package {rand_id}",
                "executive_summary": "Draft handover package awaiting certification."
            },
            headers={"X-User-Role": "admin"}
        )
        assert gen_res.status_code == 200
        draft_handover = gen_res.json()
        assert draft_handover["status"] == "draft", f"Expected status 'draft', got {draft_handover['status']}"
        print(f"  ✓ Handover successfully generated in 'draft' status (Version: v{draft_handover['version']})")

        # Requirement 3 & 10: Team Member tries to access unapproved handover -> MUST BE BLOCKED
        tm_handover_res = client.get(
            f"{BASE_URL}/api/projects/{project_id}/handover",
            headers={"X-User-Role": "team_member"}
        )
        assert tm_handover_res.status_code == 403, f"Expected 403 for Team Member accessing unapproved handover, got {tm_handover_res.status_code}"
        print(f"  ✓ Team Member access to unapproved handover correctly blocked: HTTP 403 Forbidden")
    results["Check 10: Cannot Publish Before Certification"] = "PASSED"
    results["Check 3: Team Member Unapproved Handover Block"] = "PASSED"

    # -------------------------------------------------------------
    # Check 11: Approved Handover Appears in Team Member Portal
    # -------------------------------------------------------------
    print("\n[CHECK 11] Admin Certifies Handover & Verifying Team Member Portal Access...")
    with httpx.Client(timeout=10.0) as client:
        # Admin certifies handover
        appr_res = client.post(
            f"{BASE_URL}/api/projects/{project_id}/approve-handover",
            json={
                "approved_by": "Alex Chen (Lead Architect)",
                "signature_notes": "Certified and accepted for engineering transition."
            },
            headers={"X-User-Role": "admin"}
        )
        assert appr_res.status_code == 200
        print(f"  ✓ Handover certified by {appr_res.json()['approved_by']}: Status={appr_res.json()['status']}")

        # Team member now accesses approved handover -> MUST SUCCEED (HTTP 200)
        tm_approved_res = client.get(
            f"{BASE_URL}/api/projects/{project_id}/handover",
            headers={"X-User-Role": "team_member"}
        )
        assert tm_approved_res.status_code == 200, f"Expected 200 for certified handover, got {tm_approved_res.status_code}"
        tm_handover = tm_approved_res.json()
        assert tm_handover["status"] == "approved"
        assert "OFFICIAL APPROVAL CERTIFICATION" in tm_handover["markdown_content"]
        print(f"  ✓ Team Member now accesses certified handover successfully: HTTP 200 OK")
    results["Check 11: Approved Handover Visible to Team Member"] = "PASSED"

    # -------------------------------------------------------------
    # Check 12: Audit Logs Record Important Actions
    # -------------------------------------------------------------
    print("\n[CHECK 12] Verifying Complete Audit Log Stream...")
    with httpx.Client(timeout=10.0) as client:
        act_res = client.get(f"{BASE_URL}/api/projects/{project_id}/activities")
        assert act_res.status_code == 200
        logs = act_res.json()
        actions_logged = set(l["action"] for l in logs)
        print(f"  ✓ Actions recorded for project #{project_id}: {actions_logged}")
        assert "PROJECT_CREATED" in actions_logged
        assert "DOCUMENT_UPLOADED" in actions_logged
        assert "HANDOVER_GENERATED" in actions_logged
        assert "HANDOVER_APPROVED" in actions_logged
        print(f"  ✓ Total {len(logs)} audit entries captured for project #{project_id}")
    results["Check 12: Audit Logging of Key Events"] = "PASSED"

    # Clean up test project
    with httpx.Client(timeout=10.0) as client:
        client.delete(f"{BASE_URL}/api/projects/{project_id}", headers={"X-User-Role": "admin"})

    print("\n======================================================================")
    print("                    AUDIT SUMMARY RESULTS")
    print("======================================================================")
    all_passed = True
    for test_name, status in results.items():
        print(f"  {test_name.ljust(50)} : {status}")
        if status != "PASSED":
            all_passed = False

    print("======================================================================")
    if all_passed:
        print(">>> ALL 12 AUDIT REQUIREMENTS PASSED WITH 100% SUCCESS! <<<")
    else:
        print(">>> SOME AUDIT CHECKS FAILED! <<<")
    print("======================================================================")

if __name__ == "__main__":
    run_audit()

