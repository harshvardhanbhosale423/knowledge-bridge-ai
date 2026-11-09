import sys
import os
import random
import httpx

BASE_URL = "http://127.0.0.1:8000"

def test_free_tier_and_zero_budget():
    print("======================================================================")
    print("   TESTING ZERO-BUDGET ARCHITECTURE & FREE TIER GEMINI FALLBACK")
    print("======================================================================")

    with httpx.Client(timeout=15.0) as client:
        # Step 0: Dynamically obtain session tokens from server
        admin_login = client.post(f"{BASE_URL}/api/auth/login", json={"email": "alex.chen@knowledgebridge.internal", "role": "admin"})
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        ADMIN_TOKEN = admin_login.json()["token"]

        team_login = client.post(f"{BASE_URL}/api/auth/login", json={"email": "elena.rostova@knowledgebridge.internal", "role": "team_member"})
        assert team_login.status_code == 200, f"Team login failed: {team_login.text}"
        TEAM_TOKEN = team_login.json()["token"]
        # 1. Verify Free Tier & Cost Diagnostics
        print("\n[TEST 1] Verifying AI Config & Zero-Budget Billing Guarantee...")
        cfg_res = client.get(f"{BASE_URL}/api/ai/config")
        assert cfg_res.status_code == 200, f"Failed: {cfg_res.status_code}"
        cfg = cfg_res.json()
        print(f"  ✓ Provider: {cfg['provider']}")
        print(f"  ✓ Billing Enabled: {cfg['billing_enabled']} (Zero Billing Guaranteed)")
        print(f"  ✓ Estimated Cost: {cfg['estimated_monthly_cost']}")
        print(f"  ✓ Quota Status: {cfg['quota_status']}")
        print(f"  ✓ Zero-Budget Guarantee: {cfg['zero_budget_guarantee']}")
        assert cfg["billing_enabled"] is False, "Billing should NEVER be enabled!"
        assert "₹0" in cfg["estimated_monthly_cost"], "Cost must be zero!"

        # 2. Verify Quota Status Endpoint
        print("\n[TEST 2] Verifying Free Quota Endpoint (/api/ai/quota-status)...")
        quota_res = client.get(f"{BASE_URL}/api/ai/quota-status")
        assert quota_res.status_code == 200
        q_data = quota_res.json()
        quota = q_data["quota"]
        print(f"  ✓ Dynamic Quota Mode: {quota['quota_mode']}")
        print(f"  ✓ Dynamic Quota Status: {quota['quota_status']}")
        print(f"  ✓ Total Requests Tracked: {quota['total_requests']}")
        print(f"  ✓ Successful Requests: {quota['successful_requests']}")
        assert quota["billing_enabled"] is False, "Billing must be disabled!"
        assert "Dynamic" in quota["quota_mode"], "Quota must be dynamic without hardcoded limits!"

        # 3. Simulate HTTP 429 Quota Exhaustion & Verify Automatic Zero-Cost Fallback
        print("\n[TEST 3] Simulating HTTP 429 Quota Limit & Graceful Fallback Mode...")
        # Import quota_manager directly from backend
        sys.path.insert(0, os.path.abspath("."))
        from backend.ai_engine import quota_manager, analyze_document_text
        import asyncio

        # Trigger simulated dynamic rate limit
        quota_manager.handle_rate_limit("Simulated HTTP 429 Quota Exhausted Response from Gemini API", retry_after_seconds=15)
        assert quota_manager.can_request()[0] is False, "Quota manager should be in rate limit cooldown"
        print("  ✓ Free tier dynamic quota manager successfully recorded rate limit cooldown (HTTP 429)")

        # Call analyze_document_text
        sample_text = """
        PROJECT HELIOS STREAMING HANDOVER
        Decision: Decided to deploy Apache Kafka on Kubernetes with Strimzi operator for event streaming.
        Risk: High disk I/O pressure on Kafka broker-0 during peak trading window from 09:15 to 11:30 IST.
        Pending: Implement automated retention cleanup script before Friday release.
        Owner: Marcus Vance is primary owner for cluster sizing.
        """
        items = asyncio.run(analyze_document_text(sample_text, "test_helios.txt"))
        assert len(items) > 0, "Fallback extractor must return items!"
        print(f"  ✓ Fallback extractor produced {len(items)} structured items during rate limit")
        
        # Verify honesty & transparency: Never pretend fallback is AI-generated
        first_item = items[0]
        print(f"  ✓ Item is_demo_mode: {first_item['is_demo_mode']}")
        print(f"  ✓ Item is_ai_generated: {first_item['is_ai_generated']}")
        print(f"  ✓ Item provider: {first_item['ai_provider']}")
        print(f"  ✓ Item cost: {first_item['estimated_cost']}")
        assert first_item["is_demo_mode"] is True, "Must be flagged as demo/fallback!"
        assert first_item["is_ai_generated"] is False, "Must NOT claim to be AI-generated when using heuristic fallback!"
        assert "Zero-Cost" in first_item["ai_provider"] or "Rule-Based" in first_item["ai_provider"], "Provider must state fallback!"
        assert first_item["evidence_verified"] is True, "Evidence verification must still pass on actual text!"

        # Reset rate limit
        quota_manager.reset_rate_limit()
        print("  ✓ Rate limit reset successfully.")

        # 4. Test Complete Project Creation, Document Upload & Ingestion via REST API
        print("\n[TEST 4] Testing Project Creation & Free Document Extraction via API...")
        rand_id = random.randint(10000, 99999)
        proj_res = client.post(
            f"{BASE_URL}/api/projects",
            json={
                "title": f"Zero-Budget Project {rand_id}",
                "code": f"KB-FREE-{rand_id}",
                "description": "Zero budget test project",
                "department": "FinTech"
            },
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
        )
        assert proj_res.status_code == 200
        project_id = proj_res.json()["id"]
        print(f"  ✓ Created project #{project_id} (KB-FREE-{rand_id})")

        # Upload a document
        doc_path = "sample_documents/Helios_Kafka_Streaming_Handover.txt"
        with open(doc_path, "rb") as f:
            upload_res = client.post(
                f"{BASE_URL}/api/projects/{project_id}/documents/upload",
                files={"file": (os.path.basename(doc_path), f, "text/plain")},
                params={"auto_analyze": "true"},
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
            )
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.status_code} - {upload_res.text}"
        doc_data = upload_res.json()
        print(f"  ✓ Uploaded document: {doc_data['filename']} (Chars: {doc_data['char_count']})")

        # 5. Verify Extracted Items and Provenance Checks
        print("\n[TEST 5] Checking Extracted Knowledge Items & Evidence Provenance...")
        items_res = client.get(
            f"{BASE_URL}/api/projects/{project_id}/knowledge-items",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert items_res.status_code == 200
        project_items = items_res.json()
        assert len(project_items) > 0, "Knowledge items must be present"
        print(f"  ✓ Retrieved {len(project_items)} items for project #{project_id}")
        verified_count = sum(1 for it in project_items if it["evidence_verified"])
        print(f"  ✓ Evidence verification pass rate: {verified_count}/{len(project_items)} items verified")

        # 6. Test Human Review Workflow
        print("\n[TEST 6] Testing Human Review Center (Edit, Approve, Reject)...")
        item_to_approve = project_items[0]
        item_to_reject = project_items[1] if len(project_items) > 1 else project_items[0]

        appr_res = client.patch(
            f"{BASE_URL}/api/knowledge-items/{item_to_approve['id']}",
            json={"status": "approved", "reviewed_by": "Alex Chen (Admin)"},
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
        )
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "approved"
        print(f"  ✓ Approved item #{item_to_approve['id']}")

        rej_res = client.patch(
            f"{BASE_URL}/api/knowledge-items/{item_to_reject['id']}",
            json={"status": "rejected", "reviewed_by": "Alex Chen (Admin)"},
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
        )
        assert rej_res.status_code == 200
        assert rej_res.json()["status"] == "rejected"
        print(f"  ✓ Rejected item #{item_to_reject['id']}")

        # 7. Handover Generator & Role Isolation
        print("\n[TEST 7] Testing Handover Generator & Certification Barrier...")
        gen_res = client.post(
            f"{BASE_URL}/api/projects/{project_id}/generate-handover",
            json={"project_id": project_id, "title": "Official Zero-Budget Handover Package"},
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
        )
        assert gen_res.status_code == 200, f"Generate handover failed: {gen_res.status_code} - {gen_res.text}"
        print("  ✓ Handover report generated in 'draft' status")
        print("  ✓ Handover report generated in 'draft' status")

        # Team Member is DENIED from accessing unapproved draft handover
        tm_view = client.get(
            f"{BASE_URL}/api/projects/{project_id}/handover",
            headers={"Authorization": f"Bearer {TEAM_TOKEN}", "X-User-Role": "team_member"}
        )
        assert tm_view.status_code == 403, "Team member must NOT access unapproved handovers!"
        print("  ✓ Team member access to draft handover correctly blocked (HTTP 403 Forbidden)")

        # Admin certifies handover
        cert_res = client.post(
            f"{BASE_URL}/api/projects/{project_id}/approve-handover",
            json={"approved_by": "Alex Chen (Principal Architect)"},
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
        )
        assert cert_res.status_code == 200
        print("  ✓ Handover officially certified by Administrator")

        # Team Member can now view certified handover
        tm_ok = client.get(
            f"{BASE_URL}/api/projects/{project_id}/handover",
            headers={"Authorization": f"Bearer {TEAM_TOKEN}", "X-User-Role": "team_member"}
        )
        assert tm_ok.status_code == 200
        print("  ✓ Team member successfully views certified handover (HTTP 200 OK)")

        # 8. Clean up test project
        client.delete(
            f"{BASE_URL}/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": "admin"}
        )
        print(f"  ✓ Cleaned up test project #{project_id}")

    print("\n======================================================================")
    print(">>> ZERO-BUDGET & FREE TIER VERIFICATION: 100% PASSED! <<<")
    print("======================================================================")

if __name__ == "__main__":
    test_free_tier_and_zero_budget()
