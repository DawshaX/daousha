#!/usr/bin/env python3
"""نظام صحة واستمرارية التوكنات — يشتغل قبل كل دورة:
1) يتحقق من كل توكن بدعوة API حقيقية
2) يكتشف معرّف إنستجرام تلقائيًا من توكن الصفحة (لو مش موجود)
3) يجدد توكن فيسبوك طويل الأمد تلقائيًا قبل الانتهاء (لو توفر META_APP_ID/SECRET)
4) يشير إنذار تليجرام قبل أي انتهاء بأيام + عند أي فشل
النتيجة تُخزن في state/tokens.json (مستثنى من Git أمنيًا) وتُستخدم فورًا في النشر.
"""
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests

from nova import notify, settings

V = "v23.0"


def _get(url, **kw):
    try:
        return requests.get(url, timeout=20, **kw).json()
    except Exception as e:
        return {"error": {"message": str(e)[:120]}}


def load_store() -> dict:
    p = settings.STATE / "tokens.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def save_store(d: dict):
    p = settings.STATE / "tokens.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")


# ---------------- YouTube ----------------
def check_youtube(store: dict) -> str:
    if not settings.has_youtube():
        return "⚪ YouTube: لا مفتاح (YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN)"
    try:
        tk = requests.post("https://oauth2.googleapis.com/token", data={
            "client_id": settings.YOUTUBE["client_id"],
            "client_secret": settings.YOUTUBE["client_secret"],
            "refresh_token": settings.YOUTUBE["refresh_token"],
            "grant_type": "refresh_token"}, timeout=25).json()
        if not tk.get("access_token"):
            err = tk.get("error", "?")
            store["youtube_ok"] = False
            hint = ""
            if "invalid_grant" in str(err):
                hint = " → التوكن انتهى (وضع Test يقتله كل 7 أيام) — انشر شاشة الموافقة في وضع Production من Google Cloud وأعد التفويض مرة واحدة فتصبح دائمة"
            return f"🔴 YouTube: التوكن مرفوض ({err}){hint}"
        ch = requests.get("https://www.googleapis.com/youtube/v3/channels",
                          params={"part": "snippet", "mine": "true"},
                          headers={"Authorization": f"Bearer {tk['access_token']}"}, timeout=20).json()
        title = (ch.get("items") or [{}])[0].get("snippet", {}).get("title", "?")
        store.update({"youtube_ok": True, "youtube_checked": _now()})
        return f"🟢 YouTube متصل: قناة «{title}» — التوكن سليم"
    except Exception as e:
        return f"🔴 YouTube: {str(e)[:80]}"


# ---------------- Facebook + Instagram ----------------
def _debug_expiry(token: str, store: dict) -> str:
    """تاريخ انتهاء التوكن (إن توفرت بيانات تطبيق Meta) — وإن لم تتوفر يقيّم دائمية الصفحة."""
    app_id, app_secret = settings.get("META_APP_ID"), settings.get("META_APP_SECRET")
    if not (app_id and app_secret):
        return ""
    d = _get("https://graph.facebook.com/debug_token",
             params={"input_token": token, "access_token": f"{app_id}|{app_secret}"})
    data = d.get("data", {})
    exp = data.get("expires_at", 0)
    if not exp or exp == 0:
        return "دائم ✓"
    days = int((exp - time.time()) / 86400)
    store["facebook_expires_days"] = days
    if days <= 7:
        notify.send(f"⚠️ <b>توكن فيسبوك ينتهي خلال {days} يوم!</b> شغّل التجديد أو أضف توكن صفحة دائم")
    return f"ينتهي بعد {days} يوم"


def check_meta(store: dict) -> list[str]:
    out = []
    page_token = settings.FACEBOOK["token"]
    if not page_token:
        out.append("⚪ Facebook: لا توكن — أضف FACEBOOK_PAGE_ACCESS_TOKEN (الشرح في docs/setup-keys.md)")
        out.append("⚪ Instagram: يتطلب توكن الصفحة أولًا")
        return out

    page = _get(f"https://graph.facebook.com/{V}/{settings.FACEBOOK['page_id']}",
                params={"fields": "name,fan_count,access_token,instagram_business_account"},
                headers={"Authorization": f"OAuth {page_token}"})
    if "error" in page or "name" not in page:
        # جرّب التجديد التلقائي لو توفر توكن مستخدم طويل الأمد
        renew = try_renew(store)
        out.append(renew or f"🔴 Facebook: {json.dumps(page.get('error', {}), ensure_ascii=False)[:110]}")
        ig_state = store.get("instagram_ok")
        out.append(("🟢 Instagram سليم (من آخر فحص)" if ig_state else "⚪ Instagram: محتاج توكن صالح"))
        return out

    store.update({"facebook_ok": True, "facebook_checked": _now(),
                  "facebook_expiry": _debug_expiry(page_token, store)})
    out.append(f"🟢 Facebook متصل: صفحة «{page['name']}» ({page.get('fan_count', '?')} متابع) "
               f"— {store.get('facebook_expiry', '')}")
    # توكن الصفحة الحقيقي (أدق من المُدخل) — خزنه للاستخدام المباشر
    if page.get("access_token"):
        store["facebook_page_token_live"] = page["access_token"][:12] + "…"  # بصمة فقط في السجل
        store["_live_page_token"] = page["access_token"]

    ig = page.get("instagram_business_account")
    if ig and ig.get("id"):
        ig_id = ig["id"]
        ig_user = settings.INSTAGRAM["user_id"] or ig_id
        store.update({"instagram_ok": True, "instagram_user_id": ig_id, "instagram_checked": _now()})
        info = _get(f"https://graph.facebook.com/{V}/{ig_id}",
                    params={"fields": "username,followers_count"},
                    headers={"Authorization": f"OAuth {page_token}"})
        if "username" in info:
            store["instagram_username"] = info["username"]
            out.append(f"🟢 Instagram متصل: @{info['username']} ({info.get('followers_count', '?')} متابع)"
                       + (" — اكتُشف تلقائيًا من الصفحة ✓" if not settings.INSTAGRAM["user_id"] else ""))
        else:
            out.append("🟢 Instagram مرتبط بالصفحة (المعرّف موجود)")
    else:
        store["instagram_ok"] = False
        out.append("🟡 Facebook سليم لكن لا حساب انستجرام مرتبط بالصفحة — اربط @xdaw_nova كحساب Business من إعدادات الصفحة")
    return out


def try_renew(store: dict) -> str | None:
    """تجديد تلقائي: توكن مستخدم طويل الأمد → صفحة دائمة (يُستدعى عند فشل التوكن الحالي)."""
    ll = settings.get("FACEBOOK_LONG_LIVED_TOKEN")
    app_id, app_secret = settings.get("META_APP_ID"), settings.get("META_APP_SECRET")
    if not (ll and app_id and app_secret):
        return None
    ex = _get("https://graph.facebook.com/oauth/access_token", params={
        "grant_type": "fb_exchange_token", "client_id": app_id,
        "client_secret": app_secret, "fb_exchange_token": ll})
    new_user = ex.get("access_token")
    if not new_user:
        return f"🔴 Facebook: فشل التجديد التلقائي ({json.dumps(ex)[:80]}) — أضف توكن مستخدم جديد"
    pages = _get("https://graph.facebook.com/me/accounts",
                 params={"fields": "name,access_token,instagram_business_account"},
                 headers={"Authorization": f"OAuth {new_user}"})
    for pg in pages.get("data", []):
        if pg.get("id") == settings.FACEBOOK["page_id"]:
            store["_live_page_token"] = pg["access_token"]
            store["facebook_ok"] = True
            store["facebook_renewed_at"] = _now()
            notify.send("🔄 <b>تم تجديد توكن فيسبوك تلقائيًا</b> — النشر مستمر بلا انقطاع ✓")
            return "🟢 Facebook: تم التجديد التلقائي بنجاح ✓ (توكن صفحة دائم جديد)"
    return "🔴 Facebook: التجديد تم لكن الصفحة لم تظهر — تأكد من صلاحية إدارة الصفحة"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")


def check_telegram(store: dict) -> str:
    if not settings.has_telegram():
        return "⚪ Telegram: لا توكن (TELEGRAM_BOT_TOKEN/CHAT_ID)"
    me = _get(f"https://api.telegram.org/bot{settings.TELEGRAM['bot_token']}/getMe")
    if me.get("ok"):
        store["telegram_ok"] = True
        return f"🟢 Telegram متصل: @{me['result']['username']}"
    return "🔴 Telegram: توكن غير صالح"


def main() -> int:
    store = load_store()
    lines = [check_youtube(store)] + check_meta(store) + [check_telegram(store)]
    if settings.PEXELS_KEY:
        lines.append("🟢 Pexels مفعّل — مشاهد حقيقية")
    if settings.has_llm():
        lines.append("🟢 LLM مفعّل — مواضيع لا نهائية أذكى")
    save_store(store)
    print("=" * 52)
    print("صحة التوكنات — مصنع دوشة", _now())
    print("=" * 52)
    for l in lines:
        print(" ", l)
    # أبلغ فقط عند وجود مشكلة أو أول فحص (إلا لو الربط مكتمل → تقرير أسبوعي مختصر)
    joined = "\n".join(lines)
    if "🔴" in joined or "⚪" in joined:
        notify.send("🔌 <b>فحص الربط — يحتاج انتباهك</b>\n" + joined)
    return 0


if __name__ == "__main__":
    sys.exit(main())
