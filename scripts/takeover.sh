#!/usr/bin/env bash
# ═════════════════════════════════════════════════════════
# XDAW NOVA — التحكم الكامل في مستودع daousha
# الاستخدام:
#   NOVA_GH_TOKEN=ghp_xxx bash scripts/takeover.sh probe    → رفع+تشغيل مجس السكريتس وقراءة النتيجة
#   NOVA_GH_TOKEN=ghp_xxx bash scripts/takeover.sh factory  → رفع المصنع + جدولة النشر + أول دورة
#   NOVA_GH_TOKEN=ghp_xxx bash scripts/takeover.sh status   → حالة آخر تشغيلات
# التوكن يُقرأ من متغير NOVA_GH_TOKEN أو من /tmp/nova_gh_token
# لا يُكتب التوكن في أي ملف دائم إطلاقًا.
# ═════════════════════════════════════════════════════════
set -euo pipefail
REPO="DawshaX/daousha"
CMD="${1:-status}"
T="${NOVA_GH_TOKEN:-}"; [ -z "$T" ] && [ -f /tmp/nova_gh_token ] && T="$(cat /tmp/nova_gh_token)"
[ -z "$T" ] && { echo "❌ محتاج NOVA_GH_TOKEN"; exit 1; }
AUTH="x-access-token:$T"
api() { curl -s -H "Authorization: token $T" -H "Accept: application/vnd.github+json" "$@"; }

echo "═══ التحقق من المفتاح ═══"
ME=$(api https://api.github.com/user)
LOGIN=$(echo "$ME" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("login",""))' 2>/dev/null || true)
[ -z "$LOGIN" ] && { echo "❌ المفتاح مرفوض — اتأكد إنه اتنسخ كامل (ghp_...)"; echo "$ME" | head -5; exit 1; }
echo "✅ المفتاح شغال — حساب: $LOGIN"

probe_push() {
  echo "═══ 1) رفع المجس المصلّح إلى main ═══"
  rm -rf /tmp/daousha && git clone -q "https://$AUTH@github.com/$REPO.git" /tmp/daousha
  cd /tmp/daousha
  git config user.email "nova@xdaw.local"; git config user.name "XDAW NOVA"
  mkdir -p .github/workflows
  cp /home/user/xdaw-nova-final/docs/PROBE-الصق-ده.yml .github/workflows/main.yml
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/main.yml')); print('YAML سليم ✓')"
  git add -A && git commit -qm "fix: probe workflow complete (auto by Nova)" || echo "(لا تغييرات)"
  git push -q origin main && echo "✅ اترفع — main محدث"
  sleep 3
  echo "═══ 2) تشغيل المجس ═══"
  api -X POST "https://api.github.com/repos/$REPO/actions/workflows/main.yml/dispatches" \
      -d '{"ref":"main"}' && echo "✅ أمر التشغيل اتبعت"
  echo "═══ 3) انتظار النتيجة (حتى 3 دقايق) ═══"
  for i in $(seq 1 36); do
    sleep 5
    R=$(api "https://api.github.com/repos/$REPO/actions/runs?per_page=1")
    ST=$(echo "$R" | python3 -c 'import json,sys; r=json.load(sys.stdin)["workflow_runs"][0]; print(r["status"]+"|"+str(r["conclusion"])+"|"+str(r["id"]))')
    S="${ST%%|*}"; REST="${ST#*|}"; CC="${REST%%|*}"; RID="${REST#*|}"
    [ "$S" = "completed" ] && break
    echo "  … شغال ($i)"
  done
  echo "═══ 4) النتيجة (run $RID — $CC) ═══"
  curl -sL -H "Authorization: token $T" "https://api.github.com/repos/$REPO/actions/runs/$RID/logs" -o /tmp/logs.zip
  rm -rf /tmp/nova_logs && mkdir -p /tmp/nova_logs && unzip -qo /tmp/logs.zip -d /tmp/nova_logs 2>/dev/null || true
  grep -rhoE "(YOUTUBE|FACEBOOK|INSTAGRAM|TELEGRAM|PEXELS) (🟢|🔴|🟡|⚪)[^\"]*" /tmp/nova_logs 2>/dev/null | sort -u | tee /tmp/probe_final.txt || echo "(لم أعثر على أسطر النتيجة — شوف اللوج كامل: /tmp/nova_logs)"
}

factory_push() {
  echo "═══ رفع المصنع + جدولة النشر ═══"
  rm -rf /tmp/daousha && git clone -q "https://$AUTH@github.com/$REPO.git" /tmp/daousha
  cd /tmp/daousha
  git config user.email "nova@xdaw.local"; git config user.name "XDAW NOVA"
  rsync -a --delete \
    --exclude '.git' --exclude 'work' --exclude 'state' --exclude 'out' \
    --exclude 'sample' --exclude '*.zip' --exclude '__pycache__' \
    /home/user/xdaw-nova-final/ /tmp/daousha/
  # جدولة كل ساعتين + تشغيل يدوي
  python3 - <<'EOF'
from pathlib import Path
p = Path('.github/workflows/nova.yml'); t = p.read_text()
import re
if 'schedule:' not in t:
    t = t.replace('on:', 'on:\n  schedule:\n    - cron: "37 */2 * * *"', 1)
    p.write_text(t); print('أضفت الجدولة كل ساعتين ✓')
else:
    print('الجدولة موجودة ✓')
EOF
  python3 -m compileall -q nova scripts && echo "كود المصنع سليم ✓"
  git add -A
  git commit -qm "XDAW NOVA factory v3 — autonomous publishing (cover+YT+FB+IG+TG, auto-renew)" && git push -q origin main && echo "✅ المصنع اترفع"
  sleep 3
  echo "═══ تشغيل أول دورة نشر فورًا ═══"
  WF=$(api "https://api.github.com/repos/$REPO/actions/workflows" | python3 -c 'import json,sys; [print(w["path"].split("/")[-1]) for w in json.load(sys.stdin)["workflows"] if "nova" in w["path"].lower()]' | head -1)
  [ -z "$WF" ] && WF="nova.yml"
  api -X POST "https://api.github.com/repos/$REPO/actions/workflows/$WF/dispatches" -d '{"ref":"main"}' && echo "✅ دورة النشر انطلقت ($WF)"
}

status_check() {
  echo "═══ آخر 5 تشغيلات ═══"
  api "https://api.github.com/repos/$REPO/actions/runs?per_page=5" | python3 -c '
import json,sys
for r in json.load(sys.stdin).get("workflow_runs", []):
    print(f"- {r[\"created_at\"]} | {r[\"name\"]} | {r[\"status\"]}/{r[\"conclusion\"]} | run={r[\"id\"]}")'
}

case "$CMD" in
  probe)   probe_push ;;
  factory) factory_push ;;
  status)  status_check ;;
  *) echo "الاستخدام: $0 probe|factory|status"; exit 1 ;;
esac
