# حالة إعداد Meta — XDAW NOVA Publisher

- **اسم التطبيق:** XDAW NOVA Publisher
- **معرّف التطبيق:** `2828503350861658`
- **صفحة Facebook المستهدفة:** صفحة XDAW NOVA الجديدة المدارة من الحساب الشخصي للمالك.
- **Instagram:** حساب مستقل على `DAWSHAXLOL@gmail.com`؛ لا يُدمج مع Facebook ولا تُنقل ملكيته.
- **نطاقات الصفحات المفعلة للاختبار:** `pages_show_list` و`pages_manage_posts` و`pages_read_engagement` و`pages_manage_engagement` و`pages_manage_metadata`.
- **هوية التطبيق:** أيقونة PNG مربعة `512×512` بكسل وحجم `369.9 KB` رُفعت وحُفظت داخل إعدادات Meta.
- **الفئة:** «أنشطة تجارية وصفحات».
- **مسارات الامتثال المنشورة:** `/privacy` و`/terms` و`/data-deletion`، وأُدخلت روابطها وحُفظت داخل إعدادات التطبيق.
- **البيانات السرية:** حُفظ معرّف التطبيق والمفتاح السري في مخزن الأسرار المحمي، واجتازا فحصًا مباشرًا وخفيفًا إلى Graph API.
- **مسار التفويض داخل XDAW NOVA:** `/api/integrations/facebook/authorize` ثم اختيار صريح لصفحة واحدة قبل الحفظ المشفّر لرمز الصفحة.
- **حالة موصل Instagram في 2026-08-14:** فشل فحص قراءة فقط لحساب `@xdaw_nova` بسبب انتهاء أو إبطال جلسة الوصول (OAuth error 190). لا تُجرى أي محاولة نشر إلى أن يعيد المالك التفويض، ثم يبقى كل Reel خاضعًا لتأكيد مستقل.
- **ملاحظة OAuth:** رغم أن `manus.space` محفوظ ضمن App Domains وURI الكامل محفوظ في Facebook Login for Business، أعادت Meta رفض نطاق الاستضافة الفرعي. يدعم مرجع Meta الرسمي تحديث `app_domains` باستخدام App Access Token؛ لذلك سيعتمد المسار على إضافة المضيف الدقيق خادميًا قبل بدء OAuth. المصدر: https://developers.facebook.com/docs/graph-api/reference/application/

> لا يحتوي هذا الملف على App Secret أو رموز وصول أو كلمات مرور.
