# Current State Snapshot — XDAW NOVA (2026-08-20، تحديث 09:09 UTC / 12:09 ظهرًا القاهرة)
## السلسلة
- المستوى: 2 | السقف اليومي: 6 | streakSafe: 22 | streakRisky: 0
- آخر نشر: ep26 (IG — المنشور الثاني) 2026-08-20 07:23 UTC — https://www.instagram.com/reel/DcQN5XjD4tD/
## الحلقة الأخيرة
- ep26 «الجبال ليست ثابتة... بل تتحرك!»: produced كامل في دورة 2026-08-20 03:35 UTC (1080x1920، 44.7s، narration26 Charon، 4 صور 1440x2560) في docs/episode26/ بالtarball؛ نشرت على IG مرتين في نفس اليوم بعد احترام حد الـ4 ساعات: https://www.instagram.com/reel/DcPyNOID91y/ (03:21 UTC) وhttps://www.instagram.com/reel/DcQN5XjD4tD/ (07:23 UTC)
- ep22 «العين المجردة»: published (AR + EN على IG)
## الحلقة التالية
- ep27 «أسرع من الضوء؟ 3 حقائق صادمة عن السرعة ستفجّر عقلك» (AR + EN): produced-partial — السيناريو AR+EN + narration27-ar.wav (45.8s) + narration27-en.wav (45.4s) في test_run/episode27/ وdocs/episode27/؛ **الصور الثمانية (4 AR + 4 EN) مؤجلة** لنفاد حصة توليد الصور (20/20) في دورة 08:06 UTC ومحاولة توليد فيديو واحدة مستهلكة (1/1) في دورة 09:09 UTC — تُنتج فور إعادة التعيين (غالبًا 00:00 UTC)، ثم يُبنى الفيديوهان (AR + EN) ويُنشران على IG. عند اكتمالها: ep27 = produced؛ الحلقة التالية queued (يُضاف ep28 جديد في topic_library.json).
## القيود البيئية (مستمرة منذ 2026-08-15)
- /home/ubuntu/secrets.txt غائب في جلسات الجدولة → YouTube + Facebook + Telegram معطلة
- عند استعادة الملف يُستكمل نشر الحلقات المعلقة فورًا دون إعادة إنتاج
- Instagram يعمل عبر Manus connector
- توليد الصور: حصة اليوم (20/20) مستهلكة في دورتي 08:06 و09:09 UTC — محاولات توليد مشاهد ep27 فشلت؛ تُستكمل في إعادة التعيين التالية (عادةً 00:00 UTC).
- توليد الفيديو: حصة اليوم (1/1) مستهلكة في دورة 09:09 UTC.
## TikTok (محدث 2026-08-20 08:12 UTC — فحص مباشر في متصفح المستخدم)
- الحالة الرسمية: **Production — Not approved** — سجل TikTok Admin: «Updated Status from Under review to Rejected» بتاريخ 2026-08-19 9:15 AM (لم تعد «In review»). تفاصيل في docs/tiktok-check-2026-08-20-morning2.md
- الإجراء المطلوب من المستخدم: مراجعة أسباب الرفض عبر «See why» في portal وإما إعادة التقديم (النشر الآلي المباشر Direct Post عادةً يُرفض؛ بديل: الاكتفاء بدرافت video.upload فقط) أو الاستمرار بدون TikTok.
- لا نشر على TikTok حتى البتّ.
## ملاحظة تشغيلية — 2026-08-20 (09:09 UTC)
- المستودع على main. دورة 09:09 UTC: لا إنتاج ولا نشر — حصة الصور 20/20 مستهلكة (مشاهد ep27 الثمانية مؤجلة) + حصة الفيديو 1/1 مستهلكة، ونافذة IG تفتح 11:23 UTC (كولداون 4 ساعات بعد منشور ep26 الساعة 07:23 UTC)، وYT/FB/Telegram معطلة (secrets.txt غائب)، وTikTok مرفوض رسميًا في 2026-08-19. ملاحظة: منشور ep26 الأول (DcPyNOID91y) في دورة 03:35 UTC قد يكون منشور ep22/24/25 المكرر نفس reel (DcPfiQwEq8o يظهر لثلاث حلقات) — يُرجى التحقق يدويًا لاحقًا من عدم تكرار النشر على IG بين الحلقات 22/24/25.
## حالات الحلقات (من topic_library.json)
- produced (جاهزة للنشر عند استعادة secrets.txt): ep5, ep7, ep9–ep13, ep17–ep20, ep23, ep27(partial).
- published-ig (ينقصها YT/FB/Telegram): ep6, ep8, ep14–ep16.
- published كاملًا: ep1–ep4, ep22, ep24–ep26.
