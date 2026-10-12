// ---- world theme: peru (Machu Picchu)
// The Inca citadel on its saddle ridge high in the Andes: fitted grey stone houses with trapezoid windows and thatched
// roofs, green terraces stepping down the slope, the sugarloaf peak of Huayna Picchu behind, layered ridges fading into
// valley mist and the river winding far below. The drifting clouds, llamas, condor, hummingbird, grass ripples, stars,
// moon and Milky Way are the engine's. Every shape is drawn clockwise, so shapes that share a slot merge instead of
// cutting holes in each other.
function peru_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function peru_pg(p) { return poly(peru_area(p) < 0 ? p.slice().reverse() : p); }
function peru_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function peru_c(x, y, r) { return peru_e(x, y, r, r); }
// y of an evenly spaced polyline at x
function peru_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// a mountain range: a wavy base line with peaks [x, top, half-width left, half-width right, e1, e2] (the highest wins):
// e1 sets how round the summit is (2 = dome, 1.2 = sharp), e2 the flanks (below 1 = steep loaf sides, above 1 = flared),
// roughened by 'rough' pixels so ridgelines read as rock and forest instead of a clean curve
function peru_range(W, base, peaks, waves, step, rough) { var pts = [];
  for (var x = -60; x <= W + 60; x += step) { var y = base, k; for (k = 0; k < waves.length; k++) y += waves[k][0] * Math.sin(x / waves[k][1] + waves[k][2]);
    for (k = 0; k < peaks.length; k++) { var p = peaks[k], u = (x - p[0]) / (x < p[0] ? p[2] : p[3]); if (Math.abs(u) < 1) y = Math.min(y, p[1] + (base - p[1]) * (1 - Math.pow(1 - Math.pow(Math.abs(u), p[4] || 1.5), p[5] || 1.7))); }
    pts.push([x, y + rough * (Math.sin(x * 0.21) * 0.6 + Math.sin(x * 0.53 + 1) * 0.4)]); }
  return pts; }
// the snow on a peak: everything of the outline above a ragged line 'cap' below the summit
function peru_snow(pts, top, cap, x0, x1) { var A = [], B = [];
  pts.forEach(function (p) { if (p[0] < x0 || p[0] > x1) return; var yb = top + cap * (0.55 + 0.45 * Math.abs(Math.sin(p[0] * 0.13))); A.push([p[0], Math.min(p[1], yb)]); B.unshift([p[0], yb]); });
  return A.length > 1 ? peru_pg(A.concat(B)) : ''; }
// a band between two lines given as functions of x, from xa to xb
function peru_band(f0, f1, xa, xb, st) { var A = [], B = [], x; for (x = xa; x < xb; x += st) { A.push([x, f0(x)]); B.unshift([x, f1(x)]); } A.push([xb, f0(xb)]); B.unshift([xb, f1(xb)]); return peru_pg(A.concat(B)); }
// a trapezoid window or doorway: wider at the sill than at the lintel, the Inca way
function peru_trap(x, y, w, h) { return peru_pg([[x - w * 0.5, y + h], [x - w * 0.36, y], [x + w * 0.36, y], [x + w * 0.5, y + h]]); }
// a still llama for the still scene (the engine draws the living ones): body fill, and its dark details as strokes
function peru_llamaStill(x, y, s, dir) { var b = '', d = '', X = function (u) { return x + u * s * dir; }, Y = function (v) { return y + v * s; };
  b += peru_e(X(-2), Y(-26), 17 * s, 9.5 * s) + peru_c(X(-19), Y(-29), 3.6 * s);
  [-13, -8, 7, 11].forEach(function (u) { b += rect(Math.min(X(u - 1.7), X(u + 1.7)), Y(-20), 3.4 * s, 20 * s); });
  b += peru_pg([[X(7), Y(-30)], [X(13), Y(-52)], [X(19), Y(-50)], [X(16), Y(-28)]]) + peru_e(X(19), Y(-53), 6 * s, 4.4 * s) + peru_e(X(13.5), Y(-60), 1.6 * s, 4.6 * s) + peru_e(X(17), Y(-60), 1.6 * s, 4.6 * s);
  d += peru_c(X(20), Y(-54), 0.5 * s) + seg(X(24), Y(-52), X(25), Y(-51.4)); return {b: b, d: d}; }

var peru_C = {
  L: {r1: '#BDD6EA', snow: '#FFFFFF', mist: 'rgba(255,255,255,0.72)', r2: '#9FC6CF', r3: '#6FA48E', r3t: '#5E957E', river: '#A6D0DC', shine: 'rgba(255,255,255,0.85)', vmist: 'rgba(255,255,255,0.78)',
    hp: '#3C7A50', hpv: '#5A9C5A', rock: 'rgba(120,134,112,0.55)', hpl: 'rgba(255,255,240,0.55)', ground: '#7DB653', trees: '#3E7C48', grass: '#9AD062', stone: '#D2CEC0', shade: '#958F82', thatch: '#D4A658', thatchS: '#A8803E',
    mortar: 'rgba(110,104,92,0.5)', tline: 'rgba(140,96,36,0.55)', nsh: 'rgba(50,60,40,0.2)', ngrass: '#88C657', nstone: '#C9C3B4', nstoneS: '#8E8778', nlight: '#B2E07E', leaf: '#3F7C45', kantu: '#E23A6E', bloom: '#FFF6DE', blade: '#5E9C3E', nline: 'rgba(96,90,78,0.55)'},
  D: {r1: '#2C3468', snow: '#B4C0EA', mist: 'rgba(150,165,230,0.24)', r2: '#252F60', r3: '#1C2B4C', r3t: '#17243F', river: '#5A6CA8', shine: 'rgba(200,215,255,0.55)', vmist: 'rgba(165,185,245,0.3)',
    hp: '#13283A', hpv: '#1C3644', rock: 'rgba(52,64,92,0.6)', hpl: 'rgba(170,185,240,0.4)', ground: '#1E3C40', trees: '#132A32', grass: '#27504A', stone: '#5E6690', shade: '#363C62', thatch: '#5E5866', thatchS: '#423E50',
    mortar: 'rgba(22,26,54,0.55)', tline: 'rgba(28,26,44,0.6)', nsh: 'rgba(5,8,25,0.35)', ngrass: '#22463F', nstone: '#525A80', nstoneS: '#363C60', nlight: '#2E5A4C', leaf: '#163432', kantu: '#B83A68', bloom: '#C4CCF0', blade: '#2C5246', nline: 'rgba(20,22,48,0.6)'}
};
SCENES.peru = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), bg = Lay(0.6), mid = Lay(0), near = Lay(0), C = peru_C[dk ? 'D' : 'L'], i, k, x;
  var S = ph ? 0.78 : Math.max(0.6, Math.min(1.15, H / 820));
  var sky = dk ? 'linear-gradient(180deg,#0A1430 0%,#1A2650 46%,#3A3A6A 80%,#46426E 100%)' : 'linear-gradient(180deg,#A6D2EE 0%,#E2F0F2 48%,#EEF2DC 80%,#E8EFD4 100%)';
  var sun = [W * (ph ? 0.2 : 0.14), H * (ph ? 0.12 : 0.15)], yP = H * (ph ? 0.85 : 0.815), hpX = W * (ph ? 0.72 : 0.775), hpTop = H * (ph ? 0.34 : 0.27);
  if (!ANIM) add(far, 'a', peru_c(sun[0], sun[1], (ph ? 80 : 130) * S), dk ? 'rgba(160,175,255,0.1)' : 'rgba(255,252,226,0.32)');
  // the far Andes: a pale snowy range, valley mist, then a nearer blue-green one
  var r1 = peru_range(W, H * (ph ? 0.66 : 0.58), [[W * 0.06, H * (ph ? 0.44 : 0.36), W * 0.1, W * 0.13], [W * 0.15, H * (ph ? 0.5 : 0.43), W * 0.05, W * 0.06], [W * 0.34, H * (ph ? 0.5 : 0.41), W * 0.12, W * 0.09, 1.3, 1.4], [W * 0.44, H * (ph ? 0.5 : 0.4), W * 0.05, W * 0.05], [W * 0.52, H * (ph ? 0.42 : 0.31), W * 0.11, W * 0.14, 1.4, 1.5], [W * 0.6, H * (ph ? 0.48 : 0.37), W * 0.04, W * 0.07], [W * 0.8, H * (ph ? 0.52 : 0.44), W * 0.08, W * 0.06], [W * 0.97, H * (ph ? 0.46 : 0.37), W * 0.13, W * 0.1, 1.4, 1.5]], [[H * 0.012, 70, 1]], 5, 3);
  add(far, 'b', below(r1, H + 10), C.r1);
  add(far, 'c', peru_snow(r1, H * (ph ? 0.42 : 0.31), H * 0.05, W * 0.4, W * 0.66) + peru_snow(r1, H * (ph ? 0.44 : 0.36), H * 0.04, -60, W * 0.2) + peru_snow(r1, H * (ph ? 0.46 : 0.37), H * 0.035, W * 0.86, W + 60), C.snow);
  var mist = ''; spread(0, H * (ph ? 0.64 : 0.56), W, H * 0.05, ph ? 120 : 200, 40, rnd, 0.8).forEach(function (c) { mist += peru_e(c.x, c.y, (ph ? 90 : 150) + c.r * 80, 9 + c.k * 8); }); add(far, 'd', mist, C.mist);
  var r2 = peru_range(W, H * (ph ? 0.72 : 0.66), [[W * 0.2, H * (ph ? 0.6 : 0.49), W * 0.13, W * 0.1, 1.8, 1.6], [W * 0.29, H * (ph ? 0.63 : 0.53), W * 0.05, W * 0.06, 1.8], [W * 0.62, H * (ph ? 0.62 : 0.51), W * 0.1, W * 0.12, 1.9, 1.5], [W * 0.88, H * (ph ? 0.6 : 0.48), W * 0.09, W * 0.12, 1.8, 1.5]], [[H * 0.015, 90, 2], [H * 0.006, 33, 0.5]], 5, 3);
  add(far, 'e', below(r2, H + 10), C.r2);
  var mist2 = ''; spread(0, H * (ph ? 0.7 : 0.63), W, H * 0.04, ph ? 110 : 180, 40, rnd, 0.8).forEach(function (c) { mist2 += peru_e(c.x, c.y, (ph ? 80 : 130) + c.r * 70, 7 + c.k * 7); }); add(far, 'f', mist2, C.mist);
  if (!ANIM && !dk) add(far, 'h', peru_c(sun[0], sun[1], (ph ? 26 : 40) * S), 'rgba(255,255,244,0.95)');
  // the valley walls across the gorge, the river far below them, and the mist that lies on it
  var r3 = peru_range(W, H * (ph ? 0.8 : 0.75), [[W * 0.02, H * (ph ? 0.6 : 0.45), W * 0.1, W * 0.28, 2, 1.4], [W * 0.13, H * (ph ? 0.66 : 0.55), W * 0.05, W * 0.06, 2], [W * 1.0, H * (ph ? 0.64 : 0.5), W * 0.22, W * 0.1, 2.2, 1.3], [W * 0.46, H * (ph ? 0.74 : 0.63), W * 0.1, W * 0.1, 2.2, 1.2]], [[H * 0.01, 60, 0.3]], 5, 3);
  add(bg, 'a', below(r3, H + 10), C.r3);
  var tex = ''; spread(0, H * 0.4, W, H * 0.5, ph ? 22 : 30, 18, rnd, 1).forEach(function (c) { var r = (3 + c.r * 4) * S; if (c.q < 0.55 && c.y > peru_yOn(r3, c.x) + r + 2) tex += peru_c(c.x, c.y, r) + peru_c(c.x + r * 0.9, c.y + r * 0.3, r * 0.75); }); add(bg, 'b', tex, C.r3t);
  var rv = function (x) { return H * (ph ? 0.83 : 0.78) + Math.sin(x / (ph ? 60 : 110) + 0.6) * H * 0.016 + Math.sin(x / 37) * 2; }, rw = function (x) { return (4 + 3 * (x / W)) * S; };
  add(bg, 'c', peru_band(function (x) { return rv(x) - rw(x); }, function (x) { return rv(x) + rw(x); }, -20, W + 20, 8), C.river);
  var sh = ''; for (x = 10; x < W; x += ph ? 34 : 46) sh += peru_e(x + (hash(x) - 0.5) * 16, rv(x) - 1, (6 + hash(x + 3) * 8) * S, 0.9); add(bg, 'd', sh, C.shine);
  var vm = ''; spread(0, H * (ph ? 0.78 : 0.72), W, H * 0.06, ph ? 90 : 150, 30, rnd, 0.9).forEach(function (c) { if (c.q < 0.75) vm += peru_e(c.x, c.y, (ph ? 50 : 90) + c.r * 60, 6 + c.k * 7) + peru_e(c.x + 30, c.y - 6, 30 + c.r * 20, 7 + c.k * 4); }); add(bg, 'e', vm, C.vmist);
  // Huayna Picchu, with Huchuy Picchu at its foot: forest on the sunny side, bare rock on the steepest faces, and the
  // tiny summit terraces the Inca built up there
  var hpPk = [[hpX, hpTop, W * (ph ? 0.21 : 0.1), W * (ph ? 0.18 : 0.085), 2.4, 0.75], [hpX + W * 0.01, H * (ph ? 0.54 : 0.46), W * (ph ? 0.4 : 0.2), W * (ph ? 0.38 : 0.2), 1.4, 1.5], [hpX - W * (ph ? 0.19 : 0.135), H * (ph ? 0.68 : 0.6), W * (ph ? 0.08 : 0.06), W * 0.05, 2.2, 0.9], [hpX + W * (ph ? 0.18 : 0.14), H * (ph ? 0.66 : 0.57), W * 0.05, W * 0.09, 2, 1.1]];
  var hp = peru_range(W, H * 0.96, hpPk, [], 4, 1.6).filter(function (p) { return p[0] > hpX - W * (ph ? 0.36 : 0.27) && p[0] < hpX + W * (ph ? 0.4 : 0.3); });
  add(bg, 'f', below(hp, H + 10), C.hp);
  var hv = ''; spread(hpX - W * 0.27, hpTop, W * 0.57, H * 0.96 - hpTop, ph ? 14 : 20, 14, rnd, 1).forEach(function (c) { var r = (3 + c.r * 4.5) * S, yy = peru_yOn(hp, c.x); if (c.y > yy + r + 1 && c.q < (c.x < hpX ? 0.62 : 0.3) - (c.y - hpTop) / H * 0.3) hv += peru_c(c.x, c.y, r) + peru_c(c.x - r * 0.8, c.y + r * 0.4, r * 0.7); }); add(bg, 'g', hv, C.hpv);
  // granite faces: ragged slabs on the steep east flank, tapering down into the forest
  var rock = ''; for (i = 0; i < 6; i++) { var rx = hpX + (0.15 + hash(i + 21) * 0.55) * W * (ph ? 0.12 : 0.07), ry = peru_yOn(hp, rx) + (14 + hash(i + 22) * 30) * S, rl = (30 + hash(i + 23) * 50) * S, ww = (7 + hash(i + 24) * 7) * S;
    if (ry - 6 < peru_yOn(hp, rx - ww) || ry - 6 < peru_yOn(hp, rx + ww)) continue;
    rock += peru_pg([[rx - ww, ry + ww * 0.3], [rx - ww * 0.3, ry], [rx + ww * 0.5, ry + ww * 0.2], [rx + ww, ry + rl * 0.35], [rx + ww * 0.4, ry + rl * 0.6], [rx + ww * 0.2, ry + rl], [rx - ww * 0.3, ry + rl * 0.7], [rx - ww * 0.8, ry + rl * 0.4]]); } add(bg, 'h', rock, C.rock);
  var summ = ''; [9, 16, 23].forEach(function (d, q) { var yy = hpTop + d * S + 2, xl = null, xr = null; hp.forEach(function (p) { if (p[1] < yy) { if (xl === null) xl = p[0]; xr = p[0]; } }); if (xl !== null) summ += 'M' + PT(xl + 2, yy) + ' Q' + PT((xl + xr) / 2, yy + 1.6) + ' ' + PT(xr - 2, yy) + ' '; }); stk(bg, 's', summ, C.hpl, 1.1);
  // the citadel's ridge: a level plateau, the slope falling away to the gorge on the left, a knoll at Huayna Picchu's foot
  var gl = W * (ph ? 0.2 : 0.33), gr = W * (ph ? 0.9 : 0.91), gy = function (x) { return yP + Math.sin(x / 57) * 1.5 + (x < gl ? Math.pow((gl - x) / W, 1.15) * H * 0.6 : 0) + (x > gr ? (x - gr) / W * H * 0.6 : 0) - Math.exp(-Math.pow((x - (hpX - W * 0.05)) / (W * 0.05), 2)) * H * 0.022; };
  var gP = []; for (x = -20; x <= W + 20; x += 6) gP.push([x, gy(x)]); add(mid, 'a', below(gP, H + 10), C.ground);
  // trees of the cloud forest round the edges of the ridge
  var trees = '', tree = function (tx, s) { var ty = gy(tx); for (var q = 0; q < 5; q++) trees += peru_c(tx + (q - 2) * 5.5 * s, ty - (6 + (q % 2) * 6 + (q === 2 ? 8 : 0)) * s, (6 + (q === 2 ? 3 : 0)) * s); trees += rect(tx - 1.4 * s, ty - 8 * s, 2.8 * s, 9 * s); };
  [[gl + W * 0.01, 1.1], [gl - W * 0.02, 0.9], [hpX - W * 0.08, 1.2], [hpX - W * 0.105, 0.9], [gr + W * 0.012, 1], [gr + W * 0.04, 1.2]].forEach(function (q) { tree(q[0], q[1] * S * (ph ? 0.8 : 1)); });
  add(mid, 'b', trees, C.trees);
  // terraces stepping down below the plateau and curving away down the slope
  var nT = ph ? 5 : 7, dh = H * (ph ? 0.02 : 0.024), wh = (ph ? 5 : 8) * S, tk = function (q) { return function (x) { return gy(x) + dh * (q + 0.6) * (1 + 0.1 * q); }; }, terr = '', stone = '', mort = '', shade = '';
  for (k = 0; k < nT; k++) { var xa = gl - W * (ph ? 0.26 : 0.2) - k * W * 0.03, xb = gr + W * 0.01 + k * W * 0.02, f0 = tk(k), f1 = tk(k + 1);
    terr += peru_band(f0, function (x) { return f1(x) - wh; }, xa, xb, 6);
    stone += peru_band(function (x) { return f1(x) - wh; }, f1, xa, xb, 6);
    for (x = xa + 5 + (k % 2) * 5; x < xb - 3; x += (ph ? 8 : 11) * S) { var yb = f1(x); mort += seg(x, yb - wh + 0.8, x + (hash(x + k) - 0.5) * 2, yb - 0.6); } }
  var tFirst = tk(0); terr = peru_band(gy, function (x) { return tFirst(x); }, gl, gr, 6) + terr;
  // the houses: walls of fitted stone with gable ends, trapezoid windows and doorways, some thatched, some open to the sky
  var walls = '', roof = '', roofS = '', thl = '', nsh = '', Bs = ph ? 1.15 : S * 1.35;
  // the front row is built first and remembers its walls, so the back row's shade, windows and doorways stop where a
  // front house stands before them (they share slots, and would otherwise paint over the nearer walls)
  var fronts = [], hid = function (xa, xb, top) { var t = 1e9; fronts.forEach(function (f) { if (xb > f[0] && xa < f[1]) t = Math.min(t, f[top ? 3 : 2]); }); return t; };
  function house(cx, rowUp, w, h, d, roofed) { var yb = gy(cx) - rowUp, x0 = cx - w / 2, yw = yb - h, gh = h * 0.75 * (d / 14), ys = Math.min(yb, hid(x0 + w, x0 + w + d));
    walls += rect(x0, yw, w, h + rowUp); if (!rowUp) fronts.push([x0 - 3 * Bs, x0 + w + d, yw, roofed ? yw - h * 0.75 * (d / 14) - 3 * Bs : yw]);
    if (ys > yw) shade += peru_pg([[x0 + w, ys], [x0 + w, yw], [x0 + w + d / 2, yw - gh], [x0 + w + d, yw], [x0 + w + d, ys]]); else shade += peru_pg([[x0 + w, yw], [x0 + w + d / 2, yw - gh], [x0 + w + d, yw]]);
    for (var q = 0; q < Math.floor(w / (13 * Bs)); q++) { var wx = x0 + (q + 0.5) * w / Math.floor(w / (13 * Bs)), door = q === 1 && !rowUp, wb = door ? yb : yw + h * 0.58;
      if (wb < hid(wx - 3 * Bs, wx + 3 * Bs)) shade += door ? peru_trap(wx, yb - h * 0.72, 6 * Bs, h * 0.72) : peru_trap(wx, yw + h * 0.28, 5 * Bs, h * 0.3); }
    // coursing on the front row only: the back row's would show through the roofs in front of it
    if (!rowUp) for (var cy = yw + 4 * Bs; cy < yb - 1; cy += 4 * Bs) mort += seg(x0 + 1, cy, x0 + w - 1, cy);
    if (roofed) { var ov = 3 * Bs, rh = gh + 3 * Bs; roof += peru_pg([[x0 - ov, yw + ov], [x0 + d / 2 - ov * 0.4, yw - rh], [x0 + w + d / 2 + ov * 0.2, yw - rh], [x0 + w + ov * 0.4, yw + ov]]);
      roofS += peru_pg([[x0 + w + ov * 0.4, yw + ov], [x0 + w + d / 2 + ov * 0.2, yw - rh], [x0 + w + d / 2 + 1.6 * Bs, yw - rh + 2 * Bs], [x0 + w + 1.4 * Bs, yw + ov + 1.4 * Bs]]);
      for (var tx = x0 + 1; tx < x0 + w; tx += 3.2 * Bs) thl += seg(tx, yw + ov - 0.5, tx + d / 2 - ov * 0.4, yw - rh + 1.2);
      nsh += rect(x0, yw + ov, w, 2.4 * Bs); }
    else if (yw + 1.6 * Bs < hid(x0, x0 + w, 1)) nsh += rect(x0 + 1, yw, w - 2, 1.6 * Bs); }
  var row = ph ? [[0.3, 7, 22, 12, 0], [0.58, 7, 20, 12, 0], [0.25, 0, 26, 14, 1], [0.34, 0, 22, 12, 0], [0.53, 0, 28, 14, 1]]
    : [[0.372, 12, 30, 18, 12, 0], [0.418, 12, 34, 20, 14, 0], [0.468, 12, 30, 18, 12, 1], [0.605, 12, 34, 20, 14, 0], [0.656, 12, 28, 17, 12, 1], [0.352, 0, 28, 17, 12, 0], [0.4, 0, 40, 22, 16, 1], [0.448, 0, 26, 16, 12, 0], [0.592, 0, 40, 21, 16, 1], [0.64, 0, 26, 16, 12, 0]];
  row.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (b) { if (ph) house(W * b[0], b[1] * Bs, b[2] * Bs, b[3] * Bs, (b[3] - 2) * Bs, b[4]); else house(W * b[0], b[1] * Bs, b[2] * Bs, b[3] * Bs, b[4] * Bs, b[5]); });
  // the Temple of the Sun (a curved tower on a rock), and the Intihuatana stone on its stepped hill by the knoll
  var tsX = W * (ph ? 0.44 : 0.5), tsY = gy(tsX), tr = 13 * Bs;
  walls += peru_pg([[tsX - tr, tsY], [tsX - tr, tsY - 22 * Bs], [tsX - tr * 0.6, tsY - 25 * Bs], [tsX, tsY - 26 * Bs], [tsX + tr * 0.6, tsY - 25 * Bs], [tsX + tr, tsY - 22 * Bs], [tsX + tr, tsY]]);
  shade += peru_trap(tsX - tr * 0.3, tsY - 17 * Bs, 4.4 * Bs, 6 * Bs) + peru_trap(tsX + tr * 0.4, tsY - 17 * Bs, 4.4 * Bs, 6 * Bs) + peru_pg([[tsX + tr * 0.55, tsY], [tsX + tr * 0.55, tsY - 23 * Bs], [tsX + tr, tsY - 22 * Bs], [tsX + tr, tsY]]);
  for (var cy2 = tsY - 22 * Bs; cy2 < tsY - 1; cy2 += 3.6 * Bs) mort += 'M' + PT(tsX - tr + 1, cy2) + ' Q' + PT(tsX, cy2 + 2.4 * Bs) + ' ' + PT(tsX + tr - 1, cy2) + ' ';
  var ihX = hpX - W * (ph ? 0 : 0.075), ihY = gy(ihX);
  for (k = 0; k < 3; k++) { var hw2 = (26 - k * 7) * Bs, y2 = ihY - k * 6 * Bs; walls += rect(ihX - hw2, y2 - 6 * Bs, hw2 * 2, (k ? 6 : 16) * Bs); shade += rect(ihX - hw2, y2 - 1.6 * Bs, hw2 * 2, 1.6 * Bs); }
  walls += peru_pg([[ihX - 4 * Bs, ihY - 18 * Bs], [ihX - 3 * Bs, ihY - 24 * Bs], [ihX + 1 * Bs, ihY - 27 * Bs], [ihX + 4 * Bs, ihY - 23 * Bs], [ihX + 4.4 * Bs, ihY - 18 * Bs]]);
  // the lone tree in the main plaza, and stairs climbing the terraces
  var plX = W * (ph ? 0.2 : 0.528); trees += peru_c(plX, gy(plX) - 15 * Bs, 7 * Bs) + peru_c(plX - 6 * Bs, gy(plX) - 11 * Bs, 5.5 * Bs) + peru_c(plX + 6 * Bs, gy(plX) - 11 * Bs, 5.5 * Bs) + rect(plX - 1.3 * Bs, gy(plX) - 9 * Bs, 2.6 * Bs, 9 * Bs); add(mid, 'b', trees, C.trees);
  var stX = W * (ph ? 0.4 : 0.535); for (k = 0; k < nT; k++) { var sy0 = tk(k)(stX) - (k ? wh : 0), sy1 = tk(k + 1)(stX); stone += rect(stX - 5 * Bs, sy0, 10 * Bs, sy1 - sy0); for (var q2 = 1; q2 < 4; q2++) mort += seg(stX - 5 * Bs, sy0 + (sy1 - sy0) * q2 / 4, stX + 5 * Bs, sy0 + (sy1 - sy0) * q2 / 4); }
  add(mid, 'c', terr, C.grass); add(mid, 'd', stone + walls, C.stone); add(mid, 'e', shade, C.shade); add(mid, 'f', roof, C.thatch); add(mid, 'g', roofS, C.thatchS); add(mid, 'h', nsh, C.nsh);
  stk(mid, 's', mort, C.mortar, 0.7); stk(mid, 't', thl, C.tline, 0.8);
  // the foreground: the upper terraces where the view is from, curving round and down to the right, kantu bushes in flower
  var nb = H * (ph ? 0.875 : 0.8), nd = H * (ph ? 0.05 : 0.058), nE = W * (ph ? 0.36 : 0.27), nwh = (ph ? 11 : 16) * S;
  var nt = function (q) { var xe = nE + q * W * 0.035; return function (x) { return nb + q * nd + Math.pow(Math.max(0, x) / W, 2) * H * 0.35 + Math.pow(Math.max(0, x - (xe - 50 * S)) / (50 * S), 2) * 40 * S; }; };
  var ng = '', ns = '', nsS = '', nl = '', nbl = '', ntl = '', nE2 = function (q) { return nE + q * W * 0.035; };
  for (k = 0; k < 5; k++) { var g0 = nt(k), g1 = nt(k + 1), xe = nE2(k + 1); if (g0(-20) > H + 10) break;
    ng += peru_band(g0, function (x) { return g1(x) - nwh; }, -20, xe, 5);
    ns += peru_band(function (x) { return g1(x) - nwh; }, g1, -20, xe, 5);
    nsS += peru_band(function (x) { return g1(x) - 2.6 * S; }, g1, -20, xe, 5);
    nl += peru_band(g0, function (x) { return g0(x) + 2.2 * S; }, -20, nE2(k), 5);
    // fitted polygonal blocks: joints that lean a little, staggered course by course
    for (x = -10 + (k % 2) * 9 * S; x < xe - 8; x += (13 + hash(x + k * 7) * 8) * S) { var yb2 = g1(x), yt2 = yb2 - nwh, m = yt2 + nwh * (0.4 + hash(x) * 0.2); ntl += 'M' + PT(x, yt2 + 1) + ' L' + PT(x + 1.4 * S, m) + ' L' + PT(x - 0.6 * S, yb2 - 1) + ' M' + PT(x + 1.4 * S, m) + ' L' + PT(x + (7 + hash(x + 2) * 5) * S, m + (hash(x + 4) - 0.5) * 3) + ' '; } }
  var nEdge = []; for (x = -20; x <= nE2(1); x += 5) nEdge.push([x, nt(0)(x)]);
  // a grassy corner on the right with a stub of old wall
  var cR = peru_pg([[W * 0.8, H + 10], [W * 0.84, H * 0.95], [W * 0.9, H * 0.925], [W + 20, H * 0.9], [W + 20, H + 10]]); ng += cR;
  ns += rect(W * 0.885, H * 0.928 - 12 * S, W * 0.12, 13 * S); ntl += seg(W * 0.9, H * 0.928 - 6 * S, W, H * 0.928 - 6 * S) + seg(W * 0.93, H * 0.928 - 12 * S, W * 0.932, H * 0.928 - 6 * S) + seg(W * 0.97, H * 0.928 - 6 * S, W * 0.968, H * 0.928);
  spread(0, nb, W, H - nb, ph ? 18 : 24, 12, rnd, 1).forEach(function (c) { var inL = c.x < nE2(1) && c.y > peru_yOn(nEdge, c.x) + 4, inR = c.x > W * 0.86 && c.y > H * 0.94; if (c.q < 0.4 && (inL || inR)) nbl += 'M' + PT(c.x - 2, c.y) + ' Q' + PT(c.x - 1, c.y - 5) + ' ' + PT(c.x - 3.4, c.y - 9) + ' M' + PT(c.x + 1, c.y) + ' Q' + PT(c.x + 2, c.y - 5) + ' ' + PT(c.x + 4, c.y - 8) + ' '; });
  // kantu bushes: small leaves round arching stems, magenta trumpet flowers hanging from the tips
  var lv = '', kf = '', wf = '', flowers = [];
  function kantu(bx, by, s) { for (var q = 0; q < 7; q++) { var a = -Math.PI * (0.15 + q / 6 * 0.7), L = (26 + hash(q + bx) * 18) * s, ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
      for (var u = 0.3; u <= 1; u += 0.14) lv += peru_e(bx + Math.cos(a) * L * u + (u * 10 % 2 - 1) * 3 * s, by + Math.sin(a) * L * u, 3.4 * s, 2 * s);
      var fx = ex + 2 * s, fy = ey + 2 * s; kf += peru_pg([[fx - 1.2 * s, fy], [fx + 1.2 * s, fy], [fx + 2.6 * s, fy + 9 * s], [fx - 2.6 * s, fy + 9 * s]]) + peru_e(fx, fy + 9 * s, 3 * s, 1.4 * s); flowers.push([fx, fy + 10 * s]); } }
  kantu(W * (ph ? 0.08 : 0.055), nt(1)(W * (ph ? 0.08 : 0.055)) - 2, (ph ? 0.85 : 1.05) * S); kantu(W * (ph ? 0.9 : 0.94), H * 0.93, (ph ? 0.7 : 0.9) * S);
  spread(0, nb, nE, H - nb, ph ? 40 : 60, 30, rnd, 1).forEach(function (c) { if (c.q < 0.5 && c.y > peru_yOn(nEdge, c.x) + 8) wf += peru_c(c.x, c.y, 1.7 * S) + peru_c(c.x + 4 * S, c.y + 2 * S, 1.4 * S); });
  add(near, 'a', ng, C.ngrass); add(near, 'b', ns, C.nstone); add(near, 'c', nsS, C.nstoneS); add(near, 'd', nl, C.nlight); add(near, 'e', lv, C.leaf); add(near, 'f', kf, C.kantu); add(near, 'g', wf, C.bloom);
  stk(near, 's', nbl, C.blade, 1.1); stk(near, 't', ntl, C.nline, 1);
  // what the engine needs: sky (for stars), the ground's outline (clouds pass behind it), terrace grass for the wind
  var skyL = r1.map(function (p) { return [p[0], p[0] > hp[0][0] && p[0] < hp[hp.length - 1][0] ? Math.min(p[1], peru_yOn(hp, p[0])) : p[1]]; }), skyClip = 'M-40 -40 L' + PT(W + 40, -40) + ' ' + pline(skyL.slice().reverse()).replace(/^M/, 'L') + 'Z ', mask = [];
  for (x = -20; x <= W + 20; x += 6) { var yy = gy(x); if (x < nE2(1)) yy = Math.min(yy, nt(0)(x)); mask.push([x, yy]); }
  var llamas = ph ? [{x: W * 0.615, y: gy(W * 0.615) - 1, s: 0.34, dir: -1, coat: 0}, {x: W * 0.5, y: tk(2)(W * 0.5) - wh - 1, s: 0.42, dir: 1, coat: 1}]
    : [{x: W * 0.558, y: gy(W * 0.558) - 1, s: 0.5 * S, dir: -1, coat: 0}, {x: W * 0.69, y: tk(1)(W * 0.69) - wh - 1, s: 0.62 * S, dir: 1, coat: 1}, {x: W * 0.355, y: tk(3)(W * 0.355) - wh - 1, s: 0.72 * S, dir: 1, coat: 2}];
  if (ANIM) { ANIM.S = S; ANIM.sun = sun; ANIM.skyClip = skyClip; ANIM.mask = below(mask, H + 60); ANIM.terr = terr; ANIM.ngrass = ng; ANIM.hp = [hpX, hpTop]; ANIM.yP = yP; ANIM.llamas = llamas; ANIM.flowers = flowers; ANIM.C = C;
    ANIM.valleys = [[W * (ph ? 0.12 : 0.24), H * (ph ? 0.8 : 0.76)], [W * (ph ? 0.3 : 0.4), H * (ph ? 0.78 : 0.7)], [hpX + W * (ph ? 0.24 : 0.17), H * 0.7], [W * (ph ? 0.98 : 0.98), H * (ph ? 0.83 : 0.8)], [hpX - W * 0.2, H * (ph ? 0.74 : 0.68)]];
    ANIM.gate = [W * (ph ? 0.06 : 0.07), peru_yOn(r3, W * (ph ? 0.06 : 0.07)) - 6]; }
  else {
    var st = '', lb = '', ld = ''; if (dk) spread(0, 0, W, H * 0.5, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.4 && c.y < peru_yOn(r1, c.x) - 8) st += peru_c(c.x, c.y, 0.5 + c.r * 0.9); });
    add(far, 'g', st, 'rgba(255,248,230,0.85)'); if (dk) add(far, 'h', peru_c(sun[0], sun[1], (ph ? 18 : 26) * S), '#F4F0DC');
    llamas.forEach(function (l) { var q = peru_llamaStill(l.x, l.y, l.s, l.dir); lb += q.b; ld += q.d; }); add(near, 'h', lb, dk ? '#A8A8C4' : '#F4ECDA'); stk(near, 't', ld, C.nline, 1);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
