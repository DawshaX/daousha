#!/usr/bin/env python3
"""تحديث topic_library.json على فرع master بعد الدمج:
1. ep26: إضافة روابط YT/FB/IG الكاملة (نُشرت على كل المنصات في 10:42 UTC)
2. ep27: تحديث الحالة إلى published-ig مع روابط IG (نُشرت 10:14/10:15 UTC)
3. ep28: إضافة حلقة جديدة queued (المادة المضادة)
"""
import json, datetime, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'scripts/topic_library.json'
d = json.load(open(path))

byid = {e['id']: e for e in d}

# ep26: منشورة كاملًا على كل المنصات في 2026-08-20T10:42Z (النسخة الإنجليزية) و10:40Z (العربية)
if 'ep26' in byid:
    byid['ep26'].update({
        'status': 'published',
        'published_at': '2026-08-20T10:42Z',
        'urls': {
            'ig_ar': 'https://www.instagram.com/reel/DcQkSDYlahu/',
            'ig_en': 'https://www.instagram.com/reel/DcQkiRqieBB/',
            'yt_short_ar': 'https://www.youtube.com/watch?v=K_bXcqeATuQ',
            'yt_short_en': 'https://www.youtube.com/watch?v=qfblVQPqcJ0',
            'fb_ar': 'https://www.facebook.com/1265727539958933/videos/1040225065316466',
            'fb_en': 'https://www.facebook.com/1265727539958933/videos/1405765538407518',
        }
    })

# ep27: نُشرت AR+EN على Instagram في 2026-08-20 10:14/10:15 UTC
if 'ep27' in byid:
    byid['ep27'].update({
        'status': 'published-ig',
        'published_at': '2026-08-20T10:15Z',
        'urls': {
            'ig_ar': 'https://www.instagram.com/reel/DcQhcr9gmqD/',
            'ig_en': 'https://www.instagram.com/reel/DcQhj4mim6k/',
        },
        'status_note': 'AR+EN published on Instagram 2026-08-20 10:14/10:15 UTC (Pexels clips; image-gen quota exhausted 20/20 and video quota 1/1 on 2026-08-20). YT/FB/Telegram: blocked since secrets.txt absent (2026-08-15).'
    })

# ep28: حلقة جديدة — السيناريو AR+EN + التعليق الصوتي جاهزان (2026-08-20)
if not any(e['id'] == 'ep28' for e in d):
    d.append({
        'id': 'ep28',
        'topic': 'المادة المضادة',
        'angle': '3 حقائق صادمة عن أغلى مادة في الكون',
        'status': 'produced',
        'produced_at': '2026-08-20 (11:08 UTC)',
        'status_note': 'Script (AR+EN) + narration28-ar.wav (57.6s) + narration28-en.wav (47.2s) produced 2026-08-20. Images (8 scenes, 4 AR + 4 EN) deferred: image quota 20/20 exhausted on 2026-08-20; video quota 1/1 exhausted. Build both videos and publish after quota reset (expected 00:00 UTC Aug 21).'
    })

json.dump(d, open(path, 'w'), ensure_ascii=False, indent=2)
print('OK — ep26:', byid['ep26']['status'], '| ep27:', byid['ep27']['status'], '| ep28: queued/produced')
