// ---- batch japan engines: japan
function japan_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function japan_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return japan_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - japan_ease((T - c) / (d - c)); }
var japan_gc = null;
function japan_ctx() { return japan_gc || (japan_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with japan_dot)
function japan_rg(col, mid) { var g = japan_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function japan_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function japan_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
// one sakura petal (a rounded drop with a notch), about 2s long, pointing up
function japan_petal(c, s) { c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(-s * 0.24, -s); c.bezierCurveTo(-s * 0.72, -s * 0.9, -s * 0.72, -s * 0.2, -s * 0.44, s * 0.36); c.quadraticCurveTo(-s * 0.2, s * 0.8, 0, s); c.quadraticCurveTo(s * 0.2, s * 0.8, s * 0.44, s * 0.36); c.bezierCurveTo(s * 0.72, -s * 0.2, s * 0.72, -s * 0.9, s * 0.24, -s); c.closePath(); c.fill(); }
// a five-petal cherry blossom of radius r
function japan_flower(c, x, y, r, rot, col, mid) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; for (var i = 0; i < 5; i++) { c.save(); c.rotate(i * Math.PI * 2 / 5); c.translate(0, -r * 0.5); japan_petal(c, r * 0.5); c.restore(); } c.fillStyle = mid; c.beginPath(); c.arc(0, 0, r * 0.18, 0, 7); c.fill(); c.restore(); }
// a red-crowned crane in flight, facing +x, s about a fifth of its length; flap -1 (down) .. 1 (up)
function japan_crane(c, x, y, s, flap, dk) {
  var white = dk ? '#E8E6F4' : '#FFFFFF', blk = dk ? '#16142A' : '#22202C', grey = dk ? '#B8B6CC' : '#D8DCE6';
  c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
  // the far wing, a shade darker, then the body; the near wing goes over it
  var wy = -30 * s * flap, wy2 = -24 * s * flap, wing = function (dy, col, tip) { c.fillStyle = col; c.beginPath(); c.moveTo(-9 * s, -1 * s); c.quadraticCurveTo(-14 * s, dy * 0.55, -20 * s, dy); c.quadraticCurveTo(-4 * s, dy * 0.9, 9 * s, -1.5 * s); c.closePath(); c.fill();
    c.fillStyle = tip; c.beginPath(); c.moveTo(-20 * s, dy); c.quadraticCurveTo(-14 * s, dy * 0.55, -9 * s, -1 * s); c.lineTo(-4 * s, -1 * s); c.quadraticCurveTo(-10 * s, dy * 0.5, -12 * s, dy * 0.92); c.closePath(); c.fill(); };
  wing(wy2, grey, dk ? '#2A2838' : '#4A4858');
  // legs trailing behind, the black tail plumes
  c.strokeStyle = blk; c.lineWidth = 1.3 * s; c.beginPath(); c.moveTo(-12 * s, 2 * s); c.lineTo(-34 * s, 4 * s); c.moveTo(-12 * s, 3 * s); c.lineTo(-33 * s, 6 * s); c.stroke();
  c.fillStyle = blk; c.beginPath(); c.moveTo(-12 * s, -3 * s); c.quadraticCurveTo(-24 * s, -1 * s, -22 * s, 4 * s); c.quadraticCurveTo(-16 * s, 4 * s, -10 * s, 3 * s); c.closePath(); c.fill();
  // body, neck and head (black neck, white cheek, red crown)
  c.fillStyle = white; c.beginPath(); c.ellipse(-1 * s, 0, 15 * s, 5.6 * s, -0.05, 0, 7); c.fill();
  c.strokeStyle = blk; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(10 * s, -1.5 * s); c.quadraticCurveTo(22 * s, -3 * s, 31 * s, -3.6 * s); c.stroke();
  c.fillStyle = blk; c.beginPath(); c.ellipse(33 * s, -3.8 * s, 3.4 * s, 2.4 * s, 0, 0, 7); c.fill();
  c.fillStyle = white; c.beginPath(); c.ellipse(30 * s, -3 * s, 1.6 * s, 1.1 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#E8303A'; c.beginPath(); c.arc(33.4 * s, -5.6 * s, 1.3 * s, 0, 7); c.fill();
  c.strokeStyle = dk ? '#8A8A70' : '#9A9A7A'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(36 * s, -3.6 * s); c.lineTo(43 * s, -2.6 * s); c.stroke();
  wing(wy, white, blk);
  c.restore(); }

// ---------- Japan
// Loop: blossom petals drift on the breeze and settle on the river, the cherry branches sway, clouds slide across Fuji's
// shoulder, a grey heron wades by the bridge and the koinobori carp ripple on their pole in town. Night: the paper lanterns
// on the stair path glow, town windows light up, the moon rises beside Fuji and the river holds its reflection.
// Moment: Fuji's snowcap blushes pink in the alpenglow, a gust lifts a swirl of blossom off the trees, and a pair of
// red-crowned cranes flies across the mountain.
ENGINES.japan = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, C = A.C, M = A.moon, F = A.fuji, T0 = -99, i, gust = 0;
  var hx = japan_ctx();
  // the sky behind everything near: above the foothills and the pagoda hill, not over the pagoda
  var skyClip = new Path2D(), hp = A.horizon; skyClip.moveTo(hp[0][0], -60); hp.forEach(function (p) { skyClip.lineTo(p[0], p[1]); }); skyClip.lineTo(hp[hp.length - 1][0], -60); skyClip.closePath();
  var pt = A.ptop; skyClip.rect(pt[0], pt[1], pt[2] - pt[0], pt[3] - pt[1]);
  var river = new Path2D(japan_pg(A.river)), snow = new Path2D(japan_pg(F.snow)), fuji = new Path2D(japan_pg(F.body.concat([[F.body[F.body.length - 1][0], F.base], [F.body[0][0], F.base]])));
  var glowM = japan_rg(dk ? 'rgba(255,236,200,0.5)' : 'rgba(255,255,255,0.4)', [0.3, 0.22]), winG = japan_rg('rgba(255,196,110,0.55)', [0.35, 0.3]), lanG = japan_rg(dk ? 'rgba(255,170,90,0.75)' : 'rgba(255,200,140,0.4)', [0.3, 0.3]);
  var moonSpr = japan_sprite(M[2] * 2.2, M[2] * 2.2, 2, function (o) { var r = M[2], g = o.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFFF6'); g.addColorStop(0.75, '#FFF2D0'); g.addColorStop(1, '#F4DCA4'); o.fillStyle = g; o.beginPath(); o.arc(0, 0, r, 0, 7); o.fill();
    o.fillStyle = 'rgba(214,190,140,0.3)'; [[-0.3, -0.2, 0.2], [0.28, 0.22, 0.16], [0.05, -0.45, 0.1], [-0.15, 0.42, 0.12]].forEach(function (q) { o.beginPath(); o.arc(q[0] * r, q[1] * r, q[2] * r, 0, 7); o.fill(); }); });
  var CLD = japan_sprite(240, 56, 1.5, function (o) { o.fillStyle = dk ? 'rgba(150,146,200,0.75)' : 'rgba(255,255,255,0.9)'; [[-80, 8, 44, 10], [-26, 0, 54, 16], [34, 4, 50, 13], [88, 10, 28, 7], [0, 12, 100, 8]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); });
    o.fillStyle = dk ? 'rgba(220,200,240,0.3)' : 'rgba(255,236,242,0.7)'; o.beginPath(); o.ellipse(-20, -8, 44, 5, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (k) { return {x: F.x - F.bw * 0.8 + hash(k + 3) * F.bw * 1.8, y: F.top + F.hf * (0.32 + k * 0.1), s: (ph ? 0.6 : 1) * (0.75 + hash(k + 7) * 0.5), v: (5 + hash(k + 5) * 6) * (ph ? 0.6 : 1)}; });
  // the swaying branches: painted once into sprites, rotated about where they leave the edge
  var BR = A.branch, flowerCols = dk ? ['#D896BA', '#E8B0CC', '#C47EA8'] : ['#F7B4C8', '#FFD0DE', '#F29CB8'];
  function branchSprite(len, seed) { var sc = 2;
    return japan_sprite(len * 2.3, len * 1.0, sc, function (o) { o.translate(-len * 1.15, -len * 0.3);
      o.fillStyle = C.trunk; o.strokeStyle = C.trunk; o.lineCap = 'round';
      var limb = function (x0, y0, x1, y1, w0, w1, b) { var n = 12; for (var k = 0; k < n; k++) { var u = k / n, u2 = (k + 1) / n, bx = Math.sin(Math.PI * u) * b, bx2 = Math.sin(Math.PI * u2) * b; o.lineWidth = w0 + (w1 - w0) * u; o.beginPath(); o.moveTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + bx); o.lineTo(x0 + (x1 - x0) * u2, y0 + (y1 - y0) * u2 + bx2); o.stroke(); } };
      limb(0, 0, len, len * 0.2, 16 * S, 3 * S, -len * 0.06); limb(len * 0.35, len * 0.08, len * 0.6, len * 0.32, 7 * S, 2 * S, len * 0.03); limb(len * 0.6, len * 0.14, len * 0.85, len * 0.05, 5 * S, 1.6 * S, -len * 0.02); limb(len * 0.2, len * 0.05, len * 0.32, len * 0.24, 5 * S, 1.6 * S, 4 * S);
      var spots = [[0.5, 0.17], [0.62, 0.3], [0.75, 0.2], [0.9, 0.2], [0.82, 0.07], [0.38, 0.12], [0.28, 0.2], [0.55, 0.08], [0.98, 0.21], [0.68, 0.12]];
      spots.forEach(function (q, n) { var cx = len * q[0], cy = len * q[1]; for (var k = 0; k < 9; k++) { var a = hash(seed + n * 9 + k) * 6.28, d = hash(seed + n * 5 + k * 3) * 16 * S; japan_flower(o, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, (6 + hash(seed + k + n) * 4) * S, a, flowerCols[k % 3], dk ? '#8A3A60' : '#D0507A'); } });
      for (var k = 0; k < 14; k++) { o.fillStyle = dk ? '#5A6A40' : '#8AB860'; o.save(); o.translate(len * (0.3 + hash(seed + k * 7) * 0.65), len * (0.1 + hash(seed + k * 3) * 0.2)); o.rotate(hash(k) * 6); o.beginPath(); o.ellipse(4 * S, 0, 4 * S, 1.8 * S, 0, 0, 7); o.fill(); o.restore(); }
    }); }
  var branches = [{x: BR.x, y: BR.y, len: BR.len, ang: 0.1, ph: 0, spr: branchSprite(BR.len, 11)}];
  if (!ph) branches.push({x: W + 12, y: -4, len: BR.len * 0.6, ang: Math.PI - 0.5, ph: 2, flip: true, spr: branchSprite(BR.len * 0.6, 29)});
  // petals: falling ones (on top), and ones that have landed and float downstream
  var fall = [], floatP = [], N = ph ? 22 : 42, trees = A.trees;
  function newPetal(top) { var tr = trees[Math.floor(Math.random() * trees.length)], fromBr = Math.random() < 0.45;
    var x = fromBr ? BR.x + Math.random() * BR.len : tr[0] + (Math.random() - 0.5) * tr[2] * 2, y = fromBr ? BR.y + Math.random() * BR.len * 0.25 : tr[1] + (Math.random() - 0.5) * tr[3];
    if (top) { x = Math.random() * W * 0.8; y = -10 - Math.random() * H * 0.3; }
    return {x: x, y: y, vx: 10 + Math.random() * 16, vy: 12 + Math.random() * 12, s: (ph ? 3 : 4) * S * (0.7 + Math.random() * 0.6), ph: Math.random() * 6.28, sp: 1 + Math.random() * 2, c: flowerCols[Math.floor(Math.random() * 3)], land: H * (0.82 + Math.random() * 0.16)}; }
  for (i = 0; i < N; i++) { var p0 = newPetal(i % 2 === 0); p0.y = Math.random() * H; p0.x = Math.random() * W; fall.push(p0); }
  for (i = 0; i < (ph ? 5 : 9); i++) floatP.push({x: A.U[Math.floor(hash(i + 2) * A.U.length)][0] + 30, y: A.U[Math.floor(hash(i + 2) * A.U.length)][1] + 14 + hash(i) * 30, age: hash(i + 5) * 10, s: (ph ? 3 : 4) * S, c: flowerCols[i % 3], rot: hash(i) * 6});
  // the heron
  var her = {x: A.heron[0], y: A.heron[1], dir: -1, step: 0, peck: 0, next: 4};
  function heron(c, t) { var s = (ph ? 0.9 : 1.25) * S, x = her.x, y = her.y, ph2 = Math.sin(her.step * 3.2), pk = japan_ease(Math.min(1, her.peck * 2)) * japan_ease(Math.min(1, (1 - her.peck) * 3)), d = her.dir;
    c.save(); c.translate(x, y); c.scale(d, 1); c.lineCap = 'round'; c.lineJoin = 'round';
    var grey = dk ? '#7A7C9A' : '#9AA2B4', dgrey = dk ? '#4E5070' : '#6A7084', wht = dk ? '#C8C8DC' : '#F4F4F8', leg = dk ? '#8A8460' : '#C8B070';
    c.strokeStyle = leg; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(-2 * s, -22 * s); c.lineTo(-3 * s + ph2 * 3 * s, 0); c.moveTo(1 * s, -22 * s); c.lineTo(2 * s - ph2 * 3 * s, -Math.max(0, ph2) * 3 * s); c.stroke();
    c.fillStyle = grey; c.beginPath(); c.moveTo(-14 * s, -24 * s); c.quadraticCurveTo(-4 * s, -40 * s, 8 * s, -34 * s); c.quadraticCurveTo(6 * s, -22 * s, -4 * s, -21 * s); c.closePath(); c.fill();
    c.fillStyle = dgrey; c.beginPath(); c.moveTo(-12 * s, -27 * s); c.quadraticCurveTo(-2 * s, -36 * s, 6 * s, -32 * s); c.quadraticCurveTo(0, -27 * s, -12 * s, -27 * s); c.fill();
    var hx2 = 10 * s + pk * 10 * s, hy = -52 * s + pk * 46 * s;
    c.strokeStyle = wht; c.lineWidth = 3.4 * s; c.beginPath(); c.moveTo(6 * s, -33 * s); c.bezierCurveTo(14 * s, -38 * s - pk * 2 * s, 2 * s + pk * 12 * s, -44 * s + pk * 30 * s, hx2, hy); c.stroke();
    c.fillStyle = wht; c.beginPath(); c.ellipse(hx2 + 1 * s, hy, 3.4 * s, 2.6 * s, 0.2 + pk * 1.2, 0, 7); c.fill();
    c.strokeStyle = '#E2B040'; c.lineWidth = 1.8 * s; c.beginPath(); c.moveTo(hx2 + 3 * s, hy); c.lineTo(hx2 + 3 * s + Math.cos(0.15 + pk * 1.3) * 11 * s, hy + Math.sin(0.15 + pk * 1.3) * 11 * s); c.stroke();
    c.strokeStyle = '#22202C'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(hx2 - 1 * s, hy - 1.6 * s); c.lineTo(hx2 - 9 * s, hy - 3 * s + pk * 4 * s); c.stroke();
    c.fillStyle = '#22202C'; c.beginPath(); c.arc(hx2 + 1.6 * s, hy - 0.6 * s, 0.8 * s, 0, 7); c.fill();
    c.restore(); }
  // the koinobori: a streamer and three carp on a tall pole
  var K = A.koi, koiCols = [['#2E2E3E', '#E8E4F0'], ['#D8402E', '#FFE0D0'], ['#3A78C8', '#E0F0FF']];
  function carp(c, x, y, L, hgt, cols, t, ph3) { var n = 14, up = [], lo = [], k;
    for (k = 0; k <= n; k++) { var u = k / n, wv = Math.sin(t * 4.4 - u * 5 + ph3) * hgt * 0.45 * u + u * hgt * 0.5 * (0.6 + 0.4 * Math.sin(t * 0.7 + ph3)), w = hgt * 0.5 * (1 - 0.25 * u) * (0.85 + 0.15 * Math.sin(t * 6 - u * 7 + ph3)); up.push([x + u * L, y + wv - w]); lo.unshift([x + u * L, y + wv + w]); }
    var tw = Math.sin(t * 4.4 - 5 + ph3) * hgt * 0.45 + hgt * 0.5, tx = x + L;
    c.fillStyle = cols[0]; c.beginPath(); c.moveTo(up[0][0], up[0][1]); up.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(tx + hgt * 0.5, y + tw - hgt * 0.7); c.lineTo(tx + hgt * 0.15, y + tw); c.lineTo(tx + hgt * 0.5, y + tw + hgt * 0.7); lo.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.closePath(); c.fill();
    c.strokeStyle = cols[1]; c.globalAlpha = 0.55; c.lineWidth = Math.max(0.8, hgt * 0.08); c.beginPath(); for (k = 3; k < n; k += 2) { c.moveTo(up[k][0], up[k][1] + hgt * 0.2); c.quadraticCurveTo(up[k][0] + hgt * 0.25, (up[k][1] + lo[n - k][1]) / 2, lo[n - k][0], lo[n - k][1] - hgt * 0.2); } c.stroke(); c.globalAlpha = 1;
    c.fillStyle = cols[1]; c.beginPath(); c.arc(x + hgt * 0.45, y - hgt * 0.05, hgt * 0.26, 0, 7); c.fill(); c.fillStyle = '#1A1820'; c.beginPath(); c.arc(x + hgt * 0.45, y - hgt * 0.05, hgt * 0.13, 0, 7); c.fill();
    c.strokeStyle = cols[1]; c.lineWidth = Math.max(1, hgt * 0.1); c.beginPath(); c.moveTo(x + 0.5, y - hgt * 0.5); c.lineTo(x + 0.5, y + hgt * 0.5); c.stroke(); }
  function koinobori(c, t) { var x = K[0], y0 = K[1], h = K[2], s = h / 120;
    c.strokeStyle = dk ? '#2A2830' : '#5A4A40'; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 - h); c.stroke();
    c.fillStyle = '#E6B23A'; c.beginPath(); c.arc(x, y0 - h - 3 * s, 3 * s, 0, 7); c.fill();
    c.save(); c.translate(x, y0 - h + 3 * s); c.rotate(t * 3); c.strokeStyle = '#E6B23A'; c.lineWidth = 1.2 * s; for (var k = 0; k < 4; k++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-5 * s, 0); c.lineTo(5 * s, 0); c.stroke(); } c.restore();
    // the five-coloured streamer
    ['#3A78C8', '#F2F2F2', '#D8402E', '#F2C23A', '#3A9A5A'].forEach(function (col, k) { c.strokeStyle = col; c.lineWidth = 2.4 * s; c.beginPath(); for (var j = 0; j <= 10; j++) { var u = j / 10, xx = x + u * 34 * s, yy = y0 - h + 9 * s + k * 2.3 * s + Math.sin(t * 5 - u * 6 + k * 0.3) * 3 * s * u + u * 4 * s; if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); });
    carp(c, x + 1, y0 - h + 26 * s, 46 * s, 12 * s, koiCols[0], t, 0); carp(c, x + 1, y0 - h + 46 * s, 38 * s, 10 * s, koiCols[1], t, 1.1); carp(c, x + 1, y0 - h + 63 * s, 31 * s, 8 * s, koiCols[2], t, 2.3); }
  // the bridge, mirrored into the water
  var B = A.bridge, bL = B[1] - B[0];
  function bridgeRefl(c, t) { c.save(); c.globalAlpha = dk ? 0.28 : 0.3; c.strokeStyle = C.red; c.lineWidth = B[4] * 1.1;
    for (var band = 0; band < 2; band++) { c.beginPath(); for (var j = 0; j <= 30; j++) { var u = j / 30, yy = B[2] + B[3] * (1 - Math.pow(2 * u - 1, 2)) * 0.8 + (band ? 14 * S : 2 * S) + Math.sin(t * 2 + u * 20) * 1.2, xx = B[0] + bL * u + Math.sin(t * 1.6 + u * 14 + band) * 1.5; if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); } if (band) { c.lineWidth = 1.6 * S; } c.stroke(); }
    c.restore(); }
  // the paper lanterns on the stair path, and the stone lanterns' windows
  var PL = A.paper, SL = A.stone;
  function paperLantern(c, x, y, s, t, k) { var sw = Math.sin(t * 1.3 + k * 1.7) * 0.07 + Math.sin(t * 0.5 + k) * 0.04, L = 6 * s;
    c.save(); c.translate(x, y); c.rotate(sw); c.strokeStyle = '#2A2228'; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, L); c.stroke(); c.translate(0, L + 7 * s);
    var lit = dk ? 0.85 + 0.15 * flick(t, k * 1.9) : 0;
    var g = c.createLinearGradient(-6 * s, 0, 6 * s, 0); g.addColorStop(0, dk ? 'rgba(255,170,90,1)' : '#F2E6DA'); g.addColorStop(0.5, dk ? '#FFE6B0' : '#FFFAF2'); g.addColorStop(1, dk ? 'rgba(240,140,70,1)' : '#E6D6C6');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 5.4 * s, 7.4 * s, 0, 0, 7); c.fill();
    c.fillStyle = dk ? 'rgba(220,60,40,0.75)' : '#D8402E'; c.fillRect(-5 * s, -1.6 * s, 10 * s, 3.2 * s);
    c.strokeStyle = dk ? 'rgba(160,70,30,0.5)' : 'rgba(120,90,70,0.35)'; c.lineWidth = 0.6 * s; c.beginPath(); for (var j = -2; j <= 2; j++) { if (!j) continue; c.moveTo(-5.2 * s * Math.sqrt(1 - j * j / 9), j * 2.4 * s); c.lineTo(5.2 * s * Math.sqrt(1 - j * j / 9), j * 2.4 * s); } c.stroke();
    c.fillStyle = '#2A2228'; c.fillRect(-2.6 * s, -8.6 * s, 5.2 * s, 2 * s); c.fillRect(-2.6 * s, 6.8 * s, 5.2 * s, 2 * s);
    c.restore(); return lit; }
  // cranes for the moment
  var cranes = [];
  return {
    step: function (dt, t, f) {
      gust = Math.max(0, japan_env(t - T0, 0.4, 1.4, 4.5, 7.5));
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 200) c.x = -200; });
      // the heron: a few slow steps, a pause, sometimes a peck at the water
      her.next -= dt * f.s; if (her.peck > 0) { her.peck += dt * 0.7; if (her.peck >= 1) her.peck = 0; }
      else if (her.walk > 0) { her.walk -= dt * f.s; her.step += dt * f.s; her.x += her.dir * 6 * S * dt * f.s; if (Math.abs(her.x - A.heron[0]) > 40 * S) her.dir = her.x > A.heron[0] ? -1 : 1; }
      else if (her.next <= 0) { her.next = 3 + Math.random() * 4; if (Math.random() < 0.4) her.peck = 0.001; else { her.walk = 1.6 + Math.random() * 2; if (Math.random() < 0.3) her.dir = -her.dir; } }
      // petals
      var wind = 1 + gust * 2.5;
      fall.forEach(function (p) { if (p.gust) { if (t < p.t0) return; var g2 = Math.max(gust, 0.25); p.x += (p.vx * g2 + Math.sin(t * p.sp + p.ph) * 70 * g2) * dt * f.s; p.y += (p.vy - p.lift * g2 + Math.cos(t * p.sp + p.ph) * 60 * g2) * dt * f.s; p.ph += dt * f.s * 1.2; }
        else { p.x += (p.vx * wind + Math.sin(t * p.sp + p.ph) * 14) * dt * f.s; p.y += (p.vy * (1 - gust * 0.5)) * dt * f.s; p.ph += dt * f.s * 0.6; }
        if (!p.gust && p.y > p.land && hx.isPointInPath(river, p.x, p.y)) { floatP.push({x: p.x, y: p.y, age: 0, s: p.s, c: p.c, rot: p.ph}); Object.assign(p, newPetal(false)); }
        else if (p.y > H + 20 || p.x > W + 30 || p.y < -H * 0.6) { if (p.gust) p.dead = true; else Object.assign(p, newPetal(Math.random() < 0.4)); } });
      fall = fall.filter(function (p) { return !p.dead; });
      floatP.forEach(function (p) { p.age += dt * f.s; p.x -= 9 * S * dt * f.s; p.y += 4.5 * S * dt * f.s; p.rot += dt * 0.2; });
      floatP = floatP.filter(function (p) { return p.age < 26 && hx.isPointInPath(river, p.x, p.y); });
      if (floatP.length < (ph ? 4 : 7) && Math.random() < dt * 0.4) { var j = Math.floor(Math.random() * A.U.length * 0.6); floatP.push({x: A.U[j][0] + 10, y: A.U[j][1] + 10 + Math.random() * 20, age: 0, s: (ph ? 3 : 4) * S, c: flowerCols[0], rot: Math.random() * 6}); }
      cranes.forEach(function (c) { c.x += c.v * dt * f.s; });
      cranes = cranes.filter(function (c) { return c.x < W + 160; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, glowK = japan_env(T, 0.2, 2.2, 7, 10.5), k;
      // ---- canvas A: the sky things over the mountain (clipped to the sky), the town, the river
      ca.save(); ca.clip(skyClip, 'evenodd');
      if (dk) { var rise = japan_ease(Math.min(1, t / 14)), my = M[1] + H * 0.16 * (1 - rise);
        ca.save(); ca.globalCompositeOperation = 'lighter'; japan_dot(ca, glowM, M[0], my, M[2] * 4, 0.55 + 0.05 * Math.sin(tt * 0.6)); ca.restore();
        ca.drawImage(moonSpr, M[0] - moonSpr.w / 2, my - moonSpr.h / 2, moonSpr.w, moonSpr.h); }
      // alpenglow: the snow and then the whole cone flush rose-pink, strongest on the sunlit (west) side
      if (glowK > 0) { ca.save(); ca.globalAlpha = glowK * (dk ? 0.42 : 0.55); var gg = ca.createLinearGradient(0, F.top, 0, F.ys + F.hf * 0.16); gg.addColorStop(0, 'rgba(255,120,150,0.75)'); gg.addColorStop(0.5, 'rgba(255,150,170,0.5)'); gg.addColorStop(1, 'rgba(255,190,200,0.15)'); ca.fillStyle = gg; ca.fill(snow); ca.globalAlpha = glowK * (dk ? 0.14 : 0.18); ca.fillStyle = '#F08AA6'; ca.fill(fuji); ca.restore(); }
      clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 120 * c.s, c.y - 28 * c.s, 240 * c.s, 56 * c.s); });
      ca.restore();
      cranes.forEach(function (c) { var y = c.y + Math.sin(c.x * 0.01 + c.ph) * 10 * S, fl = Math.sin(tt * 4.2 + c.ph); japan_crane(ca, c.x, y, c.s, fl, dk); });
      // town windows lighting up at night, a few at a time
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; A.wins.forEach(function (w) { var on = japan_ease((t - w[4] * 8) / 1.2) * (w[4] < 0.82 ? 1 : 0) * (Math.sin(t * 0.07 + w[4] * 90) > 0.93 ? 0.15 : 1); if (on <= 0) return; ca.fillStyle = 'rgba(255,200,110,' + (0.9 * on) + ')'; ca.fillRect(w[0], w[1], w[2], w[3]); japan_dot(ca, winG, w[0] + w[2] / 2, w[1] + w[3] / 2, w[3] * 2.2, on * 0.6); }); ca.restore(); }
      koinobori(ca, tt);
      // the river: glints by day, the moon's path by night, the bridge's reflection, floating petals, the heron
      ca.save(); ca.clip(river);
      bridgeRefl(ca, tt);
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; var top = A.U.reduce(function (m, p) { return Math.abs(p[0] - M[0]) < Math.abs(m[0] - M[0]) ? p : m; }, A.U[0])[1];
        for (k = 0; k < 14; k++) { var yy = top + 4 + k * 5 * S, w = M[2] * (0.9 + k * 0.08) * (0.6 + 0.4 * Math.sin(tt * 1.4 + k * 1.9)), xx = M[0] + Math.sin(tt * 0.9 + k) * 4; ca.fillStyle = 'rgba(255,236,190,' + Math.max(0, 0.42 - k * 0.025) * japan_ease(Math.min(1, t / 14)) + ')'; ca.fillRect(xx - w / 2, yy, w, 1.8 * S); } ca.restore(); }
      else { for (k = 0; k < 18; k++) { var gx = W * hash(k * 3.3), gy = H * (0.72 + hash(k * 7.1) * 0.28), ga = Math.max(0, Math.sin(tt * (0.8 + hash(k) * 0.8) + k * 2.1)); if (ga > 0.3) { ca.fillStyle = 'rgba(255,255,255,' + (ga - 0.3) * 1.2 + ')'; ca.beginPath(); ca.ellipse(gx, gy, 5 * S * ga, 1 * S, 0, 0, 7); ca.fill(); } } }
      floatP.forEach(function (p) { var a = Math.min(1, p.age * 2, (26 - p.age) / 4); ca.globalAlpha = a; ca.strokeStyle = dk ? 'rgba(200,210,255,0.35)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 0.8; ca.beginPath(); ca.ellipse(p.x, p.y + 1, p.s * 1.8 * (1 + (p.age % 3) * 0.3), p.s * 0.5, 0, 0, 7); ca.stroke(); ca.fillStyle = p.c; ca.save(); ca.translate(p.x, p.y); ca.rotate(p.rot); ca.scale(1, 0.55); japan_petal(ca, p.s); ca.restore(); }); ca.globalAlpha = 1;
      // the heron's reflection and ripples, then the heron
      ca.save(); ca.globalAlpha = 0.25; ca.translate(0, her.y * 2 + 2); ca.scale(1, -1); heron(ca, tt); ca.restore();
      ca.strokeStyle = dk ? 'rgba(200,210,255,0.3)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1; for (k = 0; k < 2; k++) { var ru = (tt * 0.5 + k * 0.5) % 1; ca.globalAlpha = 1 - ru; ca.beginPath(); ca.ellipse(her.x, her.y + 1, 6 * S + ru * 16 * S, 1.5 * S + ru * 3 * S, 0, 0, 7); ca.stroke(); } ca.globalAlpha = 1;
      ca.restore();
      heron(ca, tt);
      // ---- canvas B: lanterns, branches and falling petals over everything
      SL.forEach(function (l, k2) { if (!dk) return; cb.save(); cb.globalCompositeOperation = 'lighter'; japan_dot(cb, lanG, l[0], l[1], 14 * l[2], 0.7 + 0.2 * flick(tt, k2 + 5)); cb.fillStyle = 'rgba(255,200,120,0.8)'; cb.fillRect(l[0] - 3 * l[2], l[1] - 3 * l[2], 6 * l[2], 6 * l[2]); cb.restore(); });
      PL.forEach(function (p) { var lit = paperLantern(cb, p[0], p[1], p[2], tt, p[3]); if (lit > 0) { cb.save(); cb.globalCompositeOperation = 'lighter'; japan_dot(cb, lanG, p[0], p[1] + 13 * p[2], 24 * p[2], lit * 0.8); cb.restore(); } });
      branches.forEach(function (b) { var sw = (Math.sin(tt * 0.9 + b.ph) * 0.025 + Math.sin(tt * 2.1 + b.ph * 2) * 0.008) * f.a + gust * 0.05 * Math.sin(tt * 5 + b.ph); cb.save(); cb.translate(b.x, b.y); if (b.flip) { cb.scale(-1, 1); } cb.rotate((b.flip ? 0.42 : 0) + sw); cb.drawImage(b.spr, -b.spr.w / 2 + b.len * 1.15, -b.spr.h / 2 + b.len * 0.3, b.spr.w, b.spr.h); cb.restore(); });
      fall.forEach(function (p) { if (p.gust && t < p.t0) return; cb.save(); cb.translate(p.x, p.y); cb.rotate(p.ph * 0.7); cb.scale(Math.cos(p.ph * 2.2), 1); cb.fillStyle = p.c; japan_petal(cb, p.s); cb.restore(); });
    },
    finish: function (t) { T0 = t;
      // the gust: a big swirl of blossom lifted off the trees
      for (var k = 0; k < (ph ? 70 : 140); k++) { var p = newPetal(false); p.gust = true; p.t0 = t + 0.3 + Math.random() * 1.6; p.vx = 50 + Math.random() * 70; p.vy = -10 + Math.random() * 20; p.lift = 25 + Math.random() * 45; p.sp = 1.5 + Math.random() * 2.5; p.s *= 1.1; fall.push(p); }
      // two red-crowned cranes across the mountain
      var cy = F.top + F.hf * (ph ? 0.32 : 0.24), s = (ph ? 0.9 : 1.6) * S;
      cranes.push({x: -40, y: cy, v: (ph ? 70 : 130) * S, s: s, ph: 0}, {x: -210, y: cy + 50 * S, v: (ph ? 70 : 130) * S, s: s * 0.86, ph: 1.4}); }
  };
};
UIC.japan = {L: ['#34477A', '#22305A', 'rgba(255,252,252,0.86)', '#26233A', '#6A6478', '#C8442E', '#C8442E', '#D8607A', '#FFFFFF'], D: ['#2A2D5A', '#14183A', 'rgba(24,26,60,0.8)', '#F4F0FA', '#B9B4D6', '#F4A0B8', '#F4A0B8', '#F8C8A8', '#1A1838']};
