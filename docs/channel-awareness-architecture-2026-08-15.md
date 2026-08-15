# وعي القنوات والتحديث القريب من اللحظي — XDAW NOVA

**التاريخ:** 15 أغسطس 2026. يضع هذا المستند أساس مراقبة المنصات من دون طلب صلاحيات لا يستعملها التطبيق، أو تحويل المراقبة إلى نشر، أو الادعاء بأن كل مزود يسمح بتحديث لحظي لكل نوع من الأحداث.

> المبدأ: تتلقى المنصة الإشعار الفوري عندما يتيحه المزود رسميًا، وتستعمل فحصًا صحيًا محدودًا للتفويضات والأحداث التي لا يرسل لها المزود إشعارًا. لا يغيّر أي مسار مراقبة حالة نشر أو يرفع محتوى.

| المنصة | الإشعار الفوري الرسمي | ما يمكنه إبلاغ المنصة به | الحدود الفعلية | حالة XDAW NOVA |
|---|---|---|---|---|
| YouTube | اشتراك WebSub / PubSubHubbub في خلاصة القناة | رفع فيديو أو تعديل عنوانه أو وصفه | لا يبلغ بإلغاء OAuth؛ يحتاج الفحص الصحي لتجديد الرمز واكتشاف الإلغاء | مؤهل للتنفيذ بعد إضافة مستقبل الإشعار والاشتراك الدوري |
| Facebook Page | Webhooks من Meta | تغييرات الحقول المشترَك فيها للصفحة | يحتاج تطبيق Meta صالحًا، HTTPS، وصلاحيات/تفويضًا مناسبًا | متوقف حتى ينتهي تأكيد حساب المطوّر ثم OAuth للصفحة |
| Instagram | Webhooks من Meta | تعليقات و@mentions وانتهاء القصص في الحدود المعتمدة | لا تدعم Reels، وتحتاج Advanced Access وإعداد Page subscriptions | لا يبدأ قبل عودة Meta وتحقق شروط الحساب التجاري |
| TikTok | Webhooks وحالة نشر وفق إعداد التطبيق | إشعارات أحداث الحالة المسجلة للتطبيق بعد تهيئتها | يستلزم تطبيقًا معتمدًا وإعداد webhook؛ Sandbox لا يفتح نشر الإنتاج | مؤجل إلى إكمال دليل Sandbox وموافقة الإنتاج |
| Telegram | تحديثات البوت والتنبيهات | تسليم تنبيهات تشغيلية للمالك | ليس مصدر حالة للقنوات الاجتماعية | متاح لإبلاغ المالك عن أي تعثر |

## قرار التصميم

يبنى مسار YouTube أولًا من طبقتين. الطبقة الأولى مستقبل HTTPS عام يتحقق من اشتراك YouTube ثم يسجل أحدث حدث فيديو فقط. الطبقة الثانية فحص صحي دوري محكوم يجدد رمز الوصول عند الحاجة ويستدعي قراءة محدودة للقناة؛ فإذا فشل التجديد يسجل الانقطاع ويرسل تنبيه Telegram. يظل الفحص بلا رفع أو نشر أو تعديل فيديو.

يؤجل استقبال Webhooks لـFacebook وInstagram حتى يعود حساب المطوّر وتتوفر الصلاحيات المطلوبة. لا يوسّع XDAW NOVA صلاحيات Instagram لمجرد المراقبة، إذ تشير وثائق Meta إلى أن الإشعارات الحية ذاتها تعتمد على وضع التطبيق والصلاحيات المتقدمة وربط الصفحة، كما أن Reels غير مدعومة في هذا المسار.[3]

أما TikTok فيبقى سجل حالة النشر أو الـWebhook جزءًا من مرحلة الإنتاج بعد اعتماد التطبيق. لا يخلط التطبيق بين OAuth في Sandbox وإذن إنتاج أو نشر عام.

## المراجع

[1] [YouTube Data API — Subscribe to Push Notifications](https://developers.google.com/youtube/v3/guides/push_notifications)

[2] [Meta — Webhooks from Meta](https://developers.facebook.com/docs/graph-api/webhooks/)

[3] [Meta — Set Up Webhooks for Instagram](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-instagram/)

[4] [TikTok for Developers — Webhook Events](https://developers.tiktok.com/doc/webhooks-events/)

[5] [TikTok for Developers — Content Posting Status](https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status)
