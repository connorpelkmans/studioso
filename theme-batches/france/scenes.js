// ---- world theme: france (Paris)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other; france_hole() winds the other way on purpose, to cut an opening.
function france_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function france_pg(p) { return poly(france_area(p) < 0 ? p.slice().reverse() : p); }
function france_hole(p) { return poly(france_area(p) > 0 ? p.slice().reverse() : p); }
function france_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function france_c(x, y, r) { return france_e(x, y, r, r); }
function france_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 18; i++) { var t = i / 18 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return france_pg(rotp(p, x, y, ang)); }
// a band of width w along a polyline (for iron members, arch rings and railings drawn as fills)
function france_band(pts, w) { var A = [], B = [], n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], L = Math.hypot(dx, dy) || 1; A.push([p[0] - dy / L * w / 2, p[1] + dx / L * w / 2]); B.unshift([p[0] + dy / L * w / 2, p[1] - dx / L * w / 2]); } return france_pg(A.concat(B)); }
// an opening with a round (semi-elliptic) head: x left, y bottom, w wide, h tall to the crown
function france_archPts(x, y, w, h) { var r = w / 2, sp = y - h + Math.min(r, h * 0.6), p = [[x, y], [x, sp]], k; for (k = 1; k < 14; k++) { var a = Math.PI + k / 14 * Math.PI; p.push([x + r + Math.cos(a) * r, sp + Math.sin(a) * Math.min(r, h * 0.6)]); } p.push([x + w, sp], [x + w, y]); return p; }
// a horse-chestnut leaf: five to seven long leaflets fanned out from one point
function france_palm(x, y, r, ang, n) { var d = ''; n = n || 5; for (var i = 0; i < n; i++) { var a = ang + (i - (n - 1) / 2) * 0.48, L = r * (1 - Math.abs(i - (n - 1) / 2) * 0.16); d += france_re(x + Math.cos(a) * L * 0.55, y + Math.sin(a) * L * 0.55, L * 0.5, L * 0.17, a * 57.2958); } return d; }

// ---------------------------------------------------------------- Paris
// Paris from a riverbank: the Eiffel Tower in iron lattice rises over the plane trees of the far quay, beside a row of
// cream Haussmann buildings with grey zinc mansards, dormers, chimneys and iron balconies. A stone bridge with lamps
// crosses the Seine; on the near quay the green bookseller boxes sit on the parapet, a cafe has a striped awning and
// little round tables, and two chestnut trees lean in. The boat, ripples, pigeons, swaying leaves, awning, balloon,
// lit windows, lamp glows and the tower's lights and sparkle are the engine's.
var france_C = {
  L: {glow: 'rgba(255,246,232,0.55)', cloud: 'rgba(255,255,255,0.92)', haze: 'rgba(196,212,228,0.55)', dist: '#CFDAE6', iron: '#86705E', river: '#9CC2D2', rbld: 'rgba(250,236,214,0.32)', rtow: 'rgba(110,90,74,0.16)', shine: 'rgba(255,255,255,0.75)',
    facA: '#F0E4CC', facB: '#E7D6B8', zinc: '#8E9AAC', win: '#5F6F86', trim: '#FBF5E8', chim: '#C4805E', tree: '#7FA46A', quay: '#D9C9AC', rail: '#3A3440', seam: 'rgba(255,255,255,0.4)',
    ground: '#DCCBB0', stone: '#E6D8BE', green: '#3E6E54', red: '#C8463E', cream: '#FFF8EC', lfD: '#4E7E46', lfL: '#7AAA5C', dark: '#3A3236', joint: 'rgba(120,96,70,0.32)', moon: '#FFF6E0'},
  D: {glow: 'rgba(150,140,220,0.28)', cloud: 'rgba(120,120,180,0.35)', haze: 'rgba(70,70,120,0.5)', dist: '#2E3460', iron: '#3C3452', river: '#22305A', rbld: 'rgba(120,110,170,0.3)', rtow: 'rgba(240,190,90,0.12)', shine: 'rgba(190,210,255,0.35)',
    facA: '#4C4A74', facB: '#45426C', zinc: '#2C3054', win: '#22264A', trim: '#5E5C88', chim: '#5C4058', tree: '#263C46', quay: '#3C3C64', rail: '#16142A', seam: 'rgba(150,150,215,0.22)', lit: 'rgba(255,214,140,0.95)',
    ground: '#3A3858', stone: '#4C4A70', green: '#24463E', red: '#8A3040', cream: '#E8DCC8', lfD: '#1E3434', lfL: '#2C4A40', dark: '#16142A', joint: 'rgba(10,8,30,0.35)', moon: '#FFF2CC'}
};
// The tower, base at (cx, by), TH tall. Returns fills (the iron members, platforms and arch), the lattice lines, the points
// the sparkle twinkles at, and its outline for the reflection.
function france_tower(cx, by, TH) {
  var hwO = function (u) { return TH * (0.185 * Math.pow(1 - u, 2.4) + 0.011); };
  var hwI = function (u) { return Math.max(0, hwO(u) - TH * (0.05 + 0.1 * Math.max(0, u - 0.18))); };
  var Y = function (u) { return by - u * TH; }, e = Math.max(1.3, TH * 0.0042), body = '', lat = '', pts = [], u, k, s;
  function edge(f, sg, u0, u1) { var P = []; for (u = u0; u <= u1 + 1e-6; u += 0.01) P.push([cx + sg * f(u), Y(u)]); return P; }
  function dot(x, y) { pts.push([x, y]); }
  [-1, 1].forEach(function (sg) {
    // outer edge from the foot to the top deck, the leg's inner edge up to where the legs join
    body += france_band(edge(hwO, sg, 0, 0.86), e * 1.5) + france_band(edge(hwI, sg, 0, 0.36), e);
    // leg lattice: panels with crossed braces and a strut at each joint
    var us = [0], uu = 0; while (uu < 0.36) { uu += Math.max(0.012, (hwO(uu) - hwI(uu)) / TH * 0.9); us.push(Math.min(0.36, uu)); }
    for (k = 0; k < us.length - 1; k++) { var a = us[k], b = us[k + 1], xo0 = cx + sg * hwO(a), xi0 = cx + sg * hwI(a), xo1 = cx + sg * hwO(b), xi1 = cx + sg * hwI(b);
      lat += seg(xo0, Y(a), xi1, Y(b)) + seg(xi0, Y(a), xo1, Y(b)) + seg(xo0, Y(a), xi0, Y(a)); dot(xo0, Y(a)); dot(xi0, Y(a)); dot((xo0 + xi1) / 2, (Y(a) + Y(b)) / 2); }
    // a second, finer line inside each leg
    lat += pline(edge(function (q) { return (hwO(q) + hwI(q)) / 2; }, sg, 0.02, 0.36));
  });
  // the great arch between the legs under the first platform
  var ay = Y(0.035), arx = hwI(0.035) + e, ary = (0.148 - 0.035) * TH, AR = [];
  for (k = 0; k <= 24; k++) { var t = Math.PI + k / 24 * Math.PI; AR.push([cx + Math.cos(t) * arx, ay + Math.sin(t) * ary]); }
  body += france_band(AR, e * 2.2); AR.forEach(function (p, j) { if (j % 2 === 0) dot(p[0], p[1]); });
  // girders under the first platform, braced
  var g0 = Y(0.152), g1 = Y(0.168), gw = hwI(0.16);
  body += rect(cx - gw, g0 - e * 0.6, gw * 2, e * 1.2);
  for (s = -gw; s < gw - 1; s += (g0 - g1) * 1.1) lat += seg(cx + s, g0, cx + s + (g0 - g1) * 1.1, g1) + seg(cx + s, g1, cx + s + (g0 - g1) * 1.1, g0);
  // spandrel braces between the arch and the girder
  for (k = 2; k < 23; k += 2) { var ap = AR[k]; if (ap[1] > g0 + 3) lat += seg(ap[0], ap[1], ap[0], g0); }
  // platforms: first and second level decks with their galleries, the top deck, cabin, and the mast
  var P1 = Y(0.18), w1 = hwO(0.18) + TH * 0.014, P2 = Y(0.365), w2 = hwO(0.365) + TH * 0.011, P3 = Y(0.85), w3 = hwO(0.85) + TH * 0.012;
  body += rect(cx - w1, P1 - TH * 0.004, w1 * 2, TH * 0.022) + rect(cx - w1 * 0.97, P1 - TH * 0.024, w1 * 1.94, TH * 0.006);
  for (s = -w1 * 0.94; s < w1 * 0.94; s += TH * 0.016) { lat += seg(cx + s, P1 - TH * 0.004, cx + s, P1 - TH * 0.019); dot(cx + s, P1 - TH * 0.012); }
  body += rect(cx - w2, P2 - TH * 0.003, w2 * 2, TH * 0.016) + rect(cx - w2 * 0.95, P2 - TH * 0.016, w2 * 1.9, TH * 0.005);
  for (s = -w2 * 0.9; s < w2 * 0.9; s += TH * 0.014) { lat += seg(cx + s, P2 - TH * 0.003, cx + s, P2 - TH * 0.012); dot(cx + s, P2 - TH * 0.008); }
  // the mast: crossed bracing across the whole width, getting finer toward the top
  var mu = [0.38], m = 0.38; while (m < 0.84) { m += Math.max(0.014, hwO(m) * 1.5 / TH); mu.push(Math.min(0.84, m)); }
  for (k = 0; k < mu.length - 1; k++) { var a2 = mu[k], b2 = mu[k + 1], L0 = hwO(a2), L1 = hwO(b2);
    lat += seg(cx - L0, Y(a2), cx + L1, Y(b2)) + seg(cx + L0, Y(a2), cx - L1, Y(b2)) + seg(cx - L0, Y(a2), cx + L0, Y(a2)); dot(cx - L0, Y(a2)); dot(cx + L0, Y(a2)); dot(cx, (Y(a2) + Y(b2)) / 2); }
  lat += pline(edge(function (q) { return hwO(q) * 0.42; }, -1, 0.37, 0.84)) + pline(edge(function (q) { return hwO(q) * 0.42; }, 1, 0.37, 0.84));
  body += rect(cx - w3, P3 - TH * 0.004, w3 * 2, TH * 0.012) + rect(cx - w3 * 0.75, P3 - TH * 0.032, w3 * 1.5, TH * 0.03) + rect(cx - w3 * 0.95, P3 - TH * 0.036, w3 * 1.9, TH * 0.006);
  body += france_e(cx, P3 - TH * 0.04, w3 * 0.5, TH * 0.012) + rect(cx - TH * 0.004, Y(1) + TH * 0.01, TH * 0.008, P3 - TH * 0.04 - Y(1) - TH * 0.01) + rect(cx - TH * 0.008, Y(0.93), TH * 0.016, TH * 0.02);
  for (s = -w3 * 0.6; s <= w3 * 0.6; s += w3 * 0.3) dot(cx + s, P3 - TH * 0.018);
  for (u = 0.88; u < 1; u += 0.02) dot(cx, Y(u));
  // more sparkle points: every few pixels along each lattice line
  lat.split('M').forEach(function (sp) { var n = sp.match(/-?[\d.]+/g); if (!n) return; for (var q = 0; q + 3 < n.length; q += 2) { var x0 = +n[q], y0 = +n[q + 1], x1 = +n[q + 2], y1 = +n[q + 3], L = Math.hypot(x1 - x0, y1 - y0); for (var d = 3; d < L; d += Math.max(4, TH * 0.012)) dot(x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L); } });
  // the outline (for the reflection): a simple tapering shape
  var out = []; for (u = 0; u <= 0.86; u += 0.04) out.push([cx - hwO(u), Y(u)]); out.push([cx, Y(1)]); for (u = 0.86; u >= 0; u -= 0.04) out.push([cx + hwO(u), Y(u)]);
  return {body: body, lat: lat, pts: pts, out: out, top: [cx, Y(0.93)], beacon: [cx, Y(0.9)], hw: hwO(0), P1: P1, e: e};
}
// One Haussmann building on the far quay, its base at y 'base'. Adds to the accumulators in Z and returns its windows.
function france_haus(Z, x, w, base, fl, fh, k, rnd) {
  var g = fh * 1.3, top = base - g - fl * fh, nb = Math.max(2, Math.round(w / (fh * 0.92))), bw = w / nb, ww = fh * 0.4, wh = fh * 0.6, i, j, wins = [];
  Z.fac[k % 2] += rect(x, top, w, base - top + 2);
  // ground floor: arched shop and door openings under a stone band
  for (j = 0; j < nb; j++) { var ox = x + j * bw + bw * 0.16; Z.win += france_pg(france_archPts(ox, base, bw * 0.68, g * 0.78)); }
  Z.trim += rect(x - 1, base - g - 3, w + 2, 3.4) + rect(x - 1, base - g + g * 0.1, w + 2, 1.6);
  for (i = 0; i < fl; i++) {
    var y0 = base - g - (i + 1) * fh, full = i === 1 || i === fl - 1;
    for (j = 0; j < nb; j++) { var wx = x + j * bw + (bw - ww) / 2, wy = y0 + fh * 0.24;
      Z.win += rect(wx, wy, ww, wh); wins.push([wx, wy, ww, wh, rnd()]);
      Z.trim += rect(wx - 1.6, wy - 2.6, ww + 3.2, 2.6) + rect(wx - 1, wy + wh, ww + 2, 1.6);
      if (i === 0 && j % 2 === 0) Z.trim += france_pg([[wx - 2.4, wy - 2.6], [wx + ww / 2, wy - 6], [wx + ww + 2.4, wy - 2.6]]);
      if (!full) { var by2 = wy + wh * 0.62; Z.trim += rect(wx - 2, wy + wh, ww + 4, 1.6); Z.rail += seg(wx - 1.6, by2, wx + ww + 1.6, by2); for (var q = wx - 1; q <= wx + ww + 1; q += 2.2) Z.rail += seg(q, by2, q, wy + wh); } }
    if (full) { var yb = y0 + fh * 0.24 + wh, yr = yb - wh * 0.36; Z.trim += rect(x - 1.5, yb, w + 3, 2.4); Z.rail += seg(x, yr, x + w, yr) + seg(x, yr + (yb - yr) * 0.5, x + w, yr + (yb - yr) * 0.5);
      for (var q2 = x + 1; q2 < x + w; q2 += 2.4) Z.rail += seg(q2, yr, q2, yb); }
  }
  // cornice, mansard roof with dormers, the flat top and chimney stacks
  var mh = fh * 1.25, ry = top - 4, rt = ry - mh;
  Z.trim += rect(x - 3, top - 4, w + 6, 4.4);
  Z.roof += france_pg([[x - 2, ry], [x + w + 2, ry], [x + w - mh * 0.22, rt], [x + mh * 0.22, rt]]) + france_pg([[x + mh * 0.22, rt + 1], [x + w - mh * 0.22, rt + 1], [x + w - mh * 0.5, rt - mh * 0.22], [x + mh * 0.5, rt - mh * 0.22]]);
  for (var sx = x + 5; sx < x + w - 4; sx += 4.5) Z.seam += seg(sx, ry - 1, sx + (sx < x + w / 2 ? 1 : -1) * mh * 0.2 * (1 - 2 * Math.abs(sx - x - w / 2) / w), rt + 1);
  for (j = 0; j < nb; j++) { if ((j + k) % 2 && nb > 2) continue; var dx = x + j * bw + (bw - ww * 1.4) / 2, dw = ww * 1.4, dy = ry - mh * 0.72;
    Z.trim += rect(dx, dy, dw, mh * 0.72 + 1) + (j % 2 ? france_pg([[dx - 2, dy + 1], [dx + dw / 2, dy - mh * 0.24], [dx + dw + 2, dy + 1]]) : france_pg(france_archPts(dx - 1.5, dy + 1, dw + 3, mh * 0.26)));
    Z.win += rect(dx + dw * 0.22, dy + mh * 0.12, dw * 0.56, mh * 0.5); wins.push([dx + dw * 0.22, dy + mh * 0.12, dw * 0.56, mh * 0.5, rnd()]); }
  var nc = w > fh * 4.5 ? 3 : 2, topY = rt - mh * 0.22;
  for (j = 0; j < nc; j++) { var cxh = x + w * (0.12 + j * 0.76 / (nc - 1)) - fh * 0.3, ch = fh * (0.7 + rnd() * 0.5), cw = fh * (0.55 + rnd() * 0.35);
    Z.chim += rect(cxh, topY - ch, cw, ch + mh * 0.25) + rect(cxh - 1.5, topY - ch - 2, cw + 3, 2.4);
    for (var pp = 0; pp < Math.floor(cw / 4.2); pp++) Z.chim += rect(cxh + 1.5 + pp * 4.2, topY - ch - 7, 2.6, 5.2);
    Z.top(cxh - 2, cxh + cw + 2, topY - ch - 7); }
  Z.top(x - 3, x + w + 3, rt - mh * 0.22);
  return wins;
}
SCENES.france = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(10), refl = Lay(0), mid = Lay(0), near = Lay(0), C = france_C[dk ? 'D' : 'L'], i, j, x, y, k;
  var sky = dk ? 'linear-gradient(180deg,#121A36 0%,#263258 45%,#5A4468 72%,#3A3460 100%)' : 'linear-gradient(180deg,#B9D6EE 0%,#E9F1F6 46%,#F6E4D6 72%,#EED8C6 100%)';
  var S = ph ? 1 : Math.max(0.6, Math.min(1.15, H / 800));
  var hb = H * (ph ? 0.705 : 0.655), ry0 = hb + H * (ph ? 0.016 : 0.02), ptop = H * (ph ? 0.862 : 0.842), pbot = ptop + H * (ph ? 0.03 : 0.034);
  // a height map of the far bank's skyline (buildings, chimneys and trees), so the engine can paint the tower's lights only
  // where the tower shows above them
  var SK = [], SKs = 4; for (x = 0; x <= W + SKs; x += SKs) SK.push(hb);
  function skyTop(x0, x1, yy) { for (var q = Math.max(0, Math.floor(x0 / SKs)); q <= Math.min(SK.length - 1, Math.ceil(x1 / SKs)); q++) if (yy < SK[q]) SK[q] = yy; }
  // ---- far: glow, clouds or stars, a hazy distant skyline
  var mn = [W * (ph ? 0.3 : 0.5), H * (ph ? 0.12 : 0.15), ph ? 22 : 30];
  if (dk) add(far, 'a', france_e(W * (ph ? 0.62 : 0.74), H * 0.34, W * 0.62, H * 0.36), C.glow); else add(far, 'a', france_e(W * 0.5, hb - H * 0.12, W * 0.7, H * 0.1), C.glow);
  if (dk) { add(far, 'a', france_c(mn[0], mn[1], mn[2] * 3.2), 'rgba(200,200,255,0.2)'); var st = ''; spread(0, 0, W, hb - H * 0.12, 40, 40, rnd, 1).forEach(function (c) { if (c.q < 0.32 && Math.hypot(c.x - mn[0], c.y - mn[1]) > mn[2] * 1.6) st += france_c(c.x, c.y, 0.5 + c.r * 0.9); }); add(refl, 'h', st, 'rgba(255,246,226,0.85)'); }
  var cl = ''; (ph ? [[0.2, 0.08, 0.55], [0.82, 0.26, 0.5], [0.3, 0.42, 0.45]] : [[0.1, 0.1, 0.9], [0.38, 0.05, 0.7], [0.66, 0.22, 0.8], [0.94, 0.08, 0.7], [0.24, 0.36, 0.6]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], s = q[2] * (ph ? 0.8 : S);
    cl += france_e(cx, cy, 90 * s, 14 * s) + france_e(cx - 34 * s, cy - 8 * s, 40 * s, 17 * s) + france_e(cx + 20 * s, cy - 14 * s, 46 * s, 22 * s) + france_e(cx + 58 * s, cy - 4 * s, 30 * s, 12 * s); });
  add(far, 'b', cl, C.cloud);
  var dist = ridge(W, hb - H * (ph ? 0.2 : 0.17), [[H * 0.02, 70, 1.3], [H * 0.012, 23, 0.4]], 6, false), dd = '';
  for (x = -20; x < W + 20; x += 18 + rnd() * 30) { var dh = H * (0.02 + rnd() * 0.04); dd += rect(x, hb - H * (ph ? 0.2 : 0.17) - dh, 14 + rnd() * 26, dh + 10); }
  add(far, 'c', below(dist, hb + 4) + dd, C.haze);
  // ---- refl: distant rooftops, the tower, the river
  var dist2 = ''; for (x = -20; x < W + 20;) { var w2 = 26 + rnd() * 50, h2 = H * (0.012 + rnd() * 0.03), y2 = hb - H * (ph ? 0.1 : 0.12) - h2; dist2 += rect(x, y2, w2, hb - y2) + france_pg([[x, y2], [x + 5, y2 - 7], [x + w2 - 5, y2 - 7], [x + w2, y2]]); if (rnd() < 0.5) dist2 += rect(x + w2 * 0.3, y2 - 13, 5, 7); x += w2 + rnd() * 6; }
  add(refl, 'a', dist2, C.dist);
  var TX = W * (ph ? 0.74 : 0.79), TH = H * (ph ? 0.6 : 0.6), TB = hb - H * (ph ? 0.03 : 0.035), T = france_tower(TX, TB, TH);
  add(refl, 'b', T.body, C.iron); stk(refl, 's', T.lat, C.iron, Math.max(0.8, TH * 0.0021));
  add(refl, 'c', rect(-10, ry0 - 3, W + 20, H - ry0 + 13), C.river);
  if (dk) add(refl, 'e', france_c(mn[0], mn[1], mn[2]), C.moon);
  // ---- mid: the far bank. Haussmann buildings from the left edge to the tower, plane trees along the quay
  var Z = {fac: ['', ''], roof: '', win: '', trim: '', chim: '', rail: '', seam: '', top: skyTop}, wins = [], fh = ph ? 15 : 22 * S;
  var bx = -8, bEnd = TX - T.hw * (ph ? 0.9 : 1.15); k = 0;
  while (bx < bEnd) { var bw2 = fh * (4.2 + rnd() * 3.2); if (bEnd - bx - bw2 < fh * 3) bw2 = bEnd - bx; wins = wins.concat(france_haus(Z, bx, bw2, hb, 5 + (k % 3 === 1 ? 1 : 0), fh, k, rnd)); bx += bw2; k++; }
  // one more building at the right edge, beyond the tower
  var bR = TX + T.hw * (ph ? 0.95 : 1.25); if (W - bR > fh * 3) wins = wins.concat(france_haus(Z, bR, W - bR + 10, hb, 4, fh, k + 1, rnd));
  add(mid, 'a', Z.fac[0], C.facA); add(mid, 'b', Z.fac[1], C.facB); add(mid, 'c', Z.roof, C.zinc); add(mid, 'd', Z.win, C.win); add(mid, 'e', Z.trim, C.trim); add(mid, 'f', Z.chim, C.chim);
  stk(mid, 's', Z.rail, C.rail, ph ? 0.6 : 0.8);
  // plane trees along the far quay: low in front of the buildings, taller where they screen the tower's feet
  var tr = '', trk = '', tcs = [];
  for (x = -10; x < W + 20; x += (ph ? 22 : 34) * (0.8 + rnd() * 0.4)) { var nearT = Math.abs(x - TX) < T.hw * 1.6, th = (nearT ? H * (ph ? 0.06 : 0.075) : H * (ph ? 0.035 : 0.045)) * (0.8 + rnd() * 0.3), tw = (ph ? 13 : 20) * (nearT ? 1.3 : 1);
    trk += rect(x - 1.5, hb - th * 0.45, 3, th * 0.45); for (j = 0; j < 5; j++) { var a = j / 5 * Math.PI * 2 + rnd(), rr = tw * (0.5 + rnd() * 0.3), cx2 = x + Math.cos(a) * tw * 0.45, cy2 = hb - th + Math.sin(a) * th * 0.25; tr += france_c(cx2, cy2, rr); tcs.push([cx2, cy2, rr]); skyTop(cx2 - rr * 0.6, cx2 + rr * 0.6, cy2 - rr * 0.8); } }
  var qr = seg(-10, hb - fh * 0.3, W + 10, hb - fh * 0.3) + seg(-10, hb + 1, W + 10, hb + 1); for (x = -6; x < W + 6; x += fh * 0.5) qr += seg(x, hb + 1, x, hb - fh * 0.3); stk(mid, 's', qr);
  add(mid, 'g', tr, C.tree); add(mid, 'h', trk + rect(-10, hb - 1, W + 20, ry0 - hb + 2), C.quay);
  if (!dk || ANIM) stk(mid, 't', Z.seam, C.seam, 0.6);
  if (dk && !ANIM) { var lit = ''; wins.forEach(function (w) { if (w[4] < 0.42) lit += seg(w[0] + w[2] / 2, w[1] + w[2] * 0.35, w[0] + w[2] / 2, w[1] + w[3] - w[2] * 0.35); }); stk(mid, 't', lit, C.lit, fh * 0.4); }
  // ---- the river: reflections of the far bank and the tower, ripples
  var rbl = '', rtw = '', rs = '';
  for (x = -10; x < W; x += 6) { var q = Math.floor(Math.max(0, x) / SKs), dep = Math.min(hb - SK[Math.min(SK.length - 1, q)], (ptop - ry0) * 1.6) * 0.42; if (Math.abs(x + 3 - TX) > T.hw * 0.5) rbl += rect(x, ry0, 6.2, dep * (0.9 + 0.1 * Math.sin(x * 0.3))); }
  for (y = ry0 + 2; y < ptop; y += 4) { var uR = (y - ry0) / (TH * 0.42) + (hb - TB) / TH, hwR = TH * (0.185 * Math.pow(Math.max(0, 1 - uR), 2.4) + 0.011) * (uR < 0.95 ? 1 : 0); if (hwR > 1) rtw += rect(TX - hwR + Math.sin(y * 0.7) * 3, y, hwR * 2 * (0.7 + 0.3 * Math.sin(y * 1.3)), 2.2); }
  spread(0, ry0 + 6, W, ptop - ry0 - 6, ph ? 60 : 90, 12, rnd, 1).forEach(function (c) { if (c.q < 0.6) rs += seg(c.x, c.y, c.x + 8 + c.r * 24, c.y); });
  add(refl, 'd', rbl, C.rbld); add(refl, 'f', rtw, C.rtow); stk(refl, 't', ANIM ? '' : rs, C.shine, 1.2);
  // ---- near: the bridge, the quay with its parapet and bookseller boxes, the cafe, tables and chestnut trees
  var stone = '', ground = '', green = '', red = '', cream = '', lfD = '', lfL = '', dark = '', joint = '', iron = '';
  // the stone bridge leaves the near quay behind the cafe and runs across to the far bank, getting smaller as it goes
  var cX = W * (ph ? 0.34 : 0.215), xn = W * (ph ? 0.06 : 0.08), xf = W * (ph ? 0.6 : 0.56), na = ph ? 3 : 4, lamps = [], yw = ry0 + (ptop - ry0) * 0.45;
  function bX(u) { return xn + (xf - xn) * (1 - Math.pow(Math.max(0, 1 - u), 1.5)); }
  function bW(u) { return ptop + (ry0 + 3 - ptop) * u; }
  function bS(u) { return 1 - 0.68 * u; }
  function bH(u) { return H * (ph ? 0.085 : 0.1) * bS(u); }
  function bP(u) { return H * (ph ? 0.016 : 0.019) * bS(u); }
  var bt = [], bb = [], u;
  for (u = 0; u <= 1.0001; u += 0.02) { bt.push([bX(u), bW(u) - bH(u) - bP(u)]); bb.unshift([bX(u), bW(u) + 3]); }
  stone += france_pg(bt.concat([[bX(1) + 6, bW(1) - bH(1) - bP(1)], [bX(1) + 6, bW(1) + 3]], bb));
  // arches: each opening follows the bridge's slope, with a ring of voussoirs
  for (j = 0; j < na; j++) { var u0 = (j + 0.13) / na, u1 = (j + 0.87) / na, AP = [], RG = [];
    for (k = 0; k <= 16; k++) { var s5 = k / 16, uu = u0 + (u1 - u0) * s5, cr = Math.pow(Math.sin(Math.PI * s5), 0.55), ax5 = bX(uu), ay5 = bW(uu) + 4 - bH(uu) * 0.74 * cr - (k === 0 || k === 16 ? 0 : 0); AP.push([ax5, k === 0 || k === 16 ? bW(uu) + 4 : ay5]); RG.push([ax5, ay5 - 6 * bS(uu) * S]);
      if (k > 0 && k < 16) joint += seg(ax5, ay5, ax5 + (s5 - 0.5) * 3 * bS(uu), ay5 - 6.4 * bS(uu) * S); }
    stone += france_hole(AP); joint += pline(RG);
    // the pier between this arch and the next: a cutwater at the water and a pilaster through the parapet
    if (j < na - 1) { var up = (j + 1) / na, px5 = bX(up), sc5 = bS(up), pw5 = (bX(u1 + 0.26 / na) - bX(u1)) * 0.5;
      stone += france_pg([[px5 - pw5, bW(up) + 3], [px5 + pw5, bW(up) + 3], [px5 + pw5 * 0.4, bW(up) + 7 * sc5], [px5 - pw5 * 0.4, bW(up) + 7 * sc5]]) + rect(px5 - pw5 * 0.7, bW(up) - bH(up) - bP(up) - 4 * sc5, pw5 * 1.4, bH(up) * 0.3 + bP(up) + 4 * sc5);
      lamps.push([px5, bW(up) - bH(up) - bP(up) - 4 * sc5, sc5]); } }
  // the parapet: a cornice line and balusters
  var cor = [], par = []; for (u = 0; u <= 1.0001; u += 0.02) { cor.push([bX(u), bW(u) - bH(u) + 1]); par.push([bX(u), bW(u) - bH(u) - bP(u) * 0.2]); }
  joint += pline(cor) + pline(par); for (u = 0.01; u < 1; u += 0.006 + 0.008 * u) joint += seg(bX(u), bW(u) - bH(u) - bP(u) * 0.25, bX(u), bW(u) - bH(u) - 1);
  lamps = lamps.concat([[bX(0.02), bW(0.02) - bH(0.02) - bP(0.02), 1]]).filter(function (l) { return l[0] > cX + 6; });
  lamps.forEach(function (l) { var s6 = l[2] * (ph ? 0.8 : S), lx6 = l[0], ly6 = l[1], lh6 = H * (ph ? 0.05 : 0.065) * l[2];
    dark += rect(lx6 - 1.4 * s6, ly6 - lh6, 2.8 * s6, lh6) + rect(lx6 - 4 * s6, ly6 - 4 * s6, 8 * s6, 4 * s6) + france_pg([[lx6 - 5 * s6, ly6 - lh6 - 1], [lx6 + 5 * s6, ly6 - lh6 - 1], [lx6 + 3 * s6, ly6 - lh6 - 11 * s6], [lx6 - 3 * s6, ly6 - lh6 - 11 * s6]]) + france_pg([[lx6 - 4.4 * s6, ly6 - lh6 - 11 * s6], [lx6 + 4.4 * s6, ly6 - lh6 - 11 * s6], [lx6, ly6 - lh6 - 16 * s6]]) + rect(lx6 - 0.8 * s6, ly6 - lh6 - 19 * s6, 1.6 * s6, 4 * s6);
    cream += rect(lx6 - 2.6 * s6, ly6 - lh6 - 9.6 * s6, 5.2 * s6, 7.6 * s6); l[1] = ly6 - lh6 - 6 * s6; l[2] = s6; });
  // the near quay
  ground += rect(-10, pbot - 2, W + 20, H - pbot + 12);
  stone += rect(-10, ptop, W + 20, pbot - ptop);
  stone += rect(-10, ptop - 3, W + 20, 4); joint += seg(-10, ptop + 1, W + 10, ptop + 1);
  for (x = -10, j = 0; x < W + 10; x += 34 * S, j++) joint += seg(x, ptop + 1, x, pbot - 1);
  joint += seg(-10, ptop + (pbot - ptop) * 0.5, W + 10, ptop + (pbot - ptop) * 0.5);
  var cob = ''; for (y = pbot + 6, j = 0; y < H + 8; y += 6 + j * 1.2, j++) { var cw = 10 + j * 2.6; for (x = (j % 2) * cw * 0.5 - cw; x < W + cw; x += cw) cob += 'M' + PT(x + 1.4, y) + ' q' + n1(cw / 2 - 1.4) + ' ' + n1(-2.2 - j * 0.25) + ' ' + n1(cw - 2.8) + ' 0 '; }
  joint += cob;
  // the booksellers' green boxes on the parapet: lids propped open with prints pinned inside, books along the edge
  var bxs = ph ? [0.42, 0.62] : [0.3, 0.385, 0.47, 0.555], boxW = (ph ? 46 : 62) * S, boxH = (ph ? 13 : 17) * S, lidH = (ph ? 26 : 34) * S, stalls = [];
  bxs.forEach(function (f, n) { var x0 = W * f, y0 = ptop - 3, ly0 = y0 - boxH - 1, ly1 = ly0 - lidH;
    green += rect(x0, y0 - boxH, boxW, boxH) + rect(x0 - 2, y0 - boxH - 2, boxW + 4, 3) + france_pg([[x0 + 1, ly0], [x0 + boxW - 1, ly0], [x0 + boxW - 4, ly1], [x0 + 4, ly1]]);
    stone += france_pg([[x0 + 4, ly0 - 2], [x0 + boxW - 4, ly0 - 2], [x0 + boxW - 6.5, ly1 + 3], [x0 + 6.5, ly1 + 3]]);
    for (var r6 = 0; r6 < 2; r6++) for (var c6 = 0; c6 < 3; c6++) { var pw6 = (boxW - 18) / 3, ph6 = (lidH - 10) / 2 - 2, px6 = x0 + 7 + c6 * (pw6 + 2) + (1 - r6) * 1, py6 = ly1 + 5 + r6 * (ph6 + 2);
      if ((r6 + c6 + n) % 3 === 0) red += rect(px6, py6, pw6, ph6); else if ((r6 + c6 + n) % 3 === 1) lfL += rect(px6, py6, pw6, ph6); else { joint += rect(px6 + 1, py6 + 1, pw6 - 2, ph6 - 2) + seg(px6 + 2, py6 + ph6 - 2, px6 + pw6 * 0.5, py6 + ph6 * 0.4) + seg(px6 + pw6 * 0.5, py6 + ph6 * 0.4, px6 + pw6 - 2, py6 + ph6 - 2); continue; }
      cream += rect(px6 + pw6 * 0.2, py6 + ph6 * 0.2, pw6 * 0.6, ph6 * 0.5); joint += seg(px6 + pw6 * 0.25, py6 + ph6 * 0.6, px6 + pw6 * 0.75, py6 + ph6 * 0.4); }
    for (k = 0; k < 8; k++) { var bk = x0 + 3 + k * (boxW - 6) / 8, bkh = boxH * (0.3 + (k * 37 % 5) * 0.07), bkw = (boxW - 6) / 8 - 1; if (k % 3 === 0) red += rect(bk, ly0 - bkh, bkw, bkh); else if (k % 3 === 1) cream += rect(bk, ly0 - bkh, bkw, bkh); else lfL += rect(bk, ly0 - bkh, bkw, bkh); }
    joint += rect(x0 + boxW / 2 - 2, y0 - boxH * 0.66, 4, 4) + seg(x0 + 2, y0 - boxH * 0.3, x0 + boxW - 2, y0 - boxH * 0.3) + seg(x0 + boxW * 0.25, y0 - boxH, x0 + boxW * 0.25, y0) + seg(x0 + boxW * 0.75, y0 - boxH, x0 + boxW * 0.75, y0);
    stalls.push([x0, y0 - boxH, boxW]); });
  // quay lamp posts
  var qlx = ph ? [0.88] : [0.255, 0.64], qlamps = [];
  qlx.forEach(function (f) { var lx = W * f, lb = pbot + H * 0.01, lh2 = H * (ph ? 0.16 : 0.2), s2 = ph ? 0.8 : S;
    dark += rect(lx - 2.4 * s2, lb - lh2, 4.8 * s2, lh2) + rect(lx - 6 * s2, lb - 12 * s2, 12 * s2, 12 * s2) + rect(lx - 4 * s2, lb - lh2 * 0.45, 8 * s2, 4 * s2) + rect(lx - 14 * s2, lb - lh2 + 4 * s2, 28 * s2, 2.4 * s2);
    [-1, 1].forEach(function (sg) { var hx = lx + sg * 12 * s2, hy = lb - lh2 - 6 * s2; dark += france_pg([[hx - 5 * s2, hy + 10 * s2], [hx + 5 * s2, hy + 10 * s2], [hx + 6 * s2, hy - 4 * s2], [hx - 6 * s2, hy - 4 * s2]]) + france_pg([[hx - 6.5 * s2, hy - 4 * s2], [hx + 6.5 * s2, hy - 4 * s2], [hx, hy - 11 * s2]]); cream += rect(hx - 4 * s2, hy - 3 * s2, 8 * s2, 12 * s2); qlamps.push([hx, hy + 3 * s2, s2]); });
    dark += france_c(lx, lb - lh2 - 4 * s2, 3 * s2); });
  // the cafe on the left: the ground floor of a stone corner building with French windows and an iron balcony above,
  // a green shopfront with tall glazed windows and a door, planters, and the striped awning
  var cTop = H * (ph ? 0.6 : 0.5), cG = H * (ph ? 0.89 : 0.885), cS = H * (ph ? 0.75 : 0.72), cw2 = cX + 10, cfw = [], fl1 = cS - H * (ph ? 0.035 : 0.045);
  stone += rect(-10, cTop, cw2, H - cTop + 10) + rect(-10, cTop - 8 * S, cw2 + 6, 8 * S);
  cream += rect(-10, cTop - 10 * S, cw2 + 8, 3 * S) + rect(-10, fl1, cw2 + 4, 4 * S) + rect(cX - 8 * S, cTop, 8 * S, fl1 - cTop);
  for (y = cTop + 6 * S; y < fl1; y += 7 * S) joint += seg(cX - 8 * S, y, cX, y);
  for (y = cTop + 12 * S; y < fl1; y += 14 * S) joint += seg(-10, y, cX - 8 * S, y);
  for (j = 0; j < 2; j++) { var fwin = cX * 0.24, fx2 = cX * (0.12 + j * 0.46), fy2 = cTop + H * 0.022, fh2 = fl1 - fy2 - H * 0.004;
    cream += rect(fx2 - 3 * S, fy2 - 3 * S, fwin + 6 * S, 3 * S) + rect(fx2 - 3 * S, fy2, 3 * S, fh2) + rect(fx2 + fwin, fy2, 3 * S, fh2) + france_pg([[fx2 - 5 * S, fy2 - 3 * S], [fx2 + fwin / 2, fy2 - 10 * S], [fx2 + fwin + 5 * S, fy2 - 3 * S]]);
    dark += rect(fx2, fy2, fwin, fh2); cfw.push([fx2, fy2, fwin, fh2]);
    cream += rect(fx2 + fwin / 2 - 1, fy2, 2, fh2) + rect(fx2, fy2 + fh2 * 0.32, fwin, 1.6) + rect(fx2, fy2 + fh2 * 0.62, fwin, 1.6);
    cream += france_pg([[fx2, fy2], [fx2 + fwin * 0.3, fy2], [fx2 + fwin * 0.12, fy2 + fh2 * 0.55], [fx2, fy2 + fh2 * 0.6]]) + france_pg([[fx2 + fwin, fy2], [fx2 + fwin * 0.7, fy2], [fx2 + fwin * 0.88, fy2 + fh2 * 0.55], [fx2 + fwin, fy2 + fh2 * 0.6]]);
    joint += seg(fx2 + 2, fy2 + fh2 * 0.1, fx2 + fwin * 0.35, fy2 + 2); }
  var cbal = fl1 - 1; for (x = -8; x < cX - 6; x += 3) iron += seg(x, cbal, x, cbal - H * 0.026); iron += seg(-10, cbal - H * 0.026, cX - 6, cbal - H * 0.026) + seg(-10, cbal - H * 0.014, cX - 6, cbal - H * 0.014);
  // shopfront: a green fascia over glazed bays with slim bars, a half-glazed door at the corner
  green += rect(-10, fl1 + 4 * S, cw2 + 2, cG - fl1 - 4 * S); var glass = [];
  cream += rect(cX * 0.3, fl1 + H * 0.012, cX * 0.4, H * 0.016);
  for (j = 0; j < 3; j++) { var gx = cX * (0.04 + j * 0.32), gw2 = cX * 0.27, gy = cS + H * 0.034;
    if (j === 2) { var dw = gw2 * 0.7, dx2 = gx + gw2 * 0.15; dark += rect(dx2, gy - H * 0.004, dw, cG - gy + H * 0.004); glass.push([dx2, gy, dw, (cG - gy) * 0.55]); green += rect(dx2 + 2, gy + (cG - gy) * 0.6, dw - 4, (cG - gy) * 0.4); cream += rect(dx2 + dw - 5 * S, gy + (cG - gy) * 0.5, 3 * S, 2 * S); }
    else { var gh = cG - gy - H * 0.03; dark += rect(gx, gy, gw2, gh); glass.push([gx, gy, gw2, gh]); cream += rect(gx, gy + gh * 0.24, gw2, 1.5) + rect(gx + gw2 / 2 - 0.8, gy, 1.6, gh);
      cream += france_pg([[gx + gw2 * 0.6, gy + gh * 0.3], [gx + gw2 * 0.72, gy + gh * 0.3], [gx + gw2 * 0.86, gy + gh * 0.65], [gx + gw2 * 0.74, gy + gh * 0.65]]);
      // a planter of red geraniums under the window
      var py5 = cG - H * 0.006; green += rect(gx + 2, py5 - 9 * S, gw2 - 4, 9 * S); for (k = 0; k < 5; k++) { var fxp = gx + 6 + k * (gw2 - 12) / 4; lfL += france_c(fxp, py5 - 10.5 * S, 3.4 * S) + france_c(fxp + 3 * S, py5 - 10 * S, 2.6 * S); red += france_c(fxp + 1 * S, py5 - 16.5 * S, 2.6 * S) + france_c(fxp - 2.6 * S, py5 - 15 * S, 2 * S); }
      // half curtains on a brass rod
      var cy7 = gy + gh * 0.5; cream += rect(gx + 1, cy7, gw2 - 2, gh * 0.36); for (k = 0; k < 6; k++) cream += france_c(gx + 1 + (k + 0.5) * (gw2 - 2) / 6, cy7, (gw2 - 2) / 12); joint += seg(gx, cy7 - 1, gx + gw2, cy7 - 1); } }
  cream += rect(-10, cG - 2, cw2 + 2, 3);
  // the awning (the engine draws its flapping edge)
  var awY0 = cS - H * 0.006, awY1 = cS + H * (ph ? 0.03 : 0.036), awX1 = cX + 12 * S, awn = {x0: -12, x1: awX1, y0: awY0, y1: awY1, n: Math.round((awX1 + 12) / (14 * S))};
  if (!ANIM) { var sw = (awn.x1 - awn.x0) / awn.n; for (j = 0; j < awn.n; j++) { var sx0 = awn.x0 + j * sw, p0 = [[sx0, awY0], [sx0 + sw, awY0], [sx0 + sw + 3, awY1], [sx0 + 3, awY1]]; if (j % 2) cream += france_pg(p0); else red += france_pg(p0); var sc0 = sx0 + 3 + sw / 2; if (j % 2) cream += france_e(sc0, awY1, sw / 2, 4 * S); else red += france_e(sc0, awY1, sw / 2, 4 * S); } }
  // cafe tables: marble tops on iron feet, with woven red bistro chairs
  var TB2 = ph ? [[0.08, 0.955, 0.8], [0.28, 0.935, 0.75]] : [[0.05, 0.955, 1.05], [0.15, 0.925, 0.92], [0.255, 0.965, 1.05]], tables = [];
  TB2.forEach(function (q, n) { var tx = W * q[0], ty = H * q[1], s3 = q[2] * (ph ? 1 : S);
    [-1, 1].forEach(function (sg) { var chx = tx + sg * 24 * s3; red += rect(chx - 8 * s3, ty - 19 * s3, 16 * s3, 4 * s3); iron += 'M' + PT(chx - 7 * s3, ty - 18 * s3) + ' L' + PT(chx - 7 * s3 + sg * 3 * s3, ty - 36 * s3) + ' Q' + PT(chx, ty - 42 * s3) + ' ' + PT(chx + 7 * s3 + sg * 3 * s3, ty - 36 * s3) + ' L' + PT(chx + 7 * s3, ty - 18 * s3) + ' ' + seg(chx - 7 * s3, ty - 15 * s3, chx - 8 * s3, ty) + seg(chx + 7 * s3, ty - 15 * s3, chx + 8 * s3, ty); red += france_pg([[chx - 6 * s3 + sg * 3 * s3, ty - 34 * s3], [chx + 6 * s3 + sg * 3 * s3, ty - 34 * s3], [chx + 6 * s3 + sg * 1.5 * s3, ty - 22 * s3], [chx - 6 * s3 + sg * 1.5 * s3, ty - 22 * s3]]); });
    dark += rect(tx - 1.6 * s3, ty - 26 * s3, 3.2 * s3, 24 * s3) + france_pg([[tx - 10 * s3, ty], [tx + 10 * s3, ty], [tx + 2 * s3, ty - 5 * s3], [tx - 2 * s3, ty - 5 * s3]]);
    cream += france_e(tx, ty - 27 * s3, 15 * s3, 3.6 * s3); dark += france_e(tx, ty - 25.5 * s3, 14 * s3, 1.6 * s3);
    cream += rect(tx - 7 * s3, ty - 34 * s3, 5 * s3, 5 * s3) + france_e(tx + 6 * s3, ty - 31 * s3, 5 * s3, 1.4 * s3); dark += rect(tx - 6.5 * s3, ty - 34 * s3, 4 * s3, 1.4 * s3);
    if (n % 2 === 0) { green += rect(tx + 3 * s3, ty - 40 * s3, 2.6 * s3, 10 * s3); red += france_c(tx + 4.3 * s3, ty - 41 * s3, 2.6 * s3); }
    tables.push([tx, ty - 31 * s3, s3]); });
  // chestnut trees: dark trunks, palmate leaves in two greens
  var trees = [], TR = ph ? [[0.94, 0.985, 0.62]] : [[0.655, 0.99, 0.95], [0.985, 0.99, 1.1]];
  TR.forEach(function (q) { var tx = W * q[0], ty = H * q[1], s4 = q[2] * (ph ? 1 : S), tc = [tx - 6 * s4, ty - 176 * s4], R = 96 * s4;
    dark += france_pg([[tx - 9 * s4, ty], [tx - 6 * s4, ty - 70 * s4], [tx - 26 * s4, ty - 140 * s4], [tx - 20 * s4, ty - 142 * s4], [tx - 1 * s4, ty - 96 * s4], [tx + 16 * s4, ty - 150 * s4], [tx + 23 * s4, ty - 147 * s4], [tx + 7 * s4, ty - 76 * s4], [tx + 10 * s4, ty]]);
    var blobs = []; for (k = 0; k < 13; k++) { var a4 = hash(k * 3 + tx) * Math.PI * 2, d4 = Math.sqrt(hash(k * 5 + 1 + tx)), bx2 = tc[0] + Math.cos(a4) * d4 * R * 0.75, by2 = tc[1] + Math.sin(a4) * d4 * R * 0.58, br = R * (0.34 + hash(k + 7 + tx) * 0.16); blobs.push([bx2, by2, br]); lfD += france_c(bx2, by2, br); }
    // leaves: dark leaves all round the edge of each clump, lighter ones on the sunny upper left
    blobs.forEach(function (b, n) { for (k = 0; k < 9; k++) { var a5 = k / 9 * Math.PI * 2 + n, lx2 = b[0] + Math.cos(a5) * b[2] * 0.92, ly2 = b[1] + Math.sin(a5) * b[2] * 0.92; lfD += france_palm(lx2, ly2, 12 * s4, a5, 5); if (Math.cos(a5) < 0.3 && Math.sin(a5) < 0.4) lfL += france_palm(b[0] + Math.cos(a5) * b[2] * 0.55 - 4 * s4, b[1] + Math.sin(a5) * b[2] * 0.55 - 4 * s4, 11 * s4, a5 - 0.4, 5); } lfL += france_c(b[0] - b[2] * 0.25, b[1] - b[2] * 0.25, b[2] * 0.42); });
    trees.push({x: tc[0], y: tc[1], R: R, s: s4, blobs: blobs}); });
  // the tour boat (the engine moves it, and passes it under the bridge)
  var boatY = yw - 1, boatS = ph ? 0.56 : S * 0.82;
  if (!ANIM) { var bxB = W * (ph ? 0.62 : 0.6), sB = boatS; dark += france_pg([[bxB - 60 * sB, boatY - 7 * sB], [bxB + 56 * sB, boatY - 7 * sB], [bxB + 66 * sB, boatY - 12 * sB], [bxB + 62 * sB, boatY], [bxB - 56 * sB, boatY]]); cream += rect(bxB - 50 * sB, boatY - 19 * sB, 96 * sB, 12 * sB) + france_pg([[bxB - 52 * sB, boatY - 19 * sB], [bxB + 48 * sB, boatY - 19 * sB], [bxB + 44 * sB, boatY - 23 * sB], [bxB - 48 * sB, boatY - 23 * sB]]); for (j = 0; j < 9; j++) dark += rect(bxB - 46 * sB + j * 10.4 * sB, boatY - 17 * sB, 7.6 * sB, 6.4 * sB); }
  add(near, 'a', ground, C.ground); add(near, 'b', stone, C.stone); add(near, 'c', green, C.green); add(near, 'd', dark, C.dark); add(near, 'e', red, C.red); add(near, 'f', lfD, C.lfD); add(near, 'g', lfL, C.lfL); add(near, 'h', cream, C.cream);
  stk(near, 's', joint, C.joint, 1.1); stk(near, 't', iron, C.dark, ph ? 1.1 : 1.4 * S);
  // a hot-air balloon over the rooftops in the still scene (the engine lets it drift)
  if (!ANIM) { var blx = W * (ph ? 0.22 : 0.33), bly = H * (ph ? 0.3 : 0.24), blr = ph ? 14 : 18 * S, env = ''; env = france_e(blx, bly, blr, blr * 1.1) + france_pg([[blx - blr * 0.8, bly + blr * 0.6], [blx + blr * 0.8, bly + blr * 0.6], [blx + blr * 0.25, bly + blr * 1.5], [blx - blr * 0.25, bly + blr * 1.5]]); add(refl, 'g', env, dk ? '#A05060' : '#E86A5A'); add(refl, 'g', rect(blx - blr * 0.22, bly + blr * 1.7, blr * 0.44, blr * 0.36)); }
  if (ANIM) { ANIM.C = C; ANIM.T = T; ANIM.TX = TX; ANIM.TB = TB; ANIM.TH = TH; ANIM.hb = hb; ANIM.ry0 = ry0; ANIM.ptop = ptop; ANIM.pbot = pbot; ANIM.yw = yw; 
    ANIM.SK = SK; ANIM.SKs = SKs; ANIM.wins = wins; ANIM.lamps = lamps.concat(qlamps); ANIM.awn = awn; ANIM.tables = tables; ANIM.trees = trees; ANIM.stalls = stalls; ANIM.boat = {y: boatY, s: boatS}; ANIM.cafe = glass.concat(cfw); ANIM.moon = mn; ANIM.S = S; ANIM.tcs = tcs; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
