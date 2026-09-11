"""المونتاج السينمائي 2099 — ffmpeg فقط:
خلفيات حية (تنفّس + ميلان) × جزيئات متوهجة (screen) × كينيتيك كابشنز ×
انتقالات: مسح ضوئي + فلاش أبيض درامي عند الدخول والخاتمة × صوت: دوشة + موسيقى 2099 + whoosh عند القطعات.
"""
import subprocess
from pathlib import Path

from . import settings
from .tts import _ffmpeg, probe_duration

FADE = 0.42
FLASH_FADE = 0.22
OUTRO_HOLD = 3.0
LINE_GAP = 0.18


def _run(cmd: list, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg: " + r.stderr[-700:])
    return r


_FFMPEG_BIN = None


def _ffmpeg_cmd() -> list:
    global _FFMPEG_BIN
    if _FFMPEG_BIN is None:
        import shutil
        _FFMPEG_BIN = shutil.which("ffmpeg") or __import__("imageio_ffmpeg").get_ffmpeg_exe()
    return [_FFMPEG_BIN]


def _group_durations(plan: dict, groups: list[dict]) -> list[dict]:
    segs = plan["segments"]
    out = []
    for g in groups:
        idxs = g["segs"]
        t0 = segs[idxs[0]]["t0"]
        t1 = segs[idxs[-1]]["t1"]
        hold = OUTRO_HOLD if segs[idxs[-1]]["seg"] == "outro" else 0.6
        out.append({**g, "dur": round(t1 - t0 + hold, 3)})
    return out


def _build_clip(src: Path, dur: float, out: Path, mode_i: int):
    """مقطع خلفية حي: تنفّس (زوم جيبي) + ميلان بطيء + درج عمق."""
    breath = ["sin(on/34)", "cos(on/29)", "sin(on/26+1.2)"][mode_i % 3]
    sway = [0.016, -0.012, 0.02][mode_i % 3]
    z_expr = f"1.06+0.045*{breath}"
    rot = f"{sway}*sin(t*1.13)"  # rotate يفهم t وليس on
    vf = (f"zoompan=z='{z_expr}':x='iw/2-(iw/zoom/2)+30*sin(on/40)':"
          f"y='ih/2-(ih/zoom/2)+18*cos(on/33)':d=1:s=1080x1920:fps=30,"
          f"rotate='{rot}':ow=1080:oh=1920:c=0x02030c,"
          f"eq=saturation=1.14:contrast=1.06")
    cmd = _ffmpeg_cmd() + ["-loop", "1", "-i", str(src), "-vf", vf,
                           "-t", f"{dur:.3f}", "-r", "30",
                           "-pix_fmt", "yuv420p", "-c:v", "libx264",
                           "-preset", "veryfast", "-crf", "19", str(out)]
    _run(cmd)


def _whoosh_wav(workdir: Path, dur: float = 0.6) -> Path:
    """نفثة هواء سينمائية (ضجيج مفلتر يرتفع ثم يهبط) — ملكية حرة."""
    import math
    import struct
    import wave as wavemod
    sr = 22050
    n = int(dur * sr)
    rng = __import__("random").Random(2099)
    samples = []
    prev = 0.0
    for i in range(n):
        t = i / n
        # ضجيج بني مبسط
        white = rng.uniform(-1, 1)
        prev = (prev + 0.035 * white) / 1.035
        env = math.sin(math.pi * t) ** 2
        samples.append(prev * 6.0 * env)
    with open(workdir / "whoosh.wav", "wb") as f:
        w = wavemod.Wave_write(f)
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 20000)) for s in samples))
        w.close()
    return workdir / "whoosh.wav"


def assemble(plan: dict, groups: list, captions: list, out_path: Path, workdir: Path,
             cover_png: Path | None = None) -> Path:
    """يبني الفيديو السينمائي الكامل — بطاقة الغلاف أول فريم + كل الهوية."""
    from . import brand, flux
    workdir.mkdir(parents=True, exist_ok=True)
    gdur = _group_durations(plan, groups)

    # 0) بطاقة الغلاف الافتتاحية — أول فريم في الفيديو وزر المشاركة
    cover_dur = 1.7
    cover_shift = 0.0
    lead_clips, lead_durs = [], []
    if cover_png and Path(cover_png).exists():
        cover_shift = round(cover_dur - FADE, 3)
        cc = workdir / "clip_cover.mp4"
        _build_clip(Path(cover_png), cover_dur, cc, 1)
        lead_clips = [cc]
        lead_durs = [probe_duration(cc)]

    # 1) مقاطع الخلفية المتحركة (المشاهد المركبة من build_scenes: flux + هوية)
    clips = []
    for i, g in enumerate(gdur):
        c = workdir / f"clip_{i}.mp4"
        _build_clip(Path(g["scene"]), g["dur"], c, i)
        clips.append(c)
        g["clip_dur"] = probe_duration(c)

    # 2) السلسلة: بطاقة الغلاف (فلاش دخول) ثم المشاهد (فلاش أبيض بين الهوك وأول حقيقة وقبل الخاتمة — دخول درامي)
    all_clips = lead_clips + clips
    all_durs = lead_durs + [g["clip_dur"] for g in gdur]
    n = len(all_clips)
    inputs = []
    for c in all_clips:
        inputs += ["-i", str(c)]
    fc_parts, prev = [], "[0:v]"
    offset = 0.0
    transition_times = []
    for i in range(1, n):
        offset += all_durs[i - 1] - FADE
        transition_times.append(offset)
        if i == 1 and lead_clips:
            tr = f"fadewhite:duration={FLASH_FADE}"     # دخول درامي من الغلاف
        elif gdur[i - len(lead_clips)]["seg"] in ("fact1", "outro"):
            tr = f"fadewhite:duration={FLASH_FADE}"
        else:
            tr = f"smoothleft:duration={FADE}"
        outl = f"[v{i}]" if i < n - 1 else "[vout]"
        fc_parts.append(f"{prev}[{i}:v]xfade=transition={tr}:offset={offset:.3f}{outl}")
        prev = f"[v{i}]"
    silent = workdir / "video_noaudio.mp4"
    _run(_ffmpeg_cmd() + inputs + ["-filter_complex", ";".join(fc_parts),
                                   "-map", "[vout]", "-r", "30", "-c:v", "libx264",
                                   "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
                                   str(silent)])
    video_dur = probe_duration(silent)

    # 4) طبقة الجزيئات (screen) — حياة دائمة فوق كل شيء
    ptc = workdir / "particles.mp4"
    from . import ember as _ember
    _ember.embers_video(str(ptc), _ffmpeg_cmd()[0], seed="dawsha2099")
    _run(_ffmpeg_cmd() + ["-i", str(silent), "-stream_loop", "-1", "-i", str(ptc),
                          "-filter_complex",
                          "[1:v]scale=1080:1920,format=rgba,colorchannelmixer=aa=0.5[pf];"
                          "[0:v][pf]overlay=0:0:shortest=1,format=yuv420p",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                          str(workdir / "video_particles.mp4")])
    silent = workdir / "video_particles.mp4"

    # 5) الطبقات: شريط العلامة + العلامة المائية + الكينيتيك كابشنز
    from .scenes import render_brand_bar
    brand_png = render_brand_bar(workdir / "brand_bar.png")
    wm = brand.neon_extract(180, glow=8)
    wm.putalpha(wm.split()[3].point(lambda a: int(a * 0.72)))
    wm_png = workdir / "watermark.png"
    wm.save(wm_png, "PNG")
    overlays = [{"png": str(brand_png), "t0": 0.0, "t1": video_dur, "y": "56", "x": "(W-w)/2"},
                {"png": str(wm_png), "t0": 0.0, "t1": video_dur, "y": "H-h-42", "x": "W-w-30"}]
    captions = [dict(c, t0=round(c["t0"] + cover_shift, 3), t1=round(c["t1"] + cover_shift, 3))
                for c in captions]
    for cap in captions:
        overlays.append({"png": cap["png"], "t0": cap["t0"], "t1": cap["t1"],
                         "y": "1150" if cap["big"] else "1290", "x": "(W-w)/2"})
    v_inputs = ["-i", str(silent)]
    fc2_parts, prev3 = [], "[0:v]"
    for j, ov in enumerate(overlays, start=1):
        v_inputs += ["-loop", "1", "-t", f"{max(0.3, ov['t1'] - ov['t0'] + 0.2):.2f}", "-i", ov["png"]]
        fade_in = min(0.14, (ov["t1"] - ov["t0"]) / 3)
        fade_out = fade_in
        fc2_parts.append(
            f"[{j}:v]format=rgba,fade=t=in:st=0:d={fade_in:.2f}:alpha=1,"
            f"fade=t=out:st={ov['t1'] - ov['t0'] - fade_out:.2f}:d={fade_out:.2f}:alpha=1,"
            f"setpts=PTS-STARTPTS+{ov['t0']:.3f}/TB[k{j}];"
            f"{prev3}[k{j}]overlay={ov['x']}:{ov['y']}:eof_action=pass[o{j}]")
        prev3 = f"[o{j}]"
    fc2_final = ";".join(fc2_parts) if fc2_parts else None
    graded = workdir / "video_graded.mp4"
    cmd = _ffmpeg_cmd() + v_inputs + [
        "-filter_complex", fc2_final, "-map", prev3,
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-r", "30", "-t", f"{video_dur:.3f}", str(graded)]
    _run(cmd)

    # 6) الصوت: دوشة + موسيقى 2099 + whoosh عند كل قطعة
    wavs = [s["wav"] for s in plan["segments"]]
    a_inputs = []
    for wv in wavs:
        a_inputs += ["-i", wv]
    n_wav = len(wavs)
    fc = f"{''.join(f'[{i}:a]' for i in range(n_wav))}concat=n={n_wav}:v=0:a=1[nar];"
    if cover_shift > 0:  # التعليق يبدأ بعد بطاقة الغلاف
        ms = int(cover_shift * 1000)
        fc += f"[nar]adelay={ms}|{ms}[nar];"
    from . import music
    music_wav = workdir / "music.wav"
    music.render_music(video_dur + 0.5, music_wav)
    a_inputs += ["-i", str(music_wav)]
    music_idx = n_wav
    fc += (f"[{music_idx}:a]volume={max(0.0, min(1.0, settings.MUSIC_VOLUME * 3))},"
           f"afade=t=out:st={max(0, video_dur - 2.4):.3f}:d=2.4[mus];")
    # whoosh عند كل انتقال
    whoosh = _whoosh_wav(workdir)
    mix_in = f"[nar]apad,atrim=0:{video_dur:.3f}[nav];[nav][mus]"
    if transition_times:
        for wi, tt in enumerate(transition_times):
            a_inputs += ["-i", str(whoosh)]
            widx = music_idx + 1 + wi
            delay_ms = int(max(0, tt - 0.35) * 1000)
            fc += (f"[{widx}:a]adelay={delay_ms}|{delay_ms},volume=0.55[w{wi}];")
        mix_ins = "".join(f"[w{i}]" for i in range(len(transition_times)))
        fc += f"{mix_in}amix=inputs=2:duration=first:normalize=0[nm];[nm]{mix_ins}amix=inputs={1 + len(transition_times)}:duration=longest:normalize=0[aout]"
    else:
        fc += f"{mix_in}amix=inputs=2:duration=first:normalize=0[aout]"
    mixed = workdir / "audio.m4a"
    _run(_ffmpeg_cmd() + a_inputs + ["-filter_complex", fc, "-map", "[aout]",
                                     "-c:a", "aac", "-b:a", "160k", "-ar", "44100", str(mixed)])

    # 7) الدمج النهائي
    _run(_ffmpeg_cmd() + ["-i", str(graded), "-i", str(mixed),
                          "-map", "0:v", "-map", "1:a",
                          "-c:v", "copy", "-c:a", "copy",
                          "-movflags", "+faststart",
                          "-t", f"{video_dur:.3f}", str(out_path)])
    return out_path
