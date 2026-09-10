"""اختبارات المصنع — تعمل أوفلاين بالكامل."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.script import build_script, validate
from pipeline.topics import load_bank, next_topic
from pipeline.assemble import make_srt, _split_caption
from pipeline.qc import check
from pipeline.expand_bank import generate


def test_bank_loads():
    bank = load_bank()
    assert len(bank) >= 24
    ready = [t for t in bank if t.get("facts_ar") and t.get("facts_en")]
    assert len(ready) >= 24, "need 24+ ready topics with facts"


def test_all_seed_scripts_validate():
    for t in load_bank():
        if t.get("facts_ar") is None:
            continue
        for lang in ("ar", "en"):
            s = build_script(t, lang)
            assert validate(s) == [], (t["id"], lang, validate(s))


def test_script_has_cta_and_4_scenes():
    t = load_bank()[0]
    for lang in ("ar", "en"):
        s = build_script(t, lang)
        assert len(s.scenes) == 4
        assert "داوسها" in s.body or "NOVA" in s.body


def test_topic_rotation_avoids_recent_cats():
    bank = load_bank()
    state = {"consumed": [], "recent_cats": ["body", "space", "animals"]}
    t = next_topic(state, bank)
    assert t["cat"] not in ("body", "space", "animals")


def test_topic_skips_consumed():
    bank = load_bank()
    state = {"consumed": [t["id"] for t in bank[:5]], "recent_cats": []}
    t = next_topic(state, bank)
    assert t["id"] == bank[5]["id"]


def test_caption_split_short_blocks(tmp_path):
    blocks = _split_caption("هذه جملة طويلة جداً تحتاج إلى تقسيم على عدة شطور قصيرة", 20)
    assert all(len(b) <= 45 for b in blocks)
    srt = tmp_path / "t.srt"
    make_srt("سطر أول\nسطر ثان طويل يحتاج تقسيماً إضافياً هنا", 10.0, srt)
    assert "00:00:00,000 --> " in srt.read_text(encoding="utf-8")


def test_qc_rejects_missing():
    rep = check(Path("/nonexistent/x.mp4"))
    assert rep["pass"] is False
    assert "FILE_MISSING" in rep["errors"]


def test_expand_bank_volume_and_cats():
    cands = generate()
    assert len(cands) == 12 * 10 * 4
    cats = {c["cat"] for c in cands}
    assert len(cats) == 12
    assert all(c["status"] == "needs_facts" for c in cands)
