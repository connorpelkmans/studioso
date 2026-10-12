// ---- batch n12: wisteria (Wisteria Walk), bluebells (Bluebell Wood)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n12_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n12_P(pts) { return pts.length > 2 ? poly(n12_cw(pts)) : ''; }
function n12_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n12_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
// a rotated ellipse (degrees) drawn with two arcs (compact, still clockwise)
function n12_RE(x, y, rx, ry, ang) { var a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return 'M' + PT(x - rx * c, y - rx * s) + ' a' + n1(rx) + ' ' + n1(ry) + ' ' + n1(ang) + ' 1 1 ' + n1(2 * rx * c) + ' ' + n1(2 * rx * s) + ' a' + n1(rx) + ' ' + n1(ry) + ' ' + n1(ang) + ' 1 1 ' + n1(-2 * rx * c) + ' ' + n1(-2 * rx * s) + ' Z '; }
function n12_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n12_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n12_dot(x, y) { return 'M' + PT(x, y) + ' h0.01 '; }
// a pointed (lanceolate) leaf from (x,y) along ang (radians), length len, half width w; two quadratic curves
function n12_lf(x, y, len, w, ang) { var c = Math.cos(ang), s = Math.sin(ang), tx = x + c * len, ty = y + s * len, mx = x + c * len * 0.48, my = y + s * len * 0.48;
  var p1 = [mx - s * w * 2, my + c * w * 2], p2 = [mx + s * w * 2, my - c * w * 2], cr = (p1[0] - x) * (ty - y) - (p1[1] - y) * (tx - x); if (cr > 0) { var t = p1; p1 = p2; p2 = t; }
  return 'M' + PT(x, y) + ' Q' + PT(p1[0], p1[1]) + ' ' + PT(tx, ty) + ' Q' + PT(p2[0], p2[1]) + ' ' + PT(x, y) + ' Z '; }
function n12_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
// a smooth pebble/flagstone outline: low harmonics only, so no facets
function n12_stone(cx, cy, rx, ry, rnd) { var p = [], a1 = rnd() * 0.12, a2 = rnd() * 0.08, a3 = rnd() * 0.05, f1 = rnd() * 6, f2 = rnd() * 6, f3 = rnd() * 6; for (var i = 0; i < 22; i++) { var t = i / 22 * Math.PI * 2, r = 1 + a1 * Math.sin(2 * t + f1) + a2 * Math.sin(3 * t + f2) + a3 * Math.sin(5 * t + f3); r = Math.min(1.12, r * (1 + 0.12 * Math.pow(Math.abs(Math.cos(2 * t)), 3))); p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
function n12_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
// a band along a polyline with a width per point (w(i) -> half width), as one closed outline
function n12_band(pts, wf) { var L = [], R = [], n = pts.length; for (var i = 0; i < n; i++) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1, w = wf(i / (n - 1), i); L.push([pts[i][0] - dy / dl * w, pts[i][1] + dx / dl * w]); R.push([pts[i][0] + dy / dl * w, pts[i][1] - dx / dl * w]); } return n12_P(L.concat(R.reverse())); }
function n12_limb(x0, y0, x1, y1, w0, w1, bend) { var p = []; for (var i = 0; i <= 8; i++) { var u = i / 8; p.push([x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y0 + (y1 - y0) * u]); } return n12_band(p, function (u) { return w0 + (w1 - w0) * u; }); }
// a pinnate leaf spray (wisteria): a rachis from (x,y) along ang with pairs of leaflets and a tip leaflet
function n12_spray(x, y, len, ang, rnd) { var d = '', k = 4 + Math.floor(rnd() * 3), bend = (rnd() - 0.5) * 0.5;
  for (var j = 0; j <= k; j++) { var t = 0.18 + 0.82 * j / k, a = ang + bend * t, px = x + Math.cos(ang + bend * t * 0.5) * len * t, py = y + Math.sin(ang + bend * t * 0.5) * len * t, ll = len * (0.36 - 0.12 * t), lw = ll * 0.2;
    if (j === k) d += n12_lf(px, py, ll * 1.05, lw, a); else { d += n12_lf(px, py, ll, lw, a - 1.0 - rnd() * 0.25); d += n12_lf(px, py, ll, lw, a + 1.0 + rnd() * 0.25); } }
  return d; }
// one drooping wisteria raceme for the still layers: florets in rows, wide pale-open at the top, narrowing to deep buds at the tip
function n12_raceme(o, x, y, L, w, white, bend, rnd) { var rows = Math.max(6, Math.min(30, Math.round(L / Math.max(1.3, w * 0.17))));
  if (o.c != null && w > 3) o.c += n12_lf(x, y - w * 0.05, w * 0.7, w * 0.12, Math.PI * (0.15 + rnd() * 0.2)) + n12_lf(x, y, w * 0.6, w * 0.11, Math.PI * (0.7 + rnd() * 0.15));
  for (var i = 0; i < rows; i++) { var t = i / (rows - 1), cy = y + t * L, cx = x + bend * L * t * t + Math.sin(t * 5 + bend * 9) * w * 0.05, r = w * 0.2 * (1 - 0.7 * Math.pow(t, 0.9)) + 0.35, sp = w * 0.3 * (1 - 0.8 * t), m = t < 0.7 ? 2 : 1;
    for (var j = 0; j < m; j++) { var fx = cx + (m === 2 ? (j ? sp : -sp) * (0.7 + rnd() * 0.3) : (rnd() - 0.5) * sp * 0.5) + (i % 2 ? sp * 0.3 : -sp * 0.3), fy = cy + (rnd() - 0.5) * r * 0.4, sh = n12_E(fx, fy, r, r * 0.66);
      if (white) { if (t < 0.8) o.w += sh; else o.m += n12_E(fx, fy, r * 0.8, r * 0.7); } else if (t < 0.38) o.p += sh; else if (t < 0.72) o.m += sh; else o.k += sh; } } }

// =============== 1. Wisteria Walk: a flowering wisteria tunnel over a mossy stone path, opening onto a still pond with an arched footbridge
SCENES.wisteria = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.5), refl = Lay(0), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, j, k, z, x;
  var vx = W * (ph ? 0.5 : 0.57), vy = H * (ph ? 0.45 : 0.48), D = H - vy;
  var A = ph ? 0.84 : 1.62, P = ph ? 0.4 : 0.6, Yw = 1.42, Yp = 2.1, Yc = 2.85, Zn = 0.78, Ze = ph ? 3.5 : 3.25, Zpond = Ze + 0.55;
  var X = function (x, z) { return vx + x * D / z; }, Y = function (y, z) { return vy + (1 - y) * D / z; }, G = function (x, z) { return [X(x, z), Y(0, z)]; };
  // the tunnel's cross-section, from the bottom of the left wall over the arch to the bottom of the right wall (world x, y)
  var prof = [], np = 40, nw = 10; for (i = 0; i < nw; i++) prof.push([-A, Yw + (Yp - Yw) * i / nw]);
  for (i = 0; i <= np; i++) { var th = Math.PI * (1 - i / np); prof.push([A * Math.cos(th), Yp + (Yc - Yp) * Math.sin(th)]); }
  for (i = nw - 1; i >= 0; i--) prof.push([A, Yw + (Yp - Yw) * i / nw]);
  var profAt = function (s) { var f = s * (prof.length - 1), i0 = Math.min(prof.length - 2, Math.floor(f)), u = f - i0; return [prof[i0][0] + (prof[i0 + 1][0] - prof[i0][0]) * u, prof[i0][1] + (prof[i0 + 1][1] - prof[i0][1]) * u]; };
  var proj = function (p, z) { return [X(p[0], z), Y(p[1], z)]; };
  var sky = dk ? 'linear-gradient(180deg,#0E0A24 0%,#1C1440 28%,#2E2260 52%,#45367A 70%,#45367A 100%)' : 'linear-gradient(180deg,#B9D6EE 0%,#D2E4F3 30%,#EAEEF6 55%,#F6EEF0 70%,#F6EEF0 100%)';
  // ---- far: sky, sun or moon, the far tree line, the garden beyond the tunnel walls
  var oTop = Y(Yc, Ze), sx = vx + D / Ze * A * 0.42, sy = oTop + (vy - oTop) * 0.36, sr = ph ? 15 : 22;
  if (dk) { add(far, 'a', n12_C(sx, sy, sr * 3.2), 'rgba(190,180,255,0.12)'); add(far, 'c', n12_C(sx, sy, sr), '#F4F0FF');
    var st = ''; spread(0, 0, W, vy, 26, 26, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - sx, c.y - sy) > sr * 2.2) st += n12_C(c.x, c.y, 0.45 + c.r * 1.0); }); add(far, 'b', st, 'rgba(250,246,255,0.85)'); }
  else { add(far, 'a', n12_C(sx, sy, sr * 3.4), 'rgba(255,250,230,0.4)'); add(far, 'c', n12_C(sx, sy, sr), '#FFFDF2');
    var cl = ''; [[-0.5, 0.25, 1], [0.3, 0.12, 0.8], [0.7, 0.4, 0.7]].forEach(function (q) { var cx = vx + q[0] * D / Ze * A * 2, cy = oTop + (vy - oTop) * q[1] + 6, s = (ph ? 0.7 : 1); cl += n12_E(cx, cy, 60 * s, 9 * s) + n12_E(cx - 22 * s, cy - 7 * s, 30 * s, 10 * s) + n12_E(cx + 18 * s, cy - 9 * s, 34 * s, 12 * s); }); add(far, 'b', cl, 'rgba(255,255,255,0.75)'); }
  // the far tree line beyond the pond, soft rounded crowns with a few flowering trees
  var zb = 11, bankY = Y(0, zb), tl = '', tl2 = '', fb = '';
  for (x = -30; x < W + 30; x += (ph ? 14 : 20) * (0.7 + rnd() * 0.6)) { var th2 = (ph ? 26 : 40) * (0.6 + rnd() * 0.7) * (1 + Math.abs(x - vx) / W * 1.6), r0 = th2 * 0.42; tl += n12_C(x, vy - th2 + r0, r0) + rect(x - r0 * 0.6, vy - th2 + r0, r0 * 1.2, th2 - r0 + 8); }
  add(far, 'd', tl, dk ? '#2C2858' : '#A9C3B4');
  for (x = -20; x < W + 20; x += (ph ? 12 : 17) * (0.7 + rnd() * 0.6)) { var h3 = (ph ? 16 : 24) * (0.5 + rnd() * 0.8) * (1 + Math.abs(x - vx) / W * 3), r1 = h3 * 0.5; tl2 += n12_C(x, bankY - h3 + r1, r1) + n12_C(x + r1 * 0.9, bankY - h3 * 0.7 + r1, r1 * 0.8) + rect(x - r1, bankY - h3 + r1, r1 * 2, h3 - r1 + 3);
    if (rnd() < 0.45) { var bx = x + (rnd() - 0.5) * r1, by = bankY - h3 + r1 * (0.7 + rnd() * 0.6); for (k = 0; k < 5; k++) fb += n12_C(bx + (rnd() - 0.5) * r1 * 1.4, by + (rnd() - 0.5) * r1 * 0.8, r1 * (0.12 + rnd() * 0.1)); } }
  add(far, 'e', below(n12_fn(-60, W + 60, 20, function () { return vy + 2; }), H + 40) + '', dk ? '#1E2C3C' : '#86AE6A');
  add(far, 'f', tl2, dk ? '#1E2444' : '#7FA77A'); add(far, 'g', fb, dk ? '#8A7AB8' : '#F2B6D2');
  add(far, 'h', n12_E(vx, vy - 4, W * 0.9, D * 0.05), dk ? 'rgba(120,100,190,0.18)' : 'rgba(255,246,250,0.45)');
  // ---- refl: the mossy ground, the pond and its arched footbridge, the stone path, the lower vine trunks
  // clipped azalea mounds and low hedges in the garden outside the tunnel, seen between the trunks
  var gs = ''; for (z = 1.0; z < Ze + 1.2; z += 0.12 + z * 0.05) [-1, 1].forEach(function (sd) { var xw = sd * (A + 0.3 + rnd() * 1.1), g0 = G(xw, z), rw = (0.18 + rnd() * 0.16) * D / z; for (k = 0; k < 7; k++) gs += n12_spray(g0[0], g0[1], rw * (0.8 + rnd() * 0.5), -Math.PI / 2 + (k - 3) * 0.42 + (rnd() - 0.5) * 0.2, rnd); });
  add(refl, 'a', gs, dk ? '#1C2A44' : '#5E8E50');
  // the pond (a ground-plane outline), with the tree line and the bridge mirrored in it
  var pc = 7.0, pzr = 3.2, pxr = ph ? 3.3 : 4.6, pond = [], pp = n12_blob(0, pc, pxr, pzr, rnd, 36, 0.06);
  pp.forEach(function (q) { var zz = Math.max(Zpond, Math.min(zb - 0.4, q[1])); pond.push(G(q[0], zz)); });
  add(refl, 'b', n12_P(pond), dk ? '#2A2458' : '#BCD2E8');
  var pTop = Y(0, zb - 0.4), pBot = Y(0, Zpond), bz = 5.4, bL = ph ? -1.75 : -2.15, bR = ph ? 1.55 : 1.95;
  var inPond = function (xx, yy) { var c = false; for (var a = 0, b = pond.length - 1; a < pond.length; b = a++) { var p = pond[a], q = pond[b]; if ((p[1] > yy) !== (q[1] > yy) && xx < (q[0] - p[0]) * (yy - p[1]) / (q[1] - p[1]) + p[0]) c = !c; } return c; };
  // reflections: the far bank's trees (mirrored at the pond's far edge) and the bridge
  var rf = ''; for (x = -20; x < W + 20; x += (ph ? 10 : 14)) { var hh = (ph ? 12 : 18) * (0.5 + rnd() * 0.8) * (1 + Math.abs(x - vx) / W * 2); if (inPond(x, pTop + 3)) rf += n12_E(x, pTop + hh * 0.3, hh * 0.55, hh * 0.45); }
  var deckY = function (xw) { var u = (xw - (bL + bR) / 2) / ((bR - bL) / 2); return 0.12 + 0.62 * Math.pow(Math.max(0, 1 - u * u), 0.7); };
  var bridge = function (mir) { var top = [], bot = [], s = mir ? -1 : 1, base = -0.02; for (var xw = bL - 0.2; xw <= bR + 0.2001; xw += (bR - bL) / 40) { var yd = deckY(xw); top.push([X(xw, bz - 0.25), Y(base + s * (yd - base), bz - 0.25)]); bot.push([X(xw, bz - 0.25), Y(base + s * (yd - 0.12 - base), bz - 0.25)]); } return {top: top, bot: bot}; };
  var B0 = bridge(false), B1 = bridge(true);
  rf += n12_P(B1.top.concat(B1.bot.slice().reverse()));
  for (k = -2; k <= 2; k++) { var lxw = (bL + bR) / 2 + k * (bR - bL) * 0.21, ly = deckY(lxw); rf += rect(X(lxw, bz - 0.25) - 1.6 * S - 0.6, Y(-0.02, bz - 0.25), 3.2 * S + 1.2, (ly - 0.1) * D / (bz - 0.25)); }
  add(refl, 'c', rf, dk ? 'rgba(14,10,40,0.45)' : 'rgba(70,104,118,0.32)');
  // the stone path: irregular flagstones in perspective, moss between them; stepping stones out to the bridge's foot
  var stn = '', shi = '', tuft = '', placed = [], gsx = 0.2, gsz = 0.17, row = 0;
  for (var zr = Zn - 0.12; zr < Zpond - 0.05; zr += gsz * (0.9 + rnd() * 0.2), row++) for (var xr0 = -P - (row % 2) * gsx * 0.5; xr0 < P + 0.05; xr0 += gsx * (0.85 + rnd() * 0.3)) {
    var cx0 = xr0 + (rnd() - 0.5) * gsx * 0.3, cz0 = zr + (rnd() - 0.5) * gsz * 0.3, rr0 = gsx * 0.5 * (0.85 + rnd() * 0.25); if (Math.abs(cx0) > P + 0.02 || rnd() < 0.05) continue;
    if (Math.abs(cx0) > P - 0.1) rr0 *= 0.7; placed.push([cx0, cz0, rr0]); }
  placed.forEach(function (q0) { var gp = n12_stone(q0[0], q0[1], q0[2], q0[2] * gsz / gsx * 1.02, rnd), an = rnd() * 3; gp = gp.map(function (p) { return G(p[0], p[1]); });
    stn += n12_P(gp); var gc = G(q0[0] - q0[2] * 0.08, q0[1] + q0[2] * 0.1); shi += n12_P(gp.map(function (p) { return [gc[0] + (p[0] - gc[0]) * 0.78, gc[1] + (p[1] - gc[1]) * 0.7 - 0.4]; }));
    if (rnd() < 0.35) { var tp = gp[Math.floor(rnd() * gp.length)], ts = 0.014 * D / q0[1] * (0.6 + rnd() * 0.6); tuft += n12_E(tp[0], tp[1], ts * 1.6, ts * 0.5); } });
  [[bL * 0.3, Zpond + 0.25], [bL * 0.62, Zpond + 0.55], [bL * 0.9, bz - 0.55]].forEach(function (q) { var g2 = G(q[0], q[1]), rr = 0.22 * D / q[1]; stn += n12_P(n12_blob(g2[0], g2[1], rr, rr * 0.38 / q[1] * 2.2, rnd, 12, 0.1)); shi += n12_E(g2[0] - rr * 0.1, g2[1] - rr * 0.05, rr * 0.6, rr * 0.18); });
  add(refl, 'd', stn, dk ? '#3C3C60' : '#B8B4A8'); add(refl, 'e', shi, dk ? '#4C4C74' : '#D0CCC0');
  // the bridge: plank deck, red fascia beam, posts down to the water and a railing
  var deck = []; B0.top.forEach(function (p) { deck.push(p); }); var dback = []; for (var xw = bL - 0.2; xw <= bR + 0.2001; xw += (bR - bL) / 40) dback.push([X(xw, bz + 0.25), Y(deckY(xw) + 0.005, bz + 0.25)]);
  var pillars = '', rail = '', rtop = [];
  for (k = -2; k <= 2; k++) { var pxw = (bL + bR) / 2 + k * (bR - bL) * 0.21, pyw = deckY(pxw); pillars += rect(X(pxw, bz - 0.24) - 2 * S - 0.6, Y(pyw - 0.1, bz - 0.24), 4 * S + 1.2, (pyw - 0.08) * D / (bz - 0.24)); }
  for (xw = bL; xw <= bR + 0.001; xw += (bR - bL) / 12) { var yd2 = deckY(xw); rail += 'M' + PT(X(xw, bz - 0.24), Y(yd2, bz - 0.24)) + ' L' + PT(X(xw, bz - 0.24), Y(yd2 + 0.3, bz - 0.24)) + ' '; }
  for (xw = bL - 0.05; xw <= bR + 0.0501; xw += (bR - bL) / 30) rtop.push([X(xw, bz - 0.24), Y(deckY(xw) + 0.3, bz - 0.24)]);
  rail += pline(rtop) + pline(rtop.map(function (p, ii) { var xw3 = bL - 0.05 + ii * (bR - bL + 0.1) / 30; return [p[0], Y(deckY(xw3) + 0.16, bz - 0.24)]; }));
  // the vine trunks of each arch below the foliage (refl 'f' also holds the deck planks)
  var Zs = [], nA = ph ? 6 : 6; for (k = 0; k < nA; k++) Zs.push(Zn + 0.22 + (Ze - Zn - 0.22) * k / (nA - 1));
  var trunk = function (side, z, top) { var d = ''; for (var m = 0; m < 2; m++) { var pts = []; for (var yy = 0; yy <= top + 0.001; yy += 0.06) pts.push([X(side * A + Math.sin(yy * 5.5 + m * Math.PI + z) * 0.035 + side * 0.01 * m, z), Y(yy, z)]); d += n12_band(pts, function (u) { return (0.028 + (1 - u) * 0.02 + (u < 0.06 ? (0.06 - u) * 0.9 : 0)) * D / z; }); } return d; };
  var tr = '', trHi = ''; Zs.forEach(function (z2) { if (z2 > 1.3) { tr += trunk(-1, z2, Yw + 0.3); tr += trunk(1, z2, Yw + 0.3); [-1, 1].forEach(function (sd) { for (var m = 0; m < 2; m++) { var pts = []; for (var yy = 0.05; yy <= Yw - 0.05; yy += 0.06) pts.push([X(sd * A + Math.sin(yy * 5.5 + m * Math.PI + z2) * 0.035 + sd * 0.01 * m - 0.014, z2), Y(yy, z2)]); trHi += n12_band(pts, function (u) { return 0.006 * D / z2 * Math.sin(Math.PI * Math.min(1, u * 1.2)); }); } }); } });
  add(refl, 'f', tr + n12_P(deck.concat(dback.slice().reverse())), dk ? '#3C3448' : '#7D6E62');
  // banks: irises and reeds at the water's edge, moss mounds, ferns and hostas along the tunnel walls
  var bank = ''; for (i = 0; i < pond.length; i++) { var q2 = pond[i]; if (q2[1] < pTop + 6 || rnd() < 0.3) continue; var sc2 = (q2[1] - vy) / D * (ph ? 18 : 26) + 2; for (k = 0; k < 4; k++) bank += n12_lf(q2[0] + (rnd() - 0.5) * sc2, q2[1] + 1, sc2 * (1.1 + rnd()), sc2 * 0.07, -Math.PI / 2 + (rnd() - 0.5) * 0.7); }
  for (z = Zn; z < Ze + 0.4; z += 0.06 + z * 0.03) { [-1, 1].forEach(function (sd) { var xw2 = sd * (A - 0.05 - rnd() * (A - P) * 0.5), g3 = G(xw2, z), s3 = D / z * 0.09;
    if (rnd() < 0.3 && z > 1.4) bank += n12_P(n12_blob(g3[0], g3[1] - s3 * 0.35, s3 * (0.5 + rnd() * 0.4), s3 * 0.45, rnd, 18, 0.06));
    else for (k = 0; k < 5; k++) bank += n12_spray(g3[0], g3[1], s3 * (1.6 + rnd() * 0.8), -Math.PI / 2 + (k - 2) * 0.5 + (rnd() - 0.5) * 0.2, rnd); }); }
  add(refl, 'g', bank + tuft, dk ? '#1C3A3E' : '#5E9450');
  add(refl, 'h', n12_P(B0.top.concat(B0.bot.slice().reverse())) + pillars, dk ? '#6E3A4E' : '#B9543E');
  stk(refl, 's', rail, dk ? '#6E3A4E' : '#B9543E', 2.2 * S + 0.6);
  var wl = ''; for (i = 0; i < (ph ? 22 : 40); i++) { var wx = vx + (rnd() - 0.5) * D / pc * pxr * 2, wy = pTop + rnd() * (pBot - pTop); var ww = (6 + rnd() * 14) * (wy - vy) / D * 4; if (inPond(wx - ww - 6, wy) && inPond(wx + ww + 6, wy)) { wl += 'M' + PT(wx - ww, wy) + ' h' + n1(ww * 2) + ' '; } }
  if (dk) { for (i = 0; i < 9; i++) { var my2 = pTop + 4 + i * (pBot - pTop) * 0.1, mw = 6 + i * 2.4; if (inPond(sx, my2)) wl += 'M' + PT(sx - mw, my2) + ' h' + n1(mw * 2) + ' '; } }
  stk(refl, 't', wl, dk ? 'rgba(236,228,255,0.45)' : 'rgba(255,255,255,0.55)', 1.2 * S + 0.4);
  // ---- mid: the tunnel's walls and roof of foliage (a band between the cross-sections at the far and near ends), leaf sprays, far racemes
  var outer = prof.map(function (p) { return proj(p, Zn); }), inner = prof.map(function (p) { return proj(p, Ze); });
  add(mid, 'a', n12_P(inner.concat(outer.slice().reverse())), dk ? '#1A1838' : '#3E5E3A');
  // a darker hollow under each arch so the tunnel reads in depth, and the arch beams themselves
  var hollow = '';
  var lv = {b: hollow, c: '', d: ''}, sprays = [];
  var ns = ph ? 230 : 420; for (i = 0; i < ns; i++) { var w0 = 1 / Ze + (1 / Zn - 1 / Ze) * Math.pow(rnd(), 0.8), z3 = 1 / w0, s4 = 0.04 + rnd() * 0.92, p3 = profAt(s4), q3 = proj(p3, z3), len = (0.32 + rnd() * 0.18) * D / z3;
    // sprays droop from the surface toward the tunnel's middle and down
    var ang = Math.atan2(vy - q3[1], vx - q3[0]) * 0.35 + Math.PI / 2 * 0.65 + (rnd() - 0.5) * 0.9; sprays.push([z3, q3, len, ang, s4]); }
  sprays.sort(function (a, b) { return b[0] - a[0]; }).forEach(function (sp) { var r2 = rnd(), deep = (sp[0] - Zn) / (Ze - Zn), slot = r2 < 0.42 - deep * 0.15 ? 'b' : r2 < 0.82 - deep * 0.1 ? 'c' : 'd'; if (sp[0] > 1.25) lv[slot] += n12_spray(sp[1][0], sp[1][1], sp[2], sp[3], rnd); });
  // a fringe of leaves along the bottom of the walls so the foliage edge is soft
  for (z = Zn; z < Ze; z += 0.035 + z * 0.02) [-1, 1].forEach(function (sd) { var q4 = proj([sd * A, Yw + 0.05], z), ln2 = 0.22 * D / z; if (z > 1.25) lv[rnd() < 0.5 ? 'b' : 'c'] += n12_spray(q4[0], q4[1], ln2, Math.PI / 2 + sd * -0.25 + (rnd() - 0.5) * 0.6, rnd); });
  add(mid, 'b', lv.b, dk ? '#211F48' : '#4C7444'); add(mid, 'c', lv.c, dk ? '#2B3058' : '#6C9A52'); add(mid, 'd', lv.d, dk ? '#3A4470' : '#9CC66A');
  // the racemes: hanging from the roof and the upper walls, longest along the walls
  var rac = [], nr = ph ? 220 : 380;
  for (i = 0; i < nr; i++) { var w1 = 1 / Ze + (1 / Zn - 1 / Ze) * Math.pow(rnd(), 0.75), z4 = 1 / w1, s5 = 0.06 + rnd() * 0.88, p4 = profAt(s5); if (p4[1] < Yw + 0.25) continue;
    var q5 = proj(p4, z4), Lw = Math.min(p4[1] - 1.05, (0.42 + rnd() * 0.5) * (1.2 - Math.abs(s5 - 0.5) * 0.4)); if (Lw < 0.2) continue;
    rac.push({x: q5[0], y: q5[1] - 0.04 * D / z4, L: Lw * D / z4, w: (0.15 + rnd() * 0.04) * D / z4, z: z4, wh: rnd() < 0.24, b: (rnd() - 0.5) * 0.12, v: Math.floor(rnd() * 16), ph: rnd() * 6.28}); }
  rac.sort(function (a, b) { return b.z - a.z; });
  var ro = {c: '', p: '', m: '', k: '', w: ''}, rn = {p: '', m: '', k: '', w: ''};
  if (!ANIM) rac.forEach(function (r) { if (r.z > 1.3) n12_raceme(ro, r.x, r.y, r.L, r.w, r.wh, r.b, rnd); else n12_raceme(rn, r.x, r.y, r.L, r.w, r.wh, r.b, rnd); });
  add(mid, 'e', ro.k, dk ? '#6A58B0' : '#7A5AB8'); add(mid, 'f', ro.m, dk ? '#9A8AD8' : '#A486D8'); add(mid, 'g', ro.p, dk ? '#C8BEF2' : '#C8B4EC'); add(mid, 'h', ro.w, dk ? '#E8E4FA' : '#FBF8F2');
  // ---- near: light pools on the path, the nearest arches' twisted trunks, near foliage, near racemes, fallen petals
  var pools = ''; for (i = 0; i < (ph ? 9 : 14); i++) { var zp = Zn + 0.2 + Math.pow(rnd(), 0.8) * (Zpond - Zn - 0.3), xp = (rnd() - 0.5) * P * 2.2, gq = G(xp, zp);
    for (k = 0; k < 5; k++) { var rw = (0.025 + rnd() * 0.05) * D / zp, ox = (rnd() - 0.5) * 0.25 * D / zp; pools += n12_E(gq[0] + ox, gq[1] + (rnd() - 0.5) * 0.12 * D / zp / zp, rw, rw / zp * 0.8); } }
  add(near, 'a', pools, dk ? 'rgba(200,196,255,0.13)' : 'rgba(255,248,214,0.34)');
  var ntr = '', nhi = ''; Zs.forEach(function (z2) { if (z2 <= 1.3) { [-1, 1].forEach(function (sd) { ntr += trunk(sd, z2, Yp); }); var beam = []; for (i = 0; i <= 30; i++) { var th3 = Math.PI * (1 - i / 30); beam.push(proj([A * Math.cos(th3) + Math.sin(i * 0.9) * 0.03, Yp + (Yc - Yp) * Math.sin(th3)], z2)); } ntr += n12_band(beam, function () { return 0.04 * D / z2; });
    [-1, 1].forEach(function (sd) { var pts = []; for (var yy = 0.1; yy <= Yp; yy += 0.06) pts.push([X(sd * A + Math.sin(yy * 5.5 + z2) * 0.035 - 0.012, z2), Y(yy, z2)]); nhi += n12_band(pts, function () { return 0.008 * D / z2; }); }); } });
  add(near, 'b', ntr, dk ? '#2C2640' : '#6E5E52'); add(near, 'c', nhi, dk ? '#4A4262' : '#9C8C7C');
  var nl = {d: '', e: ''}; sprays.forEach(function (sp) { if (sp[0] <= 1.25) nl[rnd() < 0.62 ? 'd' : 'e'] += n12_spray(sp[1][0], sp[1][1], sp[2], sp[3], rnd); });
  for (z = Zn; z < 1.25; z += 0.03) [-1, 1].forEach(function (sd) { var q4 = proj([sd * A, Yw + 0.05], z); nl.d += n12_spray(q4[0], q4[1], 0.22 * D / z, Math.PI / 2 + sd * -0.25 + (rnd() - 0.5) * 0.6, rnd); });
  // ferns at the bottom corners
  [[-1, 0.9], [1, 0.95]].forEach(function (q) { var g4 = G(q[0] * (P + 0.25), q[1]); for (k = 0; k < 7; k++) nl.e += n12_spray(g4[0], g4[1] + 6, (ph ? 60 : 110) * S * (0.7 + rnd() * 0.5), -Math.PI / 2 + (k - 3) * 0.32 + q[0] * 0.2, rnd); });
  add(near, 'd', nl.d, dk ? '#1E1E44' : '#456E40'); add(near, 'e', nl.e, dk ? '#2E3460' : '#78A856');
  add(near, 'f', rn.k, dk ? '#6A58B0' : '#7A5AB8'); add(near, 'g', rn.m, dk ? '#9A8AD8' : '#A486D8'); add(near, 'h', rn.p + rn.w, dk ? '#C8BEF2' : '#C8B4EC');
  var pet = ''; for (i = 0; i < (ph ? 70 : 130); i++) { var zq = Zn + Math.pow(rnd(), 1.4) * (Zpond - Zn), xq = (rnd() - 0.5) * (P * 2 + 0.4), gg = G(xq, zq); pet += n12_dot(gg[0], gg[1]); }
  stk(near, 't', pet, dk ? 'rgba(200,186,250,0.7)' : 'rgba(176,146,226,0.85)', 2.4 * S + 0.8);
  if (ANIM) { ANIM.rac = rac; ANIM.vp = [vx, vy, D]; ANIM.sun = [sx, sy, sr]; ANIM.P = P; ANIM.A = A; ANIM.Zn = Zn; ANIM.Ze = Ze; ANIM.Zp = Zpond; ANIM.S = S; ANIM.pond = pond; ANIM.pTop = pTop; ANIM.pBot = pBot; ANIM.opening = inner; ANIM.bz = bz; ANIM.trHi = trHi; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Bluebell Wood: an English beech wood in spring, silver trunks, a lime-green canopy and a bluebell carpet along a winding path
// a beech leaf: an oval with a short point (screen units)
// a soft crown mass: overlapping round puffs over a flat-ish base (screen units), returned as one path
function n12_puffs(x, y, rx, ry, rnd, n) { var d = n12_E(x, y + ry * 0.15, rx * 0.85, ry * 0.6); n = n || 7; for (var i = 0; i < n; i++) { var a = Math.PI * (1.05 + 0.9 * i / (n - 1)) + (rnd() - 0.5) * 0.3, r = ry * (0.42 + rnd() * 0.22); d += n12_C(x + Math.cos(a) * rx * 0.62, y + Math.sin(a) * ry * 0.55 + r * 0.2, r); } return d; }
function n12_beechLeaf(x, y, len, ang) { return n12_lf(x, y, len, len * 0.2, ang); }
// a cluster of beech leaves around (x,y), r = cluster radius; leaves mostly level and drooping; o.l lit, o.d shaded
function n12_leafCluster(x, y, r, rnd, o, lit) { var n = 9 + Math.floor(rnd() * 8), ll = r * 0.34;
  for (var i = 0; i < n; i++) { var a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, lx = x + Math.cos(a) * d * 1.25, ly = y + Math.sin(a) * d * 0.7, ang = (rnd() < 0.5 ? 0.25 : Math.PI - 0.25) + (rnd() - 0.5) * 1.1;
    o[(ly < y - r * 0.15 && rnd() < 0.75) || rnd() < lit ? 'l' : 'd'] += n12_beechLeaf(lx, ly, ll * (0.75 + rnd() * 0.5), ang); } }
// one bluebell for the still layers: an arching stem nodding to one side and narrow bells hanging along the arch (o.st stems, o.b bells, o.lv leaves)
function n12_bluebell(o, x, y, h, lean, rnd) { var sd = lean >= 0 ? 1 : -1, tx = x + sd * h * 0.22, ty = y - h, n = 4 + Math.floor(rnd() * 4), bs = h * 0.085;
  o.st += 'M' + PT(x, y) + ' Q' + PT(x + sd * h * 0.02, y - h * 0.8) + ' ' + PT(tx, ty) + ' ';
  for (var i = 0; i < n; i++) { var t = 0.32 + 0.68 * i / (n - 1), bx = x + sd * h * 0.22 * Math.pow(t, 1.6) + sd * bs * 0.4, by = y - h * (0.42 + 0.58 * t) + bs * 1.1, s2 = bs * (1.05 - t * 0.35);
    o.b += n12_P([[bx - s2 * 0.45, by - s2 * 0.9], [bx + s2 * 0.45, by - s2 * 0.9], [bx + s2 * 0.62, by + s2 * 0.5], [bx + s2 * 0.82, by + s2 * 0.75], [bx, by + s2 * 0.6], [bx - s2 * 0.82, by + s2 * 0.75], [bx - s2 * 0.62, by + s2 * 0.5]]); }
  if (o.lv != null) for (var k = 0; k < 3; k++) { var la = -Math.PI / 2 + (k - 1) * 0.55 + (rnd() - 0.5) * 0.3; o.lv += n12_lf(x, y, h * (0.5 + rnd() * 0.25), h * 0.025, la); } }
SCENES.bluebells = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.2), refl = Lay(0.7), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, j, k, x;
  var vx = W * (ph ? 0.5 : 0.56), vy = H * (ph ? 0.5 : 0.53), D = H - vy;
  var X = function (xw, zw) { return vx + xw * D / zw; }, Y = function (yw, zw) { return vy + (1 - yw) * D / zw; };
  var Z0 = 1.05, ZF = 42, LB = [1.75, 5, 10.5];   // layer bounds: near < 1.75 < mid < 5 < refl < 10.5 < far
  var pathX = function (zw) { return 0.75 * Math.sin(zw * 0.42 + 0.9) * Math.min(1, (zw - 0.6) / 2.4) + 0.25 * Math.sin(zw * 1.1 + 2) * Math.min(1, zw / 6) - 0.1; };
  var sky = dk ? 'linear-gradient(180deg,#0A1230 0%,#14204A 30%,#22346C 55%,#33488A 75%,#33488A 100%)' : 'linear-gradient(180deg,#CFE4EE 0%,#DCEDDF 30%,#EEF5D8 55%,#F8F6E0 75%,#F8F6E0 100%)';
  // ground edges: each layer's ground starts at a softly rolling line at its far bound
  var edge = function (zb) { var a = D / zb; return ridge(W, vy + a, [[a * 0.12, ph ? 70 : 150, zb], [a * 0.05, ph ? 30 : 55, zb * 2]], 8); };
  var E0 = edge(ZF), E1 = edge(LB[2]), E2 = edge(LB[1]), E3 = edge(LB[0]);
  // ---- far: the sky's glow and stars, the far ground in a violet haze, pale far trunks and soft far crowns
  var gx0 = vx + W * (ph ? 0.1 : 0.08), gy0 = vy - D * 0.25;
  if (dk) { add(far, 'a', n12_E(vx, vy - D * 0.1, W * 0.7, D * 0.55), 'rgba(110,140,230,0.18)');
    var st = ''; spread(0, 0, W, vy, 24, 24, rnd, 1).forEach(function (c) { if (c.q < 0.5) st += n12_C(c.x, c.y, 0.45 + c.r); }); add(far, 'b', st, 'rgba(246,248,255,0.9)'); }
  else { add(far, 'a', n12_E(gx0, gy0, W * 0.5, D * 0.6) + n12_E(gx0, gy0, W * 0.25, D * 0.3), 'rgba(255,252,226,0.45)'); }
  add(far, 'c', below(E0, H + 40), dk ? '#2E3870' : '#CAC6E8');
  var hz1 = ''; for (i = 0; i < (ph ? 30 : 60); i++) { var zz = LB[2] + rnd() * (ZF - LB[2]), xx = vx + (rnd() - 0.5) * W * 1.3, yy = vy + D / zz, ww = (ph ? 40 : 90) * (0.5 + rnd()) * 12 / zz; hz1 += n12_E(xx, yy, ww, ww * 0.12 + 1.5); }
  add(far, 'd', hz1, dk ? '#4A4C9E' : '#A6A2E2');
  // the path, in pieces per layer
  var pathPoly = function (za, zb) { var L = [], R = []; for (var zw = za; zw <= zb * 1.0001; zw *= 1.03) { var hw = (ph ? 0.22 : 0.42) * (1 + 0.14 * Math.sin(zw * 6.1)) + 0.05 * Math.sin(zw * 2.3), cxw = pathX(zw); L.push([X(cxw - hw, zw), Y(0, zw)]); R.push([X(cxw + hw * (1 + 0.1 * Math.sin(zw * 4.7)), zw), Y(0, zw)]); } return n12_P(L.concat(R.reverse())); };
  add(far, 'e', pathPoly(LB[2] * 0.95, 26), dk ? '#3A3A6A' : '#C8B898');
  var mist = ''; for (i = 0; i < 6; i++) mist += n12_E(vx + (i - 2.5) * W * 0.25, vy - D * 0.015 + D * 0.012 * (i % 3), W * 0.32, D * (0.035 + (i % 3) * 0.012)); add(far, 'h', mist, dk ? 'rgba(90,110,200,0.22)' : 'rgba(236,238,250,0.45)');
  // trunks: scattered through the wood (off the path), each layer's trunks kept apart so they never cut into one another
  var trunks = [[], [], [], []], lay = function (zw) { return zw < LB[0] ? 0 : zw < LB[1] ? 1 : zw < LB[2] ? 2 : 3; }, EL = [E3, E2, E1, E0];
  for (i = 0; i < 3000; i++) { var w = 1 / ZF + (1 / Z0 - 1 / ZF) * Math.pow(rnd(), 1.25), zt = 1 / w, li = lay(zt), maxN = [ph ? 2 : 3, ph ? 6 : 10, ph ? 9 : 16, ph ? 18 : 34][li]; if (trunks[li].length >= maxN) continue;
    var xt = (rnd() - 0.5) * (W * 1.15) * zt / D, sx = X(xt, zt), bw = (0.17 + rnd() * 0.12) * D / zt; if (Math.abs(xt - pathX(zt)) < 0.75 + bw / D * zt) continue;
    if (sx < -bw || sx > W + bw) continue; if (li === 0 && Math.abs(sx - vx) < W * 0.3) continue;
    var by = Y(0, zt), ownEdge = n12_yOn(EL[li], sx), nearer = li ? n12_yOn(EL[li - 1], sx) : H + 99; if (by < ownEdge + 3 || by > nearer - 3) continue;
    var ok = true; trunks[li].forEach(function (t) { if (Math.abs(t.x - sx) < (t.w + bw) * 0.75 + 6) ok = false; }); if (ok) trunks[li].push({x: sx, y: by, w: bw, z: zt, lean: (rnd() - 0.5) * 0.06}); }
  // a smooth beech trunk: gentle lean and taper, flared root buttresses, a fork high up into the crown; returns body, shade and highlight
  var trunk = function (t, fork) { var o = {b: '', s: '', h: ''}, top = Math.min(-40, Y(4.6, t.z)), L = [], R = [], SL = [], n = 14, wb = t.w / 2;
    for (var q = 0; q <= n; q++) { var u = q / n, yy2 = t.y + (top - t.y) * u, cx = t.x + t.lean * (t.y - yy2) + Math.sin(u * 3 + t.x) * wb * 0.15, hw = wb * (1 - 0.3 * u) * (1 + 0.9 * Math.pow(Math.max(0, 1 - u * 9), 2)); L.push([cx - hw, yy2]); R.push([cx + hw, yy2]); SL.push([cx + hw * 0.25, yy2]); }
    o.b += n12_P(L.concat(R.slice().reverse())); o.s += n12_P(SL.concat(R.slice().reverse()));
    o.h += n12_P(L.map(function (p) { return [p[0] + wb * 0.18, p[1]]; }).slice(1, -2).concat(L.map(function (p) { return [p[0] + wb * 0.34, p[1]]; }).slice(1, -2).reverse()));
    for (var r = 0; r < 4; r++) { var sd = r < 2 ? -1 : 1, rl = wb * (1.2 + (r % 2) * 0.9), ry = t.y - wb * 0.08 * (r % 2); o.b += n12_P([[t.x + sd * wb * 0.6, ry - wb * 0.7], [t.x + sd * (wb * 0.9 + rl), ry + wb * 0.12], [t.x + sd * wb * 0.4, ry + wb * 0.1]]); if (sd > 0) o.s += n12_P([[t.x + wb * 0.7, ry - wb * 0.5], [t.x + wb * 0.9 + rl, ry + wb * 0.12], [t.x + wb * 0.6, ry + wb * 0.12]]); }
    if (fork) { var fy = Y(3.0 + (t.x % 1) * 0.4, t.z), fx = t.x + t.lean * (t.y - fy); if (fy > 0) [[-1, 0.55], [1, 0.45], [0.2, 0.35]].forEach(function (f) { var ex = fx + f[0] * wb * 6, ey = fy - wb * 9; o.b += n12_limb(fx + f[0] * wb * 0.3, fy + wb, ex, ey, wb * f[1] * 1.3, wb * 0.12, f[0] * wb * 1.5); }); }
    return o; };
  var ft = ''; trunks[3].forEach(function (t) { ft += trunk(t, false).b; }); add(far, 'f', ft, dk ? '#4A5486' : '#C9CFC8');
  // canopy: crowns at a height of about 2.9 to 4.5 above the ground, so they come down toward the horizon in the distance
  var crown = function (za, zb, n) { var out = []; for (var q = 0; q < n; q++) { var w2 = 1 / zb + (1 / za - 1 / zb) * rnd(), zc = 1 / w2, xc = (rnd() - 0.5) * W * 1.3 * zc / D, yc = 2.9 + rnd() * 1.6; out.push({x: X(xc, zc), y: Y(yc, zc), r: (0.5 + rnd() * 0.5) * D / zc, z: zc}); } return out.sort(function (a, b) { return b.z - a.z; }); };
  var fc = ''; crown(LB[2], ZF, ph ? 90 : 180).forEach(function (c) { fc += n12_puffs(c.x, c.y, c.r * 1.9, c.r * 0.42, rnd, 7); }); add(far, 'g', fc, dk ? '#1E2C52' : '#D8E8AE');
  // ---- refl: the middle distance
  add(refl, 'a', below(E1, H + 40), dk ? '#2E3470' : '#8C92D6');
  var rp = ''; for (i = 0; i < (ph ? 40 : 80); i++) { var z2 = LB[1] + rnd() * (LB[2] - LB[1]), xx2 = vx + (rnd() - 0.5) * W * 1.3, yy3 = vy + D / z2, w3 = (ph ? 30 : 60) * (0.5 + rnd()) * 7 / z2; rp += n12_E(xx2, yy3, w3, w3 * 0.1 + 1.5); }
  add(refl, 'b', rp, dk ? '#3C3E88' : '#7478CC');
  add(refl, 'c', pathPoly(LB[1] * 0.95, LB[2] * 1.12), dk ? '#3A3460' : '#B49C7C');
  var rt = {b: '', s: ''}; trunks[2].forEach(function (t) { var o = trunk(t, true); rt.b += o.b; rt.s += o.s; });
  add(refl, 'd', rt.b, dk ? '#3E4878' : '#B4BAB8'); add(refl, 'e', rt.s, dk ? '#333C68' : '#9EA4A6');
  var rc = {d: '', l: ''}; crown(LB[1], LB[2], ph ? 70 : 140).forEach(function (c) { rc.d += n12_puffs(c.x, c.y, c.r * 1.8, c.r * 0.45, rnd, 8); rc.l += n12_puffs(c.x - c.r * 0.15, c.y - c.r * 0.16, c.r * 1.2, c.r * 0.24, rnd, 6); });
  add(refl, 'f', rc.d, dk ? '#1A2848' : '#A6CC6A'); add(refl, 'g', rc.l, dk ? '#22345A' : '#C6E28A');
  add(refl, 'h', n12_E(vx, vy + D * 0.06, W * 0.85, D * 0.12), dk ? 'rgba(120,130,220,0.14)' : 'rgba(186,176,240,0.3)');
  // ---- mid: the nearer wood, bluebells in drifts, the path, beech trunks forking into a canopy of fresh leaves
  add(mid, 'a', below(E2, H + 40), dk ? '#28336A' : '#7078D2');
  var md = '', tr2 = trunks[1].concat(trunks[0]);
  for (i = 0; i < (ph ? 50 : 90); i++) { var zb2 = 0.9 + Math.pow(rnd(), 1.3) * (LB[1] - 0.9), cx2 = vx + (rnd() - 0.5) * W * 1.3, cy2 = vy + D / zb2, rw2 = (0.6 + rnd() * 1.2) * D / zb2; if (cy2 > n12_yOn(E2, cx2) + rw2 * 0.06) md += n12_E(cx2, cy2, rw2, rw2 * (0.06 + rnd() * 0.04) / Math.max(1, zb2 * 0.5)); }
  md += n12_P(E2.map(function (p) { return [p[0], p[1] - 1]; }).concat(E2.slice().reverse().map(function (p, q) { return [p[0], p[1] + D / LB[1] * (0.22 + 0.08 * Math.sin(p[0] / 70 + 1))]; })));
  add(mid, 'b', md, dk ? '#34418C' : '#8C94E4');
  // green leaves showing through the flowers, more of them nearer; then bells as clusters of dots (stroke t)
  var gl = '', bd = '', clear = function (bx, by, hh) { for (var q = 0; q < tr2.length; q++) { var t = tr2[q]; if (Math.abs(bx - t.x) < t.w * 0.9 && by - hh < t.y) return false; } return true; };
  for (i = 0; i < (ph ? 6500 : 5200); i++) { var z4 = 0.85 + Math.pow(rnd(), 1.5) * (LB[1] - 0.85), xw4 = (rnd() - 0.5) * W * 1.25 * z4 / D; if (Math.abs(xw4 - pathX(z4)) < (ph ? 0.27 : 0.47)) continue; var bx2 = X(xw4, z4), by2 = Y(0, z4), hh = 0.16 * D / z4 * (0.6 + rnd() * 0.6);
    if (by2 < n12_yOn(E2, bx2) + 2 || !clear(bx2, by2, hh)) continue; var near1 = Math.max(0, 1 - (z4 - 0.85) / 2.6);
    if (rnd() < 0.12 + near1 * 0.3) gl += n12_lf(bx2, by2, hh * (0.6 + rnd() * 0.4), hh * 0.06, -Math.PI / 2 + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6));
    if (rnd() < 0.8) { var sd = rnd() < 0.5 ? -1 : 1, nb2 = 3 + Math.floor(rnd() * 3); for (k = 0; k < nb2; k++) { var tk = k / nb2; bd += n12_dot(bx2 + sd * hh * 0.3 * tk * tk, by2 - hh * (0.6 + 0.4 * tk)); } } }
  add(mid, 'c', gl, dk ? '#22405A' : '#4E8A46');
  add(mid, 'd', pathPoly(0.82, LB[1] * 1.1), dk ? '#3A3258' : '#A4825E');
  var lit = ''; for (i = 0; i < (ph ? 220 : 420); i++) { var z3 = 0.85 + Math.pow(rnd(), 1.4) * (LB[1] - 0.85), hw3 = 0.4 * (1 + 0.14 * Math.sin(z3 * 6.1)), cw = pathX(z3) + (rnd() - 0.5) * hw3 * (ph ? 1.0 : 1.8), s3 = 0.022 * D / z3, px3 = X(cw, z3), py3 = Y(0, z3), an = (rnd() - 0.5) * 1.2; lit += 'M' + PT(px3 - Math.cos(an) * s3, py3 - Math.sin(an) * s3 * 0.4) + ' L' + PT(px3 + Math.cos(an) * s3, py3 + Math.sin(an) * s3 * 0.4) + ' '; }
  var mtr = {b: '', s: ''}; trunks[1].forEach(function (t) { var o = trunk(t, true); mtr.b += o.b; mtr.s += o.s; });
  add(mid, 'e', mtr.b, dk ? '#4C5888' : '#AEB4B4'); add(mid, 'f', mtr.s, dk ? '#3A4474' : '#8E9698');
  var mc = {d: '', l: ''}; crown(LB[0], LB[1], ph ? 40 : 70).forEach(function (c) { mc.d += n12_puffs(c.x, c.y, c.r * 1.7, c.r * 0.42, rnd, 8); for (var q = 0; q < 3; q++) n12_leafCluster(c.x + (rnd() - 0.5) * c.r * 2, c.y + (rnd() - 0.3) * c.r * 0.7, c.r * 0.4, rnd, mc, 0.25); mc.l += n12_puffs(c.x - c.r * 0.15, c.y - c.r * 0.15, c.r * 1.1, c.r * 0.22, rnd, 6); });
  // the high canopy: a ceiling of fresh leaves across the top with a ragged, leafy lower edge
  var cl2 = n12_fn(-60, W + 60, 10, function (xx) { return H * (ph ? 0.06 : 0.035) + Math.sin(xx / 170 + 0.4) * 46 * S + Math.sin(xx / 90 + 1) * 10 * S + Math.sin(xx / 37 + 2) * 7 * S + Math.max(0, Math.sin(xx / 210)) * 30 * S; }); mc.d += n12_P([[-60, -60], [W + 60, -60]].concat(cl2.slice().reverse()));
  cl2.forEach(function (p, q) { if (q % 2 || p[1] < -10) return; mc.d += n12_C(p[0], p[1], (10 + rnd() * 12) * S + 3); n12_leafCluster(p[0], p[1] + 6 * S, (26 + rnd() * 20) * S, rnd, mc, 0.3); if (rnd() < 0.5) mc.l += n12_E(p[0] - 4, p[1] - 8 * S, (16 + rnd() * 14) * S, (6 + rnd() * 4) * S); });
  add(mid, 'g', mc.d, dk ? '#18263E' : '#86BC4E'); add(mid, 'h', mc.l, dk ? '#22324E' : '#B8DE68');
  stk(mid, 's', lit, dk ? '#2A2442' : '#7C5A3A', 1.6 * S + 0.5); stk(mid, 't', bd, dk ? '#5A64D0' : '#4E4CC0', 1.7 * S + 0.5);
  // ---- near: a foreground bank, big beeches at the edges, low boughs of fresh leaves, the nearest bluebells
  var bank = n12_fn(-60, W + 60, 8, function (xx) { return H - H * (ph ? 0.07 : 0.085) + Math.sin(xx / 110 + 1) * 8 * S + Math.sin(xx / 37) * 3; });
  var nb = {b: '', s: '', h: ''}; trunks[0].forEach(function (t) { var o = trunk(t, false); nb.b += o.b; nb.s += o.s; nb.h += o.h; });
  (ph ? [[0.02, 1.25]] : [[0.03, 1.15], [0.985, 1.3]]).forEach(function (q) { var t = {x: W * q[0], y: Y(0, q[1]), w: (ph ? 0.26 : 0.3) * D / q[1] * (ph ? 1.4 : 1), z: q[1], lean: q[0] < 0.5 ? 0.04 : -0.03}, o = trunk(t, false); nb.b += o.b; nb.s += o.s; nb.h += o.h; tr2.push(t);
    for (k = 0; k < 4; k++) { var by4 = t.y - t.w * (1.6 + k * 1.7 + rnd() * 0.8), bx4 = t.x + t.lean * (t.y - by4) - t.w * 0.1 + (rnd() - 0.5) * t.w * 0.3; nb.s += n12_RE(bx4, by4, t.w * (0.1 + rnd() * 0.06), t.w * 0.018, (rnd() - 0.5) * 8); } });
  add(near, 'a', below(bank, H + 40), dk ? '#1C2848' : '#4E7C3E');
  add(near, 'b', nb.b, dk ? '#56628F' : '#B2B8B6'); add(near, 'c', nb.s, dk ? '#404A78' : '#8C9496'); add(near, 'd', nb.h, dk ? '#6E7AA8' : '#CDD2CC');
  var nl = {d: '', l: ''}; (ph ? [[0.12, -0.02], [0.75, 0.03], [0.4, -0.04]] : [[0.1, -0.03], [0.32, -0.05], [0.62, -0.04], [0.86, 0.0]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1]; for (k = 0; k < (ph ? 5 : 7); k++) n12_leafCluster(cx + (rnd() - 0.5) * W * (ph ? 0.3 : 0.18), cy + rnd() * H * 0.1, (ph ? 34 : 52) * S * (0.8 + rnd() * 0.5) * (ph ? 1.3 : 1), rnd, nl, 0.3); });
  add(near, 'e', nl.d, dk ? '#162238' : '#6CA83C'); add(near, 'f', nl.l, dk ? '#1E2E48' : '#A8D85A');
  var fb = [], fstep = ph ? 9 : 12; for (x = -10; x < W + 10; x += fstep * (0.5 + rnd())) { var yb = n12_yOn(bank, x) + 6 + rnd() * H * 0.08; fb.push({x: x, y: yb, h: (ph ? 66 : 104) * S * (0.6 + rnd() * 0.6) * (ph ? 1.25 : 1) * (0.7 + (yb - H * 0.9) / H * 3), lean: rnd() - 0.5, ph: rnd() * 6.28, n: 4 + Math.floor(rnd() * 4)}); }
  var fo = {st: '', b: '', lv: ''}, wf = '';
  fb.forEach(function (f) { for (k = 0; k < 3; k++) { var la = -Math.PI / 2 + (k - 1) * 0.55 + (rnd() - 0.5) * 0.3; fo.lv += n12_lf(f.x, f.y, f.h * (0.5 + rnd() * 0.25), f.h * 0.03, la); } if (!ANIM) n12_bluebell(fo, f.x, f.y, f.h, f.lean, rnd); });
  for (i = 0; i < (ph ? 16 : 30); i++) { var ax = rnd() * W, ay = n12_yOn(bank, ax) + 4 + rnd() * H * 0.06, ar = (ph ? 3.4 : 4.6) * S + 1; for (k = 0; k < 6; k++) wf += n12_dot(ax + Math.cos(k * 1.047) * ar, ay + Math.sin(k * 1.047) * ar * 0.7); }
  add(near, 'g', fo.lv, dk ? '#24405A' : '#3E7A34'); add(near, 'h', fo.b, dk ? '#5A62C8' : '#5A58C4');
  stk(near, 's', fo.st, dk ? '#30506A' : '#4E8A44', 1.4 * S + 0.5); stk(near, 't', wf, dk ? 'rgba(220,226,250,0.75)' : '#FFFFFF', (ph ? 3.4 : 4.4) * S + 0.8);
  var gaps = []; for (i = 0; i < (ph ? 10 : 20); i++) gaps.push([rnd() * W, rnd() * vy * 0.85, rnd() * 6.28]);
  if (ANIM) { ANIM.vp = [vx, vy, D]; ANIM.fb = fb; ANIM.S = S; ANIM.gaps = gaps; ANIM.glow = [gx0, gy0]; ANIM.pathX = pathX; ANIM.LB = LB; ANIM.E2 = E2; ANIM.bank = bank; ANIM.trunks = tr2.concat(trunks[2]).map(function (t) { return [t.x, t.y, t.w]; }); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
