"""الإعدادات المركزية — يقرأ من متغيرات البيئة أولاً ثم secrets.txt (تنسيق قديم متوافق)."""
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "work"
OUT = ROOT / "content" / "out"
CACHE = ROOT / "content" / "media_cache"
STATE = ROOT / "state"
FONTS = ROOT / "assets" / "fonts"
for d in (WORK, OUT, CACHE, STATE):
    d.mkdir(parents=True, exist_ok=True)


def _load_legacy_secrets() -> dict:
    """تنسيق النظام القديم: سطر المفتاح، سطر فارغ، سطر القيمة (يتحمل CRLF)."""
    path = ROOT / "secrets.txt"
    out = {}
    if not path.exists():
        return out
    lines = path.read_text(encoding="utf-8", errors="ignore").replace("\r", "").splitlines()
    for i, l in enumerate(lines):
        k = l.strip()
        if not k or k.startswith("#") or "=" in k:
            continue
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j < len(lines):
            out[k] = lines[j].strip()
    return out


_LEGACY = _load_legacy_secrets()


def get(key: str, default: str = "") -> str:
    v = os.environ.get(key, "").strip()
    if v:
        return v
    return _LEGACY.get(key, default).strip()


def get_bool(key: str, default: bool = False) -> bool:
    v = get(key, "").lower()
    if not v:
        return default
    return v in ("1", "true", "yes", "on")


def get_float(key: str, default: float) -> float:
    try:
        return float(get(key, str(default)))
    except ValueError:
        return default


def get_int(key: str, default: int) -> int:
    try:
        return int(float(get(key, str(default))))
    except ValueError:
        return default


# ---------- مفاتيح المنصات ----------
# توافق مع أسماء السكريتس القديمة (FULL/OLD من عصر Manus)
YT_RT = (get("YOUTUBE_REFRESH_TOKEN") or get("YOUTUBE_REFRESH_TOKEN_FULL")
         or get("YOUTUBE_REFRESH_TOKEN_OLD"))
YOUTUBE = {
    "client_id": get("YOUTUBE_CLIENT_ID"),
    "client_secret": get("YOUTUBE_CLIENT_SECRET"),
    "refresh_token": YT_RT,
}
# الحسابات الرسمية الموثقة (من سجلات النظام القديم) — توكن فقط هو المطلوب إضافته
FACEBOOK = {"page_id": (get("FACEBOOK_PAGE_ID", "1265727539958933")
                         or get("FB_PAGE_ID", "1265727539958933")),
            "token": (get("FACEBOOK_PAGE_ACCESS_TOKEN") or get("FB_PAGE_ACCESS_TOKEN")
                      or get("FACEBOOK_PAGE_TOKEN"))}
INSTAGRAM = {"user_id": (get("INSTAGRAM_USER_ID") or get("INSTAGRAM_ACCOUNT_ID")),
             "token": get("INSTAGRAM_ACCESS_TOKEN") or get("FACEBOOK_PAGE_ACCESS_TOKEN")}
TELEGRAM = {"bot_token": get("TELEGRAM_BOT_TOKEN"), "chat_id": get("TELEGRAM_CHAT_ID", "1890579200")}
PEXELS_KEY = get("PEXELS_API_KEY")
LLM = {"base": get("LLM_API_BASE"), "key": get("LLM_API_KEY"), "model": get("LLM_MODEL", "llama-3.3-70b-versatile")}

# ---------- ضبط عام ----------
VOICE_AR = get("NOVA_VOICE_AR", "ar-EG-SalmaNeural")   # دوشة — صوت أنثوي مصري لطيف
VOICE_EN = get("NOVA_VOICE_EN", "en-US-JennyNeural")    # أخت دوشة الإنجليزية
VOICE_RATE = get("NOVA_VOICE_RATE", "+8%")              # حماس أسرع قليلًا
VOICE_PITCH = get("NOVA_VOICE_PITCH", "+12Hz")          # نبرة مبهجة مجنونة
DAILY_CAP = get_int("NOVA_DAILY_CAP", 4)
PLATFORM_GAP_H = get_float("NOVA_PLATFORM_GAP_H", 1.0)  # كل ساعة فيديو (طلب المالك)
LANGS = [l.strip() for l in get("NOVA_LANGS", "ar").split(",") if l.strip()]
MUSIC_VOLUME = get_float("NOVA_MUSIC_VOLUME", 0.10)
TIKTOK_ENABLED = get_bool("NOVA_TIKTOK_ENABLED", False)
AUTO_GIT = get_bool("NOVA_AUTO_GIT", get_bool("GITHUB_ACTIONS", False))
IN_GITHUB = get_bool("GITHUB_ACTIONS", False)
GITHUB_REPOSITORY = get("GITHUB_REPOSITORY", "")
PUBLIC_VIDEO_BASE = get("NOVA_PUBLIC_VIDEO_BASE").rstrip("/")

BRAND = {"line": "XDAW | XDAWNOVA", "name_ar": "دوشة", "name_en": "Dawsha",
         "outro": "تابع دوشة | Follow Dawsha", "hashtags": "#حقائق #علوم #دوشة #داوسها #XDAWNOVA"}


# مخزن التوكنات الحي (من نظام التجديد التلقائي — خارج Git)
def tokens_store() -> dict:
    p = STATE / "tokens.json"
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def has_youtube() -> bool:
    return all(YOUTUBE.values())


def has_facebook() -> bool:
    return all(FACEBOOK.values())


def has_instagram() -> bool:
    return all(INSTAGRAM.values())


def has_telegram() -> bool:
    return all(TELEGRAM.values())


def has_llm() -> bool:
    return bool(LLM["base"] and LLM["key"])


# ─── تحميل تلقائي من state/tokens.json (محلي، متجاهل في git) ───
def _nova_state_autoload():
    import json as _json
    from pathlib import Path as _P
    _f = _P(__file__).resolve().parents[1] / "state" / "tokens.json"
    try:
        _d = _json.loads(_f.read_text(encoding="utf-8"))
    except Exception:
        return
    if not YOUTUBE.get("client_id") and _d.get("youtube_client_id"):
        YOUTUBE["client_id"] = _d["youtube_client_id"]
    if not YOUTUBE.get("client_secret") and _d.get("youtube_client_secret"):
        YOUTUBE["client_secret"] = _d["youtube_client_secret"]
    if not YOUTUBE.get("refresh_token") and _d.get("youtube_refresh_token"):
        YOUTUBE["refresh_token"] = _d["youtube_refresh_token"]
    try:
        if not FACEBOOK.get("token") and _d.get("facebook_page_token"):
            FACEBOOK["token"] = _d["facebook_page_token"]
    except Exception:
        pass

_nova_state_autoload()
