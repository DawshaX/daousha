# حالة إعداد تطبيق TikTok — XDAW NOVA

## الهوية الحالية

أنشئ تطبيق **xDaW NoVa** في بوابة TikTok for Developers بحالة Production Draft، ومعرّفه `7673768835363145748`. اختيرت فئة **Education** وأضيف وصف علني قصير يشرح أنه استوديو عربي/إنجليزي لإنتاج ومراجعة ونشر الفيديو الأصلي بمسؤولية.

> **تصحيح هوية مطلوب:** الأيقونة التي رُفعت أولًا إلى TikTok هي علامة هندسية حمراء وليست شعار الجمجمة/القناع الأحمر المعتمد لقناة XDAW NOVA. ستستبدل قبل حفظ المسودة بنسخة 1024×1024 مشتقة مباشرةً من الأصل المعتمد `xdaw-nova-youtube-avatar-under-4mb.png`.

## المنتجات والصلاحيات المطلوبة

| العنصر | الغرض المقيد |
|---|---|
| Login Kit | ربط مالك TikTok بحسابه الخاص داخل XDAW NOVA |
| `user.info.basic` | قراءة معرّف المنشئ وبياناته الأساسية اللازمة لإثبات الحساب المفوّض |
| `video.upload` | رفع فيديو أصلي كمشروع مسودة داخل TikTok |
| `video.publish` | النشر المباشر فقط بعد إقرار المستخدم ومعاينة المحتوى وحواجز الحقوق |

تؤكد وثائق TikTok أن Content Posting API يدعم رفع المسودات والنشر المباشر، وأن النشر المباشر يحتاج نطاق `video.publish` ومراجعة التطبيق قبل استخدام الإنتاج. [1] [2]

## ما نُفذ داخل XDAW NOVA

أضيف مسار OAuth خادمي إلى `/api/integrations/tiktok/authorize` وعودة إلى `/api/integrations/tiktok/callback`. يستعمل المسار حالة CSRF في Cookie مؤقت، ويتبادل الرمز مع TikTok ثم يخزن حزمة الرموز (الوصول والتجديد ومدة الصلاحية ومعرّف المستخدم والنطاقات) مشفّرة في سجل القنوات. لا يكشف Client key أو Client secret أو رموز المستخدم للواجهة.

## العوائق المتبقية قبل الإنتاج

ما تزال بوابة TikTok تطلب التحقق من روابط الشروط والخصوصية وموقع الويب، ثم فيديو مراجعة يوضح تدفق OAuth والرفع/النشر. المسار الأنسب حاليًا هو **URL prefix signature file** للنطاق المنشور `https://daousha-vide-nbqlahcj.manus.space/` أو تكرار التحقق عبر `xdawnova.int.eu.org` عند تفويض EU.org. لا يُرسل طلب مراجعة TikTok قبل تجهيز ملف التحقق وفيديو المراجعة، ولا يُفعّل نشر عام قبل قبول TikTok.

تحقق فحص عام في `2026-08-14` من أن روابط الشروط والخصوصية الحالية تعمل وتعرض محتوى علنيًا صحيحًا:

| الغرض | الرابط المتحقق |
|---|---|
| شروط الخدمة | `https://daousha-vide-nbqlahcj.manus.space/terms` |
| سياسة الخصوصية | `https://daousha-vide-nbqlahcj.manus.space/privacy` |
| الصفحة الرئيسية | `https://daousha-vide-nbqlahcj.manus.space/` — تعرض شاشة دخول للوحة التحكم |

لذلك لا تُستبدل روابط الشروط أو الخصوصية بعناوين أخرى؛ المشكلة الحالية هي إثبات ملكية رابط الويب في TikTok، لا صلاحية صفحات الامتثال نفسها.

في بوابة TikTok ظهر ملف التوقيع المطلوب للتحقق عبر URL prefix باسم `tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt`. تطلب البوابة رفع الملف إلى جذر `https://daousha-vide-nbqlahcj.manus.space` ثم الضغط على Verify. تم تنزيل الملف في متصفح المستخدم، ولذلك يلزم إتاحة نسخة المطور منه للمنصة أو استخراج محتواه من رابط التنزيل قبل نشره في المسار العام.

## المراجع

[1]: https://developers.tiktok.com/doc/content-posting-api-get-started "TikTok — Content Posting API: Get Started"
[2]: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post "TikTok — Direct Post API Reference"
