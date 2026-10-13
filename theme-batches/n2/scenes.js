// ---- batch n2: mushrooms (Mushroom Hollow), sunflowers (Sunflower Field), nighttrain (Night Train), ramen (Ramen Shop)
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
// a small pointed leaflet (6 points instead of the 24 of leaf(): a fern frond has dozens of them)
function n2_leaflet(x, y, len, w, ang) { return poly(rotp([[0, 0], [len * 0.3, w], [len * 0.7, w * 0.75], [len, 0], [len * 0.7, -w * 0.55], [len * 0.3, -w * 0.7]], x, y, ang)); }
function n2_frond(x, y, len, a0, bend, curl, w) {
  var pts = n2_frondPts(x, y, len, a0, bend, curl), d = n2_tube(pts, w || len * 0.03, (w || len * 0.03) * 0.4), n = pts.length - 1;
  for (var i = 3; i < n - 2; i++) { var s = i / n, p = pts[i], q = pts[i + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI, sz = len * 0.2 * Math.pow(1 - s, 0.7) * (1 - curl * Math.pow(s, 1.5)); if (sz < 2) continue;
    d += n2_leaflet(p[0], p[1], sz, sz * 0.26, ang - 62) + n2_leaflet(p[0], p[1], sz, sz * 0.26, ang + 62); }
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
  var trunks = '', bark = '', barkL = [], lvs = [], tx = ph ? [[0.04, 50], [0.96, 44]] : [[0.025, 74], [0.27, 46], [0.7, 56], [0.985, 80]];
  tx.forEach(function (q) { var x = W * q[0], w = q[1], b = gY(x) - 8, pts = [[x - w * 1.25, b], [x - w * 0.62, b - w * 0.5], [x - w * 0.5, b - w * 1.4], [x - w * 0.44, -40], [x + w * 0.44, -40], [x + w * 0.5, b - w * 1.4], [x + w * 0.62, b - w * 0.5], [x + w * 1.25, b]]; trunks += poly(pts);
    for (var k = 0; k < 5; k++) { var bx = x - w * 0.3 + k * w * 0.15; barkL.push([[bx, -30], [bx + Math.sin(k) * 4, b * 0.4], [bx - 3, b - w]]); } });
  add(mid, 'a', trunks, C.mt);
  var lv1 = '', lv2 = '';
  for (x = -40; x < W + 40; x += ph ? 22 : 30) { var hang = (Math.sin(x / 90) * 0.5 + 0.5) * (ph ? 50 : 80) + rnd() * 30; for (var k = 0; k < 3; k++) { var yy = -10 + rnd() * hang, ang = 70 + rnd() * 40, len = (ph ? 26 : 38) + rnd() * 20; var lx = x + rnd() * 20; lvs.push([lx, yy, len, len * 0.38, ang]); if (k % 2) lv2 += leaf(lx, yy, len, len * 0.38, ang); else lv1 += leaf(lx, yy, len, len * 0.38, ang); } }
  add(mid, 'd', lv1, C.leaf1); add(mid, 'e', lv2, C.leaf2);
  // the bark lines are strokes (drawn over every fill in this layer), so they are cut wherever a hanging leaf covers the trunk
  function underLeaf(px, py) { for (var q = 0; q < lvs.length; q++) { var L = lvs[q], a = L[4] * Math.PI / 180, dx = px - L[0], dy = py - L[1], u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a), t = u / L[2];
      if (t > 0 && t < 1) { var sw = Math.sin(Math.PI * t) * (1 - 0.35 * t) * L[3]; if (v < sw + 1.5 && v > -0.7 * sw - 1.5) return true; } } return false; }
  barkL.forEach(function (pl) { var run = []; for (var s2 = 1; s2 < pl.length; s2++) { var a = pl[s2 - 1], b = pl[s2], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)); for (var q = s2 === 1 ? 0 : 1; q <= n; q++) { var px = a[0] + (b[0] - a[0]) * q / n, py = a[1] + (b[1] - a[1]) * q / n;
    if (underLeaf(px, py)) { if (run.length > 1) bark += pline(run); run = []; } else run.push([px, py]); } } if (run.length > 1) bark += pline(run); });
  stk(mid, 's', bark, C.bark, ph ? 1.5 : 2.2);
  var mound = ridge(W, gy - 6, [[7, 120, 0.4], [3, 37, 1.6]], 8);
  add(mid, 'b', below(mound, H + 40), C.mound);
  var bush = ''; spread(-20, gy - 14, W + 40, 10, ph ? 70 : 110, 10, rnd, 0.6).forEach(function (c) { if (c.q < 0.55) { var r = (ph ? 10 : 16) + c.r * 12; bush += circ(c.x, n2_yOn(mound, c.x) + 2, r) + circ(c.x + r * 0.8, n2_yOn(mound, c.x) + 4, r * 0.7) + circ(c.x - r * 0.8, n2_yOn(mound, c.x) + 4, r * 0.65); } });
  add(mid, 'c', bush, C.bush);
  // the fallen log (left), lying a little downhill
  var lx0 = -40, lx1 = W * (ph ? 0.44 : 0.3), lth = ph ? 30 : 46, ly0 = gY(lx0) + (ph ? 6 : 10) - lth / 2, ly1 = gY(lx1) + (ph ? 14 : 22) - lth / 2;
  var la = Math.atan2(ly1 - ly0, lx1 - lx0), lc = Math.cos(la), ls = Math.sin(la), nx = -ls, ny = lc, sbx = lx0 + lc * W * 0.12, sby = ly0 + ls * W * 0.12 - lth * 0.4;   // a broken-off branch stub on the log
  add(mid, 'f', poly([[lx0 + nx * lth / 2, ly0 + ny * lth / 2], [lx1 + nx * lth / 2, ly1 + ny * lth / 2], [lx1 - nx * lth / 2, ly1 - ny * lth / 2], [lx0 - nx * lth / 2, ly0 - ny * lth / 2]]) + n2_tube([[sbx, sby + lth * 0.2], [sbx - lth * 0.2, sby - lth * 0.5]], lth * 0.3, lth * 0.24), C.log);
  add(mid, 'g', rotEll(lx1, ly1, lth * 0.24, lth * 0.5, la * 180 / Math.PI) + rotEll(sbx - lth * 0.2, sby - lth * 0.5, lth * 0.13, lth * 0.06, -20), C.logE);
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
  var fr = '', frB = '';
  if (ph) fr += n2_frond(-6, H + 6, H * 0.2, -1.2, 0.5, 0, 4) + n2_frond(W + 6, H + 8, H * 0.18, -1.9, -0.5, 0, 4);
  else { fr += n2_frond(-10, H + 8, H * 0.32, -1.15, 0.55, 0, 6) + n2_frond(20, H + 8, H * 0.24, -1.45, 0.7, 0, 5) + n2_frond(W + 10, H + 6, H * 0.3, -2.05, -0.5, 0, 6); frB = n2_frond(W * 0.62, gY(W * 0.62) + 30, H * 0.12, -1.75, 0.6, 0, 3) + n2_frond(W * 0.64, gY(W * 0.64) + 32, H * 0.1, -1.3, 0.4, 0, 3); }
  add(near, 'f', fr + frB, C.fern);
  var stones = ''; [[ph ? 0.6 : 0.36, 1], [ph ? 0.12 : 0.66, 0.8]].forEach(function (q) { var sx = W * q[0], sy = gY(sx) + H * 0.07, r = (ph ? 14 : 22) * q[1]; stones += ell(sx, sy, r * 1.4, r * 0.8) + ell(sx + r, sy + 3, r * 0.8, r * 0.5); });
  add(near, 'h', stones, C.stone);
  // the mushrooms: a big toadstool family (right), little ones by the log, and a fairy ring in front
  var S = ph ? 0.62 : 1, shrooms = [];
  function M(x, y, h, r, lean, kind, col, face, ring) { shrooms.push({x: x, y: y, h: h * S, r: r * S, lean: lean * S, kind: kind, col: col, face: face, ring: ring}); }
  var bx = W * (ph ? 0.8 : 0.875), by = gY(bx) + H * (ph ? 0.1 : 0.12);
  M(bx, by, 150, 78, -8, 'toad', 0, 1); M(bx - 92 * S, by + 14 * S, 82, 46, 10, 'toad', 0, 2); M(bx + 70 * S, by + 18 * S, 56, 30, 6, 'toad', 0, 0);
  M(bx - 150 * S, by + 4 * S, 46, 40, -4, 'flat', 1, 0); M(bx + 118 * S, by - 6 * S, 64, 22, -6, 'bell', 2, 0);
  var lgx = W * (ph ? 0.3 : 0.24); M(lgx, gY(lgx) + 20 * S, 44, 34, 4, 'flat', 1, 0); M(lgx + 34 * S, gY(lgx) + 26 * S, 30, 20, -4, 'flat', 1, 0); M(lgx - 52 * S, gY(lgx) + 30 * S, 54, 18, 2, 'bell', 2, 0);
  if (!ph) { M(W * 0.13, ly0 + (ly1 - ly0) * 0.4 - lth * 0.3, 24, 18, 2, 'flat', 1, 0); M(W * 0.165, ly0 + (ly1 - ly0) * 0.52 - lth * 0.3, 16, 12, -2, 'flat', 1, 0); }
  var rc = [W * (ph ? 0.5 : 0.45), H * (ph ? 0.9 : 0.915)], rx = W * (ph ? 0.33 : 0.2), ryy = H * (ph ? 0.036 : 0.052), RC = ['#F48A8A', '#F6B26B', '#F2D55E', '#9BD77A', '#6FD1C6', '#79A8F2', '#A98BEA', '#F49AC8'];
  for (i = 0; i < 8; i++) { var aa = Math.PI * 0.5 + i / 8 * Math.PI * 2; M(rc[0] + Math.cos(aa) * rx, rc[1] + Math.sin(aa) * ryy, (ph ? 34 : 46) + (i % 3) * 6, (ph ? 22 : 29) + (i % 2) * 5, (i % 3 - 1) * 2, 'toad', 10 + i, i === 0 ? 3 : 0, i); }
  var rg = '', rf = ''; for (i = 0; i < 64; i++) { var ra = i / 64 * Math.PI * 2, rx1 = rc[0] + Math.cos(ra) * rx * 1.02, ry1 = rc[1] + Math.sin(ra) * ryy * 1.05; rg += ell(rx1, ry1 + 2, (ph ? 7 : 11) + (i % 3) * 2, (ph ? 2.2 : 3.2)); if (i % 4 === 1) for (var pk = 0; pk < 5; pk++) { var pa = pk / 5 * 6.283; rf += circ(rx1 + Math.cos(pa) * 1.6, ry1 - 3 + Math.sin(pa) * 1.6, 1.2); } }
  add(near, 'b', rg); add(near, 'e', rf);
  shrooms.sort(function (p, q) { return p.y - q.y; });
  if (ANIM) {
    ANIM.ferns = fr; ANIM.fernC = C.fern;
    ANIM.shrooms = shrooms; ANIM.gy = gy; ANIM.ring = {x: rc[0], y: rc[1], rx: rx, ry: ryy, cols: RC};
    ANIM.log = {x0: lx0, y0: ly0, x1: lx1, y1: ly1, th: lth}; ANIM.fern = {x: W * (ph ? 0.6 : 0.73), y: gY(W * (ph ? 0.6 : 0.73)) + H * 0.05, len: H * (ph ? 0.11 : 0.15)};
    ANIM.beams = (ph ? [0.05, 0.42, 0.78] : [0.06, 0.3, 0.55, 0.8]).map(function (f, k) { return [W * f + (ph ? 34 : 60) * 0.5, (ph ? 34 : 60) + k * 8, H * 0.42]; });
  } else {
    var st = '', cp = '', sp = '';
    shrooms.forEach(function (m) { var P = n2_shroom(m.x, m.y, m.h, m.r, m.lean, m.kind); st += P.stem; cp += P.cap; sp += P.spots; });
    // still scene order: stems, caps, the front ferns, then the cap spots with the little flowers; stones join the pebbles
    var flwD = near.e.d; near.e.d = ''; near.f.d = ''; near.h.d = ''; near.d.d += stones;
    near.c.d += frB; add(near, 'e', st, C.stem); add(near, 'f', cp, C.cap); add(near, 'g', fr, C.fern); add(near, 'h', sp + flwD, C.flw);
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
  function onRoad(x, y, pad, fence) { for (var j = 0; j < road.length; j++) { var hw = rw(j / 40) / 2, dx = x - road[j][0]; if (Math.abs(road[j][1] - y) < 14 && (Math.abs(dx) < hw + pad || (fence && dx > 0 && dx < hw + 10 * S * (1 - j / 40) + 4 + pad + 6 * S))) return true; } return false; }
  var bands = '', dots = '', dotC = '', rows = ph ? 7 : 9;
  for (j = 0; j < rows; j++) { var z = j / (rows - 1), yy = lerp(fy0 + 6 * S, H * (ph ? 0.68 : 0.7), Math.pow(z, 1.25)), rr = lerp(1.6, 5.5, z) * S * (ph ? 1.3 : 1), stp = rr * 2.7;
    bands += below(n2_fn(-40, W + 40, 10, function (x) { return f1(x) - fy0 + yy + rr * 0.8 + Math.sin(x / 40 + j) * 1.5; }), H + 40);
    for (x = -10 + (j % 2) * stp / 2; x < W + 10; x += Math.max(stp, 6.2)) { y = f1(x) - fy0 + yy + (rnd() - 0.5) * rr * 0.6; if (onRoad(x, y, rr * 2) || (Math.abs(x - bx - 20 * s) < 120 * s && y < by + 4)) continue; dots += circ(x, y, rr); if (rr > 3.6) dotC += circ(x + rr * 0.06, y + rr * 0.04, rr * 0.3); } }
  add(near, 'b', bands, C.band); add(near, 'c', dots, C.dot); add(near, 'd', dotC, C.dotC);
  add(near, 'e', poly(RL.concat(RR)), C.road);
  var fence = '', fp = [], fb = [];
  for (j = 4; j < 38; j += 2) { var p = road[j], u = j / 40, w = rw(u), fx = p[0] + w / 2 + 10 * S * (1 - u) + 4, fh = (22 * (1 - u) + 6) * S; fence += seg(fx, p[1], fx, p[1] - fh); fp.push([fx, p[1] - fh * 0.8]); fb.push([fx, p[1] - fh * 0.4]); }
  stk(near, 's', fence + pline(fp) + pline(fb), C.fence, 2.4 * S);
  // the sunflowers that turn are drawn by the engine; still scenes get them here
  var fl = [], rowsB = ph ? [[0.705, 9], [0.75, 12], [0.8, 16], [0.86, 22], [0.93, 30], [1.03, 42]] : [[0.71, 10], [0.745, 13], [0.785, 17], [0.835, 22], [0.895, 29], [0.97, 38], [1.07, 52]];
  rowsB.forEach(function (q, j) { var r = q[1] * (ph ? 0.85 : 1), yb = H * q[0], stp = r * 2.5, x0 = (j % 2) * stp * 0.5 - stp * 0.3;
    for (var x = x0; x < W + r; x += stp * (0.9 + rnd() * 0.25)) { var y = yb + (rnd() - 0.5) * r * 0.3; if (onRoad(x, y, r * 1.25, true) || onRoad(x, y - r * 1.2, r * 0.6)) continue; fl.push({x: x + (rnd() - 0.5) * r * 0.4, y: y, r: r * (0.88 + rnd() * 0.24), h: r * (2.6 + rnd() * 0.8), z: j / (rowsB.length - 1), ph: rnd() * 6.28, face: 0}); } });
  var big = fl.filter(function (q) { return q.z === 1 && q.x > W * (ph ? 0.05 : 0.6) && q.x < W * 0.95; });
  if (big.length) { big[0].face = 1; if (big.length > 2) big[big.length - 1].face = 2; }
  if (ANIM) { ANIM.flowers = fl; ANIM.hz = H * (ph ? 0.52 : 0.5); ANIM.fieldTop = fy0; ANIM.barn = {x: bx, y: by, s: s, wins: [[bx + f + dpt * 0.25 + 7 * s, by - hgt * 0.62 + 6 * s], [bx + f + dpt * 0.65 + 7 * s, by - hgt * 0.62 + 6 * s], [bx, by - 85 * s]]}; }
  else { var hd = '', cn = '', sm = '', kept = [];
    fl.slice().sort(function (p, q) { return q.z - p.z; }).forEach(function (q) { var hy = q.y - q.h; if (!kept.some(function (k) { var dx = k.x - q.x, dy = (k.y - k.h) - hy; return Math.sqrt(dx * dx + dy * dy) < (k.r + q.r) * 1.02; })) kept.push(q); });
    kept.sort(function (p, q) { return p.z - q.z; }).forEach(function (q) { var hy = q.y - q.h + (dk ? q.r * 0.35 : 0), sx = q.x + (dk ? q.r * 0.15 : 0); sm += n2_tube([[q.x, q.y + q.r], [q.x, (q.y + hy) / 2], [sx, hy]], q.r * 0.16, q.r * 0.12);
      if (q.r > 14) sm += n2_leaflet(q.x, q.y - q.h * 0.35, q.r * 1.1, q.r * 0.36, -160) + n2_leaflet(q.x, q.y - q.h * 0.15, q.r * 1.05, q.r * 0.34, -25);
      var st2 = [], np = q.r > 16 ? 14 : 9; for (var k2 = 0; k2 < np * 2; k2++) { var a2 = k2 / (np * 2) * Math.PI * 2, rr2 = q.r * (k2 % 2 ? 0.66 : 1.02); st2.push([sx + Math.cos(a2) * rr2, hy + Math.sin(a2) * rr2 * (dk ? 0.8 : 1)]); }
      hd += poly(st2); cn += ell(sx, hy, q.r * 0.4, q.r * 0.4 * (dk ? 0.8 : 1)); });
    add(near, 'f', sm, dk ? '#2A5A3A' : '#4E8A34'); add(near, 'g', hd, dk ? '#C8A040' : '#F6C431'); add(near, 'h', cn, dk ? '#3A2418' : '#7A4A1E');
    if (!dk) { add(mid, 'a', circ(W * 0.22, H * 0.17, 34 * S), '#FFD44A'); add(far, 'c', n2_puff(W * 0.42, H * 0.14, 150 * S, 40 * S, rnd) + n2_puff(W * 0.7, H * 0.08, 120 * S, 32 * S, rnd), '#FFFFFF'); }
    else add(far, 'c', circ(W * 0.66, H * 0.15, 26 * S), '#FFF4D2'); }
  return n2_out({sky: sky, far: far, mid: mid, near: near});
};

// ================= 4. Night Train: inside a train compartment, two high-backed seats facing each other across a wide window =================
// the window and the compartment around it, shared by the scene and its engine
function n2_trainGeo(W, H) {
  var ph = H > W, g = ph ? {ph: ph, S: 0.65, x0: W * 0.09, x1: W * 0.91, y0: H * 0.195, y1: H * 0.46, r: 24, fr: 17, ceil: H * 0.07, rack: H * 0.142, tbl: [W * 0.3, W * 0.7], fl: H * 0.885,
      seat: {m: W * 0.015}, lampX: W * 0.62, lights: [W * 0.25, W * 0.75],
      cases: [[W * 0.03, 78, 40, 0], [W * 0.27, 52, 30, 1], [W * 0.66, 96, 46, 2]]} :
    {ph: ph, S: 1, x0: W * 0.17, x1: W * 0.81, y0: H * 0.235, y1: H * 0.6, r: 38, fr: 26, ceil: H * 0.062, rack: H * 0.13, tbl: [W * 0.25, W * 0.74], fl: H * 0.93,
      seat: {m: W * 0.012}, lampX: W * 0.68, lights: [W * 0.2, W * 0.5, W * 0.8],
      cases: [[W * 0.015, 118, 54, 0], [W * 0.13, 74, 38, 1], [W * 0.21, 50, 50, 3], [W * 0.7, 92, 44, 2], [W * 0.8, 128, 60, 0]]};
  var st = g.seat; st.by = g.fl - 8 * g.S; st.reach = st.m + 202 * g.S; st.bf = st.m + 16 * g.S; st.top = st.by - 420 * g.S;
  g.ty = g.y1 + g.fr + 14 * g.S; g.wain = g.y1 + g.fr + 6 * g.S; g.lamp = [g.lampX, g.ty];
  return g;
}
// a polygon with rounded corners (r: one radius or one per corner), always wound clockwise so shapes in one slot merge
function n2_rpoly(pts, r) {
  var n = pts.length, a = 0, i, d = '';
  for (i = 0; i < n; i++) { var j = (i + 1) % n; a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]; }
  if (a < 0) { pts = pts.slice().reverse(); if (r instanceof Array) r = r.slice().reverse(); }
  for (i = 0; i < n; i++) { var p = pts[i], pv = pts[(i + n - 1) % n], nx = pts[(i + 1) % n], l1 = Math.hypot(pv[0] - p[0], pv[1] - p[1]) || 1, l2 = Math.hypot(nx[0] - p[0], nx[1] - p[1]) || 1, rr = Math.min(r instanceof Array ? r[i] : r, l1 * 0.48, l2 * 0.48);
    d += (i ? ' L' : 'M') + PT(p[0] + (pv[0] - p[0]) * rr / l1, p[1] + (pv[1] - p[1]) * rr / l1) + ' Q' + PT(p[0], p[1]) + ' ' + PT(p[0] + (nx[0] - p[0]) * rr / l2, p[1] + (nx[1] - p[1]) * rr / l2); }
  return d + ' Z ';
}
// one compartment armchair in a three-quarter view: sd 1 is the left seat, -1 the right one, both turned toward the middle of the compartment.
// Built as a little box model (w across its width from the outer side, f from the back to the front, h up from the floor) drawn in an
// oblique projection, so we see its front, its tops and its outer side. faces: painted back to front, t = tone (L light, M mid, D dark, W wood)
function n2_trainSeat(G, W, sd) {
  var s = G.seat, S = G.S, ex = sd > 0 ? s.m : W - s.m, by = s.by, k;
  var Wd = 150, P = 120, Bt = 30, A = 20, hs = 98, ha = 172, hb = 392, hp = 40, f0 = 14;
  function Q(w, f, h) { return [ex + sd * (w + f * 0.42) * S, by + (f * 0.28 - h) * S]; }
  function F(q, r, t) { return {d: n2_rpoly(q.map(function (p) { return Q(p[0], p[1], p[2]); }), (r instanceof Array ? r : [r, r, r, r]).map(function (v) { return v * S; })), t: t}; }
  function roll(a, b, w, t) { a = Q(a[0], a[1], a[2]); b = Q(b[0], b[1], b[2]); return {d: n2_tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], w * S, w * S) + circ(b[0], b[1], w * S / 2) + circ(a[0], a[1], w * S / 2), t: t}; }
  function cap(p, w, t) { var c = Q(p[0], p[1], p[2]); return {d: ell(c[0], c[1], w * S * 0.46, w * S / 2), t: t}; }
  var o = {faces: []}, fc = o.faces;
  o.shadow = n2_rpoly([Q(-12, -6, 0), Q(Wd + 12, -6, 0), Q(Wd + 12, P + 16, 0), Q(-12, P + 16, 0)], 24 * S);
  // the high back: its outer side, its tufted front and the headroll along the top
  fc.push(F([[0, 0, f0], [0, Bt, f0], [0, Bt, hb], [0, 0, hb]], [4, 4, 8, 8], 'D'));
  fc.push(F([[0, Bt, hs - 10], [Wd, Bt, hs - 10], [Wd, Bt, hb], [0, Bt, hb]], [4, 4, 14, 14], 'L'));
  fc.push(roll([2, Bt * 0.5, hb], [Wd - 2, Bt * 0.5, hb], 50, 'L'), cap([2, Bt * 0.5, hb], 50, 'M'));
  // the inner arm, mostly behind the cushion
  fc.push(F([[Wd - A, Bt, f0], [Wd - A, P, f0], [Wd - A, P, ha], [Wd - A, Bt, ha]], 4, 'M'), F([[Wd - A, P, f0], [Wd, P, f0], [Wd, P, ha], [Wd - A, P, ha]], [3, 3, 8, 8], 'M'), roll([Wd - A / 2, Bt, ha], [Wd - A / 2, P, ha], 24, 'L'), cap([Wd - A / 2, P, ha], 24, 'M'));
  // the deep seat cushion on its wooden plinth
  fc.push(F([[A, P - 3, f0], [Wd - A, P - 3, f0], [Wd - A, P - 3, hp], [A, P - 3, hp]], 3, 'W'));
  fc.push(F([[A, Bt, hs], [Wd - A, Bt, hs], [Wd - A, P, hs], [A, P, hs]], [4, 4, 12, 12], 'L'), F([[A, P, hp], [Wd - A, P, hp], [Wd - A, P, hs], [A, P, hs]], [6, 6, 12, 12], 'M'));
  // the outer arm: its padded side, its front and a rolled top
  fc.push(F([[0, Bt - 4, f0], [0, P, f0], [0, P, ha], [0, Bt - 4, ha]], [3, 3, 8, 6], 'D'), F([[0, P, f0], [A, P, f0], [A, P, ha], [0, P, ha]], [3, 3, 8, 8], 'M'), roll([A / 2, Bt - 4, ha], [A / 2, P + 1, ha], 26, 'L'), cap([A / 2, P + 1, ha], 26, 'M'));
  // little wooden feet
  fc.push(F([[1, P - 4, 0], [A - 1, P - 4, 0], [A - 1, P - 4, f0 + 2], [1, P - 4, f0 + 2]], 2, 'W'), F([[Wd - A + 1, P - 4, 0], [Wd - 1, P - 4, 0], [Wd - 1, P - 4, f0 + 2], [Wd - A + 1, P - 4, f0 + 2]], 2, 'W'));
  // button tufting on the back: buttons in a diamond grid, joined by pulled stitches
  var rows = [], btn = '', st = '';
  [168, 232, 296, 352].forEach(function (h, r) { rows.push((r % 2 ? [0.32, 0.5, 0.68] : [0.23, 0.41, 0.59, 0.77]).map(function (u) { return Q(Wd * u, Bt + 0.5, h); })); });
  rows.forEach(function (row, r) { row.forEach(function (p) { btn += circ(p[0], p[1], 3.2 * S); if (r < rows.length - 1) rows[r + 1].forEach(function (q) { if (Math.abs(q[0] - p[0]) < Wd * 0.12 * S) st += seg(p[0], p[1], q[0], q[1]); }); }); });
  o.btn = btn; o.stitch = st;
  // piping along the edges: the back's front, the cushion's front edge, the outer arm
  o.pipe = pline([Q(0, Bt, hs), Q(0, Bt, hb - 20)]) + pline([Q(A + 6, P, hs - 1), Q(Wd - A - 6, P, hs - 1)]) + pline([Q(0, Bt, ha - 14), Q(0, P - 4, ha - 14)]);
  // the lace antimacassar, draped over the headroll and hanging down the front of the back, with a scalloped edge
  var w0 = Wd * 0.3, w1 = Wd * 0.7, lace = '', t0 = Q(w0, Bt * 0.3, hb + 23), t1 = Q(w1, Bt * 0.3, hb + 23), b0 = Q(w0, Bt + 1, hb - 52), b1 = Q(w1, Bt + 1, hb - 52);
  o.cloth = n2_rpoly([t0, t1, b1, b0], [10 * S, 10 * S, 3 * S, 3 * S]);
  for (k = 0; k <= 7; k++) { var z = k / 7; lace += circ(lerp(b0[0], b1[0], z), lerp(b0[1], b1[1], z), 4.4 * S); }
  o.lace = lace;
  return o;
}
// the fold-down table: its top, a single leg and foot
function n2_trainTable(G) { var S = G.S, T0 = G.tbl[0], T1 = G.tbl[1], tc = (T0 + T1) / 2; return rrect(T0, G.ty - 2 * S, T1 - T0, 13 * S, 5 * S) + poly([[tc - 6 * S, G.ty + 10 * S], [tc + 6 * S, G.ty + 10 * S], [tc + 4 * S, G.ty + 80 * S], [tc - 4 * S, G.ty + 80 * S]]) + rrect(tc - 18 * S, G.ty + 76 * S, 36 * S, 8 * S, 4 * S); }
// the luggage on the rack: [x, width, height, style]
function n2_trainCase(G, q) { var S = G.S, w = q[1] * S, h = q[2] * S, y = G.rack - 4 * S - h; return {x: q[0], y: y, w: w, h: h, k: q[3], d: q[3] === 3 ? rrect(q[0], y, w, h, w * 0.5) : rrect(q[0], y, w, h, 8 * S) + rrect(q[0] + w / 2 - 12 * S, y - 8 * S, 24 * S, 10 * S, 4 * S)}; }
// where the layers of land sit in the window: raised so the mountains and hills show above the board on desktop
function n2_trainLand(G) { var wh = G.y1 - G.y0; return {m: G.y0 + wh * 0.37, ma: wh * 0.19, h0: G.y0 + wh * 0.47, h1: G.y0 + wh * 0.61, h2: G.y0 + wh * 0.76}; }
// rolling land outside the window, as a function of world x (the train moves through it)
function n2_mount(x) { return 0.66 * Math.pow(1 - Math.abs(Math.sin(x / 170 + 0.5)), 1.3) + 0.34 * (1 - Math.abs(Math.sin(x / 61 + 1.3))); }
// the snow on the mountain tops: from the ridge down by a depth that grows with the height of the peak
function n2_snow(x0, x1, m, ma, ox) { var top = [], bot = []; for (var x = x0; x <= x1; x += 6) { var n = n2_mount(x + ox), y = m - ma * n, d = Math.max(0, n - 0.6) * ma * 0.95 * (1 + 0.3 * Math.sin(x * 0.31)); top.push([x, y]); bot.unshift([x, y + d]); } return top.concat(bot); }
function n2_land(k, x) { return k === 0 ? Math.sin(x / 260 + 1) * 0.5 + Math.sin(x / 97) * 0.22 + Math.sin(x / 41 + 2) * 0.08 : k === 1 ? Math.sin(x / 180) * 0.5 + Math.sin(x / 67 + 1) * 0.25 : Math.sin(x / 120 + 3) * 0.4 + Math.sin(x / 43) * 0.18; }
function n2_trainCol(dk) {
  return dk ? {wall: '#3E2E4A', wain: '#4A2C3A', ceil: '#2E2440', frame: '#2C1C28', brass: '#C8A050', cases: '#7A5A48', floor: '#261B28', pan: 'rgba(0,0,0,0.26)', net: 'rgba(200,160,80,0.55)',
      blind: '#8E7484', seat: '#2C5A5C', seatDk: '#1C3C40', cover: '#D6CADF', wood: '#3E2830', cur: '#7E2E4A', curD: '#5A1E36', stitch: 'rgba(0,0,0,0.3)', star: 'rgba(255,248,226,0.85)'} :
    {wall: '#F4E8D2', wain: '#A86E48', ceil: '#FBF3E4', frame: '#7A4A30', brass: '#D9A848', cases: '#C68A52', floor: '#8A4A50', pan: 'rgba(90,50,20,0.22)', net: 'rgba(160,120,50,0.6)',
      blind: '#FBEFD6', seat: '#3E7C6C', seatDk: '#2C5E52', cover: '#FFF8EC', wood: '#8A5434', cur: '#C8545A', curD: '#9A383E', stitch: 'rgba(20,50,40,0.35)', star: 'rgba(255,255,255,0)'};
}
SCENES.nighttrain = function (W, H, dk, rnd) {
  var G = n2_trainGeo(W, H), ph = G.ph, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0), S = G.S, x, k;
  var sky = dk ? 'linear-gradient(180deg,#141C33 0%,#1C2542 40%,#25304E 70%,#5B4A6A 100%)' : 'linear-gradient(180deg,#B9D7EA 0%,#CFE3EC 38%,#EAF2EE 70%,#E7D2B8 100%)';
  var C = n2_trainCol(dk), ww = G.x1 - G.x0, wh = G.y1 - G.y0;
  // mid: the carriage wall with the window cut out, the curved ceiling, panelling, the window frame, the luggage rack and the floor
  add(mid, 'a', rect(-40, -40, W + 80, H + 80) + n2_hole(G.x0, G.y0, ww, wh, G.r), C.wall);
  add(mid, 'b', rect(-40, G.wain, W + 80, H), C.wain);
  add(mid, 'c', rect(-40, -40, W + 80, G.ceil + 40), C.ceil);
  var pan = '', px = ph ? 76 : 118; for (x = 14; x < W; x += px) pan += rrect(x, G.wain + 26 * S, px - 24, G.fl - G.wain - 44 * S, 8 * S);
  // the ceiling ribs are strokes (drawn over the brass lamps), so each is cut where it passes behind a lamp and its stem
  var rib = '', ribHid = function (px, py) { return G.lights.some(function (lx) { return Math.pow((px - lx) / (30 * S + 3), 2) + Math.pow((py - G.ceil * 0.55) / (12 * S + 3), 2) < 1 || (Math.abs(px - lx) < 3 * S + 2 && py < G.ceil * 0.55); }); };
  for (x = -W * 0.1; x < W * 1.1; x += ph ? 90 : 150) { var rx0 = W / 2 + (x - W / 2) * 0.8, ry0 = -10, ry1 = G.ceil - 2, run = [], n = Math.ceil((ry1 - ry0) / 2);
    for (k = 0; k <= n; k++) { var px = rx0 + (x - rx0) * k / n, py = ry0 + (ry1 - ry0) * k / n; if (ribHid(px, py)) { if (run.length > 1) rib += pline(run); run = []; } else run.push([px, py]); } if (run.length > 1) rib += pline(run); }
  stk(mid, 's', pan + rib, C.pan, 2);
  add(mid, 'd', rrect(G.x0 - G.fr, G.y0 - G.fr, ww + 2 * G.fr, wh + 2 * G.fr, G.r + G.fr) + n2_hole(G.x0, G.y0, ww, wh, G.r) + rrect(G.x0 - G.fr - 12 * S, G.y1 + G.fr - 6 * S, ww + 2 * G.fr + 24 * S, 12 * S, 5 * S), C.frame);
  var br = rect(-40, G.ceil - 3 * S, W + 80, 6 * S) + rect(-40, G.wain - 2 * S, W + 80, 5 * S);
  br += rrect(-40, G.rack - 4 * S, W + 80, 7 * S, 3 * S) + rrect(-40, G.rack + 20 * S, W + 80, 5 * S, 2.5 * S);
  for (x = W * 0.04; x < W; x += W / (ph ? 3 : 6)) br += rrect(x - 2.5 * S, G.rack - 4 * S, 5 * S, 44 * S, 2.5 * S) + circ(x, G.rack + 42 * S, 5 * S);
  G.lights.forEach(function (lx) { br += ell(lx, G.ceil * 0.55, 30 * S, 12 * S) + rect(lx - 3 * S, -10, 6 * S, G.ceil * 0.55 + 10); });
  add(mid, 'e', br, C.brass);
  var net = ''; for (x = -40; x < W + 40; x += 12 * S) net += seg(x, G.rack + 3 * S, x + 6 * S, G.rack + 20 * S) + seg(x + 6 * S, G.rack + 20 * S, x + 12 * S, G.rack + 3 * S);
  stk(mid, 't', net, C.net, 1.2);
  var cs = ''; G.cases.forEach(function (q) { cs += n2_trainCase(G, q).d; }); add(mid, 'g', cs, C.cases);
  add(mid, 'h', rect(-40, G.fl, W + 80, H), C.floor);
  // near: the blind, the two seats, the fold-down table, curtains
  var nb = Math.floor((ww - 30 * S) / (16 * S)), sc = ''; for (k = 0; k < nb; k++) sc += circ(G.x0 + 15 * S + k * 16 * S + 8 * S, G.y0 + wh * 0.1, 8 * S);
  add(near, 'a', rrect(G.x0 + 2, G.y0 - 6, ww - 4, wh * 0.1 + 6, 6 * S) + sc, C.blind);
  var sv = {L: '', M: '', D: '', W: ''}, cov = '', st = '', bu = '';
  [1, -1].forEach(function (sd) { var o = n2_trainSeat(G, W, sd); o.faces.forEach(function (f) { sv[f.t] += f.d; }); cov += o.cloth + o.lace; st += o.stitch; bu += o.btn; });
  add(near, 'b', sv.L + sv.M + sv.D, C.seat); add(near, 'c', bu, C.seatDk); add(near, 'd', cov, C.cover);
  add(near, 'e', n2_trainTable(G) + sv.W, C.wood);
  add(near, 'f', rrect(G.x0 + ww / 2 - 4 * S, G.y0 + wh * 0.1 + 6 * S, 8 * S, 14 * S, 4 * S) + rrect(G.x0 - G.fr - 30 * S, G.y0 - G.fr - 16 * S, ww + 2 * G.fr + 60 * S, 7 * S, 3.5 * S), C.brass);
  // short curtains gathered at both sides of the window, with tie-backs
  var cur = '', curD = '';
  [-1, 1].forEach(function (sd) { var ex = sd < 0 ? G.x0 - G.fr - 18 * S : G.x1 + G.fr + 18 * S, cw = (ph ? 30 : 42), inn = ex - sd * cw, tieY = G.y0 + wh * 0.6, top = G.y0 - G.fr - 14 * S, bot = G.y1 + G.fr;
    var pts = [[ex + sd * 4, top], [inn - sd * 4, top], [inn + sd * cw * 0.1, tieY - wh * 0.25], [ex - sd * cw * 0.25, tieY], [inn + sd * cw * 0.05, tieY + wh * 0.18], [inn - sd * cw * 0.2, bot], [ex + sd * 4, bot]];
    cur += poly(n2_q(pts[0], pts[0], pts[1], 2).concat(n2_q(pts[1], pts[2], pts[3], 10), n2_q(pts[3], pts[4], pts[5], 10), [pts[6]]));
    for (k = 1; k < 4; k++) { var fx = ex - sd * cw * k * 0.22; curD += n2_tube(n2_q([fx, top + 4], [fx - sd * cw * 0.08 * k, tieY - wh * 0.2], [ex - sd * cw * 0.18, tieY], 10), 3.5 * S, 1.5) + n2_tube(n2_q([ex - sd * cw * 0.18, tieY], [fx - sd * cw * 0.12 * k, tieY + wh * 0.16], [fx - sd * cw * 0.1, bot - 2], 10), 1.5, 3.5 * S); }
    curD += rrect(ex - sd * cw * 0.32 - 8 * S, tieY - 4.5 * S, 16 * S, 9 * S, 4 * S); });
  add(near, 'g', cur, C.cur); add(near, 'h', curD, C.curD);
  stk(near, 's', st, C.stitch, 1.6 * S);
  // stars outside (night) are fixed; the land and the moon move in the engine
  var sta = ''; if (dk) spread(G.x0, G.y0, ww, wh * 0.55, 26, 26, rnd, 1).forEach(function (c) { if (c.q < 0.45) sta += circ(c.x, c.y, 0.5 + c.r); });
  add(far, 'a', sta, C.star);
  if (ANIM) { ANIM.G = G; }
  else {
    // the still scene: the same view the engine paints, without motion (behind the wall, in far and refl)
    var LC = dk ? ['#26305A', '#2C3762', '#1E2848', '#16203A', '#101830'] : ['#BCCFE6', '#A9C3DC', '#94C08A', '#72A866', '#4E8A4E'], lv = n2_trainLand(G);
    var hl = function (base, amp, kk) { return below(n2_fn(G.x0 - 10, G.x1 + 12, 8, function (x) { return base + amp * n2_land(kk, x); }), G.y1 + 20); };
    add(far, 'b', below(n2_fn(G.x0 - 10, G.x1 + 12, 6, function (x) { return lv.m - lv.ma * n2_mount(x); }), G.y1 + 20), LC[0]);
    add(far, 'c', hl(lv.h0, wh * 0.1, 0), LC[1]); add(far, 'd', hl(lv.h1, wh * 0.08, 1), LC[2]);
    var tr = '', hs = '', rf = ''; for (x = G.x0 + 10; x < G.x1; x += 46) { var hv = hash(x * 0.37), ty = lv.h2 + wh * 0.06 * n2_land(2, x) + 3, ts = (0.7 + hv * 0.6) * S; if (hv < 0.55) tr += poly([[x - 9 * ts, ty], [x, ty - 30 * ts], [x + 9 * ts, ty]]); }
    for (x = G.x0 + 60; x < G.x1; x += 170) { var hy2 = lv.h1 + wh * 0.08 * n2_land(1, x) + 2, s2 = S * 0.9; hs += rect(x - 10 * s2, hy2 - 12 * s2, 20 * s2, 12 * s2); rf += poly([[x - 13 * s2, hy2 - 11 * s2], [x, hy2 - 21 * s2], [x + 13 * s2, hy2 - 11 * s2]]); }
    add(far, 'e', hs + poly(n2_snow(G.x0 - 10, G.x1 + 12, lv.m, lv.ma, 0)), dk ? '#3E4470' : '#F6F0E6'); add(refl, 'a', hl(lv.h2, wh * 0.06, 2) + tr, LC[3]); add(refl, 'b', rf, dk ? '#5A3048' : '#D86A5A');
    var bush = below(n2_fn(G.x0 - 10, G.x1 + 12, 10, function (x) { return G.y1 - wh * 0.05 - Math.abs(Math.sin(x / 37)) * wh * 0.05; }), G.y1 + 20), poles = '', wires = '', gap = 300 * S;
    for (x = G.x0 + gap * 0.4; x < G.x1 + gap; x += gap) { var top = G.y0 + wh * 0.18; poles += seg(x, top, x, G.y1 + 20) + seg(x - 16 * S, top + 8 * S, x + 16 * S, top + 8 * S); [-12, 12].forEach(function (o) { wires += pline(n2_q([x - gap + o * S, top + 6 * S], [x - gap / 2, top + 6 * S + wh * 0.12], [x + o * S, top + 6 * S], 10)); }); }
    add(refl, 'c', bush, dk ? '#0C1222' : '#3E7A44'); stk(refl, 's', wires, dk ? '#0A0E1A' : '#5A4A40', 1.2); stk(refl, 't', poles, dk ? '#0A0E1A' : '#5A4A40', 4 * S);
    add(far, 'h', dk ? circ(G.x0 + ww * 0.72, G.y0 + wh * 0.2, 20 * S) : n2_puff(G.x0 + ww * 0.3, G.y0 + wh * 0.16, 70 * S, 26 * S, rnd) + n2_puff(G.x0 + ww * 0.62, G.y0 + wh * 0.13, 56 * S, 20 * S, rnd), dk ? '#FFF6DA' : '#FFFFFF');
    // the table lamp: a shade on a brass stem
    var L = G.lamp; add(near, 'g', poly([[L[0] - 10 * S, L[1] - 64 * S], [L[0] + 10 * S, L[1] - 64 * S], [L[0] + 22 * S, L[1] - 40 * S], [L[0] - 22 * S, L[1] - 40 * S]]));
    add(near, 'f', rect(L[0] - 2 * S, L[1] - 44 * S, 4 * S, 42 * S) + ell(L[0], L[1] - 2 * S, 13 * S, 4 * S)); }
  return n2_out({sky: sky, far: far, refl: refl, mid: mid, near: near});
};

// ================= 5. Ramen Shop: a late-night ramen counter with noren curtains, a steaming pot and rain on the window =================
function n2_ramenGeo(W, H) {
  var ph = H > W;
  return ph ? {ph: ph, S: 0.62, wx0: W * 0.05, wx1: W * 0.44, wy0: H * 0.2, wy1: H * 0.4, pass: W * 0.48, ct: H * 0.64, cf: H * 0.68, chef: [W * 0.66, H * 0.5], pot: [W * 0.9, H * 0.56], noren: [W * 0.48, W + 10, H * 0.095, H * 0.2], lant: [[W * 0.455, H * 0.105]], tags: [W * 0.5, W * 0.98, H * 0.225], shelf: [W * 0.05, W * 0.44, H * 0.47], neko: [W * 0.1, H * 0.64], bowl: [W * 0.3, H * 0.64], caddy: [W * 0.47, H * 0.64]} :
    {ph: ph, S: 1, wx0: W * 0.035, wx1: W * 0.29, wy0: H * 0.14, wy1: H * 0.52, pass: W * 0.33, ct: H * 0.655, cf: H * 0.7, chef: [W * 0.66, H * 0.43], pot: [W * 0.87, H * 0.53], noren: [W * 0.33, W + 20, H * 0.035, H * 0.2], lant: [[W * 0.31, H * 0.05], [W * 0.955, H * 0.24]], tags: [W * 0.37, W * 0.56, H * 0.25], shelf: [W * 0.36, W * 0.56, H * 0.44], neko: [W * 0.05, H * 0.655], bowl: [W * 0.16, H * 0.655], caddy: [W * 0.27, H * 0.655]};
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
  var tl = '', tsegs = [], occ = []; for (var ty = G.noren[3]; ty < G.ct; ty += 26 * S) tsegs.push([G.pass + 6, ty, W + 40, ty]); for (x = G.pass + 6; x < W + 40; x += 26 * S) tsegs.push([x, G.noren[3], x, G.ct - 12 * S]);
  // menu tags hanging on the kitchen wall, with brush marks
  var tags = '', ink = '', T = G.tags, tw = 20 * S, n = Math.floor((T[1] - T[0]) / (tw * 1.25));
  for (i = 0; i < n; i++) { var tx = T[0] + i * (T[1] - T[0]) / n + 2, th = (58 + (i % 3) * 6) * S; tags += rrect(tx, T[2], tw, th, 2); occ.push([tx, T[2], tx + tw, T[2] + th]); for (var k = 0; k < 3; k++) ink += rrect(tx + tw * 0.32, T[2] + 8 * S + k * th * 0.26, tw * 0.36, th * 0.16, 2) ; }
  add(mid, 'd', tags, C.tag); add(mid, 'e', ink, C.ink);
  // stacked bowls on the shelf
  var bw3 = (ph ? 20 : 30), bowls = '', bands = '';
  for (x = sh[0] + 24 * S; x < sh[1] - bw3; x += bw3 * 1.5) for (k = 0; k < 3; k++) { var by = sh[2] - k * bw3 * 0.32; bowls += poly([[x - bw3 * 0.55, by - bw3 * 0.32], [x + bw3 * 0.55, by - bw3 * 0.32], [x + bw3 * 0.35, by], [x - bw3 * 0.35, by]]); occ.push([x - bw3 * 0.55, by - bw3 * 0.32, x + bw3 * 0.55, by]); bands += rect(x - bw3 * 0.5, by - bw3 * 0.24, bw3, bw3 * 0.07); }
  add(mid, 'f', bowls, C.bowl); add(mid, 'g', bands, C.band);
  // the tile joints are strokes (drawn over everything in this layer), so they are cut around the tags, the bowls and the shelf
  occ.push([sh[0], sh[2], sh[1], sh[2] + 8 * S], [sh[0] + 10, sh[2], sh[0] + 10 + 6 * S, sh[2] + 22 * S], [sh[1] - 16, sh[2], sh[1] - 16 + 6 * S, sh[2] + 22 * S]);
  tsegs.forEach(function (g) { var hz2 = g[1] === g[3], a = hz2 ? g[0] : g[1], b = hz2 ? g[2] : g[3], cuts = [];
    occ.forEach(function (o) { if (hz2 ? (g[1] > o[1] - 1 && g[1] < o[3] + 1) : (g[0] > o[0] - 1 && g[0] < o[2] + 1)) cuts.push(hz2 ? [o[0] - 1, o[2] + 1] : [o[1] - 1, o[3] + 1]); });
    cuts.sort(function (p, q) { return p[0] - q[0]; }); var cur = a; cuts.forEach(function (c) { if (c[0] > cur) tl += hz2 ? seg(cur, g[1], Math.min(c[0], b), g[1]) : seg(g[0], cur, g[0], Math.min(c[0], b)); cur = Math.max(cur, c[1]); }); if (b > cur) tl += hz2 ? seg(cur, g[1], b, g[1]) : seg(g[0], cur, g[0], b); });
  stk(mid, 's', tl, C.tile, 1.2);
  // near: the counter top, its edge, the front, slats and stools
  add(near, 'a', rect(-40, G.ct, W + 80, G.cf - G.ct), C.ctop);
  add(near, 'b', rect(-40, G.cf - 5 * S, W + 80, 6 * S), C.cedge);
  add(near, 'c', rect(-40, G.cf + 1, W + 80, H), C.cfront);
  // the stools stand in front of the counter, so its slats stop at their seats (strokes draw over every fill)
  var stF = (ph ? [0.2, 0.8] : [0.12, 0.38, 0.62, 0.88]), stR = (ph ? 46 : 74), stTop = function (x) { var y = H + 10; stF.forEach(function (f) { var u = (x - W * f) / stR; if (Math.abs(u) < 1.02) y = Math.min(y, H * 0.975 - stR * 0.26 * Math.sqrt(Math.max(0, 1 - u * u)) - 1.5); }); return y; };
  var sl = '', pl = ''; for (x = 20; x < W; x += ph ? 34 : 48) { var sb = stTop(x); if (sb > G.cf + 12) sl += seg(x, G.cf + 10, x, sb); if (Math.round(x / (ph ? 34 : 48)) % 2) pl += rect(x, G.cf + 10, ph ? 34 : 48, H); }
  add(near, 'd', pl + rect(-40, G.cf + 1, W + 80, 9 * S), dk ? '#432A26' : '#86543A'); var grain = ''; for (i = 0; i < 4; i++) grain += pline(n2_fn(-40, W + 40, 40, function (x) { return G.ct + (G.cf - G.ct) * (0.2 + i * 0.2) + Math.sin(x / 90 + i * 2) * 2; }));
  stk(near, 's', sl, C.slat, 2); stk(near, 't', grain, dk ? 'rgba(0,0,0,0.18)' : 'rgba(150,90,40,0.25)', 1.2);
  var st = ''; stF.forEach(function (f) { var cx = W * f, cy = H * 0.975, rx2 = stR; st += ell(cx, cy, rx2, rx2 * 0.26) + rect(cx - rx2, cy, rx2 * 2, 40); });
  if (ANIM) add(near, 'e', st, C.stool);
  if (ANIM) { ANIM.G = G; ANIM.sign = [sx, sy, sw]; ANIM.gy = gy; }
  else { var N = G.noren, np = (N[1] - N[0]) / (ph ? 3 : 5), nd = ''; for (i = 0; i < (ph ? 3 : 5); i++) nd += rect(N[0] + i * np + 2, N[2], np - 4, N[3] - N[2]); add(near, 'f', nd, dk ? '#26315E' : '#2B4078'); add(near, 'g', circ((N[0] + N[1]) / 2, (N[2] + N[3]) / 2, ph ? 18 : 28), '#FFFFFF');
    var ln = ''; G.lant.forEach(function (L) { ln += ell(L[0], L[1] + 38 * S, 24 * S, 32 * S); }); add(near, 'h', ln + st, '#D2363E');
    var cx = G.chef[0], cy = G.chef[1], cs = S, P = G.pot, pw = 64 * S, coat = '', skin = '', hair = '', apron = '';
    coat += poly(n2_q([cx - 48 * cs, cy + 40 * cs], [cx, cy + 26 * cs], [cx + 48 * cs, cy + 40 * cs], 6).concat([[cx + 60 * cs, G.ct], [cx - 60 * cs, G.ct]])) + n2_tube(n2_q([cx - 44 * cs, cy + 56 * cs], [cx - 66 * cs, cy + 96 * cs], [cx - 40 * cs, cy + 118 * cs], 8), 20 * cs, 20 * cs) + n2_tube(n2_q([cx + 44 * cs, cy + 56 * cs], [cx + 70 * cs, cy + 92 * cs], [cx + 104 * cs, cy + 100 * cs], 8), 20 * cs, 20 * cs);
    var band = poly(n2_q([cx - 37 * cs, cy - 14 * cs], [cx, cy - 30 * cs], [cx + 37 * cs, cy - 14 * cs], 6).concat(n2_q([cx + 37 * cs, cy - 4 * cs], [cx, cy - 20 * cs], [cx - 37 * cs, cy - 4 * cs], 6))) + ell(cx + 34 * cs, cy - 16 * cs, 7 * cs, 5 * cs);
    skin += circ(cx, cy, 36 * cs) + circ(cx - 36 * cs, cy + 2 * cs, 8 * cs) + circ(cx + 36 * cs, cy + 2 * cs, 8 * cs) + circ(cx - 40 * cs, cy + 120 * cs, 9 * cs) + circ(cx + 106 * cs, cy + 100 * cs, 9 * cs);
    var straps = n2_tube([[cx - 30 * cs, cy + 104 * cs], [cx - 20 * cs, cy + 44 * cs]], 4 * cs, 4 * cs) + n2_tube([[cx + 30 * cs, cy + 104 * cs], [cx + 20 * cs, cy + 44 * cs]], 4 * cs, 4 * cs);
    hair += 'M' + PT(cx - 35 * cs * Math.cos(0.25), cy - 6 * cs - 35 * cs * Math.sin(0.25)) + ' A' + n1(35 * cs) + ' ' + n1(35 * cs) + ' 0 0 1 ' + PT(cx + 35 * cs * Math.cos(0.25), cy - 6 * cs - 35 * cs * Math.sin(0.25)) + ' Z ' + circ(cx - 10 * cs, cy + 10 * cs, 3.4 * cs) + circ(cx + 10 * cs, cy + 10 * cs, 3.4 * cs);
    apron += rect(cx - 46 * cs, Math.min(G.ct, cy + 104 * cs), 92 * cs, Math.max(0, G.ct - cy - 104 * cs));
    var pot = rect(P[0] - pw, P[1], pw * 2, G.ct - P[1]) + rect(P[0] - pw - 8 * S, P[1] + 14 * S, 10 * S, 8 * S) + rect(P[0] + pw - 2, P[1] + 14 * S, 10 * S, 8 * S), bx = cx + 125 * S, bTop = G.ct - 34 * S;
    pot += rect(bx - 46 * S, bTop, 92 * S, G.ct - bTop);
    var steam = ''; [[P[0] - 20 * S, P[1] - 8 * S], [P[0] + 14 * S, P[1] - 14 * S], [bx, bTop - 8 * S]].forEach(function (q, k) { steam += pline(n2_fn(0, 10, 1, function (j) { return j; }).map(function (j) { return [q[0] + Math.sin(j[0] * 0.8 + k) * 6 * S, q[1] - j[0] * 6 * S]; })); });
    add(mid, 'f', coat); add(mid, 'h', skin, '#F7D8B8'); add(near, 'd', hair); add(near, 'g', band); add(near, 'f', apron + straps); add(near, 'e', pot, C.steel); add(near, 'b', ell(P[0], P[1], pw, 9 * S) + ell(bx, bTop, 46 * S, 7 * S));
    stk(mid, 't', steam, dk ? 'rgba(255,240,250,0.45)' : 'rgba(255,255,255,0.9)', 3.4 * S); }
  return n2_out({sky: sky, far: far, mid: mid, near: near});
};
