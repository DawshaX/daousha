# 🔐 إعداد الأسرار — خطوة بخطوة لدوشة

كل الأسرار في ملف واحد فقط: `factory/.env` (لا يدخل Git أبداً).

## 1) YouTube (موجود من النظام القديم — إعادة استخدام)

من ملف `secrets.txt` القديم انسخ:

```
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...   (استخدم FULL scope إن وُجد)
```

إن انتهى التوكن: أعد التفويض بنفس الـ OAuth Client القديم
(`276755111100-...` مشروع xdaw-nova) ثم الصق الجديد.

## 2) Facebook (موجود — page token دائم)

```
FACEBOOK_PAGE_ACCESS_TOKEN=...
FACEBOOK_PAGE_ID=1265727539958933
```

إن فشل: ولّد Explorer token جديد → exchange طويل الأمد (نفس سكربتات v1).

## 3) Instagram (جديد — Graph API)

1. حوّل حساب @xdaw_nova إلى **Business/Creator** واربطه بصفحة فيسبوك.
2. من Graph API Explorer: توكن بصلاحية `instagram_content_publish`.
3. اعرف الـ IG User ID عبر `/{page-id}?fields=instagram_business_account`.

```
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...
PUBLIC_VIDEO_BASE=https://...   (رابط عام لملفات vault — R2/S3/CDN)
```

> ملاحظة: إنستجرام API يتطلب رابط فيديو عاماً. بدون CDN يبقى النشر
> اليدوي عبر التطبيق خياراً (الفيديو جاهز في vault/).

## 4) Telegram (موجود — بوت xDaw_NOVA)

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=1890579200
```

## 5) الإنتاج (اختياري)

```
PEXELS_API_KEY=...      (وضع stock — اختياري، المصنع يعمل بدونه)
ELEVENLABS_API_KEY=...  (صوت فاخر — اختياري، الافتراضي edge المجاني)
```

## 6) تفعيل النشر الحقيقي

```
FACTORY_DRY_RUN=false
```

ثم اختبر: `python3 -m pipeline.publish --platform youtube --live`
