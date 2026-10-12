// ---- world theme: greece (Santorini)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge; greece_hole winds the other way, so inside a clockwise shape of the same slot it cuts a hole.
function greece_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function greece_pg(p) { return poly(greece_area(p) < 0 ? p.slice().reverse() : p); }
function greece_hole(p) { return poly(greece_area(p) > 0 ? p.slice().reverse() : p); }
function greece_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function greece_c(x, y, r) { return greece_e(x, y, r, r); }
// an arched opening: a w-wide rectangle from y to y + h whose top is a half circle
function greece_archPts(x, y, w, h) { var r = w / 2, p = [[x, y + Math.max(h, r)], [x, y + r]]; for (var i = 1; i < 14; i++) { var a = Math.PI + i / 14 * Math.PI; p.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); } p.push([x + w, y + r], [x + w, y + Math.max(h, r)]); return p; }
function greece_arch(x, y, w, h) { return greece_pg(greece_archPts(x, y, w, h)); }
// a dome standing on the line y = by: a half ellipse r wide and r * k tall
function greece_domePts(cx, by, r, k) { var p = []; for (var i = 0; i <= 18; i++) { var a = Math.PI + i / 18 * Math.PI; p.push([cx + Math.cos(a) * r, by + Math.sin(a) * r * k]); } return p; }
// the sun-side shade of a dome: a crescent on its right, from the top down to the base
function greece_domeShade(cx, by, r, k) { var p = [], i; for (i = 0; i <= 9; i++) { var a = Math.PI * 1.5 + i / 9 * Math.PI * 0.5; p.push([cx + Math.cos(a) * r, by + Math.sin(a) * r * k]); } for (i = 9; i >= 0; i--) { a = Math.PI * 1.5 + i / 9 * Math.PI * 0.5; p.push([cx + Math.cos(a) * r * 0.42, by + Math.sin(a) * r * k * 0.98]); } return greece_pg(p); }
// rectangles [x, y, w, h]: what is left of r once every rectangle in cov is taken out of it (front houses hide back details)
function greece_sub(r, cov) { var out = [r]; cov.forEach(function (c) { var nx = []; out.forEach(function (q) { var ax = Math.max(q[0], c[0]), ay = Math.max(q[1], c[1]), bx = Math.min(q[0] + q[2], c[0] + c[2]), by = Math.min(q[1] + q[3], c[1] + c[3]);
  if (ax >= bx || ay >= by) { nx.push(q); return; } if (q[1] < ay) nx.push([q[0], q[1], q[2], ay - q[1]]); if (by < q[1] + q[3]) nx.push([q[0], by, q[2], q[1] + q[3] - by]); if (q[0] < ax) nx.push([q[0], ay, ax - q[0], by - ay]); if (bx < q[0] + q[2]) nx.push([bx, ay, q[0] + q[2] - bx, by - ay]); }); out = nx; });
  return out.filter(function (q) { return q[2] > 0.5 && q[3] > 0.5; }); }
function greece_hit(b, cov) { for (var i = 0; i < cov.length; i++) { var c = cov[i]; if (b[0] < c[0] + c[2] && b[0] + b[2] > c[0] && b[1] < c[1] + c[3] && b[1] + b[3] > c[1]) return true; } return false; }
function greece_rects(list) { var d = ''; list.forEach(function (q) { d += rect(q[0], q[1], q[2], q[3]); }); return d; }
// points of a hanging string from (x0, y0) to (x1, y1) that sags by 'sag' in the middle
function greece_cat(x0, y0, x1, y1, sag, n) { var p = []; for (var i = 0; i <= n; i++) { var u = i / n; p.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)]); } return p; }
// a bougainvillea mass along a list of points: leafy blobs (green) with clusters of papery bracts (magenta) on top
function greece_bloom(pts, s, rnd, out) { pts.forEach(function (p, i) { var r = (5 + rnd() * 5) * s; out.leaf += greece_c(p[0], p[1], r) + greece_c(p[0] + r * 0.8, p[1] + r * 0.3, r * 0.7);
  for (var q = 0; q < 3; q++) { if (rnd() < 0.2) continue; var a = rnd() * 6.28, d = rnd() * r * 0.9, fx = p[0] + Math.cos(a) * d, fy = p[1] + Math.sin(a) * d * 0.8, fr = (1.6 + rnd() * 1.4) * s; out.fl += greece_c(fx, fy, fr) + greece_c(fx + fr * 1.1, fy + fr * 0.5, fr * 0.85) + greece_c(fx - fr * 0.9, fy + fr * 0.7, fr * 0.8); } }); }
// a terracotta pot with a little plant and its flowers
function greece_pot(x, y, s, out) { out.terra += greece_pg([[x - 7 * s, y - 12 * s], [x + 7 * s, y - 12 * s], [x + 5 * s, y], [x - 5 * s, y]]) + rect(x - 8 * s, y - 14 * s, 16 * s, 3 * s);
  out.leaf += greece_c(x - 4 * s, y - 17 * s, 4.5 * s) + greece_c(x + 3 * s, y - 19 * s, 5 * s) + greece_c(x, y - 23 * s, 4 * s); out.fl += greece_c(x - 3 * s, y - 22 * s, 2.2 * s) + greece_c(x + 4 * s, y - 23 * s, 2.2 * s) + greece_c(x + 1 * s, y - 27 * s, 2 * s); }

// ---------------------------------------------------------------- Santorini
// We stand on a whitewashed terrace in a cliff-top village and look west over the caldera. On the right the caldera cliff
// climbs to the sky, banded in rust, cream and charcoal, with white cube houses, blue domes, bell towers and a windmill
// cascading down it. Out in the bay lie the dark volcanic islet and the long island of Therasia on the horizon. In front:
// a house with a blue door and shutters, a stairway down to the terrace wall, and a blue-domed church with a bell tower,
// all hung with bougainvillea. The sun, moon, clouds, glints, sailboat, windmill sails, swaying bougainvillea, the cat,
// the doves, the bells, the window glows and the string lights are the engine's.
var greece_C = {
  L: {haze: 'rgba(255,240,222,0.9)', cloud: 'rgba(255,255,255,0.82)', glare: 'rgba(255,250,236,0.5)', thera: '#93AECB', theraV: 'rgba(255,255,255,0.9)', kam: '#6A6272', kamL: '#8B7F8A',
    rock: '#B4785C', band1: '#E2C49C', band2: '#865648', shine: 'rgba(255,255,255,0.55)', path: 'rgba(255,248,236,0.8)', sun: '#FFF8E2',
    wall: '#FCFBF8', past: '#F4D3A0', shade: '#C5D2E3', blue: '#2F6DB8', glass: '#32486C', dome: '#2D6AC0', domeD: '#1D4C93', bronze: '#B88A3E',
    nShade: '#C3D0E2', leaf: '#3F8A4C', fl: '#DA338A', terra: '#C6764A', navy: '#1E4C90', win: '#2E4468', line: 'rgba(80,104,140,0.38)', wire: 'rgba(70,60,60,0.5)', foam: 'rgba(255,255,255,0.75)'},
  D: {haze: 'rgba(196,104,148,0.42)', cloud: 'rgba(150,140,200,0.35)', glare: 'rgba(200,210,255,0.2)', thera: '#2C2E5A', theraV: 'rgba(255,196,110,0.9)', kam: '#1C1E3E', kamL: '#2A2A50',
    rock: '#3E3152', band1: '#584A6C', band2: '#2E2442', shine: 'rgba(200,214,255,0.3)', path: 'rgba(200,190,230,0.4)', sun: '#FFF4D8',
    wall: '#565D8E', past: '#6C5D7E', shade: '#3E4474', blue: '#2C3F86', glass: '#FFC46A', dome: '#3452A2', domeD: '#22356F', bronze: '#A07A3A',
    nShade: '#40467A', leaf: '#2A5440', fl: '#A23578', terra: '#7C4C3E', navy: '#202F66', win: '#FFC870', line: 'rgba(20,20,50,0.4)', wire: 'rgba(20,16,30,0.6)', foam: 'rgba(210,220,255,0.4)'}
};
SCENES.greece = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1), mid = Lay(0), near = Lay(0), C = greece_C[dk ? 'D' : 'L'], i, j, k, x, y;
  var u = ph ? 0.72 : Math.max(0.62, Math.min(1.1, H / 820)), hz = H * (ph ? 0.46 : 0.5), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#0E1838 0%,#1D2A5A ' + Math.round(p1 * 0.62) + '%,#6A3E62 ' + p1 + '%,#0E1838 100%)' : 'linear-gradient(180deg,#8EC9F0 0%,#D8EEFA ' + Math.round(p1 * 0.62) + '%,#FFF2DC ' + p1 + '%,#FFF2DC 100%)';
  var sea = dk ? 'linear-gradient(180deg,#3A3C70 0%,#1E2858 5%,#141E4A 35%,#0B1434 100%)' : 'linear-gradient(180deg,#8CC0E2 0%,#3C88C6 5%,#1B69AC 38%,#0D4E8C 100%)';
  var sun = [W * (ph ? 0.3 : 0.72), H * (ph ? 0.19 : 0.16), (ph ? 22 : 34) * u], moon = [W * (ph ? 0.26 : 0.49), H * (ph ? 0.18 : 0.13), (ph ? 15 : 19) * u];
  // the caldera cliff: its top edge Ty climbs from the bay to the top right, its foot Fy curves round toward us
  var xL = W * (ph ? 0.5 : 0.53), topR = H * (ph ? 0.2 : 0.12);
  var tOf = function (x) { return Math.max(0, (x - xL) / (W - xL)); };
  var hd = H * (ph ? 0.025 : 0.035), Ty = function (x) { var t = Math.min(1.3, tOf(x)); return hz - hd - (hz - hd - topR) * (1 - Math.pow(Math.max(0, 1 - t), 1.9)) + (t > 0.02 ? Math.sin(x / 37) * 2 * u + Math.sin(x / 13 + 1) * u : 0); };
  var Fy = function (x) { var t = Math.min(1.3, tOf(x)); return hz + H * 0.012 + (H * 1.02 - hz) * t * t; };
  var Vy = function (x) { var t = Math.min(1.2, tOf(x)); return Math.min(Fy(x) - 8 * u, Ty(x) + H * (0.05 + 0.42 * Math.pow(t, 1.2))); };

  // sky: a warm haze on the horizon, soft clouds by day, stars at night
  add(far, 'a', greece_e(W * 0.42, hz, W * 0.75, H * 0.07), C.haze);
  if (!dk) { var cl = ''; spread(0, H * 0.05, W, H * 0.24, ph ? 200 : 320, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - sun[0], c.y - sun[1]) > sun[2] * 3 && c.x < (c.y > H * 0.2 ? xL : W)) cl += greece_e(c.x, c.y, (60 + c.r * 70) * u, (8 + c.k * 5) * u) + greece_e(c.x + 30 * u, c.y - 7 * u, 38 * u, 8 * u); }); add(far, 'b', cl, C.cloud); }
  // the glare of the sun (or the moon) on the open water below it
  var lit = dk ? moon : sun; add(far, 'c', greece_e(lit[0], hz + H * 0.08, W * (dk ? 0.06 : 0.12), H * 0.1), C.glare);

  // Therasia on the horizon, with a thin line of white houses along its top
  var th = [], tx1 = W * (ph ? 0.3 : 0.36), tH = H * (ph ? 0.022 : 0.03), tvil = '';
  for (x = -30; x <= tx1; x += 6) th.push([x, hz - tH * Math.pow(Math.min(1, (tx1 - x) / (W * 0.07)), 0.7) * (1 + 0.08 * Math.sin(x / 23) + 0.05 * Math.sin(x / 7))]);
  th.push([tx1 + 4, hz + 1], [-30, hz + 1]); add(bg, 'a', greece_pg(th), C.thera);
  th.slice(0, -2).forEach(function (p) { if (p[0] > W * 0.04 && p[0] < tx1 - W * 0.05 && rnd() < 0.45) tvil += rect(p[0], p[1] + 1, 2.4 * u, 1.6 * u); });
  add(bg, 'b', tvil, C.theraV);
  // the dark volcanic islet in the bay, with a lighter sunlit slope
  var kx0 = W * (ph ? 0.04 : 0.12), kx1 = W * (ph ? 0.3 : 0.35), ky = hz + H * (ph ? 0.035 : 0.04), kh = H * (ph ? 0.02 : 0.025), kp = [], kl = [];
  for (i = 0; i <= 30; i++) { var ku = i / 30, kx = kx0 + (kx1 - kx0) * ku, ka = kh * Math.pow(Math.sin(Math.PI * ku), 0.6) * (1 + 0.22 * Math.sin(ku * 17) + 0.12 * Math.sin(ku * 41)); kp.push([kx, ky - ka]); if (ku > 0.08 && ku < 0.55) kl.push([kx, ky - ka]); }
  kp.push([kx1, ky + 1], [kx0, ky + 1]); add(bg, 'c', greece_pg(kp), C.kam);
  kl = kl.concat(kl.slice().reverse().map(function (p) { return [p[0] + 6 * u, p[1] + kh * 0.4]; })); add(bg, 'd', greece_pg(kl), C.kamL);

  // the cliff itself: rust rock with pale and dark bands that fan out from the top edge to the foot
  var top = [], foot = [], xR = W + 40;
  for (x = xL; x <= xR; x += 5) { top.push([x, Ty(x)]); foot.push([x, Fy(x)]); }
  // a rocky headland tapers the cliff's end down into the bay
  var cliff = [[xL - 46 * u, hz + 1], [xL - 30 * u, hz - hd * 0.3], [xL - 14 * u, hz - hd * 0.75]].concat(top, foot.slice().reverse()); add(bg, 'e', greece_pg(cliff), C.rock);
  function band(f0, f1, wob, ph0) { var A = [], B = []; for (x = xL + 2; x <= xR; x += 5) { var a = Ty(x), b = Fy(x), h = b - a, w = Math.sin(x / 47 + ph0) * wob * u + Math.sin(x / 19 + ph0 * 2) * wob * 0.4 * u; A.push([x, Math.max(a, a + h * f0 + w)]); B.unshift([x, Math.min(b, a + h * f1 + w)]); } return greece_pg(A.concat(B)); }
  add(bg, 'f', band(0.3, 0.4, 5, 0) + band(0.62, 0.68, 4, 2) + band(0.08, 0.14, 3, 4), C.band1);
  add(bg, 'g', band(0.45, 0.56, 5, 1) + band(0.74, 0.8, 4, 3) + band(0.87, 1.0, 3, 5), C.band2);
  // a zigzag mule path down the face, and foam along the foot
  var zp = [], zx = W * (ph ? 0.66 : 0.64), zy = Vy(zx) + 6 * u, zs = 1;
  while (zy < Fy(zx) - 10 * u && zp.length < 40) { zp.push([zx, zy]); zx += zs * (ph ? 20 : 34) * u; zy += (ph ? 8 : 12) * u; zs = -zs; }
  var zpath = zp.length > 1 ? pline(zp) : '';
  var foam = pline(foot.map(function (p) { return [p[0], p[1] + 1.5]; }).filter(function (p) { return p[1] < H + 10; }));
  stk(bg, 't', zpath, C.path, 1.6 * u);

  // the sea: short glints that lengthen toward us, only on open water
  var shine = '';
  spread(0, hz + 6, W, H - hz - 6, ph ? 44 : 70, 14, rnd, 1).forEach(function (c) { if (c.q > 0.5) return; var t = (c.y - hz) / (H - hz), len = (8 + t * 34) * u;
    if (c.x + len > xL - 4 && c.y > Ty(c.x + len) - 4) return; if (c.x + len > kx0 - 4 && c.x < kx1 + 4 && c.y < ky + 4 && c.y > ky - kh - 4) return; shine += seg(c.x, c.y, c.x + len, c.y); });
  stk(bg, 's', shine + foam + seg(kx0 + 4, ky + 2, kx1 - 4, ky + 2), C.foam, 1.2);

  // stars at night (only in open sky), and the still sun or moon when nothing moves
  var sil = [];   // [x0, x1, top] boxes of everything on the skyline
  var stars = '';

  // ---------------------------------------------------------------- the village on the cliff (mid)
  var rowS = 21 * u, houses = [], mx = W * (ph ? 0.86 : 0.875), mb = Ty(mx) + 3 * u, mw = 13 * u;
  for (var r = 0; r < 40; r++) {
    x = xL + 8 * u + (r % 2) * 13 * u - rnd() * 18 * u;
    var any = false;
    while (x < W + 30) {
      var w = (28 + rnd() * 30) * u, cx = x + w / 2, base = Ty(cx) + (r + 0.35) * rowS + (rnd() - 0.5) * 4 * u, h = (22 + rnd() * 16 + (r === 0 ? 6 : 0)) * u;
      if (cx > xL + 14 * u && base - h * 0.5 < Vy(cx) && base < Fy(cx) - 6 * u && !(r < 2 && Math.abs(cx - mx) < mw + w / 2 + 2 * u)) {
        var bot = Math.max(base, Ty(x), Ty(x + w)) + 8 * u; houses.push({x: x, y: base - h, w: w, h: bot - (base - h), base: base, r: r, k: rnd(), q: rnd(), s: rnd(), t: rnd()}); any = true; }
      x += w + (rnd() < 0.22 ? (4 + rnd() * 10) * u : -1.5 * u);
    }
    if (!any && r > 3) break;
  }
  // the windmill stands on the cliff edge among the first row
  var mH = 46 * u, mTop = mb - mH, mill = {x: mx - mw, y: mTop, w: mw * 2, h: mH + 20 * u, base: mb, r: 0, mill: 1};
  i = 0; while (i < houses.length && houses[i].r === 0) i++; houses.splice(i, 0, mill);
  // churches: a few houses carry a blue dome or a bell tower, where nothing in front would cover them
  var domes = [], towers = [];
  houses.forEach(function (o, i0) {
    if (o.mill || o.w < 34 * u || o.r < 1) return;
    var later = houses.slice(i0 + 1).map(function (f) { return [f.x, f.y, f.w, f.h]; }), dr = Math.min(o.w * 0.4, 18 * u), dbox = [o.x + o.w * 0.5 - dr - 2, o.y - dr * 1.5 - 9 * u, dr * 2 + 4, dr * 1.5 + 9 * u], tbox = [o.x + o.w - 20 * u, o.y - 34 * u, 20 * u, 34 * u];
    if (o.k < 0.4 && domes.length < (ph ? 3 : 8) && !greece_hit(dbox, later) && domes.every(function (d) { return Math.abs(d.x - o.x) > 46 * u || Math.abs(d.y - o.y) > 50 * u; })) { o.dome = dr; domes.push(o); }
    else if (o.k > 0.8 && towers.length < (ph ? 1 : 3) && !greece_hit(tbox, later) && o.x + o.w < W - 10) { o.tower = 1; towers.push(o); }
  });
  var M = {wall: '', past: '', shade: '', blue: '', glass: '', dome: '', domeD: '', bronze: ''}, winGlow = [];
  houses.forEach(function (o, i0) {
    var cov = []; for (var q = i0 + 1; q < houses.length; q++) { var f = houses[q]; if (f.x < o.x + o.w + 4 && f.x + f.w > o.x - 4 && f.y < o.y + o.h) cov.push([f.x, f.y, f.w, f.h]); }
    if (o.mill) {
      M.wall += greece_pg([[o.x, mb + 20 * u], [o.x + 2 * u, mTop], [o.x + o.w - 2 * u, mTop], [o.x + o.w, mb + 20 * u]]);
      M.shade += greece_rects(greece_sub([mx + 4 * u, mTop, mw - 4 * u, mH], cov));
      M.bronze += greece_pg([[mx - mw - 1.5 * u, mTop + 1], [mx - mw * 0.55, mTop - 10 * u], [mx, mTop - 15 * u], [mx + mw * 0.55, mTop - 10 * u], [mx + mw + 1.5 * u, mTop + 1]]) + rect(mx - mw - 1.5 * u, mTop - 1, mw * 2 + 3 * u, 3 * u);
      M.blue += greece_arch(mx - 4 * u, mb - 13 * u, 8 * u, 13 * u); M.glass += rect(mx - 2.5 * u, mTop + 12 * u, 5 * u, 6 * u); winGlow.push([mx, mTop + 15 * u, 5 * u]);
      sil.push([o.x - 2 * u, o.x + o.w + 2 * u, mTop - 15 * u]); return; }
    var wall = [o.x, o.y, o.w, o.h];
    if (o.t < 0.14 && o.r > 0) M.past += greece_rects(greece_sub(wall, cov)); else M.wall += rect(o.x, o.y, o.w, o.h);
    var topY = o.y;
    // roof shapes: flat with a rounded parapet, a barrel vault, or a little cube stepped on top
    if (o.q < 0.16 && !o.dome && !o.tower) { M.wall += greece_pg(greece_domePts(o.x + o.w / 2, o.y + 1, o.w / 2, 0.38)); topY = o.y - o.w * 0.19; }
    else if (o.q < 0.32 && !o.dome && !o.tower) { var sw2 = o.w * 0.42, sx2 = o.x + o.w * (o.s < 0.5 ? 0.08 : 0.5); M.wall += rect(sx2, o.y - o.h * 0.32, sw2, o.h * 0.32 + 1); M.shade += greece_rects(greece_sub([sx2 + sw2 - Math.max(2.5 * u, sw2 * 0.18), o.y - o.h * 0.32, Math.max(2.5 * u, sw2 * 0.18), o.h * 0.32], cov)); topY = o.y - o.h * 0.32; if (!greece_hit([sx2 + sw2 * 0.35, o.y - o.h * 0.2, 4 * u, 4.5 * u], cov)) { M.glass += rect(sx2 + sw2 * 0.35, o.y - o.h * 0.22, 4 * u, 4.5 * u); winGlow.push([sx2 + sw2 * 0.35 + 2 * u, o.y - o.h * 0.2, 4 * u]); } }
    // shade: the side away from the west sun, and a thin crease under the parapet
    var sw = Math.max(3 * u, o.w * 0.16); M.shade += greece_rects(greece_sub([o.x + o.w - sw, o.y, sw, o.base - o.y + 4 * u], cov).concat(greece_sub([o.x, o.y + 2.5 * u, o.w - sw, 1.2 * u], cov)));
    // a blue door and windows, some with blue shutters
    var gy = o.base;
    if (o.s < 0.55) { var dw = Math.min(9 * u, Math.max(5.5 * u, o.w * 0.2)), dh = Math.min((gy - o.y) * 0.6, 15 * u), dx = o.x + o.w * (0.12 + o.k * 0.45); if (dx + dw < o.x + o.w - sw && !greece_hit([dx, gy - dh, dw, dh], cov)) M.blue += greece_arch(dx, gy - dh, dw, dh); }
    var nwin = o.w > 44 * u ? 2 : 1;
    for (j = 0; j < nwin; j++) { var ww = 4.6 * u, wh = 5.4 * u, wx = o.x + o.w * (nwin === 2 ? 0.2 + j * 0.42 : (o.s < 0.55 ? 0.68 - o.k * 0.4 : 0.4)) , wy = o.y + (gy - o.y) * 0.3;
      if (wx + ww > o.x + o.w - sw || greece_hit([wx - 3 * u, wy, ww + 6 * u, wh], cov) || (o.s < 0.55 && Math.abs(wx - (o.x + o.w * (0.12 + o.k * 0.45))) < 10 * u)) continue;
      M.glass += rect(wx, wy, ww, wh); winGlow.push([wx + ww / 2, wy + wh / 2, ww]); if (o.t > 0.6) M.blue += rect(wx - 2.4 * u, wy - 0.4 * u, 2.2 * u, wh + 0.8 * u) + rect(wx + ww + 0.2 * u, wy - 0.4 * u, 2.2 * u, wh + 0.8 * u); }
    if (o.dome) { var dr = o.dome, dcx = o.x + o.w * 0.5, dby = o.y - 5 * u; M.wall += rect(dcx - dr * 0.82, dby, dr * 1.64, 6 * u); M.dome += greece_pg(greece_domePts(dcx, dby, dr, 1.05)); M.domeD += greece_domeShade(dcx, dby, dr, 1.05);
      M.bronze += rect(dcx - 0.6 * u, dby - dr * 1.05 - 6 * u, 1.2 * u, 6.5 * u) + rect(dcx - 2.2 * u, dby - dr * 1.05 - 4.4 * u, 4.4 * u, 1.1 * u); topY = dby - dr * 1.05 - 6 * u; }
    if (o.tower) { var tw = 16 * u, tx = o.x + o.w - tw - 2 * u, tT = o.y - 28 * u; M.wall += greece_pg(greece_archPts(tx, tT, tw, 29 * u)) + greece_hole(greece_archPts(tx + 2.4 * u, tT + 12 * u, 4.8 * u, 9 * u)) + greece_hole(greece_archPts(tx + tw - 7.2 * u, tT + 12 * u, 4.8 * u, 9 * u)) + greece_hole(greece_archPts(tx + tw / 2 - 2.2 * u, tT + 3 * u, 4.4 * u, 5.6 * u));
      M.domeD += greece_arch(tx + 2.4 * u, tT + 12 * u, 4.8 * u, 9 * u) + greece_arch(tx + tw - 7.2 * u, tT + 12 * u, 4.8 * u, 9 * u) + greece_arch(tx + tw / 2 - 2.2 * u, tT + 3 * u, 4.4 * u, 5.6 * u); M.shade += rect(tx + tw - 2.2 * u, tT + 8 * u, 2.2 * u, 21 * u);
      M.bronze += greece_c(tx + 4.8 * u, tT + 17.5 * u, 1.8 * u) + greece_c(tx + tw - 4.8 * u, tT + 17.5 * u, 1.8 * u) + greece_c(tx + tw / 2, tT + 7 * u, 1.4 * u) + rect(tx + tw / 2 - 0.5 * u, tT - 5 * u, 1 * u, 5.5 * u) + rect(tx + tw / 2 - 2 * u, tT - 3.6 * u, 4 * u, 1 * u); topY = Math.min(topY, tT - 5 * u); sil.push([tx, tx + tw, tT - 5 * u]); }
    sil.push([o.x, o.x + o.w, topY]);
  });
  add(mid, 'a', M.wall, C.wall); add(mid, 'b', M.past, C.past); add(mid, 'c', M.shade, C.shade); add(mid, 'd', M.blue, C.blue); add(mid, 'e', M.glass, C.glass); add(mid, 'f', M.dome, C.dome); add(mid, 'g', M.domeD, C.domeD); add(mid, 'h', M.bronze, C.bronze);

  // the skyline (the cliff top and everything standing on it), for stars and for the engine's sky clip
  var sky0 = [];
  for (x = -40; x <= W + 40; x += 4) { var yy = x < xL ? hz : Ty(x); sil.forEach(function (b) { if (x >= b[0] && x <= b[1]) yy = Math.min(yy, b[2]); }); sky0.push([x, yy]); }
  var skyAt = function (x) { var i2 = Math.max(0, Math.min(sky0.length - 1, Math.round((x + 40) / 4))); return sky0[i2][1]; };
  if (dk) { spread(0, 0, W, hz - 8, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.3 && c.y < skyAt(c.x) - 8 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] * 2.2) stars += greece_c(c.x, c.y, 0.5 + c.r * 0.9); }); add(bg, 'h', stars, 'rgba(255,240,230,0.8)'); }

  // ---------------------------------------------------------------- the foreground terrace (near)
  var N = {wall: '', shade: '', blue: '', leaf: '', fl: '', terra: '', navy: '', win: ''}, lines = '', wires = '', s = ph ? 0.78 : u;
  var yW = H * (ph ? 0.935 : 0.89), capH = 7 * s;
  // the house on the left, with a blue door, blue shutters and a stairway down its right side to the terrace wall
  var hx1 = W * (ph ? 0.27 : 0.2), hT = H * (ph ? 0.84 : 0.715), hG = H * (ph ? 0.975 : 0.945);
  N.wall += rect(-12, hT, hx1 + 12, H - hT + 12) + rect(hx1 - W * 0.07, hT - 18 * s, W * 0.07, 19 * s);
  N.shade += rect(hx1 - 8 * s, hT, 8 * s, H - hT + 12) + rect(-12, hT + 3 * s, hx1 - W * 0.07 + 12, 2 * s) + rect(hx1 - 7 * s, hT - 18 * s, 7 * s, 18 * s);
  var dX = W * (ph ? 0.07 : 0.055), dW = 30 * s, dH = 56 * s;
  N.wall += rect(dX - 4 * s, hG - dH - 4 * s, dW + 8 * s, dH + 4 * s); N.blue += greece_arch(dX, hG - dH, dW, dH); N.navy += rect(dX + dW / 2 - 0.8 * s, hG - dH + dW / 2, 1.6 * s, dH - dW / 2) + rect(dX + 3 * s, hG - dH * 0.45, dW - 6 * s, 1.6 * s);
  N.terra += rect(dX - 6 * s, hG - 1, dW + 12 * s, 4 * s);
  var wY = hT + (hG - dH - hT) * 0.3, nearWin = [];
  [dX + dW + 24 * s, ph ? -99 : dX + dW + 68 * s].forEach(function (wx) { if (wx < 0 || wx + 30 * s > hx1 - 10 * s) return; N.win += rect(wx, wY, 16 * s, 20 * s); nearWin.push([wx + 8 * s, wY + 10 * s, 18 * s]); N.wall += rect(wx - 2.5 * s, wY + 20 * s, 21 * s, 3 * s); N.blue += rect(wx - 9 * s, wY - 1 * s, 8 * s, 22 * s) + rect(wx + 17 * s, wY - 1 * s, 8 * s, 22 * s);
    lines += seg(wx - 9 * s, wY + 6 * s, wx - 1 * s, wY + 6 * s) + seg(wx - 9 * s, wY + 12 * s, wx - 1 * s, wY + 12 * s) + seg(wx + 17 * s, wY + 6 * s, wx + 25 * s, wY + 6 * s) + seg(wx + 17 * s, wY + 12 * s, wx + 25 * s, wY + 12 * s); });
  // the stairway: steps down from the house to the terrace, with a sloping side wall and pots on the treads
  var sx0 = hx1, sy0 = hT + 22 * s, sx1 = W * (ph ? 0.44 : 0.36), ns = ph ? 6 : 8, stp = [[sx0, sy0]], sdx = (sx1 - sx0) / ns, sdy = (yW - sy0) / ns, P = {leaf: '', fl: '', terra: ''};
  for (i = 0; i < ns; i++) { stp.push([sx0 + sdx * (i + 1), sy0 + sdy * i], [sx0 + sdx * (i + 1), sy0 + sdy * (i + 1)]); lines += seg(sx0 + sdx * i, sy0 + sdy * i + 1.5 * s, sx0 + sdx * (i + 1), sy0 + sdy * i + 1.5 * s); }
  stp.push([sx1, H + 12], [sx0, H + 12]); N.wall += greece_pg(stp);
  N.shade += greece_pg([[sx0, sy0 + 10 * s], [sx1, yW + 10 * s], [sx1, yW + 14 * s], [sx0, sy0 + 14 * s]]);
  [1, 3, 5].forEach(function (q) { if (q < ns - 1) greece_pot(sx0 + sdx * (q + 0.55), sy0 + sdy * q, s * 0.9, P); });
  // the terrace wall along the bottom, with its rounded cap and a shadow under the cap
  N.wall += rrect(sx1 - 4 * s, yW, W - sx1 + 20, capH, 3 * s) + rect(sx1, yW + capH - 1, W - sx1 + 20, H - yW + 10);
  N.shade += rect(sx1, yW + capH - 1, W - sx1 + 20, 3 * s);
  // a blue wooden gate in the wall, flagstone joints on its face and a little painted niche with a candle
  var gX = sx1 + (W * (ph ? 0.52 : 0.675) - sx1) * 0.42, gW = 46 * s, gT = yW + capH + 5 * s;
  for (x = sx1 + 30 * s; x < W; x += 62 * s) if (Math.abs(x - gX - gW / 2) > gW * 0.7) lines += seg(x, yW + capH + 8 * s, x, H + 4);
  N.blue += greece_arch(gX, gT, gW, H - gT + 10); for (x = gX + gW / 5; x < gX + gW - 2; x += gW / 5) N.navy += rect(x - 0.7 * s, gT + gW * 0.3, 1.4 * s, H - gT); N.navy += rect(gX + 3 * s, gT + gW * 0.62, gW - 6 * s, 2 * s);
  N.shade += rect(gX - 4 * s, gT - 3 * s, gW + 8 * s, 3 * s) + greece_rects([[sx1 + 6 * s, H - 26 * s, 34 * s, 2 * s], [gX + gW + 30 * s, H - 40 * s, 40 * s, 2 * s], [gX - 70 * s, H - 18 * s, 50 * s, 2 * s]]);
  var nX = gX + gW + (ph ? 18 : 60) * s; if (nX + 20 * s < W * (ph ? 0.52 : 0.675)) { N.navy += greece_arch(nX, yW + capH + 14 * s, 18 * s, 24 * s); N.terra += rect(nX + 6 * s, yW + capH + 30 * s, 6 * s, 8 * s); N.win += greece_c(nX + 9 * s, yW + capH + 27 * s, 2.4 * s); nearWin.push([nX + 9 * s, yW + capH + 27 * s, 8 * s]); }
  // the church on the right: a white cube with a blue dome on a drum, and a bell tower beside it
  var c0 = W * (ph ? 0.52 : 0.675), c1 = W * (ph ? 0.8 : 0.805), cT = H * (ph ? 0.875 : 0.72), dR = (c1 - c0) * 0.3, dCx = (c0 + c1) / 2 - (c1 - c0) * 0.04, drT = cT - dR * 0.42, dBy = drT;
  N.wall += rect(c0, cT, c1 - c0, H - cT + 10) + rect(dCx - dR * 1.0, drT, dR * 2.0, cT - drT + 1) + rrect(c0 - 4 * s, cT - 4 * s, c1 - c0 + 8 * s, 6 * s, 2 * s);
  N.shade += rect(dCx + dR * 0.55, drT, dR * 0.45, cT - drT) + rect(c0, cT + 2 * s, c1 - c0, 2.5 * s);
  N.blue += greece_pg(greece_domePts(dCx, dBy, dR * 1.06, 1.0)); N.navy += greece_domeShade(dCx, dBy, dR * 1.06, 1.0) + rect(dCx - dR * 1.08, dBy - 1.5 * s, dR * 2.16, 3 * s);
  N.navy += rect(dCx - 0.9 * s, dBy - dR * 1.06 - 12 * s, 1.8 * s, 12.5 * s) + rect(dCx - 4 * s, dBy - dR * 1.06 - 9 * s, 8 * s, 1.8 * s);
  for (i = 0; i < 5; i++) { var wxd = dCx - dR * 0.8 + i * dR * 0.4; N.navy += greece_arch(wxd - 2.2 * s, drT + 3 * s, 4.4 * s, cT - drT - 6 * s); }
  var cdW = (c1 - c0) * 0.24, cdX = (c0 + c1) / 2 - cdW / 2 - (c1 - c0) * 0.1;
  N.blue += greece_arch(cdX, yW - (yW - cT) * 0.72, cdW, (yW - cT) * 0.72 + 2); N.navy += rect(cdX + cdW / 2 - 0.8 * s, yW - (yW - cT) * 0.72 + cdW / 2, 1.6 * s, (yW - cT) * 0.72);
  N.win += greece_c(cdX + cdW / 2, cT + (yW - cT) * 0.14, 5 * s); nearWin.push([cdX + cdW / 2, cT + (yW - cT) * 0.14, 10 * s]);
  // the bell tower: two arches with the big bells, one small arch on top, a curved crown; the arches are holes, so the
  // village and sky show through them
  var tw0 = c1 - 2 * s, twW = W * (ph ? 0.15 : 0.066), tT0 = H * (ph ? 0.8 : 0.6), bw2 = twW * 0.3, bh2 = (cT - tT0) * 0.34, by2 = tT0 + (cT - tT0) * 0.4;
  N.wall += greece_pg(greece_archPts(tw0, tT0 + twW * 0.18, twW, H - tT0 + 10)) + rect(tw0 + twW * 0.25, tT0 - twW * 0.05, twW * 0.5, twW * 0.4) + greece_pg(greece_archPts(tw0 + twW * 0.25, tT0 - twW * 0.24, twW * 0.5, twW * 0.3));
  var bells = [[tw0 + twW * 0.1, by2, bw2, bh2], [tw0 + twW * 0.6, by2, bw2, bh2], [tw0 + twW * 0.39, tT0 + twW * 0.08, twW * 0.22, twW * 0.26]];
  bells.forEach(function (b) { N.wall += greece_hole(greece_archPts(b[0], b[1], b[2], b[3])); });
  N.shade += rect(tw0 + twW * 0.91, tT0 + twW * 0.4, twW * 0.09, H - tT0) + rect(tw0, by2 + bh2 + 2 * s, twW, 2.5 * s) + rect(tw0, tT0 + twW * 0.36, twW, 2 * s);
  N.navy += rect(tw0 + twW / 2 - 0.9 * s, tT0 - twW * 0.24 - 12 * s, 1.8 * s, 12.5 * s) + rect(tw0 + twW / 2 - 4 * s, tT0 - twW * 0.24 - 9 * s, 8 * s, 1.8 * s);
  var bellAt = bells.map(function (b) { return {x: b[0] + b[2] / 2, y: b[1] + b[2] * 0.42, s: b[2] / (24 * s)}; });
  // a house corner beyond the tower, with a blue window
  var ex0 = tw0 + twW, eT = H * (ph ? 0.86 : 0.665);
  if (ex0 < W) { N.wall += rect(ex0 - 1, eT, W - ex0 + 20, H - eT + 10); N.shade += rect(ex0 - 1, eT + 3 * s, W - ex0 + 20, 2 * s); var ewx = ex0 + (W - ex0) * 0.3; if (W - ex0 > 40 * s) { N.win += rect(ewx, eT + 22 * s, 14 * s, 18 * s); N.blue += rect(ewx - 7 * s, eT + 21 * s, 6.5 * s, 20 * s) + rect(ewx + 14.5 * s, eT + 21 * s, 6.5 * s, 20 * s); nearWin.push([ewx + 7 * s, eT + 31 * s, 16 * s]); } }
  // bougainvillea: over the left house's roof and down its corner, and spilling over the terrace wall by the church
  var B = {leaf: '', fl: ''}, sprays = [];
  var bl = []; for (x = -10; x < hx1 + 8 * s; x += 9 * s) bl.push([x, hT - 4 * s + Math.sin(x / 17) * 3 * s]);
  for (y = hT; y < hT + (ph ? 40 : 70) * s; y += 9 * s) bl.push([hx1 - 2 * s + Math.sin(y / 9) * 3 * s, y]);
  var bl2 = []; for (x = c0 - W * (ph ? 0.12 : 0.09); x < c0 + 6 * s; x += 9 * s) bl2.push([x, yW - 4 * s + Math.sin(x / 13) * 2 * s]);
  for (y = yW; y < yW + 30 * s; y += 9 * s) bl2.push([c0 - W * (ph ? 0.1 : 0.07) + Math.sin(y / 7) * 4 * s, y + 4 * s]);
  greece_bloom(bl, s, rnd, B); greece_bloom(bl2, s, rnd, B);
  // the bougainvillea's twisting trunk climbing from its pot to the roof, a wall lantern and a painted plinth
  var trA = [], trB = []; for (y = hG - 8 * s; y >= hT; y -= 6 * s) { var tq = (hG - y) / (hG - hT), tcx = dX + dW + 8 * s + Math.sin(y / (14 * s)) * 4 * s + tq * 6 * s, tw2 = (3.4 - tq * 1.6) * s; trA.push([tcx - tw2 / 2, y]); trB.unshift([tcx + tw2 / 2, y]); }
  N.terra += greece_pg(trA.concat(trB));
  var lx = dX - 16 * s, ly = hG - dH - 2 * s; N.navy += rect(lx - 0.8 * s, ly - 10 * s, 1.6 * s, 6 * s) + greece_pg([[lx - 5 * s, ly - 4 * s], [lx + 5 * s, ly - 4 * s], [lx + 3.5 * s, ly + 9 * s], [lx - 3.5 * s, ly + 9 * s]]); N.win += rect(lx - 3 * s, ly - 1.5 * s, 6 * s, 8.5 * s); nearWin.push([lx, ly + 3 * s, 10 * s]);
  N.shade += rect(-12, hG - 5 * s, dX - 6 * s + 12, 5 * s) + rect(dX + dW + 6 * s, hG - 5 * s, hx1 - dX - dW - 14 * s, 5 * s);
  greece_pot(dX + dW + 7 * s, hG + 2 * s, s * 1.1, P);
  [[W * 0.03, 0.9], [W * 0.12, 1.1], [hx1 - 4 * s, 1.2]].forEach(function (q) { if (q[0] < hx1) sprays.push({x: q[0], y: hT - 2 * s, len: 34 * s * q[1], s: s}); });
  sprays.push({x: c0 - W * (ph ? 0.1 : 0.07), y: yW + 4 * s, len: 44 * s, s: s}, {x: c0 - W * 0.03, y: yW + 2 * s, len: 30 * s, s: s});
  // pots along the terrace wall by the church
  greece_pot(c1 + twW + (ph ? -99 : 30 * s), yW + 1, s, P);
  N.leaf += B.leaf + P.leaf; N.fl += B.fl + P.fl; N.terra += P.terra;
  // string lights: from the left house's roof to the bell tower, and from the tower on toward the right
  var strings = [greece_cat(hx1 - 6 * s, hT - 16 * s, tw0 + 2 * s, tT0 + twW * 0.5, H * (ph ? 0.03 : 0.07), 40)];
  if (ex0 < W - 20) strings.push(greece_cat(tw0 + twW - 2 * s, tT0 + twW * 0.5, W + 20, eT + 8 * s, H * 0.02, 16));
  strings.forEach(function (p) { wires += pline(p); });
  add(near, 'a', N.wall, C.wall); add(near, 'b', N.shade, C.nShade); add(near, 'c', N.blue, C.blue); add(near, 'd', N.leaf, C.leaf); add(near, 'e', N.fl, C.fl); add(near, 'f', N.terra, C.terra); add(near, 'g', N.navy, C.navy); add(near, 'h', N.win, C.win);
  stk(near, 's', lines, C.line, 1.2); stk(near, 't', wires, C.wire, 1);

  var bulbs = []; strings.forEach(function (p, si) { for (var b = 2; b < p.length - 1; b += si ? 3 : 2) bulbs.push([p[b][0], p[b][1] + 3, (b + si) % 4]); });
  if (ANIM) {
    ANIM.hz = hz; ANIM.sun = sun; ANIM.moon = moon; ANIM.sky = sky0; ANIM.cliff = cliff; ANIM.xL = xL; ANIM.C = C; ANIM.u = u; ANIM.s = s;
    ANIM.kam = [kx0, ky - kh, kx1 - kx0, kh + 4]; ANIM.sea = [0, hz + 4, W, yW - hz - 4];
    ANIM.mill = {x: mx, y: mTop - 4 * u, L: 34 * u}; ANIM.bells = bellAt; ANIM.tower = [tw0 + twW / 2, tT0 - twW * 0.3, twW];
    ANIM.domes = domes.map(function (o) { return [o.x + o.w / 2, o.y - o.dome]; }).concat([[dCx, dBy - dR]]);
    ANIM.cat = {x0: sx1 + 26 * s, x1: W - 30 * s, y: yW, s: s}; ANIM.sprays = sprays; ANIM.bulbs = bulbs; ANIM.wins = winGlow; ANIM.nearWins = nearWin;
    ANIM.boat = {y: hz + (yW - hz) * (ph ? 0.55 : 0.62), s: (ph ? 0.7 : 1) * u};
  } else {
    // the still scene: the sun (or moon) where the engine would draw it, and lit bulbs at night
    if (dk) { add(far, 'd', greece_c(moon[0], moon[1], moon[2] * 2.6), 'rgba(220,220,255,0.3)'); add(bg, 'h', greece_c(moon[0], moon[1], moon[2]), C.sun); }
    else { add(far, 'd', greece_c(sun[0], sun[1], sun[2] * 2.6), 'rgba(255,250,230,0.9)'); add(bg, 'h', greece_c(sun[0], sun[1], sun[2]), C.sun); }
    var bd = ''; bulbs.forEach(function (b) { bd += greece_c(b[0], b[1], 2.2 * s); }); add(near, dk ? 'h' : 'a', bd);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near, band: {top: hz, bg: sea}};
};
