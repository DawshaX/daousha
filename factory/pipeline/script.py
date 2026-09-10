#!/usr/bin/env python3
"""المرحلة 2 — كاتب السيناريو: hook + 3 حقائق + خاتمة (AR+EN) + برومبتات المشاهد الأربعة."""
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from . import load_config

CFG = load_config("factory")
BRAND = load_config("brand")
RULES = CFG["script_rules"]
STYLE = BRAND["video_style"]["scene_style_suffix"]


@dataclass
class Scene:
    index: int
    role: str  # hook | fact1 | fact2 | fact3_outro
    overlay_ar: str
    overlay_en: str
    prompt_en: str  # image/stock prompt (English works best)


@dataclass
class Script:
    topic_id: str
    lang: str
    title: str
    body: str
    hashtags: list
    scenes: list
    caption: str

    @property
    def chars(self):
        return len(self.body)


HOOKS_AR = [
    "هل تعلم أن {t}؟",
    "انتظر! {t}... ولن تصدق التفاصيل!",
    "{t}... والحقيقة أغرب مما تتخيل!",
]
HOOKS_EN = [
    "Did you know that {t}?",
    "Wait! {t}... and the details are insane!",
    "{t}... and the truth is stranger than fiction!",
]

FACT_LABEL_AR = ["الحقيقة الأولى", "الحقيقة الثانية", "الحقيقة الثالثة"]
FACT_LABEL_EN = ["Fact one", "Fact two", "Fact three"]

# جسور تلقائية إذا كان النص أقصر من الحد (تحافظ على الإيقاع والمدة)
BRIDGES_AR = ["ركز معي… القادم سيصدمك أكثر.", "والأغرب من ذلك كله… ما ستسمعه الآن."]
BRIDGES_EN = ["Stay with me — it gets even crazier.", "And the strangest part… is what comes next."]


def _pick_hook(lang: str, topic: str, salt: int) -> str:
    hooks = HOOKS_AR if lang == "ar" else HOOKS_EN
    return hooks[salt % len(hooks)].format(t=topic)


def build_script(topic: dict, lang: str) -> Script:
    assert lang in ("ar", "en"), "lang must be ar|en"
    salt = sum(ord(c) for c in topic["id"])
    t = topic[f"topic_{lang}"]
    facts = topic[f"facts_{lang}"]
    labels = FACT_LABEL_AR if lang == "ar" else FACT_LABEL_EN
    cta = RULES["cta_ar"] if lang == "ar" else RULES["cta_en"]

    hook = _pick_hook(lang, t, salt)
    lines = [hook]
    for i, f in enumerate(facts[:3]):
        sep = ": "
        lines.append(f"{labels[i]}{sep}{f}")
    lines.append(cta)
    body = "\n".join(lines)
    # إصلاح تلقائي للنص القصير: جسور قبل الخاتمة حتى بلوغ الحد
    bridges = BRIDGES_AR if lang == "ar" else BRIDGES_EN
    bi = 0
    while len(body) < RULES["min_chars"] and bi < len(bridges):
        lines.insert(-1, bridges[bi])
        body = "\n".join(lines)
        bi += 1

    title = topic[f"angle_{lang}"]
    tags = BRAND["captions_platform"][f"hashtags_{lang}"]
    tagline = BRAND["identity"][f"tagline_{lang}"]
    tpl = BRAND["captions_platform"][f"caption_template_{lang}"]
    caption = tpl.format(title=title, tagline_ar=tagline, tagline_en=tagline,
                         tags=" #".join(tags))

    # المشاهد الأربعة: hook + 3 حقائق (الرابع يحمل الخاتمة)
    def _cut(text, n):
        text = text.strip()
        if len(text) <= n:
            return text
        cut = text[:n].rsplit(" ", 1)[0]
        return cut if len(cut) > n * 0.6 else text[:n]
    roles = ["hook", "fact1", "fact2", "fact3_outro"]
    overlays_ar = [_cut(hook, 42), _cut(facts[0], 42), _cut(facts[1], 42), cta]
    overlays_en = [topic["angle_en"], _cut(topic["facts_en"][0], 48),
                   _cut(topic["facts_en"][1], 48), RULES["cta_en"]]
    scene_topics = [t, facts[0], facts[1], facts[2]]
    scenes = []
    for i in range(4):
        scenes.append(Scene(
            index=i + 1, role=roles[i],
            overlay_ar=overlays_ar[i], overlay_en=overlays_en[i],
            prompt_en=f"{scene_topics[i]}, {STYLE}",
        ))

    return Script(topic_id=topic["id"], lang=lang, title=title, body=body,
                  hashtags=tags, scenes=[asdict(s) for s in scenes], caption=caption)


def validate(script: Script) -> list:
    """بوابة الجودة النصية — ترجع قائمة أخطاء (فارغة = سليم)."""
    errors = []
    n = script.chars
    if n < RULES["min_chars"]:
        errors.append(f"TOO_SHORT:{n}<{RULES['min_chars']}")
    if n > RULES["max_chars"]:
        errors.append(f"TOO_LONG:{n}>{RULES['max_chars']}")
    cta = RULES["cta_ar"] if script.lang == "ar" else RULES["cta_en"]
    if cta not in script.body:
        errors.append("MISSING_CTA")
    if len(script.scenes) != 4:
        errors.append("SCENES!=4")
    return errors


def save_markdown(script: Script, path):
    sc = "\n".join(
        f"{i+1}. {s['role']}: {s['overlay_ar']} / {s['overlay_en']}"
        for i, s in enumerate(script.scenes))
    md = (f"# {script.title}\n\n**topic:** {script.topic_id} | **lang:** {script.lang} "
          f"| **chars:** {script.chars}\n\n## Body\n{script.body}\n\n"
          f"## Scenes\n{sc}\n\n## Caption\n{script.caption}\n")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(md, encoding="utf-8")
    return str(path)


if __name__ == "__main__":
    from .topics import load_bank
    bank = load_bank()
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    lang = sys.argv[2] if len(sys.argv) > 2 else "ar"
    s = build_script(bank[idx % len(bank)], lang)
    print(f"chars={s.chars} errors={validate(s)}")
    print(s.body)
