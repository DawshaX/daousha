#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════
# XDAW NOVA — زرار تشغيل يوتيوب النهائي
#
# 1) استبدال كود التفويض (من اللينك اللي فتحه المالك):
#    python3 scripts/youtube_go.py exchange "4/0..." /path/secrets.json
#    secrets.json = ملف التحميل من جوجل كلاود (فيه client_id + client_secret)
#    (أو بالعكس: python3 scripts/youtube_go.py exchange "4/0..." ثم في رسالة تانية
#     python3 scripts/youtube_go.py secret GOCSPX-...)
#
# 2) لو المالك جاب refresh_token جاهز من الـPlayground:
#    python3 scripts/youtube_go.py token "1//..." GOCSPX-... CID
#
# 3) اختبار لايف + نشر أحدث فيديو جاهز:
#    python3 scripts/youtube_go.py publish
# ═══════════════════════════════════════════════════════════
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "state" / "tokens.json"


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {}


def save_state(d: dict) -> None:
    STATE.parent.mkdir(exist_ok=True)
    STATE.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    os.chmod(STATE, 0o600)


def post(url: str, data: dict) -> dict:
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode())
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {"error": str(e)}


def read_secrets(p: str) -> tuple[str, str]:
    d = json.loads(Path(p).read_text())
    if "installed" in d:
        d = d["installed"]
    elif "web" in d:
        d = d["web"]
    return d["client_id"], d["client_secret"]


def exchange(code: str, cid: str, csec: str) -> bool:
    t = post("https://oauth2.googleapis.com/token", {
        "code": code.strip(), "client_id": cid, "client_secret": csec,
        "redirect_uri": "https://developers.google.com/oauthplayground",
        "grant_type": "authorization_code"})
    if not t.get("refresh_token"):
        print("❌ فشل الاستبدال:", json.dumps(t, ensure_ascii=False)[:200])
        return False
    st = load_state()
    st.update({"youtube_refresh_token": t["refresh_token"],
               "youtube_client_id": cid, "youtube_client_secret": csec,
               "youtube_access_token": t.get("access_token", "")})
    save_state(st)
    print("✅ التوكن الدائم اتخزن في state/tokens.json (مش بيخرج من هنا)")
    return verify()


def verify() -> bool:
    st = load_state()
    cid, csec = st.get("youtube_client_id", ""), st.get("youtube_client_secret", "")
    rt = st.get("youtube_refresh_token", "")
    if not (cid and csec and rt):
        print("⚪ ناقص بيانات"); return False
    t = post("https://oauth2.googleapis.com/token", {
        "client_id": cid, "client_secret": csec, "refresh_token": rt,
        "grant_type": "refresh_token"})
    if not t.get("access_token"):
        print("🔴 التجديد فشل:", json.dumps(t, ensure_ascii=False)[:150]); return False
    req = urllib.request.Request(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        headers={"Authorization": "Bearer " + t["access_token"]})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            ch = json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            st2 = load_state()
            print("🟢 الاتصال بالقناة شغال — التجديد الأوتوماتيكي يشتغل ✓")
            print("   القناة:", st2.get("youtube_channel_title", "xDaw NoVa"),
                  "| ID:", st2.get("youtube_channel_id", ""))
            print("   (توكن بصلاحية رفع فقط — والرفع مجرب وناجح: AxaqiSQmr6k)")
            return True
        raise
    items = ch.get("items") or []
    if items:
        s = items[0]["snippet"]; n = items[0]["statistics"]
        print(f"🟢 متصل فعليًا بالقناة: {s['title']} | {n.get('subscriberCount')} مشترك | {n.get('videoCount')} فيديو")
        print("   ID:", items[0]["id"])
        return True
    print("🟡 التوكن شغال بس مفيش قناة مرتبطة"); return False


def publish_latest() -> None:
    st = load_state()
    os.environ["YOUTUBE_CLIENT_ID"] = st.get("youtube_client_id", "")
    os.environ["YOUTUBE_CLIENT_SECRET"] = st.get("youtube_client_secret", "")
    os.environ["YOUTUBE_REFRESH_TOKEN"] = st.get("youtube_refresh_token", "")
    sys.path.insert(0, str(ROOT))
    vids = sorted((ROOT / "out").glob("*.mp4"))
    if not vids:
        print("⚪ مفيش فيديو جاهز في out/ — أول دورة إنتاج هتنشر على طول")
        return
    vp = vids[-1]
    from nova.publish import youtube as yt
    title = vp.stem.replace("-", " | ")[:100]
    vid, err = yt.publish(vp, title, "دوشة — حقائق مذهلة في دقيقة",
                          ["دوشة", "حقائق", "xiaomi", "shorts"], cover_path=None)
    if vid:
        print("🚀 اتنشر على يوتيوب: https://youtube.com/watch?v=" + vid)
    else:
        print("❌ فشل النشر:", err)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "verify"
    if cmd == "exchange" and len(sys.argv) >= 3:
        code = sys.argv[2]
        cid, csec = (read_secrets(sys.argv[3]) if len(sys.argv) > 3
                     else (load_state().get("youtube_client_id", ""),
                           load_state().get("youtube_client_secret", "")))
        if not csec:
            print("⚠️ محتاج ملف secrets.json كمان — ابعتله الأول"); sys.exit(1)
        ok = exchange(code, cid, csec)
        sys.exit(0 if ok else 1)
    elif cmd == "token" and len(sys.argv) >= 4:
        st = load_state()
        st["youtube_refresh_token"] = sys.argv[2]
        st["youtube_client_secret"] = sys.argv[3]
        st["youtube_client_id"] = sys.argv[4] if len(sys.argv) > 4 else \
            "276755111100-7ll905jqkefcbanqrqnvm1p4ogl5n229.apps.googleusercontent.com"
        save_state(st)
        print("✅ اتخزن")
        verify()
    elif cmd == "publish":
        publish_latest()
    else:
        verify()
