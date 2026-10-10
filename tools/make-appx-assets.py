#!/usr/bin/env python3
"""Makes the Microsoft Store (MSIX) tile and logo images in build-resources/appx/ from icon-1024.png.

Run from the repository root after changing the app icon:   python3 tools/make-appx-assets.py
prepare.js copies build-resources/appx/ to build/appx/, where electron-builder's appx target looks for them. Without them
electron-builder packs its own sample images, which Store certification rejects.

* StoreLogo, Square44x44Logo (Start, search, taskbar): the whole rounded icon, as on the other platforms.
* Square150x150Logo, Wide310x150Logo, LargeTile, SmallTile (Windows 10 Start tiles): the S and cap on the icon's own navy gradient,
  edge to edge, so the tile's square corners never show the icon's rounded ones.
Every image comes in the scale variants Windows asks for (scale-100 to 400; target sizes for the 44x44 icon, plated and unplated).
"""
import math, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build-resources", "appx")
icon = Image.open(os.path.join(ROOT, "icon-1024.png")).convert("RGBA")
px = icon.load()

# The icon's background is a plain top-to-bottom gradient; fit it per channel so tiles can extend it past the icon's edges.
rows = range(160, 861)
def fit(ch):
    n = len(rows); sx = sum(rows); sy = sum(px[130, y][ch] for y in rows)
    sxx = sum(y * y for y in rows); sxy = sum(y * px[130, y][ch] for y in rows)
    b = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    return b, (sy - b * sx) / n
FITS = [fit(c) for c in range(3)]
def bg(y):
    return tuple(max(0, min(255, round(a + b * y))) for b, a in FITS) + (255,)

GLYPH = (247, 168, 776, 855)        # bounding box of the S and cap inside icon-1024.png
M = 30                              # margin of the icon's own background kept around it (stays inside the rounded square)
CROP = (GLYPH[0] - M, GLYPH[1] - M, GLYPH[2] + M, GLYPH[3] + M)
glyph = icon.crop(CROP)

def tile(w, h, ratio):
    """The glyph, `ratio` of the tile's height, centred on the gradient continued to the tile's edges."""
    gh = h * ratio
    s = gh / (GLYPH[3] - GLYPH[1])
    cw, ch = round(glyph.width * s), round(glyph.height * s)
    ox, oy = round((w - cw) / 2), round((h - ch) / 2)
    img = Image.new("RGBA", (w, h))
    p = img.load()
    for y in range(h):
        c = bg(CROP[1] + (y - oy) / s)
        for x in range(w):
            p[x, y] = c
    img.alpha_composite(glyph.resize((cw, ch), Image.LANCZOS), (ox, oy))
    return img

def whole(size):
    return icon.resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith(".png"):
        os.remove(os.path.join(OUT, f))
SCALES = [100, 125, 150, 200, 400]
rnd = lambda x: math.floor(x + 0.5)      # half up, like Windows' asset tools (62.5 -> 63), not Python's round-half-even
def save(img, name):
    img.save(os.path.join(OUT, name), optimize=True)

for sc in SCALES:
    k = sc / 100
    save(whole(rnd(50 * k)), f"StoreLogo.scale-{sc}.png")
    save(whole(rnd(44 * k)), f"Square44x44Logo.scale-{sc}.png")
    save(tile(rnd(150 * k), rnd(150 * k), 0.50), f"Square150x150Logo.scale-{sc}.png")
    save(tile(rnd(310 * k), rnd(150 * k), 0.62), f"Wide310x150Logo.scale-{sc}.png")
    save(tile(rnd(310 * k), rnd(310 * k), 0.46), f"LargeTile.scale-{sc}.png")
    save(tile(rnd(71 * k), rnd(71 * k), 0.58), f"SmallTile.scale-{sc}.png")
for t in [16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 256]:
    img = whole(t)
    save(img, f"Square44x44Logo.targetsize-{t}.png")
    save(img, f"Square44x44Logo.targetsize-{t}_altform-unplated.png")
    save(img, f"Square44x44Logo.targetsize-{t}_altform-lightunplated.png")
print("Wrote", len([f for f in os.listdir(OUT) if f.endswith(".png")]), "images to", os.path.relpath(OUT, ROOT))

# Store listing artwork for Partner Center (Store listings > Store logos), uploaded by hand: 1:1 box art and a 2:3 poster, at the minimum sizes
# (the source icon is 1024 px, so larger ones would only be upscaled), plus a 300x300 logo for search results.
LIST = os.path.join(ROOT, "build-resources", "msstore-listing")
os.makedirs(LIST, exist_ok=True)
tile(1080, 1080, 0.50).convert("RGB").save(os.path.join(LIST, "BoxArt-1080x1080.png"), optimize=True)
tile(720, 1080, 0.36).convert("RGB").save(os.path.join(LIST, "Poster-720x1080.png"), optimize=True)
whole(300).save(os.path.join(LIST, "Logo-300x300.png"), optimize=True)
print("Wrote the Store listing art to", os.path.relpath(LIST, ROOT))
