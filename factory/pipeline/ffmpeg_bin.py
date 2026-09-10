"""حلّال ffmpeg: متغير بيئة → نظام → imageio-ffmpeg (static)."""
import os
import shutil
import subprocess

_CACHED = None


def ensure_ffmpeg() -> str:
    global _CACHED
    if _CACHED:
        return _CACHED
    env = os.environ.get("FFMPEG_BIN")
    if env and Path(env).exists():
        _CACHED = env
        return _CACHED
    which = shutil.which("ffmpeg")
    if which:
        _CACHED = which
        return _CACHED
    try:
        import imageio_ffmpeg
        _CACHED = imageio_ffmpeg.get_ffmpeg_exe()
        return _CACHED
    except ImportError:
        raise RuntimeError("No ffmpeg found. pip install imageio-ffmpeg")


def run(args: list, timeout: int = 900) -> subprocess.CompletedProcess:
    ff = ensure_ffmpeg()
    return subprocess.run([ff, *args], capture_output=True, text=True, timeout=timeout)


def probe_duration(path: str) -> float:
    ff = ensure_ffmpeg()
    # imageio-ffmpeg لا يأتي مع ffprobe — نستخدم ffmpeg -i ونلتقط Duration
    r = subprocess.run([ff, "-i", path], capture_output=True, text=True, timeout=60)
    import re
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    if not m:
        raise RuntimeError(f"cannot probe duration: {path}")
    h, mnt, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return round(h * 3600 + mnt * 60 + s, 2)


from pathlib import Path  # noqa: E402
