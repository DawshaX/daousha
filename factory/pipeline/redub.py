#!/usr/bin/env python3
"""إعادة الدبلجة: يستبدل الصوت الاختباري بصوت روح دوشة الحقيقي ويعيد بناء الفيديو.

مثال: python3 -m pipeline.redub s01-ar --audio narration_real.mp3
"""
import argparse
import shutil
import sys
from pathlib import Path
from . import FACTORY_ROOT, load_config
from .ffmpeg_bin import run
from .assemble import assemble
from .qc import check
from .vault import add as vault_add

CFG = load_config("factory")


def redub(entry_id: str, audio: Path) -> dict:
    work = FACTORY_ROOT / CFG["paths"]["output_dir"] / entry_id
    if not (work / "script.json").exists():
        return {"ok": False, "error": f"NO_WORKDIR:{entry_id}"}
    audio = Path(audio)
    if not audio.exists():
        return {"ok": False, "error": f"NO_AUDIO:{audio}"}
    # تحويل الصوت الجديد إلى wav موحد
    narr = work / "narration_ar.wav"
    if audio.suffix.lower() != ".wav":
        r = run(["-y", "-i", str(audio), "-ar", "44100", "-ac", "1", str(narr)])
        if r.returncode != 0:
            return {"ok": False, "error": f"CONVERT_FAIL:{r.stderr[-200:]}"}
    else:
        shutil.copy(audio, narr)
    # إعادة بناء الفيديو بالصوت الحقيقي (المدة تُقاس من الصوت الجديد)
    old_final = work / "final_ar.mp4"
    if old_final.exists():
        old_final.unlink()
    try:
        rep = assemble(work, old_final)
    except Exception as e:
        return {"ok": False, "error": f"ASSEMBLE:{type(e).__name__}:{e}"[:300]}
    qc = check(Path(rep["video"]), Path(rep["srt"]), branded=True)
    if not qc["pass"]:
        return {"ok": False, "error": f"QC:{qc['errors']}"}
    entry = vault_add(Path(rep["video"]), Path(rep["srt"]), work / "script.json", branded=True)
    return {"ok": True, "entry": entry["id"], "duration": qc["duration"], "video": entry["video"]}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA redub with soul voice")
    ap.add_argument("entry_id")
    ap.add_argument("--audio", required=True)
    a = ap.parse_args()
    import json
    r = redub(a.entry_id, Path(a.audio))
    print(json.dumps(r, ensure_ascii=False, indent=1))
    sys.exit(0 if r["ok"] else 1)


if __name__ == "__main__":
    main()
