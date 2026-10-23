// -- world theme
function france_occ() { var O = {r: [], c: [], g: [], p: []};
  O.hit = function (x, y) { var i, q;
    for (i = 0; i < O.r.length; i++) { q = O.r[i]; if (x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3]) return true; }
    for (i = 0; i < O.c.length; i++) { q = O.c[i]; var dx = q[2] - q[0], dy = q[3] - q[1], L = dx * dx + dy * dy, u = L ? Math.max(0, Math.min(1, ((x - q[0]) * dx + (y - q[1]) * dy) / L)) : 0; if (Math.hypot(x - q[0] - dx * u, y - q[1] - dy * u) <= q[4]) return true; }
    for (i = 0; i < O.g.length; i++) { q = O.g[i]; var d = Math.hypot(x - q[0], y - q[1]); if (d <= q[2] && d >= q[3]) return true; }
    for (i = 0; i < O.p.length; i++) { var P = O.p[i], ins = false; for (var a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a][1] > y) !== (P[b][1] > y) && x < (P[b][0] - P[a][0]) * (y - P[a][1]) / (P[b][1] - P[a][1]) + P[a][0]) ins = !ins; if (ins) return true; }
    return false; };
  O.poly = function (P, m) { O.p.push(P); for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; O.c.push([a[0], a[1], b[0], b[1], m || 0.8]); } };
  O.line = function (pts) { var d = '', run = null, prev = null; for (var i = 0; i < pts.length; i++) { var h = O.hit(pts[i][0], pts[i][1]);
      if (!h) { if (!run) run = [pts[i]]; else run.push(pts[i]); } if ((h || i === pts.length - 1) && run) { if (run.length > 1) d += pline(run); run = null; } prev = pts[i]; } return d; };
  O.seg = function (x0, y0, x1, y1) { var n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.5)), pts = []; for (var i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); return O.line(pts); };
  return O; }
function france_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function france_pg(p) { return poly(france_area(p) < 0 ? p.slice().reverse() : p); }
function france_hole(p) { return poly(france_area(p) > 0 ? p.slice().reverse() : p); }
function france_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function france_c(x, y, r) { return france_e(x, y, r, r); }
function france_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 18; i++) { var t = i / 18 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return france_pg(rotp(p, x, y, ang)); }
// a band of width w along a polyline
function france_band(pts, w) { var A = [], B = [], n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], L = Math.hypot(dx, dy) || 1; A.push([p[0] - dy / L * w / 2, p[1] + dx / L * w / 2]); B.unshift([p[0] + dy / L * w / 2, p[1] - dx / L * w / 2]); } return france_pg(A.concat(B)); }
// an opening with a round (semi-elliptic) head
function france_archPts(x, y, w, h) { var r = w / 2, sp = y - h + Math.min(r, h * 0.6), p = [[x, y], [x, sp]], k; for (k = 1; k < 14; k++) { var a = Math.PI + k / 14 * Math.PI; p.push([x + r + Math.cos(a) * r, sp + Math.sin(a) * Math.min(r, h * 0.6)]); } p.push([x + w, sp], [x + w, y]); return p; }
// a horse-chestnut leaf
function france_palm(x, y, r, ang, n) { var d = ''; n = n || 5; for (var i = 0; i < n; i++) { var a = ang + (i - (n - 1) / 2) * 0.48, L = r * (1 - Math.abs(i - (n - 1) / 2) * 0.16); d += france_re(x + Math.cos(a) * L * 0.55, y + Math.sin(a) * L * 0.55, L * 0.5, L * 0.17, a * 57.2958); } return d; }

// Paris
var france_C = {
  L: {glow: 'rgba(255,246,232,0.55)', cloud: 'rgba(255,255,255,0.92)', haze: 'rgba(196,212,228,0.55)', dist: '#CFDAE6', iron: '#86705E', river: '#9CC2D2', rbld: 'rgba(250,236,214,0.32)', rtow: 'rgba(110,90,74,0.16)', shine: 'rgba(255,255,255,0.75)',
    facA: '#F4E7CE', facB: '#EED39E', facC: '#F2D2C6', zinc: '#8A9AB4', win: '#55678C', trim: '#FFFAF0', chim: '#D27A58', shade: 'rgba(98,72,110,0.16)', rail: '#3A3440', seam: 'rgba(255,255,255,0.45)',
    ground: '#DCCBB0', stone: '#E6D8BE', green: '#3E6E54', blue: '#3558A8', red: '#C8463E', cream: '#FFF8EC', lfD: '#4E7E46', lfL: '#7AAA5C', dark: '#3A3236', joint: 'rgba(120,96,70,0.32)', moon: '#FFF6E0'},
  D: {glow: 'rgba(150,140,220,0.28)', cloud: 'rgba(120,120,180,0.35)', haze: 'rgba(70,70,120,0.5)', dist: '#2E3460', iron: '#3C3452', river: '#22305A', rbld: 'rgba(120,110,170,0.3)', rtow: 'rgba(240,190,90,0.12)', shine: 'rgba(190,210,255,0.35)',
    facA: '#4E4C76', facB: '#5A4E74', facC: '#58486E', zinc: '#2C3054', win: '#22264A', trim: '#6C6A96', chim: '#704660', shade: 'rgba(8,6,28,0.3)', rail: '#16142A', seam: 'rgba(150,150,215,0.22)', lit: 'rgba(255,214,140,0.95)',
    ground: '#3A3858', stone: '#4C4A70', green: '#24463E', blue: '#2E3E88', red: '#8A3040', cream: '#E8DCC8', lfD: '#1E3434', lfL: '#2C4A40', dark: '#16142A', joint: 'rgba(10,8,30,0.35)', moon: '#FFF2CC'}
};
// The tower, base at (cx, by), TH tall
function france_tower(cx, by, TH) {
  var hwO = function (u) { return TH * (0.185 * Math.pow(1 - u, 2.4) + 0.011); };
  var hwI = function (u) { return Math.max(0, hwO(u) - TH * (0.05 + 0.1 * Math.max(0, u - 0.18))); };
  var Y = function (u) { return by - u * TH; }, e = Math.max(1.3, TH * 0.0042), body = '', lat = '', pts = [], u, k, s;
  function edge(f, sg, u0, u1) { var P = []; for (u = u0; u <= u1 + 1e-6; u += 0.01) P.push([cx + sg * f(u), Y(u)]); return P; }
  function dot(x, y) { pts.push([x, y]); }
  [-1, 1].forEach(function (sg) {
    body += france_band(edge(hwO, sg, 0, 0.86), e * 1.5) + france_band(edge(hwI, sg, 0, 0.36), e);
    var us = [0], uu = 0; while (uu < 0.36) { uu += Math.max(0.012, (hwO(uu) - hwI(uu)) / TH * 0.9); us.push(Math.min(0.36, uu)); }
    for (k = 0; k < us.length - 1; k++) { var a = us[k], b = us[k + 1], xo0 = cx + sg * hwO(a), xi0 = cx + sg * hwI(a), xo1 = cx + sg * hwO(b), xi1 = cx + sg * hwI(b);
      lat += seg(xo0, Y(a), xi1, Y(b)) + seg(xi0, Y(a), xo1, Y(b)) + seg(xo0, Y(a), xi0, Y(a)); dot(xo0, Y(a)); dot(xi0, Y(a)); dot((xo0 + xi1) / 2, (Y(a) + Y(b)) / 2); }
    lat += pline(edge(function (q) { return (hwO(q) + hwI(q)) / 2; }, sg, 0.02, 0.36));
  });
  var ay = Y(0.035), arx = hwI(0.035) + e, ary = (0.148 - 0.035) * TH, AR = [];
  for (k = 0; k <= 24; k++) { var t = Math.PI + k / 24 * Math.PI; AR.push([cx + Math.cos(t) * arx, ay + Math.sin(t) * ary]); }
  body += france_band(AR, e * 2.2); AR.forEach(function (p, j) { if (j % 2 === 0) dot(p[0], p[1]); });
  var g0 = Y(0.152), g1 = Y(0.168), gw = hwI(0.16);
  body += rect(cx - gw, g0 - e * 0.6, gw * 2, e * 1.2);
  for (s = -gw; s < gw - 1; s += (g0 - g1) * 1.1) lat += seg(cx + s, g0, cx + s + (g0 - g1) * 1.1, g1) + seg(cx + s, g1, cx + s + (g0 - g1) * 1.1, g0);
  for (k = 2; k < 23; k += 2) { var ap = AR[k]; if (ap[1] > g0 + 3) lat += seg(ap[0], ap[1], ap[0], g0); }
  var P1 = Y(0.18), w1 = hwO(0.18) + TH * 0.014, P2 = Y(0.365), w2 = hwO(0.365) + TH * 0.011, P3 = Y(0.85), w3 = hwO(0.85) + TH * 0.012;
  body += rect(cx - w1, P1 - TH * 0.004, w1 * 2, TH * 0.022) + rect(cx - w1 * 0.97, P1 - TH * 0.024, w1 * 1.94, TH * 0.006);
  for (s = -w1 * 0.94; s < w1 * 0.94; s += TH * 0.016) { lat += seg(cx + s, P1 - TH * 0.004, cx + s, P1 - TH * 0.019); dot(cx + s, P1 - TH * 0.012); }
  body += rect(cx - w2, P2 - TH * 0.003, w2 * 2, TH * 0.016) + rect(cx - w2 * 0.95, P2 - TH * 0.016, w2 * 1.9, TH * 0.005);
  for (s = -w2 * 0.9; s < w2 * 0.9; s += TH * 0.014) { lat += seg(cx + s, P2 - TH * 0.003, cx + s, P2 - TH * 0.012); dot(cx + s, P2 - TH * 0.008); }
  var mu = [0.38], m = 0.38; while (m < 0.84) { m += Math.max(0.014, hwO(m) * 1.5 / TH); mu.push(Math.min(0.84, m)); }
  for (k = 0; k < mu.length - 1; k++) { var a2 = mu[k], b2 = mu[k + 1], L0 = hwO(a2), L1 = hwO(b2);
    lat += seg(cx - L0, Y(a2), cx + L1, Y(b2)) + seg(cx + L0, Y(a2), cx - L1, Y(b2)) + seg(cx - L0, Y(a2), cx + L0, Y(a2)); dot(cx - L0, Y(a2)); dot(cx + L0, Y(a2)); dot(cx, (Y(a2) + Y(b2)) / 2); }
  lat += pline(edge(function (q) { return hwO(q) * 0.42; }, -1, 0.37, 0.84)) + pline(edge(function (q) { return hwO(q) * 0.42; }, 1, 0.37, 0.84));
  body += rect(cx - w3, P3 - TH * 0.004, w3 * 2, TH * 0.012) + rect(cx - w3 * 0.75, P3 - TH * 0.032, w3 * 1.5, TH * 0.03) + rect(cx - w3 * 0.95, P3 - TH * 0.036, w3 * 1.9, TH * 0.006);
  body += france_e(cx, P3 - TH * 0.04, w3 * 0.5, TH * 0.012) + rect(cx - TH * 0.004, Y(1) + TH * 0.01, TH * 0.008, P3 - TH * 0.04 - Y(1) - TH * 0.01) + rect(cx - TH * 0.008, Y(0.93), TH * 0.016, TH * 0.02);
  for (s = -w3 * 0.6; s <= w3 * 0.6; s += w3 * 0.3) dot(cx + s, P3 - TH * 0.018);
  for (u = 0.88; u < 1; u += 0.02) dot(cx, Y(u));
  lat.split('M').forEach(function (sp) { var n = sp.match(/-?[\d.]+/g); if (!n) return; for (var q = 0; q + 3 < n.length; q += 2) { var x0 = +n[q], y0 = +n[q + 1], x1 = +n[q + 2], y1 = +n[q + 3], L = Math.hypot(x1 - x0, y1 - y0); for (var d = 3; d < L; d += Math.max(4, TH * 0.012)) dot(x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L); } });
  var out = []; for (u = 0; u <= 0.86; u += 0.04) out.push([cx - hwO(u), Y(u)]); out.push([cx, Y(1)]); for (u = 0.86; u >= 0; u -= 0.04) out.push([cx + hwO(u), Y(u)]);
  return {body: body, lat: lat, pts: pts, out: out, top: [cx, Y(0.93)], beacon: [cx, Y(0.9)], hw: hwO(0), P1: P1, e: e};
}
// A French flag
function france_flagP(F, u, v, t) { var hx = F.x0 + (F.x1 - F.x0) * u, hy = F.y0 + (F.y1 - F.y0) * u, w = Math.sin(t * 3.1 - v * 5.2 + u * 0.7) * F.a * v, sag = v * v * F.L * 0.07;
  return [hx + F.fx * F.L * v - F.fy * w, hy + F.fy * F.L * v + F.fx * w + sag]; }
// Each band is one smooth region (v0..v1 of the cloth)
function france_flagR(F, t, v0, v1) { var P = [], q, n = 18; for (q = 0; q <= n; q++) P.push(france_flagP(F, 0, v0 + (v1 - v0) * q / n, t)); for (q = 1; q <= 4; q++) P.push(france_flagP(F, q / 4, v1, t)); for (q = n; q >= 0; q--) P.push(france_flagP(F, 1, v0 + (v1 - v0) * q / n, t)); for (q = 3; q >= 1; q--) P.push(france_flagP(F, q / 4, v0, t)); return france_pg(P); }
function france_flagD(F, t) { return [france_flagR(F, t, 0, 1), france_flagR(F, t, 1 / 3 - 0.006, 2 / 3 + 0.006), france_flagR(F, t, 2 / 3, 1)]; }
// a ring (a tyre, an iron hoop)
function france_ring(x, y, r, r2) { var A = [], B = []; for (var i = 0; i < 28; i++) { var a = i / 28 * Math.PI * 2; A.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); B.push([x + Math.cos(a) * r2, y + Math.sin(a) * r2]); } return france_pg(A) + france_hole(B); }
// the top half of an ellipse standing on y (a dome, a hood, a fanlight)
function france_semi(cx, y, rx, ry) { var p = []; for (var i = 0; i <= 16; i++) { var a = Math.PI + i / 16 * Math.PI; p.push([cx + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return france_pg(p); }
// the stripes of an awning with a scalloped valance, x0..x1 between y0 and y1
function france_awn(x0, x1, y0, y1, n, sl, s) { var sw = (x1 - x0) / n, r = ['', '']; for (var j = 0; j < n; j++) { var a = x0 + j * sw; r[j % 2] += france_pg([[a, y0], [a + sw, y0], [a + sw + sl, y1], [a + sl, y1]]) + france_e(a + sl + sw / 2, y1, sw / 2, 3 * s); } return r; }
// capital letters as strokes (shop signs), h tall from (x, y)
function france_txtW(str, h) { return str.length * h * 0.94 - h * 0.32; }
function france_txt(str, x, y, h) { var d = '', w = h * 0.62, gap = h * 0.32;
  str.split('').forEach(function (ch) { var L = x, R = x + w, T = y, B = y + h, M = y + h / 2, a, p = [];
    if (ch === 'C') { for (a = -Math.PI / 4; a >= -Math.PI * 1.75; a -= Math.PI / 8) p.push([L + w / 2 + Math.cos(a) * w / 2, M + Math.sin(a) * h / 2]); d += pline(p); }
    else if (ch === 'A') d += pline([[L, B], [L + w / 2, T], [R, B]]) + seg(L + w * 0.25, M + h * 0.1, R - w * 0.25, M + h * 0.1);
    else if (ch === 'F' || ch === 'E' || ch === 'É') { d += pline([[R, T], [L, T], [L, B]]) + seg(L, M, R - w * 0.2, M); if (ch !== 'F') d += seg(L, B, R, B); if (ch === 'É') d += seg(L + w * 0.35, T - h * 0.16, L + w * 0.7, T - h * 0.36); }
    else if (ch === 'L') d += pline([[L, T], [L, B], [R, B]]);
    else if (ch === 'U') d += pline([[L, T], [L, B - h * 0.25], [L + w * 0.22, B], [R - w * 0.22, B], [R, B - h * 0.25], [R, T]]);
    else if (ch === 'R') d += pline([[L, B], [L, T], [R - w * 0.25, T], [R, T + h * 0.14], [R, M - h * 0.12], [R - w * 0.25, M], [L, M]]) + seg(L + w * 0.45, M, R, B);
    else if (ch === 'S') d += pline([[R, T + h * 0.12], [R - w * 0.22, T], [L + w * 0.22, T], [L, T + h * 0.16], [L, M - h * 0.12], [L + w * 0.22, M], [R - w * 0.22, M], [R, M + h * 0.12], [R, B - h * 0.16], [R - w * 0.22, B], [L + w * 0.22, B], [L, B - h * 0.12]]);
    x += w + gap; });
  return d; }

// One Haussmann building on the far quay, its base at y 'base'
function france_haus(Z, x, w, base, fl, fh, k, rnd, o) {
  var g = fh * 1.45, gt = base - g, top = gt - fl * fh, nb = Math.max(2, Math.round(w / (fh * 0.95))), bw = w / nb, ww = fh * 0.42, wh = fh * 0.62, i, j, q, y, wins = [], N = Z.N, F = o.tone || 0;
  Z.fac[F] += rect(x, top, w, base - top + 0.5);
  Z.shade += rect(x + w - fh * 0.16, top, fh * 0.16, base - top) + rect(x + w - fh * 0.3, top, fh * 0.14, base - top);
  if (F) for (q = 0, y = top + 3; y < gt - fh * 0.3; y += fh * 0.27, q++) { var qw = fh * (q % 2 ? 0.34 : 0.22); Z.trim += rect(x, y, qw, fh * 0.21) + rect(x + w - qw, y, qw, fh * 0.21); }
  // -- ground floor
  for (y = gt + g * 0.22; y < base - 2; y += g * 0.2) Z.shade += rect(x, y, w, 0.9);
  var door = Math.min(nb - 1, Math.floor(nb / 2) - 1 + (k % 2) * 2), awn = ['', ''];
  for (j = 0; j < nb; j++) { var bx = x + j * bw;
    if (j === door) { var dw = bw * 0.58, dx = bx + (bw - dw) / 2, dh = g * 0.84, sp = base - dh + dw / 2, dq = base - sp;
      Z.trim += rect(dx - 2.2, sp, dw + 4.4, dq) + france_semi(dx + dw / 2, sp, dw / 2 + 2.2, dw / 2 + 2.2) + rect(dx + dw / 2 - 2, base - dh - 3.6, 4, 4.4);
      Z.win += france_semi(dx + dw / 2, sp, dw / 2, dw / 2); Z.seam += seg(dx + dw / 2, sp, dx + dw / 2, sp - dw / 2) + seg(dx + dw / 2, sp, dx + dw * 0.14, sp - dw * 0.28) + seg(dx + dw / 2, sp, dx + dw * 0.86, sp - dw * 0.28);
      N = Z.vis(dx + dw + 3, sp - dw) ? Z.N : Z.X; N[o.dc] += rect(dx, sp + 0.6, dw, dq - 0.6);
      N.joint += seg(dx + dw / 2, sp + 1, dx + dw / 2, base) + rect(dx + dw * 0.12, sp + dq * 0.1, dw * 0.27, dq * 0.36) + rect(dx + dw * 0.61, sp + dq * 0.1, dw * 0.27, dq * 0.36) + rect(dx + dw * 0.12, sp + dq * 0.56, dw * 0.27, dq * 0.34) + rect(dx + dw * 0.61, sp + dq * 0.56, dw * 0.27, dq * 0.34);
      N.cream += france_c(dx + dw * 0.42, sp + dq * 0.52, Math.max(0.8, fh * 0.04)) + france_c(dx + dw * 0.58, sp + dq * 0.52, Math.max(0.8, fh * 0.04));
    } else if (o.shop) { var ox = bx + bw * 0.07, ow = bw * 0.86, fy = gt + g * 0.06, gy = gt + g * 0.4, gb = base - g * 0.1;
      N = Z.vis(ox + ow + 3, fy - 2) ? Z.N : Z.X; N[o.sc] += rect(ox, fy, ow, base - fy); N.dark += rect(ox + ow * 0.1, gy, ow * 0.8, gb - gy);
      N.cream += rect(ox + ow * 0.5 - 0.5, gy, 1, gb - gy) + rect(ox + ow * 0.1, gy + (gb - gy) * 0.24, ow * 0.8, 0.8) + rect(ox + ow * 0.2, fy + g * 0.03, ow * 0.6, g * 0.1);
      for (q = 0; q < 4; q++) { var gx2 = ox + ow * (0.2 + q * 0.2); if (q % 2) N.red += france_c(gx2, gb - fh * 0.09, fh * 0.08); else N.cream += france_semi(gx2, gb - 0.4, fh * 0.11, fh * 0.13); }
      var aw = france_awn(ox - 2, ox + ow + 2, gy - g * 0.1, gy + g * 0.14, Math.max(4, Math.round(ow / (fh * 0.17))), 1.2, fh * 0.03); if (N === Z.N) { awn[0] += aw[0]; awn[1] += aw[1]; }
    } else { var ax = bx + bw * 0.2, aw2 = bw * 0.6, ah = g * 0.72, asp = base - ah + aw2 / 2, ring = [];
      for (q = 0; q <= 12; q++) { var a0 = Math.PI + q / 12 * Math.PI; ring.push([ax + aw2 / 2 + Math.cos(a0) * (aw2 / 2 + 1), asp + Math.sin(a0) * (aw2 / 2 + 1)]); }
      Z.win += rect(ax, asp, aw2, base - asp) + france_semi(ax + aw2 / 2, asp, aw2 / 2, aw2 / 2);
      Z.trim += france_band(ring, 2) + rect(ax + aw2 / 2 - 1.8, asp - aw2 / 2 - 3, 3.6, 4) + rect(ax + aw2 / 2 - 0.5, asp - aw2 / 2, 1, base - asp + aw2 / 2) + rect(ax, asp + (base - asp) * 0.4, aw2, 0.9);
      Z.shade += rect(ax, asp, aw2, (base - asp) * 0.16); }
  }
  N = Z.N; N[o.ac] += awn[0]; N.cream += awn[1];
  Z.trim += rect(x - 1, gt - 3.4, w + 2, 3.8); Z.shade += rect(x, gt + 0.4, w, 2);
  // -- the storeys
  for (i = 0; i < fl; i++) {
    var y0 = gt - (i + 1) * fh, full = fl > 2 && (i === 1 || i === fl - 1), wy = y0 + fh * 0.22;
    for (j = 0; j < nb; j++) { var wx = x + j * bw + (bw - ww) / 2;
      Z.win += rect(wx, wy, ww, wh); wins.push([wx, wy, ww, wh, rnd()]);
      Z.trim += rect(wx - 1.6, wy - 0.6, 1.6, wh + 0.6) + rect(wx + ww, wy - 0.6, 1.6, wh + 0.6) + rect(wx - 2.4, wy - 3, ww + 4.8, 2.6) + rect(wx - 2, wy + wh, ww + 4, 1.6) + rect(wx + ww / 2 - 0.4, wy, 0.8, wh) + rect(wx, wy + wh * 0.3, ww, 0.7);
      Z.shade += rect(wx, wy, ww, wh * 0.16) + rect(wx - 2.2, wy - 0.4, ww + 4.4, 1.2);
      if (i === 0) { if (j % 2) Z.trim += france_pg([[wx - 3, wy - 3], [wx + ww / 2, wy - 3 - fh * 0.2], [wx + ww + 3, wy - 3]]); else Z.trim += france_semi(wx + ww / 2, wy - 3, ww / 2 + 3, fh * 0.15); }
      if (!full) { var h7 = hash(j * 3.7 + k * 11.3 + i * 5.1);
        if (h7 < 0.55) { var by7 = wy + wh + 1.2, bh7 = fh * 0.13; Z.chim += rect(wx - 1.4, by7, ww + 2.8, bh7); N = Z.vis(wx + ww + 3, by7 - fh * 0.2) ? Z.N : Z.X;
          for (q = 0; q < 4; q++) { var fx7 = wx + ww * (0.08 + q * 0.28); N.lfL += france_c(fx7, by7 - 0.2, fh * 0.08); if (q % 2 === 0) N.lfD += france_e(fx7 + fh * 0.04, by7 + bh7 + fh * 0.05, fh * 0.04, fh * 0.08); }
          for (q = 0; q < 3; q++) { var fx8 = wx + ww * (0.18 + q * 0.32), fy8 = by7 - fh * 0.13; if ((q + j + k + i) % 3) N.red += france_c(fx8, fy8, fh * 0.06); else N.cream += france_c(fx8, fy8, fh * 0.055); } }
        else { var bb = wy + wh * 0.62; Z.trim += rect(wx - 2, wy + wh, ww + 4, 1.6); Z.rail += seg(wx - 1.6, bb, wx + ww + 1.6, bb); for (var r8 = wx - 1; r8 <= wx + ww + 1; r8 += 2.2) Z.rail += seg(r8, bb, r8, wy + wh); } } }
    if (full) { var yb = wy + wh, yr = yb - wh * 0.4; Z.trim += rect(x - 1.5, yb, w + 3, 2.6); Z.shade += rect(x, yb + 2.6, w, 2.2);
      Z.rail += seg(x, yr, x + w, yr) + seg(x, yb - 1, x + w, yb - 1); for (var q2 = x + 1; q2 < x + w; q2 += 2.4) Z.rail += seg(q2, yr, q2, yb);
      for (j = 0; j < nb; j++) { var cx9 = x + j * bw + bw / 2; Z.rail += france_c(cx9 - ww * 0.32, (yr + yb) / 2, (yb - yr) * 0.24) + france_c(cx9 + ww * 0.32, (yr + yb) / 2, (yb - yr) * 0.24); }
      if (i === fl - 1) for (j = 0; j < nb; j++) if (hash(j + k * 7.7) < 0.4) { var px9 = x + j * bw + bw * (hash(j * 2 + k) < 0.5 ? 0.13 : 0.87); N = Z.vis(px9 + fh * 0.2, yr - fh * 0.25) ? Z.N : Z.X; N.lfD += france_c(px9, yr - fh * 0.06, fh * 0.14); N.lfL += france_c(px9 - fh * 0.04, yr - fh * 0.11, fh * 0.07); } }
  }
  N = Z.N;
  // -- the cornice, with dentils and its shadow
  Z.trim += rect(x - 3, top - 4, w + 6, 4.4); for (q = x + 1; q < x + w - 1; q += 3.2) Z.trim += rect(q, top + 0.4, 1.6, 1.8); Z.shade += rect(x, top + 2.4, w, 2.6);
  // -- the mansard
  var mh = fh * 1.3, ry = top - 4, rt = ry - mh, ins = mh * 0.24, cap = mh * 0.2, R = [], L = [];
  for (q = 0; q <= 6; q++) { var u = q / 6, off = ins * u * u; L.push([x - 2 + off, ry - mh * u]); R.unshift([x + w + 2 - off, ry - mh * u]); }
  Z.zinc += france_pg(L.concat([[x + ins + cap * 1.4, rt - cap], [x + w - ins - cap * 1.4, rt - cap]], R));
  Z.shade += france_pg([[x + ins - 1, rt + 0.5], [x + ins + cap * 1.4, rt - cap], [x + w - ins - cap * 1.4, rt - cap], [x + w - ins + 1, rt + 0.5]]) + rect(x - 1, ry - 2.6, w + 2, 2.6);
  Z.trim += rect(x + ins - 1, rt - 0.4, w - 2 * ins + 2, 1.4);
  for (var sx = x + 4; sx < x + w - 2; sx += 4.4) { var uu = Math.abs(sx - x - w / 2) / (w / 2), dd = uu > 0.6 ? (sx < x + w / 2 ? 1 : -1) * ins * (uu - 0.6) * 2 : 0; Z.seam += seg(sx, ry - 2.8, sx + dd, rt + 1.4); }
  for (j = 0; j < nb; j++) { if ((j + k) % 2 && nb > 3) continue; if (o.dome && Math.abs(j * bw + bw / 2 - w / 2) < bw * 0.8) continue;
    var dW = ww * 1.5, dX = x + j * bw + (bw - dW) / 2, dH = mh * 0.5, dY = ry - mh * 0.2 - dH, pw = dW * 0.2, ty = (j + k) % 3;
    if (ty === 2) { var oc = dX + dW / 2, oy = dY + dH * 0.62, orr = dW * 0.34; Z.win += france_c(oc, oy, orr); wins.push([oc - orr * 0.7, oy - orr * 0.7, orr * 1.4, orr * 1.4, rnd()]);
      Z.zinc += france_semi(oc, oy - orr - 1, orr + 3.4, orr * 0.9); Z.trim += france_ring(oc, oy, orr + 1.8, orr) + rect(oc - 0.4, oy - orr, 0.8, orr * 2); Z.shade += rect(oc + orr + 1.8, oy - orr, 1.6, orr * 2 + 2); continue; }
    Z.win += rect(dX + pw, dY, dW - 2 * pw, dH); wins.push([dX + pw, dY, dW - 2 * pw, dH, rnd()]);
    Z.trim += rect(dX, dY, pw, dH + mh * 0.2) + rect(dX + dW - pw, dY, pw, dH + mh * 0.2) + rect(dX - 1, dY - 2.4, dW + 2, 2.6) + rect(dX + pw, dY + dH, dW - 2 * pw, 1.4) + rect(dX + dW / 2 - 0.4, dY, 0.8, dH);
    if (ty === 0) { var arc = []; for (q = 0; q <= 10; q++) { var a1 = Math.PI + q / 10 * Math.PI; arc.push([dX + dW / 2 + Math.cos(a1) * (dW / 2 + 1.4), dY - 2.4 + Math.sin(a1) * (dW * 0.42 - 0.6)]); }
      Z.zinc += france_semi(dX + dW / 2, dY - 2.4, dW / 2 + 2, dW * 0.42); Z.trim += france_band(arc, 1.3); }
    else { var tri = [[dX - 2.4, dY - 2.4], [dX + dW / 2, dY - 2.4 - dW * 0.5], [dX + dW + 2.4, dY - 2.4]]; Z.zinc += france_pg(tri); Z.trim += france_band(tri, 1.3); }
    Z.shade += rect(dX + dW, dY - 1, 1.8, dH + mh * 0.2) + rect(dX + pw, dY, dW - 2 * pw, dH * 0.18); }
  var rTop = rt - cap, cs = o.dome ? [0.04, 0.96] : w > fh * 5 ? [0.04, 0.5, 0.96] : [0.06, 0.94];
  cs.forEach(function (f, n) { var cw = fh * (0.7 + hash(k * 3 + n) * 0.4), ch = fh * (0.55 + hash(k * 5 + n * 2) * 0.45), cx = Math.max(x + 1, Math.min(x + w - cw - 1, x + w * f - cw / 2));
    Z.fac[F] += rect(cx, rTop - ch, cw, ch + cap + 2); Z.shade += rect(cx + cw * 0.68, rTop - ch, cw * 0.32, ch + cap + 2); Z.trim += rect(cx - 1.4, rTop - ch - 2.2, cw + 2.8, 2.4);
    var np = Math.max(2, Math.floor(cw / 4)), pg = cw / np; for (var p = 0; p < np; p++) { var pxx = cx + pg * (p + 0.5); Z.chim += rect(pxx - 1.1, rTop - ch - 6.4, 2.2, 4.4) + rect(pxx - 1.6, rTop - ch - 7.2, 3.2, 1.2); }
    Z.top(cx - 2, cx + cw + 2, rTop - ch - 7.2); });
  Z.top(x - 3, x + w + 3, rTop);
  if (o.dome) { var dc = x + w / 2, dr = fh * 0.95, drY = rTop - fh * 0.55, dmY = drY - 2, oyy = drY + (rTop - drY) * 0.55;
    Z.fac[F] += rect(dc - dr * 0.86, drY, dr * 1.72, rTop - drY + mh * 0.3); Z.shade += rect(dc + dr * 0.5, drY, dr * 0.36, rTop - drY + 2);
    Z.trim += rect(dc - dr * 0.95, drY - 2.2, dr * 1.9, 2.6) + rect(dc - dr * 0.86, drY, 1.6, rTop - drY) + rect(dc + dr * 0.86 - 1.6, drY, 1.6, rTop - drY);
    Z.win += france_e(dc, oyy, dr * 0.22, (rTop - drY) * 0.28); Z.trim += france_ring(dc, oyy, dr * 0.3, dr * 0.21);
    Z.zinc += france_semi(dc, dmY, dr * 0.92, dr * 1.05); Z.shade += france_pg([[dc + dr * 0.3, dmY], [dc + dr * 0.92, dmY], [dc + dr * 0.8, dmY - dr * 0.55], [dc + dr * 0.45, dmY - dr * 0.92]]);
    for (q = -2; q <= 2; q++) { var rib = []; for (var n2 = 0; n2 <= 8; n2++) { var th = n2 / 8 * Math.PI / 2; rib.push([dc + q / 2.6 * dr * 0.92 * Math.cos(th), dmY - dr * 1.05 * Math.sin(th)]); } Z.seam += pline(rib); }
    var lY = dmY - dr * 1.05 + 1; Z.trim += rect(dc - dr * 0.18, lY - fh * 0.34, dr * 0.36, fh * 0.36); Z.win += rect(dc - dr * 0.07, lY - fh * 0.28, dr * 0.14, fh * 0.2); Z.zinc += france_semi(dc, lY - fh * 0.34, dr * 0.24, fh * 0.2);
    var pTop = lY - fh * 0.54 - fh * 1.5; N.dark += rect(dc - 0.7, pTop, 1.4, lY - fh * 0.5 - pTop); N.cream += france_c(dc, pTop - 1, 1.5);
    Z.flags.push({x0: dc + 0.6, y0: pTop + 0.5, x1: dc + 0.6, y1: pTop + fh * 0.6, fx: 1, fy: 0, L: fh * 0.92, a: fh * 0.09});
    Z.top(dc - dr, dc + dr, dmY - dr); Z.top(dc - 2, dc + fh, pTop); }
  return wins;
}
SCENES.france = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(10), refl = Lay(0), mid = Lay(0), near = Lay(0), C = france_C[dk ? 'D' : 'L'], i, j, x, y, k;
  var sky = dk ? 'linear-gradient(180deg,#121A36 0%,#263258 45%,#5A4468 72%,#3A3460 100%)' : 'linear-gradient(180deg,#B9D6EE 0%,#E9F1F6 46%,#F6E4D6 72%,#EED8C6 100%)';
  var S = ph ? 1 : Math.max(0.6, Math.min(1.15, H / 800));
  var hb = H * (ph ? 0.705 : 0.655), ry0 = hb + H * (ph ? 0.016 : 0.02), ptop = H * (ph ? 0.862 : 0.842), pbot = ptop + H * (ph ? 0.03 : 0.034);
  var cX = W * (ph ? 0.34 : 0.215), cw2 = cX + 10, cTop = H * (ph ? 0.6 : 0.5), xn = W * (ph ? 0.06 : 0.08), xf = W * (ph ? 0.6 : 0.56);
  var SK = [], SKs = 4; for (x = 0; x <= W + SKs; x += SKs) SK.push(hb);
  function skyTop(x0, x1, yy) { for (var q = Math.max(0, Math.floor(x0 / SKs)); q <= Math.min(SK.length - 1, Math.ceil(x1 / SKs)); q++) if (yy < SK[q]) SK[q] = yy; }
  // -- far: glow, clouds or stars, a hazy distant skyline
  var mn = [W * (ph ? 0.3 : 0.5), H * (ph ? 0.12 : 0.15), ph ? 22 : 30];
  if (dk) add(far, 'a', france_e(W * (ph ? 0.62 : 0.74), H * 0.34, W * 0.62, H * 0.36), C.glow); else add(far, 'a', france_e(W * 0.5, hb - H * 0.12, W * 0.7, H * 0.1), C.glow);
  if (dk) { add(far, 'a', france_c(mn[0], mn[1], mn[2] * 3.2), 'rgba(200,200,255,0.2)'); var st = ''; spread(0, 0, W, hb - H * 0.12, 40, 40, rnd, 1).forEach(function (c) { if (c.q < 0.32 && Math.hypot(c.x - mn[0], c.y - mn[1]) > mn[2] * 1.6) st += france_c(c.x, c.y, 0.5 + c.r * 0.9); }); add(refl, 'e', st, C.moon); }
  var cl = ''; (ph ? [[0.2, 0.08, 0.55], [0.82, 0.26, 0.5], [0.3, 0.42, 0.45]] : [[0.1, 0.1, 0.9], [0.38, 0.05, 0.7], [0.66, 0.22, 0.8], [0.94, 0.08, 0.7], [0.24, 0.36, 0.6]]).forEach(function (q) { var cx = W * q[0], cy = H * q[1], s = q[2] * (ph ? 0.8 : S);
    cl += france_e(cx, cy, 90 * s, 14 * s) + france_e(cx - 34 * s, cy - 8 * s, 40 * s, 17 * s) + france_e(cx + 20 * s, cy - 14 * s, 46 * s, 22 * s) + france_e(cx + 58 * s, cy - 4 * s, 30 * s, 12 * s); });
  add(far, 'b', cl, C.cloud);
  var dist = ridge(W, hb - H * (ph ? 0.2 : 0.17), [[H * 0.02, 70, 1.3], [H * 0.012, 23, 0.4]], 6, false), dd = '';
  for (x = -20; x < W + 20; x += 18 + rnd() * 30) { var dh = H * (0.02 + rnd() * 0.04); dd += rect(x, hb - H * (ph ? 0.2 : 0.17) - dh, 14 + rnd() * 26, dh + 10); }
  add(far, 'c', below(dist, hb + 4) + dd, C.haze);
  // -- refl: distant rooftops, the tower, the river, and the stone of both quays
  var dist2 = ''; for (x = -20; x < W + 20;) { var w2 = 26 + rnd() * 50, h2 = H * (0.012 + rnd() * 0.03), y2 = hb - H * (ph ? 0.1 : 0.12) - h2; dist2 += rect(x, y2, w2, hb - y2) + france_pg([[x, y2], [x + 5, y2 - 7], [x + w2 - 5, y2 - 7], [x + w2, y2]]); if (rnd() < 0.5) dist2 += rect(x + w2 * 0.3, y2 - 13, 5, 7); x += w2 + rnd() * 6; }
  add(refl, 'a', dist2, C.dist);
  var TX = W * (ph ? 0.74 : 0.79), TH = H * (ph ? 0.6 : 0.6), TB = hb - H * (ph ? 0.03 : 0.035), T = france_tower(TX, TB, TH);
  add(refl, 'b', T.body, C.iron); stk(refl, 's', T.lat, C.iron, Math.max(0.8, TH * 0.0021));
  add(refl, 'c', rect(-10, ry0 - 3, W + 20, H - ry0 + 13), C.river);
  if (dk) add(refl, 'e', france_c(mn[0], mn[1], mn[2]), C.moon);
  add(refl, 'h', rect(-10, hb - 1, W + 20, ry0 - hb + 2) + rect(-10, pbot - 2, W + 20, H - pbot + 12), C.ground);
  // -- mid: the far bank
  var N = {stone: '', green: '', blue: '', dark: '', red: '', lfD: '', lfL: '', cream: '', joint: '', iron: ''};
  var Z = {fac: ['', '', ''], zinc: '', win: '', trim: '', chim: '', shade: '', rail: '', seam: '', top: skyTop, flags: [], N: N, X: {stone: '', green: '', blue: '', dark: '', red: '', lfD: '', lfL: '', cream: '', joint: '', iron: ''},
    vis: function (px, py) { return !(px < cX + 8 && py > cTop - 12 * S); }}, wins = [], fh = ph ? 17 : 26 * S;
  var STY = [{sc: 'green', ac: 'red', dc: 'blue'}, {sc: 'blue', ac: 'red', dc: 'green'}, {sc: 'stone', ac: 'green', dc: 'red'}, {sc: 'green', ac: 'blue', dc: 'red'}];
  var bx = -8, bEnd = TX - T.hw * (ph ? 0.9 : 1.15); k = 0;
  while (bx < bEnd) { var bw2 = fh * (4.2 + rnd() * 3); if (bEnd - bx - bw2 < fh * 3) bw2 = bEnd - bx; var sy = STY[k % 4];
    wins = wins.concat(france_haus(Z, bx, bw2, hb, 4 + (k % 3 === 1 ? 1 : 0), fh, k, rnd, {tone: [0, 1, 2, 0, 2, 1][k % 6], shop: k % 3 !== 2, sc: sy.sc, ac: sy.ac, dc: sy.dc, dome: !ph && k === 2 && bw2 > fh * 4.5})); bx += bw2; k++; }
  var bR = TX + T.hw * (ph ? 0.95 : 1.25); if (W - bR > fh * 3) wins = wins.concat(france_haus(Z, bR, W - bR + 10, hb, 4, fh, k + 1, rnd, {tone: 1, shop: true, sc: 'blue', ac: 'red', dc: 'green'}));
  add(mid, 'a', Z.fac[0], C.facA); add(mid, 'b', Z.fac[1], C.facB); add(mid, 'c', Z.fac[2], C.facC); add(mid, 'd', Z.zinc, C.zinc); add(mid, 'e', Z.win, C.win); add(mid, 'f', Z.trim, C.trim); add(mid, 'g', Z.chim, C.chim); add(mid, 'h', Z.shade, C.shade);
  stk(mid, 's', Z.rail, C.rail, ph ? 0.6 : 0.8);
  var qr = seg(-10, hb - fh * 0.3, W + 10, hb - fh * 0.3) + seg(-10, hb + 1, W + 10, hb + 1); for (x = -6; x < W + 6; x += fh * 0.5) qr += seg(x, hb + 1, x, hb - fh * 0.3); stk(mid, 's', qr);
  if (!dk || ANIM) stk(mid, 't', Z.seam, C.seam, 0.6);
  if (dk && !ANIM) { var lit = ''; wins.forEach(function (w) { if (w[4] < 0.42) lit += seg(w[0] + w[2] / 2, w[1] + w[2] * 0.35, w[0] + w[2] / 2, w[1] + w[3] - w[2] * 0.35); }); stk(mid, 't', lit, C.lit, fh * 0.4); }
  // -- near: the bridge, the quay with its parapet and bookseller boxes, the cafe
  var stone = '', green = '', red = '', cream = '', lfD = '', lfL = '', dark = '', joint = '', iron = '', blue = '', flags = Z.flags;
  var na = ph ? 3 : 4, lamps = [], yw = ry0 + (ptop - ry0) * 0.45;
  function bX(u) { return xn + (xf - xn) * (1 - Math.pow(Math.max(0, 1 - u), 1.5)); }
  function bW(u) { return ptop + (ry0 + 3 - ptop) * u; }
  function bS(u) { return 1 - 0.68 * u; }
  function bH(u) { return H * (ph ? 0.085 : 0.1) * bS(u); }
  function bP(u) { return H * (ph ? 0.016 : 0.019) * bS(u); }
  var bt = [], bb = [], u;
  for (u = 0; u <= 1.0001; u += 0.02) { bt.push([bX(u), bW(u) - bH(u) - bP(u)]); bb.unshift([bX(u), bW(u) + 3]); }
  stone += france_pg(bt.concat([[bX(1) + 6, bW(1) - bH(1) - bP(1)], [bX(1) + 6, bW(1) + 3]], bb));
  for (j = 0; j < na; j++) { var u0 = (j + 0.13) / na, u1 = (j + 0.87) / na, AP = [], RG = [];
    for (k = 0; k <= 16; k++) { var s5 = k / 16, uu = u0 + (u1 - u0) * s5, cr = Math.pow(Math.sin(Math.PI * s5), 0.55), ax5 = bX(uu), ay5 = bW(uu) + 4 - bH(uu) * 0.74 * cr; AP.push([ax5, k === 0 || k === 16 ? bW(uu) + 4 : ay5]); RG.push([ax5, ay5 - 6 * bS(uu) * S]);
      if (k > 0 && k < 16) joint += seg(ax5, ay5, ax5 + (s5 - 0.5) * 3 * bS(uu), ay5 - 6.4 * bS(uu) * S); }
    stone += france_hole(AP); joint += pline(RG);
    if (j < na - 1) { var up = (j + 1) / na, px5 = bX(up), sc5 = bS(up), pw5 = (bX(u1 + 0.26 / na) - bX(u1)) * 0.5;
      stone += france_pg([[px5 - pw5, bW(up) + 3], [px5 + pw5, bW(up) + 3], [px5 + pw5 * 0.4, bW(up) + 7 * sc5], [px5 - pw5 * 0.4, bW(up) + 7 * sc5]]) + rect(px5 - pw5 * 0.7, bW(up) - bH(up) - bP(up) - 4 * sc5, pw5 * 1.4, bH(up) * 0.3 + bP(up) + 4 * sc5);
      lamps.push([px5, bW(up) - bH(up) - bP(up) - 4 * sc5, sc5]); } }
  var cor = [], par = []; for (u = 0; u <= 1.0001; u += 0.02) { cor.push([bX(u), bW(u) - bH(u) + 1]); par.push([bX(u), bW(u) - bH(u) - bP(u) * 0.2]); }
  joint += pline(cor) + pline(par); for (u = 0.01; u < 1; u += 0.006 + 0.008 * u) joint += seg(bX(u), bW(u) - bH(u) - bP(u) * 0.25, bX(u), bW(u) - bH(u) - 1);
  lamps = lamps.concat([[bX(0.02), bW(0.02) - bH(0.02) - bP(0.02), 1]]).filter(function (l) { return l[0] > cX + 6; });
  var lampX = lamps.map(function (l) { return l[0]; });
  lamps.forEach(function (l) { var s6 = l[2] * (ph ? 0.8 : S), lx6 = l[0], ly6 = l[1], lh6 = H * (ph ? 0.05 : 0.065) * l[2];
    dark += rect(lx6 - 1.4 * s6, ly6 - lh6, 2.8 * s6, lh6) + rect(lx6 - 4 * s6, ly6 - 4 * s6, 8 * s6, 4 * s6) + france_pg([[lx6 - 5 * s6, ly6 - lh6 - 1], [lx6 + 5 * s6, ly6 - lh6 - 1], [lx6 + 3 * s6, ly6 - lh6 - 11 * s6], [lx6 - 3 * s6, ly6 - lh6 - 11 * s6]]) + france_pg([[lx6 - 4.4 * s6, ly6 - lh6 - 11 * s6], [lx6 + 4.4 * s6, ly6 - lh6 - 11 * s6], [lx6, ly6 - lh6 - 16 * s6]]) + rect(lx6 - 0.8 * s6, ly6 - lh6 - 19 * s6, 1.6 * s6, 4 * s6);
    cream += rect(lx6 - 2.6 * s6, ly6 - lh6 - 9.6 * s6, 5.2 * s6, 7.6 * s6); l[1] = ly6 - lh6 - 6 * s6; l[2] = s6; });
  var tcs = [];
  for (x = -10; x < W + 20; x += (ph ? 22 : 34) * (0.8 + rnd() * 0.4)) { var nearT = Math.abs(x - TX) < T.hw * 1.6, th = (nearT ? H * (ph ? 0.06 : 0.075) : H * (ph ? 0.035 : 0.045)) * (0.8 + rnd() * 0.3), tw = (ph ? 13 : 20) * (nearT ? 1.3 : 1);
    var bl = []; for (j = 0; j < 5; j++) { var a = j / 5 * Math.PI * 2 + rnd(), rr = tw * (0.5 + rnd() * 0.3); bl.push([x + Math.cos(a) * tw * 0.45, hb - th + Math.sin(a) * th * 0.25, rr]); }
    if (x - tw * 0.9 < cw2 || Math.abs(x - xf) < tw * 1.2 || lampX.some(function (lx) { return Math.abs(lx - x) < tw * 1.1; })) continue;
    dark += rect(x - 1.3, hb - th * 0.45, 2.6, th * 0.45);
    bl.forEach(function (b) { lfD += france_c(b[0], b[1], b[2]); lfL += france_c(b[0] - b[2] * 0.22, b[1] - b[2] * 0.28, b[2] * 0.66); tcs.push(b); skyTop(b[0] - b[2] * 0.6, b[0] + b[2] * 0.6, b[1] - b[2] * 0.8); }); }
  // -- the river: reflections of the far bank and the tower, ripples
  var rbl = '', rtw = '', rs = '';
  for (x = -10; x < W; x += 6) { var q = Math.floor(Math.max(0, x) / SKs), dep = Math.min(hb - SK[Math.min(SK.length - 1, q)], (ptop - ry0) * 1.6) * 0.42; if (Math.abs(x + 3 - TX) > T.hw * 0.5) rbl += rect(x, ry0, 6.2, dep * (0.9 + 0.1 * Math.sin(x * 0.3))); }
  for (y = ry0 + 2; y < ptop; y += 4) { var uR = (y - ry0) / (TH * 0.42) + (hb - TB) / TH, hwR = TH * (0.185 * Math.pow(Math.max(0, 1 - uR), 2.4) + 0.011) * (uR < 0.95 ? 1 : 0); if (hwR > 1) rtw += rect(TX - hwR + Math.sin(y * 0.7) * 3, y, hwR * 2 * (0.7 + 0.3 * Math.sin(y * 1.3)), 2.2); }
  spread(0, ry0 + 6, W, ptop - ry0 - 6, ph ? 60 : 90, 12, rnd, 1).forEach(function (c) { if (c.q < 0.6) rs += seg(c.x, c.y, c.x + 8 + c.r * 24, c.y); });
  add(refl, 'd', rbl, C.rbld); add(refl, 'f', rtw, C.rtow); stk(refl, 't', ANIM ? '' : rs, C.shine, 1.2);
  stone += rect(-10, ptop, W + 20, pbot - ptop);
  stone += rect(-10, ptop - 3, W + 20, 4);
  var occ = france_occ();
  var bxs = ph ? [0.42, 0.62] : [0.3, 0.385, 0.47, 0.555], boxW = (ph ? 46 : 62) * S, boxH = (ph ? 13 : 17) * S, lidH = (ph ? 26 : 34) * S, stalls = [];
  var late = [], lateF = function (k, x, y, w, h) { late.push([k, x, y, w, h]); }, lateS = function (pts) { late.push(['j', pts]); }, lateR = function (x, y, w, h) { lateS([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]); };
  bxs.forEach(function (f, n) { var x0 = W * f, y0 = ptop - 3, ly0 = y0 - boxH - 1, ly1 = ly0 - lidH;
    green += rect(x0, y0 - boxH, boxW, boxH) + rect(x0 - 2, y0 - boxH - 2, boxW + 4, 3) + france_pg([[x0 + 1, ly0], [x0 + boxW - 1, ly0], [x0 + boxW - 4, ly1], [x0 + 4, ly1]]);
    for (var r6 = 0; r6 < 2; r6++) for (var c6 = 0; c6 < 3; c6++) { var pw6 = (boxW - 18) / 3, ph6 = (lidH - 10) / 2 - 2, px6 = x0 + 7 + c6 * (pw6 + 2) + (1 - r6) * 1, py6 = ly1 + 5 + r6 * (ph6 + 2);
      if ((r6 + c6 + n) % 3 === 0) red += rect(px6, py6, pw6, ph6); else if ((r6 + c6 + n) % 3 === 1) blue += rect(px6, py6, pw6, ph6); else { lateR(px6 + 1, py6 + 1, pw6 - 2, ph6 - 2); lateS([[px6 + 2, py6 + ph6 - 2], [px6 + pw6 * 0.5, py6 + ph6 * 0.4], [px6 + pw6 - 2, py6 + ph6 - 2]]); continue; }
      lateF('c', px6 + pw6 * 0.2, py6 + ph6 * 0.2, pw6 * 0.6, ph6 * 0.5); lateS([[px6 + pw6 * 0.25, py6 + ph6 * 0.6], [px6 + pw6 * 0.75, py6 + ph6 * 0.4]]); }
    for (k = 0; k < 8; k++) { var bk = x0 + 3 + k * (boxW - 6) / 8, bkh = boxH * (0.3 + (k * 37 % 5) * 0.07), bkw = (boxW - 6) / 8 - 1; if (k % 3 === 0) red += rect(bk, ly0 - bkh, bkw, bkh); else if (k % 3 === 1) lateF('c', bk, ly0 - bkh, bkw, bkh); else lateF('l', bk, ly0 - bkh, bkw, bkh); }
    lateR(x0 + boxW / 2 - 2, y0 - boxH * 0.66, 4, 4); lateS([[x0 + 2, y0 - boxH * 0.3], [x0 + boxW - 2, y0 - boxH * 0.3]]); lateS([[x0 + boxW * 0.25, y0 - boxH], [x0 + boxW * 0.25, y0]]); lateS([[x0 + boxW * 0.75, y0 - boxH], [x0 + boxW * 0.75, y0]]);
    stalls.push([x0, y0 - boxH, boxW]); });
  var qlx = ph ? [0.88] : [0.255, 0.64], qlamps = [];
  qlx.forEach(function (f) { var lx = W * f, lb = pbot + H * 0.01, lh2 = H * (ph ? 0.16 : 0.2), s2 = ph ? 0.8 : S;
    occ.r.push([lx - 2.4 * s2 - 0.6, lb - lh2, lx + 2.4 * s2 + 0.6, lb], [lx - 6 * s2 - 0.6, lb - 12 * s2 - 0.6, lx + 6 * s2 + 0.6, lb + 0.6], [lx - 4 * s2 - 0.6, lb - lh2 * 0.45 - 0.6, lx + 4 * s2 + 0.6, lb - lh2 * 0.45 + 4 * s2 + 0.6]);
    dark += rect(lx - 2.4 * s2, lb - lh2, 4.8 * s2, lh2) + rect(lx - 6 * s2, lb - 12 * s2, 12 * s2, 12 * s2) + rect(lx - 4 * s2, lb - lh2 * 0.45, 8 * s2, 4 * s2) + rect(lx - 14 * s2, lb - lh2 + 4 * s2, 28 * s2, 2.4 * s2);
    [-1, 1].forEach(function (sg) { var hx = lx + sg * 12 * s2, hy = lb - lh2 - 6 * s2; dark += france_pg([[hx - 5 * s2, hy + 10 * s2], [hx + 5 * s2, hy + 10 * s2], [hx + 6 * s2, hy - 4 * s2], [hx - 6 * s2, hy - 4 * s2]]) + france_pg([[hx - 6.5 * s2, hy - 4 * s2], [hx + 6.5 * s2, hy - 4 * s2], [hx, hy - 11 * s2]]); lateF('g', hx - 4 * s2, hy - 3 * s2, 8 * s2, 12 * s2); qlamps.push([hx, hy + 3 * s2, s2]); });
    dark += france_c(lx, lb - lh2 - 4 * s2, 3 * s2); });
  var cG = H * (ph ? 0.89 : 0.885), cS = H * (ph ? 0.75 : 0.72), cfw = [], fl1 = cS - H * (ph ? 0.035 : 0.045);
  stone += rect(-10, cTop, cw2, H - cTop + 10) + rect(-10, cTop - 8 * S, cw2 + 6, 8 * S); occ.r.push([-20, cTop - 8 * S, cw2 - 10 + 0.5, H * (ph ? 0.89 : 0.885) + 1]);
  cream += rect(-10, cTop - 10 * S, cw2 + 8, 3 * S) + rect(-10, fl1, cw2 + 4, 4 * S) + rect(cX - 8 * S, cTop, 8 * S, fl1 - cTop);
  for (x = -8; x < cX - 2; x += 5 * S) cream += rect(x, cTop - 4.6 * S, 2.6 * S, 2.6 * S);
  joint += seg(-10, cTop, cX, cTop) + seg(-10, cTop + 1.6 * S, cX - 8 * S, cTop + 1.6 * S);
  for (y = cTop + 6 * S; y < fl1; y += 7 * S) joint += seg(cX - 8 * S, y, cX, y);
  for (y = cTop + 12 * S; y < fl1; y += 14 * S) joint += seg(-10, y, cX - 8 * S, y);
  var cbal = fl1 - 1, crail = cbal - H * 0.026;
  for (j = 0; j < 2; j++) { var fwin = cX * 0.24, fx2 = cX * (0.12 + j * 0.46), fy2 = cTop + H * 0.022, fh2 = fl1 - fy2 - H * 0.004;
    cream += rect(fx2 - 3 * S, fy2 - 3 * S, fwin + 6 * S, 3 * S) + rect(fx2 - 3 * S, fy2, 3 * S, fh2) + rect(fx2 + fwin, fy2, 3 * S, fh2) + france_pg([[fx2 - 5 * S, fy2 - 3 * S], [fx2 + fwin / 2, fy2 - 10 * S], [fx2 + fwin + 5 * S, fy2 - 3 * S]]);
    dark += rect(fx2, fy2, fwin, fh2); cfw.push([fx2, fy2, fwin, fh2]);
    cream += rect(fx2 + fwin / 2 - 1, fy2, 2, fh2) + rect(fx2, fy2 + fh2 * 0.32, fwin, 1.6) + rect(fx2, fy2 + fh2 * 0.62, fwin, 1.6);
    cream += france_pg([[fx2, fy2], [fx2 + fwin * 0.3, fy2], [fx2 + fwin * 0.12, fy2 + fh2 * 0.55], [fx2, fy2 + fh2 * 0.6]]) + france_pg([[fx2 + fwin, fy2], [fx2 + fwin * 0.7, fy2], [fx2 + fwin * 0.88, fy2 + fh2 * 0.55], [fx2 + fwin, fy2 + fh2 * 0.6]]);
    joint += seg(fx2 + 2, fy2 + fh2 * 0.1, fx2 + fwin * 0.35, fy2 + 2);
    var wbx = fx2 - 4 * S, wbw = fwin + 8 * S, wby = crail - 2 * S;
    green += rect(wbx, wby, wbw, 7 * S); joint += seg(wbx + 1, wby + 3.5 * S, wbx + wbw - 1, wby + 3.5 * S);
    for (k = 0; k < 7; k++) { var gx3 = wbx + 3 * S + k * (wbw - 6 * S) / 6; lfL += france_c(gx3, wby - 1.5 * S, 3.6 * S); if (k % 2 === 0) lfD += france_e(gx3 + 1.5 * S, wby + 8 * S + (k % 4) * S, 1.8 * S, 4.2 * S + (k % 3) * S);
      if (k % 3 === 1) cream += france_c(gx3, wby - 6.4 * S, 2.3 * S); else red += france_c(gx3 + 0.6 * S, wby - 6.6 * S, 2.6 * S) + france_c(gx3 - 2.4 * S, wby - 4.6 * S, 1.8 * S); } }
  for (x = -8; x < cX - 6; x += 3) iron += seg(x, cbal, x, crail); iron += seg(-10, crail, cX - 6, crail) + seg(-10, cbal - H * 0.014, cX - 6, cbal - H * 0.014);
  var fpS = ph ? 0.9 : S, fpx = cX - 3 * fpS, fpy = cTop + H * (ph ? 0.05 : 0.07), fpL = 62 * fpS, fdx = 0.643, fdy = -0.766, ftx = fpx + fdx * fpL, fty = fpy + fdy * fpL;
  dark += france_band([[fpx, fpy], [ftx, fty]], 2.2 * fpS) + rect(fpx - 3 * fpS, fpy - 5 * fpS, 4 * fpS, 10 * fpS); cream += france_c(ftx + fdx * 2.4 * fpS, fty + fdy * 2.4 * fpS, 2.6 * fpS);
  flags.push({x0: ftx - fdx * 1.5 * fpS, y0: fty - fdy * 1.5 * fpS, x1: ftx - fdx * 33 * fpS, y1: fty - fdy * 33 * fpS, fx: -fdy, fy: fdx, L: 46 * fpS, a: 4 * fpS, big: 1});
  green += rect(-10, fl1 + 4 * S, cw2 + 2, cG - fl1 - 4 * S); var glass = [];
  var sgx = cX * 0.26, sgw = cX * 0.48, sgy = fl1 + H * 0.01, sgh = H * 0.02, lh = sgh * 0.56;
  cream += rect(sgx, sgy, sgw, sgh); iron += france_txt('CAFÉ', sgx + (sgw - france_txtW('CAFÉ', lh)) / 2, sgy + (sgh - lh) / 2 + sgh * 0.06, lh);
  for (j = 0; j < 3; j++) { var gx = cX * (0.04 + j * 0.32), gw2 = cX * 0.27, gy = cS + H * 0.034;
    if (j === 2) { var dw = gw2 * 0.7, dx2 = gx + gw2 * 0.15; dark += rect(dx2, gy - H * 0.004, dw, cG - gy + H * 0.004); glass.push([dx2, gy, dw, (cG - gy) * 0.55]); green += rect(dx2 + 2, gy + (cG - gy) * 0.6, dw - 4, (cG - gy) * 0.4); cream += rect(dx2 + dw - 5 * S, gy + (cG - gy) * 0.5, 3 * S, 2 * S); }
    else { var gh = cG - gy - H * 0.03; dark += rect(gx, gy, gw2, gh); glass.push([gx, gy, gw2, gh]); cream += rect(gx, gy + gh * 0.24, gw2, 1.5) + rect(gx + gw2 / 2 - 0.8, gy, 1.6, gh);
      cream += france_pg([[gx + gw2 * 0.6, gy + gh * 0.3], [gx + gw2 * 0.72, gy + gh * 0.3], [gx + gw2 * 0.86, gy + gh * 0.65], [gx + gw2 * 0.74, gy + gh * 0.65]]);
      var py5 = cG - H * 0.006; green += rect(gx + 2, py5 - 9 * S, gw2 - 4, 9 * S); for (k = 0; k < 5; k++) { var fxp = gx + 6 + k * (gw2 - 12) / 4; lfL += france_c(fxp, py5 - 10.5 * S, 3.4 * S) + france_c(fxp + 3 * S, py5 - 10 * S, 2.6 * S); red += france_c(fxp + 1 * S, py5 - 16.5 * S, 2.6 * S) + france_c(fxp - 2.6 * S, py5 - 15 * S, 2 * S); }
      var cy7 = gy + gh * 0.5; cream += rect(gx + 1, cy7, gw2 - 2, gh * 0.36); for (k = 0; k < 6; k++) cream += france_c(gx + 1 + (k + 0.5) * (gw2 - 2) / 6, cy7, (gw2 - 2) / 12); joint += seg(gx, cy7 - 1, gx + gw2, cy7 - 1); } }
  cream += rect(-10, cG - 2, cw2 + 2, 3);
  var awY0 = cS - H * 0.006, awY1 = cS + H * (ph ? 0.03 : 0.036), awX1 = cX + 12 * S, awn = {x0: -12, x1: awX1, y0: awY0, y1: awY1, n: Math.round((awX1 + 12) / (14 * S)), sl: 3, s: S, c: [C.red, C.cream]};
  if (!ANIM) { var ca = france_awn(awn.x0, awn.x1, awY0, awY1, awn.n, 3, 4 * S / 3); red += ca[0]; cream += ca[1]; }
  var TB2 = ph ? [[0.08, 0.955, 0.8], [0.28, 0.935, 0.75]] : [[0.05, 0.955, 1.05], [0.15, 0.925, 0.92], [0.255, 0.965, 1.05]], tables = [];
  TB2.forEach(function (q, n) { var tx = W * q[0], ty = H * q[1], s3 = q[2] * (ph ? 1 : S), lw = (ph ? 1.1 : 1.4 * S) / 2 + 0.7;
    [-1, 1].forEach(function (sg) { var chx = tx + sg * 24 * s3; occ.r.push([chx - 8 * s3 - 0.6, ty - 19 * s3 - 0.6, chx + 8 * s3 + 0.6, ty - 15 * s3 + 0.6]);
      occ.poly([[chx - 7 * s3 - lw, ty - 18 * s3], [chx - 7 * s3 + sg * 3 * s3 - lw, ty - 36 * s3], [chx, ty - 39 * s3 - lw], [chx + 7 * s3 + sg * 3 * s3 + lw, ty - 36 * s3], [chx + 7 * s3 + lw, ty - 18 * s3]]);
      occ.c.push([chx - 7 * s3, ty - 15 * s3, chx - 8 * s3, ty, lw], [chx + 7 * s3, ty - 15 * s3, chx + 8 * s3, ty, lw]); });
    occ.r.push([tx - 1.6 * s3 - 0.6, ty - 26 * s3, tx + 1.6 * s3 + 0.6, ty], [tx - 10 * s3 - 0.6, ty - 5 * s3, tx + 10 * s3 + 0.6, ty + 0.6], [tx - 15 * s3 - 0.6, ty - 31 * s3, tx + 15 * s3 + 0.6, ty - 23 * s3]);
    [-1, 1].forEach(function (sg) { var chx = tx + sg * 24 * s3; red += rect(chx - 8 * s3, ty - 19 * s3, 16 * s3, 4 * s3); iron += 'M' + PT(chx - 7 * s3, ty - 18 * s3) + ' L' + PT(chx - 7 * s3 + sg * 3 * s3, ty - 36 * s3) + ' Q' + PT(chx, ty - 42 * s3) + ' ' + PT(chx + 7 * s3 + sg * 3 * s3, ty - 36 * s3) + ' L' + PT(chx + 7 * s3, ty - 18 * s3) + ' ' + seg(chx - 7 * s3, ty - 15 * s3, chx - 8 * s3, ty) + seg(chx + 7 * s3, ty - 15 * s3, chx + 8 * s3, ty); red += france_pg([[chx - 6 * s3 + sg * 3 * s3, ty - 34 * s3], [chx + 6 * s3 + sg * 3 * s3, ty - 34 * s3], [chx + 6 * s3 + sg * 1.5 * s3, ty - 22 * s3], [chx - 6 * s3 + sg * 1.5 * s3, ty - 22 * s3]]); });
    dark += rect(tx - 1.6 * s3, ty - 26 * s3, 3.2 * s3, 24 * s3) + france_pg([[tx - 10 * s3, ty], [tx + 10 * s3, ty], [tx + 2 * s3, ty - 5 * s3], [tx - 2 * s3, ty - 5 * s3]]);
    cream += france_e(tx, ty - 27 * s3, 15 * s3, 3.6 * s3); dark += france_e(tx, ty - 25.5 * s3, 14 * s3, 1.6 * s3);
    cream += rect(tx - 7 * s3, ty - 34 * s3, 5 * s3, 5 * s3) + france_e(tx + 6 * s3, ty - 31 * s3, 5 * s3, 1.4 * s3); dark += rect(tx - 6.5 * s3, ty - 34 * s3, 4 * s3, 1.4 * s3);
    if (n % 2 === 0) { green += rect(tx + 3 * s3, ty - 40 * s3, 2.6 * s3, 10 * s3); red += france_c(tx + 4.3 * s3, ty - 41 * s3, 2.6 * s3); }
    tables.push([tx, ty - 31 * s3, s3]); });
  var trees = [], TR = ph ? [[0.94, 0.985, 0.62]] : [[0.655, 0.99, 0.95]];
  TR.forEach(function (q) { var tx = W * q[0], ty = H * q[1], s4 = q[2] * (ph ? 1 : S), tc = [tx - 6 * s4, ty - 176 * s4], R = 96 * s4;
    var trk = [[tx - 9 * s4, ty], [tx - 6 * s4, ty - 70 * s4], [tx - 26 * s4, ty - 140 * s4], [tx - 20 * s4, ty - 142 * s4], [tx - 1 * s4, ty - 96 * s4], [tx + 16 * s4, ty - 150 * s4], [tx + 23 * s4, ty - 147 * s4], [tx + 7 * s4, ty - 76 * s4], [tx + 10 * s4, ty]]; dark += france_pg(trk);
    occ.poly(trk);
    var blobs = []; for (k = 0; k < 13; k++) { var a4 = hash(k * 3 + tx) * Math.PI * 2, d4 = Math.sqrt(hash(k * 5 + 1 + tx)), bx2 = tc[0] + Math.cos(a4) * d4 * R * 0.75, by2 = tc[1] + Math.sin(a4) * d4 * R * 0.58, br = R * (0.34 + hash(k + 7 + tx) * 0.16); blobs.push([bx2, by2, br]); lfD += france_c(bx2, by2, br); }
    blobs.forEach(function (b, n) { for (k = 0; k < 9; k++) { var a5 = k / 9 * Math.PI * 2 + n, lx2 = b[0] + Math.cos(a5) * b[2] * 0.92, ly2 = b[1] + Math.sin(a5) * b[2] * 0.92; lfD += france_palm(lx2, ly2, 12 * s4, a5, 5); if (Math.cos(a5) < 0.3 && Math.sin(a5) < 0.4) lfL += france_palm(b[0] + Math.cos(a5) * b[2] * 0.55 - 4 * s4, b[1] + Math.sin(a5) * b[2] * 0.55 - 4 * s4, 11 * s4, a5 - 0.4, 5); } lfL += france_c(b[0] - b[2] * 0.25, b[1] - b[2] * 0.25, b[2] * 0.42); });
    trees.push({x: tc[0], y: tc[1], R: R, s: s4, blobs: blobs}); });
  var occT = france_occ(); trees.forEach(function (tr) { tr.blobs.forEach(function (b) { occT.g.push([b[0], b[1], b[2] * 0.92 + 6 * tr.s, 0]); }); });
  late.forEach(function (q) { if (q[0] === 'j') { for (var i = 1; i < q[1].length; i++) joint += occT.seg(q[1][i - 1][0], q[1][i - 1][1], q[1][i][0], q[1][i][1]); return; }
    var x = q[1], y = q[2], w = q[3], h = q[4]; if ((q[0] === 'g' ? [[x + w / 2, y + h / 2]] : [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x + w / 2, y + h / 2]]).some(function (p) { return occT.hit(p[0], p[1]); })) return;
    if (q[0] === 'c') cream += rect(x, y, w, h); else lfL += rect(x, y, w, h); });
  // -- the bottom right
  function cart(x0, by, s) { var sw = 150 * s, T0 = by - 40 * s, yc0 = by - 120 * s, yc1 = yc0 + 15 * s, cols = ['red', 'cream', 'blue', 'red', 'lav', 'cream', 'tulip'], n = 0;
    green += rect(x0, T0, sw, 26 * s); cream += rect(x0 - 2 * s, T0 - 2.4 * s, sw + 4 * s, 2.6 * s);
    var m = 0.7; occ.r.push([x0 - 2 * s - m, T0 - 2.4 * s - m, x0 + sw + 2 * s + m, T0 + 26 * s + m], [x0 + sw * 0.5 - 1.5 * s - m, T0 + 26 * s, x0 + sw * 0.5 + 1.5 * s + m, by + m],
      [x0 - 6 * s - m, yc0 - 14 * s - m, x0 + sw + 6 * s + m, yc1 + m], [x0 + 2 * s - m, yc1, x0 + 5 * s + m, T0], [x0 + sw - 5 * s - m, yc1, x0 + sw - 2 * s + m, T0],
      [x0 + sw * 0.5 - 3.4 * s - m, yc1, x0 + sw * 0.5 + 3.4 * s + m, yc1 + 15 * s + m], [x0 + sw - 6.9 * s - m, yc0 - 50 * s, x0 + sw - 5.1 * s + m, yc0 - 14 * s]);
    occ.c.push([x0 + sw - 2 * s, T0 + 9 * s, x0 + sw + 20 * s, T0 + 14 * s, 1.3 * s + m], [x0 + sw + 20 * s, T0 + 14 * s, x0 + sw + 24 * s, T0 + 13 * s, 1.3 * s + m]);
    [x0 + 24 * s, x0 + sw - 30 * s].forEach(function (wx) { occ.g.push([wx, by - 14 * s, 14 * s + m, 11.4 * s - m], [wx, by - 14 * s, 2.6 * s + m, 0]); });
    for (var t2 = 0; t2 < 3; t2++) { var Ty2 = T0 - t2 * 19 * s, tx2 = x0 + (5 + t2 * 11) * s, tw2 = sw - (10 + t2 * 22) * s; occ.r.push([tx2 - 3 * s, Ty2 - 26 * s, tx2 + tw2 + 3 * s, Ty2 + (t2 ? 9 * s : 0)]); }
    var kx0 = x0 - 14 * s; occ.poly([[kx0 - 9 * s, by], [kx0 - 6 * s, by - 32 * s], [kx0 + 6 * s, by - 32 * s], [kx0 + 9 * s, by]]);
    joint += rect(x0 + 6 * s, T0 + 5 * s, sw / 2 - 9 * s, 15 * s) + rect(x0 + sw / 2 + 3 * s, T0 + 5 * s, sw / 2 - 9 * s, 15 * s);
    dark += france_band([[x0 + sw - 2 * s, T0 + 9 * s], [x0 + sw + 20 * s, T0 + 14 * s], [x0 + sw + 24 * s, T0 + 13 * s]], 2.6 * s) + rect(x0 + sw * 0.5 - 1.5 * s, T0 + 26 * s, 3 * s, by - T0 - 26 * s);
    [x0 + 24 * s, x0 + sw - 30 * s].forEach(function (wx) { var wy = by - 14 * s; dark += france_ring(wx, wy, 14 * s, 11.4 * s) + france_c(wx, wy, 2.6 * s); for (var q = 0; q < 6; q++) { var a = q / 6 * Math.PI + 0.3; iron += seg(wx - Math.cos(a) * 11 * s, wy - Math.sin(a) * 11 * s, wx + Math.cos(a) * 11 * s, wy + Math.sin(a) * 11 * s); } });
    for (var t = 0; t < 3; t++) { var Ty = T0 - t * 19 * s, tx0 = x0 + (5 + t * 11) * s, tw = sw - (10 + t * 22) * s;
      if (t) { green += rect(tx0, Ty, tw, 9 * s); cream += rect(tx0 - 1.5 * s, Ty - 1.2 * s, tw + 3 * s, 1.8 * s); }
      var nbk = Math.floor(tw / (15 * s)), gap = tw / nbk;
      for (var b = 0; b < nbk; b++) { var cx = tx0 + gap * (b + 0.5), top = Ty - 10 * s, kind = cols[(n++ * 3 + t) % cols.length];
        stone += france_pg([[cx - 5.6 * s, top], [cx + 5.6 * s, top], [cx + 4.2 * s, Ty], [cx - 4.2 * s, Ty]]); joint += seg(cx - 5 * s, top + 3 * s, cx + 5 * s, top + 3 * s);
        lfD += france_c(cx, top - 2 * s, 5.2 * s); lfL += france_re(cx - 5 * s, top - 4 * s, 4 * s, 1.6 * s, -35) + france_re(cx + 5 * s, top - 4.4 * s, 4 * s, 1.6 * s, 35) + france_c(cx - 1.5 * s, top - 4 * s, 2.4 * s);
        if (kind === 'lav') { for (var q = -2; q <= 2; q++) blue += france_re(cx + q * 2.2 * s, top - 11 * s - Math.abs(q) * -1.2 * s, 1.3 * s, 4.4 * s, q * 9); }
        else if (kind === 'tulip') { for (q = -1; q <= 1; q++) { lfD += rect(cx + q * 3.4 * s - 0.5 * s, top - 13 * s, 1 * s, 8 * s); red += france_e(cx + q * 3.4 * s, top - 14 * s + Math.abs(q) * 2 * s, 2.2 * s, 3 * s); } }
        else { var pts = [[0, -11], [-4, -9], [4, -9], [-2.2, -13.5], [2.4, -13.2], [0, -7.4]];
          pts.forEach(function (p, m) { var px = cx + p[0] * s, py = top + p[1] * s; if (kind === 'red') red += france_c(px, py, 2.7 * s); else if (kind === 'blue') blue += france_c(px, py, 2.9 * s); else cream += france_c(px, py, 2.3 * s); if (kind === 'red' && m % 2) cream += france_c(px - 0.6 * s, py - 0.6 * s, 0.7 * s); }); } } }
    green += rect(x0 + 2 * s, yc1, 3 * s, T0 - yc1) + rect(x0 + sw - 5 * s, yc1, 3 * s, T0 - yc1);
    green += france_pg([[x0 - 6 * s, yc0], [x0 + sw + 6 * s, yc0], [x0 + sw - 4 * s, yc0 - 14 * s], [x0 + 4 * s, yc0 - 14 * s]]);
    var sh = 8 * s, swd = france_txtW('FLEURS', sh * 0.62); cream += rect(x0 + sw / 2 - swd / 2 - 4 * s, yc0 - 12 * s, swd + 8 * s, sh + 1 * s); iron += france_txt('FLEURS', x0 + sw / 2 - swd / 2, yc0 - 12 * s + sh * 0.25, sh * 0.62);
    var pX = x0 + sw - 6 * s, pT = yc0 - 14 * s - 34 * s; dark += rect(pX - 0.9 * s, pT, 1.8 * s, 34 * s); cream += france_c(pX, pT - 1.4 * s, 2 * s);
    flags.push({x0: pX + 0.9 * s, y0: pT + 0.5 * s, x1: pX + 0.9 * s, y1: pT + 15 * s, fx: 1, fy: 0, L: 22 * s, a: 2.3 * s});
    var kx = x0 - 14 * s; green += france_pg([[kx - 9 * s, by], [kx - 6 * s, by - 32 * s], [kx + 6 * s, by - 32 * s], [kx + 9 * s, by]]); dark += france_pg([[kx - 6.4 * s, by - 6 * s], [kx - 4.4 * s, by - 29 * s], [kx + 4.4 * s, by - 29 * s], [kx + 6.4 * s, by - 6 * s]]);
    cream += rect(kx - 3.2 * s, by - 26 * s, 6.4 * s, 1.2 * s); for (q = 0; q < 3; q++) cream += rect(kx - 3.6 * s, by - 21 * s + q * 4.6 * s, 7.2 * s - (q % 2) * 2.4 * s, 0.9 * s); red += france_c(kx + 2.4 * s, by - 9.6 * s, 1.4 * s);
    var lx = x0 + sw * 0.5; dark += rect(lx - 0.5 * s, yc1, 1 * s, 6 * s) + france_pg([[lx - 3.4 * s, yc1 + 6 * s], [lx + 3.4 * s, yc1 + 6 * s], [lx + 2.6 * s, yc1 + 15 * s], [lx - 2.6 * s, yc1 + 15 * s]]); cream += rect(lx - 2 * s, yc1 + 7.6 * s, 4 * s, 5.8 * s); qlamps.push([lx, yc1 + 10.5 * s, s * 0.6]);
    var awS = {x0: x0 - 6 * s, x1: x0 + sw + 6 * s, y0: yc0, y1: yc1, n: 11, sl: 0, s: s * 0.8, c: [C.blue, C.cream]};
    if (!ANIM) { var r = france_awn(awS.x0, awS.x1, yc0, yc1, awS.n, 0, s * 0.8); blue += r[0]; cream += r[1]; }
    return awS; }
  function bike(x, by, s) { var r = 11 * s, w1 = [x - 16 * s, by - r], w2 = [x + 17 * s, by - r], bb = [x - 1 * s, by - r - 1 * s], st = [x - 7 * s, by - r - 19 * s], hd = [x + 10 * s, by - r - 20 * s], m = 0.7;
    [[w1, bb, 2.2], [bb, st, 2.4], [w1, [st[0] + 0.6 * s, st[1] + 3 * s], 1.8], [bb, [x + 4 * s, by - r - 9 * s], 2.6], [[x + 4 * s, by - r - 9 * s], [hd[0] - 1 * s, hd[1] + 5 * s], 2.6], [hd, w2, 2.2],
      [[w1[0] - r * 0.9, w1[1] - r * 0.15], [w1[0] - r * 0.5, w1[1] - r * 0.95], 2], [[w1[0] - r * 0.5, w1[1] - r * 0.95], [w1[0] + r * 0.3, w1[1] - r * 1.15], 2],
      [hd, [hd[0] - 1.5 * s, hd[1] - 6 * s], 1.8], [[hd[0] - 1.5 * s, hd[1] - 6 * s], [hd[0] - 7 * s, hd[1] - 7.5 * s], 1.8], [bb, [bb[0] - 5 * s, by + 0.5 * s], 1.4]].forEach(function (b) { occ.c.push([b[0][0], b[0][1], b[1][0], b[1][1], b[2] * s / 2 + m]); });
    [w1, w2].forEach(function (c) { occ.g.push([c[0], c[1], r + m, r - 2.2 * s - m], [c[0], c[1], 1.5 * s + m, 0]); });
    occ.g.push([bb[0], bb[1], 3.2 * s + m, 0]); occ.r.push([st[0] - 6.4 * s - m, st[1] - 4 * s - m, st[0] + 4.4 * s + m, st[1] + m], [hd[0] + 1.5 * s - m, hd[1] - 15 * s, hd[0] + 20 * s + m, hd[1] + 9 * s + m]);
    blue += france_band([w1, bb], 2.2 * s) + france_band([bb, st], 2.4 * s) + france_band([w1, [st[0] + 0.6 * s, st[1] + 3 * s]], 1.8 * s) + france_band([bb, [x + 4 * s, by - r - 9 * s], [hd[0] - 1 * s, hd[1] + 5 * s]], 2.6 * s) + france_band([hd, w2], 2.2 * s);
    blue += france_band([[w1[0] - r * 0.9, w1[1] - r * 0.15], [w1[0] - r * 0.5, w1[1] - r * 0.95], [w1[0] + r * 0.3, w1[1] - r * 1.15]], 2 * s);
    [w1, w2].forEach(function (c) { dark += france_ring(c[0], c[1], r, r - 2.2 * s) + france_c(c[0], c[1], 1.5 * s); for (var q = 0; q < 8; q++) { var a = q / 8 * Math.PI; joint += seg(c[0] - Math.cos(a) * (r - 2) , c[1] - Math.sin(a) * (r - 2), c[0] + Math.cos(a) * (r - 2), c[1] + Math.sin(a) * (r - 2)); } });
    dark += france_re(st[0] - 1 * s, st[1] - 2 * s, 5.4 * s, 1.9 * s, -4) + france_band([hd, [hd[0] - 1.5 * s, hd[1] - 6 * s], [hd[0] - 7 * s, hd[1] - 7.5 * s]], 1.8 * s) + france_c(bb[0], bb[1], 3.2 * s) + france_band([bb, [bb[0] - 5 * s, by + 0.5 * s]], 1.4 * s) + rect(bb[0] + 2 * s, bb[1] + 2.6 * s, 4 * s, 1.6 * s);
    var kx = hd[0] + 1.5 * s, ky = hd[1] - 1 * s;
    stone += france_band([[kx + 6 * s, ky + 6 * s], [kx + 2 * s, ky - 13 * s]], 3.4 * s) + france_band([[kx + 9 * s, ky + 6 * s], [kx + 7 * s, ky - 11 * s]], 3 * s);
    joint += seg(kx + 2.4 * s, ky - 9 * s, kx + 4.4 * s, ky - 10 * s) + seg(kx + 3 * s, ky - 6 * s, kx + 5 * s, ky - 7 * s) + seg(kx + 6.8 * s, ky - 8 * s, kx + 8.6 * s, ky - 8.6 * s);
    lfL += france_c(kx + 12 * s, ky - 1.5 * s, 3 * s) + france_re(kx + 15 * s, ky - 3 * s, 3.4 * s, 1.4 * s, -30) + france_c(kx + 4.5 * s, ky - 1 * s, 2.4 * s);
    red += france_c(kx + 11 * s, ky - 5 * s, 2.4 * s) + france_c(kx + 14.5 * s, ky - 6.4 * s, 2 * s); blue += france_c(kx + 12.5 * s, ky - 8.4 * s, 1.8 * s);
    cream += france_pg([[kx, ky], [kx + 17 * s, ky], [kx + 15 * s, ky + 10 * s], [kx + 2 * s, ky + 10 * s]]);
    for (var q = 1; q < 4; q++) joint += seg(kx + q * 0.5 * s, ky + q * 2.5 * s, kx + 17 * s - q * 0.5 * s, ky + q * 2.5 * s); for (q = 1; q < 6; q++) joint += seg(kx + q * 2.9 * s, ky, kx + 1.6 * s + q * 2.5 * s, ky + 10 * s); }
  function morris(cx, by, r, h, s) { var bt = by - h, pT = bt + 8 * s, pM = bt + 8 * s + (h - 24 * s) / 2, pB = by - 14 * s;
    occ.r.push([cx - r - 4 * s - 0.7, bt - 14.4 * s - 0.7, cx + r + 4 * s + 0.7, by + 0.7], [cx - r - 1.7 * s, bt - 14 * s - r * 0.95 - 0.7, cx + r + 1.7 * s, bt - 14 * s]);
    dark += rect(cx - r - 4 * s, by - 8 * s, 2 * r + 8 * s, 8 * s) + rect(cx - r - 2 * s, by - 12 * s, 2 * r + 4 * s, 4 * s);
    green += rect(cx - r, bt, 2 * r, h - 10 * s);
    var cl = [cx - r * 0.97, cx - r * 0.58, cx + r * 0.36, cx + r * 0.94];
    [[pT, pM - 1.5 * s], [pM + 1.5 * s, pB]].forEach(function (row, ri) { for (var c = 0; c < 3; c++) { var x0 = cl[c] + 1 * s, x1 = cl[c + 1] - 1 * s, y0 = row[0], y1 = row[1], kind = (c + ri * 2) % 3;
      if (kind === 0) { blue += rect(x0, y0, x1 - x0, y1 - y0); cream += france_c((x0 + x1) / 2, y0 + (y1 - y0) * 0.38, Math.min(x1 - x0, y1 - y0) * 0.24) + rect(x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.72, (x1 - x0) * 0.6, 1.2 * s); }
      else if (kind === 1) { red += rect(x0, y0, x1 - x0, y1 - y0); cream += rect(x0 + (x1 - x0) * 0.15, y0 + (y1 - y0) * 0.15, (x1 - x0) * 0.7, 2.4 * s) + france_c((x0 + x1) / 2, y0 + (y1 - y0) * 0.55, Math.min(x1 - x0, y1 - y0) * 0.18) + rect(x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.82, (x1 - x0) * 0.5, 1.2 * s); }
      else { cream += rect(x0, y0, x1 - x0, y1 - y0); iron += seg(x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.2, x1 - (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.2); for (var q = 0; q < 4; q++) joint += seg(x0 + (x1 - x0) * 0.15, y0 + (y1 - y0) * (0.4 + q * 0.13), x1 - (x1 - x0) * (0.15 + (q % 2) * 0.2), y0 + (y1 - y0) * (0.4 + q * 0.13)); } } });
    dark += rect(cx - r - 2.4 * s, bt - 3 * s, 2 * r + 4.8 * s, 4 * s); green += rect(cx - r - 1 * s, bt - 11 * s, 2 * r + 2 * s, 8 * s);
    for (var m = -2; m <= 2; m++) cream += france_c(cx + m * r * 0.42, bt - 7 * s, 1.6 * s);
    dark += rect(cx - r - 3.6 * s, bt - 14.4 * s, 2 * r + 7.2 * s, 3.6 * s);
    green += france_semi(cx, bt - 14 * s, r + 1 * s, r * 0.95); for (m = 0; m < 6; m++) green += france_e(cx - r + (m + 0.5) * (2 * r + 2 * s) / 6 - 1 * s, bt - 14 * s, (2 * r) / 12, 2.4 * s);
    var dtop = bt - 14 * s - r * 0.95; dark += rect(cx - 1.2 * s, dtop - 7 * s, 2.4 * s, 8 * s) + france_c(cx, dtop - 8 * s, 2.6 * s);
    cream += france_re(cx - r * 0.45, bt - 14 * s - r * 0.5, r * 0.24, r * 0.09, -50) + rect(cx - r * 0.8, pM - 1 * s, 1.4 * s, 2 * s); }
  var awS;
  if (ph) awS = cart(W * 0.41, H * 0.958, 0.62);
  else { awS = cart(W * 0.745, H * 0.972, S); bike(W * 0.585, H * 0.978, S * 1.3); morris(W * 0.948, H * 0.988, 17 * S, H * 0.22, S); }
  joint += occ.seg(-10, ptop + 1, W + 10, ptop + 1) + occ.seg(-10, ptop + (pbot - ptop) * 0.5, W + 10, ptop + (pbot - ptop) * 0.5);
  for (x = -10; x < W + 10; x += 34 * S) joint += occ.seg(x, ptop + 1, x, pbot - 1);
  for (y = pbot + 6, j = 0; y < H + 8; y += 6 + j * 1.2, j++) { var cw = 10 + j * 2.6, ch = -2.2 - j * 0.25;
    for (x = (j % 2) * cw * 0.5 - cw; x < W + cw; x += cw) { var ax = x + 1.4, bx = x + cw - 1.4, mx = x + cw / 2, qp = [], hit = false;
      for (k = 0; k <= 10; k++) { var u = k / 10, qx = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, qy = y + 2 * (1 - u) * u * ch; qp.push([qx, qy]); if (occ.hit(qx, qy)) hit = true; }
      if (!hit) joint += 'M' + PT(ax, y) + ' q' + n1(cw / 2 - 1.4) + ' ' + n1(ch) + ' ' + n1(cw - 2.8) + ' 0 ';
      else { var fine = []; for (k = 0; k <= 24; k++) { u = k / 24; fine.push([(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, y + 2 * (1 - u) * u * ch]); } joint += occ.line(fine); } } }
  if (!ANIM) flags.forEach(function (F) { var d = france_flagD(F, 0.9); blue += d[0]; cream += d[1]; red += d[2]; });
  var boatY = yw - 1, boatS = ph ? 0.56 : S * 0.82;
  if (!ANIM) { var bxB = W * (ph ? 0.62 : 0.6), sB = boatS; dark += france_pg([[bxB - 60 * sB, boatY - 7 * sB], [bxB + 56 * sB, boatY - 7 * sB], [bxB + 66 * sB, boatY - 12 * sB], [bxB + 62 * sB, boatY], [bxB - 56 * sB, boatY]]); cream += rect(bxB - 50 * sB, boatY - 19 * sB, 96 * sB, 12 * sB) + france_pg([[bxB - 52 * sB, boatY - 19 * sB], [bxB + 48 * sB, boatY - 19 * sB], [bxB + 44 * sB, boatY - 23 * sB], [bxB - 48 * sB, boatY - 23 * sB]]); for (j = 0; j < 9; j++) dark += rect(bxB - 46 * sB + j * 10.4 * sB, boatY - 17 * sB, 7.6 * sB, 6.4 * sB); }
  add(near, 'a', N.stone + stone, C.stone); add(near, 'b', N.green + green, C.green); add(near, 'c', N.blue + blue, C.blue); add(near, 'd', N.dark + dark, C.dark); add(near, 'e', N.red + red, C.red); add(near, 'f', N.lfD + lfD, C.lfD); add(near, 'g', N.lfL + lfL, C.lfL); add(near, 'h', N.cream + cream, C.cream);
  stk(near, 's', N.joint + joint, C.joint, 1.1); stk(near, 't', iron, C.dark, ph ? 1.1 : 1.4 * S);
  if (!ANIM) { var blx = W * (ph ? 0.22 : 0.33), bly = H * (ph ? 0.3 : 0.24), blr = ph ? 14 : 18 * S, env = ''; env = france_e(blx, bly, blr, blr * 1.1) + france_pg([[blx - blr * 0.8, bly + blr * 0.6], [blx + blr * 0.8, bly + blr * 0.6], [blx + blr * 0.25, bly + blr * 1.5], [blx - blr * 0.25, bly + blr * 1.5]]); add(refl, 'g', env, dk ? '#A05060' : '#E86A5A'); add(refl, 'g', rect(blx - blr * 0.22, bly + blr * 1.7, blr * 0.44, blr * 0.36)); }
  if (ANIM) { ANIM.C = C; ANIM.T = T; ANIM.TX = TX; ANIM.TB = TB; ANIM.TH = TH; ANIM.hb = hb; ANIM.ry0 = ry0; ANIM.ptop = ptop; ANIM.pbot = pbot; ANIM.yw = yw;
    ANIM.SK = SK; ANIM.SKs = SKs; ANIM.wins = wins; ANIM.lamps = lamps.concat(qlamps); ANIM.awns = [awn, awS]; ANIM.flags = flags; ANIM.tables = tables; ANIM.trees = trees; ANIM.stalls = stalls; ANIM.boat = {y: boatY, s: boatS}; ANIM.cafe = glass.concat(cfw); ANIM.moon = mn; ANIM.S = S; ANIM.tcs = tcs; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
