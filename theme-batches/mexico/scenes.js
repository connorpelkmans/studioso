// ---- world theme: mexico (Mexico)
// A colonial hillside town in the style of Guanajuato and San Miguel de Allende: houses in saffron, cobalt, coral, lime
// and magenta stacked up two dry hills with blue jacarandas between them, a pink sandstone cathedral with Gothic spires
// and a tiled dome behind it, and in front a cobblestone plaza with box-trimmed laurels, a wrought-iron bandstand, a
// talavera fountain, potted agave and cacti, iron lamps and a balloon cart. Papel picado strings cross the top, a
// jacaranda leans in at the top left and bougainvillea spills off a pergola at the top right. Every shape is drawn
// clockwise (like rect()), so shapes that share a layer slot merge instead of punching holes in each other.
function mexico_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function mexico_pg(p) { return poly(mexico_area(p) < 0 ? p.slice().reverse() : p); }
// the same outline wound the other way: inside a clockwise shape of the same slot it cuts a hole
function mexico_hole(p) { return poly(mexico_area(p) > 0 ? p.slice().reverse() : p); }
function mexico_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function mexico_c(x, y, r) { return mexico_e(x, y, r, r); }
function mexico_ep(x, y, rx, ry, n, a0, a1) { var p = []; a0 = a0 || 0; a1 = a1 == null ? Math.PI * 2 : a1; for (var i = 0; i < n; i++) { var t = a0 + i / n * (a1 - a0); p.push([x + Math.cos(t) * rx, y + Math.sin(t) * ry]); } return p; }
function mexico_leaf(x, y, len, w, ang) { var pts = [], i; for (i = 0; i <= 10; i++) { var t = i / 10; pts.push([t * len, w * Math.sin(Math.PI * t) * (1 - 0.3 * t)]); } for (i = 9; i > 0; i--) { var u = i / 10; pts.push([u * len, -w * Math.sin(Math.PI * u) * (1 - 0.3 * u)]); } return mexico_pg(rotp(pts, x, y, ang)); }
// a pointed (Gothic, equilateral) arch: from the bottom left up to an apex h above yb and down again (open at the bottom)
function mexico_gothPts(x, yb, w, h) {
  var ys = yb - h + w * 0.866, p = [[x - w / 2, yb]], i, a;
  for (i = 0; i <= 8; i++) { a = Math.PI - i / 8 * Math.PI / 3; p.push([x + w / 2 + Math.cos(a) * w, ys - Math.sin(a) * w]); }
  for (i = 1; i <= 8; i++) { a = Math.PI / 3 - i / 8 * Math.PI / 3; p.push([x - w / 2 + Math.cos(a) * w, ys - Math.sin(a) * w]); }
  p.push([x + w / 2, yb]); return p; }
function mexico_goth(x, yb, w, h) { return mexico_pg(mexico_gothPts(x, yb, w, h)); }
// a round-headed arch (open at the bottom)
function mexico_roundPts(x, yb, w, h) { var r = w / 2, p = [[x - r, yb]]; for (var i = 0; i <= 14; i++) { var a = Math.PI - i / 14 * Math.PI; p.push([x + Math.cos(a) * r, yb - h + r - Math.sin(a) * r]); } p.push([x + r, yb]); return p; }
// a Gothic spire with little crockets (bumps) up both edges and a ball at the tip
function mexico_spire(x, yb, w, h, nc) {
  var L = [[x - w / 2, yb]], i;
  for (i = 1; i < nc; i++) { var u = i / nc, ex = x - w / 2 * (1 - u), ey = yb - h * u, st = h / nc, bw = w * 0.16 * (1 - u * 0.5);
    L.push([ex + bw * 0.1, ey + st * 0.32]); L.push([ex - bw, ey + st * 0.08]); L.push([ex + bw * 0.2, ey - st * 0.12]); }
  var R = L.slice().reverse().map(function (p) { return [2 * x - p[0], p[1]]; });
  return mexico_pg(L.concat([[x, yb - h]], R)) + mexico_c(x, yb - h - w * 0.08, w * 0.13); }
// a pinnacle: a little base block with a crocketed spire on it
function mexico_pinn(x, yb, w, h) { return rect(x - w / 2, yb - h * 0.26, w, h * 0.26) + mexico_spire(x, yb - h * 0.26, w * 0.92, h * 0.74, 3); }
var mexico_PAL = {
  L: {haze: 'rgba(255,238,214,0.8)', cloud: 'rgba(255,255,255,0.86)', mtnA: '#B9C3DA', mtnB: '#CDB898', mshade: 'rgba(120,80,100,0.16)', hill: '#D2B47C', scrub: '#8A9458', jac: '#9F8EE2',
    cream: '#FFF3DE', saf: '#F4B23A', cob: '#3462B6', coral: '#F27A5A', lime: '#AECB55', mag: '#DA4682', bshade: 'rgba(90,40,60,0.2)', win: '#4E3150',
    ground: '#DCC6A6', pink: '#EDA08C', msaf: '#F0A632', mcob: '#3A66B6', oxb: '#BC4A3C', mcream: '#FFF2DE', dark: '#5C3044', shade: 'rgba(110,40,50,0.18)',
    grout: 'rgba(130,95,70,0.24)', carve: 'rgba(150,60,60,0.42)', bline: 'rgba(255,250,240,0.55)', bdark: 'rgba(80,30,50,0.28)',
    green: '#4F8C40', nshade: 'rgba(70,40,30,0.2)', njac: '#A08EEA', white: '#FFFBF3', ncob: '#2C58B2', iron: '#35443F', nmag: '#E2468C', nsaf: '#F2B43A', nlight: 'rgba(255,255,255,0.6)', ink: 'rgba(45,30,45,0.5)'},
  D: {haze: 'rgba(160,80,130,0.32)', cloud: 'rgba(170,150,215,0.22)', mtnA: '#3A3C74', mtnB: '#4A3C6C', mshade: 'rgba(10,5,30,0.3)', hill: '#3E3258', scrub: '#2C2A4A', jac: '#5C4E9E',
    cream: '#6C6090', saf: '#9C7448', cob: '#24366E', coral: '#8C4C5C', lime: '#566A50', mag: '#7C3062', bshade: 'rgba(10,5,30,0.3)', win: '#1E1636',
    ground: '#4A3E5E', pink: '#80516E', msaf: '#8A6440', mcob: '#26366C', oxb: '#5E2A42', mcream: '#7C7096', dark: '#1A1230', shade: 'rgba(10,5,30,0.3)',
    grout: 'rgba(20,10,40,0.4)', carve: 'rgba(30,10,40,0.42)', bline: 'rgba(200,190,240,0.25)', bdark: 'rgba(10,5,30,0.35)',
    green: '#24443E', nshade: 'rgba(5,0,20,0.35)', njac: '#5E4EA2', white: '#9088B2', ncob: '#2A3E88', iron: '#151B28', nmag: '#9C306C', nsaf: '#C89440', nlight: 'rgba(220,210,255,0.3)', ink: 'rgba(5,0,20,0.55)'}
};
SCENES.mexico = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.5), bg = Lay(0.6), mid = Lay(0), near = Lay(0), C = mexico_PAL[dk ? 'D' : 'L'], i, j, k, x, y;
  var S = ph ? W / 390 * 0.64 : Math.max(0.75, Math.min(1.15, H / 800));
  var sky = dk ? 'linear-gradient(180deg,#0F1636 0%,#2A2458 42%,#6A3458 72%,#3E2A56 100%)' : 'linear-gradient(180deg,#8CCBF0 0%,#E4F2F6 44%,#FCE2C6 70%,#F2D2B2 100%)';
  var cx = W * (ph ? 0.5 : 0.585), yb = H * (ph ? 0.6 : 0.665);
  // ---------------------------------------------------------------- the sky and the dry mountains (soft, far)
  var sun = [W * (ph ? 0.22 : 0.3), H * (ph ? 0.15 : 0.13)];
  add(far, 'a', mexico_e(W * 0.5, H * 0.42, W * 0.8, H * 0.12) + (dk ? '' : mexico_c(sun[0], sun[1], ph ? 30 : 46)), C.haze);
  if (!dk) spread(0, H * 0.03, W, H * 0.18, ph ? 190 : 300, 80, rnd, 0.8).forEach(function (c) { if (c.q < 0.55) add(far, 'b', mexico_e(c.x, c.y, 50 + c.r * 60, 7 + c.k * 5) + mexico_e(c.x + 22, c.y - 6, 28, 7) + mexico_e(c.x - 18, c.y - 3, 20, 6), C.cloud); });
  var stars = []; spread(0, 0, W, H * 0.34, ph ? 34 : 40, ph ? 30 : 36, rnd, 1).forEach(function (c) { if (c.q < 0.42) stars.push({x: c.x, y: c.y, r: 0.6 + c.r * 1.1, k: c.k}); });
  var mA = [], mB = [], msh = '';
  for (x = -60; x <= W + 60; x += 6) {
    mA.push([x, H * (ph ? 0.3 : 0.33) - H * (ph ? 0.07 : 0.1) * (0.5 + 0.5 * Math.abs(Math.sin(x / (ph ? 90 : 190) + 0.4))) - H * 0.018 * Math.sin(x / 37 + 1.1)]);
    mB.push([x, H * (ph ? 0.33 : 0.37) - H * (ph ? 0.05 : 0.07) * (0.5 + 0.5 * Math.sin(x / (ph ? 70 : 140) + 2.2)) - H * 0.012 * Math.abs(Math.sin(x / 23))]); }
  // ridge shadows: a darker band under each ridge line, broken into gullies
  for (i = 2; i < mB.length - 2; i += 3) { var p0 = mB[i], p1 = mB[i + 1]; if (p1[1] > p0[1]) msh += mexico_pg([[p0[0], p0[1]], [p1[0] + 4, p1[1]], [p1[0] + 10, p1[1] + H * 0.05], [p0[0] + 2, p0[1] + H * 0.03]]); }
  add(far, 'c', below(mA, H * 0.6), C.mtnA); add(far, 'd', below(mB, H * 0.6), C.mtnB); add(far, 'e', msh, C.mshade);
  // ---------------------------------------------------------------- the two town hills (the valley sits behind the cathedral)
  var sm = function (u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  var hillY = function (x) { var l = H * ((ph ? 0.22 : 0.25) + (ph ? 0.3 : 0.3) * sm((x - W * (ph ? 0.05 : 0.1)) / (W * (ph ? 0.5 : 0.42)))), r = H * ((ph ? 0.24 : 0.27) + 0.28 * sm((W * (ph ? 0.95 : 0.93) - x) / (W * (ph ? 0.45 : 0.32))));
    return Math.min(l, r) + H * 0.008 * Math.sin(x / 31) + H * 0.005 * Math.sin(x / 11 + 2); };
  var hill = []; for (x = -60; x <= W + 60; x += 5) hill.push([x, hillY(x)]);
  add(far, 'f', below(hill, yb + 10), C.hill);
  // scrub and jacarandas dotted over the hills (seen between the houses)
  var scrub = '', jac = '';
  spread(0, H * 0.2, W, yb - H * 0.2, ph ? 20 : 26, ph ? 16 : 20, rnd, 0.9).forEach(function (c) { var top = hillY(c.x); if (c.y < top + 6 * S) return;
    var r = (5 + c.r * 7) * S; if (c.q < 0.16) jac += mexico_c(c.x, c.y, r * 1.2) + mexico_c(c.x + r * 0.8, c.y + r * 0.3, r * 0.9) + mexico_c(c.x - r * 0.8, c.y + r * 0.4, r * 0.8); else if (c.q < 0.5) scrub += mexico_c(c.x, c.y, r) + mexico_c(c.x + r * 0.7, c.y + r * 0.2, r * 0.7); });
  add(far, 'g', scrub, C.scrub); add(far, 'h', jac, C.jac);
  if (!ANIM && dk) { var stD = ''; stars.forEach(function (s) { if (s.y < hillY(s.x) - 8 && s.y < mA[Math.max(0, Math.min(mA.length - 1, Math.round((s.x + 60) / 6)))][1] - 6) stD += mexico_c(s.x, s.y, s.r); }); add(far, 'b', stD, '#FFF4DA'); }
  // ---------------------------------------------------------------- the plaza front: buildings, cathedral (mid)
  var sky2 = []; for (x = 0; x <= W; x += 2) sky2.push(H * 2);
  var occ = function (x0, x1, yt) { for (var q = Math.max(0, Math.floor(x0 / 2)); q <= Math.min(sky2.length - 1, Math.ceil(x1 / 2)); q++) sky2[q] = Math.min(sky2[q], yt); };
  var midTop = function (xx) { return sky2[Math.max(0, Math.min(sky2.length - 1, Math.round(xx / 2)))]; };
  var mg = {saf: '', cob: '', oxb: '', pink: '', cream: '', dark: '', shade: ''}, carve = '', grout = '';
  var bal = [];   // balcony flower boxes (the engine sways their flowers)
  // a two-storey colonial facade: cornice, tall windows with iron balconies, and an arcade or doors on the ground floor
  var facade = function (x0, x1, top, col, arcade) {
    var w = x1 - x0, hh = yb - top, fl = top + hh * 0.5, cs = 7 * S;
    mg[col] += rect(x0, top, w, hh + 2);
    mg.cream += rect(x0 - 2, top - cs, w + 4, cs) + rect(x0, fl - 3 * S, w, 4 * S);
    for (var q = x0 + 6 * S; q < x1 - 6 * S; q += 12 * S) mg.cream += rect(q, top - cs - 3 * S, 6 * S, 3 * S);
    mg.shade += rect(x0, top, w, 4 * S) + rect(x0, fl + 1 * S, w, 3 * S) + rect(x1 - 5 * S, top, 5 * S, hh);
    var nw = Math.max(1, Math.round(w / (34 * S))), sp = w / nw;
    for (var n = 0; n < nw; n++) { var wx = x0 + (n + 0.5) * sp, ww = Math.min(16 * S, sp * 0.5), wt = top + hh * 0.12, wh = fl - wt - hh * 0.08;
      mg.cream += rect(wx - ww / 2 - 3 * S, wt - 3 * S, ww + 6 * S, wh + 3 * S);
      mg.dark += rect(wx - ww / 2, wt, ww, wh);
      carve += seg(wx, wt + 1, wx, wt + wh) + seg(wx - ww / 2, wt + wh * 0.4, wx + ww / 2, wt + wh * 0.4);
      // the balcony: a slab, iron railing posts and a flower box
      var by = wt + wh - 1 * S; mg.cream += rect(wx - ww / 2 - 6 * S, by, ww + 12 * S, 3 * S);
      for (var r = 0; r <= 6; r++) mg.dark += rect(wx - ww / 2 - 5 * S + r * (ww + 10 * S) / 6 - 0.6, by - 9 * S, 1.3, 9 * S);
      mg.dark += rect(wx - ww / 2 - 5 * S, by - 10 * S, ww + 10 * S, 1.6 * S);
      mg.shade += rect(wx - ww / 2 - 6 * S, by + 3 * S, ww + 12 * S, 3 * S);
      bal.push({x: wx, y: by - 10 * S, w: ww + 6 * S, k: bal.length});
      // ground floor: an arcade or a wooden door with a lamp of light above it
      if (arcade) { var aw = sp * 0.7, ap = mexico_roundPts(wx, yb, aw, hh * 0.42); mg.cream += mexico_pg(mexico_roundPts(wx, yb, aw + 6 * S, hh * 0.42 + 3 * S)); mg.dark += mexico_pg(ap); mg.shade += mexico_pg(mexico_roundPts(wx, yb, aw, hh * 0.42).map(function (p) { return [p[0], Math.min(yb, p[1] + hh * 0.08)]; })); }
      else if (n % 2 === 0 || nw === 1) { var dw = Math.min(14 * S, sp * 0.4), dh = hh * 0.36; mg.cream += rect(wx - dw / 2 - 3 * S, yb - dh - 3 * S, dw + 6 * S, dh + 3 * S); mg.dark += rect(wx - dw / 2, yb - dh, dw, dh); carve += seg(wx, yb - dh, wx, yb); }
      else { mg.cream += rect(wx - ww / 2 - 2 * S, fl + hh * 0.12, ww + 4 * S, hh * 0.22); mg.dark += rect(wx - ww / 2, fl + hh * 0.14, ww, hh * 0.18); for (r = 1; r < 4; r++) carve += seg(wx - ww / 2 + r * ww / 4, fl + hh * 0.14, wx - ww / 2 + r * ww / 4, fl + hh * 0.32); } }
    occ(x0 - 2, x1 + 2, top - cs - 3 * S); };
  var xL1 = cx - 182 * S, xR0 = cx + 182 * S;
  if (ph) { facade(-10, xL1, yb - 118 * S, 'saf', false); facade(xR0, W + 10, yb - 128 * S, 'cob', false); }
  else {
    var lw = xL1 + 10, f1 = -10 + lw * 0.36, f2 = f1 + lw * 0.34;
    facade(-10, f1, yb - 150 * S, 'cob', false); facade(f1, f2, yb - 132 * S, 'oxb', true); facade(f2, xL1, yb - 160 * S, 'saf', false);
    var rw = W + 10 - xR0, g1 = xR0 + rw * 0.55; facade(xR0, g1, yb - 140 * S, 'saf', true); facade(g1, W + 10, yb - 156 * S, 'oxb', false); }
  // ---- the cathedral: a Gothic pink sandstone front with a tiered central tower, two side towers and many pinnacles
  var cath = '', cs2 = '', tw0 = 120 * S, y1 = yb - 150 * S, y2 = y1 - 92 * S, y3 = y2 - 72 * S, y4 = y3 - 56 * S, spH = 112 * S, bells = [];
  // the body of the front, with a row of small pinnacles along its top
  cath += rect(cx - 116 * S, y1, 232 * S, yb - y1 + 2);
  for (k = -4; k <= 4; k++) if (k) cath += mexico_pinn(cx + k * 25 * S, y1 + 1, 7 * S, 24 * S);
  // the side towers with their crocketed spires and corner pinnacles
  [-1, 1].forEach(function (sd) { var tx = cx + sd * 146 * S, tt = yb - 252 * S; cath += rect(tx - 24 * S, tt, 48 * S, yb - tt + 2) + rect(tx - 27 * S, tt - 8 * S, 54 * S, 8 * S);
    cath += mexico_spire(tx, tt - 8 * S, 34 * S, 82 * S, 5) + mexico_pinn(tx - 22 * S, tt - 7 * S, 8 * S, 34 * S) + mexico_pinn(tx + 22 * S, tt - 7 * S, 8 * S, 34 * S);
    mg.shade += rect(tx + (sd > 0 ? 8 : 12) * S, tt, 12 * S, yb - tt) + mexico_pg([[tx, tt - 8 * S], [tx + 17 * S, tt - 8 * S], [tx, tt - 90 * S]]);
    [0, 1].forEach(function (lv) { var oy = yb - (lv ? 205 : 120) * S; mg.dark += mexico_goth(tx, oy, 16 * S, 42 * S); carve += pline(mexico_gothPts(tx, oy, 22 * S, 46 * S).slice(1, -1)); mg.cream += rect(tx - 13 * S, oy, 26 * S, 3 * S); if (lv) bells.push({x: tx, y: oy - 34 * S, s: 0.62 * S, k: bells.length}); });
    carve += seg(tx - 24 * S, tt + 2, tx + 24 * S, tt + 2) + seg(tx - 24 * S, yb - 160 * S, tx + 24 * S, yb - 160 * S);
    occ(tx - 27 * S, tx + 27 * S, tt - 90 * S); });
  // the central tower: three tiers getting narrower, then the tall spire
  [[y1, y2, tw0, 2], [y2, y3, tw0 * 0.8, 2], [y3, y4, tw0 * 0.6, 1]].forEach(function (t, n) { var w = t[2], ybt = t[0], ytt = t[1], hh = ybt - ytt;
    cath += rect(cx - w / 2, ytt, w, hh + 2) + rect(cx - w / 2 - 4 * S, ytt - 6 * S, w + 8 * S, 6 * S);
    mg.cream += rect(cx - w / 2 - 4 * S, ytt - 7.5 * S, w + 8 * S, 2 * S);
    // corner pinnacles that rise past the tier above, and a balustrade of tiny arches
    cath += mexico_pinn(cx - w / 2 - 1 * S, ytt - 5 * S, 10 * S, (42 - n * 6) * S) + mexico_pinn(cx + w / 2 + 1 * S, ytt - 5 * S, 10 * S, (42 - n * 6) * S);
    for (var q = 0; q < 6 - n; q++) { var bx = cx - w / 2 + (q + 0.5) * w / (6 - n); carve += pline(mexico_gothPts(bx, ytt - 1, w / (6 - n) * 0.6, 5 * S).slice(1, -1)); }
    mg.shade += rect(cx + w / 2 - 12 * S, ytt, 12 * S, hh) + rect(cx - w / 2, ybt - 3 * S, w, 3 * S);
    // openings: the belfry on the first tier, tall lancets above
    var ow = (n === 0 ? 26 : n === 1 ? 18 : 14) * S, oh = hh * (n === 0 ? 0.66 : 0.6);
    for (q = 0; q < t[3]; q++) { var ox = t[3] === 1 ? cx : cx + (q ? 1 : -1) * w * 0.22, oy = ybt - hh * 0.14;
      mg.dark += mexico_goth(ox, oy, ow, oh); carve += pline(mexico_gothPts(ox, oy, ow + 7 * S, oh + 5 * S).slice(1, -1)); mg.cream += rect(ox - ow / 2 - 3 * S, oy, ow + 6 * S, 3 * S);
      if (n === 0) bells.push({x: ox, y: oy - oh * 0.62, s: 1 * S, k: bells.length}); else carve += seg(ox, oy - oh * 0.6, ox, oy); }
    carve += seg(cx - w / 2 + 5 * S, ytt + 2, cx - w / 2 + 5 * S, ybt) + seg(cx + w / 2 - 5 * S, ytt + 2, cx + w / 2 - 5 * S, ybt);
    if (n === 1) { var clk = [cx, ytt + hh * 0.22]; mg.cream += mexico_c(clk[0], clk[1], 9 * S); carve += seg(clk[0], clk[1], clk[0], clk[1] - 6 * S) + seg(clk[0], clk[1], clk[0] + 4 * S, clk[1] + 1.5 * S) + mexico_c(clk[0], clk[1], 7 * S); mg.dark += mexico_c(clk[0], clk[1], 1.4 * S); } });
  cath += mexico_spire(cx, y4 - 5 * S, 50 * S, spH, 7);
  mg.shade += mexico_pg([[cx, y4 - 5 * S], [cx + 22 * S, y4 - 5 * S], [cx, y4 - 5 * S - spH]]);
  // a slim finial cross on the spire tip
  cath += rect(cx - 1.2 * S, y4 - spH - 26 * S, 2.4 * S, 18 * S) + rect(cx - 5 * S, y4 - spH - 21 * S, 10 * S, 2.4 * S);
  carve += seg(cx, y4 - 5 * S, cx, y4 - spH * 0.85) ;
  for (k = 1; k < 4; k++) { var ry = y4 - 5 * S - spH * k * 0.22, rwid = 25 * S * (1 - k * 0.22); carve += seg(cx - rwid, ry, cx + rwid, ry); }
  occ(cx - 120 * S, cx + 120 * S, y1 - 30 * S); occ(cx - 66 * S, cx + 66 * S, y2 - 40 * S); occ(cx - 52 * S, cx + 52 * S, y3 - 40 * S); occ(cx - 40 * S, cx + 40 * S, y4 - 20 * S); occ(cx - 18 * S, cx + 18 * S, y4 - spH * 0.6); occ(cx - 6 * S, cx + 6 * S, y4 - spH - 24 * S);
  // the portal: a tall pointed doorway with stepped mouldings, a rose window above, and buttress lines
  var dW = 54 * S, dH = 104 * S;
  mg.dark += mexico_goth(cx, yb, dW, dH);
  [9, 18, 26].forEach(function (m) { carve += pline(mexico_gothPts(cx, yb, dW + m * S, dH + m * 0.7 * S).slice(1, -1)); });
  mg.shade += rect(cx - dW / 2 - 13 * S, yb - 4 * S, dW + 26 * S, 4 * S);
  carve += seg(cx, yb - dH + 18 * S, cx, yb) + seg(cx - dW / 2 + 4 * S, yb - dH * 0.55, cx + dW / 2 - 4 * S, yb - dH * 0.55);
  [-1, 1].forEach(function (sd) { var px = cx + sd * 82 * S; carve += seg(px, y1 + 10 * S, px, yb) + seg(px + 8 * S, y1 + 10 * S, px + 8 * S, yb); mg.dark += mexico_goth(cx + sd * 52 * S, yb - 62 * S, 14 * S, 40 * S); carve += pline(mexico_gothPts(cx + sd * 52 * S, yb - 62 * S, 20 * S, 44 * S).slice(1, -1)); mg.cream += rect(cx + sd * 52 * S - 10 * S, yb - 62 * S, 20 * S, 3 * S); });
  // a blind arcade frieze across the front, and quatrefoils over the side doors
  for (k = 0; k < 14; k++) { var fxa = cx - 112 * S + (k + 0.5) * 224 * S / 14; carve += pline(mexico_gothPts(fxa, y1 + 26 * S, 11 * S, 16 * S).slice(1, -1)); }
  carve += seg(cx - 116 * S, y1 + 8 * S, cx + 116 * S, y1 + 8 * S) + seg(cx - 116 * S, y1 + 28 * S, cx + 116 * S, y1 + 28 * S);
  [-1, 1].forEach(function (sd) { var qx = cx + sd * 52 * S, qy = yb - 120 * S; for (var m = 0; m < 4; m++) { var a = m * Math.PI / 2; carve += mexico_c(qx + Math.cos(a) * 4 * S, qy + Math.sin(a) * 4 * S, 3.6 * S); } mg.dark += mexico_c(qx, qy, 2 * S); });
  // steps across the front
  mg.cream += rect(cx - 124 * S, yb - 2 * S, 248 * S, 5 * S) + rect(cx - 132 * S, yb + 3 * S, 264 * S, 5 * S);
  mg.shade += rect(cx - 132 * S, yb + 8 * S, 264 * S, 3 * S);
  mg.pink += cath;
  // ---- the plaza: warm stone cobbles in perspective, a pale paving ring and a path to the doors
  var fx = W * (ph ? 0.5 : 0.47), fy = H * (ph ? 0.875 : 0.9), frx = (ph ? 96 : 150) * S * (ph ? 1.25 : 1), fry = frx * 0.22;
  var ground = rect(-10, yb, W + 20, H - yb + 10), vy = yb - H * 0.95, pave = '';
  pave += mexico_e(fx, fy + 6 * S, frx * 1.5, fry * 1.9) + mexico_hole(mexico_ep(fx, fy + 6 * S, frx * 1.32, fry * 1.62, 60));
  pave += mexico_pg([[cx - 30 * S, yb + 8 * S], [cx + 30 * S, yb + 8 * S], [fx + frx * 0.5, fy - fry * 1.9], [fx - frx * 0.5, fy - fry * 1.9]]);
  var rows = []; for (y = yb + 4, k = 0; y < H + 30; k++) { rows.push(y); y += (ph ? 5 : 6) + (y - yb) * 0.17; }
  rows.forEach(function (ry, r) { var sc = (ry - vy) / (H - vy), cw = (ph ? 13 : 20) * sc, rh = (rows[r + 1] || ry + 30) - ry, pl = [];
    for (x = -10; x <= W + 10; x += 14) pl.push([x, ry + Math.sin(x / 9 + r) * rh * 0.06]); grout += pline(pl);
    for (var jx = W / 2 - Math.ceil(W / cw) * cw + (r % 2 ? cw / 2 : 0); jx < W + cw; jx += cw * (0.85 + hash(jx + r * 7) * 0.3)) { var dx = (jx - W / 2) * rh / (ry - vy); grout += 'M' + PT(jx, ry) + ' Q' + PT(jx + dx * 0.5 + rh * 0.12, ry + rh * 0.5) + ' ' + PT(jx + dx, ry + rh) + ' '; } });
  mg.shade += rect(-10, yb, W + 20, 4 * S);
  add(mid, 'a', ground, C.ground); add(mid, 'b', mg.pink, C.pink); add(mid, 'c', mg.saf, C.msaf); add(mid, 'd', mg.cob, C.mcob); add(mid, 'e', mg.oxb, C.oxb); add(mid, 'f', pave + mg.cream, C.mcream); add(mid, 'g', mg.dark, C.dark); add(mid, 'h', mg.shade, C.shade);
  stk(mid, 's', grout, C.grout, ph ? 0.7 : 1); stk(mid, 't', carve, C.carve, ph ? 0.8 : 1.1);
  // ---------------------------------------------------------------- the hillside town (bg): stacked painted houses, a chapel and the tiled dome
  var bgs = {cream: '', saf: '', cob: '', coral: '', lime: '', mag: '', shade: '', win: ''}, bl = '', bd = '', wins = [];
  // the big tiled dome behind the cathedral's right shoulder: a coral drum, saffron tiles with cobalt chevrons, a lantern
  var dm = {x: cx + (ph ? 150 : 210) * S, yt: yb - 228 * S, rx: 50 * S, ry: 70 * S};
  bgs.coral += rect(dm.x - dm.rx * 0.92, dm.yt, dm.rx * 1.84, 90 * S);
  for (k = -2; k <= 2; k++) { bgs.win += mexico_pg(mexico_roundPts(dm.x + k * dm.rx * 0.34, dm.yt + 46 * S, 9 * S, 28 * S)); }
  bgs.cream += rect(dm.x - dm.rx, dm.yt - 6 * S, dm.rx * 2, 6 * S);
  var domeP = []; for (k = 0; k <= 30; k++) { var a = Math.PI + k / 30 * Math.PI, pk = 1 + 0.12 * Math.pow(Math.abs(Math.cos(a / 2 - Math.PI / 2)), 6); domeP.push([dm.x + Math.cos(a) * dm.rx * 0.96, dm.yt - 6 * S + Math.sin(a) * dm.ry * pk]); }
  bgs.saf += mexico_pg(domeP);
  // the chevron bands follow the dome's curve; the ribs run up to the lantern
  for (j = 1; j <= 5; j++) { var u0 = j / 6, band = []; for (k = 0; k <= 16; k++) { var t = k / 16, ax = Math.PI + t * Math.PI, yy = dm.yt - 6 * S + Math.sin(ax) * dm.ry * u0 * 1.02, zz = (k % 2 ? -3.4 : 0) * S; band.push([dm.x + Math.cos(ax) * dm.rx * 0.96 * Math.sqrt(1 - u0 * u0 * 0.9), yy + zz]); }
    var band2 = band.map(function (p) { return [p[0], p[1] + 4 * S]; }).reverse(); if (j % 2) bgs.cob += mexico_pg(band.concat(band2)); }
  for (k = -3; k <= 3; k++) bl += 'M' + PT(dm.x + k * dm.rx * 0.3, dm.yt - 6 * S) + ' Q' + PT(dm.x + k * dm.rx * 0.22, dm.yt - dm.ry * 0.7) + ' ' + PT(dm.x, dm.yt - 6 * S - dm.ry * 1.08) + ' ';
  var lt = dm.yt - 6 * S - dm.ry * 1.12; bgs.cream += rect(dm.x - 7 * S, lt - 22 * S, 14 * S, 22 * S) + mexico_pg(mexico_roundPts(dm.x, lt - 22 * S, 18 * S, 10 * S)) + rect(dm.x - 1 * S, lt - 42 * S, 2 * S, 12 * S);
  bgs.win += rect(dm.x - 2 * S, lt - 18 * S, 4 * S, 12 * S);
  var reserve = [[dm.x - dm.rx - 4, dm.x + dm.rx + 4, lt - 44 * S]];
  // a little chapel up the left hill with a tiled dome and a bell gable
  var chX = W * (ph ? 0.2 : 0.2), chY = hillY(W * (ph ? 0.2 : 0.2)) + (ph ? 46 : 70) * S, chw = (ph ? 46 : 60) * S, chh = 30 * S;
  bgs.coral += rect(chX - chw / 2, chY - chh, chw, chh);
  bgs.cream += rect(chX - chw / 2 - 2, chY - chh - 3 * S, chw + 4, 3 * S) + mexico_pg([[chX + chw * 0.1, chY - chh - 3 * S], [chX + chw * 0.5, chY - chh - 3 * S], [chX + chw * 0.5, chY - chh - 18 * S], [chX + chw * 0.3, chY - chh - 26 * S], [chX + chw * 0.1, chY - chh - 18 * S]]);
  bgs.win += mexico_pg(mexico_roundPts(chX + chw * 0.3, chY - chh - 10 * S, 6 * S, 9 * S)) + mexico_pg(mexico_roundPts(chX - chw * 0.12, chY, 10 * S, 16 * S));
  bgs.saf += mexico_pg(mexico_ep(chX - chw * 0.22, chY - chh - 3 * S, 13 * S, 15 * S, 20, Math.PI, Math.PI * 2).concat([[chX - chw * 0.22 + 13 * S, chY - chh - 3 * S]]));
  bgs.cob += rect(chX - chw * 0.22 - 1 * S, chY - chh - 24 * S, 2 * S, 7 * S);
  reserve.push([chX - chw / 2 - 4, chX + chw / 2 + 4, chY - chh - 28 * S]);
  // the houses: terraces of flat-roofed boxes that follow the hill, each with a cream parapet, windows and a door
  var cols = ['saf', 'cob', 'coral', 'lime', 'mag', 'cream'], rowH = (ph ? 13 : 17) * S, last = -1;
  for (var rb = H * (ph ? 0.2 : 0.23) + rowH, rn = 0; rb < yb + rowH; rb += rowH, rn++) {
    x = -12 + rnd() * 8;
    while (x < W + 12) { var hw = (ph ? 13 : 18) * S + rnd() * (ph ? 14 : 22) * S, ht = rowH * (0.62 + rnd() * 0.36), top = rb - ht;
      var okHill = hillY(x) < top - 2 && hillY(x + hw) < top - 2, seen = midTop(x) > top || midTop(x + hw / 2) > top || midTop(x + hw) > top;
      var clash = reserve.some(function (q) { return x + hw > q[0] && x < q[1] && rb > q[2]; });
      if (okHill && seen && !clash && rnd() > 0.08) {
        {
          var ci; do { ci = Math.floor(rnd() * cols.length); } while (ci === last); last = ci;
          bgs[cols[ci]] += rect(x, top, hw, ht);
          bgs[ci === 5 ? 'saf' : 'cream'] += rect(x - 1, top - 2.4 * S, hw + 2, 2.4 * S);
          bgs.shade += rect(x + hw * 0.8, top, hw * 0.2, ht) + rect(x, top, hw * 0.8, 1.6 * S);
          var nwn = Math.max(1, Math.floor(hw / (9 * S)));
          for (j = 0; j < nwn; j++) { var wx2 = x + (j + 0.5) * hw * 0.8 / nwn + hw * 0.02, ww2 = 3.2 * S, wh2 = 4.4 * S, wy = top + ht * 0.24;
            if (rnd() < 0.8) { bgs.win += rect(wx2 - ww2 / 2, wy, ww2, wh2); if (midTop(wx2) > wy + wh2) wins.push({x: wx2, y: wy + wh2 / 2, w: ww2, h: wh2, k: hash(wins.length + 3)}); }
            if (ht > rowH * 0.8 && j === nwn - 1 && rnd() < 0.6) bgs.win += rect(wx2 - 2 * S, top + ht - 7 * S, 4 * S, 7 * S); }
          if (rnd() < 0.18) bl += seg(x + 1, top + ht * 0.62, x + hw * 0.8, top + ht * 0.62);
          if (rnd() < 0.08) bgs.cream += mexico_pg(mexico_roundPts(x + hw * 0.4, top - 2.4 * S, 6 * S, 7 * S));
        } }
      x += hw + (rnd() < 0.15 ? 4 * S : 0); } }
  add(bg, 'a', bgs.cream, C.cream); add(bg, 'b', bgs.saf, C.saf); add(bg, 'c', bgs.cob, C.cob); add(bg, 'd', bgs.coral, C.coral); add(bg, 'e', bgs.lime, C.lime); add(bg, 'f', bgs.mag, C.mag); add(bg, 'g', bgs.shade, C.bshade); add(bg, 'h', bgs.win, dk && !ANIM ? '#F2C56A' : C.win);
  stk(bg, 's', bl, C.bdark, ph ? 0.6 : 0.9);
  // ---------------------------------------------------------------- the near things (plaza): laurels, bandstand, fountain, pots, lamps, cart
  var N = {green: '', sh: '', jac: '', white: '', cob: '', iron: '', mag: '', saf: ''}, nl = '', ni = '';
  // box-trimmed laurels: a whitewashed trunk and a tight rounded-box crown
  var laurels = ph ? [[0.1, 0.02, 0.8], [0.9, 0.02, 0.8]] : [[0.05, 0.05, 1], [0.27, 0.06, 0.95], [0.95, 0.05, 1.05]];
  laurels.forEach(function (q) { var lx = W * q[0], ly = yb + H * q[1], s = q[2] * S, cw = 46 * s, ch = 52 * s, ct = ly - 66 * s - ch;
    N.sh += mexico_e(lx + 6 * s, ly + 2, 30 * s, 5 * s);
    N.iron += mexico_pg([[lx - 4 * s, ly], [lx - 3 * s, ct + ch], [lx + 3 * s, ct + ch], [lx + 4 * s, ly]]);
    N.white += rect(lx - 4.2 * s, ly - 18 * s, 8.4 * s, 18 * s);
    var crown = mexico_pg([[lx - cw, ct + 14 * s], [lx - cw + 6 * s, ct + 3 * s], [lx - cw + 18 * s, ct], [lx + cw - 18 * s, ct], [lx + cw - 6 * s, ct + 3 * s], [lx + cw, ct + 14 * s], [lx + cw, ct + ch - 12 * s], [lx + cw - 8 * s, ct + ch], [lx - cw + 8 * s, ct + ch], [lx - cw, ct + ch - 12 * s]]);
    N.green += crown;
    for (k = 0; k < 22; k++) { var a = hash(k + lx) * Math.PI * 2, dd = 0.3 + hash(k + 9 + lx) * 0.6; N.sh += mexico_e(lx + Math.cos(a) * cw * dd * 0.9 + cw * 0.18, ct + ch * 0.55 + Math.sin(a) * ch * dd * 0.4, (5 + hash(k + 3) * 5) * s, (3 + hash(k + 5) * 3) * s); }
    N.sh += rect(lx - cw, ct + ch - 14 * s, cw * 2, 14 * s);
    for (k = 0; k < 16; k++) nl += seg(lx - cw + 8 * s + hash(k + lx * 2) * (cw * 2 - 16 * s), ct + 4 * s + hash(k + lx * 3) * ch * 0.4, lx - cw + 12 * s + hash(k + lx * 2) * (cw * 2 - 16 * s), ct + 2 * s + hash(k + lx * 3) * ch * 0.4);
  });
  // the wrought-iron bandstand: a stone platform with a railing, slim columns, a scalloped iron canopy and a finial
  var kb = {x: W * (ph ? 0.2 : 0.17), y: H * (ph ? 0.78 : 0.94), r: (ph ? 70 : 128) * S}, kr = kb.r, ph0 = 34 * S, cH = 112 * S;
  var kTop = kb.y - ph0, kRoof = kTop - cH;
  N.sh += mexico_e(kb.x + 10 * S, kb.y + 2, kr * 1.08, 10 * S);
  // the platform: an octagon front face in cream with a saffron band, and steps
  var oct = [[kb.x - kr, kTop], [kb.x - kr * 0.72, kTop + 10 * S], [kb.x + kr * 0.72, kTop + 10 * S], [kb.x + kr, kTop], [kb.x + kr, kb.y - 8 * S], [kb.x + kr * 0.72, kb.y], [kb.x - kr * 0.72, kb.y], [kb.x - kr, kb.y - 8 * S]];
  N.white += mexico_pg(oct) + mexico_pg([[kb.x - kr, kTop], [kb.x - kr * 0.72, kTop - 8 * S], [kb.x + kr * 0.72, kTop - 8 * S], [kb.x + kr, kTop], [kb.x + kr * 0.72, kTop + 10 * S], [kb.x - kr * 0.72, kTop + 10 * S]]);
  N.saf += mexico_pg([[kb.x - kr, kTop + 4 * S], [kb.x - kr * 0.72, kTop + 14 * S], [kb.x + kr * 0.72, kTop + 14 * S], [kb.x + kr, kTop + 4 * S], [kb.x + kr, kTop + 8 * S], [kb.x + kr * 0.72, kTop + 18 * S], [kb.x - kr * 0.72, kTop + 18 * S], [kb.x - kr, kTop + 8 * S]]);
  N.cob += mexico_pg([[kb.x - kr * 0.62, kTop + 24 * S], [kb.x + kr * 0.62, kTop + 24 * S], [kb.x + kr * 0.62, kb.y - 5 * S], [kb.x - kr * 0.62, kb.y - 5 * S]]);
  for (k = -3; k <= 3; k++) N.white += mexico_c(kb.x + k * kr * 0.18, kTop + 34 * S, 3.4 * S);
  N.sh += rect(kb.x + kr * 0.72, kTop + 10 * S, kr * 0.28, kb.y - kTop - 12 * S);
  N.white += rect(kb.x - 26 * S, kb.y - 2 * S, 52 * S, 4 * S) + rect(kb.x - 32 * S, kb.y + 2 * S, 64 * S, 4 * S);
  // columns (back ones a touch shorter), railing with a looping lace
  var colX = [-1, -0.72, -0.36, 0, 0.36, 0.72, 1];
  colX.forEach(function (u) { var px = kb.x + u * kr * 0.94; N.iron += rect(px - 2.4 * S, kRoof + 6 * S, 4.8 * S, cH - 6 * S) + rect(px - 4 * S, kRoof + 6 * S, 8 * S, 4 * S) + rect(px - 4 * S, kTop - 4 * S, 8 * S, 4 * S);
    ni += 'M' + PT(px - 2.4 * S, kRoof + 22 * S) + ' Q' + PT(px - 12 * S, kRoof + 12 * S) + ' ' + PT(px - 20 * S, kRoof + 10 * S) + ' M' + PT(px + 2.4 * S, kRoof + 22 * S) + ' Q' + PT(px + 12 * S, kRoof + 12 * S) + ' ' + PT(px + 20 * S, kRoof + 10 * S) + ' '; });
  var rTop = kTop - 26 * S; N.iron += rect(kb.x - kr, rTop, kr * 2, 3 * S) + rect(kb.x - kr, kTop - 6 * S, kr * 2, 3 * S);
  for (x = kb.x - kr + 6 * S; x < kb.x + kr - 4 * S; x += 12 * S) ni += mexico_e(x + 6 * S, rTop + 11 * S, 5 * S, 7 * S) + seg(x, rTop + 3 * S, x, kTop - 6 * S);
  // the canopy: an iron bell-shaped roof with a scalloped valance, saffron bands and a lantern finial
  var roof = [[kb.x - kr - 10 * S, kRoof + 8 * S]]; for (k = 0; k <= 20; k++) { var t2 = k / 20, rx2 = (kr + 10 * S) * (1 - t2), yy2 = kRoof + 8 * S - 64 * S * Math.pow(t2, 0.75) - 6 * S * Math.sin(Math.PI * t2); roof.push([kb.x - rx2, yy2]); }
  var roofR = roof.slice(0, -1).reverse().map(function (p) { return [2 * kb.x - p[0], p[1]]; }); var roofAll = roof.concat(roofR);
  N.iron += mexico_pg(roofAll);
  var val = [[kb.x - kr - 10 * S, kRoof + 6 * S]]; for (x = kb.x - kr - 10 * S; x <= kb.x + kr + 10 * S + 0.1; x += 10 * S) { val.push([x + 5 * S, kRoof + 18 * S]); val.push([x + 10 * S, kRoof + 8 * S]); } val.push([kb.x + kr + 10 * S, kRoof + 6 * S]);
  N.saf += mexico_pg(val);
  [0.28, 0.58].forEach(function (u) { var yy3 = kRoof + 8 * S - 64 * S * Math.pow(u, 0.75) - 6 * S * Math.sin(Math.PI * u), rr3 = (kr + 10 * S) * (1 - u); N.saf += mexico_pg([[kb.x - rr3, yy3], [kb.x + rr3, yy3], [kb.x + rr3 * 0.97, yy3 + 3.4 * S], [kb.x - rr3 * 0.97, yy3 + 3.4 * S]]); });
  for (k = -4; k <= 4; k++) nl += 'M' + PT(kb.x + k * kr * 0.25, kRoof + 6 * S) + ' Q' + PT(kb.x + k * kr * 0.12, kRoof - 40 * S) + ' ' + PT(kb.x, kRoof - 64 * S) + ' ';
  var fin = kRoof - 70 * S; N.saf += mexico_c(kb.x, fin, 6 * S) + mexico_pg([[kb.x - 2 * S, fin - 5 * S], [kb.x + 2 * S, fin - 5 * S], [kb.x, fin - 18 * S]]);
  N.white += rect(kb.x - 5 * S, fin + 4 * S, 10 * S, 6 * S);
  // bulbs hang along the valance (the engine lights them at night)
  var bulbs = []; for (x = kb.x - kr - 5 * S; x <= kb.x + kr + 5 * S; x += 20 * S) bulbs.push({x: x, y: kRoof + 21 * S});
  // the talavera fountain: a twelve-sided basin of white tiles with cobalt flowers, a pedestal and a bowl
  var lob = function (rx, ry, yy) { var p = []; for (var q = 0; q < 96; q++) { var t = q / 96 * Math.PI * 2, f = 1 + 0.03 * Math.abs(Math.cos(t * 6)); p.push([fx + Math.cos(t) * rx * f, yy + Math.sin(t) * ry * f]); } return p; };
  var fh = (ph ? 22 : 32) * S, rim = (ph ? 6 : 8) * S;
  N.sh += mexico_e(fx + 8, fy + fh + 4, frx * 1.08, fry * 1.1);
  var face = []; lob(frx, fry, fy).forEach(function (p) { if (p[1] >= fy - 0.5) face.push(p); }); face.sort(function (a, b) { return a[0] - b[0]; });
  N.white += mexico_pg(face.concat(face.slice().reverse().map(function (p) { return [p[0], p[1] + fh]; })));
  // tile flowers along the face (cobalt petals, saffron hearts) and the grout lines
  var nxF = Math.max(4, Math.round(frx * 2 / (fh * 0.95)));
  for (i = 0; i < nxF; i++) { var u0b = -1 + (i + 0.5) * 2 / nxF; if (Math.abs(u0b) > 0.94) continue; var cxF = fx + u0b * frx, cyF = fy + fry * Math.sqrt(Math.max(0, 1 - u0b * u0b)) + fh * 0.5, rF = fh * 0.3, shF = 1 - Math.abs(u0b) * 0.55;
    for (k = 0; k < 4; k++) { var a4 = k * Math.PI / 2 + Math.PI / 4; N.cob += mexico_e(cxF + Math.cos(a4) * rF * 0.5 * shF, cyF + Math.sin(a4) * rF * 0.5, rF * 0.38 * shF, rF * 0.38); }
    N.saf += mexico_e(cxF, cyF, rF * 0.22 * shF + 0.4, rF * 0.22);
    var ex = fx - frx + i * 2 * frx / nxF; if (i) { var uu = (ex - fx) / frx; ni += seg(ex, fy + fry * Math.sqrt(Math.max(0, 1 - uu * uu)), ex, fy + fry * Math.sqrt(Math.max(0, 1 - uu * uu)) + fh); } }
  N.white += mexico_pg(lob(frx + rim, fry + rim * 0.45, fy)) + mexico_hole(lob(frx - rim * 0.5, fry - rim * 0.26, fy));
  N.cob += mexico_pg(lob(frx - rim * 0.5, fry - rim * 0.26, fy));
  N.cob += mexico_pg(face.map(function (p) { return [p[0], p[1] + fh - 3 * S]; }).concat(face.slice().reverse().map(function (p) { return [p[0], p[1] + fh]; })));
  var pedH = (ph ? 50 : 80) * S, bowlY = fy - pedH, brx = (ph ? 26 : 40) * S, bry = brx * 0.24;
  N.white += mexico_pg([[fx - 9 * S, fy], [fx - 6 * S, bowlY + 12 * S], [fx - 13 * S, bowlY + 6 * S], [fx + 13 * S, bowlY + 6 * S], [fx + 6 * S, bowlY + 12 * S], [fx + 9 * S, fy]]);
  N.cob += rect(fx - 7 * S, fy - pedH * 0.55, 14 * S, 5 * S) + rect(fx - 8 * S, fy - pedH * 0.25, 16 * S, 5 * S);
  N.white += mexico_pg([[fx - brx, bowlY], [fx + brx, bowlY], [fx + brx * 0.6, bowlY + bry * 2.8], [fx - brx * 0.6, bowlY + bry * 2.8]]);
  for (k = -2; k <= 2; k++) N.cob += mexico_e(fx + k * brx * 0.32, bowlY + bry * 1.5, 3 * S, 2.6 * S);
  N.white += mexico_pg(mexico_ep(fx, bowlY, brx + 2, bry + 1.4, 40)) + mexico_hole(mexico_ep(fx, bowlY, brx - 3, bry - 1.4, 40));
  N.cob += mexico_e(fx, bowlY, brx - 3, bry - 1.4);
  N.saf += mexico_pg([[fx - 3 * S, bowlY], [fx + 3 * S, bowlY], [fx + 2 * S, bowlY - 10 * S], [fx - 2 * S, bowlY - 10 * S]]) + mexico_c(fx, bowlY - 12 * S, 3.4 * S);
  // potted agave and cacti in talavera pots
  var pots = ph ? [[0.06, 0.985, 0.8, 'agave'], [0.95, 0.985, 0.8, 'cactus']] : [[0.035, 0.995, 1, 'agave'], [0.33, 0.985, 0.85, 'cactus'], [0.875, 0.99, 0.8, 'nopal'], [0.985, 0.99, 1.05, 'agave']];
  pots.forEach(function (q, n) { var px = W * q[0], py = H * q[1], s = q[2] * S, top = py - 40 * s, kind = q[3];
    // the cactus beside the fountain stands clear of its rim (the rim's white slot would otherwise cover its arm)
    if (kind === 'cactus' && px < fx && py > fy) px = Math.min(px, fx - (frx + rim) * 1.03 - 28 * s);
    N.sh += mexico_e(px + 6 * s, py + 2, 34 * s, 6 * s);
    if (kind === 'agave') { for (k = -4; k <= 4; k++) { var ang = -90 + k * 19, L = (70 - Math.abs(k) * 7) * s; N.green += mexico_leaf(px + k * 2 * s, top + 4 * s, L, 7 * s, ang); nl += seg(px + k * 2 * s, top + 4 * s, px + k * 2 * s + Math.cos(ang / 57.3) * L * 0.8, top + 4 * s + Math.sin(ang / 57.3) * L * 0.8); } }
    else if (kind === 'cactus') { N.green += mexico_pg([[px - 9 * s, top + 4], [px - 10 * s, top - 74 * s], [px - 6 * s, top - 82 * s], [px + 6 * s, top - 82 * s], [px + 10 * s, top - 74 * s], [px + 9 * s, top + 4]]);
      N.green += mexico_pg([[px + 9 * s, top - 30 * s], [px + 22 * s, top - 30 * s], [px + 24 * s, top - 58 * s], [px + 30 * s, top - 62 * s], [px + 34 * s, top - 58 * s], [px + 32 * s, top - 22 * s], [px + 9 * s, top - 18 * s]]);
      N.green += mexico_pg([[px - 9 * s, top - 40 * s], [px - 20 * s, top - 40 * s], [px - 22 * s, top - 56 * s], [px - 27 * s, top - 59 * s], [px - 31 * s, top - 55 * s], [px - 29 * s, top - 30 * s], [px - 9 * s, top - 28 * s]]);
      nl += seg(px - 3 * s, top - 76 * s, px - 3 * s, top) + seg(px + 3 * s, top - 76 * s, px + 3 * s, top) + seg(px + 28 * s, top - 56 * s, px + 27 * s, top - 26 * s) + seg(px - 25 * s, top - 53 * s, px - 24 * s, top - 32 * s);
      N.mag += mexico_c(px, top - 86 * s, 5 * s) + mexico_c(px + 30 * s, top - 65 * s, 4 * s); N.saf += mexico_c(px, top - 86 * s, 1.8 * s); }
    else { [[0, -30, 16, 22, 0], [-16, -58, 13, 18, -24], [14, -62, 12, 17, 22], [-2, -86, 11, 15, 6]].forEach(function (pd) { N.green += mexico_pg(rotp(mexico_ep(0, 0, pd[2] * s, pd[3] * s, 24), px + pd[0] * s, top + pd[1] * s, pd[4])); for (var m = 0; m < 5; m++) nl += mexico_c(px + pd[0] * s + (hash(m + pd[1]) - 0.5) * pd[2] * s, top + pd[1] * s + (hash(m + pd[0] + 7) - 0.5) * pd[3] * s * 1.2, 0.8 * s); });
      N.mag += mexico_e(px - 2 * s, top - 102 * s, 4 * s, 5 * s) + mexico_e(px + 10 * s, top - 78 * s, 3.4 * s, 4.4 * s); }
    // the pot itself: white glaze, a cobalt band of petals and a saffron rim
    var pot = mexico_pg([[px - 24 * s, top], [px + 24 * s, top], [px + 28 * s, top + 10 * s], [px + 18 * s, py], [px - 18 * s, py], [px - 28 * s, top + 10 * s]]);
    N.white += pot; N.saf += rect(px - 26 * s, top - 4 * s, 52 * s, 6 * s);
    N.cob += rect(px - 26 * s, top + 8 * s, 52 * s, 3 * s); for (k = -2; k <= 2; k++) { N.cob += mexico_e(px + k * 9 * s, top + 22 * s, 3.4 * s, 4.6 * s); N.saf += mexico_c(px + k * 9 * s, top + 22 * s, 1.3 * s); }
    N.sh += mexico_pg([[px + 10 * s, top + 4 * s], [px + 25 * s, top + 4 * s], [px + 17 * s, py], [px + 8 * s, py]]); });
  // iron lamp posts with lanterns (lit by the engine at night)
  var lamps = (ph ? [0.83] : [0.38, 0.76]).map(function (u) { var lx = W * u, ly = H * (ph ? 0.8 : 0.84), s = S * (ph ? 0.9 : 1), lt = ly - 150 * s;
    N.sh += mexico_e(lx + 4, ly + 2, 14 * s, 3 * s);
    N.iron += mexico_pg([[lx - 7 * s, ly], [lx - 5 * s, ly - 14 * s], [lx - 2.4 * s, ly - 20 * s], [lx - 2 * s, lt + 18 * s], [lx + 2 * s, lt + 18 * s], [lx + 2.4 * s, ly - 20 * s], [lx + 5 * s, ly - 14 * s], [lx + 7 * s, ly]]);
    N.white += mexico_pg([[lx - 8 * s, lt], [lx + 8 * s, lt], [lx + 6 * s, lt + 18 * s], [lx - 6 * s, lt + 18 * s]]);
    N.iron += mexico_pg([[lx - 11 * s, lt], [lx, lt - 12 * s], [lx + 11 * s, lt]]) + rect(lx - 1 * s, lt - 17 * s, 2 * s, 6 * s) + rect(lx - 7 * s, lt + 17 * s, 14 * s, 3 * s) + rect(lx - 0.8 * s, lt, 1.6 * s, 18 * s);
    ni += 'M' + PT(lx, lt + 30 * s) + ' Q' + PT(lx - 10 * s, lt + 34 * s) + ' ' + PT(lx - 12 * s, lt + 26 * s) + ' M' + PT(lx, lt + 30 * s) + ' Q' + PT(lx + 10 * s, lt + 34 * s) + ' ' + PT(lx + 12 * s, lt + 26 * s) + ' ';
    return {x: lx, y: lt + 9 * s, s: s}; });
  // the balloon cart: a magenta pushcart with saffron trim, two iron wheels and a tall pole (the engine ties the balloons on)
  var cart = {x: W * (ph ? 0.8 : 0.665), y: H * (ph ? 0.93 : 0.955), s: S * (ph ? 0.8 : 0.95)}, cs3 = cart.s;
  N.sh += mexico_e(cart.x + 6, cart.y + 2, 46 * cs3, 6 * cs3);
  N.mag += mexico_pg([[cart.x - 36 * cs3, cart.y - 52 * cs3], [cart.x + 36 * cs3, cart.y - 52 * cs3], [cart.x + 32 * cs3, cart.y - 16 * cs3], [cart.x - 32 * cs3, cart.y - 16 * cs3]]);
  N.saf += rect(cart.x - 40 * cs3, cart.y - 56 * cs3, 80 * cs3, 6 * cs3) + rect(cart.x - 33 * cs3, cart.y - 30 * cs3, 66 * cs3, 4 * cs3);
  for (k = -2; k <= 2; k++) N.white += mexico_c(cart.x + k * 13 * cs3, cart.y - 41 * cs3, 3.6 * cs3);
  N.iron += mexico_c(cart.x - 22 * cs3, cart.y - 12 * cs3, 12 * cs3) + mexico_c(cart.x + 22 * cs3, cart.y - 12 * cs3, 12 * cs3) + rect(cart.x + 34 * cs3, cart.y - 60 * cs3, 22 * cs3, 3 * cs3) + rect(cart.x - 2 * cs3, cart.y - 140 * cs3, 4 * cs3, 84 * cs3);
  N.white += mexico_c(cart.x - 22 * cs3, cart.y - 12 * cs3, 4 * cs3) + mexico_c(cart.x + 22 * cs3, cart.y - 12 * cs3, 4 * cs3);
  for (k = 0; k < 8; k++) { var aa = k / 8 * Math.PI * 2; ni += seg(cart.x - 22 * cs3, cart.y - 12 * cs3, cart.x - 22 * cs3 + Math.cos(aa) * 10 * cs3, cart.y - 12 * cs3 + Math.sin(aa) * 10 * cs3) + seg(cart.x + 22 * cs3, cart.y - 12 * cs3, cart.x + 22 * cs3 + Math.cos(aa) * 10 * cs3, cart.y - 12 * cs3 + Math.sin(aa) * 10 * cs3); }
  var tie = [cart.x, cart.y - 138 * cs3];
  // the pergola beam at the top right that the bougainvillea spills from, with its vigas (beam ends)
  var pg = {x0: W * (ph ? 0.72 : 0.8), y: (ph ? 140 : 10) * S};
  N.iron += mexico_pg([[pg.x0, pg.y - 40], [W + 10, pg.y - 40], [W + 10, pg.y + 10 * S], [pg.x0 + 14 * S, pg.y + 10 * S]]);
  for (x = pg.x0 + 30 * S; x < W + 10; x += 34 * S) N.iron += rect(x, pg.y + 8 * S, 12 * S, 10 * S);
  nl += seg(pg.x0 + 10 * S, pg.y + 2 * S, W + 10, pg.y + 2 * S);
  // the hanging bougainvillea: spray positions (drawn by the engine; flat in the still scene)
  var boug = []; for (k = 0; k < (ph ? 7 : 11); k++) { var bx2 = pg.x0 + 10 * S + hash(k + 40) * (W - pg.x0), len = (ph ? 50 : 90) * S * (0.5 + hash(k + 41)); boug.push({x: bx2, y: pg.y + 8 * S, len: len, r: (ph ? 12 : 18) * S * (0.8 + hash(k + 42) * 0.5), k: k}); }
  // the jacaranda leaning in at the top left, and two in the plaza
  var jtl = {x: -20, y: (ph ? 190 : 40) * S, s: S * (ph ? 0.75 : 1)};
  var pj = ph ? [] : [[cx - 205 * S, yb + 14 * S, 0.95], [cx + 232 * S, yb + 16 * S, 1]];
  // papel picado strings: [x0, y0, x1, y1, sag]
  var strings = ph ? [[-10, H * 0.14, W + 10, H * 0.12, H * 0.06]] : [[-10, H * 0.05, W * 0.46, H * 0.03, H * 0.08], [W * 0.66, H * 0.02, W + 10, H * 0.06, H * 0.07], [-10, H * 0.2, W * 0.38, H * 0.25, H * 0.05], [W * 0.78, H * 0.26, W + 10, H * 0.2, H * 0.05]];
  if (!ANIM) {
    // the still scene: everything the engine would draw, laid flat
    pj.forEach(function (q) { var s = q[2] * S, tx = q[0], ty = q[1]; N.iron += mexico_pg([[tx - 5 * s, ty], [tx - 3 * s, ty - 100 * s], [tx + 3 * s, ty - 100 * s], [tx + 5 * s, ty]]); for (k = 0; k < 18; k++) { var a = hash(k + tx) * Math.PI * 2, dd = Math.sqrt(hash(k + 3 + tx)); N.jac += mexico_c(tx + Math.cos(a) * dd * 70 * s, ty - 130 * s + Math.sin(a) * dd * 40 * s, (16 + hash(k) * 10) * s); } });
    for (k = 0; k < 30; k++) { var a5 = hash(k + 300) * 1.6 - 0.3, d5 = 40 + hash(k + 301) * 200; N.jac += mexico_c(jtl.x + Math.cos(a5) * d5 * jtl.s, jtl.y + Math.sin(a5) * d5 * 0.5 * jtl.s, (14 + hash(k + 302) * 12) * jtl.s); }
    N.iron += mexico_pg([[jtl.x, jtl.y - 30 * jtl.s], [jtl.x + 180 * jtl.s, jtl.y + 10 * jtl.s], [jtl.x + 182 * jtl.s, jtl.y + 16 * jtl.s], [jtl.x, jtl.y - 14 * jtl.s]]);
    boug.forEach(function (b) { for (var m = 0; m < 5; m++) { var yy = b.y + b.len * m / 4, xx = b.x + Math.sin(m + b.k) * 8 * S; N.green += mexico_c(xx + 6 * S, yy, b.r * 0.6); N.mag += mexico_c(xx, yy, b.r * (1 - m * 0.12)); } });
    var pcol = ['cob', 'mag', 'saf'];
    strings.forEach(function (st2, sn) { var L = Math.hypot(st2[2] - st2[0], st2[3] - st2[1]), nf = Math.floor(L / ((ph ? 28 : 40) * S)), fw = (ph ? 18 : 26) * S, fhh = fw * 1.25;
      var at = function (u) { return [st2[0] + (st2[2] - st2[0]) * u, st2[1] + (st2[3] - st2[1]) * u + st2[4] * 4 * u * (1 - u)]; }, pl = []; for (k = 0; k <= 20; k++) pl.push(at(k / 20)); nl += pline(pl);
      for (k = 0; k < nf; k++) { var p = at((k + 0.5) / nf), fl = [[p[0] - fw / 2, p[1]], [p[0] + fw / 2, p[1]], [p[0] + fw / 2, p[1] + fhh]]; for (var z = 1; z <= 5; z++) fl.push([p[0] + fw / 2 - z * fw / 5 + (z % 2 ? fw / 10 : 0), p[1] + fhh + (z % 2 ? -3 * S : 0)]);
        N[pcol[(k + sn) % 3]] += mexico_pg(fl) + mexico_hole(mexico_ep(p[0], p[1] + fhh * 0.45, fw * 0.16, fw * 0.16, 8)) + mexico_hole([[p[0] - fw * 0.3, p[1] + fhh * 0.8], [p[0] - fw * 0.22, p[1] + fhh * 0.72], [p[0] - fw * 0.14, p[1] + fhh * 0.8], [p[0] - fw * 0.22, p[1] + fhh * 0.88]]) + mexico_hole([[p[0] + fw * 0.14, p[1] + fhh * 0.8], [p[0] + fw * 0.22, p[1] + fhh * 0.72], [p[0] + fw * 0.3, p[1] + fhh * 0.8], [p[0] + fw * 0.22, p[1] + fhh * 0.88]]); } });
    var bcol = ['mag', 'cob', 'saf', 'white'];
    for (k = 0; k < 7; k++) { var bxx = tie[0] + (hash(k + 80) - 0.5) * 60 * cs3, byy = tie[1] - 40 * cs3 - hash(k + 81) * 50 * cs3; nl += seg(tie[0], tie[1], bxx, byy + 14 * cs3); N[bcol[k % 4]] += mexico_e(bxx, byy, 11 * cs3, 13 * cs3); }
    bells.forEach(function (b) { N.saf += mexico_pg([[b.x - 9 * b.s, b.y + 14 * b.s], [b.x - 6 * b.s, b.y + 2 * b.s], [b.x - 4 * b.s, b.y - 4 * b.s], [b.x + 4 * b.s, b.y - 4 * b.s], [b.x + 6 * b.s, b.y + 2 * b.s], [b.x + 9 * b.s, b.y + 14 * b.s]]); });
  }
  add(near, 'a', N.green, C.green); add(near, 'b', N.sh, C.nshade); add(near, 'c', N.jac, C.njac); add(near, 'd', N.white, C.white); add(near, 'e', N.cob, C.ncob); add(near, 'f', N.iron, C.iron); add(near, 'g', N.mag, C.nmag); add(near, 'h', N.saf, C.nsaf);
  stk(near, 's', nl, C.nlight, ph ? 0.8 : 1.1); stk(near, 't', ni, C.ink, ph ? 0.8 : 1.2);
  if (ANIM) { ANIM.C = C; ANIM.S = S; ANIM.stars = stars.filter(function (s) { return s.y < hillY(s.x) - 8 && s.y < midTop(s.x) - 6; }); ANIM.mtop = mA; ANIM.wins = wins; ANIM.cath = cath; ANIM.cx = cx; ANIM.yb = yb; ANIM.spireTop = y4 - spH - 26 * S;
    ANIM.bells = bells; ANIM.bal = bal; ANIM.kiosk = {x: kb.x, top: kRoof, y: kb.y, r: kr, bulbs: bulbs}; ANIM.lamps = lamps; ANIM.cart = {x: cart.x, y: cart.y, s: cs3, tie: tie};
    ANIM.fount = {x: fx, y: fy, rx: frx - rim * 0.5, ry: fry - rim * 0.26, bowlY: bowlY, brx: brx, bry: bry, spout: bowlY - 12 * S, fh: fh};
    ANIM.boug = boug; ANIM.pg = pg; ANIM.jtl = jtl; ANIM.pj = pj; ANIM.strings = strings; ANIM.dome = dm; }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
