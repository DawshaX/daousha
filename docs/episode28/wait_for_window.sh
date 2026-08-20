#!/bin/bash
# انتظر حتى 16:17 UTC ثم اعلم
while true; do
  h=$(date -u +%H); m=$(date -u +%M)
  hm=$((10#$h*60 + 10#$m))
  if [ $hm -ge 977 ]; then  # 16*60+17 = 977
    date -u
    echo "WINDOW_OPEN"
    exit 0
  fi
  sleep 120
done
