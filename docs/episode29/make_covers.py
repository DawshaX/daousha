#!/usr/bin/env python3
"""غلافا AR/EN للحلقة 29 — خلفية city.mp4 (برج مدينة خيال علمي ليلي) + نصوص عريضة."""
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE = '/home/ubuntu/daousha/docs/episode29'
AR_FONT = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'
EN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# إطار من منتصف city.mp4 (برج خيال علمي واضح)
subprocess.run(['ffmpeg', '-y', '-ss', '3', '-i', f'{BASE}/clips/robots.mp4', '-frames:v', '1',
                '-vf', 'scale=1080:1920',
                f'{BASE}/v2/cover_bg.png', '-loglevel', 'error'], check=True)

def draw_text(d, img, text, font_path, size, y, color=(255, 255, 255, 255)):
    f = ImageFont.truetype(font_path, size)
    bbox = d.textbbox((0, 0), text, font=f, direction='rtl')
    w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
    d.text(((img.width-w)//2 - bbox[0]+3, y - bbox[1]+3), text, font=f, fill=(0, 0, 0, 170), direction='rtl')
    d.text(((img.width-w)//2 - bbox[0], y - bbox[1]), text, font=f, fill=color, direction='rtl')
    return y + h + 28

def make_cover(out_path, ar_big, ar_small, en_big, en_small):
    img = Image.open(f'{BASE}/v2/cover_bg.png').convert('RGB')
    dark = Image.new('RGB', img.size, (0, 0, 0))
    img = Image.blend(img, dark, 0.40)
    d = ImageDraw.Draw(img)
    # تدرج من المنتصف للأسفل
    grad = Image.new('L', (1, img.height), 0)
    gd = ImageDraw.Draw(grad)
    for y in range(img.height):
        gd.point((0, y), int(200 * max(0, (y - img.height*0.5)) / (img.height*0.5)))
    black = Image.new('RGB', img.size, (0, 0, 0))
    img = Image.composite(black, img, grad.resize(img.size))
    d = ImageDraw.Draw(img)
    y = draw_text(d, img, ar_big, AR_FONT, 96, int(img.height*0.12))
    y = draw_text(d, img, ar_small, AR_FONT, 52, y + 12, (240, 190, 60, 255))
    y = draw_text(d, img, en_big, EN_FONT, 74, int(img.height*0.50))
    draw_text(d, img, en_small, EN_FONT, 44, y + 8, (240, 190, 60, 255))
    img.save(out_path, quality=92)
    print('saved', out_path)

make_cover(f'{BASE}/cover-ar.png', "عالم عام 2099", "3 حقائق صادمة!", "World of 2099", "3 Shocking Facts!")
make_cover(f'{BASE}/cover-en.png', "عالم عام 2099", "3 حقائق صادمة!", "World of 2099", "3 Shocking Facts!")
