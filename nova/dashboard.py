"""لوحة متابعة عربية RTL — ملف HTML واحد مكتفٍ بذاته (ينشر مجانًا عبر GitHub Pages)."""
import html
import time
from datetime import datetime, timezone, timedelta

from . import settings, state

CAIRO = timezone(timedelta(hours=2))
OUT = settings.ROOT / "dashboard" / "status.html"

PLAT_ICONS = {"youtube": "▶️", "facebook": "📘", "instagram": "📸", "tiktok": "🎵"}


def render():
    topics = state.load_topics()
    s = state.status_summary()
    upd = datetime.now(CAIRO).strftime("%Y-%m-%d %H:%M")

    rows = []
    for t in reversed(topics):
        pub = t.get("published", {})
        links = "".join(
            f'<a href="{html.escape(u)}" target="_blank">{PLAT_ICONS.get(p, p)}</a> '
            for p, u in pub.items() if u)
        badge = {"published": ("منشورة", "#16a34a"), "partial": ("جزئيًا", "#d97706"),
                 "produced": ("جاهزة", "#2563eb"), "queued": ("في الطابور", "#6b7280"),
                 "scripted": ("سيناريو جاهز", "#7c3aed")}.get(t.get("status"), (t.get("status"), "#6b7280"))
        rows.append(
            f"<tr><td>{t['id']}</td><td>{html.escape(t.get('angle', ''))}</td>"
            f"<td><span class='b' style='background:{badge[1]}22;color:{badge[1]};"
            f"border:1px solid {badge[1]}55'>{badge[0]}</span></td><td class='lnks'>{links or '—'}</td></tr>")
    eng = s["engine"]
    health = ("متوقف ⛔ " + eng.get("haltReason", "")) if eng.get("halted") else "يعمل ✅"

    html_doc = f"""<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>داوسها XDAW NOVA — لوحة المتابعة</title>
<style>
*{{box-sizing:border-box}} body{{font-family:'Segoe UI',Tahoma,sans-serif;background:#070d1f;color:#e8ecf7;margin:0;padding:24px}}
h1{{color:#ffb73c;font-size:1.5rem;margin:0 0 4px}} .sub{{color:#8b93ad;margin-bottom:20px}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:22px}}
.c{{background:#101a3c;border:1px solid #223;border-radius:14px;padding:14px;text-align:center}}
.c b{{display:block;font-size:1.7rem;color:#fff}} .c span{{color:#8b93ad;font-size:.85rem}}
table{{width:100%;border-collapse:collapse;background:#0c142f;border-radius:14px;overflow:hidden}}
th,td{{padding:10px 12px;border-bottom:1px solid #1b2547;text-align:right;font-size:.92rem}}
th{{background:#131f47;color:#ffb73c}} .lnks a{{text-decoration:none;font-size:1.05rem;margin-left:4px}}
.b{{padding:3px 10px;border-radius:99px;font-size:.78rem;white-space:nowrap}}
.ok{{color:#22c55e}} .warn{{color:#f59e0b}} .bad{{color:#ef4444}}
footer{{margin-top:18px;color:#5d6685;font-size:.8rem;text-align:center}}
</style></head><body>
<h1>🚀 داوسها — XDAW NOVA</h1>
<div class="sub">استوديو المعرفة العربي ذاتي التشغيل • آخر تحديث: {upd} (توقيت القاهرة)</div>
<div class="cards">
<div class="c"><b>{s['published']}</b><span>حلقات منشورة</span></div>
<div class="c"><b>{s['partial']}</b><span>منشورة جزئيًا</span></div>
<div class="c"><b>{s['queued']}</b><span>في الطابور</span></div>
<div class="c"><b>{s['today_published']}/{s['ladder']['dailyCap']}</b><span>سقف اليوم</span></div>
<div class="c"><b>{s['ladder']['streakSafe']}</b><span>سلسلة النجاح</span></div>
<div class="c"><b class="{'bad' if eng.get('halted') else 'ok'}">{health if eng.get('halted') else 'يعمل ✅'}</b><span>حالة المحرك</span></div>
</div>
<table><thead><tr><th>الحلقة</th><th>الموضوع</th><th>الحالة</th><th>المنشورات</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table>
<footer>يُحدَّث تلقائيًا بعد كل دورة إنتاج ونشر — النظام مجاني بالكامل ويعمل على GitHub Actions كل ساعة</footer>
</body></html>"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html_doc, encoding="utf-8")
    print(f"[dashboard] {OUT}")
