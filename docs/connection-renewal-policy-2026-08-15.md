# سياسة تجديد اتصالات القنوات — XDAW NOVA

**تاريخ المراجعة:** 15 أغسطس 2026. تشرح هذه السياسة كيف يحافظ XDAW NOVA على اتصالات القنوات الرسمية من دون استخدام كلمات مرور، أو مشاركة رموز في المحادثة، أو تجاوز قرار أي منصة بإلغاء التفويض.

| المنصة | التجديد التلقائي المسموح | فشل لا يمكن تجاوزه تلقائيًا | الإجراء الآمن عند الفشل |
|---|---|---|---|
| YouTube | يستخدم الخادم رمز التجديد المشفر للحصول على رمز وصول جديد ثم يتحقق من القناة قراءةً فقط | إلغاء Google للتفويض، تغير صلاحيات OAuth، أو توقف تطبيق Google عن منح الوصول | يسجل الحالة المتعثرة ويرسل Telegram ورابط OAuth الرسمي؛ لا يرفع أو ينشر |
| Facebook Page | بعد OAuth صالح، يستبدل الخادم رمز المستخدم القصير برمز طويل ثم يحفظ رمز الصفحة الناتج من المسار الرسمي | انتهاء الرمز، إلغاؤه، تأكيد حساب المطوّر، أو منع Meta للتطبيق | يوقف رفع Facebook ويرسل تنبيهًا؛ يعاد OAuth بعد إتاحة Meta |
| Instagram | الموصل الرسمي يدير جلسة الحساب المستقل؛ يفحص XDAW NOVA صحة الوصول قراءةً فقط | إلغاء الموصل أو توقف وصول Instagram أو غياب صلاحية Instagram المطلوبة | يعاد تفويض الموصل للحساب المستقل ذاته؛ لا ينقل اعتماد Facebook أو Instagram بين الحسابين |
| TikTok | يحدّث التطبيق رمز الوصول من رمز التجديد وفق OAuth TikTok بعد إتمام التفويض المناسب | انتهاء/إلغاء رمز التجديد أو غياب اعتماد الإنتاج | Sandbox يبقى اختبارًا فقط؛ يعاد OAuth عند الحاجة، ولا تتحول الحالة إلى نشر إنتاج |

> لا يعني التجديد الذاتي امتلاك البرنامج للحساب. يظل المالك والمنصة قادرين على الإلغاء؛ حينها يتحول السلوك الصحيح من «التجديد» إلى «التنبيه وطلب موافقة جديدة».

## تطبيق XDAW NOVA الحالي

مراقب YouTube مفعل كل ست ساعات: يجدد الرمز، يقرأ القناة للتحقق من التطابق، ويسجل الحالة ويرسل Telegram عند تغيرها. هذا المسار منفصل عن مسار رفع الفيديو ولا ينشئ نشرًا. تحقق الموصل الرسمي لـInstagram من الحساب المستقل `@xdaw_nova` وقائمة منشوراته قراءةً فقط؛ لا يعرض الموصل جدولة أصلية أو نشرًا صامتًا، ولذلك يظل كل Reel وراء بطاقة تأكيد. لا يبدأ Facebook أو TikTok أي تجديد خادمي حتى يكتمل التفويض الرسمي الخاص بكل واحد منهما.

## المراجع

[1] [Google — OAuth 2.0 for Web Server Applications](https://developers.google.com/youtube/v3/live/guides/auth/server-side-web-apps)

[2] [TikTok — User Access Token Management](https://developers.tiktok.com/doc/oauth-user-access-token-management)

[3] [Meta — Long-Lived Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived)

[4] [Meta — Refresh Instagram Access Token](https://developers.facebook.com/documentation/instagram-platform/reference/refresh_access_token)
