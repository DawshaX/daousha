#!/usr/bin/env python3
"""يحدّث حالة مكتبة المواضيع لتتناسب مع الجدول الساعةي."""

import json

# Update the topic library status - mark appropriate numbers for hourly production
lib_path = '/home/user/daousha/scripts/topic_library.json'
lib = json.load(open(lib_path))

# Mark 720 topics as "queued" for immediate production (8 hours at 1/hour)
# Mark 720 as "pending" 
# Mark rest as "produced"
for i, topic in enumerate(lib):
    if i < 720:
        topic['status'] = 'queued'
    elif i < 1440:
        topic['status'] = 'pending'
    else:
        topic['status'] = 'produced'

json.dump(lib, open(lib_path, 'w'), ensure_ascii=False, indent=1)

print(f"Topic library updated: {len(lib)} topics")
print(f"Queued for hourly production: {sum(1 for t in lib if t['status'] == 'queued')} topics")
print(f"Pending: {sum(1 for t in lib if t['status'] == 'pending')} topics")
print(f"Produced: {sum(1 for t in lib if t['status'] == 'produced')} topics")
print(f"At 1 episode/hour: {sum(1 for t in lib if t['status'] == 'queued')} hours of continuous production")
print(f"≈ 30 days of non-stop production")