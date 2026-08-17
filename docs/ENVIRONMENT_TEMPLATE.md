# قالب متغيرات البيئة الآمن — XDAW NOVA / DAWSHA

> لا تحفظ أي قيمة في Git أو ضمن ملف محلي يجري رفعه. أنشئ هذه المتغيرات في مدير أسرار الاستضافة أو بيئة التشغيل الجديدة فقط.

## النواة

| المتغير | مطلوب | الغرض |
|---|---:|---|
| `DATABASE_URL` | نعم | رابط اتصال MySQL/TiDB. |
| `JWT_SECRET` | نعم | توقيع جلسات الخادم؛ قيمة عشوائية طويلة. |
| `OWNER_OPEN_ID` | نعم | معرّف مالك المنصة. |
| `OWNER_NAME` | نعم | الاسم المعروض للمالك: `DAWSHA`. |

## المساعدات الذكية

| المتغير | مطلوب | الغرض |
|---|---:|---|
| `GEMINI_API_KEY` | اختياري | مسودات Gemini التي يطلبها المالك صراحة. |
| `OPENAI_API_KEY` | اختياري | مسودات OpenAI التي يطلبها المالك صراحة. |
| `PERPLEXITY_API_KEY` | لا حاليًا | يبقى معطلًا حتى قرار صريح بخطة API مدفوعة. |

## القنوات الرسمية

| المتغير | مطلوب | الغرض |
|---|---:|---|
| `TELEGRAM_BOT_TOKEN` | نعم عند استخدام Telegram | مرآة تحكم NOVA. |
| `TELEGRAM_WEBHOOK_SECRET` | نعم عند استخدام Telegram | تحقق Webhook؛ أنشئ قيمة عشوائية طويلة. |
| `YOUTUBE_CLIENT_ID` | نعم عند استخدام YouTube | OAuth الرسمي. |
| `YOUTUBE_CLIENT_SECRET` | نعم عند استخدام YouTube | OAuth الرسمي. |
| `META_APP_ID` / `META_APP_SECRET` | نعم عند استخدام Meta | OAuth الرسمي لفيسبوك/إنستغرام. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | نعم عند استخدام Facebook | نشر صفحة Facebook الرسمية. |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | نعم عند استخدام Instagram | تكامل Instagram الرسمي. |

## متغيرات معطلة عمدًا

لا تضف مفاتيح TikTok إلى البيئة الجديدة إلا بعد موافقة TikTok الرسمية. يظل TikTok خارج مسار النشر الحالي.

## قاعدة استعادة القنوات

بعد النقل إلى استضافة جديدة، أعد ربط OAuth للقنوات في البيئة الجديدة ولا تنقل رموز وصول قديمة عبر Git أو الرسائل. راجع مسارات التجديد في `server/channelRenewalPolicy.ts` وحواجز النشر في `server/publishingGuards.ts` قبل تشغيل أي جدول تلقائي.
