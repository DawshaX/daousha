# Snapshot الحالة الحالية — 2026-08-14 (مرحلة إنتاج الحلقة 2 + نشر + مراقبة TikTok)

## ما قرر المستخدم (آخر رسالة)
- "ننشر الكل الآن، الفيديوهات تتحول إلى علني، التطويرات على كل المنصات"
- قررنا إنتاج **حلقة جديدة (الحلقة 2)** بدل إعادة نشر الحلقة 1.
- المرحلة اللاحقة: مراقبة دورية لقبول TikTok + إشعار تلجرام عند القبول + لاحقًا جدول مزامنة ونشر تلقائي دوري.

## الحلقة 2 — ✅ أُنتجت بنجاح
- الفيديو النهائي: /home/ubuntu/test_run/episode2-final.mp4 — h264, 1080x1920, 51.83s, 22MB
- السكربت المعدل: build_episode2.sh (مشتق من build_video.sh)
- صور المشاهد: ep2-scene1-4-heart-*.png — التعليق الصوتي: episode2-narration.wav (53.32s، صوت Charon عربي)
- العناوين: YT «قلبك ينبض 2.5 مليار مرة! 3 حقائق ستصدمك»، IG «قلبك ينبض حتى بعد خروجه من جسمك! ❤️ #حقائق #علوم»، FB/TikTok نفس عنوان YouTube

## الحالة الحالية (الطلب الجديد: نشر تلقائي كامل + جدولة شهرية)
- المستخدم طلب: نظام نشر تلقائي بلا تدخل يدوي + جدولة فيديوهات لشهر قدام. هذا الجدول «نوع واحد فقط» — جداول وأنواع أخرى قادمة لاحقًا.
- GitHub ✅ أعيد ربطه: دُفع commit 564af0d (Episode 2 auto-published).
- الحلقة 3 (العين) ✅ صورها الأربعة جاهزة: ep3-scene1-eye-optical / ep3-scene2-blind-spot / ep3-scene3-iris-color / ep3-scene4-brain-vision.png — بنفس أسلوب ep2-scene*.png كمرجع.
- الحلقات 4 (الذاكرة) و5 (النوم): سيناريوهاتهما في ep3-5-scripts.md — بقى توليد صورها وتعليقها الصوتي وبناء فيديوهاتها.
- خطوات كل حلقة: 4 صور → build_video.sh (زوم بان 1080x1920 30fps + xfade 0.5s + narration + موسيقى) → نشر YT (upload_youtube_ep2.py كمرجع، YOUTUBE_REFRESH_TOKEN دائم) → FB (upload_fb_reel_ep2.py كمرجع، long-lived token دائم) → IG (create_instagram via manus-mcp-cli بmedia_url من manus-upload-file) → إشعار تلجرام chat_id=1890579200.
- الجدول التلقائي الحالي: uid 3D5f3DzeyCRsFedeAoWrdp، cron 0 10,16 Africa/Cairo، playbook محدّث بـ بند مراقبة قبول TikTok. عند القبول: إشعار تلجرام + ربط حساب المستخدم الحقيقي بالنشر المباشر على TikTok.
- منشورات اليوم: ep1 (KsPu75budwA, DcB9PhLiYxg, 29350563061210067)، ep2 (YDWrSeMH4o8, DcCLwsYEWd5, 122103892671434391).
- الحلقة 3 ✅ بُنيت: episode3-final.mp4 (45s) + narration 46.84s + build_episode.sh عام.
- الحلقة 4 ✅ بُنيت: episode4-final.mp4 (41.8s) + narration 43.28s.
- الحلقة 3 نُشرت: YouTube https://www.youtube.com/watch?v=opuu9zPgN-w ✅، Facebook post_id=122103941919434391 ✅ (post_id 1265727539958933_122103941919434391)، Instagram ⏳ (create_instagram via manus-mcp-cli بمُدخل type=reels, media=[{type:video, media_url}], caption — قد يحتاج تأكيد المستخدم في البطاقة).
- الحلقة 4 متبقية النشر بنفس السكربتات مع استبدال ep3→ep4 والعنوان «3 أكاذيب عن ذاكرتك اكتشفها العلماء!».
- ملاحظة FB: fb_page_token.txt كان يحتوي التوكن القديم المنتهي — استُبدل بمفتاح secrets.txt الدائم (FACEBOOK_PAGE_ACCESS_TOKEN).
- طلب المستخدم الجديد: حل مشكلة بطاقة تأكيد إنستجرام اليدوية — الحل: تطبيق Meta (XDAW NOVA Publisher, App ID 2828503350861658) يجب اجتياز Instagram Publishing App Review للنشر المؤتمت الكامل، مثل مسار TikTok. سيقدم الطلب ويقدم إشعار تلجرام عند القبول.
- عنوان ep4 للوحدات: IG caption مقترح «ذاكرتك تعاد كتابتها! ذكريات لم تحدث تتذكرها 🧠 #حقائق #علوم #داوسها».

## الحلقة 2 — تفاصيل النشر (نُسخة من سيناريو سابق)
- السيناريو: /home/ubuntu/test_run/episode2-script.md — موضوع القلب (2.5 مليار نبضة، ينبض خارج الجسم، 7500 لتر/يوم، لا يُصاب بالسرطان تقريبًا)
- عناوين النشر: YouTube «قلبك ينبض 2.5 مليار مرة! 3 حقائق ستصدمك»، IG «قلبك ينبض حتى بعد خروجه من جسمك! ❤️ #حقائق #علوم»، FB/TikTok نفس عنوان YouTube
- أسلوب الإنتاج (build_video.sh): 4 صور مشاهد → zoompan clips (1080x1920, 30fps) → xfade 0.5s → دمج مع narration wav + موسيقى → episode2-final.mp4
- صور الحلقة 1 السابقة كمرجع أسلوب: scene1-4-brain-*.png في /home/ubuntu/test_run
- الخطوات: 1) generate_image ×4 صور مشاهد، 2) generate_speech تعليق عربي، 3) تشغيل سكربت بناء الفيديو

## النشر على المنصات (تمت تجربته بنجاح على الحلقة 1)
- YouTube: python3 run_upload.py في /home/ubuntu/test_run (يسجل refresh token في secrets.txt ثم upload_youtube.main) — يحتاج تعديل مسار الفيديو والعنوان للحلقة 2
- Instagram: Manus MCP connector — create_instagram ينشر reel
- Facebook: upload_fb_reel.py — Resumable upload (start → rupload → finish بـ video_id)
- Telegram: notify_telegram.py (chat_id 1890579200، توكن من /home/ubuntu/secrets.txt) — يعمل (message_id 22)

## TikTok
- App xDaW NoVa (7673768835363145748) — Production / **In review** (قُدّم 2026-08-14)
- Sandbox: لا يتيح نشرًا عامًا (docs رسمية) — المستخدم قرر انتظار القبول ثم نشر عام
- المطلوب: مراقبة دورية لحالة القبول + إشعار تلجرام عند الموافقة
- لوحة التطبيق: https://developers.tiktok.com/app/7673768835363145748/pending
- API Direct Post بعد القبول: POST /v2/post/publish/video/init/ (source FILE_UPLOAD → upload_url صالح ساعة → PUT) ثم status/fetch — production client_key: awa32n4co6o1vqbm (sandbox: sbawlacpenz2vl9ygx)
- ملاحظة مهمة: even after approval, unaudited clients post in PRIVATE mode حتى اجتياز audit كامل

## أسرار
- /home/ubuntu/secrets.txt: كل المفاتيح (TIKTOK_CLIENT_KEY=awa32n4co6o1vqbm + SECRET, SANDBOX_CLIENT_KEY/SECRET, META_APP_ID=2828503350861658 + SECRET, YOUTUBE_CLIENT_ID + SECRET, FACEBOOK_PAGE_ACCESS_TOKEN دائم لا ينتهي, TELEGRAM_BOT_TOKEN, YOUTUBE_REFRESH_TOKEN, VITE_FORGE_URL)
- **لا نعرض القيم في المحادثة**
- Meta Ads act_1502752946625950 معطل — غير مطلوب للنشر العضوي

## المستودع
- /home/ubuntu/daousha-repo (github.com/DawshaX/daousha, main) — آخر commit 8e4f77f "TikTok: live-mode review submitted"
- وثائق: docs/platform-link-status.md + docs/publishing-ladder-state.md (محدثتان بآخر حالة)
- بعد النشر: حدّث الوثائق وcommit + push

## روابط المنشورات السابقة (الحلقة 1)
- YT: https://www.youtube.com/watch?v=KsPu75budwA
- IG: https://www.instagram.com/reel/DcB9PhLiYxg/
- FB: https://www.facebook.com/reel/29350563061210067/ (post 1265727539958933_122103790431434391)
- صفحة FB للنشر: Page ID 1265727539958933 (وليس profile 61593031750114 الشخصية)

## الجدول التلقائي الحالي
- uid 3D5f3DzeyCRsFedeAoWrdp — cron 0 10,16 * * * (توقيت القاهرة) — مهمة Manus scheduled

## ملاحظات المتصفح
- My Browser: الامتداد البصري يعطي 504 أحيانًا — انتظر 45-60 ثانية بين المحاولات. التنقل النصي (navigate/view) يعمل دائمًا.
- حسابات المستخدم: dawshaxlol@gmail.com (يوتيوب+انستجرام)، mahmeddia3000@gmail.com (Google Cloud مشروع xdaw-nova فقط)، فيسبوك "الله اكبر"/محمد ضياء (صفحة XDAW NOVA)

## حزمة الاسترجاع
- /home/ubuntu/xdaw-nova-restore-2026-08-14.zip (حزمة استرجاع كاملة من جلسة سابقة)
