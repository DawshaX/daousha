#!/usr/bin/env python3
"""يحدّث الجدول الدوري: cron جديد (6ص، 12م، 6م، 12م بالقاهرة) + playbook v3."""
import json, subprocess, sys

PLAYBOOK = open('/home/ubuntu/test_run/current_playbook.md').read()
CRON = '0 6,12,18,0 * * *'

subprocess.run(['manus-config', 'schedule', 'update',
                '--cron', CRON,
                '--playbook', PLAYBOOK], check=False)
