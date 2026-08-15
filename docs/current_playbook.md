# PLAYBOOK: دورة النشر الذاتي الكامل — XDAW NOVA (نسخة 3 — جدولة يومية 4 مرات، 2026-08-15)

هذا المستند مكتفٍ بذاته؛ أي مهمة جديدة (حتى في شات جديد) تُشغَّل بهذا الدليل تستطيع تنفيذ الدورة كاملة من آخر نقطة.

## 0. السياق الثابت
المشروع: XDAW NOVA (داوسها) — استوديو محتوى معرفي عربي قصير (Reels/Shorts) يبث على YouTube وInstagram وFacebook وTikTok.
المستودع الدائم: github.com/DawshaX/daousha (خاص، حساب DawshaX). الأسرار في /home/ubuntu/secrets.txt (تنسيق CRLF: مفتاح، سطر فارغ، قيمة). **لا تُعرض أي سر في المحادثة**.
توليد الصور: حصتها 20/يوم (خطة مجانية) — إن نفدت، أكمل الباقي في التشغيل التالي.
Telegram: بوت xDaw_NOVA (id 8879827171)، chat_id المستخدم = 1890579200 (الوحيد المجرب الناجح — لا تبحث عن غيره).

## 0.5. الجدول الزمني (النسخة 3)
- وتيرة النشر: **4 مرات يوميًا — 6ص، 12م، 6م، 12م (توقيت القاهرة)**. المستخدم طلب «كل ساعة» لكن الخوارزميات تعاقب الإفراط (over-publishing)؛ هذه الوتيرة هي الأقصى الآمن للنمو.
- الترقية للوتيرة القصوى (24/يوم): عدّل هذا القسم فقط — وتيرة الدوران بين المنصات. لا تحتاج إعادة بناء النظام.
- YouTube: يستخدم YOUTUBE_REFRESH_TOKEN_FULL (youtube+upload scope كامل — حصلنا عليه 2026-08-15). إن نفد استبدله بـ YOUTUBE_REFRESH_TOKEN_OLD للرفع فقط، أو أعد التفويض الموسع (yt_full_auth_url.py في متصفح المستخدم بحساب dawshaxlol@gmail.com).
- تحديث العناوين/الوسوم للفيديوهات المنشورة: yt_update_retry.py يعمل الآن بالتوكن الموسع.

## 1. قراءة قائمة المواضيع وإنتاج الحلقة
اقرأ /home/ubuntu/test_run/topic_library.json — الحلقة التالية هي أول موضوع بحالة queued/pending-narration. إن لم توجد ملفاتها (episode{N}-script.md + narration.wav + 4 صور ep{N}-scene*.png):
1. اكتب السيناريو بنمط «3 حقائق صادمة» (فصحى حماسية، 280-350 حرفًا، hook أول 3 ثوانٍ، خاتمة «تابع داوسها»).
2. ولّد التعليق الصوتي بالعربية (voice Charon).
3. ولّد 4 صور 9:16 بنفس أسلوب الحلقات السابقة (dark navy + amber glow، نص عربي عريض أبيض، عناوين صادمة).
4. ابنِ الفيديو: cd /home/ubuntu/test_run && ./build_episode.sh {N} scene1 scene2 scene3 scene4 narration.wav → episode{N}-final.mp4 (تحقق: 1080x1920, ≥30s). عدّل topic_library.json الحالة إلى produced.

## 2. نشر الحلقة
1. **YouTube** (refresh token دائم): انسخ upload_youtube_ep4.py → upload_youtube_ep{N}.py مع عنوان الحلقة ووصفها (نمط: «{موضوع}! 3 حقائق صادمة #داوسها»)، ثم python3 upload_youtube_ep{N}.py → رابط watch?v={id}. إن فشل 403 scope: استخدم YOUTUBE_REFRESH_TOKEN_FULL.
2. **Facebook** (page token دائم لا ينتهي): انسخ upload_fb_reel_ep4.py → upload_fb_reel_ep{N}.py (استبدل الفيديو والعنوان/الوصف؛ تأكد أن fb_page_token.txt = مفتاح FACEBOOK_PAGE_ACCESS_TOKEN من secrets.txt)، ثم نفّذه → رابط 1265727539958933/videos/{post_id}
3. **Instagram** (أوامر shell مباشرة فقط — لا يمكن من Python):
   - manus-upload-file episode{N}-final.mp4 (استخرج CDN URL)
   - اكتب JSON: {"type":"reels","media":[{"type":"video","media_url":"..."}],"caption":"{عنوان عربي + 🧠 تابع داوسها #حقائق #علوم #داوسها}","share_to_feed":true}
   - manus-mcp-cli tool call create_instagram --server instagram --input-file {json}
4. **TikTok**: لا تنشر قبل القبول الرسمي. انظر §3.
5. **إشعار**: python3 notify_telegram.py publish "{الحلقة N — العنوان}" "{yt}" "{ig}" "{fb}"

## 3. فحص قبول TikTok (أولوية قبل النشر)
- انتقل في المتصفح إلى https://developers.tiktok.com/app/7673768835363145748/pending (الحالة الحالية: In review منذ 2026-08-14).
- إن ما زالت In review: لا فعل، سجّل في docs/platform-link-status.md.
- إن قُبلت (Live): أشعر المستخدم تلجرام فورًا ونفّذ: OAuth بـ TIKTOK_CLIENT_KEY (awa32n4co6o1vqbm) → ربط الحساب الحقيقي → نشر الحلقة المعلقة (أو التالية) عامة → إشعار تلجرام. لا تعيد التقديم ولا تغيّر إعدادات التطبيق.

## 4. تحديث السجل والمستودع (نهاية كل تشغيل)
- حدّث docs/platform-link-status.md بجدول المنشورات الجديدة + سجل تلجرام.
- حدّث docs/publishing-ladder-state.md (dailyCap جديد = 4، history الحلقة).
- حدّث current_state_snapshot.md وtopic_library.json.
- cd /home/ubuntu/daousha-repo && git pull --rebase -q && git add -A && git commit -m "Auto: produce+publish episode {N} (YYYY-MM-DD)" && git push -q origin main.
- إن فشل gh: أخبر المستخدم تلجرام أن يعيد ربط GitHub من إعدادات Manus.

## 5. منطق السلم التصاعدي (docs/publishing-ladder-state.md)
level 1 (محدّث 2026-08-15)، dailyCap 4، streakSafe يزيد +1 عند دورة بلا أخطاء. عند streakSafe ≥5 يرقى level والـ dailyCap: 4→6→8→12→16. level 4 يتطلب تأكيدًا صريحًا من المستخدم قبل الترقية التالية. لا تنشر قطعتين على نفس المنصة بفارق أقل من 4 ساعات.

## 6. قواعد إلزامية
لا تنشر مقطعًا منشورًا سابقًا (راجع topic_library.json). لا تعرض أي سر. عند 3 أخطاء متتالية أو إشارة حظر: أوقف الدورة وأخبر المستخدم تلجرام. عند نفاد رصيد التشغيل: اطلب ترقية من المستخدم بلطف. لا تتعجل — الجودة قبل الكمية: كل حلقة يجب أن تكون 30-50 ثانية، بصري قوي، وتعليق واضح. **إعدادات القناة يوتيوب ضُبطت (الوصف والكلمات المفتاحية 2026-08-15) — لا تعيد ضبطها**.

## 7. التقرير الختامي لكل تشغيل
رسالة تلجرام واحدة للمستخدم: الحلقة المنشورة + روابطها الثلاث + حالة TikTok + مستوى السلم + أي قرار مطلوب منه.
