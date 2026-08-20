# جرد أصول الحلقة 28 — تحديث 13:30 UTC (2026-08-20)

## تقدم v3 (الكابتشنز عبر صور PNG overlay)
- ass/libass لم ينجح في رسم النص — البديل: gen_caps.py يولّد صور PNG شفافة (v2/caps/capN.png) بكيسود خلفية داكنة، وcaps_manifest.json يحوي (path, start, end)
- wm.png ممتاز (تابع دوشة | Follow Dawsha، نصان بخطوين منفصلين)
- الغلافان جاهزان: cover-ar.png / cover-en.png (1080x1920)
- الخطوة التالية: سكربت overlays.py يطبق overlay لكل caption بنافذته الزمنية + wm.png ثم خلط الصوت
- drawtext العربي يعمل إذا كان ffmpeg مربوطًا بـ raqm (تم الاختبار: rc=0) لكن الصورة خرجت معكوسة قليلًا — PNG overlay أدق

## ما طلبه المستخدم (رسائله الأخيرة)
1. غلاف + نمط الفيديو مثل السابق (نمط ep26 + فيديو القطط المرجعي): غلاف يظهر خارجيًا + نصوص متزامنة + مشاهد فيديو متحركة عالية الجودة بدل الصور + مرفقات من عالم الخيال والروح
2. الفيديوهات المرجعية في /home/ubuntu/upload/ (Recording2026-08-20153632.mp4 قالبًا للغلاف+النمط، Recording2026-08-20154107.mp4 النمط الكامل 34.7s)
3. لقطة Grid الحساب: /home/ubuntu/upload/Screenshot2026-08-20030234.png (تُظهر شبكة المنشورات بنمط: صورة AI داكنة ذهبية + نص عربي أبيض عريض أعلى)

## إنجازات v2
- غلافان: cover-ar.png / cover-en.png (1080x1920، خلفية ذهب s7 + نص أبيض عريض، خط NotoNaskhArabic-Bold — مقبولان)
- فيديو AR: episode28-ar-v2.mp4 (52.67s, 63MB, 1080x1920, captions + ختم wm + موسيقى) ✓ مبني
- فيديو EN: episode28-en-v2.mp4 (47.16s, 60MB) ✓ مبني
- مقاطع: v2/ar_seg1..6.mp4 (s7_gold 8s, s6_crystal 12s, s5_diamond 4.67s, s8_gold2 9s, s1_space_energy 10s, s2_particles 9s)

## مشاكل متبقية للإصلاح
1. ختم wm.png: النص العربي يظهر لكن "Follow Dawsha" يظهر كمربعات (خط DejaVu بلا عربية؟ لا العكس - النص المختلط يخلط الخطوط). الإصلاح: بناء ختم بنصين منفصلين (عربي بخط عربي فقط + إنجليزي بخط DejaVu) في make_wm.py
2. موضع الكابتشن: في اللقطات يظهر النص صغيرًا أعلى يسار — مقبول لكن يفضل أكبر. (اختياري)

## سيناريو ep28 (نص التعليق AR الكامل)
ما رأيك بأغلى مادة في الكون كله... تكلف التريليونات؟! أنا واثق أنك لم تسمع بها من قبل، لكن اسمع هذه الحقائق الثلاث وستتغير نظرتك للعالم! الحقيقة الأولى: المادة المضادة أغلى مادة على الأرض، وغرامها الواحد يتجاوز 60 تريليون دولار! الحقيقة الثانية: لو جمعت كل المادة المضادة التي صنعتها البشرية، لما ملأت ملعقة شاي واحدة! الحقيقة الثالثة: إذا تلامسا ينفجران في ومضة طاقة خالصة! أنتم خير ونور من الله... أخبرني في التعليقات: هل تظن البشرية ستصل لاستخدام هذه الطاقة؟! المادة المضادة لغز لم يُحل بعد... تابع دوشة!

## كابتشن النشر IG
AR: «أغلى من الماس بمليون مرة... هذه المادة ستفجّر عقلك! مادة تكلف التريليونات: غرامها يتجاوز 60 تريليون دولار، وكل ما صنعته البشرية لا يملأ ملعقة شاي، ولو لامست المادة العادية تنفجران في ومضة طاقة خالصة! أنتم خير ونور من الله... هل ستستخدمها البشرية يومًا؟ تابع دوشة! #حقائق #علوم #المادة_المضادة #دوشة #XDAWNOVA»
EN: "A Million Times More Precious Than Diamond... A substance worth trillions: a gram costs over 60 trillion dollars, all of humanity's output wouldn't fill a teaspoon, and if it touches normal matter they annihilate in a flash of pure energy! You are goodness and light from God... will humanity ever harness it? Follow Dawsha! #facts #science #antimatter #Dawsha"

## حالة النشر
- IG cooldown نافذة: 14:42 UTC (4h بعد ep26 10:42 UTC)
- IG يعمل (86/100 حد النشر)، YT/FB/Telegram معطلة (secrets.txt غائب)
- النشر: manus-mcp-cli create_instagram type=reels share_to_feed:true، والغلاف post منفصل قبل reel

## سكربتات الحلقة 28
- build_ep28_v2.sh: قص المقاطع (1080x1920)
- assemble_v2.py: concat+captions+wm+music
- make_cover.py: بناء الغلافين
- make_wm.py: ختم watermark (يحتاج إصلاح النص الإنجليزي)
- episode28-script.md: السيناريو الكامل
- ملفات الصوت: narration28-ar.wav, narration28-en.wav
- المستودع: github.com/DawshaX/daousha — master محدث (d9b7dcf)، topic_library ep28=produced
