#!/bin/bash
# تنزيل مقاطع إضافية من Pexels لحلقة 29
cd /home/ubuntu/daousha/docs/episode29/clips
python3 /home/ubuntu/daousha/scripts/px_fetch.py . \
  "sci-fi%20city:scifi_city" \
  "android%20robot:android" \
  "neon%20futuristic:neon_fut" \
  "drone%20lights:drone" 2>&1 | tail -12
ls -la *.mp4
