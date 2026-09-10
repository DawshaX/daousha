#!/usr/bin/env python3
"""إشعارات تلجرام لدوشة."""
import os
import sys
import requests
from .dotenv import load_dotenv

load_dotenv()


def send_message(text: str) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat:
        print("TELEGRAM_SKIP: no bot token/chat id in .env")
        return False
    try:
        r = requests.post(f"https://api.telegram.org/bot{token}/sendMessage",
                          json={"chat_id": chat, "text": text}, timeout=30)
        ok = r.status_code == 200 and r.json().get("ok")
        print(f"TELEGRAM_{'OK' if ok else 'FAIL'}")
        return bool(ok)
    except Exception as e:
        print(f"TELEGRAM_ERROR: {e}")
        return False


def notify_publish(entry_id: str, title: str, urls: dict) -> bool:
    lines = [f"🚀 نُشرت {entry_id}", f"📌 {title}", ""]
    for plat, url in urls.items():
        lines.append(f"• {plat}: {url}")
    return send_message("\n".join(lines))


def notify_alert(text: str) -> bool:
    return send_message(f"🚨 تنبيه المصنع:\n{text}")


if __name__ == "__main__":
    send_message(sys.argv[1] if len(sys.argv) > 1 else "🏭 اختبار مصنع XDAW NOVA")
