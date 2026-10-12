// ---- batch n11: glowbay (Glowing Bay)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n11_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n11_P(pts) { return pts.length > 2 ? poly(n11_cw(pts)) : ''; }
function n11_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n11_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n11_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n11_P(rotp(p, x, y, ang)); }
function n11_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n11_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
// a leaf outline: base at (x,y), pointing along ang (degrees)
function n11_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 12; i++) { var t = i / 12, ww = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n11_leaf(x, y, len, w, ang, bend) { return n11_P(n11_leafPts(x, y, len, w, ang, bend)); }
// a lumpy round outline as points
function n11_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
// open Catmull-Rom through a list of points (end points kept)
function n11_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n11_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// a tapered band from (x0,y0) to (x1,y1), bowed sideways by bend
function n11_limb(x0, y0, x1, y1, w0, w1, bend) { var L = [], R = [], n = 8; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); } return n11_P(L.concat(R.reverse())); }

// =============== 1. Glowing Bay: a sheltered tropical cove between dark rock headlands, a crescent of beach and leaning palms
// a curved palm trunk from (x0,y0) to (x1,y1), as a tapered band, plus its ring marks
function n11_trunk(x0, y0, x1, y1, bend, w0, w1) { var L = [], R = [], rings = '', n = 18; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = (x1 - x0) + Math.cos(Math.PI * u) * Math.PI * bend, dy = y1 - y0, dl = Math.hypot(dx, dy), w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); if (i > 0 && i < n) rings += 'M' + PT(x - dy / dl * w * 0.92, y + dx / dl * w * 0.92 + 2) + ' Q' + PT(x, y + 4) + ' ' + PT(x + dy / dl * w * 0.92, y - dx / dl * w * 0.92 + 2) + ' '; } return {d: n11_P(L.concat(R.reverse())), rings: rings}; }
// a palm frond: a curved rib with leaflets, from (x,y) at angle a (radians), length L, droop d
function n11_frond(x, y, a, L, d) { var rib = [], i, out = ''; for (i = 0; i <= 10; i++) { var u = i / 10, aa = a + d * u * u; rib.push([x + Math.cos(aa) * L * u, y + Math.sin(aa) * L * u + d * 0.3 * L * u * u]); }
  for (i = 1; i < rib.length; i++) { var p = rib[i - 1], q = rib[i], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, u2 = i / 10, w = L * 0.21 * Math.sin(Math.PI * Math.min(1, u2 * 1.1)) + 1;
    out += n11_P([[p[0], p[1]], [q[0] + (-dy / dl) * w * 0.3 + dx * 0.6, q[1] + (dx / dl) * w * 0.3 + dy * 0.6 + w * 0.9], [q[0], q[1]]]) + n11_P([[p[0], p[1]], [q[0] - (-dy / dl) * w * 0.3 + dx * 0.6, q[1] - (dx / dl) * w * 0.3 + dy * 0.6 + w * 0.2], [q[0], q[1]]]); }
  return out; }
// angular facets inside a rock outline, hanging down from points along its top edge (each kept fully inside the rock)
function n11_facets(rock, prof, i0, i1, stp, rnd, lmin, lmax, sel, o) { for (var i = i0; i + stp <= i1; i += stp) { var a = prof[i], b = prof[i + stp], len = lmin + rnd() * (lmax - lmin), jx = (rnd() - 0.5) * len * 0.5, ok = false;
    for (var tries = 0; tries < 6 && !ok; tries++) { var c = [b[0] + jx, b[1] + len], d = [a[0] + jx * 0.6, a[1] + len * (0.55 + rnd() * 0.3)]; if (n11_inPoly(rock, c[0], c[1]) && n11_inPoly(rock, d[0], d[1])) { ok = true; o[sel(i)] += n11_P([[a[0], a[1] + 1], [b[0], b[1] + 1], c, d]); } len *= 0.65; } } }
SCENES.glowbay = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, k;
  var hz = H * (ph ? 0.42 : 0.46), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#02061A 0%,#061030 ' + Math.round(p1 * 0.45) + '%,#0C2250 ' + Math.round(p1 * 0.85) + '%,#183A68 ' + p1 + '%,#183A68 100%)' : 'linear-gradient(180deg,#48A0CE 0%,#84C2DA ' + Math.round(p1 * 0.42) + '%,#E4D8B2 ' + Math.round(p1 * 0.8) + '%,#F6BE8E ' + p1 + '%,#F6BE8E 100%)';
  var sea = dk ? 'linear-gradient(180deg,#163A5E 0%,#0B2747 12%,#071C36 48%,#04132A 100%)' : 'linear-gradient(180deg,#A6DCCC 0%,#52C4C2 12%,#23AABA 48%,#1590A8 100%)';
  var sx = W * (ph ? 0.5 : 0.56), sy = hz - H * (ph ? 0.075 : 0.09), sr = ph ? 20 : 30, mx = W * (ph ? 0.2 : 0.17), my = H * (ph ? 0.15 : 0.12), mr = ph ? 12 : 17;
  if (dk) {
    add(far, 'a', n11_E(W * 0.5, hz, W * 0.75, H * 0.1), 'rgba(50,110,170,0.22)');
    // the Milky Way: a soft diagonal band with a brighter core, crowded with tiny stars
    var mw = '', mwc = '', ang = Math.atan2(-hz * 0.95, W * 0.9) * 180 / Math.PI, st = '';
    for (i = 0; i <= 44; i++) { var u = i / 44, cx = W * (0.08 + u * 0.9), cy = hz * (0.98 - u * 1.0), wv = Math.sin(u * 9) * 10 * S; mw += n11_RE(cx, cy + wv, W * 0.07 * (0.8 + rnd() * 0.4), H * (0.045 + rnd() * 0.025), ang + (rnd() - 0.5) * 8); if (u > 0.12 && u < 0.88) mwc += n11_RE(cx + (rnd() - 0.5) * 10, cy + wv, W * 0.05, H * 0.022, ang); }
    add(far, 'd', mw, 'rgba(130,150,255,0.08)'); add(far, 'e', mwc, 'rgba(210,200,255,0.08)');
    spread(0, 0, W, hz, 22, 22, rnd, 1).forEach(function (c) { if (c.q < 0.42 && Math.hypot(c.x - mx, c.y - my) > mr * 2.5) st += n11_C(c.x, c.y, 0.4 + c.r * 1.1); });
    for (i = 0; i < (ph ? 120 : 320); i++) { var u2 = rnd(), d2 = (rnd() + rnd() - 1) * H * 0.08, cx2 = W * (0.08 + u2 * 0.9), cy2 = hz * (0.98 - u2) + Math.sin(u2 * 9) * 10 * S + d2; if (cy2 < hz - 6 && Math.hypot(cx2 - mx, cy2 - my) > mr * 2.5) st += n11_C(cx2, cy2, 0.35 + rnd() * 0.6); }
    add(far, 'b', st, 'rgba(240,244,255,0.85)');
    add(far, 'c', 'M' + PT(mx, my - mr) + ' A' + n1(mr) + ' ' + n1(mr) + ' 0 1 1 ' + PT(mx, my + mr) + ' A' + n1(mr * 0.62) + ' ' + n1(mr) + ' 0 1 0 ' + PT(mx, my - mr) + ' Z ', '#FFF6DA');
    add(far, 'h', n11_C(mx, my, mr * 2.6), 'rgba(220,230,255,0.08)');
  } else {
    add(far, 'a', n11_C(sx, sy, sr * 3.4), 'rgba(255,212,150,0.16)'); add(far, 'b', n11_C(sx, sy, sr * 2.2), 'rgba(255,230,180,0.3)'); add(far, 'h', n11_C(sx, sy, sr * 1.45), 'rgba(255,244,214,0.5)'); add(far, 'c', n11_C(sx, sy, sr), '#FFF6DA');
    // golden-hour streak clouds, lit from below by the low sun
    var cb2 = '', cl2 = ''; spread(0, H * 0.05, W, hz * 0.62, ph ? 180 : 300, 70, rnd, 0.8).forEach(function (c) { if (c.q > 0.6 || Math.hypot(c.x - sx, c.y - sy) < 140) return; var w = (ph ? 70 : 130) * (0.6 + c.r * 0.8), hh = w * 0.12; cb2 += n11_E(c.x, c.y, w, hh) + n11_E(c.x - w * 0.35, c.y - hh * 0.8, w * 0.45, hh * 1.1) + n11_E(c.x + w * 0.3, c.y - hh * 0.6, w * 0.5, hh); cl2 += n11_E(c.x + w * 0.05, c.y + hh * 0.45, w * 0.82, hh * 0.45); });
    add(far, 'd', cb2, 'rgba(240,184,160,0.7)'); add(far, 'e', cl2, 'rgba(255,226,180,0.9)');
  }
  // distant islands on the horizon
  var isl = ''; [[0.42, 0.06, 0.011], [0.5, 0.035, 0.007], [0.66, 0.05, 0.009]].forEach(function (q) { var cx = W * q[0], rw = W * q[1] * (ph ? 1.6 : 1), rh = H * q[2], p = []; for (var j = 0; j <= 16; j++) { var t = j / 16 * 2 - 1; p.push([cx + t * rw, hz + 1 - rh * Math.pow(1 - t * t, 0.7) * (1 + 0.15 * Math.sin(t * 7))]); } isl += n11_P(p); });
  add(far, 'f', isl, dk ? '#0E1C34' : '#8AAEAA');
  // the sea: the sun's glitter path, darker reef patches and the pale shallows inside the cove
  var yC = H * (ph ? 0.74 : 0.76), Dp = H * (ph ? 0.075 : 0.095), shoreY = function (x) { var u = x / W * 2 - 1; return yC - Dp * u * u + Math.sin(x / 70) * 2 * S; };
  var shore = n11_fn(-60, W + 60, 6, shoreY), mouthY = hz + H * (ph ? 0.08 : 0.1);
  if (!dk) { var gl = ''; for (i = 0; i < 30; i++) { var gy = hz + 3 + i * i * 0.34 * (ph ? 0.7 : 1), gw = 5 + i * 2.6; if (gy > yC - Dp) break; gl += n11_E(sx + (rnd() - 0.5) * gw * 2, gy, gw * (0.35 + rnd() * 0.6), 1.2 + i * 0.04); } add(refl, 'a', gl, 'rgba(255,244,210,0.8)'); }
  var reef = ''; spread(W * 0.15, mouthY + H * 0.02, W * 0.7, (yC - Dp) - mouthY, ph ? 120 : 200, H * 0.05, rnd, 0.9).forEach(function (c) { if (c.q < 0.5) { var rw = (ph ? 26 : 50) * (0.6 + c.r * 0.8); reef += n11_E(c.x, c.y, rw, rw * 0.12) + n11_E(c.x + rw * 0.5, c.y + rw * 0.05, rw * 0.55, rw * 0.08); } });
  add(refl, 'b', reef, dk ? 'rgba(0,8,22,0.3)' : 'rgba(18,110,128,0.2)');
  add(refl, 'c', n11_P(shore.map(function (p) { return [p[0], p[1] - H * 0.12 * (0.7 + 0.3 * Math.cos((p[0] / W - 0.5) * 3))]; }).concat(shore.slice().reverse().map(function (p) { return [p[0], p[1] + 4]; }))), dk ? 'rgba(20,70,120,0.3)' : 'rgba(120,226,214,0.45)');
  add(mid, 'a', n11_P(shore.map(function (p) { return [p[0], p[1] - H * 0.045]; }).concat(shore.slice().reverse().map(function (p) { return [p[0], p[1] + 4]; }))), dk ? '#0E2E4C' : '#7FDCD0');
  // the beach: dry sand and the darker wet band the waves reach
  add(mid, 'b', below(shore, H + 40), dk ? '#2E3A56' : '#F6E4C0');
  add(mid, 'c', n11_P(shore.concat(shore.slice().reverse().map(function (p) { var u = p[0] / W * 2 - 1; return [p[0], p[1] + H * (0.03 + 0.01 * (1 - u * u))]; }))), dk ? '#232E4A' : '#E2CBA0');
  // the two dark rock headlands that shelter the cove
  var mf = mouthY / H, LP = ph ? [[-0.12, 0.29], [0.05, 0.27], [0.12, 0.3], [0.17, 0.34], [0.2, 0.38], [0.225, 0.42], [0.24, mf]] : [[-0.08, 0.3], [0.03, 0.275], [0.085, 0.29], [0.13, 0.32], [0.165, 0.36], [0.19, 0.4], [0.21, 0.44], [0.225, 0.49], [0.232, mf]];
  var RP = ph ? [[1.12, 0.27], [0.95, 0.25], [0.88, 0.28], [0.83, 0.33], [0.8, 0.38], [0.775, 0.43], [0.76, mf]] : [[1.08, 0.27], [0.97, 0.245], [0.92, 0.26], [0.87, 0.3], [0.835, 0.345], [0.81, 0.39], [0.79, 0.44], [0.777, 0.49], [0.77, mf]];
  var xbL = W * (ph ? 0.08 : 0.11), xbR = W * (ph ? 0.92 : 0.89), rockAll = '', rocks = [], heads = [];
  [[LP, xbL, -1], [RP, xbR, 1]].forEach(function (q) { var prof = n11_curve(q[0].map(function (p) { return [W * p[0], H * p[1]]; }), 6), cf = prof[prof.length - 1], wl = [], ex = q[2] < 0 ? -80 : W + 80;
    for (k = 1; k <= 10; k++) { var t = k / 10; wl.push([cf[0] + (q[1] - cf[0]) * t, cf[1] + (shoreY(q[1]) - 2 - cf[1]) * Math.pow(t, 0.8) + Math.sin(Math.PI * t) * H * 0.012]); }
    var pts = prof.concat(wl, [[q[1] + q[2] * W * 0.06, shoreY(q[1]) + H * 0.02], [ex, H * 0.8], [ex, prof[0][1]]]);
    rocks.push(pts); rockAll += n11_P(pts); heads.push({prof: prof, cf: cf, xb: q[1], side: q[2]}); });
  add(mid, 'd', rockAll, dk ? '#141C32' : '#4E4652');
  var fc = {e: '', f: ''}; heads.forEach(function (hd, j) { var pr = hd.prof, n = pr.length, cut = Math.round(n * 0.55);
    n11_facets(rocks[j], pr, 2, n - 1, 2, rnd, H * 0.06, H * 0.2, function (ii) { return ii > cut ? 'f' : 'e'; }, fc);
    for (k = cut; k < n - 1; k++) { var a = pr[k], b = pr[k + 1]; fc.f += n11_P([[a[0], a[1]], [b[0], b[1]], [b[0] - hd.side * 3 * S, b[1] + 3 * S], [a[0] - hd.side * 3 * S, a[1] + 3 * S]]); }
    for (k = 0; k < (ph ? 4 : 7); k++) { var t2 = 0.15 + k / (ph ? 4 : 7) * 0.75, p0 = pr[Math.floor(t2 * (n - 1))], len = H * (0.05 + rnd() * 0.08), c1 = [p0[0] + (rnd() - 0.5) * 8, p0[1] + H * 0.03 + len]; if (n11_inPoly(rocks[j], c1[0], c1[1])) fc.e += n11_P([[p0[0] - 1.5, p0[1] + H * 0.03], [p0[0] + 1.5, p0[1] + H * 0.03], [c1[0] + 0.6, c1[1]], [c1[0] - 0.6, c1[1]]]); } });
  // boulders at the feet of the headlands, half in the water
  var bq = ph ? [[0.1, -0.006, 16], [0.15, 0.012, 9], [0.2, -0.04, 11], [0.9, -0.006, 15], [0.84, 0.014, 8], [0.79, -0.04, 10]] : [[0.12, -0.006, 26], [0.165, 0.014, 14], [0.19, -0.05, 17], [0.215, -0.085, 11], [0.88, -0.008, 24], [0.835, 0.012, 13], [0.81, -0.05, 16], [0.785, -0.088, 11]], spl = [];
  bq.forEach(function (q) { var x0 = W * q[0], y0 = shoreY(x0) + H * q[1], r = q[2] * (ph ? 1 : S), p = n11_blob(x0, y0, r, r * 0.62, rnd, 12, 0.18); p = p.map(function (pp) { return [pp[0], Math.min(pp[1], y0 + r * 0.3)]; });
    rockAll += n11_P(p); add(mid, 'd', n11_P(p)); fc.e += n11_P(p.filter(function (pp) { return pp[0] > x0 - r * 0.1; }).concat([[x0, y0 + r * 0.3]])); fc.f += n11_P(n11_blob(x0 - r * 0.3, y0 - r * 0.32, r * 0.42, r * 0.18, rnd, 8, 0.15)); spl.push([x0, y0 - r * 0.2, r]); });
  heads.forEach(function (hd) { spl.push([hd.cf[0] - hd.side * 6, hd.cf[1] + 2, (ph ? 18 : 30) * S]); });
  add(mid, 'e', fc.e, dk ? '#0B1222' : '#3A3240'); add(mid, 'f', fc.f, dk ? '#25426A' : '#86686A');
  // jungle on the headland tops, with a few small palms
  var vg = {d: '', l: ''}; heads.forEach(function (hd) { var pr = hd.prof, n = Math.round(pr.length * 0.62), top = [], bot = [];
    for (k = 0; k < n; k++) { var p = pr[k], th = H * (0.035 + 0.02 * Math.sin(k * 0.7)) * (1 - k / n * 0.6); top.push([p[0], p[1] - 2]); bot.unshift([p[0], p[1] + th]); { var r = (ph ? 8 : 13) * S * (0.6 + rnd() * 0.8) * (ph ? 1.3 : 1) * (1 - k / n * 0.4); vg.d += n11_C(p[0] + (rnd() - 0.5) * r, p[1] + r * 0.35, r); if (k % 2 && rnd() < 0.6) vg.l += n11_C(p[0] - hd.side * r * 0.2, p[1] + r * 0.05, r * 0.5); } }
    vg.d += n11_P(top.concat(bot));
    [0.18, 0.4].forEach(function (f, j) { var p = pr[Math.floor(f * n)], hh = (ph ? 26 : 42) * S * (j ? 0.8 : 1) * (ph ? 1.3 : 1), lean = hd.side * -0.25 * hh, tx = p[0] + lean, ty = p[1] - hh; vg.d += n11_limb(p[0], p[1] + 2, tx, ty, 1.8 * S + 0.6, 1 * S + 0.4, hd.side * 4); for (var m = 0; m < 7; m++) vg.d += n11_leaf(tx, ty, hh * 0.42, hh * 0.07, -175 + m * 28 + (rnd() - 0.5) * 10, 0.3 * (m < 3 ? -1 : 1)); }); });
  add(mid, 'g', vg.d, dk ? '#0C1C20' : '#3E5A34'); add(mid, 'h', vg.l, dk ? '#122A2A' : '#5E7C3C');
  // the still picture's shoreline: a soft glow band and its bright edge (the engine draws moving waves instead)
  var foam = '', foam2 = '', sl = shore.filter(function (p) { return p[0] > xbL + W * 0.02 && p[0] < xbR - W * 0.02; });
  if (!ANIM) { foam += pline(sl.map(function (p) { return [p[0], p[1] + 2]; }));
    [0.45, 0.72].forEach(function (u) { var xa = heads[0].cf[0] + (xbL - heads[0].cf[0]) * u + W * 0.05, xz = heads[1].cf[0] + (xbR - heads[1].cf[0]) * u - W * 0.05, run = []; for (x = xa; x <= xz; x += 8) { var on = Math.sin(x / 37 + u * 9) + Math.sin(x / 13) * 0.4 > -0.3; if (on) run.push([x, mouthY + (shoreY(x) - mouthY) * Math.pow(u, 1.2) + Math.sin(x / 40) * 2]); else { if (run.length > 2) foam2 += pline(run); run = []; } } if (run.length > 2) foam2 += pline(run); });
    foam2 += pline(sl.map(function (p) { return [p[0], p[1] + 2]; })); }
  stk(mid, 's', foam, dk ? 'rgba(60,220,255,0.35)' : 'rgba(255,255,255,0.45)', 12 * S + 2); stk(mid, 't', foam2, dk ? '#8FF4FF' : '#FFFFFF', 2.4 * S + 0.6);
  // leaning palms over the beach (the engine draws their crowns so the fronds can sway)
  var palms = ph ? [[0.05, 0.22, 0.38, 24], [0.98, 0.82, 0.47, -20]] : [[0.08, 0.19, 0.33, 40], [0.03, -0.03, 0.5, -26], [0.96, 0.85, 0.4, -30]], tr = '', rings = '', crowns = [];
  palms.forEach(function (q) { var T = n11_trunk(W * q[0], H + 30, W * q[1], H * q[2], q[3] * S, (ph ? 15 : 15) * S, (ph ? 8 : 8) * S); tr += T.d; rings += T.rings; crowns.push({x: W * q[1], y: H * q[2], L: (ph ? 105 : 128) * S, ph: rnd() * 6.28}); });
  var dune = ''; [0.86, 0.95].forEach(function (f, j) { var top = n11_fn(-60, W + 60, 12, function (x) { return H * f + Math.sin(x / (160 + j * 70) + j * 2) * 12 * S + Math.sin(x / 47) * 3; }); dune += n11_P(top.concat(top.slice().reverse().map(function (p) { return [p[0], p[1] + (14 + j * 10) * S * (0.6 + 0.4 * Math.sin(p[0] / 90 + j))]; }))); });
  var rip = ''; spread(0, yC + H * 0.06, W, H - yC - H * 0.08, ph ? 70 : 110, 26, rnd, 1).forEach(function (c) { if (c.q < 0.55) { var w = (ph ? 18 : 30) * (0.6 + c.r * 0.8); rip += n11_P([[c.x - w, c.y], [c.x, c.y - 2.2 * S], [c.x + w, c.y], [c.x, c.y + 1.2 * S]]); } });
  add(near, 'a', dune + rip, dk ? 'rgba(14,22,40,0.28)' : 'rgba(206,168,118,0.28)');
  add(near, 'b', tr, dk ? '#1C2232' : '#9A7452'); stk(near, 's', rings, dk ? 'rgba(4,8,16,0.55)' : 'rgba(90,60,40,0.45)', ph ? 1.2 : 2);
  // sea grape bushes in the corners, beach grass, shells and fallen coconuts on the sand
  var sg = {d: '', l: ''}, grass = '';
  (ph ? [[0.04, 1.0, 1.0], [0.97, 1.01, 0.9]] : [[0.03, 1.0, 1.4], [0.2, 1.03, 0.8], [0.84, 1.03, 0.9], [0.98, 1.0, 1.3]]).forEach(function (q) { var x0 = W * q[0], y0 = H * q[1], s = q[2] * S * (ph ? 1.3 : 1);
    for (k = 0; k < 14; k++) { var a = Math.PI * (1.05 + rnd() * 0.9), rr = (22 + rnd() * 34) * s, lx = x0 + Math.cos(a) * rr * 1.3, ly = y0 + Math.sin(a) * rr * 0.9, lr = (9 + rnd() * 6) * s; sg.d += n11_C(lx, ly, lr); if (rnd() < 0.6) sg.l += n11_C(lx - lr * 0.2, ly - lr * 0.25, lr * 0.6); }
    for (k = 0; k < 7; k++) { var gx = x0 + (rnd() - 0.5) * 90 * s, gh = (24 + rnd() * 26) * s, gb = (rnd() - 0.5) * gh * 0.8; grass += 'M' + PT(gx, y0 - 14 * s) + ' q' + n1(gb * 0.3) + ' ' + n1(-gh * 0.6) + ' ' + n1(gb) + ' ' + n1(-gh) + ' '; } });
  add(near, 'c', sg.d, dk ? '#0E1E22' : '#3E7A3E'); add(near, 'd', sg.l, dk ? '#16302E' : '#6AAA52'); stk(near, 't', grass, dk ? '#25403E' : '#8AB25A', 1.8 * S + 0.6);
  var sh = '', nut = ''; (ph ? [[0.3, 0.9], [0.64, 0.95], [0.5, 0.84]] : [[0.32, 0.9], [0.44, 0.96], [0.6, 0.87], [0.7, 0.94], [0.26, 0.83]]).forEach(function (q, j) { var x0 = W * q[0], y0 = H * q[1], s = (ph ? 0.8 : 1) * S; if (j % 2) sh += n11_P([[x0 - 7 * s, y0 + 2 * s], [x0, y0 - 6 * s], [x0 + 7 * s, y0 + 2 * s], [x0 + 3 * s, y0 + 4 * s], [x0 - 3 * s, y0 + 4 * s]]); else sh += n11_RE(x0, y0, 6 * s, 3.6 * s, -20) + n11_C(x0 - 5 * s, y0 + 1 * s, 2 * s); });
  add(near, 'e', sh, dk ? '#4A5878' : '#F7D6C6');
  var pb = ph ? [[0.2, 0.93], [0.25, 0.95]] : [[0.16, 0.93], [0.19, 0.95]]; pb.forEach(function (q) { nut += n11_C(W * q[0], H * q[1], (ph ? 6 : 9) * S); });
  nut += n11_limb(W * (ph ? 0.6 : 0.62), H * 0.975, W * (ph ? 0.82 : 0.76), H * 0.955, (ph ? 4 : 7) * S, (ph ? 3 : 5) * S, -3 * S) + n11_limb(W * (ph ? 0.72 : 0.7), H * 0.965, W * (ph ? 0.75 : 0.72), H * 0.93, 2 * S, 1 * S, 0);
  add(near, 'f', nut, dk ? '#262A36' : '#8A6A4A');
  // stars that may twinkle: only open sky above the rocks
  var skyTop = function (x) { var lim = hz - 6; heads.forEach(function (hd) { var pr = hd.prof; if ((hd.side < 0 && x <= hd.cf[0] + 10) || (hd.side > 0 && x >= hd.cf[0] - 10)) { var best = 1e9; pr.forEach(function (p) { if (Math.abs(p[0] - x) < 14) best = Math.min(best, p[1]); }); if (best < 1e9) lim = Math.min(lim, best - 12); } }); return lim; };
  if (ANIM) {
    var tw = []; for (i = 0; i < 400 && tw.length < (ph ? 24 : 50); i++) { var tx = rnd() * W, ty = rnd() * hz; if (ty < skyTop(tx) && Math.hypot(tx - mx, ty - my) > mr * 3) tw.push([tx, ty, rnd()]); }
    ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.shore = shore; ANIM.mouthY = mouthY; ANIM.cove = {cl: heads[0].cf[0], cr: heads[1].cf[0], bl: xbL, br: xbR}; ANIM.rmask = rockAll; ANIM.splash = spl; ANIM.crowns = crowns;
    ANIM.sun = [sx, sy, sr]; ANIM.moon = [mx, my, mr]; ANIM.tw = tw; ANIM.yC = yC; ANIM.Dp = Dp;
  } else {
    var fr = '', cn = ''; crowns.forEach(function (c) { for (k = 0; k < 9; k++) fr += n11_frond(c.x, c.y, -Math.PI + k * Math.PI / 8 - 0.15, c.L * (0.8 + (k % 2) * 0.2), 0.9); cn += n11_C(c.x - 5 * S, c.y + 7 * S, 5 * S + 1) + n11_C(c.x + 5 * S, c.y + 8 * S, 5 * S + 1); });
    add(near, 'f', cn); add(near, 'g', fr, dk ? '#11261F' : '#4E9A4A');
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: sea}};
};
