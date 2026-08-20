import json, sys
d = json.load(open('/home/ubuntu/daousha/scripts/topic_library.json'))
for i, t in enumerate(d, 1):
    status = t.get('status', '?')
    pub = t.get('published', t.get('links', {}))
    print(i, status, t.get('title', t.get('ar_title', ''))[:60])
