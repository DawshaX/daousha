#!/usr/bin/env python3
"""إنشاء ختم شفاف PNG: «تابع دوشة | Follow Dawsha» بخطوين منفصلين (عربي Naskh + لاتيني DejaVu)"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

F_AR = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'
F_EN = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

W, H = 1000, 130
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

f_ar = ImageFont.truetype(F_AR, 44)
f_en = ImageFont.truetype(F_EN, 34)

ar_text = 'تابع دوشة'
en_text = '| Follow Dawsha'

# عرض كل نص
bw_ar = d.textbbox((0, 0), ar_text, font=f_ar)
bw_en = d.textbbox((0, 0), en_text, font=f_en)
w_ar, w_en = bw_ar[2]-bw_ar[0], bw_en[2]-bw_en[0]

gap = 24
total = w_ar + gap + w_en
x0 = (W - total) // 2

shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.text((x0, 42), ar_text, font=f_ar, fill=(0, 0, 0, 220))
sd.text((x0 + w_ar + gap, 52), en_text, font=f_en, fill=(0, 0, 0, 220))
shadow = shadow.filter(ImageFilter.GaussianBlur(2))
img = Image.alpha_composite(img, shadow)

d = ImageDraw.Draw(img)
d.text((x0, 42), ar_text, font=f_ar, fill=(255, 255, 255, 250))
d.text((x0 + w_ar + gap, 52), en_text, font=f_en, fill=(255, 255, 255, 250))
img.save('/home/ubuntu/daousha/docs/episode28/wm.png')
print('saved', img.size)
