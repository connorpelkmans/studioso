"""Studyboard Bucks bill: a green bill with the exact Studyboard logo raised in the middle, drawn the same way as the gold
Studyboard Credits coin (build-resources/credits-art/render-coins.py): a bevelled metal-like face, a raised border and the
logo embossed from a height map. Everything is green, the book stripe a paler green.

The logo comes from icon-1024.png. Make its masks first (the same formula as the coin):
  mask = clip(max((R-28)/190, (B-118)/110), 0, 1) * alpha;  blue (the book stripe) = clip(((B-R)-70)/90, 0, 1) * mask
Then:  python3 render-bucks.py <dir with mask.npy and blue.npy> <out dir>
The face is kept plain (a bevelled border, one fine line, a lighter green circle and the logo) so it stays neat at icon size.
Writes bucks-bill-320.png (320 x 200, transparent around the bill) and bucks-bill.webp (the app's icon, 160 x 100)."""
import sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 2048, 1280          # drawn large, then scaled down for smooth edges
HERE, DEST = sys.argv[1], sys.argv[2]
mask0 = np.load(f"{HERE}/mask.npy")
blue0 = np.load(f"{HERE}/blue.npy")
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255

def lerp(a, b, t):
    return a + (b - a) * t[..., None]

def ramp(t, stops):
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

# The coin's GOLD ramp, in green: deep shadow to a pale mint highlight
GREEN = [(0.0, (6, 52, 22)), (0.22, (14, 92, 40)), (0.45, (34, 140, 64)), (0.62, (62, 178, 92)),
         (0.80, (128, 214, 146)), (0.93, (206, 242, 212)), (1.0, (240, 253, 242))]

def shade(height, light=(-0.62, -0.78), strength=1.0):
    gy, gx = np.gradient(height)
    return np.clip((-(gx * light[0] + gy * light[1])) * strength, -1, 1)

def over(dst, col, alpha):
    return dst * (1 - alpha[..., None]) + col * alpha[..., None]

def rrect(x0, y0, x1, y1, r, soft=1.5):
    """A rounded rectangle's coverage, and the signed distance inside it (positive inside)"""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    hx, hy = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    qx, qy = np.abs(xx - cx) - hx, np.abs(yy - cy) - hy
    outside = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2) + np.minimum(np.maximum(qx, qy), 0) - r
    return np.clip(-outside / soft + 0.5, 0, 1), -outside

def place_logo(height_px, cx, cy):
    ys, xs = np.where(mask0 > 0.05)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m, b = mask0[y0:y1, x0:x1], blue0[y0:y1, x0:x1]
    h, w = m.shape
    s = height_px / h
    nh, nw = int(round(h * s)), int(round(w * s))
    sz = lambda a: np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32) / 255
    M, Bm = np.zeros((H, W), np.float32), np.zeros((H, W), np.float32)
    top, left = int(cy - nh / 2), int(cx - nw / 2)
    M[top:top + nh, left:left + nw] = sz(m); Bm[top:top + nh, left:left + nw] = sz(b)
    return M, Bm

def green_logo(img, M, Bm, base=0.76, light=(-0.62, -0.78)):
    """Raised green logo, as the coin's gold_logo: bevelled from a blurred height map, the book stripe paler"""
    h = blur(M, 7) * 0.6 + blur(M, 2.5) * 0.4
    sh = shade(h * 60, light)
    ys = np.where(M > 0.05)[0]
    sheen = 1 - np.clip((yy - ys.min()) / max(ys.max() - ys.min(), 1), 0, 1)
    t = base + 0.18 * sheen - 0.08 + 0.42 * sh + 0.12 * Bm
    col = ramp(t, GREEN)
    edge = np.clip(M - blur(M, 2), 0, 1) * np.clip(sh * 2, 0, 1)
    col = col + np.array([220, 255, 228], np.float32) * (edge * 0.6)[..., None]
    shadow = blur(np.roll(np.roll(M, 12, 0), 9, 1), 9) * 0.75
    img = over(img, np.array([2, 30, 10], np.float32), np.clip(shadow * (1 - M), 0, 1))
    return over(img, col, M)

PAD, R = 40, 150
bill, din = rrect(PAD, PAD, W - PAD, H - PAD, R)
cxm, cym = W / 2, H / 2
light_dir = np.clip(1 - (xx / W * 0.55 + yy / H * 0.45), 0, 1)   # lit from the top left
# the field: an even face, gently lit from the top left (no lathe lines: at icon size they read as noise)
field = 0.40 + 0.12 * (light_dir - 0.5)
img = ramp(field, GREEN)
# the raised border: one clean bevel all the way round (lit on the top-left slopes, shaded on the bottom-right)
BAND = 96
band = np.clip((BAND - din) / 4, 0, 1)
outer = din < BAND / 2
bev = 0.58 + 0.26 * (light_dir - 0.5) * 2 * np.where(outer, 1, -1)
img = lerp(img, ramp(bev, GREEN), band)
# one fine raised line just inside the border (it stops short of the circle around the logo)
line = np.exp(-((din - (BAND + 34)) / 4) ** 2) * np.clip((np.sqrt((xx - cxm) ** 2 + (yy - cym) ** 2) - H * 0.455) / 6, 0, 1)
img = lerp(img, ramp(0.74 + 0.18 * (light_dir - 0.5) * 2, GREEN), line * 0.85)
# a slightly lighter green circle behind the logo, inside the fine line, with a crisp raised rim like the coin's
RC = H * 0.415
d = np.sqrt((xx - cxm) ** 2 + (yy - cym) ** 2)
disc_a = np.clip((RC - d) / 1.5 + 0.5, 0, 1)
# its field: lighter than the bill, a little lighter still toward the top left, with a soft inner shadow under the rim
inner = np.clip((RC - d) / 40, 0, 1)
img = lerp(img, ramp(0.50 + 0.10 * (light_dir - 0.5) - 0.06 * (1 - inner), GREEN), disc_a)
# the rim: a bevelled band (lit top left on its outer slope, bottom right on its inner one)
RW = 30
rb = np.clip((d - (RC - RW)) / 1.5, 0, 1) * disc_a
slope = np.where(d > RC - RW / 2, 1, -1)
img = lerp(img, ramp(0.62 + 0.26 * (light_dir - 0.5) * 2 * slope, GREEN), rb)
# a thin dark line where the rim meets the bill
img = lerp(img, np.array([6, 50, 20], np.float32) * np.ones_like(img), np.exp(-((d - RC) / 2.2) ** 2) * 0.55)
# the logo, raised, sized to sit well inside the circle; centred on its S (the cap's tassel hangs off to the right)
M, Bm = place_logo(RC * 1.56, cxm - RC * 0.05, cym + RC * 0.02)
img = green_logo(img, M, Bm, base=0.86)
# dark outer edge line
edge = np.exp(-(din / 4) ** 2)
img = lerp(img, np.array([4, 40, 16], np.float32) * np.ones_like(img), edge * 0.7)

rgba = np.dstack([np.clip(img, 0, 255), bill * 255]).astype(np.uint8)
big = Image.fromarray(rgba, "RGBA")
big.resize((320, 200), Image.LANCZOS).save(f"{DEST}/bucks-bill-320.png", optimize=True)
big.resize((160, 100), Image.LANCZOS).save(f"{DEST}/bucks-bill.webp", quality=86, method=6)
# A small fan of bills, for the big moments (the price on a buy sheet, Bucks arriving): one bill behind, tilted
fan = Image.new("RGBA", (W + 520, H + 620), (0, 0, 0, 0))
back = big.rotate(10, resample=Image.BICUBIC, expand=True)
bk = np.asarray(back).astype(np.float32); bk[..., :3] *= 0.82; back = Image.fromarray(bk.astype(np.uint8), "RGBA")
fan.alpha_composite(back, (40, 40))
fan.alpha_composite(big, (420, 520))
fan = fan.crop(fan.getbbox())
fan.resize((256, int(256 * fan.height / fan.width)), Image.LANCZOS).save(f"{DEST}/bucks-stack.webp", quality=86, method=6)
