// ---- batch n14: lotus (Lotus Lake), seastacks (Sea Stacks)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n14_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n14_P(pts) { return pts.length > 2 ? poly(n14_cw(pts)) : ''; }
function n14_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n14_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n14_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n14_P(rotp(p, x, y, ang)); }
function n14_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
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

// =============== 2. Sea Stacks: golden limestone stacks and an arch rising from a turquoise sea below tall receding cliffs, surf
// foaming round their feet, a green clifftop with wildflowers in front. Late afternoon sun; at night stars over dark silhouettes.
// one stack (or one leg of the arch): returns its outline points; adds the body (a), the sunlit right face (b), strata bands and the
// dark wave-cut notch (c), cracks (s), a scrub cap (d, e) unless noCap, and a foam crescent at its foot (g)
function n14_stack(o, x, yb, w, h, rnd, noCap) { var L = [], R = [], Sx = [], n = 20, i, k, pa = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], lean = (rnd() - 0.5) * w * 0.25, slope = (rnd() - 0.5) * 0.12, tp = 0.22 + rnd() * 0.14;
  var edge = function (t, sg) { var p0 = sg < 0 ? pa[0] : pa[2], p1 = sg < 0 ? pa[1] : pa[3], v = (1 - tp * t) * (1 + 0.09 * Math.sin(t * 5.5 + p0) + 0.05 * Math.sin(t * 13 + p1));
    if (t < 0.14) v *= 1.06 + (0.14 - t) * 0.6; if (t < 0.045) v *= 0.84 + t * 3.2; return v; };
  var topY = function (sg) { return yb - h * (1 + slope * sg); };
  for (i = 0; i <= n; i++) { var t = i / n, y = yb - t * h, sh = lean * t; L.push([x + sh - w / 2 * edge(t, -1), y + (t === 1 ? (topY(-1) - (yb - h)) : 0)]); R.push([x + sh + w / 2 * edge(t, 1), y + (t === 1 ? (topY(1) - (yb - h)) : 0)]);
    Sx.push([x + sh + w * (0.06 + 0.07 * Math.sin(t * 4 + pa[1]) + 0.03 * Math.sin(t * 11 + pa[2])), y]); }
  // rounded shoulders and a gently domed top
  var top = []; if (!noCap) for (i = 1; i < 12; i++) { var u = i / 12, px = R[n][0] + (L[n][0] - R[n][0]) * u; top.push([px, R[n][1] + (L[n][1] - R[n][1]) * u - Math.pow(Math.sin(Math.PI * u), 0.5) * w * 0.07]); }
  R[n - 1][0] -= w * 0.03; L[n - 1][0] += w * 0.03;
  var body = R.concat(top, L.slice().reverse()); o.a += n14_P(body);
  var lt = Sx.slice(0, n); lt.push([Sx[n][0], (R[n][1] + L[n][1]) / 2 - w * 0.05]); o.b += n14_P(lt.concat(top.filter(function (q) { return q[0] > Sx[n][0]; }).reverse(), R.slice().reverse()));
  // strata: fine, broken lines across the face (sagging a little), unevenly spaced
  var f = 0.1 + rnd() * 0.08; while (f < (noCap ? 0.95 : 0.86)) { var j = Math.round(f * n), y0 = yb - f * h, xl = L[j][0], xr = R[j][0], run = [];
    for (k = 0; k <= 10; k++) { var v = k / 10, on = Math.sin(v * 9 + f * 40) > -0.55; if (on) run.push([xl + (xr - xl) * v, y0 + Math.sin(Math.PI * v) * w * 0.03]); else { if (run.length > 1) o.s += pline(run); run = []; } }
    if (run.length > 1) o.s += pline(run); f += 0.07 + rnd() * 0.12; }
  var nb = []; for (i = 0; i <= 1; i++) nb.push(R[i]); nb.push([x + w * 0.2, yb - h * 0.065]); nb.push([x - w * 0.2, yb - h * 0.06]); for (i = 1; i >= 0; i--) nb.push(L[i]); o.c += n14_P(nb);
  for (i = 0; i < 3; i++) { var cx = x + (rnd() - 0.5) * w * 0.6, t0 = 0.12 + rnd() * 0.5; o.s += 'M' + PT(cx + lean * t0, yb - t0 * h) + ' l' + n1((rnd() - 0.5) * w * 0.06) + ' ' + n1(-h * (0.06 + rnd() * 0.14)) + ' '; }
  if (!noCap) { var cap = [];
    for (i = 0; i <= 14; i++) { var u2 = i / 14, b0 = i === 0 ? R[n - 1] : i === 14 ? L[n - 1] : null, px2 = R[n][0] + (L[n][0] - R[n][0]) * u2, py2 = R[n][1] + (L[n][1] - R[n][1]) * u2 - Math.pow(Math.sin(Math.PI * u2), 0.5) * w * 0.07;
      cap.push(b0 ? [b0[0] + (i ? -1 : 1), b0[1] + 1] : [px2, py2 - (i % 2 ? w * 0.05 : w * 0.015) - 1]); }
    for (i = 8; i >= 0; i--) { var u3 = i / 8; cap.push([L[n - 1][0] + (R[n - 1][0] - L[n - 1][0]) * u3, R[n - 1][1] + (L[n - 1][1] - R[n - 1][1]) * u3 + (i % 2 ? h * 0.03 : h * 0.01)]); }
    o.d += n14_P(cap); o.e += n14_P(cap.slice(0, 7).concat([[(R[n][0] + L[n][0]) / 2 + w * 0.05, (R[n][1] + L[n][1]) / 2 - w * 0.02]])); }
  // foam crescent round the foot
  var fm = [], fw = w * 0.6; for (i = 0; i <= 18; i++) { var a = i / 18 * Math.PI; fm.push([x + Math.cos(a) * fw * (1 + (i % 2 ? 0.05 : 0)), yb - w * 0.02 + Math.sin(a) * w * 0.09 * (1 + (i % 2 ? 0.3 : 0))]); }
  for (i = 18; i >= 0; i--) { var a2 = i / 18 * Math.PI; fm.push([x + Math.cos(a2) * fw * 0.75, yb - w * 0.04 + Math.sin(a2) * w * 0.03]); }
  o.g += n14_P(fm);
  return body; }
// the sea arch: two legs joined by a bridge with a scrub cap; the opening shows the sea behind
function n14_arch(o, x, yb, w, h, rnd) { var b1 = n14_stack(o, x - w * 0.33, yb, w * 0.34, h * 0.66, rnd, true), b2 = n14_stack(o, x + w * 0.31, yb, w * 0.4, h * 0.68, rnd, true), i;
  var top = [], und = [], y1 = yb - h * 0.56;
  for (i = 0; i <= 12; i++) { var u = i / 12; top.push([x + w * 0.52 - u * w * 1.02, yb - h * (0.97 + Math.sin(Math.PI * u) * 0.04) + (i % 3 === 1 ? h * 0.01 : 0)]); }
  for (i = 0; i <= 12; i++) { var v = i / 12, ux = x - w * 0.18 + v * w * 0.34; und.push([ux, y1 - Math.sin(Math.PI * v) * h * 0.2]); }
  var br = [[x + w * 0.52, y1 + h * 0.06]].concat(top, [[x - w * 0.5, y1 + h * 0.06]], und); o.a += n14_P(br);
  o.b += n14_P([[x + w * 0.52, y1 + h * 0.06], [x + w * 0.52, yb - h * 0.97], [x + w * 0.08, yb - h * 1.01], [x + w * 0.1, y1 - h * 0.15], [x + w * 0.16, y1]]);
  for (var f = 0.84; f < 0.95; f += 0.05) { var y0 = yb - f * h, th = Math.max(0.8, h * 0.01); o.c += n14_P([[x - w * 0.48, y0], [x + w * 0.5, y0], [x + w * 0.5, y0 + th], [x - w * 0.48, y0 + th]]); }
  var cap = []; for (i = 0; i <= 14; i++) { var u2 = i / 14; cap.push([x + w * 0.53 - u2 * w * 1.05, yb - h * (1.0 + Math.sin(Math.PI * u2) * 0.05) - (i % 2 ? h * 0.025 : 0)]); }
  for (i = 7; i >= 0; i--) { var u3 = i / 7; cap.push([x - w * 0.5 + u3 * w * 1.02, yb - h * (0.93 + (i % 2 ? 0.02 : 0))]); }
  o.d += n14_P(cap); o.e += n14_P(cap.slice(0, 7).concat([[x + w * 0.05, yb - h * 0.95]]));
  return [b1, b2, br]; }
SCENES.seastacks = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, k;
  var hz = H * (ph ? 0.38 : 0.4), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#040A1E 0%,#0A1636 ' + Math.round(p1 * 0.45) + '%,#15284E ' + Math.round(p1 * 0.85) + '%,#22365E ' + p1 + '%,#22365E 100%)'
    : 'linear-gradient(180deg,#5896D2 0%,#8CBEE4 ' + Math.round(p1 * 0.4) + '%,#E6DCBC ' + Math.round(p1 * 0.8) + '%,#F6C68E ' + p1 + '%,#F6C68E 100%)';
  var sea = dk ? 'linear-gradient(180deg,#22385E 0%,#132648 8%,#0B1B36 45%,#07142A 100%)' : 'linear-gradient(180deg,#8CB8CC 0%,#3C92BA 7%,#2399B4 32%,#2AB0B6 66%,#3DC0B8 100%)';
  var sx = W * (ph ? 0.8 : 0.83), sy = hz - H * (ph ? 0.08 : 0.1), sr = ph ? 19 : 29;
  // sky: the low sun and its glow with gold-edged clouds, or stars, a faint Milky Way and a crescent moon
  if (dk) { var st = '', mwy = function (x) { return hz * (0.15 + 0.7 * x / W); }, mX = sx, mY = H * 0.14, mR = ph ? 13 : 18;
    spread(0, 0, W, hz, 22, 22, rnd, 1).forEach(function (c) { if (c.q < 0.45 && Math.hypot(c.x - mX, c.y - mY) > mR * 3) st += n14_C(c.x, c.y, 0.4 + c.r * 1.05); });
    for (i = 0; i < (ph ? 140 : 360); i++) { var mx = rnd() * W, my = mwy(mx) + (rnd() + rnd() - 1) * H * 0.07; if (my < hz - 8 && Math.hypot(mx - mX, my - mY) > mR * 3) st += n14_C(mx, my, 0.3 + rnd() * 0.6); }
    var mw = ''; for (i = 0; i <= 40; i++) { var cx0 = W * i / 40 + (rnd() - 0.5) * 30; mw += n14_RE(cx0, mwy(cx0) + (rnd() - 0.5) * H * 0.04, W * (0.04 + rnd() * 0.05), H * (0.025 + rnd() * 0.035), Math.atan2(hz * 0.7, W) * 180 / Math.PI + (rnd() - 0.5) * 10); }
    add(far, 'a', mw, 'rgba(140,160,255,0.045)'); add(far, 'c', st, 'rgba(240,244,255,0.85)');
    add(far, 'b', n14_C(mX, mY, mR * 3), 'rgba(200,215,255,0.08)');
    add(far, 'd', 'M' + PT(mX, mY - mR) + ' A' + n1(mR) + ' ' + n1(mR) + ' 0 1 1 ' + PT(mX, mY + mR) + ' A' + n1(mR * 0.6) + ' ' + n1(mR) + ' 0 1 0 ' + PT(mX, mY - mR) + ' Z ', '#FFF4D6'); sx = mX; sy = mY; sr = mR; }
  else { add(far, 'a', n14_C(sx, sy, sr * 4.2) + n14_C(sx, sy, sr * 3.3) + n14_C(sx, sy, sr * 2.5), 'rgba(255,222,166,0.12)'); add(far, 'b', n14_C(sx, sy, sr * 1.8) + n14_C(sx, sy, sr * 1.35), 'rgba(255,240,204,0.3)'); add(far, 'd', n14_C(sx, sy, sr), '#FFF4D8');
    var cb = '', cl = '';
    (ph ? [[0.25, 0.12, 120], [0.55, 0.22, 90]] : [[0.18, 0.12, 200], [0.48, 0.08, 150], [0.62, 0.23, 120], [0.34, 0.27, 90]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], w = q[2] * (ph ? 1 : S);
      for (k = 0; k < 7; k++) { var u = k / 6 - 0.5, r = w * (0.16 + 0.12 * Math.cos(u * Math.PI)) * (0.85 + rnd() * 0.3); cb += n14_C(cx + u * w * 0.9, cy - r * 0.5, r); cl += n14_C(cx + u * w * 0.9 + r * 0.18, cy - r * 0.62, r * 0.82); }
      cb += n14_E(cx, cy, w * 0.62, w * 0.07); });
    add(far, 'c', cb, 'rgba(232,214,222,0.95)'); add(far, 'e', cl, 'rgba(255,240,222,0.95)');
    var strk = ''; spread(0, H * 0.03, W, hz * 0.55, ph ? 200 : 340, 80, rnd, 0.9).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - sx, c.y - sy) > 120) { var w = (ph ? 50 : 90) * (0.6 + c.r * 0.8); strk += n14_E(c.x, c.y, w, w * 0.05) + n14_E(c.x + w * 0.4, c.y - w * 0.04, w * 0.5, w * 0.04); } });
    add(far, 'f', strk, 'rgba(255,236,214,0.55)'); }
  // the coast beyond the cliffs, fading into the haze on the horizon
  var xFar = W * (ph ? 0.47 : 0.41), dist = ''; [[0.0, 0.5, 0.014], [0.05, 0.28, 0.022]].forEach(function (q) { var p = []; for (k = 0; k <= 20; k++) { var u = k / 20, xx = xFar - W * q[1] * (1 - u) + W * q[0]; p.push([xx, hz + 1 - H * q[2] * Math.pow(Math.sin(Math.PI * (0.15 + u * 0.7)), 1.2) * (1 + 0.15 * Math.sin(u * 13))]); } dist += n14_P(p.concat([[p[p.length - 1][0], hz + 1], [p[0][0], hz + 1]])); });
  add(far, 'g', dist, dk ? '#1A2846' : '#C4AFA0');
  add(far, 'h', n14_E(W * 0.45, hz, W * 0.6, H * 0.012), dk ? 'rgba(80,100,150,0.16)' : 'rgba(255,230,200,0.5)');
  // on the water: the sun's glitter path, swell crests, and the stacks' long shadows
  var gl = ''; for (i = 0; i < 46; i++) { var gy = hz + 2 + i * i * (H - hz) / 2100 * 1.6, gw = (4 + i * 2.2) * (ph ? 0.7 : 1); if (gy > H) break; gl += n14_E(sx + (rnd() - 0.5) * gw * 1.6, gy, gw * (0.35 + rnd() * 0.6), 0.8 + i * 0.05); }
  add(refl, 'a', gl, dk ? 'rgba(220,228,255,0.35)' : 'rgba(255,236,190,0.75)');
  var sw = ''; spread(0, hz + 4, W, H - hz, ph ? 70 : 110, ph ? 18 : 22, rnd, 1).forEach(function (c) { if (c.q < 0.55) { var u = (c.y - hz) / (H - hz), w = (5 + u * 46) * (0.6 + c.r * 0.8) * (ph ? 0.75 : 1); sw += n14_P([[c.x - w, c.y], [c.x, c.y - (0.6 + u * 2.4) * S], [c.x + w, c.y], [c.x, c.y + 0.5]]); } });
  add(refl, 'b', sw, dk ? 'rgba(140,170,220,0.2)' : 'rgba(220,252,250,0.4)');
  // ---- the cliffs: one long wall receding from the near left to far off, its headlands lit gold where they face the sun
  var y0 = H * (ph ? 0.82 : 0.8), x0 = -W * 0.05, Hc = H * (ph ? 0.46 : 0.5), nU = 44, base = [], topL = [];
  var jag = function (u) { return Math.sin(u * 23 + 1.3) * 0.6 + Math.sin(u * 41) * 0.25; };
  for (i = 0; i <= nU; i++) { var u = i / nU, d = 1 - u, yy = hz + 1 + (y0 - hz) * Math.pow(d, 1.7), xx = xFar + (x0 - xFar) * Math.pow(d, 1.25), hg = Hc * Math.pow(d, 1.6) + H * 0.006, j = jag(u) * W * 0.022 * Math.pow(d, 1.2);
    base.push([xx + j, yy, hg, u]); topL.push([xx + j * 0.7 - hg * 0.04, yy - hg]); }
  var mo = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''}, wall = topL.concat(base.slice().reverse().map(function (p) { return [p[0], p[1]]; }), [[-80, y0 + 40], [-80, topL[0][1]]]);
  mo.a += n14_P(wall); var mask = n14_P(wall), lit = '';
  for (i = 0; i < nU; i++) { var p = base[i], q = base[i + 1]; if (q[0] - p[0] < (xFar - x0) / nU * 0.9) { var face = n14_P([topL[i], topL[i + 1], [q[0], q[1]], [p[0], p[1]]]); mo.b += face; lit += face; } }
  // strata lines along the wall (converging with it), the wave-cut notch at its foot, cracks
  [0.11, 0.2, 0.33, 0.41, 0.55, 0.63, 0.74, 0.85].forEach(function (f, j) { var run = [];
    for (i = 0; i <= nU; i++) { var b = base[i], yy2 = b[1] - b[2] * (f + 0.012 * Math.sin(i * 0.9 + j)), xx2 = b[0] + (topL[i][0] - b[0]) * f, on = Math.sin(i * 0.7 + j * 2.1) > -0.6 && i < nU * 0.72;
      if (on) run.push([xx2, yy2]); else { if (run.length > 1) mo.s += pline(run); run = []; } }
    if (run.length > 1) mo.s += pline(run); });
  var notch = []; for (i = 0; i <= nU; i++) notch.push([base[i][0], base[i][1] - base[i][2] * 0.07]); mo.c += n14_P(notch.concat(base.slice().reverse().map(function (p) { return [p[0], p[1]]; })));
  for (i = 2; i < nU - 8; i += 2) { var b2 = base[i]; if (rnd() < 0.6) mo.s += 'M' + PT(b2[0] + (rnd() - 0.3) * 8 * S, b2[1] - b2[2] * (0.15 + rnd() * 0.2)) + ' l' + n1((rnd() - 0.5) * 3) + ' ' + n1(-b2[2] * (0.15 + rnd() * 0.35)) + ' '; }
  // the green clifftop, with a lit edge
  var capT = [], capB = []; for (i = 0; i <= nU; i++) { var tp = topL[i], hg2 = base[i][2]; capT.push([tp[0], tp[1] - hg2 * 0.025 - (i % 2 ? hg2 * 0.012 : 0)]); capB.unshift([tp[0] + hg2 * 0.01, tp[1] + hg2 * (0.07 + 0.03 * Math.sin(i * 1.7))]); }
  mo.d += n14_P(capT.concat(capB, [[-80, capB[capB.length - 1][1]], [-80, capT[0][1] - 4]]));
  var capL = []; for (i = 0; i <= nU; i++) { var tp2 = topL[i]; capL.push([tp2[0], tp2[1] - base[i][2] * 0.02]); } mo.e += n14_P(capL.concat(capL.slice().reverse().map(function (p, j) { return [p[0], p[1] + base[nU - j][2] * 0.022 + 0.6]; })));
  // a little beach in the bay at mid distance, with surf along it
  var bu0 = Math.round(nU * 0.3), bu1 = Math.round(nU * 0.46), sand = [], edge = [];
  var bwMax = base[Math.round((bu0 + bu1) / 2)][2] * 0.16; for (i = bu0; i <= bu1; i++) { var bb = base[i], bw = Math.pow(Math.sin(Math.PI * (i - bu0) / (bu1 - bu0)), 1.5) * bwMax; sand.push([bb[0] - 1, bb[1] - 1]); edge.unshift([bb[0] + bw * 0.9, bb[1] + bw * 0.4]); }
  mo.f += n14_P(sand.concat(edge)); var beach = edge.slice().reverse(), beachP = beach.map(function (e2, j) { return [e2[0], e2[1], sand[j][0], sand[j][1]]; });
  // foam along the foot of the cliffs (lacy, broken)
  var surf = []; for (i = 0; i <= nU; i++) { var bf = base[i]; if (i >= bu0 && i <= bu1) continue; surf.push([bf[0], bf[1], bf[2]]); }
  surf.forEach(function (p, j) { var r = Math.max(0.8, p[2] * 0.02); mo.g += n14_E(p[0] + r * 0.8, p[1] + r * 0.1, r * 2.6, r * 0.42); if (j % 3 === 0) mo.g += n14_E(p[0] + r * 3.4, p[1] + r * 0.9, r * 1.6, r * 0.3); });
  mo.t += pline(beach.map(function (p) { return [p[0] + 1.5, p[1] + 0.8]; }));
  // ---- the stacks and the arch
  var ST = ph ? [['s', 0.67, 0.65, 0.33, 0.17], ['s', 0.49, 0.535, 0.19, 0.09], ['a', 0.37, 0.475, 0.085, 0.13], ['s', 0.58, 0.44, 0.045, 0.035], ['s', 0.93, 0.6, 0.2, 0.11]]
    : [['s', 0.62, 0.7, 0.4, 0.085], ['s', 0.505, 0.585, 0.26, 0.048], ['a', 0.4, 0.5, 0.135, 0.075], ['s', 0.32, 0.455, 0.07, 0.024], ['s', 0.47, 0.435, 0.045, 0.016], ['s', 0.96, 0.66, 0.25, 0.07]];
  var stacks = [], shad = '', hz2 = '';
  ST.forEach(function (q) { var X = W * q[1], Y = H * q[2], h = H * q[3], w = W * q[4], u = (Y - hz) / (H - hz);
    var bodies = q[0] === 'a' ? n14_arch(mo, X, Y, w, h, rnd) : [n14_stack(mo, X, Y, w, h, rnd)];
    bodies.forEach(function (b) { mask += n14_P(b); if (u < 0.25) hz2 += n14_P(b); });
    lit += n14_P([[X + w * 0.05, Y], [X + w * 0.05, Y - h], [X + w * 0.6, Y - h], [X + w * 0.6, Y]]);
    var L2 = h * 0.45; shad += n14_P([[X - w * 0.45, Y], [X + w * 0.4, Y], [X - w * 0.1 - L2 * 0.5, Y + L2 * 0.2], [X - w * 0.6 - L2 * 0.6, Y + L2 * 0.16]]);
    stacks.push([X, Y, w, h, u]); });
  add(refl, 'c', shad, dk ? 'rgba(2,8,20,0.3)' : 'rgba(10,70,90,0.22)');
  // haze over the far part of the wall and the far stacks
  [0.55, 0.78].forEach(function (f0) { var fw = []; for (i = Math.round(nU * f0); i <= nU; i++) fw.push(topL[i]); for (i = nU; i >= Math.round(nU * f0); i--) fw.push([base[i][0], base[i][1] + 1]); hz2 += n14_P(fw); });
  var C = dk ? ['#121C36', '#1C2A4C', '#0C1428', '#14243A', '#1E3248', '#202A44', 'rgba(170,196,240,0.6)', 'rgba(34,54,94,0.35)', 'rgba(6,10,22,0.5)', 'rgba(180,205,245,0.55)']
    : ['#B87A48', '#ECB86C', '#9A6238', '#6E9A44', '#94BE58', '#EED8A8', '#FFFFFF', 'rgba(246,214,180,0.3)', 'rgba(90,50,30,0.4)', 'rgba(255,255,255,0.85)'];
  add(mid, 'a', mo.a, C[0]); add(mid, 'b', mo.b, C[1]); add(mid, 'c', mo.c, C[2]); add(mid, 'd', mo.d, C[3]); add(mid, 'e', mo.e, C[4]); add(mid, 'f', mo.f, C[5]); add(mid, 'g', mo.g, C[6]); add(mid, 'h', hz2, C[7]);
  stk(mid, 's', mo.s, C[8], 1.2 * S + 0.3); stk(mid, 't', mo.t, C[9], 2 * S + 0.6);
  // ---- the clifftop in front: grass falling away to the right, heath bushes, a limestone outcrop and wildflowers
  var gTop = function (x) { return H * (ph ? 0.8 : 0.76) + (x / W) * H * (ph ? 0.07 : 0.1) + Math.sin(x / 120 + 1) * 6 * S + Math.sin(x / 37) * 2; };
  var ground = n14_fn(-60, W + 60, 6, gTop), no = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''};
  no.a += below(ground, H + 40);
  no.b += n14_P(ground.concat(ground.slice().reverse().map(function (p) { return [p[0], p[1] + (6 + 4 * Math.sin(p[0] / 50)) * S + 3]; })));
  for (x = -20; x < W + 20; x += (ph ? 5 : 7)) { var gy2 = n14_yOn(ground, x); no.s += 'M' + PT(x, gy2 + 3) + ' l' + n1((rnd() - 0.5) * 6) + ' ' + n1(-(3 + rnd() * 7) * S - 2) + ' '; }
  (ph ? [[0.06, 0.07], [0.9, 0.06]] : [[0.05, 0.075], [0.22, 0.05], [0.8, 0.06], [0.93, 0.05]]).forEach(function (q) { var bxx = W * q[0], byy = n14_yOn(ground, bxx) + H * 0.035, br = H * q[1];
    for (k = 0; k < 7; k++) { var a = Math.PI * (1.05 + k / 6 * 0.9), rr = br * (0.5 + rnd() * 0.25); no.c += n14_C(bxx + Math.cos(a) * br * 0.9, byy + Math.sin(a) * br * 0.55, rr); if (k > 1 && k < 6) no.d += n14_C(bxx + Math.cos(a) * br * 0.9 - rr * 0.15, byy + Math.sin(a) * br * 0.55 - rr * 0.25, rr * 0.55); } });
  var rkX = W * (ph ? 0.36 : 0.36), rkY = n14_yOn(ground, rkX) + H * 0.045, rs = H * (ph ? 0.026 : 0.034); no.c += n14_E(rkX + rs * 0.5, rkY + rs * 0.45, rs * 1.9, rs * 0.4);
  no.e += n14_P([[rkX - rs * 1.4, rkY + rs * 0.45], [rkX - rs * 1.1, rkY - rs * 0.3], [rkX - rs * 0.3, rkY - rs * 0.75], [rkX + rs * 0.6, rkY - rs * 0.6], [rkX + rs * 1.3, rkY - rs * 0.1], [rkX + rs * 1.6, rkY + rs * 0.5]]) + n14_P([[rkX + rs * 1.2, rkY + rs * 0.5], [rkX + rs * 1.5, rkY], [rkX + rs * 2.1, rkY + rs * 0.1], [rkX + rs * 2.4, rkY + rs * 0.55]]);
  no.s += 'M' + PT(rkX - rs * 1.2, rkY + rs * 0.1) + ' L' + PT(rkX + rs * 1.4, rkY + rs * 0.15) + ' M' + PT(rkX - rs * 0.7, rkY - rs * 0.35) + ' L' + PT(rkX + rs * 0.9, rkY - rs * 0.3) + ' ';
  // small flowers dotted over the turf
  spread(-10, H * 0.78, W + 20, H * 0.22, ph ? 12 : 16, 9, rnd, 1).forEach(function (c) { if (c.y < n14_yOn(ground, c.x) + 8) return; var r = (1 + c.r * 0.8) * S + 0.5; if (Math.sin(c.x / 70 + c.y / 23) < 0.2) return; if (c.q < 0.1) no.f += n14_C(c.x, c.y, r); else if (c.q < 0.17) no.g += n14_C(c.x, c.y, r); else if (c.q < 0.21) no.h += n14_C(c.x, c.y, r * 0.9); });
  // the tall swaying wildflowers and tussocks along the bottom edge (the engine draws them when animated)
  var fl = [], gr = [];
  for (x = -10; x < W + 20; x += (ph ? 22 : 30) * (0.55 + rnd() * 0.9)) { var q3 = rnd(); fl.push({x: x, y: H + 6, h: (H - gTop(x)) * (0.45 + rnd() * 0.5), k: q3 < 0.4 ? 0 : q3 < 0.72 ? 1 : q3 < 0.88 ? 2 : 3, r: (ph ? 7 : 9) * S * (0.8 + rnd() * 0.5) * (ph ? 1.3 : 1), ph: rnd() * 6.28}); }
  for (x = -10; x < W + 10; x += (ph ? 6 : 8)) gr.push({x: x + rnd() * 4, h: (H - gTop(x)) * (0.3 + rnd() * 0.45), c: rnd() < 0.5, ph: rnd() * 6.28, lean: (rnd() - 0.3) * 0.5});
  if (ANIM) {
    var tw = []; for (i = 0; i < 400 && tw.length < (ph ? 24 : 50); i++) { var tx = rnd() * W, ty = rnd() * hz * 0.92, ok = Math.hypot(tx - sx, ty - sy) > sr * 3; stacks.forEach(function (s2) { if (Math.abs(tx - s2[0]) < s2[2] && ty > s2[1] - s2[3] - 10) ok = false; }); if (tx < xFar + 10 && ty > topL[Math.min(nU, Math.max(0, Math.round(nU * (tx - x0) / (xFar - x0))))][1] - 20) ok = false; if (ok) tw.push([tx, ty, rnd()]); }
    ANIM.hz = hz; ANIM.S = S; ANIM.sun = [sx, sy, sr]; ANIM.mask = mask; ANIM.lit = lit; ANIM.stacks = stacks; ANIM.surf = surf; ANIM.beach = beachP; ANIM.fl = fl; ANIM.gr = gr; ANIM.tw = tw;
  } else {
    fl.forEach(function (f) { var hx = f.x + f.h * 0.05, hy = f.y - f.h; no.t += 'M' + PT(f.x, f.y) + ' Q' + PT(f.x + f.h * 0.02, f.y - f.h * 0.6) + ' ' + PT(hx, hy) + ' ';
      if (f.k === 0) no.g += n14_C(hx, hy, f.r * 0.7);
      else if (f.k === 1) { for (k = 0; k < 8; k++) { var a3 = k / 8 * Math.PI * 2; no.f += n14_RE(hx + Math.cos(a3) * f.r * 0.5, hy + Math.sin(a3) * f.r * 0.5, f.r * 0.45, f.r * 0.16, a3 * 180 / Math.PI); } no.e += n14_C(hx, hy, f.r * 0.25); }
      else if (f.k === 2) { [[0, -0.28], [-0.3, -0.18], [0.3, -0.18], [-0.52, 0.02], [-0.18, 0], [0.18, 0], [0.52, 0.02], [-0.34, 0.16], [0, 0.18], [0.34, 0.16]].forEach(function (q) { no.h += n14_C(hx + q[0] * f.r, hy + q[1] * f.r, f.r * 0.2); }); }
      else { for (k = 0; k < 4; k++) no.g += n14_C(hx + Math.sin(k) * f.r * 0.2, hy + k * f.r * 0.45, f.r * 0.22); } });
    gr.forEach(function (g) { var b = g.lean * g.h; no.s += 'M' + PT(g.x, H + 4) + ' q' + n1(b * 0.3) + ' ' + n1(-g.h * 0.6) + ' ' + n1(b) + ' ' + n1(-g.h) + ' '; });
  }
  var N = dk ? ['#16263A', '#1E3446', '#101E2E', '#1C3040', '#3A4660', '#8A8460', '#8E6A8E', '#B4BCD6', '#2A4250', '#24384A'] : ['#5C8A3A', '#7EAE4A', '#46743A', '#6A9C42', '#D8C49A', '#F6C83C', '#E2649C', '#FFFFFF', '#88B84E', '#4E7E34'];
  add(near, 'a', no.a, N[0]); add(near, 'b', no.b, N[1]); add(near, 'c', no.c, N[2]); add(near, 'd', no.d, N[3]); add(near, 'e', no.e, N[4]); add(near, 'f', no.f, N[5]); add(near, 'g', no.g, N[6]); add(near, 'h', no.h, N[7]);
  stk(near, 's', no.s, N[8], 1.8 * S + 0.6); stk(near, 't', no.t, N[9], 1.4 * S + 0.5);
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: sea}};
};
