// ---- world theme: italy (Amalfi Coast)
// Shared helpers. Every shape here is drawn clockwise (like rect()), so shapes that share a layer slot always merge.
function italy_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function italy_pg(p) { return p.length < 3 ? '' : poly(italy_area(p) < 0 ? p.slice().reverse() : p); }
function italy_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function italy_c(x, y, r) { return italy_e(x, y, r, r); }
// piecewise-linear lookup in a list of points sorted by coordinate a (0 = x, 1 = y), returning coordinate 1 - a
function italy_lin(pts, v, a) { var b = 1 - a, n = pts.length; if (v <= pts[0][a]) return pts[0][b]; if (v >= pts[n - 1][a]) return pts[n - 1][b];
  for (var i = 1; i < n; i++) if (v <= pts[i][a]) { var f = (v - pts[i - 1][a]) / ((pts[i][a] - pts[i - 1][a]) || 1); return pts[i - 1][b] + (pts[i][b] - pts[i - 1][b]) * f; } return pts[n - 1][b]; }
// a window with a round arched top: x, y top-left, w wide, h tall
function italy_arch(x, y, w, h) { var r = w / 2; return 'M' + PT(x, y + h) + ' L' + PT(x, y + r) + ' A' + n1(r) + ' ' + n1(r) + ' 0 0 1 ' + PT(x + w, y + r) + ' L' + PT(x + w, y + h) + ' Z '; }
// a dome (half ellipse) standing on (x, y), r wide, h tall, with a little point on top
function italy_dome(x, y, r, h) { var p = []; for (var i = 0; i <= 16; i++) { var a = Math.PI * i / 16; p.push([x - Math.cos(a) * r, y - Math.sin(a) * h - Math.pow(Math.sin(a), 12) * h * 0.08]); } return italy_pg(p); }
// the right-hand half of a dome (its shaded side)
function italy_domeR(x, y, r, h) { var p = [[x, y]]; for (var i = 8; i <= 16; i++) { var a = Math.PI * i / 16; p.push([x - Math.cos(a) * r, y - Math.sin(a) * h]); } return italy_pg(p); }
// a cypress: a tall slim flame from the ground (x, y)
function italy_cypress(x, y, h, w) { var p = []; for (var i = 0; i <= 10; i++) { var u = i / 10; p.push([x - w * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - u * 0.25), y - u * h]); } for (i = 9; i > 0; i--) { u = i / 10; p.push([x + w * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - u * 0.25), y - u * h]); } return italy_pg(p); }
// a bougainvillea clump: little magenta bracts round (x, y)
function italy_bougain(x, y, r, rnd) { var d = '', n = Math.max(4, Math.round(r * 0.9)); for (var i = 0; i < n; i++) { var a = rnd() * 6.28, q = Math.sqrt(rnd()) * r; d += italy_c(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.75, r * (0.18 + rnd() * 0.14)); } return d; }
// a tuft of scrub: three overlapping blobs
function italy_tuft(x, y, r, k) { return italy_e(x, y, r * 1.3, r * 0.8) + italy_e(x - r * (0.8 + k * 0.4), y + r * 0.25, r * 0.85, r * 0.6) + italy_e(x + r * 0.9, y + r * 0.2, r * 0.75, r * 0.55); }
// a crescent moon (lit side to the lower left): the disc (x, y, r) minus a disc moved up and right
function italy_cres(x, y, r) { var qx = x + r * 0.42, qy = y - r * 0.3, qr = r * 0.86, p = [], i, a, q = [];
  for (i = 0; i <= 72; i++) { a = i / 72 * Math.PI * 2; var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (Math.hypot(px - qx, py - qy) > qr) p.push([px, py, a]); }
  p.sort(function (m, n) { return ((m[2] - 5.66 + 6.283) % 6.283) - ((n[2] - 5.66 + 6.283) % 6.283); });
  for (i = 0; i <= 72; i++) { a = i / 72 * Math.PI * 2; var ix = qx + Math.cos(a) * qr, iy = qy + Math.sin(a) * qr; if (Math.hypot(ix - x, iy - y) < r) q.push([ix, iy, a]); }
  q.sort(function (m, n) { return ((n[2] - 5.66 + 6.283) % 6.283) - ((m[2] - 5.66 + 6.283) % 6.283); });
  return italy_pg(p.map(function (m) { return [m[0], m[1]]; }).concat(q.map(function (m) { return [m[0], m[1]]; }))); }
// a striped beach umbrella: canopy of n wedges, the even ones in one slot and the odd ones in another
function italy_umb(x, y, r, n) { var A = '', B = '', h = r * 0.55; for (var i = 0; i < n; i++) { var p = [[x, y - h]]; for (var k = 0; k <= 4; k++) { var u = (i + k / 4) / n; p.push([x - r + 2 * r * u, y + Math.sin(Math.PI * u) * h * 0.16 + Math.sin(Math.PI * k / 4) * h * 0.14]); } var s = italy_pg(p); if (i % 2) B += s; else A += s; } return [A, B]; }
// roughen a polygon: each edge split into n pieces whose inner points are pushed sideways by up to amp
function italy_wob(p, amp, n, rnd) { var o = []; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L; o.push(a);
  for (var k = 1; k < n; k++) { var f = k / n, d = (rnd() - 0.5) * 2 * amp; o.push([a[0] + (b[0] - a[0]) * f + nx * d, a[1] + (b[1] - a[1]) * f + ny * d]); } } return o; }
// drop points that sit on the straight line between their neighbours
function italy_simp(p) { var o = []; p.forEach(function (c) { var n = o.length; if (n && Math.abs(o[n - 1][0] - c[0]) < 0.05 && Math.abs(o[n - 1][1] - c[1]) < 0.05) return;
  if (n >= 2) { var A = o[n - 2], B = o[n - 1], L = Math.hypot(c[0] - A[0], c[1] - A[1]); if (L > 0 && Math.abs((B[0] - A[0]) * (c[1] - A[1]) - (B[1] - A[1]) * (c[0] - A[0])) / L < 0.08) { o[n - 1] = c; return; } } o.push(c); }); return o; }
// Occlusion buffer for drawing a hillside town front to back: per column of q px it holds the highest y that something
// nearer the viewer already covers. band() clips a shape (straight top edge, straight bottom edge) to what is still visible
// above that line, put() raises the line, vis() tests whether a shape standing on y is completely in view.
function italy_occ(W, y0, q) {
  var n = Math.ceil((W + 160) / q), a = [], o = {}; for (var i = 0; i < n; i++) a.push(y0);
  function ci(x) { return Math.max(0, Math.min(n - 1, Math.floor((x + 80) / q))); }
  o.at = function (x) { return a[ci(x)]; };
  o.min = function (x0, x1) { var i0 = ci(x0 + q / 2), i1 = Math.max(i0, ci(x1 - q / 2)), m = 1e9; for (var i = i0; i <= i1; i++) m = Math.min(m, a[i]); return m; };
  o.vis = function (x0, x1, yb) { return o.min(x0, x1) >= yb - 0.6; };
  o.put = function (x0, x1, tf) { for (var i = ci(x0 + q / 2); i <= ci(x1 - q / 2); i++) { var v = tf(i * q - 80 + q / 2); if (v < a[i]) a[i] = v; } };
  o.band = function (x0, x1, tf, bf) {
    if (x1 - x0 < 0.4) return '';
    var xs = [x0], B = [], any = false, k; for (k = ci(x0) + 1; k <= ci(x1); k++) { var xb = k * q - 80; if (xb > x0 + 0.01 && xb < x1 - 0.01) xs.push(xb); } xs.push(x1);
    for (k = 0; k < xs.length - 1; k++) { var xa = xs[k], xc = xs[k + 1], s = a[ci((xa + xc) / 2)], ta = tf(xa), tc = tf(xc), ba = Math.max(ta, Math.min(bf(xa), s)), bc = Math.max(tc, Math.min(bf(xc), s));
      B.push([xa, ba], [xc, bc]); if (ba - ta > 0.35 || bc - tc > 0.35) any = true; }
    if (!any) return '';
    return italy_pg([[x0, tf(x0)], [x1, tf(x1)]].concat(italy_simp(B.reverse())));
  };
  return o;
}

// ---------------------------------------------------------------- Amalfi Coast
// A Positano-style town spilling down a ravine between limestone cliffs to a little beach. The houses are drawn front to
// back in a gentle oblique view (each shows its front, a shaded side and its roof terrace or terracotta roof, and casts a
// shadow on the houses behind it), so the town stacks up the slope with real depth. A church with a majolica dome and a
// bell tower, lemon terraces under pergolas, stairways, cypresses, pines and bougainvillea; a coast road along the top; a
// pebble beach with rows of striped umbrellas, a little pier, a turquoise cove; hazy headlands across the bay; and a
// terrace with a potted lemon tree and the Italian flag in the corner.
// The waves, boats, gulls, flag, laundry, shutters, lemons, bells, window glows, scooter and sailboat are the engine's.
var italy_C = {
  L: {coast: '#BCCBE4', head: '#93B5C2', headSh: 'rgba(40,70,110,0.18)', sea: '#2C8EC2', haze: 'rgba(236,246,250,0.55)', deep: 'rgba(16,60,130,0.16)', tower: '#E8E2D4',
    back: '#A4C0BC', cove: '#3EC2D0', shallow: '#86E0DA', rock: '#DEC3A0', veg: '#6FA25C', shade: 'rgba(76,52,96,0.26)', sand: '#F3E7D2', light: '#FFFDF0', shine: 'rgba(255,255,255,0.7)', strata: 'rgba(130,96,70,0.3)',
    white: '#FFF9EE', pink: '#F9B3C0', lemonW: '#FCDC6C', peach: '#FCC495', coral: '#F08A6C', mint: '#B4E4D2', roof: '#D96A48', mshade: 'rgba(86,44,92,0.25)', haze2: 'rgba(226,238,246,0.45)', rail: '#43333E', line: 'rgba(255,255,255,0.85)',
    win: '#4C4262', pure: '#FFFFFF', green: '#2A9A70', leaf: '#4E9450', red: '#E4553C', bougain: '#E2378C', lemon: '#F9CF2E', blue: '#2F70C2', wood: '#7A5A44', foam: 'rgba(255,255,255,0.9)'},
  D: {coast: '#2E3866', head: '#2A3660', headSh: 'rgba(5,8,30,0.32)', sea: '#14295A', haze: 'rgba(120,110,170,0.22)', deep: 'rgba(0,0,20,0.22)', tower: '#4A4E78',
    back: '#28325C', cove: '#1A4670', shallow: '#296488', rock: '#5E5A7C', veg: '#2A4454', shade: 'rgba(8,6,30,0.38)', sand: '#504E68', light: 'rgba(255,246,220,0.95)', shine: 'rgba(200,215,255,0.28)', strata: 'rgba(0,0,15,0.3)',
    white: '#AEB0C8', pink: '#9C7090', lemonW: '#A89374', peach: '#A47E82', coral: '#905A64', mint: '#6E8E98', roof: '#7C4650', mshade: 'rgba(10,8,34,0.42)', haze2: 'rgba(36,40,86,0.42)', rail: '#1B1626', line: 'rgba(255,255,255,0.16)',
    win: '#2C2842', pure: '#C8CCE0', green: '#1E6A58', leaf: '#22423E', red: '#A8423E', bougain: '#A02A6A', lemon: '#FFD27A', blue: '#2C4E8A', wood: '#3A2A2A', foam: 'rgba(200,220,255,0.45)'}
};
SCENES.italy = function (W, H, dk, rnd) {
  var ph = H > W, C = italy_C[dk ? 'D' : 'L'], i, j, k, x, y, S0;
  var far = Lay(1.4), bg = Lay(0), mid = Lay(0), near = Lay(0);
  var S = ph ? 0.78 : Math.max(0.6, Math.min(1.15, H / 820)); S0 = S;
  var hz = H * (ph ? 0.33 : 0.4), yV = H * (ph ? 0.8 : 0.79);
  var sun = [W * (ph ? 0.2 : 0.15), H * (ph ? 0.16 : 0.13), (ph ? 24 : 32) * S], pc = function (v) { return Math.round(v * 1000) / 10 + '%'; };
  var sky = dk ? 'radial-gradient(circle at ' + pc(sun[0] / W) + ' ' + pc(sun[1] / H) + ',rgba(205,215,255,0.34) 0%,rgba(170,170,235,0.12) 9%,rgba(150,150,220,0) 22%),linear-gradient(180deg,#0D1736 0%,#1C2A56 ' + pc(hz / H * 0.55) + ',#45386C ' + pc(hz / H) + ',#2A2850 100%)'
    : 'radial-gradient(circle at ' + pc(sun[0] / W) + ' ' + pc(sun[1] / H) + ',rgba(255,252,234,0.95) 0%,rgba(255,246,214,0.6) 7%,rgba(255,240,205,0) 22%),linear-gradient(180deg,#86C8EE 0%,#BDE3F3 ' + pc(hz / H * 0.55) + ',#FBEBD2 ' + pc(hz / H) + ',#FBEBD2 100%)';
  var F = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''}, G = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''}, M = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''}, N = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''};
  var fS = '', gS = '', gT = '', mRail = '', mLine = '', nWood = '', nFoam = '';

  // ---- the lie of the land. The hill's shoulder Sx(y) is the rounded line where the hillside turns away out of sight.
  // Each row of the town follows a contour cY(yb, x): level where the hill faces the beach, then curving up and away round
  // the shoulder (a quarter circle of radius Rr seen from slightly above), so the houses wrap round the hill and disappear.
  var y0 = H * (ph ? 0.1 : 0.08), bH = H * (ph ? 0.05 : 0.065), yFoot = yV + bH * 0.8;
  var SP = (ph ? [[0.64, 0.1], [0.5, 0.22], [0.35, 0.4], [0.2, 0.62], [0.09, 0.86]] : [[0.5, 0.08], [0.44, 0.24], [0.37, 0.44], [0.305, 0.64], [0.265, 0.86]]).map(function (p) { return [p[0] * W, p[1] * H]; });
  function Sx(y) { return italy_lin(SP, y, 1) + 2.5 * S * Math.sin(y / 23) + 1.5 * S * Math.sin(y / 9 + 1); }
  var Rr = W * (ph ? 0.34 : 0.2), Dk = Rr * 0.3, thMax = 1.38;
  function xcOf(yb) { return Sx(yb - Dk) + Rr; }
  function thetaAt(yb, x) { var u = (xcOf(yb) - x) / Rr; return u <= 0 ? 0 : u >= 1 ? Math.PI / 2 : Math.asin(u); }
  function cY(yb, x) { var u = Math.min(1, Math.max(0, (xcOf(yb) - x) / Rr)); return yb - Dk * (1 - Math.sqrt(1 - u * u)); }
  var yE = yFoot - Dk, xE = Sx(yE), xbL = xcOf(yFoot) - Rr * 0.3;   // where the shore turns out of sight; where the beach begins
  function shoreY(x) { var u = Math.max(0, Math.min(1, (x - xbL) / (W + 20 - xbL))); return cY(yFoot, x) + bH * 0.4 * Math.sin(Math.PI * Math.pow(u, 0.8)) + 1.5 * S * Math.sin(x / 31); }
  var RC = ph ? [[Sx(y0), y0], [0.74 * W, 0.07 * H], [0.84 * W, 0.095 * H], [0.93 * W, 0.06 * H], [W + 30, 0.08 * H]]
    : [[Sx(y0), y0], [0.56 * W, 0.04 * H], [0.63 * W, 0.085 * H], [0.71 * W, 0.03 * H], [0.8 * W, 0.075 * H], [0.9 * W, 0.02 * H], [W + 30, 0.05 * H]];
  var ridgeP = []; for (x = RC[0][0]; x < W + 30; x += 8) ridgeP.push([x, italy_lin(RC, x, 0) + 3 * S * Math.sin(x / 17) + 2 * S * Math.sin(x / 7.3) * Math.min(1, (x - RC[0][0]) / 20)]); ridgeP.push([W + 30, RC[RC.length - 1][1]]);
  function ridgeY(x) { return italy_lin(ridgeP, x, 0); }
  function inLand(x, y) { if (y <= yE) return x > Sx(Math.max(y, y0)) - 2; return x > xE && y < shoreY(x) + 2; }
  function inMassif(x, y) { return y > ridgeY(x) + 2 && inLand(x, y); }
  function isSea(x, y) { return y > hz + 3 && !inLand(x, y); }

  // ---- far: the coast across the bay, a headland with a watchtower, the sea and its haze
  F.a += italy_pg([[W * 0.12, hz + 2], [W * 0.2, hz - H * 0.022], [W * 0.3, hz - H * 0.03], [W * 0.38, hz - H * 0.018], [W * 0.46, hz - H * 0.024], [W * 0.56, hz + 2]]);
  var hdC = ph ? [[-20, hz - 0.07 * H], [0.08 * W, hz - 0.075 * H], [0.18 * W, hz - 0.05 * H], [0.28 * W, hz - 0.02 * H], [0.36 * W, hz]] : [[-20, hz - 0.11 * H], [0.05 * W, hz - 0.12 * H], [0.1 * W, hz - 0.095 * H], [0.16 * W, hz - 0.062 * H], [0.22 * W, hz - 0.03 * H], [0.27 * W, hz - 0.008 * H], [0.29 * W, hz]];
  var hdP = []; for (x = -20; x <= hdC[hdC.length - 1][0]; x += 7) hdP.push([x, italy_lin(hdC, x, 0) + 2.5 * S * Math.sin(x / 11) + 1.5 * S * Math.sin(x / 5)]);
  F.b += italy_pg(hdP.concat([[hdC[hdC.length - 1][0] + 4, hz + 2], [-20, hz + 2]]));
  for (k = 1; k < hdC.length - 1; k++) { var hp = hdC[k], hq = hdC[k + 1]; F.c += italy_pg(italy_wob([[hp[0] + 2 * S, hp[1] + 4 * S], [hq[0], hq[1] + 3 * S], [hq[0] - 4 * S, hz + 2], [hp[0] + (hq[0] - hp[0]) * 0.55, hz + 2]], 3 * S, 4, rnd)); }
  var twX = hdC[hdC.length - 2][0], twY = italy_lin(hdC, twX, 0); F.g += rect(twX - 3.5 * S, twY - 9 * S, 7 * S, 11 * S) + rect(twX - 4.5 * S, twY - 10.5 * S, 9 * S, 2 * S);
  // little houses clustered towards the headland's tip, wrapping round it
  for (i = 0; i < (ph ? 9 : 18); i++) { var hu = 0.35 + 0.62 * Math.sqrt(rnd()), hx = hdC[1][0] + (hdC[hdC.length - 1][0] - hdC[1][0]) * hu, hyT = italy_lin(hdC, hx, 0), hy = hyT + (hz - hyT) * (0.3 + rnd() * 0.55), hs = (2 + rnd() * 2) * S * (1.2 - hu * 0.4);
    F.g += rect(hx, hy - hs, hs * (1 + rnd() * 0.6), hs); F.c += rect(hx + hs * 1.3, hy - hs, hs * 0.45, hs); }
  F.g += italy_e(W * (ph ? 0.44 : 0.33), hz + 1, 11 * S, 5 * S) + italy_e(W * (ph ? 0.49 : 0.355), hz + 1, 6 * S, 3 * S);
  F.d += rect(-30, hz, W + 60, H - hz + 40);
  var hzP = []; for (x = -30; x <= W + 30; x += 30) hzP.push([x, hz + H * 0.05 + 4 * S * Math.sin(x / 70)]); F.e += italy_pg([[-30, hz]].concat(hzP, [[W + 30, hz]]));
  var dpP = []; for (x = -30; x <= W + 30; x += 30) dpP.push([x, hz + H * 0.12 + 8 * S * Math.sin(x / 90 + 1)]); F.f += italy_pg(dpP.concat([[W + 30, H + 40], [-30, H + 40]]));
  // ---- the back mountain, the sun or moon, stars
  var BM = ph ? [[0.3 * W, hz + 2], [0.38 * W, hz - 0.08 * H], [0.46 * W, 0.15 * H], [0.56 * W, 0.05 * H], [0.7 * W, 0.04 * H], [W + 30, 0.03 * H], [W + 30, hz + 2]]
    : [[0.27 * W, hz + 2], [0.33 * W, hz - 0.1 * H], [0.39 * W, 0.17 * H], [0.46 * W, 0.06 * H], [0.52 * W, 0.01 * H], [0.62 * W, 0.035 * H], [0.72 * W, -0.005 * H], [W + 30, -0.01 * H], [W + 30, hz + 2]];
  G.a += italy_pg(BM);
  G.h += dk ? italy_cres(sun[0], sun[1], sun[2] * 0.8) : italy_c(sun[0], sun[1], sun[2]);
  if (dk) spread(0, 0, W, hz - 10, 34, 30, rnd, 1).forEach(function (c) { if (c.q < 0.32 && Math.hypot(c.x - sun[0], c.y - sun[1]) > sun[2] * 2 && (c.x < Sx(Math.max(c.y, y0)) - 8 || c.y < ridgeY(c.x) - 8) && c.y < italy_lin(BM.slice(0, -1), c.x, 0) - 6) G.h += italy_c(c.x, c.y, 0.5 + c.r * 0.9); });
  // sun glitter on the open water
  for (i = 0; i < (ph ? 16 : 24); i++) { y = hz + 6 + Math.pow(i / (ph ? 16 : 24), 1.3) * (H * 0.5); x = sun[0] + (rnd() - 0.5) * (20 + i * 4) * S; var gl = (6 + rnd() * 12) * S * (0.6 + (y - hz) / H); if (isSea(x + gl, y) && isSea(x - gl, y)) gS += seg(x - gl, y, x + gl, y); }
  spread(0, hz + 10, W, H - hz, ph ? 60 : 90, 22, rnd, 1).forEach(function (c) { if (c.q < 0.4 && isSea(c.x - 20, c.y) && isSea(c.x + 30, c.y)) { var L = (5 + c.r * 14) * S * (0.5 + (c.y - hz) / H); gS += seg(c.x, c.y, c.x + L, c.y); } });

  // ---- the cove: turquoise water round the foot of the hill and in front of the beach, lighter shallows at the shore
  var y1 = hz + (yE - hz) * (ph ? 0.3 : 0.25), cv = [];
  for (k = 0; k <= 14; k++) { var u = k / 14; cv.push([Sx(y1) + 10 - u * (Sx(y1) + 40), y1 + (H * 0.97 - y1) * Math.pow(u, 1.5) + 8 * S * Math.sin(u * 9)]); }
  G.b += italy_pg([[W + 30, y1]].concat(cv, [[-30, H + 30], [W + 30, H + 30]]));
  var shP = []; for (y = y1 + 6; y < yE; y += 8) shP.push([Sx(y), y]); for (x = xE; x <= W + 30; x += 8) shP.push([x, shoreY(x)]);
  G.c += italy_pg(shP.concat(shP.slice().reverse().map(function (p, q) { return [p[0] - (p[1] < yE ? (5 + 2 * Math.sin(q)) * S : 0), p[1] + (p[1] >= yE - 1 ? (5 + 2 * Math.sin(q * 0.7)) * S : 0)]; })));

  // ---- the hill: limestone under green macchia, gullies in shade, a rocky band where it meets the sea
  var ms = ridgeP.slice(); ms.push([W + 30, shoreY(W + 30)]); for (x = W + 30; x > xE; x -= 6) ms.push([x, shoreY(x)]); ms.push([xE, yE]);
  for (y = yE - 4; y > y0; y -= 6) ms.push([Sx(y), y]);
  G.d += italy_pg(ms);
  var rocky = function (x, y) { return Math.sin(x / 47 + 1.3) * Math.sin(y / 31 + 0.7) + 0.45 * Math.sin((x + y) / 19) > 0.7; };
  spread(Sx(yE) - 20, Math.min.apply(null, RC.map(function (p) { return p[1]; })) - 10, W - Sx(yE) + 50, yFoot - y0 + H * 0.06, 24 * S, 16 * S, rnd, 1).forEach(function (c) {
    if (!inMassif(c.x, c.y) || c.y < ridgeY(c.x) + 7 * S) return; var sea = c.y > yE - 30 * S ? shoreY(c.x) : 1e9; if (c.y > sea - 12 * S || rocky(c.x, c.y)) return;
    var r = (8 + c.r * 8) * S; G.e += italy_tuft(c.x, c.y, r * 0.75, c.k); if (c.q < 0.55) G.f += italy_e(c.x + r * 0.45, c.y + r * 0.42, r * 0.7, r * 0.3); });
  // the shoulder's outline is soft with scrub, so the hillside rounds off rather than ending in an edge
  for (y = y0 + 6 * S; y < yE - 4 * S; y += (6 + rnd() * 6) * S) { var tr0 = (3 + rnd() * 4) * S; G.e += italy_tuft(Sx(y) + tr0 * 0.4, y, tr0, rnd()); if (rnd() < 0.4) G.f += italy_e(Sx(y) + tr0 * 1.2, y + tr0 * 0.5, tr0 * 0.7, tr0 * 0.3); }
  for (k = 1; k < RC.length - 1; k++) { var pk = RC[k], sd = RC[k + 1]; if (sd[1] < pk[1]) continue; var gb = Math.min(H * 0.28, H * 0.2 + (sd[1] - pk[1]));
    G.f += italy_pg(italy_wob([[pk[0] + 2, ridgeY(pk[0] + 2) + 2], [sd[0], ridgeY(sd[0]) + 2], [sd[0] - W * 0.006, sd[1] + gb * 0.5], [pk[0] + W * 0.05, pk[1] + gb]], 6 * S, 6, rnd).map(function (p) { return [p[0], Math.max(p[1], ridgeY(p[0]) + 2)]; })); }
  // rock at the water's edge: strata, a wet band, boulders washed by foam
  for (x = xE + 3 * S; x < xbL + 20 * S; x += (6 + rnd() * 8) * S) { var sy0 = shoreY(x); gT += seg(x, sy0 - (4 + rnd() * 6) * S, x + (5 + rnd() * 8) * S, sy0 - (3 + rnd() * 6) * S); }
  var wet = []; for (x = xE; x <= xbL + 10 * S; x += 6) wet.push([x, shoreY(x)]); G.f += italy_pg(wet.concat(wet.slice().reverse().map(function (p) { return [p[0], p[1] - 3 * S]; })));
  var rocks = [];
  function boulder(bx, by, r) { var bp = []; for (i = 0; i < 9; i++) { var a = i / 9 * 6.283, rr = r * (0.82 + rnd() * 0.3); bp.push([bx + Math.cos(a) * rr, by + Math.sin(a) * rr * (Math.sin(a) > 0 ? 0.35 : 0.72)]); }
    G.d += italy_pg(bp); G.g += italy_pg([[bx - r * 0.75, by - r * 0.1], [bx - r * 0.35, by - r * 0.6], [bx + r * 0.15, by - r * 0.62], [bx - r * 0.1, by - r * 0.15]]); G.f += italy_pg([[bx + r * 0.1, by - r * 0.1], [bx + r * 0.5, by - r * 0.55], [bx + r * 0.95, by], [bx + r * 0.6, by + r * 0.3], [bx, by + r * 0.3]]);
    nFoam += 'M' + PT(bx - r * 1.15, by + r * 0.3) + ' Q' + PT(bx, by + r * 0.7) + ' ' + PT(bx + r * 1.15, by + r * 0.3) + ' '; rocks.push([bx, by + r * 0.3, r]); }
  for (x = xE + 4 * S; x < xbL + 12 * S; x += (7 + rnd() * 12) * S) if (rnd() < 0.75) { var th0 = thetaAt(yFoot, x), br = (2.5 + rnd() * 4) * S * (1 - 0.35 * (1 - Math.cos(th0))); boulder(x, shoreY(x) + br * 0.1, br); }
  boulder(xE - 10 * S, yE + 6 * S, 3 * S); boulder(xE + Rr * 0.25, cY(yFoot, xE + Rr * 0.25) + 9 * S, 4.4 * S); boulder(xE + Rr * 0.3, cY(yFoot, xE + Rr * 0.3) + 12 * S, 2.6 * S);
  // the beach: sand from the foot of the town to the water, tapering into the rocks at its left end
  var bchTop = yV - 1.5 * S, bch = [], bchB = [];
  for (x = xbL; x <= W + 30; x += 8) { var tp0 = Math.min(1, (x - xbL) / (W * 0.08)), sb2 = shoreY(x), tb2 = cY(bchTop, x); bch.push([x, sb2 - (sb2 - tb2) * tp0 * tp0 * (3 - 2 * tp0)]); bchB.push([x, sb2]); }
  G.g += italy_pg(bch.concat(bchB.reverse()));
  spread(xbL, bchTop + 3 * S, W - xbL, yFoot + bH * 0.4 - bchTop, 9 * S, 6 * S, rnd, 1).forEach(function (c) { if (c.y < shoreY(c.x) - 3 * S && c.y > cY(bchTop, c.x) + 4 * S && c.x > xbL + W * 0.05 && c.q < 0.6) gT += seg(c.x, c.y, c.x + (1 + c.r * 1.5) * S, c.y); });

  // ---- the coast road along the top of the town, following the same contour round the shoulder
  var roadY0 = H * (ph ? 0.2 : 0.2), rw = 8 * S, rp = [], rx0 = Sx(roadY0 - Dk) + 3 * S;
  for (x = rx0; x <= W + 40; x += 8) rp.push([x, cY(roadY0, x) + 3 * S * Math.sin(x / 90)]);
  function roadAt(x) { return italy_lin(rp, x, 0); }
  G.g += italy_pg(rp.map(function (p) { return [p[0], p[1] - rw / 2]; }).concat(rp.slice().reverse().map(function (p) { return [p[0], p[1] + rw / 2]; })));
  G.f += italy_pg(rp.map(function (p) { return [p[0], p[1] + rw / 2]; }).concat(rp.slice().reverse().map(function (p) { return [p[0], p[1] + rw / 2 + 6 * S]; })));

  // ---- the town
  var O = italy_occ(W, H + 60, 2), gap = (ph ? 26 : 30) * S, wins = [], shutA = [], lemons = [], ldry = [], cols = ['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c', 'd', 'd', 'e', 'e'];
  function band(x0, x1, t0, t1, b0, b1) { var d = x1 - x0 || 1; return O.band(x0, x1, function (X) { return t0 + (t1 - t0) * (X - x0) / d; }, function (X) { return b0 + (b1 - b0) * (X - x0) / d; }); }
  function vis(x0, x1, yb) { return O.vis(x0, x1, yb); }
  // a line (a stroke, painted over every fill of its layer) only where nothing already in front covers it
  function oLine(pts) { var d = '', run = []; for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[i + 1] || a, n = i < pts.length - 1 ? Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5)) : 1;
      for (var k = 0; k < n; k++) { var u = i < pts.length - 1 ? k / n : 0, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; if (y <= O.at(x) + 0.3) run.push([x, y]); else { if (run.length > 1) d += pline(run); run = []; } } }
    if (run.length > 1) d += pline(run); return d; }
  function windowAt(wx, wy, ww, wh, arch, dark) { var sh = arch ? italy_arch(wx, wy, ww, wh) : rect(wx, wy, ww, wh); var lit = dk && !dark && rnd() < 0.62; if (lit) { N.g += sh; wins.push([wx + ww / 2, wy + wh / 2, ww]); } else N.a += sh; }
  function bougainDrape(x, y, len) { for (var q = 0; q < len; q += 4 * S) { var bx = x + Math.sin(q * 0.4) * 2 * S, by = y + q, r = (4.6 - q / len * 2.2) * S; if (vis(bx - r, bx + r, by + r)) { N.f += italy_bougain(bx, by, r, rnd); if (q < 6 * S) N.d += italy_e(bx + 2 * S, by + 1.5 * S, r * 0.8, r * 0.5); } } }
  // a house: front face, a shaded side face and the roof (a flat terrace or a hipped terracotta roof); windows, shutters,
  // balconies, flowers and awnings where they are in view, then a shadow cast on whatever stands behind it
  function house(o) {
    var x = o.x, w = o.w, top = o.top, base = o.base, x1 = x + w, sx = o.sx || o.d * 0.8, sy = o.sy || o.d * 0.55, col = o.col, hgt = base - top, kk = o.k || 1, th = o.th || 0;
    if (O.min(x, x1 + sx) < top - sy * 2 - 10 * S) return;   // hidden behind what is in front
    if (o.perch) { var sub = gap * (o.row < 0 ? 0.25 : 0.6) * kk, sb0 = base, sb1 = base + sub;   // perched on the rock: a stone footing with a vaulted cellar, and its shadow on the cliff
      M.a += band(x + 1.5 * S, x1 - 1 * S, sb0, sb0, sb1 - 3 * S, sb1); M.g += band(x1 - 4 * S, x1 - 1 * S, sb0, sb0, sb1, sb1) + band(x + 1.5 * S, x1 - 1 * S, sb0, sb0, sb0 + 1.8 * S, sb0 + 1.8 * S);
      // the cellar's arch fits inside the footing (a short footing gets a smaller arch, or none), so it never hangs below into the sea
      var cat = sub < 12 * S ? 2 * S : 3 * S, cah = Math.min(8 * S, sub - cat - 2.6 * S), caw = Math.min(6 * S, cah * 1.1); if (cah >= 3.5 * S && vis(x + w * 0.3, x + w * 0.3 + caw, sb0 + cat + cah)) N.a += italy_arch(x + w * 0.3, sb0 + cat, caw, cah);
      M.g += O.band(x1 - 1 * S, x1 + 7 * S, function (X) { return sb0 + (X - x1) * 0.5; }, function () { return sb1 + 4 * S; });
      O.put(x + 1.5 * S, x1 - 1 * S, function () { return sb0; }); }
    var fr = band(x, x1, top, top, base, base), sd = band(x1, x1 + sx, top, top - sy, base, base - sy);
    M[col] += fr + sd; M.g += sd + band(x, x1, top, top, top + 2 * S * kk, top + 2 * S * kk); if (o.haze) M.h += fr + sd;
    var pitched = o.pitch && vis(x - 2 * S, x1 + sx + 2 * S, top + 1), roofTop = top - sy, flatVis = vis(x, x1 + sx, top + 1);
    if (pitched) { var e = 1.6 * S * kk, rh = Math.min(w * 0.22 + sx * 0.3, 9 * S * kk), rl = x + Math.min(w * 0.3, 10 * S) + sx * 0.5, rr = x1 - Math.min(w * 0.3, 10 * S) + sx * 0.5, ry = top - sy * 0.5 - rh;
      M.f += italy_pg([[x - e, top + 1.4 * S], [x1 + e, top + 1.4 * S], [x1 + sx + e * 0.6, top - sy + 0.6 * S], [rr, ry], [rl, ry]]);
      M.g += italy_pg([[x1 + e, top + 1.4 * S], [x1 + sx + e * 0.6, top - sy + 0.6 * S], [rr, ry]]) + band(x, x1, top + 1.4 * S, top + 1.4 * S, top + 3.4 * S, top + 3.4 * S);
      for (var tl = 1; tl < 3; tl++) { var ty = top + 1.4 * S - (top + 1.4 * S - ry) * tl / 3, f0 = tl / 3; mLine += seg(x - e + (rl - x + e) * f0 + 1, ty, x1 + e + (rr - x1 - e) * f0 - 1, ty); }
      if (o.haze) M.h += italy_pg([[x - e, top + 1.4 * S], [x1 + e, top + 1.4 * S], [x1 + sx + e * 0.6, top - sy + 0.6 * S], [rr, ry], [rl, ry]]);
      roofTop = ry; }
    else { var tc = col === 'a' ? 'f' : 'a';
      var tpf = band(x, x + sx, top, top - sy, top, top) + band(x + sx, x1, top - sy, top - sy, top, top) + band(x1, x1 + sx, top - sy, top - sy, top, top - sy); M[tc] += tpf; if (o.haze) M.h += tpf;
      if (tc === 'a' && flatVis) M.g += italy_pg([[x1, top], [x1 + sx, top - sy], [x1 + sx, top - sy + 1.2 * S], [x1, top + 1.2 * S]]);
      if (flatVis) mLine += seg(x + 0.5, top + 0.7, x1 - 0.5, top + 0.7); }
    // windows, floor by floor
    var sq = Math.max(0.5, o.sq || 1), fh = (ph ? 11 : 12.5) * S * kk, ww = (ph ? 4 : 4.6) * S * kk * sq, wh = (ph ? 6.4 : 7.4) * S * kk, nw = Math.max(1, Math.round((w - 5 * S * kk) / ((ph ? 10.5 : 12) * S * kk * sq))), arch = rnd() < 0.55, shc = rnd() < 0.6 ? (rnd() < 0.3 ? 'h' : 'c') : null, loggia = !o.church && rnd() < 0.12 && w > 30 * S;
    for (var fl = 0; th < 1.2; fl++) { var wy = top + (pitched ? 4.5 : 4) * S * kk + fl * fh; if (wy + wh > base - 2 * S * kk) break;
      var ground = o.row === 0 && th < 0.3 && wy + wh + fh > base - 2 * S;
      if (fl === 0 && loggia && vis(x + 3 * S, x1 - 3 * S, wy + wh + 1)) { var na = Math.max(3, Math.round((w - 6 * S) / (7 * S))), aw = (w - 6 * S) / na; for (i = 0; i < na; i++) windowAt(x + 3 * S + i * aw + aw * 0.12, wy - 1 * S, aw * 0.76, wh + 2 * S, true, true); M.g += band(x + 2 * S, x1 - 2 * S, wy + wh + 1 * S, wy + wh + 1 * S, wy + wh + 2.2 * S, wy + wh + 2.2 * S); if (dk) wins.push([x + w / 2, wy + wh / 2, w * 0.4]); continue; }
      var bal = !ground && th < 0.7 && rnd() < 0.22, flower = rnd() < 0.25, swing = 0;
      for (i = 0; i < nw; i++) { var wx = x + w * (i + 0.5) / nw - ww / 2, pad = shc ? ww * 0.62 : 0.5 * S;
        if (!vis(wx - pad, wx + ww + pad, wy + wh + (flower ? 2.5 * S : 0.6))) continue;
        if (ground && i === 0) { var dw = ww * 1.5, dx2 = x + Math.min(w * 0.3, 10 * S) - dw / 2; if (vis(dx2, dx2 + dw, base)) { if (rnd() < 0.4) N.h += italy_arch(dx2, base - 11 * S, dw, 11 * S); else N.a += italy_arch(dx2, base - 11 * S, dw, 11 * S); continue; } }
        windowAt(wx, wy, ww, wh, arch);
        if (shc) { if (shc === 'c' && swing === 0 && shutA.length < (ph ? 5 : 9) && rnd() < 0.2 && wy > H * (ph ? 0.35 : 0.45)) { shutA.push([wx, wy, ww, wh]); swing = 1; }
          else N[shc] += rect(wx - ww * 0.58, wy, ww * 0.5, wh) + rect(wx + ww * 1.08, wy, ww * 0.5, wh); }
        if (flower && !bal) { N.d += rect(wx - 0.6 * S, wy + wh, ww + 1.2 * S, 1.6 * S); N.f += italy_c(wx + ww * 0.2, wy + wh, 1.2 * S) + italy_c(wx + ww * 0.75, wy + wh - 0.2 * S, 1.3 * S); }
      }
      if (bal) { var bx0 = x + 2.5 * S, bx1 = x1 - 2.5 * S, by = wy + wh + 0.6 * S; if (vis(bx0 - S, bx1 + S, by + 2.5 * S)) {
        mRail += seg(bx0, wy + wh * 0.45, bx1, wy + wh * 0.45); for (var px = bx0; px <= bx1 + 0.1; px += 2.4 * S) mRail += seg(px, wy + wh * 0.45, px, by);
        mLine += seg(bx0 - S, by, bx1 + S, by); M.g += band(bx0 - S, bx1 + S, by + 0.4 * S, by + 0.4 * S, by + 2.4 * S, by + 2.4 * S);
        if (rnd() < 0.6) N.f += italy_bougain(bx0 + 2 * S, wy + wh * 0.5, 3 * S, rnd); if (rnd() < 0.5) N.d += italy_tuft(bx1 - 2.5 * S, wy + wh * 0.55, 1.8 * S, 0.5); } }
      if (fl === 0 && !pitched && th < 0.7 && rnd() < 0.09 && w > 22 * S) { var ax0 = x + 2 * S, ax1 = x1 - 2 * S, ay = wy - 1.5 * S, ah = 5 * S; if (vis(ax0 - 1.5 * S, ax1 + 1.5 * S, ay + ah)) { var ns = Math.max(3, Math.round((ax1 - ax0) / (3.5 * S))), aw2 = (ax1 - ax0) / ns, ac = rnd() < 0.5 ? 'h' : 'e';
        for (i = 0; i < ns; i++) { var s0 = ax0 + i * aw2, sp = italy_pg([[s0, ay], [s0 + aw2, ay], [s0 + aw2 + (i - ns / 2 + 1) * 0.3 * S, ay + ah], [s0 + (i - ns / 2) * 0.3 * S, ay + ah]]); if (i % 2) N.b += sp; else N[ac] += sp; } } }
    }
    if (o.row === 0 && th < 0.3 && rnd() < 0.5 && w > 26 * S) { var aX = x + w * 0.5, aY = base - 13 * S; if (vis(aX - 9 * S, aX + 9 * S, aY + 5 * S)) { var ac2 = rnd() < 0.5 ? 'h' : 'e'; for (i = 0; i < 5; i++) { var sq = italy_pg([[aX - 8 * S + i * 3.2 * S, aY], [aX - 4.8 * S + i * 3.2 * S, aY], [aX - 4.2 * S + i * 3.4 * S, aY + 5 * S], [aX - 7.6 * S + i * 3.4 * S, aY + 5 * S]]); if (i % 2) N.b += sq; else N[ac2] += sq; } } }
    // bougainvillea falling from a corner of the roof
    if (rnd() < 0.2 && th < 1) bougainDrape(rnd() < 0.5 ? x + 2.5 * S : x1 - 2.5 * S, top + 2 * S, Math.min(hgt * 0.7, 26 * S));
    // on a flat roof: a little vaulted cupola, a vine pergola or potted plants
    if (!pitched && flatVis && th < 0.9) { var rk = rnd(), rcx = x + w * 0.5 + sx * 0.5, rcy = top - sy * 0.5;
      if (rk < 0.18 && w > 22 * S) { var cr = Math.min(w * 0.2, 7 * S); M.a += italy_dome(rcx, rcy + 0.5 * S, cr, cr * 0.8); M.g += italy_domeR(rcx, rcy + 0.5 * S, cr, cr * 0.8); roofTop = Math.min(roofTop, rcy - cr * 0.85); O.put(rcx - cr, rcx + cr, function () { return rcy - cr * 0.6; }); }
      else if (rk < 0.32 && w > 24 * S) { var p0 = x + 4 * S, p1 = x1 - 3 * S, pt = top - sy * 0.3 - 8 * S; nWood += seg(p0, top - 0.5, p0, pt) + seg(p1, top - 0.5, p1, pt) + seg(p0 - 2 * S, pt, p1 + 2 * S, pt); for (var vx = p0; vx < p1; vx += 5 * S) N.d += italy_e(vx + 2 * S, pt - 0.5 * S, 3.4 * S, 2 * S); roofTop = Math.min(roofTop, pt - 2.5 * S); }
      else if (rk < 0.5) { N.d += italy_tuft(x + 4 * S, top - sy * 0.4 - 1.5 * S, 2.2 * S, 0.4); if (rnd() < 0.5) N.f += italy_bougain(x1 - 2 * S, top - sy * 0.6 - 2 * S, 3.4 * S, rnd); }
      if (rk > 0.6 && rk < 0.75 && w > 34 * S && hgt > 2 * fh && ldry.length < 4) ldry.push([x + 3 * S, top + 2.6 * S, w - 6 * S, top + 2.6 * S]); }
    O.put(x, x1 + sx, function (X) { return X < x + sx ? top - (X - x) * sy / sx : top - sy; });
    if (pitched) O.put(x + w * 0.25, x1 + sx * 0.5 - w * 0.25, function () { return roofTop; });
    // the shadow it casts to the right, on whatever stands behind
    var xr = x1 + sx, L = Math.min(20 * S * kk, hgt * 0.75); M.g += O.band(xr, xr + L, function (X) { return top - sy + (X - xr) * 0.85; }, function () { return base; });
  }
  // a stone terrace wall with lemon trees under a pergola
  function terrace(x0, x1, b0, b1) { var th = 6 * S, yb = (b0 + b1) / 2, ts = yb - th;
    M.a += band(x0, x1, b0 - th, b1 - th, b0, b1); for (var tx = x0 + 3 * S; tx < x1 - 2 * S; tx += 6 * S) M.g += band(tx, tx + 3.5 * S, ts + 1.6 * S + (tx % 2) * S, ts + 1.6 * S + (tx % 2) * S, ts + 2.4 * S + (tx % 2) * S, ts + 2.4 * S + (tx % 2) * S);
    M.g += band(x0, x1, b0 - th, b1 - th, b0 - th + 1.2 * S, b1 - th + 1.2 * S); if (vis(x0, x1, Math.max(b0, b1) - th + 1)) mLine += seg(x0, b0 - th + 0.5, x1, b1 - th + 0.5);
    O.put(x0, x1, function (X) { return b0 - th + (b1 - b0) * (X - x0) / (x1 - x0); });
    for (var tx2 = x0 + 8 * S; tx2 < x1 - 6 * S; tx2 += 15 * S) { var tsx2 = b0 - th + (b1 - b0) * (tx2 - x0) / (x1 - x0), cy2 = tsx2 - 9 * S, tr = (6.5 + rnd() * 1.5) * S; if (!vis(tx2 - tr, tx2 + tr, tsx2)) continue;
      N.d += italy_e(tx2, cy2, tr, 6.5 * S) + italy_e(tx2 - 4 * S, cy2 + 2 * S, 4.6 * S, 4.2 * S) + italy_e(tx2 + 4.2 * S, cy2 + 1.6 * S, 4.6 * S, 4.2 * S); nWood += seg(tx2, tsx2, tx2, cy2 + 3 * S);
      for (i = 0; i < 4; i++) lemons.push([tx2 + (rnd() - 0.5) * tr * 1.5, cy2 + (rnd() - 0.3) * 5.5 * S, 1.8 * S]); }
    if (vis(x0, x1, Math.max(b0, b1) - th)) { var pgA = b0 - th - gap * 0.72, pgB = b1 - th - gap * 0.72, pgy = function (X) { return pgA + (pgB - pgA) * (X - x0) / (x1 - x0); }; for (var px2 = x0 + 1; px2 <= x1; px2 += 24 * S) nWood += seg(px2, pgy(px2) + gap * 0.72, px2, pgy(px2)); nWood += seg(x0 + 1, pgA, x1, pgB); for (var nx = x0 + 4 * S; nx < x1 - 3 * S; nx += 6 * S) nFoam += seg(nx, pgy(nx), nx + 4 * S, pgy(nx + 4 * S) + 1.8 * S); }
  }
  // a white stairway climbing between two houses
  function stairs(x0, x1, yb) { var top = yb - gap * 1.1; M.a += band(x0, x1, top, top, yb, yb); for (var sy2 = yb - 2.4 * S; sy2 > top + 1; sy2 -= 2.8 * S) M.g += band(x0, x1, sy2, sy2, sy2 + 0.9 * S, sy2 + 0.9 * S);
    M.g += band(x0, x0 + 1.4 * S, top, top, yb, yb); O.put(x0, x1, function () { return top; }); }
  // a gap in the row: a cypress, a lemon tree or a mound of greenery
  function green(x0, x1, yb, kg) { var cx = (x0 + x1) / 2, kd = rnd(), S = (kg || 1) * S0;
    if (kd < 0.4) { var hh = (30 + rnd() * 20) * S; if (vis(cx - 5 * S, cx + 5 * S, yb - gap * 0.3)) N.d += italy_cypress(cx, yb - gap * 0.3, hh, 5 * S); }
    else if (kd < 0.7) { var r = Math.min((x1 - x0) * 0.5, 9 * S), cy = yb - gap * 0.55; if (vis(cx - r, cx + r, cy + r * 0.6)) { N.d += italy_tuft(cx, cy, r * 0.75, 0.5); for (i = 0; i < 3; i++) lemons.push([cx + (rnd() - 0.5) * r * 1.4, cy + (rnd() - 0.4) * r * 0.8, 1.7 * S]); } }
    else { var r2 = (x1 - x0) * 0.45; if (vis(cx - r2, cx + r2, yb - gap * 0.45)) { N.d += italy_tuft(cx, yb - gap * 0.6, r2 * 0.6, 0.3); N.f += italy_bougain(cx + r2 * 0.2, yb - gap * 0.7, r2 * 0.6, rnd); } } }

  // the church: a lemon-yellow facade with a pediment, the majolica dome on its drum behind it, a white bell tower
  var rC = ph ? 3 : 2, cyB = yV - 1.5 * S - rC * gap, cw = (ph ? 50 : 64) * S, cX = Math.max(xcOf(cyB) + W * 0.06 + cw * 0.5, W * (ph ? 0.6 : 0.62)), tW = 20 * S, tX = cX - cw / 2 - tW - 2 * S, cSpan = [tX - 3 * S, cX + cw / 2 + 14 * S];
  var bells = [], domeA = [0, 0, 1], churchA = [cX, cyB - gap, cw];
  function church() { var ch = gap * 2.1, top = cyB - ch, d = 18 * S, sx = d * 0.8, sy = d * 0.55, x0 = cX - cw / 2, x1 = cX + cw / 2;
    // the nave behind the facade, then the facade itself
    M.c += band(x0, x1, top, top, cyB, cyB) + band(x1, x1 + sx, top, top - sy, cyB, cyB - sy); M.g += band(x1, x1 + sx, top, top - sy, cyB, cyB - sy);
    M.f += italy_pg([[x0, top], [x1, top], [x1 + sx, top - sy], [x0 + sx, top - sy]]);
    var pd = italy_pg([[x0 - 2 * S, top + 0.5], [cX, top - 15 * S], [x1 + 2 * S, top + 0.5]]); M.c += pd; M.g += italy_pg([[cX, top - 15 * S], [x1 + 2 * S, top + 0.5], [cX, top + 0.5]]);
    // the facade's outlines stop where the houses in front cover it
    mLine += oLine([[x0 - 2 * S, top + 0.5], [cX, top - 15 * S], [x1 + 2 * S, top + 0.5]]) + oLine([[x0, top + 2 * S], [x1, top + 2 * S]]) + oLine([[x0 + 2 * S, top], [x0 + 2 * S, cyB]]) + oLine([[x1 - 2 * S, top], [x1 - 2 * S, cyB]]) + oLine([[x0, cyB - ch * 0.48], [x1, cyB - ch * 0.48]]);
    windowAt(cX - 5.5 * S, top - 6 * S, 11 * S, 11 * S, true, true); N.b += italy_c(cX, top - 0.5 * S, 1.6 * S);
    if (vis(cX - 8 * S, cX + 8 * S, cyB)) { N.h += italy_arch(cX - 6.5 * S, cyB - 18 * S, 13 * S, 18 * S); mLine += 'M' + PT(cX - 8 * S, cyB) + ' L' + PT(cX - 8 * S, cyB - 13 * S) + ' A' + n1(8 * S) + ' ' + n1(8 * S) + ' 0 0 1 ' + PT(cX + 8 * S, cyB - 13 * S) + ' L' + PT(cX + 8 * S, cyB) + ' '; }
    [-0.33, 0.33].forEach(function (f) { var wx = cX + cw * f - 3 * S; if (vis(wx, wx + 6 * S, top + ch * 0.4)) windowAt(wx, top + ch * 0.12 + 3 * S, 6 * S, 12 * S, true); });
    for (i = 0; i < 3; i++) M.a += band(cX - 10 * S - i * 3 * S, cX + 10 * S + i * 3 * S, cyB - 1 + i * 2 * S, cyB - 1 + i * 2 * S, cyB + 1 + i * 2 * S, cyB + 1 + i * 2 * S);
    // the dome: drum, tiles in a lattice of yellow diamonds, a white lantern
    var dR = cw * 0.4, dX = cX + sx * 0.5, dY = top - sy * 0.5 - 8 * S;
    M.a += rect(dX - dR * 0.82, dY, dR * 1.64, 9 * S); M.g += rect(dX + dR * 0.38, dY, dR * 0.44, 9 * S);
    // the drum's windows stop at the pediment, which stands in front of the drum
    var pedY = function (X) { return top + 0.5 - (15 * S + 0.5) * Math.max(0, 1 - Math.abs(X - cX) / (cw / 2 + 2 * S)); };
    for (i = -2; i <= 2; i++) { var dwx = dX + i * dR * 0.3 - 1.8 * S, dwb = Math.min(dY + 8 * S, pedY(dwx) - 0.6 * S, pedY(dwx + 3.6 * S) - 0.6 * S); if (dwb - dY - 2 * S >= 3 * S) windowAt(dwx, dY + 2 * S, 3.6 * S, dwb - dY - 2 * S, true, true); }
    var dh = dR * 1.08; N.c += italy_dome(dX, dY, dR, dh);
    var dia = ''; for (j = 0; j < 5; j++) for (i = -6; i <= 6; i++) { var qx = dX + (i + (j % 2) * 0.5) * dR * 0.27, qy = dY - dR * 0.16 - j * dR * 0.2, qr = dR * 0.085, ex = (qx - dX) / dR, ey = (dY - qy) / dh; if (ex * ex + ey * ey < 0.76) dia += italy_pg([[qx, qy - qr * 1.3], [qx + qr, qy], [qx, qy + qr * 1.3], [qx - qr, qy]]); }
    N.g += dia + rect(dX - dR, dY - 1.6 * S, dR * 2, 2 * S);
    N.b += rect(dX - 3.4 * S, dY - dh - 8 * S, 6.8 * S, 9 * S) + italy_dome(dX, dY - dh - 8 * S, 4.4 * S, 4.6 * S) + italy_c(dX, dY - dh - 15 * S, 1.8 * S);
    domeA = [dX, dY - dh * 0.5, dR];
    O.put(x0, x1 + sx, function (X) { return X < x0 + sx ? top - (X - x0) * sy / sx : top - sy; }); O.put(cX - 3 * S, cX + 3 * S, function () { return top - 15 * S; });
    O.put(dX - dR, dX + dR, function (X) { var u = (X - dX) / dR; return dY - dh * Math.sqrt(Math.max(0, 1 - u * u)); });
    // the bell tower, with two arched openings for the bells (the engine's) and a little tiled cupola
    var tH = gap * 3.4, tt = cyB - tH, td = 10 * S, tsx = td * 0.8, tsy = td * 0.55;
    M.a += band(tX, tX + tW, tt, tt, cyB, cyB) + band(tX + tW, tX + tW + tsx, tt, tt - tsy, cyB, cyB - tsy); M.g += band(tX + tW, tX + tW + tsx, tt, tt - tsy, cyB, cyB - tsy);
    for (i = 1; i < 4; i++) mLine += oLine([[tX, tt + tH * i / 4], [tX + tW, tt + tH * i / 4]]);
    windowAt(tX + tW * 0.1, tt + 5 * S, tW * 0.36, 13 * S, true, true); windowAt(tX + tW * 0.54, tt + 5 * S, tW * 0.36, 13 * S, true, true);
    windowAt(tX + tW / 2 - 2.5 * S, tt + tH * 0.42, 5 * S, 9 * S, true);
    if (vis(tX, tX + tW, cyB - tH * 0.3)) { N.b += italy_c(tX + tW / 2, tt + tH * 0.27, 4.4 * S); nWood += seg(tX + tW / 2, tt + tH * 0.27, tX + tW / 2, tt + tH * 0.27 - 3 * S) + seg(tX + tW / 2, tt + tH * 0.27, tX + tW / 2 + 2.4 * S, tt + tH * 0.27); }
    M.a += italy_pg([[tX - 1.5 * S, tt], [tX + tW + 1.5 * S, tt], [tX + tW + tsx + 1.5 * S, tt - tsy], [tX + tsx - 1.5 * S, tt - tsy]]);
    N.c += italy_dome(tX + tW / 2 + tsx * 0.5, tt - tsy * 0.5, tW * 0.5, 11 * S); N.g += italy_c(tX + tW / 2 + tsx * 0.5, tt - tsy * 0.5 - 12.5 * S, 2.1 * S);
    bells = [[tX + tW * 0.28, tt + 9 * S], [tX + tW * 0.72, tt + 9 * S]];
    O.put(tX, tX + tW + tsx, function () { return tt - tsy - 10 * S; });
  }

  // the sea wall along the top of the beach, then the rows of houses from the water up to the road, front to back. Each
  // row runs right to left along its contour: level in front of the beach, then curving up round the shoulder, where the
  // houses turn (fronts narrowing, side walls showing), shrink with distance, fade into the haze, give way to greenery and
  // finally pass out of sight. Row -1 is a scatter of houses perched on the rocks where the hill comes down to the water.
  var swL = xcOf(bchTop) - Rr * 0.12;
  M.a += band(swL, W + 30, bchTop, bchTop, yV + 2.5 * S, yV + 2.5 * S); mLine += seg(swL, bchTop + 0.5, W + 30, bchTop + 0.5); M.g += band(swL, W + 30, yV + 1.2 * S, yV + 1.2 * S, yV + 2.5 * S, yV + 2.5 * S);
  O.put(swL, W + 30, function () { return bchTop; });
  var tRows = 4, roadBot = function (x) { return roadAt(x) + rw / 2 + 2 * S; }, r, yb, lastCol = '';
  for (r = -1; r < 40; r++) {
    yb = r < 0 ? yFoot - 2 * S : bchTop - r * gap; if (r >= 0 && yb - gap * 0.55 < roadBot(W)) break;
    var xcR = xcOf(yb), inT = r > 0 && yb - gap * 0.9 < roadBot(W) + tRows * gap * 0.92, tR = xcR + W * (ph ? 0.08 : 0.1), tL = xcR - Rr * 0.45, xx = W + 20 - rnd() * 8 * S;
    for (var guard = 0; guard < 400; guard++) {
      var th = thetaAt(yb, xx); if (th > thMax || xx < -20) break;
      var kk = 1 - 0.34 * (1 - Math.cos(th)), cs = Math.max(0.16, Math.cos(th)), sn = Math.sin(th);
      if (r < 0 && (th < 0.35 || xx > xbL)) { xx -= 6 * S; continue; }
      if (inT && xx <= tR && xx > tL + 10 * S) { terrace(tL, xx, cY(yb, tL), cY(yb, xx)); xx = tL - 3 * S; continue; }
      if (r === rC && xx <= cSpan[1] && xx > cSpan[0]) { church(); xx = cSpan[0] - 2 * S; continue; }
      var gk = rnd();
      if (r < 0 && gk < 0.4) { xx -= (12 + rnd() * 20) * S * cs; continue; }
      if (r >= 0 && gk < 0.05 && th < 0.5) { var sw = (8 + rnd() * 4) * S; stairs(xx - sw, xx, cY(yb, xx - sw / 2)); xx -= sw; continue; }
      if (r >= 0 && gk < 0.1 + 0.36 * th / thMax) { var gw = ((10 + rnd() * 14) * cs + 6 * sn) * S * kk; green(xx - gw, xx, cY(yb, xx - gw / 2), kk); xx -= gw; continue; }
      var w = (ph ? 18 + rnd() * 24 : 24 + rnd() * 36) * S, fw = Math.max(3 * S, w * kk * cs), x0 = xx - fw, bse = cY(yb, xx - fw * 0.5) - (r > 0 && rnd() < 0.3 ? rnd() * gap * 0.25 * kk : 0);
      var hh2 = gap * (1.05 + rnd() * 0.65) * kk; if (rnd() < 0.12) hh2 = gap * (1.8 + rnd() * 0.5) * kk; if (r < 0) hh2 = gap * (0.75 + rnd() * 0.45) * kk;
      var top = bse - hh2, lim = Math.max(roadBot(x0), roadBot(xx)) + 2 * S; if (top < lim) top = lim;
      if (r >= 0 && r < rC && xx > cSpan[0] - 6 * S && x0 < cSpan[1]) top = Math.max(top, cyB + (rC - r - 1) * 2 * S - 2 * S);
      if (bse - top > gap * 0.45 * kk) { var col = cols[Math.floor(rnd() * cols.length)]; if (col === lastCol) col = cols[Math.floor(rnd() * cols.length)]; lastCol = col; var dd = (7 + rnd() * 5) * S * kk;
        house({x: x0, w: fw, top: top, base: bse, col: col, d: dd, sx: dd * 0.8 + w * kk * sn * 0.42, sy: dd * 0.55, pitch: rnd() < 0.3, row: r, k: kk, sq: cs, th: th, haze: th > 0.78, perch: r < 0 || (th > 0.6 && rnd() < 0.3)}); }
      xx = x0 - (rnd() < 0.25 ? (1 + rnd() * 5) * S * cs : 0);
    }
  }
  // the road's white wall on its downhill side, then a few houses, cypresses and umbrella pines above the road
  for (k = rp.length - 2; k >= 0; k--) { var pa = rp[k], pb = rp[k + 1]; N.b += band(pa[0], pb[0], pa[1] + rw / 2 - 0.5, pb[1] + rw / 2 - 0.5, pa[1] + rw / 2 + 3.2 * S, pb[1] + rw / 2 + 3.2 * S); if (k % 3 === 0 && vis(pa[0] - 1.6 * S, pa[0] + 1.6 * S, pa[1] + rw / 2 + 3 * S)) N.b += rect(pa[0] - 1.6 * S, pa[1] + rw / 2 - 2 * S, 3.2 * S, 3 * S); }
  O.put(rp[0][0], W + 40, function (X) { return roadAt(X) + rw / 2 - 2 * S; });
  var up = []; for (x = rx0 + 8 * S; x < W - 4; x += (26 + rnd() * 44) * S) up.push(x);
  for (k = up.length - 1; k >= 0; k--) { x = up[k]; var rt = roadAt(x) - rw / 2 - 0.5, kd = rnd(), thu = thetaAt(roadY0, x), ku = 1 - 0.34 * (1 - Math.cos(thu));
    if (kd < 0.5) { var w2 = (20 + rnd() * 22) * S * ku * Math.max(0.3, Math.cos(thu)), h2 = (16 + rnd() * 12) * S * ku; if (rt - h2 > ridgeY(x) + 8 * S) house({x: x, w: w2, top: rt - h2, base: rt, col: cols[Math.floor(rnd() * cols.length)], d: 8 * S * ku, sx: 8 * S * ku * 0.8 + 20 * S * ku * Math.sin(thu) * 0.42, pitch: rnd() < 0.5, row: 9, k: ku, sq: Math.cos(thu), th: thu, haze: thu > 0.78}); }
    else if (kd < 0.75) { if (vis(x - 5 * S, x + 5 * S, rt)) N.d += italy_cypress(x, rt, (24 + rnd() * 14) * S * ku, 4.6 * S * ku); }
    else if (vis(x - 3 * S, x + 3 * S, rt) && rt - 26 * S > ridgeY(x)) { var pu = ku * S; N.d += italy_e(x, rt - 22 * pu, 17 * pu, 6 * pu) + italy_e(x - 9 * pu, rt - 20 * pu, 9 * pu, 4.6 * pu) + italy_e(x + 10 * pu, rt - 21 * pu, 9.5 * pu, 4.6 * pu); nWood += 'M' + PT(x, rt) + ' Q' + PT(x - 2 * pu, rt - 12 * pu) + ' ' + PT(x + 3 * pu, rt - 19 * pu) + ' '; }
  }
  // umbrella pines and cypresses on the shoulder of the hill, where the town fades into the hillside
  for (y = y0 + H * 0.04; y < yE - 8 * S; y += (18 + rnd() * 26) * S) { var px = Sx(y) + (5 + rnd() * 16) * S, ps = (0.65 + rnd() * 0.35) * S; if (!vis(px - 4 * S, px + 4 * S, y) || y - 22 * ps < ridgeY(px)) continue;
    if (rnd() < 0.6) { var lean = -(3 + rnd() * 6) * ps; nWood += 'M' + PT(px, y) + ' Q' + PT(px + lean * 0.3, y - 10 * ps) + ' ' + PT(px + lean, y - 18 * ps) + ' ';
      N.d += italy_e(px + lean, y - 21 * ps, 13 * ps, 4.6 * ps) + italy_e(px + lean - 7 * ps, y - 19 * ps, 7 * ps, 3.6 * ps) + italy_e(px + lean + 7 * ps, y - 20 * ps, 8 * ps, 3.8 * ps); }
    else N.d += italy_cypress(px, y, (24 + rnd() * 14) * ps, 4.4 * ps); }

  // ---- the beach: rows of striped umbrellas and loungers, boats pulled up, a little pier into the cove
  var bLeft = xcOf(yFoot) - Rr * 0.05, uRows = [[0.32, ph ? 34 : 54], [0.7, ph ? 38 : 60]], uCol = ['e', 'h', 'e', 'g', 'e', 'c'], uBase = [];
  uRows.forEach(function (ur2, q) { var yy = bchTop + (shoreY(W * 0.7) - bchTop) * ur2[0]; for (x = bLeft + (q ? 14 : 30) * S + (ph ? 10 * S : 0); x < W - 6 * S; x += ur2[1] * S) { if (yy > shoreY(x) - 5 * S) continue; var ur = (ph ? 10 : 14) * S, um = italy_umb(x, yy - ur * 1.2, ur, 8), uc = uCol[(uBase.length * 7 + q) % uCol.length];
    nWood += seg(x, yy - ur * 1.2 - ur * 0.5, x, yy); N[uc] += um[0]; N.b += um[1];
    var lx2 = x + ur * 0.2; N.b += italy_pg([[lx2, yy - 1.4 * S], [lx2 + ur * 1.0, yy - 1.4 * S], [lx2 + ur * 1.0, yy + 0.4 * S], [lx2, yy + 0.4 * S]]) + italy_pg([[lx2 + ur, yy - 1.4 * S], [lx2 + ur * 1.3, yy - 5 * S], [lx2 + ur * 1.4, yy - 4.2 * S], [lx2 + ur * 1.14, yy + 0.4 * S]]);
    G.f += italy_e(x + ur * 0.4, yy + 1.2 * S, ur * 0.85, ur * 0.18); uBase.push([x, yy]); } });
  var boatsUp = ph ? [0.55] : [0.5, 0.82];
  boatsUp.forEach(function (f) { var xs = xbL + (W - xbL) * f, yy = shoreY(xs) - 4 * S, L = (ph ? 16 : 22) * S;
    N.b += italy_pg([[xs - L, yy - 5 * S], [xs + L, yy - 6.5 * S], [xs + L * 0.78, yy + 1 * S], [xs - L * 0.8, yy + 1.3 * S]]);
    N.h += italy_pg([[xs - L * 0.96, yy - 3 * S], [xs + L * 0.94, yy - 4 * S], [xs + L * 0.9, yy - 2.2 * S], [xs - L * 0.92, yy - 1.2 * S]]);
    nWood += seg(xs - L, yy - 5 * S, xs + L, yy - 6.5 * S); G.f += italy_e(xs, yy + 2 * S, L * 0.9, 1.8 * S); });
  var pX = xbL + (W - xbL) * 0.24, pY = shoreY(pX) - 2 * S, pL = ph ? 0 : H * 0.07, pdx = -pL * 0.18, pwd = 12 * S;
  if (pL) {
  N.b += italy_pg([[pX, pY], [pX + pwd, pY], [pX + pwd + pdx, pY + pL], [pX + pdx, pY + pL]]);
  G.f += italy_pg([[pX + pwd, pY + 2 * S], [pX + pwd + pdx, pY + pL], [pX + pwd + pdx + 2 * S, pY + pL + 4 * S], [pX + pwd + 2 * S, pY + 4 * S]]);
  for (k = 1; k <= 4; k++) { var fk = k / 4.3, ppx = pX + pdx * fk, ppy = pY + pL * fk; nWood += seg(ppx + 0.6 * S, ppy, ppx + 0.6 * S, ppy + 4 * S) + seg(ppx + pwd - 0.6 * S, ppy, ppx + pwd - 0.6 * S, ppy + 4 * S); }
  nFoam += seg(pX + pdx - 3 * S, pY + pL + 4.6 * S, pX + pdx + pwd + 4 * S, pY + pL + 4.6 * S);
  N.e += italy_c(pX + pdx + pwd * 0.5, pY + pL - 2 * S, 1.6 * S); }

  // ---- the foreground: a bougainvillea branch from the top corner, a terrace balustrade with a potted lemon tree and the flag
  var fb = [[-20, H * (ph ? 0.12 : 0.03)], [W * 0.06, H * (ph ? 0.125 : 0.05)], [W * (ph ? 0.18 : 0.12), H * (ph ? 0.15 : 0.085)], [W * (ph ? 0.3 : 0.19), H * (ph ? 0.14 : 0.08)]];
  nWood += 'M' + PT(fb[0][0], fb[0][1]) + ' Q' + PT(fb[1][0], fb[1][1]) + ' ' + PT(fb[2][0], fb[2][1]) + ' T' + PT(fb[3][0], fb[3][1]) + ' ';
  fb.slice(1).forEach(function (p) { for (i = 0; i < 8; i++) { var lx = p[0] - 30 * S + i * 8 * S, ly = p[1] + ((i * 7) % 5 - 1) * 3 * S; N.d += italy_e(lx, ly, 8 * S, 4.6 * S) + italy_e(lx + 3 * S, ly + 5 * S, 6 * S, 3.6 * S); if (i % 2 === 0) N.f += italy_bougain(lx + 3 * S, ly + 4 * S, 10 * S, rnd); }
    for (i = 0; i < 2; i++) { var vx2 = p[0] - 12 * S + i * 20 * S, vl = (26 + rnd() * 26) * S; nWood += 'M' + PT(vx2, p[1]) + ' Q' + PT(vx2 + 6 * S, p[1] + vl * 0.5) + ' ' + PT(vx2 + 2 * S, p[1] + vl) + ' '; N.f += italy_bougain(vx2 + 2 * S, p[1] + vl, 7 * S, rnd) + italy_bougain(vx2 + 4 * S, p[1] + vl * 0.5, 5 * S, rnd); N.d += italy_e(vx2 + 4 * S, p[1] + vl * 0.3, 4.4 * S, 2.6 * S); } });
  var bx1T = W * (ph ? 0.3 : 0.17), byT = H * (ph ? 0.885 : 0.885), bal = rect(-20, byT, bx1T + 20, 6 * S) + rect(-20, H - 9 * S, bx1T + 20, 12 * S);
  // vase-shaped balusters: a cap under the rail, a slim neck, a round belly low down, a ring and a plinth on the bottom rail,
  // narrow enough for clean gaps between them (the profile is half-widths in S down the height, smoothed)
  var balProf = [[0, 3.4], [0.05, 3.4], [0.06, 2.2], [0.14, 1.5], [0.3, 1.9], [0.5, 3.1], [0.66, 3.7], [0.8, 3.0], [0.88, 1.7], [0.91, 2.6], [0.94, 2.6], [0.95, 3.5], [1, 3.5]], balPts = [];
  for (i = 0; i < balProf.length - 1; i++) { var q0 = balProf[Math.max(0, i - 1)], q1 = balProf[i], q2 = balProf[i + 1], q3 = balProf[Math.min(balProf.length - 1, i + 2)], sharp = q2[0] - q1[0] < 0.03;
    for (k = 0; k < (sharp ? 1 : 6); k++) { var tq = k / 6, t2 = tq * tq, t3 = t2 * tq, wq = sharp ? q1[1] : 0.5 * (2 * q1[1] + (-q0[1] + q2[1]) * tq + (2 * q0[1] - 5 * q1[1] + 4 * q2[1] - q3[1]) * t2 + (-q0[1] + 3 * q1[1] - 3 * q2[1] + q3[1]) * t3); balPts.push([q1[0] + (q2[0] - q1[0]) * tq, wq]); } }
  balPts.push(balProf[balProf.length - 1]);
  for (x = 2 * S; x < bx1T - 6 * S; x += 14 * S) { var bh = H - 9 * S - byT - 6 * S, b0 = byT + 6 * S, bcx = x + 6 * S;
    bal += italy_pg(balPts.map(function (q) { return [bcx + q[1] * S, b0 + q[0] * bh]; }).concat(balPts.slice().reverse().map(function (q) { return [bcx - q[1] * S, b0 + q[0] * bh]; }))); }
  N.b += bal; G.f += rect(-20, byT + 6 * S, bx1T + 20, 2.2 * S);
  var ptX = bx1T - 22 * S, ptY = byT;
  N.e += italy_pg([[ptX - 12 * S, ptY - 18 * S], [ptX + 12 * S, ptY - 18 * S], [ptX + 9 * S, ptY], [ptX - 9 * S, ptY]]) + rect(ptX - 13.5 * S, ptY - 21 * S, 27 * S, 4 * S); nWood += seg(ptX, ptY - 21 * S, ptX, ptY - 34 * S);
  N.d += italy_e(ptX, ptY - 44 * S, 20 * S, 15 * S) + italy_e(ptX - 14 * S, ptY - 38 * S, 11 * S, 9 * S) + italy_e(ptX + 14 * S, ptY - 39 * S, 12 * S, 9 * S) + italy_e(ptX + 2 * S, ptY - 56 * S, 12 * S, 8 * S);
  // lemons scattered over the whole crown (its side and top clumps too), each kept a little apart from the others
  var crown = [[0, -44, 20, 15], [-14, -38, 11, 9], [14, -39, 12, 9], [2, -56, 12, 8]], lem0 = lemons.length;
  for (i = 0; i < 400 && lemons.length - lem0 < 9; i++) { var lx3 = ptX + (hash(i * 3.7 + 31) * 2 - 1) * 30 * S, ly3 = ptY + (-66 + hash(i * 5.3 + 37) * 36) * S;
    if (!crown.some(function (c) { var u = (lx3 - ptX - c[0] * S) / ((c[2] - 4) * S), v = (ly3 - ptY - c[1] * S) / ((c[3] - 3.5) * S); return u * u + v * v < 1; })) continue;
    if (lemons.slice(lem0).some(function (l) { return Math.hypot(l[0] - lx3, l[1] - ly3) < 8.5 * S; })) continue;
    lemons.push([lx3, ly3, 3.2 * S]); }
  N.f += italy_bougain(bx1T * 0.62, byT - 2 * S, 10 * S, rnd) + italy_bougain(bx1T * 0.08, byT + 2 * S, 8 * S, rnd);
  // the flag: a white pole with a gold ball; the engine waves the tricolour, the still scene draws it hanging in a gentle curve
  var fpX = bx1T * (ph ? 0.32 : 0.3), fpB = byT, fpT = byT - (ph ? 86 : 100) * S, fW = (ph ? 32 : 40) * S, fH = fW * 0.66;
  N.b += rect(fpX - 1.3 * S, fpT, 2.6 * S, fpB - fpT) + rect(fpX - 3 * S, fpB - 3 * S, 6 * S, 3 * S); N.g += italy_c(fpX, fpT - 2 * S, 2.6 * S);
  if (!ANIM) { var fy = function (u) { return Math.sin(u * 3.4 - 0.4) * fH * 0.06 * u + u * u * fH * 0.06; }, fpart = function (u0, u1) { var p = [], q; for (q = 0; q <= 8; q++) { var u = u0 + (u1 - u0) * q / 8; p.push([fpX + 1.3 * S + u * fW, fpT + 2 * S + fy(u)]); } for (q = 8; q >= 0; q--) { u = u0 + (u1 - u0) * q / 8; p.push([fpX + 1.3 * S + u * fW, fpT + 2 * S + fH + fy(u)]); } return italy_pg(p); };
    N.b += fpart(0, 1); N.c += fpart(0, 1 / 3); N.e += fpart(2 / 3, 1); G.f += italy_pg([[fpX + 3 * S, fpT + fH + 4 * S], [fpX + fW + 3 * S, fpT + fH * 1.08 + 4 * S], [fpX + fW + 3 * S, fpT + fH * 1.08 + 6 * S], [fpX + 3 * S, fpT + fH + 6 * S]]); }
  // lemons and swinging shutters: in the still scene they are drawn here; the engine sways and swings them
  if (!ANIM) { lemons.forEach(function (l) { N.g += italy_e(l[0], l[1], l[2] * 1.15, l[2] * 0.85); }); shutA.forEach(function (s) { N.c += rect(s[0] - s[2] * 0.58, s[1], s[2] * 0.5, s[3]) + rect(s[0] + s[2] * 1.08, s[1], s[2] * 0.5, s[3]); }); }

  add(far, 'a', F.a, C.coast); add(far, 'b', F.b, C.head); add(far, 'c', F.c, C.headSh); add(far, 'd', F.d, C.sea); add(far, 'e', F.e, C.haze); add(far, 'f', F.f, C.deep); add(far, 'g', F.g, C.tower);
  add(bg, 'a', G.a, C.back); add(bg, 'b', G.b, C.cove); add(bg, 'c', G.c, C.shallow); add(bg, 'd', G.d, C.rock); add(bg, 'e', G.e, C.veg); add(bg, 'f', G.f, C.shade); add(bg, 'g', G.g, C.sand); add(bg, 'h', G.h, C.light);
  stk(bg, 's', gS, C.shine, 1.3); stk(bg, 't', gT, C.strata, 1.2);
  add(mid, 'a', M.a, C.white); add(mid, 'b', M.b, C.pink); add(mid, 'c', M.c, C.lemonW); add(mid, 'd', M.d, C.peach); add(mid, 'e', M.e, C.coral); add(mid, 'f', M.f, C.roof); add(mid, 'g', M.g, C.mshade); add(mid, 'h', M.h, C.haze2);
  stk(mid, 's', mRail, C.rail, 0.8); stk(mid, 't', mLine, C.line, 0.9);
  add(near, 'a', N.a, C.win); add(near, 'b', N.b, C.pure); add(near, 'c', N.c, C.green); add(near, 'd', N.d, C.leaf); add(near, 'e', N.e, C.red); add(near, 'f', N.f, C.bougain); add(near, 'g', N.g, C.lemon); add(near, 'h', N.h, C.blue);
  stk(near, 's', nWood, C.wood, 1.3 * S); stk(near, 't', nFoam, C.foam, 1.1 * S);
  if (ANIM) {
    var shore = []; for (x = xbL + W * 0.05; x <= W + 20; x += 12) shore.push([x, shoreY(x)]);
    var bs = ph ? [[0.12, 0.6], [0.2, 0.7], [0.06, 0.5], [0.6, 0.95]] : [[0.28, 0.95], [0.1, 0.64], [0.24, 0.73], [0.04, 0.53], [0.6, 0.955], [0.84, 0.95]], boats = [];
    bs.forEach(function (b) { var bx = W * b[0], by = H * b[1], s = (ph ? 0.7 : 1) * S * (0.7 + (by - hz) / (H - hz) * 0.6); if (isSea(bx - 30 * s, by) && isSea(bx + 30 * s, by) && isSea(bx, by + 6 * s) && !(bx < bx1T + 30 * s && by > byT - 20 * S) && !(Math.abs(bx - pX) < 50 * s && by < pY + pL + 20 * S)) boats.push([bx, by, s]); });
    ANIM.C = C; ANIM.S = S; ANIM.gz = hz; ANIM.yV = yV; ANIM.sun = sun; ANIM.shore = shore; ANIM.road = rp.filter(function (p) { return thetaAt(roadY0, p[0]) < 0.95; }); ANIM.bells = bells; ANIM.dome = domeA; ANIM.church = churchA;
    ANIM.wins = wins; ANIM.shut = shutA; ANIM.lemons = lemons; ANIM.fap = gap; ANIM.boats = boats; ANIM.isSea = isSea; ANIM.rocks = rocks; ANIM.flag = [fpX + 1.3 * S, fpT + 2 * S, fW, fH];
    var ld = ldry.filter(function (l) { return l[1] > H * (ph ? 0.4 : 0.45); }); ANIM.ldry = (ld.length ? ld : ldry)[0] || null;
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
