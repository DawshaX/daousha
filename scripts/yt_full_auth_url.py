#!/usr/bin/env python3
"""يولّد رابط تفويض OAuth موسع (youtube + youtube.upload) لاستخدامه مرة واحدة."""
import json

secrets = {}
with open('/home/ubuntu/secrets.txt') as f:
    lines = [l.rstrip('\r\n') for l in f]
for i in range(len(lines) - 1):
    if lines[i].strip() and lines[i + 1].strip() == '' and i + 2 < len(lines) and lines[i + 2].strip():
        secrets[lines[i].strip()] = lines[i + 2].strip()

CLIENT_ID = secrets.get('YOUTUBE_CLIENT_ID', '')
REDIRECT = 'https://8899-ivfx0jnsfhm4lb21x07io-ae1265fb.sg1.manus.computer/callback'

scope = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload'
url = ('https://accounts.google.com/o/oauth2/v2/auth'
       f'?client_id={CLIENT_ID}'
       f'&redirect_uri={REDIRECT}'
       '&response_type=code'
       '&access_type=offline'
       '&prompt=consent'
       f'&scope={scope}')
print(url)
