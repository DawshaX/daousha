"""نشر Instagram Reels — عبر Graph API الرسمي (بدون Manus):
1) يضمن رابطًا عامًا للفيديو (GitHub Release تلقائيًا داخل Actions)
2) ينشئ حاوية media (REELS) → يراقب جهوزيتها → media_publish
ملاحظة: يحتاج حساب IG تجاريًا مرتبطًا بصفحة فيسبوك + repo عام.
"""
import json
import time

import requests

from .. import settings

V = "v23.0"


def public_video_url(video_path) -> str | None:
    """رابط عام مباشر لملف الفيديو (يطلبه Instagram لسحب الفيديو)."""
    if settings.PUBLIC_VIDEO_BASE:
        return f"{settings.PUBLIC_VIDEO_BASE}/{video_path.name}"
    if settings.IN_GITHUB and settings.GITHUB_REPOSITORY:
        # داخل Actions: ارفع كـ Release asset عبر gh CLI (توكن CI جاهز)
        import subprocess
        tag = f"ep-{video_path.stem}"
        subprocess.run(["gh", "release", "create", tag, str(video_path),
                        "--title", tag, "--notes", "auto upload asset for instagram"],
                       check=False, capture_output=True,
                       env={"GH_TOKEN": settings.get("GH_TOKEN") or settings.get("GITHUB_TOKEN"),
                            "PATH": "/usr/bin:/bin:/usr/local/bin:/home/runner/.local/bin",
                            "GH_REPO": settings.GITHUB_REPOSITORY})
        return (f"https://github.com/{settings.GITHUB_REPOSITORY}/"
                f"releases/download/{tag}/{video_path.name}")
    return None


def publish(video_path, title: str, description: str, tags: list[str]) -> tuple[str | None, str | None]:
    if not (settings.has_instagram() or settings.tokens_store().get("instagram_user_id")):
        return None, "no_credentials"
    ts = settings.tokens_store()
    ig_user = ts.get("instagram_user_id") or settings.INSTAGRAM["user_id"]
    ig_token = ts.get("_live_page_token") or settings.INSTAGRAM["token"]
    if not (ig_user and ig_token):
        return None, "no_credentials"
    base = f"https://graph.facebook.com/{V}/{ig_user}"
    H = {"Authorization": f"OAuth {ig_token}"}
    try:
        url = public_video_url(video_path)
        if not url:
            return None, "no_public_url (شغّل داخل GitHub Actions على repo عام، أو اضبط NOVA_PUBLIC_VIDEO_BASE)"
        caption = f"{title}\n{description}\n{settings.BRAND['hashtags']}"
        r = requests.post(f"{base}/media", headers=H, data={
            "media_type": "REELS", "video_url": url, "caption": caption[:2100],
            "share_to_feed": "true"}, timeout=60).json()
        cid = r.get("id")
        if not cid:
            return None, f"container:{json.dumps(r)[:180]}"
        for _ in range(60):  # انتظار المعالجة حتى 5 دقائق
            st = requests.get(f"https://graph.facebook.com/{V}/{cid}",
                              params={"fields": "status_code"}, headers=H, timeout=30).json()
            code = st.get("status_code", "")
            if code == "FINISHED":
                break
            if code in ("ERROR", "EXPIRED"):
                return None, f"container_{code}"
            time.sleep(5)
        pub = requests.post(f"{base}/media_publish", headers=H,
                            data={"creation_id": cid}, timeout=60).json()
        pid = pub.get("id")
        if not pid:
            return None, f"publish:{json.dumps(pub)[:180]}"
        # جلب الرابط الدائم
        perm = requests.get(f"https://graph.facebook.com/{V}/{pid}",
                            params={"fields": "permalink"}, headers=H, timeout=30).json()
        return perm.get("permalink") or f"https://www.instagram.com/reel/{pid}/", None
    except Exception as e:
        return None, str(e)[:200]
