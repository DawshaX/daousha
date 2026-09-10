#!/usr/bin/env python3
"""المرحلة 1 — إدارة بنك المواضيع: اختيار بتدوير الفئات، منع التكرار، إحصاءات."""
import json
import sys
from pathlib import Path
from . import FACTORY_ROOT, load_config

CFG = load_config("factory")

CATEGORIES = {
    "body": "جسم الإنسان", "space": "الفضاء", "animals": "الحيوان",
    "earth": "الأرض", "history": "التاريخ", "tech": "التكنولوجيا",
    "mind": "العقل", "nature": "الطبيعة", "universe": "الكون",
    "future": "المستقبل", "money": "المال", "sports": "الرياضة",
}


def _load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def load_bank() -> list:
    """يدمج بنك البذرة + البنك الموسّع (إن وجد)."""
    bank = _load_json(FACTORY_ROOT / CFG["paths"]["bank_seed"], [])
    full = _load_json(FACTORY_ROOT / CFG["paths"]["bank_full"], [])
    seen = {t["id"] for t in bank}
    for t in full:
        if t["id"] not in seen:
            bank.append(t)
            seen.add(t["id"])
    return bank


def load_state() -> dict:
    default = {"consumed": [], "recent_cats": [], "produced_count": 0, "published_count": 0}
    state = _load_json(FACTORY_ROOT / CFG["paths"]["state"], default)
    for k, v in default.items():
        state.setdefault(k, v)
    return state


def save_state(state: dict):
    p = FACTORY_ROOT / CFG["paths"]["state"]
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")


def next_topic(state: dict, bank: list = None) -> dict | None:
    """التالي: غير مستهلك + فئة مختلفة عن آخر 3 (تدوير يمنع الملل)."""
    bank = bank or load_bank()
    consumed = set(state.get("consumed", []))
    recent = state.get("recent_cats", [])[-3:]
    # الجاهز فقط: موضوع بلا حقائق موثقة لا يدخل الإنتاج أبداً
    fresh = [t for t in bank if t["id"] not in consumed and t.get("facts_ar")]
    if not fresh:
        return None
    for t in fresh:
        if t.get("cat") not in recent:
            return t
    return fresh[0]


def mark_consumed(state: dict, topic_id: str, cat: str):
    if topic_id not in state["consumed"]:
        state["consumed"].append(topic_id)
    state["recent_cats"] = (state.get("recent_cats", []) + [cat])[-6:]
    state["produced_count"] = state.get("produced_count", 0) + 1
    save_state(state)


def stats() -> dict:
    bank = load_bank()
    state = load_state()
    consumed = set(state.get("consumed", []))
    ready = [t for t in bank if t.get("facts_ar")]
    remaining = [t for t in ready if t["id"] not in consumed]
    return {
        "bank_total": len(bank),
        "ready_total": len(ready),
        "needs_facts": len(bank) - len(ready),
        "consumed": len(consumed),
        "remaining": len(remaining),
        "remaining_hours_at_hourly": len(remaining),
        "produced_count": state.get("produced_count", 0),
        "published_count": state.get("published_count", 0),
    }


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--stats":
        print(json.dumps(stats(), ensure_ascii=False, indent=1))
    else:
        t = next_topic(load_state())
        print(json.dumps(t, ensure_ascii=False, indent=1) if t else "BANK_EMPTY_NEED_EXPANSION")
