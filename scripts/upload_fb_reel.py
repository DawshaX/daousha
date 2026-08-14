import json, requests

TOKEN = open('/home/ubuntu/test_run/fb_page_token.txt').read().strip()
PAGE_ID = '1265727539958933'
VIDEO = '/home/ubuntu/test_run/episode1-final.mp4'
H = {'Authorization': f'OAuth {TOKEN}'}
BASE = f'https://graph.facebook.com/v26.0/{PAGE_ID}'
file_size = __import__('os').path.getsize(VIDEO)

# 1. start
start = requests.post(f'{BASE}/video_reels', headers=H, data={
    'upload_phase': 'start',
    'upload_video_size': file_size,
}).json()
print('start:', json.dumps(start, ensure_ascii=False)[:500])
upload_id = start.get('video_id')
upload_url = start.get('upload_url')
if not upload_id or not upload_url:
    raise SystemExit('no upload id/url')

# 2. transfer via rupload (required for physical upload)
H2 = dict(H)
H2.update({'Offset': '0', 'Content-Type': 'application/octet-stream',
           'Content-Length': str(file_size), 'X-Entity-Length': str(file_size)})
for attempt in range(3):
    with open(VIDEO, 'rb') as f:
        r = requests.post(upload_url, headers=H2, data=f.read(), timeout=300)
    print('transfer attempt', attempt + 1, r.status_code, r.text[:300])
    if r.status_code == 200:
        break

# 3. finish
fin = requests.post(f'{BASE}/video_reels', headers=H, data={
    'upload_phase': 'finish',
    'video_id': upload_id,
    'description': 'دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة: 1) الدماغ 2% من وزنك يستهلك 20% من طاقتك اليومية 2) يولد 70 ألف فكرة يومياً 3) يعالج بسرعة 120 م/ث #حقائق #دماغ',
}).json()
print('finish:', json.dumps(fin, ensure_ascii=False)[:500])
