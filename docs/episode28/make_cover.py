#!/usr/bin/env python3
"""بناء غلاف الحلقة 28 (AR+EN) بنمط ep26: خلفية سينمائية داكنة + نص عريض أبيض.
الخلفية: إطار عالي الجودة من مقطع Mixkit (الذهب s7 أو s8 أو s1 الانفجار) مع تظليل علوي قوي.
النص: خط عربي/إنجليزي عريض أبيض في الثلث العلوي."""
import subprocess, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

DIR = '/home/ubuntu/daousha/docs/episode28'
OUT_DIR = DIR
AR_FONT = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'  # fallback below

def find_font(prefs):
    for p in prefs:
        if os.path.exists(p):
            return p
    # search noto/nfs fonts
    for root in ['/usr/share/fonts', '/usr/local/share/fonts']:
        for r, _, fs in os.walk(root):
            for f in fs:
                if f.lower().endswith('.ttf') and ('arabic' in f.lower() or 'naskh' in f.lower()):
                    return os.path.join(r, f)
    return None

def frame_from_clip(clip, out, t=1.0):
    subprocess.run(['ffmpeg', '-y', '-ss', str(t), '-i', clip, '-frames:v', '1',
                    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
                    out], check=True, capture_output=True)

def add_glow_shadow(img):
    # تظليل علوي وسفلي قوي لإبراز النص
    overlay = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(overlay)
    for y in range(0, 700, 6):
        a = int(210 * max(0, 1 - y/700))
        d.rectangle([0, y, 1080, y+6], fill=a)
    for y in range(1620, 1920):
        a = int(160 * ((y-1620)/300))
        d.rectangle([0, y, 1080, y+1], fill=a)
    black = Image.new('RGB', img.size, (0, 0, 0))
    return Image.composite(black, img, overlay)

def render_text(text_lines, font_path, size, color=(255, 255, 255), glow=(255, 184, 40)):
    """نص أبيض عريض مع توهج ذهبي خفيف"""
    IDraw = ImageDraw.Draw
    tmp = Image.new('RGBA', (2000, 1200), (0, 0, 0, 0))
    d = IDraw(tmp)
    font = ImageFont.truetype(font_path, size)
    line_h = int(size * 1.35)
    total_h = line_h * len(text_lines)
    y = (1200 - total_h) // 2
    for line in text_lines:
        bbox = d.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        x = (2000 - w) // 2
        # توهج ذهبي (طبقات مموهة)
        glow_layer = Image.new('RGBA', tmp.size, (0, 0, 0, 0))
        gd = IDraw(glow_layer)
        gd.text((x, y), line, font=font, fill=glow + (140,))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(14))
        tmp = Image.alpha_composite(tmp, glow_layer)
        d = IDraw(tmp)
        d.text((x, y), line, font=font, fill=color + (255,))
        y += line_h
    return tmp

def make_cover(clip, t, text_lines, font_path, size, out):
    frm = f'/tmp/frm_{os.path.basename(out)}.png'
    frame_from_clip(clip, frm, t)
    img = Image.open(frm).convert('RGB')
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=80))
    img = add_glow_shadow(img)
    txt = render_text(text_lines, font_path, size)
    txt = txt.resize((1080, int(1200 * 1080/2000)), Image.LANCZOS)
    img.paste(txt, (0, 90), txt)
    img.save(out, quality=95)
    print('saved', out)

def main():
    ar_font = find_font(['/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf',
                         '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf',
                         '/usr/share/fonts/truetype/kacst/KacstBold.ttf'])
    print('ar font:', ar_font)
    en_font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    if not os.path.exists(en_font):
        import glob
        candidates = glob.glob('/usr/share/fonts/**/DejaVuSans-Bold.ttf', recursive=True)
        en_font = candidates[0] if candidates else None
    print('en font:', en_font)

    # غلاف AR: خلفية مكعبات ذهب (s7) مع انفجار طاقة (s1) كخيار
    ar_lines = ['أغلى من الماس...', 'بمليون مرة!']
    en_lines = ['A MILLION TIMES', 'MORE PRECIOUS', 'THAN DIAMOND!']
    make_cover(f'{DIR}/clips/s7_gold.mp4', 2.0, ar_lines, ar_font, 120, f'{OUT_DIR}/cover-ar.png')
    make_cover(f'{DIR}/clips/s7_gold.mp4', 2.0, en_lines, en_font, 92, f'{OUT_DIR}/cover-en.png')

if __name__ == '__main__':
    main()
