#!/bin/bash
# بناء فيديو الحلقة 28 (AR وEN) عمودي 1080x1920 من مقاطع Mixkit
set -e
cd /home/ubuntu/daousha/docs/episode28
CL=clips
AUD_AR=narration28-ar.wav
AUD_EN=narration28-en.wav
FADE=0.5

mk_clip () {
  local src=$1 seg=$2 n=$3 out=$4
  ffmpeg -y -stream_loop -1 -i "$src" -ss 1 -t "$seg" \
    -vf "crop=ih*9/16:ih,scale=1080:1920,zoompan=z='min(1.0+0.0015*on,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$n:s=1080x1920:fps=30" \
    -r 30 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a none "$out" -loglevel error
  echo "clip $out done"
}

build () {
  local aud=$1 out=$2
  local AUD_D
  AUD_D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$aud")
  echo "audio: $AUD_D s"
  local SEG
  SEG=$(echo "$AUD_D / 4" | bc -l)
  local N
  N=$(echo "$SEG*30/1" | bc)

  mk_clip $CL/s7_gold.mp4 "$SEG" "$N" clip1.mp4
  mk_clip $CL/s5_diamond.mp4 "$SEG" "$N" clip2.mp4
  mk_clip $CL/s6_crystal.mp4 "$SEG" "$N" clip3.mp4
  mk_clip $CL/s2_particles.mp4 "$SEG" "$N" clip4.mp4

  ffmpeg -y -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 -i clip4.mp4 -filter_complex "\
[0:v][1:v]xfade=transition=fade:duration=$FADE:offset=$(echo "$SEG-$FADE"|bc)[v01];\
[v01][2:v]xfade=transition=fade:duration=$FADE:offset=$(echo "2*$SEG-2*$FADE"|bc)[v02];\
[v02][3:v]xfade=transition=fade:duration=$FADE:offset=$(echo "3*$SEG-3*$FADE"|bc)[vout]" \
  -map "[vout]" -r 30 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p video_noaudio.mp4 -loglevel error

  ffmpeg -y -i video_noaudio.mp4 -i "$aud" \
    -filter_complex "[1:a]afade=t=out:st=$(echo "$AUD_D-1"|bc):d=1[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$out" -loglevel error
  ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$out"
  echo "DONE: $out"
}

build "$AUD_AR" episode28-ar.mp4
build "$AUD_EN" episode28-en.mp4
