"""Studyboard Credits coin icons: three concepts, 1024x1024 PNG (App Store promo image and Stripe product image).
The logo comes from icon-1024.png. Make its masks first, then run:  python3 render-coins.py <dir with mask.npy and blue.npy> <out dir>
  masks: mask = clip(max((R-28)/190, (B-118)/110), 0, 1) * alpha;  blue (the book stripe) = clip(((B-R)-70)/90, 0, 1) * mask"""
import sys
import numpy as np
from PIL import Image, ImageFilter

S = 2048          # draw at 2x, then downsample for smooth edges
OUT = 1024
HERE = sys.argv[1]
DEST = sys.argv[2]

mask0 = np.load(f"{HERE}/mask.npy")
blue0 = np.load(f"{HERE}/blue.npy")

yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)

def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255

def lerp(a, b, t):
    return a + (b - a) * t[..., None]

def ramp(t, stops):
    """t in [0,1] -> colour from a list of (pos, (r,g,b))"""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        k = np.clip((t - p0) / max(p1 - p0, 1e-6), 0, 1)
        sel = (t >= p0) & (t <= p1)
        col = np.array(c0, np.float32) + (np.array(c1, np.float32) - np.array(c0, np.float32)) * k[..., None]
        out[sel] = col[sel]
    out[t < stops[0][0]] = stops[0][1]
    out[t > stops[-1][0]] = stops[-1][1]
    return out

GOLD = [(0.0, (92, 54, 6)), (0.22, (150, 96, 14)), (0.45, (214, 154, 38)), (0.62, (243, 192, 72)),
        (0.80, (255, 224, 128)), (0.93, (255, 243, 200)), (1.0, (255, 252, 236))]

def place_logo(scale, cx, cy):
    """The logo mask (and its book stripe) scaled and centred at (cx, cy) on the S x S canvas."""
    ys, xs = np.where(mask0 > 0.05)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m = mask0[y0:y1, x0:x1]; b = blue0[y0:y1, x0:x1]
    h, w = m.shape
    nh = int(round(h * scale)); nw = int(round(w * scale))
    def sz(a):
        return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32) / 255
    M = np.zeros((S, S), np.float32); Bm = np.zeros((S, S), np.float32)
    top = int(cy - nh / 2); left = int(cx - nw / 2)
    M[top:top + nh, left:left + nw] = sz(m); Bm[top:top + nh, left:left + nw] = sz(b)
    return M, Bm

def shade(height, light=(-0.62, -0.78), strength=1.0):
    """Lambert-ish shading of a height field, -1..1"""
    gy, gx = np.gradient(height)
    lx, ly = light
    return np.clip((-(gx * lx + gy * ly)) * strength, -1, 1)

def background(c_top=(30, 72, 140), c_mid=(16, 46, 94), c_bot=(9, 28, 62), glow=0.0, glow_col=(255, 200, 90), glow_r=0.42, vig=0.28):
    t = np.clip((yy * 0.75 + xx * 0.25) / S, 0, 1)
    bg = np.where((t < 0.5)[..., None], lerp(np.array(c_top, np.float32) * np.ones((S, S, 1)), np.array(c_mid, np.float32) * np.ones((S, S, 1)), t * 2),
                  lerp(np.array(c_mid, np.float32) * np.ones((S, S, 1)), np.array(c_bot, np.float32) * np.ones((S, S, 1)), (t - 0.5) * 2))
    # soft vignette
    d = np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2) / (S * 0.72)
    bg *= (1 - vig * np.clip(d, 0, 1) ** 2)[..., None]
    if glow:
        g = np.exp(-(((xx - S / 2) ** 2 + (yy - S / 2) ** 2) / (2 * (S * glow_r) ** 2)))
        bg = bg + np.array(glow_col, np.float32) * (g * glow)[..., None]
    return bg

def over(dst, col, alpha):
    return dst * (1 - alpha[..., None]) + col * alpha[..., None]

def disc(cx, cy, r, soft=1.5):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    return np.clip((r - d) / soft + 0.5, 0, 1), d

def drop_shadow(alpha, dx, dy, r, k):
    sh = blur(np.roll(np.roll(alpha, dy, 0), dx, 1), r)
    return sh * k

def gold_logo(img, M, Bm, base=0.62, depth=1.0, light=(-0.62, -0.78), on_gold=True, blue_book=False):
    """Raised gold logo: bevelled edges from a blurred height map, the book stripe a paler gold"""
    h = blur(M, 7) * 0.6 + blur(M, 2.5) * 0.4
    sh = shade(h * 60 * depth, light)
    # a gentle top-to-bottom sheen across the whole mark
    ys = np.where(M > 0.05)[0]
    sheen = 1 - np.clip((yy - ys.min()) / max(ys.max() - ys.min(), 1), 0, 1)
    t = base + 0.18 * sheen - 0.08 + 0.42 * sh
    if not blue_book: t = t + 0.12 * Bm            # book stripe: lighter, champagne gold
    col = ramp(t, GOLD)
    if blue_book:
        # the book stripe in Studyboard's own blue, glossy enamel lit like the gold around it
        bt = np.clip(0.45 + 0.55 * sh + 0.15 * sheen, 0, 1)
        blue = ramp(bt, [(0.0, (14, 52, 150)), (0.4, (37, 99, 226)), (0.7, (61, 123, 255)), (0.9, (128, 172, 255)), (1.0, (205, 225, 255))])
        col = lerp(col, blue, np.clip(Bm * 1.15, 0, 1))
    # crisp bright edge on the lit side
    edge = np.clip(M - blur(M, 2), 0, 1) * np.clip(sh * 2, 0, 1)
    col = col + np.array([255, 245, 210], np.float32) * (edge * 0.6)[..., None]
    # contact shadow under the raised logo
    shadow = drop_shadow(M, 10, 14, 10, 0.55 if on_gold else 0.7)
    img = over(img, np.array([60, 32, 2] if on_gold else [2, 10, 26], np.float32), np.clip(shadow * (1 - M), 0, 1))
    return over(img, col, M)

BLUE = [(0.0, (10, 36, 104)), (0.35, (26, 76, 182)), (0.65, (48, 108, 232)), (0.85, (104, 156, 255)), (1.0, (196, 220, 255))]

def gold_face(cx, cy, r, img, alpha_mask=None, field_tone=0.52, rim=0.12, reeds=120, inner_ring=True, rim_blue=False):
    """A gold coin face: bevelled reeded rim, raised inner ring, slightly concave field"""
    a, d = disc(cx, cy, r)
    ang = np.arctan2(yy - cy, xx - cx)
    rn = d / r
    # field: radial dish (lighter at the top-left, darker bottom-right)
    lit = -(np.cos(ang + np.pi * 0.75)) * 0.5 + 0.5  # 1 toward top-left
    field = field_tone + 0.18 * (lit - 0.5) * rn + 0.06 * (1 - rn)
    # fine concentric lathe lines
    field += 0.012 * np.sin(rn * 420)
    col = ramp(field, GOLD)
    # rim band
    rim_in = 1 - rim
    band = np.clip((rn - rim_in) / 0.012, 0, 1)
    rim_light = 0.5 + 0.42 * np.cos(ang + np.pi * 0.75) * (1 - 2 * (rn > (rim_in + 1) / 2))  # bevel: outer slope lit opposite to inner slope
    rim_t = 0.55 + 0.30 * np.cos(ang + np.pi * 0.75) * np.where(rn > (1 + rim_in) / 2, -1, 1) + 0.05 * np.sin(ang * reeds) * (rn > 0.965)
    col = lerp(col, ramp(rim_t, GOLD), band)
    if rim_blue:
        # the rim (not the ridged outer edge) in one even Studyboard blue, with a gentle highlight along its middle
        edge_r = 0.955
        rb = np.clip((rn - rim_in) / 0.006, 0, 1) * np.clip((edge_r - rn) / 0.006, 0, 1)
        mid = (rim_in + edge_r) / 2
        bt = 0.30 + 0.08 * np.exp(-((rn - mid) / ((edge_r - rim_in) * 0.3)) ** 2) + 0.03 * np.cos(ang + np.pi * 0.75)
        col = lerp(col, ramp(bt, BLUE), rb)
        # thin gold lips where the blue meets the face and the edge
        lips = np.exp(-((rn - rim_in) / 0.004) ** 2) + np.exp(-((rn - edge_r) / 0.004) ** 2)
        col = lerp(col, ramp(0.74 + 0.18 * np.cos(ang + np.pi * 0.75), GOLD), np.clip(lips, 0, 1))
    if inner_ring:
        ring_r = rim_in - 0.05
        ring = np.exp(-((rn - ring_r) / 0.006) ** 2)
        ring_t = 0.7 + 0.25 * np.cos(ang + np.pi * 0.75)
        col = lerp(col, ramp(ring_t, GOLD), ring * 0.9)
        # dotted beads just inside the ring
        beads = (np.cos(ang * 72) > 0.6) * np.exp(-((rn - (ring_r - 0.035)) / 0.007) ** 2)
        col = lerp(col, ramp(np.full_like(rn, 0.85), GOLD), beads * 0.8)
    # dark outer edge line
    edge = np.exp(-((rn - 1) / 0.01) ** 2)
    col = lerp(col, np.array([80, 46, 4], np.float32) * np.ones_like(col), edge * 0.6)
    return over(img, col, a if alpha_mask is None else a * alpha_mask), a

def sparkle(img, x, y, size, k=1.0):
    dx = np.abs(xx - x); dy = np.abs(yy - y)
    star = np.clip(1 - (np.sqrt(dx) * np.sqrt(dy)) / (size * 0.18), 0, 1) * np.exp(-(dx + dy) / size)
    core = np.exp(-((dx ** 2 + dy ** 2) / (2 * (size * 0.08) ** 2)))
    a = np.clip(star * 1.4 + core, 0, 1) * k
    return over(img, np.array([255, 246, 214], np.float32), a)

def save(img, name):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").resize((OUT, OUT), Image.LANCZOS)
    im.save(f"{DEST}/{name}.png", optimize=True)

C = S / 2

# ---------- Concept 1: Classic gold coin ----------
img = background(glow=0.20, glow_r=0.36)
cs = drop_shadow(disc(C, C, S * 0.36)[0], 18, 34, 40, 0.75)
img = over(img, np.array([3, 10, 26], np.float32), cs)
img, coin = gold_face(C, C, S * 0.36, img, field_tone=0.40)
M, Bm = place_logo(1.12, C + 6, C + 4)
img = gold_logo(img, M, Bm, base=0.76)
img = sparkle(img, C + S * 0.24, C - S * 0.25, S * 0.05, 0.9)
save(img, "concept-1-classic-gold")
if "--blue-rim" in sys.argv:
    # the app icon's own navy (icon-1024.png: #15366B at the top left to #0E2B57 at the bottom right)
    img = background(c_top=(23, 58, 112), c_mid=(18, 49, 98), c_bot=(14, 42, 86), glow=0.06, glow_r=0.34, vig=0.06)
    img = over(img, np.array([3, 10, 26], np.float32), cs)
    img, coin = gold_face(C, C, S * 0.36, img, field_tone=0.40, rim_blue=True)
    img = gold_logo(img, M, Bm, base=0.76)
    img = sparkle(img, C + S * 0.24, C - S * 0.25, S * 0.05, 0.9)
    save(img, "concept-1-classic-gold-blue-rim")
    sys.exit(0)
if "--blue-book" in sys.argv:
    img = background(glow=0.20, glow_r=0.36)
    img = over(img, np.array([3, 10, 26], np.float32), cs)
    img, coin = gold_face(C, C, S * 0.36, img, field_tone=0.40)
    img = gold_logo(img, M, Bm, base=0.76, blue_book=True)
    img = sparkle(img, C + S * 0.24, C - S * 0.25, S * 0.05, 0.9)
    save(img, "concept-1-classic-gold-blue-book")
    sys.exit(0)

# ---------- Concept 2: Gold rim, Studyboard blue enamel centre ----------
img = background(glow=0.10, glow_col=(90, 150, 255), glow_r=0.40)
R2 = S * 0.37
cs = drop_shadow(disc(C, C, R2)[0], 16, 30, 40, 0.75)
img = over(img, np.array([2, 8, 22], np.float32), cs)
img, coin = gold_face(C, C, R2, img, field_tone=0.55, rim=0.20, inner_ring=False)
# enamel field
ea, ed = disc(C, C, R2 * 0.78, 2.0)
en_rn = ed / (R2 * 0.78)
en_t = np.clip(1 - en_rn, 0, 1)
enamel = lerp(np.array([12, 34, 76], np.float32) * np.ones((S, S, 1)), np.array([36, 92, 182], np.float32) * np.ones((S, S, 1)), np.clip(0.25 + 0.55 * (1 - np.clip(np.sqrt(((xx - C + R2 * 0.25) ** 2 + (yy - C + R2 * 0.3) ** 2)) / (R2 * 1.1), 0, 1)), 0, 1))
# inner shadow where the enamel sits below the rim
ish = np.clip(1 - blur(ea, 18) , 0, 1) * ea
enamel = enamel * (1 - 0.6 * ish)[..., None]
img = over(img, enamel, ea)
# gold lip around the enamel
lip = np.exp(-((ed - R2 * 0.78) / 5) ** 2)
ang = np.arctan2(yy - C, xx - C)
img = over(img, ramp(0.72 + 0.25 * np.cos(ang + np.pi * 0.75), GOLD), np.clip(lip, 0, 1))
M, Bm = place_logo(0.96, C + 6, C + 6)
img = gold_logo(img, M, Bm, base=0.68, on_gold=False)
# glossy highlight arc across the enamel
gl = np.exp(-(((xx - C + R2 * 0.18) / (R2 * 0.75)) ** 2 + ((yy - C + R2 * 0.42) / (R2 * 0.32)) ** 2) * 2.2) * ea
img = over(img, np.array([255, 255, 255], np.float32), gl * 0.16)
save(img, "concept-2-blue-enamel")

# ---------- Concept 3: Tilted coin with depth and sparkles ----------
img = background(c_top=(36, 84, 160), c_mid=(18, 52, 106), glow=0.24, glow_r=0.34)
face = np.full((S, S, 3), 0, np.float32)
face, fa = gold_face(C, C, S * 0.34, face, field_tone=0.42, rim=0.13)
M, Bm = place_logo(1.04, C + 6, C + 4)
face = gold_logo(face, M, Bm, base=0.76)
# squash vertically for a tilt, add a thick edge underneath
SQ = 0.86
def squash(arr):
    if arr.ndim == 2:
        im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    else:
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    nh = int(S * SQ)
    im = im.resize((S, nh), Image.LANCZOS)
    canvas = Image.new(im.mode, (S, S))
    canvas.paste(im, (0, (S - nh) // 2 - 40))
    a = np.asarray(canvas).astype(np.float32)
    return a / 255 if arr.ndim == 2 else a
faceS = squash(face); faS = squash(fa)
# edge: stack the squashed face mask downward with darker reeded gold
edge_a = np.zeros((S, S), np.float32); edge_c = np.zeros((S, S, 3), np.float32)
thick = 70
for i in range(thick, 0, -2):
    sh = np.roll(faS, i, 0)
    new = np.clip(sh - edge_a, 0, 1)
    ang = np.arctan2(yy - C, xx - C)
    reed = 0.5 + 0.5 * np.sin((xx - C) / (S * 0.34) * 60)
    t = 0.30 + 0.25 * np.clip(1 - np.abs(xx - C + S * 0.08) / (S * 0.36), 0, 1) + 0.06 * reed
    edge_c = edge_c + ramp(t, GOLD) * new[..., None]
    edge_a = np.clip(edge_a + new, 0, 1)
shadow = drop_shadow(np.clip(edge_a + faS, 0, 1), 10, 60, 50, 0.7)
img = over(img, np.array([3, 10, 26], np.float32), shadow)
img = over(img, edge_c / np.maximum(edge_a, 1e-4)[..., None], edge_a)
img = over(img, faceS, faS)
for (x, y, s, k) in [(0.80, 0.20, 0.07, 1.0), (0.17, 0.30, 0.045, 0.85), (0.85, 0.66, 0.035, 0.75), (0.26, 0.80, 0.03, 0.6)]:
    img = sparkle(img, S * x, S * y, S * s, k)
save(img, "concept-3-tilted-sparkle")
print("done")
