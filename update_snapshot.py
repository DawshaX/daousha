#!/usr/bin/env python3
"""إلحاق قسم تحديث للدورة الحالية في current_state_snapshot.md على master."""
import datetime

path = 'docs/current_state_snapshot.md'
t = open(path).read()

stamp = '2026-08-20 11:10 UTC (14:10 القاهرة)'
block = f"""
---

## تحديث {stamp} — دورة مجدولة (هذا الساندبوكس المجدول)

### الحالة
- **ep26 (الجبال)**: منشورة كاملًا على كل المنصات (AR+EN) في 2026-08-20 10:40/10:42 UTC — IG + YT Shorts + FB.
- **ep27 (السرعة)**: AR+EN منشورتان على Instagram في 2026-08-20 10:14/10:15 UTC (DcQhcr9gmqD + DcQhj4mim6k). صُنعتا من مقاطع Pexels stock لأن حصة توليد الصور (20/20) وفيديو (1/1) استُهلكا يوم 2026-08-20. YT/FB/Telegram: معطلة (secrets.txt غائب منذ 2026-08-15).
- **ep28 (المادة المضادة)**: produced-partial — السيناريو AR+EN + narration28-ar.wav (57.6s) + narration28-en.wav (47.2s) جاهزة في docs/episode28/. المشاهد الثمانية (4 AR + 4 EN) مؤجلة حتى إعادة تعيين حصة توليد الصور (المتوقع 00:00 UTC يوم 2026-08-21).
- **IG cooldown**: نافذة النشر التالية تفتح 14:42 UTC (4 ساعات بعد منشور ep26 الساعة 10:42 UTC).
- **TikTok**: Rejected رسميًا (2026-08-19) — لا نشر.
- **المستودع**: فرعان — master (الفرع الإنتاجي: ep24/25/26 منشورة YT+FB+IG) وmain (دورات اليوم المجدولة: ep27 IG). دمجا هنا بـ --allow-unrelated-histories مع تحديث topic_library.json.

### خطوات الدورة التالية (بعد 00:00 UTC يوم 2026-08-21)
1. توليد 8 صور مشاهد ep28 (1440x2560، dark navy + amber glow) — 4 AR + 4 EN.
2. بناء الفيديوين AR+EN (1080x1920) عبر docs/build_episode.sh النمط.
3. نشر IG عند فتح النافذة (بعد 14:42 UTC أو بعد نشر سابق بـ 4 ساعات).
4. عند استعادة secrets.txt: استكمال YT/FB/Telegram للحلقات المعلقة (ep5-ep23 produced غير المنشورة، وYT/FB لـ ep6/8/14-16).
"""

open(path, 'a').write(block)
print('snapshot updated')
