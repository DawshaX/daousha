#!/usr/bin/env python3
"""المرحلة 8 — النشر: YouTube + Facebook + Instagram + TikTok + سلم + كولداون + تلجرام.

الوضع الافتراضي DRY-RUN (محاكاة) — النشر الحقيقي يتطلب --live فقط.
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone, date
from pathlib import Path
import requests
from . import FACTORY_ROOT, load_config
from .dotenv import load_dotenv
from .vault import next_for_platform, mark_published, status as vault_status
from . import telegram as tg

load_dotenv()
CFG = load_config("factory")
BRAND = load_config("brand")
CAD = CFG["cadence"]
STATE_FILE = FACTORY_ROOT / "state" / "publish_state.json"


def dry_run() -> bool:
    return os.environ.get("FACTORY_DRY_RUN", "true").lower() not in ("0", "false", "no")


def load_pub_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"last_publish": {}, "daily": {}, "errors": 0, "ladder": {"level": 1, "clean_days": 0, "last_date": None}}


def save_pub_state(s: dict):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")


def _today() -> str:
    return date.today().isoformat()


def ladder_cap(platform: str, st: dict) -> int:
    lvl = str(st.get("ladder", {}).get("level", 1))
    base = CFG["ladder"]["levels"].get(lvl, {}).get("per_platform_cap", 4)
    maxcap = CAD["per_platform_daily_cap"].get(platform, 6)
    return min(base, maxcap)


def platform_allowed(platform: str, st: dict) -> tuple:
    """يفحص الكولداون + السقف اليومي. يرجع (allowed, reason)."""
    now = datetime.now(timezone.utc).timestamp()
    last = st.get("last_publish", {}).get(platform, 0)
    cd = CAD["cooldown_minutes"].get(platform, 180) * 60
    if now - last < cd:
        wait = int((cd - (now - last)) / 60)
        return False, f"COOLDOWN_WAIT_{wait}m"
    used = st.get("daily", {}).get(_today(), {}).get(platform, 0)
    cap = ladder_cap(platform, st)
    if used >= cap:
        return False, f"DAILY_CAP_{used}/{cap}"
    return True, "OK"


def record_publish(st: dict, platform: str):
    now = datetime.now(timezone.utc).timestamp()
    st.setdefault("last_publish", {})[platform] = now
    st.setdefault("daily", {}).setdefault(_today(), {}).setdefault(platform, 0)
    st["daily"][_today()][platform] += 1
    st["errors"] = 0
    save_pub_state(st)


def record_error(st: dict):
    st["errors"] = st.get("errors", 0) + 1
    save_pub_state(st)
    return st["errors"]


# ---------------- YouTube ----------------
def upload_youtube(video: Path, title: str, caption: str) -> str:
    cid = os.environ.get("YOUTUBE_CLIENT_ID", "")
    csec = os.environ.get("YOUTUBE_CLIENT_SECRET", "")
    rt = os.environ.get("YOUTUBE_REFRESH_TOKEN", "")
    if not (cid and csec and rt):
        raise RuntimeError("YOUTUBE_CREDS_MISSING")
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": cid, "client_secret": csec,
        "refresh_token": rt, "grant_type": "refresh_token"}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"YT_REFRESH:{r.status_code}")
    token = r.json()["access_token"]
    meta = {"snippet": {"title": title[:95], "description": caption[:4900],
                        "categoryId": "27", "defaultLanguage": "ar"},
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}}
    headers = {"Authorization": f"Bearer {token}", "X-Upload-Content-Type": "video/mp4"}
    init = requests.post("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                         headers=headers, json=meta, timeout=60)
    if init.status_code != 200:
        raise RuntimeError(f"YT_INIT:{init.status_code}:{init.text[:150]}")
    size = video.stat().st_size
    with open(video, "rb") as f:
        up = requests.put(init.headers["Location"], headers={"Content-Length": str(size)},
                          data=f.read(), timeout=900)
    if up.status_code not in (200, 201):
        raise RuntimeError(f"YT_UPLOAD:{up.status_code}:{up.text[:150]}")
    return f"https://www.youtube.com/watch?v={up.json().get('id')}"


# ---------------- Facebook ----------------
def upload_facebook(video: Path, caption: str) -> str:
    token = os.environ.get("FACEBOOK_PAGE_ACCESS_TOKEN", "")
    page = os.environ.get("FACEBOOK_PAGE_ID", "1265727539958933")
    if not token:
        raise RuntimeError("FB_TOKEN_MISSING")
    H = {"Authorization": f"OAuth {token}"}
    base = f"https://graph.facebook.com/v21.0/{page}"
    size = video.stat().st_size
    start = requests.post(f"{base}/video_reels", headers=H,
                          data={"upload_phase": "start", "upload_video_size": size},
                          timeout=60).json()
    vid, url = start.get("video_id"), start.get("upload_url")
    if not (vid and url):
        raise RuntimeError(f"FB_START:{json.dumps(start)[:200]}")
    H2 = dict(H, Offset="0", **{"Content-Type": "application/octet-stream",
                                "Content-Length": str(size), "X-Entity-Length": str(size)})
    data = video.read_bytes()
    ok = False
    for _ in range(3):
        rr = requests.post(url, headers=H2, data=data, timeout=600)
        if rr.status_code == 200:
            ok = True
            break
    if not ok:
        raise RuntimeError("FB_TRANSFER_FAILED")
    fin = requests.post(f"{base}/video_reels", headers=H,
                        data={"upload_phase": "finish", "video_id": vid,
                              "description": caption[:2000]}, timeout=120).json()
    if not fin.get("success"):
        raise RuntimeError(f"FB_FINISH:{json.dumps(fin)[:200]}")
    return f"https://www.facebook.com/{page}/videos/{fin.get('post_id', vid)}"


# ---------------- Instagram (Graph API — يحتاج رابط فيديو عام) ----------------
def upload_instagram(video: Path, caption: str) -> str:
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    igid = os.environ.get("INSTAGRAM_ACCOUNT_ID", "")
    public_base = os.environ.get("PUBLIC_VIDEO_BASE", "")
    if not (token and igid):
        raise RuntimeError("IG_CREDS_MISSING")
    if not public_base:
        raise RuntimeError("IG_NEEDS_PUBLIC_URL: set PUBLIC_VIDEO_BASE (CDN for vault videos)")
    media_url = public_base.rstrip("/") + "/" + video.name
    base = f"https://graph.facebook.com/v21.0/{igid}"
    c = requests.post(f"{base}/media", data={
        "media_type": "REELS", "video_url": media_url, "caption": caption[:2200],
        "share_to_feed": True, "access_token": token}, timeout=60).json()
    cid = c.get("id")
    if not cid:
        raise RuntimeError(f"IG_CONTAINER:{json.dumps(c)[:200]}")
    for _ in range(20):
        time.sleep(15)
        s = requests.get(f"https://graph.facebook.com/v21.0/{cid}",
                         params={"fields": "status_code", "access_token": token},
                         timeout=30).json()
        if s.get("status_code") == "FINISHED":
            break
    else:
        raise RuntimeError("IG_PROCESSING_TIMEOUT")
    p = requests.post(f"{base}/media_publish",
                      data={"creation_id": cid, "access_token": token}, timeout=60).json()
    mid = p.get("id")
    if not mid:
        raise RuntimeError(f"IG_PUBLISH:{json.dumps(p)[:200]}")
    return f"https://www.instagram.com/reel/{mid}/"


# ---------------- TikTok (بعد القبول الرسمي فقط) ----------------
def upload_tiktok(video: Path, title: str) -> str:
    raise RuntimeError("TIKTOK_PAUSED: app rejected 2026-08-19 — reapply first (see ops/tiktok_reapply.md)")


UPLOADERS = {"youtube": upload_youtube, "facebook": upload_facebook,
             "instagram": upload_instagram, "tiktok": upload_tiktok}


def publish_entry(entry: dict, platform: str, live: bool) -> str:
    video = Path(entry["video"])
    tag = "#داوسها #XDAWNOVA" if entry["lang"] == "ar" else "#XDAWNOVA #facts"
    title = f"{entry['title']} {tag}"
    if not live:
        return f"DRYRUN://{platform}/{entry['id']}"
    fn = UPLOADERS[platform]
    if platform == "youtube":
        return fn(video, title, entry["caption"])
    if platform == "facebook":
        return fn(video, entry["caption"])
    if platform == "instagram":
        return fn(video, entry["caption"])
    return fn(video, title)


def run_once(platforms: list, live: bool) -> dict:
    st = load_pub_state()
    out = {"live": live, "results": []}
    for plat in platforms:
        ok, reason = platform_allowed(plat, st)
        if not ok:
            out["results"].append({"platform": plat, "skipped": reason})
            continue
        entry = next_for_platform(plat)
        if not entry:
            out["results"].append({"platform": plat, "skipped": "VAULT_EMPTY_FOR_PLATFORM"})
            continue
        try:
            url = publish_entry(entry, plat, live)
            if live:
                mark_published(entry["id"], plat, url)
                record_publish(st, plat)
            out["results"].append({"platform": plat, "entry": entry["id"], "url": url})
        except Exception as e:
            n = record_error(st)
            msg = f"{type(e).__name__}:{e}"[:250]
            out["results"].append({"platform": plat, "entry": entry["id"], "error": msg})
            if live and n >= CFG["safety"]["max_consecutive_errors"]:
                tg.notify_alert(f"توقف النشر بعد {n} أخطاء متتالية.\nآخر خطأ ({plat}): {msg}")
                out["halted"] = True
                break
    # إشعار تلجرام بالنشر الناجح
    done = {r["platform"]: r["url"] for r in out["results"] if r.get("url") and live}
    if done:
        e0 = next(r for r in out["results"] if r.get("url"))
        tg.notify_publish(e0.get("entry", "?"), e0.get("entry", "?"), done)
    return out


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA publish")
    ap.add_argument("--platform", default="rotation",
                    help="youtube|facebook|instagram|tiktok|all|rotation")
    ap.add_argument("--live", action="store_true", help="نشر حقيقي (بدونه = محاكاة)")
    a = ap.parse_args()
    live = a.live and not dry_run()
    if a.live and dry_run():
        print("BLOCKED: FACTORY_DRY_RUN=true in .env — set false to go live")
        sys.exit(2)
    if a.platform == "all":
        plats = ["youtube", "facebook", "instagram", "tiktok"]
    elif a.platform == "rotation":
        st = load_pub_state()
        rot = CAD["rotation"]
        last = st.get("last_platform", rot[-1])
        plats = [rot[(rot.index(last) + 1) % len(rot)]]
        st["last_platform"] = plats[0]
        save_pub_state(st)
    else:
        plats = [a.platform]
    if not vault_status()["healthy"] and live:
        print("WARN: vault below 72h minimum — publishing anyway (owner override soon)")
    print(json.dumps(run_once(plats, live), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
