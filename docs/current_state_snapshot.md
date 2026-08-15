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
- التطبيق In Review (In review منذ 2026-08-14). الجدول الدوري يفحص (10ص/4م) وينشر لحظة القبول + تلجرام.
- بعد القبول: ربط حساب المستخدم الحقيقي عبر OAuth (Client Key awa32n4co6o1vqbm) ونشر عام.

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

## دورة 2026-08-15 (مساءً — تشغيل مجدول)
| الحلقة | الموضوع | YT | IG | FB |
|---|---|---|---|---|
| 6 | أحلامك ليست عشوائية! 3 أسرار علمية ستصدمك | pending (secrets) | pending (حُفظت للنشر الكامل مع YT/FB) | pending (secrets) |
- الحلقة 6: produced كامل (1080x1920، 36.4s، narration 37.8s) في docs/episode6/ وtest_run/. topic_library.json محدثة: ep6 = produced.
- الحلقة 5: YT/FB/Telegram ما زالت pending — تتطلب استعادة /home/ubuntu/secrets.txt.
- TikTok: In review (صفحة المطورين تتطلب تسجيل دخول — لم تُفتح). عند القبول: ربط OAuth ونشر فوري.
- المطلوب من المستخدم: إعادة رفع secrets.txt في جلسة جديدة أو لصقه، ثم يكمل النشر تلقائيًا دون إعادة إنتاج.
