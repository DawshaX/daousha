#!/usr/bin/env python3
"""نظام الإنتاج التلقائي — يختار الحلقة التالية من مكتبة المواضيع ويبنيها.
- يستخدم المواضيع التي لها سيناريو جاهز في ملفات episodeN-script.md (4 مشاهد + تعليق صوتي)
- يبني الفيديو عبر build_episode.sh
- يحدّث topic_library.json
الاستخدام: python3 produce_next_episode.py [ep_number]
"""
import json
import os
import re
import subprocess
import sys

BASE = '/home/ubuntu/test_run'
LIB = f'{BASE}/topic_library.json'


def load_lib():
    return json.load(open(LIB))


def save_lib(lib):
    json.dump(lib, open(LIB, 'w'), ensure_ascii=False, indent=1)


def main():
    lib = load_lib()
    if len(sys.argv) > 1:
        ep = sys.argv[1]
    else:
        pending = [t for t in lib if t['status'] in ('queued', 'pending-narration')]
        if not pending:
            print('NO_QUEUED_TOPICS'); sys.exit(0)
        ep = pending[0]['id']
    m = re.match(r'ep(\d+)', ep)
    if not m:
        print(f'BAD_ID: {ep}'); sys.exit(1)
    n = m.group(1)
    video = f'{BASE}/episode{n}-final.mp4'
    if os.path.exists(video):
        print(f'ALREADY_EXISTS: {video}')
        for t in lib:
            if t['id'] == ep:
                t['status'] = 'produced'
        save_lib(lib)
        sys.exit(0)
    script = f'{BASE}/episode{n}-script.md'
    if not os.path.exists(script):
        print(f'MISSING_SCRIPT: {script} — يحتاج كتابة سيناريو + 4 مشاهد + تعليق صوتي أولاً')
        sys.exit(2)
    narration = f'{BASE}/episode{n}-narration.wav'
    if not os.path.exists(narration):
        print(f'MISSING_NARRATION: {narration}')
        sys.exit(2)
    scenes = sorted(f for f in os.listdir(BASE) if f.startswith(f'ep{n}-scene') and f.endswith('.png'))
    if len(scenes) < 4:
        print(f'MISSING_SCENES: found {len(scenes)}/4 for ep{n}')
        sys.exit(2)
    cmd = [f'{BASE}/build_episode.sh', n] + scenes[:4] + [narration]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    print(r.stdout[-800:])
    if r.returncode != 0:
        print('BUILD_FAILED:', r.stderr[-500:]); sys.exit(3)
    if not os.path.exists(video):
        print('BUILD_FAILED_NO_OUTPUT'); sys.exit(3)
    for t in lib:
        if t['id'] == ep:
            t['status'] = 'produced'
    save_lib(lib)
    print(f'PRODUCED: {video}')


if __name__ == '__main__':
    main()
