"""كينيتيك كابشنز 2026 — كاريوكي متزامن مع صوت دوشة:
شرائط كلمات (تتشكل العربية عبر raqm) + أنيميشن ffmpeg: ظهور ناعم + طيران خفيف + تلألئ موضعي.
الكلمات المفتاحية تتصدر بلون العلامة الكهرماني — «كل كلمة يصفها المقطع».
"""
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from .scenes import AMBER, _font

CAP_W = 1000
WHITE = (255, 255, 255)

# كلمات تتصدر بالكهرماني (أرقام + مفاتيح معرفة)
KEY_PAT = re.compile(
    r"(\d+|[٠-٩]+|مليون|مليار|ألف|مئة|مئات|الحقيقة|السر|الأولى|الثانية|الثالثة|"
    r"الشمس|القلب|الدماغ|النحل|DNA|الكون|الأرض|المحيط|الفضاء|الماء|النوم|البرق|"
    r"الضوء|الزمن|الوقت|المريخ|القمر|الثقوب|المادة|الجاذبية|الصحراء|الهيمالايا)")


def _split_chunks(seg: dict, max_chars: int = 26) -> list[dict]:
    """يقسم سطر الصوت لمجموعات كلمات صغيرة بتوقيتات دقيقة (من حدود كلمات edge-tts)."""
    words = seg.get("words") or []
    if not words:
        return [{"text": seg["text"], "t0": 0.0, "t1": max(0.4, seg["t1"] - seg["t0"]),
                 "label": seg["seg"]}]
    chunks, cur, cur_start = [], [], None
    last_end = None
    for wd in words:
        if cur_start is None:
            cur_start = wd["start"]
        cand = " ".join(cur + [wd["text"]])
        if len(cand) > max_chars and cur:
            chunks.append({"text": " ".join(cur), "t0": cur_start, "t1": last_end})
            cur, cur_start = [wd["text"]], wd["start"]
        else:
            cur.append(wd["text"])
        last_end = wd["start"] + wd["dur"]
    if cur:
        chunks.append({"text": " ".join(cur), "t0": cur_start, "t1": last_end})
    out = []
    for i, ch in enumerate(chunks):
        t1 = ch["t1"] + 0.12
        if i + 1 < len(chunks):  # حتى نهاية بداية اللي بعده
            t1 = max(t1, min(chunks[i + 1]["t0"], ch["t1"] + 0.25))
        out.append({"text": ch["text"], "t0": ch["t0"], "t1": t1,
                    "label": seg["seg"]})
    return out


def _render_word_strip(text: str, out: Path, big: bool = False) -> None:
    """شريط نص شفاف بظل عميق + توهج، مع تلوين الكلمات المفتاحية كهرمانيًا."""
    scale = 2
    fsize = (86 if big else 74) * scale
    f = _font(fsize, True)
    pad = 26 * scale
    # قياس
    tmp = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
    def w_of(t):
        try:
            return tmp.textlength(t, font=f, direction="rtl", language="ar")
        except Exception:
            return tmp.textlength(t, font=f)
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if w_of(trial) <= CAP_W * scale - pad * 2 or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    lh = int(fsize * 1.32)
    W_img = CAP_W * scale
    H_img = pad * 2 + lh * len(lines)
    img = Image.new("RGBA", (W_img, H_img), (0, 0, 0, 0))
    # طبقة التوهج الخلفية للكلمات المفتاحية
    glow = Image.new("RGBA", (W_img, H_img), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    d = ImageDraw.Draw(img)

    def draw_line(dr, y, line, fill, blur_target=None):
        try:
            dr.text((W_img // 2, y), line, font=f, fill=fill, anchor="mm",
                    direction="rtl", language="ar")
        except Exception:
            dr.text((W_img // 2, y), line, font=f, fill=fill, anchor="mm")

    y = pad + lh // 2
    for line in lines:
        is_key = bool(KEY_PAT.search(line))
        fill = AMBER + (255,) if is_key else WHITE + (255,)
        if is_key:  # توهج كهرماني خلف السطر المفتاحي
            draw_line(gd, y, line, AMBER + (170,))
        # ظل أسود عميق
        draw_line(d, y + 7 * scale, line, (0, 0, 0, 235))
        # النص
        draw_line(d, y, line, fill)
        y += lh
    glow = glow.filter(ImageFilter.GaussianBlur(16 * scale))
    final = Image.alpha_composite(glow, img)
    out.parent.mkdir(parents=True, exist_ok=True)
    final.resize((CAP_W, H_img // scale), Image.LANCZOS).save(out, "PNG")


def build_kinetic_overlays(plan: dict, out_dir: Path) -> list[dict]:
    """يبني كل شرائط الكلمات بتوقيتاتها المطلقة — جاهزة لأنيميشن ffmpeg.

    يعيد: [{"png", "t0", "t1", "big"}]
    """
    overlays = []
    idx = 0
    for seg in plan["segments"]:
        big = seg["seg"] in ("hook", "outro")
        for ch in _split_chunks(seg):
            png = out_dir / f"kw_{idx:03d}.png"
            _render_word_strip(ch["text"], png, big)
            overlays.append({
                "png": str(png),
                "t0": round(seg["t0"] + ch["t0"], 3),
                "t1": round(seg["t0"] + ch["t1"], 3),
                "big": big,
            })
            idx += 1
    return overlays
