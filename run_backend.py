import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Load local .env if present (strictly gitignored)
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v

import uvicorn

if __name__ == "__main__":
    print("Starting KNOWLEDGE BRIDGE AI Backend on http://127.0.0.1:8000...")
    missing_secrets = [k for k in ["ADMIN_TOKEN", "TEAM_TOKEN", "SECRET_KEY"] if not os.getenv(k)]
    if missing_secrets:
        print(f"[SECURITY WARNING] Missing environment secrets: {', '.join(missing_secrets)}")
        print("  System will fail securely on authenticated operations until these are configured.")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")

