#!/usr/bin/env python3
"""المرحلة 4 — المشاهد بهوية NOVA: توليد برمجي كامل (بلا حدود يومية، يعمل أوفلاين).

كل مشهد 1080×1920: خلفية void + توهج أحمر + دوائر نيون + شعار + نص عربي/إنجليزي.
"""
import argparse
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from . import FACTORY_ROOT, load_config

CFG = load_config("factory")
BRAND = load_config("brand")
W, H = CFG["video"]["width"], CFG["video"]["height"]

C = BRAND["colors"]
VOID = (5, 5, 5)
CARBON = (13, 13, 18)
RED = (255, 30, 30)
CRIMSON = (179, 0, 0)
GOLD = (232, 179, 75)
WHITE = (245, 242, 234)

FONTS_DIR = FACTORY_ROOT / "brand" / "fonts"
FONT_URLS = {
    # خط عربي+لاتيني — روابط مباشرة من Google Fonts الرسمي
    "Cairo-Bold.ttf": [
        "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf",
    ],
    "Montserrat-Black.ttf": [
        "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf",
    ],
}


def ensure_fonts() -> dict:
    """يحمّل الخطوط مرة واحدة إلى brand/fonts/."""
    import requests
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, urls in FONT_URLS.items():
        p = FONTS_DIR / name
        if not p.exists() or p.stat().st_size < 10_000:
            ok = False
            for u in urls:
                try:
                    r = requests.get(u, timeout=60)
                    if r.status_code == 200 and len(r.content) > 10_000:
                        p.write_bytes(r.content)
                        ok = True
                        break
                except Exception:
                    continue
            if not ok:
                print(f"FONT_WARN: cannot download {name} — fallback to DejaVu")
        out[name] = p if p.exists() else None
    return out


def font(size: int, latin_only=False):
    fb = FONTS_DIR / "Cairo-Bold.ttf"
    fm = FONTS_DIR / "Montserrat-Black.ttf"
    cand = [fm, fb] if latin_only else [fb]
    for c in cand:
        if c.exists():
            try:
                return ImageFont.truetype(str(c), size)
            except Exception:
                continue
    for dj in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if Path(dj).exists():
            return ImageFont.truetype(dj, size)
    return ImageFont.load_default()


def shape_ar(text: str) -> str:
    """تشكيل النص العربي للرسم الصحيح (RTL)."""
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except ImportError:
        return text


def is_arabic(text: str) -> bool:
    return any("\u0600" <= ch <= "\u06FF" for ch in text)


def _gradient_bg():
    img = Image.new("RGB", (W, H), VOID)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(VOID[0] + (CARBON[0] - VOID[0]) * t)
        g = int(VOID[1] + (CARBON[1] - VOID[1]) * t)
        b = int(VOID[2] + (CARBON[2] - VOID[2]) * t + 12 * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    return img


def _glow(img, cx, cy, radius, color, alpha=90):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(radius, 0, -8):
        a = int(alpha * (1 - i / radius) ** 1.5)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=color + (a,))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def _circuits(img, rng):
    d = ImageDraw.Draw(img.convert("RGBA"))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(14):
        x, y = rng.randint(0, W), rng.randint(0, H)
        for _ in range(rng.randint(2, 5)):
            nx = x + rng.choice([-1, 1]) * rng.randint(60, 260) if rng.random() < 0.5 else x
            ny = y + rng.choice([-1, 1]) * rng.randint(60, 260) if nx == x else y
            nx, ny = max(0, min(W, nx)), max(0, min(H, ny))
            d.line([(x, y), (nx, ny)], fill=CRIMSON + (28,), width=2)
            x, y = nx, ny
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=RED + (60,))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def _rings(img, cx, cy, rng):
    d = ImageDraw.Draw(img)
    base_r = 300
    for k, (rr, wdt, col, al) in enumerate([
        (base_r, 6, RED, 200), (base_r + 26, 2, RED, 120),
        (base_r - 60, 2, GOLD, 90),
    ]):
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)
        dl.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col + (al,), width=wdt)
        # شرارات مدارية
        for _ in range(rng.randint(4, 8)):
            import math
            a = rng.random() * 2 * math.pi
            px, py = cx + int(rr * math.cos(a)), cy + int(rr * math.sin(a))
            dl.ellipse([px - 5, py - 5, px + 5, py + 5], fill=WHITE + (180,))
        img = Image.alpha_composite(img.convert("RGBA"), layer)
    # نواة متوهجة
    core = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(core)
    dc.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=RED + (220,))
    dc.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=WHITE + (235,))
    img = Image.alpha_composite(img, core)
    # شعار الجمجمة (الأصلي إن وُجد، وإلا البديل المولّد)
    skull = _skull_layer(220, 220)
    if skull:
        img = Image.alpha_composite(img, _paste_center(Image.new("RGBA", (W, H), (0, 0, 0, 0)), skull, cx, cy))
    return img


def _skull_layer(w, h):
    for name in ["xdaw-nova-avatar-skull.png", "placeholder-skull.png"]:
        p = FACTORY_ROOT / "brand" / name
        if p.exists():
            try:
                im = Image.open(p).convert("RGBA").resize((w, h), Image.LANCZOS)
                # قناع دائري لإخفاء حواف الصورة المربعة
                mask = Image.new("L", (w, h), 0)
                ImageDraw.Draw(mask).ellipse([4, 4, w - 4, h - 4], fill=255)
                mask = mask.filter(ImageFilter.GaussianBlur(3))
                im.putalpha(mask)
                # توهج أحمر خلف الشعار
                glow = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
                dg = ImageDraw.Draw(glow)
                dg.ellipse([0, 0, w + 80, h + 80], fill=RED + (70,))
                glow = glow.filter(ImageFilter.GaussianBlur(25))
                canvas = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
                canvas = Image.alpha_composite(canvas, glow)
                canvas.alpha_composite(im, (40, 40))
                return canvas
            except Exception:
                continue
    return None


def _paste_center(canvas, layer, cx, cy):
    canvas.alpha_composite(layer, (cx - layer.width // 2, cy - layer.height // 2))
    return canvas


def _vignette_grain(img, rng):
    img = img.convert("RGB")
    # حبيبات فيلم خفيفة (راحة نفسية سينمائية)
    try:
        from PIL import Image as _I
        noise = _I.effect_noise((W, H), 10).convert("RGB")
        img = _I.blend(img, _I.blend(img, noise, 0.5), 0.05)
    except Exception:
        pass
    # فينيت
    vig = Image.new("L", (W, H), 0)
    dv = ImageDraw.Draw(vig)
    dv.ellipse([-W * 0.25, -H * 0.15, W * 1.25, H * 1.1], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(180))
    black = Image.new("RGB", (W, H), (0, 0, 0))
    # المركز يحتفظ بـ100% من الصورة، الأطراف تُظلم ~45% (فينيت صحيح)
    img = Image.composite(img, black, vig.point(lambda v: 255 - int((255 - v) * 0.45)))
    return img


def _wrap(text: str, fnt, max_w: int):
    words, lines, cur = text.split(), [], ""
    d = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if d.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines[:4]


def _text_block(img, text: str, y_top: int, lang: str, secondary: str | None = None):
    shown = shape_ar(text) if (lang == "ar" and is_arabic(text)) else text
    size = 62
    fnt = font(size)
    lines = _wrap(shown, fnt, W - 140)
    while len(lines) > 3 and size > 40:
        size -= 6
        fnt = font(size)
        lines = _wrap(shown, fnt, W - 140)
    d = ImageDraw.Draw(img)
    lh = int(size * 1.35)
    block_h = lh * len(lines)
    # شريط أحمر فوق النص
    bar_w = min(300, 120 + len(shown) * 2)
    d.rectangle([(W // 2 - bar_w // 2, y_top - 34), (W // 2 + bar_w // 2, y_top - 24)], fill=RED)
    y = y_top
    for ln in lines:
        tw = d.textlength(ln, font=fnt)
        x = (W - tw) // 2
        d.text((x, y), ln, font=fnt, fill=WHITE, stroke_width=3, stroke_fill=(0, 0, 0))
        y += lh
    if secondary:
        f2 = font(36, latin_only=True)
        tw2 = d.textlength(secondary, font=f2)
        d.text(((W - tw2) // 2, y + 12), secondary, font=f2, fill=GOLD,
               stroke_width=2, stroke_fill=(0, 0, 0))
        y += 70
    return y


def _chrome(img, lang: str, scene_idx: int, total: int = 4):
    d = ImageDraw.Draw(img)
    f_small = font(34, latin_only=True)
    brand = "XDAW NOVA"
    tw = d.textlength(brand, font=f_small)
    d.text(((W - tw) // 2, 120), brand, font=f_small, fill=WHITE,
           stroke_width=2, stroke_fill=(0, 0, 0))
    d.ellipse([W // 2 + tw // 2 + 16, 132, W // 2 + tw // 2 + 30, 146], fill=RED)
    # شريط تقدم المشاهد (عرض ديناميكي حسب العدد)
    gap, y0, total_w = 12, H - 220, 880
    seg_w = max(18, (total_w - gap * (total - 1)) // max(1, total))
    x0 = (W - (seg_w * total + gap * (total - 1))) // 2
    for i in range(total):
        x = x0 + i * (seg_w + gap)
        col = RED if i < scene_idx else (60, 60, 66)
        d.rounded_rectangle([(x, y0), (x + seg_w, y0 + 12)], radius=6, fill=col)
    tag = BRAND["identity"]["tagline_ar"] if lang == "ar" else BRAND["identity"]["tagline_en"]
    shown = shape_ar(tag) if lang == "ar" else tag
    f_tag = font(30)
    tw2 = d.textlength(shown, font=f_tag)
    d.text(((W - tw2) // 2, H - 180), shown, font=f_tag, fill=GOLD,
           stroke_width=2, stroke_fill=(0, 0, 0))


def draw_scene(overlay: str, lang: str, scene_idx: int, seed: int = 0,
                 secondary: str | None = None, context: str = "", total: int = 4) -> Image.Image:
    try:
        from .scene_art import paint_scene
        img = paint_scene(context or overlay, seed).convert("RGB")
        img = _vignette_grain(img, random.Random(seed))
    except Exception as e:
        print(f"ART_FALLBACK: {e}")
        rng = random.Random(seed)
        img = _gradient_bg()
        img = _glow(img, W // 2, 500, 380, RED, 70)
        img = _circuits(img, rng)
        img = _rings(img, W // 2, 640, rng)
        img = _vignette_grain(img, rng)
    _text_block(img, overlay, 990, lang, secondary)
    _chrome(img, lang, scene_idx, total)
    return img.convert("RGB")


def draw_title_card(title: str, lang: str, seed: int = 0) -> Image.Image:
    rng = random.Random(seed + 999)
    img = _gradient_bg()
    img = _glow(img, W // 2, 700, 480, RED, 90)
    img = _circuits(img, rng)
    img = _rings(img, W // 2, 560, rng)
    img = _vignette_grain(img, rng)
    _text_block(img, title, 1020, lang)
    _chrome(img, lang, 1)
    return img.convert("RGB")


def build_episode_visuals(topic_id: str, lang: str, overlays: list, out_dir: Path, seed_base: int = 0, contexts: list | None = None) -> list:
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    total = len(overlays)
    for i, ov in enumerate(overlays):
        seed = seed_base + hash(f"{topic_id}:{lang}:{i}") % 100000
        ctx = contexts[i] if contexts and i < len(contexts) else ""
        if isinstance(ov, (list, tuple)):
            img = draw_scene(ov[0], lang, i + 1, seed, ov[1] if len(ov) > 1 else None, ctx, total)
        else:
            img = draw_scene(ov, lang, i + 1, seed, None, ctx, total)
        p = out_dir / f"scene{i+1:02d}_{lang}.png"
        img.save(p)
        paths.append(str(p))
    return paths


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA visuals")
    ap.add_argument("--script-json", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--ensure-fonts", action="store_true")
    a = ap.parse_args()
    if a.ensure_fonts:
        ensure_fonts()
    s = json.loads(Path(a.script_json).read_text(encoding="utf-8"))
    if s["lang"] == "ar":
        overlays = [(sc["overlay_ar"], sc["overlay_en"]) for sc in s["scenes"]]
    else:
        overlays = [(sc["overlay_en"], sc["overlay_ar"]) for sc in s["scenes"]]
    contexts = [sc.get("prompt_en", "") + " " + sc.get("overlay_ar", "") for sc in s["scenes"]]
    seed_base = sum(ord(c) for c in s["topic_id"])
    paths = build_episode_visuals(s["topic_id"], s["lang"], overlays, Path(a.out_dir), seed_base, contexts)
    print("VISUALS_OK:")
    for p in paths:
        print(" ", p)


if __name__ == "__main__":
    main()
