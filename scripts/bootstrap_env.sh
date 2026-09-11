#!/usr/bin/env bash
# XDAW NOVA — تمهيد البيئة: يضمن إن مكتبات _vendor كاملة (خاصة ffmpeg)
# سريع: لو كله موجود بينفذ في أقل من ثانية
cd "$(dirname "$0")/.."
if [ ! -x _vendor/imageio_ffmpeg/binaries/ffmpeg-* ] 2>/dev/null; then
  echo "[bootstrap] مكتبة ffmpeg ناقصة — بتثبيت _vendor…"
  mkdir -p _vendor
  pip install -q --target _vendor --upgrade --no-deps imageio-ffmpeg 2>&1 | grep -viE "notice|warning" | tail -1
  # باقي المكتبات: اثبتها لو ناقصة
  python3 - <<'PY' 2>/dev/null || pip install -q --target _vendor edge-tts requests arabic-reshaper python-bidi
import sys; sys.path.insert(0, "_vendor")
import edge_tts, requests, arabic_reshaper, bidi
PY
fi
# التحقق النهائي
if ls _vendor/imageio_ffmpeg/binaries/ffmpeg-* >/dev/null 2>&1; then
  export IMAGEIO_FFMPEG_EXE="$(ls "$PWD"/_vendor/imageio_ffmpeg/binaries/ffmpeg-* | head -1)"
  echo "[bootstrap] ✓ ffmpeg جاهز: $(basename "$IMAGEIO_FFMPEG_EXE")"
else
  echo "[bootstrap] ❌ فشل تثبيت ffmpeg — راجع الشبكة"
  exit 1
fi
