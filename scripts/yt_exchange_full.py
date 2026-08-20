#!/usr/bin/env python3
"""يتبادل authorization code بـ refresh token موسع ويحفظه في secrets.txt."""
import requests, re, sys

secrets = {}
with open('/home/ubuntu/secrets.txt') as f:
    lines = [l.rstrip('\r\n') for l in f]
for i in range(len(lines) - 1):
    if lines[i].strip() and lines[i + 1].strip() == '' and i + 2 < len(lines) and lines[i + 2].strip():
        secrets[lines[i].strip()] = lines[i + 2].strip()

CODE = sys.argv[1].strip()
CLIENT_ID = secrets['YOUTUBE_CLIENT_ID']
CLIENT_SECRET = secrets['YOUTUBE_CLIENT_SECRET']
REDIRECT = 'https://8899-ivfx0jnsfhm4lb21x07io-ae1265fb.sg1.manus.computer/callback'

r = requests.post('https://oauth2.googleapis.com/token', data={
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'code': CODE,
    'grant_type': 'authorization_code',
    'redirect_uri': REDIRECT,
})
print('HTTP', r.status_code)
d = r.json()
if 'refresh_token' not in d:
    print('خطأ:', r.text[:400])
    sys.exit(1)

new_refresh = d['refresh_token']
print('refresh token جديد بحجم', len(new_refresh))

# يحفظ كـ YOUTUBE_REFRESH_TOKEN_FULL ويحدّث YOUTUBE_REFRESH_TOKEN القديم
content = open('/home/ubuntu/secrets.txt', 'rb').read().decode('latin-1')
new_crlf = content.replace('YOUTUBE_REFRESH_TOKEN', 'YOUTUBE_REFRESH_TOKEN_OLD')

marker = 'YOUTUBE_REFRESH_TOKEN_FULL'
if marker + '\r\n\r\n' in new_crlf:
    old_val = new_crlf.split(marker + '\r\n\r\n')[1].split('\r\n\r\n')[0]
    new_crlf = new_crlf.replace(marker + '\r\n\r\n' + old_val, marker + '\r\n\r\n' + new_refresh)
else:
    new_crlf = new_crlf.rstrip() + '\r\n\r\nYOUTUBE_REFRESH_TOKEN_FULL\r\n\r\n' + new_refresh + '\r\n'

open('/home/ubuntu/secrets.txt', 'wb').write(new_crlf.encode('latin-1'))
print('تم حفظ YOUTUBE_REFRESH_TOKEN_FULL في secrets.txt')
