// ---- batch n10: icecave (Blue Ice Cave), geysers (Geyser Basin)
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

// =============== 2. Geyser Basin: a volcanic hot-spring basin with a rainbow prismatic pool, mineral terraces, a steaming
// geyser cone, silver snags, a boardwalk and lodgepole pines on the hills (night: stars, moonlit steam, softly glowing pools)
// a hot pool in rings (deep blue centre, teal, green, yellow, orange mat with runoff fingers); each ring added to its own slot
function n10_pool(L, cx, cy, rx, ry, rnd, big, out) {
  var mat = '', lines = '', i, k;
  // the mat: a soft lobed apron, plus a few broad runoff channels that taper out across the sinter
  mat += n10_P(n10_blob(cx, cy + ry * 0.06, rx * (big ? 1.34 : 1.28), ry * (big ? 1.46 : 1.4), rnd, big ? 11 : 8, 0.1));
  var ch = big ? [0.4, 0.75, 1.25, 2.3, 2.7, 3.3] : [0.6, 2.5];
  ch.forEach(function (a0) { var a = a0 + (rnd() - 0.5) * 0.3, len = (big ? 0.3 : 0.25) + rnd() * (big ? 0.45 : 0.2), w0 = 0.12 + rnd() * 0.07, p = [], q = [], ph0 = rnd() * 6;
    for (k = 0; k <= 10; k++) { var u = k / 10, aa = a + Math.sin(u * 3 + ph0) * 0.07, rr = 1.2 + len * u, w = w0 * Math.pow(1 - u, 0.7) + 0.01;
      p.push([cx + Math.cos(aa - w) * rx * rr, cy + Math.sin(aa - w) * ry * rr * 1.05]); q.unshift([cx + Math.cos(aa + w) * rx * rr, cy + Math.sin(aa + w) * ry * rr * 1.05]); }
    mat += n10_P(p.concat(q)); });
  add(L, 'a', mat);
  // fine radiating striations in the mat
  for (i = 0; i < (big ? 70 : 18); i++) { var a2 = i / (big ? 70 : 18) * Math.PI * 2 + rnd() * 0.05, r0 = 1.17 + rnd() * 0.04, r1 = Math.min(1.28, r0 + 0.05 + rnd() * (big ? 0.12 : 0.08)), pp = [];
    for (k = 0; k <= 4; k++) { var rr2 = r0 + (r1 - r0) * k / 4, aw = a2 + Math.sin(k + i) * 0.02; pp.push([cx + Math.cos(aw) * rx * rr2, cy + Math.sin(aw) * ry * rr2 * 1.05]); }
    lines += pline(pp); }
  var yl = n10_blob(cx, cy, rx * 1.15, ry * 1.18, rnd, 16, 0.04); add(L, 'b', n10_P(yl));
  add(L, 'c', n10_P(n10_blob(cx, cy - ry * 0.02, rx * 1.02, ry * 1.04, rnd, 16, 0.025)));
  add(L, 'd', n10_E(cx, cy - ry * 0.03, rx * 0.93, ry * 0.9));
  add(L, 'e', n10_E(cx + rx * 0.03, cy - ry * 0.05, rx * 0.68, ry * 0.62));
  // the sky's sheen on the far half of the water
  add(L, 'f', n10_lune(cx, cy - ry * 0.1, ry * 0.45, rx * 0.7, -90, 0.4));
  if (out) out.push({x: cx, y: cy, rx: rx, ry: ry});
  return lines; }
SCENES.geysers = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(ph ? 0.9 : 1.3), refl = Lay(0), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, j, k;
  var sky = dk ? 'linear-gradient(180deg,#0A1230 0%,#16224A 38%,#283662 60%,#3E4A74 100%)' : 'linear-gradient(180deg,#86BFE8 0%,#B2D9F2 36%,#DDEFF5 58%,#F5F0E0 100%)';
  var yH = H * (ph ? 0.38 : 0.43);
  // ---- sky: sun or moon, clouds or stars
  var mx = W * (ph ? 0.76 : 0.8), my = H * (ph ? 0.1 : 0.13), mr = ph ? 18 : 28;
  if (dk) { add(far, 'a', n10_C(mx, my, mr * 2.6), 'rgba(200,210,255,0.12)'); add(far, 'c', n10_C(mx, my, mr), '#F4F0DC');
    var st = ''; spread(0, 0, W, yH * 0.95, 30, 28, rnd, 1).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - mx, c.y - my) > mr * 2) st += n10_C(c.x, c.y, 0.5 + c.r * 1.1); }); add(far, 'b', st, 'rgba(255,248,236,0.85)'); }
  else { add(far, 'a', n10_C(mx, my, mr * 2.4), 'rgba(255,250,232,0.45)'); add(far, 'c', n10_C(mx, my, mr), 'rgba(255,253,242,0.97)');
    var cl = ''; spread(0, H * 0.05, W, H * 0.2, ph ? 190 : 330, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - mx, c.y - my) > 100) { var s = (0.7 + c.r * 0.6) * (ph ? 0.75 : 1); cl += n10_E(c.x, c.y, 66 * s, 12 * s) + n10_C(c.x - 22 * s, c.y - 8 * s, 18 * s) + n10_C(c.x + 14 * s, c.y - 13 * s, 23 * s) + n10_C(c.x + 38 * s, c.y - 4 * s, 13 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.88)'); }
  // ---- hills: a far blue range, nearer forested hills of lodgepole pine, and a haze over the basin floor
  var r1 = ridge(W, yH - H * 0.09, [[H * 0.035, ph ? 70 : 160, 0.4], [H * 0.015, 46, 2.1]], 8);
  add(far, 'd', below(r1, yH + 30), dk ? '#28345E' : '#A3B9CF');
  var fp = ''; spread(-20, yH - H * 0.12, W + 40, H * 0.04, ph ? 7 : 8, 8, rnd, 1).forEach(function (c) { if (c.q < 0.8) { var by = n10_yOn(r1, c.x) + 4 + c.r * 3, h = (ph ? 8 : 12) + c.r * 6; fp += n10_spire(c.x, by, h, h * 0.2, rnd); } });
  add(far, 'e', fp, dk ? '#222D52' : '#8EA6BC');
  var r2 = ridge(W, yH - H * 0.035, [[H * 0.025, ph ? 60 : 120, 1.7], [H * 0.01, 38, 0.3]], 8);
  add(far, 'f', below(r2, yH + 30), dk ? '#1E2A48' : '#7E9C88');
  var np = ''; spread(-20, yH - H * 0.07, W + 40, H * 0.05, ph ? 6 : 7, 7, rnd, 1).forEach(function (c) { if (c.q < 0.9) { var by = Math.max(c.y, n10_yOn(r2, c.x) + 6) + 6, h = (ph ? 14 : 22) + c.r * (ph ? 8 : 14); np += n10_spire(c.x, by, h, h * 0.17, rnd); } });
  add(far, 'g', np, dk ? '#141F38' : '#3E644E');
  var hz = n10_fn(-60, W + 60, 10, function (x) { return yH - H * 0.022 + Math.sin(x / 70) * 3; });
  add(far, 'h', n10_P(hz.concat([[W + 60, yH + H * 0.03], [-60, yH + H * 0.03]])), dk ? 'rgba(150,165,220,0.16)' : 'rgba(255,255,255,0.5)');
  // ---- the basin floor
  var g0 = n10_fn(-60, W + 60, 10, function (x) { return yH + Math.sin(x / 150 + 2) * 2.5; });
  add(refl, 'a', below(g0, H + 30), dk ? '#444A6C' : '#E3D9C3');
  var pat = '';
  spread(0, yH + 6, W, H - yH, ph ? 90 : 160, ph ? 60 : 70, rnd, 0.9).forEach(function (c) { if (c.q < 0.55) { var d = (c.y - yH) / (H - yH), w = (40 + c.r * 70) * (0.4 + d) * (ph ? 0.6 : 1); pat += n10_P(n10_blob(c.x, c.y, w, w * (0.12 + d * 0.1), rnd, 10, 0.25)); } });
  add(refl, 'b', pat, dk ? '#3C4164' : '#D6C8AA');
  // geyser cone (left) on its pale sinter apron
  var gx = W * (ph ? 0.2 : 0.17), gyB = yH + H * (ph ? 0.1 : 0.115), gw = (ph ? 60 : 92) * S, gh = (ph ? 38 : 56) * S;
  // the cone: a low beaded mound of geyserite with a nub of a vent on top
  var prof = function (u) { var a = Math.abs(u); return gh * Math.pow(Math.max(0, 1 - Math.pow(a, 2.3)), 0.85) + gh * 0.035 * Math.abs(Math.sin(u * 13)) + (a < 0.16 ? gh * 0.16 * Math.sqrt(1 - a / 0.16) : 0); };
  var cone = [], crust = '', drips = '', orange = '';
  for (i = 0; i <= 48; i++) { var cu = -1 + 2 * i / 48; cone.push([gx + cu * gw, gyB - prof(cu)]); }
  var sinter = n10_P(n10_blob(gx + gw * 0.15, gyB + 2 * S, gw * 2.2, gh * 0.3, rnd, 14, 0.1)) + n10_P(cone.concat([[gx + gw, gyB + 4], [gx - gw, gyB + 4]]));
  var term = []; for (i = 0; i <= 10; i++) { var tu = i / 10, uu0 = 0.1 + tu * 0.3; term.push([gx + uu0 * gw - Math.sin(tu * Math.PI) * gw * 0.12, gyB - prof(0.1) * (1 - tu)]); }
  var shadeS = n10_P(cone.filter(function (q) { return q[0] >= gx + gw * 0.1; }).concat([[gx + gw, gyB], [gx + gw * 0.4, gyB]], term.slice().reverse())) + n10_E(gx, gyB - prof(0) + 1.5 * S, gw * 0.07, gw * 0.025);
  var topY = gyB - prof(0) + 4 * S;
  [[-1, 0.7, 0.2, 1], [1, 0.95, 0.35, 1], [1, 0.25, 0.8, 0.7]].forEach(function (d) { var p = [], q = []; for (k = 0; k <= 14; k++) { var t = k / 14, x = gx + d[0] * (0.05 + d[1] * t * t) * gw + (Math.sin(t * 7 + d[2] * 9) * 4 + Math.sin(t * 17 + d[2]) * 1.5) * S * t, y = topY + (gyB + gh * 0.36 * d[3] - topY) * t * d[3], w = (1.6 + 8 * t * t) * S; p.push([x - w * 0.5, y]); q.unshift([x + w * 0.5, y]); } orange += n10_P(p.concat(q)); });
  for (k = 1; k <= 4; k++) { var hy = k / 5, ua = Math.pow(1 - Math.pow(hy, 1 / 1.3), 1 / 1.7), nled = Math.max(2, Math.round(ua * 7)); for (j = 0; j < nled; j++) { var uu = -ua + 2 * ua * (j + 0.5) / nled + (rnd() - 0.5) * 0.08; if (uu > 0.2) continue; var lx2 = gx + uu * gw, ly2 = gyB - prof(uu) * 0.98 + gh * 0.02 + (k % 2) * 1.5 * S; crust += n10_lune(lx2, ly2 + gh * (0.22 - hy * 0.12), 2 * S, gw * 0.08 * (0.8 + rnd() * 0.4), 90, 0.1); } }
  crust += n10_P(n10_blob(gx, gyB - prof(0) + 1.5 * S, gw * 0.12, gw * 0.04, rnd, 9, 0.2));
  // mineral terraces (right): tiers of scalloped rims, each holding a shallow turquoise pool, with rust streaks down the faces
  var tx0 = W * (ph ? 0.62 : 0.68), tiers = ph ? 3 : 5, mass = '', faces = '', streaks = '', rims = '', pools = '', smallPools = [];
  for (k = 0; k < tiers; k++) {
    var ty = yH + H * (ph ? 0.012 : 0.018) + k * H * (ph ? 0.042 : 0.05), xs = tx0 + (tiers - 1 - k) * W * (ph ? 0.06 : 0.04) - k * W * 0.012 + (k === tiers - 1 ? -W * 0.02 : 0), fh = (ph ? 13 : 20) * S * (1 + k * 0.12), lob = (ph ? 34 : 58) * S * (0.8 + k * 0.12);
    var lipC = n10_fn(xs, W + 60, 4, function (x) { var u = ((x - xs) / lob) % 1; return ty + Math.sin(Math.PI * u) * fh * 0.42 + Math.sin(x / 31 + k) * 1.5; });
    var cap = [[xs - 6 * S, ty - fh * 0.2], [xs - 10 * S, ty + fh * 0.2]];
    var faceLo = lipC.map(function (q) { return [q[0], q[1] + fh]; });
    mass += n10_P([[xs + 8 * S, ty - fh * 0.75], [W + 60, ty - fh * 0.75 - H * 0.03]].concat(faceLo.slice().reverse(), [[xs - 4 * S, ty + fh * 0.9]], cap.slice().reverse()));
    faces += n10_P(lipC.map(function (q) { return [q[0], q[1] + fh * 0.45]; }).concat(faceLo.slice().reverse()));
    rims += n10_P(lipC.map(function (q) { return [q[0], q[1] - 2.2 * S]; }).concat(lipC.map(function (q) { return [q[0], q[1] + 1.4 * S]; }).reverse()));
    // the pool on the tier's top
    var pl = lipC.filter(function (q, m) { return m % 3 === 0; }).map(function (q) { return [q[0], q[1] - fh * 0.12 - 2 * S]; }), py = ty - fh * 0.55;
    pools += n10_P([[xs + 14 * S, py]].concat(n10_fn(xs + 20 * S, W + 60, 24, function (x) { return py - fh * 0.12 - Math.sin(x / 40 + k) * 1.5; }), pl.slice().reverse().filter(function (q) { return q[0] > xs + 18 * S; })));
    smallPools.push({x: Math.min(W - 30, xs + (W - xs) * 0.45), y: py - fh * 0.05, w: (W - xs) * 0.4});
    for (j = 0; j < (ph ? 3 : 5); j++) { var sx = xs + 12 * S + rnd() * (W - xs), sw = (1.5 + rnd() * 2.5) * S, sy0 = n10_yOn(lipC, sx), sl = fh * (0.7 + rnd() * 0.8); streaks += n10_P([[sx - sw, sy0], [sx + sw, sy0], [sx + sw * 0.5, sy0 + sl], [sx, sy0 + sl * 1.15], [sx - sw * 0.6, sy0 + sl]]); }
    for (j = 0; j < (ph ? 6 : 12); j++) { var dx2 = xs + rnd() * (W - xs), dy2 = n10_yOn(lipC, dx2) + 2; if (dx2 > xs + 6) drips += seg(dx2, dy2, dx2 + (rnd() - 0.5) * 2, dy2 + fh * (0.4 + rnd() * 0.5)); }
  }
  mass += n10_P(n10_blob(tx0 + (W - tx0) * 0.62, yH + tiers * H * (ph ? 0.042 : 0.05) + H * 0.015, (W - tx0) * 0.72, H * (ph ? 0.018 : 0.05), rnd, 12, 0.12));
  // distant small hot pools on the flat
  var dpools = '', dshade = '';
  [[0.34, 0.035, 26], [0.47, 0.055, 18], [0.12, 0.05, 20], [0.62, 0.03, 16]].forEach(function (d, m) { if (ph && m > 1) return; var px = W * (ph ? [0.42, 0.66][m] : d[0]), py = yH + H * d[1], pr = d[2] * S * (ph ? 1.2 : 1); dpools += n10_E(px, py, pr, pr * 0.22); dshade += n10_E(px + pr * 0.05, py - pr * 0.01, pr * 0.55, pr * 0.11); smallPools.push({x: px, y: py, w: pr}); });
  add(refl, 'c', sinter + mass, dk ? '#666A90' : '#F7F2E8');
  add(refl, 'd', shadeS + faces + dshade, dk ? 'rgba(10,10,40,0.3)' : 'rgba(140,110,80,0.24)');
  add(refl, 'e', orange + streaks, dk ? 'rgba(200,120,90,0.36)' : 'rgba(214,122,52,0.45)');
  // dead lodgepole snags: silver trunks with broken limbs and white mineral "socks" at their feet
  var snag = '', limbs = '', socks = '';
  [[0.36, 0.06, 1], [0.43, 0.075, 0.75], [0.6, 0.06, 0.9], [0.27, 0.085, 0.6], [0.66, 0.085, 0.55]].forEach(function (d, m) { if (ph && m > 2) return;
    var x = W * (ph ? [0.38, 0.5, 0.66][m] : d[0]), y = yH + H * d[1], h = (ph ? 50 : 86) * S * d[2], w = (ph ? 2.4 : 3.6) * S * d[2], lean = (rnd() - 0.5) * 0.08;
    snag += n10_P([[x - w, y], [x - w * 0.4 + lean * h, y - h], [x + w * 0.2 + lean * h, y - h - 3 * S], [x + w, y]]);
    for (j = 0; j < 4; j++) { var u = 0.35 + j * 0.15 + rnd() * 0.06, bxp = x + lean * h * u, byp = y - h * u, dir = j % 2 ? 1 : -1; limbs += seg(bxp, byp, bxp + dir * h * (0.1 + rnd() * 0.08), byp - h * (0.05 + rnd() * 0.06)); }
    socks += n10_P([[x - w * 2, y + 1.5 * S], [x - w * 1.1, y - h * 0.09], [x + w * 1.1, y - h * 0.08], [x + w * 2, y + 1.5 * S]]); });
  add(refl, 'f', snag, dk ? '#5C6084' : '#B8B2AA');
  add(refl, 'g', rims + crust + socks, dk ? '#A2AAD4' : '#FFFFFF');
  add(refl, 'h', pools + dpools, dk ? '#2D6A98' : '#7FD0DC');
  stk(refl, 's', drips + pline(cone.slice(4, -4)), dk ? 'rgba(180,120,100,0.35)' : 'rgba(176,110,62,0.4)', ph ? 0.9 : 1.2);
  stk(refl, 't', limbs, dk ? '#5C6084' : '#B8B2AA', ph ? 1.2 : 1.8);
  // fumaroles: little crusted vents on the flat (steam puffs from them in the living scene)
  var vents = [];
  [[0.29, 0.13], [0.42, 0.11], [0.64, 0.115], [0.74, 0.19], [0.08, 0.16], [0.22, 0.2], [0.5, 0.15]].forEach(function (d, m) { if (ph && m > 2) return; var x = W * (ph ? [0.36, 0.56, 0.12][m] : d[0]), y = yH + H * (ph ? [0.11, 0.1, 0.15][m] : d[1]), r = (ph ? 6 : 9) * S;
    add(refl, 'g', n10_P(n10_blob(x, y, r * 1.5, r * 0.45, rnd, 9, 0.2))); add(refl, 'd', n10_E(x, y, r * 0.6, r * 0.2)); vents.push({x: x, y: y, r: r}); });
  // ---- the great prismatic pool, a smaller morning-glory pool, and the boardwalk (mid layer)
  var pcx = W * (ph ? 0.56 : 0.56), pcy = H * (ph ? 0.7 : 0.7), prx = W * (ph ? 0.33 : 0.215), pry = H * (ph ? 0.065 : 0.088), pl2 = [];
  var stri = n10_pool(mid, pcx, pcy, prx, pry, rnd, true, pl2);
  var mgx = W * (ph ? 0.8 : 0.82), mgy = H * (ph ? 0.88 : 0.875), mgr = (ph ? 44 : 64) * S;
  stri += n10_pool(mid, mgx, mgy, mgr, mgr * 0.34, rnd, false, pl2);

  var MC = dk ? ['#865852', '#9A8C58', '#2C7876', '#2A6C9E', '#173C78', 'rgba(180,200,255,0.16)'] : ['#E3904C', '#F2C85A', '#62BC98', '#3EB0D2', '#1D5EA6', 'rgba(255,255,255,0.32)'];
  'abcdef'.split('').forEach(function (s, m) { mid[s].c = MC[m]; });
  // sinter rims: a beaded white edge between the yellow and green rings
  var beads = pl2.map(function (p) { var b = []; for (var a = 0; a <= 6.3; a += 0.12) b.push([p.x + Math.cos(a) * p.rx * 1.04, p.y + Math.sin(a) * p.ry * 1.06]); return pline(b); }).join('');
  stk(mid, 't', beads, dk ? 'rgba(190,200,240,0.5)' : 'rgba(255,255,255,0.85)', ph ? 1.4 : 2);
  // the boardwalk: planks on low posts, winding in from the bottom left past the big pool toward the cone
  var bw0 = [[W * (ph ? 0.3 : 0.3), H + 50], [W * (ph ? 0.22 : 0.23), H * 0.8], [W * (ph ? 0.12 : 0.19), H * 0.69], [W * (ph ? 0.3 : 0.25), H * (ph ? 0.57 : 0.585)]];
  function bez(u) { var a = 1 - u; return [a * a * a * bw0[0][0] + 3 * a * a * u * bw0[1][0] + 3 * a * u * u * bw0[2][0] + u * u * u * bw0[3][0], a * a * a * bw0[0][1] + 3 * a * a * u * bw0[1][1] + 3 * a * u * u * bw0[2][1] + u * u * u * bw0[3][1]]; }
  var BL = [], BR = [], SIDE = [], planks = '', posts = '', n = 28;
  for (i = 0; i <= n; i++) { var u2 = i / n, P = bez(u2), Q = bez(Math.min(1, u2 + 0.01)), Pm = bez(Math.max(0, u2 - 0.01)), dx = Q[0] - Pm[0], dy = Q[1] - Pm[1], dl = Math.hypot(dx, dy) || 1, ww = (ph ? 50 : 84) * S * (1 - u2 * 0.8), nx = -dy / dl, ny = dx / dl, th = (ph ? 5 : 8) * S * (1 - u2 * 0.75);
    BL.push([P[0] - nx * ww / 2, P[1] - ny * ww / 2]); BR.push([P[0] + nx * ww / 2, P[1] + ny * ww / 2]); SIDE.push([P[0] + nx * ww / 2, P[1] + ny * ww / 2 + th]);
    if (i > 0 && i < n) planks += seg(P[0] - nx * ww * 0.48, P[1] - ny * ww * 0.48, P[0] + nx * ww * 0.48, P[1] + ny * ww * 0.48);
    if (i % 3 === 1) posts += rect(P[0] + nx * ww * 0.42 - th * 0.35, P[1] + ny * ww / 2 + th * 0.5, th * 0.7, th * 1.3) + rect(P[0] - nx * ww * 0.42 - th * 0.35, P[1] - ny * ww / 2 + th * 0.5, th * 0.7, th * 1.1); }
  // a finer plank rhythm between the main lines
  for (i = 0; i < n * 2; i++) { var ub = (i + 0.5) / (n * 2), P2 = bez(ub), Q2 = bez(Math.min(1, ub + 0.01)), dx3 = Q2[0] - P2[0], dy3 = Q2[1] - P2[1], dl3 = Math.hypot(dx3, dy3) || 1, w3 = (ph ? 50 : 84) * S * (1 - ub * 0.8); if (i % 2) planks += seg(P2[0] + dy3 / dl3 * w3 * 0.48, P2[1] - dx3 / dl3 * w3 * 0.48, P2[0] - dy3 / dl3 * w3 * 0.48, P2[1] + dx3 / dl3 * w3 * 0.48); }
  add(mid, 'g', n10_P(BL.concat(BR.slice().reverse())), dk ? '#6A5868' : '#C49464');
  add(mid, 'h', n10_P(BR.concat(SIDE.slice().reverse())) + posts, dk ? '#3A3048' : '#7E5636');
  stk(mid, 's', stri + planks + pline(BL) + pline(BR), dk ? 'rgba(30,20,40,0.4)' : 'rgba(130,66,28,0.4)', ph ? 0.8 : 1.1);
  // ---- near: a foreground bank with sedge tufts and stones, and two tall lodgepole pines framing the left edge
  var fb = n10_fn(-60, W + 60, 10, function (x) { var l = Math.max(0, 1 - (x + 60) / (W * (ph ? 0.5 : 0.3))), r = Math.max(0, (x - W * (ph ? 0.5 : 0.62)) / (W * (ph ? 0.5 : 0.38))); return H - (ph ? 26 : 40) * Math.max(l * 1.2, r * 0.75) - 4 + Math.sin(x / 33) * 2; });
  add(near, 'a', below(fb, H + 40), dk ? '#3A3E5E' : '#D6CAB0');
  var tufts = '', blades = '', rocks = '', rockHi = '', fmat = '';
  spread(0, H - (ph ? 34 : 50), W, ph ? 24 : 36, ph ? 34 : 46, 20, rnd, 1).forEach(function (c) { var yb = n10_yOn(fb, c.x); if (yb > H - 8 || c.q > 0.7) return; var th2 = (ph ? 10 : 15) * (0.7 + c.r * 0.6);
    var yy = Math.max(c.y, yb + 6); tufts += n10_P([[c.x - th2 * 0.6, yy + 2], [c.x - th2 * 0.25, yy - th2 * 0.7], [c.x, yy - th2 * 1.2], [c.x + th2 * 0.3, yy - th2 * 0.8], [c.x + th2 * 0.7, yy + 2]]);
    for (j = 0; j < 3; j++) { var bxx = c.x + (j - 1) * th2 * 0.3; blades += 'M' + PT(bxx, yy) + ' Q' + PT(bxx + (j - 1) * th2 * 0.5, yy - th2 * 1.1) + ' ' + PT(bxx + (j - 1) * th2 * 0.9, yy - th2 * 1.5 - c.k * 4) + ' '; } });
  [[0.42, 1], [0.6, 0.7], [0.97, 1.1], [ph ? 0.68 : 0.72, 0.6]].forEach(function (d) { var x = W * d[0], y = n10_yOn(fb, x) + 10 * S, r = (ph ? 16 : 24) * S * d[1], b = n10_blob(x, y, r * 1.3, r * 0.7, rnd, 10, 0.2); rocks += n10_P(b); rockHi += n10_P(n10_blob(x - r * 0.25, y - r * 0.35, r * 0.7, r * 0.25, rnd, 8, 0.2)); });
  fmat += n10_P(n10_blob(W * (ph ? 0.36 : 0.5), H - 4, W * 0.12, 9 * S, rnd, 10, 0.2));
  add(near, 'b', fmat, dk ? 'rgba(170,110,90,0.45)' : 'rgba(222,130,58,0.55)');
  add(near, 'c', rocks, dk ? '#4E5274' : '#A69C8E'); add(near, 'd', rockHi, dk ? '#6A6E92' : '#CEC6B8');
  add(near, 'h', tufts, dk ? '#38504E' : '#93A85A');
  stk(near, 's', blades, dk ? '#4A6460' : '#7E9446', ph ? 1.1 : 1.6);
  var trunks = '', foliD = '', foliL = '';
  [[ph ? -0.02 : -0.005, 1.0], [ph ? 0.1 : 0.055, 0.84]].forEach(function (d) { var x = W * d[0], h = H * (ph ? 0.78 : 0.98) * d[1], yb = H + 20, tw = (ph ? 6 : 10) * S * d[1];
    trunks += n10_P([[x - tw, yb], [x - tw * 0.45, yb - h], [x + tw * 0.45, yb - h], [x + tw, yb]]);
    for (j = 0; j < 16; j++) { var u = 0.4 + j * 0.037, y = yb - h * u, dir = j % 2 ? 1 : -1, len = h * (0.05 + 0.05 * Math.abs(Math.sin(j * 1.7))) * (1.1 - u * 0.6);
      for (var t2 = 0; t2 < 3; t2++) { var tx = x + dir * len * (0.25 + t2 * 0.32), ty = y - t2 * h * 0.006 + (rnd() - 0.5) * h * 0.01, tr = len * (0.36 - t2 * 0.06);
        foliD += n10_P(n10_blob(tx, ty, tr, tr * 0.42, rnd, 12, 0.45)); if (t2 < 2) foliL += n10_P(n10_blob(tx - dir * tr * 0.1, ty - tr * 0.18, tr * 0.6, tr * 0.18, rnd, 9, 0.4)); } }
    foliD += n10_spire(x, yb - h * 0.93, h * 0.11, h * 0.035, rnd); });
  add(near, 'e', trunks, dk ? '#2A2438' : '#6E5644'); add(near, 'f', foliD, dk ? '#11203A' : '#2E5A44'); add(near, 'g', foliL, dk ? '#1C2E4A' : '#4C7C58');
  if (ANIM) {
    ANIM.pool = {x: pcx, y: pcy, rx: prx, ry: pry}; ANIM.pools = pl2; ANIM.small = smallPools; ANIM.vents = vents;
    ANIM.cone = {x: gx, y: gyB - prof(0) + 2 * S, w: gw * 0.1, base: gyB}; ANIM.moon = [mx, my]; ANIM.yH = yH; ANIM.S = S * (ph ? 0.9 : 1);
  } else {
    // still picture: soft wisps of steam over the pools and the cone
    var wisp = '', addW = function (x, y, l) { wisp += 'M' + PT(x, y) + ' c' + n1(-9 * S) + ' ' + n1(-l * 0.3) + ' ' + n1(11 * S) + ' ' + n1(-l * 0.6) + ' ' + n1(4 * S) + ' ' + n1(-l) + ' '; };
    for (i = 0; i < (ph ? 4 : 7); i++) addW(pcx - prx * 0.7 + i * prx * 1.4 / (ph ? 3 : 6) + (rnd() - 0.5) * 16 * S, pcy - pry * (0.2 + rnd() * 0.4), (40 + rnd() * 30) * S);
    addW(gx, gyB - gh - 4, 60 * S); addW(mgx, mgy - 6, 34 * S);
    stk(near, 't', wisp, dk ? 'rgba(210,220,255,0.12)' : 'rgba(255,255,255,0.32)', 24 * S);
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
