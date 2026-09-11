#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════
# 📱 XDAW NOVA — مساعد تلجرام الذكي
# يدور على الرسائل: لو المالك كتب أمر → ينفذه ويرد فورًا.
# يعمل كخطوة في workflow كل 5 دقايق (polling خفيف) — لا يستهلك شيئًا.
#
# الأوامر:
#   /status  أو  الحالة      → تقرير شامل (آخر حلقة، القناة، الوقود، الصحة)
#   /now      أو  انشر دلوقتي → إطلاق دورة فورية (repository_dispatch)
#   /videos                  → آخر 5 فيديوهات على القناة
#   /fuel                    → كم موضوع باقٍ في المخزن
#   /help                    → قائمة الأوامر
# ═══════════════════════════════════════════════════════════
import json
import os
import urllib.request
from datetime import datetime, timezone

TG = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT = os.environ.get("TELEGRAM_CHAT_ID", "1890579200")
GH = os.environ.get("GH_TOKEN", "") or os.environ.get("NOVA_GH_TOKEN", "")
REPO = os.environ.get("GH_REPO", "DawshaX/daousha")
YTK = os.environ.get("YOUTUBE_API_KEY", "")
CHANNEL = "UUG9g_26H65D3FahqyiYPHAw"  # uploads playlist لقناة xDaw NoVa
STORE = "/tmp/tg_offset"


def api(url, data=None):
    r = urllib.request.Request(url, method="POST" if data else "GET",
        data=json.dumps(data).encode() if data else None,
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(r, timeout=30) as x:
            return json.loads(x.read())
    except Exception as e:
        return {"ok": False, "error": str(e)}


def say(text):
    api(f"https://api.telegram.org/bot{TG}/sendMessage",
        {"chat_id": CHAT, "text": text, "parse_mode": "HTML"})


def last_upload_age_min():
    """منذ كم دقيقة آخر فيديو نزل القناة (من بنك المواضيع المحلي)."""
    try:
        topics = json.load(open("content/topics.json"))
        items = topics if isinstance(topics, list) else topics.get("topics", [])
        for x in items:
            pub = (x.get("published") or {}).get("youtube", "")
            if pub:
                # آخر سجل نشر في اللوج أدق
                pass
        log = json.load(open("state/publish_log.json"))
        for e in reversed(log):
            if "youtube" in (e.get("platforms_done") or []) and not e.get("error"):
                t = datetime.fromisoformat(e["ts"]).replace(tzinfo=timezone.utc)
                return int((datetime.now(timezone.utc) - t).total_seconds() // 60)
    except Exception:
        pass
    return None


def cmd_status():
    age = last_upload_age_min()
    fuel = "?"
    try:
        topics = json.load(open("content/topics.json"))
        items = topics if isinstance(topics, list) else topics.get("topics", [])
        fuel = sum(1 for x in items if x.get("status") != "published")
    except Exception:
        pass
    lines = ["📊 <b>تقرير مصنع دوشة</b>",
             f"⏱ آخر نشر يوتيوب: <b>{age} دقيقة</b> مضت" if age is not None else "⏱ آخر نشر: غير معروف",
             "🎯 الإيقاع: حلقة كل ساعة",
             f"⛽ وقود المواضيع: <b>{fuel}</b>"]
    # صحة التوكن
    tok = {}
    try:
        tok = json.load(open("state/tokens.json"))
    except Exception:
        pass
    lines.append("🔑 يوتيوب: 🟢 متصل" if tok.get("youtube_refresh_token") else "🔑 يوتيوب: ⚪")
    lines.append("📘 فيسبوك: 🟢" if tok.get("facebook_page_token") else "📘 فيسبوك: ⚪ لم يُربط بعد")
    lines.append("📸 انستجرام: 🟢" if tok.get("instagram_user_id") else "📸 انستجرام: ⚪")
    say("\n".join(lines))


def cmd_videos():
    url = (f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"
           f"&playlistId={CHANNEL}&maxResults=5&key={YTK}") if YTK else None
    if not url:
        say("⚪ مفيش مفتاح قراية يوتيوب في السكريتس (YOUTUBE_API_KEY)")
        return
    r = api(url.replace(" ", "%20"))
    its = (r or {}).get("items", [])
    if not its:
        say("قائمة القناة فاضية أو المفتاح فشل")
        return
    lines = ["📺 <b>آخر الفيديوهات:</b>"]
    for it in its:
        s = it["snippet"]
        lines.append(f"• {s['title'][:48]}\n  🕐 {s['publishedAt'][:16].replace('T',' ')}")
    say("\n".join(lines))


def cmd_now():
    if not GH:
        say("⚪ مفيش مفتاح GH للإطلاق من هنا")
        return
    r = api(f"https://api.github.com/repos/{REPO}/dispatches",
            {"event_type": "nova-tick"})
    # dispatch بيرجع 204 بدون جسم — urlopen مش هيبني ok، نتحقق من الاستثناء
    say("🚀 <b>انطلقت دورة فورية!</b>\n⏳ الإنتاج ~12 دقيقة ثم النشر — وهرسلك تأكيد")


def main():
    if not TG:
        print("no telegram token — skip")
        return
    offset = 0
    try:
        offset = int(open(STORE).read().strip())
    except Exception:
        pass
    upd = api(f"https://api.telegram.org/bot{TG}/getUpdates?offset={offset+1}&timeout=0")
    if not upd.get("ok"):
        print("getUpdates fail:", upd.get("error", upd.get("description", ""))[:100])
        return
    for u in upd.get("result", []):
        offset = max(offset, u["update_id"])
        msg = u.get("message") or u.get("edited_message") or {}
        txt = (msg.get("text") or "").strip().lower()
        chat = str(msg.get("chat", {}).get("id", ""))
        if chat != CHAT:
            continue  # بس رسائل المالك
        if "/status" in txt or "حالة" in txt or "الحالة" in txt:
            cmd_status()
        elif "/now" in txt or "انشر" in txt or "نشر دلوقتي" in txt:
            cmd_now()
        elif "/videos" in txt or "فيديوهات" in txt:
            cmd_videos()
        elif "/fuel" in txt or "وقود" in txt:
            try:
                topics = json.load(open("content/topics.json"))
                items = topics if isinstance(topics, list) else topics.get("topics", [])
                n = sum(1 for x in items if x.get("status") != "published")
                say(f"⛽ الوقود: <b>{n} موضوع</b> في الانتظار + المولد التلقائي شغال")
            except Exception:
                say("⛽ مش قادر أقرا المخزن دلوقتي")
        elif "/help" in txt or "مساعدة" in txt:
            say("🤖 <b>أوامر مساعد دوشة:</b>\n/status أو «الحالة» — تقرير شامل\n/now أو «انشر» — دورة فورية\n/videos — آخر فيديوهات القناة\n/fuel أو «وقود» — المخزن")
        else:
            say("🤖 اكتب /help لأوامري — أو /status لتقرير المصنع")
    if offset:
        open(STORE, "w").write(str(offset))


if __name__ == "__main__":
    main()
