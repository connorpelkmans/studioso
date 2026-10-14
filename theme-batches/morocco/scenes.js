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
// a shape (finely sampled points) with every point that lies above an object's foot pushed down onto it, i.e. the shape minus the
// object in front of it; foot(x) gives the object's lowest edge at x, or null where the object is not
function morocco_under(p, foot) { return morocco_pg(p.map(function (q) { var f = foot(q[0]); return f !== null && q[1] < f ? [q[0], f] : q; })); }
// is (x, y) inside the polygon p (even-odd)
function morocco_inside(p, x, y) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { var a = p[i], b = p[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// the highest point where a vertical line at x crosses the (open-bottomed) outline p, or null
function morocco_topAt(p, x) { var best = null; for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) { var y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); if (best === null || y < best) best = y; } } return best; }
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
  // it is seen from below, so its rows of barrel tiles fan out toward us from the middle; round tile ends hang along the eave,
  // the ridge cap shades the tiles under it, the eave shades the beam, and the corbels are shaded on their right
  var tTop = yw - eh * 0.6, tBot = yw + eh * 0.5, tStep = ph ? 6 : 8, trr = tStep * 0.56;
  grn += morocco_pg([[-10, tTop], [W + 10, tTop], [W + 10, tBot], [-10, tBot]]);
  for (x = -10 - tStep; x < W + 10 + tStep; x += tStep) { var xt = W / 2 + (x - W / 2) * 0.95;
    shade += morocco_pg([[xt - 0.5, tTop], [xt + 0.5, tTop], [x + 1.3, tBot], [x - 1.3, tBot]]); wc += seg(xt + tStep * 0.48, tTop + 1, x + tStep * 0.55, tBot - 1);
    grn += morocco_c(x + tStep / 2, tBot, trr); shade += morocco_e(x + tStep / 2 + 0.5, tBot + trr * 0.55, trr * 0.9, trr * 0.5); }
  shade += rect(-10, tTop, W + 20, eh * 0.14);
  cedar += rect(-10, tBot + trr * 0.7, W + 20, eh * 0.45) + rect(-10, yw - eh * 0.75, W + 20, eh * 0.2);
  shade += rect(-10, tBot + trr * 0.7, W + 20, eh * 0.16);
  for (x = 4; x < W; x += ph ? 22 : 34) { cedar += morocco_pg([[x - 4, yw + eh * 0.9], [x + 4, yw + eh * 0.9], [x + 3, yw + eh * 1.5], [x, yw + eh * 1.7], [x - 3, yw + eh * 1.5]]);
    shade += morocco_pg([[x + 0.5, yw + eh * 0.9], [x + 4, yw + eh * 0.9], [x + 3, yw + eh * 1.5], [x + 0.5, yw + eh * 1.68]]); }
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
    for (k = 0; k < 2; k++) { var sx = ax + (k ? 1 : -1) * (aw / 2 + bd * 0.9), syy = yf - ah + bd * 0.9; wl += morocco_c(sx, syy, bd) + morocco_star(sx, syy, bd * 0.74, 0.6, 8, 0); }
    wl += pline(morocco_archPts(ax, yf, aw + bd * 1.1, ah + bd * 0.55, 1.135));
    // the bottom of each pier: a zellige dado
    arches.push({x: ax, w: aw, top: yf - ah, yb: yf, pts: ap}); }
  for (i = 0; i <= na; i++) { var x0 = i === 0 ? -10 : pw + i * sp - (sp - aw) / 2 + 2, x1 = i === na ? W + 10 : pw + i * sp + (sp - aw) / 2 - 2;
    if (i > 0) x0 = pw + (i - 1) * sp + sp / 2 + aw / 2 + (ph ? 5 : 9) * (ph ? 1 : S) + 1; if (i < na) x1 = pw + i * sp + sp / 2 - aw / 2 - (ph ? 5 : 9) * (ph ? 1 : S) - 1; if (i === 0) x0 = -10; if (i === na) x1 = W + 10;
    if (x1 - x0 < 8) continue;
    var z = morocco_zel(x0, yd, x1 - x0, yf - yd, ph ? 16 : 26 * S); cob += rect(x0, yd, x1 - x0, yf - yd); white += z.star; grn += z.dia; wl += z.line;
    cedar += rect(x0, yd - 4, x1 - x0, 4); shade += rect(x0, yd, x1 - x0, 3); }
  // the zellige floor in perspective: cream marble with cobalt and green stars at the tile corners
  var floor = rect(-10, yf, W + 20, H - yf + 10), vy = yf - H * 0.9, fl = '';
  shade += rect(-10, yf, W + 20, 5);
  // one camera for the floor and everything on it: a square tile at screen height y is squashed to fk(y) of its width (about a
  // quarter at the back, a third at the front), and the objects standing on the floor use the same fk for their ellipses
  var fK = ((ph ? H * 0.875 : H * 0.89) - vy) / 0.3, fk = function (yy) { return (yy - vy) / fK; };
  var rows = []; for (y = yf + 6, k = 0; y < H + 30; k++) { rows.push(y); y += Math.max(4, (ph ? 34 : 64) * (y - vy) / (H - vy) * fk(y)); }
  rows.forEach(function (ry, r) { var sc = (ry - vy) / (H - vy), cw = (ph ? 34 : 64) * sc, rh = (rows[r + 1] || ry + 30) - ry; fl += seg(-10, ry, W + 10, ry);
    for (var cx = W / 2 - Math.ceil(W / cw) * cw; cx < W + cw; cx += cw) { var star = (Math.round((cx - W / 2) / cw) + r) % 2 === 0, sxx = cx + cw / 2;
      // each star is laid flat on the floor: drawn in the floor's own plane, then put into its perspective (depth squashed by the
      // row's height to width, and every point pulled toward the vanishing point by its own depth, so it slants with the tile lines)
      if (star) { var sr = cw * 0.2, kq = rh / cw, onFloor = function (pts) { return morocco_pg(pts.map(function (p) { var yy = ry + p[1] * kq; return [W / 2 + (sxx + p[0] - W / 2) * (yy - vy) / (ry - vy), yy]; })); };
        var big = onFloor(morocco_starPts(0, 0, sr, 0.62, 8, Math.PI / 8, 1)); if (r % 2) grn += big; else cob += big; white += onFloor(morocco_starPts(0, 0, sr * 0.36, 0.6, 8, Math.PI / 8, 1)); }
      fl += seg(cx, ry, cx + (cx - W / 2) * rh / (ry - vy), ry + rh); } });
  add(mid, 'a', wall, C.wall); add(mid, 'b', cream + floor, C.cream); add(mid, 'c', cob, C.cob); add(mid, 'd', grn, C.grn); add(mid, 'e', white, C.white); add(mid, 'f', cedar, C.cedar); add(mid, 'g', shade, C.shade); add(mid, 'h', open, C.open);
  stk(mid, 's', fl, C.wgrout, 1); stk(mid, 't', wl + wc, C.wcarve, ph ? 0.8 : 1.1);
  // ---------------------------------------------------------------- the near things: fountain, pots, rug, tea, candles, the arch
  var rug = '', water = '', ncob = '', ncream = '', ngrn = '', nor = '', gold = '', nsh = '', gsh = '', ng = '', nc = '';
  // the fountain: a twelve-lobed basin faced with zellige, a fluted pedestal and a small upper bowl
  var fx = W * (ph ? 0.5 : 0.56), fyy = H * (ph ? 0.875 : 0.89), frx = (ph ? 118 : 160) * S * (ph ? 1.25 : 1), fry = frx * fk(H * (ph ? 0.875 : 0.89)), fh = (ph ? 26 : 36) * S, rim = (ph ? 6 : 9) * S;
  var lob = function (rx, ry, yy) { var p = []; for (var q = 0; q < 96; q++) { var t = q / 96 * Math.PI * 2, f = 1 + 0.035 * Math.abs(Math.cos(t * 6)); p.push([fx + Math.cos(t) * rx * f, yy + Math.sin(t) * ry * f]); } return p; };
  gsh += morocco_e(fx, fyy + fh + 4, frx * 1.08, fry * 1.25);
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
  var pedH = (ph ? 62 : 92) * S, bowlY = fyy - pedH, brx = (ph ? 30 : 46) * S, bry = brx * fk(fyy) * 0.85; // (it is raised nearer eye level, so a little flatter than the basin)
  // (the column stops under the bowl, which shares no slot with it and would otherwise sit behind it)
  var pedT = bowlY + bry * 2.6 - 1;
  ncream += morocco_pg([[fx - 9 * S, fyy], [fx - 6 * S, pedT], [fx + 6 * S, pedT], [fx + 9 * S, fyy]]) + morocco_e(fx, fyy, 16 * S, 4 * S);
  nc += seg(fx - 3 * S, fyy - 2, fx - 2 * S, pedT) + seg(fx + 3 * S, fyy - 2, fx + 2 * S, pedT);
  // the bowl's outside hangs from the front of its rim (not from its middle, which would cover the front half of the water)
  var bowlFront = morocco_ep(fx, bowlY, brx + 2, bry + 1.4, 60).filter(function (p) { return p[1] >= bowlY; }).sort(function (a, b) { return b[0] - a[0]; });
  ncob += morocco_pg(bowlFront.concat([[fx - brx * 0.55, bowlY + bry * 2.6], [fx + brx * 0.55, bowlY + bry * 2.6]]));
  ncream += morocco_pg(morocco_ep(fx, bowlY, brx + 2, bry + 1.4, 40)) + morocco_hole(morocco_ep(fx, bowlY, brx - 3, bry - 1.4, 40));
  water += morocco_e(fx, bowlY, brx - 3, bry - 1.4);
  ngrn += morocco_dia(fx - brx * 0.4, bowlY + bry * 1.4, 3 * S, 3 * S) + morocco_dia(fx, bowlY + bry * 1.6, 3 * S, 3 * S) + morocco_dia(fx + brx * 0.4, bowlY + bry * 1.4, 3 * S, 3 * S);
  gold += morocco_pg([[fx - 3 * S, bowlY], [fx + 3 * S, bowlY], [fx + 2 * S, bowlY - 9 * S], [fx - 2 * S, bowlY - 9 * S]]) + morocco_c(fx, bowlY - 11 * S, 3 * S);
  // a low rug on the left with cushions, a painted table and the mint tea
  // (on phones the rug would sit under the tab bar, so it is left out there)
  var rX = W * 0.29, rY = H * 0.935, rw = 250 * S, rh2 = rw * 0.62 * fk(H * 0.935);
  if (!ph) {
    var rugBk = (rY - rh2 / 2 - vy) / (rY + rh2 / 2 - vy), rugP = [[W / 2 + (rX - rw / 2 - W / 2) * rugBk, rY - rh2 / 2], [W / 2 + (rX + rw / 2 - W / 2) * rugBk, rY - rh2 / 2], [rX + rw / 2, rY + rh2 / 2], [rX - rw / 2, rY + rh2 / 2]]; // (its sides run to the floor's vanishing point)
    gsh += morocco_pg([[rugP[0][0] - 1, rugP[0][1] + 1], [rugP[1][0] + 2, rugP[1][1] + 1], [rugP[2][0] + 2.5, rugP[2][1] + 1.5], [rugP[3][0] - 1, rugP[3][1] + 1.5]]);
    rug += morocco_pg(rugP);
    var inset = function (d) { var kx = 1 - d / (rw / 2), ky = 1 - d / (rh2 / 2); return rugP.map(function (p) { return [rX + (p[0] - rX) * kx, rY + (p[1] - rY) * ky]; }); };
    // the border bands, left open where the cushions and the table stand on the rug's back edge (so they stay in front)
    var tX = rX + rw * 0.12, tY = rY - rh2 * 0.1, tS = S * (ph ? 1.1 : 1), cush = [[-0.42, 'a', 30, 20], [-0.18, 'c', 24, 18], [0.36, 'g', 26, 19]];
    var gapAt = function (y) { var g = cush.map(function (q) { var cx = rX + q[0] * rw, cy = rY - rh2 * 0.45, cw2 = q[2] * S, chh = q[3] * S, u = (y - cy) / chh; return u * u < 1 ? [cx - cw2 * Math.sqrt(1 - u * u), cx + cw2 * Math.sqrt(1 - u * u)] : null; }).filter(Boolean);
      if (y > tY - 16 * tS && y < tY) g.push([tX - 34 * tS, tX + 34 * tS]); return g.sort(function (a, b) { return a[0] - b[0]; }); };
    var inCush = function (x, y) { return cush.some(function (q) { var u = (x - rX - q[0] * rw) / (q[2] * S), w = (y - rY + rh2 * 0.45) / (q[3] * S); return u * u + w * w < 1; }); };
    // a side band starts below any cushion sitting on its top end
    var side = function (a0, a1, b1, b0) { var v = 0, L = function (p, q, t) { return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
      while (v < 0.6 && (inCush.apply(null, L(a0, a1, v)) || inCush.apply(null, L(b0, b1, v)))) v += 0.02;
      return morocco_pg([L(a0, a1, v), a1, b1, L(b0, b1, v)]); };
    var band = function (d0, d1) { var o = inset(d0), n = inset(d1), out = side(o[1], o[2], n[2], n[1]) + morocco_pg([o[2], o[3], n[3], n[2]]) + side(o[0], o[3], n[3], n[0]);
      var yo = o[0][1], yi = n[0][1], lx = function (y) { return o[0][0] + (n[0][0] - o[0][0]) * (y - yo) / (yi - yo); }, rx2 = function (y) { return o[1][0] + (n[1][0] - o[1][0]) * (y - yo) / (yi - yo); };
      var ga = gapAt(yo), gb = gapAt(yi), xa = lx(yo), xb = lx(yi);
      for (var q = 0; q <= ga.length; q++) { var ea = q < ga.length ? ga[q][0] : rx2(yo), eb = q < ga.length ? (gb[q] ? gb[q][0] : ga[q][0]) : rx2(yi);
        if (ea > xa + 0.5) out += morocco_pg([[xa, yo], [ea, yo], [eb, yi], [xb, yi]]);
        if (q < ga.length) { xa = ga[q][1]; xb = gb[q] ? gb[q][1] : ga[q][1]; } }
      return out; };
    nor += band(6 * S, 10 * S);
    ncream += band(13 * S, 15 * S);
    for (j = -2; j <= 2; j++) { var mxr = rX + j * rw * 0.17, myr = rY + 2 * S; if (j % 2) ncob += morocco_dia(mxr, myr, 11 * S, 7 * S); else nor += morocco_dia(mxr, myr, 11 * S, 7 * S); ncream += morocco_dia(mxr, myr, 4 * S, 2.5 * S); }
    // the fringe lies flat on the floor along the front edge, each tassel pointing straight out toward us in the floor's perspective
    for (j = 0; j <= 20; j++) { var fxr = rugP[3][0] + j * (rugP[2][0] - rugP[3][0]) / 20, fyr = rY + rh2 / 2, fdx = fxr - W / 2, fdy = fyr - vy, fdl = Math.hypot(fdx, fdy); nc += seg(fxr, fyr, fxr + fdx / fdl * 4 * S, fyr + fdy / fdl * 4 * S); }
    // cushions (round poufs and flat cushions) behind the rug
    cush.forEach(function (q) { var cx = rX + q[0] * rw, cy = rY - rh2 * 0.45, cw2 = q[2] * S, chh = q[3] * S, s = morocco_pg(morocco_ep(cx, cy, cw2, chh, 30));
      nsh += morocco_under(morocco_ep(cx + 4 * S, cy + chh * 0.78, cw2 * 1.05, chh * 0.32, 90), function (x) { var u = (x - cx) / cw2; return u * u < 1 ? cy + chh * Math.sqrt(1 - u * u) : null; }); // (only where the cushion is not)
      if (q[1] === 'a') rug += s; else if (q[1] === 'c') ncob += s; else gold += s;
      ng += 'M' + PT(cx - cw2 * 0.85, cy) + ' Q' + PT(cx, cy + chh * 0.35) + ' ' + PT(cx + cw2 * 0.85, cy) + ' ' + morocco_c(cx, cy - chh * 0.2, 1.6 * S); nor += morocco_star(cx, cy - chh * 0.2, chh * 0.38, 0.55, 8, 0, 0.8); });
    // the painted table, a brass tray, the teapot and three glasses of tea
    ncob += morocco_pg([[tX - 34 * tS, tY - 16 * tS], [tX + 34 * tS, tY - 16 * tS], [tX + 30 * tS, tY], [tX + 22 * tS, tY], [tX + 22 * tS, tY - 8 * tS], [tX - 22 * tS, tY - 8 * tS], [tX - 22 * tS, tY], [tX - 30 * tS, tY]]);
    nsh += morocco_under(morocco_ep(tX + 5 * tS, tY - 1 * tS, 36 * tS, 4 * tS, 90), function (x) { var dx = Math.abs(x - tX); return dx < 22 * tS ? tY - 8 * tS : dx < 30 * tS ? tY : null; }); // (the legs and apron in front of it)
    nor += rect(tX - 30 * tS, tY - 14 * tS, 60 * tS, 2.4 * tS); ngrn += morocco_dia(tX, tY - 8 * tS, 5 * tS, 3 * tS);
    gold += morocco_pg(morocco_ep(tX, tY - 18 * tS, 40 * tS, 40 * tS * fk(tY) * 0.85, 36));
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
  // (each candle stands on its dish: the dish is drawn only round and in front of the candle's rounded foot, never over it)
  candles.forEach(function (c) { var cs = c[2] * S * (ph ? 1.2 : 1), ch = 22 * cs, fy2 = c[1] - 0.6 * cs, body = [[c[0] - 4 * cs, c[1] - ch]].concat(morocco_ep(c[0], fy2, 4 * cs, 1.4 * cs, 16).filter(function (p) { return p[1] >= fy2; }).sort(function (a, b) { return a[0] - b[0]; }), [[c[0] + 4 * cs, c[1] - ch]]);
    gold += morocco_under(morocco_ep(c[0], c[1], 9 * cs, 2.6 * cs, 72), function (x) { var u = (x - c[0]) / (4 * cs); return u * u < 1 ? fy2 + 1.4 * cs * Math.sqrt(1 - u * u) : null; }); ncream += morocco_pg(body) + morocco_e(c[0], c[1] - ch, 4 * cs, 1.4 * cs); nc += seg(c[0], c[1] - ch - 1, c[0], c[1] - ch - 4 * cs); gsh += morocco_e(c[0] + 4, c[1] + 2, 10 * cs, 2.4 * cs); c.push(c[1] - ch - 4 * cs, cs); });
  // glazed pots for two orange trees (the trees are the engine's while it runs)
  var trees = [[W - pw - (ph ? 50 : 96) * S, H * (ph ? 0.965 : 0.975), ph ? 0.85 : 1.05], [pw + (ph ? 46 : 64) * S, H * (ph ? 0.97 : 0.985), ph ? 0.8 : 0.95]], tdat = [];
  // each pot is built from round slices seen at the floor's angle: a rounded base sitting on the floor, the flared shoulder, a
  // cream rim whose opening shows the soil, its right side in shade and its shadow lying flat on the floor beside it
  trees.forEach(function (q, n) { var px = q[0], py = q[1], s = q[2] * S * (ph ? 1.2 : 1), fq = fk(py), R = function (h) { return h > 46 ? 34 - (h - 46) / 16 * 4 : 24 + 10 * h / 46; }, by = 24 * s * fq, yc = function (h) { return py - by - h * s; };
    var arc = function (h, r, a0, a1, m) { var out = []; for (var u = 0; u <= m; u++) { var a = a0 + (a1 - a0) * u / m; out.push([px + Math.cos(a) * r * s, yc(h) + Math.sin(a) * r * s * fq]); } return out; };
    var prof = [62, 46, 0], left = prof.map(function (h) { return [px - R(h) * s, yc(h)]; }), right = prof.slice().reverse().map(function (h) { return [px + R(h) * s, yc(h)]; });
    var body = morocco_pg(arc(60, R(60), 0, Math.PI, 24).concat(left.slice(1), arc(0, R(0), Math.PI, 0, 24), right.slice(0, -1))), inside = morocco_pg(morocco_ep(px, yc(64), 30.5 * s, 30.5 * s * fq, 48)); // (the body hangs from the front of the rim; its inside shows through the rim)
    gsh += morocco_pg(morocco_ep(px + 10 * s, py - by * 0.5, 40 * s, 40 * s * fq * 0.75, 40));
    if (n) ngrn += body + inside; else ncob += body + inside;
    ncream += morocco_pg(morocco_ep(px, yc(64), 35 * s, 35 * s * fq, 48)) + morocco_hole(morocco_ep(px, yc(64), 30 * s, 30 * s * fq, 48));
    nsh += morocco_pg(morocco_ep(px, yc(64), 30 * s, 30 * s * fq, 48)) + morocco_pg(morocco_ep(px + 2 * s, yc(63), 26 * s, 24 * s * fq, 40));
    nor += morocco_pg(arc(44, R(44) + 0.4, 0, Math.PI, 24).concat(arc(40, R(40) + 0.4, Math.PI, 0, 24)));
    for (j = -2; j <= 2; j++) { var u0 = j * 12 / R(28); ncream += morocco_star(px + j * 12 * s, yc(28) + Math.sqrt(Math.max(0, 1 - u0 * u0)) * R(28) * s * fq, 4.6 * s, 0.5, 8, 0, 1); }
    var shadeR = prof.map(function (h) { return [px + R(h) * s, yc(h)]; }).concat(arc(0, R(0), 0, 0.98, 10), prof.slice().reverse().map(function (h) { return [px + R(h) * 0.56 * s, yc(h) + R(h) * s * fq * 0.83]; }));
    nsh += morocco_pg(shadeR);
    tdat.push({x: px, y: yc(63), s: s, k: n, fq: fq}); });
  // the brass lanterns: hanging under the arch, on the back wall between the arches, and standing on the floor
  var lan = [], hangs = ph ? [[0.2, 0.17, 0.95], [0.5, 0.075, 0.8], [0.82, 0.19, 1]] : [[0.16, 0.2, 1.05], [0.36, 0.11, 0.85], [0.6, 0.085, 0.8], [0.88, 0.24, 1.1]];
  for (i = 1; i < na; i++) lan.push({x: pw + i * sp, y: yd - (yd - fy1) * 0.42, len: 0, R: (ph ? 6 : 10) * (ph ? 1 : S), kind: 'wall', k: i});
  lan.push({x: fx + frx + (ph ? 46 : 70) * S, y: fyy + fh * 0.7, len: 0, R: (ph ? 10 : 15) * S * (ph ? 1.2 : 1), kind: 'floor', k: 7});
  if (!ph) lan.push({x: (rX + rw / 2 + fx - frx) / 2 - 4 * S, y: rY + rh2 * 0.1, len: 0, R: 13 * S, kind: 'floor', k: 8});
  function archY(xx) { var u = (xx - W / 2) / (W / 2 - pw + (ph ? 6 : 14)); return ARC.cy - ARC.ry * Math.sqrt(Math.max(0, 1 - u * u)); }
  // ---------------------------------------------------------------- the carved horseshoe arch we look through
  var aOpen = morocco_archPts(W / 2, H + 20, W - 2 * pw, H + 20 - (ARC.cy - ARC.ry), (W / 2 - pw + (ph ? 6 : 14)) / (W / 2 - pw), ph ? 9 : 13, ph ? 0.035 : 0.025, ARC.ry);
  var bandW = (ph ? 9 : 18) * (ph ? 1 : S), aBand = morocco_archPts(W / 2, H + 20, W - 2 * pw + bandW * 2, H + 20 - (ARC.cy - ARC.ry) + bandW, (W / 2 - pw + (ph ? 6 : 14) + bandW) / (W / 2 - pw + bandW), 0, 0, ARC.ry + bandW);
  var frame = rect(-20, -20, W + 40, H + 40) + morocco_hole(aBand), band = morocco_pg(aBand) + morocco_hole(aOpen);
  ncream += frame; ncob += band;
  // the arch has thickness: just inside the opening its underside (the soffit) shows, in shade, deeper at the sides than at the
  // crown since we look through from the middle; carved arrises along both edges of the band and along the soffit's inner edge
  var sfC = [W / 2, H * 0.45], aIn = aOpen.map(function (p) { return [p[0] + (sfC[0] - p[0]) * 0.065, p[1] + (sfC[1] - p[1]) * 0.065]; });
  // (while the engine runs it paints the soffit itself, lit slice by slice as a curved surface; this flat one is the still scene's)
  ncream += morocco_pg(aOpen.concat(aIn.slice().reverse())); if (!ANIM) { nsh += morocco_pg(aOpen.concat(aIn.slice().reverse())); nc += pline(aIn); }
  nc += pline(aBand.slice(1, -1));
  // the hanging lanterns (first in the list): each rope starts just inside the arch's band, so it is fixed to it
  hangs.forEach(function (q, n) { var hx = W * q[0], ay = morocco_topAt(aOpen.map(function (p, q) { return [(p[0] + aIn[q][0]) / 2, (p[1] + aIn[q][1]) / 2]; }), hx) || archY(hx); lan.splice(n, 0, {x: hx, y: ay, len: Math.max(14, H * q[1] - ay), R: (ph ? 9 : 14) * q[2] * (ph ? 1 : S), kind: 'hang', k: n}); });
  // stars along the band, small cream diamonds between them
  var bandMid = aOpen.map(function (p, q) { var o = aBand[q]; return [(p[0] + o[0]) / 2, (p[1] + o[1]) / 2]; }), acc = 0, step = bandW * 1.25;
  for (i = 1; i < bandMid.length; i++) { var d = Math.hypot(bandMid[i][0] - bandMid[i - 1][0], bandMid[i][1] - bandMid[i - 1][1]); acc += d;
    if (acc >= step) { acc = 0; var bp = bandMid[i]; if (bp[1] > H + 4 || bp[1] < -bandW) continue; if (!ph && bp[1] > ARC.cy + 24 * S && (Math.abs(bp[0] - (pw - 9)) < bandW * 0.5 + 9 || Math.abs(bp[0] - (W - pw + 9)) < bandW * 0.5 + 9)) continue; /* none on the columns */ ngrn += morocco_star(bp[0], bp[1], bandW * 0.36, 0.66, 8, Math.PI / 8); nor += morocco_star(bp[0], bp[1], bandW * 0.14, 0.6, 8, 0); } }
  // carved lines that follow the arch, and a lobed rosette in each top corner
  [1.6, 2.3].forEach(function (m) { var pts = morocco_archPts(W / 2, H + 20, W - 2 * pw + bandW * 2 * m, H + 20 - (ARC.cy - ARC.ry) + bandW * m, (W / 2 - pw + (ph ? 6 : 14) + bandW * m) / (W / 2 - pw + bandW * m), 0, 0, ARC.ry + bandW * m); var zt0 = H * (ph ? 0.8 : 0.66) - 6; pts = pts.slice(); pts[0] = [pts[0][0], Math.max(zt0, pts[1][1])]; pts[pts.length - 1] = [pts[pts.length - 1][0], Math.max(zt0, pts[pts.length - 2][1])]; nc += pline(pts); }); // (down the jambs to the tile panels, not through them)
  var ro = ph ? [[0.06, 0.035], [0.94, 0.035]] : [[0.06, 0.07], [0.94, 0.07]];
  ro.forEach(function (q) { var rx = W * q[0], ry = H * q[1], rr = ph ? 12 : 30 * S; if (ry > archY(rx) - rr * 0.6) return; ngrn += morocco_star(rx, ry, rr, 0.74, 8, Math.PI / 8); ncream += morocco_star(rx, ry, rr * 0.56, 0.7, 8, 0); nor += morocco_star(rx, ry, rr * 0.26, 0.6, 8, Math.PI / 8); nc += morocco_c(rx, ry, rr * 1.18); for (k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; nc += morocco_leaf(rx + Math.cos(a) * rr * 1.5, ry + Math.sin(a) * rr * 1.5, rr * 0.5, rr * 0.16, a * 57.3); } });
  // sebka lattice carved into the spandrels, kept clear of the carved arch lines (the outer one at 2.3 band widths) and the rosettes
  var lm = 2.3 + 7 * S / bandW + 0.6, latClear = morocco_archPts(W / 2, H + 20, W - 2 * pw + bandW * 2 * lm, H + 20 - (ARC.cy - ARC.ry) + bandW * lm, (W / 2 - pw + (ph ? 6 : 14) + bandW * lm) / (W / 2 - pw + bandW * lm), 0, 0, ARC.ry + bandW * lm);
  if (!ph) for (y = 6; y < ARC.cy; y += 22 * S) for (x = 6; x < W; x += 22 * S) { if (morocco_inside(latClear, x, y) || Math.hypot(x - W * 0.06, y - H * 0.07) < 76 * S || Math.hypot(x - W * 0.94, y - H * 0.07) < 76 * S) continue; nc += morocco_dia(x, y, 7 * S, 7 * S); }
  // the jambs: a zellige panel at the foot, a carved column with a capital, and a cedar strip
  [-1, 1].forEach(function (sd) { var jx0 = sd < 0 ? -20 : W - pw, jx1 = sd < 0 ? pw : W + 20, zt = H * (ph ? 0.8 : 0.66), zz = morocco_zel(jx0 + (sd < 0 ? 20 : 0) + 3, zt, pw - 6, H - zt, ph ? 9 : pw - 8);
    ncob += rect(jx0 + (sd < 0 ? 20 : 0) + 2, zt, pw - 4, H - zt + 10); ngrn += zz.star; nor += zz.dia; ng += zz.line;
    nor += rect(jx0 + (sd < 0 ? 20 : 0), zt - 5, pw, 4);
    if (!ph) { var cx = sd < 0 ? pw - 9 : W - pw + 9; ncream += rect(cx - 5, ARC.cy + 40 * S, 10, zt - ARC.cy - 46 * S); nc += seg(cx - 2, ARC.cy + 48 * S, cx - 2, zt - 10) + seg(cx + 2, ARC.cy + 48 * S, cx + 2, zt - 10); gold += rect(cx - 8, ARC.cy + 34 * S, 16, 7) + rect(cx - 7, zt - 12, 14, 5); nsh += rect(cx + 1.5, ARC.cy + 41 * S, 3.5, zt - ARC.cy - 53 * S) + rect(cx + 3, ARC.cy + 34 * S, 5, 7) + rect(cx + 2.5, zt - 12, 4.5, 5); }
    nsh += rect(sd < 0 ? pw - 3 : W - pw, aOpen[1][1], 3, H + 20 - aOpen[1][1]); });
  add(mid, 'g', gsh, C.shade); add(near, 'a', rug, C.rug); add(near, 'b', water, C.water); add(near, 'c', ncob, C.cob); add(near, 'd', ncream, C.ncream); add(near, 'e', ngrn, C.grn); add(near, 'f', nor, C.norange); add(near, 'g', gold, C.gold); add(near, 'h', nsh, C.nshade);
  stk(near, 's', ng, C.grout, ph ? 0.7 : 1); stk(near, 't', nc, C.carve, ph ? 0.8 : 1.2);
  if (ANIM) { ANIM.C = C; ANIM.stars = stars; ANIM.lan = lan; ANIM.trees = tdat; ANIM.arches = arches; ANIM.candles = candles; ANIM.yw = yw; ANIM.yf = yf; ANIM.ARC = ARC; ANIM.pw = pw; ANIM.soffit = [aOpen, aIn];
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
