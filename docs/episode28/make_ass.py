#!/usr/bin/env python3
"""إعادة توليد ملفات ass بالاسم الصحيح للعائلة وفونت حجم أكبر"""
import subprocess

DIR = '/home/ubuntu/daousha/docs/episode28'
fams = 'Noto Naskh Arabic'
fams_en = 'DejaVu Sans'
print('family:', fams, '| family en:', fams_en)

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

for lang, caps, fam in [('ar', ar_captions, fams), ('en', en_captions, fams_en)]:
    lines = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', '',
             '[V4+ Styles]',
             'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
             f'Style: cap,{fam},64,&H00FFFFFF,&H000000FF,&H00202020,&H80000000,-1,0,0,0,100,100,1,0,1,4,3,2,40,40,100,1',
             '', '[Events]',
             'Format: Layer, Start, End, Style, Text, MarginL, MarginR, MarginV, Effect']
    for t, s, e in caps:
        lines.append(f'Dialogue: 0,{fmt(s)},{fmt(e)},cap,,40,40,100,,{t}')
    out = f'{DIR}/v2/caps_{lang}.ass'
    with open(out, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('wrote', out)
