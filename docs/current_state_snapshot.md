# Snapshot — XDAW NOVA Auto-Publish System (2026-08-15)

## المهمة الحالية (الآن)
المستخدم طلب: بناء خطة النشر الذاتي الكاملة + تشغيلها + حفظ كل شيء في GitHub لحظة بلحظة. خطتي المنفذة:
1. مكتبة مواضيع topic_library.json (20+ موضوعًا)
2. نظام إنتاج تلقائي produce_next_episode.py
3. نظام نشر publish_all.py + notify_telegram.py
4. توثيق شامل GitHub (README + حالة) — أي شات جديد يفهم من المستودع فقط
5. تحديث الجدول الدوري (10ص و4م Cairo) بنظام كامل: إنتاج + نشر + تلجرام + فحص TikTok
6. حلقة 5 (أسرار النوم): أُنتجت كاملة في 2026-08-15 — سيناريو + narration (Charon, 44.1s) + 4 صور + video 1080x1920 42.6s، ونُشرت على Instagram

## روابط المنشورات حتى الآن (كلها منشورة علنًا)
| ep | YT | IG | FB |
|---|---|---|---|
| 1 | KsPu75budwA | DcB9PhLiYxg | 29350563061210067 |
| 2 | YDWrSeMH4o8 | DcCLwsYEWd5 | 122103892671434391 |
| 3 | opuu9zPgN-w | DcCW2HdEanZ | 122103941919434391 |
| 4 | fm7Y0h1YBVg | DcCYJ1TDuvK | 122103948783434391 |
| 5 | — pending (secrets غير متوفرة في جلسة 2026-08-15) | DcDij0miryG | — pending (نفس السبب) |
| 6 | — pending | DcFdUQGjgnC | — pending |
| 7 | — pending | DcE1eNEDLX5 | — pending |
| 8 | — pending | DcFeX05jNsp | — pending |
| 9 | — pending | DcGHbbVgOG0 | — pending |
| 10 | — pending | DcHanMzlU8A | — pending |
| 11 | — pending | DcHahryiU2D | — pending |
| 12 | — pending | DcIr8VxjRCi | — pending |
| 13 | — pending | DcIsD3ikduQ | — pending |
| 14 | — pending | DcJV2K1ino9 | — pending |

## الأسرار (في /home/ubuntu/secrets.txt — لا تُعرض)
- YOUTUBE_CLIENT_ID/SECRET (77905jqkefcbanqrqnvm1p4ogl5n229) + YOUTUBE_REFRESH_TOKEN دائم
- FACEBOOK_PAGE_ACCESS_TOKEN (long-lived دائم) — PAGE_ID 1265727539958933
- TELEGRAM_BOT_TOKEN (bot xDaw_NOVA, id 8879827171) + chat_id 1890579200 (verified)
- TIKTOK_CLIENT_KEY awa32n4co6o1vqbm (Production app قيد المراجعة: xDaW NoVa 7673768835363145748)
- TIKTOK_SANDBOX_CLIENT_KEY sbawlacpenz2vl9ygx
- META_APP_ID 2828503350861658 / META_APP_SECRET
- Instagram: عبر manus-mcp-cli (create_instagram) — النشر يمر تلقائيًا بدون بطاقة تأكيد

## سكربتات أساسية في /home/ubuntu/test_run/
- build_episode.sh <ep> <s1> <s2> <s3> <s4> <narration.wav> → episode{N}-final.mp4 (1080x1920 30fps xfade)
- upload_youtube_ep{N}.py — resumable upload مع refresh token
- upload_fb_reel_ep{N}.py — video_reels start/transfer/finish (fb_page_token.txt = secrets token)
- IG: manus-upload-file ثم manus-mcp-cli create_instagram (type=reels, media=[{type:video, media_url}], caption, share_to_feed=true)
- notify_telegram.py publish "<title>" "<yt>" "<ig>" "<fb>" [tiktok]
- publish_all.py <ep> — YT+FB تلقائي + تلجرام (IG عبر shell منفصل)
- produce_next_episode.py — يختار ep التالي من topic_library.json ويبنيه
- topic_library.json — ep5 pending-narration (تم إنتاج narration الآن)، ep6-25 queued
- ep3-5-scripts.md، episode{3,4,5}-script.md، narration5.wav، ep5-scene*.png، episode5-final.mp4 (يجب نسخها للمستودع)

## TikTok
- التطبيق In Review (In review منذ 2026-08-14). فحص 2026-08-17 18:18 القاهرة: صفحة المطورين تتطلب تسجيل دخول مجدد (فقدت الجلسة) — الحالة المسجلة تبقى In review.
- بعد القبول: ربط حساب المستخدم الحقيقي عبر OAuth (Client Key awa32n4co6o1vqbm) ونشر عام.

## آخر تشغيل (2026-08-17 مساءً — مجدول)
الحلقة 14 «قطتك أقوى بكثير مما تظن! 3 حقائق صادمة ستصدمك» (القطط): produced كامل (1080x1920، 41.7s، narration 43.2s، 4 صور) ونُشرت على Instagram فقط (DcJV2K1ino9). YouTube/Facebook/Telegram معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt (نفس الوضع منذ 2026-08-15). الحلقات ep5-14 معلقة للنشر الكامل على YT/FB/Telegram عند استعادة الأسرار.

## GitHub (داشداش داوسها داوسها — user DawshaX)
- Repo: DawshaX/daousha (private, main)
- آخر commits قبل هذه الجلسة: 000a226 (SEO + جدول 4x/يوم), d2cb058 (نظام v2), 9a5e9fc (ep3+4)
- بعد جلسة 2026-08-15: commit جديد يشمل episode5 + topic_library محدثة + docs محدثة
- gh CLI مسجل وناجح الآن

## الجدول التلقائي (manus-config schedule)
- uid 3D5f3DzeyCRsFedeAoWrdp، cron 0 10,16 Africa/Cairo
- playbook: فحص TikTok قبل النشر → إنتاج ep التالي → نشر YT/FB → IG → تلجرام → تحديث GitHub/docs
- تحديث playbook سيتم عبر: manus-config schedule update --uid ... (playbook من ملف)

## ملاحظات تشغيل
- fb_page_token.txt يجب أن يكون دائمًا مفتاح secrets FACEBOOK_PAGE_ACCESS_TOKEN (التوكن القديم منتهي)
- جلسة 2026-08-15: الحلقة 5 أُنتجت ونُشرت IG؛ YT/FB/Telegram متوقفة بسبب غياب /home/ubuntu/secrets.txt في الجلسة الجديدة — طلب من المستخدم استعادة الملف
- الأسلوب البصري: 9:16 dark navy + amber glow، نص عربي عريض أبيض، عناوين «3 حقائق/أسرار/أكاذيب»

## دورة 2026-08-15 (جدولة — تشغيل مجدول مسائي)
- الحلقة 7: produced كامل (1080x1920، 42.1s، narration 43.6s، 4 صور) في docs/episode7/ وtest_run/. topic_library.json محدثة: ep7 = produced. نُشرت IG: https://www.instagram.com/reel/DcE1eNEDLX5/
- YT/FB/Telegram: متوقفة بسبب غياب /home/ubuntu/secrets.txt في جلسة الجدولة.
- TikTok: صفحة المطورين تتطلب تسجيل دخول (No access)؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5 وep6 وep7.
- المطلوب من المستخدم: إعادة رفع secrets.txt (أو لصقه عبر الشات)، ثم يكمل النشر تلقائيًا دون إعادة إنتاج.
- الحلقة 8 (التالية في المكتبة: المحيطات): إن لم تُنشر YT/FB للحلقات 5-7 قبلها، تبقى الحلقة 5 هي أولوية النشر القادم.

## دورة 2026-08-16 (جدولة)
- الحلقة 6 (أحلامك ليست عشوائية!): نُشرت IG — https://www.instagram.com/reel/DcFdUQGjgnC/
- الحلقة 8 (المحيطات): أُنتجت بالكامل في هذه الدورة (سيناريو + narration Charon 36.6s + 4 صور + فيديو 1080x1920، 35.1s) ونُشرت IG — https://www.instagram.com/reel/DcFeX05jNsp/
- YT/FB/Telegram: ما تزال معطلة بسبب غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس 2026-08-15). الحلقات المعلقة: ep5، ep6، ep7.
- TikTok: صفحة المطورين تعرض No access (تحتاج تسجيل دخول مطور في المتصفح)؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: رُقّي level 1→2، dailyCap 4→6 (streakSafe وصل 5).

## دورة 2026-08-16 (جدولة — صباح 09:00 UTC)
- الحلقة 9 (شمسنا ليست ما تظن! 3 حقائق صادمة ستغير نظرتك إليها): أُنتجت بالكامل — سيناريو (336 حرفًا) + narration Charon 48.2s + 4 صور 1440x2560 + فيديو 1080x1920، 46.7s، 22.2MB في docs/episode9/. topic_library.json محدثة: ep9 = produced. نُشرت IG: https://www.instagram.com/reel/DcGHbbVgOG0/
- YT/FB/Telegram: ما تزال معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5، ep6، ep7.
- TikTok: صفحة المطورين تعرض No access (تسجيل دخول مطلوب)؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: level 2، dailyCap 6، streakSafe 5+ (لا أخطاء نشر اليوم — النشر الكامل فقط IG).
- المطلوب من المستخدم: إعادة رفع secrets.txt (عبر الشات أو الجلسة اليدوية)، ثم يكمل نشر ep5-7 على YT/FB + إشعارات تلجرام تلقائيًا دون إعادة إنتاج.

## دورة 2026-08-16 (جدولة — مساءً 15:00 UTC / 18:00 القاهرة)
- الحلقة 10 (داخل جسمك شيفرة كونية! 3 أسرار في حمضك النووي ستدهشك): produced سابقًا — فيديو 1080x1920، 45.9s، narration 47.4s، 4 صور في docs/episode10/. نُشرت IG: https://www.instagram.com/reel/DcHanMzlU8A/
- الحلقة 11 (تحت قدميك إمبراطورية كاملة! 3 حقائق صادمة عن عالم النمل): أُنتجت بالكامل في هذه الدورة — سيناريو (328 حرفًا) + narration Charon 51.4s + 4 صور 1440x2560 + فيديو 1080x1920، 50.0s في test_run/ + docs/episode11/. topic_library.json محدثة: ep11 = produced. نُشرت IG: https://www.instagram.com/reel/DcHahryiU2D/
- YT/FB/Telegram: ما تزال معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5، ep6، ep7، ep8، ep9، ep10، ep11.
- TikTok: صفحة المطورين تعرض No access (تسجيل دخول مطلوب)؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: level 2، dailyCap 6، streakSafe 7 (لا أخطاء نشر اليوم).
- المطلوب من المستخدم: إعادة رفع secrets.txt (عبر الشات أو الجلسة اليدوية)، ثم يكمل نشر ep5-11 على YT/FB + إشعارات تلجرام تلقائيًا دون إعادة إنتاج.
- الحلقة التالية في المكتبة: ep12 (الوقت — 3 مفارقات غريبة عن الوقت).

## دورة 2026-08-17 (جدولة — 12:00 القاهرة)
- الحلقة 12 (الوقت يسير في اتجاهين! 3 مفارقات صادمة ستصدمك): أُنتجت بالكامل في هذه الدورة — سيناريو (304 حرفًا) + narration Charon 43.5s + 4 صور 1440x2560 + فيديو 1080x1920، 42.0s في test_run/ + docs/episode12/. topic_library.json محدثة: ep12 = produced.
- الحلقة 13 (لغتك أقوى من أن تتخيل! 3 حقائق صادمة عن العربية): produced كامل في هذه الدورة — سيناريو (305 حرفًا) + narration Charon 45.0s + 4 صور 1440x2560 + فيديو 1080x1920، 43.5s في test_run/ + docs/episode13/. topic_library.json محدثة: ep13 = produced.
- IG: نُشرت ep12 — https://www.instagram.com/reel/DcIr8VxjRCi/ ، وep13 — https://www.instagram.com/reel/DcIsD3ikduQ/ (موثقة عبر get_post_list).
- YT/FB/Telegram: ما تزال معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5 إلى ep13.
- TikTok: صفحة المطورين تعرض No access (تسجيل دخول مطلوب)؛ الحالة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: level 2، dailyCap 6، streakSafe 9 (لا أخطاء نشر اليوم — النشر IG).
- ملاحظة إيجابية: منشور خارجي من اليوم 2026-08-17 03:40 UTC «الساعة تخدعك كل يوم! 3 مفارقات صادمة عن الوقت» (reel DcIGBuSE61W، 3 إعجابات) يظهر في get_post_list — يبدو أنه نشر سابق مستقل عن هذه الدورة. الحلقتان 12 و13 مختلفتان موضوعيًا (الوقت النسبي/الجاذبية) ولا تكرار محتوى.
- المطلوب من المستخدم: إعادة رفع secrets.txt (عبر الشات أو جلسة يدوية) لإكمال نشر ep5-13 على YT/FB + إشعارات تلجرام، ولعودة الإشعار التلقائي بعد كل دورة.
## دورة 2026-08-17 (منتصف الليل — ~00:15 القاهرة)
- الحلقة 15 (خريطة جوجل أصلها عربي! 3 حقائق صادمة ستدهشك): إنتاج جزئي — سيناريو (312 حرفًا) + narration15.wav (32.4s Charon) + ep15-scene1.png في test_run/ + docs/episode15/. حصة توليد الصور نفدت (20/20 خطة مجانية) بعد المشهد الأول: تبقى المشاهد 2-4 ثم بناء الفيديو final في الدورة التالية. topic_library.json محدثة: ep15 = pending-images. لا تكرار مع ep12/ep13 (موضوع مختلف: اختراعات إسلامية).
- YouTube/Facebook/Instagram/TikTok: لم يُنشر شيء هذه الدورة (الفيديو غير مكتمل + YT/FB معطلتان بسبب غياب secrets.txt).
- YT/FB/Telegram: ما تزال معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5 إلى ep14.
- TikTok: صفحة المطورين تعرض No access (تسجيل دخول مطلوب)؛ الحالة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: level 2، dailyCap 6، streakSafe 11 (لا أخطاء نشر هذه الدورة — التأجيلات بيئية فقط: secrets.txt وحصة الصور).
- المطلوب من المستخدم: (1) إعادة رفع secrets.txt لإكمال نشر ep5-14 على YT/FB + إشعارات تلجرام، (2) ترقية الخطة إن أراد تجدد حصة الصور يوميًا أسرع لإكمال مشاهد الحلقات المتبقية.

## دورة 2026-08-20 (10:20 UTC / 1:20 ظهرًا القاهرة — تشغيل مجدول)
- لا إنتاج جديد: حصة توليد الصور (20/20) وتوليد الفيديو (1/1) مستهلكتان حتى إعادة التعيين المتوقعة 00:00 UTC (Aug 21). الحلقة 27 (السرعة) تبقى produced-partial — سيناريو AR+EN (مصحح: «تابع دوشة» / "Follow Dawsha") + narration27-ar.wav (45.8s) + narration27-en.wav (45.4s) في docs/episode27/ وtest_run/episode27/؛ المشاهد الثمانية (4 AR + 4 EN) مؤجلة حتى 00:00 UTC.
- ملاحظة: scene1_ar_clip.mp4 في test_run/episode27/ (10s، 720x1280) لا يناسب موضوع السرعة (مخلفات ep26) — يُستبدل عند الإنتاج.
- YT/FB/Telegram: ما تزال معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt (منذ 2026-08-15).
- IG cooldown: نافذة ep27 تفتح 11:23 UTC (4 ساعات بعد منشور ep26 07:23 UTC) — لن تستخدم إلا بعد إنتاج الفيديو.
- TikTok: Rejected رسميًا (2026-08-19 9:15 AM) — لا نشر حتى قرار المستخدم.
- السلم: level 2، dailyCap 6، streakSafe 22.
- المطلوب من المستخدم: (1) إعادة رفع secrets.txt (YT/FB/Telegram معلقة منذ 08-15)، (2) الترقية لتحسين حصص توليد الصور/الفيديو (تجديد أسرع أو حد أعلى)، (3) البتّ في TikTok (إعادة تقديم أو الاكتفاء بدونها).

## دورة 2026-08-18 (مساءً — ~11:30 القاهرة، تشغيل مجدول)
- الحلقة 17 (نحلة تقهر الموت! 3 أسرار عن نحل العسل ستدهشك): produced كامل في هذه الدورة — سيناريو (334 حرفًا) + narration Charon 40.1s + 4 صور 1440x2560 (dark navy + amber glow) + فيديو 1080x1920، 38.6s في test_run/ + docs/episode17/. topic_library.json محدثة: ep17 = produced. نُشرت IG: https://www.instagram.com/reel/DcMl5jFDqjC/
- YT/FB/Telegram: ما تزال معطلة بيئيًا بسبب غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5 إلى ep17.
- TikTok: صفحة المطورين تعرض No access (تسجيل دخول مطلوب)؛ الحالة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: level 2، dailyCap 6، streakSafe 14 (لا أخطاء نشر هذه الدورة — النشر IG).
- المطلوب من المستخدم: إعادة رفع secrets.txt (عبر الشات أو جلسة يدوية) لإكمال نشر ep5-17 على YT/FB + إشعارات تلجرام.
- الحلقة التالية في المكتبة: ep18 (الحديد في جسمك — 3 حقائق صادمة عن جسمك).

## دورة 2026-08-20 (05:05 UTC / 8:05 صباحًا القاهرة — تشغيل مجدول)
- لا إنتاج جديد هذه الدورة: حصة توليد الصور المجانية نفدت (20/20) — أُنفدت في دورة 03:35 UTC نفسها (ep26: 4 صور). الحلقة 27 (السرعة) تبقى produced-partial: سيناريو AR+EN + narration27-ar (45.8s) + narration27-en (45.4s) جاهزة؛ تبقى 8 صور (4 AR + 4 EN) ثم بناء الفيديوين ونشر AR+EN على IG.
- لا نشر هذه الدورة: (1) YT/FB/Telegram معطلة بيئيًا (secrets.txt غائب منذ 2026-08-15)، (2) آخر منشور IG (ep26) الساعة 03:21 UTC وحكم «قطعتين بفارق ≥4 ساعات» يمنع نشر IG قبل ~07:21 UTC.
- حلقات IG المعلقة غير موجودة (آخر حالة: ep23 وep26 منشورتان IG). الحلقات المعلقة للنشر الكامل على YT/FB/Telegram كما هي: ep5 إلى ep27 (ما عدا ep22/24/25 المنشورة كاملًا).
- TikTok: «No access — login required» مجددًا؛ الحالة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
- السلم: level 2، dailyCap 6، streakSafe 21 (تأجيلات بيئية فقط — حصة صور + secrets + حد 4 ساعات؛ لا أخطاء نشر).
- المطلوب من المستخدم: (1) ترقية الخطة لتجديد حصة الصور اليومية أسرع — ep27 تحتاج 8 صور فقط ثم يكتمل النشر AR+EN، (2) إعادة رفع secrets.txt (عبر الشات أو جلسة يدوية) لإكمال نشر ep5-27 على YT/FB + إشعارات تلجرام.
