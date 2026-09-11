"""نشر TikTok — Content Posting API (رفع مجزّأ Direct Post).
معطّل افتراضيًا: NOVA_TIKTOK_ENABLED=1 فقط بعد قبول تطبيقك رسميًا (تطبيق النظام القديم مرفوض).
"""
import json
import os

import requests

from .. import settings

API = "https://open.tiktokapis.com/v2"


def publish(video_path, title: str, description: str, tags: list[str]) -> tuple[str | None, str | None]:
    key = settings.get("TIKTOK_ACCESS_TOKEN")
    if not key or not settings.TIKTOK_ENABLED:
        return None, "disabled_or_no_token"
    try:
        size = video_path.stat().st_size
        chunk = min(64 * 1024 * 1024, size)
        init = requests.post(
            f"{API}/post/publish/video/init/",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"post_info": {
                      "title": f"{title} {settings.BRAND['hashtags']}"[:150],
                      "privacy_level": "PUBLIC_TO_EVERYONE",
                      "disable_comment": False, "disable_duet": False, "disable_stitch": False},
                  "source_info": {"source": "FILE_UPLOAD", "video_size": size,
                                  "chunk_size": chunk, "total_chunk_count": 1}},
            timeout=60).json()
        data = init.get("data", {})
        up_url = data.get("upload_url")
        if not up_url:
            return None, f"init:{json.dumps(init)[:180]}"
        with open(video_path, "rb") as f:
            r = requests.put(up_url, headers={
                "Content-Type": "video/mp4",
                "Content-Range": f"bytes 0-{size-1}/{size}"}, data=f, timeout=900)
        if r.status_code not in (200, 201):
            return None, f"upload_{r.status_code}"
        pub = requests.post(f"{API}/post/publish/status/fetch/",
                            headers={"Authorization": f"Bearer {key}",
                                     "Content-Type": "application/json"},
                            json={"publish_id": data.get("publish_id")}, timeout=30).json()
        return None, f"queued:{json.dumps(pub)[:120]} (يظهر على الحساب خلال دقائق)"
    except Exception as e:
        return None, str(e)[:200]
