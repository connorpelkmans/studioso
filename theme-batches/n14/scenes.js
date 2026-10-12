// ---- batch n14: lotus (Lotus Lake)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n14_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n14_P(pts) { return pts.length > 2 ? poly(n14_cw(pts)) : ''; }
function n14_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n14_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n14_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n14_P(rotp(p, x, y, ang)); }
function n14_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n14_dot(x, y) { return 'M' + PT(x, y) + ' h0.01 '; }
// a leaf or petal outline: base at (x,y), pointing along ang (degrees, 0 = +x, -90 = up), bent sideways by bend
function n14_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 12; i++) { var t = i / 12, ww = w * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.2 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n14_leaf(x, y, len, w, ang, bend) { return n14_P(n14_leafPts(x, y, len, w, ang, bend)); }
function n14_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
function n14_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n14_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// a tapered band from (x0,y0) to (x1,y1), bowed sideways by bend
function n14_limb(x0, y0, x1, y1, w0, w1, bend) { var L = [], R = [], n = 10; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); } return n14_P(L.concat(R.reverse())); }
// soft rounded hills: a base line minus a sum of bumps [centre x, height, half width]
function n14_hills(W, base, bumps, step) { var p = []; for (var x = -60; x <= W + 60; x += step || 6) { var y = base; bumps.forEach(function (b) { var d = (x - b[0]) / b[2]; y -= b[1] * Math.exp(-d * d); }); p.push([x, y]); } return p; }
function n14_ovl(a, b, pad) { return !(a[2] + pad < b[0] || b[2] + pad < a[0] || a[3] + pad < b[1] || b[3] + pad < a[1]); }
// a wavy ellipse outline (lotus leaf rim), rotated by ang degrees
function n14_wavy(x, y, rx, ry, ang, ph, k) { var p = []; for (var i = 0; i < 40; i++) { var t = i / 40 * Math.PI * 2, r = 1 + k * Math.sin(t * 7 + ph) + k * 0.6 * Math.sin(t * 13 + ph * 2.3); p.push([rx * r * Math.cos(t), ry * r * Math.sin(t)]); } return rotp(p, x, y, ang); }

// =============== 1. Lotus Lake: a wide still lake at dawn, crowded with giant round lotus leaves on stalks at different heights,
// pink blooms, buds and seed pods, with mist, willows on the far shore and soft hills beyond. Night: moonlit leaves, closed buds.
// one lotus leaf seen from above at a low angle: under rim (b), top (c), backlit sheen on the far edge (d), veins (returned as a stroke path)
function n14_lotusLeaf(o, x, y, rx, ry, ang, ph) {
  o.b += n14_P(n14_wavy(x, y + ry * 0.2, rx * 1.01, ry * 1.04, ang, ph, 0.035));
  o.c += n14_P(n14_wavy(x, y, rx, ry, ang, ph, 0.035));
  var sh = [], i, a0 = Math.PI * 1.08, a1 = Math.PI * 1.92, ca = Math.cos(ang * Math.PI / 180), sa = Math.sin(ang * Math.PI / 180);
  var pt = function (t, k, dy) { var r = 1 + 0.035 * Math.sin(t * 7 + ph) + 0.021 * Math.sin(t * 13 + ph * 2.3), px = rx * r * k * Math.cos(t), py = ry * r * k * Math.sin(t) + dy; return [x + px * ca - py * sa, y + px * sa + py * ca]; };
  for (i = 0; i <= 14; i++) sh.push(pt(a0 + (a1 - a0) * i / 14, 0.97, 0));
  for (i = 14; i >= 0; i--) { var u = i / 14; sh.push(pt(a0 + (a1 - a0) * u, 0.97 - 0.2 * Math.sin(Math.PI * u), ry * 0.05)); }
  o.d += n14_P(sh);
  var cx = x + ry * 0.08 * -sa, cy = y + ry * 0.08 * ca, v = '', n = 13;
  for (i = 0; i < n; i++) { var t = i / n * Math.PI * 2 + ph * 0.3, e = pt(t, 0.9, 0), m = pt(t + 0.08, 0.5, ry * 0.04); v += 'M' + PT(cx, cy) + ' Q' + PT(m[0], m[1]) + ' ' + PT(e[0], e[1]) + ' '; }
  return v;
}
// a lotus petal: outline points (base at x,y, pointing along ang degrees) and its tip (the same outline from k along, so the pink tip never sticks out)
function n14_petal(x, y, len, w, ang, bend, k) { var up = [], lo = [], tu = [], tl = [], b = bend || 0, n = 14;
  for (var i = 0; i <= n; i++) { var t = i / n, ww = w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.8) * (1 - 0.1 * t), c = b * len * t * t, P = [t * len, c - ww], Q = [t * len, c + ww]; up.push(P); lo.unshift(Q); if (t >= k) { tu.push(P); tl.unshift(Q); } }
  var full = up.concat(lo.slice(1, -1)), tip = [[k * len, b * len * k * k]].concat(tu, tl.slice(1));
  return {full: n14_P(rotp(full, x, y, ang)), tip: n14_P(rotp(tip, x, y, ang))}; }
// one lotus flower head at (x,y) (the top of its stalk), size r, open 0 (bud) .. 1 (full bloom). Slots: e inner petals, f seed head and
// stamens, g outer petals, h petal tips, c sepals
function n14_bloom(o, x, y, r, open) { var i, p;
  if (open < 0.2) { var sq = 1 + open * 1.5;
    o.c += n14_leaf(x, y + r * 0.1, r * 0.5, r * 0.15, -90 - 40, 0.15) + n14_leaf(x, y + r * 0.1, r * 0.5, r * 0.15, -90 + 40, -0.15);
    p = n14_petal(x, y + r * 0.2, r * 1.5, r * 0.44 * sq, -90, 0, 0.5); o.e += p.full; o.h += p.tip;
    [[-1, -8], [1, 8]].forEach(function (q) { var pp = n14_petal(x + q[0] * r * 0.05, y + r * 0.2, r * 1.34, r * 0.33 * sq, -90 + q[1], -q[0] * 0.05, 0.55); o.g += pp.full; o.h += pp.tip; }); return; }
  var sp = Math.min(1, open);
  o.c += n14_leaf(x, y + r * 0.12, r * 0.48, r * 0.14, -90 - 58 * sp - 26, 0.1) + n14_leaf(x, y + r * 0.12, r * 0.48, r * 0.14, -90 + 58 * sp + 26, -0.1);
  [-1, 0, 1].forEach(function (k) { p = n14_petal(x + k * r * 0.08, y - r * 0.1, r * 1.02, r * 0.44, -90 + k * 26 * sp, -k * 0.04, 0.6); o.e += p.full; });
  if (sp > 0.45) { o.f += n14_E(x, y - r * 0.36, r * 0.3, r * 0.1);
    for (i = 0; i < 11; i++) { var a = Math.PI + i / 10 * Math.PI; o.f += n14_RE(x + Math.cos(a) * r * 0.34, y - r * 0.38 + Math.sin(a) * r * 0.09 - r * 0.05, r * 0.035, r * 0.09, Math.cos(a) * 25); } }
  [[-3.4, 0.84, 0.4], [3.4, 0.84, 0.4], [-2, 0.95, 0.46], [2, 0.95, 0.46], [-0.8, 0.98, 0.46], [0.8, 0.98, 0.46]].forEach(function (q) { var k = q[0];
    p = n14_petal(x + k * r * 0.04, y + Math.abs(k) * r * 0.02, r * q[1], r * q[2], -90 + k * 19 * sp, -k * 0.015, 0.56); o.g += p.full; o.h += p.tip; });
}
// a seed pod: an upturned cone (d) with a flat seed face (f) dotted with seed holes (t)
function n14_pod(o, x, y, r) { var p = []; r *= 0.62;
  for (var i = 0; i <= 10; i++) { var t = Math.PI + i / 10 * Math.PI; p.push([x + Math.cos(t) * r * 0.6, y - r * 0.5 + Math.sin(t) * r * 0.2]); }
  o.d += n14_P(p.concat([[x + r * 0.6, y - r * 0.5], [x + r * 0.2, y + r * 0.25], [x, y + r * 0.34], [x - r * 0.2, y + r * 0.25], [x - r * 0.6, y - r * 0.5]]));
  o.f += n14_E(x, y - r * 0.5, r * 0.56, r * 0.18);
  [[0, 0], [-0.3, -0.04], [0.3, -0.04], [-0.16, 0.08], [0.16, 0.08], [-0.15, -0.09], [0.15, -0.09], [-0.38, 0.05], [0.38, 0.05]].forEach(function (q) { o.t += n14_dot(x + q[0] * r, y - r * 0.5 + q[1] * r); });
}
// a weeping willow on the far shore: a leaning trunk and a bell-shaped crown, rounded on top and flaring out into a ragged curtain of
// hanging strands just above the water (c), with lit strands (s) and a light top (e)
function n14_willow(o, x, y, h, rnd) { var w = h * (0.8 + rnd() * 0.3), i, top = y - h, pts = [], lean = (rnd() - 0.5) * h * 0.12;
  o.c += n14_limb(x, y + 1, x + lean * 0.5, y - h * 0.55, h * 0.045, h * 0.025, h * 0.04);
  for (i = 0; i <= 12; i++) { var t = Math.PI + i / 12 * Math.PI; pts.push([x + lean + Math.cos(t) * w * 0.3, top + h * 0.26 + Math.sin(t) * h * 0.26]); }
  var side = function (sg) { var q = []; for (var j = 1; j <= 5; j++) { var v = j / 5; q.push([x + lean * (1 - v) + sg * w * (0.3 + 0.22 * Math.sin(v * 1.4)), top + h * 0.26 + v * h * 0.58]); } return q; };
  var R = side(1), L = side(-1).reverse(), hem = [], n = 15;
  for (i = 0; i <= n; i++) { var u = i / n, hx = x + w * 0.5 - u * w, hy = y - h * 0.06 - (i % 2 ? h * (0.06 + rnd() * 0.12) : rnd() * h * 0.03) - Math.sin(Math.PI * u) * h * 0.02; hem.push([hx, hy]); }
  o.c += n14_P(pts.concat(R, hem, L));
  for (i = 0; i < 5; i++) { var f = (i + 0.5) / 5 - 0.5, sx = x + lean * 0.6 + f * w * 0.6, sy = top + h * (0.14 + Math.abs(f) * 0.3); o.s += 'M' + PT(sx, sy) + ' q' + n1(f * w * 0.12) + ' ' + n1(h * 0.3) + ' ' + n1(f * w * 0.3) + ' ' + n1(h * (0.52 - Math.abs(f) * 0.3)) + ' '; }
  o.e += n14_E(x + lean - w * 0.06, top + h * 0.12, w * 0.2, h * 0.07);
}
// a rounded broadleaf tree for the far shore
function n14_tree(o, x, y, h, rnd) { var pts = n14_blob(x, y - h * 0.55, h * 0.42, h * 0.42, rnd, 16, 0.08); o.c += n14_P(pts) + n14_C(x - h * 0.28, y - h * 0.32, h * 0.26) + n14_C(x + h * 0.3, y - h * 0.3, h * 0.24) + n14_limb(x, y + 1, x, y - h * 0.3, h * 0.04, h * 0.03, 0); o.e += n14_E(x - h * 0.1, y - h * 0.82, h * 0.18, h * 0.08); }
// the near-edge lotus plants the engine sways (and the still scene draws in place): each is a leaf, a bloom, a bud or a pod on its stalk
function n14_fePaint(o, e, open) {
  if (e.k === 'leaf') { o.a += n14_limb(e.bx, e.by, e.x, e.y + e.ry * 0.2, e.sw * 1.2, e.sw * 0.8, e.bend); return n14_lotusLeaf(o, e.x, e.y, e.rx, e.ry, e.ang, e.ph); }
  o.a += n14_limb(e.bx, e.by, e.x, e.y + e.r * 0.15, e.sw * 1.1, e.sw * 0.7, e.bend);
  if (e.k === 'pod') n14_pod(o, e.x, e.y, e.r); else n14_bloom(o, e.x, e.y, e.r, open);
  return '';
}
SCENES.lotus = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0.6), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, y;
  var hz = H * (ph ? 0.4 : 0.43), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#070D26 0%,#0F1940 ' + Math.round(p1 * 0.42) + '%,#1D2958 ' + Math.round(p1 * 0.8) + '%,#2E3C6C ' + p1 + '%,#2E3C6C 100%)'
    : 'linear-gradient(180deg,#86AFDA 0%,#B4C6E2 ' + Math.round(p1 * 0.4) + '%,#E9CFCF ' + Math.round(p1 * 0.78) + '%,#FADDBE ' + p1 + '%,#FADDBE 100%)';
  var water = dk ? 'linear-gradient(180deg,#2A3864 0%,#18234A 9%,#0E1834 40%,#091128 100%)' : 'linear-gradient(180deg,#F6DCC6 0%,#E2D6D8 8%,#BBCCDC 30%,#93B6CC 68%,#80A6C0 100%)';
  // sun low over the hills (or the moon), soft dawn streak clouds, stars at night
  var bx = dk ? W * (ph ? 0.3 : 0.27) : W * (ph ? 0.63 : 0.6), by = dk ? H * (ph ? 0.13 : 0.14) : hz - H * (ph ? 0.05 : 0.065), br = ph ? 17 : 26;
  if (dk) { add(far, 'a', n14_C(bx, by, br * 3), 'rgba(190,205,255,0.10)'); add(far, 'b', n14_C(bx, by, br), '#F4F0DE'); }
  else { add(far, 'a', n14_C(bx, by, br * 3.6) + n14_C(bx, by, br * 2.1), 'rgba(255,236,200,0.28)'); add(far, 'b', n14_C(bx, by, br), '#FFF6E2'); }
  var cl = '', cll = '';
  spread(0, H * 0.04, W, hz * 0.62, ph ? 190 : 320, ph ? 70 : 80, rnd, 0.9).forEach(function (c) { if (c.q > (dk ? 0.35 : 0.62) || Math.hypot(c.x - bx, c.y - by) < br * 3.4 + 40) return; var w = (ph ? 60 : 120) * (0.6 + c.r * 0.8), hh = w * 0.075;
    cl += n14_E(c.x, c.y, w, hh) + n14_E(c.x - w * 0.3, c.y - hh * 0.9, w * 0.5, hh * 1.1) + n14_E(c.x + w * 0.35, c.y - hh * 0.5, w * 0.4, hh * 0.9); cll += n14_E(c.x + w * 0.1, c.y + hh * 0.4, w * 0.75, hh * 0.45); });
  if (dk) { var st = ''; spread(0, 0, W, hz * 0.9, 26, 26, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - bx, c.y - by) > br * 3) st += n14_C(c.x, c.y, 0.45 + c.r * 1.05); }); add(far, 'c', st, 'rgba(250,246,236,0.85)'); add(far, 'd', cl, 'rgba(60,74,124,0.5)'); }
  else { add(far, 'c', cl, 'rgba(240,196,200,0.55)'); add(far, 'd', cll, 'rgba(255,232,214,0.85)'); }
  // soft rounded hills behind the lake, a pale far range and a nearer one, with mist lying in their folds
  var avoid = function (c) { return Math.abs(c - bx) < W * 0.08 && !dk ? 0.45 : 1; };
  var b1 = [], b2 = [], k;
  for (k = 0; k < (ph ? 4 : 7); k++) { var c1 = W * ((k + 0.3 + rnd() * 0.4) / (ph ? 4 : 7)); b1.push([c1, H * (0.07 + rnd() * 0.07) * avoid(c1) * (ph ? 0.85 : 1), W * (ph ? 0.14 : 0.08) * (0.8 + rnd() * 0.5)]); }
  for (k = 0; k < (ph ? 5 : 9); k++) { var c2 = W * ((k + 0.2 + rnd() * 0.6) / (ph ? 5 : 9)); b2.push([c2, H * (0.025 + rnd() * 0.035) * avoid(c2), W * (ph ? 0.1 : 0.06) * (0.7 + rnd() * 0.6)]); }
  var h1 = n14_hills(W, hz + 1, b1, 6), h2 = n14_hills(W, hz + 1, b2, 6);
  add(far, 'e', below(h1, hz + 4), dk ? '#262F5C' : '#C6BCD8');
  var ms1 = ''; for (i = 0; i < (ph ? 5 : 9); i++) { var mx = W * (i + 0.5) / (ph ? 5 : 9) + (rnd() - 0.5) * 60; ms1 += n14_E(mx, hz - H * (0.025 + rnd() * 0.02), W * (ph ? 0.3 : 0.16) * (0.8 + rnd() * 0.5), H * 0.012); }
  add(far, 'f', ms1, dk ? 'rgba(120,140,200,0.16)' : 'rgba(255,240,236,0.6)');
  add(far, 'g', below(h2, hz + 4), dk ? '#1E2852' : '#AAB1CB');
  add(far, 'h', n14_E(W * 0.3, hz - 2, W * 0.5, H * 0.01) + n14_E(W * 0.78, hz - 1, W * 0.45, H * 0.008), dk ? 'rgba(110,130,190,0.16)' : 'rgba(255,244,236,0.65)');
  // on the water: the hills' reflections, the sun's (or moon's) shimmering path and a scatter of soft glints
  var mir = function (pts, sq) { return n14_P(pts.map(function (p) { return [p[0], hz + (hz - p[1]) * sq]; }).concat([[W + 60, hz], [-60, hz]])); };
  add(refl, 'a', mir(h1, 0.75) + mir(h2, 0.85), dk ? 'rgba(40,52,100,0.45)' : 'rgba(178,168,200,0.35)');
  var path = '', gl = '';
  for (i = 0; i < 40; i++) { var gy = hz + 3 + i * i * (H - hz) / 1600 * 1.6, gw = (5 + i * 2.4) * (ph ? 0.7 : 1); if (gy > H) break; path += n14_E(bx + (rnd() - 0.5) * gw * 1.4, gy, gw * (0.4 + rnd() * 0.6), 0.9 + i * 0.05); }
  spread(0, hz + 6, W, H - hz, ph ? 90 : 140, ph ? 34 : 40, rnd, 1).forEach(function (c) { if (c.q < 0.45) { var u = (c.y - hz) / (H - hz), w = (6 + u * 36) * (0.6 + c.r * 0.8) * (ph ? 0.7 : 1); gl += n14_E(c.x, c.y, w, 0.5 + u * 1.1); } });
  add(refl, 'b', path + gl, dk ? 'rgba(220,226,255,0.32)' : 'rgba(255,246,228,0.6)');
  // the far shore: a low green strip with weeping willows and reeds (their reflections hang below)
  var shore = n14_fn(-60, W + 60, 8, function (x) { return hz - H * 0.006 - Math.max(0, Math.sin(x / 90 + 1)) * H * 0.006; }), wo = {c: '', e: '', s: ''}, wr = '';
  var nW = ph ? 3 : 6;
  for (i = 0; i < nW; i++) { var gx0 = W * (i + 0.15 + rnd() * 0.7) / nW, ng = 1 + Math.floor(rnd() * 3);
    for (var g2 = 0; g2 < ng; g2++) { x = gx0 + (g2 - (ng - 1) / 2) * H * 0.045 + (rnd() - 0.5) * 8; if (!dk && Math.abs(x - bx) < br * 1.2) continue; var wh = H * (ph ? 0.035 : 0.045) * (0.6 + rnd() * 0.7); if (rnd() < 0.3) n14_tree(wo, x, hz, wh * 0.8, rnd); else n14_willow(wo, x, hz, wh, rnd); wr += n14_RE(x, hz + wh * 0.36, wh * 0.4, wh * 0.34, 0); } }
  var reed = ''; for (x = -10; x < W + 10; x += (ph ? 30 : 46) * (0.5 + rnd())) { if (rnd() < 0.35) continue; var nr = 3 + Math.floor(rnd() * 5); for (var r2 = 0; r2 < nr; r2++) { var rh = H * 0.011 * (0.5 + rnd()), rx2 = x + (rnd() - 0.5) * 10; reed += 'M' + PT(rx2, hz + 1) + ' q' + n1((rnd() - 0.5) * 2) + ' ' + n1(-rh * 0.5) + ' ' + n1((rnd() - 0.5) * 5) + ' ' + n1(-rh) + ' '; } }
  add(refl, 'c', below(shore, hz + 2) + wo.c, dk ? '#16203C' : '#7E9A92');
  add(refl, 'd', wr, dk ? 'rgba(20,30,58,0.45)' : 'rgba(104,132,124,0.3)');
  add(refl, 'e', wo.e, dk ? '#1E2C4A' : '#98B2A2'); stk(refl, 's', wo.s + reed, dk ? 'rgba(70,92,120,0.55)' : 'rgba(146,176,150,0.7)', ph ? 0.6 : 0.8);
  // ---- the lotus field. Depth u runs 0 at the horizon to 1 at the bottom edge; size and viewing angle follow it.
  var Rmax = ph ? W * 0.27 : W * 0.135, yAt = function (u) { return hz + (H - hz) * u; };
  var tierOf = function (u) { return u < 0.14 ? 0 : u < 0.48 ? 1 : 2; };
  var occ = [[], [], []], items = [[], [], []];
  // near-edge plants (swayed by the engine): they take their room first
  var FE = ph ? [['leaf', 0.03, 0.93, 0.33, -6], ['bloom', 0.84, 0.64, 0.085], ['bud', 0.15, 0.7, 0.07], ['pod', 0.95, 0.75, 0.05], ['leaf', 1.02, 1.0, 0.26, 8]]
    : [['leaf', 0.04, 0.9, 0.16, -6], ['bloom', 0.18, 0.63, 0.045], ['bud', 0.09, 0.71, 0.032], ['bud', 0.86, 0.6, 0.036], ['pod', 0.925, 0.69, 0.024], ['leaf', 0.975, 0.93, 0.13, 7], ['bloom', 0.73, 0.76, 0.03]];
  var fe = FE.map(function (q, j) { var e = {k: q[0], x: W * q[1], y: H * q[2], bx: W * q[1] + (rnd() - 0.5) * W * 0.03, by: H + 12, ph: rnd() * 6.28, bend: (rnd() - 0.5) * 20 * S, sw: (ph ? 3.4 : 4.2) * S};
    if (e.k === 'leaf') { e.rx = W * q[3]; e.ry = e.rx * 0.36; e.ang = q[4]; e.box = [e.x - e.rx * 1.05, e.y - e.ry * 1.3, e.x + e.rx * 1.05, H]; }
    else { e.r = W * q[3]; e.open = e.k === 'bloom' && !dk ? 1 : 0; e.box = [e.x - e.r * 1.2, e.y - e.r * 1.7, e.x + e.r * 1.2, H]; }
    occ[2].push(e.box); occ[1].push([e.box[0], Math.max(e.box[1], yAt(0.5)), e.box[2], H]); return e; });
  // leaves may overlap a leaf behind them (the nearer disc sits lower, so its lit rim separates the two); stalks and flowers never cross
  var hit = function (a, b) { var i2, j3, F = a.yw >= b.yw ? a : b, B = F === a ? b : a, pad = 2 * S;
    for (i2 = 0; i2 < a.hard.length; i2++) { var ah = a.hard[i2]; if ((b.disc && n14_ovl(ah, b.disc, pad)) || (b.stalk && n14_ovl(ah, b.stalk, pad))) return true; for (j3 = 0; j3 < b.hard.length; j3++) if (n14_ovl(ah, b.hard[j3], pad)) return true; }
    for (i2 = 0; i2 < b.hard.length; i2++) { var bh = b.hard[i2]; if ((a.disc && n14_ovl(bh, a.disc, pad)) || (a.stalk && n14_ovl(bh, a.stalk, pad))) return true; }
    if (F.stalk && B.disc && n14_ovl(F.stalk, B.disc, pad)) return true;
    if (a.disc && b.disc && n14_ovl(a.disc, b.disc, pad) && !(F.y > B.y + (F.ry + B.ry) * 0.85 && F.yw > B.yw && !B.cov && Math.abs(F.x - B.x) > (F.rx + B.rx) * 0.3)) return true;
    return false; };
  var place = function (it, t) { for (var j = 0; j < items[t].length; j++) if (hit(it, items[t][j])) return false; for (j = 0; j < occ[t].length; j++) if (n14_ovl(it.box, occ[t][j], 4 * S)) return false;
    items[t].forEach(function (q) { if (q.disc && it.disc && n14_ovl(q.disc, it.disc, 2 * S)) { if (q.yw < it.yw) q.cov = 1; else it.cov = 1; } }); items[t].push(it); return true; };
  // the far field: dense small floating leaves and specks of pink, overlapping freely (refl layer, slightly soft)
  var ff = {b: '', c: '', t: ''}, pa = rnd() * 6.28, pb = rnd() * 6.28;
  var patch = function (x, u) { return Math.sin(x / W * 9 + pa + u * 14) + 0.7 * Math.sin(x / W * 21 + pb - u * 30) + 0.4 * Math.sin(x / W * 47 + pa * 2); };
  for (i = 0; i < (ph ? 1600 : 3600); i++) { var u0 = 0.01 + Math.pow(rnd(), 1.15) * 0.15, xr = -20 + rnd() * (W + 40);
    if (patch(xr, u0) < 0.1 + u0 * 4) continue;
    var rr = Rmax * (0.04 + u0 * 0.62) * (0.6 + rnd() * 0.6), yy = yAt(u0), ryr = rr * (0.18 + u0 * 0.55), hh = u0 > 0.06 && rnd() < 0.35 ? rr * 0.4 * rnd() : 0;
    ff.b += n14_E(xr, yy - hh + ryr * 0.32, rr, ryr); ff.c += n14_E(xr, yy - hh, rr * 0.96, ryr * 0.9);
    if (rnd() < 0.05) ff.t += n14_dot(xr + rr * 0.3, yy - hh - ryr - rr * 0.4); }
  add(refl, 'f', ff.b, dk ? '#152A32' : '#86A49A'); add(refl, 'g', ff.c, dk ? '#1E3A3C' : '#8EB294');
  add(refl, 'h', n14_E(W * 0.5, hz + (H - hz) * 0.035, W * 0.62, (H - hz) * 0.035), dk ? 'rgba(90,110,170,0.14)' : 'rgba(255,244,238,0.42)');
  stk(refl, 't', ff.t, dk ? 'rgba(160,110,150,0.6)' : '#EE94B4', (ph ? 2 : 2.8) * S + 0.4);
  // the middle and near fields: leaves on stalks at many heights, groups with blooms behind a leaf, and lone blooms, pods and buds
  var target = ph ? [[0, 14, 7], [0, 8, 4]] : [[0, 26, 11], [0, 13, 6]], tries = 0, cnt = [[0, 0, 0], [0, 0, 0]];
  for (var phs = 0; phs < 2; phs++) { tries = 0;
  while ((cnt[phs][1] < target[phs][1] || cnt[phs][2] < target[phs][2]) && tries++ < 5000) {
    var u = 0.14 + Math.pow(rnd(), 0.85) * 0.92, t = tierOf(u); if (cnt[phs][t] >= target[phs][t]) continue;
    var xw = -W * 0.04 + rnd() * W * 1.08, yw = yAt(u), R = Rmax * (0.2 + u * 0.8) * (0.55 + rnd() * 0.6), it = {u: u, xw: xw, yw: yw, ph: rnd() * 6.28, hard: []}, ws0 = (0.5 + u * 0.9) * (ph ? 2.4 : 3) * S + 3;
    if (phs === 0) { var tall = rnd(); it.k = 'leaf'; it.rx = R; it.ry = R * (0.2 + u * 0.24); it.h = tall < 0.22 ? 0 : R * (0.25 + tall * tall * 1.6) * Math.min(1, u * 2.6); it.ang = (rnd() - 0.5) * 24; it.ry *= 0.85 + rnd() * 0.3; it.x = xw + (rnd() - 0.5) * R * 0.2; it.y = yw - it.h;
      if (it.h > 0 && rnd() < 0.35) { it.fl = []; var nb = rnd() < 0.6 ? 1 : 2; for (var j2 = 0; j2 < nb; j2++) { var fr = R * (0.3 + rnd() * 0.1), fx = it.x + (j2 ? 1 : -1) * R * (0.25 + rnd() * 0.35) * (nb === 1 && rnd() < 0.5 ? -1 : 1), fy = it.y - it.ry * 1.1 - fr * (0.9 + rnd() * 1.2), rk = rnd(); it.fl.push({x: fx, y: fy, r: fr, k: rk < 0.55 ? 'bloom' : rk < 0.82 ? 'bud' : 'pod', open: rk < 0.3 ? 1 : 0.55 + rnd() * 0.35, bw: yw - it.ry * 0.5}); it.hard.push([fx - fr * 1.15, fy - fr * 1.7, fx + fr * 1.15, it.y - it.ry * 0.8]); } }
      it.disc = [it.x - it.rx * 1.04, it.y - it.ry * 1.08, it.x + it.rx * 1.04, it.y + it.ry * 1.26]; it.stalk = it.h > 0 ? [xw - ws0, it.y + it.ry, xw + ws0, yw + 2] : null;
      var top = it.y - it.ry * 1.25; (it.fl || []).forEach(function (f) { top = Math.min(top, f.y - f.r * 1.7); }); it.box = [it.x - it.rx * 1.06, top, it.x + it.rx * 1.06, yw + it.ry * 0.3]; }
    else { var fr2 = R * 0.3, rk2 = rnd(); it.k = rk2 < 0.5 ? 'bloom' : rk2 < 0.78 ? 'bud' : 'pod'; it.r = fr2; it.open = rk2 < 0.32 ? 1 : 0.6; it.x = xw + (rnd() - 0.5) * fr2; it.y = yw - fr2 * (1.6 + rnd() * 2.4); it.box = [it.x - fr2 * 1.15, it.y - fr2 * 1.7, it.x + fr2 * 1.15, yw + 3]; it.hard.push(it.box); }
    if (place(it, t)) cnt[phs][t]++; } }
  // paint mid and near (back to front within each); water-surface bits (reflections and the rings round each stalk) go on the refl layer
  var rf = '', rings = '', PAL = dk ? [['#16302F', '#284A4E', '#1A383A', '#2E5456', 'rgba(110,150,160,0.32)'], ['#17302F', '#2A4C50', '#1C3C3E', '#3A6264', 'rgba(130,170,176,0.38)']]
    : [['#5E8A56', '#A2BEA0', '#6EA36E', '#8EC084', 'rgba(170,214,160,0.9)'], ['#4D7E45', '#97B892', '#559A5A', '#7EB872', 'rgba(150,204,138,0.95)']];
  var FLW = dk ? ['#6E4E6C', '#857C52', '#8C6C86', '#A05878', '#3A3A22'] : ['#EE97B8', '#F0CA4E', '#FBE0E8', '#E8719C', '#5A5A2E'];
  [1, 2].forEach(function (t) { var L = t === 1 ? mid : near, o = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''}, P = PAL[t - 1], fbox = [];
    items[t].sort(function (p, q) { return p.yw - q.yw; });
    items[t].forEach(function (it) { (it.fl || []).forEach(function (f) { fbox.push([f.x - f.r * 1.15, f.y - f.r * 1.6, f.x + f.r * 1.15, f.y + f.r * 0.4]); }); if (it.k !== 'leaf') fbox.push([it.x - it.r * 1.15, it.y - it.r * 1.6, it.x + it.r * 1.15, it.y + it.r * 0.4]); });
    var sw = (ph ? 2.4 : 3) * S;
    items[t].forEach(function (it) {
      var ws = (0.5 + it.u * 0.9) * sw;
      if (it.k === 'leaf') {
        (it.fl || []).forEach(function (f) { o.a += n14_limb(f.x, f.y + f.r * 0.1, f.x + (it.xw - f.x) * 0.15, f.bw, ws * 0.45, ws * 0.6, (rnd() - 0.5) * f.r * 0.3); if (f.k === 'pod') n14_pod(o, f.x, f.y, f.r); else n14_bloom(o, f.x, f.y, f.r, dk ? 0 : f.k === 'bud' ? 0 : f.open); rf += n14_RE(f.x, f.bw + (f.bw - f.y) * 0.7, f.r * 0.5, (f.bw - f.y) * 0.5, 0); });
        if (it.h > 0) { o.a += n14_limb(it.x, it.y + it.ry * 0.25, it.xw, it.yw, ws * 0.55, ws * 0.7, (rnd() - 0.5) * it.rx * 0.12); rings += n14_E(it.xw, it.yw, ws * 3 + it.rx * 0.08, ws + it.ry * 0.06); }
        var v = n14_lotusLeaf(o, it.x, it.y, it.rx, it.ry, it.ang, it.ph);
        // veins never cross a flower head
        var fronts = items[t].filter(function (q) { return q !== it && q.k === 'leaf' && q.yw > it.yw && n14_ovl(q.disc, it.disc, 0); });
        var inF = function (px, py) { for (var j = 0; j < fronts.length; j++) { var q = fronts[j], dx = (px - q.x) / (q.rx * 1.06), dy = (py - q.y) / (q.ry * 1.1); if (dx * dx + dy * dy < 1) return true; } return false; };
        v.split('M').forEach(function (seg) { if (!seg) return; var nums = seg.match(/-?[\d.]+/g).map(Number), ex = nums[4], ey = nums[5]; for (var j = 0; j < fbox.length; j++) { var fb = fbox[j]; if (ex > fb[0] && ex < fb[2] && ey > fb[1] && ey < fb[3]) return; } if (inF(ex, ey) || inF(nums[2], nums[3]) || inF((nums[0] + ex) / 2, (nums[1] + ey) / 2)) return; o.s += 'M' + seg; });
        rf += n14_E(it.x, it.yw + it.h * 0.9 + it.ry * 0.5, it.rx * 0.9, it.ry * 0.5) + (it.h > 0 ? n14_limb(it.xw, it.yw, it.xw, it.yw + it.h * 0.9, ws * 0.6, ws * 0.5, 0) : '');
      } else {
        o.a += n14_limb(it.x, it.y + it.r * 0.12, it.xw, it.yw, ws * 0.45, ws * 0.62, (rnd() - 0.5) * it.r * 0.6);
        if (it.k === 'pod') n14_pod(o, it.x, it.y, it.r); else n14_bloom(o, it.x, it.y, it.r, dk ? 0 : it.k === 'bud' ? 0 : it.open);
        rings += n14_E(it.xw, it.yw, ws * 3, ws); rf += n14_limb(it.xw, it.yw, it.xw, it.yw + (it.yw - it.y) * 0.85, ws * 0.5, ws * 0.4, 0) + n14_RE(it.x, it.yw + (it.yw - it.y) * 0.9, it.r * 0.5, it.r * 0.8, 0);
      } });
    if (t === 2 && !ANIM) fe.forEach(function (e) { o.s += n14_fePaint(o, e, e.open); });
    add(L, 'a', o.a, P[0]); add(L, 'b', o.b, P[1]); add(L, 'c', o.c, P[2]); add(L, 'd', o.d, P[3]);
    add(L, 'e', o.e, FLW[0]); add(L, 'f', o.f, FLW[1]); add(L, 'g', o.g, FLW[2]); add(L, 'h', o.h, FLW[3]);
    stk(L, 's', o.s, P[4], (t === 1 ? 0.8 : 1.1) * S + 0.3); stk(L, 't', o.t, FLW[4], (t === 1 ? 2 : 3) * S + 0.6);
  });
  add(refl, 'd', rf, dk ? 'rgba(6,14,24,0.34)' : 'rgba(70,112,104,0.16)');
  stk(refl, 's', rings, dk ? 'rgba(140,160,210,0.45)' : 'rgba(255,255,255,0.7)');
  // open water for the engine's ripples (not under the far or middle leaves)
  if (ANIM) {
    var spots = []; for (i = 0; i < 600 && spots.length < (ph ? 30 : 60); i++) { var sx = rnd() * W, su = 0.08 + rnd() * 0.9, sy = yAt(su), ok = true, bb = [sx - 30, sy - 8, sx + 30, sy + 8];
      for (var q = 0; q < 2 && ok; q++) occ[q + 1].forEach(function (b) { if (n14_ovl(bb, b, 0)) ok = false; }); if (ok) spots.push([sx, sy, su]); }
    var drips = items[1].concat(items[2]).filter(function (it) { return it.k === 'leaf' && it.h > it.ry * 1.6; }).map(function (it) { return [it.x + (rnd() - 0.5) * it.rx * 0.8, it.y + it.ry * 0.95, it.yw + it.ry * 0.85, it.u]; });
    ANIM.hz = hz; ANIM.S = S; ANIM.sun = [bx, by, br]; ANIM.fe = fe; ANIM.spots = spots; ANIM.drips = drips; ANIM.yAt = [hz, H - hz]; ANIM.rmax = Rmax;
    ANIM.pal = {leaf: PAL[1], flw: FLW};
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: water}};
};
