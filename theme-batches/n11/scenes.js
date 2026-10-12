// ---- batch n11: meadow (Poppy Meadow), glowbay (Glowing Bay)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n11_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n11_P(pts) { return pts.length > 2 ? poly(n11_cw(pts)) : ''; }
function n11_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n11_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n11_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n11_P(rotp(p, x, y, ang)); }
function n11_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n11_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n11_dot(x, y) { return 'M' + PT(x, y) + ' h0.01 '; }
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
function n11_starPts(x, y, R, r, n, rot) { var p = []; for (var i = 0; i < n * 2; i++) { var a = rot + i * Math.PI / n - Math.PI / 2, q = i % 2 ? r : R; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return p; }
// a flat-bottomed summer cumulus: towers of round bumps over a level base; base = the shadowed underside, lit = the sunny top
function n11_cumulus(x, base, w, h, rnd) { var B = [], n = 6, i;
  for (i = 0; i < n; i++) { var u = (i + 0.5) / n - 0.5, c = Math.cos(u * Math.PI); B.push([x + u * w * 0.8, base - h * (0.04 + 0.36 * c), h * (0.12 + 0.32 * c) * (0.85 + rnd() * 0.3)]); }
  B.push([x - w * 0.1 + (rnd() - 0.5) * w * 0.1, base - h * 0.62, h * 0.3]); B.push([x + w * 0.12, base - h * 0.7, h * 0.26]); B.push([x + w * 0.02 + (rnd() - 0.5) * w * 0.08, base - h * 0.84, h * 0.2]);
  function out(sh, dx, dy, by) { var top = []; for (var xx = x - w * 0.64; xx <= x + w * 0.64; xx += w / 80) { var yy = by; B.forEach(function (b) { var r = b[2] * sh, d = xx - b[0] - dx; if (Math.abs(d) < r) yy = Math.min(yy, b[1] + dy - Math.sqrt(r * r - d * d)); }); if (yy < by - 0.5) top.push([xx, yy]); } return top.length > 2 ? n11_P(top.concat([[top[top.length - 1][0], by], [top[0][0], by]])) : ''; }
  return {base: out(1, 0, 0, base), lit: out(0.93, -w * 0.025, -h * 0.04, base - h * 0.12), box: [x - w * 0.64, base - h * 1.1, x + w * 0.64, base]}; }
// a mountain range: body, snow caps over the peaks above the snow line, and the shaded right faces (drawn after the snow, so it shades it too)
function n11_range(W, base, y0, dy, np, rnd, snowLine) { var pk = [], m, i, k; for (i = 0; i <= np; i++) pk.push([W * (i / np) + (rnd() - 0.5) * W / np * 0.5, y0 + rnd() * dy]);
  m = [[-120, base - (base - pk[0][1]) * 0.4]];
  for (i = 0; i < pk.length; i++) { m.push(pk[i]); var nx = i < pk.length - 1 ? pk[i + 1] : [W + 140, base - (base - pk[i][1]) * 0.3], lo = Math.max(pk[i][1], nx[1]); m.push([(pk[i][0] + nx[0]) / 2 + (rnd() - 0.5) * 24, lo + (base - lo) * (0.25 + rnd() * 0.25)]); }
  var snow = '', shade = '';
  for (i = 1; i < m.length - 1; i += 2) { var p = m[i], sl = m[i - 1], sr = m[i + 1];
    shade += n11_P([p, sr, [sr[0] - (sr[0] - p[0]) * 0.3, sr[1] + (base - sr[1]) * 0.55], [p[0] + (sr[0] - p[0]) * 0.38, base + 80], [p[0] + (sr[0] - p[0]) * 0.12, base + 80]]);
    if (p[1] < snowLine) { var fr = Math.min(0.62, (snowLine - p[1]) / (base - p[1]) + 0.18 + rnd() * 0.12), A1 = [p[0] + (sr[0] - p[0]) * fr, p[1] + (sr[1] - p[1]) * fr], B1 = [p[0] + (sl[0] - p[0]) * fr, p[1] + (sl[1] - p[1]) * fr], pts = [p, A1];
      for (k = 1; k < 7; k++) { var u = k / 7; pts.push([A1[0] + (B1[0] - A1[0]) * u, A1[1] + (B1[1] - A1[1]) * u + (k % 2 ? -1 : 1) * (A1[1] - p[1]) * 0.18]); } pts.push(B1); snow += n11_P(pts); } }
  return {body: n11_P(m.concat([[W + 140, base + 80], [-120, base + 80]])), snow: snow, shade: shade, pts: m}; }

// =============== 1. Poppy Meadow: a rolling alpine meadow of poppies, cornflowers and daisies, a stream, a lone oak and blue mountains
// a lone oak: flared trunk forking into limbs under a broad dome of leafy clusters (o.t trunk, o.d dark leaves, o.l lit leaves)
function n11_oak(x, y, h, rnd, o) { var tw = h * 0.07, fy = y - h * 0.27;
  o.t += n11_P([[x - tw * 2.1, y + 4], [x - tw * 1.4, y - h * 0.015], [x - tw * 1.0, y - h * 0.08], [x - tw * 0.85, fy], [x + tw * 0.9, fy], [x + tw * 1.05, y - h * 0.08], [x + tw * 1.5, y - h * 0.02], [x + tw * 2.3, y + 4]]);
  [[-0.46, -0.5, 0.6], [-0.24, -0.66, 0.66], [0.02, -0.74, 0.7], [0.24, -0.62, 0.62], [0.46, -0.46, 0.55]].forEach(function (q) { o.t += n11_limb(x + q[0] * tw * 0.6, fy + tw * 0.5, x + q[0] * h, y + q[1] * h, tw * q[2] * 1.25, tw * 0.22, -q[0] * h * 0.07); });
  [[-0.95, -0.47], [0.98, -0.44]].forEach(function (q) { o.t += n11_limb(x + q[0] * h * 0.4, y + q[1] * h, x + q[0] * h * 0.55, y + q[1] * h - h * 0.08, tw * 0.25, tw * 0.1, 0); });
  var cy = y - h * 0.66, cw = h * 0.58, ch = h * 0.27, B = [], i;
  for (i = 0; i < 15; i++) { var a = i / 15 * Math.PI * 2 + 0.2, bx = x + Math.cos(a) * cw * (0.82 + rnd() * 0.12), by = cy + Math.sin(a) * ch * (0.86 + rnd() * 0.1); if (by > cy + ch * 0.5) by = cy + ch * 0.5 + (by - cy - ch * 0.5) * 0.4; B.push([bx, by, h * (0.12 + rnd() * 0.05)]); }
  for (i = 0; i < 6; i++) B.push([x + (rnd() - 0.5) * cw * 1.1, cy + (rnd() - 0.6) * ch * 0.9, h * (0.15 + rnd() * 0.05)]);
  B.push([x - cw * 0.15, cy - ch * 0.95, h * 0.14]); B.push([x + cw * 0.22, cy - ch * 0.9, h * 0.13]);
  var clu = function (cx, cy2, r) { var d = n11_C(cx, cy2, r * 0.8), m = 8, a0 = rnd() * 6.28; for (var j = 0; j < m; j++) { var a = a0 + j / m * Math.PI * 2; d += n11_C(cx + Math.cos(a) * r * 0.66, cy2 + Math.sin(a) * r * 0.6, r * (0.34 + rnd() * 0.08)); } return d; };
  o.d += n11_E(x, cy + ch * 0.05, cw * 0.86, ch * 0.92);
  B.forEach(function (b) { o.d += clu(b[0], b[1], b[2]); });
  B.forEach(function (b, j) { var ux = (b[0] - x) / cw, uy = (b[1] - cy) / ch; if ((j < 15 || j >= 21) && ux * 0.7 + uy < -0.1) o.l += clu(b[0] - b[2] * 0.22, b[1] - b[2] * 0.26, b[2] * 0.6); else if (j >= 15 && j < 21 && ux + uy < -0.3) o.l += clu(b[0] - b[2] * 0.2, b[1] - b[2] * 0.3, b[2] * 0.45); });
  return {cx: x, cy: cy, cw: cw + h * 0.17, ch: ch + h * 0.17}; }
// one meadow flower for the still layers: k 0 poppy, 1 cornflower, 2 daisy. Night: poppies and daisies are closed buds.
function n11_bloom(o, k, x, y, r, dk, rnd) {
  if (k === 0) { if (dk) { o.st += 'M' + PT(x, y + r * 2.2) + ' q' + n1(r * 0.1) + ' ' + n1(-r * 1.4) + ' ' + n1(r * 0.6) + ' ' + n1(-r * 1.8) + ' '; o.r += n11_RE(x + r * 0.75, y + r * 0.7, r * 0.34, r * 0.6, 28); return; }
    o.st += 'M' + PT(x, y + r * 0.6) + ' q' + n1(-r * 0.2) + ' ' + n1(r * 0.9) + ' 0 ' + n1(r * 1.9) + ' ';
    o.r += n11_E(x, y + r * 0.05, r * 0.82, r * 0.72) + n11_C(x - r * 0.5, y - r * 0.12, r * 0.58) + n11_C(x + r * 0.5, y - r * 0.12, r * 0.58); o.c += n11_E(x, y - r * 0.32, r * 0.36, r * 0.18); return; }
  if (k === 1) { o.st += 'M' + PT(x, y + r * 0.5) + ' q' + n1(r * 0.2) + ' ' + n1(r) + ' 0 ' + n1(r * 2) + ' '; o.b += n11_P(n11_starPts(x, y, r * (dk ? 0.8 : 1), r * (dk ? 0.5 : 0.6), 9, rnd() * 0.6)); o.c += n11_C(x, y, r * 0.22); return; }
  if (dk) { o.st += 'M' + PT(x, y + r * 0.4) + ' l0 ' + n1(r * 1.9) + ' '; o.w += n11_RE(x, y, r * 0.28, r * 0.5, 0); return; }
  o.st += 'M' + PT(x, y + r * 0.4) + ' q' + n1(-r * 0.2) + ' ' + n1(r) + ' 0 ' + n1(r * 2) + ' ';
  for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2; o.w += n11_RE(x + Math.cos(a) * r * 0.56, y + Math.sin(a) * r * 0.42, r * 0.46, r * 0.17, a * 180 / Math.PI * 0.84); }
  o.y += n11_E(x, y, r * 0.3, r * 0.24); }

SCENES.meadow = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.2), refl = Lay(0.7), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, y;
  var hz = H * (ph ? 0.47 : 0.5);
  var sky = dk ? 'linear-gradient(180deg,#0A1330 0%,#152149 30%,#26356A 62%,#3C4A7A 100%)' : 'linear-gradient(180deg,#6FB0E6 0%,#98CBF0 30%,#C8E4F6 56%,#EEF3E2 100%)';
  // sun or moon, stars and big summer cumulus
  var bx = dk ? W * (ph ? 0.32 : 0.56) : W * (ph ? 0.2 : 0.14), by = H * (ph ? 0.155 : 0.12), br = dk ? (ph ? 17 : 25) : (ph ? 22 : 34);
  if (dk) { add(far, 'a', n11_C(bx, by, br * 2.6), 'rgba(200,210,255,0.11)'); add(far, 'c', n11_C(bx, by, br), '#F6F1DC'); }
  else { add(far, 'a', n11_C(bx, by, br * 2.3), 'rgba(255,252,232,0.34)'); add(far, 'c', n11_C(bx, by, br), '#FFFDF0'); }
  var CL = ph ? [[0.3, 0.27, 210, 90], [0.82, 0.33, 240, 104], [0.62, 0.13, 110, 40]] : [[0.36, 0.26, 290, 116], [0.66, 0.35, 430, 176], [0.93, 0.17, 190, 74], [0.09, 0.36, 200, 70], [0.52, 0.11, 140, 46]], cbase = '', clit = '', boxes = [];
  CL.forEach(function (q) { var cx = W * q[0], cb = H * q[1]; if (Math.hypot(cx - bx, cb - q[3] * 0.5 - by) < q[2] * 0.6 + br * 2) return; if (dk && q[2] > 400) q[3] *= 0.7; var c = n11_cumulus(cx, cb, q[2] * (ph ? 1 : S), q[3] * (ph ? 1 : S), rnd); cbase += c.base; clit += c.lit; boxes.push(c.box); });
  add(far, 'd', cbase, dk ? 'rgba(42,54,98,0.92)' : '#C6D7EA'); add(far, 'e', clit, dk ? 'rgba(86,102,152,0.9)' : '#FFFFFF');
  if (dk) { var st = ''; spread(0, 0, W, hz * 0.95, 30, 30, rnd, 1).forEach(function (c) { if (c.q > 0.55 || Math.hypot(c.x - bx, c.y - by) < br * 2.4) return; for (var j = 0; j < boxes.length; j++) { var b = boxes[j]; if (c.x > b[0] && c.x < b[2] && c.y > b[1] && c.y < b[3]) return; } st += n11_C(c.x, c.y, 0.5 + c.r * 1.1); }); add(far, 'b', st, 'rgba(255,248,236,0.85)'); }
  else { var wisp = ''; spread(0, H * 0.04, W, H * 0.16, ph ? 200 : 330, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - bx, c.y - by) > 110) { var s = 0.6 + c.r * 0.6; wisp += n11_E(c.x, c.y, 70 * s, 5 * s) + n11_E(c.x + 30 * s, c.y - 4 * s, 40 * s, 4 * s); } }); add(far, 'b', wisp, 'rgba(255,255,255,0.55)'); }
  // blue mountains beyond: a pale far range (far layer) and a nearer, bluer one (refl)
  var m1 = n11_range(W, hz + 30, H * (ph ? 0.23 : 0.19), H * 0.09, ph ? 3 : 5, rnd, H * (ph ? 0.31 : 0.28));
  add(far, 'f', m1.body, dk ? '#36426F' : '#A6BFE0'); add(far, 'g', m1.snow, dk ? '#A4AED6' : '#F7FAFD'); add(far, 'h', m1.shade, dk ? 'rgba(10,14,42,0.32)' : 'rgba(76,106,160,0.24)');
  var m2 = n11_range(W, hz + 30, H * (ph ? 0.31 : 0.29), H * 0.07, ph ? 3 : 7, rnd, H * (ph ? 0.335 : 0.315));
  add(refl, 'a', m2.body, dk ? '#2A3660' : '#83A2CE'); add(refl, 'b', m2.snow, dk ? '#8894C2' : '#EEF4FB'); add(refl, 'c', m2.shade, dk ? 'rgba(8,10,34,0.3)' : 'rgba(46,76,136,0.26)');
  // far rolling hills with tree clumps, and a nearer hill with hedgerows and specks of flowers
  var h1 = ridge(W, hz + H * 0.005, [[H * 0.016, ph ? 60 : 130, 0.4], [H * 0.007, 40, 2.1]], 8);
  add(refl, 'd', below(h1, H + 40), dk ? '#273C52' : '#A2C98C');
  var tc = ''; spread(-20, hz - H * 0.02, W + 40, H * 0.02, ph ? 24 : 34, H * 0.02, rnd, 1).forEach(function (c) { if (c.q < 0.42) { var yy = n11_yOn(h1, c.x) + 3, s = (ph ? 3 : 4.5) * S * (0.8 + c.r * 0.6) * (ph ? 1.4 : 1); tc += n11_C(c.x, yy - s * 0.6, s) + n11_C(c.x + s * 1.1, yy - s * 0.3, s * 0.8) + n11_C(c.x - s, yy - s * 0.2, s * 0.7); } });
  add(refl, 'e', tc, dk ? '#1E3146' : '#82AE78');
  var h2 = ridge(W, hz + H * 0.042, [[H * 0.018, ph ? 80 : 190, 1.3], [H * 0.008, 55, 0.2]], 8);
  add(refl, 'f', below(h2, H + 40), dk ? '#2A4552' : '#90C470');
  var hd = ''; for (x = -20; x < W + 20; x += (ph ? 6 : 8) * S + 2) { var hy = n11_yOn(h2, x) + H * 0.014; if (Math.sin(x / (ph ? 50 : 90) + 1.2) > 0.35) { var hr = (ph ? 3.6 : 5.5) * S * (0.6 + rnd() * 0.8) * (ph ? 1.3 : 1); hd += n11_C(x, hy - hr * 0.3, hr) + rect(x - 5, hy - hr * 0.3, 10 * S + 4, hr * 1.1); } }
  [0.12, 0.31, 0.58, 0.88].forEach(function (f) { var tx = W * f, ty = n11_yOn(h2, tx) + 2, s = (ph ? 6 : 9) * S * (ph ? 1.3 : 1); hd += n11_C(tx, ty - s * 1.1, s) + n11_C(tx + s * 0.8, ty - s * 0.6, s * 0.8) + n11_C(tx - s * 0.7, ty - s * 0.5, s * 0.75); });
  add(refl, 'g', hd, dk ? '#1F3540' : '#6F9F5A');
  var spR = '', spW = '', spB = ''; spread(0, hz, W, H * 0.12, ph ? 7 : 9, 5, rnd, 1).forEach(function (c) { if (c.y < n11_yOn(h2, c.x) + 3) return; if (c.q < 0.32) spR += n11_E(c.x, c.y, 1.2 * S + 0.5, 0.8 * S + 0.3); else if (c.q < 0.44) spW += n11_dot(c.x, c.y); else if (c.q < 0.5) spB += n11_dot(c.x, c.y); });
  add(refl, 'h', spR, dk ? 'rgba(140,64,90,0.55)' : 'rgba(228,72,52,0.85)'); stk(refl, 's', spW, dk ? 'rgba(200,210,240,0.4)' : 'rgba(255,255,255,0.9)', 1.5); stk(refl, 't', spB, dk ? 'rgba(110,130,210,0.45)' : 'rgba(80,110,220,0.8)', 1.5);
  // the main meadow, with a gentle rise on the right where the oak stands
  var ox = W * (ph ? 0.72 : 0.76), gy = hz + H * (ph ? 0.1 : 0.09);
  var gtop = function (x) { var d = (x - ox) / (W * (ph ? 0.32 : 0.17)); return gy + Math.sin(x / 170 + 0.6) * 5 * S + Math.sin(x / 61) * 2 - H * (ph ? 0.035 : 0.05) * Math.exp(-d * d); };
  var ground = n11_fn(-60, W + 60, 6, gtop);
  add(mid, 'a', below(ground, H + 40), dk ? '#213E3E' : '#7BBD54');
  var bands = ''; [0.1, 0.27, 0.5, 0.76].forEach(function (fr, j) { var th = (5 + j * 7) * S, top = n11_fn(-60, W + 60, 10, function (x) { var g = gtop(x); return g + (H - g) * fr + Math.sin(x / (90 + j * 40) + j * 2) * (4 + j * 3) * S; }); bands += n11_P(top.concat(top.slice().reverse().map(function (p) { return [p[0], p[1] + th * (0.55 + 0.45 * Math.sin(p[0] / 70 + j))]; }))); });
  add(mid, 'b', bands, dk ? 'rgba(130,160,210,0.09)' : 'rgba(214,242,140,0.42)');
  // the stream: it comes out from behind the crest of the meadow and winds down to the bottom left, widening as it nears
  var sc = ph ? [[0.45, 0], [0.5, 0.06], [0.39, 0.16], [0.3, 0.3], [0.42, 0.47], [0.3, 0.7], [0.12, 1.06]] : [[0.47, 0], [0.53, 0.07], [0.43, 0.17], [0.34, 0.32], [0.42, 0.5], [0.3, 0.74], [0.16, 1.08]];
  var y0s = gtop(W * sc[0][0]) + 2, cp = sc.map(function (q) { return [W * q[0], y0s + (H - y0s) * q[1]]; }), cl = n11_curve(cp, 10);
  var sHalf = function (y) { var u = Math.max(0, (y - y0s) / (H - y0s)); return 1.4 + Math.pow(u, 1.45) * W * (ph ? 0.09 : 0.052); };
  var SL = [], SR = [], BL = [], BR = [], ss = [];
  cl.forEach(function (p, j) { var q = cl[Math.min(cl.length - 1, j + 1)], o = cl[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, hw = sHalf(p[1]), hb = hw * 1.22 + 2.5 * S;
    SL.push([p[0] + nx * hw, p[1] + ny * hw * 0.45]); SR.push([p[0] - nx * hw, p[1] - ny * hw * 0.45]); BL.push([p[0] + nx * hb, p[1] + ny * hb * 0.45 + 1]); BR.push([p[0] - nx * hb, p[1] - ny * hb * 0.45 + 1]);
    ss.push({x: p[0], y: p[1], hw: hw, a: Math.atan2(dy, dx)}); });
  var nearStream = function (x, y, pad) { for (var j = 0; j < ss.length; j++) { var s = ss[j], rx = s.hw + pad, ry = s.hw * 0.5 + pad; if (Math.abs(y - s.y) < ry + 8) { var u = (x - s.x) / rx, v = (y - s.y) / ry; if (u * u + v * v < 1) return true; } } return false; };
  add(mid, 'c', n11_P(BL.concat(BR.slice().reverse())), dk ? '#183236' : '#5C9C42');
  add(mid, 'd', n11_P(SL.concat(SR.slice().reverse())), dk ? '#2C5284' : '#6CC1E8');
  var shl = ''; ss.forEach(function (s, j) { if (j % 3 || s.hw < 3) return; var off = (j % 6 ? 0.3 : -0.35) * s.hw; shl += n11_RE(s.x - Math.sin(s.a) * off, s.y + Math.cos(s.a) * off * 0.45, s.hw * 0.42, Math.max(0.6, s.hw * 0.07), s.a * 180 / Math.PI); });
  add(mid, 'e', shl, dk ? 'rgba(190,206,255,0.42)' : 'rgba(228,248,255,0.85)');
  // pebbles along the banks and three stepping stones
  var peb = ''; ss.forEach(function (s, j) { if (j % 4 || s.hw < 5) return; var sd = j % 8 ? 1 : -1, px = s.x - Math.sin(s.a) * s.hw * 1.12 * sd, py = s.y + Math.cos(s.a) * s.hw * 0.5 * sd, pr = s.hw * 0.11 + 1.4; peb += n11_P(n11_blob(px, py, pr, pr * 0.62, rnd, 9, 0.2)) + n11_P(n11_blob(px + pr * 1.6, py + pr * 0.4, pr * 0.7, pr * 0.45, rnd, 8, 0.2)); });
  var stp = ss[Math.round(ss.length * 0.62)]; for (i = -1; i <= 1; i++) { var qx = stp.x + i * stp.hw * 0.62, qy = stp.y - i * stp.hw * 0.08 + 1, qr = stp.hw * 0.2; peb += n11_P(n11_blob(qx, qy, qr, qr * 0.55, rnd, 10, 0.12)); }
  add(mid, 'f', peb, dk ? '#3E4A62' : '#B5B2A6');
  // flower specks over the far part of the meadow (round dots, so they stay crisp)
  var dR = '', dW = ''; spread(-10, gy - H * 0.06, W + 20, H * 0.15, ph ? 7 : 10, 6, rnd, 1).forEach(function (c) { var g = gtop(c.x); if (c.y < g + 3 || c.y > g + H * 0.1 || nearStream(c.x, c.y, 3)) return; if (c.q < 0.36) dR += n11_dot(c.x, c.y); else if (c.q < 0.56) dW += n11_dot(c.x, c.y); });
  stk(mid, 's', dR, dk ? 'rgba(150,70,96,0.7)' : '#E6452F', (ph ? 2.2 : 2.8) * S + 0.6); stk(mid, 't', dW, dk ? 'rgba(206,214,240,0.55)' : '#FFFFFF', (ph ? 2 : 2.5) * S + 0.5);
  // the foreground bank the tall flowers grow from (it hides the end of the stream)
  var bank = n11_fn(-60, W + 60, 8, function (x) { return H - H * (ph ? 0.05 : 0.065) + Math.sin(x / 90 + 1) * 6 * S + Math.sin(x / 31) * 2.5; });
  add(mid, 'g', below(bank, H + 40), dk ? '#1B3136' : '#5EA444');
  var tuf = ''; for (x = -20; x < W + 20; x += (ph ? 9 : 13)) { var by2 = n11_yOn(bank, x) + 4; for (var k2 = 0; k2 < 3; k2++) tuf += n11_leaf(x + k2 * 3, by2, (ph ? 9 : 14) * S * (0.7 + rnd() * 0.6) + 4, 1.6 * S + 0.6, -90 + (k2 - 1) * 18 + (rnd() - 0.5) * 10); }
  add(mid, 'h', tuf, dk ? '#2A464A' : '#7CBB50');
  // the lone oak on its rise (near layer: drawn over the meadow, under the drifting mist and cloud shadows' canvas? no: the canvas sits under it)
  var oy = gtop(ox) + (ph ? 4 : 6), oh = H * (ph ? 0.27 : 0.42), oak = {t: '', d: '', l: ''}, ob = n11_oak(ox, oy, oh, rnd, oak);
  add(mid, 'c', n11_E(ox + oh * 0.16, oy + 3, oh * 0.5, oh * 0.045));
  add(near, 'a', oak.t, dk ? '#1C2026' : '#5A4232'); add(near, 'b', oak.d, dk ? '#152A2E' : '#3E7E3A'); add(near, 'c', oak.l, dk ? '#1E3A3C' : '#5FA046');
  // the middle meadow: rows of flowers, small and dense far away, bigger and sparser near
  var fo = {r: '', c: '', b: '', w: '', y: '', st: '', gt: ''}, yA = gy + H * 0.03, rows = ph ? 16 : 22;
  for (var rr = 0; rr < rows; rr++) { var v = (rr + 0.3 + rnd() * 0.4) / rows, ry = yA + (H * 0.92 - yA) * Math.pow(v, 1.45), fr = (1.5 + v * v * 7) * S * (ph ? 1.35 : 1), step = fr * 5 + 6;
    for (x = -10 + rnd() * step; x < W + 10; x += step * (0.55 + rnd() * 0.9)) { y = ry + (rnd() - 0.5) * step * 0.3; var r0 = fr * (0.8 + rnd() * 0.4); if (y < gtop(x) + r0 * 1.5 + 2 || nearStream(x, y, r0 + 3) || Math.abs(x - ox) < oh * 0.18 && y < oy + 4) continue;
      var q = rnd(); n11_bloom(fo, q < 0.5 ? 0 : q < 0.76 ? 2 : 1, x, y, r0, dk, rnd);
      if (rnd() < (dk ? 0.25 : 0.45)) { var tx = x + (rnd() - 0.5) * step * 0.6, tl = r0 * 2.2 + 2; fo.gt += 'M' + PT(tx, y + r0 * 2) + ' q0 ' + n1(-tl * 0.6) + ' ' + n1(-tl * 0.3) + ' ' + n1(-tl) + ' M' + PT(tx + 1.5, y + r0 * 2) + ' q0 ' + n1(-tl * 0.6) + ' ' + n1(tl * 0.35) + ' ' + n1(-tl * 0.9) + ' '; } } }
  // the tall swaying flowers and grass along the bottom edge (the engine draws them when animated)
  var fl = [], gr = [], fstep = ph ? 20 : 30;
  for (x = -10; x < W + 20; x += fstep * (0.55 + rnd() * 0.9)) { var q2 = rnd(); fl.push({x: x, y: H + 8, h: (ph ? 74 : 112) * S * (0.55 + rnd() * 0.6) * (ph ? 1.15 : 1), k: q2 < 0.52 ? 0 : q2 < 0.78 ? 2 : 1, r: (ph ? 12 : 15) * S * (0.8 + rnd() * 0.45) * (ph ? 1.2 : 1), ph: rnd() * 6.28}); }
  for (x = -10; x < W + 10; x += (ph ? 5 : 7)) gr.push({x: x + rnd() * 4, h: (ph ? 40 : 62) * S * (0.5 + rnd() * 0.8) * (ph ? 1.25 : 1), c: rnd() < 0.5, ph: rnd() * 6.28, lean: (rnd() - 0.5) * 0.5});
  // pop-up spots for the finish moment's new poppies
  var spots = []; for (i = 0; i < 160 && spots.length < 50; i++) { var sx2 = rnd() * W, sv = 0.15 + rnd() * 0.7, sy2 = yA + (H * 0.88 - yA) * Math.pow(sv, 1.3); if (sy2 > gtop(sx2) + 10 && !nearStream(sx2, sy2, 12) && !(Math.abs(sx2 - ox) < oh * 0.2 && sy2 < oy + 6)) spots.push([sx2, sy2, sv]); }
  if (ANIM) {
    ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.gy = gy; ANIM.ground = ground; ANIM.st = ss; ANIM.fl = fl; ANIM.gr = gr; ANIM.spots = spots; ANIM.sun = [bx, by, br]; ANIM.ys = yA;
    ANIM.oak = {x: ox, y: oy, h: oh, b: ob}; ANIM.boxes = boxes; ANIM.peak = H * (ph ? 0.22 : 0.18);
  } else {
    fl.forEach(function (f) { var hx = f.x + f.h * 0.08, hy = f.y - f.h; fo.st += 'M' + PT(f.x, f.y) + ' Q' + PT(f.x + f.h * 0.02, f.y - f.h * 0.6) + ' ' + PT(hx, hy + f.r * 0.5) + ' '; n11_bloom(fo, f.k, hx, hy, f.r, dk, rnd); });
    gr.forEach(function (g) { var b = g.lean * g.h; fo.gt += 'M' + PT(g.x, H + 4) + ' q' + n1(b * 0.3) + ' ' + n1(-g.h * 0.6) + ' ' + n1(b) + ' ' + n1(-g.h) + ' '; });
  }
  add(near, 'd', fo.r, dk ? '#6E2A3C' : '#E8402C'); add(near, 'e', fo.c, dk ? '#1A1620' : '#2A1A1E'); add(near, 'f', fo.b, dk ? '#3A4C96' : '#4C78DA'); add(near, 'g', fo.w, dk ? '#B4BCD6' : '#FFFFFF'); add(near, 'h', fo.y, dk ? '#8A8458' : '#F6C83A');
  stk(near, 's', fo.st, dk ? '#2C484C' : '#4B8A34', 1.3 * S + 0.5); stk(near, 't', fo.gt, dk ? '#3A546A' : '#86C454', 1.7 * S + 0.6);
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Glowing Bay: a sheltered tropical cove between dark rock headlands, a crescent of beach and leaning palms
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
