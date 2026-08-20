#!/bin/bash
set -e
cd /home/ubuntu/daousha/docs/episode28/clips
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0"
dl () { curl -sL -A "$UA" "$1" -o "$2"; echo "OK $2 ($(du -h "$2" | cut -f1))"; }
dl "https://assets.mixkit.co/videos/45355/45355-720.mp4" s4_light_burst.mp4
dl "https://assets.mixkit.co/videos/20877/20877-720.mp4" s5_diamond.mp4
dl "https://assets.mixkit.co/videos/26757/26757-720.mp4" s6_crystal.mp4
dl "https://assets.mixkit.co/videos/32874/32874-720.mp4" s7_gold.mp4
dl "https://assets.mixkit.co/videos/38406/38406-720.mp4" s8_gold2.mp4
echo ALL_DONE
