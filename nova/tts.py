"""التعليق الصوتي المجاني — edge-tts مع توقيتات دقيقة لكل سطر (للكابتشنز المتزامنة)."""
import asyncio
import json
import re
import subprocess
import wave

from . import settings

try:
    import edge_tts
except ImportError:
    edge_tts = None

from pathlib import Path

FFMPEG = None


def _ffmpeg() -> str:
    global FFMPEG
    if FFMPEG is None:
        import shutil
        FFMPEG = shutil.which("ffmpeg") or __import__("imageio_ffmpeg").get_ffmpeg_exe()
    return FFMPEG


def probe_duration(path: Path) -> float:
    """مدة ملف صوت/فيديو عبر ffmpeg (بدون ffprobe — ليس موجودًا في الحزم الثابتة)."""
    r = subprocess.run([_ffmpeg(), "-i", str(path)], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.?\d*)", r.stderr)
    if not m:
        return 0.0
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def to_wav(src: Path, dst: Path, rate: int = 44100):
    subprocess.run([_ffmpeg(), "-y", "-i", str(src), "-ar", str(rate), "-ac", "2",
                    "-c:a", "pcm_s16le", str(dst)], capture_output=True, check=True)


async def _tts_line(text: str, voice: str, out_mp3: Path) -> list[dict]:
    """يولّد سطرًا واحدًا ويعيد توقيتات الكلمات (بالثواني)."""
    words = []
    from . import settings as _s
    com = edge_tts.Communicate(text, voice, rate=_s.VOICE_RATE, pitch=_s.VOICE_PITCH)
    with open(out_mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "text": chunk["text"],
                    "start": chunk["offset"] / 1e7,
                    "dur": chunk["duration"] / 1e7,
                })
    return words


def synthesize_segments(segs: list[dict], lang: str, workdir: Path) -> dict:
    """يولّد صوتًا لكل سطر ويعيد خطة التوقيت الكاملة.

    النتيجة: {"segments": [{seg, text, wav, t0, t1, words:[..]}], "total_duration": float}
    كل سطر ملف مستقل => الكابتشنز متزامنة 100% بلا أي تحويل.
    """
    if edge_tts is None:
        raise RuntimeError("edge-tts غير مثبت — pip install edge-tts")
    voice = settings.VOICE_EN if lang == "en" else settings.VOICE_AR
    workdir.mkdir(parents=True, exist_ok=True)
    plan = {"lang": lang, "segments": [], "total_duration": 0.0}
    t = 0.0
    GAP = 0.18  # وقفة قصيرة بين السطور
    for i, seg in enumerate(segs):
        mp3 = workdir / f"line{i:02d}.mp3"
        wav = workdir / f"line{i:02d}.wav"
        words = asyncio.run(_tts_line(seg["text"], voice, mp3))
        to_wav(mp3, wav)
        d = probe_duration(wav)
        plan["segments"].append({
            "seg": seg["seg"], "text": seg["text"], "wav": str(wav),
            "t0": round(t, 3), "t1": round(t + d, 3), "words": words,
        })
        t += d + GAP
    plan["total_duration"] = round(t, 3)
    (workdir / "narration_plan.json").write_text(
        json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    return plan
