// Batch n5 scenes: pride (Pride Parade), graduation (Graduation Day), birthday (Birthday Bash), geology (Crystal Cave), languages (Postcard Plaza)
// Shared helpers for the n5 scenes. The engines (engines_n5.js) use them too.
var n5_RAINBOW = ['#E8505B', '#F59E42', '#F7D046', '#5DBB63', '#4A90D9', '#8E5CC7'];
var n5_RAINBOW_D = ['#FF6B76', '#FFAE5A', '#FFE066', '#72D67A', '#62A8F2', '#B07CF0'];
function n5_win(x, y, w, h, arch) { return arch ? 'M' + PT(x, y + h) + ' v' + n1(-(h - w / 2)) + ' a' + n1(w / 2) + ' ' + n1(w / 2) + ' 0 0 1 ' + n1(w) + ' 0 v' + n1(h - w / 2) + ' Z ' : rect(x, y, w, h); }
function n5_tri(x, y, w, h) { return poly([[x - w / 2, y], [x + w / 2, y], [x, y + h]]); }
// a sagging rope between two points as a list of points
function n5_sag(x0, y0, x1, y1, sag, n) { var p = []; for (var i = 0; i <= n; i++) { var u = i / n; p.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)]); } return p; }
function n5_cloud(x, y, s) { return m5_circW(x - 26 * s, y, 18 * s) + m5_circW(x, y - 12 * s, 26 * s) + m5_circW(x + 28 * s, y - 2 * s, 20 * s) + m5_circW(x + 50 * s, y + 4 * s, 13 * s) + rect(x - 44 * s, y, 107 * s, 16 * s); }
function n5_round(x, y, w, h, r) { return rrect(x, y, w, h, r); }
function n5_tree(x, y, s) { return m5_circW(x, y - 44 * s, 22 * s) + m5_circW(x - 16 * s, y - 32 * s, 17 * s) + m5_circW(x + 17 * s, y - 31 * s, 18 * s) + m5_circW(x, y - 24 * s, 18 * s); }

// 1. Pride Parade: a street of colorful townhouses hung with rainbow flags and bunting, a rainbow crosswalk in front.
SCENES.pride = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(3), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#1E1A3E 0%,#3A2560 52%,#6A2E6A 100%)' : 'linear-gradient(180deg,#BDE3F7 0%,#FDF0F5 58%,#FFE9C2 100%)';
  var yb = H * (ph ? 0.8 : 0.79), yc = yb + H * (ph ? 0.035 : 0.04), yr = yc + 5, R = dk ? n5_RAINBOW_D : n5_RAINBOW;
  // far: a hazy skyline, clouds or the moon glow
  var sk1 = '', sk2 = '', x = -20;
  while (x < W + 20) { var w = 36 + rnd() * 60, h = H * (0.22 + rnd() * 0.26); if (rnd() < 0.3) h += H * 0.08; sk1 += rect(x, yb - h, w, h + 10); if (rnd() < 0.35) sk1 += rect(x + w * 0.4, yb - h - 18, 3, 18); if (rnd() < 0.25) sk1 += poly([[x, yb - h], [x + w / 2, yb - h - w * 0.4], [x + w, yb - h]]); x += w + 4 + rnd() * 10; }
  x = -10; while (x < W + 20) { var w2 = 44 + rnd() * 50, h2 = H * (0.16 + rnd() * 0.16); sk2 += rect(x, yb - h2, w2, h2 + 10); x += w2 + 2 + rnd() * 30; }
  add(far, 'a', sk1, dk ? '#3E2E6E' : '#D9D2F2'); add(far, 'b', sk2, dk ? '#4A3274' : '#E9D8EE');
  if (dk) add(far, 'c', circ(W * (ph ? 0.78 : 0.2), H * (ph ? 0.12 : 0.15), 70), 'rgba(255,220,240,0.10)');
  else { add(far, 'd', circ(W * (ph ? 0.82 : 0.9), H * (ph ? 0.08 : 0.1), 90), 'rgba(255,240,200,0.45)'); add(far, 'e', circ(W * (ph ? 0.82 : 0.9), H * (ph ? 0.08 : 0.1), 34), '#FFF4C8'); }
  if (!dk) { var cl = ''; (ph ? [[0.2, 0.12, 0.7], [0.75, 0.22, 0.55]] : [[0.12, 0.14, 1], [0.42, 0.08, 0.7], [0.7, 0.18, 0.9], [0.92, 0.1, 0.6]]).forEach(function (q) { cl += n5_cloud(W * q[0], H * q[1], q[2]); }); add(far, 'c', cl, 'rgba(255,255,255,0.85)'); }
  // the townhouses
  var FAC = dk ? ['#4D3B78', '#5A3A6E', '#3E4677', '#4E4470'] : ['#F7C6CF', '#FBE3A6', '#BFE3D0', '#C9C2EE'], ACC = dk ? '#2A2050' : '#FFFFFF';
  var fac = ['', '', '', ''], awS = '', shut = '', boxes = '', blooms = '', rails = '', trim = '', glass = '', doors = '', roofs = '', aw = '', wins = [], flags = [], tops = [];
  x = ph ? -30 : -24; var k = 0;
  while (x < W + 10) {
    var bw = (ph ? 96 : 108) + rnd() * (ph ? 30 : 46), fl = 4 + Math.floor(rnd() * 3) + (ph ? 1 : 0), fh = (ph ? 46 : 52), bh = fl * fh + 26, top = yb - bh, ci = k % 4;
    fac[ci] += rect(x, top, bw, bh + 4);
    // cornice, roof or gable
    trim += rect(x - 4, top - 6, bw + 8, 8) + rect(x, top + 6, bw, 3);
    var rk = k % 3;
    if (rk === 0) roofs += poly([[x - 2, top - 6], [x + bw / 2, top - 6 - bw * 0.32], [x + bw + 2, top - 6]]);
    else if (rk === 1) { roofs += rect(x + bw * 0.12, top - 22, bw * 0.76, 16) + rect(x + bw * 0.7, top - 34, 10, 14); }
    else roofs += rect(x + 6, top - 14, bw - 12, 8);
    tops.push([x, top - (rk === 0 ? bw * 0.32 + 6 : rk === 1 ? 22 : 14), bw]);
    // windows
    var nc = bw > 120 ? 3 : 2, ww = bw / (nc * 2 + 0.4), gap = (bw - nc * ww) / (nc + 1);
    for (var r = 0; r < fl; r++) {
      var wy = top + 20 + r * fh, ground = r === fl - 1;
      for (var c = 0; c < nc; c++) {
        var wx = x + gap + c * (ww + gap);
        if (ground && c === (k % nc)) { doors += n5_win(wx - 2, wy + 6, ww + 4, fh - 4, true); continue; }
        if (ground && rk === 1) continue;
        glass += n5_win(wx, wy + 4, ww, fh * 0.56, r === 0 && rk !== 2); trim += rect(wx - 3, wy + 4 + fh * 0.56, ww + 6, 3);
        if ((k + r) % 3 === 1 && !ground) shut += rect(wx - ww * 0.36 - 2, wy + 4, ww * 0.36, fh * 0.56) + rect(wx + ww + 2, wy + 4, ww * 0.36, fh * 0.56);
        if ((k + r + c) % 4 === 0 && !ground && r > 0) { boxes += rrect(wx - 3, wy + 6 + fh * 0.56, ww + 6, 6, 2); for (var fq = 0; fq < 4; fq++) blooms += seg(wx + ww * (0.1 + fq * 0.27), wy + 3 + fh * 0.56 + (fq % 2) * 2, wx + ww * (0.1 + fq * 0.27) + 0.1, wy + 3 + fh * 0.56 + (fq % 2) * 2); }
        if (r === 1 && rk === 2 && c === 0) { var bx0 = x + gap * 0.5, bx1 = x + bw - gap * 0.5, byy = wy + 4 + fh * 0.62; trim += rect(bx0, byy, bx1 - bx0, 3); for (var bq = bx0; bq <= bx1; bq += 5) rails += seg(bq, byy, bq, byy - 12); rails += seg(bx0, byy - 12, bx1, byy - 12); }
        wins.push({x: wx, y: wy + 4, w: ww, h: fh * 0.56, k: rnd()});
      }
      // a flag pole leaning out from the facade on the second floor
      if (r === 1 && (k % 2 === 0 || rnd() < 0.3)) { var dir = (k % 4 < 2) ? 1 : -1; flags.push({x: x + (dir > 0 ? bw - 8 : 8), y: wy + fh * 0.6, dir: dir, s: ph ? 0.8 : 1, kind: k % 5 === 3 ? 1 : k % 7 === 5 ? 2 : 0}); }
    }
    // a shop front with an awning on some ground floors
    if (rk === 1) { var gy = top + 20 + (fl - 1) * fh; glass += rect(x + 10, gy + 10, bw - 20, fh - 14); wins.push({x: x + 10, y: gy + 10, w: bw - 20, h: fh - 14, k: rnd(), shop: 1});
      aw += poly([[x + 4, gy + 2], [x + bw - 4, gy + 2], [x + bw + 2, gy + 16], [x - 2, gy + 16]]); for (var sq = x + 12; sq < x + bw - 6; sq += 16) awS += seg(sq, gy + 4, sq + (sq - x - bw / 2) * 0.05, gy + 14); }
    x += bw; k++;
  }
  for (var i = 0; i < 4; i++) add(mid, 'abcd'[i], fac[i], FAC[i]);
  stk(mid, 's', rails, ACC, 1.4);
  add(mid, 'e', trim, ACC); add(mid, 'f', glass, dk ? '#2A2350' : '#A9CDEB'); add(mid, 'g', doors + shut, dk ? '#2A1E46' : '#9A6AA0'); add(mid, 'h', roofs, dk ? '#2E2452' : '#9C7FB8');
  // awning stripes in rainbow order (one stripe colour per pass would need many layers: two tones instead)
  stk(near, 's', awS, dk ? 'rgba(255,230,245,0.75)' : '#FFFFFF', ph ? 4 : 5);
  add(near, 'h', aw, dk ? '#C24F8A' : '#F07FA8');
  add(near, 'g', boxes, dk ? '#8A4A5A' : '#D9825F'); stk(near, 't', blooms, dk ? '#FF8FC8' : '#F2557E', 5);
  // the street: sidewalk, curb, road and a rainbow crosswalk
  add(refl, 'a', rect(-40, yc, W + 80, H - yc + 40), dk ? '#2C2648' : '#A49CB8');
  var lane = ''; for (x = 20; x < W; x += 90) lane += rect(x, yr + (H - 22 - yr) * 0.55, 44, 4);
  var cwx = W * (ph ? 0.08 : 0.56), cww = ph ? W * 0.84 : W * 0.34, n = 12, bwd = cww / n;
  for (i = 0; i < n; i++) { var xx = cwx + i * bwd; add(refl, 'cdefgh'[i % 6], poly([[xx + 4, yr + 6], [xx + bwd - 4, yr + 6], [xx + bwd - 12, H + 10], [xx - 4, H + 10]]), R[i % 6]); }
  add(refl, 'b', lane, dk ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)');
  var yf = H - (ph ? 18 : 22);
  add(near, 'a', rect(-40, yb, W + 80, yc - yb) + rect(-40, yf, W + 80, 40), dk ? '#4A3F6E' : '#EADFD6');
  var cracks = ''; for (x = 0; x < W; x += 46) cracks += rect(x, yb + 1, 1.5, yc - yb - 1);
  add(near, 'b', rect(-40, yc - 3, W + 80, 7) + rect(-40, yf - 2, W + 80, 5) + cracks, dk ? '#5C507F' : '#CBBFB6');
  // lamp posts and planters
  var lamps = [], posts = '', heads = '', pots = '', green = '';
  var LX = ph ? [0.12, 0.58, 0.94] : [0.05, 0.24, 0.45, 0.66, 0.86, 0.995];
  LX.forEach(function (f) { var lx = W * f, ly = yb + (yc - yb) * 0.6, lh = H * (ph ? 0.2 : 0.22); posts += rect(lx - 2.5, ly - lh, 5, lh) + rrect(lx - 6, ly - 8, 12, 8, 2) + rect(lx - 12, ly - lh + 2, 24, 3); heads += rrect(lx - 9, ly - lh - 17, 18, 19, 5) + rrect(lx - 11, ly - lh - 21, 22, 5, 2.5); lamps.push({x: lx, y: ly - lh - 6, top: ly - lh + 2}); });
  (ph ? [0.32, 0.78] : [0.15, 0.35, 0.56, 0.77]).forEach(function (f) { var px = W * f, py = yb + (yc - yb) * 0.55; pots += rrect(px - 14, py - 14, 28, 16, 3); green += m5_circW(px - 7, py - 18, 8) + m5_circW(px + 6, py - 19, 9) + m5_circW(px, py - 25, 8); });
  add(near, 'c', posts, dk ? '#1E1838' : '#4A4466'); add(near, 'd', heads, dk ? '#FFE3A8' : '#FFF6DA');
  add(near, 'e', pots, dk ? '#7A4A6A' : '#D98A6A'); add(near, 'f', green, dk ? '#3E7A5E' : '#6BBF7A');
  if (ANIM) {
    ANIM.flags = flags; ANIM.lamps = lamps; ANIM.wins = wins; ANIM.yb = yb; ANIM.yc = yc; ANIM.yr = yr; ANIM.tops = tops;
    ANIM.roofFlags = tops.filter(function (q, j) { return j % 3 === 1; }).map(function (q) { return {x: q[0] + q[2] * 0.5, y: q[1], s: ph ? 0.75 : 0.9}; });
    ANIM.pots = (ph ? [0.32, 0.78] : [0.15, 0.35, 0.56, 0.77]).map(function (f) { return [W * f, yb + (yc - yb) * 0.55 - 26]; });
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// 2. Graduation Day: a campus lawn before an old hall with a clock tower, a stage, banners and rows of chairs.
// chair rows in perspective (back view): returns [{y, s, xs: [...]}], front row last
function n5_rows(W, H, ph, y0, y1, aisle) {
  var rows = [], n = 4;
  for (var r = 0; r < n; r++) { var u = r / (n - 1), y = y0 + (y1 - y0) * Math.pow(u, 1.1), s = (ph ? 0.85 : 1.0) + u * (ph ? 0.45 : 0.62), sp = 36 * s, xs = [];
    for (var x = aisle - 26 * s - sp * 0.5; x > -sp; x -= sp) xs.push(x); for (x = aisle + 26 * s + sp * 0.5; x < W + sp; x += sp) xs.push(x);
    rows.push({y: y, s: s, xs: xs.sort(function (a, b) { return a - b; })}); }
  return rows;
}
function n5_chair(x, y, s) { return rrect(x - 11 * s, y - 25 * s, 22 * s, 11 * s, 3 * s) + rect(x - 11 * s, y - 15 * s, 22 * s, 4 * s) + rect(x - 10 * s, y - 13 * s, 2.4 * s, 13 * s) + rect(x + 7.6 * s, y - 13 * s, 2.4 * s, 13 * s); }
SCENES.graduation = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(3), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#141E3A 0%,#22305A 50%,#4A4A6E 100%)' : 'linear-gradient(180deg,#B9DAF3 0%,#EAF3FA 56%,#D9E8C2 100%)';
  var cx = W * (ph ? 0.5 : 0.7), hw = ph ? W * 0.96 : Math.min(620, W * 0.52), yl = H * (ph ? 0.66 : 0.67), bh = H * (ph ? 0.11 : 0.16), cw = hw * 0.38, wh = bh * 0.8;
  // far: tree line, clouds, the sun or the moon glow
  var tl = '', tl2 = '';
  for (var x = -40; x < W + 60; x += 38 + rnd() * 30) { var r = 26 + rnd() * 26; tl += m5_circW(x, yl - r * 0.6 - rnd() * 14, r); }
  for (x = -20; x < W + 60; x += 50 + rnd() * 30) { r = 22 + rnd() * 18; tl2 += m5_circW(x, yl - r * 0.3, r); }
  add(far, 'a', tl + rect(-40, yl - 30, W + 80, 40), dk ? '#26335E' : '#B7D3B4'); add(far, 'b', tl2, dk ? '#2C3A64' : '#A3C7A0');
  if (dk) add(far, 'c', circ(W * (ph ? 0.2 : 0.16), H * (ph ? 0.1 : 0.14), 80), 'rgba(220,230,255,0.10)');
  else { var cl = ''; (ph ? [[0.15, 0.1, 0.6], [0.7, 0.2, 0.5]] : [[0.1, 0.16, 0.9], [0.38, 0.07, 0.7], [0.58, 0.2, 0.8], [0.9, 0.08, 0.7]]).forEach(function (q) { cl += n5_cloud(W * q[0], H * q[1], q[2]); }); add(far, 'c', cl, 'rgba(255,255,255,0.9)'); add(far, 'd', circ(W * (ph ? 0.85 : 0.16), H * (ph ? 0.07 : 0.1), 80), 'rgba(255,248,210,0.5)'); add(far, 'e', circ(W * (ph ? 0.85 : 0.16), H * (ph ? 0.07 : 0.1), 30), '#FFF6CC'); }
  // trees beside the hall (the refl layer sits under the hall)
  var trees = '', hi = '', trunks = '', TX = ph ? [[0.04, 1], [0.97, 0.9]] : [[0.03, 1.2], [0.13, 0.9], [0.42, 1.0], [0.985, 1.1]];
  TX.forEach(function (q) { var tx = W * q[0], s = q[1] * (ph ? 1.1 : 1.6); trunks += poly([[tx - 5 * s, yl + 4], [tx - 3 * s, yl - 34 * s], [tx + 3 * s, yl - 34 * s], [tx + 5 * s, yl + 4]]); trees += n5_tree(tx, yl - 16 * s, s * 1.15); hi += m5_circW(tx - 8 * s, yl - 74 * s, 10 * s) + m5_circW(tx + 12 * s, yl - 64 * s, 8 * s); });
  add(refl, 'a', trunks, dk ? '#3A2E4A' : '#8A6A50'); add(refl, 'b', trees, dk ? '#1F3A4A' : '#5FA866'); add(refl, 'c', hi, dk ? '#2A4A58' : '#8CCB7E');
  // the hall
  var L0 = cx - hw / 2, L1 = cx - cw / 2, R0 = cx + cw / 2, R1 = cx + hw / 2, top = yl - bh, wt = yl - wh;
  var stone = rect(L0, wt, L1 - L0 + 2, wh + 4) + rect(R0 - 2, wt, R1 - R0 + 2, wh + 4) + rect(L1, top, cw, bh + 4);
  var shade = rect(L0, wt, 6, wh) + rect(R1 - 10, wt, 10, wh) + rect(L1 - 4, top, 8, bh) + rect(R0 - 4, top, 8, bh) + rect(L0, yl - 8, hw, 8);
  var roof = poly([[L0 - 6, wt], [L0 + 14, wt - wh * 0.32], [L1, wt - wh * 0.32], [L1, wt]]) + poly([[R0, wt], [R0, wt - wh * 0.32], [R1 - 14, wt - wh * 0.32], [R1 + 6, wt]]);
  var white = rect(L0 - 6, wt - 4, L1 - L0 + 6, 6) + rect(R0, wt - 4, R1 - R0 + 6, 6) + rect(L1 - 4, top - 6, cw + 8, 8) + rect(L0 - 4, yl - 12, hw + 8, 5);
  var glass = '', door = '', ivy = '', wins = [];
  // wing windows: two rows of arched windows
  [[L0, L1], [R0, R1]].forEach(function (w) { var n = Math.max(2, Math.floor((w[1] - w[0]) / (ph ? 26 : 34))), sp = (w[1] - w[0]) / n, ww = sp * 0.48;
    for (var i = 0; i < n; i++) for (var j = 0; j < 2; j++) { var wx = w[0] + sp * (i + 0.5) - ww / 2, wy = wt + wh * (0.14 + j * 0.44), whh = wh * 0.3; glass += n5_win(wx, wy, ww, whh, true); white += rect(wx - 2, wy + whh, ww + 4, 2.5); wins.push({x: wx, y: wy, w: ww, h: whh, k: rnd()}); } });
  // portico: columns, pediment, steps
  var pw = cw * 0.92, nc = ph ? 4 : 6, colH = bh * 0.7, cTop = yl - 12 - colH;
  for (var i = 0; i < nc; i++) { var px = cx - pw / 2 + (i + 0.5) * pw / nc, cwd = pw / nc * 0.36; white += rect(px - cwd / 2, cTop, cwd, colH) + rect(px - cwd * 0.75, cTop - 3, cwd * 1.5, 4) + rect(px - cwd * 0.75, yl - 15, cwd * 1.5, 4); }
  white += rect(cx - pw / 2 - 6, cTop - 12, pw + 12, 10) + poly([[cx - pw / 2 - 10, cTop - 12], [cx, cTop - 12 - pw * 0.2], [cx + pw / 2 + 10, cTop - 12]]);
  var tymp = poly([[cx - pw / 2 + 6, cTop - 15], [cx, cTop - 12 - pw * 0.2 + 7], [cx + pw / 2 - 6, cTop - 15]]);
  door += n5_win(cx - pw * 0.09, yl - 12 - colH * 0.62, pw * 0.18, colH * 0.62, true);
  glass += n5_win(cx - pw * 0.34, yl - 12 - colH * 0.5, pw * 0.1, colH * 0.36, true) + n5_win(cx + pw * 0.24, yl - 12 - colH * 0.5, pw * 0.1, colH * 0.36, true);
  for (var s = 0; s < 3; s++) white += rect(cx - pw / 2 - 8 - s * 7, yl - 8 + s * 5, pw + 16 + s * 14, 5);
  // clock tower with a belfry and a copper cupola
  var tw = cw * (ph ? 0.3 : 0.32), tb = cTop - 12 - pw * 0.2 + 10, th = H * (ph ? 0.12 : 0.15), tt = tb - th, ck = tw * 0.36;
  stone += rect(cx - tw / 2, tt, tw, th + 2); shade += rect(cx + tw / 2 - 5, tt, 5, th);
  white += rect(cx - tw / 2 - 4, tt - 4, tw + 8, 6) + rect(cx - tw / 2 - 3, tt + th * 0.5 - 2, tw + 6, 4);
  var bel = tt - tw * 0.8; stone += rect(cx - tw * 0.38, bel, tw * 0.76, tw * 0.8); glass += n5_win(cx - tw * 0.22, bel + tw * 0.14, tw * 0.18, tw * 0.5, true) + n5_win(cx + tw * 0.04, bel + tw * 0.14, tw * 0.18, tw * 0.5, true); white += rect(cx - tw * 0.44, bel - 3, tw * 0.88, 5);
  var cup = 'M' + PT(cx - tw * 0.42, bel - 2) + ' Q' + PT(cx - tw * 0.42, bel - tw * 0.75) + ' ' + PT(cx, bel - tw * 0.9) + ' Q' + PT(cx + tw * 0.42, bel - tw * 0.75) + ' ' + PT(cx + tw * 0.42, bel - 2) + ' Z ';
  var face = circ(cx, tt + th * 0.25, ck + 3);
  ivy += m5_circW(L0 + 10, yl - 20, 16) + m5_circW(L0 + 6, yl - 44, 12) + m5_circW(L0 + 18, yl - 36, 10) + m5_circW(R1 - 12, yl - 24, 15) + m5_circW(R1 - 6, yl - 46, 11) + m5_circW(R1 - 22, yl - 34, 9);
  add(mid, 'a', stone, dk ? '#4C4A78' : '#E9D3B2'); add(mid, 'b', shade, dk ? 'rgba(20,20,50,0.35)' : 'rgba(150,100,60,0.18)'); add(mid, 'c', roof, dk ? '#2C3358' : '#6F7FA6');
  add(mid, 'd', white + face, dk ? '#C9C8E6' : '#FFFDF6'); add(mid, 'e', glass, dk ? '#262C52' : '#8FB4D6'); add(mid, 'f', ivy, dk ? '#2E5A4E' : '#6CB070');
  add(mid, 'g', cup + tymp, dk ? '#4E8A7E' : '#7CC0A8'); add(mid, 'h', door, dk ? '#3A2A40' : '#9A5A3E');
  stk(mid, 's', seg(cx, bel - tw * 0.9, cx, bel - tw * 1.35), dk ? '#C9B26A' : '#C9962A', 2.4);
  // the lawn, mown stripes, the aisle path, the stage
  var lawn = rect(-40, yl, W + 80, H - yl + 40), stripes = '';
  for (x = -W; x < W * 2; x += 120) stripes += poly([[x, yl], [x + 60, yl], [x + 60 + (x - cx) * 0.9, H + 10], [x + (x - cx) * 0.9, H + 10]]);
  var aisle = cx, path = poly([[aisle - 14, yl + 26], [aisle + 14, yl + 26], [aisle + (ph ? 46 : 60), H + 10], [aisle - (ph ? 46 : 60), H + 10]]);
  var sw = pw * 1.25, sy = yl + 4, sh = ph ? 16 : 22, stage = rect(cx - sw / 2, sy, sw, 5), skirt = rect(cx - sw / 2 + 2, sy + 5, sw - 4, sh);
  var pod = poly([[cx - 12, sy], [cx - 9, sy - 30], [cx + 9, sy - 30], [cx + 12, sy]]) + rect(cx - 14, sy - 34, 28, 5);
  add(near, 'a', lawn, dk ? '#1E3A3A' : '#8CCB7A'); add(near, 'b', stripes, dk ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.14)'); add(near, 'c', path, dk ? '#3A4462' : '#EFE3C8');
  add(near, 'd', stage, dk ? '#C9C8E6' : '#FFFFFF'); add(near, 'e', skirt + pod, dk ? '#22306A' : '#2E4A8A');
  var swag = ''; for (x = cx - sw / 2 + 4; x < cx + sw / 2 - 10; x += 22) swag += 'M' + PT(x, sy + 6) + ' Q' + PT(x + 11, sy + 14) + ' ' + PT(x + 22, sy + 6) + ' ';
  stk(near, 's', swag, dk ? '#E8C25A' : '#F2B83A', 2.4); add(near, 'f', circ(cx, sy - 20, 4.5), dk ? '#E8C25A' : '#F2B83A');
  // chairs (drawn by the engine when it runs, so seated graduates and their caps layer correctly)
  var rows = n5_rows(W, H, ph, yl + (ph ? 70 : 92), H - (ph ? 22 : 26), aisle);
  if (!ANIM) { var ch = ''; rows.forEach(function (R) { R.xs.forEach(function (x) { ch += n5_chair(x, R.y, R.s); }); }); add(near, 'g', ch, dk ? '#9A98C4' : '#FFFFFF'); }
  // banner poles beside the stage and on the lawn
  var poles = '', bans = [];
  (ph ? [cx - sw / 2 - 16, cx + sw / 2 + 16] : [cx - sw / 2 - 20, cx + sw / 2 + 20, W * 0.06, W * 0.3]).forEach(function (bx, j) { var by = j < 2 ? sy + sh : yl + 30, bhh = (j < 2 ? 1 : 0.9) * H * (ph ? 0.13 : 0.16); poles += rect(bx - 2, by - bhh, 4, bhh) + circ(bx, by - bhh - 3, 4); bans.push({x: bx, y: by - bhh + 4, h: bhh * 0.55, w: (ph ? 18 : 24) * (j < 2 ? 1 : 0.9), k: j}); });
  add(near, 'h', poles, dk ? '#8E8AB0' : '#5A5A78');
  if (ANIM) { ANIM.rows = rows; ANIM.bans = bans; ANIM.clock = [cx, tt + th * 0.25, ck]; ANIM.wins = wins; ANIM.yl = yl; ANIM.stage = [cx, sy, sw]; ANIM.aisle = aisle; ANIM.flag = [cx, bel - tw * 1.35]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// 3. Birthday Bash: a living room decorated for a party, with a cake on the table, a pile of gifts and a llama pinata.
// a wrapped gift box (front view): box, lid and the cross ribbon as separate paths
function n5_gift(x, y, w, h) { var lh = Math.min(h * 0.24, 14); return {box: rect(x - w / 2, y - h, w, h), lid: rrect(x - w / 2 - 4, y - h - lh, w + 8, lh, 2), rib: rect(x - w * 0.08, y - h - lh, w * 0.16, h + lh) + rect(x - w / 2, y - h * 0.55, w, h * 0.14), bow: rotEll(x - w * 0.16, y - h - lh - 6, w * 0.17, 6, -20) + rotEll(x + w * 0.16, y - h - lh - 6, w * 0.17, 6, 20) + circ(x, y - h - lh - 4, 4.5)}; }
SCENES.birthday = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(0), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#20183A 0%,#3A2458 55%,#6A3A6E 100%)' : 'linear-gradient(180deg,#FFD9E4 0%,#FFF3DA 58%,#D8F0F6 100%)';
  var yf = H * (ph ? 0.78 : 0.74), yw = yf - H * (ph ? 0.1 : 0.13);
  // wallpaper stripes and dots, wainscot and baseboard
  var st = '', dots = ''; for (var x = -20; x < W + 40; x += 56) st += rect(x, -40, 22, yw + 40);
  spread(0, 0, W, yw, 56, 48, rnd, 0.1).forEach(function (c) { dots += circ(c.x + 39 - (c.j % 2) * 28, c.y, 2.6); });
  add(far, 'a', st, dk ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.38)'); add(far, 'b', dots + rect(-40, yw, W + 80, yf - yw), dk ? '#4A2E62' : '#FFE3EA');
  var pan = ''; for (x = 14; x < W; x += 110) pan += rrect(x, yw + 14, 88, yf - yw - 30, 6);
  add(far, 'c', pan, dk ? '#55366E' : '#FFEEF2'); add(far, 'd', rect(-40, yw - 6, W + 80, 8) + rect(-40, yf - 12, W + 80, 12), dk ? '#6A4680' : '#FFFFFF');
  // the window with curtains
  var wx0 = W * (ph ? 0.58 : 0.035), wx1 = W * (ph ? 0.94 : 0.2), wy0 = H * (ph ? 0.1 : 0.2), wy1 = H * (ph ? 0.3 : 0.5), mx = (wx0 + wx1) / 2;
  add(far, 'e', rect(wx0, wy0, wx1 - wx0, wy1 - wy0), dk ? '#22285E' : '#BFE6FA');
  var frame = rect(wx0 - 6, wy0 - 6, wx1 - wx0 + 12, 7) + rect(wx0 - 6, wy1 - 1, wx1 - wx0 + 12, 9) + rect(wx0 - 6, wy0 - 6, 7, wy1 - wy0 + 12) + rect(wx1 - 1, wy0 - 6, 7, wy1 - wy0 + 12) + rect(mx - 2.5, wy0, 5, wy1 - wy0) + rect(wx0, (wy0 + wy1) / 2 - 2, wx1 - wx0, 4);
  var cur = poly([[wx0 - 20, wy0 - 14], [wx0 + (wx1 - wx0) * 0.22, wy0 - 14], [wx0 + 4, wy1 * 0.7 + wy0 * 0.3], [wx0 - 2, wy1 + 30], [wx0 - 26, wy1 + 30]]) + poly([[wx1 + 20, wy0 - 14], [wx1 - (wx1 - wx0) * 0.22, wy0 - 14], [wx1 - 4, wy1 * 0.7 + wy0 * 0.3], [wx1 + 2, wy1 + 30], [wx1 + 26, wy1 + 30]]);
  add(far, 'f', frame + rect(wx0 - 30, wy0 - 18, wx1 - wx0 + 60, 5), dk ? '#C9B8E0' : '#FFFFFF'); add(far, 'g', cur, dk ? '#8A3E78' : '#F49AB8');
  if (!dk) add(far, 'h', n5_cloud(wx0 + (wx1 - wx0) * 0.3, wy0 + (wy1 - wy0) * 0.3, 0.32) + n5_cloud(wx0 + (wx1 - wx0) * 0.72, wy0 + (wy1 - wy0) * 0.62, 0.26), '#FFFFFF');
  // picture frames on the wall
  var fr = '', pic = '';
  (ph ? [[0.1, 0.16, 46, 56], [0.28, 0.14, 34, 34]] : [[0.27, 0.27, 60, 74], [0.36, 0.25, 40, 40], [0.86, 0.26, 70, 52], [0.6, 0.27, 44, 56]]).forEach(function (q) { var fx = W * q[0], fy = H * q[1]; fr += rrect(fx - q[2] / 2 - 5, fy - q[3] / 2 - 5, q[2] + 10, q[3] + 10, 3); pic += rect(fx - q[2] / 2, fy - q[3] / 2, q[2], q[3]); });
  add(refl, 'g', fr, dk ? '#B88A50' : '#E0A85A'); add(refl, 'h', pic, dk ? '#3E5A78' : '#A8DCC8');
  // the floor, planks and the rug
  add(refl, 'a', rect(-40, yf, W + 80, H - yf + 40), dk ? '#5A3A50' : '#EDC096');
  var pl = ''; for (var yy = yf + 14, k = 0; yy < H + 10; yy += 14 + k * 3, k++) { pl += rect(-40, yy, W + 80, 1.6); for (x = (k * 97) % 160 - 40; x < W; x += 160 + k * 20) pl += rect(x, yy - 14 - k * 3, 1.6, 14 + k * 3); }
  add(refl, 'b', pl, dk ? 'rgba(20,10,30,0.25)' : 'rgba(170,110,60,0.25)');
  var rx = W * 0.5, ry = yf + (H - yf) * 0.58, rw = W * (ph ? 0.46 : 0.34), rh = (H - yf) * 0.3;
  add(refl, 'c', ell(rx, ry, rw, rh), dk ? '#5E3E86' : '#C6AEEA'); add(refl, 'd', ell(rx, ry, rw * 0.82, rh * 0.74), dk ? '#7A4E90' : '#F7D7F0');
  var rd = ''; for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2; rd += circ(rx + Math.cos(a) * rw * 0.91, ry + Math.sin(a) * rh * 0.87, 3); } add(refl, 'e', rd, dk ? '#E8C8F0' : '#FFFFFF');
  // a sofa against the back wall, the floor lamp and a plant
  var sx = W * 0.5, sw = W * (ph ? 0.7 : 0.36), sy = yf + 6, sh = H * 0.12;
  add(mid, 'a', rrect(sx - sw / 2, sy - sh, sw, sh, 16) + rrect(sx - sw / 2 - 18, sy - sh * 0.7, 30, sh * 0.7, 12) + rrect(sx + sw / 2 - 12, sy - sh * 0.7, 30, sh * 0.7, 12), dk ? '#3E6A78' : '#8FC9C0');
  add(mid, 'b', rrect(sx - sw / 2 + 14, sy - sh * 0.55, sw / 2 - 18, sh * 0.32, 8) + rrect(sx + 4, sy - sh * 0.55, sw / 2 - 18, sh * 0.32, 8) + rrect(sx - sw * 0.3, sy - sh * 0.95, sw * 0.18, sh * 0.34, 8), dk ? '#4E7E8A' : '#B5E0D8');
  var lx = W * (ph ? 0.06 : 0.73), lh = H * 0.36;
  add(mid, 'c', rect(lx - 2, yf - lh, 4, lh + 8) + ell(lx, yf + 8, 16, 4), dk ? '#2A1E36' : '#6A5060');
  add(mid, 'd', poly([[lx - 22, yf - lh + 4], [lx - 14, yf - lh - 34], [lx + 14, yf - lh - 34], [lx + 22, yf - lh + 4]]), dk ? '#FFD98A' : '#FFE7A8');
  // the party table with a cake stand (the cake and candles are drawn by the engine)
  var tx = W * (ph ? 0.2 : 0.14), tw2 = ph ? 120 : 200, ty = H * (ph ? 0.86 : 0.83);
  add(mid, 'e', rect(tx - tw2 * 0.4, ty, 6, H * 0.12) + rect(tx + tw2 * 0.4 - 6, ty, 6, H * 0.12) + rect(tx - 3, ty - 10, 6, 10) + ell(tx, ty - 10, 22, 4), dk ? '#7A5060' : '#B07A4E');
  var cloth = rrect(tx - tw2 / 2, ty - 4, tw2, 30, 6), sc = ''; for (x = tx - tw2 / 2; x < tx + tw2 / 2 - 2; x += 14) sc += 'M' + PT(x, ty + 24) + ' a7 7 0 0 0 14 0 Z ';
  add(mid, 'f', cloth + sc, dk ? '#E8DDF2' : '#FFFFFF'); add(mid, 'g', rect(tx - tw2 / 2, ty + 14, tw2, 4), dk ? '#C2508A' : '#F49AB8');
  // the gift pile (the top gift is the engine's)
  var gx = W * (ph ? 0.6 : 0.68), gy = H * (ph ? 0.95 : 0.94), G = [[gx - 52, gy, 62, 46, 'a'], [gx + 16, gy, 72, 56, 'b'], [gx + 74, gy, 44, 36, 'c'], [gx - 56, gy - 46 - 12, 40, 30, 'd']].map(function (q) { var s = ph ? 0.75 : 1; return [gx + (q[0] - gx) * s, q[1], q[2] * s, q[3] * s, q[4]]; });
  var ribs = '', bows = '', gs = ell(gx + 10, gy, W * (ph ? 0.2 : 0.1), 7);
  G.forEach(function (q) { var g = n5_gift(q[0], q[1], q[2], q[3]); add(near, q[4], g.box + g.lid); ribs += g.rib; bows += g.bow; });
  add(refl, 'f', gs + ell(tx, H * 0.97, tw2 * 0.6, 6) + ell(sx, sy + 2, sw * 0.55, 6), dk ? 'rgba(10,0,20,0.3)' : 'rgba(160,90,90,0.16)');
  near.a.c = dk ? '#4E86C8' : '#7FC8F0'; near.b.c = dk ? '#D8A63A' : '#FFD45A'; near.c.c = dk ? '#3EA08A' : '#7FD8B8'; near.d.c = dk ? '#C04E86' : '#F48AB0';
  add(near, 'e', ribs, dk ? '#F2E6FF' : '#FFFFFF'); add(near, 'f', bows, dk ? '#FFD86B' : '#F0507A');
  // a potted plant by the sofa and confetti on the floor
  var px = W * (ph ? 0.92 : 0.29), py = yf + 26;
  add(near, 'g', poly([[px - 16, py - 26], [px + 16, py - 26], [px + 12, py], [px - 12, py]]), dk ? '#B0607A' : '#E58A6A');
  var lv = ''; [-50, -20, 10, 40, -80, 70].forEach(function (a, j) { lv += leaf(px, py - 26, 34 + (j % 2) * 10, 7, -90 + a); }); add(near, 'h', lv, dk ? '#3E8A6E' : '#5DB87A');
  var fc = ''; spread(0, yf + 10, W, H - yf - 10, 40, 22, rnd, 1).forEach(function (c) { if (c.q < 0.35) fc += rotEll(c.x, c.y, 3, 1.4, c.r * 180); }); add(refl, 'f', fc);
  if (ANIM) { ANIM.yf = yf; ANIM.win = [wx0, wy0, wx1, wy1]; ANIM.cake = [tx, ty - 4, ph ? 0.85 : 1.3]; var gs2 = ph ? 0.75 : 1; ANIM.gift = [gx + 16 * gs2, gy - 69.4 * gs2, 50 * gs2, 40 * gs2];
    ANIM.lamp = [lx, yf - lh - 14]; ANIM.table = [tx, ty]; ANIM.gifts = [gx, gy]; ANIM.sofa = [sx, sy - sh, sw]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// 4. Crystal Cave: layered rock walls, a hole in the roof, still pools and clusters of glowing crystals.
// a cluster of crystal points standing on (x, y); returns the dark and light facets and the tips
function n5_crys(x, y, s, ang, n, rnd) {
  var o = {dk: '', lt: '', tips: []};
  for (var i = 0; i < n; i++) { var a = (ang + (i - (n - 1) / 2) * 22 + (rnd() - 0.5) * 14) * Math.PI / 180, L = s * (i === Math.floor(n / 2) ? 1 : 0.55 + rnd() * 0.35), w = L * (0.26 + rnd() * 0.08), dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    var bx = x + (i - (n - 1) / 2) * s * 0.12, by = y, P = function (u, v) { return [bx + dx * u + nx * v, by + dy * u + ny * v]; };
    var BL = P(0, -w / 2), UL = P(L - w * 0.7, -w / 2), T = P(L, 0), UM = P(L - w * 0.55, w * 0.12), BM = P(0, w * 0.12), UR = P(L - w * 0.7, w / 2), BR = P(0, w / 2);
    o.dk += poly([BL, UL, T, UM, BM]); o.lt += poly([BM, UM, T, UR, BR]); o.tips.push(T); }
  return o;
}
SCENES.geology = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#120E24 0%,#22183E 50%,#3E2A62 100%)' : 'linear-gradient(180deg,#CBD7EA 0%,#E8ECF4 55%,#D7CDE6 100%)';
  // the hole in the roof
  var ox = W * (ph ? 0.62 : 0.74), orx = W * (ph ? 0.34 : 0.2), ory = H * (ph ? 0.14 : 0.2);
  function oy(x) { var u = (x - ox) / orx; if (Math.abs(u) >= 1) return -40; return ory * Math.sqrt(1 - u * u) + Math.sin(x / 13) * 4 + Math.sin(x / 5.3) * 2; }
  function ceil(x) { return H * (ph ? 0.1 : 0.13) + Math.sin(x / 60 + 1) * 10 + Math.sin(x / 23) * 5; }
  var yF = function (x) { return H * (ph ? 0.8 : 0.78) + Math.sin(x / 90 + 2) * 8 + Math.sin(x / 37) * 4; };
  var top = [], bot = [], x;
  for (x = -40; x <= W + 40; x += 6) { var t0 = oy(x); top.push([x, t0]); bot.push([x, Math.max(ceil(x), t0 + 16)]); }
  // far: the back wall (with the opening left clear) and its strata
  add(far, 'a', poly(top.concat([[W + 40, H + 40], [-40, H + 40]])), dk ? '#1C1534' : '#A894BC');
  var BS = [['b', 0.3, dk ? '#221A3E' : '#BCA4C8'], ['c', 0.42, dk ? '#1A1432' : '#9884B2'], ['b', 0.55, null], ['d', 0.64, dk ? '#261E46' : '#C9AEC4'], ['c', 0.72, null]];
  BS.forEach(function (q, k) { var y0 = H * q[1], y1 = y0 + H * 0.05, up = [], lo = []; for (x = -40; x <= W + 40; x += 20) { up.push([x, Math.max(y0 + Math.sin(x / 140 + k) * 12, oy(x) + 2)]); lo.unshift([x, Math.max(y1 + Math.sin(x / 120 + k * 2) * 12, oy(x) + 2)]); } add(far, q[0], poly(up.concat(lo)), q[2] || undefined); });
  var dm = ''; spread(0, H * 0.6, W, H * 0.16, 70, 40, rnd, 0.8).forEach(function (c) { var h = 30 + c.r * 50; dm += poly([[c.x - 12, yF(c.x) - 20], [c.x - 3, yF(c.x) - 20 - h], [c.x + 3, yF(c.x) - 20 - h], [c.x + 12, yF(c.x) - 20]]); });
  add(far, 'e', dm, dk ? '#150F2A' : '#8E7AA6');
  // refl: the shaft of daylight from the hole (night: a faint moonbeam)
  var sh = poly([[ox - orx * 0.7, ory * 0.6], [ox + orx * 0.5, ory * 0.8], [W * (ph ? 0.6 : 0.5), H * 0.95], [W * (ph ? 0.1 : 0.2), H * 0.95]]);
  add(refl, 'a', sh, dk ? 'rgba(170,160,255,0.05)' : 'rgba(255,248,225,0.32)'); add(refl, 'b', poly([[ox - orx * 0.45, ory * 0.7], [ox + orx * 0.2, ory * 0.8], [W * (ph ? 0.5 : 0.42), H * 0.95], [W * (ph ? 0.2 : 0.28), H * 0.95]]), dk ? 'rgba(170,160,255,0.04)' : 'rgba(255,250,235,0.3)');
  // mid: ceiling, side walls with strata, stalactites, stalagmites and wall crystals
  var ceilP = poly(top.concat(bot.slice().reverse()));
  var wl = function (y) { var u = y / H; return W * (ph ? 0.07 : 0.11) + Math.sin(u * 3.2) * W * (ph ? 0.08 : 0.08) + Math.sin(y / 31) * 5; }, wr = function (y) { var u = y / H; return W - W * (ph ? 0.06 : 0.09) - Math.sin(u * 3.0 + 0.3) * W * (ph ? 0.07 : 0.07) + Math.sin(y / 27) * 5; };
  var L = [[-40, -40]], R = [[W + 40, -40]], y;
  for (y = 0; y <= H + 40; y += 12) { L.push([wl(y), y]); R.push([wr(y), y]); } L.push([-40, H + 40]); R.push([W + 40, H + 40]);
  add(mid, 'a', ceilP + poly(L) + poly(R.slice().reverse()), dk ? '#160F2A' : '#7C6696');
  // strata on the side walls: sloping bands cut at the wall's edge
  var str = ['', '', ''];
  for (var k = 0; k < 9; k++) { var b0 = H * (0.16 + k * 0.085), th = H * 0.03 + (k % 3) * 6, sl = 0.18;
    [[wl, -40, 1], [wr, W + 40, -1]].forEach(function (S) {
      var up = [], lo = []; for (var xx2 = S[1]; S[2] > 0 ? xx2 <= S[0](b0) : xx2 >= S[0](b0); xx2 += S[2] * 10) { up.push([xx2, b0 + (xx2 - S[1]) * sl * S[2] + Math.sin(xx2 / 17 + k) * 2]); }
      var e1 = up[up.length - 1], yb = e1[1] + th; lo.push([S[0](yb), yb]); for (xx2 = Math.min(S[0](yb), S[0](b0)); S[2] > 0 ? xx2 >= S[1] : xx2 <= S[1]; xx2 -= S[2] * 10) lo.push([xx2, b0 + th + (xx2 - S[1]) * sl * S[2] + Math.sin(xx2 / 19 + k) * 2]);
      str[k % 3] += poly(up.concat([[S[0](e1[1] + th * 0.5), e1[1] + th * 0.5]], lo)); }); }
  add(mid, 'b', str[0], dk ? '#20183A' : '#9A7EAA'); add(mid, 'c', str[1], dk ? '#1B1334' : '#B08EA6'); add(mid, 'd', str[2], dk ? '#251B42' : '#6C5888');
  // stalactites hang from the ceiling and the wall overhangs; the engine drips from their tips
  var stal = '', hl = '', tips = [];
  for (x = 10; x < W; x += 34 + rnd() * 40) { var c0 = Math.max(ceil(x), oy(x) + 16); if (oy(x) > 0 && rnd() < 0.6) continue; var len = 20 + rnd() * (ph ? 40 : 60), w2 = 8 + rnd() * 10; stal += poly([[x - w2, c0 - 4], [x + w2, c0 - 4], [x + w2 * 0.2, c0 + len * 0.8], [x, c0 + len], [x - w2 * 0.25, c0 + len * 0.8]]); hl += poly([[x - w2 * 0.6, c0], [x - w2 * 0.2, c0], [x - w2 * 0.15, c0 + len * 0.6]]); tips.push([x, c0 + len]); }
  [[wl, 1], [wr, -1]].forEach(function (S) { for (var yy = H * 0.3; yy < H * 0.6; yy += H * 0.12) { var xx = S[0](yy) - S[1] * 2, len = 26 + rnd() * 30; stal += poly([[xx - S[1] * 2, yy - 6], [xx + S[1] * 22, yy - 4], [xx + S[1] * 8, yy + len]]); tips.push([xx + S[1] * 8, yy + len]); } });
  var gm = ''; (ph ? [0.15, 0.4, 0.86] : [0.17, 0.26, 0.44, 0.6, 0.84, 0.9]).forEach(function (f, j) { var gx = W * f, gy = yF(gx) + 4, h = (ph ? 30 : 46) * (0.6 + (j % 3) * 0.3); gm += 'M' + PT(gx - h * 0.32, gy) + ' Q' + PT(gx - h * 0.12, gy - h * 0.6) + ' ' + PT(gx - 3, gy - h) + ' Q' + PT(gx, gy - h - 4) + ' ' + PT(gx + 3, gy - h) + ' Q' + PT(gx + h * 0.12, gy - h * 0.6) + ' ' + PT(gx + h * 0.32, gy) + ' Z '; });
  add(mid, 'e', stal + gm, dk ? '#2A2048' : '#8E78A6'); add(mid, 'f', hl, dk ? 'rgba(200,180,255,0.12)' : 'rgba(255,255,255,0.35)');
  // crystal clusters: pink on the walls (mid), purple and teal on the floor (near)
  var glow = [], wc = {dk: '', lt: ''};
  [[wl, 0.42, 1, 70], [wr, 0.36, -1, -70], [wl, 0.66, 1, 60], [wr, 0.62, -1, -55]].forEach(function (q, j) { var yy = H * q[1], xx = q[0](yy) - q[2] * 4, C = n5_crys(xx, yy, (ph ? 36 : 64) * (j < 2 ? 1 : 0.8), q[3], 4, rnd); wc.dk += C.dk; wc.lt += C.lt; glow.push({x: xx + q[2] * 18, y: yy - 8, r: ph ? 40 : 60, c: 2, tips: C.tips}); });
  add(mid, 'g', wc.dk, dk ? '#B04A8A' : '#E07AAE'); add(mid, 'h', wc.lt, dk ? '#F08AC8' : '#FFC2DE');
  // near: the floor, pools, floor crystals
  var fl = [], fx; for (fx = -40; fx <= W + 40; fx += 10) fl.push([fx, yF(fx)]);
  add(near, 'a', below(fl, H + 40), dk ? '#120C22' : '#6A5884');
  var peb = ''; spread(0, H * 0.82, W, H * 0.18, 30, 16, rnd, 1).forEach(function (c) { if (c.q < 0.4) peb += ell(c.x, c.y, 3 + c.r * 5, 1.6 + c.k * 2); });
  var ledge = ''; fl.forEach(function (p, j) { if (j % 2 === 0) ledge += rect(p[0], p[1], 10, 3); });
  add(near, 'b', peb + ledge, dk ? '#1E1636' : '#80709C');
  var pools = ph ? [[0.28, 0.9, 0.24, 0.028], [0.78, 0.93, 0.16, 0.02]] : [[0.3, 0.88, 0.15, 0.034], [0.74, 0.91, 0.12, 0.026]], pp = '', rim = '';
  pools = pools.map(function (q) { var p = {x: W * q[0], y: H * q[1], rx: W * q[2], ry: H * q[3]}; pp += ell(p.x, p.y, p.rx, p.ry); rim += ell(p.x, p.y + 2, p.rx + 6, p.ry + 3); return p; });
  add(near, 'c', rim, dk ? '#2A2048' : '#A08EB8'); add(near, 'd', pp, dk ? '#1E2A5A' : '#9FC4E6');
  var fc = [{dk: '', lt: ''}, {dk: '', lt: ''}], FC = ph ? [[0.06, 1, 0, 64], [0.94, 1, 1, 56], [0.5, 0.6, 1, 34], [0.36, 0.7, 0, 30], [0.75, 0.6, 0, 30]] : [[0.035, 1, 0, 120], [0.965, 1, 1, 100], [0.58, 0.6, 1, 50], [0.15, 0.7, 1, 56], [0.86, 0.75, 0, 60], [0.42, 0.55, 0, 36], [0.68, 0.7, 0, 34], [0.25, 0.6, 0, 30]];
  FC.forEach(function (q, j) { var cx = W * q[0], cy = (q[1] === 1 ? H + 6 : yF(cx) + 10), C = n5_crys(cx, cy, q[3], q[0] < 0.5 ? 12 : -12, q[1] === 1 ? 5 : 3, rnd); fc[q[2]].dk += C.dk; fc[q[2]].lt += C.lt; glow.push({x: cx, y: cy - q[3] * 0.5, r: q[3] * 1.5, c: q[2], tips: C.tips}); });
  add(near, 'e', fc[0].dk, dk ? '#7A3EC8' : '#9A62D8'); add(near, 'f', fc[0].lt, dk ? '#B88AF8' : '#D2B2F8');
  add(near, 'g', fc[1].dk, dk ? '#1E9AA8' : '#3EB4C0'); add(near, 'h', fc[1].lt, dk ? '#7AE8F0' : '#A8EEF2');
  // shimmer lines on the pools
  var shm = ''; pools.forEach(function (p) { for (var q = 0; q < 3; q++) shm += seg(p.x - p.rx * (0.5 - q * 0.2), p.y - p.ry * 0.3 + q * 4, p.x - p.rx * (0.3 - q * 0.25), p.y - p.ry * 0.3 + q * 4); });
  stk(near, 's', shm, dk ? 'rgba(160,200,255,0.3)' : 'rgba(255,255,255,0.7)', 1.6);
  if (ANIM) { ANIM.glow = glow; ANIM.tips = tips.filter(function (t) { return t[1] > H * 0.08; }); ANIM.pools = pools; ANIM.yF = yF; ANIM.open = [ox, orx, ory];
    ANIM.lantern = [W * (ph ? 0.14 : 0.08), yF(W * (ph ? 0.14 : 0.08)) - 2]; ANIM.geode = [W * (ph ? 0.5 : 0.52), yF(W * (ph ? 0.5 : 0.52)) + H * (ph ? 0.08 : 0.1)]; ANIM.bat = tips.length ? tips[Math.floor(tips.length * 0.3)] : [W * 0.3, H * 0.2]; }
  else { var g = W * (ph ? 0.5 : 0.52), gy2 = yF(g) + H * (ph ? 0.08 : 0.1); add(near, 'b', ell(g, gy2 - 16, 22, 17)); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// 5. Postcard Plaza: a European town square with a cafe, a fountain and a tram stop.
SCENES.languages = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#18223E 0%,#2E2F58 55%,#6A4A5A 100%)' : 'linear-gradient(180deg,#BDDDF2 0%,#F4EEE2 60%,#F2D3B3 100%)';
  var yb = H * (ph ? 0.7 : 0.71);
  // far: rooftops, a dome and a bell tower, clouds
  var sil = '', x = -30; while (x < W + 30) { var w = 40 + rnd() * 50, h = H * (0.1 + rnd() * 0.1); sil += rect(x, yb - H * 0.2 - h, w, h + 40) + poly([[x - 4, yb - H * 0.2 - h], [x + w / 2, yb - H * 0.2 - h - w * 0.35], [x + w + 4, yb - H * 0.2 - h]]); x += w + rnd() * 16; }
  var dmx = W * (ph ? 0.2 : 0.3), dmy = yb - H * (ph ? 0.36 : 0.42), dr = ph ? 30 : 46, cmx = W * (ph ? 0.85 : 0.6);
  sil += rect(dmx - dr * 0.9, dmy, dr * 1.8, H * 0.3) + 'M' + PT(dmx - dr, dmy + 2) + ' Q' + PT(dmx - dr, dmy - dr * 1.1) + ' ' + PT(dmx, dmy - dr * 1.2) + ' Q' + PT(dmx + dr, dmy - dr * 1.1) + ' ' + PT(dmx + dr, dmy + 2) + ' Z ' + rect(dmx - 4, dmy - dr * 1.6, 8, dr * 0.5) + rect(dmx - 1, dmy - dr * 1.9, 2, dr * 0.4);
  sil += rect(cmx - 16, yb - H * (ph ? 0.4 : 0.5), 32, H * 0.5) + poly([[cmx - 20, yb - H * (ph ? 0.4 : 0.5)], [cmx, yb - H * (ph ? 0.47 : 0.58)], [cmx + 20, yb - H * (ph ? 0.4 : 0.5)]]);
  add(far, 'a', sil, dk ? '#3A3A66' : '#D8C8D8');
  add(far, 'b', rect(cmx - 9, yb - H * (ph ? 0.37 : 0.46), 7, 14) + rect(cmx + 2, yb - H * (ph ? 0.37 : 0.46), 7, 14) + circ(dmx, dmy + 16, 6), dk ? '#FFD98A' : '#B9A8C0');
  if (!dk) { var cl = ''; (ph ? [[0.2, 0.08, 0.6], [0.72, 0.16, 0.5]] : [[0.12, 0.12, 0.8], [0.45, 0.06, 0.6], [0.78, 0.14, 0.9]]).forEach(function (q) { cl += n5_cloud(W * q[0], H * q[1], q[2]); }); add(far, 'c', cl, 'rgba(255,255,255,0.88)'); }
  else add(far, 'c', circ(W * (ph ? 0.75 : 0.88), H * 0.1, 70), 'rgba(255,230,210,0.10)');
  // the houses around the square
  var FAC = dk ? ['#4A3E6A', '#5A4058', '#3E4A6A', '#5A4A50'] : ['#F2C9A0', '#F6E2B8', '#E8A898', '#CFE0D8'], fac = ['', '', '', ''], roof = '', trim = '', glass = '', shut = '', door = '', wins = [], rails = '', boxes = '', blooms = '';
  x = -20; var k = 0, tops = [];
  while (x < W + 10) {
    var bw = (ph ? 70 : 84) + rnd() * 30, fl = 4 + Math.floor(rnd() * 2), fh = ph ? 40 : 46, bh = fl * fh + 20, top = yb - bh, ci = k % 4;
    fac[ci] += rect(x, top, bw, bh + 2);
    roof += poly([[x - 4, top], [x + 6, top - 18], [x + bw - 6, top - 18], [x + bw + 4, top]]); if (k % 2) roof += rect(x + bw * 0.6, top - 30, 9, 14);
    if (k % 3 === 1) roof += poly([[x + bw * 0.3, top - 18], [x + bw * 0.5, top - 32], [x + bw * 0.7, top - 18]]);
    trim += rect(x - 2, top - 2, bw + 4, 4);
    var nc = 2, ww = bw * 0.2, gap = (bw - nc * ww) / 3;
    for (var r = 0; r < fl; r++) { var wy = top + 14 + r * fh, ground = r === fl - 1;
      for (var c = 0; c < nc; c++) { var wx = x + gap + c * (ww + gap);
        if (ground) { if (c === k % 2) door += n5_win(wx - 2, wy + 4, ww + 4, fh - 4, true); else { glass += n5_win(wx, wy + 8, ww, fh * 0.5, true); wins.push({x: wx, y: wy + 8, w: ww, h: fh * 0.5, k: rnd()}); } continue; }
        glass += rect(wx, wy + 4, ww, fh * 0.58); wins.push({x: wx, y: wy + 4, w: ww, h: fh * 0.58, k: rnd()});
        if ((k + r) % 2 === 0) shut += rect(wx - ww * 0.5 - 1, wy + 4, ww * 0.48, fh * 0.58) + rect(wx + ww + 1, wy + 4, ww * 0.48, fh * 0.58);
        trim += rect(wx - 3, wy + 4 + fh * 0.58, ww + 6, 3);
        if (r === 1 && k % 2 === 0) { var b0 = wx - 6, b1 = wx + ww + 6, by = wy + 4 + fh * 0.58; trim += rect(b0, by, b1 - b0, 3); for (var bq = b0; bq <= b1; bq += 4) rails += seg(bq, by, bq, by - 9); rails += seg(b0, by - 9, b1, by - 9); }
        else if ((r + c + k) % 3 === 0) { boxes += rrect(wx - 2, wy + 6 + fh * 0.58, ww + 4, 5, 2); for (var fq = 0; fq < 3; fq++) blooms += seg(wx + ww * (0.15 + fq * 0.35), wy + 3 + fh * 0.58, wx + ww * (0.15 + fq * 0.35) + 0.1, wy + 3 + fh * 0.58); } } }
    tops.push([x, top - 18, bw]); x += bw; k++;
  }
  for (var i = 0; i < 4; i++) add(mid, 'abcd'[i], fac[i], FAC[i]);
  add(mid, 'e', roof, dk ? '#6A3A44' : '#D2704E'); add(mid, 'f', trim, dk ? '#2A2448' : '#FFF8EE');
  add(mid, 'g', glass, dk ? '#262A50' : '#8FB8D8'); add(mid, 'h', shut + door, dk ? '#2E5050' : '#4E8A7A');
  stk(mid, 's', rails, dk ? '#1E1A36' : '#4A3A3A', 1.2); stk(mid, 't', blooms, dk ? '#E06A8A' : '#E8505B', 4.5); add(mid, 'f', boxes);
  // the plaza: cobbles and tram tracks
  add(refl, 'a', rect(-40, yb, W + 80, H - yb + 40), dk ? '#3A3450' : '#E6D6C0');
  var cob = ''; for (var yy = yb + 8, j = 0; yy < H + 10; yy += 7 + j * 1.6, j++) { var cw = 12 + j * 3; for (x = (j % 2) * cw * 0.5 - cw; x < W + cw; x += cw) cob += 'M' + PT(x + 1.5, yy) + ' q' + n1(cw / 2 - 1.5) + ' ' + n1(-3 - j * 0.3) + ' ' + n1(cw - 3) + ' 0 '; }
  stk(refl, 's', cob, dk ? 'rgba(20,16,40,0.35)' : 'rgba(150,120,90,0.32)', 1.2);
  var ty = yb + H * (ph ? 0.05 : 0.055); add(refl, 'b', rect(-40, ty - 2, W + 80, 5) + rect(-40, ty + 13, W + 80, 5), dk ? '#4A4462' : '#CDBBA4');
  stk(refl, 't', seg(-40, ty, W + 40, ty) + seg(-40, ty + 15, W + 40, ty + 15), dk ? '#8A86A8' : '#8A7A70', 2);
  // the cafe: awning over the left houses' ground floor, tables with parasols
  var cx0 = W * (ph ? -0.02 : 0.0), cx1 = W * (ph ? 0.42 : 0.3), aw = '', awS = '';
  aw += poly([[cx0, yb - (ph ? 52 : 60)], [cx1, yb - (ph ? 52 : 60)], [cx1 + 8, yb - (ph ? 36 : 40)], [cx0 - 8, yb - (ph ? 36 : 40)]]);
  for (x = cx0 + 8; x < cx1; x += 24) awS += poly([[x, yb - (ph ? 52 : 60)], [x + 12, yb - (ph ? 52 : 60)], [x + 12 + (x - cx0) * 0.02, yb - (ph ? 36 : 40)], [x + (x - cx0) * 0.02, yb - (ph ? 36 : 40)]]);
  for (x = cx0; x < cx1; x += 16) aw += 'M' + PT(x, yb - (ph ? 36 : 40)) + ' a8 8 0 0 0 16 0 Z ';
  var tables = [], tops2 = '', legs = '', para = '', paraS = '';
  (ph ? [[0.1, 0.92], [0.33, 0.86]] : [[0.06, 0.93], [0.2, 0.86], [0.31, 0.97]]).forEach(function (q, j) { var tx = W * q[0], tyy = H * q[1], s = ph ? 0.9 : 1.25 + (q[1] - 0.86) * 3;
    tops2 += ell(tx, tyy - 26 * s, 20 * s, 5 * s); legs += rect(tx - 1.5 * s, tyy - 26 * s, 3 * s, 26 * s) + ell(tx, tyy, 10 * s, 2.5 * s) + rrect(tx - 30 * s, tyy - 30 * s, 9 * s, 30 * s, 3 * s) + rrect(tx + 21 * s, tyy - 30 * s, 9 * s, 30 * s, 3 * s);
    para += rect(tx - 1.2 * s, tyy - 80 * s, 2.4 * s, 54 * s); var pt = tyy - 84 * s; paraS += 'M' + PT(tx - 42 * s, pt + 14 * s) + ' Q' + PT(tx, pt - 16 * s) + ' ' + PT(tx + 42 * s, pt + 14 * s) + ' Z ';
    tables.push({x: tx, y: tyy - 34 * s, s: s}); });
  add(near, 'a', aw, dk ? '#A8405A' : '#E8505B'); add(near, 'b', awS, dk ? '#E8D6E0' : '#FFFFFF');
  add(near, 'c', paraS, dk ? '#2E7A72' : '#4EB0A0'); add(near, 'd', tops2 + legs + para, dk ? '#E8DDF0' : '#FFFFFF');
  // the fountain in the middle of the square
  var fx = W * 0.5, fy = H * (ph ? 0.93 : 0.93), fr2 = ph ? 74 : 124;
  add(near, 'e', ell(fx, fy, fr2, fr2 * 0.2) + rect(fx - fr2, fy - fr2 * 0.24, fr2 * 2, fr2 * 0.24) + rect(fx - 8, fy - fr2 * 0.75, 16, fr2 * 0.55) + ell(fx, fy - fr2 * 0.75, fr2 * 0.42, fr2 * 0.09) + 'M' + PT(fx - fr2 * 0.42, fy - fr2 * 0.75) + ' Q' + PT(fx, fy - fr2 * 0.5) + ' ' + PT(fx + fr2 * 0.42, fy - fr2 * 0.75) + ' Z ' + rect(fx - 4, fy - fr2 * 0.98, 8, fr2 * 0.25) + circ(fx, fy - fr2 * 1.0, 7), dk ? '#8A86A8' : '#E8E2D8');
  add(near, 'f', ell(fx, fy - fr2 * 0.24, fr2, fr2 * 0.2), dk ? '#2E4A7A' : '#7FC4E0');
  add(near, 'g', ell(fx, fy - fr2 * 0.24, fr2 * 0.86, fr2 * 0.14) + ell(fx, fy - fr2 * 0.78, fr2 * 0.34, fr2 * 0.05), dk ? '#3E6AA0' : '#A8DCF0');
  // lamp posts and the tram stop
  var lamps = [], posts = '', LX = ph ? [0.3, 0.72] : [0.36, 0.64, 0.8];
  LX.forEach(function (f) { var lx = W * f, ly = H * (ph ? 0.86 : 0.85), lh = H * 0.2; posts += rect(lx - 2.5, ly - lh, 5, lh) + rrect(lx - 8, ly - 7, 16, 9, 2) + rect(lx - 12, ly - lh + 8, 24, 3) + poly([[lx - 11, ly - lh - 16], [lx, ly - lh - 27], [lx + 11, ly - lh - 16]]) + rect(lx - 10, ly - lh - 17, 20, 3) + rect(lx - 9, ly - lh + 1, 18, 3) + circ(lx, ly - lh - 28, 2.5); lamps.push({x: lx, y: ly - lh - 7}); });
  var sx = W * (ph ? 0.9 : 0.92), sy = H * (ph ? 0.86 : 0.85);
  posts += rect(sx - 2, sy - 90, 4, 90) + rect(sx + 24, sy - 60, 3, 60) + rect(sx + 70, sy - 60, 3, 60) + rect(sx + 20, sy - 64, 56, 5);
  add(near, 'h', posts, dk ? '#1E1A36' : '#3E4A5A');
  var lampsG = ''; lamps.forEach(function (l) { lampsG += rect(l.x - 6, l.y - 2, 12, 9); }); lampsG += circ(sx, sy - 98, 12);
  add(near, 'b', rrect(sx + 30, sy - 22, 36, 6, 2));
  var sign = circ(sx, sy - 98, 12);
  if (ANIM) { ANIM.tables = tables; ANIM.fountain = [fx, fy, fr2]; ANIM.lamps = lamps; ANIM.wins = wins; ANIM.track = ty; ANIM.yb = yb; ANIM.stop = [sx, sy]; ANIM.awn = [cx0, cx1, yb - (ph ? 60 : 68)]; ANIM.lampHeads = lampsG; }
  add(near, 'f', sign); add(near, 'g', rect(sx - 7, sy - 102, 14, 8));
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};


