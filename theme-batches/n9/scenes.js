// ---- batch n9: bayou (Firefly Bayou), karst (Karst River)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n9_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n9_P(pts) { return pts.length > 2 ? poly(n9_cw(pts)) : ''; }
function n9_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n9_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n9_REp(x, y, rx, ry, ang, n) { var p = [], m = n || 20; for (var i = 0; i < m; i++) { var t = i / m * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return rotp(p, x, y, ang); }
function n9_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n9_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// mirror points about the water line y0 (k < 1 squashes the reflection a little)
function n9_mir(pts, y0, k) { return pts.map(function (p) { return [p[0], y0 + (y0 - p[1]) * (k || 1)]; }); }
// open Catmull-Rom through a list of points (end points kept)
function n9_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
// a tapered band along a polyline (width w0 at the start, w1 at the end), as one outline
function n9_tube(pts, w0, w1) { var L = [], R = [], n = pts.length; pts.forEach(function (p, j) { var q = pts[Math.min(n - 1, j + 1)], o = pts[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * j / (n - 1)) / 2; L.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); R.push([p[0] + dy / dl * w, p[1] - dx / dl * w]); }); return L.concat(R.reverse()); }
// a narrow pointed leaf as points: base at (x,y), pointing along ang (degrees)
function n9_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 10; i++) { var t = i / 10, ww = w * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.3 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
// a stroke "dot" (a zero-length round-capped segment), so dots of one size can share a stroke slot
function n9_dot(x, y) { return 'M' + PT(x, y) + ' l0.01 0 '; }

// =============== 1. Firefly Bayou: a still, dark-green bayou with bald cypress, knees, Spanish moss, water lilies and duckweed
// a hanging clump of Spanish moss from (ax, ay): a few zigzag strands of different lengths
function n9_mossPts(ax, ay, len, wid, rnd, sway) { var out = [], ns = 5 + Math.floor(rnd() * 3);
  out.push(n9_REp(ax, ay + wid * 0.12, wid * 0.42, wid * 0.16, 0, 12));
  for (var s = 0; s < ns; s++) { var f = ns > 1 ? s / (ns - 1) - 0.5 : 0, x0 = ax + f * wid * 0.75, L = len * (0.35 + rnd() * 0.65) * (1 - Math.abs(f) * 0.6), ww = wid * (0.1 + rnd() * 0.08), lft = [], rgt = [], sw = (sway || 0) * L + f * wid * 0.25, ph = rnd() * 6;
    for (var j = 0; j <= 9; j++) { var t = j / 9, xc = x0 + sw * t * t + Math.sin(t * 4 + ph) * ww * 0.6, hw = ww * (1 - t * 0.85) * 0.5 + 0.25, zz = (j % 2 ? 1 : -1) * ww * 0.35 * (1 - t * 0.6); lft.push([xc - hw + zz, ay + t * L]); rgt.unshift([xc + hw + zz * 0.5, ay + t * L]); }
    out.push(lft.concat(rgt)); }
  return out; }
// a bald cypress standing in water: flared, fluted trunk, a few long limbs with flat feathery pads, moss and knees.
// o collects outlines by part; light: +1 when the light comes from the right
function n9_cypress(o, x, yb, h, rnd, opt) { opt = opt || {}; var lean = opt.lean || 0, light = opt.light || 1, mk = opt.moss == null ? 1 : opt.moss, yw = opt.yw || yb, rk = opt.rk || 0.86, i, j;
  var wAt = function (u) { return h * (0.016 + 0.026 * (1 - u) + 0.07 * Math.exp(-u * 11)); }, cxAt = function (u) { return x + lean * h * u * u + Math.sin(u * 7 + x) * h * 0.004; }, yAt = function (u) { return yb - u * h * 0.9; };
  var L = [], R = [], C = []; for (i = 0; i <= 18; i++) { var u = i / 18, w = wAt(u); L.push([cxAt(u) - w, yAt(u)]); R.unshift([cxAt(u) + w, yAt(u)]); C.push([cxAt(u), yAt(u)]); }
  var trunk = L.concat(R), parts = [trunk];
  // buttress flutes at the foot
  [-1, -0.45, 0.5, 1].forEach(function (s) { var w0 = wAt(0), bx = x + s * w0 * 1.05; parts.push([[x + s * w0 * 0.2, yb - h * 0.09], [bx + s * w0 * 0.28, yb + h * 0.004], [bx - s * w0 * 0.25, yb + h * 0.006]]); });
  // limbs, sweeping out and up, then drooping at the ends
  var nl = opt.limbs || 5, limbs = [], pads = [];
  for (i = 0; i < nl; i++) { var u1 = 0.46 + i * (0.46 / (nl - 1)) + (rnd() - 0.5) * 0.05, sd = (i % 2 ? 1 : -1) * (opt.flip ? -1 : 1), len = h * (0.2 + rnd() * 0.13) * (1 - u1 * 0.4), sx = cxAt(u1), sy = yAt(u1);
    var lp = n9_curve([[sx, sy], [sx + sd * len * 0.4, sy - len * 0.32], [sx + sd * len * 0.78, sy - len * 0.36], [sx + sd * len, sy - len * 0.24]], 5);
    limbs.push(lp); parts.push(n9_tube(lp, wAt(u1) * 0.9, Math.max(1, h * 0.006)));
    [0.42, 0.72, 1].forEach(function (t) { var p = lp[Math.min(lp.length - 1, Math.round(t * (lp.length - 1)))]; pads.push([p[0], p[1] - h * 0.012, h * (0.075 + rnd() * 0.04) * (1.1 - t * 0.25)]); }); }
  // the flat crown on top
  var tx = cxAt(1), ty = yAt(1); pads.push([tx, ty - h * 0.01, h * 0.1]); pads.push([tx - h * 0.09, ty + h * 0.03, h * 0.08]); pads.push([tx + h * 0.08, ty + h * 0.04, h * 0.085]);
  var crown = [], crH = [], fringe = [];
  pads.forEach(function (p) { var rx = p[2], ry = rx * 0.34;
    for (var k = -1; k <= 1; k++) { var ex = p[0] + k * rx * 0.55, ey = p[1] + Math.abs(k) * ry * 0.35, er = rx * (k ? 0.62 : 0.8); crown.push([ex, ey, er, ry * (k ? 0.85 : 1)]); crH.push([ex - light * er * 0.12, ey - ry * 0.32, er * 0.72, ry * 0.5]);
      for (var f = 0; f < 4; f++) { var fx = ex - er * 0.75 + f * er * 0.5, fy = ey + ry * 0.55; fringe.push([[fx - er * 0.09, fy - ry * 0.2], [fx + er * 0.06, fy + ry * (1.1 + 0.6 * ((f + k + 3) % 2))], [fx + er * 0.12, fy - ry * 0.2]]); } } });
  var add2 = function (key, s) { o[key] = (o[key] || '') + s; };
  parts.forEach(function (p) { add2('tr', n9_P(p)); });
  // shade on the side away from the light
  var sh = []; for (i = 0; i <= 18; i++) { var u2 = i / 18; sh.push([cxAt(u2) - light * wAt(u2) * 0.95, yAt(u2)]); } for (i = 18; i >= 0; i--) { var u3 = i / 18; sh.push([cxAt(u3) - light * wAt(u3) * 0.1, yAt(u3)]); } add2('trS', n9_P(sh));
  var bark = ''; for (j = -2; j <= 2; j++) { var bp = []; for (i = 0; i <= 8; i++) { var u4 = i / 8 * 0.5; bp.push([cxAt(u4) + j * wAt(u4) * 0.32, yAt(u4)]); } bark += pline(bp); } add2('bark', bark);
  crown.forEach(function (e) { add2('cr', n9_E(e[0], e[1], e[2], e[3])); }); fringe.forEach(function (f) { add2('cr', n9_P(f)); });
  crH.forEach(function (e) { add2('crH', n9_E(e[0], e[1], e[2], e[3])); });
  // Spanish moss hanging from the limbs
  var moss = [];
  if (mk > 0) limbs.forEach(function (lp) { [0.35, 0.6, 0.85].forEach(function (t, ti) { if (rnd() > 0.85) return; var p = lp[Math.round(t * (lp.length - 1))], len = h * (0.08 + rnd() * 0.12) * mk * (ti === 1 ? 1.2 : 1); n9_mossPts(p[0], p[1] + h * 0.004, len, len * 0.32, rnd, 0).forEach(function (m) { moss.push(m); }); }); });
  moss.forEach(function (m, k) { add2(k % 3 === 2 ? 'mossH' : 'moss', n9_P(m)); });
  // knees poking out of the water around the foot
  var knees = []; for (i = 0; i < (opt.knees || 0); i++) { var sdk = i % 2 ? 1 : -1, kx = x + sdk * (wAt(0) * 1.4 + rnd() * h * 0.07 + i * h * 0.014), ky = yb + h * (0.004 + rnd() * 0.03), kh = h * (0.03 + rnd() * 0.035), kw = kh * (0.32 + rnd() * 0.12), kp = [];
    for (j = 0; j <= 10; j++) { var a = Math.PI * j / 10; kp.push([kx - Math.cos(a) * kw * (1 - 0.35 * Math.sin(a)), ky - Math.pow(Math.sin(a), 0.7) * kh]); } kp.push([kx + kw * 1.05, ky + 1]); kp.push([kx - kw * 1.05, ky + 1]); knees.push({p: kp, x: kx, y: ky, w: kw, h: kh}); add2('tr', n9_P(kp)); }
  // the reflection: everything mirrored about the water line, as one silhouette
  if (opt.refl !== false) { var rf = ''; parts.forEach(function (p) { rf += n9_P(n9_mir(p, yw, rk)); }); crown.forEach(function (e) { rf += n9_E(e[0], yw + (yw - e[1]) * rk, e[2], e[3] * rk); }); moss.forEach(function (m) { rf += n9_P(n9_mir(m, yw, rk)); }); knees.forEach(function (k) { rf += n9_P(n9_mir(k.p, k.y, 0.9)); }); add2('rf', rf); }
  return {knees: knees, foot: [x, yb, wAt(0)], top: [tx, ty], limbs: limbs}; }
// a fan palmetto: a short stem and a round fan of folded leaflets
function n9_palmetto(o, x, y, r, ang, key, keyD) { var pts = [], k = 13, i; for (i = 0; i <= k; i++) { var a = (ang - 75 + i * 150 / k) * Math.PI / 180, rr = r * (0.82 + 0.18 * Math.sin(i * 2.1)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); if (i < k) { var a2 = (ang - 75 + (i + 0.5) * 150 / k) * Math.PI / 180; pts.push([x + Math.cos(a2) * r * 0.55, y + Math.sin(a2) * r * 0.55]); } }
  pts.push([x, y]); o[key] += n9_P(pts); var ribs = ''; for (i = 0; i <= k; i++) { var a3 = (ang - 75 + i * 150 / k) * Math.PI / 180; ribs += seg(x, y, x + Math.cos(a3) * r * 0.8, y + Math.sin(a3) * r * 0.8); } o[keyD] += ribs; }
// a lily pad: an ellipse with a notch cut in, as points
function n9_padPts(x, y, rx, ry, notch) { var p = [[x, y]], a0 = notch + 0.22, a1 = notch + Math.PI * 2 - 0.22; for (var i = 0; i <= 22; i++) { var a = a0 + (a1 - a0) * i / 22; p.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return p; }
// a water lily flower: two rings of pointed petals seen from a low angle
function n9_lily(x, y, s) { var d = ''; for (var ring = 0; ring < 2; ring++) for (var i = 0; i < 7; i++) { var a = -90 + (i - 3) * (ring ? 24 : 30), L = s * (ring ? 0.85 : 1.1); d += n9_P(n9_leafPts(x, y - s * 0.1 * ring, L, s * 0.2, a + (ring ? 0 : (i - 3) * 2), 0).map(function (p) { return [p[0], y + (p[1] - y) * (ring ? 0.85 : 0.62)]; })); } return d; }

SCENES.bayou = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.2), refl = Lay(0.9), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x;
  var hy = H * (ph ? 0.5 : 0.56);
  var sky = dk ? 'linear-gradient(180deg,#07141A 0%,#0B2026 34%,#123230 62%,#1C4038 100%)' : 'linear-gradient(180deg,#A9C9B6 0%,#CBDDBC 30%,#EADFAE 58%,#F6CC8C 100%)';
  var band = {top: hy, bg: dk ? 'linear-gradient(180deg,#14302C 0%,#0A1C1C 18%,#061214 55%,#040B0C 100%)' : 'linear-gradient(180deg,#E8CF96 0%,#B9B884 16%,#7D9168 46%,#4E6A4C 100%)'};
  // the sun low in the haze, or a big moon
  var mx = W * (ph ? 0.64 : 0.62), my = dk ? H * (ph ? 0.15 : 0.18) : hy - H * (ph ? 0.1 : 0.14), mr = dk ? (ph ? 38 : 58) : (ph ? 26 : 40);
  if (dk) { add(far, 'a', n9_C(mx, my, mr * 4.2), 'rgba(170,220,200,0.07)'); add(far, 'b', n9_C(mx, my, mr * 1.9), 'rgba(210,240,225,0.12)'); add(far, 'd', n9_C(mx, my, mr), '#F2F0D8');
    var st = ''; spread(0, 0, W, hy * 0.85, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.42 && Math.hypot(c.x - mx, c.y - my) > mr * 2.4) st += n9_C(c.x, c.y, 0.4 + c.r * 0.9); }); add(far, 'c', st, 'rgba(240,250,236,0.7)');
    add(refl, 'h', n9_C(mx - mr * 0.3, my - mr * 0.15, mr * 0.2) + n9_C(mx + mr * 0.25, my + mr * 0.3, mr * 0.14) + n9_C(mx + mr * 0.35, my - mr * 0.35, mr * 0.09) + n9_C(mx - mr * 0.1, my + mr * 0.45, mr * 0.07), 'rgba(196,196,170,0.4)'); }
  else { add(far, 'a', n9_C(mx, my, mr * 6), 'rgba(255,232,180,0.22)'); add(far, 'b', n9_C(mx, my, mr * 2.6), 'rgba(255,240,200,0.4)'); add(far, 'd', n9_C(mx, my, mr), '#FFF6DC');
    var hz = ''; for (i = 0; i < (ph ? 5 : 7); i++) { var hx = W * (i + 0.5) / (ph ? 5 : 7) + (rnd() - 0.5) * 80, hyy = H * (0.12 + rnd() * 0.24) + (i % 2) * 30; hz += n9_E(hx, hyy, (ph ? 90 : 190) * (0.7 + rnd() * 0.6), 6 + rnd() * 5); } add(far, 'c', hz, 'rgba(255,248,228,0.5)'); }
  // the far treeline in the haze: a ragged row of cypress tops and taller lone cypress
  var row1 = n9_fn(-60, W + 60, 6, function (xx) { return hy - H * 0.035 - Math.abs(Math.sin(xx / 23 + 1)) * H * 0.018 - Math.max(0, Math.sin(xx / 61)) * H * 0.03 - Math.sin(xx / 9) * 1.5; });
  var r1 = below(row1.map(function (p) { return [p[0], p[1] + H * 0.012]; }), hy + 2), tall = '';
  for (x = -40; x < W + 40; x += (ph ? 7 : 9) + rnd() * 6) { var cy0 = n9_yOn(row1, x), cr = H * (0.008 + rnd() * 0.012); r1 += n9_E(x, cy0 + cr * 0.6, cr * (1.2 + rnd()), cr); }
  for (x = 20; x < W; x += (ph ? 90 : 120) + rnd() * 60) { var th = H * (0.07 + rnd() * 0.06), tw = th * 0.07; tall += n9_P([[x - tw, hy], [x - tw * 0.4, hy - th], [x + tw * 0.4, hy - th], [x + tw, hy]]); for (var q = 0; q < 3; q++) tall += n9_E(x + (q - 1) * th * 0.16, hy - th + q * th * 0.12 - (q === 1 ? th * 0.06 : 0), th * 0.16, th * 0.06); }
  add(far, 'e', r1 + tall, dk ? '#122A2A' : '#B6BE98');
  add(far, 'f', n9_P(n9_mir(row1.concat([[W + 60, hy], [-60, hy]]), hy, 0.7)), dk ? 'rgba(20,46,44,0.75)' : 'rgba(170,176,140,0.8)');
  // the sun's (or moon's) glow on the water, and a low mist band on the horizon
  add(far, 'g', n9_E(mx, hy + H * 0.08, mr * (dk ? 1.3 : 2.4), H * 0.09) + n9_E(mx, hy + H * 0.2, mr * (dk ? 0.9 : 1.6), H * 0.12), dk ? 'rgba(220,235,210,0.1)' : 'rgba(255,236,180,0.45)');
  add(far, 'h', n9_E(W * 0.3, hy, W * 0.4, H * 0.016) + n9_E(W * 0.75, hy + 4, W * 0.35, H * 0.014), dk ? 'rgba(150,200,185,0.12)' : 'rgba(255,244,214,0.55)');
  // a nearer treeline row, darker, with its reflection
  var row2 = n9_fn(-60, W + 60, 5, function (xx) { return hy - H * 0.012 - Math.abs(Math.sin(xx / 31)) * H * 0.02 - Math.max(0, Math.sin(xx / 83 + 2)) * H * 0.028; });
  var r2pts = row2.map(function (p) { return [p[0], p[1] + H * 0.01]; }).concat([[W + 60, hy + 3], [-60, hy + 3]]), r2 = n9_P(r2pts), r2m = n9_P(n9_mir(r2pts, hy + 3, 0.75));
  for (x = -40; x < W + 40; x += (ph ? 8 : 11) + rnd() * 8) { var cy2 = n9_yOn(row2, x), cr2 = H * (0.008 + rnd() * 0.014), ew = cr2 * (1.1 + rnd() * 0.9), ey = cy2 + cr2 * 0.7; r2 += n9_E(x, ey, ew, cr2); r2m += n9_E(x, hy + 3 + (hy + 3 - ey) * 0.75, ew, cr2 * 0.75); }
  add(refl, 'a', r2, dk ? '#0C2020' : '#93A27A'); add(refl, 'b', r2m, dk ? 'rgba(10,30,30,0.85)' : 'rgba(120,134,96,0.6)');
  // distant cypress standing out in the water
  var DT = {}, distant = ph ? [[0.08, 0.2], [0.34, 0.17], [0.86, 0.19]] : [[0.05, 0.22], [0.18, 0.18], [0.42, 0.16], [0.55, 0.2], [0.7, 0.15], [0.93, 0.21]];
  distant.forEach(function (q, j) { var yb = hy + H * (0.012 + (j % 3) * 0.006); n9_cypress(DT, W * q[0], yb, H * q[1] * (ph ? 1.1 : 1), rnd, {light: W * q[0] < mx ? 1 : -1, limbs: 4, moss: 0.8, knees: 1, lean: (rnd() - 0.5) * 0.06}); });
  add(refl, 'c', DT.tr, dk ? '#0E2222' : '#7E8C68'); add(refl, 'd', DT.cr, dk ? '#11292A' : '#869A6A'); add(refl, 'e', (DT.moss || '') + (DT.mossH || ''), dk ? '#30443F' : '#B2B494');
  add(refl, 'f', DT.rf, dk ? 'rgba(4,14,15,0.55)' : 'rgba(90,104,70,0.38)');
  add(refl, 'g', n9_E(W * 0.5, hy + H * 0.05, W * 0.62, H * 0.022) + n9_E(W * 0.2, hy + H * 0.075, W * 0.3, H * 0.012), dk ? 'rgba(140,190,175,0.08)' : 'rgba(255,240,206,0.32)');
  // the middle cypress, larger, with knees, moss and crisp reflections
  var MT = {}, mids = ph ? [[0.2, 0.14, 0.34, -1], [0.84, 0.17, 0.4, 1]] : [[0.27, 0.11, 0.5, 1], [0.79, 0.135, 0.54, -1], [0.95, 0.08, 0.32, 1]], feet = [], knees = [];
  mids.forEach(function (q, j) { var yb = hy + H * q[1], r = n9_cypress(MT, W * q[0], yb, H * q[2], rnd, {light: W * q[0] < mx ? 1 : -1, limbs: 6, moss: 1.15, knees: ph ? 3 : 5, lean: q[3] * 0.04, flip: j % 2 === 1}); feet.push(r.foot); knees = knees.concat(r.knees); });
  add(mid, 'a', MT.rf, dk ? 'rgba(2,8,9,0.6)' : 'rgba(46,62,38,0.42)');
  add(mid, 'c', MT.tr, dk ? '#101C1C' : '#5E5A44'); add(mid, 'd', MT.trS, dk ? '#0A1414' : '#47442F');
  add(mid, 'e', MT.cr, dk ? '#0F2622' : '#4A6634'); add(mid, 'f', MT.crH, dk ? '#1D3C34' : '#6E8A44');
  add(mid, 'g', MT.moss, dk ? '#3E524C' : '#A7AA88'); add(mid, 'h', MT.mossH, dk ? '#4E645C' : '#C4C29E');
  stk(mid, 's', MT.bark, dk ? 'rgba(40,64,60,0.5)' : 'rgba(60,52,36,0.35)', ph ? 0.8 : 1.2);
  // ripple rings where trunks and knees meet the water, and duckweed gathered around them
  var rings = '', dw = '';
  feet.forEach(function (f) { rings += n9_E(f[0], f[1] + 2, f[2] * 1.7, f[2] * 0.22); for (var k = 0; k < (ph ? 30 : 60); k++) { var a = rnd() * Math.PI * 2, rr = f[2] * (1.2 + rnd() * 3.2); dw += n9_C(f[0] + Math.cos(a) * rr * 1.4, f[1] + 3 + Math.abs(Math.sin(a)) * rr * 0.24, (ph ? 0.9 : 1.3) * (0.6 + rnd() * 0.6)); } });
  knees.forEach(function (k) { rings += n9_E(k.x, k.y + 1, k.w * 2.2, k.w * 0.35); });
  stk(mid, 't', rings, dk ? 'rgba(160,210,200,0.22)' : 'rgba(255,246,220,0.5)', ph ? 0.8 : 1.2);
  // the big foreground cypress on the left, its limbs reaching across the top, and a branch from the right
  var NT = {tr: '', trS: '', bark: ''}, bx0 = W * (ph ? -0.04 : 0.035), bh = H * 1.25, nmoss = [];
  var bw = function (u) { return bh * (0.03 + 0.02 * (1 - u) + 0.06 * Math.exp(-u * 9)); };
  var NL = [], NR = []; for (i = 0; i <= 16; i++) { var u = i / 16, yy = H + 6 - u * bh * 0.9, cx = bx0 + u * u * bh * 0.04; NL.push([cx - bw(u), yy]); NR.unshift([cx + bw(u), yy]); }
  NT.tr += n9_P(NL.concat(NR)); [-1, -0.4, 0.6, 1].forEach(function (s) { var w0 = bw(0); NT.tr += n9_P([[bx0 + s * w0 * 0.2, H - bh * 0.1], [bx0 + s * w0 * 1.35, H + 8], [bx0 + s * w0 * 0.75, H + 8]]); });
  var shN = []; NL.forEach(function (p, j) { shN.push([p[0] * 0.25 + NR[16 - j][0] * 0.75, p[1]]); }); NR.forEach(function (p) { shN.push(p); }); NT.trS += n9_P(shN);
  for (var bj = -2; bj <= 2; bj++) { var bp = []; for (i = 0; i <= 10; i++) { var uu = i / 10 * 0.75; bp.push([bx0 + uu * uu * bh * 0.04 + bj * bw(uu) * 0.3 + Math.sin(i * 1.3 + bj) * 2, H + 6 - uu * bh * 0.9]); } NT.trS += n9_P(n9_tube(bp, ph ? 1.4 : 2.2, ph ? 0.8 : 1.2)); }
  var FG = {leaf: ''};
  var limbsN = ph ? [[0.5, W * 0.62, 0.2], [0.62, W * 0.95, 0.08]] : [[0.52, W * 0.34, 0.16], [0.6, W * 0.5, 0.05], [0.66, W * 0.16, 0.02]];
  limbsN.forEach(function (q) { var u0 = q[0], sx = bx0 + u0 * u0 * bh * 0.04, sy = H + 6 - u0 * bh * 0.9, ex = q[1], ey = H * q[2], lp = n9_curve([[sx, sy], [sx + (ex - sx) * 0.35, sy - (sy - ey) * 0.7], [sx + (ex - sx) * 0.7, ey - H * 0.02], [ex, ey + H * 0.01]], 6);
    NT.tr += n9_P(n9_tube(lp, bw(u0) * 1.1, ph ? 4 : 6)); var te = lp[lp.length - 1], pr = H * (ph ? 0.05 : 0.07); [[0, 0, 1], [-1.1, 0.35, 0.7], [1, 0.3, 0.75], [-0.4, -0.25, 0.6]].forEach(function (k) { var ex = te[0] + k[0] * pr, ey = te[1] + k[1] * pr * 0.5; FG.leaf += n9_E(ex, ey, pr * k[2], pr * k[2] * 0.34); for (var f2 = 0; f2 < 5; f2++) { var fx2 = ex - pr * k[2] * 0.8 + f2 * pr * k[2] * 0.4; FG.leaf += n9_P([[fx2 - pr * 0.05, ey], [fx2, ey + pr * k[2] * (0.5 + 0.3 * (f2 % 2))], [fx2 + pr * 0.05, ey]]); } }); for (var t = 0.3; t < 1; t += (ph ? 0.2 : 0.14)) { var p = lp[Math.round(t * (lp.length - 1))]; nmoss.push({x: p[0], y: p[1] + 2, len: H * (ph ? 0.1 : 0.14) * (0.6 + rnd() * 0.7), w: 0}); } });
  if (!ph) { var rb = n9_curve([[W + 40, H * 0.02], [W * 0.93, H * 0.05], [W * 0.84, H * 0.035], [W * 0.76, H * 0.06]], 6); NT.tr += n9_P(n9_tube(rb, 22, 5)); [0.15, 0.35, 0.55, 0.75, 0.95].forEach(function (t) { var p = rb[Math.round(t * (rb.length - 1))]; nmoss.push({x: p[0], y: p[1] + 2, len: H * 0.13 * (0.6 + rnd() * 0.7)}); }); }
  else { var rb2 = n9_curve([[W + 30, H * 0.06], [W * 0.88, H * 0.08], [W * 0.74, H * 0.07]], 6); NT.tr += n9_P(n9_tube(rb2, 14, 4)); [0.3, 0.6, 0.9].forEach(function (t) { var p = rb2[Math.round(t * (rb2.length - 1))]; nmoss.push({x: p[0], y: p[1] + 2, len: H * 0.09 * (0.6 + rnd() * 0.7)}); }); }
  nmoss.forEach(function (m) { m.w = m.len * 0.3; m.strands = n9_mossPts(0, 0, m.len, m.w, rnd, 0); m.ph = rnd() * 6.28; });
  // foreground banks: a muddy bank with palmettos and ferns (left), reeds and cattails (right)
  var bankL = n9_fn(-40, W * (ph ? 0.42 : 0.3), 6, function (xx) { var u = (xx + 40) / (W * (ph ? 0.42 : 0.3) + 40); return H - H * (ph ? 0.05 : 0.08) * Math.pow(Math.max(0, 1 - u * u), 0.7) + 2 + Math.sin(xx / 13) * 1.5; });
  var bankR = n9_fn(W * (ph ? 0.7 : 0.8), W + 40, 6, function (xx) { var u = (xx - W * (ph ? 0.7 : 0.8)) / (W * (ph ? 0.3 : 0.2) + 40); return H - H * (ph ? 0.035 : 0.05) * Math.pow(Math.min(1, u * 1.6), 0.6) + 2 + Math.sin(xx / 11) * 1.5; });
  Object.assign(FG, {bank: below(bankL, H + 20) + below(bankR, H + 20), pal: '', palD: '', reed: '', reedD: '', cat: ''});
  var ps = ph ? 0.7 : 1;
  [[0.1, 0.96, 70, -110], [0.2, 0.97, 60, -60], [0.03, 0.93, 80, -80], [0.26, 0.99, 46, -100]].forEach(function (q, j) { if (ph && j > 2) return; var px = W * q[0] * (ph ? 1.4 : 1), py = H * q[1]; FG.palD += n9_P([[px - 2, H + 10], [px + 2, H + 10], [px + 1.5, py], [px - 1.5, py]]); n9_palmetto(FG, px, py, q[2] * ps * S * 1.2, q[3], 'pal', 'palD'); });
  var rx0 = W * (ph ? 0.74 : 0.82);
  for (i = 0; i < (ph ? 16 : 26); i++) { var rxx = rx0 + i * (W - rx0 + 20) / (ph ? 16 : 26) + (rnd() - 0.5) * 8, rh = H * (0.1 + rnd() * 0.14) * (ph ? 0.8 : 1), lean2 = (rnd() - 0.6) * 0.5;
    FG.reed += n9_P(n9_leafPts(rxx, H + 6, rh, (ph ? 2.2 : 3.2), -90 + lean2 * 30 - 6, lean2 * 0.4));
    if (i % 4 === 1) { var cxk = rxx + Math.cos((-90 + lean2 * 10) * Math.PI / 180) * rh * 0.9, cyk = H + 6 - rh * 0.92; FG.reed += n9_P(n9_tube([[rxx, H + 6], [(rxx + cxk) / 2, H + 6 - rh * 0.5], [cxk, cyk - rh * 0.12]], ph ? 2 : 2.8, ph ? 1.2 : 1.6)); FG.cat += n9_P(n9_REp(cxk, cyk, (ph ? 2.6 : 3.6) * S * 1.3, (ph ? 9 : 13) * S * 1.3, lean2 * 10)); } }
  // lily pads and flowers floating on the open water, smaller toward the horizon
  var pads = '', padT = '', flowers = '', fcent = '', buds = [], padList = [];
  var clear = function (px, py, r) { if (px < bx0 + bw(0) * 1.05 + r) return false; if (py > H * (ph ? 0.92 : 0.9) && (px < W * (ph ? 0.44 : 0.32) || px > W * (ph ? 0.7 : 0.8))) return false; for (var k = 0; k < feet.length; k++) { var f = feet[k]; if (py < f[1] + f[2] * 2 && Math.abs(px - f[0]) < f[2] * 4 + r) return false; } for (k = 0; k < padList.length; k++) if (Math.hypot(px - padList[k][0], (py - padList[k][1]) * 2.4) < r + padList[k][2]) return false; return true; };
  var tries = ph ? 220 : 420;
  for (i = 0; i < tries; i++) { var t2 = Math.pow(rnd(), 0.65), py2 = hy + H * 0.05 + t2 * (H - hy - H * 0.05), px2 = rnd() * W, sz = (ph ? 13 : 20) * (0.3 + 1.1 * (py2 - hy) / (H - hy)) * (0.75 + rnd() * 0.5);
    var cl = !ph && Math.abs(px2 - W * 0.5) < W * 0.12 && py2 > hy + H * 0.2;   // keep a clear lane of water in the middle
    if (cl || !clear(px2, py2, sz)) continue; padList.push([px2, py2, sz]); var notch = rnd() * Math.PI * 2;
    pads += n9_P(n9_padPts(px2, py2, sz, sz * 0.36, notch)); padT += n9_P(n9_padPts(px2 - sz * 0.05, py2 - sz * 0.05, sz * 0.88, sz * 0.3, notch));
    var rr2 = rnd(); if (rr2 < 0.16 && sz > 8) { flowers += n9_lily(px2 + sz * 0.1, py2 - sz * 0.08, sz * 0.5); fcent += n9_dot(px2 + sz * 0.1, py2 - sz * 0.16); }
    else if (rr2 < 0.3 && sz > 9 && buds.length < (ph ? 7 : 12)) buds.push({x: px2 + sz * 0.1, y: py2 - sz * 0.06, s: sz * 0.7}); }
  // duckweed rafts on the water by the banks
  for (i = 0; i < (ph ? 180 : 360); i++) { var side = i % 2, dx = side ? W * (ph ? 0.6 : 0.68) + rnd() * W * 0.4 : rnd() * W * (ph ? 0.5 : 0.38), dy = H * (ph ? 0.88 : 0.86) + rnd() * H * 0.12; if (rnd() < 0.5) dy = hy + H * 0.04 + rnd() * H * 0.12; dw += n9_C(dx, dy, (ph ? 0.9 : 1.3) * (0.5 + (dy - hy) / (H - hy)) * (0.7 + rnd() * 0.5)); }
  add(mid, 'b', dw, dk ? '#1E3E2C' : '#9CBE52');
  add(near, 'a', pads, dk ? '#0E2A20' : '#4E7A36'); add(near, 'b', padT, dk ? '#173A2C' : '#79A64A');
  add(near, 'c', NT.tr, dk ? '#0A1414' : '#4E4632'); add(near, 'd', NT.trS + FG.cat, dk ? '#060D0E' : '#3A3424');
  add(near, 'e', FG.bank + FG.palD, dk ? '#081210' : '#3E3A26'); add(near, 'f', FG.pal + FG.reed + FG.leaf, dk ? '#10261E' : '#4E7034');
  add(near, 'g', flowers, dk ? '#D8E4E0' : '#FFF4F2');
  if (ANIM) {
    ANIM.hy = hy; ANIM.moon = [mx, my, mr]; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ph = ph; ANIM.buds = buds; ANIM.moss = nmoss; ANIM.feet = feet; ANIM.knees = knees;
    ANIM.pads = padList; ANIM.trunk = [bx0, bw(0.5)];
    stk(near, 't', fcent, dk ? '#C8B460' : '#F2C84A', ph ? 2.2 : 3.2);
  } else {
    // the still picture: the moss hangs straight, the lily buds are closed, and at night the fireflies glow where they are
    var mo = ''; nmoss.forEach(function (m) { m.strands.forEach(function (s) { mo += n9_P(s.map(function (p) { return [p[0] + m.x, p[1] + m.y]; })); }); }); add(near, 'h', mo, dk ? '#3A4E48' : '#A9AA86');
    var bd = ''; buds.forEach(function (b) { bd += n9_P(n9_leafPts(b.x, b.y + b.s * 0.1, b.s * 0.9, b.s * 0.28, -90, 0)); }); add(near, 'g', bd);
    if (dk) { var ff = '', fh = ''; spread(0, hy - H * 0.24, W, H * 0.66, ph ? 34 : 40, ph ? 34 : 36, rnd, 1).forEach(function (c) { if (c.q < 0.6) { ff += n9_dot(c.x, c.y); fh += n9_dot(c.x, c.y); } });
      stk(near, 's', fh, 'rgba(255,214,110,0.16)', ph ? 9 : 13); stk(near, 't', ff, 'rgba(255,238,170,0.95)', ph ? 2.4 : 3.2); }
    else { stk(near, 't', fcent, '#F2C84A', ph ? 2.2 : 3.2);
      var rays = ''; for (i = 0; i < 6; i++) { var an = Math.PI * (0.2 + i * 0.12), RL = (hy - my) * 2.2; rays += n9_P([[mx, my], [mx + Math.cos(an - 0.03) * RL, my + Math.sin(an - 0.03) * RL], [mx + Math.cos(an + 0.03) * RL, my + Math.sin(an + 0.03) * RL]]); } add(refl, 'h', rays, 'rgba(255,240,200,0.12)'); }
  }
  return {sky: sky, band: band, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Karst River: a calm river winding between tall misty limestone towers (Guilin style), bamboo and a lantern raft
// one limestone tower: near-vertical, bulging sides and a rounded dome top. Returns its outline points (left side up, right side down)
function n9_towerPts(cx, yb, h, w, lean, rnd) { var L = [], R = [], s1 = rnd() * 6, s2 = rnd() * 6, n = 18;
  for (var i = 0; i <= n; i++) { var u = i / n, hw = w / 2 * Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.45) * (1 + 0.08 * Math.sin(u * 7 + s1)) * (u < 0.14 ? 1 + (0.14 - u) * 2.4 : 1), x = cx + lean * h * u * u + Math.sin(u * 5 + s2) * w * 0.03, y = yb - u * h;
    L.push([x - hw * (1 + 0.05 * Math.sin(u * 11 + s2)), y]); R.unshift([x + hw * (1 + 0.05 * Math.sin(u * 13 + s1)), y]); }
  return {pts: L.concat(R.slice(1)), L: L, R: R}; }
// a row of towers on one base line: body, the shaded side, vegetation clumps, pale cliff faces and the reflection.
// peaks: [[x, h, w, lean], ...] in pixels; o.wl: the water line to mirror about
function n9_karstRow(peaks, yb, rnd, o) { o = o || {}; var r = {body: '', shade: '', veg: '', rock: '', rf: '', streak: '', tops: []}, k = o.rk || 0.8;
  peaks.forEach(function (q) { var T = n9_towerPts(q[0], yb, q[1], q[2], q[3] || 0, rnd), wl = o.wl || yb, j;
    r.body += n9_P(T.pts.concat([[T.R[T.R.length - 1][0] + 2, yb + 8], [T.L[0][0] - 2, yb + 8]]));
    // the side away from the light, from a wavy line inside the tower out to its edge
    var sh = [], light = o.light || 1; T.L.forEach(function (p, jj) { var rp = T.R[T.R.length - 1 - jj], m = p[0] + (rp[0] - p[0]) * (light > 0 ? 0.64 + 0.05 * Math.sin(jj * 0.6) : 0.36 - 0.05 * Math.sin(jj * 0.6)); sh.push([m, p[1]]); });
    var edge = light > 0 ? T.R.slice().reverse() : T.L; r.shade += n9_P(sh.concat(edge.slice().reverse()));
    if (o.veg) { for (j = 0; j < 7; j++) { var u = 0.3 + rnd() * 0.62, ji = Math.round(u * (T.L.length - 1)), pl0 = T.L[ji], pr0 = T.R[T.R.length - 1 - ji], f0 = rnd(), ex = pl0[0] + (pr0[0] - pl0[0]) * (0.18 + f0 * 0.64), vr = Math.min(q[2] * (0.04 + rnd() * 0.05), (pr0[0] - pl0[0]) * 0.13); r.veg += n9_E(ex, pl0[1], vr * 1.5, vr * 0.42) + n9_E(ex + vr * 0.8, pl0[1] + vr * 0.25, vr * 1.1, vr * 0.38) + n9_E(ex - vr * 0.7, pl0[1] + vr * 0.3, vr * 0.8, vr * 0.3); }
      var top = T.L[T.L.length - 1]; for (j = 0; j < 4; j++) r.veg += n9_E(top[0] + (j - 1.5) * q[2] * 0.07, top[1] + q[1] * 0.025 + Math.abs(j - 1.5) * q[1] * 0.012, q[2] * 0.08, q[2] * 0.045); }
    if (o.rock) { for (j = 0; j < 3; j++) { var u2 = 0.25 + j * 0.2 + rnd() * 0.08, i2 = Math.round(u2 * (T.L.length - 1)), pl = T.L[i2], pr = T.R[T.R.length - 1 - i2], cxr = pl[0] + (pr[0] - pl[0]) * (0.3 + rnd() * 0.3), wr = (pr[0] - pl[0]) * (0.12 + rnd() * 0.1), hr = q[1] * (0.08 + rnd() * 0.08);
        var rp = []; for (var m = 0; m < 9; m++) { var am = m / 9 * Math.PI * 2, rrr = 0.75 + rnd() * 0.4; rp.push([cxr + Math.cos(am) * wr * 0.5 * rrr, pl[1] + Math.sin(am) * hr * 0.5 * rrr * (Math.sin(am) > 0 ? 1.2 : 0.8)]); } r.rock += n9_P(rp);
        r.streak += seg(cxr, pl[1] - hr * 0.3, cxr + wr * 0.1, pl[1] + hr * 0.45) + seg(cxr - wr * 0.25, pl[1] - hr * 0.1, cxr - wr * 0.2, pl[1] + hr * 0.35); } }
    r.rf += n9_P(n9_mir(T.pts, wl, k));
    r.tops.push(T.L[T.L.length - 1]); });
  return r; }
// a bamboo culm and its leaves, bent by `sway` (0 for the still picture). c: {x, y, h, w, lean, nodes, leaves}
function n9_culmPt(c, u, sway) { var b = c.lean + sway * (c.flex || 1); return [c.x + b * c.h * u * u, c.y - c.h * u * (1 - Math.abs(b) * u * 0.15)]; }
function n9_bambooPaths(c, sway) { var pts = [], i, r = {culm: [], nodes: [], leaves: []}; for (i = 0; i <= 12; i++) pts.push(n9_culmPt(c, i / 12, sway));
  r.culm = n9_tube(pts, c.w, c.w * 0.62);
  c.nodes.forEach(function (u) { var p = n9_culmPt(c, u, sway), q = n9_culmPt(c, u + 0.01, sway), a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2, ww = c.w * (1 - 0.38 * u) * 0.5; r.nodes.push([[p[0] - Math.cos(a) * ww, p[1] - Math.sin(a) * ww], [p[0] + Math.cos(a) * ww, p[1] + Math.sin(a) * ww]]); });
  c.leaves.forEach(function (l) { var p = n9_culmPt(c, l.u, sway), tw = [p[0] + Math.cos(l.a) * l.len * 0.35, p[1] + Math.sin(l.a) * l.len * 0.35];
    r.leaves.push(n9_tube([p, tw], Math.max(1, c.w * 0.18), 0.8)); l.fan.forEach(function (f) { r.leaves.push(n9_leafPts(tw[0], tw[1], l.len * f[1], l.len * 0.085, (l.a + f[0] + sway * 0.6) * 180 / Math.PI, 0.22 * (Math.cos(l.a + f[0]) > 0 ? 1 : -1))); }); });
  return r; }
function n9_makeCulm(x, y, h, w, lean, rnd, leafy) { var c = {x: x, y: y, h: h, w: w, lean: lean, nodes: [], leaves: [], flex: 0.6 + rnd() * 0.6, ph: rnd() * 6.28};
  for (var u = 0.08 + rnd() * 0.04; u < 0.98; u += 0.07 + rnd() * 0.03) c.nodes.push(u);
  for (var i = 0; i < (leafy || 0); i++) { var u2 = 0.45 + rnd() * 0.5, sd = rnd() < 0.5 ? -1 : 1, fan = [];
    for (var j = 0; j < 4 + Math.floor(rnd() * 3); j++) fan.push([(j - 2) * 0.32 + (rnd() - 0.5) * 0.2, 0.7 + rnd() * 0.5]);
    c.leaves.push({u: u2, a: Math.PI / 2 - sd * (0.5 + rnd() * 0.5), len: h * (leafy > 4 ? 0.045 + rnd() * 0.03 : 0.07 + rnd() * 0.05), fan: fan}); }
  return c; }
// a river bank seen from a low angle: a grassy top with a rounded end toward the water, an earthy rim and a reflection
function n9_bank(x0, x1, y, th, toRight) { var top = [], rim = [], n = 16, i; for (i = 0; i <= n; i++) { var u = i / n, xx = x0 + (x1 - x0) * u, e = toRight ? u : 1 - u, lift = th * (0.35 + 0.65 * Math.pow(1 - e, 0.6)) * (0.9 + 0.2 * Math.sin(i * 1.7)); top.push([xx, y - lift]); }
  var tip = toRight ? [x1 + th * 1.2, y] : [x0 - th * 1.2, y];
  var outline = toRight ? top.concat([tip, [x0 - 40, y + 2]]) : [tip].concat(top, [[x1 + 40, y + 2]]);
  for (i = 0; i <= n; i++) { var u3 = i / n; rim.push([x0 + (x1 - x0) * u3, y - th * 0.2 * (toRight ? 1 - u3 * 0.6 : 0.4 + u3 * 0.6)]); }
  var rimP = toRight ? rim.concat([tip, [x0 - 40, y + 2]]) : [tip].concat(rim, [[x1 + 40, y + 2]]);
  return {top: outline, rim: rimP, rf: n9_mir(outline, y + 1, 0.6)}; }
// the raft as outlines for the still picture (the engine draws its own, bobbing)
function n9_raftParts(x, y, s) { var d = '', w = 100 * s, dp = 22 * s, i; for (i = 0; i < 6; i++) { var yy = y - dp / 2 + i * dp / 6; d += rrect(x - w / 2 + (5 - i) * 2 * s, yy, w, dp / 6 - 0.8 * s, dp / 12); }
  d += rect(x + w * 0.38, y - 70 * s, 3 * s, 64 * s) + rect(x + w * 0.38 - 18 * s, y - 70 * s, 21 * s, 2.4 * s) + rrect(x - w * 0.3, y - 14 * s, 16 * s, 12 * s, 4 * s);
  return {logs: d, lantern: seg(x + w * 0.38 - 16 * s, y - 60 * s, x + w * 0.38 - 16 * s, y - 52 * s)}; }

SCENES.karst = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0.8), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i;
  var hy = H * (ph ? 0.56 : 0.6);
  var sky = dk ? 'linear-gradient(180deg,#0A1622 0%,#122434 36%,#1C3846 66%,#284A52 100%)' : 'linear-gradient(180deg,#B4D2CB 0%,#D2E4DC 32%,#EAF0E8 60%,#F6F1E4 100%)';
  var band = {top: hy, bg: dk ? 'linear-gradient(180deg,#22424A 0%,#163038 22%,#0E2028 60%,#08141A 100%)' : 'linear-gradient(180deg,#E6EEE6 0%,#C4DAD0 20%,#9CC2B4 55%,#78A898 100%)'};
  // a pale pearl sun high in the mist, or the moon set among the peaks
  var mx = dk ? W * (ph ? 0.6 : 0.57) : W * (ph ? 0.3 : 0.27), my = dk ? H * (ph ? 0.22 : 0.25) : H * (ph ? 0.12 : 0.16), mr = ph ? 24 : 36;
  if (dk) { add(far, 'a', n9_C(mx, my, mr * 3.6), 'rgba(200,225,235,0.08)'); add(far, 'c', n9_C(mx, my, mr), '#F0EEDC');
    var st = ''; spread(0, 0, W, hy * 0.7, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - mx, c.y - my) > mr * 2.2) st += n9_C(c.x, c.y, 0.4 + c.r * 0.9); }); add(far, 'b', st, 'rgba(236,244,248,0.75)'); }
  else { add(far, 'a', n9_C(mx, my, mr * 3.4), 'rgba(255,252,240,0.4)'); add(far, 'c', n9_C(mx, my, mr), '#FFFDF4');
    var hz = ''; for (i = 0; i < (ph ? 4 : 6); i++) hz += n9_E(W * (i + 0.5) / (ph ? 4 : 6) + (rnd() - 0.5) * 60, H * (0.1 + rnd() * 0.2), (ph ? 80 : 170) * (0.7 + rnd() * 0.6), 5 + rnd() * 5); add(far, 'b', hz, 'rgba(255,255,255,0.6)'); }
  // layer after layer of towers fading into the haze, with mist pooled at their feet
  var avoid = function (list, gap) { return list.filter(function (q) { return Math.abs(q[0] - mx) > gap || hy - q[1] > my + mr * 1.6; }); };
  var rowPeaks = function (n, hmin, hmax, wmin, wmax) { var out = []; for (var j = 0; j < n; j++) { var xx = W * (j + 0.5) / n + (rnd() - 0.5) * W / n * 0.8; out.push([xx, H * (hmin + rnd() * (hmax - hmin)), W * (wmin + rnd() * (wmax - wmin)) * (ph ? 1.7 : 1), (rnd() - 0.5) * 0.12]); } return out; };
  var mist = function (y, n) { var d = ''; for (var j = 0; j < n; j++) d += n9_E(W * (j + 0.5) / n + (rnd() - 0.5) * 80, y + (rnd() - 0.5) * H * 0.01, W / n * (0.9 + rnd() * 0.5), H * (0.012 + rnd() * 0.012)); return d; };
  var L5 = n9_karstRow(rowPeaks(ph ? 6 : 11, 0.1, 0.22, 0.05, 0.08), hy, rnd, {rk: 0.7});
  var L4 = n9_karstRow(avoid(rowPeaks(ph ? 5 : 9, 0.16, 0.3, 0.06, 0.09), W * 0.05), hy + 1, rnd, {rk: 0.75});
  add(far, 'd', L5.body, dk ? '#2A4656' : '#C8DCD4'); add(far, 'e', mist(hy - H * 0.02, 5), dk ? 'rgba(160,190,200,0.14)' : 'rgba(255,255,252,0.7)');
  add(far, 'f', L4.body, dk ? '#223C4C' : '#AFCCC2'); add(far, 'g', L5.rf + L4.rf, dk ? 'rgba(30,58,70,0.7)' : 'rgba(170,200,190,0.6)'); add(far, 'h', mist(hy - H * 0.005, 6), dk ? 'rgba(150,185,195,0.14)' : 'rgba(255,255,252,0.62)');
  var L3 = n9_karstRow(avoid(ph ? [[W * 0.12, H * 0.26, W * 0.2, -0.04], [W * 0.46, H * 0.2, W * 0.18, 0.05], [W * 0.88, H * 0.3, W * 0.2, 0.03]] : [[W * 0.06, H * 0.3, W * 0.09, -0.04], [W * 0.2, H * 0.24, W * 0.08, 0.03], [W * 0.38, H * 0.33, W * 0.085, 0.05], [W * 0.5, H * 0.22, W * 0.07, -0.02], [W * 0.7, H * 0.36, W * 0.09, 0.04], [W * 0.84, H * 0.26, W * 0.08, -0.03]], W * 0.06), hy + 2, rnd, {rk: 0.8, veg: true});
  add(refl, 'a', L3.body, dk ? '#1C3444' : '#90B6A8'); add(refl, 'b', L3.shade + L3.veg, dk ? '#152A38' : '#7FA898'); add(refl, 'c', L3.rf, dk ? 'rgba(20,44,56,0.75)' : 'rgba(130,170,158,0.55)');
  add(refl, 'd', mist(hy + H * 0.002, 4), dk ? 'rgba(150,185,195,0.12)' : 'rgba(255,255,250,0.55)');
  // the far bank where the river bends away, with a few little bamboo clumps
  var B1 = n9_bank(W * (ph ? 0.58 : 0.6), W + 40, hy + H * 0.014, H * 0.008, false), fb = '';
  add(refl, 'e', n9_P(B1.rf), dk ? 'rgba(10,26,30,0.6)' : 'rgba(90,130,110,0.45)'); add(refl, 'f', n9_P(B1.top), dk ? '#183430' : '#8EB48A'); add(refl, 'g', n9_P(B1.rim), dk ? '#0E2024' : '#5E8070');
  for (i = 0; i < (ph ? 3 : 6); i++) { var bx = W * (ph ? 0.66 : 0.68) + i * W * (ph ? 0.1 : 0.05) + rnd() * 10; for (var j2 = 0; j2 < 4; j2++) fb += n9_E(bx + (j2 - 1.5) * 4 * S, hy + H * 0.008 - H * 0.03 * (0.6 + rnd() * 0.6), 3 * S, H * 0.022); }
  var B0 = n9_bank(W * (ph ? 0.05 : 0.12), W * (ph ? 0.38 : 0.44), hy + H * 0.026, H * 0.008, true);
  refl.e.d += n9_P(B0.rf); refl.f.d += n9_P(B0.top); refl.g.d += n9_P(B0.rim);
  add(refl, 'h', fb, dk ? '#1E3C36' : '#7EA87A');
  // the middle towers: big and green with cliffs and plants, then the giants at the edges standing on the near banks
  var L2peaks = avoid(ph ? [[W * 0.3, H * 0.36, W * 0.26, -0.03], [W * 0.78, H * 0.3, W * 0.24, 0.04]] : [[W * 0.17, H * 0.36, W * 0.1, -0.03], [W * 0.31, H * 0.27, W * 0.085, 0.04], [W * 0.69, H * 0.33, W * 0.1, 0.03], [W * 0.8, H * 0.26, W * 0.08, -0.04]], W * 0.07);
  var L2 = n9_karstRow(L2peaks, hy + H * 0.008, rnd, {rk: 0.82, veg: true, light: -1});
  add(mid, 'a', L2.body, dk ? '#162C3A' : '#72A08E'); add(mid, 'b', L2.shade + L2.veg, dk ? '#10222E' : '#5E8C78'); add(mid, 'c', L2.rf, dk ? 'rgba(10,26,34,0.75)' : 'rgba(96,140,124,0.38)');
  var yL = hy + H * (ph ? 0.045 : 0.05), yR = hy + H * (ph ? 0.1 : 0.12);
  var L1l = n9_karstRow([[W * (ph ? 0.02 : 0.06), H * (ph ? 0.5 : 0.62), W * (ph ? 0.34 : 0.15), 0.05]], yL, rnd, {rk: 0.6, veg: true, rock: true, light: -1});
  var L1r = n9_karstRow([[W * (ph ? 1.0 : 0.93), H * (ph ? 0.6 : 0.72), W * (ph ? 0.38 : 0.17), -0.06]], yR, rnd, {rk: 0.6, veg: true, rock: true, light: -1});
  add(mid, 'd', L1l.body + L1r.body, dk ? '#11222C' : '#5A8A74'); add(mid, 'e', L1l.rock + L1r.rock, dk ? '#2A3E46' : '#7E9E8E'); add(mid, 'f', L1l.shade + L1r.shade + L1l.veg + L1r.veg, dk ? '#0B1820' : '#456E5C');
  add(mid, 'h', L1l.rf + L1r.rf, dk ? 'rgba(4,14,18,0.75)' : 'rgba(70,110,94,0.3)'); stk(mid, 's', L1l.streak + L1r.streak, dk ? 'rgba(0,0,0,0.25)' : 'rgba(70,90,80,0.3)', ph ? 0.8 : 1.2);
  // the near banks: the left bank, the right bank under the big tower, and the foreground banks with rocks
  var B2 = n9_bank(-40, W * (ph ? 0.4 : 0.36), yL + 2, H * 0.016, true), B3 = n9_bank(W * (ph ? 0.66 : 0.74), W + 40, yR + 2, H * 0.022, false);
  var B4 = n9_fn(-40, W * (ph ? 0.5 : 0.34), 6, function (xx) { var u = (xx + 40) / (W * (ph ? 0.5 : 0.34) + 40); return H - H * (ph ? 0.07 : 0.1) * Math.pow(Math.max(0, 1 - u * u), 0.55) + Math.sin(xx / 17) * 2; });
  var B5 = n9_fn(W * (ph ? 0.78 : 0.86), W + 40, 6, function (xx) { var u = (xx - W * (ph ? 0.78 : 0.86)) / (W * (ph ? 0.22 : 0.14) + 40); return H - H * (ph ? 0.04 : 0.06) * Math.pow(Math.min(1, u * 1.5), 0.6) + Math.sin(xx / 13) * 2; });
  var rocks = ''; [[0.07, 0.955, 30], [0.17, 0.975, 20], [0.26, 0.99, 15], [0.93, 0.98, 18]].forEach(function (q) { var rx = W * q[0] * (ph ? 1.3 : 1), ry = H * q[1], rr = q[2] * S * (ph ? 1.2 : 1); rocks += n9_P(n9_REp(rx, ry, rr, rr * 0.55, 0, 16)) + n9_P(n9_REp(rx + rr * 0.8, ry + rr * 0.2, rr * 0.55, rr * 0.35, 0, 14)); });
  add(near, 'a', n9_P(B2.rf) + n9_P(B3.rf), dk ? 'rgba(4,14,16,0.6)' : 'rgba(60,96,80,0.4)');
  add(near, 'b', n9_P(B2.top) + n9_P(B3.top), dk ? '#173230' : '#7EA87A'); add(near, 'c', n9_P(B2.rim) + n9_P(B3.rim) + below(B4, H + 20) + below(B5, H + 20), dk ? '#0C1C1E' : '#4E6E5E');
  // bamboo clumps on the near banks
  var cl2 = {culm: '', leaf: ''};
  [[W * (ph ? 0.06 : 0.12), yL, 6], [W * (ph ? 0.3 : 0.28), yL + 2, 4], [W * (ph ? 0.76 : 0.8), yR, 5]].forEach(function (q) { for (var k = 0; k < q[2]; k++) { var c = n9_makeCulm(q[0] + (k - q[2] / 2) * 7 * S, q[1] + rnd() * 3, H * (0.1 + rnd() * 0.08), (ph ? 2.4 : 3.6) * S * 1.2, (k - q[2] / 2) * 0.06 + (rnd() - 0.5) * 0.08, rnd, 3), bp = n9_bambooPaths(c, 0); cl2.culm += n9_P(bp.culm); bp.leaves.forEach(function (l) { cl2.leaf += n9_P(l); }); } });
  add(near, 'd', cl2.culm, dk ? '#2E4A3A' : '#8AAE5A'); add(near, 'e', cl2.leaf, dk ? '#1E3C30' : '#5E944A');
  add(near, 'f', rocks, dk ? '#22343A' : '#7A9284');
  // the tall foreground bamboo (swaying in the living scene)
  var fg = [], fx0 = ph ? [[-0.02, 0.98], [0.06, 1.0], [0.12, 0.99]] : [[0.015, 0.97], [0.05, 0.99], [0.085, 0.975], [0.125, 1.0]];
  fx0.forEach(function (q, k) { fg.push(n9_makeCulm(W * q[0], H * q[1], H * (1.05 + rnd() * 0.25), (ph ? 7 : 12) * S * (1 - k * 0.06), 0.03 + k * 0.04, rnd, ph ? 7 : 11)); });
  if (!ph) [[0.975, 1.0], [0.995, 0.98]].forEach(function (q, k) { fg.push(n9_makeCulm(W * q[0], H * q[1], H * (0.85 + rnd() * 0.2), 11 * S, -0.06 - k * 0.05, rnd, 9)); });
  // the raft on the open water
  var raft = {x: W * (ph ? 0.5 : 0.42), y: hy + H * (ph ? 0.2 : 0.22), s: (ph ? 0.75 : 1.15) * S};
  if (ANIM) {
    ANIM.hy = hy; ANIM.moon = [mx, my, mr]; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ph = ph; ANIM.fg = fg; ANIM.raft = raft; ANIM.banks = [yL, yR];
  } else {
    var fgc = '', fgn = '', fgl = ''; fg.forEach(function (c) { var bp = n9_bambooPaths(c, 0); fgc += n9_P(bp.culm); bp.nodes.forEach(function (nd) { fgn += pline(nd); }); bp.leaves.forEach(function (l) { fgl += n9_P(l); }); });
    add(near, 'g', fgc, dk ? '#2A4636' : '#7EA456'); add(near, 'h', fgl, dk ? '#1C3A2E' : '#4E8A44'); stk(near, 't', fgn, dk ? '#162A22' : '#4E7034', ph ? 1.4 : 2);
    var R = n9_raftParts(raft.x, raft.y, raft.s); add(mid, 'g', R.logs, dk ? '#4A4A36' : '#C2A86A'); stk(mid, 't', R.lantern, dk ? '#FFB86A' : '#E8584A', 9 * raft.s);
  }
  return {sky: sky, band: band, far: far, refl: refl, mid: mid, near: near};
};
