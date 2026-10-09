// ---- batch n4: nightmarket (Night Market), diadelosmuertos (Dia de los Muertos), holi (Holi), ramadan (Ramadan Nights), midautumn (Mid-Autumn Festival)
// Shared helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always
// merge instead of punching holes in each other.
function n4_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function n4_pg(p) { return poly(n4_area(p) < 0 ? p.slice().reverse() : p); }
function n4_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function n4_c(x, y, r) { return n4_e(x, y, r, r); }
function n4_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return n4_pg(rotp(p, x, y, ang)); }
function n4_cat(x0, y0, x1, y1, sag, n) { var p = []; for (var i = 0; i <= n; i++) { var u = i / n; p.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)]); } return p; }
function n4_at(x0, y0, x1, y1, sag, u) { return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)]; }
function n4_yOn(pts, x) { var x0 = pts[0][0], st = pts[1][0] - x0, i = (x - x0) / st, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.max(0, Math.min(1, i - i0)); return pts[i0][1] * (1 - f) + pts[i0 + 1][1] * f; }
function n4_spark(x, y, r) { return n4_pg([[x, y - r], [x + r * 0.22, y - r * 0.22], [x + r, y], [x + r * 0.22, y + r * 0.22], [x, y + r], [x - r * 0.22, y + r * 0.22], [x - r, y], [x - r * 0.22, y - r * 0.22]]); }
function n4_leaf(x, y, len, w, ang) { var pts = [], i; for (i = 0; i <= 10; i++) { var t = i / 10; pts.push([t * len, w * Math.sin(Math.PI * t) * (1 - 0.3 * t)]); } for (i = 9; i > 0; i--) { var u = i / 10; pts.push([u * len, -w * Math.sin(Math.PI * u) * (1 - 0.3 * u)]); } return n4_pg(rotp(pts, x, y, ang)); }
function n4_flame(x, y, h, w) { return 'M' + PT(x, y - h) + ' C' + PT(x + w * 0.5, y - h * 0.55) + ' ' + PT(x + w, y - h * 0.1) + ' ' + PT(x, y) + ' C' + PT(x - w, y - h * 0.1) + ' ' + PT(x - w * 0.5, y - h * 0.55) + ' ' + PT(x, y - h) + ' Z '; }
// a round flower seen from the front: n petals around a centre
function n4_flower(x, y, r, n, rot) { var d = ''; for (var i = 0; i < n; i++) { var a = (rot || 0) + i / n * Math.PI * 2; d += n4_re(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, r * 0.5, r * 0.3, a * 57.3); } return d; }
// a marigold pom: a ring of small bumps around a disc (petal), with a darker centre (dot)
function n4_mari(x, y, r) { var d = n4_c(x, y, r * 0.82); for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2; d += n4_c(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.36); } return d; }
// eight-point star (two squares)
function n4_star8(x, y, r) { var p = []; for (var i = 0; i < 16; i++) { var a = -Math.PI / 2 + i * Math.PI / 8, q = i % 2 ? r * 0.72 : r; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return n4_pg(p); }
function n4_star5(x, y, r, ri) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * (ri || 0.45) : r; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return n4_pg(p); }
// crescent: the disc (x, y, r) minus the disc moved by (dx, dy) with radius r2, as one clockwise outline
function n4_cres(x, y, r, dx, dy, r2) {
  var d = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx), qx = x + dx, qy = y + dy, a = (r * r - r2 * r2 + d * d) / (2 * d), ang = Math.acos(Math.max(-1, Math.min(1, a / r))), p = [], i;
  for (i = 0; i <= 32; i++) { var t = a0 + ang + i / 32 * (Math.PI * 2 - 2 * ang); p.push([x + Math.cos(t) * r, y + Math.sin(t) * r]); }
  var P1 = [x + Math.cos(a0 + ang) * r, y + Math.sin(a0 + ang) * r], P2 = [x + Math.cos(a0 - ang) * r, y + Math.sin(a0 - ang) * r];
  var b1 = Math.atan2(P1[1] - qy, P1[0] - qx), b2 = Math.atan2(P2[1] - qy, P2[0] - qx), want = a0 + Math.PI, dd = b1 - b2;
  while (dd <= 0) dd += Math.PI * 2; var m1 = b2 + dd / 2, alt = dd - Math.PI * 2, m2 = b2 + alt / 2;
  var cl = function (u) { var v = (u - want) % (Math.PI * 2); if (v < -Math.PI) v += Math.PI * 2; if (v > Math.PI) v -= Math.PI * 2; return Math.abs(v); };
  var sp = cl(m1) < cl(m2) ? dd : alt;
  for (i = 1; i < 32; i++) { var u = b2 + i / 32 * sp; p.push([qx + Math.cos(u) * r2, qy + Math.sin(u) * r2]); }
  return n4_pg(p); }
// a scalloped awning stripe from xa to xb, top y0 to y1, with a half-round tongue below
function n4_tongue(xa, xb, y0, y1, dep) { var p = [[xa, y0], [xb, y0], [xb, y1]], cx = (xa + xb) / 2, r = (xb - xa) / 2; for (var i = 1; i < 10; i++) { var a = i / 10 * Math.PI; p.push([cx + Math.cos(a) * r, y1 + Math.sin(a) * dep]); } p.push([xa, y1]); return n4_pg(p); }

// ---------------------------------------------------------------- 1. Night Market
// A street of food stalls under strings of paper lanterns, shophouses with tiled roofs behind, a goldfish scooping pool in
// front and a balloon seller's bunch on the right. The lanterns, steam, fish, balloons and the sky lantern are the engine's.
var n4_NMC = {
  L: {far: '#EBBFB2', far2: '#E2AEA6', farWin: '#F2CDBE', wallA: '#F3D3BE', wallB: '#EDC2AC', roof: '#8C5262', win: '#FFF4E2', shade: 'rgba(120,50,60,0.16)', street: '#D9AEA0', inside: '#A86A58', banner: '#D84A40', joint: 'rgba(150,90,90,0.32)', lat: '#B97A6C',
    wood: '#9C5A42', woodL: '#DDA472', awA: '#E04C42', awB: '#3E5CA4', cream: '#FFF5E6', water: '#74C6EA', rim: '#C6EAF8', nShade: 'rgba(90,30,30,0.18)', ink: '#5E3628', rib: 'rgba(255,248,236,0.85)', moon: '#FFF4E0'},
  D: {far: '#3A2148', far2: '#33193E', farWin: '#FFB966', wallA: '#45264A', wallB: '#3C2142', roof: '#24122C', win: '#FFBE6A', shade: 'rgba(10,0,20,0.32)', street: '#2C1A30', inside: '#8A4A36', banner: '#C23C3A', joint: 'rgba(255,170,120,0.12)', lat: '#9A5A40',
    wood: '#5A2E30', woodL: '#9A5A40', awA: '#C83A3A', awB: '#33438A', cream: '#F6E2C8', water: '#2E5E9C', rim: '#6E9CD0', nShade: 'rgba(20,0,20,0.3)', ink: '#2A1418', rib: 'rgba(255,220,180,0.55)', moon: '#FFEBC4'}
};
var n4_NM_GOODS = ['tako', 'apple', 'taiyaki', 'cotton', 'yaki', 'ice'];
SCENES.nightmarket = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.1), mid = Lay(0), near = Lay(0), C = n4_NMC[dk ? 'D' : 'L'], i, x, k;
  var gy = H * (ph ? 0.765 : 0.75), sb = H * (ph ? 0.865 : 0.865), ct = sb - H * (ph ? 0.085 : 0.1), ab = ct - H * (ph ? 0.09 : 0.11), at = ab - H * (ph ? 0.045 : 0.058);
  var sky = dk ? 'linear-gradient(180deg,#1D1430 0%,#3A1E45 38%,#7A2E4A 70%,#4A1E3A 100%)' : 'linear-gradient(180deg,#F6D1B5 0%,#FBE7D6 40%,#F0C9C0 70%,#E6B7AA 100%)';
  // soft glow over the market, clouds by day, stars and a moon at night
  add(far, 'a', n4_e(W * 0.5, gy - H * 0.16, W * 0.8, H * 0.2), dk ? 'rgba(255,120,90,0.34)' : 'rgba(255,242,228,0.9)');
  var moon = [W * (ph ? 0.2 : 0.16), H * (ph ? 0.2 : 0.2), ph ? 18 : 24];
  if (!dk) spread(0, H * 0.12, W, H * 0.3, ph ? 220 : 340, 120, rnd, 0.8).forEach(function (c) { if (c.q < 0.6) add(far, 'b', n4_e(c.x, c.y, 80 + c.r * 70, 10 + c.k * 6) + n4_e(c.x + 36, c.y - 8, 46, 9), 'rgba(255,248,242,0.85)'); });
  else { var st = ''; spread(0, 0, W, gy - H * 0.3, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.32 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] + 10) st += n4_c(c.x, c.y, 0.5 + c.r * 0.9); }); add(bg, 'h', st, 'rgba(255,236,220,0.75)'); }
  add(far, 'c', n4_c(moon[0], moon[1], moon[2] * 2.4), dk ? 'rgba(255,220,170,0.28)' : 'rgba(255,255,255,0.6)');
  add(bg, 'g', n4_c(moon[0], moon[1], moon[2]), C.moon);
  // distant hills with a pagoda and a few town blocks
  var base = gy - H * (ph ? 0.15 : 0.17), hill = ridge(W, base, [[H * 0.025, 140, 0.4], [H * 0.01, 50, 1.6]], 8), blocks = '', win = '', pag = '';
  add(bg, 'a', below(hill, gy + 4), C.far);
  x = -20; while (x < W + 20) { var w = (ph ? 26 : 40) + rnd() * (ph ? 26 : 50), h = H * (0.03 + rnd() * (ph ? 0.08 : 0.1)); if (rnd() < 0.7) { blocks += rect(x, base - h, w, h + H * 0.2); if (dk || rnd() < 0.5) for (var wy = base - h + 6; wy < base + 20; wy += 9) for (var wx = x + 4; wx < x + w - 4; wx += 8) if (rnd() < 0.3) win += rect(wx, wy, 3, 4); } x += w + rnd() * 30; }
  var px = W * (ph ? 0.78 : 0.7), pb = n4_yOn(hill, px) + 4, pw = ph ? 15 : 22;
  for (k = 0; k < 5; k++) { var tw = pw * (1 - k * 0.13), yb = pb - k * pw * 0.8, hg = pw * 0.5; pag += rect(px - tw * 0.6, yb - hg, tw * 1.2, hg + 1) + n4_pg([[px - tw * 0.5, yb - hg - pw * 0.3], [px + tw * 0.5, yb - hg - pw * 0.3], [px + tw * 1.2, yb - hg - 1], [px + tw * 0.85, yb - hg + 2.5], [px - tw * 0.85, yb - hg + 2.5], [px - tw * 1.2, yb - hg - 1]]); }
  pag += rect(px - 1.2, pb - 5 * pw * 0.8 - pw * 0.7, 2.4, pw * 0.8);
  add(bg, 'b', blocks + pag, C.far2); add(bg, 'c', win, C.farWin);
  // shophouses with tiled roofs, upper windows and hanging shop banners
  var wA = '', wB = '', roofs = '', wins = '', shade = '', lat = '', bnr = '', emb = '', tiles = '', winList = [];
  x = -30 + rnd() * 20; k = 0;
  while (x < W + 30) { var hw = (ph ? 104 : 168) + rnd() * (ph ? 40 : 70), hh = H * ((ph ? 0.14 : 0.17) + rnd() * 0.06), top = gy - hh, rh = ph ? 14 : 20;
    if (k % 2) wB += rect(x, top, hw, hh + 4); else wA += rect(x, top, hw, hh + 4);
    roofs += n4_pg([[x - 14, top - 3], [x - 6, top - rh], [x + hw + 6, top - rh], [x + hw + 14, top - 3], [x + hw + 6, top + 5], [x - 6, top + 5]]) + rect(x - 2, top - rh - 5, hw + 4, 6);
    for (var tx = x; tx < x + hw; tx += ph ? 7 : 9) tiles += seg(tx, top - rh + 1, tx - (tx - x - hw / 2) * 0.06, top + 3);
    shade += rect(x, top + 5, hw, 6) + rect(x + hw - 8, top + 5, 8, hh);
    var nw = Math.max(2, Math.floor(hw / (ph ? 46 : 58))), ws = hw / nw;
    for (var j = 0; j < nw; j++) { var wx2 = x + ws * (j + 0.5), ww = ws * 0.5, wh = hh * 0.26, wy2 = top + hh * 0.2; wins += rrect(wx2 - ww / 2, wy2, ww, wh, 3); lat += seg(wx2, wy2, wx2, wy2 + wh) + seg(wx2 - ww / 2, wy2 + wh / 2, wx2 + ww / 2, wy2 + wh / 2); winList.push([wx2, wy2 + wh / 2, ww]); }
    if (k % 2 === 0) { var bx = x + hw * 0.18, by = top + hh * 0.55; bnr += rect(bx, by, ph ? 12 : 16, ph ? 34 : 46); emb += n4_c(bx + (ph ? 6 : 8), by + (ph ? 10 : 13), ph ? 4 : 5.5); }
    x += hw + (rnd() < 0.4 ? 10 + rnd() * 20 : 0); k++; }
  add(mid, 'a', wA, C.wallA); add(mid, 'b', wB, C.wallB); add(mid, 'c', roofs, C.roof); add(mid, 'd', wins, C.win); add(mid, 'e', shade, C.shade);
  add(mid, 'h', bnr, C.banner); stk(mid, 't', lat + tiles, C.lat, 1.2);
  add(mid, 'g', emb, C.cream);
  // the street: stone paving that widens toward you
  var street = rect(-10, gy, W + 20, H - gy + 10), joints = '';
  for (var ry = gy + 10, rr = 0; ry < H + 10; rr++) { joints += seg(-10, ry, W + 10, ry); var stp = 26 + (ry - gy) * 0.5; for (var jx = (rr % 2) * stp * 0.5 - 10; jx < W + 10; jx += stp) joints += seg(jx, ry, jx + (jx - W / 2) * 0.03, ry + 8 + (ry - gy) * 0.12); ry += 8 + (ry - gy) * 0.12; }
  add(mid, 'f', street, C.street); stk(mid, 's', joints, C.joint, 1);
  // the stalls
  var n = ph ? 3 : 6, span = (W + 40) / n, stalls = [], ins = '', posts = '', woodL = '', awA = '', awB = '', cream = '', nsh = '', sticks = '', ribs = '';
  for (i = 0; i < n; i++) {
    var x0 = -20 + i * span + 4, x1 = x0 + span - 8, cx = (x0 + x1) / 2, good = n4_NM_GOODS[(i + (ph ? 0 : 0)) % n4_NM_GOODS.length], useA = i % 2 === 0, aw = '';
    ins += rect(x0 + 8, ab, x1 - x0 - 16, ct - ab + 4);
    posts += rect(x0 + 1, at - (ph ? 22 : 30), 7, sb - at + (ph ? 22 : 30)) + rect(x1 - 8, at - (ph ? 22 : 30), 7, sb - at + (ph ? 22 : 30)) + n4_c(x0 + 4.5, at - (ph ? 23 : 31), 4.5) + n4_c(x1 - 4.5, at - (ph ? 23 : 31), 4.5);
    // striped awning with round tongues, and a valance with the stall's round sign
    var m = Math.max(5, Math.round((x1 - x0) / (ph ? 18 : 22))), sw = (x1 - x0 + 8) / m, crm = '';
    for (var q = 0; q < m; q++) { var xa = x0 - 4 + q * sw, sh = n4_tongue(xa, xa + sw, at, ab, sw * 0.42); if (q % 2) crm += sh; else aw += sh; }
    aw += rect(x0 - 6, at - (ph ? 9 : 12), x1 - x0 + 12, ph ? 10 : 13);
    crm += rect(x0 - 6, at - 1.5, x1 - x0 + 12, 2.5);
    var er = ph ? 11 : 15; crm += n4_c(cx, at - (ph ? 5 : 6), er);
    nsh += rect(x0 + 8, ab + 4, x1 - x0 - 16, ph ? 8 : 12);
    // a little picture of what the stall sells, in the round sign
    var ey = at - (ph ? 5 : 6), es = er / 15, pic = '';
    if (good === 'tako') pic = n4_c(cx - 6 * es, ey + 2 * es, 4.2 * es) + n4_c(cx + 6 * es, ey + 2 * es, 4.2 * es) + n4_c(cx, ey - 4 * es, 4.2 * es);
    else if (good === 'apple') pic = n4_c(cx, ey + 2 * es, 6.5 * es) + rect(cx - 0.9 * es, ey - 10 * es, 1.8 * es, 7 * es);
    else if (good === 'taiyaki') pic = n4_pg([[cx - 9 * es, ey], [cx - 2 * es, ey - 6 * es], [cx + 5 * es, ey - 4 * es], [cx + 10 * es, ey - 7 * es], [cx + 9 * es, ey], [cx + 10 * es, ey + 7 * es], [cx + 5 * es, ey + 4 * es], [cx - 2 * es, ey + 6 * es]]);
    else if (good === 'cotton') pic = n4_c(cx - 3 * es, ey - 3 * es, 5 * es) + n4_c(cx + 3.5 * es, ey - 2 * es, 5 * es) + n4_c(cx, ey - 7 * es, 4.5 * es) + rect(cx - 0.9 * es, ey + 1 * es, 1.8 * es, 9 * es);
    else if (good === 'yaki') pic = rect(cx - 10 * es, ey - 0.8 * es, 20 * es, 1.6 * es) + n4_c(cx - 5 * es, ey, 3.4 * es) + n4_c(cx + 1 * es, ey, 3.4 * es) + n4_c(cx + 7 * es, ey, 3 * es);
    else pic = n4_pg([[cx - 6 * es, ey - 2 * es], [cx + 6 * es, ey - 2 * es], [cx + 4 * es, ey + 9 * es], [cx - 4 * es, ey + 9 * es]]) + n4_e(cx, ey - 3 * es, 7 * es, 6 * es);
    // counter: top slab, wooden front and a cloth skirt
    woodL += rect(x0 - 3, ct - 7, x1 - x0 + 6, 10);
    posts += rect(x0 + 2, ct + 3, x1 - x0 - 4, sb - ct - 3);
    var skT = ct + (sb - ct) * 0.3, skB = sb - (sb - ct) * 0.12; aw += rect(x0 + 8, skT, x1 - x0 - 16, skB - skT);
    var wave = ''; for (var wv = x0 + 10; wv < x1 - 10; wv += 12) wave += 'M' + PT(wv, skT + (skB - skT) * 0.6) + ' Q' + PT(wv + 3, skT + (skB - skT) * 0.4) + ' ' + PT(wv + 6, skT + (skB - skT) * 0.6) + ' T' + PT(wv + 12, skT + (skB - skT) * 0.6) + ' ';
    ribs += wave; nsh += rect(x0 + 2, ct + 3, x1 - x0 - 4, 5);
    for (var pl = x0 + 14; pl < x1 - 10; pl += ph ? 16 : 20) sticks += seg(pl, ct + 8, pl, skT - 2) + seg(pl, skB + 2, pl, sb - 2);
    if (useA) { awA += aw; awB += pic; } else { awB += aw; awA += pic; }
    cream += crm;
    stalls.push({x0: x0, x1: x1, good: good, ab: ab, ct: ct, at: at, sb: sb});
  }
  add(mid, 'g', ins, C.inside);
  add(near, 'a', posts, C.wood); add(near, 'b', woodL, C.woodL); add(near, 'c', awA, C.awA); add(near, 'd', awB, C.awB); add(near, 'e', cream, C.cream); add(near, 'h', nsh, C.nShade);
  stk(near, 's', sticks, C.ink, 1.2); stk(near, 't', ribs, C.rib, ph ? 1.4 : 1.8);
  // the goldfish pool in front: a round blue tub with a white rim and paper scoops on the edge
  var S = ph ? 1 : Math.max(0.55, Math.min(1.1, H / 820)), pX = W * (ph ? 0.3 : 0.2), pY = H * (ph ? 0.94 : 0.935), pRx = (ph ? 104 : 158) * S, pRy = (ph ? 26 : 36) * S, tub = [];
  for (k = 0; k <= 20; k++) { var a2 = k / 20 * Math.PI; tub.push([pX + Math.cos(a2) * pRx, pY + Math.sin(a2) * pRy]); }
  for (k = 20; k >= 0; k--) { a2 = k / 20 * Math.PI; tub.push([pX + Math.cos(a2) * pRx, pY + Math.sin(a2) * pRy + (ph ? 9 : 12)]); }
  add(near, 'd', n4_pg(tub));
  add(near, 'g', n4_e(pX, pY, pRx, pRy), C.rim);
  add(near, 'f', n4_e(pX, pY + 1.5, pRx - (ph ? 7 : 9), pRy - (ph ? 5 : 7)), C.water);
  var poiS = ph ? 0.75 : 1, poi = n4_c(pX + pRx * 0.78, pY - pRy * 0.55, 9 * poiS) + n4_c(pX - pRx * 0.62, pY + pRy * 0.72, 9 * poiS);
  add(near, 'e', poi);
  stk(near, 's', seg(pX + pRx * 0.78 + 7 * poiS, pY - pRy * 0.55 + 5 * poiS, pX + pRx * 0.78 + 22 * poiS, pY - pRy * 0.55 + 14 * poiS) + seg(pX - pRx * 0.62 - 7 * poiS, pY + pRy * 0.72 + 4 * poiS, pX - pRx * 0.62 - 22 * poiS, pY + pRy * 0.72 + 10 * poiS));
  // lantern strings: two across the sky and one along the stall fronts, from post to post
  var LS = ph ? [[-12, H * 0.02, W + 12, H * 0.035, H * 0.045, 46, ph ? 10 : 15]] : [[-24, H * 0.03, W * 0.62, H * 0.0, H * 0.075, 74, 15], [W * 0.38, -4, W + 24, H * 0.035, H * 0.07, 74, 15]];
  var lan = [], strings = [];
  LS.forEach(function (s, si) { var pts = n4_cat(s[0], s[1], s[2], s[3], s[4], 40); strings.push(pts); var len = Math.hypot(s[2] - s[0], s[3] - s[1]), cnt = Math.floor(len / s[5]);
    for (var j = 0; j < cnt; j++) { var u = (j + 0.5) / cnt, p = n4_at(s[0], s[1], s[2], s[3], s[4], u); if (p[0] < -10 || p[0] > W + 10) continue; lan.push({x: p[0], y: p[1], len: 6 + ((j * 7 + si * 3) % 4) * (ph ? 4 : 6), r: s[6] * (0.85 + ((j + si) % 3) * 0.1), k: (j + si) % 3, top: 1}); } });
  var pt = at - (ph ? 23 : 31);
  stalls.forEach(function (s, si) { var a = [s.x0 + 4.5, pt], b = [s.x1 - 4.5, pt], sg = ph ? 8 : 12; strings.push(n4_cat(a[0], a[1], b[0], b[1], sg, 16)); [0.3, 0.7].forEach(function (u, j) { var p = n4_at(a[0], a[1], b[0], b[1], sg, u); lan.push({x: p[0], y: p[1], len: ph ? 3 : 4, r: ph ? 9 : 12, k: (si + j) % 3, stall: si}); }); });
  var bal = {kx: W * (ph ? 0.9 : 0.968), ky: pt + 2, cx: W * (ph ? 0.84 : 0.94), cy: H * (ph ? 0.26 : 0.17), s: ph ? 0.8 : 1};
  if (ANIM) {
    ANIM.lan = lan; ANIM.strings = strings; ANIM.stalls = stalls; ANIM.pool = {x: pX, y: pY + 1.5, rx: pRx - (ph ? 7 : 9), ry: pRy - (ph ? 5 : 7)}; ANIM.bal = bal; ANIM.wins = winList;
    ANIM.sky = {x: W * (ph ? 0.55 : 0.6), y0: gy - H * 0.06, y1: H * (ph ? 0.12 : 0.08)}; ANIM.C = C; ANIM.gy = gy;
  } else {
    var sl = ''; strings.forEach(function (p) { sl += pline(p); }); stk(near, 't', sl, '', 0);
    var lb = '', lc = '', lcr = ''; lan.forEach(function (l) { var cy = l.y + l.len + l.r; (l.k === 1 ? lcr += n4_e(l.x, cy, l.r * 0.8, l.r) : lb += n4_e(l.x, cy, l.r * 0.8, l.r)); lc += rect(l.x - l.r * 0.4, cy - l.r - 3, l.r * 0.8, 3.5) + rect(l.x - l.r * 0.4, cy + l.r - 1, l.r * 0.8, 3.5); });
    add(near, 'c', lb); add(near, 'e', lcr); add(near, 'a', lc);
    var bl = ''; [[0, 0], [-16, 10], [16, 8], [-6, -16], [10, -14]].forEach(function (o, j) { var bx2 = bal.cx + o[0] * bal.s, by2 = bal.cy + o[1] * bal.s; bl += n4_c(bx2, by2, 11 * bal.s); stk(near, 's', seg(bx2, by2 + 11 * bal.s, bal.kx, bal.ky)); });
    add(near, 'd', bl);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};

// ---------------------------------------------------------------- 2. Dia de los Muertos
// A street of painted houses decorated for the Day of the Dead: papel picado across the top, a marigold arch over a
// tiered ofrenda with candles, bread and sugar skulls, and a path of marigold petals leading to it. A little hill town
// climbs behind. The banners, candles, petals and monarchs are the engine's.
var n4_DMC = {
  L: {hill: '#E9B48E', hill2: '#DFA07E', hA: '#F7D7C8', hB: '#CDEBE4', hC: '#FBE6A8', hWin: '#B8735A', pink: '#F286AE', teal: '#4CC2B6', yel: '#F7C455', trim: '#FFF5E8', door: '#8A4A36', street: '#E2B08E', shade: 'rgba(120,50,40,0.15)', glass: '#7FC7D8', cob: 'rgba(150,80,50,0.3)', bars: '#5A3428',
    cloth: '#FFF6EC', mag: '#C8367E', ora: '#F48A1C', yel2: '#F7C22A', wood: '#B86E36', leaf: '#3E8E52', nsh: 'rgba(90,20,40,0.2)', ink: '#5A2A36', moon: '#FFFFFF'},
  D: {hill: '#3A2050', hill2: '#321A46', hA: '#5A2E5E', hB: '#2E4A62', hC: '#5E4A44', hWin: '#FFC46A', pink: '#8A3A6E', teal: '#2A6074', yel: '#8A6A3E', trim: '#D9C6B8', door: '#3A1E2A', street: '#3A2240', shade: 'rgba(10,0,20,0.3)', glass: '#FFC46A', cob: 'rgba(255,170,120,0.12)', bars: '#1E0E1A',
    cloth: '#F2E2D6', mag: '#A82A6A', ora: '#F08A20', yel2: '#F2B826', wood: '#7A4428', leaf: '#2E6A44', nsh: 'rgba(20,0,20,0.3)', ink: '#2A1020', moon: '#FFF2D6'}
};
SCENES.diadelosmuertos = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1), mid = Lay(0), near = Lay(0), C = n4_DMC[dk ? 'D' : 'L'], i, j, k, x;
  var gy = H * (ph ? 0.8 : 0.775);
  var sky = dk ? 'linear-gradient(180deg,#1E1236 0%,#3A1B4E 42%,#8A3058 74%,#4A1A40 100%)' : 'linear-gradient(180deg,#F8C77A 0%,#FCE3B5 42%,#F5B6A6 74%,#EFA898 100%)';
  add(far, 'a', n4_e(W * 0.55, gy - H * 0.2, W * 0.8, H * 0.22), dk ? 'rgba(255,110,120,0.3)' : 'rgba(255,244,220,0.9)');
  var moon = [W * (ph ? 0.8 : 0.84), H * (ph ? 0.24 : 0.26), ph ? 20 : 30];
  if (!dk) spread(0, H * 0.18, W, H * 0.24, ph ? 220 : 340, 110, rnd, 0.8).forEach(function (c) { if (c.q < 0.55) add(far, 'b', n4_e(c.x, c.y, 80 + c.r * 70, 10 + c.k * 6) + n4_e(c.x - 30, c.y - 7, 44, 9), 'rgba(255,250,236,0.85)'); });
  else { var st = ''; spread(0, 0, W, gy - H * 0.32, 34, 34, rnd, 1).forEach(function (c) { if (c.q < 0.3 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] + 10) st += n4_c(c.x, c.y, 0.5 + c.r * 0.9); }); add(bg, 'h', st, 'rgba(255,236,230,0.75)'); add(far, 'c', n4_c(moon[0], moon[1], moon[2] * 2.6), 'rgba(255,220,200,0.25)'); add(bg, 'g', n4_c(moon[0], moon[1], moon[2]), C.moon); }
  // a hill town of little coloured houses climbing behind the street
  var hl = ridge(W, gy - H * (ph ? 0.2 : 0.24), [[H * 0.05, 210, 1.2], [H * 0.015, 70, 0.3]], 8), hA = '', hB = '', hC = '', hw = '';
  add(bg, 'a', below(hl, gy + 4), C.hill);
  add(bg, 'b', below(ridge(W, gy - H * (ph ? 0.12 : 0.14), [[H * 0.03, 160, 2.2], [H * 0.01, 50, 1]], 8), gy + 4), C.hill2);
  spread(0, gy - H * 0.34, W, H * 0.3, ph ? 22 : 30, ph ? 16 : 20, rnd, 0.9).forEach(function (c) { var top = n4_yOn(hl, c.x); if (c.y < top + 6 || c.q < 0.25) return; var w = (ph ? 10 : 14) + c.r * (ph ? 8 : 12), h = (ph ? 7 : 10) + c.k * 8, s = rect(c.x - w / 2, c.y - h, w, h);
    if (c.q < 0.5) hA += s; else if (c.q < 0.75) hB += s; else hC += s; if (dk ? c.r < 0.6 : c.r < 0.4) hw += rect(c.x - 1.5, c.y - h * 0.65, 3, 3.5); });
  add(bg, 'c', hA, C.hA); add(bg, 'd', hB, C.hB); add(bg, 'e', hC, C.hC); add(bg, 'f', hw, C.hWin);
  // the street of painted houses
  var walls = ['', '', ''], trim = '', door = '', glass = '', shade = '', bars = '', wins = [];
  x = -20 - rnd() * 30; k = 0;
  while (x < W + 20) { var w = (ph ? 110 : 170) + rnd() * (ph ? 40 : 70), h = H * ((ph ? 0.15 : 0.19) + rnd() * 0.07), top = gy - h, ci = k % 3;
    walls[ci] += rect(x, top, w, h + 4);
    trim += rect(x - 3, top - 6, w + 6, 7) + rect(x - 3, top + h * 0.48, w + 6, 4);
    if (k % 2) trim += n4_pg([[x + w * 0.35, top - 6], [x + w * 0.5, top - 16], [x + w * 0.65, top - 6]]);
    shade += rect(x, top + 1, w, 4) + rect(x + w - 6, top, 6, h);
    var nd = Math.max(1, Math.round(w / (ph ? 70 : 90))), sp = w / nd;
    for (j = 0; j < nd; j++) { var dx = x + sp * (j + 0.5), dw = sp * 0.38, dh = h * 0.36, bb;
      if ((j + k) % 2 === 0) { door += rect(dx - dw / 2, gy - dh, dw, dh + 2) + n4_e(dx, gy - dh, dw / 2, dw / 2.2); trim += rect(dx - dw / 2 - 3, gy - dh, 3, dh) + rect(dx + dw / 2, gy - dh, 3, dh); }
      else { glass += rect(dx - dw * 0.4, gy - dh * 0.85, dw * 0.8, dh * 0.5) + n4_e(dx, gy - dh * 0.85, dw * 0.4, dw * 0.36); for (bb = dx - dw * 0.3; bb <= dx + dw * 0.31; bb += dw * 0.2) bars += seg(bb, gy - dh * 1.1, bb, gy - dh * 0.35); trim += rect(dx - dw * 0.55, gy - dh * 0.37, dw * 1.1, 4); wins.push([dx, gy - dh * 0.65, dw]); }
      // upper window with a little balcony
      var uy = top + h * 0.12, uw = dw * 0.8, uh = h * 0.26; glass += rect(dx - uw / 2, uy + uw * 0.3, uw, uh) + n4_e(dx, uy + uw * 0.3, uw / 2, uw * 0.3); wins.push([dx, uy + uh * 0.6, uw]);
      trim += rect(dx - uw * 0.75, uy + uh + uw * 0.3, uw * 1.5, 4); for (bb = dx - uw * 0.7; bb <= dx + uw * 0.71; bb += uw * 0.2) bars += seg(bb, uy + uh + uw * 0.3, bb, uy + uh + uw * 0.3 - 9); bars += seg(dx - uw * 0.72, uy + uh + uw * 0.3 - 9, dx + uw * 0.72, uy + uh + uw * 0.3 - 9); }
    x += w; k++; }
  add(mid, 'a', walls[0], C.pink); add(mid, 'b', walls[1], C.teal); add(mid, 'c', walls[2], C.yel); add(mid, 'd', trim, C.trim); add(mid, 'e', door, C.door); add(mid, 'h', glass, C.glass); add(mid, 'g', shade, C.shade); stk(mid, 't', bars, C.bars, 1.3);
  // cobbled street
  var cob = ''; for (var ry = gy + 6, rr = 0; ry < H + 10; rr++) { var hgt = 6 + (ry - gy) * 0.1, cw = 14 + (ry - gy) * 0.3; for (var cx = (rr % 2) * cw * 0.5 - 10; cx < W + 10; cx += cw) cob += 'M' + PT(cx + 2, ry + hgt * 0.5) + ' Q' + PT(cx + cw / 2, ry - 1) + ' ' + PT(cx + cw - 2, ry + hgt * 0.5) + ' Q' + PT(cx + cw / 2, ry + hgt + 1) + ' ' + PT(cx + 2, ry + hgt * 0.5) + ' '; ry += hgt + 2; }
  add(mid, 'f', rect(-10, gy, W + 20, H - gy + 10), C.street); stk(mid, 's', cob, C.cob, 1);
  // the ofrenda: three cloth-covered tiers under a marigold arch
  var S = ph ? 1 : Math.max(0.55, Math.min(1.1, H / 820)), ox = W * (ph ? 0.5 : 0.19), ob = H * (ph ? 0.955 : 0.94), tw = (ph ? [250, 196, 142] : [330, 258, 186]).map(function (v) { return v * S; }), th = (ph ? 40 : 52) * S, cloth = '', mag = '', ora = '', yel = '', leafs = '', wood = '', nsh = '', folds = '', tiers = [];
  for (i = 0; i < 3; i++) { var tb = ob - i * th, tt = tb - th, tx0 = ox - tw[i] / 2;
    mag += rect(tx0, tt + 8, tw[i], th - 8 + (i ? 0 : 2));
    cloth += rect(tx0 - 4, tt, tw[i] + 8, 10); for (var lc = tx0 - 4; lc < tx0 + tw[i] + 4; lc += 10) cloth += n4_tongue(lc, lc + 10, tt + 9, tt + 10, 5);
    nsh += rect(tx0, tt + 14, tw[i], 4);
    for (var fx2 = tx0 + 16 * S; fx2 < tx0 + tw[i] - 8; fx2 += 22 * S) folds += 'M' + PT(fx2, tt + 16) + ' Q' + PT(fx2 + 3 * S, tt + th * 0.6) + ' ' + PT(fx2 - 1, tb - 2) + ' ';
    tiers.push({x0: tx0, x1: tx0 + tw[i], y: tt}); }
  stk(near, 't', folds, dk ? 'rgba(40,0,30,0.35)' : 'rgba(110,10,60,0.28)', 1.4 * S);
  // cut-paper diamonds along the bottom tier
  for (i = 0; i < 6; i++) { var px = ox - tw[0] / 2 + 18 * S + i * (tw[0] - 36 * S) / 5, dd = 6 * S, dy0 = ob - th + 30 * S; cloth += n4_pg([[px, dy0 - 8 * S], [px + dd, dy0], [px, dy0 + 8 * S], [px - dd, dy0]]); }
  // arch of marigolds
  var acx = ox, acy = ob - th * 3 + (ph ? 4 : 6), arx = tw[0] / 2 + (ph ? 4 : 6) * S, ary = (ph ? 120 : 160) * S, apts = [], st2 = (ph ? 11 : 14) * S;
  for (var yy = ob; yy > acy; yy -= st2) apts.push([acx - arx, yy]);
  var na = Math.round(Math.PI * (arx + ary) / 2 / st2); for (i = 0; i <= na; i++) { var a = Math.PI + i / na * Math.PI; apts.push([acx + Math.cos(a) * arx, acy + Math.sin(a) * ary]); }
  for (yy = acy + st2; yy <= ob; yy += st2) apts.push([acx + arx, yy]);
  var mr = (ph ? 7.5 : 10) * S; apts.forEach(function (p, j) { if (j % 3 === 1) leafs += n4_leaf(p[0], p[1], mr * 1.8, mr * 0.5, (j * 47) % 360); });
  apts.forEach(function (p, j) { if (j % 2) ora += n4_mari(p[0], p[1], mr); else yel += n4_mari(p[0], p[1], mr * 0.9); });
  // marigold bunches in clay pots along the house fronts
  for (x = W * (ph ? 0.08 : 0.42); x < W; x += ph ? 120 : 190) { if (Math.abs(x - ox) < tw[0] * 0.7) continue; var py = gy + 3, ps = ph ? 0.75 : 1; wood += n4_pg([[x - 13 * ps, py - 16 * ps], [x + 13 * ps, py - 16 * ps], [x + 9 * ps, py + 2], [x - 9 * ps, py + 2]]) + rect(x - 15 * ps, py - 19 * ps, 30 * ps, 5 * ps);
    for (j = 0; j < 7; j++) { var fa = -Math.PI / 2 + (j - 3) * 0.42, fr = (16 + (j % 2) * 6) * ps, fx = x + Math.cos(fa) * fr, fy = py - 18 * ps + Math.sin(fa) * fr * 0.9; leafs += n4_leaf(x, py - 18 * ps, fr * 0.9, 3 * ps, fa * 57.3); if (j % 2) ora += n4_mari(fx, fy, 6.5 * ps); else yel += n4_mari(fx, fy, 6 * ps); } }
  // the petal path that leads to the ofrenda
  var p0 = ph ? [W * 0.86, H + 20] : [W * 0.64, H + 24], p1 = ph ? [W * 0.62, H * 0.97] : [W * 0.46, H * 0.9], p2 = [ox + (ph ? 0 : tw[0] * 0.36), ob + (ph ? 6 : 10)], path = [];
  for (i = 0; i <= 40; i++) { var u = i / 40; path.push([(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]]); }
  path.forEach(function (p, j) { var wd = (ph ? 18 : 30) * S * (1 - j / 40 * 0.5); for (var q = 0; q < 8; q++) { var ox2 = (rnd() - 0.5) * wd * 2, oy2 = (rnd() - 0.5) * wd * 0.55, s = (ph ? 2.6 : 3.6) * S * (1 - j / 80), pp = n4_re(p[0] + ox2, p[1] + oy2, s * 1.3, s * 0.7, rnd() * 180); if (q % 2) ora += pp; else yel += pp; } });
  add(near, 'a', cloth, C.cloth); add(near, 'b', mag, C.mag); add(near, 'c', ora, C.ora); add(near, 'd', yel, C.yel2); add(near, 'e', wood, C.wood); add(near, 'f', leafs, C.leaf); add(near, 'h', nsh, C.nsh);
  // candles on the tiers and in jars on the street (the engine paints the flames and the treats)
  var candles = [], treats;
  tiers.forEach(function (T, ti) { var w = T.x1 - T.x0, n = ti === 2 ? 2 : ti === 1 ? 2 : 4; for (var q = 0; q < n; q++) { var cx2 = n === 2 ? T.x0 + w * (q ? 0.92 : 0.08) : T.x0 + w * (0.06 + q / (n - 1) * 0.88), ch = (ph ? 14 : 20) * S * (0.8 + ((q + ti) % 3) * 0.2); candles.push({x: cx2, y: T.y - ch, b: T.y, w: (ph ? 4 : 5.5) * S, h: ch}); } });
  (ph ? [[0.12, 0.975], [0.86, 0.975]] : [[0.035, 0.975], [0.345, 0.985], [0.39, 0.955]]).forEach(function (q) { var cx2 = W * q[0], cb2 = H * q[1]; candles.push({x: cx2, y: cb2 - (ph ? 16 : 22), b: cb2, w: ph ? 5.5 : 7, h: ph ? 16 : 22, jar: 1}); });
  treats = tiers.map(function (T, ti) { return {x0: T.x0, x1: T.x1, y: T.y, ti: ti}; });
  var cl = ''; candles.forEach(function (c) { cl += rect(c.x - c.w / 2, c.y, c.w, c.h + 1); });
  add(near, 'g', cl, dk ? '#F6E6CC' : '#FFF4DE');
  var pic = ph ? [[-12, H * 0.012, W + 12, H * 0.02, H * 0.03], [-12, H * 0.1, W + 12, H * 0.085, H * 0.03]] : [[-24, H * 0.0, W + 24, H * 0.015, H * 0.05], [-24, H * 0.13, W + 24, H * 0.105, H * 0.05]];
  if (ANIM) { ANIM.candles = candles; ANIM.treats = treats; ANIM.path = path; ANIM.ofr = {x: ox, y: ob - th * 3, b: ob, ary: ary}; ANIM.wins = wins; ANIM.C = C; ANIM.picado = pic; }
  else {
    var sk = ''; treats.forEach(function (T) { sk += n4_c((T.x0 + T.x1) / 2, T.y - 9, 8); }); add(near, 'a', sk);
    var pa = '', pb = '', strs = ''; pic.forEach(function (s) { strs += pline(n4_cat(s[0], s[1], s[2], s[3], s[4], 30)); var n = Math.floor((s[2] - s[0]) / (ph ? 30 : 40)); for (var q = 0; q < n; q++) { var p = n4_at(s[0], s[1], s[2], s[3], s[4], (q + 0.5) / n), fw = ph ? 22 : 30, f = rect(p[0] - fw / 2, p[1], fw, fw * 1.2); if (q % 2) pa += f; else pb += f; } });
    add(near, 'b', pa); add(near, 'c', pb); stk(near, 's', strs, C.ink, 1);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};

// ---------------------------------------------------------------- 3. Holi
// A haveli courtyard mid-celebration: scalloped arches, jharokha balconies and little domed pavilions on the roof,
// flame-of-the-forest trees in bloom, splashes of colour on the stone floor and brass plates heaped with gulal.
// The drifting powder clouds, petals and the marigold garlands across the top are the engine's.
var n4_HOC = {
  L: {city: '#F4D2D8', city2: '#EBC0CC', wall: '#F7C59E', trim: '#FFF2DE', arch: '#C8735E', accent: '#F59A1E', floor: '#F3E0C8', shade: 'rgba(150,70,60,0.16)', leaf: '#5FA860', bloom: '#FF6A3A', joint: 'rgba(170,110,80,0.28)', lat: '#B8664E',
    brass: '#E8B040', brassD: '#B8781E', pink: 'rgba(242,71,154,0.9)', yel: 'rgba(255,196,40,0.92)', grn: 'rgba(40,184,110,0.9)', blu: 'rgba(58,138,232,0.9)', pur: 'rgba(154,90,224,0.9)', nsh: 'rgba(120,60,40,0.2)', ink: '#6A3A2A'},
  D: {city: '#4A2462', city2: '#3E1E56', wall: '#6A3468', trim: '#D8B0C8', arch: '#2A1232', accent: '#F09A2A', floor: '#3E2050', shade: 'rgba(10,0,20,0.3)', leaf: '#2E5A44', bloom: '#E8582E', joint: 'rgba(255,170,200,0.12)', lat: '#2A1232',
    brass: '#D29A36', brassD: '#8A5A1E', pink: 'rgba(240,80,160,0.9)', yel: 'rgba(250,190,50,0.9)', grn: 'rgba(50,190,120,0.9)', blu: 'rgba(80,150,240,0.9)', pur: 'rgba(170,110,240,0.9)', nsh: 'rgba(10,0,20,0.32)', ink: '#2A1020'}
};
// a scalloped (multifoil) arch opening: x centre, y base, w width, h height to the crown
function n4_mfArch(x, y, w, h) { var r = w / 2, spring = y - h + r, p = [[x - r, y], [x - r, spring]]; for (var i = 1; i < 36; i++) { var a = Math.PI + i / 36 * Math.PI, lobe = 1 - 0.1 * Math.abs(Math.sin(i / 36 * Math.PI * 5)); p.push([x + Math.cos(a) * r * lobe, spring + Math.sin(a) * r * 1.05 * lobe]); } p.push([x + r, spring], [x + r, y]); return n4_pg(p); }
// a small domed pavilion (chhatri): four posts, a slab and an onion dome with a finial
function n4_chhatri(x, y, s) { var d = rect(x - 16 * s, y - 3 * s, 32 * s, 3 * s) + rect(x - 14 * s, y - 20 * s, 3 * s, 17 * s) + rect(x + 11 * s, y - 20 * s, 3 * s, 17 * s) + rect(x - 4 * s, y - 20 * s, 3 * s, 17 * s) + rect(x + 1 * s, y - 20 * s, 3 * s, 17 * s) + rect(x - 18 * s, y - 24 * s, 36 * s, 4 * s);
  var p = []; for (var i = 0; i <= 20; i++) { var u = i / 20, a = Math.PI * u; p.push([x - Math.cos(a) * 14 * s * (1 - 0.15 * Math.pow(u * 2 - 1, 2)), y - 24 * s - Math.sin(a) * 15 * s - Math.pow(Math.sin(a), 6) * 6 * s]); } return d + n4_pg(p) + rect(x - 0.8 * s, y - 50 * s, 1.6 * s, 8 * s) + n4_c(x, y - 44 * s, 2 * s); }
SCENES.holi = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(16), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = n4_HOC[dk ? 'D' : 'L'], i, j, x;
  var gy = H * (ph ? 0.78 : 0.74), ft = gy - H * (ph ? 0.28 : 0.33), gf = (gy - ft) * 0.5;
  var sky = dk ? 'linear-gradient(180deg,#2A1840 0%,#4A2160 40%,#8A2E6A 74%,#5A2058 100%)' : 'linear-gradient(180deg,#FFD6E8 0%,#FFF1C9 42%,#CFF1E6 76%,#F8E2CE 100%)';
  // soft clouds of colour hanging in the air
  var hz = dk ? ['rgba(240,80,170,0.32)', 'rgba(250,200,60,0.24)', 'rgba(60,200,140,0.24)', 'rgba(90,150,250,0.28)'] : ['rgba(255,120,190,0.42)', 'rgba(255,214,80,0.45)', 'rgba(90,220,160,0.38)', 'rgba(110,170,255,0.38)'];
  spread(0, H * 0.04, W, ft - H * 0.02, ph ? 160 : 240, ph ? 130 : 150, rnd, 0.9).forEach(function (c, n) { var k = n % 4; add(far, 'abcd'[k], n4_e(c.x, c.y, (ph ? 60 : 90) + c.r * 60, (ph ? 36 : 50) + c.k * 30), hz[k]); });
  if (dk) { var st = ''; spread(0, 0, W, ft, 40, 40, rnd, 1).forEach(function (c) { if (c.q < 0.25) st += n4_c(c.x, c.y, 0.5 + c.r * 0.8); }); add(bg, 'h', st, 'rgba(255,236,240,0.7)'); }
  // distant rooftops with little domes
  var city = '', city2 = ''; x = -20; while (x < W + 20) { var w = (ph ? 30 : 46) + rnd() * 50, h = H * (0.03 + rnd() * 0.07); city += rect(x, ft + H * 0.04 - h, w, h + H * 0.2); if (rnd() < 0.4) city2 += n4_chhatri(x + w / 2, ft + H * 0.04 - h, (ph ? 0.4 : 0.55)); x += w + rnd() * 10; }
  add(bg, 'a', city, C.city); add(bg, 'b', city2, C.city2);
  // the haveli
  var wall = rect(-10, ft, W + 20, gy - ft + 4), trim = '', arch = '', acc = '', shade = '', lat = '', wins = [], arches = [];
  var n = ph ? 3 : 7, bay = (W + 20) / n;
  trim += rect(-10, ft - 8, W + 20, 9) + rect(-10, ft + gf - 6, W + 20, 8);
  for (x = -10; x < W + 10; x += ph ? 14 : 18) trim += rect(x, ft - 16, ph ? 8 : 10, 9);
  shade += rect(-10, ft + 1, W + 20, 6) + rect(-10, ft + gf + 2, W + 20, 6);
  for (i = 0; i < n; i++) { var cx = -10 + bay * (i + 0.5), aw = bay * 0.62, ah = gf * 0.84;
    arch += n4_mfArch(cx, gy, aw, ah); trim += rect(cx - aw / 2 - 5, gy - ah * 0.55, 5, ah * 0.55) + rect(cx + aw / 2, gy - ah * 0.55, 5, ah * 0.55);
    arches.push({x: cx, y: gy - ah, w: aw});
    // jharokha above every other arch, small lattice windows between
    var uy = ft + 10, uh = gf - 22;
    if (i % 2 === 0) { var jw = bay * 0.42; acc += rect(cx - jw / 2 - 4, uy + uh * 0.9, jw + 8, 6) + n4_pg([[cx - jw / 2 - 2, uy + uh * 0.9 + 6], [cx + jw / 2 + 2, uy + uh * 0.9 + 6], [cx + jw * 0.3, uy + uh * 0.9 + 16], [cx - jw * 0.3, uy + uh * 0.9 + 16]]);
      trim += rect(cx - jw / 2, uy + uh * 0.32, jw, uh * 0.58); arch += rect(cx - jw / 2 + 5, uy + uh * 0.38, jw - 10, uh * 0.48);
      for (j = 1; j < 4; j++) lat += seg(cx - jw / 2 + 5 + j * (jw - 10) / 4, uy + uh * 0.38, cx - jw / 2 + 5 + j * (jw - 10) / 4, uy + uh * 0.86); lat += seg(cx - jw / 2 + 5, uy + uh * 0.62, cx + jw / 2 - 5, uy + uh * 0.62);
      var dp = []; for (j = 0; j <= 16; j++) { var a = Math.PI * j / 16; dp.push([cx - Math.cos(a) * (jw / 2 + 4), uy + uh * 0.32 - Math.sin(a) * uh * 0.3 - Math.pow(Math.sin(a), 8) * 6]); } acc += n4_pg(dp) + rect(cx - jw / 2 - 6, uy + uh * 0.3, jw + 12, 4);
      wins.push([cx, uy + uh * 0.62, jw]); }
    else { var ww = bay * 0.2; arch += n4_mfArch(cx, uy + uh * 0.86, ww, uh * 0.55); wins.push([cx, uy + uh * 0.66, ww]); } }
  // the central rooftop pavilion and two small ones
  var cs = ph ? 0.9 : 1.5; acc += n4_chhatri(W * 0.5, ft - 16, cs); [0.2, 0.8].forEach(function (q) { if (!ph) acc += n4_chhatri(W * q, ft - 16, 0.9); });
  // flame-of-the-forest trees at the sides
  var leaf = '', bloom = '', trunk = '';
  (ph ? [[-W * 0.02, 1.0, 1], [W * 1.02, 0.95, -1]] : [[W * 0.02, 1.25, 1], [W * 0.985, 1.2, -1]]).forEach(function (T) { var tx = T[0], s = T[1] * (ph ? 0.8 : 1), d = T[2], base = gy + 6, top = H * (ph ? 0.08 : 0.06);
    var sp2 = base - top; trunk += n4_pg([[tx - 13 * s, base], [tx - 8 * s, base - sp2 * 0.45], [tx - d * 30 * s, base - sp2 * 0.78], [tx - d * 22 * s, base - sp2 * 0.8], [tx + 2 * s, base - sp2 * 0.55], [tx + d * 50 * s, base - sp2 * 0.82], [tx + d * 58 * s, base - sp2 * 0.8], [tx + 8 * s, base - sp2 * 0.42], [tx + 14 * s, base]]);
    for (var q = 0; q < 26; q++) { var u = hash(q + tx), vv = hash(q * 3 + tx), bx = tx + d * (u * 150 - 40) * s, by = top + 30 * s + vv * (base - top) * 0.55, r = (24 + hash(q + 9) * 20) * s; leaf += n4_c(bx, by, r);
      for (var b = 0; b < 3; b++) { var a2 = hash(q * 7 + b) * 6.28, rr = r * (0.5 + hash(q + b * 5) * 0.5); bloom += n4_leaf(bx + Math.cos(a2) * rr, by + Math.sin(a2) * rr * 0.7 - r * 0.3, 9 * s, 3.4 * s, -60 - hash(q + b) * 60); } } });
  // the stone floor with splashes of colour
  var floor = rect(-10, gy, W + 20, H - gy + 10), joint = '';
  for (var ry = gy + 8, rr = 0; ry < H + 10; rr++) { joint += seg(-10, ry, W + 10, ry); var stp = 40 + (ry - gy) * 0.7; for (var jx = (rr % 2) * stp * 0.5 - W * 0.2; jx < W * 1.2; jx += stp) joint += seg(jx, ry, jx + (jx - W / 2) * 0.05, ry + 10 + (ry - gy) * 0.16); ry += 10 + (ry - gy) * 0.16; }
  add(mid, 'a', wall, C.wall); add(mid, 'b', trim, C.trim); add(mid, 'c', arch, C.arch); add(mid, 'd', acc, C.accent); add(mid, 'e', floor, C.floor); add(mid, 'f', shade, C.shade); stk(mid, 's', joint, C.joint, 1); stk(mid, 't', lat, C.lat, 1.4);
  add(mid, 'g', trunk, dk ? '#3A1E2E' : '#8A5A40');
  add(near, 'g', leaf, C.leaf); add(near, 'h', bloom, C.bloom);
  var COLS = ['c', 'd', 'e', 'f'], pals = [C.pink, C.yel, C.grn, C.blu], spl = ['', '', '', ''];
  spread(0, gy + 10, W, H - gy - 14, ph ? 110 : 170, ph ? 60 : 70, rnd, 1).forEach(function (c, m) { if (c.q < 0.45) return; var k = m % 4, s = (ph ? 14 : 20) * (0.7 + c.r * 0.7), sq = 0.35 + (c.y - gy) / (H - gy) * 0.15; spl[k] += n4_e(c.x, c.y, s, s * sq);
    for (var q = 0; q < 5; q++) { var a = hash(m * 5 + q) * 6.28, d2 = s * (1.1 + hash(m + q) * 0.6); spl[k] += n4_e(c.x + Math.cos(a) * d2, c.y + Math.sin(a) * d2 * sq, s * 0.2, s * 0.2 * sq); } });
  // brass plates heaped with gulal, a water pot with a pichkari
  var brass = '', brassD = '', ink = '', plates = ph ? [[0.14, 0.93, 0.8], [0.36, 0.965, 0.8]] : [[0.07, 0.915, 1], [0.17, 0.96, 1.05], [0.28, 0.925, 0.95]];
  plates.forEach(function (q, m) { var px = W * q[0], py = H * q[1], s = q[2] * (ph ? 0.85 : 1), cols = m % 2 ? [0, 3] : [1, 4], k2 = m === 2 ? [2, 0] : cols;
    brassD += n4_e(px, py + 3 * s, 46 * s, 12 * s); brass += n4_e(px, py, 46 * s, 12 * s);
    [[-18, k2[0] % 4], [18, k2[1] % 4], [0, (m + 2) % 4]].forEach(function (h, hi) { var hx = px + h[0] * s, hy = py - (hi === 2 ? 4 : 0) * s, mw = (hi === 2 ? 15 : 17) * s, mh = (hi === 2 ? 15 : 13) * s, mp = [];
      for (var t2 = 0; t2 <= 14; t2++) { var a = Math.PI * t2 / 14; mp.push([hx - Math.cos(a) * mw, hy + 3 * s - Math.pow(Math.sin(a), 0.8) * mh]); } spl[h[1]] += n4_pg(mp); }); });
  var ux = W * (ph ? 0.6 : 0.39), uy2 = H * (ph ? 0.95 : 0.93), us = ph ? 0.8 : 1;
  brass += n4_e(ux, uy2 - 22 * us, 26 * us, 24 * us) + rect(ux - 11 * us, uy2 - 52 * us, 22 * us, 10 * us) + n4_e(ux, uy2 - 52 * us, 15 * us, 4 * us);
  brassD += n4_e(ux, uy2 - 2 * us, 16 * us, 4 * us) + rect(ux - 26 * us, uy2 - 24 * us, 52 * us, 3 * us);
  spl[3] += n4_e(ux, uy2 - 52 * us, 11 * us, 2.6 * us);
  ink += seg(ux + 4 * us, uy2 - 54 * us, ux + 30 * us, uy2 - 78 * us);
  // the pichkari: a little brass syringe resting in the pot
  brassD += n4_pg([[ux + 6 * us, uy2 - 56 * us], [ux + 10 * us, uy2 - 60 * us], [ux + 36 * us, uy2 - 86 * us], [ux + 32 * us, uy2 - 82 * us]]);
  add(near, 'a', brassD, C.brassD); add(near, 'b', brass, C.brass); COLS.forEach(function (k, m) { add(near, k, spl[m], pals[m]); }); stk(near, 's', ink, C.ink, 1.4);
  // highlights on the brass
  var hi = ''; plates.forEach(function (q) { var px = W * q[0], py = H * q[1], s = q[2] * (ph ? 0.85 : 1); hi += 'M' + PT(px - 40 * s, py + 2 * s) + ' Q' + PT(px, py + 12 * s) + ' ' + PT(px + 40 * s, py + 2 * s) + ' '; }); hi += 'M' + PT(ux - 16 * us, uy2 - 34 * us) + ' Q' + PT(ux - 20 * us, uy2 - 22 * us) + ' ' + PT(ux - 14 * us, uy2 - 10 * us) + ' ';
  stk(near, 't', hi, dk ? 'rgba(255,230,170,0.5)' : 'rgba(255,248,220,0.85)', ph ? 1.6 : 2.2);
  var gar = ph ? {y: -4, step: W / 3, sag: H * 0.05} : {y: -6, step: W / 6, sag: H * 0.07};
  if (ANIM) { ANIM.gar = gar; ANIM.arches = arches; ANIM.wins = wins; ANIM.ft = ft; ANIM.gy = gy; ANIM.C = C; }
  else { var gm = ''; for (x = -gar.step * 0.5; x < W + gar.step; x += gar.step) n4_cat(x, gar.y, x + gar.step, gar.y, gar.sag, 22).forEach(function (p) { gm += n4_c(p[0], p[1], ph ? 5 : 7); }); add(mid, 'd', gm); }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};

// ---------------------------------------------------------------- 4. Ramadan Nights
// Rooftops of an old city under a crescent moon: domes and slender towers beyond, a terrace in front with a patterned
// parapet, a rug, cushions and a brass tray of dates and tea. Fanous lanterns and strings of little star lights hang
// across the top (the engine's, with the moon, the twinkling and the patterned light).
var n4_RMC = {
  L: {far: '#EBCDA8', far2: '#E2BE96', bA: '#E4B886', bB: '#D9A877', dome: '#3E9C9A', win: '#9A6A44', tower: '#EAC89A', shade: 'rgba(120,70,30,0.16)', door: '#8A5A36', gold: '#D9A43A', bars: 'rgba(120,70,30,0.35)',
    par: '#EAC690', parIn: '#C99A5E', floor: '#F2DCB6', rug: '#B8364A', rugG: '#E8B44A', cushA: '#2E8C8A', cushB: '#E87A3A', nsh: 'rgba(110,60,30,0.18)', joint: 'rgba(160,110,60,0.3)', line: '#F6D488', moon: '#FFF8E6'},
  D: {far: '#262D62', far2: '#22285A', bA: '#1E2452', bB: '#1A1F4A', dome: '#2C3C74', win: '#FFC86A', tower: '#232A5A', shade: 'rgba(5,5,25,0.35)', door: '#12153A', gold: '#E2B04A', bars: 'rgba(255,210,140,0.18)',
    par: '#2C2E62', parIn: '#3E4280', floor: '#262856', rug: '#8E2A44', rugG: '#D9A43A', cushA: '#1E5C6A', cushB: '#B85A2E', nsh: 'rgba(5,5,25,0.35)', joint: 'rgba(160,170,255,0.12)', line: '#E2B04A', moon: '#FFF2C6'}
};
function n4_dome(x, y, r, h) { var p = []; for (var i = 0; i <= 24; i++) { var u = i / 24, a = Math.PI * u, bulge = 1 + 0.12 * Math.sin(a); p.push([x - Math.cos(a) * r * bulge, y - Math.sin(a) * h - Math.pow(Math.sin(a), 10) * h * 0.25]); } return n4_pg(p); }
function n4_tower(x, y, w, h) { var d = rect(x - w / 2, y - h, w, h + 4) + rect(x - w * 0.8, y - h * 0.62, w * 1.6, w * 0.35) + rect(x - w * 0.7, y - h * 0.62 - w * 0.12, w * 1.4, w * 0.12) + rect(x - w * 0.42, y - h - w * 1.2, w * 0.84, w * 1.2); return d + n4_pg([[x - w * 0.5, y - h - w * 1.2], [x, y - h - w * 2.6], [x + w * 0.5, y - h - w * 1.2]]); }
SCENES.ramadan = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = n4_RMC[dk ? 'D' : 'L'], i, j, x;
  var pt = H * (ph ? 0.81 : 0.8), fl = pt + H * (ph ? 0.05 : 0.06);
  var sky = dk ? 'linear-gradient(180deg,#0F1638 0%,#1E2558 42%,#3E3A78 76%,#2A2A5E 100%)' : 'linear-gradient(180deg,#F3D9B0 0%,#F8EBD3 42%,#E9C9A0 76%,#E2BC8E 100%)';
  var moon = [W * (ph ? 0.78 : 0.87), H * (ph ? 0.21 : 0.115), ph ? 26 : 34];
  add(far, 'a', n4_e(W * 0.5, pt - H * 0.18, W * 0.85, H * 0.2), dk ? 'rgba(120,110,220,0.3)' : 'rgba(255,236,200,0.85)');
  add(far, 'b', n4_c(moon[0], moon[1], moon[2] * 2.8), dk ? 'rgba(255,240,190,0.22)' : 'rgba(255,255,245,0.55)');
  if (!dk) spread(0, H * 0.14, W, H * 0.26, ph ? 220 : 340, 110, rnd, 0.8).forEach(function (c) { if (c.q < 0.5) add(far, 'c', n4_e(c.x, c.y, 80 + c.r * 70, 9 + c.k * 6) + n4_e(c.x + 30, c.y - 7, 40, 8), 'rgba(255,250,238,0.85)'); });
  var stars = []; spread(0, 0, W, pt - H * 0.3, ph ? 30 : 36, ph ? 30 : 36, rnd, 1).forEach(function (c) { if (Math.hypot(c.x - moon[0], c.y - moon[1]) < moon[2] * 1.8) return; if (c.q < (dk ? 0.42 : 0.1)) stars.push({x: c.x, y: c.y, r: 0.6 + c.r * 1.1, k: c.k}); });
  // the far city: domes and towers in the haze
  var fb = pt - H * (ph ? 0.1 : 0.12), farD = '', farD2 = '';
  x = -20; while (x < W + 20) { var w = (ph ? 30 : 50) + rnd() * (ph ? 30 : 60), h = H * (0.03 + rnd() * 0.06); farD += rect(x, fb - h, w, h + H * 0.3); if (rnd() < 0.28) farD2 += n4_dome(x + w / 2, fb - h, w * 0.32, w * 0.4); else if (rnd() < 0.15) farD2 += n4_tower(x + w / 2, fb - h, ph ? 5 : 7, H * (0.06 + rnd() * 0.05)); x += w; }
  add(bg, 'a', farD, C.far); add(bg, 'b', farD2, C.far2);
  // the near city: houses with arched windows, a great dome and two towers
  var cb2 = pt + 4, bA = '', bB = '', dome = '', win = '', tower = '', shade = '', door = '', gold = '', wins = [], roofs = [];
  x = -30 + rnd() * 20; var bi = 0;
  while (x < W + 30) { w = (ph ? 60 : 90) + rnd() * (ph ? 50 : 80); h = H * ((ph ? 0.06 : 0.07) + rnd() * (ph ? 0.08 : 0.1)); var top = cb2 - h, body = rect(x, top, w, h + 6) + rect(x - 3, top - 4, w + 6, 5);
    for (var cr = x; cr < x + w - 4; cr += 9) body += rect(cr, top - 9, 5, 6);
    if (bi % 2) bB += body; else bA += body;
    shade += rect(x + w - 7, top, 7, h) + rect(x, top, w, 4);
    var nw = Math.max(1, Math.floor(w / (ph ? 24 : 30))); for (var r = 0; r < 2; r++) for (j = 0; j < nw; j++) { var wx = x + (j + 0.5) * w / nw, wy = top + 12 + r * (ph ? 20 : 26); if (wy > cb2 - 10) continue; win += rect(wx - 3.5, wy, 7, 9) + n4_e(wx, wy, 3.5, 3.5); wins.push({x: wx, y: wy + 3, b: bi}); }
    roofs.push({x: x + w * (0.2 + rnd() * 0.6), y: top - 9, b: bi});
    bi++; x += w + (rnd() < 0.3 ? 8 + rnd() * 10 : 0); }
  var gdx = W * (ph ? 0.36 : 0.46), gdy = cb2 - H * (ph ? 0.15 : 0.19), gdr = ph ? 40 : 66;
  bA += rect(gdx - gdr * 1.15, gdy, gdr * 2.3, cb2 - gdy + 6) + rect(gdx - gdr * 0.95, gdy - gdr * 0.25, gdr * 1.9, gdr * 0.28);
  dome += n4_dome(gdx, gdy - gdr * 0.24, gdr * 0.88, gdr * 0.95) + n4_dome(gdx - gdr * 1.6, gdy + gdr * 0.5, gdr * 0.4, gdr * 0.42) + n4_dome(gdx + gdr * 1.6, gdy + gdr * 0.5, gdr * 0.4, gdr * 0.42);
  bB += rect(gdx - gdr * 2.05, gdy + gdr * 0.5, gdr * 0.9, cb2 - gdy) + rect(gdx + gdr * 1.15, gdy + gdr * 0.5, gdr * 0.9, cb2 - gdy);
  for (j = -2; j <= 2; j++) { door += rect(gdx + j * gdr * 0.38 - gdr * 0.09, gdy + gdr * 0.25, gdr * 0.18, gdr * 0.35) + n4_e(gdx + j * gdr * 0.38, gdy + gdr * 0.25, gdr * 0.09, gdr * 0.09); wins.push({x: gdx + j * gdr * 0.38, y: gdy + gdr * 0.4, b: 99}); }
  gold += rect(gdx - 1.5, gdy - gdr * 1.32, 3, gdr * 0.2) + n4_c(gdx, gdy - gdr * 1.36, 3.5) + rect(gdx - gdr * 1.15, gdy - 2, gdr * 2.3, 3);
  [[gdx - gdr * 2.6, 1], [gdx + gdr * 2.6, 0.9], [W * (ph ? 0.9 : 0.15), 0.8]].forEach(function (q) { var th = H * (ph ? 0.22 : 0.27) * q[1], tw = ph ? 9 : 13; tower += n4_tower(q[0], cb2, tw, th); gold += rect(q[0] - 1, cb2 - th - tw * 2.6 - 8, 2, 8) + n4_c(q[0], cb2 - th - tw * 2.6 - 9, 2.4); shade += rect(q[0] + tw * 0.15, cb2 - th, tw * 0.35, th); for (var k = 0; k < 3; k++) wins.push({x: q[0], y: cb2 - th * (0.25 + k * 0.22), b: 98}); win += rect(q[0] - 2, cb2 - th * 0.3, 4, 7) + rect(q[0] - 2, cb2 - th * 0.52, 4, 7); });
  add(mid, 'a', bA, C.bA); add(mid, 'b', bB, C.bB); add(mid, 'c', dome, C.dome); add(mid, 'd', win, C.win); add(mid, 'e', tower, C.tower); add(mid, 'f', shade, C.shade); add(mid, 'g', door, C.door); add(mid, 'h', gold, C.gold);
  // the terrace: patterned parapet, tiled floor, a rug with cushions and a brass tray
  var par = rect(-10, pt, W + 20, fl - pt + 2), parIn = '', floor = rect(-10, fl, W + 20, H - fl + 10), nsh = '', joint = '', line = '';
  par += rect(-10, pt - 6, W + 20, 7);
  var ps = ph ? 26 : 34; for (x = ps / 2 - 10; x < W + 10; x += ps) { parIn += n4_star8(x, (pt + fl) / 2 + 2, (fl - pt) * 0.3); line += seg(x + ps / 2, pt + 4, x + ps / 2, fl - 2); }
  nsh += rect(-10, fl, W + 20, 8) + rect(-10, pt + 1, W + 20, 3);
  for (var ry = fl + 10, rr = 0; ry < H + 10; rr++) { joint += seg(-10, ry, W + 10, ry); var stp = 50 + (ry - fl) * 0.8; for (var jx = (rr % 2) * stp * 0.5 - W * 0.2; jx < W * 1.2; jx += stp) joint += seg(jx, ry, jx + (jx - W / 2) * 0.06, ry + 12 + (ry - fl) * 0.2); ry += 12 + (ry - fl) * 0.2; }
  var S = ph ? 1 : Math.max(0.55, Math.min(1.1, H / 820)), rx = W * (ph ? 0.32 : 0.24), ry2 = H * (ph ? 0.945 : 0.935), rw = (ph ? 150 : 240) * S, rh = (ph ? 32 : 44) * S, rug = n4_pg([[rx - rw / 2 + 14, ry2 - rh / 2], [rx + rw / 2 - 14, ry2 - rh / 2], [rx + rw / 2 + 10, ry2 + rh / 2], [rx - rw / 2 - 10, ry2 + rh / 2]]), rugG = '';
  rugG += n4_pg([[rx - rw / 2 + 22, ry2 - rh / 2 + 5], [rx + rw / 2 - 22, ry2 - rh / 2 + 5], [rx + rw / 2 - 2, ry2 + rh / 2 - 5], [rx - rw / 2 + 2, ry2 + rh / 2 - 5]]);
  var rugIn = n4_pg([[rx - rw / 2 + 28, ry2 - rh / 2 + 9], [rx + rw / 2 - 28, ry2 - rh / 2 + 9], [rx + rw / 2 - 10, ry2 + rh / 2 - 9], [rx - rw / 2 + 10, ry2 + rh / 2 - 9]]);
  for (j = -3; j <= 3; j++) rugG += n4_pg([[rx + j * rw * 0.12, ry2 - 6], [rx + j * rw * 0.12 + 7, ry2], [rx + j * rw * 0.12, ry2 + 6], [rx + j * rw * 0.12 - 7, ry2]]);
  var cushA = '', cushB = '', ccs = ph ? 0.75 : S; [[-0.42, 'A'], [0.44, 'B']].forEach(function (q) { var cx = rx + q[0] * rw, cy = ry2 - rh * 0.55, s = rrect(cx - 28 * ccs, cy - 20 * ccs, 56 * ccs, 32 * ccs, 12 * ccs); if (q[1] === 'A') cushA += s; else cushB += s; });
  // brass tray on a low stand, dates in a bowl, tea glasses and a dallah pot
  var tx = rx, ty = ry2 - rh * 0.1, ts = ph ? 0.75 : S, tray = n4_e(tx, ty - 14 * ts, 44 * ts, 10 * ts) + rect(tx - 4 * ts, ty - 12 * ts, 8 * ts, 12 * ts) + n4_e(tx, ty, 14 * ts, 4 * ts);
  var trayIn = n4_e(tx, ty - 15 * ts, 38 * ts, 7.5 * ts);
  var dates = ''; for (j = 0; j < 7; j++) dates += n4_re(tx - 16 * ts + (j % 4) * 6 * ts + (j > 3 ? 3 * ts : 0), ty - 22 * ts - (j > 3 ? 4 : 0) * ts, 3.6 * ts, 2.2 * ts, 20 + j * 30);
  var bowl = n4_pg([[tx - 20 * ts, ty - 21 * ts], [tx - 2 * ts, ty - 21 * ts], [tx - 6 * ts, ty - 14 * ts], [tx - 16 * ts, ty - 14 * ts]]);
  var glasses = rect(tx + 6 * ts, ty - 26 * ts, 6 * ts, 10 * ts) + rect(tx + 15 * ts, ty - 25 * ts, 6 * ts, 10 * ts);
  var pot = n4_e(tx + 28 * ts, ty - 24 * ts, 8 * ts, 9 * ts) + n4_pg([[tx + 23 * ts, ty - 31 * ts], [tx + 33 * ts, ty - 31 * ts], [tx + 31 * ts, ty - 40 * ts], [tx + 25 * ts, ty - 40 * ts]]) + n4_pg([[tx + 35 * ts, ty - 28 * ts], [tx + 44 * ts, ty - 38 * ts], [tx + 45 * ts, ty - 36 * ts], [tx + 36 * ts, ty - 25 * ts]]) + n4_e(tx + 28 * ts, ty - 42 * ts, 4 * ts, 2.4 * ts);
  add(near, 'a', par, C.par); add(near, 'b', parIn, C.parIn); add(near, 'c', floor, C.floor); add(near, 'd', rug + bowl, C.rug); add(near, 'e', rugG + tray + pot, C.rugG); add(near, 'f', cushA + rugIn, C.cushA); add(near, 'g', cushB + dates, C.cushB); add(near, 'h', nsh + trayIn, C.nsh);
  stk(near, 's', joint, C.joint, 1); stk(near, 't', line, C.parIn, 1.2);
  add(near, 'b', glasses);
  // a potted date palm on the right of the terrace
  var pX = W * (ph ? 0.9 : 0.94), pY = fl + H * 0.04, palm = '', pot2 = n4_pg([[pX - 18, pY - 30], [pX + 18, pY - 30], [pX + 13, pY + 4], [pX - 13, pY + 4]]) + rect(pX - 21, pY - 34, 42, 6);
  for (j = 0; j < 9; j++) { var a = -Math.PI / 2 + (j - 4) * 0.34, L = (ph ? 50 : 70) * (0.8 + (j % 3) * 0.12); palm += n4_leaf(pX, pY - 34, L, ph ? 7 : 9, a * 57.3 + (j - 4) * 4); }
  add(near, 'e', pot2); add(near, 'f', palm);
  if (ANIM) { ANIM.moon = moon; ANIM.stars = stars; ANIM.wins = wins; ANIM.roofs = roofs; ANIM.pt = pt; ANIM.fl = fl; ANIM.palm = {x: pX, y: pY - 34, s: ph ? 0.75 : 1}; ANIM.floorLan = {x: rx + rw * (ph ? 0.62 : 0.66), y: ry2 + 4, s: ph ? 0.85 : 1.15}; ANIM.C = C;
    ANIM.lines = ph ? [[-12, H * 0.02, W + 12, H * 0.03, H * 0.06]] : [[-24, H * 0.01, W * 0.58, -2, H * 0.09], [W * 0.42, -4, W + 24, H * 0.02, H * 0.085]];
    ANIM.starLine = ph ? [-12, H * 0.13, W + 12, H * 0.11, H * 0.05] : [-24, H * 0.21, W + 24, H * 0.18, H * 0.06];
  } else {
    var st = ''; stars.forEach(function (s) { st += n4_c(s.x, s.y, s.r); }); add(bg, 'h', st, dk ? '#FFF4DA' : 'rgba(255,255,255,0.9)');
    add(bg, 'g', n4_cres(moon[0], moon[1], moon[2], moon[2] * 0.45, -moon[2] * 0.25, moon[2] * 0.85), C.moon);
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};

// ---------------------------------------------------------------- 5. Mid-Autumn Festival
// A riverside pavilion under a giant full moon: misty hills beyond, osmanthus trees in bloom, a stone table with
// mooncakes and tea on the near bank. The moon, its clouds and reflection, the floating river lanterns, the bells and the
// falling blossoms are the engine's.
var n4_MAC = {
  L: {m1: '#E6CBB0', m2: '#D9B89E', mist: 'rgba(255,248,236,0.7)', shore: '#B8A08A', river: '#C6DAD2', shine: 'rgba(255,255,255,0.7)', stone: '#E2D2BC', red: '#C8402E', roof: '#4E3E50', gold: '#E2A83A', inner: 'rgba(90,40,30,0.25)', lan: '#E0483A',
    grass: '#A8C48A', rock: '#B8AE9E', trunk: '#6A4A3A', leaf: '#5E9A62', bloom: '#F6B42A', table: '#CFC2AE', cake: '#E0A24A', nsh: 'rgba(90,60,40,0.2)', blade: '#7EA868', moon: '#FFF4DC'},
  D: {m1: '#2E3462', m2: '#262B56', mist: 'rgba(150,160,220,0.22)', shore: '#1A1E40', river: '#1E2A52', shine: 'rgba(200,220,255,0.3)', stone: '#4A4A72', red: '#8E2E34', roof: '#1A1830', gold: '#D9A040', inner: 'rgba(10,5,30,0.35)', lan: '#E8503A',
    grass: '#2A3E46', rock: '#3A3C62', trunk: '#2A1E2A', leaf: '#2A4A44', bloom: '#E8A82A', table: '#4A4A6E', cake: '#D9963E', nsh: 'rgba(5,5,25,0.35)', blade: '#3A5A54', moon: '#FFF2C8'}
};
SCENES.midautumn = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.2), mid = Lay(0), near = Lay(0), C = n4_MAC[dk ? 'D' : 'L'], i, j, x;
  var ry0 = H * (ph ? 0.68 : 0.66), by = H * (ph ? 0.88 : 0.87);
  var sky = dk ? 'linear-gradient(180deg,#141B3A 0%,#26305A 42%,#5A4A7A 72%,#2E3260 100%)' : 'linear-gradient(180deg,#F2D6A2 0%,#F8E8C9 42%,#E7C6A0 72%,#DDBB98 100%)';
  var S = ph ? 1 : Math.max(0.55, Math.min(1.1, H / 820)), moon = [W * (ph ? 0.66 : 0.7), H * (ph ? 0.2 : 0.2), (ph ? 66 : 106) * (ph ? 1 : S)];
  add(far, 'a', n4_c(moon[0], moon[1], moon[2] * 2.6), dk ? 'rgba(255,236,190,0.22)' : 'rgba(255,250,236,0.7)');
  add(far, 'b', n4_e(W * 0.5, ry0 - H * 0.05, W * 0.8, H * 0.14), dk ? 'rgba(150,120,200,0.3)' : 'rgba(255,240,220,0.8)');
  var stars = ''; if (dk) spread(0, 0, W, ry0 - H * 0.25, 36, 36, rnd, 1).forEach(function (c) { if (c.q < 0.3 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] * 1.6) stars += n4_c(c.x, c.y, 0.5 + c.r * 0.9); });
  add(bg, 'h', stars, 'rgba(255,244,220,0.8)');
  // misty hills
  var r1 = ridge(W, ry0 - H * (ph ? 0.16 : 0.2), [[H * 0.06, 150, 0.8], [H * 0.03, 60, 2.1]], 6, true), r2 = ridge(W, ry0 - H * (ph ? 0.07 : 0.09), [[H * 0.04, 120, 2.6], [H * 0.015, 45, 0.6]], 6, true);
  add(bg, 'a', below(r1.map(function (p) { return [p[0], p[1] + H * 0.03]; }), ry0 + 4), C.m1);
  var mist = ''; spread(0, ry0 - H * 0.16, W, H * 0.12, 260, 60, rnd, 0.8).forEach(function (c) { mist += n4_e(c.x, c.y, 150 + c.r * 90, 10 + c.k * 8); }); add(bg, 'c', mist, C.mist);
  add(bg, 'b', below(r2.map(function (p) { return [p[0], p[1] + H * 0.03]; }), ry0 + 4), C.m2);
  var shoreT = ''; for (x = -10; x < W + 10; x += ph ? 14 : 18) { var s = (ph ? 5 : 7) + rnd() * (ph ? 6 : 9); shoreT += n4_c(x, ry0 - s * 0.4, s) + n4_c(x + s * 0.7, ry0 - s * 0.1, s * 0.7); }
  add(bg, 'd', shoreT + rect(-10, ry0 - 3, W + 20, 6), C.shore);
  // the river
  var shine = ''; spread(0, ry0 + 8, W, by - ry0 - 8, ph ? 90 : 140, 18, rnd, 1).forEach(function (c) { if (c.q < 0.55) shine += seg(c.x, c.y, c.x + 14 + c.r * 30, c.y); });
  add(mid, 'a', rect(-10, ry0, W + 20, H - ry0 + 10), C.river); stk(mid, 's', shine, C.shine, 1.2);
  // the pavilion on its stone platform, reaching into the water
  var px = W * (ph ? 0.2 : 0.15), pw = (ph ? 120 : 230) * S, pb = H * (ph ? 0.86 : 0.84), colH = H * (ph ? 0.12 : 0.16), rb = pb - colH, rs = pw / 230;
  var stone = rect(px - pw * 0.62, pb, pw * 1.24, H * 0.03) + rect(px - pw * 0.7, pb + H * 0.03, pw * 1.4, H * 0.02) + rect(px - pw * 0.56, pb - 8 * rs, pw * 1.12, 9 * rs);
  for (i = 0; i < 4; i++) stone += rect(px + pw * 0.62 + i * 10 * rs, pb + i * 7 * rs, 30 * rs, 8 * rs);
  var red = '', roof = '', gold = '', inner = rect(px - pw * 0.46, rb + 6, pw * 0.92, colH - 6), lanS = '';
  [-0.46, -0.16, 0.16, 0.46].forEach(function (q) { red += rect(px + q * pw - 5 * rs, rb, 10 * rs, colH); });
  red += rect(px - pw * 0.52, pb - 22 * rs, pw * 1.04, 4 * rs); for (x = px - pw * 0.5; x <= px + pw * 0.5; x += 12 * rs) red += rect(x - 1.2 * rs, pb - 22 * rs, 2.4 * rs, 14 * rs);
  red += rect(px - pw * 0.52, rb, pw * 1.04, 10 * rs);
  // two tiers of curved roof with upturned eaves
  function eaveRoof(cx, y, w, h) { var p = [[cx - w * 0.62, y - h * 0.15]], k; for (k = 0; k <= 10; k++) { var u = k / 10; p.push([cx - w * 0.5 + u * w * 0.24, y - h * 0.08 - Math.pow(u, 1.6) * h * 0.6]); } p.push([cx - w * 0.2, y - h], [cx + w * 0.2, y - h]); for (k = 10; k >= 0; k--) { u = k / 10; p.push([cx + w * 0.5 - u * w * 0.24, y - h * 0.08 - Math.pow(u, 1.6) * h * 0.6]); } p.push([cx + w * 0.62, y - h * 0.15], [cx + w * 0.5, y + 4 * rs], [cx - w * 0.5, y + 4 * rs]); return n4_pg(p); }
  roof += eaveRoof(px, rb, pw * 1.2, 46 * rs) + rect(px - pw * 0.26, rb - 64 * rs, pw * 0.52, 20 * rs) + eaveRoof(px, rb - 60 * rs, pw * 0.72, 40 * rs);
  gold += rect(px - pw * 0.24, rb - 47 * rs, pw * 0.48, 4 * rs) + rect(px - pw * 0.15, rb - 101 * rs, pw * 0.3, 4 * rs) + n4_c(px, rb - 108 * rs, 6 * rs) + rect(px - 1.5 * rs, rb - 122 * rs, 3 * rs, 14 * rs) + n4_c(px, rb - 124 * rs, 3.4 * rs);
  gold += n4_c(px - pw * 0.62, rb - 46 * rs * 0.15 - 2, 3 * rs) + n4_c(px + pw * 0.62, rb - 46 * rs * 0.15 - 2, 3 * rs);
  var bells = [[px - pw * 0.6, rb - 4 * rs], [px + pw * 0.6, rb - 4 * rs], [px - pw * 0.35, rb - 64 * rs], [px + pw * 0.35, rb - 64 * rs]], plan = [[px - pw * 0.31, rb + 12 * rs], [px + pw * 0.31, rb + 12 * rs]];
  if (!ANIM) plan.forEach(function (p) { lanS += n4_e(p[0], p[1] + 14 * rs, 9 * rs, 11 * rs); });
  add(mid, 'c', stone, C.stone); add(mid, 'b', inner, C.inner); add(mid, 'd', red, C.red); add(mid, 'e', roof, C.roof); add(mid, 'f', gold, C.gold); add(mid, 'h', lanS, C.lan);
  // reflection of the pavilion in the water
  add(mid, 'g', rect(px - pw * 0.6, pb + H * 0.05, pw * 1.2, H * 0.04) + rect(px - pw * 0.4, pb + H * 0.09, pw * 0.8, H * 0.025), dk ? 'rgba(120,40,40,0.25)' : 'rgba(160,70,50,0.16)');
  // the near bank: grass, rocks, an osmanthus tree and a stone table with mooncakes and tea
  var bk = []; for (x = -20; x <= W + 20; x += 10) bk.push([x, by + Math.sin(x / 90 + 0.7) * H * 0.012 + Math.sin(x / 31) * 3 - Math.exp(-Math.pow((x - W * 0.9) / (W * 0.12), 2)) * H * 0.04]);
  var grass = below(bk, H + 10), rock = '', blade = '';
  [[0.42, 1.2], [0.48, 0.8], [0.06, 1], [0.66, 0.9]].forEach(function (q) { var rx = W * q[0], ryy = n4_yOn(bk, rx) + 6, s = (ph ? 10 : 16) * q[1]; rock += n4_pg([[rx - s * 1.4, ryy + s * 0.4], [rx - s * 1.1, ryy - s * 0.4], [rx - s * 0.2, ryy - s * 0.8], [rx + s * 0.9, ryy - s * 0.5], [rx + s * 1.5, ryy + s * 0.4]]); });
  spread(0, by, W, H - by, ph ? 30 : 40, 20, rnd, 1).forEach(function (c) { if (c.q < 0.4 && c.y > n4_yOn(bk, c.x) + 6) blade += 'M' + PT(c.x - 3, c.y) + ' Q' + PT(c.x - 1, c.y - 6) + ' ' + PT(c.x - 4, c.y - 11) + ' M' + PT(c.x + 1, c.y) + ' Q' + PT(c.x + 2, c.y - 7) + ' ' + PT(c.x + 5, c.y - 10) + ' '; });
  var tX = W * (ph ? 0.92 : 0.9), tY = n4_yOn(bk, tX) + 10, ts = ph ? 0.7 : S, trunk = n4_pg([[tX - 14 * ts, tY], [tX - 10 * ts, tY - 70 * ts], [tX - 40 * ts, tY - 130 * ts], [tX - 34 * ts, tY - 134 * ts], [tX - 2 * ts, tY - 90 * ts], [tX + 20 * ts, tY - 150 * ts], [tX + 27 * ts, tY - 146 * ts], [tX + 10 * ts, tY - 70 * ts], [tX + 16 * ts, tY]]);
  var leaf = '', bloom = '', treeC = [];
  for (i = 0; i < 30; i++) { var a = hash(i + 5) * Math.PI * 2, d = hash(i + 9), cx = tX + Math.cos(a) * d * 90 * ts, cy = tY - 170 * ts + Math.sin(a) * d * 60 * ts, r = (22 + hash(i + 3) * 16) * ts; leaf += n4_c(cx, cy, r); treeC.push([cx, cy, r]); }
  // a flowering branch reaching in from the top-left corner
  var br = [[-20, H * (ph ? 0.1 : 0.05)], [W * 0.06, H * (ph ? 0.08 : 0.06)], [W * (ph ? 0.2 : 0.14), H * (ph ? 0.1 : 0.1)], [W * (ph ? 0.32 : 0.22), H * (ph ? 0.08 : 0.08)]];
  var brD = n4_pg(br.concat([[br[3][0] - 2, br[3][1] + 4], [br[2][0], br[2][1] + 8], [br[1][0], br[1][1] + 9], [-20, br[0][1] + 12]]));
  br.slice(1).forEach(function (p, k) { for (var q = 0; q < 6; q++) { var lx = p[0] - 20 + q * 9, ly = p[1] + 4 + (q % 2) * 4; leaf += n4_leaf(lx, ly, (ph ? 12 : 16), ph ? 3.6 : 4.6, 60 + (q % 3) * 30); treeC.push([lx, ly + 6, 8]); } });
  treeC.forEach(function (c, k) { for (var q = 0; q < 4; q++) { var a2 = hash(k * 4 + q + 70) * 6.28, rr = c[2] * (0.4 + hash(k + q * 9) * 0.6); bloom += n4_c(c[0] + Math.cos(a2) * rr, c[1] + Math.sin(a2) * rr * 0.8, ph ? 1.7 : 2.3); } });
  // stone table with mooncakes and a teapot
  var sx = W * (ph ? 0.6 : 0.36), sy = n4_yOn(bk, sx) + H * 0.06, ss = ph ? 0.75 : S, table = n4_e(sx, sy - 34 * ss, 52 * ss, 13 * ss) + rect(sx - 12 * ss, sy - 34 * ss, 24 * ss, 34 * ss) + n4_e(sx, sy, 22 * ss, 6 * ss);
  var cake = '', nsh = n4_e(sx, sy + 6 * ss, 60 * ss, 8 * ss) + n4_e(sx, sy - 31 * ss, 46 * ss, 9 * ss);
  [[-24, 0], [-8, -4], [-16, -12]].forEach(function (q) { cake += n4_e(sx + q[0] * ss, sy - 40 * ss + q[1] * ss, 11 * ss, 5 * ss) + rect(sx + q[0] * ss - 11 * ss, sy - 46 * ss + q[1] * ss, 22 * ss, 6 * ss) + n4_e(sx + q[0] * ss, sy - 46 * ss + q[1] * ss, 11 * ss, 5 * ss); });
  var pot = n4_e(sx + 22 * ss, sy - 46 * ss, 12 * ss, 10 * ss) + rect(sx + 18 * ss, sy - 59 * ss, 8 * ss, 4 * ss) + n4_pg([[sx + 32 * ss, sy - 48 * ss], [sx + 44 * ss, sy - 56 * ss], [sx + 45 * ss, sy - 53 * ss], [sx + 33 * ss, sy - 43 * ss]]);
  add(near, 'a', grass, C.grass); add(near, 'b', rock, C.rock); add(near, 'c', trunk + brD, C.trunk); add(near, 'd', leaf, C.leaf); add(near, 'e', bloom, C.bloom); add(near, 'f', table + pot, C.table); add(near, 'g', cake, C.cake); add(near, 'h', nsh, C.nsh);
  stk(near, 's', blade, C.blade, 1.2);
  if (ANIM) { ANIM.moon = moon; ANIM.ry0 = ry0; ANIM.by = by; ANIM.bells = bells; ANIM.plan = plan; ANIM.rs = rs; ANIM.trees = treeC; ANIM.C = C; ANIM.cakes = {x: sx, y: sy - 46 * ss, s: ss}; }
  else { add(bg, 'g', n4_c(moon[0], moon[1], moon[2]), C.moon); }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
