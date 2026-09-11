#!/usr/bin/env python3
"""الترحيل الشامل من النظام القديم → content/topics.json

- يقرأ حالة كل الحلقات من repo القديم (topic_library.json) — لا يعيد نشر منشور أبدًا
- يمتص السيناريوهات العربية من docs/episode*/episode*-script.md
- يضيف سيناريوهات ثنائية اللغة كتبها فريق التطوير للحلقات غير المكتملة + دفعة جديدة ep30–ep40
الاستخدام: python3 scripts/import_legacy.py [مسار-الrepo-القديم]
"""
import json
import re
import sys
from pathlib import Path

FINAL = Path(__file__).resolve().parent.parent
OLD = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/user/repo")

# ------------------------------------------------------------------
# محتوى مُعِدّ ثنائي اللغة: حلقات بلا سيناريو في النظام القديم + دفعة جديدة
# seg: hook | fact1..3 | outro
# ------------------------------------------------------------------
SEED = {
    # ===== الحلقات القديمة المنتجة بلا سيناريو محفوظ =====
    "ep12": {
        "title_ar": "الوقت لا يتقدم بالتساوي! 3 مفارقات غريبة", "title_en": "Time doesn't flow equally! 3 strange paradoxes",
        "hook_ar": "توقف عن الاعتقاد أن الساعة تقول الحقيقة!", "hook_en": "Stop believing your clock tells the truth!",
        "facts_ar": ["الزمن يمشي أسرع فوق جبال الهيمالايا منه عند سطح البحر — الجاذبية تبطئ الوقت فعليًا!",
                     "داخل أسرع مرصد لاسيرن، الفوتونات تعبر مسافة 30 كم في 1000 من الثانية — أنت الآن ترى الماضي دائمًا!",
                     "لو سافرت سفينتك بسرعة قريبة من الضوء عشر سنوات، قد تعود لتجد الأرض قد مضى عليها قرن كامل!"],
        "facts_en": ["Time runs faster on top of the Himalayas than at sea level — gravity literally slows time!",
                     "Inside the fastest laser observatory, photons cross 30 km in a thousandth of a second — you always see the past!",
                     "If your ship traveled near light speed for 10 years, you could return to an Earth that aged a century!"],
        "scene_queries": ["clock time abstract", "mountain summit clouds", "laser light tunnel", "spaceship warp speed"],
        "tags": "الوقت, الزمن, النسبية, علوم, داوسها"},
    "ep13": {
        "title_ar": "اللغة العربية! 3 حقائق عن أقوى لغة في التاريخ", "title_en": "The Arabic language! 3 facts about history's most powerful tongue",
        "hook_ar": "لغتك الأم أغنى مما تتخيل — الص笛 sedد أنك لا تعرف!", "hook_en": "Your mother tongue is richer than you imagine!",
        "facts_ar": ["جذر ع-ل-م واحد يفرّع أكثر من 300 كلمة: علم، عالم، علامة، معلومة، تعليم، أعلم، عالة!",
                     "الشعر الجاهلي محفوظ في الذاكرة الشفوية قرونًا قبل التدوين — ولم تتغير حروفه حتى اليوم!",
                     "علم النحو وُضع لحفظ الفصحى من اللحن عندما اختلطت الأمم بعد الفتوح — بدافع حماية فهم القرآن!"],
        "facts_en": ["One Arabic root AIN-LAM-MAM branches into 300+ words: knowledge, scientist, sign, information, teaching!",
                     "Pre-Islamic poetry was preserved orally for centuries — its letters unchanged until today!",
                     "Arabic grammar was invented to protect classical pronunciation when nations mixed after the conquests!"],
        "scene_queries": ["arabic calligraphy", "ancient manuscript book", "desert caravan stars", "library old books"],
        "tags": "اللغة العربية, نحو, تاريخ, داوسها"},
    "ep17": {
        "title_ar": "نحل العسل! 3 أسرار ستدهشك", "title_en": "Honeybees! 3 secrets that will amaze you",
        "hook_ar": "ملعقة العسل اللي في بيتك وراها معجزة!", "hook_en": "The spoon of honey in your kitchen hides a miracle!",
        "facts_ar": ["النحلة تعمل طول عمرها لتحصل على ملعقة عسل واحدة للخلية — تعب في صمت يحلا لك!",
                     "النحل يرقص على القرص الشمعي بلغة حقيقية تخبر رفيقه اتجاه الغذاء والمسافة بالضبط!",
                     "لو اختفى النحل، تخسر البشرية ثلث غذائها — معظم الفواكه والخضار تحتاج التلقيح!"],
        "facts_en": ["A worker bee spends its whole life to make one spoonful of honey for the hive!",
                     "Bees dance on the honeycomb in a real language: direction and distance of food, exactly!",
                     "If bees vanished, humanity loses a third of its food — most fruits and vegetables need pollination!"],
        "scene_queries": ["honeybee macro flower", "beehive honeycomb", "bee dance swarm", "honey jar golden"],
        "tags": "النحل, عسل, طبيعة, داوسها"},
    "ep18": {
        "title_ar": "الحديد في جسمك! 3 حقائق صادمة", "title_en": "The iron in your body! 3 shocking facts",
        "hook_ar": "في جسمك معدن يصنع منه السيوف — جاد!", "hook_en": "Your body contains the metal that swords are made of!",
        "facts_ar": ["في دمك نحو 4 جرامات حديد — تكفي لصنع مسمار صغير، وبدونه تختنق خلاياك!",
                     "الحديد في دمك جاء من انفجار نجوم قديمة قبل مليارات السنين — أنت من غبار النجوم حرفيًا!",
                     "جسمك يفقد حديدًا يوميًا ولا يملك مخرجًا له — لذلك الغذاء المتوازن ليس رفاهية!"],
        "facts_en": ["Your blood holds about 4 grams of iron — enough for a tiny nail; without it your cells suffocate!",
                     "The iron in your blood was forged in ancient exploding stars — you are literally stardust!",
                     "You lose iron daily and cannot excrete the excess — balanced food is not a luxury!"],
        "scene_queries": ["red blood cells macro", "forging iron sparks", "supernova star explosion", "healthy food vegetables"],
        "tags": "جسم الإنسان, حديد, صحة, داوسها"},
    "ep19": {
        "title_ar": "القمر! 3 أسرار لم تسمعها", "title_en": "The Moon! 3 secrets you never heard",
        "hook_ar": "تراه كل ليلة و لا تعرف عنه نصف الحقيقة!", "hook_en": "You see it every night and know half the truth!",
        "facts_ar": ["القمر يبتعد عن الأرض 3.8 سم كل سنة — بعد ملايين السنين سيصبح الكسوف مستحيلًا!",
                     "بصمة قدمك على القمر ستبقى ملايين السنين — لا رياح ولا مطر يمحوها!",
                     "بدون القمر لاختل محور الأرض فقفزت الفصول فوضى، ولم يظهر الحياة المعقدة كما نعرفها!"],
        "facts_en": ["The Moon drifts 3.8 cm away from Earth every year — eclipses will one day be impossible!",
                     "Your footprint on the Moon lasts millions of years — no wind or rain to erase it!",
                     "Without the Moon, Earth's axis would wobble chaotically and complex life might never exist!"],
        "scene_queries": ["full moon night sky", "astronaut moon footprints", "earth from moon", "lunar craters"],
        "tags": "القمر, فضاء, علوم, داوسها"},
    "ep20": {
        "title_ar": "الصوت! 3 حقائق ستندهش لها", "title_en": "Sound! 3 mind-blowing facts",
        "hook_ar": "في الفضاء يوجد صوت — لكن أذنك لا تسمعه!", "hook_en": "Space has sound — your ears just can't hear it!",
        "facts_ar": ["في الفضاء يوجد صوت فعليًا — موجات ضغط هائلة في عناقيد المجرات لكن ترددها أخفض من سماع الإنسان بملايين المرات!",
                     "صوت مدفع أطلق عام 1746 سُمع على بعد 200 كم وصولًا — الهواء يحمل الأسرار بعيدًا!",
                     "أذنك لا تتوقف أبدًا حتى في نومك — دماغك فقط يخفض الصوت حتى لا تستيقظ!"],
        "facts_en": ["Space actually has sound — massive pressure waves in galaxy clusters, millions of octaves too low to hear!",
                     "A cannon fired in 1746 was heard 200 km away — air carries secrets far!",
                     "Your ears never switch off, even in sleep — your brain just turns the volume down!"],
        "scene_queries": ["sound wave visualization", "speaker vibration macro", "starry galaxy cluster", "person sleeping quiet"],
        "tags": "الصوت, فيزياء, علوم, داوسها"},
    "ep21": {
        "title_ar": "البرق! 3 حقائق صادمة", "title_en": "Lightning! 3 shocking facts",
        "hook_ar": "سماء فوقك تخبئ أسلحة أحر من الشمس!", "hook_en": "The sky above you hides weapons hotter than the sun!",
        "facts_ar": ["حرارة البرق تصل 30 ألف درجة — أحر من سطح الشمس خمس مرات!",
                     "البرق يضرب الأرض نحو 100 مرة كل ثانية — وأنت بين الضربات الآن!",
                     "الرعد يسبقه ضوء البرق لا لأن الصوت جاء بعده، بل لأن الضوء أسرع منه 880 ألف مرة!"],
        "facts_en": ["Lightning reaches 30,000°C — five times hotter than the sun's surface!",
                     "Lightning strikes Earth about 100 times every second — you are between strikes right now!",
                     "Thunder lags the flash not because sound came later, but light is 880,000 times faster!"],
        "scene_queries": ["lightning storm night", "thundercloud timelapse", "city storm dramatic sky", "electric spark dark"],
        "tags": "البرق, طبيعة, علوم, داوسها"},
    # ===== الدفعة الجديدة (ep30–ep40) =====
    "ep30": {
        "title_ar": "الثقوب السوداء! 3 حقائق صادمة", "title_en": "Black holes! 3 shocking facts",
        "hook_ar": "توجد وحوش كونية تلتهم النجوم بل وأشعتها!", "hook_en": "Cosmic monsters devour stars — even their light!",
        "facts_ar": ["الثقب الأسود يبتلع كل شيء حتى الضوء — سرعته للإفلات أعلى من سرعة الضوء نفسها!",
                     "في مركز مجرتنا ثقب أسود كتلته 4 ملايين شمس — ونحن نلف حوله في رحلة دائمة!",
                     "عند حافة الثقب الأسود يتوقف الزمن — ساعة تقترب منه تبطئ حتى تكاد تقف!"],
        "facts_en": ["A black hole swallows everything — even light, because escape speed beats light speed itself!",
                     "At our galaxy's center sits a black hole weighing 4 million suns — we orbit it forever!",
                     "Time nearly stops at a black hole's edge — a clock approaching it slows to a crawl!"],
        "scene_queries": ["black hole space animation", "galaxy spiral stars", "spacetime warp abstract", "cosmic nebula dark"],
        "tags": "الثقوب السوداء, فضاء, كون, داوسها"},
    "ep31": {
        "title_ar": "أهرامات الجيزة! 3 حقائق تدهشك", "title_en": "The pyramids of Giza! 3 astonishing facts",
        "hook_ar": "آخر عجائب الدنيا السبع الساعية لسر جديد!", "hook_en": "The last standing wonder of the ancient world!",
        "facts_ar": ["الهرم الأكبر بُني من نحو 2.3 مليون حجر، بعضها يزن 80 طنًا — بلا رافعات ولا آلات!",
                     "ظل الهرم الأكبر ظل أطول بناء على وجه الأرض 3800 سنة كاملة!",
                     "أوجه الهرم تستهدف الجهات الأصلية بدقة تفوق مبنى حديث — بدون بوصلة ولا GPS!"],
        "facts_en": ["The Great Pyramid holds 2.3 million stones, some weighing 80 tons — no cranes, no machines!",
                     "It remained the tallest structure on Earth for 3,800 straight years!",
                     "Its sides face true north with precision beyond modern buildings — no compass, no GPS!"],
        "scene_queries": ["great pyramid giza", "egypt desert pyramids aerial", "ancient egypt pharaoh", "pyramids sunset"],
        "tags": "أهرامات, مصر, تاريخ, داوسها"},
    "ep32": {
        "title_ar": "خندق ماريانا! 3 أسرار في أعمق نقطة على الأرض", "title_en": "The Mariana Trench! 3 secrets of Earth's deepest point",
        "hook_ar": "تحت أمواج المحيط هاوية تبتلع أعلى جبل في العالم!", "hook_en": "Beneath the waves hides a canyon that swallows Everest!",
        "facts_ar": ["لو أسقطت جبل إيفرست في خندق ماريانا، لاختفى تمامًا وتبقى فوقه ماء بعمق كيلومترين!",
                     "الضغط في قاعه يعادل 1000 كيلوجرام فوق كل سنتيمتر من جسمك — مع ذلك توجد حياة تزدهر!",
                     "أعماقه مظلمة تمامًا ومع ذلك تسبح فيه أسماك تتوهج وتحول الظلام إلى لوحة فنية!"],
        "facts_en": ["Drop Everest into the Mariana Trench and it vanishes — with 2 km of water still above it!",
                     "Pressure at its floor equals 1000 kg on every square centimeter of your body — yet life thrives!",
                     "It's pitch black down there, yet glowing fish turn the darkness into living art!"],
        "scene_queries": ["deep ocean underwater", "bioluminescent sea creatures", "ocean abyss dark blue", "submarine deep dive"],
        "tags": "ماريانا, محيطات, أعماق, داوسها"},
    "ep33": {
        "title_ar": "عجائب الأشجار! 3 أسرار تحت أقدامك", "title_en": "Amazing trees! 3 secrets under your feet",
        "hook_ar": "الغابة تحدث نفسها خلف ظهرك بالسر!", "hook_en": "The forest talks behind your back — secretly!",
        "facts_ar": ["الأشجار تتواصل تحت الأرض عبر شبكة فطرية هائلة — تتبادل الغذاء وتحذر بعضها من الأمراض!",
                     "أقدم شجرة على كوكب الأرض عمرها يقارب 5000 سنة — وُلدت قبل بناء الأهرامات!",
                     "ظل شجرة واحدة يخفض حرارة الأسفلت نحو 10 درجات — المدينة بلا أشجار فرن يفتح!"],
        "facts_en": ["Trees talk underground through a huge fungal network — sharing food and disease warnings!",
                     "The oldest living tree is nearly 5,000 years old — older than the pyramids!",
                     "One tree's shade cools asphalt by about 10°C — a city without trees is an open oven!"],
        "scene_queries": ["forest canopy sunlight", "tree roots forest floor", "ancient old tree", "green leaves macro"],
        "tags": "أشجار, غابات, طبيعة, داوسها"},
    "ep34": {
        "title_ar": "المريخ! 3 حقائق عن الكوكب الأحمر", "title_en": "Mars! 3 facts about the red planet",
        "hook_ar": "جارك الأحمر يخبئ مفاجآت تفتح النفس!", "hook_en": "Your red neighbor hides breathtaking surprises!",
        "facts_ar": ["جبل أوليمبوس على المريخ أعلى بركان في النظام الشمسي — ثلاثة أضعاف إيفرست!",
                     "يوم المريخ 24 ساعة و37 دقيقة تقريبًا — الأقرب ليوم الأرض بين كل الكواكب!",
                     "قبعات الغبار الأحمر تغطي المريخ بسبب صدأ الحديد — كوكب كامل يصدأ ببطء!"],
        "facts_en": ["Olympus Mons on Mars is the tallest volcano in the solar system — three times Everest!",
                     "A Martian day lasts 24h 37m — the closest to Earth's day of all planets!",
                     "Its red dust is rusted iron — an entire planet slowly rusting!"],
        "scene_queries": ["mars planet surface", "mars rover red desert", "volcano olympus mons", "space planets"],
        "tags": "المريخ, فضاء, كواكب, داوسها"},
    "ep35": {
        "title_ar": "زحل! 3 حقائق تصدمك عن جوهرة الكون", "title_en": "Saturn! 3 stunning facts about the jewel of space",
        "hook_ar": "الكوكب اللي يلبس خاتم من جليد و صخور!", "hook_en": "The planet wearing a ring of ice and rock!",
        "facts_ar": ["كوكب زحل أخف من الماء — لو وجد محيط عملاق لطفا فوقه مثل الفلين!",
                     "حلقات زحل بعرض 280 ألف كيلومتر بينما سماكتها في مواضع 10 أمتار فقط!",
                     "يُعتقد أن داخل زحل تمطر الماس — ضغط هائل يضغط الكربون إلى جواهر!"],
        "facts_en": ["Saturn is lighter than water — in a giant ocean it would float like cork!",
                     "Saturn's rings span 280,000 km yet are in places just 10 meters thick!",
                     "Scientists believe it rains diamonds inside Saturn — crushing pressure turns carbon into gems!"],
        "scene_queries": ["saturn rings planet", "solar system planets", "ice crystals abstract", "deep space stars"],
        "tags": "زحل, كواكب, فضاء, داوسها"},
    "ep36": {
        "title_ar": "الأسد ملك السافانا! 3 أسرار صادمة", "title_en": "The lion king of the savanna! 3 shocking secrets",
        "hook_ar": "ملك الغابة ينام 20 ساعة في اليوم — جاد!", "hook_en": "The king sleeps 20 hours a day — seriously!",
        "facts_ar": ["الأسد ينام حتى 20 ساعة يوميًا — الملك يوفر طاقته للصيد الكبير فقط!",
                     "زئير الأسد يُسمع من مسافة 8 كيلومترات — إعلان ملكية بلا لافتات!",
                     "ال lionesses تفترس معظم الصيد بينما الحراسة على الأسد — تقسيم عمل مضحك وخطير!"],
        "facts_en": ["Lions sleep up to 20 hours a day — the king saves energy for the big hunt!",
                     "A lion's roar carries 8 kilometers — declaring ownership without billboards!",
                     "Lionesses do most of the hunting while males guard — a funny and fierce division of labor!"],
        "scene_queries": ["lion portrait savanna", "lion pride resting", "africa wildlife sunset", "lion roar closeup"],
        "tags": "الأسد, حيوانات, طبيعة, داوسها"},
    "ep37": {
        "title_ar": "الصحراء! 3 أسرار عن عالم من الرمال", "title_en": "The desert! 3 secrets of a world of sand",
        "hook_ar": "أكبر صحراء حارة على الأرض تستطيع أن تبتلع أمريكا كلها!", "hook_en": "The largest hot desert could swallow the USA whole!",
        "facts_ar": ["الصحراء الكبرى بحجم الولايات المتحدة تقريبًا — ولم يكن فيها مطر لعقود في مواضع!",
                     "حرارة الرمل نهارًا قد تصل 80 درجة — تكفي لبيض البيض دون نار!",
                     "تحت رمال الصحراء ينقب الكنوز: بقايا بحيرات ومدن قديمة ومغارات صخرية مدهشة!"],
        "facts_en": ["The Sahara is nearly the size of the USA — some spots go decades without rain!",
                     "Sand surface can hit 80°C — hot enough to fry an egg without a stove!",
                     "Beneath the sands lie treasures: ancient lakebeds, lost cities, and stunning caves!"],
        "scene_queries": ["sahara desert dunes", "camel caravan desert", "desert oasis", "sand dunes aerial"],
        "tags": "الصحراء, طبيعة, جغرافيا, داوسها"},
    "ep38": {
        "title_ar": "الفراشات! 3 حقائق ساحرة", "title_en": "Butterflies! 3 enchanting facts",
        "hook_ar": "المخلوق اللي كان دودة و صار يحلق!", "hook_en": "A creature that was a worm — and now it flies!",
        "facts_ar": ["الفراشة تتذوق بأقدامها — كل خطوة عليها وجبة غذاء!",
                     "فراشة الملك تطير 4000 كيلومتر في هجرة تتطلب أجيالًا متتالية لإكمالها!",
                     "أجنحتها شفافة! الألوان التي تراها انعكاس ضوء على قشور مجهرية — لوحة بصرية هندسية!"],
        "facts_en": ["Butterflies taste with their feet — every step is a meal!",
                     "Monarch butterflies fly 4,000 km in a migration that takes generations to complete!",
                     "Their wings are transparent — the colors you see are light bouncing off microscopic scales!"],
        "scene_queries": ["butterfly macro colorful", "monarch butterfly flight", "flowers butterfly garden", "butterfly wings closeup"],
        "tags": "فراشات, حشرات, طبيعة, داوسها"},
    "ep39": {
        "title_ar": "البراكين! 3 حقائق صادمة", "title_en": "Volcanoes! 3 shocking facts",
        "hook_ar": "جبال تنزف نارًا و تصنع قارات!", "hook_en": "Mountains that bleed fire and build continents!",
        "facts_ar": ["ماغما البراكين تصل 1200 درجة — تذيب الصخر كما يذوب السكر في الماء!",
                     "انفجار تامبورا عام 1815 برّد الأرض كلها — صيف السنة التالية ضاع وثلوج تساقط في يوليو!",
                     "أكثر من 80% من محيط الأرض ما زال غير مستكشف، وبراكين تحت الماء تثور فيه كل يوم!"],
        "facts_en": ["Volcanic magma reaches 1,200°C — it melts rock like sugar in water!",
                     "The 1815 Tambora eruption cooled the whole planet — the next year had no summer, snow in July!",
                     "Underwater volcanoes erupt in the ocean every single day — most never seen!"],
        "scene_queries": ["volcano eruption lava", "lava flow night glow", "volcanic ash cloud", "island volcano aerial"],
        "tags": "براكين, طبيعة, علوم, داوسها"},
    "ep40": {
        "title_ar": "الزلازل! 3 حقائق تهزك", "title_en": "Earthquakes! 3 earth-shaking facts",
        "hook_ar": "الأرض اللي تحتك تتحرك الآن — دون أن تشعر!", "hook_en": "The ground beneath you is moving right now!",
        "facts_ar": ["الأرض تشهد أكثر من 500 ألف زلزال سنويًا — معظمها لا تشعر به أبدًا!",
                     "زلزال تشيلي 1960 كان الأقوى المسجل: 9.5 درجة — هز الأرض لأيام وحرّك مدنًا كاملة!",
                     "موجات الزلازل تخترق الكوكب وتعود — هي أشعة إكس تُظهر لنا ما بداخل الأرض!"],
        "facts_en": ["Earth hosts 500,000+ quakes a year — most you never feel!",
                     "Chile 1960 was the strongest recorded: magnitude 9.5 — it rang Earth like a bell for days!",
                     "Seismic waves X-ray the planet — they reveal what hides deep inside Earth!"],
        "scene_queries": ["earthquake cracked ground", "seismograph machine", "earth core cutaway", "city damage street"],
        "tags": "زلازل, أرض, علوم, داوسها"},
}


# ---------------- امتصاص السيناريوهات من الrepo القديم ----------------
def parse_legacy_script(md_path: Path) -> dict | None:
    """يستخرج (العنوان، أسطر عربية بأقسامها) من ملف سكربت قديم."""
    try:
        txt = md_path.read_text(encoding="utf-8")
    except Exception:
        return None
    m_title = re.search(r"\*\*العنوان للنشر:\*\*\s*(.+)", txt)
    title = m_title.group(1).strip() if m_title else None
    # القسم العربي: بين "## السيناريو" و"##" التالي (أو "## النسخة الإنجليزية")
    m = re.search(r"## السيناريو[^\n]*\n(.*?)(?=\n## )", txt, re.S)
    ar_lines = []
    if m:
        for ln in m.group(1).strip().splitlines():
            ln = ln.strip()
            if ln and not ln.startswith(("#", "*")):
                ar_lines.append(ln)
    # قسم إنجليزي إن وجد
    en_lines = []
    m2 = re.search(r"## النسخة الإنجليزية\s*\n(.*?)(?=\n## )", txt, re.S)
    if m2:
        for ln in m2.group(1).strip().splitlines():
            ln = ln.strip()
            if ln and not ln.startswith(("#", "*")):
                en_lines.append(ln)
    if not ar_lines:
        return None
    return {"title": title, "ar": ar_lines, "en": en_lines}


FACT_RE = re.compile(r"(الحقيقة|السر|الاختراع|الفكرة|الاكتشاف)\s*(الأولى|الأول|الثانية|الثاني|الثالثة|الثالث)")


def lines_to_segs(lines: list[str]) -> list[dict]:
    """يصنف كل سطر إلى hook/fact1..3/outro حسب محتواه."""
    segs, fcount, seen_third = [], 0, False
    for i, ln in enumerate(lines):
        m = FACT_RE.search(ln)
        if m:
            word = m.group(2)
            if word in ("الأولى", "الأول"):
                fcount = 1
            elif word in ("الثانية", "الثاني"):
                fcount = 2
            else:
                fcount = 3
                seen_third = True
            segs.append({"seg": f"fact{fcount}", "text": ln})
        elif seen_third or re.search(r"تابع\s*(داوسها|دوشة)|أنت خير|الباب مفتوح", ln):
            segs.append({"seg": "outro", "text": ln})
        else:
            segs.append({"seg": "hook", "text": ln})
    return segs


def main():
    topics = []
    old_lib = []
    old_path = OLD / "scripts" / "topic_library.json"
    if old_path.exists():
        old_lib = json.loads(old_path.read_text(encoding="utf-8"))
    old_by_id = {t["id"]: t for t in old_lib}

    # 1) حلقات النظام القديم
    for t in old_lib:
        tid = t["id"]
        st = t.get("status", "queued")
        entry = {
            "id": tid, "topic": t.get("topic", ""), "angle": t.get("angle", ""),
            "origin": "legacy",
        }
        # حالة الحلقة
        if st == "published":
            entry["status"] = "published"
            entry["published"] = {p: "(منشور سابقًا في النظام القديم)" for p in ("youtube", "instagram", "facebook")}
        elif st == "published-ig":
            entry["status"] = "partial"
            ig_link = ""
            note = t.get("note", "")
            m = re.search(r"instagram\.com/reel/([\w-]+)", note)
            if m:
                ig_link = f"https://www.instagram.com/reel/{m.group(1)}/"
            entry["published"] = {"instagram": ig_link or "(منشور على IG — النظام القديم)"}
        elif st == "produced":
            entry["status"] = "scripted"  # سيعاد إنتاجها بمحرك جديد أفضل جودة
        else:
            entry["status"] = "queued"
        # السيناريو من ملفات القديم
        n = re.sub(r"\D", "", tid)
        md = OLD / "docs" / f"episode{n}" / f"episode{n}-script.md"
        if not md.exists():
            md = OLD / "docs" / f"episode{n}-script.md"
        parsed = parse_legacy_script(md) if md.exists() else None
        if parsed:
            entry["title_ar"] = parsed["title"] or entry["angle"]
            entry["script"] = {"lines_ar": lines_to_segs(parsed["ar"])}
            if parsed["en"]:
                entry["script"]["lines_en"] = lines_to_segs(parsed["en"])
        entry.update({k: v for k, v in old_by_id.get(tid, {}).items()
                      if k in ("tags",) })
        topics.append(entry)

    # 2) بذر المحتوى المُعِد (ينسخ فوق الموجود ويضيف الجديد)
    for tid, s in SEED.items():
        existing = next((t for t in topics if t["id"] == tid), None)
        seed_entry = {
            "id": tid, "topic": s["title_ar"].split("!")[0], "angle": s["title_ar"],
            "title_ar": s["title_ar"], "title_en": s["title_en"],
            "hook_ar": s["hook_ar"], "hook_en": s["hook_en"],
            "facts_ar": s["facts_ar"], "facts_en": s["facts_en"],
            "outro_ar": "أنت خير ونور! تابع داوسها وسنلتقي في الحلقة القادمة!",
            "outro_en": "You are amazing! Follow Dawsha and see you next episode!",
            "scene_queries": s["scene_queries"], "tags": s["tags"],
        }
        if existing:
            # لا نمس حالة النشر أو السيناريو المستوعب من القديم
            for k, v in seed_entry.items():
                if k not in ("id",) and not existing.get(k):
                    existing[k] = v
            # أضف سيناريو مركبًا إن لم يوجد سيناريو مكتمل
            if "script" not in existing:
                existing["script"] = _compose_lines(seed_entry)
        else:
            seed_entry["status"] = "queued"
            seed_entry["origin"] = "new"
            seed_entry["script"] = _compose_lines(seed_entry)
            topics.append(seed_entry)

    out = FINAL / "content" / "topics.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    json.dump(topics, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"✅ topics.json: {len(topics)} حلقة → {out}")
    st_count = {}
    for t in topics:
        st_count[t["status"]] = st_count.get(t["status"], 0) + 1
    print("   الحالات:", st_count)


def _compose_lines(s: dict) -> dict:
    labels_ar = ["الحقيقة الأولى:", "الحقيقة الثانية:", "والحقيقة الثالثة:"]
    labels_en = ["Fact one:", "Fact two:", "And fact three:"]
    ar = [{"seg": "hook", "text": s["hook_ar"]}]
    en = [{"seg": "hook", "text": s["hook_en"]}]
    for i in range(3):
        ar.append({"seg": f"fact{i+1}", "text": f"{labels_ar[i]} {s['facts_ar'][i]}"})
        en.append({"seg": f"fact{i+1}", "text": f"{labels_en[i]} {s['facts_en'][i]}"})
    ar.append({"seg": "outro", "text": s["outro_ar"]})
    en.append({"seg": "outro", "text": s["outro_en"]})
    return {"lines_ar": ar, "lines_en": en}


if __name__ == "__main__":
    main()
