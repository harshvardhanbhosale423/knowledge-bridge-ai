import sys
import os
import json
import traceback

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from backend.main import app
except BaseException as e:
    tb = traceback.format_exc()
    error_dict = {
        "error": "Boot failed",
        "exception_type": type(e).__name__,
        "message": str(e),
        "traceback": tb,
        "sys_path": sys.path,
        "python_version": sys.version
    }

    async def app(scope, receive, send):
        if scope["type"] == "http":
            body = json.dumps(error_dict).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"content-length", str(len(body)).encode("utf-8")]
                ]
            })
            await send({
                "type": "http.response.body",
                "body": body
            })

# Vercel ASGI entrypoint
