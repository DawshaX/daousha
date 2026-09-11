# دليل المفاتيح خطوة-بخطوة — فعّل النشر على كل منصة مجانًا

> كل المفاتيح **اختيارية** — النظام ينتج الحلقات ويخزنها بدونهما، ولحظة ما تضيف أي مفتاح يبدأ النشر عليه تلقائيًا (بما فيه استكمال الحلقات المنتجة سابقًا).
> المكان الموحّد للمفاتيح: **GitHub المستودع → Settings → Secrets and variables → Actions → New repository secret**

---

## 1) YouTube Shorts (الأهم — قناة xDaw_NoVa)

1. ادخل [console.cloud.google.com](https://console.cloud.google.com) بحساب `dawshaxlol@gmail.com`
2. أنشئ مشروعًا (مثلًا `xdaw-nova`) → من «APIs & Services → Library» فعّل **YouTube Data API v3**
3. «OAuth consent screen»: External → أضف بريدك كـ Test user (الوضع التجريبي يكفي، التوكن التجريبي يُجدَّد تلقائيًا بالـ refresh token)
4. «Credentials → Create Credentials → OAuth client ID» → نوع **Desktop app** → خذ `Client ID` و`Client Secret`
5. للحصول على `REFRESH_TOKEN` شغّل محليًا:
   ```bash
   pip install google-auth-oauthlib
   python - <<'EOF'
   from google_auth_oauthlib.flow import InstalledAppFlow
   flow = InstalledAppFlow.from_client_config({
     "installed": {"client_id": "ضع_CLIENT_ID", "client_secret": "ضع_CLIENT_SECRET",
                   "redirect_uris": ["http://localhost"], "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                   "token_uri": "https://oauth2.googleapis.com/token"}}, 
     scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"])
   creds = flow.run_local_server(port=0)
   print("REFRESH_TOKEN:", creds.refresh_token)
   EOF
   ```
6. أضف 3 أسرار: `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REFRESH_TOKEN`

> ملاحظة: حصة YouTube المجانية 100 رفع/يوم — أكثر من كفاية لأي سقف نشر في النظام.

## 2) Facebook Reels (صفحة XDAW NOVA)

1. [developers.facebook.com](https://developers.facebook.com) → أنشئ تطبيقًا نوع Business
2. من Graph API Explorer: اختر تطبيقك + صفحتك، وفعّل الصلاحيات: `pages_manage_posts`, `pages_read_engagement`, `publish_video`
3. «Generate Access Token» → ثم طوّله: `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={TOKEN}`
4. حوّله لتوكن صفحة: `GET /{PAGE_ID}?fields=access_token` (بالتوكن الطويل) — هذا لا ينتهي ما دام التطبيق في Live mode
5. أضف سرين: `FACEBOOK_PAGE_ID` (رقم الصفحة: 1265727539958933) و `FACEBOOK_PAGE_ACCESS_TOKEN`

## 3) Instagram Reels (@xdaw_nova)

**الشرط:** حساب IG Professional (Business/Creator) مرتبط بصفحة الفيسبوك فوق.

1. في نفس تطبيق Meta: أضف منتج **Instagram Graph API**
2. الصلاحيات: `instagram_content_publish`, `pages_show_list`
3. ولّد توكنًا طويل الأمد بنفس طريقة الفيسبوك
4. اعرف `INSTAGRAM_USER_ID`: `GET /{PAGE_ID}?fields=instagram_business_account`
5. أضف سرين: `INSTAGRAM_USER_ID` و `INSTAGRAM_ACCESS_TOKEN`

> Instagram يسحب الفيديو من رابط عام — النظام يرفعه تلقائيًا كـ GitHub Release (لذلك يجب أن يكون المستودع **عامًا**). بديل: اضبط Secret باسم `NOVA_PUBLIC_VIDEO_BASE` لأي استضافة ثابتة.

## 4) Telegram (بوت xDaw_NOVA للإشعارات)

1. كلّم [@BotFather](https://t.me/BotFather) → `/newbot` → خذ التوكن
2. أرسل رسالة لبوتك ثم افتح: `https://api.telegram.org/bot{TOKEN}/getUpdates` → خذ `chat.id`
3. أضف سرين: `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID` (المجرب سابقًا: 1890579200)

## 5) Pexels — مشاهد فيديو حقيقية بدل الرسومات (مجاني)

1. سجّل في [pexels.com/api](https://www.pexels.com/api) → مفتاح فوري مجاني (200 طلب/ساعة)
2. أضف سر: `PEXELS_API_KEY`
3. بدون المفتاح؟ النظام يستخدم مشاهد هوية العلامة المولّدة برمجيًا (يعمل دائمًا)

## 6) (اختياري متقدم) سيناريوهات أذكى بلا نهاية عبر Groq

1. سجّل مجانًا في [console.groq.com](https://console.groq.com) → API Keys
2. أضف 3 أسرار: `LLM_API_BASE=https://api.groq.com/openai/v1` + `LLM_API_KEY` + `LLM_MODEL=llama-3.3-70b-versatile`
3. النظام سيكتب مواضيع وسيناريوهات جديدة غير محدودة بدل الاعتماد على بنك الحقائق الداخلي

## 7) TikTok (بعد قبول التطبيق فقط)

التطبيق القديم (7673768835363145748) **مرفوض**. عند إعادة التقديم وقبوله:
1. أضف سر `TIKTOK_ACCESS_TOKEN` (من OAuth flow بالتطبيق المقبول)
2. أضف سر `NOVA_TIKTOK_ENABLED=1`
3. النشر يبدأ تلقائيًا عبر Content Posting API

---

## التحقق من أن كل شيء يعمل
بعد إضافة المفاتيح: تبويب **Actions → NOVA → Run workflow** → شغّل يدويًا وراقب:
- رسالة تلجرام بالروابط ✅
- لوحة المتابعة `dashboard/status.html` (فعّل GitHub Pages من Settings → Pages → branch main / folder docs)


---

## 🔁 الاستمرارية — عشان الشغل ميفصلش أبدًا

### YouTube — أهم نقطة توكن
- وضع OAuth «Testing» **يقتل التوكن كل 7 أيام**.
- **الحل الدائم (مرة واحدة):** Google Cloud → OAuth consent screen → **PUBLISH APP** (وضع Production). صلاحية youtube.upload غير حساسة فيُنشر بدون مراجعة ويصبح التوكن دائمًا.
- نظام الفحص يجدد الوصول كل ساعة ويرسللك تحذيرًا فوريًا لو حصل أي رفض.

### Facebook + Instagram — توكن الصفحة دائم
- توكن الصفحة الطويل **لا ينتهي** ما دام التطبيق في Live mode.
- **بونص:** لو ضفت `META_APP_ID` + `META_APP_SECRET` + `FACEBOOK_LONG_LIVED_TOKEN` (توكن مستخدم 60 يوم):
  النظام **يجدد تلقائيًا** قبل الانتهاء، يستخرج توكن صفحة دائم جديد، ويبلغك تليجرام «تم التجديد تلقائيًا ✓».
- **مجّانًا كمان:** لو حطيت توكن الصفحة بس، النظام **يكتشف معرف إنستجرام تلقائيًا** من ربط الصفحة (@xdaw_nova) — مش محتاج INSTAGRAM_USER_ID أصلًا.

### الدورة الوقائية كل ساعة (مفعلة تلقائيًا)
```
فحص صحة التوكنات → تجديد إن لزم → إنتاج الحلقة → نشر → تقرير تليجرام
```
أي توكن هيموت — هتعرف قبل موته بأيام، وأي توكن قابل للتجديد هيتجدد لوحده.
