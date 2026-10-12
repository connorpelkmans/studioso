// ---- batch n7: canyon (Slot Canyon), saltflats (Mirror Flats)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n7_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n7_P(pts) { return poly(n7_cw(pts)); }
function n7_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n7_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
// open Catmull-Rom through a list of points (end points kept)
function n7_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n7_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// x of an edge polyline (running downwards) at height y
function n7_xAt(E, y) { if (y <= E[0][1]) return E[0][0]; for (var i = 1; i < E.length; i++) if (E[i][1] >= y) { var a = E[i - 1], b = E[i], f = (y - a[1]) / ((b[1] - a[1]) || 1); return a[0] + (b[0] - a[0]) * f; } return E[E.length - 1][0]; }
// a lumpy stone outline
function n7_stonePts(x, y, rx, ry, rnd) { var p = []; for (var i = 0; i < 18; i++) { var t = i / 18 * Math.PI * 2, s = Math.sin(t), r = 1 + (rnd() - 0.5) * 0.16; p.push([x + Math.cos(t) * rx * r, y + s * ry * r * (s > 0 ? 0.7 : 1)]); } return p; }
// a thin pointed blade (grass, yucca) from a base point, pointing along ang (degrees), bending by bend
function n7_blade(x, y, L, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 10; i++) { var t = i / 10, ww = w * (1 - t) * (t < 0.15 ? 0.6 + t * 2.6 : 1), c = b * L * t * t; up.push([t * L, c - ww]); lo.unshift([t * L, c + ww]); } return n7_P(rotp(up.concat(lo.slice(1)), x, y, ang)); }

// =============== 1. Slot Canyon: looking up and along a narrow, winding sandstone slot with flowing striped walls
// One wall fin of the slot: the off-screen side, an inner edge (a smooth curve running downwards) and, for the deeper fins,
// a rim on top that climbs towards the side of the view. The flowing sandstone stripes are bands between curves that follow
// the inner edge outwards (each band pinches and swells, never crossing the one before it).
function n7_fin(side, ctrl, o) {
  var E = n7_curve(ctrl, 10), W = o.W, out = side < 0 ? -90 : W + 90, x0 = E[0][0], y0 = E[0][1], rnd = o.rnd, k;
  var rimY = function (x) { if (!o.rim) return -95; var d = (x - x0) * side; return d <= 0 ? y0 : y0 - (Math.sqrt(d * d + 900) - 30) * o.rim + Math.sin(d / 17) * 2.4 * Math.min(1, d / 40); };
  var pts = [];
  if (o.rim) { for (var x = out; (x - x0) * side > 0; x -= side * 10) pts.push([x, Math.max(-95, rimY(x))]); } else pts.push([out, -95]);
  E.forEach(function (p) { pts.push(p); }); pts.push([out, E[E.length - 1][1]]);
  var below = function (p) { return p[1] >= rimY(p[0]) + 0.6; }, first = function (B) { for (var j = 0; j < B.length; j++) if (below(B[j])) return j; return B.length; };
  var rimRun = function (xa, xb) { var r = [], n = Math.max(1, Math.ceil(Math.abs(xb - xa) / 8)); for (var j = 1; j < n; j++) { var xx = xa + (xb - xa) * j / n; r.push([xx, Math.max(-95, rimY(xx))]); } return r; };
  // a band between two boundaries (lists of points running downwards, already offset from the edge)
  var band = function (A, B) { var fa = first(A), fb = first(B), a = A.slice(fa), b = B.slice(fb); if (a.length < 2 || b.length < 2) return null; return a.concat(b.slice().reverse(), rimRun(b[0][0], a[0][0])); };
  var bands = [], lines = '', off = E.map(function () { return 0; }), prev = E;
  for (k = 1; k <= o.n; k++) { var w = o.bw * (0.45 + rnd() * 1.0) * (1 + k * 0.1), A = o.amp * (0.3 + rnd()), L = 30 + rnd() * 80, ph = rnd() * 6.28, D = (k === 1 ? 0 : off.base) + w;
    off.base = D; var cur = E.map(function (p, j) { var v = Math.max(off[j] + 1.6, D + A * Math.sin(p[1] / L + ph) + A * 0.4 * Math.sin(p[1] / (L * 0.37) + ph * 2)); off[j] = v; return [p[0] + side * v, p[1]]; });
    var bp = band(prev, cur); if (bp) bands.push({k: k, pts: bp});
    var fc = first(cur); if (cur.length - fc > 1) lines += pline(cur.slice(fc));
    prev = cur; }
  // the lit strip along the inner edge
  var g = E.map(function (p) { return [p[0] + side * o.glow * (0.55 + 0.45 * Math.sin(p[1] / 26 + x0)), p[1]]; }), gp = band(E, g);
  var rimHi = null; if (o.rim) { var rr = [], rb = []; for (var x2 = out; (x2 - x0) * side > -1; x2 -= side * 8) { var yy = Math.max(-95, rimY(x2)); rr.push([x2, yy]); rb.unshift([x2, yy + 2.6 + 1.6 * Math.sin(x2 / 13)]); } rr.push([x0, y0]); rimHi = rr.concat(rb); }
  return {poly: pts, E: E, bands: bands, glow: gp, rimHi: rimHi, lines: lines, rimY: rimY};
}
// slots: a floor, b floor shade and pebbles, c wall base, d e f stripe tones, g lit edges, h stones / sand piles / plants
var n7_SEQ = ['f', 'e', 'f', 'd', 'e', 'd', 'c', 'e', 'd', 'c', 'd', 'c', 'e', 'c', 'd', 'c', 'c', 'd'];
function n7_wall(L, F, tones, line, lw) {
  add(L, 'c', n7_P(F.poly), tones[0]);
  F.bands.forEach(function (b) { var s = n7_SEQ[(b.k - 1) % n7_SEQ.length]; if (s !== 'c') add(L, s, n7_P(b.pts)); });
  L.d.c = tones[1]; L.e.c = tones[2]; L.f.c = tones[3];
  if (F.glow) add(L, 'g', n7_P(F.glow), tones[4]); if (F.rimHi) add(L, 'g', n7_P(F.rimHi), tones[4]);
  stk(L, 's', F.lines, line, lw);
}

SCENES.canyon = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 0.7 : 1.1), refl = Lay(0.45), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800);
  var sky = dk ? 'linear-gradient(180deg,#070A22 0%,#0E1436 20%,#1E1C4A 42%,#33285A 70%,#45305E 100%)' : 'linear-gradient(180deg,#86C0EA 0%,#B8DDF2 14%,#F4F2E0 26%,#FFE6B8 42%,#F8BE7C 100%)';
  var sc = function (a) { return a.map(function (q) { return [q[0] * W, q[1] * H]; }); };
  var cfg = ph ? {
    nL: [[0.37, -0.12], [0.41, 0.03], [0.33, 0.13], [0.23, 0.27], [0.15, 0.42], [0.11, 0.58], [0.09, 0.76], [0.05, 1.12]],
    nR: [[0.65, -0.12], [0.585, 0.03], [0.64, 0.12], [0.75, 0.26], [0.85, 0.42], [0.89, 0.6], [0.91, 0.78], [0.95, 1.12]],
    mL: [[0.44, 0.065], [0.4, 0.15], [0.33, 0.27], [0.28, 0.41], [0.31, 0.55], [0.25, 0.7], [0.22, 0.88], [0.2, 1.12]],
    mR: [[0.56, 0.085], [0.6, 0.18], [0.67, 0.31], [0.72, 0.45], [0.68, 0.59], [0.74, 0.74], [0.78, 0.9], [0.8, 1.12]],
    rL: [[0.465, 0.17], [0.44, 0.27], [0.39, 0.38], [0.42, 0.5], [0.5, 0.6], [0.46, 0.7], [0.42, 1.12]],
    rR: [[0.545, 0.19], [0.57, 0.3], [0.62, 0.42], [0.6, 0.54], [0.575, 0.64], [0.62, 0.75], [0.66, 1.12]],
    farY: 0.31, fl: [0.655, 0.705, 0.775, 0.915]} : {
    nL: [[0.385, -0.12], [0.42, 0.04], [0.36, 0.15], [0.29, 0.3], [0.24, 0.46], [0.205, 0.62], [0.175, 0.8], [0.13, 1.12]],
    nR: [[0.615, -0.12], [0.565, 0.04], [0.6, 0.14], [0.68, 0.3], [0.74, 0.47], [0.785, 0.64], [0.825, 0.82], [0.87, 1.12]],
    mL: [[0.448, 0.07], [0.428, 0.17], [0.378, 0.29], [0.345, 0.43], [0.372, 0.57], [0.33, 0.71], [0.3, 0.88], [0.28, 1.12]],
    mR: [[0.545, 0.1], [0.565, 0.2], [0.615, 0.32], [0.652, 0.46], [0.622, 0.6], [0.667, 0.74], [0.7, 0.9], [0.72, 1.12]],
    rL: [[0.47, 0.17], [0.456, 0.27], [0.422, 0.38], [0.442, 0.5], [0.49, 0.6], [0.466, 0.7], [0.44, 1.12]],
    rR: [[0.536, 0.19], [0.552, 0.3], [0.587, 0.42], [0.572, 0.54], [0.556, 0.64], [0.59, 0.74], [0.61, 1.12]],
    farY: 0.31, fl: [0.655, 0.7, 0.765, 0.905]};
  var T = dk ? {
    near: ['#1A1532', '#241B40', '#30224E', '#3D2A5C', '#8E9EE0'], mid: ['#221A3E', '#2D2250', '#3A2A5E', '#48336C', '#9AABEC'],
    refl: ['#2E2450', '#3A2D60', '#46366C', '#544078', '#AAB8F0'], far: ['#3E3264', '#4A3C72', '#56467E', '#62508A', '#C0CAF4'],
    floor: ['#5E4E7E', '#524474', '#463A6A', '#3C325E'], fshade: ['rgba(30,22,60,0.35)', 'rgba(30,22,60,0.35)', 'rgba(26,20,52,0.4)', 'rgba(24,18,48,0.45)'],
    line: ['rgba(10,6,30,0.35)', 'rgba(12,8,34,0.3)', 'rgba(14,10,38,0.25)', 'rgba(20,14,50,0.2)']} : {
    near: ['#6A2C4A', '#86384F', '#AC4C47', '#CC6A41', '#FFB56C'], mid: ['#7A3A4E', '#984648', '#B85A41', '#D67646', '#FFC27E'],
    refl: ['#A04E4C', '#B85E47', '#CE7A4A', '#E29454', '#FFD596'], far: ['#D8885A', '#E2985F', '#EAAA6A', '#F0BC7C', '#FFE6B8'],
    floor: ['#F4C392', '#ECB282', '#E2A274', '#D48F68'], fshade: ['rgba(190,110,70,0.25)', 'rgba(180,100,64,0.28)', 'rgba(160,84,58,0.3)', 'rgba(140,70,52,0.32)'],
    line: ['rgba(70,16,40,0.22)', 'rgba(80,20,40,0.2)', 'rgba(110,40,40,0.18)', 'rgba(150,70,40,0.16)']};
  // the strip of sky: sun glow and a few wisps by day; at night the Milky Way glow (the stars themselves are drawn live)
  if (!dk) { var cl = ''; [[0.47, 0.035, 1], [0.54, 0.11, 0.7], [0.5, 0.2, 0.55]].forEach(function (q) { var x = W * q[0], y = H * q[1], s = q[2] * (ph ? 0.6 : 1); cl += n7_E(x, y, 46 * s, 8 * s) + n7_C(x - 14 * s, y - 5 * s, 11 * s) + n7_C(x + 10 * s, y - 7 * s, 14 * s); }); add(far, 'b', cl, 'rgba(255,255,255,0.85)'); }
  // the far wall where the slot turns, lit by bounced light: layered strata following its rim
  var fy = H * cfg.farY, rimF = function (x) { var d = x - W * 0.5; return fy - (Math.sqrt(d * d + 3600) - 60) * (ph ? 0.42 : 0.26) + Math.sin(x / 21) * 3 + Math.sin(x / 57) * 5; };
  var fTop = []; for (var x = -90; x <= W + 90; x += 8) fTop.push([x, rimF(x)]);
  var farPoly = fTop.concat([[W + 90, H * 1.12], [-90, H * 1.12]]); add(far, 'c', n7_P(farPoly), T.far[0]);
  var D = 0, prevB = fTop.map(function (p) { return [p[0], p[1]]; }), fl = ''; for (var k = 1; k <= 12; k++) { var w = (ph ? 7 : 11) * (0.5 + rnd()) * (1 + k * 0.12), A = 3 + rnd() * 5, L = 30 + rnd() * 60, p0 = rnd() * 6; D += w;
    var cur = fTop.map(function (p, j) { return [p[0], Math.max(prevB[j][1] + 1.2, p[1] + D + A * Math.sin(p[0] / L + p0))]; }); var sl = n7_SEQ[(k - 1) % n7_SEQ.length];
    if (sl !== 'c') add(far, sl, n7_P(prevB.concat(cur.slice().reverse()))); fl += pline(cur); prevB = cur; }
  far.d.c = T.far[1]; far.e.c = T.far[2]; far.f.c = T.far[3];
  add(far, 'g', n7_P(fTop.concat(fTop.map(function (p) { return [p[0], p[1] + 3]; }).reverse())), T.far[4]); stk(far, 's', fl, T.line[3], ph ? 0.8 : 1.1);
  // the deepest floor, with a soft haze of bounced light over it
  var floorAt = function (lvl) { var y0 = H * cfg.fl[lvl]; return function (x) { return y0 + Math.sin(x / 70 + lvl) * 3 - (lvl === 3 ? H * 0.035 * Math.pow((x - W * 0.5) / (W * 0.42), 2) : 0); }; };
  var floorPoly = function (lvl) { var f = floorAt(lvl), p = []; for (var x2 = -90; x2 <= W + 90; x2 += 10) p.push([x2, f(x2)]); return p.concat([[W + 90, H * 1.15], [-90, H * 1.15]]); };
  var ripples = function (lvl, n, sp) { var d = '', y0 = H * cfg.fl[lvl]; for (var r = 0; r < n; r++) { var yy = y0 + (r + 0.6) * sp, xs = W * 0.5 + (rnd() - 0.5) * W * 0.3, ln = (40 + rnd() * 90) * S * (1 + lvl * 0.4); d += 'M' + PT(xs - ln, yy + 2) + ' q' + n1(ln * 0.5) + ' ' + n1(-4 * S) + ' ' + n1(ln) + ' 0 t' + n1(ln) + ' 0 '; } return d; };
  add(far, 'a', n7_P(floorPoly(0)), T.floor[0]);
  add(far, 'h', n7_E(W * 0.5, H * cfg.fl[0] - H * 0.02, W * (ph ? 0.2 : 0.12), H * 0.06), dk ? 'rgba(150,150,230,0.12)' : 'rgba(255,240,200,0.35)');
  // the deeper pair of fins
  var fo = {W: W, rnd: rnd, rim: 0.42, n: 9, bw: (ph ? 7 : 10), amp: 4, glow: ph ? 2.4 : 3.2};
  var rL = n7_fin(-1, sc(cfg.rL), fo), rR = n7_fin(1, sc(cfg.rR), fo);
  add(refl, 'a', n7_P(floorPoly(1)), T.floor[1]); stk(refl, 't', ripples(1, 2, H * 0.016), T.fshade[1], ph ? 0.8 : 1.2);
  n7_wall(refl, rL, T.refl, T.line[2], ph ? 0.7 : 1); n7_wall(refl, rR, T.refl, T.line[2], ph ? 0.7 : 1);
  // the middle pair of fins (the ledge the sand trickles from is on the left one)
  var mo = {W: W, rnd: rnd, rim: 0.48, n: 12, bw: (ph ? 9 : 13), amp: 6, glow: ph ? 3 : 4.2};
  var mL = n7_fin(-1, sc(cfg.mL), mo), mR = n7_fin(1, sc(cfg.mR), mo);
  add(mid, 'a', n7_P(floorPoly(2)), T.floor[2]); stk(mid, 't', ripples(2, 3, H * 0.022), T.fshade[2], ph ? 1 : 1.5);
  n7_wall(mid, mL, T.mid, T.line[1], ph ? 0.8 : 1.2); n7_wall(mid, mR, T.mid, T.line[1], ph ? 0.8 : 1.2);
  var ledgeY = H * (ph ? 0.33 : 0.34), ledgeX = n7_xAt(mL.E, ledgeY), fl2 = floorAt(2), pileX = ledgeX + (ph ? 6 : 9), pileY = fl2(pileX) + (ph ? 6 : 10);
  var pile = n7_P([[pileX - 34 * S, pileY + 4], [pileX - 12 * S, pileY - 9 * S], [pileX, pileY - 12 * S], [pileX + 14 * S, pileY - 7 * S], [pileX + 38 * S, pileY + 4]]);
  var mpeb = ''; [[0.4, 0.795, 5], [0.57, 0.81, 7], [0.62, 0.79, 4], [0.45, 0.83, 4]].forEach(function (q) { mpeb += n7_P(n7_stonePts(W * q[0], H * q[1], q[2] * S * 1.4, q[2] * S, rnd)); });
  add(mid, 'h', pile + mpeb, T.floor[2]);
  // the nearest walls framing the view
  var no = {W: W, rnd: rnd, rim: 0, n: 16, bw: (ph ? 10 : 17), amp: 9, glow: ph ? 3.6 : 5.4};
  var nL = n7_fin(-1, sc(cfg.nL), no), nR = n7_fin(1, sc(cfg.nR), no);
  var fl3 = floorAt(3);
  add(near, 'a', n7_P(floorPoly(3)), T.floor[3]); stk(near, 't', ripples(3, 3, H * 0.026), T.fshade[3], ph ? 1.2 : 1.8);
  n7_wall(near, nL, T.near, T.line[0], ph ? 0.9 : 1.4); n7_wall(near, nR, T.near, T.line[0], ph ? 0.9 : 1.4);
  // pebbles and little desert plants on the near sand, at the foot of the walls
  var peb = ''; spread(W * 0.18, H * 0.925, W * 0.64, H * 0.06, ph ? 60 : 90, 30, rnd, 1).forEach(function (c) { if (c.q < 0.5) { var r = (2.5 + c.r * 5) * S * 1.4, pp = n7_stonePts(c.x, Math.max(c.y, fl3(c.x) + 8), r * 1.3, r, rnd); peb += n7_P(pp); } });
  // fallen sandstone boulders at the foot of the walls, their tops catching the light
  var bld = '', bldHi = ''; [[n7_xAt(nL.E, H * 0.97) + 70 * S, 0.975, 34, 0], [n7_xAt(nR.E, H * 0.97) - 64 * S, 0.985, 28, 1], [W * 0.62, 0.95, 13, 2]].forEach(function (q) { var r = q[2] * S * (ph ? 1.25 : 1), bx = q[0], by = H * q[1], pp = n7_stonePts(bx, by, r * 1.35, r * 0.85, rnd); bld += n7_P(pp);
    bldHi += n7_P(pp.filter(function (p, j) { return j >= 10 && j <= 16; }).concat([[bx + r * 0.6, by - r * 0.45], [bx - r * 0.3, by - r * 0.55]])); });
  add(near, 'b', peb + bld, dk ? '#2C2448' : '#B26E56'); add(near, 'g', bldHi);
  var plant = '', blossom = '', st = [];
  var tuft = function (x, y, s, n) { for (var j = 0; j < n; j++) { var a = -90 + (j - (n - 1) / 2) * (70 / n) + (rnd() - 0.5) * 10; plant += n7_blade(x + (j - n / 2) * 1.6 * s, y, (26 + rnd() * 18) * s, 1.8 * s, a, (a < -90 ? -0.25 : 0.25)); } };
  var shrub = function (x, y, s) { for (var j = 0; j < 9; j++) { var a = -160 + j * 17.5, L2 = (20 + rnd() * 10) * s; plant += n7_blade(x, y, L2, 2.4 * s, a, 0.1 * (j < 4 ? -1 : 1)); if (j % 2 === 0) { var aa = a * Math.PI / 180; st.push([x + Math.cos(aa) * L2 * 0.9, y + Math.sin(aa) * L2 * 0.9]); } } };
  var lx = n7_xAt(nL.E, H * 0.93) + 16 * S, rx = n7_xAt(nR.E, H * 0.94) - 18 * S;
  tuft(lx + 6 * S, fl3(lx) + 22 * S, 1.1 * S * (ph ? 1.3 : 1), 7); shrub(lx + 40 * S * (ph ? 1.3 : 1), fl3(lx) + 30 * S, S * (ph ? 1.4 : 1.15)); tuft(rx, fl3(rx) + 20 * S, S * (ph ? 1.3 : 1), 6); tuft(rx - 30 * S, fl3(rx) + 34 * S, 0.7 * S * (ph ? 1.3 : 1), 5);
  tuft(W * 0.36, H * (ph ? 0.775 : 0.77) + 4, 0.45 * S * (ph ? 1.4 : 1), 5);
  add(near, 'h', plant, dk ? '#3A4A58' : '#7E9A58');
  st.forEach(function (p) { blossom += n7_C(p[0], p[1], 2.6 * S * (ph ? 1.3 : 1)); }); add(near, 'g', blossom);
  if (ANIM) {
    ANIM.mask = n7_P(farPoly) + n7_P(rL.poly) + n7_P(rR.poly) + n7_P(mL.poly) + n7_P(mR.poly); ANIM.crack = [W * 0.5, H * cfg.farY];
    ANIM.nearMask = n7_P(nL.poly) + n7_P(nR.poly); ANIM.S = S * (ph ? 0.9 : 1); ANIM.ph = ph;
    ANIM.walls = [farPoly, rL.poly, rR.poly, mL.poly, mR.poly, nL.poly, nR.poly];
    ANIM.floors = [floorAt(0), floorAt(1), floorAt(2), floorAt(3)]; ANIM.flY = cfg.fl.map(function (f) { return f * H; });
    ANIM.top = [n7_xAt(nL.E, 0), n7_xAt(nR.E, 0)];
    ANIM.ledge = [ledgeX + 2 * S, ledgeY + 2 * S]; ANIM.pile = [pileX, pileY - 10 * S]; ANIM.ledgeTip = [ledgeX + 19 * S, ledgeY - 1 * S];
    ANIM.edges = [nL.E, nR.E, mL.E, mR.E];
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Mirror Flats: a white salt flat under a thin sheet of water that mirrors the sky, with hexagonal crust where it's dry
// a flat-bottomed cumulus built from puffs: base (shadowed), lit tops toward the sun, a bright rim and a flat underside
function n7_cloud(x, y, w, h, rnd, sunX) { var o = {base: '', lit: '', rim: ''}, n = 5 + Math.floor(w / 60), lean = sunX > x ? 1 : -1, puffs = [], i;
  for (i = 0; i < n; i++) { var u = i / (n - 1), bump = Math.sin(Math.PI * Math.pow(u, 0.9)), r = h * (0.28 + 0.5 * bump) * (0.8 + rnd() * 0.45); puffs.push([x - w / 2 + u * w + (rnd() - 0.5) * w * 0.05, y - r * 0.5 - bump * h * 0.18, r]); }
  // a second row of towers on top, off-centre
  for (i = 0; i < Math.max(2, n - 3); i++) { var u2 = 0.22 + 0.56 * i / Math.max(1, n - 4) + (rnd() - 0.5) * 0.08, r2 = h * (0.3 + 0.28 * Math.sin(Math.PI * u2)) * (0.75 + rnd() * 0.4); puffs.push([x - w / 2 + u2 * w, y - h * 0.62 - r2 * 0.5, r2]); }
  puffs.forEach(function (p, j) { o.base += n7_C(p[0], p[1], p[2]); o.lit += n7_C(p[0] + lean * p[2] * 0.14, p[1] - p[2] * 0.2, p[2] * 0.84); if (j >= n || p[2] > h * 0.5) o.rim += n7_C(p[0] + lean * p[2] * 0.22, p[1] - p[2] * 0.36, p[2] * 0.58); });
  o.base += n7_E(x, y - h * 0.08, w * 0.54, h * 0.14); return o; }
// mirror a path string about the water line y = hy: absolute M/L points flip, relative arcs flip their sweep and dy, relative curves and v negate y
// (mirrored shapes all wind the other way, so shapes in one slot still union)
function n7_flipD(d, hy) { return d.replace(/([MLaZhvqtc])([^MLaZhvqtc]*)/g, function (m, cmd, args) { var n = args.trim() ? args.trim().split(/[\s,]+/).map(parseFloat) : [], i;
  if (cmd === 'M' || cmd === 'L') { for (i = 1; i < n.length; i += 2) n[i] = n1(2 * hy - n[i]); }
  else if (cmd === 'a') { for (i = 0; i + 6 < n.length + 1; i += 7) { n[i + 4] = n[i + 4] ? 0 : 1; n[i + 6] = -n[i + 6]; } }
  else if (cmd === 'v') n = n.map(function (q) { return -q; });
  else if (cmd === 'q' || cmd === 't' || cmd === 'c') { for (i = 1; i < n.length; i += 2) n[i] = -n[i]; }
  return cmd + (n.length ? n.join(' ') : '') + ' '; }); }

SCENES.saltflats = function (W, H, dk, rnd) {
  var ph = H > W, hy = Math.round(H * (ph ? 0.47 : 0.52)), far = Lay(dk ? 0.4 : 1.2), refl = Lay(dk ? 0.7 : 0.9), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, k, cx = W * 0.5;
  var hf = hy / H * 100, C = dk ? ['#080B26', '#141A44', '#2E2D66', '#57487E'] : ['#97AEDC', '#C2B6E2', '#F2C2D0', '#FFE2C2'];
  var R = C.map(function (c, j) { return mix(c, dk ? '#06081C' : '#8A7AB0', dk ? 0.18 : 0.1 + j * 0.02); });
  var sky = 'linear-gradient(180deg,' + C[0] + ' 0%,' + C[1] + ' ' + n1(hf * 0.38) + '%,' + C[2] + ' ' + n1(hf * 0.74) + '%,' + C[3] + ' ' + n1(hf) + '%,' + C[3] + ' 100%)';
  var bh = H - hy, bp = function (f) { return n1(hy * f / bh * 100) + '%'; };
  var band = {top: hy, bg: 'linear-gradient(180deg,' + R[3] + ' 0%,' + R[2] + ' ' + bp(0.26) + ',' + R[1] + ' ' + bp(0.62) + ',' + R[0] + ' ' + bp(1) + ')'};
  // the low sun (and its twin in the water), or the moon and the stars and theirs
  var sunX = W * (ph ? 0.68 : 0.64), sunY = hy - H * (ph ? 0.06 : 0.075), sr = ph ? 17 : 25, mx = W * (ph ? 0.5 : 0.58), my = H * (ph ? 0.12 : 0.15), mr = ph ? 14 : 20;
  if (dk) {
    add(far, 'a', n7_C(mx, my, mr * 2.6) + n7_C(mx, 2 * hy - my, mr * 2.6), 'rgba(200,200,255,0.1)'); add(far, 'b', n7_C(mx, my, mr * 1.5) + n7_C(mx, 2 * hy - my, mr * 1.5), 'rgba(220,220,255,0.12)');
    add(far, 'c', n7_C(mx, my, mr), '#F4F0E0'); add(far, 'd', n7_C(mx - mr * 0.3, my - mr * 0.2, mr * 0.22) + n7_C(mx + mr * 0.35, my + mr * 0.3, mr * 0.15), 'rgba(200,190,170,0.5)');
    add(refl, 'a', n7_C(mx, 2 * hy - my, mr), '#CFCBD0');
    var st = '', st2 = ''; spread(0, 0, W, hy - 4, ph ? 26 : 30, ph ? 26 : 30, rnd, 1).forEach(function (c) { if (c.q < 0.62 && Math.hypot(c.x - mx, c.y - my) > mr * 2.4) { var r = 0.45 + c.r * c.r * 1.3; st += n7_C(c.x, c.y, r); st2 += n7_C(c.x, 2 * hy - c.y, r * 0.9); } });
    add(far, 'e', st, 'rgba(255,250,240,0.9)'); add(far, 'f', st2, 'rgba(235,232,255,0.6)');
  } else {
    [[3.4, 0.08], [2.2, 0.12], [1.5, 0.2]].forEach(function (q, j) { add(far, 'abc'[j], n7_C(sunX, sunY, sr * q[0]) + n7_C(sunX, 2 * hy - sunY, sr * q[0]), 'rgba(255,240,215,' + q[1] + ')'); });
    add(far, 'd', n7_C(sunX, sunY, sr), '#FFF6E2'); add(far, 'e', n7_C(sunX, 2 * hy - sunY, sr), '#FFEBD2');
    add(far, 'f', n7_E(W * 0.5, hy, W * 0.7, H * 0.012), 'rgba(255,246,230,0.55)');
  }
  // low clouds along the horizon, behind the hills
  var lowC = ''; for (i = 0; i < (ph ? 4 : 7); i++) { var lx = W * (i + 0.5) / (ph ? 4 : 7) + (rnd() - 0.5) * 60, ly = hy - H * (0.03 + rnd() * 0.03), lw = (ph ? 70 : 120) * (0.7 + rnd() * 0.6); lowC += n7_E(lx, ly, lw, 6 + rnd() * 4) + n7_C(lx - lw * 0.3, ly - 4, 9 + rnd() * 6) + n7_C(lx + lw * 0.1, ly - 6, 11 + rnd() * 7); }
  add(far, 'g', lowC + n7_flipD(lowC, hy), dk ? 'rgba(90,80,140,0.45)' : 'rgba(255,226,226,0.75)');
  // far low mountains: a hazy range with sunlit faces, and a darker nearer ridge on the left; all mirrored below
  var rng = [], pk = [], np = ph ? 5 : 9; for (i = 0; i <= np; i++) pk.push([-60 + (W + 120) * i / np + (rnd() - 0.5) * W / np * 0.6, hy - H * (0.022 + rnd() * (ph ? 0.035 : 0.042))]);
  for (i = 0; i < pk.length; i++) { rng.push(pk[i]); if (i < pk.length - 1) { var nx = pk[i + 1]; rng.push([(pk[i][0] + nx[0]) / 2 + (rnd() - 0.5) * 16, Math.max(pk[i][1], nx[1]) + H * (0.006 + rnd() * 0.012)]); } }
  var rough = []; for (i = 0; i < rng.length - 1; i++) { var A0 = rng[i], B0 = rng[i + 1]; for (var j0 = 0; j0 < 4; j0++) { var f0 = j0 / 4; rough.push([A0[0] + (B0[0] - A0[0]) * f0, A0[1] + (B0[1] - A0[1]) * f0 + (j0 ? (rnd() - 0.5) * 3 : 0)]); } } rough.push(rng[rng.length - 1]);
  var mtn = n7_P(rough.concat([[W + 60, hy], [-60, hy]])), lit2 = '';
  for (k = 0; k < rng.length - 1; k += 2) { var p = rng[k], q2 = rng[k + 1]; lit2 += n7_P([p, [q2[0], q2[1]], [q2[0] - (q2[0] - p[0]) * 0.1, hy], [p[0] + (q2[0] - p[0]) * 0.25, hy], [p[0] + (q2[0] - p[0]) * 0.12, p[1] + (hy - p[1]) * 0.5]]); }
  add(far, 'h', mtn, dk ? '#262650' : '#A898C8');
  add(refl, 'b', n7_flipD(mtn, hy), dk ? '#1C1C44' : '#9C8CC0');
  var near2 = []; for (x = -60; x <= W * (ph ? 0.5 : 0.36); x += 10) { var u = (x + 60) / (W * (ph ? 0.5 : 0.36) + 60); near2.push([x, hy - H * (ph ? 0.05 : 0.06) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1)), 0.7) * (0.85 + 0.15 * Math.sin(x / 9))]); }
  var mesa = n7_P(near2.concat([[near2[near2.length - 1][0], hy], [-60, hy]]));
  add(mid, 'a', lit2, dk ? '#30305E' : '#B8A8D2'); add(mid, 'b', mesa, dk ? '#1E1C42' : '#8676AE');
  add(refl, 'c', n7_flipD(lit2, hy), dk ? '#24244E' : '#AA9ACA'); add(refl, 'd', n7_flipD(mesa, hy), dk ? '#16163A' : '#7C6CA4');
  stk(refl, 's', seg(-60, hy, W + 60, hy), dk ? 'rgba(170,160,220,0.45)' : 'rgba(255,248,240,0.9)', 1.4);
  // the big clouds of the sunset (thin wisps only at night) and their mirror images
  var clouds = dk ? [[0.3, 0.3, 0.3, 0.05], [0.68, 0.36, 0.26, 0.04]] : (ph ? [[0.3, 0.17, 0.62, 0.11], [0.78, 0.3, 0.5, 0.08], [0.2, 0.37, 0.36, 0.05]] : [[0.24, 0.2, 0.3, 0.13], [0.7, 0.15, 0.24, 0.1], [0.5, 0.33, 0.16, 0.06], [0.9, 0.36, 0.14, 0.05], [0.08, 0.4, 0.12, 0.04]]);
  var cb = '', cl = '', cr = '';
  if (dk) clouds.forEach(function (q) { var x0 = W * q[0], y0 = H * q[1], w0 = W * q[2] * (ph ? 1.6 : 1); for (var j = 0; j < 5; j++) { var ex = x0 + (j - 2) * w0 * 0.2 + (rnd() - 0.5) * 20, ey = y0 + (rnd() - 0.5) * 8 - Math.sin(Math.PI * j / 4) * 6; cb += n7_E(ex, ey, w0 * (0.28 + rnd() * 0.12), 5 + rnd() * 4); cl += n7_E(ex + 6, ey - 2, w0 * 0.2, 2.5 + rnd() * 1.5); } });
  else clouds.forEach(function (q) { var o = n7_cloud(W * q[0], H * q[1], W * q[2], H * q[3] * (ph ? 0.8 : 1), rnd, sunX); cb += o.base; cl += o.lit; cr += o.rim; });
  var CC = dk ? ['rgba(70,66,120,0.55)', 'rgba(130,126,190,0.45)', '#5A5A96', '#24244E'] : ['#DDB2CC', '#F6CFD6', '#FFF0E2', '#C9A2C6'], RC = CC.map(function (c) { return c.charAt(0) === '#' ? mix(c, dk ? '#0A0C24' : '#9A86B6', 0.14) : c.replace(/[\d.]+\)$/, '0.35)'); });
  add(refl, 'e', n7_flipD(cb, hy), RC[0]); add(refl, 'f', n7_flipD(cl, hy), RC[1]); add(refl, 'g', n7_flipD(cr, hy), RC[2]); 
  // perspective on the flat: ground point (X, Z) -> screen, with Z = c at the bottom edge
  var c = H - hy, P2 = function (X, Z) { var yy = hy + c * c / Z; return [cx + X * (yy - hy) / c, yy]; };
  // salt cones (harvest mounds) standing in the shallows: shaded side, sunlit side, and a reflection under each
  var cones = '', conesL = '', conesR = '';
  var cz = ph ? [[-120, 3.4], [-100, 4.4], [-84, 5.6], [-72, 7.2]] : [[-420, 3.3], [-372, 4.0], [-334, 4.9], [-302, 6.0], [-276, 7.4], [-256, 9.2]];
  cz.forEach(function (q) { var Z = c * q[1], b = P2(q[0] * (ph ? 1 : 1.2), Z), sc2 = c / Z, w = 84 * sc2 * S * (ph ? 1.4 : 1.3), h = 34 * sc2 * S * (ph ? 1.4 : 1.3), ptsT = [];
    for (var j = 0; j <= 12; j++) { var u2 = j / 12, xx = b[0] - w / 2 + u2 * w, d = Math.abs(u2 - 0.5) * 2; ptsT.push([xx, b[1] - h * Math.pow(1 - Math.pow(d, 1.5), 0.85) * (1 - 0.05 * Math.sin(u2 * 9))]); }
    cones += n7_P(ptsT.concat([[b[0] + w / 2, b[1] + 1], [b[0] - w / 2, b[1] + 1]]));
    conesR += n7_P(ptsT.filter(function (pp, j) { return j >= 4; }).concat([[b[0] + w / 2, b[1] + 1], [b[0] + w * 0.1, b[1] + 1], [b[0] - w * 0.05, b[1] - h * 0.5]]));
    conesL += n7_P(ptsT.map(function (pp) { return [pp[0], 2 * b[1] - pp[1] + 1]; }).concat([[b[0] - w / 2, b[1]], [b[0] + w / 2, b[1]]])); });
  // clouds and cones share slots (clouds only above the horizon, cones only below it)
  add(mid, 'c', cb + cones, CC[0]); add(mid, 'd', cl, CC[1]); add(mid, 'e', cr + conesR, CC[2]);
  add(mid, 'g', conesL, dk ? 'rgba(110,112,170,0.35)' : 'rgba(246,226,232,0.5)');
  // dry islands of hexagonal salt crust (near layer): a wet darker margin, white raised ridges, plates of two tones and lit crests
  var hr = (ph ? 20 : 30) * (ph ? 1 : S), hx = hr * 1.5, hz = hr * Math.sqrt(3), thick = '', margin = '', ridge = '', plate = '', plate2 = '', crest = '';
  var patches = ph ? [[-150, 1.05, 160, 0.42], [175, 1.15, 150, 0.5], [50, 2.2, 80, 0.3], [-40, 3.4, 70, 0.45], [120, 4.4, 100, 0.7]] : [[-470, 1.0, 330, 0.36], [500, 1.08, 300, 0.46], [150, 2.1, 130, 0.26], [-40, 3.1, 150, 0.45], [360, 3.8, 230, 0.6], [-330, 5.2, 200, 0.9]];
  var inPatch = function (X, Z) { for (var j = 0; j < patches.length; j++) { var pp = patches[j], dx2 = (X - pp[0]) / pp[2], dz = (Z / c - pp[1]) / pp[3], n = 1 + 0.18 * Math.sin(X * 0.05 + Z * 0.03 + j) + 0.1 * Math.sin(X * 0.13 - j); if (dx2 * dx2 + dz * dz < n) return true; } return false; };
  for (var zi = 0; zi < 400; zi++) { var Zc = c * 0.86 + zi * hz * 0.5; if (Zc > c * 7) break;
    for (var xi = -60; xi <= 60; xi++) { var Xc = xi * hx, odd = ((xi % 2) + 2) % 2; if ((zi % 2) !== odd || !inPatch(Xc, Zc)) continue;
      var pc = P2(Xc, Zc); if (pc[0] < -100 || pc[0] > W + 100) continue;
      var hexA = [], hexB = [], hexC = []; for (var a = 0; a < 6; a++) { var an = a * Math.PI / 3, ox = Math.cos(an) * hr, oz = Math.sin(an) * hr; hexA.push(P2(Xc + ox * 1.14, Zc + oz * 1.14)); hexB.push(P2(Xc + ox * 1.02, Zc + oz * 1.02)); hexC.push(P2(Xc + ox * 0.8, Zc + oz * 0.8)); }
      thick += n7_P(hexA.map(function (q) { return [q[0], q[1] + Math.max(0.6, (q[1] - hy) * 0.012)]; })); margin += n7_P(hexA); ridge += n7_P(hexB); if (rnd() < 0.5) plate += n7_P(hexC); else plate2 += n7_P(hexC);
      crest += pline([hexC[3], hexC[4], hexC[5], hexC[0]]); } }
  add(near, 'a', thick, dk ? '#181838' : '#B8A0BC'); add(near, 'b', margin, dk ? '#2A2A56' : '#DCC8D6'); add(near, 'c', ridge, dk ? '#A2A2D2' : '#FFFAF4'); add(near, 'd', plate, dk ? '#6E70A4' : '#EEE2E6'); add(near, 'e', plate2, dk ? '#76789E' : '#F3E9EA');
  stk(near, 's', crest, dk ? 'rgba(210,214,255,0.45)' : 'rgba(255,255,255,0.9)', ph ? 0.8 : 1.1);
  if (ANIM) {
    ANIM.hy = hy; ANIM.sun = [sunX, sunY, sr]; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ph = ph; ANIM.c = c;
    ANIM.cloudD = cb; ANIM.cloudRD = n7_flipD(cb, hy); ANIM.coneD = cones + conesL; ANIM.moon = dk ? [mx, my, mr] : null;
  }
  return {sky: sky, band: band, far: far, refl: refl, mid: mid, near: near};
};
