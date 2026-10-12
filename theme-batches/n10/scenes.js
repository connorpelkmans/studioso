// ---- batch n10: icecave (Blue Ice Cave)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes);
// n10_H winds the other way on purpose, to cut the cave mouth out of a wall band.
function n10_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n10_P(pts) { return poly(n10_cw(pts)); }
function n10_H(pts) { return poly(n10_cw(pts).slice().reverse()); }
function n10_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n10_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n10_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n10_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// closed Catmull-Rom smoothing of a point loop
function n10_smooth(p, n) { var o = [], L = p.length; for (var i = 0; i < L; i++) { var a = p[(i - 1 + L) % L], b = p[i], c = p[(i + 1) % L], d = p[(i + 2) % L]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } return o; }
// an irregular closed outline around an ellipse
function n10_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 12; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return n10_smooth(p, 3); }
function n10_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// a crescent: the +x half of an ellipse minus a thinner one, turned to ang (degrees)
function n10_lune(cx, cy, rx, ry, ang, k) { var p = [], i; for (i = 0; i <= 8; i++) { var t = -Math.PI / 2 + Math.PI * i / 8; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } for (i = 7; i >= 1; i--) { var u = -Math.PI / 2 + Math.PI * i / 8; p.push([rx * k * Math.cos(u), ry * Math.sin(u)]); } return n10_P(rotp(p, cx, cy, ang)); }
// a hanging icicle from (x,y): a wavy taper to a point, plus its thin lit streak
function n10_icicle(x, y, L, w, rnd, lean) { var l = [], r = [], n = 6, ln = lean || 0; for (var i = 0; i <= n; i++) { var u = i / n, ww = w * Math.pow(1 - u, 0.85) * (1 + (i % 2 ? 0.12 : -0.06) * (1 - u)), xx = x + ln * L * u * u; l.push([xx - ww, y + L * u]); r.unshift([xx + ww * 0.92, y + L * u]); }
  l[n] = [x + ln * L, y + L]; r.shift();
  var body = n10_P([[x - w * 1.1, y - 4]].concat(l, r, [[x + w * 1.05, y - 4]]));
  var st = n10_P([[x - w * 0.55, y + L * 0.04], [x - w * 0.2, y + L * 0.04], [x - w * 0.12 + ln * L * 0.36, y + L * 0.6], [x - w * 0.2 + ln * L * 0.3, y + L * 0.58]]);
  return {d: body, st: st, tip: [x + ln * L, y + L]}; }
// a slender spire conifer (lodgepole style: a straight trunk, the crown high and narrow)
function n10_spire(x, y, h, w, rnd) { var p = [[x, y - h]], n = 7, i; for (i = 1; i <= n; i++) { var u = i / n, ww = w * (0.25 + 0.75 * u) * (i % 2 ? 1 : 0.62); p.push([x + ww, y - h + h * 0.86 * u]); } p.push([x + w * 0.12, y - h * 0.12], [x + w * 0.12, y], [x - w * 0.12, y], [x - w * 0.12, y - h * 0.12]); for (i = n; i >= 1; i--) { var v = i / n, w2 = w * (0.25 + 0.75 * v) * (i % 2 ? 1 : 0.62) * (0.9 + rnd() * 0.2); p.push([x - w2, y - h + h * 0.86 * v]); } return n10_P(p); }

// =============== 1. Blue Ice Cave: inside a glacier ice cave, scalloped turquoise walls glowing with outside light, icicles,
// a frozen meltwater floor, and a bright mouth at the far end with a snowy mountain view (night: indigo ice, an aurora outside)
// the cave's cross-section at depth s: the mouth outline scaled out from its centre, with its own wobble and scalloped cusps
function n10_ring(vx, vy, rx, ryU, ryL, s, rnd, amp, fl) { var p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28, p4 = rnd() * 6.28, m = 7 + Math.floor(rnd() * 5), pts = [], n = 96;
  for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), up = sn < 0, y0 = up ? sn : Math.pow(sn, 0.3), w = up ? 1 : Math.max(0.1, 1 - sn * 1.15);
    var f = 1 + amp * w * (0.5 * Math.sin(a * 3 + p1) + 0.3 * Math.sin(a * 5 + p2) + 0.2 * Math.sin(a * 9 + p3)) + amp * 0.7 * w * Math.abs(Math.sin(a * m + p4));
    pts.push([vx + c * rx * s * f * (up ? 1 : 1 - (1 - fl) * Math.pow(sn, 1.5)), vy + y0 * (up ? ryU : ryL) * s * f]); }
  return pts; }
SCENES.icecave = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 0.7 : 1), refl = Lay(0), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, j;
  var sky = dk ? 'linear-gradient(180deg,#070B26 0%,#0E1640 30%,#1A2A5C 52%,#2C3E74 70%,#3A4C80 100%)' : 'linear-gradient(180deg,#4F9CDA 0%,#7DBDEB 30%,#B8DDF5 52%,#E4F2FA 70%,#F6FAFD 100%)';
  // the mouth of the cave and its tunnel rings
  var ox = W * (ph ? 0.5 : 0.53), yF = H * (ph ? 0.6 : 0.62), rx = W * (ph ? 0.29 : 0.155), oh = H * (ph ? 0.23 : 0.33), ryU = oh * 0.6, ryL = oh * 0.4, vx = ox, vy = yF - ryL;
  var SC = [1, 1.17, 1.38, 1.64, 1.97, 2.42, 3.02, 3.9], rings = [];
  var FLR = ph ? 0.52 : 0.9;
  for (k = 0; k < SC.length; k++) rings.push(n10_ring(vx, vy, rx, ryU, ryL, SC[k], rnd, 0.035 + 0.01 * k, FLR));
  var open = rings[0], top0 = vy - ryU;
  // ---- the view outside (far layer, softly blurred): sky, sun or moon, mountains, a snowy slope with pines
  var sx = ox + rx * 0.42, sy = top0 + oh * 0.2, sr = (ph ? 13 : 19) * Math.max(0.8, S);
  var aur = '';
  if (dk) {
    // a faint standing aurora glow (the engine draws the moving curtains over it)
    for (j = 0; j < 2; j++) { var ay = top0 + oh * (0.2 + j * 0.13), up = [], lo = []; for (var ax = ox - rx * 1.3; ax <= ox + rx * 1.3; ax += 6) { var yy = ay + Math.sin(ax / (rx * 0.35) + j * 2) * oh * 0.06; up.push([ax, yy - oh * (0.12 + 0.06 * Math.sin(ax / (rx * 0.16) + j))]); lo.unshift([ax, yy + oh * 0.015]); } aur += n10_P(up.concat(lo)); }
    add(far, 'a', aur, 'rgba(110,255,200,0.12)');
    var st = ''; spread(ox - rx * 1.2, top0 - 10, rx * 2.4, oh * 0.6, 16, 14, rnd, 1).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - sx, c.y - sy) > sr * 1.8) st += n10_C(c.x, c.y, 0.5 + c.r * 1.0); });
    add(far, 'b', st + n10_C(sx, sy, sr), 'rgba(250,246,226,0.92)');
  } else {
    add(far, 'a', n10_C(sx, sy, sr * 2.8), 'rgba(255,252,236,0.45)');
    var cx0 = ox - rx * 0.55, cy0 = top0 + oh * 0.3, cs = Math.max(0.7, S) * (ph ? 0.8 : 1);
    add(far, 'b', n10_C(sx, sy, sr) + n10_E(cx0, cy0, 34 * cs, 7 * cs) + n10_C(cx0 - 10 * cs, cy0 - 5 * cs, 10 * cs) + n10_C(cx0 + 9 * cs, cy0 - 7 * cs, 12 * cs) + n10_E(ox + rx * 0.95, top0 + oh * 0.42, 26 * cs, 5 * cs) + n10_C(ox + rx * 0.95, top0 + oh * 0.42 - 5 * cs, 9 * cs), 'rgba(255,254,246,0.94)');
  }
  // mountains: one big peak, smaller ones beside it, snow caps and shaded faces
  var mb = yF - oh * 0.1, PK = [[ox - rx * 1.5, mb - oh * 0.18], [ox - rx * 0.95, mb - oh * 0.34], [ox - rx * 0.62, mb - oh * 0.2], [ox - rx * 0.2, mb - oh * 0.62], [ox + rx * 0.18, mb - oh * 0.33], [ox + rx * 0.55, mb - oh * 0.46], [ox + rx * 0.9, mb - oh * 0.24], [ox + rx * 1.25, mb - oh * 0.36], [ox + rx * 1.6, mb - oh * 0.16]];
  var ridge = [[ox - rx * 1.9, mb]];
  for (i = 0; i < PK.length; i++) { ridge.push(PK[i]); if (i < PK.length - 1) { var q = PK[i + 1]; ridge.push([(PK[i][0] * 0.55 + q[0] * 0.45) + (rnd() - 0.5) * rx * 0.05, Math.max(PK[i][1], q[1]) + oh * (0.04 + rnd() * 0.05)]); } }
  ridge.push([ox + rx * 1.9, mb]);
  add(far, 'c', n10_P(ridge.concat([[ox + rx * 1.9, yF + 20], [ox - rx * 1.9, yF + 20]])), dk ? '#324578' : '#86A9D2');
  var caps = '', shade = '';
  for (i = 1; i < ridge.length - 1; i += 2) { var p = ridge[i], L = ridge[i - 1], R = ridge[i + 1], fr = 0.45 + rnd() * 0.15, A1 = [p[0] + (R[0] - p[0]) * fr, p[1] + (R[1] - p[1]) * fr], B1 = [p[0] + (L[0] - p[0]) * fr, p[1] + (L[1] - p[1]) * fr], cp = [p, A1];
    for (k = 1; k < 6; k++) { var u = k / 6; cp.push([A1[0] + (B1[0] - A1[0]) * u, A1[1] + (B1[1] - A1[1]) * u + (k % 2 ? -1 : 1) * (A1[1] - p[1]) * 0.18]); } cp.push(B1);
    caps += n10_P(cp); shade += n10_P([p, R, [R[0] - (R[0] - p[0]) * 0.25, mb + 8], [p[0] + (R[0] - p[0]) * 0.18, mb + 8]]); }
  add(far, 'd', shade, dk ? 'rgba(10,14,50,0.32)' : 'rgba(60,95,150,0.26)'); add(far, 'e', caps, dk ? '#8C9FD4' : '#F7FBFE');
  // a nearer snowy slope with a band of small pines
  var sl = n10_fn(ox - rx * 1.9, ox + rx * 1.9, 6, function (x) { return yF - oh * 0.17 + Math.sin(x / (rx * 0.5) + 1.3) * oh * 0.035 + Math.sin(x / 13) * 1.2; });
  add(far, 'f', n10_P(sl.concat([[ox + rx * 1.9, yF + 20], [ox - rx * 1.9, yF + 20]])), dk ? '#5B6EA6' : '#DCE8F4');
  var pines = '', psnow = '';
  spread(ox - rx * 1.25, yF - oh * 0.2, rx * 2.5, oh * 0.06, ph ? 9 : 8, 6, rnd, 1).forEach(function (c) { if (c.q < 0.7) { var py = Math.max(c.y, n10_yOn(sl, c.x) + 3), h = oh * (0.07 + c.r * 0.06); pines += n10_spire(c.x, py, h, h * 0.24, rnd); psnow += n10_P([[c.x, py - h], [c.x + h * 0.13, py - h * 0.55], [c.x - h * 0.13, py - h * 0.55]]); } });
  add(far, 'g', pines, dk ? '#22305C' : '#4E7E86');
  var field = n10_fn(ox - rx * 1.9, ox + rx * 1.9, 6, function (x) { return yF - oh * 0.07 + Math.sin(x / (rx * 0.37)) * oh * 0.02; });
  add(far, 'h', psnow + n10_P(field.concat([[ox + rx * 1.9, yF + 24], [ox - rx * 1.9, yF + 24]])), dk ? '#8698CC' : '#F7FAFD');
  // ---- the ice walls: one band per ring, the brightest at the mouth, deepening outward
  var BAND = dk ? ['#5A7ED0', '#4B6CC2', '#3E5BAE', '#344B9A', '#2C3F86', '#253473', '#1F2A60', '#19224E'] : ['#E2FAFE', '#BCEEF8', '#8FDDF0', '#62C8E6', '#42ABDA', '#2F8BC8', '#236EB0', '#1A5396'];
  var KEYS = 'abcdefgh', full = rect(-80, -80, W + 160, H + 160), rims = '', strata = '';
  for (k = 0; k < rings.length; k++) {
    add(refl, KEYS[k], full + n10_H(rings[k]), BAND[k]);
    // the lit edge along the upper part of each ring
    var rp = []; for (j = 46; j <= 98; j++) rp.push(rings[k][j % 96]);
    rims += pline(rp);
    // fine strata (layers in the glacier ice) running round each band
    if (k < rings.length - 1) for (j = 0; j < 2; j++) { var sm = SC[k] + (SC[k + 1] - SC[k]) * (0.35 + j * 0.32), a0 = Math.PI * (1.05 + rnd() * 0.35), a1 = a0 + Math.PI * (0.25 + rnd() * 0.35), sp = [];
      for (var aa = a0; aa <= a1; aa += 0.04) sp.push([vx + Math.cos(aa) * rx * sm * (1 + 0.02 * Math.sin(aa * 7 + j)), vy + Math.sin(aa) * ryU * sm * (1 + 0.02 * Math.sin(aa * 7 + j))]);
      strata += pline(sp); }
  }
  stk(refl, 's', rims, dk ? 'rgba(170,200,255,0.4)' : 'rgba(255,255,255,0.75)', ph ? 1.2 : 1.8);
  stk(refl, 't', strata, dk ? 'rgba(160,190,255,0.16)' : 'rgba(255,255,255,0.32)', ph ? 0.9 : 1.3);
  // ---- the floor: frozen meltwater widening toward us between low banks of ice
  var hw0 = rx * FLR, sMax = (H + 40 - vy) / ryL, FL = [], FR = [];
  for (j = 0; j <= 14; j++) { var s = 1 + (sMax - 1) * j / 14, wob = 1 + 0.035 * Math.sin(j * 1.9 + 0.5); FL.push([vx - hw0 * s * wob, vy + ryL * s]); FR.unshift([vx + hw0 * s * (2 - wob), vy + ryL * s]); }
  var floorPts = [[vx - hw0 * 1.01, yF - 2]].concat(FL.slice(1), FR.slice(0, -1), [[vx + hw0 * 1.01, yF - 2]]);
  function inFloor(x, y) { var s = (y - vy) / ryL; return s >= 0.98 && Math.abs(x - vx) < hw0 * s * 1.08; }
  // scallops: shallow dished hollows all over the walls, each shaded on the side toward the mouth and lit on the far rim
  var scS = '', scL = '';
  spread(-30, -30, W + 60, H + 60, ph ? 30 : 44, ph ? 30 : 40, rnd, 0.9).forEach(function (c) {
    var dx = (c.x - vx) / rx, dy = (c.y - vy) / (c.y < vy ? ryU : ryL), q = Math.hypot(dx, dy);
    if (q < 1.14 || inFloor(c.x, c.y + 10) || c.y > H + 10) return;
    var ang = Math.atan2(c.y - vy, c.x - vx) * 180 / Math.PI + (c.k - 0.5) * 50, r = Math.min(60, (7 + 7 * c.r) * Math.pow(q, 0.75) * (ph ? 0.75 : 1)), ry = r * (0.85 + c.k * 0.3);
    scS += n10_lune(c.x, c.y, r * 0.8, ry, ang + 180, -0.15); scL += n10_lune(c.x, c.y, r * 0.86, ry * 1.02, ang, 0.62); });
  add(mid, 'a', scS, dk ? 'rgba(8,12,48,0.16)' : 'rgba(12,70,130,0.085)'); add(mid, 'b', scL, dk ? 'rgba(160,190,255,0.17)' : 'rgba(255,255,255,0.32)');
  add(mid, 'c', n10_P(floorPts), dk ? '#3A5096' : '#A2DDEC');
  // the bright mouth mirrored in the glassy floor, and its soft streak toward us
  var mir = open.filter(function (q) { return q[1] < yF - 4; }).map(function (q) { return [vx + (q[0] - vx) * 0.8, yF + (yF - q[1]) * 0.4]; });
  add(mid, 'd', mir.length > 3 ? n10_P(mir) : '', dk ? 'rgba(120,150,255,0.12)' : 'rgba(255,255,255,0.26)');
  // low banks of ice and old snow along both sides of the floor
  var bank = '', bankHi = '';
  [FL, FR].forEach(function (E, side) { var sg = side ? -1 : 1; for (j = 0; j < E.length * 3 - 2; j++) { var jj = j / 3, j0 = Math.floor(jj), fj = jj - j0, e0 = E[j0], e1 = E[Math.min(E.length - 1, j0 + 1)], ex = e0[0] + (e1[0] - e0[0]) * fj, ey = e0[1] + (e1[1] - e0[1]) * fj, s = (ey - vy) / ryL, br = (ph ? 6 : 9) * s * (0.8 + rnd() * 0.6), bx = ex - sg * br * 0.6, by = ey - br * 0.1;
    bank += n10_P(n10_blob(bx, by, br * 1.5, br * 0.9, rnd, 10, 0.22)); if (rnd() < 0.55) bankHi += n10_P(n10_blob(bx + sg * br * 0.2, by - br * 0.45, br * 0.8, br * 0.28, rnd, 9, 0.2)); }
    bank += n10_P(E.map(function (q) { var s = (q[1] - vy) / ryL; return [q[0] - sg * (ph ? 4 : 6) * s, q[1] - (ph ? 3 : 4) * s]; }).concat(E.slice().reverse().map(function (q) { var s = (q[1] - vy) / ryL; return [q[0] - sg * (ph ? 14 : 20) * s, q[1] + 6 * s]; }))); });
  add(mid, 'e', bank, dk ? '#4660AA' : '#B4E4F1'); add(mid, 'f', bankHi, dk ? '#7488CC' : '#E6F8FC');
  // cracks and frozen bubbles in the meltwater ice
  var cr = '', bub = '';
  for (j = 0; j < (ph ? 4 : 6); j++) { var cx1 = vx + (rnd() - 0.5) * hw0 * 1.4, cy1 = yF + (rnd() * 0.5 + 0.1) * (H - yF), pts2 = [[cx1, cy1]], ca = rnd() * 6.28;
    for (k = 0; k < 4; k++) { ca += (rnd() - 0.5) * 1.4; var ll = (14 + rnd() * 26) * S * (cy1 - vy) / (yF - vy) * 0.45; pts2.push([pts2[k][0] + Math.cos(ca) * ll, pts2[k][1] + Math.sin(ca) * ll * 0.35]); }
    if (pts2.every(function (q) { return inFloor(q[0], q[1] - 6); })) cr += pline(pts2); }
  spread(vx - hw0 * 2.5, yF + 8, hw0 * 5, H - yF, ph ? 30 : 46, 26, rnd, 1).forEach(function (c) { if (c.q < 0.4 && inFloor(c.x, c.y - 8)) { var s = (c.y - vy) / ryL, br = (1 + c.r * 2) * s * 0.55 * (ph ? 0.8 : 1); bub += n10_E(c.x, c.y, br, br * 0.55); } });
  stk(mid, 's', cr, dk ? 'rgba(170,195,255,0.35)' : 'rgba(255,255,255,0.7)', ph ? 0.9 : 1.2); stk(mid, 't', bub, dk ? 'rgba(170,195,255,0.3)' : 'rgba(255,255,255,0.6)', 1);
  // icicles in clusters along the ceiling of each ring (drips fall from some of their tips in the living scene)
  var ice = '', iceSt = '', tips = [];
  for (k = 0; k < 6; k++) { var nIc = (ph ? 3 : 4) + k * (ph ? 1 : 2);
    for (j = 0; j < nIc; j++) { var a = Math.PI * (1.12 + 0.76 * (j + 0.5 + (rnd() - 0.5) * 0.7) / nIc), idx = Math.round(a / (Math.PI * 2) * 96) % 96, P0 = rings[k][idx];
      if (P0[1] < -20 || P0[0] < -20 || P0[0] > W + 20) continue;
      var cnt = 1 + Math.floor(rnd() * 3);
      for (var c2 = 0; c2 < cnt; c2++) { var off = (c2 - (cnt - 1) / 2) * (ph ? 5 : 8) * SC[k] * 0.7, Lc = (6 + rnd() * 14) * SC[k] * S * (c2 === Math.floor(cnt / 2) ? 1.5 : 1), wc = (1.6 + rnd() * 1.6) * SC[k] * S * 0.8;
        var ic = n10_icicle(P0[0] + off, P0[1] + 2 + Math.abs(off) * 0.08, Lc, wc, rnd, (P0[0] - vx) / (rx * 12));
        ice += ic.d; iceSt += ic.st;
        var fy = vy + ryL * SC[k];
        if (c2 === Math.floor(cnt / 2) && fy < H - 8 && inFloor(ic.tip[0], fy - 4)) tips.push({x: ic.tip[0], y: ic.tip[1], s: SC[k], fy: fy}); } } }
  add(mid, 'g', ice, dk ? 'rgba(150,180,255,0.6)' : 'rgba(228,251,255,0.8)'); add(mid, 'h', iceSt, dk ? 'rgba(220,232,255,0.6)' : 'rgba(255,255,255,0.95)');
  // ---- the near frame: the cave's front lip with big icicles, faceted ice blocks and drifted snow at the bottom corners
  var lip = [[-60, -60], [W + 60, -60]], big = '', bigSt = '', bigTips = [], lipY = function (x) { return (ph ? 18 : 30) * S * (1 + 0.5 * Math.sin(x / (ph ? 50 : 90) + 1.2) + 0.25 * Math.sin(x / 23)) + (ph ? 6 : 10); };
  for (var lx = W + 60; lx >= -60; lx -= 10) lip.push([lx, lipY(lx)]);
  var nb = ph ? 7 : 13;
  for (j = 0; j < nb; j++) { var bx = W * (j + 0.3 + rnd() * 0.4) / nb, ef = 0.35 + Math.pow(Math.abs(bx - ox) / (W * 0.5), 1.4) * 0.9, Lb = (ph ? 46 : 80) * S * ef * (0.6 + rnd() * 0.7), wb = (ph ? 6 : 10) * S * (0.7 + rnd() * 0.5) * Math.max(0.6, ef);
    var ib = n10_icicle(bx, lipY(bx) - 2, Lb, wb, rnd, (bx - ox) / W * -0.06); big += ib.d; bigSt += ib.st; bigTips.push({x: ib.tip[0], y: ib.tip[1]});
    if (rnd() < 0.6) { var ib2 = n10_icicle(bx + wb * 2.4, lipY(bx + wb * 2.4) - 2, Lb * 0.45, wb * 0.6, rnd, 0); big += ib2.d; bigSt += ib2.st; } }
  add(near, 'a', n10_P(lip), dk ? '#161F4E' : '#1D5794');
  // clusters of ice crystals pushing up out of the drifted snow at the bottom corners
  var blk = '', fac = '', edg = '', drift = '';
  [[W * (ph ? 0.06 : 0.035), ph ? 0.9 : 1.15, 5], [W * (ph ? 0.95 : 0.97), ph ? 0.8 : 1, 4], [W * (ph ? 0.24 : 0.16), ph ? 0.45 : 0.55, 3], [W * (ph ? 0.78 : 0.86), ph ? 0.42 : 0.5, 3]].forEach(function (b) {
    var n = b[2], h0 = (ph ? 70 : 110) * S * b[1], lean = b[0] > vx ? -1 : 1;
    for (var q = 0; q < n; q++) { var off = (q - (n - 1) / 2), a = off * 17 + lean * 6 + (rnd() - 0.5) * 8, h = h0 * (1 - Math.abs(off) * 0.22) * (0.8 + rnd() * 0.35), w = h * (0.17 + rnd() * 0.05), bx2 = b[0] + off * w * 1.1, by2 = H + 4;
      var pr = rotp([[-w, 0], [-w, -h + w * 1.1], [0, -h], [w, -h + w * 1.1], [w, 0]], bx2, by2, a), fc = rotp([[-w, 0], [-w, -h + w * 1.1], [0, -h], [0, 0]], bx2, by2, a), ed = rotp([[-w * 0.65, -h * 0.12], [-w * 0.65, -h + w * 1.4], [-w * 0.42, -h + w * 1.25], [-w * 0.42, -h * 0.14]], bx2, by2, a);
      if (lean < 0) fc = rotp([[w, 0], [w, -h + w * 1.1], [0, -h], [0, 0]], bx2, by2, a);
      blk += n10_P(pr); fac += n10_P(fc); edg += n10_P(ed); }
    drift += n10_P(n10_blob(b[0], H + 2, h0 * 0.75, h0 * 0.16, rnd, 10, 0.2)); });
  var dl = n10_fn(-60, W * (ph ? 0.36 : 0.26), 8, function (x) { var u = (x + 60) / (W * (ph ? 0.36 : 0.26) + 60); return H - (ph ? 22 : 34) * Math.sin(Math.PI * Math.min(1, u * 1.05)) - 2; });
  var dr = n10_fn(W * (ph ? 0.66 : 0.76), W + 60, 8, function (x) { var u = (x - W * (ph ? 0.66 : 0.76)) / (W * (ph ? 0.34 : 0.24) + 60); return H - (ph ? 20 : 30) * Math.sin(Math.PI * Math.min(1, 0.06 + u)) - 2; });
  drift += below(dl, H + 30) + below(dr, H + 30);
  add(near, 'b', blk, dk ? '#3A52A6' : '#5ABEE2'); add(near, 'c', fac, dk ? '#5C78C8' : '#A8E6F6'); add(near, 'd', big, dk ? '#3B53A4' : '#84D0E8');
  add(near, 'e', bigSt + edg, dk ? 'rgba(190,210,255,0.55)' : 'rgba(255,255,255,0.85)'); add(near, 'f', drift, dk ? '#8496D0' : '#F2FAFD');
  if (ANIM) {
    // wall glows: where the outside light shines through thin ice
    var glows = [];
    for (j = 0; j < (ph ? 9 : 15); j++) { k = 1 + Math.floor(rnd() * 4); var ga = Math.PI * (0.92 + rnd() * 1.16), gs = SC[k] + (SC[k + 1] - SC[k]) * rnd(), gx = vx + Math.cos(ga) * rx * gs, gy = vy + Math.sin(ga) * (Math.sin(ga) < 0 ? ryU : ryL) * gs;
      if (!inFloor(gx, gy)) glows.push({x: gx, y: gy, r: (ph ? 26 : 42) * gs * S, ph: rnd() * 6.28, k: k}); }
    ANIM.cave = {vx: vx, vy: vy, rx: rx, ryU: ryU, ryL: ryL, yF: yF, hw0: hw0, oh: oh, top: top0, sun: [sx, sy]};
    ANIM.open = open; ANIM.rings = rings; ANIM.ridge = ridge; ANIM.floor = floorPts; ANIM.tips = tips; ANIM.bigTips = bigTips; ANIM.glows = glows; ANIM.S = S * (ph ? 0.9 : 1);
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
