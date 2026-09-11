"""وحدة الجمر — هوية دوشة النارية:
استخلاص الشعار الشفاف من الأصل الأسود + لوجو «دوشة» بخط لهب ذهبي +
جمر متطاير حي (فيديو شفاف يُدمج فوق كل حلقة) + شبح الشعار في الخلفيات.
"""
import math
import os
import random
import shutil
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

from . import settings
from .scenes import AMBER, RED, WHITE, _font, _text, _wrap

BRAND_DIR = settings.ROOT / "assets" / "brand"
RAW_EMBLEM = BRAND_DIR / "ember_skull_raw.png"

_extract_cache: dict = {}


def extract(size: int, glow: int = 14, boost: float = 1.06) -> Image.Image:
    """يستخلص الشعار الناري شفافًا من خلفيته السوداء (ألفا من الإضاءة)."""
    key = ("ex", size, glow, boost)
    if key in _extract_cache:
        return _extract_cache[key]
    if RAW_EMBLEM.exists():
        src = Image.open(RAW_EMBLEM).convert("RGB")
    else:  # احتياط: دائرة لهب
        src = Image.new("RGB", (512, 512), (0, 0, 0))
        ImageDraw.Draw(src).ellipse([120, 120, 392, 392], fill=(255, 140, 40))
    src = src.resize((min(size * 2, 1600),) * 2, Image.LANCZOS)
    arr = np.array(src).astype(np.float32)
    lum = arr.max(axis=2)
    # ألفا = الإضاءة (النار ساطعة على أسود → استخلاص نظيف)
    alpha = np.clip(lum * 1.9 - 8, 0, 255)
    # تعزيز حرارة الألوان
    out = arr.copy()
    out[..., 0] = np.clip(arr[..., 0] * boost + 18, 0, 255)
    out[..., 1] = np.clip(arr[..., 1] * (boost * 0.96), 0, 255)
    out[..., 2] = np.clip(arr[..., 2] * (boost * 0.8), 0, 255)
    rgba = np.dstack([out, alpha]).astype(np.uint8)
    emb = Image.fromarray(rgba, "RGBA").resize((size, size), Image.LANCZOS)
    if glow:
        halo = Image.new("RGBA", emb.size, (0, 0, 0, 0))
        halo.paste(Image.new("RGBA", emb.size, (255, 110, 30, 255)), (0, 0), emb.split()[3])
        halo = halo.filter(ImageFilter.GaussianBlur(glow))
        emb = Image.alpha_composite(halo, emb)
    _extract_cache[key] = emb
    return emb


def _flame_text(img: Image.Image, center, text: str, size: int):
    """نص «دوشة» بروح اللهب: هالتان ناريتان + حد داكن + جسم ذهبي."""
    f = _font(size, True)
    x, y = center
    img = img.convert("RGBA") if img.mode != "RGBA" else img
    layers = [
        ((255, 60, 10), size // 8, 95),
        ((255, 150, 30), size // 14, 150),
        ((60, 8, 2), 5, 255),
        ((255, 224, 140), 0, 255),
    ]
    for color, blur, alpha in layers:
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        try:
            ld.text((x, y), text, font=f, fill=color + (alpha,), anchor="mm",
                    direction="rtl", language="ar")
        except Exception:
            ld.text((x, y), text, font=f, fill=color + (alpha,), anchor="mm")
        if blur:
            layer = layer.filter(ImageFilter.GaussianBlur(blur))
        img.paste(Image.alpha_composite(img, layer).getchannel if False else (0), (0, 0)) if False else None
        merged = Image.alpha_composite(img, layer)
        img.paste(merged)


def logo(size: int = 1024, with_text: bool = True) -> Image.Image:
    """اللوجو الرسمي: الشعار الناري + «دوشة» + التوقيع اللاتيني."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    em = extract(int(size * 0.80), glow=int(size * 0.02))
    img.paste(em, (int(size * 0.10), int(size * 0.16)), em)
    d = ImageDraw.Draw(img)
    if with_text:
        _flame_text(img, (size // 2, int(size * 0.115)), "دوشة", int(size * 0.15))
        _text(d, (size // 2, int(size * 0.895)), "XDAW  |  DAWSHA NOVA",
              int(size * 0.045), fill=(255, 228, 170), bold=True)
        d.line([(size * 0.22, int(size * 0.935)), (size * 0.78, int(size * 0.935))],
               fill=AMBER + (220,), width=max(3, size // 340))
    return img


def save_brand_assets(out_dir: Path | None = None) -> dict:
    """يولّد ويحفظ أصول العلامة النهائية (يُستدعى من factory)."""
    out_dir = out_dir or BRAND_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    assets = {}
    assets["logo"] = logo(1024)
    assets["logo"].save(out_dir / "logo_dawsha.png")
    assets["emblem"] = extract(1024, glow=16)
    assets["emblem"].save(out_dir / "emblem_transparent.png")
    assets["bar"] = _bar_strip(2160)
    assets["bar"].save(out_dir / "bar_transparent.png")
    for p in ("logo_dawsha.png", "emblem_transparent.png", "bar_transparent.png"):
        print(f"[ember] asset → {out_dir / p}")
    return assets


def _bar_strip(w: int = 2160) -> Image.Image:
    """شريط العلامة الشفاف بالشعار الصغير — لتركيب احترافي فوق الفيديو."""
    h = int(w * 0.075)
    strip = Image.new("RGBA", (w, h + 40), (0, 0, 0, 0))
    bw, bh = int(w * 0.52), int(h * 0.72)
    x0, y0 = (w - bw) // 2, 26
    d = ImageDraw.Draw(strip)
    glow = Image.new("RGBA", strip.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh // 2,
                                           fill=(230, 40, 60, 170))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    strip = Image.alpha_composite(strip, glow)
    d = ImageDraw.Draw(strip)
    d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh // 2, fill=(226, 33, 54, 255))
    try:
        d.text((w // 2 + int(w * 0.02), y0 + bh // 2), "XDAW | XDAWNOVA",
               font=_font(int(bh * 0.42), True), fill=(255, 255, 255, 255), anchor="mm")
    except Exception:
        d.text((w // 2, y0 + bh // 2), "XDAW | XDAWNOVA",
               font=_font(int(bh * 0.42), True), fill=(255, 255, 255, 255), anchor="mm")
    em = extract(int(bh * 1.5), glow=5)
    strip.paste(em, (x0 + int(bw * 0.015), y0 + bh // 2 - em.height // 2), em)
    return strip


# ------------------------------------------------------------------
# الجمر الحي — فيديو شرر متطاير (يُدمج screen فوق كل حلقة)
# ------------------------------------------------------------------
def embers_video(out_mp4: str, ffmpeg_bin: str, n_frames: int = 64,
                 w: int = 540, h: int = 960, seed: str = "dawsha") -> str:
    rng = random.Random(seed)
    pts = []
    for _ in range(120):
        depth = rng.random()  # 0 قريب (كبير سريع) → 1 بعيد
        pts.append({
            "x": rng.uniform(0, w), "y": rng.uniform(0, h),
            "r": 1.2 + (1 - depth) * 5.0,
            "vy": 28 + (1 - depth) * 120,
            "vx": rng.uniform(-14, 14),
            "ph": rng.uniform(0, 6.28),
            "flick": rng.uniform(2.5, 7.0),
            "hue": rng.choice([(255, 190, 90), (255, 140, 50), (255, 90, 40), (255, 230, 160)]),
        })
    tmp = tempfile.mkdtemp(prefix="emb")
    for fi in range(n_frames):
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        for p in pts:
            y = (p["y"] - fi * p["vy"] / n_frames) % (h + 60) - 30
            x = (p["x"] + fi * p["vx"] / n_frames + 10 * math.sin(fi / 9 + p["ph"])) % w
            tw = 0.55 + 0.45 * math.sin(2 * math.pi * fi / n_frames * p["flick"] + p["ph"])
            r = p["r"] * (0.7 + 0.3 * tw)
            a = int(70 + 185 * tw)
            d.ellipse([x - r, y - r, x + r, y + r], fill=p["hue"] + (a,))
            if p["r"] > 3.4:  # هالة للجمر القريب
                g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
                ImageDraw.Draw(g).ellipse([x - r * 3, y - r * 3, x + r * 3, y + r * 3],
                                          fill=p["hue"] + (int(34 * tw),))
                img = Image.alpha_composite(g.filter(ImageFilter.GaussianBlur(9)), img)
                d = ImageDraw.Draw(img)
        img.filter(ImageFilter.GaussianBlur(0.6)).save(os.path.join(tmp, f"f{fi:03d}.png"))
    subprocess_run = __import__("subprocess").run
    subprocess_run([ffmpeg_bin, "-y", "-framerate", "24", "-i", os.path.join(tmp, "f%03d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", out_mp4],
                   capture_output=True, check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    return out_mp4


def ghost(img: Image.Image, center: tuple, size: int, alpha: int = 38) -> Image.Image:
    """شبح الشعار العميق — يُحبر في الخلفيات كحضور روحي خافت."""
    em = extract(size, glow=30)
    a = em.split()[3].point(lambda v: int(v * alpha / 255))
    em.putalpha(a)
    x, y = int(center[0] - size / 2), int(center[1] - size / 2)
    img.paste(em, (x, y), em)
    return img
