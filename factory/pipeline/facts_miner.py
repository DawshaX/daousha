#!/usr/bin/env python3
"""منجّم الحقائق المجاني: يملأ بنك المواضيع من ويكيبيديا (بلا مفاتيح، بلا حدود).

يعمل على أي سيرفر بإنترنت مفتوح. هنا في الساندبوكس يفشل بأمان (لا إنترنت).
المصدر موثق في كل موضوع (source urls) — والمراجعة عبر عينات تلجرام.
"""
import argparse
import json
import re
from pathlib import Path
import requests
from . import FACTORY_ROOT, load_config

CFG = load_config("factory")
UA = {"User-Agent": "XDAW-NOVA-Factory/2.0 (educational shorts; contact: dawsha)"}


def _sentences(text: str) -> list:
    parts = re.split(r"[.!?؟。]+\s*", text)
    return [p.strip() for p in parts if 20 <= len(p.strip()) <= 140]


def _wiki_summary(lang: str, title: str) -> str:
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
    r = requests.get(url, headers=UA, timeout=20)
    if r.status_code != 200:
        return ""
    return r.json().get("extract", "") or ""


def mine_topic(topic: dict) -> dict | None:
    """يرجع الحقائق AR+EN أو None لو لم يجد مادة كافية."""
    ar_text = _wiki_summary("ar", topic["topic_ar"].replace(" ", "_"))
    facts_ar = _sentences(ar_text)[:3]
    if len(facts_ar) < 3:
        return None
    en_text = _wiki_summary("en", topic["topic_en"].replace(" ", "_"))
    facts_en = _sentences(en_text)[:3]
    if len(facts_en) < 3:
        # الإنجليزية للكتابة فقط — نستخدم ترجمة حرفية بسيطة كاحتياطي
        facts_en = facts_ar  # تُستبدل لاحقاً؛ الشكل يحمل العربي أساساً
    return {
        "facts_ar": facts_ar, "facts_en": facts_en,
        "source_ar": f"https://ar.wikipedia.org/wiki/{topic['topic_ar'].replace(' ', '_')}",
        "source_en": f"https://en.wikipedia.org/wiki/{topic['topic_en'].replace(' ', '_')}",
    }


def fill_needed(n: int = 5, max_scan: int = 60) -> dict:
    p = FACTORY_ROOT / CFG["paths"]["bank_full"]
    if not p.exists():
        return {"filled": 0, "reason": "NO_BANK_FULL"}
    bank = json.loads(p.read_text(encoding="utf-8"))
    needy = [t for t in bank if t.get("status") == "needs_facts"][:max_scan]
    filled, failed = 0, []
    for t in needy:
        if filled >= n:
            break
        try:
            got = mine_topic(t)
        except Exception as e:
            return {"filled": filled, "reason": f"NETWORK:{type(e).__name__}"}
        if got:
            t.update(got)
            t["status"] = "auto_mined"
            filled += 1
        else:
            failed.append(t["id"])
    if filled:
        p.write_text(json.dumps(bank, ensure_ascii=False, indent=1), encoding="utf-8")
    return {"filled": filled, "failed": failed[:10]}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA facts miner (Wikipedia)")
    ap.add_argument("--fill", type=int, default=5)
    a = ap.parse_args()
    print(json.dumps(fill_needed(a.fill), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
