#!/usr/bin/env bash
# وضع العمل المستمر المحلي (بديل GitHub Actions) — دورة كل ساعة افتراضيًا
# الاستخدام: ./run_daemon.sh [الفاصل بالدقائق]
set -u
cd "$(dirname "$0")"
# قفل أمان: ffmpeg مدمج داخل المشروع (لا يتأثر بمسح البيئة)
export IMAGEIO_FFMPEG_EXE="$(ls "$PWD"/_vendor/imageio_ffmpeg/binaries/ffmpeg-* 2>/dev/null | head -1)"
export PYTHONPATH="$PWD${PYTHONPATH:+:$PYTHONPATH}"
export TZ="Africa/Cairo"  # تثبيت التوقيت: حسابات الساعة بين النشرات لا تضيع
INTERVAL_MIN="${1:-${NOVA_INTERVAL_MIN:-60}}"
echo "🚀 XDAW NOVA daemon — دورة كل ${INTERVAL_MIN} دقيقة (Ctrl+C للإيقاف)"
while true; do
  echo "════════ $(date '+%Y-%m-%d %H:%M:%S') دورة جديدة ════════"
  bash scripts/bootstrap_env.sh || true
  python3 scripts/renew_tokens.py || true
  # عدم الوقوف الصامت: أي فشل سابق بيتصفّى أوتوماتيك قبل الدورة
  python3 -m nova.run_cycle --resume >/dev/null 2>&1 || true
  timeout 1500 python3 -m nova.run_cycle || echo "⚠️ الدورة فشلت/انتهى وقتها — سيعاد المحاولة في الدورة القادمة"
  echo "⏳ نوم ${INTERVAL_MIN} دقيقة…"
  sleep "$((INTERVAL_MIN * 60))"
done
