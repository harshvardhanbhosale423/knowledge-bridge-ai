import sys
import os
import secrets
import httpx

BASE_URL = "http://127.0.0.1:8000"

def test_header_tampering_security():
    print("==================================================================")
    print("   TESTING ZERO-TRUST RBAC & HEADER TAMPERING DEFENSES")
    print("==================================================================")

    with httpx.Client(timeout=10.0) as client:
        # Step 1: Secure Authentication via /api/auth/login
        print("\n[STEP 1] Dynamically negotiating session tokens from server...")
        login_admin = client.post(f"{BASE_URL}/api/auth/login", json={"email": "alex.chen@knowledgebridge.internal", "role": "admin"})
        assert login_admin.status_code == 200, f"Admin login failed: {login_admin.text}"
        admin_token = login_admin.json()["token"]
        assert len(admin_token) >= 16, "Admin token must be a secure high-entropy string"

        login_team = client.post(f"{BASE_URL}/api/auth/login", json={"email": "elena.rostova@knowledgebridge.internal", "role": "team_member"})
        assert login_team.status_code == 200, f"Team login failed: {login_team.text}"
        team_token = login_team.json()["token"]
        assert len(team_token) >= 16, "Team token must be a secure high-entropy string"
        assert admin_token != team_token, "Admin and Team tokens MUST remain completely distinct!"

        print("  ✓ Admin token dynamically obtained (Distinct from Team token)")
        print("  ✓ Team token dynamically obtained (Distinct from Admin token)")

        # Scenario A: Team Member has team token and attempts to inject X-User-Role: admin
        print("\n[ATTACK SCENARIO A] Team Member passes X-User-Role: admin with Team Token...")
        res_a = client.post(
            f"{BASE_URL}/api/projects",
            json={"title": "Hacked Project", "code": "KB-HACKED", "department": "Security"},
            headers={
                "Authorization": f"Bearer {team_token}",
                "X-User-Role": "admin"
            }
        )
        print(f"  Response Status: HTTP {res_a.status_code}")
        print(f"  Response Detail: {res_a.text}")
        assert res_a.status_code == 403, f"Expected 403, got {res_a.status_code}!"
        assert "Header manipulation detected" in res_a.text
        print("  ✓ PASSED: Header manipulation blocked! Team token cannot spoof admin role.")

        # Scenario B: Attacker sends forged / unpredictable token
        forged_token = secrets.token_urlsafe(32)
        print("\n[ATTACK SCENARIO B] Attacker sends forged bearer token with X-User-Role: admin...")
        res_b = client.post(
            f"{BASE_URL}/api/projects",
            json={"title": "Forged Token Project", "code": "KB-FORGE", "department": "Security"},
            headers={
                "Authorization": f"Bearer {forged_token}",
                "X-User-Role": "admin"
            }
        )
        print(f"  Response Status: HTTP {res_b.status_code}")
        print(f"  Response Detail: {res_b.text}")
        assert res_b.status_code == 403, f"Expected 403, got {res_b.status_code}!"
        print("  ✓ PASSED: Forged token blocked! Untrusted bearer token denied.")

        # Scenario C: Team Member attempts to certify/approve a handover with Team Token
        print("\n[ATTACK SCENARIO C] Team Member attempts handover certification with Team Token...")
        res_c = client.post(
            f"{BASE_URL}/api/projects/1/approve-handover",
            json={"approved_by": "Attacker (Spoofed Admin)"},
            headers={
                "Authorization": f"Bearer {team_token}",
                "X-User-Role": "admin"
            }
        )
        print(f"  Response Status: HTTP {res_c.status_code}")
        print(f"  Response Detail: {res_c.text}")
        assert res_c.status_code == 403, f"Expected 403, got {res_c.status_code}!"
        print("  ✓ PASSED: Unauthorized certification blocked!")

        # Scenario D: Attacker sends request without Authorization Bearer header
        print("\n[ATTACK SCENARIO D] Attacker sends request without Authorization header...")
        res_d = client.post(
            f"{BASE_URL}/api/projects",
            json={"title": "No Token Project", "code": "KB-NOTOKEN", "department": "Security"},
            headers={"X-User-Role": "admin"}
        )
        print(f"  Response Status: HTTP {res_d.status_code}")
        assert res_d.status_code in [401, 403], f"Expected 401 or 403, got {res_d.status_code}!"
        print("  ✓ PASSED: Missing token blocked!")

        # Scenario E: Legitimate Admin with valid dynamic token succeeds
        print("\n[LEGITIMATE SCENARIO E] Legitimate Admin with negotiated token creates project...")
        test_code = f"KB-AUTH-OK-{secrets.randbelow(10000)}"
        res_e = client.post(
            f"{BASE_URL}/api/projects",
            json={"title": "Verified Admin Workspace", "code": test_code, "department": "Platform"},
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-User-Role": "admin"
            }
        )
        print(f"  Response Status: HTTP {res_e.status_code}")
        assert res_e.status_code == 200, f"Expected 200 for legitimate admin, got {res_e.status_code}!"
        created_id = res_e.json()["id"]
        print(f"  ✓ PASSED: Authenticated Admin allowed. Created project #{created_id}")

        # Clean up
        client.delete(f"{BASE_URL}/api/projects/{created_id}", headers={"Authorization": f"Bearer {admin_token}"})
        print("  ✓ Cleaned up test project.")

    print("\n==================================================================")
    print(">>> HEADER TAMPERING & RBAC SECURITY TEST: 100% PASSED <<<")
    print("==================================================================")

if __name__ == "__main__":
    test_header_tampering_security()
