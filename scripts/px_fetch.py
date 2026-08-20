#!/usr/bin/env python3
"""تنزيل أفضل مقاطع Pexels لموضوع الحلقة 29 (عالم 2099).
يجلب روابط mp4 من HTML البحث عبر curl_cffi، يختار الدقة الأعلى المتاحة (عمودي أفضل) لكل فيديو، وينزّله.
الاستخدام: python3 px_fetch.py <output_dir> <query1:name1> <query2:name2> ...
مثال: python3 px_fetch.py /out "futuristic%20city:city" "flying%20car:flying"
"""
import re, sys, os, subprocess
from curl_cffi import requests

UA = {"impersonate": "chrome"}

def parse_links(text):
    vids = {}
    for m in re.finditer(r'https://videos\.pexels\.com/video-files/(\d+)/([^"\\\s?]+)', text):
        vid, fname = m.group(1), m.group(2)
        vids.setdefault(vid, []).append(f"https://videos.pexels.com/video-files/{vid}/{fname}")
    for m in re.finditer(r'https://content\.pexels\.com/aigc-bundle/videos/([^"\\\s.]+\.mp4)', text):
        vids.setdefault(f"aigc-{m.group(1)}", []).append(m.group(0))
    return vids


def search_links(query, timeout=30, retries=4):
    url = f"https://www.pexels.com/search/videos/{query}/?page=1"
    last = None
    for i in range(retries):
        prof = "chrome" if i % 2 == 0 else "safari"
        try:
            r = requests.get(url, impersonate=prof, timeout=timeout)
            if r.status_code == 200:
                return r.text
            last = r.status_code
        except Exception as e:
            last = e
        import time
        time.sleep(3 + i * 2)
    raise RuntimeError(f"Pexels failed for {query}: {last}")


def choose(vid_links):
    """اختر الرابط: عمودي 1080/2160 إن وجد، وإلا الأعلى دقة."""
    best_v, best_h, best_u = None, -1, None
    for u in vid_links:
        m = re.search(r'_(\d+)_(\d+)_(\d+)fps', u)
        if m:
            h, w = int(m.group(2)), int(m.group(1))
        else:
            h, w = 9999, 9999  # aigc bundle, خذه أولًا
        if w > h and (best_v is None or h > best_v):   # عمودي
            best_v, best_u = h, u
    if best_u:
        return best_u
    # الأعلى دقة أفقي
    best, bestu = -1, None
    for u in vid_links:
        m = re.search(r'_(\d+)_(\d+)_', u)
        if m:
            s = int(m.group(1)) * int(m.group(2))
            if s > best:
                best, bestu = s, u
    return bestu or vid_links[0]

def dl(url, dest):
    r = requests.get(url, **UA, timeout=600, stream=True)
    r.raise_for_status()
    with open(dest, 'wb') as f:
        for ch in r.iter_content(1 << 20):
            f.write(ch)

if __name__ == "__main__":
    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)
    for spec in sys.argv[2:]:
        q, name = spec.split(":", 1)
        dest = os.path.join(outdir, f"{name}.mp4")
        if os.path.exists(dest) and os.path.getsize(dest) > 100000:
            print(f"SKIP {name} (exists)")
            continue
        vids = parse_links(search_links(q))
        if not vids:
            print(f"FAIL {name}: no links for {q}", file=sys.stderr)
            continue
        # أفضل فيديو: أول فيديو بروابط متعددة (دلائل جودة)
        pool = sorted(vids.items(), key=lambda kv: -len(kv[1]))
        u = choose(pool[0][1])
        print(f"DL {name} <- {u}")
        dl(u, dest)
        print("OK", name, os.path.getsize(dest))
