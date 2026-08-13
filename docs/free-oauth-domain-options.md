# خيارات نطاق مجاني لمسار Facebook OAuth

## الخلاصة الحالية

تطلب Meta نطاقًا أو نطاقًا فرعيًا يخص التطبيق لاستخدامه في عنوان إعادة توجيه OAuth. النطاق المشترك `daousha-vide-nbqlahcj.manus.space` لم يُقبل في مربع موافقة Facebook رغم حفظ `manus.space` وعنوان العودة الكامل داخل إعدادات التطبيق. لا ينبغي التحايل على ذلك، لأن قيد النطاق جزء من حماية رموز التفويض.

## الخيارات التي تم التحقق منها

| الخيار | التكلفة | ملاءمته الآن | الملاحظة |
|---|---:|---|---|
| نطاق مخصص مسجل | مدفوع | ممتاز | الحل الأسرع والأكثر استقرارًا، لكنه خارج شرط صفر تكلفة. |
| نطاق فرعي EU.org | مجاني | صالح مبدئيًا | يقدم EU.org تسجيل نطاقات فرعية مجانية مع تحكم DNS، لكنه يتطلب حسابًا وإعداد nameserver ثم انتظار مراجعة بشرية قد تستغرق أيامًا. |
| DuckDNS | مجاني | غير مناسب للاستضافة الحالية | هو DNS ديناميكي يربط نطاقًا بعنوان IP عام؛ لا يمكنه بمفرده توجيه نطاق XDAW إلى الاستضافة المدارة الحالية أو حفظ رموز OAuth. |
| Cloudflare Workers | خطة مجانية محدودة | غير كافٍ وحده | يوفر وظائف خادمية مجانية محدودة، لكنه لا يمنح نطاقًا مملوكًا مجانيًا؛ يحتاج نطاقًا أو نطاقًا فرعيًا تملكه أصلًا. |

## التوصية ضمن شرط «مجاني 100%»

الخيار الواقعي هو طلب نطاق فرعي قصير مثل `xdawnova.eu.org` عبر EU.org، ثم بعد الموافقة ربطه بالاستضافة من إعدادات النطاقات، وإدخاله في Meta كـ App Domain وعنوان OAuth كامل. لا يبدأ التفويض أو النشر قبل اكتمال هذه المراحل.

## التنفيذ الجاري

* الاسم المختار: `xdawnova.int.eu.org`، لأن `INT.eu.org` مدرج كنطاق دولي مفتوح للتسجيل في قائمة EU.org.
* منطقة DNS مجانية أُنشئت في Cloudflare بحالة `pending` إلى أن تفوضها EU.org.
* خادما الاسم المطلوبان في نموذج EU.org: `adele.ns.cloudflare.com` و`vicente.ns.cloudflare.com`.
* نموذج EU.org يحمل Contact Handle إداريًا وفنيًا `XN147-FREE`. أرسل المستخدم الطلب بنجاح في `2026-08-14` برقم `20260814015517-arf-54721` بعد نجاح فحوصات SOA وNS لدى خادمي Cloudflare.
* حالة العمل الحالية: انتظار مراجعة EU.org اليدوية وتفويض النطاق. لا يمكن ربطه بالاستضافة أو إضافته إلى Meta قبل الموافقة.

## المراجع

1. Meta Basic Settings: https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/basic-settings
2. Meta Application API Reference: https://developers.facebook.com/docs/graph-api/reference/application/
3. EU.org: https://nic.eu.org/
4. EU.org Registration: https://nic.eu.org/register.html
5. EU.org General Policy: https://nic.eu.org/policy.html
6. Cloudflare Workers Pricing: https://developers.cloudflare.com/workers/platform/pricing/
7. Duck DNS overview: https://www.home-assistant.io/integrations/duckdns/
