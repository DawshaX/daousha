#!/usr/bin/env python3
"""تنزيل مقاطع Pexels عبر curl_cffi (impersonate chrome) لاستخراج روابط mp4 من HTML."""
import re, sys, subprocess, json
from curl_cffi import requests

def fetch_video_page(url, timeout=30):
    r = requests.get(url, impersonate="chrome", timeout=timeout)
    r.raise_for_status()
    return r.text

def extract_mp4_links(html):
    urls = set()
    # نمط بيانات Pexels المضمنة
    for m in re.finditer(r'https://[^"\\\s]*?free\.mp4[^"\\\s]*', html):
        urls.add(m.group(0).replace('\\/', '/'))
    for m in re.finditer(r'https://images\.pexels\.com[^"\\\s]*\.mp4[^"\\\s]*', html):
        urls.add(m.group(0).replace('\\/', '/'))
    return sorted(urls)

def search_pexels(query, page=1):
    url = f"https://www.pexels.com/search/videos/{query}/?page={page}"
    html = fetch_video_page(url)
    links = extract_mp4_links(html)
    return links

if __name__ == "__main__":
    query = sys.argv[1]
    links = search_pexels(query)
    for l in links[:20]:
        print(l)
    print(f"TOTAL:{len(links)}", file=sys.stderr)
