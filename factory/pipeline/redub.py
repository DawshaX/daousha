#!/usr/bin/env python3
"""إعادة البناء الكاملة v3: مشاهد المونتاج + صوت روح دوشة + تجميع + خزنة.

مثال: python3 -m pipeline.redub s01-ar --audio soul_voice.mp3
"""
import argparse
import json
import shutil
import sys
from pathlib import Path
from . import FACTORY_ROOT, load_config
from .ffmpeg_bin import run
from .assemble import assemble
from .qc import check
from .vault import add as vault_add
from .visuals import build_episode_visuals
from .make_episode import build_overlays
from .topics import load_bank

CFG = load_config("factory")


def redub(entry_id: str, audio: Path) -> dict:
    work = FACTORY_ROOT / CFG["paths"]["output_dir"] / entry_id
    sj = work / "script.json"
    if not sj.exists():
        return {"ok": False, "error": f"NO_WORKDIR:{entry_id}"}
    audio = Path(audio)
    if not audio.exists():
        return {"ok": False, "error": f"NO_AUDIO:{audio}"}
    script = json.loads(sj.read_text(encoding="utf-8"))
    bank = load_bank()
    topic = next((t for t in bank if t["id"] == script["topic_id"]), None)
    if not topic:
        return {"ok": False, "error": f"TOPIC_GONE:{script['topic_id']}"}
    lang = script["lang"]

    # 1) مشاهد المونتاج من الصفر (مشهد لكل عبارة)
    for old in work.glob("scene*.png"):
        old.unlink()
    pairs, contexts = build_overlays(topic, script["body"])
    seed_base = sum(ord(c) for c in topic["id"])
    try:
        paths = build_episode_visuals(topic["id"], lang, pairs, work, seed_base, contexts)
    except Exception as e:
        return {"ok": False, "error": f"VISUALS:{type(e).__name__}:{e}"[:200]}

    # 2) الصوت الجديد + تمديد تلقائي لو أقصر من الحد
    from .ffmpeg_bin import probe_duration
    narr = work / f"narration_{lang}.wav"
    tmpa = work / "_soul_tmp.wav"
    if audio.suffix.lower() != ".wav":
        r = run(["-y", "-i", str(audio), "-ar", "44100", "-ac", "1", str(tmpa)])
        if r.returncode != 0:
            return {"ok": False, "error": f"CONVERT_FAIL:{r.stderr[-200:]}"}
    else:
        shutil.copy(audio, tmpa)
    try:
        _min = float(load_config("factory")["video"]["min_seconds"])
        _dur = probe_duration(str(tmpa))
        if _dur < _min:
            tempo = max(0.85, _dur / (_min + 0.6))
            r = run(["-y", "-i", str(tmpa), "-filter:a", f"atempo={tempo:.3f}",
                     "-ar", "44100", "-ac", "1", str(narr)])
            if r.returncode != 0:
                return {"ok": False, "error": f"STRETCH_FAIL:{r.stderr[-200:]}"}
        else:
            shutil.copy(tmpa, narr)
    finally:
        tmpa.unlink(missing_ok=True)

    # 3) المونتاج + الجودة + الخزنة
    old_final = work / f"final_{lang}.mp4"
    if old_final.exists():
        old_final.unlink()
    try:
        rep = assemble(work, old_final)
    except Exception as e:
        return {"ok": False, "error": f"ASSEMBLE:{type(e).__name__}:{e}"[:300]}
    qc = check(Path(rep["video"]), Path(rep["srt"]), branded=True)
    (work / "qc.json").write_text(json.dumps(qc, ensure_ascii=False, indent=1), encoding="utf-8")
    if not qc["pass"]:
        return {"ok": False, "error": f"QC:{qc['errors']}"}
    entry = vault_add(Path(rep["video"]), Path(rep["srt"]), sj, branded=True, voice="soul")
    return {"ok": True, "entry": entry["id"], "duration": qc["duration"],
            "video": entry["video"], "scenes": len(paths), "blocks": rep.get("blocks")}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA v3 rebuild + soul voice")
    ap.add_argument("entry_id")
    ap.add_argument("--audio", required=True)
    a = ap.parse_args()
    r = redub(a.entry_id, Path(a.audio))
    print(json.dumps(r, ensure_ascii=False, indent=1))
    sys.exit(0 if r["ok"] else 1)


if __name__ == "__main__":
    main()
