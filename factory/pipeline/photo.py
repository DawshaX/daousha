#!/usr/bin/env python3
"""مكتبة الصور الحقيقية — خلفيات فوتوغرافية لكل سياق (أوفلاين، بلا حدود)."""
from pathlib import Path

from PIL import Image, ImageEnhance
from . import FACTORY_ROOT, load_config

CFG = load_config("factory")
W, H = CFG["video"]["width"], CFG["video"]["height"]
PHOTO_DIR = FACTORY_ROOT / "assets" / "photos"

# (كلمات السياق) -> ملف الصورة — الترتيب = الأولوية
PHOTO_KEYS = [
    (("قمر", "moon", "lunar"), "photo_moon.jpg"),
    (("أرض", "earth", "كوكب", "planet", "world"), "photo_earth.jpg"),
    (("شمس", "sun", "شمسي", "solar"), "photo_sun.jpg"),
    (("محيط", "بحر", "ocean", "sea", "ماريانا", "خندق"), "photo_ocean.jpg"),
    (("أخطبوط", "octopus", "حبار"), "photo_octopus.jpg"),
    (("مخ", "دماغ", "عقل", "brain", "ذاكرة", "عصبي"), "photo_brain.jpg"),
    (("قلب", "heart", "نبض"), "photo_heart.jpg"),
    (("هرم", "أهرام", "pyramid", "فرا", "مصر"), "photo_pyramids.jpg"),
    (("مكتبة", "كتاب", "كتب", "library", "بغداد", "علما"), "photo_library.jpg"),
    (("مدينة", "2099", "مستقبل", "city", "future"), "photo_city2099.jpg"),
    (("روبوت", "robot", "ذكاء", "آلي"), "photo_robot.jpg"),
    (("نحل", "bee", "عسل"), "photo_bee.jpg"),
    (("حمض", "dna", "جين"), "photo_dna.jpg"),
    (("عاصفة", "برق", "storm", "رعد"), "photo_storm.jpg"),
]


def find_photo(context: str):
    """أول صورة تطابق السياق (أو None فيعود الرسام التجريدي)."""
    ctx = (context or "").lower()
    for keys, fname in PHOTO_KEYS:
        if any(k in ctx for k in keys):
            p = PHOTO_DIR / fname
            if p.exists():
                return p
    return None


_cache: dict = {}


def load_photo(path: Path, seed: int = 0) -> Image.Image:
    """قص مركزي 9:16 + تدرج NOVA السينمائي الداكن."""
    key = (str(path), seed % 7)
    if key in _cache:
        return _cache[key].copy()
    im = Image.open(path).convert("RGB")
    target = W / H
    w, h = im.size
    if w / h > target:
        nw = int(h * target)
        x0 = (w - nw) // 2
        im = im.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(w / target)
        off = (seed % 7) / 6.0
        y0 = int(max(0, h - nh) * off)
        im = im.crop((0, y0, w, y0 + nh))
    im = im.resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Brightness(im).enhance(0.74)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = Image.blend(im, Image.new("RGB", (W, H), (60, 8, 10)), 0.14)
    if len(_cache) < 32:
        _cache[key] = im.copy()
    return im
