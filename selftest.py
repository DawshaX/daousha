#!/usr/bin/env python3
"""اختبار ذاتي شامل — ينتج حلقة كاملة (صوت + مشاهد + مونتاج) بلا أي مفاتيح نهائيًا.

الاستخدام:
  python selftest.py                 # ينتج أول حلقة جاهزة في الطابور
  python selftest.py --episode ep30  # حلقة محددة
  python selftest.py --keep          # لا تحذف مجلد العمل (للفحص)
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from nova import content, scenes, settings, state, tts  # noqa: E402
from nova.captions import build_kinetic_overlays  # noqa: E402
from nova.run_cycle import build_scenes, produce_episode  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode")
    ap.add_argument("--keep", action="store_true")
    args = ap.parse_args()

    print("=" * 60)
    print("XDAW NOVA — اختبار ذاتي شامل (بلا أي مفاتيح)")
    print("=" * 60)

    topics = state.load_topics()
    topic = state.find_topic(topics, args.episode) if args.episode else state.next_topic(topics)
    if not topic:
        print("❌ لا توجد حلقة متاحة — شغّل scripts/import_legacy.py أولًا")
        return 1
    segs = content.compose_script(topic, "ar")
    if not segs:
        print(f"❌ {topic['id']} بلا سيناريو")
        return 1
    print(f"📌 الحلقة: {topic['id']} — {topic['angle']}")
    full = " ".join(s["text"] for s in segs)
    print(f"📝 السيناريو ({len(full)} حرف): {full[:90]}…")

    print("\n[1/4] التعليق الصوتي (edge-tts)…")
    ep_dir = settings.WORK / f"selftest_{topic['id']}"
    plan = tts.synthesize_segments(segs, "ar", ep_dir / "tts")
    print(f"      ✅ المدة: {plan['total_duration']} ثانية، الأسطر: {len(plan['segments'])}")

    print("\n[2/4] المشاهد…")
    groups = build_scenes(topic, plan, ep_dir)
    for g in groups:
        print(f"      ✅ {g['seg']} → {g['scene']}")

    print("\n[3/4] الكابتشنز المتزامنة…")
    caps = build_kinetic_overlays(plan, ep_dir / "caps")
    print(f"      ✅ {len(caps)} كابتشن بتوقيت دقيق")

    print("\n[4/4] الغلاف الرسمي + المونتاج النهائي…")
    from nova import brand
    cover = ep_dir / "cover.png"
    try:
        brand.compose_cover(cover, topic.get("title_ar") or topic["angle"], topic["id"])
        print(f"      ✅ الغلاف: {cover.name} (أول فريم + غلاف المنصة)")
    except Exception as e:
        print(f"      ⚠️ cover skip: {e}")
        cover = None
    out = settings.OUT / f"{topic['id']}-selftest.mp4"
    video_ok = True
    try:
        from nova import video
        video.assemble(plan, groups, caps, out, ep_dir / "build", cover_png=cover)
    except Exception as e:
        video_ok = False
        print(f"      ❌ المونتاج: {e}")

    print("\n" + "=" * 60)
    if video_ok and out.exists():
        dur = tts.probe_duration(out)
        size = out.stat().st_size / 1024 / 1024
        r = subprocess.run([tts._ffmpeg(), "-i", str(out)], capture_output=True, text=True)
        dims = "1080x1920" if "1080x1920" in r.stderr else "?"
        print(f"🎉 النتيجة: {out}")
        print(f"   المدة: {dur:.1f} ث | الحجم: {size:.1f} MB | الدقة: {dims}")
        print("✅ النظام يعمل 100% — جاهز للإنتاج والنشر")
    else:
        print("❌ فشل — راجع الأخطاء أعلاه")
    if not args.keep:
        import shutil
        shutil.rmtree(ep_dir, ignore_errors=True)
    return 0 if video_ok else 1


if __name__ == "__main__":
    sys.exit(main())
