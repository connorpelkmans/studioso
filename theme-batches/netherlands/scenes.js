// ---- world theme: netherlands (Netherlands)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other. The scene is laid out in metres on the ground and projected (nl_P), so the
// canal, the tulip stripes, the canal houses and the drawbridge all run to one vanishing point on the horizon.
function nl_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function nl_pg(p) { return poly(nl_area(p) < 0 ? p.slice().reverse() : p); }
function nl_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function nl_c(x, y, r) { return nl_e(x, y, r, r); }
// the camera: horizon hz, vanishing point vx, eye height hc (metres) and focal length f (pixels); the bottom edge of the art is 6 m away
function nl_cam(W, H, ph) { var hz = H * (ph ? 0.6 : 0.62), hc = ph ? 10 : 6; return {vx: W * (ph ? 0.5 : 0.42), hz: hz, hc: hc, f: (H - hz) * 6 / hc, ph: ph, W: W, H: H}; }
function nl_P(c, X, Y, Z) { return [c.vx + c.f * X / Z, c.hz + c.f * (c.hc - Y) / Z]; }
function nl_PP(c, pts) { return pts.map(function (p) { return nl_P(c, p[0], p[1], p[2]); }); }
function nl_q(c, pts) { return nl_pg(nl_PP(c, pts)); }
// a box face in the plane Z = z: x0..x1 by y0..y1
function nl_fz(c, x0, x1, y0, y1, z) { return nl_q(c, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]); }
// a box face in the plane X = x: z0..z1 by y0..y1
function nl_fx(c, x, z0, z1, y0, y1) { return nl_q(c, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]]); }
// a patch of ground at height y: x0..x1 by z0..z1
function nl_gr(c, x0, x1, z0, z1, y) { return nl_q(c, [[x0, y || 0, z0], [x1, y || 0, z0], [x1, y || 0, z1], [x0, y || 0, z1]]); }
// the part of a polygon on one side of the line a -> b (k = 1 or -1 picks the side)
function nl_clip(P, a, b, k) { var o = [], sd = function (p) { return k * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])); };
  for (var i = 0; i < P.length; i++) { var p = P[i], q = P[(i + 1) % P.length], sp = sd(p), sq = sd(q); if (sp >= 0) o.push(p); if ((sp >= 0) !== (sq >= 0)) { var u = sp / (sp - sq); o.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); } }
  return o; }
function nl_leaf(x, y, len, w, ang) { var pts = [], i; for (i = 0; i <= 10; i++) { var t = i / 10; pts.push([t * len, w * Math.sin(Math.PI * t) * (1 - 0.3 * t)]); } for (i = 9; i > 0; i--) { var u = i / 10; pts.push([u * len, -w * Math.sin(Math.PI * u) * (1 - 0.3 * u)]); } return nl_pg(rotp(pts, x, y, ang)); }
// a tulip cup with three pointed petals, its base at (x, y), w wide and h tall
function nl_cup(x, y, w, h) { return nl_pg([[-1, 0], [-1.08, -0.5], [-0.82, -1], [-0.45, -0.62], [0, -1.08], [0.45, -0.62], [0.82, -1], [1.08, -0.5], [1, 0], [0.55, 0.3], [-0.55, 0.3]].map(function (p) { return [x + p[0] * w / 2, y + p[1] * h]; })); }
// the gable outline of a canal house, w wide, the walls He high and the top Ht: a list of [u (along the facade), v (up)]
function nl_gable(type, w, He, Ht) {
  var p = [[0, 0], [0, He]], i, a, r, k;
  if (type === 'step') { a = w * 0.13; r = (Ht - He) / 4; for (i = 0; i < 3; i++) p.push([a * i + a * 0.0, He + r * i], [a * (i + 1), He + r * i]); p.push([a * 3, He + r * 3], [w / 2 - a * 0.6, He + r * 3], [w / 2 - a * 0.6, Ht], [w / 2 + a * 0.6, Ht], [w / 2 + a * 0.6, He + r * 3], [w - a * 3, He + r * 3]); for (i = 2; i >= 0; i--) p.push([w - a * (i + 1), He + r * i], [w - a * i, He + r * i]); }
  else if (type === 'bell') { for (k = 0; k <= 8; k++) { var t = k / 8; p.push([w * (0.06 + 0.24 * Math.sin(t * Math.PI / 2)), He + (Ht - 0.9 - He) * (1 - Math.cos(t * Math.PI / 2)) + Math.sin(t * Math.PI) * 0.35]); } for (k = 1; k < 10; k++) { var b = Math.PI - k / 10 * Math.PI; p.push([w / 2 + Math.cos(b) * w * 0.2, Ht - 0.9 + Math.sin(b) * 0.9]); } for (k = 8; k >= 0; k--) { t = k / 8; p.push([w - w * (0.06 + 0.24 * Math.sin(t * Math.PI / 2)), He + (Ht - 0.9 - He) * (1 - Math.cos(t * Math.PI / 2)) + Math.sin(t * Math.PI) * 0.35]); } }
  else if (type === 'neck') { var nb = He + (Ht - He) * 0.3; for (k = 0; k <= 5; k++) { var q = k / 5 * Math.PI / 2; p.push([w * 0.08 + Math.sin(q) * w * 0.2, He + (1 - Math.cos(q)) * (nb - He)]); } p.push([w * 0.3, Ht - 1.1], [w * 0.24, Ht - 1.1], [w / 2, Ht], [w * 0.76, Ht - 1.1], [w * 0.7, Ht - 1.1]); for (k = 5; k >= 0; k--) { q = k / 5 * Math.PI / 2; p.push([w - w * 0.08 - Math.sin(q) * w * 0.2, He + (1 - Math.cos(q)) * (nb - He)]); } }
  else if (type === 'spout') p.push([w * 0.1, He], [w * 0.36, Ht - 0.7], [w * 0.36, Ht], [w * 0.64, Ht], [w * 0.64, Ht - 0.7], [w * 0.9, He]);
  else p.push([0, Ht - 0.5], [-0.15, Ht - 0.5], [-0.15, Ht], [w + 0.15, Ht], [w + 0.15, Ht - 0.5], [w, Ht - 0.5]);
  p.push([w, He], [w, 0]); return p; }

// The canal houses on the left bank. Each: [type, width along the canal (m), wall height, top, colour 0 brick, 1 cream, 2 dark]
var nl_HOUSES = [['step', 4.6, 12.5, 16.6, 0], ['bell', 4.2, 11.6, 15.6, 1], ['neck', 4.8, 12.8, 17.4, 2], ['spout', 4.0, 11, 14.6, 0], ['cornice', 5.2, 13.4, 14.2, 1], ['step', 4.4, 11.8, 15.8, 2], ['bell', 4.8, 12.4, 16.4, 0], ['neck', 4.2, 11.4, 15.6, 1], ['spout', 4.6, 12.2, 15.8, 2], ['step', 5, 12, 16, 0]];
var nl_FX = -10.5;   // the house fronts
// the drawbridge (a double leaf with balance beams on white portals), the leaves at angle a (0 down, about 1.3 open).
// Returns path strings by part, so the still scene and the engine draw the same bridge.
function nl_bridge(c, B, a) {
  var z0 = B.z0, z1 = B.z1, o = {white: '', deck: '', side: '', dark: '', rail: ''}, ca = Math.cos(a), sa = Math.sin(a);
  [-1, 1].forEach(function (sd) {
    var hx = sd * 5, px = sd * 5.45, tip = [hx - sd * 5 * ca, 0.3 + 5 * sa], tipB = [px - sd * 5 * ca, 8.4 + 5 * sa], back = [px + sd * 2.8 * ca, 8.4 - 2.8 * sa];
    // the portal: two posts, a top rail and a brace, in the plane of the bank
    [z0, z1].forEach(function (z) { o.white += nl_fz(c, px - 0.17, px + 0.17, 0, 8.6, z); o.dark += pline(nl_PP(c, [[px - 0.17, 0, z], [px - 0.17, 8.6, z], [px + 0.17, 8.6, z], [px + 0.17, 0, z]])); });
    o.white += nl_fx(c, px, z0, z1, 8.2, 8.6) + nl_q(c, [[px, 2.6, z0], [px, 2.9, z0], [px, 8.2, z1], [px, 7.9, z1]]);
    // the leaf: its top (the road) and its front edge
    o.deck += nl_q(c, [[hx, 0.3, z0], [tip[0], tip[1], z0], [tip[0], tip[1], z1], [hx, 0.3, z1]]);
    o.side += nl_q(c, [[hx, 0.3, z0], [tip[0], tip[1], z0], [tip[0] + sd * 0.45 * sa, tip[1] - 0.45 * ca, z0], [hx + sd * 0.45 * sa, 0.3 - 0.45 * ca, z0]]);
    // the balance beams (one each side of the road) with their chains, and the leaf's white railings
    [z0, z1].forEach(function (z) {
      var n = [sd * 0.16 * sa, 0.16 * ca];
      var bq = [[back[0] + n[0], back[1] + n[1], z], [tipB[0] + n[0], tipB[1] + n[1], z], [tipB[0] - n[0], tipB[1] - n[1], z], [back[0] - n[0], back[1] - n[1], z]];
      o.white += nl_q(c, bq); o.dark += poly(nl_PP(c, bq));
      var t1 = nl_P(c, tipB[0], tipB[1], z), t2 = nl_P(c, tip[0], tip[1], z); o.dark += seg(t1[0], t1[1], t2[0], t2[1]);
      var r0 = nl_P(c, hx, 1.3, z), r1 = nl_P(c, tip[0] - sd * 1.0 * sa, tip[1] + 1.0 * ca, z), b0 = nl_P(c, hx, 0.3, z), b1 = nl_P(c, tip[0], tip[1], z); o.rail += seg(r0[0], r0[1], r1[0], r1[1]);
      for (var k = 0; k <= 5; k++) { var u = k / 5; o.rail += seg(b0[0] + (b1[0] - b0[0]) * u, b0[1] + (b1[1] - b0[1]) * u, r0[0] + (r1[0] - r0[0]) * u, r0[1] + (r1[1] - r0[1]) * u); }
    });
  });
  return o; }
// a windmill's sails: four stocks, each with a lattice frame on its trailing side and the sail cloth half furled over it
function nl_sails(c, m, ang) {
  var h = nl_P(c, m.X, m.H + 1.1, m.Z), s = c.f / m.Z, R = m.R * s, o = {stock: '', lat: '', cloth: ''};
  for (var k = 0; k < 4; k++) { var a = ang + k * Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, P = function (r, n) { return [h[0] + dx * r * s + nx * n * s, h[1] + dy * r * s + ny * n * s]; };
    o.stock += nl_pg([P(-0.6, -0.2), P(m.R + 0.3, -0.13), P(m.R + 0.3, 0.13), P(-0.6, 0.2)]);
    var r0 = 1.4, w = m.R * 0.2;
    o.lat += 'M' + PT.apply(null, P(r0, 0.1)) + ' L' + PT.apply(null, P(r0, w)) + ' L' + PT.apply(null, P(m.R, w)) + ' L' + PT.apply(null, P(m.R, 0.1)) + ' ';
    for (var r = r0 + 0.6; r < m.R - 0.1; r += m.R / 14) o.lat += 'M' + PT.apply(null, P(r, 0.1)) + ' L' + PT.apply(null, P(r, w)) + ' ';
    o.lat += 'M' + PT.apply(null, P(r0, w * 0.5)) + ' L' + PT.apply(null, P(m.R, w * 0.5)) + ' ';
    o.cloth += nl_pg([P(r0 + 0.5, 0.15), P(m.R - 0.3, 0.15), P(m.R - 0.3, w * (0.55 + 0.1 * (k % 2))), P(r0 + 0.5, w * (0.4 + 0.1 * (k % 2)))]); }
  o.cloth += nl_c(h[0], h[1], 0.55 * s); return o; }

// ---------------------------------------------------------------- Netherlands
// A flat polder under a big sky. A straight canal runs from the foreground to the horizon: tall gabled canal houses line
// its left bank, a white double drawbridge carries the dike road across it, and on the right bank tulip fields run in
// bold stripes toward the horizon (further out they turn into bands across the view), with three windmills along the
// water, a willow and bicycles leaning on the railing. The sails, the clouds, the bridge, the boat, the ducks, the
// bicycle, the near tulips, the lit windows and their reflections are the engine's.
var nl_C = {
  L: {glow: 'rgba(255,252,236,0.14)', cloud: 'rgba(255,255,255,0.85)', haze: 'rgba(248,244,224,0.75)', trees: '#7E9E8C', farm: '#9AAE9A',
    ground: '#86B45E', tul: ['#E3343C', '#F7C925', '#F38AB2', '#F5862A', '#8E58C6'], water: '#86AECB', refl: 'rgba(70,50,60,0.2)', shine: 'rgba(255,255,255,0.65)', furrow: 'rgba(40,70,30,0.18)',
    pave: '#CFC2AC', brick: '#A04C38', light: 'rgba(255,240,214,0.62)', dark: 'rgba(40,22,30,0.34)', white: '#F7F2E8', glass: '#3E4C60', roof: '#574C4C', green: '#5F8E48', det: '#3A302C', lat: '#6A4E3A',
    grass: '#7DAE52', leaf: '#3F7E36', wood: '#7A5238', willow: '#8CBA5C', rail: '#F4F0E6', bike: '#2E3A44',
    deck: '#8A7058', side: '#5A4636', boat: '#2E6A5E', cabin: '#F2E6CC', star: 'rgba(255,255,255,0.9)'},
  D: {glow: 'rgba(170,180,255,0.1)', cloud: 'rgba(90,100,150,0.6)', haze: 'rgba(110,100,150,0.35)', trees: '#1E2648', farm: '#262E50',
    ground: '#1E3638', tul: ['#8C2C48', '#A08A40', '#94587E', '#985838', '#4E3C80'], water: '#1C2A52', refl: 'rgba(5,8,25,0.35)', shine: 'rgba(190,210,255,0.3)', furrow: 'rgba(0,0,10,0.25)',
    pave: '#3E3E5A', brick: '#4E2E3E', light: 'rgba(200,190,240,0.16)', dark: 'rgba(4,4,20,0.4)', white: '#A6A4C6', glass: '#181A30', roof: '#1C1A30', green: '#1E3434', det: '#12121E', lat: '#3A3248',
    grass: '#1E3A36', leaf: '#163028', wood: '#3A2A2E', willow: '#24403A', rail: '#9896BA', bike: '#0E1220',
    deck: '#3E3446', side: '#2A2232', boat: '#163A40', cabin: '#8C88A8', star: '#FFF4DA'}
};
SCENES.netherlands = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.2), bg = Lay(0), mid = Lay(0), near = Lay(0), C = nl_C[dk ? 'D' : 'L'], c = nl_cam(W, H, ph), i, j, k, x, z;
  var P = function (X, Y, Z) { return nl_P(c, X, Y, Z); }, hz = c.hz, ZF = 4000;
  var sky = dk ? 'linear-gradient(180deg,#101A38 0%,#23305A 38%,#4A4A72 62%,#2A3050 100%)' : 'linear-gradient(180deg,#A9CDEE 0%,#C9E0F4 30%,#E4EFF8 50%,#F3F0DA 62%,#E2E6C6 100%)';
  // ---- the big sky: a soft sun (or moon) glow, long cloud banks low over the polder, haze on the horizon, stars at night
  var sun = [W * (ph ? 0.78 : 0.2), H * (ph ? 0.14 : 0.16)], glow = '';
  for (k = 0; k < 6; k++) glow += nl_c(sun[0], sun[1], (ph ? 18 : 26) * (1 + k * 0.5));
  add(far, 'a', glow, C.glow);
  var cl = ''; [[0.12, 0.5, 1], [0.55, 0.46, 1.3], [0.9, 0.52, 0.9], [0.35, 0.55, 0.8]].forEach(function (q, n) { var cx = W * q[0], cy = H * q[1] * (ph ? 1.08 : 1), s = q[2] * (ph ? 0.6 : 1); for (k = 0; k < 7; k++) cl += nl_e(cx + (k - 3) * 46 * s + hash(n * 9 + k) * 20, cy - Math.sin(k / 6 * Math.PI) * 14 * s, (40 + hash(n * 7 + k) * 30) * s, (10 + hash(n * 5 + k) * 8) * s); });
  if (!ANIM) [[0.62, 0.17, 1.2], [0.9, 0.3, 0.8], [0.36, 0.33, 0.9]].forEach(function (q, n) { var cx = W * q[0], cy = H * q[1], s = q[2] * (ph ? 0.55 : 1); for (k = 0; k < 6; k++) cl += nl_e(cx + (k - 2.5) * 30 * s, cy - Math.sin(k / 5 * Math.PI) * 24 * s, (34 + hash(n * 3 + k) * 20) * s, (20 + hash(n + k) * 10) * s); cl += nl_e(cx, cy + 10 * s, 110 * s, 12 * s); });
  add(far, 'b', cl, C.cloud);
  add(far, 'c', rect(-10, hz - H * 0.05, W + 20, H * 0.05) + nl_e(W * 0.5, hz - 2, W * 0.7, H * 0.035), C.haze);
  var stars = []; if (dk) spread(0, 0, W, hz - H * 0.1, 34, 34, rnd, 1).forEach(function (s) { if (s.q < 0.42 && Math.hypot(s.x - sun[0], s.y - sun[1]) > 50) stars.push({x: s.x, y: s.y, r: 0.5 + s.r * 1.1, k: s.k}); });
  if (!ANIM && dk) { var st = ''; stars.forEach(function (s) { st += nl_c(s.x, s.y, s.r); }); add(far, 'f', st, C.star); add(far, 'g', nl_c(sun[0], sun[1], ph ? 16 : 22), '#FFF2CC'); }
  // ---- the horizon: rows of trees and poplars, low farms with barns, a far line of houses
  var tr = ''; for (x = -20; x < W + 20; x += ph ? 9 : 12) { var hh = (ph ? 3 : 4) + hash(x * 0.37) * (ph ? 5 : 8); if (Math.abs(x - c.vx) < (ph ? 8 : 12)) continue; tr += nl_e(x, hz - hh * 0.4, (ph ? 6 : 9) * (0.8 + hash(x) * 0.5), hh); }
  for (k = 0; k < (ph ? 9 : 14); k++) { x = W * hash(k + 31); if (Math.abs(x - c.vx) < 20) continue; var ph2 = (ph ? 10 : 15) + hash(k + 7) * 8; tr += nl_e(x, hz - ph2 * 0.6, 2.6, ph2 * 0.6) + nl_e(x + 6, hz - ph2 * 0.5, 2.4, ph2 * 0.5); }
  tr += rect(-10, hz - 2, W + 20, 3);
  add(far, 'd', tr, C.trees);
  var fm = ''; [[0.72, 1], [0.93, 0.8], [0.12, 0.9], [0.6, 0.7]].forEach(function (q) { var fx = W * q[0], s = q[1] * (ph ? 0.6 : 1); fm += nl_pg([[fx - 16 * s, hz], [fx - 16 * s, hz - 7 * s], [fx - 4 * s, hz - 17 * s], [fx + 10 * s, hz - 7 * s], [fx + 10 * s, hz]]) + rect(fx + 10 * s, hz - 6 * s, 14 * s, 6 * s); });
  add(far, 'e', fm, C.farm);
  // ---- the ground: tulip fields in stripes along the canal, and further out in bands across the view
  add(bg, 'a', rect(-10, hz - 0.5, W + 20, H - hz + 12), C.ground);
  var tulD = ['', '', '', '', ''], stripes = [], fur = '', strip = function (pts, ci, info) { var q = nl_PP(c, pts); tulD[ci] += nl_pg(q); info.p = q; info.ci = ci; stripes.push(info); };
  // block A: in front of the dike road (the near rows), red, yellow and pink;  block B: behind the road, all five colours
  var seqA = [0, 1, 2], seqB = [3, 4, 0, 1, 2], XR = ph ? 46 : 70;
  for (j = 0, x = 7.6; x < 30; x += 3.1, j++) { strip([[x, 0, 5.4], [x + 2.4, 0, 5.4], [x + 2.4, 0, 10.0], [x, 0, 10.0]], seqA[j % 3], {b: 0, x: x, z0: 5.4, z1: 10}); }
  for (j = 0, x = 7.6; x < XR; x += 3.1, j++) { strip([[x, 0, 12.6], [x + 2.4, 0, 12.6], [x + 2.4, 0, 60], [x, 0, 60]], seqB[j % 5], {b: 1, x: x, z0: 12.6, z1: 60}); var f0 = P(x + 1.2, 0, 12.6), f1 = P(x + 1.2, 0, 60); fur += seg(f0[0], f0[1], f1[0], f1[1]); }
  // blocks C: bands across the view, right of the canal from 64 m out and left of it beyond the houses
  for (j = 0, z = 64; z < 190; z += 7 + z * 0.03, j++) { var dz = 5 + z * 0.022; strip([[6.4, 0, z], [140, 0, z], [140, 0, z + dz], [6.4, 0, z + dz]], (j * 2 + 1) % 5, {b: 2, z0: z, z1: z + dz, x: 6.4}); if (z > 52) strip([[-170, 0, z], [-6.5, 0, z], [-6.5, 0, z + dz], [-170, 0, z + dz]], (j * 3 + 2) % 5, {b: 3, z0: z, z1: z + dz, x: -6.5}); }
  tulD.forEach(function (d, ci) { add(bg, 'bcdef'[ci], d, C.tul[ci]); });
  stk(bg, 't', fur, C.furrow, 1);
  // the canal: its water to the horizon, the houses' reflections in it, a few glints
  var wL = [P(-5, -0.8, 5), P(-5, -0.8, ZF)], wR = [P(5, -0.8, 5), P(5, -0.8, ZF)];
  add(bg, 'g', nl_pg([wL[0], wR[0], wR[1], wL[1]]), C.water);
  var shine = ''; for (k = 0; k < (ph ? 22 : 34); k++) { z = 6 + Math.pow(hash(k + 3), 1.6) * 90, x = -4 + hash(k + 11) * 8; var a0 = P(x, -0.8, z), len = (0.5 + hash(k) * 1.4) * c.f / z; shine += seg(a0[0], a0[1], a0[0] + len, a0[1]); }
  stk(bg, 's', shine, C.shine, 1.2);
  // ---- the canal houses on the left bank, nearest first
  var hs = [], zz = 12.4;
  nl_HOUSES.forEach(function (h) { hs.push({t: h[0], w: h[1], He: h[2], Ht: h[3], col: h[4], z0: zz, z1: zz + h[1]}); zz += h[1]; });
  var sil = '', green = '', brick = '', light = '', dark = '', white = '', glass = '', roof = '', det = '', reflD = '', wins = [], lamps = [];
  var wclip = function (Q) { Q = nl_clip(Q, wL[0], wL[1], -1); return Q.length > 2 ? nl_pg(Q) : ''; };
  for (i = hs.length - 1; i >= 0; i--) { var h = hs[i], prof = nl_gable(h.t, h.w, h.He, h.Ht), F = prof.map(function (p) { return [nl_FX, p[1], h.z0 + p[0]]; });
    var face = nl_q(c, F), prev = hs[i - 1];
    brick += face; sil += face; if (h.col === 1) light += face; if (h.col === 2) dark += face;
    // the reflection in the canal (only the part that falls on the water)
    reflD += wclip(nl_PP(c, F.map(function (p) { return [p[0], -1.6 - p[1], p[2]]; })));
    // the side wall facing us where this house stands taller than its nearer neighbour (all of it for the nearest one)
    var y0 = prev ? Math.min(prev.He, prev.Ht - 1) : 0;
    if (!prev || prev.z1 < h.z0 - 0.1) y0 = 0;
    if (h.He > y0 + 0.2) { var sw = nl_fz(c, -24, nl_FX, y0, h.He, h.z0); brick += sw; sil += sw; dark += sw; dark += sw; }
    if (!prev || prev.z1 < h.z0 - 0.1) {
      dark += nl_fz(c, -24, nl_FX, 0, 0.7, h.z0); white += nl_fz(c, -24, nl_FX, h.He - 0.4, h.He, h.z0) + nl_fz(c, -24, nl_FX, 3.0, 3.15, h.z0);
      for (k = 0; k < 4; k++) { var sx0 = nl_FX - 2.6 - k * 3.2; if (sx0 < -23) break; for (j = 0; j < 3; j++) { var vy = 3.8 + j * 3; if (vy + 1.8 > h.He) break; white += nl_fz(c, sx0 - 1.0, sx0, vy - 0.1, vy + 1.9, h.z0 - 0.01); glass += nl_fz(c, sx0 - 0.85, sx0 - 0.15, vy, vy + 1.8, h.z0 - 0.02); green += nl_fz(c, sx0 - 1.5, sx0 - 1.05, vy, vy + 1.8, h.z0 - 0.015) + nl_fz(c, sx0 + 0.05, sx0 + 0.5, vy, vy + 1.8, h.z0 - 0.015); wins.push({q: nl_PP(c, [[sx0 - 0.85, vy, h.z0], [sx0 - 0.15, vy, h.z0], [sx0 - 0.15, vy + 1.8, h.z0], [sx0 - 0.85, vy + 1.8, h.z0]]), z: h.z0, lit: hash(i * 31 + k * 7 + j) < 0.5, side: 1}); } } }
    // white trims: the stone steps of a step gable, scroll ornaments, a cornice
    if (h.t === 'step') { var a = h.w * 0.13, r = (h.Ht - h.He) / 4; for (k = 0; k < 3; k++) { white += nl_q(c, [[nl_FX, h.He + r * k, h.z0 + a * k - 0.1], [nl_FX, h.He + r * k, h.z0 + a * (k + 1) + 0.05], [nl_FX, h.He + r * k + 0.25, h.z0 + a * (k + 1) + 0.05], [nl_FX, h.He + r * k + 0.25, h.z0 + a * k - 0.1]]) + nl_q(c, [[nl_FX, h.He + r * k, h.z1 - a * (k + 1) - 0.05], [nl_FX, h.He + r * k, h.z1 - a * k + 0.1], [nl_FX, h.He + r * k + 0.25, h.z1 - a * k + 0.1], [nl_FX, h.He + r * k + 0.25, h.z1 - a * (k + 1) - 0.05]]); } }
    if (h.t === 'bell' || h.t === 'neck') { white += nl_q(c, [[nl_FX, h.He, h.z0 - 0.05], [nl_FX, h.He, h.z0 + h.w * 0.18], [nl_FX, h.He + 0.9, h.z0 + h.w * 0.12], [nl_FX, h.He + 0.5, h.z0]]) + nl_q(c, [[nl_FX, h.He, h.z1 - h.w * 0.18], [nl_FX, h.He, h.z1 + 0.05], [nl_FX, h.He + 0.5, h.z1], [nl_FX, h.He + 0.9, h.z1 - h.w * 0.12]]) + nl_q(c, [[nl_FX, h.Ht - 0.3, h.z0 + h.w * 0.44], [nl_FX, h.Ht - 0.3, h.z0 + h.w * 0.56], [nl_FX, h.Ht + 0.3, h.z0 + h.w * 0.53], [nl_FX, h.Ht + 0.3, h.z0 + h.w * 0.47]]); }
    if (h.t === 'cornice') white += nl_q(c, [[nl_FX + 0.3, h.Ht - 0.55, h.z0 - 0.15], [nl_FX + 0.3, h.Ht - 0.55, h.z1 + 0.15], [nl_FX + 0.3, h.Ht, h.z1 + 0.15], [nl_FX + 0.3, h.Ht, h.z0 - 0.15]]);
    white += nl_q(c, [[nl_FX, 0, h.z0], [nl_FX, 0, h.z1], [nl_FX, 0.5, h.z1], [nl_FX, 0.5, h.z0]]);
    // windows: tall white sashes, the ground floor with a door and its stoop, a little window and a hoist beam in the gable
    var nc = h.w > 4.5 ? 3 : 2, cw = 0.9;
    for (j = 0; j < nc; j++) { var u = h.w * (j + 0.5) / nc, zc = h.z0 + u;
      for (var fl = 0; ; fl++) { var v0 = fl ? 3.4 + (fl - 1) * 3.0 : 0.9, wh = fl ? 1.9 : 2.0; if (v0 + wh > h.He - 0.4) break;
        if (fl === 0 && j === 0) { glass += nl_fx(c, nl_FX + 0.01, zc - 0.5, zc + 0.5, 0.5, 2.8); white += nl_fx(c, nl_FX, zc - 0.62, zc + 0.62, 0.45, 2.95) + nl_gr(c, nl_FX, nl_FX + 1.2, zc - 0.7, zc + 0.7, 0.45); wins.push({q: nl_PP(c, [[nl_FX, 2.2, zc - 0.45], [nl_FX, 2.2, zc + 0.45], [nl_FX, 2.8, zc + 0.45], [nl_FX, 2.8, zc - 0.45]]), z: zc, lit: true, door: 1}); continue; }
        white += nl_fx(c, nl_FX, zc - cw / 2 - 0.12, zc + cw / 2 + 0.12, v0 - 0.15, v0 + wh + 0.12); glass += nl_fx(c, nl_FX + 0.01, zc - cw / 2, zc + cw / 2, v0, v0 + wh);
        var wq = [[nl_FX, v0, zc - cw / 2], [nl_FX, v0, zc + cw / 2], [nl_FX, v0 + wh, zc + cw / 2], [nl_FX, v0 + wh, zc - cw / 2]];
        wins.push({q: nl_PP(c, wq), rq: nl_PP(c, wq.map(function (p) { return [p[0], -1.6 - p[1], p[2]]; })), z: zc, lit: hash(i * 13 + j * 5 + fl * 3) < (fl < 2 ? 0.7 : 0.45)});
        white += nl_fx(c, nl_FX, zc - cw / 2, zc + cw / 2, v0 + wh * 0.55 - 0.06, v0 + wh * 0.55 + 0.06); } }
    var gz = h.z0 + h.w / 2; if (h.t !== 'cornice') { white += nl_fx(c, nl_FX, gz - 0.42, gz + 0.42, h.He + 0.4, h.He + 1.7); glass += nl_fx(c, nl_FX + 0.01, gz - 0.3, gz + 0.3, h.He + 0.5, h.He + 1.6);
      var gq = [[nl_FX, h.He + 0.5, gz - 0.3], [nl_FX, h.He + 0.5, gz + 0.3], [nl_FX, h.He + 1.6, gz + 0.3], [nl_FX, h.He + 1.6, gz - 0.3]]; wins.push({q: nl_PP(c, gq), rq: nl_PP(c, gq.map(function (p) { return [p[0], -1.6 - p[1], p[2]]; })), z: gz, lit: hash(i + 77) < 0.4}); }
  }
  // the street along the houses, the quays and the dike road, with the brick quay walls down to the water
  var BR = {z0: 10.2, z1: 12.2}, pave = nl_gr(c, -40, -5, 5, 10.2) + nl_gr(c, nl_FX - 0.1, -5, 10.1, 60) + nl_gr(c, -9, -5, 59.9, ZF) + nl_gr(c, 5, 7.4, 5, ZF) + nl_gr(c, 5, 300, BR.z0, BR.z1) + nl_gr(c, -40, -5, BR.z0, BR.z1);
  var qwall = nl_fx(c, -5, 5, ZF, -0.8, 0) + nl_fx(c, 5, 5, ZF, -0.8, 0);
  for (k = 0; k < 6; k++) { var lz = 14 + k * 7.5; if (lz > 50) break; lamps.push([-5.7, 3.6, lz]); }
  lamps.push([5.6, 3.6, 16]); lamps.push([5.6, 3.6, 27]);
  lamps.forEach(function (L) { var b = P(L[0], 0, L[2]), t = P(L[0], L[1], L[2]), s = c.f / L[2]; det += seg(b[0], b[1], t[0], t[1]) + seg(t[0], t[1], t[0] + 0.35 * s, t[1]); roof += nl_pg([[t[0] - 0.2 * s, t[1] - 0.1 * s], [t[0] + 0.55 * s, t[1] - 0.1 * s], [t[0] + 0.45 * s, t[1] + 0.55 * s], [t[0] - 0.1 * s, t[1] + 0.55 * s]]); });
  // ---- the windmills: a brick base with a stage around it, an eight-sided thatched tower, a white-trimmed cap
  var mills = ph ? [{X: 10.5, Z: 21, H: 15.5, R: 10, sp: 0.32}, {X: 6.6, Z: 62, H: 14, R: 9, sp: 0.5}, {X: 60, Z: 70, H: 13, R: 8.5, sp: 0.24}] : [{X: 19, Z: 17, H: 15.5, R: 10, sp: 0.32}, {X: 8, Z: 62, H: 14, R: 9, sp: 0.5}, {X: 110, Z: 72, H: 13, R: 8.5, sp: 0.24}];
  mills.forEach(function (m, n) { var s = c.f / m.Z, b = P(m.X, 0, m.Z), X = function (u) { return b[0] + u * s; }, Y = function (v) { return b[1] - v * s; };
    brick += nl_pg([[X(-3.7), Y(0)], [X(3.7), Y(0)], [X(3.4), Y(3.8)], [X(-3.4), Y(3.8)]]);
    dark += nl_pg([[X(-3.7), Y(0)], [X(-2.2), Y(0)], [X(-2.0), Y(3.8)], [X(-3.4), Y(3.8)]]);
    var tw = function (v) { return 3.1 - (v - 3.8) / (m.H - 3.8) * 1.4; };
    roof += nl_pg([[X(-tw(3.8)), Y(3.8)], [X(tw(3.8)), Y(3.8)], [X(tw(m.H)), Y(m.H)], [X(-tw(m.H)), Y(m.H)]]); sil += nl_pg([[X(-tw(3.8)), Y(0)], [X(tw(3.8)), Y(0)], [X(tw(m.H)), Y(m.H)], [X(-1.3), Y(m.H + 2.1)], [X(0.4), Y(m.H + 2.35)], [X(1.7), Y(m.H + 1.9)], [X(-tw(m.H)), Y(m.H)]]);
    light += nl_pg([[X(-tw(3.8) * 0.42), Y(3.8)], [X(tw(3.8) * 0.42), Y(3.8)], [X(tw(m.H) * 0.42), Y(m.H)], [X(-tw(m.H) * 0.42), Y(m.H)]]);
    dark += nl_pg([[X(-tw(3.8)), Y(3.8)], [X(-tw(3.8) * 0.42), Y(3.8)], [X(-tw(m.H) * 0.42), Y(m.H)], [X(-tw(m.H)), Y(m.H)]]);
    // the cap, its white rim, the white beard board under the axle
    roof += nl_pg([[X(-2.3), Y(m.H)], [X(-2.2), Y(m.H + 1.3)], [X(-1.3), Y(m.H + 2.1)], [X(0.4), Y(m.H + 2.35)], [X(1.7), Y(m.H + 1.9)], [X(2.4), Y(m.H + 0.9)], [X(2.3), Y(m.H)]]);
    white += rect(X(-2.45), Y(m.H + 0.25), 4.9 * s, 0.5 * s) + nl_pg([[X(-0.9), Y(m.H + 0.3)], [X(0.9), Y(m.H + 0.3)], [X(0.5), Y(m.H - 1.2)], [X(-0.5), Y(m.H - 1.2)]]);
    // the stage: a plank deck on struts, with a railing
    roof += rect(X(-5.6), Y(4.1), 11.2 * s, 0.35 * s);
    det += seg(X(-5.6), Y(4.1), X(-3.5), Y(1.6)) + seg(X(5.6), Y(4.1), X(3.5), Y(1.6)) + seg(X(-5.5), Y(5.1), X(5.5), Y(5.1));
    for (k = -5; k <= 5; k++) det += seg(X(k * 1.08), Y(4.1), X(k * 1.08), Y(5.1));
    // a door at the foot, small windows up the tower
    white += nl_pg([[X(-0.8), Y(0)], [X(0.8), Y(0)], [X(0.8), Y(2.3)], [X(-0.8), Y(2.3)]]); glass += rect(X(-0.6), Y(2.1), 1.2 * s, 2.1 * s);
    [6.4, 9.6].forEach(function (v) { white += rect(X(-0.55), Y(v + 1.3), 1.1 * s, 1.5 * s); glass += rect(X(-0.4), Y(v + 1.15), 0.8 * s, 1.2 * s); if (n === 0) wins.push({q: [[X(-0.4), Y(v + 1.15)], [X(0.4), Y(v + 1.15)], [X(0.4), Y(v - 0.05)], [X(-0.4), Y(v - 0.05)]], z: m.Z, lit: true, mill: 1}); });
    white += rect(X(-0.6), Y(4.35), 0.12 * s, 0.01);
  });
  // trees along the far bank and behind the far end of the houses (elms, and a willow near the farm)
  [[9.6, 30, 1], [-7, 66, 1.1], [-7.4, 90, 1], [11, 110, 1.2], [-20, 64, 1]].forEach(function (q, n) { var b = P(q[0], 0, q[1]), s = c.f / q[1] * q[2];
    det += seg(b[0], b[1], b[0], b[1] - 4 * s); for (k = 0; k < 6; k++) green += nl_e(b[0] + (hash(n * 7 + k) - 0.5) * 4 * s, b[1] - (5 + hash(n * 3 + k) * 3) * s, (1.6 + hash(k + n) * 0.8) * s, (1.3 + hash(n + k * 2) * 0.6) * s); sil += rect(b[0] - 3 * s, b[1] - 9 * s, 6 * s, 9 * s); });
  // in the still scene: the bridge down, the sails, a moored houseboat
  var still = !ANIM;
  if (still) { var bd = nl_bridge(c, BR, 0); pave += bd.deck; dark += bd.side; white += bd.white; det += bd.dark; white += ''; var rails = bd.rail;
    var sl = {stock: '', lat: '', cloth: ''}; mills.forEach(function (m, n) { var o = nl_sails(c, m, 0.4 + n * 0.5); sl.stock += o.stock; sl.lat += o.lat; sl.cloth += o.cloth; }); }
  add(mid, 'a', pave, C.pave); add(mid, 'b', brick + qwall, C.brick); add(mid, 'c', light, C.light); add(mid, 'd', dark, C.dark); add(mid, 'e', white + (still ? sl.cloth : ''), C.white); add(mid, 'f', glass, still && dk ? '#E8B45A' : C.glass); add(mid, 'g', roof + (still ? sl.stock : ''), C.roof); add(mid, 'h', green, C.green);
  stk(mid, 's', det, C.det, ph ? 0.9 : 1.2); if (still) stk(mid, 't', sl.lat + rails, C.lat, 1);
  add(bg, 'h', reflD, C.refl);
  // ---- the foreground: the near quays, a flower cart with pots of tulips, bicycles at the railing, the willow, the near tulip rows
  var grass = '', qb = '', lf = '', heads = ['', '', ''], wood = '', wl = '', railS = '', bikeS = '', tulips = [];
  // the near tulip rows in front of the road (the engine sways their heads)
  stripes.filter(function (s) { return s.b === 0; }).forEach(function (s) { for (z = 6.1; z < 10; z += 0.42) for (x = s.x + 0.2; x < s.x + 2.3; x += 0.42) { var b = P(x + (hash(x * 3 + z) - 0.5) * 0.12, 0, z); if (b[0] < -10 || b[0] > W + 10 || b[1] > H + 30) continue; tulips.push({x: b[0], y: b[1], s: c.f / z, ci: s.ci, ph: x * 0.55 + z * 0.9}); } });
  tulips.sort(function (p, q) { return p.y - q.y; });
  tulips.forEach(function (t) { var s = t.s; lf += nl_leaf(t.x, t.y, 0.3 * s, 0.05 * s, -70 - hash(t.x) * 12) + nl_leaf(t.x, t.y, 0.26 * s, 0.045 * s, -112 + hash(t.y) * 12) + rect(t.x - 0.012 * s, t.y - 0.34 * s, 0.024 * s, 0.34 * s); if (still) heads[t.ci] += nl_cup(t.x, t.y - 0.33 * s, 0.13 * s, 0.13 * s); });
  var tlf = lf;
  // bicycles leaning on the white railing along the road, in front of the fields
  var rz = BR.z0 - 0.15, r0 = P(7.6, 0.95, rz), r1 = P(ph ? 16 : 14.5, 0.95, rz); railS += seg(r0[0], r0[1], r1[0], r1[1]); r0 = P(7.6, 0.5, rz); r1 = P(ph ? 16 : 14.5, 0.5, rz); railS += seg(r0[0], r0[1], r1[0], r1[1]);
  for (x = 7.6; x <= (ph ? 16 : 14.6); x += 1.15) { var p0 = P(x, 0, rz), p1 = P(x, 1.0, rz); railS += seg(p0[0], p0[1], p1[0], p1[1]); }
  var bikes = ph ? [[8.6, 1], [10.6, -1]] : [[8.4, 1], [10.3, -1], [12.4, 1]];
  bikes.forEach(function (bk) { var b = P(bk[0], 0, rz - 0.3), s = c.f / (rz - 0.3); bikeS += nl_bike(b[0], b[1], s, bk[1], 0.12); });
  // the willow on a patch of grass among the fields behind the road (while animated, the engine draws it, so that the
  // bridge and the bicycle on the road pass in front of it)
  var wb = ph ? [9, 0, 14.5] : [10, 0, 14.5], wp = P(wb[0], 0, wb[2]), ws = c.f / wb[2], wTr = '', wLf = '', wGp = [];
  for (k = 0; k < 18; k++) wGp.push([wb[0] + Math.cos(k / 18 * Math.PI * 2) * 2.8, 0, wb[2] + 0.2 + Math.sin(k / 18 * Math.PI * 2) * 1.6]);
  var wG = nl_q(c, wGp);
  wTr += nl_pg([[wp[0] - 0.35 * ws, wp[1]], [wp[0] + 0.35 * ws, wp[1]], [wp[0] + 0.25 * ws, wp[1] - 3 * ws], [wp[0] + 1.2 * ws, wp[1] - 5 * ws], [wp[0] + 0.9 * ws, wp[1] - 5.2 * ws], [wp[0] - 0.05 * ws, wp[1] - 3.6 * ws], [wp[0] - 0.9 * ws, wp[1] - 5.4 * ws], [wp[0] - 1.15 * ws, wp[1] - 5.2 * ws], [wp[0] - 0.25 * ws, wp[1] - 3 * ws]]);
  // a dome of foliage, and long strands hanging from it almost to the ground (the darker ones behind)
  var strand = function (a, len, w0, out) { var cx = wp[0] + Math.cos(a) * 3.0 * ws, cy = wp[1] - (6.3 - Math.sin(a) * 1.5) * ws, bx = cx + Math.cos(a) * out * ws, by = wp[1] - len * ws, A2 = [], B2 = [];
    for (var q = 0; q <= 6; q++) { var u = q / 6, x = cx + (bx - cx) * Math.sin(u * Math.PI / 2), y = cy + (by - cy) * u, w = (w0 * (1 - u) + w0 * 0.3 * u) * ws; A2.push([x - w, y]); B2.unshift([x + w, y]); } return nl_pg(A2.concat(B2)); };
  for (k = 0; k < 7; k++) { var aa = Math.PI * (1.08 + k / 6 * 0.84); wl += nl_e(wp[0] + Math.cos(aa) * 2.4 * ws, wp[1] - (6.6 - Math.sin(aa) * 1.1) * ws, 1.3 * ws, 0.9 * ws); }
  wl += nl_e(wp[0], wp[1] - 6.4 * ws, 2.6 * ws, 1.2 * ws);
  // the shady inside of the crown: a curtain from the dome down to a ragged hem (the trunk shows against it)
  var cur = []; for (k = 0; k <= 12; k++) { var ca = Math.PI * (1 + k / 12); cur.push([wp[0] + Math.cos(ca) * 3.3 * ws, wp[1] - (6.4 - Math.sin(ca) * 1.5) * ws]); }
  for (k = 0; k <= 16; k++) cur.push([wp[0] + (3.5 - k / 16 * 7) * ws, wp[1] - (1.5 + hash(k + 40) * 0.9 + Math.abs(k / 16 - 0.5) * 1.2) * ws]);
  wLf += nl_pg(cur);
  for (k = 0; k < 18; k++) wLf += strand(Math.PI * (1.02 + k / 17 * 0.96), 1.2 + hash(k + 5) * 0.8 + Math.abs(k / 17 - 0.5) * 1.2, 0.26, 0.9);
  for (k = 0; k < 30; k++) { if (k % 7 === 3) continue; wl += strand(Math.PI * (1.0 + k / 29 * 1.0) + (hash(k) - 0.5) * 0.05, 1.6 + hash(k + 2) * 1.2 + Math.abs(k / 29 - 0.5) * 1.6, 0.42, 0.6 + hash(k + 8) * 0.5); }
  var wTop = wl; wl = ''; lf = tlf;
  if (!ANIM) { grass += wG; wood += wTr; lf += wLf; wl = wTop; }
  // the flower cart on the near-left quay, with pots of tulips, and a grass verge along the near right quay
  var cx0 = ph ? -7.4 : -8, cz = ph ? 9.6 : 7.8, cp = P(cx0, 0, cz), cs = c.f / cz, X2 = function (u) { return cp[0] + u * cs; }, Y2 = function (v) { return cp[1] - v * cs; };
  if (cp[0] > -40) { wood += rect(X2(-1.2), Y2(1.05), 2.4 * cs, 0.14 * cs) + nl_pg([[X2(-1.15), Y2(0.9)], [X2(1.15), Y2(0.9)], [X2(1.05), Y2(0.55)], [X2(-1.05), Y2(0.55)]]) + rect(X2(1.1), Y2(1.0), 1.0 * cs, 0.07 * cs);
    bikeS += nl_c(X2(-0.6), Y2(0.32), 0.3 * cs) + nl_c(X2(0.6), Y2(0.32), 0.3 * cs) + seg(X2(-0.9), Y2(0.9), X2(-0.9), Y2(0)) ;
    for (k = 0; k < 5; k++) { var ux = -0.95 + k * 0.48; qb += nl_pg([[X2(ux - 0.2), Y2(1.42)], [X2(ux + 0.2), Y2(1.42)], [X2(ux + 0.15), Y2(1.05)], [X2(ux - 0.15), Y2(1.05)]]);
      for (j = 0; j < 4; j++) { var hx = X2(ux - 0.15 + j * 0.1 + (hash(k * 4 + j) - 0.5) * 0.05), hy = Y2(1.62 + hash(j + k) * 0.2); lf += rect(hx - 0.01 * cs, hy, 0.02 * cs, 0.25 * cs); heads[(k + j) % 3] += nl_cup(hx, hy, 0.11 * cs, 0.12 * cs); } } }
  [[-5.5, 7.0], [-5.5, 9.2], [5.5, 7.4]].forEach(function (q) { var b = P(q[0], 0, q[1]), s = c.f / q[1]; wood += rect(b[0] - 0.13 * s, b[1] - 0.75 * s, 0.26 * s, 0.75 * s) + nl_e(b[0], b[1] - 0.75 * s, 0.16 * s, 0.07 * s); qb += rect(b[0] - 0.15 * s, b[1] - 0.6 * s, 0.3 * s, 0.08 * s); });
  grass += nl_gr(c, 7.4, 7.65, 5, ZF) + nl_gr(c, 5.2, 7.4, 5.0, 10.0);
  add(near, 'a', grass, C.grass); add(near, 'b', qb, C.brick); add(near, 'c', lf, C.leaf); add(near, 'd', heads[0], C.tul[0]); add(near, 'e', heads[1], C.tul[1]); add(near, 'f', heads[2], C.tul[2]); add(near, 'g', wood, C.wood); add(near, 'h', wl, C.willow);
  stk(near, 's', railS, C.rail, ph ? 1.4 : 2); stk(near, 't', bikeS, C.bike, ph ? 1.2 : 1.6);
  if (ANIM) { ANIM.cam = c; ANIM.C = C; ANIM.mills = mills; ANIM.bridge = BR; ANIM.stripes = stripes; ANIM.tulips = tulips; ANIM.wins = wins; ANIM.lamps = lamps; ANIM.stars = stars; ANIM.sun = sun; ANIM.water = [wL[0], wR[0], wR[1], wL[1]]; ANIM.sil = sil; ANIM.willow = {g: wG, tr: wTr, dk: wLf, lt: wTop, y: wp[1] - 6.4 * ws}; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
// a bicycle seen from the side: wheels on the ground at (x, y), s pixels to the metre, facing dir (1 right, -1 left), leaning by tilt
function nl_bike(x, y, s, dir, tilt) {
  var r = 0.34 * s, d = dir, t = tilt || 0, P = function (u, v) { return [x + (u * d + v * t) * s, y - v * s]; }, L = function (a, b) { return 'M' + PT.apply(null, P(a[0], a[1])) + ' L' + PT.apply(null, P(b[0], b[1])) + ' '; };
  var w1 = P(-0.52, 0.34), w2 = P(0.52, 0.34);
  return nl_c(w1[0], w1[1], r) + nl_c(w2[0], w2[1], r) + L([-0.52, 0.34], [-0.08, 0.36]) + L([-0.08, 0.36], [-0.2, 0.86]) + L([-0.52, 0.34], [-0.2, 0.86]) + L([-0.2, 0.86], [0.38, 0.84]) + L([-0.08, 0.36], [0.38, 0.84]) + L([0.52, 0.34], [0.38, 0.84]) + L([0.38, 0.84], [0.32, 1.02]) + L([0.26, 1.02], [0.44, 1.02]) + L([-0.3, 0.9], [-0.1, 0.9]) + L([0.42, 0.78], [0.66, 0.78]) + L([0.66, 0.78], [0.62, 0.58]) + L([0.42, 0.58], [0.66, 0.58]);
}
