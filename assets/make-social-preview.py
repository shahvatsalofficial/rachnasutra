"""Renders assets/social-preview.png (1280x640) for the GitHub social preview. Original artwork, Apache-2.0.
Usage: python assets/make-social-preview.py   (needs Pillow)"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1280, 640
img = Image.new("RGB", (W, H), "#fbfaf7")
d = ImageDraw.Draw(img)

def font(size, bold=False):
    names = ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"] if bold else ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    return ImageFont.load_default()

d.rectangle([0, 0, 24, H], fill="#8a3b12")
d.rounded_rectangle([90, 90, 250, 250], radius=40, fill="#8a3b12")
d.text((170, 170), "RS", font=font(84, True), fill="#ffffff", anchor="mm")
d.text((90, 300), "RachnaSutra AI", font=font(92, True), fill="#1c1a17")
d.text((90, 410), "UI/UX audit and accessibility agent skills", font=font(40), fill="#58534b")
d.text((90, 462), "for Claude Code, Cursor, Codex, Copilot, Gemini CLI", font=font(40), fill="#58534b")
d.text((90, 560), "Evidence-first. Offline CLI. 13 skills. Apache-2.0.", font=font(32), fill="#8a3b12")
img.save(os.path.join(os.path.dirname(__file__), "social-preview.png"), optimize=True)
print("ok")
