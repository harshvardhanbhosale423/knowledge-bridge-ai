import sys
import os
import traceback

# Ensure root directory is on Python path so 'backend' package can be imported
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from backend.main import app
except Exception as e:
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def boot_error_handler(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend initialization exception",
                "message": str(e),
                "traceback": tb
            }
        )

# Vercel ASGI entrypoint
