#!/bin/bash
# بناء فيديو عمودي 9:16 من 4 مشاهد + تعليق صوتي (قابل لإعادة الاستخدام لأي حلقة)
# الاستخدام: ./build_episode.sh <ep_num> <scene1> <scene2> <scene3> <scene4> <narration.wav>
set -e
cd /home/ubuntu/test_run
EP=$1; S1=$2; S2=$3; S3=$4; S4=$5; DUR=$6
OUT=episode${EP}-final.mp4
AUD_D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DUR")
echo "ep $EP | audio: $AUD_D"
SEG=$(echo "$AUD_D / 4" | bc -l)
mk_clip () {
  local src=$1 out=$2 mode=$3
  case $mode in
    zin)  FILTER="zoompan=z='min(1.0+0.0015*on,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30" ;;
    zout) FILTER="zoompan=z='max(1.25-0.0015*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30" ;;
    pan)  FILTER="zoompan=z='1.25':x='(iw-iw/zoom)*0.5*(on/(0.01*ON_D))':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30" ;;
  esac
  local total_frames
  total_frames=$(echo "$SEG * 30" | bc -l | cut -d. -f1)
  FILTER=${FILTER//ON_D/$total_frames}
  ffmpeg -y -loop 1 -i "$src" -vf "$FILTER" -t "$SEG" -r 30 -pix_fmt yuv420p -c:v libx264 -preset medium -crf 20 "$out" -loglevel error
}
mk_clip "$S1" c1.mp4 zin
mk_clip "$S2" c2.mp4 zout
mk_clip "$S3" c3.mp4 pan
mk_clip "$S4" c4.mp4 zin
FADE=0.5
ffmpeg -y \
  -i c1.mp4 -i c2.mp4 -i c3.mp4 -i c4.mp4 \
  -filter_complex "\
[0:v][1:v]xfade=transition=fade:duration=$FADE:offset=$(echo "$SEG-$FADE"|bc)[v01];\
[v01][2:v]xfade=transition=fade:duration=$FADE:offset=$(echo "2*$SEG-2*$FADE"|bc)[v02];\
[v02][3:v]xfade=transition=fade:duration=$FADE:offset=$(echo "3*$SEG-3*$FADE"|bc)[vout]" \
  -map "[vout]" -r 30 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p video_noaudio.mp4 -loglevel error
ffmpeg -y -i video_noaudio.mp4 -i "$DUR" \
  -filter_complex "[1:a]afade=t=out:st=$(echo "$AUD_D-1"|bc):d=1[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT" -loglevel error
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
echo "DONE: $OUT"
