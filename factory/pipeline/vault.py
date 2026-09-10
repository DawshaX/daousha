#!/usr/bin/env python3
"""المرحلة 7 — 🏦 المخزون: فهرس الفيديوهات الجاهزة. النشر يسحب منه فقط."""
import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from . import FACTORY_ROOT, load_config

CFG = load_config("factory")


def _paths():
    return (FACTORY_ROOT / CFG["paths"]["vault_dir"],
            FACTORY_ROOT / CFG["paths"]["vault_index"])


def load_index() -> dict:
    _, idx = _paths()
    if idx.exists():
        return json.loads(idx.read_text(encoding="utf-8"))
    return {"entries": []}


def save_index(data: dict):
    vdir, idx = _paths()
    vdir.mkdir(parents=True, exist_ok=True)
    idx.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def add(video: Path, srt: Path, script_json: Path, branded: bool = True) -> dict:
    vdir, _ = _paths()
    vdir.mkdir(parents=True, exist_ok=True)
    script = json.loads(Path(script_json).read_text(encoding="utf-8"))
    vid = f"{script['topic_id']}-{script['lang']}"
    dest_v = vdir / f"{vid}.mp4"
    dest_s = vdir / f"{vid}.srt"
    shutil.copy(video, dest_v)
    if srt and Path(srt).exists():
        shutil.copy(srt, dest_s)
    entry = {
        "id": vid, "topic_id": script["topic_id"], "lang": script["lang"],
        "title": script["title"], "caption": script["caption"],
        "video": str(dest_v), "srt": str(dest_s) if dest_s.exists() else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "branded": branded, "published": {},
    }
    data = load_index()
    data["entries"] = [e for e in data["entries"] if e["id"] != vid]
    data["entries"].append(entry)
    save_index(data)
    return entry


def status() -> dict:
    data = load_index()
    ready = [e for e in data["entries"] if Path(e["video"]).exists()]
    min_h = CFG["vault"]["min_stock_hours"]
    return {
        "entries": len(data["entries"]),
        "ready_files": len(ready),
        "stock_hours": len(ready),
        "min_required_hours": min_h,
        "healthy": len(ready) >= min_h,
        "target_30d": CFG["vault"]["target_stock_days"] * 24,
        "yearly_goal": CFG["vault"]["yearly_stock_goal"],
        "progress_pct": round(100 * len(ready) / CFG["vault"]["yearly_stock_goal"], 2),
    }


def next_for_platform(platform: str) -> dict | None:
    """الأقدم أولاً من غير المنشور على هذه المنصة."""
    data = load_index()
    cands = [e for e in sorted(data["entries"], key=lambda x: x["created_at"])
             if platform not in e.get("published", {}) and Path(e["video"]).exists()]
    return cands[0] if cands else None


def mark_published(entry_id: str, platform: str, url: str):
    data = load_index()
    for e in data["entries"]:
        if e["id"] == entry_id:
            e.setdefault("published", {})[platform] = {
                "url": url, "at": datetime.now(timezone.utc).isoformat()}
    save_index(data)


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA vault")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--add", nargs=3, metavar=("VIDEO", "SRT", "SCRIPT_JSON"))
    ap.add_argument("--next", metavar="PLATFORM")
    a = ap.parse_args()
    if a.status:
        print(json.dumps(status(), ensure_ascii=False, indent=1))
    elif a.add:
        print(json.dumps(add(Path(a.add[0]), Path(a.add[1]), Path(a.add[2])),
                         ensure_ascii=False, indent=1))
    elif a.next:
        e = next_for_platform(a.next)
        print(json.dumps(e, ensure_ascii=False, indent=1) if e else "VAULT_EMPTY_FOR_PLATFORM")
    else:
        print(json.dumps(status(), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
