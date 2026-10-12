// ---- world theme: venice (Venice)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other; venice_hole() winds the other way on purpose, to cut an opening.
function venice_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function venice_pg(p) { return poly(venice_area(p) < 0 ? p.slice().reverse() : p); }
function venice_hole(p) { return poly(venice_area(p) > 0 ? p.slice().reverse() : p); }
function venice_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function venice_c(x, y, r) { return venice_e(x, y, r, r); }
// The view down the canal: an eye J.e metres above the water looking along +z. P maps a point (x across, y up, z along the
// canal, in metres) to the screen.
function venice_P(J, x, y, z) { return [J.vx + J.f * x / z, J.hz + J.f * (J.e - y) / z]; }
// a shape on a bank's facade (the plane x = xs), its points given as [z, height]; r: its reflection in the water
function venice_F(J, xs, pts, r) { return venice_pg(pts.map(function (p) { return venice_P(J, xs, r ? -p[1] : p[1], p[0]); })); }
// a shape on a plane facing the eye (z fixed), its points given as [x, height]
function venice_Z(J, z, pts, r) { return venice_pg(pts.map(function (p) { return venice_P(J, p[0], r ? -p[1] : p[1], z); })); }
// a Venetian Gothic window, the ogee point on top: centre u, sill v, w wide, h tall to the point; g grows it (its stone frame)
var venice_OG = [[-0.5, 0], [-0.49, 0.16], [-0.45, 0.32], [-0.38, 0.46], [-0.28, 0.58], [-0.17, 0.67], [-0.08, 0.75], [-0.03, 0.85], [0, 0.96]];
function venice_gothic(u, v, w, h, g) { g = g || 0; var W2 = w + g * 2, sp = v - g + h + g * 1.6 - W2 * 0.96, p = [[u - W2 / 2, v - g]], k;
  for (k = 0; k < venice_OG.length; k++) p.push([u + venice_OG[k][0] * W2, sp + venice_OG[k][1] * W2]);
  for (k = venice_OG.length - 2; k >= 0; k--) p.push([u - venice_OG[k][0] * W2, sp + venice_OG[k][1] * W2]);
  p.push([u + W2 / 2, v - g]); return p; }
// a round-headed opening: centre u, bottom v, w wide, h tall to the crown
function venice_round(u, v, w, h) { var r = w / 2, sp = v + h - r, p = [[u - r, v], [u - r, sp]]; for (var k = 1; k < 12; k++) { var a = Math.PI - k / 12 * Math.PI; p.push([u + Math.cos(a) * r, sp + Math.sin(a) * r]); } p.push([u + r, sp], [u + r, v]); return p; }
// a small irregular blob (a patch of bare brick where the plaster has worn away)
function venice_blob(u, v, ru, rv, rnd) { var p = []; for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2, q = 0.65 + rnd() * 0.45; p.push([u + Math.cos(a) * ru * q, v + Math.sin(a) * rv * q]); } return p; }

// ---------------------------------------------------------------- Venice
// Down a Venetian canal from a high window: faded ochre, rose and terracotta palazzos rise from green-teal water on both
// banks with Gothic windows, balconies, stone string courses, water doors with steps and striped mooring poles, funnel
// chimneys and a wooden altana. A humpbacked brick-and-stone footbridge with lanterns crosses the canal, a washing line
// is strung above it, two gondolas lie moored by the near steps, and at the canal's end the lagoon opens on St. Mark's
// domes, the Doge's palace and the brick campanile. The rowing gondola, ripples, bobbing gondolas, flowers, laundry,
// pigeons, shutters, lit windows, lantern glows and the finish's bells, pigeons, fleet and golden light are the engine's.
var venice_C = {
  L: {glow: 'rgba(255,236,206,0.6)', cloud: 'rgba(255,255,255,0.9)', haze: 'rgba(200,214,226,0.7)',
    water: '#4E9A92', sheen: 'rgba(214,236,236,0.55)', brick: '#B9654E', stone: '#F4EEE2', lead: '#8FA3A6', pink: '#E8B2A4', gold: '#E2B048', refl: 'rgba(170,100,60,0.18)', rip: 'rgba(255,255,255,0.7)', sline: 'rgba(80,60,60,0.45)',
    fac: ['#E7B66C', '#E39E8E', '#CB744F', '#EFDBB8'], win: '#3C4A52', roof: '#A5543C', shade: 'rgba(80,40,30,0.17)', lt: '#F6F0E4', dk: 'rgba(50,36,36,0.6)',
    nA: '#E9B36A', nB: '#E59A86', nBrick: '#C06A50', nStone: '#F6F0E4', nDark: '#36424A', nGreen: '#4E7E58', nRed: '#D6463C', nRefl: 'rgba(150,80,50,0.2)', joint: 'rgba(110,60,40,0.3)', iron: '#2E2A30', moon: '#FFF6E0'},
  D: {glow: 'rgba(150,120,200,0.3)', cloud: 'rgba(120,110,170,0.35)', haze: 'rgba(60,56,110,0.7)',
    water: '#1B2C4E', sheen: 'rgba(120,100,160,0.4)', brick: '#7A4A58', stone: '#B4ACC8', lead: '#5A6488', pink: '#8E6280', gold: '#F2CE7A', refl: 'rgba(255,200,130,0.12)', rip: 'rgba(170,190,255,0.3)', sline: 'rgba(20,16,40,0.55)',
    fac: ['#4A4470', '#4E4270', '#4A3A64', '#4A4470'], win: '#1C1D3C', roof: '#382E50', shade: 'rgba(10,8,30,0.3)', lt: '#6E6A94', dk: 'rgba(12,10,30,0.6)', lit: '#F6C878',
    nA: '#4E4874', nB: '#4E4874', nBrick: '#56405E', nStone: '#7A76A2', nDark: '#16172E', nGreen: '#24403E', nRed: '#8A3446', nRefl: 'rgba(120,110,180,0.22)', joint: 'rgba(10,8,30,0.35)', iron: '#14122A', moon: '#FFF2CC', nLit: '#F8CC80'}
};
// St. Mark's from across the basin, at the canal's end: the campanile (base at x cx), the basilica's domes, the Doge's
// palace. k: pixels per metre. Adds to the accumulators in K.
function venice_sanmarco(K, cx, by, k, dk) {
  var X = function (m) { return cx + m * k; }, Y = function (m) { return by - m * k; }, j, i;
  function R(x0, h0, x1, h1) { return venice_pg([[X(x0), Y(h0)], [X(x1), Y(h0)], [X(x1), Y(h1)], [X(x0), Y(h1)]]); }
  // the campanile: brick shaft with pilaster strips, the white belfry with its arches open to the sky, the brick attic, the green spire and a gold tip
  K.brick += R(-6, 0, 6, 50) + R(-5.8, 62.4, 5.8, 70.4);
  for (j = -4; j <= 4; j += 2) K.line += seg(X(j), Y(1), X(j), Y(48.5));
  K.line += seg(X(-6), Y(48.5), X(6), Y(48.5)) + seg(X(-5.8), Y(66.4), X(5.8), Y(66.4));
  K.stone += R(-6.6, 49.6, 6.6, 51.2) + R(-6.2, 61.4, 6.2, 63) + R(-6.6, 70.2, 6.6, 71.4) + R(-7, -0.5, 7, 1.6);
  K.stone += R(-6, 51, 6, 61.6); for (j = 0; j < 4; j++) K.stone += venice_hole(venice_round(-3.9 + j * 2.6, 52, 1.9, 7.6).map(function (p) { return [X(p[0]), Y(p[1])]; }));
  K.lead += venice_pg([[X(-5.6), Y(71.2)], [X(5.6), Y(71.2)], [X(0.4), Y(93.4)], [X(-0.4), Y(93.4)]]);
  K.gold += venice_pg([[X(-0.7), Y(93)], [X(0.7), Y(93)], [X(0.25), Y(97.6)], [X(-0.25), Y(97.6)]]) + venice_c(X(0), Y(93.6), 0.9 * k);
  // the basilica: a marble front of five arches with gold lunettes, ogee crests between pinnacles, five domes with lanterns behind
  var bx = 14;
  [[bx + 6, 34, 6.2], [bx + 34, 34, 6.2], [bx + 20, 38, 8.2], [bx + 11, 36.5, 5.6], [bx + 29, 36.5, 5.6]].forEach(function (d) { var x = d[0], h = d[1], r = d[2];
    K.stone += R(x - r * 0.85, h - 6, x + r * 0.85, h);
    var dm = []; for (i = 0; i <= 16; i++) { var a = Math.PI - i / 16 * Math.PI, b = Math.sin(a); dm.push([X(x + Math.cos(a) * r * (1 + 0.12 * b)), Y(h + b * r * 1.05 + Math.pow(b, 8) * r * 0.25)]); }
    K.lead += venice_pg(dm);
    K.stone += R(x - 0.9, h + r * 1.28, x + 0.9, h + r * 1.28 + 2.2); K.gold += venice_c(X(x), Y(h + r * 1.28 + 3.2), 0.8 * k); });
  K.stone += R(bx, 0, bx + 40, 20) + R(bx - 0.6, 19.4, bx + 40.6, 21);
  for (j = 0; j < 5; j++) { var ax = bx + 4 + j * 8, aw = j === 2 ? 6.4 : 5.2;
    K.line += pline(venice_round(ax, 0.4, aw, j === 2 ? 15 : 12.5).map(function (p) { return [X(p[0]), Y(p[1])]; }));
    K.gold += venice_pg(venice_round(ax, j === 2 ? 9.8 : 8.2, aw * 0.8, (j === 2 ? 15 : 12.5) - (j === 2 ? 9.8 : 8.2) - 0.6).map(function (p) { return [X(p[0]), Y(p[1])]; }));
    var cr = venice_gothic(ax, 21, aw + 1, 8.4); K.stone += venice_pg(cr.map(function (p) { return [X(p[0]), Y(p[1])]; })); K.gold += venice_pg(venice_gothic(ax, 21.6, aw * 0.6, 5.4).map(function (p) { return [X(p[0]), Y(p[1])]; }));
    K.stone += venice_pg([[X(ax + 4 - 0.5), Y(21)], [X(ax + 4 + 0.5), Y(21)], [X(ax + 4), Y(28)]]); }
  K.stone += venice_pg([[X(bx - 0.5), Y(21)], [X(bx + 0.5), Y(21)], [X(bx), Y(28)]]);
  // the Doge's palace: the two white arcades, the pink diamond-patterned wall with its big windows, a crenellated top
  var px = bx + 44, pw = 64;
  K.stone += R(px, 0, px + pw, 12.6);
  for (j = 0; j < 17; j++) K.line += pline(venice_round(px + 2 + j * 3.6, 0.3, 2.4, 5).map(function (p) { return [X(p[0]), Y(p[1])]; }));
  for (j = 0; j < 34; j++) K.line += pline(venice_gothic(px + 1.6 + j * 1.8, 7.2, 1.2, 4).map(function (p) { return [X(p[0]), Y(p[1])]; }));
  K.line += seg(X(px), Y(6.6), X(px + pw), Y(6.6));
  K.pink += R(px, 12.6, px + pw, 25.4);
  for (j = 0; j < 6; j++) { var wx = px + 6 + j * 10.6 + (j > 2 ? 2 : 0); K.stone += venice_pg(venice_gothic(wx, 15.4, 3.4, 6.4, 0.5).map(function (p) { return [X(p[0]), Y(p[1])]; })); K.line += venice_pg(venice_gothic(wx, 15.6, 2.6, 5.8).map(function (p) { return [X(p[0]), Y(p[1])]; })); }
  for (j = 0; j < 30; j++) { var mx = px + 1 + j * pw / 30; K.stone += venice_pg([[X(mx), Y(25.4)], [X(mx + 1.2), Y(25.4)], [X(mx + 1.2), Y(26.8)], [X(mx + 0.6), Y(27.6)], [X(mx), Y(26.8)]]); }
  if (!dk) for (j = 0; j < 22; j++) K.lineL += seg(X(px + j * 3), Y(12.8), X(px + j * 3 + 6), Y(25.2)) + seg(X(px + j * 3 + 6), Y(12.8), X(px + j * 3), Y(25.2));
  // the quay of the Molo with two granite columns
  K.stone += R(-30, -0.6, px + pw + 20, 0.8);
  [[bx + 46 + pw, 15], [bx + 54 + pw, 15]].forEach(function (c) { K.stone += R(c[0] - 0.7, 0, c[0] + 0.7, c[1]) + R(c[0] - 1.3, c[1], c[0] + 1.3, c[1] + 1.4); });
  return {bell: [X(0), Y(56.5)], top: [X(0), Y(97)], domes: [X(bx + 20), Y(44)], w: (px + pw - -7) * k};
}
// One palazzo on a bank (the plane x = xs, sg -1 left, 1 right) from z0 to z1, Hb tall. Z collects the paths; returns its windows.
function venice_palazzo(J, Z, sg, z0, z1, Hb, fl, col, rnd, near) {
  var xs = sg * J.xs, F = function (pts) { return venice_F(J, xs, pts); }, Fr = function (pts) { return venice_F(J, xs, pts, 1); }, wins = [], i, j, k;
  var g = 3.8, fh = (Hb - g - 0.9) / fl, w = z1 - z0, uc = z0 + w * (0.42 + rnd() * 0.16), patchy = col !== 2;
  var R = function (a, b, h0, h1) { return [[a, h0], [b, h0], [b, h1], [a, h1]]; };
  // a window for the night: its glass, and the point where its light falls on the water
  function addW(pts, u) { var v = 0; pts.forEach(function (q) { v += q[1]; }); v /= pts.length; wins.push({p: F(pts), z: u, k: rnd(), r: venice_P(J, xs, -v, u), s: J.f / u}); }
  Z.fac[col] += F(R(z0, z1, 0, Hb)); Z.refl += Fr(R(z0, z1, 0, Hb));
  // worn plaster: patches of bare brick
  if (patchy) for (k = 0; k < (near ? 3 : 2); k++) Z.brick += F(venice_blob(z0 + w * (0.15 + rnd() * 0.7), 1.4 + rnd() * (Hb - 3), 0.5 + rnd() * 0.8, 0.4 + rnd() * 0.6, rnd));
  // the waterline: green weed below, a white stone plinth above it; string courses; the cornice and the eave above it
  Z.algae += F(R(z0, z1, 0, 0.6)); Z.trim += F(R(z0, z1, 0.6, 0.85));
  Z.trim += F(R(z0, z1, g - 0.1, g + 0.12)); for (i = 1; i < fl; i++) Z.trim += F(R(z0, z1, g + i * fh - 0.08, g + i * fh + 0.1));
  Z.trim += F(R(z0, z1, Hb - 0.55, Hb - 0.2)); Z.shade += F(R(z0, z1, Hb - 0.2, Hb));
  var eo = sg * -0.55, E1 = venice_P(J, xs, Hb, z0), E2 = venice_P(J, xs, Hb, z1), E3 = venice_P(J, xs + eo, Hb + 0.3, z1), E4 = venice_P(J, xs + eo, Hb + 0.3, z0);
  Z.roof += venice_pg([E1, E2, E3, E4]);
  // the water door: a round arch with a stone frame, two stone steps down into the water, striped poles in front
  var dw = Math.min(2.4, w * 0.3);
  Z.trim += F(venice_round(uc, 0.6, dw + 0.6, 3.3)); Z.win += F(venice_round(uc, 0.6, dw, 3)); Z.trim += F(R(uc - dw / 2 - 0.5, uc + dw / 2 + 0.5, 0.5, 0.75));
  for (k = 0; k < 2; k++) { var sh = 0.32 - k * 0.2, so = 0.5 + k * 0.45, a2 = uc - dw / 2 - 0.4 - k * 0.15, b2 = uc + dw / 2 + 0.4 + k * 0.15;
    Z.trim += venice_pg([venice_P(J, xs, sh, a2), venice_P(J, xs, sh, b2), venice_P(J, xs - sg * so, sh, b2), venice_P(J, xs - sg * so, sh, a2)]);
    Z.shade += venice_pg([venice_P(J, xs - sg * so, sh, a2), venice_P(J, xs - sg * so, sh, b2), venice_P(J, xs - sg * so, sh - 0.16, b2), venice_P(J, xs - sg * so, sh - 0.16, a2)]); }
  var poles = [];
  [-1.5, 1.5, 3.2].forEach(function (o, n) { if (n === 2 && rnd() < 0.5) return; var pz = uc + o * (dw / 2 + 0.6), px = xs - sg * (1.5 + n * 0.25), ph = 3.4 + rnd() * 0.8; poles.push([px, pz, ph]); });
  Z.poles = (Z.poles || []).concat(poles);
  // small barred windows by the door, on the ground floor
  [uc - dw - 1.6, uc + dw + 1.6].forEach(function (u) { if (u - 0.6 < z0 + 0.6 || u + 0.6 > z1 - 0.6) return; Z.trim += F(R(u - 0.55, u + 0.55, 1.5, 2.9)); Z.win += F(R(u - 0.4, u + 0.4, 1.65, 2.75)); addW(R(u - 0.4, u + 0.4, 1.65, 2.75), u); });
  // the piano nobile: a row of Gothic lights behind a stone balcony, single Gothic windows towards the ends
  var v1 = g + 0.35, lw = 0.82, gap = 0.3, n = w > 10 ? 5 : w > 7 ? 4 : 3, lh = fh * 0.74, gw = n * lw + (n - 1) * gap, u0 = Math.max(z0 + 0.9, Math.min(z1 - 0.9 - gw, uc - gw / 2));
  Z.trim += F(R(u0 - 0.3, u0 + gw + 0.3, v1 - 0.1, v1 + lh - lw * 0.9));
  for (j = 0; j < n; j++) { var lu = u0 + lw / 2 + j * (lw + gap); Z.trim += F(venice_gothic(lu, v1, lw, lh, 0.16)); var gp = venice_gothic(lu, v1 + 0.05, lw, lh - 0.05); Z.win += F(gp); addW(gp, lu); }
  // the balcony: its slab, a balustrade on its front edge (lines of balusters) and its rail
  var bo = sg * -0.62, ba = u0 - 0.45, bb = u0 + gw + 0.45;
  Z.shade += venice_pg([venice_P(J, xs, v1 - 0.1, ba), venice_P(J, xs, v1 - 0.1, bb), venice_P(J, xs + bo, v1 - 0.1, bb), venice_P(J, xs + bo, v1 - 0.1, ba)]);
  Z.trim += venice_pg([venice_P(J, xs + bo, v1 - 0.3, ba), venice_P(J, xs + bo, v1 - 0.3, bb), venice_P(J, xs + bo, v1 - 0.06, bb), venice_P(J, xs + bo, v1 - 0.06, ba)]);
  Z.trim += venice_pg([venice_P(J, xs + bo, v1 + 0.86, ba), venice_P(J, xs + bo, v1 + 0.86, bb), venice_P(J, xs + bo, v1 + 1.02, bb), venice_P(J, xs + bo, v1 + 1.02, ba)]);
  Z.trim += venice_pg([venice_P(J, xs, v1 + 0.86, ba), venice_P(J, xs + bo, v1 + 0.86, ba), venice_P(J, xs + bo, v1 + 1.02, ba), venice_P(J, xs, v1 + 1.02, ba)]);
  for (var bu = ba + 0.15; bu < bb - 0.1; bu += near ? 0.26 : 0.4) { var q1 = venice_P(J, xs + bo, v1 - 0.06, bu), q2 = venice_P(J, xs + bo, v1 + 0.86, bu); Z.bal += seg(q1[0], q1[1], q2[0], q2[1]); }
  var flw = [];
  if (near) flw.push([xs + bo, v1 + 1.02, ba + 0.3, bb - 0.3]);
  // side windows on the piano nobile and the floors above: Gothic on the lower floors, square with green shutters higher up
  var cols = []; for (var cu = z0 + 1.5; cu < z1 - 1.2; cu += 2.3) if (cu + 0.6 < u0 - 0.6 || cu - 0.6 > u0 + gw + 0.6) cols.push(cu);
  cols.forEach(function (u) { Z.trim += F(venice_gothic(u, v1, 0.9, lh * 0.94, 0.18)); var gp2 = venice_gothic(u, v1 + 0.05, 0.9, lh * 0.94 - 0.05); Z.win += F(gp2); addW(gp2, u); });
  var shut = [];
  for (i = 1; i < fl; i++) { var vb = g + i * fh + 0.35, top = i === fl - 1, wh = fh * (top ? 0.5 : 0.62), gothic = !top && (col + i) % 2 === 0;
    var us = []; if (gothic) { for (j = 0; j < n; j++) us.push(u0 + lw / 2 + j * (lw + gap)); } else { for (var su = z0 + 1.3; su < z1 - 1; su += 2) us.push(su); }
    if (gothic) us = us.concat(cols);
    us.forEach(function (u) {
      if (gothic) { Z.trim += F(venice_gothic(u, vb, 0.82, wh, 0.16)); var gp3 = venice_gothic(u, vb + 0.05, 0.82, wh - 0.05); Z.win += F(gp3); addW(gp3, u); }
      else { var ww = 0.8; Z.trim += F(R(u - ww / 2 - 0.16, u + ww / 2 + 0.16, vb - 0.16, vb + wh + 0.2)); var wp = R(u - ww / 2, u + ww / 2, vb, vb + wh); Z.win += F(wp); addW(wp, u);
        // shutters folded back against the wall, either side
        if (rnd() < 0.8) { var sl = R(u - ww / 2 - 0.42, u - ww / 2, vb, vb + wh), sr = R(u + ww / 2, u + ww / 2 + 0.42, vb, vb + wh); if (near && ANIM && shut.length < 2 && rnd() < 0.4) shut.push([u, vb, ww, wh]); else Z.green += F(sl) + F(sr); }
        if (near && rnd() < 0.55) flw.push([xs, vb, u - ww / 2 - 0.05, u + ww / 2 + 0.05]); } });
  }
  // the box under a window or along a balcony rail, its flowers drawn by the scene (still) or the engine (swaying)
  flw.forEach(function (f) { var bx0 = f[0] - sg * 0.02, bxo = f[0] - sg * 0.32; Z.box += venice_pg([venice_P(J, bx0, f[1] - 0.05, f[2]), venice_P(J, bx0, f[1] - 0.05, f[3]), venice_P(J, bxo, f[1] + 0.2, f[3]), venice_P(J, bxo, f[1] + 0.2, f[2])]); });
  Z.flw = (Z.flw || []).concat(flw.map(function (f) { return {x: f[0] - sg * 0.2, h: f[1] + 0.25, za: f[2], zb: f[3]}; }));
  Z.shut = (Z.shut || []).concat(shut.map(function (s) { return {xs: xs, sg: sg, u: s[0], v: s[1], w: s[2], h: s[3]}; }));
  // funnel chimneys behind the roof edge, and now and then a wooden altana on the roof
  // the roof edge seen from the water: the screen y of the eave over screen x sx (what stands behind it shows above this)
  function eave(sx) { var zz = J.f * xs / (sx - J.vx); if (!(zz > 0)) zz = z1; zz = Math.max(z0, Math.min(z1 + 6, zz)); return venice_P(J, xs, Hb + 0.3, zz)[1]; }
  var nc = 1 + Math.floor(rnd() * 2 + w / 9);
  for (k = 0; k < nc; k++) { var cz = z0 + 0.8 + (w - 1.6) * (nc > 1 ? k / (nc - 1) : 0.5) + (rnd() - 0.5) * 0.8, cx = xs + sg * (0.9 + rnd() * 2.2), cb = Hb + 0.6, chh = 1.6 + rnd() * 1.4, cwh = 0.28;
    var P1 = function (dx, h) { return venice_P(J, cx + dx, h, cz); }, yv = eave(P1(0, cb)[0]), t0 = P1(-cwh, cb + chh);
    if (t0[1] >= yv - 1) continue;
    Z.chim += venice_pg([[P1(-cwh, cb)[0], yv + 1], [P1(cwh, cb)[0], yv + 1], P1(cwh, cb + chh), t0]);
    if (k % 2 === 0) Z.chim += venice_pg([P1(-cwh - 0.05, cb + chh), P1(cwh + 0.05, cb + chh), P1(0.62, cb + chh + 0.85), P1(-0.62, cb + chh + 0.85)]) + venice_pg([P1(-0.7, cb + chh + 0.85), P1(0.7, cb + chh + 0.85), P1(0.7, cb + chh + 1.05), P1(-0.7, cb + chh + 1.05)]);
    else Z.chim += venice_pg([P1(-0.45, cb + chh), P1(0.45, cb + chh), P1(0.45, cb + chh + 0.35), P1(0.2, cb + chh + 0.55), P1(-0.2, cb + chh + 0.55), P1(-0.45, cb + chh + 0.35)]);
    Z.tops.push(P1(0, cb + chh + 1.05)); }
  if (z0 > 40 && rnd() < 0.5) { var az0 = z0 + w * 0.25, az1 = Math.min(z1 - 0.5, az0 + 3.4), ax0 = xs + sg * 0.8, ax1 = xs + sg * 3.6, af = Hb + 1.2, at = af + 1.1, A = function (x, h, z) { return venice_P(J, x, h, z); }, ap;
    var post = function (x, z, h0, h1) { var p0 = A(x, h0, z), p1 = A(x, h1, z), yb = Math.min(p0[1], eave(p0[0])); if (p1[1] < yb) Z.wood += seg(p0[0], yb, p1[0], p1[1]); };
    [[ax0, az0], [ax0, az1], [ax1, az0], [ax1, az1]].forEach(function (q) { post(q[0], q[1], Hb, at); });
    for (var au = az0 + 0.35; au < az1; au += 0.35) post(ax0, au, af, at);
    ap = [A(ax0, at, az0), A(ax0, at, az1)]; Z.wood += seg(ap[0][0], ap[0][1], ap[1][0], ap[1][1]); ap = [A(ax0, at, az0), A(ax1, at, az0)]; Z.wood += seg(ap[0][0], ap[0][1], ap[1][0], ap[1][1]);
    ap = [A(ax0, af, az0), A(ax0, af, az1)]; Z.wood += seg(ap[0][0], ap[0][1], ap[1][0], ap[1][1]); }
  return wins;
}
// A gondola lying along the canal: stern at z0, bow towards z0 + 10.8, centre x, rocked by roll (rf -1: its reflection). Returns its hull, the
// black topsides, the bow iron, and a blue cover over the passenger seats (moored ones), as screen polygons.
function venice_gondola3(J, x, z0, lift, roll, dir, rf) {
  var Pv = function (x1, h, z) { return venice_P(J, x1, (rf || 1) * h, z); }, L = 10.8, top = [], wl = [], inL = [], inR = [], fer = [], cov = [], t, n = 18;
  for (var i = 0; i <= n; i++) { t = i / n; var z = z0 + dir * t * L, hw = 0.7 * Math.pow(Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, t))), 0.55), sh = 0.45 + 0.75 * Math.pow(t, 7) + 0.55 * Math.pow(1 - t, 6) + lift;
    top.push(Pv(x - hw + roll * sh, sh, z)); wl.unshift(Pv(x + hw * 0.92, lift, z)); if (i > 1 && i < n - 1) { inL.push(Pv(x - hw * 0.8 + roll * sh, sh - 0.04, z)); inR.unshift(Pv(x + hw * 0.8 + roll * sh, sh - 0.04, z)); } }
  var hull = top.concat([Pv(x + roll * 1.3, 1.35 + lift, z0 + dir * L)], wl);
  var bz = z0 + dir * L * 0.98, b1 = Pv(x + roll, 1.2 + lift, bz), b2 = Pv(x + roll * 1.6, 2.0 + lift, bz + dir * 0.25), b3 = Pv(x + roll * 1.4, 2.0 + lift, bz - dir * 0.15);
  fer = [b1, b2, b3];
  for (i = 0; i <= 8; i++) { t = 0.36 + i / 8 * 0.3; var z2 = z0 + dir * t * L; cov.push(Pv(x - 0.5 + roll, 0.98 + lift, z2)); }
  for (i = 8; i >= 0; i--) { t = 0.36 + i / 8 * 0.3; var z3 = z0 + dir * t * L; cov.push(Pv(x + 0.5 + roll, 0.72 + lift, z3)); }
  return {hull: hull, inner: inL.concat(inR), fer: fer, cov: cov, stern: Pv(x, 1 + lift, z0), bow: Pv(x, 1.4 + lift, z0 + dir * L)};
}
SCENES.venice = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(4), refl = Lay(0), mid = Lay(0), near = Lay(0), C = venice_C[dk ? 'D' : 'L'], i, j, k, x, y;
  var sky = dk ? 'linear-gradient(180deg,#0E1636 0%,#22285A 26%,#5A3A62 44%,#2A2A58 46%,#1B2C4E 100%)' : 'linear-gradient(180deg,#A8D2EE 0%,#F2ECDD 30%,#F6D3B0 44%,#B8D8D0 46%,#4E9A92 100%)';
  var S = ph ? 1 : Math.max(0.6, Math.min(1.15, H / 800));
  // the eye: J.e metres above the water, the canal J.xs either side of the middle, the bridge at zB, the lagoon past zEnd
  var J = ph ? {hz: H * 0.4, vx: W * 0.5, f: W * 1.55, e: 8, xs: 7.2} : {hz: H * 0.45, vx: W * 0.56, f: H * 1.25, e: 8, xs: 13};
  var hz = J.hz, zB = 30, zEndL = ph ? 76 : 92, zEndR = ph ? 70 : 80, zN = 28, zM = 32;
  // ---- far: glow, clouds, the hazy far shore of the lagoon
  var mn = [W * (ph ? 0.74 : 0.86), H * (ph ? 0.1 : 0.12), ph ? 20 : 26 * S];
  add(far, 'a', venice_e(J.vx, hz - H * 0.03, W * 0.7, H * 0.16), C.glow);
  if (dk) add(far, 'a', venice_c(mn[0], mn[1], mn[2] * 3.4), 'rgba(200,190,255,0.18)');
  var cl = ''; (ph ? [[0.22, 0.07, 0.55], [0.8, 0.2, 0.5], [0.35, 0.3, 0.4]] : [[0.08, 0.08, 0.9], [0.36, 0.04, 0.7], [0.62, 0.18, 0.75], [0.9, 0.3, 0.6], [0.22, 0.28, 0.55]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], s = q[2] * (ph ? 0.8 : S);
    cl += venice_e(cx, cy, 90 * s, 14 * s) + venice_e(cx - 34 * s, cy - 8 * s, 40 * s, 17 * s) + venice_e(cx + 20 * s, cy - 15 * s, 46 * s, 23 * s) + venice_e(cx + 58 * s, cy - 4 * s, 30 * s, 12 * s); });
  add(far, 'b', cl, C.cloud);
  var shore = ''; for (x = -20; x < W + 20; x += 14 + rnd() * 22) { var sh2 = H * (0.004 + rnd() * 0.012); shore += rect(x, hz - sh2, 10 + rnd() * 26, sh2 + 3); }
  shore += venice_e(J.vx - W * 0.3, hz, W * 0.12, H * 0.01) + venice_e(J.vx + W * 0.28, hz, W * 0.1, H * 0.008);
  add(far, 'c', shore, C.haze);
  // ---- refl: the water, the stars and moon, St. Mark's across the basin, and the far banks' reflections
  var K = {brick: '', stone: '', lead: '', gold: '', pink: '', line: '', lineL: ''};
  var sk = H * (ph ? 0.0021 : 0.0029), smX = J.vx - (ph ? 26 : 70) * S * (ph ? 1 : 1), SM = venice_sanmarco(K, smX, hz, sk, dk);
  add(refl, 'a', rect(-10, hz, W + 20, H - hz + 10), C.water);
  add(refl, 'b', rect(-10, hz, W + 20, H * 0.05) + rect(-10, hz + H * 0.05, W + 20, H * 0.03), C.sheen);
  add(refl, 'c', K.pink, C.pink); add(refl, 'd', K.brick, C.brick); add(refl, 'f', K.lead, C.lead); add(refl, 'g', K.gold + (dk ? venice_c(mn[0], mn[1], mn[2]) : ''), dk ? C.moon : C.gold);
  var stars = ''; if (dk) spread(0, 0, W, hz - H * 0.1, 44, 40, rnd, 1).forEach(function (c) { if (c.q < 0.3 && Math.hypot(c.x - mn[0], c.y - mn[1]) > mn[2] * 1.8) stars += venice_c(c.x, c.y, 0.5 + c.r * 0.9); });
  add(refl, 'e', K.stone + stars, C.stone);
  stk(refl, 't', K.line, C.sline, Math.max(0.6, sk * 0.4)); if (K.lineL) stk(refl, 's', K.lineL, 'rgba(255,255,255,0.4)', 0.5);
  // the skyline's reflection in the basin: broken strips under the campanile and the domes
  var srf = ''; for (y = hz + 1; y < hz + H * 0.06; y += 2.6) { var dd = (y - hz) / sk; if (dd < 97) srf += rect(smX - 6 * sk + Math.sin(y * 0.9) * 2, y, 12 * sk * (0.7 + 0.3 * Math.sin(y * 1.7)), 1.6); if (dd < 44) srf += rect(smX + 14 * sk + Math.sin(y * 1.1) * 2, y, 40 * sk * (0.75 + 0.25 * Math.sin(y)), 1.6); }
  // ---- the banks: palazzos on both sides from the near buildings to the canal's end
  var ZM = {fac: ['', '', '', ''], refl: '', brick: '', algae: '', trim: '', shade: '', roof: '', win: '', bal: '', green: '', box: '', chim: '', wood: '', tops: []}, ZN = {fac: ['', '', '', ''], refl: '', brick: '', algae: '', trim: '', shade: '', roof: '', win: '', bal: '', green: '', box: '', chim: '', wood: '', tops: []};
  var wins = [], nwins = [], sides = [];
  [-1, 1].forEach(function (sg) { var zE = sg < 0 ? zEndL : zEndR, z = zM, n = 0, cols = sg < 0 ? [3, 1, 0, 2, 1, 3, 0] : [0, 2, 3, 1, 0, 2, 1];
    // the near palazzo, cut off by the edge of the picture
    var nh = sg < 0 ? 18.5 : 17;
    nwins = nwins.concat(venice_palazzo(J, ZN, sg, 6, zN, nh, 4, sg < 0 ? 0 : 1, rnd, true));
    var hs = [];
    while (z < zE - 2) { var w = Math.min(zE - z, (ph ? 7 : 8) + rnd() * 6), hb = 13 + rnd() * 5.5; if (zE - z - w < 5) w = zE - z;
      wins = wins.concat(venice_palazzo(J, ZM, sg, z, z + w, hb, hb > 16 ? 4 : 3, cols[n % cols.length], rnd, false)); hs.push([z, hb, cols[n % cols.length]]); z += w; n++; }
    sides.push({sg: sg, hs: hs, zE: zE, nh: nh}); });
  // end walls: where a palazzo stands taller than the one before it, its side wall shows above its neighbour's roof
  sides.forEach(function (sd) { var xs = sd.sg * J.xs; sd.hs.forEach(function (b, n) { var prev = n ? sd.hs[n - 1][1] : 0; if (n && b[1] > prev + 0.4) { var p = venice_Z(J, b[0], [[xs, prev], [xs + sd.sg * 9, prev], [xs + sd.sg * 9, b[1]], [xs, b[1]]]); ZM.fac[b[2]] += p; ZM.shade += p; } });
    // the first one behind the bridge: its whole end wall faces us across the calle the bridge lands in
    var b0 = sd.hs[0], p0 = venice_Z(J, b0[0], [[sd.sg * J.xs, 0], [sd.sg * (J.xs + 12), 0], [sd.sg * (J.xs + 12), b0[1]], [sd.sg * J.xs, b0[1]]]); ZM.fac[b0[2]] += p0; ZM.shade += p0;
    var cw = venice_Z(J, b0[0], [[sd.sg * (J.xs + 2), 0.6], [sd.sg * (J.xs + 3.4), 0.6], [sd.sg * (J.xs + 3.4), 2.8], [sd.sg * (J.xs + 2), 2.8]]); ZM.win += cw;
    for (var eh = 4.6; eh < b0[1] - 2.4; eh += 3.1) [2.2, 5.6, 9].forEach(function (ex) { var q = function (a, b, h0, h1) { return venice_Z(J, b0[0], [[sd.sg * (J.xs + a), h0], [sd.sg * (J.xs + b), h0], [sd.sg * (J.xs + b), h1], [sd.sg * (J.xs + a), h1]]); };
      ZM.trim += q(ex - 0.15, ex + 1.05, eh - 0.15, eh + 1.75); ZM.win += q(ex, ex + 0.9, eh, eh + 1.6); ZM.green += q(ex - 0.5, ex - 0.05, eh, eh + 1.6) + q(ex + 0.95, ex + 1.4, eh, eh + 1.6); });
    // the last one: the lagoon side, a strip of quay and a lamp
    var zl = sd.zE, bl = sd.hs[sd.hs.length - 1]; ZM.shade += venice_Z(J, zl, [[sd.sg * J.xs, 0], [sd.sg * (J.xs + 0.4), 0], [sd.sg * (J.xs + 0.4), bl[1]], [sd.sg * J.xs, bl[1]]]); });
  if (dk && !ANIM) { var lit = ''; wins.forEach(function (w) { if (w.k < 0.4) lit += w.p; }); ZM.fac[3] = ''; ZM.lit = lit; }
  add(mid, 'a', ZM.fac[0] + (dk ? ZM.fac[3] : ''), C.fac[0]); add(mid, 'b', ZM.fac[1], C.fac[1]); add(mid, 'c', ZM.fac[2] + ZM.brick, C.fac[2]); add(mid, 'd', dk ? ZM.roof + ZM.chim : ZM.fac[3], dk ? C.roof : C.fac[3]);
  add(mid, 'e', ZM.trim + ZM.box, C.stone); add(mid, 'f', ZM.win, C.win); add(mid, 'g', dk ? (ZM.lit || '') : ZM.roof + ZM.chim, dk ? C.lit : C.roof); add(mid, 'h', ZM.shade + ZM.algae + ZM.green, C.shade);
  stk(mid, 's', ZM.bal, C.stone, ph ? 0.5 : 0.7); stk(mid, 't', ZM.wood, C.dk, ph ? 0.6 : 0.9);
  // poles at the far water doors: white with a coloured spiral
  var pw = '', pr = '';
  function pole(px, pz, ph2, wd) { var a = venice_P(J, px, 0, pz), b = venice_P(J, px, ph2, pz), r = Math.max(0.6, wd * J.f / pz / 2), out = {w: rect(a[0] - r, b[1], r * 2, a[1] - b[1]), s: ''};
    for (var hh = 0.7; hh < ph2 - 0.3; hh += 0.55) { var p1 = venice_P(J, px, hh, pz), p2 = venice_P(J, px, hh + 0.25, pz); out.s += venice_pg([[a[0] - r, p1[1]], [a[0] + r, p1[1] - r * 1.2], [a[0] + r, p2[1] - r * 1.2], [a[0] - r, p2[1]]]); }
    out.s += venice_e(a[0], b[1], r * 1.3, r * 0.7); return out; }
  ZM.poles.forEach(function (p) { var o = pole(p[0], p[1], p[2], 0.24); pw += o.w; pr += o.s; });
  add(mid, 'e', pw); add(mid, dk ? 'd' : 'g', pr);
  add(refl, 'h', ZM.refl + srf, C.refl);
  // ---- near: the bridge, the near palazzos, the washing line
  var nb = '', nr = '', brick = ZN.brick, stone = ZN.trim + ZN.box, dark = ZN.win, green = ZN.green + ZN.algae, red = '', joint = '', iron = '', reflN = ZN.refl;
  ZN.fac.forEach(function (f, n) { if (n === 0) nb += f; else nr += f; });
  brick += ZN.roof + ZN.chim; dark += ZN.shade;
  // the bridge, square to the eye at zB: s pixels per metre
  var s = J.f / zB, BX = function (m) { return J.vx + m * s; }, BY = function (h) { return hz + (J.e - h) * s; }, xe = J.xs * zB / zN, sp = J.xs * (ph ? 0.72 : 0.78), cr = 4.3;
  var Rr = (sp * sp + cr * cr) / (2 * cr), ac = cr - Rr;
  function deck(m) { var u = Math.min(1, Math.abs(m) / (J.xs + 1.6)); return 1.2 + (ph ? 3.6 : 4.1) * Math.pow(Math.cos(u * Math.PI / 2), 1.25); }
  function archH(m) { return Math.abs(m) >= sp ? 0 : ac + Math.sqrt(Rr * Rr - m * m); }
  var top = [], bot = [], m, AR = [], AR2 = [];
  for (m = -xe; m <= xe + 0.01; m += xe / 30) { top.push([BX(m), BY(deck(m) + 1.05)]); }
  bot = [[BX(xe), BY(-0.05)], [BX(-xe), BY(-0.05)]];
  brick += venice_pg(top.concat(bot));
  for (k = 0; k <= 24; k++) { m = -sp + k / 24 * sp * 2; AR.push([BX(m), BY(archH(m))]); }
  brick += venice_hole(AR.concat([[BX(sp), BY(-0.05)], [BX(-sp), BY(-0.05)]]));
  // the stone arch ring with its voussoirs and keystone, the stone cap on the parapet and the deck band, the stone feet
  var ring = [], rin = [];
  var phi = Math.asin(Math.min(1, sp / Rr));
  for (k = 0; k <= 24; k++) { var an = Math.PI / 2 + phi - k / 24 * 2 * phi, ca = Math.cos(an), sa = Math.sin(an);
    ring.push([BX(ca * (Rr + 0.6)), BY(ac + sa * (Rr + 0.6))]); rin.unshift([BX(ca * Rr), BY(ac + sa * Rr)]);
    if (k % 2 === 0 && k > 0 && k < 24) joint += seg(BX(ca * Rr), BY(ac + sa * Rr), BX(ca * (Rr + 0.6)), BY(ac + sa * (Rr + 0.6))); }
  stone += venice_pg(ring.concat(rin));
  stone += venice_pg([[BX(-0.45), BY(cr - 0.05)], [BX(0.45), BY(cr - 0.05)], [BX(0.6), BY(cr + 0.9)], [BX(-0.6), BY(cr + 0.9)]]);
  var cap = [], capb = [], db = [], dbb = [];
  for (m = -xe; m <= xe + 0.01; m += xe / 30) { cap.push([BX(m), BY(deck(m) + 1.22)]); capb.unshift([BX(m), BY(deck(m) + 0.96)]); db.push([BX(m), BY(deck(m) + 0.02)]); dbb.unshift([BX(m), BY(deck(m) - 0.24)]); }
  stone += venice_pg(cap.concat(capb)) + venice_pg(db.concat(dbb));
  [-1, 1].forEach(function (sg) { stone += venice_pg([[BX(sg * sp), BY(-0.05)], [BX(sg * (sp + 0.9)), BY(-0.05)], [BX(sg * (sp + 0.9)), BY(1.2)], [BX(sg * sp), BY(1.2)]]); });
  // brick courses, broken around the arch
  for (var hh = 0.4; hh < 6; hh += 0.32) { var segs = [], aw = hh < cr ? Math.sqrt(Math.max(0, Rr * Rr - Math.pow(hh - ac, 2))) + 0.6 : -1, xm = 0;
    for (m = 0; m <= xe; m += 0.05) if (deck(m) - 0.25 > hh) xm = m;
    if (xm <= 0) continue; if (hh < 1.2) aw = Math.max(aw, sp + 0.9);
    if (aw < 0) joint += seg(BX(-xm), BY(hh), BX(xm), BY(hh)); else if (aw < xm) joint += seg(BX(-xm), BY(hh), BX(-aw), BY(hh)) + seg(BX(aw), BY(hh), BX(xm), BY(hh)); }
  for (m = -xe + 0.3; m < xe; m += 0.62) joint += seg(BX(m), BY(deck(m) + 0.96), BX(m), BY(deck(m) + 0.24));
  // the parapet across the far side of the deck shows its cap just above this one
  var s2 = J.f / (zB + 3.4), bcap = [], bcapb = [];
  for (m = -xe * 0.9; m <= xe * 0.9 + 0.01; m += xe / 30) { bcap.push([J.vx + m * s2, hz + (J.e - deck(m) - 1.22) * s2]); bcapb.unshift([J.vx + m * s2, hz + (J.e - deck(m) - 0.9) * s2]); }
  stone = venice_pg(bcap.concat(bcapb)) + stone;
  // the bridge in the water
  var rt = [], rb = [];
  for (m = -xe; m <= xe + 0.01; m += xe / 30) rt.push([BX(m), BY(-(deck(m) + 1.2))]);
  reflN += venice_pg(rt.concat([[BX(xe), BY(0)], [BX(-xe), BY(0)]])) + venice_hole(AR.map(function (p) { return [p[0], 2 * BY(0) - p[1]]; }).concat([[BX(sp), BY(0.05)], [BX(-sp), BY(0.05)]]));
  // lanterns on iron posts at both ends of the parapet
  var lamps = [];
  [-1, 1].forEach(function (sg) { var lm = sg * (sp + 0.4), lb = deck(lm) + 1.22, lh2 = 2.4, lx = BX(lm), sc = s / 30;
    iron += seg(lx, BY(lb), lx, BY(lb + lh2)) + seg(lx - 3 * sc, BY(lb + 0.2), lx + 3 * sc, BY(lb + 0.2));
    dark += venice_pg([[lx - 4.6 * sc, BY(lb + lh2)], [lx + 4.6 * sc, BY(lb + lh2)], [lx + 6 * sc, BY(lb + lh2 + 0.7)], [lx - 6 * sc, BY(lb + lh2 + 0.7)]]) + venice_pg([[lx - 6.6 * sc, BY(lb + lh2 + 0.7)], [lx + 6.6 * sc, BY(lb + lh2 + 0.7)], [lx, BY(lb + lh2 + 1.15)]]);
    var gl = rect(lx - 4.4 * sc, BY(lb + lh2 + 0.66), 8.8 * sc, (0.62) * s); ZN.lampG = (ZN.lampG || '') + gl;
    lamps.push([lx, BY(lb + lh2 + 0.38), sc, BY(-(lb + lh2 + 0.38))]); });
  // a wall lantern by the near water door, left
  var wl0 = venice_P(J, -J.xs - 0.05, 4.6, 21), wl1 = venice_P(J, -J.xs + 0.6, 4.6, 21), wsc = J.f / 21 / 30;
  iron += seg(wl0[0], wl0[1], wl1[0], wl1[1]);
  dark += venice_pg([[wl1[0] - 5 * wsc, wl1[1]], [wl1[0] + 5 * wsc, wl1[1]], [wl1[0] + 6 * wsc, wl1[1] + 16 * wsc], [wl1[0] - 6 * wsc, wl1[1] + 16 * wsc]]);
  ZN.lampG += rect(wl1[0] - 4 * wsc, wl1[1] + 3 * wsc, 8 * wsc, 12 * wsc); lamps.push([wl1[0], wl1[1] + 9 * wsc, wsc * 1.2, venice_P(J, -J.xs + 0.6, -4.2, 21)[1]]);
  // the calle the bridge lands in, both sides: a stone landing at the water between the near palazzo and the next
  [-1, 1].forEach(function (sg) { var p0 = venice_P(J, sg * J.xs, 0, zN), p1 = venice_P(J, sg * J.xs, 0, zM);
    stone += venice_pg([[p0[0], p0[1]], [p1[0], p1[1]], [p1[0], venice_P(J, sg * J.xs, 0.9, zM)[1]], [p0[0], venice_P(J, sg * J.xs, 0.9, zN)[1]]]); dark += venice_pg([[p0[0], venice_P(J, sg * J.xs, 0.9, zN)[1]], [p1[0], venice_P(J, sg * J.xs, 0.9, zM)[1]], [p1[0], venice_P(J, sg * J.xs, 1.15, zM)[1]], [p0[0], venice_P(J, sg * J.xs, 1.15, zN)[1]]]); });
  // mooring poles by the near water doors, and the moored gondolas' place (drawn by the engine, or below when still)
  var npw = '', npr = '', polesN = [];
  ZN.poles.forEach(function (p) { if (p[1] < 12) return; var o = pole(p[0], p[1], p[2] + 0.4, 0.26); npw += o.w; npr += o.s; polesN.push(venice_P(J, p[0], p[2] + 0.4, p[1]).concat([J.f / p[1]])); });
  stone += npw; red += npr;
  var moor = [{x: -J.xs + 1.1, z: 15.5, dir: 1}, {x: -J.xs + 2.75, z: 16.4, dir: 1}];
  var navy = '';
  if (!ANIM) moor.forEach(function (g) { var G = venice_gondola3(J, g.x, g.z, 0, 0, g.dir); dark += venice_pg(G.hull); stone += venice_pg(G.fer); navy += venice_pg(G.cov); });
  // the washing line from a near window across the canal, with sheets and shirts
  var lz = 25.5, lh = ph ? 11.6 : 12.4, line = [], ls = J.f / lz, LX = function (m) { return J.vx + m * ls; }, LY = function (h) { return hz + (J.e - h) * ls; }, sag = 1.1, cloth = [];
  for (m = -J.xs; m <= J.xs + 0.01; m += J.xs / 20) line.push([LX(m), LY(lh - sag * (1 - Math.pow(m / J.xs, 2)))]);
  iron += pline(line);
  var CL = ph ? [[-4.6, 1.1, 0.9, 0], [-1.8, 1.3, 1.2, 1], [1.4, 0.9, 1.1, 2], [4, 1.4, 1.2, 3]] : [[-9.6, 1.0, 0.9, 0], [-7.4, 1.6, 1.4, 1], [-4.6, 0.8, 1.0, 2], [-2.6, 1.2, 1.1, 3], [0.2, 2.0, 1.3, 1], [3.0, 0.9, 0.8, 4], [4.8, 1.1, 1.2, 0], [7.6, 1.5, 1.2, 2]];
  CL.forEach(function (c) { var hl = lh - sag * (1 - Math.pow(c[0] / J.xs, 2)), w2 = c[1]; cloth.push({x: LX(c[0]), y: LY(hl), w: w2 * ls, h: c[2] * ls, t: c[3]});
    if (!ANIM) { var x0 = LX(c[0] - w2 / 2), x1 = LX(c[0] + w2 / 2), y0 = LY(hl), y1 = LY(hl - c[2]); var sh3 = c[3] === 0 ? [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] : c[3] === 2 ? [[x0, y0], [x1, y0], [x1 - (x1 - x0) * 0.12, y1], [x0 + (x1 - x0) * 0.12, y1]] : [[x0, y0], [x1, y0], [x1 + (x1 - x0) * 0.08, y0 + (y1 - y0) * 0.35], [x1 - (x1 - x0) * 0.18, y0 + (y1 - y0) * 0.3], [x1 - (x1 - x0) * 0.2, y1], [x0 + (x1 - x0) * 0.2, y1], [x0 + (x1 - x0) * 0.18, y0 + (y1 - y0) * 0.3], [x0 - (x1 - x0) * 0.08, y0 + (y1 - y0) * 0.35]];
      if (c[3] === 1 || c[3] === 3) red += venice_pg(sh3); else if (c[3] === 4) green += venice_pg(sh3); else stone += venice_pg(sh3); } });
  // flowers in the window boxes (the engine sways them)
  var flw = [];
  ZN.flw.forEach(function (f, n) { for (var fz = f.za + 0.12; fz < f.zb; fz += 0.3) { var fp = venice_P(J, f.x, f.h, fz), fs = J.f / fz; flw.push([fp[0], fp[1], fs, (n * 7 + Math.round(fz * 10)) % 3]);
    if (!ANIM) { green += venice_c(fp[0], fp[1] + 0.02 * fs, 0.2 * fs) + venice_c(fp[0] + 0.12 * fs, fp[1] - 0.06 * fs, 0.15 * fs); red += venice_c(fp[0] - 0.05 * fs, fp[1] - 0.18 * fs, 0.11 * fs) + venice_c(fp[0] + 0.1 * fs, fp[1] - 0.24 * fs, 0.09 * fs); } } });
  // shutters swung on the near palazzos (the engine swings some), drawn flat open when still
  if (dk && !ANIM) { var nl = ''; nwins.forEach(function (w) { if (w.k < 0.4) nl += w.p; }); nr = ''; nb += ZN.fac[1]; ZN.nlit = nl + ZN.lampG; }
  add(near, 'a', reflN, C.nRefl); add(near, 'b', nb, C.nA); add(near, 'c', nr, C.nB); add(near, 'd', brick + (dk ? red : ''), C.nBrick);
  add(near, 'e', stone + (dk ? '' : ZN.lampG), C.nStone); add(near, 'f', dark, C.nDark); add(near, 'g', green + navy, C.nGreen); add(near, 'h', dk ? (ZN.nlit || '') : red, dk ? C.nLit : C.nRed);
  stk(near, 's', joint, C.joint, ph ? 0.7 : 1); stk(near, 't', iron + ZN.wood + ZN.bal, C.iron, ph ? 0.8 : 1.2);
  if (!ANIM) { var rs = ''; spread(0, hz + H * 0.02, W, H - hz, ph ? 50 : 80, 10, rnd, 1).forEach(function (c) { if (c.q < 0.55) { var L2 = (4 + c.r * 16) * (c.y - hz) / (H - hz) + 3; rs += seg(c.x, c.y, c.x + L2, c.y); } }); stk(refl, 's', rs, C.rip, 1); }
  if (ANIM) { ANIM.C = C; ANIM.J = J; ANIM.S = S; ANIM.zB = zB; ANIM.zN = zN; ANIM.zEndL = zEndL; ANIM.zEndR = zEndR; ANIM.SM = SM; ANIM.sk = sk; ANIM.moon = mn;
    ANIM.br = {s: s, sp: sp, xe: xe, cr: cr, Rr: Rr, ac: ac, deckK: ph ? 3.6 : 4.1};
    ANIM.wins = wins; ANIM.nwins = nwins; ANIM.lamps = lamps; ANIM.flw = flw; ANIM.shut = ZN.shut; ANIM.cloth = cloth; ANIM.line = {z: lz, h: lh, sag: sag}; ANIM.moor = moor; ANIM.poles = polesN; ANIM.tops = ZM.tops.concat(ZN.tops); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
