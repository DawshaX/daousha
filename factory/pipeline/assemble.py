#!/usr/bin/env python3
"""المرحلة 5 — المونتاج الحقيقي v3: مشهد لكل عبارة + نبض + انتقالات + تدرج لوني."""
import argparse
import json
import shutil
import tempfile
from pathlib import Path
from . import FACTORY_ROOT, load_config
from .ffmpeg_bin import run, probe_duration, ensure_ffmpeg

CFG = load_config("factory")
V = CFG["video"]
BRIDGES_PREFIX = ("ركز", "والأغرب", "Stay", "And the strangest")


def _srt_time(sec: float) -> str:
    h, rem = divmod(max(0, sec), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int((s % 1) * 1000):03}"


def _split_caption(line: str, max_chars: int = 32) -> list:
    words, chunks, cur = line.split(), [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if len(trial) <= max_chars:
            cur = trial
        else:
            if cur:
                chunks.append(cur)
            cur = w_
    if cur:
        chunks.append(cur)
    blocks = []
    for i in range(0, len(chunks), 2):
        blocks.append("\n".join(chunks[i:i + 2]))
    return blocks or [line]


def make_blocks(body: str) -> list:
    """يقسم السيناريو إلى كتل مونتاج: [{text, line}] — كل كتلة = مشهد."""
    lines = [l.strip() for l in body.split("\n") if l.strip()]
    blocks = []
    for li, ln in enumerate(lines):
        for b in _split_caption(ln):
            blocks.append({"text": b, "line": li, "n_lines": len(lines)})
    return blocks


def line_role(block: dict, lines: list) -> str:
    li, n = block["line"], block["n_lines"]
    if li == 0:
        return "hook"
    if li == n - 1:
        return "cta"
    if lines[li].startswith(BRIDGES_PREFIX):
        return "bridge"
    return "fact"


def block_timings(blocks: list, duration: float) -> list:
    """توقيت بالوزن (عدد الكلمات) — أعدل من التساوي."""
    weights = [max(2, len(b["text"].split())) for b in blocks]
    total = sum(weights)
    t, out = 0.0, []
    for b, w in zip(blocks, weights):
        d = max(1.2, duration * w / total)
        out.append({**b, "start": t, "end": t + d, "dur": d})
        t += d
    return out


def make_srt(body: str, duration: float, out: Path) -> Path:
    blocks = block_timings(make_blocks(body), duration)
    parts = [f"{i + 1}\n{_srt_time(b['start'])} --> {_srt_time(b['end'])}\n{b['text']}\n"
             for i, b in enumerate(blocks)]
    out.write_text("\n".join(parts), encoding="utf-8")
    return out


PULSE = "(1+0.018*sin(2*PI*on/45))"  # نبضة قلب كل ~1.5 ثانية


def _zoom_filter(mode: str, seg: float, role: str) -> str:
    total = max(1, int(seg * V["fps"]))
    s = f"{V['width']}x{V['height']}"
    if role == "hook":
        z = f"min(1.0+0.0022*on,1.24)*{PULSE}"
        xy = "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    elif role == "bridge":
        z = f"1.10*{PULSE}"
        xy = f"x='(iw-iw/zoom)*on/{total}':y='ih/2-(ih/zoom/2)'"
    elif role == "cta":
        z = f"min(1.05+0.0016*on,1.22)*{PULSE}"
        xy = "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    elif mode == "zout":
        z = f"max(1.18-0.0012*on,1.0)*{PULSE}"
        xy = "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    elif mode == "pan":
        z = f"1.18*{PULSE}"
        xy = f"x='(iw-iw/zoom)*on/{total}':y='ih/2-(ih/zoom/2)'"
    else:
        z = f"min(1.0+0.0012*on,1.18)*{PULSE}"
        xy = "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    return f"scale=2160:3840,zoompan=z='{z}':{xy}:d=1:s={s}:fps={V['fps']}"


def build_clip(scene: Path, seg: float, mode: str, role: str, out: Path):
    r = run(["-y", "-loop", "1", "-i", str(scene), "-vf", _zoom_filter(mode, seg, role),
             "-t", f"{seg:.2f}", "-r", str(V["fps"]), "-pix_fmt", "yuv420p",
             "-c:v", "libx264", "-preset", CFG["video"]["preset"], "-crf", str(V["crf"]),
             str(out)])
    if r.returncode != 0:
        raise RuntimeError(f"clip failed {scene.name}: {r.stderr[-400:]}")


TRANSITIONS = ["fade", "fadeblack", "smoothleft", "smoothright", "smoothup", "smoothdown"]


def montage_concat(clips: list, segs: list, out: Path, fade: float = 0.35):
    """مونتاج N مقاطع بانتقالات متناوبة."""
    assert len(clips) == len(segs) and len(clips) >= 2
    inp = []
    for c in clips:
        inp += ["-i", str(c)]
    parts, prev = [], "[0:v]"
    acc = segs[0]
    for i in range(1, len(clips)):
        acc_next = acc + segs[i]
        off = acc - fade * i
        tr = TRANSITIONS[(i - 1) % len(TRANSITIONS)]
        tag = f"[v{i:02d}]"
        parts.append(f"{prev}[{i}:v]xfade=transition={tr}:duration={fade}:offset={off:.2f}{tag}")
        prev, acc = tag, acc_next
    fc = ";".join(parts) + f";{prev}format=yuv420p[vout]"
    r = run(["-y", *inp, "-filter_complex", fc, "-map", "[vout]", "-r", str(V["fps"]),
             "-c:v", "libx264", "-preset", CFG["video"]["preset"], "-crf", str(V["crf"]), str(out)])
    if r.returncode != 0:
        raise RuntimeError(f"montage failed: {r.stderr[-400:]}")


def _ass_time(sec: float) -> str:
    h, rem = divmod(max(0, sec), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02}:{int(s):02}.{int((s % 1) * 100):02}"


def _write_ass_from_srt(srt: Path, ass: Path):
    import re
    text = Path(srt).read_text(encoding="utf-8")
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Nova,DejaVu Sans,54,&H00FFFFFF,&H000019FF,&H80000000,&H80000000,1,0,0,0,100,100,0,0,1,3,0,2,60,60,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for m in re.finditer(r"(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)\n((?:.+\n?)+?)(?=\n\d+\n|\Z)", text):
        s = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1000
        e = int(m.group(5)) * 3600 + int(m.group(6)) * 60 + int(m.group(7)) + int(m.group(8)) / 1000
        body = m.group(9).strip().replace("\n", "\\N")
        events.append(f"Dialogue: 0,{_ass_time(s)},{_ass_time(e)},Nova,,0,0,0,,{body}")
    ass.write_text(header + "\n".join(events), encoding="utf-8")


def _skull_watermark() -> Path | None:
    for name in ["xdaw-nova-avatar-skull.png", "placeholder-skull.png"]:
        p = FACTORY_ROOT / "brand" / name
        if p.exists():
            return p
    return None


GRADE = "eq=saturation=1.12:contrast=1.03"  # تدرج لوني دافئ مريح


def finalize(video_noaudio: Path, narration: Path, srt: Path, duration: float, out: Path):
    skull = _skull_watermark()
    tmp = video_noaudio.parent / "branded.mp4"
    if skull:
        r = run(["-y", "-i", str(video_noaudio), "-i", str(skull),
                 "-filter_complex",
                 "[1:v]scale=110:110,format=rgba,colorchannelmixer=aa=0.85[wm];"
                 f"[0:v][wm]overlay=W-130:130:format=yuv420,{GRADE}[v]",
                 "-map", "[v]", "-c:v", "libx264", "-preset", CFG["video"]["preset"],
                 "-crf", str(V["crf"]), str(tmp)])
        if r.returncode != 0:
            shutil.copy(video_noaudio, tmp)
    else:
        r = run(["-y", "-i", str(video_noaudio), "-vf", GRADE,
                 "-c:v", "libx264", "-preset", CFG["video"]["preset"],
                 "-crf", str(V["crf"]), str(tmp)])
        if r.returncode != 0:
            shutil.copy(video_noaudio, tmp)
    subbed = video_noaudio.parent / "subbed.mp4"
    ass = video_noaudio.parent / "burn.ass"
    _write_ass_from_srt(srt, ass)
    ass_esc = str(ass).replace(":", "\\:").replace("'", "")
    r = run(["-y", "-i", str(tmp), "-vf", f"ass='{ass_esc}'",
             "-c:v", "libx264", "-preset", CFG["video"]["preset"], "-crf", str(V["crf"]),
             "-c:a", "copy", str(subbed)])
    base = subbed if (r.returncode == 0 and subbed.exists()) else tmp
    fade_start = max(0, duration - 1.5)
    r = run(["-y", "-i", str(base), "-i", str(narration),
             "-f", "lavfi", "-i", f"sine=frequency=55:duration={duration:.1f}",
             "-filter_complex",
             f"[2:a]volume=0.06,lowpass=f=220[bed];"
             f"[1:a]afade=t=out:st={fade_start:.1f}:d=1.5[narr];"
             f"[bed][narr]amix=inputs=2:duration=first:dropout_transition=0[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
             "-b:a", V["audio_bitrate"], "-shortest", "-movflags", "+faststart", str(out)])
    if r.returncode != 0:
        raise RuntimeError(f"finalize failed: {r.stderr[-500:]}")
    return out


def assemble(work_dir: Path, out: Path) -> dict:
    ensure_ffmpeg()
    work_dir = Path(work_dir)
    script = json.loads((work_dir / "script.json").read_text(encoding="utf-8"))
    lang = script["lang"]
    scenes = sorted(work_dir.glob(f"scene*_{lang}.png"))
    assert len(scenes) >= 2, f"need scenes, found {len(scenes)}"
    narration = work_dir / f"narration_{lang}.wav"
    if not narration.exists():
        narration = work_dir / f"narration_{lang}.mp3"
    assert narration.exists(), "narration missing"

    duration = probe_duration(str(narration))
    lines = [l.strip() for l in script["body"].split("\n") if l.strip()]
    blocks = block_timings(make_blocks(script["body"]), duration)

    if len(scenes) == len(blocks):
        segs = [b["dur"] for b in blocks]
        roles = [line_role(b, lines) for b in blocks]
    else:  # توافق مع المشاهد القديمة: تقسيم متساوٍ
        seg = duration / len(scenes)
        segs = [seg] * len(scenes)
        roles = ["fact"] * len(scenes)

    tmpd = Path(tempfile.mkdtemp(prefix="xdaw_asm_"))
    try:
        clips = []
        fact_modes = ["zin", "zout", "pan"]
        fi = 0
        for sc, seg, role in zip(scenes, segs, roles):
            mode = fact_modes[fi % 3] if role == "fact" else "zin"
            if role == "fact":
                fi += 1
            cp = tmpd / f"c{len(clips):02d}.mp4"
            build_clip(sc, seg, mode, role, cp)
            clips.append(cp)
        silent = tmpd / "silent.mp4"
        montage_concat(clips, segs, silent)
        srt = work_dir / f"captions_{lang}.srt"
        make_srt(script["body"], duration, srt)
        out.parent.mkdir(parents=True, exist_ok=True)
        finalize(silent, narration, srt, duration, out)
    finally:
        shutil.rmtree(tmpd, ignore_errors=True)
    return {"video": str(out), "srt": str(work_dir / f"captions_{lang}.srt"),
            "duration": probe_duration(str(out)), "lang": lang,
            "topic_id": script["topic_id"], "blocks": len(blocks),
            "scenes": len(scenes)}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA assemble v3")
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(json.dumps(assemble(Path(a.work_dir), Path(a.out)), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
