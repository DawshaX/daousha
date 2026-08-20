#!/usr/bin/env python3
"""تطبيق الكابتشنز (PNG overlay بنوافذ زمنية) + ختم wm.png على base_ar/en.mp4، ثم خلط الصوت النهائي.
المخرج: episode28-ar-v2.mp4 / episode28-en-v2.mp4"""
import json, subprocess, os

DIR = '/home/ubuntu/daousha/docs/episode28'
with open(f'{DIR}/v2/caps_manifest.json') as f:
    manifest = json.load(f)

def build(lang, dur):
    inputs = [f'{DIR}/v2/base_{lang}.mp4', f'{DIR}/wm.png']
    for p, s, e in manifest[lang]:
        inputs.append(p)

    fc = []
    fc.append('[1:v]format=rgba,scale=500:-1[wm]')
    # كابتشنز بنوافذ زمنية
    for i, (p, s, e) in enumerate(manifest[lang]):
        fc.append(f'[{2+i}:v]format=rgba,scale=1000:-1[c{i}]')
    # سلسلة overlay للكابتشنز: كل كابتشن يظهر في نافذته
    prev = '[0:v]'
    for i, (p, s, e) in enumerate(manifest[lang]):
        out = f'[tmp{i}]' if i < len(manifest[lang])-1 else '[vtmp]'
        fc.append(f"{prev}[c{i}]overlay=40:200:enable='between(t,{s},{e})'{out}")
        prev = out
    fc.append('[vtmp][wm]overlay=55:H-h-60[v]')

    cmd = ['ffmpeg', '-y']
    for inp in inputs:
        cmd += ['-i', inp]
    cmd += ['-filter_complex', ';'.join(fc), '-map', '[v]',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-r', '30',
            f'{DIR}/v2/sub_{lang}.mp4', '-loglevel', 'error']
    r = subprocess.run(cmd)
    if r.returncode != 0:
        raise SystemExit(f'overlay failed for {lang}')
    print('sub done', lang)

build('ar', 52.7)
build('en', 47.2)

# خلط الصوت النهائي
def mix_audio(lang, dur):
    cmd = ['ffmpeg', '-y', '-i', f'{DIR}/v2/sub_{lang}.mp4', '-i', f'{DIR}/narration28-{lang}.wav',
           '-filter_complex',
           f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.75[a1];"
           f"anoisesrc=color=pink:duration={dur}:sample_rate=44100,lowpass=f=200,volume=0.18[mus];"
           f"[a1][mus]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]",
           '-map', '0:v', '-map', '[aout]',
           '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
           f'{DIR}/episode28-{lang}-v2.mp4', '-loglevel', 'error']
    r = subprocess.run(cmd)
    if r.returncode != 0:
        raise SystemExit(f'mix failed for {lang}')
    print('final done', lang)

mix_audio('ar', 52.7)
mix_audio('en', 47.2)
print('ALL DONE')
