# 📕 كتاب التشغيل اليومي — XDAW NOVA FACTORY

## أوامر دوشة اليومية

| المهمة | الأمر |
|---|---|
| حالة المخزون | `python3 -m pipeline.vault --status` |
| حالة البنك | `python3 -m pipeline.topics --stats` |
| إنتاج حلقة (AR+EN) | `python3 -m pipeline.make_episode --lang both` |
| نشر تجريبي | `python3 -m pipeline.publish --platform rotation` |
| نشر حقيقي | `python3 -m pipeline.publish --platform rotation --live` |
| دورة واحدة (إنتاج+نشر) | `python3 -m pipeline.scheduler --once --live` |
| المحرك المستمر | `python3 -m pipeline.scheduler --every-minutes 60 --live` |
| الاختبارات | `python3 -m pytest tests/ -q` |

## إشارات الخطر (توقف واستدعِ دوشة)

- 🚨 `BANK_EMPTY_NEED_EXPANSION` → البنك الجاهز نفد — جلسة كتابة حقائق جديدة.
- 🚨 3 أخطاء نشر متتالية → المحرك يتوقف وحده + تلجرام.
- 🚨 `healthy: false` في المخزون → زِد الإنتاج اليومي (`--produce 6`).
- 🚨 أي رسالة `403/blocked/ban` → توقف فوري، لا تحاول مجدداً قبل المراجعة.

## جلسة توسيع البنك (أسبوعياً — 20 دقيقة)

1. `python3 -m pipeline.expand_bank --stats` → اعرف الفئات الناقصة.
2. اختر 10 مواضيع `needs_facts` من `topics/bank_full.json`.
3. اكتب لكل واحد 3 حقائق موثقة (AR+EN) — بمساعدة الوكيل.
4. انقلها إلى `topics/bank_seed.json` (غيّر id إلى sXX).
5. `python3 -m pytest tests/ -q` للتأكد.

## أهداف المخزون

| المرحلة | المخزون | المعنى |
|---|---|---|
| 🟡 آمن | 72 ساعة | 3 أيام نشر بلا إنتاج |
| 🟢 قوي | 720 فيديو | شهر كامل |
| 🔵 سنة | 8,760 فيديو | استقلال كامل سنة |
| 🏆 3 سنين | 26,280 فيديو | الإمبراطورية |
