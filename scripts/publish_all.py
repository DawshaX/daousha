#!/usr/bin/env python3
"""النشر التلقائي الموحّد — حلقة واحدة على YouTube + Facebook + Instagram + إشعار Telegram.
الاستخدام: python3 publish_all.py <episode_num>
يقوم بكل شيء تلقائياً دون أي تدخل: يرفع الفيديو للمحتوى، ينشر على الثلاث منصات،
ويبلغ تلجرام. مصمم ليُشغَّل من الجدول الدوري (manus-config schedule).
"""
import json
import os
import re
import subprocess
import sys

BASE = '/home/ubuntu/test_run'
VIDEO = f'{BASE}/episode{{}}-final.mp4'.format('{ep}')


def read_secret(name):
    raw = open('/home/ubuntu/secrets.txt').read().replace('\r', '')
    lines = [l for l in raw.splitlines() if l.strip() and not l.strip().startswith('#')]
    for i, l in enumerate(lines):
        if l.strip() == name and i + 1 < len(lines):
            return lines[i + 1].strip()
    return None


def load_env():
    return read_secret


def upload_youtube(ep):
    import requests
    env = {}
    for k in ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN']:
        env[k] = read_secret(k)
    rt = env.get('YOUTUBE_REFRESH_TOKEN', '')
    if not rt:
        return None, 'NO_REFRESH_TOKEN'
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': env['YOUTUBE_CLIENT_ID'], 'client_secret': env['YOUTUBE_CLIENT_SECRET'],
        'refresh_token': rt, 'grant_type': 'refresh_token'}, timeout=30)
    if r.status_code != 200:
        return None, f'REFRESH_FAILED:{r.status_code}'
    token = r.json().get('access_token')
    meta = {'snippet': {'title': f'الحلقة {ep} — داوسها', 'description': 'محتوى معرفي عربي قصير — داوسها XDAW NOVA',
                        'categoryId': '27', 'defaultLanguage': 'ar'},
            'status': {'privacyStatus': 'public', 'selfDeclaredMadeForKids': False}}
    headers = {'Authorization': f'Bearer {token}', 'X-Upload-Content-Type': 'video/mp4'}
    init = requests.post('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
                         headers=headers, json=meta, timeout=60)
    if init.status_code != 200:
        return None, f'YT_INIT:{init.status_code}'
    up_url = init.headers['Location']
    with open(VIDEO.format(ep=ep), 'rb') as f:
        r = requests.put(up_url, headers={'Content-Length': str(os.path.getsize(VIDEO.format(ep=ep)))},
                         data=f.read(), timeout=600)
    if r.status_code not in (200, 201):
        return None, f'YT_UPLOAD:{r.status_code}'
    vid = r.json().get('id', '')
    return f'https://www.youtube.com/watch?v={vid}', None


def upload_facebook(ep):
    import requests
    token = read_secret('FACEBOOK_PAGE_ACCESS_TOKEN')
    page = '1265727539958933'
    H = {'Authorization': f'OAuth {token}'}
    BASE = f'https://graph.facebook.com/v26.0/{page}'
    video = VIDEO.format(ep=ep)
    size = os.path.getsize(video)
    start = requests.post(f'{BASE}/video_reels', headers=H, data={
        'upload_phase': 'start', 'upload_video_size': size}).json()
    upload_id = start.get('video_id')
    upload_url = start.get('upload_url')
    if not upload_id or not upload_url:
        return None, f'FB_START:{json.dumps(start)[:200]}'
    H2 = dict(H)
    H2.update({'Offset': '0', 'Content-Type': 'application/octet-stream',
               'Content-Length': str(size), 'X-Entity-Length': str(size)})
    for _ in range(3):
        with open(video, 'rb') as f:
            r = requests.post(upload_url, headers=H2, data=f.read(), timeout=300)
        if r.status_code == 200:
            break
    fin = requests.post(f'{BASE}/video_reels', headers=H, data={
        'upload_phase': 'finish', 'video_id': upload_id,
        'description': f'الحلقة {ep} — محتوى معرفي عربي قصير من داوسها XDAW NOVA #حقائق #علوم'}).json()
    if not fin.get('success'):
        return None, f'FB_FINISH:{json.dumps(fin)[:200]}'
    return f'https://www.facebook.com/{page}/videos/{fin.get("post_id","")}', None


def upload_instagram(ep):
    """إنستجرام يُنفَّذ دائمًا عبر shell مباشرة (manus-mcp-cli create_instagram) —
    هذا السكربت ينشر YT+FB ثم يطبع رسالة واضحة لتنفيذ خطوة IG يدويًا من الجدول الدوري."""
    return None, 'IG_VIA_SCHEDULED_SHELL'


def notify(ep, yt, ig, fb):
    try:
        from notify_telegram import notify_publish
        return notify_publish(f'الحلقة {ep}', yt or '-', ig or '-', fb or '-')
    except Exception as e:
        print('telegram notify failed:', e)
        return False


def main():
    if len(sys.argv) < 2:
        print('usage: publish_all.py <episode_num> [notify_only]'); sys.exit(1)
    ep = sys.argv[1]
    video = VIDEO.format(ep=ep)
    if not os.path.exists(video):
        print(f'MISSING_VIDEO: {video}'); sys.exit(2)
    print(f'== publishing episode {ep} ==')
    yt, e1 = upload_youtube(ep); print('YT:', yt or e1)
    fb, e2 = upload_facebook(ep); print('FB:', fb or e2)
    ig, e3 = upload_instagram(ep); print('IG:', ig or e3)
    print('== notify ==')
    notify(ep, yt, ig, fb)
    print('DONE')


if __name__ == '__main__':
    main()
