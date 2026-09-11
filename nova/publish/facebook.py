"""نشر Facebook Reels — رفع على 3 مراحل (start/transfer/finish) عبر Graph API."""
import json
import time

import requests

from .. import settings

V = "v23.0"


def publish(video_path, title: str, description: str, tags: list[str]) -> tuple[str | None, str | None]:
    if not settings.has_facebook():
        return None, "no_credentials"
    page = settings.FACEBOOK["page_id"]
    # التوكن الحي من نظام التجديد التلقائي (tokens.json) أولًا — ثم بيئة التشغيل
    token = settings.tokens_store().get("_live_page_token") or settings.FACEBOOK["token"]
    H = {"Authorization": f"OAuth {token}"}
    base = f"https://graph.facebook.com/{V}/{page}"
    try:
        size = video_path.stat().st_size
        start = requests.post(f"{base}/video_reels", headers=H,
                              data={"upload_phase": "start", "upload_video_size": size},
                              timeout=30).json()
        vid_id, up_url = start.get("video_id"), start.get("upload_url")
        if not vid_id or not up_url:
            return None, f"start:{json.dumps(start)[:180]}"
        with open(video_path, "rb") as f:
            r = requests.post(up_url, headers={
                "Offset": "0", "Content-Type": "application/octet-stream",
                "Content-Length": str(size), "X-Entity-Length": str(size)}, data=f, timeout=900)
        if r.status_code != 200:
            return None, f"transfer_{r.status_code}:{r.text[:120]}"
        desc = f"{title}\n{description}\n{settings.BRAND['hashtags']}"
        fin = requests.post(f"{base}/video_reels", headers=H, data={
            "upload_phase": "finish", "video_id": vid_id,
            "description": desc[:2100]}, timeout=30).json()
        if not fin.get("success"):
            return None, f"finish:{json.dumps(fin)[:180]}"
        # الفيديو يُعالج لحظيًا — ننتظر التأكد من النشر
        for _ in range(12):
            chk = requests.get(f"https://graph.facebook.com/{V}/{vid_id}",
                               params={"fields": "status,permalink_url"}, headers=H, timeout=30).json()
            st = (chk.get("status", {}) or {}).get("video_status", "")
            if st == "ready":
                break
            time.sleep(10)
        link = chk.get("permalink_url") or f"{page}/videos/{vid_id}"
        if not str(link).startswith("http"):
            link = f"https://www.facebook.com/{link}"
        return link, None
    except Exception as e:
        return None, str(e)[:200]
