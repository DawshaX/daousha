# 🚀 النشر على استضافة مجانية — خطوات دوشة (10 دقائق)

## الطريقة 1: Render (الأسهل — بدون بطاقة)

1. افتح https://render.com وسجّل بحساب GitHub.
2. **New +** → **Blueprint** → اختر مستودع `DawshaX/daousha`.
3. Render يقرأ `render.yaml` وحده → اضغط **Apply**.
4. انتظر 5 دقائق → يعطيك رابطاً مثل `https://xdaw-factory.onrender.com`.
5. افتح الرابط = لوحة التحكم! (الرمز موجود في Environment).
6. في **Environment** أضف: `TELEGRAM_BOT_TOKEN` + `YOUTUBE_*` + `FACEBOOK_*` عند الجاهزية للنشر.

> ملاحظة: الخطة المجانية تنام بعد 15 دقيقة خمول — UptimeRobot (مجاني)
> يعمل ping للرابط كل 5 دقائق فيبقى المصنع صاحياً.

## الطريقة 2: HuggingFace Spaces (بدون بطاقة)

1. افتح https://huggingface.co/spaces → **Create new Space** → Docker Blank.
2. ارفع محتويات المستودع (أو اربط GitHub).
3. الـ Space يبني الـ Dockerfile ويفتح اللوحة على بورت 7860 تلقائياً.

## الطريقة 3: جهازك (الأقوى — إنترنتك وصوتك)

```
git clone https://github.com/DawshaX/daousha.git
cd daousha/factory
pip install -r requirements.txt
python -m pipeline.scheduler --every-minutes 15 --produce 3 --no-publish --tts-provider edge
python dashboard/app.py
```

ثم `cloudflared tunnel --url http://localhost:8000` لرابط عام مجاني.

## بعد النشر: تفعيل الصوت الحقيقي التلقائي

على الاستضافة (إنترنت مفتوح) يعمل كل شيء وحده:
- `edge-tts` = صوت نسائي عربي تلقائي (بدل صوت الروح اليدوي)
- `ensure_fonts` = خط القاهرة الأصلي
- `facts_miner` = مواضيع لا تنتهي من ويكيبيديا
- `mirror` = نسخة تلجرام من كل فيديو

## التشغيل هنا مؤقتاً

لوحة التحكم تعمل الآن في هذه الجلسة (Live Preview بورت 8000)،
والمصنع ينتج ويخزن — حتى تنتقل للاستضافة الدائمة.
