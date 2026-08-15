# تشغيل Instagram الخلفي المستقل — قرار تقني

**تاريخ المراجعة:** 15 أغسطس 2026. يفصل هذا المستند بين موصل Instagram الحالي الذي يطلب بطاقة تأكيد لكل Reel، وبين واجهة Instagram الرسمية التي تدعم تجديد رمز المستخدم وجدولة النشر من الخادم.

| المسار | ما تحقق فعليًا | حدّه التشغيلي | القرار |
|---|---|---|---|
| موصل Instagram الحالي | تم التحقق قراءةً فقط من `@xdaw_nova` ومن منشوراته | لا يقدّم جدولة أصلية، وكل Reel يحتاج بطاقة تأكيد | يبقى لمسار المراجعة اليدوية فقط |
| Instagram API with Instagram Login | توثق Meta رمز مستخدم طويل الأجل وتجديده خادميًا | يلزم إعداد حالة الاستخدام وتفويض OAuth مستقل للحساب الاحترافي | هو المسار المرشح للتشغيل الخلفي |

> لا يحتاج هذا المسار إلى نقل ملكية حساب Instagram أو دمجه مع حساب Facebook الشخصي. إنه يستخدم OAuth مستقلًا للحساب الاحترافي نفسه، ويحفظ رمزًا مشفرًا في الخادم فقط.

## المتطلبات الرسمية

تدعم Meta نشر Reels للحسابات الاحترافية عبر `/<IG_ID>/media` ثم `/<IG_ID>/media_publish`، مع صلاحية `instagram_business_content_publish`. ويشترط المحتوى المرئي رابطًا عامًا وقت الرفع، كما يطبق حدًا أقصاه 100 منشور منشأ عبر API خلال نافذة متحركة 24 ساعة.[1]

يُبدل رمز Instagram القصير إلى رمز طويل الأجل مدته 60 يومًا عبر الخادم فقط، لأن التبديل يحتاج سر التطبيق ولا يجوز أن يظهر في العميل. ويمكن تجديد الرمز الطويل بعد مرور 24 ساعة وقبل انتهاء صلاحيته؛ ويمنح التجديد 60 يومًا جديدة.[2] [3]

## تصميم XDAW NOVA المقترح

يُضاف في تطبيق Meta المحفوظ مسار **Instagram API with Instagram Login / Business Login for Instagram**، مع عنوان عودة مستقل في XDAW NOVA. بعد موافقة صاحب `@xdaw_nova` يحفظ الخادم الرمز الطويل مشفرًا، ويفحصه كل 6 ساعات ويجدد في نافذة آمنة قبل الانتهاء. لا يعني ذلك نشرًا بلا ضوابط: يبقى إنشاء حاوية Reel ونشرها وراء مشروع مملوك، وأصل مرخص واضح، وفحص سلامة، ومعاينة، وسياسة نشر مفعلة، ومفتاح إيقاف.

## حدود لا يجوز تجاوزها

لا يمكن للنظام تجديد رمز ملغى أو منتهٍ، ولا تجاوز مراجعة Meta أو قيود النشر أو Page Publishing Authorization إن طلبتها المنصة. عند فشل التجديد، يسجل السبب ويرسل Telegram ورابط إعادة OAuth بدل محاولة تسجيل دخول بكلمة مرور أو إعادة استخدام جلسة متصفح.

## المراجع

[1] [Meta — Instagram Platform Content Publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing)

[2] [Meta — Exchange Instagram Access Token](https://developers.facebook.com/documentation/instagram-platform/reference/access_token)

[3] [Meta — Refresh Long-Lived Instagram Access Token](https://developers.facebook.com/documentation/instagram-platform/reference/refresh_access_token)
