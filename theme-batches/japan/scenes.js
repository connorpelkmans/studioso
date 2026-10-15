// ---- batch japan: japan (Japan)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other.
function japan_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function japan_pg(p) { return poly(japan_area(p) < 0 ? p.slice().reverse() : p); }
function japan_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function japan_c(x, y, r) { return japan_e(x, y, r, r); }
// a smooth curve through the control points (Catmull-Rom), n samples per span
function japan_spline(c, n) { var out = [], i, k; for (i = 0; i < c.length - 1; i++) { var p0 = c[Math.max(0, i - 1)], p1 = c[i], p2 = c[i + 1], p3 = c[Math.min(c.length - 1, i + 2)];
  for (k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  out.push(c[c.length - 1]); return out; }
// where a curve (a list of points) crosses height y: its x, from the first segment that does
function japan_xAt(p, y) { for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return p[p.length - 1][0]; }
// a curve's height at x (the curve runs left to right)
function japan_yAt(p, x) { for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return p[x < p[0][0] ? 0 : p.length - 1][1]; }
// a tapering, gently curved limb from (x0, y0) to (x1, y1), w0 to w1 wide, bowed sideways by 'bend'
function japan_limb(x0, y0, x1, y1, w0, w1, bend) { var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, A = [], B = [];
  for (var i = 0; i <= 10; i++) { var t = i / 10, b = Math.sin(Math.PI * t) * bend, cx = x0 + dx * t + nx * b, cy = y0 + dy * t + ny * b, w = (w0 + (w1 - w0) * t) / 2; A.push([cx + nx * w, cy + ny * w]); B.unshift([cx - nx * w, cy - ny * w]); }
  return japan_pg(A.concat(B)); }
// a cloud of cherry blossom: overlapping round puffs (pink) with lighter puffs up and to the left (hi); returns the puffs too
function japan_bloom(x, y, rx, ry, n, seed, S) { var d = japan_e(x, y + ry * 0.05, rx * 0.78, ry * 0.72), hi = '', dots = [], pts = [];
  for (var i = 0; i < n; i++) { var a = hash(seed + i * 3.1) * Math.PI * 2, q = Math.sqrt(hash(seed + i * 7.7)), cx = x + Math.cos(a) * rx * q, cy = y + Math.sin(a) * ry * q, r = (0.17 + hash(seed + i * 5.3) * 0.17) * Math.min(rx, ry) + 2.6 * S;
    d += japan_c(cx, cy, r); pts.push([cx, cy, r]); if (cy < y + ry * 0.2 && hash(seed + i * 2.9) < 0.75) hi += japan_c(cx - r * 0.3, cy - r * 0.32, r * 0.5);
    for (var k = 0; k < 3; k++) { var b = hash(seed + i * 11 + k) * 6.28, rr = r * (0.5 + hash(seed + i + k * 13) * 0.45); dots.push([cx + Math.cos(b) * rr, cy + Math.sin(b) * rr]); } }
  return {d: d, hi: hi, dots: dots, pts: pts}; }
// fills a convex shape with close vertical strokes, so a translucent stroke tone lays a flat shade over what is beneath
function japan_hatch(p) { var x0 = Infinity, x1 = -Infinity, out = '', i, x; p.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); });
  for (x = Math.ceil(x0 * 2) / 2 + 0.25; x < x1; x += 0.8) { var lo = Infinity, hi = -Infinity; for (i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) { var yy = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = Math.min(lo, yy); hi = Math.max(hi, yy); } }
    if (hi > lo + 0.3) out += seg(x, lo, x, hi); } return out; }
// a sloped Japanese roof seen side-on: eaves at y, w wide at the eaves (a little overhang), ridge h higher, tips curled up
function japan_roof(x, y, w, h, curl) { var p = [], k, c = curl == null ? 0.2 : curl;
  for (k = 0; k <= 8; k++) { var u = k / 8; p.push([x - w / 2 + u * w * 0.22, y - h * (Math.pow(u, 0.65)) * 0.92 - (1 - u) * h * c]); }
  p.push([x - w * 0.24, y - h], [x + w * 0.24, y - h]);
  for (k = 8; k >= 0; k--) { u = k / 8; p.push([x + w / 2 - u * w * 0.22, y - h * (Math.pow(u, 0.65)) * 0.92 - (1 - u) * h * c]); }
  p.push([x + w / 2 - w * 0.03, y + h * 0.1], [x - w / 2 + w * 0.03, y + h * 0.1]); return japan_pg(p); }
// one roof of the pagoda: a deep eave whose tips sweep up, with the next storey standing on its crown
function japan_pgRoof(x, y, w, rw, s) { var p = [], k, u;
  p.push([x - rw / 2 - 3 * s, y - 11 * s]);
  for (k = 0; k <= 10; k++) { u = k / 10; p.push([x - rw / 2 + u * (rw - w) / 2, y - 6 * s * Math.pow(1 - u, 2.2)]); }
  for (k = 0; k <= 10; k++) { u = k / 10; p.push([x + w / 2 + u * (rw - w) / 2, y - 6 * s * Math.pow(u, 2.2)]); }
  p.push([x + rw / 2 + 3 * s, y - 11 * s]);
  for (k = 10; k >= 0; k--) { u = k / 10; p.push([x + w * 0.36 + u * (rw / 2 - w * 0.36), y - 9 * s - 13 * s * Math.pow(1 - u, 1.5)]); }
  for (k = 0; k <= 10; k++) { u = k / 10; p.push([x - w * 0.36 - u * (rw / 2 - w * 0.36), y - 9 * s - 13 * s * Math.pow(1 - u, 1.5)]); }
  return japan_pg(p); }

// ---------------------------------------------------------------- Japan
// The classic view: Mount Fuji's snowy cone rising behind a five-storey red pagoda on a wooded hill, cherry trees in full
// bloom all round it, a stair path with a torii and stone lanterns coming down to the river, the roofs of a little town
// below the mountain and a red arched bridge over the river in front. The clouds, the moon and its path on the water, the
// lit windows, the koinobori, the heron, the paper lanterns, the swaying branches and the petals are the engine's.
var japan_C = {
  L: {glow: 'rgba(255,246,242,0.35)', range: '#AFC6E2', haze: 'rgba(250,244,248,0.45)', fuji: '#7C99C6', fshade: '#6884B4', snow: '#FBFDFF', sshade: '#D3DFF2', gully: 'rgba(60,86,140,0.28)', mist: 'rgba(255,250,252,0.5)',
    hill1: '#97B9AE', hill2: '#76A08C', ground: '#9CC584', forest: '#4F8A5C', wall: '#F7F0E2', roof: '#4C5670', water: '#9ECDE2', pink: '#F5B3C6', red: '#DA4630', dark: '#4A3430', shine: 'rgba(255,255,255,0.8)', gold: '#E6B23A',
    grass: '#A6CF82', shrub: '#5D9658', trunk: '#6E4838', bloom: '#F6B0C5', bhi: '#FFE2EC', stone: '#CFC8BC', torii: '#E2482E', ink: '#3A3034', step: 'rgba(110,96,84,0.45)', blade: '#7DB060', star: 'rgba(255,255,255,0)'},
  D: {glow: 'rgba(170,160,240,0.3)', range: '#3A3D72', haze: 'rgba(120,100,170,0.35)', fuji: '#3A4278', fshade: '#2F3566', snow: '#CDD3F0', sshade: '#9EA6D4', gully: 'rgba(14,16,48,0.35)', mist: 'rgba(150,130,210,0.11)',
    hill1: '#2C3462', hill2: '#232A52', ground: '#28384E', forest: '#1A283A', wall: '#7E7FA2', roof: '#1C2036', water: '#2A3468', pink: '#C98AB0', red: '#A8343C', dark: '#16142A', shine: 'rgba(200,210,255,0.3)', gold: '#D9A848',
    grass: '#2B4152', shrub: '#1C3040', trunk: '#2A1E2C', bloom: '#B97CA4', bhi: '#E2AECB', stone: '#5C5C7E', torii: '#B4383A', ink: '#120E1E', step: 'rgba(10,8,30,0.45)', blade: '#3A5866', star: 'rgba(255,246,226,0.85)'}
};
SCENES.japan = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = japan_C[dk ? 'D' : 'L'], i, j, k, x, y;
  var S = ph ? Math.min(1, W / 390) * 0.78 : Math.max(0.6, Math.min(1.15, H / 800));
  var sky = dk ? 'linear-gradient(180deg,#141A3A 0%,#2A2D5A 45%,#5A4570 78%,#3A3560 100%)' : 'linear-gradient(180deg,#BFDDF2 0%,#EAF3F8 46%,#FBE6EA 76%,#F6DCE2 100%)';
  var moon = [W * (ph ? 0.84 : 0.87), H * (ph ? 0.2 : 0.19), (ph ? 22 : 34) * (ph ? 1 : S)];
  // ---- far: a soft glow, the far ranges and the haze
  add(far, 'a', japan_e(dk ? moon[0] : W * 0.6, dk ? moon[1] : H * 0.12, W * (ph ? 0.5 : 0.26), H * 0.16), C.glow);
  var rg = ridge(W, H * (ph ? 0.5 : 0.48), [[H * 0.05, 140, 0.4], [H * 0.02, 50, 1.9]], 8, true);
  add(far, 'b', below(rg, H + 40), C.range);
  add(far, 'c', japan_e(W * 0.5, H * (ph ? 0.55 : 0.56), W * 0.9, H * 0.06), C.haze);
  // ---- Mount Fuji: steep near the top, flaring out to a wide base, with a small flat summit
  var fx = W * (ph ? 0.6 : 0.6), ftop = H * (ph ? 0.15 : 0.1), bw = ph ? W * 1.0 : Math.min(W * 0.56, H * 0.92), hf = H * (ph ? 0.5 : 0.6), FU = [];
  for (i = 0; i <= 120; i++) { var u = -1.25 + i / 120 * 2.5, au = Math.abs(u), v = Math.max(0, (au - 0.06) / 0.94), yy = au < 0.06 ? ftop + hf * 0.006 * Math.sin(u * 160) : ftop + hf * (1 - Math.pow(Math.max(0, 1 - v), 1.9));
    if (au > 1) yy = ftop + hf + (au - 1) * hf * 0.1; FU.push([fx + u * bw, yy]); }
  var fbase = H * 0.8;
  add(bg, 'a', japan_pg(FU.concat([[FU[FU.length - 1][0], fbase], [FU[0][0], fbase]])), C.fuji);
  // the shaded eastern flank
  var sh = [[fx + bw * 0.02, ftop + hf * 0.01]]; for (i = 61; i <= 120; i++) sh.push(FU[i]); sh.push([FU[120][0], fbase], [fx + bw * 0.42, fbase]);
  for (i = 10; i >= 0; i--) { var t = i / 10; sh.push([fx + bw * (0.02 + 0.4 * Math.pow(t, 1.3)) + Math.sin(t * 9) * bw * 0.01, ftop + hf * 0.01 + (fbase - ftop) * t]); }
  add(bg, 'b', japan_pg(sh), C.fshade);
  // the snowcap: follows the outline over the top, its lower edge breaks into long fingers down the gullies
  var ys = ftop + hf * 0.3, xl = japan_xAt(FU.slice(0, 61), ys), xr = japan_xAt(FU.slice(60), ys), xa = xl - bw * 0.07, xb = xr + bw * 0.07, top = [], bot = [];
  FU.forEach(function (p) { if (p[0] >= xa && p[0] <= xb) top.push(p); });
  var NT = ph ? 60 : 110; for (i = NT; i >= 0; i--) { x = xa + (xb - xa) * i / NT; var oy = japan_yAt(FU, x), taper = Math.min(1, Math.min(x - xa, xb - x) / (bw * 0.12)), xu = (x - fx) / bw * 40, fing = hf * (0.012 + 0.11 * Math.pow(Math.max(0, Math.sin(xu * 0.9 + 1.3)), 2) * (0.55 + 0.45 * Math.sin(xu * 0.31 + 0.6)) + 0.045 * Math.pow(Math.max(0, Math.sin(xu * 2.1 + 2)), 3));
    bot.push([x, Math.max(oy + 1, ys) + fing * taper]); }
  var snowPts = top.concat(bot), snow = japan_pg(snowPts);
  add(bg, 'c', snow, C.snow);
  // blue shadow streaks on the snow (the sun is to the west), the far side in shade
  var ssh = '', snowBot = function (xx) { return japan_yAt(bot.slice().reverse(), xx); };
  // keeps a shade shape on the snow: its outline, sampled finely, is held between the mountain's outline and the snow's lower
  // edge (and squeezed to nothing past the snow's ends), so no streak pokes out into the sky or down onto the bare flank
  var onSnow = function (pts) { var out = []; for (var q = 0; q < pts.length; q++) { var a = pts[q], b = pts[(q + 1) % pts.length]; for (var m = 0; m < 12; m++) { var xx = a[0] + (b[0] - a[0]) * m / 12, yy = a[1] + (b[1] - a[1]) * m / 12, lo = japan_yAt(FU, xx) + 1.5, hi = xx > xa && xx < xb ? snowBot(xx) - 1.5 : lo; out.push([xx, Math.max(lo, Math.min(Math.max(lo, hi), yy))]); } } return japan_pg(out); };
  [[0.03, 0.1, 0.022], [0.06, 0.22, 0.03], [0.1, 0.34, 0.03], [0.13, 0.44, 0.024], [-0.05, -0.16, 0.014], [-0.1, -0.3, 0.016]].forEach(function (q) {
    var x0 = fx + q[0] * bw, x1 = fx + q[1] * bw, y0 = japan_yAt(FU, x0) + 3, y1 = snowBot(x1) - 4; if (y1 > y0 + 8) ssh += onSnow([[x0 - q[2] * bw * 0.3, y0], [x0 + q[2] * bw * 0.3, y0], [x1 + q[2] * bw, y1], [x1 - q[2] * bw * 0.4, y1 - hf * 0.03]]); });
  var rsx = []; top.forEach(function (p) { if (p[0] > fx + bw * 0.03) rsx.push(p); });
  if (rsx.length > 2) { var rpo = rsx.concat([[rsx[rsx.length - 1][0] - 2, snowBot(rsx[rsx.length - 1][0] - 2) - 2]]); for (i = 10; i >= 0; i--) { x = fx + bw * 0.03 + (rsx[rsx.length - 1][0] - fx - bw * 0.03) * i / 10; rpo.push([x + bw * 0.03 * Math.sin(i), Math.min(snowBot(x) - 2, japan_yAt(FU, x) + (snowBot(x) - japan_yAt(FU, x)) * 0.55)]); } ssh += onSnow(rpo); }
  add(bg, 'd', ssh, C.sshade);
  // gullies running down the flanks below the snow
  var gul = ''; [-0.32, -0.22, -0.14, -0.06, 0.04, 0.12, 0.2, 0.28, 0.36].forEach(function (q, n) { var x0 = fx + q * bw * 0.55, y0 = snowBot(x0) - 2, x1 = x0 + q * bw * 0.45, y1 = y0 + hf * (0.2 + 0.08 * hash(n + 3)); if (x0 > xa && x0 < xb && y0 > japan_yAt(FU, x0) + 4 && y1 > japan_yAt(FU, x1) + hf * 0.04) gul += 'M' + PT(x0, y0) + ' Q' + PT((x0 + x1) / 2 + q * 14, (y0 + y1) / 2) + ' ' + PT(x1, y1) + ' '; });
  stk(bg, 's', gul, C.gully, ph ? 1.2 : 1.8);
  // a mist band over the mountain's foot
  var mist = ''; [[0.3, 0.455, 0.2], [0.62, 0.47, 0.26], [0.9, 0.44, 0.16], [0.48, 0.5, 0.3], [0.08, 0.49, 0.2], [0.78, 0.515, 0.22]].forEach(function (q, n) { var mx = W * q[0], my = H * q[1] + (ph ? H * 0.02 : 0); mist += japan_e(mx, my, W * q[2], H * 0.011) + japan_e(mx - W * q[2] * 0.3, my - H * 0.008, W * q[2] * 0.45, H * 0.012); }); add(bg, 'e', mist, C.mist);
  // the forested foothills
  var fh1 = ridge(W, H * (ph ? 0.53 : 0.52), [[H * 0.025, 110, 1.2], [H * 0.012, 37, 0.3]], 6, false), fh2 = [];
  add(bg, 'f', below(fh1, H + 40), C.hill1);
  for (x = -60; x <= W + 60; x += ph ? 9 : 12) { var bump = (ph ? 6 : 9) * (0.6 + 0.6 * Math.abs(Math.sin(x * 0.13 + 1.7))); fh2.push([x, H * (ph ? 0.575 : 0.565) + Math.sin(x / 140 + 2.1) * H * 0.015 - bump]); }
  add(bg, 'g', below(fh2, H + 40), C.hill2);
  if (dk) { var stars = ''; spread(0, 0, W, H * 0.46, 44, 40, rnd, 1).forEach(function (c) { if (c.q < 0.45 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] * 2.4 && c.y < japan_yAt(FU, c.x) - 6) stars += seg(c.x, c.y, c.x + 0.1, c.y); }); stk(bg, 't', stars, C.star, 1.6 + rnd()); }
  if (dk && !ANIM) add(bg, 'h', japan_c(moon[0], moon[1], moon[2]), '#FFF4D6');
  // the horizon line over which the moon and clouds pass (they never cross nearer things)
  var horizon = fh2.map(function (p) { return [p[0], p[1]]; });

  // ---- mid: the pagoda hill, the town and the river
  var ground = '', forest = '', wall = '', roofs = '', water = '', pink = '', red = '', dark = '', shine = '', gold = '';
  ground += rect(-40, H * (ph ? 0.58 : 0.575), W + 80, H);
  // the wooded hill the pagoda stands on, rising to the left
  var px = W * (ph ? 0.2 : 0.165), pyb = H * (ph ? 0.66 : 0.645), ps = ph ? H * 0.32 / 245 : H * 0.44 / 245;
  var HL = [], hx1 = W * (ph ? 0.62 : 0.5);
  for (x = -60; x <= hx1; x += ph ? 7 : 10) { var tt = Math.max(0, Math.min(1, x / hx1)), base = H * ((ph ? 0.42 : 0.36) + (ph ? 0.2 : 0.25) * tt * tt * (3 - 2 * tt)), bb = (ph ? 7 : 11) * (0.5 + 0.7 * Math.abs(Math.sin(x * 0.11 + 0.4))) * (1 - tt * 0.5); HL.push([x, base - bb]); }
  HL.push([hx1 + 30, H * (ph ? 0.64 : 0.62)]);
  forest += japan_pg(HL.concat([[hx1 + 30, H * (ph ? 0.7 : 0.68)], [-60, H * (ph ? 0.8 : 0.78)]]));
  // a few taller cedars on the ridge
  [0.03, 0.09, 0.29, 0.36].forEach(function (q, n) { var cx = W * q * (ph ? 1.3 : 1), cy = japan_yAt(HL, cx) + 6, ch = (ph ? 34 : 54) * (0.8 + hash(n + 4) * 0.4); forest += japan_pg([[cx - ch * 0.22, cy], [cx - ch * 0.12, cy - ch * 0.55], [cx, cy - ch], [cx + ch * 0.12, cy - ch * 0.55], [cx + ch * 0.22, cy]]); });
  horizon = horizon.map(function (p) { var hy = p[0] <= hx1 ? japan_yAt(HL, p[0]) - (ph ? 36 : 56) * 0.2 : p[1]; return [p[0], Math.min(p[1], hy)]; });
  var hillT = [];
  // cherry trees in bloom dotted over the hill (behind the pagoda): each on a trunk with a patch of shade at its foot, and its
  // upper-left puffs lit (a pale wash laid with the shine strokes)
  var japan_tree3d = function (b, cx, cy, rx, ry) { var gy = cy + ry * 1.25;
    dark += japan_limb(cx - rx * 0.06, gy, cx + rx * 0.02, cy + ry * 0.62, 5 * S, 3.4 * S, 1.5 * S); // (this slot paints over the crown, so the trunk stops at its underside)
    forest += japan_e(cx, gy, rx * 0.55, 2.6 * S);
    b.pts.forEach(function (q, n) { if (q[1] < cy + ry * 0.15 && q[0] < cx + rx * 0.5 && hash(q[0] * 0.37 + n) < 0.8) { var hc = []; for (var m = 0; m < 14; m++) { var an = m / 14 * Math.PI * 2; hc.push([q[0] - q[2] * 0.28 + Math.cos(an) * q[2] * 0.55, q[1] - q[2] * 0.3 + Math.sin(an) * q[2] * 0.55]); } shine += japan_hatch(hc); } }); };
  [[-0.02, 0.47, 0.06], [0.07, 0.5, 0.05], [0.3, 0.56, 0.05], [0.4, 0.6, 0.045], [0.24, 0.52, 0.035]].forEach(function (q, n) { var b = japan_bloom(W * q[0] * (ph ? 1.4 : 1), H * q[1] + (ph ? H * 0.03 : 0), W * q[2] * (ph ? 1.5 : 1), H * q[2] * 0.7, 20, n * 17 + 3, S); pink += b.d; japan_tree3d(b, W * q[0] * (ph ? 1.4 : 1), H * q[1] + (ph ? H * 0.03 : 0), W * q[2] * (ph ? 1.5 : 1), H * q[2] * 0.7); hillT.push([W * q[0] * (ph ? 1.4 : 1), H * q[1] + (ph ? H * 0.03 : 0), W * q[2] * (ph ? 1.5 : 1) * 1.1]); });
  var midOcc = forest + pink;
  // the five-storey pagoda: red posts and walls with white panels, deep dark eaves, and the bronze spire on top
  var y0 = pyb, pagoda = {x: px, s: ps, roofs: []};
  if (ANIM) y0 -= (6 + 27 + 4 * 21 + 5 * 23.6) * ps;
  else { dark += rect(px - 42 * ps, y0 - 6 * ps, 84 * ps, 6 * ps);
  y0 -= 6 * ps;
  for (i = 0; i < 5; i++) {
    var w = (62 - i * 7.4) * ps, bh = (i ? 21 : 27) * ps, rw = w + (i ? 46 : 52) * ps;
    red += rect(px - w / 2, y0 - bh, w, bh);
    wall += rect(px - w / 2 + 3.4 * ps, y0 - bh + 4 * ps, w * 0.27, bh - 8.4 * ps) + rect(px + w / 2 - 3.4 * ps - w * 0.27, y0 - bh + 4 * ps, w * 0.27, bh - 8.4 * ps);
    dark += rect(px - w * 0.12, y0 - bh + 3 * ps, w * 0.24, bh - 3 * ps);
    for (k = -1; k <= 1; k += 2) dark += rect(px + k * w * 0.3 - 0.7 * ps, y0 - bh + 4 * ps, 1.4 * ps, bh - 8.4 * ps);
    if (i) { dark += rect(px - w / 2 - 4 * ps, y0 - 3 * ps, w + 8 * ps, 1.6 * ps); for (k = 0; k <= 8; k++) dark += rect(px - w / 2 - 4 * ps + k * (w + 8 * ps) / 8 - 0.6 * ps, y0 - 3 * ps, 1.2 * ps, 3 * ps); }
    y0 -= bh;
    dark += rect(px - w / 2 - 5 * ps, y0 - 4.6 * ps, w + 10 * ps, 4.6 * ps);
    y0 -= 4.6 * ps;
    roofs += japan_pgRoof(px, y0, w + 10 * ps, rw, ps); pagoda.roofs.push([px - rw / 2 - 3 * ps, y0 - 11 * ps, px + rw / 2 + 3 * ps, y0 - 11 * ps]);
    y0 -= 19 * ps;
  }
  // the spire: a stepped base, nine rings and a flame-shaped jewel
  roofs += rect(px - 7 * ps, y0 - 2 * ps, 14 * ps, 6 * ps);
  gold += seg(px, y0 - 1, px, y0 - 54 * ps); for (k = 0; k < 9; k++) gold += seg(px - (6.4 - k * 0.32) * ps, y0 - (8 + k * 4.4) * ps, px + (6.4 - k * 0.32) * ps, y0 - (8 + k * 4.4) * ps);
  gold += seg(px - 5 * ps, y0 - 50 * ps, px + 5 * ps, y0 - 50 * ps) + 'M' + PT(px, y0 - 63 * ps) + ' Q' + PT(px + 4 * ps, y0 - 58 * ps) + ' ' + PT(px, y0 - 55 * ps) + ' Q' + PT(px - 4 * ps, y0 - 58 * ps) + ' ' + PT(px, y0 - 63 * ps) + ' '; }
  var ptop = y0 - 64 * ps;
  // the river: comes out from behind the town on the right and widens toward the near bank
  var U = japan_spline(ph ? [[W + 40, H * 0.715], [W * 0.78, H * 0.745], [W * 0.55, H * 0.8], [W * 0.34, H * 0.88], [W * 0.2, H + 40]] : [[W + 40, H * 0.7], [W * 0.84, H * 0.722], [W * 0.68, H * 0.757], [W * 0.52, H * 0.805], [W * 0.4, H * 0.875], [W * 0.32, H + 40]], 8);
  var D = japan_spline(ph ? [[W + 40, H * 0.775], [W * 0.88, H * 0.83], [W * 0.78, H * 0.9], [W * 0.74, H + 40]] : [[W + 40, H * 0.752], [W * 0.86, H * 0.777], [W * 0.74, H * 0.825], [W * 0.68, H * 0.9], [W * 0.66, H + 40]], 8);
  var riverPts = U.concat(D.slice().reverse()); water += japan_pg(riverPts);
  spread(W * 0.2, H * 0.7, W * 0.8, H * 0.3, ph ? 40 : 60, 14, rnd, 1).forEach(function (c) { var l = (ph ? 10 : 16) + c.r * (ph ? 16 : 30), uy = japan_yAt(U.slice().reverse(), c.x); var dx2 = japan_xAt(D, c.y); if (c.q < 0.6 && c.y > uy + 5 && c.x + l < dx2 - 4 && c.x > japan_xAt(U, c.y) + 4) shine += seg(c.x, c.y, c.x + l, c.y); });
  // the town: rows of houses under dark tiled roofs, smaller further away, some two storeys, a white storehouse or two
  var wins = [], tcirc = hillT.slice(), rows = ph ? [0.6, 0.632, 0.666, 0.7] : [0.592, 0.622, 0.654, 0.688, 0.722], tx0 = ph ? W * 0.48 : W * 0.41;
  var Urev = U.slice().reverse();
  if (!ANIM) rows.forEach(function (ry, r) { var sc = S * (0.5 + r * (ph ? 0.15 : 0.13)), yb = H * ry, xx = tx0 + (r % 2) * 18 * sc - r * W * 0.02, n = 0;
    while (xx < W + 40) { var hw = (34 + hash(r * 40 + n) * 26) * sc, hh = (18 + hash(r * 40 + n + 0.5) * 8) * sc, two = hash(r * 40 + n + 0.7) < 0.32, kura = hash(r * 40 + n + 0.9) < 0.12, gap = (6 + hash(r * 9 + n) * 16) * sc;
      if (yb < japan_yAt(Urev, xx + hw / 2) - 4 && yb < japan_yAt(Urev, xx - 4) - 2 && !(xx < hx1 && yb < japan_yAt(HL, xx + hw / 2) + 8)) {
        var hgt = two ? hh * 1.7 : hh, cx = xx + hw / 2;
        if (hash(r * 40 + n + 0.3) < 0.18) { forest += japan_c(cx, yb - hh * 0.9, hh * 0.85) + japan_c(cx - hh * 0.6, yb - hh * 0.5, hh * 0.6) + japan_c(cx + hh * 0.6, yb - hh * 0.5, hh * 0.6); tcirc.push([cx, yb - hh * 0.8, hh * 1.4]); }
        else if (hash(r * 40 + n + 0.4) < 0.14) { var bl = japan_bloom(cx, yb - hh * 0.9, hh * 1.1, hh * 0.75, 6, r * 50 + n, S * 0.6); pink += bl.d; dark += rect(cx - 1.5 * sc, yb - hh * 0.5, 3 * sc, hh * 0.5); tcirc.push([cx, yb - hh * 0.9, hh * 1.5]); }
        else {
          wall += rect(xx, yb - hgt, hw, hgt);
          if (kura) dark += rect(xx, yb - hgt * 0.28, hw, hgt * 0.28);
          roofs += japan_roof(cx, yb - hgt, hw + 10 * sc, (kura ? 9 : 12) * sc, 0.25);
          if (two) roofs += japan_pg([[xx - 5 * sc, yb - hh * 0.98], [xx + hw + 5 * sc, yb - hh * 0.98], [xx + hw - 1 * sc, yb - hh * 1.2], [xx + 1 * sc, yb - hh * 1.2]]);
          var nw = Math.max(1, Math.floor(hw / (13 * sc))); for (k = 0; k < nw; k++) { var wx = xx + (k + 0.5) * hw / nw - 3.2 * sc, wy = yb - (two ? hgt * 0.9 : hgt * 0.78); if (!kura || k === 0) { var wh = (two ? hh * 0.42 : hh * 0.42); wins.push([wx, wy, 6.4 * sc, wh, hash(r * 31 + n * 7 + k)]); }
            if (two && !kura) { wins.push([wx, yb - hh * 0.62, 6.4 * sc, hh * 0.4, hash(r * 17 + n * 3 + k + 0.2)]); } }
        }
      }
      xx += hw + gap; n++; }
  });
  wins = wins.filter(function (w) { return !tcirc.some(function (c) { return Math.hypot(w[0] + w[2] / 2 - c[0], w[1] + w[3] / 2 - c[1]) < c[2]; }); });
  wins.forEach(function (w) { dark += rect(w[0], w[1], w[2], w[3]); });
  // the near bank of the river below the hill: a lane of willows and round trees, a teahouse and a pine by the bridge foot
  var bankY = function (xx) { return japan_yAt(Urev, xx); };
  if (!ANIM) for (x = W * (ph ? 0.3 : 0.34); x < W * (ph ? 0.5 : 0.56); x += (ph ? 20 : 30) * S) { var by2 = bankY(x) - 4 * S, tr = (9 + hash(x) * 7) * S; if (by2 < H * 0.95) { forest += japan_c(x, by2 - tr * 0.9, tr) + japan_c(x - tr * 0.7, by2 - tr * 0.5, tr * 0.7) + japan_c(x + tr * 0.7, by2 - tr * 0.5, tr * 0.7); if (hash(x + 1) < 0.35) { var bl2 = japan_bloom(x + tr * 0.4, by2 - tr * 1.3, tr * 0.9, tr * 0.7, 6, x, S * 0.6); pink += bl2.d; } } }
  var Dr = D.slice(), Ds = D.slice().sort(function (a, b) { return a[0] - b[0]; });
  // the bank across the river, right of the bridge: round shrubs along the water (its cherry tree, azaleas and flag are near)
  var rbank = function (y2, dx) { return japan_xAt(Dr, y2) + dx * S; };
  [[0.8, 26, 11], [0.845, 34, 13], [0.9, 30, 10]].forEach(function (q, n) { var sx = rbank(H * q[0], q[1]), sy = H * q[0], r = q[2] * S; if (sx < W + 20) { forest += japan_c(sx, sy - r * 0.7, r) + japan_c(sx - r * 0.85, sy - r * 0.35, r * 0.72) + japan_c(sx + r * 0.9, sy - r * 0.4, r * 0.78); tcirc.push([sx, sy, r * 2]); } });
  var thx = W * (ph ? 0.43 : ANIM ? 0.425 : 0.47), thy = bankY(thx) - 14 * S;
  if (thy > H * 0.7 && !ANIM) { wall += rect(thx - 22 * S, thy - 16 * S, 44 * S, 16 * S); roofs += japan_roof(thx, thy - 16 * S, 58 * S, 14 * S, 0.3); dark += rect(thx - 16 * S, thy - 12 * S, 8 * S, 8 * S) + rect(thx + 6 * S, thy - 12 * S, 10 * S, 12 * S); wins.push([thx - 16 * S, thy - 12 * S, 8 * S, 8 * S, 0.1]); }
  // the koinobori pole stands in the town near the foot of the hill
  var kpx = W * (ph ? 0.58 : 0.455), kpy = H * (ph ? 0.66 : 0.664), kph = (ph ? 84 : 120) * S;
  // the red arched bridge: a drum bridge spanning the river, posts and rails, its feet on stone piers
  var bdy = H * (ph ? 0.79 : 0.786), bx0 = japan_xAt(U, bdy) - (ph ? 18 : 30) * S, bx1 = japan_xAt(D, bdy) + (ph ? 18 : 30) * S, bm = (bx0 + bx1) / 2, bL = bx1 - bx0, ah = bL * 0.16, bth = 6 * S;
  var arc = function (u) { return bdy - ah * (1 - Math.pow(2 * u - 1, 2)); }, deck = [], under = [], rail = [];
  if (!ANIM) {
  for (i = 0; i <= 30; i++) { uu = i / 30; dark += rect(bx0 + 6 * S + (bL - 12 * S) * uu - bL / 60 - 0.5, arc(uu) - 20 * S, bL / 30 + 1, 1.8 * S); }
  for (i = 0; i <= 30; i++) { var uu = i / 30; deck.push([bx0 + bL * uu, arc(uu)]); under.unshift([bx0 + bL * uu, arc(uu) + bth]); }
  red += japan_pg(deck.concat(under));
  for (i = 0; i <= 30; i++) { uu = i / 30; rail.push([bx0 + 4 * S + (bL - 8 * S) * uu, arc(uu) - 16 * S]); }
  var railB = rail.map(function (p) { return [p[0], p[1] + 2.6 * S]; }).reverse(); red += japan_pg(rail.concat(railB));
  for (i = 0; i <= 12; i++) { uu = 0.02 + i / 12 * 0.96; var rx = bx0 + bL * uu; red += rect(rx - 1.6 * S, arc(uu) - 16 * S, 3.2 * S, 16 * S); }
  [0.02, 0.98].forEach(function (q) { var rx = bx0 + bL * q; gold += seg(rx, arc(q) - 19 * S, rx, arc(q) - 20 * S); });
  for (i = 1; i < 6; i++) { uu = i / 6; var lx = bx0 + bL * uu, ly = arc(uu) + bth; if (Math.abs(uu - 0.5) > 0.2) dark += rect(lx - 3.2 * S, ly, 6.4 * S, Math.max(4, bdy + 6 * S - ly)); }
  for (i = 1; i < 30; i++) { uu = i / 30; if (arc(uu) + bth + 5 * S < bdy + 4 * S) dark += rect(bx0 + bL * uu - bL / 60 - 0.5, arc(uu) + bth, bL / 30 + 1, 3 * S); }
  dark += rect(bx0 - 6 * S, bdy - 2 * S, 12 * S, 10 * S) + rect(bx1 - 6 * S, bdy - 2 * S, 12 * S, 10 * S); }
  if (!ANIM) { dark += rect(kpx - 1.4 * S, kpy - kph, 2.8 * S, kph); [[0, '#3A3A48'], [1, '#D8402E'], [2, '#3A78C8']].forEach(function (q) { var cy = kpy - kph + (10 + q[0] * 15) * S; red += japan_pg([[kpx, cy - 4 * S], [kpx + 30 * S, cy - 3 * S], [kpx + 38 * S, cy - 6 * S], [kpx + 34 * S, cy], [kpx + 38 * S, cy + 6 * S], [kpx + 30 * S, cy + 3 * S], [kpx, cy + 4 * S]]); }); }
  add(mid, 'a', ground, C.ground); add(mid, 'b', forest, C.forest); add(mid, 'c', wall, C.wall); add(mid, 'd', roofs, C.roof); add(mid, 'e', water, C.water); add(mid, 'f', pink, C.pink); add(mid, 'g', red, C.red); add(mid, 'h', dark, C.dark);
  stk(mid, 's', shine, C.shine, ph ? 1 : 1.3); stk(mid, 't', gold, C.gold, Math.max(1.2, 1.6 * ps));

  // ---- near: the slope in front with its cherry trees, the stair path, torii and lanterns, and the far bank on the right
  var NH = japan_spline(ph ? [[-40, H * 0.63], [W * 0.14, H * 0.655], [W * 0.27, H * 0.73], [W * 0.36, H * 0.83], [W * 0.42, H * 0.93], [W * 0.44, H + 40]] : [[-40, H * 0.61], [W * 0.08, H * 0.625], [W * 0.17, H * 0.665], [W * 0.25, H * 0.74], [W * 0.31, H * 0.83], [W * 0.355, H * 0.92], [W * 0.37, H + 40]], 8);
  // the slope's outer edge is a run of little grassy hummocks (not one clean curve), fading in below the cherry trees
  var NHe = [], al = 0; for (i = 0; i < NH.length - 1; i++) { var na = NH[i], nb = NH[i + 1], nl = Math.hypot(nb[0] - na[0], nb[1] - na[1]) || 1, nm = Math.max(1, Math.ceil(nl / (3 * S)));
    for (k = 0; k < nm; k++) { var ex = na[0] + (nb[0] - na[0]) * k / nm, ey = na[1] + (nb[1] - na[1]) * k / nm, fade = Math.max(0, Math.min(1, (ey - H * 0.64) / (H * 0.04))), bmp = fade * (3 + 6 * Math.abs(Math.sin(al / (9 * S) + hash(Math.floor(al / (28 * S))) * 3))) * S;
      NHe.push([ex + (nb[1] - na[1]) / nl * bmp, ey - (nb[0] - na[0]) / nl * bmp]); al += nl / nm; } }
  NHe.push(NH[NH.length - 1]);
  var grass = japan_pg(NHe.concat([[-40, H + 40]])), shrub = '', trunk = '', bloom = '', bhi = '', stone = '', torii = '', ink = '', step = '', blade = '', trees = [], petalsOn = [];
  // the far bank of the river, bottom right, where the companion sits
  var RB = japan_spline(ph ? [[W * 0.7, H + 40], [W * 0.74, H * 0.95], [W * 0.86, H * 0.925], [W + 40, H * 0.91]] : [[W * 0.66, H + 40], [W * 0.69, H * 0.955], [W * 0.79, H * 0.93], [W * 0.92, H * 0.925], [W + 40, H * 0.915]], 6);
  grass += japan_pg(RB.concat([[W + 40, H + 40]]));
  // rocks along the waterline, and reeds
  [[0.7, 0.955, 1.1], [0.74, 0.945, 0.7], [0.83, 0.93, 0.9], [0.95, 0.925, 0.6]].forEach(function (q) { var rx = W * q[0] + (ph ? W * 0.04 : 0), ryy = japan_yAt(RB, rx) + 4, s2 = 12 * S * q[2]; stone += japan_pg([[rx - s2 * 1.5, ryy + s2 * 0.3], [rx - s2, ryy - s2 * 0.6], [rx + s2 * 0.2, ryy - s2 * 0.9], [rx + s2 * 1.3, ryy - s2 * 0.4], [rx + s2 * 1.6, ryy + s2 * 0.3]]); });
  [[0.88, 1], [0.97, 0.8]].forEach(function (q) { var rx = W * q[0], ryy = japan_yAt(RB, rx) + 2; for (k = 0; k < 7; k++) { var a = -1.2 + k * 0.4, L = (22 + hash(k + q[0] * 9) * 18) * S * q[1]; blade += 'M' + PT(rx + k * 2 * S, ryy) + ' Q' + PT(rx + k * 2 * S + Math.cos(a) * L * 0.2, ryy - L * 0.6) + ' ' + PT(rx + k * 2 * S + Math.sin(a) * L * 0.5, ryy - L) + ' '; } });
  // cherry trees on the slope: their crowns hide the pagoda's foot, as in the famous view
  var TR = ph ? [[0.02, 0.6, 0.16, 0.07], [0.27, 0.66, 0.13, 0.06], [0.13, 0.63, 0.1, 0.05], [-0.04, 0.72, 0.12, 0.06]] : [[0.015, 0.575, 0.075, 0.075], [0.105, 0.605, 0.065, 0.06], [0.235, 0.63, 0.06, 0.06], [0.165, 0.645, 0.05, 0.045], [-0.03, 0.66, 0.06, 0.06]];
  TR.forEach(function (q, n) { var cx = W * q[0], cy = H * q[1], rx = W * q[2], ry = H * q[3], gy = japan_yAt(NH, cx) + H * 0.04;
    trunk += japan_limb(cx - rx * 0.05, gy, cx + rx * 0.1, cy + ry * 0.2, 12 * S, 6 * S, 6 * S) + japan_limb(cx + rx * 0.05, cy + ry * 0.45, cx + rx * 0.55, cy + ry * 0.05, 5 * S, 2 * S, -4 * S) + japan_limb(cx, cy + ry * 0.5, cx - rx * 0.5, cy + ry * 0.1, 5 * S, 2 * S, 4 * S);
    var b = japan_bloom(cx, cy, rx, ry, ph ? 26 : 40, n * 23 + 101, S); bloom += b.d; bhi += b.hi; trees.push([cx, cy, rx, ry]); b.dots.forEach(function (d) { if (hash(d[0] + d[1]) < 0.25) bhi += japan_c(d[0], d[1], 1.6 * S); }); });
  // azalea mounds and a little pine along the slope
  [[0.05, 0.69, 26], [0.2, 0.75, 20], [0.3, 0.87, 18], [0.09, 0.82, 30]].forEach(function (q) { var sx = W * q[0] * (ph ? 1.2 : 1), sy = Math.max(H * q[1], japan_yAt(NH, sx) + 16 * S), r = q[2] * S; shrub += japan_c(sx, sy, r) + japan_c(sx - r * 0.9, sy + r * 0.3, r * 0.75) + japan_c(sx + r * 0.9, sy + r * 0.3, r * 0.75) + rect(sx - r * 1.6, sy + r * 0.3, r * 3.2, r * 0.7); });
  // the stair path down the slope to the water, its steps getting deeper toward us
  var st0 = [W * (ph ? 0.25 : 0.2), H * (ph ? 0.715 : 0.69)], st1 = [W * (ph ? 0.33 : 0.275), H + 20], sw0 = (ph ? 10 : 14) * S, sw1 = (ph ? 34 : 50) * S;
  var stL = [], stR = []; for (i = 0; i <= 20; i++) { var su = i / 20, scx = st0[0] + (st1[0] - st0[0]) * su + Math.sin(su * Math.PI) * W * 0.02, scy = st0[1] + (st1[1] - st0[1]) * su, sww = sw0 + (sw1 - sw0) * su; stL.push([scx - sww, scy]); stR.unshift([scx + sww, scy]); }
  stone += japan_pg(stL.concat(stR));
  var sAt = function (su) { var scx = st0[0] + (st1[0] - st0[0]) * su + Math.sin(su * Math.PI) * W * 0.02; return [scx, st0[1] + (st1[1] - st0[1]) * su, sw0 + (sw1 - sw0) * su]; };
  // the torii across the stairs
  var tp = sAt(0.55), tw = tp[2] * 1.9, th = tw * 1.05, tgx = tp[0], tgy = tp[1];
  // it has depth: round posts that taper and lean in a little, their shaded (east) sides and the undersides of the beams in shadow,
  // the black kasagi, black footings, and a contact shadow where each post meets the steps
  var tshade = '', rp = function (x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }, tPolys = [];
  [-1, 1].forEach(function (sd) { var bx = tgx + sd * tw * 0.5, tx = bx - sd * tw * 0.035, b2 = 3.6 * S, t2 = 2.6 * S;
    tPolys.push([[bx - b2 - 1.2 * S, tgy], [tx - t2, tgy - th], [tx + t2, tgy - th], [bx + b2 + 1.2 * S, tgy]]);
    torii += japan_pg([[bx - b2, tgy], [tx - t2, tgy - th], [tx + t2, tgy - th], [bx + b2, tgy]]);
    tshade += japan_hatch([[bx + b2 * 0.15, tgy], [tx + t2 * 0.15, tgy - th], [tx + t2, tgy - th], [bx + b2, tgy]]);
    tshade += japan_hatch([[bx + b2 * 0.2, tgy + 0.5 * S], [bx + b2 + tw * 0.28, tgy - 1.5 * S], [bx + b2 + tw * 0.3, tgy + 1.2 * S], [bx + b2 * 0.6, tgy + 2.6 * S]]);
    ink += japan_pg([[bx - b2 - 1.2 * S, tgy], [bx - b2 - 0.6 * S, tgy - 7 * S], [bx + b2 + 0.6 * S, tgy - 7 * S], [bx + b2 + 1.2 * S, tgy]]); });
  torii += rect(tgx - tw * 0.68, tgy - th * 0.78, tw * 1.36, 5 * S) + rect(tgx - tw * 0.6, tgy - th * 0.97, tw * 1.2, 5 * S) + rect(tgx - 2 * S, tgy - th * 0.97, 4 * S, th * 0.2);
  tshade += japan_hatch([[tgx - tw * 0.68, tgy - th * 0.78 + 3 * S], [tgx + tw * 0.68, tgy - th * 0.78 + 3 * S], [tgx + tw * 0.68, tgy - th * 0.78 + 5 * S], [tgx - tw * 0.68, tgy - th * 0.78 + 5 * S]]);
  tshade += japan_hatch([[tgx + tw * 0.66, tgy - th * 0.78], [tgx + tw * 0.68, tgy - th * 0.78], [tgx + tw * 0.68, tgy - th * 0.78 + 3 * S], [tgx + tw * 0.66, tgy - th * 0.78 + 3 * S]]);
  tshade += japan_hatch([[tgx - tw * 0.6, tgy - th * 0.97 + 2.6 * S], [tgx + tw * 0.6, tgy - th * 0.97 + 2.6 * S], [tgx + tw * 0.6, tgy - th * 0.97 + 5 * S], [tgx - tw * 0.6, tgy - th * 0.97 + 5 * S]]);
  tshade += japan_hatch([[tgx + 0.4 * S, tgy - th * 0.97 + 5 * S], [tgx + 2 * S, tgy - th * 0.97 + 5 * S], [tgx + 2 * S, tgy - th * 0.78], [tgx + 0.4 * S, tgy - th * 0.78]]);
  ink += japan_pg([[tgx - tw * 0.86, tgy - th * 1.12], [tgx, tgy - th * 1.03], [tgx + tw * 0.86, tgy - th * 1.12], [tgx + tw * 0.74, tgy - th * 0.99], [tgx - tw * 0.74, tgy - th * 0.99]]);
  tPolys.push(rp(tgx - tw * 0.68, tgy - th * 0.78, tw * 1.36, 5 * S), rp(tgx - tw * 0.6, tgy - th * 0.97, tw * 1.2, 5 * S), rp(tgx - 2 * S, tgy - th * 0.97, 4 * S, th * 0.2),
    [[tgx - tw * 0.86, tgy - th * 1.12], [tgx, tgy - th * 1.03], [tgx + tw * 0.86, tgy - th * 1.12], [tgx + tw * 0.74, tgy - th * 0.99], [tgx - tw * 0.74, tgy - th * 0.99]]);
  // the stretches of a vertical line at x, between y0 and y1, that the torii does not cover
  var toriiGaps = function (x, y0, y1) { var cov = [];
    tPolys.forEach(function (pp) { var lo = Infinity, hi = -Infinity; for (var m = 0; m < pp.length; m++) { var a = pp[m], b = pp[(m + 1) % pp.length]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) { var yy = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = Math.min(lo, yy); hi = Math.max(hi, yy); } } if (hi > lo) cov.push([lo, hi]); });
    cov.sort(function (a, b) { return a[0] - b[0]; }); var out = [], cur = y0; cov.forEach(function (c) { if (c[0] > cur) out.push([cur, Math.min(c[0], y1)]); cur = Math.max(cur, c[1]); }); if (cur < y1) out.push([cur, y1]); return out.filter(function (g) { return g[1] > g[0] + 0.3; }); };
  // stone lanterns at the foot of the stairs and halfway up
  var lanterns = [];
  [[0.88, -1, 1], [0.88, 1, 1], [0.3, -1, 0.7], [0.3, 1, 0.7]].forEach(function (q) { var p = sAt(q[0]), lx = p[0] + q[1] * (p[2] + 16 * S * q[2]), ly = p[1] + 4 * S, s2 = S * q[2] * (ph ? 0.8 : 1);
    stone += rect(lx - 9 * s2, ly - 5 * s2, 18 * s2, 5 * s2) + rect(lx - 3 * s2, ly - 24 * s2, 6 * s2, 19 * s2) + rect(lx - 8 * s2, ly - 28 * s2, 16 * s2, 4 * s2) + rect(lx - 6 * s2, ly - 40 * s2, 12 * s2, 12 * s2) + japan_pg([[lx - 13 * s2, ly - 40 * s2], [lx - 3 * s2, ly - 47 * s2], [lx + 3 * s2, ly - 47 * s2], [lx + 13 * s2, ly - 40 * s2]]) + japan_c(lx, ly - 49 * s2, 2.6 * s2);
    ink += rect(lx - 3 * s2, ly - 37 * s2, 6 * s2, 6 * s2); lanterns.push([lx, ly - 34 * s2, s2, q[0] < 0.55]); });
  // posts for paper lanterns along the path (the lanterns hang from their arms)
  var paper = [];
  // (the posts further up the path than the torii stand behind it, so the gate hides the parts of them it covers)
  [0.14, 0.42, 0.72].forEach(function (q, n) { [-1, 1].forEach(function (sd) { var p = sAt(q), lx = p[0] + sd * (p[2] + 6 * S), ly = p[1] + 2 * S, hgt = (ph ? 34 : 46) * S * (0.7 + q * 0.5), back = q < 0.55, ax = sd < 0 ? lx - 1 * S : lx - 9 * S;
    if (!back) ink += rect(lx - 1.2 * S, ly - hgt, 2.4 * S, hgt) + rect(ax, ly - hgt, 10 * S, 2 * S);
    else { for (k = 0; k < 6; k++) { var px0 = lx - 1.2 * S + k * 0.4 * S; toriiGaps(px0 + 0.2 * S, ly - hgt, ly).forEach(function (g) { ink += rect(px0, g[0], 0.4 * S + 0.3, g[1] - g[0]); }); }
      for (k = 0; k < 20; k++) { var ax0 = ax + k * 0.5 * S; toriiGaps(ax0 + 0.25 * S, ly - hgt, ly - hgt + 2 * S).forEach(function (g) { ink += rect(ax0, g[0], 0.5 * S + 0.3, g[1] - g[0]); }); } }
    paper.push([lx - sd * 7 * S, ly - hgt + 2 * S, S * (0.7 + q * 0.5), n * 2 + (sd > 0 ? 1 : 0), back]); }); });
  // the steps' edges and the path's sides (strokes, drawn over every fill of this layer): kept off the torii, the lantern posts and
  // the cherry crowns that stand in front of the path
  var hides = function (x, y) { if (trees.some(function (t) { var dx = (x - t[0]) / (t[2] * 1.15), dy = (y - t[1]) / (t[3] * 1.3); return dx * dx + dy * dy < 1; })) return true;
    if (y > tgy - th * 1.15 && y < tgy + 1 && (Math.abs(x - (tgx - tw * 0.5)) < 4 * S || Math.abs(x - (tgx + tw * 0.5)) < 4 * S)) return true;
    if (y > tgy - th * 1.13 && y < tgy - th * 0.97 + 5 * S + 1) return true; if (y > tgy - th * 0.78 - 1 && y < tgy - th * 0.78 + 5 * S + 1 && Math.abs(x - tgx) < tw * 0.7) return true;
    return false; };
  var runs = function (pts) { var out = '', cur = []; pts.forEach(function (q) { if (hides(q[0], q[1])) { if (cur.length > 1) out += pline(cur); cur = []; } else cur.push(q); }); if (cur.length > 1) out += pline(cur); return out; };
  for (su = 0.02; su < 1; su += 0.012 + su * 0.05) { var sp = sAt(su), sq = []; for (k = 0; k <= 24; k++) sq.push([sp[0] - sp[2] + 1 + (2 * sp[2] - 2) * k / 24, sp[1]]); step += runs(sq); }
  var dense = function (pts) { var out = []; for (var q = 0; q < pts.length - 1; q++) for (var m = 0; m < 6; m++) out.push([pts[q][0] + (pts[q + 1][0] - pts[q][0]) * m / 6, pts[q][1] + (pts[q + 1][1] - pts[q][1]) * m / 6]); out.push(pts[pts.length - 1]); return out; };
  step += runs(dense(stL)) + runs(dense(stR.slice().reverse()));
  // fallen petals on the grass, and grass blades (not on the path, the lanterns or the posts)
  spread(0, H * 0.62, W * 0.4, H * 0.38, 14, 12, rnd, 1).forEach(function (c) { if (c.q < 0.4 && c.y > japan_yAt(NH, c.x) + 6) bhi += japan_e(c.x, c.y, 1.8 * S, 1.1 * S); });
  var onPath = function (x, y) { var u = (y - st0[1]) / (st1[1] - st0[1]); if (u < -0.05) return false; var q = sAt(Math.max(0, Math.min(1, u))); return Math.abs(x - q[0]) < q[2] + 6 * S; };
  var nearThing = function (x, y) { return lanterns.some(function (l) { return Math.abs(x - l[0]) < 16 * l[2] && y > l[1] - 20 * l[2] && y < l[1] + 40 * l[2]; }) || paper.some(function (q) { return Math.abs(x - q[0]) < 12 * S && y > q[1] - 4 && y < q[1] + 70 * S; }) || hides(x, y - 5); };
  spread(0, H * 0.7, W * 0.42, H * 0.3, 20, 18, rnd, 1).forEach(function (c) { if (c.q < 0.35 && c.y > japan_yAt(NH, c.x) + 10 && !onPath(c.x, c.y) && !nearThing(c.x, c.y)) blade += 'M' + PT(c.x - 2, c.y) + ' Q' + PT(c.x - 1, c.y - 5) + ' ' + PT(c.x - 3, c.y - 9) + ' M' + PT(c.x + 1, c.y) + ' Q' + PT(c.x + 2, c.y - 6) + ' ' + PT(c.x + 4, c.y - 8) + ' '; });
  // the slope's edge is planted so it melts into the ground beyond: low shrub clumps (some flowering) sitting on the line,
  // tufts of grass across it, and fallen petals thinning out onto the flat ground
  for (y = H * 0.665, j = 0; y < H * 0.99; y += (26 + hash(j * 1.7) * 24) * S, j++) { var ex2 = japan_xAt(NH, y) + 3 * S, er = (7 + hash(j * 2.3) * 7) * S;
    if (hash(j * 3.1 + 0.5) < 0.85 && !nearThing(ex2, y)) { shrub += japan_c(ex2, y - er * 0.5, er) + japan_c(ex2 - er * 0.9, y - er * 0.1, er * 0.72) + japan_c(ex2 + er * 0.95, y - er * 0.05, er * 0.68) + rect(ex2 - er * 1.6, y - er * 0.1, er * 3.2, er * 0.4);
      if (hash(j * 5.9) < 0.45) for (k = 0; k < 6; k++) bhi += japan_c(ex2 + (hash(j * 7 + k) - 0.5) * er * 2.4, y - er * 0.2 - hash(j * 9 + k) * er * 1.1, 1.5 * S); } }
  for (y = H * 0.66; y < H; y += 9 * S) { var ex3 = japan_xAt(NH, y) + (hash(y) - 0.3) * 8 * S; if (hash(y * 1.3) < 0.55 && !nearThing(ex3, y)) { var bl2 = (6 + hash(y * 2.1) * 6) * S; blade += 'M' + PT(ex3 - 2 * S, y) + ' Q' + PT(ex3 - 2 * S, y - bl2 * 0.6) + ' ' + PT(ex3 - 4 * S, y - bl2) + ' M' + PT(ex3, y) + ' Q' + PT(ex3 + 1 * S, y - bl2 * 0.7) + ' ' + PT(ex3 + 3 * S, y - bl2 * 1.1) + ' '; } }
  spread(W * 0.15, H * 0.64, W * 0.35, H * 0.36, 11, 10, rnd, 1).forEach(function (c) { var dd = c.x - japan_xAt(NH, c.y); if (dd > 0 && c.q < 0.5 * Math.exp(-dd / (30 * S)) && c.y < japan_yAt(Urev, c.x) - 4) bhi += japan_e(c.x, c.y, 1.8 * S, 1.1 * S); });
  // the far bank, right of the river: a cherry tree in bloom, azalea mounds, the Hinomaru on a pole by the bridge foot, and
  // tufts of grass and fallen petals (kept off the tree and the flag)
  var rbT = [W * (ph ? 0.95 : 0.968), H * (ph ? 0.785 : 0.79), W * (ph ? 0.09 : 0.052), H * 0.055], rgy = H * 0.885;
  trunk += japan_limb(rbT[0] - rbT[2] * 0.15, rgy, rbT[0] + rbT[2] * 0.05, rbT[1] + rbT[3] * 0.3, 9 * S, 5 * S, 5 * S) + japan_limb(rbT[0], rbT[1] + rbT[3] * 0.7, rbT[0] - rbT[2] * 0.55, rbT[1] + rbT[3] * 0.1, 4 * S, 2 * S, 4 * S) + japan_limb(rbT[0] + rbT[2] * 0.03, rbT[1] + rbT[3] * 0.55, rbT[0] + rbT[2] * 0.5, rbT[1] + rbT[3] * 0.05, 4 * S, 2 * S, -3 * S);
  shrub += japan_e(rbT[0] - rbT[2] * 0.1, rgy + 1 * S, rbT[2] * 0.7, 3 * S);
  var rbB = japan_bloom(rbT[0], rbT[1], rbT[2], rbT[3], ph ? 22 : 30, 913, S); bloom += rbB.d; bhi += rbB.hi; rbB.dots.forEach(function (d) { if (hash(d[0] + d[1]) < 0.25) bhi += japan_c(d[0], d[1], 1.6 * S); }); trees.push(rbT);
  [[ph ? 0.8 : 0.83, 0.885, 9], [ph ? 0.99 : 0.995, 0.9, 12]].forEach(function (q, n) { var sx = W * q[0], sy = H * q[1], r = q[2] * S; if (sx > japan_xAt(D, sy) + 16 * S) { shrub += japan_c(sx, sy - r * 0.6, r) + japan_c(sx - r * 0.85, sy - r * 0.2, r * 0.72) + japan_c(sx + r * 0.9, sy - r * 0.25, r * 0.74);
    bloom += japan_c(sx - r * 0.2, sy - r * 0.85, r * 0.6) + japan_c(sx + r * 0.5, sy - r * 0.5, r * 0.5) + japan_c(sx - r * 0.85, sy - r * 0.35, r * 0.45); for (k = 0; k < 5; k++) bhi += japan_c(sx + (hash(n * 7 + k) - 0.5) * r * 2, sy - r * 0.3 - hash(n * 9 + k) * r * 0.9, 1.4 * S); } });
  var fpx = Math.max(W * (ph ? 0.8 : 0.868), japan_xAt(D, H * 0.83) + 44 * S), fpy = H * 0.84, fph = (ph ? 64 : 88) * S, fw = (ph ? 30 : 42) * S, fhh = fw * 0.66, flag = [], flagBox = null;
  if (fpx < W - fw - 4 * S && fpx + fw < rbT[0] - rbT[2] * 0.9) { ink += rect(fpx - 1.3 * S, fpy - fph, 2.6 * S, fph) + rect(fpx - 4 * S, fpy - 2 * S, 8 * S, 3 * S) + japan_c(fpx, fpy - fph - 1.5 * S, 2.4 * S);
    for (k = 0; k <= 12; k++) flag.push([fpx + 1.3 * S + fw * k / 12, fpy - fph + 2 * S + Math.sin(k / 12 * Math.PI * 1.6) * 2.4 * S * k / 12]);
    var fbot = flag.map(function (q) { return [q[0], q[1] + fhh]; }).reverse(), cloth = japan_pg(flag.concat(fbot));
    if (ANIM) ANIM.flag = [fpx + 1.3 * S, fpy - fph + 2 * S, fw, fhh]; // the engine draws the cloth (waving, and white at night too)
    else { if (dk) stone += cloth; else bhi += cloth; torii += japan_c(fpx + 1.3 * S + fw * 0.5, fpy - fph + 2 * S + fhh / 2 + Math.sin(0.8 * Math.PI) * 2.4 * S * 0.5, fhh * 0.3); } flagBox = [fpx - 6 * S, fpy - fph - 6 * S, fpx + fw + 4 * S, fpy + 4 * S]; }
  spread(W * 0.6, H * 0.79, W * 0.4, H * 0.21, 26, 16, rnd, 1).forEach(function (c) { if (c.x < japan_xAt(D, c.y) + 10 * S || hides(c.x, c.y - 6) || (flagBox && c.x > flagBox[0] && c.x < flagBox[2] && c.y > flagBox[1] && c.y < flagBox[3])) return;
    if (c.q < 0.32) blade += 'M' + PT(c.x - 2, c.y) + ' Q' + PT(c.x - 1, c.y - 5) + ' ' + PT(c.x - 3, c.y - 9) + ' M' + PT(c.x + 1, c.y) + ' Q' + PT(c.x + 2, c.y - 6) + ' ' + PT(c.x + 4, c.y - 8) + ' ';
    else if (c.q < 0.6) bhi += japan_e(c.x, c.y, 1.8 * S, 1.1 * S); });
  // the swaying foreground branch (the engine's), drawn still when there is no engine
  var BR = {x: -14, y: H * (ph ? 0.115 : 0.02), len: W * (ph ? 0.42 : 0.24), s: S};
  if (!ANIM) { trunk += japan_limb(BR.x, BR.y, BR.x + BR.len, BR.y + BR.len * 0.18, 16 * S, 3 * S, -BR.len * 0.06) + japan_limb(BR.x + BR.len * 0.4, BR.y + BR.len * 0.1, BR.x + BR.len * 0.62, BR.y + BR.len * 0.3, 6 * S, 2 * S, 6 * S);
    var bb2 = japan_bloom(BR.x + BR.len * 0.55, BR.y + BR.len * 0.16, BR.len * 0.3, BR.len * 0.1, 22, 777, S); bloom += bb2.d; bhi += bb2.hi;
    paper.forEach(function (p) { bhi += japan_e(p[0], p[1] + 9 * p[2], 5 * p[2], 7 * p[2]); }); }
  add(near, 'a', grass, C.grass); add(near, 'b', shrub, C.shrub); add(near, 'c', trunk, C.trunk); add(near, 'd', bloom, C.bloom); add(near, 'e', bhi, C.bhi); add(near, 'f', stone, C.stone); add(near, 'g', torii, C.torii); add(near, 'h', ink, C.ink);
  stk(near, 's', step + tshade, C.step, 1.2); stk(near, 't', blade, C.blade, 1.2);
  if (ANIM) { ANIM.moon = moon; ANIM.C = C; ANIM.S = S; ANIM.horizon = horizon; ANIM.ptop = [px - 82 * ps, ptop, px + 96 * ps, pyb]; ANIM.fuji = {x: fx, top: ftop, bw: bw, hf: hf, snow: snowPts, body: FU, base: fbase, ys: ys}; ANIM.hills = {occ: midOcc, rg: rg, fh1: fh1, fh2: fh2, HL: HL, hx1: hx1, gy: H * (ph ? 0.58 : 0.575)};
    ANIM.pagoda = {x: px, y: pyb, s: ps}; ANIM.town = {hillT: hillT, rows: rows, tx0: tx0, Urev: Urev, HL: HL, hx1: hx1, bank: [W * (ph ? 0.3 : 0.34), W * (ph ? 0.5 : 0.56)], tea: [thx, thy], kp: [kpx, kpy], castle: [W * (ph ? 0.8 : 0.85), H * rows[0] + 2 * S]};
    ANIM.wins = wins; ANIM.koi = [kpx, kpy, kph]; ANIM.river = riverPts; ANIM.U = U; ANIM.D = D; ANIM.bridge = [bx0, bx1, bdy, ah, bth]; ANIM.trees = trees; ANIM.paper = paper; ANIM.toriiPolys = tPolys; ANIM.stone = lanterns; ANIM.branch = BR; ANIM.heron = [W * (ph ? 0.52 : 0.47), H * (ph ? 0.875 : 0.885)]; ANIM.NH = NH; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
