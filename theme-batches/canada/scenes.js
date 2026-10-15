// ---- batch canada: canada (Canada)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other.
function canada_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function canada_pg(p) { return poly(canada_area(p) < 0 ? p.slice().reverse() : p); }
function canada_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function canada_c(x, y, r) { return canada_e(x, y, r, r); }
// y of a polyline (any x spacing, sorted by x) at x
function canada_yAt(pts, x) { if (x <= pts[0][0]) return pts[0][1]; for (var i = 1; i < pts.length; i++) if (pts[i][0] >= x) { var a = pts[i - 1], b = pts[i], f = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * f; } return pts[pts.length - 1][1]; }
// the points strictly between a and b, nudged at random: a broken, rocky line
function canada_jag(a, b, n, amp, rnd) { var o = []; for (var i = 1; i < n; i++) { var u = i / n; o.push([a[0] + (b[0] - a[0]) * u + (rnd() - 0.5) * amp * 0.5, a[1] + (b[1] - a[1]) * u + (rnd() - 0.5) * amp]); } return o; }
// a spruce: a narrow spire of drooping tiers standing on (x, y), h tall, w the half-width of the lowest tier.
// lean bends the top sideways (0 at the foot, lean pixels at the tip), which is how the engine sways the near trees.
function canada_sprucePts(x, y, h, w, n, lean) {
  var Lp = [], Rp = [], st = h * 0.84 / n, k, ln = lean || 0, X = function (xx, yy) { var u = (y - yy) / h; return xx + ln * u * u; };
  Lp.push([X(x - w * 0.09, y + 2), y + 2]); Rp.push([X(x + w * 0.09, y + 2), y + 2]);
  for (k = 0; k < n; k++) { var yb = y - h * 0.1 - k * st, f = 1 - k / n, wk = w * Math.pow(f, 0.8) * (k % 2 ? 0.9 : 1);
    Lp.push([X(x - wk, yb + st * 0.3), yb + st * 0.3], [X(x - wk * 0.34, yb - st * 0.5), yb - st * 0.5]);
    Rp.push([X(x + wk, yb + st * 0.3), yb + st * 0.3], [X(x + wk * 0.34, yb - st * 0.5), yb - st * 0.5]); }
  return Lp.concat([[X(x, y - h), y - h]], Rp.reverse()); }
function canada_spruce(x, y, h, w, n, lean) { return canada_pg(canada_sprucePts(x, y, h, w, n, lean)); }
// a sugar maple leaf pointing up, s is its half-size: five pointed lobes and a short stem
var canada_LEAFU = [[0, -1], [0.14, -0.6], [0.4, -0.76], [0.32, -0.36], [0.82, -0.5], [0.64, -0.16], [0.94, 0.02], [0.5, 0.2], [0.56, 0.46], [0.12, 0.3], [0.05, 0.78], [-0.05, 0.78], [-0.12, 0.3], [-0.56, 0.46], [-0.5, 0.2], [-0.94, 0.02], [-0.64, -0.16], [-0.82, -0.5], [-0.32, -0.36], [-0.4, -0.76], [-0.14, -0.6]];
function canada_leaf(x, y, s, ang) { return canada_pg(rotp(canada_LEAFU.map(function (p) { return [p[0] * s, p[1] * s]; }), x, y, ang)); }
// an irregular boulder: flat-ish bottom, rounded top
function canada_rockPts(x, y, rx, ry, rnd) { var p = []; for (var i = 0; i < 11; i++) { var t = i / 11 * Math.PI * 2, s = Math.sin(t), r = 0.86 + rnd() * 0.24; p.push([x + Math.cos(t) * rx * r, y + s * ry * r * (s > 0 ? 0.55 : 1)]); } return p; }
// the shaded lower right of a boulder: its outline from the right round under to the left, back over an inner curve
function canada_rockShade(p, x, y, rx, ry) { var o = [], i; for (i = 0; i < 7; i++) o.push(p[(i + 10) % 11]); o.push([x - rx * 0.1, y + ry * 0.1], [x + rx * 0.35, y - ry * 0.2]); return canada_pg(o); }

// ---------------------------------------------------------------- Canada
// A glacier lake in the Rockies: a jagged wall of snow-streaked grey peaks with a glacier in the middle, dense spruce on the
// far shore and in the turquoise water's reflection, a rockpile on the near left shore, a wooden dock and a log cabin with a
// stone chimney on the right, and sugar maples in red and orange. The near spruces (they sway), the canoes, the loon, the
// leaves, the chimney smoke, the clouds and the aurora are the engine's.
var canada_C = {
  L: {back: '#B5CADF', backSnow: '#EAF3FB', rock: '#8B98A8', shade: '#6A788A', snow: '#FBFDFF', ice: '#A6D9EC', foot: '#3D6352', mrefl: 'rgba(30,96,116,0.3)', strata: 'rgba(70,80,96,0.22)', streak: 'rgba(255,255,255,0.55)',
    spr1: '#2B5345', spr2: '#D8A33E', sprRefl: 'rgba(14,74,78,0.4)', shallow: 'rgba(196,252,238,0.42)', beach: '#CFC7B5', snowRefl: 'rgba(255,255,255,0.22)', glint: 'rgba(255,255,255,0.9)', shine: 'rgba(255,255,255,0.55)', ripple: 'rgba(255,255,255,0.5)', star: 'rgba(255,255,255,0)',
    ground: '#93A55C', stone: '#ABB1B7', near: '#24493C', wood: '#C88B52', woodD: '#6A4430', nShade: 'rgba(36,36,52,0.3)', red: '#D6382A', orange: '#EE8C2A', line: 'rgba(72,46,30,0.5)', grass: '#6E8A42', glow: 'rgba(255,255,250,0.85)', mist: 'rgba(255,255,255,0.55)'},
  D: {back: '#22345A', backSnow: '#4E6690', rock: '#2D3E5C', shade: '#202E48', snow: '#9FB4D2', ice: '#6890BA', foot: '#11282B', mrefl: 'rgba(110,160,220,0.1)', strata: 'rgba(8,12,28,0.4)', streak: 'rgba(200,220,245,0.55)',
    spr1: '#0D2123', spr2: '#5E4A2C', sprRefl: 'rgba(0,10,18,0.5)', shallow: 'rgba(80,170,170,0.12)', beach: '#38404A', snowRefl: 'rgba(170,195,230,0.16)', glint: 'rgba(230,245,255,0.8)', shine: 'rgba(160,210,240,0.22)', ripple: 'rgba(160,210,240,0.22)', star: 'rgba(255,250,235,0.85)',
    ground: '#1D2F2A', stone: '#4A5462', near: '#0D1E1C', wood: '#6E4C36', woodD: '#3A2820', nShade: 'rgba(4,6,18,0.42)', red: '#A8342C', orange: '#B8622A', line: 'rgba(8,6,12,0.5)', grass: '#2D4332', glow: 'rgba(90,220,170,0.16)', mist: 'rgba(120,150,200,0.12)'}
};
SCENES.canada = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(0.7), mid = Lay(0), near = Lay(0), C = canada_C[dk ? 'D' : 'L'], i, k, x, y;
  var S = ph ? 0.62 : Math.max(0.6, Math.min(1.1, H / 820)), hz = H * (ph ? 0.6 : 0.58);
  var sky = dk ? 'linear-gradient(180deg,#0A1430 0%,#172A50 46%,#2C4A5E 100%)' : 'linear-gradient(180deg,#9CCDF0 0%,#DCEEF8 50%,#EFF3E6 100%)';
  var lake = dk ? 'linear-gradient(180deg,#1C4459 0%,#123247 35%,#0D2638 100%)' : 'linear-gradient(180deg,#5ED2D0 0%,#2CB7C4 30%,#1FA0B4 72%,#3EBDBE 100%)';
  // the near shore: a rise for the rockpile on the left, a knoll for the cabin on the right and a shallow bay between
  var gnd = function (xx) { return H * (ph ? 0.885 : 0.875) - Math.exp(-Math.pow((xx - W * 0.07) / (W * 0.17), 2)) * H * (ph ? 0.05 : 0.07) - Math.exp(-Math.pow((xx - W * 0.9) / (W * 0.15), 2)) * H * (ph ? 0.045 : 0.06)
    + Math.exp(-Math.pow((xx - W * 0.42) / (W * 0.13), 2)) * H * 0.04 + Math.sin(xx / 47) * 2 + Math.sin(xx / 13) * 0.8; };
  var gp = []; for (x = -20; x <= W + 20; x += 8) gp.push([x, gnd(x)]);

  // ---- sky glow, soft clouds by day and an aurora glow at night (all blurred, behind the peaks)
  add(far, 'a', canada_e(W * 0.5, hz - H * 0.06, W * 0.75, H * 0.16), C.glow);
  add(far, 'b', canada_e(W * 0.3, hz - H * 0.02, W * 0.4, H * 0.025) + canada_e(W * 0.78, hz - H * 0.03, W * 0.35, H * 0.02), C.mist);
  if (dk) { add(far, 'c', canada_e(W * 0.45, H * 0.22, W * 0.5, H * 0.07) + canada_e(W * 0.8, H * 0.16, W * 0.3, H * 0.05), 'rgba(70,230,150,0.2)'); add(far, 'd', canada_e(W * 0.35, H * 0.1, W * 0.4, H * 0.05), 'rgba(170,110,240,0.16)'); }
  else { var cl = ''; [[0.12, 0.08, 1], [0.5, 0.05, 0.8], [0.86, 0.12, 0.9]].forEach(function (c) { var cx = W * c[0], cy = H * c[1], s = c[2] * (ph ? 0.6 : 1); cl += canada_e(cx, cy, 90 * s, 16 * s) + canada_c(cx - 30 * s, cy - 10 * s, 26 * s) + canada_c(cx + 20 * s, cy - 14 * s, 30 * s); }); add(far, 'c', cl, 'rgba(255,255,255,0.8)'); }

  // ---- the mountains: a pale back range, then the jagged front wall with snow, couloirs and a glacier
  var mh = ph ? 0.62 : 1;
  var BACK = ph ? [[-0.1, 0.24], [0.2, 0.3], [0.55, 0.33], [0.85, 0.29], [1.15, 0.26]] : [[-0.06, 0.25], [0.12, 0.3], [0.3, 0.27], [0.5, 0.34], [0.68, 0.29], [0.86, 0.32], [1.06, 0.27]];
  var FRONT = ph ? [[-0.08, 0.19], [0.1, 0.26], [0.28, 0.22], [0.46, 0.3], [0.64, 0.24], [0.82, 0.28], [1.02, 0.23], [1.14, 0.2]]
    : [[-0.04, 0.19], [0.06, 0.26], [0.15, 0.21], [0.24, 0.3], [0.33, 0.24], [0.43, 0.33], [0.53, 0.27], [0.61, 0.3], [0.7, 0.23], [0.79, 0.31], [0.88, 0.25], [0.96, 0.29], [1.06, 0.21]];
  function range(list, dip, jag) { var keys = [], pts = [], peaks = [];
    list.forEach(function (q, j) { var P = [W * q[0], hz - H * q[1] * mh]; if (j) { var A = list[j - 1], cx = W * (A[0] + q[0]) / 2 + (rnd() - 0.5) * W * 0.02, ch = Math.min(A[1], q[1]) * (dip + rnd() * 0.15); keys.push({p: [cx, hz - H * ch * mh], peak: false}); } keys.push({p: P, peak: true}); });
    keys.forEach(function (kk, j) { if (j) pts = pts.concat(canada_jag(keys[j - 1].p, kk.p, 5, jag * S, rnd)); if (kk.peak) peaks.push({p: kk.p, i: pts.length, l: j ? keys[j - 1].p : null, r: keys[j + 1] ? keys[j + 1].p : null}); pts.push(kk.p); });
    return {pts: pts, peaks: peaks}; }
  var back = range(BACK, 0.62, 14), front = range(FRONT, 0.55, 16);
  add(bg, 'a', canada_pg(back.pts.concat([[back.pts[back.pts.length - 1][0], hz + 4], [back.pts[0][0], hz + 4]])), C.back);
  var bsnow = ''; back.peaks.forEach(function (pk) { var p = pk.p, d = (hz - p[1]) * 0.2; bsnow += canada_pg([p, [p[0] + d * 1.3, p[1] + d], [p[0] + d * 0.4, p[1] + d * 0.8], [p[0], p[1] + d * 1.2], [p[0] - d * 0.5, p[1] + d * 0.8], [p[0] - d * 1.2, p[1] + d]]); });
  add(bg, 'b', bsnow, C.backSnow);
  add(bg, 'c', canada_pg(front.pts.concat([[front.pts[front.pts.length - 1][0], hz + 4], [front.pts[0][0], hz + 4]])), C.rock);
  var shade = '', snow = '', ice = '', strata = '', streak = '', FP = front.pts, snowP = [];
  front.peaks.forEach(function (pk, j) { var p = pk.p, ph2 = hz - p[1];
    // the shaded right face: from the summit down a facet line to the foot, and along the ridge to the next col
    if (pk.r) { var face = [p], q = pk.i + 1; while (q < FP.length && FP[q][0] <= pk.r[0] + 0.5) { face.push(FP[q]); q++; } face.push([pk.r[0], hz + 4], [p[0] + (pk.r[0] - p[0]) * 0.5, hz + 4]); shade += canada_pg(face); }
    // snow cap: the ridge on both sides down to depth d, closed by a ragged lower edge that drips into the gullies
    var d = ph2 * (0.2 + hash(j + 3) * 0.1), Lc = [], Rc = [], a = pk.i - 1, b = pk.i + 1;
    while (a >= 0 && FP[a][1] < p[1] + d) { Lc.unshift(FP[a]); a--; } while (b < FP.length && FP[b][1] < p[1] + d) { Rc.push(FP[b]); b++; }
    if (Lc.length && Rc.length) { var x0 = Lc[0][0], x1 = Rc[Rc.length - 1][0], drip = [];
      for (k = 1; k < 7; k++) { var xx = x1 - (x1 - x0) * k / 7, dd = d * (0.85 + ((k * 5 + j) % 3) * 0.28); drip.push([xx, Math.min(p[1] + dd, canada_yAt(FP, xx) + d * 1.5)]); }
      snowP.push(Lc.concat([p], Rc, drip)); }
    // snow streaks down the couloirs, and rock strata tilted across the faces (only where there is mountain)
    for (k = 0; k < 3; k++) { var sx = p[0] + (k - 1) * ph2 * 0.14 + (hash(j * 7 + k) - 0.5) * 10, sy = canada_yAt(FP, sx) + d * 0.8, len = ph2 * (0.08 + hash(j * 3 + k) * 0.14); if (sy > hz - 10) continue;
      streak += pline([[sx, sy], [sx + 1.5, sy + len * 0.35], [sx - 1, sy + len * 0.7], [sx + (hash(k + j) - 0.5) * 4, Math.min(hz - 6, sy + len)]]); }
    var xa = pk.l ? pk.l[0] + 6 : -40, xb = pk.r ? pk.r[0] - 6 : W + 40;
    for (k = 0; k < 3; k++) { var ly = p[1] + d + 10 + k * ph2 * 0.16, run = []; for (var xs = Math.max(xa, p[0] - ph2 * (0.1 + k * 0.05)); xs <= Math.min(xb, p[0] + ph2 * (0.14 + k * 0.04)); xs += 5) { var yy = ly + (xs - p[0]) * 0.28; if (yy > canada_yAt(FP, xs) + 5 && yy < hz - 8) run.push([xs, yy]); else if (run.length) { if (run.length > 2) strata += pline(run); run = []; } } if (run.length > 2) strata += pline(run); } });
  // the glacier hangs in the col between the two tallest central peaks
  var gi = ph ? 3 : 5, g0 = front.peaks[gi].p, g1 = front.peaks[gi + 1].p, gc = [(g0[0] + g1[0]) / 2, canada_yAt(FP, (g0[0] + g1[0]) / 2)], gw = (g1[0] - g0[0]) * 0.42, gd = (hz - gc[1]) * 0.72;
  var gl = [[gc[0] - gw, canada_yAt(FP, gc[0] - gw) + 2], [gc[0] - gw * 0.5, canada_yAt(FP, gc[0] - gw * 0.5) + 1], gc, [gc[0] + gw * 0.5, canada_yAt(FP, gc[0] + gw * 0.5) + 1], [gc[0] + gw, canada_yAt(FP, gc[0] + gw) + 2],
    [gc[0] + gw * 0.7, gc[1] + gd * 0.45], [gc[0] + gw * 0.42, gc[1] + gd * 0.8], [gc[0] + gw * 0.12, gc[1] + gd], [gc[0] - gw * 0.2, gc[1] + gd * 0.94], [gc[0] - gw * 0.55, gc[1] + gd * 0.6], [gc[0] - gw * 0.85, gc[1] + gd * 0.3]];
  snowP.push(gl); snowP.forEach(function (q) { snow += canada_pg(q); });
  for (k = 0; k < 4; k++) { var cy2 = gc[1] + gd * (0.3 + k * 0.16), cw2 = gw * (0.75 - k * 0.12); ice += canada_pg([[gc[0] - cw2, cy2], [gc[0], cy2 + 4 * S], [gc[0] + cw2, cy2 - 1], [gc[0], cy2 + 1.6 * S]]); }
  ice += canada_pg([[gc[0] + gw * 0.25, gc[1] + gd * 0.15], [gc[0] + gw * 0.7, gc[1] + gd * 0.45], [gc[0] + gw * 0.42, gc[1] + gd * 0.8], [gc[0] + gw * 0.12, gc[1] + gd], [gc[0] + gw * 0.2, gc[1] + gd * 0.55]]);
  add(bg, 'd', shade, C.shade); add(bg, 'e', snow, C.snow); add(bg, 'f', ice, C.ice);
  stk(bg, 's', strata, C.strata, 1); stk(bg, 't', streak, C.streak, ph ? 1 : 1.3);
  // forest climbing the foot of the mountains: a dense band of little spruce tops
  var foot = [[-20, hz + 4]]; for (x = -20; x <= W + 20; x += ph ? 5 : 6) { var th = H * (ph ? 0.035 : 0.055) * (0.75 + 0.6 * Math.sin(x / 90 + 0.5) * Math.sin(x / 37 + 1)) + 6 + rnd() * 9 * S; foot.push([x - 2, hz - th * 0.55], [x, hz - th]); }
  foot.push([W + 20, hz + 4]); add(bg, 'g', canada_pg(foot), C.foot);
  // the peaks and the foot forest mirrored in the lake
  add(bg, 'h', canada_pg(FP.map(function (p) { return [p[0], hz + (hz - p[1]) * 0.9 + 6]; }).concat([[FP[FP.length - 1][0], hz], [FP[0][0], hz]])), C.mrefl);

  // ---- the far shore: two tones of spruce standing on a pale stony beach, with their reflections
  var s1 = '', s2 = '', sr = '', beach = '', fs = [];
  for (x = -14; x < W + 14; x += (ph ? 5 : 7) + rnd() * (ph ? 6 : 9)) { var h = (ph ? 13 : 20) * (0.55 + rnd() * 0.9) * (1 + 0.25 * Math.sin(x / 120)), yb = hz + 2 + rnd() * 2, tr = canada_spruce(x, yb, h, h * 0.2, 5);
    if (rnd() < 0.55) s1 += tr; else { var hq2 = h * 0.85; s2 += canada_e(x, yb - hq2 * 0.55, hq2 * 0.24, hq2 * 0.45) + canada_c(x - hq2 * 0.12, yb - hq2 * 0.7, hq2 * 0.16) + canada_c(x + hq2 * 0.13, yb - hq2 * 0.42, hq2 * 0.17); } /* aspens in autumn gold among the spruces */ sr += canada_pg([[x - h * 0.16, hz + 5], [x + h * 0.16, hz + 5], [x, hz + 5 + h * 0.85]]); fs.push(x); }
  sr += canada_pg(foot.map(function (p) { return [p[0], hz + 5 + (hz - p[1]) * 0.6]; }));
  beach = canada_pg([[-20, hz + 1], [W + 20, hz + 1], [W + 20, hz + 5], [-20, hz + 5]]);
  add(mid, 'c', sr, C.sprRefl); add(mid, 'a', s1, C.spr1); add(mid, 'b', s2, C.spr2); add(mid, 'e', beach, C.beach);
  var sref = ''; snowP.forEach(function (q) { sref += canada_pg(q.map(function (p) { return [p[0], hz + (hz - p[1]) * 0.9 + 6]; })); });
  add(mid, 'f', sref, C.snowRefl);
  // the water: lighter shallows along the near shore, shine lines and glints; stars in the sky and in the lake at night
  var sh = ''; for (x = -20; x < W + 20; x += 30) sh += canada_e(x, gnd(x) - 3, 40, H * 0.02);
  sh += canada_e(W * 0.42, gnd(W * 0.42) - H * 0.02, W * 0.13, H * 0.035);
  add(mid, 'd', sh, C.shallow);
  var shine = '', glint = '', rip = '', stars = '';
  spread(0, hz + 14, W, gnd(W * 0.5) - hz - 20, ph ? 70 : 110, 16, rnd, 1).forEach(function (c) { if (c.y > gnd(c.x) - 8) return; if (c.q < 0.45) shine += seg(c.x, c.y, c.x + 10 + c.r * 26, c.y); else if (c.q > 0.85) glint += canada_e(c.x, c.y, dk ? 1 : 3, dk ? 1 : 0.9); });
  for (x = 0; x < W; x += 26 + rnd() * 30) { y = gnd(x) - 4; rip += 'M' + PT(x, y) + ' q' + n1(8) + ' ' + n1(-2) + ' ' + n1(16) + ' 0 '; }
  if (dk) { spread(0, 0, W, hz - H * 0.12, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.32 && c.y < canada_yAt(back.pts, c.x) - 6) stars += canada_c(c.x, c.y, 0.5 + c.r * 0.9); });
    spread(0, hz + 30, W, H * 0.2, 46, 26, rnd, 1).forEach(function (c) { if (c.q < 0.3 && c.y < gnd(c.x) - 10) glint += canada_c(c.x, c.y, 0.6 + c.r * 0.7); }); }
  add(mid, 'g', glint, C.glint); add(mid, 'h', stars, C.star); stk(mid, 's', shine, C.shine, 1.2); stk(mid, 't', rip, C.ripple, 1.2);

  // ---- the near shore
  add(near, 'a', canada_pg(gp.concat([[W + 20, H + 20], [-20, H + 20]])), C.ground);
  var stone = '', nsh = '', lines = '', grass = '', wood = '', woodD = '', red = '', orange = '', sprN = '', nSpr = [];
  // a pebbly beach along the water's edge
  var bt = gp.map(function (p) { return [p[0], p[1] - 1.5]; }), bb = gp.map(function (p) { return [p[0], p[1] + (ph ? 4 : 6) + Math.sin(p[0] / 19) * 1.5]; });
  stone += canada_pg(bt.concat(bb.reverse()));
  // the rockpile on the left: big boulders at the bottom, smaller ones stacked up toward the top
  var RP = [[0.0, 2, 50], [0.08, 6, 56], [0.165, 4, 42], [0.235, 8, 30], [0.04, -34, 42], [0.125, -30, 40], [0.2, -18, 28], [0.085, -62, 32], [0.16, -50, 24], [0.12, -82, 20], [0.05, -72, 22], [0.29, 10, 18]];
  // (layered by depth: a boulder lower down the pile is nearer, so the shading, cracks and outline of the ones behind stop
  // at its edge, and its own outline shows where it overlaps them)
  var rocks = RP.map(function (q) { var rx = q[2] * S * (ph ? 1.2 : 1), xx = W * q[0], yy = gnd(xx) + q[1] * S * (ph ? 1.1 : 1), ry = rx * 0.68; return {x: xx, y: yy, rx: rx, ry: ry, p: canada_rockPts(xx, yy, rx, ry, rnd)}; });
  rocks.sort(function (a, b) { return (a.y + a.ry * 0.55) - (b.y + b.ry * 0.55); });
  var inPoly = function (P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } return c; };
  var dens = function (P, closed) { var o = [], n = closed ? P.length : P.length - 1; for (var i = 0; i < n; i++) { var A2 = P[i], B2 = P[(i + 1) % P.length]; for (var m = 0; m < 8; m++) o.push([A2[0] + (B2[0] - A2[0]) * m / 8, A2[1] + (B2[1] - A2[1]) * m / 8]); } if (!closed) o.push(P[P.length - 1]); return o; };
  var nearest = function (P, x, y) { var best = null, bd = 1e18; for (var i = 0; i < P.length; i++) { var A2 = P[i], B2 = P[(i + 1) % P.length], dx = B2[0] - A2[0], dy = B2[1] - A2[1], t = Math.max(0, Math.min(1, ((x - A2[0]) * dx + (y - A2[1]) * dy) / (dx * dx + dy * dy || 1))), qx = A2[0] + dx * t, qy = A2[1] + dy * t, d = (qx - x) * (qx - x) + (qy - y) * (qy - y); if (d < bd) { bd = d; best = [qx, qy]; } } return best; };
  rocks.forEach(function (r, j) { var front = rocks.slice(j + 1).filter(function (o) { return Math.abs(o.x - r.x) < o.rx + r.rx && Math.abs(o.y - r.y) < o.ry + r.ry; });
    var cover = function (x, y) { for (var i = 0; i < front.length; i++) if (inPoly(front[i].p, x, y)) return front[i]; return null; };
    stone += canada_pg(r.p);
    var shd = canada_rockShade(r.p, r.x, r.y, r.rx, r.ry), so = []; for (var i = 0; i < 7; i++) so.push(r.p[(i + 10) % 11]); so.push([r.x - r.rx * 0.1, r.y + r.ry * 0.1], [r.x + r.rx * 0.35, r.y - r.ry * 0.2]);
    nsh += canada_pg(dens(so, true).map(function (pt) { var c = cover(pt[0], pt[1]); return c ? nearest(c.p, pt[0], pt[1]) : pt; }));
    var runs = function (pts) { var out = '', cur = []; pts.forEach(function (pt) { if (cover(pt[0], pt[1])) { if (cur.length > 1) out += pline(cur); cur = []; } else cur.push(pt); }); if (cur.length > 1) out += pline(cur); return out; };
    lines += runs(dens([[r.x - r.rx * 0.3, r.y - r.ry * 0.5], [r.x - r.rx * 0.18, r.y - r.ry * 0.15], [r.x - r.rx * 0.23, r.y + r.ry * 0.15]], false));
    // its outline where it stands in front of another boulder
    if (j > 0) { var behind = rocks.slice(0, j), ol = dens(r.p, true).concat([r.p[0]]), cur3 = []; ol.forEach(function (pt) { var on = behind.some(function (o) { return inPoly(o.p, pt[0], pt[1]); }) && !cover(pt[0], pt[1]); if (on) cur3.push(pt); else { if (cur3.length > 1) lines += pline(cur3); cur3 = []; } }); if (cur3.length > 1) lines += pline(cur3); } });
  // the dock: a plank deck reaching left from the knoll, on posts standing in the water
  var dy = H * (ph ? 0.842 : 0.835), dx0 = W * (ph ? 0.5 : 0.555), dx1 = W * (ph ? 0.76 : 0.775), dt = 6 * S;
  wood += rect(dx0, dy, dx1 - dx0, dt); woodD += rect(dx0, dy + dt, dx1 - dx0, 4 * S);
  for (x = dx0 + 6 * S; x < dx1; x += 34 * S) { woodD += rect(x - 2.4 * S, dy + dt, 4.8 * S, 18 * S); sh += canada_e(x, dy + dt + 18 * S, 7 * S, 1.6 * S); }
  for (x = dx0 + 9 * S; x < dx1; x += 9 * S) lines += seg(x, dy + 0.5, x - 1, dy + dt - 0.5);
  woodD += rect(dx0 + 2 * S, dy - 10 * S, 3.4 * S, 10 * S) + canada_c(dx0 + 3.7 * S, dy - 10 * S, 2.4 * S);   // a mooring post
  // a white flagpole at the dock's end flying the Canadian flag (the engine draws and waves the cloth)
  var cfx = dx0 + 16 * S, cfH = (ph ? 64 : 88) * S; stone += rect(cfx - 1.3 * S, dy - cfH, 2.6 * S, cfH) + canada_c(cfx, dy - cfH - 1.5 * S, 2.4 * S); var caFlag = {x: cfx + 1.3 * S, y: dy - cfH + 1.5 * S, w: (ph ? 30 : 42) * S, h: (ph ? 15 : 21) * S};
  // the log cabin on the knoll: log walls with crossed corners, a shingled roof, two windows, a door and a stone chimney
  var cx = W * (ph ? 0.82 : 0.875), cs = S * (ph ? 1.1 : 1), cb = gnd(cx) + 2 * cs, cw = 150 * cs, wh = 52 * cs, rh = 40 * cs, cl0 = cx - cw / 2, cl1 = cx + cw / 2;
  // the knoll it stands on runs back behind it (a grassy rise with a pebbly edge to the water), so it stands on land, not at
  // the water's edge
  var kn = [], kL = cl0 - 70 * cs, kR = W + 20, kT = cb - 16 * cs; for (x = kL; x <= kR; x += 6) { var ku = Math.min(1, (x - kL) / (60 * cs)); kn.push([x, Math.min(gnd(x), kT + (1 - Math.sin(ku * Math.PI / 2)) * (gnd(x) - kT) + Math.sin(x / 17) * 1.2 * cs)]); }
  add(near, 'a', canada_pg(kn.concat([[kR, gnd(kR) + 4], [kL, gnd(kL) + 4]])), C.ground);
  stone += canada_pg(kn.slice(0, Math.ceil(64 * cs / 6)).map(function (p) { return [p[0], p[1] - 1.5]; }).concat(kn.slice(0, Math.ceil(64 * cs / 6)).map(function (p) { return [p[0] + 1, p[1] + 3 * cs]; }).reverse()));
  var chX = cl0 - 4 * cs, chW = 20 * cs, chTop = cb - wh - rh - 10 * cs;
  stone += canada_pg([[chX - chW / 2 - 3 * cs, cb], [chX - chW / 2, cb - wh * 0.5], [chX - chW * 0.38, chTop], [chX + chW * 0.38, chTop], [chX + chW / 2, cb - wh * 0.5], [chX + chW / 2 + 3 * cs, cb]]);
  stone += rect(chX - chW * 0.46, chTop - 4 * cs, chW * 0.92, 5 * cs) + rect(cl0 - 2 * cs, cb - 6 * cs, cw + 4 * cs, 8 * cs);
  // (its stone courses stop where the log wall, its corner ends and the roof cover the chimney, or they'd be drawn over them)
  var chR = function (y) { if (y > cb - wh + 6 * cs) return cl0 - 5 * cs; if (y >= cb - wh - rh) return cl0 - 14 * cs + 22 * cs * (cb - wh + 2 * cs - y) / (rh + 2 * cs); return 1e9; };
  for (k = 0; k < 9; k++) { var sy2 = cb - 6 * cs - k * (wh + rh) / 9.5, sx3 = chX - chW * 0.4 + ((k * 7) % 4) * chW * 0.2, sy3 = sy2 - (wh + rh) / 9.5, xr = Math.min(chX + chW * 0.42, chR(sy2));
    if (xr > chX - chW * 0.42 + 1) lines += seg(chX - chW * 0.42, sy2, xr, sy2); if (sx3 < Math.min(chR(sy2), chR(sy3)) - 1) lines += seg(sx3, sy2, sx3, sy3); }
  wood += rect(cl0, cb - wh, cw, wh - 4 * cs);
  var wins = [[cx - cw * 0.3, cb - wh * 0.72, 24 * cs, 20 * cs], [cx + cw * 0.08, cb - wh * 0.72, 24 * cs, 20 * cs]], door = [cx + cw * 0.3, cb - wh * 0.86, 18 * cs, wh * 0.86 - 4 * cs];
  // the log seams run between the windows and the door, not across them
  var holes = wins.map(function (w) { return [w[0] - 3 * cs, w[1] - 3 * cs, w[0] + w[2] + 3 * cs, w[1] + w[3] + 3 * cs]; }).concat([[door[0] - 2.5 * cs, door[1] - 2.5 * cs, door[0] + door[2] + 2.5 * cs, door[1] + door[3]]]);
  for (y = cb - wh + 7 * cs; y < cb - 4 * cs; y += 7 * cs) { var lx0 = cl0 - 2.4 * cs; holes.filter(function (o) { return y > o[1] && y < o[3]; }).sort(function (a, b) { return a[0] - b[0]; }).forEach(function (o) { if (o[0] > lx0) lines += seg(lx0, y, o[0], y); lx0 = Math.max(lx0, o[2]); }); if (cl1 + 2.4 * cs > lx0) lines += seg(lx0, y, cl1 + 2.4 * cs, y); /* (the seams run out to where the round log ends meet, at both corners) */ wood += canada_c(cl0 - 1 * cs, y - 3.5 * cs, 3.8 * cs) + canada_c(cl1 + 1 * cs, y - 3.5 * cs, 3.8 * cs); }
  // the bottom log gets round ends too, like the ones above it
  var lastSeam = cb - wh + 7 * cs; while (lastSeam + 7 * cs < cb - 4 * cs) lastSeam += 7 * cs; var by4 = (lastSeam + cb - 4 * cs) / 2, br4 = Math.max(2.5 * cs, (cb - 4 * cs - lastSeam) / 2 + 0.3 * cs); wood += canada_c(cl0 - 1 * cs, by4, br4) + canada_c(cl1 + 1 * cs, by4, br4);
  var roof = canada_pg([[cl0 - 14 * cs, cb - wh + 2 * cs], [cl0 + 8 * cs, cb - wh - rh], [cl1 - 8 * cs, cb - wh - rh], [cl1 + 14 * cs, cb - wh + 2 * cs], [cl1 + 12 * cs, cb - wh + 6 * cs], [cl0 - 12 * cs, cb - wh + 6 * cs]]);
  woodD += roof; for (k = 1; k < 5; k++) { var ry2 = cb - wh - rh + rh * k / 5 + 2 * cs; lines += seg(cl0 + 8 * cs - 22 * cs * k / 5, ry2, cl1 - 8 * cs + 22 * cs * k / 5, ry2); }
  wins.forEach(function (w) { woodD += rect(w[0] - 3 * cs, w[1] - 3 * cs, w[2] + 6 * cs, w[3] + 6 * cs); nsh += rect(w[0], w[1], w[2], w[3]); lines += seg(w[0] + w[2] / 2, w[1], w[0] + w[2] / 2, w[1] + w[3]) + seg(w[0], w[1] + w[3] / 2, w[0] + w[2], w[1] + w[3] / 2); });
  woodD += rect(door[0] - 2.5 * cs, door[1] - 2.5 * cs, door[2] + 5 * cs, door[3] + 2.5 * cs); nsh += rect(door[0], door[1], door[2], door[3]) + rect(cl0, cb - wh, cw, 6 * cs);
  wood += rect(door[0] - 6 * cs, cb - 4 * cs, door[2] + 12 * cs, 4 * cs);
  nsh += canada_pg([[cl0 - 4 * cs, cb - 1 * cs], [cl1 + 2 * cs, cb - 1 * cs], [cl1 + 20 * cs, cb + 3.5 * cs], [cl0 + 10 * cs, cb + 3.5 * cs]]); // (a contact shadow cast back-right onto the ground, not a big blot)
  // a gravel path from the cabin door down to the dock
  var pa0 = [door[0] + door[2] / 2, cb], pa1 = [dx1 - 6 * S, dy + dt + 3 * S], pl = [], pr = [];
  for (k = 0; k <= 8; k++) { var u = k / 8, px = pa0[0] + (pa1[0] - pa0[0]) * u, py = pa0[1] + (pa1[1] - pa0[1]) * u + Math.sin(u * Math.PI) * 14 * S, pw = (5 + u * 7) * S; pl.push([px - pw * 0.4, py - pw * 0.5]); pr.unshift([px + pw * 0.4, py + pw * 0.5]); }
  stone += canada_pg(pl.concat(pr));
  // a woodpile beside the chimney: rows of split log ends under a little lean-to roof
  if (!ph) { var wpx = chX - chW / 2 - 46 * cs, wpy = gnd(wpx + 18 * cs) + 2 * cs, lr = 3.6 * cs;
  woodD += rect(wpx - 2 * cs, wpy - 26 * cs, 4 * cs, 26 * cs) + rect(wpx + 36 * cs, wpy - 26 * cs, 4 * cs, 26 * cs) + canada_pg([[wpx - 6 * cs, wpy - 25 * cs], [wpx + 18 * cs, wpy - 31 * cs], [wpx + 44 * cs, wpy - 25 * cs], [wpx + 44 * cs, wpy - 22 * cs], [wpx - 6 * cs, wpy - 22 * cs]]);
  for (k = 0; k < 3; k++) for (i = 0; i < 5 - (k === 2 ? 1 : 0); i++) { var lx = wpx + 4 * cs + i * 7.4 * cs + (k % 2) * 3.7 * cs, ly2 = wpy - lr - k * 6.6 * cs; wood += canada_c(lx, ly2, lr); lines += 'M' + PT(lx - lr * 0.45, ly2) + ' a' + n1(lr * 0.45) + ' ' + n1(lr * 0.45) + ' 0 1 1 ' + n1(lr * 0.9) + ' 0 '; }
  nsh += canada_e(wpx + 19 * cs, wpy + 1, 24 * cs, 3 * cs); }
  // two red lawn chairs facing the lake: one on the dock, one on the grass by the bay
  function chair(x, y, s) { var q = function (pp) { return canada_pg(pp.map(function (p) { return [x + p[0] * s, y + p[1] * s]; })); };
    lines += seg(x - 7 * s, y - 10.6 * s, x + 6 * s, y - 9 * s) + seg(x + 7.6 * s, y - 14 * s, x + 12.6 * s, y - 27 * s);
    return q([[-11, -12], [7, -10], [7, -7.6], [-11, -9.6]]) + q([[5, -10], [10, -31], [15.6, -29], [9.6, -8]]) + q([[-13, -17.6], [9, -18.6], [9, -16.4], [-13, -15.4]])
      + q([[-11, -16], [-8.6, -16], [-8.6, 0], [-11, 0]]) + q([[7, -10], [9.4, -10], [11.6, 0], [9.2, 0]]) + q([[-1.4, -16], [1, -16], [1, -10], [-1.4, -10]]); }
  red += chair(dx0 + (dx1 - dx0) * 0.24, dy, 1.05 * S * (ph ? 1.2 : 1));
  var c2x = W * (ph ? 0.47 : 0.517), c2s = 1.15 * S * (ph ? 1.2 : 1); red += chair(c2x, gnd(c2x) + 16 * S, c2s);
  // grass tufts, ferns and fallen leaves stay off the chair and the gravel path (they'd be drawn over them)
  var chairBox = [c2x - 15 * c2s, gnd(c2x) + 16 * S - 33 * c2s, c2x + 18 * c2s, gnd(c2x) + 16 * S + 2];
  var clearAt = function (x, y, r) { if (x + r > chairBox[0] && x - r < chairBox[2] && y + r > chairBox[1] && y - r < chairBox[3]) return false;
    for (var q = 0; q <= 8; q++) { var u = q / 8, px = pa0[0] + (pa1[0] - pa0[0]) * u, py = pa0[1] + (pa1[1] - pa0[1]) * u + Math.sin(u * Math.PI) * 14 * S, pw = (5 + u * 7) * S; if (Math.abs(x - px) < pw * 0.6 + r && y > py - pw * 0.7 - 2 && y - 12 < py + pw * 0.7) return false; } return true; }; nsh += canada_e(c2x + 2 * S, gnd(c2x) + 16 * S, 16 * S, 2.6 * S);
  // spruces behind the cabin and the rockpile (the engine draws these swaying; the still scene paints them here)
  (ph ? [[0.0, 150], [0.12, 120], [0.66, 120], [0.95, 165]] : [[0.0, 190], [0.05, 150], [0.135, 120], [0.8, 150], [0.835, 120], [0.955, 175], [1.0, 210]]).forEach(function (q, j) { var xx = W * q[0], hh = q[1] * S * (ph ? 1.4 : 1); var fr = xx < W * 0.3; nSpr.push([xx, fr ? gnd(xx) + (ph ? 62 : 48) * S : gnd(xx) - (j % 2 ? 8 : 14) * S, hh, hh * 0.2, 9, fr]); /* (those by the rockpile stand on the grass in front of it) */ });
  // two sugar maples in autumn colour: one by the rockpile, one in front of the cabin, and a branch over the top right corner
  var maples = [], mTr = '';
  (ph ? [[0.3, 0.9], [1.02, 1.1]] : [[0.245, 0.95], [0.995, 1.25]]).forEach(function (q, j) { var mx = W * q[0], my = gnd(mx) + 4, ms = S * q[1] * (ph ? 1.3 : 1), cyy = my - 120 * ms, R = 62 * ms;
    mTr += canada_pg([[mx - 7 * ms, my], [mx - 5 * ms, my - 60 * ms], [mx - 30 * ms, my - 100 * ms], [mx - 26 * ms, my - 104 * ms], [mx - 2 * ms, my - 76 * ms], [mx + 4 * ms, my - 112 * ms], [mx + 9 * ms, my - 110 * ms], [mx + 5 * ms, my - 64 * ms], [mx + 28 * ms, my - 92 * ms], [mx + 31 * ms, my - 88 * ms], [mx + 7 * ms, my - 50 * ms], [mx + 8 * ms, my]]);
    // a red core, then mottled clusters of red and orange (orange catching the light at the top left), leaves at the edge
    for (k = 0; k < 7; k++) { var a0 = k / 7 * Math.PI * 2; red += canada_c(mx + Math.cos(a0) * R * 0.45, cyy + Math.sin(a0) * R * 0.3, R * 0.5); }
    for (k = 0; k < 150; k++) { var a = hash(k + j * 90 + 1) * Math.PI * 2, d = Math.sqrt(hash(k + j * 90 + 2)) * 0.92, bx = mx + Math.cos(a) * d * R * 1.0, by = cyy + Math.sin(a) * d * R * 0.72, /* (kept within the crown so no blob sits apart from it) */ br = (5 + hash(k + j * 90 + 3) * 5.5) * ms, lit = (mx - bx) / R * 0.3 + (cyy - by) / R * 0.5;
      if (hash(k + j * 90 + 4) < 0.42 + lit) orange += canada_c(bx, by, br); else red += canada_c(bx, by, br);
      if (d > 0.8 && k % 2 && by < my - 30 * ms) { var lf = canada_leaf(bx + Math.cos(a) * br, by + Math.sin(a) * br * 0.8, (6 + (k % 3) * 1.6) * ms, a * 57.3 + 90); if (k % 2) red += lf; else orange += lf; } }
    nsh += canada_e(mx + R * 0.15, my + 2, R * 0.8, 5 * ms); maples.push([mx, cyy, R]); });
  // low blueberry bushes in autumn red along the shore, and ferns
  (ph ? [[0.4, 1], [0.6, 0.8]] : [[0.31, 1], [0.37, 0.7], [0.49, 0.6]]).forEach(function (q, j) { var bx = W * q[0], by = gnd(bx) + 8 * S, bs = q[1] * S * (ph ? 1.3 : 1);
    nsh += canada_e(bx, by + 1, 30 * bs, 4 * bs);
    for (k = 0; k < 18; k++) { var ba = hash(k + j * 30) * Math.PI, bd = Math.sqrt(hash(k + j * 30 + 1)), ax = bx - Math.cos(ba) * bd * 24 * bs, ay = by - 3 * bs - Math.sin(ba) * bd * 13 * bs, ar = (3.4 + hash(k + j * 30 + 2) * 2.6) * bs;
      if (ax + ar > chairBox[0] && ax - ar < chairBox[2] && ay + ar > chairBox[1] && ay - ar < chairBox[3]) continue;   // the chair stands in front of the bush
      if (ay < by - 9 * bs && hash(k + j * 30 + 3) < 0.6) orange += canada_c(ax, ay, ar); else red += canada_c(ax, ay, ar); }
    for (k = 0; k < 2; k++) { var fx = bx + (k ? 30 : -32) * bs, fy = by + 2; if (!clearAt(fx, fy - 8 * bs, 14 * bs)) continue; for (i = -2; i <= 2; i++) { var fa = i * 0.42 - Math.PI / 2, fl = (16 - Math.abs(i) * 3) * bs, ex = fx + Math.cos(fa) * fl, ey = fy + Math.sin(fa) * fl;
      grass += 'M' + PT(fx, fy) + ' Q' + PT(fx + Math.cos(fa) * fl * 0.6 - i * 2, fy + Math.sin(fa) * fl * 0.7) + ' ' + PT(ex + i * 2, ey + 3 * bs) + ' '; } } });
  var brP = [[W + 20, H * (ph ? 0.12 : 0.02)], [W * 0.93, H * (ph ? 0.13 : 0.06)], [W * (ph ? 0.78 : 0.85), H * (ph ? 0.155 : 0.1)], [W * (ph ? 0.66 : 0.77), H * (ph ? 0.15 : 0.11)]];
  // the overhanging maple branch: a smoothly tapering limb from the corner, with little twigs off it, each ending in a
  // cluster of leaves turned every way (red, a few orange catching the light), and single leaves along the limb
  var bsc = ph ? 0.75 : 1, limbAt = function (u) { var n = brP.length - 1, f = Math.min(n - 1e-6, u * n), i2 = Math.floor(f), t2 = f - i2, a2 = brP[i2], b2 = brP[i2 + 1], p0 = brP[Math.max(0, i2 - 1)], p3 = brP[Math.min(n, i2 + 2)];
    var cr = function (q) { return 0.5 * (2 * a2[q] + (-p0[q] + b2[q]) * t2 + (2 * p0[q] - 5 * a2[q] + 4 * b2[q] - p3[q]) * t2 * t2 + (-p0[q] + 3 * a2[q] - 3 * b2[q] + p3[q]) * t2 * t2 * t2); }; return [cr(0), cr(1)]; };
  var LT = [], LB = []; for (k = 0; k <= 40; k++) { var u3 = k / 40, c3 = limbAt(u3), c4 = limbAt(Math.min(1, u3 + 0.01)), dx3 = c4[0] - c3[0] || -1, dy3 = c4[1] - c3[1], dl = Math.hypot(dx3, dy3) || 1, wd = (12 - 9.5 * u3) * S * bsc; LT.push([c3[0] - dy3 / dl * wd / 2, c3[1] + dx3 / dl * wd / 2]); LB.unshift([c3[0] + dy3 / dl * wd / 2, c3[1] - dx3 / dl * wd / 2]); }
  mTr += canada_pg(LT.concat(LB));
  var cluster = function (cx2, cy2, n2, sz, seed) { for (var q = 0; q < n2; q++) { var a3 = hash(seed + q * 1.7) * Math.PI * 2, d3 = sz * (0.4 + hash(seed + q * 2.3) * 0.9), lx3 = cx2 + Math.cos(a3) * d3, ly3 = cy2 + Math.sin(a3) * d3 * 0.8, lf3 = canada_leaf(lx3, ly3, sz * (0.75 + hash(seed + q * 3.1) * 0.45), a3 * 57.3 + 90);
      if (hash(seed + q * 4.9) < 0.3 + (cy2 - ly3) / sz * 0.15) orange += lf3; else red += lf3; } maples.push([cx2, cy2, sz * 1.5]); };
  for (k = 0; k < 7; k++) { var u4 = 0.12 + k * 0.13, b4 = limbAt(u4), dn = k % 2 ? 1 : -0.6, tl = (16 + hash(k * 5.3) * 12) * S * bsc, tx4 = b4[0] - tl * 0.45, ty4 = b4[1] + dn * tl;
    mTr += canada_pg([[b4[0] - 1.6 * S, b4[1]], [b4[0] + 1.6 * S, b4[1]], [tx4 + 0.6 * S, ty4], [tx4 - 0.6 * S, ty4]]);
    cluster(tx4, ty4, 7, 8 * S * bsc, k * 13 + 3); }
  var tip = limbAt(1); cluster(tip[0] - 4 * S, tip[1] + 2 * S, 8, 8.5 * S * bsc, 71);
  for (k = 0; k < 9; k++) { var u5 = 0.08 + k * 0.1, b5 = limbAt(u5), lf5 = canada_leaf(b5[0] + (hash(k + 9) - 0.5) * 6 * S, b5[1] + (k % 2 ? 7 : -6) * S * bsc, 7.5 * S * bsc, (k % 2 ? 180 : 0) + (hash(k + 4) - 0.5) * 60); if (k % 3) red += lf5; else orange += lf5; }
  var fb = [[-20, H + 20]]; for (x = -20; x <= W + 20; x += 12) fb.push([x, H * (ph ? 0.965 : 0.955) - Math.sin(x / 140 + 1) * H * 0.012 - Math.sin(x / 41) * 2.5]); fb.push([W + 20, H + 20]);
  var bank = ''; // (no dark grassy strip across the very front any more)
  // behind the cabin the knoll carries on up into a stand of young spruces, so the tall ones there stand in woods on land
  // rather than rising out of the water
  (function () { var x0 = kL + 40 * cs, by5 = kT + 2 * cs, k6 = 0; bank += canada_pg([[x0, by5 + 8 * cs], [x0, by5], [W + 20, by5], [W + 20, by5 + 8 * cs]]);
    for (x = x0 + 6 * cs; x < W + 20; x += 13 * cs, k6++) { var hq = (34 + hash(k6 * 3.1) * 26) * cs; bank += canada_spruce(x, by5 + 2 * cs, hq, hq * 0.22, 6); } })();
  // fallen leaves in the grass and grass tufts along the shore
  spread(0, H * 0.82, W, H * 0.2, ph ? 34 : 46, 22, rnd, 1).forEach(function (c) { if (c.y < gnd(c.x) + 10 || !clearAt(c.x, c.y, 8)) return; if (c.q < 0.25) { var lf3 = canada_leaf(c.x, c.y, 4 + c.r * 3, c.k * 360); if (c.r < 0.5) red += lf3; else orange += lf3; }
    else if (c.q < 0.75) grass += 'M' + PT(c.x - 3, c.y) + ' Q' + PT(c.x - 2, c.y - 6) + ' ' + PT(c.x - 5, c.y - 10) + ' M' + PT(c.x + 1, c.y) + ' Q' + PT(c.x + 2, c.y - 7) + ' ' + PT(c.x + 5, c.y - 11) + ' M' + PT(c.x + 3, c.y) + ' L' + PT(c.x + 1, c.y - 8) + ' '; });
  for (x = W * 0.25; x < W * 0.56; x += 14 + rnd() * 40) { y = gnd(x) + 2; if (!clearAt(x + 4, y, 6)) continue; for (k = 0; k < 3; k++) grass += 'M' + PT(x + k * 3, y) + ' Q' + PT(x + k * 3 + 1, y - 5) + ' ' + PT(x + k * 4 - 3 + rnd() * 2, y - 8 - rnd() * 6) + ' '; }
  var canoes = [{x: W * (ph ? 0.56 : 0.6), y: dy + (ph ? 22 : 30) * S, L: (ph ? 70 : 84) * S, c: 0}, {x: W * (ph ? 0.66 : 0.68), y: dy - 5 * S, L: (ph ? 62 : 74) * S, c: 1}];
  // every spruce stands on a short brown trunk with a flared foot and a little shadow on the ground
  var sprT = ''; nSpr.forEach(function (t) { var tw2 = t[3] * 0.11; sprT += canada_pg([[t[0] - tw2 * 1.6, t[1] + 2], [t[0] - tw2, t[1] - 2], [t[0] - tw2 * 0.8, t[1] - t[2] * 0.14], [t[0] + tw2 * 0.8, t[1] - t[2] * 0.14], [t[0] + tw2, t[1] - 2], [t[0] + tw2 * 1.6, t[1] + 2]]); nsh += canada_e(t[0] + t[3] * 0.25, t[1] + 2, t[3] * 0.7, 3 * S); });
  if (!ANIM) sprN += sprT; // (still scene: in the spruces' own slot, so the cabin and rocks stay in front of those behind them; the engine draws them brown)
  if (!ANIM) { nSpr.forEach(function (t) { sprN += canada_spruce(t[0], t[1] - t[2] * 0.06, t[2], t[3], t[4]); });
    canoes.forEach(function (c) { var L = c.L, h = L * 0.13; red += canada_pg([[c.x - L / 2, c.y - h], [c.x - L * 0.36, c.y - h * 0.3], [c.x + L * 0.36, c.y - h * 0.3], [c.x + L / 2, c.y - h], [c.x + L * 0.32, c.y + h * 0.5], [c.x - L * 0.32, c.y + h * 0.5]]); lines += seg(c.x - L * 0.38, c.y - h * 0.3, c.x + L * 0.38, c.y - h * 0.3); }); }
  add(near, 'b', stone, C.stone); add(near, 'c', sprN + bank, C.near); add(near, 'd', wood, C.wood); add(near, 'e', woodD + mTr, C.woodD); add(near, 'f', nsh, C.nShade); add(near, 'g', red, C.red); add(near, 'h', orange, C.orange);
  stk(near, 's', lines, C.line, 1.1); stk(near, 't', grass, C.grass, 1.3);
  if (ANIM) {
    var env = [], sk = []; for (x = -20; x <= W + 20; x += 10) env.push([x, Math.min(canada_yAt(back.pts, x), canada_yAt(FP, x)) + 3]);
    ANIM.caflag = caFlag; ANIM.C = C; ANIM.hz = hz; ANIM.gp = gp; ANIM.S = S; ANIM.sky = env; ANIM.spr = nSpr; ANIM.canoes = canoes; ANIM.maples = maples; ANIM.wins = wins; ANIM.door = door; ANIM.chim = [chX, chTop - 4 * cs, cs];
    ANIM.peakY = hz - H * 0.3 * mh; ANIM.bay = [W * (ph ? 0.27 : 0.25), W * (ph ? 0.42 : 0.43), gnd(W * 0.42)]; ANIM.dock = [dx0, dx1, dy];
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near, band: {top: hz, bg: lake}};
};
