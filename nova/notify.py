"""إشعارات Telegram — تقرير فوري بكل حدث."""
import requests

from . import settings

API = "https://api.telegram.org"


def send(text: str) -> bool:
    if not settings.has_telegram():
        print("[telegram] no token — skip:", text[:120])
        return False
    try:
        r = requests.post(f"{API}/bot{settings.TELEGRAM['bot_token']}/sendMessage",
                          json={"chat_id": settings.TELEGRAM["chat_id"], "text": text,
                                "parse_mode": "HTML", "disable_web_page_preview": False},
                          timeout=30)
        return r.ok
    except Exception as e:
        print("[telegram] error:", e)
        return False


def report_episode(ep_id: str, title: str, links: dict, notes: list[str] | None = None):
    lines = [f"🚀 <b>نُشرت الحلقة {ep_id}</b>\n📢 {title}"]
    icons = {"youtube": "▶️ YouTube", "facebook": "📘 Facebook", "instagram": "📸 Instagram", "tiktok": "🎵 TikTok"}
    for p, url in links.items():
        if url:
            lines.append(f"{icons.get(p, p)}: {url}")
    for n in (notes or []):
        lines.append(f"⚠️ {n}")
    from . import state
    lad = state.load_ladder()
    lines.append(f"\n📊 السقف اليومي: {state.published_today_count()}/{lad['dailyCap']} | سلسلة النجاح: {lad['streakSafe']}")
    return send("\n".join(lines))


def report_error(context: str, err: str):
    return send(f"🛑 <b>مشكلة في الدورة</b>\n{context}\n<code>{err[:400]}</code>")


def report_halt(reason: str):
    return send(f"⛔ <b>تم إيقاف النظام تلقائيًا</b> (3 أخطاء متتالية)\nالسبب: {reason}\n"
                "لإعادة التشغيل: أصلح المشكلة ثم شغّل <code>python -m nova.run_cycle --resume</code>")
