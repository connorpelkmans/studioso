// ---- batch n15: fjord (Fjord), storm (Storm Prairie)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n15_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n15_P(pts) { return pts.length > 2 ? poly(n15_cw(pts)) : ''; }
function n15_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n15_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n15_REp(x, y, rx, ry, ang, n) { var p = []; n = n || 18; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return rotp(p, x, y, ang); }
function n15_RE(x, y, rx, ry, ang) { return n15_P(n15_REp(x, y, rx, ry, ang)); }
function n15_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n15_dot(x, y) { return 'M' + PT(x, y) + ' h0.01 '; }
function n15_ss(a, b, u) { u = Math.max(0, Math.min(1, (u - a) / (b - a))); return u * u * (3 - 2 * u); }
// y on a polyline whose x runs either way (not evenly spaced): linear search
function n15_at(pts, x) { for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) { var f = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * f; } } return null; }
// mirror points about the water line y = yb
function n15_mir(pts, yb) { return pts.map(function (p) { return [p[0], 2 * yb - p[1]]; }); }
function n15_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 10; i++) { var t = i / 10, ww = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n15_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
function n15_smooth(p, n) { var o = [], L = p.length; for (var i = 0; i < L; i++) { var a = p[(i - 1 + L) % L], b = p[i], c = p[(i + 1) % L], d = p[(i + 2) % L]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } return o; }
function n15_sblob(cx, cy, rx, ry, rnd, n, k) { return n15_smooth(n15_blob(cx, cy, rx, ry, rnd, n, k), 3); }
function n15_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n15_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// a tapered band along a polyline (w0 at the start, w1 at the end), as points
function n15_ribbon(pts, w0, w1) { var L = [], R = [], n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * i / (n - 1); L.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); R.push([p[0] + dy / dl * w, p[1] - dx / dl * w]); } return L.concat(R.reverse()); }
function n15_limb(x0, y0, x1, y1, w0, w1, bend) { var p = []; for (var i = 0; i <= 8; i++) { var u = i / 8; p.push([x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y0 + (y1 - y0) * u]); } return n15_P(n15_ribbon(p, w0, w1)); }
// a narrow Norway spruce: a spire of drooping tiers (base centre x,y; height h)
function n15_sprucePts(x, y, h, rnd) { var w = h * 0.3, R = [[x, y - h]], n = 5, i; for (i = 1; i <= n; i++) { var u = i / n, yy = y - h + h * 0.94 * u, ww = w * (0.25 + 0.75 * u) * (0.9 + rnd() * 0.2); R.push([x + ww, yy]); if (i < n) R.push([x + ww * 0.42, yy - h * 0.03]); }
  R.push([x + w * 0.1, y - h * 0.04], [x + w * 0.1, y]); var Lp = R.slice(1).reverse().map(function (p) { return [2 * x - p[0], p[1]]; }); return R.concat(Lp); }
// a flat-bottomed cumulus (towers of round bumps over a level base): base = the shadowed underside, lit = the sunny top
function n15_cumulus(x, base, w, h, rnd, flat) { var B = [], n = 6, i;
  for (i = 0; i < n; i++) { var u = (i + 0.5) / n - 0.5, c = Math.cos(u * Math.PI); B.push([x + u * w * 0.8, base - h * (0.04 + 0.36 * c), h * (0.12 + 0.32 * c) * (0.85 + rnd() * 0.3)]); }
  if (!flat) { B.push([x - w * 0.1 + (rnd() - 0.5) * w * 0.1, base - h * 0.62, h * 0.3]); B.push([x + w * 0.12, base - h * 0.7, h * 0.26]); }
  function out(sh, dx, dy, by) { var top = []; for (var xx = x - w * 0.64; xx <= x + w * 0.64; xx += w / 70) { var yy = by; B.forEach(function (b) { var r = b[2] * sh, d = xx - b[0] - dx; if (Math.abs(d) < r) yy = Math.min(yy, b[1] + dy - Math.sqrt(r * r - d * d)); }); if (yy < by - 0.5) top.push([xx, yy]); } return top.length > 2 ? top.concat([[top[top.length - 1][0], by], [top[0][0], by]]) : null; }
  return {base: out(1, 0, 0, base), lit: out(0.93, -w * 0.025, -h * 0.05, base - h * 0.12), box: [x - w * 0.64, base - h * 1.1, x + w * 0.64, base]}; }
// a mountain range standing on y = base (the water line): body, snow caps on its lit (left) faces, peak list
function n15_range(W, base, y0, dy, np, rnd, snowLine) { var pk = [], m, i, k; for (i = 0; i <= np; i++) pk.push([W * (i / np) + (rnd() - 0.5) * W / np * 0.5, y0 + rnd() * dy]);
  m = [[-120, base - (base - pk[0][1]) * 0.4]];
  for (i = 0; i < pk.length; i++) { m.push(pk[i]); var nx = i < pk.length - 1 ? pk[i + 1] : [W + 140, base - (base - pk[i][1]) * 0.3], lo = Math.max(pk[i][1], nx[1]); m.push([(pk[i][0] + nx[0]) / 2 + (rnd() - 0.5) * 24, lo + (base - lo) * (0.25 + rnd() * 0.25)]); }
  var snow = [];
  for (i = 1; i < m.length - 1; i += 2) { var p = m[i], sl = m[i - 1], sr = m[i + 1];
    if (p[1] < snowLine) { var fr = Math.min(0.55, (snowLine - p[1]) / (base - p[1]) + 0.12 + rnd() * 0.1), A1 = [p[0] + (sr[0] - p[0]) * fr * 0.35, p[1] + (sr[1] - p[1]) * fr * 0.35], B1 = [p[0] + (sl[0] - p[0]) * fr, p[1] + (sl[1] - p[1]) * fr], pts = [p, A1];
      for (k = 1; k < 7; k++) { var u = k / 7; pts.push([A1[0] + (B1[0] - A1[0]) * u, A1[1] + (B1[1] - A1[1]) * u + (k % 2 ? -1 : 1) * (B1[1] - p[1]) * 0.16]); } pts.push(B1); snow.push(pts); } }
  return {body: m.concat([[W + 140, base + 1], [-120, base + 1]]), snow: snow}; }

// =============== 1. Fjord: a deep fjord between sheer granite walls, ribbon waterfalls, a red cabin on a ledge, mirror-still water
// one wall of the fjord jutting in from the side: o.xt tip (where the sheer end wall drops into the water), o.xo outer edge, o.yb water line, o.h height
function n15_wing(o, rnd) { var L = o.xo - o.xt, sh = o.sh || 0.72, c = [[0, 0], [0.004, 0.05], [0.009, sh * 0.42], [0.016, sh * 0.74], [0.028, sh * 0.92], [0.05, sh * 1.0], [0.085, sh * 1.02]], n = o.pk, i;
  for (i = 0; i <= n; i++) { var u = 0.14 + i / n * 0.92, base = sh + (1.04 - sh) * Math.pow(u, 0.7), f = base + (i % 2 ? -0.05 - rnd() * 0.05 : 0.03 + rnd() * 0.08) + (o.peak && i === o.peak ? 0.1 : 0); c.push([u, Math.min(1.16, f)]); }
  var prof = n15_curve(c, 5).map(function (q) { return [o.xt + L * q[0], o.yb - o.h * q[1]]; });
  prof[0] = [o.xt, o.yb + 1];
  var body = prof.concat([[o.xo + Math.sign(L) * 60, prof[prof.length - 1][1]], [o.xo + Math.sign(L) * 60, o.yb + 1]]);
  return {prof: prof, body: body, o: o, L: L, X: function (u) { return o.xt + L * u; }, top: function (x) { var y = n15_at(prof, x); return y == null ? o.yb - o.h : y; }}; }
// the detail on a wall: lit and shaded granite slabs, crevices, grassy ledges, the green cap, forested talus, waterfalls, wet rock at the waterline
function n15_wingDetail(w, rnd, S, out, lit, falls) { var o = w.o, L = w.L, s = Math.sign(L), aL = Math.abs(L), body = w.body, yb = o.yb, h = o.h, i, k, x, y, pts;
  var push = function (slot, p) { if (p && p.length > 2) { out[slot] += n15_P(p); out[slot] += n15_P(n15_mir(p, yb)); } };
  var inside = function (x, y) { return n15_inPoly(body, x, y) && y < yb - 1; };
  // the sheer end wall at the tip: a lit face on the left walls (the sun is to the right), a shaded one on the right walls
  var tip = w.prof.filter(function (p) { return Math.abs(p[0] - o.xt) < aL * 0.06; }), fw = aL * (0.022 + rnd() * 0.01) + 4 * S, face = tip.slice();
  for (i = tip.length - 1; i >= 0; i--) { var p = tip[i], dd = Math.min(fw, Math.abs(p[0] - o.xt) + fw * 0.6); face.push([p[0] + s * dd, p[1] + 3 * S]); }
  push(lit ? 'b' : 'c', face);
  // long vertical slabs and crevices down the face (water stains and joints of the granite)
  var nSl = Math.round(aL / (lit ? 9 : 11));
  for (i = 0; i < nSl; i++) { x = w.X(0.05 + rnd() * 0.93); var ty = w.top(x) + h * (0.03 + rnd() * 0.12), len = h * (0.12 + rnd() * 0.42), wd = (1.5 + rnd() * rnd() * 9) * S, by = ty + len, dx = (rnd() - 0.5) * wd * 1.5;
    if (by > yb - h * 0.1) by = yb - h * 0.1; if (by - ty < h * 0.06 || !inside(x, ty) || !inside(x + dx, by)) continue;
    pts = [[x - wd * 0.5, ty], [x + wd * 0.5, ty + wd * 0.7], [x + dx + wd * 0.25, by], [x + dx - wd * 0.05, by + wd * 0.4]];
    push(rnd() < (lit ? 0.62 : 0.3) ? 'b' : 'c', pts); }
  // grassy ledges with a shadow under each
  var nLd = Math.round(aL / 70) + 2;
  for (i = 0; i < nLd; i++) { var u0 = 0.06 + rnd() * 0.8, x0 = w.X(u0), ln = aL * (0.05 + rnd() * 0.16), fr = 0.18 + rnd() * 0.55, y0 = w.top(x0) + (yb - h * 0.12 - w.top(x0)) * fr, sl = (rnd() - 0.5) * 0.12, th = (1.6 + rnd() * 2.6) * S, run = [], runs = [];
    for (x = 0; x <= ln; x += 5) { var xx = x0 - s * x, yy = y0 + sl * x + Math.sin(x * 0.2 + i) * 1.2 * S; if (inside(xx, yy - th) && inside(xx, yy + th * 2)) run.push([xx, yy]); else { if (run.length > 2) runs.push(run); run = []; } }
    if (run.length > 2) runs.push(run);
    runs.forEach(function (r) { var tw = r.map(function (p, j) { return [p[0], p[1] - th * (0.6 + 0.4 * Math.sin(j * 1.7 + i))]; }), bw = r.slice().reverse().map(function (p) { return [p[0], p[1] + th * 0.5]; });
      push('e', tw.concat(bw)); push('c', r.map(function (p) { return [p[0], p[1] + th * 0.3]; }).concat(r.slice().reverse().map(function (p, j) { return [p[0], p[1] + th * (1.8 + 0.8 * Math.sin(j))]; }))); }); }
  // patches of birch scrub and grass clinging to the gentler upper slopes and the lower face
  for (i = 0; i < aL / 26; i++) { x = w.X(0.07 + rnd() * 0.92); var tY = w.top(x), fr2 = rnd() < 0.6 ? rnd() * 0.3 : 0.55 + rnd() * 0.3, cy = tY + (yb - tY) * fr2 + h * 0.03, rx = (6 + rnd() * 18) * S * (o.tsz || 1), ry = rx * (0.3 + rnd() * 0.3), bp = n15_sblob(x, cy, rx, ry, rnd, 9, 0.3);
    if (bp.every(function (q) { return inside(q[0], q[1]); })) { push(rnd() < 0.8 ? 'e' : 'd', bp); } }
  // the green cap along the top, with spruces standing on the lower stretches of the ridge
  var cap = [], capB = [], sp = '';
  w.prof.forEach(function (p) { var u = (p[0] - o.xt) / L; if (u < 0.04) return; var th2 = h * (0.018 + 0.03 * (0.5 + 0.5 * Math.sin(p[0] * 0.031 + o.xt))) * n15_ss(0.04, 0.1, u); cap.push([p[0], p[1] - 0.6]); capB.unshift([p[0], p[1] + th2]); });
  push('e', cap.concat(capB));
  if (o.trees) { for (x = w.X(0.09); s > 0 ? x < w.X(1) : x > w.X(1); x += s * (5 + rnd() * 9) * S * o.trees) { if (rnd() < 0.45) continue; var ty2 = w.top(x) + 2 * S; push('d', n15_sprucePts(x, ty2, (5 + rnd() * 7) * S * o.trees, rnd)); } }
  // forested talus along the foot of the wall (none under the sheer tip)
  var tal = [], talB = [], tf = function (x) { var u = (x - o.xt) / L; return h * (0.05 + 0.05 * (0.5 + 0.5 * Math.sin(x * 0.017 + o.yb))) * n15_ss(0.035, 0.12, u); };
  for (x = w.X(0.03); s > 0 ? x <= w.X(1) + 60 : x >= w.X(1) - 60; x += s * 6) { tal.push([x, yb - tf(x)]); talB.unshift([x, yb + 0.5]); }
  push('d', tal.concat(talB));
  for (x = w.X(0.05); s > 0 ? x <= w.X(1) + 40 : x >= w.X(1) - 40; x += s * (3.5 + rnd() * 4) * S * (o.tsz || 1)) { var ht = (4 + rnd() * 7) * S * (o.tsz || 1), yy2 = yb - tf(x) + ht * 0.25 + rnd() * 2 * S; if (tf(x) < ht * 0.3) continue; push('d', n15_sprucePts(x, yy2, ht, rnd)); }
  for (i = 0; i < aL / 40; i++) { x = w.X(0.08 + rnd() * 0.9); var t0 = tf(x); if (t0 < 4) continue; var r0 = (2 + rnd() * 3) * S * (o.tsz || 1); push('e', n15_blob(x, yb - t0 * (0.2 + rnd() * 0.5), r0 * 1.4, r0, rnd, 9, 0.2)); }
  // waterfalls: ribbons from notches in the rim straight down the face into the fjord, a dark wet streak beside each
  (falls || []).forEach(function (fa) { x = w.X(fa.u); var top = w.top(x) + 1.5 * S, seg = [], n = 14, xx = x, wdt = fa.w * S;
    for (k = 0; k <= n; k++) { var v = k / n, yy3 = top + (yb - 1 - top) * v; xx += k ? (rnd() - 0.5) * 2.2 * S + s * 0.25 * S : 0; seg.push([xx, yy3]); }
    var rib = n15_ribbon(seg, wdt * 0.45, wdt), wet = n15_ribbon(seg.map(function (p) { return [p[0] + s * wdt * 0.7, p[1]]; }), wdt * 0.9, wdt * 1.9);
    push('c', wet); push('f', rib);
    out.f += n15_E(seg[n][0], yb + 1, wdt * 3.4, wdt * 0.55 + 0.5);
    out.falls.push({pts: seg, w: wdt, yb: yb, k: fa.k || 1}); });
  // the dark wet rock right at the waterline
  pts = []; var pb = []; for (x = o.xt - s * 2; s > 0 ? x <= o.xo + 60 : x >= o.xo - 60; x += s * 8) { pts.push([x, yb - (1.6 + Math.sin(x * 0.13) * 0.6) * S]); pb.unshift([x, yb + 1.4 * S]); }
  out.g += n15_P(pts.concat(pb));
}
SCENES.fjord = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 1 : 1.5), refl = Lay(ph ? 0.4 : 0.6), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, x, y;
  var hz = Math.round(H * (ph ? 0.455 : 0.5)), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#25305E 0%,#3C4880 ' + Math.round(p1 * 0.35) + '%,#6E73A6 ' + Math.round(p1 * 0.65) + '%,#B49CB8 ' + Math.round(p1 * 0.86) + '%,#F0C8A8 ' + p1 + '%,#F0C8A8 100%)'
    : 'linear-gradient(180deg,#6E9FC8 0%,#93BAD8 ' + Math.round(p1 * 0.4) + '%,#C6DBE6 ' + Math.round(p1 * 0.8) + '%,#EEF1E8 ' + p1 + '%,#EEF1E8 100%)';
  var water = dk ? 'linear-gradient(180deg,#E2BCA8 0%,#AE98B2 4%,#6A6E9E 16%,#3A4474 42%,#1C2448 100%)' : 'linear-gradient(180deg,#E2E8E2 0%,#C4D7DE 4%,#9DBCD2 16%,#7FA6C4 42%,#5C88AA 100%)';
  // ---- the sky (far layer), mirrored in the water below the horizon
  var sx = W * (ph ? 0.62 : 0.64), sy = H * (ph ? 0.06 : 0.04), mx = W * (ph ? 0.5 : 0.47), my = H * (ph ? 0.12 : 0.13), mr = ph ? 13 : 19;
  var F = {a: '', b: '', c: '', d: '', e: '', f: '', g: ''}, fpush = function (k2, p) { if (p) { F[k2] += n15_P(p); F[k2] += n15_P(n15_mir(p, hz)); } };
    var CL = ph ? [[0.22, 0.2, 200, 50], [0.72, 0.27, 220, 56], [0.5, 0.33, 150, 30]] : [[0.18, 0.17, 340, 74], [0.6, 0.23, 300, 66], [0.9, 0.27, 240, 50], [0.4, 0.34, 210, 34]], boxes = [];
  CL.forEach(function (q) { var c = n15_cumulus(W * q[0], H * q[1], q[2] * (ph ? 1 : S), q[3] * (ph ? 1 : S) * (dk ? 0.55 : 1), rnd, dk); boxes.push(c.box); if (!dk) fpush('b', c.base); fpush('c', c.lit); });
  if (dk) { spread(0, 0, W, hz * 0.62, 26, 26, rnd, 1).forEach(function (c) { if (c.q > 0.32 || Math.hypot(c.x - mx, c.y - my) < mr * 2.6) return; for (var j = 0; j < boxes.length; j++) { var b = boxes[j]; if (c.x > b[0] && c.x < b[2] && c.y > b[1] && c.y < b[3]) return; } var r = 0.35 + c.r * c.r * 1.1; F.b += n15_C(c.x, c.y, r); }); }
  // two hazy ranges of peaks at the far end of the fjord, the nearer one bluer
  var r1 = n15_range(W, hz, H * (ph ? 0.29 : 0.27), H * 0.06, ph ? 4 : 7, rnd, H * (ph ? 0.34 : 0.33));
  fpush('d', r1.body); r1.snow.forEach(function (p) { fpush('e', p); });
  var r2 = n15_range(W, hz, H * (ph ? 0.355 : 0.345), H * 0.05, ph ? 3 : 6, rnd, H * (ph ? 0.39 : 0.38));
  fpush('f', r2.body); r2.snow.forEach(function (p) { fpush('g', p); });
  add(far, 'a', F.a, dk ? 'rgba(220,214,255,0.1)' : 'rgba(255,248,226,0.3)'); add(far, 'b', F.b, dk ? 'rgba(255,250,240,0.8)' : '#D0DCE8'); add(far, 'c', F.c, dk ? 'rgba(206,168,190,0.42)' : 'rgba(255,255,255,0.92)');
  add(far, 'd', F.d, dk ? '#8A88B2' : '#B2C5D6'); add(far, 'e', F.e, dk ? '#E2D2DE' : '#F4F7FA'); add(far, 'f', F.f, dk ? '#6C6E9E' : '#97AFC5'); add(far, 'g', F.g, dk ? '#CAC0D8' : '#E8EFF5');
  add(far, 'h', rect(-60, hz, W + 120, H - hz + 60), dk ? 'rgba(12,16,44,0.16)' : 'rgba(40,86,110,0.1)');
  if (dk) stk(far, 's', n15_dot(mx, my) + n15_dot(mx, 2 * hz - my), '#F7F1DC', mr * 2);
  stk(far, 't', seg(-60, hz + 0.5, W + 60, hz + 0.5), dk ? 'rgba(240,210,190,0.5)' : 'rgba(255,255,255,0.7)', 1.2);
  // ---- the walls: a nearer pair behind (refl layer) and the two great walls in front (mid layer)
  var w1L = n15_wing({xt: W * (ph ? 0.4 : 0.37), xo: -60, yb: hz + H * 0.012, h: H * (ph ? 0.15 : 0.2), pk: ph ? 3 : 5, tsz: 0.6}, rnd);
  var w1R = n15_wing({xt: W * (ph ? 0.6 : 0.61), xo: W + 60, yb: hz + H * 0.02, h: H * (ph ? 0.17 : 0.22), pk: ph ? 3 : 5, tsz: 0.6, peak: 3}, rnd);
  var w2L = n15_wing({xt: W * (ph ? 0.24 : 0.21), xo: -60, yb: hz + H * (ph ? 0.06 : 0.075), h: H * (ph ? 0.36 : 0.44), pk: ph ? 3 : 4, tsz: 1, trees: 1}, rnd);
  var w2R = n15_wing({xt: W * (ph ? 0.78 : 0.79), xo: W + 60, yb: hz + H * (ph ? 0.045 : 0.055), h: H * (ph ? 0.3 : 0.38), pk: ph ? 3 : 4, tsz: 1, trees: 1}, rnd);
  var R = {b: '', c: '', d: '', e: '', f: '', g: '', falls: []}, M = {b: '', c: '', d: '', e: '', f: '', g: '', falls: []};
  [w1L, w1R].forEach(function (w) { R.a = (R.a || '') + n15_P(w.body) + n15_P(n15_mir(w.body, w.o.yb)); });
  n15_wingDetail(w1L, rnd, S * 0.7, R, true, [{u: 0.22, w: 1.6}]);
  n15_wingDetail(w1R, rnd, S * 0.7, R, false, [{u: 0.3, w: 1.8}, {u: 0.55, w: 1.3}]);
  [w2L, w2R].forEach(function (w) { M.a = (M.a || '') + n15_P(w.body) + n15_P(n15_mir(w.body, w.o.yb)); });
  n15_wingDetail(w2L, rnd, S, M, true, ph ? [{u: 0.16, w: 2}, {u: 0.21, w: 2.4}, {u: 0.26, w: 1.8}] : [{u: 0.1, w: 2.2}, {u: 0.13, w: 2.8}, {u: 0.16, w: 2.4}, {u: 0.2, w: 3}, {u: 0.235, w: 2}]);
  n15_wingDetail(w2R, rnd, S, M, false, [{u: ph ? 0.16 : 0.13, w: 3.6, k: 1.4}]);
  // the grassy ledge high on the right wall where the little red cabin stands
  var lw = w2R, lu = ph ? 0.38 : 0.34, lx = lw.X(lu), ly = lw.top(lx) + (lw.o.yb - lw.top(lx)) * 0.42, lwid = Math.abs(lw.L) * (ph ? 0.22 : 0.2), ledge = [], ledgeB = [];
  for (x = -lwid * 0.5; x <= lwid * 0.5; x += 4) { var u2 = x / lwid + 0.5, yy = ly + x * 0.06 + Math.sin(u2 * 9) * 1.2 * S, th = (7 + 9 * Math.sin(Math.PI * u2)) * S; ledge.push([lx + x, yy - th * 0.35 * Math.sin(Math.PI * u2)]); ledgeB.unshift([lx + x, yy + th]); }
  var lpush = function (slot, p) { M[slot] += n15_P(p) + n15_P(n15_mir(p, lw.o.yb)); };
  lpush('c', ledgeB.map(function (p) { return [p[0], p[1] - 2 * S]; }).reverse().concat(ledgeB.map(function (p, j) { return [p[0] + (j % 2 ? 2 : -2) * S, p[1] + (5 + 4 * Math.sin(j)) * S]; }).reverse()));
  lpush('e', ledge.concat(ledgeB));
  for (i = 0; i < 9; i++) { var bx = lx + lwid * (0.18 + rnd() * 0.32), byy = n15_at(ledge, bx) + 1; lpush('d', n15_sprucePts(bx, byy, (7 + rnd() * 8) * S, rnd)); }
  var cabX = lx - lwid * 0.12, cabY = n15_at(ledge, cabX) + 1.5 * S;
  add(refl, 'a', R.a, dk ? '#4C5280' : '#8696A6'); add(refl, 'b', R.b, dk ? '#62689A' : '#A4B2BE'); add(refl, 'c', R.c, dk ? 'rgba(10,12,34,0.34)' : 'rgba(42,54,70,0.3)');
  add(refl, 'd', R.d, dk ? '#2A3C56' : '#4C6C60'); add(refl, 'e', R.e, dk ? '#3A5266' : '#7C9E72'); add(refl, 'f', R.f, dk ? 'rgba(214,220,248,0.62)' : 'rgba(255,255,255,0.8)'); add(refl, 'g', R.g, dk ? 'rgba(6,8,24,0.4)' : 'rgba(20,32,40,0.35)');
  add(mid, 'a', M.a, dk ? '#343A64' : '#6A7884'); add(mid, 'b', M.b, dk ? '#4A5280' : '#909EA8'); add(mid, 'c', M.c, dk ? 'rgba(6,8,24,0.42)' : 'rgba(24,32,42,0.4)');
  add(mid, 'd', M.d, dk ? '#1A2C42' : '#2C5638'); add(mid, 'e', M.e, dk ? '#2A4456' : '#6A9A4C'); add(mid, 'f', M.f, dk ? 'rgba(220,226,252,0.82)' : '#F6FBFC'); add(mid, 'g', M.g, dk ? 'rgba(4,6,18,0.5)' : 'rgba(10,22,26,0.45)');
  // water tints: each layer darkens what lies in the water below its own shoreline
  var floorOf = function (ws) { return function (x) { var y = hz; ws.forEach(function (w) { var a = Math.min(w.o.xt, w.o.xo - 60 * Math.sign(w.L)), b = Math.max(w.o.xt, w.o.xo + 60 * Math.sign(w.L)); if (x >= a && x <= b) y = Math.max(y, w.o.yb); }); return y; }; };
  var tintPoly = function (fl) { var top = []; for (x = -60; x <= W + 60; x += 2) top.push([x, fl(x)]); return n15_P(top.concat([[W + 60, H + 60], [-60, H + 60]])); };
  var fl1 = floorOf([w1L, w1R]), fl2 = floorOf([w1L, w1R, w2L, w2R]);
  add(refl, 'h', tintPoly(fl1), dk ? 'rgba(10,14,40,0.16)' : 'rgba(30,72,96,0.12)');
  add(mid, 'h', tintPoly(fl2), dk ? 'rgba(8,10,32,0.2)' : 'rgba(22,62,84,0.15)');
  // the cabin's red reflection, softened
  var cw = ph ? 15 : 24 * S, chh = cw * 0.52, cby = 2 * lw.o.yb - cabY;
  stk(mid, 's', seg(cabX - cw * 0.3, cby + chh * 0.45, cabX + cw * 0.3, cby + chh * 0.45), dk ? 'rgba(120,52,70,0.55)' : 'rgba(150,70,60,0.55)', chh * 0.7);
  // ---- near layer: the cabin, the grassy knoll with a birch and a spruce in front, ripples on the water
  var N = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''};
  N.e += rect(cabX - cw / 2, cabY - chh, cw, chh);
  N.b += n15_P([[cabX - cw * 0.62, cabY - chh + 0.5], [cabX - cw * 0.08, cabY - chh - cw * 0.3], [cabX + cw * 0.08, cabY - chh - cw * 0.3], [cabX + cw * 0.62, cabY - chh + 0.5], [cabX + cw * 0.6, cabY - chh + 2.2 * S], [cabX - cw * 0.6, cabY - chh + 2.2 * S]]);
  N.f += rect(cabX + cw * 0.12, cabY - chh * 0.7, cw * 0.14, chh * 0.7) + rect(cabX + cw * 0.28, cabY - chh - cw * 0.3, cw * 0.1, cw * 0.18) + n15_P([[cabX - cw * 0.62, cabY - chh + 2.2 * S], [cabX + cw * 0.6, cabY - chh + 2.2 * S], [cabX + cw * 0.5, cabY - chh + 3.4 * S], [cabX - cw * 0.5, cabY - chh + 3.4 * S]]);
  N.h += rect(cabX - cw * 0.36, cabY - chh * 0.68, cw * 0.17, chh * 0.34) + rect(cabX - cw * 0.08, cabY - chh * 0.68, cw * 0.14, chh * 0.34) + rect(cabX - cw * 0.5, cabY - chh, cw * 0.05, chh) + rect(cabX + cw * 0.45, cabY - chh, cw * 0.05, chh);
  // the knoll
  var kx1 = W * (ph ? 0.42 : 0.34), ky = H * (ph ? 0.83 : 0.71), ktop = function (x) { var u = Math.max(0, x / kx1); return u >= 1 ? H + 40 : H - (H - ky) * Math.pow(1 - u * u, 0.6) + Math.sin(x / 37) * 3 * S + Math.sin(x / 13) * 1.2 * S; };
  var kp = n15_fn(-40, kx1, 5, ktop); kp.push([kx1, H + 40], [-40, H + 40]);
  N.a += n15_P(kp);
  var kl = []; for (x = -40; x < kx1 * 0.9; x += 5) kl.push([x, ktop(x) - 0.5]); var klB = kl.slice().reverse().map(function (p, j) { return [p[0], p[1] + (12 + 9 * Math.sin(j * 0.33) + 6 * Math.sin(j * 0.9)) * S]; });
  N.b += n15_P(kl.concat(klB));
  // sunlit tussocks mottling the knoll's grass
  for (i = 0; i < (ph ? 26 : 40); i++) { var mxk = rnd() * kx1 * 0.92, myk = ktop(mxk) + 14 * S + rnd() * (H - ky) * 0.95, tw5 = (14 + rnd() * 22) * S * (ph ? 1.3 : 1), th5 = tw5 * (0.3 + rnd() * 0.2), tf5 = [[mxk + tw5 * 0.5, myk]], nb = 6 + Math.floor(rnd() * 4);
    if (myk > H + 6 || mxk > kx1 * 0.8 && myk < ktop(mxk) + 30 * S) continue;
    for (k = nb; k >= 0; k--) { var uu = k / nb, xb = mxk - tw5 * 0.5 + tw5 * uu, hb = th5 * Math.sin(Math.PI * (0.1 + uu * 0.8)) * (0.7 + rnd() * 0.5); tf5.push([xb + (rnd() - 0.3) * 3 * S, myk - hb]); if (k) tf5.push([xb - tw5 / nb * 0.5, myk - hb * 0.35]); }
    tf5.push([mxk - tw5 * 0.5, myk]); N.b += n15_P(tf5); }
  // granite boulders and a slab along the knoll's waterline, one on its crest
  var bq = ph ? [[0.38, 0.9, 22], [0.31, 0.95, 30], [0.44, 0.985, 20], [0.2, 0.99, 26], [0.1, 0.83, 13]] : [[0.27, 0.84, 30], [0.31, 0.9, 22], [0.22, 0.93, 40], [0.33, 0.975, 26], [0.12, 0.98, 30], [0.035, 0.74, 16]];
  bq.forEach(function (q) { var bx2 = W * q[0], r = q[2] * S * (ph ? 1.3 : 1), by2 = Math.max(H * q[1], ktop(bx2) + r * 0.25), p = n15_blob(bx2, by2, r, r * 0.62, rnd, 14, 0.18).map(function (pp) { return [pp[0], Math.min(pp[1], by2 + r * 0.3)]; });
    N.c += n15_P(p); N.d += n15_P(p.filter(function (pp) { return pp[1] < by2 - r * 0.02 && pp[0] > bx2 - r * 0.45; }).concat([[bx2 + r * 0.05, by2 + r * 0.02]])); });
  // a weeping birch: white trunk with dark marks, arching twigs and curtains of small hanging leaves
  var bx3 = W * (ph ? 0.07 : 0.07), bby = ktop(bx3) + 3, bh = H * (ph ? 0.3 : 0.47), tAt = function (v) { return [bx3 + bh * 0.05 * v - bh * 0.035 * Math.sin(Math.PI * v), bby - bh * v]; };
  N.d += n15_P(n15_ribbon(n15_fn(0, 1, 0.1, function () { return 0; }).map(function (q) { return tAt(q[0]); }), 6 * S + 1.4, 1 * S));
  for (i = 0; i < 11; i++) { var v3 = 0.06 + i * 0.075 + rnd() * 0.02, tp = tAt(v3), tw4 = (6 * S + 1.4) * (1 - v3 * 0.8); N.f += n15_RE(tp[0] + (rnd() - 0.5) * tw4 * 0.6, tp[1], tw4 * (0.35 + rnd() * 0.4), 0.8 * S + 0.3, (rnd() - 0.5) * 16); }
  for (k = 0; k < 18; k++) { var v4 = 0.36 + k / 14 * 0.6 + (rnd() - 0.5) * 0.04, sd = rnd() < 0.5 ? 1 : -1, st0 = tAt(v4), reach = bh * (0.1 + 0.16 * rnd()) * (1.15 - (v4 - 0.4)), P1 = [st0[0] + sd * reach * 0.8, st0[1] - bh * (0.06 + 0.04 * rnd())], P2 = [st0[0] + sd * reach * 1.3, st0[1] + bh * (0.04 + 0.1 * rnd())], tw = [];
    for (var j = 0; j <= 10; j++) { var t = j / 10; tw.push([(1 - t) * (1 - t) * st0[0] + 2 * t * (1 - t) * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * st0[1] + 2 * t * (1 - t) * P1[1] + t * t * P2[1]]); }
    N.f += n15_P(n15_ribbon(tw, 0.7 * S + 0.25, 0.2));
    tw.forEach(function (q2, j2) { if (j2 < 3) return; var ln2 = bh * (0.04 + 0.12 * rnd() * j2 / 10), stp = 2.8 * S + 0.5; for (var d = 0; d <= ln2; d += stp) { var lx2 = q2[0] + Math.sin(d * 0.15 + j2) * 1.5 * S, ly2 = q2[1] + d, ang = 90 + (rnd() - 0.5) * 70, lr = (2.2 + rnd() * 1.2) * S + 0.5;
      N.a += n15_P(n15_REp(lx2 + 0.8 * S, ly2 + 0.9 * S, lr * 1.15, lr * 0.62, ang, 10)); if (rnd() < 0.65) N.b += n15_P(n15_REp(lx2 - 0.4 * S, ly2 - 0.3 * S, lr, lr * 0.52, ang, 10)); } }); }
  var spx = W * (ph ? 0.25 : 0.165), spy = ktop(spx) + 4, sph = H * (ph ? 0.22 : 0.37); N.a += n15_P(n15_sprucePts(spx, spy, sph, rnd));
  for (i = 1; i < 6; i++) { var ty3 = spy - sph + sph * 0.94 * i / 5, tw3 = sph * 0.3 * (0.25 + 0.75 * i / 5); N.b += n15_P([[spx + tw3 * 0.15, ty3 - sph * 0.1], [spx + tw3 * 0.9, ty3 - 1], [spx + tw3 * 0.5, ty3 - sph * 0.03]]); }
  N.b += n15_P(n15_sprucePts(W * (ph ? 0.36 : 0.22), ktop(W * (ph ? 0.36 : 0.22)) + 4, sph * 0.42, rnd));
  // harebells and grass blades in the knoll's grass
  for (i = 0; i < (ph ? 16 : 26); i++) { var hx = rnd() * kx1 * 0.85, hy = ktop(hx) + (6 + rnd() * 26) * S, hr = (2 + rnd() * 1.6) * S * (ph ? 1.3 : 1); if (hy > H - 4) continue;
    N.t += 'M' + PT(hx, hy + hr * 3.4) + ' q' + n1(hr * 0.2) + ' ' + n1(-hr * 2.6) + ' ' + n1(hr * 1.2) + ' ' + n1(-hr * 3.2) + ' '; N.g += n15_P(n15_REp(hx + hr * 1.3, hy + hr * 0.6, hr * 0.62, hr, 15)); }
  for (x = -20; x < kx1 * 0.95; x += (ph ? 4 : 5) + rnd() * 3) { var gy = ktop(x) + 3, gh = (6 + rnd() * 10) * S * (ph ? 1.3 : 1), gb = (rnd() - 0.4) * gh * 0.6; N.t += 'M' + PT(x, gy) + ' q' + n1(gb * 0.3) + ' ' + n1(-gh * 0.6) + ' ' + n1(gb) + ' ' + n1(-gh) + ' '; }
  // ripples: thin broken lines in open water, wider and further apart nearer the viewer
  var openW = function (x, y) { return y > fl2(x) + 3 && y < H - 2 && y < ktop(x) - 4; };
  for (y = hz + 3; y < H; y += 3 + Math.pow((y - hz) / (H - hz), 1.3) * 22 * (0.6 + rnd() * 0.8)) { var q = (y - hz) / (H - hz); for (x = rnd() * 80; x < W; x += 30 + rnd() * 160 + q * 120) { var ln = (10 + rnd() * 30) * (0.4 + q * 1.6) * S; if (rnd() < 0.5 && openW(x, y) && openW(x + ln, y)) N.s += 'M' + PT(x, y) + ' h' + n1(ln) + ' '; } }
  add(near, 'a', N.a, dk ? '#122234' : '#2A4E32'); add(near, 'b', N.b, dk ? '#1E3846' : '#6E9E46'); add(near, 'c', N.c, dk ? '#2A2E4C' : '#7C7E7A'); add(near, 'd', N.d, dk ? '#4A5072' : '#D6D4CA');
  add(near, 'e', N.e, dk ? '#7A2E36' : '#B8392C'); add(near, 'f', N.f, dk ? '#14142A' : '#2E2624'); add(near, 'g', N.g, dk ? '#7C84C8' : '#6A7AD8'); add(near, 'h', N.h, dk ? '#FFD58A' : '#F6F3EA');
  stk(near, 's', N.s, dk ? 'rgba(230,214,240,0.2)' : 'rgba(255,255,255,0.32)', ph ? 0.9 : 1.2); stk(near, 't', N.t, dk ? '#2C4A56' : '#86B856', 1.1 * S + 0.5);
  if (ANIM) {
    var skyTop = []; for (x = 0; x <= W; x += 8) { var tt = hz; [w1L, w1R, w2L, w2R].forEach(function (w) { var a = Math.min(w.o.xt, w.o.xo), b = Math.max(w.o.xt, w.o.xo); if (x >= a && x <= b) tt = Math.min(tt, w.top(x)); }); skyTop.push(tt); }
    var fl2s = []; for (x = 0; x <= W; x += 8) fl2s.push(fl2(x));
    ANIM.hz = hz; ANIM.S = S; ANIM.sun = [sx, sy]; ANIM.moon = [mx, my, mr]; ANIM.skyTop = skyTop; ANIM.floor = fl2s; ANIM.falls = R.falls.map(function (f) { f.far = 1; return f; }).concat(M.falls);
    ANIM.cabin = {x: cabX, y: cabY, w: cw, h: chh, yb: lw.o.yb}; ANIM.kx1 = kx1; ANIM.ky = ky; ANIM.birch = [bx3, bby - bh * 0.7, bh]; ANIM.walls = [w2L.o, w2R.o]; ANIM.ktop = ktop;
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: water}};
};

// =============== 2. Storm Prairie: golden wheat to the horizon under a towering supercell, rain curtains and a lone windbreak
// a lens (one plate of the supercell's striated base): points, centre cx,cy, half width a, bulge up tu and down td
function n15_lens(cx, cy, a, tu, td, sk) { var top = [], bot = [], n = 28; for (var i = 0; i <= n; i++) { var u = i / n * 2 - 1, e = Math.sqrt(Math.max(0, 1 - u * u)); top.push([cx + u * a, cy - tu * Math.pow(e, 0.7) + u * sk]); bot.unshift([cx + u * a, cy + td * Math.pow(e, 0.9) + u * sk]); } return {top: top, bot: bot.slice().reverse(), pts: top.concat(bot)}; }
// a ripe wheat ear (static drawing): grains alternating along a short tilted spike, with awns
function n15_ear(o, x, y, L, ang, S) { var a = ang * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), n = 6, i;
  for (i = 0; i < n; i++) { var u = i / n, px = x + dx * L * u, py = y + dy * L * u, sd = i % 2 ? 1 : -1, gw = L * 0.13 * (1 - u * 0.35);
    o.e += n15_RE(px + dy * -sd * gw * 0.7 + dx * gw * 0.4, py - dx * -sd * gw * 0.7 + dy * gw * 0.4, gw * 1.05, gw * 0.62, ang - 90 + sd * 35);
    o.aw += 'M' + PT(px + dy * -sd * gw * 0.9 + dx * gw, py - dx * -sd * gw * 0.9 + dy * gw) + ' l' + n1(dx * L * 0.45 - dy * sd * L * 0.12) + ' ' + n1(dy * L * 0.45 + dx * sd * L * 0.12) + ' '; }
  o.e += n15_RE(x + dx * L * 0.98, y + dy * L * 0.98, L * 0.08, L * 0.05, ang - 90); }
SCENES.storm = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 0.9 : 1.3), refl = Lay(ph ? 0.35 : 0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, x, y;
  var hz = Math.round(H * (ph ? 0.6 : 0.665)), p1 = Math.round(hz / H * 100), sunX = ph ? 4 : 6, sunY = Math.round(p1 * 0.82);
  var sky = dk ? 'radial-gradient(40% 30% at 18% ' + sunY + '%,rgba(70,96,150,0.35) 0%,rgba(70,96,150,0) 100%),linear-gradient(180deg,#050A1C 0%,#0B1530 ' + Math.round(p1 * 0.4) + '%,#18264A ' + Math.round(p1 * 0.8) + '%,#2A3C64 ' + p1 + '%,#2A3C64 100%)'
    : 'radial-gradient(42% 46% at ' + sunX + '% ' + sunY + '%,rgba(255,226,170,0.85) 0%,rgba(255,226,170,0) 100%),linear-gradient(180deg,#46607E 0%,#6C86A4 ' + Math.round(p1 * 0.4) + '%,#A8B6BE ' + Math.round(p1 * 0.75) + '%,#EAD2A2 ' + p1 + '%,#EAD2A2 100%)';
  var cx = W * (ph ? 0.52 : 0.6), by = H * (ph ? 0.43 : 0.47), sc = ph ? 1 : S, BW = ph ? W * 0.62 : W * 0.37;
  // ---- far layer: the anvil spreading at the top (mammatus hanging under it), small clear-sky cumulus on the left, stars at night, distant rain
  var F = {a: '', b: '', c: '', d: '', e: '', f: '', g: ''}, ay = H * (ph ? 0.14 : 0.12), ax0 = W * (ph ? 0.05 : 0.22);
  var anv = []; for (x = ax0; x <= W + 80; x += 10) { var u = (x - ax0) / (W + 80 - ax0); anv.push([x, ay - H * 0.07 * Math.pow(Math.min(1, u * 5), 0.5) - Math.sin(u * 7 + 1) * 4 * sc - (Math.abs(x - cx) < BW * 0.5 ? H * 0.035 * Math.cos((x - cx) / BW * Math.PI) : 0)]); }
  var anvB = []; for (x = W + 80; x >= ax0; x -= 10) { var u2 = (x - ax0) / (W + 80 - ax0); anvB.push([x, ay + H * 0.012 + H * 0.035 * Math.min(1, u2 * 3) + Math.sin(u2 * 11) * 3 * sc]); }
  F.a += n15_P(anv.concat(anvB)); F.b += n15_P(anv.map(function (p) { return [p[0], p[1] - 0.5]; }).concat(anvB.map(function (p, j) { var y0 = n15_at(anv, p[0]); return [p[0], y0 + (p[1] - y0) * (0.5 + 0.12 * Math.sin(j * 0.21))]; })));
  for (i = 0; i < (ph ? 40 : 90); i++) { var mx2 = ax0 + W * 0.1 + rnd() * (W - ax0), my2 = n15_at(anvB, mx2), mr2 = (3 + rnd() * 4) * sc; if (my2 == null || Math.abs(mx2 - cx) < BW * 0.6) continue; F.d += n15_E(mx2, my2 - mr2 * 0.2, mr2 * 1.3, mr2); }
  var clL = ph ? [[0.12, 0.47, 70, 26]] : [[0.08, 0.56, 120, 34], [0.2, 0.6, 80, 22], [0.04, 0.42, 90, 26]];
  clL.forEach(function (q) { var c = n15_cumulus(W * q[0], H * q[1], q[2] * sc, q[3] * sc, rnd); if (c.base) F.c += n15_P(c.base); if (c.lit) F.g += n15_P(c.lit); });
  if (dk) { spread(0, 0, W * 0.5, hz * 0.85, 24, 24, rnd, 1).forEach(function (c) { if (c.q > 0.45 || c.x > ax0 + (c.y - ay) * 0.4 && c.y < ay + H * 0.06) return; if (c.x > cx - BW * 1.1 && c.y > ay) return; F.e += n15_C(c.x, c.y, 0.35 + c.r * c.r * 1.2); }); }
  // a far rain shaft on the left horizon
  var rcx = cx + BW * (ph ? 0.45 : 0.6), rTop = by - H * 0.02, curtain = function (x0, wd, fray) { var bb = function (x) { var e = (x - cx) / (BW * 1.02); return by - H * 0.045 + H * 0.03 * Math.sqrt(Math.max(0, 1 - e * e)) - 2; }, pts = [[x0 - wd, bb(x0 - wd)], [x0, bb(x0)], [x0 + wd, bb(x0 + wd)]], sl = H * 0.07, n = 14; for (var j = 0; j <= n; j++) { var u = 1 - j / n, xx = x0 - wd + 2 * wd * u - sl, yy = hz + 1 - fray * (0.5 + 0.5 * Math.sin(j * 0.9 + x0 * 0.01)) * 0.5; pts.push([xx, yy]); } return n15_smooth(pts, 2); };
  F.f += n15_P(curtain(rcx + BW * 0.05, BW * 0.36, H * 0.012)); F.f += n15_P(curtain(rcx + BW * 0.55, BW * 0.18, H * 0.01));
  add(far, 'a', F.a, dk ? '#1A2648' : '#9AA6BA'); add(far, 'b', F.b, dk ? '#33426E' : '#F4EADA'); add(far, 'c', F.c, dk ? '#1E2C50' : '#D8D2CC'); add(far, 'd', F.d, dk ? '#16203E' : '#8894AA');
  add(far, 'e', F.e, 'rgba(240,244,255,0.8)'); add(far, 'f', F.f, dk ? 'rgba(40,56,92,0.45)' : 'rgba(118,128,148,0.38)'); add(far, 'g', F.g, dk ? '#2A3A62' : '#FFF6E6');
  // ---- refl layer: the supercell: a cauliflower tower lit warm on its left, the striated plates of its base, the dark wall cloud, rain curtains
  var Rr = {a: '', b: '', c: '', d: '', e: '', f: '', s: '', t: ''}, tw = BW * (ph ? 0.42 : 0.5), ttop = ay + H * (ph ? 0.03 : 0.015), tbot = by - H * 0.15, bcy = by - H * 0.045;
  // the tower: rows of billows, lit warm on the left and up top, in shade on the right
  var nr = 15; for (i = 0; i <= nr; i++) { var v1 = i / nr, yy = tbot + (ttop - tbot) * v1, wv = tw * (1.1 - 0.35 * v1) * (1 + 0.07 * Math.sin(v1 * 9 + 1)), xc = cx + BW * 0.1 * v1 - BW * 0.03, nb = 6;
    for (k = 0; k < nb; k++) { var uk = k / (nb - 1), bx = xc - wv * 0.44 + wv * 0.88 * uk + (rnd() - 0.5) * wv * 0.05, rr2 = wv * (0.12 + rnd() * 0.05) * (k === 0 || k === nb - 1 ? 0.85 : 1), byy = yy + (rnd() - 0.5) * H * 0.014 - Math.sin(Math.PI * uk) * H * 0.008;
      Rr.b += n15_C(bx, byy, rr2);
      if (uk < 0.7 || i === nr) Rr.c += n15_C(bx - rr2 * 0.14, byy - rr2 * 0.16, rr2 * (uk < 0.3 ? 0.9 : 0.72));
      Rr.d += n15_C(bx + rr2 * 0.38, byy + rr2 * 0.42, rr2 * (uk > 0.5 ? 0.8 : 0.55)); } }
  // the striated base: a broad rounded lens with curved bands wrapping round it (the rotation), lit along their left ends
  var lensPts = function (cx0, cy0, a0, tu, td) { var o = [], n = 48; for (var j = 0; j < n; j++) { var t = j / n * Math.PI * 2, c0 = Math.cos(t), s0 = Math.sin(t), ex = Math.sign(c0) * Math.pow(Math.abs(c0), 0.75); o.push([cx0 + a0 * ex, cy0 + (s0 < 0 ? tu : td) * s0]); } return o; };
  var LP = n15_smooth(lensPts(cx, bcy, BW * 1.02, H * 0.1, H * 0.035).map(function (q, j) { var e = Math.abs(q[0] - cx) / BW; return [q[0], q[1] + (q[1] > bcy ? Math.sin(j * 1.7) * H * 0.006 * e : 0)]; }), 2); Rr.a += n15_P(LP);
  var baseBot = function (x) { var e = (x - cx) / (BW * 1.02); return bcy + H * 0.035 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(e), 1 / 0.75 * 2)), 0.5); };
  for (k = 0; k < 6; k++) { var sx3 = cx - BW * (0.98 - k * 0.07), sr3 = (5 + rnd() * 6) * sc; Rr.a += n15_E(sx3, baseBot(sx3) - sr3 * 0.2 + rnd() * 3, sr3 * 2.2, sr3); }
  // billows along the upper rim of the base, sunlit on the left
  var upper = LP.filter(function (q) { return q[1] < bcy; }).sort(function (a2, b2) { return a2[0] - b2[0]; });
  for (x = cx - BW * 0.94; x < cx + BW * 0.96; x += (9 + rnd() * 6) * sc) { var e = (x - cx) / BW; if (Math.abs(e + 0.05) < 0.28) continue; var uy = n15_at(upper, x); if (uy == null) continue; var rq = (9 + rnd() * 8) * sc * (1 - Math.abs(e) * 0.45);
    Rr.b += n15_C(x, uy + rq * 0.7, rq); if (e < -0.3) Rr.c += n15_C(x - rq * 0.15, uy + rq * 0.6, rq * 0.78); }
  var arcBand = function (cx0, cy0, rx, ry, th, a0, a1) { var o = [], ib = [], n = 30; for (var j = 0; j <= n; j++) { var t = a0 + (a1 - a0) * j / n, w = Math.sin(Math.PI * j / n); o.push([cx0 + Math.cos(t) * rx, cy0 + Math.sin(t) * ry]); ib.unshift([cx0 + Math.cos(t) * rx * 0.985, cy0 + Math.sin(t) * ry - th * w]); } return o.concat(ib); };
  for (i = 0; i < 3; i++) { var f = i / 2, ry0 = H * (0.035 + 0.015 * f), rx0 = BW * (0.95 - 0.18 * f), cy1 = bcy - H * 0.085 + H * 0.06 * f, th0 = H * (0.007 + 0.005 * f);
    Rr.b += n15_P(arcBand(cx + BW * 0.02 * (1 - f), cy1, rx0, ry0, th0, Math.PI * 0.08, Math.PI * 0.92));
    Rr.c += n15_P(arcBand(cx + BW * 0.02 * (1 - f), cy1, rx0, ry0, th0 * 0.9, Math.PI * 0.7, Math.PI * 0.95)); }
  Rr.d += n15_P(arcBand(cx, bcy + H * 0.005, BW * 0.95, H * 0.03, H * 0.012, Math.PI * 0.05, Math.PI * 0.5));
  // the dark wall cloud lowering under the core
  var wcx = cx - BW * 0.08, wcw = BW * 0.22, wtop = bcy + H * 0.025;
  Rr.e += n15_P(n15_smooth([[wcx - wcw * 1.4, wtop - H * 0.012], [wcx + wcw * 1.6, wtop - H * 0.012], [wcx + wcw * 1.2, wtop + H * 0.012], [wcx + wcw * 0.7, wtop + H * 0.03], [wcx + wcw * 0.2, wtop + H * 0.036], [wcx - wcw * 0.4, wtop + H * 0.03], [wcx - wcw * 0.9, wtop + H * 0.014]], 4));
  for (k = 0; k < 7; k++) { var sux = wcx - wcw * 0.9 + wcw * 1.9 * k / 6, suy = wtop + H * (0.012 + 0.018 * Math.sin(Math.PI * k / 6)), sur = (5 + rnd() * 6) * sc; Rr.e += n15_E(sux, suy, sur * 1.6, sur); }
  // rain curtains (the darker cores; the far layer holds their soft halo), with streaks
  Rr.f += n15_P(curtain(rcx - BW * 0.08, BW * 0.12, H * 0.02)); Rr.f += n15_P(curtain(rcx + BW * 0.14, BW * 0.08, H * 0.016)); Rr.f += n15_P(curtain(rcx + BW * 0.5, BW * 0.1, H * 0.02));
  for (k = 0; k < (ph ? 16 : 30); k++) { var sx2 = rcx - BW * 0.5 + rnd() * BW * 1.3, sy0 = rTop + H * 0.01 + rnd() * H * 0.04, ln0 = (hz - sy0) * (0.5 + rnd() * 0.45); Rr.t += 'M' + PT(sx2, sy0) + ' l' + n1(-ln0 * 0.07 / 0.12 * 0.12) + ' ' + n1(ln0) + ' '; }
  add(refl, 'a', Rr.a, dk ? '#1C2746' : '#56647C'); add(refl, 'b', Rr.b, dk ? '#25335A' : '#8E9CB0'); add(refl, 'c', Rr.c, dk ? '#36467A' : '#EEDCC0'); add(refl, 'd', Rr.d, dk ? 'rgba(4,8,24,0.3)' : 'rgba(46,58,84,0.32)');
  add(refl, 'e', Rr.e, dk ? '#121A32' : '#3E4A60'); add(refl, 'f', Rr.f, dk ? 'rgba(30,44,80,0.5)' : 'rgba(92,104,128,0.42)');
  stk(refl, 't', Rr.t, dk ? 'rgba(110,130,180,0.25)' : 'rgba(200,210,226,0.3)', 1.2);
  // ---- mid layer: the land: far prairie, the windbreak, golden fields with soft swathes and the storm's shadow, a two-track road
  var M = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''};
  var far1 = n15_fn(-60, W + 60, 10, function (x) { return hz + Math.sin(x / 140) * 1.2; }); M.a += below(far1, H + 40);
  var fieldTop = function (x) { return hz + H * 0.014 + Math.sin(x / 210 + 1) * 2 * sc; }, fld = n15_fn(-60, W + 60, 8, fieldTop); M.c += below(fld, H + 40);
  // distant shelterbelts as thin dark lines on the far prairie
  [[0.55, 0.2], [0.82, 0.12], [0.02, 0.1]].forEach(function (q) { var x0 = W * q[0], ln = W * q[1]; for (x = x0; x < x0 + ln; x += 3) { var hh = (2 + rnd() * 2.5) * S; M.b += n15_E(x, hz - hh * 0.3, 2.2 * S, hh); } });
  // the windbreak: a row of cottonwoods and poplars on the horizon
  var wb0 = W * (ph ? 0.06 : 0.1), wb1 = W * (ph ? 0.42 : 0.4), trees = [];
  for (x = wb0; x < wb1; x += (ph ? 6 : 9) * (0.7 + rnd() * 0.6)) { var tall = rnd() < 0.35, th = H * (tall ? 0.06 + rnd() * 0.02 : 0.038 + rnd() * 0.018) * (ph ? 0.85 : 1), base = hz + H * 0.006, tr = tall ? th * 0.16 : th * 0.36;
    trees.push([x, base, th]);
    if (tall) { M.b += n15_P(n15_smooth([[x, base - th], [x + tr, base - th * 0.6], [x + tr * 0.8, base - th * 0.2], [x, base], [x - tr * 0.8, base - th * 0.2], [x - tr, base - th * 0.6]], 3)); M.a += n15_P(n15_smooth([[x - tr * 0.2, base - th * 0.95], [x - tr * 0.4, base - th * 0.5], [x - tr * 0.85, base - th * 0.45], [x - tr * 0.7, base - th * 0.75]], 3)); }
    else { for (k = 0; k < 5; k++) { var bx2 = x + (rnd() - 0.5) * tr, byy = base - th * (0.45 + rnd() * 0.3), br2 = tr * (0.5 + rnd() * 0.3); M.b += n15_C(bx2, byy, br2); if (rnd() < 0.6) M.a += n15_C(bx2 - br2 * 0.3, byy - br2 * 0.3, br2 * 0.5); } M.b += rect(x - 0.8 * sc, base - th * 0.4, 1.6 * sc, th * 0.42); } }
  // fields: swathes of lighter and darker wheat rolling to the horizon, the shadow of the storm over the middle distance
  for (i = 0; i < (ph ? 8 : 11); i++) { var fy = fieldTop(0) + (H - hz) * Math.pow((i + 0.5) / 11, 1.6), th2 = (2 + Math.pow((i + 1) / 11, 1.5) * 26) * sc, ph2 = rnd() * 6, top2 = n15_fn(-60, W + 60, 12, function (x) { return fy + Math.sin(x / (120 + i * 30) + ph2) * th2 * 0.8; });
    M.d += n15_P(top2.concat(top2.slice().reverse().map(function (pp) { return [pp[0], pp[1] + th2 * (0.5 + 0.5 * Math.sin(pp[0] / 90 + ph2 * 2))]; }))); }
  var shx0 = W * (ph ? 0.4 : 0.48), shy0 = fieldTop(0), shd = n15_smooth([[shx0, shy0], [W + 60, shy0], [W + 60, hz + (H - hz) * 0.42], [W * 0.82, hz + (H - hz) * 0.36], [W * 0.66, hz + (H - hz) * 0.18], [shx0 + W * 0.05, shy0 + (H - hz) * 0.06]], 4);
  M.e += n15_P(shd);
  // the two-track road from the bottom to the windbreak, with a grassy middle strip and fence posts along its edge
  var vx = W * (ph ? 0.36 : 0.33), vy = fieldTop(vx), rd = function (v, off) { var yy = vy + (H + 30 - vy) * v * v, xx = vx + (W * (ph ? 0.72 : 0.6) - vx) * v * v + Math.sin(v * 3) * W * 0.02; return [xx + off * (2 + v * v * W * (ph ? 0.16 : 0.09)), yy]; };
  var rL = [], rR = [], gL = [], gR = []; for (i = 0; i <= 30; i++) { var v5 = i / 30; rL.push(rd(v5, -1)); rR.unshift(rd(v5, 1)); gL.push(rd(v5, -0.18)); gR.unshift(rd(v5, 0.18)); }
  M.g += n15_P(rL.concat(rR)); M.f += n15_P(gL.concat(gR));
  for (i = 1; i < 26; i++) { var v6 = Math.pow(i / 26, 0.85), pp2 = rd(v6, -1.35), ph3 = (3 + v6 * v6 * 40) * S; M.s += 'M' + PT(pp2[0], pp2[1]) + ' l0 ' + n1(-ph3) + ' '; if (i > 1) { var pq = rd(Math.pow((i - 1) / 26, 0.85), -1.35), pq3 = (3 + Math.pow((i - 1) / 26, 1.7) * 40) * S; M.t += 'M' + PT(pq[0], pq[1] - pq3 * 0.8) + ' L' + PT(pp2[0], pp2[1] - ph3 * 0.8) + ' '; } }
  // the near field: rows of wheat heads, tiny far away and bigger nearer (avoiding the road)
  var onRoad = function (x, y) { var v7 = Math.sqrt(Math.max(0, (y - vy) / (H + 30 - vy))), c = rd(v7, 0), hw = 2 + v7 * v7 * W * (ph ? 0.16 : 0.09); return Math.abs(x - c[0]) < hw * 1.5; };
  var heads = '', stems = '';
  for (var rr = 0; rr < (ph ? 22 : 30); rr++) { var v8 = (rr + 0.5) / (ph ? 22 : 30), ry = hz + H * 0.03 + (H * 0.86 - hz - H * 0.03) * Math.pow(v8, 1.5), hs = (1 + v8 * v8 * 9) * S * (ph ? 1.05 : 1), step = hs * 2 + 2;
    for (x = -10 + rnd() * step; x < W + 10; x += step * (0.6 + rnd() * 0.8)) { y = ry + (rnd() - 0.5) * step * 0.4; if (onRoad(x, y)) continue; var lean = (rnd() - 0.3) * hs * 0.4; heads += n15_RE(x + lean, y - hs * 1.6, hs * 0.32, hs * 0.9, lean * 4); if (v8 > 0.3) stems += 'M' + PT(x, y + hs) + ' L' + PT(x + lean, y - hs * 0.8) + ' '; } }
  M.h += heads;
  add(mid, 'a', M.a, dk ? '#1C2A3E' : '#9AA488'); add(mid, 'b', M.b, dk ? '#0C1424' : '#3A4A34'); add(mid, 'c', M.c, dk ? '#25304A' : '#D8A646');
  add(mid, 'd', M.d, dk ? 'rgba(140,160,210,0.07)' : 'rgba(255,236,170,0.3)'); add(mid, 'e', M.e, dk ? 'rgba(4,8,20,0.25)' : 'rgba(70,64,80,0.22)');
  add(mid, 'f', M.f, dk ? '#1E2A3A' : '#B8A060'); add(mid, 'g', M.g, dk ? '#2E3650' : '#D2BC8E'); add(mid, 'h', M.h, dk ? '#36425E' : '#F0C866');
  stk(mid, 's', M.s, dk ? '#141C2E' : '#6A5440', 1.4 * S + 0.4); stk(mid, 't', M.t + stems, dk ? 'rgba(90,104,136,0.5)' : 'rgba(150,110,50,0.45)', 0.8 * S + 0.3);
  // ---- near layer: the foreground wheat (the engine draws the swaying ears), chicory and coneflowers
  var N = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', aw: '', st: '', gr: ''};
  var wtop = function (x) { return H * (ph ? 0.9 : 0.86) + Math.sin(x / 70 + 1) * 6 * S + Math.sin(x / 23) * 3 * S + Math.sin(x / 9) * 2 * S; };
  var wt = n15_fn(-60, W + 60, 6, wtop); N.a += below(wt, H + 40);
  var bump = ''; for (x = -20; x < W + 20; x += (3 + rnd() * 5) * S) { var by3 = wtop(x) + 2 + rnd() * 10 * S; bump += n15_RE(x, by3, 2.6 * S + 1, 6 * S + 1.5, (rnd() - 0.4) * 36); }
  N.b += bump;
  var stalks = [], sstep = ph ? 9 : 13;
  for (x = -10; x < W + 20; x += sstep * (0.5 + rnd() * 0.8)) stalks.push({x: x, y: H + 6, h: H * (ph ? 0.15 : 0.21) * (0.6 + rnd() * 0.55), L: (ph ? 15 : 22) * S * (0.8 + rnd() * 0.4), lean: (rnd() - 0.45) * 0.3, ph: rnd() * 6.28});
  var flw = []; for (i = 0; i < (ph ? 7 : 12); i++) flw.push({x: rnd() * W, h: H * (ph ? 0.07 : 0.1) * (0.6 + rnd() * 0.5), k: rnd() < 0.55 ? 0 : 1, r: (ph ? 6 : 8) * S * (0.8 + rnd() * 0.4), ph: rnd() * 6.28});
  var grs = []; for (x = -10; x < W + 10; x += ph ? 6 : 8) grs.push({x: x + rnd() * 4, h: H * (ph ? 0.05 : 0.07) * (0.5 + rnd() * 0.7), lean: (rnd() - 0.5) * 0.6, ph: rnd() * 6.28});
  if (ANIM) {
    ANIM.hz = hz; ANIM.S = S; ANIM.sc = sc; ANIM.cx = cx; ANIM.by = by; ANIM.BW = BW; ANIM.ay = ay; ANIM.stalks = stalks; ANIM.flw = flw; ANIM.grs = grs; ANIM.rain = {x: rcx, w: BW * 0.5, top: rTop};
    ANIM.cloud = Rr.a + Rr.b + F.a; ANIM.sun = [W * sunX / 100, H * sunY / 100]; ANIM.ftop = fieldTop(0); ANIM.wb = [wb0, wb1]; ANIM.ax0 = ax0; ANIM.tower = [cx, ttop, tbot, tw];
  } else {
    var o = {e: '', aw: ''};
    grs.forEach(function (g) { var b = g.lean * g.h; N.gr += 'M' + PT(g.x, H + 4) + ' q' + n1(b * 0.3) + ' ' + n1(-g.h * 0.6) + ' ' + n1(b) + ' ' + n1(-g.h) + ' '; });
    stalks.forEach(function (s) { var hx = s.x + s.lean * s.h, hy = s.y - s.h; N.st += 'M' + PT(s.x, s.y) + ' Q' + PT(s.x + s.lean * s.h * 0.3, s.y - s.h * 0.6) + ' ' + PT(hx, hy) + ' '; n15_ear(o, hx, hy, s.L, s.lean * 60 + 8, S); });
    flw.forEach(function (fl) { var fx = fl.x, fy = H + 6 - fl.h; N.st += 'M' + PT(fx, H + 6) + ' L' + PT(fx + 2, fy) + ' ';
      if (fl.k === 0) { for (k = 0; k < 10; k++) { var a4 = k / 10 * Math.PI * 2; N.e += n15_RE(fx + 2 + Math.cos(a4) * fl.r * 0.55, fy + Math.sin(a4) * fl.r * 0.55, fl.r * 0.5, fl.r * 0.18, a4 * 180 / Math.PI); } N.g += n15_C(fx + 2, fy, fl.r * 0.18); }
      else { for (k = 0; k < 9; k++) { var a5 = Math.PI * (0.15 + k / 8 * 0.7); N.f += n15_RE(fx + 2 + Math.cos(a5) * fl.r * 0.6, fy + Math.sin(a5) * fl.r * 0.6, fl.r * 0.55, fl.r * 0.16, a5 * 180 / Math.PI); } N.g += n15_E(fx + 2, fy - fl.r * 0.1, fl.r * 0.34, fl.r * 0.3); } });
    N.c += o.e; N.aw += o.aw;
  }
  add(near, 'a', N.a, dk ? '#1E2638' : '#B8842C'); add(near, 'b', N.b, dk ? '#2C364E' : '#E2B24C'); add(near, 'c', N.c, dk ? '#4A5470' : '#F4D27C');
  add(near, 'e', N.e, dk ? '#4A5E9E' : '#7E9EEA'); add(near, 'f', N.f, dk ? '#7A4A72' : '#D0729E'); add(near, 'g', N.g, dk ? '#2A2030' : '#6A3E1E');
  stk(near, 's', N.st, dk ? '#3A4460' : '#C0903A', 1.5 * S + 0.5); stk(near, 't', N.aw + N.gr, dk ? '#4A5470' : '#E8C26A', 0.9 * S + 0.3);
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
