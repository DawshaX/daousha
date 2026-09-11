"""مولّد الخلفيات الحية 2099 — كل خلفية تُصنَع رياضيًا (numpy) بلا أي حقوق:
سدم بلازما + حقول نجوم + شبكات منظورية + نفاثات ضوء + مدن مستقبلية + ضباب سينمائي.
كل حلقة تأخذ بذرة عشوائية مختلفة => لا تتكرر الخلفية أبدًا.
"""
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .scenes import AMBER, RED

W, H = 2160, 3840  # 2× الدقة النهائية — نزولة في المونتاج بحركة ناعمة

# لوحات ألوان 2099 (كلها تنتمي لعالم XDAW: كحلي عميق + قرمزي + كهرمان)
PALETTES = {
    "nova":   [(6, 9, 26), (38, 8, 40), (120, 14, 34), (255, 120, 40)],
    "ember":  [(8, 6, 18), (48, 10, 22), (150, 26, 30), (255, 180, 70)],
    "nebula": [(4, 10, 30), (20, 24, 70), (140, 20, 60), (255, 150, 60)],
    "royal":  [(6, 8, 24), (30, 16, 60), (110, 20, 60), (255, 160, 80)],
}


def _color_ramp(stops, t):
    """تدرج لوني بين نقاط التحكم t∈[0,1]."""
    n = len(stops) - 1
    x = min(max(t, 0.0), 1.0) * n
    i = min(int(x), n - 1)
    f = x - i
    a, b = stops[i], stops[i + 1]
    return tuple(int(a[k] + (b[k] - a[k]) * f) for k in range(3))


def _nebula_field(rng: random.Random, w=W, h=H, stops=PALETTES["nova"], density=5) -> np.ndarray:
    """حقل بلازما متعدد الطبقات — سديم عضوي حي."""
    yy, xx = np.mgrid[0:h:8, 0:w:8].astype(np.float32)  # دقة مخففة ثم تكبير ناعم
    xx /= w
    yy /= h
    acc = np.zeros_like(xx)
    for layer in range(density):
        fx, fy = rng.uniform(2, 7), rng.uniform(2, 7)
        px, py = rng.uniform(0, 6.28), rng.uniform(0, 6.28)
        acc += np.sin(xx * fx * math.pi + px + np.sin(yy * fy * math.pi * 0.7 + py) * 1.8)
        acc += np.cos(yy * fy * math.pi * 1.1 + py + np.sin(xx * fx * math.pi * 0.6 + px))
    acc = (acc - acc.min()) / (np.ptp(acc) + 1e-6)
    acc = acc ** 1.6  # تباين سينمائي
    # خريطة ألوان
    rgb = np.zeros((*acc.shape, 3), dtype=np.float32)
    for c in range(3):
        lut = np.array([_color_ramp(stops, i / 255)[c] for i in range(256)], dtype=np.float32)
        rgb[..., c] = lut[(acc * 255).astype(np.uint8)]
    img = Image.fromarray(rgb.astype(np.uint8), "RGB").resize((w, h), Image.LANCZOS)
    return img


def _starfield(rng: random.Random, w=W, h=H, count=380) -> Image.Image:
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for _ in range(count):
        x, y = rng.randint(0, w - 1), rng.randint(0, h - 1)
        r = rng.choice([2, 2, 3, 4, 6])
        c = rng.randint(150, 255)
        warm = rng.random() < 0.25
        col = (255, c - 40 if warm else c, max(0, c - 80) if warm else c, rng.randint(90, 220))
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)
        if r >= 4:  # توهج للنجوم الكبيرة
            g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            ImageDraw.Draw(g).ellipse([x - r * 3, y - r * 3, x + r * 3, y + r * 3],
                                      fill=col[:3] + (40,))
            img = Image.alpha_composite(g.filter(ImageFilter.GaussianBlur(14)), img)
            d = ImageDraw.Draw(img)
    return img


def _light_rays(rng: random.Random, w=W, h=H, color=(255, 90, 50)) -> Image.Image:
    """أعمدة ضوء نازلة من الأعلى — نفاثة الهوك."""
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = w // 2 + rng.randint(-int(w * .1), int(w * .1))
    for _ in range(9):
        spread = rng.randint(-int(w * .38), int(w * .38))
        width = rng.randint(int(w * .01), int(w * .045))
        alpha = rng.randint(22, 60)
        d.polygon([(cx + spread - width, -50), (cx + spread + width, -50),
                   (cx + spread * 2 + width * 3, int(h * .95)),
                   (cx + spread * 2 - width * 3, int(h * .95))],
                  fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(38))
    return layer


def _dream_grid(rng: random.Random, w=W, h=H) -> Image.Image:
    """شبكة منظورية تسبح نحو الأفق — عالم 2099."""
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    horizon = int(h * .62)
    vpx = w // 2
    # خطوط أفقية متباعدة بمنظور
    for i in range(22):
        t = i / 22
        y = horizon + int((h - horizon) * (t ** 2.4))
        a = int(30 + 140 * t)
        d.line([(0, y), (w, y)], fill=RED + (a,), width=max(2, int(3 + 9 * t)))
    # خطوط شعاعية
    for i in range(-14, 15):
        x_end = vpx + i * int(w * .09)
        d.line([(vpx, horizon), (x_end, h)], fill=RED + (70,), width=4)
    # هالة الأفق
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([vpx - int(w * .55), horizon - int(h * .045),
                                  vpx + int(w * .55), horizon + int(h * .045)],
                                 fill=(255, 120, 60, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    layer = Image.alpha_composite(layer, glow)
    return layer


def _city_2099(rng: random.Random, w=W, h=H) -> Image.Image:
    """أفق مدينة مستقبلية: أبراج + نوافذ متوهجة + مسارات طائرات ضوئية."""
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    base = int(h * .8)
    x = -40
    while x < w + 40:
        bw = rng.randint(int(w * .04), int(w * .11))
        bh = rng.randint(int(h * .04), int(h * .22))
        top = base - bh
        d.rectangle([x, top, x + bw, h], fill=(9, 12, 30, 255))
        d.line([(x, top), (x, h)], fill=RED + (180,), width=5)
        d.line([(x + bw, top), (x + bw, h)], fill=RED + (120,), width=3)
        d.line([(x, top), (x + bw, top)], fill=AMBER + (200,), width=4)
        # نوافذ
        for wy in range(top + int(bh * .08), h - int(bh * .05), int(bh * .12)):
            for wx in range(x + int(bw * .15), x + bw - int(bw * .12), int(bw * .28)):
                if rng.random() < .5:
                    wc = AMBER if rng.random() < .75 else (120, 190, 255)
                    d.rectangle([wx, wy, wx + max(4, bw // 14), wy + max(6, bh // 40)],
                                fill=wc + (rng.randint(90, 200),))
        # هوائي مضيء
        if rng.random() < .4:
            ax = x + bw // 2
            d.line([(ax, top), (ax, top - rng.randint(int(h * .015), int(h * .05)))],
                   fill=RED + (220,), width=4)
            d.ellipse([ax - 8, top - 16, ax + 8, top], fill=(255, 60, 60, 255))
        x += bw + rng.randint(8, 60)
    # مسارات الطائرات (خطوط ضوء أفقية مائلة)
    for _ in range(7):
        y = rng.randint(int(h * .3), int(h * .68))
        x0 = rng.randint(-int(w * .2), int(w * .5))
        ln = rng.randint(int(w * .15), int(w * .4))
        d.line([(x0, y), (x0 + ln, y - rng.randint(20, 90))],
               fill=(255, 170, 90, rng.randint(60, 130)), width=6)
    layer = layer.filter(ImageFilter.GaussianBlur(1))
    return layer


def _particles_frames(rng: random.Random, n_frames=48, w=540, h=960) -> list[Image.Image]:
    """إطارات جزيئات متوهجة تسبح صعودًا (للدمج screen فوق الفيديو — حياة دائمة)."""
    pts = [{"x": rng.uniform(0, w), "y": rng.uniform(0, h),
            "r": rng.uniform(1.5, 5.5), "s": rng.uniform(12, 55),
            "dx": rng.uniform(-8, 8), "warm": rng.random() < .7} for _ in range(70)]
    frames = []
    for f in range(n_frames):
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        for p in pts:
            y = (p["y"] - f * p["s"] / n_frames) % (h + 40) - 20
            x = (p["x"] + f * p["dx"] / n_frames) % w
            r = p["r"]
            col = (255, 190, 110) if p["warm"] else (255, 90, 70)
            a = int(120 + 90 * math.sin(f / n_frames * 2 * math.pi + p["x"]))
            d.ellipse([x - r, y - r, x + r, y + r], fill=col + (max(40, a),))
        frames.append(img.filter(ImageFilter.GaussianBlur(0.8)))
    return frames


def _grain_vignette(img: Image.Image, rng: random.Random) -> Image.Image:
    """حُبيبات فيلم + تظليل حواف سينمائي."""
    w, h = img.size
    yy, xx = np.mgrid[0:h:4, 0:w:4]
    noise = np.random.default_rng(rng.randint(0, 10**9)).normal(0, 5.5, (*yy.shape, 1)).astype(np.float32)
    arr = np.array(img).astype(np.float32)
    arr[::4, ::4, :3] = np.clip(arr[::4, ::4, :3] + noise, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8), "RGBA")
    # فينييت
    vig = Image.new("L", (w, h), 0)
    ImageDraw.Draw(vig).ellipse([-int(w * .25), -int(h * .12), int(w * 1.25), int(h * 1.12)], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(w // 10))
    black = Image.new("RGBA", (w, h), (2, 3, 10, 255))
    img = Image.composite(img, black, vig)
    return img


def render_bg(out_path, kind: str = "fact", seed: str = "x", palette: str | None = None):
    """يولّد خلفية حية 2160×3840 حسب نوع المقطع. kind: hook|fact|outro|cover"""
    rng = random.Random(f"{kind}:{seed}")
    pal = PALETTES[palette or rng.choice(list(PALETTES))]
    img = _nebula_field(rng, stops=pal, density=rng.randint(4, 6)).convert("RGBA")
    if kind == "hook":
        img = Image.alpha_composite(img, _light_rays(rng))
    elif kind == "fact":
        roll = rng.random()
        if roll < .45:
            img = Image.alpha_composite(img, _dream_grid(rng))
        elif roll < .8:
            img = Image.alpha_composite(img, _city_2099(rng))
        # والباقي: سديم صافٍ أنيق
        # شبح النار: حضور روحي خافت لشعار دوشة في بعض الخلفيات
        if rng.random() < .6:
            from . import ember as _ember
            sz = int(min(img.size) * rng.uniform(.45, .7))
            img = _ember.ghost(img, (img.size[0] // 2, int(img.size[1] * rng.uniform(.32, .45))),
                               sz, alpha=rng.randint(22, 40))
    else:  # outro — نفس يجمع كل شيء
        img = Image.alpha_composite(img, _light_rays(rng))
        img = Image.alpha_composite(img, _city_2099(rng))
    img = Image.alpha_composite(img, _starfield(rng))
    img = _grain_vignette(img, rng)
    img.convert("RGB").save(out_path, "PNG")
    return out_path


def render_particles_video(out_mp4: str, ffmpeg_bin, seed: str = "p", fps: int = 24):
    """فيديو جزيئات شفاف قابل للتكرار (يُدمج بوضع screen فوق أي مشهد)."""
    import subprocess
    rng = random.Random(seed)
    frames = _particles_frames(rng)
    import tempfile, os
    tmp = tempfile.mkdtemp(prefix="ptc")
    for i, fr in enumerate(frames):
        fr.save(os.path.join(tmp, f"f{i:03d}.png"))
    subprocess.run([ffmpeg_bin, "-y", "-framerate", str(fps), "-i", os.path.join(tmp, "f%03d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", out_mp4],
                   capture_output=True, check=True)
    import shutil
    shutil.rmtree(tmp, ignore_errors=True)
    return out_mp4
