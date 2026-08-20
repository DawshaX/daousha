## دورة 2026-08-20 (05:05 UTC / 8:05 صباحًا القاهرة)
- لا نشر هذه الدورة: حصة توليد الصور المجانية نفدت (20/20 — أُنْفدت في دورة 03:35 UTC مع ep26)، وsecrets.txt غائب (YT/FB/Telegram معطلة)، وحد «قطعتين بفارق ≥4 ساعات» يمنع IG قبل ~07:21 UTC بعد منشور ep26 (03:21 UTC)
- ep27 تبقى produced-partial: سيناريو AR+EN + narration27-ar (45.8s) + narration27-en (45.4s) — تبقى 8 صور (4 AR + 4 EN) ثم بناء الفيديوين ونشر AR+EN على IG في الدورة التالية
- لا أخطاء نشر → streakSafe 21، streakRisky 0، level 2، dailyCap 6
- TikTok: «No access — login required» مجددًا؛ الحالة تبقى Production / In review منذ 2026-08-14

## دورة 2026-08-20 (03:35 UTC / 6:35 صباحًا القاهرة)
- الحلقة 26 "جبالك أخفى مما تظن! 3 أسرار صادمة عن أعظم جبال الأرض": produced كامل (1080x1920، 44.7s، narration26 Charon + 4 صور 1440x2560) في test_run/ وdocs/episode26/ + نشر IG https://www.instagram.com/reel/DcPyNOID91y/
- لا أخطاء نشر؛ YT/FB/Telegram معطلة بيئيًا فقط (secrets.txt غائب منذ 2026-08-15) → streakSafe 20، streakRisky 0
- topic_library.json: ep26 = produced؛ الحلقة التالية queued = ep27 (السرعة — 3 حقائق صادمة عن أسرع الأشياء في الكون)
- TikTok: صفحة المطورين "No access — login required"؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14


# Publishing Ladder State — XDAW NOVA
This file is the single source of truth for the escalating daily publishing cap. Update after every publish run.
- level: 2 (streakSafe reached 5 on 2026-08-16 run — ladder rule promotes dailyCap 4→6)
- dailyCap: 6
- streakSafe: 21 (2026-08-20 05:05 UTC run — no publish: free image quota exhausted (20/20, used by ep26 at 03:35 UTC run), secrets.txt missing since 2026-08-15 (YT/FB/Telegram), IG 4h cooldown until ~07:21 UTC after ep26 post at 03:21 UTC; ep27 stays produced-partial (script AR+EN + narrations 27-ar 45.8s / 27-en 45.4s — needs 8 scenes then 2 videos + IG AR/EN publish next run). 2026-08-20 03:35 UTC / 6:35am Cairo run: ep26 fully produced (script + Charon narration26 46.2s + 4 scenes 1440x2560 + final video 1080x1920 44.7s) and published on Instagram https://www.instagram.com/reel/DcPyNOID91y/ ; no platform errors; YT/FB/Telegram deferred for environmental reason only — secrets.txt still missing, same as prior runs)
- streakRisky: 0
- lastPublishDate: 2026-08-20
- note: ep21 published 21:16 UTC (after 12am Cairo start of Aug 20 local time; logged under Aug 19 run)
- lastPublishUrl: https://www.instagram.com/reel/DcPyNOID91y/ (episode 26, IG run 2026-08-20 03:35 UTC / 6:35am Cairo)
- history:
  - date: 2026-08-20 (05:05 UTC / 8:05am Cairo — scheduled run, no new publish)
    No production or publishing this run: free image quota 20/20 exhausted at 03:35 UTC run (ep26 4 scenes); episode 27 stays produced-partial (script AR+EN + narrations 27-ar 45.8s / 27-en 45.4s — needs 8 scenes then 2 videos + IG publish AR/EN); YT/FB/Telegram deferred (secrets.txt missing since 2026-08-15); Instagram 4h cooldown after ep26 post at 03:21 UTC prevents IG post before ~07:21 UTC.
    TikTok: "No access — login required" again; state stays Production / In review since 2026-08-14.
    No platform errors this run → streakSafe incremented (20→21).
  - date: 2026-08-20 (~07:06 Cairo / 04:06 UTC — scheduled run, no new publish)
    episode 27 "أسرع من الضوء؟ 3 حقائق صادمة عن السرعة ستفجّر عقلك" (AR + EN versions requested): produced-partial — script (AR+EN) + narration27-ar.wav (45.8s Charon) + narration27-en.wav (45.4s Charon) done in test_run/ & docs/episode27/; 8 scenes (4 AR + 4 EN, 9:16) deferred: free image quota 20/20 exhausted today — generate in next scheduled run, then build both final videos and publish (AR + EN) on IG; YT/FB/Telegram deferred (secrets.txt missing since 2026-08-15).
    TikTok: "No access — login required" again; state stays Production / In review since 2026-08-14.
    No platform errors this run (no publish attempted) → streakSafe unchanged.
- pendingFullPublish: ep5, ep6, ep7, ep8, ep9, ep10, ep11, ep12, ep13, ep14, ep15, ep16, ep17, ep18, ep19, ep20, ep21, ep23, ep24, ep25, ep26 (all produced/partially published; YT/FB/Telegram await secrets.txt restoration)

## دورة 2026-08-20 (02:08 UTC / 5:08 فجرًا القاهرة)
- الحلقة 23 "الفراغ ليس فارغًا! 3 حقائق صادمة عن الفضاء": produced كامل (1080x1920، 38.8s، narration23 Charon 40.3s، 4 صور 1440x2560) في test_run/ وdocs/episode23/ + نشر IG https://www.instagram.com/reel/DcPp7Srj48d/
- لا أخطاء نشر؛ YT/FB/Telegram معطلة بيئيًا فقط (secrets.txt غائب منذ 2026-08-15) → streakSafe 19، streakRisky 0
- topic_library.json: ep23 = produced؛ الحلقة التالية queued = ep26 (الجبال) — بعد استبدال موضوعي ep26 (القمر — مكرر مع ep19/21) وep27 (الصوت — مكرر مع ep20) بموضوعين جديدين (الجبال، السرعة)
- TikTok: صفحة المطورين "No access — login required"؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14

## دورة 2026-08-19 (21:16 UTC / 12:16م ليلًا القاهرة)
- الحلقة 21 "البرق يضرب نفس المكان! 3 حقائق صادمة ستصدمك": produced كامل (1080x1920، 35.7s، narration21 Charon 37.2s بوتيرة أبطأ، 4 صور 1440x2560) في test_run/ وdocs/episode21/ + نشر IG https://www.instagram.com/reel/DcPIZ58gChY/
- لا أخطاء نشر؛ YT/FB/Telegram معطلة بيئيًا فقط (secrets.txt غائب منذ 2026-08-15) → streakSafe 18، streakRisky 0
- TikTok: صفحة المطورين "No access — login required"؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14
- topic_library.json: ep21 = produced; الحلقة التالية queued = ep22 (العين المجردة)

## دورة 2026-08-19 (15:49 UTC / ~6:49م القاهرة)
- الحلقة 20 "صوتك لا يُسمع في الفضاء! 3 حقائق صادمة عن الصوت": produced كامل (1080x1920، 30.0s، narration20.wav Charon 31.5s، 4 صور 1440x2560) في test_run/ وdocs/episode20/ + نشر IG https://www.instagram.com/reel/DcOi8dzii3P/
- لا أخطاء نشر؛ YT/FB/Telegram معطلة بيئيًا فقط (secrets.txt غائب منذ 2026-08-15) → streakSafe 17، streakRisky 0
- TikTok: صفحة المطورين "No access — login required"؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14
- topic_library.json: ep20 = produced; الحلقة التالية queued = ep21 (البرق)
## دورة 2026-08-19 (09:19 UTC / 12:19م القاهرة)
- الحلقة 19 "القمر يبتعد عنا كل ثانية! 3 أسرار عن القمر لم تسمعها": produced كامل (1080x1920، 36.4s، narration19.wav Charon 37.9s، 4 صور 1440x2560) في test_run/ وdocs/episode19/ + نشر IG https://www.instagram.com/reel/DcN3RU1EY53/
- لا أخطاء نشر؛ YT/FB/Telegram معطلة بيئيًا فقط (secrets.txt غائب منذ 2026-08-15) → streakSafe 16، streakRisky 0
- TikTok: صفحة المطورين "No access — login required"؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14
- topic_library.json: ep19 = produced; الحلقة التالية queued = ep20 (الصوت)

## دورة 2026-08-19 (03:00 UTC / 6 صباحًا القاهرة)
- الحلقة 18 "دمك فيه نجوم حرفيًا! 3 حقائق صادمة عن الحديد في جسمك": produced كامل (1080x1920، 46.4s، narration18b.wav Charon 47.9s بوتيرة أبطأ، 4 صور 1440x2560) في test_run/ وdocs/episode18/ + نشر IG https://www.instagram.com/reel/DcNNO3tAevH/
- لا أخطاء نشر؛ YT/FB/Telegram معطلة بيئيًا فقط (secrets.txt غائب منذ 2026-08-15) → streakSafe 15، streakRisky 0
- TikTok: صفحة المطورين "No access — login required"؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14
- topic_library.json: ep18 = produced; الحلقة التالية queued = ep19 (القمر)
- history:
  - date: 2026-08-18 (scheduled run): episode 16 "ماء جسمك عمره 4 مليارات سنة! 3 حقائق صادمة عن الماء" fully produced (1080x1920, 34.5s, narration 36.0s, 4 images 1440x2560) — no publish this run; YT/FB/Telegram deferred (secrets.txt missing), IG pending user confirmation on Manus card
  - date: 2026-08-18 (morning, 6am Cairo)
    platform: Instagram (YT/FB/Telegram deferred — secrets file missing in scheduled session)
    video: "خريطة جوجل أصلها عربي! 3 حقائق صادمة ستدهشك"
    url: https://www.instagram.com/reel/DcKnOPslFoe/
    status: published-public
  - date: 2026-08-17 (night)
    platform: Instagram (deferred)
    video: "خريطة جوجل أصلها عربي! 3 حقائق صادمة ستدهشك" (episode 15, pending-images — quota exhausted)
    url: pending
    status: production-partial
  - date: 2026-08-17 (evening)
    platform: Instagram
    video: "قطتك أقوى بكثير مما تظن! 3 حقائق صادمة ستصدمك"
    url: https://www.instagram.com/reel/DcJV2K1ino9/
    status: published-public
  - date: 2026-08-17
    platform: Instagram
    video: "لغتك أقوى من أن تتخيل! 3 حقائق صادمة عن العربية"
    url: https://www.instagram.com/reel/DcIsD3ikduQ/
    status: published-public
  - date: 2026-08-17
    platform: Instagram
    video: "الوقت يسير في اتجاهين! 3 مفارقات صادمة ستصدمك"
    url: https://www.instagram.com/reel/DcIr8VxjRCi/
    status: published-public
  - date: 2026-08-16
    platform: Instagram
    video: "تحت قدميك إمبراطورية كاملة! 3 حقائق صادمة عن عالم النمل"
    url: https://www.instagram.com/reel/DcHahryiU2D/
    status: published-public
  - date: 2026-08-16
    platform: Instagram
    video: "داخل جسمك شيفرة كونية! 3 أسرار في حمضك النووي ستدهشك"
    url: https://www.instagram.com/reel/DcHanMzlU8A/
    status: published-public
  - date: 2026-08-14
    platform: YouTube
    video: "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة"
    url: https://www.youtube.com/watch?v=KsPu75budwA
    status: published-public
  - date: 2026-08-14
    platform: Instagram
    video: "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة"
    url: https://www.instagram.com/reel/DcB9PhLiYxg/
    status: published-public
  - date: 2026-08-14
    platform: Facebook
    video: "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة"
    url: https://www.facebook.com/reel/29350563061210067/
    status: published-public
  - date: 2026-08-14
    platform: YouTube
    video: "قلبك ينبض 2.5 مليار مرة! 3 حقائق ستصدمك"
    url: https://www.youtube.com/watch?v=YDWrSeMH4o8
    status: published-public
  - date: 2026-08-14
    platform: Instagram
    video: "قلبك ينبض 2.5 مليار مرة! 3 حقائق ستصدمك"
    url: https://www.instagram.com/reel/DcCLwsYEWd5/
    status: published-public
  - date: 2026-08-14
    platform: Facebook
    video: "قلبك ينبض 2.5 مليار مرة! 3 حقائق ستصدمك"
    url: https://www.facebook.com/1265727539958933/videos/122103892671434391
    status: published-public
  - date: 2026-08-15
    platform: YouTube
    video: "عينك تكذب عليك كل يوم! 3 حقائق صادمة"
    url: https://www.youtube.com/watch?v=opuu9zPgN-w
    status: published-public
  - date: 2026-08-15
    platform: Instagram
    video: "عينك تكذب عليك كل يوم! 3 حقائق صادمة"
    url: https://www.instagram.com/reel/DcCW2HdEanZ/
    status: published-public
  - date: 2026-08-15
    platform: Facebook
    video: "عينك تكذب عليك كل يوم! 3 حقائق صادمة"
    url: https://www.facebook.com/1265727539958933/videos/122103941919434391
    status: published-public
  - date: 2026-08-15
    platform: YouTube
    video: "3 أكاذيب عن ذاكرتك"
    url: https://www.youtube.com/watch?v=fm7Y0h1YBVg
    status: published-public
  - date: 2026-08-15
    platform: Instagram
    video: "3 أكاذيب عن ذاكرتك"
    url: https://www.instagram.com/reel/DcCYJ1TDuvK/
    status: published-public
  - date: 2026-08-15
    platform: Facebook
    video: "3 أكاذيب عن ذاكرتك"
    url: https://www.facebook.com/1265727539958933/videos/122103948783434391
    status: published-public
  - date: 2026-08-15
    platform: Instagram (YT/FB/Telegram deferred — secrets file missing in new session; full video produced)
    video: "دماغك يستيقظ وأنت نائم! 3 اكتشافات صادمة عن النوم"
    url: https://www.instagram.com/reel/DcDij0miryG/
    status: published-public
  - date: 2026-08-15
    platform: Pending all (secrets file missing; video produced, no publish attempt to avoid errors)
    video: "أحلامك ليست عشوائية! 3 أسرار علمية ستصدمك"
    url: none yet
    status: produced
  - date: 2026-08-16
    platform: Instagram (YT/FB/Telegram deferred — secrets file missing in scheduled session)
    video: "أحلامك ليست عشوائية! 3 أسرار علمية ستصدمك"
    url: https://www.instagram.com/reel/DcFdUQGjgnC/
    status: published-public
  - date: 2026-08-16
    platform: Instagram (YT/FB/Telegram deferred — secrets file missing in scheduled session)
    video: "المحيطات تخفي أسرارًا مرعبة! 3 حقائق لن تصدقها"
    url: https://www.instagram.com/reel/DcFeX05jNsp/
    status: published-public
  - date: 2026-08-16
    platform: Instagram (YT/FB/Telegram deferred — secrets file missing in scheduled session)
    video: "شمسنا ليست ما تظن! 3 حقائق صادمة ستغير نظرتك إليها"
    url: https://www.instagram.com/reel/DcGHbbVgOG0/
    status: published-public
  - date: 2026-08-15
    platform: Instagram (YT/FB/Telegram deferred — secrets file missing in scheduled session)
    video: "الجاذبية ليست قوة! 3 أسرار ستقلب فهمك رأسًا على عقب"
    url: https://www.instagram.com/reel/DcE1eNEDLX5/
    status: published-public
  - date: 2026-08-18 (15:08 UTC / 6:08 PM Cairo)
    platform: Instagram
    video: "ماء جسمك عمره 4 مليارات سنة! 3 حقائق صادمة عن الماء" (ep16)
    url: https://www.instagram.com/reel/DcL5ZjuFStQ/
    status: published-public
  - date: 2026-08-18 (21:30 UTC / 11:30 PM Cairo)
    platform: Instagram (YT/FB/Telegram deferred — secrets.txt missing in scheduled sandbox, same constraint as 2026-08-15/16/18-morning runs)
    video: "نحلة تقهر الموت! 3 أسرار عن نحل العسل ستدهشك" (ep17)
    url: https://www.instagram.com/reel/DcMl5jFDqjC/
    status: published-public
