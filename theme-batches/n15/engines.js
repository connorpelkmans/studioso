// ---- batch n15 engines: fjord, storm
function n15_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n15_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n15_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n15_ease((T - c) / (d - c)); }
var n15_gc = null;
function n15_ctx() { return n15_gc || (n15_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n15_glow
function n15_rg(col, mid) { var g = n15_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n15_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n15_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
function n15_spark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.25, y - r * 0.25); c.lineTo(x + r, y); c.lineTo(x + r * 0.25, y + r * 0.25); c.lineTo(x, y + r); c.lineTo(x - r * 0.25, y + r * 0.25); c.lineTo(x - r, y); c.lineTo(x - r * 0.25, y - r * 0.25); c.closePath(); c.fill(); }
// a point a fraction u of the way along a polyline (by length)
function n15_along(pts, u) { var L = 0, i, seg = []; for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; } var want = u * L; for (i = 0; i < seg.length; i++) { if (want <= seg[i] || i === seg.length - 1) { var f = seg[i] ? Math.min(1, want / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; } want -= seg[i]; } return pts[pts.length - 1]; }
// a rainbow (or a pale moonbow): arcs of the spectrum around cx,cy
function n15_bow(c, cx, cy, r, bw, a, pale, a0, a1, rev) { if (a <= 0.01) return; var cols = pale ? ['rgba(255,226,236,', 'rgba(255,246,226,', 'rgba(236,255,240,', 'rgba(226,236,255,', 'rgba(240,228,255,'] : ['rgba(255,90,80,', 'rgba(255,170,70,', 'rgba(255,236,110,', 'rgba(120,220,120,', 'rgba(90,150,255,', 'rgba(150,100,230,'];
  if (rev) cols = cols.slice().reverse();
  c.save(); c.lineCap = 'round'; cols.forEach(function (col, i) { c.strokeStyle = col + a + ')'; c.lineWidth = bw; c.beginPath(); c.arc(cx, cy, r - i * bw * 0.92, a0 == null ? Math.PI : a0, a1 == null ? 2 * Math.PI : a1); c.stroke(); }); c.restore(); }

// ---------- Fjord: the ribbon waterfalls pour and shimmer (their reflections too), low cloud drifts along the walls, glints and
// rings move over the still water, smoke curls from the cabin's chimney and a birch leaf flutters down now and then.
// Night: a pale summer twilight; the moon glows on the water, stars twinkle, the cabin's windows are lit.
// Moment: the clouds part: sunbeams fan down the fjord, a warm light sweeps along the walls, the falls flash and throw rainbows
// in their spray and a glitter path runs across the water. At night a moonbow arcs over the fjord and the moon's path glitters.
ENGINES.fjord = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, hz = A.hz, i;
  var floorAt = function (x) { return A.floor[Math.max(0, Math.min(A.floor.length - 1, Math.round(x / 8)))]; };
  var skyAt = function (x) { return A.skyTop[Math.max(0, Math.min(A.skyTop.length - 1, Math.round(x / 8)))]; };
  var water = function (x, y) { return y > floorAt(x) + 3 && y < H && y < A.ktop(x) - 3; };
  var sunG = n15_rg(dk ? 'rgba(236,230,255,0.4)' : 'rgba(255,246,214,0.55)', [0.3, 0.32]), mistG = n15_rg(dk ? 'rgba(214,206,240,0.5)' : 'rgba(255,255,255,0.7)', [0.4, 0.45]), wispG = n15_rg(dk ? 'rgba(200,190,230,0.16)' : 'rgba(255,255,255,0.26)', [0.5, 0.55]);
  var warmG = n15_rg('rgba(255,214,150,0.3)', [0.5, 0.45]), twG = n15_rg('rgba(255,250,236,0.95)', [0.25, 0.3]), winG = n15_rg('rgba(255,200,120,0.8)', [0.3, 0.3]), smokeG = n15_rg(dk ? 'rgba(190,186,214,0.4)' : 'rgba(236,240,244,0.55)', [0.5, 0.6]);
  var falls = A.falls.map(function (f, j) { return {pts: f.pts, w: f.w, yb: f.yb, k: f.k, far: f.far, ph: Math.random() * 6.28, sp: 0.32 + Math.random() * 0.12, nr: 0.5 + j * 0.37}; });
  var glints = []; for (i = 0; i < 900 && glints.length < (ph ? 34 : 70); i++) { var gx = Math.random() * W, gy = hz + Math.pow(Math.random(), 0.8) * (H - hz); if (water(gx, gy)) glints.push({x: gx, y: gy, ph: Math.random() * 6.28, sp: 0.8 + Math.random() * 1.4}); }
  var stars = []; if (dk) for (i = 0; i < 400 && stars.length < (ph ? 12 : 26); i++) { var tx = Math.random() * W, ty = Math.random() * hz * 0.7; if (ty < skyAt(tx) - 8 && Math.hypot(tx - A.moon[0], ty - A.moon[1]) > A.moon[2] * 3) stars.push([tx, ty, Math.random() * 6.28]); }
  var rings = [], leaves = [], smoke = [], spray = [], shoot = [], fin = null, nextLeaf = 4, nextRing = 2, nextSmoke = 0, nextStar = 8;
  var C = A.cabin, chim = [C.x + C.w * 0.33, C.y - C.h - C.w * 0.3];
  // the glitter path's column: under the sun's glow by day, under the moon's reflection at night
  var gxC = dk ? A.moon[0] : A.sun[0];
  return {
    step: function (dt, t, f) {
      nextRing -= dt; if (nextRing <= 0) { nextRing = 2.5 + Math.random() * 3; for (var k = 0; k < 20; k++) { var rx = Math.random() * W, ry = hz + Math.random() * (H - hz); if (water(rx, ry)) { rings.push({x: rx, y: ry, t0: t, s: 0.5 + (ry - hz) / (H - hz)}); break; } } }
      falls.forEach(function (fa) { fa.nr -= dt; if (fa.nr <= 0) { fa.nr = 1.4 + Math.random(); var b = fa.pts[fa.pts.length - 1]; rings.push({x: b[0], y: fa.yb + 2, t0: t, s: fa.far ? 0.35 : 0.6, fall: 1}); } });
      rings = rings.filter(function (r) { return t - r.t0 < 3.4; });
      nextLeaf -= dt * f.s; if (nextLeaf <= 0 && leaves.length < 3) { nextLeaf = 5 + Math.random() * 6; leaves.push({x: A.birch[0] + (Math.random() - 0.3) * A.birch[2] * 0.3, y: A.birch[1] + Math.random() * A.birch[2] * 0.3, vx: (14 + Math.random() * 14) * S, ph: Math.random() * 6.28, t0: t, gold: Math.random() < 0.4}); }
      leaves.forEach(function (l) { if (l.landed) return; var age = t - l.t0; l.x += (l.vx + Math.sin(age * 2.4 + l.ph) * 18 * S) * dt; l.y += (16 + Math.sin(age * 3 + l.ph) * 10) * S * dt;
        if (water(l.x, l.y) && l.y > A.ky) { l.landed = t; rings.push({x: l.x, y: l.y, t0: t, s: 0.8}); } });
      leaves = leaves.filter(function (l) { return (l.landed ? t - l.landed < 4 : t - l.t0 < 30) && l.x < W + 20 && l.y < H + 20; });
      nextSmoke -= dt; if (nextSmoke <= 0) { nextSmoke = 0.45; smoke.push({x: chim[0], y: chim[1], t0: t, ph: Math.random() * 6.28}); }
      smoke = smoke.filter(function (p) { return t - p.t0 < 7; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 10 + Math.random() * 10; shoot.push({t0: t, x: W * (0.3 + Math.random() * 0.6), y: H * (0.04 + Math.random() * 0.1)}); } }
      shoot = shoot.filter(function (s) { return t - s.t0 < 1.2; });
      if (fin) { var T = t - fin.t0;
        if (T > 1 && T < 6) falls.forEach(function (fa) { if (fa.far || Math.random() > dt * 14) return; var b = fa.pts[fa.pts.length - 1]; spray.push({x: b[0] + (Math.random() - 0.5) * 10 * S, y: fa.yb - 2, vx: (Math.random() - 0.5) * 30 * S, vy: -(20 + Math.random() * 50) * S, t0: t}); });
        if (T > 12) fin = null; }
      spray.forEach(function (p) { p.vy += 18 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); spray = spray.filter(function (p) { return t - p.t0 < 3; });
    },
    draw: function (ca, cb, t, f) { var tt = t * f.s, T = fin ? t - fin.t0 : -1, k1 = fin ? n15_env(T, 0.3, 1.4, 5.5, 9) : 0, i2;
      ca.save(); ca.globalCompositeOperation = 'lighter';
      // the sun's soft glow (the moon's at night), and its twin in the water
      var bx = dk ? A.moon[0] : A.sun[0], by = dk ? A.moon[1] : A.sun[1], gr = (dk ? A.moon[2] * 5 : 170 * S) * (1 + 0.03 * Math.sin(tt * 0.6) + k1 * 0.5);
      n15_glow(ca, sunG, bx, by, gr, 0.8 + k1 * 0.2); n15_glow(ca, sunG, bx, 2 * hz - by, gr * 0.9, (0.45 + k1 * 0.3) * (dk ? 0.8 : 0.6), 0.8);
      stars.forEach(function (s, j) { var a = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] + j)), 4) * (1 + k1); n15_glow(ca, twG, s[0], s[1], 3 + a * 3, Math.min(1, a * 0.8)); });
      // sunbeams fanning down the fjord in the moment
      if (k1 > 0 && !dk) { for (i2 = 0; i2 < 9; i2++) { var an = Math.PI * (0.52 + i2 * 0.07) + Math.sin(tt * 0.3 + i2) * 0.015, Lr = H * 1.3, wd = (26 + (i2 % 3) * 18) * S; ca.fillStyle = 'rgba(255,240,200,' + (0.11 * k1 * (0.6 + 0.4 * Math.sin(tt * 1.1 + i2 * 2))) + ')'; ca.beginPath(); ca.moveTo(bx, by); ca.lineTo(bx + Math.cos(an - 0.025) * Lr - wd, by + Math.sin(an - 0.025) * Lr); ca.lineTo(bx + Math.cos(an + 0.025) * Lr + wd, by + Math.sin(an + 0.025) * Lr); ca.closePath(); ca.fill(); } }
      // the warm light sweeping along the walls in the moment
      if (fin && !dk) { var sw = n15_ease((T - 0.5) / 4.5), swa = n15_env(T, 0.4, 1.4, 4.4, 6); n15_glow(ca, warmG, W * (1.15 - sw * 1.3), hz - H * 0.2, W * 0.35, swa, 0.7); }
      ca.restore();
      // low cloud drifting along the walls
      ca.save(); for (i2 = 0; i2 < 3; i2++) { var wo = A.walls[i2 % 2], wx = ((tt * (6 + i2 * 2) + i2 * W * 0.45) % (W + 600)) - 300, wy = wo.yb - wo.h * (0.55 + i2 * 0.12); n15_glow(ca, wispG, wx, wy, (180 + i2 * 60) * S * (ph ? 1.4 : 1), 1, 0.16); } ca.restore();
      // glints and rings on the still water
      ca.fillStyle = dk ? '#E8DCF0' : '#FFFFFF';
      glints.forEach(function (g) { var a = Math.pow(Math.max(0, Math.sin(tt * g.sp + g.ph)), 6); if (a < 0.02) return; var q = (g.y - hz) / (H - hz); ca.globalAlpha = a * (dk ? 0.5 : 0.75); n15_ell(ca, g.x, g.y, (3 + q * 12) * S, 0.5 + q * 0.8); ca.fill(); }); ca.globalAlpha = 1;
      ca.lineWidth = 1; rings.forEach(function (r) { var k = (t - r.t0) / 3.4; ca.strokeStyle = (dk ? 'rgba(230,220,250,' : 'rgba(255,255,255,') + (0.5 * (1 - k) * Math.min(1, k * 6)) + ')'; for (var j = 0; j < 2; j++) { var kk = Math.max(0, k - j * 0.2); if (!kk) continue; n15_ell(ca, r.x, r.y, (6 + kk * 46) * S * r.s, (1.4 + kk * 9) * S * r.s); ca.stroke(); } });
      // the glitter path in the moment (and a faint one under the moon every night)
      var gpa = fin ? n15_env(T, 1.6, 3, 7, 10) : 0, base = dk ? 0.35 : 0;
      if (gpa + base > 0.01) { ca.save(); ca.globalCompositeOperation = 'lighter'; ca.fillStyle = dk ? '#FFF2DC' : '#FFF6D8'; for (i2 = 0; i2 < (ph ? 30 : 56); i2++) { var gyy = hz + 6 + Math.pow(hash(i2 * 3.1), 0.9) * (H - hz - 10), q2 = (gyy - hz) / (H - hz), gxx = gxC + (hash(i2 + 7) - 0.5) * (20 + q2 * W * 0.22); if (!water(gxx, gyy)) continue; var ga = Math.pow(Math.max(0, Math.sin(tt * 3 + i2 * 1.9)), 3) * (gpa + base * (dk && Math.abs(gyy - (2 * hz - A.moon[1])) < H * 0.25 ? 1 : 0.3)); if (ga > 0.02) { ca.globalAlpha = Math.min(1, ga); n15_ell(ca, gxx, gyy, (4 + q2 * 16) * S, 0.8 + q2 * 1.2); ca.fill(); } } ca.restore(); }
      // the waterfalls: bright streaks pouring down each ribbon and up its reflection, mist where it meets the fjord
      var boost = fin ? n15_env(T, 0.8, 1.8, 5, 8) : 0;
      ca.save(); ca.lineCap = 'round';
      falls.forEach(function (fa) { var n = fa.far ? 4 : 7, top = fa.pts[0], bot = fa.pts[fa.pts.length - 1], len = bot[1] - top[1];
        for (var m = 0; m < n; m++) { var u = (tt * fa.sp * (len > 0 ? 160 / len : 1) + m / n + fa.ph) % 1, p = n15_along(fa.pts, u), dl = Math.min(len * 0.12, 14 * S) * (0.6 + u), al = Math.sin(Math.PI * u) * (fa.far ? 0.5 : 0.8) * (1 + boost * 0.6);
          ca.strokeStyle = (dk ? 'rgba(244,240,255,' : 'rgba(255,255,255,') + Math.min(1, al) + ')'; ca.lineWidth = fa.w * (0.5 + u * 0.7); ca.beginPath(); ca.moveTo(p[0], p[1] - dl); ca.lineTo(p[0], p[1]); ca.stroke();
          ca.strokeStyle = (dk ? 'rgba(244,240,255,' : 'rgba(255,255,255,') + Math.min(1, al * 0.35) + ')'; ca.beginPath(); ca.moveTo(p[0], 2 * fa.yb - p[1] + dl); ca.lineTo(p[0], 2 * fa.yb - p[1]); ca.stroke(); }
        n15_glow(ca, mistG, bot[0], fa.yb - fa.w * 2, fa.w * (fa.far ? 4 : 6) * (1 + 0.15 * Math.sin(tt * 2 + fa.ph) + boost * 0.8), (fa.far ? 0.35 : 0.55) * (1 + boost * 0.5), 0.6); });
      ca.restore();
      // rainbows in the spray of the big falls in the moment; a moonbow over the fjord at night
      if (fin) { var rb = n15_env(T, 1.6, 3, 6.5, 9.5);
        if (!dk) falls.forEach(function (fa) { if (fa.far || fa.w < 2.6 * S) return; var b2 = fa.pts[fa.pts.length - 1]; n15_bow(ca, b2[0], fa.yb, fa.w * 9, fa.w * 0.55, 0.32 * rb, false, Math.PI * 1.05, Math.PI * 1.95); });
        else n15_bow(ca, W * 0.5, hz + H * 0.04, W * (ph ? 0.46 : 0.3), 4.5 * S + 1, 0.22 * rb, true); }
      // spray drops and the leaf (on the top canvas, over the knoll)
      ca.save(); ca.fillStyle = dk ? 'rgba(236,232,255,0.8)' : 'rgba(255,255,255,0.9)'; spray.forEach(function (p) { var a = 1 - (t - p.t0) / 3; ca.globalAlpha = a; ca.beginPath(); ca.arc(p.x, p.y, 1.1 * S + 0.4, 0, 7); ca.fill(); }); ca.restore();
      leaves.forEach(function (l) { var age = t - l.t0, a = l.landed ? 1 - (t - l.landed) / 4 : Math.min(1, age); cb.save(); cb.globalAlpha = a; cb.translate(l.x, l.y); cb.rotate(l.landed ? 0.2 : Math.sin(age * 3 + l.ph) * 0.9); cb.fillStyle = l.gold ? (dk ? '#A89A6A' : '#E8C64A') : (dk ? '#5A7A6A' : '#9CCB5A'); n15_ell(cb, 0, 0, 3.4 * S + 1, (l.landed ? 1 : 1.8) * S + 0.6); cb.fill(); cb.restore(); });
      // smoke from the cabin's chimney; lit windows at night
      smoke.forEach(function (p) { var age = t - p.t0; n15_glow(cb, smokeG, p.x + age * 4 * S + Math.sin(age * 1.3 + p.ph) * 2 * S, p.y - age * 6 * S, (1.6 + age * 1.3) * S, Math.min(1, age * 2) * (1 - age / 7) * 0.9); });
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; var wf = 0.5 + 0.08 * Math.sin(tt * 3) + k1 * 0.4; n15_glow(cb, winG, C.x - C.w * 0.12, C.y - C.h * 0.5, C.w * 0.9, wf); n15_glow(cb, winG, C.x - C.w * 0.12, 2 * C.yb - C.y + C.h * 0.5, C.w * 0.7, wf * 0.4, 0.6); cb.restore(); }
      shoot.forEach(function (s) { var k = (t - s.t0) / 1.2; cb.strokeStyle = 'rgba(255,248,236,' + Math.sin(Math.PI * k) * 0.9 + ')'; cb.lineWidth = 1.5; cb.beginPath(); cb.moveTo(s.x - k * 160, s.y + k * 56); cb.lineTo(s.x - k * 160 + 42, s.y + k * 56 - 15); cb.stroke(); });
    },
    finish: function (t) { fin = {t0: t}; if (dk) { shoot.push({t0: t + 0.8, x: W * 0.75, y: H * 0.06}); shoot.push({t0: t + 2.6, x: W * 0.45, y: H * 0.1}); } }
  };
};

UIC.fjord = {L: ['#2E5A6E', '#1C3A4A', 'rgba(255,255,255,0.84)', '#17262E', '#52646C', '#B8392C', '#B8392C', '#CC5A3A', '#FFFFFF'], D: ['#2A3462', '#161C3C', 'rgba(22,28,60,0.78)', '#EEF0FA', '#AEB4D0', '#E7A88E', '#E7A88E', '#F0C2A0', '#1A1428']};

// ---------- Storm Prairie: gusts roll gold-lit swells through the wheat, the ears along the bottom edge sway, chaff drifts on the
// breeze, rain streams from the curtains, scud drifts under the base and lightning glows deep in the core now and then.
// Night: a deep blue prairie; silent lightning flickers inside the clouds and lights the land, and stars twinkle in the clear sky.
// Moment: the sun breaks under the cloud: a wave of golden light and a great gust sweep across the wheat, chaff swirls up and a
// double rainbow stands against the dark rain. At night a burst of silent lightning crawls across the whole cloud and the stars come out.
function n15_earC(c, x, y, L, ang, cl, cd, aw) { c.save(); c.translate(x, y); c.rotate(ang); var n = 6, i;
  c.strokeStyle = aw; c.lineWidth = Math.max(0.6, L * 0.035); c.beginPath(); for (i = 0; i < n; i++) { var u = i / n, sd = i % 2 ? 1 : -1; c.moveTo(sd * L * 0.1, -L * u - L * 0.08); c.lineTo(sd * L * 0.22, -L * u - L * 0.62); } c.stroke();
  for (i = 0; i < n; i++) { var u2 = i / n, sd2 = i % 2 ? 1 : -1, gw = L * 0.13 * (1 - u2 * 0.35); c.fillStyle = sd2 > 0 ? cd : cl; n15_ell(c, sd2 * gw * 0.6, -L * u2 - gw * 0.5, gw * 1.05, gw * 0.62, sd2 * 0.6); c.fill(); }
  c.fillStyle = cl; n15_ell(c, 0, -L * 0.98, L * 0.05, L * 0.08); c.fill(); c.restore(); }
ENGINES.storm = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, sc = A.sc, hz = A.hz, cloud = new Path2D(A.cloud), i, tnow = 0;
  var sunG = n15_rg('rgba(255,224,160,0.5)', [0.3, 0.35]), goldG = n15_rg('rgba(255,222,140,0.32)', [0.5, 0.4]), boltG = n15_rg(dk ? 'rgba(190,210,255,0.9)' : 'rgba(255,250,240,0.7)', [0.25, 0.4]), scudG = n15_rg(dk ? 'rgba(14,20,40,0.55)' : 'rgba(60,70,90,0.45)', [0.5, 0.6]);
  var twG = n15_rg('rgba(240,246,255,0.95)', [0.25, 0.3]), shadowG = n15_rg(dk ? 'rgba(0,0,10,0.15)' : 'rgba(60,50,70,0.16)', [0.5, 0.6]);
  var stalks = A.stalks, flw = A.flw, grs = A.grs, Rn = A.rain;
  var drops = []; for (i = 0; i < (ph ? 40 : 80); i++) drops.push({x: Math.random(), y: Math.random(), sp: 0.5 + Math.random() * 0.5});
  var motes = []; for (i = 0; i < (ph ? 14 : 26); i++) motes.push({x: Math.random() * W, y: A.ftop + Math.random() * (H - A.ftop) * 0.8, ph: Math.random() * 6.28, sp: 10 + Math.random() * 20});
  var stars = []; if (dk) for (i = 0; i < 400 && stars.length < (ph ? 10 : 24); i++) { var tx = Math.random() * W * 0.5, ty = Math.random() * hz * 0.85; if (!(tx > A.ax0 && ty < A.by) && tx < A.cx - A.BW * 1.1) stars.push([tx, ty, Math.random() * 6.28]); }
  var flashes = [], nextFlash = dk ? 1.2 : 9, bolts = [], swirl = [], fin = null, crawl = [];
  // a jagged lightning path from a to b, with forks
  function zig(x0, y0, x1, y1, n, amp) { var p = [[x0, y0]]; for (var j = 1; j < n; j++) { var u = j / n; p.push([x0 + (x1 - x0) * u + (Math.random() - 0.5) * amp, y0 + (y1 - y0) * u + (Math.random() - 0.5) * amp * 0.4]); } p.push([x1, y1]); return p; }
  function flashAt(t, big) { var r = Math.random(), x, y; if (r < 0.5) { x = A.tower[0] + (Math.random() - 0.4) * A.tower[3] * 0.8; y = A.tower[2] - Math.random() * (A.tower[2] - A.tower[1]) * 0.8; } else { x = A.cx + (Math.random() - 0.5) * A.BW * 1.6; y = A.by - Math.random() * H * 0.08; }
    flashes.push({x: x, y: y, t0: t, r: (big ? 260 : 120 + Math.random() * 140) * sc, seed: Math.random() * 9, d: 0.5 + Math.random() * 0.6});
    if (dk && Math.random() < 0.3) { var bx = Rn.x + (Math.random() - 0.3) * Rn.w, b = zig(bx, A.by + H * 0.01, bx - H * 0.04 + (Math.random() - 0.5) * 40 * S, hz, 9, 22 * S); bolts.push({p: b, t0: t + 0.1, fork: zig(b[4][0], b[4][1], b[4][0] + 30 * S, b[4][1] + H * 0.06, 4, 12 * S)}); } }
  function finW(x) { if (!fin) return 0; var T = tnow - fin.t0; if (T > 4) return 0; var xf = -200 + (W + 400) * (T / 3.2), d = (x - xf) / (W * 0.12 + 60); return 1.3 * Math.exp(-d * d); }
  function wind(x, t) { var g = 0.5 + 0.5 * Math.sin(x * 0.006 - t * 1.2); return 0.15 + g * g * 0.6 + Math.sin(t * 2.3 + x * 0.04) * 0.06 + finW(x); }
  return {
    step: function (dt, t, f) { tnow = t;
      nextFlash -= dt * f.s; if (nextFlash <= 0) { nextFlash = dk ? 2.2 + Math.random() * 4.5 : 10 + Math.random() * 10; flashAt(t, false); }
      flashes = flashes.filter(function (fl) { return t - fl.t0 < fl.d + 0.1; }); bolts = bolts.filter(function (b) { return t - b.t0 < 0.6; });
      motes.forEach(function (m) { m.x += (m.sp * (0.5 + wind(m.x, t))) * S * dt * 2; m.y += Math.sin(t * 1.3 + m.ph) * 6 * S * dt; if (m.x > W + 10) { m.x = -10; m.y = A.ftop + Math.random() * (H - A.ftop) * 0.8; } });
      drops.forEach(function (d) { d.y += d.sp * dt * 0.9; if (d.y > 1) { d.y -= 1; d.x = Math.random(); } });
      if (fin) { var T = t - fin.t0, xf = -200 + (W + 400) * (T / 3.2);
        if (!dk && T < 3.4) { var em = dt * (ph ? 14 : 26); while (em > 0) { if (Math.random() < em) swirl.push({x: xf - Math.random() * 90, y: H * (0.78 + Math.random() * 0.2), vx: (100 + Math.random() * 120) * S, vy: -(30 + Math.random() * 60) * S, t0: t, ph: Math.random() * 6.28, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8}); em -= 1; } }
        if (dk) { if (T > 0.4 && !fin.c1) { fin.c1 = 1; startCrawl(t, -1); } if (T > 1.9 && !fin.c2) { fin.c2 = 1; startCrawl(t, 1); } if (T > 3.2 && !fin.c3) { fin.c3 = 1; startCrawl(t, 0); } }
        if (T > 12) fin = null; }
      swirl.forEach(function (s2) { var age = t - s2.t0; s2.vy -= 8 * S * dt; s2.x += (s2.vx + Math.cos(age * 3 + s2.ph) * 50 * S) * dt; s2.y += (s2.vy + Math.sin(age * 3 + s2.ph) * 30 * S) * dt; s2.rot += s2.vr * dt; }); swirl = swirl.filter(function (s2) { return t - s2.t0 < 5 && s2.y > -20; });
      crawl = crawl.filter(function (c) { return t - c.t0 < 1.6; });
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, gold = fin && !dk ? n15_env(T, 0.2, 1.2, 6, 9) : 0, i2;
      // the low sun's glow (day) and the stars in the clear sky (night)
      ca.save(); ca.globalCompositeOperation = 'lighter';
      if (!dk) n15_glow(ca, sunG, A.sun[0], A.sun[1], 260 * sc * (1 + 0.03 * Math.sin(tt * 0.5) + gold * 0.4), 0.7 + gold * 0.3);
      stars.forEach(function (s2, j) { var a = Math.pow(Math.max(0, Math.sin(tt * 1.1 + s2[2] + j)), 4) * (fin && dk ? 1 + n15_env(T, 3, 4, 8, 11) : 1); n15_glow(ca, twG, s2[0], s2[1], 3 + a * 3, Math.min(1, a * 0.8)); });
      ca.restore();
      // lightning glowing inside the cloud
      var fl0 = 0; ca.save(); ca.clip(cloud); ca.globalCompositeOperation = 'lighter';
      flashes.forEach(function (fl) { var k = (t - fl.t0) / fl.d, a = k < 0 ? 0 : Math.pow(Math.max(0, flick(t * 2.6, fl.seed) - 0.25), 1.5) * 1.8 * (1 - k); fl0 = Math.max(fl0, a); n15_glow(ca, boltG, fl.x, fl.y, fl.r, a * (dk ? 1 : 0.5), 0.75); n15_glow(ca, boltG, fl.x + fl.r * 0.4, fl.y + fl.r * 0.2, fl.r * 0.6, a * (dk ? 0.6 : 0.3), 0.7); });
      crawl.forEach(function (c) { var k = (t - c.t0) / 1.6, a = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * (0.6 + 0.4 * flick(t * 3, c.seed)); fl0 = Math.max(fl0, a);
        ca.fillStyle = 'rgba(150,175,255,' + a * 0.22 + ')'; ca.fillRect(0, 0, W, H); n15_glow(ca, boltG, c.x, c.y, A.BW * 1.2, a * 0.8, 0.45); c.br.forEach(function (b) { var q = b[Math.floor(b.length * 0.7)]; n15_glow(ca, boltG, q[0], q[1], A.BW * 0.35, a * 0.5, 0.5); }); c.br.forEach(function (b) { var m = Math.min(b.length, Math.ceil(b.length * Math.min(1, k * 3))); ca.strokeStyle = 'rgba(230,238,255,' + a + ')'; ca.lineWidth = 1.6 * S + 0.4; ca.beginPath(); for (var j = 0; j < m; j++) { if (j) ca.lineTo(b[j][0], b[j][1]); else ca.moveTo(b[j][0], b[j][1]); } ca.stroke(); ca.strokeStyle = 'rgba(160,190,255,' + a * 0.35 + ')'; ca.lineWidth = 6 * S + 2; ca.stroke(); }); });
      ca.restore();
      // a distant bolt under the rain at night, and the whole prairie lit by each flash
      ca.save(); ca.globalCompositeOperation = 'lighter';
      bolts.forEach(function (b) { var k = (t - b.t0) / 0.6; if (k < 0) return; var a = (k < 0.1 ? 1 : Math.max(0, 1 - k) * (0.5 + 0.5 * Math.sin(k * 40))); [[7 * S + 2, 0.18], [2 * S + 0.6, 0.95]].forEach(function (q) { ca.strokeStyle = 'rgba(220,230,255,' + a * q[1] + ')'; ca.lineWidth = q[0]; ca.beginPath(); b.p.forEach(function (p, j) { if (j) ca.lineTo(p[0], p[1]); else ca.moveTo(p[0], p[1]); }); ca.stroke(); ca.beginPath(); b.fork.forEach(function (p, j) { if (j) ca.lineTo(p[0], p[1]); else ca.moveTo(p[0], p[1]); }); ca.stroke(); }); fl0 = Math.max(fl0, a); });
      if (dk && fl0 > 0.02) { ca.fillStyle = 'rgba(120,150,220,' + fl0 * 0.14 + ')'; ca.fillRect(0, 0, W, H); }
      ca.restore();
      // scud drifting under the base, rain streaming from the curtains
      ca.save(); for (i2 = 0; i2 < 4; i2++) { var sx = ((tt * (8 + i2 * 3) + i2 * W * 0.3) % (A.BW * 2.2)) + A.cx - A.BW * 1.1, sy = A.by - H * (0.005 + (i2 % 2) * 0.01); n15_glow(ca, scudG, sx, sy, (50 + i2 * 14) * sc, 0.45 * Math.sin(Math.PI * ((sx - A.cx + A.BW * 1.1) / (A.BW * 2.2))), 0.22); } ca.restore();
      ca.save(); ca.strokeStyle = dk ? 'rgba(120,140,190,0.35)' : 'rgba(210,218,232,0.4)'; ca.lineWidth = 1; ca.beginPath();
      drops.forEach(function (d) { var x0 = Rn.x - Rn.w + d.x * Rn.w * 2.2, y0 = Rn.top + H * 0.02 + d.y * (hz - Rn.top - H * 0.02), sl = (y0 - Rn.top) * 0.55, ln = 16 * S; ca.moveTo(x0 - sl, y0); ca.lineTo(x0 - sl - ln * 0.5, y0 + ln); }); ca.stroke(); ca.restore();
      // gust swells of golden light rolling across the wheat, and cloud shadows
      ca.save(); ca.globalCompositeOperation = 'lighter'; for (i2 = 0; i2 < 2; i2++) { var gx = ((tt * 60 + i2 * (W + 700) / 2) % (W + 700)) - 350, gy = A.ftop + (H - A.ftop) * (0.35 + i2 * 0.3); n15_glow(ca, goldG, gx, gy, 300 * S * (ph ? 1.3 : 1), dk ? 0.25 : 0.8, 0.22); }
      if (gold > 0) { var xw = -300 + (W + 600) * n15_ease(T / 4); n15_glow(ca, goldG, xw, A.ftop + (H - A.ftop) * 0.5, W * 0.45, gold * 1.6, 0.4); n15_glow(ca, sunG, xw, A.ftop + (H - A.ftop) * 0.3, W * 0.3, gold * 0.6, 0.3); }
      ca.restore();
      if (!dk) { ca.save(); for (i2 = 0; i2 < 2; i2++) { var cx2 = ((tt * 12 + i2 * 700) % (W + 900)) - 450; n15_glow(ca, shadowG, cx2, A.ftop + (H - A.ftop) * (0.25 + i2 * 0.3), 460 * S * (ph ? 1.4 : 1), 0.6, 0.12); } ca.restore(); }
      // the double rainbow against the rain in the moment
      if (gold > 0) { ca.save(); ca.beginPath(); ca.rect(0, A.by + H * 0.035, W, hz - A.by - H * 0.035); ca.clip(); var rcx = Rn.x - Rn.w * 0.1, rcy = hz + H * 0.06, rr = hz + H * 0.06 - A.by - H * 0.05;
        n15_bow(ca, rcx, rcy, rr, 5 * S + 1.5, 0.42 * gold, false, Math.PI * 1.08, Math.PI * 1.98); n15_bow(ca, rcx, rcy, rr * 1.32, 4 * S + 1, 0.16 * gold, false, Math.PI * 1.1, Math.PI * 1.96, true); ca.restore(); }
      // chaff drifting over the field
      ca.fillStyle = dk ? 'rgba(180,190,220,0.5)' : 'rgba(255,236,170,0.85)'; motes.forEach(function (m) { ca.globalAlpha = 0.4 + 0.4 * Math.sin(tt * 2 + m.ph); ca.beginPath(); ca.arc(m.x, m.y, 1.2 * S + 0.4, 0, 7); ca.fill(); }); ca.globalAlpha = 1;
      // the foreground: grass, chicory and coneflowers, and the tall wheat swaying in the gusts
      var cl = dk ? '#58628A' : '#F4D27C', cd = dk ? '#3A4466' : '#D8A440', aw = dk ? 'rgba(120,132,170,0.8)' : 'rgba(240,204,120,0.9)', stc = dk ? '#3A4460' : '#C0903A';
      cb.lineCap = 'round';
      grs.forEach(function (g) { var b = (wind(g.x, tt) * 0.6 + g.lean) * g.h * 0.5; cb.strokeStyle = dk ? '#3A4462' : '#D2A848'; cb.lineWidth = 1.4 * S + 0.5; cb.beginPath(); cb.moveTo(g.x, H + 4); cb.quadraticCurveTo(g.x + b * 0.3, H - g.h * 0.6, g.x + b, H - g.h + Math.abs(b) * 0.2); cb.stroke(); });
      flw.forEach(function (fo) { var b = wind(fo.x, tt) * fo.h * 0.25 + Math.sin(tt * 1.5 + fo.ph) * 2 * S, hx = fo.x + b, hy = H + 6 - fo.h + Math.abs(b) * 0.15; cb.strokeStyle = dk ? '#2E3A50' : '#6A8A3A'; cb.lineWidth = 1.4 * S + 0.4; cb.beginPath(); cb.moveTo(fo.x, H + 6); cb.quadraticCurveTo(fo.x + b * 0.2, H - fo.h * 0.5, hx, hy); cb.stroke();
        cb.save(); cb.translate(hx, hy); var r = fo.r;
        if (fo.k === 0) { cb.fillStyle = dk ? '#4A5E9E' : '#7E9EEA'; for (var k = 0; k < 10; k++) { var a = k / 10 * Math.PI * 2; n15_ell(cb, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.18, a); cb.fill(); } cb.fillStyle = dk ? '#2A2848' : '#3A4AA0'; n15_ell(cb, 0, 0, r * 0.2, r * 0.2); cb.fill(); }
        else { cb.fillStyle = dk ? '#7A4A72' : '#D0729E'; for (var k2 = 0; k2 < 9; k2++) { var a2 = Math.PI * (0.15 + k2 / 8 * 0.7); n15_ell(cb, Math.cos(a2) * r * 0.6, Math.sin(a2) * r * 0.6, r * 0.55, r * 0.16, a2); cb.fill(); } cb.fillStyle = dk ? '#2A2030' : '#6A3E1E'; n15_ell(cb, 0, -r * 0.1, r * 0.34, r * 0.3); cb.fill(); }
        cb.restore(); });
      stalks.forEach(function (s2) { var w = wind(s2.x, tt), bend = (w * 0.5 + s2.lean) * s2.h * 0.45 + Math.sin(tt * 1.8 + s2.ph) * 1.5 * S, hx = s2.x + bend, hy = s2.y - s2.h + Math.abs(bend) * 0.18;
        cb.strokeStyle = stc; cb.lineWidth = 1.5 * S + 0.5; cb.beginPath(); cb.moveTo(s2.x, s2.y); cb.quadraticCurveTo(s2.x + bend * 0.25, s2.y - s2.h * 0.6, hx, hy); cb.stroke();
        n15_earC(cb, hx, hy, s2.L, Math.atan2(bend, s2.h) * 1.3 + 0.12, cl, cd, aw); });
      // chaff and seeds swirling up on the gust
      swirl.forEach(function (s2) { var age = t - s2.t0, al = Math.min(1, age * 3) * Math.min(1, (5 - age) / 1.5); cb.save(); cb.globalAlpha = al; cb.translate(s2.x, s2.y); cb.rotate(s2.rot); cb.fillStyle = '#F6D88A'; n15_ell(cb, 0, 0, 3.6 * S + 1.2, 1.4 * S + 0.5); cb.fill(); cb.restore(); });
    },
    finish: function (t) { fin = {t0: t}; if (dk) flashAt(t + 0.1, true); }
  };
  // a crawler: branches of lightning spreading across the underside of the cloud from one point
  function startCrawl(t, side) { var x0 = A.cx + side * A.BW * 0.4 + (Math.random() - 0.5) * A.BW * 0.2, y0 = A.by - H * 0.03, br = [];
    for (var j = 0; j < 6; j++) { var ang = (side ? (side > 0 ? 0 : Math.PI) : (j % 2 ? 0 : Math.PI)) + (Math.random() - 0.5) * 1.1, L = A.BW * (0.4 + Math.random() * 0.55), x1 = x0 + Math.cos(ang) * L, y1 = y0 + (Math.random() - 0.6) * H * 0.1, p = zig(x0, y0, x1, y1, 14, 30 * S); br.push(p);
      for (var m = 3; m < 12; m += 3 + Math.floor(Math.random() * 3)) br.push(zig(p[m][0], p[m][1], p[m][0] + (x1 - x0) * (0.15 + Math.random() * 0.2), p[m][1] + (Math.random() - 0.3) * H * 0.06, 5, 14 * S)); }
    crawl.push({x: x0, y: y0, t0: t, br: br, seed: Math.random() * 9}); }
};

UIC.storm = {L: ['#4A5A72', '#2E3A4E', 'rgba(255,255,255,0.84)', '#26241E', '#6A6456', '#B86A1E', '#B86A1E', '#D88A2E', '#FFFFFF'], D: ['#1C2648', '#0C1228', 'rgba(16,22,44,0.78)', '#EDF0FA', '#A8B2CE', '#9EB8FF', '#8EA8FF', '#B8CCFF', '#101830']};
