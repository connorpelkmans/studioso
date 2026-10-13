// Batch n5 scenes: pride (Pride Parade), graduation (Graduation Day), birthday (Birthday Bash), geology (Crystal Cave)
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
  if (dk) add(far, 'c', circ(W * (ph ? 0.8 : 0.9), H * (ph ? 0.17 : 0.1), 70), 'rgba(255,220,240,0.10)');
  else { add(far, 'd', circ(W * (ph ? 0.8 : 0.9), H * (ph ? 0.17 : 0.1), 90), 'rgba(255,240,200,0.45)'); add(far, 'e', circ(W * (ph ? 0.8 : 0.9), H * (ph ? 0.17 : 0.1), 34), '#FFF4C8'); }
  if (!dk) { var cl = ''; (ph ? [[0.2, 0.12, 0.7], [0.75, 0.22, 0.55]] : [[0.12, 0.14, 1], [0.42, 0.08, 0.7], [0.7, 0.18, 0.9], [0.92, 0.1, 0.6]]).forEach(function (q) { cl += n5_cloud(W * q[0], H * q[1], q[2]); }); add(far, 'c', cl, 'rgba(255,255,255,0.85)'); }
  // the townhouses
  var FAC = dk ? ['#4D3B78', '#5A3A6E', '#3E4677', '#4E4470'] : ['#F7C6CF', '#FBE3A6', '#BFE3D0', '#C9C2EE'], ACC = dk ? '#2A2050' : '#FFFFFF';
  var sil = '', fac = ['', '', '', ''], awS = '', shut = '', boxes = '', blooms = '', rails = '', trim = '', glass = '', doors = '', roofs = '', aw = '', wins = [], flags = [], tops = [];
  x = ph ? -30 : -24; var k = 0;
  while (x < W + 10) {
    var bw = (ph ? 96 : 108) + rnd() * (ph ? 30 : 46), fl = 4 + Math.floor(rnd() * 3) + (ph ? 1 : 0), fh = (ph ? 46 : 52), bh = fl * fh + 26, top = yb - bh, ci = k % 4;
    fac[ci] += rect(x, top, bw, bh + 4); sil += rect(x - 4, top - 6, bw + 8, bh + 12);
    // cornice, roof or gable
    trim += rect(x - 4, top - 6, bw + 8, 8) + rect(x, top + 6, bw, 3);
    var rk = k % 3;
    var rf = rk === 0 ? poly([[x - 2, top - 6], [x + bw / 2, top - 6 - bw * 0.32], [x + bw + 2, top - 6]]) : rk === 1 ? rect(x + bw * 0.12, top - 22, bw * 0.76, 16) + rect(x + bw * 0.7, top - 34, 10, 14) : rect(x + 6, top - 14, bw - 12, 8);
    roofs += rf; sil += rf;
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
        if ((k + r + c) % 4 === 0 && !ground && r > 0) { boxes += rrect(wx - 3, wy + 6 + fh * 0.56, ww + 6, 6, 2); for (var fq = 0; fq < 4; fq++) blooms += seg(wx + ww * (0.1 + fq * 0.27), wy + 6.5 + fh * 0.56 + (fq % 2) * 1.2, wx + ww * (0.1 + fq * 0.27) + 0.1, wy + 6.5 + fh * 0.56 + (fq % 2) * 1.2); }
        if (r === 1 && rk === 2 && c === 0) { var bx0 = x + gap * 0.5, bx1 = x + bw - gap * 0.5, byy = wy + 4 + fh * 0.62; trim += rect(bx0, byy, bx1 - bx0, 3); for (var bq = bx0; bq <= bx1; bq += 5) rails += seg(bq, byy, bq, byy - 12); rails += seg(bx0, byy - 12, bx1, byy - 12); }
        wins.push({x: wx, y: wy + 4, w: ww, h: fh * 0.56, k: rnd(), arch: r === 0 && rk !== 2});
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
  // window boxes sit on the facade (mid), so the flags hung out in front of the facade cover them
  add(mid, 'h', boxes); stk(mid, 't', blooms, dk ? '#FF8FC8' : '#F2557E', 4.6);
  // the street: sidewalk, curb, road and a rainbow crosswalk
  add(refl, 'a', rect(-40, yc, W + 80, H - yc + 40), dk ? '#2C2648' : '#A49CB8');
  var lane = ''; for (x = 20; x < W; x += 90) lane += rect(x, yr + (H - 22 - yr) * 0.55, 44, 4);
  var cwx = W * (ph ? 0.08 : 0.56), cww = ph ? W * 0.84 : W * 0.34, n = 12, bwd = cww / n;
  for (i = 0; i < n; i++) { var xx = cwx + i * bwd; add(refl, 'cdefgh'[i % 6], poly([[xx + 4, yr + 6], [xx + bwd - 4, yr + 6], [xx + bwd - 12, H + 10], [xx - 4, H + 10]]), R[i % 6]); }
  add(refl, 'b', lane, dk ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)');
  var yf = H - (ph ? 18 : 22);
  // asphalt grain, a manhole cover and storm drains along the curb
  var grit = ''; spread(0, yr + 4, W, yf - yr - 8, 16, 9, rnd, 1).forEach(function (c) { if (c.q < 0.5) grit += seg(c.x, c.y, c.x + 0.1 + c.r * 2, c.y); });
  stk(refl, 's', grit, dk ? 'rgba(10,6,24,0.35)' : 'rgba(90,80,120,0.22)', 1.6);
  var mh = '', mx0 = W * (ph ? 0.5 : 0.3), my0 = yr + (yf - yr) * 0.78; if (!ph) mh += ell(mx0, my0, 22, 5.5);
  (ph ? [0.3, 0.86] : [0.2, 0.5, 0.95]).forEach(function (f) { mh += rrect(W * f - 12, yc + 4, 24, 4, 1.5); });
  add(near, 'g', mh, dk ? '#211B3A' : '#8E86A6');
  var mhl = ''; if (!ph) for (var q = -2; q <= 2; q++) mhl += seg(mx0 + q * (ph ? 5 : 7) - 2, my0 - 1.6, mx0 + q * (ph ? 5 : 7) + 2, my0 + 1.6);
  (ph ? [0.3, 0.86] : [0.2, 0.5, 0.95]).forEach(function (f) { for (var q2 = -8; q2 <= 8; q2 += 4) mhl += seg(W * f + q2, yc + 5, W * f + q2, yc + 7); });
  stk(near, 't', mhl, dk ? 'rgba(120,110,170,0.6)' : 'rgba(255,255,255,0.55)', 1.2);
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
    ANIM.sil = sil; ANIM.flags = flags; ANIM.lamps = lamps; ANIM.wins = wins; ANIM.yb = yb; ANIM.yc = yc; ANIM.yr = yr; ANIM.tops = tops;
    ANIM.roofFlags = tops.filter(function (q, j) { return j % 3 === 1; }).map(function (q) { return {x: q[0] + q[2] * 0.5, y: q[1], s: ph ? 0.75 : 0.9}; });
    ANIM.pots = (ph ? [0.32, 0.78] : [0.15, 0.35, 0.56, 0.77]).map(function (f) { return [W * f, yb + (yc - yb) * 0.55 - 26]; });
  }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// 2. Graduation Day: a grand campus quad. A wide main hall with a portico, grand steps and a clock tower at the back, brick colleges receding down both sides behind avenues of trees,
// spires beyond, a gate at the front, banners and bunting along the walk, and the graduating class standing on the lawn.
// a point on a facade that recedes in perspective: w = 0..1 along it in the world (near to far), f = fraction of its height
function n5_pp(B, w, f) { var u = w / (B.r * (1 - w) + w); return [B.x0 + (B.x1 - B.x0) * u, B.y0 + (B.y1 - B.y0) * u - f * (B.h0 + (B.h1 - B.h0) * u)]; }
function n5_pq(B, wa, wb, fa, fb) { return [n5_pp(B, wa, fa), n5_pp(B, wb, fa), n5_pp(B, wb, fb), n5_pp(B, wa, fb)]; }
// an arched window on a receding facade (path) and its outline points (for the night glow)
function n5_parch(B, wa, wb, fa, fb, ah) { var a = n5_pp(B, wa, fa), b = n5_pp(B, wb, fa), c = n5_pp(B, wb, fb), d = n5_pp(B, wa, fb), m = n5_pp(B, (wa + wb) / 2, fb + ah * 2); return 'M' + PT(a[0], a[1]) + ' L' + PT(d[0], d[1]) + ' Q' + PT(m[0], m[1]) + ' ' + PT(c[0], c[1]) + ' L' + PT(b[0], b[1]) + ' Z '; }
// a brick college building down the side of the quad: its long inner face, slate roof, dormers, chimneys, a white entrance
function n5_college(B, o) {
  var n = B.n, fl = B.fl, i, j;
  o.wall += poly(n5_pq(B, 0, 1, 0, 1));
  o.roof += poly(n5_pq(B, -0.02, 1.02, 1, 1.24));
  o.trim += poly(n5_pq(B, -0.02, 1.02, 0.965, 1.03)) + poly(n5_pq(B, 0, 1, 0, 0.05));
  for (j = 1; j < fl; j++) { var fbnd = 0.07 + j * 0.86 / fl; o.trim += poly(n5_pq(B, 0, 1, fbnd - 0.012, fbnd + 0.004)); }
  for (i = 0; i <= n; i++) o.shade += poly(n5_pq(B, i / n - 0.014, i / n + 0.014, 0.05, 0.965));
  var door = Math.floor(n / 2);
  for (i = 0; i < n; i++) {
    for (j = 0; j < fl; j++) {
      var wa = (i + 0.26) / n, wb = (i + 0.74) / n, fa = 0.1 + j * 0.86 / fl, fb = fa + 0.86 / fl * 0.6;
      if (i === door && j === 0) continue;
      o.glass += n5_parch(B, wa, wb, fa, fb, 0.03); o.trim += poly(n5_pq(B, wa - 0.03 / n, wb + 0.03 / n, fa - 0.014, fa));
      o.wins.push([n5_pp(B, wa, fa), n5_pp(B, wa, fb), n5_pp(B, (wa + wb) / 2, fb + 0.06), n5_pp(B, wb, fb), n5_pp(B, wb, fa)]);
    }
    // a dormer on every other bay
    if (i % 2 === 1) { var dm = (i + 0.5) / n; o.trim += poly([n5_pp(B, dm - 0.3 / n, 1.03), n5_pp(B, dm + 0.3 / n, 1.03), n5_pp(B, dm + 0.3 / n, 1.13), n5_pp(B, dm, 1.2), n5_pp(B, dm - 0.3 / n, 1.13)]); o.glass += poly(n5_pq(B, dm - 0.15 / n, dm + 0.15 / n, 1.05, 1.12)); }
  }
  [0.1, 0.9].forEach(function (cw) { o.wall += poly(n5_pq(B, cw - 0.022, cw + 0.022, 1.15, 1.36)); o.trim += poly(n5_pq(B, cw - 0.03, cw + 0.03, 1.34, 1.38)); });
  // the white entrance with a little pediment
  var da = (door + 0.18) / n, db = (door + 0.82) / n, fd = 0.86 / fl * 0.78 + 0.05;
  o.trim += poly(n5_pq(B, da - 0.04 / n, db + 0.04 / n, 0.05, fd + 0.02)) + poly([n5_pp(B, da - 0.1 / n, fd + 0.02), n5_pp(B, db + 0.1 / n, fd + 0.02), n5_pp(B, (da + db) / 2, fd + 0.11)]);
  o.door += n5_parch(B, da + 0.1 / n, db - 0.1 / n, 0.05, fd - 0.06, 0.025);
}
// the graduating class: rows standing on the lawn in perspective, kept off the walk and the gate. [{y, s, xs}], back row first
function n5_class(W, H, ph, y0, y1, half, gate) {
  var rows = [], n = 4, r, x;
  for (r = 0; r < n; r++) { var u = r / (n - 1), y = y0 + (y1 - y0) * Math.pow(u, 1.05), s = (ph ? 0.92 : 1.05) + u * (ph ? 0.32 : 0.55), sp = (ph ? 30 : 36) * s, xs = [], hw = half(y) + 13 * s;
    for (x = -sp * 0.3 + (r % 2) * sp * 0.5; x < W + sp; x += sp) { var xx = x + (hash(r * 17.3 + x * 0.13) - 0.5) * sp * 0.35;
      if (Math.abs(xx - gate.c) < hw) continue; if (gate.d && Math.abs(xx - gate.c) < gate.d + 17 * s) continue; if (hash(r * 5.1 + xx * 0.37) < 0.08) continue; xs.push(xx); }
    rows.push({y: y, s: s, xs: xs}); }
  return rows;
}
SCENES.graduation = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(3), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var yl = H * 0.6, cx = W * (ph ? 0.5 : 0.565), hw = ph ? W * 0.98 : W * 0.6, yp = (yl / H * 100).toFixed(1);
  var sky = dk ? 'linear-gradient(180deg,#121A36 0%,#1E2A52 ' + (yp * 0.55).toFixed(1) + '%,#3E4470 ' + yp + '%,#1E3A3A ' + yp + '%,#1A3434 100%)'
    : 'linear-gradient(180deg,#A9D2F2 0%,#D4E8F7 ' + (yp * 0.6).toFixed(1) + '%,#F1F6EC ' + yp + '%,#94CF80 ' + yp + '%,#80C26E 100%)';
  // far: distant spires and a dome beyond the quad, the tree line, clouds, the sun, the lawn's mown stripes
  var dist = '', ddet = '', tl = '', tl2 = '', x, r;
  function spire(x, b, w, h) { dist += rect(x - w / 2, b - h, w, h + 10) + poly([[x - w / 2 - 3, b - h], [x, b - h - w * 2.2], [x + w / 2 + 3, b - h]]); ddet += n5_win(x - w * 0.15, b - h + w * 0.5, w * 0.3, w * 0.9, true); }
  function dome(x, b, w, h) { dist += rect(x - w / 2, b - h, w, h + 10) + rect(x - w * 0.4, b - h - w * 0.22, w * 0.8, w * 0.22) + 'M' + PT(x - w * 0.42, b - h - w * 0.2) + ' Q' + PT(x - w * 0.42, b - h - w * 0.85) + ' ' + PT(x, b - h - w * 0.9) + ' Q' + PT(x + w * 0.42, b - h - w * 0.85) + ' ' + PT(x + w * 0.42, b - h - w * 0.2) + ' Z ' + rect(x - 2, b - h - w * 1.1, 4, w * 0.25);
    for (var q = 0; q < 4; q++) ddet += n5_win(x - w * 0.4 + q * w * 0.22, b - h + w * 0.18, w * 0.1, w * 0.3, true); }
  if (ph) { spire(W * 0.2, yl - H * 0.1, 18, H * 0.12); dome(W * 0.8, yl - H * 0.1, 56, H * 0.06); }
  else { spire(W * 0.11, yl - H * 0.12, 26, H * 0.26); spire(W * 0.165, yl - H * 0.1, 18, H * 0.2); spire(W * 0.36, yl - H * 0.12, 22, H * 0.22); dome(W * 0.83, yl - H * 0.1, 92, H * 0.12); spire(W * 0.96, yl - H * 0.1, 22, H * 0.26); }
  add(far, 'a', dist, dk ? '#2E3C6E' : '#B9C6E2'); add(far, 'b', ddet, dk ? 'rgba(255,214,150,0.45)' : '#9EADD0');
  for (x = -40; x < W + 60; x += 34 + rnd() * 28) { r = 22 + rnd() * 24; tl += m5_circW(x, yl - r * 0.5 - rnd() * 16, r); }
  for (x = -20; x < W + 60; x += 46 + rnd() * 26) { r = 18 + rnd() * 16; tl2 += m5_circW(x, yl - r * 0.25, r); }
  add(far, 'c', tl + rect(-40, yl - 26, W + 80, 34), dk ? '#22305A' : '#B4D2B0'); add(far, 'd', tl2, dk ? '#283A60' : '#9CC598');
  if (!dk) { var cl = ''; (ph ? [[0.16, 0.08, 0.55], [0.74, 0.16, 0.5]] : [[0.08, 0.12, 0.85], [0.33, 0.05, 0.65], [0.7, 0.14, 0.7], [0.92, 0.05, 0.6]]).forEach(function (q) { cl += n5_cloud(W * q[0], H * q[1], q[2]); }); add(far, 'e', cl, 'rgba(255,255,255,0.92)');
    var SN = ph ? [W * 0.84, H * 0.07] : [W * 0.2, H * 0.09]; add(far, 'f', circ(SN[0], SN[1], 76), 'rgba(255,248,210,0.5)'); add(far, 'g', circ(SN[0], SN[1], 28), '#FFF6CC'); }
  var stripes = ''; for (x = -W; x < W * 2; x += 110) stripes += poly([[x, yl], [x + 55, yl], [x + 55 + (x + 27 - cx) * 1.1, H + 10], [x + (x + 27 - cx) * 1.1, H + 10]]);
  add(far, 'h', stripes, dk ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.13)');
  // refl: the main hall
  var cw = hw * 0.36, wh = H * (ph ? 0.12 : 0.17), bh = H * (ph ? 0.175 : 0.25), pv = hw * (ph ? 0.1 : 0.085);
  var L0 = cx - hw / 2, L1 = cx - cw / 2, R0 = cx + cw / 2, R1 = cx + hw / 2, top = yl - bh, wt = yl - wh, pvt = yl - wh * 1.22;
  var stone = rect(L0, wt, hw, wh + 2) + rect(L1, top, cw, bh + 2) + rect(L0, pvt, pv, wh * 1.22 + 2) + rect(R1 - pv, pvt, pv, wh * 1.22 + 2);
  var shade = rect(L1 - 5, top, 5, bh) + rect(R0, top, 6, bh) + rect(L0 + pv, wt, 4, wh) + rect(R1 - pv - 4, wt, 4, wh) + rect(L0, yl - 7, hw, 7);
  var roof = poly([[L0 + pv, wt], [L0 + pv + 10, wt - wh * 0.26], [L1, wt - wh * 0.26], [L1, wt]]) + poly([[R0, wt], [R0, wt - wh * 0.26], [R1 - pv - 10, wt - wh * 0.26], [R1 - pv, wt]]);
  var white = rect(L0 - 3, wt - 4, hw + 6, 6) + rect(L0 - 4, pvt - 5, pv + 8, 7) + rect(R1 - pv - 4, pvt - 5, pv + 8, 7) + rect(L1 - 5, top - 7, cw + 10, 9) + rect(L0 - 3, yl - 10, hw + 6, 5);
  var copper = poly([[L0 - 2, pvt - 5], [L0 + pv * 0.22, pvt - 5 - pv * 0.5], [L0 + pv * 0.78, pvt - 5 - pv * 0.5], [L0 + pv + 2, pvt - 5]]) + poly([[R1 - pv - 2, pvt - 5], [R1 - pv * 0.78, pvt - 5 - pv * 0.5], [R1 - pv * 0.22, pvt - 5 - pv * 0.5], [R1 + 2, pvt - 5]]);
  var glass = '', door = '', ivy = '', wins = [], bal = '';
  // balustrades along the wing roofs
  [[L0 + pv + 4, L1 - 4], [R0 + 4, R1 - pv - 4]].forEach(function (s) { white += rect(s[0], wt - 4 - wh * 0.1, s[1] - s[0], 3); for (var q = s[0] + 3; q < s[1] - 2; q += 7) bal += seg(q, wt - 4, q, wt - 3 - wh * 0.1); });
  // wing windows: two rows of tall arched windows, pilasters between them
  [[L0 + pv, L1], [R0, R1 - pv]].forEach(function (w) { var n = Math.max(2, Math.floor((w[1] - w[0]) / (ph ? 24 : 34))), sp = (w[1] - w[0]) / n, ww = sp * 0.46;
    for (var i = 0; i < n; i++) { if (i) shade += rect(w[0] + sp * i - 2, wt + 2, 4, wh - 9);
      for (var j = 0; j < 2; j++) { var wx = w[0] + sp * (i + 0.5) - ww / 2, wy = wt + wh * (0.12 + j * 0.45), whh = wh * 0.32; glass += n5_win(wx, wy, ww, whh, true); white += rect(wx - 2, wy + whh, ww + 4, 2.5); wins.push({x: wx, y: wy, w: ww, h: whh, k: rnd()}); } } });
  // the end pavilions: one tall window and a round one
  [L0 + pv / 2, R1 - pv / 2].forEach(function (px) { var ww = pv * 0.36, wy = pvt + wh * 0.42, whh = wh * 0.62; glass += n5_win(px - ww / 2, wy, ww, whh, true) + circ(px, pvt + wh * 0.22, pv * 0.13); white += rect(px - ww / 2 - 3, wy + whh, ww + 6, 3); wins.push({x: px - ww / 2, y: wy, w: ww, h: whh, k: rnd()}); });
  // portico: columns, entablature, pediment with a gold crest
  var pw = cw * 0.9, nc = ph ? 4 : 6, colH = bh * 0.66, cTop = yl - 10 - colH, pedH = pw * 0.17, cols = [];
  for (var i = 0; i < nc; i++) { var px = cx - pw / 2 + (i + 0.5) * pw / nc, cwd = pw / nc * 0.34; cols.push(px); white += rect(px - cwd / 2, cTop, cwd, colH) + rect(px - cwd * 0.8, cTop - 4, cwd * 1.6, 5) + rect(px - cwd * 0.75, yl - 14, cwd * 1.5, 5); shade += rect(px + cwd * 0.18, cTop + 1, cwd * 0.32, colH - 2); }
  white += rect(cx - pw / 2 - 8, cTop - 14, pw + 16, 11) + poly([[cx - pw / 2 - 12, cTop - 14], [cx, cTop - 14 - pedH], [cx + pw / 2 + 12, cTop - 14]]);
  var tymp = poly([[cx - pw / 2 + 4, cTop - 17], [cx, cTop - 14 - pedH + 6], [cx + pw / 2 - 4, cTop - 17]]);
  var gold = circ(cx, cTop - 14 - pedH * 0.38, pedH * 0.22);
  door += n5_win(cx - pw * 0.08, yl - 10 - colH * 0.64, pw * 0.16, colH * 0.64, true);
  glass += n5_win(cx - pw * 0.31, yl - 10 - colH * 0.52, pw * 0.09, colH * 0.4, true) + n5_win(cx + pw * 0.22, yl - 10 - colH * 0.52, pw * 0.09, colH * 0.4, true);
  wins.push({x: cx - pw * 0.31, y: yl - 10 - colH * 0.52, w: pw * 0.09, h: colH * 0.4, k: 0.1}, {x: cx + pw * 0.22, y: yl - 10 - colH * 0.52, w: pw * 0.09, h: colH * 0.4, k: 0.2});
  // attic and the clock tower with a belfry and a copper dome
  var at = top - 7 - bh * 0.08; stone += rect(cx - cw * 0.3, at, cw * 0.6, bh * 0.08 + 2); white += rect(cx - cw * 0.32, at - 4, cw * 0.64, 5);
  var tw = cw * (ph ? 0.34 : 0.3), th = H * (ph ? 0.1 : 0.11), tt = at - 4 - th, ck = tw * 0.34, cky = tt + th * 0.42;
  stone += rect(cx - tw / 2, tt, tw, th + 4); shade += rect(cx + tw / 2 - 5, tt, 5, th + 4);
  white += rect(cx - tw / 2 - 5, tt - 5, tw + 10, 7) + rect(cx - tw / 2 - 3, tt + th * 0.08, tw + 6, 3);
  var bel = tt - tw * 0.72; stone += rect(cx - tw * 0.4, bel, tw * 0.8, tw * 0.72); glass += n5_win(cx - tw * 0.26, bel + tw * 0.12, tw * 0.2, tw * 0.48, true) + n5_win(cx + tw * 0.06, bel + tw * 0.12, tw * 0.2, tw * 0.48, true);
  white += rect(cx - tw * 0.46, bel - 4, tw * 0.92, 6) + rect(cx - tw * 0.44, bel + tw * 0.62, tw * 0.88, 3);
  var dtop = bel - 4 - tw * 0.62, cup = 'M' + PT(cx - tw * 0.42, bel - 3) + ' Q' + PT(cx - tw * 0.44, dtop + tw * 0.06) + ' ' + PT(cx, dtop) + ' Q' + PT(cx + tw * 0.44, dtop + tw * 0.06) + ' ' + PT(cx + tw * 0.42, bel - 3) + ' Z ';
  white += rect(cx - tw * 0.1, dtop - tw * 0.2, tw * 0.2, tw * 0.22); var lant = 'M' + PT(cx - tw * 0.13, dtop - tw * 0.19) + ' Q' + PT(cx, dtop - tw * 0.36) + ' ' + PT(cx + tw * 0.13, dtop - tw * 0.19) + ' Z ';
  var face = circ(cx, cky, ck + 3);
  // the grand steps, wide at the bottom
  var stp = '', stS = ''; for (var s = 0; s < 5; s++) { var sw2 = pw + 26 + s * (ph ? 12 : 20), sy2 = yl - 5 + s * 5; stp += rect(cx - sw2 / 2, sy2, sw2, 5); stS += rect(cx - sw2 / 2, sy2 + 3.6, sw2, 1.4); }
  var ysb = yl + 20;
  ivy += m5_circW(L0 + pv + 10, yl - 18, 14) + m5_circW(L0 + pv + 6, yl - 38, 11) + m5_circW(L0 + pv + 20, yl - 30, 9) + m5_circW(R1 - pv - 12, yl - 22, 14) + m5_circW(R1 - pv - 6, yl - 42, 10) + m5_circW(R1 - pv - 22, yl - 32, 9);
  ivy += m5_circW(L1 - 14, yl - 6, 13) + m5_circW(L1 - 28, yl - 4, 10) + m5_circW(R0 + 14, yl - 6, 13) + m5_circW(R0 + 28, yl - 4, 10);
  add(refl, 'a', stone, dk ? '#4E4C7C' : '#EED9B8'); add(refl, 'b', shade + stS, dk ? 'rgba(14,14,44,0.32)' : 'rgba(150,100,60,0.16)'); add(refl, 'c', roof, dk ? '#2C3358' : '#7384AE');
  add(refl, 'd', white + face + stp, dk ? '#CBC9E8' : '#FFFDF6'); add(refl, 'e', glass, dk ? '#262C52' : '#93B8DA'); add(refl, 'f', copper + cup + lant + tymp, dk ? '#4E8A7E' : '#7CC4AC');
  add(refl, 'g', door, dk ? '#3A2A40' : '#9A5A3E'); add(refl, 'h', ivy + gold, dk ? '#2E5A4E' : '#6CB070');
  stk(refl, 's', seg(cx, dtop - tw * 0.34, cx, dtop - tw * 0.34 - (ph ? 22 : 30)), dk ? '#C9B26A' : '#C9962A', 2.2); stk(refl, 't', bal, dk ? '#CBC9E8' : '#FFFDF6', 2.2);
  // mid: the brick colleges down both sides of the quad, and the hedges at their feet
  var co = {wall: '', roof: '', trim: '', shade: '', glass: '', door: '', wins: []}, yb0 = H * (ph ? 0.715 : 0.745), hedge = '';
  var CB = ph ? [{x0: -16, x1: W * 0.14, y0: yb0, y1: yl + 14, h0: H * 0.3, h1: wh * 1.15, n: 3, fl: 3}, {x0: W + 16, x1: W * 0.86, y0: yb0, y1: yl + 14, h0: H * 0.3, h1: wh * 1.15, n: 3, fl: 3}]
    : [{x0: -24, x1: W * 0.255, y0: yb0, y1: yl + 16, h0: H * 0.42, h1: wh * 1.1, n: 6, fl: 3}, {x0: W + 24, x1: W * 0.885, y0: yb0, y1: yl + 16, h0: H * 0.42, h1: wh * 1.1, n: 4, fl: 3}];
  CB.forEach(function (B) { B.r = B.h1 / B.h0; n5_college(B, co); for (var q = 0; q <= 14; q++) { var p = n5_pp(B, q / 14, 0), hs = (B.h0 + (B.h1 - B.h0) * (p[0] - B.x0) / (B.x1 - B.x0)) / B.h0; hedge += m5_circW(p[0], p[1] - 2 * hs, 13 * hs * (ph ? 0.7 : 1)); } hedge += poly([n5_pp(B, 0, 0), n5_pp(B, 1, 0), [n5_pp(B, 1, 0)[0], n5_pp(B, 1, 0)[1] + 6], [n5_pp(B, 0, 0)[0], n5_pp(B, 0, 0)[1] + 14]]); });
  add(mid, 'a', co.wall, dk ? '#6A4468' : '#E8A98F'); add(mid, 'b', co.shade, dk ? 'rgba(20,10,40,0.28)' : 'rgba(150,60,40,0.16)'); add(mid, 'c', co.roof, dk ? '#2A2F54' : '#6E7EA8');
  add(mid, 'd', co.trim, dk ? '#C9C4E2' : '#FFF8EE'); add(mid, 'e', co.glass, dk ? '#262C52' : '#93B8DA'); add(mid, 'f', co.door, dk ? '#3A2A40' : '#2E4A8A'); add(mid, 'g', hedge, dk ? '#22463E' : '#5FA866');
  // near: the walk, a cross path, avenues of trees, banner poles, lamps and the gate
  var half0 = pw * 0.3, half1 = W * (ph ? 0.15 : 0.085); function half(y) { return half0 + (half1 - half0) * Math.max(0, (y - ysb) / (H - ysb)); }
  var walk = poly([[cx - half0, ysb], [cx + half0, ysb], [cx + half1 + 10, H + 12], [cx - half1 - 10, H + 12]]), edge = '';
  var yc = yl + (H - yl) * (ph ? 0.2 : 0.22), ch2 = ph ? 9 : 13;
  function baseX(B, y) { var u = (y - B.y0) / (B.y1 - B.y0); return B.x0 + (B.x1 - B.x0) * u; }
  var xl0 = baseX(CB[0], yc - ch2), xl1 = baseX(CB[0], yc + ch2), xr0 = baseX(CB[1], yc - ch2), xr1 = baseX(CB[1], yc + ch2);
  walk += poly([[xl0 + 8, yc - ch2], [xr0 - 8, yc - ch2], [xr1 - 8, yc + ch2], [xl1 + 8, yc + ch2]]);
  edge += poly([[xl1 + 8, yc + ch2], [xr1 - 8, yc + ch2], [xr1 - 8, yc + ch2 + 3], [xl1 + 8, yc + ch2 + 3]]) + poly([[cx - half0, ysb], [cx - half0 + 3, ysb], [cx - half1 - 7, H + 12], [cx - half1 - 10, H + 12]]) + poly([[cx + half0 - 3, ysb], [cx + half0, ysb], [cx + half1 + 10, H + 12], [cx + half1 + 7, H + 12]]);
  // trees and lamps along both colleges
  var trunks = '', crowns = '', hi = '', iron = '', globes = '', lamps = [], brick = '', goldN = '';
  CB.forEach(function (B, bi) { var dir = bi ? -1 : 1, TW = ph ? [0.18, 0.62] : [0.1, 0.4, 0.7];
    TW.forEach(function (w, q) { var p = n5_pp(B, w, 0), sc = (B.h0 + (B.h1 - B.h0) * (p[0] - B.x0) / (B.x1 - B.x0)) / B.h0 * (ph ? 1.05 : 1.55), tx = p[0] + dir * 22 * sc, ty = p[1] + 12 * sc;
      trunks += poly([[tx - 4 * sc, ty], [tx - 2.6 * sc, ty - 34 * sc], [tx + 2.6 * sc, ty - 34 * sc], [tx + 4 * sc, ty]]); crowns += n5_tree(tx, ty - 18 * sc, sc * 1.05); hi += m5_circW(tx - 8 * sc, ty - 76 * sc, 9 * sc) + m5_circW(tx + 11 * sc, ty - 66 * sc, 7 * sc);
      if (q < TW.length - 1 || ph) { var w2 = w + (ph ? 0.22 : 0.15), p2 = n5_pp(B, w2, 0), s2 = (B.h0 + (B.h1 - B.h0) * (p2[0] - B.x0) / (B.x1 - B.x0)) / B.h0 * (ph ? 1.05 : 1.5), lx = p2[0] + dir * 26 * s2, ly = p2[1] + 12 * s2;
        iron += rect(lx - 1.4 * s2, ly - 40 * s2, 2.8 * s2, 40 * s2) + rect(lx - 4 * s2, ly - 3 * s2, 8 * s2, 3 * s2) + rect(lx - 4.5 * s2, ly - 41 * s2, 9 * s2, 2 * s2) + poly([[lx - 3 * s2, ly - 51 * s2], [lx + 3 * s2, ly - 51 * s2], [lx, ly - 55 * s2]]);
        globes += rrect(lx - 3.4 * s2, ly - 50 * s2, 6.8 * s2, 9 * s2, 2 * s2); lamps.push([lx, ly - 45.5 * s2, s2]); } }); });
  // banner poles along the walk
  var poles = '', bans = [];
  (ph ? [0.05, 0.17] : [0.08, 0.3]).forEach(function (d, j) { var by = ysb + (H - ysb) * d, sc = 0.75 + d * 1.1; [-1, 1].forEach(function (sd) { var bx = cx + sd * (half(by) + 16 * sc), bhh = H * (ph ? 0.1 : 0.15) * sc;
    iron += rect(bx - 1.6 * sc, by - bhh, 3.2 * sc, bhh) + rect(bx - 3.2 * sc, by - 3, 6.4 * sc, 3); goldN += circ(bx, by - bhh - 3 * sc, 3.4 * sc); bans.push({x: bx, y: by - bhh + 5 * sc, h: bhh * 0.55, w: (ph ? 17 : 22) * sc, k: j * 2 + (sd + 1) / 2, s: sc}); }); });
  // the gate: brick pillars with lamps and an iron arch over the walk
  var gc = cx, gy = H * (ph ? 0.965 : 0.995), gd = half1 + (ph ? 26 : 34), gph = H * (ph ? 0.15 : 0.2), gpw = ph ? 22 : 30, arch = '';
  if (!ph) [-1, 1].forEach(function (sd) { var px = gc + sd * gd; brick += rect(px - gpw / 2, gy - gph, gpw, gph + 20); edge += rect(px - gpw / 2 - 4, gy - gph - 7, gpw + 8, 8) + rect(px - gpw / 2 - 2, gy - gph * 0.42, gpw + 4, 4) + rect(px - gpw / 2 - 3, gy - 6, gpw + 6, 8);
    goldN += circ(px, gy - gph * 0.7, gpw * 0.2); iron += rect(px - 2, gy - gph - 19, 4, 12); globes += circ(px, gy - gph - 24, gpw * 0.26); lamps.push([px, gy - gph - 24, gpw / 16]); });
  var ay = gy - gph - 4, aTop = ay - (ph ? 26 : 38); arch = 'M' + PT(gc - gd, ay) + ' Q' + PT(gc, aTop - (ph ? 26 : 36)) + ' ' + PT(gc + gd, ay) + ' M' + PT(gc - gd, ay + 10) + ' Q' + PT(gc, aTop - (ph ? 14 : 20)) + ' ' + PT(gc + gd, ay + 10) + ' ';
  for (var q = 1; q < 8; q++) { var u = q / 8, ax = gc - gd + 2 * gd * u, a1 = ay + (aTop - (ph ? 26 : 36) - ay) * 2 * u * (1 - u) * 1, a2 = ay + 10 + (aTop - (ph ? 14 : 20) - ay - 10) * 2 * u * (1 - u); arch += seg(ax, a1, ax, a2); }
  goldN += ph ? '' : circ(gc, aTop - 8, 11);
  add(near, 'a', walk, dk ? '#3A4462' : '#F1E6CC'); add(near, 'b', edge + globes, dk ? '#C9C4E2' : '#FFF8EA'); add(near, 'c', trunks, dk ? '#3A2E4A' : '#8A6A50');
  add(near, 'd', crowns, dk ? '#1F3A4A' : '#5FA866'); add(near, 'e', hi, dk ? '#2A4A58' : '#8CCB7E'); add(near, 'f', iron, dk ? '#8E8AB0' : '#3E4868');
  add(near, 'g', brick, dk ? '#6A4468' : '#D98C74'); add(near, 'h', goldN, dk ? '#E8C25A' : '#F2B83A');
  if (!ph) stk(near, 's', arch, dk ? '#8E8AB0' : '#3E4868', 3);
  var rows = n5_class(W, H, ph, H * (ph ? 0.72 : 0.755), H * (ph ? 0.915 : 0.985), half, {c: gc, d: ph ? 0 : gd + gpw / 2, y: gy});
  if (!ANIM) { var gw = '', hd = ''; rows.forEach(function (R) { R.xs.forEach(function (x) { var s = R.s; gw += poly([[x - 6 * s, R.y - 27 * s], [x + 6 * s, R.y - 27 * s], [x + 11 * s, R.y], [x - 11 * s, R.y]]) + poly([[x - 11 * s, R.y - 44 * s], [x, R.y - 47 * s], [x + 11 * s, R.y - 44 * s], [x, R.y - 41 * s]]); hd += circ(x, R.y - 35 * s, 8 * s); }); });
    add(near, 'f', gw); add(near, 'b', hd); }
  if (ANIM) { ANIM.rows = rows; ANIM.bans = bans; ANIM.clock = [cx, cky, ck]; ANIM.wins = wins; ANIM.swins = co.wins; ANIM.lamps = lamps; ANIM.yl = yl; ANIM.cx = cx; ANIM.ysb = ysb;
    ANIM.steps = [cx - (pw + 26 + 4 * (ph ? 12 : 20)) / 2, cx + (pw + 26 + 4 * (ph ? 12 : 20)) / 2, yl + 20]; ANIM.flag = [cx, dtop - tw * 0.34 - (ph ? 22 : 30)]; ANIM.hb = [[cols[0], cols[1]], [cols[nc - 2], cols[nc - 1]]].map(function (p) { return {x: (p[0] + p[1]) / 2, y: cTop + 2, w: (p[1] - p[0]) * 0.5, h: colH * 0.56}; }); }
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
  // picture frames on the wall, under the banner, each with a little painting (hills and a sun, a heart or a balloon)
  var fr = '', pic = '', art = '', dabs = '';
  (ph ? [[0.12, 0.33, 44, 54, 0], [0.3, 0.32, 34, 34, 1]] : [[0.3, 0.38, 60, 74, 0], [0.39, 0.37, 40, 40, 1], [0.86, 0.4, 70, 52, 0], [0.62, 0.38, 44, 56, 2]]).forEach(function (q) { var fx = W * q[0], fy = H * q[1], pw = q[2], phh = q[3]; fr += rrect(fx - pw / 2 - 5, fy - phh / 2 - 5, pw + 10, phh + 10, 3); pic += rect(fx - pw / 2, fy - phh / 2, pw, phh);
    if (q[4] === 0) { art += poly([[fx - pw / 2, fy + phh / 2], [fx - pw / 2, fy + phh * 0.12], [fx - pw * 0.15, fy - phh * 0.02], [fx + pw * 0.2, fy + phh * 0.18], [fx + pw / 2, fy + phh * 0.04], [fx + pw / 2, fy + phh / 2]]); dabs += seg(fx + pw * 0.2, fy - phh * 0.24, fx + pw * 0.2 + 0.1, fy - phh * 0.24); }
    else if (q[4] === 1) art += 'M' + PT(fx, fy + phh * 0.3) + ' C' + PT(fx - pw * 0.5, fy) + ' ' + PT(fx - pw * 0.25, fy - phh * 0.42) + ' ' + PT(fx, fy - phh * 0.12) + ' C' + PT(fx + pw * 0.25, fy - phh * 0.42) + ' ' + PT(fx + pw * 0.5, fy) + ' ' + PT(fx, fy + phh * 0.3) + ' Z ';
    else { art += ell(fx, fy - phh * 0.08, pw * 0.24, phh * 0.22) + poly([[fx - 3, fy + phh * 0.16], [fx + 3, fy + phh * 0.16], [fx, fy + phh * 0.1]]); dabs += 'M' + PT(fx, fy + phh * 0.16) + ' q-4 6 0 10 t0 10 '; } });
  add(refl, 'g', fr, dk ? '#B88A50' : '#E0A85A'); add(refl, 'h', pic, dk ? '#2E4262' : '#CDEBDD');
  add(mid, 'h', art, dk ? '#C2508A' : '#F28AB0'); stk(mid, 't', dabs, dk ? '#FFD86B' : '#FFC93A', 7);
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
  add(mid, 'c', rect(lx - 2, yf - lh, 4, lh + 8) + ell(lx, yf + 8, 16, 4) + rrect(sx - sw / 2 - 8, sy - 3, 6, 9, 2) + rrect(sx + sw / 2 + 2, sy - 3, 6, 9, 2) + rrect(sx - 4, sy - 3, 6, 8, 2), dk ? '#2A1E36' : '#6A5060');
  // seams on the seat and the back, and buttons on the back
  var sm = seg(sx - sw / 2 + 14, sy - sh * 0.22, sx + sw / 2 - 14, sy - sh * 0.22) + seg(sx, sy - sh * 0.55, sx, sy - sh * 0.24); for (var bi = 1; bi < 6; bi++) sm += seg(sx - sw / 2 + sw * bi / 6, sy - sh * 0.8, sx - sw / 2 + sw * bi / 6 + 0.1, sy - sh * 0.8);
  stk(mid, 's', sm, dk ? 'rgba(20,40,50,0.35)' : 'rgba(60,130,120,0.3)', 2.2);
  add(mid, 'd', poly([[lx - 22, yf - lh + 4], [lx - 14, yf - lh - 34], [lx + 14, yf - lh - 34], [lx + 22, yf - lh + 4]]), dk ? '#FFD98A' : '#FFE7A8');
  // the party table with a cake stand (the cake and candles are drawn by the engine)
  var tx = W * (ph ? 0.2 : 0.14), tw2 = ph ? 120 : 200, ty = H * (ph ? 0.86 : 0.83);
  add(mid, 'e', rect(tx - tw2 * 0.4, ty, 6, H * 0.12) + rect(tx + tw2 * 0.4 - 6, ty, 6, H * 0.12) + rect(tx - 3, ty - 10, 6, 10) + ell(tx, ty - 10, 22, 4), dk ? '#7A5060' : '#B07A4E');
  var cloth = rrect(tx - tw2 / 2, ty - 4, tw2, 30, 6), sc = '', nsc = Math.round(tw2 / 14), scw = tw2 / nsc; for (var si = 0; si < nsc; si++) { x = tx - tw2 / 2 + si * scw; sc += 'M' + PT(x, ty + 24) + ' a' + n1(scw / 2) + ' ' + n1(scw / 2) + ' 0 0 0 ' + n1(scw) + ' 0 Z '; }
  add(mid, 'f', cloth + sc, dk ? '#E8DDF2' : '#FFFFFF'); add(mid, 'g', rect(tx - tw2 / 2, ty + 14, tw2, 4), dk ? '#C2508A' : '#F49AB8');
  // the gift pile (the top gift is the engine's)
  var gx = W * (ph ? 0.6 : 0.68), gy = H * (ph ? 0.95 : 0.94), G = [[gx - 52, gy, 62, 46, 'a'], [gx + 16, gy, 72, 56, 'b'], [gx + 74, gy, 44, 36, 'c'], [gx - 56, gy - 46 - 12, 40, 30, 'd']].map(function (q) { var s = ph ? 0.75 : 1; return [gx + (q[0] - gx) * s, q[1], q[2] * s, q[3] * s, q[4]]; });
  var ribs = '', bows = '', gs = ell(gx + 10, gy, W * (ph ? 0.2 : 0.1), 7);
  G.forEach(function (q) { var g = n5_gift(q[0], q[1], q[2], q[3]); add(near, q[4], g.box + g.lid); ribs += g.rib; if (q[4] === 'c' || q[4] === 'd') bows += g.bow; });
  add(refl, 'f', gs + ell(tx, H * 0.97, tw2 * 0.6, 6) + ell(sx, sy + 2, sw * 0.55, 6), dk ? 'rgba(10,0,20,0.3)' : 'rgba(160,90,90,0.16)');
  near.a.c = dk ? '#4E86C8' : '#7FC8F0'; near.b.c = dk ? '#D8A63A' : '#FFD45A'; near.c.c = dk ? '#3EA08A' : '#7FD8B8'; near.d.c = dk ? '#C04E86' : '#F48AB0';
  add(near, 'e', ribs, dk ? '#F2E6FF' : '#FFFFFF'); add(near, 'f', bows, dk ? '#FFD86B' : '#F0507A');
  // a potted plant by the sofa and confetti on the floor
  var px = W * (ph ? 0.92 : 0.29), py = yf + 26;
  add(near, 'g', poly([[px - 16, py - 26], [px + 16, py - 26], [px + 12, py], [px - 12, py]]), dk ? '#B0607A' : '#E58A6A');
  var lv = ''; [-50, -20, 10, 40, -80, 70].forEach(function (a, j) { lv += leaf(px, py - 26, 34 + (j % 2) * 10, 7, -90 + a); }); add(near, 'h', lv, dk ? '#3E8A6E' : '#5DB87A');
  // confetti on the floor in two colours (short thick dashes)
  var fc = ['', '']; spread(0, yf + 10, W, H - yf - 10, 40, 22, rnd, 1).forEach(function (c, j) { if (c.q < 0.4) { var a = c.r * Math.PI; fc[j % 2] += seg(c.x, c.y, c.x + Math.cos(a) * 3, c.y + Math.sin(a) * 1.4); } });
  stk(refl, 's', fc[0], dk ? 'rgba(255,143,200,0.55)' : 'rgba(242,110,160,0.55)', 2.6); stk(refl, 't', fc[1], dk ? 'rgba(127,224,200,0.5)' : 'rgba(90,190,200,0.5)', 2.6);
  if (ANIM) { ANIM.yf = yf; ANIM.win = [wx0, wy0, wx1, wy1]; ANIM.cake = [tx, ty - 4, ph ? 0.85 : 1.3]; var gs2 = ph ? 0.75 : 1; ANIM.gift = [gx + 16 * gs2, gy - 69.4 * gs2, 50 * gs2, 40 * gs2];
    ANIM.lamp = [lx, yf - lh - 14]; ANIM.table = [tx, ty]; ANIM.gifts = [gx, gy]; ANIM.sofa = [sx, sy - sh, sw]; }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};

// 4. Crystal Cave: layered rock walls, a hole in the roof, still pools and clusters of glowing crystals.
// a cluster of crystal points standing on (x, y); returns the dark and light facets and the tips
function n5_crys(x, y, s, ang, n, rnd) {
  var o = {dk: '', lt: '', tips: [], ridge: '', base: []};
  for (var i = 0; i < n; i++) { var a = (ang + (i - (n - 1) / 2) * 22 + (rnd() - 0.5) * 14) * Math.PI / 180, L = s * (i === Math.floor(n / 2) ? 1 : 0.55 + rnd() * 0.35), w = L * (0.26 + rnd() * 0.08), dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    var bx = x + (i - (n - 1) / 2) * s * 0.12, by = y, P = function (u, v) { return [bx + dx * u + nx * v, by + dy * u + ny * v]; };
    var BL = P(0, -w / 2), UL = P(L - w * 0.7, -w / 2), T = P(L, 0), UM = P(L - w * 0.55, w * 0.12), BM = P(0, w * 0.12), UR = P(L - w * 0.7, w / 2), BR = P(0, w / 2);
    o.dk += poly([BL, UL, T, UM, BM]); o.lt += poly([BM, UM, T, UR, BR]); o.tips.push(T); o.ridge += 'M' + PT(BM[0], BM[1]) + ' L' + PT(UM[0], UM[1]) + ' L' + PT(T[0], T[1]) + ' '; o.base.push([bx, by, w]); }
  return o;
}
SCENES.geology = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(2), refl = Lay(0), mid = Lay(0), near = Lay(0);
  var sky = dk ? 'linear-gradient(180deg,#120E24 0%,#22183E 50%,#3E2A62 100%)' : 'linear-gradient(180deg,#CBD7EA 0%,#E8ECF4 55%,#D7CDE6 100%)';
  // the hole in the roof
  var ox = W * (ph ? 0.62 : 0.74), orx = W * (ph ? 0.34 : 0.2), ory = H * (ph ? 0.19 : 0.2);
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
  var vine = '', lvs = ''; for (x = ox - orx * 0.85; x < ox + orx * 0.85; x += orx * (ph ? 0.16 : 0.11)) { var vy = oy(x) + 3, vl = 18 + rnd() * (ph ? 30 : 50), sgn = rnd() < 0.5 ? -1 : 1; vine += 'M' + PT(x, vy) + ' q' + n1(sgn * 6) + ' ' + n1(vl * 0.5) + ' ' + n1(sgn * 2) + ' ' + n1(vl) + ' ';
    for (var lq = 0.22, li = 0; lq < 1; lq += 0.26, li++) vine += leaf(x + sgn * 3.4 * Math.sin(lq * 2.6), vy + vl * lq, 7, 2.6, li % 2 ? 30 : 150); }
  stk(mid, 's', vine, dk ? '#284A40' : '#5A9A6A', 1.5);
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
  // (the wall crystals' rocky ledges go with the stalactites)
  add(mid, 'e', stal + gm, dk ? '#2A2048' : '#8E78A6'); add(mid, 'f', hl, dk ? 'rgba(200,180,255,0.12)' : 'rgba(255,255,255,0.35)');
  // crystal clusters: pink on the walls (mid), purple and teal on the floor (near)
  var glow = [], wc = {dk: '', lt: '', ridge: ''}, ledge0 = '';
  [[wl, 0.42, 1, 42], [wr, 0.36, -1, -44], [wl, 0.66, 1, 34], [wr, 0.62, -1, -36]].forEach(function (q, j) { var yy = H * q[1], xx = q[0](yy) + q[2] * 2, sz = (ph ? 34 : 58) * (j < 2 ? 1 : 0.8), C = n5_crys(xx, yy, sz, q[3], 4, rnd); wc.dk += C.dk; wc.lt += C.lt; wc.ridge += C.ridge;
    ledge0 += ell(xx + q[2] * sz * 0.1, yy + 4, sz * 0.34, 7) + ell(xx + q[2] * sz * 0.3, yy + 2, sz * 0.16, 5);
    glow.push({x: xx + q[2] * sz * 0.3, y: yy - sz * 0.45, r: ph ? 40 : 60, c: 2, tips: C.tips}); });
  add(mid, 'e', ledge0);
  add(mid, 'g', wc.dk, dk ? '#B04A8A' : '#E07AAE'); add(mid, 'h', wc.lt, dk ? '#F08AC8' : '#FFC2DE'); stk(mid, 't', wc.ridge, dk ? 'rgba(255,220,240,0.5)' : 'rgba(255,255,255,0.75)', 1.2);
  // near: the floor, pools, floor crystals
  var fl = [], fx; for (fx = -40; fx <= W + 40; fx += 10) fl.push([fx, yF(fx)]);
  add(near, 'a', below(fl, H + 40), dk ? '#120C22' : '#6A5884');
  var peb = ''; spread(0, H * 0.82, W, H * 0.18, 30, 16, rnd, 1).forEach(function (c) { if (c.q < 0.4) peb += ell(c.x, c.y, 3 + c.r * 5, 1.6 + c.k * 2); });
  var ledge = ''; fl.forEach(function (p, j) { if (j % 2 === 0) ledge += rect(p[0], p[1], 10, 3); });
  add(near, 'b', peb + ledge, dk ? '#1E1636' : '#80709C');
  var pools = ph ? [[0.28, 0.9, 0.24, 0.028], [0.78, 0.93, 0.16, 0.02]] : [[0.3, 0.88, 0.15, 0.034], [0.74, 0.91, 0.12, 0.026]], pp = '', rim = '';
  pools = pools.map(function (q) { var p = {x: W * q[0], y: H * q[1], rx: W * q[2], ry: H * q[3]}; pp += ell(p.x, p.y, p.rx, p.ry); rim += ell(p.x, p.y + 2, p.rx + 6, p.ry + 3); return p; });
  add(near, 'c', rim, dk ? '#2A2048' : '#A08EB8'); add(near, 'd', pp, dk ? '#1E2A5A' : '#9FC4E6');
  var fc = [{dk: '', lt: '', ridge: ''}, {dk: '', lt: '', ridge: ''}], FC = ph ? [[0.06, 1, 0, 64], [0.94, 1, 1, 56], [0.5, 0.6, 1, 34], [0.36, 0.7, 0, 30], [0.75, 0.6, 0, 30]] : [[0.035, 1, 0, 120], [0.965, 1, 1, 100], [0.58, 0.6, 1, 50], [0.15, 0.7, 1, 56], [0.86, 0.75, 0, 60], [0.42, 0.55, 0, 36], [0.68, 0.7, 0, 34], [0.25, 0.6, 0, 30]];
  FC.forEach(function (q, j) { var cx = W * q[0], cy = (q[1] === 1 ? H + 6 : yF(cx) + 10), C = n5_crys(cx, cy, q[3], q[0] < 0.5 ? 12 : -12, q[1] === 1 ? 5 : 3, rnd); fc[q[2]].dk += C.dk; fc[q[2]].lt += C.lt; fc[q[2]].ridge += C.ridge; glow.push({x: cx, y: cy - q[3] * 0.5, r: q[3] * 1.5, c: q[2], tips: C.tips}); });
  add(near, 'e', fc[0].dk, dk ? '#7A3EC8' : '#9A62D8'); add(near, 'f', fc[0].lt, dk ? '#B88AF8' : '#D2B2F8');
  add(near, 'g', fc[1].dk, dk ? '#1E9AA8' : '#3EB4C0'); add(near, 'h', fc[1].lt, dk ? '#7AE8F0' : '#A8EEF2');
  stk(near, 't', fc[0].ridge + fc[1].ridge, dk ? 'rgba(230,240,255,0.42)' : 'rgba(255,255,255,0.7)', 1.3);
  // shimmer lines on the pools
  var shm = ''; pools.forEach(function (p) { for (var q = 0; q < 3; q++) shm += seg(p.x - p.rx * (0.5 - q * 0.2), p.y - p.ry * 0.3 + q * 4, p.x - p.rx * (0.3 - q * 0.25), p.y - p.ry * 0.3 + q * 4); });
  stk(near, 's', shm, dk ? 'rgba(160,200,255,0.3)' : 'rgba(255,255,255,0.7)', 1.6);
  if (ANIM) { ANIM.glow = glow; ANIM.tips = tips.filter(function (t) { return t[1] > H * 0.08; }); ANIM.pools = pools; ANIM.yF = yF; ANIM.open = [ox, orx, ory];
    ANIM.lantern = [W * (ph ? 0.14 : 0.08), yF(W * (ph ? 0.14 : 0.08)) - 2]; ANIM.geode = [W * (ph ? 0.5 : 0.52), yF(W * (ph ? 0.5 : 0.52)) + H * (ph ? 0.08 : 0.1)]; ANIM.bat = tips.length ? tips[Math.floor(tips.length * 0.3)] : [W * 0.3, H * 0.2]; }
  else { var g = W * (ph ? 0.5 : 0.52), gy2 = yF(g) + H * (ph ? 0.08 : 0.1), gr = ph ? 32 : 50; add(near, 'b', ell(g, gy2 - gr * 0.8, gr, gr * 0.8)); add(near, 'b', ell(g, gy2, gr * 1.2, gr * 0.18)); }
  return {sky: sky, far: far, refl: refl, mid: mid, near: near};
};



