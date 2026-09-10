#!/usr/bin/env python3
"""المرحلة 9 — ⏰ محرك الساعة: إنتاج → مخزون → نشر، كل ساعة، للأبد.

مثال: python3 -m pipeline.scheduler --every-minutes 60 --live
بدون --live: كل شيء محاكاة (إنتاج حقيقي + نشر وهمي).
"""
import argparse
import json
import time
from datetime import datetime, timezone
from . import FACTORY_ROOT, load_config
from .facts_miner import fill_needed
from . import topics as T
from .make_episode import make_one
from .vault import status as vault_status
from .publish import run_once, load_pub_state, save_pub_state
from . import telegram as tg

CFG = load_config("factory")

def log_line(msg: str):
    try:
        lp = FACTORY_ROOT / "state" / "factory.log"
        lp.parent.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).isoformat(timespec="minutes")
        with open(lp, "a", encoding="utf-8") as f:
            f.write(f"{ts} {msg}\n")
    except Exception:
        pass


def paused() -> bool:
    return (FACTORY_ROOT / "state" / "paused").exists()


def finish(res: dict) -> dict:
    try:
        n = sum(1 for m in res.get("made", []) if isinstance(m, dict) and m.get("ok"))
        hb = FACTORY_ROOT / "state" / "heartbeat.json"
        hb.write_text(json.dumps({"last_cycle": datetime.now(timezone.utc).isoformat(),
                                  "made_ok": n, "vault": vault_status()},
                                 ensure_ascii=False), encoding="utf-8")
        log_line(f"cycle done made_ok={n}")
        try:
            from .mirror import sweep as mirror_sweep
            log_line(f"mirror: {mirror_sweep(3)}")
        except Exception as e:
            log_line(f"mirror skip: {type(e).__name__}")
    except Exception as e:
        print(f"heartbeat fail: {e}")
    return res




def production_burst(tts_provider: str, max_episodes: int = 3) -> list:
    """ينتج دفعات حتى يمتلئ المخزون أو ينتهي البنك."""
    made = []
    for _ in range(max_episodes):
        st = vault_status()
        if st["healthy"]:
            break
        bank = T.load_bank()
        fstate = T.load_state()
        topic = T.next_topic(fstate, bank)
        if not topic:
            log_line("bank empty of ready topics — trying Wikipedia miner")
            mine = fill_needed(5)
            log_line(f"miner: {mine}")
            if mine.get("filled"):
                bank = T.load_bank()
                topic = T.next_topic(fstate, bank)
        if not topic:
            made.append({"skipped": "BANK_EMPTY_NEED_EXPANSION"})
            break
        for lang in [CFG["production"].get("narration_lang", "ar")]:
            r = make_one(topic, lang, tts_provider)
            made.append({"topic": topic["id"], "lang": lang, **r})
            if not r.get("ok"):
                break
        else:
            T.mark_consumed(fstate, topic["id"], topic.get("cat", "?"))
            continue
        break
    return made


def pick_rotation_platform() -> str:
    st = load_pub_state()
    rot = CFG["cadence"]["rotation"]
    last = st.get("last_platform", rot[-1])
    nxt = rot[(rot.index(last) + 1) % len(rot)]
    st["last_platform"] = nxt
    save_pub_state(st)
    return nxt


def cycle(live: bool, tts_provider: str, produce: int = 3, no_publish: bool = False) -> dict:
    print(f"\n===== CYCLE {datetime.now().isoformat(timespec='minutes')} live={live} no_publish={no_publish} =====", flush=True)
    log_line(f"cycle start live={live} no_publish={no_publish}")
    if paused():
        print("paused: skipping (remove state/paused to resume)", flush=True)
        log_line("paused: skipped")
        return {"made": [], "publish": "PAUSED", "vault": vault_status()}
    made = production_burst(tts_provider, produce)
    print(f"produced: {sum(1 for m in made if m.get('ok'))} videos", flush=True)
    if no_publish:
        print("publish: SKIPPED (production-only mode)", flush=True)
        return finish({"made": made, "publish": "SKIPPED", "vault": vault_status()})
    plat = pick_rotation_platform()
    print(f"publishing to: {plat}", flush=True)
    pub = run_once([plat], live)
    print(pub, flush=True)
    return finish({"made": made, "publish": pub, "vault": vault_status()})


def main():
    ap = argparse.ArgumentParser(description="XDAW NOVA scheduler")
    ap.add_argument("--every-minutes", type=int, default=60)
    ap.add_argument("--live", action="store_true")
    ap.add_argument("--once", action="store_true", help="دورة واحدة ثم خروج (لـ cron)")
    ap.add_argument("--tts-provider", default=None)
    ap.add_argument("--produce", type=int, default=3)
    ap.add_argument("--no-publish", action="store_true", help="إنتاج فقط بلا نشر (ملء المخزون)")
    a = ap.parse_args()
    live = a.live and not a.no_publish
    provider = a.tts_provider or CFG["production"]["tts_provider"]
    tg.send_message(f"🏭 المصنع بدأ العمل (live={live}, no_publish={a.no_publish}, every={a.every_minutes}min)")
    while True:
        try:
            cycle(live, provider, a.produce, a.no_publish)
        except Exception as e:
            tg.notify_alert(f"خطأ في الدورة: {type(e).__name__}: {e}"[:300])
        if a.once:
            break
        time.sleep(a.every_minutes * 60)


if __name__ == "__main__":
    main()
