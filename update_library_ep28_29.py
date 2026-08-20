#!/usr/bin/env python3
"""تحديث topic_library.json: ep28 → published-ig (مع الروابط)، ep29 → published-ig."""
import json

P = 'scripts/topic_library.json'
lib = json.load(open(P))

def upd(item, status, links, cycle, style):
    item['status'] = status
    item['links'] = links
    item['cycle'] = cycle
    item['style'] = style

IG_AR = 'https://www.instagram.com/reel/DcQ4o6ACYRR/'
IG_EN_V1 = 'https://www.instagram.com/reel/DcQv02xmhc5/'
IG_EN_V2 = 'https://www.instagram.com/reel/DcRA7GElDHI/'
IG_AR_V1 = 'https://www.instagram.com/reel/DcQvoEQjDiB/'

lib.append({
    'id': 'ep28',
    'topic': 'أغلى مادة في الكون — المادة المضادة',
    'angle': '3 حقائق صادمة عن المادة المضادة',
    'status': 'published-ig',
    'links': {'ar': IG_AR, 'en': IG_EN_V2, 'ar_v1': IG_AR_V1, 'en_v1': IG_EN_V1},
    'cycle': '2026-08-20',
    'style': 'captions-overlay-sci-fi (Pexels)',
})
lib.append({
    'id': 'ep29',
    'topic': 'عالم عام 2099 — 3 حقائق صادمة عن المستقبل',
    'angle': 'مدن تحت قباب زجاجية، سيارات طائرة، وروبوتات ذكية',
    'status': 'published-ig-partial',
    'links': {'en_v2': IG_EN_V2},
    'cycle': '2026-08-20',
    'style': 'captions-overlay-sci-fi (Pexels)',
})

json.dump(lib, open(P, 'w'), indent=2, ensure_ascii=False)
print('updated. ep28:', [x for x in lib if x['id'].startswith('ep28')][0]['status'])
print('ep29:', [x for x in lib if x['id'].startswith('ep29')][0]['status'])
