#!/usr/bin/env python3
"""Android launcher icons, round icons, adaptive-icon foreground, solid splash and the Play 512 icon,
all made from icon-1024.png. Output: android-wrapper/branding/res (copied into the Android project by
scripts/android-build.js) and build-resources/play-listing/icon-512.png.   python3 tools/make-android-icons.py"""
import os
from PIL import Image, ImageDraw
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
src = Image.open(os.path.join(root, "icon-1024.png")).convert("RGBA")
NAVY = (17, 48, 97, 255)           # the icon's own background colour
res = os.path.join(root, "android-wrapper", "branding", "res")
dens = {"mdpi": 1.0, "hdpi": 1.5, "xhdpi": 2.0, "xxhdpi": 3.0, "xxxhdpi": 4.0}

def on_navy(img):  # the artwork has transparent rounded corners: flatten on the icon's navy
    bg = Image.new("RGBA", img.size, NAVY); bg.alpha_composite(img); return bg

for d, k in dens.items():
    out = os.path.join(res, "mipmap-" + d); os.makedirs(out, exist_ok=True)
    s = round(48 * k)
    sq = src.resize((s, s), Image.LANCZOS)
    sq.save(os.path.join(out, "ic_launcher.png"))
    rnd = on_navy(src.resize((s, s), Image.LANCZOS)); m = Image.new("L", (s, s), 0); ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    r = Image.new("RGBA", (s, s), (0, 0, 0, 0)); r.paste(rnd, (0, 0), m); r.save(os.path.join(out, "ic_launcher_round.png"))
    f = round(108 * k); art = round(f * 0.62)                 # keep the artwork inside the 66% adaptive-icon safe zone
    fg = Image.new("RGBA", (f, f), (0, 0, 0, 0)); a = src.resize((art, art), Image.LANCZOS); fg.alpha_composite(a, ((f - art) // 2, (f - art) // 2))
    fg.save(os.path.join(out, "ic_launcher_foreground.png"))

os.makedirs(os.path.join(res, "values"), exist_ok=True)
open(os.path.join(res, "values", "ic_launcher_background.xml"), "w").write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#113061</color>\n</resources>\n')
# the adaptive icon's background is a plain colour: drop Capacitor's grid drawable
os.makedirs(os.path.join(res, "drawable"), exist_ok=True)
open(os.path.join(res, "drawable", "ic_launcher_background.xml"), "w").write('<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n    <solid android:color="#113061" />\n</shape>\n')
# splash: plain navy in every folder Capacitor put a splash.png
for folder in ["drawable"] + ["drawable-%s-%s" % (o, d) for o in ("land", "port") for d in ("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")]:
    os.makedirs(os.path.join(res, folder), exist_ok=True)
    Image.new("RGB", (16, 16), NAVY[:3]).save(os.path.join(res, folder, "splash.png"))
# Google Play listing icon: 512 x 512, full square (Google rounds it)
play = os.path.join(root, "build-resources", "play-listing"); os.makedirs(play, exist_ok=True)
on_navy(src.resize((512, 512), Image.LANCZOS)).convert("RGB").save(os.path.join(play, "icon-512.png"))
print("made icons in", res)
