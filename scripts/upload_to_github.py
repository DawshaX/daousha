#!/usr/bin/env python3
"""رفع مصنع دوشة إلى DawshaX/daousha عبر GitHub Tree API (بدون git protocol)."""
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

TOKEN = open("/tmp/nova_gh_token").read().strip()
REPO = "DawshaX/daousha"
ROOT = Path("/home/user/xdaw-nova-final")
API = f"https://api.github.com/repos/{REPO}"


def req(url, method="GET", data=None, raw=False):
    r = urllib.request.Request(url, method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(r, timeout=60) as resp:
        body = resp.read()
        return json.loads(body) if body and not raw else (body, dict(resp.headers))


# ── 1) المرجع الحالي ──
ref = req(f"{API}/git/ref/heads/main")
base_commit = ref["object"]["sha"]
commit_obj = req(f"{API}/git/commits/{base_commit}")
base_tree = commit_obj["tree"]["sha"]
print(f"✓ main @ {base_commit[:8]} — tree {base_tree[:8]}")

# ── 2) الملفات ──
files = []
for p in sorted(ROOT.rglob("*")):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix()
    if any(s in rel for s in ("_vendor/", ".git/", "work/", "state/", "out/", "sample/",
                              "__pycache__", ".zip", "factory.log", ".git-credentials")):
        continue
    files.append((rel, p))

# تجاهل ملفات المجس القديمة — main.yml سيُستبدل بالمجس المصلح
patched = {}
nova_yml = (ROOT / ".github/workflows/nova.yml").read_text(encoding="utf-8")
nova_yml = nova_yml.replace("NOVA_PLATFORM_GAP_H: ${{ secrets.NOVA_PLATFORM_GAP_H || '4' }}",
                            "NOVA_PLATFORM_GAP_H: ${{ secrets.NOVA_PLATFORM_GAP_H || '1' }}")
patched[".github/workflows/nova.yml"] = nova_yml
main_yml = (ROOT / "docs/PROBE-الصق-ده.yml").read_text(encoding="utf-8")
patched[".github/workflows/main.yml"] = main_yml

tree_items = []
for rel, p in files:
    if rel in ("docs/PROBE-الصق-ده.yml", ".github/workflows/main.yml"):
        continue
    content = patched.get(rel, None)
    if content is not None:
        data = content.encode("utf-8")
    else:
        data = p.read_bytes()
    blob = req(f"{API}/git/blobs", "POST", {"content": base64.b64encode(data).decode(),
                                            "encoding": "base64"})
    tree_items.append({"path": rel, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print(f"  ⬆ {rel} ({len(data)} B)")

# الملفان المخصسان
for rel, content in patched.items():
    blob = req(f"{API}/git/blobs", "POST", {"content": base64.b64encode(content.encode()).decode(),
                                            "encoding": "base64"})
    tree_items.append({"path": rel, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print(f"  ⬆ {rel} (مخصص)")

# ── 3) الشجرة والكومِيت ──
tree = req(f"{API}/git/trees", "POST", {"base_tree": base_tree, "tree": tree_items})
new_commit = req(f"{API}/git/commits", "POST", {
    "message": "XDAW NOVA factory v3 — hourly autonomous episodes (cover+YT publish, auto-renew)",
    "tree": tree["sha"], "parents": [base_commit]})
req(f"{API}/git/refs/heads/main", "PATCH", {"sha": new_commit["sha"], "force": False})
print(f"✅ اترفع: commit {new_commit['sha'][:8]} — {len(tree_items)} ملف على main")
