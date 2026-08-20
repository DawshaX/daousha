#!/usr/bin/env python3
"""إعادة محاولة تحديث فيديو واحد بالـ youtube scope الكامل مع طباعة كل التفاصيل."""
import requests, json, sys

secrets = {}
with open('/home/ubuntu/secrets.txt') as f:
    lines = [l.rstrip('\r\n') for l in f]
for i in range(len(lines) - 1):
    if lines[i].strip() and lines[i + 1].strip() == '' and i + 2 < len(lines) and lines[i + 2].strip():
        secrets[lines[i].strip()] = lines[i + 2].strip()

tok = requests.post('https://oauth2.googleapis.com/token', data={
    'client_id': secrets['YOUTUBE_CLIENT_ID'], 'client_secret': secrets['YOUTUBE_CLIENT_SECRET'],
    'refresh_token': secrets['YOUTUBE_REFRESH_TOKEN_FULL'], 'grant_type': 'refresh_token'}).json()
at = tok['access_token']

vid = sys.argv[1] if len(sys.argv) > 1 else 'KsPu75budwA'

# أولاً نجلب البيانات الحالية للفيديو
cur = requests.get(f'https://www.googleapis.com/youtube/v3/videos?part=snippet&id={vid}',
                   headers={'Authorization': f'Bearer {at}'}).json()
items = cur.get('items', [])
if not items:
    print('الفيديو غير موجود')
    sys.exit(1)
snip = items[0]['snippet']
print('الحالي:', snip['title'])

body = {
    'id': vid,
    'snippet': {
        'title': snip['title'] + ' #داوسها',
        'description': snip['description'],
        'tags': (snip.get('tags') or []) + ['داوسها', 'حقائق'],
        'categoryId': snip.get('categoryId') or '27',
        'defaultLanguage': 'ar',
        'defaultAudioLanguage': 'ar',
    },
}

r = requests.put('https://www.googleapis.com/youtube/v3/videos?part=snippet',
                 headers={'Authorization': f'Bearer {at}',
                          'Content-Type': 'application/json',
                          'X-Upload-Content-Type': 'application/json'},
                 json=body)
print('HTTP', r.status_code)
print(r.text[:500])
