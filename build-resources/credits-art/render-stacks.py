"""Studyboard Credits: stacks of the gold coin for each credit pack (App Store in-app purchase images, 1024x1024, no transparency).
Uses the coin drawing in render-coins.py. Run:  python3 render-stacks.py <dir with mask.npy and blue.npy> <out dir>   (the masks are made as render-coins.py describes)"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE, DEST = sys.argv[1], sys.argv[2]
# The coin drawing functions from render-coins.py (everything before its concepts)
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "render-coins.py")).read()
src = src[:src.index("C = S / 2")]
sys.argv = [sys.argv[0], HERE, DEST]
exec(src)

C = S / 2

def tilted_coin():
    """One coin seen from a little above: the face squashed, and its ridged gold edge below. RGBA, cropped."""
    face = np.zeros((S, S, 3), np.float32)
    face, fa = gold_face(C, C, S * 0.34, face, field_tone=0.40, rim=0.13)
    M, Bm = place_logo(1.04, C + 6, C + 4)
    face = gold_logo(face, M, Bm, base=0.76)
    SQ = 0.36   # seen from nearly eye level, so the stacks stand upright rather than lean toward you
    def squash(arr):
        im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)) if arr.ndim == 2 else Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
        nh = int(S * SQ); im = im.resize((S, nh), Image.LANCZOS)
        canvas = Image.new(im.mode, (S, S)); canvas.paste(im, (0, (S - nh) // 2 - 60))
        a = np.asarray(canvas).astype(np.float32)
        return a / 255 if arr.ndim == 2 else a
    faceS = squash(face); faS = squash(fa)
    edge_a = np.zeros((S, S), np.float32); edge_c = np.zeros((S, S, 3), np.float32)
    thick = 60
    for i in range(thick, 0, -2):
        sh = np.roll(faS, i, 0); new = np.clip(sh - edge_a, 0, 1)
        reed = 0.5 + 0.5 * np.sin((xx - C) / (S * 0.34) * 70)
        t = 0.28 + 0.30 * np.clip(1 - np.abs(xx - C + S * 0.1) / (S * 0.36), 0, 1) + 0.07 * reed
        if i > thick - 8: t = t - 0.26   # a dark seam along the bottom and a bright lip along the top,
        elif i < 8: t = t + 0.16          # so the coins in a stack read one by one
        edge_c = edge_c + ramp(t, GOLD) * new[..., None]; edge_a = np.clip(edge_a + new, 0, 1)
    col = edge_c / np.maximum(edge_a, 1e-4)[..., None]
    col = col * (1 - faS[..., None]) + faceS * faS[..., None]
    alpha = np.clip(edge_a + faS, 0, 1)
    rgba = Image.fromarray(np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")
    return rgba.crop(rgba.getbbox()), thick / (S * 0.68)   # the coin, and its edge thickness as a share of its width

COIN, EDGE = tilted_coin()

COIN_W = 0.24   # every image uses the same coin size, so only the number of coins changes from pack to pack
# One coin is 10 credits. Each stack: (across, in coin widths from the middle; row, 0 at the back and 1 in front; coins)
PACKS = {
    "credits-100":  [(0, 0, 10)],
    "credits-300":  [(-0.53, 0, 14), (0.53, 0, 16)],
    "credits-600":  [(-1.06, 0, 20), (0, 0, 22), (1.06, 0, 18)],
    "credits-1300": [(-1.06, 0, 34), (0, 0, 38), (1.06, 0, 30), (-0.53, 1, 14), (0.53, 1, 14)],
}

def stack_image(name, stacks, glow, sparkles):
    """One pack's image, laid out to read as an App Store icon: no words (the store shows the pack's name beside it),
    the pile centred, the same coin size in every pack, and nothing in the corners iOS rounds off"""
    assert sum(n for _, _, n in stacks) * 10 == int(name.split("-")[1]), name
    # Fitted to the frame a little: a smaller pile grows part of the way toward filling the square (40%, on a log scale),
    # so every image reads well small while the bigger packs still look bigger
    def size(w):
        ch = COIN.height * w / COIN.width; st = max(6, w * EDGE * 0.92); fr = ch * 0.55
        dxs = [dx for dx, _, _ in stacks]
        top = min(fr * row - ch - (n - 1) * st for _, row, n in stacks); bot = max(fr * row for _, row, n in stacks)
        return (max(dxs) - min(dxs) + 1) * w, bot - top
    w0 = S * COIN_W; pw, ph = size(w0); fit = min(S * 0.80 / pw, S * 0.66 / ph)
    w = int(w0 * (fit ** 0.4 if fit > 1 else fit))
    coin = COIN.resize((w, int(COIN.height * w / COIN.width)), Image.LANCZOS)
    step = max(6, int(w * EDGE * 0.92)); front = int(coin.height * 0.55)   # a front-row stack stands this much lower
    tops = [front * row - coin.height - (n - 1) * step for _, row, n in stacks]
    bottoms = [front * row for _, row, n in stacks]
    y0 = int(S * 0.53 - (min(tops) + max(bottoms)) / 2)   # the pile, top of the tallest stack to the lowest foot, centred
    place = [(S // 2 + int(dx * w), y0 + front * row, n, row) for dx, row, n in stacks]
    # the app icon's own navy (icon-1024.png), with no glow
    bg = background(c_top=(20, 54, 107), c_mid=(17, 48, 97), c_bot=(15, 44, 89), glow=0, vig=0.06)
    # a warm golden glow behind the pile (added light, so the navy stays deep at the edges)
    cy = S * 0.53   # the pile's middle
    r2 = ((xx - S / 2) ** 2 + ((yy - cy) * 1.15) ** 2) / (S * 0.30) ** 2
    halo = np.exp(-r2) * glow + np.exp(-r2 * 4) * glow * 0.6
    bg = bg + np.array([255, 186, 70], np.float32) * halo[..., None] * 0.42
    img = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    rng = np.random.default_rng(len(name))
    # Shadows that sit on the ground like real ones: each is the shape of the coin's own bottom (a flattened ellipse,
    # mostly hidden under the stack), so it shows only as a rim around the base: a soft one leaning a little to the
    # lower right (the light is from the top left), a firmer contact shadow, and a thin dark line where metal meets ground
    faceh = coin.height - EDGE * w   # the height of a coin's face as drawn
    def shade(rx, ry, dx, dy, blur, alpha):
        m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
        for x, foot, n, row in place:
            cx, cy = x + w * dx, foot - faceh * 0.5 + faceh * dy
            d.ellipse([cx - w * rx, cy - faceh * ry, cx + w * rx, cy + faceh * ry], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(max(1, int(blur)))).point(lambda v: int(v * alpha))
        return Image.merge("RGBA", (Image.new("L", (S, S), 4), Image.new("L", (S, S), 12), Image.new("L", (S, S), 30), m))
    img = Image.alpha_composite(img, shade(0.64, 0.80, 0.10, 0.12, w * 0.10, 0.30))
    img = Image.alpha_composite(img, shade(0.55, 0.62, 0.03, 0.04, w * 0.035, 0.55))
    img = Image.alpha_composite(img, shade(0.51, 0.53, 0.00, 0.01, w * 0.010, 0.60))
    shadows = img; img = Image.new("RGBA", (S, S), (0, 0, 0, 0))   # the coins go on their own layer, for their aura
    for x, foot, n, row in sorted(place, key=lambda t: t[3]):   # the back row first, then the stacks in front
        for k in range(n):
            j = int(rng.normal(0, w * 0.012))
            img.alpha_composite(coin, (x - w // 2 + j, foot - coin.height - k * step))
    # a soft golden aura around the coins' outline, then the coins over it
    a = img.getchannel("A")
    aura = Image.merge("L", [a.filter(ImageFilter.GaussianBlur(int(w * 0.16))).point(lambda v: int(min(255, v * 1.3) * glow * 0.85))])
    wide = a.filter(ImageFilter.GaussianBlur(int(w * 0.45))).point(lambda v: int(min(255, v * 1.6) * glow * 0.55))
    gold = lambda m: Image.merge("RGBA", (Image.new("L", (S, S), 255), Image.new("L", (S, S), 200), Image.new("L", (S, S), 96), m))
    img = Image.alpha_composite(Image.alpha_composite(Image.alpha_composite(shadows, gold(wide)), gold(aura)), img)
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    for (x, y, sz, a) in sparkles:   # kept well inside the rounded corners
        arr = sparkle(arr, S * x, S * y, S * sz, a)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").resize((OUT, OUT), Image.LANCZOS).save(os.path.join(DEST, name + ".png"), optimize=True)

SP = lambda *xs: list(xs)
stack_image("credits-100", PACKS["credits-100"], 0.20, SP((0.70, 0.27, 0.04, 0.9)))
stack_image("credits-300", PACKS["credits-300"], 0.23, SP((0.76, 0.22, 0.045, 0.95), (0.25, 0.28, 0.032, 0.8)))
stack_image("credits-600", PACKS["credits-600"], 0.26, SP((0.80, 0.17, 0.045, 1.0), (0.20, 0.22, 0.035, 0.85)))
stack_image("credits-1300", PACKS["credits-1300"], 0.30, SP((0.82, 0.13, 0.05, 1.0), (0.18, 0.16, 0.04, 0.9)))
print("done")
