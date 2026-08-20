# ملاحظات دورة 2026-08-18 (03:0x UTC = 06:0x القاهرة — نشرة 6 صباحًا)

## الحلقة المنفذة
- ep15: «خريطة جوجل أصلها عربي! 3 حقائق صادمة ستدهشك» — الموضوع: 3 اختراعات إسلامية غيّرت العالم (الإدريسي 1154، الخوارزمي، ابن سينا).
- الحالة السابقة: pending-images (السيناريو 312 حرفًا + narration15.wav 32.4s Charon + scene1 موجودون منذ 2026-08-17؛ المشاهد 2-4 مؤجلة لانتهاء حصة الصور).
- هذه الدورة: تُولّدت المشاهد 2 و3 و4 بنفس الأسلوب (navy #0B1B33 + amber #E8A33D، عنوان عربي عريض). المشهد 3 احتاج إعادة توليد مرتين بسبب خطأ إملائي (الخوارززمي) ثم «الخوارززي» — النسخة الثالثة صحيحة: «الخوارزمي أسس الحاسوب!» + «كلمة ألجورزم من اسمه».
- الفيديو النهائي: episode15-final.mp4 — 1080×1920، 30.9s، 30fps، تعليق كامل، تحقق من الجودة. الحالة في topic_library.json: produced → published-ig.

## النشر هذه الدورة
- Instagram: منشور علنًا ✅ https://www.instagram.com/reel/DcKnOPslFoe/ (Reel، share_to_feed=true).
- YouTube: ⏸ معلق — /home/ubuntu/secrets.txt غائب عن sandbox الجدولة (نفس السبب منذ 2026-08-15؛ سكربت upload_youtube_ep15.py جاهز في test_run/).
- Facebook: ⏸ معلق — نفس السبب (fb_page_token.txt يُقرأ من secrets.txt).
- Telegram: ⏸ معلق — نفس السبب (notify_telegram.py يقرأ TELEGRAM_BOT_TOKEN من secrets.txt).
- القرار وفق playook: YT/FB/Telegram تعلق بيئيًا فقط؛ لا خفض streakSafe.

## فحص TikTok (2026-08-18، 03:09 UTC)
- https://developers.tiktok.com/app/7673768835363145748/pending → «No access — You need to login» (جلسة المتصفح غير مسجّلة الدخول، مثل الدورات السابقة).
- آخر حالة موثقة: Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تعديل إعدادات. عند القبول (Live): ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا.

## سلّم النشر
- level 2، dailyCap 6، streakSafe كان 11 (قبل هذه الدورة)، streakRisky 0.
- هذه الدورة: إنتاج + نشر IG بنجاح، لا أخطاء نشر ولا إشارات حظر؛ YT/FB/Telegram تعليق بيئي موثق (لا يحتسب خطأ). streakSafe → 12، level يبقى 2، dailyCap يبقى 6.

## حلقات معلقة للنشر الكامل (YT/FB/Telegram) عند استعادة secrets.txt
- ep5، ep6، ep7، ep8، ep9، ep10، ep11، ep12، ep13، ep14، ep15 (كلها produced/published-ig) — الفيديوهات موجودة في test_run/ أو docs/episodeN/ ولا تحتاج إعادة إنتاج.
