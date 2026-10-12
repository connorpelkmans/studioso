// ---- world theme: morocco (Morocco)
// A Marrakech riad courtyard seen through a carved horseshoe arch: zellige walls and floor, an arcade with sheer curtains,
// a tiled fountain, glazed pots with orange trees, a rug with cushions and mint tea, and above the walls the red city,
// a square minaret, palms and the snowy Atlas. Every shape here is drawn clockwise (like rect() and rrect()), so shapes
// that share a layer slot merge instead of punching holes in each other.
function morocco_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function morocco_pg(p) { return poly(morocco_area(p) < 0 ? p.slice().reverse() : p); }
// the same outline wound the other way: inside a clockwise shape of the same slot it cuts a hole
function morocco_hole(p) { return poly(morocco_area(p) > 0 ? p.slice().reverse() : p); }
function morocco_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function morocco_c(x, y, r) { return morocco_e(x, y, r, r); }
function morocco_ep(x, y, rx, ry, n) { var p = []; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; p.push([x + Math.cos(t) * rx, y + Math.sin(t) * ry]); } return p; }
// an n-point star (inner radius k * r), squashed vertically by sq (perspective), turned by rot radians
function morocco_starPts(x, y, r, k, n, rot, sq) { var p = []; for (var i = 0; i < n * 2; i++) { var a = (rot || 0) - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r * k : r; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q * (sq || 1)]); } return p; }
function morocco_star(x, y, r, k, n, rot, sq) { return morocco_pg(morocco_starPts(x, y, r, k, n, rot, sq)); }
function morocco_dia(x, y, rx, ry) { return morocco_pg([[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y]]); }
function morocco_leaf(x, y, len, w, ang) { var pts = [], i; for (i = 0; i <= 10; i++) { var t = i / 10; pts.push([t * len, w * Math.sin(Math.PI * t) * (1 - 0.3 * t)]); } for (i = 9; i > 0; i--) { var u = i / 10; pts.push([u * len, -w * Math.sin(Math.PI * u) * (1 - 0.3 * u)]); } return morocco_pg(rotp(pts, x, y, ang)); }
function morocco_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
// A horseshoe arch: the outline from the bottom left (x - w/2, yb) up, over a top h above yb, and down to the bottom right.
// horse: how far the round part swells past the jambs (1 = a plain round arch); lobes: cusped lobes along the curve (0 = none);
// ry: the vertical radius (defaults to round). Returns the points (open at the bottom).
function morocco_archPts(x, yb, w, h, horse, lobes, ld, ry) {
  var r = w / 2, rx = r * (horse || 1), al = Math.acos(Math.min(1, r / rx)), RY = ry || rx, cy = yb - h + RY, p = [[x - r, yb]], n = 48;
  for (var i = 0; i <= n; i++) { var u = i / n, ph = Math.PI + al - u * (Math.PI + 2 * al), f = 1;
    if (lobes) { var uu = Math.max(0, Math.min(1, (u - 0.04) / 0.92)); f = 1 - (ld || 0.06) * (1 - Math.pow(Math.abs(Math.sin(Math.PI * lobes * uu)), 0.7)); }
    p.push([x + Math.cos(ph) * rx * f, cy - Math.sin(ph) * RY * f]); }
  p.push([x + r, yb]); return p; }
// zellige: a band of eight-point stars (star) with small diamonds where four cells meet (dia) and outlines (line).
// cell: the wanted cell size; sq squashes it vertically (for the floor and the fountain face)
function morocco_zel(x0, y0, w, h, cell, sq) {
  var nx = Math.max(1, Math.round(w / cell)), cw = w / nx, ny = Math.max(1, Math.round(h / (cell * (sq || 1)))), ch = h / ny, r = Math.min(cw, ch / (sq || 1)) * 0.46, o = {star: '', dia: '', dot: '', line: ''}, i, j;
  for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var cx = x0 + (i + 0.5) * cw, cy = y0 + (j + 0.5) * ch, sp = morocco_starPts(cx, cy, r, 0.72, 8, Math.PI / 8, (sq || 1));
    o.star += morocco_pg(sp); o.line += poly(sp); o.dot += morocco_star(cx, cy, r * 0.34, 0.6, 8, Math.PI / 8, (sq || 1)); }
  for (j = 0; j <= ny; j++) for (i = 0; i <= nx; i++) { var dx = x0 + i * cw, dy = y0 + j * ch, dr = cw * 0.17; if (i === 0 || i === nx || j === 0 || j === ny) dr *= 0.6; o.dia += morocco_dia(dx, dy, dr, dr * (sq || 1)); }
  return o; }
// the mid-wall arcade arch with its carved cream border (out) and the dark opening (open)
var morocco_PAL = {
  L: {mtn: '#9FB6D2', snow: '#FFFFFF', cityA: '#E4A07C', cityB: '#D88E6C', mina: '#E7B48A', palm: '#6E9A5A', trunk: '#8A6446', gold: '#E2AE48',
    wall: '#F1D2AE', cream: '#FBEBD2', cob: '#2C5FA8', grn: '#2E8E6E', white: '#FFFBF2', cedar: '#8A5432', shade: 'rgba(120,60,30,0.16)', open: '#9C6450',
    rug: '#B5333F', water: '#5EC3C4', ncream: '#FFF3DE', norange: '#F2902E', nshade: 'rgba(100,50,30,0.2)', leaf: '#3F8A4A',
    grout: 'rgba(40,40,90,0.3)', carve: 'rgba(150,95,45,0.42)', wgrout: 'rgba(130,85,50,0.3)', wcarve: 'rgba(130,70,40,0.4)', haze: 'rgba(255,240,220,0.8)', glow: 'rgba(255,250,235,0.7)'},
  D: {mtn: '#2C3066', snow: '#8E94C8', cityA: '#3E2650', cityB: '#342046', mina: '#4A2C58', palm: '#24394A', trunk: '#2E2234', gold: '#E8B860',
    wall: '#30254C', cream: '#3A2E58', cob: '#1C2E66', grn: '#1A4E50', white: '#5E5890', cedar: '#2E1C2A', shade: 'rgba(10,5,30,0.3)', open: '#160F28',
    rug: '#6E2034', water: '#24506C', ncream: '#4A3E70', norange: '#D07A2A', nshade: 'rgba(5,0,20,0.35)', leaf: '#1F4A40',
    grout: 'rgba(10,5,30,0.4)', carve: 'rgba(20,10,40,0.45)', wgrout: 'rgba(10,5,30,0.35)', wcarve: 'rgba(15,8,35,0.45)', haze: 'rgba(140,90,150,0.35)', glow: 'rgba(255,220,160,0.18)'}
};
SCENES.morocco = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = morocco_PAL[dk ? 'D' : 'L'], i, j, x, y, k;
  var S = ph ? 0.72 : Math.max(0.6, Math.min(1.1, H / 820));
  var sky = dk ? 'linear-gradient(180deg,#121434 0%,#2A2156 40%,#6A3A4E 74%,#3A2A52 100%)' : 'linear-gradient(180deg,#A9D3F0 0%,#F3E6CF 44%,#F2C79A 74%,#E8B98E 100%)';
  var ARC = {cy: H * (ph ? 0.21 : 0.36), ry: H * (ph ? 0.19 : 0.33)};
  var yw = H * (ph ? 0.27 : 0.3), yf = H * (ph ? 0.64 : 0.72), yd = yf - H * (ph ? 0.07 : 0.1), pw = ph ? 12 : 44;
  // ---------------------------------------------------------------- the sky, the Atlas and the red city (soft, far)
  add(far, 'a', morocco_e(W * 0.5, yw - H * 0.05, W * 0.8, H * 0.12), C.haze);
  var sun = [W * (ph ? 0.3 : 0.24), H * (ph ? 0.13 : 0.12)];
  add(far, 'b', morocco_c(sun[0], sun[1], ph ? 70 : 120), C.glow);
  if (!dk) spread(0, H * 0.04, W, H * 0.14, ph ? 200 : 320, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.5) add(far, 'c', morocco_e(c.x, c.y, 70 + c.r * 60, 8 + c.k * 5) + morocco_e(c.x + 26, c.y - 6, 34, 7), 'rgba(255,255,255,0.8)'); });
  var stars = []; spread(0, 0, W, yw - H * 0.12, ph ? 34 : 40, ph ? 30 : 36, rnd, 1).forEach(function (c) { if (c.q < 0.45) stars.push({x: c.x, y: c.y, r: 0.6 + c.r * 1.1, k: c.k}); });
  // the Atlas: a long snowy range with ridged snowfields
  var mb = yw - H * (ph ? 0.03 : 0.04), peaks = [], mtn = [], snow = '';
  for (x = -60; x <= W + 60; x += 6) { var hgt = H * (ph ? 0.075 : 0.1) * (0.55 + 0.45 * Math.abs(Math.sin(x / (ph ? 70 : 150) + 0.6))) + H * 0.025 * Math.abs(Math.sin(x / 41 + 1.3)) + H * 0.012 * Math.sin(x / 13); mtn.push([x, mb - hgt]); }
  for (i = 2; i < mtn.length - 2; i++) if (mtn[i][1] < mtn[i - 1][1] && mtn[i][1] <= mtn[i + 1][1] && mtn[i][1] < mb - H * (ph ? 0.06 : 0.08)) peaks.push(mtn[i]);
  add(bg, 'a', below(mtn, yw + 10), C.mtn);
  peaks.forEach(function (p, q) { var sw = (mb - p[1]) * 0.9, sd = (mb - p[1]) * 0.42, pts = [], m;
    for (m = 0; m <= 12; m++) { var u = m / 12, xx = p[0] - sw / 2 + u * sw; pts.push([xx, Math.max(morocco_yOn(mtn, xx), p[1])]); }
    for (m = 12; m >= 0; m--) { u = m / 12; xx = p[0] - sw / 2 + u * sw; var lim = morocco_yOn(mtn, xx) + sd * (0.35 + 0.65 * Math.sin(Math.PI * u)) * (0.75 + 0.25 * Math.abs(Math.sin(m * 1.7 + q))); pts.push([xx, Math.max(lim, morocco_yOn(mtn, xx) + 1)]); }
    snow += morocco_pg(pts); });
  add(bg, 'b', snow, C.snow);
  // palms behind the houses (their feet hidden by the roofs)
  var palms = [[0.08, 0.2], [0.34, 0.16], [0.55, 0.19], [0.88, 0.17], [0.97, 0.21]], palmD = '', trunkD = '';
  if (ph) palms = [[0.1, 0.19], [0.62, 0.17], [0.9, 0.2]];
  palms.forEach(function (q, n) { var px = W * q[0], top = H * q[1], base = yw, lean = (n % 2 ? 1 : -1) * H * 0.01, tw = ph ? 3 : 4.4;
    trunkD += morocco_pg([[px - tw, base], [px + lean - tw * 0.6, top], [px + lean + tw * 0.6, top], [px + tw, base]]);
    for (var f = 0; f < 9; f++) { var a = -Math.PI + f / 8 * Math.PI + (f % 2 ? 0.1 : -0.06), L = (ph ? 20 : 34) * (0.8 + (f % 3) * 0.12), fr = [];
      for (var m = 0; m <= 8; m++) { var u = m / 8; fr.push([px + lean + Math.cos(a) * L * u, top + Math.sin(a) * L * u * 0.55 + u * u * L * 0.45]); }
      for (m = 2; m <= 8; m++) { var P1 = fr[m], P0 = fr[m - 1], ang = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) * 57.3, ll = (ph ? 6 : 10) * (1 - m / 12); palmD += morocco_leaf(P1[0], P1[1], ll, ll * 0.25, ang + 60) + morocco_leaf(P1[0], P1[1], ll, ll * 0.25, ang - 60); }
      palmD += morocco_leaf(px + lean, top, L * 0.5, 1.4, a * 57.3); }
    palmD += morocco_c(px + lean, top, ph ? 2.4 : 3.4); });
  // the red city: flat roofs with low parapets, little windows, and one square minaret
  var cityA = '', cityB = '', win = '', mx = W * (ph ? 0.76 : 0.71), mw = (ph ? 26 : 40) * (ph ? 1 : S), mt = H * (ph ? 0.1 : 0.075), mina = '', minG = '', minL = '';
  x = -20 + rnd() * 10; var bi = 0;
  while (x < W + 20) { var w = (ph ? 34 : 60) + rnd() * (ph ? 30 : 60), h = H * (0.03 + rnd() * (ph ? 0.035 : 0.05)), top = yw - h + H * 0.012, body = rect(x, top, w, yw - top + 6);
    for (var cr = x + 2; cr < x + w - 4; cr += ph ? 7 : 9) body += rect(cr, top - (ph ? 3 : 4), ph ? 3.4 : 4.4, (ph ? 3 : 4) + 1);
    if (Math.abs(x + w / 2 - mx) > mw) { if (bi % 2) cityB += body; else cityA += body; var nw = Math.max(1, Math.floor(w / (ph ? 16 : 22))); for (j = 0; j < nw; j++) if (rnd() < 0.7) win += rect(x + (j + 0.5) * w / nw - 2, top + h * 0.3, 4, 5); }
    bi++; x += w + (rnd() < 0.25 ? 6 : 0); }
  mina += rect(mx - mw / 2, mt, mw, yw - mt + 6) + rect(mx - mw * 0.56, mt - mw * 0.1, mw * 1.12, mw * 0.12);
  for (j = 0; j < 4; j++) mina += rect(mx - mw / 2 + j * mw * 0.27, mt - mw * 0.24, mw * 0.18, mw * 0.16);
  mina += rect(mx - mw * 0.24, mt - mw * 0.76, mw * 0.48, mw * 0.56) + rect(mx - mw * 0.28, mt - mw * 0.8, mw * 0.56, mw * 0.08);
  mina += morocco_pg(morocco_archPts(mx, mt - mw * 0.8, mw * 0.4, mw * 0.18, 1, 0, 0, mw * 0.18).slice(1, -1));
  minG += rect(mx - mw / 2, mt + mw * 0.12, mw, mw * 0.16) + rect(mx - 1, mt - mw * 1.3, 2, mw * 0.36);
  [0, 1, 2].forEach(function (q) { minG += morocco_c(mx, mt - mw * (1.04 + q * 0.11), mw * (0.075 - q * 0.015)); });
  // sebka panels (a lozenge lattice) and paired windows on the shaft
  var mh = yw - mt; for (j = 0; j < 2; j++) { var py = mt + mw * 0.45 + j * mh * 0.34, pph = mh * 0.24, lw = mw * 0.8;
    minL += rect(mx - lw / 2, py, lw, pph); for (var q = 0; q < 4; q++) { var lx = mx - lw / 2 + (q + 0.5) * lw / 4; minL += 'M' + PT(lx, py + pph) + ' L' + PT(lx - lw / 8, py + pph * 0.5) + ' L' + PT(lx, py) + ' L' + PT(lx + lw / 8, py + pph * 0.5) + ' Z '; }
    win += morocco_pg(morocco_archPts(mx - mw * 0.14, py + pph + mw * 0.32, mw * 0.14, mw * 0.24, 1.1).slice(0)) + morocco_pg(morocco_archPts(mx + mw * 0.14, py + pph + mw * 0.32, mw * 0.14, mw * 0.24, 1.1)); }
  add(bg, 'c', cityA, C.cityA); add(bg, 'd', cityB, C.cityB); add(bg, 'e', mina, C.mina); add(bg, 'f', palmD, C.palm); add(bg, 'g', trunkD + win, C.trunk); add(bg, 'h', minG, C.gold);
  stk(bg, 's', minL, dk ? 'rgba(20,10,40,0.5)' : 'rgba(150,80,50,0.5)', ph ? 0.8 : 1.1);
  // ---------------------------------------------------------------- the courtyard: back wall, arcade and the zellige floor
  var wall = rect(-10, yw, W + 20, yf - yw + 2), cream = '', cob = '', grn = '', white = '', cedar = '', shade = '', open = '', wl = '', wc = '';
  // a green tiled canopy on cedar corbels along the top of the wall
  var eh = (ph ? 10 : 16) * (ph ? 1 : S);
  grn += morocco_pg([[-10, yw - eh * 0.6], [W + 10, yw - eh * 0.6], [W + 10, yw + eh * 0.5], [-10, yw + eh * 0.5]]);
  for (x = -10; x < W + 10; x += ph ? 6 : 8) wc += seg(x, yw - eh * 0.6, x - 2, yw + eh * 0.5);
  cedar += rect(-10, yw + eh * 0.5, W + 20, eh * 0.45) + rect(-10, yw - eh * 0.75, W + 20, eh * 0.2);
  for (x = 4; x < W; x += ph ? 22 : 34) cedar += morocco_pg([[x - 4, yw + eh * 0.9], [x + 4, yw + eh * 0.9], [x + 3, yw + eh * 1.5], [x, yw + eh * 1.7], [x - 3, yw + eh * 1.5]]);
  // a carved plaster frieze under the beam (an interlaced lozenge band)
  var fy0 = yw + eh * 1.75, fy1 = fy0 + (ph ? 8 : 14) * (ph ? 1 : S), fs = ph ? 9 : 14;
  cream += rect(-10, fy0, W + 20, fy1 - fy0);
  for (x = -10; x < W + 10; x += fs) { wl += 'M' + PT(x, fy1) + ' L' + PT(x + fs / 2, fy0) + ' L' + PT(x + fs, fy1) + ' '; wl += morocco_c(x + fs / 2, (fy0 + fy1) / 2 + 1, 1.1); }
  shade += rect(-10, fy1, W + 20, (ph ? 8 : 16));
  // the arcade
  var na = ph ? 3 : 5, sp = (W - 2 * pw) / na, aw = sp * (ph ? 0.52 : 0.46), ah = (yf - fy1) * 0.8, arches = [], dado = '';
  for (i = 0; i < na; i++) { var ax = pw + (i + 0.5) * sp, bd = (ph ? 5 : 9) * (ph ? 1 : S), ap = morocco_archPts(ax, yf, aw, ah, 1.14, 7, 0.07), outer = morocco_archPts(ax, yf, aw + bd * 2, ah + bd, 1.13), afz = [ax - aw / 2 - bd * 2.2, yf - ah - bd * 2.2];
    // an alfiz (a rectangular frame around the arch) with carved spandrels and a strip of zellige above
    cob += rect(afz[0] - 4, afz[1] - 4, (ax - afz[0]) * 2 + 8, (ph ? 5 : 8));
    cream += rect(afz[0], afz[1], (ax - afz[0]) * 2, yf - afz[1]);
    white += morocco_pg(outer);
    open += morocco_pg(ap);
    for (k = 0; k < 2; k++) { var sx = k ? ax + aw * 0.38 : ax - aw * 0.38, syy = afz[1] + bd * 2.6; wl += morocco_c(sx, syy, bd * 1.2) + morocco_star(sx, syy, bd * 0.9, 0.6, 8, 0) + seg(sx - bd * 1.2, syy, k ? afz[0] + (ax - afz[0]) * 2 : afz[0], syy); }
    wl += poly(morocco_archPts(ax, yf, aw + bd * 1.1, ah + bd * 0.55, 1.135).slice(1, -1));
    // the bottom of each pier: a zellige dado
    arches.push({x: ax, w: aw, top: yf - ah, yb: yf, pts: ap}); }
  for (i = 0; i <= na; i++) { var x0 = i === 0 ? -10 : pw + i * sp - (sp - aw) / 2 + 2, x1 = i === na ? W + 10 : pw + i * sp + (sp - aw) / 2 - 2;
    if (i > 0) x0 = pw + (i - 1) * sp + sp / 2 + aw / 2 + 2; if (i < na) x1 = pw + i * sp + sp / 2 - aw / 2 - 2; if (i === 0) x0 = -10; if (i === na) x1 = W + 10;
    if (x1 - x0 < 8) continue;
    var z = morocco_zel(x0, yd, x1 - x0, yf - yd, ph ? 16 : 26 * S); cob += rect(x0, yd, x1 - x0, yf - yd); white += z.star; grn += z.dia; wl += z.line;
    cedar += rect(x0, yd - 4, x1 - x0, 4); shade += rect(x0, yd, x1 - x0, 3); }
  // the zellige floor in perspective: cream marble with cobalt and green stars at the tile corners
  var floor = rect(-10, yf, W + 20, H - yf + 10), vy = yf - H * 0.9, fl = '';
  shade += rect(-10, yf, W + 20, 5);
  var rows = []; for (y = yf + 6, k = 0; y < H + 30; k++) { rows.push(y); y += (ph ? 9 : 10) + (y - yf) * 0.24; }
  rows.forEach(function (ry, r) { var sc = (ry - vy) / (H - vy), cw = (ph ? 34 : 64) * sc, rh = (rows[r + 1] || ry + 30) - ry; fl += seg(-10, ry, W + 10, ry);
    for (var cx = W / 2 - Math.ceil(W / cw) * cw; cx < W + cw; cx += cw) { var star = (Math.round((cx - W / 2) / cw) + r) % 2 === 0, sxx = cx + cw / 2;
      if (star) { var sr = Math.min(cw * 0.2, rh * 0.75); (r % 2 ? grn += morocco_star(sxx, ry, sr, 0.62, 8, Math.PI / 8, rh / cw * 1.4) : cob += morocco_star(sxx, ry, sr, 0.62, 8, Math.PI / 8, rh / cw * 1.4)); white += morocco_star(sxx, ry, sr * 0.36, 0.6, 8, Math.PI / 8, rh / cw * 1.4); }
      fl += seg(cx, ry, cx + (cx - W / 2) * rh / (ry - vy), ry + rh); } });
  add(mid, 'a', wall, C.wall); add(mid, 'b', cream + floor, C.cream); add(mid, 'c', cob, C.cob); add(mid, 'd', grn, C.grn); add(mid, 'e', white, C.white); add(mid, 'f', cedar, C.cedar); add(mid, 'g', shade, C.shade); add(mid, 'h', open, C.open);
  stk(mid, 's', fl, C.wgrout, 1); stk(mid, 't', wl + wc, C.wcarve, ph ? 0.8 : 1.1);
  // ---------------------------------------------------------------- the near things: fountain, pots, rug, tea, candles, the arch
  var rug = '', water = '', ncob = '', ncream = '', ngrn = '', nor = '', gold = '', nsh = '', ng = '', nc = '';
  // the fountain: a twelve-lobed basin faced with zellige, a fluted pedestal and a small upper bowl
  var fx = W * (ph ? 0.5 : 0.56), fyy = H * (ph ? 0.875 : 0.89), frx = (ph ? 118 : 160) * S * (ph ? 1.25 : 1), fry = frx * 0.17, fh = (ph ? 26 : 36) * S, rim = (ph ? 6 : 9) * S;
  var lob = function (rx, ry, yy) { var p = []; for (var q = 0; q < 96; q++) { var t = q / 96 * Math.PI * 2, f = 1 + 0.035 * Math.abs(Math.cos(t * 6)); p.push([fx + Math.cos(t) * rx * f, yy + Math.sin(t) * ry * f]); } return p; };
  nsh += morocco_e(fx, fyy + fh + 4, frx * 1.08, fry * 1.25);
  var face = []; lob(frx, fry, fyy).forEach(function (p) { if (p[1] >= fyy - 0.5) face.push(p); }); face.sort(function (a, b) { return a[0] - b[0]; });
  var facePts = face.concat(face.slice().reverse().map(function (p) { return [p[0], p[1] + fh]; }));
  ncob += morocco_pg(facePts);
  var fzs = '', fzd = '', fzl = '';
  // keep the face stars inside the curved face: only the ones whose centre sits under the rim curve
  var nxF = Math.max(1, Math.round(frx * 2 / (fh * 0.85))), cwF = frx * 2 / nxF;
  for (i = 0; i < nxF; i++) { var cxF = fx - frx + (i + 0.5) * cwF, u0 = (cxF - fx) / frx; if (Math.abs(u0) > 0.93) continue; var cyF = fyy + fry * Math.sqrt(Math.max(0, 1 - u0 * u0)) + fh * 0.5, rF = Math.min(cwF, fh) * 0.4, shF = 1 - Math.abs(u0) * 0.5;
    var spF = rotp(morocco_starPts(0, 0, rF, 0.72, 8, Math.PI / 8, 1).map(function (p) { return [p[0] * shF, p[1]]; }), cxF, cyF, 0); fzs += morocco_pg(spF); fzl += poly(spF); fzd += morocco_star(cxF, cyF, rF * 0.34 * shF + 0.5, 0.6, 8, Math.PI / 8, 1); }
  ncream += morocco_pg(lob(frx + rim, fry + rim * 0.45, fyy)) + morocco_hole(lob(frx - rim * 0.6, fry - rim * 0.3, fyy));
  water += morocco_pg(lob(frx - rim * 0.55, fry - rim * 0.28, fyy));
  ncream += fzs; ngrn += fzd; ng += fzl;
  // the pedestal and the upper bowl
  var pedH = (ph ? 62 : 92) * S, bowlY = fyy - pedH, brx = (ph ? 30 : 46) * S, bry = brx * 0.22;
  ncream += morocco_pg([[fx - 9 * S, fyy], [fx - 6 * S, bowlY + 10 * S], [fx - 12 * S, bowlY + 4 * S], [fx + 12 * S, bowlY + 4 * S], [fx + 6 * S, bowlY + 10 * S], [fx + 9 * S, fyy]]) + morocco_e(fx, fyy, 16 * S, 4 * S);
  nc += seg(fx - 3 * S, fyy - 2, fx - 2 * S, bowlY + 10 * S) + seg(fx + 3 * S, fyy - 2, fx + 2 * S, bowlY + 10 * S);
  ncob += morocco_pg([[fx - brx, bowlY], [fx + brx, bowlY], [fx + brx * 0.55, bowlY + bry * 2.6], [fx - brx * 0.55, bowlY + bry * 2.6]]);
  ncream += morocco_pg(morocco_ep(fx, bowlY, brx + 2, bry + 1.4, 40)) + morocco_hole(morocco_ep(fx, bowlY, brx - 3, bry - 1.4, 40));
  water += morocco_e(fx, bowlY, brx - 3, bry - 1.4);
  ngrn += morocco_dia(fx - brx * 0.4, bowlY + bry * 1.4, 3 * S, 3 * S) + morocco_dia(fx, bowlY + bry * 1.6, 3 * S, 3 * S) + morocco_dia(fx + brx * 0.4, bowlY + bry * 1.4, 3 * S, 3 * S);
  gold += morocco_pg([[fx - 3 * S, bowlY], [fx + 3 * S, bowlY], [fx + 2 * S, bowlY - 9 * S], [fx - 2 * S, bowlY - 9 * S]]) + morocco_c(fx, bowlY - 11 * S, 3 * S);
  // a low rug on the left with cushions, a painted table and the mint tea
  // (on phones the rug would sit under the tab bar, so it is left out there)
  var rX = W * 0.29, rY = H * 0.935, rw = 250 * S, rh2 = 54 * S;
  if (!ph) {
    var rugP = [[rX - rw / 2 + 18 * S, rY - rh2 / 2], [rX + rw / 2 - 18 * S, rY - rh2 / 2], [rX + rw / 2 + 8 * S, rY + rh2 / 2], [rX - rw / 2 - 8 * S, rY + rh2 / 2]];
    nsh += morocco_pg([[rugP[0][0], rugP[0][1] + 4], [rugP[1][0] + 4, rugP[1][1] + 4], [rugP[2][0] + 4, rugP[2][1] + 4], [rugP[3][0], rugP[3][1] + 4]]);
    rug += morocco_pg(rugP);
    var inset = function (d) { var kx = 1 - d / (rw / 2), ky = 1 - d / (rh2 / 2); return rugP.map(function (p) { return [rX + (p[0] - rX) * kx, rY + (p[1] - rY) * ky]; }); };
    nor += morocco_pg(inset(6 * S)) + morocco_hole(inset(10 * S));
    ncream += morocco_pg(inset(13 * S)) + morocco_hole(inset(15 * S));
    for (j = -2; j <= 2; j++) { var mxr = rX + j * rw * 0.17, myr = rY + 2 * S; if (j % 2) ncob += morocco_dia(mxr, myr, 11 * S, 7 * S); else nor += morocco_dia(mxr, myr, 11 * S, 7 * S); ncream += morocco_dia(mxr, myr, 4 * S, 2.5 * S); }
    for (j = 0; j <= 20; j++) { var fxr = rugP[3][0] + j * (rugP[2][0] - rugP[3][0]) / 20; nc += seg(fxr, rY + rh2 / 2, fxr - 0.6, rY + rh2 / 2 + 5 * S); }
    // cushions (round poufs and flat cushions) behind the rug
    var cush = [[-0.42, 'a', 30, 20], [-0.18, 'c', 24, 18], [0.36, 'g', 26, 19]];
    cush.forEach(function (q) { var cx = rX + q[0] * rw, cy = rY - rh2 * 0.45, cw2 = q[2] * S, chh = q[3] * S, s = morocco_pg(morocco_ep(cx, cy, cw2, chh, 30));
      nsh += morocco_e(cx + 3, cy + chh * 0.8, cw2, chh * 0.3);
      if (q[1] === 'a') rug += s; else if (q[1] === 'c') ncob += s; else gold += s;
      ng += 'M' + PT(cx - cw2 * 0.85, cy) + ' Q' + PT(cx, cy + chh * 0.35) + ' ' + PT(cx + cw2 * 0.85, cy) + ' ' + morocco_c(cx, cy - chh * 0.2, 1.6 * S); nor += morocco_star(cx, cy - chh * 0.2, chh * 0.38, 0.55, 8, 0, 0.8); });
    // the painted table, a brass tray, the teapot and three glasses of tea
    var tX = rX + rw * 0.12, tY = rY - rh2 * 0.1, tS = S * (ph ? 1.1 : 1);
    ncob += morocco_pg([[tX - 34 * tS, tY - 16 * tS], [tX + 34 * tS, tY - 16 * tS], [tX + 30 * tS, tY], [tX + 22 * tS, tY], [tX + 22 * tS, tY - 8 * tS], [tX - 22 * tS, tY - 8 * tS], [tX - 22 * tS, tY], [tX - 30 * tS, tY]]);
    nor += rect(tX - 30 * tS, tY - 14 * tS, 60 * tS, 2.4 * tS); ngrn += morocco_dia(tX, tY - 8 * tS, 5 * tS, 3 * tS);
    gold += morocco_pg(morocco_ep(tX, tY - 18 * tS, 40 * tS, 7 * tS, 36));
    var tp = [tX - 8 * tS, tY - 22 * tS];
    gold += morocco_pg([[tp[0] - 11 * tS, tp[1]], [tp[0] + 11 * tS, tp[1]], [tp[0] + 13 * tS, tp[1] - 9 * tS], [tp[0] + 8 * tS, tp[1] - 17 * tS], [tp[0] - 8 * tS, tp[1] - 17 * tS], [tp[0] - 13 * tS, tp[1] - 9 * tS]]);
    gold += morocco_pg([[tp[0] - 6 * tS, tp[1] - 17 * tS], [tp[0] + 6 * tS, tp[1] - 17 * tS], [tp[0] + 3 * tS, tp[1] - 24 * tS], [tp[0] - 3 * tS, tp[1] - 24 * tS]]) + morocco_c(tp[0], tp[1] - 27 * tS, 3 * tS);
    gold += morocco_pg([[tp[0] + 11 * tS, tp[1] - 6 * tS], [tp[0] + 26 * tS, tp[1] - 22 * tS], [tp[0] + 28 * tS, tp[1] - 20 * tS], [tp[0] + 13 * tS, tp[1] - 2 * tS]]);
    ng += 'M' + PT(tp[0] - 12 * tS, tp[1] - 6 * tS) + ' Q' + PT(tp[0] - 22 * tS, tp[1] - 12 * tS) + ' ' + PT(tp[0] - 10 * tS, tp[1] - 16 * tS) + ' ' + seg(tp[0] - 10 * tS, tp[1] - 9 * tS, tp[0] + 10 * tS, tp[1] - 9 * tS);
    for (j = 0; j < 3; j++) { var gx = tX + (8 + j * 9) * tS, gy = tY - 19 * tS - (j === 1 ? 2 * tS : 0); nor += morocco_pg([[gx - 3.4 * tS, gy - 10 * tS], [gx + 3.4 * tS, gy - 10 * tS], [gx + 2.6 * tS, gy], [gx - 2.6 * tS, gy]]); ngrn += rect(gx - 1 * tS, gy - 13 * tS, 2 * tS, 3.4 * tS); ncream += rect(gx - 3 * tS, gy - 10 * tS, 6 * tS, 2 * tS); }
  }
  // candles: three on brass dishes beside the fountain, one pair by the rug
  var candles = [[fx + frx + 26 * S, fyy + fh * 0.9, 1], [fx + frx + 42 * S, fyy + fh * 1.05, 0.75], [rX - rw * 0.58, rY - rh2 * 0.1, 0.7], [rX - rw * 0.52, rY + rh2 * 0.15, 0.95]];
  if (ph) candles = [[fx - frx - 18 * S, fyy + fh * 0.9, 1], [fx + frx + 16 * S, fyy + fh * 0.95, 0.85]];
  candles.forEach(function (c) { var cs = c[2] * S * (ph ? 1.2 : 1), ch = 22 * cs; gold += morocco_pg(morocco_ep(c[0], c[1], 9 * cs, 2.6 * cs, 20)); ncream += rect(c[0] - 4 * cs, c[1] - ch, 8 * cs, ch) + morocco_e(c[0], c[1] - ch, 4 * cs, 1.4 * cs); nc += seg(c[0], c[1] - ch - 1, c[0], c[1] - ch - 4 * cs); nsh += morocco_e(c[0] + 4, c[1] + 2, 10 * cs, 2.4 * cs); c.push(c[1] - ch - 4 * cs, cs); });
  // glazed pots for two orange trees (the trees are the engine's while it runs)
  var trees = [[W - pw - (ph ? 50 : 96) * S, H * (ph ? 0.965 : 0.975), ph ? 0.85 : 1.05], [pw + (ph ? 46 : 64) * S, H * (ph ? 0.97 : 0.985), ph ? 0.8 : 0.95]], tdat = [];
  trees.forEach(function (q, n) { var px = q[0], py = q[1], s = q[2] * S * (ph ? 1.2 : 1), pot = morocco_pg([[px - 30 * s, py - 62 * s], [px + 30 * s, py - 62 * s], [px + 34 * s, py - 46 * s], [px + 24 * s, py], [px - 24 * s, py], [px - 34 * s, py - 46 * s]]);
    nsh += morocco_e(px + 6, py + 2, 40 * s, 6 * s);
    if (n) ngrn += pot; else ncob += pot;
    ncream += rect(px - 34 * s, py - 68 * s, 68 * s, 7 * s) + morocco_hole([[px - 30 * s, py - 66 * s], [px + 30 * s, py - 66 * s], [px + 30 * s, py - 64 * s], [px - 30 * s, py - 64 * s]]);
    nor += morocco_pg([[px - 33 * s, py - 44 * s], [px + 33 * s, py - 44 * s], [px + 32 * s, py - 40 * s], [px - 32 * s, py - 40 * s]]);
    for (j = -2; j <= 2; j++) ncream += morocco_star(px + j * 12 * s, py - 28 * s, 4.6 * s, 0.5, 8, 0, 1);
    nsh += rect(px + 18 * s, py - 58 * s, 10 * s, 54 * s);
    tdat.push({x: px, y: py - 66 * s, s: s, k: n}); });
  // the brass lanterns: hanging under the arch, on the back wall between the arches, and standing on the floor
  var lan = [], hangs = ph ? [[0.2, 0.17, 0.95], [0.5, 0.075, 0.8], [0.82, 0.19, 1]] : [[0.16, 0.2, 1.05], [0.36, 0.11, 0.85], [0.6, 0.085, 0.8], [0.88, 0.24, 1.1]];
  hangs.forEach(function (q, n) { var hx = W * q[0], ay = archY(hx) + 4; lan.push({x: hx, y: ay, len: Math.max(14, H * q[1] - ay), R: (ph ? 9 : 14) * q[2] * (ph ? 1 : S), kind: 'hang', k: n}); });
  for (i = 1; i < na; i++) lan.push({x: pw + i * sp, y: yd - (yd - fy1) * 0.42, len: 0, R: (ph ? 6 : 10) * (ph ? 1 : S), kind: 'wall', k: i});
  lan.push({x: fx + frx + (ph ? 46 : 70) * S, y: fyy + fh * 0.7, len: 0, R: (ph ? 10 : 15) * S * (ph ? 1.2 : 1), kind: 'floor', k: 7});
  if (!ph) lan.push({x: (rX + rw / 2 + fx - frx) / 2 - 4 * S, y: rY + rh2 * 0.1, len: 0, R: 13 * S, kind: 'floor', k: 8});
  function archY(xx) { var u = (xx - W / 2) / (W / 2 - pw + (ph ? 6 : 14)); return ARC.cy - ARC.ry * Math.sqrt(Math.max(0, 1 - u * u)); }
  // ---------------------------------------------------------------- the carved horseshoe arch we look through
  var aOpen = morocco_archPts(W / 2, H + 20, W - 2 * pw, H + 20 - (ARC.cy - ARC.ry), (W / 2 - pw + (ph ? 6 : 14)) / (W / 2 - pw), ph ? 9 : 13, ph ? 0.035 : 0.025, ARC.ry);
  var bandW = (ph ? 9 : 18) * (ph ? 1 : S), aBand = morocco_archPts(W / 2, H + 20, W - 2 * pw + bandW * 2, H + 20 - (ARC.cy - ARC.ry) + bandW, (W / 2 - pw + (ph ? 6 : 14) + bandW) / (W / 2 - pw + bandW), 0, 0, ARC.ry + bandW);
  var frame = rect(-20, -20, W + 40, H + 40) + morocco_hole(aBand), band = morocco_pg(aBand) + morocco_hole(aOpen);
  ncream += frame; ncob += band;
  // stars along the band, small cream diamonds between them
  var bandMid = aOpen.map(function (p, q) { var o = aBand[q]; return [(p[0] + o[0]) / 2, (p[1] + o[1]) / 2]; }), acc = 0, step = bandW * 1.25;
  for (i = 1; i < bandMid.length; i++) { var d = Math.hypot(bandMid[i][0] - bandMid[i - 1][0], bandMid[i][1] - bandMid[i - 1][1]); acc += d;
    if (acc >= step) { acc = 0; var bp = bandMid[i]; if (bp[1] > H + 4 || bp[1] < -bandW) continue; ngrn += morocco_star(bp[0], bp[1], bandW * 0.36, 0.66, 8, Math.PI / 8); nor += morocco_star(bp[0], bp[1], bandW * 0.14, 0.6, 8, 0); } }
  // carved lines that follow the arch, and a lobed rosette in each top corner
  [1.6, 2.3].forEach(function (m) { var pts = morocco_archPts(W / 2, H + 20, W - 2 * pw + bandW * 2 * m, H + 20 - (ARC.cy - ARC.ry) + bandW * m, (W / 2 - pw + (ph ? 6 : 14) + bandW * m) / (W / 2 - pw + bandW * m), 0, 0, ARC.ry + bandW * m); nc += pline(pts.slice(1, -1)); });
  var ro = ph ? [[0.06, 0.035], [0.94, 0.035]] : [[0.06, 0.07], [0.94, 0.07]];
  ro.forEach(function (q) { var rx = W * q[0], ry = H * q[1], rr = ph ? 12 : 30 * S; if (ry > archY(rx) - rr * 0.6) return; ngrn += morocco_star(rx, ry, rr, 0.74, 8, Math.PI / 8); ncream += morocco_star(rx, ry, rr * 0.56, 0.7, 8, 0); nor += morocco_star(rx, ry, rr * 0.26, 0.6, 8, Math.PI / 8); nc += morocco_c(rx, ry, rr * 1.18); for (k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; nc += morocco_leaf(rx + Math.cos(a) * rr * 1.5, ry + Math.sin(a) * rr * 1.5, rr * 0.5, rr * 0.16, a * 57.3); } });
  // sebka lattice carved into the spandrels
  if (!ph) for (y = 6; y < ARC.cy; y += 22 * S) for (x = 6; x < W; x += 22 * S) { if (y > archY(x) - 30 * S || Math.hypot(x - W * 0.06, y - H * 0.07) < 50 * S || Math.hypot(x - W * 0.94, y - H * 0.07) < 50 * S) continue; nc += morocco_dia(x, y, 7 * S, 7 * S); }
  // the jambs: a zellige panel at the foot, a carved column with a capital, and a cedar strip
  [-1, 1].forEach(function (sd) { var jx0 = sd < 0 ? -20 : W - pw, jx1 = sd < 0 ? pw : W + 20, zt = H * (ph ? 0.8 : 0.66), zz = morocco_zel(jx0 + (sd < 0 ? 20 : 0) + 3, zt, pw - 6, H - zt, ph ? 9 : pw - 8);
    ncob += rect(jx0 + (sd < 0 ? 20 : 0) + 2, zt, pw - 4, H - zt + 10); ngrn += zz.star; nor += zz.dia; ng += zz.line;
    nor += rect(jx0 + (sd < 0 ? 20 : 0), zt - 5, pw, 4);
    if (!ph) { var cx = sd < 0 ? pw - 9 : W - pw + 9; ncream += rect(cx - 5, ARC.cy + 40 * S, 10, zt - ARC.cy - 46 * S); nc += seg(cx - 2, ARC.cy + 48 * S, cx - 2, zt - 10) + seg(cx + 2, ARC.cy + 48 * S, cx + 2, zt - 10); gold += rect(cx - 8, ARC.cy + 34 * S, 16, 7) + rect(cx - 7, zt - 12, 14, 5); }
    nsh += rect(sd < 0 ? pw - 3 : W - pw, -20, 3, H + 40); });
  add(near, 'a', rug, C.rug); add(near, 'b', water, C.water); add(near, 'c', ncob, C.cob); add(near, 'd', ncream, C.ncream); add(near, 'e', ngrn, C.grn); add(near, 'f', nor, C.norange); add(near, 'g', gold, C.gold); add(near, 'h', nsh, C.nshade);
  stk(near, 's', ng, C.grout, ph ? 0.7 : 1); stk(near, 't', nc, C.carve, ph ? 0.8 : 1.2);
  if (ANIM) { ANIM.C = C; ANIM.stars = stars; ANIM.lan = lan; ANIM.trees = tdat; ANIM.arches = arches; ANIM.candles = candles; ANIM.yw = yw; ANIM.yf = yf; ANIM.ARC = ARC; ANIM.pw = pw;
    ANIM.fount = {x: fx, y: fyy, rx: frx - rim * 0.55, ry: fry - rim * 0.28, rimRx: frx + rim, rimRy: fry + rim * 0.45, bowlY: bowlY, brx: brx, bry: bry, spout: bowlY - 12 * S, s: S, fh: fh}; }
  else {
    // the still scene: stars, the trees and the lanterns drawn flat
    if (dk) { var st = ''; stars.forEach(function (s) { st += morocco_c(s.x, s.y, s.r); }); add(far, 'd', st, '#FFF4DA'); }
    var trunk = '', leaf = '', fruit = '';
    tdat.forEach(function (t) { var s = t.s, top = t.y - 120 * s; trunk += morocco_pg([[t.x - 5 * s, t.y], [t.x - 3 * s, top + 20 * s], [t.x + 3 * s, top + 20 * s], [t.x + 5 * s, t.y]]);
      for (var q = 0; q < 26; q++) { var a = hash(q + t.k * 40) * Math.PI * 2, dd = Math.sqrt(hash(q + 7 + t.k * 40)), lx = t.x + Math.cos(a) * dd * 52 * s, ly = top + Math.sin(a) * dd * 40 * s; leaf += morocco_c(lx, ly, (14 + hash(q + 3) * 8) * s); if (q % 3 === 0) fruit += morocco_c(lx + 5 * s, ly + 4 * s, 4.6 * s); } });
    add(mid, 'f', trunk); add(near, 'e', leaf); add(near, 'f', fruit);
    var lg = '', lc = ''; lan.forEach(function (l) { var R = l.R, y0 = l.y + l.len; if (l.len) lc += seg(l.x, l.y, l.x, y0);
      var cy = l.kind === 'hang' ? y0 + R * 1.5 : l.y - R * 1.3;
      lg += morocco_pg([[l.x - R * 0.5, cy - R * 0.9], [l.x, cy - R * 1.6], [l.x + R * 0.5, cy - R * 0.9]]) + morocco_pg([[l.x - R * 0.62, cy - R * 0.9], [l.x + R * 0.62, cy - R * 0.9], [l.x + R * 0.5, cy + R * 0.6], [l.x - R * 0.5, cy + R * 0.6]]) + morocco_pg([[l.x - R * 0.4, cy + R * 0.6], [l.x + R * 0.4, cy + R * 0.6], [l.x, cy + R * 1.2]]); });
    add(near, 'g', lg); stk(near, 't', lc);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
