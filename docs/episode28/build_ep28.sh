#!/bin/bash
# بناء فيديوهي ep28 (AR + EN) — 1080x1920 (9:16)، مونتاج حقيقي بمشاهد مخزون
# الاستخدام: ./build_ep28.sh <lang>   lang: ar أو en
set -e
cd /home/ubuntu/test_run/episode28
LANG=$1
SRC=src
DUR_D="docs"
AUD=""
for cand in "episode28-$LANG.wav" "narration28-$LANG.wav" "/home/ubuntu/test_run/episode28/episode28-$LANG.wav" "/home/ubuntu/test_run/episode28/narration28-$LANG.wav"; do
  if [ -f "$cand" ]; then AUD="$cand"; break; fi
done
if [ ! -f "$AUD" ]; then echo "AUDIO_NOT_FOUND for $LANG"; exit 1; fi
OUT="episode28-$LANG.mp4"

AUD_D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUD")
echo "lang $LANG | audio: $AUD_D"

# --- توزيع المشاهد على 4 شرائح (كل مشهد ~ AUD_D/4) ---
# AR: scene1 matter_antimatter، scene2 diamond_gold (ثمن الغرام)، scene3 gold_glitter (الملعقة)، scene4 energy_explosion (الانفجار+خاتمة)
# EN: scene1 particle_tracks، scene2 gold_explosion، scene3 antimatter_glow، scene4 nebula_particles (خاتمة)
case $LANG in
  ar)
    S1="$SRC/matter_antimatter.jpg"; TXT1='أغلى مادة في الكون...
60 تريليون دولار للغرام!'
    S2="$SRC/diamond_gold.jpg"; TXT2='غرام واحد...
أغلى من أي ألماسة!'
    S3="$SRC/gold_glitter_vert.jpg"; TXT3='كل ما صنعته البشرية
لا يملأ ملعقة!'
    S4="$SRC/energy_explosion_blue.jpg"; TXT4='ملايين الجسيمات
تعبرك الآن!

تابع دوشة'
    ;;
  en)
    S1="$SRC/particle_tracks.jpg"; TXT1='The Rarest Material on Earth
$60 Trillion per Gram!'
    S2="$SRC/gold_explosion.jpg"; TXT2='One Gram Outweighs
Any Diamond!'
    S3="$SRC/antimatter_glow.jpg"; TXT3="All of Humanity's Output
Fits in a Teaspoon!"
    S4="$SRC/nebula_particles_vert.jpg"; TXT4='Millions of particles
pass through you NOW!

Follow Dawsha'
    ;;
  *) echo "BAD_LANG"; exit 1 ;;
esac

SEG=$(echo "$AUD_D / 4" | bc -l)
mk_clip () {
  local src=$1 out=$2 mode=$3 txt=$4
  case $mode in
    zin)  FILTER="zoompan=z='min(1.0+0.0015*on,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30" ;;
    zout) FILTER="zoompan=z='max(1.25-0.0015*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30" ;;
    pan)  FILTER="zoompan=z='1.25':x='(iw-iw/zoom)*0.5*(on/(0.01*ON_D))':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30" ;;
  esac
  local total_frames
  total_frames=$(echo "$SEG * 30" | bc -l | cut -d. -f1)
  FILTER=${FILTER//ON_D/$total_frames}
  # إضافة نص نيون أحمر هاكر تحت النص الرئيسي (خلفية معتمة في منطقة النص)
  FONT_BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
  FONT_AR="/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf"
  ESCAPED=$(echo "$txt" | sed 's/\\\\/\\\\\\\\/g; s/%/%%/g; s/:/\\\\:/g')
  DRAW="drawbox=x=40:y=520:w=1000:h=280:color=black@0.55:t=fill,"
  DRAW="$DRAW""drawtext=fontfile=$FONT_BOLD:text='$ESCAPED':fontcolor=white:fontsize=64:box=1:boxcolor=black@0.4:x=(w-text_w)/2:y=540,"
  DRAW="$DRAW""drawtext=fontfile=$FONT_BOLD:text='XDAW | XDAWNOVA':fontcolor=0xFF0000:fontsize=30:box=1:boxcolor=black@0.55:x=(w-text_w)/2:y=830:shadowcolor=black:shadowx=2:shadowy=2"
  ffmpeg -y -loop 1 -i "$src" -vf "$FILTER,$DRAW" -t "$SEG" -r 30 -pix_fmt yuv420p -c:v libx264 -preset medium -crf 20 "$out" -loglevel error
  echo "clip done: $out"
}
mk_clip "$S1" c1.mp4 zin  "$TXT1"
mk_clip "$S2" c2.mp4 zout "$TXT2"
mk_clip "$S3" c3.mp4 pan  "$TXT3"
mk_clip "$S4" c4.mp4 zin  "$TXT4"

FADE=0.5
ffmpeg -y \
  -i c1.mp4 -i c2.mp4 -i c3.mp4 -i c4.mp4 \
  -filter_complex "\
[0:v][1:v]xfade=transition=fade:duration=$FADE:offset=$(echo "$SEG-$FADE"|bc)[v01];\
[v01][2:v]xfade=transition=fade:duration=$FADE:offset=$(echo "2*$SEG-2*$FADE"|bc)[v02];\
[v02][3:v]xfade=transition=fade:duration=$FADE:offset=$(echo "3*$SEG-3*$FADE"|bc)[vout]" \
  -map "[vout]" -r 30 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p video_noaudio.mp4 -loglevel error

# مزج التعليق الصوتي مع موسيقى خلفية هادئة (synth ambient مولدة بـ ffmpeg إن لم توجد موسيقى)
if [ ! -f bg_music.mp3 ]; then
  echo "generating soft ambient bg music..."
  ffmpeg -y -f lavfi -i "sine=frequency=220:duration=$AUD_D" -f lavfi -i "sine=frequency=330:duration=$AUD_D" \
    -filter_complex "[0:a][1:a]amix=inputs=2:normalize=0,lowpass=f=600,volume=0.35,afade=t=in:st=0:d=2,afade=t=out:st=$(echo "$AUD_D-3"|bc):d=3" \
    -ac 2 -ar 48000 bg_music.mp3 -loglevel error
fi
ffmpeg -y -i video_noaudio.mp4 -i "$AUD" -i bg_music.mp3 \
  -filter_complex "[1:a]afade=t=out:st=$(echo "$AUD_D-1"|bc):d=1[nar];[2:a]volume=0.18[mus];[nar][mus]amix=inputs=2:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT" -loglevel error
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
echo "DONE: $OUT"
