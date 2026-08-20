#!/usr/bin/env python3
"""تحسين العناوين والأوصاف والوسوم لفيديوهات الحلقات المنشورة على YouTube."""
import json, sys

secrets = {}
with open('/home/ubuntu/secrets.txt') as f:
    lines = [l.rstrip('\r\n') for l in f]
for i in range(len(lines) - 1):
    if lines[i].strip() and lines[i + 1].strip() == '' and i + 2 < len(lines) and lines[i + 2].strip():
        secrets[lines[i].strip()] = lines[i + 2].strip()

CLIENT_ID = secrets.get('YOUTUBE_CLIENT_ID', '')
CLIENT_SECRET = secrets.get('YOUTUBE_CLIENT_SECRET', '')
REFRESH = secrets.get('YOUTUBE_REFRESH_TOKEN_FULL', secrets.get('YOUTUBE_REFRESH_TOKEN', ''))

def get_access():
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET,
        'refresh_token': REFRESH, 'grant_type': 'refresh_token'})
    r.raise_for_status()
    return r.json()['access_token']

import requests

VIDEOS = {
    'KsPu75budwA': {
        'title': 'دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة #داوسها #shorts',
        'desc': '🔥 الحلقة 1 من داوسها | حقائق مذهلة عن دماغك وجسمك ونفسيتك\n\nهل تعلم أن دماغك يعمل على ثلث طاقته فقط؟ حقائق صادمة وموثقة عن العقل البشري في 46 ثانية!\n\n⏰ فيديو جديد كل ساعة على مدار اليوم\n📱 تابعنا: @xdaw_nova\n\n#داوسها #XDAWNOVA #حقائق #علم_النفس #معلومات #شورتس #تطوير_الذات #دماغ',
        'tags': ['داوسها', 'حقائق', 'حقائق صادمة', 'دماغ', 'معلومات', 'شورتس', 'علم النفس', 'تطوير الذات', 'معلومات عامة', 'حقائق علمية', 'facts', 'brain'],
    },
    'YDWrSeMH4o8': {
        'title': 'قلبك يضخ 7500 لتر دم يوميًا! 3 حقائق صادمة عنه #داوسها #shorts',
        'desc': '🔥 الحلقة 2 من داوسها | حقائق مذهلة عن قلبك وجسمك ونفسيتك\n\nهل تعلم أن قلبك يضخ 7500 لتر من الدم كل يوم؟ حقائق صادمة وموثقة عن أقوى عضلة في جسمك!\n\n⏰ فيديو جديد كل ساعة على مدار اليوم\n📱 تابعنا: @xdaw_nova\n\n#داوسها #XDAWNOVA #حقائق #القلب #معلومات #شورتس #علم_النفس #معلومات_عامة',
        'tags': ['داوسها', 'حقائق', 'حقائق صادمة', 'القلب', 'معلومات', 'شورتس', 'جسم الانسان', 'معلومات عامة', 'facts', 'heart'],
    },
    'opuu9zPgN-w': {
        'title': 'عينك تكذب عليك كل يوم! 3 حقائق صادمة #داوسها #shorts',
        'desc': '🔥 الحلقة 3 من داوسها | حقائق مذهلة عن عينك ودماغك\n\nهل تعلم أن عينك تخدعك كل ثانية؟ نقطة عمياء وألوان ومفاجآت لن تصدقها عن حاسة الإبصار!\n\n⏰ فيديو جديد كل ساعة على مدار اليوم\n📱 تابعنا: @xdaw_nova\n\n#داوسها #XDAWNOVA #حقائق #العين #معلومات #شورتس #علم_النفس #معلومات_مذهلة',
        'tags': ['داوسها', 'حقائق', 'حقائق صادمة', 'العين', 'معلومات', 'شورتس', 'الإبصار', 'معلومات لن تصدقها', 'facts', 'eye'],
    },
    'fm7Y0h1YBVg': {
        'title': '3 أكاذيب عن ذاكرتك تكشفها لك الحلقة 4 #داوسها #shorts',
        'desc': '🔥 الحلقة 4 من داوسها | حقائق مذهلة عن الذاكرة والعقل\n\nهل تثق في ذاكرتك؟ 3 أكاذيب صادمة عن كيف يخدعك عقلك ويتذكر أشياء لم تحدث أصلًا!\n\n⏰ فيديو جديد كل ساعة على مدار اليوم\n📱 تابعنا: @xdaw_nova\n\n#داوسها #XDAWNOVA #حقائق #الذاكرة #معلومات #شورتس #علم_النفس #تطوير_الذات',
        'tags': ['داوسها', 'حقائق', 'حقائق صادمة', 'الذاكرة', 'معلومات', 'شورتس', 'علم النفس', 'العقل', 'facts', 'memory'],
    },
}

token = get_access()
headers = {'Authorization': f'Bearer {token}'}

ok = 0
for vid, meta in VIDEOS.items():
    body = {
        'id': vid,
        'snippet': {
            'title': meta['title'],
            'description': meta['desc'],
            'tags': meta['tags'],
            'categoryId': '27',
            'defaultLanguage': 'ar',
            'defaultAudioLanguage': 'ar',
        },
        'status': {'selfDeclaredMadeForKids': False},
    }
    r = requests.put('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
                     headers={**headers, 'Content-Type': 'application/json'},
                     json=body)
    if r.status_code == 200:
        print(f'✅ {vid}: تم تحديث العناوين والوسوم')
        ok += 1
    else:
        print(f'❌ {vid}: خطأ {r.status_code} — {r.text[:300]}')
print(f'\nالنتيجة: {ok}/{len(VIDEOS)} فيديو محدث')
