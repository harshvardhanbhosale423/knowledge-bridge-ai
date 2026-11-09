import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("--- 1. Testing Health & Diagnostics ---")
res = client.get("/api/health")
assert res.status_code == 200, f"Health check failed: {res.text}"
health = res.json()
print("Health response:", health)
assert health["status"] == "healthy"

print("\n--- 2. Testing Dashboard Stats ---")
res = client.get("/api/stats")
assert res.status_code == 200
stats = res.json()
print("Stats response:", stats)
assert stats["total_projects"] >= 2

print("\n--- 3. Testing Project Creation ---")
new_proj_payload = {
    "title": "Project Titan: Service Mesh Migration",
    "code": "KB-TITAN-TEST",
    "description": "Migration of microservice ingress and zero-trust service mesh.",
    "department": "Infrastructure Guild",
    "lead_name": "Marcus Vance"
}
res = client.post("/api/projects", json=new_proj_payload)
assert res.status_code == 200, f"Project creation failed: {res.text}"
proj = res.json()
proj_id = proj["id"]
print(f"Created project: {proj['title']} (ID: {proj_id})")

print("\n--- 4. Testing Document Upload with Real DOCX & Extraction ---")
docx_path = "sample_documents/Titan_Infra_Service_Mesh_Handover.docx"
with open(docx_path, "rb") as f:
    files = {"file": ("Titan_Infra_Service_Mesh_Handover.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = client.post(f"/api/projects/{proj_id}/documents/upload?auto_analyze=true", files=files)

assert res.status_code == 200, f"Document upload failed: {res.text}"
doc_data = res.json()
print(f"Uploaded doc: {doc_data['original_name']}, Pages: {doc_data['page_count']}, Chars: {doc_data['char_count']}")
assert doc_data["char_count"] > 200

print("\n--- 5. Testing Knowledge Items Retrieval ---")
res = client.get(f"/api/projects/{proj_id}/knowledge-items")
assert res.status_code == 200
items = res.json()
print(f"Retrieved {len(items)} extracted knowledge items.")
assert len(items) >= 4, "Expected at least 4 items extracted"

for item in items[:3]:
    print(f"  - [{item['category']}] {item['title']} (Evidence Verified: {item['evidence_verified']}, Score: {item['confidence_score']})")

print("\n--- 6. Testing Human Review & Batch Approve ---")
item_ids = [i["id"] for i in items[:3]]
batch_payload = {
    "item_ids": item_ids,
    "action": "approve",
    "reviewer_name": "Alex Chen (Lead Architect)",
    "review_notes": "Verified against production configs."
}
res = client.post(f"/api/projects/{proj_id}/batch-review", json=batch_payload)
assert res.status_code == 200, f"Batch review failed: {res.text}"
print("Batch review response:", res.json())

# Check updated item status
res = client.get(f"/api/projects/{proj_id}/knowledge-items?status=approved")
assert res.status_code == 200
approved_items = res.json()
print(f"Approved items count: {len(approved_items)}")
assert len(approved_items) >= 3

print("\n--- 7. Testing Handover Generation ---")
res = client.post(f"/api/projects/{proj_id}/generate-handover", json={
    "project_id": proj_id,
    "title": "Project Titan: Certified Handover Package v1.0",
    "executive_summary": "Handover report for the incoming infrastructure guild."
})
assert res.status_code == 200, f"Handover generation failed: {res.text}"
handover = res.json()
print(f"Generated Handover Draft v{handover['version']}. Status: {handover['status']}")
assert handover["status"] == "draft"
assert "## 1. EXECUTIVE OVERVIEW" in handover["markdown_content"]

print("\n--- 8. Testing Human Approval Gate Certification ---")
res = client.post(f"/api/projects/{proj_id}/approve-handover", json={
    "approved_by": "Alex Chen (Principal Architect)",
    "signature_notes": "All items certified for team transition."
})
assert res.status_code == 200, f"Handover approval failed: {res.text}"
approval_res = res.json()
print(f"Handover Approved: {approval_res['status']} by {approval_res['approved_by']}")
assert approval_res["status"] == "approved"

print("\n--- 9. Fetching Final Certified Handover ---")
res = client.get(f"/api/projects/{proj_id}/handover")
assert res.status_code == 200
final_handover = res.json()
print("Final status:", final_handover["status"])
assert final_handover["status"] == "approved"
assert "OFFICIAL APPROVAL CERTIFICATION" in final_handover["markdown_content"]

print("\n==============================================")
print(">>> COMPLETE WORKFLOW TEST PASSED 100%! <<<")
print("UPLOAD -> ANALYZE -> VERIFY -> REVIEW -> APPROVE -> HANDOVER")
print("==============================================")

