# Platform Link Status — XDAW NOVA

Last verified: 2026-08-14. Facebook upgraded to permanent long-lived page token on the same date. TikTok live-mode review submitted on the same date (2026-08-14). Secrets never live in this repo; they stay in the owner's local `.env.local` (owner must copy `secrets.txt` back after every credential rotation).

## First multi-platform publish (2026-08-14)

Episode 1 — "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة" was published to three platforms in a single run:

| Platform | Public URL | Verified |
|---|---|---|
| YouTube | https://www.youtube.com/watch?v=KsPu75budwA | Yes — public, channel xDaw_NoVa |
| Instagram | https://www.instagram.com/reel/DcB9PhLiYxg/ | Yes — reel on @xdaw_nova via Manus Instagram connector |
| Facebook | https://www.facebook.com/reel/29350563061210067/ | Yes — reel on page XDAW NOVA (page ID 1265727539958933) |

## Second publish (2026-08-14) — Episode 2

Episode 2 — "قلبك ينبض 2.5 مليار مرة! 3 حقائق ستصدمك" (produced and published fully automatically in the same session):

| Platform | Public URL | Verified |
|---|---|---|
| YouTube | https://www.youtube.com/watch?v=YDWrSeMH4o8 | Yes — public, channel xDaw_NoVa |
| Instagram | https://www.instagram.com/reel/DcCLwsYEWd5/ | Yes — reel on @xdaw_nova |
| Facebook | https://www.facebook.com/1265727539958933/videos/122103892671434391 | Yes — reel on page XDAW NOVA |

## Connection notes

YouTube publishing uses a refresh token obtained via the project OAuth client `276755111100-7ll905jqkefcbanqrqnvm1p4ogl5n229` (project `xdaw-nova`). Redirect URI `https://8899-ivfx0jnsfhm4lb21x07io-ae1265fb.sg1.manus.computer/callback` was registered on that client in 2026-08-14 and works; re-authorize there if the refresh token is ever revoked.

Instagram is connected through the Manus Instagram connector (account @xdaw_nova) and publishes reels without needing the Meta app to be in live mode.

Facebook publishes via Meta Graph API with a **long-lived page token** (verified via debug_token: type PAGE, expires never, scopes include pages_manage_posts) generated from Graph API Explorer then exchanged through app `XDAW NOVA Publisher` (App ID 2828503350861658). Target page is **XDAW NOVA, page ID 1265727539958933**, linked at https://www.facebook.com/1265727539958933 — owned by the owner's personal Facebook account ("محمد ضياء" profile); publishing always goes to the **page**, never to the personal profile. The short-lived Explorer token (1265727539958933_61593031750114 profile.php display form is the same page in some contexts) was converted to long-lived with `fb_longlived2.py`/`fb_finalize.py` and stored in the local secrets file as `FACEBOOK_PAGE_ACCESS_TOKEN` — no expiry. If a future publish ever fails with an OAuth error, run the same exchange scripts with a fresh Explorer user token (rare, roughly every 60 days at worst).

TikTok: app **xDaW NoVa** (App ID 7673768835363145748, production client key `awa32n4co6o1vqbm`, sandbox key `sbawlacpenz2vl9ygx`) is fully configured with Login Kit + Content Posting API and scopes `user.info.basic`, `video.publish`, `video.upload`; Direct Post is enabled (publish straight to the profile via `push_by_file`). Category Education, website and redirect URI point at `https://daousha-vide-nbqlahcj.manus.space/` (callback `/api/integrations/tiktok/callback`), with privacy-policy and ToS pages on the same domain. **Live-mode review submitted on 2026-08-14** at https://developers.tiktok.com/app/7673768835363145748/pending with the end-to-end demo video `xdawnova-tiktok-review-demo-sandbox-live.mp4` and the reason "Submitting for Live Mode review to enable automated publishing of our educational bilingual content via the Content Posting API." Status: Production / **In review**; once approved, re-authorize the owner's real TikTok account through the OAuth flow and publishing becomes fully automatic. Until approval, sandbox publishing remains available with the sandbox client key.

Meta Ads account act_1502752946625950 is disabled; not required for organic launch.


## النشر التلقائي — 2026-08-15 (الحلقات 3 و4)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 3 | عينك تكذب عليك كل يوم | https://www.youtube.com/watch?v=opuu9zPgN-w | https://www.instagram.com/reel/DcCW2HdEanZ/ | 1265727539958933_122103941919434391 |
| 4 | 3 أكاذيب عن ذاكرتك | https://www.youtube.com/watch?v=fm7Y0h1YBVg | https://www.instagram.com/reel/DcCYJ1TDuvK/ | 1265727539958933_122103948783434391 |

## النشر — 2026-08-15 (الحلقة 5)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 5 | دماغك يستيقظ وأنت نائم! 3 اكتشافات صادمة عن النوم | — pending (secrets غير متوفرة في جلسة 2026-08-15 — يتطلب استعادة secrets.txt أو إعادة تفويض) | https://www.instagram.com/reel/DcDij0miryG/ | — pending (نفس سبب YouTube) |

ملاحظة تشغيلية: جلسة 2026-08-15 بدأت في sandbox جديد لا يحتوي `/home/ubuntu/secrets.txt`، لذلك تعذّر النشر على YouTube/Facebook وإشعار Telegram. الحلقات ep5 كاملة (فيديو 1080x1920، 42.6 ثانية، تعليق Charon + 4 صور). عند استعادة الملف يستكمل النشر فورًا دون إعادة إنتاج.

## TikTok — فحص 2026-08-15 (11:05 القاهرة)
الحالة لا تزال **Production / In review** (نفس حالة 2026-08-14). رسالة TikTok: تأخير محتمل بسبب كثرة الطلبات. لا إعادة تقديم ولا تغيير إعدادات. بعد القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة.

## TikTok — فحص 2026-08-15 (مساءً، توقيت القاهرة)
صفحة المطورين تتطلب تسجيل دخول (لم تُفتح في جلسة المتصفح). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا.

## الحلقة 6 — الإنتاج (2026-08-15 مساءً)
| الحلقة | الموضوع | الحالة |
|---|---|---|
| 6 | أحلامك ليست عشوائية! 3 أسرار علمية ستصدمك | produced — فيديو 1080x1920، 36.4s، التعليق 37.8s، 4 صور |
النشر يتوقف على استعادة /home/ubuntu/secrets.txt (YouTube + Facebook + Telegram غير متاحة في هذه الجلسة). Instagram لا يزال متاحًا عبر connector.

## النشر — 2026-08-15 (مساءً — تشغيل مجدول، الحلقة 7)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 7 | الجاذبية ليست قوة! 3 أسرار ستقلب فهمك رأسًا على عقب | — pending (secrets غير متوفرة في جلسة الجدولة) | https://www.instagram.com/reel/DcE1eNEDLX5/ | — pending (نفس سبب YouTube) |

الحلقة 7: produced كامل (1080x1920، 42.1s، narration 43.6s، 4 صور) في docs/episode7/ وtest_run/. topic_library.json محدثة: ep7 = produced.
YT/FB/Telegram: معطّلة في هذه الجلسة — غياب /home/ubuntu/secrets.txt من جلسة الجدولة. الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5 وep6 وep7.
TikTok — فحص 2026-08-15 (مساءً مجدولة): صفحة المطورين تظهر "No access / تسجيل دخول مطلوب" في متصفح المستخدم؛ الحالة المسجلة تبقى **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.


## النشر — 2026-08-16 (تشيغيل مجدول، الحلقات 6 و8)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 6 | أحلامك ليست عشوائية! 3 أسرار علمية ستصدمك | — pending (secrets غير متوفرة في جلسة الجدولة) | https://www.instagram.com/reel/DcFdUQGjgnC/ | — pending (نفس سبب YouTube) |
| 8 | المحيطات تخفي أسرارًا مرعبة! 3 حقائق لن تصدقها | — pending (نفس السبب) | https://www.instagram.com/reel/DcFeX05jNsp/ | — pending (نفس السبب) |

ملاحظة تشغيلية (مكررة منذ 2026-08-15): جلسات الجدولة الآلية تبدأ في sandbox جديد لا يحتوي `/home/ubuntu/secrets.txt`، لذلك يستمر تعذّر النشر على YouTube/Facebook وإشعار Telegram. الحلقات ep5 وep6 وep7 وep8 كاملة؛ عند استعادة الملف يُستكمل نشر ep5-7 فورًا دون إعادة إنتاج. Instagram يعمل دائمًا عبر Manus connector.

## TikTok — فحص 2026-08-16 (03:05 UTC / 06:05 القاهرة)
صفحة المطورين تعرض «No access — تسجيل دخول مطلوب» في متصفح المستخدم (لم يُفتح المتصفح بتسجيل دخول المطور). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## الحلقة 9 — الإنتاج والنشر (2026-08-16 — 09:10 UTC / 12:10 القاهرة)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 9 | شمسنا ليست ما تظن! 3 حقائق صادمة ستغير نظرتك إليها | — pending (secrets غير متوفرة في جلسة الجدولة) | https://www.instagram.com/reel/DcGHbbVgOG0/ | — pending (نفس السبب) |
الحلقة 9: produced كامل (1080x1920، 46.7s، narration Charon 48.2s، 4 صور 1440x2560) في docs/episode9/. topic_library.json محدثة: ep9 = produced. YT/FB/Telegram: معطلة بيئيًا في هذه الجلسة — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5 وep6 وep7 وep9.

## النشر — 2026-08-16 (18:00 القاهرة — تشغيل مجدول، الحلقات 10 و11)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 10 | داخل جسمك شيفرة كونية! 3 أسرار في حمضك النووي ستدهشك | — pending (secrets غير متوفرة في جلسة الجدولة) | https://www.instagram.com/reel/DcHanMzlU8A/ | — pending (نفس السبب) |
| 11 | تحت قدميك إمبراطورية كاملة! 3 حقائق صادمة عن عالم النمل | — pending (نفس السبب) | https://www.instagram.com/reel/DcHahryiU2D/ | — pending (نفس السبب) |

ملاحظة تشغيلية (مكررة منذ 2026-08-15): جلسات الجدولة الآلية تبدأ في sandbox جديد لا يحتوي `/home/ubuntu/secrets.txt`، لذلك يستمر تعذّر النشر على YouTube/Facebook وإشعار Telegram. الحلقات ep5 وep6 وep7 وep8 وep9 وep10 وep11 كاملة؛ عند استعادة الملف يُستكمل نشرها فورًا دون إعادة إنتاج. Instagram يعمل دائمًا عبر Manus connector.

## TikTok — فحص 2026-08-16 (18:15 القاهرة)
صفحة المطورين تعرض «No access — تسجيل دخول مطلوب» في المتصفح (لم يُفتح المتصفح بتسجيل دخول المطور). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## النشر — 2026-08-17 (12:00 القاهرة — تشغيل مجدول، الحلقتان 12 و13)

| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 12 | الوقت يسير في اتجاهين! 3 مفارقات صادمة ستصدمك | — pending (secrets غير متوفرة في جلسة 2026-08-17 — يتطلب استعادة secrets.txt) | https://www.instagram.com/reel/DcIr8VxjRCi/ | — pending (نفس سبب YouTube) |
| 13 | لغتك أقوى من أن تتخيل! 3 حقائق صادمة عن العربية | — pending (نفس السبب) | https://www.instagram.com/reel/DcIsD3ikduQ/ | — pending (نفس السبب) |

الحلقتان 12 و13: produced كامل في هذه الدورة (ep12: 1080x1920، 42.0s، narration Charon 43.5s؛ ep13: 1080x1920، 43.5s، narration Charon 45.0s، 4 صور 1440x2560 لكل منهما) في docs/episode12/ وdocs/episode13/. topic_library.json محدثة: ep12، ep13 = produced. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5 وep6 وep7 وep8 وep9 وep10 وep11 وep12 وep13. Instagram يعمل دائمًا عبر Manus connector.

ملاحظة تشغيلية (مكررة منذ 2026-08-15): جلسات الجدولة الآلية تبدأ في sandbox جديد لا يحتوي `/home/ubuntu/secrets.txt`، لذلك يستمر تعذّر النشر على YouTube/Facebook وإشعار Telegram. عند استعادة الملف يُستكمل نشر ep5-13 فورًا دون إعادة إنتاج.

## TikTok — فحص 2026-08-17 (12:03 القاهرة)

صفحة المطورين تعرض «No access — You need to login» في متصفح المستخدم (لم يُفتح المتصفح بتسجيل دخول المطور). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.


## النشر — 2026-08-17 (18:02 القاهرة — تشغيل مجدول، الحلقة 14)

| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 14 | قطتك أقوى بكثير مما تظن! 3 حقائق صادمة ستصدمك | — pending (secrets غير متوفرة في جلسة الجدولة) | https://www.instagram.com/reel/DcJV2K1ino9/ | — pending (نفس السبب) |

الحلقة 14: produced كامل في هذه الدورة (1080x1920، 41.7s، narration Charon 43.2s، 4 صور 1440x2560) في test_run/ وdocs/episode14/. topic_library.json محدثة: ep14 = published-ig. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5 وep6 وep7 وep8 وep9 وep10 وep11 وep12 وep13 وep14. Instagram يعمل دائمًا عبر Manus connector.

## TikTok — فحص 2026-08-17 (18:18 القاهرة)

صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (فقدت جلسة تسجيل الدخول القديمة، وتسجيل الدخول يتطلب بيانات يدوية). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## دورة 2026-08-17 (منتصف الليل — ~00:15 القاهرة)
الحلقة 15 (خريطة جوجل أصلها عربي! 3 حقائق صادمة ستدهشك): إنتاج جزئي في هذه الدورة — سيناريو (312 حرفًا) + narration15.wav (32.4s بصوت Charon) + ep15-scene1.png مولّد بجودة جيدة (النص العربي صحيح) في docs/episode15/. حصة توليد الصور نفدت (20/20 — خطة مجانية) بعد المشهد الأول؛ تبقى المشاهد 2-4 (prompts جاهزة في cycle-notes.md / docs/episode15) لإكمالها في الدورة التالية فور تجدد الحصة، ثم بناء الفيديو final. لا يوجد تكرار مع ep12/ep13 (موضوع مختلف: اختراعات إسلامية). topic_library.json: ep15 = pending-images.
YT/FB/Telegram: ما تزال معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5 إلى ep14. Instagram يعمل دائمًا عبر Manus connector.
TikTok: صفحة المطورين تعرض «No access — You need to login» (نفس نتيجة 18:18 القاهرة اليوم)؛ الحالة المسجلة تبقى Production / In review منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات.
السلم: level 2، dailyCap 6، streakSafe 11 (لا أخطاء نشر هذه الدورة — التأجيل بسبب انقطاع بيئي فقط: secrets.txt وحصة الصور).
===
## النشر — 2026-08-18 (نشرة 6 صباحًا القاهرة)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 15 | خريطة جوجل أصلها عربي! 3 حقائق صادمة | — pending (secrets.txt غائب) | https://www.instagram.com/reel/DcKnOPslFoe/ | — pending (secrets.txt غائب) |
ملاحظة: ep15 أُنتجت كاملة هذه الدورة (المشاهد 2-4 بعد نفاد حصة الصور أمس). YT/FB/Telegram معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة. الحلقات المعلقة للنشر الكامل: ep5 إلى ep15.

## الإنتاج — 2026-08-18 (دورة مجدولة، الحلقة 16)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 16 | ماء جسمك عمره 4 مليارات سنة! 3 حقائق صادمة عن الماء | — produced (secrets.txt غائب) | — produced, CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/mIRuiTLgZoJpvfxq.mp4 | — produced (secrets.txt غائب) |
الحلقة 16: produced كامل في هذه الدورة (1080x1920، 34.5s، narration Charon 36.0s، 4 صور 1440x2560) — سيناريو ep16-script.md، المشاهد والأصول في scripts/. topic_library.json محدثة: ep16 = produced. YT/FB/Telegram معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل: ep5 إلى ep16.

## TikTok — فحص 2026-08-18 (دورة مجدولة)
صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة. آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## النشر — 2026-08-18 (دورة 6 مساءً القاهرة)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 16 | ماء جسمك عمره 4 مليارات سنة! 3 حقائق صادمة عن الماء | — pending (secrets.txt غائب) | https://www.instagram.com/reel/DcL5ZjuFStQ/ | — pending (secrets.txt غائب) |

## النشر — 2026-08-18 (11:30م القاهرة — تشغيل مجدول، الحلقة 17)

| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 17 | نحلة تقهر الموت! 3 أسرار عن نحل العسل ستدهشك | — pending (secrets.txt غير متوفرة في جلسة 2026-08-18 المسائية) | https://www.instagram.com/reel/DcMl5jFDqjC/ | — pending (نفس السبب) |

الحلقة 17: produced كامل في هذه الدورة (1080x1920، 38.6s، narration Charon 40.1s، 4 صور 1440x2560) في test_run/ وdocs/episode17/. topic_library.json محدثة: ep17 = produced. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5–ep17 (كلها produced).

## TikTok — فحص 2026-08-18 (11:36م القاهرة)

صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (فقدت جلسة تسجيل الدخول القديمة، وتسجيل الدخول يتطلب بيانات يدوية). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## النشر — 2026-08-19 (6 صباحًا القاهرة — تشغيل مجدول، الحلقة 18)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 18 | دمك فيه نجوم حرفيًا! 3 حقائق صادمة عن الحديد | — pending (secrets.txt غائب — نفس القيد منذ 2026-08-15) | https://www.instagram.com/reel/DcNNO3tAevH/ | — pending (نفس السبب) |
الحلقة 18: produced كامل في هذه الدورة (1080x1920، 46.4s، narration18b.wav Charon 47.9s بوتيرة أبطأ مدروسة، 4 صور 1440x2560) في test_run/ وdocs/episode18/. CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/kterfzDHDguyIprs.mp4. topic_library.json محدثة: ep18 = produced. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5–ep18 (كلها produced).
## TikTok — فحص 2026-08-19 (03:12 UTC / 6:12 القاهرة)
صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (نفس النتيجة المتكررة). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.
## النشر — 2026-08-19 (12:19م القاهرة — تشغيل مجدول، الحلقة 19)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 19 | القمر يبتعد عنا كل ثانية! 3 أسرار عن القمر لم تسمعها | — pending (secrets.txt غائب — نفس القيد منذ 2026-08-15) | https://www.instagram.com/reel/DcN3RU1EY53/ | — pending (نفس السبب) |
الحلقة 19: produced كامل في هذه الدورة (1080x1920، 36.4s، narration19.wav Charon 37.9s، 4 صور 1440x2560) في test_run/ وdocs/episode19/. CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/FdzlZQGpIBMOyXjq.mp4. topic_library.json محدثة: ep19 = produced. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5–ep19 (كلها produced).
## النشر — 2026-08-20 (02:08 UTC / 5:08 فجرًا القاهرة — تشغيل مجدول، الحلقة 23)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 23 | الفراغ ليس فارغًا! 3 حقائق صادمة عن الفضاء | — pending (secrets.txt غائب — نفس القيد منذ 2026-08-15) | https://www.instagram.com/reel/DcPp7Srj48d/ | — pending (نفس السبب) |
الحلقة 23: produced كامل في هذه الدورة (1080x1920، 38.8s، narration23.wav Charon 40.3s، 4 صور 1440x2560) في test_run/ وdocs/episode23/. CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/TWPTIYbJLCOLanox.mp4. topic_library.json محدثة: ep23 = produced، واستُبدل موضوعا ep26 (القمر — مكرر مع ep19/21) وep27 (الصوت — مكرر مع ep20) بموضوعين جديدين (الجبال / السرعة) لتجنب التكرار. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt (نفس القيد منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5–ep22 (كلها produced/منشورة جزئيًا).

## TikTok — فحص 2026-08-20 (02:09 UTC / 5:09 فجرًا القاهرة)
صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (نفس النتيجة المتكررة). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## سجل تلجرام — 2026-08-20 (5:08 فجرًا القاهرة)
لم يُرسل إشعار تلجرام في هذه الدورة (بوت xDaw_NOVA يتطلب secrets.txt الغائب منذ 2026-08-15). تقرير الدورة أُرسل للمستخدم داخل المحادثة.

## TikTok — فحص 2026-08-19 (09:19 UTC / 12:19م القاهرة)
صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (نفس النتيجة المتكررة). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.
## سجل تلجرام — 2026-08-19 (12:19م القاهرة)
لم يُرسل إشعار تلجرام في هذه الدورة (بوت xDaw_NOVA يتطلب secrets.txt الغائب منذ 2026-08-15). تقرير الدورة أُرسل للمستخدم داخل المحادثة.

## النشر — 2026-08-19 (~18:49 القاهرة — تشغيل مجدول، الحلقة 20)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 20 | صوتك لا يُسمع في الفضاء! 3 حقائق صادمة عن الصوت | — pending (secrets.txt غائب — نفس القيد منذ 2026-08-15) | https://www.instagram.com/reel/DcOi8dzii3P/ | — pending (نفس السبب) |
الحلقة 20: produced كامل في هذه الدورة (1080x1920، 30.0s، narration20.wav Charon 31.5s، 4 صور 1440x2560) في test_run/ وdocs/episode20/. CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/zPCYUUrWtUlLeKUw.mp4. topic_library.json محدثة: ep20 = produced. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5–ep20 (كلها produced).

## TikTok — فحص 2026-08-19 (15:49 UTC / ~6:49م القاهرة)
صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (نفس النتيجة المتكررة). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.

## سجل تلجرام — 2026-08-19 (~18:49 القاهرة)
لم يُرسل إشعار تلجرام في هذه الدورة (بوت xDaw_NOVA يتطلب secrets.txt الغائب منذ 2026-08-15). تقرير الدورة أُرسل للمستخدم داخل المحادثة.

## دورة 2026-08-19 (21:16 UTC / 12:16م ليلًا القاهرة)
| الحلقة | الموضوع | YouTube | Instagram | Facebook |
|---|---|---|---|---|
| 21 | البرق يضرب نفس المكان! 3 حقائق صادمة ستصدمك | — pending (secrets.txt غائب — نفس القيد منذ 2026-08-15) | https://www.instagram.com/reel/DcPIZ58gChY/ | — pending (نفس السبب) |
الحلقة 21: produced كامل في هذه الدورة (1080x1920، 35.7s، narration Charon 37.2s، 4 صور 1440x2560) في test_run/ وdocs/episode21/. CDN: https://files.manuscdn.com/user_upload_by_module/session_file/310519663069883897/kzxrRwMCMJjpNQtj.mp4. topic_library.json محدثة: ep21 = produced. YT/FB/Telegram: معطلة بيئيًا — غياب /home/ubuntu/secrets.txt من جلسة الجدولة (نفس السبب منذ 2026-08-15). الحلقات المعلقة للنشر الكامل (YT/FB/Telegram): ep5–ep21 (كلها produced).
## TikTok — فحص 2026-08-19 (21:16 UTC / 12:16م القاهرة)
صفحة المطورين تعرض «No access — You need to login» في متصفح هذه الدورة (نفس النتيجة المتكررة). آخر حالة مسجلة تبقى: **Production / In review** منذ 2026-08-14. لا إعادة تقديم ولا تغيير إعدادات. عند القبول: ربط OAuth بالحساب الحقيقي ونشر الحلقة المعلقة فورًا + إشعار تلجرام.
## سجل تلجرام — 2026-08-19 (12:16م القاهرة)
لم يُرسل إشعار تلجرام في هذه الدورة (بوت xDaw_NOVA يتطلب secrets.txt الغائب منذ 2026-08-15). تقرير الدورة يُرسل للمستخدم داخل المحادثة.
