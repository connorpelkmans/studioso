// ---- world theme: italy (Amalfi Coast)
// Shared helpers. Every shape here is drawn clockwise (like rect()), so shapes that share a layer slot always merge.
function italy_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function italy_pg(p) { return poly(italy_area(p) < 0 ? p.slice().reverse() : p); }
function italy_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function italy_c(x, y, r) { return italy_e(x, y, r, r); }
function italy_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// a window with a round arched top: x, y top-left, w wide, h tall
function italy_arch(x, y, w, h) { var p = [[x, y + h], [x, y + w / 2]], r = w / 2; for (var i = 1; i < 8; i++) { var a = Math.PI + i / 8 * Math.PI; p.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); } p.push([x + w, y + w / 2], [x + w, y + h]); return italy_pg(p); }
// a dome (half ellipse) standing on (x, y), r wide, h tall, with a little point on top
function italy_dome(x, y, r, h) { var p = []; for (var i = 0; i <= 20; i++) { var a = Math.PI * i / 20; p.push([x - Math.cos(a) * r, y - Math.sin(a) * h - Math.pow(Math.sin(a), 12) * h * 0.08]); } return italy_pg(p); }
// a cypress: a tall slim flame from the ground (x, y)
function italy_cypress(x, y, h, w) { var p = []; for (var i = 0; i <= 12; i++) { var u = i / 12; p.push([x - w * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - u * 0.25), y - u * h]); } for (i = 11; i > 0; i--) { u = i / 12; p.push([x + w * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - u * 0.25), y - u * h]); } return italy_pg(p); }
// a bougainvillea clump: little magenta bracts round (x, y)
function italy_bougain(x, y, r, rnd) { var d = '', n = Math.max(5, Math.round(r * 1.1)); for (var i = 0; i < n; i++) { var a = rnd() * 6.28, q = Math.sqrt(rnd()) * r; d += italy_c(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.75, r * (0.16 + rnd() * 0.14)); } return d; }
// a tuft of scrub: three overlapping blobs
function italy_tuft(x, y, r, k) { return italy_e(x, y, r * 1.3, r * 0.8) + italy_e(x - r * (0.8 + k * 0.4), y + r * 0.25, r * 0.85, r * 0.6) + italy_e(x + r * 0.9, y + r * 0.2, r * 0.75, r * 0.55); }
// a crescent moon (lit side to the lower left): the disc (x, y, r) minus a disc moved up and right
function italy_cres(x, y, r) { var qx = x + r * 0.42, qy = y - r * 0.3, qr = r * 0.86, p = [], i, a, q = [];
  for (i = 0; i <= 72; i++) { a = i / 72 * Math.PI * 2; var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (Math.hypot(px - qx, py - qy) > qr) p.push([px, py, a]); }
  p.sort(function (m, n) { return ((m[2] - 5.66 + 6.283) % 6.283) - ((n[2] - 5.66 + 6.283) % 6.283); });
  for (i = 0; i <= 72; i++) { a = i / 72 * Math.PI * 2; var ix = qx + Math.cos(a) * qr, iy = qy + Math.sin(a) * qr; if (Math.hypot(ix - x, iy - y) < r) q.push([ix, iy, a]); }
  q.sort(function (m, n) { return ((n[2] - 5.66 + 6.283) % 6.283) - ((m[2] - 5.66 + 6.283) % 6.283); });
  return italy_pg(p.map(function (m) { return [m[0], m[1]]; }).concat(q.map(function (m) { return [m[0], m[1]]; }))); }
// a striped beach umbrella: canopy of n wedges, the even ones in one slot and the odd ones in another
function italy_umb(x, y, r, n) { var A = '', B = '', h = r * 0.55; for (var i = 0; i < n; i++) { var p = [[x, y - h]]; for (var k = 0; k <= 6; k++) { var u = (i + k / 6) / n; p.push([x - r + 2 * r * u, y + Math.sin(Math.PI * u) * h * 0.16 + Math.sin(Math.PI * k / 6) * h * 0.14]); } var s = italy_pg(p); if (i % 2) B += s; else A += s; } return [A, B]; }

// ---------------------------------------------------------------- Amalfi Coast
// A Positano-style village of pastel houses stacked up a steep slope above a turquoise cove: a church with a tiled majolica
// dome and a bell tower, lemon terraces under their pergolas, the coast road with its stone wall across the top, a pebble
// beach with striped umbrellas at the foot, and a far headland and little islands across the bay. Houses never overlap:
// each row stands on the roofline of the row in front, so the pastel slots never have to paint over each other.
// The waves, boats, gulls, laundry, shutters, lemons, bells, window glows, scooter and sailboat are the engine's.
var italy_C = {
  L: {glow: 'rgba(255,250,228,0.85)', haze: 'rgba(255,242,224,0.75)', fcoast: '#B5C8DA', head: '#93AFC3', mtn: '#86A584', sea: '#2A93BC', cove: '#45C4CC', slope: '#B9AE86', green: '#76985A', road: '#A89E94', speck: 'rgba(255,255,255,0.9)', shine: 'rgba(255,255,255,0.7)', strata: 'rgba(96,74,50,0.28)',
    stone: '#EADDC6', pink: '#F3B5AE', yellow: '#F7D68C', cream: '#FCF3E4', peach: '#F5C39A', terra: '#D9785A', win: '#5C4A50', shade: 'rgba(90,50,60,0.17)', rail: '#4A3A3E', line: 'rgba(255,255,255,0.75)',
    pebble: '#DCD1C2', speckle: 'rgba(110,92,80,0.32)', leaf: '#3F7C4A', white: '#FFFDF8', umb: '#E8644A', bougain: '#D8337E', maj: '#2C9A70', lemon: '#F7CB34', wood: '#7A5A44', net: 'rgba(60,70,60,0.35)'},
  D: {glow: 'rgba(190,200,255,0.3)', haze: 'rgba(140,110,160,0.35)', fcoast: '#2C3462', head: '#29325E', mtn: '#1C2A42', sea: '#12244A', cove: '#183C62', slope: '#38384E', green: '#223646', road: '#3C3C54', speck: 'rgba(255,244,220,0.85)', shine: 'rgba(200,220,255,0.28)', strata: 'rgba(0,0,10,0.3)',
    stone: '#6E6E88', pink: '#8C6C88', yellow: '#9A8A7C', cream: '#9EA2BA', peach: '#9A7C86', terra: '#7C4C52', win: '#FFD27A', shade: 'rgba(14,12,36,0.34)', rail: '#1E1A2A', line: 'rgba(255,255,255,0.14)',
    pebble: '#4A4A62', speckle: 'rgba(0,0,10,0.28)', leaf: '#1E3C36', white: '#C9CDDE', umb: '#A84E4E', bougain: '#9C2C68', maj: '#1E6C58', lemon: '#DAB240', wood: '#3A2A2A', net: 'rgba(0,0,0,0.35)'}
};
SCENES.italy = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = italy_C[dk ? 'D' : 'L'], i, j, x, y, k;
  var S = ph ? 0.78 : Math.max(0.6, Math.min(1.15, H / 820));
  var sky = dk ? 'linear-gradient(180deg,#101C3A 0%,#22305A 34%,#5A3C5E 58%,#3A3058 100%)' : 'linear-gradient(180deg,#9FD3F0 0%,#DDF0F7 36%,#FCEBD0 56%,#F6E2C4 100%)';
  var hz = H * (ph ? 0.4 : 0.47), yV = H * (ph ? 0.85 : 0.8), ridgeY = H * (ph ? 0.15 : 0.07);
  var xT = W * (ph ? 0.58 : 0.53), xB = W * (ph ? 0.27 : 0.31), yT = ridgeY;
  // the left edge of the village slope: a rocky line from the ridge down to the beach
  function edge(y) { var u = (y - yT) / (yV - yT); return xT + (xB - xT) * u + 9 * S * Math.sin(u * 7.3) + 4 * S * Math.sin(u * 19 + 1); }
  // the sun (or the moon), haze at the horizon, a far coast across the bay
  var sun = [W * (ph ? 0.2 : 0.2), H * (ph ? 0.24 : 0.14), (ph ? 34 : 48) * S];
  add(far, 'a', italy_c(sun[0], sun[1], sun[2] * (dk ? 2.4 : 2.9)), C.glow);
  add(far, 'b', italy_e(W * 0.4, hz - 4, W * 0.75, H * 0.05), C.haze);
  add(far, 'c', below(ridge(W, hz - H * 0.018, [[H * 0.012, 70, 0.4], [H * 0.006, 23, 1.3]], 8, true).map(function (p) { return [p[0], p[1] + (p[0] > W * 0.55 ? 40 : 0)]; }), hz + 3), C.fcoast);
  var stars = ''; if (dk) spread(0, 0, W, hz - 20, 34, 30, rnd, 1).forEach(function (c) { if (c.q < 0.32 && Math.hypot(c.x - sun[0], c.y - sun[1]) > sun[2] * 1.7 && !(c.x > edge(c.y) - 10 && c.y > ridgeY - 30)) stars += italy_c(c.x, c.y, 0.5 + c.r * 0.9); });
  // the far headland on the left with a little watchtower at its tip, and the little islands out in the bay
  var hd = [[-20, hz - H * 0.085], [W * 0.05, hz - H * 0.09], [W * 0.12, hz - H * 0.06], [W * 0.2, hz - H * 0.035], [W * (ph ? 0.3 : 0.27), hz - H * 0.006], [W * (ph ? 0.31 : 0.28), hz + 2], [-20, hz + 2]];
  var head = italy_pg(hd), tw = W * (ph ? 0.29 : 0.262), th = hz - H * 0.012, specks = '', road = '';
  head += italy_e(W * (ph ? 0.42 : 0.36), hz, 14 * S, 6 * S) + italy_e(W * (ph ? 0.47 : 0.385), hz, 8 * S, 4 * S) + italy_e(W * (ph ? 0.5 : 0.405), hz, 5 * S, 2.6 * S);
  road += rect(tw - 3 * S, th - 9 * S, 6 * S, 10 * S);
  for (i = 0; i < 9; i++) { x = W * (0.02 + i * 0.022); y = hz - H * 0.08 + i * H * 0.005 + (i % 3) * 2; if (!dk) specks += rect(x, y, 2.4 * S, 1.8 * S); else if (i % 2) stars += italy_c(x, y + 1, 0.9); }
  add(bg, 'a', head, C.head);
  // the green mountain behind the village
  var mt = [[W * 0.18, hz + 2], [W * 0.26, hz - H * 0.06], [W * 0.34, hz - H * 0.15], [W * 0.42, hz - H * 0.27], [W * 0.5, ridgeY - H * 0.02], [W * 0.62, ridgeY - H * 0.07], [W * 0.78, ridgeY - H * 0.05], [W * 0.9, ridgeY - H * 0.1], [W + 30, ridgeY - H * 0.09], [W + 30, hz + 2]];
  if (ph) mt = [[W * 0.1, hz + 2], [W * 0.22, hz - H * 0.07], [W * 0.36, hz - H * 0.16], [W * 0.5, ridgeY - H * 0.02], [W * 0.66, ridgeY - H * 0.05], [W * 0.84, ridgeY - H * 0.03], [W + 30, ridgeY - H * 0.06], [W + 30, hz + 2]];
  add(bg, 'b', italy_pg(mt), C.mtn);
  // the sea: deep blue out in the bay, turquoise in the cove, with glints
  var cove = [[-20, yV - H * (ph ? 0.12 : 0.1)]]; for (x = 0; x <= W + 20; x += 20) cove.push([x, yV - H * (ph ? 0.12 : 0.1) + Math.sin(x / 70) * 6 * S - (x / W) * H * 0.06]); cove.push([W + 20, H + 10], [-20, H + 10]);
  add(bg, 'c', rect(-20, hz, W + 40, H - hz + 20), C.sea); add(bg, 'd', italy_pg(cove), C.cove);
  var shine = ''; spread(0, hz + 6, W, H - hz, ph ? 70 : 110, 16, rnd, 1).forEach(function (c) { if (c.q < 0.5 && c.x < edge(Math.min(c.y, yV)) - 30) { var L = (10 + c.r * 26) * (0.5 + (c.y - hz) / H); shine += seg(c.x, c.y, c.x + L, c.y); } });
  stk(bg, 's', shine, C.shine, 1.2);
  // the village slope, its scrub, rock lines at the cliff edge
  var sl = []; for (y = yT; y <= yV; y += 8) sl.push([edge(y), y]); sl.push([edge(yV) - 6, yV + 4], [W + 20, yV + 8], [W + 20, ridgeY - H * 0.04]);
  for (x = W; x > edge(yT); x -= 24) sl.push([x, ridgeY - H * 0.02 + Math.sin(x / 50) * 6 * S - (x - edge(yT)) / W * H * 0.03]);
  add(bg, 'e', italy_pg(sl), C.slope);
  var scrub = '', strata = '';
  spread(W * 0.15, ridgeY - H * 0.12, W * 0.85, hz - ridgeY + H * 0.12, 26, 18, rnd, 1).forEach(function (c) { if (c.q < 0.55 && c.x < edge(c.y) - 12 && c.y < hz - 6 && italy_yOn([[W * 0.18, hz], [W * 0.5, ridgeY]], c.x) < c.y) scrub += italy_tuft(c.x, c.y, (3 + c.r * 4) * S, c.k); });
  spread(xB - 20, ridgeY, W - xB + 20, yV - ridgeY, 22, 16, rnd, 1).forEach(function (c) { if (c.x > edge(c.y) + 6 && c.q < 0.7) scrub += italy_tuft(c.x, c.y, (3 + c.r * 4) * S, c.k); });
  for (y = yT + 10; y < yV - 6; y += 13 * S) { x = edge(y); strata += seg(x + 3, y, x + (14 + rnd() * 18) * S, y + 5 * S); }
  add(bg, 'f', scrub, C.green); stk(bg, 't', strata, C.strata, 1.4);
  // the coast road across the top of the village, cut into the slope
  var roadY = H * (ph ? 0.25 : 0.2), rw = 9 * S, rp = [];
  for (x = edge(roadY) + 2; x <= W + 30; x += 10) rp.push([x, roadY + (x - edge(roadY)) * 0.045 + Math.sin(x / 90) * 3 * S]);
  var rpoly = rp.map(function (p) { return [p[0], p[1] - rw / 2]; }).concat(rp.slice().reverse().map(function (p) { return [p[0], p[1] + rw / 2]; }));
  road += italy_pg(rpoly);
  add(bg, 'g', road, C.road); specks += dk ? italy_cres(sun[0], sun[1], sun[2] * 0.62) : italy_c(sun[0], sun[1], sun[2] * 0.7);
  add(bg, 'h', specks + stars, C.speck);
  function roadAt(x) { return italy_yOn(rp, x); }

  // ---- the village
  var gap = (ph ? 30 : 34) * S, walls = {b: '', c: '', d: '', e: '', f: ''}, stone = '', win = '', shade = '', rail = '', line = '';
  var leaf = '', white = '', umb = '', boug = '', maj = '', lem = '', wood = '', net = '', peb = '', speck = '', wins = [], shutA = [], lemons = [], cols = ['b', 'c', 'd', 'e', 'b', 'c', 'e', 'd', 'f'];
  var res = [];   // reserved areas (church, lemon terraces): no houses there
  var free = function (x0, y0, x1, y1) { for (var q = 0; q < res.length; q++) { var r = res[q]; if (x1 > r[0] && x0 < r[2] && y1 > r[1] && y0 < r[3]) return false; } return true; };
  // the church: a bell tower, a cream facade and the majolica dome, a few rows up from the beach
  var cr = ph ? 4 : 3, cy = yV - cr * gap, cx = edge(cy) + (W - edge(cy)) * (ph ? 0.5 : 0.3), cw = (ph ? 50 : 66) * S, ch = gap * 2.5;
  var dR = cw * 0.42, dX = cx + cw * 0.28, drumY = cy - ch - 2 * S, tX = cx - cw * 0.5 - 13 * S, tW = 22 * S, tH = gap * 3.5;
  res.push([tX - tW / 2 - 6 * S, cy - Math.max(tH + 14 * S, ch + dR * 1.25 + 12 * S), dX + dR + 8 * S, cy + 1]);
  // facade with a pediment, a rose window and a door; the dome on its drum behind it
  walls.d += rect(cx - cw / 2, cy - ch, cw, ch) + italy_pg([[cx - cw / 2 - 2 * S, cy - ch], [cx, cy - ch - 15 * S], [cx + cw / 2 + 2 * S, cy - ch]]);
  walls.d += rect(dX - dR * 0.78, drumY - 9 * S, dR * 1.56, 11 * S);
  shade += rect(cx + cw * 0.36, cy - ch, cw * 0.14, ch) + rect(cx - cw / 2, cy - ch + 3 * S, cw, 2.4 * S) + rect(dX + dR * 0.45, drumY - 9 * S, dR * 0.33, 11 * S);
  win += italy_c(cx, cy - ch + 13 * S, 6 * S) + italy_arch(cx - 7 * S, cy - 22 * S, 14 * S, 22 * S) + italy_arch(cx - cw * 0.36, cy - ch * 0.6, 6 * S, 13 * S) + italy_arch(cx + cw * 0.26, cy - ch * 0.6, 6 * S, 13 * S);
  for (i = -2; i <= 2; i++) win += italy_arch(dX + i * dR * 0.28 - 2 * S, drumY - 7 * S, 4 * S, 7 * S);
  line += 'M' + PT(cx - cw / 2 - 2 * S, cy - ch) + ' L' + PT(cx, cy - ch - 15 * S) + ' L' + PT(cx + cw / 2 + 2 * S, cy - ch) + ' ' + italy_c(cx, cy - ch + 13 * S, 6 * S) + seg(cx - cw / 2, cy - ch + 1, cx + cw / 2, cy - ch + 1) + seg(cx - 6 * S, cy - ch + 13 * S, cx + 6 * S, cy - ch + 13 * S) + seg(cx, cy - ch + 7 * S, cx, cy - ch + 19 * S);
  for (i = 0; i < 3; i++) stone += rect(cx - 10 * S - i * 4 * S, cy - 3 * S + i * 2.2 * S, 20 * S + i * 8 * S, 2.6 * S);
  // the majolica dome: green tiles with a lattice of yellow diamonds and gold ribs, a white lantern on top
  maj += italy_dome(dX, drumY - 9 * S, dR, dR * 1.05);
  var dia = ''; for (j = 0; j < 5; j++) for (i = -6; i <= 6; i++) { var qx = dX + (i + (j % 2) * 0.5) * dR * 0.27, qy = drumY - 9 * S - dR * 0.16 - j * dR * 0.2, qr = dR * 0.085, ex = (qx - dX) / dR, ey = (drumY - 9 * S - qy) / (dR * 1.05); if (ex * ex + ey * ey < 0.78) dia += italy_pg([[qx, qy - qr * 1.3], [qx + qr, qy], [qx, qy + qr * 1.3], [qx - qr, qy]]); }
  lem += dia + rect(dX - dR, drumY - 9 * S - 1.6 * S, dR * 2, 2.2 * S);
  white += rect(dX - 3.4 * S, drumY - 9 * S - dR * 1.12 - 8 * S, 6.8 * S, 9 * S) + italy_dome(dX, drumY - 9 * S - dR * 1.12 - 8 * S, 4.4 * S, 4.6 * S) + italy_c(dX, drumY - 9 * S - dR * 1.12 - 15 * S, 1.8 * S);
  // the bell tower: two arched openings for the bells (the engine's), a small tiled cap
  walls.d += rect(tX - tW / 2, cy - tH, tW, tH);
  shade += rect(tX + tW * 0.24, cy - tH, tW * 0.26, tH);
  win += italy_arch(tX - tW * 0.4, cy - tH + 7 * S, tW * 0.36, 14 * S) + italy_arch(tX + tW * 0.04, cy - tH + 7 * S, tW * 0.36, 14 * S) + italy_arch(tX - 3 * S, cy - tH * 0.5, 6 * S, 10 * S);
  line += seg(tX - tW / 2, cy - tH + 4 * S, tX + tW / 2, cy - tH + 4 * S) + seg(tX - tW / 2, cy - tH + 23 * S, tX + tW / 2, cy - tH + 23 * S);
  maj += italy_dome(tX, cy - tH, tW * 0.56, 10 * S); lem += italy_c(tX, cy - tH - 11.5 * S, 2.2 * S);
  var bells = [[tX - tW * 0.22, cy - tH + 10 * S], [tX + tW * 0.22, cy - tH + 10 * S]];
  // the lemon terraces: stone retaining walls, lemon trees, and a pergola of poles and nets over them
  var lt0 = roadY + rw + 6 * S, ltRows = ph ? 5 : 6, lw = W * (ph ? 0.26 : 0.15);
  for (k = 0; k < ltRows; k++) {
    var yb = lt0 + (k + 1) * gap * 0.92, x0 = edge(yb - gap * 0.9) + 2, x1 = x0 + lw + k * 4 * S;
    res.push([x0 - 4, yb - gap * 0.92, x1, yb]);
    stone += italy_pg([[edge(yb) + 1, yb - 4 * S], [x1, yb - 4 * S], [x1, yb + 1], [edge(yb) + 1, yb + 1]]);
    for (x = x0 + 8 * S; x < x1 - 6 * S; x += 17 * S) { var ty = yb - 4 * S - 9 * S, trx = (7 + rnd() * 2) * S;
      leaf += italy_e(x, ty, trx, 7 * S) + italy_e(x - 4 * S, ty + 2 * S, 5 * S, 4.5 * S) + italy_e(x + 4.5 * S, ty + 1.5 * S, 5 * S, 4.6 * S);
      wood += seg(x, yb - 4 * S, x, ty + 3 * S);
      for (i = 0; i < 4; i++) lemons.push([x + (rnd() - 0.5) * trx * 1.6, ty + (rnd() - 0.3) * 6 * S, 1.9 * S]); }
    for (x = x0; x <= x1; x += 26 * S) wood += seg(x, yb - 4 * S, x, yb - gap * 0.8);
    wood += seg(x0, yb - gap * 0.8, x1, yb - gap * 0.8);
    for (x = x0 + 4 * S; x < x1; x += 7 * S) net += seg(x, yb - gap * 0.8, x + 5 * S, yb - gap * 0.8 + 2.2 * S);
  }
  // rows of houses, from the beach up to the road
  var row = 0, roadBot = function (x) { return roadAt(x) + rw / 2 + 4 * S; };
  for (yb = yV; yb - gap * 0.55 > roadY; yb -= gap, row++) {
    x = edge(yb - gap * 0.9) + 2 + rnd() * 8 * S;
    while (x < W + 10) {
      var w = (ph ? (22 + rnd() * 30) : (28 + rnd() * 42)) * S, top = yb - gap * (0.74 + rnd() * 0.26), skipG = rnd() < 0.1;
      if (row > 0 && rnd() < 0.5) top = yb - gap;   // most houses fill their row, so the rows read as one stacked town
      var lim = roadBot(x + w); if (top < lim) top = lim;
      var h = yb - top;
      if (skipG || h < gap * 0.5 || !free(x, top, x + w, yb) || x < edge(top) - 1) { if (rnd() < 0.3) { leaf += italy_tuft(x + w * 0.4, yb - 5 * S, 5 * S, 0.5); boug += italy_bougain(x + w * 0.4, yb - 7 * S, 5 * S, rnd); } x += w * (skipG ? 0.6 : 0.4); continue; }
      var col = cols[Math.floor(rnd() * cols.length)], pitched = rnd() < 0.28 && h > 20 * S, rh = pitched ? Math.min(8 * S, h * 0.26) : 0;
      walls[col] += rect(x, top + rh, w, h - rh);
      if (pitched) walls.f += italy_pg([[x - 2 * S, top + rh + 1], [x + w * 0.2, top], [x + w * 0.8, top], [x + w + 2 * S, top + rh + 1]]);
      else { line += seg(x, top + 1.2 * S, x + w, top + 1.2 * S); shade += rect(x, top + 2.4 * S, w, 1.8 * S); }
      shade += rect(x + w * 0.84, top + rh, w * 0.16, h - rh);
      // windows: a grid of arched windows; shutters, balconies and flowers on some
      var nc = Math.max(1, Math.floor(w / (15 * S))), nr = h > 24 * S ? 2 : 1, ww = 5 * S, wh = 8.5 * S, dx = w * 0.84 / nc;
      for (j = 0; j < nr; j++) { var wy = top + rh + (h - rh) * (nr === 1 ? 0.3 : (j === 0 ? 0.16 : 0.56)), bal = rnd() < 0.3;
        for (i = 0; i < nc; i++) { var wx = x + dx * (i + 0.5) - ww / 2, door = row === 0 && j === nr - 1 && i === 0 && rnd() < 0.5, kind = rnd();
          if (door) { win += italy_arch(wx - 1 * S, yb - 13 * S, ww + 2 * S, 13 * S); continue; }
          if (kind < 0.18) { maj += rect(wx, wy, ww, wh); continue; }   // shutters closed
          var lit = !dk || rnd() < 0.62; if (lit) win += italy_arch(wx, wy, ww, wh); else shade += italy_arch(wx, wy, ww, wh);
          if (dk && lit) wins.push([wx + ww / 2, wy + wh / 2, ww]);
          if (kind < 0.62) { if (shutA.length < (ph ? 4 : 7) && kind < 0.24 && rnd() < 0.5 && wy > H * 0.3) shutA.push([wx, wy, ww, wh]); else maj += rect(wx - ww * 0.55, wy, ww * 0.5, wh) + rect(wx + ww * 1.05, wy, ww * 0.5, wh); }
        }
        if (bal) { var by0 = wy + wh + 0.5 * S; rail += seg(x + 2 * S, by0, x + w * 0.8, by0); for (var px2 = x + 3 * S; px2 < x + w * 0.8; px2 += 3 * S) rail += seg(px2, by0, px2, by0 + 4 * S); line += seg(x + 1 * S, by0 + 4.6 * S, x + w * 0.82, by0 + 4.6 * S); }
      }
      if (rnd() < 0.2) { boug += italy_bougain(x + (rnd() < 0.5 ? 2 * S : w - 2 * S), top + rh + 3 * S, (5 + rnd() * 4) * S, rnd); }
      x += w + (rnd() < 0.3 ? (2 + rnd() * 10) * S : 0);
    }
  }
  // a few houses, cypresses and stone pines above the road
  for (x = edge(roadY) + 30 * S; x < W - 10; x += (40 + rnd() * 70) * S) { var rt = roadAt(x) - rw / 2 - 1, w2 = (24 + rnd() * 26) * S, h2 = (16 + rnd() * 10) * S;
    if (rnd() < 0.55 && rt - h2 > ridgeY + 4) { var c2 = cols[Math.floor(rnd() * 4)]; walls[c2] += rect(x, rt - h2, w2, h2); shade += rect(x + w2 * 0.84, rt - h2, w2 * 0.16, h2); line += seg(x, rt - h2 + 1.2 * S, x + w2, rt - h2 + 1.2 * S); for (i = 0; i < Math.max(1, Math.floor(w2 / (15 * S))); i++) win += italy_arch(x + 5 * S + i * 15 * S, rt - h2 + 5 * S, 5 * S, 8 * S); }
    else if (rnd() < 0.5) leaf += italy_cypress(x, rt + 1, (26 + rnd() * 14) * S, 5 * S);
    else { leaf += italy_e(x, rt - 22 * S, 18 * S, 6.5 * S) + italy_e(x - 9 * S, rt - 20 * S, 9 * S, 5 * S) + italy_e(x + 10 * S, rt - 21 * S, 10 * S, 5 * S); wood += 'M' + PT(x, rt) + ' Q' + PT(x - 2 * S, rt - 12 * S) + ' ' + PT(x + 3 * S, rt - 20 * S) + ' '; }
  }
  // cypresses by the church and at the cliff edge
  [[tX - tW / 2 - 7 * S, cy, 46], [edge(yV - gap * 2) + 8 * S, yV - gap * 2 + 2, 34], [edge(yV - gap * 5) + 6 * S, yV - gap * 5 + 1, 30]].forEach(function (q) { leaf += italy_cypress(q[0], q[1], q[2] * S, 5.4 * S); });
  // the road's stone wall on its downhill side
  var wall = italy_pg(rp.map(function (p) { return [p[0], p[1] + rw / 2]; }).concat(rp.slice().reverse().map(function (p) { return [p[0], p[1] + rw / 2 + 3.4 * S]; })));
  rp.forEach(function (p, q) { if (q % 4 === 0) wall += rect(p[0] - 1.6 * S, p[1] + rw / 2 - 1.6 * S, 3.2 * S, 5 * S); });
  white += wall;
  // the promenade wall at the top of the beach
  stone += italy_pg([[edge(yV) - 4, yV - 2 * S], [W + 20, yV - 2 * S], [W + 20, yV + 5 * S], [edge(yV) - 2, yV + 5 * S]]);
  var bx1 = W * (ph ? 0.26 : 0.17), byT = H * (ph ? 0.9 : 0.885), bal2 = rect(-20, byT, bx1 + 20, 6 * S) + rect(-20, H - 10 * S, bx1 + 20, 12 * S);
  // ---- the pebble beach: from the promenade down to the shore, umbrellas in rows, two boats pulled up
  var sx0 = edge(yV) - 4, sh = [];
  for (k = 0; k <= 16; k++) { var u = k / 16; sh.push([sx0 + (W * (ph ? 0.12 : 0.4) - sx0) * Math.pow(u, 0.8) + Math.sin(u * Math.PI) * W * (ph ? 0.04 : 0.06), yV + 4 * S + (H + 12 - yV) * u]); }
  peb += italy_pg([[sx0, yV + 2 * S]].concat(sh.slice(1), [[W + 20, H + 12], [W + 20, yV + 2 * S]]));
  spread(sx0 - 40, yV + 6 * S, W - sx0 + 40, H - yV, 9, 6, rnd, 1).forEach(function (c) { var xs = italy_yOn(sh.map(function (p) { return [p[1], p[0]]; }), c.y); if (c.x > xs + 4 && c.q < 0.55) speck += italy_e(c.x, c.y, (1 + c.r * 1.4) * S, (0.7 + c.k) * S); });
  var shore = sh.map(function (p) { return [p[0], p[1]]; });
  var uRows = ph ? [[0.42, 0.42], [0.8, 0.1]] : [[0.4, 0.3], [0.86, 0.1]];
  var uBase = [], pIdx = 0;
  uRows.forEach(function (rw2, q) { var yy = yV + (H - yV) * rw2[0], xs = italy_yOn(sh.map(function (p) { return [p[1], p[0]]; }), yy), step = (ph ? 46 : 84) * S;
    for (x = Math.max(xs + (q ? 70 : 120) * (ph ? 0.6 : 1) * S, bx1 + 30 * S); x < W - 10 * S; x += step) { var ur = (ph ? 15 : 21) * S * (0.9 + q * 0.12), um = italy_umb(x, yy - ur * 1.25, ur, 8);
      wood += seg(x, yy - ur * 1.25 - ur * 0.5, x, yy) + seg(x, yy - ur * 1.25 - ur * 0.55, x, yy - ur * 1.25 - ur * 0.7); speck += italy_e(x + ur * 0.4, yy + 1.5 * S, ur * 0.9, ur * 0.22);
      if ((pIdx++) % 3 === 1) { maj += um[0]; white += um[1]; } else if (pIdx % 4 === 0) { lem += um[0]; white += um[1]; } else { umb += um[0]; white += um[1]; }
      var lx2 = x + ur * 0.15, lc = (pIdx % 3); white += italy_pg([[lx2, yy - 2 * S], [lx2 + ur * 1.1, yy - 2 * S], [lx2 + ur * 1.1, yy + 0.6 * S], [lx2, yy + 0.6 * S]]) + italy_pg([[lx2 + ur * 1.1, yy - 2 * S], [lx2 + ur * 1.45, yy - 7 * S], [lx2 + ur * 1.55, yy - 6 * S], [lx2 + ur * 1.25, yy + 0.6 * S]]);
      wood += seg(lx2 + 2 * S, yy + 0.6 * S, lx2 + 2 * S, yy + 2.6 * S) + seg(lx2 + ur * 1.05, yy + 0.6 * S, lx2 + ur * 1.05, yy + 2.6 * S);
      var tw2 = italy_pg([[x - ur * 1.25, yy - 1 * S], [x - ur * 0.35, yy - 2.4 * S], [x - ur * 0.15, yy + 3.6 * S], [x - ur * 1.05, yy + 5 * S]]); if (lc === 0) umb += tw2; else if (lc === 1) maj += tw2; else lem += tw2;
      uBase.push([x, yy]); } });
  // boats pulled up on the pebbles near the shore
  var bp = ph ? [[0.2, 0]] : [[0.16, 0], [0.62, 0.05]];
  bp.forEach(function (q) { var yy = yV + (H - yV) * q[0], xs = italy_yOn(sh.map(function (p) { return [p[1], p[0]]; }), yy) + q[1] * W + 34 * S, L = 26 * S * (ph ? 0.8 : 1);
    white += italy_pg([[xs - L, yy - 6 * S], [xs + L, yy - 7.5 * S], [xs + L * 0.78, yy + 1 * S], [xs - L * 0.8, yy + 1.5 * S]]);
    maj += italy_pg([[xs - L * 0.96, yy - 3.4 * S], [xs + L * 0.94, yy - 4.4 * S], [xs + L * 0.9, yy - 2.4 * S], [xs - L * 0.92, yy - 1.4 * S]]);
    wood += seg(xs - L, yy - 6 * S, xs + L, yy - 7.5 * S); speck += italy_e(xs, yy + 2.5 * S, L * 0.9, 2 * S); });
  // ---- the foreground: a bougainvillea branch from the top corner and a terrace balustrade with a potted lemon tree
  var fb = [[-20, H * (ph ? 0.16 : 0.03)], [W * 0.06, H * (ph ? 0.165 : 0.05)], [W * (ph ? 0.18 : 0.12), H * (ph ? 0.19 : 0.085)], [W * (ph ? 0.3 : 0.19), H * (ph ? 0.18 : 0.08)]];
  wood += 'M' + PT(fb[0][0], fb[0][1]) + ' Q' + PT(fb[1][0], fb[1][1]) + ' ' + PT(fb[2][0], fb[2][1]) + ' T' + PT(fb[3][0], fb[3][1]) + ' ';
  fb.slice(1).forEach(function (p, q) { for (i = 0; i < 9; i++) { var lx = p[0] - 30 * S + i * 8 * S, ly = p[1] + ((i * 7) % 5 - 1) * 3 * S; leaf += italy_e(lx, ly, 8 * S, 4.6 * S) + italy_e(lx + 3 * S, ly + 5 * S, 6 * S, 3.6 * S); if (i % 2 === 0) boug += italy_bougain(lx + 3 * S, ly + 4 * S, 10 * S, rnd); }
    for (i = 0; i < 2; i++) { var vx = p[0] - 12 * S + i * 20 * S, vl = (26 + rnd() * 26) * S; wood += 'M' + PT(vx, p[1]) + ' Q' + PT(vx + 6 * S, p[1] + vl * 0.5) + ' ' + PT(vx + 2 * S, p[1] + vl) + ' '; boug += italy_bougain(vx + 2 * S, p[1] + vl, 7 * S, rnd) + italy_bougain(vx + 4 * S, p[1] + vl * 0.5, 5 * S, rnd); leaf += italy_e(vx + 4 * S, p[1] + vl * 0.3, 4.4 * S, 2.6 * S) + italy_e(vx + 5 * S, p[1] + vl * 0.72, 4 * S, 2.4 * S); } });
  for (x = 2 * S; x < bx1 - 6 * S; x += 15 * S) { var bh = H - 10 * S - byT - 6 * S, b0 = byT + 6 * S; bal2 += italy_pg([[x + 3 * S, b0], [x + 9 * S, b0], [x + 8 * S, b0 + bh * 0.12], [x + 11.6 * S, b0 + bh * 0.55], [x + 9 * S, b0 + bh * 0.88], [x + 10 * S, b0 + bh], [x + 2 * S, b0 + bh], [x + 3 * S, b0 + bh * 0.88], [x + 0.4 * S, b0 + bh * 0.55], [x + 4 * S, b0 + bh * 0.12]]); }
  walls.d += bal2;   // the balustrade in the cream stone slot (behind the pot and flowers, softer than white at night)
  var pX = bx1 - 22 * S, pY = byT, pot = italy_pg([[pX - 12 * S, pY - 18 * S], [pX + 12 * S, pY - 18 * S], [pX + 9 * S, pY], [pX - 9 * S, pY]]) + rect(pX - 13.5 * S, pY - 21 * S, 27 * S, 4 * S);
  umb += pot; wood += seg(pX, pY - 21 * S, pX, pY - 34 * S);
  leaf += italy_e(pX, pY - 44 * S, 20 * S, 15 * S) + italy_e(pX - 14 * S, pY - 38 * S, 11 * S, 9 * S) + italy_e(pX + 14 * S, pY - 39 * S, 12 * S, 9 * S) + italy_e(pX + 2 * S, pY - 56 * S, 12 * S, 8 * S);
  for (i = 0; i < 9; i++) { var a3 = hash(i + 31) * 6.28, d3 = 0.4 + hash(i + 37) * 0.55; lemons.push([pX + Math.cos(a3) * d3 * 20 * S, pY - 44 * S + Math.sin(a3) * d3 * 14 * S, 3.2 * S]); }
  boug += italy_bougain(bx1 * 0.35, byT - 3 * S, 12 * S, rnd) + italy_bougain(bx1 * 0.12, byT + 2 * S, 9 * S, rnd);
  // lemons: in the still scene they are drawn here; the engine sways them
  if (!ANIM) lemons.forEach(function (l) { lem += italy_e(l[0], l[1], l[2] * 1.15, l[2] * 0.85); });
  if (!ANIM) shutA.forEach(function (s) { maj += rect(s[0] - s[2] * 0.55, s[1], s[2] * 0.5, s[3]) + rect(s[0] + s[2] * 1.05, s[1], s[2] * 0.5, s[3]); });
  add(mid, 'a', stone, C.stone); add(mid, 'b', walls.b, C.pink); add(mid, 'c', walls.c, C.yellow); add(mid, 'd', walls.d, C.cream); add(mid, 'e', walls.e, C.peach); add(mid, 'f', walls.f, C.terra); add(mid, 'g', win, C.win); add(mid, 'h', shade, C.shade);
  stk(mid, 's', rail, C.rail, 0.9); stk(mid, 't', line, C.line, 1);
  add(near, 'a', peb, C.pebble); add(near, 'b', speck, C.speckle); add(near, 'c', leaf, C.leaf); add(near, 'd', white, C.white); add(near, 'e', umb, C.umb); add(near, 'f', boug, C.bougain); add(near, 'g', maj, C.maj); add(near, 'h', lem, C.lemon);
  stk(near, 's', wood, C.wood, 1.4 * S); stk(near, 't', net, C.net, 0.8);
  if (ANIM) { ANIM.edgeFn = edge; ANIM.shoreX = function (y) { return y <= yV ? edge(yV) : italy_yOn(sh.map(function (p) { return [p[1], p[0]]; }), y); }; ANIM.C = C; ANIM.S = S; ANIM.hz = hz; ANIM.yV = yV; ANIM.sun = sun; ANIM.shore = shore; ANIM.road = rp; ANIM.edge = [edge(hz + 10), edge(yV)]; ANIM.bells = bells; ANIM.dome = [dX, drumY - 9 * S - dR * 0.5, dR]; ANIM.wins = wins; ANIM.shut = shutA; ANIM.lemons = lemons; ANIM.gap = gap;
    ANIM.church = [cx, cy - ch * 0.5, cw]; ANIM.ldry = (function () { var y0 = yV - gap * (ph ? 6.4 : 5.4), x0 = edge(y0) + (W - edge(y0)) * (ph ? 0.68 : 0.62); return [x0, y0, (ph ? 44 : 58) * S]; })(); }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
