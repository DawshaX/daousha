# حالة إنتاج الحلقة 29 — "عالم 2099" (2026-08-20)

## القرار النهائي للنمط
صور/فيديوهات خيال علمي مجانية خارجية (Pexels UHD) + نمط ep28 v2 المعتمد:
- كابتشنز PNG overlay متزامنة، ختم wm.png (تابع دوشة | Follow Dawsha)، غلاف cover-{ar,en}.png
- موسيقى ambient + narration (edge-tts ar-SA-HamedNeural / en-US-GuyNeural)
- فيديو نهائي 1080x1920 عمودي 30fps <180s

## الملفات الجاهزة
- سيناريو + توقيتات: docs/episode29/episode29-script.md
- narration29-ar.wav (51.5s) / narration29-en.wav (39.2s) في episode29/
- مقاطع Pexels محملة: episode29/clips/
  - city.mp4 (9.1s, 3840x2160, مدينة مستقبلية)
  - flying.mp4 (30.5s, 4096x2160, سيارات طائرة)
  - robots.mp4 (18.9s, عمودي 2160x3840!) روبوتات خيالية
  - hologram.mp4 (6.6s, عمودي 2160x3840) هولوغرام
  - neon.mp4 (10.0s, 3840x2160) نيون مدينة ليلية
- سكربت Pexels: /home/ubuntu/daousha/scripts/px_fetch.py (يعمل — Pexels via curl_cffi impersonate)
- سكربت ep28 البناء القابل لإعادة الاستخدام: episode28/gen_caps.py (كابتشنز PNG), overlays.py, make_cover.py, make_wm.py

## قرار المقاطع (بعد المعاينة grid_all.jpg)
- robots.mp4 (2160x3840 عمودي، روبوت أبيض واقعي — ممتاز scene2/sci-fi)
- scifi_city.mp4 (2160x3840 عمودي، لقطة وسطه بيضاء لكن أوله برج مدينة خيال علمي — قص أول 3s scene1/hook)
- neon_fut.mp4 (2160x3840 عمودي، رجل بتقنية هولوجرام زرقاء — scene3 technology)
- android.mp4 (3840x2160 أفقي، رأس أندرويد — scene4، قص مركزي)
- city.mp4 (3840x2160، برج خيال علمي ليلي — scene0/cover)
- مرفوض: flying(سيارة قديمة)، hologram(صورة بشرية)، neon(مدينة حقيقية ليلية)، drone(شبكة طرق سوداء)

## تقدم (بعد البناء)
- build29.py يعمل في الخلفية (nohup، سجل v2/build.log): 7 مقاطع عمودية 1080x1920@30 + concat + caps PNG (NotoNaskhArabic-Bold 60 / DejaVuSans-Bold 52، خلفية pill داكنة، overlay=40:200) + ختم wm.png (نسخ من ep28) + موسيقى pink noise 0.18 + narration (volume 0.75) → v2/episode29-ar-v2.mp4 و en-v2
- الغلافان يحتاجان إعادة توليد: الخلفية الصحيحة city.mp4 (برج مدينة خيال علمي ليلي نيون — إطاره جميل)، scifi_city.mp4 كان أزرار بحث بيضاء (لا يصلح إطلاقًا — يجب استبعاده من المشاهد! استبدله في scene0 بـ robots أول ثانية أو neon_fut)
- ghلاف قديم بنمط: + «عالم عام 2099 / 3 حقائق صادمة!» عربي ذهبي + «World of 2099 / 3 Shocking Facts!» إنجليزي)
- STT فعلي: AR 50.7s (تابع Dosh) / EN 38.5s (Follow Dasha)
- بعد البناء: 1) رفع الفيديوين والغلافين CDN (manus-upload-file) 2) نشر IG create_instagram (media_url، cover_url، type=reels، share_to_feed:true) — جرب فورًا (last post 13:37 UTC، cooldown 4h → 17:37) 3) تحديث topic_library.json في master (git pull --rebase) + git add/commit/push 4) إبلاغ المستخدم
- IG connector: manus-mcp-cli (أدوات create_instagram) — حساب @xdaw_nova
- مستودع: /home/ubuntu/daousha، فرع master، push origin master

## الخطة المتبقية
1. بناء المشهدين العموديين من clips (robots+hologram عموديان جاهزان 9:16، city/flying/neon أفقية → قص مركزي crop=ih:ih أو scale+crop)
2. تخطيط AR 51.5s: hook=city/neon (6s) → dome=city(5s) → flying(6s) → robots(6s) → hologram(6s) → ختام=neon(5s)... (أعد ترتيب)
3. غلافان: إعادة استخدام make_cover.py مع خلفية من city.mp4 إطار + نص «عالم 2099 / 3 حقائق صادمة»
4. wm.png موجود في episode28/ (تابع دوشة | Follow Dawsha) — انسخه
5. النشر IG (create_instagram media_url CDN + cover_url + share_to_feed)
6. IG cooldown: آخر منشور ep28 AR 13:37 UTC → النافذة 17:37 UTC — **لكن المستخدم طلب النشر فورًا، جرب الآن**
7. تحديث master في /home/ubuntu/daousha (فرع master يعمل فيه، main قديم) + finalize مثل finalize_ep28.py

## روابط IG ep28 المنشورة (لا تلغِ)
- AR v2: https://www.instagram.com/reel/DcQ4o6ACYRR/ (13:37:56 UTC)
- v1 old: https://www.instagram.com/reel/DcQvoEQjDiB/ (AR) و DcQv02xmhc5/ (EN)

## تحديث إعادة البناء (2026-08-20 مساءً)
- build29.py صُحح: seg0 = robots.mp4 (3,4) بدل scifi_city (أزرار بحث). البناء يعمل بالخلفية: nohup python3 v2/build29.py > v2/build.log 2>&1 &
- الغلافان cover-ar.png / cover-en.png أُعيد توليدهما بخلفية robots.mp4 (روبوت خيال علمي — ممتاز، نصوص عربية بيضاء/ذهبية 100/56px أعلى + إنجليزية 80/48px وسط)
- المتبقي: 1) انتظر البناء، 2) manus-analyze-video، 3) manus-upload-file للـ4 ملفات، 4) نشر ep28 EN v2 (VHNXKIHISWbQfgLc.mp4 + jcTPZqwzarpTzvaT.png) بعد 17:37 UTC، 5) ep29 AR ثم EN (cooldown 4h)، 6) git pull --rebase + تحديث topic_library.json (ep28→published-ig: AR v1=DcQvoEQjDiB، EN v1=DcQv02xmhc5، AR v2=DcQ4o6ACYRR + ep29) + push

## منشورات ep28 v1 القديمة (دورة سابقة)
- AR: DcQvoEQjDiB — EN: DcQv02xmhc5 (بدون كابتشنز/غلاف — لا تُلغى)
