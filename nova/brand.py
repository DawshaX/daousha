"""هوية XDAW NOVA — القناع الرسمي + مكتبة أيقونات نيون رمزية + تركيب الأغلفة.
كل مشهد يرسم بالرمز المناسب لكل كلمة يقولها الصوت — «كل كلمة يصفها المقطع».
"""
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

from . import settings
from .scenes import AMBER, RED, WHITE, NAVY_TOP, NAVY_BOT, _font, _text, _wrap

BRAND_DIR = settings.ROOT / "assets" / "brand"
MASK_PATH = BRAND_DIR / "mask.png"

# ------------------------------------------------------------------
# 1) القناع الرسمي
# ------------------------------------------------------------------
_mask_cache: dict = {}


def mask_rgba(size: int, glow: int = 0) -> Image.Image:
    """القناع الرسمي كطبقة شفافة بحجم مربع، مع توهج أحمر اختياري."""
    key = (size, glow)
    if key in _mask_cache:
        return _mask_cache[key]
    if MASK_PATH.exists():
        base = Image.open(MASK_PATH).convert("RGBA")
    else:  # احتياط: دائرة حمراء متوهجة بشعار X
        base = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        d = ImageDraw.Draw(base)
        d.ellipse([56, 56, 456, 456], fill=RED + (255,))
        d.text((256, 256), "X", font=_font(220), fill=WHITE + (255,), anchor="mm")
    base = base.resize((size, size), Image.LANCZOS)
    if glow:
        glow_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        alpha = base.split()[3].point(lambda a: min(255, int(a * 0.9)))
        red_ver = Image.new("RGBA", base.size, RED + (255,))
        glow_layer.paste(red_ver, (0, 0), alpha)
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(glow))
        base = Image.alpha_composite(glow_layer, base)
    _mask_cache[key] = base
    return base


def paste_glow(img: Image.Image, icon: Image.Image, center: tuple, scale_alpha: float = 1.0):
    """يركّب أيقونة شفافة في المنتصف مع احترام الشفافية."""
    if scale_alpha < 1.0:
        icon = icon.copy()
        a = icon.split()[3].point(lambda v: int(v * scale_alpha))
        icon.putalpha(a)
    x, y = int(center[0] - icon.width / 2), int(center[1] - icon.height / 2)
    img.paste(icon, (x, y), icon)


def neon_extract(size: int, glow: int = 18, boost: float = 1.0) -> Image.Image:
    """يستخلص خطوط النيون الحمراء من القناع الرسمي — بلا أي خلفية (شفاف 100%)."""
    import numpy as np
    src = mask_rgba(min(1024, size * 2))
    arr = np.array(src).astype(np.int16)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    # الأحمر المتوهج: R أعلى بكثير من G/B — السواد والرمادي يختفيون تمامًا
    alpha = np.clip((r - np.maximum(g, b)) * 5 - 25, 0, 255).astype(np.uint8)
    out = np.zeros_like(arr, dtype=np.uint8)
    out[..., 0] = np.clip(r * boost + 30, 0, 255).astype(np.uint8)  # تعزيز الأحمر
    out[..., 1] = np.clip(g * 0.6, 0, 255).astype(np.uint8)
    out[..., 2] = np.clip(b * 0.6, 0, 255).astype(np.uint8)
    out[..., 3] = alpha
    neon = Image.fromarray(out, "RGBA").resize((size, size), Image.LANCZOS)
    if glow:
        halo = Image.new("RGBA", neon.size, (0, 0, 0, 0))
        halo.paste(Image.new("RGBA", neon.size, RED + (255,)), (0, 0), neon.split()[3])
        halo = halo.filter(ImageFilter.GaussianBlur(glow))
        neon = Image.alpha_composite(halo, neon)
    return neon


# ------------------------------------------------------------------
# 2) الأيقونات النيونية (متجهات مرسومة برمجيًا — ملكية حرة 100%)
# ------------------------------------------------------------------
ICON_SIZE = 560


def _canvas() -> tuple:
    img = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    glow = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    return img, glow, ImageDraw.Draw(img), ImageDraw.Draw(glow)


def _finish(img, glow, blur=26, boost=1.25):
    glow = glow.filter(ImageFilter.GaussianBlur(blur))
    out = Image.alpha_composite(glow, img)
    if boost != 1.0:
        out = ImageEnhance.Brightness(out).enhance(boost)
    return out


def _stroke(d_glow, d_core, points, color, width):
    d_glow.line(points, fill=color + (210,), width=width * 3, joint="curve")
    d_core.line(points, fill=(255, 235, 210, 255), width=width, joint="curve")


def _ellipse(d_glow, d_core, box, color, width):
    d_glow.ellipse(box, outline=color + (210,), width=width * 3)
    d_core.ellipse(box, outline=(255, 235, 210, 255), width=width)


def _ico_star():
    img, glow, dc, dg = _canvas()
    pts = []
    import math
    for i in range(10):
        r = 230 if i % 2 == 0 else 95
        a = math.pi * i / 5 - math.pi / 2
        pts.append((280 + r * math.cos(a), 280 + r * math.sin(a)))
    _stroke(dg, dc, pts + [pts[0]], AMBER, 10)
    return _finish(img, glow)


def _ico_heart():
    img, glow, dc, dg = _canvas()
    dg.ellipse([70, 120, 290, 340], fill=RED + (200,))
    dg.ellipse([270, 120, 490, 340], fill=RED + (200,))
    dg.polygon([(90, 280), (280, 500), (470, 280)], fill=RED + (200,))
    dc.ellipse([70, 120, 290, 340], outline=(255, 200, 200, 255), width=8)
    dc.ellipse([270, 120, 490, 340], outline=(255, 200, 200, 255), width=8)
    dc.line([(90, 285), (280, 495), (470, 285)], fill=(255, 200, 200, 255), width=8)
    return _finish(img, glow)


def _ico_eye():
    img, glow, dc, dg = _canvas()
    dg.polygon([(40, 280), (280, 130), (520, 280), (280, 430)], outline=AMBER + (220,), width=16)
    _ellipse(dg, dc, [180, 180, 380, 380], AMBER, 10)
    dg.ellipse([245, 245, 315, 315], fill=RED + (255,))
    return _finish(img, glow)


def _ico_bulb():
    img, glow, dc, dg = _canvas()
    _ellipse(dg, dc, [150, 90, 410, 350], AMBER, 10)
    dg.line([(230, 350), (230, 420), (330, 420), (330, 350)], fill=AMBER + (220,), width=12)
    dc.line([(230, 350), (230, 420), (330, 420), (330, 350)], fill=(255, 235, 210, 255), width=6)
    dc.line([(240, 455), (320, 455)], fill=(255, 235, 210, 255), width=8)
    for a in range(0, 360, 45):
        import math
        x0 = 280 + 260 * math.cos(math.radians(a))
        y0 = 220 + 260 * math.sin(math.radians(a))
        x1 = 280 + 205 * math.cos(math.radians(a))
        y1 = 220 + 205 * math.sin(math.radians(a))
        dc.line([(x0, y0), (x1, y1)], fill=AMBER + (230,), width=7)
    return _finish(img, glow)


def _ico_planet():
    img, glow, dc, dg = _canvas()
    _ellipse(dg, dc, [130, 130, 430, 430], AMBER, 10)
    import math
    pts = []
    for i in range(0, 360, 6):
        a = math.radians(i)
        x = 280 + 250 * math.cos(a)
        y = 280 + 70 * math.sin(a)
        pts.append((x, y))
    _stroke(dg, dc, pts, RED, 8)
    return _finish(img, glow)


def _ico_sun():
    img, glow, dc, dg = _canvas()
    _ellipse(dg, dc, [170, 170, 390, 390], AMBER, 10)
    for a in range(0, 360, 30):
        import math
        x0 = 280 + 150 * math.cos(math.radians(a)); y0 = 280 + 150 * math.sin(math.radians(a))
        x1 = 280 + 235 * math.cos(math.radians(a)); y1 = 280 + 235 * math.sin(math.radians(a))
        dc.line([(x0, y0), (x1, y1)], fill=AMBER + (230,), width=9)
    return _finish(img, glow)


def _ico_moon():
    img, glow, dc, dg = _canvas()
    dg.ellipse([140, 100, 440, 440], fill=AMBER + (190,))
    dg.ellipse([220, 80, 480, 400], fill=(0, 0, 0, 0))
    from PIL import ImageChops
    cut = Image.new("L", (ICON_SIZE, ICON_SIZE), 0)
    ImageDraw.Draw(cut).ellipse([220, 80, 480, 400], fill=255)
    img.putalpha(ImageChops.subtract(img.split()[3], cut))
    glow.putalpha(ImageChops.subtract(glow.split()[3], cut))
    out = _finish(img, glow)
    dc2 = ImageDraw.Draw(out)
    dc2.ellipse([190, 210, 230, 250], fill=(150, 115, 50, 200))
    dc2.ellipse([260, 300, 310, 350], fill=(150, 115, 50, 200))
    return out


def _ico_bolt():
    img, glow, dc, dg = _canvas()
    pts = [(320, 40), (150, 320), (265, 320), (215, 540), (430, 240), (305, 240), (395, 40)]
    dg.polygon(pts, outline=AMBER + (230,), width=14)
    dc.polygon(pts, outline=(255, 240, 200, 255), width=7)
    return _finish(img, glow)


def _ico_drop():
    img, glow, dc, dg = _canvas()
    dg.polygon([(280, 60), (130, 300), (280, 520), (430, 300)], fill=(60, 140, 255, 190))
    dc.polygon([(280, 60), (130, 300), (280, 520), (430, 300)], outline=(180, 220, 255, 255), width=8)
    dg.ellipse([225, 320, 260, 380], fill=(220, 240, 255, 220))
    return _finish(img, glow)


def _ico_wave():
    img, glow, dc, dg = _canvas()
    import math
    for row, y0 in enumerate((170, 280, 390)):
        pts = []
        for x in range(40, 521, 8):
            pts.append((x, y0 + 26 * math.sin((x / 60) + row)))
        _stroke(dg, dc, pts, (60, 150, 255), 9 - row)
    return _finish(img, glow)


def _ico_mountain():
    img, glow, dc, dg = _canvas()
    dg.polygon([(40, 480), (230, 140), (330, 320), (400, 220), (530, 480)], outline=AMBER + (220,), width=13)
    dc.polygon([(40, 480), (230, 140), (330, 320), (400, 220), (530, 480)], outline=(255, 235, 210, 255), width=6)
    dc.line([(190, 210), (270, 210)], fill=(255, 255, 255, 220), width=8)
    return _finish(img, glow)


def _ico_rocket():
    img, glow, dc, dg = _canvas()
    dg.polygon([(280, 40), (360, 200), (360, 380), (200, 380), (200, 200)], outline=RED + (230,), width=13)
    dc.polygon([(280, 40), (360, 200), (360, 380), (200, 380), (200, 200)], outline=(255, 220, 210, 255), width=6)
    _ellipse(dg, dc, [240, 180, 320, 260], AMBER, 8)
    dg.polygon([(200, 380), (150, 480), (240, 420)], fill=AMBER + (200,))
    dg.polygon([(360, 380), (410, 480), (320, 420)], fill=AMBER + (200,))
    dg.polygon([(255, 390), (280, 530), (305, 390)], fill=AMBER + (230,))
    return _finish(img, glow)


def _ico_atom():
    img, glow, dc, dg = _canvas()
    import math
    for rot in (0, 60, 120):
        pts = []
        for i in range(0, 361, 6):
            a = math.radians(i)
            x0, y0 = 75 * math.cos(a), 190 * math.sin(a)
            xr = x0 * math.cos(math.radians(rot)) - y0 * math.sin(math.radians(rot))
            yr = x0 * math.sin(math.radians(rot)) + y0 * math.cos(math.radians(rot))
            pts.append((280 + xr, 280 + yr))
        _stroke(dg, dc, pts, (90, 170, 255), 7)
    dg.ellipse([252, 252, 308, 308], fill=RED + (255,))
    return _finish(img, glow)


def _ico_dna():
    img, glow, dc, dg = _canvas()
    import math
    for i in range(0, 360 * 2, 12):
        a = math.radians(i)
        y = 80 + (400 / (360 * 2)) * i
        x1 = 280 + 130 * math.sin(a)
        x2 = 280 - 130 * math.sin(a)
        dg.ellipse([x1 - 11, y - 11, x1 + 11, y + 11], fill=AMBER + (210,))
        dg.ellipse([x2 - 11, y - 11, x2 + 11, y + 11], fill=RED + (210,))
        if i % 72 == 0:
            dc.line([(x1, y), (x2, y)], fill=(255, 235, 210, 220), width=6)
    return _finish(img, glow)


def _ico_hex():
    img, glow, dc, dg = _canvas()
    import math
    for cx, cy, r in ((280, 280, 200), (150, 160, 90), (420, 170, 70)):
        pts = [(cx + r * math.cos(math.radians(60 * i - 30)), cy + r * math.sin(math.radians(60 * i - 30))) for i in range(6)]
        _stroke(dg, dc, pts + [pts[0]], AMBER, 9)
    return _finish(img, glow)


def _ico_paw():
    img, glow, dc, dg = _canvas()
    dg.ellipse([200, 260, 360, 440], fill=AMBER + (190,))
    for x in (120, 215, 345, 440):
        dg.ellipse([x - 38, 140, x + 38, 260], fill=AMBER + (170,))
    dc.ellipse([200, 260, 360, 440], outline=(255, 235, 210, 230), width=6)
    return _finish(img, glow)


def _ico_clock():
    img, glow, dc, dg = _canvas()
    _ellipse(dg, dc, [110, 110, 450, 450], AMBER, 10)
    dc.line([(280, 280), (280, 160)], fill=(255, 235, 210, 255), width=9)
    dc.line([(280, 280), (370, 320)], fill=(255, 235, 210, 255), width=9)
    dg.ellipse([268, 268, 292, 292], fill=RED + (255,))
    return _finish(img, glow)


def _ico_flame():
    img, glow, dc, dg = _canvas()
    dg.polygon([(280, 50), (380, 220), (340, 330), (400, 320), (330, 480), (230, 480), (160, 320), (220, 330), (180, 210)],
               fill=RED + (200,))
    dg.polygon([(280, 220), (330, 330), (280, 430), (230, 330)], fill=AMBER + (230,))
    return _finish(img, glow)


def _ico_globe():
    img, glow, dc, dg = _canvas()
    _ellipse(dg, dc, [100, 100, 460, 460], (80, 170, 255), 9)
    _ellipse(dg, dc, [210, 100, 350, 460], (80, 170, 255), 6)
    dc.line([(100, 280), (460, 280)], fill=(80, 170, 255, 255), width=6)
    return _finish(img, glow)


def _ico_book():
    img, glow, dc, dg = _canvas()
    dg.polygon([(280, 140), (80, 180), (80, 430), (280, 390)], outline=AMBER + (220,), width=11)
    dg.polygon([(280, 140), (480, 180), (480, 430), (280, 390)], outline=AMBER + (220,), width=11)
    dc.line([(280, 140), (280, 390)], fill=(255, 235, 210, 255), width=7)
    return _finish(img, glow)


def _ico_infinity():
    img, glow, dc, dg = _canvas()
    import math
    pts1, pts2 = [], []
    for i in range(0, 361, 5):
        a = math.radians(i)
        x = 280 + 190 * math.cos(a) / (1 + math.sin(a) ** 2)
        y = 280 + 190 * math.sin(a) * math.cos(a) / (1 + math.sin(a) ** 2)
        (pts1 if i <= 180 else pts2).append((x + (0 if i <= 180 else 0), y))
    _stroke(dg, dc, pts1, RED, 9)
    _stroke(dg, dc, pts2, RED, 9)
    return _finish(img, glow)


def _ico_mask():
    """أيقونة القناع نفسه من الأصل الرسمي."""
    m = mask_rgba(ICON_SIZE)
    glow = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    red_ver = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), RED + (255,))
    glow.paste(red_ver, (0, 0), m.split()[3])
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    return Image.alpha_composite(glow, m)


ICON_FUNCS = {
    "star": _ico_star, "heart": _ico_heart, "eye": _ico_eye, "bulb": _ico_bulb,
    "planet": _ico_planet, "sun": _ico_sun, "moon": _ico_moon, "bolt": _ico_bolt,
    "drop": _ico_drop, "wave": _ico_wave, "mountain": _ico_mountain, "rocket": _ico_rocket,
    "atom": _ico_atom, "dna": _ico_dna, "hex": _ico_hex, "paw": _ico_paw,
    "clock": _ico_clock, "flame": _ico_flame, "globe": _ico_globe, "book": _ico_book,
    "infinity": _ico_infinity, "mask": _ico_mask,
}
_icon_cache: dict = {}


def get_icon(name: str) -> Image.Image:
    if name not in _icon_cache:
        f = ICON_FUNCS.get(name, ICON_FUNCS["star"])
        _icon_cache[name] = f()
    return _icon_cache[name]


# كلمات عربية → رمز بصري (كل كلمة يقولها الصوت ليها رسمتها)
KEYWORD_ICONS = [
    (r"قلب|دم|نبض|وعاء", "heart"),
    (r"دماغ|عقل|ذاكر|تفكير|تعلم|نوم|حلم|أحلام", "bulb"),
    (r"عين|ترى|رؤية|تخدع|مرأى", "eye"),
    (r"نجمة|نجوم|نجم|مستعر|سوبرنوفا", "star"),
    (r"كوكب|زحل|مشتري|زهره|نبتون|أورانوس|عطارد", "planet"),
    (r"شمس|طاقة|إشعاع|نواتج|فوتونات|ضوء", "sun"),
    (r"قمر|كسوف|خسوف|مدار", "moon"),
    (r"برق|رعد|كهرب|تيار|شحنة", "bolt"),
    (r"ماء|مياه|مطر|سائل|رطوبة", "drop"),
    (r"بحر|محيط|أعماق|أمواج|ماريانا|ساحلي", "wave"),
    (r"جبل|جبال|هيمالايا|إيفرست|قمة|تكتون", "mountain"),
    (r"فضاء|صاروخ|مريخ|رائد|فضاء|إطلاق|مهمة", "rocket"),
    (r"DNA|حمض|جين|وراث|كروموسوم", "dna"),
    (r"ذرة|نووي|كوانتم|جسيم|كيمياء|خلية", "atom"),
    (r"نحل|عسل|خلية نحل|قرص", "hex"),
    (r"أسد|حيوان|قط|حوت|نمل|بطريق|فراش|كائن|أسماك|زواحف|طائر|نسر|ذئب|فيل", "paw"),
    (r"زمن|وقت|ساعة|ثانية|دقيقة|عقارب|نسبية|زمني", "clock"),
    (r"نار|بركان|magma|ماغما|حمم|حرارة|حار", "flame"),
    (r"أرض|عالم|كون الأرض|جغرافيا|قارة", "globe"),
    (r"لغة|كتاب|شعر|خط|عربية|نحو|مكتبة|مخطوط", "book"),
    (r"سرعة|أسرع|لا نهائي|مفتول|كوارك", "infinity"),
    (r"ثقب أسود|مجرة|كون|فلك|سديم|كويكب|مذنب", "planet"),
]


def icon_for_text(text: str) -> str:
    t = text.lower()
    for pattern, icon in KEYWORD_ICONS:
        if re.search(pattern, t):
            return icon
    return "mask"


# ------------------------------------------------------------------
# 3) الغلاف الرسمي (Thumbnail) — القناع + العنوان
# ------------------------------------------------------------------
def compose_cover(out_path: Path, title: str, episode_id: str = "") -> Path:
    """غلاف 1080×1920: خلفية كونية + القناع الرسمي متوهج + العنوان + شريط العلامة."""
    from pathlib import Path as _P
    out_path = _P(out_path)
    from . import flux
    bg = flux.render_bg(out_path.parent / f"coverbg_{episode_id or 'x'}.png", "cover",
                        seed=f"cover{episode_id}{title}")
    img = Image.open(bg).convert("RGBA")
    w, h = img.size
    # ضبابية خفيفة للخلفية كي يبرز القناع والنص
    img = img.filter(ImageFilter.GaussianBlur(6))
    # هالة حمراء خلف القناع
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([w // 2 - int(w * .34), int(h * .06), w // 2 + int(w * .34), int(h * .06) + int(w * .68)],
               fill=RED + (90,))
    halo = halo.filter(ImageFilter.GaussianBlur(120))
    img = Image.alpha_composite(img.convert("RGBA"), halo)
    # شعار دوشة الناري (شفاف متوهج)
    from . import ember as _ember
    mask = _ember.extract(int(w * .60), glow=36)
    img.paste(mask, (int(w / 2 - mask.width / 2), int(h * .065)), mask)
    d = ImageDraw.Draw(img)
    # العنوان (بكسر bidi لضمان سلامة الأرقام والترقيم)
    from .scenes import bidi_break
    size = int(h * .050)
    lines = _wrap(d, bidi_break(title), size, int(w * .84))
    cy = int(h * .52)
    for ln in lines:
        _text(d, (w // 2 + int(h * .004), cy + int(h * .004)), ln, size, fill=(0, 0, 0), bold=True)
        _text(d, (w // 2, cy), ln, size, fill=WHITE, bold=True)
        cy += int(size * 1.3)
    d.line([(w * .25, cy + int(h * .012)), (w * .75, cy + int(h * .012))], fill=AMBER, width=int(h * .0045))
    # توقيع العلامة + الخاتمة
    _text(d, (w // 2, int(h * .855)), "XDAW  |  DAWSHA NOVA", int(h * .028), fill=(255, 240, 200), bold=True)
    _text(d, (w // 2, int(h * .895)), "معرفة تنفع العالم • تابع دوشة", int(h * .024), fill=AMBER, bold=True)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if (w, h) != (1080, 1920):
        img = img.resize((1080, 1920), Image.LANCZOS)
    img.convert("RGB").save(out_path, "PNG")
    return out_path
