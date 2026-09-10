#!/usr/bin/env python3
"""🎛️ لوحة تحكم مصنع XDAW NOVA — تعمل على http://0.0.0.0:8000 (stdlib فقط)."""
import json
import os
import sys
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from pipeline.vault import load_index, status as vault_status
from pipeline.topics import load_bank, load_state

TOKEN = os.environ.get("DASH_TOKEN", "dawsha")


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _file(self, path, ctype):
        data = Path(path).read_bytes()
        rng = self.headers.get("Range")
        if rng and rng.startswith("bytes="):
            try:
                start = int(rng[6:].split("-")[0] or 0)
            except ValueError:
                start = 0
            data = data[start:]
            self.send_response(206)
            self.send_header("Content-Range",
                             f"bytes {start}-{start+len(data)-1}/{Path(path).stat().st_size}")
        else:
            self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == "/":
            return self._file(ROOT / "dashboard" / "index.html", "text/html; charset=utf-8")
        if u.path == "/api/status":
            return self._json(api_status())
        if u.path == "/api/vault":
            return self._json(api_vault())
        if u.path.startswith("/video/"):
            vid = unquote(u.path[len("/video/"):])
            for e in load_index()["entries"]:
                if e["id"] == vid and Path(e["video"]).exists():
                    return self._file(e["video"], "video/mp4")
            return self._json({"error": "not found"}, 404)
        if u.path == "/api/log":
            return self._json({"log": tail_log()})
        if u.path == "/api/control":
            if q.get("token", [""])[0] != TOKEN:
                return self._json({"error": "bad token"}, 403)
            pf = ROOT / "state" / "paused"
            if "pause" in q:
                if q["pause"][0] == "1":
                    pf.parent.mkdir(parents=True, exist_ok=True)
                    pf.write_text(datetime.now(timezone.utc).isoformat())
                else:
                    pf.unlink(missing_ok=True)
            return self._json({"paused": pf.exists()})
        return self._json({"error": "not found"}, 404)


def api_status():
    v = vault_status()
    bank = load_bank()
    st = load_state()
    hb_p = ROOT / "state" / "heartbeat.json"
    hb = json.loads(hb_p.read_text(encoding="utf-8")) if hb_p.exists() else {}
    ready = [t for t in bank if t.get("facts_ar")]
    return {"time": datetime.now(timezone.utc).isoformat(), "vault": v,
            "bank": {"total": len(bank), "ready": len(ready),
                     "consumed": len(st.get("consumed", []))},
            "heartbeat": hb, "paused": (ROOT / "state" / "paused").exists()}


def api_vault():
    out = []
    for e in sorted(load_index()["entries"], key=lambda x: x["created_at"], reverse=True):
        vp = Path(e["video"])
        out.append({"id": e["id"], "title": e["title"], "created_at": e["created_at"],
                    "size_mb": round(vp.stat().st_size / 1e6, 1) if vp.exists() else 0})
    return {"entries": out}


def tail_log(n=40):
    p = ROOT / "state" / "factory.log"
    if not p.exists():
        return []
    return p.read_text(encoding="utf-8").splitlines()[-n:]


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"XDAW dashboard on 0.0.0.0:{port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
