#!/usr/bin/env python3
"""نشر تسلسلي: ep28 EN v2 ثم ep29 AR v2 ثم ep29 EN v2 مع احترام cooldown 4 ساعات."""
import json, subprocess, time, sys
from datetime import datetime, timezone, timedelta

BASE = '/home/ubuntu/daousha/docs/episode29'
STATE = f'{BASE}/v2/publish_state.json'

POSTS = [
    {
        'name': 'ep28-en-v2',
        'media_url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/VHNXKIHISWbQfgLc.mp4',
        'cover_url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/jcTPZqwzarpTzvaT.png',
        'caption': 'The most expensive material in the universe... a million times pricier than diamond!\n\nOne gram of antimatter exceeds 60 trillion dollars, and all humanity ever made would not fill a teaspoon!\n\nYou are goodness and light from God — Follow Dawsha!\n\n#facts #science #antimatter #Dawsha #XDAWNOVA #curiosity',
        'min_after': None,  # بعد 17:37 UTC
    },
    {
        'name': 'ep29-ar-v2',
        'media_url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/uvGcvyyfyvwdffQp.mp4',
        'cover_url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/BFNZLXayuCNMXKLt.png',
        'caption': 'ما رأيك بعالم عام 2099؟ 3 حقائق صادمة عن المستقبل!\n\nمدن تحت قباب زجاجية، سيارات طائرة، وروبوتات ذكية!\n\nأنتم خير ونور من الله — تابع دوشة | Dawsha\n\n#حقائق #علوم #مستقبل #دوشة #XDAWNOVA',
    },
    {
        'name': 'ep29-en-v2',
        'media_url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/rYJIdjOCldAcbsCs.mp4',
        'cover_url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/hwaOXOYBQGtiMsyQ.png',
        'caption': "What do you think of 2099? 3 Shocking Facts About the Future!\n\nCities under glass domes, flying cars, and smart robots!\n\nYou are goodness and light from God — Follow Dawsha!\n\n#facts #science #future #Dawsha #XDAWNOVA",
    },
]

def load():
    try:
        with open(STATE) as f:
            return json.load(f)
    except Exception:
        return {'posts': {}}

def save(st):
    with open(STATE, 'w') as f:
        json.dump(st, f, indent=2, ensure_ascii=False)

def try_post(p, cooldown_from=None):
    """تحقق من cooldown الأخير ثم نفّذ. cooldown_from: وقت آخر منشور فعلي (UTC ISO) أو 'last' لاستخدام آخر منشور من IG."""
    now = datetime.now(timezone.utc)
    if cooldown_from is None:
        cooldown_from = datetime(2026, 8, 20, 17, 37, 0, tzinfo=timezone.utc)  # 4h بعد ep28 AR
    elif cooldown_from == 'last':
        cooldown_from = get_last_ig_post_time()
        if cooldown_from is None:
            return None, 'no last post time'
    if now < cooldown_from:
        wait = (cooldown_from - now).total_seconds() / 60
        return None, f'cooldown: wait {wait:.0f} min'
    inp = json.dumps({
        'media': [{'type': 'video', 'media_url': p['media_url']}],
        'type': 'reels',
        'caption': p['caption'],
        'cover_url': p['cover_url'],
        'share_to_feed': True,
    })
    out = subprocess.run(['manus-mcp-cli', 'tool', 'call', 'create_instagram', '--server', 'instagram', '--input', inp],
                         capture_output=True, text=True, timeout=600)
    combined = out.stdout + out.stderr
    if out.returncode != 0 or 'ERROR' in combined.upper() and 'Error:' in combined:
        return None, f'POST FAILED: {combined[-2000:]}'
    return combined, 'OK'

def get_last_ig_post_time():
    """آخر توقيت منشور فعلي على IG (من IG API)."""
    out = subprocess.run(['manus-mcp-cli', 'tool', 'call', 'get_post_list', '--server', 'instagram', '--input', '{"limit": 5}'],
                         capture_output=True, text=True, timeout=120)
    combined = out.stdout + out.stderr
    for line in combined.splitlines():
        if line.startswith('Posted:'):
            try:
                # Posted: 2026-08-20T13:37:56+0000
                ts = line.replace('Posted:', '').strip()
                from datetime import datetime as _dt
                return _dt.strptime(ts, '%Y-%m-%dT%H:%M:%S%z')
            except Exception:
                pass
    return None

def main():
    st = load()
    results = st.get('posts', {})
    for p in POSTS:
        if results.get(p['name'], {}).get('status') == 'published':
            print(f'{p["name"]}: already published -> {results[p["name"]].get("link")}')
            continue
        cooldown = None
        if p['name'] == 'ep28-en-v2':
            cooldown = datetime(2026, 8, 20, 17, 37, 0, tzinfo=timezone.utc)
        else:
            cooldown = 'last'
        res, status = try_post(p, cooldown)
        link = None
        for line in (res or '').splitlines():
            if 'instagram.com' in line:
                link = line.strip()
        results[p['name']] = {'status': status, 'time': datetime.now(timezone.utc).isoformat(), 'link': link}
        save({'posts': results})
        print(f'{p["name"]}: {status} {"-> " + link if link else ""}')
    print('DONE', json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
