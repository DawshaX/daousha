#!/usr/bin/env python3
"""توليد صور PNG شفافة للكابتشنز (عربي/إنجليزي) ثم overlay بنوافذ زمنية على الفيديو.
PIL يدعم raqm للنص العربي الموزون صحيحًا."""
import subprocess, os

DIR = '/home/ubuntu/daousha/docs/episode28'
os.makedirs(f'{DIR}/v2/caps', exist_ok=True)

AR_FONT = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'
EN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

ar_captions = [
    ("ما رأيك بأغلى مادة في الكون كله؟", 0.3, 4.8),
    ("تكلف التريليونات!", 4.2, 7.8),
    ("أنا واثق أنك لم تسمع بها!", 8.0, 12.2),
    ("اسمع هذه الحقائق الثلاثة!", 12.5, 16.5),
    ("وستتغير نظرتك للعالم!", 17.0, 20.5),
    ("الحقيقة الأولى:", 20.8, 22.6),
    ("غرام واحد يتجاوز 60 تريليون دولار!", 22.8, 28.5),
    ("أغلى بكثير من أي ألماسة!", 28.5, 33.0),
    ("الحقيقة الثانية:", 33.8, 35.6),
    ("كل ما صنعته البشرية من مادة مضادة!", 35.6, 40.0),
    ("لا يملأ ملعقة شاي واحدة!", 40.0, 43.5),
    ("الحقيقة الثالثة:", 43.8, 45.6),
    ("لو تلامسا ينفجران في ومضة طاقة خالصة!", 45.6, 49.5),
    ("أنتم خير ونور من الله...", 49.5, 52.6),
    ("تابع دوشة!", 51.0, 52.6),
]
en_captions = [
    ("What is the most expensive material", 0.3, 3.5),
    ("in the entire universe?", 3.5, 5.8),
    ("Worth trillions?!", 5.8, 8.0),
    ("I'm sure you've never heard of it!", 8.0, 12.0),
    ("Listen to these three facts!", 12.0, 15.5),
    ("Fact one:", 15.5, 17.5),
    ("One gram costs over 60 trillion dollars!", 17.5, 22.5),
    ("Far pricier than any diamond!", 22.5, 26.0),
    ("Fact two:", 26.0, 28.0),
    ("All humanity's antimatter", 28.0, 31.0),
    ("would not fill a teaspoon!", 31.0, 34.0),
    ("Fact three:", 34.0, 36.0),
    ("They annihilate in a flash of pure energy!", 36.0, 40.0),
    ("You are goodness and light from God...", 40.0, 43.5),
    ("Tell me in the comments:", 43.5, 45.0),
    ("Will humanity ever harness it?", 45.0, 48.0),
    ("Follow Dawsha!", 48.0, 49.0),
]

from PIL import Image, ImageDraw, ImageFont, ImageFilter

def gen_cap(idx, text, font_path, size):
    f = ImageFont.truetype(font_path, size)
    try:
        # raqm: عرض مع دعم RTL
        bbox = ImageDraw.Draw(Image.new('RGBA', (1, 1))).textbbox((0, 0), text, font=f, direction='rtl')
    except Exception:
        bbox = ImageDraw.Draw(Image.new('RGBA', (1, 1))).textbbox((0, 0), text, font=f)
    w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
    pad = 40
    img = Image.new('RGBA', (w + pad*2, h + pad*2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # خلفية داكنة شبه شفافة (pill)
    pill = Image.new('RGBA', img.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([0, 0, img.width-1, img.height-1], radius=36, fill=(0, 0, 0, 140))
    img = Image.alpha_composite(img, pill)
    d = ImageDraw.Draw(img)
    kwargs = dict(font=f, fill=(255, 255, 255, 255))
    try:
        kwargs['direction'] = 'rtl'
    except Exception:
        pass
    d.text(((img.width - w)//2 - bbox[0], (img.height - h)//2 - bbox[1]), text, **kwargs)
    out = f'{DIR}/v2/caps/cap{idx}.png'
    img.save(out)
    return out

print('generating AR caps...')
ar_paths = []
for i, (t, s, e) in enumerate(ar_captions):
    p = gen_cap(i, t, AR_FONT, 60)
    ar_paths.append((p, s, e))
    print(f'  cap{i}: {t[:25]}... {s}-{e}')

print('generating EN caps...')
en_paths = []
for i, (t, s, e) in enumerate(en_captions):
    p = gen_cap(i+100, t, EN_FONT, 52)
    en_paths.append((p, s, e))
    print(f'  cap{i+100}: {t[:30]}... {s}-{e}')

import json
with open(f'{DIR}/v2/caps_manifest.json', 'w') as f:
    json.dump({'ar': [[p, s, e] for p, s, e in ar_paths], 'en': [[p, s, e] for p, s, e in en_paths]}, f, ensure_ascii=False)
print('manifest saved')
