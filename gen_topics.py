import json
import random

categories = {
    "علوم": [
        "اكتشاف الجسيم هيغز يكتمل معايير نموذج القياسية",
        "النجم النابض يرسل إشارة كل 1.337 ثانية",
        "ثقب أسود supermassive فيentrum المجرة",
        "انفجار supernova يولد عناصر ثقيلة",
        "مادة matterantine توجد في المختبرات",
        "إشعاع الخلفية宇宙ية له درجة حرارة 2.7K",
        "غازات interstellar تتكون من الهيدروجين والهليوم",
        "نبض pulsars تستخدم كساعات كونية",
        "توهج gamma bursts تصل طاقة لشمس كامل",
        "هجرة النجوم في مجرة درب التبانة",
    ],
    "تكنولوجيا": [
        "الحوسبة الكمية تكسر التشفير الراهن",
        "شبكة إنترنت الكم تمتد لـ 2000 كم",
        "ذكاء اصطناعي يعالج الصور الطبية بدقة 99%",
        "تقنية blockchain للملكية الفكرية",
        "واقع معزز في التعليم الطبي",
        "أجهزة الاستشعار النانوية للكشف عن المرض",
        "الحوسبة الحافة تقلل latency لنصف ثانية",
        "تقنية 6G بمتوسط سرعة 1 Tbps",
        "الروبوتات البشرية تؤدي الجراحة",
        "تقنيات الحفظ الرقمي 100 عام"],
    "طبيعة": [
        "غابة الأمازون تفقد 1000 هكتار يومياً",
        "ثقب الجليد Antarctica يتقلص 13%decade",
        "مملكة البحر تشكل 70% من الأكسجين",
        "أنواع الانقراض تزداد بـ 1000 مرة",
        "درجات الحرارة العالمية تسجل مستويات قياسية",
        "الشعاب المرجانية تختفي بمعدل مقلق",
        "ذوبان التندرا الكريمية يطلق ميتان",
        "موجات chaleur تصبح أكثر تكراراً",
        "فيضانات تتسبب بتغيير الخرائط",
        "حرائق الغاباتsaison deviennent plus sévères"],
    "جسد إنساني": [
        "الجينات تشكل 80% من طول القامة",
        "البصمة الإصبع لا تتشابه لأحد",
        "البكتيريا في الجسم تفوق الخلايا 10:1",
        "القلب يضخ كمية blood تعادل برج Eiffel",
        "العظام أقوى من الفولاذ من حيث الحجم",
        "الدماغ يستهلك 20% طاقة الجسم",
        "النوم 7 ساعات ضروري للوظائف الإدراكية",
        "الجفاف 1% يؤثر على الأداء",
        "التوتر يؤثر على طول العمر",
        "التمارين الرياضية تحسين الذاكرة",
    ],
    "تاريخ": [
        "الحضارة الفرعونية استمرت 3000 سنة",
        "السور العظيم الصيني مرئي من الفضاء",
        "انهيار الإمبراطورية romanaكان تدريجياً",
        "اكتشاف America لم يكن قصدية",
        "الثورة الصناعية بدأت في بريطانيا",
        "الحروب العالميتان تغيرت الحدود",
        "الثورة الرقمية begann بالحواسيب",
        "الحركات الاجتماعية تنتشر بسرعة",
        "الاكتشافات الأثرية تعيد كتابة التاريخ",
        "الثقافات الأصلية تختفي بسرعة"],
    "استكشاف فضائي": [
        "بعثة mars sample return قيد التنفيذ",
        "مستوطنات المريخ التخطيطية لعام 2050",
        "望遠望遠鏡James Webb رؤى جديدة",
        "بعثات لاستكشاف الأقمار الجليدية",
        "تعدين الكويكبات becomes feasible",
        "عمرات على القمر International Lunar Gateway",
        "بحث عن vida في europa جليد كوكب المشترى",
        "بعثات الطروjan asteroids",
        "خريطة ثلاثية الأبعاد للمجرة",
        "بعثات regreso al Luna متزايدة"],
    "رياضيات": [
        "عدد primo nonsegue un patterned deterministic",
        "فرضية رiemann Millennium Problem",
        "رموز纠错 تصحيح الأخطاء",
        "خوارزمية sorting complexity O(n log n)",
        "نظرية الأعداد الأولية distribution",
        "موشكلات P versus NP Unsolved",
        "فراملات fibonacci في الطبيعة",
        "نسبة golden ratio في الهندسة",
        "نظرية الفوضىdeterministic chaos",
        "تشفير الكم يعتمد على المعادلات"],
    "لغات": [
        "لغة البرمجة Python الأكثر نمواً",
        "تعلم اللغات بواسطة IA personalizes",
        "أكثر 10 لغات انتشاراً في العالم",
        "اللهجات العربية differ جذرياً",
        "الترجمة الآلية Neural Machine Translation",
        "اللهجات تتغير جيل بعد جيل",
        "حفاظ on Linguistic endangered",
        "بilingualism improves cognitive function",
        "التواصل international lingua franca",
        "تطور اللغة عبر وسائل التواصل"],
    "معلومات مثيرة": [
        "يمكن للبشر تمييز تريليونات الروائح",
        "الزلازل تصدر Sounds infrasonic",
        "البرق Temperature تصل لـ 30,000 K",
        "الثعابين Some species تستطيع الطيران",
        "الدلافين names for each other",
        "الفيلة记住 humans لمدة decades",
        "الغربان تستخدم الأدوات",
        "القططsleep 16 ساعة يومياً",
        "الكلاب smell diseases",
        "الخيول recognizing themselves في المرايا"],
    ]
}

all_topics = []
ep_num = 100

for category, factoids in categories.items():
    for i, fact in enumerate(factoids):
        all_topics.append({
            "id": f"ep{ep_num:03d}",
            "topic": fact,
            "status": "queued",
            "category": category,
            "facts": fact.split("،") if "、" in fact else [fact]
        })
        ep_num += 1

# Shuffle to mix categories
random.shuffle(all_topics)

with open("/home/user/daousha/scripts/topic_library.json", "w", encoding="utf-8") as f:
    json.dump(all_topics, f, ensure_ascii=False, indent=1)

print(f"Generated {len(all_topics)} topics in {len(categories)} categories")
print(f"First 5 topics: {all_topics[:5]}")