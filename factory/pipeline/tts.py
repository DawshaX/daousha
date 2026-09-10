#!/usr/bin/env python3
"""المرحلة 3 — التعليق الصوتي: edge (مجاني) | elevenlabs | import | test (صامت للاختبارات)."""
import argparse
import math
import shutil
import struct
import sys
import wave
from pathlib import Path
from . import FACTORY_ROOT, load_config

CFG = load_config("factory")
PROD = CFG["production"]

# سرعة الإلقاء (حرف/ثانية) — معايرة من النظام القديم (300 حرف ≈ 40 ثانية)
RATE = {"ar": 7.5, "en": 9.0}


def estimate_duration(text: str, lang: str) -> float:
    return round(len(text) / RATE.get(lang, 8.0) + 1.5, 1)


def synth_test_wav(text: str, lang: str, out: Path) -> Path:
    """ملف صوتي اختباري بنفس المدة المتوقعة (يعمل بلا إنترنت)."""
    import array
    dur = estimate_duration(text, lang)
    sr = 22050
    n = int(sr * dur)
    out.parent.mkdir(parents=True, exist_ok=True)
    buf = array.array("h")
    two_pi = 2 * math.pi
    for i in range(n):
        t = i / sr
        f = 220 + 110 * (0.5 + 0.5 * math.sin(two_pi * 0.4 * t))
        env = 0.25 * (0.6 + 0.4 * math.sin(two_pi * 2.2 * t))
        buf.append(int(32767 * env * math.sin(two_pi * f * t)))
    with wave.open(str(out), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(buf.tobytes())
    return out


def synth_edge(text: str, lang: str, out: Path) -> Path:
    """edge-tts المجاني — يحتاج إنترنت فقط."""
    import asyncio
    import edge_tts
    voice = PROD["voice_ar"] if lang == "ar" else PROD["voice_en"]
    out.parent.mkdir(parents=True, exist_ok=True)
    mp3 = out.with_suffix(".mp3")
    asyncio.run(edge_tts.Communicate(text, voice).save(str(mp3)))
    # تحويل إلى wav عبر ffmpeg الداخلي
    from .ffmpeg_bin import ensure_ffmpeg, run
    ensure_ffmpeg()
    run(["-y", "-i", str(mp3), "-ar", "44100", "-ac", "1", str(out)])
    return out


def synth_import(src: Path, out: Path) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, out)
    return out


def synthesize(text: str, lang: str, out: Path, provider: str = None) -> Path:
    provider = provider or PROD.get("tts_provider", "edge")
    if provider == "test":
        return synth_test_wav(text, lang, out)
    if provider == "import":
        raise ValueError("import provider needs --src file (use synth_import)")
    if provider == "edge":
        return synth_edge(text, lang, out)
    raise ValueError(f"unknown TTS provider: {provider}")


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA TTS")
    ap.add_argument("--text-file", required=True)
    ap.add_argument("--lang", required=True, choices=["ar", "en"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--provider", default=None)
    ap.add_argument("--src", default=None, help="for import provider")
    a = ap.parse_args()
    text = Path(a.text_file).read_text(encoding="utf-8")
    out = Path(a.out)
    if a.provider == "import":
        synth_import(Path(a.src), out)
    else:
        synthesize(text, a.lang, out, a.provider)
    print(f"TTS_OK: {out} ({estimate_duration(text, a.lang)}s est)")


if __name__ == "__main__":
    main()
