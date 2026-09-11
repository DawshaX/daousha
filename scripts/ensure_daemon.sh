#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# XDAW NOVA — حارس المصنع
# يشوف الدايمون عايش؟ لو مات يikkume لوحده. ويطبع تقرير صحة.
# الاستخدام: bash scripts/ensure_daemon.sh [الفاصل بالدقائق، افتراضي 60]
# ═══════════════════════════════════════════════════════
cd "$(dirname "$0")/.."
MIN="${1:-60}"

bash "$(dirname "$0")/bootstrap_env.sh" || true
echo "═══ فحص حيوية المصنع $(date '+%H:%M') ═══"
# 1) الدايمون عايش؟
if pgrep -f "run_daemon.sh" >/dev/null 2>&1; then
  echo "🟢 الدايمون عايش (PID $(pgrep -f 'run_daemon.sh' | head -1))"
else
  echo "🔴 الدايمون واقف — بتشغيله…"
  export IMAGEIO_FFMPEG_EXE="$(ls "$PWD"/_vendor/imageio_ffmpeg/binaries/ffmpeg-* 2>/dev/null | head -1)"
  export PYTHONPATH="$PWD${PYTHONPATH:+:$PYTHONPATH}"
  nohup bash run_daemon.sh "$MIN" >> factory.log 2>&1 &
  sleep 3
  pgrep -f "run_daemon.sh" >/dev/null && echo "🟢 اشتغل (PID $(pgrep -f 'run_daemon.sh' | head -1)) — كل $MIN دقيقة حلقة جديدة" \
    || echo "❌ فشل التشغيل — شوف factory.log"
fi
# 2) آخر إنتاج
LAST=$(ls -t content/out/*.mp4 2>/dev/null | head -1)
[ -n "$LAST" ] && echo "📦 آخر حلقة منتجة: $(basename "$LAST") ($(date -r "$LAST" '+%m-%d %H:%M'))"
# 3) حالة النشر في السجل
PUB=$(grep -oE "youtube.com/watch\?v=[A-Za-z0-9_-]+" factory.log 2>/dev/null | sort -u | tail -3)
[ -n "$PUB" ] && echo "📺 آخر النشرات:" && echo "$PUB" | sed 's/^/   /'
# 4) الصحة
python3 scripts/renew_tokens.py 2>/dev/null | grep -E "🟢|🔴" | sed 's/^/   /' || true
