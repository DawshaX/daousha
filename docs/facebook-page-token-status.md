# حالة ربط صفحة Facebook المؤقتة — XDAW NOVA

## النتيجة

تم التحقق في `2026-08-14` من صفحة **XDAW NOVA** التي يديرها حساب محمد ضياء، ثم اختير رمز وصول الصفحة من أداة Meta الرسمية. يعيد Graph API معرّف الصفحة القانوني `1265727539958933` واسم `XDAW NOVA` عند استدعاء تحقق محدود؛ قد يختلف هذا المعرّف عن رقم رابط الملف العام `61593031750114`.

يُحفظ رمز الوصول في سر خادمي محمي باسم `FACEBOOK_PAGE_ACCESS_TOKEN`، ولا يُعرض للواجهة أو يُخزّن في قاعدة البيانات. رمز المستخدم الذي ظهر سابقًا في الدردشة لا يُستخدم ضمن الربط؛ يجب إبطاله من Meta لأن إدخاله في الدردشة يكشفه.

## الصلاحيات المستخدمة

| الصلاحية | الغرض |
|---|---|
| `pages_show_list` | العثور على الصفحة التي يملك المدير صلاحية إدارتها |
| `pages_read_engagement` | قراءة حالة المحتوى والتحقق من التفاعل المسموح |
| `pages_manage_posts` | نشر محتوى الصفحة بعد تأكيد صريح |
| `pages_manage_metadata` | إدارة بيانات الصفحة الضرورية للتكامل |

أضيفت `business_management` في أداة Meta، لكنها ليست شرطًا للنشر في التطبيق الحالي ولا تمنح أي نشر تلقائي بمفردها.

## الحدود القائمة

هذا هو مسار ربط مؤقت يسمح بالتحقق والتكامل مع الصفحة بينما يبقى طلب EU.org قيد المراجعة. النشر العام يبقى محكومًا بحواجز الحقوق والسلامة والمعاينة وبموافقة صريحة. عند تفعيل `xdawnova.int.eu.org` ينتقل التطبيق إلى OAuth القياسي بوصفه المسار الدائم.

## المراجع

1. Meta Pages API — Getting Started: https://developers.facebook.com/documentation/pages-api/getting-started
2. Meta Video API — Publishing: https://developers.facebook.com/documentation/video-api/guides/publishing
3. Meta Reels Publishing API: https://developers.facebook.com/documentation/video-api/guides/reels-publishing
