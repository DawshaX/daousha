#!/usr/bin/env python3
"""Send a status notification to the XDAW NOVA Telegram chat."""
import re
import sys

import requests

SECRETS_PATH = "/home/ubuntu/secrets.txt"
CHAT_IDS = [
    "1890579200",  # verified 2026-08-14 — xDaw_NOVA bot sendMessage succeeded (message_id 22)
]


def load_secrets(path):
    content = open(path, encoding="utf-8").read()
    secrets = {}
    for m in re.finditer(r"^([A-Za-z_0-9]+)\n+\n+(.+?)\n+(?:\n|$)", content, re.M):
        key, value = m.group(1), m.group(2).strip()
        if value:
            secrets[key] = value
    return secrets


def find_chat_ids(bot_token):
    r = requests.get(f"https://api.telegram.org/bot{bot_token}/getUpdates", timeout=15)
    r.raise_for_status()
    data = r.json()
    ids = set()
    for u in data.get("result", []):
        for kind in ("message", "channel_post", "edited_message"):
            msg = u.get(kind) or {}
            chat = msg.get("chat", {})
            if chat.get("id"):
                ids.add(str(chat["id"]))
    return ids


def notify_publish(episode, yt_url, ig_url, fb_url, tiktok_url=None):
    """إشعار منشور جديد — يُستدعى من: python3 notify_telegram.py publish <ep> <yt> <ig> <fb> [tiktok]"""
    secrets = load_secrets(SECRETS_PATH)
    bot = secrets.get("TELEGRAM_BOT_TOKEN", "")
    if not bot or bot.startswith("REPLACE"):
        print("missing TELEGRAM_BOT_TOKEN", file=sys.stderr)
        sys.exit(1)
    parts = [
        f"🎬 *نشر جديد — {episode}*",
        f"• YouTube: {yt_url}",
        f"• Instagram: {ig_url}",
        f"• Facebook: {fb_url}",
    ]
    if tiktok_url:
        parts.append(f"• TikTok: {tiktok_url}")
    parts.append("✅ داوسها XDAW NOVA — النشر التلقائي يعمل")
    text = "\n".join(parts)
    ok = False
    for cid in CHAT_IDS:
        r = requests.post(
            f"https://api.telegram.org/bot{bot}/sendMessage",
            json={"chat_id": cid, "text": text, "parse_mode": "Markdown"},
            timeout=15,
        )
        print(cid, r.status_code, (r.text or "")[:120])
        if r.status_code == 200:
            ok = True
    return ok


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "publish" and len(sys.argv) >= 5:
        tik = sys.argv[5] if len(sys.argv) > 5 else None
        sys.exit(0 if notify_publish(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[4], tik) else 1)
    secrets = load_secrets(SECRETS_PATH)
    bot = secrets.get("TELEGRAM_BOT_TOKEN", "")
    if not bot or bot.startswith("REPLACE"):
        print("missing TELEGRAM_BOT_TOKEN", file=sys.stderr)
        sys.exit(1)

    text = (
        "🎬 XDAW NOVA — تحديث الحالة\n\n"
        "✅ تم ربط YouTube + Instagram + Facebook بنجاح (منشور تجريبي على الثلاثة)\n\n"
        "🎵 TikTok — تم تقديم التطبيق للمراجعة الرسمية:\n"
        "• التطبيق: xDaW NoVa (Production / In review)\n"
        "• Login Kit + Content Posting API (نشر مباشر مفعّل)\n"
        "• سبب التقديم: النشر التلقائي للمحتوى التعليمي\n\n"
        "بعد موافقة TikTok سيتم الربط بالنشر التلقائي الكامل.\n\n"
        "📦 المستودع محدث: github.com/DawshaX/daousha"
    )

    targets = find_chat_ids(bot)
    if not targets:
        print("no chat ids from getUpdates")
        sys.exit(1)

    ok = False
    for cid in sorted(targets):
        r = requests.post(
            f"https://api.telegram.org/bot{bot}/sendMessage",
            json={"chat_id": cid, "text": text, "parse_mode": "Markdown"},
            timeout=15,
        )
        print(cid, r.status_code, r.text[:120])
        if r.status_code == 200:
            ok = True
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
