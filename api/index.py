import sys
import os
import traceback

# Ensure both current directory and parent directory are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

for p in [CURRENT_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.main import app
except Exception as e:
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Knowledge Bridge AI - Boot Diagnostic Fallback")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def boot_error_handler(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend initialization exception",
                "exception_type": type(e).__name__,
                "message": str(e),
                "traceback": tb,
                "sys_path": sys.path,
                "cwd": os.getcwd(),
                "files_in_cwd": os.listdir(".") if os.path.exists(".") else [],
                "files_in_root": os.listdir(ROOT_DIR) if os.path.exists(ROOT_DIR) else []
            }
        )

# Vercel ASGI entrypoint
