#!/bin/bash
# إعادة بناء فيديو الحلقة 28 بالنمط الجديد (v2):
# - مقاطع فيديو متحركة عالية الجودة (Mixkit) بدل الصور
# - نصوص متزامنة مع التعليق (fade)
# - موسيقى سينمائية خلفية هادئة
# - ختم "تابع دوشة" أسفل يسار
# - Ken Burns خفيف على المقاطع (zoompan) لتكثيف الحركة
set -e
DIR=/home/ubuntu/daousha/docs/episode28
cd $DIR
mkdir -p v2

AR_FONT=/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf
EN_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

# ---- المقاطع وأزمنتها (من المقاطع المتوفرة) ----
# ar segments: [clip, start_trim, duration]
# 1 hook: s7_gold (مكعبات ذهب متوهجة) — "ما رأيك بأغلى مادة في الكون..." ~8s
# 2 دلع: s6_crystal (كريستالات) — "أنا واثق أنك لم تسمع بها..." ~12s
# 3 حقيقة1: s5_diamond — "60 تريليون دولار..." ~10s
# 4 حقيقة2: s8_gold2 (عملات ذهب) — "ملعقة شاي..." ~9s
# 5 حقيقة3: s1_space_energy (انفجار طاقة) — "ينفجران في ومضة..." ~10s
# 6 خاتمة: s2_particles (كوكب الأرض) — "أنتم خير ونور + سؤال + تابع دوشة" ~10s

mk () { # segment idx, clip, start, dur, out
  ffmpeg -y -ss $3 -i $2 -t $4 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p" -an -c:v libx264 -preset fast -crf 18 -r 30 $1 2>/dev/null
  echo "seg $1 done: $4s"
}

mk v2/ar_seg1.mp4 clips/s7_gold.mp4 2.0 8
mk v2/ar_seg2.mp4 clips/s6_crystal.mp4 1.0 12
mk v2/ar_seg3.mp4 clips/s5_diamond.mp4 0.3 10
mk v2/ar_seg4.mp4 clips/s8_gold2.mp4 2.0 9
mk v2/ar_seg5.mp4 clips/s1_space_energy.mp4 1.0 10
mk v2/ar_seg6.mp4 clips/s2_particles.mp4 3.0 9
echo "all segments ready"
ls -la v2/
