// ---- world theme: thailand (Thailand)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other; thailand_hole() winds the other way to cut a hole.
function thailand_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function thailand_pg(p) { return poly(thailand_area(p) < 0 ? p.slice().reverse() : p); }
function thailand_hole(p) { return poly(thailand_area(p) > 0 ? p.slice().reverse() : p); }
function thailand_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function thailand_c(x, y, r) { return thailand_e(x, y, r, r); }
function thailand_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return thailand_pg(rotp(p, x, y, ang)); }
function thailand_yOn(pts, x) { for (var i = 1; i < pts.length; i++) if (pts[i][0] >= x) { var a = pts[i - 1], b = pts[i], f = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, f)); } return pts[pts.length - 1][1]; }
// a tapered band along a list of points (widths w0 to w1), as one clockwise outline
function thailand_band(pts, w0, w1) { var L = [], R = [], n = pts.length - 1; pts.forEach(function (p, i) { var q = pts[Math.min(n, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / n) / 2; L.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); R.push([p[0] + dy / dl * w, p[1] - dx / dl * w]); }); return thailand_pg(L.concat(R.reverse())); }
// a curved palm trunk from (x0, y0) to (x1, y1), bowed sideways by 'bend', w0 to w1 wide, plus its ring marks
function thailand_trunk(x0, y0, x1, y1, bend, w0, w1) { var pts = [], rings = '', n = 18; for (var i = 0; i <= n; i++) { var u = i / n; pts.push([x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y0 + (y1 - y0) * u]); }
  for (i = 1; i < n; i++) { var p = pts[i], q = pts[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / n) * 0.42; rings += 'M' + PT(p[0] - dy / dl * w, p[1] + dx / dl * w) + ' Q' + PT(p[0] + dx / dl * 3, p[1] + dy / dl * 3) + ' ' + PT(p[0] + dy / dl * w, p[1] - dx / dl * w) + ' '; }
  return {d: thailand_band(pts, w0, w1), rings: rings}; }
// A limestone karst tower standing in the water: x centre, b base (the waterline), w wide, h high. 'needle' makes the
// famous kind that is narrower at the waterline than at the top. Returns the rock, its shaded side, the jungle on top
// and on the ledges (with lighter crowns), the dark streaks down the cliffs and a squashed reflection.
function thailand_karst(x, b, w, h, sd, needle, lean) {
  var L = [], R = [], n = 26, i, v, jl = '', hi = '', st = '', sh = [], rf = [];
  lean = lean || 0;
  for (i = 0; i <= n; i++) { v = i / n;
    var hw = w / 2 * (needle ? 0.38 + 0.62 * Math.pow(v, 0.5) : 0.84 + 0.2 * Math.sin(Math.PI * v * 0.8)) * (v < 0.06 ? 0.86 + v * 2.3 : 1);
    if (v > 0.74) hw *= Math.pow(Math.max(0, 1 - Math.pow((v - 0.74) / 0.26, 2)), 0.42);
    var ox = lean * v * h, y = b - v * h;
    L.push([x + ox - hw * (1 + 0.07 * Math.sin(v * 11 + sd) + 0.035 * Math.sin(v * 29 + sd * 3)), y]);
    R.push([x + ox + hw * (1 + 0.07 * Math.sin(v * 9 + sd * 2) + 0.035 * Math.sin(v * 31 + sd)), y]); }
  var rock = thailand_pg(L.concat(R.slice().reverse()));
  // the shaded right-hand side
  R.forEach(function (p, k) { sh.push([p[0] - (p[0] - L[k][0]) * (0.34 + 0.06 * Math.sin(k * 0.9 + sd)), p[1]]); });
  var shade = thailand_pg(sh.concat(R.slice().reverse()));
  // jungle: a bumpy canopy over the top, and clumps hanging on the ledges
  var rr = w * 0.085;
  for (i = Math.round(n * 0.66); i <= n; i++) { var k2 = hash(sd * 7 + i); jl += thailand_c(L[i][0] + rr * 0.3, L[i][1] + rr * 0.2, rr * (0.75 + k2 * 0.6)) + thailand_c(R[i][0] - rr * 0.3, R[i][1] + rr * 0.2, rr * (0.75 + hash(sd * 5 + i) * 0.6)); if (i % 2) hi += thailand_c(L[i][0] + rr * 0.1, L[i][1] - rr * 0.25, rr * 0.5); }
  var top = L[n], cnt = Math.max(3, Math.round(w / (rr * 1.3)));
  for (i = 0; i <= cnt; i++) { var u = i / cnt, cx = L[n - 3][0] + (R[n - 3][0] - L[n - 3][0]) * u, cy = top[1] + h * 0.07 - Math.sin(Math.PI * u) * h * 0.06, r = rr * (1 + hash(sd + i * 3) * 0.5); jl += thailand_c(cx, cy, r); hi += thailand_c(cx - r * 0.25, cy - r * 0.35, r * 0.55); }
  for (i = 0; i < 5; i++) { var vv = 0.22 + hash(sd * 3 + i) * 0.45, j = Math.round(vv * n), side = i % 2 ? R : L, dir = i % 2 ? -1 : 1, p = side[j], r2 = rr * (0.55 + hash(sd + i * 11) * 0.5);
    jl += thailand_e(p[0] + dir * r2 * 0.4, p[1], r2 * 1.2, r2 * 0.7) + thailand_c(p[0] + dir * r2 * 0.9, p[1] - r2 * 0.4, r2 * 0.6); hi += thailand_c(p[0] + dir * r2 * 0.5, p[1] - r2 * 0.35, r2 * 0.35); }
  // streaks running down the limestone
  for (i = 0; i < Math.max(4, Math.round(w / 18)); i++) { var fx = 0.15 + 0.7 * hash(sd * 13 + i), v0 = 0.5 + hash(sd + i * 7) * 0.3, v1 = 0.06 + hash(sd * 2 + i) * 0.35, j0 = Math.round(v0 * n), j1 = Math.round(v1 * n);
    var xa = L[j0][0] + (R[j0][0] - L[j0][0]) * fx, xb = L[j1][0] + (R[j1][0] - L[j1][0]) * fx; st += 'M' + PT(xa, L[j0][1]) + ' Q' + PT(xa + (hash(i + sd) - 0.5) * 8, (L[j0][1] + L[j1][1]) / 2) + ' ' + PT(xb, L[j1][1]) + ' '; }
  L.forEach(function (p) { rf.push([p[0], b + (b - p[1]) * 0.32]); }); R.slice().reverse().forEach(function (p) { rf.push([p[0], b + (b - p[1]) * 0.32]); });
  return {rock: rock, shade: shade, jungle: jl, hi: hi, streak: st, refl: thailand_pg(rf), L: L, R: R};
}
// a puffy cumulus: a flat-bottomed heap of bumps (body) and the soft shaded underside (shade)
function thailand_cloud(x, y, w, sd) { var body = rect(x - w * 0.5, y - w * 0.06, w, w * 0.08), shade = thailand_e(x, y, w * 0.48, w * 0.05), n = 6;
  for (var i = 0; i < n; i++) { var u = i / (n - 1), r = w * (0.1 + 0.1 * Math.sin(Math.PI * u) + hash(sd + i) * 0.04); body += thailand_c(x - w * 0.42 + u * w * 0.84, y - r * 0.6, r); }
  return {body: body, shade: shade}; }
// a five-petal flower (frangipani, or a fallen one on the sand): petals and the gold centre as a dot for a round-capped stroke
function thailand_frang(x, y, r, rot) { var d = ''; for (var i = 0; i < 5; i++) { var a = rot + i / 5 * Math.PI * 2; d += thailand_re(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.58, r * 0.32, a * 57.3 + 18); } return {d: d, dot: 'M' + PT(x - 0.1, y) + ' L' + PT(x + 0.1, y) + ' '}; }
// a little orchid: two side petals, two sepals, a top sepal and the lip
function thailand_orchid(x, y, r, rot) { var d = thailand_re(x, y - r * 0.55, r * 0.26, r * 0.5, rot) + thailand_re(x - r * 0.5, y + r * 0.3, r * 0.22, r * 0.46, rot - 120) + thailand_re(x + r * 0.5, y + r * 0.3, r * 0.22, r * 0.46, rot + 120)
    + thailand_re(x - r * 0.52, y - r * 0.08, r * 0.3, r * 0.48, rot - 62) + thailand_re(x + r * 0.52, y - r * 0.08, r * 0.3, r * 0.48, rot + 62) + thailand_e(x, y + r * 0.38, r * 0.26, r * 0.3); return {d: d, dot: 'M' + PT(x - 0.1, y + r * 0.1) + ' L' + PT(x + 0.1, y + r * 0.1) + ' '}; }

// ---------------------------------------------------------------- Thailand
// A tropical bay: jungle-topped limestone karsts rising from emerald water, a white beach where longtail boats are moored,
// leaning coconut palms, and on the headland at the left a white-and-gold temple with tiered roofs and a golden chedi.
// A frangipani branch reaches in at the top right and orchids grow in front. The water's shimmer, the waves on the sand,
// the boats, the palm crowns, the bells, the hornbill and (at night) the krathong and glowing waves are the engine's.
var thailand_C = {
  L: {far: '#A6D6DC', far2: '#8CC6C4', farJ: '#78B6A6', mist: 'rgba(240,252,250,0.75)', cloud: '#FFFFFF', cshade: 'rgba(170,215,230,0.55)', sun: '#FFF8DC', star: 'rgba(0,0,0,0)',
    wave: 'rgba(255,255,255,0.16)', shal: 'rgba(160,250,232,0.4)', krefl: 'rgba(20,90,90,0.22)', rock: '#C9BBA2', rshade: 'rgba(70,90,110,0.26)', jung: '#3A8A4E', jungH: '#68B25A', sand: '#F8EED6', shim: 'rgba(255,255,255,0.75)', streak: 'rgba(120,84,52,0.38)',
    white: '#FFFDF7', roof: '#D2462E', trim: '#1F7F6E', gold: '#EAB43A', dark: 'rgba(90,30,24,0.62)', bark: '#8E6A4C', leaf: '#3E8E48', pink: '#F27AAE', yel: '#FFCF3E', ring: 'rgba(70,40,20,0.35)'},
  D: {far: '#2A3866', far2: '#24305A', farJ: '#253C58', mist: 'rgba(130,140,210,0.22)', cloud: '#3C4478', cshade: 'rgba(20,22,60,0.45)', sun: '#FFF6D8', star: 'rgba(255,246,220,0.85)',
    wave: 'rgba(170,190,255,0.08)', shal: 'rgba(80,140,200,0.18)', krefl: 'rgba(5,10,30,0.35)', rock: '#3E4470', rshade: 'rgba(8,10,34,0.38)', jung: '#1C3842', jungH: '#27504E', sand: '#3E4068', shim: 'rgba(200,215,255,0.35)', streak: 'rgba(10,10,30,0.35)',
    white: '#E2D6CC', roof: '#93323A', trim: '#1E4E56', gold: '#E6AE40', dark: 'rgba(30,10,30,0.6)', bark: '#3E2E34', leaf: '#1E3E38', pink: '#C25A96', yel: '#F2C24A', ring: 'rgba(10,5,20,0.4)'}
};
SCENES.thailand = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = thailand_C[dk ? 'D' : 'L'], i, x, k;
  var S = ph ? 0.62 : Math.max(0.6, Math.min(1.1, H / 820)), hz = H * (ph ? 0.54 : 0.56);
  var sky = dk ? 'linear-gradient(180deg,#0C1A36 0%,#1C2E58 46%,#4A3A6A ' + (ph ? 54 : 56) + '%)' : 'linear-gradient(180deg,#8ED4EE 0%,#D6F2F2 ' + (ph ? 40 : 42) + '%,#F6EED2 ' + (ph ? 54 : 56) + '%)';
  var sea = dk ? 'linear-gradient(180deg,#1A2C58 0%,#16305A 30%,#173A62 70%,#1C4670 100%)' : 'linear-gradient(180deg,#2E9EA6 0%,#2FB2B0 22%,#3EC6BA 55%,#6ADCCB 85%,#8CE6D4 100%)';
  // sun (or moon) high on the right, over the water
  var sun = [W * (ph ? 0.74 : 0.7), H * (ph ? 0.2 : 0.15), (ph ? 22 : 34) * (ph ? 1 : S)];
  add(far, 'a', thailand_c(sun[0], sun[1], sun[2] * (dk ? 4 : 5.5)), dk ? 'rgba(160,170,250,0.16)' : 'rgba(255,252,226,0.75)');
  add(far, 'b', thailand_e(W * 0.5, hz - H * 0.02, W * 0.85, H * 0.07), dk ? 'rgba(150,110,190,0.35)' : 'rgba(255,250,232,0.85)');
  var stars = ''; if (dk) spread(0, 0, W, hz - H * 0.12, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.3 && Math.hypot(c.x - sun[0], c.y - sun[1]) > sun[2] * 2) stars += thailand_c(c.x, c.y, 0.5 + c.r * 0.9); });
  add(bg, 'h', stars, C.star);
  if (!ANIM) add(bg, 'g', thailand_c(sun[0], sun[1], sun[2]), C.sun);
  // clouds: a few puffy cumulus over the islands
  var cl = '', cs = '';
  (ph ? [[0.22, 0.12, 120], [0.8, 0.38, 110], [0.35, 0.46, 90]] : [[0.12, 0.16, 210], [0.44, 0.1, 170], [0.88, 0.3, 220], [0.6, 0.4, 150], [0.3, 0.44, 120]]).forEach(function (q, j) { var c = thailand_cloud(W * q[0], H * q[1], q[2] * (ph ? 1 : S), j * 5 + 2); cl += c.body; cs += c.shade; });
  add(bg, 'e', cl, C.cloud); add(bg, 'f', cs, C.cshade);
  // the farthest islands, pale with distance, and a row nearer
  var fr = '', fr2 = '', frJ = '';
  for (x = -30; x < W + 40; ) { var fw = (ph ? 26 : 50) + rnd() * (ph ? 30 : 60), fh = H * (0.03 + rnd() * 0.07); fr += thailand_karst(x + fw / 2, hz + 2, fw, fh, x * 0.1, false, (rnd() - 0.5) * 0.15).rock; x += fw * (0.8 + rnd() * 1.4); }
  (ph ? [[0.12, 0.13, 0.1], [0.42, 0.1, 0.07], [0.6, 0.16, 0.12], [0.96, 0.1, 0.08]] : [[0.03, 0.15, 0.07], [0.22, 0.1, 0.05], [0.36, 0.14, 0.06], [0.58, 0.18, 0.08], [0.7, 0.12, 0.05], [0.79, 0.2, 0.06]]).forEach(function (q, j) { var K = thailand_karst(W * q[0], hz + 3, W * q[2] * (ph ? 1.4 : 1), H * q[1] * (ph ? 0.8 : 1), j * 3.3 + 1, false, (hash(j) - 0.5) * 0.12); fr2 += K.rock; frJ += K.jungle; });
  add(bg, 'a', fr, C.far); add(bg, 'c', fr2, C.far2); add(bg, 'd', frJ, C.farJ);
  add(bg, 'b', thailand_e(W * 0.3, hz - 4, W * 0.4, 9) + thailand_e(W * 0.78, hz - 6, W * 0.3, 8), C.mist);
  // ---- the bay (the band holds the water's colour; these are its texture)
  var wave = '', shim = '';
  for (i = 0; i < (ph ? 7 : 9); i++) { var wy = hz + (H - hz) * Math.pow((i + 0.6) / (ph ? 7 : 9), 1.4) * 0.92, ww = 3 + i * 1.6, pts = []; for (x = -20; x <= W + 20; x += 20) pts.push([x, wy + Math.sin(x / (70 + i * 14) + i * 2.1) * (2 + i * 0.6)]); wave += 'M' + pts.map(function (q) { return PT(q[0], q[1]); }).join(' L') + ' '; }
  spread(0, hz + 6, W, H - hz, ph ? 70 : 120, 16, rnd, 1).forEach(function (c) { var k2 = (c.y - hz) / (H - hz); if (c.q < 0.45) shim += seg(c.x, c.y, c.x + 8 + c.r * 26 * (0.4 + k2), c.y); });
  // on the reflection layer, so the karsts and the headland stand in front of them
  stk(bg, 't', wave, C.wave, ph ? 4 : 6); stk(bg, 's', shim, C.shim, 1.1);
  // ---- karsts in the bay: a big island on the right, a needle in mid-bay, one behind the temple and small ones between
  var KS = ph ? [[0.9, 0.012, 0.3, 0.24, 11, 0, -0.05], [0.66, 0.006, 0.15, 0.14, 4, 0, 0.04], [0.24, 0.05, 0.12, 0.085, 7, 1, 0.03], [0.05, 0.01, 0.19, 0.17, 2, 0, 0.06]]
    : [[0.9, 0.012, 0.36, 0.13, 11, 0, -0.04], [1.0, 0.02, 0.26, 0.1, 3, 0, -0.06], [0.6, 0.075, 0.15, 0.045, 7, 1, 0.04], [0.47, 0.01, 0.2, 0.09, 5, 0, 0.03], [0.545, 0.004, 0.12, 0.06, 9, 0, -0.02], [0.08, 0.008, 0.3, 0.13, 2, 0, 0.05]];
  var rock = '', rsh = '', jung = '', jh = '', strk = '', krf = '', shal = '';
  KS.forEach(function (q) { var b = hz + H * q[1], K = thailand_karst(W * q[0], b, W * q[3] * (ph ? 1 : 1), H * q[2], q[4], !!q[5], q[6]);
    rock += K.rock; rsh += K.shade; jung += K.jungle; jh += K.hi; strk += K.streak; krf += K.refl; shal += thailand_e(W * q[0], b + 2, W * q[3] * 0.6, 3 + W * q[3] * 0.04); });
  // ---- the headland at the left, its top a level terrace for the temple, its flank dropping to the beach
  var py = H * (ph ? 0.78 : 0.82), hx1 = W * (ph ? 0.46 : 0.3), hx2 = W * (ph ? 0.56 : 0.37), shoreY = H * (ph ? 0.87 : 0.93);
  var head = [[-30, H + 30], [-30, py - 4]];
  for (x = -20; x <= hx1; x += 14) head.push([x, py - 2 - Math.sin(x / 23) * 1.5]);
  head.push([hx1 + (hx2 - hx1) * 0.25, py + (shoreY - py) * 0.12], [hx1 + (hx2 - hx1) * 0.55, py + (shoreY - py) * 0.42], [hx1 + (hx2 - hx1) * 0.82, py + (shoreY - py) * 0.75], [hx2, shoreY], [hx2 + W * 0.004, shoreY + (H - shoreY) * 0.4], [hx2 - W * 0.02, H + 30]);
  rock += thailand_pg(head);
  // cliff shading and ledges of the headland's face, under the terrace
  rsh += thailand_pg([[hx1 - W * 0.04, py + 6], [hx1 + (hx2 - hx1) * 0.3, py + (shoreY - py) * 0.14], [hx2, shoreY], [hx2 + W * 0.004, shoreY + (H - shoreY) * 0.4], [hx2 - W * 0.02, H + 30], [hx1 - W * 0.02, H + 30]]);
  for (i = 0; i < 7; i++) { var lx = W * 0.02 + i * (hx1 / 6.5), ly = py + (H - py) * (0.35 + 0.4 * hash(i + 31)); strk += 'M' + PT(lx, py + 8) + ' Q' + PT(lx + 6, (py + ly) / 2) + ' ' + PT(lx + 2, ly) + ' '; }
  // limestone ledges across the headland's face: a shaded band under each, with stalactite drips
  for (i = 0; i < 4; i++) { var ly0 = py + (H - py) * (0.14 + i * 0.22), lp = []; for (x = -20; x <= hx1 + (hx2 - hx1) * (0.2 + i * 0.25); x += 18) lp.push([x, ly0 + Math.sin(x / 31 + i * 2) * 3]);
    rsh += thailand_band(lp, 5, 3); for (k = 0; k < lp.length - 1; k += 2) { var dp = lp[k]; rsh += thailand_pg([[dp[0] - 3, dp[1] + 1], [dp[0] + 3, dp[1] + 1], [dp[0], dp[1] + 6 + hash(k + i * 9) * 9]]); } }
  // jungle on the headland: bushes behind the temple, a skirt of greenery along the terrace edge and down the flank
  var hb = ph ? 0.6 : 1;
  spread(-10, py - 34 * hb * S, hx1 + 10, 24 * hb * S, 26 * hb, 20, rnd, 0.6).forEach(function (c) { var r = (12 + c.r * 10) * hb * S; jung += thailand_c(c.x, c.y + 8 * hb, r); jh += thailand_c(c.x - r * 0.25, c.y + 8 * hb - r * 0.35, r * 0.5); });
  for (i = 0; i < 9; i++) { var u = i / 8, fx = hx1 + (hx2 - hx1) * u * 0.95, fy = py + (shoreY - py) * Math.pow(u, 1.2) + 4, r3 = (9 + hash(i + 50) * 9) * hb * S; jung += thailand_c(fx, fy, r3) + thailand_c(fx - r3 * 0.9, fy + r3 * 0.7, r3 * 0.8); jh += thailand_c(fx - r3 * 0.2, fy - r3 * 0.35, r3 * 0.45); }
  for (i = 0; i < 9; i++) { var vx = W * 0.015 + i * hx1 / 8.6, vl = (30 + hash(i + 80) * 60) * hb * S, vp = []; for (k = 0; k <= 6; k++) vp.push([vx + Math.sin(k * 0.9 + i) * 3, py + 6 + vl * k / 6]); jung += thailand_band(vp, 3.4 * hb, 1.4 * hb); for (k = 1; k <= 6; k++) jung += thailand_re(vp[k][0] + (k % 2 ? 3 : -3) * hb, vp[k][1], 3.2 * hb, 1.8 * hb, k % 2 ? 30 : -30); }
  for (i = 0; i < 6; i++) { var gx = W * 0.01 + i * hx1 / 5.5, gy2 = py + (H - py) * (0.55 + 0.35 * hash(i + 70)), r4 = (10 + hash(i + 71) * 12) * hb * S; jung += thailand_c(gx, gy2, r4) + thailand_e(gx + r4, gy2 + r4 * 0.3, r4 * 1.1, r4 * 0.7); jh += thailand_c(gx - r4 * 0.25, gy2 - r4 * 0.35, r4 * 0.45); }
  // ---- the beach: white sand from the headland's foot round to the right edge
  var shore = [[hx2 - 6, shoreY]]; for (x = hx2 + 10; x <= W + 30; x += 16) { var u2 = (x - hx2) / (W - hx2); shore.push([x, shoreY - (shoreY - H * (ph ? 0.835 : 0.85)) * Math.pow(Math.min(1, u2), 0.9) + Math.sin(x / 47) * 2.5]); }
  var sand = thailand_pg(shore.concat([[W + 30, H + 30], [hx2 - W * 0.02, H + 30], [hx2 + W * 0.004, shoreY + (H - shoreY) * 0.4]]));
  shal += thailand_pg(shore.map(function (p) { return [p[0], p[1] - 10 - (p[0] - hx2) * 0.004]; }).concat(shore.slice().reverse().map(function (p) { return [p[0], p[1] + 2]; })));
  var wet = 'M' + shore.map(function (p) { return PT(p[0], p[1] + 5); }).join(' L') + ' ';
  spread(hx2, H * (ph ? 0.87 : 0.9), W - hx2, H * 0.12, ph ? 40 : 60, 22, rnd, 0.9).forEach(function (c) { if (c.q < 0.6 && c.y > thailand_yOn(shore, c.x) + 12) strk += 'M' + PT(c.x - 8, c.y) + ' Q' + PT(c.x, c.y - 3) + ' ' + PT(c.x + 8, c.y) + ' '; });
  add(mid, 'b', shal, C.shal); add(mid, 'c', krf, C.krefl); add(mid, 'd', rock, C.rock); add(mid, 'e', rsh, C.rshade); add(mid, 'f', jung, C.jung); add(mid, 'g', jh, C.jungH); add(mid, 'h', sand, C.sand);
  stk(mid, 't', strk, C.streak, 1.3); stk(mid, 's', wet, dk ? 'rgba(170,200,255,0.25)' : 'rgba(255,255,255,0.85)', 2);
  // ---- the temple on the terrace: a white hall with tiered red-and-green roofs and gold gables, a golden chedi beside it,
  // a low white wall, and a stair with naga rails down to the beach
  var ts = ph ? 0.6 : S, gy = py - 2, hxc = W * (ph ? 0.2 : 0.13), cxc = W * (ph ? 0.4 : 0.255);
  var white = '', roof = '', trim = '', gold = '', dark = '', bells = [], doors = [];
  var pt0 = gy - 24 * ts;
  white += rect(hxc - 104 * ts, gy - 12 * ts, (cxc - hxc) + 150 * ts, 14 * ts) + rect(hxc - 96 * ts, pt0, (cxc - hxc) + 134 * ts, 13 * ts);
  gold += rect(hxc - 98 * ts, pt0 - 2 * ts, (cxc - hxc) + 138 * ts, 3 * ts) + rect(hxc - 104 * ts, gy - 13 * ts, (cxc - hxc) + 150 * ts, 2.4 * ts);
  // hall walls, pillars and doors
  var wt = pt0 - 46 * ts;
  white += rect(hxc - 70 * ts, wt, 140 * ts, 46 * ts);
  [-62, -36, 36, 62].forEach(function (q) { white += rect(hxc + q * ts - 4 * ts, wt - 2 * ts, 8 * ts, 48 * ts); gold += rect(hxc + q * ts - 5.5 * ts, wt + 1 * ts, 11 * ts, 4 * ts) + rect(hxc + q * ts - 5.5 * ts, pt0 - 4 * ts, 11 * ts, 3 * ts); });
  [[-49, 9, 22], [0, 13, 34], [49, 9, 22]].forEach(function (q) { var dx = hxc + q[0] * ts, dw = q[1] * ts, dh = q[2] * ts, dy0 = pt0 - dh - 2 * ts, arch = [];
    for (var a = 0; a <= 10; a++) { var th = Math.PI + a / 10 * Math.PI; arch.push([dx + Math.cos(th) * dw, dy0 + Math.sin(th) * dw * 0.9 - (a === 5 ? dw * 0.5 : 0)]); }
    gold += thailand_pg([[dx - dw - 2.4 * ts, pt0]].concat(arch.map(function (p) { return [dx + (p[0] - dx) * (1 + 2.4 * ts / dw), dy0 + (p[1] - dy0) * 1.25 - 2 * ts]; }), [[dx + dw + 2.4 * ts, pt0]]));
    dark += thailand_pg([[dx - dw, pt0]].concat(arch, [[dx + dw, pt0]])); doors.push([dx, (dy0 + pt0) / 2, dw, dh]); });
  // three roof tiers seen from the gable end, each red with green edges, gold bargeboards with chofa and naga-curl ends
  function gable(cx, base, hw, h, edge) { var p = [[cx - hw, base]], k3; for (k3 = 1; k3 < 10; k3++) { var u3 = k3 / 10; p.push([cx - hw * (1 - u3), base - h * u3 - Math.sin(Math.PI * u3) * h * 0.06]); } p.push([cx, base - h]); for (k3 = 9; k3 > 0; k3--) { u3 = k3 / 10; p.push([cx + hw * (1 - u3), base - h * u3 - Math.sin(Math.PI * u3) * h * 0.06]); } p.push([cx + hw, base]); return p; }
  // the side roofs sweeping down over the walls, with naga-curl ends
  var sk = [[hxc - 96 * ts, wt + 8 * ts], [hxc - 70 * ts, wt - 22 * ts], [hxc + 70 * ts, wt - 22 * ts], [hxc + 96 * ts, wt + 8 * ts], [hxc + 86 * ts, wt + 10 * ts], [hxc - 86 * ts, wt + 10 * ts]];
  roof += thailand_pg(sk); trim += thailand_pg([[hxc - 98 * ts, wt + 6 * ts], [hxc + 98 * ts, wt + 6 * ts], [hxc + 96 * ts, wt + 11 * ts], [hxc - 96 * ts, wt + 11 * ts]]);
  var tiers = [[hxc, wt - 74 * ts, 54 * ts, 70 * ts], [hxc, wt - 44 * ts, 66 * ts, 82 * ts], [hxc, wt - 14 * ts, 80 * ts, 92 * ts]];
  tiers.forEach(function (q, j) { var gp = gable(q[0], q[1], q[2], q[3]); roof += thailand_pg(gp);
    // green edge band just inside each tier's outline and its eave
    var inner = gable(q[0], q[1] - 3 * ts, q[2] - 7 * ts, q[3] - 11 * ts);
    trim += thailand_pg(gp) + thailand_hole(inner);
    if (j === 2) { // the front gable: a gold frame (bargeboards with serrated bai raka) around a dark red pediment with a gold sun motif
      var fr3 = gable(q[0], q[1] - 2 * ts, q[2] - 9 * ts, q[3] - 14 * ts), pin = gable(q[0], q[1] - 6 * ts, q[2] - 19 * ts, q[3] - 30 * ts);
      gold += thailand_pg(fr3); dark += thailand_pg(pin);
      var mc = [q[0], q[1] - 6 * ts - (q[3] - 30 * ts) * 0.36], mr = 9 * ts, motif = [];
      for (k = 0; k < 16; k++) { var a2 = k / 16 * Math.PI * 2, rq = k % 2 ? mr * 0.6 : mr; motif.push([mc[0] + Math.cos(a2) * rq, mc[1] + Math.sin(a2) * rq]); }
      dark += thailand_hole(motif) + thailand_pg(rotp([[-mr * 0.35, 0], [0, -mr * 0.35], [mr * 0.35, 0], [0, mr * 0.35]], mc[0], mc[1], 0));
      for (k = 1; k < 9; k++) { var u4 = k / 9, ex = q[2] - 9 * ts, eh = q[3] - 14 * ts, bx = q[0] - ex * (1 - u4), byy = q[1] - 2 * ts - eh * u4 - Math.sin(Math.PI * u4) * eh * 0.06; gold += thailand_pg([[bx - 4 * ts, byy - 1 * ts], [bx - 3 * ts, byy - 8 * ts], [bx + 2 * ts, byy - 3 * ts]]) + thailand_pg([[2 * q[0] - bx + 4 * ts, byy - 1 * ts], [2 * q[0] - bx + 3 * ts, byy - 8 * ts], [2 * q[0] - bx - 2 * ts, byy - 3 * ts]]); }
    } else gold += thailand_band(gable(q[0], q[1] - 1 * ts, q[2] - 2 * ts, q[3] - 3 * ts), 3 * ts, 3 * ts);
    // chofa: a slender gold horn curling up and outward at the apex
    var ax = q[0], ay = q[1] - q[3];
    gold += thailand_band([[ax, ay + 3 * ts], [ax + 2 * ts, ay - 6 * ts], [ax + 1 * ts, ay - 14 * ts], [ax + 5 * ts, ay - 19 * ts], [ax + 9 * ts, ay - 18 * ts]], 4.4 * ts, 1.6 * ts);
    // hang hong: naga curls at the lower ends, where the bells hang
    [-1, 1].forEach(function (d) { var ex2 = q[0] + d * q[2], ey = q[1]; gold += thailand_band([[ex2 - d * 6 * ts, ey - 3 * ts], [ex2 + d * 1 * ts, ey - 1 * ts], [ex2 + d * 5 * ts, ey - 6 * ts], [ex2 + d * 4 * ts, ey - 11 * ts], [ex2 + d * 1 * ts, ey - 10 * ts]], 3.6 * ts, 1.4 * ts); bells.push([ex2 + d * 1 * ts, ey + 1 * ts]); });
  });
  [-1, 1].forEach(function (d) { var ex3 = hxc + d * 96 * ts, ey3 = wt + 8 * ts; gold += thailand_band([[ex3 - d * 6 * ts, ey3], [ex3 + d * 2 * ts, ey3 - 1 * ts], [ex3 + d * 6 * ts, ey3 - 7 * ts], [ex3 + d * 4 * ts, ey3 - 12 * ts], [ex3 + d * 1 * ts, ey3 - 10 * ts]], 4 * ts, 1.4 * ts); bells.push([ex3 + d * 2 * ts, ey3 + 1 * ts]); });
  // the chedi: a stepped white base, a golden bell, a stack of rings and a slender spire
  var cb0 = pt0, chedi = [];
  white += rect(cxc - 34 * ts, cb0 - 10 * ts, 68 * ts, 10 * ts) + rect(cxc - 28 * ts, cb0 - 19 * ts, 56 * ts, 10 * ts) + rect(cxc - 22 * ts, cb0 - 27 * ts, 44 * ts, 9 * ts);
  gold += rect(cxc - 35 * ts, cb0 - 11 * ts, 70 * ts, 2.4 * ts) + rect(cxc - 29 * ts, cb0 - 20 * ts, 58 * ts, 2.4 * ts) + rect(cxc - 23 * ts, cb0 - 28 * ts, 46 * ts, 2.4 * ts);
  var bellP = [[-24, -28], [-25, -34], [-24, -46], [-21, -60], [-16, -72], [-10, -80], [-6, -84]];
  gold += thailand_pg(bellP.map(function (p) { return [cxc + p[0] * ts, cb0 + p[1] * ts]; }).concat(bellP.slice().reverse().map(function (p) { return [cxc - p[0] * ts, cb0 + p[1] * ts]; })));
  gold += rect(cxc - 10 * ts, cb0 - 92 * ts, 20 * ts, 9 * ts) + rect(cxc - 12 * ts, cb0 - 94 * ts, 24 * ts, 3 * ts);
  var rg = '', ry = cb0 - 94 * ts;
  for (k = 0; k < 9; k++) { var rw = (8.6 - k * 0.72) * ts, rh = (6 - k * 0.3) * ts; gold += thailand_e(cxc, ry - rh * 0.5, rw, rh * 0.62); rg += rect(cxc - rw * 0.92, ry - 0.9 * ts, rw * 1.84, 1.2 * ts); ry -= rh; }
  gold += thailand_band([[cxc, ry + 2 * ts], [cxc, ry - 22 * ts], [cxc, ry - 40 * ts]], 3.4 * ts, 1 * ts) + thailand_c(cxc, ry - 18 * ts, 2.6 * ts);
  var tip = [cxc, ry - 40 * ts];
  // the bell's shaded side and the bands at its foot
  dark += rg + thailand_pg([[cxc + 8 * ts, cb0 - 28 * ts], [cxc + 25 * ts, cb0 - 30 * ts], [cxc + 24 * ts, cb0 - 46 * ts], [cxc + 21 * ts, cb0 - 60 * ts], [cxc + 16 * ts, cb0 - 72 * ts], [cxc + 9 * ts, cb0 - 80 * ts], [cxc + 4 * ts, cb0 - 82 * ts], [cxc + 9 * ts, cb0 - 60 * ts]]) + rect(cxc - 24 * ts, cb0 - 36 * ts, 48 * ts, 1.6 * ts) + rect(cxc - 24.5 * ts, cb0 - 42 * ts, 49 * ts, 1.6 * ts);
  // a low white wall with gold-tipped posts along the terrace edge, and a stair with naga rails down the flank
  for (x = hxc - 100 * ts; x <= cxc + 44 * ts; x += 14 * ts) { white += rect(x - 2.5 * ts, gy - 21 * ts, 5 * ts, 9 * ts); gold += thailand_c(x, gy - 22 * ts, 2.4 * ts); }
  white += rect(hxc - 100 * ts, gy - 16 * ts, (cxc - hxc) + 144 * ts, 4 * ts);
  var st0 = [cxc + 44 * ts, gy], st1 = [hx2 - W * 0.01, shoreY + 4], stairs = '';
  white += thailand_pg([[st0[0] - 2 * ts, st0[1] - 2], [st0[0] + 14 * ts, st0[1] - 2], [st1[0] + 10 * ts, st1[1]], [st1[0] - 8 * ts, st1[1]]]);
  for (k = 1; k < 10; k++) { var u5 = k / 10, sx = st0[0] + (st1[0] - st0[0]) * u5, sy = st0[1] + (st1[1] - st0[1]) * u5; stairs += rect(sx - 3 * ts, sy, 16 * ts + 2 * u5 * ts, 1.4 * ts); }
  dark += stairs;
  gold += thailand_band([[st0[0] + 15 * ts, st0[1] - 7 * ts], [st1[0] + 12 * ts, st1[1] - 6 * ts]], 2.4 * ts, 2.8 * ts) + thailand_band([[st1[0] + 12 * ts, st1[1] - 6 * ts], [st1[0] + 17 * ts, st1[1] - 14 * ts], [st1[0] + 14 * ts, st1[1] - 20 * ts], [st1[0] + 9 * ts, st1[1] - 17 * ts]], 3 * ts, 1.8 * ts) + rect(st1[0] + 9 * ts, st1[1] - 6 * ts, 6 * ts, 6 * ts);
  // ---- coconut palms leaning out over the beach on the right
  var palms = ph ? [[1.04, 0.86, 0.6, 24, 7, 4.4], [0.96, 0.7, 0.67, -26, 6, 3.6]] : [[1.03, 0.89, 0.5, 40, 13, 7], [0.97, 0.79, 0.62, -30, 11, 6], [0.62, 0.55, 0.69, 18, 8, 4.6]];
  var bark = '', rings = '', crowns = [];
  palms.forEach(function (q, j) { var y0 = j === 2 ? thailand_yOn(shore, W * q[0]) + H * 0.035 : H + 20, T = thailand_trunk(W * q[0], y0, W * q[1], H * q[2], q[3] * S, q[4] * S, q[5] * S); bark += T.d; rings += T.rings; crowns.push({x: W * q[1], y: H * q[2], L: (ph ? 62 : 104) * S * (j === 2 ? 0.8 : 1), ph: j * 2.1 + 0.4}); });
  [[0.9, 0.012], [0.925, 0.03], [0.6, 0.02]].forEach(function (q, j) { if (ph && j === 2) return; var cx2 = W * q[0], cy2 = thailand_yOn(shore, cx2) + H * (0.05 + q[1]); bark += thailand_e(cx2, cy2, 6.5 * S, 5.5 * S) + thailand_e(cx2 + 11 * S, cy2 + 2 * S, 5.5 * S, 4.6 * S); });
  // ---- frangipani reaching in from the top right
  var br = ph ? [[W + 20, H * 0.1], [W * 0.86, H * 0.115], [W * 0.74, H * 0.105], [W * 0.62, H * 0.13]] : [[W + 20, H * 0.03], [W * 0.95, H * 0.07], [W * 0.88, H * 0.07], [W * 0.8, H * 0.105]];
  bark += thailand_band(br, (ph ? 9 : 13) * S + 2, (ph ? 4 : 5) * S + 1) + thailand_band([br[1], [br[1][0] - W * 0.02, br[1][1] + H * 0.05], [br[1][0] - W * (ph ? 0.06 : 0.035), br[1][1] + H * 0.075]], (ph ? 5 : 7) * S + 1, (ph ? 3 : 4) * S + 1);
  var leaf = '', pink = '', yel = '', tips = [br[3], br[2], [br[1][0] - W * (ph ? 0.06 : 0.035), br[1][1] + H * 0.075], br[1]];
  tips.forEach(function (p, j) { var L2 = (ph ? 30 : 46) * S, n2 = 6; for (k = 0; k < n2; k++) { var a3 = (-160 + k * (300 / n2) + j * 25) * Math.PI / 180, l = L2 * (0.75 + hash(j * 9 + k) * 0.4); leaf += thailand_re(p[0] + Math.cos(a3) * l * 0.5, p[1] + Math.sin(a3) * l * 0.5, l * 0.5, l * 0.15, a3 * 57.3); }
    for (k = 0; k < 5; k++) { var a4 = -2.2 + k * 0.95 + j, rr2 = (ph ? 10 : 15) * S * (0.4 + hash(j + k * 3) * 0.5), fr4 = thailand_frang(p[0] + Math.cos(a4) * rr2, p[1] + Math.sin(a4) * rr2 * 0.8 - 4 * S, (ph ? 5.5 : 8) * S, a4 * 1.7); pink += fr4.d; yel += fr4.dot; } });
  // ---- orchids and greenery in front: a clump at the bottom right and at the foot of the headland, fallen flowers on the sand
  var clumps = ph ? [[0.94, 0.93, 0.8], [0.04, 0.93, 0.75]] : [[0.97, 1.0, 1], [0.42, 1.0, 0.7], [0.02, 1.0, 0.9]];
  clumps.forEach(function (q, j) { var bx2 = W * q[0], by2 = H * q[1] + 6, s2 = S * q[2];
    for (k = 0; k < 7; k++) { var a5 = (-170 + k * 27) * Math.PI / 180, l3 = (38 + hash(j * 7 + k) * 26) * s2; leaf += thailand_re(bx2 + Math.cos(a5) * l3 * 0.5, by2 + Math.sin(a5) * l3 * 0.42, l3 * 0.5, l3 * 0.13, a5 * 57.3 + (k < 3 ? 8 : -8)); }
    [[-1, 0.9], [1, 1.1]].forEach(function (sp, m) { var pts2 = []; for (k = 0; k <= 8; k++) { var u6 = k / 8; pts2.push([bx2 + sp[0] * u6 * 46 * s2 * sp[1], by2 - 20 * s2 - Math.sin(u6 * 2.2) * 60 * s2 * sp[1] + u6 * u6 * 26 * s2]); }
      leaf += thailand_band(pts2, 2.6 * s2, 1.4 * s2); for (k = 3; k <= 8; k++) { var o = thailand_orchid(pts2[k][0], pts2[k][1] + 7 * s2, 7.5 * s2 * (1 - (k - 3) * 0.06), sp[0] * 10 + k * 4); pink += o.d; yel += o.dot; } }); });
  for (i = 0; i < (ph ? 4 : 7); i++) { var fx2 = hx2 + (W - hx2) * (0.08 + 0.85 * hash(i + 90)), fy2 = thailand_yOn(shore, fx2) + (H - thailand_yOn(shore, fx2)) * (0.35 + 0.5 * hash(i + 91)), fr5 = thailand_frang(fx2, fy2, (ph ? 4 : 5.5) * S, hash(i + 92) * 6); pink += fr5.d; yel += fr5.dot; }
  add(near, 'a', white, C.white); add(near, 'b', roof, C.roof); add(near, 'c', trim, C.trim); add(near, 'd', gold, C.gold); add(near, 'e', dark, C.dark); add(near, 'f', bark, C.bark); add(near, 'g', leaf, C.leaf); add(near, 'h', pink, C.pink);
  stk(near, 's', yel, C.yel, (ph ? 2.6 : 3.6) * S); stk(near, 't', rings, C.ring, 1.2);
  if (ANIM) { ANIM.hz = hz; ANIM.S = S; ANIM.C = C; ANIM.sun = sun; ANIM.shore = shore; ANIM.head = head; ANIM.bells = bells; ANIM.doors = doors; ANIM.tip = tip; ANIM.chedi = [cxc, cb0, ts]; ANIM.hall = [hxc, wt, ts]; ANIM.crowns = crowns; ANIM.py = py; ANIM.hx2 = hx2;
    ANIM.boats = ph ? [[0.68, -0.012, 0.56, 0, 1], [0.34, 0.3, 0.3, 2, -1]] : [[0.5, -0.008, 0.82, 0, 1], [0.66, -0.014, 0.76, 1, -1], [0.8, -0.022, 0.7, 2, 1], [0.86, 0.42, 0.42, 3, -1]]; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near, band: {top: hz, bg: sea}};
};
