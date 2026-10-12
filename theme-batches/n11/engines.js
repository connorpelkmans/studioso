// ---- batch n11 engines: meadow, glowbay
function n11_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n11_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n11_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n11_ease((T - c) / (d - c)); }
var n11_gc = null;
function n11_ctx() { return n11_gc || (n11_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n11_glow
function n11_rg(col, mid) { var g = n11_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n11_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n11_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
function n11_line(c, pts) { c.beginPath(); pts.forEach(function (p, j) { if (j) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); }
function n11_spark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.25, y - r * 0.25); c.lineTo(x + r, y); c.lineTo(x + r * 0.25, y + r * 0.25); c.lineTo(x, y + r); c.lineTo(x - r * 0.25, y + r * 0.25); c.lineTo(x - r, y); c.lineTo(x - r * 0.25, y - r * 0.25); c.closePath(); c.fill(); }
// draw fn(ctx) on a scratch canvas, erase what the mask (a Path2D of shapes nearer than the drawing) covers, then lay it on c:
// for canvas art that passes BEHIND static art of the layers below the canvas (here: the rocks) without that art being redrawn.
var n11_scr = null;
function n11_occl(c, mask, fn) { var cv = c.canvas, W = cv.width, H = cv.height; if (!n11_scr) n11_scr = document.createElement('canvas'); if (n11_scr.width !== W || n11_scr.height !== H) { n11_scr.width = W; n11_scr.height = H; }
  var g = n11_scr.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(c.getTransform()); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  fn(g); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(mask); g.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(n11_scr, 0, 0); c.restore(); }

// ---------- Poppy Meadow: wind gusts roll through the tall grass and flowers, cloud shadows slide over the meadow, glints run
// down the stream and a poppy petal drifts off now and then. Night: moonlit, silvered grass, closed flowers, drifting mist, stars.
// Moment: a warm gust sweeps across: every flower nods (and opens under the moon), a ribbon of petals spirals up into the sky,
// new poppies pop up across the meadow behind it, and sunbeams fan out from behind the clouds (the moon's halo brightens at night).
// one meadow flower on a canvas: k 0 poppy, 1 cornflower, 2 daisy; o: 0 closed bud .. 1 open (cornflowers are always open)
function n11_fdraw(c, x, y, r, k, o, dk, tilt) { c.save(); c.translate(x, y); c.rotate(tilt || 0); var i;
  if (k === 1) { c.fillStyle = dk ? '#3E52A0' : '#4C78DA'; c.beginPath(); for (i = 0; i < 18; i++) { var a = i * Math.PI / 9 - Math.PI / 2, q = i % 2 ? r * 0.55 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q * 0.82); } c.closePath(); c.fill();
    c.fillStyle = dk ? '#2C3A7C' : '#2E58B8'; c.beginPath(); for (i = 0; i < 18; i++) { var a2 = i * Math.PI / 9 - Math.PI / 2 + 0.17, q2 = i % 2 ? r * 0.3 : r * 0.58; c.lineTo(Math.cos(a2) * q2, Math.sin(a2) * q2 * 0.82); } c.closePath(); c.fill();
    c.fillStyle = dk ? '#1A2050' : '#1E2A6A'; n11_ell(c, 0, 0, r * 0.2, r * 0.16); c.fill(); c.restore(); return; }
  var b = 1 - n11_ease(o * 2), f = n11_ease(o * 2 - 1);
  if (b > 0.01) { c.save(); c.scale(b, b); if (k === 0) c.rotate(0.55);
    c.fillStyle = k === 0 ? (dk ? '#7A3044' : '#B8322A') : (dk ? '#B8C0DA' : '#F6F4EA'); n11_ell(c, 0, -r * 0.1, r * 0.34, r * 0.58); c.fill();
    c.fillStyle = dk ? '#2E4C50' : '#4E8A36'; n11_ell(c, -r * 0.14, r * 0.34, r * 0.16, r * 0.3, 0.4); c.fill(); n11_ell(c, r * 0.14, r * 0.34, r * 0.16, r * 0.3, -0.4); c.fill(); c.restore(); }
  if (f > 0.01) { c.save(); c.scale(f, f);
    if (k === 0) { c.fillStyle = dk ? '#A8364E' : '#C82A22'; n11_ell(c, -r * 0.5, -r * 0.22, r * 0.6, r * 0.56); c.fill(); n11_ell(c, r * 0.5, -r * 0.22, r * 0.6, r * 0.56); c.fill(); n11_ell(c, 0, -r * 0.42, r * 0.62, r * 0.48); c.fill();
      c.fillStyle = dk ? '#D44C64' : '#F04A34'; n11_ell(c, -r * 0.36, r * 0.1, r * 0.58, r * 0.62, -0.3); c.fill(); n11_ell(c, r * 0.36, r * 0.1, r * 0.58, r * 0.62, 0.3); c.fill();
      c.fillStyle = dk ? 'rgba(255,190,210,0.28)' : 'rgba(255,196,170,0.45)'; n11_ell(c, -r * 0.46, -r * 0.02, r * 0.16, r * 0.32, -0.4); c.fill();
      c.fillStyle = '#24161A'; n11_ell(c, 0, -r * 0.36, r * 0.36, r * 0.15); c.fill(); c.fillStyle = dk ? '#6A7A50' : '#7A9A3A'; n11_ell(c, 0, -r * 0.38, r * 0.13, r * 0.06); c.fill(); }
    else { c.save(); c.scale(1, 0.78); c.fillStyle = dk ? '#C8D0EA' : '#FFFFFF'; for (i = 0; i < 12; i++) { var a3 = i / 12 * Math.PI * 2; n11_ell(c, Math.cos(a3) * r * 0.56, Math.sin(a3) * r * 0.56, r * 0.46, r * 0.14, a3); c.fill(); }
      c.fillStyle = dk ? '#A8A070' : '#F6C83A'; n11_ell(c, 0, 0, r * 0.3, r * 0.3); c.fill(); c.fillStyle = dk ? '#8A8458' : '#E2A420'; n11_ell(c, r * 0.08, r * 0.08, r * 0.16, r * 0.16); c.fill(); c.restore(); }
    c.restore(); }
  c.restore(); }
ENGINES.meadow = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Sn = A.sun, i, tnow = 0;
  var sunG = n11_rg(dk ? 'rgba(210,222,255,0.3)' : 'rgba(255,250,215,0.5)', [0.4, 0.3]), shG = n11_rg('rgba(24,70,40,0.17)', [0.55, 0.65]), mistG = n11_rg('rgba(170,190,240,0.12)', [0.5, 0.55]), gustG = n11_rg('rgba(240,255,190,0.3)', [0.5, 0.4]), glowG = n11_rg('rgba(220,230,255,0.55)', [0.3, 0.3]), twG = n11_rg('rgba(255,250,235,0.9)', [0.25, 0.3]);
  var fl = A.fl.map(function (f) { return {x: f.x, y: f.y, h: f.h, k: f.k, r: f.r, ph: f.ph, o: dk && f.k !== 1 ? 0 : 1, tOpen: 0}; });
  var gr = A.gr, ss = A.st, n = ss.length, spots = A.spots.slice().sort(function (a, b) { return a[0] - b[0]; });
  var glints = []; for (i = 0; i < (ph ? 16 : 28); i++) glints.push({u: Math.random(), sp: 0.025 + Math.random() * 0.025, off: (Math.random() - 0.5) * 1.3, ph: Math.random() * 6.28});
  var tws = []; for (i = 0; i < 300 && tws.length < (ph ? 10 : 22); i++) { var tx = Math.random() * W, ty = Math.random() * A.peak, ok = Math.hypot(tx - Sn[0], ty - Sn[1]) > Sn[2] * 3; A.boxes.forEach(function (b) { if (tx > b[0] - 6 && tx < b[2] + 6 && ty > b[1] - 6 && ty < b[3] + 6) ok = false; }); if (ok) tws.push([tx, ty, Math.random() * 6.28]); }
  var petals = [], pops = [], swirl = [], fin = null, stars = [], nextStar = 5;
  function finW(x) { if (!fin) return 0; var T = tnow - fin.t0; if (T > 3.4) return 0; var xf = -150 + (W + 300) * (T / 2.8), d = (x - xf) / (W * 0.1 + 60); return 1.15 * Math.exp(-d * d); }
  function wind(x, t) { var g = 0.5 + 0.5 * Math.sin(x * 0.005 - t * 1.4); return 0.2 + g * g * 0.65 + Math.sin(t * 2.1 + x * 0.03) * 0.07 + finW(x); }
  return {
    step: function (dt, t, f) { tnow = t;
      if (!dk && Math.random() < dt * 0.45 && petals.length < 8) { var src = fl[Math.floor(Math.random() * fl.length)]; if (src.k !== 1) petals.push({x: src.x + 8, y: src.y - src.h, vx: (24 + Math.random() * 30) * S, vy: -(8 + Math.random() * 16) * S, t0: t, ph: Math.random() * 6.28, c: src.k ? '#FFFFFF' : '#EA4630'}); }
      petals.forEach(function (p) { p.x += p.vx * dt * (0.6 + wind(p.x, t)); p.y += (p.vy + Math.sin((t - p.t0) * 2.2 + p.ph) * 16 * S) * dt; }); petals = petals.filter(function (p) { return t - p.t0 < 8 && p.x < W + 30; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 9 + Math.random() * 10; stars.push({t0: t, x: W * (0.25 + Math.random() * 0.7), y: H * (0.03 + Math.random() * 0.1)}); } }
      stars = stars.filter(function (s) { return t - s.t0 < 1.2; });
      if (fin) { var T = t - fin.t0, xf = -150 + (W + 300) * (T / 2.8);
        fl.forEach(function (fo) { if (!fo.hit && xf > fo.x) { fo.hit = 1; fo.tOpen = t; } });
        if (T < 3.1) { var em = dt * (ph ? 34 : 60); while (em > 0) { if (Math.random() < em) { var kk = Math.random(); swirl.push({x: xf - Math.random() * 80, y: H * (0.72 + Math.random() * 0.26), vx: (90 + Math.random() * 110) * S * (ph ? 0.9 : 1.3), vy: -(40 + Math.random() * 90) * S, t0: t, ph: Math.random() * 6.28, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8, c: kk < 0.6 ? 0 : kk < 0.85 ? 1 : 2}); } em -= 1; } }
        while (fin.si < spots.length && spots[fin.si][0] < xf) { var sp = spots[fin.si]; if (Math.random() < (ph ? 0.6 : 0.85)) pops.push({x: sp[0], y: sp[1], r: (1.6 + sp[2] * sp[2] * 7) * S * (ph ? 1.5 : 1.1) + 1.5, t0: t + Math.random() * 0.3, k: Math.random() < 0.75 ? 0 : 2}); fin.si++; }
        if (T > 16) { fin = null; fl.forEach(function (fo) { fo.hit = 0; }); } }
      swirl.forEach(function (s) { var age = t - s.t0; s.vy -= 26 * S * dt; s.x += (s.vx + Math.cos(age * 3 + s.ph) * 60 * S) * dt; s.y += (s.vy + Math.sin(age * 3 + s.ph) * 40 * S) * dt; s.rot += s.vr * dt; }); swirl = swirl.filter(function (s) { return t - s.t0 < 5.5 && s.y > -30; });
      pops = pops.filter(function (p) { return t - p.t0 < 34; });
      fl.forEach(function (fo) { var want = !dk || fo.k === 1 ? 1 : (fo.tOpen && t - fo.tOpen < 10 ? 1 : 0); fo.o += (want - fo.o) * Math.min(1, dt * (want > fo.o ? 3.5 : 0.7)); });
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, rk = fin ? n11_env(T, 0.4, 1.4, 5, 8) : 0;
      // the sun's soft glow (the moon's at night), stronger in the moment
      ca.save(); ca.globalCompositeOperation = 'lighter'; n11_glow(ca, sunG, Sn[0], Sn[1], Sn[2] * (dk ? 4.2 : 3.6) * (1 + 0.03 * Math.sin(tt * 0.7) + rk * 0.5), 0.75 + rk * 0.25);
      if (rk > 0 && !dk) { for (i = 0; i < 8; i++) { var a = 0.08 + i * 0.16 + Math.sin(tt * 0.3 + i) * 0.02, L = W * 1.1, w = (30 + i % 3 * 20) * S; ca.fillStyle = 'rgba(255,248,215,' + (0.1 * rk * (0.6 + 0.4 * Math.sin(tt * 1.3 + i * 2))) + ')'; ca.beginPath(); ca.moveTo(Sn[0], Sn[1]); ca.lineTo(Sn[0] + Math.cos(a - 0.03) * L - w, Sn[1] + Math.sin(a - 0.03) * L); ca.lineTo(Sn[0] + Math.cos(a + 0.03) * L + w, Sn[1] + Math.sin(a + 0.03) * L); ca.closePath(); ca.fill(); } }
      if (dk) tws.forEach(function (s, j) { var a2 = Math.pow(Math.max(0, Math.sin(tt * 1.3 + s[2] + j)), 4); n11_glow(ca, twG, s[0], s[1], 4 + a2 * 3, a2 * 0.9); });
      ca.restore();
      // cloud shadows sliding over the meadow by day; by night, mist drifting low over the hills
      if (!dk) { for (i = 0; i < 3; i++) { var cx = ((tt * 10 + i * 560) % (W + 1000)) - 500, cy = A.gy + (H - A.gy) * (0.12 + i * 0.3); n11_glow(ca, shG, cx, cy, (320 + i * 80) * S * (ph ? 1.4 : 1), 1, 0.16 + i * 0.05); }
        var gx = ((tt * 70) % (W + 700)) - 350; n11_glow(ca, gustG, gx, A.gy + (H - A.gy) * 0.55, 300 * S, 0.8, 0.3); }
      else { for (i = 0; i < 4; i++) { var mx = ((tt * (5 + i) + i * 420) % (W + 900)) - 450, my = A.hz + H * (0.025 + i * 0.035); n11_glow(ca, mistG, mx, my, (300 + i * 50) * S * (ph ? 1.4 : 1), 0.9, 0.11); } }
      // glints running down the stream
      ca.fillStyle = dk ? '#CCD8FF' : '#FFFFFF';
      glints.forEach(function (g) { var u = (g.u + tt * g.sp) % 1, j = Math.min(n - 1, Math.floor(u * (n - 1))), s = ss[j]; if (s.hw < 2.5) return; var off = g.off * s.hw * 0.6, x = s.x - Math.sin(s.a) * off, y = s.y + Math.cos(s.a) * off * 0.45, a3 = Math.sin(Math.PI * u) * (0.45 + 0.55 * Math.max(0, Math.sin(tt * 2.6 + g.ph)));
        ca.globalAlpha = a3 * (dk ? 0.6 : 0.9); n11_ell(ca, x, y, s.hw * 0.32, Math.max(0.6, s.hw * 0.055), s.a); ca.fill(); }); ca.globalAlpha = 1;
      // two tiny birds far off, now and then (day)
      var bu = (tt / 60) % 1; if (!dk && bu < 0.5) { var bx = -40 + (W + 80) * bu / 0.5, by = H * (ph ? 0.2 : 0.16) + Math.sin(bu * 9) * 8; ca.strokeStyle = 'rgba(60,72,96,0.6)'; ca.lineWidth = 1.2; ca.lineCap = 'round'; ca.beginPath();
        [[0, 0], [11 * S + 4, 5 * S + 2]].forEach(function (q, j) { var s2 = 3 * S + 1.6, fp = Math.sin(tt * 6 + j * 2) * 0.6, x2 = bx - q[0], y2 = by + q[1]; ca.moveTo(x2 - s2, y2 - s2 * (0.3 + fp * 0.5)); ca.quadraticCurveTo(x2 - s2 * 0.4, y2 - s2 * 0.4, x2, y2); ca.quadraticCurveTo(x2 + s2 * 0.4, y2 - s2 * 0.4, x2 + s2, y2 - s2 * (0.3 + fp * 0.5)); }); ca.stroke(); }
      // new poppies that sprang up behind the gust
      pops.forEach(function (p) { var age = t - p.t0; if (age < 0) return; var k = age / 0.5, sc = (k >= 1 ? 1 : n11_ease(k) * (1 + 0.3 * Math.sin(Math.PI * k))) * (1 - n11_ease((age - 30) / 4)); if (sc <= 0.01) return;
        ca.strokeStyle = dk ? '#2C484C' : '#4B8A34'; ca.lineWidth = Math.max(1, p.r * 0.18); ca.beginPath(); ca.moveTo(p.x, p.y + p.r * 2.2); ca.quadraticCurveTo(p.x - p.r * 0.2, p.y + p.r * 1.2, p.x, p.y + p.r * (2.2 - 1.8 * sc)); ca.stroke();
        if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; n11_glow(ca, glowG, p.x, p.y + p.r * (0.4 - 0.4 * sc), p.r * 2.2, 0.35 * sc); ca.restore(); }
        n11_fdraw(ca, p.x, p.y + p.r * 0.4 * (1 - sc), p.r * sc, p.k, 1, dk, 0); });
      // petals drifting on the breeze
      petals.forEach(function (p) { var age = t - p.t0; cb.save(); cb.globalAlpha = Math.min(1, age * 2) * Math.min(1, (8 - age) / 1.5); cb.translate(p.x, p.y); cb.rotate(age * 3 + p.ph); cb.fillStyle = p.c; n11_ell(cb, 0, 0, 4 * S + 1.4, 2.2 * S + 0.8); cb.fill(); cb.restore(); });
      // the tall grass and flowers along the bottom edge, swaying as gusts pass (half the grass behind the flowers, half in front)
      cb.lineCap = 'round';
      var blade = function (b) { var bend = (wind(b.x, tt) * 0.55 + b.lean) * b.h * 0.6, x = b.x, y = H + 4;
        cb.strokeStyle = dk ? (b.c ? '#26424A' : '#33525A') : (b.c ? '#4E9A38' : '#78BC4C'); cb.lineWidth = (ph ? 2.2 : 2.8) * S + 0.6; cb.beginPath(); cb.moveTo(x, y); cb.quadraticCurveTo(x + bend * 0.25, y - b.h * 0.6, x + bend, y - b.h + Math.abs(bend) * 0.15); cb.stroke();
        if (dk) { cb.strokeStyle = 'rgba(190,206,236,' + (0.3 + wind(b.x, tt) * 0.25) + ')'; cb.lineWidth = 1.1; cb.beginPath(); cb.moveTo(x + bend * 0.7, y - b.h * 0.82); cb.lineTo(x + bend, y - b.h + Math.abs(bend) * 0.15); cb.stroke(); } };
      gr.forEach(function (b, j) { if (j % 2) blade(b); });
      fl.forEach(function (fo) { var w = wind(fo.x, tt), bend = w * fo.h * 0.3 + Math.sin(tt * 1.6 + fo.ph) * 2 * S, hx = fo.x + bend + fo.h * 0.04, hy = fo.y - fo.h + Math.abs(bend) * 0.14, pk = fo.tOpen ? (t - fo.tOpen) / 0.6 : 2, pop = pk < 1 ? 1 + 0.22 * Math.sin(Math.PI * pk) : 1;
        cb.strokeStyle = dk ? '#2C484C' : '#4B8A34'; cb.lineWidth = 2 * S + 0.6; cb.beginPath(); cb.moveTo(fo.x, fo.y); cb.quadraticCurveTo(fo.x + bend * 0.2, fo.y - fo.h * 0.55, hx, hy + fo.r * 0.45); cb.stroke();
        cb.fillStyle = dk ? '#2C484C' : '#5A9A3E'; [0.32, 0.5].forEach(function (u, j) { var lx = fo.x + bend * 0.2 * u * 2, ly = fo.y - fo.h * u, sd = j ? 1 : -1; n11_ell(cb, lx + sd * fo.r * 0.45, ly, fo.r * 0.5, fo.r * 0.14, sd * 0.5 - 0.2); cb.fill(); });
        if (dk && fo.k !== 1 && fo.o > 0.05) { cb.save(); cb.globalCompositeOperation = 'lighter'; n11_glow(cb, glowG, hx, hy, fo.r * 2.4, fo.o * 0.4); cb.restore(); }
        n11_fdraw(cb, hx, hy, fo.r * pop, fo.k, fo.o, dk, bend * 0.012); });
      gr.forEach(function (b, j) { if (!(j % 2)) blade(b); });
      // the ribbon of petals spiralling up on the gust
      swirl.forEach(function (s) { var age = t - s.t0, al = Math.min(1, age * 3) * Math.min(1, (5.5 - age) / 1.5); cb.save(); cb.globalAlpha = al; cb.translate(s.x, s.y); cb.rotate(s.rot);
        if (dk) { cb.globalCompositeOperation = 'lighter'; n11_glow(cb, glowG, 0, 0, 9 * S + 3, 0.35); cb.globalCompositeOperation = 'source-over'; }
        cb.fillStyle = s.c === 0 ? (dk ? '#E06A7E' : '#EA4630') : s.c === 1 ? (dk ? '#E4E8FA' : '#FFFFFF') : (dk ? '#8EA2F0' : '#5A84E2'); n11_ell(cb, 0, 0, 5 * S + 1.6, 2.6 * S + 0.9); cb.fill(); cb.restore(); });
      // shooting stars
      stars.forEach(function (s) { var k = (t - s.t0) / 1.2; cb.strokeStyle = 'rgba(255,248,230,' + Math.sin(Math.PI * k) * 0.9 + ')'; cb.lineWidth = 1.6; cb.beginPath(); cb.moveTo(s.x - k * 170, s.y + k * 60); cb.lineTo(s.x - k * 170 + 46, s.y + k * 60 - 16); cb.stroke(); });
    },
    finish: function (t) { fin = {t0: t, si: 0}; fl.forEach(function (fo) { fo.hit = 0; }); if (dk) { stars.push({t0: t + 0.6, x: W * 0.8, y: H * 0.06}); stars.push({t0: t + 2.2, x: W * 0.5, y: H * 0.1}); } }
  };
};

UIC.meadow = {L: ['#3E7A44', '#2A5530', 'rgba(255,255,255,0.84)', '#1E3020', '#55675A', '#C2362A', '#C2362A', '#D4502E', '#FFFFFF'], D: ['#1E2A50', '#101A34', 'rgba(20,28,54,0.78)', '#EEF1FA', '#AEB6CE', '#F0786A', '#F0786A', '#F59A7A', '#1A1220']};

// ---------- Glowing Bay: swells roll into the cove and lap up the crescent of sand, palm fronds sway, the sun's glitter path
// twinkles, waves splash against the headland rocks, a tiny sailboat crosses the horizon. Night: the waves and the shoreline
// glow electric blue (bioluminescent water), glowing spray flies off the rocks, plankton sparks wink in the cove under the Milky Way.
// Moment: one big wave rolls across the whole bay, blazes along its crest (golden foam by day), bursts into spray on both
// headlands, surges far up the beach and leaves the whole shoreline glittering as it drains away.
ENGINES.glowbay = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Cv = A.cove, sh = A.shore, mY = A.mouthY, i;
  var rmask = new Path2D(A.rmask), fronds = {};
  var sunG = n11_rg('rgba(255,222,160,0.55)', [0.35, 0.35]), cyG = n11_rg('rgba(80,232,255,0.9)', [0.3, 0.4]), cyW = n11_rg('rgba(40,190,255,0.45)', [0.4, 0.45]), whG = n11_rg('rgba(255,255,255,0.85)', [0.3, 0.35]), goldG = n11_rg('rgba(255,234,170,0.95)', [0.3, 0.35]), twG = n11_rg('rgba(240,246,255,0.95)', [0.25, 0.3]), lampG = n11_rg('rgba(255,210,140,0.9)', [0.3, 0.3]);
  function shoreAt(x) { return n11_yOn(sh, x); }
  function wy(x, u) { return mY + (shoreAt(x) - mY) * Math.pow(u, 1.25); }
  function xr(u) { return [Cv.cl + (Cv.bl - Cv.cl) * u - 24, Cv.cr + (Cv.br - Cv.cr) * u + 24]; }
  function frondPath(L) { var k = Math.round(L); return fronds[k] || (fronds[k] = new Path2D(n11_frond(0, 0, 0, L, 0.9))); }
  var bl = Cv.bl + W * 0.015, br = Cv.br - W * 0.015, edge = function (x) { return n11_ease(Math.min((x - bl) / (W * 0.12), (br - x) / (W * 0.12))); };
  var splashes = A.splash.map(function (p, j) { return {x: p[0], y: p[1], r: p[2], next: 1.2 + j * 1.1 + Math.random() * 3, t0: -9}; });
  var drops = [], glits = [], fin = null, stars = [], nextStar = 4, residue = [], lastK = [0, 0];
  var plank = []; for (i = 0; i < (ph ? 40 : 90); i++) plank.push({u: 0.25 + Math.random() * 0.72, f: Math.random(), ph: Math.random() * 6.28, sp: 0.8 + Math.random() * 1.6});
  function burst(s, n, big) { for (var k = 0; k < n; k++) drops.push({x: s.x + (Math.random() - 0.5) * s.r * 1.2, y: s.y, y0: s.y, vx: (Math.random() - 0.5) * (big ? 160 : 90) * S, vy: -(60 + Math.random() * (big ? 180 : 100)) * S, t0: drops.t || 0, r: (0.7 + Math.random() * 1.3) * S + 0.5}); s.t0 = drops.t || 0; }
  function wash(c, reach, k, x0, x1, glowI, tt) { var pts = []; for (var x = x0; x <= x1; x += 9) pts.push([x, shoreAt(x) + reach * edge(x) * (0.7 + 0.3 * Math.cos((x / W - 0.5) * 3)) + Math.sin(x / 45 + tt * 1.3) * 2 * S * edge(x)]); if (pts.length < 2) return pts;
    c.fillStyle = dk ? 'rgba(30,170,255,' + (0.2 * k) + ')' : 'rgba(170,238,228,' + (0.6 * k) + ')'; c.beginPath(); c.moveTo(x0, shoreAt(x0) - 3); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(x1, shoreAt(x1) - 3); for (x = x1; x >= x0; x -= 18) c.lineTo(x, shoreAt(x) - 3); c.closePath(); c.fill();
    if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; [[16, 0.12], [7, 0.32], [2.2, 0.95]].forEach(function (q, j) { c.strokeStyle = j === 2 ? 'rgba(210,255,255,' + (q[1] * glowI) + ')' : 'rgba(60,220,255,' + (q[1] * glowI) + ')'; c.lineWidth = q[0] * S + (j === 2 ? 0.8 : 1); n11_line(c, pts); c.stroke(); }); c.restore(); }
    else { c.strokeStyle = 'rgba(255,255,255,' + (0.95 * Math.min(1, k * 1.5)) + ')'; c.lineWidth = 2.6 * S + 0.8; c.lineCap = 'round'; n11_line(c, pts); c.stroke(); c.strokeStyle = 'rgba(255,255,255,' + (0.4 * k) + ')'; c.lineWidth = 1.2; n11_line(c, pts.map(function (p) { return [p[0], p[1] - 5 * S]; })); c.stroke(); }
    return pts; }
  return {
    step: function (dt, t, f) { drops.t = t;
      splashes.forEach(function (s) { s.next -= dt * f.s; if (s.next <= 0) { s.next = 5 + Math.random() * 7; burst(s, ph ? 7 : 11, false); } });
      drops.forEach(function (d) { d.vy += 300 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt; }); drops = drops.filter(function (d) { return d.y < d.y0 + 8 && t - d.t0 < 3; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 7 + Math.random() * 9; stars.push({t0: t, x: W * (0.3 + Math.random() * 0.6), y: A.hz * (0.08 + Math.random() * 0.35)}); } }
      stars = stars.filter(function (s) { return t - s.t0 < 1.1; }); residue = residue.filter(function (r) { return t - r.t0 < 2.6; });
      if (fin) { var T = t - fin.t0;
        if (!fin.hit && T > 1.5) { fin.hit = 1; splashes.forEach(function (s) { burst(s, ph ? 16 : 26, true); }); }
        if (!fin.gl && T > 3.3) { fin.gl = 1; for (i = 0; i < (ph ? 120 : 260); i++) { var gx = bl + Math.random() * (br - bl), up = Math.random(); glits.push({x: gx, y: shoreAt(gx) - H * 0.05 * up * up + H * 0.06 * Math.random() * edge(gx), ph: Math.random() * 6.28, sp: 2 + Math.random() * 4, r: (1.2 + Math.random() * 2) * S + 0.6}); } }
        if (T > 10) { fin = null; glits = []; } }
    },
    draw: function (ca, cb, t, f) { var tt = t * f.s, T = fin ? t - fin.t0 : -1, calm = fin ? 1 - n11_env(T, 0, 0.6, 6.5, 8) : 1;
      // sun glow and glitter by day; twinkling stars and shooting stars by night
      ca.save(); ca.globalCompositeOperation = 'lighter';
      if (!dk) n11_glow(ca, sunG, A.sun[0], A.sun[1], A.sun[2] * 4 * (1 + 0.03 * Math.sin(tt * 0.6)), 0.8);
      else { A.tw.forEach(function (s, j) { var a = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] * 6.28 + j)), 4); n11_glow(ca, twG, s[0], s[1], 3 + a * 3.5, a * 0.9); }); n11_glow(ca, twG, A.moon[0], A.moon[1], A.moon[2] * 3, 0.12); }
      ca.restore();
      stars.forEach(function (s) { var k = (t - s.t0) / 1.1; ca.strokeStyle = 'rgba(240,248,255,' + Math.sin(Math.PI * k) * 0.9 + ')'; ca.lineWidth = 1.6; ca.beginPath(); ca.moveTo(s.x + k * 160, s.y + k * 70); ca.lineTo(s.x + k * 160 - 44, s.y + k * 70 - 19); ca.stroke(); });
      // everything on the water passes behind the rocks
      n11_occl(ca, rmask, function (c) {
        // the sailboat on the horizon
        var bx = ((tt * 3.2 + W * 0.42) % (W + 120)) - 60, by = A.hz + 4 * S + 1, s = (ph ? 0.75 : 1) * S;
        c.fillStyle = dk ? '#0A1428' : '#5A4A44'; c.beginPath(); c.moveTo(bx - 9 * s, by); c.lineTo(bx + 9 * s, by); c.lineTo(bx + 6 * s, by + 3 * s); c.lineTo(bx - 6 * s, by + 3 * s); c.closePath(); c.fill();
        c.fillStyle = dk ? '#0E1C36' : '#FFF4E2'; c.beginPath(); c.moveTo(bx, by - 1); c.lineTo(bx, by - 17 * s); c.lineTo(bx + 8 * s, by - 1); c.closePath(); c.fill(); c.beginPath(); c.moveTo(bx - 1, by - 1); c.lineTo(bx - 1, by - 13 * s); c.lineTo(bx - 7 * s, by - 1); c.closePath(); c.fill();
        if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; n11_glow(c, lampG, bx, by - 17 * s, 5, 0.6 + 0.3 * Math.sin(tt * 2)); c.restore(); }
        // the sun's glitter path twinkling
        if (!dk) { c.fillStyle = '#FFFBEA'; for (i = 0; i < (ph ? 16 : 30); i++) { var gyy = A.hz + 3 + ((i * 37.3) % (mY + (A.yC - A.Dp - mY) * 0.8 - A.hz)), gxx = A.sun[0] + (hash(i + 3) - 0.5) * (8 + (gyy - A.hz) * 0.7), ga = Math.pow(Math.max(0, Math.sin(tt * 2.6 + i * 1.7)), 3); if (ga > 0.02) { c.globalAlpha = ga; n11_spark(c, gxx, gyy, (2 + (gyy - A.hz) * 0.03) * S + 1); } } c.globalAlpha = 1; }
        // swells rolling into the cove; near the shore they break (and at night their crests light up)
        for (i = 0; i < 5; i++) { var u = (tt * 0.06 + i / 5) % 1, a = (u < 0.12 ? u / 0.12 : u > 0.9 ? (1 - u) / 0.1 : 1) * calm, rg = xr(u), pts = [];
          for (var x = rg[0]; x <= rg[1]; x += 12) pts.push([x, wy(x, u) + Math.sin(x / 60 + i * 2 + tt * 0.6) * 2 * S * (0.5 + u)]);
          if (!dk) { c.strokeStyle = 'rgba(255,255,255,' + (a * (0.35 + 0.5 * u)) + ')'; c.lineWidth = (0.8 + u * 2.6) * S + 0.4; c.lineCap = 'round'; n11_line(c, pts); c.stroke(); }
          else { c.strokeStyle = 'rgba(90,170,255,' + (a * 0.16) + ')'; c.lineWidth = (1 + u * 2) * S + 0.5; n11_line(c, pts); c.stroke();
            var g = n11_ease((u - 0.55) / 0.4) * a; if (g > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; [[13, 0.13], [5.5, 0.34], [1.8, 0.9]].forEach(function (q, j) { c.strokeStyle = j === 2 ? 'rgba(210,255,255,' + (q[1] * g) + ')' : 'rgba(50,215,255,' + (q[1] * g) + ')'; c.lineWidth = q[0] * S * (0.5 + u * 0.6) + 0.6; n11_line(c, pts); c.stroke(); });
              for (var m = 0; m < 6; m++) { var px = rg[0] + (rg[1] - rg[0]) * hash(i * 13 + m + Math.floor(tt * 0.06 + i / 5) * 7), sa = Math.pow(Math.abs(Math.sin(tt * 3 + m * 1.7 + i)), 3) * g; n11_glow(c, cyG, px, wy(px, u), 8 * S + 2, sa * 0.8); } c.restore(); } } }
        // plankton sparks winking in the dark cove
        if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; plank.forEach(function (p) { var rg2 = xr(p.u), px2 = rg2[0] + 20 + (rg2[1] - rg2[0] - 40) * p.f, sa2 = Math.pow(Math.max(0, Math.sin(tt * p.sp + p.ph)), 6); if (sa2 > 0.02) n11_glow(c, cyG, px2, wy(px2, p.u), (2 + p.u * 4) * S + 1, sa2 * 0.7); }); c.restore(); }
        // the waves washing up the sand, with the glowing line they leave at night
        if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; residue.forEach(function (r) { var k = 1 - (t - r.t0) / 2.6; c.strokeStyle = 'rgba(60,220,255,' + (0.35 * k) + ')'; c.lineWidth = 4 * S + 1; n11_line(c, r.pts); c.stroke(); c.strokeStyle = 'rgba(200,255,255,' + (0.4 * k * k) + ')'; c.lineWidth = 1.2; n11_line(c, r.pts); c.stroke(); }); c.restore(); }
        if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; for (var gx2 = bl + 30; gx2 < br - 20; gx2 += 70 * S + 20) { var br2 = 0.12 + 0.07 * Math.sin(tt * 0.9 + gx2 * 0.01); n11_glow(c, cyW, gx2, shoreAt(gx2) + 6 * S, (70 * S + 20) * edge(gx2), br2 * edge(gx2) * calm, 0.35); } c.restore(); }
        for (var w = 0; w < 2; w++) { var p = ((tt + w * 3.6) % 7.2) / 7.2, k = p < 0.35 ? n11_ease(p / 0.35) : 1 - n11_ease((p - 0.35) / 0.65), reach = H * (ph ? 0.026 : 0.032) * k * (w ? 0.75 : 1) * calm;
          var pts2 = wash(c, reach, k * calm, bl, br, (p < 0.35 ? 0.5 + 0.5 * k : k * 0.8) * calm, tt + w * 2);
          if (dk && lastK[w] < 0.35 && p >= 0.35 && pts2.length) residue.push({t0: t, pts: pts2}); lastK[w] = p; }
        // the moment: one big wave rolls in across the whole bay, then surges up the beach
        if (fin) { if (T < 2.6) { var u2 = n11_ease(T / 2.6), rg3 = xr(u2), cr = [], back = [];
            for (var x3 = rg3[0]; x3 <= rg3[1]; x3 += 10) { var yy = wy(x3, u2) + Math.sin(x3 / 50 + T * 4) * 3 * S; cr.push([x3, yy]); back.unshift([x3, wy(x3, Math.max(0, u2 - 0.09)) + 2]); }
            c.fillStyle = dk ? 'rgba(30,140,230,0.25)' : 'rgba(120,224,214,0.55)'; n11_line(c, cr.concat(back)); c.closePath(); c.fill();
            c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
            if (dk) { c.globalCompositeOperation = 'lighter'; [[30, 0.16], [13, 0.4], [4.5, 1]].forEach(function (q, j) { c.strokeStyle = j === 2 ? 'rgba(220,255,255,' + q[1] + ')' : 'rgba(60,225,255,' + q[1] + ')'; c.lineWidth = q[0] * S * (0.5 + u2 * 0.7) + 1; n11_line(c, cr); c.stroke(); }); for (var m2 = 0; m2 < (ph ? 14 : 26); m2++) { var q2 = cr[Math.floor(hash(m2 + 3) * (cr.length - 1))]; n11_glow(c, cyG, q2[0], q2[1] - hash(m2 + 9) * 14 * S, (6 + hash(m2) * 8) * S, Math.abs(Math.sin(tt * 5 + m2))); } }
            else { c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = (3 + u2 * 4) * S + 1; n11_line(c, cr); c.stroke(); c.globalCompositeOperation = 'lighter'; for (var m3 = 0; m3 < (ph ? 12 : 22); m3++) { var q3 = cr[Math.floor(hash(m3 + 5) * (cr.length - 1))], ga2 = Math.pow(Math.abs(Math.sin(tt * 6 + m3 * 1.3)), 3); n11_glow(c, goldG, q3[0], q3[1] - 3 * S, (5 + hash(m3) * 6) * S, ga2 * 0.9); } }
            c.restore(); }
          var ks = n11_env(T, 2.2, 3.1, 3.4, 6.4); if (ks > 0) wash(c, H * (ph ? 0.06 : 0.075) * ks, Math.min(1, ks * 1.2), bl, br, Math.min(1, ks * 1.6), tt);
          // the shoreline left glittering as the water drains away
          var ga3 = fin.gl ? 1 - n11_ease((T - 6) / 4) : 0; if (ga3 > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glits.forEach(function (g2) { var a4 = Math.pow(Math.max(0, Math.sin(tt * g2.sp + g2.ph)), 3) * ga3 * Math.min(1, (T - 3.3) * 2); if (a4 > 0.02) { if (dk) { n11_glow(c, cyW, g2.x, g2.y, g2.r * 2.6, a4 * 0.6); c.fillStyle = 'rgba(210,255,255,' + a4 + ')'; n11_spark(c, g2.x, g2.y, g2.r * 1.3); } else { c.fillStyle = 'rgba(255,246,210,' + a4 + ')'; n11_spark(c, g2.x, g2.y, g2.r * 1.6); } } }); c.restore(); } }
      });
      // spray off the rocks (in front of them)
      ca.save(); if (dk) ca.globalCompositeOperation = 'lighter';
      splashes.forEach(function (s) { var age = t - s.t0; if (age < 1.2) n11_glow(ca, dk ? cyW : whG, s.x, s.y, s.r * (1 + age), (1 - age / 1.2) * (dk ? 0.8 : 0.6), 0.45); });
      drops.forEach(function (d) { if (dk) { n11_glow(ca, cyG, d.x, d.y, d.r * 4, 0.6); ca.fillStyle = '#D2FFFF'; } else ca.fillStyle = 'rgba(255,255,255,0.95)'; ca.beginPath(); ca.arc(d.x, d.y, d.r, 0, 7); ca.fill(); });
      ca.restore();
      // palm crowns swaying over everything
      A.crowns.forEach(function (c2) { var sw = Math.sin(tt * 0.8 + c2.ph) * 0.05 + Math.sin(tt * 1.9 + c2.ph * 2) * 0.015;
        [-2.95, -2.55, -2.1, -1.65, -1.2, -0.75, -0.3, 0.2, 2.75].forEach(function (a, m) { var aa = a + sw * (1 + m * 0.1), L = c2.L * (0.85 + (m % 3) * 0.1), left = Math.cos(aa) < 0; cb.save(); cb.translate(c2.x, c2.y); if (left) { cb.scale(-1, 1); aa = Math.PI - aa; } cb.rotate(aa); cb.fillStyle = m % 2 ? (dk ? '#0F241E' : '#3E8A44') : (dk ? '#173228' : '#58A84E'); cb.fill(frondPath(L)); cb.restore(); });
        cb.fillStyle = dk ? '#242A36' : '#7A5432'; [[-5, 6], [5, 7], [0, 11]].forEach(function (q) { cb.beginPath(); cb.arc(c2.x + q[0] * S, c2.y + q[1] * S, 5 * S + 1, 0, 7); cb.fill(); }); });
    },
    finish: function (t) { fin = {t0: t}; glits = []; }
  };
};

UIC.glowbay = {L: ['#1E7A8A', '#135866', 'rgba(255,255,255,0.84)', '#123034', '#4A686A', '#C8582A', '#C8582A', '#DC7A3A', '#FFFFFF'], D: ['#0A1C3A', '#040C1E', 'rgba(8,20,40,0.78)', '#E6F6FC', '#9CB8C8', '#5CE6FF', '#3FE0FF', '#7AF0FF', '#04121F']};
