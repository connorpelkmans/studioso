// ---- world theme: australia (Sydney Harbour)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other.
function australia_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function australia_pg(p) { return poly(australia_area(p) < 0 ? p.slice().reverse() : p); }
function australia_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function australia_c(x, y, r) { return australia_e(x, y, r, r); }
function australia_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 16; i++) { var t = i / 16 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return australia_pg(rotp(p, x, y, ang)); }
// a band of width w along a polyline (for steel chords, branches and stems drawn as fills)
function australia_band(pts, w0, w1) { var A = [], B = [], n = pts.length; if (w1 == null) w1 = w0; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], L = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * i / Math.max(1, n - 1); A.push([p[0] - dy / L * w / 2, p[1] + dx / L * w / 2]); B.unshift([p[0] + dy / L * w / 2, p[1] - dx / L * w / 2]); } return australia_pg(A.concat(B)); }
function australia_bez(a, b, c, d, n) { var p = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; p.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return p; }
function australia_qb(a, b, c, n) { var p = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; p.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]); } return p; }
function australia_in(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// the highest point of polygon P over the column x (null when x misses it)
function australia_topAt(P, x) { var m = null; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[0] - x) * (b[0] - x) > 0 || a[0] === b[0]) continue; var y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); if (m === null || y < m) m = y; } return m; }
// the x where a rising polyline first reaches height y
function australia_xAt(P, y) { for (var i = 1; i < P.length; i++) { var a = P[i - 1], b = P[i]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return P[P.length - 1][0]; }
// a line drawn only where no shape in 'hide' covers it (cut into short pieces and tested at each piece's middle)
function australia_vis(x0, y0, x1, y1, hide, st) { var L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / (st || 3))), d = '', run = null; for (var i = 0; i < n; i++) { var a = i / n, b = (i + 1) / n, mx = x0 + (x1 - x0) * (a + b) / 2, my = y0 + (y1 - y0) * (a + b) / 2, ok = true;
  for (var k = 0; k < hide.length && ok; k++) if (australia_in(hide[k], mx, my)) ok = false;
  if (ok) { if (!run) run = [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]; } else if (run) { d += seg(run[0], run[1], x0 + (x1 - x0) * a, y0 + (y1 - y0) * a); run = null; } }
  if (run) d += seg(run[0], run[1], x1, y1); return d; }
function australia_visP(P, hide, st) { var d = ''; for (var i = 1; i < P.length; i++) d += australia_vis(P[i - 1][0], P[i - 1][1], P[i][0], P[i][1], hide, st); return d; }

// ---------------------------------------------------------------- Sydney Harbour
// Sydney Harbour from the botanic garden shore: the Opera House's white tiled shells (two overlapping groups and the
// little restaurant shells, chevron tiles, bronze glass walls) on its sandstone podium, the steel arch of the Harbour Bridge
// with its granite pylons behind, the city skyline and its tower, the green north shore with red-roofed houses, and in front
// a sandstone sea wall, a gum tree (with a koala asleep in its fork), bottlebrush and waratahs. The ferries, sailboats,
// glints, swaying gum leaves, the koala, cockatoos, lorikeets, the pelican, the night lights and the fireworks are the engine's.
var australia_C = {
  L: {glow: 'rgba(255,246,224,0.6)', cloud: 'rgba(255,255,255,0.94)', haze: 'rgba(132,170,190,0.62)', twA: '#AFC3D3', twB: '#DCE6EE', hill: '#7FA07E', win: '#7F97AE', steel: '#7A8896', gran: '#D2BC9E', far2: '#E6E9EA', gold: '#D9AA4E',
    rfl: 'rgba(232,242,250,0.26)', pod: '#C99A78', podT: '#E6D0B2', glass: '#8A7362', shade: '#E1DDD2', lit: '#FCFBF7', wall: '#F4EEE2', roof: '#C9674A', tile: 'rgba(150,140,122,0.5)', edge: '#9C9282',
    path: '#E9DEC6', sand: '#DDBC8A', grass: '#8DB063', bark: '#EDE0CE', lfD: '#567F6A', lfL: '#93B898', red: '#D33A2C', patch: '#A9A8AC', joint: 'rgba(122,92,60,0.5)', stem: '#4C6A48', star: '#FFF6E0',
    water: 'linear-gradient(180deg,#A6D2E8 0%,#6AAAD2 10%,#3A82BA 40%,#286CA6 75%,#1F5E96 100%)'},
  D: {glow: 'rgba(150,120,210,0.3)', cloud: 'rgba(110,104,170,0.34)', haze: 'rgba(60,62,120,0.6)', twA: '#2E3866', twB: '#3C4878', hill: '#1E2E48', win: 'rgba(255,214,140,0.92)', steel: '#545E8E', gran: '#5C5878', far2: '#BCB8D4', gold: '#FFE2A6',
    rfl: 'rgba(140,150,220,0.16)', pod: '#5A4E6E', podT: '#77698A', glass: '#E8B26C', shade: '#AEAACB', lit: '#D8D6EC', wall: '#5E5A80', roof: '#6A4458', tile: 'rgba(90,86,130,0.5)', edge: '#6E6A90',
    path: '#4A4868', sand: '#5E5676', grass: '#2C4440', bark: '#8E88A6', lfD: '#1E3434', lfL: '#2E4A48', red: '#9A3040', patch: '#5E5A78', joint: 'rgba(14,10,36,0.45)', stem: '#1A2A2A', star: '#FFF2CC',
    water: 'linear-gradient(180deg,#4A4A7E 0%,#2E3A6E 10%,#1C2A58 40%,#141E46 75%,#0E1636 100%)'}
};
// One shell of the Opera House: its back end at (bx, by), w long, h tall, the tip leaning toward dir (1 right, -1 left).
// The face between the rib and the front edge catches the light; the back face is in soft shade.
function australia_shell(bx, by, w, h, dir) {
  var X = function (f) { return bx + dir * w * f; }, T = [X(0.9), by - h];
  var back = australia_bez([bx, by], [X(0.02), by - h * 0.62], [X(0.42), by - h], T, 22);
  var front = australia_qb(T, [X(0.84), by - h * 0.46], [X(1), by], 16);
  var rib = australia_qb(T, [X(0.66), by - h * 0.42], [X(0.55), by], 16);
  return {bx: bx, by: by, w: w, h: h, dir: dir, T: T, back: back, front: front, rib: rib, out: back.concat(front.slice(1)), lit: front.concat(rib.slice().reverse().slice(1, -1))};
}
// A group of shells: the tallest at the front end fx, each smaller one leaning its tip onto the back of the one before,
// then the low shell at the back that faces the other way.
function australia_group(fx, by, U, sc, n, rear) {
  var hs = [1.4, 1.04, 0.76, 0.54], ws = [1.3, 1.06, 0.88, 0.72], out = [], prev = null;
  for (var k = 0; k < n; k++) { var h = hs[k] * U * sc, w = ws[k] * U * sc, tx = prev ? australia_xAt(prev.back, by - h) + w * 0.07 : fx - w * 0.1, s = australia_shell(tx - 0.9 * w, by, w, h, 1); out.push(s); prev = s; }
  if (rear) out.push(australia_shell(prev.bx + prev.w * 0.3, by, 0.62 * U * sc, 0.46 * U * sc, -1));
  return out;
}
// The Harbour Bridge between pylon centres xS and xN: the two-hinged arch with its truss, the hanging deck, the granite
// pylons and the approach spans. Returns the fills, the truss lines, and the points the engine lights at night.
function australia_bridge(xS, xN, hb, deckY, top, pw, S, W, rnd) {
  var yb = hb - (hb - deckY) * 0.14, R = yb - top, xa = xS + pw * 0.5, xb = xN - pw * 0.5, n = 24, steel = '', gran = '', lat = '', crs = '', up = [], lo = [], mid = [], k, u, x;
  var yU = function (u) { return top + (yb - 0.45 * R - top) * Math.pow(2 * u - 1, 2); }, yL = function (u) { return top + 0.12 * R + (yb - top - 0.12 * R) * Math.pow(2 * u - 1, 2); }, X = function (u) { return xa + u * (xb - xa); };
  for (k = 0; k <= 60; k++) { u = k / 60; up.push([X(u), yU(u)]); lo.push([X(u), yL(u)]); mid.push([X(u), (yU(u) * 0.55 + yL(u) * 0.45)]); }
  steel += australia_band(up, 3.4 * S) + australia_band(lo, 3.8 * S);
  lat += pline(mid);
  var dT = Math.max(5, (hb - deckY) * 0.17), lights = [], deck = [];
  for (k = 0; k <= n; k++) { u = k / n; x = X(u);
    lat += seg(x, yU(u), x, yL(u));
    if (k < n) { var u2 = (k + 1) / n, x2 = X(u2); lat += k < n / 2 ? seg(x, yU(u), x2, yL(u2)) : seg(x, yL(u), x2, yU(u2)); var um = (u + u2) / 2; lat += seg(X(um), yU(um), X(um), yL(um) * 0.5 + yU(um) * 0.5); }
    lights.push([x, yU(u) - 1.5 * S]); if (k < n) { var uh = (k + 0.5) / n; lights.push([X(uh), yU(uh) - 1.5 * S]); }
    // hangers carry the deck from the lower chord
    if (yL(u) < deckY - 3) lat += seg(x, yL(u), x, deckY); if (k < n && yL((k + 0.5) / n) < deckY - 3) lat += seg(X((k + 0.5) / n), yL((k + 0.5) / n), X((k + 0.5) / n), deckY); }
  // the deck: from beyond the south pylon to beyond the north one, a lattice girder under the roadway, a rail along it
  var dl = xS - (xN - xS) * 0.42, dr = xN + (xN - xS) * 0.5;
  steel += rect(dl, deckY, dr - dl, dT * 0.36) + rect(dl, deckY + dT * 0.82, dr - dl, dT * 0.18) + rect(dl, deckY - 2.4 * S, dr - dl, 1.2 * S);
  for (x = dl; x < dr; x += dT * 0.9) { lat += seg(x, deckY + dT * 0.36, x + dT * 0.45, deckY + dT); lat += seg(x + dT * 0.45, deckY + dT, x + dT * 0.9, deckY + dT * 0.36); }
  for (x = dl + 6 * S; x < dr; x += 22 * S) { if (Math.abs(x - xS) < pw * 0.7 || Math.abs(x - xN) < pw * 0.7) continue; deck.push([x, deckY - 6 * S]); lat += seg(x, deckY - 2.4 * S, x, deckY - 6 * S); }
  // approach spans: steel trusses on granite piers out to each shore
  [[dl, xS - pw * 0.6], [xN + pw * 0.6, dr]].forEach(function (q) { var L = q[1] - q[0], m = Math.max(2, Math.round(L / (46 * S))), sp = L / m;
    for (k = 0; k <= m; k++) { var px = q[0] + k * sp; if (k > 0 && k < m) gran += rect(px - 3.4 * S, deckY + dT, 6.8 * S, hb - deckY - dT + 2) + rect(px - 4.6 * S, deckY + dT, 9.2 * S, 2.4 * S);
      if (k < m) lat += seg(px, deckY + dT, px + sp / 2, deckY + dT * 1.7) + seg(px + sp / 2, deckY + dT * 1.7, px + sp, deckY + dT); } });
  // the pylons: a plinth, the shaft with its recessed panel and courses, a cornice and the stepped top
  var pyl = [];
  [xS, xN].forEach(function (cx) { var pT = hb - (hb - top) * 0.66, b0 = deckY + (hb - deckY) * 0.38;
    gran += rect(cx - pw * 0.58, b0, pw * 1.16, hb - b0 + 2) + australia_pg([[cx - pw * 0.5, b0 + 1], [cx - pw * 0.46, pT], [cx + pw * 0.46, pT], [cx + pw * 0.5, b0 + 1]]);
    gran += rect(cx - pw * 0.54, pT - 3 * S, pw * 1.08, 4 * S) + rect(cx - pw * 0.4, pT - 9 * S, pw * 0.8, 6.4 * S) + rect(cx - pw * 0.26, pT - 14 * S, pw * 0.52, 5.4 * S);
    crs += rect(cx - pw * 0.22, deckY - (deckY - pT) * 0.86, pw * 0.44, (deckY - pT) * 0.7) + seg(cx - pw * 0.48, deckY - 4 * S, cx + pw * 0.48, deckY - 4 * S);
    for (var y = b0; y > pT + 6; y -= 7 * S) crs += seg(cx - pw * 0.48, y, cx - pw * 0.24, y) + seg(cx + pw * 0.24, y, cx + pw * 0.48, y);
    for (y = b0 + 7 * S; y < hb; y += 7 * S) crs += seg(cx - pw * 0.56, y, cx + pw * 0.56, y);
    // the archway the roadway passes through
    crs += australia_pg([[cx - pw * 0.2, deckY + 1], [cx - pw * 0.2, deckY - (deckY - pT) * 0.12], [cx, deckY - (deckY - pT) * 0.2], [cx + pw * 0.2, deckY - (deckY - pT) * 0.12], [cx + pw * 0.2, deckY + 1]]);
    pyl.push([cx, pT - 14 * S, b0]); });
  return {steel: steel, gran: gran, lat: lat, crs: crs, lights: lights, deck: deck, pyl: pyl, up: up, lo: lo, dl: dl, dr: dr, dT: dT, yb: yb};
}
// Drooping eucalypt leaves around (x, y): a clump of long, narrow leaves hanging from a twig.
function australia_clump(x, y, r, n, rnd, a0) { var d = ''; for (var i = 0; i < n; i++) { var a = (a0 || 90) + (rnd() - 0.5) * 120, L = r * (0.55 + rnd() * 0.5), ox = x + (rnd() - 0.5) * r * 1.1, oy = y + (rnd() - 0.5) * r * 0.7; d += leaf(ox, oy, L, L * 0.13, a); } return d; }
// The sleeping koala hugging the fork: a still version for when the engine is off
function australia_koala(k, s, grey, dark) {
  var x = k[0], y = k[1];
  grey.d += australia_e(x, y, 17 * s, 14 * s) + australia_c(x - 12 * s, y - 13 * s, 12 * s) + australia_c(x - 22 * s, y - 22 * s, 6.6 * s) + australia_c(x - 3 * s, y - 24 * s, 6.6 * s) + australia_e(x + 6 * s, y + 9 * s, 8 * s, 5 * s);
  dark.d += australia_e(x - 15 * s, y - 9 * s, 3 * s, 4 * s) + seg(x - 19 * s, y - 15 * s, x - 15 * s, y - 15 * s) + seg(x - 9 * s, y - 16 * s, x - 5 * s, y - 16 * s);
}
SCENES.australia = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(5), refl = Lay(0), mid = Lay(0), near = Lay(0), C = australia_C[dk ? 'D' : 'L'], i, j, k, x, y;
  var S = ph ? 0.8 : Math.max(0.6, Math.min(1.15, H / 800));
  var hb = H * (ph ? 0.6 : 0.6), swTop = H * (ph ? 0.88 : 0.86), swBot = swTop + H * (ph ? 0.024 : 0.03), wl = hb + H * (ph ? 0.085 : 0.09);
  var sky = dk ? 'linear-gradient(180deg,#0A1434 0%,#1A2A5C 38%,#4A3A6E 60%,#4A3A6E 100%)' : 'linear-gradient(180deg,#86C8F2 0%,#D8EEF8 42%,#F8EAD0 60%,#F8EAD0 100%)';
  // ---- far: glow, clouds or stars and moon, the distant shores
  var mn = [W * (ph ? 0.6 : 0.4), H * (ph ? 0.21 : 0.12), ph ? 15 : 20 * S];
  if (dk) add(far, 'a', australia_e(W * 0.55, H * 0.36, W * 0.7, H * 0.32), C.glow); else add(far, 'a', australia_e(W * 0.6, hb - H * 0.1, W * 0.75, H * 0.12), C.glow);
  if (dk) { add(far, 'a', australia_c(mn[0], mn[1], mn[2] * 3.4), 'rgba(200,190,255,0.16)'); var st = ''; spread(0, 0, W, hb - H * 0.18, 38, 38, rnd, 1).forEach(function (c) { if (c.q < 0.34 && Math.hypot(c.x - mn[0], c.y - mn[1]) > mn[2] * 1.8) st += australia_c(c.x, c.y, 0.5 + c.r * 0.9); }); add(refl, 'h', st, C.star); }
  var cl = ''; (ph ? [[0.16, 0.07, 0.5], [0.8, 0.2, 0.46], [0.36, 0.33, 0.4]] : [[0.12, 0.08, 0.85], [0.42, 0.04, 0.6], [0.7, 0.13, 0.75], [0.96, 0.06, 0.6], [0.3, 0.24, 0.5]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], s = q[2] * (ph ? 0.8 : S);
    cl += australia_e(cx, cy, 86 * s, 13 * s) + australia_e(cx - 30 * s, cy - 8 * s, 38 * s, 16 * s) + australia_e(cx + 18 * s, cy - 14 * s, 44 * s, 21 * s) + australia_e(cx + 56 * s, cy - 4 * s, 28 * s, 11 * s); });
  add(far, 'b', cl, C.cloud);
  var dist = ridge(W, hb - H * 0.028, [[H * 0.012, 80, 1.2], [H * 0.006, 21, 0.3]], 6, false);
  add(far, 'c', below(dist, hb + 6), C.haze);

  // ---- where everything stands
  var U = ph ? W * 0.15 : Math.min(W * 0.096, H * 0.148), xS = W * (ph ? 0.6 : 0.555), xN = W * (ph ? 1.18 : 0.94), deckY = hb - H * (ph ? 0.075 : 0.088), top = hb - H * (ph ? 0.25 : 0.29), pw = ph ? 18 : 36 * S;
  var by = wl - U * 0.2, fx = W * (ph ? 0.6 : 0.47);
  var G1 = australia_group(fx, by - U * 0.03, U, 1, 4, true), G2 = australia_group(fx - U * 0.5, by - U * 0.1, U, 0.84, 4, true);
  var restX = G1[G1.length - 1].bx - G1[G1.length - 1].w * 0.62 - U * 0.25, G3 = australia_group(restX, by - U * 0.03, U, 0.36, 2, false);
  var g1f = G1[0], glassP = g1f.front.slice(8).concat([[g1f.bx + g1f.w * 1.12, g1f.by], [g1f.front[8][0] + g1f.w * 0.2, g1f.front[8][1] + g1f.h * 0.06]]);
  var g2f = G2[0], glass2 = g2f.front.slice(5).concat([[g2f.bx + g2f.w * 1.1, g2f.by], [g2f.front[5][0] + g2f.w * 0.2, g2f.front[5][1] + g2f.h * 0.1]]);
  var pl = G3[G3.length - 1].bx - U * 0.5, pr = g1f.bx + g1f.w * 1.13 + U * 0.3;

  // ---- refl: the city skyline and its tower, the north shore, the bridge, the far group of shells, the moon
  var twA = '', twB = '', win = '', mull = '', wins = [], SKy = [], SKs = 4;
  for (x = 0; x <= W + SKs; x += SKs) SKy.push(hb);
  function skyTop(x0, x1, yy) { for (var q = Math.max(0, Math.floor(x0 / SKs)); q <= Math.min(SKy.length - 1, Math.ceil(x1 / SKs)); q++) if (yy < SKy[q]) SKy[q] = yy; }
  // the green banks: the botanic garden shore at the left, the north shore (Kirribilli) at the right of the bridge
  var bankTop = function (x) { var y = hb + 2; if (x < pl + U * 0.4) y = Math.min(y, hb - H * 0.012 - Math.max(0, Math.min(1, (pl + U * 0.4 - x) / (U * 0.8))) * H * 0.018); if (x > xS + (xN - xS) * 0.62) y = Math.min(y, hb - Math.min(1, (x - xS - (xN - xS) * 0.62) / ((xN - xS) * 0.3)) * H * (0.045 + 0.012 * Math.sin(x / 40))); return y; };
  // the city: towers rising toward the middle of the cluster, glass with ribbon windows or grids, a few crowns and masts
  var cx0 = ph ? -0.02 * W : 0.0, cx1 = ph ? W * 0.5 : xS - pw, cMid = ph ? W * 0.2 : W * 0.24, twr = [];
  for (x = cx0 - 10; x < cx1;) { var w0 = (ph ? 14 : 22 * S) + rnd() * (ph ? 18 : 30 * S), near1 = Math.exp(-Math.pow((x + w0 / 2 - cMid) / (W * (ph ? 0.22 : 0.13)), 2)), hh = H * (0.03 + 0.2 * near1) * (0.55 + rnd() * 0.6) + H * 0.02, ty = hb - hh;
    if (x + w0 > cx1) { w0 = Math.max(8, cx1 - x); hh = H * 0.02 + rnd() * H * 0.02; ty = hb - hh; }
    twr.push([x, ty, w0, hh, rnd()]); x += w0 + rnd() * 3; }
  // a second, nearer row of lower buildings in front (The Rocks and the quay)
  for (x = cx0 - 6; x < cx1 - 6;) { var w1 = (ph ? 12 : 18 * S) + rnd() * (ph ? 12 : 20 * S), h1 = H * (0.018 + rnd() * 0.035); twr.push([x, hb - h1, w1, h1, rnd(), 1]); x += w1 + 2 + rnd() * 6; }
  var spX = W * (ph ? 0.17 : 0.3), spT = hb - H * (ph ? 0.43 : 0.46), turY = hb - H * (ph ? 0.36 : 0.39), turW = (ph ? 18 : 30 * S), turH = ph ? 10 : 15 * S;
  twr.forEach(function (t) { var x0 = t[0], y0 = t[1], w = t[2], h = t[3], r = t[4], sd = Math.max(2, w * 0.22);
    twA += rect(x0, y0, w - sd, h + 2); twB += rect(x0 + w - sd, y0, sd, h + 2);
    if (!t[5] && r < 0.3 && h > H * 0.1) { twA += australia_pg([[x0 + w * 0.2, y0], [x0 + w * 0.5, y0 - w * 0.4], [x0 + w * 0.8 - sd, y0]]); mull += seg(x0 + w * 0.5, y0 - w * 0.4, x0 + w * 0.5, y0 - w * 0.4 - 10 * S); skyTop(x0, x0 + w, y0 - w * 0.4 - 10 * S); }
    else if (!t[5] && r > 0.75) { twA += rect(x0 + w * 0.15, y0 - 5 * S, w * 0.6, 5 * S); skyTop(x0, x0 + w, y0 - 5 * S); }
    skyTop(x0, x0 + w, y0);
    var fh = t[5] ? 4.5 * S : 5.4 * S, grid = r > 0.45;
    for (var yy = y0 + fh; yy < hb - 3; yy += fh) { if (yy > bankTop(x0 + w / 2) - 2) break;
      if (grid) { for (var xx = x0 + 2; xx < x0 + w - sd - 3; xx += 4.4 * S) { var wq = rnd(); if (dk ? wq < 0.42 : true) win += rect(xx, yy, 2.4 * S, fh * 0.5); wins.push([xx, yy, 2.4 * S, fh * 0.5, wq]); } }
      else if (dk) { for (var xx2 = x0 + 2; xx2 < x0 + w - sd - 4; xx2 += 7 * S) { var wq2 = rnd(); if (wq2 < 0.4) win += rect(xx2, yy, 5.6 * S, fh * 0.42); wins.push([xx2, yy, 5.6 * S, fh * 0.42, wq2]); } }
      else win += rect(x0 + 1.5, yy, w - sd - 3, fh * 0.36); }
    if (!grid) for (var mx = x0 + w * 0.33; mx < x0 + w - sd - 1; mx += w * 0.33) mull += seg(mx, y0 + 2, mx, hb); });
  // the city's tower: a slim shaft held by cables, the golden turret, the mast
  twA += rect(spX - 3.2 * S, turY, 6.4 * S, hb - turY) + rect(spX - 1.2 * S, spT, 2.4 * S, turY - spT);
  twB += rect(spX - turW * 0.42, turY + turH, turW * 0.84, 3 * S) + rect(spX - turW * 0.4, turY - 3.4 * S, turW * 0.8, 3.4 * S) + rect(spX - turW * 0.2, turY - 9 * S, turW * 0.4, 5.6 * S);
  add(refl, 'h', rrect(spX - turW / 2, turY, turW, turH, turH * 0.3), C.gold);
  for (j = -2; j <= 2; j++) if (j) mull += seg(spX + j * 1.4 * S, turY + turH, spX + j * 7 * S, hb - H * 0.06);
  for (j = 0; j < 3; j++) mull += seg(spX - turW / 2, turY + turH * (0.28 + j * 0.24), spX + turW / 2, turY + turH * (0.28 + j * 0.24));
  skyTop(spX - turW / 2, spX + turW / 2, turY - 9 * S); skyTop(spX - 2, spX + 2, spT);
  // north shore office towers, seen under the arch
  var nsx0 = xS + (xN - xS) * (ph ? 0.5 : 0.62), nsx1 = xS + (xN - xS) * (ph ? 0.9 : 0.86);
  for (x = nsx0; x < nsx1;) { var w2 = (ph ? 10 : 16 * S) + rnd() * (ph ? 10 : 16 * S), h2 = H * (0.06 + rnd() * 0.07), y2 = hb - h2, sd2 = w2 * 0.25;
    twA += rect(x, y2, w2 - sd2, h2); twB += rect(x + w2 - sd2, y2, sd2, h2); skyTop(x, x + w2, y2);
    for (var yy3 = y2 + 4 * S; yy3 < bankTop(x + w2 / 2) - 3; yy3 += 4.4 * S) { var wq3 = rnd(); if (!dk || wq3 < 0.4) win += rect(x + 1.5, yy3, w2 - sd2 - 3, 1.8 * S); wins.push([x + 1.5, yy3, w2 - sd2 - 3, 1.8 * S, wq3]); }
    x += w2 + 2 + rnd() * 10; }
  add(refl, 'a', twA, C.twA); add(refl, 'b', twB, C.twB);
  // the banks, with a fringe of trees along their tops
  var bk = [], bkT = '', hx0 = Math.min(pl + U * 0.4, W) + 2;
  for (x = -10; x <= W + 10; x += 4) bk.push([x, bankTop(x)]);
  for (x = -10; x < W + 10; x += (ph ? 9 : 13 * S) * (0.7 + rnd() * 0.6)) { var bt = bankTop(x); if (bt > hb) continue; var tr = (ph ? 4 : 6.4 * S) * (0.7 + rnd() * 0.6); bkT += australia_c(x, bt - tr * 0.4, tr); skyTop(x - tr, x + tr, bt - tr * 1.3); }
  add(refl, 'c', below(bk, hb + 3) + bkT, C.hill);
  // red-roofed houses and flats on the north shore (on the mid layer, so they sit on the bank in front of its trees)
  var houses = [], hW = '', hR = '';
  for (x = xS + (xN - xS) * 0.66; x < W + 10; x += (ph ? 12 : 17 * S) * (0.8 + rnd() * 0.7)) { var bt2 = bankTop(x); if (bt2 > hb - 4) continue;
    var hw = (ph ? 8 : 11 * S) * (0.8 + rnd() * 0.5), hh2 = (ph ? 5 : 7 * S) * (0.8 + rnd() * 0.6), hy = bt2 + (hb - bt2) * (0.25 + rnd() * 0.5);
    if (hy - hh2 - hw * 0.3 < deckY + 20 * S && Math.abs(x - xN) < (xN - xS) * 0.62) continue;
    hW += rect(x, hy - hh2, hw, hh2); hR += australia_pg([[x - 1, hy - hh2], [x + hw / 2, hy - hh2 - hw * 0.32], [x + hw + 1, hy - hh2]]); houses.push([x + hw * 0.3, hy - hh2 * 0.6]); }
  add(mid, 'g', hW, C.wall); add(mid, 'h', hR, C.roof);
  var RFy = SKy.slice();   // the reflection's height map: the city and banks, without the lacy arch
  // the bridge
  var B = australia_bridge(xS, xN, hb, deckY, top, pw, S, W, rnd);
  add(refl, 'e', B.steel, C.steel); add(refl, 'f', B.gran, C.gran); stk(refl, 's', B.lat, C.steel, ph ? 0.8 : 1.1 * S);
  for (x = 0; x < W; x += SKs) { var ub = (x - xS - pw * 0.5) / (xN - xS - pw); if (ub > 0 && ub < 1) skyTop(x - 2, x + 2, top + (hb - (hb - deckY) * 0.14 - 0.45 * (hb - (hb - deckY) * 0.14 - top) - top) * Math.pow(2 * ub - 1, 2) - 2); }
  B.pyl.forEach(function (p) { skyTop(p[0] - pw * 0.5, p[0] + pw * 0.5, p[1]); });
  // the far (smaller) group of shells, in one soft tone behind the near group, with its own glass
  var g2 = ''; G2.forEach(function (s) { g2 += australia_pg(s.out); });
  add(refl, 'g', g2, C.far2); add(refl, 'd', win + australia_pg(glass2), C.win); stk(refl, 't', mull + B.crs, dk ? 'rgba(14,12,40,0.5)' : 'rgba(70,86,104,0.42)', ph ? 0.6 : 0.8);
  if (dk) add(refl, 'h', australia_c(mn[0], mn[1], mn[2]), C.star);

  // ---- mid: reflections, the podium, the near shells, glass and tiles
  var shells = G1.slice(), hide, chev = '', edge = '', shd = '', lt = '', outs = [];
  // the near group is drawn front shell first, so each later (smaller) shell hides the ones before it
  G1.concat(G3).forEach(function (s) { shd += australia_pg(s.out); lt += australia_pg(s.lit); outs.push(s.out); });
  G1.concat(G3).forEach(function (s, n) {
    hide = outs.slice(n + 1);
    // chevron tiles: lines from the rib out to either edge, rising like the sides of a fern
    var nn = Math.max(6, Math.round(s.h / (ph ? 5 : 6.5 * S)));
    for (k = 1; k < nn; k++) { var r = k / nn, ri = Math.round(r * 16), R = s.rib[ri], bi = Math.round((1 - r) * 22), Bk = s.back[Math.max(0, Math.min(22, bi + 2))], Fi = s.front[Math.max(0, Math.round(r * 16) - 1)];
      chev += australia_vis(R[0], R[1], Bk[0] * 0.94 + R[0] * 0.06, Bk[1] * 0.94 + R[1] * 0.06, hide) + australia_vis(R[0], R[1], Fi[0] * 0.94 + R[0] * 0.06, Fi[1] * 0.94 + R[1] * 0.06, hide); }
    chev += australia_visP(s.rib, hide);
    edge += australia_visP(s.back, hide) + australia_visP(s.front, hide); });
  // the far group's tiles and edges, where the near group leaves them showing
  var hideAll = outs.slice();
  G2.forEach(function (s, n) { var hd = hideAll.concat(G2.slice(n + 1).map(function (q) { return q.out; }));
    edge += australia_visP(s.back, hd, 4) + australia_visP(s.front, hd, 4); chev += australia_visP(s.rib, hd, 4);
    for (k = 2; k < 9; k++) { var r2 = k / 9, R2 = s.rib[Math.round(r2 * 16)], B2 = s.back[Math.max(0, Math.min(22, Math.round((1 - r2) * 22) + 2))]; chev += australia_vis(R2[0], R2[1], B2[0] * 0.9 + R2[0] * 0.1, B2[1] * 0.9 + R2[1] * 0.1, hd, 4); } });
  // the podium: a sandstone-faced platform with the broad steps at the land end and a band of windows along its face
  var pod = '', podT = '', pj = '', podWin = [];
  podT += australia_pg([[pl + U * 0.12, by - U * 0.12], [pr - U * 0.06, by - U * 0.12], [pr, by], [pl, by]]);
  pod += rect(pl, by, pr - pl, wl - by + 1);
  pod += australia_pg([[pl, by], [pl - U * 0.42, wl - (wl - by) * 0.3], [pl - U * 0.42, wl + 1], [pl, wl + 1]]);
  for (k = 1; k < 7; k++) { var sx = pl - U * 0.42 * k / 7; pj += seg(sx, by + (wl - (wl - by) * 0.3 - by) * k / 7, sx, wl); pj += seg(sx, by + (wl - (wl - by) * 0.3 - by) * k / 7, sx + U * 0.06, by + (wl - (wl - by) * 0.3 - by) * k / 7); }
  pj += seg(pl, by + (wl - by) * 0.18, pr, by + (wl - by) * 0.18) + seg(pl, wl - (wl - by) * 0.2, pr, wl - (wl - by) * 0.2);
  for (x = pl + U * 0.18; x < pr - U * 0.12; x += U * 0.16) { var pwn = U * 0.1; podWin.push([x, by + (wl - by) * 0.36, pwn, (wl - by) * 0.2]); }
  var podWd = ''; podWin.forEach(function (p) { podWd += rect(p[0], p[1], p[2], p[3]); });
  for (x = pl; x < pr; x += U * 0.32) pj += seg(x, wl - (wl - by) * 0.2, x, wl);
  // glass walls under the front shell: bronze panes in a folded frame
  var gl = australia_pg(glassP) + podWd;
  for (k = 0; k < 5; k++) { var gp = g1f.front[Math.min(16, 9 + k * 2)], gb = [g1f.bx + g1f.w * (1 + 0.022 * k), g1f.by]; edge += seg(gp[0], gp[1], gb[0], gb[1]); }
  edge += seg(glassP[glassP.length - 1][0], glassP[glassP.length - 1][1], glassP[glassP.length - 2][0], glassP[glassP.length - 2][1]) + pline(g1f.front.slice(8).map(function (p, n) { return [p[0] + g1f.w * 0.1 * (n / 8), p[1] + (g1f.by - p[1]) * 0.45]; }));
  // reflections: the skyline and banks, the bridge (broken by the ripples), the shells and podium
  var rf = '';
  for (x = -10; x < W; x += 5) { var q = Math.min(SKy.length - 1, Math.floor(Math.max(0, x) / SKs)), dep = Math.min(hb - RFy[q], (swTop - hb) * 0.9) * 0.36; if (x > pl - U * 0.5 && x < pr) continue; rf += rect(x, hb + 1, 5.2, dep * (0.85 + 0.15 * Math.sin(x * 0.37))); }
  for (y = wl + 2; y < swTop - 4; y += 4.6) { var f = (y - wl) / (U * 0.9); if (f > 1) break; G1.forEach(function (s) { var hw2 = s.w * 0.45 * (1 - f) * (0.7 + 0.3 * Math.sin(y * 1.7 + s.bx)); if (hw2 > 1) rf += rect(s.bx + s.w * 0.5 - hw2 + Math.sin(y * 0.9) * 2, y, hw2 * 2, 1.8); }); }
  B.up.forEach(function (p, n) { if (n % 2) return; var ry = hb + (hb - p[1]) * 0.42 + Math.sin(n * 1.3) * 1.5; if (ry < wl || p[0] > pr) rf += rect(p[0] - 2, ry, 5, 1.6); });
  add(mid, 'a', rf, C.rfl);
  add(mid, 'b', pod, C.pod); add(mid, 'c', podT, C.podT); add(mid, 'd', gl, C.glass); add(mid, 'e', shd, C.shade); add(mid, 'f', lt, C.lit);
  stk(mid, 's', chev, C.tile, ph ? 0.55 : 0.75 * S); stk(mid, 't', edge + pj, C.edge, ph ? 0.6 : 0.85 * S);

  // ---- near: the path, the sea wall, the lawn, the gum tree, bottlebrush and waratahs
  var path = '', sand = '', grass = '', bark = '', lfD = '', lfL = '', red = '', patch = {d: ''}, joint = {d: ''}, stem = '';
  path += rect(-10, swBot - 1, W + 20, H - swBot + 11);
  sand += rect(-10, swTop, W + 20, swBot - swTop) + rect(-10, swTop - 2.4 * S, W + 20, 3 * S);
  for (x = -10, j = 0; x < W + 10; x += (ph ? 26 : 38 * S) * (0.8 + hash(j) * 0.4), j++) joint.d += seg(x, swTop + 1, x, swBot - 1);
  joint.d += seg(-10, swTop + 0.6, W + 10, swTop + 0.6) + seg(-10, swBot, W + 10, swBot);
  // paving: soft sandstone flags in rows that widen toward the viewer
  for (y = swBot + 7, j = 0; y < H + 6; y += 7 + j * 2.2, j++) { joint.d += seg(-10, y, W + 10, y); var fw = (ph ? 34 : 54 * S) + j * 10; for (x = (j % 2) * fw * 0.5 - fw; x < W + fw; x += fw) joint.d += seg(x, y, x - 2, y - 7 - (j - 1) * 2.2); }
  // the gum tree: a pale smooth trunk leaning in from the left, forking into limbs, open clumps of hanging leaves
  var tb = [W * (ph ? 0.06 : 0.07), H + 4], tS = ph ? 0.75 : S, fk = [W * (ph ? 0.1 : 0.085), H * (ph ? 0.6 : 0.52)], limbs = [], perch = [], tips = [];
  var trunk = australia_bez(tb, [tb[0] + 6 * tS, H * 0.85], [fk[0] - 14 * tS, H * 0.68], fk, 14);
  bark += australia_band(trunk, 72 * tS, 40 * tS) + australia_e(tb[0] + 4 * tS, H - 2, 46 * tS, 11 * tS);
  // limbs: up and out over the water, up-left out of the frame, and a long one reaching over the path
  [[[fk[0] + 8 * tS, fk[1] - 4 * tS], [fk[0] + 60 * tS, fk[1] - 90 * tS], [fk[0] + 150 * tS, fk[1] - 150 * tS], [fk[0] + (ph ? 150 : 190) * tS, fk[1] - (ph ? 270 : 260) * tS], 30, 9],
   [[fk[0] - 6 * tS, fk[1] - 6 * tS], [fk[0] - 20 * tS, fk[1] - 120 * tS], [fk[0] - 40 * tS, fk[1] - 190 * tS], [fk[0] - 30 * tS, fk[1] - 320 * tS], 32, 12],
   [[fk[0] + 4 * tS, fk[1] - 30 * tS], [fk[0] + 40 * tS, fk[1] - 200 * tS], [fk[0] + 70 * tS, fk[1] - 280 * tS], [fk[0] + 90 * tS, fk[1] - 380 * tS], 22, 7]].forEach(function (L, n) {
    var P = australia_bez(L[0], L[1], L[2], L[3], 16); bark += australia_band(P, L[4] * tS, L[5] * tS); limbs.push(P);
    // twigs off each limb, ending in leaf clumps
    for (k = 5; k <= 16; k += 3) { var p = P[k], a = (n === 1 ? -150 : -30) + (hash(k + n * 7) - 0.5) * 70, len = (40 + hash(k * 3 + n) * 50) * tS, ex = p[0] + Math.cos(a * Math.PI / 180) * len, ey = p[1] + Math.sin(a * Math.PI / 180) * len * 0.6;
      bark += australia_band([[p[0], p[1]], [(p[0] + ex) / 2, (p[1] + ey) / 2 - 6 * tS], [ex, ey]], 5.5 * tS, 2 * tS); tips.push([ex, ey]); if (k === 8 || k === 14) perch.push([(p[0] + ex) / 2, (p[1] + ey) / 2 - 8 * tS]); } });
  // bark: grey patches where the old bark has peeled, a few creases
  for (k = 2; k < 13; k += 2) { var tp = trunk[k], ww = (72 - 32 * k / 14) * tS; if (hash(k) < 0.75) patch.d += australia_re(tp[0] + (hash(k + 4) - 0.5) * ww * 0.45, tp[1], ww * 0.07, ww * 0.42, (hash(k) - 0.5) * 10); joint.d += seg(tp[0] + ww * 0.32, tp[1] + 6 * tS, tp[0] + ww * 0.36, tp[1] - 10 * tS); }
  // leaf clumps: dark leaves under, lighter blue-green leaves on the sunny side
  var clumps = [];
  tips.concat(limbs.map(function (P) { return P[16]; })).forEach(function (t, n) { var r = (ph ? 26 : 36) * tS * (0.8 + hash(n * 5) * 0.4); clumps.push([t[0], t[1] + r * 0.3, r]);
    lfD += australia_clump(t[0], t[1] + r * 0.35, r, 22, rnd, 95); lfL += australia_clump(t[0] + r * 0.2, t[1] + r * 0.1, r * 0.8, 12, rnd, 80); });
  // the koala sleeps in the fork, hugging the trunk (the engine draws it when it runs)
  var ko = [fk[0] + 14 * tS, fk[1] + 20 * tS], koS = (ph ? 1.05 : 1.45) * tS;
  if (!ANIM) australia_koala(ko, koS, patch, joint);
  // bottlebrush on the right: arching woody stems, sprays of narrow leaves, and red brushes of stamens near their tips
  var bbX = W * (ph ? 0.92 : 0.91), bbY = H + 2, brushes = [], nb = ph ? 9 : 14;
  for (k = 0; k < nb; k++) { var a2 = -90 + (k - (nb - 1) / 2) * (ph ? 11 : 9) + (hash(k + 3) - 0.5) * 8, L2 = (ph ? 130 : 210) * tS * (0.7 + hash(k + 40) * 0.4), ca = Math.cos(a2 * Math.PI / 180), sa = Math.sin(a2 * Math.PI / 180);
    var P2 = australia_qb([bbX + (k - nb / 2) * 2.4, bbY], [bbX + ca * L2 * 0.4, bbY + sa * L2 * 0.62], [bbX + ca * L2 + (a2 + 90) * 0.8 * tS, bbY + sa * L2 + 26 * tS], 14);
    bark += australia_band(P2, 4 * tS, 1.4 * tS);
    // narrow leaves along the stem, hanging and pointing out
    for (j = 2; j < 15; j++) { var p2 = P2[j], dA = Math.atan2(P2[Math.min(14, j + 1)][1] - P2[j - 1][1], P2[Math.min(14, j + 1)][0] - P2[j - 1][0]) * 180 / Math.PI;
      for (var s2 = -1; s2 <= 1; s2 += 2) { var lA = dA + s2 * (40 + hash(j + k * 9 + s2) * 25), lL = (16 + hash(j * 3 + k) * 8) * tS; var lf2 = leaf(p2[0], p2[1], lL, lL * 0.12, lA); if (hash(j + k * 5 + s2) < 0.5) lfD += lf2; else lfL += lf2; } }
    // the brush: two rows of fine stamens round a spike, a little way back from the tip
    var bi = 9, bp0 = P2[bi], bp1 = P2[13], ang = Math.atan2(bp1[1] - bp0[1], bp1[0] - bp0[0]), bl = Math.hypot(bp1[0] - bp0[0], bp1[1] - bp0[1]), bwid = 10 * tS, bp = [];
    for (j = 0; j <= 30; j++) { var t2 = j / 30, sd = j % 2 ? 1 : 0.62; bp.push([bl * t2, bwid * sd * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t2 * 0.9)), 0.5)]); }
    for (j = 30; j >= 0; j--) { var t3 = j / 30, sd2 = j % 2 ? 0.62 : 1; bp.push([bl * t3, -bwid * sd2 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t3 * 0.9)), 0.5)]); }
    red += australia_pg(rotp(bp, bp0[0], bp0[1], ang * 180 / Math.PI)); brushes.push([(bp0[0] + bp1[0]) / 2, (bp0[1] + bp1[1]) / 2, ang, bl]);
    for (j = 1; j < 8; j++) { var q2 = j / 8, sx2 = bp0[0] + (bp1[0] - bp0[0]) * q2, sy2 = bp0[1] + (bp1[1] - bp0[1]) * q2; joint.d += australia_c(sx2 - Math.sin(ang) * bwid * 0.8, sy2 + Math.cos(ang) * bwid * 0.8, 0.9 * tS) + australia_c(sx2 + Math.sin(ang) * bwid * 0.8, sy2 - Math.cos(ang) * bwid * 0.8, 0.9 * tS); } }
  // waratahs: a dome of florets in a ring of red bracts, on stout stems with toothed leaves
  (ph ? [[0.72, 0.985, 0.85]] : [[0.75, 0.99, 1], [0.8, 0.975, 0.8]]).forEach(function (q, n) { var wx = W * q[0], wy = H * q[1], s = q[2] * tS, fh = 70 * s;
    stem += seg(wx, wy, wx + 2 * s, wy - fh); for (k = 0; k < 4; k++) { var ly = wy - fh * (0.2 + k * 0.18), sg = k % 2 ? 1 : -1; lfD += leaf(wx, ly, 30 * s, 5 * s, sg > 0 ? -25 : -155); }
    var fx2 = wx + 2 * s, fy = wy - fh - 12 * s;
    for (k = 0; k < 9; k++) { var a3 = Math.PI * (0.95 + k / 8 * 1.1); red += leaf(fx2 + Math.cos(a3) * 6 * s, fy + 12 * s + Math.sin(a3) * 3 * s, 20 * s, 4.5 * s, a3 * 180 / Math.PI + (Math.cos(a3) > 0 ? 10 : -10)); }
    red += australia_e(fx2, fy, 12 * s, 14 * s);
    for (k = 0; k < 5; k++) for (j = 0; j < 4; j++) joint.d += australia_c(fx2 - 9 * s + j * 6 * s + (k % 2) * 3 * s, fy - 9 * s + k * 4.6 * s, 1.4 * s); });
  // lawn: grass under the tree and the shrubs, with blades along its edge
  var lawn = function (x0, x1, y0) { var p = [[x0, H + 10]], st2 = 6; for (x = x0; x <= x1; x += st2) p.push([x, y0 + Math.sin(x * 0.09) * 3 + Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2) * (H - y0) * 0.9]); p.push([x1, H + 10]); grass += australia_pg(p);
    for (x = x0 + 4; x < x1 - 4; x += 5) { var gy = y0 + Math.sin(x * 0.09) * 3 + Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2) * (H - y0) * 0.9; if (gy < H) stem += seg(x, gy + 3, x + (hash(x) - 0.5) * 5, gy - 4 - hash(x + 1) * 5); } };
  lawn(-W * 0.12, W * (ph ? 0.32 : 0.24), H * (ph ? 0.955 : 0.94)); lawn(W * (ph ? 0.62 : 0.7), W * 1.12, H * (ph ? 0.95 : 0.935));
  // a still ferry and a sailboat when the engine is off
  var lane1 = hb + (wl - hb) * 0.42, lane2 = wl + (swTop - wl) * 0.5, fS = ph ? 0.55 : 0.85 * S;
  if (!ANIM) { var fxs = W * (ph ? 0.5 : 0.68), f1 = lane2;
    lfD += australia_pg([[fxs - 62 * fS, f1 - 8 * fS], [fxs + 62 * fS, f1 - 8 * fS], [fxs + 54 * fS, f1], [fxs - 54 * fS, f1]]);
    path += rect(fxs - 50 * fS, f1 - 20 * fS, 100 * fS, 12 * fS) + rect(fxs - 34 * fS, f1 - 30 * fS, 68 * fS, 10 * fS) + rect(fxs - 10 * fS, f1 - 37 * fS, 20 * fS, 7 * fS);
    for (k = 0; k < 9; k++) joint.d += rect(fxs - 46 * fS + k * 10.4 * fS, f1 - 17 * fS, 6 * fS, 5 * fS);
    var sbx = W * (ph ? 0.3 : 0.24), sby = lane2 - (ph ? 2 : 6); path += australia_pg([[sbx - 16 * fS, sby - 4 * fS], [sbx + 18 * fS, sby - 4 * fS], [sbx + 12 * fS, sby + 2 * fS], [sbx - 12 * fS, sby + 2 * fS]]) + australia_pg([[sbx + 1, sby - 6 * fS], [sbx + 1, sby - 50 * fS], [sbx + 20 * fS, sby - 6 * fS]]) + australia_pg([[sbx - 2, sby - 6 * fS], [sbx - 2, sby - 42 * fS], [sbx - 15 * fS, sby - 6 * fS]]); }
  add(near, 'a', path, C.path); add(near, 'b', sand, C.sand); add(near, 'c', grass, C.grass); add(near, 'd', bark, C.bark); add(near, 'e', lfD, C.lfD); add(near, 'f', lfL, C.lfL); add(near, 'g', red, C.red); add(near, 'h', patch.d, C.patch);
  stk(near, 's', joint.d, C.joint, ph ? 0.9 : 1.1 * S); stk(near, 't', stem, C.stem, ph ? 1 : 1.3 * S);
  // the Opera House's outline from above, so the engine can keep what stands behind it behind it
  var sil = [[pl - U * 0.45, wl]], allP = outs.concat(G2.map(function (s) { return s.out; }), [glassP, glass2]);
  for (x = pl - U * 0.45; x <= pr; x += 2) { var m = x < pl ? wl - (wl - by) * 0.3 * (x - pl + U * 0.42) / (U * 0.42) : by - U * 0.12; allP.forEach(function (P) { var t4 = australia_topAt(P, x); if (t4 !== null && t4 < m) m = t4; }); sil.push([x, m]); }
  sil.push([pr, wl]);
  if (ANIM) { ANIM.C = C; ANIM.S = S; ANIM.U = U; ANIM.hb = hb; ANIM.wl = wl; ANIM.swTop = swTop; ANIM.swBot = swBot; ANIM.lane1 = lane1; ANIM.lane2 = lane2; ANIM.fS = fS; ANIM.sil = sil; ANIM.pl = pl; ANIM.pr = pr;
    ANIM.shells = G1.concat(G3).map(function (s) { return s.out; }); ANIM.shells2 = G2.map(function (s) { return s.out; }); ANIM.glass = [glassP, glass2]; ANIM.podWin = podWin;
    ANIM.B = B; ANIM.xS = xS; ANIM.xN = xN; ANIM.top = top; ANIM.deckY = deckY; ANIM.wins = wins; ANIM.houses = houses; ANIM.SKy = SKy; ANIM.SKs = SKs; ANIM.moon = mn;
    ANIM.clumps = clumps; ANIM.perch = perch; ANIM.koala = [ko[0], ko[1], koS]; ANIM.brushes = brushes; ANIM.tS = tS; ANIM.spire = [spX, turY, turW, turH]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hb, bg: C.water}};
};
