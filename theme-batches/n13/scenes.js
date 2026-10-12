// ---- batch n13: maples (Maple Ravine), aspens (Aspen Gold)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n13_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n13_P(pts) { return pts.length > 2 ? poly(n13_cw(pts)) : ''; }
function n13_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n13_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n13_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 18; i++) { var t = i / 18 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n13_P(rotp(p, x, y, ang)); }
function n13_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n13_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n13_dot(x, y) { return 'M' + PT(x, y) + ' h0.01 '; }
function n13_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return p; }
// open Catmull-Rom through a list of points (end points kept)
function n13_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
// a tapered band along a polyline (w0 at the start, w1 at the end)
function n13_band(pts, w0, w1) { var L = [], R = [], n = pts.length; for (var i = 0; i < n; i++) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * i / (n - 1); L.push([pts[i][0] - dy / dl * w, pts[i][1] + dx / dl * w]); R.push([pts[i][0] + dy / dl * w, pts[i][1] - dx / dl * w]); } return n13_P(L.concat(R.reverse())); }
// a tapered limb from (x0,y0) to (x1,y1), bowed sideways by bend
function n13_limb(x0, y0, x1, y1, w0, w1, bend) { var p = []; for (var i = 0; i <= 8; i++) { var u = i / 8, dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1; p.push([x0 + dx * u - dy / dl * Math.sin(Math.PI * u) * bend, y0 + dy * u + dx / dl * Math.sin(Math.PI * u) * bend]); } return {d: n13_band(p, w0, w1), pts: p}; }
function n13_starPts(x, y, R, r, n, rot) { var p = []; for (var i = 0; i < n * 2; i++) { var a = rot + i * Math.PI / n - Math.PI / 2, q = i % 2 ? r : R; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return p; }
// a Japanese maple leaf (palmate, n slender pointed lobes, stem down), r = tip radius, ang in degrees. fine: shouldered lobes.
function n13_mleafPts(x, y, r, ang, n, fine) { n = n || 5; var p = [], a0 = -Math.PI / 2, sp = n >= 7 ? 2.25 : 1.95, st = sp * 2 / (n - 1);
  for (var i = 0; i < n; i++) { var u = i / (n - 1) * 2 - 1, a = a0 + u * sp, L = r * (1 - 0.34 * u * u);
    if (i > 0) p.push([Math.cos(a - st / 2) * r * 0.3, Math.sin(a - st / 2) * r * 0.3]);
    if (fine) { var w = st * 0.36; p.push([Math.cos(a - w) * L * 0.58, Math.sin(a - w) * L * 0.58]); p.push([Math.cos(a) * L, Math.sin(a) * L]); p.push([Math.cos(a + w) * L * 0.58, Math.sin(a + w) * L * 0.58]); }
    else p.push([Math.cos(a) * L, Math.sin(a) * L]); }
  p.push([r * 0.1, r * 0.22]); p.push([r * 0.02, r * 0.62]); p.push([-r * 0.06, r * 0.22]);
  return rotp(p, x, y, ang); }
function n13_mleaf(x, y, r, ang, n, fine) { return n13_P(n13_mleafPts(x, y, r, ang, n, fine)); }
// layered mountain ridge in a V around vx: y rises from vy at vx to vy - rise at the edges, with bumps
function n13_vridge(W, vx, vy, rise, rnd, step, pow) { var ph = rnd() * 6, ph2 = rnd() * 6; return n13_fn(-80, W + 80, step || 10, function (x) { var u = Math.min(1.3, Math.abs(x - vx) / (W * 0.5)); return vy - rise * Math.pow(u, pow || 0.85) + Math.sin(x / 63 + ph) * rise * 0.05 + Math.sin(x / 23 + ph2) * rise * 0.02; }); }

// =============== 1. Maple Ravine: a mountain ravine in autumn, maples overhanging mossy boulders, a stream of little cascades, stone steps
// a mossy boulder sitting at (cx, by): o.f stone, o.g shade overlay, o.h moss, o.c water line (when wet), o.lv leaf dots
function n13_boulder(o, cx, by, w, h, rnd, moss, wet) { var top = [], n = 14, i, nz = []; for (i = 0; i <= n; i++) nz.push(1 + (rnd() - 0.5) * 0.12);
  for (i = 0; i <= n; i++) { var t = i / n * Math.PI; top.push([cx + w / 2 * Math.cos(t) * nz[i], by - h * Math.pow(Math.sin(t), 0.62) * nz[n - i]]); }
  var body = top.concat([[cx - w * 0.46, by + h * 0.06], [cx, by + h * 0.09], [cx + w * 0.46, by + h * 0.06]]);
  o.f += n13_P(body);
  // the shaded side (away from the light, which comes from the upper left) and the dark crease where it meets the ground
  var sh = [], k = Math.round(n * 0.55); for (i = 0; i <= k; i++) sh.push(top[i]);
  for (i = k; i >= 0; i--) { var t2 = i / n * Math.PI; sh.push([cx + w * 0.5 * Math.cos(t2) * 0.5 + w * 0.12, by - h * Math.pow(Math.sin(t2), 0.62) * 0.62]); }
  sh.push([cx + w * 0.46, by + h * 0.06]); o.g += n13_P(sh);
  o.g += n13_P([[cx - w * 0.48, by - h * 0.04], [cx, by + h * 0.02], [cx + w * 0.48, by - h * 0.04], [cx + w * 0.46, by + h * 0.06], [cx, by + h * 0.09], [cx - w * 0.46, by + h * 0.06]]);
  if (moss) { var ms = [], a0 = Math.round(n * 0.18), a1 = Math.round(n * 0.92); for (i = a0; i <= a1; i++) ms.push([top[i][0], top[i][1] - 0.8]);
    for (i = a1; i >= a0; i--) { var t3 = i / n * Math.PI, dep = h * moss * (0.25 + 0.75 * Math.pow(Math.sin(t3), 2)) * (0.75 + 0.5 * Math.abs(Math.sin(i * 1.7))); ms.push([top[i][0] + (cx - top[i][0]) * 0.08, top[i][1] + dep]); }
    o.h += n13_P(ms); if (o.lv && rnd() < 0.7) { var lx = cx + (rnd() - 0.5) * w * 0.5; o.lv += n13_dot(lx, by - h * 0.92 + rnd() * h * 0.2); } }
  if (wet && o.c != null) o.c += n13_E(cx, by + h * 0.05, w * 0.56, Math.max(1, h * 0.06)) ; }
// a stone lantern (toro) standing at (x, y), height h: o.f stone, o.g shade, o.h moss
function n13_lantern(o, x, y, h) { var q = function (pts) { return n13_P(pts.map(function (p) { return [x + p[0] * h, y + p[1] * h]; })); };
  o.f += q([[-0.26, 0], [0.26, 0], [0.22, -0.06], [0.13, -0.09], [-0.13, -0.09], [-0.22, -0.06]]);
  o.f += q([[-0.075, -0.08], [0.075, -0.08], [0.065, -0.42], [-0.065, -0.42]]);
  o.f += q([[-0.12, -0.4], [0.12, -0.4], [0.2, -0.47], [-0.2, -0.47]]);
  o.f += q([[-0.15, -0.465], [0.15, -0.465], [0.15, -0.68], [-0.15, -0.68]]);
  o.f += q([[-0.34, -0.66], [-0.24, -0.7], [-0.12, -0.78], [0, -0.81], [0.12, -0.78], [0.24, -0.7], [0.34, -0.66], [0.36, -0.69], [0.2, -0.64], [-0.2, -0.64], [-0.36, -0.69]]);
  o.f += q([[-0.05, -0.8], [-0.07, -0.86], [-0.03, -0.92], [0, -0.96], [0.03, -0.92], [0.07, -0.86], [0.05, -0.8]]);
  o.g += q([[0.04, -0.08], [0.075, -0.08], [0.065, -0.42], [0.03, -0.42]]) + q([[0.05, -0.465], [0.15, -0.465], [0.15, -0.68], [0.05, -0.68]]) + q([[0, -0.08], [0.22, -0.06], [0.26, 0], [0, 0]]) + q([[-0.34, -0.66], [0.34, -0.66], [0.2, -0.64], [-0.2, -0.64]]) + q([[0.0, -0.47], [0.2, -0.47], [0.12, -0.4], [0, -0.4]]);
  o.g += q([[-0.075, -0.505], [0.075, -0.505], [0.075, -0.625], [-0.075, -0.625]]);
  o.h += q([[-0.3, -0.675], [-0.18, -0.72], [-0.06, -0.775], [0.04, -0.78], [0.0, -0.75], [-0.14, -0.7], [-0.26, -0.665]]) + q([[-0.25, -0.005], [-0.16, -0.05], [-0.05, -0.085], [-0.1, -0.06], [-0.2, -0.02]]);
  return {wx: x, wy: y - 0.565 * h, ww: 0.075 * h, wh: 0.06 * h}; }
// a maple foliage cluster: dark back mass and many small leaves, warmer on the lit (upper-left) side; bias 0 crimson .. 1 gold
function n13_cluster(o, cx, cy, R, ls, rnd, bias) { var i, m = 6;
  for (i = 0; i < m; i++) { var a = i / m * Math.PI * 2 + rnd(); o.b += n13_C(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.24, R * (0.36 + rnd() * 0.12)); }
  o.b += n13_C(cx, cy, R * 0.45);
  var N = Math.min(240, Math.max(10, Math.round(R * R / (ls * ls) * 1.7)));
  for (i = 0; i < N; i++) { var a2 = rnd() * Math.PI * 2, rr = Math.pow(rnd(), 0.4) * 1.02, x = cx + Math.cos(a2) * R * rr, y = cy + Math.sin(a2) * R * 0.82 * rr, lit = ((cx - x) * 0.7 + (cy - y)) / R, v = bias + lit * 0.35 + (rnd() - 0.5) * 0.5, s = ls * (0.8 + rnd() * 0.45), d = n13_mleaf(x, y, s, (rnd() - 0.5) * 70 + (x - cx) / R * 30, 5);
    if (v < 0.2) o.c += d; else if (v < 0.5) o.d += d; else if (v < 0.78) o.e += d; else o.f += d; } }

SCENES.maples = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.4), refl = Lay(0), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, x;
  var LS = ph ? 1.35 : 1;   // phone: things a bit bigger relative to S
  var sky = dk ? 'linear-gradient(180deg,#070B22 0%,#111A3C 30%,#222C58 58%,#353A66 100%)' : 'linear-gradient(180deg,#86B6DE 0%,#B4D2E8 26%,#E2E6DE 50%,#F4DCBE 72%,#F4DCBE 100%)';
  var vx = W * 0.5, vy = H * (ph ? 0.4 : 0.41);
  // sun or moon in the gap between the two canopies; at night red maple sprays cross in front of the moon
  var mx = W * (ph ? 0.6 : 0.585), my = H * 0.2, mr = dk ? (ph ? 30 : 46) : (ph ? 22 : 32);
  if (dk) { add(far, 'a', n13_C(mx, my, mr * 3.2), 'rgba(196,206,255,0.10)'); add(far, 'b', n13_C(mx, my, mr * 1.7), 'rgba(220,226,255,0.16)'); add(far, 'c', n13_C(mx, my, mr), '#FBF4DE');
    add(far, 'd', n13_C(mx - mr * 0.3, my - mr * 0.1, mr * 0.22) + n13_C(mx + mr * 0.25, my + mr * 0.3, mr * 0.16) + n13_C(mx + mr * 0.1, my - mr * 0.42, mr * 0.12), 'rgba(214,204,180,0.45)');
    var st = ''; spread(0, 0, W, vy, 26, 26, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - mx, c.y - my) > mr * 2.2) st += n13_C(c.x, c.y, 0.4 + c.r * 1.0); }); add(far, 'e', st, 'rgba(255,248,236,0.85)'); }
  else { add(far, 'a', n13_C(mx, my, mr * 3.4), 'rgba(255,246,220,0.32)'); add(far, 'b', n13_C(mx, my, mr * 1.8), 'rgba(255,250,232,0.5)'); add(far, 'c', n13_C(mx, my, mr), '#FFFBEE');
    var cb = ''; spread(0, H * 0.04, W, H * 0.2, ph ? 170 : 300, 70, rnd, 0.8).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - mx, c.y - my) > 120) { var s = (0.6 + c.r * 0.6) * (ph ? 0.7 : 1); cb += n13_E(c.x, c.y, 80 * s, 6 * s) + n13_E(c.x + 26 * s, c.y - 5 * s, 44 * s, 6 * s) + n13_E(c.x - 30 * s, c.y - 2 * s, 30 * s, 4 * s); } }); add(far, 'e', cb, 'rgba(255,255,255,0.6)'); }
  // far mountain ridges in a V, hazy blue with muted autumn speckles, a soft mist lying between them
  var r0 = n13_vridge(W, vx + W * 0.03, H * (ph ? 0.29 : 0.3), H * 0.2, rnd, 10, 0.9), r1 = n13_vridge(W, vx - W * 0.02, H * (ph ? 0.335 : 0.35), H * 0.2, rnd, 10, 0.8);
  add(far, 'f', below(r0, H), dk ? '#2C3460' : '#AEB8D2');
  var spk = ''; spread(0, H * 0.1, W, H * 0.3, 9, 7, rnd, 1).forEach(function (c) { var t = n13_yOn(r1, c.x); if (c.y > t + 3 && c.y < t + H * 0.12 && c.q < 0.45) spk += n13_C(c.x, c.y, (1.6 + c.r * 1.6) * S); });
  add(far, 'g', below(r1, H), dk ? '#262D52' : '#98A4C0'); add(far, 'h', spk, dk ? 'rgba(120,70,90,0.45)' : 'rgba(200,128,108,0.55)');
  stk(far, 's', pline(n13_fn(-60, W + 60, 20, function (x) { return n13_yOn(r1, x) + H * 0.03; })), dk ? 'rgba(150,160,210,0.14)' : 'rgba(255,255,255,0.32)', H * 0.03);
  // the ravine's two forested walls meeting in a V at the head of the stream, with a rock cliff where the waterfall drops
  var wall = n13_vridge(W, vx, vy, H * (ph ? 0.24 : 0.28), rnd, 8, 0.75);
  add(refl, 'a', below(wall, H + 40), dk ? '#1C2030' : '#5A5238');
  var gTop = function (x) { var u = Math.abs(x - vx) / (W * 0.5); return H * (ph ? 0.455 : 0.465) + H * (ph ? 0.12 : 0.1) * Math.pow(Math.min(1.3, u), 1.2) + Math.sin(x / 47) * 3 * S; };
  var cw = W * (ph ? 0.07 : 0.042), ctop = vy - H * 0.035, cliff = [], cS = '';
  for (i = 0; i <= 12; i++) { var u = i / 12; cliff.push([vx - cw + 2 * cw * u, ctop + Math.sin(u * Math.PI * 3 + 1) * H * 0.006 - Math.sin(u * Math.PI) * H * 0.012 + (rnd() - 0.5) * 3]); }
  for (i = 1; i <= 5; i++) cliff.push([vx + cw * (1 + i * 0.05) + (i % 2 ? 3 : -2) * S, ctop + (gTop(vx) + 8 - ctop) * i / 5]);
  for (i = 5; i >= 1; i--) cliff.push([vx - cw * (1 + i * 0.05) - (i % 2 ? 2 : -3) * S, ctop + (gTop(vx) + 8 - ctop) * i / 5]);
  for (i = 0; i < 4; i++) { var ly = ctop + (gTop(vx) - ctop) * (0.2 + i * 0.2); cS += 'M' + PT(vx - cw * (0.9 + i * 0.05), ly + (rnd() - 0.5) * 4) + ' L' + PT(vx - cw * 0.25, ly + 2) + ' M' + PT(vx + cw * 0.3, ly - 1) + ' L' + PT(vx + cw * (0.95 + i * 0.05), ly + (rnd() - 0.5) * 4) + ' '; }
  // the slopes' forest: round maple crowns in crimson, orange and gold with dark cedar spires between them
  var fo = {b: '', c: '', d: '', e: '', f: ''}, cells = spread(-30, H * 0.05, W + 60, H * 0.62, ph ? 15 : 22, ph ? 13 : 17, rnd, 1);
  cells.sort(function (p, q) { return p.y - q.y; }).forEach(function (c) { var t = n13_yOn(wall, c.x), g = gTop(c.x); if (c.y < t - 2 || c.y > g + 10) return; if (Math.abs(c.x - vx) < cw * 0.55 && c.y > ctop + 2) return;
    var depth = Math.min(1, Math.max(0, (c.y - t) / (H * 0.25))), r = (ph ? 7 : 10) * S * LS * (0.8 + c.r * 0.6) * (0.75 + 0.5 * depth);
    if (c.k < 0.22) { var hh = r * (2.6 + c.q), ww = r * 0.7; fo.b += n13_P([[c.x, c.y - hh], [c.x + ww * 0.35, c.y - hh * 0.6], [c.x + ww * 0.25, c.y - hh * 0.55], [c.x + ww * 0.7, c.y - hh * 0.15], [c.x + ww * 0.5, c.y - hh * 0.12], [c.x + ww, c.y + r * 0.3], [c.x - ww, c.y + r * 0.3], [c.x - ww * 0.5, c.y - hh * 0.12], [c.x - ww * 0.7, c.y - hh * 0.15], [c.x - ww * 0.25, c.y - hh * 0.55], [c.x - ww * 0.35, c.y - hh * 0.6]]); return; }
    var key = c.q < 0.42 ? 'c' : c.q < 0.72 ? 'd' : 'e', d = n13_C(c.x, c.y, r) + n13_C(c.x - r * 0.75, c.y + r * 0.25, r * 0.72) + n13_C(c.x + r * 0.78, c.y + r * 0.2, r * 0.7);
    fo[key] += d; if (c.r < 0.5) fo.f += n13_C(c.x - r * 0.28, c.y - r * 0.36, r * 0.42); });
  add(refl, 'b', fo.b, dk ? '#0F1A22' : '#2E4A36'); add(refl, 'c', fo.c, dk ? '#3E1A28' : '#B8402E'); add(refl, 'd', fo.d, dk ? '#4A2430' : '#D8702E'); add(refl, 'e', fo.e, dk ? '#4E3A3A' : '#E2A63A');
  add(refl, 'f', fo.f, dk ? 'rgba(150,150,210,0.10)' : 'rgba(255,232,180,0.3)');
  add(refl, 'g', n13_P(cliff.slice(0, 13).concat([[vx + cw * 0.5, ctop + H * 0.03], [vx - cw * 0.5, ctop + H * 0.03]])), dk ? '#2A2E40' : '#77705E'); stk(refl, 's', cS, dk ? 'rgba(6,8,20,0.45)' : 'rgba(50,40,30,0.35)', 1.6 * S + 0.6);
  add(refl, 'h', n13_E(vx, gTop(vx) - H * 0.012, W * 0.12, H * 0.012) + n13_E(vx, gTop(vx) - H * 0.022, W * 0.07, H * 0.01), dk ? 'rgba(150,160,210,0.12)' : 'rgba(255,252,240,0.22)');
  // ---------- the stream: a chain of wide pools stepping down the ravine, each spilling over a low rock lip into the next
  var PL = ph ? [[0.5, 0.45, 0.474, 0.075], [0.46, 0.49, 0.56, 0.16], [0.54, 0.583, 0.69, 0.25], [0.44, 0.715, 1.1, 0.44]]
    : [[0.5, 0.468, 0.497, 0.052], [0.47, 0.515, 0.6, 0.1], [0.535, 0.622, 0.74, 0.16], [0.46, 0.765, 1.1, 0.26]];
  var pools = PL.map(function (q) { var yb = H * q[1], yf = H * q[2]; return {cx: W * q[0], cy: (yb + yf) / 2, hw: W * q[3], hd: (yf - yb) / 2, yb: yb, yf: yf}; });
  pools.forEach(function (p, q) { var pts = []; for (i = 0; i < 28; i++) { var t = i / 28 * Math.PI * 2, r = 1 + 0.05 * Math.sin(t * 3 + q * 2) + 0.035 * Math.sin(t * 5 + q); pts.push([p.cx + Math.cos(t) * p.hw * r, p.cy + Math.sin(t) * p.hd * (0.95 + 0.05 * Math.sin(t * 2 + 1))]); } p.pts = pts; });
  var lipY = function (p, x) { var u = (x - p.cx) / p.hw; return p.cy + p.hd * Math.sqrt(Math.max(0, 1 - u * u)) * 0.95; };
  var inPool = function (x, y, pad) { for (var q = 0; q < pools.length; q++) { var p = pools[q], uu = (x - p.cx) / (p.hw + pad), v = (y - p.cy) / (p.hd + pad * 0.5); if (uu * uu + v * v < 1) return true; } return false; };
  var ground = n13_fn(-60, W + 60, 8, gTop);
  add(mid, 'a', below(ground, H + 40), dk ? '#1A2230' : '#4A5432');
  // falls: a curtain from a lip down to the pool below, wider at the bottom, with soft wavering sides, flow streaks and a fluffy foam base
  var curt = '', cDark = '', cLite = '', foam = '', water = '', wLight = '', wRed = '', ripple = '', CUR = [];
  var addCurtain = function (xc, yb, w0, w1, topFn) { var L = [], R = [], n = 10, q, fall = yb - topFn(xc);
    for (q = 0; q <= n; q++) { var uu = q / n, y = topFn(xc - w0) + (yb - topFn(xc - w0)) * uu, w = w0 + (w1 - w0) * uu * uu, wv = Math.sin(uu * Math.PI) * w0 * 0.05; L.push([xc - w - wv, uu === 0 ? topFn(xc - w0) : y]); R.unshift([xc + w + wv, uu === 0 ? topFn(xc + w0) : topFn(xc + w0) + (yb - topFn(xc + w0)) * uu]); }
    var top = []; for (q = 1; q < n; q++) { var xx = xc - w0 + 2 * w0 * q / n; top.push([xx, topFn(xx)]); }
    curt += n13_P([L[0]].concat(top, R.slice().reverse(), L.slice(1).reverse()));
    var lines = Math.max(4, Math.round(w0 / (3.2 * S)));
    for (q = 0; q < lines; q++) { var uq = (q + 0.25 + rnd() * 0.5) / lines, xa = xc - w0 + 2 * w0 * uq, xb = xc - w1 + 2 * w1 * uq, ya = topFn(xa) + fall * 0.08, sw = (0.5 + rnd() * 0.9) * S + 0.35, yE = yb - fall * (0.1 + rnd() * 0.25);
      var band = [[xa - sw, ya], [xa + sw, ya], [(xa + xb) / 2 + sw * 1.2, (ya + yE) / 2], [xb + sw * 0.6, yE], [xb - sw * 0.6, yE], [(xa + xb) / 2 - sw * 1.2, (ya + yE) / 2]]; if (q % 3 === 1) cDark += n13_P(band); else if (q % 3 === 2) cLite += n13_P(band); }
    for (q = 0; q < 11; q++) { var fx = xc + (q / 10 - 0.5) * w1 * 2.5, fr = w1 * (0.16 + rnd() * 0.14) + 1.6 * S; foam += n13_E(fx, yb + (rnd() - 0.2) * fr * 0.4, fr, fr * 0.55); }
    for (q = 0; q < 6; q++) foam += n13_E(xc + (rnd() - 0.5) * w1 * 3, yb + fall * 0.3 + rnd() * fall * 0.5, w1 * 0.08 + S, w1 * 0.04 + 0.6);
    CUR.push({x: xc, yt: topFn(xc), yb: yb, w0: w0, w1: w1, tl: topFn(xc - w0), tr: topFn(xc + w0)}); };
  var p0 = pools[0], wfw = p0.hw * 0.32, wfTop = ctop + H * 0.004;
  addCurtain(vx + W * 0.003, p0.yb + p0.hd * 0.7, wfw * 0.55, wfw, function () { return wfTop; });
  pools.forEach(function (p, q) {
    water += n13_P(p.pts);
    var bl = []; for (i = 0; i <= 18; i++) { var t = Math.PI + i / 18 * Math.PI; bl.push([p.cx + Math.cos(t) * p.hw * 0.93, p.cy + Math.sin(t) * p.hd * 0.9]); } for (i = 18; i >= 0; i--) { var t2 = Math.PI + i / 18 * Math.PI; bl.push([p.cx + Math.cos(t2) * p.hw * 0.86, p.cy + Math.sin(t2) * p.hd * 0.42 - p.hd * 0.22]); }
    wLight += n13_P(bl);
    for (i = 0; i < 6; i++) { var rx = p.cx + (i / 5 - 0.5) * p.hw * 1.6 + (rnd() - 0.5) * p.hw * 0.1, ry0 = p.cy - p.hd * 0.3; if (Math.abs(rx - p.cx) < p.hw * 0.2) continue; wRed += 'M' + PT(rx, ry0) + ' L' + PT(rx + (rnd() - 0.5) * 3, ry0 + p.hd * (0.6 + rnd() * 0.4)) + ' '; }
    for (i = 0; i < 5; i++) { var ry = p.cy + p.hd * (-0.05 + i * 0.2), rw = p.hw * (0.2 + rnd() * 0.25); ripple += n13_E(p.cx + (rnd() - 0.5) * p.hw * 0.9, ry, rw, Math.max(0.6, p.hd * 0.03)); }
    var nx = pools[q + 1]; if (!nx) return;
    var xc = p.cx * 0.75 + nx.cx * 0.25, w0 = Math.min(p.hw * 0.5, nx.hw * 0.4), yb = nx.yb + nx.hd * 0.22;
    addCurtain(xc, yb, w0, w0 * 1.12, function (xx) { return lipY(p, xx) - 1; });
    // the glassy tongue of water sliding over the lip
    var tg = []; for (i = 0; i <= 12; i++) { var xx = xc - w0 + 2 * w0 * i / 12; tg.push([xx, lipY(p, xx) - 1]); } for (i = 12; i >= 0; i--) { var xx2 = xc - w0 * 0.92 + 1.84 * w0 * i / 12; tg.push([xx2, lipY(p, xx2) - 1 - (2.4 * S + 1) * Math.sin(i / 12 * Math.PI)]); }
    wLight += n13_P(tg); });
  add(mid, 'c', water, dk ? '#25314E' : '#4E8C8A'); add(mid, 'd', wLight + ripple, dk ? 'rgba(196,210,246,0.42)' : 'rgba(214,238,236,0.62)');
  add(mid, 'e', curt + foam, dk ? '#C6D0EA' : '#EEF6F4');
  // ---------- natural stone steps climbing the right bank, and a stone lantern beside them
  var ns = ph ? 8 : 10, sx0 = W * (ph ? 0.87 : 0.81), sx1 = W * (ph ? 0.8 : 0.7), sy0 = H * 1.02, sy1 = H * (ph ? 0.6 : 0.58), raw = [], tot = 0;
  for (k = 0; k < ns; k++) { var td = (26 - k * 1.6), rh = (9 - k * 0.45); raw.push([td, rh]); tot += td + rh; }
  var sc = (sy0 - sy1) / tot, yy = sy0, steps = [];
  for (k = 0; k < ns; k++) { var tdk = raw[k][0] * sc, rhk = raw[k][1] * sc, yf = yy - rhk, yb2 = yf - tdk, uk = k / (ns - 1), ws = W * (ph ? 0.2 : 0.11) * (1 - uk * 0.5) * (0.85 + rnd() * 0.3), xcs = sx0 + (sx1 - sx0) * uk + Math.sin(uk * Math.PI * 1.4) * W * (ph ? 0.03 : 0.025) + (rnd() - 0.5) * ws * 0.2;
    steps.push({x: xcs, yf: yf, yb: yb2, yr: yy, w: ws}); yy = yb2 + tdk * 0.12; }
  var bo = {f: '', g: '', h: '', lv: ''};
  steps.slice().reverse().forEach(function (s) { var parts = s.w > W * 0.06 && rnd() < 0.5 ? 2 : 1, cut = 0.38 + rnd() * 0.24;
    for (var pp = 0; pp < parts; pp++) { var a = parts === 1 ? 0 : (pp ? cut : 0), b = parts === 1 ? 1 : (pp ? 1 : cut), xa = s.x - s.w / 2 + s.w * a + (pp ? 2 : 0), xb = s.x - s.w / 2 + s.w * b, cx2 = (xa + xb) / 2, hw2 = (xb - xa) / 2, tdep = s.yf - s.yb, rh2 = s.yr - s.yf;
      // the tread: a flat, irregular slab; the riser: its rough front face
      var tp = []; for (i = 0; i < 14; i++) { var t = i / 14 * Math.PI * 2, rr = 1 + (rnd() - 0.5) * 0.14; tp.push([cx2 + Math.cos(t) * hw2 * rr * (Math.sin(t) < 0 ? 0.92 : 1), (s.yb + s.yf) / 2 + Math.sin(t) * tdep * 0.5 * Math.pow(Math.abs(Math.sin(t)), -0.35 + 0.35) * (0.9 + rnd() * 0.15)]); }
      var fr = []; for (i = 0; i <= 8; i++) { var u2 = i / 8; fr.push([xa + (xb - xa) * u2, s.yf - tdep * 0.15]); } for (i = 8; i >= 0; i--) { var u3 = i / 8, sg = Math.sin(u3 * Math.PI); fr.push([xa + hw2 * 0.12 + (xb - xa - hw2 * 0.24) * u3, s.yf + rh2 * (0.55 + 0.45 * Math.pow(sg, 0.3)) + (rnd() - 0.5) * 1.5]); }
      bo.f += n13_P(fr) + n13_P(tp); bo.g += n13_P(fr.map(function (p) { return [p[0], Math.max(p[1], s.yf + 0.5)]; }));
      bo.g += n13_P(tp.filter(function (p) { return p[0] > cx2 + hw2 * 0.55; }).concat([[cx2 + hw2 * 0.6, s.yf]])); }
    var mw = s.w * 0.16;
    bo.h += n13_P(n13_blob(s.x - s.w / 2 - mw * 0.1, s.yf + 1, mw, (s.yr - s.yb) * 0.32 + 1.5, rnd, 9, 0.35)) + n13_P(n13_blob(s.x + s.w / 2 + mw * 0.1, s.yr - 1, mw * 0.9, (s.yr - s.yf) * 0.7 + 1.5, rnd, 9, 0.35));
    for (var lq = 0; lq < 2; lq++) if (rnd() < 0.6) bo.lv += n13_dot(s.x + (rnd() - 0.5) * s.w * 0.7, s.yb + (s.yf - s.yb) * (0.3 + rnd() * 0.5)); });
  var lk = Math.round(ns * 0.4), ls0 = steps[lk], lh = (ph ? 82 : 128) * S * (ph ? 1.25 : 1), lxp = ph ? ls0.x - ls0.w / 2 - lh * 0.32 : ls0.x + ls0.w / 2 + lh * 0.45, lyp = ls0.yr + 3;
  var LW = n13_lantern(bo, lxp, lyp, lh);
  var nearSteps = function (x, y, pad) { for (var q = 0; q < steps.length; q++) { var s = steps[q]; if (y > s.yb - pad && y < s.yr + pad && Math.abs(x - s.x) < s.w / 2 + pad) return true; } return Math.abs(x - lxp) < lh * 0.4 + pad && y > lyp - lh - pad && y < lyp + pad; };
  // moss patches on the banks (under every stone), kept off the water and the steps
  var bank = ''; spread(-20, H * 0.46, W + 40, H * 0.56, ph ? 60 : 90, ph ? 30 : 40, rnd, 1).forEach(function (c) { if (c.y < gTop(c.x) + 8 || c.q > 0.65) return; var r = (ph ? 16 : 24) * S * LS * (0.6 + c.r * 0.7) * (0.5 + (c.y - H * 0.46) / H * 2); if (inPool(c.x, c.y, r) || nearSteps(c.x, c.y, r)) return; bank += n13_P(n13_blob(c.x, c.y, r * 1.7, r * 0.55, rnd, 12, 0.22)); });
  add(mid, 'b', bank, dk ? '#1D2732' : '#525E37');
  // boulders: every fall is framed by a low boulder on each side, with more along the banks of each pool
  pools.forEach(function (p, q) { var s = Math.max(p.hw, 16);
    [-1, 1].forEach(function (sd) { var bx = p.cx + sd * p.hw * (0.98 + rnd() * 0.08), bw = s * (0.45 + rnd() * 0.25) + 10 * S, bh = bw * (0.42 + rnd() * 0.2); n13_boulder(bo, bx, p.cy + p.hd * (0.3 + rnd() * 0.4), bw, bh, rnd, 0.34, true);
      if (rnd() < 0.7) { var bx2 = p.cx + sd * p.hw * (0.7 + rnd() * 0.12), bw2 = s * 0.28 + 8 * S; n13_boulder(bo, bx2, p.yb + p.hd * 0.3, bw2, bw2 * 0.5, rnd, 0.3, true); } });
    var c = CUR[q + 1]; if (c) [-1, 1].forEach(function (sd) { var bw = c.w0 * (0.7 + rnd() * 0.3) + 12 * S, bx = c.x + sd * (c.w0 + bw * 0.32), fall = c.yb - c.yt, bh = Math.max(fall * 0.85 + bw * 0.14, bw * 0.42); n13_boulder(bo, bx, c.yb + 2, bw, bh, rnd, 0.3, true); });
    if (c && c.w0 > 26 * S) { var mw2 = c.w0 * 0.34 + 4 * S, mxp = c.x + (rnd() - 0.5) * c.w0 * 0.5; n13_boulder(bo, mxp, c.yb + 1, mw2, Math.max((c.yb - c.yt) * 0.9 + mw2 * 0.1, mw2 * 0.5), rnd, 0.3, true); } });
  [-1, 1].forEach(function (sd) { var bw = wfw * 2.4 + 10 * S; n13_boulder(bo, CUR[0].x + sd * (wfw + bw * 0.32), p0.yb + p0.hd * 0.75, bw, bw * 0.55, rnd, 0.32, true); });
  spread(0, H * 0.5, W, H * 0.5, ph ? 80 : 130, ph ? 70 : 80, rnd, 1).forEach(function (c) { if (c.q > 0.5 || c.y < gTop(c.x) + 14) return; var bw = (ph ? 20 : 30) * S * LS * (0.6 + c.r * 0.8) * (0.5 + (c.y - H * 0.5) / H * 2); if (inPool(c.x, c.y, bw * 0.6) || nearSteps(c.x, c.y, bw * 0.7)) return; n13_boulder(bo, c.x, c.y, bw, bw * (0.45 + c.k * 0.25), rnd, 0.36, false); });
  add(mid, 'f', bo.f, dk ? '#4A5068' : '#A29C8C'); add(mid, 'g', bo.g + cDark, dk ? 'rgba(4,6,18,0.4)' : 'rgba(40,34,26,0.3)'); add(mid, 'h', bo.h, dk ? '#22343A' : '#6E8A36');
  add(mid, 'e', cLite);
  var gl = ''; spread(0, H * 0.46, W, H * 0.54, 24, 20, rnd, 1).forEach(function (c) { if (c.q < 0.22 && c.y > gTop(c.x) + 3 && !inPool(c.x, c.y, 2) && !nearSteps(c.x, c.y, 2)) gl += n13_dot(c.x, c.y); });
  stk(mid, 't', gl + bo.lv, dk ? '#6A2A38' : '#D8582C', (ph ? 3 : 4) * S + 0.6);
  // ---------- the overhanging maples: one leaning in from each side, their limbs reaching over the ravine
  var tr = '', CL = [], o = {b: '', c: '', d: '', e: '', f: ''}, ls = (ph ? 5.4 : 6.6) * S * (ph ? 1.4 : 1);
  var trees = ph ? [{ctrl: [[0.05, 0.74], [0.0, 0.52], [0.04, 0.28], [0.1, 0.05], [0.06, -0.1]], w: 0.05, side: -1}, {ctrl: [[0.97, 0.66], [1.0, 0.45], [0.93, 0.22], [0.95, -0.1]], w: 0.045, side: 1}]
    : [{ctrl: [[0.065, 0.76], [0.03, 0.55], [0.045, 0.32], [0.1, 0.1], [0.08, -0.1]], w: 0.024, side: -1}, {ctrl: [[0.95, 0.64], [0.975, 0.44], [0.93, 0.2], [0.95, -0.1]], w: 0.021, side: 1}];
  var limbs = ph ? {'-1': [[0.4, 0.2, 0.06, 0.12], [0.3, 0.09, 0.02, 0.3], [0.2, 0.33, 0.1, 0.45], [0.45, 0.03, -0.02, 0.6]], '1': [[0.64, 0.17, 0.05, 0.2], [0.74, 0.06, 0.03, 0.42], [0.8, 0.32, 0.1, 0.08]]}
    : {'-1': [[0.4, 0.22, 0.05, 0.15], [0.3, 0.08, 0.02, 0.32], [0.22, 0.36, 0.1, 0.5], [0.46, 0.04, -0.02, 0.62], [0.18, 0.02, 0.0, 0.72]], '1': [[0.68, 0.2, 0.04, 0.18], [0.76, 0.06, 0.02, 0.4], [0.82, 0.36, 0.1, 0.1], [0.64, 0.05, -0.01, 0.55]]};
  trees.forEach(function (T) { var pts = n13_curve(T.ctrl.map(function (p) { return [W * p[0], H * p[1]]; }), 8), tw = W * T.w;
    tr += n13_band(pts, tw, tw * 0.45);
    var bx = pts[0][0], by = pts[0][1]; tr += n13_P([[bx - tw * 2.2, by + 6], [bx - tw * 1.1, by - tw * 0.6], [bx - tw, by - tw * 2], [bx + tw, by - tw * 2], [bx + tw * 1.2, by - tw * 0.5], [bx + tw * 2.4, by + 6]]);
    (limbs[T.side] || []).forEach(function (L) { var at = pts[Math.min(pts.length - 1, Math.round(L[3] * (pts.length - 1)))], ex = W * L[0], ey = H * L[1], lw = tw * (0.42 - L[3] * 0.18), lb = n13_limb(at[0], at[1], ex, ey, lw, lw * 0.22, -T.side * H * L[2]);
      tr += lb.d;
      for (var q = 2; q <= 8; q++) { var p = lb.pts[q], R = (ph ? 30 : 46) * S * LS * (0.55 + q / 8 * 0.6) * (0.85 + rnd() * 0.3);
        if (q % 3 === 0) { var tx = p[0] + (rnd() - 0.4) * R * 1.2, ty = p[1] + (rnd() - 0.2) * R * 0.8; tr += n13_limb(p[0], p[1], tx, ty, lw * 0.3 + 0.8, 0.6, 3).d; CL.push([tx, ty, R * 0.8, rnd()]); }
        CL.push([p[0] + (rnd() - 0.5) * R * 0.5, p[1] + (rnd() - 0.25) * R * 0.5, R, rnd()]); } });
    for (var q2 = 0; q2 < (ph ? 4 : 6); q2++) { var tp2 = pts[Math.round(pts.length * (0.6 + q2 * 0.07))] || pts[pts.length - 1], R2 = (ph ? 40 : 60) * S * LS * (0.8 + rnd() * 0.4); CL.push([tp2[0] + (rnd() - 0.5) * R2 * 1.6 - T.side * R2 * 0.5, tp2[1] + (rnd() - 0.5) * R2, R2, rnd()]); } });
  CL.forEach(function (c) { var d = Math.hypot(c[0] - mx, c[1] - my), lim = mr * (dk ? 0.5 : 1.5) + c[2] * 0.8; if (d < lim) { var f = lim / Math.max(1, d); c[0] = mx + (c[0] - mx) * f; c[1] = my + (c[1] - my) * f; } });
  CL.sort(function (p, q) { return p[2] - q[2]; }).forEach(function (c) { n13_cluster(o, c[0], c[1], c[2], ls, rnd, c[3] * 0.75 + (c[1] < H * 0.1 ? 0.12 : 0)); });
  // hanging sprays at the canopy's lower edge (the engine sways them)
  var sprays = [], SPR = ph ? [[0.3, 0.26], [0.53, 0.07], [0.7, 0.29]] : [[0.27, 0.3], [0.41, 0.26], [0.535, 0.07], [0.7, 0.29], [0.81, 0.4]];
  SPR.forEach(function (q) { var ax = W * q[0], ay = H * q[1], best = null; CL.forEach(function (c) { if (Math.abs(c[0] - ax) < W * 0.07 && c[1] < H * 0.45 && (!best || c[1] + c[2] > best[1] + best[2])) best = c; });
    if (best) { ax = best[0] + (ax - best[0]) * 0.3; ay = best[1] + best[2] * 0.5; } else return;
    var ax2 = 0, len = (ph ? 64 : 96) * S * LS * (0.8 + rnd() * 0.4), lean = (ax < W * 0.5 ? 1 : -1) * 0.22, lv = [];
    for (i = 0; i < 14; i++) { var uu = (i + 1) / 14, px = Math.sin(uu * 1.6) * len * lean, py = uu * len, sd = i % 2 ? 1 : -1; lv.push([px + sd * ls * (0.7 + rnd() * 0.5), py + (rnd() - 0.5) * ls * 0.5, ls * (1.35 - uu * 0.35) * (0.9 + rnd() * 0.25), sd * (20 + rnd() * 30), Math.min(3, Math.floor(rnd() * 2.2 + uu * 2))]); }
    sprays.push({x: ax, y: ay, len: len, lean: lean, lv: lv, ph: rnd() * 6.28}); });
  // foreground: a mossy bank at the lower left with ferns, fallen leaves and the far-right ferns
  var fgTop = function (x) { return H * (ph ? 0.91 : 0.87) + Math.pow(Math.max(0, x / W), 1.5) * H * 0.45 + Math.sin(x / 40) * 4 * S; }, fgw = W * (ph ? 0.38 : 0.3);
  var fgPts = n13_fn(-60, fgw, 6, fgTop), fgd = n13_P(fgPts.concat([[fgw, H + 40], [-60, H + 40]])), fgm = n13_P(fgPts.map(function (p) { return [p[0], p[1] - 1]; }).concat(fgPts.slice().reverse().map(function (p) { return [p[0], p[1] + (5 + 3 * Math.sin(p[0] / 13)) * S * LS]; })));
  var fernD = '', fern = function (x0, y0, L, ang) { var d = '', n = 10; for (var q = 0; q < n; q++) { var uu = q / n, cx2 = x0 + Math.cos(ang) * L * uu, cy2 = y0 + Math.sin(ang) * L * uu + uu * uu * L * 0.28, lw = L * 0.24 * (1 - uu * 0.8) + 2, a = Math.atan2(Math.sin(ang) * L + uu * 2 * L * 0.28, Math.cos(ang) * L) * 180 / Math.PI;
      d += n13_P(rotp([[0, 0], [lw * 0.5, -lw * 0.2], [lw, -lw * 0.05], [lw * 0.5, lw * 0.14]], cx2, cy2, a - 60)) + n13_P(rotp([[0, 0], [lw * 0.5, -lw * 0.14], [lw, lw * 0.05], [lw * 0.5, lw * 0.2]], cx2, cy2, a + 60)); }
    return d + n13_band(n13_fn(0, 1, 0.1, function (u) { return u; }).map(function (p) { var uu = p[0]; return [x0 + Math.cos(ang) * L * uu, y0 + Math.sin(ang) * L * uu + uu * uu * L * 0.28]; }), 1.1 * S + 0.6, 0.4); };
  var ferns = ph ? [[0.27, 0.975], [0.93, 0.99], [0.06, 0.93]] : [[0.24, 0.975], [0.31, 0.995], [0.975, 0.97], [0.64, 1.01], [0.04, 0.92]];
  ferns.forEach(function (f) { var L = (ph ? 50 : 76) * S * LS; for (var q = 0; q < 5; q++) fernD += fern(W * f[0] + (q - 2) * 5, H * f[1], L * (0.7 + rnd() * 0.4), -Math.PI / 2 + (q - 2) * 0.42); });
  spread(0, H * 0.84, fgw, H * 0.16, 15, 10, rnd, 1).forEach(function (c) { if (c.y > fgTop(c.x) + 5 && c.q < 0.42) { var key = c.r < 0.4 ? 'c' : c.r < 0.7 ? 'd' : c.r < 0.9 ? 'e' : 'f'; o[key] += n13_mleaf(c.x, c.y, ls * 1.15, (c.k - 0.5) * 300, 7, true); } });
  if (!ANIM) sprays.forEach(function (s) { tr += n13_band(n13_fn(0, 1, 0.125, function (u) { return u; }).map(function (p) { var uu = p[0]; return [s.x + Math.sin(uu * 1.6) * s.len * s.lean, s.y + uu * s.len]; }), 1.4 * S + 0.6, 0.5);
    s.lv.forEach(function (l) { o[['c', 'd', 'e', 'f'][l[4]]] += n13_mleaf(s.x + l[0], s.y + l[1], l[2], l[3], 7, true); }); });
  add(near, 'a', tr, dk ? '#140E14' : '#3E2C26');
  add(near, 'b', o.b, dk ? '#33101A' : '#9A2420'); add(near, 'c', o.c, dk ? '#4A1220' : '#C02A26'); add(near, 'd', o.d, dk ? '#5E1A24' : '#DE4A2A'); add(near, 'e', o.e, dk ? '#702626' : '#F08632'); add(near, 'f', o.f, dk ? '#82402E' : '#F6BE44');
  add(near, 'g', fgd, dk ? '#1A1E2C' : '#3A3C2A'); add(near, 'h', fgm + fernD, dk ? '#1C3034' : '#5E7E30');
  if (ANIM) { ANIM.pools = pools.map(function (p) { return {cx: p.cx, cy: p.cy, hw: p.hw, hd: p.hd, yb: p.yb, yf: p.yf, d: n13_P(p.pts)}; }); ANIM.cur = CUR; ANIM.sprays = sprays; ANIM.moon = [mx, my, mr]; ANIM.lan = LW; ANIM.vy = vy; ANIM.vx = vx; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ls = ls;
    ANIM.cl = CL.filter(function (c) { return c[1] < H * 0.45; }).map(function (c) { return [c[0], c[1], c[2]]; }); ANIM.gTop = H * (ph ? 0.46 : 0.47); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Aspen Gold: a Rocky Mountain hillside grove of white aspens, golden leaves, dark spruces and a blue ridge beyond
// an aspen: slim white trunk, a narrow crown of round golden leaves. o.t trunk, o.sh shade, o.mk dark marks (a STROKE path: eye
// marks, chevrons, lenticels and the rough dark base), o.cd crown dark, o.cg gold, o.cl light. glints collects leaf spots.
function n13_aspen(o, x, by, h, rnd, ls, glints, lean) { var tw = h * 0.021 + 1, pts = [], i;
  for (i = 0; i <= 8; i++) { var u = i / 8; pts.push([x + lean * h * u * u + Math.sin(u * 5 + x) * tw * 0.25, by - h * u]); }
  o.t += n13_band(pts, tw, tw * 0.45);
  o.sh += n13_band(pts.map(function (p, j) { return [p[0] + tw * (1 - j / 8 * 0.55) * 0.3, p[1]]; }), tw * 0.55, tw * 0.22);
  var at = function (u) { var j = Math.min(7, Math.floor(u * 8)), f = u * 8 - j; return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]; };
  for (i = 0; i < 3; i++) { var cxb = x + (i - 1) * tw * 0.55 + (rnd() - 0.5) * tw * 0.2, lb = h * (0.03 + rnd() * 0.05); o.mk += 'M' + PT(cxb, by) + ' L' + PT(cxb + (rnd() - 0.5) * tw * 0.3, by - lb * 0.5) + ' L' + PT(cxb + (rnd() - 0.5) * tw * 0.2, by - lb) + ' '; }
  var ne = Math.max(1, Math.round(h / 140 + rnd())); for (i = 0; i < ne; i++) { var p = at(0.16 + rnd() * 0.4), wl = tw * (0.45 + rnd() * 0.35), hh = Math.max(1.2, tw * 0.4), cx = p[0] + (rnd() - 0.5) * tw * 0.4;
    o.mk += 'M' + PT(cx - wl, p[1]) + ' Q' + PT(cx, p[1] - hh) + ' ' + PT(cx + wl, p[1]) + ' ';
    if (rnd() < 0.06) o.mk += 'M' + PT(cx - wl * 0.9, p[1] - hh * 2.2) + ' Q' + PT(cx, p[1] - hh * 3.6) + ' ' + PT(cx + wl * 0.9, p[1] - hh * 2.2) + ' '; }
  // the narrow crown: upswept branches under a tall cloud of round leaves, lit from the upper right (where the sun is)
  var c = at(0.84), ch = h * 0.44, cw = h * 0.13 + 6, cy = c[1] + ch * 0.04;
  for (i = 0; i < 4; i++) { var bp = at(0.56 + i * 0.07), sd = i % 2 ? 1 : -1; o.t += n13_limb(bp[0], bp[1], bp[0] + sd * cw * (0.5 + rnd() * 0.3), bp[1] - ch * 0.25, tw * 0.3, 0.6, sd * 3).d; }
  for (i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2, rr = 0.5 + rnd() * 0.2; o.cd += n13_C(c[0] + Math.cos(a) * cw * 0.55 * rr, cy + Math.sin(a) * ch * 0.4 * rr, cw * (0.36 + rnd() * 0.12)); }
  var N = Math.min(280, Math.round(cw * ch / (ls * ls) * 1.0));
  for (i = 0; i < N; i++) { var a2 = rnd() * Math.PI * 2, r2 = Math.pow(rnd(), 0.45), lx2 = c[0] + Math.cos(a2) * cw * r2, ly2 = cy + Math.sin(a2) * ch * 0.52 * r2, lit = ((lx2 - c[0]) / cw * 0.5 + (cy - ly2) / ch) + (rnd() - 0.5) * 0.9, s = ls * (0.75 + rnd() * 0.5), d = n13_RE(lx2, ly2, s, s * 0.82, rnd() * 180);
    if (lit < -0.3) o.cd += d; else if (lit < 0.35) o.cg += d; else o.cl += d;
    if (glints && rnd() < 0.2) glints.push([lx2, ly2, s]); }
  return {x: c[0], y: cy, w: cw, h: ch}; }
// a blue spruce: a narrow spire of drooping tiers
function n13_spruce(x, by, h) { var d = '', n = Math.max(6, Math.round(h / 16)), i; for (i = 0; i < n; i++) { var u0 = i / n, u1 = Math.min(1, (i + 1.6) / n), y0 = by - h + h * u0, y1 = by - h + h * u1 - h * 0.02, w = h * 0.2 * Math.pow(u1, 0.9) + 2;
    d += n13_P([[x, y0], [x + w * 0.35, y0 + (y1 - y0) * 0.4], [x + w, y1], [x + w * 0.6, y1 - (y1 - y0) * 0.1], [x + w * 0.3, y1 + 1], [x, y1 - (y1 - y0) * 0.08], [x - w * 0.3, y1 + 1], [x - w * 0.6, y1 - (y1 - y0) * 0.1], [x - w, y1], [x - w * 0.35, y0 + (y1 - y0) * 0.4]]); }
  return d + n13_P([[x - h * 0.012 - 1, by + 2], [x + h * 0.012 + 1, by + 2], [x + h * 0.01, by - h * 0.1], [x - h * 0.01, by - h * 0.1]]); }
// a snowy blue mountain range: body, snow caps with streaks down each peak's gullies, shaded right faces
function n13_range(W, base, y0, dy, np, rnd) { var pk = [], m, i, k; for (i = 0; i <= np; i++) pk.push([W * (i / np) + (rnd() - 0.5) * W / np * 0.5, y0 + rnd() * dy]);
  m = [[-120, base - (base - pk[0][1]) * 0.4]];
  for (i = 0; i < pk.length; i++) { m.push(pk[i]); var nx = i < pk.length - 1 ? pk[i + 1] : [W + 140, base - (base - pk[i][1]) * 0.3], lo = Math.max(pk[i][1], nx[1]); m.push([(pk[i][0] + nx[0]) / 2 + (rnd() - 0.5) * 24, lo + (base - lo) * (0.25 + rnd() * 0.25)]); }
  var sn = '', sh = '';
  for (i = 1; i < m.length - 1; i += 2) { var p = m[i], sl = m[i - 1], sr = m[i + 1];
    sh += n13_P([p, sr, [sr[0] - (sr[0] - p[0]) * 0.3, sr[1] + (base - sr[1]) * 0.55], [p[0] + (sr[0] - p[0]) * 0.35, base + 60], [p[0] + (sr[0] - p[0]) * 0.1, base + 60]]);
    var fr = 0.2 + rnd() * 0.1, A1 = [p[0] + (sr[0] - p[0]) * fr, p[1] + (sr[1] - p[1]) * fr], B1 = [p[0] + (sl[0] - p[0]) * fr, p[1] + (sl[1] - p[1]) * fr], pts = [p, A1];
    for (k = 1; k < 7; k++) { var u = k / 7; pts.push([A1[0] + (B1[0] - A1[0]) * u, A1[1] + (B1[1] - A1[1]) * u + (k % 2 ? -0.3 : 0.9) * (A1[1] - p[1]) * 0.6]); } pts.push(B1); sn += n13_P(pts);
  }
  return {body: n13_P(m.concat([[W + 140, base + 60], [-120, base + 60]])), snow: sn, shade: sh, pts: m}; }

SCENES.aspens = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.2), refl = Lay(0.2), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, x;
  var LS = ph ? 1.35 : 1;
  var sky = dk ? 'linear-gradient(180deg,#050920 0%,#0E163A 32%,#1C2856 62%,#2C3866 100%)' : 'linear-gradient(180deg,#2C74C4 0%,#5A9ADA 30%,#A4CAEA 58%,#E2ECEC 80%,#E2ECEC 100%)';
  var hz = H * (ph ? 0.4 : 0.42);
  // sun or moon over the open side of the valley; stars and a faint Milky Way at night, small fair-weather clouds by day
  var sx = W * (ph ? 0.7 : 0.74), sy = H * (ph ? 0.15 : 0.13), sr = dk ? (ph ? 18 : 26) : (ph ? 22 : 32);
  if (dk) { var mw = '', st = ''; for (i = 0; i <= 30; i++) { var u = i / 30; mw += n13_RE(W * (0.05 + u * 0.95), hz * (0.9 - u * 0.75) + Math.sin(u * 7) * 10, W * 0.08, H * 0.04, -28); }
    add(far, 'a', mw, 'rgba(150,160,255,0.06)');
    spread(0, 0, W, hz, 20, 20, rnd, 1).forEach(function (c) { if (c.q < 0.45 && Math.hypot(c.x - sx, c.y - sy) > sr * 2.5) st += n13_C(c.x, c.y, 0.35 + c.r * 1.05); });
    add(far, 'b', st, 'rgba(255,250,240,0.88)'); add(far, 'c', n13_C(sx, sy, sr * 3), 'rgba(210,220,255,0.1)'); add(far, 'd', 'M' + PT(sx, sy - sr) + ' A' + n1(sr) + ' ' + n1(sr) + ' 0 1 1 ' + PT(sx, sy + sr) + ' A' + n1(sr * 0.6) + ' ' + n1(sr) + ' 0 1 0 ' + PT(sx, sy - sr) + ' Z ', '#FBF4DC'); }
  else { add(far, 'a', n13_C(sx, sy, sr * 3.2), 'rgba(255,250,230,0.25)'); add(far, 'b', n13_C(sx, sy, sr * 1.7), 'rgba(255,252,236,0.5)'); add(far, 'd', n13_C(sx, sy, sr), '#FFFDF2');
    var cb = '', cs = ''; (ph ? [[0.22, 0.12, 0.9], [0.45, 0.27, 0.6]] : [[0.18, 0.12, 1], [0.45, 0.22, 0.8], [0.58, 0.08, 0.6], [0.92, 0.28, 0.7]]).forEach(function (q) { var x0 = W * q[0], y0 = H * q[1], s = q[2] * S * (ph ? 1.3 : 1);
      [[0, 0, 34], [-30, 6, 24], [30, 5, 26], [-56, 12, 15], [58, 12, 16], [12, -14, 22]].forEach(function (b) { cb += n13_C(x0 + b[0] * s, y0 + b[1] * s, b[2] * s); }); cs += n13_E(x0, y0 + 20 * s, 74 * s, 9 * s); });
    add(far, 'c', cb, 'rgba(255,255,255,0.94)'); add(far, 'e', cs, 'rgba(196,214,236,0.9)'); }
  // the blue ridge beyond: a pale far range and a nearer, bluer one, both dusted with early snow
  var m1 = n13_range(W, hz + 20, H * (ph ? 0.21 : 0.17), H * 0.08, ph ? 3 : 6, rnd), m2 = n13_range(W, hz + 30, H * (ph ? 0.28 : 0.27), H * 0.06, ph ? 4 : 8, rnd);
  add(far, 'f', m1.body, dk ? '#2E3A68' : '#9CB4DA'); add(far, 'g', m1.snow, dk ? '#9AA6D0' : '#F4F8FC'); add(far, 'h', m1.shade + m2.shade, dk ? 'rgba(8,12,40,0.3)' : 'rgba(60,90,150,0.2)');
  add(refl, 'a', m2.body, dk ? '#25305A' : '#7090C2'); add(refl, 'b', m2.snow, dk ? '#7E8ABA' : '#E6EEF8');
  // forested foothills: dark spruce with drifts of gold where the aspen stands are
  var h1 = n13_fn(-60, W + 60, 8, function (x) { return hz + H * 0.06 + Math.sin(x / (ph ? 70 : 140) + 0.4) * H * 0.02 + Math.sin(x / 47) * H * 0.006; });
  add(refl, 'c', below(h1, H + 40), dk ? '#16243A' : '#3A5C56');
  var spk = ''; for (x = -20; x < W + 20; x += (ph ? 4 : 6) * (0.6 + rnd() * 0.8)) { var yy = n13_yOn(h1, x) + 3, sh2 = (ph ? 9 : 14) * S * LS * (0.5 + rnd() * 0.8); spk += n13_P([[x, yy - sh2], [x + sh2 * 0.22, yy - sh2 * 0.3], [x + sh2 * 0.3, yy + 2], [x - sh2 * 0.3, yy + 2], [x - sh2 * 0.22, yy - sh2 * 0.3]]); }
  add(refl, 'd', spk, dk ? '#122030' : '#2C4A44');
  var gd = '', gl = '', patches = []; for (i = 0; i < (ph ? 4 : 7); i++) patches.push([W * (i + 0.2 + rnd() * 0.6) / (ph ? 4 : 7), 0.6 + rnd() * 0.8]);
  patches.forEach(function (p) { var pw = (ph ? 50 : 90) * p[1] * S * LS, n = Math.round(pw * 0.7); for (var j = 0; j < n; j++) { var a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()), xx = p[0] + Math.cos(a) * pw * rr, yb = n13_yOn(h1, xx), yy2 = yb + 4 + rnd() * H * 0.05, r = (ph ? 3 : 4.2) * S * LS * (0.7 + rnd() * 0.6);
      gd += n13_C(xx, yy2, r) + n13_C(xx + r * 0.8, yy2 + r * 0.3, r * 0.8); if (rnd() < 0.4) gl += n13_C(xx + r * 0.3, yy2 - r * 0.4, r * 0.55); } });
  add(refl, 'e', gd, dk ? '#4A4430' : '#D49E28'); add(refl, 'f', gl, dk ? '#5E5636' : '#F2CA4A');
  // a far row of small aspens along the hillside's crest, behind the grove
  var gTop = function (x) { return H * (ph ? 0.53 : 0.535) + (x / W) * H * (ph ? 0.06 : 0.1) + Math.sin(x / (ph ? 60 : 110) + 1) * H * 0.012; };
  var fa = {t: '', sh: '', mk: '', cd: '', cg: '', cl: ''};
  for (i = 0; i < (ph ? 7 : 13); i++) { var fx = W * (ph ? 0.02 + i * 0.14 : 0.01 + i * 0.048) + (rnd() - 0.5) * 16; n13_aspen(fa, fx, gTop(fx) + 3, H * (0.15 + rnd() * 0.06), rnd, (ph ? 2.2 : 2.6) * S * LS, null, (rnd() - 0.5) * 0.04); }
  add(refl, 'g', fa.t, dk ? '#8A92AE' : '#E4E0D4'); add(refl, 'h', fa.cd + fa.cg + fa.cl, dk ? '#5A5034' : '#DCA42C');
  // the hillside meadow the grove stands on
  var ground = n13_fn(-60, W + 60, 8, gTop);
  add(mid, 'a', below(ground, H + 40), dk ? '#2C3048' : '#C2A44A');
  var bands = ''; [0.1, 0.28, 0.52, 0.78].forEach(function (fr, j) { var th = (6 + j * 7) * S, top = n13_fn(-60, W + 60, 10, function (x) { var g = gTop(x); return g + (H - g) * fr + Math.sin(x / (80 + j * 50) + j * 2) * (4 + j * 3) * S; }); bands += n13_P(top.concat(top.slice().reverse().map(function (p) { return [p[0], p[1] + th * (0.55 + 0.45 * Math.sin(p[0] / 70 + j))]; }))); });
  add(mid, 'b', bands, dk ? 'rgba(160,170,220,0.1)' : 'rgba(250,224,130,0.5)');
  // the grove: aspens at several depths across the hillside, a few dark spruces among them
  var o = {t: '', sh: '', mk: '', cd: '', cg: '', cl: ''}, GL = [], crowns = [], spr = '', ls = (ph ? 3.6 : 4.4) * S * LS;
  var tlist = [], nT = ph ? 11 : 19; for (i = 0; i < nT; i++) tlist.push({x: ph ? W * (-0.04 + (i + rnd() * 0.8) / nT * 1.08) : W * (Math.pow((i + rnd()) / nT, 1.2) * 0.66 - 0.02), d: rnd()});
  tlist.sort(function (a, b) { return a.d - b.d; });
  (ph ? [0.32, 0.66] : [0.17, 0.42, 0.6, 0.86]).forEach(function (f) { var xx = W * f, by = gTop(xx) + H * 0.035, hh = H * (ph ? 0.26 : 0.32) * (0.8 + rnd() * 0.4); spr += n13_spruce(xx, by, hh); });
  tlist.forEach(function (T) { var by = gTop(T.x) + H * (0.01 + T.d * T.d * 0.2), hh = H * (0.38 + T.d * 0.36) * (0.9 + rnd() * 0.2), tw2 = hh * 0.021 + 1; o.sh += n13_P([[T.x - tw2, by + 1], [T.x + tw2, by + 1], [T.x - hh * 0.2 + tw2 * 2, by + hh * 0.07], [T.x - hh * 0.2 - tw2 * 0.5, by + hh * 0.07]]); crowns.push(n13_aspen(o, T.x, by, hh, rnd, ls * (0.85 + T.d * 0.3), GL, (rnd() - 0.5) * 0.05)); });
  add(mid, 'c', spr, dk ? '#101C26' : '#26443A'); add(mid, 'd', o.t, dk ? '#BCC4DA' : '#EDEDDE'); add(mid, 'e', o.sh, dk ? 'rgba(20,26,60,0.42)' : 'rgba(120,112,96,0.28)');
  add(mid, 'f', o.cd, dk ? '#4A3E22' : '#B87C14'); add(mid, 'g', o.cg, dk ? '#8A7A3E' : '#E8B020'); add(mid, 'h', o.cl, dk ? '#C4B272' : '#FAD85A');
  stk(mid, 's', o.mk, dk ? '#22242F' : '#2E2A28', 1.9 * S + 0.6);
  var bl = ''; spread(0, H * 0.5, W, H * 0.5, 10, 9, rnd, 1).forEach(function (c) { var g = gTop(c.x); if (c.y > g + 6 && c.q < 0.35) { var hh = (4 + (c.y - g) / H * 30) * S * LS, b = (c.r - 0.5) * hh * 0.6; bl += 'M' + PT(c.x, c.y) + ' q' + n1(b * 0.3) + ' ' + n1(-hh * 0.6) + ' ' + n1(b) + ' ' + n1(-hh) + ' '; } });
  stk(mid, 't', bl, dk ? 'rgba(170,170,200,0.3)' : 'rgba(236,206,110,0.9)', 1.2 * S + 0.5);
  // foreground: big trunks framing the view, their crowns along the top edge, red-leaved shrubs and a golden grass bank
  var nr = {t: '', sh: '', mk: '', ln: '', cd: '', cg: '', cl: ''}, NG = [], fgT = ph ? [[0.05, 0.06], [0.96, 0.05]] : [[0.035, 0.034], [0.15, 0.022], [0.93, 0.03]];
  var fgTop = function (x) { return H * (ph ? 0.92 : 0.9) + Math.sin(x / (ph ? 50 : 90) + 0.5) * H * 0.015 + Math.sin(x / 23) * 2; };
  fgT.forEach(function (q, j) { var xx = W * q[0], tw = W * q[1], pts = [], by = fgTop(xx) + 6;
    for (i = 0; i <= 8; i++) { var u = i / 8; pts.push([xx + Math.sin(u * 2.2 + j) * tw * 0.4, by - (by + 40) * u]); }
    nr.t += n13_band(pts, tw, tw * 0.75); nr.sh += n13_band(pts.map(function (p) { return [p[0] + tw * 0.45, p[1]]; }), tw * 0.5, tw * 0.38);
    var bse = [[xx + tw * 1.05, by + 4], [xx - tw * 1.05, by + 4]]; for (k = 0; k <= 8; k++) { var uu = k / 8; bse.push([xx - tw * 1.02 + tw * 2.04 * uu, by - H * (0.05 + 0.025 * Math.sin(uu * 7 + j) + 0.015 * Math.sin(uu * 17)) - (k % 2) * tw * 0.25]); } nr.mk += n13_P(bse);
    for (k = 0; k < 3; k++) { var p = pts[Math.min(8, Math.round((0.25 + k * 0.2 + rnd() * 0.08) * 8))], cx = p[0] + (rnd() - 0.5) * tw * 0.5, wl = tw * (0.4 + rnd() * 0.35), hh2 = tw * 0.22 + 1;
      var eye = []; for (var e2 = 0; e2 <= 10; e2++) { var ue = e2 / 10 * 2 - 1; eye.push([cx + ue * wl, p[1] - hh2 * 0.9 * (1 - ue * ue) + hh2 * 0.25 * ue * ue]); } for (e2 = 9; e2 >= 1; e2--) { var ue2 = e2 / 10 * 2 - 1; eye.push([cx + ue2 * wl * 0.8, p[1] + hh2 * 0.5 * (1 - ue2 * ue2)]); } nr.mk += n13_P(eye);
    }
  });
  // the near crowns: golden leaf masses hanging into the top corners
  var corners = ph ? [[0.0, 0.02, 0.34], [1.0, 0.03, 0.32]] : [[0.0, 0.02, 0.24], [0.17, -0.02, 0.17], [0.95, 0.02, 0.2]], nls = ls * 1.7;
  corners.forEach(function (q) { var cx = W * q[0], cy = H * q[1], R = W * q[2], sd = cx < W / 2 ? 1 : -1;
    for (k = 0; k < 7; k++) { var a = Math.PI * (0.1 + k / 6 * 0.8), bx = cx + Math.cos(a) * R * 0.6 * sd * (0.5 + rnd() * 0.5) + sd * R * 0.15, byy = cy + Math.sin(a) * R * 0.45 * (0.6 + rnd() * 0.5), br = R * (0.22 + rnd() * 0.1);
      nr.cd += n13_C(bx, byy, br * 0.72); var N = Math.round(br * br / (nls * nls) * 1.5);
      for (var j = 0; j < N; j++) { var a2 = rnd() * Math.PI * 2, rr = Math.pow(rnd(), 0.45), lx = bx + Math.cos(a2) * br * rr, ly = byy + Math.sin(a2) * br * 0.85 * rr, lit = (byy - ly) / br + (rnd() - 0.5) * 0.9, s = nls * (0.75 + rnd() * 0.5), d = n13_RE(lx, ly, s, s * 0.82, rnd() * 180);
        if (lit < -0.3) nr.cd += d; else if (lit < 0.35) nr.cg += d; else nr.cl += d; if (rnd() < 0.16) NG.push([lx, ly, s]); } } });
  var shrub = '', shrubL = ''; (ph ? [[0.3, 0.95], [0.72, 0.94]] : [[0.24, 0.92], [0.45, 0.95], [0.68, 0.92], [0.82, 0.95]]).forEach(function (q) { var x0 = W * q[0], y0 = fgTop(W * q[0]) + 6, s = (ph ? 26 : 40) * S * LS;
    for (k = 0; k < 12; k++) { var a = Math.PI * (1.05 + rnd() * 0.9), rr = s * (0.3 + rnd() * 0.7), r = s * (0.22 + rnd() * 0.14), lx = x0 + Math.cos(a) * rr * 1.4, ly = y0 + Math.sin(a) * rr * 0.7; shrub += n13_C(lx, ly, r); if (rnd() < 0.5) shrubL += n13_C(lx + r * 0.25, ly - r * 0.3, r * 0.55); } });
  var fg = n13_fn(-60, W + 60, 8, fgTop), gr = [], grs = '';
  for (x = -10; x < W + 10; x += (ph ? 5 : 7)) gr.push({x: x + rnd() * 4, h: (ph ? 44 : 66) * S * LS * (0.5 + rnd() * 0.8), c: rnd() < 0.5, ph: rnd() * 6.28, lean: (rnd() - 0.5) * 0.6});
  if (!ANIM) gr.forEach(function (g) { var b = g.lean * g.h; grs += 'M' + PT(g.x, H + 4) + ' q' + n1(b * 0.3) + ' ' + n1(-g.h * 0.6) + ' ' + n1(b) + ' ' + n1(-g.h) + ' '; });
  var fl = ''; spread(0, H * 0.88, W, H * 0.12, 12, 8, rnd, 1).forEach(function (c) { if (c.y > fgTop(c.x) + 4 && c.q < 0.22) fl += n13_dot(c.x, c.y); });
  add(near, 'a', nr.t, dk ? '#C8D0E6' : '#EFEFE2'); add(near, 'b', nr.sh, dk ? 'rgba(20,26,60,0.45)' : 'rgba(120,112,96,0.3)'); add(near, 'c', nr.mk, dk ? '#1A1C28' : '#2E2A26');
  add(near, 'd', nr.cd, dk ? '#4A3E22' : '#B87C14'); add(near, 'e', nr.cg, dk ? '#8A7A3E' : '#E8B020'); add(near, 'f', nr.cl, dk ? '#C4B272' : '#FAD85A');
  add(near, 'g', shrub, dk ? '#4A2030' : '#C4442C'); add(near, 'h', below(fg, H + 40) , dk ? '#242838' : '#B0923C');
  stk(near, 's', fl, dk ? '#8A7A3E' : '#F0BC2A', nls * 1.1); stk(near, 't', grs, dk ? '#4A4E66' : '#D8B856', 2.4 * S + 0.6);
  if (ANIM) { ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.GL = GL; ANIM.NG = NG; ANIM.gr = gr; ANIM.sun = [sx, sy, sr]; ANIM.crowns = crowns; ANIM.ls = ls; ANIM.gy = gTop(W * 0.5); ANIM.h1 = hz + H * 0.06; ANIM.peak = H * (ph ? 0.2 : 0.16); ANIM.fl = fl; ANIM.shrubL = shrubL; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
