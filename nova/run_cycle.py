"""قائد الدورة الذاتية — واحدة كاملة:
اختيار الحلقة → إنتاج (صوت/مشاهد/فيديو AR + EN اختياري) → نشر → إشعار → تحديث حالة → لوحة متابعة → git commit.

الاستخدام:
  python -m nova.run_cycle                  # دورة كاملة
  python -m nova.run_cycle --produce-only   # إنتاج بلا نشر
  python -m nova.run_cycle --episode ep30   # حلقة محددة
  python -m nova.run_cycle --resume         # إلغاء الإيقاف ومواصلة
"""
import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from . import captions, content, dashboard, notify, scenes, settings, state, video
from .tts import synthesize_segments

OUT = settings.OUT


def _log(*a):
    print(f"[cycle {time.strftime('%H:%M:%S')}]", *a, flush=True)


def build_scenes(topic: dict, plan_ar: dict, workdir: Path) -> list[dict]:
    """يبني 5 مشاهد (hook + 3 حقائق + خاتمة) — Pexels إن توفر وإلا هوية العلامة."""
    segs = plan_ar["segments"]
    groups, cur, cur_seg = [], [], None
    for i, s in enumerate(segs):
        if s["seg"] != cur_seg and cur:
            groups.append({"seg": cur_seg, "segs": cur})
            cur = []
        cur_seg = s["seg"]
        cur.append(i)
    if cur:
        groups.append({"seg": cur_seg, "segs": cur})
    queries = topic.get("scene_queries") or []
    if queries and isinstance(queries[0], list):
        queries = queries[0]
    title = topic.get("title_ar") or topic["angle"]
    for gi, g in enumerate(groups):
        stock = []
        if queries:
            stock = scenes.fetch_pexels(queries[min(gi, len(queries) - 1)], workdir)
        from . import flux
        kind = g["seg"]
        if stock:
            scene = stock[gi % len(stock)]
        else:
            bg = flux.render_bg(workdir / f"bg_{gi}.png", kind, seed=f"{topic['id']}{gi}")
            if kind == "hook":
                scene = scenes.render_branded_scene(workdir / f"scene_{gi}.png", "hook", title, ep=topic["id"], bg_path=bg)
            elif kind == "outro":
                scene = scenes.render_branded_scene(workdir / f"scene_{gi}.png", "outro", "", ep=topic["id"], bg_path=bg)
            else:
                fact_txt = segs[g["segs"][-1]]["text"]
                fact_txt = fact_txt.split(":", 1)[-1].strip() if ":" in fact_txt else fact_txt
                chips_ar = ["الحقيقة الأولى", "الحقيقة الثانية", "الحقيقة الثالثة"]
                chip = chips_ar[gi - 1] if 1 <= gi <= 3 else ""
                scene = scenes.render_branded_scene(workdir / f"scene_{gi}.png", "fact", fact_txt[:110], chip, bg_path=bg)
        g["scene"] = str(scene)
        _log(f"scene {gi} ({g['seg']}): {'stock' if stock else 'branded'} → {scene}")
    return groups


def produce_episode(topic: dict, langs: list[str]) -> dict:
    """ينتج الحلقة لكل لغة ويعيد {lang: video_path} + المعلومات."""
    results = {}
    covers = {}
    ep_dir = settings.WORK / topic["id"]
    if ep_dir.exists():
        shutil.rmtree(ep_dir)
    ep_dir.mkdir(parents=True)
    for lang in langs:
        segs = content.compose_script(topic, lang)
        if not segs:
            _log(f"no {lang} script for {topic['id']} — skip lang")
            continue
        _log(f"توليد الصوت ({lang})…")
        plan = synthesize_segments(segs, lang, ep_dir / f"tts_{lang}")
        if plan["total_duration"] < 8:
            raise RuntimeError(f"narration too short ({plan['total_duration']}s)")
        _log(f"بناء المشاهد ({lang})…")
        if lang == "ar":
            groups = build_scenes(topic, plan, ep_dir)
            groups_en = groups  # نفس المشاهد للإنجليزية (النص داخلها عربي)
        _log(f"الكابتشنز ({lang})…")
        caps = captions.build_kinetic_overlays(plan, ep_dir / f"caps_{lang}")
        suffix = "" if lang == "ar" else f"-{lang}"
        out = OUT / f"{topic['id']}{suffix}.mp4"
        # الغلاف الرسمي أولًا: يصبح أول فريم في الفيديو + غلاف المنصة
        cover_path = ep_dir / f"cover{suffix}.png"
        try:
            from . import brand
            brand.compose_cover(cover_path,
                                topic.get("title_ar") if lang == "ar" else topic.get("title_en", topic["angle"]),
                                topic["id"])
        except Exception as e:
            print(f"[cover] skip: {e}")
            cover_path = None
        _log(f"المونتاج ({lang})…")
        video.assemble(plan, groups if lang == "ar" else groups_en, caps, out,
                       ep_dir / f"build_{lang}", cover_png=cover_path)
        covers[lang] = cover_path
        if cover_path and cover_path.exists():
            import shutil as _sh
            _sh.copy(cover_path, OUT / cover_path.name)
        results[lang] = out
        _log(f"✅ {lang}: {out} ({out.stat().st_size // 1024} KB)")
    results["_covers"] = covers
    return results


def publish_video(topic: dict, video_path: Path, lang: str, cover_path=None) -> dict:
    """ينشر على كل المنصات المتاحة ويعيد {platform: url_or_None}, {platform: error}."""
    from . import publish
    title, cap = content.make_title_caption(topic, lang)
    tags = [t.strip() for t in topic.get("tags", "حقائق,علوم,داوسها").replace("#", "").split(",")]
    links, errs = {}, {}
    for name, mod, ok_fn in (("youtube", publish.youtube, settings.has_youtube),
                             ("facebook", publish.facebook, settings.has_facebook),
                             ("instagram", publish.instagram, settings.has_instagram),
                             ("tiktok", publish.tiktok, lambda: settings.TIKTOK_ENABLED)):
        if name not in state.pending_platforms(topic):
            continue
        allowed, why = state.can_publish_now(name)
        if not ok_fn():
            errs[name] = why if why != "ok" else "no_credentials"
            continue
        if not allowed:
            errs[name] = why
            continue
        _log(f"نشر على {name}…")
        if name == "youtube":
            url, err = mod.publish(video_path, title, cap, tags, cover_path=cover_path)
        else:
            url, err = mod.publish(video_path, title, cap, tags)
        links[name] = url
        if err:
            errs[name] = err
            _log(f"❌ {name}: {err}")
        else:
            _log(f"✅ {name}: {url}")
            if name == "youtube":
                # 📱 إشعار فوري غني للمالك: العنوان + الرابط + الوقت + الحلقة القادمة
                from datetime import datetime, timedelta
                now = datetime.now()
                nxt = (now + timedelta(hours=1)).strftime("%H:%M")
                try:
                    from .notify import send as _tg
                    _tg(f"🚀 <b>نُشرت حلقة جديدة!</b>\n"
                        f"📺 {title[:80]}\n"
                        f"▶️ {url}\n"
                        f"🕐 وقت النشر: {now.strftime('%H:%M')}\n"
                        f"⏭ الحلقة الجاية: ~{nxt}")
                except Exception:
                    pass
        time.sleep(3)
    return {"links": links, "errors": errs}


def git_commit(msg: str):
    if not settings.AUTO_GIT:
        return
    try:
        subprocess.run(["git", "add", "-A", "content/topics.json", "state", "dashboard"], check=False,
                       capture_output=True, cwd=str(settings.ROOT))
        subprocess.run(["git", "commit", "-m", msg, "--no-verify"], check=False, capture_output=True,
                       cwd=str(settings.ROOT))
        subprocess.run(["git", "push", "-q", "origin", "HEAD"], check=False, capture_output=True,
                       cwd=str(settings.ROOT))
        _log("git: state committed")
    except Exception as e:
        _log(f"git skip: {e}")


def run_cycle(episode: str | None = None, produce_only: bool = False) -> int:
    if state.is_halted() and not produce_only:
        _log("⛔ النظام موقوف:", state.engine_state().get("haltReason"))
        return 1
    # ⛽ تعبئة الوقود من الأرشيف لو قل (مصنع لا ينضب — 3 سنين+)
    try:
        from .content import refill_from_archive
        _moved = refill_from_archive(100)
        if _moved:
            _log(f"⛽ سحبت {_moved} حلقة من الأرشيف للوقود")
    except Exception:
        pass
    topics = state.load_topics()
    topic = state.find_topic(topics, episode) if episode else None
    stored_videos = {}
    if not topic:
        # 1) هل توجد حلقة منتجة تنتظر استكمال نشرها؟ (مثلًا لما المفاتيح توصل متأخر)
        rec = state.topic_awaiting_publish(topics)
        if rec:
            topic = rec
            stored_videos = rec.pop("_stored_videos", {})
            _log(f"♻️ استكمال نشر {topic['id']} على: {state.pending_platforms(topic)}")
    if not topic:
        # 2) حلقة جديدة للإنتاج
        topic = state.next_topic(topics)
    if not topic:
        _log("لا مواضيع متاحة — توليد موضوع جديد تلقائيًا…")
        topic = content.generate_auto_topic(topics, force_llm=True)
        if not topic:
            _log("❌ لا يمكن توليد موضوع (فارغ البنك؟)")
            return 1
        topics.append(topic)
        state.save_topics(topics)
        _log(f"موضوع جديد: {topic['id']} — {topic['angle']}")
    _log(f"📌 الحلقة: {topic['id']} — {topic['angle']}")

    langs = [l for l in settings.LANGS if l in ("ar", "en")]
    videos = stored_videos
    covers = stored_videos.get("_covers", {}) if stored_videos else {}
    if stored_videos:
        videos = {k: v for k, v in stored_videos.items() if k != "_covers"}
    if not videos:
        try:
            produced = produce_episode(topic, langs)
            covers = produced.get("_covers", {})
            videos = {k: v for k, v in produced.items() if k != "_covers"}
        except Exception as e:
            _log("❌ فشل الإنتاج:", e)
            if state.register_error(str(e)):
                notify.report_halt(str(e))
            notify.report_error(f"إنتاج {topic['id']}", str(e))
            state.record_cycle_result(False)
            return 1

    if produce_only:
        _log("produce-only: توقفت قبل النشر")
        return 0

    all_links, all_errs, notes = {}, {}, []
    for lang, vp in videos.items():
        r = publish_video(topic, vp, lang, cover_path=covers.get(lang))
        for p, u in r["links"].items():
            all_links[f"{p}{'-' + lang if lang != 'ar' else ''}"] = u
            topic.setdefault("published", {})[p] = u
        for p, e in r["errors"].items():
            all_errs[p] = e
        if any("no_credentials" == e for e in r["errors"].values()):
            notes.append("أضف مفاتيح النشر (GitHub Secrets) لتفعيل المنصات الناقصة")
        if any("no_public_url" in e for e in r["errors"].values()):
            notes.append("إنستجرام يحتاج repo عام (لرابط الفيديو العام)")

    # تحديث الحالة
    pend = state.pending_platforms(topic)
    if not pend:
        topic["status"] = "published"
    elif any(topic.get("published", {}).values()):
        topic["status"] = "partial"
    elif videos:
        topic["status"] = "produced"
    topic["produced_at"] = time.strftime("%Y-%m-%d %H:%M")
    topic["video"] = [str(v) for v in videos.values()]
    topic["videos"] = {lang: str(v) for lang, v in videos.items()}
    if covers:
        topic["covers"] = {l: str(c) for l, c in covers.items() if c}
    state.save_topics(topics)

    # غياب المفاتيح ليس خطأ محرك — الإنتاج نجح والنشر ينتظر المفاتيح بهدوء
    real_errors = {p: e for p, e in all_errs.items() if e != "no_credentials"}
    ok_cycle = bool(videos) and not real_errors
    lad = state.record_cycle_result(ok_cycle)
    state.log_event({"episode": topic["id"], "platforms_done": list(all_links), "errors": all_errs,
                     "date": state.cairo_today()})
    dashboard.render()
    notify.report_episode(topic["id"], topic["angle"], all_links, notes)
    if real_errors:
        if state.register_error(json.dumps(real_errors, ensure_ascii=False)):
            notify.report_halt(json.dumps(real_errors, ensure_ascii=False)[:200])
        notify.report_error(f"نشر {topic['id']}", json.dumps(real_errors, ensure_ascii=False)[:300])
    elif not all_links:
        notify.send(f"📦 <b>تم إنتاج الحلقة {topic['id']}</b> بنجاح — بانتظار مفاتيح النشر "
                    "(GitHub Secrets) للنشر على المنصات")
    git_commit(f"NOVA: episode {topic['id']} — publish {list(all_links) or 'produced-only'} "
               f"(cap {lad['dailyCap']}/day)")
    _log("🏁 اكتملت الدورة. المنشور:", all_links or "لا شيء (بانتظار المفاتيح)")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode")
    ap.add_argument("--produce-only", action="store_true")
    ap.add_argument("--resume", action="store_true")
    args = ap.parse_args()
    if args.resume:
        state.resume()
        _log("تم إلغاء الإيقاف — النظام يعمل")
        return 0
    # ═══ بوابة الإيقاع الساعي: نشر واحد على يوتيوب كل ساعة كحد أقصى ═══
    # تمنع التكرار وتمنع لفّ السلسلة أسرع من ساعة مهما تعددت المحفزات
    try:
        _last = 0.0
        for _e in reversed(state.load_log()):
            if "youtube" in (_e.get("platforms_done") or []) and not _e.get("error"):
                from datetime import datetime as _dt
                _last = _dt.fromisoformat(_e["ts"]).timestamp()
                break
        import time as _time
        _since = _time.time() - _last
        if _last and _since < 3300:  # 55 دقيقة
            _log(f"⏳ آخر نشر قبل {int(_since//60)} دقيقة — تخطي الدورة (الإيقاع: حلقة كل ساعة)")
            return 0
    except Exception:
        pass
    return run_cycle(args.episode, args.produce_only)


if __name__ == "__main__":
    sys.exit(main())
