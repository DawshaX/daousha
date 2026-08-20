#!/usr/bin/env python3
"""
رفع فيديو الاختبار إلى YouTube عبر YouTube Data API v3 (uploads)
- يقرأ المتغيرات من secrets.txt إلى الذاكرة فقط (لا يطبع أي قيمة سرية)
- يستخدم refresh token (إن وُجد) أو يطلب تدفق OAuth يدويًا بسيطًا
- النتيجة: رابط الفيديو المنشور أو سبب الفشل، دون عرض أي سر
"""
import os, re, sys, json, requests, http.server, threading, urllib.parse

SECRETS = '/home/ubuntu/secrets.txt'
TITLE = 'دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة'
DESC = ('حقائق علمية موثقة عن الدماغ البشري: لماذا يعمل على ثلث طاقته فقط؟ '
        'لماذا لا يشعر بالألم؟ ومن أين تأتي كهرباء أفكارك؟ تابع داوسها للمزيد من أسرار العقل والمعرفة. '
        '#حقائق #العلوم #المعرفة #دماغ #داوسها #XDAWNOVA')
TAGS = ['حقائق','العلوم','المعرفة','الدماغ','داوسها','XDAWNOVA','معلومات','عقل','جسم الإنسان','علوم مبسطة']
VIDEO = '/home/ubuntu/test_run/episode1-final.mp4'
CLIENT_ID_VAR = 'YOUTUBE_CLIENT_ID'
CLIENT_SECRET_VAR = 'YOUTUBE_CLIENT_SECRET'


KNOWN_KEYS = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN',
            'GOOGLE_REFRESH_TOKEN', 'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET',
            'TIKTOK_SANDBOX_CLIENT_KEY', 'TIKTOK_SANDBOX_CLIENT_SECRET',
            'META_APP_ID', 'META_APP_SECRET', 'FACEBOOK_PAGE_ACCESS_TOKEN',
            'TELEGRAM_BOT_TOKEN']


def load_env():
    raw = open(SECRETS).read().replace('\r', '')
    lines = [l for l in raw.splitlines() if l.strip() and not l.strip().startswith('#')]
    env = {}
    i = 0
    while i < len(lines):
        ln = lines[i].strip()
        if '=' in ln:
            key, _, val = ln.partition('=')
            key, val = key.strip(), val.strip()
            if key:
                env[key] = val
        else:
            for known in KNOWN_KEYS:
                if ln == known and i + 1 < len(lines):
                    env[ln] = lines[i + 1].strip()
                    break
        i += 1
    return env


def check_vars(env):
    cid = env.get(CLIENT_ID_VAR, '').strip()
    csec = env.get(CLIENT_SECRET_VAR, '').strip()
    missing = []
    if not cid: missing.append(CLIENT_ID_VAR)
    if not csec: missing.append(CLIENT_SECRET_VAR)
    return cid, csec, missing


def oauth_flow(cid, csec):
    """تدفق OAuth 2.0 يدوي بسيط: يفتح رابط تفويض، يستقبل الرمز عبر رد callback محلي."""
    scope = 'https://www.googleapis.com/auth/youtube.upload'
    redir = 'http://localhost:8899/callback'
    params = urllib.parse.urlencode({
        'client_id': cid, 'redirect_uri': redir, 'response_type': 'code',
        'scope': scope, 'access_type': 'offline', 'prompt': 'consent'})
    auth_url = f'https://accounts.google.com/o/oauth2/v2/auth?{params}'
    print(f'افتح هذا الرابط في متصفحك وسجّل الدخول بحساب القناة ووافق على التفويض:')
    print(auth_url)
    code_holder = {'code': None, 'err': None}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if 'code' in q:
                code_holder['code'] = q['code'][0]
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write('تم التفويض بنجاح. يمكنك إغلاق هذه الصفحة والعودة للجلسة.'.encode())
            else:
                code_holder['err'] = q.get('error', ['unknown'])[0]
                self.send_response(400)
                self.end_headers()
            self.server.shutdown_flag = True

    srv = http.server.HTTPServer(('localhost', 8899), Handler)
    srv.serve_forever()
    if code_holder['err']:
        raise RuntimeError(f'OAuth error: {code_holder["err"]}')
    if not code_holder['code']:
        raise RuntimeError('لم يُستقبل رمز التفويض')
    # تبادل الرمز برمز تحديث
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': cid, 'client_secret': csec, 'code': code_holder['code'],
        'grant_type': 'authorization_code', 'redirect_uri': redir}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f'token exchange failed: HTTP {r.status_code}')
    tokens = r.json()
    return tokens.get('access_token'), tokens.get('refresh_token')


def exchange_refresh(cid, csec, refresh_token):
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': cid, 'client_secret': csec,
        'refresh_token': refresh_token, 'grant_type': 'refresh_token'}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f'refresh failed: HTTP {r.status_code}')
    return r.json().get('access_token')


def main():
    env = load_env()
    cid, csec, missing = check_vars(env)
    if missing:
        print('MISSING_VARS: ' + ', '.join(missing))
        sys.exit(2)

    token = None
    rt = env.get('YOUTUBE_REFRESH_TOKEN', '').strip() or env.get('GOOGLE_REFRESH_TOKEN', '').strip()
    if rt:
        try:
            token = exchange_refresh(cid, csec, rt)
            print('TOKEN_FROM_REFRESH: yes')
        except RuntimeError as e:
            print('REFRESH_FAILED: ' + str(e))
            token = None
    if not token:
        try:
            token, new_rt = oauth_flow(cid, csec)
            if new_rt:
                print('NEW_REFRESH_TOKEN_SAVED: أضفه باسم YOUTUBE_REFRESH_TOKEN في secrets.txt/.env.local')
        except RuntimeError as e:
            print('OAUTH_FAILED: ' + str(e))
            sys.exit(3)

    # الرفع
    meta = {'snippet': {'title': TITLE, 'description': DESC, 'tags': TAGS, 'categoryId': '27', 'defaultLanguage': 'ar'},
            'status': {'privacyStatus': 'public', 'selfDeclaredMadeForKids': False}}
    headers = {'Authorization': f'Bearer {token}', 'X-Upload-Content-Type': 'video/mp4'}
    init = requests.post('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
                         headers=headers, json=meta, timeout=60)
    if init.status_code != 200:
        print('UPLOAD_INIT_FAILED: HTTP ' + str(init.status_code) + ' | ' + init.text[:300])
        sys.exit(4)
    up_url = init.headers['Location']
    size = os.path.getsize(VIDEO)
    with open(VIDEO, 'rb') as f:
        r = requests.put(up_url, headers={'Content-Length': str(size)}, data=f.read(), timeout=600)
    if r.status_code not in (200, 201):
        print('UPLOAD_FAILED: HTTP ' + str(r.status_code) + ' | ' + r.text[:300])
        sys.exit(5)
    data = r.json()
    vid = data.get('id', '')
    print('UPLOADED: https://www.youtube.com/watch?v=' + vid)


if __name__ == '__main__':
    main()
