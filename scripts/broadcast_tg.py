#!/usr/bin/env python3
"""
📣 بثّ ملف على تلجرام — بيقسّم الملف لرسائل ويبعتهم بالترتيب.

    python scripts/broadcast_tg.py docs/XDaw_NoVa_TELEGRAM.md 3200
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]


def send(bot: str, chat: str, text: str) -> int:
    data = urllib.parse.urlencode({"chat_id": chat, "text": text[:3900],
                                   "disable_web_page_preview": "true"}).encode()
    try:
        with urllib.request.urlopen(f"https://api.telegram.org/bot{bot}/sendMessage",
                                    data=data, timeout=30) as r:
            return r.status
    except Exception as e:
        print("فشل:", type(e).__name__, str(e)[:120])
        return 0


def chunks(text: str, size: int) -> list[str]:
    """تقسيم على حدود السطور (مش في نص سطر)."""
    out, cur = [], ""
    for line in text.splitlines(keepends=True):
        if len(cur) + len(line) > size and cur:
            out.append(cur)
            cur = ""
        cur += line
    if cur.strip():
        out.append(cur)
    return out or [text[:size]]


def main(argv: list[str]) -> int:
    bot = (os.environ.get("TG") or os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip()
    chat = (os.environ.get("CHAT") or os.environ.get("TELEGRAM_CHAT_ID")
            or os.environ.get("TELEGRAM_ADMIN_CHAT_ID") or "").strip()
    if not (bot and chat):
        print("❌ ناقص TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID")
        return 2
    rel = argv[1] if len(argv) > 1 else "docs/XDaw_NoVa_TELEGRAM.md"
    size = int(argv[2]) if len(argv) > 2 else 3200
    path = pathlib.Path(rel)
    if not path.is_absolute():
        path = ROOT / rel
    if not path.exists():
        print("❌ مفيش ملف:", path)
        return 2
    text = path.read_text(encoding="utf-8")
    parts = chunks(text, size)
    ok = 0
    for i, part in enumerate(parts, 1):
        st = send(bot, chat, (f"({i}/{len(parts)})\n" if len(parts) > 1 else "") + part)
        print(f"رسالة {i}/{len(parts)}: {st}")
        ok += 1 if st == 200 else 0
        time.sleep(1.2)
    print(f"✅ اتبعت {ok}/{len(parts)}")
    return 0 if ok == len(parts) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
