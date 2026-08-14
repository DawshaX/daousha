# XDAW NOVA (داوسها) — نظام النشر التلقائي الكامل

استوديو محتوى معرفي عربي قصير (Reels/Shorts) يبث على **YouTube وInstagram وFacebook وTikTok** تلقائيًا بلا أي تدخل يدوي.

> لأي مهمة جديدة (حتى في شات جديد): اقرأ هذا الملف + `docs/current_state_snapshot.md` + `docs/platform-link-status.md` وستفهم النظام كاملًا وتكمل من آخر نقطة.

## نظرة عامة على النظام

| المكوّن | الوصف | الموقع |
|---|---|---|
| مكتبة المواضيع | 20+ موضوعًا معرفيًا عربيًا بنمط «3 حقائق صادمة» — يستهلك النظام منها حلقة حلقة | `topic_library.json` |
| نظام الإنتاج | يختار الحلقة التالية → سيناريو → تعليق صوتي → 4 مشاهد → فيديو 9:16 | `produce_next_episode.py` + `build_episode.sh` |
| نظام النشر | YouTube (OAuth دائم) + Facebook (page token دائم) + Instagram (MCP) | `publish_all.py` + سكربتات `upload_*_ep{N}.py` |
| الإشعارات | بوت Telegram (xDaw_NOVA) يخبر المستخدم بكل منشور وحالة النظام | `notify_telegram.py` |
| المتابعة | فحص دوري لقبول TikTok + سلم النشر التصاعدي + تحديث GitHub لحظي | `current_playbook.md` (جدول دوري) |

## منصات النشر وحالتها

| المنصة | الربط | الحالة |
|---|---|---|
| YouTube | OAuth refresh token دائم (قناة xDaw_NoVa) | ✅ منشور 4 حلقات علنًا |
| Instagram | Manus Instagram connector (حساب @xdaw_nova) | ✅ منشور 4 حلقات علنًا |
| Facebook | Long-lived page token دائم (صفحة XDAW NOVA) | ✅ منشور 4 حلقات علنًا |
| TikTok | تطبيق xDaW NoVa — Live Mode Review | ⏳ In review (يُنشر لحظة القبول) |
| Telegram | بوت xDaw_NOVA للإشعارات | ✅ يعمل |

## جدول النشر التلقائي

يعمل الجدول الدوري **مرتين يوميًا (10:00 صباحًا و4:00 عصرًا بتوقيت القاهرة)** وفي كل تشغيل:
1. يفحص قبول TikTok — لحظة الموافقة يربط الحساب الحقيقي وينشر عامةً
2. ينتج الحلقة التالية من `topic_library.json` (سيناريو + صوت + مشاهد + فيديو)
3. ينشرها على YouTube + Facebook + Instagram
4. يرسل إشعار Telegram بروابط المنشورات
5. يحدث هذا المستودع بالوثائق والحالة

## الملفات الأساسية

| الملف | الدور |
|---|---|
| `topic_library.json` | قائمة المواضيع وحالة كل حلقة (queued/produced/published) |
| `current_playbook.md` | دليل التشغيل الكامل لأي دورة مستقبلية (ذاتي) |
| `docs/platform-link-status.md` | سجل كل المنشورات بروابطها على كل منصة |
| `docs/publishing-ladder-state.md` | سلم النشر التصاعدي (level/dailyCap/streak) |
| `docs/current_state_snapshot.md` | لقطه حالة شاملة للأنظمة والأسرار المرجعية |
| `scripts/publish_all.py` | سكربت النشر الموحد (YouTube + Facebook + تلجرام) |
| `scripts/build_episode.sh` | بناء فيديو 9:16 من 4 مشاهد + تعليق صوتي |
| `scripts/notify_telegram.py` | إشعار تلجرام: `python3 notify_telegram.py publish "{عنوان}" "{yt}" "{ig}" "{fb}"` |

## قواعد التشغيل الإلزامية

1. الأسرار في `/home/ubuntu/secrets.txt` فقط — لا تُعرض ولا تُطبع في أي رسالة.
2. لا تتجاوز dailyCap من `docs/publishing-ladder-state.md`.
3. لا تنشر حلقة منشورة سابقًا (راجع `topic_library.json`).
4. لا تنشر على TikTok قبل القبول الرسمي للمراجعة.
5. عند 3 أخطاء متتالية أو إشارة حظر: توقف وأخبر المستخدم عبر Telegram.
6. تحديث المستودع في نهاية كل تشغيل — هذا هو المصدر الوحيد للحقيقة بين الجلسات.

## سجل الحلقات المنشورة

| الحلقة | الموضوع | YouTube | Instagram | Facebook | التاريخ |
|---|---|---|---|---|---|
| 1 | الدماغ يعمل على ثلث طاقته | KsPu75budwA | DcB9PhLiYxg | 29350563061210067 | 2026-08-14 |
| 2 | القلب ينـبض 2.5 مليار مرة | YDWrSeMH4o8 | DcCLwsYEWd5 | 122103892671434391 | 2026-08-14 |
| 3 | عينك تكذب عليك كل يوم | opuu9zPgN-w | DcCW2HdEanZ | 122103941919434391 | 2026-08-15 |
| 4 | 3 أكاذيب عن ذاكرتك | fm7Y0h1YBVg | DcCYJ1TDuvK | 122103948783434391 | 2026-08-15 |
| 5 | أثناء نومك يحدث شيء مدهش | قيد الإنتاج (بقيت الصور) | — | — | 2026-08-15/16 |

## التطوير المستقبلي

- تفعيل TikTok لحظة القبول (النشر الرابع العام)
- أنواع محتوى جديدة وجداول مزامنة إضافية (خطة المستخدم الكبرى)
- ترقية السلم التصاعدي حتى 10 حلقات يوميًا (بموجب قواعد streak)
- الربح والنشر التجاري بعد تفعيل Monetization على المنصات
