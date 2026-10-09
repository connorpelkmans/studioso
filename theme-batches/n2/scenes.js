// ---- batch n2: mushrooms (Mushroom Hollow), sunflowers (Sunflower Field), cloudkingdom (Cloud Kingdom), nighttrain (Night Train), ramen (Ramen Shop)
// Shared helpers, all prefixed n2_ because every batch shares this closure.
// Winding fix: fills use the nonzero rule, so plain polygons and arc-only ellipses are made clockwise; overlapping shapes
// in one slot then merge instead of punching holes. A path with h/v/a segments (rect, rrect, n2_hole) is left as drawn.
function n2_cw(d) {
  if (!d) return d;
  return d.split(/(?=M)/).map(function (sp) {
    if (/^M[-\d. ]+a/.test(sp) && !/[LlHhVvQqCcZz]/.test(sp)) return sp.replace(/ 0 1 0 /g, ' 0 1 1 ');
    if (/^M[-\d. L]+Z\s*$/.test(sp)) { var nums = sp.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number), a = 0, n = nums.length / 2, i;
      for (i = 0; i < n; i++) { var j = (i + 1) % n; a += nums[2 * i] * nums[2 * j + 1] - nums[2 * j] * nums[2 * i + 1]; }
      if (a < 0) { var pts = []; for (i = n - 1; i >= 0; i--) pts.push(nums[2 * i] + ' ' + nums[2 * i + 1]); return 'M' + pts.join(' L') + ' Z '; } }
    return sp;
  }).join('');
}
function n2_out(o) { ['far', 'refl', 'mid', 'near'].forEach(function (k) { var L = o[k]; if (L) 'abcdefgh'.split('').forEach(function (s) { L[s].d = n2_cw(L[s].d); }); }); return o; }
// a rounded-rect hole: drawn the other way round, so inside a clockwise shape in the same slot it cuts a window
function n2_hole(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); return 'M' + PT(x + r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 0 0 ' + n1(-r) + ' ' + n1(r) + ' v' + n1(h - 2 * r) + ' a' + n1(r) + ' ' + n1(r) + ' 0 0 0 ' + n1(r) + ' ' + n1(r) + ' h' + n1(w - 2 * r) + ' a' + n1(r) + ' ' + n1(r) + ' 0 0 0 ' + n1(r) + ' ' + n1(-r) + ' v' + n1(-(h - 2 * r)) + ' a' + n1(r) + ' ' + n1(r) + ' 0 0 0 ' + n1(-r) + ' ' + n1(-r) + ' Z '; }
function n2_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.001; x += step) p.push([x, fn(x)]); return p; }
function n2_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n2_q(p0, p1, p2, n) { var o = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
// a stroke turned into a filled outline, tapering from w0 to w1
function n2_tube(pts, w0, w1) { var L = [], R = [], n = pts.length; for (var i = 0; i < n; i++) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, w = lerp(w0, w1, i / Math.max(1, n - 1)) / 2; L.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]); R.unshift([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]); } return poly(L.concat(R)); }
// a puffy cloud: circles along a base, with a flat-ish bottom
function n2_puff(x, y, w, h, rnd) { var d = '', n = Math.max(3, Math.round(w / (h * 0.9))); for (var i = 0; i < n; i++) { var u = (i + 0.5) / n, r = h * (0.45 + 0.4 * Math.sin(Math.PI * u)) * (0.85 + rnd() * 0.3); d += circ(x - w / 2 + u * w, y - r * 0.55, r); } return d + rrect(x - w / 2, y - h * 0.35, w, h * 0.35, h * 0.17); }
function n2_spark(x, y, r) { return poly([[x, y - r], [x + r * 0.22, y - r * 0.22], [x + r, y], [x + r * 0.22, y + r * 0.22], [x, y + r], [x - r * 0.22, y + r * 0.22], [x - r, y], [x - r * 0.22, y - r * 0.22]]); }
// a fern frond: spine from (x,y) heading a0 (radians, -PI/2 = up), bending by `bend` and curling tight at the tip by `curl` (0..1)
function n2_frondPts(x, y, len, a0, bend, curl) { var pts = [[x, y]], a = a0, n = 30, st = len / n; for (var i = 1; i <= n; i++) { var s = i / n; a += bend / n + curl * Math.pow(s, 4) * 0.9; x += Math.cos(a) * st * (1 - curl * 0.55 * s * s); y += Math.sin(a) * st * (1 - curl * 0.55 * s * s); pts.push([x, y]); } return pts; }
function n2_frond(x, y, len, a0, bend, curl, w) {
  var pts = n2_frondPts(x, y, len, a0, bend, curl), d = n2_tube(pts, w || len * 0.03, (w || len * 0.03) * 0.4), n = pts.length - 1;
  for (var i = 3; i < n - 2; i++) { var s = i / n, p = pts[i], q = pts[i + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI, sz = len * 0.2 * Math.pow(1 - s, 0.7) * (1 - curl * Math.pow(s, 1.5)); if (sz < 2) continue;
    d += leaf(p[0], p[1], sz, sz * 0.26, ang - 62) + leaf(p[0], p[1], sz, sz * 0.26, ang + 62); }
  return d;
}

// ================= 1. Mushroom Hollow: a mossy glade of toadstools, fallen logs and ferns =================
// one mushroom with its base at (x, y): stem height h, cap radius r, stem top leans by `lean`. kind: 'toad' (round cap with
// spots), 'flat' (wide flat cap), 'bell' (tall bell cap). Returns path strings for stem, under (gills), cap, spots, shine.
function n2_shroom(x, y, h, r, lean, kind) {
  var st = [], L = [], R = [], i, tx = x + lean, ty = y - h, w0 = r * (kind === 'bell' ? 0.2 : 0.27), w1 = r * (kind === 'bell' ? 0.13 : 0.19), ry = kind === 'flat' ? 0.42 : kind === 'bell' ? 1.05 : 0.8;
  for (i = 0; i <= 10; i++) { var u = i / 10, cx = x + lean * (u * u * 0.7 + u * 0.3), w = lerp(w0, w1, u) * (1 + 0.35 * Math.pow(1 - u, 6)); L.push([cx - w, y - h * u]); R.unshift([cx + w, y - h * u]); }
  st = poly(L.concat(R)) + ell(x, y, w0 * 1.25, w0 * 0.32);
  var cap = [], a; for (i = 0; i <= 20; i++) { a = Math.PI + i / 20 * Math.PI; var k = kind === 'bell' ? Math.pow(Math.abs(Math.cos(a)), 0.7) * Math.sign(Math.cos(a)) : Math.cos(a); cap.push([tx + r * k, ty + r * ry * Math.sin(a)]); }
  for (i = 1; i < 10; i++) { a = i / 10 * Math.PI; cap.push([tx + r * Math.cos(a), ty + r * 0.16 * Math.sin(a)]); }
  var spots = '';
  if (kind !== 'flat') [[-0.52, 0.38, 0.13], [0.04, 0.68, 0.16], [0.5, 0.36, 0.12], [-0.18, 0.2, 0.08], [0.3, 0.7, 0.08], [-0.42, 0.66, 0.07], [0.7, 0.14, 0.06]].forEach(function (s) { spots += ell(tx + s[0] * r, ty - s[1] * r * ry, s[2] * r * 1.1, s[2] * r * 0.85); });
  else [[-0.5, 0.3, 0.07], [0.1, 0.55, 0.08], [0.55, 0.28, 0.06]].forEach(function (s) { spots += ell(tx + s[0] * r, ty - s[1] * r * ry, s[2] * r * 1.2, s[2] * r * 0.7); });
  return {stem: st, under: ell(tx, ty + r * 0.06, r * 0.93, r * 0.2), cap: poly(cap), spots: spots, shine: rotEll(tx - r * 0.42, ty - r * ry * 0.62, r * 0.2, r * 0.09, -28), top: [tx, ty]};
}
SCENES.mushrooms = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 7 : 9), refl = Lay(ph ? 2 : 3), mid = Lay(0.8), near = Lay(0), i;
  var sky = dk ? 'linear-gradient(180deg,#141A2E 0%,#1B2440 34%,#22304A 62%,#3A3058 100%)' : 'linear-gradient(180deg,#CFE3C5 0%,#E2EDD3 38%,#EEF3DE 66%,#F2E6D8 100%)';
  var gy = H * (ph ? 0.75 : 0.71);
  function gY(x) { return gy + Math.sin(x / 170 + 0.7) * 9 + Math.sin(x / 61) * 3; }
  var C = dk ? {can: '#1C2843', trunk: '#222D4A', fg: '#26324E', beam: 'rgba(150,175,255,0.09)', mt: '#18203A', bark: 'rgba(8,10,24,0.35)', leaf1: '#183338', leaf2: '#1F4245', mound: '#1C3044', bush: '#16283A', log: '#3A3046', logE: '#5A4A60', ring: 'rgba(20,14,30,0.45)', moss: '#2A5A52',
    g1: '#162A36', g2: '#1D3A44', tuft: '#12303A', peb: '#36405A', flw: '#A8F0FF', fern: '#17403F', stone: '#2C3550', cap: '#5FD6E8', stem: '#B8C8E8'} :
    {can: '#B6D29C', trunk: '#BECDA4', fg: '#C4DAA8', beam: 'rgba(255,248,212,0.5)', mt: '#9C8C70', bark: 'rgba(80,60,40,0.28)', leaf1: '#7FB466', leaf2: '#A2CF7C', mound: '#A8CF8C', bush: '#8EBF74', log: '#A9774A', logE: '#EBC995', ring: 'rgba(130,80,40,0.5)', moss: '#8CC46A',
    g1: '#7DB264', g2: '#98CA78', tuft: '#5E9A4E', peb: '#D3CBBB', flw: '#FFFFFF', fern: '#4F9A55', stone: '#B9B4A6', cap: '#E45A48', stem: '#F5EAD8'};
  // far: canopy, pale trunks, light shafts
  var can = '', tr = '';
  for (var x = -40; x < W + 60; x += ph ? 36 : 52) { var w = (ph ? 9 : 14) + rnd() * (ph ? 10 : 16), top = -40; tr += poly([[x - w / 2, gy - 20], [x - w * 0.35, top], [x + w * 0.35, top], [x + w / 2, gy - 20]]); }
  spread(-40, -40, W + 80, H * 0.22, ph ? 60 : 90, 50, rnd, 0.9).forEach(function (c) { can += circ(c.x, c.y, (ph ? 30 : 46) + c.r * 30); });
  add(far, 'a', tr, C.trunk); add(far, 'b', can, C.can);
  add(far, 'c', below(ridge(W, gy - H * 0.05, [[H * 0.02, 140, 1], [H * 0.008, 50, 2]], 10), H + 40), C.fg);
  var beams = ''; (ph ? [0.05, 0.42, 0.78] : [0.06, 0.3, 0.55, 0.8]).forEach(function (f, k) { var x0 = W * f, bw = (ph ? 34 : 60) + k * 8, dx = H * 0.42; beams += poly([[x0, -40], [x0 + bw, -40], [x0 + bw * 2.1 + dx, gy + 10], [x0 + dx, gy + 10]]); });
  add(far, 'h', beams, C.beam);
  // a second row of trunks between the far forest and the near trees, with hanging vines
  var t2 = '', vines = ''; (ph ? [0.22, 0.5, 0.74] : [0.1, 0.19, 0.41, 0.5, 0.6, 0.79, 0.9]).forEach(function (f, k) { var x = W * f + (rnd() - 0.5) * 30, w = (ph ? 16 : 24) + rnd() * 12, b = gY(x) - 14; t2 += poly([[x - w * 0.9, b], [x - w * 0.5, b - w], [x - w * 0.42, -40], [x + w * 0.42, -40], [x + w * 0.5, b - w], [x + w * 0.9, b]]);
    if (k % 2 === 0) { var vx = x + w * 0.6, vl = H * (0.18 + rnd() * 0.2); vines += n2_tube(n2_q([vx, -20], [vx + 30, vl * 0.5], [vx + 6, vl], 12), 3, 1.5); for (var j = 2; j < 10; j++) { var u = j / 10, p = n2_q([vx, -20], [vx + 30, vl * 0.5], [vx + 6, vl], 10)[j]; vines += leaf(p[0], p[1], 9, 3.5, j % 2 ? 40 : 140); } } });
  add(refl, 'a', t2, dk ? '#1C2540' : '#ABBB92'); add(refl, 'b', vines, dk ? '#1E3A40' : '#8DBA70');
  // mid: tree trunks with root flare, hanging canopy leaves, the mound, bushes, the fallen log
  var trunks = '', bark = '', tx = ph ? [[0.04, 50], [0.96, 44]] : [[0.025, 74], [0.27, 46], [0.7, 56], [0.985, 80]];
  tx.forEach(function (q) { var x = W * q[0], w = q[1], b = gY(x) - 8, pts = [[x - w * 1.25, b], [x - w * 0.62, b - w * 0.5], [x - w * 0.5, b - w * 1.4], [x - w * 0.44, -40], [x + w * 0.44, -40], [x + w * 0.5, b - w * 1.4], [x + w * 0.62, b - w * 0.5], [x + w * 1.25, b]]; trunks += poly(pts);
    for (var k = 0; k < 5; k++) { var bx = x - w * 0.3 + k * w * 0.15; bark += pline([[bx, -30], [bx + Math.sin(k) * 4, b * 0.4], [bx - 3, b - w]]); } });
  add(mid, 'a', trunks, C.mt); stk(mid, 's', bark, C.bark, ph ? 1.5 : 2.2);
  var lv1 = '', lv2 = '';
  for (x = -40; x < W + 40; x += ph ? 22 : 30) { var hang = (Math.sin(x / 90) * 0.5 + 0.5) * (ph ? 50 : 80) + rnd() * 30; for (var k = 0; k < 3; k++) { var yy = -10 + rnd() * hang, ang = 70 + rnd() * 40, len = (ph ? 26 : 38) + rnd() * 20; if (k % 2) lv2 += leaf(x + rnd() * 20, yy, len, len * 0.38, ang); else lv1 += leaf(x + rnd() * 20, yy, len, len * 0.38, ang); } }
  add(mid, 'd', lv1, C.leaf1); add(mid, 'e', lv2, C.leaf2);
  var mound = ridge(W, gy - 6, [[7, 120, 0.4], [3, 37, 1.6]], 8);
  add(mid, 'b', below(mound, H + 40), C.mound);
  var bush = ''; spread(-20, gy - 14, W + 40, 10, ph ? 70 : 110, 10, rnd, 0.6).forEach(function (c) { if (c.q < 0.55) { var r = (ph ? 10 : 16) + c.r * 12; bush += circ(c.x, n2_yOn(mound, c.x) + 2, r) + circ(c.x + r * 0.8, n2_yOn(mound, c.x) + 4, r * 0.7) + circ(c.x - r * 0.8, n2_yOn(mound, c.x) + 4, r * 0.65); } });
  add(mid, 'c', bush, C.bush);
  // the fallen log (left), lying a little downhill
  var lx0 = -40, lx1 = W * (ph ? 0.44 : 0.3), lth = ph ? 30 : 46, ly0 = gY(lx0) + (ph ? 6 : 10) - lth / 2, ly1 = gY(lx1) + (ph ? 14 : 22) - lth / 2;
  var la = Math.atan2(ly1 - ly0, lx1 - lx0), lc = Math.cos(la), ls = Math.sin(la), nx = -ls, ny = lc;
  add(mid, 'f', poly([[lx0 + nx * lth / 2, ly0 + ny * lth / 2], [lx1 + nx * lth / 2, ly1 + ny * lth / 2], [lx1 - nx * lth / 2, ly1 - ny * lth / 2], [lx0 - nx * lth / 2, ly0 - ny * lth / 2]]) + rotEll(lx0 + lc * W * 0.12, ly0 + ls * W * 0.12 - lth * 0.5, lth * 0.22, lth * 0.18, 0), C.log);
  add(mid, 'g', rotEll(lx1, ly1, lth * 0.24, lth * 0.5, la * 180 / Math.PI), C.logE);
  var rings = ''; for (k = 1; k <= 3; k++) rings += rotEll(lx1, ly1, lth * 0.24 * k / 4, lth * 0.5 * k / 4, la * 180 / Math.PI);
  var bk = ''; for (k = 0; k < 9; k++) { var u0 = 0.06 + k * 0.1, sx = lx0 + (lx1 - lx0) * u0, sy = ly0 + (ly1 - ly0) * u0, off = (k % 3 - 1) * lth * 0.22; bk += seg(sx + nx * off, sy + ny * off, sx + lc * 40 + nx * off, sy + ls * 40 + ny * off); }
  stk(mid, 't', rings + bk, C.ring, 1.4);
  var moss = ''; for (k = 0; k < 14; k++) { var u = k / 13, mx = lx0 + (lx1 - lx0 - 10) * u, my = ly0 + (ly1 - ly0) * u - lth * 0.42; moss += ell(mx, my, (ph ? 10 : 15) + rnd() * 8, (ph ? 4 : 6) + rnd() * 2); }
  // near: the ground, moss, tufts, pebbles, flowers, big fern fronds, stones
  var front = n2_fn(-40, W + 40, 8, function (x) { return gY(x) + H * 0.035 + Math.sin(x / 47 + 2) * 3; });
  add(near, 'a', below(front, H + 40), C.g1);
  var mp = ''; spread(0, gy + H * 0.06, W, H - gy - H * 0.06, ph ? 80 : 120, ph ? 40 : 50, rnd, 1).forEach(function (c) { if (c.q < 0.5) mp += ell(c.x, c.y, (ph ? 22 : 40) + c.r * 30, (ph ? 5 : 8) + c.k * 4); });
  add(near, 'b', mp, C.g2);
  add(mid, 'h', moss, C.moss);
  var tufts = '', peb = '', flw = '';
  spread(0, gy + H * 0.04, W, H - gy - H * 0.04, ph ? 26 : 34, ph ? 22 : 26, rnd, 1).forEach(function (c) {
    var sc = 0.6 + (c.y - gy) / (H - gy) * 0.9;
    if (c.q < 0.42) tufts += poly([[c.x - 5 * sc, c.y], [c.x - 4 * sc, c.y - 8 * sc], [c.x - 1.5 * sc, c.y - 2], [c.x, c.y - 11 * sc], [c.x + 1.5 * sc, c.y - 2], [c.x + 4 * sc, c.y - 8 * sc], [c.x + 5 * sc, c.y]]);
    else if (c.q < 0.5) peb += ell(c.x, c.y, 4 * sc + c.r * 3, 2.4 * sc + c.r);
    else if (c.q < 0.6) { for (var p = 0; p < 5; p++) { var a = p / 5 * 6.283; flw += circ(c.x + Math.cos(a) * 2.2 * sc, c.y - 6 * sc + Math.sin(a) * 2.2 * sc, 1.6 * sc); } }
  });
  add(near, 'c', tufts, C.tuft); add(near, 'd', peb, C.peb); add(near, 'e', flw, C.flw);
  var fr = '';
  if (ph) fr += n2_frond(-6, H + 6, H * 0.2, -1.2, 0.5, 0, 4) + n2_frond(W + 6, H + 8, H * 0.18, -1.9, -0.5, 0, 4);
  else fr += n2_frond(-10, H + 8, H * 0.32, -1.15, 0.55, 0, 6) + n2_frond(20, H + 8, H * 0.24, -1.45, 0.7, 0, 5) + n2_frond(W + 10, H + 6, H * 0.3, -2.05, -0.5, 0, 6) + n2_frond(W * 0.62, gY(W * 0.62) + 30, H * 0.12, -1.75, 0.6, 0, 3) + n2_frond(W * 0.64, gY(W * 0.64) + 32, H * 0.1, -1.3, 0.4, 0, 3);
  add(near, 'f', fr, C.fern);
  var stones = ''; [[ph ? 0.6 : 0.36, 1], [ph ? 0.12 : 0.66, 0.8]].forEach(function (q) { var sx = W * q[0], sy = gY(sx) + H * 0.07, r = (ph ? 14 : 22) * q[1]; stones += ell(sx, sy, r * 1.4, r * 0.8) + ell(sx + r, sy + 3, r * 0.8, r * 0.5); });
  add(near, 'h', stones, C.stone);
  // the mushrooms: a big toadstool family (right), little ones by the log, and a fairy ring in front
  var S = ph ? 0.62 : 1, shrooms = [];
  function M(x, y, h, r, lean, kind, col, face, ring) { shrooms.push({x: x, y: y, h: h * S, r: r * S, lean: lean * S, kind: kind, col: col, face: face, ring: ring}); }
  var bx = W * (ph ? 0.8 : 0.875), by = gY(bx) + H * (ph ? 0.1 : 0.12);
  M(bx, by, 150, 78, -8, 'toad', 0, 1); M(bx - 92 * S, by + 14 * S, 82, 46, 10, 'toad', 0, 2); M(bx + 70 * S, by + 18 * S, 56, 30, 6, 'toad', 0, 0);
  M(bx - 150 * S, by + 4 * S, 46, 40, -4, 'flat', 1, 0); M(bx + 118 * S, by - 6 * S, 64, 22, -6, 'bell', 2, 0);
  var lgx = W * (ph ? 0.3 : 0.24); M(lgx, gY(lgx) + 20 * S, 44, 34, 4, 'flat', 1, 0); M(lgx + 34 * S, gY(lgx) + 26 * S, 30, 20, -4, 'flat', 1, 0); M(lgx - 44 * S, gY(lgx) + 4, 54, 18, 2, 'bell', 2, 0);
  if (!ph) { M(W * 0.13, ly0 + (ly1 - ly0) * 0.4 - lth * 0.3, 24, 18, 2, 'flat', 1, 0); M(W * 0.165, ly0 + (ly1 - ly0) * 0.52 - lth * 0.3, 16, 12, -2, 'flat', 1, 0); }
  var rc = [W * (ph ? 0.5 : 0.45), H * (ph ? 0.9 : 0.925)], rx = W * (ph ? 0.33 : 0.17), ryy = H * (ph ? 0.032 : 0.036), RC = ['#F48A8A', '#F6B26B', '#F2D55E', '#9BD77A', '#6FD1C6', '#79A8F2', '#A98BEA', '#F49AC8'];
  for (i = 0; i < 8; i++) { var aa = Math.PI * 0.5 + i / 8 * Math.PI * 2; M(rc[0] + Math.cos(aa) * rx, rc[1] + Math.sin(aa) * ryy, 34 + (i % 3) * 5, 22 + (i % 2) * 4, (i % 3 - 1) * 2, 'toad', 10 + i, i === 0 ? 3 : 0, i); }
  shrooms.sort(function (p, q) { return p.y - q.y; });
  if (ANIM) {
    ANIM.shrooms = shrooms; ANIM.gy = gy; ANIM.ring = {x: rc[0], y: rc[1], rx: rx, ry: ryy, cols: RC};
    ANIM.log = {x0: lx0, y0: ly0, x1: lx1, y1: ly1, th: lth}; ANIM.fern = {x: W * (ph ? 0.6 : 0.73), y: gY(W * (ph ? 0.6 : 0.73)) + H * 0.05, len: H * (ph ? 0.11 : 0.15)};
    ANIM.beams = (ph ? [0.05, 0.42, 0.78] : [0.06, 0.3, 0.55, 0.8]).map(function (f, k) { return [W * f + (ph ? 34 : 60) * 0.5, (ph ? 34 : 60) + k * 8, H * 0.42]; });
  } else {
    var st = '', cp = '', sp = '';
    shrooms.forEach(function (m) { var P = n2_shroom(m.x, m.y, m.h, m.r, m.lean, m.kind); st += P.stem; cp += P.cap; sp += P.spots; });
    add(near, 'g', st, C.stem); add(near, 'h', stones + cp, C.cap); add(near, 'e', sp, C.flw);
  }
  return n2_out({sky: sky, far: far, refl: refl, mid: mid, near: near});
};

// ================= 2. Sunflower Field: rows of sunflowers rolling toward a red barn, hay bales and a dirt road =================
// a round hay bale seen from its flat end: [disc, spiral lines] at x,y (ground) radius r
function n2_bale(x, y, r) { var sp = []; for (var k = 0; k <= 30; k++) { var a = k / 30 * 13, rr = 1 + k / 30 * r * 0.78; sp.push([x + Math.cos(a) * rr, y - r + Math.sin(a) * rr]); } return {disc: circ(x, y - r, r), side: rrect(x, y - r * 2, r * 1.4, r * 2, r * 0.5) + circ(x + r * 1.4, y - r, r), spiral: pline(sp)}; }
SCENES.sunflowers = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 5 : 7), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : 1, k, j, x, y;
  var sky = dk ? 'linear-gradient(180deg,#1B2246 0%,#262A56 40%,#2F2F5E 66%,#4C3E5A 100%)' : 'linear-gradient(180deg,#9ED0F0 0%,#BCDDF4 34%,#D6ECF8 62%,#F8E7A6 100%)';
  var C = dk ? {hz: '#2E3462', hz2: '#363A6C', hill: '#26304E', tree: '#1A2440', barn: '#6A2E44', roof: '#3A2036', trim: '#C8BCD8', silo: '#5A6488', win: '#FFD27A', hay: '#8A7448', field: '#1E2A3E', dot: '#B8983E', dotC: '#3A2A20', road: '#4A4266', fence: '#5A5070', band: '#18233A', star: 'rgba(255,248,226,0.85)'} :
    {hz: '#B8D7CE', hz2: '#A8CDB0', hill: '#8CC066', tree: '#4E8E44', barn: '#C8423A', roof: '#7A2C2C', trim: '#FFF8EE', silo: '#B9C6D0', win: '#5A2A2A', hay: '#E6B85A', field: '#6E9E40', dot: '#F6C431', dotC: '#7A4A1E', road: '#E8C98E', fence: '#B08458', band: '#5A8C36', star: 'rgba(255,255,255,0)'};
  // far: distant hills
  add(far, 'a', below(ridge(W, H * (ph ? 0.47 : 0.44), [[H * 0.03, 210, 0.5], [H * 0.012, 70, 2]], 10), H + 40), C.hz);
  add(far, 'b', below(ridge(W, H * (ph ? 0.5 : 0.48), [[H * 0.025, 160, 2.2], [H * 0.01, 55, 0.7]], 10), H + 40), C.hz2);
  var starD = ''; if (dk) spread(0, 0, W, H * 0.44, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.5) starD += circ(c.x, c.y, 0.5 + c.r * 1.1); });
  // mid: the back hill with the barn, silo, trees and bales
  var y1 = function (x) { return H * (ph ? 0.54 : 0.52) + Math.sin(x / 230 + 1) * H * 0.018 + Math.sin(x / 90) * 3; };
  var hill = n2_fn(-40, W + 40, 8, y1);
  var bx = W * (ph ? 0.74 : 0.8), by = y1(bx) + 6 * S, s = S * (ph ? 1.05 : 1);
  var trees = '', tr = '';
  [[bx + 150 * s, 1.1], [bx + 190 * s, 0.8], [bx - 140 * s, 0.9], [W * 0.1, 1], [W * 0.17, 0.75], [W * 0.42, 0.7], [W * 0.98, 1]].forEach(function (q) { var x = q[0], y = y1(x) + 4, r = 24 * s * q[1]; tr += rect(x - 2.5 * s, y - r, 5 * s, r); trees += circ(x, y - r * 1.6, r) + circ(x - r * 0.7, y - r * 1.1, r * 0.75) + circ(x + r * 0.7, y - r * 1.15, r * 0.8); });
  add(mid, 'a', starD, C.star);
  add(mid, 'b', below(hill, H + 40), C.hill);
  add(mid, 'c', trees + tr, C.tree);
  // barn: gable front facing us, side wall going back to the right
  var f = 46 * s, hgt = 68 * s, peak = 112 * s, dpt = 78 * s;
  add(mid, 'd', rect(bx - f, by - hgt, 2 * f, hgt) + poly([[bx - f, by - hgt], [bx, by - peak], [bx + f, by - hgt]]) + poly([[bx + f, by], [bx + f, by - hgt], [bx + f + dpt, by - hgt + 5 * s], [bx + f + dpt, by - 2 * s]]), C.barn);
  add(mid, 'e', poly([[bx - f - 7 * s, by - hgt + 2 * s], [bx, by - peak - 6 * s], [bx + 4 * s, by - peak - 2 * s], [bx - f + 1 * s, by - hgt + 6 * s]]) + poly([[bx, by - peak - 6 * s], [bx + f + 7 * s, by - hgt + 2 * s], [bx + f + dpt + 6 * s, by - hgt + 7 * s], [bx + dpt * 0.95, by - peak - 1 * s]]) + rect(bx + f, by - hgt, dpt, 7 * s), C.roof);
  var dw = 23 * s, dh = 46 * s, X = seg(bx - dw, by - dh, bx + dw, by) + seg(bx + dw, by - dh, bx - dw, by), sideW = '';
  for (k = 0; k < 2; k++) sideW += rect(bx + f + dpt * (0.25 + k * 0.4), by - hgt * 0.62, 14 * s, 13 * s);
  stk(mid, 's', X + rect(bx - dw, by - dh, 2 * dw, dh) + seg(bx, by - dh, bx, by) + rect(bx - 8 * s, by - 92 * s, 16 * s, 14 * s) + seg(bx - f, by - hgt, bx + f, by - hgt), C.trim, 3.2 * s);
  add(mid, 'f', rect(bx - f - 44 * s, by - 128 * s, 32 * s, 128 * s) + ell(bx - f - 28 * s, by - 128 * s, 16 * s, 16 * s), C.silo);
  add(mid, 'g', sideW + rect(bx - 6.5 * s, by - 90 * s, 13 * s, 10 * s), C.win);
  var hb = '', hs = '';
  [[bx - 110 * s, 0.6], [bx + 60 * s, 0.5], [W * (ph ? 0.2 : 0.3), 0.55]].forEach(function (q) { var B = n2_bale(q[0], y1(q[0]) + 10 * S, 16 * s * q[1] * 1.4); hb += B.side + B.disc; hs += B.spiral; });
  add(mid, 'h', hb, C.hay); stk(mid, 't', hs + seg(bx - f - 44 * s, by - 100 * s, bx - f - 12 * s, by - 100 * s) + seg(bx - f - 44 * s, by - 60 * s, bx - f - 12 * s, by - 60 * s), dk ? 'rgba(20,16,40,0.5)' : 'rgba(150,100,40,0.55)', 1.6 * S);
  // near: the field, foliage rows with tiny far heads, the road and its fence
  var fy0 = y1(0) + 18 * S, f1 = function (x) { return y1(x) + 16 * S; };
  add(near, 'a', below(n2_fn(-40, W + 40, 8, f1), H + 40), C.field);
  var road = n2_q([W * (ph ? 0.22 : 0.3), H + 30], [W * (ph ? 0.5 : 0.55), H * 0.72], [bx, by + 2], 40), RL = [], RR = [];
  var rw = function (u) { return lerp(W * (ph ? 0.2 : 0.15), 10 * S, Math.pow(u, 0.6)); };
  road.forEach(function (p, j) { var w = rw(j / 40); RL.push([p[0] - w / 2, p[1]]); RR.unshift([p[0] + w / 2, p[1]]); });
  function onRoad(x, y, pad) { for (var j = 0; j < road.length; j++) if (Math.abs(road[j][1] - y) < 14 && Math.abs(road[j][0] - x) < rw(j / 40) / 2 + pad) return true; return false; }
  var bands = '', dots = '', dotC = '', rows = ph ? 7 : 9;
  for (j = 0; j < rows; j++) { var z = j / (rows - 1), yy = lerp(fy0 + 6 * S, H * (ph ? 0.68 : 0.7), Math.pow(z, 1.25)), rr = lerp(1.6, 5.5, z) * S * (ph ? 1.3 : 1), stp = rr * 2.7;
    bands += below(n2_fn(-40, W + 40, 10, function (x) { return f1(x) - fy0 + yy + rr * 0.8 + Math.sin(x / 40 + j) * 1.5; }), H + 40);
    for (x = -10 + (j % 2) * stp / 2; x < W + 10; x += stp) { y = f1(x) - fy0 + yy + (rnd() - 0.5) * rr * 0.6; if (onRoad(x, y, rr * 2) || (Math.abs(x - bx - 20 * s) < 120 * s && y < by + 4)) continue; dots += circ(x, y, rr); dotC += circ(x, y, rr * 0.42); } }
  add(near, 'b', bands, C.band); add(near, 'c', dots, C.dot); add(near, 'd', dotC, C.dotC);
  add(near, 'e', poly(RL.concat(RR)), C.road);
  var fence = '', fp = [], fb = [];
  for (j = 4; j < 38; j += 2) { var p = road[j], u = j / 40, w = rw(u), fx = p[0] + w / 2 + 10 * S * (1 - u) + 4, fh = (22 * (1 - u) + 6) * S; fence += seg(fx, p[1], fx, p[1] - fh); fp.push([fx, p[1] - fh * 0.8]); fb.push([fx, p[1] - fh * 0.4]); }
  stk(near, 's', fence + pline(fp) + pline(fb), C.fence, 2.4 * S);
  // the sunflowers that turn are drawn by the engine; still scenes get them here
  var fl = [], rowsB = ph ? [[0.705, 9], [0.75, 12], [0.8, 16], [0.86, 22], [0.93, 30], [1.03, 42]] : [[0.71, 10], [0.745, 13], [0.785, 17], [0.835, 22], [0.895, 29], [0.97, 38], [1.07, 52]];
  rowsB.forEach(function (q, j) { var r = q[1] * (ph ? 0.85 : 1), yb = H * q[0], stp = r * 2.5, x0 = (j % 2) * stp * 0.5 - stp * 0.3;
    for (var x = x0; x < W + r; x += stp * (0.9 + rnd() * 0.25)) { var y = yb + (rnd() - 0.5) * r * 0.3; if (onRoad(x, y - r * 1.4, r * 1.1)) continue; fl.push({x: x + (rnd() - 0.5) * r * 0.4, y: y, r: r * (0.88 + rnd() * 0.24), h: r * (2.6 + rnd() * 0.8), z: j / (rowsB.length - 1), ph: rnd() * 6.28, face: 0}); } });
  var big = fl.filter(function (q) { return q.z === 1 && q.x > W * (ph ? 0.05 : 0.6) && q.x < W * 0.95; });
  if (big.length) { big[0].face = 1; if (big.length > 2) big[big.length - 1].face = 2; }
  if (ANIM) { ANIM.flowers = fl; ANIM.hz = H * (ph ? 0.52 : 0.5); ANIM.fieldTop = fy0; ANIM.barn = {x: bx, y: by, s: s, wins: [[bx + f + dpt * 0.25 + 7 * s, by - hgt * 0.62 + 6 * s], [bx + f + dpt * 0.65 + 7 * s, by - hgt * 0.62 + 6 * s], [bx, by - 85 * s]]}; }
  else { var hd = '', cn = '', sm = ''; fl.forEach(function (q) { var hy = q.y - q.h; sm += n2_tube([[q.x, q.y + q.r], [q.x, hy]], q.r * 0.16, q.r * 0.12); hd += circ(q.x, hy, q.r); cn += circ(q.x, hy, q.r * 0.45); });
    add(near, 'f', sm, dk ? '#2A5A3A' : '#4E8A34'); add(near, 'g', hd, dk ? '#C8A040' : '#F6C431'); add(near, 'h', cn, dk ? '#3A2418' : '#7A4A1E'); }
  return n2_out({sky: sky, far: far, mid: mid, near: near});
};

// ================= 3. Cloud Kingdom: floating grassy islands above a sea of clouds, waterfalls spilling off their edges =================
// One floating island, top surface centred at (cx, ty), width w. o: {trees: [[u, s], ...], house: u or null, wf: -1 | 1 | 0, seed}
// Returns path strings by part plus the waterfall start and the bounding box.
function n2_island(cx, ty, w, o) {
  var D = w * 0.62, sd = o.seed || 1, rock = [[cx - w / 2, ty + 2]], dark = [], i, u;
  function depth(u) { return D * Math.pow(Math.sin(Math.PI * u), 1.15) * (1 + 0.16 * Math.sin(u * 19 + sd) + 0.08 * Math.sin(u * 41 + sd * 2)) * (1 + 0.5 * Math.exp(-Math.pow((u - 0.5 - 0.06 * Math.sin(sd)) / 0.08, 2))); }
  for (i = 1; i < 40; i++) { u = i / 40; rock.push([cx - w / 2 + w * u, ty + depth(u)]); }
  rock.push([cx + w / 2, ty + 2]);
  for (i = 20; i < 40; i++) { u = i / 40; dark.push([cx - w / 2 + w * u, ty + depth(u)]); } dark.push([cx + w / 2, ty + 2]); dark.push([cx + w * 0.2, ty + D * 0.2]); dark.push([cx + w * 0.02, ty + D * 0.55]);
  var strata = ''; for (var k = 1; k <= 3; k++) { var dy = D * k * 0.22; for (i = 0; i < 4; i++) { u = 0.2 + (i + (k % 2) * 0.5) * 0.17; if (u > 0.85) continue; if (depth(u) > dy + 8) strata += ell(cx - w / 2 + w * u, ty + dy, w * 0.06, 2.2); } }
  var grass = ell(cx, ty, w / 2 + 5, w * 0.075), drips = '';
  for (i = 0; i <= 14; i++) { u = i / 14; var gx = cx - w / 2 - 2 + (w + 4) * u, gy = ty + Math.sqrt(Math.max(0, 1 - Math.pow((gx - cx) / (w / 2 + 5), 2))) * w * 0.07; drips += circ(gx, gy, (i % 2 ? 4 : 6) * w / 260 + 2); }
  var tree = '', treeD = '', trunk = '', tops = [];
  (o.trees || []).forEach(function (q) { var x = cx + q[0] * w / 2, s = q[1] * w / 260, y = ty - w * 0.02, r = 20 * s; trunk += rect(x - 3 * s, y - r * 1.4, 6 * s, r * 1.4 + 2); tree += circ(x, y - r * 1.9, r) + circ(x - r * 0.7, y - r * 1.4, r * 0.72) + circ(x + r * 0.72, y - r * 1.45, r * 0.78); treeD += circ(x + r * 0.45, y - r * 1.3, r * 0.55); tops.push(y - r * 2.9); });
  var wall = '', roof = '', win = '', door = '', chim = '', wins = [];
  if (o.house != null) { var hx = cx + o.house * w / 2, s2 = w / 260, hw = 46 * s2, hh = 34 * s2, hy = ty - w * 0.015;
    wall = rect(hx - hw / 2, hy - hh, hw, hh + 2); roof = poly([[hx - hw / 2 - 7 * s2, hy - hh + 2], [hx, hy - hh - 30 * s2], [hx + hw / 2 + 7 * s2, hy - hh + 2]]); chim = rect(hx + hw * 0.18, hy - hh - 26 * s2, 8 * s2, 16 * s2);
    door = rrect(hx - 6 * s2, hy - 18 * s2, 12 * s2, 18 * s2, 5 * s2); win = circ(hx, hy - hh - 10 * s2, 4.5 * s2) + rrect(hx - hw * 0.4, hy - hh * 0.72, 9 * s2, 9 * s2, 2) + rrect(hx + hw * 0.4 - 9 * s2, hy - hh * 0.72, 9 * s2, 9 * s2, 2);
    wins = [[hx, hy - hh - 10 * s2, 5 * s2], [hx - hw * 0.4 + 4.5 * s2, hy - hh * 0.72 + 4.5 * s2, 6 * s2], [hx + hw * 0.4 - 4.5 * s2, hy - hh * 0.72 + 4.5 * s2, 6 * s2]]; tops.push(hy - hh - 32 * s2); }
  var fls = ''; for (i = 0; i < 7; i++) { var fx = cx + (hash(sd + i * 3.3) - 0.5) * w * 0.8, fy = ty + (hash(sd * 2 + i) - 0.5) * w * 0.05; fls += circ(fx, fy, 1.6 * w / 260 + 0.6); }
  var top = Math.min.apply(null, tops.concat([ty - w * 0.1]));
  return {rock: poly(rock), dark: poly(dark), strata: strata, grass: grass + drips, grassL: ell(cx - w * 0.06, ty - w * 0.018, w * 0.36, w * 0.038), tree: tree, treeD: treeD, trunk: trunk, wall: wall, roof: roof, chim: chim, door: door, win: win, wins: wins, fls: fls,
    wf: o.wf ? [cx + o.wf * w * 0.44, ty + w * 0.03] : null, box: [cx - w / 2 - 12, top - 4, w + 24, ty + D * 1.6 - top + 8]};
}
function n2_islandCols(dk) { return dk ? {rock: '#5A4E86', dark: '#463C70', strata: 'rgba(30,24,60,0.35)', grass: '#3E7A78', grassL: '#4E9088', tree: '#2E5E62', treeD: 'rgba(10,20,40,0.3)', trunk: '#4A3A50', wall: '#E8DCF0', roof: '#B85A7A', chim: '#8A6A88', door: '#6A4A6A', win: '#FFD58A', fls: '#FFE6A8'} :
  {rock: '#C9A58A', dark: '#A88470', strata: 'rgba(120,80,60,0.28)', grass: '#7FD06E', grassL: '#A8E68A', tree: '#5AB860', treeD: 'rgba(30,90,40,0.25)', trunk: '#8A6040', wall: '#FFF6EA', roof: '#F07A6A', chim: '#C9A08A', door: '#8A5A44', win: '#8AD0F0', fls: '#FFFFFF'}; }
SCENES.cloudkingdom = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 8 : 11), mid = Lay(0), near = Lay(0), i;
  var sky = dk ? 'linear-gradient(180deg,#1C1F4A 0%,#2A2960 36%,#3A3474 64%,#7E5C9E 100%)' : 'linear-gradient(180deg,#A9CDF5 0%,#C3DCF8 34%,#DCEBFB 62%,#FFEDE6 100%)';
  var sea = H * (ph ? 0.78 : 0.75);
  var C = dk ? {bank: '#5A4E92', bank2: '#6E5CA0', glow: 'rgba(255,220,250,0.12)', dist: '#4E4A86', star: 'rgba(255,248,230,0.85)', front: '#8A7CC0', frontS: '#6A5CA6', frontL: '#B4A4DC'} :
    {bank: '#F6F2FC', bank2: '#FFFFFF', glow: 'rgba(255,250,235,0.6)', dist: '#C2D2EE', star: 'rgba(255,255,255,0)', front: '#FFFFFF', frontS: '#E4DEF2', frontL: '#FFFFFF'};
  // far: soft cloud banks on the horizon and the light of the sun
  var bank = '', bank2 = '';
  spread(-60, sea - H * 0.1, W + 120, H * 0.08, ph ? 90 : 150, 40, rnd, 0.6).forEach(function (c) { bank += n2_puff(c.x, c.y + 20, (ph ? 120 : 220) + c.r * 80, (ph ? 40 : 60) + c.k * 30, rnd); });
  spread(-60, H * 0.36, W + 120, H * 0.14, ph ? 140 : 260, 80, rnd, 0.8).forEach(function (c) { if (c.q < 0.6) bank2 += n2_puff(c.x, c.y, (ph ? 90 : 160) + c.r * 60, (ph ? 22 : 30) + c.k * 12, rnd); });
  add(far, 'a', bank2, C.bank2); add(far, 'b', bank, C.bank);
  add(far, 'h', dk ? ell(W * 0.5, sea, W * 0.7, H * 0.12) : ell(W * 0.3, H * 0.2, W * 0.35, H * 0.25), C.glow);
  // mid: stars and tiny distant islands
  var st = ''; if (dk) spread(0, 0, W, sea - H * 0.1, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.5) st += circ(c.x, c.y, 0.5 + c.r * 1.1); });
  add(mid, 'a', st, C.star);
  var dist = ''; (ph ? [[0.4, 0.5, 34], [0.92, 0.66, 26]] : [[0.3, 0.55, 44], [0.62, 0.48, 34], [0.94, 0.62, 30], [0.4, 0.66, 26]]).forEach(function (q, k) { var P = n2_island(W * q[0], H * q[1], q[2], {trees: [[-0.3, 1.6], [0.25, 1.3]], seed: k + 4}); dist += P.rock + P.grass + P.tree + P.trunk; });
  add(mid, 'b', dist, C.dist);
  // near: the front of the cloud sea
  // rows of puffs, each with a shaded underside, stepping down toward us
  var ROWS = dk ? [['#4A4282', '#665AA4'], ['#544A8E', '#7468B2'], ['#5E5498', '#8476C0']] : [['#C9CFEE', '#EAEDFB'], ['#D2D2F0', '#F3F2FD'], ['#DCD6F2', '#FFFFFF']], hl = '';
  ROWS.forEach(function (rc, j) { var y0 = sea + H * (0.03 + j * (ph ? 0.06 : 0.075)), sh2 = '', mn = '', cw = (ph ? 120 : 210) * (1 + j * 0.25);
    for (var x = -100 + (j % 2) * cw * 0.5; x < W + 100; x += cw * (0.7 + rnd() * 0.25)) { var w = cw * (0.9 + rnd() * 0.4), h = (ph ? 46 : 70) * (1 + j * 0.3) * (0.8 + rnd() * 0.4); sh2 += n2_puff(x, y0 + h * 0.62, w, h, rnd); mn += n2_puff(x - w * 0.04, y0 + h * 0.42, w * 0.94, h * 0.92, rnd); if (j === 2) hl += ell(x - w * 0.18, y0 - h * 0.3, w * 0.14, h * 0.1); }
    sh2 += rect(-60, y0 + (ph ? 46 : 70) * (1 + j * 0.3) * 0.5, W + 120, H); add(near, 'abcdef'[j * 2], sh2, rc[0]); add(near, 'abcdef'[j * 2 + 1], mn, rc[1]); });
  add(near, 'g', hl, dk ? '#A496D6' : '#FFFFFF');
  // the islands (moving parts)
  var IS = ph ? [{cx: 0.72, ty: 0.5, w: 190, o: {trees: [[0.45, 1.1], [0.62, 0.8], [-0.55, 0.9]], house: -0.08, wf: -1, seed: 1}}, {cx: 0.2, ty: 0.32, w: 132, o: {trees: [[-0.3, 1.2], [0.3, 0.9]], wf: 1, seed: 2}}, {cx: 0.74, ty: 0.17, w: 80, o: {trees: [[0, 1.3]], wf: 0, seed: 3}}] :
    [{cx: 0.8, ty: 0.44, w: 300, o: {trees: [[0.5, 1.15], [0.68, 0.85], [-0.6, 0.95], [-0.42, 0.7]], house: 0.05, wf: -1, seed: 1}}, {cx: 0.11, ty: 0.34, w: 200, o: {trees: [[-0.35, 1.2], [0.05, 0.9], [0.4, 1]], wf: 1, seed: 2}}, {cx: 0.5, ty: 0.19, w: 110, o: {trees: [[0.1, 1.3]], wf: 0, seed: 3}}];
  var isl = IS.map(function (q) { var P = n2_island(W * q.cx, H * q.ty, q.w, q.o); P.cx = W * q.cx; P.ty = H * q.ty; P.w = q.w; return P; });
  if (ANIM) { ANIM.isl = isl; ANIM.sea = sea; }
  else { var K = n2_islandCols(dk), r = '', g = '', t = '', wl = '', rf = ''; isl.forEach(function (P) { r += P.rock; g += P.grass; t += P.tree; wl += P.wall; rf += P.roof; });
    add(mid, 'c', r, K.rock); add(mid, 'd', g, K.grass); add(mid, 'e', t, K.tree); add(mid, 'f', wl, K.wall); add(mid, 'g', rf, K.roof); }
  return n2_out({sky: sky, far: far, mid: mid, near: near});
};

// ================= 4. Night Train: inside a sleeper compartment, a wide window, a reading lamp, tea on the fold-down table =================
// the window and the room around it, shared by the scene and its engine
function n2_trainGeo(W, H) {
  var ph = H > W;
  return ph ? {ph: ph, x0: W * 0.07, x1: W * 0.93, y0: H * 0.12, y1: H * 0.5, r: 22, fr: 12, ty: H * 0.5 + 16, bench: H * 0.83, lamp: [W * 0.83, H * 0.035], cup: [W * 0.72, H * 0.5 + 16], tbl: [W * 0.5, W * 0.96]} :
    {ph: ph, x0: W * 0.05, x1: W * 0.72, y0: H * 0.1, y1: H * 0.64, r: 30, fr: 16, ty: H * 0.64 + 22, bench: H * 0.86, lamp: [W * 0.865, H * 0.2], cup: [W * 0.6, H * 0.64 + 22], tbl: [W * 0.4, W * 0.76]};
}
// rolling land outside the window, as a function of world x (the train moves through it)
function n2_land(k, x) { return k === 0 ? Math.sin(x / 260 + 1) * 0.5 + Math.sin(x / 97) * 0.22 + Math.sin(x / 41 + 2) * 0.08 : k === 1 ? Math.sin(x / 180) * 0.5 + Math.sin(x / 67 + 1) * 0.25 : Math.sin(x / 120 + 3) * 0.4 + Math.sin(x / 43) * 0.18; }
SCENES.nighttrain = function (W, H, dk, rnd) {
  var G = n2_trainGeo(W, H), ph = G.ph, far = Lay(0), mid = Lay(0), near = Lay(0), S = ph ? 0.65 : 1, i;
  var sky = dk ? 'linear-gradient(180deg,#141C33 0%,#1C2542 40%,#25304E 70%,#5B4A6A 100%)' : 'linear-gradient(180deg,#B9D7EA 0%,#CFE3EC 38%,#EAF2EE 70%,#E7D2B8 100%)';
  var C = dk ? {wall: '#3A2C46', wain: '#45293A', frame: '#2A1C2C', sill: '#6A4252', cur: '#7A2C48', curD: '#561E36', seat: '#2A4E52', brass: '#C8A050', pan: 'rgba(0,0,0,0.25)', star: 'rgba(255,248,226,0.85)', btn: '#1E3A3E'} :
    {wall: '#F2E6D0', wain: '#A2704A', frame: '#7A4C30', sill: '#C48C5C', cur: '#B8484C', curD: '#8E3238', seat: '#3E7C6C', brass: '#D9A848', pan: 'rgba(90,50,20,0.22)', star: 'rgba(255,255,255,0)', btn: '#2A5A4E'};
  var ww = G.x1 - G.x0, wh = G.y1 - G.y0;
  // the wall with the window cut out, and wood panelling below
  add(near, 'a', rect(-40, -40, W + 80, H + 80) + n2_hole(G.x0, G.y0, ww, wh, G.r), C.wall);
  add(near, 'b', rect(-40, G.ty + 10, W + 80, H) + (ph ? '' : rect(G.x1 + G.fr + 26, -40, 12, H + 80)), C.wain);
  var pan = '', px = ph ? 70 : 120; for (var x = 16; x < W; x += px) pan += rrect(x, G.ty + 34 * S, px - 26, G.bench - G.ty - 50 * S, 6);
  if (!ph) { pan += rrect(G.x1 + G.fr + 52, G.y0 + 150, W - G.x1 - G.fr - 70, G.y1 - G.y0 - 150, 8); }
  stk(near, 's', pan, C.pan, 2);
  add(near, 'c', rrect(G.x0 - G.fr, G.y0 - G.fr, ww + 2 * G.fr, wh + 2 * G.fr, G.r + G.fr) + n2_hole(G.x0, G.y0, ww, wh, G.r), C.frame);
  // the fold-down table and the sill
  add(near, 'd', rrect(G.x0 - G.fr - 8, G.y1 + G.fr - 6, ww + 2 * G.fr + 16, 12 * S + 6, 4) + rrect(G.tbl[0], G.ty - 4, G.tbl[1] - G.tbl[0], 16 * S, 5) + poly([[G.tbl[0] + 30 * S, G.ty + 12 * S], [G.tbl[0] + 50 * S, G.ty + 12 * S], [G.tbl[0] + 90 * S, G.ty + 70 * S], [G.tbl[0] + 80 * S, G.ty + 74 * S]]), C.sill);
  // curtains gathered at both sides, with tie-backs
  var cur = '', curD = '';
  [-1, 1].forEach(function (sd) { var ex = sd < 0 ? G.x0 - G.fr - 10 : G.x1 + G.fr + 10, cw = (ph ? 34 : 64), inn = ex - sd * cw, tieY = G.y0 + wh * 0.62, top = G.y0 - G.fr - 18 * S, bot = G.y1 + G.fr + 4;
    var pts = [[ex + sd * 6, top], [inn - sd * 4, top], [inn + sd * cw * 0.1, tieY - wh * 0.25], [ex - sd * cw * 0.25, tieY], [inn + sd * cw * 0.05, tieY + wh * 0.18], [inn - sd * cw * 0.2, bot], [ex + sd * 6, bot]];
    cur += poly(n2_q(pts[0], pts[0], pts[1], 2).concat(n2_q(pts[1], pts[2], pts[3], 10), n2_q(pts[3], pts[4], pts[5], 10), [pts[6]]));
    for (var k = 1; k < 4; k++) { var fx = ex - sd * cw * k * 0.22; curD += n2_tube(n2_q([fx, top + 4], [fx - sd * cw * 0.08 * k, tieY - wh * 0.2], [ex - sd * cw * 0.18, tieY], 10), 4 * S, 1.5) + n2_tube(n2_q([ex - sd * cw * 0.18, tieY], [fx - sd * cw * 0.12 * k, tieY + wh * 0.16], [fx - sd * cw * 0.1, bot - 2], 10), 1.5, 4 * S); }
    curD += rrect(ex - sd * cw * 0.32 - 9 * S, tieY - 5 * S, 18 * S, 10 * S, 4 * S); });
  add(near, 'e', cur + rrect(G.x0 - G.fr - 40, G.y0 - G.fr - 24 * S, ww + 2 * G.fr + 80, 10 * S, 5 * S), C.cur); add(near, 'f', curD, C.curD);
  // the bench at the bottom: a tufted back cushion
  var bt = '', btn2 = ''; add(near, 'g', rrect(-40, G.bench, W + 80, H, 26 * S), C.seat);
  for (x = 30; x < W; x += ph ? 56 : 90) { btn2 += circ(x, G.bench + 30 * S, 3.5 * S) + circ(x + (ph ? 28 : 45), G.bench + 62 * S, 3.5 * S); }
  var tuft = ''; for (x = -20; x < W + 40; x += ph ? 56 : 90) { var h2 = ph ? 28 : 45; tuft += seg(x, G.bench + 30 * S, x + h2, G.bench + 62 * S) + seg(x + h2, G.bench + 62 * S, x + 2 * h2, G.bench + 30 * S) + seg(x, G.bench + 30 * S, x - h2, G.bench + 62 * S); }
  stk(near, 't', tuft + seg(-40, G.bench + 14 * S, W + 40, G.bench + 14 * S), dk ? '#1E3A3E' : '#2E6052', 2 * S);
  // luggage rack and wall details in brass
  var brass = '';
  if (!ph) { var rx0 = G.x1 + G.fr + 40, rx1 = W + 10; brass += rrect(rx0, H * 0.06, rx1 - rx0, 7, 3) + rrect(rx0, H * 0.06 + 22, rx1 - rx0, 5, 2.5); for (x = rx0 + 10; x < rx1; x += 34) brass += rect(x, H * 0.06, 3, 26);
    brass += rrect(G.x1 + G.fr + 70, G.y0 + 190, 9, 9, 3) + rrect(W - 40, G.y0 + 190, 9, 9, 3); }
  brass += rrect(G.x0 + ww * 0.5 - 30 * S, G.y0 - G.fr - 8 * S, 60 * S, 6 * S, 3 * S);
  add(near, 'h', brass + btn2, C.brass);
  // stars outside (night) are fixed; the land and the moon move in the engine
  var st = ''; if (dk) spread(G.x0, G.y0, ww, wh * 0.55, 26, 26, rnd, 1).forEach(function (c) { if (c.q < 0.45) st += circ(c.x, c.y, 0.5 + c.r); });
  add(mid, 'a', st, C.star);
  if (ANIM) { ANIM.G = G; }
  else { add(mid, 'b', below(n2_fn(G.x0 - 10, G.x1 + 10, 8, function (x) { return G.y0 + wh * (0.55 + 0.08 * n2_land(0, x)); }), G.y1 + 20), dk ? '#2E3A62' : '#A9C3DC'); add(mid, 'c', below(n2_fn(G.x0 - 10, G.x1 + 10, 8, function (x) { return G.y0 + wh * (0.74 + 0.07 * n2_land(1, x)); }), G.y1 + 20), dk ? '#1E2A44' : '#8DBB86'); }
  return n2_out({sky: sky, far: far, mid: mid, near: near});
};

// ================= 5. Ramen Shop: a late-night ramen counter with noren curtains, a steaming pot and rain on the window =================
function n2_ramenGeo(W, H) {
  var ph = H > W;
  return ph ? {ph: ph, S: 0.62, wx0: W * 0.05, wx1: W * 0.44, wy0: H * 0.2, wy1: H * 0.4, pass: W * 0.48, ct: H * 0.64, cf: H * 0.68, chef: [W * 0.66, H * 0.5], pot: [W * 0.9, H * 0.56], noren: [W * 0.48, W + 10, H * 0.035, H * 0.15], lant: [[W * 0.46, H * 0.05]], tags: [W * 0.5, W * 0.98, H * 0.19], shelf: [W * 0.05, W * 0.44, H * 0.47], neko: [W * 0.1, H * 0.64], bowl: [W * 0.3, H * 0.64], caddy: [W * 0.47, H * 0.64]} :
    {ph: ph, S: 1, wx0: W * 0.035, wx1: W * 0.29, wy0: H * 0.14, wy1: H * 0.52, pass: W * 0.33, ct: H * 0.655, cf: H * 0.7, chef: [W * 0.66, H * 0.43], pot: [W * 0.87, H * 0.53], noren: [W * 0.33, W + 20, H * 0.035, H * 0.2], lant: [[W * 0.31, H * 0.05], [W * 0.975, H * 0.24]], tags: [W * 0.37, W * 0.56, H * 0.25], shelf: [W * 0.36, W * 0.56, H * 0.44], neko: [W * 0.05, H * 0.655], bowl: [W * 0.16, H * 0.655], caddy: [W * 0.27, H * 0.655]};
}
SCENES.ramen = function (W, H, dk, rnd) {
  var G = n2_ramenGeo(W, H), ph = G.ph, S = G.S, far = Lay(ph ? 1 : 1.5), mid = Lay(0), near = Lay(0), i, x;
  var sky = dk ? 'linear-gradient(180deg,#1E1A2A 0%,#2C2230 40%,#3B2734 70%,#7A3E3A 100%)' : 'linear-gradient(180deg,#F1DCC3 0%,#F4E3CE 40%,#F8EBDA 70%,#E7C9A8 100%)';
  var C = dk ? {sky: '#2A2A44', bld: '#1E1E34', bld2: '#26263E', lit: '#FFC87A', street: '#22202E', neon: '#FF6A7A', wall: '#3E2C36', wood: '#2A1C22', frame: '#2E1E24', tile: 'rgba(255,255,255,0.05)', tag: '#C8A070', ink: '#3A2418', bowl: '#E8DCE4', band: '#C04A50', steel: '#5A5A6A', ctop: '#8A5A3A', cedge: '#A8744A', cfront: '#3A2420', slat: 'rgba(0,0,0,0.25)', stool: '#B8404A'} :
    {sky: '#B8C6D2', bld: '#8C9CAE', bld2: '#A2B0C0', lit: '#FFE6B0', street: '#6E7A88', neon: '#E8505E', wall: '#F2E0C6', wood: '#8A5A38', frame: '#6E4428', tile: 'rgba(120,90,60,0.12)', tag: '#E8C894', ink: '#4A2A1A', bowl: '#FFFFFF', band: '#D2464E', steel: '#B8BCC6', ctop: '#D9A46A', cedge: '#F0C48C', cfront: '#7A4A2C', slat: 'rgba(60,30,10,0.22)', stool: '#D24A4E'};
  // far: the rainy street outside the window
  var wx0 = G.wx0, wx1 = G.wx1, wy0 = G.wy0, wy1 = G.wy1, ww = wx1 - wx0, wh = wy1 - wy0, gy = wy0 + wh * 0.72;
  add(far, 'a', rect(wx0 - 20, wy0 - 20, ww + 40, wh + 40), C.sky);
  var bl = '', bl2 = '', lit = '';
  for (x = wx0 - 20; x < wx1 + 20; ) { var bw = (ph ? 26 : 44) + rnd() * (ph ? 20 : 34), bh = wh * (0.35 + rnd() * 0.45); bl2 += rect(x, gy - bh - wh * 0.08, bw, bh + wh * 0.1); x += bw * 0.8; }
  for (x = wx0 - 10; x < wx1 + 20; ) { var bw2 = (ph ? 30 : 52) + rnd() * (ph ? 20 : 30), bh2 = wh * (0.25 + rnd() * 0.3); bl += rect(x, gy - bh2, bw2, bh2 + 2); for (var wy = gy - bh2 + 8; wy < gy - 10; wy += ph ? 12 : 18) for (var wxx = x + 6; wxx < x + bw2 - 8; wxx += ph ? 10 : 14) if (rnd() < (dk ? 0.5 : 0.3)) lit += rect(wxx, wy, ph ? 5 : 7, ph ? 6 : 9); x += bw2 + 4; }
  add(far, 'b', bl2, C.bld2); add(far, 'c', bl, C.bld); add(far, 'd', lit, C.lit);
  add(far, 'e', rect(wx0 - 20, gy, ww + 40, wh), C.street);
  var sx = wx0 + ww * 0.62, sy = gy - wh * 0.36, sw = (ph ? 34 : 56);
  add(far, 'f', rrect(sx - sw / 2, sy - sw * 0.32, sw, sw * 0.64, 6) + rect(sx - 1.5, sy + sw * 0.3, 3, gy - sy - sw * 0.3), C.neon);
  var refl = ''; for (i = 0; i < 9; i++) { var rx = wx0 + ww * (0.08 + i * 0.11), rl = (ph ? 4 : 8) + rnd() * 10; refl += rect(rx, gy + 6 + rnd() * wh * 0.15, 2 + rnd() * 3, rl); }
  add(far, 'g', refl + rect(sx - sw * 0.3, gy + 4, sw * 0.6, 3) + rect(sx - sw * 0.2, gy + 12, sw * 0.4, 3), dk ? 'rgba(255,120,130,0.55)' : 'rgba(255,255,255,0.45)');
  // mid: the shop wall with the window, beams, kitchen tiles, menu tags and a shelf of bowls
  add(mid, 'a', rect(-40, -40, W + 80, H + 80) + n2_hole(wx0, wy0, ww, wh, 6), C.wall);
  var beams = rect(-40, -40, W + 80, H * 0.035 + 40) + rect(G.pass - 10 * S, -40, 16 * S, G.ct + 40) + rect(-40, G.ct - 12 * S, W + 80, 14 * S);
  var sh = G.shelf; beams += rect(sh[0], sh[2], sh[1] - sh[0], 8 * S) + rect(sh[0] + 10, sh[2] + 8 * S, 6 * S, 14 * S) + rect(sh[1] - 16, sh[2] + 8 * S, 6 * S, 14 * S);
  add(mid, 'b', beams, C.wood);
  var fr = rect(wx0 - 12 * S, wy0 - 12 * S, ww + 24 * S, wh + 24 * S) + n2_hole(wx0, wy0, ww, wh, 6), lat = '';
  for (i = 1; i < 3; i++) lat += rect(wx0 + ww * i / 3 - 2.5 * S, wy0, 5 * S, wh); for (i = 1; i < 2; i++) lat += rect(wx0, wy0 + wh * i / 2 - 2.5 * S, ww, 5 * S);
  add(mid, 'c', fr + lat + rect(wx0 - 18 * S, wy1 + 8 * S, ww + 36 * S, 10 * S), C.frame);
  var tl = ''; for (var ty = G.noren[3]; ty < G.ct; ty += 26 * S) tl += seg(G.pass + 6, ty, W + 40, ty); for (x = G.pass + 6; x < W + 40; x += 26 * S) tl += seg(x, G.noren[3], x, G.ct - 12 * S);
  stk(mid, 's', tl, C.tile, 1.2);
  // menu tags hanging on the kitchen wall, with brush marks
  var tags = '', ink = '', T = G.tags, tw = 20 * S, n = Math.floor((T[1] - T[0]) / (tw * 1.25));
  for (i = 0; i < n; i++) { var tx = T[0] + i * (T[1] - T[0]) / n + 2, th = (58 + (i % 3) * 6) * S; tags += rrect(tx, T[2], tw, th, 2); for (var k = 0; k < 3; k++) ink += rrect(tx + tw * 0.32, T[2] + 8 * S + k * th * 0.26, tw * 0.36, th * 0.16, 2) ; }
  add(mid, 'd', tags, C.tag); add(mid, 'e', ink, C.ink);
  // stacked bowls on the shelf
  var bw3 = (ph ? 20 : 30), bowls = '', bands = '';
  for (x = sh[0] + 24 * S; x < sh[1] - bw3; x += bw3 * 1.5) for (k = 0; k < 3; k++) { var by = sh[2] - k * bw3 * 0.32; bowls += poly([[x - bw3 * 0.55, by - bw3 * 0.32], [x + bw3 * 0.55, by - bw3 * 0.32], [x + bw3 * 0.35, by], [x - bw3 * 0.35, by]]); bands += rect(x - bw3 * 0.5, by - bw3 * 0.24, bw3, bw3 * 0.07); }
  add(mid, 'f', bowls, C.bowl); add(mid, 'g', bands, C.band);
  // near: the counter top, its edge, the front, slats and stools
  add(near, 'a', rect(-40, G.ct, W + 80, G.cf - G.ct), C.ctop);
  add(near, 'b', rect(-40, G.cf - 5 * S, W + 80, 6 * S), C.cedge);
  add(near, 'c', rect(-40, G.cf + 1, W + 80, H), C.cfront);
  var sl = '', pl = ''; for (x = 20; x < W; x += ph ? 34 : 48) { sl += seg(x, G.cf + 10, x, H + 10); if (Math.round(x / (ph ? 34 : 48)) % 2) pl += rect(x, G.cf + 10, ph ? 34 : 48, H); }
  add(near, 'd', pl + rect(-40, G.cf + 1, W + 80, 9 * S), dk ? '#432A26' : '#86543A'); var grain = ''; for (i = 0; i < 4; i++) grain += pline(n2_fn(-40, W + 40, 40, function (x) { return G.ct + (G.cf - G.ct) * (0.2 + i * 0.2) + Math.sin(x / 90 + i * 2) * 2; }));
  stk(near, 's', sl, C.slat, 2); stk(near, 't', grain, dk ? 'rgba(0,0,0,0.18)' : 'rgba(150,90,40,0.25)', 1.2);
  var st = ''; (ph ? [0.2, 0.8] : [0.12, 0.38, 0.62, 0.88]).forEach(function (f) { var cx = W * f, cy = H * 0.975, rx2 = (ph ? 46 : 74); st += ell(cx, cy, rx2, rx2 * 0.26) + rect(cx - rx2, cy, rx2 * 2, 40); });
  add(near, 'e', st, C.stool);
  if (ANIM) { ANIM.G = G; ANIM.sign = [sx, sy, sw]; ANIM.gy = gy; }
  else { var N = G.noren, np = (N[1] - N[0]) / (ph ? 3 : 5), nd = ''; for (i = 0; i < (ph ? 3 : 5); i++) nd += rect(N[0] + i * np + 2, N[2], np - 4, N[3] - N[2]); add(near, 'f', nd, dk ? '#26315E' : '#2B4078'); add(near, 'g', circ((N[0] + N[1]) / 2, (N[2] + N[3]) / 2, ph ? 18 : 28), '#FFFFFF');
    var ln = ''; G.lant.forEach(function (L) { ln += ell(L[0], L[1] + 38 * S, 24 * S, 32 * S); }); add(near, 'h', ln, '#D2363E'); }
  return n2_out({sky: sky, far: far, mid: mid, near: near});
};
