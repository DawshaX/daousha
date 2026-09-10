#!/usr/bin/env python3
"""المنسّق: حلقة كاملة من الموضوع إلى المخزون (مراحل 1→7) بأمر واحد.

مثال: python3 -m pipeline.make_episode --lang both --tts-provider test
"""
import argparse
import json
import sys
from pathlib import Path
from . import FACTORY_ROOT, load_config
from . import topics as T
from .script import build_script, validate, save_markdown
from .tts import synthesize, estimate_duration
from .visuals import build_episode_visuals
from .assemble import assemble
from .qc import check
from .vault import add as vault_add

CFG = load_config("factory")


def make_one(topic: dict, lang: str, tts_provider: str) -> dict:
    work = FACTORY_ROOT / CFG["paths"]["output_dir"] / f"{topic['id']}-{lang}"
    work.mkdir(parents=True, exist_ok=True)

    # 1-2) سيناريو
    script = build_script(topic, lang)
    errs = validate(script)
    if errs:
        return {"ok": False, "stage": "script", "errors": errs}
    sj = work / "script.json"
    sj.write_text(json.dumps({"topic_id": script.topic_id, "lang": script.lang,
                              "title": script.title, "body": script.body,
                              "scenes": script.scenes, "caption": script.caption},
                             ensure_ascii=False, indent=1), encoding="utf-8")
    save_markdown(script, work / "script.md")
    (work / "caption.txt").write_text(script.caption, encoding="utf-8")

    # 3) صوت
    narr = work / f"narration_{lang}.wav"
    try:
        synthesize(script.body, lang, narr, tts_provider)
    except Exception as e:
        return {"ok": False, "stage": "tts", "errors": [f"{type(e).__name__}:{e}"[:200]]}

    # 4) مشاهد
    key = "overlay_ar" if lang == "ar" else "overlay_en"
    seed_base = sum(ord(c) for c in topic["id"])
    try:
        build_episode_visuals(topic["id"], lang, [s[key] for s in script.scenes],
                              work, seed_base)
    except Exception as e:
        return {"ok": False, "stage": "visuals", "errors": [f"{type(e).__name__}:{e}"[:200]]}

    # 5) تجميع
    try:
        rep = assemble(work, work / f"final_{lang}.mp4")
    except Exception as e:
        return {"ok": False, "stage": "assemble", "errors": [f"{type(e).__name__}:{e}"[:300]]}

    # 6) جودة
    qc = check(Path(rep["video"]), Path(rep["srt"]), branded=True)
    (work / "qc.json").write_text(json.dumps(qc, ensure_ascii=False, indent=1), encoding="utf-8")
    if not qc["pass"]:
        return {"ok": False, "stage": "qc", "errors": qc["errors"]}

    # 7) مخزون
    entry = vault_add(Path(rep["video"]), Path(rep["srt"]), sj, branded=True)
    return {"ok": True, "entry": entry["id"], "duration": qc["duration"],
            "chars": script.chars, "video": entry["video"]}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA make_episode")
    ap.add_argument("--lang", default="both", choices=["ar", "en", "both"])
    ap.add_argument("--tts-provider", default=None)
    ap.add_argument("--topic-id", default=None)
    ap.add_argument("--topic-idx", default=None, type=int)
    a = ap.parse_args()

    bank = T.load_bank()
    state = T.load_state()
    if a.topic_id:
        topic = next((t for t in bank if t["id"] == a.topic_id), None)
        if not topic:
            print(f"TOPIC_NOT_FOUND: {a.topic_id}");
            sys.exit(2)
    elif a.topic_idx is not None:
        topic = bank[a.topic_idx % len(bank)]
    else:
        topic = T.next_topic(state, bank)
        if not topic:
            print("BANK_EMPTY_NEED_EXPANSION");
            sys.exit(3)

    langs = ["ar", "en"] if a.lang == "both" else [a.lang]
    provider = a.tts_provider or CFG["production"]["tts_provider"]
    results = {}
    ok_all = True
    for lang in langs:
        print(f"== {topic['id']} [{lang}] tts={provider} ==", flush=True)
        r = make_one(topic, lang, provider)
        results[lang] = r
        print(json.dumps(r, ensure_ascii=False), flush=True)
        ok_all = ok_all and r["ok"]
    if ok_all:
        T.mark_consumed(state, topic["id"], topic.get("cat", "?"))
        print(f"CONSUMED: {topic['id']}")
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
