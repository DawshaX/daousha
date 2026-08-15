# Publishing Ladder State — XDAW NOVA

This file is the single source of truth for the escalating daily publishing cap. Update after every publish run.

- level: 0
- dailyCap: 2
- streakSafe: 2 (2026-08-15: production + IG publish clean; YT/FB deferred for environmental reason, not platform risk)
- streakRisky: 0
- lastPublishDate: 2026-08-15
- lastPublishUrl: https://www.instagram.com/reel/DcDij0miryG/
- lastPublishPlatform: Instagram-only run (YouTube/Facebook deferred — secrets file missing in new session; resume publish when restored)
- history:
  - date: 2026-08-14
    platform: YouTube
    video: "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة"
    url: https://www.youtube.com/watch?v=KsPu75budwA
    status: published-public
  - date: 2026-08-14
    platform: Instagram
    video: "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة"
    url: https://www.instagram.com/reel/DcB9PhLiYxg/
    status: published-public
  - date: 2026-08-14
    platform: Facebook
    video: "دماغك يعمل على ثلث طاقته فقط! 3 حقائق صادمة"
    url: https://www.facebook.com/reel/29350563061210067/
    status: published-public
  - date: 2026-08-15
    platform: Instagram (YouTube + Facebook pending — secrets.txt missing in new session; full video produced)
    video: "دماغك يستيقظ وأنت نائم! 3 اكتشافات صادمة عن النوم"
    url: https://www.instagram.com/reel/DcDij0miryG/
    status: published-public
- youtubeOAuth: YOUTUBE_REFRESH_TOKEN مربوط بنجاح بحساب dawshaxlol@gmail.com / قناة xDaw_NoVa (2026-08-14)
- telegram: إشعار النشر أُرسل بنجاح
- instagram: منشور عبر Manus Instagram connector (حساب @xdaw_nova) — لا حاجة لمراجعة Meta
- facebook: منشور عبر Meta Graph API (تطبيق XDAW NOVA Publisher، صفحة XDAW NOVA) — **التوكن مرتبط بجلسة المستخدم، يُعاد توليده من Graph API Explorer عند تسجيل الخروج/الدخول**
- tiktok: Live Mode Review قُدِّم رسمياً 2026-08-14 (التطبيق xDaW NoVa، Production / In review، فيديو العرض مرفوع، Direct Post مفعّل) — بعد الموافقة نربط الحساب الحقيقي عبر OAuth والنشر يصبح تلقائياً بالكامل
