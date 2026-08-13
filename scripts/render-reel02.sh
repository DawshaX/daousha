#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="/home/ubuntu/webdev-static-assets"
KEYFRAME="$ASSET_DIR/xdaw-nova-reel02-keyframe.png"
MUSIC="$ASSET_DIR/xdaw-nova-reel02-music.wav"

render_reel() {
  local narration="$1"
  local subtitles="$2"
  local duration="$3"
  local output="$4"

  ffmpeg -y \
    -loop 1 -framerate 30 -i "$KEYFRAME" \
    -i "$narration" \
    -stream_loop -1 -i "$MUSIC" \
    -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.00035,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$((${duration%.*}*30+30)):s=1080x1920:fps=30,subtitles='$subtitles'[v];[2:a]volume=0.15[music];[1:a][music]amix=inputs=2:duration=first:dropout_transition=1[a]" \
    -map "[v]" -map "[a]" -t "$duration" \
    -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart \
    "$output"
}

render_reel "$ASSET_DIR/xdaw-nova-reel02-ar.wav" "$ASSET_DIR/xdaw-nova-reel02-ar.ass" "19.28" "$ASSET_DIR/xdaw-nova-reel02-ar.mp4"
render_reel "$ASSET_DIR/xdaw-nova-reel02-en.wav" "$ASSET_DIR/xdaw-nova-reel02-en.ass" "22.72" "$ASSET_DIR/xdaw-nova-reel02-en.mp4"
