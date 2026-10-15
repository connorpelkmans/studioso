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

// Christ the Redeemer on his pedestal, feet at (x, y), s about a fortieth of his height: robe, outstretched arms with hanging sleeves, head
function brazil_christ(x, y, s) { var P = function (u, v) { return [x + u * s, y + v * s]; };
  return rect(x - 4.6 * s, y - 8 * s, 9.2 * s, 8.4 * s) + rect(x - 5.6 * s, y - 9.4 * s, 11.2 * s, 1.8 * s)
    + brazil_pg([P(-3.7, -9.2), P(3.7, -9.2), P(3.1, -20), P(2.9, -28.6), P(-2.9, -28.6), P(-3.1, -20)])
    + brazil_pg([P(-17.6, -30.4), P(17.6, -30.4), P(18.2, -28.2), P(11.5, -27.6), P(3.4, -22.6), P(-3.4, -22.6), P(-11.5, -27.6), P(-18.2, -28.2)])
    + rect(x - 1.1 * s, y - 31.6 * s, 2.2 * s, 2 * s) + brazil_c(x, y - 33.4 * s, 2.5 * s); }
// a Brazilian flag w by h with its top-left corner at (x, y), for the still scene: the green field, the yellow rhombus with a hole
// for the blue globe (drawn counter-clockwise so it cuts the rhombus), and the globe; the white band is a stroke (b)
function brazil_flagParts(x, y, w, h) { var cx = x + w / 2, cy = y + h / 2, mx = w * 0.085, my = h * 0.12, r = h * 0.25, band = [];
  for (var i = 0; i <= 12; i++) { var a = -0.42 + 0.84 * i / 12; band.push([cx - w * 0.1 + Math.sin(a) * h * 0.62, cy + h * 0.52 - Math.cos(a) * h * 0.6]); }
  return {g: rect(x, y, w, h), y: brazil_pg([[x + mx, cy], [cx, y + my], [x + w - mx, cy], [cx, y + h - my]]) + ell(cx, cy, r, r), b: brazil_c(cx, cy, r), band: [-1, 0, 1].map(function (o) { return pline(brazil_off(band, o * h * 0.025).filter(function (p) { return Math.hypot(p[0] - cx, p[1] - cy) < r * 0.94; })); }).join('')}; }
// a favela climbing a hillside: rows of little houses stacked from the shore at hz up to the hill's edge (the curve HL), x0 to x1,
// each house in one of the bright colours (slots 0..6), flat slab roofs, windows, blue water tanks, rooftop laundry and stairways.
// No two houses overlap, so the colour slots can be drawn in any order.
function brazil_favela(HL, x0, x1, hz, s0, ph) { var O = {col: ['', '', '', '', '', '', ''], ink: '', line: '', wins: []}, row = 0, yb = hz, top = Infinity, xx;
  for (xx = x0; xx <= x1; xx += 4) top = Math.min(top, brazil_yAt(HL, xx));
  var lanes = ph ? [[x0 + (x1 - x0) * 0.42, 1.3]] : [[x0 + (x1 - x0) * 0.3, 1.3], [x0 + (x1 - x0) * 0.68, 4.1]];
  while (yb > top + 6 * s0 && row < 40) { var s = s0 * Math.max(0.72, 1 - row * 0.04), rowH = 19 * s, fr = (hz - yb) / Math.max(1, hz - top), x = x0 - hash(row * 3.7) * 12 * s, prev = -1, n = 0;
    var laneX = lanes.map(function (L) { return L[0] + Math.sin(row * 0.8 + L[1]) * 7 * s; });
    // the stairs up through this row
    laneX.forEach(function (lx) { for (var yy = yb - rowH + 0.6 * s; yy < yb - 0.6 * s; yy += 2.7 * s) if (yy > brazil_yAt(HL, lx) + 3 * s) O.col[0] += rect(lx - 3 * s, yy, 6 * s, 1.3 * s); });
    while (x < x1) { var w = (11 + hash(row * 13.1 + n * 7.7) * 12) * s, hv = hash(row * 5.3 + n * 2.9), kind = hash(row * 9.1 + n * 4.3);
      var hit = laneX.some(function (lx) { return x < lx + 4 * s && x + w > lx - 4 * s; });
      if (hit) { x += 3 * s; n++; continue; }
      var ground = Math.max(brazil_yAt(HL, x), brazil_yAt(HL, x + w)), extra = kind < 0.3 ? 6 : kind < 0.48 ? 6.4 : 2.4;
      var hmax = Math.min(rowH - extra * s, yb - ground - (extra + 2) * s);
      if (hmax < 7 * s || x + w > x1 + 6 * s) { x += w * 0.5; n++; continue; }
      // the favela thins out toward the hilltop, leaving green gaps between the houses
      if (hash(row * 7.9 + n * 1.9) > 1.15 - Math.max(0, fr - 0.3) * 1.5) { x += w * (0.6 + hv * 0.6); n++; continue; }
      var h = Math.max(7 * s, hmax * (0.72 + 0.28 * hv)), col = Math.floor(hash(row * 17.3 + n * 3.1) * 7); if (col === prev) col = (col + 3) % 7; prev = col;
      var ty = yb - h;
      O.col[col] += rect(x, ty, w, h + 0.6 * s);
      O.ink += rect(x - 0.8 * s, ty - 1.5 * s, w + 1.6 * s, 1.7 * s);
      // windows, a row per floor; the lowest floor may get a door instead of a window
      var floors = Math.max(1, Math.floor((h - 1.5 * s) / (6.6 * s))), nw = Math.max(1, Math.floor(w / (6.4 * s)));
      for (var f = 0; f < floors; f++) for (var j = 0; j < nw; j++) { var wx = x + (j + 0.5) * w / nw - 1.3 * s, wy = ty + 2.2 * s + f * 6.6 * s;
        if (f === floors - 1 && j === 0 && hash(row + n * 1.3) < 0.45 && wy + 3 * s < yb - 4.5 * s) { O.ink += rrect(wx - 0.2 * s, yb - 5 * s, 3 * s, 5 * s, 1.2 * s); continue; }
        O.ink += rrect(wx, wy, 2.6 * s, 3 * s, 0.6 * s); O.wins.push([wx, wy, 2.6 * s, 3 * s, hash(wx * 0.31 + wy * 0.17)]); }
      if (kind < 0.3) { var tw = 5.2 * s, tx = x + w * (0.25 + 0.5 * hv) - tw / 2; O.col[5] += rrect(tx, ty - 1.5 * s - 4 * s, tw, 4.2 * s, 1.4 * s); O.ink += rect(tx + 0.6 * s, ty - 5.9 * s, tw - 1.2 * s, 0.8 * s); }
      else if (kind < 0.48 && w > 15 * s) { var ly = ty - 5.2 * s; O.line += seg(x + 1.6 * s, ty - 1.5 * s, x + 1.6 * s, ly) + seg(x + w - 1.6 * s, ty - 1.5 * s, x + w - 1.6 * s, ly) + seg(x + 1.6 * s, ly, x + w - 1.6 * s, ly + 0.4 * s);
        for (var c2 = x + 3.4 * s; c2 < x + w - 4 * s; c2 += 3.4 * s) O.col[(col + 1 + Math.floor(hash(c2) * 6)) % 7] += rect(c2, ly + 0.3 * s, 2.2 * s, (1.8 + hash(c2 + 1) * 1.2) * s); }
      x += w + (hv < 0.3 ? 1.6 * s : 0.5 * s); n++; }
    yb -= rowH; row++; }
  return O; }

// ---------------------------------------------------------------- Brazil
// Rio de Janeiro from Copacabana: Corcovado's granite peak with Christ the Redeemer on its summit, a favela of bright little houses
// stacked up the green hill below it, Sugarloaf's dome over the bay with the cable car's wires from Morro da Urca, sailboats on
// the water, and a wide golden beach with surf, striped umbrellas, towels, a coconut kiosk, palms and the Brazilian flag on its
// pole, the rainforest framing the near corner with a toco toucan on a branch. The surf, the cable car, the boats, the birds, the
// umbrellas, the flag, the palm crowns, the jungle leaves, the toucan and all the night lights are the engine's.
var brazil_C = {
  L: {glow: 'rgba(255,246,222,0.22)', far: '#A6C8DE', haze: 'rgba(246,250,248,0.55)', water: '#3F9CC6',
    nit: '#9EC0D2', ridge: '#79A88C', rock: '#A9AAB2', hill: '#5F9A5A', clump: '#528E54', loaf: '#A6A8B2', lshade: '#868B9A', lveg: '#5E9656', streak: 'rgba(74,78,96,0.34)', star: 'rgba(255,255,255,0)',
    fav: ['#FFF9EE', '#F28A4E', '#F2708C', '#FFCB3A', '#2EC2AE', '#4A9CEA', '#A584E0'], ink: '#43465E', shine: 'rgba(255,255,255,0.75)', wire: 'rgba(44,44,56,0.7)',
    sand: '#F6D79A', wet: '#E6BE7E', wood: '#B09C86', dleaf: '#2E6A3E', leaf: '#3E9C4A', warm: '#E8462E', nk: '#1E2350', lite: '#FFD23A', vein: 'rgba(255,255,255,0.9)', line: 'rgba(70,52,40,0.4)'},
  D: {glow: 'rgba(170,150,230,0.16)', far: '#2E3466', haze: 'rgba(110,90,160,0.3)', water: '#24356A',
    nit: '#2C3264', ridge: '#22345A', rock: '#4A4E70', hill: '#1E3448', clump: '#1A2E40', loaf: '#4C5072', lshade: '#3A3D5E', lveg: '#1E3446', streak: 'rgba(14,16,40,0.4)', star: 'rgba(255,246,226,0.85)',
    fav: ['#A6A4C6', '#8A5866', '#8E5478', '#9A8452', '#357080', '#3A5A96', '#64549A'], ink: '#14152A', shine: 'rgba(190,200,255,0.3)', wire: 'rgba(200,200,230,0.4)',
    sand: '#8A7A86', wet: '#6E6276', wood: '#4E3E4A', dleaf: '#10241E', leaf: '#1E3E30', warm: '#A8403A', nk: '#100E1A', lite: '#E0B850', vein: 'rgba(230,230,250,0.75)', line: 'rgba(10,8,24,0.45)'}
};
SCENES.brazil = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = brazil_C[dk ? 'D' : 'L'], i, k, x, y;
  var S = ph ? Math.min(1, W / 390) * 0.78 : Math.max(0.6, Math.min(1.15, H / 800));
  var sky = dk ? 'linear-gradient(180deg,#0C1838 0%,#1E2C5E 46%,#6A3A5E 78%,#4A3058 100%)' : 'linear-gradient(180deg,#7CC6F0 0%,#D4EEF8 48%,#FCE8C4 76%,#F8E0B8 100%)';
  var hz = H * (ph ? 0.565 : 0.6), moon = [W * (ph ? 0.17 : 0.3), H * (ph ? 0.14 : 0.2), (ph ? 20 : 28) * (ph ? 1 : S)];
  // ---- far: a soft glow, the bay's water (its top edge hidden behind the hills) and the haze over it
  add(far, 'a', brazil_e(dk ? moon[0] : W * 0.62, dk ? moon[1] : H * 0.32, W * (ph ? 0.5 : 0.3), H * 0.18), C.glow);
  add(far, 'b', rect(-60, hz - 40, W + 120, H - hz + 100), C.water);
  add(far, 'c', brazil_e(W * 0.5, hz - H * 0.012, W * 0.75, H * 0.035), C.haze);
  // ---- the hills of Niteroi across the mouth of the bay, low and pale
  var NIT = brazil_spline(ph ? [[W * 0.5, hz + 1], [W * 0.6, H * 0.535], [W * 0.75, H * 0.548], [W * 0.9, H * 0.53], [W + 60, H * 0.545]] : [[W * 0.6, hz + 1], [W * 0.7, H * 0.56], [W * 0.8, H * 0.548], [W * 0.88, H * 0.565], [W * 0.95, H * 0.54], [W + 60, H * 0.55]], 8);
  add(bg, 'a', brazil_pg(NIT.concat([[W + 60, hz + 2], [NIT[0][0], hz + 2]])), C.nit);
  // ---- Corcovado: a steep granite peak with bare rock faces on its flanks, the long forested ridge running down to the left
  var RG = brazil_spline(ph ? [[-60, H * 0.33], [W * 0.08, H * 0.3], [W * 0.18, H * 0.255], [W * 0.27, H * 0.21], [W * 0.33, H * 0.188], [W * 0.37, H * 0.186], [W * 0.42, H * 0.205], [W * 0.49, H * 0.28], [W * 0.56, H * 0.37], [W * 0.64, H * 0.45], [W * 0.72, H * 0.52], [W * 0.8, hz + 1]]
    : [[-60, H * 0.31], [W * 0.08, H * 0.29], [W * 0.2, H * 0.33], [W * 0.32, H * 0.35], [W * 0.43, H * 0.31], [W * 0.51, H * 0.25], [W * 0.56, H * 0.205], [W * 0.585, H * 0.19], [W * 0.61, H * 0.193], [W * 0.635, H * 0.225], [W * 0.665, H * 0.31], [W * 0.7, H * 0.4], [W * 0.75, H * 0.5], [W * 0.8, hz + 1]], 8);
  add(bg, 'b', brazil_pg(RG.concat([[RG[RG.length - 1][0], hz + 2], [-60, hz + 2]])), C.ridge);
  var sum = RG.reduce(function (m, p) { return p[1] < m[1] ? p : m; }, [0, 1e9]);
  var rock = '';
  (ph ? [[W * 0.24, W * 0.47, 0.11]] : [[W * 0.5, W * 0.665, 0.14], [W * 0.42, W * 0.48, 0.04]]).forEach(function (q, n) { var top = [], bot = [];
    for (x = q[0]; x <= q[1]; x += 4) { var u = (x - q[0]) / (q[1] - q[0]), taper = Math.pow(Math.sin(Math.PI * u), 0.6), yy = brazil_yAt(RG, x); top.push([x, yy - 1]);
      bot.unshift([x, yy + H * q[2] * taper * (0.7 + 0.3 * Math.sin(x * 0.025 + n)) + Math.abs(Math.sin(x * 0.09)) * 5 * S]); }
    rock += brazil_pg(top.concat(bot)); });
  add(bg, 'c', rock, C.rock);
  // ---- Sugarloaf: the granite dome, shaded on its east side, streaked by rain, its foot and shoulder green with forest
  var sx = W * (ph ? 0.8 : 0.87), stop = H * (ph ? 0.29 : 0.13), wl = W * (ph ? 0.15 : 0.08), wr = W * (ph ? 0.19 : 0.1), sh = hz - stop, lean = (ph ? 10 : 16) * S;
  var LF = brazil_dome(sx, hz + 2, stop, wl, wr, lean, 2.3, 0.58, 0.17, ph ? 90 : 140);
  add(bg, 'd', brazil_pg(LF), C.loaf);
  var midX = function (yy) { return sx - lean * (1 - (yy - stop) / sh); }, half = function (yy, side) { var pts = side < 0 ? LF.slice(0, Math.ceil(LF.length / 2) + 1) : LF.slice(Math.floor(LF.length / 2)); var xx = side < 0 ? pts.reduce(function (m, p) { return p[1] <= yy && p[0] < m ? p[0] : m; }, midX(yy)) : pts.reduce(function (m, p) { return p[1] <= yy && p[0] > m ? p[0] : m; }, midX(yy)); return Math.abs(xx - midX(yy)); };
  var shade = [], inner = [];
  LF.forEach(function (p) { if (p[0] > midX(p[1]) + wr * 0.12) shade.push(p); });
  for (i = 20; i >= 0; i--) { var tt = i / 20, yy2 = stop + sh * 0.04 + (hz + 2 - stop - sh * 0.04) * tt; inner.push([midX(yy2) + wr * (0.14 + 0.3 * tt) + Math.sin(tt * 14) * wr * 0.025, yy2]); }
  add(bg, 'e', brazil_pg(shade.concat(inner)), C.lshade);
  var streak = '';
  [-0.82, -0.66, -0.5, -0.36, -0.22, -0.1, 0.04, 0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.86].forEach(function (u, n) { var pts = [], y0 = stop + sh * (0.06 + Math.abs(u) * 0.22 + hash(n) * 0.06), y1 = stop + sh * (0.5 + hash(n + 3) * 0.28);
    for (y = y0; y < y1; y += 6) { var xx = midX(y) + u * half(y, u < 0 ? -1 : 1) * (0.94 - 0.05 * Math.abs(u)) + Math.sin(y * 0.05 + n) * 1.5; pts.push([xx, y]); }
    if (pts.length > 2) streak += pline(pts); });
  stk(bg, 's', streak, C.streak, ph ? 1.4 : 2.2);
  var vegY = function (xx) { var u = (xx - sx) / (xx < sx ? wl : wr); return hz - sh * (0.17 + 0.05 * Math.sin(xx * 0.06) + 0.03 * Math.sin(xx * 0.17) + (u > 0.35 ? 0.14 * Math.min(1, (u - 0.35) * 1.4) : 0)); }, vt = [], veg = '';
  for (x = LF[0][0]; x <= LF[LF.length - 1][0]; x += 4) { var oy = brazil_yAt(LF, x); vt.push([x, Math.max(oy, vegY(x)) + (oy < vegY(x) ? Math.abs(Math.sin(x * 0.33)) * 3 * S : 0)]); }
  veg += brazil_pg(vt.concat([[LF[LF.length - 1][0], hz + 3], [LF[0][0], hz + 3]]));
  for (k = 0; k < (ph ? 16 : 26); k++) { var vx = sx + (hash(k * 3.7) * 2 - 1) * wr * 0.8, vy = stop + sh * (0.2 + hash(k * 5.1) * 0.5); if (vy > brazil_yAt(LF, vx) + 8 * S && vy < vegY(vx)) veg += brazil_e(vx, vy, (3 + hash(k) * 5) * S, (1.6 + hash(k + 1) * 2) * S); }
  // ---- Morro da Urca in front of Sugarloaf, forested (in the same green as Sugarloaf's foot)
  var ux = W * (ph ? 0.6 : 0.735), utop = H * (ph ? 0.46 : 0.44), UR = brazil_dome(ux, hz + 2, utop, W * (ph ? 0.16 : 0.075), W * (ph ? 0.12 : 0.06), -6 * S, 2.6, 0.85, 0.3, ph ? 60 : 90);
  veg += brazil_pg(UR);
  UR.forEach(function (p, n) { if (n % 3 === 0 && p[1] < hz - 10 * S) veg += brazil_c(p[0], p[1] + 4 * S, (5 + hash(n + 9) * 5) * S); });
  add(bg, 'f', veg, C.lveg);
  // ---- the favela's hill in front of Corcovado, green, with tree crowns along its top
  var FH = brazil_spline(ph ? [[-60, H * 0.395], [W * 0.1, H * 0.385], [W * 0.22, H * 0.41], [W * 0.34, H * 0.455], [W * 0.45, H * 0.51], [W * 0.53, hz + 2]]
    : [[-60, H * 0.345], [W * 0.05, H * 0.325], [W * 0.13, H * 0.34], [W * 0.23, H * 0.38], [W * 0.33, H * 0.42], [W * 0.43, H * 0.47], [W * 0.51, H * 0.53], [W * 0.57, hz + 2]], 8);
  var hill = brazil_pg(FH.concat([[FH[FH.length - 1][0], hz + 2], [-60, hz + 2]]));
  FH.forEach(function (p, n) { if (n % 2 === 0 && p[1] < hz - 14 * S) hill += brazil_c(p[0], p[1] + 3 * S, (5 + hash(n + 0.3) * 6) * S); });
  add(bg, 'g', hill, C.hill);
  var clump = '';
  spread(-20, H * 0.2, W * 0.75, hz - H * 0.2, (ph ? 16 : 22), (ph ? 14 : 18), rnd, 1).forEach(function (c) { var r = (4 + c.r * 7) * S, fy = brazil_yIn(FH, c.x), ry = brazil_yIn(RG, c.x);
    if (c.q < 0.5 && c.y > fy + r * 1.4 && c.y < hz - r) clump += brazil_c(c.x, c.y, r) + brazil_c(c.x + r * 0.9, c.y + r * 0.35, r * 0.75) + brazil_c(c.x - r * 0.8, c.y + r * 0.4, r * 0.65);
    else if (c.q < 0.14 && c.y > ry + r * 2 && c.y < fy - r && c.y > ry + H * 0.1) clump += brazil_c(c.x, c.y, r * 0.8); });
  spread(UR[0][0], utop, UR[UR.length - 1][0] - UR[0][0], hz - utop, 14 * S + 6, 12 * S + 4, rnd, 1).forEach(function (c) { var r = (3 + c.r * 5) * S; if (c.q < 0.55 && c.y > brazil_yAt(UR, c.x) + r * 1.6 && c.y < hz - r * 0.5) clump += brazil_c(c.x, c.y, r) + brazil_c(c.x + r * 0.85, c.y + r * 0.3, r * 0.7) + brazil_c(c.x - r * 0.8, c.y + r * 0.35, r * 0.6); });
  // the forest on Corcovado's ridge: tree crowns along its outline and clumps of canopy down its slopes (not on the bare
  // granite faces, nor near the summit's statue)
  var bare = (ph ? [[W * 0.24, W * 0.47, 0.11]] : [[W * 0.5, W * 0.665, 0.14], [W * 0.42, W * 0.48, 0.04]]), onRock = function (x2, y2) { return bare.some(function (q) { return x2 > q[0] - 4 * S && x2 < q[1] + 4 * S && y2 < brazil_yAt(RG, x2) + H * q[2] + 8 * S; }); };
  var crowns = ''; RG.forEach(function (p, n) { if (n % 2 || p[0] > W * (ph ? 0.5 : 0.68) || Math.abs(p[0] - sum[0]) < 40 * S || onRock(p[0], p[1] + 2) || p[1] > hz - 10 * S) return; crowns += brazil_c(p[0], p[1] + 3 * S, (4 + hash(n + 0.7) * 5) * S); });
  add(bg, 'b', crowns);
  spread(-20, H * 0.15, W * (ph ? 0.5 : 0.68), hz - H * 0.15, (ph ? 14 : 18), (ph ? 12 : 14), rnd, 1).forEach(function (c) { var r = (3 + c.r * 5) * S, ry = brazil_yIn(RG, c.x), fy = brazil_yIn(FH, c.x);
    if (c.q < 0.45 && c.y > ry + r * 1.6 && c.y < Math.min(fy, hz) - r * 0.5 && !onRock(c.x, c.y) && Math.hypot(c.x - sum[0], c.y - sum[1]) > 50 * S) clump += brazil_c(c.x, c.y, r) + brazil_c(c.x + r * 0.8, c.y + r * 0.3, r * 0.7) + brazil_c(c.x - r * 0.75, c.y + r * 0.35, r * 0.6); });
  add(bg, 'h', clump, C.clump);
  if (dk) { var stars = ''; spread(0, 0, W, hz * 0.85, 40, 36, rnd, 1).forEach(function (c) { var hy = Math.min(brazil_yIn(RG, c.x), brazil_yIn(LF, c.x), brazil_yIn(NIT, c.x));
    if (c.q < 0.5 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] * 2.4 && c.y < hy - 8 && Math.hypot(c.x - sum[0], c.y - sum[1]) > 50 * S) stars += seg(c.x, c.y, c.x + 0.1, c.y); }); stk(bg, 't', stars, C.star, 1.5 + rnd()); }
  var horizon = [];
  for (x = -60; x <= W + 60; x += 6) horizon.push([x, Math.min(hz, brazil_yIn(RG, x), brazil_yIn(FH, x), brazil_yIn(LF, x), brazil_yIn(UR, x), brazil_yIn(NIT, x)) + 1]);

  // ---- mid: Christ the Redeemer, the favela, the cable car stations and wires, the glints on the bay
  var ink = '', shine = '', wire = '';
  var cs = (ph ? 1.35 : 1.8) * S, christ = [sum[0], sum[1] + 2.2 * cs, cs], fav = C.fav.map(function () { return ''; });
  if (!ANIM) fav[0] += brazil_christ(christ[0], christ[1], cs) + brazil_pg([[sum[0] - 8 * cs, sum[1] + 4 * cs], [sum[0] + 8 * cs, sum[1] + 4 * cs], [sum[0] + 6 * cs, sum[1] + 0.5 * cs], [sum[0] - 6 * cs, sum[1] + 0.5 * cs]]);
  var favEnd = ph ? W * 0.5 : W * 0.545, FV = brazil_favela(FH, -14, favEnd, hz - 1.5 * S, (ph ? 1.3 : 1.65) * S, ph), wins = FV.wins;
  if (!ANIM) { FV.col.forEach(function (d, n) { fav[n] += d; }); ink += FV.ink; wire += FV.line; }
  // the sea wall along the shore under the favela
  ink += rect(-40, hz - 1.6 * S, favEnd + 40, 2.4 * S);
  // the cable car stations, on the top of Urca and on Sugarloaf's summit, and the two wires between them
  var s1x = ux + W * (ph ? 0.03 : 0.015), s1y = brazil_yAt(UR, s1x) + 2 * S, s2x = midX(stop + sh * 0.03) - wl * 0.18, s2y = brazil_yAt(LF, s2x) + 3 * S, bs = (ph ? 0.75 : 1) * S;
  if (!ANIM) fav[0] += rect(s1x - 15 * bs, s1y - 12 * bs, 30 * bs, 12 * bs) + rect(s2x - 12 * bs, s2y - 10 * bs, 24 * bs, 10 * bs);
  if (!ANIM) ink += rect(s1x - 17 * bs, s1y - 14 * bs, 34 * bs, 2.4 * bs) + rect(s2x - 14 * bs, s2y - 12 * bs, 28 * bs, 2.4 * bs);
  if (!ANIM) [[s1x, s1y, 12], [s2x, s2y, 10]].forEach(function (q) { for (k = 0; k < 4; k++) { var wx = q[0] - q[2] * bs * 0.8 + k * q[2] * bs * 0.45; ink += rect(wx, q[1] - q[2] * bs * 0.7, 3 * bs, 3.6 * bs); wins.push([wx, q[1] - q[2] * bs * 0.7, 3 * bs, 3.6 * bs, 0.05 + k * 0.02]); } });
  var cab = {x1: s1x + 15 * bs, y1: s1y - 9 * bs, x2: s2x - 12 * bs, y2: s2y - 7 * bs}; cab.sag = Math.hypot(cab.x2 - cab.x1, cab.y2 - cab.y1) * 0.05;
  var cabAt = function (t, d) { return [cab.x1 + (cab.x2 - cab.x1) * t, cab.y1 + (cab.y2 - cab.y1) * t + cab.sag * 4 * t * (1 - t) + d]; }, cw = [], cw2 = [];
  for (i = 0; i <= 24; i++) { cw.push(cabAt(i / 24, 0)); cw2.push(cabAt(i / 24, 3 * bs)); }
  if (!ANIM) wire += pline(cw) + pline(cw2);
  // the bay, from the far shore to the beach
  var SH = brazil_spline(ph ? [[-60, H * 0.715], [W * 0.35, H * 0.735], [W * 0.7, H * 0.728], [W + 60, H * 0.7]] : [[-60, H * 0.75], [W * 0.2, H * 0.772], [W * 0.45, H * 0.78], [W * 0.7, H * 0.77], [W * 0.88, H * 0.745], [W + 60, H * 0.72]], 10);
  var waterPts = [[-60, hz], [W + 60, hz]].concat(SH.slice().reverse());
  spread(0, hz + 4, W, (H * 0.78 - hz) * 0.95, ph ? 40 : 64, 12, rnd, 1).forEach(function (c) { var l = (ph ? 6 : 10) + c.r * (ph ? 12 : 26) * (0.5 + (c.y - hz) / (H * 0.2)); if (c.q < 0.55 && c.y < brazil_yAt(SH, c.x) - 8 && c.y < brazil_yAt(SH, c.x + l) - 8) shine += seg(c.x, c.y, c.x + l, c.y); });
  "abcdefg".split("").forEach(function (key, n) { add(mid, key, fav[n], C.fav[n]); }); add(mid, 'h', ink, C.ink);
  stk(mid, 's', shine, C.shine, ph ? 1 : 1.4); stk(mid, 't', wire, C.wire, Math.max(0.8, 1.1 * S));

  // ---- near: the beach (sand, wet sand at the water's edge, ripples and shells), towels, the kiosk, the flag, palms, the rainforest corner
  var sand = '', wet = '', wood = '', dleaf = '', leaf = '', warm = '', nk = '', lite = '', vein = '', line = '', occ = [];
  var sandW = H * (ph ? 0.075 : 0.085), beach = function (xx, f) { var y0 = brazil_yAt(SH, xx); return y0 + (H - y0) * f; }, PA = brazil_off(SH, sandW * 0.8);
  sand += brazil_pg(SH.concat([[W + 60, H + 40], [-60, H + 40]]));
  wet += brazil_pg(SH.concat(brazil_off(SH, 7 * S).reverse()));
  // soft ripples and little pits in the sand, a few shells and starfish
  spread(0, brazil_yAt(SH, W / 2) + 14 * S, W, H - brazil_yAt(SH, W / 2), ph ? 26 : 38, ph ? 18 : 22, rnd, 1).forEach(function (c) { if (c.y < brazil_yAt(SH, c.x) + 12 * S) return; var r = (2 + c.r * 3) * S * (0.7 + (c.y - hz) / H);
    if (c.q < 0.32) wet += brazil_e(c.x, c.y, r * 1.6, r * 0.35); else if (c.q < 0.36) lite += brazil_e(c.x, c.y, r * 0.8, r * 0.55); });
  (ph ? [[0.3, 0.5], [0.66, 0.78]] : [[0.43, 0.62], [0.74, 0.86], [0.18, 0.86]]).forEach(function (q, n) { var cx = W * q[0], cy = beach(cx, q[1]), r = 5 * S, pts = [];
    for (k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5 + n, rr = k % 2 ? r * 0.42 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7]); } warm += brazil_pg(pts); });
  // beach towels lying on the sand, striped
  // (each lies in the shade beside an umbrella: [the umbrella's x and depth, then a nudge right and back from it])
  (ph ? [[0.2, 0.2, 0, -1], [0.56, 0.18, 1, 1]] : [[0.27, 0.2, 0, 1], [0.4, 0.38, 1, 1], [0.69, 0.26, 2, 1], [0.96, 0.32, 0, -1]]).map(function (q) { return [q[0] - 0.012 + (q[3] < 0 ? -0.035 : 0.004), q[1] + 0.07, q[2], q[3]]; }).forEach(function (q) { var tx = W * q[0], ty = beach(tx, q[1]), ts = S * (ph ? 0.8 : 1) * (0.85 + q[1] * 0.3), tw = 52 * ts, th = 17 * ts, sk = q[3] * 9 * ts;
    var P = function (u, v) { return [tx + u * tw + v * sk, ty + v * th]; }, base = brazil_pg([P(0, 0), P(1, 0), P(1, 1), P(0, 1)]), str = '';
    for (k = 1; k < 7; k += 2) str += brazil_pg([P(k / 8, 0), P((k + 0.7) / 8, 0), P((k + 0.7) / 8, 1), P(k / 8, 1)]);
    wet += brazil_pg([P(0.02, 0.15), P(1.04, 0.15), P(1.04, 1.18), P(0.02, 1.18)]);
    if (q[2] === 0) { warm += base; lite += str; } else if (q[2] === 1) { leaf += base; lite += str; } else { nk += base; lite += str; } });
  // the beach kiosk: a wooden counter under a striped roof, green coconuts on the counter, two stools
  var kx = W * (ph ? 0.4 : 0.6), ky = beach(kx, ph ? 0.4 : 0.6), ks = (ph ? 0.8 : 1) * S;
  wet += brazil_e(kx + 6 * ks, ky + 1 * ks, 40 * ks, 6 * ks);
  wood += rect(kx - 26 * ks, ky - 24 * ks, 52 * ks, 24 * ks);
  nk += rect(kx - 24 * ks, ky - 50 * ks, 48 * ks, 24 * ks) + rect(kx - 25 * ks, ky - 50 * ks, 2.4 * ks, 26 * ks) + rect(kx + 22.6 * ks, ky - 50 * ks, 2.4 * ks, 26 * ks);
  lite += rect(kx - 30 * ks, ky - 27 * ks, 60 * ks, 3.4 * ks);
  for (k = 0; k < 5; k++) line += seg(kx - 26 * ks, ky - 19 * ks + k * 4.6 * ks, kx + 26 * ks, ky - 19 * ks + k * 4.6 * ks);
  [-17, -10, 9, 16].forEach(function (q, n) { leaf += brazil_c(kx + q * ks, ky - 30.4 * ks, 3.6 * ks); if (n === 1) leaf += brazil_c(kx - 13.6 * ks, ky - 34.6 * ks, 3.4 * ks); });
  var roofP = [[kx - 35 * ks, ky - 49 * ks], [kx - 24 * ks, ky - 63 * ks], [kx + 24 * ks, ky - 63 * ks], [kx + 35 * ks, ky - 49 * ks]];
  warm += brazil_pg(roofP);
  for (k = 0; k < 7; k++) { if (k % 2) continue; var u0 = k / 7, u1 = (k + 1) / 7; lite += brazil_pg([[kx - 35 * ks + 70 * ks * u0, ky - 49 * ks], [kx - 24 * ks + 48 * ks * u0, ky - 63 * ks], [kx - 24 * ks + 48 * ks * u1, ky - 63 * ks], [kx - 35 * ks + 70 * ks * u1, ky - 49 * ks]]); }
  for (k = 0; k < 7; k++) { var vc = brazil_e(kx - 35 * ks + (k + 0.5) * 10 * ks, ky - 49 * ks, 5 * ks, 4 * ks); if (k % 2) warm += vc; else lite += vc; }
  [[-34, 0], [32, 0]].forEach(function (q) { var sx2 = kx + q[0] * ks; nk += rect(sx2 - 1 * ks, ky - 12 * ks, 2 * ks, 12 * ks) + rrect(sx2 - 5 * ks, ky - 14 * ks, 10 * ks, 3 * ks, 1.4 * ks); });
  for (k = 0; k < 4; k++) lite += brazil_e(kx + 26 * ks + (k % 2) * 2 * ks, ky - 44 * ks + k * 3 * ks, 1.6 * ks, 3.6 * ks);
  // the flagpole planted in the sand (the flag itself waves in the engine)
  var fs = (ph ? 0.85 : 1) * S, fx = W * (ph ? 0.75 : 0.795), fy = beach(fx, ph ? 0.36 : 0.5), fpole = ph ? 150 * fs : Math.max(150 * fs, fy - H * 0.6), flag = {x: fx + 1.6 * fs, y: fy - fpole + 3 * fs, w: (ph ? 62 : 74) * fs, h: (ph ? 43 : 52) * fs, s: fs};
  nk += rect(fx - 1.6 * fs, fy - fpole, 3.2 * fs, fpole) + rect(fx - 4 * fs, fy - 2 * fs, 8 * fs, 3 * fs); occ.push({d: rect(fx - 1.6 * fs, fy - fpole, 3.2 * fs, fpole), y: fy});
  lite += brazil_c(fx, fy - fpole - 2.4 * fs, 3 * fs);
  wet += brazil_e(fx + 10 * fs, fy + 1 * fs, 16 * fs, 3 * fs);
  // umbrellas stand in the sand (the engine's), their shadows lie on it
  var umb = [];
  (ph ? [[0.56, 0.18], [0.9, 0.12], [0.2, 0.2]] : [[0.27, 0.2], [0.4, 0.38], [0.5, 0.16], [0.69, 0.26], [0.86, 0.14], [0.96, 0.32]]).forEach(function (q, n) { var ux2 = W * q[0], uy = beach(ux2, q[1]), us = S * (ph ? 0.85 : 1) * (0.95 + q[1] * 0.6);
    wet += brazil_e(ux2 + 8 * us, uy + 2 * us, 22 * us, 5 * us); umb.push([ux2, uy, us, n]); });
  // palms on the beach: tall royal palms on the right, two leaning coconut palms on the left (their crowns are the engine's)
  var palms = [];
  (ph ? [[0.62, 0.62, 1, 'c', 0.04, 0.4], [0.93, 0.5, -1, 'r', 0, 0.3]] : [[0.24, 0.6, -1, 'c', -0.05, 0.45], [0.335, 0.665, 1, 'c', 0.035, 0.6], [0.89, 0.42, 1, 'r', 0, 0.3], [0.975, 0.36, -1, 'r', 0, 0.45]]).forEach(function (q, n) {
    var px = W * q[0], py = beach(px, q[5]), cy = H * q[1], royal = q[3] === 'r', cx = px + (royal ? 0 : (py - cy) * q[4] * 2.6), pc = {x: cx, y: cy, royal: royal, fr: [], n: n};
    wet += brazil_e(px + 4 * S, py + 1 * S, 14 * S, 3 * S);
    if (royal) { wood += brazil_limb(px, py, cx, cy + 34 * S, 15 * S, 10 * S, 3 * S * q[2]); occ.push({d: brazil_limb(px, py, cx, cy + 34 * S, 15 * S, 10 * S, 3 * S * q[2]), y: py}); leaf += brazil_limb(cx, cy + 36 * S, cx, cy + 2 * S, 10 * S, 8.4 * S, 0); line += seg(cx - 5 * S, cy + 34 * S, cx + 5 * S, cy + 34 * S); }
    else { var bnd = -q[2] * 26 * S, dx0 = cx - px, dy0 = cy + 4 * S - py, L1 = Math.hypot(dx0, dy0), nx0 = -dy0 / L1, ny0 = dx0 / L1; wood += brazil_limb(px, py, cx, cy + 4 * S, 13 * S, 8 * S, bnd); occ.push({d: brazil_limb(px, py, cx, cy + 4 * S, 13 * S, 8 * S, bnd), y: py});
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
  var brA = [-30, H * (ph ? 0.69 : 0.8)], brB = [W * (ph ? 0.4 : 0.25), H * (ph ? 0.71 : 0.835)], branch0 = brazil_limb(brA[0], brA[1], brB[0], brB[1], 15 * js, 5 * js, -10 * js), branch = branch0 + brazil_limb(brA[0] + (brB[0] - brA[0]) * 0.72, brA[1] + (brB[1] - brA[1]) * 0.72 - 3 * js, brB[0] - 6 * js, brB[1] - 34 * js, 5 * js, 2 * js, 4 * js);
  occ.push({d: branch0, y: H});
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
    var fp = brazil_flagParts(flag.x, flag.y, flag.w, flag.h); leaf += fp.g; lite += fp.y; nk += fp.b; vein += fp.band;
    if (dk) lite += brazil_c(moon[0], moon[1], moon[2]); }
  add(near, 'a', sand, C.sand); add(near, 'b', wet, C.wet); add(near, 'c', wood, C.wood); add(near, 'd', dleaf, C.dleaf); add(near, 'e', leaf, C.leaf); add(near, 'f', warm, C.warm); add(near, 'g', nk, C.nk); add(near, 'h', lite, C.lite);
  stk(near, 's', vein, C.vein, ANIM ? 1.1 : 1.6); stk(near, 't', line, C.line, 1.2);
  if (ANIM) { ANIM.C = C; ANIM.S = S; ANIM.moon = moon; ANIM.horizon = horizon; ANIM.hz = hz; ANIM.water = waterPts; ANIM.SH = SH; ANIM.PA = PA; ANIM.sandW = sandW;
    ANIM.loaf = {x: sx, top: stop, wl: wl, wr: wr, lean: lean, body: LF}; ANIM.cab = cab; ANIM.cabS = bs; ANIM.wins = wins; ANIM.umb = umb; ANIM.palms = palms; ANIM.occ = occ;
    ANIM.jungle = J; ANIM.hel = hel; ANIM.branch = branch; ANIM.toucan = tk2; ANIM.brX = [W * (ph ? 0.08 : 0.06), W * (ph ? 0.3 : 0.2)]; ANIM.brY = [brA, brB, 10 * js];
    ANIM.forest = [W * (ph ? 0.02 : 0.04), W * (ph ? 0.4 : 0.42), H * (ph ? 0.3 : 0.3), H * (ph ? 0.4 : 0.4)]; ANIM.city = favEnd; ANIM.st = {a: [s1x, s1y], b: [s2x, s2y], bs: bs};
    var fx0 = -16, fx1 = favEnd + W * 0.01, ftop = Infinity; for (x = fx0; x <= fx1; x += 4) ftop = Math.min(ftop, brazil_yAt(FH, x));
    ANIM.fav = {HL: FH, x0: fx0, x1: fx1, hz: hz - 1 * S, top: ftop, s: (ph ? 1.15 : 1.45) * S};
    ANIM.town = ph ? [{x0: -20, x1: W * 0.27, tall: H * 0.16, s: 1.05 * S, seed: 77, hz: hz, prof: function (u) { return 1 - 0.6 * u; }}]
      : [{x0: -20, x1: W * 0.22, tall: H * 0.27, s: 1.3 * S, seed: 77, hz: hz, prof: function (u) { return 1 - 0.55 * u; }}, {x0: W * 0.565, x1: W * 0.625, tall: H * 0.1, s: 1.1 * S, seed: 91, hz: hz, prof: function (u) { return 1 - 0.5 * u; }}]; ANIM.christ = christ; ANIM.flag = flag; ANIM.kiosk = [kx, ky, ks]; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
