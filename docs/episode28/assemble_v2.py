#!/usr/bin/env python3
"""تجميع فيديو الحلقة 28 v2 (مصحح):
- أزمنة المقاطع الحقيقية: 8, 12, 4.67, 9, 10, 9 → مجموع 52.67s
- كابتشنز ass متزامنة مع transcription حتى 52.7s
- ختم wm.png أسفل يسار + captions
- موسيقى drone هادئة + صوت التعليق
"""
import subprocess, os

DIR = '/home/ubuntu/daousha/docs/episode28'
os.makedirs(f'{DIR}/v2', exist_ok=True)

AR_FONT = '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf'
EN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# أزمنة بداية كل مقطع (تراكمية بالمدة الحقيقية)
# seg1: 0-8, seg2: 8-20, seg3: 20-24.67, seg4: 24.67-33.67, seg5: 33.67-43.67, seg6: 43.67-52.67
seg_starts = [0, 8, 20, 24.67, 33.67, 43.67]

# من transcription AR:
# 0.3-4.8 hook | 4.8-12.8 دلع | 12.8-23.4 حقيقة1 | 23.4-32.6 حقيقة2 | 32.6-42.6 حقيقة3 | 42.6-45.4 خير ونور | 45.4-47.7 تعليقات | 47.7-55.1 سؤال | 55.1-56.8 تابع دوشة
# الفيديو 52.67s فقط → نضغط: نحذف الفواصل الطويلة بنطق طبيعي، ونطابق الكابتشنز مع الفيديو
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
    ("هل ستستخدم البشرية هذه الطاقة؟", 49.5, 52.6),
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

def fmt(x):
    return f'{int(x//60):d}:{int(x%60):02d}.{int((x%1)*100):02d}'

def ass_for(captions, font):
    lines = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', '',
             '[V4+ Styles]',
             'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
             f'Style: cap,{os.path.basename(font)},56,&H00FFFFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,1,0,1,4,2,4,60,60,150,1',
             '', '[Events]',
             'Format: Layer, Start, End, Style, Text, MarginL, MarginR, MarginV, Effect']
    for t, s, e in captions:
        lines.append(f'Dialogue: 0,{fmt(s)},{fmt(e)},cap,,60,60,150,,{t}')
    return '\n'.join(lines) + '\n'

def assemble(lang, captions, font, audio, out, total):
    concat = '\n'.join(f"file '{DIR}/v2/ar_seg{i+1}.mp4'" for i in range(6))
    with open(f'{DIR}/v2/concat_{lang}.txt', 'w') as f:
        f.write(concat)
    subprocess.run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', f'{DIR}/v2/concat_{lang}.txt',
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-r', '30',
                    '-an',
                    f'{DIR}/v2/base_{lang}.mp4'], check=True, capture_output=True)

    ass_path = f'{DIR}/v2/caps_{lang}.ass'
    with open(ass_path, 'w') as f:
        f.write(ass_for(captions, font))

    subprocess.run(['ffmpeg', '-y', '-i', f'{DIR}/v2/base_{lang}.mp4',
                    '-i', f'{DIR}/wm.png',
                    '-filter_complex',
                    f'[1:v]format=rgba,scale=620:-1[wm];[0:v][wm]overlay=55:H-h-60,ass={ass_path}[vw]',
                    '-map', '[vw]',
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-r', '30',
                    f'{DIR}/v2/sub_{lang}.mp4'], check=True, capture_output=True)

    subprocess.run(['ffmpeg', '-y',
                    '-i', f'{DIR}/v2/sub_{lang}.mp4', '-i', audio,
                    '-filter_complex',
                    f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.75[a1];"
                    f"anoisesrc=color=pink:duration={total}:sample_rate=44100,lowpass=f=200,volume=0.18[mus];"
                    f"[a1][mus]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]",
                    '-map', '0:v', '-map', '[aout]',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
                    out], check=True, capture_output=True)
    print('assembled:', out)

assemble('ar', ar_captions, AR_FONT, f'{DIR}/narration28-ar.wav', f'{DIR}/episode28-ar-v2.mp4', 52.7)
assemble('en', en_captions, EN_FONT, f'{DIR}/narration28-en.wav', f'{DIR}/episode28-en-v2.mp4', 49.0)
