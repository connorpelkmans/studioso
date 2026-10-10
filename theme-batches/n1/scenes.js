// ---- batch n1: onsen (Hot Spring), rainforest (Rainforest Canopy), tidepool (Tide Pools), volcano (Volcano Island), savanna (Savanna Sunset)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n1_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n1_P(pts) { return poly(n1_cw(pts)); }
function n1_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n1_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n1_RE(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n1_P(rotp(p, x, y, ang)); }
function n1_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n1_fn(x0, x1, step, fn) { var p = []; for (var x = x0; x <= x1 + 0.01; x += step) p.push([x, fn(x)]); return p; }
// a leaf outline as points: base at (x,y), pointing along ang (degrees)
function n1_leafPts(x, y, len, w, ang, bend) { var up = [], lo = [], b = bend || 0; for (var i = 0; i <= 14; i++) { var t = i / 14, ww = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), c = b * len * t * t; up.push([t * len, c - ww]); lo.unshift([t * len, c + ww]); } return rotp(up.concat(lo.slice(1, -1)), x, y, ang); }
function n1_leaf(x, y, len, w, ang, bend) { return n1_P(n1_leafPts(x, y, len, w, ang, bend)); }
// a lumpy stone: an ellipse with a little noise and a flatter bottom
function n1_stonePts(x, y, rx, ry, rnd) { var p = [], k = 0.08; for (var i = 0; i < 18; i++) { var t = i / 18 * Math.PI * 2, s = Math.sin(t), r = 1 + (rnd() - 0.5) * k * 2; p.push([x + Math.cos(t) * rx * r, y + s * ry * r * (s > 0 ? 0.72 : 1)]); } return p; }
// snow cap for a stone: the upper part with a soft dripping lower edge
function n1_capPts(x, y, rx, ry, rnd, depth) { var p = [], d = depth || 0.42; for (var i = 0; i <= 12; i++) { var t = Math.PI * (1.12 + 0.76 * i / 12); p.push([x + Math.cos(t) * rx * 1.03, y + Math.sin(t) * ry * 1.05]); } for (var j = 12; j >= 0; j--) { var u = j / 12, xx = x - rx * 0.9 + u * rx * 1.8, dy = Math.sin(u * Math.PI) * ry * d * (0.85 + 0.3 * rnd()); p.push([xx, y - ry * 0.55 + dy]); } return p; }
// a snowy pine: green tiers and a snow layer on each tier
function n1_pine(x, y, h, out, sd) { var tiers = 4, sk = sd || 0.55; for (var i = 0; i < tiers; i++) { var yT = y - h + i * h * 0.21, yB = yT + h * (0.34 + i * 0.03), w = h * (0.14 + i * 0.075), g = [[x, yT]], s = [[x, yT]], k;
    for (k = 0; k <= 6; k++) { var u = k / 6, xx = x + w - u * 2 * w; g.push([xx, yB + (k % 2 ? -h * 0.025 : 0)]); }
    for (k = 0; k <= 6; k++) { var v = k / 6, x2 = x + w * (sk < 0.5 ? 0.56 : 0.66) - v * w * (sk < 0.5 ? 1.12 : 1.32); s.push([x2, yT + (yB - yT) * sk + (k % 2 ? h * 0.03 : -h * 0.012)]); }
    out.g += n1_P(g); out.s += n1_P(s); }
  out.g += rect(x - h * 0.03, y - h * 0.05, h * 0.06, h * 0.07); }

// =============== 1. Hot Spring (onsen): a steaming outdoor bath in snowy mountains, ringed by stones, pines and a bathhouse
SCENES.onsen = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.5), refl = Lay(0.6), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800);
  var sky = dk ? 'linear-gradient(180deg,#1C2340 0%,#262C52 34%,#3A3F6B 64%,#6B5A7A 100%)' : 'linear-gradient(180deg,#BFD8EE 0%,#D3E4F2 36%,#E8F1F8 62%,#F6EEE6 100%)';
  // sun / moon and stars
  var mx = W * (ph ? 0.24 : 0.2), my = H * (ph ? 0.1 : 0.14), mr = ph ? 20 : 30;
  if (dk) { add(far, 'a', n1_C(mx, my, mr * 2.1), 'rgba(200,200,255,0.12)'); add(far, 'c', n1_C(mx, my, mr), '#F4F0DC');
    var st = ''; spread(0, 0, W, H * 0.52, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - mx, c.y - my) > mr * 2) st += n1_C(c.x, c.y, 0.5 + c.r * 1.1); }); add(far, 'b', st, 'rgba(255,248,236,0.85)'); }
  else { add(far, 'a', n1_C(mx, my, mr * 2.2), 'rgba(255,250,236,0.4)'); add(far, 'c', n1_C(mx, my, mr * 1.05), 'rgba(255,253,244,0.95)');
    var cl = ''; spread(0, H * 0.06, W, H * 0.2, ph ? 200 : 360, 100, rnd, 0.8).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - mx, c.y - my) > 90) { var s = 0.7 + c.r * 0.6; cl += n1_E(c.x, c.y, 64 * s, 12 * s) + n1_C(c.x - 20 * s, c.y - 8 * s, 18 * s) + n1_C(c.x + 16 * s, c.y - 12 * s, 22 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.85)'); }
  // far mountains: jagged peaks with snow caps and shadowed faces
  var base = H * (ph ? 0.5 : 0.56), pk = [], np = ph ? 3 : 6;
  for (var i = 0; i <= np; i++) pk.push([W * (i / np) + (rnd() - 0.5) * W * 0.06, H * (ph ? 0.22 : 0.17) + rnd() * H * 0.14]);
  var mtn = [[-60 - W * 0.05, base - H * 0.06]], k; for (i = 0; i < pk.length; i++) { mtn.push(pk[i]); var nx = i < pk.length - 1 ? pk[i + 1] : [W + 120, base]; mtn.push([(pk[i][0] + nx[0]) / 2 + (rnd() - 0.5) * 20, Math.max(pk[i][1], nx[1]) + H * (0.07 + rnd() * 0.06)]); }
  add(far, 'd', n1_P(mtn.concat([[W + 120, base + 40], [-120, base + 40]])), dk ? '#3A4272' : '#9DB3CF');
  var snow = '', shade = '';
  for (i = 1; i < mtn.length - 1; i += 2) { var p = mtn[i], sl = mtn[i - 1], sr = mtn[i + 1], fr = 0.5 + rnd() * 0.14, A1 = [p[0] + (sr[0] - p[0]) * fr, p[1] + (sr[1] - p[1]) * fr], B1 = [p[0] + (sl[0] - p[0]) * fr, p[1] + (sl[1] - p[1]) * fr], pts = [p, A1];
    for (k = 1; k < 6; k++) { var u = k / 6; pts.push([A1[0] + (B1[0] - A1[0]) * u, A1[1] + (B1[1] - A1[1]) * u + (k % 2 ? -1 : 1) * (p[1] - A1[1]) * -0.16]); } pts.push(B1);
    snow += n1_P(pts); shade += n1_P([p, sr, [sr[0] - (sr[0] - p[0]) * 0.3, sr[1] + (base - sr[1]) * 0.5], [p[0] + (sr[0] - p[0]) * 0.35, base + 40], [p[0] + (sr[0] - p[0]) * 0.1, base + 40]]); }
  add(far, 'e', shade, dk ? 'rgba(20,22,60,0.3)' : 'rgba(90,115,160,0.24)'); add(far, 'f', snow, dk ? '#8E95C4' : '#F7FAFD');
  // nearer snowy hills
  var r2 = ridge(W, H * (ph ? 0.53 : 0.55), [[H * 0.04, ph ? 80 : 150, 0.8], [H * 0.015, 50, 2.2]], 8);
  add(far, 'g', below(r2, H + 20), dk ? '#4C5488' : '#DCE6F2');
  var hs = ''; r2.forEach(function (p, j) { if (j % 9 === 4) hs += n1_P([[p[0], p[1] + 2], [p[0] + 60, p[1] + 46], [p[0] + 120, p[1] + 30]]); }); add(far, 'h', hs, dk ? 'rgba(40,46,90,0.5)' : 'rgba(150,175,210,0.35)');
  // forest band on the hills
  var fo = {g: '', s: ''}, gy0 = H * (ph ? 0.6 : 0.62);
  spread(-20, H * (ph ? 0.53 : 0.555), W + 40, H * 0.06, ph ? 18 : 24, 16, rnd, 1).forEach(function (c) { if (c.q < 0.75) n1_pine(c.x, Math.max(c.y, n1_yOn(r2, c.x) + 14), (ph ? 22 : 30) + c.r * (ph ? 14 : 22), fo); });
  add(refl, 'a', fo.g, dk ? '#232B52' : '#4F7C7A'); add(refl, 'b', fo.s, dk ? '#7880B0' : '#F4F8FC');
  // the snowy ground behind the pool
  var ground = n1_fn(-60, W + 60, 8, function (x) { return gy0 + H * 0.02 + Math.sin(x / 120 + 1) * 5 + Math.sin(x / 47) * 2; });
  add(mid, 'a', below(ground, H + 20), dk ? '#565C92' : '#E9EFF7');
  // the bathhouse (right)
  var bx = W * (ph ? 0.74 : 0.83), bw = (ph ? 150 : 250) * (ph ? 1 : S), by = n1_yOn(ground, bx) + (ph ? 6 : 10), wh = bw * 0.36, rh = bw * 0.26, ov = bw * 0.12;
  var L0 = bx - bw / 2, R0 = bx + bw / 2;
  add(refl, 'c', rect(L0 - 4, by - 6, bw + 8, 10) + rect(L0, by - wh, bw * 0.05, wh) + rect(R0 - bw * 0.05, by - wh, bw * 0.05, wh) + rect(L0 + bw * 0.47, by - wh, bw * 0.04, wh) + rect(L0 - ov, by - wh - 4, bw + ov * 2, 6), dk ? '#3A2A34' : '#6E4A34');
  add(refl, 'd', rect(L0, by - wh, bw, wh), dk ? '#6A4E52' : '#B07E58');
  var roof = n1_P([[L0 - ov, by - wh - 2], [L0 + bw * 0.12, by - wh - rh], [R0 - bw * 0.12, by - wh - rh], [R0 + ov, by - wh - 2]]);
  add(refl, 'e', roof, dk ? '#2C3354' : '#4E5A72');
  var rs = n1_P([[L0 - ov - 3, by - wh - rh * 0.42], [L0 + bw * 0.1, by - wh - rh - 5], [R0 - bw * 0.1, by - wh - rh - 5], [R0 + ov + 3, by - wh - rh * 0.42], [R0 + ov - bw * 0.08, by - wh - rh * 0.3], [bx + bw * 0.2, by - wh - rh * 0.45], [bx, by - wh - rh * 0.36], [bx - bw * 0.25, by - wh - rh * 0.48], [L0 - ov + bw * 0.06, by - wh - rh * 0.3]]);
  var chim = [R0 - bw * 0.22, by - wh - rh * 0.75]; add(refl, 'c', rect(chim[0] - bw * 0.025, chim[1] - rh * 0.55, bw * 0.05, rh * 0.6));
  add(refl, 'f', rs + rect(chim[0] - bw * 0.035, chim[1] - rh * 0.6, bw * 0.07, rh * 0.12), dk ? '#B4B8E0' : '#FFFFFF');
  var w1 = rect(L0 + bw * 0.1, by - wh * 0.78, bw * 0.3, wh * 0.42), w2 = rect(L0 + bw * 0.6, by - wh * 0.78, bw * 0.3, wh * 0.42);
  add(refl, 'g', w1 + w2, dk ? '#FFD58A' : '#F6E9CC');
  var lat = ''; [w1, w2].forEach(function (w, j) { var x0 = L0 + bw * (j ? 0.6 : 0.1), y0 = by - wh * 0.78, ww = bw * 0.3, hh = wh * 0.42; for (var q = 1; q < 4; q++) lat += seg(x0 + ww * q / 4, y0, x0 + ww * q / 4, y0 + hh); lat += seg(x0, y0 + hh / 2, x0 + ww, y0 + hh / 2); });
  stk(refl, 's', lat, dk ? 'rgba(120,70,40,0.6)' : 'rgba(110,74,52,0.55)', ph ? 1 : 1.4);
  // noren curtain over the door, with a hot spring mark
  var nx = L0 + bw * 0.47 + bw * 0.02, nw = bw * 0.2, ny = by - wh + 3, nh = wh * 0.45, nr = '';
  for (var q2 = 0; q2 < 3; q2++) nr += rect(nx - nw / 2 + q2 * nw / 3 + 0.8, ny, nw / 3 - 1.6, nh);
  add(refl, 'h', nr, dk ? '#3E4E9A' : '#34508E');
  var mk = n1_C(nx, ny + nh * 0.62, nw * 0.13); for (q2 = -1; q2 <= 1; q2++) mk += 'M' + PT(nx + q2 * nw * 0.1, ny + nh * 0.42) + ' q' + n1(nw * 0.05) + ' ' + n1(-nh * 0.1) + ' 0 ' + n1(-nh * 0.2) + ' ';
  stk(refl, 't', mk, '#FFFFFF', ph ? 1 : 1.5);
  // the pool
  var cx = W * (ph ? 0.5 : 0.42), cy = H * (ph ? 0.86 : 0.85), rx = W * (ph ? 0.44 : 0.33), ry = H * (ph ? 0.07 : 0.095);
  add(mid, 'c', n1_E(cx, cy - ry * 0.18, rx * 1.1, ry * 1.25), dk ? '#474C80' : '#D2DCEA');
  add(mid, 'd', n1_E(cx, cy, rx, ry), dk ? '#355A86' : '#6CC0D2');
  add(mid, 'e', n1_E(cx - rx * 0.06, cy + ry * 0.12, rx * 0.84, ry * 0.7), dk ? '#3E6898' : '#86D2DE');
  // stones ringing the pool: the back row sits over the water's far edge (mid), the front row in front (near)
  var back = '', backCap = '', front = '', frontSh = '', frontCap = '';
  var nb = ph ? 9 : 15;
  for (i = 0; i < nb; i++) { var t = Math.PI * (1.02 + 0.96 * i / (nb - 1)), sx = cx + Math.cos(t) * rx * 1.02, sy = cy + Math.sin(t) * ry * 1.02, srx = (ph ? 16 : 26) * (0.8 + rnd() * 0.5), sry = srx * (0.55 + rnd() * 0.15);
    back += n1_P(n1_stonePts(sx, sy, srx, sry, rnd)); backCap += n1_P(n1_capPts(sx, sy, srx, sry, rnd)); }
  add(mid, 'g', back, dk ? '#4A4E78' : '#8C95A6'); add(mid, 'h', backCap, dk ? '#C2C6E8' : '#FFFFFF');
  var nf = ph ? 8 : 13;
  for (i = 0; i < nf; i++) { var t2 = Math.PI * (0.04 + 0.92 * i / (nf - 1)), fx = cx + Math.cos(t2) * rx * 1.04, fy = cy + Math.sin(t2) * ry * 1.1 + 6, frx = (ph ? 20 : 34) * (0.8 + rnd() * 0.5), fry = frx * (0.5 + rnd() * 0.15);
    var spts = n1_stonePts(fx, fy, frx, fry, rnd); front += n1_P(spts); frontSh += n1_P(spts.filter(function (p, j) { return j < 9; }).map(function (p) { return [p[0], p[1]]; }).concat([[fx - frx * 0.7, fy + fry * 0.1]]));
    frontCap += n1_P(n1_capPts(fx, fy, frx, fry, rnd, 0.3)); }
  // side stones where the lanterns stand
  var lanL = [cx - rx * (ph ? 0.62 : 0.8), cy - ry * (ph ? 1.45 : 1.15)], lanR = [cx + rx * (ph ? 0.83 : 1.1), cy - ry * (ph ? 1.4 : 0.9)];
  [lanL, lanR].forEach(function (p) { var sr = ph ? 22 : 38; front += n1_P(n1_stonePts(p[0], p[1] + 4, sr, sr * 0.5, rnd)); frontCap += n1_P(n1_capPts(p[0], p[1] + 4, sr, sr * 0.5, rnd, 0.2)); });
  add(near, 'b', frontSh, dk ? '#3A3C66' : '#7A8394');
  // stone lanterns (toro): base, post, light box, roof and a little top knob
  var lan = [], lb = '', ld = '', ll = '', lsnow = '';
  [[lanL, ph ? 0.6 : 1], [lanR, ph ? 0.52 : 0.86]].forEach(function (q) { var x = q[0][0], y = q[0][1] - 2, s = q[1] * S * (ph ? 1.6 : 1), u = 10 * s;
    lb += n1_P([[x - u * 1.5, y], [x - u * 1.2, y - u * 0.8], [x + u * 1.2, y - u * 0.8], [x + u * 1.5, y]]) + rect(x - u * 0.45, y - u * 4, u * 0.9, u * 3.3) + rect(x - u * 1.25, y - u * 4.6, u * 2.5, u * 0.7) + rect(x - u * 1.0, y - u * 6.6, u * 2.0, u * 2.1);
    ld += n1_P([[x - u * 2.1, y - u * 6.4], [x - u * 0.9, y - u * 7.9], [x + u * 0.9, y - u * 7.9], [x + u * 2.1, y - u * 6.4], [x + u * 2.3, y - u * 6.0], [x - u * 2.3, y - u * 6.0]]) + n1_C(x, y - u * 8.4, u * 0.55) + rect(x - u * 0.15, y - u * 9.2, u * 0.3, u * 0.5);
    ll += rect(x - u * 0.55, y - u * 6.1, u * 1.1, u * 1.3);
    // snow on the roof and the knob, and a little drift on the base
    lsnow += n1_P([[x - u * 2.0, y - u * 6.55], [x - u * 0.85, y - u * 8.05], [x + u * 0.85, y - u * 8.05], [x + u * 2.0, y - u * 6.55], [x + u * 1.2, y - u * 6.85], [x + u * 0.4, y - u * 6.95], [x - u * 0.5, y - u * 6.75], [x - u * 1.3, y - u * 7.0]]) + n1_E(x, y - u * 8.75, u * 0.5, u * 0.25) + n1_E(x, y - u * 4.62, u * 1.15, u * 0.2);
    lan.push({x: x, y: y - u * 5.45, r: u * 5, s: s}); });
  add(near, 'd', lb, dk ? '#5C5F8A' : '#A9AFBC'); add(near, 'e', ld, dk ? '#3E4068' : '#6F7686'); add(near, 'f', ll, dk ? '#FFD58A' : '#F7EBCB');
  // the deer scarer (shishi-odoshi) at the back left of the pool: a tube pivoting on a post, fed by a bamboo water pipe (kakehi)
  // that comes out of a thick cut-topped bamboo standing behind the rim stones. All of it sits behind the stones (mid layer).
  var sp = {px: cx - rx * (ph ? 0.36 : 0.4), py: cy - ry * 1.05 - (ph ? 16 : 26) * S, L: (ph ? 56 : 84) * S, w: (ph ? 7 : 11) * S};
  sp.a0 = -0.38; sp.a1 = 0.62;
  var c0 = Math.cos(sp.a0), s0 = Math.sin(sp.a0), stx = sp.px - sp.L * 0.4 * c0 - sp.w * 0.5 * s0, sty = sp.py - sp.L * 0.4 * s0 + sp.w * 0.5 * c0;
  sp.stone = [stx, sty];   // where the resting tube touches its clack stone
  var bam = '', nodes = '', rimY = function (x) { var u = (x - cx) / (rx * 1.02); return cy - ry * 1.02 * Math.sqrt(Math.max(0, 1 - u * u)); };
  var kx = sp.px + sp.L * 0.98, kw = sp.w * 1.35, kT = sp.py - sp.L * 0.98, kB = rimY(kx) + 4;
  bam += n1_P([[kx - kw / 2, kT + kw * 0.55], [kx + kw / 2, kT], [kx + kw / 2, kB], [kx - kw / 2, kB]]);
  nodes += seg(kx - kw / 2, kT + kw * 0.55, kx + kw / 2, kT) + seg(kx - kw / 2, kT + (kB - kT) * 0.45, kx + kw / 2, kT + (kB - kT) * 0.45);
  var pyy = sp.py - sp.L * 0.7, ph2 = sp.w * 0.32, pe = [sp.px + sp.L * 0.5, sp.py - sp.L * 0.63];
  bam += n1_P([[kx, pyy - ph2], [pe[0] - ph2 * 0.8, pe[1] - ph2], [pe[0] + ph2 * 0.5, pe[1] + ph2], [kx, pyy + ph2]]);
  nodes += seg(kx - kw / 2 - 1.5, pyy - ph2 * 1.5, kx - kw / 2 - 1.5, pyy + ph2 * 1.5) + seg((kx + pe[0]) / 2, (pyy + pe[1]) / 2 - ph2, (kx + pe[0]) / 2, (pyy + pe[1]) / 2 + ph2);
  sp.pipe = [pe[0] - ph2 * 0.1, pe[1] + ph2 * 0.6];
  // the pivot post behind the tube (its foot is hidden by the stone in front)
  bam += rect(sp.px - sp.w * 0.32, sp.py - sp.w * 0.7, sp.w * 0.64, sp.L * 0.5) + n1_C(sp.px, sp.py - sp.w * 0.7, sp.w * 0.32);
  var csr = 16 * S, csy = sty + 9 * S * 0.9;
  front += n1_P(n1_stonePts(stx + 2 * S, csy, csr, 9 * S, rnd)); frontCap += n1_P(n1_capPts(stx + 2 * S, csy, csr, 9 * S, rnd, 0.3));
  front += n1_P(n1_stonePts(sp.px, sp.py + sp.L * 0.4, 20 * S, 11 * S, rnd)); frontCap += n1_P(n1_capPts(sp.px, sp.py + sp.L * 0.4, 20 * S, 11 * S, rnd, 0.3));
  // foreground snow banks and big snowy pines framing the scene
  var bankL = n1_fn(-60, W * 0.3, 8, function (x) { var u = (x + 60) / (W * 0.3 + 60); return H - (ph ? 30 : 46) * Math.sin(Math.PI * Math.min(1, u * 1.1)) - 4; });
  var bankR = n1_fn(W * 0.66, W + 60, 8, function (x) { var u = (x - W * 0.66) / (W * 0.34 + 60); return H - (ph ? 26 : 40) * Math.sin(Math.PI * Math.min(1, 0.1 + u)) - 4; });
  frontCap += below(bankL, H + 20) + below(bankR, H + 20);
  add(near, 'a', front, dk ? '#4E5280' : '#959DAD'); add(near, 'c', frontCap, dk ? '#C2C6E8' : '#FFFFFF');
  var pn = {g: '', s: ''}; n1_pine(W * (ph ? -0.04 : 0.0), n1_yOn(ground, 0) + H * (ph ? 0.14 : 0.2), H * (ph ? 0.3 : 0.5), pn, 0.36); n1_pine(W * (ph ? 0.97 : 0.985), n1_yOn(ground, W) + H * (ph ? 0.05 : 0.1), H * (ph ? 0.24 : 0.4), pn, 0.36);
  if (!ph) { n1_pine(W * 0.06, n1_yOn(ground, W * 0.06) + H * 0.04, H * 0.24, pn, 0.38); n1_pine(W * 0.94, n1_yOn(ground, W * 0.94) + 14, H * 0.22, pn, 0.38); }
  add(near, 'g', pn.g, dk ? '#1E2A48' : '#3E6E66'); add(near, 'h', pn.s + lsnow, dk ? '#C2C6E8' : '#FFFFFF');
  add(mid, 'f', bam, dk ? '#5E7A5A' : '#8DB56A'); stk(mid, 't', nodes, dk ? '#3A4E3A' : '#5E8A44', ph ? 1.2 : 2);
  // a bamboo fence between the pool and the bathhouse
  var fx0 = cx + rx * 0.62, fx1 = L0 - (ph ? 4 : 10), fy = n1_yOn(ground, (fx0 + fx1) / 2) + (ph ? 8 : 14), fh = (ph ? 30 : 48) * S, fence = '', ties = '';
  if (fx1 > fx0 + 20) { for (var fxx = fx0; fxx < fx1; fxx += (ph ? 5 : 8)) fence += rrect(fxx, fy - fh + Math.sin(fxx * 0.7) * 2, (ph ? 4 : 6.5), fh, 2); ties += seg(fx0 - 2, fy - fh * 0.7, fx1 + 4, fy - fh * 0.7) + seg(fx0 - 2, fy - fh * 0.3, fx1 + 4, fy - fh * 0.3); }
  add(mid, 'b', fence, dk ? '#6C6A86' : '#CDB27A'); stk(mid, 's', ties, dk ? '#3E3A58' : '#8A6A3E', ph ? 1.4 : 2.4);
  add(mid, 'h', fence ? n1_P([[fx0 - 4, fy - fh - 2], [fx1 + 4, fy - fh - 2], [fx1 + 4, fy - fh + 5], [(fx0 + fx1) / 2, fy - fh + 8], [fx0 - 4, fy - fh + 5]]) : '', dk ? '#C2C6E8' : '#FFFFFF');
  var steamStill = '';
  if (ANIM) {
    ANIM.pool = {cx: cx, cy: cy, rx: rx, ry: ry}; ANIM.sp = sp; ANIM.lan = lan; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ground = gy0;
    ANIM.house = {lantern: [L0 + bw * 0.25, by - wh - 2], chim: [chim[0], chim[1] - rh * 0.6], wins: [[L0 + bw * 0.25, by - wh * 0.57], [L0 + bw * 0.75, by - wh * 0.57]], bw: bw};
    ANIM.monkey = {x: cx + rx * (ph ? 0.5 : 0.56), y: cy - ry * 0.32, s: (ph ? 0.8 : 1.15) * S};
  } else {
    // still picture: the tube at rest and a few soft wisps of steam
    var tl = -sp.L * 0.4, tr = sp.L * 0.6, TP = function (lx, ly) { return [sp.px + lx * c0 - ly * s0, sp.py + lx * s0 + ly * c0]; };
    add(mid, 'f', n1_P([TP(tl, -sp.w / 2), TP(tr, -sp.w / 2), TP(tr - sp.w * 0.5, sp.w / 2), TP(tl, sp.w / 2)]));
    var r1 = TP(sp.L * 0.05, -sp.w / 2), r2 = TP(sp.L * 0.05, sp.w / 2); stk(mid, 't', seg(r1[0], r1[1], r2[0], r2[1]));
    add(near, 'b', n1_C(sp.px, sp.py, sp.w * 0.2));
    for (i = 0; i < (ph ? 4 : 7); i++) { var wx = cx - rx * 0.62 + i * rx * 1.24 / (ph ? 3 : 6) + (rnd() - 0.5) * 20 * S, wy = cy - ry * (0.1 + rnd() * 0.3), wl = (34 + rnd() * 20) * S; steamStill += 'M' + PT(wx, wy) + ' c' + n1(-10 * S) + ' ' + n1(-wl * 0.3) + ' ' + n1(10 * S) + ' ' + n1(-wl * 0.6) + ' ' + n1(2 * S) + ' ' + n1(-wl) + ' '; }
    stk(near, 't', steamStill, dk ? 'rgba(220,220,255,0.14)' : 'rgba(255,255,255,0.42)', 16 * S);
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 2. Rainforest Canopy: layers of giant leaves, hanging vines and a distant waterfall, seen from the treetops
// closed Catmull-Rom smoothing of a point loop
function n1_smooth(p, n) { var o = [], L = p.length; for (var i = 0; i < L; i++) { var a = p[(i - 1 + L) % L], b = p[i], c = p[(i + 1) % L], d = p[(i + 2) % L]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } return o; }
// open Catmull-Rom through a list of points (end points kept)
function n1_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = []; for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } o.push(p[p.length - 1]); return o; }
function n1_hole(pts) { return poly(n1_cw(pts).slice().reverse()); }   // counter-clockwise: cuts a hole through its own slot
// heart-shaped leaf, base at the origin pointing along +x (local points)
function n1_heartPts(L, w, droop) { var top = [[0.06, 0], [-0.07, -0.32], [-0.06, -0.66], [0.07, -0.92], [0.27, -1.0], [0.52, -0.84], [0.76, -0.5], [0.93, -0.16]], pts = [], d = droop || 0;
  top.forEach(function (q) { pts.push([q[0] * L, q[1] * w + d * q[0] * q[0] * L]); }); pts.push([L, d * L]); for (var i = top.length - 1; i >= 0; i--) pts.push([top[i][0] * L, -top[i][1] * w + d * top[i][0] * top[i][0] * L]); return n1_smooth(pts, 3); }
// a big two-tone leaf (base colour in slot kb, the lit half in slot kl); mon: a monstera with slits and holes. Records its tip and veins.
// every big leaf is recorded (outline, holes, veins and its slot rank) so its veins can be cut where a leaf drawn above covers them
function n1_rec(out, kb, poly) { var r = {r: 'abcdefgh'.indexOf(kb), poly: poly, holes: [], veins: []}; out.L.push(r); return r; }
function n1_leaf2(out, kb, kl, x, y, L, w, ang, droop, mon) { var pts = n1_heartPts(L, w, droop), d = droop || 0, a = ang * Math.PI / 180, k, mr = [], rec = n1_rec(out, kb, rotp(pts, x, y, ang));
  for (k = 0; k <= 10; k++) { var u = k / 10; mr.push([u * L, d * u * u * L]); }
  out[kb] += n1_P(rotp(pts, x, y, ang)); out[kl] += n1_P(rotp(pts.slice(0, 25).concat(mr.slice(1, -1).reverse()), x, y, ang));
  out.tips.push([x + L * Math.cos(a) - d * L * Math.sin(a), y + L * Math.sin(a) + d * L * Math.cos(a)]);
  rec.veins.push(rotp(mr.slice(0, 10), x, y, ang));
  for (k = 1; k <= 3; k++) { var u2 = 0.14 + k * 0.2, by = d * u2 * u2 * L; [-1, 1].forEach(function (sd) { rec.veins.push(rotp([[u2 * L, by], [(u2 + 0.12) * L, by + sd * w * (0.5 - k * 0.08)]], x, y, ang)); }); }
  if (mon) { var half = function (u) { var best = 0, bd = 1e9; pts.slice(0, 25).forEach(function (p) { var dd = Math.abs(p[0] - u * L); if (dd < bd) { bd = dd; best = Math.abs(p[1] - d * u * u * L); } }); return best; };
    for (k = 0; k < 4; k++) { var u3 = 0.2 + k * 0.17, b3 = d * u3 * u3 * L, e = half(u3 + 0.07); [-1, 1].forEach(function (sd) { var hp = rotp([[u3 * L, b3 + sd * w * 0.13], [(u3 + 0.03) * L, b3 + sd * w * 0.13], [(u3 + 0.1) * L, b3 + sd * e * 0.86], [(u3 + 0.05) * L, b3 + sd * e * 0.88]], x, y, ang), h = n1_hole(hp); rec.holes.push(hp); out[kb] += h; if (sd < 0) out[kl] += h; });
      if (k < 3) { var hp2 = rotp(n1_smooth([[(u3 + 0.09) * L, b3 + w * 0.22], [(u3 + 0.12) * L, b3 + w * 0.29], [(u3 + 0.09) * L, b3 + w * 0.35], [(u3 + 0.06) * L, b3 + w * 0.29]], 3), x, y, ang); rec.holes.push(hp2); out[kb] += n1_hole(hp2); } } } }
// long banana leaf with torn slits, two-tone
function n1_banana(out, kb, kl, x, y, L, w, ang, droop, rnd) { var up = [], lo = [], d = droop, i, mr = []; for (i = 0; i <= 16; i++) { var u = i / 16, ww = w * Math.pow(Math.sin(Math.PI * Math.min(0.999, u * 0.94 + 0.03)), 0.55), b = d * u * u * L; up.push([u * L, b - ww]); lo.unshift([u * L, b + ww * 0.9]); mr.push([u * L, b]); }
  var rec = n1_rec(out, kb, rotp(up.concat(lo), x, y, ang)); out[kb] += n1_P(rec.poly); out[kl] += n1_P(rotp(up.concat(mr.slice(1, -1).reverse()), x, y, ang)); rec.veins.push(rotp(mr, x, y, ang));
  for (i = 0; i < 7; i++) { var u2 = 0.18 + i * 0.1 + rnd() * 0.04, b2 = d * u2 * u2 * L, sd = i % 2 ? 1 : -1, e = w * Math.pow(Math.sin(Math.PI * (u2 * 0.94 + 0.03)), 0.55) * (sd > 0 ? 0.84 : 0.93), h = n1_hole(rotp([[u2 * L, b2 + sd * w * 0.08], [(u2 + 0.012) * L, b2 + sd * w * 0.08], [(u2 + 0.05) * L, b2 + sd * e], [(u2 + 0.04) * L, b2 + sd * e]], x, y, ang)); rec.holes.push(rotp([[u2 * L, b2 + sd * w * 0.08], [(u2 + 0.012) * L, b2 + sd * w * 0.08], [(u2 + 0.05) * L, b2 + sd * e], [(u2 + 0.04) * L, b2 + sd * e]], x, y, ang)); out[kb] += h; if (sd < 0) out[kl] += h; }
  var a = ang * Math.PI / 180; out.tips.push([x + L * Math.cos(a) - d * L * Math.sin(a), y + L * Math.sin(a) + d * L * Math.cos(a)]); }
// the veins as one path, each cut wherever a leaf drawn above it (a later slot, or another leaf in the same slot) or one of its own holes covers it
function n1_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function n1_bb(P) { var b = [1e9, 1e9, -1e9, -1e9]; P.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); return b; }
function n1_veins(out) { var Ls = out.L, d = ''; Ls.forEach(function (l) { l.bb = n1_bb(l.poly); l.hb = l.holes.map(n1_bb); });
  Ls.forEach(function (l, i) { var occ = Ls.filter(function (m, j) { return j !== i && m.r >= l.r && (m.r > l.r || j > i); });
    var hid = function (x, y) { for (var k = 0; k < occ.length; k++) { var b = occ[k].bb; if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && n1_inPoly(occ[k].poly, x, y)) return true; }
      for (k = 0; k < l.holes.length; k++) { var h = l.hb[k]; if (x >= h[0] - 1 && x <= h[2] + 1 && y >= h[1] - 1 && y <= h[3] + 1 && n1_inPoly(l.holes[k], x, y)) return true; } return false; };
    l.veins.forEach(function (V) { var run = []; for (var s = 1; s < V.length; s++) { var a = V[s - 1], b = V[s], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)); for (var q = s === 1 ? 0 : 1; q <= n; q++) { var x = a[0] + (b[0] - a[0]) * q / n, y = a[1] + (b[1] - a[1]) * q / n;
        if (hid(x, y)) { if (run.length > 1) d += pline(run); run = []; } else run.push([x, y]); } } if (run.length > 1) d += pline(run); }); });
  return d; }
// an arching fern frond
function n1_fern(out, slot, x, y, L, ang, curl) { var a = ang * Math.PI / 180, px = x, py = y, n = 22; for (var i = 0; i < n; i++) { var u = i / n, st = L / n, lw = L * 0.22 * Math.sin(Math.PI * (0.12 + u * 0.88)) * (1 - u * 0.35); a += curl * 0.03; px += Math.cos(a) * st; py += Math.sin(a) * st;
    if (i > 1) [-1, 1].forEach(function (sd) { var lp = n1_leafPts(px, py, lw, lw * 0.2, (a + sd * 1.25) * 180 / Math.PI + sd * u * 10, 0); out[slot] += n1_P(lp); if (out.L) n1_rec(out, slot, lp); }); }
  out.tips.push([px, py]); }

SCENES.rainforest = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(4), refl = Lay(1.4), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800);
  var sky = dk ? 'linear-gradient(180deg,#0F2A2A 0%,#133634 38%,#174240 62%,#2D5C4E 100%)' : 'linear-gradient(180deg,#9FD4B8 0%,#BFE3C4 34%,#D9F0C9 60%,#F3F7D8 100%)';
  var mx = W * (ph ? 0.3 : 0.36), my = H * (ph ? 0.1 : 0.12), mr = ph ? 18 : 26, i, x;
  if (dk) { add(far, 'a', n1_C(mx, my, mr * 2.4), 'rgba(190,240,220,0.12)'); add(far, 'c', n1_C(mx, my, mr), '#E8F4E4');
    var st = ''; spread(0, 0, W, H * 0.45, 36, 36, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - mx, c.y - my) > mr * 2) st += n1_C(c.x, c.y, 0.5 + c.r); }); add(far, 'b', st, 'rgba(230,255,240,0.75)'); }
  else { add(far, 'a', n1_C(mx, my, mr * 3), 'rgba(255,255,230,0.5)'); add(far, 'c', n1_C(mx, my, mr), 'rgba(255,255,240,1)');
    var cl = ''; spread(0, H * 0.04, W, H * 0.22, ph ? 190 : 330, 110, rnd, 0.8).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - mx, c.y - my) > 90) { var s = 0.7 + c.r * 0.6; cl += n1_E(c.x, c.y, 60 * s, 13 * s) + n1_C(c.x - 18 * s, c.y - 9 * s, 18 * s) + n1_C(c.x + 15 * s, c.y - 13 * s, 23 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.8)'); }
  // the cliff with the waterfall
  var wx = W * 0.7, cT = H * (ph ? 0.24 : 0.2), cB = H * (ph ? 0.56 : 0.6), cw = W * (ph ? 0.36 : 0.26), ww = W * (ph ? 0.05 : 0.032);
  var cliff = [[wx - cw * 0.62, cB + 30], [wx - cw * 0.56, cT + H * 0.1], [wx - cw * 0.48, cT + H * 0.03], [wx - cw * 0.3, cT], [wx, cT + 4], [wx + cw * 0.3, cT - H * 0.01], [wx + cw * 0.5, cT + H * 0.04], [wx + cw * 0.58, cT + H * 0.14], [wx + cw * 0.66, cB + 30]];
  add(far, 'e', n1_P(cliff), dk ? '#24504A' : '#8DBBA6');
  var cs = n1_P([[wx + ww * 0.6, cT + 6], [wx + cw * 0.3, cT - H * 0.005], [wx + cw * 0.5, cT + H * 0.04], [wx + cw * 0.58, cT + H * 0.14], [wx + cw * 0.66, cB + 30], [wx + ww * 0.6, cB + 30]]);
  var ctop = ''; for (i = 0; i < 12; i++) { var tx = wx - cw * 0.5 + i * cw * 1.05 / 11, ty = cT + 2; if (Math.abs(tx - wx) > ww * 0.9) ctop += n1_C(tx, ty, (ph ? 8 : 12) + rnd() * 6); }
  add(far, 'f', cs + ctop, dk ? 'rgba(14,40,36,0.5)' : 'rgba(70,130,105,0.45)');
  add(far, 'g', n1_P([[wx - ww / 2, cT + 2], [wx + ww / 2, cT + 2], [wx + ww * 0.62, cB], [wx - ww * 0.62, cB]]), dk ? '#A6CCC8' : '#F4FBF8');
  var mist = ''; for (i = 0; i < 7; i++) mist += n1_C(wx + (i - 3) * ww * 0.9, cB - 6 + Math.abs(i - 3) * 4, ww * (1.1 - Math.abs(i - 3) * 0.12)); add(far, 'h', mist, dk ? 'rgba(170,210,205,0.55)' : 'rgba(255,255,255,0.85)');
  // far canopy rows: a soft distant row (far), then a nearer row of round crowns with emergent giants rising behind it (refl)
  var row1 = '', r1b = [], y1 = H * (ph ? 0.5 : 0.54); for (x = -40; x < W + 60; x += (ph ? 26 : 38)) { var yb1 = y1 + Math.sin(x * 0.03) * 10 + rnd() * 10, rb1 = (ph ? 22 : 32) + rnd() * 14; row1 += n1_C(x, yb1, rb1); r1b.push([x, yb1, rb1]); }
  add(far, 'd', row1 + rect(-60, y1 + 10, W + 120, H), dk ? '#1C4842' : '#A8D7B4');
  var r1hi = ''; r1b.forEach(function (q, j) { r1hi += n1_E(q[0] - q[2] * 0.22, q[1] - q[2] * 0.5, q[2] * 0.5, q[2] * 0.26) + (j % 3 === 1 ? n1_C(q[0] + q[2] * 0.35, q[1] - q[2] * 0.15, q[2] * 0.3) : ''); });
  var row2 = '', hi2 = '', sh2 = '', r2b = [], y2 = H * (ph ? 0.6 : 0.64);
  for (x = -40; x < W + 60; x += (ph ? 30 : 44)) { var r = (ph ? 26 : 38) + rnd() * 16, yy = y2 + Math.sin(x * 0.021 + 1) * 14 + rnd() * 12; row2 += n1_C(x, yy, r); hi2 += n1_C(x - r * 0.25, yy - r * 0.35, r * 0.55) + n1_C(x - r * 0.42, yy - r * 0.62, r * 0.16); sh2 += n1_E(x + r * 0.18, yy + r * 0.62, r * 0.78, r * 0.3); r2b.push([x, yy, r]); }
  var trunks = '', crowns = '', ch = '', bloom = '';
  (ph ? [[0.12, 0.38], [0.92, 0.42]] : [[0.08, 0.3], [0.3, 0.42], [0.95, 0.34]]).forEach(function (q, ti) { var x0 = W * q[0], y0 = H * q[1], r0 = (ph ? 34 : 54), tw = ph ? 5 : 8;
    // a tall straight trunk with a slight lean and two forking limbs up into the crown
    trunks += n1_P([[x0 - tw, y2 + 30], [x0 - tw * 0.45, y0 + 6], [x0 + tw * 0.45, y0 + 6], [x0 + tw, y2 + 30]]) + n1_limb(x0, y0 + r0 * 0.7, x0 - r0 * 0.62, y0 + r0 * 0.02, tw * 0.45, tw * 0.22, -r0 * 0.05) + n1_limb(x0, y0 + r0 * 0.55, x0 + r0 * 0.66, y0 - r0 * 0.04, tw * 0.42, tw * 0.2, r0 * 0.05) + n1_limb(x0, y0 + r0 * 0.4, x0 + r0 * 0.1, y0 - r0 * 0.2, tw * 0.35, tw * 0.18, 0);
    // an umbrella crown in two tiers of lumpy lobes, lit from the upper left
    var lobes = []; for (var kk = -3; kk <= 3; kk++) lobes.push([x0 + kk * r0 * 0.36, y0 + Math.abs(kk) * r0 * 0.05 + Math.sin(kk * 2.1 + ti) * r0 * 0.04, r0 * (0.34 - Math.abs(kk) * 0.025), r0 * 0.22]);
    for (kk = -1; kk <= 1; kk++) lobes.push([x0 + kk * r0 * 0.42 + r0 * 0.05, y0 - r0 * 0.2 + Math.abs(kk) * r0 * 0.04, r0 * 0.3, r0 * 0.2]);
    lobes.forEach(function (l) { crowns += n1_E(l[0], l[1], l[2], l[3]); ch += n1_E(l[0] - l[2] * 0.22, l[1] - l[3] * 0.38, l[2] * 0.55, l[3] * 0.42); }); });
  // a few trees in bloom poking out of the nearer row
  r2b.forEach(function (q, j) { if (j % (ph ? 4 : 5) !== 2 || Math.abs(q[0] - wx) < cw * 0.55) return; for (var m = 0; m < 7; m++) { var a2 = m / 7 * 6.283 + j, rr2 = m % 2 ? 0.36 : 0.2; bloom += n1_C(q[0] - q[2] * 0.1 + Math.cos(a2) * q[2] * rr2, q[1] - q[2] * 0.7 + Math.sin(a2) * q[2] * rr2 * 0.55, q[2] * (m % 2 ? 0.1 : 0.13)); } });
  add(refl, 'a', r1hi, dk ? 'rgba(120,200,170,0.08)' : 'rgba(255,255,255,0.14)');
  add(refl, 'b', trunks, dk ? '#2A3A34' : '#8A7A62'); add(refl, 'c', crowns, dk ? '#18443A' : '#5FA276'); add(refl, 'd', ch, dk ? '#1F5244' : '#79B88A');
  add(refl, 'e', row2 + rect(-60, y2 + 10, W + 120, H), dk ? '#163E38' : '#74B488'); add(refl, 'f', hi2, dk ? '#1C4A42' : '#8CC79A');
  add(refl, 'g', sh2, dk ? 'rgba(6,24,20,0.35)' : 'rgba(40,100,70,0.22)'); add(refl, 'h', bloom, dk ? '#5A4466' : '#E9AFC8');
  // nearer canopy with the big branches, moss, bromeliads and little mushrooms
  var row3 = '', hi3 = '', y3 = H * (ph ? 0.78 : 0.8);
  for (x = -40; x < W + 60; x += (ph ? 36 : 56)) { var r3 = (ph ? 32 : 48) + rnd() * 20, y33 = y3 + Math.sin(x * 0.017 + 2) * 18 + rnd() * 14; row3 += n1_C(x, y33, r3); hi3 += n1_C(x - r3 * 0.3, y33 - r3 * 0.4, r3 * 0.45); }
  add(mid, 'a', row3 + rect(-60, y3 + 20, W + 120, H), dk ? '#0F302A' : '#3F8C5E'); add(mid, 'b', hi3, dk ? '#143A32' : '#57A570');
  function branch(pts, th) { var L = [], R = []; pts.forEach(function (p, j) { var q = pts[Math.min(pts.length - 1, j + 1)], o = pts[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = th * (1 - 0.55 * j / (pts.length - 1)); L.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); R.push([p[0] + dy / dl * w, p[1] - dx / dl * w]); }); var ay = function (a) { return a.reduce(function (m, p) { return m + p[1]; }, 0) / a.length; }, top = (ay(L) < ay(R) ? L : R).slice().sort(function (p, q) { return p[0] - q[0]; }); return {body: n1_P(L.concat(R.slice().reverse())), top: top}; }
  var b1p = ph ? [[W + 20, H * 0.3], [W * 0.8, H * 0.31], [W * 0.62, H * 0.295], [W * 0.48, H * 0.31]] : [[W + 30, H * 0.29], [W * 0.9, H * 0.3], [W * 0.8, H * 0.285], [W * 0.68, H * 0.3], [W * 0.6, H * 0.29]];
  var b2p = ph ? [[-20, H * 0.74], [W * 0.18, H * 0.725], [W * 0.38, H * 0.745], [W * 0.5, H * 0.73]] : [[-30, H * 0.8], [W * 0.1, H * 0.77], [W * 0.22, H * 0.765], [W * 0.34, H * 0.73], [W * 0.42, H * 0.72]];
  var B1 = branch(n1_curve(b1p, 5), ph ? 7 : 11), B2 = branch(n1_curve(b2p, 5), ph ? 9 : 14);
  var liana = '', liana1 = ''; [[W * (ph ? 0.68 : 0.76), H * 0.3, ph ? 40 : 70], [W * (ph ? 0.2 : 0.16), H * (ph ? 0.74 : 0.77), ph ? 34 : 56]].forEach(function (q, li) { var ld = 'M' + PT(q[0] - q[2], q[1] - 6) + ' Q' + PT(q[0], q[1] + q[2] * 1.1) + ' ' + PT(q[0] + q[2], q[1] - 4) + ' '; liana += ld; if (!li) liana1 = ld; });
  add(mid, 'c', B1.body + B2.body, dk ? '#2E2824' : '#7A5A42');
  var moss = '', moss1 = ''; [B1, B2].forEach(function (B, bi) { B.top.forEach(function (p, j) { if (j % 2 === 0) { var me = n1_E(p[0], p[1] + 1, (ph ? 5 : 8) + rnd() * 5, ph ? 2.5 : 4); moss += me; if (!bi) moss1 += me; } }); }); add(mid, 'd', moss, dk ? '#2E5A3A' : '#86BE58');
  var brom = '', bfl = '', mush = '', mushSpots = [], bs = ph ? 0.75 : 1.1;
  function bromeliad(x, y, s) { for (var j = 0; j < 7; j++) brom += n1_leaf(x, y, 22 * s, 3.2 * s, -150 + j * 20); bfl += n1_P([[x - 3 * s, y - 2 * s], [x, y - 22 * s], [x + 3 * s, y - 2 * s]]) + n1_C(x, y - 22 * s, 2.6 * s); }
  [B1.top[Math.floor(B1.top.length * 0.5)], B2.top[Math.floor(B2.top.length * 0.445)]].forEach(function (p) { bromeliad(p[0], p[1] + 2, bs); });
  [B1.top[Math.floor(B1.top.length * 0.12)], B2.top[Math.floor(B2.top.length * 0.12)], B2.top[Math.floor((B2.top.length - 1) * 0.98)]].forEach(function (p) { for (var q = 0; q < 3; q++) { var mx2 = p[0] + (q - 1) * 9 * bs, my2 = p[1] + 1, mr2 = (4 + (q === 1 ? 2.5 : 0)) * bs;
    mush += rect(mx2 - mr2 * 0.3, my2 - mr2 * 0.5, mr2 * 0.6, mr2 * 0.5 + 2) + 'M' + PT(mx2 - mr2, my2 - mr2 * 0.5) + ' a' + n1(mr2) + ' ' + n1(mr2 * 0.9) + ' 0 0 1 ' + n1(2 * mr2) + ' 0 Z '; mushSpots.push([mx2, my2 - mr2 * 0.8, mr2]); } });
  add(mid, 'e', brom, dk ? '#3E6A3A' : '#A2C84A'); add(mid, 'f', bfl, dk ? '#C8506A' : '#F2556A'); add(mid, 'g', mush, dk ? '#9FFFE8' : '#F6E6C8');
  stk(mid, 's', liana, dk ? '#2A2A22' : '#6E5A40', ph ? 3 : 4.5);
  // giant leaves framing the view: monsteras hanging from the top left, banana leaves from the right, a bank of leaves and ferns along the bottom
  var LV = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', L: [], tips: []}, slots = [['a', 'b'], ['c', 'd'], ['e', 'f']];
  (ph ? [[-0.04, -0.03, 62, 0.9], [0.1, -0.04, 88, 0.72], [0.24, -0.05, 76, 0.5]] : [[-0.03, -0.04, 58, 0.95], [0.05, -0.06, 78, 0.85], [0.13, -0.06, 96, 0.66], [0.21, -0.06, 70, 0.5]]).forEach(function (q, j) { var sl = slots[j % 2 ? 0 : 1]; n1_leaf2(LV, sl[0], sl[1], W * q[0], H * q[1], H * 0.32 * q[3] * (ph ? 1.15 : 1), H * 0.15 * q[3] * (ph ? 1.15 : 1), q[2], 0.07, true); });
  (ph ? [[1.05, 0.0, 165, 0.85], [1.06, 0.1, 195, 0.65]] : [[1.03, -0.02, 152, 1], [1.04, 0.07, 172, 0.85], [1.03, 0.18, 198, 0.6]]).forEach(function (q, j) { var sl = slots[j % 2 ? 2 : 1]; n1_banana(LV, sl[0], sl[1], W * q[0], H * q[1], W * 0.26 * q[3] * (ph ? 2 : 1), H * 0.065 * q[3] * (ph ? 1.1 : 1), q[2], -0.08, rnd); });
  (ph ? [[0.62, 1.02, -100, 1], [0.38, 1.03, -78, -1], [0.92, 1.02, -128, 1]] : [[0.24, 1.03, -66, -1], [0.75, 1.04, -108, 1], [0.6, 1.05, -88, 1], [0.38, 1.05, -94, -1], [0.5, 1.04, -78, -1], [0.88, 1.03, -120, 1]]).forEach(function (q) { n1_fern(LV, 'h', W * q[0], H * q[1], H * (ph ? 0.2 : 0.25), q[2], q[3]); });
  var nb = ph ? 7 : 14; for (var bi = 0; bi < nb; bi++) { var u = bi / (nb - 1), bxp = -W * 0.03 + u * W * 1.06 + (rnd() - 0.5) * W * 0.03, edge = Math.min(u, 1 - u), sz = (ph ? 0.15 : 0.2) * (1.2 - edge * 1.1) + rnd() * 0.04, sl = slots[bi % 3];
    n1_leaf2(LV, sl[0], sl[1], bxp, H + 14, H * sz, H * sz * 0.48, -90 + (u - 0.5) * 70 + (rnd() - 0.5) * 30, -0.06 * (u < 0.5 ? -1 : 1), bi % 4 === 1); }
  add(near, 'a', LV.a, dk ? '#0E3A2C' : '#2A7A4C'); add(near, 'b', LV.b, dk ? '#12463A' : '#3A8E58'); add(near, 'c', LV.c, dk ? '#134838' : '#3C9A58'); add(near, 'd', LV.d, dk ? '#185642' : '#56B266');
  add(near, 'e', LV.e, dk ? '#185A44' : '#5DB45A'); add(near, 'f', LV.f, dk ? '#1E6A50' : '#7FCB64'); add(near, 'h', LV.h, dk ? '#16503E' : '#4FA457');
  stk(near, 's', n1_veins(LV), dk ? 'rgba(90,170,130,0.28)' : 'rgba(220,250,200,0.38)', ph ? 1 : 1.4);
  if (ANIM) {
    ANIM.tips = LV.tips.filter(function (p) { return p[0] > 4 && p[0] < W - 4 && p[1] > 4 && p[1] < H - 4; });
    ANIM.fall = {x: wx, top: cT, bot: cB, w: ww}; ANIM.moon = [mx, my, mr]; ANIM.S = S * (ph ? 0.85 : 1);
    var perch = []; [[B1.top, 0.2, 0.8], [B2.top, 0.35, 0.92]].forEach(function (q, bi) { for (var j = 0; j < 4; j++) { var p = q[0][Math.floor((q[0].length - 1) * (q[1] + (q[2] - q[1]) * j / 3))]; perch.push({x: p[0], y: p[1] + 2, b: bi}); } }); ANIM.perch = perch;
    // tree frogs sit on the branches, clear of the toucan's perches; the upper branch also hides what passes behind it (waterfall, rainbow)
    ANIM.frogs = [B2.top[Math.floor((B2.top.length - 1) * 0.24)], B1.top[Math.floor((B1.top.length - 1) * 0.035)]].map(function (p) { return [p[0], p[1] + 3]; });
    ANIM.occ = B1.body + moss1; ANIM.occL = {d: liana1, w: ph ? 3 : 4.5};
    ANIM.vines = []; for (i = 0; i < (ph ? 4 : 7); i++) ANIM.vines.push({x: W * (ph ? 0.18 + i * 0.22 : 0.3 + i * 0.075) + (rnd() - 0.5) * 20, L: H * (0.18 + rnd() * 0.22), ph: rnd() * 6.28});
    ANIM.mush = mushSpots;
  } else {
    var vn = ''; for (i = 0; i < (ph ? 4 : 7); i++) { var vx = W * (ph ? 0.18 + i * 0.22 : 0.3 + i * 0.075), vl = H * (0.2 + (i % 3) * 0.08); vn += 'M' + PT(vx, -10) + ' Q' + PT(vx + 10, vl * 0.5) + ' ' + PT(vx - 4, vl) + ' '; }
    stk(near, 't', vn, dk ? '#1E5A40' : '#4E9A48', ph ? 2 : 3);
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// =============== 3. Tide Pools: a rocky shore at low tide with clear little pools full of anemones, kelp and barnacles
// an irregular closed outline around an ellipse
function n1_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return n1_smooth(p, 3); }
function n1_star5(x, y, R, r, ang) { var p = []; for (var i = 0; i < 10; i++) { var a = ang + i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r : R; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return n1_P(n1_smooth(p, 2)); }
SCENES.tidepool = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.5), refl = Lay(0.8), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, j;
  var hz = H * (ph ? 0.33 : 0.34);
  var sky = dk ? 'linear-gradient(180deg,#1A2B44 0%,#22385A 45%,#2C4462 75%,#4A5A6E 100%)' : 'linear-gradient(180deg,#A8D8E8 0%,#C6E6EE 45%,#E6F3F2 80%,#E9DCC6 100%)';
  var sea = dk ? 'linear-gradient(180deg,#2A4A6E 0%,#1E3A5A 40%,#1A3252 100%)' : 'linear-gradient(180deg,#6FB8D6 0%,#4FA6C8 40%,#3E94B8 100%)';
  var sx = W * (ph ? 0.28 : 0.24), sy = H * (ph ? 0.1 : 0.12), sr = ph ? 20 : 28;
  if (dk) { add(far, 'a', n1_C(sx, sy, sr * 2.3), 'rgba(210,225,255,0.13)'); add(far, 'c', n1_C(sx, sy, sr), '#F2F0E0');
    var st = ''; spread(0, 0, W, hz - 10, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - sx, c.y - sy) > sr * 2) st += n1_C(c.x, c.y, 0.5 + c.r); }); add(far, 'b', st, 'rgba(255,250,236,0.85)'); }
  else { add(far, 'a', n1_C(sx, sy, sr * 1.9), 'rgba(255,252,236,0.45)'); add(far, 'c', n1_C(sx, sy, sr), 'rgba(255,253,244,1)');
    var cl = ''; spread(0, H * 0.04, W, H * 0.2, ph ? 190 : 320, 100, rnd, 0.8).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - sx, c.y - sy) > 90) { var s = 0.7 + c.r * 0.6; cl += n1_E(c.x, c.y, 62 * s, 12 * s) + n1_C(c.x - 18 * s, c.y - 8 * s, 17 * s) + n1_C(c.x + 15 * s, c.y - 12 * s, 22 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.88)'); }
  // distant headland and sea stacks
  var hl = n1_fn(-60, W * (ph ? 0.3 : 0.22), 10, function (x) { var u = (x + 60) / (W * (ph ? 0.3 : 0.22) + 60); return hz - H * 0.07 * Math.pow(1 - u, 0.6) - Math.sin(x / 30) * 2; });
  var stacks = n1_P(hl.concat([[W * (ph ? 0.3 : 0.22), hz + 2], [-60, hz + 2]]));
  [[0.78, 0.13, 0.05], [0.87, 0.075, 0.032], [0.92, 0.04, 0.02]].forEach(function (q) { var x = W * q[0], h = H * q[1], w = W * q[2] * (ph ? 1.4 : 1); stacks += n1_P([[x - w, hz + 2], [x - w * 0.8, hz - h * 0.6], [x - w * 0.55, hz - h], [x + w * 0.3, hz - h * 0.96], [x + w * 0.75, hz - h * 0.55], [x + w, hz + 2]]); });
  add(far, 'd', stacks, dk ? '#2C3A56' : '#7E98A8');
  var sh = ''; [[0.78, 0.13, 0.05], [0.87, 0.075, 0.032]].forEach(function (q) { var x = W * q[0], h = H * q[1], w = W * q[2] * (ph ? 1.4 : 1); sh += n1_P([[x + w * 0.1, hz + 2], [x + w * 0.3, hz - h * 0.96], [x + w * 0.75, hz - h * 0.55], [x + w, hz + 2]]); });
  add(far, 'e', sh, dk ? 'rgba(10,20,40,0.35)' : 'rgba(60,90,110,0.3)');
  // sea: glitter path and wave lines
  var gl = '', wl = '';
  for (i = 0; i < 26; i++) { var gy = hz + 6 + i * i * 0.5 * (ph ? 0.6 : 1), gw = 6 + i * 2.2; if (gy > H * 0.55) break; gl += n1_E(sx + (rnd() - 0.5) * gw * 2, gy, gw * (0.4 + rnd() * 0.6), 1.3); }
  add(refl, 'b', gl, dk ? 'rgba(240,240,220,0.4)' : 'rgba(255,255,240,0.75)');
  spread(0, hz + 8, W, H * 0.2, ph ? 50 : 70, 16, rnd, 1).forEach(function (c) { if (c.q < 0.5) { var w = 8 + (c.y - hz) * 0.2; wl += 'M' + PT(c.x - w, c.y) + ' q' + n1(w / 2) + ' ' + n1(-w * 0.18) + ' ' + n1(w) + ' 0 '; } });
  stk(refl, 's', wl, dk ? 'rgba(170,200,240,0.3)' : 'rgba(255,255,255,0.55)', 1.4);
  // the rock shelf: a back ridge of rocks, then the broad shelf with pools
  var shelfY = H * (ph ? 0.5 : 0.52), shelf = n1_fn(-60, W + 60, 10, function (x) { return shelfY + Math.sin(x / 90 + 0.6) * 10 + Math.sin(x / 37) * 4; });
  add(mid, 'a', below(shelf, H + 20), dk ? '#363A54' : '#776C66');
  var rocks = '', rockHi = '', shad = '', alg = '', rmask = '';
  function rock(x, y, rx, ry) { var rp = n1_P(n1_blob(x, y, rx, ry, rnd, 10, 0.16)); rocks += rp; if (y - ry < shelfY + H * 0.1) rmask += rp; shad += n1_P(n1_blob(x + rx * 0.08, y + ry * 0.35, rx * 1.02, ry * 0.85, rnd, 10, 0.1)); rockHi += n1_P(n1_blob(x - rx * 0.12, y - ry * 0.34, rx * 0.66, ry * 0.4, rnd, 8, 0.12));
    if (rnd() < 0.45) alg += n1_P(n1_blob(x + rx * (rnd() - 0.5) * 0.8, y + ry * 0.1, rx * (0.2 + rnd() * 0.25), ry * 0.22, rnd, 8, 0.3)); }
  spread(-40, shelfY - H * 0.02, W + 80, H * 0.09, ph ? 70 : 110, 40, rnd, 1).forEach(function (c) { var rx = (ph ? 40 : 66) * (0.7 + c.r * 0.6); rock(c.x, c.y, rx, rx * (0.45 + c.k * 0.2)); });
  spread(-40, shelfY + H * 0.06, W + 80, H * 0.42, ph ? 80 : 130, ph ? 60 : 78, rnd, 1).forEach(function (c) { if (c.q < 0.85) { var rx = (ph ? 46 : 80) * (0.7 + c.r * 0.6); rock(c.x, c.y, rx, rx * (0.36 + c.k * 0.12)); } });
  add(mid, 'b', shad, dk ? 'rgba(14,16,36,0.45)' : 'rgba(60,44,50,0.3)'); add(mid, 'c', rocks, dk ? '#454A68' : '#8E8178'); add(mid, 'd', rockHi, dk ? '#555C7C' : '#A89A8E');
  add(mid, 'e', alg, dk ? '#3A5E4A' : '#7DB45A');
  // the pools
  var pools = ph ? [[0.42, 0.875, 0.38, 0.06], [0.78, 0.735, 0.18, 0.035], [0.14, 0.7, 0.12, 0.028]] : [[0.36, 0.865, 0.19, 0.085], [0.76, 0.83, 0.13, 0.06], [0.1, 0.7, 0.075, 0.035], [0.9, 0.64, 0.06, 0.025]];
  var pw = '', pl = '', pf = '', rimB = '', rimF = '', rimHi = '', P = [];
  pools.forEach(function (q, k) { var cx = W * q[0], cy = H * q[1], rx = W * q[2], ry = H * q[3], out = n1_blob(cx, cy, rx, ry, rnd, 12, 0.08);
    P.push({cx: cx, cy: cy, rx: rx, ry: ry});
    rimB += n1_P(n1_blob(cx, cy - ry * 0.05, rx * 1.12, ry * 1.32, rnd, 12, 0.06));
    pw += n1_P(out); pl += n1_P(n1_blob(cx - rx * 0.08, cy + ry * 0.1, rx * 0.8, ry * 0.65, rnd, 10, 0.1));
    for (j = 0; j < Math.round(rx / 9); j++) { var a = rnd() * 6.28, rr = Math.sqrt(rnd()) * 0.85, px = cx + Math.cos(a) * rx * rr, py = cy + Math.sin(a) * ry * rr; pf += n1_E(px, py, (2 + rnd() * 4) * S, (1.2 + rnd() * 2) * S); }
    // the near lip of the pool, in front of the water
    var inner = [], outer = []; for (j = 0; j <= 16; j++) { var t = j / 16 * Math.PI; inner.push([cx + Math.cos(t) * rx * 1.0, cy + Math.sin(t) * ry * 0.92]); outer.unshift([cx + Math.cos(t) * rx * 1.08, cy + Math.sin(t) * ry * 1.25 + 4 + Math.sin(j * 1.7) * 2]); }
    rimF += n1_P(inner.concat(outer)); rimHi += n1_P(inner.slice(2, 15).map(function (p) { return [p[0], p[1] + 1]; }).concat(inner.slice(2, 15).reverse().map(function (p, m) { return [p[0], p[1] + 3.5 + Math.sin(m) * 1]; }))); });
  add(mid, 'f', rimB, dk ? '#2A2C48' : '#5A4E50');
  add(mid, 'g', pw, dk ? '#2E5E84' : '#5CC2D0'); add(mid, 'h', pl + pf, dk ? '#3A7098' : '#8ED8DE');
  // sea stars and urchins on the pool floors
  var stars = '', urch = '', starsB = '';
  P.forEach(function (p, k) { var n = k === 0 ? (ph ? 2 : 3) : 1; for (j = 0; j < n; j++) { var a = -0.4 + j * 2.1 + k, x = p.cx + Math.cos(a) * p.rx * 0.6, y = p.cy + Math.sin(a) * p.ry * 0.5, R = (ph ? 9 : 13) * S * (0.8 + rnd() * 0.4); if (j % 2) starsB += n1_star5(x, y, R, R * 0.42, rnd()); else stars += n1_star5(x, y, R, R * 0.42, rnd()); }
    if (k < 2) { var ux = p.cx - p.rx * 0.55, uy = p.cy + p.ry * 0.15, ur = (ph ? 7 : 10) * S, sp = ''; for (j = 0; j < 16; j++) { var b = j / 16 * 6.283; sp += n1_P([[ux + Math.cos(b - 0.12) * ur * 0.8, uy + Math.sin(b - 0.12) * ur * 0.6], [ux + Math.cos(b) * ur * 1.6, uy + Math.sin(b) * ur * 1.2], [ux + Math.cos(b + 0.12) * ur * 0.8, uy + Math.sin(b + 0.12) * ur * 0.6]]); } urch += sp + n1_E(ux, uy, ur, ur * 0.78); } });
  // on the pool floors: drawn by the engine under the anemones and the fish (or here, in the still picture)
  var starC = dk ? '#D8784A' : '#F2884A', urchC = dk ? '#8A5AB8' : '#9E62CC';
  if (!ANIM) { add(near, 'g', stars, starC); add(near, 'h', starsB + urch, urchC); }
  // the lips of the pools, barnacles, mussels and rockweed
  add(near, 'a', rimF, dk ? '#3A3E5C' : '#7A6E68'); add(near, 'b', rimHi, dk ? '#565C80' : '#A89A8E');
  var barn = '', barnD = '', mus = '', weed = '', shells = '';
  function barnacles(x, y, n, s) { for (var m = 0; m < n; m++) { var bx = x + (rnd() - 0.5) * 30 * s, by = y + (rnd() - 0.5) * 10 * s, br = (2 + rnd() * 2.2) * s; barn += n1_P([[bx - br, by + br * 0.5], [bx - br * 0.5, by - br * 0.6], [bx + br * 0.5, by - br * 0.6], [bx + br, by + br * 0.5]]); barnD += n1_E(bx, by - br * 0.45, br * 0.32, br * 0.18); } }
  function mussels(x, y, n, s) { for (var m = 0; m < n; m++) mus += n1_RE(x + (m - n / 2) * 6 * s + rnd() * 3, y + rnd() * 4 * s, 6 * s, 2.8 * s, -60 + rnd() * 50); }
  function rockweed(x, y, s, dir) { for (var m = 0; m < 6; m++) weed += n1_leaf(x + m * 3 * s * dir, y, (14 + rnd() * 10) * s, 3 * s, -90 + dir * (30 + m * 14) + (rnd() - 0.5) * 20); }
  P.forEach(function (p, k) { var s = (ph ? 0.8 : 1.2) * S; barnacles(p.cx - p.rx * 0.7, p.cy + p.ry * 1.05, 8, s); barnacles(p.cx + p.rx * 0.5, p.cy + p.ry * 1.1, 6, s); mussels(p.cx + p.rx * 0.95, p.cy + p.ry * 0.5, 4, s); rockweed(p.cx - p.rx * 1.05, p.cy + p.ry * 0.6, s, 1); if (k < 2) rockweed(p.cx + p.rx * 0.2, p.cy + p.ry * 1.15, s * 0.8, -1); });
  spread(0, shelfY + H * 0.04, W, H * 0.12, ph ? 90 : 140, 40, rnd, 1).forEach(function (c) { if (c.q < 0.5) barnacles(c.x, c.y, 5, (ph ? 0.7 : 1) * S); else if (c.q < 0.7) mussels(c.x, c.y, 3, (ph ? 0.7 : 1) * S); });
  [[0.06, 0.95], [0.6, 0.97], [0.95, 0.93], [0.24, 0.78]].forEach(function (q) { var x = W * q[0], y = H * q[1], s = (ph ? 0.8 : 1.2) * S; shells += 'M' + PT(x - 8 * s, y) + ' a' + n1(8 * s) + ' ' + n1(7 * s) + ' 0 0 1 ' + n1(16 * s) + ' 0 Z ' + rect(x - 2.5 * s, y, 5 * s, 3 * s); });
  add(near, 'c', barn + shells, dk ? '#A8AAC4' : '#E6E0D6'); add(near, 'd', mus, dk ? '#22264A' : '#2E3654'); add(near, 'e', weed, dk ? '#4E6A3A' : '#8A8A2E');
  add(near, 'f', barnD, dk ? '#2A2E4E' : '#6E6470');
  // anemones and kelp spots (drawn by the engine, or still here)
  var anem = [], kelp = [];
  P.forEach(function (p, k) { var n = [ph ? 4 : 5, 3, 2, 1][k], m; for (m = 0; m < n; m++) { var a = (m + 0.5) / n * Math.PI * 2 + rnd() * 0.5, rr = n === 1 ? 0 : 0.35 + rnd() * 0.3; var ar = Math.min((ph ? 18 : 30) * S * (k ? 0.85 : 1) * (0.8 + rnd() * 0.4), p.ry * 1.05); anem.push({x: p.cx + Math.cos(a) * p.rx * rr * 0.9, y: p.cy + Math.sin(a) * p.ry * rr * 0.6 + p.ry * 0.12, r: ar, c: Math.floor(rnd() * 4), pool: k}); }
    if (k < 2) for (m = 0; m < (k ? 2 : 3); m++) kelp.push({x: p.cx + p.rx * (-0.2 + m * 0.3) + rnd() * 10, y: p.cy + p.ry * 0.3, L: (ph ? 30 : 46) * S * (0.8 + rnd() * 0.4), pool: k, ph: rnd() * 6.28}); });
  anem.sort(function (a, b) { return a.y - b.y; });
  if (ANIM) { ANIM.floor = [[stars, starC], [starsB + urch, urchC]]; ANIM.rmask = rmask; ANIM.pools = P; ANIM.anem = anem; ANIM.kelp = kelp; ANIM.shelf = shelfY; ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.sun = [sx, sy]; ANIM.crab = {x0: W * (ph ? 0.55 : 0.6), x1: W * (ph ? 0.92 : 0.96), y: H * (ph ? 0.96 : 0.955)}; }
  else { var ad = '', at = ''; anem.forEach(function (q) { ad += n1_E(q.x, q.y, q.r * 0.3, q.r * 0.2); for (var m = 0; m < 12; m++) { var b = m / 12 * 6.283; at += seg(q.x, q.y, q.x + Math.cos(b) * q.r, q.y + Math.sin(b) * q.r * 0.6); } }); stk(near, 't', at, dk ? '#E07AB0' : '#FF8AB8', 3 * S); add(near, 'h', ad); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: sea}};
};

// =============== 4. Volcano Island: a friendly little volcano on a tropical island, with palms, black sand and steaming vents
// a curved palm trunk from (x0,y0) to (x1,y1), as a tapered band, plus its ring marks
function n1_trunk(x0, y0, x1, y1, bend, w0, w1) { var L = [], R = [], rings = '', n = 16; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = (x1 - x0) + Math.cos(Math.PI * u) * Math.PI * bend, dy = y1 - y0, dl = Math.hypot(dx, dy), w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); if (i % 1 === 0 && i > 0 && i < n) rings += seg(x - dy / dl * w * 0.9, y + dx / dl * w * 0.9 + 2, x + dy / dl * w * 0.9, y - dx / dl * w * 0.9 + 2); } return {d: n1_P(L.concat(R.reverse())), rings: rings}; }
// a palm frond: a curved rib with leaflets, from (x,y) at angle a (radians), length L, droop d
function n1_frondPts(x, y, a, L, d) { var rib = [], i; for (i = 0; i <= 10; i++) { var u = i / 10, aa = a + d * u * u; rib.push([x + Math.cos(aa) * L * u, y + Math.sin(aa) * L * u + d * 0.3 * L * u * u]); } return rib; }
function n1_frond(x, y, a, L, d) { var rib = n1_frondPts(x, y, a, L, d), out = '', i; for (i = 1; i < rib.length; i++) { var p = rib[i - 1], q = rib[i], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, u = i / 10, w = L * 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 1;
    out += n1_P([[p[0], p[1]], [q[0] + (-dy / dl) * w * 0.3 + dx * 0.6, q[1] + (dx / dl) * w * 0.3 + dy * 0.6 + w * 0.9], [q[0], q[1]]]) + n1_P([[p[0], p[1]], [q[0] - (-dy / dl) * w * 0.3 + dx * 0.6, q[1] - (dx / dl) * w * 0.3 + dy * 0.6 + w * 0.2], [q[0], q[1]]]); }
  return out; }
SCENES.volcano = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.5), refl = Lay(0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i;
  var hz = H * (ph ? 0.5 : 0.52);
  var sky = dk ? 'linear-gradient(180deg,#26142A 0%,#3A1A30 34%,#4A1F33 60%,#8A3A35 100%)' : 'linear-gradient(180deg,#F7C9A0 0%,#F9D8B4 30%,#FBE6C8 62%,#BFE3D9 100%)';
  var sea = dk ? 'linear-gradient(180deg,#5A2A3A 0%,#2E1A34 35%,#1E1430 100%)' : 'linear-gradient(180deg,#8ED8D2 0%,#5EC0C6 40%,#3EA2B6 100%)';
  var sx = W * (ph ? 0.22 : 0.18), sy = H * (ph ? 0.12 : 0.14), sr = ph ? 22 : 32;
  if (dk) { add(far, 'a', n1_C(sx, sy, sr * 2), 'rgba(255,200,200,0.1)'); add(far, 'c', n1_C(sx, sy, sr * 0.8), '#FBE8D8');
    var st = ''; spread(0, 0, W, hz * 0.8, 36, 36, rnd, 1).forEach(function (c) { if (c.q < 0.45 && Math.hypot(c.x - sx, c.y - sy) > sr * 2) st += n1_C(c.x, c.y, 0.5 + c.r); }); add(far, 'b', st, 'rgba(255,236,226,0.8)'); }
  else { add(far, 'a', n1_C(sx, sy, sr * 2.1), 'rgba(255,248,220,0.5)'); add(far, 'c', n1_C(sx, sy, sr), '#FFF6DE');
    var cl = ''; spread(0, H * 0.04, W, H * 0.24, ph ? 190 : 320, 100, rnd, 0.8).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - sx, c.y - sy) > 100) { var s = 0.7 + c.r * 0.6; cl += n1_E(c.x, c.y, 62 * s, 13 * s) + n1_C(c.x - 18 * s, c.y - 9 * s, 18 * s) + n1_C(c.x + 15 * s, c.y - 13 * s, 23 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.85)'); }
  // a distant island at the left
  var di = n1_fn(-60, W * (ph ? 0.35 : 0.3), 8, function (x) { var u = (x + 60) / (W * (ph ? 0.35 : 0.3) + 60); return hz - H * 0.05 * Math.sin(Math.PI * Math.min(1, u * 1.1)) - 2; });
  add(far, 'd', n1_P(di.concat([[W * (ph ? 0.35 : 0.3), hz + 2], [-60, hz + 2]])), dk ? '#3A2038' : '#8FBFA8');
  var dp = ''; [0.06, 0.12, 0.19].forEach(function (f) { var x = W * f, y = n1_yOn(di, x); dp += rect(x - 1, y - 18 * S, 2, 18 * S); for (var k = 0; k < 5; k++) dp += n1_leaf(x, y - 18 * S, 12 * S, 2.4 * S, -170 + k * 40); }); add(far, 'e', dp, dk ? '#2E1A30' : '#6FA48C');
  // the volcano
  var vx = W * (ph ? 0.6 : 0.64), top = H * (ph ? 0.2 : 0.15), base = hz + 4, hw = W * (ph ? 0.6 : 0.34), rimW = hw * 0.11;
  function coneY(x) { var u = Math.min(1, Math.abs(x - vx) / hw); if (u < rimW / hw) return top + 3 + Math.pow(u / (rimW / hw), 2) * -3; var v = (u - rimW / hw) / (1 - rimW / hw); return top + (base - top) * (1 - Math.pow(1 - v, 2.1)) + Math.sin(x / 23) * 1.5; }
  var outline = n1_fn(vx - hw - 10, vx + hw + 10, 6, coneY);
  var foot = n1_fn(vx + hw + 10, vx - hw - 10, -8, function (x) { var u = (x - (vx - hw - 10)) / (2 * hw + 20); return base + 2 + Math.sin(Math.PI * u) * 7 * S; });
  foot = []; for (var fx = vx + hw + 14; fx >= vx - hw - 14; fx -= 8) { var fu = (fx - (vx - hw - 14)) / (2 * hw + 28); foot.push([fx, base + 1 + Math.sin(Math.PI * fu) * 8 * S]); }
  outline = [[vx - hw - 14, base + 1]].concat(outline, [[vx + hw + 14, base + 1]]);
  add(refl, 'a', n1_P(outline.concat(foot)), dk ? '#46263A' : '#B08470');
  var shade = n1_P(outline.filter(function (p) { return p[0] >= vx + rimW * 0.4; }).concat(foot.filter(function (p) { return p[0] >= vx + rimW * 0.4; })));
  add(refl, 'b', shade, dk ? 'rgba(20,8,20,0.3)' : 'rgba(110,60,50,0.22)');
  // jungle on the lower slopes
  function treeY(x) { return top + (base - top) * (0.5 + 0.06 * Math.sin(x / 70 + 1)) - Math.abs(Math.sin(x / (ph ? 9 : 13))) * 7 * S; }
  var jg = n1_fn(vx - hw - 10, vx + hw + 10, 4, function (x) { return Math.max(coneY(x), treeY(x)); });
  jg = [[vx - hw - 14, base + 1]].concat(jg, [[vx + hw + 14, base + 1]]);
  add(refl, 'c', n1_P(jg.concat(foot)), dk ? '#24302E' : '#5FA86A');
  add(refl, 'h', n1_P(foot.map(function (p) { return [p[0], p[1] - 4 * S - 1]; }).concat(foot.slice().reverse())), dk ? '#5A3A40' : '#E8D2A6');
  var jh = ''; spread(vx - hw, top + (base - top) * 0.5, hw * 2, (base - top) * 0.5, ph ? 22 : 30, 16, rnd, 1).forEach(function (c) { if (c.y > Math.max(coneY(c.x), treeY(c.x)) + 6 && c.y < base - 8 && c.q < 0.6) jh += n1_C(c.x, c.y, (ph ? 5 : 8) + c.r * 5); });
  add(refl, 'd', jh, dk ? '#2C3A36' : '#78BC74');
  // gullies, the crater, vents and lava channels
  var gul = ''; for (i = -4; i <= 4; i++) { if (!i) continue; var x0 = vx + i * rimW * 0.45, x1 = vx + i * hw * 0.085, y0 = coneY(x0) + 8, y1 = Math.max(coneY(x1) + 10, treeY(x1) - 6); if (y1 > y0 + 10) gul += 'M' + PT(x0, y0) + ' Q' + PT((x0 + x1) / 2 + i * 2, (y0 + y1) / 2 + 4) + ' ' + PT(x1, y1) + ' '; }
  stk(refl, 's', gul, dk ? 'rgba(120,60,70,0.4)' : 'rgba(220,170,140,0.6)', ph ? 1.6 : 2.4);
  var crater = n1_E(vx, top + 3, rimW * 0.92, 5 * S + 2), vents = [], ventD = '';
  [[-0.42, 0.42], [0.36, 0.38], [0.22, 0.62]].forEach(function (q) { var x = vx + q[0] * hw, y = coneY(x) + (base - coneY(x)) * q[1]; vents.push([x, y]); ventD += n1_E(x, y, 7 * S + 2, 2.6 * S + 1); });
  add(refl, 'e', crater + ventD, dk ? '#2A1220' : '#6E4A42');
  var lava = [], lavaD = ''; [[-0.5, -0.16, 0.42], [0.4, 0.14, 0.4], [0.0, 0.03, 0.3]].forEach(function (q) { var pts = [], n = 18; for (var k = 0; k <= n; k++) { var u = k / n, x = vx + q[0] * rimW + (q[1] * hw) * u + Math.sin(u * 7 + q[0] * 5) * 8 * S, y = coneY(vx + q[0] * rimW) + 2 + (base - top) * q[2] * u; y = Math.max(y, coneY(x) + 3); if (y < treeY(x) + 4) pts.push([x, y]); } lava.push(pts); lavaD += pline(pts); });
  stk(refl, 't', lavaD, dk ? '#7A2A26' : 'rgba(80,50,50,0.35)', (ph ? 2.4 : 4) * S + 1);
  // clouds hugging the volcano
  var vc = ''; if (!dk) [[vx - hw * 0.62, top + (base - top) * 0.3, 1], [vx + hw * 0.7, top + (base - top) * 0.2, 0.8]].forEach(function (q) { var s = q[2] * (ph ? 0.7 : 1.1); vc += n1_E(q[0], q[1], 54 * s, 10 * s) + n1_C(q[0] - 14 * s, q[1] - 6 * s, 14 * s) + n1_C(q[0] + 12 * s, q[1] - 9 * s, 18 * s); });
  add(refl, 'g', vc, 'rgba(255,255,255,0.9)');
  // darker reef patches and paler shallows break up the open sea
  var reef = ''; spread(0, hz + H * 0.05, W, H * 0.17, ph ? 160 : 260, H * 0.06, rnd, 0.9).forEach(function (c) { if (c.q < 0.45 && Math.abs(c.x - sx) > W * 0.06) { var rw = (ph ? 30 : 60) * (0.6 + c.r * 0.8); reef += n1_E(c.x, c.y, rw, rw * 0.09) + n1_E(c.x + rw * 0.5, c.y + rw * 0.05, rw * 0.5, rw * 0.06); } });
  add(refl, 'f', reef, dk ? 'rgba(20,10,30,0.22)' : 'rgba(30,120,140,0.16)');
  // the sea glitter and the black sand beach
  var gl = ''; for (i = 0; i < 24; i++) { var gy = hz + 5 + i * i * 0.45 * (ph ? 0.6 : 1), gw = 6 + i * 2.2; if (gy > H * 0.74) break; gl += n1_E(sx + (rnd() - 0.5) * gw * 2, gy, gw * (0.4 + rnd() * 0.6), 1.3); }
  if (dk) { for (i = 0; i < 20; i++) { var ly = hz + 4 + i * i * 0.4, lw = 8 + i * 2; if (ly > H * 0.74) break; gl += n1_E(vx + (rnd() - 0.5) * lw * 2, ly, lw * (0.4 + rnd() * 0.6), 1.3); } }
  add(mid, 'a', gl, dk ? 'rgba(255,150,100,0.45)' : 'rgba(255,255,240,0.75)');
  var by = H * (ph ? 0.8 : 0.78), beach = n1_fn(-60, W + 60, 8, function (x) { return by + Math.sin(x / 140 + 0.5) * 12 + Math.sin(x / 47) * 3; });
  add(mid, 'b', below(beach, H + 20), dk ? '#221822' : '#4A4244');
  var wet = n1_P(beach.concat(beach.slice().reverse().map(function (p) { return [p[0], p[1] + H * 0.035]; }))); add(mid, 'c', wet, dk ? '#2A1E2A' : '#4E4648');
  var sp = ''; spread(0, by + H * 0.04, W, H - by, 18, 12, rnd, 1).forEach(function (c) { if (c.q < 0.4) sp += n1_C(c.x, c.y, 0.7 + c.r * 0.9); }); add(mid, 'd', sp, dk ? 'rgba(255,190,160,0.2)' : 'rgba(200,190,190,0.35)');
  var vine = '', vfl = ''; [[0.02, 0.3], [0.62, 0.9]].forEach(function (q) { for (var x = W * q[0]; x < W * q[1]; x += (ph ? 22 : 36) * (0.6 + rnd() * 0.8)) { var y = n1_yOn(beach, x) + H * (0.05 + rnd() * 0.06); for (var m = 0; m < 6; m++) vine += n1_leaf(x + (rnd() - 0.5) * 20 * S, y + (rnd() - 0.5) * 8 * S, (ph ? 9 : 14) * S, (ph ? 4 : 6) * S, rnd() * 360); if (rnd() < 0.6) vfl += n1_C(x + (rnd() - 0.5) * 12 * S, y - 3 * S, (ph ? 3.5 : 5) * S); } });
  var rmask = '';
  var rk = '', rkh = ''; [[0.3, 0.012, 0.035], [0.36, 0.008, 0.02], [0.52, 0.02, 0.03], [0.78, 0.0, 0.04], [0.84, 0.01, 0.022]].forEach(function (q) { var x = W * q[0], y = n1_yOn(beach, x) + H * q[1], r = W * q[2] * (ph ? 1.6 : 1); var rkp = n1_P(n1_blob(x, y, r, r * 0.5, rnd, 9, 0.2)); rk += rkp; rmask += rkp; rkh += n1_P(n1_blob(x - r * 0.15, y - r * 0.2, r * 0.55, r * 0.2, rnd, 7, 0.15)); });
  add(mid, 'e', rk, dk ? '#160E16' : '#2A2426'); add(mid, 'f', rkh, dk ? '#3A2630' : '#5A5052'); add(mid, 'g', vine, dk ? '#22382A' : '#4E9A4E'); add(mid, 'h', vfl, dk ? '#B88AD8' : '#E9A8F0');
  // palms and flowering bushes in front
  var palms = ph ? [[0.02, 0.12, 0.42, 30], [0.98, 0.84, 0.5, -26]] : [[0.05, 0.15, 0.36, 46], [-0.01, 0.05, 0.5, 22], [0.98, 0.9, 0.42, -34]], tr = '', rings = '', crowns = [];
  palms.forEach(function (q) { var x0 = W * q[0], x1 = W * q[1], y1 = H * q[2], T = n1_trunk(x0, H + 20, x1, y1, q[3] * S, (ph ? 9 : 14) * S, (ph ? 5 : 8) * S); tr += T.d; rings += T.rings; crowns.push({x: x1, y: y1, L: (ph ? 70 : 120) * S, ph: rnd() * 6.28}); });
  add(near, 'a', tr, dk ? '#4A3036' : '#9A7452'); stk(near, 's', rings, dk ? 'rgba(20,10,16,0.5)' : 'rgba(90,60,40,0.45)', ph ? 1.2 : 2);
  var bl = '', bl2 = '', fl = '', fc = '';
  function bush(x, y, s) { for (var k = 0; k < 9; k++) { var a = -170 + k * 20 + (rnd() - 0.5) * 12; var lf = n1_leaf(x + (rnd() - 0.5) * 10 * s, y, (30 + rnd() * 18) * s, 9 * s, a); if (k % 2) bl += lf; else bl2 += lf; } for (k = 0; k < 3; k++) { var fx = x + (k - 1) * 22 * s + (rnd() - 0.5) * 8, fy = y - (22 + rnd() * 16) * s, fr = 8 * s; for (var m = 0; m < 5; m++) { var b = m / 5 * 6.283 + rnd(); fl += n1_C(fx + Math.cos(b) * fr * 0.6, fy + Math.sin(b) * fr * 0.6, fr * 0.6); } fc += n1_C(fx, fy, fr * 0.28); } }
  (ph ? [[0.1, 1.0, 1.1], [0.5, 1.03, 0.8], [0.9, 1.0, 1.1]] : [[0.08, 1.0, 1.7], [0.22, 1.02, 1.2], [0.4, 1.04, 0.9], [0.62, 1.04, 1.0], [0.8, 1.02, 1.3], [0.95, 1.0, 1.6]]).forEach(function (q) { bush(W * q[0], H * q[1], q[2] * S); });
  add(near, 'b', bl2, dk ? '#1E2E28' : '#3E8A50'); add(near, 'c', bl, dk ? '#26382E' : '#5AA65E'); add(near, 'd', fl, dk ? '#C84A5A' : '#F2486A'); add(near, 'e', fc, dk ? '#E8B060' : '#FFD45A');
  if (ANIM) {
    ANIM.crowns = crowns; ANIM.rmask = rmask; ANIM.lava = lava; ANIM.vents = vents; ANIM.crater = [vx, top + 2, rimW]; ANIM.beach = beach; ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.sun = [sx, sy];
    ANIM.spots = []; for (i = 0; i < 40; i++) { var sgn = i % 2 ? 1 : -1, u = 0.3 + rnd() * 0.6, x = vx + sgn * u * hw * 0.92, yt = Math.max(coneY(x), treeY(x)) + 6; ANIM.spots.push([x, yt + (base - 4 - yt) * rnd() * 0.8]); }
  } else {
    var fr = ''; crowns.forEach(function (c) { for (var k = 0; k < 8; k++) fr += n1_frond(c.x, c.y, -Math.PI + k * Math.PI / 7 - 0.2, c.L * (0.8 + (k % 2) * 0.2), 0.9); });
    add(near, 'h', fr, dk ? '#24442E' : '#4E9A4A');
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near, band: {top: hz, bg: sea}};
};

// =============== 5. Savanna Sunset: golden grassland with flat-topped acacias, a watering hole and a huge low sun
// a tapered limb as a band from (x0,y0) to (x1,y1)
function n1_limb(x0, y0, x1, y1, w0, w1, bend) { var L = [], R = [], n = 8; for (var i = 0; i <= n; i++) { var u = i / n, x = x0 + (x1 - x0) * u + Math.sin(Math.PI * u) * bend, y = y0 + (y1 - y0) * u, dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * u; L.push([x - dy / dl * w, y + dx / dl * w]); R.push([x + dy / dl * w, y - dx / dl * w]); } return n1_P(L.concat(R.reverse())); }
// a flat-topped acacia: trunk forking into limbs under a wide, flat, layered crown
function n1_acacia(x, y, h, w, rnd, out) { var cy = y - h, th = Math.max(3, h * 0.05);
  out.t += n1_limb(x, y + 4, x + w * 0.02, y - h * 0.45, th, th * 0.8, w * 0.03);
  [[-0.38, 0.95], [-0.16, 1.0], [0.12, 0.98], [0.34, 0.94]].forEach(function (q) { out.t += n1_limb(x + w * 0.02, y - h * 0.44, x + w * q[0], cy + h * 0.08 * (1 - q[1]) + h * 0.06, th * 0.75, th * 0.3, q[0] * w * 0.08); });
  var n = 9; for (var i = 0; i < n; i++) { var u = (i + 0.5) / n - 0.5, ex = x + u * w * 1.05 + (rnd() - 0.5) * w * 0.05, ey = cy + Math.abs(u) * h * 0.1 + (rnd() - 0.5) * h * 0.03, rx = w * (0.13 + rnd() * 0.05), ry = h * (0.08 + rnd() * 0.03);
    out.d += n1_E(ex, ey, rx, ry); out.l += n1_E(ex - rx * 0.12, ey - ry * 0.4, rx * 0.78, ry * 0.5); }
  out.d += n1_E(x, cy + h * 0.02, w * 0.5, h * 0.06); }
SCENES.savanna = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.5), refl = Lay(0.8), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i;
  var hz = H * (ph ? 0.56 : 0.6);
  var sky = dk ? 'linear-gradient(180deg,#2A1C3E 0%,#3E2446 30%,#5A2E4A 58%,#B4523E 100%)' : 'linear-gradient(180deg,#F6C878 0%,#F9D68B 28%,#FBE9B9 60%,#E8D59A 100%)';
  var sx = W * (ph ? 0.6 : 0.6), sy = hz - H * (ph ? 0.1 : 0.12), sr = H * (ph ? 0.1 : 0.17);
  if (dk) { var mx = W * (ph ? 0.3 : 0.26), my = H * (ph ? 0.14 : 0.16), mr = ph ? 22 : 34; add(far, 'a', n1_C(mx, my, mr * 2.2), 'rgba(255,230,220,0.12)'); add(far, 'c', n1_C(mx, my, mr), '#FFF2E2');
    var st = ''; spread(0, 0, W, hz * 0.85, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.5 && Math.hypot(c.x - mx, c.y - my) > mr * 2 && c.y < hz * (0.6 + c.r * 0.3)) st += n1_C(c.x, c.y, 0.5 + c.r * 1.1); }); add(far, 'b', st, 'rgba(255,240,230,0.85)');
    add(far, 'f', n1_E(sx, hz, W * 0.5, H * 0.12), 'rgba(255,140,90,0.28)'); }
  else { add(far, 'a', n1_C(sx, sy, sr * 1.55), 'rgba(255,240,190,0.55)'); add(far, 'c', n1_C(sx, sy, sr), '#FFF3C8');
    var cl = ''; spread(0, H * 0.06, W, hz * 0.6, ph ? 220 : 380, 70, rnd, 0.7).forEach(function (c) { if (c.q < 0.6) { var w = (ph ? 70 : 140) * (0.6 + c.r * 0.8); cl += n1_P([[c.x - w, c.y], [c.x - w * 0.6, c.y - 4], [c.x + w * 0.5, c.y - 5], [c.x + w, c.y], [c.x + w * 0.4, c.y + 3], [c.x - w * 0.5, c.y + 3]]); } }); add(far, 'b', cl, 'rgba(255,220,170,0.75)'); }
  // distant hills and the far plain with tiny acacias and a herd
  var hills = n1_fn(-60, W + 60, 10, function (x) { return hz - H * 0.025 - Math.max(0, Math.sin(x / (ph ? 120 : 210) + 2)) * H * 0.04 - (x > W * 0.12 && x < W * 0.3 ? H * 0.035 : 0); });
  add(far, 'd', below(hills, hz + 10), dk ? '#4A2A48' : '#E2B482');
  var fa = '', herd = ''; [0.08, 0.22, 0.38, 0.8, 0.93].forEach(function (f) { var x = W * f, y = hz + 2, h = (ph ? 14 : 22) * (0.7 + rnd() * 0.5); fa += rect(x - 1, y - h, 2, h) + n1_E(x, y - h, h * 0.9, h * 0.2) + n1_E(x + h * 0.2, y - h - 2, h * 0.6, h * 0.16); });
  for (i = 0; i < (ph ? 5 : 9); i++) { var hx = W * (ph ? 0.12 : 0.44) + i * (ph ? 10 : 14) + rnd() * 6, hy = hz + 4, s = (ph ? 0.6 : 0.9) * (0.8 + rnd() * 0.3); herd += n1_E(hx, hy - 6 * s, 6 * s, 3 * s) + rect(hx - 5 * s, hy - 5 * s, 1.4 * s, 5 * s) + rect(hx + 3.5 * s, hy - 5 * s, 1.4 * s, 5 * s) + n1_P([[hx + 4 * s, hy - 8 * s], [hx + 9 * s, hy - 10 * s], [hx + 9.5 * s, hy - 7 * s], [hx + 5 * s, hy - 5 * s]]); }
  add(far, 'e', fa + herd, dk ? '#3A2038' : '#C08A5A');
  // the plain: banded golden grass reaching to the horizon
  add(refl, 'a', below(n1_fn(-60, W + 60, 10, function (x) { return hz + Math.sin(x / 90) * 1.5; }), H + 20), dk ? '#4E2E46' : '#E8C274');
  var bands = ''; for (i = 0; i < 6; i++) { var yb = hz + 6 + i * i * (ph ? 4 : 6) + i * 6; bands += below(n1_fn(-60, W + 60, 12, function (x) { return yb + Math.sin(x / (70 + i * 20) + i) * (2 + i); }), yb + 4 + i * 1.5); }
  add(refl, 'b', bands, dk ? 'rgba(120,70,100,0.35)' : 'rgba(255,230,160,0.55)');
  var ma = {t: '', d: '', l: ''}; (ph ? [[0.88, 0.035, 0.09]] : [[0.12, 0.04, 0.1], [0.46, 0.03, 0.07]]).forEach(function (q) { n1_acacia(W * q[0], hz + H * q[1], H * q[2], H * q[2] * 2.4, rnd, ma); });
  add(refl, 'c', ma.t + ma.d, dk ? '#2E1A30' : '#8A6A3A'); add(refl, 'd', ma.l, dk ? '#3A2238' : '#A08A44');
  // the near ground and the watering hole
  var gy = H * (ph ? 0.74 : 0.76), ground = n1_fn(-60, W + 60, 8, function (x) { return gy + Math.sin(x / 130 + 1) * 10 + Math.sin(x / 41) * 3; });
  add(mid, 'a', below(ground, H + 20), dk ? '#3E2840' : '#D6A658');
  var tex = ''; spread(0, gy + 10, W, H - gy, ph ? 40 : 60, 18, rnd, 1).forEach(function (c) { if (c.q < 0.55) tex += n1_E(c.x, c.y, (ph ? 14 : 24) * (0.5 + c.r), 1.6 + c.k * 1.5); }); add(mid, 'b', tex, dk ? 'rgba(90,60,90,0.5)' : 'rgba(190,140,70,0.45)');
  var px = W * (ph ? 0.46 : 0.5), py = H * (ph ? 0.86 : 0.875), prx = W * (ph ? 0.34 : 0.2), pry = H * (ph ? 0.035 : 0.045);
  add(mid, 'c', n1_P(n1_blob(px, py + 2, prx * 1.12, pry * 1.5, rnd, 12, 0.06)), dk ? '#2E1E30' : '#A47A46');
  add(mid, 'd', n1_P(n1_blob(px, py, prx, pry, rnd, 12, 0.05)), dk ? '#4A3A6A' : '#8CC6CE');
  var rf = n1_E(px + prx * 0.18, py - pry * 0.1, prx * 0.45, pry * 0.25); if (!dk) rf += n1_E(px - prx * 0.4, py + pry * 0.3, prx * 0.22, pry * 0.14); else rf = n1_E(px - prx * 0.3, py - pry * 0.1, prx * 0.16, pry * 0.3);
  add(mid, 'e', rf, dk ? 'rgba(255,240,220,0.5)' : 'rgba(255,240,190,0.85)');
  var reeds = ''; [[-0.95, 1], [-0.8, 0.8], [0.92, 1.1]].forEach(function (q) { var x = px + q[0] * prx, y = py + pry * 0.2; for (var k = 0; k < 7; k++) { var a = -90 + (k - 3) * 9, L = (ph ? 18 : 30) * q[1] * (0.7 + rnd() * 0.5); reeds += n1_leaf(x + (k - 3) * 2.5, y, L, 1.6, a); } }); add(mid, 'f', reeds, dk ? '#3A2E3E' : '#7A8A3A');
  var rocks = ''; [[0.78, 0.82, 0.025], [0.8, 0.83, 0.016], [0.2, 0.9, 0.02]].forEach(function (q) { rocks += n1_P(n1_blob(W * q[0], H * q[1], W * q[2] * (ph ? 1.8 : 1), W * q[2] * (ph ? 1.8 : 1) * 0.55, rnd, 9, 0.15)); }); add(mid, 'g', rocks, dk ? '#2A1C2C' : '#9A7A5A');
  var mtuft = ''; spread(0, gy - 6, W, H * 0.08, ph ? 30 : 46, 18, rnd, 1).forEach(function (c) { if (c.q < 0.7 && Math.abs(c.x - px) > prx * 1.2) { var s = (ph ? 0.6 : 1) * (0.7 + c.r * 0.6); for (var k = 0; k < 5; k++) mtuft += n1_leaf(c.x + (k - 2) * 2.4 * s, c.y, (12 + c.k * 8) * s, 1.4 * s, -90 + (k - 2) * 14); } });
  add(mid, 'h', mtuft, dk ? '#5A3A52' : '#C89A48');
  // two big acacias framing the view
  var T = {t: '', d: '', l: ''}; (ph ? [[0.1, 0.62, 0.38, 0.75], [0.88, 0.7, 0.22, 0.6]] : [[0.13, 0.95, 0.68, 0.32], [0.93, 0.98, 0.36, 0.3]]).forEach(function (q) { n1_acacia(W * q[0], H * q[1], H * q[2], q[3] * W, rnd, T); });
  add(near, 'a', T.t, dk ? '#1E1222' : '#5E4232'); add(near, 'b', T.d, dk ? '#22162A' : '#6E7E34'); add(near, 'c', T.l, dk ? '#2E1E34' : '#8A9A3E');
  // tall grass along the bottom edge
  var g1 = '', g2 = ''; for (var x = -10; x < W + 10; x += (ph ? 7 : 9)) { var h = (ph ? 40 : 70) * (0.6 + rnd() * 0.6) * (1 + 0.4 * Math.abs(x - W / 2) / W), y = H + 6, a = -90 + (rnd() - 0.5) * 30, lf = n1_leaf(x, y, h, (ph ? 2 : 3), a); if (rnd() < 0.5) g1 += lf; else g2 += lf; }
  add(near, 'g', g1, dk ? '#3A2440' : '#B8862E'); add(near, 'h', g2, dk ? '#4E3454' : '#DDAE52');
  if (ANIM) {
    ANIM.pond = {x: px, y: py, rx: prx, ry: pry}; ANIM.hz = hz; ANIM.gy = gy; ANIM.S = S * (ph ? 0.9 : 1); ANIM.sun = dk ? null : [sx, sy, sr];
    // the giraffe stands a little behind the right acacia and browses the underside of its crown
    var gt = ph ? [0.88, 0.7, 0.22, 0.6] : [0.93, 0.98, 0.36, 0.3], gch = H * gt[2], gcy = H * gt[1] - gch;
    ANIM.giraffe = {hx: W * gt[0] - W * gt[3] * 0.3, hy: gcy + gch * 0.2, y: ph ? H * 0.665 : H * 0.9};
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};
