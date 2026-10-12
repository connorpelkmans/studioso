// ---- batch n16: saguaro (Saguaro Sunset)
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
