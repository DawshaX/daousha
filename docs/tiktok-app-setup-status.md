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

تطلب بوابة TikTok التحقق من روابط الشروط والخصوصية وموقع الويب، ثم فيديو مراجعة يوضح تدفق OAuth والرفع/النشر. يجيب XDAW NOVA الآن بمسار خادمي ثابت لملف التوقيع في جذر النطاق المنشور، يطابق الملف الأصلي بايتًا ببايت ويرسل رؤوس منع التخزين المؤقت؛ لذلك لا تعتمد صحة الملف على حزمة واجهة أو نسخة CDN سابقة. يؤكد فحص خارجي مستقل في `2026-08-14` إمكانية قراءة المحتوى الكامل من الرابط العام، لكن بوابة TikTok ما زالت تعرض رفضًا من نتيجة تحققها السابقة؛ لا تُسجّل كنجاح حتى يظهر القبول صراحةً في البوابة.

المرساة طويلة الأجل هي تكرار هذا المسار ذاته عبر `https://xdawnova.int.eu.org/` فور تفويض EU.org وربط CNAME بالاستضافة. عندها ستُحدّث الشروط والخصوصية وعنوان الويب وOAuth إلى النطاق المخصص مرة واحدة، ثم يعاد التحقق من جديد. لا يُرسل طلب مراجعة TikTok قبل نجاح التحقق وتجهيز فيديو مراجعة يوضح التدفق الكامل، ولا يُفعّل نشر عام قبل قبول TikTok.

في `2026-08-14` نُشر بديل مجاني مستقل عبر Cloudflare Pages باسم `https://xdawnova.pages.dev/`. فحص HTTP خارجي أكد حالة `200` للصفحة الرئيسية وصفحتي `/terms/` و`/privacy/`، كما أكد أن ملف التوقيع في الجذر يعيد `text/plain` ويطابق الملف الأصلي بايتًا ببايت (68 بايت). لكن لا يُستخدم هذا النطاق في نموذج TikTok ما لم تصدر البوابة له ملف توقيع جديدًا؛ ملف التوقيع الحالي لا ينتقل تلقائيًا بين نطاقين.

أظهرت نافذة TikTok الفعلية في `2026-08-14` أن الخاصية غير الموثقة الحالية هي URL prefix الجذري `https://daousha-vide-nbqlahcj.manus.space/`، وأنها تطلب رفع الملف `tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt` إلى هذا العنوان نفسه. أعيدت المحاولة بعد مطابقة الملف الحي مع الملف الأصلي بايتًا ببايت (68 بايت، دون إعادة توجيه)، وأعلنت البوابة: `Your property has been verified`. لذلك يعاد استخدام روابط الشروط والخصوصية وعنوان الويب على نطاق Manus المنشور، لا نطاق Pages. ينسجم ذلك مع وثائق TikTok التي تشترط أن يطابق URL prefix صيغة `https:// + host + path + /` وأنها لا تتبع إعادة التوجيه. [3]

بعد ثلاث محاولات أولية لم تسجل البوابة الخاصية الجديدة رغم أن فحصًا خارجيًا مستقلًا يقرأ ملف التوقيع كاملًا. وافق المالك على رفع بلاغ تقني عبر بوابة الدعم الرسمية `https://developers.tiktok.com/portal/support` يتضمن معلومات عامة فقط: رقم التطبيق، رابط URL prefix، ونتيجة HTTP؛ ولا يتضمن مفاتيح التطبيق أو رموز OAuth أو طلب إرسال التطبيق للمراجعة. أُغلقت المشكلة لاحقًا بالعودة إلى الخاصية الموجودة أصلًا على نطاق Manus والتحقق منها بنجاح؛ يبقى البلاغ كمرجع فقط ولا يتطلب إجراء إضافيًا ما لم يرد TikTok بتوجيه جديد.

أُرسل البلاغ بنجاح في `2026-08-14` من البريد البديل المعتمد `DAWSHAXLOL@gmail.com`، تحت فئة `Bug Report` وموضوع `Content Posting API` وبعنوان `URL prefix verification not registering for xDaW NoVa app`. رقم الحالة هو `44aa932884fa7210`، وتوضح بوابة TikTok أن الرد متوقع خلال 1–3 أيام. يشرح البلاغ السلوك المتوقع والفعلي وخطوات إعادة الإنتاج وبيئة المتصفح فقط، ولا يرفق أي أسرار.

رُبط البريد البديل بالمتابعة ووردت رسالة تأكيد TikTok بعنوان `Your support request was received` من `noreply@dev.tiktok.com` للحالة نفسها. لا يحمل هذا البريد حلًا بعد؛ الخطوة التالية هي انتظار رد الدعم الفني وتنفيذ توجيههم، مع عدم استخدام أو نسخ أي رموز تحقق من الرسائل.

بعد تحقق URL prefix بنجاح، جرى استبدال رابط الشروط ورابط الويب في نموذج TikTok بعناوين تحت النطاق المتحقق. بقي رابط الخصوصية ومعلومات المراجعة وفيديو الدليل كمتطلبات نموذجية قبل حفظ المسودة أو طلب المراجعة.

### نص مراجعة TikTok المقترح

> XDAW NOVA is a bilingual web studio for original video workflows. Login Kit lets the owner sign in with TikTok; `user.info.basic` is used only to identify the authorized account. After a rights and preview gate in our dashboard, Content Posting API either uploads an original video as a draft using `video.upload` or sends a Direct Post using `video.publish` only after the owner confirms. OAuth uses a server-side state value, and access tokens are encrypted and never exposed to the browser. No content is collected from TikTok or published without authorization.

### حالة المسودة الحالية

في `2026-08-14` تحقق TikTok بنجاح من URL prefix الجذري `https://daousha-vide-nbqlahcj.manus.space/` بعد أن أعلن صراحةً: `Your property has been verified`. تُستخدم الآن روابط الشروط والخصوصية والموقع من النطاق نفسه. أُدخل وصف تدفق التكامل ورفع الملف `xdawnova-tiktok-review-demo-draft.mp4` بنجاح إلى منطقة فيديو المراجعة **كمرفق مسودة فقط**. الشاشة الحالية تعرض `This form has unsaved changes` ولا تزال `Submit for review` غير مستخدمة؛ يجب استبدال الفيديو بدليل Sandbox حي قبل أي إرسال للمراجعة.

بعد ذلك حُفظت المسودة بنجاح (`Saved`). يؤكد سجل TikTok حفظ الفئة `Education`، والأيقونة، والوصف، وروابط الشروط والخصوصية، وتهيئة Web، وعنوان العودة `https://daousha-vide-nbqlahcj.manus.space/api/integrations/tiktok/callback`، ومنتجي Login Kit وContent Posting API والنطاقات `user.info.basic` و`video.upload` و`video.publish`. لم يُستخدم زر `Submit for review` ولم يُفوض أي حساب TikTok من خلال هذه الخطوة.

تحقق فحص عام في `2026-08-14` من أن روابط الشروط والخصوصية الحالية تعمل وتعرض محتوى علنيًا صحيحًا:

| الغرض | الرابط المتحقق |
|---|---|
| شروط الخدمة | `https://daousha-vide-nbqlahcj.manus.space/terms` |
| سياسة الخصوصية | `https://daousha-vide-nbqlahcj.manus.space/privacy` |
| الصفحة الرئيسية | `https://daousha-vide-nbqlahcj.manus.space/` — تعرض شاشة دخول للوحة التحكم |

لذلك لا تُستبدل روابط الشروط أو الخصوصية بعناوين أخرى؛ المشكلة الحالية هي إثبات ملكية رابط الويب في TikTok، لا صلاحية صفحات الامتثال نفسها.

في بوابة TikTok ظهر ملف التوقيع المطلوب للتحقق عبر URL prefix باسم `tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt`. صار متاحًا بصورة دائمة عبر:

`https://daousha-vide-nbqlahcj.manus.space/tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt`

يحافظ المسار الخادمي على محتوى الملف الأصلي وعلى `Content-Type: text/plain` ويعطل التخزين المؤقت للاستجابة. لا ينبغي تغيير الاسم أو المحتوى أو وضع الملف تحت مسار فرعي عند إعادة محاولة Verify.

## المراجع

[1]: https://developers.tiktok.com/doc/content-posting-api-get-started "TikTok — Content Posting API: Get Started"
[2]: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post "TikTok — Direct Post API Reference"
[3]: https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide "TikTok — Content Posting API: Media Transfer Guide"
