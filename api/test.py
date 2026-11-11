from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import traceback

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        res = {
            "status": "online",
            "python_version": sys.version,
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "files_in_cwd": os.listdir(".") if os.path.exists(".") else []
        }
        try:
            root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if root not in sys.path:
                sys.path.insert(0, root)
            import backend.main
            res["backend_imported"] = True
        except BaseException as e:
            res["backend_imported"] = False
            res["error_type"] = type(e).__name__
            res["error_message"] = str(e)
            res["traceback"] = traceback.format_exc()

        body = json.dumps(res, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(body)
        return
