#!/usr/bin/env python3
"""رسم الكابتشنز عبر ffmpeg drawtext مع توقيتات per-caption بدل ass (libass لا يرسم النص).
drawtext يدعم النص العربي إذا كان ffmpeg مربوطًا بـ libraqm — نتحقق أولًا.
إذا لم يدعم، نستخدم PIL لتوليد صور captions شفافة ونعرضها overlay مع توقيتات."""
import subprocess, os, sys

AR_FONT = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'
EN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
DIR = '/home/ubuntu/daousha/docs/episode28'

# اختبار دعم raqm
test = subprocess.run(['ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=1080x1920:d=1',
                       '-vf', f"drawtext=fontfile={AR_FONT}:text='اختبار عربي':fontsize=80:fontcolor=white:x=100:y=100",
                       '-frames:v', '1', '-loglevel', 'error', f'{DIR}/v2/raqm_test.jpg']).returncode
print('drawtext arabic rc =', test)
# فحص اللقطة
if os.path.exists(f'{DIR}/v2/raqm_test.jpg'):
    from PIL import Image
    im = Image.open(f'{DIR}/v2/raqm_test.jpg')
    im.crop((0, 0, 1080, 600)).save(f'{DIR}/v2/raqm_test_top.jpg', quality=90)
    print('saved test image')
