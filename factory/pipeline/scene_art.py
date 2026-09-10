#!/usr/bin/env python3
"""🎨 محرك المشاهد v2 — كل حقيقة بمشهد حقيقي يوصفها + مؤثرات روحية.

محلي 100% (PIL فقط) — مجاني وبلا حدود. يختار الرسم من كلمات الموضوع:
شمس، قمر، دماغ، قلب، برق، محيط، نمل، نحل، أخطبوط، شجر، هرم، ثقب أسود، مال، روبوت...
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
CY = 560  # مركز منطقة الرسم (الثلثان العلويان)


# ---------------- أدوات ----------------
def vgrad(top, bottom, y0=0, y1=H):
    img = Image.new("RGB", (W, H), top)
    d = ImageDraw.Draw(img)
    for y in range(y0, min(y1, H)):
        t = (y - y0) / max(1, (y1 - y0))
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return img


def glow_spot(img, cx, cy, r, color, alpha=110):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(r, 0, -10):
        a = int(alpha * (1 - i / r) ** 1.6)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=color + (a,))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def stars(img, rng, n=220, y_max=1250):
    d = ImageDraw.Draw(img)
    for _ in range(n):
        x, y = rng.randint(0, W), rng.randint(0, y_max)
        r = rng.choice([1, 1, 2, 2, 3])
        b = rng.randint(120, 255)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(b, b, b, 230))
    return img


def god_rays(img, rng, cx=W // 2, n=7, color=(255, 60, 60), alpha=26):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        ang = rng.uniform(-0.5, 0.5) + math.pi / 2
        wdt = rng.randint(30, 110)
        x2 = cx + int(1400 * math.cos(ang))
        y2 = int(1400 * math.sin(ang))
        d.polygon([(cx - wdt, -50), (cx + wdt, -50), (x2 + wdt * 3, y2), (x2 - wdt * 3, y2)],
                  fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(30))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def particles(img, rng, n=90, color=(255, 120, 90), y_max=1250):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x, y = rng.randint(0, W), rng.randint(60, y_max)
        r = rng.randint(2, 7)
        d.ellipse([x - r * 2, y - r * 2, x + r * 2, y + r * 2], fill=color + (50,))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 235, 220, 200))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def mist(img, rng, y=950, color=(150, 30, 30), alpha=40):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(26):
        x = rng.randint(-100, W)
        wdt, hgt = rng.randint(150, 420), rng.randint(24, 60)
        yy = y + rng.randint(-40, 40)
        d.ellipse([x, yy, x + wdt, yy + hgt], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(25))
    return Image.alpha_composite(img.convert("RGBA"), layer)


def ring(img, cx, cy, r, color=(255, 30, 30), width=5, alpha=200):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r],
                                 outline=color + (alpha,), width=width)
    return Image.alpha_composite(img.convert("RGBA"), layer)


# ---------------- رسامون: سماء وكون ----------------
def p_sun(img, rng):
    img = glow_spot(img, W // 2, CY, 460, (255, 90, 20), 120)
    d = ImageDraw.Draw(img)
    for i in range(12):
        a = i / 12 * 2 * math.pi + rng.random() * 0.2
        x2, y2 = W // 2 + int(430 * math.cos(a)), CY + int(430 * math.sin(a))
        d.line([(W // 2, CY), (x2, y2)], fill=(255, 150, 60, 150), width=rng.randint(14, 30))
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 150, CY - 150, W // 2 + 150, CY + 150], fill=(255, 200, 120, 255))
    d.ellipse([W // 2 - 110, CY - 110, W // 2 + 110, CY + 110], fill=(255, 240, 210, 255))
    img = glow_spot(img, W // 2, CY, 220, (255, 180, 80), 140)
    for _ in range(40):  # لهب
        a = rng.random() * 2 * math.pi
        rr = rng.randint(150, 200)
        x, y = W // 2 + int(rr * math.cos(a)), CY + int(rr * math.sin(a))
        d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 110, 40, 200))
    return img


def p_moon(img, rng):
    img = stars(img, rng)
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 170, CY - 170, W // 2 + 170, CY + 170], fill=(225, 225, 235, 255))
    d.ellipse([W // 2 - 110, CY - 200, W // 2 + 200, CY + 140], fill=(8, 8, 12, 255))  # هلال
    for _ in range(9):
        x, y = rng.randint(W // 2 - 140, W // 2 + 40), rng.randint(CY - 140, CY + 140)
        d.ellipse([x, y, x + rng.randint(14, 40), y + rng.randint(14, 40)], fill=(190, 190, 205, 255))
    return glow_spot(img, W // 2 - 60, CY, 300, (180, 180, 220), 60)


def p_blackhole(img, rng):
    img = stars(img, rng, 300)
    d = ImageDraw.Draw(img)
    for rr, al in [(260, 60), (220, 120), (190, 200)]:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([W // 2 - rr, CY - rr // 3, W // 2 + rr, CY + rr // 3],
                                     outline=(255, 140, 60, al), width=14)
        img = Image.alpha_composite(img.convert("RGBA"), layer.filter(ImageFilter.GaussianBlur(4)))
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 130, CY - 130, W // 2 + 130, CY + 130], fill=(0, 0, 0, 255))
    img = ring(img, W // 2, CY, 132, (255, 200, 150), 4, 255)
    return glow_spot(img, W // 2, CY, 340, (255, 100, 40), 70)


def p_galaxy(img, rng):
    img = stars(img, rng, 260)
    d = ImageDraw.Draw(img)
    for arm in range(3):
        for i in range(120):
            t = i / 120
            a = t * 4.5 + arm * 2.1
            rr = 40 + t * 260
            x, y = W // 2 + int(rr * math.cos(a)), CY + int(rr * 0.42 * math.sin(a))
            b = int(255 * (1 - t * 0.7))
            d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(b, b // 3 + 40, 120, 220))
    return glow_spot(img, W // 2, CY, 130, (255, 220, 200), 160)


# ---------------- رسامون: جسم وعقل ----------------
def p_neurons(img, rng):
    nodes = [(rng.randint(80, W - 80), rng.randint(150, 1000)) for _ in range(26)]
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i, (x1, y1) in enumerate(nodes):
        for x2, y2 in nodes[i + 1:]:
            if abs(x1 - x2) + abs(y1 - y2) < 380:
                d.line([(x1, y1), (x2, y2)], fill=(255, 60, 80, 70), width=2)
    for x, y in nodes:
        r = rng.randint(6, 16)
        d.ellipse([x - r * 2, y - r * 2, x + r * 2, y + r * 2], fill=(255, 40, 60, 60))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 200, 210, 255))
    img = Image.alpha_composite(img.convert("RGBA"), layer)
    return glow_spot(img, W // 2, CY, 260, (255, 40, 80), 80)


def p_heart(img, rng):
    d = ImageDraw.Draw(img)
    cx, cy, s = W // 2, CY - 40, 130
    d.ellipse([cx - s, cy - s // 2, cx, cy + s // 2], fill=(220, 20, 40, 255))
    d.ellipse([cx, cy - s // 2, cx + s, cy + s // 2], fill=(220, 20, 40, 255))
    d.polygon([(cx - s + 14, cy + 10), (cx + s - 14, cy + 10), (cx, cy + s + 40)], fill=(220, 20, 40, 255))
    d.ellipse([cx - 40, cy - 60, cx + 10, cy - 10], fill=(255, 150, 160, 160))  # لمعة
    img = glow_spot(img, cx, cy + 20, 300, (255, 30, 50), 90)
    d = ImageDraw.Draw(img)  # نبضة ECG
    pts, x = [], 60
    while x < W - 60:
        pts.append((x, CY + 230))
        x += 40
    pts[4] = (pts[4][0], CY + 170)
    pts[5] = (pts[5][0], CY + 320)
    pts[6] = (pts[6][0], CY + 230)
    d.line(pts, fill=(255, 80, 100, 255), width=6, joint="curve")
    return img


def p_dna(img, rng):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(140, 1020, 26):
        t = y / 60
        x1, x2 = W // 2 + int(150 * math.sin(t)), W // 2 + int(150 * math.sin(t + math.pi))
        d.line([(x1, y), (x2, y)], fill=(255, 170, 60, 90), width=3)
        d.ellipse([x1 - 9, y - 9, x1 + 9, y + 9], fill=(255, 90, 90, 230))
        d.ellipse([x2 - 9, y - 9, x2 + 9, y + 9], fill=(90, 200, 255, 230))
    img = Image.alpha_composite(img.convert("RGBA"), layer)
    return glow_spot(img, W // 2, CY, 280, (255, 120, 60), 70)


# ---------------- رسامون: أرض وطبيعة ----------------
def p_waves(img, rng):
    d = ImageDraw.Draw(img)
    for k in range(6):
        yb = 420 + k * 110
        pts = [(x, yb + int(34 * math.sin(x / 130 + k * 1.3))) for x in range(-20, W + 20, 12)]
        pts = [(0, yb + 300)] + pts + [(W, yb + 300)]
        col = (10 + k * 6, 40 + k * 14, 90 + k * 22, 235)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).polygon(pts, fill=col)
        img = Image.alpha_composite(img.convert("RGBA"), layer)
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 90, 200, W // 2 + 90, 380], fill=(200, 230, 255, 200))  # قمر الماء
    return glow_spot(img, W // 2, 290, 200, (150, 200, 255), 70)


def p_lightning(img, rng):
    d = ImageDraw.Draw(img)
    for _ in range(5):  # غيوم
        x = rng.randint(0, W - 300)
        d.ellipse([x, 120, x + 340, 300], fill=(35, 35, 48, 255))
    x, y = W // 2 + rng.randint(-100, 100), 260
    pts = [(x, y)]
    while y < 1050:
        x += rng.randint(-90, 90)
        y += rng.randint(70, 130)
        pts.append((x, y))
    for wdt, al in [(26, 60), (12, 140), (5, 255)]:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).line(pts, fill=(200, 220, 255, al), width=wdt, joint="curve")
        img = Image.alpha_composite(img.convert("RGBA"), layer.filter(ImageFilter.GaussianBlur(2)))
    return img


def p_tree(img, rng):
    def branch(d, x, y, ang, ln, wdt):
        if ln < 18 or wdt < 1:
            return
        x2, y2 = x + int(ln * math.cos(ang)), y - int(ln * math.sin(ang))
        d.line([(x, y), (x2, y2)], fill=(60, 200, 120, 220), width=wdt)
        branch(d, x2, y2, ang - rng.uniform(0.2, 0.6), ln * 0.72, wdt - 1)
        branch(d, x2, y2, ang + rng.uniform(0.2, 0.6), ln * 0.72, wdt - 1)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle([W // 2 - 26, 700, W // 2 + 26, 1050], fill=(120, 80, 50, 255))
    branch(d, W // 2, 700, math.pi / 2, 200, 9)
    img = Image.alpha_composite(img.convert("RGBA"), layer)
    for _ in range(40):  # يراعات
        x, y = rng.randint(100, W - 100), rng.randint(250, 950)
        d2 = ImageDraw.Draw(img)
        d2.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 240, 150, 220))
    return glow_spot(img, W // 2, 550, 320, (80, 255, 150), 60)


def p_honeycomb(img, rng):
    d = ImageDraw.Draw(img)
    s = 64
    for row in range(12):
        for col in range(9):
            cx = col * s * 1.74 + (s * 0.87 if row % 2 else 0) + 20
            cy = row * s * 1.5 + 130
            pts = [(cx + s * 0.9 * math.cos(a), cy + s * 0.9 * math.sin(a))
                   for a in [i * math.pi / 3 + 0.5 for i in range(6)]]
            fill = (200, 140, 30, 200) if rng.random() < 0.85 else (255, 200, 80, 230)
            d.polygon(pts, outline=(120, 80, 10, 255))
            d.polygon([(cx + (px - cx) * 0.82, cy + (py - cy) * 0.82) for px, py in pts], fill=fill)
    return glow_spot(img, W // 2, CY, 300, (255, 190, 60), 80)


def p_tentacles(img, rng):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for k in range(7):
        x0 = 100 + k * 130
        pts = [(x0 + int(90 * math.sin(y / 130 + k)), y) for y in range(1050, 200, -30)]
        d.line(pts, fill=(180, 60, 140, 200), width=34 - k * 2, joint="curve")
        for x, y in pts[::3]:
            d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(255, 180, 220, 220))
    d.ellipse([W // 2 - 120, 180, W // 2 + 120, 420], fill=(150, 40, 120, 255))  # رأس
    d.ellipse([W // 2 - 60, 250, W // 2 - 10, 300], fill=(255, 240, 250, 255))  # عيون
    d.ellipse([W // 2 + 10, 250, W // 2 + 60, 300], fill=(255, 240, 250, 255))
    img = Image.alpha_composite(img.convert("RGBA"), layer)
    return glow_spot(img, W // 2, 600, 320, (200, 60, 160), 70)


def p_pyramids(img, rng):
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 100, 180, W // 2 + 100, 380], fill=(255, 190, 90, 255))  # شمس
    for bx, bw, bh in [(140, 420, 480), (560, 360, 380)]:
        top = (bx + bw // 2, 980 - bh)
        d.polygon([(bx, 980), (bx + bw, 980), top], fill=(190, 150, 90, 255))
        d.polygon([(bx + bw // 2, 980), (bx + bw, 980), top], fill=(150, 115, 65, 255))
        d.line([(bx, 980), (bx + bw, 980)], fill=(120, 90, 50, 255), width=4)
    d.rectangle([0, 980, W, 1250], fill=(160, 125, 70, 255))
    for _ in range(30):
        x = rng.randint(0, W)
        d.arc([x, 1000, x + 120, 1080], 180, 360, fill=(130, 100, 55, 255), width=3)
    return glow_spot(img, W // 2, 280, 260, (255, 180, 100), 80)


# ---------------- رسامون: تقنية ومستقبل ومال ----------------
def p_circuits(img, rng):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(22):
        x, y = rng.randint(0, W), rng.randint(120, 1050)
        for _ in range(rng.randint(2, 4)):
            horiz = rng.random() < 0.5
            nx = x + rng.choice([-1, 1]) * rng.randint(60, 240) if horiz else x
            ny = y if horiz else y + rng.choice([-1, 1]) * rng.randint(60, 240)
            nx, ny = max(0, min(W, nx)), max(100, min(1080, ny))
            d.line([(x, y), (nx, ny)], fill=(60, 220, 180, 120), width=3)
            x, y = nx, ny
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(90, 255, 200, 220))
    d.rectangle([W // 2 - 110, CY - 110, W // 2 + 110, CY + 110], fill=(15, 25, 30, 255),
                outline=(90, 255, 200, 255), width=4)
    for i in range(6):  # أسنان الشريحة
        for sx in (W // 2 - 140, W // 2 + 110):
            d.line([(sx, CY - 80 + i * 32), (sx + 30, CY - 80 + i * 32)], fill=(90, 255, 200, 255), width=4)
    d.ellipse([W // 2 - 40, CY - 40, W // 2 + 40, CY + 40], fill=(90, 255, 200, 200))
    img = Image.alpha_composite(img.convert("RGBA"), layer)
    return glow_spot(img, W // 2, CY, 260, (60, 255, 200), 80)


def p_robot(img, rng):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([W // 2 - 190, CY - 200, W // 2 + 190, CY + 180], radius=90,
                        fill=(30, 34, 44, 255), outline=(120, 200, 255, 255), width=5)
    for ex in (-90, 90):  # عيون
        d.ellipse([W // 2 + ex - 42, CY - 110, W // 2 + ex + 42, CY - 26], fill=(100, 220, 255, 255))
        d.ellipse([W // 2 + ex - 18, CY - 86, W // 2 + ex + 18, CY - 50], fill=(10, 20, 40, 255))
    d.line([(W // 2 - 200, CY - 260), (W // 2 - 200, CY - 320)], fill=(120, 200, 255, 255), width=6)
    d.ellipse([W // 2 - 216, CY - 352, W // 2 - 184, CY - 320], fill=(255, 80, 80, 255))
    d.arc([W // 2 - 90, CY + 20, W // 2 + 90, CY + 130], 10, 170, fill=(120, 200, 255, 255), width=8)
    for _ in range(40):  # بيانات
        x = rng.randint(60, W - 60)
        d.line([(x, 120), (x, rng.randint(150, 300))], fill=(80, 160, 255, 90), width=3)
    img = glow_spot(img, W // 2, CY, 340, (80, 180, 255), 80)
    return img


def p_city(img, rng):
    d = ImageDraw.Draw(img)
    d.ellipse([W // 2 - 130, 150, W // 2 + 130, 410], fill=(180, 120, 255, 180))  # قمر مستقبلي
    x = 0
    while x < W:
        bw, bh = rng.randint(70, 150), rng.randint(220, 560)
        d.rectangle([x, 980 - bh, x + bw, 980], fill=(22, 24, 40, 255))
        for wy in range(980 - bh + 20, 960, 34):
            for wx in range(x + 12, x + bw - 12, 26):
                if rng.random() < 0.6:
                    d.rectangle([wx, wy, wx + 12, wy + 16], fill=(255, 220, 130, 220))
        d.line([(x, 980 - bh), (x + bw, 980 - bh)], fill=(255, 60, 120, 255), width=3)  # نيون
        x += bw + rng.randint(4, 20)
    for _ in range(6):  # سيارات طائرة
        x, y = rng.randint(80, W - 80), rng.randint(420, 700)
        d.ellipse([x - 34, y - 10, x + 34, y + 10], fill=(150, 200, 255, 230))
        d.ellipse([x - 34, y + 8, x + 34, y + 12], fill=(255, 100, 150, 200))
    d.rectangle([0, 980, W, 1250], fill=(12, 12, 20, 255))
    return img


def p_money(img, rng):
    d = ImageDraw.Draw(img)
    for s in range(4):  # أكوام عملات
        bx = 120 + s * 230
        bh = 180 + s * 90 + rng.randint(-20, 20)
        for y in range(950, 950 - bh, -22):
            d.ellipse([bx, y - 26, bx + 150, y], fill=(230, 180, 60, 255), outline=(150, 110, 20, 255))
        d.ellipse([bx + 55, 950 - bh - 40, bx + 95, 950 - bh], fill=(255, 230, 140, 255))
    pts = [(80, 880), (300, 800), (420, 840), (650, 620), (780, 660), (1000, 380)]  # سهم صاعد
    d.line(pts, fill=(80, 255, 140, 255), width=10, joint="curve")
    d.polygon([(1000, 380), (940, 380), (1000, 440)], fill=(80, 255, 140, 255))
    for _ in range(30):  # عملات طائرة
        x, y = rng.randint(60, W - 60), rng.randint(150, 600)
        d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=(240, 200, 90, 200))
    return glow_spot(img, W // 2, CY, 300, (255, 210, 100), 70)




def p_earth(img, rng):
    """كوكب الأرض: رخام أزرق + غيوم + قمر."""
    img = stars(img, rng, 200)
    d = ImageDraw.Draw(img)
    cx, cy, r = W // 2, CY, 210
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(30, 90, 200, 255))
    d.ellipse([cx - r + 40, cy - r + 30, cx + r - 60, cy + r - 90], fill=(40, 140, 80, 200))  # يابسة
    d.ellipse([cx - r + 90, cy - 40, cx + r - 30, cy + 90], fill=(50, 150, 90, 180))
    for _ in range(12):  # غيوم
        x, y = rng.randint(cx - r, cx + r - 120), rng.randint(cy - r, cy + r - 30)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([x, y, x + rng.randint(70, 140), y + rng.randint(16, 30)],
                                     fill=(255, 255, 255, 130))
        img = Image.alpha_composite(img.convert("RGBA"), layer)
        d = ImageDraw.Draw(img)
    d.arc([cx - r, cy - r, cx + r, cy + r], 200, 340, fill=(150, 220, 255, 255), width=6)  # لمعة
    mx, my = cx + 280, cy - 260  # قمر صغير
    d.ellipse([mx - 45, my - 45, mx + 45, my + 45], fill=(220, 220, 230, 255))
    d.ellipse([mx - 25, my - 45, mx + 55, my + 35], fill=(10, 14, 30, 255))
    img = ring(img, cx, cy, r + 40, (100, 180, 255), 2, 90)
    return glow_spot(img, cx, cy, 330, (60, 130, 255), 80)

def p_cosmic(img, rng):
    """الافتراضي الكوني — جميل دائماً."""
    img = stars(img, rng, 200)
    img = glow_spot(img, W // 2 - 200, 400, 260, (150, 60, 255), 70)
    img = glow_spot(img, W // 2 + 200, 700, 300, (255, 50, 90), 80)
    img = ring(img, W // 2, CY, 240, (255, 60, 60), 5, 170)
    img = ring(img, W // 2, CY, 150, (255, 200, 120), 3, 130)
    img = glow_spot(img, W // 2, CY, 90, (255, 240, 230), 200)
    return img


# ---------------- التوجيه بالكلمات ----------------
MOTIFS = [
    (("شمس", "sun", "solar", "نجم"), p_sun, ((15, 5, 5), (60, 20, 8))),
    (("قمر", "moon", "lunar"), p_moon, ((5, 5, 12), (20, 20, 40))),
    (("ثقب", "black hole", "blackhole"), p_blackhole, ((5, 4, 8), (30, 12, 30))),
    (("مجر", "galaxy", "كون", "universe", "فضاء", "space", "نجوم"), p_galaxy, ((6, 4, 14), (24, 10, 44))),
    (("دماغ", "brain", "عصب", "neuron", "ذاكرة", "memory", "عقل"), p_neurons, ((10, 4, 8), (40, 12, 24))),
    (("قلب", "heart"), p_heart, ((12, 4, 6), (45, 10, 18))),
    (("dna", "جين", "حمض", "وراث"), p_dna, ((6, 8, 12), (20, 30, 50))),
    (("محيط", "ocean", "ماء", "water", "موج", "بحر", "sea", "نهر"), p_waves, ((4, 10, 18), (8, 30, 60))),
    (("برق", "lightning", "صاعقة", "رعد", "عاصفة"), p_lightning, ((8, 8, 14), (25, 25, 45))),
    (("شجر", "tree", "غاب", "forest", "نبات", "زهر"), p_tree, ((4, 12, 6), (12, 40, 22))),
    (("نحل", "bee", "عسل", "honey", "خلي"), p_honeycomb, ((14, 10, 4), (50, 35, 12))),
    (("أخطبوط", "octopus"), p_tentacles, ((12, 5, 14), (40, 15, 50))),
    (("هرم", "pyramid", "فرعون", "pharaoh", "أثر"), p_pyramids, ((16, 10, 5), (55, 35, 15))),
    (("أرض", "earth", "كوكب", "planet", "world"), p_earth, ((4, 8, 18), (10, 25, 55))),
    (("روبوت", "robot", "ذكاء", "ai", "حاسوب", "computer", "شريحة", "chip"), p_robot, ((5, 10, 16), (15, 35, 60))),
    (("دائرة", "circuit", "كهرب", "electric", "طاق", "energy"), p_circuits, ((4, 12, 10), (12, 40, 34))),
    (("مستقبل", "future", "2099", "مدينة", "city", "مريخ", "mars", "طائر"), p_city, ((8, 6, 16), (30, 18, 55))),
    (("مال", "money", "دولار", "dollar", "ذهب", "gold", "ثراء", "bank", "بن", "سهم", "اقتصاد"), p_money, ((12, 10, 4), (45, 35, 14))),
    (("نمل", "ant"), None, ((12, 8, 4), (45, 28, 14))),
]


def detect(context: str):
    ctx = context.lower()
    for keys, painter, palette in MOTIFS:
        if painter and any(k in ctx for k in keys):
            return painter, palette
    return p_cosmic, ((8, 4, 10), (30, 12, 32))


def paint_scene(context_text: str, seed: int = 0, rays_color=(255, 60, 60)) -> Image.Image:
    """يرسم المشهد العلوي كاملاً (خلفية + موتيف + مؤثرات روحية)."""
    rng = random.Random(seed)
    painter, (top, bottom) = detect(context_text)
    img = vgrad(top, bottom).convert("RGBA")
    img = painter(img, rng)
    img = god_rays(img, rng, color=rays_color)
    img = particles(img, rng)
    img = mist(img, rng)
    return img.convert("RGB")
