"""إدارة الحالة: مكتبة المواضيع، سجل النشر، السلم الآمن، عداد الأخطاء."""
import json
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

from . import settings
from .content import can_produce  # noqa: F401

TOPICS_PATH = settings.ROOT / "content" / "topics.json"
PUBLISH_LOG = settings.STATE / "publish_log.json"
LADDER_PATH = settings.STATE / "ladder.json"
ENGINE_PATH = settings.STATE / "engine.json"

CAIRO_TZ = timezone(timedelta(hours=2))  # توقيت القاهرة (بدون DST منذ 2023)


def now() -> datetime:
    return datetime.now(timezone.utc)


def cairo_today() -> str:
    return now().astimezone(CAIRO_TZ).strftime("%Y-%m-%d")


def _read_json(path: Path, default):
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def _write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


# ---------------- المواضيع ----------------
def load_topics() -> list:
    return _read_json(TOPICS_PATH, [])


def save_topics(topics: list):
    _write_json(TOPICS_PATH, topics)


def find_topic(topics: list, tid: str):
    for t in topics:
        if t["id"] == tid:
            return t
    return None


def next_topic(topics: list) -> dict | None:
    """الحلقة التالية: أول موضوع بحالة queued/scripted وقابل للإنتاج."""
    from .content import can_produce
    for t in topics:
        if t.get("status") in ("queued", "scripted") and can_produce(t):
            return t
    return None


def topic_awaiting_publish(topics: list) -> dict | None:
    """حلقة منتجة (لها فيديو محفوظ) تنتظر النشر على منصات ناقصة."""
    for t in topics:
        if t.get("status") in ("produced", "partial") and t.get("videos") and pending_platforms(t):
            stored = {l: Path(p) for l, p in t["videos"].items() if Path(p).exists()}
            if stored:
                t["_stored_videos"] = stored
                return t
    return None


def pending_platforms(topic: dict) -> list:
    """المنصات التي لم يُنشر عليها الموضوع بعد."""
    pub = topic.get("published", {})
    wanted = topic.get("platforms", ["youtube", "facebook", "instagram"])
    return [p for p in wanted if not pub.get(p)]


# ---------------- سجل النشر ----------------
def load_log() -> list:
    return _read_json(PUBLISH_LOG, [])


def log_event(event: dict):
    log = load_log()
    event["ts"] = now().isoformat(timespec="seconds")
    log.append(event)
    _write_json(PUBLISH_LOG, log[-3000:])


def published_today_count() -> int:
    today = cairo_today()
    return sum(1 for e in load_log()
               if e.get("date") == today and not e.get("skipped")
               and e.get("platforms_done") and not e.get("error"))


def platform_last_ts(platform: str) -> float:
    for e in reversed(load_log()):
        if platform in e.get("platforms_done", []) and not e.get("error"):
            try:
                return datetime.fromisoformat(e["ts"]).timestamp()
            except Exception:
                return 0.0
    return 0.0


# ---------------- السلم التصاعدي الآمن ----------------
LADDER_LEVELS = [4, 6, 8, 12, 16, 20, 24]
PROMOTE_STREAKS = [0, 5, 10, 18, 30, 45, 60]


def load_ladder() -> dict:
    d = _read_json(LADDER_PATH, {})
    if not d:
        cap_env = settings.DAILY_CAP
        level = LADDER_LEVELS.index(cap_env) if cap_env in LADDER_LEVELS else 0
        d = {"level": level, "dailyCap": cap_env, "streakSafe": 0, "streakRisky": 0}
    return d


def save_ladder(d: dict):
    _write_json(LADDER_PATH, d)


def record_cycle_result(ok: bool) -> dict:
    """تحديث streak والسقف بعد كل دورة (يرتقي آليًا، لا يتجاوز 24/يوم أبدًا)."""
    lad = load_ladder()
    if ok:
        lad["streakSafe"] += 1
        lad["streakRisky"] = 0
    else:
        lad["streakRisky"] += 1
        if lad["streakRisky"] >= 3:
            lad["streakSafe"] = 0
            lad["streakRisky"] = 0
            lad["level"] = 0
            lad["dailyCap"] = LADDER_LEVELS[0]
    nxt = None
    for i, s in enumerate(PROMOTE_STREAKS):
        if lad["streakSafe"] >= s:
            nxt = i
    if nxt is not None and nxt > lad["level"]:
        lad["level"] = nxt
        lad["dailyCap"] = min(LADDER_LEVELS[nxt], settings.DAILY_CAP if settings.DAILY_CAP < LADDER_LEVELS[nxt] else LADDER_LEVELS[nxt])
        if settings.DAILY_CAP < lad["dailyCap"]:
            lad["dailyCap"] = settings.DAILY_CAP  # احترام سقف المالك إن كان أقل
    save_ladder(lad)
    return lad


# ---------------- محرك (أخطاء، إيقاف) ----------------
def engine_state() -> dict:
    return _read_json(ENGINE_PATH, {"consecutiveErrors": 0, "halted": False, "haltReason": ""})


def save_engine(d: dict):
    _write_json(ENGINE_PATH, d)


def is_halted() -> bool:
    return engine_state().get("halted", False)


def halt(reason: str):
    d = engine_state()
    d.update({"halted": True, "haltReason": reason, "consecutiveErrors": d.get("consecutiveErrors", 0)})
    save_engine(d)


def resume():
    save_engine({"consecutiveErrors": 0, "halted": False, "haltReason": ""})


def register_error(err: str) -> bool:
    """يعيد True إذا بلغنا 3 أخطاء متتالية → إيقاف."""
    d = engine_state()
    d["consecutiveErrors"] = d.get("consecutiveErrors", 0) + 1
    if d["consecutiveErrors"] >= 3:
        d["halted"] = True
        d["haltReason"] = err
        save_engine(d)
        return True
    save_engine(d)
    return False


# ---------------- الضوابط ----------------
def can_publish_now(platform: str) -> tuple[bool, str]:
    if is_halted():
        return False, "halted"
    if published_today_count() >= load_ladder()["dailyCap"]:
        return False, "daily_cap"
    gap = settings.PLATFORM_GAP_H * 3600
    last = platform_last_ts(platform)
    if last and (time.time() - last) < gap:
        return False, "platform_gap"
    return True, "ok"


def status_summary() -> dict:
    topics = load_topics()
    return {
        "topics": len(topics),
        "queued": sum(1 for t in topics if t.get("status") in ("queued", "scripted")),
        "produced": sum(1 for t in topics if t.get("status") == "produced"),
        "published": sum(1 for t in topics if t.get("status") == "published"),
        "partial": sum(1 for t in topics if t.get("status") == "partial"),
        "ladder": load_ladder(),
        "engine": engine_state(),
        "today_published": published_today_count(),
    }
