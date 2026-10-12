// ---- batch brazil: brazil (Rio de Janeiro)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other.
function brazil_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function brazil_pg(p) { return poly(brazil_area(p) < 0 ? p.slice().reverse() : p); }
function brazil_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function brazil_c(x, y, r) { return brazil_e(x, y, r, r); }
// a smooth curve through the control points (Catmull-Rom), n samples per span
function brazil_spline(c, n) { var out = [], i, k; for (i = 0; i < c.length - 1; i++) { var p0 = c[Math.max(0, i - 1)], p1 = c[i], p2 = c[i + 1], p3 = c[Math.min(c.length - 1, i + 2)];
  for (k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  out.push(c[c.length - 1]); return out; }
// a curve's height at x (the curve runs left to right); brazil_yIn gives Infinity where the curve does not reach
function brazil_yAt(p, x) { for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return p[x < p[0][0] ? 0 : p.length - 1][1]; }
function brazil_yIn(p, x) { return x < p[0][0] || x > p[p.length - 1][0] ? Infinity : brazil_yAt(p, x); }
function brazil_off(p, dy) { return p.map(function (q) { return [q[0], q[1] + dy]; }); }
// a tapering, gently curved limb from (x0, y0) to (x1, y1), w0 to w1 wide, bowed sideways by 'bend'
function brazil_limb(x0, y0, x1, y1, w0, w1, bend) { var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, A = [], B = [];
  for (var i = 0; i <= 10; i++) { var t = i / 10, b = Math.sin(Math.PI * t) * bend, cx = x0 + dx * t + nx * b, cy = y0 + dy * t + ny * b, w = (w0 + (w1 - w0) * t) / 2; A.push([cx + nx * w, cy + ny * w]); B.unshift([cx - nx * w, cy - ny * w]); }
  return brazil_pg(A.concat(B)); }
// a granite dome on a spreading foot: steep walls wl to the left and wr to the right of cx, the summit leaning 'lean' to the left.
// p shapes the shoulders, q the walls, foot is the share of the height taken by the forested foot. Left to right.
function brazil_dome(cx, base, top, wl, wr, lean, p, q, foot, n) { var out = [], h = base - top, hd = h * (1 - foot);
  for (var i = 0; i <= n; i++) { var u = -1.45 + 2.9 * i / n, a = Math.abs(u), y, t;
    if (a <= 1) y = top + hd * (1 - Math.pow(1 - Math.pow(a, p), q)); else { t = (a - 1) / 0.45; y = top + hd + (h - hd) * (1 - (1 - t) * (1 - t)); }
    out.push([cx + u * (u < 0 ? wl : wr) - lean * (1 - (y - top) / h), y]); }
  return out; }
// a leaf from its stalk (x, y) pointing at angle a (radians, y down): L long, w wide, curling sideways by 'bend'.
// kind 'm' monstera (deep slits), 'b' banana (long, torn to the rib), 'h' heart-shaped, 'f' fern or palm frond (comb of leaflets).
// Returns the blade and its veins.
function brazil_leaf(x, y, a, L, w, bend, kind, seed) { var A = [], B = [], V = '', n = kind === 'h' ? 22 : 44, i, ca = Math.cos(a), sa = Math.sin(a), rib = [];
  for (i = 0; i <= n; i++) { var t = i / n, wd;
    if (kind === 'b') wd = w * Math.min(1, t / 0.07) * (1 - Math.pow(t, 5)) * (0.9 + 0.1 * Math.sin(t * 9));
    else if (kind === 'f') wd = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (i % 2 ? 0.3 : 1) * (t < 0.05 ? 0 : 1);
    else wd = w * Math.pow(Math.sin(Math.PI * Math.pow(t, kind === 'h' ? 0.62 : 0.72)), 0.85) * (1 - 0.15 * t);
    var bo = bend * L * t * t, cx = x + ca * L * t - sa * bo, cy = y + sa * L * t + ca * bo, ta = a + Math.atan(2 * bend * t), nx = -Math.sin(ta), ny = Math.cos(ta);
    rib.push([cx, cy]);
    var wa = wd, wb = wd;
    if (kind === 'm' && t > 0.12 && t < 0.86) { if ((i + Math.floor(seed)) % 6 === 0) wa *= 0.22; if ((i + Math.floor(seed) + 3) % 6 === 0) wb *= 0.22; }
    if (kind === 'b' && t > 0.1 && t < 0.95) { if (hash(seed + i * 1.7) < 0.12) wa *= 0.08; if (hash(seed + i * 2.3) < 0.1) wb *= 0.08; }
    A.push([cx + nx * wa, cy + ny * wa]); B.unshift([cx - nx * wb, cy - ny * wb]); }
  V += pline(rib.slice(0, Math.floor(n * 0.92)));
  if (kind !== 'f') for (i = 4; i < n * 0.85; i += kind === 'h' ? 4 : 5) { var r = rib[i], q = rib[Math.min(n, i + 3)], d = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1, ux = (q[0] - r[0]) / d, uy = (q[1] - r[1]) / d, ww = w * 0.62 * Math.sin(Math.PI * i / n);
    V += seg(r[0], r[1], r[0] + (ux * 0.6 - uy) * ww, r[1] + (uy * 0.6 + ux) * ww) + seg(r[0], r[1], r[0] + (ux * 0.6 + uy) * ww, r[1] + (uy * 0.6 - ux) * ww); }
  return {d: brazil_pg(A.concat(B)), v: V}; }
// a palm frond from the crown (x, y) at angle a: an arching rib L long that droops under its own weight, leaflets w long
function brazil_frond(x, y, a, L, w, droop) { var A = [], B = [], n = 30, i, ca = Math.cos(a), sa = Math.sin(a);
  for (i = 0; i <= n; i++) { var t = i / n, px = x + ca * L * t, py = y + sa * L * t + droop * L * t * t, dx = ca, dy = sa + 2 * droop * t, d = Math.hypot(dx, dy), nx = -dy / d, ny = dx / d;
    var wd = w * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (i % 2 ? 0.28 : 1), hang = (i % 2 ? 0 : w * 0.45 * t);
    A.push([px + nx * wd, py + ny * wd + hang]); B.unshift([px - nx * wd, py - ny * wd + hang]); }
  return brazil_pg(A.concat(B)); }
// the toco toucan, standing at (x, y) facing right, s about a sixtieth of its height. Parts by colour, for the still scene and the engine.
function brazil_toucanParts(x, y, s) { var P = function (u, v) { return [x + u * s, y + v * s]; }, el = function (cx, cy, rx, ry, rot) { var pts = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2, u = Math.cos(t) * rx, v = Math.sin(t) * ry; pts.push(P(cx + u * Math.cos(rot) - v * Math.sin(rot), cy + u * Math.sin(rot) + v * Math.cos(rot))); } return brazil_pg(pts); };
  var tail = brazil_pg([P(-9, -10), P(-2, -6), P(-6, 22), P(-14, 21)]);
  var body = el(-3, -20, 10.5, 17, -0.32) + el(1, -37, 9.4, 9) + tail;
  var bib = el(5.4, -31, 6.6, 8.6, -0.25);
  var beak = 'M' + PT.apply(null, P(8, -45.5)) + ' Q' + PT.apply(null, P(26, -49.5)) + ' ' + PT.apply(null, P(45, -37)) + ' Q' + PT.apply(null, P(46, -34.5)) + ' ' + PT.apply(null, P(43, -34)) + ' Q' + PT.apply(null, P(26, -31.5)) + ' ' + PT.apply(null, P(8, -33)) + ' Z ';
  var tip = 'M' + PT.apply(null, P(37, -41)) + ' Q' + PT.apply(null, P(42, -40)) + ' ' + PT.apply(null, P(45, -37)) + ' Q' + PT.apply(null, P(46, -34.5)) + ' ' + PT.apply(null, P(43, -34)) + ' Q' + PT.apply(null, P(39, -33.6)) + ' ' + PT.apply(null, P(36.4, -33.6)) + ' Z ';
  return {body: body, bib: bib, beak: beak, tip: tip, eye: brazil_c(x + 4.6 * s, y - 39 * s, 3.8 * s), pupil: brazil_c(x + 5 * s, y - 39 * s, 1.5 * s), vent: el(-6, -5, 5, 3.2, -0.3)}; }

// ---------------------------------------------------------------- Brazil
// Guanabara Bay in Rio de Janeiro: Sugarloaf's granite dome rising from the water with the cable car's wires running to it from
// the forested Morro da Urca, green granite hills with the city along their shore across the bay, a long curving golden beach,
// the black-and-white wave mosaic of the promenade, royal and coconut palms, beach umbrellas and a kiosk, and the rainforest
// framing the near corner with a toco toucan on a branch. The surf, the cable car, the boats, the birds, the umbrellas, the
// palm crowns, the jungle leaves, the toucan and all the night lights are the engine's.
var brazil_C = {
  L: {glow: 'rgba(255,246,222,0.22)', far: '#A6C8DE', haze: 'rgba(246,250,248,0.55)',
    nit: '#9EC0D2', ridge: '#7FA894', rock: '#A9AAB2', hill: '#5F9A5A', clump: '#528E54', loaf: '#A6A8B2', lshade: '#868B9A', lveg: '#5E9656', streak: 'rgba(74,78,96,0.34)', star: 'rgba(255,255,255,0)',
    land: '#4E9150', dgreen: '#438449', wall: '#FBF6EC', tint: '#F4C9A2', water: '#3F9CC6', sand: '#F3D498', wet: '#E3BC80', ink: '#4E5468', shine: 'rgba(255,255,255,0.75)', wire: 'rgba(44,44,56,0.75)',
    walk: '#F8F5EE', mosaic: '#2C2B32', wood: '#B09C86', dleaf: '#2E6A3E', leaf: '#4E9C48', warm: '#E8562E', nk: '#24222C', lite: '#FFF4D6', vein: 'rgba(210,255,190,0.45)', line: 'rgba(70,52,40,0.4)'},
  D: {glow: 'rgba(170,150,230,0.16)', far: '#2E3466', haze: 'rgba(110,90,160,0.3)',
    nit: '#2C3264', ridge: '#24345A', rock: '#4A4E70', hill: '#1E3448', clump: '#1A2E40', loaf: '#4C5072', lshade: '#3A3D5E', lveg: '#1E3446', streak: 'rgba(14,16,40,0.4)', star: 'rgba(255,246,226,0.85)',
    land: '#1A3044', dgreen: '#132436', wall: '#8E8CAA', tint: '#7E6E8E', water: '#24356A', sand: '#8A7A86', wet: '#6E6276', ink: '#1A1A30', shine: 'rgba(190,200,255,0.3)', wire: 'rgba(200,200,230,0.4)',
    walk: '#6A6A88', mosaic: '#1E1E34', wood: '#4E3E4A', dleaf: '#10241E', leaf: '#1E3E30', warm: '#A8403A', nk: '#100E1A', lite: '#FFE6A6', vein: 'rgba(160,220,180,0.18)', line: 'rgba(10,8,24,0.45)'}
};
SCENES.brazil = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = brazil_C[dk ? 'D' : 'L'], i, k, x, y;
  var S = ph ? Math.min(1, W / 390) * 0.78 : Math.max(0.6, Math.min(1.15, H / 800));
  var sky = dk ? 'linear-gradient(180deg,#0C1838 0%,#1E2C5E 46%,#6A3A5E 78%,#4A3058 100%)' : 'linear-gradient(180deg,#7CC6F0 0%,#D4EEF8 48%,#FCE8C4 76%,#F8E0B8 100%)';
  var hz = H * (ph ? 0.565 : 0.6), moon = [W * (ph ? 0.22 : 0.47), H * (ph ? 0.16 : 0.2), (ph ? 20 : 28) * (ph ? 1 : S)];
  // ---- far: a soft glow and the haze over the water
  add(far, 'a', brazil_e(dk ? moon[0] : W * 0.62, dk ? moon[1] : H * 0.32, W * (ph ? 0.5 : 0.3), H * 0.18), C.glow);
  add(far, 'c', brazil_e(W * 0.5, hz - H * 0.012, W * 0.75, H * 0.035), C.haze);
  // ---- the hills of Niteroi across the mouth of the bay, low and pale
  var NIT = brazil_spline(ph ? [[W * 0.3, hz + 1], [W * 0.5, H * 0.535], [W * 0.66, H * 0.548], [W * 0.86, H * 0.53], [W + 60, H * 0.545]] : [[W * 0.36, hz + 1], [W * 0.46, H * 0.56], [W * 0.58, H * 0.548], [W * 0.7, H * 0.565], [W * 0.86, H * 0.535], [W * 0.95, H * 0.552], [W + 60, H * 0.54]], 8);
  add(bg, 'a', brazil_pg(NIT.concat([[W + 60, hz + 2], [NIT[0][0], hz + 2]])), C.nit);
  // ---- the granite hills on the left: a high ridge with bare rock faces, and a forested hill in front of it
  var RG = brazil_spline(ph ? [[-60, H * 0.27], [W * 0.05, H * 0.24], [W * 0.13, H * 0.27], [W * 0.2, H * 0.26], [W * 0.3, H * 0.36], [W * 0.4, H * 0.45], [W * 0.48, H * 0.52], [W * 0.54, hz + 1]]
    : [[-60, H * 0.23], [W * 0.04, H * 0.2], [W * 0.1, H * 0.25], [W * 0.165, H * 0.175], [W * 0.205, H * 0.16], [W * 0.255, H * 0.235], [W * 0.32, H * 0.35], [W * 0.39, H * 0.43], [W * 0.46, H * 0.51], [W * 0.53, hz + 1]], 8);
  add(bg, 'b', brazil_pg(RG.concat([[RG[RG.length - 1][0], hz + 2], [-60, hz + 2]])), C.ridge);
  // bare granite where the ridge is steepest, streaked and ragged at the lower edge
  var rock = '';
  (ph ? [[W * 0.0, W * 0.2, 0.09]] : [[W * 0.13, W * 0.29, 0.13], [W * 0.0, W * 0.08, 0.06]]).forEach(function (q, n) { var top = [], bot = [];
    for (x = q[0]; x <= q[1]; x += 4) { var u = (x - q[0]) / (q[1] - q[0]), taper = Math.pow(Math.sin(Math.PI * u), 0.6), yy = brazil_yAt(RG, x); top.push([x, yy - 1]);
      bot.unshift([x, yy + H * q[2] * taper * (0.55 + 0.45 * Math.abs(Math.sin(x * 0.07 + n))) + Math.sin(x * 0.5) * 3]); }
    rock += brazil_pg(top.concat(bot)); });
  add(bg, 'c', rock, C.rock);
  var FH = brazil_spline(ph ? [[-60, H * 0.4], [W * 0.1, H * 0.395], [W * 0.22, H * 0.44], [W * 0.32, H * 0.495], [W * 0.4, H * 0.54], [W * 0.45, hz + 2]]
    : [[-60, H * 0.37], [W * 0.05, H * 0.345], [W * 0.13, H * 0.39], [W * 0.22, H * 0.44], [W * 0.31, H * 0.49], [W * 0.39, H * 0.545], [W * 0.45, hz + 2]], 8);
  var hill = brazil_pg(FH.concat([[FH[FH.length - 1][0], hz + 2], [-60, hz + 2]]));
  // tree crowns along the hilltop and scattered down the slopes, darker clumps in the folds
  FH.forEach(function (p, n) { if (n % 2 === 0 && p[1] < hz - 14 * S) hill += brazil_c(p[0], p[1] + 3 * S, (5 + hash(n + 0.3) * 6) * S); });
  add(bg, 'd', hill, C.hill);
  var clump = '';
  spread(-20, H * 0.2, W * (ph ? 0.55 : 0.55), hz - H * 0.2, (ph ? 16 : 22), (ph ? 14 : 18), rnd, 1).forEach(function (c) { var r = (4 + c.r * 7) * S, fy = brazil_yIn(FH, c.x), ry = brazil_yIn(RG, c.x);
    if (c.q < 0.6 && c.y > fy + r * 1.4 && c.y < hz - r) clump += brazil_c(c.x, c.y, r) + brazil_c(c.x + r * 0.9, c.y + r * 0.35, r * 0.75) + brazil_c(c.x - r * 0.8, c.y + r * 0.4, r * 0.65) + rect(c.x - r * 1.4, c.y + r * 0.3, r * 2.9, r * 0.7);
    else if (c.q < 0.12 && c.y > ry + r * 2 && c.y < fy - r && !(c.x > (ph ? 0 : W * 0.13) && c.x < (ph ? W * 0.2 : W * 0.29) && c.y < ry + H * 0.12)) clump += brazil_c(c.x, c.y, r * 0.8); });
  add(bg, 'e', clump, C.clump);
  // ---- Sugarloaf: the granite dome, shaded on its east side, streaked by rain, its foot and shoulder green with forest
  var sx = W * (ph ? 0.76 : 0.775), stop = H * (ph ? 0.245 : 0.1), wl = W * (ph ? 0.18 : 0.098), wr = W * (ph ? 0.22 : 0.122), sh = hz - stop, lean = (ph ? 10 : 18) * S;
  var LF = brazil_dome(sx, hz + 2, stop, wl, wr, lean, 2.3, 0.58, 0.17, ph ? 90 : 140);
  add(bg, 'f', brazil_pg(LF), C.loaf);
  var midX = function (yy) { return sx - lean * (1 - (yy - stop) / sh); }, half = function (yy, side) { var pts = side < 0 ? LF.slice(0, Math.ceil(LF.length / 2) + 1) : LF.slice(Math.floor(LF.length / 2)); var xx = side < 0 ? pts.reduce(function (m, p) { return p[1] <= yy && p[0] < m ? p[0] : m; }, midX(yy)) : pts.reduce(function (m, p) { return p[1] <= yy && p[0] > m ? p[0] : m; }, midX(yy)); return Math.abs(xx - midX(yy)); };
  var shade = [], inner = [];
  LF.forEach(function (p) { if (p[0] > midX(p[1]) + wr * 0.12) shade.push(p); });
  for (i = 20; i >= 0; i--) { var tt = i / 20, yy2 = stop + sh * 0.04 + (hz + 2 - stop - sh * 0.04) * tt; inner.push([midX(yy2) + wr * (0.14 + 0.3 * tt) + Math.sin(tt * 14) * wr * 0.025, yy2]); }
  add(bg, 'g', brazil_pg(shade.concat(inner)), C.lshade);
  // rain streaks down the faces, following the curve of the dome
  var streak = '';
  [-0.82, -0.66, -0.5, -0.36, -0.22, -0.1, 0.04, 0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.86].forEach(function (u, n) { var pts = [], y0 = stop + sh * (0.06 + Math.abs(u) * 0.22 + hash(n) * 0.06), y1 = stop + sh * (0.5 + hash(n + 3) * 0.28);
    for (y = y0; y < y1; y += 6) { var xx = midX(y) + u * half(y, u < 0 ? -1 : 1) * (0.94 - 0.05 * Math.abs(u)) + Math.sin(y * 0.05 + n) * 1.5; pts.push([xx, y]); }
    if (pts.length > 2) streak += pline(pts); });
  stk(bg, 's', streak, C.streak, ph ? 1.4 : 2.2);
  // the forest on the foot and up the eastern shoulder, and tufts of green in the cracks
  var vegY = function (xx) { var u = (xx - sx) / (xx < sx ? wl : wr); return hz - sh * (0.17 + 0.05 * Math.sin(xx * 0.06) + 0.03 * Math.sin(xx * 0.17) + (u > 0.35 ? 0.14 * Math.min(1, (u - 0.35) * 1.4) : 0)); }, vt = [], veg = '';
  for (x = LF[0][0]; x <= LF[LF.length - 1][0]; x += 4) { var oy = brazil_yAt(LF, x); vt.push([x, Math.max(oy, vegY(x)) + (oy < vegY(x) ? Math.abs(Math.sin(x * 0.33)) * 3 * S : 0)]); }
  veg += brazil_pg(vt.concat([[LF[LF.length - 1][0], hz + 3], [LF[0][0], hz + 3]]));
  for (k = 0; k < (ph ? 16 : 26); k++) { var vx = sx + (hash(k * 3.7) * 2 - 1) * wr * 0.8, vy = stop + sh * (0.2 + hash(k * 5.1) * 0.5); if (vy > brazil_yAt(LF, vx) + 8 * S && vy < vegY(vx)) veg += brazil_e(vx, vy, (3 + hash(k) * 5) * S, (1.6 + hash(k + 1) * 2) * S); }
  add(bg, 'h', veg, C.lveg);
  if (dk) { var stars = ''; spread(0, 0, W, hz * 0.85, 40, 36, rnd, 1).forEach(function (c) { var hy = Math.min(brazil_yIn(RG, c.x), brazil_yIn(LF, c.x), brazil_yIn(NIT, c.x));
    if (c.q < 0.5 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] * 2.4 && c.y < hy - 8) stars += seg(c.x, c.y, c.x + 0.1, c.y); }); stk(bg, 't', stars, C.star, 1.5 + rnd()); }

  // ---- mid: Morro da Urca, the city along the far shore, the cable car, the water and the beach
  var land = '', dgreen = '', wall = '', tint = '', water = '', sand = '', ink = '', wet = '', shine = '', wire = '';
  var ux = W * (ph ? 0.47 : 0.6), utop = H * (ph ? 0.455 : 0.43), UR = brazil_dome(ux, hz + 2, utop, W * (ph ? 0.2 : 0.11), W * (ph ? 0.15 : 0.085), -6 * S, 2.6, 0.85, 0.3, ph ? 60 : 90);
  land += brazil_pg(UR);
  UR.forEach(function (p, n) { if (n % 3 === 0 && p[1] < hz - 10 * S) land += brazil_c(p[0], p[1] + 4 * S, (5 + hash(n + 9) * 5) * S); });
  spread(UR[0][0], utop, UR[UR.length - 1][0] - UR[0][0], hz - utop, 14 * S + 6, 12 * S + 4, rnd, 1).forEach(function (c) { var r = (3 + c.r * 5) * S; if (c.q < 0.55 && c.y > brazil_yAt(UR, c.x) + r * 1.6 && c.y < hz - r * 0.5) dgreen += brazil_c(c.x, c.y, r) + brazil_c(c.x + r * 0.85, c.y + r * 0.3, r * 0.7) + brazil_c(c.x - r * 0.8, c.y + r * 0.35, r * 0.6); });
  // the horizon the moon, the sunset and the clouds stay behind
  var horizon = [];
  for (x = -60; x <= W + 60; x += 6) horizon.push([x, Math.min(hz, brazil_yIn(RG, x), brazil_yIn(FH, x), brazil_yIn(LF, x), brazil_yIn(UR, x), brazil_yIn(NIT, x)) + 1]);
  // the cable car stations, on the top of Urca and on Sugarloaf's summit, and the two wires between them
  var s1x = ux + W * (ph ? 0.03 : 0.025), s1y = brazil_yAt(UR, s1x) + 2 * S, s2x = midX(stop + sh * 0.03) - wl * 0.18, s2y = brazil_yAt(LF, s2x) + 3 * S, bs = (ph ? 0.75 : 1) * S;
  wall += rect(s1x - 15 * bs, s1y - 12 * bs, 30 * bs, 12 * bs) + rect(s2x - 12 * bs, s2y - 10 * bs, 24 * bs, 10 * bs);
  ink += rect(s1x - 17 * bs, s1y - 14 * bs, 34 * bs, 2.4 * bs) + rect(s2x - 14 * bs, s2y - 12 * bs, 28 * bs, 2.4 * bs);
  var wins = [];
  [[s1x, s1y, 12], [s2x, s2y, 10]].forEach(function (q) { for (k = 0; k < 4; k++) { var wx = q[0] - q[2] * bs * 0.8 + k * q[2] * bs * 0.45; ink += rect(wx, q[1] - q[2] * bs * 0.7, 3 * bs, 3.6 * bs); wins.push([wx, q[1] - q[2] * bs * 0.7, 3 * bs, 3.6 * bs, 0.05 + k * 0.02]); } });
  var cab = {x1: s1x + 15 * bs, y1: s1y - 9 * bs, x2: s2x - 12 * bs, y2: s2y - 7 * bs}; cab.sag = Math.hypot(cab.x2 - cab.x1, cab.y2 - cab.y1) * 0.05;
  var cabAt = function (t, d) { return [cab.x1 + (cab.x2 - cab.x1) * t, cab.y1 + (cab.y2 - cab.y1) * t + cab.sag * 4 * t * (1 - t) + d]; }, cw = [], cw2 = [];
  for (i = 0; i <= 24; i++) { cw.push(cabAt(i / 24, 0)); cw2.push(cabAt(i / 24, 3 * bs)); }
  wire += pline(cw) + pline(cw2);
  // the city along the far shore: apartment blocks packed under the green hills, white and peach, rows of windows
  var cityEnd = ph ? W * 0.35 : W * 0.49, bx = -20, n2 = 0;
  while (bx < cityEnd) { var bw2 = (13 + hash(n2 * 1.3) * 22) * S, mul = 0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, bx / cityEnd))), bh = (14 + hash(n2 * 2.9) * 46) * S * mul + 8 * S, peach = hash(n2 * 4.1) < 0.35;
    if (bx + bw2 > UR[0][0] + 6 && ph) break;
    if (peach) tint += rect(bx, hz - bh, bw2, bh + 1); else wall += rect(bx, hz - bh, bw2, bh + 1);
    for (y = hz - bh + 4 * S; y < hz - 4 * S; y += 6 * S) for (x = bx + 3 * S; x < bx + bw2 - 4 * S; x += 5.2 * S) { ink += rect(x, y, 2.2 * S, 2.6 * S); if (hash(x * 0.37 + y * 0.11) < 0.35) wins.push([x, y, 2.2 * S, 2.6 * S, hash(x + y)]); }
    if (hash(n2 * 7.3) < 0.3) { var tx = bx + bw2 + 2 * S, th = (10 + hash(n2) * 8) * S; dgreen += brazil_limb(tx, hz, tx + 1 * S, hz - th, 1.6 * S, 1.2 * S, 0) + brazil_c(tx + 1 * S, hz - th, 4 * S); }
    bx += bw2 + (1 + hash(n2 * 5.7) * 3) * S; n2++; }
  // lights of the houses up the lower slopes of the hill (lit by the engine at night)
  var hillL = []; spread(0, H * 0.36, cityEnd * 0.85, hz - H * 0.36, 18 * S + 6, 12 * S + 6, rnd, 1).forEach(function (c) { if (c.q < 0.5 && c.y > brazil_yAt(FH, c.x) + 12 * S && c.y < hz - 30 * S) hillL.push([c.x, c.y, c.k]); });
  // houses and a waterfront at the foot of Urca
  for (x = UR[0][0] + 10 * S; x < UR[0][0] + (ph ? 50 : 90) * S; x += 13 * S) { var hh = (9 + hash(x) * 8) * S; if (hash(x + 2) < 0.5) tint += rect(x, hz - hh, 11 * S, hh + 1); else wall += rect(x, hz - hh, 11 * S, hh + 1); ink += rect(x + 3 * S, hz - hh + 3 * S, 2.4 * S, 2.6 * S) + rect(x + 6.6 * S, hz - hh + 3 * S, 2.4 * S, 2.6 * S); wins.push([x + 3 * S, hz - hh + 3 * S, 2.4 * S, 2.6 * S, hash(x + 5)]); }
  ink += rect(-40, hz - 1, cityEnd + 40, 2.2 * S);
  // the bay, from the far shore to the beach
  var SH = brazil_spline(ph ? [[-60, H * 0.735], [W * 0.35, H * 0.76], [W * 0.7, H * 0.752], [W + 60, H * 0.72]] : [[-60, H * 0.765], [W * 0.2, H * 0.79], [W * 0.45, H * 0.8], [W * 0.7, H * 0.787], [W * 0.88, H * 0.757], [W + 60, H * 0.726]], 10);
  var waterPts = [[-60, hz], [W + 60, hz]].concat(SH.slice().reverse());
  water += rect(-60, hz, W + 120, H - hz + 40);
  spread(0, hz + 4, W, (H * 0.8 - hz) * 0.95, ph ? 40 : 64, 12, rnd, 1).forEach(function (c) { var l = (ph ? 6 : 10) + c.r * (ph ? 12 : 26) * (0.5 + (c.y - hz) / (H * 0.2)); if (c.q < 0.55 && c.y < brazil_yAt(SH, c.x) - 8 && c.y < brazil_yAt(SH, c.x + l) - 8) shine += seg(c.x, c.y, c.x + l, c.y); });
  // the beach: golden sand, a darker band of wet sand and a line of foam at the water's edge
  var sandW = H * (ph ? 0.075 : 0.085), PA = brazil_off(SH, sandW);
  sand += brazil_pg(SH.concat([[W + 60, H + 40], [-60, H + 40]]));
  wet += brazil_pg(SH.concat(brazil_off(SH, 6 * S).reverse()));
  shine += pline(brazil_off(SH, 1));
  // the umbrellas stand in the sand (the engine's), their shadows lie on it
  var umb = [];
  (ph ? [0.6, 0.74, 0.88] : [0.3, 0.4, 0.5, 0.66, 0.75, 0.85, 0.94]).forEach(function (q, n) { var ux2 = W * q + (hash(n) - 0.5) * 20 * S, uy = brazil_yAt(SH, ux2) + sandW * (0.45 + hash(n + 4) * 0.35), us = S * (ph ? 0.85 : 1) * (0.9 + (uy - H * 0.75) / H);
    wet += brazil_e(ux2 + 6 * us, uy + 2 * us, 22 * us, 5 * us); umb.push([ux2, uy, us, n]); });
  add(mid, 'a', land, C.land); add(mid, 'b', dgreen, C.dgreen); add(mid, 'c', wall, C.wall); add(mid, 'd', tint, C.tint); add(mid, 'e', water, C.water); add(mid, 'f', sand, C.sand); add(mid, 'g', ink, C.ink); add(mid, 'h', wet, C.wet);
  stk(mid, 's', shine, C.shine, ph ? 1 : 1.4); stk(mid, 't', wire, C.wire, Math.max(0.8, 1.1 * S));

  // ---- near: the mosaic promenade, palms, lamps, the kiosk and the rainforest corner
  var walk = '', mosaic = '', wood = '', dleaf = '', leaf = '', warm = '', nk = '', lite = '', vein = '', line = '';
  walk += brazil_pg(PA.concat([[W + 60, H + 40], [-60, H + 40]]));
  line += pline(PA);
  // the waves of the mosaic: black bands of stone running along the promenade, all in step, widening toward us
  var NB = ph ? 8 : 6, lam = (ph ? 52 : 66) * S;
  for (k = 0; k < NB; k++) { var top2 = [], bot2 = [], f0 = (k + 0.3) / NB, tk = (ph ? 6.4 : 5.6) * S * (0.8 + k * (ph ? 0.14 : 0.24)), amp = tk * 0.8;
    for (x = -60; x <= W + 60; x += 4) { var D = H + 6 - brazil_yAt(PA, x), yc = brazil_yAt(PA, x) + D * Math.pow(f0, 1.2) + amp * Math.sin(2 * Math.PI * x / lam); top2.push([x, yc - tk / 2]); bot2.unshift([x, yc + tk / 2]); }
    mosaic += brazil_pg(top2.concat(bot2)); }
  // lamps along the promenade
  var lamps = [], LX = ph ? [0.06, 0.3, 0.7, 0.99] : [0.04, 0.17, 0.43, 0.53, 0.72, 0.81];
  LX.forEach(function (q) { var lx = W * q, ly = brazil_yAt(PA, lx) + 7 * S, lh = (ph ? 40 : 54) * S;
    nk += rect(lx - 1.2 * S, ly - lh, 2.4 * S, lh) + rect(lx - 3 * S, ly - 5 * S, 6 * S, 5 * S) + rect(lx - 2.2 * S, ly - lh * 0.55, 4.4 * S, 2 * S) + rect(lx - 3.4 * S, ly - lh - 1.4 * S, 6.8 * S, 2.2 * S) + brazil_e(lx, ly - lh - 11.6 * S, 1.4 * S, 1.6 * S);
    lite += brazil_e(lx, ly - lh - 5.6 * S, 4 * S, 4.6 * S); lamps.push([lx, ly - lh - 5.6 * S, S]); });
  // the beach kiosk: a wooden counter under a striped roof, green coconuts on the counter, two stools
  var kx = W * (ph ? 0.43 : 0.62), ky = brazil_yAt(PA, kx) + (ph ? 22 : 26) * S, ks = (ph ? 0.8 : 1) * S;
  wood += rect(kx - 26 * ks, ky - 24 * ks, 52 * ks, 24 * ks);
  nk += rect(kx - 24 * ks, ky - 50 * ks, 48 * ks, 24 * ks) + rect(kx - 25 * ks, ky - 50 * ks, 2.4 * ks, 26 * ks) + rect(kx + 22.6 * ks, ky - 50 * ks, 2.4 * ks, 26 * ks);
  lite += rect(kx - 30 * ks, ky - 27 * ks, 60 * ks, 3.4 * ks);
  for (k = 0; k < 5; k++) line += seg(kx - 26 * ks, ky - 19 * ks + k * 4.6 * ks, kx + 26 * ks, ky - 19 * ks + k * 4.6 * ks);
  [-17, -10, 9, 16].forEach(function (q, n) { leaf += brazil_c(kx + q * ks, ky - 30.4 * ks, 3.6 * ks); if (n === 1) leaf += brazil_c(kx - 13.6 * ks, ky - 34.6 * ks, 3.4 * ks); });
  nk += seg(kx + 9 * ks, ky - 33 * ks, kx + 11 * ks, ky - 39 * ks);
  var roofP = [[kx - 35 * ks, ky - 49 * ks], [kx - 24 * ks, ky - 63 * ks], [kx + 24 * ks, ky - 63 * ks], [kx + 35 * ks, ky - 49 * ks]];
  warm += brazil_pg(roofP);
  for (k = 0; k < 7; k++) { if (k % 2) continue; var u0 = k / 7, u1 = (k + 1) / 7; lite += brazil_pg([[kx - 35 * ks + 70 * ks * u0, ky - 49 * ks], [kx - 24 * ks + 48 * ks * u0, ky - 63 * ks], [kx - 24 * ks + 48 * ks * u1, ky - 63 * ks], [kx - 35 * ks + 70 * ks * u1, ky - 49 * ks]]); }
  // the scalloped valance under the roof, in the roof's stripes
  for (k = 0; k < 7; k++) { var vc = brazil_e(kx - 35 * ks + (k + 0.5) * 10 * ks, ky - 49 * ks, 5 * ks, 4 * ks); if (k % 2) warm += vc; else lite += vc; }
  [[-34, 0], [32, 0]].forEach(function (q) { var sx2 = kx + q[0] * ks; nk += rect(sx2 - 1 * ks, ky - 12 * ks, 2 * ks, 12 * ks) + rrect(sx2 - 5 * ks, ky - 14 * ks, 10 * ks, 3 * ks, 1.4 * ks); });
  // a bunch of bananas hanging at the kiosk's corner
  for (k = 0; k < 4; k++) lite += brazil_e(kx + 26 * ks + (k % 2) * 2 * ks, ky - 44 * ks + k * 3 * ks, 1.6 * ks, 3.6 * ks);
  // palms on the promenade: tall royal palms on the right, two leaning coconut palms on the left (their crowns are the engine's)
  var palms = [];
  (ph ? [[0.62, 0.66, 1, 'c', 0.04], [0.9, 0.5, -1, 'r', 0]] : [[0.24, 0.6, -1, 'c', -0.05], [0.335, 0.665, 1, 'c', 0.035], [0.885, 0.4, 1, 'r', 0], [0.968, 0.34, -1, 'r', 0]]).forEach(function (q, n) {
    var px = W * q[0], py = brazil_yAt(PA, px) + 10 * S, cy = H * q[1], royal = q[3] === 'r', cx = px + (royal ? 0 : (py - cy) * q[4] * 2.6), pc = {x: cx, y: cy, royal: royal, fr: [], n: n};
    if (royal) { wood += brazil_limb(px, py, cx, cy + 34 * S, 15 * S, 10 * S, 3 * S * q[2]); leaf += brazil_limb(cx, cy + 36 * S, cx, cy + 2 * S, 10 * S, 8.4 * S, 0); line += seg(cx - 5 * S, cy + 34 * S, cx + 5 * S, cy + 34 * S); }
    else { var bnd = -q[2] * 26 * S, dx0 = cx - px, dy0 = cy + 4 * S - py, L1 = Math.hypot(dx0, dy0), nx0 = -dy0 / L1, ny0 = dx0 / L1; wood += brazil_limb(px, py, cx, cy + 4 * S, 13 * S, 8 * S, bnd);
      // the rings of the trunk
      for (k = 1; k < 14; k++) { var tt2 = k / 14, b2 = Math.sin(Math.PI * tt2) * bnd, rx2 = px + dx0 * tt2 + nx0 * b2, ry2 = py + dy0 * tt2 + ny0 * b2, ww = (13 - 5 * tt2) * S / 2; line += seg(rx2 - ww * 0.9, ry2, rx2 + ww * 0.9, ry2 + 1.2 * S); } }
    var L0 = (royal ? 74 : 62) * S * (ph ? 0.85 : 1), A0 = royal ? [-2.75, -2.25, -1.85, -1.45, -1.05, -0.62, -0.25, 0.4, 2.7] : [-3.0, -2.5, -2.0, -1.5, -1.05, -0.55, -0.1, 0.5, 2.6];
    A0.forEach(function (a, j) { var back = j % 2 === 1, Lf = L0 * (0.8 + hash(n * 9 + j) * 0.35) * (Math.abs(a + 1.57) > 1.3 ? 0.9 : 1); pc.fr.push({d: brazil_frond(cx, cy, a, Lf, (royal ? 15 : 13) * S, royal ? 0.34 : 0.55), back: back, ph: hash(n * 7 + j) * 6.28}); });
    pc.nuts = royal ? '' : brazil_c(cx - 4 * S, cy + 6 * S, 4.2 * S) + brazil_c(cx + 4 * S, cy + 6.6 * S, 4.2 * S) + brazil_c(cx, cy + 10 * S, 4 * S);
    palms.push(pc); });
  // the rainforest in the near corner: banana and monstera leaves, philodendron hearts, a fern, heliconia, and the toucan's branch
  var J = [], jy = H, js = S * (ph ? 1.2 : 1);
  var JL = ph ? [[-20, jy - 6, -1.05, 170, 34, 0.1, 'b', 0], [-26, jy - 64, -0.48, 140, 28, 0.12, 'b', 1], [W * 0.1, jy + 8, -1.4, 110, 52, -0.1, 'm', 0], [W * 0.24, jy + 12, -0.86, 96, 46, 0.12, 'm', 1], [-10, H * 0.715, -0.15, 110, 15, 0.15, 'f', 1], [-24, H * 0.665, -0.3, 120, 24, 0.14, 'b', 0], [-16, H * 0.75, 0.25, 90, 30, 0.1, 'h', 1], [W * 0.33, jy + 6, -0.55, 64, 30, 0.1, 'h', 0], [W * 0.02, jy + 4, -0.75, 78, 36, -0.08, 'h', 1]]
    : [[-20, jy - 4, -1.0, 250, 46, 0.1, 'b', 0], [-30, jy - 80, -0.5, 210, 40, 0.12, 'b', 1], [W * 0.05, jy + 10, -1.36, 160, 72, -0.1, 'm', 0], [W * 0.15, jy + 18, -0.82, 136, 62, 0.12, 'm', 1], [-14, H * 0.77, -0.22, 150, 18, 0.16, 'f', 1], [W * 0.21, jy + 8, -0.5, 90, 42, 0.1, 'h', 0], [W * 0.005, jy + 6, -0.72, 110, 50, -0.08, 'h', 1], [-20, H * 0.6, 0.1, 120, 16, 0.2, 'f', 0]];
  JL.forEach(function (q, n) { var lf = brazil_leaf(q[0], q[1], q[2], q[3] * js, q[4] * js, q[5], q[6], n * 13 + 5); J.push({d: lf.d, v: lf.v, dark: !!q[7], pv: [q[0], q[1]], ph: hash(n * 3.3) * 6.28, amp: q[6] === 'f' ? 0.05 : 0.025}); });
  // heliconia: zigzag red bracts with yellow lips on an upright stem
  var hx = W * (ph ? 0.29 : 0.185), hy = jy + 4, hel = {stem: brazil_limb(hx, hy, hx - 4 * js, hy - (ph ? 110 : 150) * js, 3 * js, 2 * js, 4 * js), red: '', yel: '', pv: [hx, hy], ph: 1.3};
  for (k = 0; k < 5; k++) { var by = hy - (ph ? 40 : 55) * js - k * (ph ? 15 : 20) * js, bxx = hx - k * 0.8 * js, sd = k % 2 ? 1 : -1, bl = (20 - k * 2) * js;
    hel.red += brazil_pg([[bxx, by], [bxx + sd * bl, by - bl * 0.42], [bxx + sd * bl * 0.9, by - bl * 0.18], [bxx + sd * bl * 0.3, by + 2 * js]]); hel.yel += brazil_pg([[bxx + sd * bl, by - bl * 0.42], [bxx + sd * bl * 0.78, by - bl * 0.31], [bxx + sd * bl * 0.9, by - bl * 0.18]]); }
  var brA = [-30, H * (ph ? 0.69 : 0.8)], brB = [W * (ph ? 0.4 : 0.25), H * (ph ? 0.71 : 0.835)], branch = brazil_limb(brA[0], brA[1], brB[0], brB[1], 15 * js, 5 * js, -10 * js) + brazil_limb(brA[0] + (brB[0] - brA[0]) * 0.72, brA[1] + (brB[1] - brA[1]) * 0.72 - 3 * js, brB[0] - 6 * js, brB[1] - 34 * js, 5 * js, 2 * js, 4 * js);
  var brY = function (xx) { var t = (xx - brA[0]) / (brB[0] - brA[0]); return brA[1] + (brB[1] - brA[1]) * t - Math.sin(Math.PI * t) * 10 * js; };
  var tk2 = [W * (ph ? 0.2 : 0.13), 0, (ph ? 0.78 : 1.1) * S]; tk2[1] = brY(tk2[0]) - 5 * js;
  // a few leaves hanging into the top-right corner
  var JT = ph ? [] : [[W + 8, -8, 2.05, 130, 34, -0.08, 'm', 1], [W - 40, -12, 1.75, 104, 24, 0.12, 'b', 0], [W + 6, H * 0.06, 2.6, 90, 14, -0.15, 'f', 0]];
  JT.forEach(function (q, n) { var lf = brazil_leaf(q[0], q[1], q[2], q[3] * js, q[4] * js, q[5], q[6], n * 17 + 41); J.push({d: lf.d, v: lf.v, dark: !!q[7], pv: [q[0], q[1]], ph: hash(n * 5.1 + 2) * 6.28, amp: 0.03, top: true}); });
  if (!ANIM) {
    umb.forEach(function (u) { var s2 = u[2], top = u[1] - 34 * s2; nk += rect(u[0] - 0.9 * s2, top, 1.8 * s2, 34 * s2); var cn = brazil_pg([[u[0] - 24 * s2, top + 8 * s2], [u[0], top - 3 * s2], [u[0] + 24 * s2, top + 8 * s2]]); (u[3] % 2 ? warm += cn : lite += cn); });
    palms.forEach(function (p) { p.fr.forEach(function (f) { if (f.back) dleaf += f.d; else leaf += f.d; }); wood += p.nuts; });
    J.forEach(function (j) { if (j.dark) dleaf += j.d; else leaf += j.d; vein += j.v; });
    leaf += hel.stem; warm += hel.red; lite += hel.yel; wood += branch;
    var tp = brazil_toucanParts(tk2[0], tk2[1], tk2[2]); nk += tp.body; lite += tp.bib; warm += tp.beak + tp.vent;
    if (dk) lite += brazil_c(moon[0], moon[1], moon[2]); }
  add(near, 'a', walk, C.walk); add(near, 'b', mosaic, C.mosaic); add(near, 'c', wood, C.wood); add(near, 'd', dleaf, C.dleaf); add(near, 'e', leaf, C.leaf); add(near, 'f', warm, C.warm); add(near, 'g', nk, C.nk); add(near, 'h', lite, C.lite);
  stk(near, 's', vein, C.vein, 1.1); stk(near, 't', line, C.line, 1.2);
  if (ANIM) { ANIM.C = C; ANIM.S = S; ANIM.moon = moon; ANIM.horizon = horizon; ANIM.hz = hz; ANIM.water = waterPts; ANIM.SH = SH; ANIM.PA = PA; ANIM.sandW = sandW;
    ANIM.loaf = {x: sx, top: stop, wl: wl, wr: wr, lean: lean, body: LF}; ANIM.cab = cab; ANIM.cabS = bs; ANIM.wins = wins; ANIM.lamps = lamps; ANIM.umb = umb; ANIM.palms = palms;
    ANIM.jungle = J; ANIM.hel = hel; ANIM.branch = branch; ANIM.toucan = tk2; ANIM.brX = [W * (ph ? 0.08 : 0.06), W * (ph ? 0.3 : 0.2)]; ANIM.brY = [brA, brB, 10 * js];
    ANIM.forest = [W * (ph ? 0.02 : 0.04), W * (ph ? 0.35 : 0.36), H * (ph ? 0.36 : 0.32), H * (ph ? 0.5 : 0.5)]; ANIM.city = cityEnd; ANIM.hillL = hillL; ANIM.urca = [ux, utop]; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
