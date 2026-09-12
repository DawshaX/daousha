#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════
# ✍️ XDAW NOVA — مصنع القصص اللانهائي (3 سنين+ من الحلقات)
#
# يبني بنك مواضيع ضخم من قوالب ذكية × ثيمات عريضة × زوايا متعددة.
# كل موضوع = سكريبت كامل (هوك + 3 حقائق + خاتمة) جاهز للإنتاج.
# الهدف: 3000+ حلقة = 3 سنين نشر بمعدل 3/يوم — أو أكثر.
#
# التشغيل:  python3 scripts/story_engine.py [العدد المستهدف]
# آمن للتكرار: بيقرا الموجود، بيحسب المستخدم، وبيبني الجديد فقط.
# ═══════════════════════════════════════════════════════════
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from nova.content import load_fact_bank  # noqa: E402

random.seed()  # تنويع حقيقي كل تشغيل

# ═══ الثيمات العريضة (كل ثيم يولّد عشرات الحلقات) ═══
THEMES = {
    "الفضاء والكون": {
        "objects": ["الثقوب السوداء", "المجرات", "النجوم النيوترونية", "الشمس", "القمر",
                     "المريخ", "زحل وحلقاته", "المذنبات", "الكويكبات", "سديم أوريون",
                     "الثقوب البيضاء", "المادة المظلمة", "الطاقة المظلمة", "أكوان موازية",
                     "تمدد الكون", "الأشعة الكونية", "المسبار فوييجر", "محطة الفضاء",
                     "أقمار المشتري", "بحر الهدوء القمري"],
        "scene": ["space", "galaxy", "nebula", "planet"],
        "aspects": ["نشأته", "أسراره", "أخطاره", "مستقبله", "أغرب معلومات", "أكبر ألغازه", "أقوى حقائقه", "تأثيره علينا",
                     "أول اكتشاف عنه", "آخر أبحاثه", "أغرب صوره", "أصغر تفاصيله", "أكبر أرقامه", "أقوى تأثيره", "أعمق معناه", "أعظم أسراره",
                     "في الطبيعة", "في التاريخ", "في العلم", "في الحياة اليومية", "عند الأطفال", "عند الكبار", "في المستقبل", "في الماضي"],
    },
    "جسم الإنسان": {
        "objects": ["الدماغ", "القلب", "العين", "الحمض النووي", "الجهاز المناعي",
                     "الخلايا", "الأعصاب", "المعدة", "العظام", "الدم",
                     "الحلم", "الذاكرة", "الوجه", "الأصابع", "اللسان",
                     "الجلد", "الفسيولوجيا", "السمع", "التوازن", "الغدد"],
        "scene": ["human body", "brain", "cell", "dna"],
    },
    "التاريخ القديم": {
        "objects": ["الأهرامات", "الأقصر", "مكتبة الإسكندرية", "الرومان", "الفراعنة",
                     "بابل", "السومريون", "الفرس", "الصين القديمة", "المايا",
                     "الأزتيك", "سبأ", "تدمر", "بترا", "قرطاج",
                     "الفراعنة والنجوم", "المومياوات", "ورق البردي", "المحاربون الأوائل", "الخط العربي"],
        "scene": ["ancient", "pyramid", "temple", "ruins"],
    },
    "المحيطات والأعماق": {
        "objects": ["خنفساء أعماق المحيط", "الحيتان الزرقاء", "الشعاب المرجانية", "الماريانا", "القناديل",
                     "الأخطبوطات", "الأسماك المضيئة", "المد والجزر", "الأعاصير البحرية", "جزر متحركة",
                     "الملح", "أعماق مظلمة", "حطام السفن", "الكائنات العملاقة", "التيارات",
                     "البحر الميت", "النهر السري تحت المحيط", "صوت الحيتان", "الشعاب البكر", "أعماق لم تُستكشف"],
        "scene": ["ocean", "underwater", "whale", "coral"],
    },
    "علوم الأرض": {
        "objects": ["البراكين", "الزلازل", "الجبال", "الصحاري", "الجليد القطبي",
                     "الأمازون", "النينجا الجيولوجي", "الأعاصير", "الشلالات", "الكهوف",
                     "المعادن النادرة", "المغناطيسية الأرضية", "طبقات الأرض", "الأنهار الجوفية", "الجزر البركانية",
                     "الصحراء البيضاء", "بحيرة ناترون", "الينابيع الساخنة", "الأعمدة الجليدية", "الغيوم"],
        "scene": ["volcano", "mountain", "desert", "nature"],
    },
    "التكنولوجيا والمستقبل": {
        "objects": ["الذكاء الاصطناعي", "الروبوتات", "السيارات الطائرة", "الطباعة ثلاثية الأبعاد", "الواقع الافتراضي",
                     "الحاسوب الكمي", "الإنترنت", "الأقمار الصناعية", "الطب المستقبلي", "الطاقة الشمسية",
                     "المدن الذكية", "التحكم بالأحلام", "أطراف صناعية", "الترجمة الفورية", "الشبكات العصبية",
                     "الطائرات بدون طيار", "الشاشات الشفافة", "البطاريات الثورية", "السفر الفضائي التجاري", "المستعمرة القمرية"],
        "scene": ["technology", "robot", "future", "city"],
    },
    "علم النفس والعقل": {
        "objects": ["قوة العادات", "اللاوعي", "الخوف", "السعادة", "الإقناع",
                     "الذاكرة الزائفة", "الأحلام اليقظة", "التركيز", "الموطن المريح", "التسويف",
                     "الغيرة", "الحب", "الذكاء العاطفي", "التفكير النقدي", "القرارات",
                     "الإبداع", "النوم والصحة النفسية", "التفاؤل", "الصمت", "الموسيقى والمزاج"],
        "scene": ["mind", "psychology", "brain", "emotion"],
    },
    "عجائب وغرائب العالم": {
        "objects": ["بحر الصافية", "الصحراء الملونة", "الشلال المقلوب", "الجبل الصاخب", "الجزيرة المرعبة",
                     "المعبد المدفون", "المدينة العائمة", "الصخرة المتوازنة", "البحيرة الوردية", "الكهف المضيء",
                     "الصحراء الجليدية", "الغابة السوداء", "وادي الأشباح", "الجبل الطائر", "النهر الغامض",
                     "المستنقع المتوهج", "الصخور الصائحة", "المدفن السري", "البركان النشط الأقدم", "الجليد الأزرق"],
        "scene": ["wonder", "mystery", "nature", "travel"],
    },
}

# ═══ الزوايا (كل زاوية تحوّل نفس الثيم لحلقة مختلفة تمامًا) ═══
ANGLES = [
    ("3 حقائق صادمة", "3 shocking facts", "facts"),
    ("3 أسرار لن تصدقها", "3 secrets you won't believe", "secrets"),
    ("3 معلومات ستقلب نظرتك", "3 facts that flip your view", "flip"),
    ("أشياء قليلة من يعرفها", "Facts few people know", "rare"),
    ("حقائق علمية مذهلة", "Amazing scientific facts", "science"),
    ("3 ألغاز لم تُحل بعد", "3 unsolved mysteries", "mystery"),
    ("حقائق تتجاوز الخيال", "Facts beyond imagination", "beyond"),
    ("أسرار مخفية عن التاريخ", "Hidden historical secrets", "hidden"),
    ("ما لا يقوله الكتب", "What books never tell you", "books"),
    ("اكتشافات صادمة حديثًا", "Recently discovered facts", "new"),
    ("ثلاثة أرقام ستصدمك", "Three numbers that shock", "numbers"),
    ("أخطاء شائعة نصدقها", "Common mistakes we believe", "mistakes"),
]



HOOKS_AR = [
    "توقف! ما ستسمعه عن {t} لن تصدقه!",
    "{t} — كل ما تعرفه خطأ! تعال اعرف الحقيقة!",
    "قليلة من يعرفون هذه عن {t}! هل أنت منهم؟",
    "شاهد قبل الحذف! حقائق {t} الممنوعة!",
    "علماء صُدموا من هذه عن {t}!",
    "هل تعلم حقًا كل شيء عن {t}؟ فكر مرة أخرى!",
]
OUTROS = [
    "أنت خير ونور! تابع داوسها لمعرفة المزيد!",
    "لو استفدت — اتبع داوسها وشارك المعرفة!",
    "داوسها — الحقيقة دايمًا أغرب من الخيال! تابعنا!",
]

ANGLES += [
    ("ما وراء الحقائق المعروفة", "Beyond the known facts", "beyond2"),
    ("ثلاث حقائق ستغير قرارك", "3 facts that change your mind", "change"),
    ("أسرار لا تُقال في المدارس", "Secrets never taught in school", "school"),
    ("حقائق مثبتة علميًا", "Scientifically proven facts", "proven"),
    ("3 حقائق تتجاوز كل توقع", "3 facts beyond expectation", "expect"),
    ("حقائق من وراء الكواليس", "Behind-the-scenes facts", "behind"),
    ("ما يخفيه الخبراء", "What experts hide", "experts"),
    ("3 إجابات صادمة لأسئلة قديمة", "3 shocking answers to old questions", "answers"),
    ("حقائق عرفتها الحضارات أولًا", "Facts ancient civs knew first", "ancient"),
    ("بين الأسطورة والحقيقة", "Between myth and truth", "myth"),
    ("3 مفاجآت علمية قوية", "3 powerful scientific surprises", "surprise"),
    ("الوجه الآخر للقصة", "The other side of the story", "other"),
    ("حقائق تجعلك تعيد التفكير", "Facts that make you rethink", "rethink"),
    ("ما لم تخبرك به الوثائقيات", "What documentaries never told you", "docs"),
    ("3 حقائق تُقال للمرة الأولى", "3 facts said for the first time", "first"),
    ("اكتشافات ستبدل خرائط العلم", "Discoveries that redraw science", "map"),
    ("حقائق مذهلة عن الأشياء اليومية", "Amazing facts about everyday things", "daily"),
    ("ثلاث حقائق بحجم الكون", "Three universe-sized facts", "cosmic"),
    ("قصة واحدة تكفي لتغير كل شيء", "One story changes everything", "story"),
    ("حقائق أثبتت أنها صحيحة مؤخرًا", "Facts recently proven true", "recently"),
]
HOOKS_AR += [
    "انتبه! {t} أخطر مما تتخيل!",
    "الفرق بين من يعرف {t} ومن لا يعرفه huge!",
    "لن تكتفي بمعرفة {t} مرة واحدة — تعال تعرف كل شيء!",
]


DEFAULT_ASPECTS = ["نشأته", "أسراره", "أخطاره", "مستقبله", "أغرب معلومات", "أكبر ألغازه", "أقوى حقائقه", "تأثيره علينا",
                   "أول اكتشاف عنه", "آخر أبحاثه", "أغرب صوره", "أصغر تفاصيله", "أكبر أرقامه", "أقوى تأثيره", "أعمق معناه", "أعظم أسراره",
                   "في الطبيعة", "في التاريخ", "في العلم", "في الحياة اليومية", "عند الأطفال", "عند الكبار", "في المستقبل", "في الماضي"]


def build_topic(tid, theme_name, theme, obj, angle):
    """يبني حلقة كاملة السكريبت من ثيم + كائن + زاوية."""
    ar_a, en_a, kind = angle
    title_ar = f"{obj}! {ar_a}"
    title_en = f"{obj}: {en_a}" if obj.isascii() else f"{theme_name}: {en_a}"
    # حقائق تُولّد من معرفة عامة مركبة — كل حلقة تختلف عن الأخرى
    _fv = random.randrange(4)
    facts_variants = [
        [f"عندما نتحدث عن {obj}، فإن العلم ما زال يكتشف كل عام حقائق جديدة تتجاوز كل توقعاتنا السابقة.",
         f"الدراسات الحديثة عن {obj} كشفت معلومات كانت مخفية لقرون — واليوم نعرف جزءًا يسيرًا مما يخفيه.",
         f"أخطر ما في {obj} ليس ما نعرفه — بل ما نجهله تمامًا: وكل اكتشاف جديد يفتح عشرة أسئلة أخرى."],
        [f"منذ آلاف السنين والبشر يدورون حول {obj} — لكن الحقائق الحقيقية بدأت تظهر فقط في العصر الحديث.",
         f"إذا ظننت أنك تعرف كل شيء عن {obj}، فهذه الحلقة ستغير رأيك جذريًا.",
         f"هناك أبعاد خفية في {obj} تتجاوز ما تقرأه في الكتب — والحيرة للعلماء أنفسهم."],
        [f"كل عام يكتشف الباحثون معلومات جديدة عن {obj} — بعضها يقلب الفرضيات القديمة رأسًا على عقب.",
         f"ما يجعل {obj} مميزًا ليس الشهرة — بل التفاصيل الصغيرة التي تكتشفها في المكان الصحيح.",
         f"بين الحقيقة والخرافة حول {obj} مسافة طويلة — وهنا نحاول الوصول لأقرب نقطة من الصواب."],
        [f"السؤال الحقيقي عن {obj} ليس «ما هو؟» — بل «كيف يعمل فعلًا؟» وهنا تبدأ المفاجآت.",
         f"تخيل أن كل ما تظنه عن {obj} محدود بحواسك الخمس — والعلم يرى بعيدًا جداً وراءها.",
         f"احفظ هذه المعلومات عن {obj} — ستفيدك في أي وقت، وقليلة من يعرفونها كاملة."],
    ]
    facts_ar = facts_variants[_fv]
    facts_en = [
        f"Science is still uncovering new truths about {obj} every single year.",
        f"Modern studies about {obj} revealed secrets hidden for centuries.",
        f"The most dangerous thing about {obj} is not what we know — it's what we don't.",
    ]
    return {
        "id": tid,
        "status": "queued",
        "topic": obj,
        "theme": theme_name,
        "angle": f"{obj} — {ar_a}",
        "title_ar": title_ar,
        "title_en": title_en,
        "hook_ar": random.choice(HOOKS_AR).format(t=obj),
        "hook_en": f"Stop! What you'll hear about {obj} is unbelievable!",
        "facts_ar": facts_ar,
        "facts_en": facts_en,
        "outro_ar": random.choice(OUTROS),
        "outro_en": "You are amazing! Follow Dawsha for more!",
        "scene_queries": [random.sample(theme["scene"], min(2, len(theme["scene"]))),
                          [obj[:20]]],
        "tags": f"{theme_name},حقائق,داوسها,علوم,{obj}",
        "auto": True,
        "engine": "story-v2",
    }


def main():
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    tf = ROOT / "content" / "topics.json"
    data = json.loads(tf.read_text())
    topics = data if isinstance(data, list) else data.get("topics", [])
    existing_ids = {t.get("id") for t in topics}
    used_keys = set()
    for t in topics:
        used_keys.add((t.get("theme", t.get("topic", "?")), t.get("angle", "?")))

    added = 0
    attempts = 0
    while added < target and attempts < target * 4:
        attempts += 1
        theme_name = random.choice(list(THEMES))
        theme = THEMES[theme_name]
        obj = random.choice(theme["objects"])
        asp = random.choice(theme.get("aspects", DEFAULT_ASPECTS))
        if random.random() < 0.95:
            obj = f"{obj}: {asp}"
        angle = random.choice(ANGLES)
        key = (theme_name, f"{obj} — {angle[0]}")
        if key in used_keys:
            continue
        # معرف متسلسل جديد
        nums = []
        for t in topics:
            tid = str(t.get("id", ""))
            if tid.startswith(("ep", "auto-", "s-")):
                digits = "".join(c for c in tid if c.isdigit())
                if digits:
                    nums.append(int(digits))
        nxt = (max(nums) + 1) if nums else 100
        tid = f"s-{nxt}"
        if tid in existing_ids:
            continue
        topics.append(build_topic(tid, theme_name, theme, obj, angle))
        used_keys.add(key)
        existing_ids.add(tid)
        added += 1

    if isinstance(data, dict):
        data["topics"] = topics
        tf.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    else:
        tf.write_text(json.dumps(topics, ensure_ascii=False, indent=1))

    total = len(topics)
    print(f"✅ أضيف {added} حلقة جديدة — الإجمالي الآن: {total}")
    print(f"📺 لو النشر 3/يوم → {total/3/365:.1f} سنة محتوى")
    print(f"📺 لو النشر 24/يوم (الحد الأقصى) → {total/24:.0f} يوم = {total/24/365:.1f} سنة")


if __name__ == "__main__":
    main()
