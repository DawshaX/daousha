import os
import subprocess
import json

OUTPUT_DIR = "/home/ubuntu/webdev-static-assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 6 production briefs: 3 concepts, each in Arabic and English
shorts = [
    {
        "id": "ar-01-dhikr",
        "lang": "ar",
        "title": "دقيقة ذكر — XDAW NOVA",
        "text": "حين يمتلئ اليوم بالضجيج، خذ لحظة هادئة. سبحان الله، الحمد لله، الله أكبر. اذكر الله بقلب حاضر.",
        "color": "dark_red"
    },
    {
        "id": "en-01-dhikr",
        "lang": "en",
        "title": "A Moment of Remembrance — XDAW NOVA",
        "text": "When the day feels loud, take one quiet moment. SubhanAllah, Alhamdulillah, Allahu Akbar.",
        "color": "dark_red"
    },
    {
        "id": "ar-02-reply",
        "lang": "ar",
        "title": "قبل الرد: 10 ثوانٍ — XDAW NOVA",
        "text": "قبل أن ترد على رسالة أزعجتك، خذ عشر ثوانٍ وتنفّس. أقوى رد هو ردٌّ هادئ.",
        "color": "dark_red"
    },
    {
        "id": "en-02-reply",
        "lang": "en",
        "title": "Before You Reply: 10 Seconds — XDAW NOVA",
        "text": "Before replying to a message that upset you, take ten seconds to breathe. Calm is strength.",
        "color": "dark_red"
    },
    {
        "id": "ar-03-share",
        "lang": "ar",
        "title": "قبل المشاركة: اسأل 3 أسئلة — XDAW NOVA",
        "text": "من المصدر؟ متى نُشر؟ وما الأثر؟ ثلاث ثوانٍ من التحقق تمنع التضليل.",
        "color": "dark_red"
    },
    {
        "id": "en-03-share",
        "lang": "en",
        "title": "Before You Share: 3 Questions — XDAW NOVA",
        "text": "Who is the source? When was it published? What is the impact? Check first.",
        "color": "dark_red"
    }
]

print("Starting high-grade short-form video generation & repurposing pipeline...")

generated_files = []

for item in shorts:
    out_name = f"xdaw-{item['id']}_v1.mp4"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    
    # Generate cinematic 9:16 vertical video using ffmpeg color and text filters (watermarked with XDAW NOVA copyright)
    # 720x1280, 25fps, 35 seconds duration, subtle gradient background with high quality branding overlay
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c=0x0a0a0c:s=720x1280:r=25:d=35",
        "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-filter_complex",
        f"[0:v]drawbox=x=0:y=0:w=720:h=1280:color=black@0.6:t=fill,"
        f"drawtext=text='XDAW NOVA':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=120,"
        f"drawtext=text='{item['title']}':fontcolor=0xff3344:fontsize=28:x=(w-text_w)/2:y=180,"
        f"drawtext=text='(c) 2026 XDAW NOVA - Proprietary':fontcolor=gray:fontsize=18:x=(w-text_w)/2:y=1200[v]",
        "-map", "[v]", "-map", "1:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        out_path
    ]
    
    print(f"Processing and watermarking: {item['title']} -> {out_name}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Successfully generated: {out_path}")
        generated_files.append(out_path)
    else:
        print(f"Error generating {out_name}: {res.stderr}")

print(f"Pipeline complete. Total generated shorts: {len(generated_files)}")
print(json.dumps(generated_files, indent=2))
