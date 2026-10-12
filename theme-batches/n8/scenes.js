// ---- batch n8: redwoods (Redwood Grove)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n8_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n8_P(pts) { return poly(n8_cw(pts)); }
function n8_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n8_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n8_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n8_P(rotp(p, x, y, ang)); }
function n8_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n8_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// closed Catmull-Rom smoothing of a point loop
function n8_smooth(p, n) { var o = [], L = p.length; for (var i = 0; i < L; i++) { var a = p[(i - 1 + L) % L], b = p[i], c = p[(i + 1) % L], d = p[(i + 2) % L]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } return o; }
function n8_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return n8_smooth(p, 3); }
// a leaf outline: base at (x,y), pointing along ang (degrees)
function n8_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 12; i++) { var t = i / 12, ww = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n8_leaf(x, y, len, w, ang, bend) { return n8_P(n8_leafPts(x, y, len, w, ang, bend)); }
// a fern frond: a curved rib with paired leaflets; the upper side's leaflets go in out[kl] (lit), the lower in out[kd]; the rib in out.rib
function n8_frond(out, kd, kl, x, y, L, ang, droop, wid, n) { var a = ang * Math.PI / 180, px = x, py = y, rib = [[x, y]], st = L / n; n = n || 18;
  for (var i = 0; i < n; i++) { var u = i / n; a += droop / n; px += Math.cos(a) * st; py += Math.sin(a) * st; rib.push([px, py]);
    if (i > 0) { var lw = L * wid * Math.sin(Math.PI * (0.12 + u * 0.86)) * (1 - u * 0.3); [-1, 1].forEach(function (sd) { var la = a + sd * 1.05, lp = n8_leafPts(px, py, lw, lw * 0.2, la * 180 / Math.PI, sd * 0.12), up = Math.sin(la) < Math.sin(a); out[up ? kl : kd] += n8_P(lp); }); } }
  out.rib += pline(rib); out.tips.push([px, py]); return rib; }
// a moss drape hanging from (x,y): a tapered curtain with a ragged fringe
// hanging moss: a cluster of thin tapered strands from (x,y) across width w
function n8_strands(x, y, w, len, rnd, n, th) { var d = '', t = th || 1.2; for (var i = 0; i < n; i++) { var sx = x - w / 2 + (i + 0.5) / n * w + (rnd() - 0.5) * w / n, l = len * (0.45 + rnd() * 0.7) * (1 - 0.5 * Math.abs((i + 0.5) / n - 0.5)), L = [], R = [], ph = rnd() * 6; for (var k = 0; k <= 6; k++) { var u = k / 6, xx = sx + Math.sin(u * 3 + ph) * 1.5 * u, yy = y + l * u, ww = t * (1 - u * 0.8); L.push([xx - ww, yy]); R.push([xx + ww, yy]); } d += n8_P(L.concat(R.reverse())); } return d; }
// a lumpy moss cushion
function n8_cushion(x, y, w, h, rnd) { var p = [], n = 9; for (var i = 0; i <= n; i++) { var u = i / n, a = Math.PI * (1 + u); p.push([x + Math.cos(a) * w * (0.9 + rnd() * 0.2), y + Math.sin(a) * h * (0.7 + rnd() * 0.5)]); } p.push([x + w * 0.9, y + h * 0.35], [x - w * 0.9, y + h * 0.35]); return n8_P(p); }

// =============== 1. Redwood Grove (redwoods): towering red-brown trunks rising out of frame, sword ferns and sorrel, a fallen mossy log, god rays through fog
// a redwood trunk from yTop (off the top) down to its root flare at yB: the body, its lit (left) strip, its shaded (right) strip and bark furrows
function n8_trunk(x, yTop, yB, w0, w1, lean, flare, rnd) { var L = [], R = [], n = 22, lit = [], litR = [], sh = [], shL = [], fur = '';
  function at(u) { var y = yTop + (yB - yTop) * u, w = w1 + (w0 - w1) * u, fl = flare * Math.pow(Math.max(0, (u - 0.82) / 0.18), 2.2), cx = x + lean * (1 - u); return [cx, y, w / 2 + fl * w * 0.5]; }
  for (var i = 0; i <= n; i++) { var u = i / n, a = at(u), wob = Math.sin(u * 17 + x) * a[2] * 0.015; L.push([a[0] - a[2] + wob, a[1]]); R.push([a[0] + a[2] + wob, a[1]]); lit.push([a[0] - a[2] + wob, a[1]]); litR.unshift([a[0] - a[2] * 0.42 + wob, a[1]]); sh.push([a[0] + a[2] + wob, a[1]]); shL.unshift([a[0] + a[2] * 0.45 + wob, a[1]]); }
  // buttress bumps at the foot
  var foot = [[R[n][0] + w0 * 0.12, yB + 4], [x + w0 * 0.3, yB + 2], [x, yB + 6], [x - w0 * 0.35, yB + 3], [L[n][0] - w0 * 0.14, yB + 5]];
  var nf = Math.max(4, Math.round(w0 / 14)); for (var k = 1; k < nf; k++) { var f = k / nf - 0.5, d = []; for (i = 0; i <= n; i++) { var a2 = at(i / n), xx = a2[0] + f * 2 * a2[2] * (0.92 - 0.05 * Math.abs(f)) + Math.sin(i * 0.9 + k * 2.3) * a2[2] * 0.03; d.push([xx, a2[1]]); }
    var s0 = 0; while (s0 < n) { var len = 3 + Math.floor(rnd() * 6), e = Math.min(n, s0 + len); fur += pline(d.slice(s0, e + 1)); s0 = e + 1 + Math.floor(rnd() * 2); } }
  return {body: n8_P(L.concat(foot.slice().reverse().reverse(), R.slice().reverse())), lit: n8_P(lit.concat(litR)), shade: n8_P(sh.concat(shL)), fur: fur, poly: L.concat(R.slice().reverse())}; }
// a clump of redwood sorrel: three heart-shaped leaflets per leaf
function n8_sorrel(x, y, s, out, kd, kl, rnd) { for (var j = 0; j < 3; j++) { var lx = x + (j - 1) * 7 * s + (rnd() - 0.5) * 4 * s, ly = y - (4 + rnd() * 5) * s, r = (3.4 + rnd() * 1.4) * s, tilt = (rnd() - 0.5) * 0.6;
    for (var q = 0; q < 3; q++) { var a = -Math.PI / 2 + tilt + (q - 1) * 2.0944, hx = lx + Math.cos(a) * r * 0.75, hy = ly + Math.sin(a) * r * 0.45; out[q === 1 ? kl : kd] += n8_RE(hx - Math.cos(a + 1.57) * r * 0.32, hy - Math.sin(a + 1.57) * r * 0.2, r * 0.5, r * 0.34, a * 57.3 + 20) + n8_RE(hx + Math.cos(a + 1.57) * r * 0.32, hy + Math.sin(a + 1.57) * r * 0.2, r * 0.5, r * 0.34, a * 57.3 - 20); } } }
SCENES.redwoods = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(3), refl = Lay(1), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k;
  var sky = dk ? 'linear-gradient(180deg,#0A1424 0%,#122238 40%,#1A3046 70%,#203848 100%)' : 'linear-gradient(180deg,#C6DCD6 0%,#DDE9E0 38%,#ECEFE2 66%,#F2EAD8 100%)';
  var gy = H * (ph ? 0.74 : 0.72);   // the forest floor line
  // the light source up in the canopy (upper left)
  var sx = W * (ph ? 0.18 : 0.22), sy = -H * 0.04;
  add(far, 'a', n8_C(sx, sy + H * 0.06, H * 0.26) + n8_C(sx, sy + H * 0.06, H * 0.14), dk ? 'rgba(170,200,255,0.10)' : 'rgba(255,248,215,0.4)');
  if (dk) add(far, 'h', n8_C(sx + W * 0.04, H * 0.06, ph ? 13 : 18), 'rgba(236,240,255,0.9)');
  // far rows of trunks dissolving into the fog, and the canopy above them
  var far1 = '', far2 = '', can1 = '', can2 = '', xr;
  for (xr = -20; xr < W + 30; xr += (ph ? 22 : 34) + rnd() * 20) { var w1 = (ph ? 6 : 9) + rnd() * 8; far1 += n8_P([[xr - w1 / 2, -10], [xr + w1 / 2, -10], [xr + w1 * 0.7, gy - H * 0.05], [xr - w1 * 0.7, gy - H * 0.05]]); }
  for (xr = -10; xr < W + 30; xr += (ph ? 40 : 66) + rnd() * 40) { var w2 = (ph ? 12 : 18) + rnd() * 12; far2 += n8_P([[xr - w2 / 2, -10], [xr + w2 / 2, -10], [xr + w2 * 0.75, gy - H * 0.02], [xr - w2 * 0.75, gy - H * 0.02]]); }
  spread(-40, -H * 0.02, W + 80, H * 0.14, ph ? 60 : 90, H * 0.07, rnd, 1).forEach(function (c) { var r = (ph ? 26 : 40) + c.r * 30; var bp = n8_P(n8_blob(c.x, c.y + (c.q < 0.5 ? 0 : H * 0.03), r * 1.4, r * 0.55, rnd, 14, 0.35)); for (var m = 0; m < 4; m++) bp += n8_RE(c.x + (m - 1.5) * r * 0.6, c.y + r * 0.45 + (m % 2) * 6, r * 0.42, r * 0.14, (m - 1.5) * 8); if (c.q < 0.5) can1 += bp; else can2 += bp; });
  add(far, 'b', far1, dk ? '#1E2E44' : '#C2CFC8'); add(far, 'c', can1, dk ? '#18283C' : '#B4C8BC');
  add(far, 'd', rect(-60, gy - H * 0.3, W + 120, H * 0.4), dk ? 'rgba(60,90,130,0.25)' : 'rgba(240,242,232,0.45)');
  add(far, 'e', far2, dk ? '#22324A' : '#A8B8AE'); add(far, 'f', can2, dk ? '#1A2C40' : '#9CB4A6');
  add(far, 'g', n8_E(W * 0.5, gy - H * 0.04, W * 0.8, H * 0.08), dk ? 'rgba(70,100,140,0.3)' : 'rgba(246,244,232,0.6)');
  // ---- refl: the far forest floor, mid-distance trunks, fern clumps
  var g1 = n8_fn(-60, W + 60, 10, function (x) { return gy - H * 0.035 + Math.sin(x / 90 + 1) * 4; });
  add(refl, 'a', below(g1, H + 20), dk ? '#1E2A34' : '#A9A890');
  var rT = '', rL = '', rFur = '';
  (ph ? [0.32, 0.6, 0.84] : [0.18, 0.36, 0.5, 0.63, 0.78]).forEach(function (u) { var x = W * u + (rnd() - 0.5) * W * 0.03, w = (ph ? 20 : 34) + rnd() * 14, T = n8_trunk(x, -20, n8_yOn(g1, x) + 2, w, w * 0.8, (rnd() - 0.5) * 8, 0.7, rnd); rT += T.body; rL += T.lit; rFur += T.fur; });
  add(refl, 'b', rT, dk ? '#2E2E3E' : '#9A7466'); add(refl, 'c', rL, dk ? '#3A3A4C' : '#B08A78');
  stk(refl, 's', rFur, dk ? 'rgba(14,14,24,0.4)' : 'rgba(110,70,56,0.4)', ph ? 0.8 : 1.1);
  var fr = {a: '', b: '', rib: '', tips: []};
  spread(0, gy - H * 0.04, W, H * 0.02, ph ? 60 : 90, 20, rnd, 1).forEach(function (c) { if (c.q < 0.4) return; for (var f = 0; f < 6; f++) n8_frond(fr, 'a', 'b', c.x, n8_yOn(g1, c.x) + 4, (ph ? 18 : 28) * (0.8 + c.r * 0.5), -160 + f * 28, f < 3 ? -0.7 : 0.7, 0.12, 12); });
  add(refl, 'd', fr.a, dk ? '#1E3A34' : '#7E9E7A'); add(refl, 'e', fr.b, dk ? '#264640' : '#94B48C');
  add(refl, 'f', n8_E(W * 0.5, gy - H * 0.01, W * 0.75, H * 0.035), dk ? 'rgba(80,110,150,0.3)' : 'rgba(250,246,234,0.55)');
  // ---- mid: the forest floor, nearer trunks with flared roots, and the fallen mossy log
  var g2 = n8_fn(-60, W + 60, 10, function (x) { return gy + Math.sin(x / 140) * 6 + Math.sin(x / 47 + 2) * 2; });
  add(mid, 'a', below(g2, H + 20), dk ? '#1E2430' : '#8C7C58');
  var lx0 = W * (ph ? 0.18 : 0.36), lx1 = W * (ph ? 0.98 : 0.92), ly0 = H * (ph ? 0.85 : 0.84), ly1 = H * (ph ? 0.815 : 0.79), lr0 = (ph ? 18 : 40) * (ph ? 1 : S), lr1 = lr0 * 0.75;
  function onLog(x, y, pad) { var u = (x - lx0) / (lx1 - lx0); if (u < -0.03 || u > 1.03) return false; var yc = ly0 + (ly1 - ly0) * u, r = lr0 + (lr1 - lr0) * u; return y > yc - r - pad && y < yc + r * 0.95 + 6; }
  var floorHi = '', litter = '', mf = {a: '', b: '', rib: '', tips: []};
  spread(0, gy + H * 0.01, W, H - gy, ph ? 30 : 46, ph ? 16 : 22, rnd, 1).forEach(function (c) { if (c.y < n8_yOn(g2, c.x) + 3 || onLog(c.x, c.y, 14)) return; var l = (4 + c.r * 6) * S + 2, a = (c.k - 0.5) * 2.4; litter += seg(c.x - Math.cos(a) * l, c.y - Math.sin(a) * l * 0.4, c.x + Math.cos(a) * l, c.y + Math.sin(a) * l * 0.4); if (c.q < 0.12) floorHi += n8_cushion(c.x, c.y, (10 + c.r * 10) * S + 4, (4 + c.r * 3) * S + 2, rnd); });
  spread(0, gy + H * 0.02, W, H * 0.06, ph ? 70 : 110, H * 0.06, rnd, 1).forEach(function (c) { if (c.q < 0.45) return; var y0 = Math.max(c.y, n8_yOn(g2, c.x) + 6); if (onLog(c.x, y0, (ph ? 30 : 46))) return; for (var f = 0; f < 7; f++) n8_frond(mf, 'a', 'b', c.x, y0, (ph ? 22 : 34) * (0.8 + c.r * 0.5), -165 + f * 25, f < 3 ? -0.8 : f > 3 ? 0.8 : 0, 0.11, 14); });
  var mT = '', mL = '', mS = '', mFur = '', trunkPolys = [];
  (ph ? [[0.42, 46], [0.8, 40]] : [[0.3, 74], [0.62, 64], [0.74, 40]]).forEach(function (q) { var x = W * q[0], w = q[1] * (ph ? 1 : S), T = n8_trunk(x, -30, n8_yOn(g2, x) + 6, w, w * 0.78, (rnd() - 0.5) * 14, 0.9, rnd); mT += T.body; mL += T.lit; mS += T.shade; mFur += T.fur; trunkPolys.push(T.poly); });
  add(mid, 'b', mT, dk ? '#33252A' : '#8A4A34'); add(mid, 'c', mL, dk ? '#44323A' : '#A85E40'); 
  stk(mid, 's', mFur, dk ? 'rgba(12,8,14,0.55)' : 'rgba(80,36,24,0.5)', ph ? 1 : 1.4);
  // the fallen log: a long tapering cylinder with moss along its top and a cut end showing its rings
  var logTop = [], logBot = [], mossP = [], ln = 16;
  for (i = 0; i <= ln; i++) { var u = i / ln, x = lx0 + (lx1 - lx0) * u, y = ly0 + (ly1 - ly0) * u + Math.sin(u * 3) * 3, r = lr0 + (lr1 - lr0) * u; logTop.push([x, y - r]); logBot.unshift([x, y + r * 0.92]); mossP.push([x, y - r * (0.62 + 0.15 * Math.sin(u * 9 + 1))]); }
  var logBody = n8_P(logTop.concat(logBot)), mossTop = [], logShadow = n8_P([[lx0 - lr0 * 0.3, ly0 + lr0 * 0.7], [lx1 + 20, ly1 + lr1 * 0.6], [lx1 + 30, ly1 + lr1 * 1.25], [lx0, ly0 + lr0 * 1.35]]);
  for (i = 0; i <= ln; i++) mossTop.push([logTop[i][0], logTop[i][1] - 3 - Math.abs(Math.sin(i * 1.7)) * 4]);
  var logMoss = n8_P(mossTop.concat(mossP.slice().reverse())), mossHi = '', strands = '';
  for (i = 1; i < ln; i++) { if (i % 2 || rnd() < 0.3) mossHi += n8_E(mossTop[i][0] + (rnd() - 0.5) * 10, mossTop[i][1] + 2 + rnd() * 3, (lx1 - lx0) / ln * (0.25 + rnd() * 0.35), (1.6 + rnd() * 1.4) * S + 1); if (i % 3 === 1) strands += n8_strands(mossP[i][0], mossP[i][1], 14 * S, (ph ? 12 : 20) + rnd() * 14, rnd, 3, ph ? 0.8 : 1.1); }
  var endFace = n8_RE(lx0, ly0 - lr0 * 0.04, lr0 * 0.42, lr0 * 0.96, 0), rings = '';
  for (k = 1; k <= 4; k++) rings += 'M' + PT(lx0, ly0 - lr0 * 0.04 - lr0 * 0.96 * k / 5) + ' a' + n1(lr0 * 0.42 * k / 5) + ' ' + n1(lr0 * 0.96 * k / 5) + ' 0 1 1 0 ' + n1(lr0 * 1.92 * k / 5) + ' a' + n1(lr0 * 0.42 * k / 5) + ' ' + n1(lr0 * 0.96 * k / 5) + ' 0 1 1 0 ' + n1(-lr0 * 1.92 * k / 5) + ' ';
  var bark = ''; for (i = 0; i < ln; i += 1) { var a = logTop[i], b = logBot[ln - i]; if (i % 2) bark += 'M' + PT(a[0] + 4, a[1] + lr0 * 0.5) + ' Q' + PT(a[0] + 10, (a[1] + b[1]) / 2) + ' ' + PT(a[0] + 5, b[1] - 6) + ' '; }
  add(mid, 'd', mS + logShadow, dk ? 'rgba(8,8,18,0.35)' : 'rgba(50,30,16,0.25)');
  add(mid, 'e', logBody, dk ? '#2E2228' : '#7A4030'); add(mid, 'f', logMoss + strands + mf.a, dk ? '#24463A' : '#5E8E3A'); add(mid, 'g', endFace, dk ? '#4A3A3A' : '#C89A70');
  add(mid, 'h', mossHi + floorHi + mf.b, dk ? '#2E5A46' : '#8CBE52');
  stk(mid, 't', rings + bark + litter, dk ? 'rgba(20,12,16,0.5)' : 'rgba(110,60,36,0.55)', ph ? 0.9 : 1.3);
  // ---- near: giant trunks framing the view, sword ferns, sorrel carpet, canopy sprays across the top
  var nT = '', nL = '', nS = '', nFur = '', bigPolys = [];
  (ph ? [[-0.06, 0.34, 1], [1.06, 0.4, -1]] : [[0.02, 0.22, 1], [0.95, 0.26, -1]]).forEach(function (q) { var x = W * q[0], w = W * q[1] * (ph ? 0.8 : 1), T = n8_trunk(x, -40, H + 10, w, w * 0.86, q[2] * W * 0.01, 0.4, rnd); nT += T.body; nL += T.lit; nS += T.shade; nFur += T.fur; bigPolys.push(T.poly); });
  var sf = {a: '', b: '', rib: '', tips: []};
  (ph ? [[0.22, 1.02, 0.17], [0.7, 1.03, 0.15], [0.5, 1.05, 0.12]] : [[0.18, 1.02, 0.2], [0.42, 1.04, 0.15], [0.66, 1.03, 0.18], [0.84, 1.02, 0.17], [0.29, 0.92, 0.1]]).forEach(function (q) { var n = 11; for (var f = 0; f < n; f++) { var ang = -168 + f * (156 / (n - 1)) + (rnd() - 0.5) * 8, up = 1 - Math.abs(ang + 90) / 90; n8_frond(sf, 'a', 'b', W * q[0], H * q[1], H * q[2] * (0.75 + up * 0.35 + rnd() * 0.15), ang, (ang < -90 ? -1 : 1) * (0.9 - up * 0.5), 0.12, 26); } });
  var so = {f: '', g: ''}, flw = '', flPts = [];
  spread(-10, H * (ph ? 0.89 : 0.87), W + 20, H * 0.13, ph ? 40 : 58, ph ? 24 : 30, rnd, 1).forEach(function (c) { if (c.q < 0.2) return; var sc = (ph ? 1.4 : 2.1) * (0.8 + c.r * 0.4); n8_sorrel(c.x, c.y, sc, so, 'f', 'g', rnd); if (c.k < 0.16) { var fx2 = c.x + 3 * sc, fy2 = c.y - 13 * sc; for (var pp = 0; pp < 5; pp++) { var pa = pp / 5 * 6.283; flw += n8_C(fx2 + Math.cos(pa) * 1.6 * sc, fy2 + Math.sin(pa) * 1.6 * sc, 1.2 * sc); } } flPts.push([c.x, c.y - 9 * sc]); });
  // canopy sprays hanging into the top of the frame
  var cp = {a: '', b: '', rib: '', tips: []};
  (ph ? [[0.12, -0.02, 0.2, 65], [0.92, -0.01, 0.18, 118]] : [[0.13, -0.02, 0.22, 50], [0.33, -0.03, 0.14, 75], [0.86, -0.02, 0.24, 125], [0.64, -0.03, 0.12, 102]]).forEach(function (q) { for (var f = 0; f < 7; f++) n8_frond(cp, 'a', 'b', W * q[0] + (f - 3) * 22 * S, H * q[1] - 4, H * q[2] * (0.8 + rnd() * 0.5), q[3] + (f - 3) * 11, q[3] < 90 ? 0.35 : -0.35, 0.1, 24); });
  add(near, 'a', nT, dk ? '#2E1E24' : '#7E3E2A'); add(near, 'b', nL, dk ? '#40303A' : '#A45A3C'); add(near, 'c', nS, dk ? 'rgba(6,6,16,0.4)' : 'rgba(54,20,12,0.3)');
  add(near, 'd', sf.a + cp.a, dk ? '#163A30' : '#2E6A3A'); add(near, 'e', sf.b + cp.b, dk ? '#1E4E3E' : '#4A8A48');
  add(near, 'f', so.f, dk ? '#245640' : '#5AA048'); add(near, 'g', so.g, dk ? '#2E6A4E' : '#7CBE5A'); add(near, 'h', flw, dk ? '#E8DCEA' : '#FFF2F6');
  stk(near, 's', nFur, dk ? 'rgba(10,6,12,0.6)' : 'rgba(70,28,18,0.55)', ph ? 1.3 : 2);
  stk(near, 't', sf.rib + cp.rib, dk ? 'rgba(10,36,28,0.6)' : 'rgba(28,70,36,0.5)', ph ? 0.8 : 1.1);
  if (ANIM) {
    ANIM.src = [sx, sy]; ANIM.gy = gy; ANIM.S = S * (ph ? 0.9 : 1); ANIM.trunks = trunkPolys; ANIM.big = bigPolys; ANIM.flowers = flPts.filter(function (p) { return p[0] > 10 && p[0] < W - 10; }); ANIM.log = [lx0, ly0, lx1, ly1, lr0];
  } else {
    // still picture: soft light shafts through the fog
    var sh = ''; [0.12, 0.3, 0.46, 0.62].forEach(function (u, m) { var x = sx + W * (u - 0.2), w = W * (0.04 + (m % 2) * 0.03); sh += n8_P([[x, -10], [x + w, -10], [x + w + H * 0.5, H + 10], [x + H * 0.5 - w * 0.3, H + 10]]); });
    add(refl, 'g', sh, dk ? 'rgba(150,190,255,0.08)' : 'rgba(255,244,200,0.22)');
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
