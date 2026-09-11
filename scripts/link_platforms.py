#!/usr/bin/env python3
"""مدقق ربط المنصات — يفحص كل مفتاح بدعوة API حقيقية ويبعت تليجرام بالنتيجة.
يعمل مع كل دورة: تعرف فورًا أنهي منصة اتربطت وأنهي محتاجة مفتاح.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests

from nova import settings


def check_youtube() -> str:
    if not settings.has_youtube():
        return "⚪ YouTube: لا مفتاح — أضف YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN"
    try:
        tk = requests.post("https://oauth2.googleapis.com/token", data={
            "client_id": settings.YOUTUBE["client_id"],
            "client_secret": settings.YOUTUBE["client_secret"],
            "refresh_token": settings.YOUTUBE["refresh_token"],
            "grant_type": "refresh_token"}, timeout=20).json()
        token = tk.get("access_token")
        if not token:
            return f"🔴 YouTube: التوكن مرفوض ({tk.get('error', '?')}) — أعد توليد REFRESH_TOKEN"
        ch = requests.get("https://www.googleapis.com/youtube/v3/channels",
                          params={"part": "snippet", "mine": "true"},
                          headers={"Authorization": f"Bearer {token}"}, timeout=20).json()
        title = (ch.get("items") or [{}])[0].get("snippet", {}).get("title", "?")
        return f"🟢 YouTube متصل: قناة «{title}»"
    except Exception as e:
        return f"🔴 YouTube: {str(e)[:80]}"


def check_facebook() -> str:
    if not settings.has_facebook():
        return "⚪ Facebook: لا توكن — أضف FACEBOOK_PAGE_ACCESS_TOKEN"
    try:
        me = requests.get(f"https://graph.facebook.com/v23.0/{settings.FACEBOOK['page_id']}",
                          params={"fields": "name,fan_count"},
                          headers={"Authorization": f"OAuth {settings.FACEBOOK['token']}"},
                          timeout=20).json()
        if "name" in me:
            return f"🟢 Facebook متصل: صفحة «{me['name']}» ({me.get('fan_count', '?')} متابع)"
        return f"🔴 Facebook: {json.dumps(me)[:100]}"
    except Exception as e:
        return f"🔴 Facebook: {str(e)[:80]}"


def check_instagram() -> str:
    if not settings.has_instagram():
        return "⚪ Instagram: لا توكن — أضف INSTAGRAM_USER_ID + INSTAGRAM_ACCESS_TOKEN (المستخدم المتوقع @xdaw_nova)"
    try:
        me = requests.get(f"https://graph.facebook.com/v23.0/{settings.INSTAGRAM['user_id']}",
                          params={"fields": "username,followers_count"},
                          headers={"Authorization": f"OAuth {settings.INSTAGRAM['token']}"},
                          timeout=20).json()
        if "username" in me:
            return f"🟢 Instagram متصل: @{me['username']} ({me.get('followers_count', '?')} متابع)"
        return f"🔴 Instagram: {json.dumps(me)[:100]}"
    except Exception as e:
        return f"🔴 Instagram: {str(e)[:80]}"


def check_telegram() -> str:
    if not settings.has_telegram():
        return "⚪ Telegram: لا توكن"
    try:
        me = requests.get(f"https://api.telegram.org/bot{settings.TELEGRAM['bot_token']}/getMe",
                          timeout=15).json()
        if me.get("ok"):
            return f"🟢 Telegram متصل: @{me['result']['username']}"
        return "🔴 Telegram: توكن غير صالح"
    except Exception as e:
        return f"🔴 Telegram: {str(e)[:60]}"


def check_extras() -> list[str]:
    out = []
    out.append("🟢 Pexels مفعّل — مشاهد حقيقية" if settings.PEXELS_KEY
               else "⚪ Pexels: اختياري للمشاهد الحقيقية (PEXELS_API_KEY)")
    out.append("🟢 LLM مفعّل — سيناريوهات لا نهائية أذكى" if settings.has_llm()
               else "⚪ LLM: اختياري لمواضيع أذكى (LLM_API_BASE/KEY)")
    return out


def main() -> int:
    lines = [check_youtube(), check_facebook(), check_instagram(), check_telegram()] + check_extras()
    print("=" * 50)
    print("حالة ربط المنصات — مصنع دوشة")
    print("=" * 50)
    for l in lines:
        print(" ", l)
    from nova import notify
    notify.send("🔌 <b>تقرير ربط المنصات</b>\n" + "\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
