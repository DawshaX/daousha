#!/usr/bin/env python3
"""بناء الحلقة 29 AR/EN: مقاطع UHD → 1080x1920 عمودي + كابتشنز PNG + ختم + موسيقى + narration."""
import subprocess, os, json
from PIL import Image, ImageDraw, ImageFont

BASE = '/home/ubuntu/daousha/docs/episode29'
CLIPS = f'{BASE}/clips'
OUT = f'{BASE}/v2'
os.makedirs(f'{OUT}/caps', exist_ok=True)
W, H, FPS = 1080, 1920, 30
AR_FONT = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'
EN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def ff(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('FF ERROR:', r.stderr[-1500:])
        raise SystemExit(1)

def norm(src, out, start, dur):
    vf = (f"trim=start={start}:duration={dur},setpts=PTS-STARTPTS,"
          f"scale={W}:{H}:force_original_aspect_ratio=increase,"
          f"crop={W}:{H},fps={FPS},format=yuv420p")
    ff(['ffmpeg', '-y', '-i', src, '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', out])

# ===== 7 مشاهد =====
def seg(i, src, start, dur):
    out = f'{OUT}/seg{i}.mp4'
    norm(f'{CLIPS}/{src}', out, start, dur)
    return out

segs = [
    seg(0, 'robots.mp4', 3, 4),          # hook روبوت خيال علمي
    seg(1, 'city.mp4', 0, 6),            # fact1 مدينة
    seg(2, 'robots.mp4', 0, 6),          # fact1 روبوت
    seg(3, 'neon_fut.mp4', 0, 6),        # fact2 هولوجرام
    seg(4, 'android.mp4', 0, 5),         # fact2 أندرويد
    seg(5, 'robots.mp4', 9, 6),          # fact3 روبوت ثانية
    seg(6, 'neon_fut.mp4', 11, 6),       # outro
]
with open(f'{OUT}/concat.txt', 'w') as f:
    for s in segs:
        f.write(f"file '{s}'\n")
ff(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/concat.txt', '-c', 'copy', f'{OUT}/base.mp4'])
TOTAL = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0', f'{OUT}/base.mp4']).strip())
print('base.mp4 total', round(TOTAL, 1))

# ===== كابتشنز =====
AR_CAPS = [
    ("ما رأيك بعالم عام 2099؟", 0.3, 6.7),
    ("الحقيقة الأولى:", 12.1, 14.0),
    ("مدن كاملة تحت قباب زجاجية!", 14.0, 18.5),
    ("تُبنى في الصحراء والمحيطات!", 18.5, 21.8),
    ("الحقيقة الثانية:", 21.8, 23.5),
    ("السيارات الطائرة ستظهر قريبًا!", 23.5, 27.0),
    ("ستملأ السماء فوق رأسك كل صباح!", 27.0, 30.5),
    ("الحقيقة الثالثة:", 30.5, 32.0),
    ("روبوتات ذكية تحميك وتخدمك!", 32.0, 36.0),
    ("وتعتني بكبار السن أيضًا!", 36.0, 38.7),
    ("أنتم خير ونور من الله", 38.7, 41.6),
    ("هل تتخيل نفسك في مدينة 2099؟", 41.6, 45.5),
    ("أخبرني في التعليقات!", 45.5, 48.9),
    ("تابع دوشة!", 48.9, min(TOTAL, 51.0)),
]
EN_CAPS = [
    ("What do you think of 2099?", 0.3, 2.4),
    ("Listen to these three facts!", 5.2, 9.3),
    ("Fact one:", 9.3, 10.6),
    ("Cities under giant glass domes!", 10.6, 13.5),
    ("Built in deserts and oceans!", 13.5, 16.1),
    ("Fact two:", 16.1, 17.2),
    ("Flying cars fill the sky!", 17.2, 19.5),
    ("Above your head every morning!", 19.5, 21.9),
    ("Fact three:", 21.9, 23.0),
    ("Smart robots serve and protect you!", 23.0, 25.5),
    ("They care for the elderly too!", 25.5, 27.8),
    ("You are goodness and light from God", 27.8, 30.5),
    ("Imagine yourself in a 2099 city!", 30.5, 34.2),
    ("Tell me in the comments!", 34.2, 36.4),
    ("Follow Dawsha!", 36.4, min(TOTAL, 38.5)),
]

def gen_cap(idx, text, font_path, size):
    f = ImageFont.truetype(font_path, size)
    bbox = ImageDraw.Draw(Image.new('RGBA', (1, 1))).textbbox((0, 0), text, font=f, direction='rtl')
    w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
    pad = 40
    img = Image.new('RGBA', (w + pad*2, h + pad*2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pill = Image.new('RGBA', img.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([0, 0, img.width-1, img.height-1], radius=36, fill=(0, 0, 0, 140))
    img = Image.alpha_composite(img, pill)
    d = ImageDraw.Draw(img)
    d.text(((img.width - w)//2 - bbox[0], (img.height - h)//2 - bbox[1]), text, font=f, fill=(255, 255, 255, 255), direction='rtl')
    out = f'{OUT}/caps/cap{idx}.png'
    img.save(out)
    return out

manifest = {}
for lang, caps, font, sz in [('ar', AR_CAPS, AR_FONT, 60), ('en', EN_CAPS, EN_FONT, 52)]:
    paths = []
    for i, (t, s, e) in enumerate(caps):
        p = gen_cap(i + (0 if lang == 'ar' else 100), t, font, sz)
        paths.append([p, s, e])
    manifest[lang] = paths
with open(f'{OUT}/caps_manifest.json', 'w') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)
print('caps generated:', {k: len(v) for k, v in manifest.items()})

# ===== overlay + ختم =====
for lang in ('ar', 'en'):
    inputs = [f'{OUT}/base.mp4', f'{BASE}/../episode28/wm.png'] + [p for p, s, e in manifest[lang]]
    fc = ['[1:v]format=rgba,scale=500:-1[wm]']
    for i in range(len(manifest[lang])):
        fc.append(f'[{2+i}:v]format=rgba,scale=1000:-1[c{i}]')
    prev = '[0:v]'
    for i in range(len(manifest[lang])):
        s, e = manifest[lang][i][1], manifest[lang][i][2]
        nxt = f'[tmp{i}]' if i < len(manifest[lang]) - 1 else '[vtmp]'
        fc.append(f"{prev}[c{i}]overlay=40:200:enable='between(t,{s},{e})'{nxt}")
        prev = nxt
    fc.append('[vtmp][wm]overlay=55:H-h-60[v]')
    ff(['ffmpeg', '-y'] + [item for pair in (['-i', x] for x in inputs) for item in pair] +
       ['-filter_complex', ';'.join(fc), '-map', '[v]',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-r', '30',
        f'{OUT}/sub_{lang}.mp4', '-loglevel', 'error'])
    # الصوت النهائي
    dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0', f'{OUT}/sub_{lang}.mp4']).strip())
    ff(['ffmpeg', '-y', '-i', f'{OUT}/sub_{lang}.mp4', '-i', f'{BASE}/narration29-{lang}.wav',
        '-filter_complex',
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.75[a1];"
        f"anoisesrc=color=pink:duration={dur}:sample_rate=44100,lowpass=f=200,volume=0.18[mus];"
        f"[a1][mus]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]",
        '-map', '0:v', '-map', '[aout]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
        f'{OUT}/episode29-{lang}-v2.mp4', '-loglevel', 'error'])
    print('FINAL', lang)
print('ALL DONE')
