#!/usr/bin/env python3
"""مرآة تلجرام: نسخة سحابية مجانية من كل فيديو في الخزنة (تخزين + مشاهدة من الموبايل).

الفيديوهات ~4MB (الحد 50MB) — قناة/شات خاص = أرشيف مجاني بلا حدود عملية.
"""
import argparse
import json
import os
from pathlib import Path
import requests
from . import FACTORY_ROOT
from .dotenv import load_dotenv
from .vault import load_index

load_dotenv()
STATE = FACTORY_ROOT / "state" / "mirror.json"


def _load() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"mirrored": []}


def _save(s: dict):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")


def send_video(video: Path, caption: str) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat:
        print("MIRROR_SKIP: no telegram creds")
        return False
    try:
        with open(video, "rb") as f:
            r = requests.post(f"https://api.telegram.org/bot{token}/sendVideo",
                              data={"chat_id": chat, "caption": caption[:1000],
                                    "supports_streaming": True},
                              files={"video": f}, timeout=300)
        ok = r.status_code == 200 and r.json().get("ok")
        print(f"MIRROR_{'OK' if ok else 'FAIL'}: {video.name}")
        return bool(ok)
    except Exception as e:
        print(f"MIRROR_ERROR: {e}")
        return False


def sweep(limit: int = 5) -> dict:
    st = _load()
    done = set(st["mirrored"])
    entries = [e for e in load_index()["entries"]
               if e["id"] not in done and Path(e["video"]).exists()]
    sent, failed = 0, 0
    for e in entries[:limit]:
        cap = f"🏭 {e['id']}\n📌 {e['title']}"
        if send_video(Path(e["video"]), cap):
            st["mirrored"].append(e["id"])
            sent += 1
        else:
            failed += 1
            break
    _save(st)
    return {"sent": sent, "failed": failed, "pending": len(entries) - sent}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=5)
    a = ap.parse_args()
    print(json.dumps(sweep(a.limit), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
