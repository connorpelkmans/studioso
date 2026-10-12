// ---- batch n8: waterfall (Fern Falls), redwoods (Redwood Grove)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n8_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n8_P(pts) { return poly(n8_cw(pts)); }
function n8_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n8_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n8_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n8_P(rotp(p, x, y, ang)); }
function n8_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
function n8_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// closed Catmull-Rom smoothing of a point loop / open curve through points (end points kept)
function n8_smooth(p, n) { var o = [], L = p.length; for (var i = 0; i < L; i++) { var a = p[(i - 1 + L) % L], b = p[i], c = p[(i + 1) % L], d = p[(i + 2) % L]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } return o; }
function n8_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n8_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return n8_smooth(p, 3); }
// a leaf outline: base at (x,y), pointing along ang (degrees)
function n8_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 12; i++) { var t = i / 12, ww = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n8_leaf(x, y, len, w, ang, bend) { return n8_P(n8_leafPts(x, y, len, w, ang, bend)); }
// a thick band along a polyline (widths w0 -> w1)
function n8_band(pts, w0, w1) { var L = [], R = []; pts.forEach(function (p, j) { var q = pts[Math.min(pts.length - 1, j + 1)], o = pts[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, u = j / (pts.length - 1), w = w0 + (w1 - w0) * u; L.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); R.push([p[0] + dy / dl * w, p[1] - dx / dl * w]); }); return n8_P(L.concat(R.reverse())); }
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

// =============== 1. Fern Falls (waterfall): a tall lacy waterfall dropping in tiers down a mossy basalt gorge into a green plunge pool
SCENES.waterfall = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.2), refl = Lay(0.6), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, k, j;
  var sky = dk ? 'linear-gradient(180deg,#0B1828 0%,#12263A 36%,#1A3A44 70%,#1E4440 100%)' : 'linear-gradient(180deg,#A3D3E2 0%,#C2E4EA 30%,#DDF1EA 60%,#EEF6E4 100%)';
  var fx = W * (ph ? 0.5 : 0.55), lip = H * (ph ? 0.21 : 0.17);
  // sun / moon in the sky gap above the gorge
  var mx = fx + W * (ph ? -0.2 : -0.15), my = H * (ph ? 0.06 : 0.05), mr = ph ? 15 : 22;
  if (dk) { add(far, 'a', n8_C(mx, my, mr * 2.8), 'rgba(190,220,255,0.12)'); add(far, 'c', n8_C(mx, my, mr), '#F2F2E2');
    var st = ''; spread(0, 0, W, H * 0.3, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - mx, c.y - my) > mr * 2.2) st += n8_C(c.x, c.y, 0.5 + c.r * 1.1); }); add(far, 'b', st, 'rgba(240,248,255,0.85)'); }
  else { add(far, 'a', n8_C(mx, my, mr * 3), 'rgba(255,255,236,0.5)'); add(far, 'c', n8_C(mx, my, mr), 'rgba(255,255,244,1)');
    var cl = ''; spread(0, H * 0.02, W, H * 0.12, ph ? 170 : 300, 60, rnd, 0.8).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - mx, c.y - my) > 80) { var s = 0.6 + c.r * 0.5; cl += n8_E(c.x, c.y, 56 * s, 11 * s) + n8_C(c.x - 18 * s, c.y - 7 * s, 16 * s) + n8_C(c.x + 14 * s, c.y - 11 * s, 20 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.85)'); }
  // distant forested hills beyond the gorge
  var r1 = ridge(W, H * (ph ? 0.15 : 0.125), [[H * 0.025, ph ? 70 : 140, 0.5], [H * 0.01, 40, 2]], 8);
  add(far, 'd', below(r1, H), dk ? '#1C3846' : '#A8D0C8');
  var fb = ''; spread(-20, 0, W + 40, 10, ph ? 12 : 16, 10, rnd, 1).forEach(function (c) { var yy = n8_yOn(r1, c.x) + 5, r = (ph ? 5 : 8) + c.r * 5; fb += n8_C(c.x, yy, r) + n8_P([[c.x - r * 0.75, yy], [c.x, yy - r * 2.8], [c.x + r * 0.75, yy]]); });
  add(far, 'e', fb, dk ? '#183240' : '#93C2B6');

  // ---- the back wall (refl): a cliff with an uneven top, basalt columns, mossy ledges where the falls break
  var pcy = H * (ph ? 0.85 : 0.86), prx = W * (ph ? 0.46 : 0.32), pry = H * (ph ? 0.06 : 0.075);
  var tw = ph ? [0.06, 0.1, 0.14, 0.21, 0.24, 0.36] : [0.032, 0.05, 0.07, 0.11, 0.12, 0.19];   // tier widths (fractions of W): top/bottom of each tier
  var ty = ph ? [lip, H * 0.37, H * 0.395, H * 0.575, H * 0.6, pcy - pry * 0.25] : [lip, H * 0.35, H * 0.38, H * 0.56, H * 0.59, pcy - pry * 0.25];
  function waterHalf(y) { for (var q = 0; q < 3; q++) { var a = ty[q * 2], b = ty[q * 2 + 1] + ld * 2; if (y >= a - 4 && y <= b) { var v = Math.min(1, (y - a) / (ty[q * 2 + 1] - a)); return W * (tw[q * 2] + (tw[q * 2 + 1] - tw[q * 2]) * v) * 0.55 + 4; } } return 0; }
  function vseg(x, y0, y1, lean) { var d = '', n = Math.ceil((y1 - y0) / 14), run = null; for (var q = 0; q <= n; q++) { var y = y0 + (y1 - y0) * q / n, xx = x + lean * q / n, wet = Math.abs(xx - fx) < waterHalf(y); if (!wet && !run) run = [xx, y]; if ((wet || q === n) && run) { if (y - run[1] > 2) d += seg(run[0], run[1], xx, y); run = null; } } return d; }
  var ld = ph ? 10 : 17;
  var bwL = fx - W * 0.62, bwR = fx + W * 0.62, notch = W * tw[0] * 1.5;
  function rimY(x) { var u = Math.abs(x - fx) / (W * 0.45); return lip - (u < notch / (W * 0.45) ? 0 : H * 0.012) - H * (ph ? 0.06 : 0.07) * Math.pow(Math.min(1.4, u), 1.6) + Math.sin(x / 37) * H * 0.006 + Math.sin(x / 13 + 1) * H * 0.003; }
  // the forest on the rim (behind the cliff top)
  var rim = ''; for (var xr = bwL; xr < bwR; xr += (ph ? 12 : 17)) { if (Math.abs(xr - fx) < notch * 1.1) continue; var rr = (ph ? 9 : 13) + rnd() * 9, yy2 = rimY(xr) + 4; rim += n8_C(xr, yy2, rr) + n8_P([[xr - rr * 0.8, yy2 + rr * 0.3], [xr, yy2 - rr * 2.3], [xr + rr * 0.8, yy2 + rr * 0.3]]); }
  add(far, 'g', rim, dk ? '#163030' : '#6FA48A');
  add(far, 'h', n8_E(fx, lip - H * 0.01, W * 0.5, H * 0.02), dk ? 'rgba(120,160,180,0.2)' : 'rgba(255,255,255,0.45)');
  var colA = '', colB = '', colC = '', joints = '', rimMoss = '', rimMossHi = '', rimTop = [], x0 = bwL, glowPts = [];
  while (x0 < bwR) { var cw = (ph ? 10 : 16) + rnd() * (ph ? 8 : 14), top = rimY(x0 + cw / 2) + rnd() * 6, lean = (rnd() - 0.5) * 4;
    colA += n8_P([[x0, top + 2], [x0 + cw * 0.3, top - 1], [x0 + cw * 0.7, top - 1], [x0 + cw, top + 2], [x0 + cw + lean, pcy + 10], [x0 + lean, pcy + 10]]);
    colB += n8_P([[x0, top + 2], [x0 + cw * 0.3, top - 1], [x0 + cw * 0.42, top + 3], [x0 + cw * 0.42 + lean, pcy + 10], [x0 + lean, pcy + 10]]);
    joints += vseg(x0, top + 2, pcy, lean);
    for (var yb = top + 20 + rnd() * 40; yb < pcy; yb += 30 + rnd() * 60) if (Math.abs(x0 + cw / 2 - fx) > waterHalf(yb) + cw / 2) joints += seg(x0 + 1, yb, x0 + cw - 1, yb + (rnd() - 0.5) * 6);
    if (rnd() < 0.3) colC += n8_P([[x0 + cw * 0.42, top + 3], [x0 + cw * 0.7, top - 1], [x0 + cw, top + 2], [x0 + cw + lean, pcy + 10], [x0 + cw * 0.42 + lean, pcy + 10]]);
    if (Math.abs(x0 + cw / 2 - fx) > notch * 0.9) { rimMoss += n8_cushion(x0 + cw / 2, top, cw * 0.7, (ph ? 3 : 4.5), rnd); rimMossHi += n8_E(x0 + cw * 0.45, top - 2, cw * 0.32, ph ? 1.2 : 1.8); if (rnd() < 0.5) rimMossHi += n8_strands(x0 + cw / 2, top + 1, cw * 0.8, (ph ? 10 : 16) + rnd() * 14, rnd, 3, ph ? 0.8 : 1.1); }
    rimTop.push([x0 + cw / 2, top]); x0 += cw; }
  add(refl, 'a', colA, dk ? '#22323E' : '#6E7D78'); add(refl, 'b', colB, dk ? '#2A3C48' : '#82918A');
  stk(refl, 's', joints, dk ? 'rgba(8,16,24,0.5)' : 'rgba(40,54,52,0.35)', ph ? 0.9 : 1.3);
  // wet, darker rock right behind the water
  var wet = n8_P([[fx - notch * 1.1, lip], [fx + notch * 1.1, lip], [fx + W * tw[5] * 0.8, pcy], [fx - W * tw[5] * 0.8, pcy]]);
  // the ledges at the tier breaks: a lit top, a dark front with an uneven lower edge, moss cushions, ferns and hanging moss
  var ledgeTop = '', ledgeFace = '', moss = '', mossHi = '', fern = {a: '', b: '', rib: '', tips: []};
  function ledge(y, hw) { var n = 18, topP = [], botP = [];
    for (j = 0; j <= n; j++) { var u = j / n, x = fx - hw + u * 2 * hw, e = Math.sin(Math.PI * u); topP.push([x, y - ld * 0.4 * e - rnd() * 2]); botP.unshift([x, y + ld * (0.9 + 0.9 * e) + rnd() * ld * 0.8]); }
    ledgeTop += n8_P(topP.concat([[fx + hw, y + ld * 0.5], [fx - hw, y + ld * 0.5]])); ledgeFace += n8_P(topP.map(function (p) { return [p[0], p[1] + ld * 0.45]; }).concat(botP));
    for (j = 0; j < 16; j++) { var mxp = fx - hw + (j + 0.5) / 16 * 2 * hw + (rnd() - 0.5) * 8; if (Math.abs(mxp - fx) < W * tw[1] * 0.9) continue; var mw = (ph ? 7 : 11) + rnd() * 8, yy = y - ld * 0.35 * Math.sin(Math.PI * (mxp - fx + hw) / (2 * hw));
      moss += n8_cushion(mxp, yy, mw, mw * 0.4, rnd); mossHi += n8_E(mxp - mw * 0.2, yy - mw * 0.22, mw * 0.5, mw * 0.12);
      if (rnd() < 0.55) mossHi += n8_strands(mxp, yy + ld * 1.4, mw * 1.6, (ph ? 16 : 26) + rnd() * 20, rnd, 4, ph ? 0.8 : 1.1); else glowPts.push([mxp + (rnd() - 0.5) * 8, yy + ld * 2.2 + rnd() * 8]);
      if (j % 4 === 1) for (var f = 0; f < 3; f++) n8_frond(fern, 'a', 'b', mxp, yy, (ph ? 12 : 18) * (0.8 + rnd() * 0.4), -90 + (f - 1) * 38, (f - 1) * 0.5, 0.2, 9); } }
  ledge(ty[1] + ld * 0.4, W * (ph ? 0.4 : 0.24)); ledge(ty[3] + ld * 0.4, W * (ph ? 0.48 : 0.3));
  // the lip of the notch the water pours over
  ledgeTop += n8_P([[fx - notch, lip - 3], [fx + notch, lip - 3], [fx + notch * 0.9, lip + 4], [fx - notch * 0.9, lip + 4]]);
  // moss patches and hanging moss climbing the wall, kept off the water
  spread(bwL, lip + H * 0.02, bwR - bwL, pcy - lip - H * 0.08, ph ? 40 : 62, ph ? 46 : 64, rnd, 1).forEach(function (c) { var clear = W * tw[5] * 0.55 * (0.4 + 0.8 * (c.y - lip) / (pcy - lip)) + 24; if (Math.abs(c.x - fx) < clear || c.q < 0.3) return; var r = (ph ? 6 : 10) + c.r * 9;
    moss += n8_cushion(c.x, c.y, r * 1.4, r * 0.75, rnd) + n8_cushion(c.x + r * 0.9, c.y + r * 0.2, r * 0.7, r * 0.45, rnd); mossHi += n8_E(c.x - r * 0.35, c.y - r * 0.4, r * 0.7, r * 0.2);
    if (c.k < 0.4) mossHi += n8_strands(c.x, c.y + r * 0.35, r * 2.2, (ph ? 12 : 18) + c.r * 22, rnd, 5, ph ? 0.8 : 1.1); else glowPts.push([c.x + (rnd() - 0.5) * r, c.y + r * 1.1]); });
  for (var bx = fx - prx * 1.3; bx < fx + prx * 1.3; bx += (ph ? 16 : 24)) { if (Math.abs(bx - fx) < W * tw[5] * 0.62) continue; var by = pcy - pry * 1.3 * Math.sqrt(Math.max(0, 1 - Math.pow((bx - fx) / (prx * 1.15), 2))) + 4, bs = (ph ? 9 : 14) * (0.7 + rnd() * 0.6);
    moss += n8_cushion(bx, by, bs * 1.4, bs, rnd); mossHi += n8_E(bx - bs * 0.4, by - bs * 0.55, bs * 0.6, bs * 0.2); if (rnd() < 0.5) for (var f2 = 0; f2 < 4; f2++) n8_frond(fern, 'a', 'b', bx, by, bs * 2.2, -90 + (f2 - 1.5) * 32, (f2 - 1.5) * 0.4, 0.2, 10); }
  var REFL = {top: ledgeTop, moss: moss + rimMoss + fern.a, hi: mossHi + rimMossHi + fern.b};
  // the water: lacy strands per tier over a pale sheet near each tier's top (the engine pours moving streaks over it)
  var tiers = [], sheet = '', foam = '';
  for (var ti = 0; ti < 3; ti++) { var yT = ty[ti * 2], yB = ty[ti * 2 + 1], wT = W * tw[ti * 2], wB = W * tw[ti * 2 + 1], ns = ph ? 4 + ti : 5 + ti * 2, strands = [];
    for (var sI = 0; sI < ns; sI++) { var u0 = (sI + 0.5) / ns, xT = fx - wT / 2 + u0 * wT, xB = fx - wB / 2 + u0 * wB + (rnd() - 0.5) * wB / ns * 0.3, sw0 = wT / ns * 0.62, sw1 = wB / ns * (0.2 + rnd() * 0.16), L = [], R = [], edge = Math.abs(u0 - 0.5) * 2, vEnd = edge > 0.6 ? 0.72 + rnd() * 0.2 : 1;
      for (var q = 0; q <= 12; q++) { var v = q / 12 * vEnd, xx = xT + (xB - xT) * Math.pow(v, 1.25) + Math.sin(v * 5 + sI) * 1.2, yy3 = yT + (yB - yT) * v, ww = (sw0 + (sw1 - sw0) * v) * (1 + 0.22 * Math.sin(v * 11 + sI * 2)) * (vEnd < 1 ? 1 - Math.pow(q / 12, 3) * 0.9 : 1); L.push([xx - ww, yy3]); R.push([xx + ww, yy3]); }
      var spp = L.concat(R.reverse()); strands.push(spp); sheet += n8_P(spp); }
    var crest = []; for (q = 0; q <= 8; q++) { var cu = q / 8; crest.push([fx - wT / 2 - 1 + cu * (wT + 2), yT - 2 - Math.sin(Math.PI * cu) * (ti ? ld * 0.35 : 2)]); }
    sheet += n8_P(crest.concat([ [fx + wT * 0.5 + (wB - wT) * 0.06, yT + (yB - yT) * 0.12], [fx, yT + (yB - yT) * 0.2], [fx - wT * 0.5 - (wB - wT) * 0.06, yT + (yB - yT) * 0.12]]));
    tiers.push({yT: yT, yB: yB, wT: wT, wB: wB, strands: strands});
    if (ti < 2) { var fy = yB + ld * 0.1, fw = wB * 0.7; for (k = 0; k < 7; k++) foam += n8_E(fx + (k - 3) * fw / 3.4 + (rnd() - 0.5) * 4, fy + Math.abs(k - 3) * 1.2, fw * (0.3 - Math.abs(k - 3) * 0.035), (ph ? 4.5 : 6.5) * (1 - Math.abs(k - 3) * 0.12)); } }
  add(refl, 'c', wet + ledgeFace + colC, dk ? 'rgba(4,10,18,0.42)' : 'rgba(28,42,40,0.36)');
  add(refl, 'd', REFL.top, dk ? '#3C525C' : '#A2B0A6');
  add(refl, 'e', REFL.moss, dk ? '#1E4A40' : '#5E9A48'); add(refl, 'f', REFL.hi, dk ? '#2A5E4C' : '#82BE5A');
  add(refl, 'g', sheet, dk ? 'rgba(196,220,240,0.88)' : 'rgba(250,255,255,0.97)');
  add(refl, 'h', foam, dk ? 'rgba(214,232,248,0.95)' : '#FFFFFF');

  // ---- the side walls (mid): big columns stepping down toward the gorge, darker and nearer than the back wall
  function shoreY(x) { var u = (x - fx) / (prx * 1.12); return Math.abs(u) < 1 ? pcy - pry * 1.38 * Math.sqrt(1 - u * u) : H + 10; }
  var wallA = '', wallB = '', wCap = '', wMoss = '', wMossHi = '', wJ = '', wFern = {a: '', b: '', rib: '', tips: []}, steps = [];
  [-1, 1].forEach(function (sd) { var n = ph ? 5 : 7, span = W * (ph ? 0.3 : 0.28), ccw = span / n, xin = fx + sd * W * (ph ? 0.33 : 0.31);
    if (sd > 0) xin = fx + W * (ph ? 0.33 : 0.33);
    for (j = 0; j < n + 2; j++) { var xc = xin + sd * j * ccw, top = Math.max(-30, H * (ph ? 0.36 : 0.34) * Math.pow(Math.max(0, 1 - j / (n - 1)), 1.25) + (j < n ? (rnd() - 0.5) * H * 0.04 : -60) + (sd > 0 ? H * 0.04 : 0)), xa = xc - ccw / 2, xb = xc + ccw / 2, lean = sd * (rnd() * 3);
      wallA += n8_P([[xa, top + 6], [xa + ccw * 0.25, top], [xb - ccw * 0.25, top], [xb, top + 6], [xb + lean, H + 40], [xa + lean, H + 40]]);
      var lx0 = sd < 0 ? xb : xa, lx1 = sd < 0 ? xb - ccw * 0.42 : xa + ccw * 0.42;   // the lit face looks into the gorge
      wallB += n8_P([[lx0, top + 6], [lx1, top + 3], [lx1 + lean, H + 40], [lx0 + lean, H + 40]]);
      wCap += n8_P([[xa, top + 6], [xa + ccw * 0.25, top], [xb - ccw * 0.25, top], [xb, top + 6], [xb - ccw * 0.25, top + 11], [xa + ccw * 0.25, top + 11]]);
      var jEnd = shoreY(xa); wJ += seg(xa, top + 6, xa + lean * (jEnd - top) / (H + 40 - top), jEnd); for (var b = top + 30 + rnd() * 40; b < Math.min(shoreY(xa), shoreY(xb)) - 6; b += 40 + rnd() * 70) wJ += seg(xa + 2, b, xb - 2, b + (rnd() - 0.5) * 8);
      if (top < -20) continue;
      var mw = ccw * (0.45 + rnd() * 0.2); wMoss += n8_cushion(xc, top + 1, mw, mw * 0.32, rnd); wMossHi += n8_E(xc - mw * 0.25, top - mw * 0.12, mw * 0.5, mw * 0.1);
      if (rnd() < 0.75) wMossHi += n8_strands(xc + sd * ccw * 0.1, top + 8, ccw * 0.8, (ph ? 16 : 28) + rnd() * 34, rnd, 5, ph ? 0.9 : 1.3);
      if (j % 2 === 1) for (var fr = 0; fr < 4; fr++) n8_frond(wFern, 'a', 'b', xc, top + 2, (ph ? 16 : 26) * (0.8 + rnd() * 0.4), -90 + (fr - 1.5) * 34 + (rnd() - 0.5) * 8, (fr - 1.5) * 0.4, 0.2, 10);
      glowPts.push([xc + sd * ccw * (rnd() * 0.3), top + 26 + rnd() * 50]); glowPts.push([xc - sd * ccw * 0.2, top + 60 + rnd() * 70]);
      steps.push([xc, top]); } });
  add(mid, 'a', wallA, dk ? '#162230' : '#4C5955'); add(mid, 'b', wallB, dk ? '#1E2C3A' : '#5E6C67'); add(mid, 'c', wCap, dk ? '#2C3E4A' : '#76847D');
  add(mid, 'd', wMoss + wFern.a, dk ? '#1C463A' : '#558F42'); add(mid, 'e', wMossHi + wFern.b, dk ? '#28604C' : '#7CBA55');
  stk(mid, 't', wJ, dk ? 'rgba(4,10,16,0.55)' : 'rgba(26,36,34,0.35)', ph ? 1 : 1.4);
  // ---- the plunge pool (mid, over the wall feet): clear shallow rim, deep green middle, foam where the falls land
  add(mid, 'f', n8_E(fx, pcy, prx * 1.12, pry * 1.38), dk ? '#21505A' : '#86D0BC');
  add(mid, 'g', n8_E(fx, pcy + pry * 0.1, prx * 0.98, pry * 0.98), dk ? '#173E4A' : '#3A9884');
  var pf = '', pw = W * tw[5] * 0.62, shim = '';
  for (k = 0; k < 11; k++) pf += n8_E(fx + (k - 5) * pw / 5.4 + (rnd() - 0.5) * 4, pcy - pry * 0.28 + Math.abs(k - 5) * 1.1, pw * (0.2 - Math.abs(k - 5) * 0.012), (ph ? 3.6 : 5.2) * (1 - Math.abs(k - 5) * 0.07));
  pf += n8_E(fx, pcy - pry * 0.18, pw * 0.75, pry * 0.16);
  for (k = 0; k < (ph ? 6 : 10); k++) { var sy2 = pcy + pry * (-0.2 + (k % 3) * 0.32), sx2 = fx + (k - (ph ? 2.5 : 4.5)) * prx * 0.2 + (rnd() - 0.5) * 16; if (Math.abs(sx2 - fx) < pw * 0.75) continue; shim += 'M' + PT(sx2 - 14 * S, sy2) + ' q' + n1(14 * S) + ' -3 ' + n1(28 * S) + ' 0 '; }
  stk(mid, 's', shim, dk ? 'rgba(160,200,230,0.3)' : 'rgba(255,255,255,0.6)', ph ? 1.2 : 1.8);

  // ---- the foreground (near): wet boulders and pool stones, ground ferns, tree ferns and a mossy branch with hanging moss
  var bould = '', bouldHi = '', glint = '', bMoss = '', gl = [];
  function boulder(x, y, rx, ry, mossy) { bould += n8_P(n8_blob(x, y, rx, ry, rnd, 11, 0.12)); bouldHi += n8_P(n8_blob(x - rx * 0.15, y - ry * 0.42, rx * 0.68, ry * 0.42, rnd, 9, 0.14));
    if (mossy) bMoss += n8_cushion(x + rx * 0.1, y - ry * 0.72, rx * 0.55, ry * 0.32, rnd);
    for (k = 0; k < (rx > 30 ? 3 : 1); k++) { var gx = x - rx * 0.45 + k * rx * 0.28 + (rnd() - 0.5) * 6, gy = y - ry * (0.6 + rnd() * 0.15); glint += n8_RE(gx, gy, (ph ? 1.8 : 2.8) + rnd() * 2, ph ? 0.9 : 1.3, -12); gl.push([gx, gy]); } }
  var nst = ph ? 7 : 11; for (i = 0; i < nst; i++) { var t = Math.PI * (1.04 + 0.92 * i / (nst - 1)), sx = fx + Math.cos(t) * prx * 1.1, sy = pcy + Math.sin(t) * pry * 1.32 + 3, srx = (ph ? 17 : 28) * (0.7 + rnd() * 0.6); if (Math.abs(sx - fx) < W * tw[5] * 0.7) continue; boulder(sx, sy, srx, srx * 0.5, rnd() < 0.6); }
  (ph ? [[0.04, 0.97, 0.22, 0.06], [0.3, 1.0, 0.15, 0.035], [0.86, 0.98, 0.2, 0.055], [0.62, 1.01, 0.13, 0.03]] : [[0.05, 0.98, 0.15, 0.09], [0.22, 1.0, 0.1, 0.045], [0.86, 0.97, 0.15, 0.09], [0.7, 1.0, 0.09, 0.04], [0.42, 1.02, 0.08, 0.03]]).forEach(function (b2) { boulder(W * b2[0], H * b2[1], W * b2[2], H * b2[3], true); });
  var gf = {a: '', b: '', rib: '', tips: []};
  (ph ? [[0.12, 1.01], [0.88, 1.01], [0.45, 1.03]] : [[0.13, 1.01], [0.32, 1.03], [0.76, 1.02], [0.94, 1.0], [0.55, 1.05]]).forEach(function (q2) { for (var f = 0; f < 7; f++) n8_frond(gf, 'a', 'b', W * q2[0], H * q2[1], H * (ph ? 0.11 : 0.14) * (0.8 + rnd() * 0.4), -165 + f * 25 + (rnd() - 0.5) * 8, (f < 3 ? -0.8 : f > 3 ? 0.8 : 0), 0.15, 16); });
  // tree ferns: a fibrous trunk topped by a crown of long arching fronds, fiddleheads in the middle
  var tf = {a: '', b: '', c: '', d: '', rib: '', tips: []}, trunk = '', trunkT = '', stubs = '', coils = '', fid = '', crowns = [];
  (ph ? [[-0.04, 0.5, 0.19, 1], [1.04, 0.58, 0.17, -1]] : [[0.07, 0.33, 0.3, 1], [0.95, 0.4, 0.27, -1], [0.22, 0.62, 0.14, 1]]).forEach(function (q, ci) { var x = W * q[0], y = H * q[1], L = H * q[2], sd = q[3], bend = sd * W * 0.02;
    var tp = n8_curve([[x - bend * 1.5, H + 20], [x - bend * 0.8, (H + y) / 2], [x, y]], 8), tw0 = (ph ? 10 : 15) * (q[2] / 0.27), tw1 = tw0 * 0.8; trunk += n8_band(tp, tw0, tw1);
    tp.forEach(function (p, m) { if (m > 0 && m < tp.length - 1) { var u = m / tp.length, w = tw0 + (tw1 - tw0) * u; for (var h = 0; h < 3; h++) { var hx = p[0] - w * 0.7 + h * w * 0.7 + (rnd() - 0.5) * 3; trunkT += 'M' + PT(hx, p[1] - 4) + ' q' + n1((rnd() - 0.5) * 4) + ' 4 ' + n1((rnd() - 0.5) * 3) + ' 9 '; } } });
    var sk = {a: '', b: '', rib: '', tips: []}; for (var f0 = 0; f0 < 4; f0++) n8_frond(sk, 'a', 'a', x + (f0 - 1.5) * tw1 * 0.5, y + tw1 * 0.6, L * (0.32 + rnd() * 0.12), 90 + (f0 - 1.5) * 16 + sd * 6, (f0 - 1.5) * 0.12, 0.08, 14); stubs += sk.a;
    for (var c0 = -1; c0 <= 1; c0 += 2) { var cxp = x + c0 * tw1 * 0.9, cyp = y - tw1 * 1.8, rr0 = tw1 * 0.55, spi = 'M' + PT(x + c0 * tw1 * 0.3, y); spi += ' Q' + PT(cxp - c0 * rr0 * 0.4, cyp + rr0 * 2) + ' ' + PT(cxp + c0 * rr0, cyp); for (var a0 = 0; a0 <= 14; a0++) { var aa = a0 / 14 * Math.PI * 1.7, rq = rr0 * (1 - a0 / 18); spi += ' L' + PT(cxp + c0 * Math.cos(aa) * rq - c0 * rr0 * 0 , cyp - Math.sin(aa) * rq * 1.05 + rq * 0); } coils += spi; }
    for (var f = 0; f < 11; f++) { var ang = -184 + f * 18.8 + (rnd() - 0.5) * 6, up = 1 - Math.abs(ang + 90) / 95; n8_frond(tf, 'a', 'b', x, y, L * (0.95 - up * 0.3 + rnd() * 0.15), ang, (ang < -90 ? -1 : 1) * (1.2 + (1 - up) * 0.4), 0.14, 30); }
    for (f = 0; f < 7; f++) { var ang2 = -160 + f * 23 + (rnd() - 0.5) * 6, up2 = 1 - Math.abs(ang2 + 90) / 95; n8_frond(tf, 'c', 'd', x, y + 3, L * (0.78 - up2 * 0.25 + rnd() * 0.1), ang2, (ang2 < -90 ? -1 : 1) * (1.5 + (1 - up2) * 0.5), 0.13, 26); }
    trunk += n8_E(x, y + 2, tw1 * 1.25, tw1 * 0.8); crowns.push([x, y, L]); });
  // a mossy branch reaching in from the top left, hung with long strands of moss
  var brP = ph ? [[-20, H * 0.03], [W * 0.14, H * 0.055], [W * 0.3, H * 0.04]] : [[-20, H * 0.06], [W * 0.12, H * 0.085], [W * 0.24, H * 0.07], [W * 0.33, H * 0.085]];
  var brC = n8_curve(brP, 6), branch = n8_band(brC, ph ? 7 : 10, ph ? 3 : 4), hang = '', hangHi = '', hangPts = [];
  brC.forEach(function (p, m) { if (m % 2 === 0 && m > 0) { var l = (ph ? 26 : 42) + rnd() * (ph ? 34 : 60); hang += n8_strands(p[0], p[1] + 1, (ph ? 14 : 22) + rnd() * 8, l, rnd, 6, ph ? 1 : 1.5); hangHi += n8_cushion(p[0], p[1] - 1, (ph ? 8 : 13), ph ? 3 : 4.5, rnd); hangPts.push([p[0], p[1] + l * 0.75]); } });
  add(near, 'a', bould + branch, dk ? '#1A2530' : '#4E5B57'); add(near, 'b', bouldHi, dk ? '#25323E' : '#687672');
  add(near, 'c', trunk + stubs, dk ? '#2A201C' : '#4A3628');
  add(near, 'd', tf.a + gf.a, dk ? '#12392E' : '#2E7542'); add(near, 'e', tf.b + gf.b + bMoss + hangHi, dk ? '#1A5040' : '#4F9E4C');
  add(near, 'f', tf.c + hang, dk ? '#1C5A46' : '#62B254'); add(near, 'g', tf.d, dk ? '#26705A' : '#8ED066');
  add(near, 'h', glint, dk ? 'rgba(200,225,255,0.75)' : 'rgba(255,255,255,0.9)');
  stk(near, 't', coils, dk ? '#3E8A66' : '#A6DA74', ph ? 2.2 : 3.4);
  stk(near, 's', tf.rib + gf.rib + trunkT, dk ? 'rgba(10,40,30,0.6)' : 'rgba(30,80,40,0.5)', ph ? 0.8 : 1.2);
  if (ANIM) {
    ANIM.fx = fx; ANIM.tiers = tiers; ANIM.pool = {cx: fx, cy: pcy, rx: prx, ry: pry}; ANIM.S = S * (ph ? 0.9 : 1); ANIM.moon = [mx, my, mr]; ANIM.lip = lip; ANIM.ld = ld;
    ANIM.glow = glowPts.filter(function (p) { return p[1] < pcy - pry * 1.4 && p[1] > lip; }); ANIM.glints = gl; ANIM.hang = hangPts; ANIM.crowns = crowns;
  } else {
    // still picture: streaks down the falls and soft mist over the pool
    var sk = ''; tiers.forEach(function (T) { T.strands.forEach(function (sp, m) { var n = sp.length / 2; for (var q = 1; q < n - 2; q += 2) { var a = sp[q], b2 = sp[sp.length - 1 - q], c2 = sp[q + 1], d2 = sp[sp.length - 2 - q], o = (m % 2 ? 0.25 : -0.25); if ((q + m) % 3) sk += seg((a[0] + b2[0]) / 2 + (b2[0] - a[0]) * o, a[1], (c2[0] + d2[0]) / 2 + (d2[0] - c2[0]) * o, c2[1]); } }); });
    stk(refl, 't', sk, dk ? 'rgba(130,165,200,0.6)' : 'rgba(150,200,212,0.65)', ph ? 1 : 1.5);
  }
  add(mid, 'h', pf, dk ? 'rgba(196,220,240,0.7)' : 'rgba(255,255,255,0.88)');
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Redwood Grove (redwoods): towering red-brown trunks rising out of frame, sword ferns and sorrel, a fallen mossy log, god rays through fog
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
