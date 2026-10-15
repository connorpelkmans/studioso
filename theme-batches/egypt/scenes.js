// ---- world theme: egypt (Egypt)
// The three pyramids of Giza and the Sphinx at golden hour, above the green ribbon of the Nile: date palms, papyrus, a
// felucca, a mud-brick village edge with a dovecote. Every shape is drawn clockwise (like rect()), so shapes that share a
// layer slot merge instead of punching holes in each other. The helpers that draw palms, papyrus, boats, ibises and
// camels return path strings, so the scene (still) and the engine (Path2D, every frame) draw exactly the same things.
function egypt_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function egypt_pg(p) { return poly(egypt_area(p) < 0 ? p.slice().reverse() : p); }
function egypt_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function egypt_c(x, y, r) { return egypt_e(x, y, r, r); }
function egypt_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return egypt_pg(rotp(p, x, y, ang)); }
function egypt_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function egypt_in(p, x, y) { for (var i = 0, j = p.length - 1, o = false; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) o = !o; return o; }
function egypt_at(P, Q, u) { return [P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u]; }
// a tapering, gently curved band from (x0, y0) to (x1, y1), w0 to w1 wide, bowed sideways by 'bend' (trunks, necks, stems)
function egypt_limb(x0, y0, x1, y1, w0, w1, bend, u0) { var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend, A = [], B = [];
  for (var i = 0; i <= 8; i++) { var u = (u0 || 0) + (1 - (u0 || 0)) * i / 8, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1, w = (w0 + (w1 - w0) * u) / 2; A.push([x + nx * w, y + ny * w]); B.unshift([x - nx * w, y - ny * w]); }
  return egypt_pg(A.concat(B)); }

// A pyramid seen corner-on: apex (x, y), height h, half width hw. The front corner F sits between the left and right base
// corners (fo of hw off centre) and a little lower (dep of h). Both faces are stepped along their outer edges, one step per
// course; cas (Khafre) keeps the smooth casing on the top part. Returns the faces, course lines and block joints.
function egypt_pyr(o, rnd) {
  var A = [o.x, o.y], by = o.y + o.h, L = [o.x - o.hw, by], R = [o.x + o.hw, by], F = [o.x + o.fo * o.hw, by + o.h * o.dep], n = o.n, ut = 1 - (o.top || 0), uc = o.cas ? 1 - o.cas : ut, i, u, u1;
  var at = function (P, u) { return egypt_at(P, A, u); }, us = function (i) { return i / n * ut; };
  var left = [F, L], right = [F], lines = '', joints = '', casL = [], casR = [];
  for (i = 0; i < n && us(i) < uc - 1e-6; i++) { var P = at(L, us(i)), Q = at(L, Math.min(uc, us(i + 1))); left.push([P[0], Q[1]], Q); }
  left.push(at(L, ut), at(F, ut));
  right.push(at(F, ut), at(R, ut));
  var rs = []; for (i = 0; i < n && us(i) < uc - 1e-6; i++) { var P2 = at(R, us(i)), Q2 = at(R, Math.min(uc, us(i + 1))); rs.unshift([P2[0], Q2[1]], P2); }
  right.push(at(R, Math.min(uc, us(n)))); right = right.concat(rs); right.push(R);
  for (i = 1; i < n; i++) { u = us(i); if (u >= uc - 1e-6) break; var a = at(L, u), f = at(F, u), r = at(R, u); lines += seg(a[0], a[1], f[0], f[1]) + seg(f[0], f[1], r[0], r[1]);
    u1 = Math.min(uc, us(i + 1));
    [[L, F], [F, R]].forEach(function (E) { var p0 = at(E[0], u), p1 = at(E[1], u), q0 = at(E[0], u1), q1 = at(E[1], u1), len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), bw = o.bw || 14, m = Math.floor(len / bw), off = rnd() * 0.8;
      for (var k = 1; k < m; k++) { var v = (k + off * (i % 2 ? 0.5 : 0)) / m; if (v >= 0.98) continue; var s0 = egypt_at(p0, p1, v), s1 = egypt_at(q0, q1, v); if (rnd() < 0.85) joints += seg(s0[0], s0[1], s1[0], s1[1]); } }); }
  if (o.cas) { // the smooth casing on the top, with a ragged lower edge where the stones fell away
    var rag = function (P, Q) { var p = []; for (var j = 0; j <= 6; j++) { var v = j / 6, du = (rnd() - 0.4) * o.cas * 0.22; p.push(egypt_at(at(P, uc + du), at(Q, uc + du * 0.6), v)); } return p; };
    casL = [at(L, ut), at(F, ut)].concat(rag(F, L)); casR = [at(F, ut), at(R, ut)].concat(rag(R, F)); }
  return {A: A, L: L, R: R, F: F, by: by, h: o.h, left: egypt_pg(left), right: egypt_pg(right), sil: [L, at(L, ut), at(R, ut), R, F], lines: lines, joints: joints,
    casL: casL.length ? egypt_pg(casL) : '', casR: casR.length ? egypt_pg(casR) : '', at: at};
}

// A date palm crown at (x, y), fronds about s long: an upward fan plus a few drooping ones, each serrated like a row of
// leaflets; sw bends the tips (wind). Returns {back, front, dates, boots} paths.
function egypt_crown(x, y, s, sw, seed) {
  var back = '', front = '', n = 17, i, j;
  for (i = 0; i < n; i++) {
    var h1 = hash(seed + i * 1.37), a = -Math.PI * (0.02 + 0.96 * i / (n - 1)) + (h1 - 0.5) * 0.22, L = s * (0.82 + hash(seed + i * 2.1) * 0.26), droop = 0.5 + hash(seed + i * 3.3) * 0.35 + (Math.abs(Math.cos(a)) * 0.35);
    var ca = Math.cos(a), sa = Math.sin(a), up = [], lo = [], m = 16;
    for (j = 0; j <= m; j++) { var u = j / m, px = x + ca * L * u + sw * L * u * u * 0.35, py = y + sa * L * u + droop * L * u * u,
      tx = ca * L + sw * L * u * 0.7, ty = sa * L + droop * L * 2 * u, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, w = s * 0.07 * Math.sin(Math.PI * Math.min(1, 0.08 + u * 1.02)) * (1 - 0.35 * u), t1 = j % 2 ? 1 : 0.55, t2 = j % 2 ? 0.55 : 1;
      up.push([px + nx * w * t1, py + ny * w * t1]); lo.unshift([px - nx * w * t2, py - ny * w * t2]); }
    var d = egypt_pg(up.concat(lo)) + egypt_limb(x, y, x + ca * L * 0.5 + sw * L * 0.09, y + sa * L * 0.5 + droop * L * 0.25, s * 0.035, s * 0.018, 0);
    if (i % 2) front += d; else back += d;
  }
  var dates = '', boots = '';
  [-1, 1].forEach(function (k) { for (j = 0; j < 7; j++) { var dx = k * s * (0.09 + (j % 3) * 0.03) + sw * s * 0.03, dy = s * (0.1 + Math.floor(j / 3) * 0.045); dates += egypt_c(x + dx, y + dy, s * 0.018); } });
  for (j = 0; j < 5; j++) { var bx = x + (j - 2) * s * 0.05; boots += egypt_pg([[bx - s * 0.035, y + s * 0.02], [bx + s * 0.035, y + s * 0.02], [bx + (j - 2) * s * 0.02, y + s * 0.13]]); }
  return {back: back, front: front, dates: dates, boots: boots};
}
// A papyrus umbel: a burst of thin rays from the top of the stem (x, y), drooping outwards. ang tilts it (degrees).
function egypt_umbel(x, y, s, ang) {
  var d = '', n = 15, r0 = (ang || 0) * Math.PI / 180;
  for (var i = 0; i < n; i++) { var th = -Math.PI * (0.06 + 0.88 * i / (n - 1)) + r0, L = s * (0.85 + 0.25 * hash(i * 7.1 + s)), c = Math.cos(th), sn = Math.sin(th), ex = x + c * L, ey = y + sn * L + L * 0.35 * c * c;
    d += 'M' + PT(x, y) + ' Q' + PT(x + c * L * 0.55, y + sn * L * 0.6) + ' ' + PT(ex, ey) + ' ';
    d += 'M' + PT(ex, ey) + ' L' + PT(ex + c * s * 0.12 - s * 0.05, ey + s * 0.1) + ' M' + PT(ex, ey) + ' L' + PT(ex + c * s * 0.12 + s * 0.05, ey + s * 0.1) + ' '; }
  return d;
}
// A felucca at (x, y) (the waterline, mid hull), hull L long, bow towards dir (1 = right). fill (0..1) bellies the sail.
function egypt_boat(x, y, L, fill, dir) {
  var P = function (pts) { return pts.map(function (p) { return [x + p[0] * L * dir, y + p[1] * L]; }); }, Q = function (p) { return PT(x + p[0] * L * dir, y + p[1] * L); };
  var hull = egypt_pg(P([[-0.5, -0.13], [-0.43, -0.075], [0.28, -0.075], [0.56, -0.19], [0.47, -0.03], [0.3, 0.05], [-0.3, 0.055], [-0.47, -0.01]]));
  var stripe = egypt_pg(P([[-0.44, -0.07], [0.29, -0.07], [0.5, -0.155], [0.48, -0.12], [0.3, -0.04], [-0.42, -0.04]]));
  var T = [0.44, -0.14], Pk = [-0.5, -1.52], K = [-0.36, -0.17], f = 0.25 + 0.75 * fill;
  var lc = [(Pk[0] + K[0]) / 2 - 0.2 * f - 0.04, (Pk[1] + K[1]) / 2 + 0.05], fc = [(K[0] + T[0]) / 2, (K[1] + T[1]) / 2 - 0.02 - 0.05 * (1 - f)];
  var sail = 'M' + Q(T) + ' L' + Q(Pk) + ' Q' + Q(lc) + ' ' + Q(K) + ' Q' + Q(fc) + ' ' + Q(T) + ' Z ';
  if (dir < 0) sail = 'M' + Q(T) + ' Q' + Q(fc) + ' ' + Q(K) + ' Q' + Q(lc) + ' ' + Q(Pk) + ' L' + Q(T) + ' Z ';
  var seams = '';
  [0.3, 0.55, 0.78].forEach(function (u) { var a = egypt_at(T, Pk, u), b = [K[0] + (lc[0] - K[0]) * u * 0.9, K[1] + (Pk[1] - K[1]) * u * 0.62]; seams += 'M' + Q(a) + ' L' + Q(b) + ' '; });
  var spars = 'M' + Q([0.08, -0.08]) + ' L' + Q([0.04, -1.02]) + ' M' + Q([0.5, -0.12]) + ' L' + Q([-0.56, -1.6]) + ' M' + Q([0.04, -1.0]) + ' L' + Q([-0.2, -1.2]) + ' M' + Q([-0.36, -0.17]) + ' L' + Q([-0.47, -0.1]) + ' ';
  return {hull: hull, stripe: stripe, sail: sail, seams: seams, spars: spars};
}
// A sacred ibis wading at (x, y) (its feet), s about its body length, facing dir. dip 0..1 lowers the head to the water;
// step 0..1 moves the legs. Returns {body (white), dark (head, neck, bill, plumes), legs (stroke)}.
function egypt_ibis(x, y, s, dir, dip, step) {
  var X = function (p) { return [x + p[0] * s * dir, y + p[1] * s]; }, body = egypt_pg([[-0.34, -0.58], [-0.2, -0.75], [0.08, -0.78], [0.26, -0.68], [0.3, -0.56], [0.12, -0.44], [-0.18, -0.44], [-0.36, -0.5]].map(X));
  var h = [0.28 + dip * 0.24, -1.02 + dip * 0.86], n0 = X([0.22, -0.66]), hd = X(h), dark = egypt_limb(n0[0], n0[1], hd[0], hd[1], s * 0.1, s * 0.07, s * (0.1 - dip * 0.22) * dir) + egypt_c(hd[0], hd[1], s * 0.065);
  var bt = X([h[0] + 0.2 + dip * 0.02, h[1] + 0.1 + dip * 0.12]), bm = X([h[0] + 0.14, h[1] - 0.01]);
  dark += 'M' + PT(hd[0], hd[1] - s * 0.03) + ' Q' + PT(bm[0], bm[1]) + ' ' + PT(bt[0], bt[1]) + ' Q' + PT(bm[0], bm[1] + s * 0.07) + ' ' + PT(hd[0], hd[1] + s * 0.04) + ' Z ';
  dark += egypt_pg([[-0.3, -0.56], [-0.5, -0.5], [-0.56, -0.42], [-0.44, -0.44], [-0.36, -0.36], [-0.22, -0.46]].map(X));
  var k = Math.sin(step * Math.PI * 2) * 0.08, legs = 'M' + PT.apply(null, X([-0.04, -0.45])) + ' L' + PT.apply(null, X([-0.06 + k, 0])) + ' M' + PT.apply(null, X([0.06, -0.45])) + ' L' + PT.apply(null, X([0.08 - k, 0])) + ' ';
  return {body: body, dark: dark, legs: legs};
}
// a camel walking right at (x, y) (its feet), about s tall, with a pack; ph moves the legs and the head
function egypt_camel(x, y, s, ph) {
  var X = function (p) { return [x + p[0] * s, y + p[1] * s]; }, b = Math.sin(ph * 2) * 0.012;
  var d = egypt_pg([[-0.42, -0.6], [-0.36, -0.74], [-0.18, -0.8], [-0.08, -0.98 + b], [0.08, -0.84], [0.24, -0.76], [0.34, -0.66], [0.42, -0.74], [0.5, -0.92 + b], [0.6, -0.96 + b], [0.66, -0.9 + b], [0.56, -0.86 + b], [0.48, -0.66], [0.38, -0.52], [0.3, -0.46], [-0.36, -0.46]].map(X));
  d += egypt_pg([[-0.26, -0.86], [0.04, -1.06], [0.16, -0.9], [-0.1, -0.78]].map(X));   // the pack on the hump
  d += egypt_pg([[-0.42, -0.6], [-0.48, -0.52], [-0.46, -0.48], [-0.4, -0.54]].map(X));
  [[-0.3, 0], [-0.2, Math.PI], [0.24, Math.PI * 0.5], [0.34, Math.PI * 1.5]].forEach(function (l) { var sw = Math.sin(ph + l[1]) * 0.09, top = X([l[0], -0.5]), ft = X([l[0] + sw, 0]); d += egypt_limb(top[0], top[1], ft[0], ft[1], s * 0.07, s * 0.04, 0); });
  return d;
}

var egypt_CL = {
  L: {haze: 'rgba(255,232,196,0.8)', glow: 'rgba(255,214,150,0.6)', cloud: 'rgba(255,242,228,0.75)', cloudS: 'rgba(250,196,160,0.5)',
    dune1: '#F3D3A6', dune2: '#ECC18E', fShade: '#CB9067', fLit: '#F2C580', cas: '#F9E4BC', casS: '#DFB48C', sun: '#FFF4D6', fLine: 'rgba(130,72,30,0.24)', dRip: 'rgba(255,246,226,0.55)',
    sand: '#E9B87C', shade: '#C4875C', lit: '#F1BD76', shadow: 'rgba(150,80,35,0.2)', green: '#7E9E52', nile: '#7FB3BF', dark: '#6A4630', shine: 'rgba(255,246,222,0.72)', line: 'rgba(110,58,24,0.3)', ripple: 'rgba(255,255,255,0.55)',
    bank: '#8EA457', wall: '#E7B47E', wallS: '#C98F60', trunk: '#8C6440', leaf: '#5F8B43', door: '#6B4630', win: '#7A4E36', white: '#F7EDDA', blade: 'rgba(62,98,38,0.8)', stick: '#7A5236'},
  D: {haze: 'rgba(140,90,150,0.35)', glow: 'rgba(220,220,255,0.25)', mw: 'rgba(196,188,255,0.17)', mwCore: 'rgba(255,236,226,0.2)', mwDust: 'rgba(12,14,44,0.35)',
    dune1: '#3E3262', dune2: '#372C5A', fShade: '#2B2450', fLit: '#5E5590', cas: '#857CB0', casS: '#4A4278', sun: '#F6F0DA', star: 'rgba(255,248,232,0.9)', fLine: 'rgba(10,6,30,0.35)', dRip: 'rgba(170,160,220,0.25)',
    sand: '#413566', shade: '#2A234E', lit: '#5D5490', shadow: 'rgba(10,6,30,0.32)', green: '#25403C', nile: '#1E2B5A', dark: '#150F26', shine: 'rgba(255,238,200,0.45)', line: 'rgba(8,4,24,0.42)', ripple: 'rgba(190,200,255,0.35)',
    bank: '#25332D', wall: '#5E4E74', wallS: '#3E3258', trunk: '#30232F', leaf: '#21402C', door: '#1A1222', win: '#FFC468', white: '#9088B0', blade: 'rgba(90,130,100,0.6)', stick: '#3E2C3A'}
};

SCENES.egypt = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(0.6), mid = Lay(0), near = Lay(0), C = egypt_CL[dk ? 'D' : 'L'], i, j, x, y;
  var sky = dk ? 'linear-gradient(180deg,#0C1232 0%,#1E2050 46%,#4E3260 78%,#62406A 100%)' : 'linear-gradient(180deg,#9CCBEA 0%,#C9DEE2 26%,#F4E6C6 50%,#F6C98A 72%,#F2B67C 100%)';
  var hz = H * (ph ? 0.6 : 0.625), fy = H * (ph ? 0.7 : 0.715), ry = H * (ph ? 0.735 : 0.75), by = H * (ph ? 0.862 : 0.875), U = ph ? H / 760 : H / 820;
  // ---- the pyramids: Khufu in front (mid layer), Khafre with its casing and Menkaure with three queens' pyramids behind (bg)
  var kh = H * (ph ? 0.2 : 0.3), ku = egypt_pyr({x: W * (ph ? 0.71 : 0.78), y: hz + H * 0.012 - kh, h: kh, hw: kh * 0.92, fo: -0.22, dep: 0.07, n: ph ? 26 : 36, top: 0.012, bw: 15 * U}, rnd);
  var fh = H * (ph ? 0.175 : 0.27), fa = egypt_pyr({x: W * (ph ? 0.4 : 0.585), y: hz - H * 0.008 - fh, h: fh, hw: fh * 0.92, fo: -0.2, dep: 0.06, n: ph ? 22 : 32, cas: 0.2, bw: 13 * U}, rnd);
  var mh = H * (ph ? 0.08 : 0.13), mx = fa.L[0] - H * 0.02 - mh * 0.92, me = egypt_pyr({x: mx, y: hz - H * 0.004 - mh, h: mh, hw: mh * 0.92, fo: -0.18, dep: 0.06, n: ph ? 12 : 18, top: 0.02, bw: 11 * U}, rnd);
  var queens = [], qx = me.L[0] - H * 0.012; for (i = 0; i < 3; i++) { var qh = H * (ph ? 0.028 : 0.042) * (1 - i * 0.08); qx -= qh * 0.95; queens.push(egypt_pyr({x: qx, y: hz + H * 0.002 - qh, h: qh, hw: qh * 0.95, fo: -0.15, dep: 0.07, n: 7, top: 0.05, bw: 9 * U}, rnd)); qx -= qh * 0.95 + H * 0.01; }
  // the sun (moon at night) hangs above and to the right of the Great Pyramid; at the finish it slides down onto the tip
  var sunR = (ph ? 26 : 38) * U, sun = [Math.min(W - sunR * 2.2, ku.A[0] + H * (ph ? 0.1 : 0.09)), ku.A[1] - H * (ph ? 0.16 : 0.17)];
  // ---- the sky: haze and long golden clouds by day, the Milky Way rising from behind the pyramids by night
  add(far, 'a', egypt_e(W * 0.5, hz - H * 0.02, W * 0.85, H * 0.12), C.haze);
  if (dk) {
    var mw = '', core = '', dust = '', p0 = [W * 0.86, hz], p1 = [W * 0.04, -H * 0.06];
    for (i = 0; i <= 14; i++) { var q = egypt_at(p0, p1, i / 14), w = H * (0.07 + 0.05 * Math.sin(i * 0.9)); mw += egypt_e(q[0], q[1], w * 1.5, w); if (i > 1 && i < 12) core += egypt_e(q[0] + Math.sin(i) * 10, q[1], w * 0.8, w * 0.42); if (i % 3 === 1) dust += egypt_e(q[0] + w * 0.3, q[1] - w * 0.1, w * 0.6, w * 0.12); }
    add(far, 'b', mw, C.mw); add(far, 'c', core, C.mwCore); add(far, 'd', dust, C.mwDust);
    var open = function (x, y) { return ![ku, fa, me].concat(queens).some(function (p) { return egypt_in(p.sil, x, y + 2); }); };
    var stars = '', sp = spread(0, 0, W, hz - H * 0.04, ph ? 26 : 34, ph ? 26 : 34, rnd, 1);
    sp.forEach(function (c) { if (c.q < 0.42 && open(c.x, c.y)) stars += egypt_c(c.x, c.y, 0.45 + c.r * c.r * 1.3); });
    for (i = 0; i < (ph ? 90 : 220); i++) { var u0 = rnd(), q2 = egypt_at(p0, p1, u0), sd = (rnd() - 0.5) * H * 0.16; var stx = q2[0] + (rnd() - 0.5) * H * 0.1; if (q2[1] + sd < hz - H * 0.05 && open(stx, q2[1] + sd)) stars += egypt_c(stx, q2[1] + sd, 0.35 + rnd() * 0.6); }
    add(bg, 'h', stars, C.star);
  } else {
    var cl = '', cls = '';
    [[0.2, 0.2, 0.2], [0.42, 0.12, 0.14], [0.66, 0.27, 0.16], [0.1, 0.36, 0.12], [0.5, 0.33, 0.1]].forEach(function (q) { var cx = W * q[0], cy = H * q[1], w = W * q[2]; cl += egypt_e(cx, cy, w, H * 0.012) + egypt_e(cx - w * 0.3, cy - H * 0.01, w * 0.5, H * 0.012); cls += egypt_e(cx + w * 0.1, cy + H * 0.012, w * 0.8, H * 0.007); });
    add(far, 'b', cl, C.cloud); add(far, 'c', cls, C.cloudS);
  }
  if (!ANIM) { add(far, 'e', egypt_c(sun[0], sun[1], sunR * (dk ? 3 : 4.2)), C.glow); add(bg, 'g', egypt_c(sun[0], sun[1], sunR), C.sun); }
  // ---- far dunes behind the plateau, with wind ripples
  var r1 = ridge(W, hz - H * 0.045, [[H * 0.018, 170, 0.4], [H * 0.01, 70, 2.2]], 8, false), r2 = ridge(W, hz - H * 0.018, [[H * 0.014, 130, 1.7], [H * 0.006, 50, 0.3]], 8, false);
  add(bg, 'a', below(r1, hz + 6), C.dune1); add(bg, 'b', below(r2, hz + 6), C.dune2);
  var drip = ''; for (i = 0; i < (ph ? 7 : 14); i++) { var dx0 = rnd() * W, dy0 = egypt_yOn(r2, dx0) + 3 + rnd() * (hz - egypt_yOn(r2, dx0) - 4), dw = 20 + rnd() * 40; drip += 'M' + PT(dx0, dy0) + ' Q' + PT(dx0 + dw / 2, dy0 - 2) + ' ' + PT(dx0 + dw, dy0) + ' '; }
  stk(bg, 't', drip, C.dRip, 0.8);
  // ---- Khafre, Menkaure and the queens
  var fShade = '', fLit = '', fLines = '';
  [fa, me].concat(queens).forEach(function (p) { fShade += p.left; fLit += p.right; fLines += p.lines + p.joints; });
  add(bg, 'c', fShade, C.fShade); add(bg, 'd', fLit, C.fLit); add(bg, 'e', fa.casR, C.cas); add(bg, 'f', fa.casL, C.casS); stk(bg, 's', fLines, C.fLine, 0.7);
  // a camel caravan resting on the dune ridge (the engine walks it)
  if (!ANIM) { var cv = ''; for (i = 0; i < 4; i++) { var cx2 = W * (ph ? 0.08 : 0.06) + i * 26 * U; cv += egypt_camel(cx2, egypt_yOn(r2, cx2) + 2, 20 * U * (1 - i * 0.05), i * 1.3); } add(bg, 'c', cv); }

  // ---- the plateau, Khufu and the Sphinx
  var pl = []; for (x = -20; x <= W + 20; x += 10) pl.push([x, hz + Math.sin(x / 140 + 0.6) * H * 0.004 + Math.sin(x / 47) * 1.2]);
  add(mid, 'a', below(pl, ry + 6), C.sand);
  var shade = ku.left, lit = ku.right, shadow = '', dark = '', lines = ku.lines + ku.joints, shine = '';
  // the Great Pyramid: a lighter edge along its sunlit ridge, weathered patches, the old entrance, and its shadow on the sand
  shine += egypt_pg([ku.F, ku.at(ku.F, 0.985), egypt_at(ku.at(ku.F, 0.985), ku.at(ku.R, 0.985), 0.05), egypt_at(ku.F, ku.R, 0.05)]);
  for (i = 0; i < 14; i++) { var uu = 0.04 + rnd() * 0.75, du = 0.025 + rnd() * 0.03, vv = 0.1 + rnd() * 0.7, dv = 0.05 + rnd() * 0.12, E = rnd() < 0.5 ? [ku.L, ku.F] : [ku.F, ku.R];
    shadow += egypt_pg([egypt_at(ku.at(E[0], uu), ku.at(E[1], uu), vv), egypt_at(ku.at(E[0], uu), ku.at(E[1], uu), vv + dv), egypt_at(ku.at(E[0], uu + du), ku.at(E[1], uu + du), vv + dv * 0.8), egypt_at(ku.at(E[0], uu + du), ku.at(E[1], uu + du), vv + dv * 0.15)]); }
  var en = egypt_at(ku.at(ku.L, 0.13), ku.at(ku.F, 0.13), 0.58); dark += egypt_pg([[en[0] - kh * 0.018, en[1] + kh * 0.022], [en[0] - kh * 0.018, en[1] - kh * 0.01], [en[0], en[1] - kh * 0.024], [en[0] + kh * 0.018, en[1] - kh * 0.01], [en[0] + kh * 0.018, en[1] + kh * 0.022]]);
  shadow += egypt_pg([ku.L, ku.F, [ku.F[0] - kh * 0.6, ku.F[1] + kh * 0.035], [ku.L[0] - kh * 0.5, ku.L[1] + kh * 0.012]]);
  // the Sphinx, lying in its hollow, facing left: shaded flank (shade), sunlit back, head and headcloth stripes (lit)
  var sl = H * (ph ? 0.11 : 0.2), su = sl / 100, sx0 = Math.max(W * 0.03, ku.L[0] - H * 0.012 - sl), sy0 = H * (ph ? 0.676 : 0.703);
  var S = function (pts) { return pts.map(function (p) { return [sx0 + p[0] * su, sy0 + p[1] * su]; }); };
  var sph = S([[0, 0], [96, 0], [100, -4], [101, -10], [99, -17], [95, -21], [85, -24], [70, -25], [55, -25], [47, -27], [43, -33], [41, -40], [38, -47], [34, -53], [30, -57], [25, -58], [21, -56], [19, -52], [18.6, -48], [17.6, -45.4], [19, -43.6], [18.4, -41.4], [19.4, -38.6], [22, -36.4], [20.4, -30], [19.4, -24], [18, -18], [16, -10], [10, -9.4], [2, -8.6], [-0.4, -5], [0, 0]]);
  shade += egypt_pg(sph);
  lit += egypt_pg(S([[47, -27], [55, -25], [70, -25], [85, -24], [95, -21], [99, -17], [101, -10], [100, -4], [96.6, -4.6], [97, -11], [94, -16.6], [84, -19.6], [70, -20.6], [55, -20.8], [48, -22.6]]));
  lit += egypt_pg(S([[25, -58], [30, -57], [34, -53], [33, -51], [28, -53.4], [24, -54.4], [21.4, -53.4], [21, -56]]));
  lit += egypt_pg(S([[2, -8.6], [10, -9.4], [16, -10], [15.6, -7.4], [9, -6.8], [1.4, -6.2]]));
  [[36, -49, 39, -43], [38.6, -43, 41, -37], [40.6, -37, 42.4, -31.4]].forEach(function (b) { lit += egypt_pg(S([[b[0] - 3.6, b[1] + 1.2], [b[0], b[1]], [b[2], b[3]], [b[2] - 4.4, b[3] + 1.4]])); });
  lit += egypt_pg(S([[20.4, -35], [24, -35.6], [23.6, -31], [20.4, -30.6]])) + egypt_pg(S([[19.8, -28], [23, -28.6], [22.6, -24], [19.4, -24]]));
  dark += egypt_re(sx0 + 22.6 * su, sy0 - 47.4 * su, 1.9 * su, 0.8 * su, -8) + egypt_re(sx0 + 19.2 * su, sy0 - 42.6 * su, 0.9 * su, 0.5 * su, 0) + egypt_re(sx0 + 20.2 * su, sy0 - 40.4 * su, 1.4 * su, 0.35 * su, 0) + egypt_re(sx0 + 28.4 * su, sy0 - 45 * su, 1.4 * su, 2.2 * su, 0);
  var sl2 = ''; [-5, -11, -17].forEach(function (yy) { sl2 += seg(sx0 + 22 * su, sy0 + yy * su, sx0 + (yy < -15 ? 92 : 97) * su, sy0 + yy * su); });
  [[3.6, -8.4], [6.4, -8.8]].forEach(function (t) { sl2 += seg(sx0 + t[0] * su, sy0 + t[1] * su, sx0 + (t[0] - 1) * su, sy0); });
  sl2 += 'M' + PT(sx0 + 62 * su, sy0 - 21 * su) + ' Q' + PT(sx0 + 74 * su, sy0 - 12 * su) + ' ' + PT(sx0 + 72 * su, sy0) + ' ';
  shadow += egypt_e(sx0 + 48 * su, sy0 + 1.6 * su, 58 * su, 4.4 * su) + egypt_pg(S([[-14, 2], [-2, -1], [104, -1], [112, 3], [60, 6]]));
  // the temple blocks in front of the Sphinx
  for (i = 0; i < 4; i++) { var bx2 = sx0 - (8 + i * 9) * su, bh2 = (5 + (i % 2) * 3) * su, bw2 = 7 * su; shade += rect(bx2, sy0 + 3 * su - bh2, bw2, bh2); lit += rect(bx2 + bw2 * 0.6, sy0 + 3 * su - bh2, bw2 * 0.4, bh2); }
  // ---- the far bank: fields and a palm grove, with a few mud houses
  var fb = []; for (x = -20; x <= W + 20; x += 8) fb.push([x, fy + Math.sin(x / 33 + 1) * 2 + Math.sin(x / 9.7) * 1.4]);
  var green = below(fb, ry + 4), gTr = '', fWall = '', fSide = '', fWin = '';
  var nP = Math.round(W / (ph ? 24 : 30));
  for (i = 0; i < nP; i++) { var px = (i + 0.5) / nP * W + (rnd() - 0.5) * 18, py = egypt_yOn(fb, px) + 3, inS = px > sx0 - 20 * su && px < sx0 + 104 * su, phh = H * (inS ? 0.012 : 0.022 + rnd() * 0.03), pr = H * (ph ? 0.012 : 0.014) * (0.8 + rnd() * 0.4);
    if (inS && rnd() < 0.6) continue;
    gTr += egypt_limb(px, py, px + (rnd() - 0.5) * 4, py - phh, 2.4 * U, 1.4 * U, (rnd() - 0.5) * 3);
    for (j = 0; j < 7; j++) { var la = -Math.PI * (j / 6) + (rnd() - 0.5) * 0.3; green += egypt_re(px + Math.cos(la) * pr * 0.55, py - phh + Math.sin(la) * pr * 0.35 + pr * 0.2, pr * 0.62, pr * 0.16, la * 57.3 + (Math.cos(la) > 0 ? 18 : -18)); } }
  for (i = 0; i < 6; i++) { var hx = W * (0.08 + i * 0.17 + rnd() * 0.05), hy = 0,  hw2 = H * (0.016 + rnd() * 0.012), hh2 = H * (0.011 + rnd() * 0.008);
    if (hx > sx0 - 20 * su && hx < sx0 + 104 * su) continue;
    hy = Math.min(egypt_yOn(fb, hx), egypt_yOn(fb, hx + hw2 * 1.3)) + 0.5; // (standing on the bank's top edge: lower, the green field was drawn over them)
    fWall += rect(hx, hy - hh2, hw2, hh2); fSide += egypt_pg([[hx + hw2, hy - hh2], [hx + hw2 * 1.3, hy - hh2 - hh2 * 0.15], [hx + hw2 * 1.3, hy - hh2 * 0.15], [hx + hw2, hy]]); fWin += rect(hx + hw2 * 0.25, hy - hh2 * 0.6, hw2 * 0.12, hh2 * 0.22) + rect(hx + hw2 * 0.6, hy - hh2 * 0.6, hw2 * 0.12, hh2 * 0.22); }
  lit += fSide; shade += fWall; dark += fWin + gTr;
  // ---- the Nile, with glints and ripples
  var rv = []; for (x = -20; x <= W + 20; x += 10) rv.push([x, ry + Math.sin(x / 61) * 1.5]);
  var rip = '', gl = '';
  spread(0, ry + 6, W, by - ry - 6, ph ? 60 : 90, 14, rnd, 1).forEach(function (c) { if (c.q < 0.5) rip += seg(c.x, c.y, c.x + 10 + c.r * 26, c.y); else if (c.q < 0.62) gl += egypt_e(c.x, c.y, 6 + c.r * 10, 0.9); });
  add(mid, 'b', shade, C.shade); add(mid, 'c', lit, C.lit); add(mid, 'd', shadow, C.shadow); add(mid, 'e', green, C.green); add(mid, 'f', below(rv, H + 10), C.nile); add(mid, 'g', dark, C.dark); add(mid, 'h', shine + gl, C.shine);
  stk(mid, 's', lines + sl2, C.line, 0.8); stk(mid, 't', rip, C.ripple, 1);

  // ---- the near bank: a mud-brick village with a dovecote on the left, papyrus along the water, palms on the right
  var bk = []; for (x = -20; x <= W + 20; x += 10) bk.push([x, by + Math.sin(x / 70 + 0.4) * H * 0.006 + Math.sin(x / 23) * 1.6 - Math.exp(-Math.pow(x / (W * (ph ? 0.3 : 0.2)), 2)) * H * 0.03 - Math.exp(-Math.pow((x - W) / (W * (ph ? 0.18 : 0.1)), 2)) * H * 0.02]);
  var ground = below(bk, H + 10), wallL = '', wallS = '', door = '', win = '', white = '', trunk = '', leaf = '', blade = '', stick = '', crowns = '', datesD = '', umb = '';
  var grd = '', vgy = [], vs = ph ? 0.78 * U : U, vx = 0, houses = ph ? [[-0.03, 0.17, 0.065], [0.3, 0.14, 0.05]] : [[-0.01, 0.07, 0.085], [0.165, 0.075, 0.06], [0.262, 0.05, 0.045]], wins = [], hBox = [];
  // houses: [x, width, height] as fractions of W and H. A front wall, a lit side wall, a parapet, a door, windows and a whitewash band.
  houses.forEach(function (hs, k) {
    var hx = W * hs[0], hw3 = Math.min(W * hs[1], H * 0.11), hh = H * hs[2] * (ph ? 0.8 : 1), gy = Math.max(egypt_yOn(bk, hx), egypt_yOn(bk, hx + hw3)) + 4, top = gy - hh, dep = hw3 * 0.22; hBox.push([hx, hx + hw3 + dep, top - dep * 0.35 - hh * 0.06]); // (its full outline, roof included, so a palm behind starts above it)
    // the ground it stands on runs back under its side and behind it, so it stands on the bank, not out over the water
    vgy.push([hx, hx + hw3 + dep, gy - dep * 0.35 - hh * 0.12]);
    wallS += rect(hx, top, hw3, hh); wallL += egypt_pg([[hx + hw3, top], [hx + hw3 + dep, top - dep * 0.35], [hx + hw3 + dep, gy - dep * 0.35], [hx + hw3, gy]]);
    // the flat roof seen from a little above: its top face runs back from the front wall to the side wall's top, with a low
    // parapet round it (crenellations along the front, a lip along the side)
    wallL += egypt_pg([[hx, top], [hx + hw3, top], [hx + hw3 + dep, top - dep * 0.35], [hx + dep, top - dep * 0.35]]);
    wallS += egypt_pg([[hx + dep * 0.9, top - dep * 0.35], [hx + hw3 + dep, top - dep * 0.35], [hx + hw3 + dep, top - dep * 0.35 - hh * 0.05], [hx + dep * 0.9, top - dep * 0.35 - hh * 0.05]]);
    wallS += egypt_pg([[hx + hw3, top], [hx + hw3 + dep, top - dep * 0.35], [hx + hw3 + dep, top - dep * 0.35 - hh * 0.05], [hx + hw3, top - hh * 0.05]]);
    for (var c2 = 0; c2 < 6; c2++) { var cx3 = hx + c2 / 6 * hw3; wallS += rect(cx3, top - hh * 0.06, hw3 / 12, hh * 0.06 + 1); }
    white += rect(hx, top + hh * 0.02, hw3, hh * 0.05);
    var dw = hw3 * 0.2, dh = hh * 0.5, dx2 = hx + hw3 * (k % 2 ? 0.62 : 0.2);
    door += egypt_pg([[dx2, gy], [dx2, gy - dh + dw / 2], [dx2 + dw * 0.15, gy - dh + dw * 0.12], [dx2 + dw / 2, gy - dh], [dx2 + dw * 0.85, gy - dh + dw * 0.12], [dx2 + dw, gy - dh + dw / 2], [dx2 + dw, gy]]);
    white += egypt_pg([[dx2 - dw * 0.12, gy], [dx2 - dw * 0.12, gy - dh + dw / 2], [dx2 + dw / 2, gy - dh - dw * 0.2], [dx2 + dw * 1.12, gy - dh + dw / 2], [dx2 + dw * 1.12, gy], [dx2 + dw, gy], [dx2 + dw, gy - dh + dw / 2], [dx2 + dw / 2, gy - dh + dw * 0.05], [dx2, gy - dh + dw / 2], [dx2, gy]]);
    [k % 2 ? 0.18 : 0.6, k % 2 ? 0.36 : 0.78].forEach(function (wx) { var ww = hw3 * 0.1, wh = hh * 0.16, x4 = hx + hw3 * wx, y4 = top + hh * 0.26; win += rect(x4, y4, ww, wh); wins.push([x4 + ww / 2, y4 + wh / 2, ww]); });
    for (var s2 = 0; s2 < 4; s2++) stick += seg(hx + hw3 * (0.15 + s2 * 0.08), top - hh * 0.06, hx + hw3 * (0.3 + s2 * 0.09), top - hh * 0.2);
  });
  // the village stands on a strip of bank that runs back behind the houses (and the dovecote), so water shows only beyond it
  if (vgy.length) { var vx1 = vgy[vgy.length - 1][1] + 26 * U, vt = Math.min.apply(null, vgy.map(function (q) { return q[2]; })), vp = [[-20, egypt_yOn(bk, -20) + 2]];
    for (x = -20; x <= vx1; x += 6) { var vv = vt + Math.sin(x / 37) * 2 * U; vp.push([x, Math.min(vv + Math.max(0, x - vx1 + 40 * U) * 0.55, egypt_yOn(bk, x) + 2)]); }
    vp.push([vx1, egypt_yOn(bk, vx1) + 2]); grd += egypt_pg(vp); }
  // a flagpole on the roof of the first house, flying the Egyptian flag (the engine draws and waves the cloth)
  var egFlag = (function () { var hb = hBox[0]; if (!hb) return null; var px = hb[0] + (hb[1] - hb[0]) * 0.3, base = hb[2] + 3 * U, ph2 = (ph ? 48 : 64) * U; door += rect(px - 1.2 * U, base - ph2, 2.4 * U, ph2); return {x: px + 1.2 * U, y: base - ph2 + 1.5 * U, w: (ph ? 28 : 38) * U, h: (ph ? 28 : 38) * U * 2 / 3}; })();
  // the dovecote: a tall tapering mud tower, whitewashed bands, rows of pigeon pots and perch sticks, a domed top
  var dvx = W * (ph ? 0.2 : 0.12), dvy = egypt_yOn(bk, dvx) + 5, dvh = H * (ph ? 0.17 : 0.21) * (ph ? 1 : 1), dvw = H * (ph ? 0.05 : 0.058), dvt = dvy - dvh;
  wallS += egypt_pg([[dvx - dvw / 2, dvy], [dvx - dvw * 0.36, dvt + dvh * 0.1], [dvx + dvw * 0.36, dvt + dvh * 0.1], [dvx + dvw / 2, dvy]]);
  // (square in plan like the houses: its lit right-hand side recedes, and the whitewash bands wrap round onto it)
  var dvd = dvw * 0.32, dvSide = function (y0, y1, wf0, wf1) { return egypt_pg([[dvx + dvw * wf0, y0], [dvx + dvw * wf0 + dvd, y0 - dvd * 0.35], [dvx + dvw * wf1 + dvd, y1 - dvd * 0.35], [dvx + dvw * wf1, y1]]); };
  var wfAt = function (y) { return 0.36 + 0.14 * (y - (dvt + dvh * 0.1)) / (dvy - dvt - dvh * 0.1); };
  wallL += dvSide(dvt + dvh * 0.1, dvy, 0.36, 0.5);
  // the top: a whitewashed cornice wrapping round the corner, and on it a rounded cap that follows the square plan, a
  // curved facet over the front and one over the side meeting at a ridge, rising to one apex (so it reads as solid)
  var cy0 = dvt + dvh * 0.1, cL = [dvx - dvw * 0.38, cy0], cR = [dvx + dvw * 0.38, cy0], cB = [dvx + dvw * 0.38 + dvd, cy0 - dvd * 0.35];
  var dmx = dvx + dvd * 0.5, dmh = dvh * 0.1, apex = [dmx + dvw * 0.02, cy0 - dvd * 0.175 - dmh], dmr = dvw * 0.38, dmy = cy0 - dvd * 0.175;
  var facet = function (A, B) { var p = [A], k; for (k = 1; k < 12; k++) { var t = k / 12, e = Math.sin(t * Math.PI / 2); p.push([A[0] + (apex[0] - A[0]) * t, A[1] + (apex[1] - A[1]) * e]); } p.push(apex); for (k = 11; k >= 1; k--) { t = k / 12; e = Math.sin(t * Math.PI / 2); p.push([B[0] + (apex[0] - B[0]) * t, B[1] + (apex[1] - B[1]) * e]); } p.push(B); return p; };
  white += egypt_pg(facet(cL, cR)); wallL += egypt_pg(facet(cR, cB)); // (the side facet in the lit side's tone, like the walls)
  // the ridge between the facets, and the side facet's far edge (so it stands out against the desert behind)
  [cR, cB].forEach(function (A) { var rg = []; for (var k5 = 0; k5 <= 12; k5++) { var t5 = k5 / 12; rg.push([A[0] + (apex[0] - A[0]) * t5, A[1] + (apex[1] - A[1]) * Math.sin(t5 * Math.PI / 2)]); } stick += 'M' + rg.map(function (p) { return PT(p[0], p[1]); }).join(' L') + ' '; });
  white += rect(dvx - dvw * 0.38, cy0, dvw * 0.76, dvh * 0.035) + dvSide(cy0, cy0 + dvh * 0.035, 0.38, 0.385);
  for (i = 0; i < 3; i++) { var wy = dvt + dvh * (0.32 + i * 0.2), ww3 = dvw * (0.37 + i * 0.045); white += egypt_pg([[dvx - ww3, wy], [dvx + ww3, wy], [dvx + ww3 + dvw * 0.01, wy + dvh * 0.022], [dvx - ww3 - dvw * 0.01, wy + dvh * 0.022]]) + dvSide(wy, wy + dvh * 0.022, wfAt(wy), wfAt(wy + dvh * 0.022)); }
  for (i = 0; i < 6; i++) { var ry2 = dvt + dvh * (0.17 + i * 0.065), rw = dvw * (0.32 + i * 0.022), np = 5 - (i % 2); for (j = 0; j < np; j++) door += egypt_e(dvx - rw + (j + 0.5 + (i % 2) * 0.5) / (np + (i % 2) * 0.5) * rw * 2 * 0.95, ry2, dvw * 0.035, dvw * 0.028);
    if (i % 2 === 0) stick += seg(dvx - rw - dvw * 0.14, ry2 + dvh * 0.025, dvx + rw + dvw * 0.14, ry2 + dvh * 0.025); }
  door += egypt_c(dvx, cy0 - dmh * 0.42, dvw * 0.06) + egypt_pg([[dvx - dvw * 0.07, dvy], [dvx - dvw * 0.07, dvy - dvh * 0.08], [dvx + dvw * 0.07, dvy - dvh * 0.08], [dvx + dvw * 0.07, dvy]]);
  stick += seg(apex[0], apex[1] + 1, apex[0], apex[1] - dvh * 0.06);
  // palms: one by the village, two framing the right edge. Trunks with leaf scars; the crowns sway (engine)
  var palms = (ph ? [[0.36, 0.2, -8], [0.89, 0.3, -7]] : [[0.21, 0.27, -10], [0.915, 0.33, 6], [0.975, 0.42, -6]]).map(function (q, k) {
    var bx = W * q[0], b0 = egypt_yOn(bk, bx) + 6, hh = H * q[1], tx = bx + q[2] * U * 3, ty = b0 - hh, s = H * (ph ? 0.085 : 0.1) * (0.85 + q[1]);
    // a palm standing behind a house: its trunk starts just under the roof line, so the house's band, door and roof
    // sticks stay in front of it instead of the trunk being drawn through them
    var u0 = 0; hBox.forEach(function (hb) { if (bx > hb[0] && bx < hb[1]) u0 = Math.max(u0, (b0 - hb[2]) / (b0 - ty)); });
    trunk += egypt_limb(bx, b0, tx, ty, 12 * U, 7.5 * U, q[2] * U * 1.2, u0);
    for (var r = 0; r < 14; r++) { var u = 0.05 + r / 14 * 0.9; if (u < u0 + 0.03) continue; var xx = bx + (tx - bx) * u + q[2] * U * 1.2 * Math.sin(Math.PI * u) * 0.5, yy = b0 + (ty - b0) * u, ww = (12 - 4.5 * u) * U * 0.5; stick += 'M' + PT(xx - ww, yy) + ' Q' + PT(xx, yy + 3 * U) + ' ' + PT(xx + ww, yy) + ' '; }
    if (!ANIM) { var cr = egypt_crown(tx, ty, s, 0, k * 11 + 3); crowns += cr.back + cr.front + cr.boots; datesD += cr.dates; }
    return {x: tx, y: ty, s: s, seed: k * 11 + 3};
  });
  // papyrus clumps along the water's edge; the stems and umbels nod (engine)
  var papy = [];
  (ph ? [[0.47, 6], [0.66, 7]] : [[0.3, 6], [0.37, 5], [0.55, 7], [0.64, 5], [0.84, 6]]).forEach(function (q, k) {
    var cx4 = W * q[0], g0 = egypt_yOn(bk, cx4) + 4;
    for (j = 0; j < q[1]; j++) { var sx = cx4 + (j - q[1] / 2) * 7 * U + (rnd() - 0.5) * 4, hh = H * (0.07 + rnd() * 0.06) * (ph ? 0.9 : 1), lean = (j - q[1] / 2) * 3 * U + (rnd() - 0.5) * 6, us = (9 + rnd() * 5) * U;
      papy.push({x: sx, y: g0 + 2, h: hh, lean: lean, s: us, ph: rnd() * 6.28});
      if (!ANIM) { leaf += egypt_limb(sx, g0 + 2, sx + lean, g0 - hh, 2.4 * U, 1.3 * U, lean * 0.2); umb += egypt_umbel(sx + lean, g0 - hh, us, lean * 1.5); leaf += egypt_pg([[sx + lean - us * 0.12, g0 - hh + us * 0.12], [sx + lean + us * 0.12, g0 - hh + us * 0.12], [sx + lean, g0 - hh - us * 0.05]]); } }
    for (j = 0; j < 7; j++) { var la2 = -Math.PI * (0.15 + j / 6 * 0.7), ll = (12 + rnd() * 10) * U; leaf += egypt_limb(cx4 + (j - 3) * 3 * U, g0 + 4, cx4 + (j - 3) * 3 * U + Math.cos(la2) * ll, g0 + 4 + Math.sin(la2) * ll, 3 * U, 0.6 * U, (j - 3) * 1.2); }
  });
  // a strip of sandy mud along the water's edge
  var shore = [], shore2 = []; for (x = -20; x <= W + 20; x += 10) { shore.push([x, egypt_yOn(bk, Math.max(-20, Math.min(W + 20, x))) - 1]); shore2.unshift([x, egypt_yOn(bk, Math.max(-20, Math.min(W + 20, x))) + (5 + 3 * Math.sin(x / 37) + 2 * Math.sin(x / 13)) * U]); }
  wallL += egypt_pg(shore.concat(shore2));
  // a sandy path down to a little landing, water jars by the houses, stones at the water's edge, a rowboat drawn up on the bank
  // (the path comes up past the right side of the last house to a little jetty on the water behind it)
  var hbL = hBox[hBox.length - 1], pa = hbL ? hbL[1] + (hbL[1] - hbL[0]) * 0.22 + 16 * U : W * (ph ? 0.28 : 0.27), pathP = [[pa - 10 * U, egypt_yOn(bk, pa) + 3]]; for (j = 1; j <= 8; j++) { var pu = j / 8; pathP.push([pa - 10 * U - pu * W * 0.06 + Math.sin(pu * 3) * 12 * U - pu * pu * 30 * U, egypt_yOn(bk, pa) + 3 + pu * (H - by + 10)]); }
  var pathQ = pathP.map(function (q, k) { return [q[0] + (14 + k * 7) * U, q[1]]; }).reverse(); wallL += egypt_pg(pathP.concat(pathQ));
  var pathPoly = pathP.concat(pathQ);
  // the jetty: a plank deck on posts running out from the bank behind the house, short enough that the felucca's hull
  // passes clear in front of its far end
  var dy0 = egypt_yOn(bk, pa) + 2, dyT = Math.max(dy0 - 26 * U, ry + (by - ry) * 0.66 + 9 * U), dkx = pa - 3 * U, dockP = [[dkx - 11 * U, dy0], [dkx - 8 * U, dyT], [dkx + 8 * U, dyT], [dkx + 11 * U, dy0]];
  if (dy0 - dyT > 6 * U) { wallS += egypt_pg(dockP); for (j = 1; j < 6; j++) { var dq = j / 6, dly = dy0 + (dyT - dy0) * dq, dlw = 11 * U - 3 * U * dq; stick += seg(dkx - dlw, dly, dkx + dlw, dly); }
    [[0.05, 1], [0.95, 1], [0.95, -1], [0.5, -1], [0.5, 1]].forEach(function (q) { var dly2 = dy0 + (dyT - dy0) * q[0], dlw2 = (11 * U - 3 * U * q[0]) * q[1]; door += rect(dkx + dlw2 - 1.2 * U, dly2, 2.4 * U, 5 * U); }); }
  else dockP = [];
  // grass on the bank (none on the path)
  spread(0, by, W, H - by, ph ? 34 : 48, 18, rnd, 1).forEach(function (c) { if (c.q < 0.45 && c.y > egypt_yOn(bk, c.x) + 6 && ![[0, 0], [-5 * U, 0], [5 * U, 0], [0, -5 * U], [0, 5 * U]].some(function (d) { return egypt_in(pathPoly, c.x + d[0], c.y + d[1]); }) && !egypt_in(dockP, c.x, c.y)) blade += 'M' + PT(c.x - 3, c.y) + ' Q' + PT(c.x - 1, c.y - 6) + ' ' + PT(c.x - 4, c.y - 11) + ' M' + PT(c.x + 1, c.y) + ' Q' + PT(c.x + 2, c.y - 7) + ' ' + PT(c.x + 5, c.y - 10) + ' '; });
  var jars = '', jm = ''; (ph ? [[0.03, 1], [0.08, 0.8]] : [[0.068, 1], [0.088, 0.85], [0.155, 0.9]]).forEach(function (q) { var jx = W * q[0], jy = egypt_yOn(bk, jx) + 12 * U, js = 9 * U * q[1]; jars += egypt_e(jx, jy - js, js * 0.8, js) + rect(jx - js * 0.32, jy - js * 2.05, js * 0.64, js * 0.3) + egypt_e(jx, jy, js * 0.5, js * 0.18); jm += egypt_e(jx, jy - js * 2.05, js * 0.32, js * 0.1); });
  wallS += jars; door += jm;
  for (i = 0; i < (ph ? 8 : 16); i++) { var stx2 = rnd() * W, sty = egypt_yOn(bk, stx2) + 3, sts = (3 + rnd() * 5) * U; if (Math.abs(stx2 - pa) < 30 * U) continue; wallS += egypt_pg([[stx2 - sts * 1.4, sty + sts * 0.4], [stx2 - sts, sty - sts * 0.4], [stx2 + sts * 0.2, sty - sts * 0.6], [stx2 + sts * 1.3, sty + sts * 0.4]]); }
  var rbx = W * (ph ? 0.8 : 0.69), rby = egypt_yOn(bk, rbx) + 8 * U, rbl = (ph ? 46 : 62) * U;
  door += egypt_pg([[rbx - rbl * 0.5, rby - rbl * 0.14], [rbx + rbl * 0.5, rby - rbl * 0.2], [rbx + rbl * 0.36, rby], [rbx - rbl * 0.38, rby + rbl * 0.02]]); white += egypt_pg([[rbx - rbl * 0.46, rby - rbl * 0.13], [rbx + rbl * 0.47, rby - rbl * 0.185], [rbx + rbl * 0.44, rby - rbl * 0.14], [rbx - rbl * 0.44, rby - rbl * 0.09]]);
  stick += seg(rbx - rbl * 0.2, rby - rbl * 0.12, rbx + rbl * 0.75, rby - rbl * 0.5) + seg(rbx + rbl * 0.5, rby - rbl * 0.18, rbx + rbl * 0.7, rby + rbl * 0.05);
  // tall grass tufts framing the bottom corners
  [[0.02, 1.2], [0.06, 0.9], [ph ? 0.9 : 0.96, 1.1], [ph ? 0.97 : 0.995, 1.3], [0.42, 0.6], [0.58, 0.7]].forEach(function (q) { var gx = W * q[0], gy = H + 4; for (j = 0; j < 9; j++) { var ga = -Math.PI / 2 + (j - 4) * 0.16, gl = (40 + hash(j + gx) * 40) * U * q[1]; leaf += egypt_limb(gx + (j - 4) * 3 * U, gy, gx + (j - 4) * 3 * U + Math.cos(ga) * gl, gy + Math.sin(ga) * gl, 4 * U, 0.6 * U, (j - 4) * 1.5); } });
  // the feluccas, the wading ibises: the engine sails and walks them; the still scene draws them where they start
  var boats = [{x: W * (ph ? 0.3 : 0.33), y: ry + (by - ry) * 0.66, L: (ph ? 62 : 104) * U, dir: 1, v: 9}, {x: W * (ph ? 0.78 : 0.7), y: ry + (by - ry) * 0.2, L: (ph ? 30 : 46) * U, dir: -1, v: 5}];
  var ibis = (ph ? [[0.56, 0.08], [0.82, 0.3]] : [[0.47, 0.1], [0.5, 0.35], [0.74, 0.18]]).map(function (q, k) { var ix = W * q[0]; return {x: ix, y: egypt_yOn(bk, ix) - 2 - q[1] * 6, s: (ph ? 18 : 24) * U, dir: k % 2 ? -1 : 1}; });
  if (!ANIM) {
    boats.forEach(function (b) { var bt = egypt_boat(b.x, b.y, b.L, 0.7, b.dir); white += bt.sail; door += bt.hull; stick += bt.spars; });
    ibis.forEach(function (b, k) { var ib = egypt_ibis(b.x, b.y, b.s, b.dir, k % 2 ? 0.8 : 0.1, 0); white += ib.body; door += ib.dark; stick += ib.legs; });
  }
  add(near, 'a', ground + grd, C.bank); add(near, 'b', wallL, C.wall); add(near, 'c', wallS, C.wallS); add(near, 'd', trunk, C.trunk); add(near, 'e', leaf + crowns, C.leaf); add(near, 'f', door + datesD, C.door); add(near, 'g', win, C.win); add(near, 'h', white, C.white);
  stk(near, 's', blade + umb, C.blade, 1.1); stk(near, 't', stick, C.stick, 1.3);
  if (ANIM) { ANIM.C = C; ANIM.hz = hz; ANIM.ry = ry; ANIM.by = by; ANIM.U = U; ANIM.sun = sun; ANIM.sunR = sunR; ANIM.ku = ku; ANIM.fa = fa; ANIM.me = me; ANIM.kh = kh;
    ANIM.egflag = egFlag; ANIM.sil = [ku, fa, me].concat(queens).map(function (p) { return p.sil; }).concat([sph]); ANIM.ridge = r2; ANIM.palms = palms; ANIM.papy = papy; ANIM.boats = boats; ANIM.ibis = ibis; ANIM.wins = wins; ANIM.dove = [dvx, dvt, dvh, dvw]; ANIM.bank = bk; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
