#!/usr/bin/env bash
set -euo pipefail

font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
evolution='/home/ubuntu/screenshots/webdev-preview-evolution-1786701036114751613-8355.png'
settings='/home/ubuntu/screenshots/webdev-preview-settings-1786698755009882041-7111.png'
review='/home/ubuntu/screenshots/webdev-preview-review-1786698755190655905-8691.png'
output='/home/ubuntu/webdev-static-assets/xdawnova-tiktok-review-demo-sandbox-live.mp4'

mkdir -p /home/ubuntu/webdev-static-assets

ffmpeg -y \
  -loop 1 -t 12 -i "$evolution" \
  -loop 1 -t 12 -i "$settings" \
  -loop 1 -t 12 -i "$review" \
  -filter_complex "
    [0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,
      drawbox=x=0:y=0:w=iw:h=102:color=black@0.78:t=fill,
      drawtext=fontfile=${font}:text='XDAW NOVA — TikTok Sandbox Live Evidence':fontcolor=white:fontsize=31:x=50:y=22,
      drawtext=fontfile=${font}:text='1. OAuth succeeded and Reel 02 created an Inbox Draft only.':fontcolor=0xff5a66:fontsize=24:x=50:y=62[s0];
    [1:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,
      drawbox=x=0:y=0:w=iw:h=102:color=black@0.78:t=fill,
      drawtext=fontfile=${font}:text='XDAW NOVA — OAuth Isolation':fontcolor=white:fontsize=31:x=50:y=22,
      drawtext=fontfile=${font}:text='2. Sandbox is isolated from production; tokens remain server-side.':fontcolor=0xff5a66:fontsize=24:x=50:y=62[s1];
    [2:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,
      drawbox=x=0:y=0:w=iw:h=102:color=black@0.78:t=fill,
      drawtext=fontfile=${font}:text='XDAW NOVA — Guarded Publishing':fontcolor=white:fontsize=31:x=50:y=22,
      drawtext=fontfile=${font}:text='3. Rights, safety, preview, and owner confirmation gate every action.':fontcolor=0xff5a66:fontsize=24:x=50:y=62[s2];
    [s0][s1][s2]concat=n=3:v=1:a=0,format=yuv420p[v]" \
  -map '[v]' -r 30 -movflags +faststart -c:v libx264 -crf 22 -preset medium "$output"

printf 'Rendered %s\n' "$output"
