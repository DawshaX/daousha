#!/usr/bin/env python3
"""المرحلة 5 — التجميع: 4 مشاهد Ken Burns + ترجمة + علامة + تعليق + موسيقى خلفية."""
import argparse
import json
import shutil
import tempfile
from pathlib import Path
from . import FACTORY_ROOT, load_config
from .ffmpeg_bin import run, probe_duration, ensure_ffmpeg

CFG = load_config("factory")
V = CFG["video"]


def _srt_time(sec: float) -> str:
    h, rem = divmod(max(0, sec), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int((s % 1) * 1000):03}"


def _split_caption(line: str, max_chars: int = 32) -> list:
    """يقسم السطر الطويل إلى شطور قصيرة بحدود الكلمات."""
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
    # اجمع كل شطرين في كتلة ترجمة واحدة (سطرين فوق بعض)
    blocks = []
    for i in range(0, len(chunks), 2):
        blocks.append("\n".join(chunks[i:i+2]))
    return blocks or [line]


def make_srt(body: str, duration: float, out: Path) -> Path:
    lines = [l.strip() for l in body.split("\n") if l.strip()]
    blocks = []
    for ln in lines:
        blocks.extend(_split_caption(ln))
    per = duration / max(1, len(blocks))
    parts = []
    for i, b in enumerate(blocks):
        parts.append(f"{i+1}\n{_srt_time(i*per)} --> {_srt_time((i+1)*per)}\n{b}\n")
    out.write_text("\n".join(parts), encoding="utf-8")
    return out


def _zoom_filter(mode: str, seg: float) -> str:
    total = int(seg * V["fps"])
    if mode == "zin":
        return (f"scale=2160:3840,zoompan=z='min(1.0+0.0012*on,1.18)':x='iw/2-(iw/zoom/2)'"
                f":y='ih/2-(ih/zoom/2)':d=1:s={V['width']}x{V['height']}:fps={V['fps']}")
    if mode == "zout":
        return (f"scale=2160:3840,zoompan=z='max(1.18-0.0012*on,1.0)':x='iw/2-(iw/zoom/2)'"
                f":y='ih/2-(ih/zoom/2)':d=1:s={V['width']}x{V['height']}:fps={V['fps']}")
    return (f"scale=2160:3840,zoompan=z='1.18':x='(iw-iw/zoom)*on/{total}'"
            f":y='ih/2-(ih/zoom/2)':d=1:s={V['width']}x{V['height']}:fps={V['fps']}")


def build_clip(scene: Path, seg: float, mode: str, out: Path):
    r = run(["-y", "-loop", "1", "-i", str(scene), "-vf", _zoom_filter(mode, seg),
             "-t", f"{seg:.2f}", "-r", str(V["fps"]), "-pix_fmt", "yuv420p",
             "-c:v", "libx264", "-preset", CFG["video"]["preset"], "-crf", str(V["crf"]),
             str(out)])
    if r.returncode != 0:
        raise RuntimeError(f"clip failed {scene.name}: {r.stderr[-400:]}")


def xfade_concat(clips: list, seg: float, out: Path):
    fade = 0.5
    inp = []
    for c in clips:
        inp += ["-i", str(c)]
    offs = [f"{seg - fade:.2f}", f"{2*seg - 2*fade:.2f}", f"{3*seg - 3*fade:.2f}"]
    fc = (f"[0:v][1:v]xfade=transition=fade:duration={fade}:offset={offs[0]}[v01];"
          f"[v01][2:v]xfade=transition=fade:duration={fade}:offset={offs[1]}[v02];"
          f"[v02][3:v]xfade=transition=fade:duration={fade}:offset={offs[2]},format=yuv420p[vout]")
    r = run(["-y", *inp, "-filter_complex", fc, "-map", "[vout]", "-r", str(V["fps"]),
             "-c:v", "libx264", "-preset", CFG["video"]["preset"], "-crf", str(V["crf"]), str(out)])
    if r.returncode != 0:
        raise RuntimeError(f"xfade failed: {r.stderr[-400:]}")


def _skull_watermark() -> Path | None:
    for name in ["xdaw-nova-avatar-skull.png", "placeholder-skull.png"]:
        p = FACTORY_ROOT / "brand" / name
        if p.exists():
            return p
    return None




def _ass_time(sec: float) -> str:
    h, rem = divmod(max(0, sec), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02}:{int(s):02}.{int((s % 1) * 100):02}"


def _write_ass_from_srt(srt: Path, ass: Path):
    """يحوّل SRT إلى ASS بخط أبيض متوسط أسفل الشاشة (فوق شريط التقدم)."""
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
        s = int(m.group(1))*3600 + int(m.group(2))*60 + int(m.group(3)) + int(m.group(4))/1000
        e = int(m.group(5))*3600 + int(m.group(6))*60 + int(m.group(7)) + int(m.group(8))/1000
        body = m.group(9).strip().replace("\n", "\\N")
        events.append(f"Dialogue: 0,{_ass_time(s)},{_ass_time(e)},Nova,,0,0,0,,{body}")
    ass.write_text(header + "\n".join(events), encoding="utf-8")


def finalize(video_noaudio: Path, narration: Path, srt: Path, duration: float, out: Path):
    """علامة + موسيقى خلفية مولّدة + دمج الصوت (الترجمة تُحرق إن أمكن)."""
    skull = _skull_watermark()
    tmp = video_noaudio.parent / "branded.mp4"
    # 1) علامة الجمجمة أعلى اليمين
    if skull:
        r = run(["-y", "-i", str(video_noaudio), "-i", str(skull),
                 "-filter_complex",
                 "[1:v]scale=110:110,format=rgba,colorchannelmixer=aa=0.85[wm];"
                 "[0:v][wm]overlay=W-130:130:format=yuv420[v]",
                 "-map", "[v]", "-c:v", "libx264", "-preset", CFG["video"]["preset"],
                 "-crf", str(V["crf"]), str(tmp)])
        if r.returncode != 0:
            shutil.copy(video_noaudio, tmp)
    else:
        shutil.copy(video_noaudio, tmp)
    # 2) حرق الترجمة عبر ASS (تحكم كامل: حجم + موضع + التفاف)
    subbed = video_noaudio.parent / "subbed.mp4"
    ass = video_noaudio.parent / "burn.ass"
    _write_ass_from_srt(srt, ass)
    ass_esc = str(ass).replace(":", "\\:").replace("'", "")
    r = run(["-y", "-i", str(tmp), "-vf", f"ass='{ass_esc}'",
             "-c:v", "libx264", "-preset", CFG["video"]["preset"], "-crf", str(V["crf"]),
             "-c:a", "copy", str(subbed)])
    base = subbed if (r.returncode == 0 and subbed.exists()) else tmp
    # 3) موسيقى خلفية مولّدة (drone هادئ) + مزج مع التعليق
    fade_start = max(0, duration - 1.5)
    fc = (f"sine=frequency=55:duration={duration:.1f}[dr];"
          f"[dr]volume=0.06,lowpass=f=220[bed];"
          f"[1:a]afade=t=out:st={fade_start:.1f}:d=1.5[narr];"
          f"[bed][narr]amix=inputs=2:duration=first:dropout_transition=0[a]")
    # ملاحظة: sine مصدر يحتاج lavfi — نمرره كمدخل إضافي
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
    assert len(scenes) >= 4, f"need 4 scenes, found {len(scenes)}"
    narration = work_dir / f"narration_{lang}.wav"
    if not narration.exists():
        narration = work_dir / f"narration_{lang}.mp3"
    assert narration.exists(), "narration missing"

    duration = probe_duration(str(narration))
    seg = duration / 4
    tmpd = Path(tempfile.mkdtemp(prefix="xdaw_asm_"))
    try:
        clips = []
        for i, (sc, mode) in enumerate(zip(scenes[:4], ["zin", "zout", "pan", "zin"])):
            cp = tmpd / f"c{i}.mp4"
            build_clip(sc, seg, mode, cp)
            clips.append(cp)
        silent = tmpd / "silent.mp4"
        xfade_concat(clips, seg, silent)
        srt = work_dir / f"captions_{lang}.srt"
        make_srt(script["body"], duration, srt)
        out.parent.mkdir(parents=True, exist_ok=True)
        finalize(silent, narration, srt, duration, out)
    finally:
        shutil.rmtree(tmpd, ignore_errors=True)
    return {"video": str(out), "srt": str(work_dir / f"captions_{lang}.srt"),
            "duration": probe_duration(str(out)), "lang": lang,
            "topic_id": script["topic_id"]}


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA assemble")
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(json.dumps(assemble(Path(a.work_dir), Path(a.out)), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
