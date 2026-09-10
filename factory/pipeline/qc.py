#!/usr/bin/env python3
"""المرحلة 6 — بوابات الجودة: المقاس، المدة، الصوت، الترجمة، الحجم. أي فشل = لا نشر."""
import argparse
import json
import re
import subprocess
from pathlib import Path
from . import load_config
from .ffmpeg_bin import ensure_ffmpeg, probe_duration

CFG = load_config("factory")
Q = CFG["qc"]
V = CFG["video"]


def probe_streams(path: str) -> dict:
    ff = ensure_ffmpeg()
    r = subprocess.run([ff, "-i", path], capture_output=True, text=True, timeout=60)
    err = r.stderr
    vm = re.search(r"Video:.*?\b(\d{3,5})x(\d{3,5})\b", err)
    has_audio = "Audio:" in err
    return {"width": int(vm.group(1)) if vm else 0,
            "height": int(vm.group(2)) if vm else 0,
            "has_audio": has_audio, "raw": err[-500:]}


def check(video: Path, srt: Path | None = None, branded: bool = True) -> dict:
    errors, warnings = [], []
    v = Path(video)
    if not v.exists():
        return {"pass": False, "errors": ["FILE_MISSING"], "warnings": []}
    size_kb = v.stat().st_size / 1024
    if size_kb < 100:
        errors.append(f"TOO_SMALL:{size_kb:.0f}KB")
    try:
        dur = probe_duration(str(v))
    except Exception:
        return {"pass": False, "errors": ["UNPROBABLE"], "warnings": []}
    if dur < Q["require_min_seconds"]:
        errors.append(f"TOO_SHORT:{dur}s")
    if dur > Q["require_max_seconds"]:
        errors.append(f"TOO_LONG:{dur}s")
    st = probe_streams(str(v))
    rw, rh = map(int, Q["require_resolution"].split("x"))
    if st["width"] != rw or st["height"] != rh:
        errors.append(f"BAD_RES:{st['width']}x{st['height']}")
    if Q["require_audio"] and not st["has_audio"]:
        errors.append("NO_AUDIO")
    if Q["require_captions"]:
        if not srt or not Path(srt).exists():
            errors.append("NO_CAPTIONS")
    if Q["require_watermark"] and not branded:
        errors.append("NO_WATERMARK")
    if dur < CFG["video"]["target_seconds"] - 12:
        warnings.append(f"SHORTER_THAN_TARGET:{dur}s")
    return {"pass": not errors, "errors": errors, "warnings": warnings,
            "duration": dur, "resolution": f"{st['width']}x{st['height']}",
            "size_kb": round(size_kb, 1)}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA QC")
    ap.add_argument("--video", required=True)
    ap.add_argument("--srt", default=None)
    ap.add_argument("--branded", action="store_true")
    a = ap.parse_args()
    rep = check(Path(a.video), Path(a.srt) if a.srt else None, a.branded)
    print(json.dumps(rep, ensure_ascii=False, indent=1))
    raise SystemExit(0 if rep["pass"] else 1)


if __name__ == "__main__":
    main()
