# ملاحظات دورة 2026-08-19 (تشغيل ~18:49 القاهرة — نافذة 6م)
## الحالة العامة
- /home/ubuntu/secrets.txt غائب (نفس القيد المستمر منذ 2026-08-15) → YouTube + Facebook + Telegram بوت معطلون بيئيًا؛ Instagram يعمل عبر Manus connector.
- /home/ubuntu/test_run أُنشئ من جديد؛ build_episode.sh وnotify_telegram.py منسوخان من مستودع daousha-repo.
- رصيد توليد الصور: حصص اليوم استُخدمت لإنتاج ep20 بالكامل (4 صور) — إن نفذ الرصيد في دورات لاحقة يُكمل الباقي في التشغيل التالي.
## حالة السلم
- level 2، dailyCap 6، streakSafe 16، streakRisky 0، lastPublishDate 2026-08-19 (ep19 IG 12:19م)
- الحلقة التالية: ep20 «الصوت» (queued)
## الإنتاج
- ep20 «صوتك لا يُسمع في الفضاء! 3 حقائق صادمة عن الصوت»: سيناريو 318 حرفًا، narration20.wav (Charon، 31.5s)، 4 صور 1440x2560، episode20-final.mp4 (1080x1920، 30fps، 30.03s) — كله في test_run/ وdocs/episode20/
- CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/zPCYUUrWtUlLeKUw.mp4
## النشر
- Instagram: https://www.instagram.com/reel/DcOi8dzii3P/ (published-public)
- YouTube / Facebook: لم يُحاوَل (secrets.txt غائب — تجنب أخطاء) — ep20 يضاف لقائمة pendingFullPublish
## فحص TikTok (~15:49 UTC)
- https://developers.tiktok.com/app/7673768835363145748/pending → "No access — You need to login" (نفس النتيجة المتكررة؛ جلسة الدخول غير محفوظة في المتصفح)
- الحالة المسجلة تبقى: Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
## تحديثات السجل
- topic_library.json: ep20 → produced، التالية queued = ep21 (البرق)
- publishing-ladder-state.md: streakSafe 17، lastPublishUrl reel/DcOi8dzii3P/، pendingFullPublish + ep20
- snapshot + git push main
