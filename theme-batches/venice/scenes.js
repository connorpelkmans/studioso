// ---- world theme: venice (Venice)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other; venice_hole() winds the other way on purpose, to cut an opening.
function venice_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function venice_pg(p) { return poly(venice_area(p) < 0 ? p.slice().reverse() : p); }
function venice_hole(p) { return poly(venice_area(p) > 0 ? p.slice().reverse() : p); }
function venice_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function venice_c(x, y, r) { return venice_e(x, y, r, r); }
// a Venetian Gothic window, the ogee point on top: centre u, sill v, w wide, h tall to the point; g grows it (its stone frame).
// Points are [across, up].
var venice_OG = [[-0.5, 0], [-0.49, 0.16], [-0.45, 0.32], [-0.38, 0.46], [-0.28, 0.58], [-0.17, 0.67], [-0.08, 0.75], [-0.03, 0.85], [0, 0.96]];
function venice_gothic(u, v, w, h, g) { g = g || 0; var W2 = w + g * 2, sp = v - g + h + g * 1.6 - W2 * 0.96, p = [[u - W2 / 2, v - g]], k;
  for (k = 0; k < venice_OG.length; k++) p.push([u + venice_OG[k][0] * W2, sp + venice_OG[k][1] * W2]);
  for (k = venice_OG.length - 2; k >= 0; k--) p.push([u - venice_OG[k][0] * W2, sp + venice_OG[k][1] * W2]);
  p.push([u + W2 / 2, v - g]); return p; }
// a round-headed opening: centre u, bottom v, w wide, h tall to the crown
function venice_round(u, v, w, h) { var r = w / 2, sp = v + h - r, p = [[u - r, v], [u - r, sp]]; for (var k = 1; k < 12; k++) { var a = Math.PI - k / 12 * Math.PI; p.push([u + Math.cos(a) * r, sp + Math.sin(a) * r]); } p.push([u + r, sp], [u + r, v]); return p; }
// a small irregular blob (a patch of bare brick where the plaster has worn away)
function venice_blob(u, v, ru, rv, rnd) { var p = []; for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2, q = 0.65 + rnd() * 0.45; p.push([u + Math.cos(a) * ru * q, v + Math.sin(a) * rv * q]); } return p; }
// quadratic curve points appended to out (without its start point)
function venice_qb(out, p0, p1, p2, n) { for (var i = 1; i <= n; i++) { var t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; out.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]); } return out; }
// A gondola in profile, in metres, the bow towards +x, y down (the waterline at 0): the hull, its top edge, the bow's ferro.
var venice_HULL = (function () { var p = [[-5.7, -1.5]]; venice_qb(p, [-5.7, -1.5], [-5.3, -0.05], [-3.6, 0.14], 7); venice_qb(p, [-3.6, 0.14], [0, 0.34], [3.8, 0.1], 9); venice_qb(p, [3.8, 0.1], [4.9, -0.15], [5.3, -1.25], 7);
  p.push([5.42, -1.48], [4.98, -1.56]); venice_qb(p, [4.98, -1.56], [3.6, -0.72], [0, -0.64], 9); venice_qb(p, [0, -0.64], [-3.7, -0.72], [-5.05, -1.12], 7); p.push([-5.5, -1.48]); return p; })();
var venice_GUN = (function () { var p = [[4.98, -1.56]]; venice_qb(p, [4.98, -1.56], [3.6, -0.72], [0, -0.64], 9); venice_qb(p, [0, -0.64], [-3.7, -0.72], [-5.05, -1.12], 7); return p; })();
var venice_FERRO = (function () { var p = [[5.12, -1.3], [5.42, -1.5]]; for (var i = 0; i < 6; i++) { var y = -1.62 - i * 0.18; p.push([5.5, y], [5.86, y - 0.03], [5.86, y - 0.09], [5.52, y - 0.12]); }
  p.push([5.6, -2.72], [5.98, -2.76], [5.74, -2.98], [5.2, -2.86], [5.12, -2.6]); return p; })();
// a gondola for the still scene: screen paths at waterline centre (x, y), k pixels per metre, heading dir
function venice_gondolaSVG(x, y, k, dir) { var M = function (pts) { return venice_pg(pts.map(function (p) { return [x + dir * p[0] * k, y + p[1] * k]; })); };
  return {hull: M(venice_HULL), fer: M(venice_FERRO), seat: M([[-1.4, -0.62], [0.7, -0.62], [0.7, -1.02], [-1.15, -1.02], [-1.15, -1.36], [-1.4, -1.36]])}; }

// ---------------------------------------------------------------- Venice
// Straight across a Venetian canal: a row of faded ochre, rose, terracotta and cream palazzos along the far bank, with
// Gothic ogee windows in stone frames, balconies, string courses, green shutters, worn plaster, water doors with steps and
// striped mooring poles, tiled eaves and funnel chimneys. A side canal opens between them, crossed by a brick-and-stone
// bridge seen from the side, with a fondamenta, lanterns and a washing line. The campanile and a domed church rise behind
// the roofs, and an Italian flag flies from a roof. Everything that travels (gondolas, gulls, pigeons) goes sideways.
// The gondolas, ripples, flag, washing, pigeons, lit windows, lantern glows and the finish's effects are the engine's.
var venice_C = {
  L: {glow: 'rgba(255,236,206,0.65)', cloud: 'rgba(255,255,255,0.92)', haze: '#DCC9C2', brick: '#C06A52', stone: '#F6F0E4', lead: '#86ADA2', gold: '#E2B048', sline: 'rgba(120,70,60,0.35)',
    fac: ['#EDB867', '#E59A86', '#CF7552', '#F2E0BE', '#F2C3B2'], roof: '#B4583E', win: '#3E4C56', shade: 'rgba(90,40,30,0.16)', wood: 'rgba(96,60,40,0.85)', rail: '#FAF5EC',
    lt: '#FAF5EC', green: '#2E8E56', algae: 'rgba(48,96,76,0.5)', red: '#D6403F', brick2: '#C9705A', hi: 'rgba(255,252,240,0.4)', iron: '#2E2A34', nsh: 'rgba(90,40,30,0.2)', bal: '#FAF5EC',
    refl: 'rgba(170,96,60,0.2)', reflD: 'rgba(20,56,66,0.13)', rip: 'rgba(255,255,255,0.6)', ripD: 'rgba(30,96,92,0.3)', moon: '#FFF6E0', star: '#FFFFFF'},
  D: {glow: 'rgba(170,150,230,0.14)', cloud: 'rgba(120,110,170,0.32)', haze: '#2E2B5C', brick: '#6A4258', stone: '#A8A0C4', lead: '#4E5A80', gold: '#F2CE7A', sline: 'rgba(20,16,40,0.5)',
    fac: ['#4E4876', '#56496F', '#4A3A62', '#5C5482', '#504272'], roof: '#3A2E52', win: '#1A1B38', shade: 'rgba(10,8,30,0.3)', wood: 'rgba(16,12,36,0.8)', rail: '#7E78A6',
    lt: '#8A84B0', green: '#2A4A48', algae: 'rgba(10,30,30,0.5)', red: '#8E3446', brick2: '#5E4262', hi: '#F8CC80', iron: '#121028', nsh: 'rgba(10,8,30,0.32)', bal: '#7E78A6',
    refl: 'rgba(120,110,190,0.16)', reflD: 'rgba(5,5,24,0.32)', rip: 'rgba(170,190,255,0.28)', ripD: 'rgba(5,10,30,0.32)', moon: '#FFF2CC', star: '#FFFFFF'}
};
// The campanile of St. Mark's from afar, base at (cx, by), k pixels per metre: brick shaft with pilaster strips, the open
// belfry, the brick attic, the green spire and a gold angel. Adds to the accumulators in K; returns the belfry's centre.
function venice_tower(K, cx, by, k) {
  var X = function (m) { return cx + m * k; }, Y = function (m) { return by - m * k; }, j;
  function R(x0, h0, x1, h1) { return venice_pg([[X(x0), Y(h0)], [X(x1), Y(h0)], [X(x1), Y(h1)], [X(x0), Y(h1)]]); }
  K.brick += R(-6, 0, 6, 50) + R(-5.8, 62.4, 5.8, 70.4);
  for (j = -4; j <= 4; j += 2) K.line += seg(X(j), Y(1), X(j), Y(48.5));
  K.line += seg(X(-6), Y(48.5), X(6), Y(48.5)) + seg(X(-5.8), Y(66.4), X(5.8), Y(66.4));
  K.stone += R(-6.6, 49.6, 6.6, 51.2) + R(-6.2, 61.4, 6.2, 63) + R(-6.6, 70.2, 6.6, 71.4);
  K.stone += R(-6, 51, 6, 61.6); for (j = 0; j < 4; j++) K.stone += venice_hole(venice_round(-3.9 + j * 2.6, 52, 1.9, 7.6).map(function (p) { return [X(p[0]), Y(p[1])]; }));
  K.lead += venice_pg([[X(-5.6), Y(71.2)], [X(5.6), Y(71.2)], [X(0.4), Y(93.4)], [X(-0.4), Y(93.4)]]);
  K.gold += venice_pg([[X(-0.7), Y(93)], [X(0.7), Y(93)], [X(0.25), Y(97.6)], [X(-0.25), Y(97.6)]]) + venice_c(X(0), Y(93.6), 0.9 * k);
  return [X(0), Y(56.5)];
}
// A domed church from afar (like the Salute), base at (cx, by): the drum with its windows and scroll buttresses, the big
// lead dome, the lantern and its little dome, the cross; a small bell turret either side.
function venice_church(K, cx, by, k) {
  var X = function (m) { return cx + m * k; }, Y = function (m) { return by - m * k; }, j;
  function R(x0, h0, x1, h1) { return venice_pg([[X(x0), Y(h0)], [X(x1), Y(h0)], [X(x1), Y(h1)], [X(x0), Y(h1)]]); }
  function dome(x, h, r, ht) { var p = []; for (var i = 0; i <= 18; i++) { var a = Math.PI - i / 18 * Math.PI, b = Math.sin(a); p.push([X(x + Math.cos(a) * r), Y(h + b * ht + Math.pow(b, 6) * ht * 0.12)]); } return venice_pg(p); }
  K.stone += R(-20, 0, 20, 30) + R(-16, 30, 16, 42);
  for (j = -2; j <= 2; j++) K.line += pline(venice_round(j * 6.4, 31.5, 2.6, 7.5).map(function (p) { return [X(p[0]), Y(p[1])]; }));
  for (j = -3; j <= 3; j++) K.line += pline(venice_round(j * 5.4, 6, 2.6, 12).map(function (p) { return [X(p[0]), Y(p[1])]; }));
  K.line += seg(X(-20), Y(28), X(20), Y(28));
  [-1, 1].forEach(function (sd) { K.stone += venice_e(X(sd * 17.5), Y(32), 2.6 * k, 2.2 * k) + R(sd * 19 - 2.2, 30, sd * 19 + 2.2, 34);
    K.stone += R(sd * 30 - 3, 0, sd * 30 + 3, 30); K.lead += dome(sd * 30, 30, 3.2, 5); K.gold += venice_c(X(sd * 30), Y(36.4), 0.7 * k); });
  K.stone += R(-16.6, 41.4, 16.6, 43.4);
  K.lead += dome(0, 43, 16, 22);
  for (j = -2; j <= 2; j++) K.line += seg(X(j * 5.6), Y(43.4), X(j * 3.2), Y(43 + 22 * Math.sqrt(Math.max(0, 1 - Math.pow(j * 5.6 / 16, 2))) * 0.95));
  K.stone += R(-3.2, 64, 3.2, 72); K.lead += dome(0, 72, 3.6, 4.4); K.gold += R(-0.3, 76, 0.3, 81) + R(-1.4, 79, 1.4, 79.7) + venice_c(X(0), Y(76.6), 0.8 * k);
  return [X(0), Y(60)];
}
// One palazzo on the far bank, its front square to us: b {x, w, h, col, nf, kind 'g' Gothic | 'r' round | 'q' square
// with shutters, quay (fondamenta height in front, or 0: it rises from the water)}. yB: the waterline. Z collects paths.
function venice_palazzo(Z, b, yB, s, rnd, dk) {
  var x0 = b.x, w = b.w, h = b.h, q = b.quay || 0, i, j;
  var L = function (p) { return p.map(function (a) { return [x0 + a[0], yB - a[1]]; }); }, M = function (p) { return venice_pg(L(p)); }, Hl = function (p) { return venice_hole(L(p)); };
  var R = function (u0, v0, u1, v1) { return M([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); };
  Z.fac[b.col] += R(0, 0, w, h);
  // its reflection, broken into strips that thin out further down
  function rstrips(u0, u1, v0, v1, key) { for (var d = v0; d < v1; d += 5 * s) { var f = d / (h * 1.05), th = 5 * s * Math.min(1.08, 1.5 - 1.3 * f); if (f > 1 || th < 0.8) continue; var jx = Math.sin(d * 0.11 / s + x0 * 0.01) * 3 * s * f; Z[key] += rect(x0 + u0 + jx, yB + d, u1 - u0, th); } }
  rstrips(0, w, 0, h + 14 * s, 'rf');
  var base = q || 13 * s, top = h - 14 * s, g0 = Math.max(h * 0.24, base + 50 * s), fl = (top - g0) / b.nf;
  if (!q) { Z.trim += R(0, 0, w, base); Z.algae += R(0, 0, w, 4.5 * s); Z.nsh += R(0, base - 2.5 * s, w, base); }
  // light down the left edge, shade down the right
  Z.shade += R(w - 4 * s, 0, w, h); if (!dk) Z.hi += R(0, base, 2.4 * s, top);
  // worn plaster showing the brick underneath
  for (i = 0; i < 2; i++) if (rnd() < 0.7) { var br = (6 + rnd() * 4) * s, bu = i ? w - 4 * s - br : 4 * s + br, bv = base + 8 * s + rnd() * Math.max(1, g0 - base - 22 * s); Z.brick2 += M(venice_blob(bu, bv, br, br * 0.6, rnd));
    for (j = -1; j <= 1; j++) Z.nsh += R(bu - br * 0.4 + j * 2 * s, bv + j * 3.2 * s, bu - br * 0.4 + j * 2 * s + br * 0.6, bv + j * 3.2 * s + 1.1 * s); }
  // string courses between the floors, each casting a thin shadow
  for (i = 0; i < b.nf; i++) { var sv = g0 + i * fl; Z.trim += R(-1 * s, sv - 2 * s, w + 1 * s, sv + 2 * s); Z.shade += R(0, sv - 6 * s, w, sv - 2 * s); }
  // the cornice with its dentils, the tiled eave and the roof line
  Z.trim += R(-3 * s, top, w + 3 * s, top + 5 * s); Z.shade += R(0, top - 9 * s, w, top - 3.5 * s);
  for (var du = 3 * s; du < w - 4 * s; du += 7 * s) Z.trim += R(du, top - 3.5 * s, du + 3.4 * s, top);
  Z.roof += M([[-6 * s, top + 5 * s], [w + 6 * s, top + 5 * s], [w + 1 * s, top + 15 * s], [-1 * s, top + 15 * s]]);
  for (du = -4 * s; du < w + 5 * s; du += 6 * s) Z.roof += M(venice_round(du, top + 2.4 * s, 5 * s, 3.6 * s));
  Z.shade += R(-5 * s, top + 9.5 * s, w + 5 * s, top + 10.6 * s);
  Z.perch.push([x0 + 4 * s, x0 + w - 4 * s, yB - top - 15 * s]);
  // the chimneys: Venetian funnel tops on a shaft
  var nc = w > 150 * s ? 2 : 1 + (rnd() < 0.5 ? 1 : 0);
  for (i = 0; i < nc; i++) { var cu = w * (nc === 1 ? 0.3 + rnd() * 0.4 : i ? 0.66 + rnd() * 0.2 : 0.14 + rnd() * 0.2), cb = top + 13 * s, ch = (16 + rnd() * 18) * s, ft = cb + ch;
    if (b.fu != null && cu > b.fu - 14 * s && cu < b.fu + b.fw + 12 * s) { if (b.fu > 30 * s) cu = Math.min(b.fu - 16 * s, w * 0.2); else continue; }
    Z.roof += R(cu - 3.6 * s, cb, cu + 3.6 * s, ft) + M([[cu - 3.6 * s, ft], [cu + 3.6 * s, ft], [cu + 9 * s, ft + 11 * s], [cu - 9 * s, ft + 11 * s]]);
    Z.shade += R(cu + 0.4 * s, cb, cu + 3.6 * s, ft) + M([[cu + 0.4 * s, ft], [cu + 3.6 * s, ft], [cu + 9 * s, ft + 11 * s], [cu + 1.2 * s, ft + 11 * s]]);
    Z.trim += R(cu - 9.8 * s, ft + 10.4 * s, cu + 9.8 * s, ft + 12.8 * s); Z.ctop.push([x0 + cu, yB - ft - 13 * s]); }
  // a wooden altana on the roof
  if (b.alt) { var a0 = w * 0.52, a1 = Math.min(w - 8 * s, a0 + 52 * s), av = top + 30 * s;
    Z.wood += seg(x0 + a0, yB - av, x0 + a1, yB - av) + seg(x0 + a0, yB - av - 9 * s, x0 + a1, yB - av - 9 * s);
    for (var au = a0; au <= a1 + 0.1; au += (a1 - a0) / 5) Z.wood += seg(x0 + au, yB - top - 14 * s, x0 + au, yB - av - 9 * s); }
  // the windows, floor by floor
  function win(u, v, ww, wh, kind) {
    var pts = kind === 'g' ? venice_gothic(u, v, ww, wh) : kind === 'r' ? venice_round(u, v, ww, wh) : [[u - ww / 2, v], [u + ww / 2, v], [u + ww / 2, v + wh], [u - ww / 2, v + wh]], g = 2.4 * s;
    var out = kind === 'g' ? venice_gothic(u, v, ww, wh, g) : kind === 'r' ? venice_round(u, v - g, ww + 2 * g, wh + 2 * g) : [[u - ww / 2 - g, v - g], [u + ww / 2 + g, v - g], [u + ww / 2 + g, v + wh + g], [u - ww / 2 - g, v + wh + g]];
    var wp = M(pts); Z.win += wp; Z.trim += M(out) + Hl(pts); Z.trim += R(u - ww / 2 - 3.4 * s, v - 3.4 * s, u + ww / 2 + 3.4 * s, v - 0.6 * s);
    Z.shade += R(u - ww / 2, v, u - ww / 2 + 2.6 * s, v + wh * (kind === 'q' ? 1 : 0.6)) + R(u - ww / 2, v - 7 * s, u + ww / 2, v - 3.4 * s);
    Z.wins.push({p: wp, x: x0 + u, y: yB - v, w: ww, h: wh, k: rnd()});
    rstrips(u - ww / 2, u + ww / 2, v, v + wh, 'rfd');
    if (kind === 'q') { var sw = ww * 0.5; Z.green += R(u - ww / 2 - g - sw, v, u - ww / 2 - g - 0.6 * s, v + wh) + R(u + ww / 2 + g + 0.6 * s, v, u + ww / 2 + g + sw, v + wh);
      for (var sv2 = v + 3 * s; sv2 < v + wh - 1 * s; sv2 += 3.4 * s) Z.nsh += R(u - ww / 2 - g - sw + 1 * s, sv2, u - ww / 2 - g - 1.6 * s, sv2 + 0.9 * s) + R(u + ww / 2 + g + 1.6 * s, sv2, u + ww / 2 + g + sw - 1 * s, sv2 + 0.9 * s); } }
  function balcony(u0, u1, v) { Z.trim += R(u0, v - 4 * s, u1, v - 0.6 * s) + R(u0, v + 9 * s, u1, v + 11.4 * s); Z.shade += R(u0 + 2 * s, v - 10 * s, u1 - 2 * s, v - 4 * s);
    for (var bu2 = u0 + 2.4 * s; bu2 < u1 - 1 * s; bu2 += 3.8 * s) Z.bal += seg(x0 + bu2, yB - v + 0.6 * s, x0 + bu2, yB - v - 9 * s); }
  function flowers(u, v, ww) { Z.brick2 += R(u - ww / 2 - 2.4 * s, v - 0.6 * s, u + ww / 2 + 2.4 * s, v + 4.4 * s); Z.nsh += R(u - ww / 2 - 2.4 * s, v - 0.6 * s, u + ww / 2 + 2.4 * s, v + 0.8 * s);
    for (var fu = u - ww / 2 - 1 * s; fu <= u + ww / 2 + 1.2 * s; fu += 3.4 * s) { Z.leaf += venice_c(x0 + fu, yB - v - 5.4 * s, 2.6 * s); }
    for (fu = u - ww / 2; fu <= u + ww / 2 + 0.5 * s; fu += 4.2 * s) Z.flw += venice_c(x0 + fu + (rnd() - 0.5) * s, yB - v - 7.4 * s - rnd() * 2 * s, 1.9 * s); }
  var ncol = Math.max(2, Math.floor((w - 14 * s) / (36 * s))), ww0 = b.kind === 'q' ? 13 * s : 14 * s;
  for (i = 0; i < b.nf; i++) { var v0 = g0 + i * fl, last = i === b.nf - 1, wh0 = fl * (last ? 0.5 : 0.62), vs = v0 + fl * (last ? 0.22 : 0.16), kind = last && b.kind === 'g' ? 'r' : b.kind;
    if (i === 0 && b.kind !== 'q' && w > 140 * s) {
      // the piano nobile: a polifora of joined lights over a long balcony, single windows either side
      var m = w > 175 * s ? 5 : 4, lw = 10 * s, gwd = m * lw + (m - 1) * 3.4 * s, gu = w / 2 - gwd / 2;
      for (j = 0; j < m; j++) win(gu + lw / 2 + j * (lw + 3.4 * s), vs, lw, wh0 * 1.08, b.kind);
      balcony(gu - 6 * s, gu + gwd + 6 * s, vs);
      if (gwd + 70 * s < w) { win(w / 2 - gwd / 2 - 24 * s, vs, ww0 * 0.85, wh0, b.kind); win(w / 2 + gwd / 2 + 24 * s, vs, ww0 * 0.85, wh0, b.kind); }
    } else {
      for (j = 0; j < ncol; j++) { var u = w * (j + 0.5) / ncol; win(u, vs, last ? ww0 * 0.9 : ww0, wh0, kind);
        if (!last && kind === 'q' && rnd() < 0.45) flowers(u, vs, ww0);
        else if (!last && i > 0 && rnd() < 0.18) balcony(u - ww0 / 2 - 6 * s, u + ww0 / 2 + 6 * s, vs); }
    } }
  // the ground floor: a water door with steps and mooring poles, or a street door on the fondamenta
  var dw = 24 * s, dh = Math.min(g0 - base - 10 * s, 44 * s), dv = q || base;
  var dp = q ? venice_round(w / 2, dv, dw * 0.8, dh * 0.85) : venice_round(w / 2, base - 4 * s, dw, dh);
  Z.win += M(dp); Z.trim += M(q ? venice_round(w / 2, dv, dw * 0.8 + 5 * s, dh * 0.85 + 2.5 * s) : venice_round(w / 2, base - 4 * s, dw + 6 * s, dh + 3 * s)) + Hl(dp);
  rstrips(w / 2 - dw / 2, w / 2 + dw / 2, 0, dh, 'rfd');
  if (q) { Z.wood += seg(x0 + w / 2, yB - dv, x0 + w / 2, yB - dv - dh * 0.6); }
  else { Z.trim += R(w / 2 - 17 * s, -3 * s, w / 2 + 17 * s, 0.5 * s) + R(w / 2 - 14 * s, -6.5 * s, w / 2 + 14 * s, -3 * s); Z.algae += R(w / 2 - 17 * s, -6.5 * s, w / 2 + 17 * s, -1 * s);
    Z.poles.push([x0 + w / 2 - 25 * s, (64 + rnd() * 8) * s, b.col % 2], [x0 + w / 2 + 25 * s, (58 + rnd() * 8) * s, b.col % 2]); Z.doors.push(x0 + w / 2); }
  // small barred windows either side of the door
  [-1, 1].forEach(function (sd) { var u = w / 2 + sd * Math.min(w * 0.3, 46 * s), gv = dv + 14 * s; if (u < 12 * s || u > w - 12 * s) return; var pts = [[u - 6 * s, gv], [u + 6 * s, gv], [u + 6 * s, gv + 16 * s], [u - 6 * s, gv + 16 * s]];
    Z.win += M(pts); Z.trim += M([[u - 8.4 * s, gv - 2.4 * s], [u + 8.4 * s, gv - 2.4 * s], [u + 8.4 * s, gv + 18.4 * s], [u - 8.4 * s, gv + 18.4 * s]]) + Hl(pts);
    for (var bx = -3; bx <= 3; bx += 3) Z.iron += seg(x0 + u + bx * s, yB - gv, x0 + u + bx * s, yB - gv - 16 * s); });
}
SCENES.venice = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0), C = venice_C[dk ? 'D' : 'L'], i, j, x;
  var s = ph ? Math.max(0.62, Math.min(0.9, W / 480)) : Math.max(0.75, Math.min(1.3, H / 800)), yB = H * (ph ? 0.585 : 0.665), pc = function (y) { return (y / H * 100).toFixed(1) + '%'; };
  var sky = dk ? 'linear-gradient(180deg,#0E1636 0%,#1E2456 ' + pc(yB * 0.55) + ',#4A3466 ' + pc(yB - 1) + ',#2A325E ' + pc(yB) + ',#1A2448 ' + pc(yB + (H - yB) * 0.5) + ',#111834 100%)'
    : 'linear-gradient(180deg,#8CC6EC 0%,#BFE0F0 ' + pc(yB * 0.4) + ',#F4E8D4 ' + pc(yB * 0.86) + ',#F8D8B6 ' + pc(yB - 1) + ',#8CC8BE ' + pc(yB) + ',#56A39A ' + pc(yB + (H - yB) * 0.5) + ',#3C8682 100%)';
  // ---- far: glow, clouds, moon and stars, the campanile and a domed church behind the roofs, the hazy roofs between
  var mn = [W * (ph ? 0.8 : 0.575), H * (ph ? 0.13 : 0.1), (ph ? 18 : 24) * s];
  if (dk) add(far, 'a', venice_c(mn[0], mn[1], mn[2] * 2.2), C.glow);
  var cl = ''; (ph ? [[0.2, 0.06, 0.55], [0.55, 0.22, 0.45], [0.4, 0.27, 0.36]] : [[0.1, 0.07, 0.85], [0.42, 0.05, 0.62], [0.72, 0.16, 0.72], [0.93, 0.27, 0.55], [0.26, 0.24, 0.5]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], k = q[2] * s;
    cl += venice_e(cx, cy, 90 * k, 14 * k) + venice_e(cx - 34 * k, cy - 8 * k, 40 * k, 17 * k) + venice_e(cx + 20 * k, cy - 15 * k, 46 * k, 23 * k) + venice_e(cx + 58 * k, cy - 4 * k, 30 * k, 12 * k); });
  add(far, 'b', cl, C.cloud);
    // ---- the palazzos along the far bank, with a side canal opening between them
  var gw = (ph ? 96 : 132) * s, gx = W * (ph ? 0.6 : 0.69), g0x = gx - gw / 2, g1x = gx + gw / 2, B = [], w;
  x = g1x; while (x < W + 4) { w = (130 + rnd() * 70) * s; B.push({x: x, w: w}); x += w; }
  var iR = 0; x = g0x; var left = []; while (x > -4) { w = (130 + rnd() * 70) * s; x -= w; left.unshift({x: x, w: w}); }
  var iL = left.length - 1; iR = left.length; B = left.concat(B);
  var cols = [0, 3, 1, 2, 4, 0, 1, 3, 2, 4], kinds = ['g', 'q', 'g', 'r', 'q', 'g', 'r', 'q'], ph0 = 0, flagI = 0, fx = W * (ph ? 0.72 : 0.62), best = 1e9;
  B.forEach(function (b, n) { var hb; do { hb = (ph ? 205 : 215) * s + rnd() * 110 * s; } while (Math.abs(hb - ph0) < 26 * s); ph0 = hb;
    b.h = hb; b.col = cols[(n + 2) % cols.length]; b.nf = hb > 270 * s ? 4 : 3; b.kind = kinds[(n + 1) % kinds.length]; b.quay = n === iL || n === iR ? 15 * s : 0; b.alt = n % 3 === 1 && !b.quay;
    var d = b.x <= fx && b.x + b.w > fx ? 0 : Math.abs(b.x + b.w / 2 - fx); if (d < best) { best = d; flagI = n; } });
  if (B[flagI].h < 250 * s) B[flagI].h = 250 * s + rnd() * 40 * s, B[flagI].nf = 3;
  var fb0 = B[flagI]; fb0.fu = Math.min(W - (ph ? 46 : 58) * s - 8, fb0.x + Math.max(14 * s, Math.min(fb0.w - 14 * s, fx - fb0.x))) - fb0.x; fb0.fw = (ph ? 46 : 58) * s;
  // the building seen up the side canal, behind the bridge
  var hb2 = Math.min(B[iL].h, B[iR].h) * 0.82, Z = {fac: ['', '', '', '', ''], rf: '', rfd: '', trim: '', algae: '', shade: '', roof: '', win: '', green: '', hi: '', nsh: '', brick2: '', iron: '', wood: '', bal: '', leaf: '', flw: '', wins: [], perch: [], ctop: [], poles: [], doors: []};
  var back = {x: g0x + 5 * s, w: gw - 10 * s, h: hb2, col: (B[iL].col + 2) % 5, nf: 3, kind: 'q', quay: 15 * s};
  // ---- reflections in the water and the far layer's hazy roofs behind
  var hz = ''; for (x = -10; x < W + 10;) { w = (40 + rnd() * 70) * s; var bh = B.reduce(function (m, b) { return b.x < x + w && b.x + b.w > x ? Math.min(m, b.h) : m; }, 1e9); if (bh > 1e8) bh = 230 * s; bh += (14 + rnd() * 46) * s;
    hz += rect(x, yB - bh, w + 1, bh); if (rnd() < 0.7) { var cu = x + w * (0.2 + rnd() * 0.6); hz += rect(cu - 3 * s, yB - bh - 14 * s, 6 * s, 15 * s) + venice_pg([[cu - 3 * s, yB - bh - 14 * s], [cu - 7.5 * s, yB - bh - 23 * s], [cu + 7.5 * s, yB - bh - 23 * s], [cu + 3 * s, yB - bh - 14 * s]]); } x += w; }
  add(far, 'c', hz, C.haze);
  // the campanile stands behind the lowest palazzo near the middle, so its belfry shows over the roofs
  var tx = W * (ph ? 0.27 : 0.47), lo = 1e9; B.forEach(function (b) { var c = b.x + b.w / 2; if (c > W * (ph ? 0.12 : 0.33) && c < W * (ph ? 0.45 : 0.58) && b.h < lo) { lo = b.h; tx = c; } });
  var K = {brick: '', stone: '', lead: '', gold: '', line: ''}, tk = (yB - H * (ph ? 0.1 : 0.05)) / 98, bell = venice_tower(K, tx, yB, tk), dome = venice_church(K, W * (ph ? 0.84 : 0.87), yB, tk * (ph ? 0.75 : 0.95));
  var stars = ''; if (dk) spread(0, 0, W, yB * 0.6, 44, 40, rnd, 1).forEach(function (c) { if (c.q < 0.35 && Math.hypot(c.x - mn[0], c.y - mn[1]) > mn[2] * 1.8 && Math.abs(c.x - tx) > 8 * tk && Math.abs(c.x - dome[0]) > 22 * tk) stars += venice_c(c.x, c.y, 0.5 + c.r * 0.9); });
  add(far, 'd', K.brick, C.brick); add(far, 'e', K.stone, C.stone); add(far, 'f', K.lead, C.lead); add(far, 'g', K.gold + (dk ? venice_c(mn[0], mn[1], mn[2]) : ''), dk ? C.moon : C.gold);
  stk(far, 's', K.line, C.sline, Math.max(0.6, tk * 0.35));
  add(far, 'h', stars, C.star);

  // the back building first (it sits behind), then the bank
  Z.fac[back.col] += rect(g0x, yB - hb2, gw, hb2); Z.roof += rect(g0x, yB - hb2 - 10 * s, gw, 10 * s); Z.shade += rect(g0x, yB - hb2 - 3 * s, gw, 3 * s);
  var backWins = [], bc = Math.max(2, Math.round(gw / (34 * s)));
  for (i = 0; i < 3; i++) for (j = 0; j < bc; j++) { var bwx = g0x + gw * (j + 0.5) / bc, bwy = yB - hb2 + 22 * s + i * (hb2 - 30 * s) / 3, bp = venice_pg(venice_round(bwx, 0, 11 * s, 22 * s).map(function (p) { return [p[0], bwy + 22 * s - p[1]]; }));
    if (bwy + 22 * s > yB - 20 * s) continue; Z.win += bp; backWins.push({p: bp, x: bwx, y: bwy + 22 * s, w: 11 * s, h: 22 * s, k: rnd()}); }
  Z.rf += rect(g0x, yB, gw, hb2 * 0.8); Z.win += venice_pg(venice_round(gx, 0, 20 * s, 30 * s).map(function (p) { return [p[0], yB - p[1]]; })); Z.shade += rect(g0x, yB - 8 * s, gw, 8 * s);
  B.forEach(function (b) { venice_palazzo(Z, b, yB, s, rnd, dk); });
  Z.shade += rect(g0x, yB - hb2 - 10 * s, gw, hb2 + 10 * s);
  // ---- the fondamenta either side of the side canal, the bridge over it, lanterns
  var q = 15 * s, qL = B[iL], qR = B[iR], land = 40 * s, uL = g0x - land, uR = g1x + land, crown = q + 42 * s, ry = q + 27 * s, rx = gw / 2;
  var trim = Z.trim, nsh = Z.nsh, algae = Z.algae, brick2 = Z.brick2, iron = Z.iron, rf = Z.rf, rfd = Z.rfd;
  [qL, qR].forEach(function (b) { trim += rect(b.x, yB - q, b.w, q); nsh += rect(b.x, yB - q + 3 * s, b.w, q - 3 * s); algae += rect(b.x, yB - 4.5 * s, b.w, 4.5 * s); rf += rect(b.x, yB, b.w, q); });
  Z.perch.push([qL.x + 10 * s, uL - 4 * s, yB - q], [uR + 4 * s, qR.x + qR.w - 10 * s, yB - q]);
  function deck(u) { var t = Math.min(1, Math.abs(u - gx) / (gw / 2 + land)); return q + (crown - q) * Math.pow(Math.cos(t * Math.PI / 2), 0.9); }
  var topC = [], botC = [], arc = [], arcO = [], arcI = [];
  for (i = 0; i <= 30; i++) { var u = uL + (uR - uL) * i / 30; topC.push([u, yB - deck(u) - 13 * s]); botC.push([u, yB - deck(u) - 9.6 * s]); }
  for (i = 0; i <= 24; i++) { var a = Math.PI - i / 24 * Math.PI; arc.push([gx + Math.cos(a) * rx, yB - Math.sin(a) * ry]); arcO.push([gx + Math.cos(a) * (rx + 5 * s), yB - Math.sin(a) * (ry + 5 * s)]); arcI.push([gx + Math.cos(a) * (rx - 1), yB - Math.sin(a) * (ry - 12 * s)]); }
  var body = topC.concat([[uR, yB - q], [g1x, yB - q], [g1x, yB], [g0x, yB], [g0x, yB - q], [uL, yB - q]]);
  brick2 += venice_pg(body) + venice_hole(arc);
  for (i = 0; i < 26; i++) { var bu = uL + 8 * s + rnd() * (uR - uL - 16 * s), bv = q + rnd() * (deck(bu) - q); var ins = Math.pow((bu - gx) / (rx + 8 * s), 2) + Math.pow(bv / (ry + 8 * s), 2) > 1; if (ins && bv < deck(bu) - 2 * s) nsh += rect(bu, yB - bv, 7 * s, 1.1 * s); }
  trim += venice_pg(topC.concat(botC.slice().reverse())) + venice_pg(arcO) + venice_hole(arc) + venice_pg([[gx - 3.4 * s, yB - ry - 6 * s], [gx + 3.4 * s, yB - ry - 6 * s], [gx + 2.4 * s, yB - ry + 1 * s], [gx - 2.4 * s, yB - ry + 1 * s]]);
  trim += rect(uL - 3 * s, yB - q - 15 * s, 6 * s, 15 * s) + rect(uR - 3 * s, yB - q - 15 * s, 6 * s, 15 * s);
  nsh += venice_pg(arc) + venice_hole(arcI);
  // its reflection: the arch and its mirror make a ring
  var flip = function (p) { return p.map(function (a) { return [a[0], 2 * yB - a[1]]; }); };
  rf += venice_pg(flip(body)) + venice_hole(flip(arc)); rfd += venice_pg(flip(arcO)) + venice_hole(flip(arc));
  var bridgeTop = topC;
  // lanterns on the fondamenta
  var lamps = [], lampPaths = {post: '', head: '', glass: ''};
  [uL - 18 * s, uR + 18 * s].forEach(function (lx) { var lb = yB - q, lt = lb - 56 * s; lampPaths.post += seg(lx, lb, lx, lt + 6 * s) + seg(lx - 4 * s, lb, lx + 4 * s, lb);
    lampPaths.head += venice_pg([[lx - 6 * s, lt - 9 * s], [lx + 6 * s, lt - 9 * s], [lx + 4 * s, lt + 7 * s], [lx - 4 * s, lt + 7 * s]]) + venice_pg([[lx - 7.5 * s, lt - 9 * s], [lx, lt - 15 * s], [lx + 7.5 * s, lt - 9 * s]]) + venice_c(lx, lt - 16 * s, 1.8 * s);
    lampPaths.glass += venice_pg([[lx - 4.4 * s, lt - 7 * s], [lx + 4.4 * s, lt - 7 * s], [lx + 3 * s, lt + 5 * s], [lx - 3 * s, lt + 5 * s]]); lamps.push([lx, lt - 1 * s, s]); });
  // the washing line across the side canal
  var lh = yB - Math.min(qL.h, qR.h) * 0.58, sag = 10 * s, cloth = [], lineP = '', ln0 = g0x - 2, ln1 = g1x + 2;
  for (i = 0; i <= 16; i++) { var lu = i / 16; lineP += (i ? 'L' : 'M') + PT(ln0 + (ln1 - ln0) * lu, lh + sag * Math.sin(lu * Math.PI)) + ' '; }
  var stA = '', stR = '', stG = '';
  (ph ? [[0.22, 18, 22, 1], [0.5, 15, 15, 2], [0.78, 18, 20, 0]] : [[0.16, 18, 22, 1], [0.38, 16, 16, 2], [0.6, 20, 24, 0], [0.82, 16, 18, 3]]).forEach(function (c2) { var cx = ln0 + (ln1 - ln0) * c2[0], cy = lh + sag * Math.sin(c2[0] * Math.PI) - 0.5;
    cloth.push({x: cx, y: cy, w: c2[1] * s, h: c2[2] * s, t: c2[3]});
    if (!ANIM) { var sh = rect(cx - c2[1] * s / 2, cy, c2[1] * s, c2[2] * s); if (c2[3] === 1) stR += sh; else if (c2[3] === 4 || c2[3] === 3) stG += sh; else stA += sh; } });
  // the flag on the roof of B[flagI]: a pole, and (still) the tricolour
  var fb = B[flagI], fpx = Math.min(W - (ph ? 46 : 58) * s - 8, fb.x + Math.max(14 * s, Math.min(fb.w - 14 * s, fx - fb.x))), fpy = yB - fb.h - 1 * s, fh = (ph ? 64 : 76) * s, fw = (ph ? 46 : 58) * s, fhh = fw * 0.66;
  iron += seg(fpx, fpy, fpx, fpy - fh); trim += venice_c(fpx, fpy - fh - 2 * s, 2.6 * s) + rect(fpx - 4 * s, fpy - 3 * s, 8 * s, 4 * s);
  if (!ANIM) { var fl = function (u0, u1) { var p = [], k, uu, wv = function (q) { return Math.sin(q * 5) * 2.6 * s * q; }; for (k = 0; k <= 12; k++) { uu = u0 + (u1 - u0) * k / 12; p.push([fpx + 1 + uu * fw, fpy - fh + 1 + wv(uu)]); } for (k = 12; k >= 0; k--) { uu = u0 + (u1 - u0) * k / 12; p.push([fpx + 1 + uu * fw, fpy - fh + 1 + fhh * (1 - 0.05 * uu) + fhh * 0.06 * uu * uu + wv(uu)]); } return venice_pg(p); };
    Z.green += fl(0, 0.34); trim += fl(0.333, 0.67); Z.flw += fl(0.666, 1); }
  // the mooring poles: white with a red or green spiral, a dark cap; their reflections
  var pw = '', pR = '', pG = '', pc2 = '';
  Z.poles.forEach(function (p) { var px = p[0], r = 3.2 * s, top = yB - p[1], y0 = yB + 4 * s; pw += rect(px - r, top, r * 2, y0 - top); pc2 += venice_e(px, top, r * 1.4, r * 0.8) + rect(px - r, top, r * 2, 2.4 * s);
    for (var hh = top + 6 * s; hh < y0 - 6 * s; hh += 9 * s) { var st = venice_pg([[px - r, hh + 4.4 * s], [px + r, hh], [px + r, hh + 3.6 * s], [px - r, hh + 8 * s]]); if (p[2]) pG += st; else pR += st; }
    rfd += rect(px - r, yB + 4 * s, r * 2, (yB - top) * 0.75); });
  // ---- static ripples, sparkles
  var rs = '', rd = ''; spread(0, yB + 6 * s, W, H - yB, ph ? 60 : 90, 22, rnd, 1).forEach(function (c) { var f = (c.y - yB) / (H - yB), L2 = (6 + c.r * 20) * (0.5 + f) * s; if (c.q < 0.45) rs += rect(c.x, c.y, L2, Math.max(1, 1.4 * s * (0.6 + f))); else if (c.q < 0.75) rd += rect(c.x, c.y, L2 * 1.3, Math.max(1, 1.6 * s * (0.6 + f))); });
  // still scene only: the gondolas (moored by a water door, one out on the canal), lit windows
  var gond = {hull: '', fer: '', seat: ''}, lanes = [{y: yB + (H - yB) * 0.24, k: 12.5 * s, v: 24 * s}, {y: yB + (H - yB) * (ph ? 0.56 : 0.72), k: (ph ? 17 : 19) * s, v: 36 * s}];
  var dx = Z.doors.length ? Z.doors.reduce(function (m, d) { return Math.abs(d - W * (ph ? 0.2 : 0.25)) < Math.abs(m - W * (ph ? 0.2 : 0.25)) ? d : m; }, Z.doors[0]) : W * 0.2, moor = [{x: dx + 78 * s, y: yB + 9 * s, k: 12 * s, dir: 1}];
  if (!ANIM) { moor.concat([{x: W * 0.36, y: lanes[1].y, k: lanes[1].k, dir: 1}]).forEach(function (g) { var G = venice_gondolaSVG(g.x, g.y, g.k, g.dir); gond.hull += G.hull; gond.fer += G.fer; gond.seat += G.seat; }); }
  var litP = ''; if (dk && !ANIM) Z.wins.concat(backWins).forEach(function (wn) { if (wn.k < 0.4) litP += wn.p; });
  // ---- layers
  add(refl, 'a', rf, C.refl); add(refl, 'b', rfd, C.reflD); add(refl, 'c', rd, C.ripD); add(refl, 'd', rs, C.rip);
  add(mid, 'a', Z.fac[0], C.fac[0]); add(mid, 'b', Z.fac[1], C.fac[1]); add(mid, 'c', Z.fac[2], C.fac[2]); add(mid, 'd', Z.fac[3], C.fac[3]); add(mid, 'e', Z.fac[4], C.fac[4]);
  add(mid, 'f', Z.roof, C.roof); add(mid, 'g', Z.win, C.win); add(mid, 'h', Z.shade, C.shade); stk(mid, 't', Z.wood, C.wood, 1.6 * s);
  add(near, 'a', trim + pw + stA + gond.fer + (dk ? '' : lampPaths.glass), C.lt); add(near, 'b', Z.green + Z.leaf + pG + stG, C.green); add(near, 'c', algae, C.algae); add(near, 'd', Z.flw + pR + stR + gond.seat, C.red);
  add(near, 'e', brick2, C.brick2); add(near, 'f', Z.hi + litP + (dk ? lampPaths.glass : ''), C.hi); add(near, 'g', pc2 + lampPaths.head + gond.hull, C.iron); add(near, 'h', nsh, C.nsh);
  stk(near, 's', iron + lampPaths.post + lineP, C.iron, 1.4 * s); stk(near, 't', Z.bal, C.bal, 1.5 * s);
  if (ANIM) { ANIM.C = C; ANIM.s = s; ANIM.yB = yB; ANIM.wins = Z.wins.concat(backWins); ANIM.lamps = lamps; ANIM.lanes = lanes; ANIM.moor = moor; ANIM.perch = Z.perch; ANIM.bridge = bridgeTop;
    ANIM.cloth = cloth; ANIM.flag = {x: fpx + 1, y: fpy - fh + 1, w: fw, h: fhh}; ANIM.bell = bell; ANIM.dome = dome; ANIM.tk = tk; ANIM.moon = mn; ANIM.gap = [g0x, g1x]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
