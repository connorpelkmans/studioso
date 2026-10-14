// ---- world theme: greece (Santorini)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge; greece_hole winds the other way, so inside a clockwise shape of the same slot it cuts a hole.
function greece_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function greece_pg(p) { return p.length < 3 ? '' : poly(greece_area(p) < 0 ? p.slice().reverse() : p); }
function greece_hole(p) { return poly(greece_area(p) > 0 ? p.slice().reverse() : p); }
function greece_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function greece_c(x, y, r) { return greece_e(x, y, r, r); }
// an arched opening: a w-wide rectangle from y to y + h whose top is a half circle
function greece_archPts(x, y, w, h) { var r = w / 2, p = [[x, y + Math.max(h, r)], [x, y + r]]; for (var i = 1; i < 14; i++) { var a = Math.PI + i / 14 * Math.PI; p.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); } p.push([x + w, y + r], [x + w, y + Math.max(h, r)]); return p; }
function greece_arch(x, y, w, h) { return greece_pg(greece_archPts(x, y, w, h)); }
// a dome standing on the line y = by: a half ellipse r wide and r * k tall
function greece_domePts(cx, by, r, k) { var p = []; for (var i = 0; i <= 18; i++) { var a = Math.PI + i / 18 * Math.PI; p.push([cx + Math.cos(a) * r, by + Math.sin(a) * r * k]); } return p; }
// the shaded side of a dome: a crescent on its right, from the top down to the base
function greece_domeShade(cx, by, r, k) { var p = [], i, a; for (i = 0; i <= 9; i++) { a = Math.PI * 1.5 + i / 9 * Math.PI * 0.5; p.push([cx + Math.cos(a) * r, by + Math.sin(a) * r * k]); } for (i = 9; i >= 0; i--) { a = Math.PI * 1.5 + i / 9 * Math.PI * 0.5; p.push([cx + Math.cos(a) * r * 0.42, by + Math.sin(a) * r * k * 0.98]); } return greece_pg(p); }
function greece_rects(list) { var d = ''; list.forEach(function (q) { d += rect(q[0], q[1], q[2], q[3]); }); return d; }
// points of a hanging string from (x0, y0) to (x1, y1) that sags by 'sag' in the middle
function greece_cat(x0, y0, x1, y1, sag, n) { var p = []; for (var i = 0; i <= n; i++) { var u = i / n; p.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)]); } return p; }
// a bougainvillea mass along a list of points: leafy blobs (green) with clusters of papery bracts (magenta) on top
function greece_bloom(pts, s, rnd, out) { pts.forEach(function (p) { var r = (5 + rnd() * 5) * s; out.leaf += greece_c(p[0], p[1], r) + greece_c(p[0] + r * 0.8, p[1] + r * 0.3, r * 0.7);
  for (var q = 0; q < 3; q++) { if (rnd() < 0.2) continue; var a = rnd() * 6.28, d = rnd() * r * 0.9, fx = p[0] + Math.cos(a) * d, fy = p[1] + Math.sin(a) * d * 0.8, fr = (1.6 + rnd() * 1.4) * s; out.fl += greece_c(fx, fy, fr) + greece_c(fx + fr * 1.1, fy + fr * 0.5, fr * 0.85) + greece_c(fx - fr * 0.9, fy + fr * 0.7, fr * 0.8); } }); }
// a terracotta pot with a little plant and its flowers
function greece_pot(x, y, s, out) { out.terra += greece_pg([[x - 7 * s, y - 12 * s], [x + 7 * s, y - 12 * s], [x + 5 * s, y], [x - 5 * s, y]]) + rect(x - 8 * s, y - 14 * s, 16 * s, 3 * s);
  out.leaf += greece_c(x - 4 * s, y - 17 * s, 4.5 * s) + greece_c(x + 3 * s, y - 19 * s, 5 * s) + greece_c(x, y - 23 * s, 4 * s); out.fl += greece_c(x - 3 * s, y - 22 * s, 2.2 * s) + greece_c(x + 4 * s, y - 23 * s, 2.2 * s) + greece_c(x + 1 * s, y - 27 * s, 2 * s); }
// piecewise-linear lookup in a list of points sorted by coordinate a (0 = x, 1 = y), returning coordinate 1 - a
function greece_lin(pts, v, a) { var b = 1 - a, n = pts.length; if (v <= pts[0][a]) return pts[0][b]; if (v >= pts[n - 1][a]) return pts[n - 1][b];
  for (var i = 1; i < n; i++) if (v <= pts[i][a]) { var f = (v - pts[i - 1][a]) / ((pts[i][a] - pts[i - 1][a]) || 1); return pts[i - 1][b] + (pts[i][b] - pts[i - 1][b]) * f; } return pts[n - 1][b]; }
// drop points that sit on the straight line between their neighbours
function greece_simp(p) { var o = []; p.forEach(function (c) { var n = o.length; if (n && Math.abs(o[n - 1][0] - c[0]) < 0.05 && Math.abs(o[n - 1][1] - c[1]) < 0.05) return;
  if (n >= 2) { var A = o[n - 2], B = o[n - 1], L = Math.hypot(c[0] - A[0], c[1] - A[1]); if (L > 0 && Math.abs((B[0] - A[0]) * (c[1] - A[1]) - (B[1] - A[1]) * (c[0] - A[0])) / L < 0.08) { o[n - 1] = c; return; } } o.push(c); }); return o; }
// Occlusion buffer for drawing the village front to back: per column of q px it holds the highest y that something nearer
// already covers. band() clips a shape (top edge tf, bottom edge bf) to what is still in view above that line, put() raises
// the line, vis() tests whether a shape standing on y is completely in view, max() is the lowest such line over a span.
function greece_occ(W, y0, q) {
  var n = Math.ceil((W + 160) / q), a = [], o = {}; for (var i = 0; i < n; i++) a.push(y0);
  function ci(x) { return Math.max(0, Math.min(n - 1, Math.floor((x + 80) / q))); }
  o.at = function (x) { return a[ci(x)]; };
  o.min = function (x0, x1) { var i0 = ci(x0 + q / 2), i1 = Math.max(i0, ci(x1 - q / 2)), m = 1e9; for (var i = i0; i <= i1; i++) m = Math.min(m, a[i]); return m; };
  o.max = function (x0, x1) { var i0 = ci(x0 + q / 2), i1 = Math.max(i0, ci(x1 - q / 2)), m = -1e9; for (var i = i0; i <= i1; i++) m = Math.max(m, a[i]); return m; };
  o.vis = function (x0, x1, yb) { return o.min(x0, x1) >= yb - 0.6; };
  o.put = function (x0, x1, tf) { for (var i = ci(x0 + q / 2); i <= ci(x1 - q / 2); i++) { var v = tf(i * q - 80 + q / 2); if (v < a[i]) a[i] = v; } };
  o.band = function (x0, x1, tf, bf) {
    if (x1 - x0 < 0.4) return '';
    var xs = [x0], B = [], any = false, k; for (k = ci(x0) + 1; k <= ci(x1); k++) { var xb = k * q - 80; if (xb > x0 + 0.01 && xb < x1 - 0.01) xs.push(xb); } xs.push(x1);
    for (k = 0; k < xs.length - 1; k++) { var xa = xs[k], xc = xs[k + 1], s = a[ci((xa + xc) / 2)], ta = tf(xa), tc = tf(xc), ba = Math.max(ta, Math.min(bf(xa), s)), bc = Math.max(tc, Math.min(bf(xc), s));
      B.push([xa, ba], [xc, bc]); if (ba - ta > 0.35 || bc - tc > 0.35) any = true; }
    if (!any) return '';
    var T = [], m = Math.max(2, Math.ceil((x1 - x0) / 3)); for (k = 0; k <= m; k++) { var xt = x0 + (x1 - x0) * k / m; T.push([xt, tf(xt)]); }
    return greece_pg(greece_simp(T).concat(greece_simp(B.reverse())));
  };
  return o;
}
// a tuft of scrub: three overlapping blobs
function greece_tuft(x, y, r) { return greece_e(x, y, r * 1.3, r * 0.8) + greece_e(x - r * 0.9, y + r * 0.25, r * 0.85, r * 0.6) + greece_e(x + r * 0.9, y + r * 0.2, r * 0.75, r * 0.55); }

// ---------------------------------------------------------------- Santorini
// We stand on a whitewashed terrace in Oia and look over the caldera. On the right the caldera cliff rounds a headland:
// its face is banded in rust, cream pumice and dark lava, ribbed with shaded gullies that fan out into scree, and a mule
// path zig-zags down it to the little harbour of Ammoudi at its foot. The village crowns the cliff: rows of whitewashed
// cave houses (front, shaded side, roof terrace, cast shadow) stacked back to front along the contour, wrapping round the
// headland and out of sight, with blue domes, bell towers, pools, pergolas, bougainvillea and a windmill on the rim.
// Across the caldera: the dark volcano islet, Therasia and the far rim in the haze. In front: a house with a blue door,
// a stairway down to the terrace wall and a blue-domed church with a bell tower. The sun, moon, clouds, glints,
// sailboat, windmill sails, swaying bougainvillea, the cat, the doves, the bells, the window glows and the string lights
// are the engine's.
var greece_C = {
  L: {haze: 'rgba(255,240,222,0.9)', cloud: 'rgba(255,255,255,0.82)', glare: 'rgba(255,250,236,0.5)', sun: '#FFF8E2',
    spk: 'rgba(255,255,255,0.92)', thera: '#9AB3CD', kam: '#6E6676', rock: '#A9654A', band1: '#E2C49E', band2: '#73504B', rshade: 'rgba(64,26,34,0.3)', strata: 'rgba(72,34,30,0.34)', foam: 'rgba(255,255,255,0.8)',
    mwall: '#FCFBF8', past1: '#F4CF92', past2: '#F3B6A6', mshade: 'rgba(58,82,156,0.24)', pool: '#55CFE0', haze2: 'rgba(214,232,248,0.55)', stone: '#D9C3A2', bronze: '#B88A3E', rail: 'rgba(40,52,86,0.55)', wood: '#8A6648',
    wall: '#FCFBF8', nShade: '#C3D0E2', blue: '#2F6DB8', leaf: '#3F8A4C', fl: '#DA338A', terra: '#C6764A', navy: '#1E4C90', win: '#2E4468', line: 'rgba(80,104,140,0.38)', wire: 'rgba(70,60,60,0.5)'},
  D: {haze: 'rgba(196,104,148,0.42)', cloud: 'rgba(150,140,200,0.35)', glare: 'rgba(200,210,255,0.2)', sun: '#FFF4D8',
    spk: 'rgba(255,196,110,0.92)', thera: '#2C2E5A', kam: '#1C1E3E', rock: '#3E3152', band1: '#5A4C6E', band2: '#231B35', rshade: 'rgba(6,4,22,0.36)', strata: 'rgba(4,2,16,0.4)', foam: 'rgba(210,220,255,0.4)',
    mwall: '#5A6192', past1: '#6E5F7C', past2: '#6A5276', mshade: 'rgba(8,8,36,0.4)', pool: '#2F8CB4', haze2: 'rgba(30,34,80,0.45)', stone: '#4A4262', bronze: '#A07A3A', rail: 'rgba(10,10,30,0.6)', wood: '#3A2A2A',
    wall: '#565D8E', nShade: '#40467A', blue: '#3450A0', leaf: '#2A5440', fl: '#A23578', terra: '#7C4C3E', navy: '#202F66', win: '#FFC870', line: 'rgba(20,20,50,0.4)', wire: 'rgba(20,16,30,0.6)'}
};
SCENES.greece = function (W, H, dk, rnd) {
  var ph = H > W, C = greece_C[dk ? 'D' : 'L'], i, j, k, x, y, v, r;
  var far = Lay(14), bg = Lay(0), mid = Lay(0), near = Lay(0);
  var u = ph ? 0.72 : Math.max(0.62, Math.min(1.1, H / 820)), S = u, hz = H * (ph ? 0.4 : 0.46), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#0E1838 0%,#1D2A5A ' + Math.round(p1 * 0.62) + '%,#6A3E62 ' + p1 + '%,#0E1838 100%)' : 'linear-gradient(180deg,#8EC9F0 0%,#D8EEFA ' + Math.round(p1 * 0.62) + '%,#FFF2DC ' + p1 + '%,#FFF2DC 100%)';
  var sea = dk ? 'linear-gradient(180deg,#3A3C70 0%,#1E2858 5%,#141E4A 35%,#0B1434 100%)' : 'linear-gradient(180deg,#8CC0E2 0%,#3C88C6 5%,#1B69AC 38%,#0D4E8C 100%)';
  var sun = [W * (ph ? 0.24 : 0.535), H * (ph ? 0.17 : 0.1), (ph ? 22 : 30) * u], moon = [W * (ph ? 0.3 : 0.52), H * (ph ? 0.16 : 0.09), (ph ? 15 : 19) * u], setX = W * 0.27;
  var G = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''}, M = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''}, N = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''};
  var gS = '', gT = '', mRail = '', mWood = '', lines = '', wires = '', wins = [], O = greece_occ(W, H + 60, 2);

  // ---- the lie of the land. The cliff's shoulder Sx(v) is the line where it turns away out of sight. A contour v runs
  // level-ish across the face (tilted up toward the right, where the rim is higher) and curves up and away round the
  // shoulder (a quarter circle of radius Rr seen from above), so rows of houses and strata wrap round the headland.
  var Rr = W * (ph ? 0.34 : 0.2), Dk = Rr * 0.32, thMax = 1.42, gap = (ph ? 25 : 28) * S;
  var vFoot = H * (ph ? 0.77 : 0.85), vTop = H * (ph ? 0.23 : 0.345), vBot = vTop + H * (ph ? 0.34 : 0.25), TL = H * (ph ? 0.1 : 0.22), xA = W * (ph ? 0.3 : 0.45);
  var sxT = W * 0.5, sxF = W * (ph ? 0.15 : 0.35);
  function Sx(v) { var f = Math.max(0, Math.min(1.05, (v - vTop) / (vFoot - vTop))); return sxT + (sxF - sxT) * Math.pow(f, 1.15) + 2.5 * S * Math.sin(v / 19) + 1.5 * S * Math.sin(v / 7 + 1); }
  function xcOf(v) { return Sx(v) + Rr; }
  function ramp(x) { return Math.max(0, Math.min(1, (x - xA) / (W - xA))); }
  function gV(v) { return v <= vBot ? 1 : Math.max(0, (vFoot - v) / (vFoot - vBot)); }
  function thetaAt(v, x) { var q = (xcOf(v) - x) / Rr; return q <= 0 ? 0 : q >= 1 ? Math.PI / 2 : Math.asin(q); }
  function cY(v, x) { var q = Math.min(1, Math.max(0, (xcOf(v) - x) / Rr)); return v - Dk * (1 - Math.sqrt(1 - q * q)) - TL * gV(v) * ramp(x); }
  // a point on contour v at 'p': p < 0 on the face that looks at us, 0 .. pi/2 round the shoulder
  function pX(v, p) { return p < 0 ? xcOf(v) - p * Rr : xcOf(v) - Rr * Math.sin(Math.min(p, 1.57)); }
  var vR = vTop - 3 * S, silP = [];
  for (v = vTop + gap * 0.4; v < vFoot; v += 3) silP.push([Sx(v) - (1 + Math.sin(v / 5.3)) * 1.4 * S, cY(v, Sx(v))]); silP.push([Sx(vFoot), cY(vFoot, Sx(vFoot))]);
  var silR = silP.slice().reverse(), xR0 = silP[0][0];
  function silX(y) { return greece_lin(silP, y, 1); }
  function silY(x) { return greece_lin(silR, x, 0); }
  function ridgeY(x) { return cY(vR, Math.max(x, xR0)) + 1.5 * S * Math.sin(x / 13) + 2 * S * Math.sin(x / 31); }
  function shoreY(x) { return cY(vFoot, x) + 1.2 * S * Math.sin(x / 27); }
  function topAt(x) { return x >= xR0 ? ridgeY(x) : silY(x); }
  function inMassif(x, y) { return x > silX(y) - 2 && y > topAt(x) - 2 && y < shoreY(x) + 3; }
  var vis = O.vis, band = function (x0, x1, t0, t1, b0, b1) { var d = x1 - x0 || 1; return O.band(x0, x1, function (X) { return t0 + (t1 - t0) * (X - x0) / d; }, function (X) { return b0 + (b1 - b0) * (X - x0) / d; }); };

  // ---- sky: a warm haze on the horizon, soft clouds by day, the glare of the sun (or moon) on the water
  add(far, 'a', greece_e(W * 0.3, hz, W * 0.62, H * 0.07), C.haze);
  if (!dk) { var cl = ''; spread(0, H * 0.04, W, H * 0.22, ph ? 200 : 320, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - sun[0], c.y - sun[1]) > sun[2] * 3) cl += greece_e(c.x, c.y, (60 + c.r * 70) * u, (8 + c.k * 5) * u) + greece_e(c.x + 30 * u, c.y - 7 * u, 38 * u, 8 * u); }); add(far, 'b', cl, C.cloud); }
  var lit = dk ? moon : sun; add(far, 'c', greece_e(lit[0], hz + H * 0.08, W * (dk ? 0.06 : 0.12), H * 0.1), C.glare);

  // ---- across the caldera: Therasia's cliffs with its village along the top, the far rim (Fira) in the haze, the volcano
  var tx1 = W * (ph ? 0.2 : 0.21), tH = H * (ph ? 0.032 : 0.036), thP = [];
  for (x = -30; x <= tx1; x += 5) thP.push([x, hz - tH * Math.pow(Math.min(1, (tx1 - x) / (W * 0.08)), 0.7) * (1 + 0.08 * Math.sin(x / 23) + 0.05 * Math.sin(x / 7))]);
  G.b += greece_pg(thP.concat([[tx1 + 4, hz + 1], [-30, hz + 1]]));
  for (k = 0; k < thP.length - 2; k += 2) { var ta = thP[k], tb = thP[k + 1]; if (rnd() < 0.22) G.g += greece_pg([[ta[0], ta[1] + 2], [tb[0] - 2, tb[1] + 2], [tb[0] + 2 * u, hz + 1], [ta[0] + 1.5 * u, hz + 1]]); if (ta[0] > W * 0.02 && ta[0] < tx1 - W * 0.04 && rnd() < 0.5) G.a += rect(ta[0], ta[1] - 1.2 * u, 2.4 * u, 1.8 * u); }
  var fr0 = W * (ph ? 0.34 : 0.33), fr1 = silX(hz) + 30, frH = H * 0.017, frP = [];
  if (fr1 - fr0 > 30) { for (x = fr0; x <= fr1; x += 5) frP.push([x, hz - frH * Math.min(1, (x - fr0) / (W * 0.04)) * (1 + 0.1 * Math.sin(x / 17))]);
    G.b += greece_pg(frP.concat([[fr1, hz + 1], [fr0, hz + 1]])); frP.forEach(function (p, q) { if (q % 2 && p[0] > fr0 + W * 0.03 && rnd() < 0.6) G.a += rect(p[0], p[1] - 1, 1.8 * u, 1.3 * u); }); M.f += greece_pg(frP.concat([[fr1, hz + 1], [fr0, hz + 1]])); }
  function islTop(x) { var t = hz; if (x < tx1) t = Math.min(t, greece_lin(thP, x, 0)); if (frP.length && x > fr0 && x < fr1) t = Math.min(t, greece_lin(frP, x, 0)); return t; }
  var kx0 = W * (ph ? 0.03 : 0.05), kx1 = W * (ph ? 0.3 : 0.22), ky = hz + H * (ph ? 0.04 : 0.05), kh = H * (ph ? 0.02 : 0.024), kp = [];
  for (i = 0; i <= 30; i++) { var ku = i / 30; kp.push([kx0 + (kx1 - kx0) * ku, ky - kh * Math.pow(Math.sin(Math.PI * ku), 0.6) * (1 + 0.22 * Math.sin(ku * 17) + 0.12 * Math.sin(ku * 41))]); }
  G.c += greece_pg(kp.concat([[kx1, ky + 1], [kx0, ky + 1]]));
  G.g += greece_pg(kp.slice(14).concat([[kx1, ky + 1], [kx0 + (kx1 - kx0) * 0.55, ky + 1]]));
  gS += seg(kx0 + 4, ky + 2, kx1 - 4, ky + 2);

  // ---- the caldera cliff: rust rock banded with cream pumice and dark lava along the contours, so the strata wrap round
  var mass = [];
  for (x = xR0; x <= W + 30; x += 6) mass.push([x, ridgeY(x)]);
  for (x = W + 30; x >= Sx(vFoot); x -= 6) mass.push([x, shoreY(x)]);
  for (k = silP.length - 1; k >= 0; k--) mass.push(silP[k]);
  G.d += greece_pg(mass);
  var fv = function (f) { return vBot + f * (vFoot - vBot); };
  function strat(f0, f1, ph0, pinch) { var v0 = fv(f0), v1 = fv(f1), A = [], B = [], th0 = v1 - v0, x0 = Math.min(Sx(v0), Sx(v1));
    for (x = x0; x <= W + 30; x += 5) { var c = Math.sin(x / 61 + ph0) * 4 * S + Math.sin(x / 19 + ph0 * 2) * 1.5 * S, k2 = pinch ? Math.max(0, 0.55 + 0.6 * Math.sin(x / 83 + ph0 * 3) + 0.25 * Math.sin(x / 29 + ph0)) : 1,
      ya = Math.min(shoreY(x) - 1, cY(v0, x) + c), yb = Math.min(shoreY(x) - 1, Math.max(ya, cY(v0 + th0 * Math.min(1.3, k2), x) + c + Math.sin(x / 11 + ph0) * 0.8 * S)); A.push([x, ya]); B.unshift([x, yb]); }
    return greece_pg(A.concat(B)); }
  G.e += strat(0.1, 0.22, 0, true) + strat(0.36, 0.4, 2, true) + strat(0.62, 0.66, 4, true) + strat(0.71, 0.73, 7, true);
  G.f += strat(0.27, 0.3, 1, true) + strat(0.47, 0.55, 3, true) + strat(0.79, 0.87, 5, true) + strat(0.97, 1.02, 8);
  // the village throws a soft shadow down the rock right under it
  G.g += strat(-0.05, 0.05, 6);
  // gullies: shaded clefts running down the face, narrow under the village and widening below, ending in scree fans;
  // round the shoulder they crowd together as the face turns away
  var pMin = -(W + 30 - xcOf(vFoot)) / Rr, p, gi = 0;
  for (p = pMin + 0.05; p < 1.32; p += ((ph ? 34 : 54) * S / Rr) * (0.7 + rnd() * 0.6)) { gi++;
    var L = [], R2 = [], wd = (ph ? 9 : 15) * S / Rr * (0.6 + rnd() * 0.8), vg0 = fv(-0.02 + rnd() * 0.08), wq = rnd() * 6;
    for (k = 0; k <= 12; k++) { var t = k / 12, vv = vg0 + (vFoot - vg0) * t, pc = p + 0.03 * Math.sin(t * 5 + wq), wv = wd * (0.25 + t * 1.1);
      var xl = pX(vv, pc), xr = pX(vv, pc - wv); L.push([xl, Math.min(shoreY(xl) - 0.5, cY(vv, xl))]); R2.unshift([xr, Math.min(shoreY(xr) - 0.5, cY(vv, xr))]); }
    G.g += greece_pg(L.concat(R2));
    if (rnd() < 0.7) { var va = fv(0.88), xa0 = pX(va, p - wd * 0.5), xb0 = pX(vFoot, p + wd * 0.9), xb1 = pX(vFoot, p - wd * 2.2);
      G.e += greece_pg([[xa0, cY(va, xa0)], [xb1, shoreY(xb1) - 0.5], [xb0, shoreY(xb0) - 0.5]]); } }
  // ledges along the strata, and a few shelves of cream rock catching the light
  for (i = 0; i < (ph ? 26 : 44); i++) { var vl = fv(0.08 + rnd() * 0.8), pl = pMin + rnd() * (1.3 - pMin), dl = (0.15 + rnd() * 0.3) * (ph ? 0.6 : 1), lp = [];
    for (k = 0; k <= 6; k++) { var xx0 = pX(vl, pl - dl * k / 6); lp.push([xx0, cY(vl, xx0) + Math.sin(k * 1.7 + i) * 0.8 * S]); }
    gT += pline(lp); }
  // boulders and foam where the rock meets the sea, left of the harbour
  var xq0 = Math.max(xcOf(vFoot) - Rr * 0.15, W * (ph ? 0.5 : 0.6)), qh = 6 * S, rocks = 0;
  function boulder(bx, by, r) { var bp = []; for (i = 0; i < 9; i++) { var a = i / 9 * 6.283, rr = r * (0.82 + rnd() * 0.3); bp.push([bx + Math.cos(a) * rr, by + Math.sin(a) * rr * (Math.sin(a) > 0 ? 0.35 : 0.72)]); }
    G.f += greece_pg(bp); G.g += greece_pg([[bx + r * 0.1, by - r * 0.1], [bx + r * 0.5, by - r * 0.55], [bx + r * 0.95, by], [bx + r * 0.6, by + r * 0.3], [bx, by + r * 0.3]]);
    gS += 'M' + PT(bx - r * 1.15, by + r * 0.35) + ' Q' + PT(bx, by + r * 0.75) + ' ' + PT(bx + r * 1.15, by + r * 0.35) + ' '; rocks++; }
  for (x = Sx(vFoot) - 6 * S; x < xq0 - 4 * S; x += (6 + rnd() * 10) * S) if (rnd() < 0.8) { var bth = thetaAt(vFoot, x), br = (2.4 + rnd() * 3.6) * S * (1 - 0.4 * (1 - Math.cos(bth))); boulder(x, shoreY(x) + br * 0.15, br); }
  var fl0 = []; for (x = Sx(vFoot); x <= W + 30; x += 8) fl0.push([x, shoreY(x) + 1.6 * S]); gS += pline(fl0);

  // ---- the sea: short glints that lengthen toward us, only on open water
  spread(0, hz + 6, W, H - hz - 6, ph ? 44 : 70, 14, rnd, 1).forEach(function (c) { if (c.q > 0.5) return; var t = (c.y - hz) / (H - hz), len = (8 + t * 34) * u;
    if (inMassif(c.x, c.y) || inMassif(c.x + len, c.y) || c.y < shoreY(c.x + len) + 5 * S && c.x + len > silX(c.y) - 4) return; if (c.x + len > kx0 - 4 && c.x < kx1 + 4 && c.y < ky + 4 && c.y > ky - kh - 4) return; gS += seg(c.x, c.y, c.x + len, c.y); });

  // ---- the foreground terrace: worked out first so that the village behind it knows where it is hidden
  var s = ph ? 0.78 : u, yW = H * (ph ? 0.935 : 0.89), capH = 7 * s;
  var hx1 = W * (ph ? 0.27 : 0.2), hT = H * (ph ? 0.84 : 0.715), hG = H * (ph ? 0.975 : 0.945);
  var sx0 = hx1, sy0 = hT + 22 * s, sx1 = W * (ph ? 0.44 : 0.34);
  var c0 = W * (ph ? 0.52 : 0.4), c1 = W * (ph ? 0.8 : 0.52), cT = H * (ph ? 0.875 : 0.735), dR = (c1 - c0) * 0.3, dCx = (c0 + c1) / 2 - (c1 - c0) * 0.04, dBy = cT - dR * 0.42;
  var tw0 = c1 - 2 * s, twW = W * (ph ? 0.15 : 0.06), tT0 = H * (ph ? 0.8 : 0.615), ex0 = tw0 + twW, eT = H * (ph ? 0.86 : 0.665), wE = ph ? W + 20 : ex0 + W * 0.07;
  O.put(-20, hx1, function () { return hT; }); O.put(hx1 - W * 0.07, hx1, function () { return hT - 18 * s; });
  O.put(sx0, sx1, function (X) { return sy0 + (yW - sy0) * (X - sx0) / (sx1 - sx0) - 2 * s; }); O.put(sx1 - 4 * s, wE, function () { return yW; });
  O.put(c0 - 4 * s, c1 + 4 * s, function () { return cT - 4 * s; }); O.put(dCx - dR * 1.1, dCx + dR * 1.1, function (X) { var q = (X - dCx) / (dR * 1.1); return dBy - dR * 1.06 * Math.sqrt(Math.max(0, 1 - q * q)) - 2; });
  O.put(dCx - 4 * s, dCx + 4 * s, function () { return dBy - dR * 1.06 - 12 * s; }); O.put(tw0, ex0, function () { return tT0 - twW * 0.05; }); O.put(tw0 + twW * 0.25, tw0 + twW * 0.75, function () { return tT0 - twW * 0.24 - 12 * s; });
  if (ph && ex0 < W) O.put(ex0, W + 30, function () { return eT; });
  if (!ph) O.put(wE - 12 * s, wE + 2 * s, function () { return yW - 10 * s; });
  if (!ph) O.put(wE - 11 * s, wE + 1 * s, function () { return yW - 48 * s; });

  // ---- the harbour of Ammoudi at the foot of the cliff: a stone quay with little tavernas and fishing boats
  var boatsAt = [];
  for (x = xq0 + 30 * S; x < W - 10 * S; x += (ph ? 36 : 54) * S * (0.8 + rnd() * 0.5)) { var by0 = shoreY(x) + 7 * S, bl = (ph ? 12 : 17) * S; if (!vis(x - bl - 2 * S, x + bl + 2 * S, by0 + 3 * S)) continue;
    // a caique: white hull with a painted band, a little wheelhouse and its shadow on the water
    G.g += greece_e(x, by0 + 4.2 * S, bl * 0.95, 1.6 * S);
    N.a += greece_pg([[x - bl * 1.08, by0 - 4.6 * S], [x - bl * 0.3, by0 - 3.4 * S], [x + bl * 0.9, by0 - 3.6 * S], [x + bl * 1.1, by0 - 5.6 * S], [x + bl * 0.82, by0 + 3 * S], [x - bl * 0.8, by0 + 3.2 * S]]);
    N[rnd() < 0.6 ? 'c' : 'f'] += greece_pg([[x - bl * 0.98, by0 - 1.6 * S], [x + bl * 0.96, by0 - 2.2 * S], [x + bl * 0.9, by0 - 0.2 * S], [x - bl * 0.92, by0 + 0.4 * S]]);
    N.a += rect(x - bl * 0.35, by0 - 9 * S, bl * 0.55, 5.6 * S); N.g += rect(x - bl * 0.38, by0 - 10 * S, bl * 0.61, 1.6 * S) + rect(x - bl * 0.26, by0 - 7.6 * S, bl * 0.14, 2.2 * S) + rect(x - bl * 0.04, by0 - 7.6 * S, bl * 0.14, 2.2 * S); boatsAt.push(x); O.put(x - bl * 1.1, x + bl * 1.1, function () { return by0 - 10 * S; }); }
  M.g += band(xq0, W + 30, shoreY(xq0) - qh - 4 * S, shoreY(W + 30) - qh - 4 * S, shoreY(xq0) - qh, shoreY(W + 30) - qh);
  M.g += O.band(xq0, W + 30, function (X) { return shoreY(X) - qh; }, function (X) { return shoreY(X) + 0.5; }); M.d += O.band(xq0, W + 30, function (X) { return shoreY(X) - qh; }, function (X) { return shoreY(X) + 0.5; });
  M.g += greece_pg([[xq0 - 6 * S, shoreY(xq0 - 6 * S) + 0.5], [xq0, shoreY(xq0) - qh - 4 * S], [xq0 + 2, shoreY(xq0) + 0.5]]);
  O.put(xq0, W + 30, function (X) { return shoreY(X) - qh - 4 * S; });

  // ---- a house of the village: front face, shaded side face, roof (a flat terrace or a cave house's vault), then windows,
  // shutters, doors, flowers, pools, pergolas, domes and bell towers where they are in view, and the shadow it casts on
  // whatever stands behind it. Houses are drawn front to back, so everything nearer has already claimed its place in O.
  var domes = [], domeR = [], belfries = 0, lastDome = -1e9, footings = [];
  function windowAt(wx, wy, ww, wh, arch) { var sh = arch ? greece_arch(wx, wy, ww, wh) : rect(wx, wy, ww, wh); if (!dk) { N.h += sh; return; } if (rnd() < 0.6) { N.h += sh; wins.push([wx + ww / 2, wy + wh / 2, ww]); } else N.g += sh; }
  function drape(bx, by, len) { for (var q = 0; q < len; q += 3.5 * S) { var px = bx + Math.sin(q * 0.4) * 1.6 * S, py = by + q, rr = (3.6 - q / len * 1.8) * S; if (!vis(px - rr * 1.2, px + rr * 1.2, py + rr)) return;
    N.d += greece_c(px - rr * 0.4, py, rr * 0.9); N.e += greece_c(px + rr * 0.3, py - rr * 0.2, rr * 0.55) + greece_c(px - rr * 0.5, py + rr * 0.35, rr * 0.5); } }
  function house(o) {
    var x = o.x, w = o.w, top = o.top, base = o.base, x1 = x + w, sx = o.sx, sy = o.sy, col = o.col, hgt = base - top, kk = o.k, th = o.th, det = th < 1.12, xr = x1 + sx, q;
    if (O.max(x, xr) < top - sy - 2 * S) return;
    if (o.perch) { var sb1 = base + gap * 0.55 * kk;
      M.a += band(x + 1.5 * S, x1 - 1 * S, base, base, sb1 - 3 * S, sb1); M.d += band(x1 - 3.5 * S, x1 - 1 * S, base, base, sb1, sb1) + band(x + 1.5 * S, x1 - 1 * S, base, base, base + 1.6 * S, base + 1.6 * S);
      if (det && w > 16 * S && vis(x + w * 0.3, x + w * 0.3 + 6 * S * kk, sb1 - 2 * S)) N.g += greece_arch(x + w * 0.3, base + 3 * S * kk, 6 * S * kk, sb1 - base - 5 * S * kk);
      G.g += O.band(x1 - 1 * S, x1 + 8 * S, function (X) { return base + (X - x1) * 0.5; }, function () { return sb1 + 5 * S; });
      // (where its footing meets the rock it throws a shadow, so it sits in the cliff instead of resting on it)
      G.g += greece_pg([[x + 0.5 * S, sb1 - 1], [x1 + 3 * S, sb1 - 1], [x1 + 3 * S, sb1 + 3 * S * kk], [x + 0.5 * S, sb1 + 3.6 * S * kk]]);
      O.put(x + 1.5 * S, x1 - 1 * S, function () { return base; }); if (o.row === 0) footings.push([x, x1, sb1, kk]); }
    var vault = o.roof === 1 && w > 9 * S, cx = x + w / 2, vh = Math.min(w * 0.3, 8 * S * kk);
    var archF = function (X) { var q2 = (X - cx) / (w / 2); return Math.abs(q2) > 1.02 ? 1e9 : top - vh * Math.sqrt(Math.max(0, 1 - q2 * q2)); };
    var sideT = function (X) { return top - sy * Math.max(0, Math.min(1, (X - x1) / sx)); };
    var roofT = vault ? function (X) { var m = 1e9; for (var t = 0; t <= 1.001; t += 0.125) m = Math.min(m, archF(X - t * sx) - t * sy); return Math.min(m, sideT(X) + (X > x1 ? 0 : 1e9)); } : function (X) { return top - sy * Math.min(1, Math.max(0, (X - x) / sx)); };
    var roofB = vault ? function (X) { return X <= x1 ? Math.min(archF(X), top) : sideT(X); } : sideT;
    var front = O.band(x, x1, vault ? function (X) { return Math.min(archF(X), top); } : function () { return top; }, function () { return base; });
    var side = O.band(x1, xr, sideT, function (X) { return base - sy * Math.min(1, (X - x1) / sx); }), roof = O.band(x, xr, roofT, roofB);
    M[col] += front + side + roof; M.d += side;
    if (vault) M.d += O.band(x, x1, function (X) { return Math.min(archF(X), top); }, function (X) { return Math.min(archF(X), top) + 1.3 * S; }) + O.band(x1 - w * 0.12, xr, roofT, roofB);
    else M.d += band(x, x1, top + 0.3 * S, top + 0.3 * S, top + 1.6 * S, top + 1.6 * S);
    if (o.haze) M.f += front + side + roof;
    var roofVis = !vault && vis(x, xr, top + 1), skyTop = vault ? top - vh - sy : top - sy;
    if (det) {
      // the door at the foot of the front: a blue arched door or the dark mouth of a cave house
      var dw = Math.min(6.5 * S * kk, w * 0.3), dh = Math.min(hgt * 0.6, 10.5 * S * kk), dx = x + 1.5 * S + (w - dw - 3 * S) * (0.15 + rnd() * 0.7);
      var hasDoor = w > 11 * S && hgt > 9 * S && vis(dx - 0.5 * S, dx + dw + 0.5 * S, base);
      if (hasDoor) { N[rnd() < 0.62 ? 'c' : 'g'] += greece_arch(dx, base - dh, dw, dh); }
      var fh = 11 * S * kk, ww = 4 * S * kk * Math.max(0.55, o.sq), wh = 5.2 * S * kk, archW = rnd() < 0.5, shut = rnd() < 0.45, nwin = w > 32 * S * kk ? 2 : 1, bal = rnd() < 0.14 && w > 24 * S;
      for (var fl = 0; fl < 4; fl++) { var wy = top + (vault ? 2.4 : 4.2) * S * kk + fl * fh; if (wy + wh > base - 2.5 * S * kk) break;
        for (i = 0; i < nwin; i++) { var wx = x + w * (nwin === 2 ? 0.27 + i * 0.46 : (dx + dw / 2 < cx ? 0.7 : 0.3)) - ww / 2;
          if (hasDoor && wx < dx + dw + 1.5 * S && wx + ww > dx - 1.5 * S && wy + wh > base - dh - 2 * S) continue;
          var pad = shut ? ww * 0.62 : 0.6 * S; if (wx - pad < x + 0.5 || wx + ww + pad > x1 - 0.5 || !vis(wx - pad, wx + ww + pad, wy + wh + 0.6)) continue;
          windowAt(wx, wy, ww, wh, archW); if (shut) N.c += rect(wx - ww * 0.58, wy, ww * 0.5, wh) + rect(wx + ww * 1.08, wy, ww * 0.5, wh); }
        if (bal && fl === 0 && wy + wh + 2.4 * S < base - 1) { var bx0 = x + 2 * S, bx1 = x1 - 2 * S, byb = wy + wh + 1.4 * S; if (vis(bx0 - S, bx1 + S, byb + 1.4 * S)) { mRail += seg(bx0, byb - 3.2 * S, bx1, byb - 3.2 * S); for (var px0 = bx0; px0 <= bx1 + 0.1; px0 += 2.2 * S) mRail += seg(px0, byb - 3.2 * S, px0, byb);
          M.d += band(bx0 - S, bx1 + S, byb, byb, byb + 1.4 * S, byb + 1.4 * S); if (rnd() < 0.7) { N.d += greece_tuft(bx0 + 2 * S, byb - 3 * S, 1.6 * S); N.e += greece_c(bx0 + 1.4 * S, byb - 3.6 * S, 1.2 * S) + greece_c(bx0 + 3.2 * S, byb - 2.8 * S, 1.1 * S); } } } }
      if (vault && w > 14 * S && vis(cx - 2.2 * S * kk, cx + 2.2 * S * kk, top - vh * 0.25)) windowAt(cx - 1.8 * S * kk, top - vh * 0.62, 3.6 * S * kk, 3 * S * kk, true);
      if (rnd() < 0.16) drape(rnd() < 0.5 ? x + 2.5 * S : x1 - 2.5 * S, top + 1.5 * S, Math.min(hgt * 0.7, 22 * S));
    }
    // a cast shadow to the right, on whatever stands behind
    var Ls = Math.min(18 * S * kk, hgt * 0.7); M.d += O.band(xr, xr + Ls, function (X) { return top - sy + (X - xr) * 0.85; }, function () { return base; });
    O.put(x, xr, roofT);
    if (vault) O.put(x, x1, function (X) { return Math.min(archF(X), top); });
    // on the roof terrace: a blue-domed chapel, a bell tower, a plunge pool, a pergola or pots
    if (det && (o.dome || o.bell || roofVis)) {
      var rk = rnd(), P = function (a, b) { return [x + a * w + b * sx, top - b * sy]; };
      if (o.dome) { var dr = Math.min(w * 0.42, 14 * S * kk), dcx = x + w * 0.5 + sx * 0.5, dby = top - sy * 0.5, drh = 3.4 * S * kk;
        M.a += band(dcx - dr * 0.88, dcx + dr * 0.88, dby - drh, dby - drh, dby + 0.5, dby + 0.5); M.d += band(dcx + dr * 0.4, dcx + dr * 0.88, dby - drh, dby - drh, dby + 0.5, dby + 0.5);
        if (vis(dcx - dr, dcx + dr, dby - drh)) { var dt = dby - drh; N.c += greece_pg(greece_domePts(dcx, dt, dr, 1)); N.g += greece_domeShade(dcx, dt, dr, 1) + rect(dcx - dr * 1.02, dt - 0.8 * S, dr * 2.04, 1.4 * S) + rect(dcx - 0.5 * S, dt - dr - 5 * S, 1 * S, 5.2 * S) + rect(dcx - 1.9 * S, dt - dr - 3.8 * S, 3.8 * S, 0.9 * S);
          domes.push([dcx, dt - dr]); domeR.push([dcx, dt, dr]); O.put(dcx - dr, dcx + dr, function (X) { var q3 = (X - dcx) / dr; return dt - dr * Math.sqrt(Math.max(0, 1 - q3 * q3)); }); O.put(dcx - S, dcx + S, function () { return dt - dr - 5 * S; }); skyTop = Math.min(skyTop, dt - dr - 5 * S); } }
      else if (o.bell) { var tw = Math.max(8 * S, Math.min(w * 0.42, 13 * S)) * kk, tx = x + w * 0.1, tH = 22 * S * kk, tt = top - tH, tcx = tx + tw / 2;
        M.a += O.band(tx, tx + tw, function (X) { var q4 = (X - tcx) / (tw / 2); return tt + tw * 0.5 * (1 - Math.sqrt(Math.max(0, 1 - q4 * q4))); }, function () { return top + 0.5; }); M.d += band(tx + tw - 1.4 * S, tx + tw, tt + tw * 0.5, tt + tw * 0.5, top, top);
        if (vis(tx, tx + tw, top)) { N.g += greece_arch(tx + tw * 0.24, tt + tw * 0.32, tw * 0.52, tH * 0.42) + rect(tcx - 0.5 * S, tt - 5 * S, 1 * S, 5.2 * S) + rect(tcx - 1.9 * S, tt - 3.8 * S, 3.8 * S, 0.9 * S); N.f += greece_c(tcx, tt + tw * 0.32 + tH * 0.28, tw * 0.15); }
        O.put(tx, tx + tw, function () { return tt; }); skyTop = Math.min(skyTop, tt - 5 * S); belfries++; }
      else if (!roofVis) rk = 1;
      else if (rk < 0.24 && w > 22 * S && sy > 3 * S && th < 0.8) { M.e += greece_pg([P(0.14, 0.22), P(0.82, 0.22), P(0.82, 0.82), P(0.14, 0.82)]); mRail += seg(P(0.15, 0.78)[0], P(0.15, 0.78)[1], P(0.81, 0.78)[0], P(0.81, 0.78)[1]);
        if (rnd() < 0.6) N.a += rect(P(0.86, 0.3)[0], P(0.86, 0.3)[1] - 1.2 * S, 4 * S * kk, 1.2 * S); }
      else if (rk < 0.38 && w > 20 * S) { var pa0 = x + 3 * S, pa1 = x1 - 3 * S + sx * 0.5, pt = top - sy * 0.3 - 8 * S * kk; if (vis(pa0 - S, pa1 + S, top)) { mWood += seg(pa0, top - 0.3, pa0, pt) + seg(x1 - 3 * S, top - 0.3, x1 - 3 * S, pt) + seg(pa0 - 1.5 * S, pt, pa1 + 1.5 * S, pt);
          for (var vx = pa0; vx < pa1; vx += 4.5 * S) { N.d += greece_e(vx + 2 * S, pt - 0.4 * S, 3 * S, 1.8 * S); if (rnd() < 0.4) N.e += greece_c(vx + 2.6 * S, pt + 0.6 * S, 1.3 * S); }
          O.put(pa0 - 1.5 * S, pa1 + 1.5 * S, function () { return pt - 2.2 * S; }); skyTop = Math.min(skyTop, pt - 2.2 * S); } }
      else if (rk < 0.5) { var ppx = x + w * 0.2 + sx * 0.3, ppy = top - sy * 0.3; if (vis(ppx - 3 * S, ppx + 3 * S, ppy)) { N.f += greece_pg([[ppx - 2 * S, ppy - 3.6 * S], [ppx + 2 * S, ppy - 3.6 * S], [ppx + 1.4 * S, ppy], [ppx - 1.4 * S, ppy]]); N.d += greece_tuft(ppx, ppy - 5 * S, 1.8 * S); if (rnd() < 0.6) N.e += greece_c(ppx + 1 * S, ppy - 6 * S, 1.1 * S); } }
    }
  }
  // a white stairway climbing between two houses
  function stairs(x0, x1, yb) { var top = yb - gap * 1.05; M.a += band(x0, x1, top, top, yb, yb); for (var sy2 = yb - 2.4 * S; sy2 > top + 1; sy2 -= 2.6 * S) M.d += band(x0, x1, sy2, sy2, sy2 + 0.8 * S, sy2 + 0.8 * S);
    M.d += band(x0, x0 + 1.4 * S, top, top, yb, yb); O.put(x0, x1, function () { return top; }); }

  // ---- the mule path: zig-zag stairs from the village down the face to the quay, with a low white wall and lamps
  var pxa = W * (ph ? 0.6 : 0.68), pxb = W * (ph ? 0.88 : 0.8), nLeg = ph ? 7 : 6, legs = [], pathLamps = [];
  for (k = 0; k <= nLeg; k++) { var vk = fv(0.02 + 0.98 * k / nLeg), xk = k % 2 ? pxb : pxa; legs.push([xk, (k === nLeg ? shoreY(xk) - qh - 4 * S : cY(vk, xk))]); }
  // ---- the tavernas on the quay
  for (x = W + 10 - rnd() * 10 * S; x > xq0 + 14 * S;) { var tw2 = (ph ? 16 : 24) * S * (0.8 + rnd() * 0.6), tb = shoreY(x - tw2 / 2) - qh - 3 * S;
    if (rnd() < 0.18) { x -= (6 + rnd() * 10) * S; continue; }
    if (Math.abs(x - tw2 / 2 - pxb) < tw2 / 2 + 5 * S && nLeg % 2) { x = pxb - 8 * S; continue; }
    var dd2 = 6 * S; house({x: x - tw2, w: tw2, top: tb - gap * (0.8 + rnd() * 0.4), base: tb, col: rnd() < 0.2 ? 'b' : 'a', sx: dd2 * 0.8, sy: dd2 * 0.55, roof: rnd() < 0.3 ? 1 : 0, k: 1, sq: 1, th: 0, row: -1});
    x -= tw2 + (rnd() < 0.3 ? 2 * S : 0); }

  // ---- the mule path, drawn after the tavernas so they hide its foot. It is a ledge cut into the cliff: the cut rock face
  // above the paving in shade, the paved way with its steps, the white parapet on the downhill side and the shadow that
  // throws on the rock; at each turn a paved landing ringed by the parapet
  for (k = 0; k < nLeg; k++) { var A0 = legs[k], B0 = legs[k + 1], th2 = 4.6 * S;
    var Lp = A0[0] < B0[0] ? A0 : B0, Rp = A0[0] < B0[0] ? B0 : A0, lpY = function (X) { return Lp[1] + (Rp[1] - Lp[1]) * Math.min(1, Math.max(0, (X - Lp[0]) / (Rp[0] - Lp[0]))); };
    G.g += O.band(Lp[0], Rp[0], function (X) { return lpY(X) - th2 - 4.2 * S; }, function (X) { return lpY(X) - th2 + 0.5; });
    M.g += band(Lp[0], Rp[0], Lp[1] - th2, Rp[1] - th2, Lp[1] - 1.6 * S, Rp[1] - 1.6 * S);
    M.a += band(Lp[0], Rp[0], Lp[1] - 1.8 * S, Rp[1] - 1.8 * S, Lp[1], Rp[1]);
    for (var stx = Lp[0] + 3 * S; stx < Rp[0] - 2 * S; stx += 3.2 * S) { var sty = lpY(stx); if (O.at(stx) > sty) mRail += seg(stx, sty - th2 + 0.6, stx - 0.8 * S, sty - 1.9 * S); }
    G.g += O.band(Lp[0], Rp[0] + 2 * S, lpY, function (X) { return lpY(X) + 3.4 * S; });
    if (vis(B0[0] - th2 * 1.3, B0[0] + th2 * 1.3, B0[1] + th2 * 0.3)) { M.a += greece_e(B0[0], B0[1] - th2 * 0.5, th2 * 1.3, th2 * 0.8); M.g += greece_e(B0[0] + (k % 2 ? -0.5 : 0.5) * S, B0[1] - th2 * 0.62, th2 * 1.0, th2 * 0.55); }
    if (k < nLeg - 1) pathLamps.push([B0[0], B0[1] - th2 - 2.5 * S, 4.5 * S]); }

  // ---- the village, row by row from the front (bottom) up to the rim. Each row runs right to left along its contour; round
  // the shoulder the houses turn (fronts narrowing, sides showing), shrink, fade into the haze and pass out of sight.
  var nR = Math.floor((vBot - vTop) / gap) + 1, vTopRow = vBot - (nR - 1) * gap, mxX = W * (ph ? 0.84 : 0.885), mw = 9.5 * S, mH = 40 * S, millL = 34 * u;
  var mb = cY(vTopRow, mxX), mTop = mb - mH, mill = null, lastCol = '';
  for (r = 0; r < nR; r++) {
    v = vBot - r * gap; var xx = W + 20 - rnd() * 10 * S, topRow = r === nR - 1;
    for (var guard = 0; guard < 400; guard++) {
      var th = thetaAt(v, xx); if (th > thMax || xx < -20) break;
      var kk = 1 - 0.36 * (1 - Math.cos(th)), cs = Math.max(0.16, Math.cos(th)), sn = Math.sin(th);
      if (topRow && !mill && xx <= mxX + mw + 2 * S) {
        // the windmill on the rim: a white tower, a thatched cap, a blue door; the sails are the engine's
        M.a += O.band(mxX - mw, mxX + mw, function (X) { return mTop + Math.abs(X - mxX) * 0.1; }, function () { return mb + 3 * S; }); M.d += band(mxX + mw * 0.35, mxX + mw, mTop, mTop, mb + 3 * S, mb + 3 * S);
        M.h += greece_pg([[mxX - mw - 1.5 * S, mTop + 1], [mxX - mw * 0.55, mTop - 9 * S], [mxX, mTop - 14 * S], [mxX + mw * 0.55, mTop - 9 * S], [mxX + mw + 1.5 * S, mTop + 1]]);
        M.d += greece_pg([[mxX + 1 * S, mTop - 13.5 * S], [mxX + mw * 0.55, mTop - 9 * S], [mxX + mw + 1.5 * S, mTop + 1], [mxX + 2 * S, mTop + 1]]);
        if (vis(mxX - 4 * S, mxX + 4 * S, mb)) { N.c += greece_arch(mxX - 3.6 * S, mb - 12 * S, 7.2 * S, 12 * S); windowAt(mxX - 2.2 * S, mTop + 10 * S, 4.4 * S, 5.4 * S, true); }
        O.put(mxX - mw - 1.5 * S, mxX + mw + 1.5 * S, function (X) { return mTop - 14 * S + Math.abs(X - mxX) * 1.2; });
        mill = {x: mxX, y: mTop - 4 * S, L: millL}; xx = mxX - mw - 3 * S; continue; }
      var gk = rnd();
      if (r > 0 && gk < 0.05 && th < 0.5) { var swd = (7 + rnd() * 4) * S; stairs(xx - swd, xx, cY(v, xx - swd / 2)); xx -= swd; continue; }
      if (gk < 0.08 + 0.14 * th / thMax) { var gw = (5 + rnd() * 12) * S * cs; if (th < 1.1 && rnd() < 0.5 && vis(xx - gw * 0.8, xx - gw * 0.2, cY(v, xx) - 1 * S)) N.d += greece_tuft(xx - gw / 2, cY(v, xx - gw / 2) - 2.5 * S, 2.6 * S * kk); xx -= gw; continue; }
      var w = (ph ? 17 + rnd() * 20 : 22 + rnd() * 30) * S, fw = Math.max(3 * S, w * kk * cs), x0 = xx - fw, bse = cY(v, xx - fw * 0.5) - (r > 0 && rnd() < 0.3 ? rnd() * gap * 0.25 * kk : 0);
      var hh = gap * (1.0 + rnd() * 0.6) * kk; if (rnd() < 0.1) hh = gap * (1.6 + rnd() * 0.4) * kk;
      // (no house whose footing would stand out past the cliff's edge: there is nothing under it there)
      if (x0 < silX(bse + (r === 0 ? gap * 0.6 * kk : 2 * S)) + 2 * S) { xx = x0 - 2 * S; continue; }
      var top = bse - hh; if (r >= nR - 3 && Math.abs(xx - fw / 2 - mxX) < millL + fw / 2 + 2 * S) top = Math.max(top, mb - 8 * S);
      if (bse - top > gap * 0.4 * kk) { var col = rnd() < 0.1 ? 'b' : rnd() < 0.1 ? 'c' : 'a'; if (col !== 'a' && col === lastCol) col = 'a'; lastCol = col;
        var flatRoof = rnd() > 0.28 || th > 0.9, pool = flatRoof && rnd() < 0.3 && th < 0.7, dd = (pool ? 11 + rnd() * 5 : 6 + rnd() * 4) * S * kk, cxH = xx - fw / 2;
        var wantDome = flatRoof && r >= 1 && fw > (ph ? 20 : 24) * S && th < 0.75 && Math.abs(cxH - lastDome) > 70 * S && Math.abs(cxH - mxX) > millL + 20 * S && rnd() < (r >= nR - 4 ? 0.4 : 0.2) * (ph ? 1.6 : 1);
        var wantBell = !wantDome && flatRoof && fw > 20 * S && th < 0.6 && belfries < (ph ? 3 : 6) && Math.abs(cxH - mxX) > millL + 20 * S && rnd() < 0.12;
        if (wantDome) { lastDome = cxH; top = Math.min(top, bse - gap * 1.3 * kk); }
        house({x: x0, w: fw, top: top, base: bse, col: col, sx: dd * 0.8 + w * kk * sn * 0.42, sy: dd * 0.55, roof: flatRoof ? 0 : 1, row: r, k: kk, sq: cs, th: th, haze: th > 0.82, perch: r === 0 || (th > 0.6 && rnd() < 0.25), dome: wantDome, bell: wantBell}); }
      xx = x0 - (rnd() < 0.2 ? (1 + rnd() * 4) * S * cs : 0);
    }
  }
  // the front row stands on a ragged outcrop of darker rock that follows the bottoms of its footings, so the houses are set
  // into the cliff (without it a light stripe of rock ran right under them and they looked balanced on its edge)
  if (footings.length) { var fx0 = Math.min.apply(null, footings.map(function (f) { return f[0]; })), fx1 = Math.max.apply(null, footings.map(function (f) { return f[1]; }));
    var footAt = function (X) { var yb = -1; footings.forEach(function (f) { if (X >= f[0] - 3 * S && X <= f[1] + 3 * S) yb = Math.max(yb, f[2]); }); return yb; };
    var crag = function (X) { return (5 + 4 * Math.abs(Math.sin(X / (9 * S))) + 3 * Math.abs(Math.sin(X / (23 * S) + 1.3))) * S; };
    // (it is on the layer behind the village, so the houses cover its top; it is not clipped by the occlusion line, which
    // already counts everything under the houses as hidden)
    var ocT = [], ocB = []; for (x = fx0 - 6 * S; x <= fx1 + 6 * S; x += 2 * S) { var fa = footAt(x); if (fa < 0) { if (ocT.length > 1) G.f += greece_pg(ocT.concat(ocB.reverse())); ocT = []; ocB = []; continue; } ocT.push([x, fa - 4 * S]); ocB.push([x, fa + crag(x)]); }
    if (ocT.length > 1) G.f += greece_pg(ocT.concat(ocB.reverse())); }
  // the rock of the rim and of the shoulder belongs to the skyline too
  O.put(silP[silP.length - 1][0], W + 30, topAt);
  // lamps on the mule path at night
  if (dk) pathLamps.forEach(function (l) { if (vis(l[0] - 1, l[0] + 1, l[1])) { N.h += greece_c(l[0], l[1], 1.6 * S); wins.push(l); } });

  // ---- the skyline (the rim and everything standing on it, and the islands), for stars and for the engine's sky clip
  var sky0 = [];
  for (x = -40; x <= W + 40; x += 4) sky0.push([x, Math.min(islTop(x), O.at(x))]);
  var skyAt = function (x) { var i2 = Math.max(0, Math.min(sky0.length - 1, Math.round((x + 40) / 4))); return sky0[i2][1]; };
  if (dk) spread(0, 0, W, hz - 8, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.3 && c.y < skyAt(c.x) - 8 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] * 2.2) G.h += greece_c(c.x, c.y, 0.5 + c.r * 0.9); });

  // ---------------------------------------------------------------- the foreground terrace (near)
  var nearWin = [], P2 = {leaf: '', fl: '', terra: ''};
  // the house on the left, with a blue door, blue shutters and a stairway down its right side to the terrace wall
  N.a += rect(-12, hT, hx1 + 12, H - hT + 12) + rect(hx1 - W * 0.07, hT - 18 * s, W * 0.07, 19 * s);
  N.b += rect(hx1 - 8 * s, hT, 8 * s, H - hT + 12) + rect(-12, hT + 3 * s, hx1 - W * 0.07 + 12, 2 * s) + rect(hx1 - 7 * s, hT - 18 * s, 7 * s, 18 * s);
  var dX = W * (ph ? 0.07 : 0.055), dW = 30 * s, dH = 56 * s;
  N.a += rect(dX - 4 * s, hG - dH - 4 * s, dW + 8 * s, dH + 4 * s); N.c += greece_arch(dX, hG - dH, dW, dH); N.g += rect(dX + dW / 2 - 0.8 * s, hG - dH + dW / 2, 1.6 * s, dH - dW / 2) + rect(dX + 3 * s, hG - dH * 0.45, dW - 6 * s, 1.6 * s);
  N.f += rect(dX - 6 * s, hG - 1, dW + 12 * s, 4 * s);
  var wY = hT + (hG - dH - hT) * 0.3;
  [dX + dW + 24 * s, ph ? -99 : dX + dW + 68 * s].forEach(function (wx) { if (wx < 0 || wx + 30 * s > hx1 - 10 * s) return; N.h += rect(wx, wY, 16 * s, 20 * s); nearWin.push([wx + 8 * s, wY + 10 * s, 18 * s]); N.a += rect(wx - 2.5 * s, wY + 20 * s, 21 * s, 3 * s); N.c += rect(wx - 9 * s, wY - 1 * s, 8 * s, 22 * s) + rect(wx + 17 * s, wY - 1 * s, 8 * s, 22 * s);
    lines += seg(wx - 9 * s, wY + 6 * s, wx - 1 * s, wY + 6 * s) + seg(wx - 9 * s, wY + 12 * s, wx - 1 * s, wY + 12 * s) + seg(wx + 17 * s, wY + 6 * s, wx + 25 * s, wY + 6 * s) + seg(wx + 17 * s, wY + 12 * s, wx + 25 * s, wY + 12 * s); });
  // the stairway: steps down from the house to the terrace, with a sloping side wall and pots on the treads (the tread
  // lines stop short of the pots, so no line is drawn across one)
  var ns = ph ? 6 : 8, stp = [[sx0, sy0]], sdx = (sx1 - sx0) / ns, sdy = (yW - sy0) / ns, potQ = [1, 3, 5].filter(function (q) { return q < ns - 1; });
  for (i = 0; i < ns; i++) { stp.push([sx0 + sdx * (i + 1), sy0 + sdy * i], [sx0 + sdx * (i + 1), sy0 + sdy * (i + 1)]); var lx0 = sx0 + sdx * i, lx1 = sx0 + sdx * (i + 1), ly0 = sy0 + sdy * i + 1.5 * s;
    if (potQ.indexOf(i) >= 0) { var pcx = sx0 + sdx * (i + 0.55); lines += seg(lx0, ly0, pcx - 9 * s, ly0) + seg(pcx + 9 * s, ly0, lx1, ly0); } else lines += seg(lx0, ly0, lx1, ly0); }
  stp.push([sx1, H + 12], [sx0, H + 12]); N.a += greece_pg(stp);
  N.b += greece_pg([[sx0, sy0 + 10 * s], [sx1, yW + 10 * s], [sx1, yW + 14 * s], [sx0, sy0 + 14 * s]]);
  potQ.forEach(function (q) { greece_pot(sx0 + sdx * (q + 0.55), sy0 + sdy * q, s * 0.9, P2); });
  // the terrace wall along the bottom, with its rounded cap and a shadow under the cap (on the desktop it ends in a pillar)
  N.a += rrect(sx1 - 4 * s, yW, wE - sx1 + 4 * s, capH, 3 * s) + rect(sx1, yW + capH - 1, wE - sx1, H - yW + 10);
  N.b += rect(sx1, yW + capH - 1, wE - sx1, 3 * s);
  if (!ph) { N.a += rrect(wE - 12 * s, yW - 10 * s, 14 * s, H - yW + 20, 3 * s); N.b += rect(wE - 4 * s, yW - 7 * s, 4 * s, H - yW + 10) + rect(wE - 12 * s, yW - 3 * s, 14 * s, 2 * s); }
  // a blue wooden gate in the wall, flagstone joints on its face and a little painted niche with a candle
  var gX = sx1 + (c0 - sx1) * 0.42 - (ph ? 0 : 8 * s), gW = (ph ? 46 : 40) * s, gTp = yW + capH + 5 * s, cwX0 = c0 - 2 * s, cwX1 = ph ? W + 20 : ex0 + 2 * s;
  for (x = sx1 + 30 * s; x < wE - 14 * s; x += 62 * s) if (Math.abs(x - gX - gW / 2) > gW * 0.7 && (x < cwX0 || x > cwX1)) lines += seg(x, yW + capH + 8 * s, x, H + 4);
  N.c += greece_arch(gX, gTp, gW, H - gTp + 10); for (x = gX + gW / 5; x < gX + gW - 2; x += gW / 5) N.g += rect(x - 0.7 * s, gTp + gW * 0.3, 1.4 * s, H - gTp); N.g += rect(gX + 3 * s, gTp + gW * 0.62, gW - 6 * s, 2 * s);
  N.b += rect(gX - 4 * s, gTp - 3 * s, gW + 8 * s, 3 * s) + greece_rects([[sx1 + 6 * s, H - 26 * s, 34 * s, 2 * s], [gX - 70 * s, H - 18 * s, 50 * s, 2 * s]].filter(function (q) { return q[0] + q[2] < gX - 2 * s && q[0] > sx1; }));
  var nX = gX + gW + (ph ? 18 : 60) * s; if (nX + 20 * s < c0 - 4 * s) { N.g += greece_arch(nX, yW + capH + 14 * s, 18 * s, 24 * s); N.f += rect(nX + 6 * s, yW + capH + 30 * s, 6 * s, 8 * s); N.h += greece_c(nX + 9 * s, yW + capH + 27 * s, 2.4 * s); nearWin.push([nX + 9 * s, yW + capH + 27 * s, 8 * s]); }
  // the church: a white cube with a blue dome on a drum, and a bell tower beside it
  var drT = dBy;
  N.a += rect(c0, cT, c1 - c0, H - cT + 10) + rect(dCx - dR * 1.0, drT, dR * 2.0, cT - drT + 1) + rrect(c0 - 4 * s, cT - 4 * s, c1 - c0 + 8 * s, 6 * s, 2 * s);
  N.b += rect(dCx + dR * 0.55, drT, dR * 0.45, cT - drT) + rect(c0, cT + 2 * s, c1 - c0, 2.5 * s) + rect(c1 - 6 * s, cT + 4.5 * s, 6 * s, H - cT);
  N.c += greece_pg(greece_domePts(dCx, dBy, dR * 1.06, 1.0)); N.g += greece_domeShade(dCx, dBy, dR * 1.06, 1.0) + rect(dCx - dR * 1.08, dBy - 1.5 * s, dR * 2.16, 3 * s);
  N.g += rect(dCx - 0.9 * s, dBy - dR * 1.06 - 12 * s, 1.8 * s, 12.5 * s) + rect(dCx - 4 * s, dBy - dR * 1.06 - 9 * s, 8 * s, 1.8 * s);
  for (i = 0; i < 5; i++) { var wxd = dCx - dR * 0.8 + i * dR * 0.4; N.g += greece_arch(wxd - 2.2 * s, drT + 3 * s, 4.4 * s, cT - drT - 6 * s); }
  var cdW = (c1 - c0) * 0.24, cdX = (c0 + c1) / 2 - cdW / 2 - (c1 - c0) * 0.1;
  // (the terrace wall stands in front of the door's foot; the door's centre line stops there too)
  N.c += greece_arch(cdX, yW - (yW - cT) * 0.72, cdW, (yW - cT) * 0.72 + 2); N.g += rect(cdX + cdW / 2 - 0.8 * s, yW - (yW - cT) * 0.72 + cdW / 2, 1.6 * s, (yW - cT) * 0.72 - cdW / 2);
  N.h += greece_c(cdX + cdW / 2, cT + (yW - cT) * 0.14, 5 * s); nearWin.push([cdX + cdW / 2, cT + (yW - cT) * 0.14, 10 * s]);
  // the bell tower: two arches with the big bells, one small arch on top, a curved crown; the arches are holes, so what
  // lies beyond shows through them
  // (a square body with a ledge on top and the small crowned belfry above it; every opening sits wholly inside the wall)
  var twTop = tT0 + twW * 0.18, by2 = Math.max(tT0 + (cT - tT0) * 0.4, twTop + twW * 0.14), bw2 = twW * 0.3, bh2 = Math.min((cT - tT0) * 0.34, cT - 6 * s - by2);
  N.a += rect(tw0, twTop, twW, H - twTop + 10) + rrect(tw0 - 2.5 * s, twTop - 2.5 * s, twW + 5 * s, 4 * s, 1.5 * s) + rect(tw0 + twW * 0.25, tT0 - twW * 0.05, twW * 0.5, twW * 0.25) + greece_pg(greece_archPts(tw0 + twW * 0.25, tT0 - twW * 0.24, twW * 0.5, twW * 0.3));
  var bells = [[tw0 + twW * 0.1, by2, bw2, bh2], [tw0 + twW * 0.6, by2, bw2, bh2], [tw0 + twW * 0.39, tT0 - twW * 0.13, twW * 0.22, twW * 0.24]];
  bells.forEach(function (b) { N.a += greece_hole(greece_archPts(b[0], b[1], b[2], b[3])); });
  N.b += rect(tw0 + twW * 0.91, twTop + 1.5 * s, twW * 0.09, H - tT0) + rect(tw0, by2 + bh2 + 2 * s, twW, 2.5 * s) + rect(tw0 - 2.5 * s, twTop + 1.5 * s, twW + 5 * s, 1.6 * s) + rect(tw0 + twW * 0.66, tT0 - twW * 0.05, twW * 0.09, twW * 0.23);
  N.g += rect(tw0 + twW / 2 - 0.9 * s, tT0 - twW * 0.24 - 12 * s, 1.8 * s, 12.5 * s) + rect(tw0 + twW / 2 - 4 * s, tT0 - twW * 0.24 - 9 * s, 8 * s, 1.8 * s);
  var bellAt = bells.map(function (b) { return {x: b[0] + b[2] / 2, y: b[1] + b[2] * 0.42, s: b[2] / (24 * s)}; });
  // a house corner beyond the tower (phone), with a blue window
  if (ph && ex0 < W) { N.a += rect(ex0 - 1, eT, W - ex0 + 20, H - eT + 10); N.b += rect(ex0 - 1, eT + 3 * s, W - ex0 + 20, 2 * s); var ewx = ex0 + (W - ex0) * 0.3; if (W - ex0 > 40 * s) { N.h += rect(ewx, eT + 22 * s, 14 * s, 18 * s); N.c += rect(ewx - 7 * s, eT + 21 * s, 6.5 * s, 20 * s) + rect(ewx + 14.5 * s, eT + 21 * s, 6.5 * s, 20 * s); nearWin.push([ewx + 7 * s, eT + 31 * s, 16 * s]); } }
  // bougainvillea: over the left house's roof and down its corner, and spilling over the terrace wall by the church
  var B = {leaf: '', fl: ''}, sprays = [];
  var bl0 = []; for (x = -10; x < hx1 + 8 * s; x += 9 * s) bl0.push([x, hT - 4 * s + Math.sin(x / 17) * 3 * s]);
  for (y = hT; y < hT + (ph ? 40 : 70) * s; y += 9 * s) bl0.push([hx1 - 2 * s + Math.sin(y / 9) * 3 * s, y]);
  var bx2 = c0 - W * (ph ? 0.12 : 0.05), bl2 = []; for (x = bx2; x < c0 + 6 * s; x += 9 * s) bl2.push([x, yW - 4 * s + Math.sin(x / 13) * 2 * s]);
  for (y = yW; y < yW + 30 * s; y += 9 * s) bl2.push([bx2 + W * 0.02 + Math.sin(y / 7) * 4 * s, y + 4 * s]);
  greece_bloom(bl0, s, rnd, B); greece_bloom(bl2, s, rnd, B);
  // the bougainvillea's twisting trunk climbing from its pot to the roof, a wall lantern and a painted plinth
  var trA = [], trB = []; for (y = hG - 8 * s; y >= hT; y -= 6 * s) { var tq = (hG - y) / (hG - hT), tcx2 = dX + dW + 8 * s + Math.sin(y / (14 * s)) * 4 * s + tq * 6 * s, tw3 = (3.4 - tq * 1.6) * s; trA.push([tcx2 - tw3 / 2, y]); trB.unshift([tcx2 + tw3 / 2, y]); }
  N.f += greece_pg(trA.concat(trB));
  var lx = dX - 16 * s, ly = hG - dH - 2 * s; N.g += rect(lx - 0.8 * s, ly - 10 * s, 1.6 * s, 6 * s) + greece_pg([[lx - 5 * s, ly - 4 * s], [lx + 5 * s, ly - 4 * s], [lx + 3.5 * s, ly + 9 * s], [lx - 3.5 * s, ly + 9 * s]]); N.h += rect(lx - 3 * s, ly - 1.5 * s, 6 * s, 8.5 * s); nearWin.push([lx, ly + 3 * s, 10 * s]);
  N.b += rect(-12, hG - 5 * s, dX - 6 * s + 12, 5 * s) + rect(dX + dW + 6 * s, hG - 5 * s, hx1 - dX - dW - 14 * s, 5 * s);
  greece_pot(dX + dW + 7 * s, hG + 2 * s, s * 1.1, P2);
  [[W * 0.03, 0.9], [W * 0.12, 1.1], [hx1 - 4 * s, 1.2]].forEach(function (q) { if (q[0] < hx1) sprays.push({x: q[0], y: hT - 2 * s, len: 34 * s * q[1], s: s}); });
  sprays.push({x: bx2 + W * 0.02, y: yW + 4 * s, len: 44 * s, s: s}, {x: c0 - W * 0.02, y: yW + 2 * s, len: 30 * s, s: s});
  // pots along the terrace wall by the church, and (desktop) on the pillar at its end
  if (!ph) { greece_pot(ex0 + (wE - 12 * s - ex0) * 0.45, yW + 1, s, P2);
    // a lamp post on the pillar at the end of the wall, where the string lights are tied
    N.g += rect(wE - 6 * s, yW - 38 * s, 2 * s, 28 * s) + greece_pg([[wE - 10 * s, yW - 46 * s], [wE + 0 * s, yW - 46 * s], [wE - 1.6 * s, yW - 36 * s], [wE - 8.4 * s, yW - 36 * s]]) + rect(wE - 11 * s, yW - 48 * s, 12 * s, 2.4 * s);
    N.h += rect(wE - 8 * s, yW - 44.5 * s, 6 * s, 7 * s); nearWin.push([wE - 5 * s, yW - 41 * s, 10 * s]); }
  N.d += B.leaf + P2.leaf; N.e += B.fl + P2.fl; N.f += P2.terra;
  // string lights: from the left house's roof to the bell tower, and from the tower on toward the right
  var strings = [greece_cat(hx1 - 6 * s, hT - 16 * s, tw0 + 2 * s, tT0 + twW * 0.5, H * (ph ? 0.03 : 0.06), 40)];
  if (ph && ex0 < W - 20) strings.push(greece_cat(tw0 + twW - 2 * s, tT0 + twW * 0.5, W + 20, eT + 8 * s, H * 0.02, 16));
  if (!ph) strings.push(greece_cat(tw0 + twW - 2 * s, tT0 + twW * 0.5, wE - 6 * s, yW - 34 * s, H * 0.025, 14));
  strings.forEach(function (q) { wires += pline(q); });

  add(bg, 'a', G.a, C.spk); add(bg, 'b', G.b, C.thera); add(bg, 'c', G.c, C.kam); add(bg, 'd', G.d, C.rock); add(bg, 'e', G.e, C.band1); add(bg, 'f', G.f, C.band2); add(bg, 'g', G.g, C.rshade); add(bg, 'h', G.h, C.sun);
  stk(bg, 's', gS, C.foam, 1.2); stk(bg, 't', gT, C.strata, 1.1 * S);
  add(mid, 'a', M.a, C.mwall); add(mid, 'b', M.b, C.past1); add(mid, 'c', M.c, C.past2); add(mid, 'd', M.d, C.mshade); add(mid, 'e', M.e, C.pool); add(mid, 'f', M.f, C.haze2); add(mid, 'g', M.g, C.stone); add(mid, 'h', M.h, C.bronze);
  stk(mid, 's', mRail, C.rail, 0.8); stk(mid, 't', mWood, C.wood, 1.1 * S);
  add(near, 'a', N.a, C.wall); add(near, 'b', N.b, C.nShade); add(near, 'c', N.c, C.blue); add(near, 'd', N.d, C.leaf); add(near, 'e', N.e, C.fl); add(near, 'f', N.f, C.terra); add(near, 'g', N.g, C.navy); add(near, 'h', N.h, C.win);
  stk(near, 's', lines, C.line, 1.2); stk(near, 't', wires, C.wire, 1);

  var bulbs = []; strings.forEach(function (q, si) { for (var b = 2; b < q.length - 1; b += si ? 3 : 2) bulbs.push([q[b][0], q[b][1] + 3, (b + si) % 4]); });
  if (ANIM) {
    ANIM.hz = hz; ANIM.sun = sun; ANIM.moon = moon; ANIM.setX = setX; ANIM.sky = sky0; ANIM.cliff = mass.map(function (q) { return [q[0], Math.max(q[1], hz + 1)]; }); ANIM.C = C; ANIM.u = u; ANIM.s = s;
    ANIM.kam = [kx0, ky - kh, kx1 - kx0, kh + 4]; ANIM.sea = [0, hz + 4, W, yW - hz - 4];
    ANIM.mill = mill || {x: -999, y: -999, L: 0}; ANIM.bells = bellAt; ANIM.tower = [tw0 + twW / 2, tT0 - twW * 0.3, twW];
    ANIM.domes = domes.concat([[dCx, dBy - dR]]); ANIM.domeR = domeR.concat([[dCx, dBy, dR * 1.06]]);
    ANIM.cat = {x0: sx1 + 26 * s, x1: (ph ? W : wE - 14 * s) - 30 * s, y: yW, s: s}; ANIM.sprays = sprays; ANIM.bulbs = bulbs; ANIM.wins = wins; ANIM.nearWins = nearWin;
    ANIM.boat = {y: ph ? H * 0.815 : H * 0.945, s: (ph ? 0.7 : 0.9) * u};
  } else {
    // the still scene: the sun (or moon) where the engine would draw it, and lit bulbs at night
    if (dk) { add(far, 'd', greece_c(moon[0], moon[1], moon[2] * 2.6), 'rgba(220,220,255,0.3)'); add(bg, 'h', greece_c(moon[0], moon[1], moon[2]), C.sun); }
    else { add(far, 'd', greece_c(sun[0], sun[1], sun[2] * 2.6), 'rgba(255,250,230,0.9)'); add(bg, 'h', greece_c(sun[0], sun[1], sun[2]), C.sun); }
    var bd = ''; bulbs.forEach(function (b) { bd += greece_c(b[0], b[1], 2.2 * s); }); add(near, dk ? 'h' : 'a', bd);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near, band: {top: hz, bg: sea}};
};
