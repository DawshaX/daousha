#!/usr/bin/env python3
"""📨 نسخ إشعارات تليجرام لمستودع Dollars (عشان كل نشرة توصل على تليجرام فورًا)."""
import base64, json, os, urllib.request

def env(n, d=""):
    return (os.environ.get(n) or d).strip()

def put_secret(repo, name, value, pat):
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}/actions/secrets/public-key",
                                 headers={"Authorization": f"token {pat}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        pk = json.load(r)
    from nacl import encoding, public
    sealed = base64.b64encode(public.SealedBox(
        public.PublicKey(pk["key"].encode(), encoding.Base64Encoder)).encrypt(value.encode())).decode()
    body = json.dumps({"encrypted_value": sealed, "key_id": pk["key_id"]}).encode()
    rq = urllib.request.Request(f"https://api.github.com/repos/{repo}/actions/secrets/{name}",
        data=body, method="PUT", headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(rq, timeout=30) as r:
        return r.status

def main():
    pat, target = env("CROSS_PAT"), env("TARGET", "DawshaX/Dollars")
    tok, chat = env("TG"), env("CHAT")
    if not (pat and tok and chat):
        print("⏭️ ناقص اعتماد تليجرام أو التوكن — مفيش حاجة تتنقل.")
        return 0
    for name, val in (("TELEGRAM_BOT_TOKEN", tok), ("TELEGRAM_CHAT_ID", chat)):
        print(f"   ✅ {target} ← {name} ({put_secret(target, name, val, pat)})")
    print("🎉 إشعارات تليجرام بقت جوه Dollars — كل نشرة هتوصلك على تليجرام.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
