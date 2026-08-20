#!/usr/bin/env python3
"""توثيق حالة الدورة 12:05 UTC: ep28 أصبحت produced كاملة (فيديو AR+EN جاهزان)،
مع روابط CDN وملاحظات دورة الجدولة القادمة (النشر عند 14:42 UTC)."""
import json

path = '/home/ubuntu/daousha/scripts/topic_library.json'
d = json.load(open(path))
byid = {e['id']: e for e in d}

if 'ep28' in byid:
    byid['ep28'].update({
        'status': 'produced',
        'status_note': (
            'FULLY PRODUCED 2026-08-20 12:00 UTC with free Mixkit stock clips (gold s7, diamond s5, '
            'crystals s6, earth s2) — no AI image quota needed. '
            'video files: docs/episode28/episode28-ar.mp4 (56.1s) + episode28-en.mp4 (45.7s), 1080x1920. '
            'CDN: AR https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/eYeDGhkueixWeUSY.mp4 '
            '| EN https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/LDYhbGZxYAxIMEuL.mp4 '
            'Quality reviewed (manus-analyze-video): no sync/glitch issues. '
            'NEXT STEP: publish both on Instagram at cooldown window 14:42 UTC (4h after ep26 10:42 UTC). '
            'YT/FB/Telegram blocked (secrets.txt absent since 2026-08-15).'
        )
    })

json.dump(d, open(path, 'w'), ensure_ascii=False, indent=2)
print('topic_library updated')

# سجل دورة
note = open('/home/ubuntu/daousha/docs/cycle-notes-2026-08-20-12utc.md', 'w')
note.write("""# دورة 2026-08-20 12:05 UTC (دوشة | Dawsha — XDAW NOVA)

## الإنجاز
- الحلقة 28 (المادة المضادة) **منتجة بالكامل** بنسختي AR/EN باستخدام مقاطع Mixkit المجانية (بدل توليد الصور — الحصة 20/20 مستهلكة حتى 00:00 UTC).
- فيديو AR: 56.1 ث، فيديو EN: 45.7 ث، كلاهما 1080x1920 — مراجعة الجودة (manus-analyze-video): ممتاز، بدون أخطاء مزامنة.
- الفيديوهات مرفوعة على CDN:
  - AR: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/eYeDGhkueixWeUSY.mp4
  - EN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/LDYhbGZxYAxIMEuL.mp4

## النشر (دورة الجدولة القادمة)
- نافذة Instagram cooldown تفتح **14:42 UTC** (4 ساعات بعد منشور ep26 الساعة 10:42 UTC).
- النشر عبر manus-mcp-cli create_instagram (type=reels, share_to_feed:true) — تفاصيل الكابتشن في docs/episode28/CYCLE_STATE_2026-08-20.md.

## القيود القائمة
- secrets.txt غائب منذ 2026-08-15 → YT/FB/Telegram متوقفة.
- TikTok: Rejected رسميًا — لا نشر.
""")
note.close()
print('cycle note written')
