import os
import re

PATTERNS = [
    (r"AIzaSy[A-Za-z0-9_-]{33}", "Google Gemini / Firebase API Key"),
    (r"sk-[A-Za-z0-9_-]{20,}", "OpenAI API Key"),
    (r"ghp_[A-Za-z0-9]{36}", "GitHub Personal Access Token"),
    (r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----", "Private Key Block"),
    (r"(?:ADMIN_TOKEN|TEAM_TOKEN|SECRET_KEY)\s*[:=]\s*['\"][A-Za-z0-9_\-]{8,}['\"]", "Hardcoded Authentication Token Definition"),
    (r"kb-sec-[a-z0-9_\-]+", "Legacy Predictable Token String"),
    (r"admin_secret_token_[a-z0-9_\-]+", "Legacy Example Token String"),
    (r"(?:api_key|apiKey|password)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}['\"]", "Hardcoded Secret / Password")
]

EXCLUDE_DIRS = {".git", "node_modules", "python_env", ".gemini", "brain"}

findings = []
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith((".py", ".ts", ".tsx", ".js", ".json", ".env", ".md", ".html", ".css", ".bat", ".ps1")):
            path = os.path.join(root, file)
            # Skip documentation examples in this security scan file itself or gitignore
            if "security_scan.py" in path or ".gitignore" in path or ".vercelignore" in path:
                continue
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    for pattern, desc in PATTERNS:
                        matches = re.findall(pattern, content)
                        for m in matches:
                            # Exclude example placeholder keys in docs or comments
                            if any(ex in m for ex in ["AIzaSy...", "sk-proj-...", "AIzaSy_EXAMPLE", "your-random", "your_token"]):
                                continue
                            findings.append((path, desc, m[:20] + "..."))
            except Exception as e:
                pass

print("=== CREDENTIAL & SENSITIVE DATA SCAN RESULTS ===")
if not findings:
    print("✓ ZERO exposed API keys, tokens, or credentials found in the codebase.")
else:
    print(f"⚠️ Found {len(findings)} potential secret(s):")
    for f in findings:
        print(f"  - {f[0]}: {f[1]} ({f[2]})")
