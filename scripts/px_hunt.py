#!/usr/bin/env python3
"""فحص HTML Pexels للعثور على نمط روابط الفيديو."""
import re, sys
from curl_cffi import requests

q = sys.argv[1]
url = f"https://www.pexels.com/search/videos/{q}/?page=1"
r = requests.get(url, impersonate="chrome", timeout=30)
print("status", r.status_code, "len", len(r.text), file=sys.stderr)

pats = [
    r'https://[^"\\\s]*\.mp4',
    r'https://[^"\\\s]*video[^"\\\s]*',
    r'pexels\.com/videos/\d+',
]
for p in pats:
    ms = set(re.findall(p, r.text))
    print(f"--- pattern {p[:40]}: {len(ms)} matches")
    for m in sorted(ms)[:6]:
        print("   ", m[:150])
