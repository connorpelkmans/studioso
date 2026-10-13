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

// =============== 1. Hot Spring (onsen): a steaming rock pool in autumn, under red and gold maples, with a bamboo spout, stone lanterns,
// a vermilion torii, a little ryokan and a snow-capped peak far away
// a maple leaf: five pointed lobes around (x,y) (size r), stem pointing down, turned by ang (degrees)
function n1_maplePts(x, y, r, ang) { var lob = [[150, 0.62], [208, 0.9], [270, 1], [332, 0.9], [390, 0.62]], p = [], i, pr = 90;
  function at(a, rr) { var t = a * Math.PI / 180; return [Math.cos(t) * rr * r, Math.sin(t) * rr * r]; }
  p.push(at(90, 0.12));
  for (i = 0; i < lob.length; i++) { var a = lob[i][0], l = lob[i][1]; p.push(at((pr + a) / 2 + (i ? 0 : 6), i ? 0.42 : 0.26)); p.push(at(a - 22, l * 0.52)); p.push(at(a - 13, l * 0.74)); p.push(at(a - 6, l * 0.8)); p.push(at(a, l)); p.push(at(a + 6, l * 0.8)); p.push(at(a + 13, l * 0.74)); p.push(at(a + 22, l * 0.52)); pr = a; }
  p.push(at(55, 0.26)); return rotp(p, x, y, ang); }
function n1_maple(x, y, r, ang) { return n1_P(n1_maplePts(x, y, r, ang)); }
// a maple clump: a round body of foliage (in slot body) ringed and dotted with single leaves in the slots of cols
function n1_clump(o, x, y, R, rnd, body, cols, n) { var i; for (i = 0; i < 6; i++) { var a = i / 6 * 6.283 + rnd(), d = R * (0.25 + rnd() * 0.3); o[body] += n1_C(x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d * 0.6, R * (0.36 + rnd() * 0.16)); }
  o[body] += n1_C(x, y, R * 0.5);
  for (i = 0; i < (n || 11); i++) { var b = i / (n || 11) * 6.283 + rnd() * 0.4, e = 0.55 + rnd() * 0.45, lx = x + Math.cos(b) * R * 0.9 * e, ly = y + Math.sin(b) * R * 0.62 * e + R * 0.08;
    o[cols[Math.floor(rnd() * cols.length)]] += n1_maple(lx, ly, R * (0.25 + rnd() * 0.1), (b * 180 / Math.PI + 90) * 0.6 + (rnd() - 0.5) * 50); } }
SCENES.onsen = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2.5), refl = Lay(0.6), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, j, k;
  var sky = dk ? 'linear-gradient(180deg,#141A3C 0%,#252A58 36%,#463C72 66%,#7E4E6E 100%)' : 'linear-gradient(180deg,#7EC2EC 0%,#B2DBF2 36%,#F0E6D4 66%,#FAD2AC 100%)';
  // sun or moon, clouds or stars
  var mx = W * (ph ? 0.72 : 0.66), my = H * (ph ? 0.16 : 0.1), mr = ph ? 20 : 28;
  if (dk) { add(far, 'a', n1_C(mx, my, mr * 2.3), 'rgba(255,230,200,0.13)'); add(far, 'c', n1_C(mx, my, mr), '#FFF2D6');
    var st = ''; spread(0, 0, W, H * 0.42, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - mx, c.y - my) > mr * 2) st += n1_C(c.x, c.y, 0.5 + c.r * 1.2); }); add(far, 'b', st, 'rgba(255,246,226,0.9)'); }
  else { add(far, 'a', n1_C(mx, my, mr * 2.2), 'rgba(255,246,214,0.5)'); add(far, 'c', n1_C(mx, my, mr), 'rgba(255,252,236,1)');
    var cl = ''; spread(0, H * 0.04, W, H * 0.18, ph ? 190 : 320, 100, rnd, 0.8).forEach(function (c) { if (c.q < 0.55 && Math.hypot(c.x - mx, c.y - my) > 90) { var s = 0.7 + c.r * 0.6; cl += n1_E(c.x, c.y, 62 * s, 12 * s) + n1_C(c.x - 18 * s, c.y - 8 * s, 17 * s) + n1_C(c.x + 15 * s, c.y - 12 * s, 22 * s); } }); add(far, 'b', cl, 'rgba(255,255,255,0.9)'); }
  // far range with one big snow-capped cone
  var base = H * (ph ? 0.5 : 0.44), fx = W * (ph ? 0.6 : 0.57), fTop = H * (ph ? 0.22 : 0.13), fW = W * (ph ? 0.62 : 0.34);
  var coneY = function (x) { var d = Math.max(0, Math.abs(x - fx) / fW - 0.035) / 0.965; return d >= 1 ? base : fTop + (base - fTop) * (1 - Math.pow(1 - d, 2.1)); };
  var rY = function (x) { return H * (ph ? 0.36 : 0.29) + H * 0.045 * Math.sin(x / 150 + 1.3) + H * 0.025 * Math.abs(Math.sin(x / 61 + 0.4)); };
  var rng = n1_fn(-60, W + 60, 6, function (x) { return Math.min(coneY(x), rY(x)); });
  add(far, 'd', below(rng, H + 40), dk ? '#3A3F76' : '#A9B6DE');
  add(far, 'e', n1_P(n1_fn(fx, fx + fW, 6, coneY).concat([[fx + fW, base + 30], [fx, base + 30]])), dk ? 'rgba(16,18,50,0.32)' : 'rgba(90,100,170,0.18)');
  var capB = fTop + (base - fTop) * 0.24, cap = [];
  for (i = 0; i <= 24; i++) { var cx0 = fx - fW + i / 24 * fW * 2; if (coneY(cx0) <= capB + 2) cap.push([cx0, coneY(cx0)]); }
  var cL = cap[0][0], cR = cap[cap.length - 1][0];
  for (i = 20; i >= 0; i--) { var ux = cL + (cR - cL) * i / 20; cap.push([ux, capB - H * 0.006 + Math.pow(Math.abs(Math.sin(i / 20 * Math.PI * 2.5)), 1.5) * H * (ph ? 0.016 : 0.022)]); }
  add(far, 'f', n1_P(cap), dk ? '#B4B8E6' : '#FFFFFF');
  // nearer rolling range, blushed with autumn colour
  var r2 = n1_fn(-60, W + 60, 8, function (x) { return H * (ph ? 0.43 : 0.38) + Math.sin(x / 110 + 2) * H * 0.03 + Math.sin(x / 43) * H * 0.008; });
  add(far, 'g', below(r2, H + 40), dk ? '#353A6C' : '#8FAED2');
  var blush = ''; for (var bxx = -20; bxx < W + 20; bxx += (ph ? 9 : 12)) { var byy = n1_yOn(r2, bxx) + H * 0.03 + rnd() * H * 0.012, br = (ph ? 9 : 14) * (0.7 + rnd() * 0.8); blush += n1_C(bxx, byy, br); }
  blush += below(n1_fn(-60, W + 60, 8, function (x) { return n1_yOn(r2, x) + H * 0.04; }), H + 40);
  add(far, 'h', blush, dk ? 'rgba(178,76,98,0.5)' : 'rgba(242,150,112,0.5)');
  // forest hills with red, orange, gold and green crowns, then the lawn
  var hill = n1_fn(-60, W + 60, 8, function (x) { return H * (ph ? 0.51 : 0.47) + Math.sin(x / 90 + 1) * H * 0.012 + Math.sin(x / 210) * H * 0.02; });
  add(refl, 'a', below(hill, H + 40), dk ? '#2C4252' : '#7FB46A');
  var gy0 = H * (ph ? 0.645 : 0.63), ground = n1_fn(-60, W + 60, 8, function (x) { return gy0 + Math.sin(x / 120 + 1) * 5 + Math.sin(x / 47) * 2; });
  var cr = {b: '', c: '', d: '', e: '', f: '', s: ''};
  for (j = 0; j < 3; j++) spread(-30, 0, W + 60, 1, (ph ? 30 : 44) - j * 4, 1, rnd, 1).forEach(function (c) { var x = c.x, y = n1_yOn(hill, x) + H * 0.02 + j * (gy0 - n1_yOn(hill, x)) * 0.33, r = (ph ? 14 : 22) * (0.8 + c.r * 0.5) * (1 + j * 0.12), sl = 'bcdeb'[Math.floor(c.q * 5)];
    cr[sl] += n1_C(x, y, r) + n1_C(x - r * 0.6, y + r * 0.3, r * 0.7) + n1_C(x + r * 0.6, y + r * 0.25, r * 0.72); cr.f += n1_E(x - r * 0.3, y - r * 0.4, r * 0.38, r * 0.22); cr.s += seg(x, y + r * 0.6, x, y + r * 1.2); });
  stk(refl, 's', cr.s, dk ? '#2A1E26' : '#7A5038', ph ? 2 : 3);
  add(refl, 'b', cr.b, dk ? '#A23E4E' : '#E4523E'); add(refl, 'c', cr.c, dk ? '#B4603E' : '#F5973E'); add(refl, 'd', cr.d, dk ? '#B48E42' : '#F5C24C'); add(refl, 'e', cr.e, dk ? '#1F3E44' : '#3E8A60');
  add(refl, 'f', cr.f, dk ? 'rgba(255,220,200,0.12)' : 'rgba(255,255,255,0.28)');
  add(refl, 'g', below(ground, H + 40), dk ? '#33475A' : '#A6CE7A');
  var gyAt = function (x) { return n1_yOn(ground, x); };
  // the pool
  var cx = W * (ph ? 0.5 : 0.47), cy = H * (ph ? 0.84 : 0.875), rx = W * (ph ? 0.44 : 0.33), ry = H * (ph ? 0.075 : 0.08);
  // the ryokan (right): dark timber, glowing shoji, a vermilion veranda rail and noren, a slate roof with upturned eaves
  var bx = W * (ph ? 0.78 : 0.83), bw = ph ? 150 : 280 * S, by = gyAt(bx) + (ph ? 10 : 16), wh = bw * 0.33, rh = bw * 0.2, ov = bw * 0.1, L0 = bx - bw / 2, R0 = bx + bw / 2;
  var wood = rect(L0, by - wh, bw, wh) + rect(L0 - ov * 0.4, by - 4, bw + ov * 0.8, 6), shoji = '', lat = '', wins = [];
  [0, 1, 3, 4].forEach(function (q) { var x0 = L0 + bw * (0.04 + q * 0.19), y0 = by - wh * 0.82, ww = bw * 0.16, hh = wh * 0.58; shoji += rect(x0, y0, ww, hh); wins.push([x0 + ww / 2, y0 + hh / 2]);
    for (var m = 1; m < 3; m++) lat += seg(x0 + ww * m / 3, y0, x0 + ww * m / 3, y0 + hh); for (m = 1; m < 4; m++) lat += seg(x0, y0 + hh * m / 4, x0 + ww, y0 + hh * m / 4); });
  var yt = by - wh - rh, ye = by - wh + 3, yTip = ye - rh * 0.22, rr = bw * 0.33, roofTop = function (x) { var d = Math.abs(x - bx); if (d <= rr) return yt; var u = Math.min(1, (d - rr) / (bw / 2 + ov - rr)); return yt + (yTip - yt) * (1 - Math.pow(1 - u, 1.7)); };
  var roofPts = n1_fn(L0 - ov, R0 + ov, 4, roofTop).concat([[R0 + ov * 0.7, ye], [L0 - ov * 0.7, ye]]), roof = n1_P(roofPts);
  wood += rrect(bx - rr - bw * 0.03, yt - rh * 0.16, (rr + bw * 0.03) * 2, rh * 0.2, rh * 0.06) + n1_C(bx - rr - bw * 0.03, yt - rh * 0.1, rh * 0.11) + n1_C(bx + rr + bw * 0.03, yt - rh * 0.1, rh * 0.11);
  var tiles = ''; for (i = 1; i < 18; i++) { var tx = L0 - ov * 0.6 + (bw + ov * 1.2) * i / 18; tiles += seg(tx, roofTop(tx) + 3, tx, ye - 2); } tiles += seg(L0 - ov * 0.7, ye - rh * 0.12, R0 + ov * 0.7, ye - rh * 0.12);
  var verm = '', nx = L0 + bw * 0.5, nw = bw * 0.15, ny = by - wh + 2, nh = wh * 0.5;
  for (i = 0; i < 3; i++) verm += rect(nx - nw / 2 + i * nw / 3 + 0.8, ny, nw / 3 - 1.6, nh);
  verm += rect(L0 - ov * 0.4, by - wh * 0.22, bw + ov * 0.8, 3 * (ph ? 0.7 : S)); for (i = 0; i <= 10; i++) verm += rect(L0 - ov * 0.4 + (bw + ov * 0.8) * i / 10 - 1.5, by - wh * 0.22, 3, wh * 0.22);
  // the torii (left, behind the pool)
  var tx0 = W * (ph ? 0.15 : 0.13), ty0 = gyAt(tx0) + (ph ? 18 : 30), th = (ph ? 120 : 190) * (ph ? 0.75 : S), tw = th * 0.82, pw = th * 0.07;
  verm += n1_P([[tx0 - tw * 0.36 - pw / 2, ty0], [tx0 - tw * 0.33 - pw / 2, ty0 - th * 0.86], [tx0 - tw * 0.33 + pw / 2, ty0 - th * 0.86], [tx0 - tw * 0.36 + pw / 2, ty0]]) + n1_P([[tx0 + tw * 0.36 - pw / 2, ty0], [tx0 + tw * 0.33 - pw / 2, ty0 - th * 0.86], [tx0 + tw * 0.33 + pw / 2, ty0 - th * 0.86], [tx0 + tw * 0.36 + pw / 2, ty0]]);
  verm += rect(tx0 - tw * 0.46, ty0 - th * 0.7, tw * 0.92, th * 0.06) + n1_P([[tx0 - tw * 0.5, ty0 - th * 0.86], [tx0 + tw * 0.5, ty0 - th * 0.86], [tx0 + tw * 0.48, ty0 - th * 0.93], [tx0 - tw * 0.48, ty0 - th * 0.93]]) + rect(tx0 - pw * 0.4, ty0 - th * 0.86, pw * 0.8, th * 0.16);
  wood += n1_P(n1_curve([[tx0 - tw * 0.62, ty0 - th * 1.04], [tx0 - tw * 0.3, ty0 - th * 0.96], [tx0, ty0 - th * 0.955], [tx0 + tw * 0.3, ty0 - th * 0.96], [tx0 + tw * 0.62, ty0 - th * 1.04]], 4).concat([[tx0 + tw * 0.54, ty0 - th * 0.92], [tx0, ty0 - th * 0.905], [tx0 - tw * 0.54, ty0 - th * 0.92]]));
  wood += rect(tx0 - tw * 0.36 - pw * 0.7, ty0 - th * 0.05, pw * 1.4, th * 0.05) + rect(tx0 + tw * 0.36 - pw * 0.7, ty0 - th * 0.05, pw * 1.4, th * 0.05);
  // stepping stones from the ryokan to the pool, leaves on the lawn and round shrubs
  var path = '', p0 = [nx, by + 6], p1 = [cx + rx * (ph ? 0.3 : 0.45), cy - ry * 1.3];
  for (i = 0; i < 9; i++) { var u = i / 8, sx0 = p0[0] + (p1[0] - p0[0]) * u + Math.sin(u * Math.PI * 1.5) * W * 0.04, sy0 = p0[1] + (p1[1] - p0[1]) * u, ss = (ph ? 7 : 11) * S * (0.8 + u * 0.6) * (ph ? 1.4 : 1); path += n1_E(sx0 + (i % 2 ? ss : -ss) * 0.5, sy0, ss * 1.2, ss * 0.42); }
  add(refl, 'h', path, dk ? '#55557C' : '#D8CCB6');
  var lawnL = '', shr = ''; for (i = 0; i < (ph ? 8 : 14); i++) { var lx0 = W * rnd(), ly0 = gy0 + 10 + rnd() * (cy - ry - gy0 - 14); if (ly0 < gyAt(lx0) + 4) continue; lawnL += n1_maple(lx0, ly0, (ph ? 5 : 7) * S * 1.3, rnd() * 360); }
  [[L0 + bw * 0.05, by + 4, 1], [R0 - bw * 0.03, by + 4, 0.9], [tx0 - tw * 0.55, ty0 + 2, 0.8], [tx0 + tw * 0.6, ty0 + 2, 1]].forEach(function (q) { var r = (ph ? 10 : 18) * S * q[2] * (ph ? 1.4 : 1); shr += n1_C(q[0], q[1] - r * 0.6, r) + n1_C(q[0] - r * 0.9, q[1] - r * 0.3, r * 0.7) + n1_C(q[0] + r * 0.9, q[1] - r * 0.3, r * 0.75) + rect(q[0] - r * 1.5, q[1] - r * 0.4, r * 3, r * 0.4); });
  verm += lawnL;
  add(mid, 'a', wood, dk ? '#3E2A36' : '#7A4A30'); add(mid, 'b', shoji, dk ? '#FFD27A' : '#FFF4DC'); add(mid, 'c', roof, dk ? '#262B4C' : '#4A5A80'); add(mid, 'd', verm, dk ? '#C04A44' : '#EA553A');
  stk(mid, 's', lat + tiles, dk ? '#5A3A2E' : '#6A4430', ph ? 0.9 : 1.3);
  // the bamboo spout (kakehi) and deer scarer at the back left of the pool
  var sp = {px: cx - rx * (ph ? 0.36 : 0.42), py: cy - ry * 1.05 - (ph ? 16 : 26) * S, L: (ph ? 56 : 84) * S, w: (ph ? 7 : 11) * S};
  sp.a0 = -0.38; sp.a1 = 0.62;
  var c0 = Math.cos(sp.a0), s0 = Math.sin(sp.a0), stx = sp.px - sp.L * 0.4 * c0 - sp.w * 0.5 * s0, sty = sp.py - sp.L * 0.4 * s0 + sp.w * 0.5 * c0;
  sp.stone = [stx, sty];
  var bam = '', nodes = '', rimY = function (x) { var u = (x - cx) / (rx * 1.02); return cy - ry * 1.02 * Math.sqrt(Math.max(0, 1 - u * u)); };
  var kx = sp.px + sp.L * 0.98, kw = sp.w * 1.35, kT = sp.py - sp.L * 0.98, kB = rimY(kx) + 4;
  bam += n1_P([[kx - kw / 2, kT + kw * 0.55], [kx + kw / 2, kT], [kx + kw / 2, kB], [kx - kw / 2, kB]]);
  nodes += seg(kx - kw / 2, kT + kw * 0.55, kx + kw / 2, kT) + seg(kx - kw / 2, kT + (kB - kT) * 0.45, kx + kw / 2, kT + (kB - kT) * 0.45);
  var pyy = sp.py - sp.L * 0.7, ph2 = sp.w * 0.32, pe = [sp.px + sp.L * 0.5, sp.py - sp.L * 0.63];
  bam += n1_P([[kx, pyy - ph2], [pe[0] - ph2 * 0.8, pe[1] - ph2], [pe[0] + ph2 * 0.5, pe[1] + ph2], [kx, pyy + ph2]]);
  nodes += seg(kx - kw / 2 - 1.5, pyy - ph2 * 1.5, kx - kw / 2 - 1.5, pyy + ph2 * 1.5) + seg((kx + pe[0]) / 2, (pyy + pe[1]) / 2 - ph2, (kx + pe[0]) / 2, (pyy + pe[1]) / 2 + ph2);
  sp.pipe = [pe[0] - ph2 * 0.1, pe[1] + ph2 * 0.6];
  bam += rect(sp.px - sp.w * 0.32, sp.py - sp.w * 0.7, sp.w * 0.64, sp.L * 0.5) + n1_C(sp.px, sp.py - sp.w * 0.7, sp.w * 0.32);
  // a second, shorter bamboo stem beside the tall one, for a fuller clump
  var kx2 = kx + kw * 1.1, kT2 = kT + sp.L * 0.35; bam += n1_P([[kx2 - kw * 0.4, kT2 + kw * 0.45], [kx2 + kw * 0.4, kT2], [kx2 + kw * 0.4, rimY(kx2) + 4], [kx2 - kw * 0.4, rimY(kx2) + 4]]); nodes += seg(kx2 - kw * 0.4, kT2 + kw * 0.45, kx2 + kw * 0.4, kT2);
  var bleaf = ''; [[kx, kT + kw, -150], [kx, kT + kw * 2.5, -30], [kx2, kT2 + kw, -40], [kx, kT + (kB - kT) * 0.45, -160]].forEach(function (q) { bleaf += n1_leaf(q[0], q[1], (ph ? 16 : 24) * S * 1.4, (ph ? 2.4 : 3.6) * S * 1.4, q[2], 0.15); });
  add(mid, 'e', bam + bleaf + shr, dk ? '#5E8A5A' : '#8CC25C'); stk(mid, 's', nodes);
  // water: milky turquoise, lighter in the middle
  var water = n1_blob(cx, cy, rx, ry, rnd, 18, 0.04);
  add(mid, 'f', n1_P(water), dk ? '#2A6688' : '#55C6CE'); add(mid, 'g', n1_E(cx - rx * 0.05, cy + ry * 0.1, rx * 0.8, ry * 0.62), dk ? '#367C9C' : '#8EE0DC');
  // rocks along the back rim, mossy on top
  var back = '', moss = '', nb = ph ? 10 : 16;
  for (i = 0; i < nb; i++) { var t = Math.PI * (1.0 + i / (nb - 1)), sx = cx + Math.cos(t) * rx * 1.03, sy = cy + Math.sin(t) * ry * 1.03, srx = (ph ? 15 : 25) * (0.8 + rnd() * 0.5), sry = srx * (0.55 + rnd() * 0.15);
    back += n1_P(n1_stonePts(sx, sy, srx, sry, rnd)); if (rnd() < 0.6) moss += 'M' + PT(sx - srx * 0.55, sy - sry * 0.55) + ' Q' + PT(sx, sy - sry * 1.15) + ' ' + PT(sx + srx * 0.5, sy - sry * 0.6) + ' '; }
  add(mid, 'h', back, dk ? '#4E4E74' : '#A69C94'); stk(mid, 't', moss, dk ? '#3A6650' : '#7DBE56', (ph ? 4 : 6) * S * 1.2);
  // ---- near: front rocks, lanterns, bushes, ferns, flowers and the maple canopy
  var N = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''};
  var nf = ph ? 8 : 13;
  for (i = 0; i < nf; i++) { var t2 = Math.PI * (0.03 + 0.94 * i / (nf - 1)), fx2 = cx + Math.cos(t2) * rx * 1.04, fy = cy + Math.sin(t2) * ry * 1.1 + 6, frx = (ph ? 20 : 34) * (0.8 + rnd() * 0.5), fry = frx * (0.5 + rnd() * 0.15);
    N.a += n1_P(n1_stonePts(fx2, fy, frx, fry, rnd)); N.b += n1_P(n1_stonePts(fx2 - frx * 0.15, fy - fry * 0.35, frx * 0.6, fry * 0.4, rnd)); if (rnd() < 0.5) N.c += n1_P(n1_capPts(fx2, fy, frx, fry, rnd, 0.28)); }
  var lanL = [cx - rx * (ph ? 0.66 : 0.8), cy - ry * (ph ? 1.5 : 1.15)], lanR = [cx + rx * (ph ? 0.84 : 1.1), cy - ry * (ph ? 1.4 : 0.9)];
  [lanL, lanR].forEach(function (p) { var sr = ph ? 22 : 38; N.a += n1_P(n1_stonePts(p[0], p[1] + 4, sr, sr * 0.5, rnd)); N.b += n1_P(n1_stonePts(p[0] - sr * 0.15, p[1] + 4 - sr * 0.18, sr * 0.6, sr * 0.2, rnd)); N.c += n1_P(n1_capPts(p[0], p[1] + 4, sr, sr * 0.5, rnd, 0.2)); });
  var csr = 16 * S, csy = sty + 9 * S * 0.9;
  N.a += n1_P(n1_stonePts(stx + 2 * S, csy, csr, 9 * S, rnd)) + n1_P(n1_stonePts(sp.px, sp.py + sp.L * 0.4, 20 * S, 11 * S, rnd)); N.c += n1_P(n1_capPts(sp.px, sp.py + sp.L * 0.4, 20 * S, 11 * S, rnd, 0.3));
  // stone lanterns (toro)
  var lan = [];
  [[lanL, ph ? 0.8 : 1], [lanR, ph ? 0.72 : 0.86]].forEach(function (q) { var x = q[0][0], y = q[0][1] - 2, s = q[1] * S * (ph ? 1.6 : 1), u = 10 * s;
    N.d += n1_P([[x - u * 1.5, y], [x - u * 1.2, y - u * 0.8], [x + u * 1.2, y - u * 0.8], [x + u * 1.5, y]]) + rect(x - u * 0.45, y - u * 4, u * 0.9, u * 3.3) + rect(x - u * 1.25, y - u * 4.6, u * 2.5, u * 0.7) + rect(x - u * 1.0, y - u * 6.2, u * 0.45, u * 1.7) + rect(x + u * 0.55, y - u * 6.2, u * 0.45, u * 1.7);
    N.d += n1_P([[x - u * 2.1, y - u * 6.0], [x - u * 0.9, y - u * 7.9], [x + u * 0.9, y - u * 7.9], [x + u * 2.1, y - u * 6.0], [x + u * 2.3, y - u * 5.7], [x - u * 2.3, y - u * 5.7]]) + n1_C(x, y - u * 8.4, u * 0.55) + rect(x - u * 0.15, y - u * 9.2, u * 0.3, u * 0.5);
    N.h += rect(x - u * 0.55, y - u * 5.9, u * 1.1, u * 1.3);
    N.c += n1_P([[x - u * 2.0, y - u * 6.05], [x - u * 0.9, y - u * 7.7], [x - u * 0.2, y - u * 7.7], [x - u * 1.0, y - u * 6.3]]);
    lan.push({x: x, y: y - u * 5.25, r: u * 5, s: s}); });
  // little bushes, ferns and pink bush clover at the bottom corners and beside the lanterns
  var fern = {c: '', tips: []}, fl = '';
  var bush = function (x, y, R) { n1_clump(N, x, y, R, rnd, rnd() < 0.5 ? 'f' : 'g', ['f', 'g', 'h'], 10); };
  if (ph) { bush(W * 0.02, H * 0.985, 46); bush(W * 0.98, H * 0.975, 40); }
  else { bush(W * 0.035, H * 0.97, 70 * S); bush(W * 0.965, H * 0.965, 64 * S); bush(W * 0.86, H * 0.995, 40 * S); }
  [[W * (ph ? 0.12 : 0.1), H * 0.995, -60, 1], [W * (ph ? 0.2 : 0.16), H * 1.0, -100, -1], [W * (ph ? 0.88 : 0.9), H * 0.995, -125, -1], [W * (ph ? 0.8 : 0.82), H * 1.0, -80, 1], [lanR[0] + 30 * S, lanR[1] + 6, -40, 1], [lanL[0] - 26 * S, lanL[1] + 6, -140, -1]].forEach(function (q) { n1_fern(fern, 'c', q[0], q[1], (ph ? 40 : 66) * S * (ph ? 1.4 : 1), q[2], q[3]); });
  N.c += fern.c;
  [[W * (ph ? 0.1 : 0.12), H * 0.985], [W * (ph ? 0.9 : 0.88), H * 0.985], [lanL[0] + 30 * S, lanL[1] + 8], [lanR[0] - 34 * S, lanR[1] + 10]].forEach(function (q) { for (var m = 0; m < 14; m++) { var a = -Math.PI * (0.1 + rnd() * 0.8), d = (10 + rnd() * 26) * S * (ph ? 1.3 : 1), x = q[0] + Math.cos(a) * d * 1.4, y = q[1] + Math.sin(a) * d; fl += 'M' + PT(x, y) + ' l0.1 0 '; } });
  // the maple canopy: a trunk up the left edge with a long limb along the top, and a branch reaching in from the right
  var lt = ph ? [W * 0.0, H * 0.13] : [W * 0.03, H * 0.1];
  N.e += n1_limb(W * (ph ? -0.04 : -0.01), H + 20, lt[0], lt[1], (ph ? 16 : 26) * S * (ph ? 1.5 : 1), (ph ? 9 : 14) * S * (ph ? 1.5 : 1), W * 0.02);
  var limbs = ph ? [[lt[0], lt[1] + H * 0.02, W * 0.5, H * 0.1, 8, 3, -14], [lt[0], lt[1] + H * 0.06, W * 0.3, H * 0.19, 6, 2, 8]] : [[lt[0], lt[1] + 10, W * 0.36, H * 0.03, 12, 4, -20], [lt[0], lt[1] + 60, W * 0.2, H * 0.2, 9, 3, 10], [W * 1.02, H * 0.05, W * 0.74, H * 0.11, 11, 4, -12], [W * 1.02, H * 0.22, W * 0.88, H * 0.26, 8, 3, 6]];
  if (ph) limbs.push([W * 1.03, H * 0.12, W * 0.72, H * 0.16, 7, 3, -8]);
  var hang = [];
  limbs.forEach(function (l, li) { N.e += n1_limb(l[0], l[1], l[2], l[3], l[4] * S * (ph ? 1.5 : 1), l[5] * S * (ph ? 1.5 : 1), l[6] * S);
    var n = ph ? 4 : 5; for (var m = 0; m <= n; m++) { var u = 0.25 + m / n * 0.8, x = l[0] + (l[2] - l[0]) * u, y = l[1] + (l[3] - l[1]) * u + Math.sin(Math.PI * u) * l[6] * S * 0.5;
      n1_clump(N, x, y + (m % 2 ? 10 : -8) * S, (ph ? 30 : 46) * S * (ph ? 1.3 : 1) * (0.8 + rnd() * 0.4), rnd, m % 2 ? 'g' : 'f', ['f', 'g', 'h', 'g', 'h'], 12); }
    if ((ph && li !== 1) || (!ph && li === 2)) hang.push([l[0] + (l[2] - l[0]) * 0.62, l[1] + (l[3] - l[1]) * 0.62 + 14 * S]); });
  // leaves already lying on the lawn and the rocks
  for (i = 0; i < (ph ? 10 : 18); i++) { var lx = W * rnd(), ly = H * (0.9 + rnd() * 0.1); if (Math.abs((lx - cx) / rx) < 1.1 && ly < cy + ry * 1.4) continue; N['fgh'[i % 3]] += n1_maple(lx, ly, (ph ? 5 : 7) * S * 1.3, rnd() * 360); }
  add(near, 'a', N.a, dk ? '#4C4C72' : '#9A928C'); add(near, 'b', N.b, dk ? '#5E5E88' : '#BCB4AC'); add(near, 'c', N.c, dk ? '#2F5E4A' : '#6AAE4E');
  add(near, 'd', N.d, dk ? '#5C5F8A' : '#A9A59E'); add(near, 'e', N.e, dk ? '#3A2630' : '#6E4430'); add(near, 'f', N.f, dk ? '#B23C4C' : '#E4463A');
  add(near, 'g', N.g, dk ? '#CC6840' : '#F5883A'); add(near, 'h', N.h, dk ? '#E0AC44' : '#F7C445'); stk(near, 't', fl, dk ? '#E890C0' : '#FF7FB0', (ph ? 4.5 : 6) * S * 1.2);
  if (ANIM) {
    ANIM.pool = {cx: cx, cy: cy, rx: rx, ry: ry}; ANIM.sp = sp; ANIM.lan = lan; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ground = gy0; ANIM.hang = hang;
    ANIM.house = {wins: wins, bw: bw, eave: [[L0 - ov * 0.2, by - wh + 2], [R0 + ov * 0.2, by - wh + 2]]};
    ANIM.canopy = limbs.map(function (l) { return [Math.min(l[0], l[2]), Math.max(l[0], l[2]), (l[1] + l[3]) / 2]; });
  } else {
    // still picture: the tube at rest, yuzu and leaves on the water and a few soft wisps of steam
    var tl = -sp.L * 0.4, tr = sp.L * 0.6, TP = function (lx, ly) { return [sp.px + lx * c0 - ly * s0, sp.py + lx * s0 + ly * c0]; };
    add(mid, 'e', n1_P([TP(tl, -sp.w / 2), TP(tr, -sp.w / 2), TP(tr - sp.w * 0.5, sp.w / 2), TP(tl, sp.w / 2)]));
    var y1 = '', lf = '', lf2 = ''; [[0.25, 0.1], [-0.3, 0.35], [0.55, -0.2]].forEach(function (q) { y1 += n1_C(cx + q[0] * rx, cy + q[1] * ry, (ph ? 7 : 11) * S * 1.2); });
    [[0.05, -0.3], [-0.55, 0.0], [0.4, 0.45], [0.7, 0.15], [-0.15, 0.5]].forEach(function (q, m) { var d = n1_P(n1_maplePts(0, 0, (ph ? 6 : 9) * S * 1.3, rnd() * 360).map(function (p) { return [cx + q[0] * rx + p[0], cy + q[1] * ry + p[1] * 0.55]; })); if (m % 2) lf += d; else lf2 += d; });
    add(near, 'h', y1); add(near, 'f', lf); add(near, 'g', lf2);
    var steamStill = ''; for (i = 0; i < (ph ? 4 : 7); i++) { var wx = cx - rx * 0.62 + i * rx * 1.24 / (ph ? 3 : 6) + (rnd() - 0.5) * 20 * S, wy = cy - ry * (0.1 + rnd() * 0.3), wl = (34 + rnd() * 20) * S; steamStill += 'M' + PT(wx, wy) + ' c' + n1(-10 * S) + ' ' + n1(-wl * 0.3) + ' ' + n1(10 * S) + ' ' + n1(-wl * 0.6) + ' ' + n1(2 * S) + ' ' + n1(-wl) + ' '; }
    stk(near, 's', steamStill, dk ? 'rgba(220,220,255,0.14)' : 'rgba(255,255,255,0.45)', 16 * S);
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

// =============== 3. Tide Pools: a rocky shore at low tide below a lighthouse headland and sea stacks, with pools of every shape and
// depth full of life: anemones, sea stars, urchins, snails, shells, kelp, little fish, mussels and barnacles
// an irregular closed outline around an ellipse
function n1_blob(cx, cy, rx, ry, rnd, n, k) { var p = []; n = n || 14; k = k || 0.12; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, r = 1 + (rnd() - 0.5) * k * 2; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return n1_smooth(p, 3); }
function n1_star5(x, y, R, r, ang) { var p = []; for (var i = 0; i < 10; i++) { var a = ang + i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r : R; p.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return n1_P(n1_smooth(p, 2)); }
// a sea urchin: a round body and a ring of spines (seen slightly from above)
function n1_urchin(x, y, r) { var d = n1_E(x, y, r, r * 0.8); for (var j = 0; j < 18; j++) { var b = j / 18 * 6.283; d += n1_P([[x + Math.cos(b - 0.1) * r * 0.85, y + Math.sin(b - 0.1) * r * 0.68], [x + Math.cos(b) * r * 1.65, y + Math.sin(b) * r * 1.3], [x + Math.cos(b + 0.1) * r * 0.85, y + Math.sin(b + 0.1) * r * 0.68]]); } return d; }
// a turban snail shell (body colour) and its lighter whorl
function n1_snail(x, y, r, dir) { return {b: n1_P([[x - r * 1.0 * dir, y + r * 0.35], [x - r * 0.9 * dir, y - r * 0.35], [x - r * 0.2 * dir, y - r * 1.15], [x + r * 0.5 * dir, y - r * 0.6], [x + r * 1.0 * dir, y + r * 0.1], [x + r * 0.9 * dir, y + r * 0.4]]), w: n1_E(x + r * 0.05 * dir, y - r * 0.15, r * 0.5, r * 0.32) + n1_E(x - r * 0.25 * dir, y - r * 0.65, r * 0.22, r * 0.14)}; }
// a fan (scallop) shell, hinge at the bottom
function n1_fan(x, y, r, ang) { var p = [[0, 0]]; for (var i = 0; i <= 10; i++) { var a = Math.PI * (1.15 + 0.7 * i / 10); p.push([Math.cos(a) * r * (i % 2 ? 0.94 : 1), Math.sin(a) * r * (i % 2 ? 0.94 : 1)]); } return n1_P(rotp(p, x, y, ang)); }
SCENES.tidepool = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(1.2), refl = Lay(0.5), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, j;
  var hz = H * (ph ? 0.4 : 0.33), p1 = Math.round(hz / H * 100);
  var sky = dk ? 'linear-gradient(180deg,#0D1636 0%,#1C2A5C ' + Math.round(p1 * 0.6) + '%,#4A4A80 ' + p1 + '%,#4A4A80 100%)' : 'linear-gradient(180deg,#5CB4EA 0%,#A2D8F4 ' + Math.round(p1 * 0.6) + '%,#FCE8D2 ' + p1 + '%,#FCE8D2 100%)';
  var sea = dk ? 'linear-gradient(180deg,#34507E 0%,#1E3A64 25%,#14294A 100%)' : 'linear-gradient(180deg,#8ED8E4 0%,#45B0D2 25%,#2C8EBC 100%)';
  // sun or moon, clouds or stars
  var sx = W * (ph ? 0.72 : 0.45), sy = H * (ph ? 0.17 : 0.1), sr = ph ? 20 : 28;
  if (dk) { add(far, 'a', n1_C(sx, sy, sr * 2.4), 'rgba(210,225,255,0.13)'); add(far, 'b', n1_C(sx, sy, sr), '#F6F2DE');
    var st = ''; spread(0, 0, W, hz - 10, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - sx, c.y - sy) > sr * 2) st += n1_C(c.x, c.y, 0.5 + c.r * 1.2); }); add(far, 'c', st, 'rgba(255,250,236,0.9)'); }
  else { add(far, 'a', n1_C(sx, sy, sr * 2), 'rgba(255,250,226,0.5)'); add(far, 'b', n1_C(sx, sy, sr), 'rgba(255,253,240,1)');
    var cl = '', cs = ''; spread(0, H * 0.03, W, hz * 0.62, ph ? 170 : 300, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.6 && Math.hypot(c.x - sx, c.y - sy) > 100 && Math.abs(c.x - W * (ph ? 0.15 : 0.1)) > W * (ph ? 0.3 : 0.12)) { var s = (0.7 + c.r * 0.6) * (ph ? 0.8 : 1); cl += n1_E(c.x, c.y, 60 * s, 13 * s) + n1_C(c.x - 20 * s, c.y - 9 * s, 19 * s) + n1_C(c.x + 14 * s, c.y - 14 * s, 24 * s) + n1_C(c.x + 38 * s, c.y - 2 * s, 14 * s); cs += n1_E(c.x + 4 * s, c.y + 4 * s, 62 * s, 12 * s); } });
    add(far, 'c', cs, 'rgba(176,206,236,0.8)'); add(far, 'd', cl, '#FFFFFF'); }
  // a hazy island on the horizon
  add(far, 'e', n1_P(n1_fn(W * 0.36, W * 0.62, 6, function (x) { var u = (x - W * 0.36) / (W * 0.26); return hz + 2 - H * 0.022 * Math.pow(Math.sin(Math.PI * u), 0.7) - H * 0.008 * Math.sin(u * 11); }).concat([[W * 0.62, hz + 3], [W * 0.36, hz + 3]])), dk ? '#2E3C6C' : '#9EC0D8');
  // the headland (left) with its lighthouse and keeper's cottage
  var hx1 = W * (ph ? 0.46 : 0.27), hTop = H * (ph ? 0.29 : 0.205);
  var topY = function (x) { var u = (x + 60) / (hx1 + 60); return u < 0.72 ? hTop + Math.sin(x / 50) * 2 + u * H * 0.02 : hTop + 0.72 * H * 0.02 + Math.pow((u - 0.72) / 0.28, 1.6) * (hz - hTop + 4); };
  var head = n1_fn(-60, hx1, 5, topY);
  add(refl, 'a', n1_P(head.concat([[hx1, hz + 6], [-60, hz + 6]])), dk ? '#5C4A72' : '#E2A878');
  var face = n1_P(n1_fn(hx1 - (hx1 + 60) * 0.3, hx1, 5, topY).concat([[hx1, hz + 6], [hx1 - (hx1 + 60) * 0.34, hz + 6]]));
  var strata = ''; [0.35, 0.6, 0.82].forEach(function (f, m) { var y0 = hTop + (hz - hTop) * f; strata += n1_P(n1_fn(-60, hx1, 10, function (x) { return Math.max(topY(x) + 4, y0 + Math.sin(x / 40 + m) * 3); }).concat(n1_fn(-60, hx1, 10, function (x) { return Math.max(topY(x) + 4, y0 + 4 + m + Math.sin(x / 33 + m) * 2); }).reverse())); });
  add(refl, 'b', face + strata, dk ? '#4A3C62' : '#C88760');
  var grass = n1_P(n1_fn(-60, hx1 - (hx1 + 60) * 0.12, 5, function (x) { return topY(x) - 2; }).concat(n1_fn(-60, hx1 - (hx1 + 60) * 0.12, 5, function (x) { return topY(x) + H * 0.016 + Math.abs(Math.sin(x / 13)) * H * 0.008; }).reverse()));
  // the lighthouse: a white tower with red bands, a gallery, a glass lantern room and a red cap
  var lx = W * (ph ? 0.15 : 0.1), lb = topY(lx) + 3, lhH = H * (ph ? 0.125 : 0.155), w0 = lhH * 0.11, w1 = lhH * 0.075, ly = lb - lhH;
  var tw = function (y) { return w0 + (w1 - w0) * (lb - y) / lhH; };
  var white = n1_P([[lx - w0, lb], [lx - w1, ly], [lx + w1, ly], [lx + w0, lb]]), red = '';
  [0.18, 0.55].forEach(function (f) { var ya = lb - lhH * f, yb = ya - lhH * 0.17; red += n1_P([[lx - tw(ya), ya], [lx - tw(yb), yb], [lx + tw(yb), yb], [lx + tw(ya), ya]]); });
  red += rect(lx - w1 * 1.55, ly - lhH * 0.03, w1 * 3.1, lhH * 0.035) + n1_P([[lx - w1 * 1.25, ly - lhH * 0.2], [lx, ly - lhH * 0.3], [lx + w1 * 1.25, ly - lhH * 0.2]]) + n1_C(lx, ly - lhH * 0.31, lhH * 0.018) + rrect(lx - w0 * 0.35, lb - lhH * 0.1, w0 * 0.7, lhH * 0.1, w0 * 0.3);
  var glass = rect(lx - w1 * 0.9, ly - lhH * 0.2, w1 * 1.8, lhH * 0.17), lines = seg(lx - w1 * 1.55, ly - lhH * 0.095, lx + w1 * 1.55, ly - lhH * 0.095) + seg(lx, ly - lhH * 0.2, lx, ly - lhH * 0.03) + seg(lx - w1 * 1.5, ly - lhH * 0.03, lx - w1 * 1.5, ly - lhH * 0.1) + seg(lx + w1 * 1.5, ly - lhH * 0.03, lx + w1 * 1.5, ly - lhH * 0.1);
  white += rect(lx - w1 * 1.05, ly - lhH * 0.205, w1 * 2.1, lhH * 0.012);
  [0.4, 0.75].forEach(function (f) { var y = lb - lhH * f; lines += seg(lx - w1 * 0.25, y, lx - w1 * 0.25, y + lhH * 0.05) + seg(lx + w1 * 0.25, y, lx + w1 * 0.25, y + lhH * 0.05); });
  // the keeper's cottage beside it
  var kx = lx + w0 * (ph ? 4.2 : 4.6), kw = lhH * 0.36, kh = lhH * 0.2, kb = topY(kx) + 4;
  white += rect(kx - kw / 2, kb - kh, kw, kh) + rect(kx + kw * 0.22, kb - kh - kh * 0.95, kw * 0.1, kh * 0.4);
  red += n1_P([[kx - kw * 0.62, kb - kh + 1], [kx - kw * 0.3, kb - kh * 1.75], [kx + kw * 0.3, kb - kh * 1.75], [kx + kw * 0.62, kb - kh + 1]]) + rect(kx - kw * 0.06, kb - kh * 0.6, kw * 0.12, kh * 0.6);
  glass += rect(kx - kw * 0.36, kb - kh * 0.7, kw * 0.16, kh * 0.32) + rect(kx + kw * 0.2, kb - kh * 0.7, kw * 0.16, kh * 0.32);
  var fence = ''; for (var fx = kx + kw * 0.7; fx < kx + kw * 2.2 && fx < hx1 - (hx1 + 60) * 0.3; fx += kw * 0.18) fence += seg(fx, topY(fx) + 2, fx, topY(fx) - kh * 0.45); fence += 'M' + PT(kx + kw * 0.7, topY(kx + kw * 0.7) - kh * 0.3) + ' L' + PT(Math.min(kx + kw * 2.2, hx1 - (hx1 + 60) * 0.3), topY(Math.min(kx + kw * 2.2, hx1 - (hx1 + 60) * 0.3)) - kh * 0.3) + ' ';
  // sea stacks (right): one with an arch, green tops, foam where the sea meets them
  var stacks = '', stSh = '', tops = '', foam = '', fb = [];
  (ph ? [[0.72, 0.15, 0.12, 1], [0.92, 0.2, 0.07, 0], [1.02, 0.09, 0.06, 0]] : [[0.68, 0.14, 0.075, 1], [0.8, 0.205, 0.04, 0], [0.88, 0.1, 0.03, 0], [0.95, 0.15, 0.04, 0]]).forEach(function (q, m) {
    var x = W * q[0], h = H * q[1], w = W * q[2], b = hz + H * 0.03, pts = [[x - w, b], [x - w * 0.9, b - h * 0.55], [x - w * 0.7, b - h * 0.9], [x - w * 0.3, b - h], [x + w * 0.35, b - h * 0.97], [x + w * 0.75, b - h * 0.8], [x + w * 0.88, b - h * 0.45], [x + w, b]];
    stacks += n1_P(pts); stSh += n1_P([[x + w * (q[3] ? 0.45 : 0.15), b], [x + w * 0.3, b - h * 0.97], [x + w * 0.35, b - h * 0.97], [x + w * 0.75, b - h * 0.8], [x + w * 0.88, b - h * 0.45], [x + w, b]]);
    tops += n1_P([[x - w * 0.82, b - h * 0.86], [x - w * 0.6, b - h * 1.0], [x - w * 0.3, b - h * 1.06], [x + w * 0.35, b - h * 1.03], [x + w * 0.7, b - h * 0.86], [x + w * 0.3, b - h * 0.9], [x - w * 0.2, b - h * 0.93]]);
    if (q[3]) { var hp = []; for (j = 0; j <= 12; j++) { var a = Math.PI * (1 + j / 12); hp.push([x + Math.cos(a) * w * 0.42, b + 2 + Math.sin(a) * h * 0.42]); } stacks += n1_hole(hp); }
    foam += 'M' + PT(x - w * 1.15, b + 1) + ' q' + n1(w * 0.3) + ' ' + n1(-4) + ' ' + n1(w * 0.6) + ' 0 t' + n1(w * 0.6) + ' 0 t' + n1(w * 0.6) + ' 0 t' + n1(w * 0.6) + ' 0 '; fb.push([x - w, x + w, b]); });
  add(refl, 'c', grass + tops, dk ? '#2E5E50' : '#7DCB60'); add(refl, 'd', stacks, dk ? '#4E4A72' : '#BC9A84'); add(refl, 'e', stSh, dk ? 'rgba(14,16,40,0.35)' : 'rgba(110,70,60,0.24)');
  add(refl, 'f', white, dk ? '#CACCEA' : '#FFFFFF'); add(refl, 'g', red, dk ? '#B83C4E' : '#E5443C'); add(refl, 'h', glass, dk ? '#FFE28A' : '#FFF0B8');
  stk(refl, 's', lines + fence, dk ? '#2A2440' : '#6A4A40', ph ? 1 : 1.4); stk(refl, 't', foam, dk ? 'rgba(200,220,255,0.7)' : 'rgba(255,255,255,0.95)', ph ? 2.2 : 3.2);
  // sea glitter under the sun or moon
  var gl = ''; for (i = 0; i < 18; i++) { var gy = hz + 5 + i * i * 0.35 * (ph ? 0.6 : 1), gw = 6 + i * 2.2; if (gy > hz + H * 0.09) break; gl += n1_E(sx + (rnd() - 0.5) * gw * 2, gy, gw * (0.4 + rnd() * 0.6), 1.3); }
  add(far, 'f', gl, dk ? 'rgba(240,240,220,0.45)' : 'rgba(255,255,240,0.8)');
  // ---- the rock shelf: a back ridge of boulders, then a broad shelf with rocks of several tones, weed and pink coralline crust
  var shelfY = H * (ph ? 0.5 : 0.43), shelf = n1_fn(-60, W + 60, 10, function (x) { return shelfY + Math.sin(x / 90 + 0.6) * 10 + Math.sin(x / 37) * 4; });
  add(mid, 'a', below(shelf, H + 20), dk ? '#30324E' : '#86766C');
  var rocks = '', rockHi = '', shad = '', alg = '', pink = '', rmask = '';
  function rock(x, y, rx, ry) { var rp = n1_P(n1_blob(x, y, rx, ry, rnd, 10, 0.16)); rocks += rp; if (y - ry < shelfY + H * 0.1) rmask += rp; shad += n1_P(n1_blob(x + rx * 0.08, y + ry * 0.35, rx * 1.02, ry * 0.85, rnd, 10, 0.1)); rockHi += n1_P(n1_blob(x - rx * 0.12, y - ry * 0.34, rx * 0.66, ry * 0.4, rnd, 8, 0.12));
    var q = rnd(); if (q < 0.42) alg += n1_P(n1_blob(x + rx * (rnd() - 0.5) * 0.8, y + ry * 0.15, rx * (0.25 + rnd() * 0.3), ry * 0.28, rnd, 8, 0.3)); else if (q < 0.7) pink += n1_P(n1_blob(x + rx * (rnd() - 0.5) * 0.7, y + ry * 0.2, rx * (0.2 + rnd() * 0.2), ry * 0.22, rnd, 8, 0.3)); }
  spread(-40, shelfY - H * 0.02, W + 80, H * 0.09, ph ? 70 : 110, 40, rnd, 1).forEach(function (c) { var rx = (ph ? 40 : 66) * (0.7 + c.r * 0.6); rock(c.x, c.y, rx, rx * (0.45 + c.k * 0.2)); });
  spread(-40, shelfY + H * 0.06, W + 80, H * 0.48, ph ? 80 : 130, ph ? 60 : 78, rnd, 1).forEach(function (c) { if (c.q < 0.85) { var rx = (ph ? 46 : 80) * (0.7 + c.r * 0.6); rock(c.x, c.y, rx, rx * (0.36 + c.k * 0.12)); } });
  add(mid, 'b', shad, dk ? 'rgba(14,16,36,0.45)' : 'rgba(70,46,50,0.28)'); add(mid, 'c', rocks, dk ? '#43476A' : '#A48E80'); add(mid, 'd', rockHi, dk ? '#555B80' : '#C2AE9C');
  add(mid, 'e', alg, dk ? '#2E6A50' : '#74C25A'); add(mid, 'f', pink, dk ? '#8A5682' : '#F49AB4');
  // ---- the pools: each its own shape, depth and floor (deep teal, sandy, pink coralline, green seagrass)
  var pools = ph ? [[0.45, 0.865, 0.42, 0.062, 'deep'], [0.74, 0.705, 0.22, 0.038, 'sand'], [0.2, 0.735, 0.16, 0.034, 'pink'], [0.32, 0.6, 0.15, 0.026, 'grass'], [0.83, 0.585, 0.11, 0.02, 'deep']]
    : [[0.37, 0.87, 0.2, 0.085, 'deep'], [0.77, 0.865, 0.135, 0.06, 'sand'], [0.09, 0.825, 0.075, 0.042, 'pink'], [0.58, 0.72, 0.08, 0.032, 'grass'], [0.9, 0.67, 0.06, 0.026, 'pink'], [0.22, 0.65, 0.07, 0.028, 'sand']];
  var basin = '', pw = '', rimF = '', rimHi = '', P = [];
  var FLOOR = {deep: dk ? '#1E4A66' : '#3E9EB4', sand: dk ? '#6E6A7E' : '#F2DBAA', pink: dk ? '#6E4A78' : '#F4A8BC', grass: dk ? '#2E5A5A' : '#8CCB96'};
  var under = {}, over = {};   // floor art and the creatures over the water, by colour
  function put(o, c, d) { o[c] = (o[c] || '') + d; }
  pools.forEach(function (q, k) { var cx = W * q[0], cy = H * q[1], rx = W * q[2], ry = H * q[3], ty = q[4], out = n1_blob(cx, cy, rx, ry, rnd, 14, 0.07);
    P.push({cx: cx, cy: cy, rx: rx, ry: ry, ty: ty, out: out});
    basin += n1_P(n1_blob(cx, cy - ry * 0.06, rx * 1.1, ry * 1.3, rnd, 12, 0.05)); pw += n1_P(out);
    put(under, FLOOR[ty], n1_P(out));
    var s = (ph ? 0.75 : 1.1) * S, m, a, rr, x, y;
    function inP(f) { a = rnd() * 6.283; rr = Math.sqrt(rnd()) * f; x = cx + Math.cos(a) * rx * rr; y = cy + Math.sin(a) * ry * rr; }
    var PEB = dk ? ['#5A5878', '#4A5A70', '#6A5E74'] : ['#D8C8B4', '#A9C0CC', '#E8D6C0', '#C4AEC4'];
    for (m = 0; m < Math.round(rx / (ty === 'sand' ? 6 : 10)); m++) { inP(0.86); put(under, PEB[m % PEB.length], n1_E(x, y, (2 + rnd() * 4) * s, (1.2 + rnd() * 2) * s)); }
    if (ty === 'pink') for (m = 0; m < 6; m++) { inP(0.75); put(under, dk ? '#9A5E92' : '#FF86A8', n1_P(n1_blob(x, y, (8 + rnd() * 8) * s, (3 + rnd() * 3) * s, rnd, 8, 0.35))); }
    if (ty === 'grass') for (m = 0; m < Math.round(rx / 5); m++) { inP(0.8); put(under, dk ? '#3E7A5A' : '#4FB070', n1_leaf(x, y + 3 * s, (10 + rnd() * 8) * s, 1.6 * s, -90 + (rnd() - 0.5) * 50, 0.1)); }
    if (ty === 'sand') for (m = 0; m < 3; m++) { inP(0.6); put(under, dk ? '#B4A8C0' : '#FFF4E4', n1_E(x, y, 6 * s, 3.4 * s)); put(under, dk ? '#8A7E98' : '#E8D4B8', n1_star5(x, y, 3 * s, 1.6 * s, 0)); }
    // creatures on the floor, seen through clear water
    var STAR = dk ? ['#E07848', '#9A6AD0', '#E05A84', '#4A8AD8', '#E0A040'] : ['#FF7A3A', '#B565E0', '#FF5E8A', '#3E90EA', '#FFB43A'];
    var ns = ty === 'deep' ? (ph ? 3 : 4) : 2;
    for (m = 0; m < ns && rx > 30; m++) { inP(0.7); var R = (ph ? 8 : 12) * S * (0.6 + rnd() * 0.7); put(over, STAR[Math.floor(rnd() * STAR.length)], n1_star5(x, y, R, R * 0.42, rnd())); }
    if (ty === 'pink' || ty === 'deep') for (m = 0; m < (ty === 'pink' ? 2 : 1); m++) { inP(0.6); put(over, dk ? '#6A44A8' : '#7A4AC8', n1_urchin(x, y, (ph ? 5 : 8) * S * (0.8 + rnd() * 0.5))); put(over, dk ? '#8A6AC8' : '#A47AE8', n1_E(x - 1.5 * S, y - 2 * S, (ph ? 2 : 3) * S, (ph ? 1.4 : 2) * S)); }
    if (ty === 'sand') for (m = 0; m < 3; m++) { inP(0.7); var fan = n1_fan(x, y, (ph ? 5 : 8) * S * (0.8 + rnd() * 0.4), (rnd() - 0.5) * 60); put(over, ['#FFC6C0', '#FFE2B8', '#F7B0D0'][m], fan); }
    if (ty !== 'deep' || k === 0) { inP(0.6); var sn = n1_snail(x, y, (ph ? 5 : 7) * S, rnd() < 0.5 ? 1 : -1); put(over, dk ? '#8A6450' : '#C8804E', sn.b); put(over, dk ? '#B48E78' : '#F2C49A', sn.w); }
    // the near lip of the pool, in front of the water
    var inner = [], outer = []; for (j = 0; j <= 16; j++) { var t = j / 16 * Math.PI; inner.push([cx + Math.cos(t) * rx * 1.0, cy + Math.sin(t) * ry * 0.92]); outer.unshift([cx + Math.cos(t) * rx * 1.08, cy + Math.sin(t) * ry * 1.25 + 4 + Math.sin(j * 1.7) * 2]); }
    rimF += n1_P(inner.concat(outer)); rimHi += n1_P(inner.slice(2, 15).map(function (p) { return [p[0], p[1] + 1]; }).concat(inner.slice(2, 15).reverse().map(function (p, m2) { return [p[0], p[1] + 3.5 + Math.sin(m2) * 1]; }))); });
  add(mid, 'g', basin, dk ? '#23253F' : '#5E4C50'); add(mid, 'h', pw, dk ? '#2C5C84' : '#5CC4D2');
  // sea life out on the rocks: stars, snails and limpets (drawn by the engine, or in the still picture below)
  var STAR2 = dk ? ['#E07848', '#9A6AD0', '#E05A84'] : ['#FF7A3A', '#B565E0', '#FF5E8A'], onRock = {};
  spread(0, shelfY + H * 0.05, W, H * 0.5, ph ? 120 : 200, ph ? 70 : 90, rnd, 1).forEach(function (c, m) { var inPool = P.some(function (p) { return Math.pow((c.x - p.cx) / (p.rx * 1.25), 2) + Math.pow((c.y - p.cy) / (p.ry * 1.6), 2) < 1; }); if (inPool) return;
    if (c.q < 0.3) { var R = (ph ? 7 : 11) * S * (0.7 + c.r * 0.6); put(onRock, STAR2[m % 3], n1_star5(c.x, c.y, R, R * 0.4, c.k)); }
    else if (c.q < 0.5) { var sn = n1_snail(c.x, c.y, (ph ? 4.5 : 6.5) * S, c.k < 0.5 ? 1 : -1); put(onRock, dk ? '#6E5A78' : '#5E6E8A', sn.b); put(onRock, dk ? '#9A8AAE' : '#9CB0C8', sn.w); }
    else if (c.q < 0.65) { var lr = (ph ? 4 : 6) * S; put(onRock, dk ? '#A8A4BC' : '#EDE2CC', n1_P([[c.x - lr, c.y], [c.x - lr * 0.3, c.y - lr * 0.8], [c.x + lr * 0.3, c.y - lr * 0.8], [c.x + lr, c.y]])); } });
  // the lips of the pools, barnacles, mussels and rockweed
  add(near, 'a', rimF, dk ? '#3A3E5C' : '#8C7A70'); add(near, 'b', rimHi, dk ? '#565C80' : '#B8A494');
  var barn = '', barnD = '', mus = '', weed = '', shells = '';
  function barnacles(x, y, n, s) { for (var m = 0; m < n; m++) { var bx = x + (rnd() - 0.5) * 30 * s, by = y + (rnd() - 0.5) * 10 * s, br = (2 + rnd() * 2.2) * s; barn += n1_P([[bx - br, by + br * 0.5], [bx - br * 0.5, by - br * 0.6], [bx + br * 0.5, by - br * 0.6], [bx + br, by + br * 0.5]]); barnD += n1_E(bx, by - br * 0.45, br * 0.32, br * 0.18); } }
  function mussels(x, y, n, s) { for (var m = 0; m < n; m++) mus += n1_RE(x + (m - n / 2) * 6 * s + rnd() * 3, y + rnd() * 4 * s, 6 * s, 2.8 * s, -60 + rnd() * 50); }
  function rockweed(x, y, s, dir) { for (var m = 0; m < 6; m++) weed += n1_leaf(x + m * 3 * s * dir, y, (14 + rnd() * 10) * s, 3 * s, -90 + dir * (30 + m * 14) + (rnd() - 0.5) * 20); }
  P.forEach(function (p, k) { var s = (ph ? 0.8 : 1.2) * S; barnacles(p.cx - p.rx * 0.7, p.cy + p.ry * 1.05, 8, s); barnacles(p.cx + p.rx * 0.5, p.cy + p.ry * 1.1, 6, s); mussels(p.cx + p.rx * 0.95, p.cy + p.ry * 0.5, 5, s); mussels(p.cx - p.rx * 0.2, p.cy + p.ry * 1.15, 4, s); rockweed(p.cx - p.rx * 1.05, p.cy + p.ry * 0.6, s, 1); if (k < 2) rockweed(p.cx + p.rx * 0.2, p.cy + p.ry * 1.15, s * 0.8, -1); });
  spread(0, shelfY + H * 0.04, W, H * 0.12, ph ? 90 : 140, 40, rnd, 1).forEach(function (c) { if (c.q < 0.45) barnacles(c.x, c.y, 5, (ph ? 0.7 : 1) * S); else if (c.q < 0.75) mussels(c.x, c.y, 4, (ph ? 0.7 : 1) * S); });
  [[0.05, 0.96], [0.6, 0.975], [0.96, 0.95], [0.27, 0.8]].forEach(function (q) { var x = W * q[0], y = H * q[1], s = (ph ? 0.8 : 1.2) * S; shells += n1_fan(x, y + 4 * s, 9 * s, (q[0] - 0.5) * 40); });
  add(near, 'c', barn + shells, dk ? '#A8AAC4' : '#F2EADC'); add(near, 'd', mus, dk ? '#22264A' : '#2E3A60'); add(near, 'e', weed, dk ? '#4E6A3A' : '#9AA43A');
  add(near, 'f', barnD, dk ? '#2A2E4E' : '#7A6A74');
  // anemones and kelp (drawn by the engine, or still here)
  var anem = [], kelp = [];
  P.forEach(function (p, k) { var n = p.ty === 'sand' ? 0 : p.ty === 'deep' ? (k === 0 ? (ph ? 4 : 5) : 1) : p.rx > 60 ? 3 : 2, m; for (m = 0; m < n; m++) { var a = (m + 0.5) / n * Math.PI * 2 + rnd() * 0.5, rr = n === 1 ? 0 : 0.35 + rnd() * 0.3; var ar = Math.min((ph ? 18 : 30) * S * (k ? 0.8 : 1) * (0.8 + rnd() * 0.4), p.ry * 1.05); anem.push({x: p.cx + Math.cos(a) * p.rx * rr * 0.9, y: p.cy + Math.sin(a) * p.ry * rr * 0.6 + p.ry * 0.12, r: ar, c: (k + m) % 4, pool: k}); }
    if (p.ty === 'deep' || p.ty === 'grass') for (m = 0; m < (k === 0 ? 3 : 2); m++) kelp.push({x: p.cx + p.rx * (-0.2 + m * 0.3) + rnd() * 10, y: p.cy + p.ry * 0.3, L: (ph ? 30 : 46) * S * (k ? 0.7 : 1) * (0.8 + rnd() * 0.4), pool: k, ph: rnd() * 6.28}); });
  anem.sort(function (a, b) { return a.y - b.y; });
  var toList = function (o) { return Object.keys(o).map(function (c) { return [o[c], c]; }); };
  if (ANIM) { ANIM.under = toList(under); ANIM.over = toList(over).concat(toList(onRock)); ANIM.rmask = rmask; ANIM.pools = P.map(function (p) { return {cx: p.cx, cy: p.cy, rx: p.rx, ry: p.ry, ty: p.ty, d: n1_P(p.out)}; }); ANIM.anem = anem; ANIM.kelp = kelp; ANIM.shelf = shelfY; ANIM.hz = hz; ANIM.S = S * (ph ? 0.9 : 1); ANIM.sun = [sx, sy];
    ANIM.crab = {x0: W * (ph ? 0.55 : 0.6), x1: W * (ph ? 0.92 : 0.96), y: H * (ph ? 0.96 : 0.955)}; ANIM.lh = {x: lx, y: ly - lhH * 0.115, s: lhH / 120}; ANIM.foam = fb; ANIM.fg = n1_P(head.concat([[hx1, hz + 6], [-60, hz + 6]])) + stacks; ANIM.boat = {y: hz + 2, s: (ph ? 0.7 : 1) * S}; }
  else {
    // the still picture has few slots: floors as the water colour, the stars orange and purple
    var orange = '', purple = ''; toList(over).concat(toList(onRock)).forEach(function (q, m) { if (/^#(FF7A|E078|FFB4|E0A0|FF5E|E05A)/.test(q[1])) orange += q[0]; else purple += q[0]; });
    add(near, 'g', orange, dk ? '#E07848' : '#FF7A3A'); add(near, 'h', purple, dk ? '#9A6AD0' : '#9E62CC');
    var ad = '', at = ''; anem.forEach(function (q) { ad += n1_E(q.x, q.y, q.r * 0.3, q.r * 0.2); for (var m = 0; m < 12; m++) { var b = m / 12 * 6.283; at += seg(q.x, q.y, q.x + Math.cos(b) * q.r, q.y + Math.sin(b) * q.r * 0.6); } }); stk(near, 't', at, dk ? '#E07AB0' : '#FF8AB8', 3 * S); add(near, 'h', ad); }
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
