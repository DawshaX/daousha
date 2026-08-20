#!/bin/bash
# تنزيل مقاطع Mixkit المجانية لموضوع المادة المضادة (الحلقة 28)
set -e
cd /home/ubuntu/daousha/docs/episode28/clips
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0"
dl () {
  local id=$1 url=$2 out=$3
  if [ ! -s "$out" ]; then
    curl -sL -A "$UA" "$url" -o "$out" && echo "OK $out ($(du -h "$out" | cut -f1))"
  else
    echo "skip $out"
  fi
}
# من صفحة space: جسيمات/فضاء/طاقة
dl 18791 "https://assets.mixkit.co/videos/18791/18791-720.mp4" s1_space_energy.mp4
dl 29351 "https://assets.mixkit.co/videos/29351/29351-720.mp4" s2_particles.mp4
dl 45020 "https://assets.mixkit.co/videos/45020/45020-720.mp4" s3_cosmic.mp4
# من صفحة physics/energy إن وجدت لاحقا
echo "done"
