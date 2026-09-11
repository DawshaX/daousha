"""مولّد المشاهد — مساران:
1) Pexels (مجاني): فيديوهات stock عمودية حقيقية حسب موضوع الحلقة.
2) مولّد برمجي (يعمل دائمًا بلا مفاتيح): هوية العلامة — كحلي داكن + وهج كهرماني + نص عربي عريض أبيض + شريط أحمر نيون.
"""
import math
import random
import textwrap
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from . import settings

W, H = 1080, 1920
SS = 1.5  # نرسم مكبرًا ثم يصغّر ffmpeg في حركة زوم ناعمة
AMBER = (255, 183, 60)
NAVY_TOP = (7, 13, 31)
NAVY_BOT = (17, 27, 62)
RED = (230, 40, 60)
WHITE = (245, 248, 255)

_font_cache: dict = {}


def _font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    key = (size, bold)
    if key in _font_cache:
        return _font_cache[key]
    cands = [
        settings.FONTS / ("Tajawal-Bold.ttf" if bold else "Tajawal-Regular.ttf"),
        settings.FONTS / "NotoKufiArabic.ttf",
    ]
    f = None
    for c in cands:
        if c.exists():
            try:
                f = ImageFont.truetype(str(c), size)
                if "[" in c.name:  # خط متغير → اختر وزنًا
                    try:
                        f.set_variation_by_name("Bold" if bold else "Regular")
                    except Exception:
                        pass
                break
            except Exception:
                continue
    if f is None:  # آخر حل: أي خط نظام
        import glob
        sys = glob.glob("/usr/share/fonts/**/*-Bold.ttf", recursive=True) or \
              glob.glob("/usr/share/fonts/**/*.ttf", recursive=True)
        f = ImageFont.truetype(sys[0], size) if sys else ImageFont.load_default()
    _font_cache[key] = f
    return f


def _text(draw, xy, text, size, fill=WHITE, bold=True, anchor="mm"):
    """نص عربي/إنجليزي سليم الاتجاه (raqm إن توفر وإلا reshaper)."""
    f = _font(size, bold)
    try:
        draw.text(xy, text, font=f, fill=fill, anchor=anchor, direction="rtl", language="ar")
    except Exception:
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            draw.text(xy, get_display(arabic_reshaper.reshape(text)), font=f, fill=fill, anchor=anchor)
        except Exception:
            draw.text(xy, text, font=f, fill=fill, anchor=anchor)


def bidi_break(text: str) -> str:
    """يكسر العنوان عند نهايات الجمل — يمنع انقلاب الأرقام وعلامات الترقيم في RTL."""
    return text.replace("! ", "!\n").replace("؟ ", "؟\n")


def _wrap(draw, text, size, max_w):
    f = _font(size, True)
    lines = []
    for part in text.split("\n"):
        words, cur = part.split(), ""
        for w in words:
            trial = (cur + " " + w).strip()
            try:
                lw = draw.textlength(trial, font=f, direction="rtl", language="ar")
            except Exception:
                lw = draw.textlength(trial, font=f)
            if lw <= max_w or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
    return lines


def _base_canvas(rnd: random.Random) -> Image.Image:
    w, h = int(W * SS), int(H * SS)
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / h
        px_row = tuple(int(a + (b - a) * t) for a, b in zip(NAVY_TOP, NAVY_BOT))
        for x in range(w):
            px[x, y] = px_row  # متدرج عمودي
    # نجوم خفيفة
    d = ImageDraw.Draw(img)
    for _ in range(220):
        x, y = rnd.randint(0, w - 1), rnd.randint(0, h - 1)
        r = rnd.choice([1, 1, 2])
        c = rnd.randint(120, 220)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(c, c, min(255, c + 15)))
    # وهج كهرماني
    glow = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(glow)
    for _ in range(3):
        cx, cy = rnd.randint(int(w * .1), int(w * .9)), rnd.randint(int(h * .15), int(h * .8))
        R = rnd.randint(int(w * .25), int(w * .5))
        gd.ellipse([cx - R, cy - R, cx + R, cy + R], fill=rnd.randint(60, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(w // 14))
    amber_layer = Image.new("RGB", (w, h), AMBER)
    img = Image.composite(amber_layer, img, glow.point(lambda v: v // 3))
    # تظليل حواف
    vig = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-int(w * .3), -int(h * .15), int(w * 1.3), int(h * 1.15)], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(w // 9))
    black = Image.new("RGB", (w, h), (0, 0, 0))
    img = Image.composite(img, black, vig)
    return img


def _brand_bar_img() -> Image.Image:
    """شريط العلامة كطبقة شفافة مستقلة (يُركَّب فوق الفيديو كله — لا يتأثر بالزوم)."""
    w = 1080
    bh = 92
    bw = 620
    img = Image.new("RGBA", (w, bh + 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x0, y0 = (w - bw) // 2, 20
    glow = Image.new("RGBA", (w, bh + 60), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh // 2, fill=RED + (160,))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    img = Image.alpha_composite(img, glow)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh // 2, fill=RED + (255,))
    _text(d, (w // 2, y0 + bh // 2 - 4), settings.BRAND["line"], 44, fill=(255, 255, 255), bold=True)
    return img


def render_brand_bar(out_path: Path) -> Path:
    """شريط العلامة + القناع الرسمي صغير جوه الشريط الأحمر."""
    from . import ember
    bar = _brand_bar_img()
    m = ember.extract(64, glow=5)
    bar.paste(m, (222, 32), m)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    bar.save(out_path, "PNG")
    return out_path


def _fact_chip(d: ImageDraw.ImageDraw, w, h, label: str):
    size = int(h * .021)
    text = label
    f = _font(size, True)
    try:
        tw = d.textlength(text, font=f, direction="rtl", language="ar")
    except Exception:
        tw = d.textlength(text, font=f)
    pad = int(h * .012)
    bw, bh = int(tw + pad * 2), int(size * 1.9)
    x0, y0 = (w - bw) // 2, int(h * .165)
    d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=bh // 2, outline=AMBER, width=max(3, int(h * .003)))
    _text(d, (w // 2, y0 + bh // 2 - int(h * .001)), text, size, fill=AMBER, bold=True)


def render_branded_scene(out_path: Path, kind: str, title: str, chip: str = "", ep: str = "", bg_path=None):
    """يركّب عناصر الهوية فوق خلفية حية (flux) أو الكانفاس الكلاسيكي. kind: hook|fact|outro"""
    if bg_path:
        from pathlib import Path as _P
        img = Image.open(_P(bg_path)).convert("RGBA")
    else:
        rnd = random.Random(f"{out_path.stem}{title}")
        img = _base_canvas(rnd).convert("RGBA")
    w, h = img.size
    d = ImageDraw.Draw(img)
    if kind == "hook":
        from . import ember
        m = ember.extract(int(w * .40), glow=30)
        img.paste(m, (int(w / 2 - m.width / 2), int(h * .075)), m)
        d = ImageDraw.Draw(img)
        size = int(h * .058)
        lines = _wrap(d, bidi_break(title), size, int(w * .78))
        cy = int(h * .43) - (len(lines) - 1) * size // 2
        for ln in lines:
            # ظل + نص
            _text(d, (w // 2 + int(h * .004), cy + int(h * .004)), ln, size, fill=(0, 0, 0), bold=True)
            _text(d, (w // 2, cy), ln, size, fill=WHITE, bold=True)
            cy += int(size * 1.28)
        d.line([(w * .28, cy + int(h * .02)), (w * .72, cy + int(h * .02))], fill=AMBER, width=int(h * .004))
    elif kind == "fact":
        from . import brand
        # أيقونة نيون رمزية تعكس الكلمات المنطوقة — خلف النص كظل فني متوهج
        icon_name = brand.icon_for_text(title)
        icon = brand.get_icon(icon_name).resize((int(w * .74), int(w * .74)), Image.LANCZOS)
        brand.paste_glow(img, icon, (w // 2, int(h * .45)), scale_alpha=0.30)
        d = ImageDraw.Draw(img)
        if chip:
            _fact_chip(d, w, h, chip)
        size = int(h * .049)
        lines = _wrap(d, bidi_break(title), size, int(w * .78))
        cy = int(h * .46) - (len(lines) - 1) * size // 2
        for ln in lines:
            _text(d, (w // 2 + int(h * .003), cy + int(h * .003)), ln, size, fill=(0, 0, 0), bold=True)
            _text(d, (w // 2, cy), ln, size, fill=WHITE, bold=True)
            cy += int(size * 1.3)
    else:  # outro
        from . import brand
        m = brand.neon_extract(int(w * .37), glow=28)
        img.paste(m, (int(w / 2 - m.width / 2), int(h * .085)), m)
        d = ImageDraw.Draw(img)
        d = ImageDraw.Draw(img)
        _text(d, (w // 2, int(h * .43)), "تابع داوسها", int(h * .065), fill=WHITE, bold=True)
        _text(d, (w // 2, int(h * .505)), "Follow Dawsha", int(h * .040), fill=AMBER, bold=True)
        _text(d, (w // 2, int(h * .575)), "معرفة تنفع العالم ✦ مع كل حلقة نور", int(h * .024), fill=(210, 215, 235), bold=False)
        d.line([(w * .2, int(h * .375)), (w * .8, int(h * .375))], fill=RED, width=int(h * .005))
    # رقم الحلقة أسفل
    import re as _re
    n = _re.sub(r"[^0-9]", "", ep or "")
    if n:
        _text(d, (w // 2, int(h * .93)), f"دوشة • الحلقة {n}", int(h * .018), fill=(170, 178, 200), bold=False)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG")
    return out_path


# ---------------- Pexels (اختياري) ----------------
def fetch_pexels(query: str, workdir: Path, count: int = 6) -> list[Path]:
    """يجلب فيديوهات stock عمودية — يعيد قائمة فارغة عند أي فشل (لا يعطل الإنتاج)."""
    if not settings.PEXELS_KEY:
        return []
    workdir = workdir / "pexels"
    workdir.mkdir(parents=True, exist_ok=True)
    marker = workdir / f"{query[:40].strip().replace(' ', '_')}.json"
    try:
        if marker.exists():
            files = [workdir / f for f in json.loads(marker.read_text()) if (workdir / f).exists()]
            if files:
                return files
        r = requests.get("https://api.pexels.com/videos/search",
                         params={"query": query, "orientation": "portrait", "per_page": 10},
                         headers={"Authorization": settings.PEXELS_KEY}, timeout=30)
        r.raise_for_status()
        picked = []
        for v in r.json().get("videos", []):
            best = None
            for f in v.get("video_files", []):
                if f.get("height", 0) >= 1280 and f.get("width", 0) < f.get("height", 1):
                    if best is None or f["height"] < best["height"]:
                        best = f
            if best:
                picked.append(best["link"])
            if len(picked) >= count:
                break
        out = []
        for i, link in enumerate(picked):
            dst = workdir / f"{query[:20].strip().replace(' ', '_')}_{i}.mp4"
            if not dst.exists():
                rr = requests.get(link, timeout=120)
                rr.raise_for_status()
                dst.write_bytes(rr.content)
            out.append(dst)
        marker.write_text(json.dumps([p.name for p in out]))
        return out
    except Exception as e:
        print(f"[pexels] fallback to branded scenes: {e}")
        return []
