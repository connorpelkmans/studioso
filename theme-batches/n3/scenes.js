// batch n3: greenhouse, pottery, campfire, aquarium, treehouse (Cozy Spots, New Theme Ideas)
// Every shape here is drawn clockwise (n3_P, n3_E, rect, rrect), so shapes sharing one layer slot union cleanly instead of cutting holes.
function n3_cw(pts) { var a = 0; for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n3_P(pts) { return poly(n3_cw(pts)); }
function n3_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 '; }
function n3_C(x, y, r) { return n3_E(x, y, r, r); }
function n3_RE(x, y, rx, ry, ang) { var pts = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2; pts.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n3_P(rotp(pts, x, y, ang)); }
function n3_leafPts(x, y, len, w, ang, bend) { var pts = [], i, b = bend || 0; for (i = 0; i <= 14; i++) { var t = i / 14; pts.push([t * len, w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.3 * t) + b * len * t * t]); } for (i = 13; i > 0; i--) { var u = i / 14; pts.push([u * len, -w * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - 0.3 * u) + b * len * u * u]); } return rotp(pts, x, y, ang); }
function n3_leaf(x, y, len, w, ang, bend) { return n3_P(n3_leafPts(x, y, len, w, ang, bend)); }
function n3_bz(p0, p1, p2, p3, n) { var o = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
function n3_tube(pts, w0, w1) { var L = [], R = [], n = pts.length; for (var i = 0; i < n; i++) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, w = lerp(w0, w1, i / Math.max(1, n - 1)) / 2; L.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]); R.unshift([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]); } return n3_P(L.concat(R)); }
function n3_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n3_below(pts, bottom) { return n3_P(pts.concat([[pts[pts.length - 1][0], bottom], [pts[0][0], bottom]])); }
function n3_band(top, bot) { return n3_P(top.concat(bot.slice().reverse())); }
function n3_spark(x, y, r) { return n3_P([[x, y - r], [x + r * 0.22, y - r * 0.22], [x + r, y], [x + r * 0.22, y + r * 0.22], [x, y + r], [x - r * 0.22, y + r * 0.22], [x - r, y], [x - r * 0.22, y - r * 0.22]]); }
function n3_pine(x, y, h, w) { w = w || h * 0.36; var p = [[x - w, y + 1]]; for (var k = 0; k < 4; k++) { var a = k / 4, b = (k + 1) / 4, ww = w * (1 - a * 0.78), w2 = w * (1 - b * 0.78); p.push([x - ww * 0.55, y - h * (a + 0.12)]); p.push([x - w2 * 1.05, y - h * (b - 0.02)]); } p.push([x, y - h]); for (k = 3; k >= 0; k--) { a = k / 4; b = (k + 1) / 4; ww = w * (1 - a * 0.78); w2 = w * (1 - b * 0.78); p.push([x + w2 * 1.05, y - h * (b - 0.02)]); p.push([x + ww * 0.55, y - h * (a + 0.12)]); } p.push([x + w, y + 1]); return n3_P(p); }
// a monstera leaf: heart-shaped blade with slits, stem at (x,y), pointing ang degrees (0 = right), len long
function n3_monsteraPts(x, y, len, ang, splits) {
  var TH = [0, 0.06, 0.25, 0.5, 0.75, 0.9, 1], RR = [0.6, 0.52, 0.48, 0.44, 0.46, 0.4, 0.3], up = [], i, s, sp = splits || 0;
  function rad(t) { for (var k = 1; k < TH.length; k++) if (t <= TH[k]) return RR[k - 1] + (RR[k] - RR[k - 1]) * (t - TH[k - 1]) / (TH[k] - TH[k - 1]); return 0.3; }
  for (i = 0; i <= 60; i++) { var t = i / 60, rr = rad(t);
    for (s = 0; s < sp; s++) { var c = 0.2 + 0.6 * (s + 0.5) / sp, d = Math.abs(t - c); if (d < 0.022) rr = Math.min(rr, 0.13 + d * 7); }
    up.push([0.42 * len + rr * len * Math.cos(t * Math.PI), rr * len * Math.sin(t * Math.PI) * 1.05]); }
  var lo = up.slice(1, -1).reverse().map(function (p) { return [p[0], -p[1]]; });
  return rotp(up.concat(lo), x, y, ang);
}
function n3_monstera(x, y, len, ang, splits) { return n3_P(n3_monsteraPts(x, y, len, ang, splits)); }
function n3_frond(x, y, len, ang, w, droop) { var d = '', pts = [], i, a0 = ang * Math.PI / 180; for (i = 0; i <= 12; i++) { var t = i / 12; pts.push([x + Math.cos(a0) * len * t, y + Math.sin(a0) * len * t + droop * len * t * t]); } d += n3_tube(pts, w * 0.25, w * 0.08); for (i = 2; i <= 12; i++) { var p = pts[i], q = pts[Math.max(0, i - 1)], dir = Math.atan2(p[1] - q[1], p[0] - q[0]) * 180 / Math.PI, l2 = w * (1.6 - i / 12) * 2.2; d += n3_leaf(p[0], p[1], l2, l2 * 0.16, dir - 55, 0.1) + n3_leaf(p[0], p[1], l2, l2 * 0.16, dir + 55, -0.1); } return d; }
// one planting clump into the colour buckets o (dark, mid, light, yel, acc1, acc2, stem). s = scale (1 is a small pot plant)
function n3_clump(type, x, y, s, rnd, o) {
  var i, a, len;
  if (type === 'mon') { [-150, -118, -70, -34].forEach(function (b, k) { a = b + (rnd() - 0.5) * 16; len = (30 + rnd() * 14) * s; var sx = x + Math.cos(a * Math.PI / 180) * len * 0.35, sy = y + Math.sin(a * Math.PI / 180) * len * 0.35;
      o.stem += n3_tube([[x, y], [sx, sy]], 2.2 * s, 1.6 * s); o[k % 2 ? 'mid' : 'dark'] += n3_monstera(sx, sy, len, a + (a < -90 ? -14 : 14), 2 + (len > 38 * s ? 1 : 0)); }); }
  else if (type === 'fern') { for (i = 0; i < 8; i++) { a = -172 + i * 23 + (rnd() - 0.5) * 10; len = (36 + rnd() * 16) * s; o[i % 2 ? 'light' : 'mid'] += n3_frond(x, y, len, a, 5.5 * s, 0.55); } }
  else if (type === 'banana') { o.mid += n3_tube([[x, y], [x + 2 * s, y - 34 * s]], 6 * s, 4 * s); [-122, -84, -52].forEach(function (b) { a = b + (rnd() - 0.5) * 12; len = (62 + rnd() * 24) * s; o.yel += n3_leaf(x + 2 * s, y - 30 * s, len, 12 * s, a, (a < -90 ? -0.18 : 0.18)); }); o.light += n3_leaf(x + 2 * s, y - 30 * s, 50 * s, 9 * s, -96, 0.05); }
  else if (type === 'spiky') { for (i = 0; i < 7; i++) { a = -90 + (i - 3) * 9 + (rnd() - 0.5) * 6; len = (34 + rnd() * 22) * s; o.dark += n3_leaf(x + (i - 3) * 1.5 * s, y, len, 3.6 * s, a, 0); o.light += n3_leaf(x + (i - 3) * 1.5 * s, y - 2 * s, len * 0.55, 1.4 * s, a, 0); } }
  else if (type === 'bush') { var bc = [[0, -12, 13], [-11, -6, 10], [11, -6, 10], [-5, -20, 9], [7, -19, 9]]; bc.forEach(function (q, k) { o[k < 3 ? 'mid' : 'light'] += n3_C(x + q[0] * s, y + q[1] * s, q[2] * s); });
      var fr = Math.min(s, 1.5); for (i = 0; i < 7 + Math.round(s * 3); i++) { var fx = x + (rnd() - 0.5) * 26 * s, fy = y - (6 + rnd() * 20) * s, rr = (2.2 + rnd() * 1.4) * fr; o.acc1 += n3_C(fx, fy, rr) + n3_C(fx + rr * 1.4, fy + rr * 0.3, rr * 0.8); } }
  else if (type === 'bird') { for (i = 0; i < 5; i++) { a = -90 + (i - 2) * 17 + (rnd() - 0.5) * 8; len = (40 + rnd() * 12) * s; var bx = x + Math.cos(a * Math.PI / 180) * len * 0.45, by = y + Math.sin(a * Math.PI / 180) * len * 0.45; o.stem += n3_tube([[x, y], [bx, by]], 1.8 * s, 1.4 * s); o[i % 2 ? 'mid' : 'dark'] += n3_leaf(bx, by, len * 0.7, 8 * s, a, 0); }
      [[-6, -40], [8, -46]].forEach(function (q) { var fx = x + q[0] * s, fy = y + q[1] * s; o.stem += n3_tube([[x, y], [fx, fy]], 1.6 * s, 1.4 * s); o.acc2 += n3_P([[fx - 2 * s, fy], [fx + 14 * s, fy - 3 * s], [fx + 4 * s, fy - 8 * s], [fx + 10 * s, fy - 14 * s], [fx - 1 * s, fy - 6 * s]]); o.dark += n3_P([[fx - 3 * s, fy + 2 * s], [fx + 13 * s, fy - 1 * s], [fx + 2 * s, fy + 3 * s]]); }); }
  else { /* anthurium: heart leaves and red spathes */ for (i = 0; i < 5; i++) { a = -150 + i * 28 + (rnd() - 0.5) * 10; len = (20 + rnd() * 8) * s; var hx = x + Math.cos(a * Math.PI / 180) * len * 0.7, hy = y + Math.sin(a * Math.PI / 180) * len * 0.7; o.stem += n3_tube([[x, y], [hx, hy]], 1.4 * s, 1.2 * s); o[i % 2 ? 'dark' : 'mid'] += n3_monstera(hx, hy, len, a, 0); }
      [[-8, -26, -110], [9, -30, -70]].forEach(function (q) { o.acc1 += n3_monstera(x + q[0] * s, y + q[1] * s, 13 * s, q[2], 0); o.yel += n3_RE(x + q[0] * s + Math.cos(q[2] * Math.PI / 180) * 6 * s, y + q[1] * s + Math.sin(q[2] * Math.PI / 180) * 6 * s - 3 * s, 1.4 * s, 4 * s, q[2] + 100); }); }
}
function n3_bucket() { return {dark: '', mid: '', light: '', yel: '', acc1: '', acc2: '', stem: ''}; }

// ======================================================================
// 1. Greenhouse: inside a Victorian glass greenhouse, seen down its length. Curved iron ribs recede toward the far glass wall
//    and its door, planting beds overflow on both sides of a tiled aisle, palms reach the roof, baskets hang from the ribs.
// ======================================================================
SCENES.greenhouse = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(10), refl = Lay(0), mid = Lay(0.4), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#0E1D22 0%,#13252A 30%,#1F3A3C 66%,#3F5A55 100%)' : 'linear-gradient(180deg,#BFE2CF 0%,#CDE9DA 30%,#EEF7EF 62%,#F7F1E3 100%)';
  var vx = W * 0.5, vy = H * (ph ? 0.44 : 0.43), L = -W * (ph ? 0.36 : 0.27), B = H * (ph ? 0.12 : 0.13), E = -H * (ph ? 0.09 : 0.11), R = -H * (ph ? 0.2 : 0.27), K = B - H * 0.045, Ae = -L * 0.24, hE = H * 0.012;
  function arch(m, c) { return [vx - L * m * c, vy + (E + (R - E) * Math.sqrt(Math.max(0, 1 - c * c))) * m]; }   // c: -1 left eave .. 1 right eave
  function prof(m, n) { var o = [[vx + L * m, vy + B * m]]; for (var i = 0; i <= n; i++) { var a = Math.PI - i / n * Math.PI; o.push([vx - L * m * Math.cos(a), vy + (E + (R - E) * Math.sin(a)) * m]); } o.push([vx - L * m, vy + B * m]); return o; }
  function P(m, px, py) { return [vx + px * m, vy + py * m]; }
  var cols = dk ? {glass: 'rgba(120,170,160,0.10)', ceil: 'rgba(90,140,135,0.13)', frame: '#5C7C75', thin: 'rgba(120,160,150,0.42)', knee: '#2E3B38', kneeL: '#43534E', floor: '#3A3A34', tile: '#4E4038', soil: '#231C17', shade: 'rgba(0,8,8,0.4)'} :
    {glass: 'rgba(255,255,255,0.20)', ceil: 'rgba(235,250,244,0.34)', frame: '#FFFFFF', thin: 'rgba(255,255,255,0.85)', knee: '#C9A68A', kneeL: '#E6CDB5', floor: '#F3E8D6', tile: '#E6B497', soil: '#6E5442', shade: 'rgba(80,60,40,0.18)'};
  var G = dk ? {dark: '#173A2B', mid: '#23533B', light: '#3A7350', yel: '#4F7036', acc1: '#C46282', acc2: '#C8783C', stem: '#2B5A3E'} : {dark: '#2E7A4D', mid: '#4C9E5C', light: '#88C97A', yel: '#A9C94E', acc1: '#F2779A', acc2: '#F59338', stem: '#4A9058'};
  // ---- outside, through the glass (blurred): garden trees and the sun or moon
  if (dk) { add(far, 'a', n3_E(W * 0.72, H * 0.13, W * 0.16, H * 0.12), 'rgba(200,230,220,0.2)'); add(far, 'b', n3_C(W * 0.72, H * 0.13, ph ? 14 : 22), 'rgba(240,250,235,0.85)'); }
  else { add(far, 'a', n3_E(W * 0.68, H * 0.1, W * 0.18, H * 0.13), 'rgba(255,250,225,0.7)'); add(far, 'b', n3_C(W * 0.68, H * 0.1, ph ? 22 : 34), 'rgba(255,253,240,0.95)'); }
  var trees = '', trees2 = '';
  spread(-40, vy + B - H * 0.22, W + 80, H * 0.12, ph ? 60 : 90, 40, rnd, 0.6).forEach(function (c) { var r = (ph ? 26 : 40) * (0.7 + c.r * 0.6); trees += n3_C(c.x, c.y, r) + n3_C(c.x + r * 0.7, c.y + r * 0.3, r * 0.7); });
  spread(-40, vy + B - H * 0.12, W + 80, H * 0.08, ph ? 46 : 70, 30, rnd, 0.6).forEach(function (c) { trees2 += n3_C(c.x, c.y, (ph ? 20 : 30) * (0.7 + c.r * 0.5)); });
  add(far, 'c', trees, dk ? '#22403F' : '#B4DCC0'); add(far, 'd', trees2 + rect(-60, vy + B - H * 0.06, W + 120, H * 0.5), dk ? '#1A3233' : '#98CDA7');
  // ---- the glass house: far wall, roof glass, knee walls, aisle, beds
  var back = prof(1, 28), far7 = prof(7, 28), ceil = '';
  add(refl, 'a', n3_P(back), cols.glass);
  for (var i = 1; i < back.length - 2; i++) ceil += n3_P([back[i], back[i + 1], far7[i + 1], far7[i]]);
  add(refl, 'b', ceil, cols.ceil);
  var kw = n3_P([P(1, L, B), P(1, L, K), P(1, -L, K), P(1, -L, B)]) + n3_P([P(1, L, B), P(7, L, B), P(7, L, K), P(1, L, K)]) + n3_P([P(1, -L, B), P(1, -L, K), P(7, -L, K), P(7, -L, B)]);
  var edge = n3_P([P(1, -Ae, B), P(1, -Ae, B - hE), P(9, -Ae, B - hE), P(9, -Ae, B)]) + n3_P([P(1, Ae, B), P(9, Ae, B), P(9, Ae, B - hE), P(1, Ae, B - hE)]);
  add(refl, 'c', kw + edge, cols.knee);
  var kwTop = n3_P([P(1, L, K), P(1, L, K - 3), P(1, -L, K - 3), P(1, -L, K)]) + n3_P([P(1, -Ae, B - hE), P(9, -Ae, B - hE), P(9, -Ae - 2.5, B - hE), P(1, -Ae - 2.5, B - hE)]) + n3_P([P(1, Ae + 2.5, B - hE), P(9, Ae + 2.5, B - hE), P(9, Ae, B - hE), P(1, Ae, B - hE)]);
  add(refl, 'd', kwTop, cols.kneeL);
  add(refl, 'e', n3_P([P(1, -Ae, B), P(1, Ae, B), P(9, Ae, B), P(9, -Ae, B)]), cols.floor);
  var NT = 4, tiles = '', mk = [1]; while (mk[mk.length - 1] < 9) mk.push(mk[mk.length - 1] * 1.13);
  for (var r = 0; r < mk.length - 1; r++) for (var c = 0; c < NT; c++) { if ((r + c) % 2) continue; var x0 = -Ae + 2 * Ae * c / NT, x1 = -Ae + 2 * Ae * (c + 1) / NT; tiles += n3_P([P(mk[r], x0, B), P(mk[r], x1, B), P(mk[r + 1], x1, B), P(mk[r + 1], x0, B)]); }
  add(refl, 'f', tiles, cols.tile);
  add(refl, 'h', n3_P([P(1, L, B - hE), P(1, -Ae, B - hE), P(9, -Ae, B - hE), P(9, L, B - hE)]) + n3_P([P(1, Ae, B - hE), P(1, -L, B - hE), P(9, -L, B - hE), P(9, Ae, B - hE)]), cols.soil);
  // iron ribs (tubes that thicken toward us), the far door, mullions, purlins and a fanlight
  var ribs = '', thin = '', mull = '';
  [1, 1.3, 1.72, 2.38, 3.45, 5.2].forEach(function (m) { ribs += n3_tube(prof(m, 30), 2.2 * m, 2.2 * m); });
  var dw = Ae * 0.75, dh = (B - E) * 0.72, dTop = B - dh;
  ribs += n3_tube([[vx - dw, vy + B], [vx - dw, vy + dTop], [vx + dw, vy + dTop], [vx + dw, vy + B]], 3, 3) + rect(vx - 1.2, vy + dTop, 2.4, dh) + n3_tube(n3_bz([vx - dw, vy + dTop], [vx - dw, vy + dTop - dw * 0.9], [vx + dw, vy + dTop - dw * 0.9], [vx + dw, vy + dTop], 12), 3, 3);
  var pp = prof(1, 12); pp.forEach(function (p, k) { if (k === 0 || k === pp.length - 1) return; thin += seg(p[0], p[1], vx + (p[0] - vx) * 7, vy + (p[1] - vy) * 7); });
  [0.4].forEach(function (f) { var y = E + (K - E) * f; thin += seg(vx + L, vy + y, vx + L * 7, vy + y * 7) + seg(vx - L, vy + y, vx - L * 7, vy + y * 7); });
  for (var k2 = 1; k2 < 8; k2++) { var cc = -1 + 2 * k2 / 8, top = arch(1, cc); if (Math.abs(top[0] - vx) < dw + 2) continue; mull += seg(top[0], vy + K, top[0], top[1]); }
  mull += seg(vx + L, vy + (E + K) / 2, vx - dw, vy + (E + K) / 2) + seg(vx + dw, vy + (E + K) / 2, vx - L, vy + (E + K) / 2);
  for (k2 = 1; k2 < 6; k2++) { var a = Math.PI - k2 / 6 * Math.PI; mull += seg(vx, vy + E, vx - L * Math.cos(a), vy + E + (R - E) * Math.sin(a)); }
  mull += 'M' + PT(vx + L * 0.3, vy + E) + ' A' + n1(-L * 0.3) + ' ' + n1(-(R - E) * 0.3) + ' 0 0 1 ' + PT(vx - L * 0.3, vy + E) + ' ' + seg(vx + L, vy + E, vx - L, vy + E);
  add(refl, 'g', ribs, cols.frame);
  stk(refl, 's', mull, cols.thin, 1.6); stk(refl, 't', thin, cols.thin, 1.2);
  // ---- planting: the far row, both beds (near halves go into the front layer), two palms
  var Mo = n3_bucket(), No = n3_bucket(), trunks = '';
  for (var bx = L + 8; bx < -L - 8; bx += ph ? 22 : 34) { if (Math.abs(bx) < dw + 6) continue; var p0 = P(1.02, bx, B); n3_clump(['bush', 'fern', 'spiky', 'anth', 'mon'][Math.floor(rnd() * 5)], p0[0], p0[1], (ph ? 0.4 : 0.55) * (0.8 + rnd() * 0.4), rnd, Mo); }
  [-1, 1].forEach(function (sd) {
    var wallX = sd * -L, edgeX = sd * Ae;
    for (var m = 1.04; m < 8; m *= 1.11) {
      for (var g = 0; g < 7; g++) { var gu = rnd(), gp = P(m * (1 + rnd() * 0.1), wallX + (edgeX - wallX) * gu, B - hE), gs = m * (ph ? 0.5 : 0.7); (m < 2.1 ? Mo : No)[g % 2 ? 'mid' : 'dark'] += n3_E(gp[0], gp[1] - 2 * gs, (9 + rnd() * 7) * gs, (5 + rnd() * 3) * gs); }
      [0.16, 0.5, 0.84].forEach(function (u, j) {
        var mm = m * (1 + (rnd() - 0.5) * 0.08), bxx = wallX + (edgeX - wallX) * u, p = P(mm, bxx, B - hE), s = mm * (ph ? 0.62 : 0.92) * (0.85 + rnd() * 0.3) * (j === 0 ? 1.15 : 1);
        if (p[0] < -70 * s || p[0] > W + 70 * s || p[1] > H + 30 * s) return;
        var types = j === 0 ? ['banana', 'bird', 'mon', 'banana'] : j === 1 ? ['mon', 'fern', 'bird', 'spiky'] : ['fern', 'bush', 'anth', 'spiky'];
        n3_clump(types[Math.floor(rnd() * types.length)], p[0], p[1], s, rnd, mm < 2.1 ? Mo : No);
      });
    }
  });
  (ph ? [[-1, 1.6, 0.3]] : [[-1, 1.55, 0.25], [1, 2.05, 0.3]]).forEach(function (q) { var sd = q[0], m = q[1], base = P(m, sd * -L + (sd * Ae - sd * -L) * q[2], B - hE), s = m * (ph ? 0.5 : 0.62), x = base[0], y = base[1], topY = H * (ph ? 0.14 : 0.1), th = y - topY;
    var trunk = []; for (var i = 0; i <= 12; i++) { var t = i / 12; trunk.push([x + Math.sin(t * 2.4) * 14 * s * sd, y - th * t]); }
    trunks += n3_tube(trunk, 14 * s, 9 * s); var tx = trunk[12][0], ty = trunk[12][1];
    for (var f = 0; f < 10; f++) { var ang = -180 + f * 20 + (rnd() - 0.5) * 8, fr = n3_frond(tx, ty, (96 + rnd() * 30) * s, ang, 11 * s, 0.45 + Math.abs(Math.cos(ang * Math.PI / 180)) * 0.35); if (f % 2) Mo.mid += fr; else Mo.dark += fr; }
    for (var k = 0; k < 5; k++) trunks += n3_RE(trunk[k * 2 + 1][0], trunk[k * 2 + 1][1], 8 * s, 2.6 * s, 0); });
  add(mid, 'a', Mo.dark, G.dark); add(mid, 'b', Mo.mid + Mo.stem, G.mid); add(mid, 'c', Mo.light, G.light); add(mid, 'd', Mo.yel, G.yel);
  add(mid, 'e', Mo.acc1, G.acc1); add(mid, 'f', Mo.acc2, G.acc2); add(mid, 'h', trunks, dk ? '#4A3A2C' : '#A47A55');
  // ---- hanging baskets, grow lamps and misting nozzles hang from the ribs (the engine moves them)
  var baskets = []; (ph ? [[1.3, -0.62], [1.3, 0.62], [1.72, -0.2]] : [[1.3, -0.46], [1.3, 0.56], [1.72, -0.74], [1.72, 0.28], [2.38, -0.16]]).forEach(function (q, j) { var m = q[0], a = arch(m, q[1]), s = m * (ph ? 0.6 : 0.8);
    baskets.push({x: a[0], y: Math.max(-12, a[1]), len: (30 + (j % 3) * 20) * s, s: s, k: j}); });
  var lamps = (ph ? [[-0.22, 1.3]] : [[-0.12, 1.3], [0.5, 1.72]]).map(function (q) { var a = arch(q[1], q[0]); return {x: a[0], top: Math.max(-20, a[1]), y: Math.max(-20, a[1]) + (ph ? 40 : 64) * q[1] * 0.7, s: q[1] * (ph ? 0.6 : 0.8)}; });
  var noz = []; (ph ? [-0.7, 0.08, 0.7] : [-0.84, -0.52, 0.12, 0.44, 0.84]).forEach(function (c) { var a = arch(1.3, c); if (a[1] > 4) noz.push({x: a[0], y: a[1] + 3, s: ph ? 0.8 : 1}); });
  // ---- front: the beds' near halves, the night-bloom pot in the aisle, a watering can
  var fl = P(ph ? 2.5 : 2.6, 0, B), fs = ph ? 1.1 : 1.6;
  add(near, 'a', No.dark, G.dark); add(near, 'b', No.mid + No.stem, G.mid); add(near, 'c', No.light + No.yel, G.light); add(near, 'e', No.acc1 + No.acc2, G.acc1);
  add(near, 'g', n3_E(fl[0], fl[1] + 1, 34 * fs, 6 * fs), cols.shade);
  add(near, 'f', n3_P([[fl[0] - 25 * fs, fl[1] - 34 * fs], [fl[0] + 25 * fs, fl[1] - 34 * fs], [fl[0] + 19 * fs, fl[1]], [fl[0] - 19 * fs, fl[1]]]) + rrect(fl[0] - 29 * fs, fl[1] - 41 * fs, 58 * fs, 9 * fs, 3), dk ? '#8A5A44' : '#E59468');
  add(near, 'g', n3_P([[fl[0] + 7 * fs, fl[1] - 34 * fs], [fl[0] + 25 * fs, fl[1] - 34 * fs], [fl[0] + 19 * fs, fl[1]], [fl[0] + 6 * fs, fl[1]]]) + rect(fl[0] - 29 * fs, fl[1] - 33 * fs, 58 * fs, 2.5 * fs));
  var epi = '';
  [[-158, 48, 0.28], [-126, 56, -0.2], [-58, 58, 0.2], [-24, 46, -0.28], [-100, 36, 0.12]].forEach(function (q) { epi += n3_leaf(fl[0], fl[1] - 40 * fs, q[1] * fs, 7 * fs, q[0], q[2]); });
  epi += n3_tube(n3_bz([fl[0] + 2 * fs, fl[1] - 40 * fs], [fl[0] + 4 * fs, fl[1] - 64 * fs], [fl[0] + 12 * fs, fl[1] - 78 * fs], [fl[0] + 10 * fs, fl[1] - 92 * fs], 12), 3 * fs, 2.2 * fs);
  add(near, 'h', epi, dk ? '#2F6A48' : '#4C9E5E');
  var wc = P(ph ? 2.2 : 2.3, Ae * 0.55, B), ws = ph ? 0.85 : 1.15, cx = wc[0], cy = wc[1];
  var can = rrect(cx - 16 * ws, cy - 28 * ws, 32 * ws, 28 * ws, 6 * ws) + n3_tube([[cx + 12 * ws, cy - 9 * ws], [cx + 27 * ws, cy - 26 * ws], [cx + 34 * ws, cy - 37 * ws]], 5 * ws, 4 * ws) + n3_RE(cx + 36 * ws, cy - 39 * ws, 6 * ws, 3.5 * ws, -40) + n3_tube(n3_bz([cx - 12 * ws, cy - 26 * ws], [cx - 12 * ws, cy - 46 * ws], [cx + 8 * ws, cy - 46 * ws], [cx + 8 * ws, cy - 26 * ws], 10), 3.6 * ws, 3.6 * ws);
  add(near, 'd', can, dk ? '#4E7C86' : '#6FB4C0');
  // corner monsteras (the engine sways them)
  var corners = ph ? [{x: -14, y: H + 8, len: 120, ang: -60, sp: 3}, {x: W + 14, y: H + 8, len: 112, ang: -122, sp: 3}] :
    [{x: -24, y: H + 14, len: 200, ang: -54, sp: 3}, {x: -46, y: H * 0.8, len: 160, ang: -18, sp: 3}, {x: W + 24, y: H + 14, len: 190, ang: -128, sp: 3}, {x: W + 40, y: H * 0.78, len: 150, ang: -164, sp: 2}];
  if (ANIM) {
    ANIM.vp = [vx, vy]; ANIM.baskets = baskets; ANIM.corners = corners; ANIM.flower = {x: fl[0] + 10 * fs, y: fl[1] - 92 * fs, s: fs}; ANIM.lamps = lamps; ANIM.noz = noz;
    ANIM.glass = {L: L, E: E, R: R, vx: vx, vy: vy}; ANIM.ph = ph;
  } else {
    var mon = '', bk = '', ch = '', bl = '';
    corners.forEach(function (c) { mon += n3_monstera(c.x, c.y, c.len, c.ang, c.sp); });
    baskets.forEach(function (b) { ch += seg(b.x, b.y, b.x, b.y + b.len); bk += n3_P([[b.x - 15 * b.s, b.y + b.len], [b.x + 15 * b.s, b.y + b.len], [b.x + 9 * b.s, b.y + b.len + 12 * b.s], [b.x - 9 * b.s, b.y + b.len + 12 * b.s]]); for (var j = 0; j < 6; j++) bl += n3_leaf(b.x - 13 * b.s + j * 5.2 * b.s, b.y + b.len + 2 * b.s, (16 + (j * 7) % 18) * b.s, 3.4 * b.s, 70 + j * 8, 0); });
    add(near, 'a', mon); add(mid, 'g', bk, dk ? '#7A4A36' : '#D9845C'); add(mid, 'b', bl); stk(mid, 't', ch, dk ? '#6A7A74' : '#8A8F88', 1);
    add(near, 'h', n3_RE(fl[0] + 10 * fs, fl[1] - 98 * fs, 5 * fs, 12 * fs, 15));
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// ======================================================================
// 2. Pottery Studio: a sunlit studio wall under a wooden beam, a big paned window with plants on the sill, a tall shelf unit of
//    drying and glazed pots, an arched brick kiln with a glowing door, a work table, and the wheel on the floor in front.
// ======================================================================
// pot outline standing on (x,y), w = widest width, h = height. kinds: 0 bowl, 1 vase, 2 jug, 3 cylinder, 4 round jar, 5 plate on edge
function n3_potProf(kind) {
  if (kind === 0) return function (u) { return 0.26 + 0.24 * Math.sqrt(u); };
  if (kind === 1) return function (u) { return u < 0.7 ? 0.2 + 0.3 * Math.sin(Math.PI * u / 0.7 * 0.85) : 0.13 + 0.07 * Math.pow((u - 0.7) / 0.3, 2) + (u > 0.94 ? 0.05 : 0); };
  if (kind === 2) return function (u) { return 0.3 + 0.2 * Math.sin(Math.PI * u * 0.85) + (u > 0.92 ? 0.03 : 0); };
  if (kind === 3) return function (u) { return 0.4 + 0.06 * u; };
  if (kind === 4) return function (u) { return u < 0.88 ? 0.18 + 0.32 * Math.sin(Math.PI * u / 0.88) : 0.2; };
  return function (u) { return 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow(u * 2 - 1, 2))) + 0.02; };
}
function n3_potPts(kind, x, y, w, h) { var o = [], n = 14, i, prof = n3_potProf(kind); for (i = 0; i <= n; i++) { var u = i / n; o.push([x + prof(u) * w, y - u * h]); } for (i = n; i >= 0; i--) { u = i / n; o.push([x - prof(u) * w, y - u * h]); } return o; }
SCENES.pottery = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(6), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#1B1417 0%,#221A1E 30%,#3E2C2A 72%,#6A4030 100%)' : 'linear-gradient(180deg,#E3CDB7 0%,#EAD7C3 22%,#F6ECE1 58%,#E6CBB0 86%,#D9B79A 100%)';
  var fy = H * (ph ? 0.8 : 0.78), bmH = ph ? 16 : 24;
  // ---- the window and the view through it
  var wx0 = W * (ph ? 0.06 : 0.04), wx1 = W * (ph ? 0.56 : 0.3), wy0 = H * (ph ? 0.06 : 0.1), wy1 = H * (ph ? 0.3 : 0.5), fr = ph ? 7 : 11;
  add(far, 'a', rect(wx0, wy0, wx1 - wx0, wy1 - wy0), dk ? '#1C2442' : '#BFE0F0');
  var hz = wy0 + (wy1 - wy0) * 0.6, hills = n3_fn(wx0 - 10, wx1 + 10, 8, function (x) { return hz - Math.sin(x / 70 + 1) * 10 - Math.sin(x / 23) * 3; }), hills2 = n3_fn(wx0 - 10, wx1 + 10, 8, function (x) { return hz + 24 - Math.sin(x / 50 + 3) * 8; });
  add(far, 'b', n3_band(hills, hills.map(function (p) { return [p[0], wy1 + 4]; })), dk ? '#26304E' : '#A9D2B4');
  var trees = ''; for (var tx = wx0 + 14; tx < wx1 - 8; tx += 24 + rnd() * 16) trees += n3_C(tx, hz + 20 + rnd() * 6, 10 + rnd() * 9);
  add(far, 'c', n3_band(hills2, hills2.map(function (p) { return [p[0], wy1 + 4]; })) + trees, dk ? '#1A2238' : '#7DBB8E');
  var sx = wx0 + (wx1 - wx0) * 0.7, sy = wy0 + (wy1 - wy0) * 0.24;
  if (dk) { add(far, 'd', n3_C(sx, sy, ph ? 11 : 16), '#F4EED8'); var st = ''; spread(wx0 + 6, wy0 + 6, wx1 - wx0 - 12, (wy1 - wy0) * 0.5, 22, 22, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - sx, c.y - sy) > 26) st += n3_C(c.x, c.y, 0.7 + c.r); }); add(far, 'e', st, 'rgba(255,248,225,0.85)'); }
  else { add(far, 'd', n3_C(sx, sy, ph ? 26 : 40), 'rgba(255,252,236,0.95)'); add(far, 'e', n3_E(wx0 + (wx1 - wx0) * 0.3, wy0 + (wy1 - wy0) * 0.32, 40, 9) + n3_E(wx0 + (wx1 - wx0) * 0.38, wy0 + (wy1 - wy0) * 0.29, 24, 9), '#FFFFFF'); }
  var frame = rect(wx0 - fr, wy0 - fr, wx1 - wx0 + fr * 2, fr) + rect(wx0 - fr, wy0, fr, wy1 - wy0) + rect(wx1, wy0, fr, wy1 - wy0);
  var nx = 2, ny = ph ? 2 : 3; for (var i = 1; i < nx; i++) frame += rect(wx0 + (wx1 - wx0) * i / nx - fr * 0.3, wy0, fr * 0.6, wy1 - wy0); for (i = 1; i < ny; i++) frame += rect(wx0, wy0 + (wy1 - wy0) * i / ny - fr * 0.3, wx1 - wx0, fr * 0.6);
  add(refl, 'b', frame, dk ? '#4A3A36' : '#FBF6EE');
  add(refl, 'c', rect(wx0 - fr * 2.2, wy1, wx1 - wx0 + fr * 4.4, fr * 1.1), dk ? '#6A4C3E' : '#D2A47A');
  add(refl, 'g', rect(wx0 - fr * 2.2, wy1 + fr * 1.1, wx1 - wx0 + fr * 4.4, fr * 0.6) + rect(wx0, wy0, wx1 - wx0, 5) + rect(wx0, wy0, 5, wy1 - wy0), dk ? 'rgba(0,0,0,0.3)' : 'rgba(120,80,50,0.16)');
  // ---- wall plaster patches, wainscot, ceiling beam, floor
  var blot = ''; spread(0, bmH, W, fy - bmH - H * 0.16, ph ? 120 : 170, 110, rnd, 0.9).forEach(function (c) { if (c.q < 0.55 && (c.x < wx0 - 20 || c.x > wx1 + 20 || c.y > wy1 + 20)) blot += n3_E(c.x, c.y, 30 + c.r * 40, 14 + c.k * 14); });
  void blot;
  add(refl, 'a', rect(-40, fy - H * 0.15, W + 80, H * 0.15), dk ? '#2E2226' : '#E0C3A6');
  var boards = ''; for (var bx = 6; bx < W; bx += ph ? 30 : 44) boards += seg(bx, fy - H * 0.15 + 6, bx, fy - 10);
  add(refl, 'h', rect(-40, -10, W + 80, bmH + 10) + rect(-40, fy - H * 0.15, W + 80, 5) + rect(-40, fy - 10, W + 80, 10), dk ? '#3E2C26' : '#9A6844');
  add(refl, 'e', rect(-40, fy, W + 80, H - fy + 40), dk ? '#3A2A26' : '#D9B596');
  var planks = ''; for (var yy = fy + 6, k = 0; yy < H + 10; k++) { yy += 9 + k * 6; planks += seg(-40, yy, W + 40, yy); for (var xx = (k * 131) % 240 - 60; xx < W + 40; xx += 210 + (k % 3) * 50) planks += seg(xx, yy, xx + 6, yy - 9 - k * 6 + 2); }
  stk(refl, 's', planks + boards, dk ? 'rgba(0,0,0,0.28)' : 'rgba(130,80,45,0.24)', 1.4);
  var spl = ''; spread(0, fy + 8, W, H - fy - 8, ph ? 70 : 110, 40, rnd, 1).forEach(function (c) { if (c.q < 0.4) spl += n3_E(c.x, c.y, 4 + c.r * 9, 1.5 + c.k * 2.5); });
  add(refl, 'f', spl, dk ? 'rgba(160,130,110,0.22)' : 'rgba(165,125,95,0.28)');
  // ---- the shelf unit: uprights and boards full of pots
  var shx0 = ph ? W * 0.6 : W * 0.355, shx1 = ph ? W * 1.04 : W * 0.78, shelfY = ph ? [H * 0.15, H * 0.28, H * 0.41, H * 0.54, H * 0.67] : [H * 0.2, H * 0.36, H * 0.52, H * 0.66], bt = ph ? 6 : 9, unit = '';
  shelfY.forEach(function (y) { unit += rect(shx0, y, shx1 - shx0, bt); });
  unit += rect(shx0 - 4, shelfY[0] - (ph ? 50 : 70), ph ? 7 : 10, fy - shelfY[0] + (ph ? 50 : 70)) + rect(shx1 - (ph ? 3 : 6), shelfY[0] - (ph ? 50 : 70), ph ? 7 : 10, fy - shelfY[0] + (ph ? 50 : 70)) + rect(shx0 - 6, shelfY[0] - (ph ? 54 : 76), shx1 - shx0 + 12, ph ? 6 : 9);
  add(refl, 'd', unit, dk ? '#5E4234' : '#B07A50');
  var gl = {grn: '', bsq: '', g1: '', g2: '', g3: '', g4: '', sh: '', hi: ''}, potList = [];
  var rowsTop = [shelfY[0] - (ph ? 50 : 70)].concat(shelfY);
  shelfY.forEach(function (y, row) { var x = shx0 + 10, room = y - rowsTop[row] - 8; while (x < shx1 - 14) { var kind = Math.floor(rnd() * 6), h = Math.min(room, (ph ? 24 : 40) * (0.65 + rnd() * 0.55)) * (kind === 0 ? 0.6 : kind === 5 ? 0.85 : 1), w = h * (kind === 0 ? 2.2 : kind === 3 ? 0.8 : kind === 5 ? 1 : 1.0), cx = x + w / 2;
    if (cx + w / 2 > shx1 - 8) break; var key = ['grn', 'grn', 'bsq', 'g1', 'g2', 'g3', 'g4'][Math.floor(rnd() * 7)]; if (row < 1 && rnd() < 0.5) key = 'grn';
    var pts = n3_potPts(kind, cx, y, w, h); gl[key] += n3_P(pts);
    var rs = pts.slice(0, 15); gl.sh += n3_P(rs.concat(rs.map(function (p) { return [cx + (p[0] - cx) * 0.35, p[1]]; }).reverse()));
    if (key !== 'grn') gl.hi += n3_RE(cx - w * 0.18, y - h * 0.55, Math.max(1.2, w * 0.05), h * 0.16, 8);
    if (kind === 2) gl[key] += n3_tube(n3_bz([cx + w * 0.38, y - h * 0.78], [cx + w * 0.8, y - h * 0.82], [cx + w * 0.78, y - h * 0.3], [cx + w * 0.4, y - h * 0.34], 8), ph ? 2.2 : 3.2, ph ? 2.2 : 3.2);
    potList.push({x: cx, y: y - h * 0.5, w: w, h: h}); x += w + 3 + rnd() * 8; } });
  add(mid, 'a', gl.grn, dk ? '#8E8478' : '#DCD3C6'); add(mid, 'b', gl.bsq, dk ? '#A26A54' : '#EDAF90'); add(mid, 'c', gl.g1, dk ? '#2F7C7A' : '#3FA6A0'); add(mid, 'd', gl.g2, dk ? '#36508E' : '#4A68C0');
  add(mid, 'e', gl.g3, dk ? '#B2873A' : '#E5B24A'); add(mid, 'f', gl.g4, dk ? '#7FA290' : '#A8D2BC'); add(mid, 'g', gl.sh, dk ? 'rgba(10,4,6,0.32)' : 'rgba(90,60,40,0.16)'); add(mid, 'h', gl.hi, 'rgba(255,255,255,0.55)');
  // sill plants: succulents in little handmade pots
  var sillY = wy1, sp = '', spl2 = '', spot = '';
  [0.12, 0.62, 0.86].forEach(function (f, j) { var x = wx0 + (wx1 - wx0) * f, s = ph ? 0.7 : 1; spot += n3_P(n3_potPts(j === 1 ? 3 : 0, x, sillY, 22 * s, 16 * s));
    for (var q = 0; q < 6; q++) { var a = -90 + (q - 2.5) * 26, lf = n3_leaf(x, sillY - 15 * s, (j === 1 ? 26 : 14) * s, (j === 1 ? 3.4 : 4.4) * s, a + (rnd() - 0.5) * 10, 0); if (q % 2) spl2 += lf; else sp += lf; } });
  // ---- the arched brick kiln with its chimney
  var kx0 = ph ? W * 0.58 : W * 0.8, kx1 = ph ? W * 1.06 : W * 1.02, kTop = fy - H * (ph ? 0.2 : 0.34), kSpring = kTop + (kx1 - kx0) * 0.32, kby = fy + 4, kcx = (kx0 + kx1) / 2;
  var kOut = [[kx0, kby], [kx0, kSpring]]; for (i = 1; i < 16; i++) { var a = Math.PI - i / 16 * Math.PI; kOut.push([kcx + Math.cos(a) * (kx1 - kx0) / 2, kSpring - Math.sin(a) * (kSpring - kTop)]); } kOut.push([kx1, kSpring], [kx1, kby]);
  var chim = rect(kcx + (kx1 - kx0) * 0.12, -20, ph ? 16 : 24, kTop + 28);
  add(near, 'f', n3_P(kOut) + chim, dk ? '#7A3E2C' : '#BC6442');
  var dx0 = kcx - (kx1 - kx0) * 0.26, dx1 = kcx + (kx1 - kx0) * 0.26, dy1 = kby - (kby - kTop) * 0.12, dSpring = kSpring + (kby - kSpring) * 0.18, dTop = dSpring - (dx1 - dx0) * 0.42;
  var door = [[dx0, dy1], [dx0, dSpring]]; for (i = 1; i < 12; i++) { a = Math.PI - i / 12 * Math.PI; door.push([kcx + Math.cos(a) * (dx1 - dx0) / 2, dSpring - Math.sin(a) * (dSpring - dTop)]); } door.push([dx1, dSpring], [dx1, dy1]);
  var bricks = '', bh = ph ? 9 : 13, rowI = 0;
  for (var by = kby - bh; by > kTop + 4; by -= bh, rowI++) { var half = (kx1 - kx0) / 2 * (by > kSpring ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((kSpring - by) / (kSpring - kTop), 2)))) - 3, inDoor = by > dTop - 4 && by < dy1 + 4;
    var dHalf = (dx1 - dx0) / 2 * (by > dSpring ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((dSpring - by) / (dSpring - dTop), 2)))) + 6;
    if (inDoor) bricks += seg(kcx - half, by, kcx - dHalf, by) + seg(kcx + dHalf, by, kcx + half, by); else bricks += seg(kcx - half, by, kcx + half, by);
    for (var bxx = kcx - half + (rowI % 2 ? 12 : 24); bxx < kcx + half - 4; bxx += ph ? 18 : 30) { if (inDoor && Math.abs(bxx - kcx) < dHalf) continue; bricks += seg(bxx, by, bxx, by + bh); } }
  stk(near, 's', bricks, dk ? 'rgba(30,10,6,0.45)' : 'rgba(120,46,26,0.4)', 1.3);
  add(near, 'g', n3_P(door) + rect(kx0 - 6, kby - 8, kx1 - kx0 + 12, 10), dk ? '#3E3A40' : '#5C5862');
  var peep = [kcx, dSpring + (dy1 - dSpring) * 0.2], arch2 = [];
  for (i = 0; i <= 12; i++) { a = Math.PI - i / 12 * Math.PI; arch2.push([kcx + Math.cos(a) * ((dx1 - dx0) / 2 + 9), dSpring - Math.sin(a) * (dSpring - dTop + 9)]); }
  add(near, 'h', n3_tube(arch2, ph ? 6 : 9, ph ? 6 : 9) + rect(dx1 - 12, dSpring + (dy1 - dSpring) * 0.45, 6, (dy1 - dSpring) * 0.22) + n3_C(peep[0], peep[1], ph ? 5 : 8), dk ? '#5A2E22' : '#8C4430');
  // ---- the work table, clay, bisque bowls, a mug; sacks and a bucket on the floor
  var tbx0 = ph ? -10 : W * 0.02, tbx1 = ph ? W * 0.4 : W * 0.32, tby = fy - H * (ph ? 0.09 : 0.12), legH = fy - tby + 6;
  add(near, 'a', rect(tbx0, tby, tbx1 - tbx0, ph ? 8 : 12) + n3_P([[tbx0 + 4, tby + (ph ? 8 : 12)], [tbx1 - 4, tby + (ph ? 8 : 12)], [tbx1 - 8, tby + (ph ? 14 : 20)], [tbx0 + 8, tby + (ph ? 14 : 20)]]), dk ? '#7A5640' : '#C89262');
  var wood2 = rect(tbx0 + 10, tby + 12, ph ? 6 : 10, legH - 12) + rect(tbx1 - 20, tby + 12, ph ? 6 : 10, legH - 12) + rect(tbx0 + 10, tby + legH * 0.62, tbx1 - tbx0 - 24, ph ? 4 : 6);
  var cs = ph ? 0.7 : 1.05, cl = tbx0 + (tbx1 - tbx0) * 0.14;
  var clay = rrect(cl, tby - 22 * cs, 50 * cs, 22 * cs, 6 * cs) + n3_E(cl + 76 * cs, tby - 12 * cs, 20 * cs, 12 * cs) + n3_E(cl + 100 * cs, tby - 8 * cs, 12 * cs, 8 * cs);
  // clay sacks slumped against the table legs
  var sk = [tbx0 + (tbx1 - tbx0) * 0.3, fy + 6], ss = ph ? 0.75 : 1.15;
  var sacks = n3_P([[sk[0] - 34 * ss, sk[1]], [sk[0] - 30 * ss, sk[1] - 40 * ss], [sk[0] - 20 * ss, sk[1] - 48 * ss], [sk[0] + 16 * ss, sk[1] - 46 * ss], [sk[0] + 26 * ss, sk[1] - 36 * ss], [sk[0] + 30 * ss, sk[1]]]) + n3_P([[sk[0] + 16 * ss, sk[1] + 4], [sk[0] + 20 * ss, sk[1] - 28 * ss], [sk[0] + 30 * ss, sk[1] - 34 * ss], [sk[0] + 60 * ss, sk[1] - 30 * ss], [sk[0] + 66 * ss, sk[1] + 4]]);
  add(near, 'c', clay, dk ? '#8A6E62' : '#B9988A');
  var bwx = tbx0 + (tbx1 - tbx0) * 0.66, bws = ph ? 0.7 : 1.05;
  var bowls = n3_P(n3_potPts(0, bwx, tby, 46 * bws, 18 * bws)) + n3_P(n3_potPts(0, bwx, tby - 14 * bws, 40 * bws, 16 * bws)) + n3_P(n3_potPts(0, bwx, tby - 26 * bws, 34 * bws, 14 * bws));
  var fpots = n3_P(n3_potPts(4, W * (ph ? 0.08 : 0.38), fy + (ph ? 40 : 30), (ph ? 34 : 52), (ph ? 36 : 54))) + n3_P(n3_potPts(1, W * (ph ? 0.2 : 0.43), fy + (ph ? 34 : 26), (ph ? 22 : 34), (ph ? 44 : 66)));
  add(near, 'd', bowls + fpots, dk ? '#A26A54' : '#EDB596');
  add(near, 'b', wood2 + sacks, dk ? '#4E3628' : '#946240');
  var sackTop = n3_E(sk[0] - 4 * ss, sk[1] - 46 * ss, 14 * ss, 4 * ss);
  var mug = [tbx0 + (tbx1 - tbx0) * 0.9, tby], ms = ph ? 0.75 : 1.1;
  var bucket = [W * (ph ? 0.3 : 0.47), fy + (ph ? 46 : 40)], bks = ph ? 0.8 : 1.2;
  add(near, 'e', rrect(mug[0] - 9 * ms, mug[1] - 20 * ms, 18 * ms, 20 * ms, 3 * ms) + n3_tube(n3_bz([mug[0] + 8 * ms, mug[1] - 16 * ms], [mug[0] + 16 * ms, mug[1] - 16 * ms], [mug[0] + 16 * ms, mug[1] - 5 * ms], [mug[0] + 8 * ms, mug[1] - 6 * ms], 8), 3 * ms, 3 * ms)
    + n3_P([[bucket[0] - 22 * bks, bucket[1] - 34 * bks], [bucket[0] + 22 * bks, bucket[1] - 34 * bks], [bucket[0] + 17 * bks, bucket[1]], [bucket[0] - 17 * bks, bucket[1]]]), dk ? '#3E7C8C' : '#5FAFC2');
  add(mid, 'b', spot); add(mid, 'c', spl2); add(mid, 'f', sp); add(near, 'a', sackTop);
  // ---- the potter's wheel: frame and splash pan rim; the engine draws the turning head, the clay and the pan's front lip
  var wx = ph ? W * 0.52 : W * 0.6, wy = H * (ph ? 0.9 : 0.88), ws = ph ? 0.95 : 1.5;
  add(near, 'b', rect(wx - 40 * ws, wy + 8 * ws, 9 * ws, H - wy + 20) + rect(wx + 31 * ws, wy + 8 * ws, 9 * ws, H - wy + 20) + rect(wx + 84 * ws, wy - 24 * ws, 38 * ws, 8 * ws) + rect(wx + 90 * ws, wy - 16 * ws, 6 * ws, H - wy + 40) + rect(wx + 112 * ws, wy - 16 * ws, 6 * ws, H - wy + 40));
  var panC = dk ? '#4C5A6A' : '#7FA3BC';
  var tiles = ''; var ty0 = bmH + (ph ? 4 : 6), tA = W * (ph ? 0.08 : 0.36), tB = W * (ph ? 0.56 : 0.76), sag = ph ? 18 : 30;
  if (ANIM) {
    ANIM.wheel = {x: wx, y: wy, s: ws, pan: panC}; ANIM.win = {x0: wx0, x1: wx1, y0: wy0, y1: wy1}; ANIM.kiln = {x0: kx0, x1: kx1, top: kTop, y1: kby, cx: kcx, peep: peep, door: door, dTop: dTop}; ANIM.pots = potList; ANIM.mug = [mug[0], mug[1] - 20 * ms, ms];
    ANIM.sill = {x: wx0 + (wx1 - wx0) * 0.36, y: wy1, s: ph ? 1.0 : 1.55}; ANIM.tiles = {a: tA, b: tB, y: ty0, sag: sag, n: ph ? 6 : 10}; ANIM.lamps = ph ? [[W * 0.7, bmH]] : [[W * 0.46, bmH], [W * 0.88, bmH]]; ANIM.ph = ph;
  } else {
    for (var q = 1; q < 10; q++) { var u = q / 10, px = tA + (tB - tA) * u, py = ty0 + sag * 4 * u * (1 - u); tiles += rrect(px - 6, py + 2, 12, 14, 2); }
    add(mid, 'b', tiles); stk(mid, 's', 'M' + PT(tA, ty0) + ' Q' + PT((tA + tB) / 2, ty0 + sag * 2) + ' ' + PT(tB, ty0) + ' ', dk ? '#8A7468' : '#8A6A55', 1);
    add(near, 'g', n3_E(wx, wy, 72 * ws, 18 * ws)); add(near, 'c', n3_P(n3_potPts(4, wx, wy - 4 * ws, 42 * ws, 34 * ws)));
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// ======================================================================
// 3. Campfire Night: a still mountain lake ringed with pines, a tent and a crackling campfire on the near shore, log seats,
//    a canoe pulled up on the bank and a marshmallow stick leaning toward the flames.
// ======================================================================
SCENES.campfire = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0.6), mid = Lay(0.3), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#0B1022 0%,#10162A 26%,#1E2742 56%,#3A3040 78%,#46352E 100%)' : 'linear-gradient(180deg,#9CC6E2 0%,#B5D3E6 30%,#E7EFE7 66%,#DDE6C8 100%)';
  var hz = H * (ph ? 0.5 : 0.52), shore = H * (ph ? 0.66 : 0.68);
  var lake = dk ? 'linear-gradient(180deg,#26324E 0%,#1A2440 40%,#141B30 100%)' : 'linear-gradient(180deg,#B8D8E2 0%,#8FC0D2 45%,#76AEC4 100%)';
  // ---- sky: sun or moon, clouds or stars
  var mx = W * (ph ? 0.72 : 0.7), my = H * (ph ? 0.14 : 0.16), mr = ph ? 18 : 26;
  if (dk) { add(far, 'a', n3_C(mx, my, mr * 3.2), 'rgba(200,210,255,0.14)'); add(far, 'b', n3_C(mx, my, mr), '#F6F1DC'); }
  else { add(far, 'a', n3_C(mx, my, mr * 3), 'rgba(255,248,220,0.6)'); add(far, 'b', n3_C(mx, my, mr * 1.1), '#FFF9E6'); var cl = ''; [[0.18, 0.12, 1], [0.42, 0.2, 0.8], [0.88, 0.3, 0.7]].forEach(function (c) { var x = W * c[0], y = H * c[1], s = c[2] * (ph ? 0.6 : 1); cl += n3_E(x, y, 60 * s, 14 * s) + n3_C(x - 18 * s, y - 10 * s, 18 * s) + n3_C(x + 12 * s, y - 14 * s, 22 * s); }); add(far, 'f', cl, 'rgba(255,255,255,0.88)'); }
  var stars = '', twk = [];
  if (dk) spread(0, 0, W, hz - 30, 30, 30, rnd, 1).forEach(function (c) { if (c.q > 0.55 || Math.hypot(c.x - mx, c.y - my) < mr + 16) return; if (c.r > 0.93 && twk.length < (ph ? 14 : 28)) twk.push({x: c.x, y: c.y, r: 2.5 + c.k * 2.5, k: c.k}); else stars += n3_C(c.x, c.y, 0.5 + c.r * 1.1); });
  // ---- mountains
  var m1 = ridge(W, hz - H * (ph ? 0.12 : 0.16), [[H * 0.07, 210, 0.4], [H * 0.03, 77, 1.3]], 6, true), m2 = ridge(W, hz - H * (ph ? 0.05 : 0.07), [[H * 0.04, 140, 2.2], [H * 0.015, 45, 0.6]], 6, false);
  add(far, 'c', n3_below(m1, hz + 2), dk ? '#2A3354' : '#A4B9D2');
  var snow = ''; var pk = []; m1.forEach(function (p, i) { if (i > 0 && i < m1.length - 1 && p[1] < m1[i - 1][1] && p[1] <= m1[i + 1][1]) pk.push(p); });
  pk.forEach(function (p) { if (p[1] > hz - H * 0.12) return; var w = H * 0.03; snow += n3_P([[p[0], p[1] - 1], [p[0] + w, p[1] + w * 0.8], [p[0] + w * 0.4, p[1] + w * 0.6], [p[0], p[1] + w * 0.9], [p[0] - w * 0.5, p[1] + w * 0.6], [p[0] - w, p[1] + w * 0.8]]); });
  add(far, 'e', snow, dk ? '#8A92B8' : '#F4F7FA');
  add(far, 'd', n3_below(m2, hz + 2), dk ? '#222A46' : '#8BA6BE');
  // ---- far shore: a band of pines along the water line
  var fshore = '', fp = '', fp2 = '';
  for (var x = -20; x < W + 20; x += (ph ? 7 : 10) + rnd() * 8) { var h = (ph ? 18 : 26) * (0.6 + rnd() * 0.8); var pn = n3_pine(x, hz + 2, h, h * 0.32); if (rnd() < 0.5) fp += pn; else fp2 += pn; }
  fshore += rect(-40, hz - 3, W + 80, 5);
  add(mid, 'a', fp + fshore, dk ? '#141C30' : '#4E7A68'); add(mid, 'c', fp2, dk ? '#18223A' : '#5F8E74');
  // reflections in the still water (mirrored, faint)
  var rm = '', rp = '';
  rm += n3_P(m1.map(function (p) { return [p[0], 2 * hz - p[1]]; }).concat([[W + 60, hz], [-60, hz]]));
  for (x = -20; x < W + 20; x += (ph ? 10 : 14) + rnd() * 8) { h = (ph ? 14 : 20) * (0.6 + rnd() * 0.8); rp += n3_P([[x - h * 0.3, hz + 2], [x, hz + 2 + h], [x + h * 0.3, hz + 2]]); }
  add(refl, 'a', rm, dk ? 'rgba(60,70,110,0.28)' : 'rgba(150,175,205,0.35)'); add(refl, 'b', rp, dk ? 'rgba(10,14,26,0.45)' : 'rgba(60,100,90,0.3)');
  var mref = ''; for (var k = 0; k < 9; k++) { var yy = hz + 8 + k * (ph ? 9 : 12), ww = mr * (1.4 - k * 0.1) * (0.7 + rnd() * 0.5); mref += rrect(mx - ww, yy, ww * 2, 2.4, 1.2); }
  add(refl, 'c', mref, dk ? 'rgba(246,241,220,0.5)' : 'rgba(255,252,236,0.7)');
  add(refl, 'd', stars, 'rgba(255,248,230,0.85)');
  // ---- side pines (midground, both sides) and rocks on the near shore
  var sp = '', sp2 = '';
  [[0.02, 1.0], [0.07, 0.8], [0.12, 0.65], [0.9, 0.75], [0.95, 0.95], [0.99, 1.1]].forEach(function (q, j) { if (ph && j % 2) return; var xx = W * q[0], hh = H * 0.3 * q[1] * (ph ? 0.8 : 1); var pn2 = n3_pine(xx, shore + 6, hh, hh * 0.3); if (j % 2) sp += pn2; else sp2 += pn2; });
  add(mid, 'd', sp, dk ? '#0F1626' : '#3C6A54'); add(mid, 'e', sp2, dk ? '#121A2C' : '#467860');
  // ---- the near shore: meadow, clearing, stones, logs, tent
  var ground = n3_fn(-40, W + 40, 10, function (x) { return shore + Math.sin(x / 90 + 1) * 4 + Math.sin(x / 31) * 1.5; });
  add(near, 'a', n3_below(ground, H + 20), dk ? '#232A26' : '#9CBB78');
  var fx = W * (ph ? 0.5 : 0.52), fyy = H * (ph ? 0.89 : 0.87), fs = ph ? 1.1 : 1.7;
  var clearing = n3_E(fx, fyy + 4 * fs, 150 * fs, 32 * fs) + n3_E(fx - 30 * fs, fyy + 20 * fs, 90 * fs, 26 * fs);
  var patches = ''; spread(0, shore + 12, W, H - shore, ph ? 80 : 120, 50, rnd, 1).forEach(function (c) { if (c.q < 0.45 && Math.hypot((c.x - fx) / 1.6, c.y - fyy) > 120 * fs) patches += n3_E(c.x, c.y, 26 + c.r * 40, 5 + c.k * 5); });
  add(near, 'b', patches, dk ? '#1C221F' : '#88AA66');
  var strip = n3_band(ground.map(function (p) { return [p[0], p[1] - 1]; }), ground.map(function (p) { return [p[0], p[1] + 7 + Math.sin(p[0] / 17) * 2]; }));
  add(near, 'c', clearing + strip, dk ? '#3A3430' : '#D8C49A');
  var flw = ''; if (!dk) spread(0, shore + 20, W, H - shore - 20, ph ? 40 : 54, 30, rnd, 1).forEach(function (c) { if (c.q > 0.3 || Math.hypot((c.x - fx) / 1.7, c.y - fyy) < 120 * fs) return; var s = 0.7 + (c.y - shore) / (H - shore); for (var q = 0; q < 5; q++) flw += n3_C(c.x + Math.cos(q * 1.257) * 2.2 * s, c.y + Math.sin(q * 1.257) * 2.2 * s, 1.6 * s); });
  // stones ringing the fire, and a few on the shore
  var stones = ''; for (k = 0; k < 11; k++) { var a = k / 11 * Math.PI * 2, sx2 = fx + Math.cos(a) * 46 * fs, sy2 = fyy + Math.sin(a) * 13 * fs; stones += n3_E(sx2, sy2 - 3 * fs, (9 + (k % 3) * 2) * fs, 6.5 * fs); }
  [[0.3, 0.72], [0.34, 0.73], [0.66, 0.705]].forEach(function (q) { if (ph) return; stones += n3_E(W * q[0], H * q[1], 14, 7); });
  add(near, 'f', stones, dk ? '#4A4A52' : '#9EA2A8');
  // log seats: one behind-left, one to the right of the fire
  var logs = '', ends = '';
  [[fx - 150 * fs, fyy - 18 * fs, 120 * fs, -6], [fx + 120 * fs, fyy + 16 * fs, 100 * fs, 8]].forEach(function (q) { var lx = q[0], ly = q[1], L = q[2], r = 14 * fs; var p = rotp([[-L / 2, -r], [L / 2, -r], [L / 2, r], [-L / 2, r]], lx, ly, q[3]); logs += n3_P(p); var e = rotp([[L / 2, 0]], lx, ly, q[3])[0]; ends += n3_RE(e[0], e[1], r * 0.45, r, q[3]); });
  // the fire's logs (crossed) under the flames
  var fl = rotp([[-40, -6], [40, -6], [40, 6], [-40, 6]], fx, fyy - 4 * fs, 18).map(function (p) { return [fx + (p[0] - fx) * fs, fyy - 4 * fs + (p[1] - fyy + 4 * fs) * fs]; });
  var fl2 = rotp([[-40, -6], [40, -6], [40, 6], [-40, 6]], fx, fyy - 4 * fs, -16).map(function (p) { return [fx + (p[0] - fx) * fs, fyy - 4 * fs + (p[1] - fyy + 4 * fs) * fs]; });
  logs += n3_P(fl) + n3_P(fl2);
  add(near, 'd', logs, dk ? '#4A3024' : '#8A5A3A'); add(near, 'e', ends + flw, dk ? '#8A6448' : '#F4E2B8');
  // the tent (A-frame) with its open door
  var tx = W * (ph ? 0.8 : 0.8), ty = H * (ph ? 0.8 : 0.81), tw = ph ? 84 : 150, th = ph ? 94 : 160;
  var tent = n3_P([[tx - tw, ty], [tx - tw * 0.12, ty - th], [tx + tw * 0.12, ty - th], [tx + tw * 1.05, ty], [tx + tw * 0.2, ty + 10]]);
  var tside = n3_P([[tx + tw * 0.12, ty - th], [tx + tw * 1.05, ty], [tx + tw * 0.2, ty + 10]]);
  var door = n3_P([[tx - tw * 0.55, ty + 4], [tx - tw * 0.12, ty - th * 0.82], [tx + tw * 0.04, ty + 7]]);
  add(near, 'g', tent, dk ? '#B8562E' : '#F08A3E');
  add(near, 'h', tside + door, dk ? 'rgba(40,14,8,0.5)' : 'rgba(150,50,20,0.3)');
  var guys = seg(tx - tw * 0.12, ty - th, tx - tw * 1.5, ty + 6) + seg(tx + tw * 0.12, ty - th, tx + tw * 1.55, ty + 4) + seg(tx, ty - th, tx, ty - th - 10);
  stk(near, 's', guys, dk ? 'rgba(200,190,170,0.5)' : 'rgba(110,80,60,0.6)', 1.2);
  // grass blades and reeds at the water's edge
  var grass = ''; spread(0, shore, W, H - shore, ph ? 26 : 34, ph ? 22 : 26, rnd, 1).forEach(function (c) { if (c.q > 0.5) return; if (Math.hypot((c.x - fx) / 1.7, c.y - fyy) < 110 * fs || (c.x > tx - tw && c.x < tx + tw * 1.1 && c.y < ty + 8 && c.y > ty - th)) return; var s = 0.6 + (c.y - shore) / (H - shore) * 1.2; grass += 'M' + PT(c.x - 3 * s, c.y) + ' L' + PT(c.x - 5 * s, c.y - 8 * s) + ' M' + PT(c.x, c.y) + ' L' + PT(c.x + 1 * s, c.y - 11 * s) + ' M' + PT(c.x + 3 * s, c.y) + ' L' + PT(c.x + 6 * s, c.y - 7 * s) + ' '; });
  var reeds = ''; for (x = 4; x < W; x += 9 + rnd() * 30) { if (ph && x > W * 0.3 && x < W * 0.7) continue; var rh = 14 + rnd() * 22, gy = shore + Math.sin(x / 90 + 1) * 4; reeds += 'M' + PT(x, gy + 2) + ' Q' + PT(x + 2, gy - rh * 0.5) + ' ' + PT(x + 4 * (rnd() - 0.3), gy - rh) + ' '; }
  stk(near, 't', grass + reeds, dk ? '#36423A' : '#6E9A55', 1.4);
  // a canoe pulled up on the bank (left)
  var cx = W * (ph ? 0.2 : 0.2), cy = shore - (ph ? 3 : 4), cw = ph ? 50 : 90;
  var canoe = n3_P([[cx - cw, cy - 14], [cx - cw * 0.82, cy - 2], [cx - cw * 0.55, cy + 6], [cx + cw * 0.55, cy + 6], [cx + cw * 0.82, cy - 2], [cx + cw, cy - 14], [cx + cw * 0.8, cy - 6], [cx - cw * 0.8, cy - 6]]);
  add(mid, 'f', canoe, dk ? '#8A3A3A' : '#D8564A'); add(mid, 'g', rect(cx - cw * 0.8, cy - 6, cw * 1.6, 3) + n3_RE(cx + cw * 0.35, cy - 6, 20 * (ph ? 0.6 : 1), 2.4, -12), dk ? '#C8A07A' : '#F2D2A6');
  // marshmallow stick: rests on the left log, tip over the flames
  var stA = [fx - 128 * fs, fyy - 30 * fs], stB = [fx - 40 * fs, fyy - 96 * fs];
  if (ANIM) {
    ANIM.fire = {x: fx, y: fyy - 6 * fs, s: fs}; ANIM.stick = [stA, stB]; ANIM.tent = {x: tx, y: ty, w: tw, h: th}; ANIM.lake = {top: hz, bot: shore, mx: mx}; ANIM.moon = [mx, my, mr]; ANIM.twk = twk; ANIM.ph = ph;
  } else {
    stk(near, 's', seg(stA[0], stA[1], stB[0], stB[1]));
    add(near, 'e', n3_RE(stB[0], stB[1], 8 * fs, 6 * fs, -18));
    var fla = n3_P([[fx - 30 * fs, fyy - 4 * fs], [fx - 18 * fs, fyy - 40 * fs], [fx - 6 * fs, fyy - 26 * fs], [fx + 2 * fs, fyy - 70 * fs], [fx + 12 * fs, fyy - 30 * fs], [fx + 22 * fs, fyy - 46 * fs], [fx + 30 * fs, fyy - 4 * fs]]);
    add(near, 'g', fla);
    twk.forEach(function (s) { stars += n3_spark(s.x, s.y, s.r); }); add(refl, 'd', stars);
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: lake}};
};

// ======================================================================
// 4. Aquarium Tunnel: inside an acrylic tunnel through a giant tank. The seams arch overhead and run to the lit far end, sand and
//    coral gardens rise on both sides of the walkway, light rays fall from the surface, and two visitors look up at the fish.
// ======================================================================
// branching coral: a few forking tubes from (x,y), scale s
function n3_branch(x, y, s, rnd, depth, ang, len) { if (depth === undefined) { depth = 3; ang = -90; len = 26; } var a = ang * Math.PI / 180, x2 = x + Math.cos(a) * len * s, y2 = y + Math.sin(a) * len * s, d = n3_tube([[x, y], [(x + x2) / 2 + Math.sin(a) * 2 * s, (y + y2) / 2], [x2, y2]], (2.2 + depth * 1.4) * s, (1.6 + depth) * s) + n3_C(x2, y2, (1 + depth * 0.7) * s);
  if (depth > 0) { d += n3_branch(x2, y2, s, rnd, depth - 1, ang - 22 - rnd() * 16, len * 0.72); d += n3_branch(x2, y2, s, rnd, depth - 1, ang + 22 + rnd() * 16, len * 0.72); } return d; }
function n3_fan(x, y, s) { var o = [[x, y]], i; for (i = 0; i <= 16; i++) { var a = Math.PI + i / 16 * Math.PI; o.push([x + Math.cos(a) * 30 * s, y - 6 * s + Math.sin(a) * 36 * s]); } return n3_P(o); }
SCENES.aquarium = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(6), refl = Lay(0), mid = Lay(0.3), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#06142A 0%,#081A33 28%,#0E2E52 62%,#1E4A6E 100%)' : 'linear-gradient(180deg,#4FB3D6 0%,#6FC3DF 26%,#A9E0EE 62%,#D7F1F4 100%)';
  var vx = W * 0.5, vy = H * (ph ? 0.46 : 0.47), a0 = W * (ph ? 0.2 : 0.11), fB = H * (ph ? 0.07 : 0.085), R0 = a0 * 1.05, af = a0 * 0.58;
  function P(m, x, y) { return [vx + x * m, vy + y * m]; }
  function rib(m, n) { var side = n3_bz([-af, fB], [-a0 * 0.98, fB * 0.9], [-a0, fB * 0.35], [-a0, 0], 8), o = side.map(function (q) { return P(m, q[0], q[1]); }); for (var i = 1; i < n; i++) { var t = Math.PI + i / n * Math.PI; o.push(P(m, Math.cos(t) * a0, Math.sin(t) * R0)); } side.slice().reverse().forEach(function (q) { o.push(P(m, -q[0], q[1])); }); return o; }
  // ---- far water: a glow at the tunnel's end, light rays from the surface, distant rocks and kelp
  add(far, 'a', n3_E(vx, vy - R0 * 0.2, a0 * 2, R0 * 1.5), dk ? 'rgba(60,140,200,0.25)' : 'rgba(240,255,255,0.42)');
  var rays = ''; [[-0.35, 0.05], [-0.12, 0.08], [0.15, 0.05], [0.4, 0.07], [0.7, 0.04]].forEach(function (r) { var x = W * (0.5 + r[0]), w = W * r[1]; rays += n3_P([[x, -40], [x + w, -40], [x + w * 0.4 + W * 0.12, H * 0.62], [x + W * 0.12 - w * 0.4, H * 0.62]]); });
  add(far, 'b', rays, dk ? 'rgba(120,180,255,0.07)' : 'rgba(255,255,255,0.22)');
  var frocks = ''; for (var x = -40; x < W + 40; x += 30 + rnd() * 40) { if (Math.abs(x - vx) < a0 * 1.2) continue; var r = 14 + rnd() * 26; frocks += n3_E(x, vy + 4, r * 1.6, r * 0.9); }
  add(far, 'c', frocks + rect(-60, vy + 2, W + 120, H * 0.6), dk ? '#123A5A' : '#8FCBD8');
  var fk = ''; for (x = -20; x < W + 20; x += 18 + rnd() * 30) { if (Math.abs(x - vx) < a0 * 1.4) continue; var kh = 30 + rnd() * 60; fk += n3_tube([[x, vy + 6], [x + 6, vy - kh * 0.5], [x - 2, vy - kh]], 5, 2); }
  add(far, 'd', fk, dk ? '#0F3A4E' : '#7FC2B8');
  // ---- the sand plane outside the tunnel, rising in gentle dunes toward the sides
  var sand = n3_fn(-60, W + 60, 10, function (x) { var d = Math.abs(x - vx) / (W * 0.5); return vy + 6 - d * d * H * 0.025 + Math.sin(x / 60) * 4; });
  add(refl, 'c', n3_below(sand, H + 20), dk ? '#1D4058' : '#E4D3A6');
  var dunes = ''; for (var k = 0; k < 9; k++) { var m = 1.2 * Math.pow(1.35, k), y = vy + fB * m * 0.92; [-1, 1].forEach(function (sd) { var x0 = vx + sd * a0 * m * 1.15, w2 = W * 0.18 * Math.min(2.5, m * 0.5); dunes += n3_E(x0 + sd * w2 * 0.6, y, w2, 3 + m * 1.6) + n3_E(x0 + sd * w2 * 1.5, y + fB * m * 0.1, w2 * 0.6, 2 + m); }); }
  add(refl, 'd', dunes, dk ? '#234B66' : '#CDB98A');
  // ---- the tunnel: far end portal, acrylic seams arching overhead
  var far1 = rib(1, 30);
  add(refl, 'b', n3_P(far1), dk ? 'rgba(80,160,220,0.28)' : 'rgba(255,255,255,0.35)');
  add(refl, 'e', n3_P(rib(0.55, 24)), dk ? '#4AB8E0' : '#E6FAFF');
  var seams = '', thin = '';
  [1, 1.32, 1.78, 2.45, 3.45, 5, 7.4].forEach(function (m) { var p = rib(m, 40); seams += pline(p); });
  // long seams running from the far end toward us along the arch
  for (k = 0; k <= 10; k++) { var t = Math.PI + k / 10 * Math.PI, p0 = P(1, Math.cos(t) * a0, Math.sin(t) * R0); thin += seg(p0[0], p0[1], vx + (p0[0] - vx) * 9, vy + (p0[1] - vy) * 9); }
  stk(refl, 's', seams, dk ? 'rgba(120,200,255,0.3)' : 'rgba(255,255,255,0.55)', 2.4);
  stk(refl, 't', thin, dk ? 'rgba(120,200,255,0.12)' : 'rgba(255,255,255,0.28)', 1.2);
  // ---- coral gardens on both sides, outside the glass
  var cB = {rock: '', hi: '', pink: '', orange: '', purple: '', kelp: '', yel: '', teal: ''};
  [-1, 1].forEach(function (sd) {
    for (var m = 1.1; m < 6; m *= 1.15) {
      var n = m < 2 ? 3 : 4; for (var j = 0; j < n; j++) {
        var wx = sd * (af * 1.3 + j * a0 * (m < 2 ? 0.8 : 0.5) + rnd() * a0 * 0.4), p = P(m * (1 + rnd() * 0.08), wx, fB), s = m * (ph ? 0.6 : 0.85) * (0.8 + rnd() * 0.4), x = p[0], y = p[1] - (Math.abs(x - vx) / (W * 0.5)) * (Math.abs(x - vx) / (W * 0.5)) * H * 0.025;
        if (x < -60 * s || x > W + 60 * s || y > H + 40) continue;
        cB.rock += n3_E(x, y, 26 * s, 14 * s) + n3_E(x + 14 * s * sd, y + 2 * s, 18 * s, 10 * s); cB.hi += n3_E(x - 6 * s, y - 8 * s, 12 * s, 4 * s);
        var kind = Math.floor(rnd() * 6);
        if (kind === 0) cB.pink += n3_branch(x, y - 8 * s, s * 0.8, rnd);
        else if (kind === 1) cB.orange += n3_fan(x, y - 8 * s, s * 0.9);
        else if (kind === 2) { cB.purple += n3_C(x, y - 14 * s, 14 * s); cB.hi += n3_E(x - 4 * s, y - 20 * s, 6 * s, 3 * s); }
        else if (kind === 3) { for (var q = 0; q < 4; q++) cB.yel += rrect(x - 12 * s + q * 6 * s, y - (18 + q * 5 % 11) * s - 8 * s, 5 * s, (18 + q * 5 % 11) * s, 2.4 * s); }
        else if (kind === 4) { for (q = 0; q < 9; q++) { var aa = -160 + q * 17.5; cB.teal += n3_leaf(x, y - 8 * s, 14 * s, 2.4 * s, aa, 0.2); } }
        else { for (q = 0; q < 4; q++) { var kx = x + (q - 1.5) * 6 * s, kh2 = (50 + rnd() * 40) * s; cB.kelp += n3_tube([[kx, y - 4 * s], [kx + 6 * s, y - kh2 * 0.4], [kx - 4 * s, y - kh2 * 0.75], [kx + 3 * s, y - kh2]], 5 * s, 2.5 * s); } }
      }
    }
  });
  var C = dk ? {rock: '#16324A', hi: 'rgba(90,170,220,0.18)', pink: '#B8507A', orange: '#C46A3A', purple: '#6A4EA8', kelp: '#1E5A4A', yel: '#B09A3A', teal: '#2A8C8A'} : {rock: '#6A8FA0', hi: 'rgba(255,255,255,0.3)', pink: '#F27BA0', orange: '#F59A4A', purple: '#9B7BE0', kelp: '#4FA07A', yel: '#F2CC4A', teal: '#3FC1B0'};
  add(mid, 'f', cB.kelp, C.kelp); add(mid, 'a', cB.rock, C.rock); add(mid, 'b', cB.hi, C.hi); add(mid, 'c', cB.pink, C.pink); add(mid, 'd', cB.orange, C.orange); add(mid, 'e', cB.purple, C.purple); add(mid, 'g', cB.yel, C.yel); add(mid, 'h', cB.teal, C.teal);
  // ---- the walkway, its base ledges and LED strips
  var M = 12, wl = [P(1, -af, fB), P(1, af, fB), P(M, af, fB), P(M, -af, fB)];
  add(near, 'a', n3_P(wl), dk ? '#0E1C2E' : '#3E5A72');
  var hL = H * 0.016, a1 = af * 1.06, ledge = n3_P([P(1, -a1, fB), P(1, -a1, fB - hL), P(M, -a1, fB - hL), P(M, -a1, fB)]) + n3_P([P(1, a1, fB - hL), P(1, a1, fB), P(M, a1, fB), P(M, a1, fB - hL)]);
  var ledgeTop = n3_P([P(1, -a1, fB - hL), P(1, -af * 0.95, fB - hL * 0.4), P(M, -af * 0.95, fB - hL * 0.4), P(M, -a1, fB - hL)]) + n3_P([P(1, af * 0.95, fB - hL * 0.4), P(1, a1, fB - hL), P(M, a1, fB - hL), P(M, af * 0.95, fB - hL * 0.4)]);
  add(near, 'b', ledge + ledgeTop, dk ? '#1A2A40' : '#2E465C');
  var leds = n3_P([P(1, -af * 0.95, fB - hL * 0.4), P(1, -af * 0.91, fB - hL * 0.4), P(M, -af * 0.91, fB - hL * 0.4), P(M, -af * 0.95, fB - hL * 0.4)]) + n3_P([P(1, af * 0.91, fB - hL * 0.4), P(1, af * 0.95, fB - hL * 0.4), P(M, af * 0.95, fB - hL * 0.4), P(M, af * 0.91, fB - hL * 0.4)]);
  add(near, 'c', leds, dk ? '#5FE0FF' : '#9FEFFF');
  var stripes = ''; for (k = 0; k < 14; k++) { var m1 = Math.pow(1.22, k), m2 = m1 * 1.06; stripes += n3_P([P(m1, -af * 0.85, fB), P(m1, af * 0.85, fB), P(m2, af * 0.85, fB), P(m2, -af * 0.85, fB)]); }
  add(near, 'd', stripes, dk ? 'rgba(80,140,200,0.08)' : 'rgba(255,255,255,0.06)');
  // two visitors looking up (silhouettes): a parent and a pointing kid
  var pm = ph ? 2.1 : 2.4, pp = P(pm, -af * 0.5, fB), ps = pm * (ph ? 0.5 : 0.62), kp = P(pm, -af * 0.1, fB);
  var ppl = rrect(pp[0] - 9 * ps, pp[1] - 66 * ps, 18 * ps, 40 * ps, 7 * ps) + n3_C(pp[0], pp[1] - 74 * ps, 8 * ps) + rect(pp[0] - 7 * ps, pp[1] - 30 * ps, 5.5 * ps, 30 * ps) + rect(pp[0] + 1.5 * ps, pp[1] - 30 * ps, 5.5 * ps, 30 * ps);
  ppl += rrect(kp[0] - 6 * ps, kp[1] - 38 * ps, 12 * ps, 22 * ps, 5 * ps) + n3_C(kp[0], kp[1] - 44 * ps, 6.5 * ps) + rect(kp[0] - 5 * ps, kp[1] - 18 * ps, 4 * ps, 18 * ps) + rect(kp[0] + 1 * ps, kp[1] - 18 * ps, 4 * ps, 18 * ps) + n3_tube([[kp[0] + 4 * ps, kp[1] - 34 * ps], [kp[0] + 12 * ps, kp[1] - 46 * ps], [kp[0] + 16 * ps, kp[1] - 58 * ps]], 3.6 * ps, 3 * ps) + n3_C(kp[0] + 2 * ps, kp[1] - 50 * ps, 3.4 * ps);
  ppl += n3_tube([[pp[0] + 7 * ps, pp[1] - 60 * ps], [pp[0] + 14 * ps, pp[1] - 46 * ps], [kp[0] - 4 * ps, kp[1] - 36 * ps]], 4 * ps, 3.5 * ps);
  add(near, 'e', ppl, dk ? '#06101E' : '#1E3448');
  if (ANIM) {
    ANIM.vp = [vx, vy]; ANIM.tun = {a0: a0, af: af, fB: fB, R0: R0}; ANIM.floor = wl; ANIM.ph = ph;
    ANIM.bubbles = [P(1.6, -a0 * 1.6, fB), P(2.6, a0 * 1.9, fB), P(1.25, a0 * 1.4, fB)].map(function (p, i) { return {x: p[0], y: p[1] - 6, s: [1.6, 2.6, 1.25][i] * (ph ? 0.5 : 0.7)}; });
  } else {
    var fish = '', fs2 = ph ? 1 : 1.5; [[0.2, 0.16, 1], [0.62, 0.1, -1], [0.8, 0.3, -1], [0.38, 0.28, 1]].forEach(function (sc) { for (var q = 0; q < 7; q++) { var x = W * sc[0] + (q % 4) * 22 * fs2 * sc[2] * -1 + (rnd() - 0.5) * 16, y = H * sc[1] + Math.floor(q / 4) * 16 * fs2 + (rnd() - 0.5) * 10, d = sc[2];
      fish += n3_E(x, y, 10 * fs2, 5 * fs2) + n3_P([[x - d * 8 * fs2, y], [x - d * 15 * fs2, y - 5 * fs2], [x - d * 15 * fs2, y + 5 * fs2]]); } });
    add(refl, 'a', fish, dk ? '#2A5A8A' : '#3E7FE0');
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// ======================================================================
// 5. Treehouse: a wooden treehouse high in an old oak, under a leafy canopy that runs across the top of the view, with a railed
//    deck, fairy lights, a rope ladder down to the meadow, a tire swing and a tin-can telephone strung to a far branch.
// ======================================================================
function n3_blob(x, y, r, rnd, n) { var d = ''; for (var i = 0; i < (n || 6); i++) { var a = i / (n || 6) * 6.283 + rnd() * 0.6, rr = r * (0.45 + rnd() * 0.3); d += n3_C(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.42, rr); } return d + n3_C(x, y, r * 0.62); }
SCENES.treehouse = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(3), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#0F1830 0%,#16203A 30%,#253456 64%,#3B4A3C 100%)' : 'linear-gradient(180deg,#9ED0EC 0%,#B7DCEF 34%,#E3F1E2 70%,#CFE2B4 100%)';
  var gy = H * (ph ? 0.86 : 0.86);
  var tx = W * (ph ? 0.6 : 0.62), tw = W * (ph ? 0.1 : 0.06);   // trunk centre and half-width at the base
  var hx0 = W * (ph ? 0.28 : 0.49), hx1 = W * (ph ? 0.86 : 0.71), hTop = H * (ph ? 0.12 : 0.13), hBot = H * (ph ? 0.29 : 0.31), pY = hBot + 2, pX0 = hx0 - W * (ph ? 0.06 : 0.04), pX1 = hx1 + W * (ph ? 0.06 : 0.035);
  // ---- sky
  var mx = W * (ph ? 0.18 : 0.3), my = H * (ph ? 0.36 : 0.36);
  if (dk) { add(far, 'a', n3_C(mx, my, ph ? 60 : 90), 'rgba(200,215,255,0.16)'); add(far, 'b', n3_C(mx, my, ph ? 15 : 22), '#F6F2DE'); }
  else { add(far, 'a', n3_C(mx, my, ph ? 70 : 110), 'rgba(255,250,220,0.6)'); add(far, 'b', n3_C(mx, my, ph ? 24 : 34) + [[0.1, 0.5], [0.4, 0.46], [0.9, 0.52]].map(function (c) { var x = W * c[0], y = H * c[1], s = ph ? 0.6 : 1; return n3_E(x, y, 60 * s, 13 * s) + n3_C(x - 18 * s, y - 10 * s, 18 * s) + n3_C(x + 12 * s, y - 14 * s, 22 * s); }).join(''), 'rgba(255,253,244,0.92)'); }
  var stars = ''; if (dk) spread(0, 0, W, H * 0.6, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.4 && Math.hypot(c.x - mx, c.y - my) > 40) stars += n3_C(c.x, c.y, 0.5 + c.r); });
  add(refl, 'a', stars, 'rgba(255,248,228,0.8)');
  // ---- distant hills and a tree line
  var hz = H * (ph ? 0.68 : 0.66), h1 = ridge(W, hz, [[H * 0.04, 260, 0.5], [H * 0.015, 90, 2]], 8), h2 = ridge(W, hz + H * 0.06, [[H * 0.03, 180, 2.4], [H * 0.012, 60, 0.7]], 8);
  add(far, 'c', n3_below(h1, H + 10), dk ? '#24324A' : '#A9CFA8');
  var tl = ''; h2.forEach(function (p, i) { if (i % 2 === 0) tl += n3_C(p[0], p[1] - 4, 8 + rnd() * 10); });
  add(far, 'd', n3_below(h2, H + 10) + tl, dk ? '#1E2A36' : '#8DBE8A');
  // ---- the meadow
  var ground = n3_fn(-40, W + 40, 10, function (x) { return gy + Math.sin(x / 120 + 1) * 6 + Math.sin(x / 41) * 2; });
  add(refl, 'e', n3_below(ground, H + 20), dk ? '#26342C' : '#9CCB74');
  var patches = ''; spread(0, gy + 6, W, H - gy, ph ? 70 : 110, 30, rnd, 1).forEach(function (c) { if (c.q < 0.5) patches += n3_E(c.x, c.y, 22 + c.r * 34, 4 + c.k * 4); });
  add(refl, 'f', patches, dk ? '#1F2C25' : '#86B862');
  // ---- the oak: roots, trunk, branches
  var trunk = [], k, i;
  for (k = 0; k <= 12; k++) { var u = k / 12, w = tw * (1.0 - u * 0.45) + (u < 0.12 ? (0.12 - u) * tw * 4 : 0), xc = tx + Math.sin(u * 2.2) * tw * 0.4; trunk.push([xc - w, gy + 4 - u * (gy - H * 0.02)]); }
  var tR = []; for (k = 12; k >= 0; k--) { u = k / 12; w = tw * (1.0 - u * 0.45) + (u < 0.12 ? (0.12 - u) * tw * 4 : 0); xc = tx + Math.sin(u * 2.2) * tw * 0.4; tR.push([xc + w, gy + 4 - u * (gy - H * 0.02)]); }
  var bark = n3_P(trunk.concat(tR));
  var branches = n3_tube(n3_bz([tx, H * 0.42], [tx + tw * 2, H * 0.36], [tx + W * 0.18, H * 0.34], [tx + W * (ph ? 0.4 : 0.32), H * 0.4], 14), tw * 0.9, tw * 0.28)   // the swing branch (right)
    + n3_tube(n3_bz([tx, H * 0.3], [tx - tw * 2, H * 0.24], [tx - W * 0.2, H * 0.2], [tx - W * (ph ? 0.5 : 0.36), H * 0.12], 14), tw * 0.8, tw * 0.2)
    + n3_tube(n3_bz([tx, H * 0.2], [tx + tw * 2, H * 0.14], [tx + W * 0.2, H * 0.12], [tx + W * (ph ? 0.45 : 0.38), H * 0.06], 14), tw * 0.7, tw * 0.2)
    + n3_tube(n3_bz([tx - tw * 0.4, gy - 2], [tx - tw * 1.8, gy + 2], [tx - tw * 2.4, gy + 8], [tx - tw * 3.2, gy + 10], 8), tw * 0.5, tw * 0.12) + n3_tube(n3_bz([tx + tw * 0.4, gy - 2], [tx + tw * 1.6, gy + 2], [tx + tw * 2.6, gy + 6], [tx + tw * 3.4, gy + 12], 8), tw * 0.5, tw * 0.12);
  add(refl, 'c', bark + branches, dk ? '#4A3628' : '#8A5E3C');
  var lines = ''; for (k = 0; k < 6; k++) { var bx = tx - tw * 0.6 + k * tw * 0.24; lines += n3_tube([[bx, gy - 6], [bx + Math.sin(k) * 4, gy - H * 0.2], [bx + 2, gy - H * 0.36]], 2.2, 1.2); }
  lines += n3_E(tx + tw * 0.2, gy - H * 0.16, tw * 0.22, tw * 0.32);   // a knot hole
  add(refl, 'd', lines, dk ? '#33241A' : '#6A4428');
  add(refl, 'g', n3_P(trunk.concat(trunk.map(function (p) { return [p[0] + tw * 0.4, p[1]]; }).reverse())), dk ? 'rgba(255,220,180,0.06)' : 'rgba(255,230,190,0.18)');
  // ---- canopy behind the house: big clusters along the top
  var canB = '', canM = '', canF = '', canL = '';
  var cl = ph ? [[0.05, 0.02, 80], [0.3, -0.02, 90], [0.55, 0.0, 100], [0.8, 0.02, 90], [1.0, 0.06, 80], [0.95, 0.3, 60], [0.05, 0.22, 60]] : [[0.02, 0.0, 120], [0.18, -0.04, 120], [0.36, -0.03, 130], [0.54, -0.05, 140], [0.74, -0.02, 140], [0.9, 0.02, 130], [1.02, 0.12, 120], [0.98, 0.34, 90], [0.86, 0.36, 70], [0.36, 0.14, 70], [0.12, 0.14, 80]];
  cl.forEach(function (c) { var x = W * c[0], y = H * c[1], r = c[2]; canB += n3_blob(x, y, r, rnd, 7); canM += n3_blob(x + r * 0.15, y - r * 0.1, r * 0.75, rnd, 6); canL += n3_blob(x + r * 0.05, y - r * 0.25, r * 0.4, rnd, 5); });
  add(refl, 'b', canB, dk ? '#1C3226' : '#4E9A50'); add(refl, 'h', canM, dk ? '#244034' : '#66B05E');
  // ---- the deck, the house, the roof
  var house = rect(hx0, hTop, hx1 - hx0, hBot - hTop), deck = rect(pX0, pY, pX1 - pX0, ph ? 8 : 12);
  var braces = n3_tube([[pX0 + 14, pY + 10], [tx - tw * 0.5, pY + H * 0.1]], 6, 6) + n3_tube([[pX1 - 14, pY + 10], [tx + tw * 0.5, pY + H * 0.1]], 6, 6);
  add(mid, 'a', house + deck + braces, dk ? '#8A5A3A' : '#D29A62');
  var planks = ''; for (var yy = hTop + (ph ? 10 : 14); yy < hBot; yy += ph ? 10 : 14) planks += rect(hx0, yy, hx1 - hx0, 1.6);
  planks += rect(hx0, hTop, 4, hBot - hTop) + rect(hx1 - 4, hTop, 4, hBot - hTop) + rect(pX0, pY + (ph ? 8 : 12), pX1 - pX0, 3);
  add(mid, 'b', planks, dk ? 'rgba(30,14,6,0.4)' : 'rgba(120,60,24,0.3)');
  var rP = [[hx0 - W * 0.03, hTop + 2], [(hx0 + hx1) / 2, hTop - H * (ph ? 0.08 : 0.1)], [hx1 + W * 0.03, hTop + 2], [hx1 + W * 0.03, hTop + 10], [hx0 - W * 0.03, hTop + 10]];
  add(mid, 'c', n3_P(rP), dk ? '#7A3A3A' : '#D8584A');
  var shingles = ''; for (k = 1; k < 4; k++) { var f = k / 4, ly = hTop + 2 - (hTop - H * (ph ? 0.08 : 0.1) - hTop) * 0 - (H * (ph ? 0.08 : 0.1)) * (1 - f); void ly; }
  var rx0 = (hx0 + hx1) / 2, ry0 = hTop - H * (ph ? 0.08 : 0.1); for (k = 1; k < 4; k++) { f = k / 4; var yk = ry0 + (hTop + 2 - ry0) * f, half = (hx1 + W * 0.03 - rx0) * f; shingles += rect(rx0 - half, yk, half * 2, 2); }
  add(mid, 'b', shingles);
  // windows: a square one with shutters (the plane flies out of it) and a round one; a door
  var wcx = hx0 + (hx1 - hx0) * 0.3, wcy = hTop + (hBot - hTop) * 0.42, wwd = (hx1 - hx0) * (ph ? 0.2 : 0.18), wht = (hBot - hTop) * 0.36;
  var rcx = hx0 + (hx1 - hx0) * 0.8, rcy = hTop + (hBot - hTop) * 0.36, rr = (hBot - hTop) * 0.14;
  add(mid, 'd', rect(wcx - wwd / 2, wcy - wht / 2, wwd, wht) + n3_C(rcx, rcy, rr), dk ? '#F4C46A' : '#BFE4F2');
  var frm = n3_tube([[wcx - wwd / 2, wcy - wht / 2], [wcx + wwd / 2, wcy - wht / 2], [wcx + wwd / 2, wcy + wht / 2], [wcx - wwd / 2, wcy + wht / 2], [wcx - wwd / 2, wcy - wht / 2 - 1]], 3, 3) + rect(wcx - 1, wcy - wht / 2, 2, wht) + rect(wcx - wwd / 2, wcy - 1, wwd, 2);
  var dX = hx0 + (hx1 - hx0) * 0.58, dW = (hx1 - hx0) * 0.14, dH = (hBot - hTop) * 0.62;
  add(mid, 'e', frm + rect(rcx - rr, rcy - 1, rr * 2, 2) + rect(rcx - 1, rcy - rr, 2, rr * 2) + rect(wcx - wwd / 2 - wwd * 0.36, wcy - wht / 2, wwd * 0.3, wht) + rect(wcx + wwd / 2 + wwd * 0.06, wcy - wht / 2, wwd * 0.3, wht), dk ? '#E2D2B8' : '#FFF6E6');
  add(mid, 'g', rrect(dX, hBot - dH, dW, dH, dW * 0.45), dk ? '#5A3A26' : '#9A6038'); add(mid, 'c', n3_P([[rx0 - 1, ry0], [rx0 - 1, ry0 - H * 0.06], [rx0 + W * 0.03, ry0 - H * 0.05], [rx0 + 1, ry0 - H * 0.04]]) + rect(rx0 - 1.5, ry0 - H * 0.06, 3, H * 0.06));
  add(mid, 'e', n3_C(dX + dW * 0.75, hBot - dH * 0.45, Math.max(1.5, dW * 0.08)));
  // railing on the deck
  var rail = rect(pX0, pY - (ph ? 22 : 30), pX1 - pX0, ph ? 3.5 : 5); for (var rxp = pX0 + 2; rxp <= pX1 - 2; rxp += ph ? 14 : 20) { if (rxp > hx0 - 4 && rxp < hx1 + 4) continue; rail += rect(rxp - 1.6, pY - (ph ? 22 : 30), 3.2, ph ? 22 : 30); }
  add(mid, 'f', rail, dk ? '#6A4630' : '#A87048');
  // ---- front canopy: clusters that frame the top corners, in front of everything
  var fcl = ph ? [[-0.05, 0.05, 70], [1.05, 0.08, 70], [0.6, -0.06, 60]] : [[-0.02, 0.06, 110], [1.04, 0.0, 120], [0.45, -0.08, 80], [1.0, 0.44, 70], [0.27, -0.06, 70]];
  fcl.forEach(function (c) { var x = W * c[0], y = H * c[1], r = c[2]; canF += n3_blob(x, y, r, rnd, 7); canL += n3_blob(x + r * 0.1, y - r * 0.2, r * 0.55, rnd, 6); });
  add(near, 'a', canF, dk ? '#22402E' : '#5AA858'); add(near, 'b', canL, dk ? '#2E5238' : '#86C870');
  // ---- meadow details: grass tufts, flowers, a little red lunchbox and a ball
  var grass = ''; spread(0, gy + 4, W, H - gy, ph ? 22 : 30, ph ? 18 : 22, rnd, 1).forEach(function (c) { if (c.q > 0.6) return; var s = 0.7 + (c.y - gy) / (H - gy); grass += n3_P([[c.x - 4 * s, c.y], [c.x - 3 * s, c.y - 6 * s], [c.x - 1 * s, c.y - 1], [c.x, c.y - 9 * s], [c.x + 1.4 * s, c.y - 1], [c.x + 3.4 * s, c.y - 6 * s], [c.x + 4 * s, c.y]]); });
  add(near, 'c', grass, dk ? '#33463A' : '#7AB656');
  var flw = '', flw2 = ''; spread(0, gy + 8, W, H - gy - 8, ph ? 34 : 46, 26, rnd, 1).forEach(function (c) { if (c.q > 0.35) return; var s = 0.8 + (c.y - gy) / (H - gy) * 0.8, d = ''; for (var q = 0; q < 5; q++) d += n3_C(c.x + Math.cos(q * 1.257) * 2.4 * s, c.y + Math.sin(q * 1.257) * 2.4 * s, 1.8 * s); if (c.k < 0.5) flw += d; else flw2 += d; });
  var bush = '', bushL = ''; [[tx - tw * 3.4, 1], [tx + tw * 3.6, 0.85], [W * 0.06, 1.2], [W * 0.3, 0.8], [W * 0.95, 1.1]].forEach(function (q) { var r = (ph ? 22 : 34) * q[1], x = q[0], y = gy + 6; bush += n3_C(x, y - r * 0.6, r * 0.75) + n3_C(x - r * 0.75, y - r * 0.35, r * 0.55) + n3_C(x + r * 0.75, y - r * 0.38, r * 0.6) + rect(x - r * 1.2, y - r * 0.4, r * 2.4, r * 0.42); bushL += n3_C(x - r * 0.2, y - r * 0.85, r * 0.35) + n3_C(x + r * 0.55, y - r * 0.6, r * 0.25); });
  add(near, 'g', bush, dk ? '#1E3A28' : '#4E9A48'); add(near, 'h', bushL, dk ? '#2C4E36' : '#7CC066');
  add(near, 'd', flw, dk ? '#C8B8E8' : '#FFFFFF'); add(near, 'e', flw2, dk ? '#D89A7A' : '#F7C64A');
  // ---- moving parts: rope ladder, tire swing, tin-can telephone, birds, fairy lights
  var ladTop = [pX0 + (hx0 - pX0) * 0.4 + W * 0.01, pY + (ph ? 8 : 12)], ladLen = gy - ladTop[1] - (ph ? 20 : 30), lw = ph ? 18 : 26;
  var swB = [tx + W * (ph ? 0.3 : 0.24), H * 0.35], swLen = gy - swB[1] - H * (ph ? 0.12 : 0.13), tr = ph ? 22 : 34;
  var can0 = [hx1 + 6, hTop + (hBot - hTop) * 0.3], can1 = [W * (ph ? 0.98 : 0.96), H * (ph ? 0.18 : 0.15)];
  var lightsA = [[pX0, pY - (ph ? 22 : 30)], [pX1, pY - (ph ? 22 : 30)]], roofL = [rP[0], rP[1], rP[2]];
  if (ANIM) {
    ANIM.ladder = {x: ladTop[0], y: ladTop[1], len: ladLen, w: lw}; ANIM.swing = {x: swB[0], y: swB[1], len: swLen, r: tr}; ANIM.can = [can0, can1]; ANIM.rail = {x0: pX0, x1: pX1, y: pY - (ph ? 22 : 30), hx0: hx0, hx1: hx1};
    ANIM.lights = [lightsA, roofL]; ANIM.win = {x: wcx, y: wcy, w: wwd, h: wht}; ANIM.round = [rcx, rcy, rr]; ANIM.tree = {x: tx, y: H * (ph ? 0.36 : 0.36), rx: W * (ph ? 0.42 : 0.3), ry: H * (ph ? 0.2 : 0.26)}; ANIM.gy = gy; ANIM.ph = ph; ANIM.canopy = cl.concat(fcl).map(function (c) { return [W * c[0], H * c[1], c[2]]; });
  } else {
    var ropes = seg(ladTop[0], ladTop[1], ladTop[0], ladTop[1] + ladLen) + seg(ladTop[0] + lw, ladTop[1], ladTop[0] + lw, ladTop[1] + ladLen) + seg(swB[0] - tr * 0.6, swB[1], swB[0] - tr * 0.6, swB[1] + swLen) + seg(swB[0] + tr * 0.6, swB[1], swB[0] + tr * 0.6, swB[1] + swLen) + 'M' + PT(can0[0], can0[1]) + ' Q' + PT((can0[0] + can1[0]) / 2, (can0[1] + can1[1]) / 2 + 20) + ' ' + PT(can1[0], can1[1]) + ' ';
    stk(mid, 's', ropes, dk ? '#B8A080' : '#8A6A48', 1.6);
    var rungs = ''; for (var ry = ladTop[1] + 16; ry < ladTop[1] + ladLen; ry += ph ? 14 : 20) rungs += rect(ladTop[0] - 2, ry, lw + 4, ph ? 3 : 4); add(mid, 'h', rungs, dk ? '#A07850' : '#E0B47E');
    add(near, 'f', n3_E(swB[0], swB[1] + swLen + tr * 0.5, tr, tr * 0.45) + rrect(can1[0] - 5, can1[1], 10, 13, 2), dk ? '#22222A' : '#3A3A44');
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
