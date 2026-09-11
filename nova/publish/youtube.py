"""رفع YouTube Shorts — OAuth refresh token + رفع Resumable."""
import requests

from .. import settings


def _access_token() -> str | None:
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": settings.YOUTUBE["client_id"],
        "client_secret": settings.YOUTUBE["client_secret"],
        "refresh_token": settings.YOUTUBE["refresh_token"],
        "grant_type": "refresh_token"}, timeout=30)
    return r.json().get("access_token") if r.ok else None


def set_thumbnail(video_id: str, cover_path, token: str) -> bool:
    """تسجيل الغلاف الرسمي للحلقة على يوتيوب (صلاحية youtube.upload تكفي)."""
    try:
        r = requests.post(
            f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set"
            f"?videoId={video_id}&uploadType=media",
            headers={"Authorization": f"Bearer {token}"},
            files={"thumb": open(cover_path, "rb")}, timeout=60)
        return r.status_code in (200, 201)
    except Exception:
        return False


def publish(video_path, title: str, description: str, tags: list[str],
            cover_path=None) -> tuple[str | None, str | None]:
    if not settings.has_youtube():
        return None, "no_credentials"
    try:
        token = _access_token()
        if not token:
            return None, "refresh_failed"

        desc = f"{description}\n\n{settings.BRAND['hashtags']}\n#Shorts"
        meta = {
            "snippet": {"title": title[:100], "description": desc[:4900],
                        "tags": tags[:15], "categoryId": "27", "defaultLanguage": "ar"},
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
        }
        init = requests.post(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                     "X-Upload-Content-Type": "video/mp4",
                     "X-Upload-Content-Length": str(video_path.stat().st_size)},
            json=meta, timeout=60)
        if init.status_code != 200:
            return None, f"init_{init.status_code}:{init.text[:150]}"
        up_url = init.headers["Location"]
        with open(video_path, "rb") as f:
            up = requests.put(up_url, headers={"Content-Length": str(video_path.stat().st_size)},
                              data=f, timeout=900)
        if up.status_code not in (200, 201):
            return None, f"upload_{up.status_code}:{up.text[:150]}"
        vid = up.json().get("id", "")
        if cover_path:
            import pathlib
            if pathlib.Path(cover_path).exists():
                if set_thumbnail(vid, cover_path, token):
                    print("[youtube] thumbnail set ✓")
                else:
                    print("[youtube] thumbnail set failed (غير حرج)")
        return f"https://www.youtube.com/watch?v={vid}", None
    except Exception as e:
        return None, str(e)[:200]
