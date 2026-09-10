#!/usr/bin/env python3
"""موسّع البنك: يولّد مئات المواضيع (فئة × كيان × زاوية) في bank_full.json.

المواضيع المولّدة تحمل facts=null → تُستكمل الحقائق في جلسات إشراف
(الجودة أولاً: لا إنتاج من موضوع بلا حقائق موثقة).
"""
import argparse
import json
from pathlib import Path
from . import FACTORY_ROOT, load_config
from .topics import load_bank

CFG = load_config("factory")

# 12 فئة × 10 كيانات × 4 زوايا = حتى 480 موضوعاً مرشحاً
ENTITIES = {
    "body": [("العين", "the eye"), ("الجلد", "skin"), ("العظام", "bones"), ("الدم", "blood"),
             ("الرئتان", "the lungs"), ("الكبد", "the liver"), ("الأسنان", "teeth"),
             ("الشعر", "hair"), ("الأعصاب", "nerves"), ("المناعة", "immunity")],
    "space": [("المريخ", "Mars"), ("زحل", "Saturn"), ("المشتري", "Jupiter"), ("الزهرة", "Venus"),
              ("المذنبات", "comets"), ("النيازك", "meteors"), ("المجرات", "galaxies"),
              ("السدم", "nebulae"), ("النجوم النابضة", "pulsars"), ("الكواكب القزمة", "dwarf planets")],
    "animals": [("الأسود", "lions"), ("الدلافين", "dolphins"), ("النسور", "eagles"),
                ("الثعابين", "snakes"), ("العناكب", "spiders"), ("الحيتان", "whales"),
                ("الخفافيش", "bats"), ("التماسيح", "crocodiles"), ("البوم", "owls"), ("القرش", "sharks")],
    "earth": [("البراكين", "volcanoes"), ("الزلازل", "earthquakes"), ("الصحاري", "deserts"),
              ("الأنهار الجليدية", "glaciers"), ("الشلالات", "waterfalls"), ("الكهوف", "caves"),
              ("الجزر", "islands"), ("الأعاصير", "hurricanes"), ("التسونامي", "tsunamis"), ("التربة", "soil")],
    "history": [("الرومان", "the Romans"), ("الفراعنة", "the Pharaohs"), ("الفايكنج", "the Vikings"),
                ("الصين القديمة", "ancient China"), ("الأندلس", "Al-Andalus"), ("الدولة العباسية", "the Abbasids"),
                ("الحرب العالمية", "world wars"), ("طريق الحرير", "the Silk Road"),
                ("المكتبات القديمة", "ancient libraries"), ("الأبجدية", "the alphabet")],
    "tech": [("الروبوتات", "robots"), ("الحواسيب الكمومية", "quantum computers"),
             ("الواقع الافتراضي", "virtual reality"), ("الطائرات المسيّرة", "drones"),
             ("السيارات الكهربائية", "electric cars"), ("الأقمار الصناعية", "satellites"),
             ("الطباعة ثلاثية الأبعاد", "3D printing"), ("البلوك تشين", "blockchain"),
             ("شبكات الجيل الخامس", "5G networks"), ("الرقائق الإلكترونية", "microchips")],
    "mind": [("الأحلام", "dreams"), ("التركيز", "focus"), ("العادات", "habits"),
             ("الخوف", "fear"), ("السعادة", "happiness"), ("الإبداع", "creativity"),
             ("الغضب", "anger"), ("الحافز", "motivation"), ("التوتر", "stress"), ("الحدس", "intuition")],
    "nature": [("الغابات المطيرة", "rainforests"), ("الشعاب المرجانية", "coral reefs"),
               ("الفراشات", "butterflies"), ("الذئاب", "wolves"), ("الفيلة", "elephants"),
               ("الباندا", "pandas"), ("الطيور المهاجرة", "migratory birds"),
               ("الصبار", "cacti"), ("الأوركيد", "orchids"), ("الفطر", "mushrooms")],
    "universe": [("الطاقة المظلمة", "dark energy"), ("المادة المظلمة", "dark matter"),
                 ("الانفجار العظيم", "the Big Bang"), ("الأكوان المتوازية", "parallel universes"),
                 ("السفر عبر الزمن", "time travel"), ("الكويكبات", "asteroids"),
                 ("الحياة الفضائية", "alien life"), ("التلسكوبات", "telescopes"),
                 ("محطة الفضاء", "the space station"), ("الجاذبية", "gravity")],
    "future": [("المدن الذكية", "smart cities"), ("الطاقة النووية", "nuclear energy"),
               ("تحلية المياه", "desalination"), ("الزراعة العمودية", "vertical farming"),
               ("القطارات المغناطيسية", "maglev trains"), ("الحواسيب العصبية", "neural computers"),
               ("إطالة العمر", "life extension"), ("استعمار القمر", "Moon colonization"),
               ("الترجمة الفورية", "instant translation"), ("التعليم الافتراضي", "virtual education")],
    "money": [("البنوك", "banks"), ("الأسهم", "stocks"), ("الذهب", "gold"),
              ("العملات الرقمية", "crypto"), ("الضرائب", "taxes"), ("التأمين", "insurance"),
              ("التجارة الإلكترونية", "e-commerce"), ("المشاريع الناشئة", "startups"),
              ("العقارات", "real estate"), ("الادخار", "saving")],
    "sports": [("كرة السلة", "basketball"), ("السباحة", "swimming"), ("ألعاب القوى", "athletics"),
               ("الملاكمة", "boxing"), ("التنس", "tennis"), ("الفورمولا 1", "Formula 1"),
               ("الجمباز", "gymnastics"), ("ركوب الأمواج", "surfing"),
               ("الشطرنج السريع", "speed chess"), ("الأولمبياد", "the Olympics")],
}

ANGLES_AR = ["3 حقائق صادمة عن {}", "3 أسرار لا تعرفها عن {}",
             "3 أرقام قياسية في عالم {}", "3 خرافات شائعة عن {}"]
ANGLES_EN = ["3 shocking facts about {}", "3 secrets you don't know about {}",
             "3 world records about {}", "3 common myths about {}"]


def generate() -> list:
    out, n = [], 0
    for cat, ents in ENTITIES.items():
        for ar_e, en_e in ents:
            for ai in range(len(ANGLES_AR)):
                n += 1
                out.append({
                    "id": f"g{n:04d}", "cat": cat,
                    "topic_ar": ar_e, "topic_en": en_e,
                    "angle_ar": ANGLES_AR[ai].format(ar_e),
                    "angle_en": ANGLES_EN[ai].format(en_e),
                    "facts_ar": None, "facts_en": None,
                    "status": "needs_facts",
                })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--stats", action="store_true")
    a = ap.parse_args()
    cands = generate()
    seed_ids = {t["id"] for t in load_bank()}
    fresh = [c for c in cands if c["id"] not in seed_ids]
    print(f"candidates: {len(fresh)} (seed bank separate, always first)")
    if a.write:
        p = FACTORY_ROOT / CFG["paths"]["bank_full"]
        p.write_text(json.dumps(fresh, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"WROTE: {p}")
    if a.stats or not a.write:
        from collections import Counter
        print(Counter(c["cat"] for c in fresh))


if __name__ == "__main__":
    main()
