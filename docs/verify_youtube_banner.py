from pathlib import Path
import json
from PIL import Image, ImageDraw

source = Path("/home/ubuntu/webdev-static-assets/xdaw-nova-youtube-banner.png")
output = Path("/home/ubuntu/webdev-static-assets/banner-safe-area-checks")
output.mkdir(parents=True, exist_ok=True)

image = Image.open(source).convert("RGB")
width, height = image.size
evidence = {"source": {"width": width, "height": height}, "proofs": []}

def centered_crop(target_ratio, name):
    source_ratio = width / height
    if source_ratio > target_ratio:
        crop_height = height
        crop_width = round(crop_height * target_ratio)
    else:
        crop_width = width
        crop_height = round(crop_width / target_ratio)
    left = (width - crop_width) // 2
    top = (height - crop_height) // 2
    crop = image.crop((left, top, left + crop_width, top + crop_height))
    crop.save(output / name, quality=95)
    return crop, left, top

for ratio, name in [(16 / 9, "desktop-tv-16x9.jpg"), (4 / 3, "desktop-4x3.jpg"), (9 / 16, "mobile-9x16.jpg")]:
    crop, left, top = centered_crop(ratio, name)
    safe_box = (512 - left, 508 - top, 1700 - left, 931 - top)
    visible_box = (max(0, safe_box[0]), max(0, safe_box[1]), min(crop.width, safe_box[2]), min(crop.height, safe_box[3]))
    safe_pixels = list(crop.crop(visible_box).getdata())
    total = len(safe_pixels)
    red_neon = sum(1 for r, g, b in safe_pixels if r > 115 and r > g * 1.7 and r > b * 1.7)
    high_luminance = sum(1 for r, g, b in safe_pixels if max(r, g, b) > 150)
    evidence["proofs"].append({
        "crop": name,
        "safe_box_visible": visible_box,
        "safe_pixel_count": total,
        "red_neon_pixels": red_neon,
        "red_neon_ratio": round(red_neon / total, 6) if total else 0,
        "high_luminance_pixels": high_luminance,
        "high_luminance_ratio": round(high_luminance / total, 6) if total else 0,
    })
    draw = ImageDraw.Draw(crop)
    draw.rectangle(safe_box, outline=(0, 255, 128), width=8)
    crop.save(output / f"proof-{name}", quality=95)

print(f"source={width}x{height}")
print(f"output={output}")
(output / "safe-area-evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"evidence={output / 'safe-area-evidence.json'}")
