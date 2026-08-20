#!/usr/bin/env python3
"""شبكة معاينة لجميع مقاطع الحلقة 29 (لقطة منتصف المقطع)."""
from PIL import Image, ImageDraw
import subprocess, os

CLIPS = ['city.mp4', 'flying.mp4', 'robots.mp4', 'hologram.mp4', 'neon.mp4',
         'scifi_city.mp4', 'android.mp4', 'neon_fut.mp4', 'drone.mp4']
DIR = '/home/ubuntu/daousha/docs/episode29'
OUT = f'{DIR}/v2/grid_all.jpg'
TMP = f'{DIR}/v2/thumb'
os.makedirs(TMP, exist_ok=True)

for f in CLIPS:
    p = f'{DIR}/clips/{f}'
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).strip())
    subprocess.run(['ffmpeg', '-y', '-ss', str(min(dur*0.45, 6)), '-i', p, '-frames:v', '1', '-vf', 'scale=220:280', f'{TMP}/{f[:-4]}.jpg', '-loglevel', 'error'])

files = [f'{TMP}/{f[:-4]}.jpg' for f in CLIPS]
per_row = 5
cols = per_row
rows = (len(files)+cols-1)//cols
W = cols*235; H = rows*310
grid = Image.new('RGB', (W, H), 'black')
d = ImageDraw.Draw(grid)
for i, fp in enumerate(files):
    im = Image.open(fp)
    x = (i % cols)*235 + 8
    y = (i // cols)*310 + 30
    grid.paste(im, (x, y))
    d.text((x, y+290), os.path.basename(fp), fill='yellow')
grid.save(OUT, quality=88)
print(OUT, grid.size)
