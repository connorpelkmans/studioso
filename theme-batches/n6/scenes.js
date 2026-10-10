// Study Fields batch n6: film (Movie Palace), culinary (Test Kitchen), marinebio (Kelp Forest), vet (Vet Clinic), aerospace (Launch Pad)
// Painter: draws in call order and packs the colours into the layers' slots (8 fills a layer), so z-order follows the code.
// f(): a new shape on top. m(): add to an earlier slot of the same colour in the current layer (only for shapes nothing between overlaps).
// s(): a stroke, drawn above every fill of the current layer. jump(L): carry on in a later layer (eg the front layer, above canvas A).
function n6_painter(Ls) {
  var K = 'abcdefgh', li = 0, n = 0, sn = 0;
  function nextLayer() { li++; n = 0; sn = 0; if (li >= Ls.length) throw new Error('n6 painter: out of layers'); }
  var P = {
    f: function (c, d) { if (!d) return P; var L = Ls[li]; if (n && L[K[n - 1]].c === c) { L[K[n - 1]].d += d; return P; } if (n >= 8) { nextLayer(); L = Ls[li]; } L[K[n]].d = d; L[K[n]].c = c; n++; return P; },
    m: function (c, d) { if (!d) return P; var L = Ls[li]; for (var i = 0; i < n; i++) if (L[K[i]].c === c) { L[K[i]].d += d; return P; } return P.f(c, d); },
    s: function (c, w, d) { if (!d) return P; var L = Ls[li], k = ['s', 't'];
      for (var i = 0; i < sn; i++) if (L[k[i]].c === c && L[k[i]].w === w) { L[k[i]].d += d; return P; }
      if (sn >= 2) { nextLayer(); L = Ls[li]; } L[k[sn]].d = d; L[k[sn]].c = c; L[k[sn]].w = w; sn++; return P; },
    jump: function (L) { var i = Ls.indexOf(L); if (i > li) { li = i; n = 0; sn = 0; } return P; },
    left: function () { return (Ls.length - li) * 8 - n; }
  };
  return P;
}
// clockwise shapes (the same winding as rect() and rrect()), so shapes in one slot always union and never punch holes
function n6_area(pts) { var a = 0; for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a; }
function n6_poly(pts) { return poly(n6_area(pts) < 0 ? pts.slice().reverse() : pts); }
function n6_circ(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 '; }
function n6_ell(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 '; }
function n6_rot(x, y, rx, ry, ang) { var pts = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2; pts.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n6_poly(rotp(pts, x, y, ang)); }
// a polyline as a filled strip of width w (lines that keep their place in the z-order)
function n6_thick(pts, w) { var L = [], R = []; pts.forEach(function (p, i) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2; L.push([p[0] + nx, p[1] + ny]); R.push([p[0] - nx, p[1] - ny]); }); return n6_poly(L.concat(R.reverse())); }
function n6_line(x1, y1, x2, y2, w) { return n6_thick([[x1, y1], [x2, y2]], w); }
// arc band (part of a ring) from angle a0 to a1 (radians)
function n6_arc(x, y, r0, r1, a0, a1, n) { n = n || 16; var o = [], i; for (i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; o.push([x + Math.cos(a) * r1, y + Math.sin(a) * r1]); } for (i = n; i >= 0; i--) { a = a0 + (a1 - a0) * i / n; o.push([x + Math.cos(a) * r0, y + Math.sin(a) * r0]); } return n6_poly(o); }
function n6_leaf(x, y, len, w, ang) { var pts = [], i; for (i = 0; i <= 12; i++) { var t = i / 12; pts.push([t * len, w * Math.sin(Math.PI * t) * (1 - 0.35 * t)]); } for (i = 11; i > 0; i--) { var u = i / 12; pts.push([u * len, -w * 0.7 * Math.sin(Math.PI * u) * (1 - 0.35 * u)]); } return n6_poly(rotp(pts, x, y, ang)); }
function n6_spark(x, y, r) { return n6_poly([[x, y - r], [x + r * 0.2, y - r * 0.2], [x + r, y], [x + r * 0.2, y + r * 0.2], [x, y + r], [x - r * 0.2, y + r * 0.2], [x - r, y], [x - r * 0.2, y - r * 0.2]]); }
function n6_star(x, y, R, r, k) { var o = []; for (var i = 0; i < k * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / k, q = i % 2 ? r : R; o.push([x + q * Math.cos(a), y + q * Math.sin(a)]); } return n6_poly(o); }
function n6_cloud(x, y, r) { return n6_circ(x, y, r * 0.62) + n6_circ(x - r * 0.62, y + r * 0.16, r * 0.44) + n6_circ(x + r * 0.66, y + r * 0.12, r * 0.48) + n6_circ(x - r * 0.2, y - r * 0.38, r * 0.5) + n6_circ(x + r * 0.32, y - r * 0.34, r * 0.46) + n6_ell(x, y + r * 0.3, r * 1.0, r * 0.3); }
function n6_fnP(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n6_below(pts, bottom) { return n6_poly(pts.concat([[pts[pts.length - 1][0], bottom], [pts[0][0], bottom]])); }
function n6_above(pts, top) { return n6_poly(pts.concat([[pts[pts.length - 1][0], top], [pts[0][0], top]])); }
// Filled shapes drawn with a stroke slot (a layer has 2 stroke slots besides its 8 fills): the shape is laid down as horizontal
// round-capped lines w apart, so a stroke colour can paint solid shapes. Shapes: {e: [cx, cy, rx, ry]} ellipses and {p: [[x, y], ...]} polygons.
function n6_spanOf(s, y) {
  if (s.e) { var q = s.e, d = (y - q[1]) / q[3]; if (d <= -1 || d >= 1) return []; var h = q[2] * Math.sqrt(1 - d * d); return [[q[0] - h, q[0] + h]]; }
  var p = s.p, xs = []; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
  xs.sort(function (u, v) { return u - v; }); var o = []; for (i = 0; i + 1 < xs.length; i += 2) o.push([xs[i], xs[i + 1]]); return o;
}
function n6_yr(s) { if (s.e) return [s.e[1] - s.e[3], s.e[1] + s.e[3]]; var a = 1e9, b = -1e9; s.p.forEach(function (q) { a = Math.min(a, q[1]); b = Math.max(b, q[1]); }); return [a, b]; }
function n6_hatch(shapes, w) {
  // ellipses: concentric rings (a smooth outline); polygons: scanlines
  var d = '';
  shapes = shapes.filter(function (s) { if (!s.e) return true; var q = s.e, i = 0;
    for (;; i++) { var rx = q[2] - w / 2 - i * w * 0.75, ry = q[3] - w / 2 - i * w * 0.75; if (rx <= 0.3 || ry <= 0.3) { var lx = Math.max(0, q[2] - q[3]), ly = Math.max(0, q[3] - q[2]); d += 'M' + PT(q[0] - lx, q[1] - ly) + 'L' + PT(q[0] + lx, q[1] + ly); break; } d += n6_ell(q[0], q[1], rx, ry); }
    return false; });
  if (!shapes.length) return d; var y0 = 1e9, y1 = -1e9, rs = shapes.map(function (s) { var r = n6_yr(s); y0 = Math.min(y0, r[0]); y1 = Math.max(y1, r[1]); return r; });
  var n = Math.max(1, Math.ceil((y1 - y0 - w) / (w * 0.7))), st = (y1 - y0 - w) / n;
  for (var k = 0; k <= n; k++) { var y = y0 + w / 2 + k * st, sp = [];
    shapes.forEach(function (s, i) { var r = rs[i]; if (y < r[0] + w / 2 - 0.01 || y > r[1] - w / 2 + 0.01) { if (y >= r[0] && y <= r[1]) sp = sp.concat(n6_spanOf(s, Math.max(r[0] + w / 2, Math.min(r[1] - w / 2, y)))); return; } sp = sp.concat(n6_spanOf(s, y)); });
    sp.sort(function (u, v) { return u[0] - v[0]; }); var m = [];
    sp.forEach(function (q) { if (m.length && q[0] <= m[m.length - 1][1] + 0.5) m[m.length - 1][1] = Math.max(m[m.length - 1][1], q[1]); else m.push(q.slice()); });
    m.forEach(function (q) { var a = q[0] + w / 2, b = q[1] - w / 2; if (b < a) { a = b = (q[0] + q[1]) / 2; } d += 'M' + PT(a, y) + 'L' + PT(b, y); }); }
  return d;
}
// the same for any region given row by row: fn(y) returns the [x0, x1] spans of the region at height y
function n6_hatchRows(y0, y1, w, fn) { var d = '', n = Math.max(1, Math.ceil((y1 - y0 - w) / (w * 0.7))), st = (y1 - y0 - w) / n;
  for (var k = 0; k <= n; k++) { var y = y0 + w / 2 + k * st; fn(y).forEach(function (q) { var a = q[0] + w / 2, b = q[1] - w / 2; if (b < a) a = b = (q[0] + q[1]) / 2; d += 'M' + PT(a, y) + 'L' + PT(b, y); }); }
  return d; }
// vertical lines instead, for regions with long gentle top edges (hills): inside(x, y) says whether a point is in the region
function n6_hatchCols(x0, x1, y0, y1, w, inside) { var d = '', n = Math.max(1, Math.ceil((x1 - x0 - w) / (w * 0.7))), st = (x1 - x0 - w) / n;
  for (var k = 0; k <= n; k++) { var x = x0 + w / 2 + k * st, a = null;
    for (var y = y0; y <= y1 + 0.01; y += 0.75) { var on = y <= y1 && inside(x, y); if (on && a === null) a = y; if ((!on || y + 0.75 > y1) && a !== null) { var b = on ? y : y - 0.75, ya = a + w / 2, yb = b - w / 2; if (yb < ya) ya = yb = (a + b) / 2; d += 'M' + PT(x, ya) + 'L' + PT(x, yb); a = null; } } }
  return d; }
function n6_ellP(cx, cy, rx, ry, ang) { var o = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2, x = rx * Math.cos(t), y = ry * Math.sin(t); o.push([cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)]); } return o; }
// round-capped dots (for a stroke slot): a zero-length line is a dot as wide as the stroke
function n6_dots(pts) { return pts.map(function (p) { return 'M' + PT(p[0], p[1]) + 'l0 0'; }).join(''); }
// rounded-top box (a tombstone shape: seat backs, oven doors, kennel arches)
function n6_tomb(x, y, w, h, r) { r = Math.min(r, w / 2, h); var o = [[x, y + h]], i; for (i = 0; i <= 8; i++) { var a = Math.PI + i / 8 * Math.PI / 2; o.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); } for (i = 0; i <= 8; i++) { a = -Math.PI / 2 + i / 8 * Math.PI / 2; o.push([x + w - r + Math.cos(a) * r, y + r + Math.sin(a) * r]); } o.push([x + w, y + h]); return n6_poly(o); }

// ==== n6:film ====
// =====================================================================================================
// 1. Movie Palace: an old picture palace from the stalls. Red velvet seats, a gold art deco proscenium with gathered
//    curtains, a marquee sign above the screen, the projection booth high on the right wall and a popcorn cart.
// =====================================================================================================
// a gathered stage curtain: xo = wall side, xi = screen side, tied back at ty (pinch: how far the tie pulls the inner edge out)
function n6_curtain(xo, xi, y0, y1, ty, pinch, nf) {
  function inner(y) { var u; if (y < ty) { u = (y - y0) / (ty - y0); return xi + (xo + (xi - xo) * pinch - xi) * Math.pow(u, 2.2); } u = (y - ty) / (y1 - ty); return xo + (xi - xo) * pinch + (xi - xo) * (1 - pinch) * 0.62 * Math.pow(u, 0.75); }
  var ys = [], y; for (y = y0; y <= y1 + 0.01; y += (y1 - y0) / 36) ys.push(y);
  function band(u0, u1) { var Lp = ys.map(function (y) { var a = inner(y); return [xo + (a - xo) * u0, y]; }), Rp = ys.map(function (y) { var a = inner(y); return [xo + (a - xo) * u1, y]; }); return n6_poly(Lp.concat(Rp.reverse())); }
  var dark = '', light = '';
  for (var k = 0; k < nf; k++) { var u = k / nf; dark += band(u + 0.55 / nf, u + 0.95 / nf); light += band(u + 0.12 / nf, u + 0.3 / nf); }
  return {base: band(0, 1), dark: dark, light: light, tie: [xo + (inner(ty) - xo) * 0.96, ty], inner: inner};
}
// a row of theatre seats seen from behind; returns {back, shade, hi, arm}
function n6_seats(x0, x1, yb, w, h, gap) {
  var o = {back: '', shade: '', hi: '', arm: ''}, n = Math.ceil((x1 - x0) / (w + gap)) + 1;
  for (var i = 0; i < n; i++) { var x = x0 + i * (w + gap);
    o.back += n6_tomb(x, yb - h, w, h + 2, w * 0.42);
    o.shade += rect(x, yb - h * 0.36, w, h * 0.36 + 2) + rect(x + w * 0.82, yb - h * 0.8, w * 0.18, h * 0.5);
    o.hi += n6_arc(x + w / 2, yb - h + w * 0.46, w * 0.3, w * 0.38, Math.PI * 1.15, Math.PI * 1.6, 8);
    o.arm += rrect(x + w + gap / 2 - gap * 0.38, yb - h * 0.42, gap * 0.76, h * 0.42 + 2, gap * 0.3); }
  return o;
}
SCENES.film = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0), P = n6_painter([far, refl, mid, near]);
  var sky = dk ? 'linear-gradient(180deg,#160F1E 0%,#211527 30%,#2A1A2E 62%,#3A1A2A 100%)' : 'linear-gradient(180deg,#E7D3C3 0%,#F4E7DC 40%,#EFDDCD 70%,#D7B6A0 100%)';
  var C = dk ? {pil: '#33203A', pilL: '#43293F', gold: '#B98A3E', goldL: '#E4B868', goldD: '#6E4A26', open: '#14091A', cur: '#7E1B2D', curD: '#561121', curL: '#A23446', scr: '#EADCC0', stage: '#3A1424', plum: '#2A1020', panel: '#FCEBC2', seat: '#701A2A', seatD: '#4C0F1C', seatL: '#9A2E40', arm: '#2A1418', floor: '#1C0E16', glass: '#3A3040', corn: '#F6DC8A', cart: '#9A2234', booth: '#0E0812', metal: '#6A7088', poster: '#4A2A44', posterI: '#C9A25A', lamp: '#FFE2A0'}
    : {pil: '#E6C9B0', pilL: '#F3DFCB', gold: '#D7A24A', goldL: '#F0C978', goldD: '#A8763A', open: '#5A2230', cur: '#B8303F', curD: '#8C1F2E', curL: '#D84E5A', scr: '#FBF5EA', stage: '#8A3440', plum: '#5A1E2E', panel: '#FFF7E4', seat: '#BC3240', seatD: '#8E2232', seatL: '#DC5864', arm: '#5A2A2A', floor: '#8A4A44', glass: '#E4F2F4', corn: '#FFE7A0', cart: '#C8323F', booth: '#3A1E2A', metal: '#8A92A8', poster: '#E8D2B4', posterI: '#B8303F', lamp: '#FFF2C8'};
  // layout
  var sx0, sx1, sy0, sy1, px0, px1, py0, stY, bx;
  if (ph) { sx0 = W * 0.08; sx1 = W * 0.92; sy0 = H * 0.205; sy1 = H * 0.365; px0 = -W * 0.02; px1 = W * 1.02; py0 = H * 0.16; stY = H * 0.41; bx = null; }   // phone: below the app's header
  else { sx0 = W * 0.205; sx1 = W * 0.755; sy0 = H * 0.135; sy1 = H * 0.5; px0 = sx0 - W * 0.07; px1 = sx1 + W * 0.07; py0 = H * 0.085; stY = H * 0.585; bx = [W * 0.865, H * 0.04, W * 0.985, H * 0.165]; }
  var cx = (sx0 + sx1) / 2, fw = ph ? 12 : 22, x, k;
  // ---- the wall plane: pilasters with fluting, a deco frieze, a poster, sconces, the booth window ----
  var pil = rect(-20, -20, W + 40, H * 0.06 + 20), pilL = '', pxs = ph ? [] : [W * 0.035, px0 - W * 0.035, px1 + W * 0.035, W * 0.985];
  pxs.forEach(function (x) { var w = W * 0.032; pil += rect(x - w / 2, H * 0.06, w, H); for (var q = -1; q <= 1; q++) pilL += rect(x + q * w * 0.28 - 1.6, H * 0.09, 3.2, H * 0.6); });
  P.f(C.pil, pil).f(C.pilL, pilL);
  var gold = rect(-20, H * 0.06 + 4, W + 40, 3), goldD = rect(-20, H * 0.06, W + 40, 5);
  for (x = -10; x < W + 20; x += 34) { goldD += n6_poly([[x, H * 0.06], [x + 17, H * 0.06 - 12], [x + 34, H * 0.06]]); gold += n6_circ(x + 17, H * 0.06 - 4, 2.4); }
  var sconces = [], poster = '', posterI = '', booth = '';
  if (!ph) {
    var pw = W * 0.085, pxx = W * 0.025, py = H * 0.25, phh = pw * 1.45;
    gold += rect(pxx - 6, py - 6, pw + 12, phh + 12); poster = rect(pxx, py, pw, phh); posterI = n6_star(pxx + pw / 2, py + phh * 0.42, pw * 0.3, pw * 0.13, 5) + rect(pxx + pw * 0.15, py + phh * 0.78, pw * 0.7, 4) + rect(pxx + pw * 0.25, py + phh * 0.86, pw * 0.5, 3);
    sconces.push([W * 0.068, H * 0.13], [px1 + W * 0.035, H * 0.36]);
    goldD += rrect(bx[0] - 8, bx[1] - 8, bx[2] - bx[0] + 16, bx[3] - bx[1] + 16, 6); booth = rrect(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1], 3);
  } else sconces.push([W * 0.07, H * 0.105], [W * 0.93, H * 0.105]);
  var lamp = '', ss = ph ? 0.55 : 1;
  sconces.forEach(function (s) { var x = s[0], y = s[1] + 14 * ss; gold += n6_arc(x, y, 0, 26 * ss, Math.PI * 1.08, Math.PI * 1.92, 14) + rect(x - 3 * ss, y - 4 * ss, 6 * ss, 22 * ss); for (var q = 0; q < 5; q++) { var a = Math.PI * (1.18 + q * 0.16); goldD += n6_line(x, y, x + Math.cos(a) * 24 * ss, y + Math.sin(a) * 24 * ss, 1.6 * ss); } lamp += n6_arc(x, y, 0, 13 * ss, Math.PI * 1.04, Math.PI * 1.96, 10); });
  P.f(C.goldD, goldD).f(C.gold, gold).f(C.poster, poster).f(C.posterI, posterI).f(C.booth, booth).f(C.lamp, lamp);
  // ---- the proscenium plane: stepped deco crown, gold frame, the dark opening, the screen, curtains ----
  var a1 = W * (ph ? 0.3 : 0.19), a2 = W * (ph ? 0.22 : 0.14);
  P.f(C.goldD, n6_poly([[px0, stY], [px0, py0], [cx - a1, py0], [cx - a1, py0 - H * 0.02], [cx - a2, py0 - H * 0.02], [cx - a2, py0 - H * 0.04], [cx + a2, py0 - H * 0.04], [cx + a2, py0 - H * 0.02], [cx + a1, py0 - H * 0.02], [cx + a1, py0], [px1, py0], [px1, stY]]));
  var oy0 = py0 + fw * 0.9;
  P.f(C.gold, rect(px0 + 3, py0 + 3, px1 - px0 - 6, stY - py0));
  var flu = rect(px0 + 3, py0 + 3, px1 - px0 - 6, 3); [px0 + fw * 0.3, px0 + fw * 0.62, px1 - fw * 0.38, px1 - fw * 0.7].forEach(function (x) { flu += rect(x - 1.2, oy0 + 6, 2.4, stY - oy0 - 12); });
  for (k = -3; k <= 3; k++) flu += n6_line(cx + k * a2 * 0.28, py0 - H * 0.036, cx + k * a2 * 0.36, py0 - H * 0.004, 2);
  P.f(C.goldL, flu);
  P.f(C.open, rect(px0 + fw, oy0, px1 - px0 - 2 * fw, stY - oy0));
  P.f(C.scr, rect(sx0, sy0, sx1 - sx0, sy1 - sy0));
  var tieY = sy0 + (sy1 - sy0) * 0.62, cL = n6_curtain(px0 + fw, sx0 + 2, oy0, stY, tieY, 0.25, ph ? 3 : 4), cR = n6_curtain(px1 - fw, sx1 - 2, oy0, stY, tieY, 0.25, ph ? 3 : 4);
  if (!ANIM) {   // the picture on the screen when still: sepia hills under a rising sun (the engine plays the real film), left clear of the curtains
    var clipX = function (y) { return [Math.max(sx0, cL.inner(y) + 12), Math.min(sx1, cR.inner(y) - 12)]; };
    var hA = function (u) { return 0.62 + 0.06 * Math.sin(u * 7 + 1) + 0.03 * Math.sin(u * 17); }, hB = function (u) { return 0.75 + 0.05 * Math.sin(u * 5 + 3) + 0.02 * Math.sin(u * 13 + 1); };
    var inHill = function (hf) { return function (x, y) { var c = clipX(y); return x >= c[0] && x <= c[1] && y > sy0 + hf((x - sx0) / (sx1 - sx0)) * (sy1 - sy0); }; };
    P.s('#C9AE84', 2.4, n6_hatchCols(sx0, sx1, sy0 + (sy1 - sy0) * 0.5, sy1, 2.4, inHill(hA)));
    var birds = ''; [[0.3, 0.24], [0.36, 0.2], [0.66, 0.28]].forEach(function (q) { var bx = sx0 + (sx1 - sx0) * q[0], by = sy0 + (sy1 - sy0) * q[1], bs = (sy1 - sy0) * 0.03; birds += 'M' + PT(bx - bs, by + bs * 0.4) + 'Q' + PT(bx - bs * 0.4, by - bs * 0.5) + ' ' + PT(bx, by) + 'Q' + PT(bx + bs * 0.4, by - bs * 0.5) + ' ' + PT(bx + bs, by + bs * 0.4); });
    P.s('#9C7C52', 2.4, n6_hatchCols(sx0, sx1, sy0 + (sy1 - sy0) * 0.6, sy1, 2.4, inHill(hB)) + birds);
  }
  var vy1 = sy0 - 2, vy0 = oy0, val = rect(px0 + fw, vy0, px1 - px0 - 2 * fw, (vy1 - vy0) * 0.62), sw = ph ? 34 : 48, valD = '', valL = '';
  function sag(xa, xb, f0, f1) { return function (xx) { return vy0 + (vy1 - vy0) * (f0 + f1 * Math.sin(Math.PI * (xx - xa) / (xb - xa))); }; }
  for (x = px0 + fw; x < px1 - fw - 1; x += sw) { var x2 = Math.min(px1 - fw, x + sw);
    val += n6_poly(n6_fnP(x, x2, (x2 - x) / 10, sag(x, x2, 0.55, 0.45)).concat([[x2, vy0 + 2], [x, vy0 + 2]]));
    valD += n6_poly(n6_fnP(x, x2, (x2 - x) / 10, sag(x, x2, 0.55, 0.45)).concat(n6_fnP(x, x2, (x2 - x) / 10, sag(x, x2, 0.42, 0.4)).reverse())); valL += rect(x + sw * 0.45, vy0 + 2, 2.5, (vy1 - vy0) * 0.5); }
  P.f(C.cur, cL.base + cR.base + val).f(C.curD, cL.dark + cR.dark + valD).f(C.curL, cL.light + cR.light + valL);
  // ---- the stage plane: apron, footlights, marquee sign, tassels, the popcorn cart and the projector ----
  var apH = ph ? H * 0.022 : H * 0.035, foot = [], ax0 = px0 - (ph ? 0 : W * 0.02), aw = px1 - px0 + (ph ? 0 : W * 0.04);
  P.f(C.stage, rect(ax0, stY, aw, apH));
  if (!ANIM) { var sun = [cx, sy0 + (sy1 - sy0) * 0.4, (sy1 - sy0) * 0.12], rays = ''; for (k = 0; k < 12; k++) { var ra = k * Math.PI / 6; rays += 'M' + PT(sun[0] + Math.cos(ra) * sun[2] * 1.3, sun[1] + Math.sin(ra) * sun[2] * 1.3) + 'L' + PT(sun[0] + Math.cos(ra) * sun[2] * 1.75, sun[1] + Math.sin(ra) * sun[2] * 1.75); }
    P.s('#EBCB82', n1(sun[2] * 2), 'M' + PT(sun[0], sun[1]) + 'l0 0'); P.s('#EBCB82', 3, rays); }
  var mw = ph ? W * 0.62 : W * 0.3, mh = ph ? H * 0.06 : H * 0.07, mx = cx - mw / 2, my = ph ? H * 0.092 : H * 0.01, bulbs = [];
  var pc = ph ? {x: W * 0.06, w: W * 0.3, y: H * 0.6, h: H * 0.2} : {x: W * 0.835, w: W * 0.13, y: H * 0.47, h: H * 0.36};
  var gx0 = pc.x + pc.w * 0.08, gx1 = pc.x + pc.w * 0.92, gy0 = pc.y + pc.h * 0.17, gy1 = pc.y + pc.h * 0.6;
  P.f(C.plum, rect(ax0, stY + apH * 0.55, aw, apH * 0.45) + rrect(mx - 10, my - 8, mw + 20, mh + 16, 10) + n6_poly([[cx - mw * 0.16, my + mh + 8], [cx + mw * 0.16, my + mh + 8], [cx + mw * 0.08, my + mh + 20], [cx - mw * 0.08, my + mh + 20]]));
  var panel = rrect(mx, my, mw, mh, 5); for (x = px0 + fw + 16; x < px1 - fw - 8; x += ph ? 30 : 46) { panel += n6_ell(x, stY + 2, ph ? 4 : 6, ph ? 2.4 : 3.4); foot.push([x, stY]); }
  P.f(C.panel, panel);
  P.f(C.cart, n6_poly([[pc.x - pc.w * 0.04, pc.y + pc.h * 0.17], [pc.x + pc.w * 0.12, pc.y], [pc.x + pc.w * 0.88, pc.y], [pc.x + pc.w * 1.04, pc.y + pc.h * 0.17]]) + rect(pc.x, gy1, pc.w, pc.h * 0.3));
  P.f(C.glass, rect(gx0, gy0, gx1 - gx0, gy1 - gy0));
  var heap = '', hy = gy1 - (gy1 - gy0) * 0.32; for (x = gx0 + 4; x < gx1 - 2; x += pc.w * 0.07) heap += n6_circ(x, hy + Math.sin(x * 0.7) * 3, pc.w * 0.065); heap += rect(gx0, hy, gx1 - gx0, gy1 - hy);
  P.f(C.corn, heap);
  var kx = (gx0 + gx1) / 2, ky = gy0 + (gy1 - gy0) * 0.28, kr = pc.w * 0.16, metal = n6_arc(kx, ky - kr * 0.2, 0, kr, 0, Math.PI, 12) + rect(kx - kr * 1.05, ky - kr * 0.3, kr * 2.1, kr * 0.2) + rect(kx - 1.5, gy0, 3, ky - gy0) + rect(kx + kr * 0.9, ky - kr * 0.1, kr * 0.5, 3);
  var proj = null;
  if (bx) { var bw = bx[2] - bx[0], bh = bx[3] - bx[1]; proj = {x: bx[0] + bw * 0.55, y: bx[1] + bh * 0.66, s: bh / 100}; var s = proj.s;
    metal += rrect(proj.x - 30 * s, proj.y - 16 * s, 56 * s, 34 * s, 6 * s) + rect(proj.x - 44 * s, proj.y - 6 * s, 16 * s, 14 * s) + rect(proj.x - 10 * s, proj.y + 18 * s, 10 * s, 22 * s);
    if (!ANIM) [-18, 20].forEach(function (dx) { var rx = proj.x + dx * s, ry = proj.y - 40 * s; metal += n6_circ(rx, ry, 22 * s) + circ(rx, ry - 11 * s, 6 * s) + circ(rx + 10 * s, ry + 6 * s, 6 * s) + circ(rx - 10 * s, ry + 6 * s, 6 * s); }); }
  P.f(C.metal, metal);
  var trims = rect(ax0, stY - 2, aw, 4) + rect(px0 + fw, oy0 - 3, px1 - px0 - 2 * fw, 5);
  [cL.tie, cR.tie].forEach(function (t) { trims += n6_ell(t[0], t[1], ph ? 7 : 11, ph ? 4 : 6) + n6_poly([[t[0] - 3, t[1] + 3], [t[0] + 3, t[1] + 3], [t[0] + (ph ? 6 : 8), t[1] + (ph ? 18 : 28)], [t[0] - (ph ? 6 : 8), t[1] + (ph ? 18 : 28)]]); });
  var nb = ph ? 15 : 22, nv = 3; for (k = 0; k < nb; k++) bulbs.push([mx + mw * (k + 0.5) / nb, my - 4]); for (k = 0; k < nv; k++) bulbs.push([mx + mw + 5, my + mh * (k + 0.5) / nv]); for (k = nb - 1; k >= 0; k--) bulbs.push([mx + mw * (k + 0.5) / nb, my + mh + 4]); for (k = nv - 1; k >= 0; k--) bulbs.push([mx - 5, my + mh * (k + 0.5) / nv]);
  trims += n6_star(mx + mw * 0.07, my + mh / 2, mh * 0.22, mh * 0.09, 5) + n6_star(mx + mw * 0.93, my + mh / 2, mh * 0.22, mh * 0.09, 5);
  if (!ANIM) { bulbs.forEach(function (b) { trims += n6_circ(b[0], b[1], ph ? 2.2 : 2.8); }); for (k = 0; k < 4; k++) trims += rrect(mx + mw * (0.26 + k * 0.13), my + mh * 0.3, mw * 0.08, mh * 0.4, 2); }
  trims += rect(pc.x - pc.w * 0.04, pc.y + pc.h * 0.15, pc.w * 1.08, pc.h * 0.035) + rect(pc.x - pc.w * 0.02, gy1, pc.w * 1.04, pc.h * 0.035) + n6_circ(pc.x + pc.w / 2, pc.y - pc.h * 0.03, pc.w * 0.07) + rect(pc.x + pc.w * 0.06, pc.y + pc.h * 0.88, pc.w * 0.05, pc.h * 0.12) + rect(pc.x + pc.w * 0.89, pc.y + pc.h * 0.88, pc.w * 0.05, pc.h * 0.12)
    + rect(gx0 - 2, gy0, 3, gy1 - gy0) + rect(gx1 - 1, gy0, 3, gy1 - gy0) + rect(pc.x + pc.w * 0.1, gy1 + pc.h * 0.08, pc.w * 0.8, pc.h * 0.02);
  if (proj) trims += n6_circ(proj.x - 46 * proj.s, proj.y + proj.s, 7 * proj.s);
  P.f(C.gold, trims);
  // ---- the stalls: rows of velvet seats, the nearest row biggest ----
  P.jump(near);
  var rows = ph ? [[H * 0.78, 34, 30, 6], [H * 0.885, 46, 42, 8], [H * 1.0, 60, 56, 10]] : [[H * 0.75, 40, 40, 8], [H * 0.86, 56, 54, 10], [H * 0.99, 74, 72, 14]];
  var sb = '', sd = '', sh = '', sa = '', heads = '', carpet = '';
  rows.forEach(function (r, i) { var x0 = -r[1] * (0.3 + i * 0.37), o = n6_seats(x0, W + 40, r[0], r[1], r[2], r[3]); sb += o.back; sd += o.shade; sh += o.hi; sa += o.arm;
    // a few people already in their seats (rows 1 and 2), seen from behind: heads over the seat backs
    if (i < 2) for (var j = 0, xx = x0; xx < W + 20; j++, xx += r[1] + r[3]) { var hh = hash(j * 7.3 + i * 31 + (ph ? 5 : 0)); if (hh > (ph ? 0.18 : 0.14)) continue;
      var hx = xx + r[1] / 2, hr = r[1] * 0.32, hy = r[0] - r[2] - hr * 0.55; heads += n6_circ(hx, hy, hr) + n6_tomb(hx - r[1] * 0.42, hy + hr * 0.6, r[1] * 0.84, r[2], r[1] * 0.3);
      if (hh < 0.05) heads += n6_circ(hx + hr * 0.2, hy - hr * 0.95, hr * 0.42); else if (hh < 0.09) heads += n6_ell(hx - hr * 0.95, hy - hr * 0.1, hr * 0.28, hr * 0.36) + n6_ell(hx + hr * 0.95, hy - hr * 0.1, hr * 0.28, hr * 0.36); } });
  // the carpet: a deco diamond pattern on the aisles between the rows
  for (var ri = 0; ri < rows.length - 1; ri++) { var cy0 = rows[ri][0], cy1 = rows[ri + 1][0] - rows[ri + 1][2], cs = (cy1 - cy0) * 0.5; if (cs < 5) continue; for (x = (ri % 2) * cs; x < W + cs; x += cs * 2.2) carpet += n6_poly([[x, cy0 + cs * 0.3], [x + cs * 0.55, cy0 + cs], [x, cy0 + cs * 1.7], [x - cs * 0.55, cy0 + cs]]); }
  P.f(C.floor, rect(-20, rows[0][0] - 1, W + 40, H)).f(dk ? '#241420' : '#7E423E', carpet).f(dk ? '#0E070C' : '#4A2228', heads).f(C.seat, sb).f(C.seatD, sd).f(C.seatL, sh).f(C.arm, sa);
  if (ANIM) { ANIM.screen = [sx0, sy0, sx1 - sx0, sy1 - sy0]; ANIM.bulbs = bulbs; ANIM.marq = [mx, my, mw, mh]; ANIM.sconces = sconces.map(function (q) { return [q[0], q[1] + 14 * ss, ss]; }); ANIM.foot = foot; ANIM.glass = [gx0, gy0, gx1 - gx0, gy1 - gy0, hy]; ANIM.cart = [pc.x + pc.w / 2, pc.y + pc.h * 0.085, pc.w]; ANIM.proj = proj;
    ANIM.lens = proj ? [proj.x - 46 * proj.s, proj.y + proj.s] : [W * 1.05, -H * 0.04]; ANIM.ph = ph; ANIM.cols = C; ANIM.rows = rows; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
// ==== /n6:film ====
// ==== n6:culinary ====
// =====================================================================================================
// 2. Test Kitchen: a bright professional kitchen. Subway tiles, a window with an herb box, copper pots on a rack,
//    the pass with heat lamps and order tickets, and the range with pots on the burners.
// =====================================================================================================
// a hanging copper pot (side view) at x, y = top of the rim, width w
// window-box herbs, growing up from x, y: 0 basil, 1 rosemary, 2 chives
function n6_herb(x, y, kind, s) { var d = '', k;
  if (kind === 0) { d += n6_line(x, y, x, y - 30 * s, 2 * s); [[-1, 8], [1, 13], [-1, 18], [1, 23], [-1, 27], [1, 31]].forEach(function (q, i) { d += n6_leaf(x, y - q[1] * s, (11 - i) * s, (5 - i * 0.4) * s, q[0] < 0 ? -150 : -30); }); }
  else if (kind === 1) { for (k = -1; k <= 1; k++) { var tx = x + k * 7 * s, ty = y - (34 - Math.abs(k) * 8) * s; d += n6_line(x + k * 2 * s, y, tx, ty, 1.6 * s); for (var j = 1; j < 9; j++) { var u = j / 9, px = x + k * 2 * s + (tx - x - k * 2 * s) * u, py = y + (ty - y) * u; d += n6_leaf(px, py, 6 * s, 1.1 * s, -90 - 40 - k * 10) + n6_leaf(px, py, 6 * s, 1.1 * s, -90 + 40 - k * 10); } } }
  else { for (k = -2; k <= 2; k++) d += n6_leaf(x + k * 1.5 * s, y, (30 - Math.abs(k) * 4) * s, 1.6 * s, -90 + k * 9); }
  return d; }
function n6_pot(x, y, w, h) { var r = w / 2, b = [[x - r, y], [x - r, y + h * 0.78]], i; for (i = 1; i <= 6; i++) { var a = Math.PI - i / 6 * Math.PI / 2; b.push([x - r * 0.78 + Math.cos(a) * r * 0.22, y + h * 0.78 + Math.sin(a) * h * 0.22]); } for (i = 0; i <= 6; i++) { a = Math.PI / 2 - i / 6 * Math.PI / 2; b.push([x + r * 0.78 + Math.cos(a) * r * 0.22, y + h * 0.78 + Math.sin(a) * h * 0.22]); } b.push([x + r, y]);
  var lid = []; for (i = 0; i <= 12; i++) { a = Math.PI + i / 12 * Math.PI; lid.push([x + Math.cos(a) * r * 0.98, y - 2 + Math.sin(a) * h * 0.26]); }
  return {body: n6_poly(b) + n6_arc(x - r, y + h * 0.3, h * 0.08, h * 0.16, Math.PI * 0.5, Math.PI * 1.5, 8) + n6_arc(x + r, y + h * 0.3, h * 0.08, h * 0.16, -Math.PI * 0.5, Math.PI * 0.5, 8) + n6_poly(lid) + n6_circ(x, y - h * 0.3, h * 0.07),
    rim: rect(x - r * 1.04, y - 2, w * 1.04, 5), hi: rect(x - r * 0.68, y + h * 0.12, w * 0.08, h * 0.62) + n6_arc(x, y - 2, h * 0.17, h * 0.2, Math.PI * 1.15, Math.PI * 1.45, 6), dark: rect(x + r * 0.45, y + 3, r * 0.42, h * 0.85) + rect(x - r * 1.04, y - 2, w * 1.04, 3)}; }
SCENES.culinary = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0), P = n6_painter([far, refl, mid, near]);
  var sky = dk ? 'linear-gradient(180deg,#1C1A22 0%,#262229 38%,#2E2830 68%,#5A3E34 100%)' : 'linear-gradient(180deg,#F2E3CF 0%,#FBF4EA 36%,#F8F3EA 66%,#DCE8D2 100%)';
  var C = dk ? {grout: 'rgba(255,240,220,0.06)', bs: '#2C3A36', bsG: 'rgba(0,0,0,0.25)', view: '#1E2650', viewC: '#F4ECD0', viewF: '#18203E', viewM: '#141A30', frame: '#5A4A48', wood: '#7A4E32', terra: '#9A4E36', glass: '#1E2232', lid: '#C8794A', steelD: '#4A505E', cop: '#B8673A', copD: '#7A3E22', copL: '#E8955E', hood: '#5A6070', bulb: '#FFC070', plate: '#D8D2C8', food: '#C87A3A', top: '#7A8090', front: '#4E5462', oven: '#141018', dark: '#22202A', pot: '#8A94A4', utens: '#9A7050'}
    : {grout: 'rgba(170,150,120,0.22)', bs: '#CFE3C8', bsG: 'rgba(90,130,90,0.25)', view: '#BFE3F5', viewC: '#FFFFFF', viewF: '#9CCB8A', viewM: '#6FAE6A', frame: '#FFFFFF', wood: '#C8925A', terra: '#D8754E', glass: '#E8F3F2', lid: '#E39A5A', steelD: '#8E99A6', cop: '#D97B45', copD: '#A8532C', copL: '#F6A877', hood: '#C3CCD5', bulb: '#FFB45A', plate: '#FFFFFF', food: '#E89A4A', top: '#EEF2F5', front: '#C9D2DA', oven: '#4A5262', dark: '#4A4E5A', pot: '#C9D2DA', utens: '#B07A48'};
  var x, y, k;
  var win = ph ? [W * 0.05, H * 0.1, W * 0.4, H * 0.14] : [W * 0.035, H * 0.06, W * 0.17, H * 0.24], ctop = H * (ph ? 0.8 : 0.755);
  var fr = ph ? 6 : 9, board = ph ? null : [W * 0.77, H * 0.37, W * 0.18, H * 0.22];
  // ---- the wall: subway tile joints (a stroke slot: they leave out the window and the menu board), green tiles behind the range ----
  var tw = ph ? 30 : 44, th = tw / 2, gr = '', bsy = ctop - H * (ph ? 0.08 : 0.13), bsG = '';
  var skip = [[win[0] - fr * 2 - 2, win[1] - fr - 2, win[2] + fr * 4 + 4, win[3] + fr * 2.4 + 4]].concat(board ? [[board[0] - 10, board[1] - 10, board[2] + 20, board[3] + 24]] : []);
  var hseg = function (y, x0, x1) { var segs = [[x0, x1]]; skip.forEach(function (q) { if (y < q[1] || y > q[1] + q[3]) return; var o = []; segs.forEach(function (sg) { if (sg[1] <= q[0] || sg[0] >= q[0] + q[2]) o.push(sg); else { if (sg[0] < q[0]) o.push([sg[0], q[0]]); if (sg[1] > q[0] + q[2]) o.push([q[0] + q[2], sg[1]]); } }); segs = o; }); return segs.map(function (sg) { return 'M' + PT(sg[0], y) + 'L' + PT(sg[1], y); }).join(''); };
  var vseg = function (x, y0, y1) { return skip.some(function (q) { return x > q[0] && x < q[0] + q[2] && y1 > q[1] && y0 < q[1] + q[3]; }) ? '' : 'M' + PT(x, y0) + 'L' + PT(x, y1); };
  for (y = th, k = 1; y < bsy; y += th, k++) { gr += hseg(y, -20, W + 20); for (x = (k % 2) * tw / 2 - tw; x < W + tw; x += tw) gr += vseg(x, y, Math.min(bsy - 1, y + th)); }
  for (x = -tw; x < W + tw; x += tw) gr += vseg(x, -2, th);
  P.s(C.grout, 1.3, gr).f(C.bs, rect(-20, bsy, W + 40, ctop - bsy + 4));
  for (y = bsy + th * 0.8, k = 1; y < ctop; y += th * 0.8, k++) { bsG += 'M-20 ' + n1(y) + 'L' + n1(W + 20) + ' ' + n1(y); for (x = (k % 2) * tw / 4 - tw / 2; x < W + tw; x += tw / 2) bsG += 'M' + PT(x, y) + 'L' + PT(x, Math.min(ctop, y + th * 0.8)); }
  for (x = -tw / 2; x < W + tw; x += tw / 2) bsG += 'M' + PT(x, bsy) + 'L' + PT(x, bsy + th * 0.8);
  P.s(C.bsG, 1.4, bsG);
  // ---- the window and its view ----
  var wx = win[0], wy = win[1], ww = win[2], wh = win[3], hz = wy + wh * 0.68;
  P.f(C.view, rect(wx, wy, ww, wh));
  var vc = ''; if (dk) { vc = n6_circ(wx + ww * 0.72, wy + wh * 0.24, ph ? 9 : 13); spread(wx, wy, ww, wh * 0.55, 26, 22, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - wx - ww * 0.72, c.y - wy - wh * 0.24) > 20) vc += n6_circ(c.x, c.y, 0.6 + c.r * 0.9); }); }
  else { vc = n6_cloud(wx + ww * 0.3, wy + wh * 0.28, ww * 0.1) + n6_cloud(wx + ww * 0.78, wy + wh * 0.18, ww * 0.07); }
  P.f(C.viewC, vc);
  P.f(C.viewF, n6_below(n6_fnP(wx - 4, wx + ww + 4, 6, function (x) { return hz - wh * 0.08 + Math.sin(x * 0.05) * wh * 0.05; }), wy + wh));
  var bush = '', br = Math.min(ww * 0.085, wh * 0.1); for (x = wx + br; x < wx + ww - br + 1; x += (ww - 2 * br) / Math.round((ww - 2 * br) / (ww * 0.12))) bush += n6_circ(x, hz + wh * 0.16 + Math.sin(x) * 3, br);   // the bushes stay inside the window bush += rect(wx, hz + wh * 0.16, ww, wy + wh - hz - wh * 0.16);
  if (!dk) bush += rect(wx + ww * 0.632, hz - wh * 0.2, ww * 0.036, wh * 0.22) + n6_circ(wx + ww * 0.65, hz - wh * 0.27, ww * 0.085) + n6_circ(wx + ww * 0.585, hz - wh * 0.2, ww * 0.065) + n6_circ(wx + ww * 0.715, hz - wh * 0.2, ww * 0.065);   // a round-crowned tree on the hill
  P.f(C.viewM, bush);
  var frame = rect(wx - fr, wy - fr, ww + 2 * fr, fr) + rect(wx - fr, wy, fr, wh) + rect(wx + ww, wy, fr, wh) + rect(wx + ww / 2 - 2.5, wy, 5, wh) + rect(wx, wy + wh * 0.48 - 2.5, ww, 5);
  // the chalkboard menu (its writing comes from the engine; drawn here when still) shares the sill's wood
  var bwood = board ? rect(board[0] - 8, board[1] - 8, board[2] + 16, board[3] + 16) + rect(board[0] - 4, board[1] + board[3] + 6, board[2] + 8, 5) : '';
  P.f(C.frame, frame).f(C.wood, rect(wx - fr * 2, wy + wh, ww + fr * 4, fr * 1.2) + bwood);
  if (board) P.f(dk ? '#22362E' : '#2F4A3E', rect(board[0], board[1], board[2], board[3]));
  // the herb box on the sill (herbs come from the engine)
  var hb = [wx + ww * 0.06, wy + wh + fr * 1.2, ww * 0.88, ph ? 16 : 26], herbs = [];
  var nh = ph ? 7 : 9; for (k = 0; k < nh; k++) herbs.push({x: hb[0] + hb[2] * (k + 0.5) / nh, y: hb[1] + 4, kind: k % 3, s: (ph ? 0.7 : 1) * (0.85 + 0.3 * ((k * 37) % 7) / 7)});
  // ---- the pot rack: a bar on chains with copper pots and pans hanging ----
  var pots = [], rack = null, bar = '';
  if (!ph) { rack = [W * 0.255, W * 0.61, H * 0.06]; bar = rect(rack[0], rack[2], rack[1] - rack[0], 6) + n6_circ(rack[0], rack[2] + 3, 5) + n6_circ(rack[1], rack[2] + 3, 5) + n6_line(rack[0] + 20, rack[2], rack[0] + 50, -10, 2.4) + n6_line(rack[1] - 20, rack[2], rack[1] - 50, -10, 2.4);
    // hung side by side without touching: [kind, width (of W), height (of H), hook length]
    var items = [['pan', 0.05, 0.06, 6], ['pot', 0.058, 0.1, 14], ['pan', 0.06, 0.08, 4], ['pot', 0.05, 0.11, 18], ['pan', 0.045, 0.07, 8], ['ladle', 0.034, 0.09, 4]];
    var span = function (q) { return W * q[1] + (q[0] === 'pot' ? H * q[2] * 0.7 * 0.32 + 4 : 0); }, tot = items.reduce(function (a, q) { return a + span(q); }, 0), gap = (rack[1] - rack[0] - 12 - tot) / (items.length - 1), px = rack[0] + 6;
    items.forEach(function (q) { var w = span(q), cx = px + w / 2, hook = rack[2] + 6; px += w + gap; bar += n6_line(cx, rack[2] + 3, cx, hook + q[3], 2) + n6_arc(cx, hook + q[3] + 2, 2, 3.6, -Math.PI * 0.2, Math.PI * 1.1, 6); pots.push({x: cx, y: hook + q[3] + 4, kind: q[0], w: W * q[1], h: H * q[2]}); });
  }
  // ---- the pass: hood with heat lamps, the ticket rail and the shelf with plated dishes ----
  var ps = ph ? [W * 0.52, W * 0.98, H * 0.0, H * 0.215] : [W * 0.67, W * 0.985, H * 0.0, H * 0.27], pw = ps[1] - ps[0], lamps = [], tickets = [];
  var hoodB = ps[2] + H * (ph ? 0.095 : 0.06), railY = hoodB + H * (ph ? 0.03 : 0.05), shelfY = ps[3];
  var nl = ph ? 2 : 3; for (k = 0; k < nl; k++) lamps.push([ps[0] + pw * (k + 0.5) / nl, hoodB + (ph ? 10 : 16)]);
  var nt = ph ? 4 : 6; for (k = 0; k < nt; k++) tickets.push([ps[0] + pw * (0.1 + 0.8 * (k + 0.5) / nt) + (rnd() - 0.5) * 8, railY + 3, (ph ? 22 : 34) * (0.92 + rnd() * 0.16), k]);
  // the static picture, in this order: wall things (refl) then the rack, pots, pass (mid)
  P.f(C.steelD, bar + rect(ps[0] + pw * 0.02, railY - 2, pw * 0.96, 5) + rect(ps[0] - 6, shelfY + (ph ? 6 : 10), 10, ph ? 10 : 18) + rect(ps[1] - 4, shelfY + (ph ? 6 : 10), 10, ph ? 10 : 18));
  var cop = '', copD = '', copL = '';
  pots.forEach(function (p) { if (p.kind === 'pan') { cop += n6_circ(p.x, p.y + p.w * 0.5 + 10, p.w * 0.5) + rrect(p.x - 4, p.y - 6, 8, 20, 4); copD += n6_circ(p.x, p.y + p.w * 0.5 + 10, p.w * 0.38); copL += n6_arc(p.x, p.y + p.w * 0.5 + 10, p.w * 0.39, p.w * 0.47, Math.PI * 1.1, Math.PI * 1.5, 8) + n6_circ(p.x, p.y + 1, 3); }
    else if (p.kind === 'pot') { var o = n6_pot(p.x, p.y + p.h * 0.3 + 4, p.w, p.h * 0.7); cop += o.body + o.rim; copD += o.dark; copL += o.hi; }
    else { cop += rect(p.x - 2, p.y, 4, p.h * 0.75) + n6_ell(p.x, p.y + p.h * 0.82, p.w * 0.5, p.w * 0.36); copL += n6_circ(p.x - p.w * 0.15, p.y + p.h * 0.79, p.w * 0.12); } });
  P.f(C.cop, cop).f(C.copD, copD).f(C.copL, copL);
  // hood and lamps
  var hood = n6_poly([[ps[0] - pw * 0.02, ps[2] - 10], [ps[1] + 10, ps[2] - 10], [ps[1] + 10, hoodB], [ps[0] - pw * 0.02, hoodB]]), shade = '';
  lamps.forEach(function (l) { hood += rect(l[0] - 1.5, hoodB, 3, l[1] - hoodB - 6); shade += n6_poly([[l[0] - (ph ? 9 : 14), l[1]], [l[0] - 4, l[1] - (ph ? 8 : 11)], [l[0] + 4, l[1] - (ph ? 8 : 11)], [l[0] + (ph ? 9 : 14), l[1]]]); });
  P.m(C.steelD, shade + rect(ps[0] - pw * 0.02, shelfY + (ph ? 7 : 11), pw * 1.04 + 10, ph ? 2 : 3));
  P.f(C.hood, hood + rect(ps[0] - pw * 0.02, shelfY, pw * 1.04 + 10, ph ? 7 : 11)).f(C.bulb, lamps.map(function (l) { return n6_ell(l[0], l[1], ph ? 6 : 9, ph ? 2.4 : 3.4); }).join(''));
  // plated dishes on the pass
  var plates = '', food = '', garn = '', np = ph ? 2 : 3;
  for (k = 0; k < np; k++) { var qx = ps[0] + pw * (k + 0.5) / np, pr = ph ? 22 : 34; plates += n6_ell(qx, shelfY - 1, pr, pr * 0.22) + rect(qx - pr * 0.45, shelfY - 3, pr * 0.9, 4); food += n6_ell(qx - pr * 0.1, shelfY - pr * 0.18, pr * 0.42, pr * 0.24) + n6_circ(qx + pr * 0.3, shelfY - pr * 0.16, pr * 0.18); garn += n6_leaf(qx - pr * 0.12, shelfY - pr * 0.4, pr * 0.3, pr * 0.1, -60 + k * 30) + n6_circ(qx + pr * 0.32, shelfY - pr * 0.3, pr * 0.07); }
  var clock = ph ? null : [W * 0.638, H * 0.175, 24];
  if (!ANIM) { tickets.forEach(function (t) { plates += rect(t[0] - t[2] * 0.32, t[1], t[2] * 0.64, t[2]); }); if (clock) plates += n6_circ(clock[0], clock[1], clock[2]); }
  P.f(C.plate, plates);
  if (!ANIM && clock) { var cl = clock; P.s(dk ? '#3A3A44' : '#E25A4A', 4, n6_circ(cl[0], cl[1], cl[2] + 2));
    P.s('#3A3440', 2, n6_dots(Array.from({length: 12}, function (_, i) { var a = i * Math.PI / 6; return [cl[0] + Math.cos(a) * cl[2] * 0.8, cl[1] + Math.sin(a) * cl[2] * 0.8]; })) + 'M' + PT(cl[0], cl[1]) + 'L' + PT(cl[0] + cl[2] * 0.42, cl[1] - cl[2] * 0.2) + 'M' + PT(cl[0], cl[1]) + 'L' + PT(cl[0] - cl[2] * 0.12, cl[1] - cl[2] * 0.66)); }
  P.f(C.food, food).f('#5DA84E', garn);
  // ---- the front: the range with ovens and burners, the stockpot; then (above canvas A) the herb box, a utensil crock and the saucepan ----
  P.f(C.top, rect(-20, ctop, W + 40, H * 0.024));
  P.f(C.front, rect(-20, ctop + H * 0.024, W + 40, H));
  var ovens = ph ? [[W * 0.04, W * 0.92]] : [[W * 0.06, W * 0.38], [W * 0.42, W * 0.74]], oy = ctop + H * (ph ? 0.06 : 0.075), glassP = '', darkP = '';
  ovens.forEach(function (o) { glassP += rrect(o[0] + (o[1] - o[0]) * 0.16, oy + H * 0.055, (o[1] - o[0]) * 0.68, H * 0.075, 8); darkP += rrect(o[0], oy, o[1] - o[0], 5, 2) + rrect(o[0] + (o[1] - o[0]) * 0.12, oy + H * 0.02, (o[1] - o[0]) * 0.76, H * 0.012, H * 0.006); });
  if (!ph) darkP += rect(W * 0.78, ctop + H * 0.024, 4, H) + rrect(W * 0.8, ctop + H * 0.075, W * 0.17, H * 0.012, 4) + rrect(W * 0.8, ctop + H * 0.17, W * 0.17, H * 0.012, 4);
  P.f(C.oven, glassP);
  // burners: grates on the counter, knobs on the front
  var burners = ph ? [[W * 0.22, 1], [W * 0.5, 0.75], [W * 0.78, 1]] : [[W * 0.17, 1.15], [W * 0.38, 0.8], [W * 0.6, 1]], kn = '';
  burners.forEach(function (b) { var bw = W * (ph ? 0.2 : 0.11) * b[1]; darkP += rect(b[0] - bw / 2, ctop - 5, bw, 5) + rect(b[0] - bw / 2, ctop - 9, 5, 9) + rect(b[0] + bw / 2 - 5, ctop - 9, 5, 9); kn += n6_circ(b[0], ctop + H * 0.045, ph ? 6 : 8); });
  P.f(C.dark, darkP + kn);
  // the stockpot (lid from the engine) and the saucepan
  var sp = burners[0], spw = W * (ph ? 0.22 : 0.13), sph = H * (ph ? 0.1 : 0.15), sx0 = sp[0] - spw / 2, sy0 = ctop - 9 - sph;
  var potP = rect(sx0, sy0, spw, sph) + rect(sx0 - 4, sy0, spw + 8, 6) + rrect(sx0 - 16, sy0 + sph * 0.18, 18, 9, 4) + rrect(sx0 + spw - 2, sy0 + sph * 0.18, 18, 9, 4);
  var sauce = burners[1], saw = W * (ph ? 0.15 : 0.085), sah = H * (ph ? 0.055 : 0.07), saX = sauce[0] - saw / 2, saY = ctop - 9 - sah;
  var copP = rect(saX, saY, saw, sah) + rect(saX - 3, saY - 2, saw + 6, 5) + n6_line(saX + saw, saY + 6, saX + saw + saw * 0.9, saY - sah * 0.1, ph ? 5 : 7);
  if (!ANIM) potP += n6_ell(sp[0], sy0 - 3, spw * 0.53, 9) + rrect(sp[0] - 10, sy0 - 18, 20, 9, 4);
  P.f(C.pot, potP);
  // chalk writing on the menu board when still (the engine writes the real menu)
  if (!ANIM && board) { var bb = board, chalk = 'M' + PT(bb[0] + bb[2] * 0.2, bb[1] + bb[3] * 0.24) + 'L' + PT(bb[0] + bb[2] * 0.8, bb[1] + bb[3] * 0.24);
    [[0.13, 0.62], [0.38, 0.55], [0.55, 0.5], [0.72, 0.58]].forEach(function (q, i) { var yy = bb[1] + bb[3] * q[0], x0 = bb[0] + bb[2] * (i ? 0.08 : 0.19), x1 = x0 + bb[2] * q[1]; for (var xx = x0; xx < x1; xx += 7) chalk += 'M' + PT(xx, yy) + 'L' + PT(Math.min(x1, xx + 4.5), yy); });
    P.s('rgba(250,248,240,0.8)', 2.4, chalk); }
  P.s(dk ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)', spw * 0.07, 'M' + PT(sx0 + spw * 0.155, sy0 + 12) + 'L' + PT(sx0 + spw * 0.155, sy0 + sph * 0.78));
  var copFront = copP;
  P.jump(near);
  var box = rect(hb[0], hb[1], hb[2], hb[3]) + rect(hb[0] - 4, hb[1] - 2, hb[2] + 8, hb[3] * 0.24);
  var crock = ph ? null : [W * 0.875, ctop, W * 0.05, H * 0.085];
  if (crock) box += n6_poly([[crock[0] - crock[2] / 2, ctop - crock[3]], [crock[0] + crock[2] / 2, ctop - crock[3]], [crock[0] + crock[2] * 0.42, ctop], [crock[0] - crock[2] * 0.42, ctop]]);
  // utensils sticking out of the crock (behind its rim: drawn first with the wood colour)
  var ut = '';
  if (crock) { var cx0 = crock[0], cy0 = ctop - crock[3]; ut += n6_line(cx0 - 8, cy0 + 4, cx0 - 22, cy0 - 70, 5) + n6_ell(cx0 - 24, cy0 - 78, 9, 13) + n6_line(cx0 + 6, cy0 + 4, cx0 + 16, cy0 - 62, 5) + n6_poly([[cx0 + 9, cy0 - 60], [cx0 + 25, cy0 - 63], [cx0 + 27, cy0 - 92], [cx0 + 11, cy0 - 90]]) + n6_line(cx0, cy0 + 4, cx0 - 2, cy0 - 50, 4); }
  if (!ANIM) P.f(dk ? '#4E8A4A' : '#5DA84E', herbs.map(function (h) { return n6_herb(h.x, h.y, h.kind, h.s); }).join(''));
  P.f(C.utens, ut);
  P.f(C.terra, box);
  P.f(C.cop, copFront).f(C.copL, rect(saX + saw * 0.12, saY + 6, saw * 0.08, sah * 0.62));
  if (ANIM) { ANIM.ph = ph; ANIM.cols = C; ANIM.win = win; ANIM.herbs = herbs; ANIM.hb = hb; ANIM.lamps = lamps; ANIM.tickets = tickets; ANIM.ctop = ctop;
    ANIM.stock = [sp[0], sy0, spw]; ANIM.sauce = [sauce[0], saY, saw]; ANIM.pan = [burners[2][0], ctop - 9, W * (ph ? 0.26 : 0.165)]; ANIM.burners = burners.map(function (b) { return [b[0], ctop - 6, W * (ph ? 0.2 : 0.11) * b[1]]; }); ANIM.pots = pots; ANIM.crock = crock; ANIM.ps = ps; ANIM.ovensX = ovens; ANIM.oy = oy; ANIM.rack = rack; ANIM.ovens = ovens.map(function (o) { return [o[0] + (o[1] - o[0]) * 0.16, oy + H * 0.055, (o[1] - o[0]) * 0.68, H * 0.075]; }); ANIM.board = board; ANIM.clock = clock; }
  else { // the frying pan with its omelette, and the dish towel on the oven handle, drawn still
    var fp = burners[2], fw = W * (ph ? 0.26 : 0.165); P.f(C.dark, n6_ell(fp[0], ctop - 16, fw / 2, fw * 0.16) + n6_line(fp[0] + fw * 0.45, ctop - 18, fp[0] + fw * 0.95, ctop - 30, 8)).f('#F6CE5A', n6_ell(fp[0] - 2, ctop - 19, fw * 0.32, fw * 0.08));
    var ov = ovens[0], tx = ov[0] + (ov[1] - ov[0]) * (ph ? 0.7 : 0.66), tw2 = W * (ph ? 0.09 : 0.045), ty = oy - 2, th2 = H * (ph ? 0.075 : 0.095), tc = tx + tw2 / 2, red = '';
    P.s(dk ? '#C9C2B4' : '#FFFFFF', 2, n6_hatch([{p: [[tx - 2, ty - 6], [tx + tw2 + 2, ty - 6], [tx + tw2 * 1.02, ty + th2], [tx - tw2 * 0.02, ty + th2]]}], 2));
    for (k = 0; k < 4; k++) red += 'M' + PT(tx + 2, ty + th2 * (0.3 + k * 0.17)) + 'L' + PT(tx + tw2 - 2, ty + th2 * (0.3 + k * 0.17));
    for (k = 0; k < 3; k++) red += 'M' + PT(tx + tw2 * (0.2 + k * 0.3), ty + 2) + 'L' + PT(tx + tw2 * (0.2 + k * 0.3), ty + th2 - 2);
    P.s(dk ? 'rgba(168,70,62,0.8)' : 'rgba(226,90,74,0.75)', 2.6, red); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
// ==== /n6:culinary ====
// ==== n6:marinebio ====
// =====================================================================================================
// 3. Kelp Forest: under the sea in a kelp forest. Sunbeams through the surface, tall golden kelp swaying, a reef and a
//    sandy floor with urchins, starfish and anemones, and a small yellow research submarine.
// =====================================================================================================
// one kelp stalk: base (x, y), height h, bend b (sideways lean of the top, px). Returns the stalk points and its blades.
function n6_kelpGeom(x, y, h, b, seed) { var pts = [], bl = [], n = 18, r = SR(seed);
  for (var i = 0; i <= n; i++) { var u = i / n; pts.push([x + b * u * u + Math.sin(u * 5 + seed) * h * 0.012, y - h * u]); }
  for (i = 1; i <= n; i++) { var p = pts[i], q = pts[i - 1], ang = Math.atan2(p[1] - q[1], p[0] - q[0]) * 180 / Math.PI, side = i % 2 ? 1 : -1, L = h * (0.085 + 0.05 * r()) * (i > n - 3 ? 0.6 : 1) * (i < 3 ? 0.7 : 1);
    bl.push([p[0], p[1], L, L * 0.17, ang + side * (34 + r() * 22), side]); }
  return {pts: pts, bl: bl}; }
function n6_kelpPath(g, w) { var d = n6_thick(g.pts, w), bl = '', bd = ''; g.bl.forEach(function (q) { bl += n6_leaf(q[0], q[1], q[2], q[3], q[4]); bd += n6_circ(q[0] + Math.cos(q[4] * Math.PI / 180) * w * 0.8, q[1] + Math.sin(q[4] * Math.PI / 180) * w * 0.8, w * 0.55); }); return {stem: d, blades: bl, bladders: bd}; }
// a spiky sea urchin and a five-armed starfish
function n6_urchin(x, y, r) { var o = []; for (var i = 0; i < 40; i++) { var a = Math.PI + i / 39 * Math.PI, q = i % 2 ? r : r * 1.7; o.push([x + Math.cos(a) * q, y + Math.sin(a) * q * 0.9]); } return n6_poly(o); }
function n6_starfish(x, y, r, rot) { var o = []; for (var i = 0; i < 10; i++) { var a = rot + -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; o.push([x + Math.cos(a) * q, y + Math.sin(a) * q * 0.6]); } return n6_poly(o); }
SCENES.marinebio = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(4), refl = Lay(0), mid = Lay(0), near = Lay(0), P = n6_painter([refl, mid, near]);
  var sky = dk ? 'linear-gradient(180deg,#1E4E52 0%,#123E48 10%,#0E3440 40%,#0A2834 72%,#08202A 100%)' : 'linear-gradient(180deg,#C8EBDD 0%,#A8DFD0 8%,#8FD0C2 30%,#6CBDB4 62%,#5FB6B0 100%)';
  var C = dk ? {ray: 'rgba(150,220,220,0.06)', reef1: '#123C46', reef2: '#0E3440', kelpF: '#1A4A44', kelpF2: '#174238', sand: '#1C3E3E', sandL: '#24504A', sandD: '#163432', rock: '#1E3A44', rockL: '#2A4C56', rockD: '#142A32', urch: '#4A2E5E', star: '#B8584A', anem: '#B8487A', anemL: '#E07AA8', shell: '#C8B8A0', kelp: '#5A6A2E', kelpL: '#7A8A3A', blad: '#8A8A3A', snow: 'rgba(200,240,240,0.35)'}
    : {ray: 'rgba(255,255,240,0.16)', reef1: '#6FB8B0', reef2: '#5AA8A4', kelpF: '#7CBCA6', kelpF2: '#72B29C', sand: '#D8E2B8', sandL: '#E8EECC', sandD: '#BCCCA0', rock: '#6E9AA0', rockL: '#8EB8BA', rockD: '#557E86', urch: '#7A4A9A', star: '#F07A5A', anem: '#F07AA8', anemL: '#FFB0CC', shell: '#FFF4E4', kelp: '#A8902E', kelpL: '#C8B048', blad: '#D8BC4A', snow: 'rgba(255,255,255,0.5)'};
  var x, y, k, floorY = H * (ph ? 0.86 : 0.84);
  // ---- far: sunbeams, a distant reef and faded kelp (softly blurred) ----
  var rays = ''; for (k = 0; k < (ph ? 4 : 7); k++) { var rx = W * (0.05 + k * (ph ? 0.26 : 0.15)) + rnd() * 40, rw = 18 + rnd() * 30; rays += n6_poly([[rx, -10], [rx + rw, -10], [rx + rw + H * 0.35, H * 0.9], [rx + H * 0.35 - rw * 0.4, H * 0.9]]); }
  add(far, 'a', rays, C.ray);
  var reef1 = n6_fnP(-60, W + 60, 10, function (x) { return floorY - H * 0.16 - Math.abs(Math.sin(x / 140 + 1)) * H * 0.1 - Math.sin(x / 47) * 8; }), reef2 = n6_fnP(-60, W + 60, 10, function (x) { return floorY - H * 0.08 - Math.abs(Math.sin(x / 90 + 2)) * H * 0.07; });
  add(far, 'b', n6_below(reef1, H + 10), C.reef1);
  var fk = '', fk2 = '';
  for (k = 0; k < (ph ? 5 : 11); k++) { x = W * (k + 0.3 + rnd() * 0.4) / (ph ? 5 : 11); var g = n6_kelpGeom(x, floorY - H * 0.1, floorY * (0.75 + rnd() * 0.2), (rnd() - 0.5) * 60, k * 7 + 3), kp = n6_kelpPath(g, ph ? 3 : 4); if (k % 2) fk += kp.stem + kp.blades; else fk2 += kp.stem + kp.blades; }
  add(far, 'c', fk, C.kelpF); add(far, 'd', fk2, C.kelpF2);
  add(far, 'e', n6_below(reef2, H + 10), C.reef2);
  // marine snow
  var snow = ''; spread(0, H * 0.05, W, floorY - H * 0.05, 60, 60, rnd, 1).forEach(function (c) { if (c.q < 0.5) snow += n6_circ(c.x, c.y, 0.8 + c.r * 1.2); });
  P.f(C.snow, snow);
  // ---- the sandy floor (back part) and the mid kelp (drawn by the engine when animating) ----
  var sandTop = n6_fnP(-60, W + 60, 8, function (x) { return floorY + Math.sin(x / 120) * 8 + Math.sin(x / 41 + 1) * 3; });
  P.f(C.sand, n6_below(sandTop, H + 10));
  var ripples = ''; for (k = 0; k < 9; k++) { var ry = floorY + 18 + k * (H - floorY) / 9; for (x = (k % 2) * 40 - 30; x < W + 30; x += 90 + (k * 13) % 40) ripples += n6_thick(n6_fnP(x, x + 46, 6, function (xx) { return ry + Math.sin((xx - x) / 46 * Math.PI) * -3; }), 2); }
  P.f(C.sandD, ripples);
  // kelp stalks: positions shared with the engine
  var kelps = [], kx = ph ? [0.06, 0.24, 0.62, 0.86, 0.97] : [0.03, 0.115, 0.23, 0.33, 0.5, 0.775, 0.875, 0.965];
  kx.forEach(function (f, i) { var h = (floorY + 10) * (0.9 + 0.12 * ((i * 37) % 5) / 5), xx = W * f; kelps.push({x: xx, y: floorY + 14, h: h, b: (i % 2 ? 1 : -1) * W * 0.03, seed: i * 11 + 5, w: (ph ? 4.5 : 6.5) * (0.85 + 0.3 * ((i * 17) % 4) / 4)}); });
  if (!ANIM) { var st = '', bls = '', bds = ''; kelps.forEach(function (q) { var kp = n6_kelpPath(n6_kelpGeom(q.x, q.y, q.h, q.b, q.seed), q.w); st += kp.stem; bls += kp.blades; bds += kp.bladders; }); P.f(C.kelp, st).f(C.kelpL, bls).f(C.blad, bds); }
  // ---- near: rocks, urchins, starfish, anemones, shells, the sand front ----
  var rocks = '', rockL = '', rockD = '', urch = '', star = '', anem = [], shells = '';
  var rk = ph ? [[0.08, 1.2], [0.32, 0.7], [0.92, 1.3], [0.7, 0.8]] : [[0.035, 1.6], [0.13, 1.0], [0.4, 0.8], [0.68, 0.9], [0.83, 1.4], [0.95, 1.1]];
  rk.forEach(function (q, i) { var x0 = W * q[0], r0 = (ph ? 34 : 48) * q[1], y0 = floorY + 22 + (i % 2) * 10; rocks += n6_ell(x0, y0, r0 * 1.3, r0 * 0.8) + n6_ell(x0 + r0 * 0.9, y0 + r0 * 0.15, r0 * 0.8, r0 * 0.55); rockL += n6_ell(x0 - r0 * 0.4, y0 - r0 * 0.42, r0 * 0.6, r0 * 0.22); rockD += n6_ell(x0 + r0 * 0.5, y0 + r0 * 0.5, r0 * 1.1, r0 * 0.3);
    if (i % 2 === 0) urch += n6_urchin(x0 + r0 * 0.4, y0 - r0 * 0.66, r0 * 0.16); if (i % 3 === 1) star += n6_starfish(x0 - r0 * 0.5, y0 - r0 * 0.1, r0 * 0.28, 0.3 * i); if (i % 2 === 1 || i === 0) anem.push([x0 - r0 * 0.1 + r0 * 0.4 * (i % 2), y0 - r0 * 0.7, r0 * 0.34]); });
  for (k = 0; k < (ph ? 4 : 8); k++) { x = W * (k + 0.5) / (ph ? 4 : 8) + (rnd() - 0.5) * 60; y = floorY + 30 + rnd() * (H - floorY - 50); shells += n6_arc(x, y, 0, 7, Math.PI, Math.PI * 2, 8) + rect(x - 2, y, 4, 2); }
  // the little research sub, drawn still (the engine flies it when animating)
  if (!ANIM) { var sb = ph ? [W * 0.62, H * 0.24, W * 0.3] : [W * 0.6, H * 0.18, W * 0.15], L = sb[2]; P.f(dk ? '#C89A22' : '#F2C230', n6_ell(sb[0], sb[1], L * 0.5, L * 0.22) + rrect(sb[0] - L * 0.12, sb[1] - L * 0.36, L * 0.26, L * 0.18, L * 0.05) + n6_poly([[sb[0] - L * 0.48, sb[1]], [sb[0] - L * 0.6, sb[1] - L * 0.12], [sb[0] - L * 0.6, sb[1] + L * 0.12]])).f(dk ? '#FFD88A' : '#BFE8F2', n6_circ(sb[0] + L * 0.24, sb[1] - L * 0.01, L * 0.11) + n6_circ(sb[0] - L * 0.12, sb[1], L * 0.05) + n6_circ(sb[0] - L * 0.27, sb[1], L * 0.05)); }
  P.f(C.rockD, rockD);
  var OT = ph ? [W * 0.25, H * 0.03, 0.8] : [W * 0.47, H * 0.035, 1.15];
  if (!ANIM) {   // still: the otter napping on the surface and a few fish (the engine animates them)
    var os = OT[2], ox = OT[0], oy = OT[1], O = function (px, py) { return [ox + px * os, oy + py * os]; };
    var oE = function (px, py, rx, ry, a) { return n6_rot(ox + px * os, oy + py * os, rx * os, ry * os, a || 0); };
    var oBrown = oE(0, 0, 30, 11) + oE(-30, 2, 10, 4, -11) + oE(-24, -9, 3.6, 6, -40) + oE(-18, -10, 3.6, 6, -20) + oE(32, -6, 11, 11) + oE(26, -15, 3.2, 3.2) + oE(37, -16, 3.2, 3.2);
    var oLight = oE(4, -3, 18, 7) + oE(35, -3, 7, 6), oShell = oE(6, -9, 6.5, 6.5), oPaw = oE(1, -10, 3.5, 2.6) + oE(11, -10, 3.5, 2.6);
    var fishes = ph ? [[0.22, 0.46, 1, 0], [0.72, 0.62, -1, 1]] : [[0.3, 0.46, 1, 0], [0.74, 0.56, -1, 1], [0.47, 0.66, 1, 0]], fo = '', fy = '', ff = '', eyes = [{e: [O(35.5, -2.8)[0], O(35.5, -2.8)[1], 2 * os, 1.4 * os]}];
    fishes.forEach(function (q) { var fs = ph ? 1.15 : 1.7, fx = W * q[0], fyy = H * q[1], d = q[2], P2 = function (px, py) { return [fx + px * fs * d, fyy + py * fs]; };
      var body = n6_ell(fx, fyy, 10 * fs, 6.5 * fs), fin = n6_poly([P2(-8, 0), P2(-15, -6), P2(-14, 0), P2(-15, 6)]) + n6_poly([P2(-2, -6), P2(2, -11.5), P2(6, -6)]);
      if (q[3]) fy += body; else fo += body; ff += fin; eyes.push({e: [fx + 5 * fs * d, fyy - 1 * fs, 1.5 * fs, 1.5 * fs]}); });
    P.f('#8A5A3A', oBrown).f('#C89A72', oLight).f(dk ? '#C8B8A0' : '#FFF4E4', oShell).f('#7A4C30', oPaw);
    P.f(dk ? '#E8743A' : '#FF8A3A', fo).f(dk ? '#F2C230' : '#FFD23A', fy).f(dk ? '#C85A2A' : '#F06A2A', ff);
    P.s('#3A2A3A', 2, n6_hatch(eyes, 2) + 'M' + PT(O(28, -7)[0], O(28, -7)[1]) + 'L' + PT(O(31.5, -7)[0], O(31.5, -7)[1]) + 'M' + PT(O(38.5, -7)[0], O(38.5, -7)[1]) + 'L' + PT(O(42, -7)[0], O(42, -7)[1]));
  }
  // kelp holdfasts: the root-claws that hold each stalk to the sea floor (above the swaying kelp; left out where a rock is in front)
  var hold = '', rockHit = function (x, y) { return rk.some(function (q, i) { var x0 = W * q[0], r0 = (ph ? 34 : 48) * q[1], y0 = floorY + 22 + (i % 2) * 10; return Math.pow((x - x0) / (r0 * 1.3), 2) + Math.pow((y - y0) / (r0 * 0.8), 2) < 1 || Math.pow((x - x0 - r0 * 0.9) / (r0 * 0.8), 2) + Math.pow((y - y0 - r0 * 0.15) / (r0 * 0.55), 2) < 1; }); };
  kelps.forEach(function (q) { var bx = q.x + Math.sin(q.seed) * q.h * 0.012, by = q.y; if (rockHit(bx, by - 4)) return;
    [-1, -0.4, 0.3, 1].forEach(function (s, j) { hold += 'M' + PT(bx, by - q.w * 1.2) + 'Q' + PT(bx + s * q.w * 1.4, by - q.w * 0.6) + ' ' + PT(bx + s * q.w * (2.2 + (j % 2) * 0.6), by + q.w * 0.5); }); hold += 'M' + PT(bx, by - q.w * 2) + 'L' + PT(bx, by); });
  P.jump(near);
  P.f(C.rock, rocks).f(C.rockL, rockL).f(C.urch, urch).f(C.star, star);
  // anemones: a column with tentacles (swaying tentacles come from the engine)
  var an = '', anL = ''; anem.forEach(function (a) { an += rect(a[0] - a[2] * 0.5, a[1] - a[2] * 0.6, a[2], a[2] * 0.9) + n6_ell(a[0], a[1] - a[2] * 0.6, a[2] * 0.75, a[2] * 0.25); if (!ANIM) for (var j = -4; j <= 4; j++) anL += n6_leaf(a[0] + j * a[2] * 0.15, a[1] - a[2] * 0.62, a[2] * (0.7 + 0.15 * Math.cos(j)), a[2] * 0.11, -90 + j * 14); });
  P.f(C.anem, an).f(C.anemL, anL);
  P.f(C.shell, shells);
  P.f(C.sandL, n6_below(n6_fnP(-60, W + 60, 10, function (x) { return H - (ph ? 18 : 24) + Math.sin(x / 80 + 2) * 6; }), H + 10));
  P.s(C.kelp, ph ? 2.4 : 3, hold);
  if (ANIM) { ANIM.ph = ph; ANIM.cols = C; ANIM.kelps = kelps; ANIM.anem = anem; ANIM.floorY = floorY;
    ANIM.sub = ph ? [W * 0.62, H * 0.24, W * 0.3] : [W * 0.6, H * 0.18, W * 0.15]; ANIM.otter = OT; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
// ==== /n6:marinebio ====
// ==== n6:vet ====
// =====================================================================================================
// 4. Vet Clinic: a friendly animal clinic. An X-ray light box, a window, a clock and diplomas on the wall, a counter with
//    the treat jar, the exam table with today's patient, and kennels with puppies and a kitten.
// =====================================================================================================
function n6_bone(x, y, L, r, ang) { var c = Math.cos(ang), s = Math.sin(ang), hx = c * L / 2, hy = s * L / 2, nx = -s * r * 0.55, ny = c * r * 0.55;
  return n6_poly([[x - hx + nx, y - hy + ny], [x + hx + nx, y + hy + ny], [x + hx - nx, y + hy - ny], [x - hx - nx, y - hy - ny]]) + n6_circ(x - hx + nx * 0.9, y - hy + ny * 0.9, r * 0.62) + n6_circ(x - hx - nx * 0.9, y - hy - ny * 0.9, r * 0.62) + n6_circ(x + hx + nx * 0.9, y + hy + ny * 0.9, r * 0.62) + n6_circ(x + hx - nx * 0.9, y + hy - ny * 0.9, r * 0.62); }
function n6_paw(x, y, r) { return n6_ell(x, y + r * 0.35, r * 0.62, r * 0.5) + n6_ell(x - r * 0.62, y - r * 0.28, r * 0.24, r * 0.3) + n6_ell(x - r * 0.22, y - r * 0.62, r * 0.24, r * 0.3) + n6_ell(x + r * 0.22, y - r * 0.62, r * 0.24, r * 0.3) + n6_ell(x + r * 0.62, y - r * 0.28, r * 0.24, r * 0.3); }
// a sitting puppy for the still scene (the engine animates the real ones): its shapes by colour, in the engine's pup units
// (origin between the front paws, s = scale). o: {patch, spots, tail}. Returns {fur, ear, light (fill paths), ink (hatch shapes), collar}
function n6_pupStill(x, y, s, o) {
  function E(cx, cy, rx, ry) { return n6_ell(x + cx * s, y + cy * s, rx * s, ry * s); }
  var r = {fur: '', ear: '', light: '', ink: [], collar: ''};
  r.fur = n6_rot(x + 17 * s, y - 4 * s, 10 * s, 3.4 * s, -12) + E(0, -22, 17, 21) + rrect(x - 11 * s, y - 16 * s, 8 * s, 16 * s, 4 * s) + rrect(x + 3 * s, y - 16 * s, 8 * s, 16 * s, 4 * s) + E(0, -50, 17, 17);
  r.light = E(0, -18, 10.5, 15) + E(-7, -1.5, 5.4, 3.2) + E(7, -1.5, 5.4, 3.2) + E(0, -43, 9.5, 7.5) + E(0, -59, 3, 6);
  r.ear = (o.patch ? n6_rot(x - 7 * s, y - 54 * s, 7 * s, 6 * s, -17) : '') + (o.tail ? n6_rot(x + 25 * s, y - 5.6 * s, 3.6 * s, 2.8 * s, -12) : '');
  var ears = [n6_rot(x - 14.7 * s, y - 46.8 * s, 6.5 * s, 12 * s, -14), n6_rot(x + 14.7 * s, y - 46.8 * s, 6.5 * s, 12 * s, 14)];
  if (o.spots) { [[-10, -28, 3], [9, -32, 2.4], [-6, -10, 2.2], [12, -14, 2.6]].forEach(function (q) { r.ink.push({e: [x + q[0] * s, y + q[1] * s, q[2] * s, q[2] * s]}); });
    r.ink.push({p: n6_ellP(x - 14.7 * s, y - 46.8 * s, 6.5 * s, 12 * s, -0.25)}, {p: n6_ellP(x + 14.7 * s, y - 46.8 * s, 6.5 * s, 12 * s, 0.25)}); }
  else r.ear += ears.join('');
  r.ink.push({e: [x - 6.5 * s, y - 53 * s, 2.5 * s, 2.7 * s]}, {e: [x + 6.5 * s, y - 53 * s, 2.5 * s, 2.7 * s]}, {e: [x, y - 46.6 * s, 3.6 * s, 2.6 * s]});
  r.collar = n6_ell(x, y - 31.5 * s, 10 * s, 2.6 * s);
  return r;
}
// a sitting kitten for the still scene, in the engine's kitten units
function n6_kitStill(x, y, s) {
  function P(pts) { return {p: pts.map(function (q) { return [x + q[0] * s, y + q[1] * s]; })}; }
  var fur = [{e: [x, y - 18 * s, 14 * s, 18 * s]}, {e: [x, y - 42 * s, 15 * s, 13 * s]}, P([[-13, -46], [-12, -61], [-3, -53]]), P([[13, -46], [12, -61], [3, -53]]),
    {p: n6_ellP(x - 17 * s, y - 13 * s, 3 * s, 13 * s, 0.5)}, {p: n6_ellP(x + 10 * s, y - 12 * s, 3.5 * s, 10 * s, -0.25)}];
  var light = n6_ell(x, y - 14 * s, 8 * s, 11 * s) + n6_ell(x - 7 * s, y - 1.5 * s, 5 * s, 3 * s) + n6_ell(x + 9 * s, y - 2 * s, 4.4 * s, 3 * s) + n6_poly([[x - 10.6 * s, y - 49 * s], [x - 10.6 * s, y - 57 * s], [x - 5.4 * s, y - 52.4 * s]]) + n6_poly([[x + 10.6 * s, y - 49 * s], [x + 10.6 * s, y - 57 * s], [x + 5.4 * s, y - 52.4 * s]]);
  var ink = [{e: [x - 6 * s, y - 43 * s, 2.2 * s, 2.4 * s]}, {e: [x + 6 * s, y - 43 * s, 2.2 * s, 2.4 * s]}, P([[-3, -54.6], [3, -54.6], [0, -48]])];
  return {fur: fur, light: light, ink: ink, nose: n6_poly([[x - 1.6 * s, y - 38.6 * s], [x + 1.6 * s, y - 38.6 * s], [x, y - 36.8 * s]])};
}
SCENES.vet = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0), P = n6_painter([far, refl, mid, near]);
  var sky = dk ? 'linear-gradient(180deg,#16223A 0%,#1C2A44 35%,#243250 62%,#3E4A5E 100%)' : 'linear-gradient(180deg,#CFE6F0 0%,#E2F0F4 35%,#F2F7F6 62%,#E2EED8 100%)';
  var C = dk ? {wain: '#2A4A4E', rail: '#3E6064', floor: '#2C3448', tile: '#262E40', base: '#3E6064', frame: '#5A6A84', film: '#0A0E18', bone: 'rgba(200,230,255,0.75)', view: '#1E2A50', viewC: '#F4ECD0', tree: '#1A3A3A', treeD: '#143030', gold: '#B8904A', paper: '#D8D2C2', seal: '#C85A5A', bot1: '#4A8AA8', cab: '#3A4E66', cabD: '#2E3E54', ctop: '#8A9AB0', glass: 'rgba(190,220,240,0.22)', treat: '#C8945A', kback: '#1A2232', lid: '#C85A5A', kframe: '#7A8AA8', bars: '#9AAAC4', steel: '#8A9AB0', steelD: '#5A6A84', mat: '#4A8A8A', ball: '#E8B84A', paw: 'rgba(160,190,230,0.09)', rim: '#3E4E6A', face: '#DCE4EE', tick: '#3A3440'}
    : {wain: '#BEE3D4', rail: '#FFFFFF', floor: '#EEF3EA', tile: '#E0E9DC', base: '#9CCFBE', frame: '#FFFFFF', film: '#1E2A3A', bone: 'rgba(230,245,255,0.92)', view: '#B8E2F6', viewC: '#FFFFFF', tree: '#7CC88A', treeD: '#5AAE72', gold: '#E0B050', paper: '#FFFDF4', seal: '#E25A5A', bot1: '#6AB8E0', cab: '#F6F8FA', cabD: '#DCE6EE', ctop: '#B8D4E4', glass: 'rgba(220,240,255,0.55)', treat: '#E0A866', kback: '#5E6E86', lid: '#F07A7A', kframe: '#FFFFFF', bars: '#C8D6E4', steel: '#D6DEE6', steelD: '#9AA8B6', mat: '#7CCDC0', ball: '#F2C230', paw: 'rgba(255,255,255,0.6)', rim: '#7CCDC0', face: '#FFFFFF', tick: '#3A3440'};
  var A = {tan: '#F2C27A', white: '#FFFFFF', grey: dk ? '#8A8A98' : '#A8A8B8', ear: '#B8783A', cream: '#FFF2DE', ink: '#3A2A3A'};
  var x, y, k, floorY = H * (ph ? 0.88 : 0.86), wainY = H * (ph ? 0.6 : 0.56);
  // ---- layout first (the wallpaper skips everything that hangs on the wall) ----
  var xr = ph ? [W * 0.05, H * 0.11, W * 0.4, H * 0.12] : [W * 0.03, H * 0.06, W * 0.17, H * 0.21];
  var dips = ph ? [] : [[W * 0.455, H * 0.075, W * 0.06, H * 0.1], [W * 0.475, H * 0.2, W * 0.05, H * 0.075]];
  var wn = ph ? [W * 0.57, H * 0.11, W * 0.36, H * 0.12] : [W * 0.665, H * 0.06, W * 0.15, H * 0.19];
  var sh = ph ? null : [W * 0.865, W * 0.99, H * 0.16, H * 0.29];
  var CL = ph ? [W * 0.5, H * 0.3, 18] : [W * 0.6, H * 0.15, 30];
  var ct = ph ? [-10, W * 0.22, H * 0.72] : [-10, W * 0.25, H * 0.69];
  var jar = ph ? [W * 0.1, ct[2] - 8, W * 0.13] : [W * 0.13, ct[2] - 8, W * 0.075], jw = jar[2], jh = jw * 1.1;
  var kn = ph ? {x0: W * 0.5, x1: W * 0.985, y0: H * 0.6, y1: floorY} : {x0: W * 0.71, x1: W * 0.985, y0: H * 0.47, y1: floorY}, cells = [];
  var cw = (kn.x1 - kn.x0) / 2, chh = (kn.y1 - kn.y0) / 2;
  for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) cells.push([kn.x0 + c * cw + 6, kn.y0 + r * chh + 6, cw - 12, chh - 14, r, c]);
  var pgY = cells[0][1] - (ph ? 26 : 36);
  var holes = [[xr[0] - 7, xr[1] - 7, xr[2] + 14, xr[3] + 14], [wn[0] - 10, wn[1] - 7, wn[2] + 20, wn[3] + 15], [CL[0] - CL[2] - 6, CL[1] - CL[2] - 6, CL[2] * 2 + 12, CL[2] * 2 + 12],
    [jar[0] - jw * 0.55, jar[1] - jh - 20, jw * 1.1, jh + 20], [kn.x0 - 4, pgY - 6, kn.x1 - kn.x0 + 10, H]].concat(dips.map(function (d) { return [d[0] - 5, d[1] - 5, d[2] + 10, d[3] + 10]; })).concat(sh ? [[sh[0], sh[2] - 50, sh[1] - sh[0], sh[3] - sh[2] + 56]] : []);
  // ---- the wall: a paw-print wallpaper (a stroke slot), the wainscot and its chair rail, the tiled floor ----
  var paws = '';
  for (y = 22, r = 0; y < wainY - 16; y += 46, r++) for (x = (r % 2) * 40 + 16; x < W + 10; x += 80) {
    if (holes.some(function (q) { return x > q[0] - 10 && x < q[0] + q[2] + 10 && y > q[1] - 10 && y < q[1] + q[3] + 10; })) continue;
    var a = r % 2 ? 0.3 : -0.3, rp = function (px, py) { return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]; };
    paws += n6_dots([rp(-4.3, -2), rp(-1.5, -4.4), rp(1.5, -4.4), rp(4.3, -2)]) + n6_hatch([{p: n6_ellP(rp(0, 2.5)[0], rp(0, 2.5)[1], 4.4, 3.6, a)}], 3.2);
  }
  P.s(C.paw, 3.2, paws);
  P.f(C.wain, rect(-20, wainY, W + 40, floorY - wainY));
  P.s(C.rail, 10, 'M-30 ' + n1(wainY - 1) + 'L' + n1(W + 30) + ' ' + n1(wainY - 1));
  P.f(C.floor, rect(-20, floorY, W + 40, H));
  var tl = '', ts = ph ? 34 : 56; for (y = floorY, k = 0; y < H; y += ts * 0.42, k++) for (x = (k % 2) * ts - ts; x < W + ts; x += ts * 2) tl += n6_poly([[x, y], [x + ts, y], [x + ts * 1.08, y + ts * 0.42], [x + ts * 0.08, y + ts * 0.42]]);
  P.f(C.tile, tl).f(C.base, rect(-20, floorY - 8, W + 40, 9));
  // ---- the X-ray light box: a dog's skeleton, every bone joined to the next ----
  P.f(C.frame, rrect(xr[0] - 7, xr[1] - 7, xr[2] + 14, xr[3] + 14, 6));
  var fx0 = xr[0] + xr[2] * 0.07, fy0 = xr[1] + xr[3] * 0.08, fw = xr[2] * 0.86, fh = xr[3] * 0.84;
  P.f(C.film, rect(fx0, fy0, fw, fh));
  var sk = Math.min(fh / 84, fw / 128), fx = fx0 + fw * 0.5 + 2 * sk, fy = fy0 + fh * 0.48;
  function B(px, py) { return [fx + px * sk, fy + py * sk]; }
  function L(pts, w) { return n6_thick(pts.map(function (q) { return B(q[0], q[1]); }), w * sk); }
  function El(px, py, rx, ry, ang) { return n6_rot(fx + px * sk, fy + py * sk, rx * sk, ry * sk, ang || 0); }
  var bones = El(41, -19, 11, 7.5, 8) + El(51, -13.5, 8, 4.2, 14) + El(35, -12, 4, 2.6, 30);   // skull, snout, jaw hinge
  [[30, -12], [25.5, -10.5]].forEach(function (q) { bones += El(q[0], q[1], 3, 2.6, 30); });      // neck
  for (k = 0; k < 10; k++) { x = 21 - k * 6.2; bones += El(x, -9 - 2.6 * Math.sin(Math.PI * k / 9), 3.1, 2.5); }   // spine
  bones += El(13, -2, 7.5, 3.4, 72) + El(-34, -6, 8.5, 4, -18);                                     // shoulder blade, pelvis
  for (k = 0; k < 6; k++) { x = 10 - k * 5.2; bones += L([[x, -10 - 2.6 * Math.sin(Math.PI * (k + 1.8) / 9)], [x - 1.5, 0], [x - 4.5, 9 - k * 0.6]], 2); }   // ribs
  [[11, 0], [7, 0.5]].forEach(function (q, i) { bones += L([[q[0], q[1]], [q[0] + 2, 16], [q[0] - 1, 31], [q[0] + 2.5, 35.5]], i ? 2.8 : 3.2) + El(q[0] + 4, 36, 3.6, 2.2); });   // front legs
  [[-32, -2], [-37, -2]].forEach(function (q, i) { bones += L([[q[0], q[1]], [q[0] + 6, 15], [q[0] - 2, 27], [q[0] + 1, 35.5]], i ? 2.8 : 3.2) + El(q[0] + 4.5, 36, 3.6, 2.2); });   // hind legs
  bones += L([[-41, -9], [-48, -14], [-54, -21], [-58, -29]], 2.2);                                    // tail
  P.f(C.bone, bones);
  // ---- the window (blinds half down) ----
  P.f(C.view, rect(wn[0], wn[1], wn[2], wn[3]));
  var vc = '';
  if (dk) { vc = n6_circ(wn[0] + wn[2] * 0.25, wn[1] + wn[3] * 0.62, wn[3] * 0.08); for (k = 0; k < 10; k++) vc += n6_circ(wn[0] + wn[2] * rnd(), wn[1] + wn[3] * (0.35 + rnd() * 0.3), 0.8 + rnd()); }
  else vc = n6_cloud(wn[0] + wn[2] * 0.3, wn[1] + wn[3] * 0.45, wn[2] * 0.11);
  P.f(C.viewC, vc);
  var treeD = n6_below(n6_fnP(wn[0], wn[0] + wn[2], 6, function (x) { return wn[1] + wn[3] * 0.8 + Math.sin(x * 0.06) * 4; }), wn[1] + wn[3]), tree = n6_circ(wn[0] + wn[2] * 0.72, wn[1] + wn[3] * 0.52, wn[3] * 0.22) + n6_circ(wn[0] + wn[2] * 0.86, wn[1] + wn[3] * 0.6, wn[3] * 0.17) + n6_circ(wn[0] + wn[2] * 0.6, wn[1] + wn[3] * 0.62, wn[3] * 0.15);
  P.f(C.treeD, treeD + rect(wn[0] + wn[2] * 0.72 - 3, wn[1] + wn[3] * 0.55, 6, wn[3] * 0.35)).f(C.tree, tree);
  var wf = rect(wn[0] - 7, wn[1] - 7, wn[2] + 14, 7) + rect(wn[0] - 7, wn[1], 7, wn[3]) + rect(wn[0] + wn[2], wn[1], 7, wn[3]) + rect(wn[0] - 10, wn[1] + wn[3], wn[2] + 20, 8) + rect(wn[0] + wn[2] / 2 - 2.5, wn[1], 5, wn[3]);
  for (y = wn[1]; y < wn[1] + wn[3] * 0.3; y += 6) wf += rect(wn[0], y, wn[2], 4.4);
  wf += rect(wn[0] + 3, wn[1] + wn[3] * 0.3, wn[2] - 6, 4) + rect(wn[0] + wn[2] * 0.22, wn[1] + wn[3] * 0.3, 1.6, wn[3] * 0.16) + n6_circ(wn[0] + wn[2] * 0.22 + 0.8, wn[1] + wn[3] * 0.47, 2.6);   // the blinds' rail and cord
  P.f(C.frame, wf);
  // ---- diplomas and the supply shelves ----
  var gold = '', paper = '', seal = '', plank = '', b1 = '';
  dips.forEach(function (d) { gold += rect(d[0] - 5, d[1] - 5, d[2] + 10, d[3] + 10); paper += rect(d[0], d[1], d[2], d[3]); seal += n6_star(d[0] + d[2] * 0.72, d[1] + d[3] * 0.74, Math.min(d[2], d[3]) * 0.14, Math.min(d[2], d[3]) * 0.1, 10) + rect(d[0] + d[2] * 0.15, d[1] + d[3] * 0.2, d[2] * 0.7, 2.5) + rect(d[0] + d[2] * 0.15, d[1] + d[3] * 0.38, d[2] * 0.5, 2) + rect(d[0] + d[2] * 0.15, d[1] + d[3] * 0.52, d[2] * 0.36, 1.6); });
  if (sh) [sh[2], sh[3]].forEach(function (yy, i) { plank += rect(sh[0], yy, sh[1] - sh[0], 6) + rect(sh[0] + 10, yy + 6, 4, 8) + rect(sh[1] - 18, yy + 6, 4, 8); for (var j = 0; j < 4; j++) { var bx = sh[0] + 12 + j * (sh[1] - sh[0] - 20) / 4, bh = 22 + ((i * 3 + j * 7) % 4) * 6; if ((i + j) % 2) b1 += rrect(bx, yy - bh, 14, bh, 3) + rect(bx + 4, yy - bh - 5, 6, 6); else b1 += rrect(bx, yy - bh * 0.8, 18, bh * 0.8, 6); } });
  P.f(C.gold, gold + plank).f(C.paper, paper).f(C.seal, seal).f(C.bot1, b1);
  // ---- the wall clock (its hands come from the engine; drawn here when still) ----
  P.s(C.rim, 5, n6_circ(CL[0], CL[1], CL[2] + 2.5));
  P.s(C.face, n1(CL[2] * 2 + 1), 'M' + PT(CL[0], CL[1]) + 'l0 0');
  // ---- the counter with the treat jar ----
  P.f(C.cab, rect(ct[0], ct[2], ct[1] - ct[0], floorY - ct[2] + 4));
  var cabD = rect(ct[0] + 14, ct[2] + 22, (ct[1] - ct[0]) / 2 - 20, floorY - ct[2] - 36) + rect(ct[0] + (ct[1] - ct[0]) / 2 + 6, ct[2] + 22, (ct[1] - ct[0]) / 2 - 20, floorY - ct[2] - 36) + rect(ct[0], floorY - 4, ct[1] - ct[0], 8);
  [ct[0] + (ct[1] - ct[0]) / 2 - 16, ct[0] + (ct[1] - ct[0]) / 2 + 12].forEach(function (hx) { cabD += rrect(hx, ct[2] + 30, 4, 22, 2); });   // door handles
  P.f(C.cabD, cabD).f(C.ctop, rect(ct[0] - 4, ct[2] - 8, ct[1] - ct[0] + 10, 12));
  var treats = ''; for (k = 0; k < 8; k++) { var row = Math.floor(k / 3), col = k % 3; treats += n6_bone(jar[0] - jw * 0.24 + col * jw * 0.24 + (row % 2) * jw * 0.06, jar[1] - jw * 0.13 - row * jw * 0.17, jw * 0.2, jw * 0.06, ((k * 0.7) % 1.0 - 0.5) * 0.8); }
  P.f(C.treat, treats);
  P.f(C.glass, rrect(jar[0] - jw / 2, jar[1] - jh, jw, jh, jw * 0.18));
  // ---- the kennels (2 x 2 crates): backs; the animals sit between the backs and the bars ----
  P.f(C.kback, cells.map(function (q) { return rrect(q[0], q[1], q[2], q[3], 8); }).join(''));
  var et = ph ? [W * 0.21, W * 0.47, H * 0.8] : [W * 0.35, W * 0.6, H * 0.775], ex = (et[0] + et[1]) / 2, TB = [ex, et[2] - 12, et[1] - et[0]];
  var pup = [], kit = null, ink = [], fur = {tan: '', white: '', ear: '', cream: '', collar: ''};
  if (!ANIM) {   // the animals, still: three puppies and the kitten in the kennels, the patient on the table
    [[0, 'tan', {}], [2, 'white', {spots: 1}], [3, 'tan', {patch: 1}]].forEach(function (q) { var c = cells[q[0]], p = n6_pupStill(c[0] + c[2] * 0.48, c[1] + c[3] - 4, c[3] / 92, q[2]); fur[q[1]] += p.fur; fur.ear += p.ear; fur.cream += p.light; fur.collar += p.collar; ink = ink.concat(p.ink); });
    var pt = n6_pupStill(TB[0], TB[1] - 2, TB[2] / (ph ? 88 : 118), {patch: 1, tail: 1}); fur.white += pt.fur; fur.ear += pt.ear; fur.cream += pt.light; fur.collar += pt.collar; ink = ink.concat(pt.ink);
    var kq = cells[1]; kit = n6_kitStill(kq[0] + kq[2] * 0.4, kq[1] + kq[3] - 4, kq[3] / 80); fur.cream += kit.light; ink = ink.concat(kit.ink); fur.collar += kit.nose;
    P.f(A.tan, fur.tan).f(A.white, fur.white);
  }
  P.s(C.tick, 2.2, n6_dots(Array.from({length: 12}, function (_, i) { var a = i * Math.PI / 6; return [CL[0] + Math.cos(a) * CL[2] * 0.8, CL[1] + Math.sin(a) * CL[2] * 0.8]; }))
    + [0, 1, 2, 3].map(function (i) { var a = i * Math.PI / 2; return 'M' + PT(CL[0] + Math.cos(a) * CL[2] * 0.68, CL[1] + Math.sin(a) * CL[2] * 0.68) + 'L' + PT(CL[0] + Math.cos(a) * CL[2] * 0.84, CL[1] + Math.sin(a) * CL[2] * 0.84); }).join('')
    + (ANIM ? '' : 'M' + PT(CL[0], CL[1]) + 'L' + PT(CL[0] + CL[2] * 0.3, CL[1] - CL[2] * 0.4) + 'M' + PT(CL[0], CL[1]) + 'L' + PT(CL[0] - CL[2] * 0.1, CL[1] - CL[2] * 0.7)));
  if (kit) P.s(A.grey, 2, n6_hatch(kit.fur, 2));
  // ---- front: the exam table, a ball, kennel frames, bars and name tags, a "good pet" pennant ----
  P.jump(near);
  if (!ANIM) P.f(A.ear, fur.ear).f(A.cream, fur.cream);
  var c0 = cells[0], c1 = cells[1], gx0 = c0[0], gx1 = c1[0] + c1[2], pts = n6_fnP(gx0, gx1, (gx1 - gx0) / 16, function (xx) { var u = (xx - gx0) / (gx1 - gx0); return pgY + 16 * 4 * u * (1 - u) * 0.5; });
  var flags = [[], [], []]; for (k = 0; k < 9; k++) { var u = (k + 0.5) / 9, fxx = gx0 + (gx1 - gx0) * u, fyy = pgY + 16 * 2 * u * (1 - u) + 1; flags[k % 3].push(n6_poly([[fxx - 7, fyy], [fxx + 7, fyy], [fxx, fyy + 13]])); }
  var bl = TB[2] * 0.6;
  P.f(C.steelD, rect(ex - 10, et[2], 20, floorY - et[2]) + rrect(ex - (et[1] - et[0]) * 0.3, floorY - 8, (et[1] - et[0]) * 0.6, 10, 5) + n6_thick(pts, 1.4));
  P.f(C.steel, rrect(et[0], et[2] - 6, et[1] - et[0], 14, 6) + rect(ex - 14, et[2] + 8, 28, 6));
  P.f(C.mat, rrect(et[0] + 10, et[2] - 12, et[1] - et[0] - 20, 8, 4) + flags[2].join(''));
  var bx0 = ph ? W * 0.62 : W * 0.66, by0 = floorY + (ph ? 30 : 40), br = ph ? 9 : 13;
  P.f(C.ball, n6_circ(bx0, by0, br) + flags[1].join(''));
  P.f(C.kframe, cells.map(function (q) { return rect(q[0] - 6, q[1] - 6, q[2] + 12, 8) + rect(q[0] - 6, q[1] + q[3] - 2, q[2] + 12, 8) + rect(q[0] - 6, q[1], 8, q[3]) + rect(q[0] + q[2] - 2, q[1], 8, q[3]); }).join('') + n6_arc(bx0, by0, br * 0.55, br * 0.72, -Math.PI * 0.25, Math.PI * 0.75, 10));
  P.f(C.seal, cells.map(function (q) { return rrect(q[0] + q[2] * 0.36, q[1] - 13, q[2] * 0.28, 12, 3); }).join('') + flags[0].join('') + fur.collar
    + (ANIM ? '' : rrect(jar[0] - jw * 0.42, jar[1] - jh - 10, jw * 0.84, 12, 5) + rrect(jar[0] - jw * 0.12, jar[1] - jh - 16, jw * 0.24, 8, 4)));
  if (!ANIM) P.s(A.ink, 2, n6_hatch(ink, 2));
  var bars = ''; cells.forEach(function (q) { for (var bx = q[0] + q[2] * 0.12; bx < q[0] + q[2] - 4; bx += q[2] / 9) bars += 'M' + PT(bx, q[1] + 3.6) + 'L' + PT(bx, q[1] + q[3] - 3.6); bars += 'M' + PT(q[0] + 3, q[1] + q[3] * 0.5) + 'L' + PT(q[0] + q[2] - 3, q[1] + q[3] * 0.5); });
  P.s(C.bars, 3.2, bars);
  if (ANIM) { ANIM.ph = ph; ANIM.cols = C; ANIM.cells = cells; ANIM.xr = xr; ANIM.wn = wn; ANIM.jar = [jar[0], jar[1] - jh, jw]; ANIM.table = TB; ANIM.floorY = floorY; ANIM.clock = CL; ANIM.wainY = wainY; ANIM.film = [fx0, fy0, fw, fh]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
// ==== /n6:vet ====
// ==== n6:aerospace ====
// =====================================================================================================
// 5. Launch Pad: a rocket on its pad by the coast. The gantry tower, the control building with its radar, a windsock,
//    the sea and the beach on the left, palms, a countdown board.
// =====================================================================================================
// the rocket, nose up, base centre at (x, y), height h. Returns its parts as paths (still scene) and its key heights.
function n6_rocket(x, y, h) { var w = h * 0.11, s1 = y - h * 0.55, s2 = y - h * 0.86, o = {};
  o.body = rect(x - w / 2, s2, w, y - s2) ;
  var nose = []; for (var i = 0; i <= 12; i++) { var u = i / 12; nose.push([x - w / 2 * Math.cos(u * Math.PI / 2) * 1, s2 - h * 0.14 * Math.sin(u * Math.PI / 2)]); } for (i = 12; i >= 0; i--) { u = i / 12; nose.push([x + w / 2 * Math.cos(u * Math.PI / 2), s2 - h * 0.14 * Math.sin(u * Math.PI / 2)]); }
  o.nose = n6_poly(nose);
  o.shade = rect(x + w * 0.18, s2, w * 0.32, y - s2);
  o.red = n6_poly([[x - w / 2, y - h * 0.12], [x - w * 1.05, y + h * 0.01], [x - w / 2, y]]) + n6_poly([[x + w / 2, y - h * 0.12], [x + w * 1.05, y + h * 0.01], [x + w / 2, y]]) + rect(x - w * 0.12, y - h * 0.1, w * 0.24, h * 0.11) + rect(x - w / 2, s2 + h * 0.04, w, h * 0.025);
  o.dark = rect(x - w / 2, s1 - h * 0.015, w, h * 0.03) + n6_poly([[x - w * 0.32, y], [x + w * 0.32, y], [x + w * 0.42, y + h * 0.04], [x - w * 0.42, y + h * 0.04]]);
  o.win = n6_circ(x, s2 + h * 0.1, w * 0.26);
  o.w = w; o.s1 = s1; o.s2 = s2; return o; }
SCENES.aerospace = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0), P = n6_painter([far, refl, mid, near]);
  var sky = dk ? 'linear-gradient(180deg,#0B1230 0%,#121A40 30%,#18204A 55%,#3A3A6A 78%,#4A3E6A 100%)' : 'linear-gradient(180deg,#9CC9EE 0%,#BBDAF4 30%,#D7EAF8 55%,#F2E1C8 78%,#F6D8B8 100%)';
  var C = dk ? {star: 'rgba(255,248,230,0.85)', moon: '#F6EED8', cloud: 'rgba(120,120,190,0.25)', hill: '#2A2E5A', hill2: '#232650', sea: '#1E2A5A', seaL: 'rgba(200,210,255,0.25)', sand: '#4A4468', grass: '#1E3A3E', grassD: '#18302F', road: '#3A3A50', bld: '#4A5478', bldD: '#3A4466', glass: '#FFD58A', roof: '#5A6488', palm: '#1A3A34', trunk: '#4A3E3A', pad: '#5A5A70', padD: '#44445A', tank: '#A8AEC4', gantry: '#C8503E', gantryD: '#9A3A2E', rw: '#E8E8F0', rshade: '#BEC2D2', rred: '#D8453E', rdark: '#2E2E3E', rwin: '#FFD58A', board: '#22222E', fence: '#6A6A80'}
    : {star: 'rgba(255,255,255,0)', moon: '#FFFFFF', cloud: 'rgba(255,255,255,0.88)', hill: '#A8B8D8', hill2: '#94A8CC', sea: '#5AA8D8', seaL: 'rgba(255,255,255,0.55)', sand: '#F2DCB0', grass: '#8CC88A', grassD: '#72B474', road: '#B8B4AA', bld: '#F2F2F4', bldD: '#D6DAE2', glass: '#7AC0E8', roof: '#C8CCD6', palm: '#4E9E5A', trunk: '#A8784A', pad: '#C8C4BA', padD: '#A8A498', tank: '#F2F2F4', gantry: '#E25A3E', gantryD: '#B8442E', rw: '#FFFFFF', rshade: '#DCE0EA', rred: '#E8453E', rdark: '#3A3A4A', rwin: '#BFE8F8', board: '#2E2E3A', fence: '#9A9AA8'};
  var x, y, k, hz = H * (ph ? 0.62 : 0.6), gy = H * (ph ? 0.78 : 0.74);
  var rk = ph ? {x: W * 0.68, y: gy - 12, h: H * 0.46} : {x: W * 0.8, y: gy - 14, h: H * 0.56}, rw0 = rk.h * 0.11;   // the rocket stands on its launch mount, the nozzle over the flame trench
  // ---- sky: stars and moon or sun glow and clouds ----
  if (dk) { var st = ''; spread(0, 0, W, hz, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.55) st += n6_circ(c.x, c.y, 0.5 + c.r * 1.1); }); P.f(C.star, st); P.f(C.moon, n6_circ(W * (ph ? 0.2 : 0.3), H * (ph ? 0.1 : 0.14), ph ? 16 : 22)); }
  var cl = ''; [[0.12, 0.2, 60], [0.42, 0.12, 46], [0.62, 0.3, 54], [0.3, 0.42, 40]].forEach(function (q) { cl += n6_cloud(W * q[0], H * q[1], q[2] * (ph ? 0.6 : 1)); });
  P.f(C.cloud, cl);
  // ---- distant headland, the sea and the beach ----
  P.f(C.hill2, n6_below(n6_fnP(W * 0.35, W + 60, 10, function (x) { return hz - H * 0.05 - Math.sin((x - W * 0.35) / (W * 0.65) * Math.PI) * H * 0.04 - Math.sin(x / 37) * 3; }), hz + 4));
  P.f(C.hill, n6_below(n6_fnP(W * 0.55, W + 60, 10, function (x) { return hz - H * 0.025 - Math.sin(x / 70) * 6; }), hz + 4));
  P.f(C.sea, rect(-20, hz, W + 40, gy - hz + 10));
  var sl = ''; for (k = 0; k < 18; k++) { x = rnd() * W * 0.75; y = hz + 6 + rnd() * (gy - hz - 20); sl += rect(x, y, 14 + rnd() * 30, 2); }
  P.f(C.seaL, sl);
  var shore = n6_fnP(-60, W + 60, 10, function (x) { var u = Math.max(0, Math.min(1, (x - W * (ph ? 0.2 : 0.3)) / (W * 0.25))); return gy - 4 - u * (gy - hz - 8) * 0.9 + Math.sin(x / 50) * 3; });
  P.f(C.sand, n6_below(shore, H + 10));
  var gr = n6_fnP(-60, W + 60, 10, function (x) { var u = Math.max(0, Math.min(1, (x - W * (ph ? 0.15 : 0.22)) / (W * 0.25))); return gy + 10 - u * (gy - hz) * 0.82 + Math.sin(x / 40) * 2; });
  P.f(C.grass, n6_below(gr, H + 10));
  // road from the control building to the pad
  P.f(C.road, n6_poly([[W * (ph ? 0.1 : 0.15), H + 10], [W * (ph ? 0.32 : 0.3), H + 10], [rk.x - W * 0.03, gy + 14], [rk.x - W * 0.07, gy + 14]]));
  var tuft = ''; spread(0, gy, W, H - gy, 40, 26, rnd, 1).forEach(function (c) { if (c.q < 0.45) tuft += n6_poly([[c.x - 4, c.y], [c.x - 2, c.y - 6], [c.x, c.y - 1], [c.x + 2, c.y - 8], [c.x + 4, c.y]]); });
  P.f(C.grassD, tuft);
  // ---- the control building with its tower cab (left) ----
  var cb = ph ? {x: W * 0.03, w: W * 0.34, y: gy - H * 0.05, tw: W * 0.14} : {x: W * 0.03, w: W * 0.2, y: gy - H * 0.08, tw: W * 0.075}, tx = cb.x + cb.w * 0.62, ty = cb.y - H * (ph ? 0.14 : 0.2);
  P.f(C.bldD, rect(tx - cb.tw * 0.3, ty, cb.tw * 0.6, cb.y - ty + 2) + rect(cb.x, cb.y + (gy - cb.y) * 0.8, cb.w, (gy - cb.y) * 0.3));
  P.f(C.bld, rect(cb.x, cb.y, cb.w, gy - cb.y + 6) + rect(tx - cb.tw * 0.62, ty - 4, cb.tw * 1.24, 10) + rect(tx - cb.tw * 0.5, ty - H * 0.05, cb.tw, 8));
  var glass = n6_poly([[tx - cb.tw * 0.5, ty - H * 0.042], [tx + cb.tw * 0.5, ty - H * 0.042], [tx + cb.tw * 0.58, ty - 4], [tx - cb.tw * 0.58, ty - 4]]), bwin = [];
  for (k = 0; k < (ph ? 4 : 5); k++) { var wx = cb.x + 10 + k * (cb.w - 20) / (ph ? 4 : 5); glass += rect(wx, cb.y + 10, (cb.w - 20) / (ph ? 4 : 5) - 8, (gy - cb.y) * 0.32); bwin.push([wx, cb.y + 10, (cb.w - 20) / (ph ? 4 : 5) - 8, (gy - cb.y) * 0.32]); }
  P.f(C.glass, glass);
  P.f(C.roof, rect(cb.x - 4, cb.y - 5, cb.w + 8, 6) + rect(tx - cb.tw * 0.55, ty - H * 0.055, cb.tw * 1.1, 6) + rect(tx - 1.5, ty - H * 0.09, 3, H * 0.035));
  // palms by the building
  var palms = ph ? [[W * 0.42, 0.8]] : [[W * 0.255, 1], [W * 0.29, 0.8], [W * 0.015, 0.9]], trunk = '', frond = '';
  palms.forEach(function (q) { var px = q[0], ph2 = H * 0.16 * q[1], top = [px + 10 * q[1], gy - ph2]; trunk += n6_thick([[px, gy + 4], [px + 3 * q[1], gy - ph2 * 0.5], top], 6 * q[1]); for (var j = 0; j < 7; j++) { var a = -Math.PI * (0.05 + j * 0.15); frond += n6_leaf(top[0], top[1], 36 * q[1], 7 * q[1], a * 180 / Math.PI + (j > 3 ? 10 : -10)); } frond += n6_leaf(top[0], top[1], 30 * q[1], 6 * q[1], 30) + n6_leaf(top[0], top[1], 30 * q[1], 6 * q[1], 150); });
  P.f(C.trunk, trunk).f(C.palm, frond);
  // ---- the pad: platform, flame trench, water tower, the gantry ----
  var pw = W * (ph ? 0.36 : 0.2), px0 = rk.x - pw * 0.5;
  P.f(C.padD, rect(px0 - 10, gy + 8, pw + 20, H * 0.03) + n6_poly([[rk.x - rk.h * 0.08, gy + 8], [rk.x + rk.h * 0.08, gy + 8], [rk.x + rk.h * 0.05, gy + 8 + H * 0.03], [rk.x - rk.h * 0.05, gy + 8 + H * 0.03]]));
  var gap = rw0 * 0.62;
  P.f(C.pad, rect(px0, gy, rk.x - gap - px0, 10) + rect(rk.x + gap, gy, px0 + pw - rk.x - gap, 10) + rect(rk.x - rw0 * 0.95, rk.y, rw0 * 0.36, gy - rk.y + 2) + rect(rk.x + rw0 * 0.59, rk.y, rw0 * 0.36, gy - rk.y + 2) + rect(rk.x - rw0 * 1.1, rk.y - 3, rw0 * 0.66, 4) + rect(rk.x + rw0 * 0.44, rk.y - 3, rw0 * 0.66, 4));
  var tk = ph ? null : [rk.x - W * 0.13, gy - H * 0.13, W * 0.022];
  var gx = rk.x + rk.h * (ph ? 0.12 : 0.11) + 6, gw = rk.h * 0.075, gtop = rk.y - rk.h * 1.08, gant = '', gantD = '';
  gant += rect(gx, gtop, 5, gy - gtop) + rect(gx + gw - 5, gtop, 5, gy - gtop);
  for (y = gtop; y < gy - 4; y += gw) { gantD += rect(gx, y, gw, 3) + n6_line(gx + 2, y + 2, gx + gw - 2, y + gw - 2, 2) + n6_line(gx + gw - 2, y + 2, gx + 2, y + gw - 2, 2); }
  gant += rect(gx - 6, gtop - 6, gw + 12, 7) + rect(gx + gw / 2 - 1.5, gtop - 26, 3, 20);
  var arms = [0.3, 0.62, 0.86].map(function (f) { return rk.y - rk.h * f; }); arms.forEach(function (ay) { gant += rect(rk.x + rk.h * 0.055, ay - 3, gx - rk.x - rk.h * 0.055 + 2, 6); });
  if (tk) { var lg = tk[2] * 0.22; gant += rect(tk[0] - 2, tk[1], 4, gy - tk[1]) + n6_line(tk[0] - tk[2] * 0.75, tk[1] + tk[2] * 0.9, tk[0] - tk[2] * 1.15, gy, lg) + n6_line(tk[0] + tk[2] * 0.75, tk[1] + tk[2] * 0.9, tk[0] + tk[2] * 1.15, gy, lg)
    + n6_line(tk[0] - tk[2] * 0.95, tk[1] + (gy - tk[1]) * 0.5, tk[0] + tk[2] * 0.95, tk[1] + (gy - tk[1]) * 0.5, lg * 0.8) + n6_line(tk[0] - tk[2] * 0.85, tk[1] + (gy - tk[1]) * 0.25, tk[0] + tk[2] * 0.85, tk[1] + (gy - tk[1]) * 0.75, lg * 0.6) + n6_line(tk[0] + tk[2] * 0.85, tk[1] + (gy - tk[1]) * 0.25, tk[0] - tk[2] * 0.85, tk[1] + (gy - tk[1]) * 0.75, lg * 0.6); }   // a water tower: the tank on splayed, braced legs
  P.f(C.gantryD, gantD).f(C.gantry, gant);
  if (tk) P.f(C.tank, n6_circ(tk[0], tk[1], tk[2] * 1.4)).f(C.rshade, n6_arc(tk[0], tk[1], tk[2] * 0.9, tk[2] * 1.4, -Math.PI * 0.15, Math.PI * 0.6, 10) + rect(tk[0] - tk[2] * 1.38, tk[1] - 1.2, tk[2] * 2.76, 2.4));
  // the rocket (the engine flies it; drawn here when still)
  var R = n6_rocket(rk.x, rk.y, rk.h);
  if (!ANIM) P.f(C.rw, R.body + R.nose).f(C.rshade, R.shade).f(C.rred, R.red).f(C.rdark, R.dark).f(C.rwin, R.win);
  // ---- front: the countdown board, the fence, the windsock pole ----
  P.jump(near);
  var bd = ph ? [W * 0.06, gy + H * 0.06, W * 0.3, H * 0.05] : [W * 0.4, gy + H * 0.05, W * 0.12, H * 0.065], ws = ph ? [W * 0.46, gy + H * 0.02] : [W * 0.6, gy + H * 0.01];
  var fence = ''; for (x = (ph ? W * 0.5 : W * 0.62); x < W + 10; x += 22) fence += rect(x, gy + H * 0.075, 3, 22); fence += rect(ph ? W * 0.5 : W * 0.62, gy + H * 0.075 + 4, W, 2.4) + rect(ph ? W * 0.5 : W * 0.62, gy + H * 0.075 + 13, W, 2.4);
  fence += rect(bd[0] + bd[2] * 0.2, bd[1] + bd[3], 5, H * 0.05) + rect(bd[0] + bd[2] * 0.8 - 5, bd[1] + bd[3], 5, H * 0.05) + rect(ws[0] - 2, ws[1] - H * (ph ? 0.08 : 0.12), 4, H * (ph ? 0.08 : 0.12) + 8);
  P.f(C.fence, fence).f(C.board, rrect(bd[0], bd[1], bd[2], bd[3], 5));
  if (!ANIM) { var wt = ws[1] - H * (ph ? 0.08 : 0.12), wl = ph ? 30 : 42, wh0 = ph ? 7 : 10, sockP = function (a, b) { var w0 = wh0 * (1 - a * 0.5), w1 = wh0 * (1 - b * 0.5), sl = 0.18; return n6_poly([[ws[0] + a * wl, wt - w0 + a * wl * sl], [ws[0] + b * wl, wt - w1 + b * wl * sl], [ws[0] + b * wl, wt + w1 + b * wl * sl], [ws[0] + a * wl, wt + w0 + a * wl * sl]]); };
    P.f('#F26A3A', sockP(0, 0.25) + sockP(0.5, 0.75)).f('#FFFFFF', sockP(0.25, 0.5) + sockP(0.75, 1));
    // the countdown board, still: T-10:00 in seven-segment lights
    var seg = '', dw = bd[3] * 0.26, dh = bd[3] * 0.5, x0 = bd[0] + bd[2] / 2 - dw * 3.6, y0 = bd[1] + bd[3] * 0.25, SEG = {'0': 'abcdef', '1': 'bc'};
    var digit = function (x, ch) { var p = {a: [[0, 0], [1, 0]], b: [[1, 0], [1, 0.5]], c: [[1, 0.5], [1, 1]], d: [[0, 1], [1, 1]], e: [[0, 0.5], [0, 1]], f: [[0, 0], [0, 0.5]]}; SEG[ch].split('').forEach(function (k2) { var q = p[k2]; seg += 'M' + PT(x + q[0][0] * dw, y0 + q[0][1] * dh) + 'L' + PT(x + q[1][0] * dw, y0 + q[1][1] * dh); }); };
    seg += 'M' + PT(x0, y0) + 'L' + PT(x0 + dw, y0) + 'M' + PT(x0 + dw / 2, y0) + 'L' + PT(x0 + dw / 2, y0 + dh) + 'M' + PT(x0 + dw * 1.35, y0 + dh / 2) + 'L' + PT(x0 + dw * 1.95, y0 + dh / 2);
    digit(x0 + dw * 2.3, '1'); digit(x0 + dw * 3.6, '0'); seg += n6_dots([[x0 + dw * 4.95, y0 + dh * 0.28], [x0 + dw * 4.95, y0 + dh * 0.72]]); digit(x0 + dw * 5.4, '0'); digit(x0 + dw * 6.7, '0');
    P.s('#7CFFB0', ph ? 1.6 : 2.2, seg); }
  if (ANIM) { ANIM.ph = ph; ANIM.cols = C; ANIM.rk = rk; ANIM.gy = gy; ANIM.hz = hz; ANIM.board = bd; ANIM.sock = [ws[0], ws[1] - H * (ph ? 0.08 : 0.12)]; ANIM.radar = [tx, ty - H * 0.09]; ANIM.beacon = [gx + gw / 2, gtop - 26]; ANIM.gantry = [gx - 8, gtop - 30, gw + 16, gy - gtop + 30]; ANIM.tower = [tx - cb.tw * 0.62, ty - H * 0.095, cb.tw * 1.24, gy - ty + H * 0.095]; ANIM.arms = arms; ANIM.bwin = bwin; ANIM.cab = [tx, ty - H * 0.02, cb.tw]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
// ==== /n6:aerospace ====
