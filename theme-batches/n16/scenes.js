// ---- batch n16: saguaro (Saguaro Sunset), baobab (Baobab Dusk)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n16_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n16_P(pts) { return pts.length > 2 ? poly(n16_cw(pts)) : ''; }
function n16_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n16_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n16_REp(x, y, rx, ry, ang, n) { var p = []; n = n || 20; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return rotp(p, x, y, ang); }
function n16_RE(x, y, rx, ry, ang) { return n16_P(n16_REp(x, y, rx, ry, ang)); }
function n16_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n16_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n16_dot(x, y) { return 'M' + PT(x, y) + ' h0.01 '; }
function n16_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
function n16_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n16_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 12; i++) { var t = i / 12, ww = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n16_leaf(x, y, len, w, ang, bend) { return n16_P(n16_leafPts(x, y, len, w, ang, bend)); }
// a tapered band from (x0,y0) to (x1,y1), bowed sideways by bend
function n16_limb(x0, y0, x1, y1, w0, w1, bend) { var L = [], R = [], n = 8; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); } return n16_P(L.concat(R.reverse())); }
function n16_starPts(x, y, R, r, n, rot) { var p = []; for (var i = 0; i < n * 2; i++) { var a = rot + i * Math.PI / n - Math.PI / 2, q = i % 2 ? r : R; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return p; }
// convex hull (monotone chain) and Sutherland-Hodgman clipping of any polygon by a convex one
function n16_hull(P) { var p = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }), cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [], i;
  for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
  for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
  up.pop(); lo.pop(); return lo.concat(up); }
function n16_clip(subj, clipP) { var cp = n16_cw(clipP), out = subj, i, j; var inside = function (p, a, b) { return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0; };
  var X = function (p, q, a, b) { var x1 = p[0], y1 = p[1], x2 = q[0], y2 = q[1], x3 = a[0], y3 = a[1], x4 = b[0], y4 = b[1], d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(d) < 1e-9) return q; var t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d; return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; };
  // n16_cw makes the polygon clockwise in screen space (y down), so "inside" is to the right of each edge
  var sgn = 0; for (i = 0; i < cp.length; i++) { var p = cp[i], q = cp[(i + 1) % cp.length]; sgn += p[0] * q[1] - q[0] * p[1]; } if (sgn < 0) cp = cp.slice().reverse();
  for (i = 0; i < cp.length && out.length; i++) { var a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
    for (j = 0; j < inp.length; j++) { var P = inp[j], Q = inp[(j + 1) % inp.length], pin = inside(P, a, b), qin = inside(Q, a, b); if (pin) { out.push(P); if (!qin) out.push(X(P, Q, a, b)); } else if (qin) out.push(X(P, Q, a, b)); } }
  return out; }
// a jagged mountain ridge: random peaks, then midpoint displacement for rugged desert ranges
function n16_jag(W, y0, dy, np, rnd, rough) { var p = [], i, k; for (i = 0; i <= np; i++) p.push([-80 + (W + 160) * (i / np) + (rnd() - 0.5) * W / np * 0.4, y0 + rnd() * dy]);
  for (k = 0; k < 5; k++) { var q = [p[0]]; for (i = 1; i < p.length; i++) { var a = p[i - 1], b = p[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); q.push([(a[0] + b[0]) / 2 + (rnd() - 0.5) * d * 0.12, (a[1] + b[1]) / 2 + (rnd() - 0.5) * d * rough]); q.push(b); } p = q; rough *= 0.62; }
  return p; }
// a smooth tube along a centre line (half width w(u)), with a round cap at the far end; opt.off shifts it sideways
// towards the light L (so lit bands and rims follow every bend), opt.k narrows it.
function n16_tube(cl, wf, L, off, k, cap) { var A = [], B = [], n = cl.length, i, nx = 0, ny = 0, s = 0;
  for (i = 0; i < n; i++) { var p = cl[i], q = cl[Math.min(n - 1, i + 1)], o = cl[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = wf(i / (n - 1));
    nx = -dy / dl; ny = dx / dl; s = L ? Math.max(-1, Math.min(1, (nx * L[0] + ny * L[1]) * 3)) : 0; var c = off ? off * s * w : 0, hw = w * (k || 1) * (off ? Math.abs(s) * 0.7 + 0.3 : 1);
    A.push([p[0] + nx * (c + hw), p[1] + ny * (c + hw)]); B.push([p[0] + nx * (c - hw), p[1] + ny * (c - hw)]); }
  var capP = []; if (cap !== false) { var e = cl[n - 1], f = cl[n - 2], ex = e[0] - f[0], ey = e[1] - f[1], el = Math.hypot(ex, ey) || 1, w2 = wf(1) * (k || 1) * (off ? Math.abs(s) * 0.7 + 0.3 : 1), cx = e[0] + nx * (off ? off * s * wf(1) : 0), cy = e[1] + ny * (off ? off * s * wf(1) : 0);
    for (i = 1; i < 8; i++) { var a = Math.atan2(ny, nx) - i / 8 * Math.PI; capP.push([cx + Math.cos(a) * w2, cy + Math.sin(a) * w2 * 0.9]); } }
  return n16_P(A.concat(capP, B.reverse())); }
// lines along a centre line at fixed sideways offsets (cactus ribs)
function n16_ribs(cl, wf, offs, from) { var d = ''; offs.forEach(function (f) { var pts = [], n = cl.length; for (var i = from || 0; i < n; i++) { var p = cl[i], q = cl[Math.min(n - 1, i + 1)], o = cl[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = wf(i / (n - 1)) * f; pts.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); } d += pline(pts); }); return d; }

// =============== 1. Saguaro Sunset: the Sonoran desert at sunset, saguaros, ocotillo, prickly pear, brittlebush and red rocks
// a saguaro: a fluted column with J-shaped arms. o.b body, o.l lit band, o.r rim, o.s ribs, o.p spines; returns the crown tips
function n16_saguaro(x, y, h, rnd, arms, o, detail, L) { var w = h * 0.05, tips = [], i, top = y - h, lean = (rnd() - 0.5) * w * 0.6;
  var tcl = []; for (i = 0; i <= 14; i++) { var u = i / 14; tcl.push([x + lean * u * u + Math.sin(u * 3 + x) * w * 0.05, y + 6 - (h + 6 - w * 0.6) * u]); }
  var twf = function (u) { return w * (1.06 - 0.1 * u + (u < 0.08 ? (0.08 - u) * 1.2 : 0)); };
  var parts = [[tcl, twf]];
  arms.forEach(function (a) { var ya = y - h * a[0], sd = a[1], d = w * a[2], rise = h * a[3], aw = w * (a[4] || 0.78), bx = x + lean * a[0] * a[0], c = [[bx, ya + w * 0.4], [bx + sd * d * 0.5, ya + w * 0.35], [bx + sd * d * 0.92, ya - w * 0.5], [bx + sd * d * 1.02, ya - w * 1.9], [bx + sd * d * (1 + (rnd() - 0.5) * 0.08), ya - rise]], cl = n16_curve(c, 5), awf = function (u) { return aw * (u < 0.15 ? 0.82 + u * 1.2 : 1) * (1 - 0.06 * u); };
    parts.push([cl, awf]); tips.push([cl[cl.length - 1][0], cl[cl.length - 1][1] - aw * 0.9, aw]); });
  tips.unshift([tcl[tcl.length - 1][0], tcl[tcl.length - 1][1] - w * 0.9, w]);
  parts.forEach(function (pp, j) { o.b += n16_tube(pp[0], pp[1]);
    if (detail) { o.l += n16_tube(pp[0], pp[1], L, 0.42, 0.42); o.r += n16_tube(pp[0], pp[1], L, 0.86, 0.12);
      o.s += n16_ribs(pp[0], pp[1], detail > 1 ? [-0.72, -0.4, -0.1, 0.22, 0.52] : [-0.5, 0, 0.5], j ? 2 : 0);
      if (detail > 1) { var cl = pp[0]; for (var k = j ? 3 : 1; k < cl.length; k += 1) [-0.56, -0.25, 0.06, 0.37, 0.68].forEach(function (f, m) { if ((k + m) % 2) return; var p = cl[k], q = cl[Math.min(cl.length - 1, k + 1)], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, ww = pp[1](k / (cl.length - 1)) * f; o.p += n16_dot(p[0] - dy / dl * ww, p[1] + dx / dl * ww); }); } } });
  return tips; }
// an ocotillo: a fan of long whip-like canes from one root (stems) with red flower tufts at the tips
function n16_oco(x, y, h, rnd, n) { var st = []; for (var i = 0; i < n; i++) { var u = (i + 0.5) / n - 0.5; st.push({a: -Math.PI / 2 + u * 1.15 + (rnd() - 0.5) * 0.12, L: h * (0.7 + rnd() * 0.32) * (1 - Math.abs(u) * 0.35), b: (rnd() - 0.5) * 0.25 + u * 0.3, ph: rnd() * 6.28}); } return {x: x, y: y, h: h, st: st}; }
function n16_ocoD(oc, sw, o) { var w = Math.max(1.2, oc.h * 0.012); oc.st.forEach(function (s) { var a = s.a + sw * (0.5 + 0.5 * Math.cos(s.ph)), ex = oc.x + Math.cos(a) * s.L, ey = oc.y + Math.sin(a) * s.L, mx = oc.x + Math.cos(a - s.b) * s.L * 0.55, my = oc.y + Math.sin(a - s.b) * s.L * 0.55;
  o.s += 'M' + PT(oc.x, oc.y) + ' Q' + PT(mx, my) + ' ' + PT(ex, ey) + ' ';
  for (var k = 1; k < 7; k++) { var u = k / 7.2, px = (1 - u) * (1 - u) * oc.x + 2 * u * (1 - u) * mx + u * u * ex, py = (1 - u) * (1 - u) * oc.y + 2 * u * (1 - u) * my + u * u * ey; o.l += n16_leaf(px, py, w * 3.2, w * 0.9, a * 180 / Math.PI + (k % 2 ? 50 : -50)); }
  o.f += n16_leaf(ex, ey + w, w * 7, w * 1.6, a * 180 / Math.PI) + n16_leaf(ex - w * 0.5, ey + w * 2, w * 5, w * 1.3, a * 180 / Math.PI - 14) + n16_leaf(ex + w * 0.5, ey + w * 2, w * 5, w * 1.3, a * 180 / Math.PI + 14); }); }
// a prickly pear clump: flat oval pads growing from the edges of others, with spine dots and red fruit on the top edges
function n16_pear(x, y, s, rnd, o, L) { var pads = [[x, y - s * 0.9, s * 0.62, s, (rnd() - 0.5) * 16]], i, k;
  for (i = 0; i < 7; i++) { var par = pads[Math.floor(rnd() * pads.length)], a = (par[4] - 90 + (rnd() - 0.5) * 150) * Math.PI / 180, px = par[0] + Math.cos(a) * par[3] * 0.85, py = par[1] + Math.sin(a) * par[3] * 0.85; if (py > y - s * 0.4) continue; var sc = 0.7 + rnd() * 0.25;
    pads.push([px + Math.cos(a) * par[3] * sc * 0.7, py + Math.sin(a) * par[3] * sc * 0.7, par[2] * sc, par[3] * sc, a * 180 / Math.PI + 90]); }
  pads.forEach(function (p, j) { var pts = n16_REp(p[0], p[1], p[2], p[3], p[4], 22); o.b += n16_P(pts); o.l += n16_P(n16_REp(p[0] + p[2] * 0.22 * L[0], p[1] + p[3] * 0.18 * L[1], p[2] * 0.7, p[3] * 0.78, p[4], 18));
    o.r += n16_P(n16_REp(p[0] + p[2] * 0.62 * L[0], p[1] + p[3] * 0.45 * L[1], p[2] * 0.28, p[3] * 0.5, p[4] + 18 * L[0], 14));
    for (k = 0; k < 9; k++) { var u = ((k * 0.37 + j * 0.13) % 1) * 2 - 1, v = ((k * 0.61 + j * 0.29) % 1) * 2 - 1; if (u * u + v * v < 0.7) { var q = rotp([[u * p[2] * 0.8, v * p[3] * 0.8]], p[0], p[1], p[4])[0]; o.p += n16_dot(q[0], q[1]); } }
    if (j && rnd() < 0.55) for (k = 0; k < 1 + Math.floor(rnd() * 3); k++) { var fa = (p[4] - 90 + (k - 1.2) * 28) * Math.PI / 180, fx = p[0] + Math.cos(fa) * p[2] * 0.95 * Math.abs(Math.cos(fa)) + Math.cos(fa) * p[3] * 0.95 * Math.abs(Math.sin(fa)), fy = p[1] + Math.sin(fa) * p[3] * 0.97; o.f += n16_RE(fx, fy - s * 0.06, s * 0.085, s * 0.13, fa * 180 / Math.PI + 90); } });
  return pads; }
// a red rock boulder: rounded, with a lit cap facing the sun
function n16_rock(x, y, rx, ry, rnd, o, lit) { var p = n16_blob(x, y - ry * 0.6, rx, ry, rnd, 12, 0.14).map(function (q) { return [q[0], Math.min(q[1], y + 2)]; }); o.b += n16_P(p);
  if (lit) o.l += n16_P(n16_blob(x + rx * 0.22 * lit, y - ry * 0.95, rx * 0.62, ry * 0.42, rnd, 10, 0.12)); }

SCENES.saguaro = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.4), refl = Lay(0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, y, k;
  var hz = H * (ph ? 0.52 : 0.57), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#04061A 0%,#0A1034 ' + Math.round(p1 * 0.4) + '%,#1E1E52 ' + Math.round(p1 * 0.75) + '%,#4A3266 ' + Math.round(p1 * 0.94) + '%,#6A3E62 ' + p1 + '%,#2A2440 100%)'
    : 'linear-gradient(180deg,#4E3C8C 0%,#8A4A98 ' + Math.round(p1 * 0.22) + '%,#D4588A ' + Math.round(p1 * 0.46) + '%,#F87C60 ' + Math.round(p1 * 0.68) + '%,#FFAA58 ' + Math.round(p1 * 0.86) + '%,#FFD88E ' + p1 + '%,#C8786A 100%)';
  var sx = W * (ph ? 0.64 : 0.6), sy = hz - H * (ph ? 0.035 : 0.045), sr = ph ? 34 : 54;
  var mx = W * (ph ? 0.7 : 0.7), my = hz - H * (ph ? 0.1 : 0.115), mr = ph ? 26 : 40;
  var LX = dk ? mx : sx, Ldir = function (px, py) { var dx = LX - px, dy = -0.7 * Math.abs(LX - px) - H * 0.2, d = Math.hypot(dx, dy); return [dx / d, dy / d]; };
  // the sun (or the rising moon) and its halo; at night the stars and a faint Milky Way
  if (!dk) { add(far, 'a', n16_C(sx, sy, sr * 4.2), 'rgba(255,214,150,0.22)'); add(far, 'b', n16_C(sx, sy, sr * 2.2), 'rgba(255,236,190,0.36)'); add(far, 'c', n16_C(sx, sy, sr), '#FFF4D2'); }
  else { if (!ANIM) { add(far, 'a', n16_C(mx, my, mr * 5) + n16_C(mx, my, mr * 4) + n16_C(mx, my, mr * 3.1), 'rgba(255,214,190,0.04)'); add(far, 'b', n16_C(mx, my, mr * 2.3) + n16_C(mx, my, mr * 1.7) + n16_C(mx, my, mr * 1.3), 'rgba(255,226,200,0.06)'); }
    if (!ANIM) add(far, 'c', n16_C(mx, my, mr), '#FFE6C0');
    var st = '', mw = ''; spread(0, 0, W, hz, 22, 22, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - mx, c.y - my) > mr * 2.6 && c.y < hz * (0.7 + c.r * 0.28)) st += n16_dot(c.x, c.y); });
    for (i = 0; i < (ph ? 140 : 360); i++) { var u = rnd(), d2 = (rnd() + rnd() - 1) * H * 0.07; x = W * (-0.05 + u * 0.75); y = hz * (0.95 - u * 1.05) + d2; if (y > 0 && y < hz * 0.8) st += n16_dot(x, y); }
    for (i = 0; i <= 30; i++) { var u2 = i / 30; mw += n16_RE(W * (-0.05 + u2 * 0.75), hz * (0.95 - u2 * 1.05), W * 0.06, H * 0.05 * (0.7 + rnd() * 0.6), -Math.atan2(hz * 1.05, W * 0.75) * 180 / Math.PI); }
    add(far, 'h', mw, 'rgba(150,140,230,0.07)'); stk(far, 't', st, 'rgba(255,246,236,0.9)', ph ? 1.6 : 1.9); }
  // long streaky sunset clouds, lit from below (upper ones violet-pink, lower ones golden)
  var cU = '', cL = '', cE = '', wisp = '';
  (ph ? [[0.2, 0.1, 0.5], [0.75, 0.16, 0.6], [0.35, 0.26, 0.55], [0.9, 0.33, 0.4], [0.15, 0.38, 0.35]] : [[0.12, 0.08, 0.34], [0.5, 0.06, 0.4], [0.86, 0.12, 0.36], [0.3, 0.2, 0.38], [0.7, 0.25, 0.3], [0.05, 0.3, 0.25], [0.45, 0.34, 0.26], [0.95, 0.36, 0.2]]).forEach(function (q, j) {
    if (dk && j % 2) return; var cx = W * q[0], cy = H * q[1], len = W * q[2], th = (ph ? 9 : 13) * (0.7 + rnd() * 0.6), top = [], bot = [], n = 26;
    for (k = 0; k <= n; k++) { var u = k / n, e = Math.sin(Math.PI * u), xx = cx - len / 2 + len * u + Math.sin(u * 5 + j) * 6; top.push([xx, cy - th * e * (0.6 + 0.5 * Math.abs(Math.sin(u * 9 + j * 2))) - th * 0.2 * e]); bot.push([xx, cy + th * 0.35 * e + Math.sin(u * 13 + j) * 1.5 * e]); }
    var body = n16_P(top.concat(bot.slice().reverse())); if (cy < H * 0.2) cU += body; else cL += body;
    cE += n16_P(bot.map(function (p, m) { return [p[0], p[1] - th * 0.32 * Math.sin(Math.PI * m / n)]; }).concat(bot.slice().reverse().map(function (p) { return [p[0], p[1] + 0.6]; })));
    if (!dk) wisp += pline(n16_fn(cx - len * 0.6, cx + len * 0.55, 20, function (xx) { return cy + th * 1.4 + Math.sin(xx / 60 + j) * 3; })); });
  add(far, 'd', cU, dk ? 'rgba(40,40,90,0.75)' : '#A94E92'); add(far, 'e', cL, dk ? 'rgba(60,50,100,0.7)' : '#E8687A'); add(far, 'f', cE, dk ? 'rgba(120,110,170,0.6)' : '#FFB98A');
  if (!dk) stk(far, 's', wisp, 'rgba(255,200,170,0.45)', 1.6);
  // three purple mountain ranges, jagged and receding, rimmed with sunset light near the sun
  var Ls = dk ? mx : sx, rim = '';
  var rimSeg = function (pts, sp) { var run = []; pts.forEach(function (p) { if (Math.abs(p[0] - Ls) < W * sp) run.push([p[0], p[1] + 0.8]); else { if (run.length > 1) rim += pline(run); run = []; } }); if (run.length > 1) rim += pline(run); };
  var r1 = n16_jag(W, hz - H * (ph ? 0.12 : 0.15), H * 0.07, ph ? 5 : 9, rnd, 0.22);
  add(far, 'g', n16_P(r1.concat([[W + 80, H + 80], [-80, H + 80]])), dk ? '#3A2C5C' : '#B0789E');
  var fac = ''; for (i = 2; i < r1.length - 2; i++) { var p = r1[i]; if (p[1] < r1[i - 1][1] && p[1] < r1[i + 1][1] && p[1] < hz - H * 0.05) { var sd = p[0] < Ls ? 1 : -1, len = (hz - p[1]) * 0.9; fac += n16_P([p, [p[0] + sd * len * 0.25, p[1] + len * 0.55], [p[0] + sd * len * 0.05, hz + 4], [p[0] - sd * len * 0.08, p[1] + len * 0.5]]); } }
  add(far, 'h', fac, dk ? 'rgba(90,80,140,0.14)' : 'rgba(255,190,190,0.12)');
  rimSeg(r1, 0.3);
  var r2 = n16_jag(W, hz - H * (ph ? 0.075 : 0.09), H * 0.05, ph ? 4 : 7, rnd, 0.26), r3 = n16_jag(W, hz - H * (ph ? 0.035 : 0.04), H * 0.035, ph ? 6 : 11, rnd, 0.3);
  add(refl, 'a', n16_P(r2.concat([[W + 80, H + 80], [-80, H + 80]])), dk ? '#2C2450' : '#8E5A92');
  var fac2 = ''; for (i = 2; i < r2.length - 2; i++) { var p2 = r2[i]; if (p2[1] < r2[i - 1][1] && p2[1] < r2[i + 1][1]) { var sd2 = p2[0] < Ls ? 1 : -1, len2 = (hz - p2[1]) * 0.95; fac2 += n16_P([p2, [p2[0] + sd2 * len2 * 0.3, p2[1] + len2 * 0.6], [p2[0] + sd2 * len2 * 0.12, hz + 6], [p2[0] - sd2 * len2 * 0.04, p2[1] + len2 * 0.4]]); } }
  add(refl, 'b', fac2, dk ? 'rgba(80,70,130,0.3)' : 'rgba(240,150,170,0.3)');
  add(refl, 'c', n16_P(r3.concat([[W + 80, H + 80], [-80, H + 80]])), dk ? '#221C40' : '#6E4478');
  rimSeg(r2, 0.22); rimSeg(r3, 0.16);
  stk(refl, 's', rim, dk ? 'rgba(220,200,255,0.22)' : 'rgba(255,196,140,0.75)', 1.6);
  add(refl, 'd', n16_E(sx * 0.5 + W * 0.25, hz, W * 0.7, H * 0.035), dk ? 'rgba(120,80,130,0.18)' : 'rgba(255,170,140,0.32)');
  // a red rock butte off to one side: a flat top, sheer banded cliffs and a talus apron
  var bx0 = W * (ph ? 0.02 : 0.68), bx1 = W * (ph ? 0.42 : 1.04), bt = hz - H * (ph ? 0.1 : 0.13), bb = hz + H * 0.012, bw = bx1 - bx0, but = [];
  but.push([bx0 - bw * 0.12, bb]); but.push([bx0 + bw * 0.04, bb - (bb - bt) * 0.28]); but.push([bx0 + bw * 0.14, bb - (bb - bt) * 0.42]); but.push([bx0 + bw * 0.16, bt + 6]); but.push([bx0 + bw * 0.2, bt]);
  for (k = 1; k < 8; k++) but.push([bx0 + bw * (0.2 + 0.6 * k / 8), bt - Math.sin(k * 2.3) * 1.5]);
  but.push([bx0 + bw * 0.8, bt]); but.push([bx0 + bw * 0.83, bt + 8]); but.push([bx0 + bw * 0.86, bb - (bb - bt) * 0.45]); but.push([bx0 + bw * 0.98, bb - (bb - bt) * 0.25]); but.push([bx0 + bw * 1.14, bb]);
  add(refl, 'e', n16_P(but), dk ? '#2A1E3C' : '#9A4652');
  var bsd = (bx0 + bx1) / 2 > Ls ? -1 : 1, blit = '', bstr = '';
  // the face turned toward the sun catches the light; strata bands run across the cliffs
  if (bsd < 0) blit += n16_P([[bx0 + bw * 0.16, bt + 6], [bx0 + bw * 0.2, bt], [bx0 + bw * 0.3, bt], [bx0 + bw * 0.27, bb - (bb - bt) * 0.4], [bx0 + bw * 0.14, bb - (bb - bt) * 0.42]]);
  else blit += n16_P([[bx0 + bw * 0.83, bt + 8], [bx0 + bw * 0.8, bt], [bx0 + bw * 0.7, bt], [bx0 + bw * 0.73, bb - (bb - bt) * 0.4], [bx0 + bw * 0.86, bb - (bb - bt) * 0.45]]);
  blit += n16_P([[bx0 + bw * 0.2, bt], [bx0 + bw * 0.8, bt], [bx0 + bw * 0.79, bt + 3], [bx0 + bw * 0.21, bt + 3]]);
  for (k = 0; k < 5; k++) { var yy = bt + (bb - bt) * (0.12 + k * 0.13) , xa = bx0 + bw * (0.17 - k * 0.02), xb = bx0 + bw * (0.83 + k * 0.02); bstr += n16_P([[xa, yy], [xb, yy + 1], [xb, yy + 2.6 + k * 0.4], [xa, yy + 2 + k * 0.4]]); }
  for (k = 0; k < 9; k++) { var cxk = bx0 + bw * (0.24 + k * 0.065 + (rnd() - 0.5) * 0.02); bstr += n16_P([[cxk, bt + 5], [cxk + 1.6, bt + 5], [cxk + 1 + (rnd() - 0.5) * 3, bt + (bb - bt) * (0.4 + rnd() * 0.3)], [cxk + 0.4, bt + (bb - bt) * (0.4 + rnd() * 0.3)]]); }
  add(refl, 'f', blit, dk ? '#4A3A66' : '#E2704A'); add(refl, 'g', bstr, dk ? 'rgba(14,10,30,0.4)' : 'rgba(110,40,60,0.38)');
  // the desert floor, with gentle swells
  var floor = n16_fn(-60, W + 60, 10, function (xx) { return hz + Math.sin(xx / 140) * 1.2; });
  add(mid, 'a', below(floor, H + 40), dk ? '#2C2644' : '#D08068');
  var gy = H * (ph ? 0.85 : 0.83), gtop = function (xx) { var u = xx / W; return gy + Math.sin(xx / (ph ? 70 : 150) + 1) * 8 * S + Math.sin(xx / 41) * 2.5 - H * (ph ? 0.05 : 0.07) * Math.exp(-Math.pow((u - (ph ? 0.08 : 0.12)) / 0.16, 2)) + H * 0.02 * u; };
  var bands = ''; [0.06, 0.16, 0.3, 0.5].forEach(function (f, j) { var top = n16_fn(-60, W + 60, 12, function (xx) { return hz + (gy - hz) * f + Math.sin(xx / (80 + j * 50) + j * 2) * (1.5 + j * 2.5) * S; }); bands += n16_P(top.concat(top.slice().reverse().map(function (p) { return [p[0], p[1] + (1.5 + j * 2.6) * S * (0.6 + 0.4 * Math.sin(p[0] / 60 + j))]; }))); });
  // distant saguaro silhouettes and creosote dots, tiny at the horizon
  var dist = {b: ''}, tips = [], bush = '';
  var nD = ph ? 16 : 34; for (i = 0; i < nD; i++) { var v = Math.pow(rnd(), 1.6), dx2 = rnd() * W, dy2 = hz + 2 + v * (gy - hz) * 0.18, dh = H * (0.016 + v * 0.05) * (0.7 + rnd() * 0.6) * (ph ? 1.2 : 1);
    if (Math.abs(dx2 - sx) < sr * 0.6 && !dk) continue; var na = Math.floor(rnd() * 3.4), arms = []; for (k = 0; k < na; k++) arms.push([0.35 + rnd() * 0.2, k % 2 ? 1 : -1, 2.6 + rnd() * 0.8, 0.18 + rnd() * 0.12]);
    var tp = n16_saguaro(dx2, dy2, dh, rnd, arms, dist, 0); tp.forEach(function (t) { tips.push([t[0], t[1], t[2], 0]); }); }
  spread(0, hz + 2, W, (gy - hz) * 0.75, ph ? 26 : 40, ph ? 14 : 18, rnd, 1).forEach(function (c) { var v = (c.y - hz) / (gy - hz); if (c.q < 0.5) { var r = (1.2 + v * v * 10) * S * (ph ? 1.3 : 1) + 0.6; bush += n16_E(c.x, c.y, r * 1.4, r * 0.7) + n16_E(c.x + r * 0.8, c.y - r * 0.2, r, r * 0.6); } });
  // the middle distance: saguaros with long sunset shadows, ocotillo, creosote and rocks
  var MS = ph ? [[0.62, 0.32, 0.2], [0.86, 0.55, 0.26], [0.36, 0.12, 0.1], [0.8, 0.1, 0.07], [0.2, 0.06, 0.05]] : [[0.3, 0.25, 0.2], [0.44, 0.1, 0.11], [0.56, 0.36, 0.27], [0.72, 0.16, 0.15], [0.77, 0.44, 0.28], [0.62, 0.05, 0.07], [0.22, 0.07, 0.08], [0.94, 0.08, 0.09]];
  var ms = {b: '', l: '', r: '', s: '', p: ''}, shad = '', rk = {b: '', l: ''};
  MS.forEach(function (q, j) { var bx = W * q[0], by = hz + (gy - hz) * q[1], hh = H * q[2], na = 2 + Math.floor(rnd() * 3), arms = [], used = {};
    for (k = 0; k < na; k++) { var sdk = (k % 2 ? 1 : -1) * (j % 2 ? 1 : -1); arms.push([0.3 + k * 0.09 + rnd() * 0.08, sdk, 2.8 + rnd() * 1, 0.17 + rnd() * 0.14 - k * 0.02]); }
    var tp = n16_saguaro(bx, by, hh, rnd, arms, ms, hh > H * 0.12 ? 1 : 0.5, Ldir(bx, by)); tp.forEach(function (t) { tips.push([t[0], t[1], t[2], 1]); });
    var vx = bx - Ls, vy = by - hz + 2, vl = Math.hypot(vx, vy) || 1, sl = hh * (dk ? 0.7 : 1.3), ww = hh * 0.035;
    shad += n16_P([[bx - ww, by + 1], [bx + ww, by + 1], [bx + vx / vl * sl + ww * 0.3, by + vy / vl * sl * 0.45], [bx + vx / vl * sl - ww * 0.3, by + vy / vl * sl * 0.45]]);
    n16_rock(bx + hh * 0.18 * (j % 2 ? 1 : -1), by + 2, hh * 0.07, hh * 0.04, rnd, rk, 1); });
  var ocos = (ph ? [[0.74, 0.7, 0.2, 13]] : [[0.38, 0.55, 0.19, 13], [0.66, 0.74, 0.25, 15], [0.13, 0.32, 0.11, 10]]).map(function (q) { return n16_oco(W * q[0], hz + (gy - hz) * q[1], H * q[2], rnd, q[3]); });
  var oc = {s: '', l: '', f: ''}; if (!ANIM) ocos.forEach(function (o2) { n16_ocoD(o2, 0, oc); });
  ocos.forEach(function (o2) { rk.b += n16_E(o2.x, o2.y, o2.h * 0.08, o2.h * 0.02); });
  var mrk = [[0.48, 0.62, 0.045], [0.18, 0.5, 0.03], [0.78, 0.8, 0.05], [0.95, 0.66, 0.035]]; mrk.forEach(function (q) { if (ph && q[0] < 0.3) return; n16_rock(W * q[0], hz + (gy - hz) * q[1], H * q[2] * (ph ? 1.4 : 1), H * q[2] * 0.6, rnd, rk, 1); });
  // dry grass tufts on the floor
  var tuft = ''; spread(0, hz + (gy - hz) * 0.25, W, (gy - hz) * 0.75, ph ? 50 : 70, ph ? 40 : 50, rnd, 1).forEach(function (c) { if (c.q < 0.45) { var v2 = (c.y - hz) / (gy - hz), gh = (3 + v2 * 12) * S * (ph ? 1.4 : 1); for (k = -2; k <= 2; k++) tuft += 'M' + PT(c.x + k * gh * 0.15, c.y) + ' q' + n1(k * gh * 0.1) + ' ' + n1(-gh * 0.6) + ' ' + n1(k * gh * 0.35) + ' ' + n1(-gh * (1 - Math.abs(k) * 0.15)) + ' '; } });
  // the near ground (a low rise on the left where the big saguaro stands)
  var ground = n16_fn(-60, W + 60, 8, gtop);
  add(mid, 'b', bands + below(ground, H + 40), dk ? '#221C34' : '#B4604E');
  add(mid, 'c', shad, dk ? 'rgba(8,6,20,0.28)' : 'rgba(90,30,70,0.16)');
  add(mid, 'd', dist.b + bush, dk ? '#1C1830' : '#8A4A62');
  add(mid, 'e', ms.b, dk ? '#141C28' : '#4E5E40'); add(mid, 'f', ms.l + oc.l, dk ? '#1E2A36' : '#6E7A46'); add(mid, 'g', ms.r, dk ? '#6A70A8' : '#F2A060');
  add(mid, 'h', rk.b, dk ? '#261C34' : '#9A4838');
  stk(mid, 's', oc.s, dk ? '#2A2A3A' : '#5E5040', 1.7 * S + 0.6); stk(mid, 't', tuft + ms.s, dk ? 'rgba(80,80,120,0.6)' : 'rgba(80,60,40,0.42)', 1.1);
  // the foreground: the big saguaro, prickly pear, brittlebush, red boulders
  var hx = W * (ph ? 0.21 : 0.13), hy = gtop(hx) + 6, hh2 = H * (ph ? 0.5 : 0.7), hero = {b: '', l: '', r: '', s: '', p: ''};
  var htips = n16_saguaro(hx, hy, hh2, rnd, ph ? [[0.38, 1, 3.2, 0.28], [0.47, -1, 2.9, 0.26], [0.58, 1, 2.6, 0.2]] : [[0.37, 1, 3.4, 0.3], [0.46, -1, 3, 0.28], [0.57, 1, 2.7, 0.22]], hero, 2, Ldir(hx, hy));
  htips.forEach(function (t) { tips.push([t[0], t[1], t[2], 2]); });
  if (!ph) { var h2x = W * 0.93, h2 = n16_saguaro(h2x, gtop(h2x) + 8, H * 0.5, rnd, [[0.42, -1, 3.2, 0.26], [0.54, 1, 2.8, 0.2]], hero, 2, Ldir(h2x, gy)); h2.forEach(function (t) { tips.push([t[0], t[1], t[2], 2]); }); }
  var pear = {b: '', l: '', r: '', p: '', f: ''}; (ph ? [[0.6, 0.04]] : [[0.27, 0.05], [0.8, 0.046]]).forEach(function (q) { var px = W * q[0]; n16_pear(px, gtop(px) + H * 0.035, H * q[1], rnd, pear, Ldir(px, gy)); });
  var fr = {b: '', l: ''}; (ph ? [[0.3, 0.05], [0.04, 0.035], [0.95, 0.04]] : [[0.2, 0.05], [0.05, 0.035], [0.34, 0.03], [0.71, 0.04], [0.98, 0.05]]).forEach(function (q) { var rx2 = W * q[0]; n16_rock(rx2, gtop(rx2) + H * 0.03, H * q[1] * (ph ? 1.5 : 1.2), H * q[1] * 0.7, rnd, fr, 1); });
  // brittlebush: silvery domes with yellow daisies on long stems (the engine sways the flowers)
  var bb2 = {m: '', c: ''}, bbf = [];
  (ph ? [[0.42, 0.04], [0.9, 0.045]] : [[0.04, 0.05], [0.4, 0.055], [0.6, 0.045], [0.9, 0.05]]).forEach(function (q) { var cx = W * q[0], cy = gtop(cx) + H * 0.04, r = H * q[1];
    for (k = 0; k < 16; k++) { var a = Math.PI * (1.02 + k / 15 * 0.96), rr = r * (0.55 + rnd() * 0.4); bb2.m += n16_C(cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.8, r * (0.26 + rnd() * 0.12)); }
    bb2.m += n16_E(cx, cy - r * 0.2, r * 1.2, r * 0.55);
    for (k = 0; k < (ph ? 9 : 12); k++) { var a2 = Math.PI * (1.08 + rnd() * 0.84), fx = cx + Math.cos(a2) * r * 1.3, fy = cy - r * 0.35 + Math.sin(a2) * r * 0.75 - r * (0.15 + rnd() * 0.3); bbf.push({x0: cx + Math.cos(a2) * r * 0.5, y0: cy + Math.sin(a2) * r * 0.3, x: fx, y: fy, r: r * (0.13 + rnd() * 0.05), ph: rnd() * 6.28}); } });
  // white saguaro blossoms crowning the big cactus
  var bl = {w: '', y: ''}; var bloom = function (x2, y2, r) { for (var m = 0; m < 7; m++) { var a = m / 7 * Math.PI * 2; bl.w += n16_RE(x2 + Math.cos(a) * r * 0.55, y2 + Math.sin(a) * r * 0.35, r * 0.5, r * 0.28, a * 180 / Math.PI); } bl.y += n16_E(x2, y2, r * 0.3, r * 0.22); };
  htips.forEach(function (t, j) { bloom(t[0], t[1] + t[2] * 0.15, t[2] * 0.55); if (j === 0) { bloom(t[0] - t[2] * 0.7, t[1] + t[2] * 0.4, t[2] * 0.42); bloom(t[0] + t[2] * 0.7, t[1] + t[2] * 0.45, t[2] * 0.4); } });
  if (!ANIM) bbf.forEach(function (f) { bb2.c += 'M' + PT(f.x0, f.y0) + ' Q' + PT(f.x0, f.y) + ' ' + PT(f.x, f.y) + ' '; for (var m = 0; m < 9; m++) { var a = m / 9 * Math.PI * 2; bl.y += n16_RE(f.x + Math.cos(a) * f.r * 0.62, f.y + Math.sin(a) * f.r * 0.5, f.r * 0.5, f.r * 0.2, a * 180 / Math.PI); } pear.f += n16_C(f.x, f.y, f.r * 0.32); });
  // dry grass along the very bottom (drawn by the engine when animated)
  var gr = []; for (x = -10; x < W + 10; x += (ph ? 7 : 10)) gr.push({x: x + rnd() * 5, h: (ph ? 26 : 40) * S * (0.4 + rnd() * 0.8) * (ph ? 1.3 : 1), ph: rnd() * 6.28, lean: (rnd() - 0.5) * 0.5});
  var grs = ''; if (!ANIM) gr.forEach(function (g) { var b = g.lean * g.h; grs += 'M' + PT(g.x, H + 4) + ' q' + n1(b * 0.3) + ' ' + n1(-g.h * 0.6) + ' ' + n1(b) + ' ' + n1(-g.h) + ' '; });
  add(near, 'a', hero.b + pear.b, dk ? '#111A22' : '#3E553A'); add(near, 'b', hero.l + pear.l, dk ? '#1A2830' : '#62783E'); add(near, 'c', hero.r + pear.r + fr.l, dk ? '#7E84C0' : '#F4A866');
  add(near, 'd', fr.b, dk ? '#22182E' : '#8E3E30'); add(near, 'e', bb2.m, dk ? '#2E3446' : '#9EA88C');
  add(near, 'f', pear.f + oc.f, dk ? '#7A2E48' : '#C8304E'); add(near, 'g', bl.w, dk ? '#E4E2F6' : '#FFF8EC'); add(near, 'h', bl.y, dk ? '#B4A868' : '#F6C83A');
  stk(near, 's', hero.s + bb2.c, dk ? 'rgba(4,8,14,0.6)' : 'rgba(40,60,36,0.55)', ph ? 1.2 : 1.6); stk(near, 't', hero.p + pear.p + grs, dk ? 'rgba(150,150,190,0.5)' : 'rgba(250,206,150,0.75)', ph ? 1.4 : 1.8);
  if (ANIM) { ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.sun = [sx, sy, sr]; ANIM.moon = [mx, my, mr]; ANIM.tips = tips; ANIM.ocos = ocos; ANIM.bbf = bbf; ANIM.gr = gr; ANIM.gy = gy;
    ANIM.mask = n16_P(r1.concat([[W + 80, H + 80], [-80, H + 80]])); ANIM.peak = Math.min.apply(null, r1.map(function (p) { return p[1]; }));
    var tw = []; for (i = 0; i < 300 && tw.length < (ph ? 18 : 40); i++) { var tx = rnd() * W, ty = rnd() * hz * 0.75; if (Math.hypot(tx - mx, ty - my) > mr * 3) tw.push([tx, ty, rnd()]); } ANIM.tw = tw; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Baobab Dusk: a red dirt avenue lined with giant Madagascar baobabs at dusk, puddles mirroring the sky
function n16_limbPts(x0, y0, x1, y1, w0, w1, bend) { var L = [], R = [], n = 6; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); } return L.concat(R.reverse()); }
// one baobab (Grandidier's): a tall smooth column, slightly flared and bulging, topped with a flat crown of stubby branches and
// small leaf tufts. o.t trunk and branches, o.r the rim of light on the side facing the glow, o.l / o.m leaf tufts, o.k bark lines.
// Returns its polygons (to mirror into puddles) and the rim (for the moment's glow).
function n16_baobab(x, y, h, rnd, side, o) { var w = h * (0.09 + rnd() * 0.025), polys = [], i, k, top = y - h * 0.8, sd = side > 0 ? -1 : 1;
  var L = [], R = []; for (i = 0; i <= 16; i++) { var u = i / 16, ww = w * (1.12 - 0.22 * u + 0.08 * Math.sin(Math.PI * u * 1.2) + (u < 0.08 ? (0.08 - u) * 2.2 : 0) + (u > 0.9 ? (u - 0.9) * 1.6 : 0)), yy = y + 3 - (h * 0.8 + 3) * u, cx = x + Math.sin(u * 2.4 + x) * w * 0.06; L.push([cx - ww, yy]); R.push([cx + ww, yy]); }
  var trunk = L.concat(R.slice().reverse()); polys.push(trunk); o.t += n16_P(trunk);
  // the rim faces the avenue (towards the glow at the vanishing point)
  var E = sd < 0 ? L : R, rim = E.slice(1, 16), rimIn = rim.map(function (p, j) { return [p[0] - sd * w * (0.16 + 0.1 * Math.sin(j * 0.4)), p[1]]; }), rimP = rim.concat(rimIn.reverse()); o.r += n16_P(rimP);
  for (k = 0; k < 4; k++) { var bxk = x + (k / 3 - 0.5) * w * 1.3, pts = []; for (i = 0; i <= 8; i++) { var u2 = i / 8; pts.push([bxk + Math.sin(u2 * 4 + k) * w * 0.05, y - h * (0.04 + u2 * 0.7)]); } o.k += pline(pts); }
  // the crown: stubby limbs fanning up from the flat top, each forking once, with leaf tufts at the tips
  var nb = 6 + Math.floor(rnd() * 3), tipsL = [];
  for (k = 0; k < nb; k++) { var a = -Math.PI / 2 + ((k + 0.5) / nb - 0.5) * 2.5 + (rnd() - 0.5) * 0.2, ln = h * (0.11 + rnd() * 0.08) * (1 - Math.abs(Math.cos(a)) * 0.15), bx0 = x + Math.cos(a) * w * 0.6, by0 = top + w * 0.2, ex = bx0 + Math.cos(a) * ln, ey = by0 + Math.sin(a) * ln * 0.85, bw0 = w * (0.28 + rnd() * 0.08);
    var poly1 = n16_limbPts(bx0, by0 + bw0 * 0.6, ex, ey, bw0, bw0 * 0.35, (rnd() - 0.5) * ln * 0.15); polys.push(poly1); o.t += n16_P(poly1);
    for (i = 0; i < 2; i++) { var a2 = a + (i ? 0.45 : -0.45) + (rnd() - 0.5) * 0.2, l2 = ln * (0.45 + rnd() * 0.25), fx = ex + Math.cos(a2) * l2, fy = ey + Math.sin(a2) * l2 * 0.9, poly2 = n16_limbPts(ex, ey, fx, fy, bw0 * 0.35, bw0 * 0.14, 0); polys.push(poly2); o.t += n16_P(poly2); tipsL.push([fx, fy]); } }
  var cap = n16_REp(x, top + w * 0.1, w * 0.98, w * 0.35, 0, 16); polys.push(cap); o.t += n16_P(cap);
  tipsL.forEach(function (p) { var r = h * 0.03 * (0.7 + rnd() * 0.6); for (var m = 0; m < 5; m++) { var aa = m / 5 * Math.PI * 2 + rnd(), cx = p[0] + Math.cos(aa) * r * 0.9, cy = p[1] + Math.sin(aa) * r * 0.55 - r * 0.2, lp = n16_REp(cx, cy, r * 0.75, r * 0.5, 0, 10); o.l += n16_P(lp); if (m < 2) o.m += n16_E(cx - sd * r * 0.25, cy - r * 0.2, r * 0.4, r * 0.25); polys.push(lp); } });
  return {polys: polys, rim: rimP, x: x, y: y, h: h, w: w, top: top - h * 0.25}; }

SCENES.baobab = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.2), refl = Lay(0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, x, y;
  var hz = H * (ph ? 0.56 : 0.6), p1 = Math.round(hz / H * 100), F = H - hz, VX = W * (ph ? 0.5 : 0.56);
  var SK = dk ? [[0, '#02041A'], [0.35, '#0A1238'], [0.7, '#1E2456'], [0.9, '#3A2E62'], [1, '#4E3A66']] : [[0, '#6E66A8'], [0.3, '#A87AAE'], [0.58, '#EE94A2'], [0.8, '#FFB890'], [1, '#FFD8A2']];
  var sky = 'linear-gradient(180deg,' + SK.map(function (q) { return q[1] + ' ' + Math.round(q[0] * p1) + '%'; }).join(',') + ',' + (dk ? '#1A1626' : '#A85A44') + ' 100%)';
  // the sky colour at height yy (for the puddles' mirrored sky)
  var skyAt = function (yy) { var u = Math.max(0, Math.min(1, yy / hz)); for (var j = 1; j < SK.length; j++) if (u <= SK[j][0]) return mix(SK[j - 1][1], SK[j][1], (u - SK[j - 1][0]) / (SK[j][0] - SK[j - 1][0])); return SK[SK.length - 1][1]; };
  if (!dk) { add(far, 'a', n16_E(VX, hz, W * 0.6, H * 0.2), 'rgba(255,214,160,0.3)'); add(far, 'b', n16_E(VX, hz, W * 0.28, H * 0.07), 'rgba(255,240,200,0.45)');
    // long pink cloud streaks, lit apricot from below by the set sun
    var cb = '', ce = ''; (ph ? [[0.25, 0.12, 0.6], [0.7, 0.2, 0.7], [0.3, 0.3, 0.5], [0.8, 0.38, 0.4]] : [[0.18, 0.1, 0.36], [0.62, 0.07, 0.42], [0.4, 0.2, 0.4], [0.86, 0.22, 0.3], [0.12, 0.3, 0.28], [0.6, 0.34, 0.3], [0.95, 0.4, 0.18]]).forEach(function (q, j) {
      var cx = W * q[0], cy = H * q[1], len = W * q[2], th = (ph ? 8 : 12) * (0.7 + rnd() * 0.6), top = [], bot = [], n = 24;
      for (k = 0; k <= n; k++) { var u = k / n, e = Math.sin(Math.PI * u), xx = cx - len / 2 + len * u; top.push([xx, cy - th * e * (0.5 + 0.6 * Math.abs(Math.sin(u * 8 + j * 3)))]); bot.push([xx, cy + th * 0.3 * e]); }
      cb += n16_P(top.concat(bot.slice().reverse())); ce += n16_P(bot.map(function (p, m) { return [p[0], p[1] - th * 0.3 * Math.sin(Math.PI * m / n)]; }).concat(bot.slice().reverse().map(function (p) { return [p[0], p[1] + 0.6]; }))); });
    add(far, 'c', cb, 'rgba(214,120,160,0.75)'); add(far, 'd', ce, 'rgba(255,200,160,0.85)'); }
  else { // the Milky Way: a broad soft band rising from the end of the avenue, with a bright core, a dark dust lane and crowds of stars
    var ang = ph ? -82 : -73, ca2 = Math.cos(ang * Math.PI / 180), sa2 = Math.sin(ang * Math.PI / 180), mw = '', mwh = '', mwc = '', dust = '', st = '', LEN = Math.hypot(W, hz) * 1.1;
    var mwAt = function (u) { return [VX - W * 0.05 + ca2 * LEN * u, hz + sa2 * LEN * u]; };
    for (i = 0; i <= 50; i++) { var u = i / 50, p = mwAt(u), wv = Math.sin(u * 7) * 12 * S; mw += n16_RE(p[0] + wv, p[1], W * 0.14 * (0.8 + rnd() * 0.4) * (1 - u * 0.3) * (ph ? 1.6 : 1), H * (ph ? 0.07 : 0.12) * (0.8 + rnd() * 0.4), ang + (rnd() - 0.5) * 10); mwh += n16_RE(p[0] + wv, p[1], W * 0.12, H * (ph ? 0.14 : 0.24), ang); if (u < 0.75) mwc += n16_RE(p[0] + wv + (rnd() - 0.5) * 12, p[1], W * 0.06 * (1 - u * 0.5) * (ph ? 1.5 : 1), H * (ph ? 0.03 : 0.05), ang); if (u > 0.04 && u < 0.6) dust += n16_RE(p[0] + wv + Math.sin(u * 9) * 6, p[1], LEN * 0.03, H * (ph ? 0.008 : 0.013) * (0.6 + 0.5 * Math.sin(u * 17)), ang + Math.sin(u * 11) * 4); }
    add(far, 'a', n16_E(VX, hz, W * 0.62, H * 0.15) + n16_E(VX, hz, W * 0.45, H * 0.1) + n16_E(VX, hz, W * 0.28, H * 0.06), 'rgba(110,70,130,0.12)'); add(far, 'b', mw, 'rgba(150,150,255,0.1)'); add(far, 'c', mwc, 'rgba(255,220,214,0.15)'); add(far, 'd', dust, 'rgba(6,8,26,0.4)'); add(far, 'h', mwh, 'rgba(200,150,220,0.035)');
    spread(0, 0, W, hz, 20, 20, rnd, 1).forEach(function (c) { if (c.q < 0.5) st += n16_dot(c.x, c.y); });
    for (i = 0; i < (ph ? 380 : 900); i++) { var u3 = Math.pow(rnd(), 0.8) * 0.85, pp = mwAt(u3), dd = (rnd() + rnd() + rnd() - 1.5) * W * (ph ? 0.1 : 0.12) * (1 - u3 * 0.3); x = pp[0] - sa2 * dd; y = pp[1] + ca2 * dd; if (y < hz - 4 && y > 0) st += n16_dot(x, y); }
    stk(far, 't', st, 'rgba(255,248,240,0.92)', ph ? 1.5 : 1.8); }
  // the far horizon: a low line of bush, and a few distant baobabs out in the fields
  var hl = ridge(W, hz + 1, [[H * 0.004, 30, 0.3], [H * 0.003, 11, 1.4]], 6);
  add(far, 'e', n16_P(hl.map(function (p) { return [p[0], p[1] - H * 0.006 - Math.abs(Math.sin(p[0] / 23)) * H * 0.004]; }).concat(hl.slice().reverse().map(function (p) { return [p[0], p[1] + 6]; }))), dk ? '#1A1630' : '#8A5A70');
  var fb = {t: '', r: '', l: '', m: '', k: ''}; for (i = 0; i < (ph ? 6 : 12); i++) { var fx = rnd() * W; if (Math.abs(fx - VX) < W * 0.08) continue; n16_baobab(fx, hz + 2 + rnd() * H * 0.01, H * (0.025 + rnd() * 0.03), rnd, fx < VX ? -1 : 1, fb); }
  // the grassland, with flooded paddies catching the sky
  add(refl, 'a', below(n16_fn(-60, W + 60, 10, function (xx) { return hz + Math.sin(xx / 90) * 0.8; }), H + 40), dk ? '#1A2030' : '#8E7A5A');
  var gb = ''; for (i = 0; i < 6; i++) { var yb = hz + F * (0.02 + i * i * 0.012 + i * 0.01); gb += n16_P(n16_fn(-60, W + 60, 14, function (xx) { return yb + Math.sin(xx / (60 + i * 30) + i) * (1 + i) * S; }).concat(n16_fn(-60, W + 60, 14, function (xx) { return yb + (2 + i * 1.6) * S + Math.sin(xx / (60 + i * 30) + i) * (1 + i) * S; }).reverse())); }
  add(refl, 'b', gb, dk ? 'rgba(50,60,90,0.35)' : 'rgba(190,150,100,0.45)');
  add(refl, 'c', fb.t + fb.l, dk ? '#141228' : '#7A4A62');
  var pad = ''; [[0.08, 0.035, 0.12], [0.88, 0.05, 0.14], [0.25, 0.09, 0.1], [0.97, 0.12, 0.12]].forEach(function (q) { if (ph && q[0] === 0.25) return; var cx = W * q[0], cy = hz + F * q[1], rw = W * q[2] * (ph ? 1.6 : 1), rh = rw * (cy - hz) / F * 0.7 + 1.5; pad += n16_P(n16_blob(cx, cy, rw, rh, rnd, 18, 0.12)); });
  add(refl, 'e', pad, dk ? '#2E2E5A' : skyAt(hz * 0.55));
  // the avenue in perspective from the vanishing point; the road widens towards us
  var Z = function (z) { return hz + F / z; }, RW = ph ? 1.05 : 1.45, roadL = [], roadR = [];
  for (i = 0; i <= 30; i++) { var z = 0.85 * Math.pow(60 / 0.85, 1 - i / 30), yz = Z(z), jw = Math.sin(z * 1.7) * 0.05; roadL.push([VX - (RW + jw) * F / z, yz]); roadR.push([VX + (RW - jw * 0.6) * F / z, yz]); }
  var road = roadL.concat(roadR.slice().reverse());
  // grass verges along the road edges
  var verge = ''; [roadL, roadR].forEach(function (Ed, sdx) { for (i = 0; i < Ed.length - 1; i++) { var a = Ed[i], b = Ed[i + 1], d = (sdx ? 1 : -1) * Math.max(2, (b[1] - hz) * 0.12); verge += n16_P([a, b, [b[0] + d, b[1]], [a[0] + d * 1.3, a[1]]]); } });
  add(mid, 'a', verge, dk ? '#1E2232' : '#7A7048');
  add(mid, 'b', n16_P(road), dk ? '#2E2234' : '#B2604A');
  var rut = ''; [-0.55, -0.35, 0.35, 0.55].forEach(function (f) { var pts = []; for (i = 0; i <= 24; i++) { var z = 0.9 * Math.pow(50 / 0.9, 1 - i / 24); pts.push([VX + (f * RW + Math.sin(z) * 0.03) * F / z, Z(z), F / z]); } var Lp = pts.map(function (p) { return [p[0] - p[2] * 0.06, p[1]]; }), Rp = pts.map(function (p) { return [p[0] + p[2] * 0.06, p[1]]; }); rut += n16_P(Lp.concat(Rp.reverse())); });
  // stones in the road
  for (i = 0; i < (ph ? 40 : 80); i++) { var z2 = 0.9 + Math.pow(rnd(), 2) * 12, lx = (rnd() * 2 - 1) * RW * 0.9, sx2 = VX + lx * F / z2, sy2 = Z(z2), rr = F / z2 * 0.012 + 0.4; rut += n16_E(sx2, sy2, rr * 1.4, rr * 0.7); }
  add(mid, 'c', rut, dk ? 'rgba(10,6,20,0.35)' : 'rgba(110,40,30,0.3)');
  // the baobabs, in pairs down both sides of the road (far ones first)
  var trees = [], tr = {t: '', r: '', l: '', m: '', k: ''}, HT = ph ? 5.6 : 7.6;
  for (k = 9; k >= 0; k--) { [-1, 1].forEach(function (sd) { if (k > 1 && rnd() < 0.12) return; var z = 5.6 * Math.pow(1.42, k) * (1 + (rnd() - 0.5) * 0.12) * (sd > 0 ? 1.1 : 1), X = sd * (RW + 0.9 + rnd() * 0.6), hh = HT * (0.85 + rnd() * 0.25) * F / z, t = n16_baobab(VX + X * F / z, Z(z) + 2, hh, rnd, sd, tr); t.z = z; trees.push(t); }); }
  // two great trees out in the grass near the edges of the picture
  (ph ? [] : [[-1, 3.9, 6.6], [1, 4.3, 7.4]]).forEach(function (q) { var z = q[1], t = n16_baobab(VX + q[0] * 6.1 * F / z * (W > 1100 ? 1 : 0.9), Z(z) + 2, q[2] * F / z * 0.82, rnd, q[0], tr); t.z = z; trees.push(t); });
  // puddles on the road: flat and convex, mirroring the sky and the trees
  var pds = [], PQ = ph ? [[0.05, 1.35, 0.46], [-0.45, 2.3, 0.35], [0.5, 3.4, 0.3], [-0.2, 5.2, 0.32]] : [[0.08, 1.32, 0.44], [0.62, 1.95, 0.28], [-0.55, 2.6, 0.36], [0.3, 3.8, 0.32], [-0.25, 5.6, 0.3]];
  PQ.forEach(function (q) { var z = q[1], cx = VX + q[0] * RW * F / z, cy = Z(z), rx = q[2] * RW * F / z, ry = rx * 0.42 / z, ph1 = rnd() * 6.28, ph2 = rnd() * 6.28, pts = []; for (k = 0; k < 44; k++) { var tt = k / 44 * Math.PI * 2, rr = 1 + 0.07 * Math.sin(2 * tt + ph1) + 0.035 * Math.sin(3 * tt + ph2); pts.push([cx + Math.cos(tt) * rx * rr, cy + Math.sin(tt) * ry * rr]); } pts = n16_hull(pts); pds.push({pts: pts, cx: cx, cy: cy, rx: rx, ry: ry}); });
  var bandY = [[0, hz * 0.62], [hz * 0.62, hz * 0.32], [hz * 0.32, -H]], bands = ['', '', ''], refls = '', shine = '';
  pds.forEach(function (pd) { bands[0] += n16_P(pd.pts);
    [1, 2].forEach(function (j) { var y0 = 2 * hz - bandY[j][0], y1 = 2 * hz - bandY[j][1], cl = n16_clip([[-100, y0], [W + 100, y0], [W + 100, y1], [-100, y1]], pd.pts); if (cl.length > 2) bands[j] += n16_P(cl); });
    trees.forEach(function (t) { if (t.y > pd.cy) return; t.polys.forEach(function (pp) { var m = pp.map(function (p) { return [p[0], 2 * t.y - p[1]]; }), cl = n16_clip(m, pd.pts); if (cl.length > 2) refls += n16_P(cl); }); });
    var top = pd.pts.filter(function (p) { return p[1] < pd.cy; }).sort(function (a, b) { return a[0] - b[0]; }); if (top.length > 2) shine += n16_P(top.map(function (p) { return [p[0], p[1] + 0.4]; }).concat(top.slice().reverse().map(function (p) { return [p[0], p[1] + Math.min(2.4, Math.max(0.9, pd.ry * 0.05))]; }))); });
  if (dk) { var rs = ''; pds.forEach(function (pd) { for (k = 0; k < Math.round(pd.rx * pd.ry / 60) + 3; k++) { var qx = pd.cx + (rnd() * 2 - 1) * pd.rx * 0.85, qy = pd.cy + (rnd() * 2 - 1) * pd.ry * 0.7; if (n16_clip([[qx - 0.5, qy - 0.5], [qx + 0.5, qy - 0.5], [qx + 0.5, qy + 0.5], [qx - 0.5, qy + 0.5]], pd.pts).length > 2) rs += n16_C(qx, qy, 0.5 + rnd() * 0.7); } }); add(near, 'g', rs, 'rgba(230,236,255,0.7)'); }
  add(mid, 'd', bands[0], skyAt(hz * 0.76)); add(mid, 'e', bands[1], skyAt(hz * 0.52)); add(mid, 'f', bands[2], skyAt(hz * 0.34));
  add(mid, 'g', refls, dk ? 'rgba(4,4,14,0.8)' : 'rgba(90,50,74,0.62)'); add(mid, 'h', shine, dk ? 'rgba(120,120,200,0.45)' : 'rgba(255,236,210,0.7)');
  // grass clumps along the near verges and in the corners (the engine sways the tall blades)
  var gc = {d: '', l: ''}; (ph ? [[0.0, 1.0, 1.1], [1.0, 1.0, 1.1], [0.12, 0.9, 0.6], [0.9, 0.86, 0.6]] : [[0.0, 1.0, 1.3], [0.12, 0.93, 0.7], [0.97, 1.0, 1.3], [0.86, 0.92, 0.7], [0.3, 0.82, 0.4], [0.76, 0.8, 0.4]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], s2 = q[2] * S * (ph ? 1.4 : 1);
    for (k = 0; k < 18; k++) { var a = Math.PI * (1.05 + rnd() * 0.9), rr = (20 + rnd() * 40) * s2; gc.d += n16_leaf(cx + Math.cos(a) * rr, cy + 6, (26 + rnd() * 30) * s2, 2.6 * s2 + 0.6, -90 + (rnd() - 0.5) * 50, (rnd() - 0.5) * 0.4); if (rnd() < 0.5) gc.l += n16_leaf(cx + Math.cos(a) * rr * 0.8, cy + 6, (18 + rnd() * 22) * s2, 2 * s2 + 0.5, -90 + (rnd() - 0.5) * 40, 0.2); } });
  var gt = ''; spread(0, hz + F * 0.08, W, F * 0.9, ph ? 34 : 50, ph ? 28 : 36, rnd, 1).forEach(function (c) { var hw = RW * (c.y - hz) * 1.2; if ((c.x > VX - hw && c.x < VX + hw) || c.q > 0.55) return; var v2 = (c.y - hz) / F, gh = (3 + v2 * 16) * S * (ph ? 1.3 : 1); for (k = -2; k <= 2; k++) gt += 'M' + PT(c.x + k * gh * 0.12, c.y) + ' q' + n1(k * gh * 0.1) + ' ' + n1(-gh * 0.6) + ' ' + n1(k * gh * 0.3) + ' ' + n1(-gh * (1 - Math.abs(k) * 0.15)) + ' '; });
  var gr = []; for (x = -10; x < W + 10; x += (ph ? 6 : 9)) { var rx2 = Math.abs(x - VX) / (W * 0.5); if (rx2 < (ph ? 0.75 : 0.62) && rnd() < 0.75) continue; gr.push({x: x + rnd() * 4, h: (ph ? 34 : 50) * S * (0.4 + rnd() * 0.8) * (ph ? 1.3 : 1) * Math.min(1, rx2 * 1.3 + 0.2), ph: rnd() * 6.28, lean: (rnd() - 0.5) * 0.5, c: rnd() < 0.5}); }
  var grs = ''; if (!ANIM) gr.forEach(function (g) { var b = g.lean * g.h; grs += 'M' + PT(g.x, H + 4) + ' q' + n1(b * 0.3) + ' ' + n1(-g.h * 0.6) + ' ' + n1(b) + ' ' + n1(-g.h) + ' '; });
  add(near, 'a', tr.t, dk ? '#0E0C1C' : '#6E4450'); add(near, 'b', tr.r, dk ? '#3A3A6A' : '#F2A884'); add(near, 'c', tr.l, dk ? '#0C1418' : '#55583A'); add(near, 'd', tr.m, dk ? '#1A2830' : '#8A8448');
  add(near, 'e', gc.d, dk ? '#141C24' : '#6E6A3A'); add(near, 'f', gc.l, dk ? '#22303A' : '#A89A5A');
  stk(near, 's', tr.k, dk ? 'rgba(0,0,0,0.3)' : 'rgba(80,40,50,0.28)', ph ? 1 : 1.4); stk(mid, 't', gt, dk ? 'rgba(80,90,120,0.55)' : 'rgba(110,90,50,0.5)', 1.1); stk(near, 't', grs, dk ? '#2E3A48' : '#B8A262', ph ? 1.6 : 2);
  if (ANIM) { ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.VX = VX; ANIM.F = F; ANIM.RW = RW; ANIM.gr = gr; ANIM.SK = SK;
    ANIM.pds = pds.map(function (pd) { return {d: n16_P(pd.pts), cx: pd.cx, cy: pd.cy, rx: pd.rx, ry: pd.ry}; }); ANIM.refl = refls;
    ANIM.trees = trees.map(function (t) { return {rim: n16_P(t.rim), x: t.x, y: t.y, h: t.h, z: t.z, top: t.top}; });
    var tw = []; for (i = 0; i < 300 && tw.length < (ph ? 22 : 46); i++) { var tx = rnd() * W, ty = rnd() * hz * 0.85, ok = true; trees.forEach(function (t) { if (tx > t.x - t.h * 0.3 && tx < t.x + t.h * 0.3 && ty > t.top) ok = false; }); if (ok) tw.push([tx, ty, rnd()]); } ANIM.tw = tw; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
