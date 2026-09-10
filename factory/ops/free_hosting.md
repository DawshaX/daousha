# 🆓 الاستضافة المجانية للمصنع — الدليل الكامل

## الخلاصة (اختار واحد)

| الخيار | التكلفة | يعمل 24/7؟ | الصوت الحقيقي | الصعوبة |
|---|---|---|---|---|
| **A. جهاز دوشة + Cloudflare Tunnel** | صفر | ✅ (طالما الجهاز شغال) | ✅ edge-tts | ⭐ سهل |
| **B. Oracle Cloud Always Free** | صفر للأبد | ✅✅ | ✅ | ⭐⭐⭐ (تسجيل ببطاقة) |
| **C. HuggingFace Spaces (Docker)** | صفر | ⚠️ يحتاج ping | ✅ | ⭐⭐ (بدون بطاقة) |

## الخيار A — جهازك هو السيرفر (الأسرع اليوم)

1. ثبّت Python 3.11 + Git على جهازك.
2. انسخ مجلد `factory/` وشغّل:
   ```
   pip install -r requirements.txt
   python -m pipeline.scheduler --every-minutes 15 --produce 3 --no-publish
   python dashboard/app.py   (لوحة التحكم على http://localhost:8000)
   ```
3. للوصول من الموبايل: ثبّت `cloudflared` وشغّل:
   ```
   cloudflared tunnel --url http://localhost:8000
   ```
   → يعطيك رابطاً عاماً للوحة التحكم مجاناً.

## الخيار B — Oracle Always Free (الأقوى للأبد)

- 4 معالجات ARM + 24GB رام + 200GB تخزين **مجاناً للأبد**.
- التسجيل يتطلب بطاقة بنكية (للتحقق فقط، لا خصم).
- بعد إنشاء الـ VM (Ubuntu):
  ```
  git clone <repo> && cd daousha/factory
  pip install -r requirements.txt
  cp .env.example .env  (واملأ أسرار تلجرام على الأقل)
  sudo cp ops/xdaw-factory.service /etc/systemd/system/
  sudo systemctl enable --now xdaw-factory
  ```
- افتح بورت 8000 للوحة التحكم من الـ Security List.

## الخيار C — HuggingFace Spaces (بدون بطاقة)

1. أنشئ Space جديد (Docker Blank).
2. ارفع `factory/` + ملف `Dockerfile` (نجهزه لك عند الطلب).
3. الـ Space ينام عند الخمول — استخدم UptimeRobot (مجاني) يعمل ping كل 5 دقائق.
4. **مرآة تلجرام إلزامية هنا** (التخزين مؤقت): كل فيديو يُرسل لقناتك فور إنتاجه.

## 🧰 عدّة المصنع المجانية (مليون فيديو بصفر جنيه)

| الأداة | البديل المجاني | الحالة |
|---|---|---|
| التعليق الصوتي | edge-tts (صوت نسائي عربي) | ✅ جاهز |
| المشاهد | توليد برمجي NOVA (بلا حدود) | ✅ يعمل |
| الحقائق | منجّم ويكيبيديا | ✅ جاهز |
| الموسيقى | توليد إجرائي + edge | ✅ يعمل |
| الخطوط | Cairo (تحميل تلقائي) | ✅ يعمل |
| التخزين السحابي | مرآة تلجرام | ✅ جاهز |
| الجدولة | المصنع نفسه | ✅ يعمل |

## ⚠️ تنبيه واحد

النشر على المنصات يحتاج مفاتيحك الخاصة (توضع في `.env` على السيرفر فقط).
لا تشارك ملف `.env` أبداً.
