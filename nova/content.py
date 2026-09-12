"""بنك المحتوى: تحميل المواضيع، تكوين السيناريو، التوليد اللانهائي (قوالب أو LLM مجاني)."""
import itertools
import json
import re
from pathlib import Path

from . import settings

FACT_BANK_PATH = settings.ROOT / "content" / "fact_bank.json"

# ترقيم الحلقات التلقائية يبدأ بعد آخر حلقة معروفة
_AUTO_N = [0]


def load_fact_bank() -> list:
    if FACT_BANK_PATH.exists():
        return json.loads(FACT_BANK_PATH.read_text(encoding="utf-8"))
    return []


def _bump_auto_number(topics: list) -> int:
    mx = 0
    for t in topics:
        m = re.match(r"(?:ep|auto-)(\d+)", t["id"])
        if m:
            mx = max(mx, int(m.group(1)))
    return mx + 1


def compose_script(topic: dict, lang: str = "ar") -> dict:
    """يبني نص التعليق الصوتي كاملًا كسطور مرتبة حسب المقاطع: hook / fact1..3 / outro."""
    s = topic.get("script", {})
    if lang == "en" and not s.get("lines_en"):
        return None
    lines = s.get("lines_en" if lang == "en" else "lines_ar") or []
    if lines:
        segs = [dict(l) for l in lines]
    else:
        segs = _template_lines(topic, lang)
    return segs


def _template_lines(topic: dict, lang: str) -> list:
    """توليد سطور من hook/facts/outro المكتوبة في الموضوع (بديل عن سكربت مرتب مسبقًا)."""
    key = "en" if lang == "en" else "ar"
    hook = topic.get(f"hook_{key}") or topic.get("hook_ar", "")
    facts = topic.get(f"facts_{key}") or topic.get("facts_ar") or []
    outro = topic.get("outro_{0}".format(key)) or ("تابع داوسها! الحلقة الجاية أقوى." if key == "ar"
                                                   else "Follow Dawsha! The next episode is even better.")
    labels_ar = ["الحقيقة الأولى:", "الحقيقة الثانية:", "والحقيقة الثالثة:"]
    labels_en = ["Fact one:", "Fact two:", "And fact three:"]
    segs = [{"seg": "hook", "text": hook}] if hook else []
    for i, f in enumerate(facts[:3]):
        label = (labels_ar if key == "ar" else labels_en)[i]
        segs.append({"seg": f"fact{i+1}", "text": f"{label} {f}"})
    segs.append({"seg": "outro", "text": outro})
    return segs


def full_text(segs: list) -> str:
    return " ".join(x["text"] for x in segs).strip()


def can_produce(topic: dict) -> bool:
    """هل يمكن إنتاج هذه الحلقة بالمحرك الحالي؟ (سيناريو مرتب أو حقائق + افتتاحية)"""
    s = topic.get("script") or {}
    if s.get("lines_ar"):
        return True
    return bool(topic.get("hook_ar") and topic.get("facts_ar"))


def make_title_caption(topic: dict, lang: str) -> tuple[str, str]:
    """(عنوان النشر، كابشن المنشور) لكل لغة."""
    key = "en" if lang == "en" else "ar"
    title = (topic.get(f"title_{key}") or topic.get("title_ar") or topic["angle"])[:95]
    brand = settings.BRAND
    tags = "#facts #science #dawsha #XDAWNOVA" if key == "en" else brand["hashtags"]
    cap = f"{title}\n{'Follow Dawsha for more!' if key == 'en' else 'تابع داوسها للمزيد! 🧠'} {tags}"
    return title, cap


# ---------------- التوليد اللانهائي ----------------
def refill_from_archive(min_pending: int = 100) -> int:
    """يسحب من topics_archive.json عندما يقل الوقود — مصنع لا ينضب."""
    import json as _json
    root = Path(__file__).resolve().parents[1]
    arch_p = root / "content" / "topics_archive.json"
    top_p = root / "content" / "topics.json"
    try:
        topics = _json.loads(top_p.read_text())
        items = topics if isinstance(topics, list) else topics.get("topics", [])
        pend = sum(1 for x in items if x.get("status") != "published")
        if pend >= min_pending:
            return 0
        # قراءة الأجزاء (topics_archive_part1..N) — أول جزء فيه وقود كافي غالبًا
        arch = []
        for i in range(1, 10):
            pp = root / "content" / f"topics_archive_part{i}.json"
            if pp.exists():
                arch = _json.loads(pp.read_text())
                arch_p = pp  # نحتفظ بالمصدر لتحديثه لاحقًا
                break
        if not arch:
            return 0
        need = min_pending - pend + 50
        moved, rest = arch[:need], arch[need:]
        if not moved:
            return 0
        new_items = items + moved
        top_p.write_text(_json.dumps(new_items if isinstance(topics, list) else {**topics, "topics": new_items},
                                    ensure_ascii=False, indent=1))
        arch_p.write_text(_json.dumps(rest, ensure_ascii=False))
        return len(moved)
    except Exception:
        return 0


def generate_auto_topic(topics: list, force_llm: bool = False) -> dict | None:
    """ينتج موضوعًا جديدًا من بنك الحقائق (بلا مفاتيح) أو عبر LLM مجاني إن توفر."""
    _AUTO_N[0] = _AUTO_N[0] or _bump_auto_number(topics)
    used_facts = set()
    for t in topics:
        for f in t.get("facts_ar", []):
            used_facts.add(f[:40])
    bank = load_fact_bank()

    if force_llm and settings.has_llm():
        t = _llm_topic()
        if t:
            return t

    # اختر ثيمًا له ≥3 حقائق غير مستخدمة
    rng = __import__("random")
    entries = [e for e in bank if isinstance(e, dict) and e.get("facts")]
    rng.shuffle(entries)
    for entry in entries:
        theme = entry["theme"]
        avail = [f for f in entry["facts"] if f["ar"][:40] not in used_facts]
        if len(avail) >= 3:
            rng.shuffle(avail)
            pick = avail[:3]
            title_ar = entry.get("title_ar", theme)
            title_en = entry.get("title_en", theme)
            angles_ar = ["3 حقائق صادمة", "3 أسرار لن تصدقها", "3 معلومات ستقلب نظرك", "حقائق صادمة قليلة من يعرفها"]
            angles_en = ["3 shocking facts", "3 secrets you won't believe", "3 facts that flip your view", "Shocking facts few people know"]
            tid = f"auto-{_AUTO_N[0]}"
            _AUTO_N[0] += 1
            return {
                "id": tid,
                "status": "queued",
                "topic": title_ar,
                "angle": f"{title_ar} — {rng.choice(angles_ar)}",
                "title_ar": f"{title_ar}! {rng.choice(angles_ar)}",
                "title_en": f"{title_en}! {rng.choice(angles_en)}",
                "hook_ar": rng.choice([f"توقف! ما ستسمعه عن {title_ar} لن تصدقه!", f"معلومات عن {title_ar} قليلة من يعرفها!",
                                       f"هل تعلم حقًا كل شيء عن {title_ar}؟ فكّر مرة أخرى!"]),
                "hook_en": rng.choice([f"Stop! What you're about to hear about {title_en} is unbelievable!",
                                       f"Almost nobody knows these {title_en} facts!",
                                       f"You think you know {title_en}? Think again!"]),
                "facts_ar": [p["ar"] for p in pick],
                "facts_en": [p.get("en", p["ar"]) for p in pick],
                "outro_ar": "أنت خير ونور! تابع داوسها لمعرفة المزيد!",
                "outro_en": "You are amazing! Follow Dawsha for more!",
                "scene_queries": [entry.get("scene_queries", [theme.lower()])],
                "tags": entry.get("tags", "حقائق, علوم, داوسها"),
                "auto": True,
            }
    return None


def _llm_topic() -> dict | None:
    """يطلب من LLM متوافق مع OpenAI موضوعًا جديدًا (JSON) — مجاني عبر Groq مثلًا."""
    import requests
    prompt = (
        "أنت كاتب محتوى معرفي عربي لنشرات قصيرة «3 حقائق صادمة». اختر موضوعًا جديدًا لم يُذكر "
        "(علوم/فضاء/جسم الإنسان/حيوانات/تاريخ إسلامي/تكنولوجيا) وأعد JSON فقط بالشكل: "
        '{"title_ar":"","title_en":"","hook_ar":"","hook_en":"","facts_ar":["","",""],'
        '"facts_en":["","",""],"outro_ar":"تابع داوسها!","outro_en":"Follow Dawsha!",'
        '"scene_queries":["4 كلمات بحث إنجليزية للفيديو"],"tags":"كلمات مفتاحية عربية"}'
    )
    try:
        r = requests.post(
            settings.LLM["base"].rstrip("/") + "/chat/completions",
            headers={"Authorization": f"Bearer {settings.LLM['key']}"},
            json={"model": settings.LLM["model"],
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 1.0, "max_tokens": 700},
            timeout=60)
        r.raise_for_status()
        txt = r.json()["choices"][0]["message"]["content"]
        m = re.search(r"\{.*\}", txt, re.S)
        d = json.loads(m.group(0))
        _AUTO_N[0] += 1
        return {"id": f"auto-{_AUTO_N[0]}", "status": "queued", "topic": d["title_ar"],
                "angle": d["title_ar"], **d, "auto": True}
    except Exception as e:
        print(f"[llm] failed: {e}")
        return None
