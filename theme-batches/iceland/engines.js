// ---- world theme engine: iceland
// Loop: the falls pour (streaks slide down each sheet, white water churns at the foot, rings spread on the pools) and mist
// rises; grass ripples in the wind; the horses graze, lift their heads and toss their manes; puffins flap past; waves roll
// up the black sand; steam curls from the geyser. Night: green aurora curtains ripple over the mountain, stars twinkle and
// the cottage windows glow. Moment: the geyser bubbles, then shoots a tall white column of water and steam into the air,
// and a rainbow forms in the waterfall spray as a flock of puffins flies through it.
function iceland_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function iceland_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return iceland_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - iceland_ease((T - c) / (d - c)); }
var iceland_gc = null;
function iceland_ctx() { return iceland_gc || (iceland_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with iceland_dot)
function iceland_rg(col, mid) { var g = iceland_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function iceland_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function iceland_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
// a puffin in flight, side view, facing right (dir -1 flips it); f is the wingbeat phase, s about its length / 20
function iceland_puffin(c, x, y, s, f, dir, dk) {
  c.save(); c.translate(x, y); c.scale(s * (dir || 1), s);
  var up = Math.sin(f);
  c.fillStyle = dk ? '#E06A2A' : '#F07A2E'; c.beginPath(); c.moveTo(-7, 2); c.lineTo(-12, 4.4); c.lineTo(-11, 1.4); c.closePath(); c.fill();
  c.fillStyle = dk ? '#14141A' : '#222028'; c.beginPath(); c.ellipse(-4 + 0, 3.2, 3, 7 * Math.max(0.15, Math.abs(up)), 0.5, 0, 7); c.fill();   // far wing
  c.beginPath(); c.ellipse(0, 0, 8.6, 4.6, -0.08, 0, 7); c.fill();
  c.fillStyle = dk ? '#C8CCD4' : '#FFFFFF'; c.beginPath(); c.ellipse(1, 2.2, 6.4, 2.4, -0.08, 0, 7); c.fill();
  c.fillStyle = dk ? '#14141A' : '#222028'; c.beginPath(); c.arc(7.4, -1.6, 3.9, 0, 7); c.fill();
  c.fillStyle = dk ? '#C8CCD4' : '#F4F2EE'; c.beginPath(); c.ellipse(8.2, -1.2, 2.6, 2.4, 0, 0, 7); c.fill();
  c.fillStyle = '#2A2A30'; c.beginPath(); c.arc(8.4, -2, 0.75, 0, 7); c.fill();
  c.fillStyle = dk ? '#D8642E' : '#F2742A'; c.beginPath(); c.moveTo(10.4, -3.6); c.quadraticCurveTo(15.6, -1.6, 10.6, 1.4); c.closePath(); c.fill();
  c.fillStyle = dk ? '#C8B060' : '#F4D04A'; c.fillRect(10.4, -2.6, 1.4, 3);
  c.fillStyle = dk ? '#1C1C22' : '#2C2A32'; c.save(); c.translate(-1, -1); c.rotate(-up * 1.1); c.beginPath(); c.ellipse(-1, -5, 2.6, 7, -0.25, 0, 7); c.fill(); c.restore();   // near wing
  c.restore(); }
ENGINES.iceland = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.C, S = A.S, T0 = -99, i;
  var skyP = new Path2D(); skyP.moveTo(-60, -60); skyP.lineTo(W + 60, -60); for (i = A.skyline.length - 1; i >= 0; i--) skyP.lineTo(A.skyline[i][0], A.skyline[i][1] + 1); skyP.closePath();
  var fallP = new Path2D(A.fallPath), tiers = A.tiers, pools = A.pools, G = A.geyser, M = A.moon;
  var mistG = iceland_rg(dk ? 'rgba(190,225,245,0.4)' : 'rgba(255,255,255,0.6)', [0.4, 0.22]), steamG = iceland_rg(dk ? 'rgba(200,220,235,0.55)' : 'rgba(255,255,255,0.8)', [0.45, 0.4]), litG = iceland_rg('rgba(255,196,110,0.7)', [0.25, 0.3]);
  // aurora curtains: a unit strip, bright green at its foot fading up through teal to a violet fringe
  var aur = iceland_ctx().createLinearGradient(0, -1, 0, 0); aur.addColorStop(0, 'rgba(170,110,255,0)'); aur.addColorStop(0.3, 'rgba(150,120,255,0.12)'); aur.addColorStop(0.62, 'rgba(90,230,190,0.32)'); aur.addColorStop(0.9, 'rgba(130,255,190,0.72)'); aur.addColorStop(1, 'rgba(130,255,190,0)');
  var curt = [[0.16, 0.18, 0.62, 1], [0.24, 0.42, 1.04, 0.85], [0.1, 0.05, 0.4, 0.6]].map(function (q, k) { return {y: H * q[0] + H * 0.05, x0: W * q[1], x1: W * q[2], h: H * (ph ? 0.14 : 0.2) * q[3], amp: H * 0.03, ph: k * 2.1, a: q[3]}; });
  var stars = []; for (i = 0; i < (ph ? 16 : 30); i++) { var sx = hash(i + 1) * W, sy = hash(i + 51) * A.sy * 0.85; if (sy < iceland_yAt(A.skyline, sx) - 10) stars.push([sx, sy, hash(i + 9) * 6.28]); }
  var CLD = iceland_sprite(240, 54, 1.5, function (o) { o.fillStyle = 'rgba(255,255,255,0.9)'; [[-70, 8, 46, 12], [-16, 0, 56, 18], [46, 6, 50, 13], [92, 11, 26, 8], [0, 12, 100, 9]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); }); o.fillStyle = 'rgba(214,228,236,0.7)'; o.beginPath(); o.ellipse(10, 17, 92, 4, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (k) { return {x: hash(k + 3) * W, y: H * (0.08 + k * 0.09), s: (ph ? 0.6 : 1) * (0.7 + hash(k + 7) * 0.5), v: 5 + hash(k + 5) * 5}; });
  // streaks sliding down each sheet, mist puffs, rings on the pools
  var streaks = []; tiers.forEach(function (t, n) { for (var q = 0; q < (ph ? 7 : 11); q++) streaks.push({n: n, u: -0.9 + 1.8 * hash(q * 3 + n * 17), v0: hash(q + n * 31), sp: 0.7 + hash(q * 7 + n) * 0.6}); });
  var mist = []; for (i = 0; i < (ph ? 12 : 20); i++) mist.push({k: i % 3, u: hash(i + 70), ph: hash(i + 71) * 6.28, life: 4 + hash(i + 72) * 3});
  var rings = [], nextRing = 0.5, steam = [], spray = [], flock = [], puffins = [];
  for (i = 0; i < (ph ? 2 : 4); i++) puffins.push({x: hash(i + 90) * W, y: H * (0.18 + hash(i + 91) * 0.24), v: (40 + hash(i + 92) * 30) * (ph ? 0.7 : 1), dir: hash(i + 93) < 0.6 ? 1 : -1, ph: hash(i + 94) * 6.28, s: (ph ? 0.75 : 1) * (0.8 + hash(i + 95) * 0.3), wait: hash(i + 96) * 8});
  var horses = A.horses.map(function (h, k) { return {h: h, ph: hash(k + 40) * 20, per: 11 + hash(k + 41) * 6, wph: hash(k + 42) * 6}; });
  var rb = {x: (tiers[1].cx + tiers[2].cx) / 2, y: tiers[2].base + H * 0.01, R: ph ? W * 0.36 : W * 0.14};
  return {
    step: function (dt, t, f) {
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 200) c.x = -200; });
      puffins.forEach(function (p) { if (p.wait > 0) { p.wait -= dt; return; } p.x += p.dir * p.v * dt * f.s; if (p.x > W + 60 || p.x < -60) { p.wait = 4 + Math.random() * 9; p.dir = Math.random() < 0.6 ? 1 : -1; p.x = p.dir > 0 ? -50 : W + 50; p.y = H * (0.14 + Math.random() * 0.28); } });
      nextRing -= dt * f.s; if (nextRing <= 0) { nextRing = 0.35 + Math.random() * 0.5; var pl = pools[Math.floor(Math.random() * pools.length)]; rings.push({x: pl.x + (Math.random() - 0.5) * pl.rx * 0.9, y: pl.y + (Math.random() - 0.3) * pl.ry * 0.5, r: pl.rx * 0.35, t0: t}); }
      rings = rings.filter(function (r) { return t - r.t0 < 1.8; });
      // geyser steam: a thin wisp always, a great billow after the eruption
      if (Math.random() < dt * 3 * f.s) steam.push({x: G.x + (Math.random() - 0.5) * G.r * 0.6, y: G.y - 2, r: G.r * 0.35, vx: 4 + Math.random() * 4, vy: -(10 + Math.random() * 8), g: 1.3, t0: t, life: 3 + Math.random() * 2, a: 0.45});
      steam.forEach(function (p) { p.x += p.vx * dt * f.s; p.y += p.vy * dt * f.s; p.r += p.g * dt * G.r * 0.25; });
      var Te = t - T0; if (Te > 1.4 && Te < 7.4 && Math.random() < dt * (ph ? 10 : 16)) { var hq = Math.min(1, (Te - 1.2) / 0.7), ytop = G.y - (G.y - H * (ph ? 0.2 : 0.1)) * hq, yq = Math.random(); steam.push({x: G.x + (Math.random() - 0.5) * G.r, y: ytop + (G.y - ytop) * yq * yq * 0.6, r: G.r * (0.8 + Math.random() * 0.8), vx: 10 + Math.random() * 12, vy: -(4 + Math.random() * 8), g: 3.2, t0: t, life: 5 + Math.random() * 3, a: 0.62}); }
      steam = steam.filter(function (p) { return t - p.t0 < p.life; });
      spray.forEach(function (p) { if (t < p.t0) return; p.vy += 260 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
      spray = spray.filter(function (p) { return t < p.t0 || p.y < G.y + 4; });
      flock = flock.filter(function (b) { return b.x < W + 80; }); flock.forEach(function (b) { if (t > b.t0) b.x += b.v * dt; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, k, j;
      // ---- the sky behind the land: aurora, stars or drifting clouds
      ca.save(); ca.clip(skyP);
      if (dk) {
        stars.forEach(function (s) { var a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(tt * 1.6 + s[2] * 3)); ca.fillStyle = 'rgba(235,245,255,' + a + ')'; ca.beginPath(); ca.arc(s[0], s[1], 1.1, 0, 7); ca.fill(); });
        ca.globalCompositeOperation = 'lighter'; ca.fillStyle = aur;
        curt.forEach(function (c) { var st = ph ? 4 : 5; for (var x = c.x0; x < c.x1; x += st) { var u = (x - c.x0) / (c.x1 - c.x0), edge = Math.sin(Math.PI * u), by = c.y + Math.sin(x * 0.006 + tt * 0.22 + c.ph) * c.amp + Math.sin(x * 0.019 - tt * 0.37 + c.ph) * c.amp * 0.35,
          h = c.h * (0.55 + 0.45 * Math.sin(x * 0.011 + tt * 0.27 + c.ph * 2)), a = edge * c.a * (0.55 + 0.45 * Math.sin(x * 0.045 - tt * 1.1 + c.ph)) * (0.8 + 0.2 * Math.sin(tt * 0.5 + c.ph));
          if (a < 0.02) continue; ca.save(); ca.globalAlpha = Math.min(1, a); ca.translate(x, by); ca.scale(1, h); ca.fillRect(-st * 0.6, -1, st * 1.2, 1); ca.restore(); } });
        ca.globalCompositeOperation = 'source-over';
      } else clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 120 * c.s, c.y - 27 * c.s, 240 * c.s, 54 * c.s); });
      ca.restore();
      // ---- glints on the bay: the moon's path at night, a sparkle by day
      ca.save(); if (dk) ca.globalCompositeOperation = 'lighter'; for (k = 0; k < (ph ? 7 : 10); k++) { var yy = A.sy + 5 + k * (A.nsy - A.sy - 10) / (ph ? 7 : 10), ww = M[2] * (0.8 + k * 0.12) * (0.6 + 0.4 * Math.sin(tt * 1.4 + k * 1.9)); ca.fillStyle = dk ? 'rgba(255,246,210,' + (0.32 - k * 0.022) + ')' : 'rgba(255,255,250,' + (0.5 - k * 0.035) + ')'; ca.fillRect(M[0] + Math.sin(tt * 0.7 + k) * 5 - ww / 2, yy, ww, 1.8); } ca.restore();
      // ---- waves rolling up the black sand, and surf at the feet of the sea stacks
      var wl = A.wl;
      for (k = 0; k < 2; k++) { var u = ((tt / 7) + k * 0.5) % 1, run = (ph ? 16 : 26) * S * (u < 0.42 ? iceland_ease(u / 0.42) : 1 - iceland_ease((u - 0.42) / 0.58)), al = u < 0.42 ? 1 : 1 - (u - 0.42) / 0.58;
        ca.beginPath(); wl.forEach(function (p, q) { if (q) ca.lineTo(p[0], p[1] - 2); else ca.moveTo(p[0], p[1] - 2); }); for (j = wl.length - 1; j >= 0; j--) ca.lineTo(wl[j][0], wl[j][1] + run * (0.75 + 0.25 * Math.sin(j * 0.9 + k * 2))); ca.closePath();
        ca.fillStyle = dk ? 'rgba(150,200,220,' + (0.16 * al) + ')' : 'rgba(225,244,250,' + (0.4 * al) + ')'; ca.fill();
        ca.strokeStyle = dk ? 'rgba(200,230,245,' + (0.55 * al) + ')' : 'rgba(255,255,255,' + (0.9 * al) + ')'; ca.lineWidth = 2.2 * S; ca.beginPath(); wl.forEach(function (p, q) { var y = p[1] + run * (0.75 + 0.25 * Math.sin(q * 0.9 + k * 2)); if (q) ca.lineTo(p[0], y); else ca.moveTo(p[0], y); }); ca.stroke();
        // the next swell, coming in across the water
        var o = (1 - ((tt / 7 + k * 0.5 + 0.55) % 1)) * 34 * S + 4; ca.strokeStyle = dk ? 'rgba(170,210,235,' + (0.14 * (o / (38 * S))) + ')' : 'rgba(255,255,255,' + (0.4 * (o / (38 * S))) + ')'; ca.lineWidth = 1.4; ca.beginPath(); wl.forEach(function (p, q) { if (q) ca.lineTo(p[0], p[1] - o + Math.sin(q * 1.3 + k) * 1.5); else ca.moveTo(p[0], p[1] - o); }); ca.stroke(); }
      A.stacks.forEach(function (s, q) { var b = 0.5 + 0.5 * Math.sin(tt * 1.1 + q * 2); ca.fillStyle = dk ? 'rgba(190,220,240,' + (0.25 + 0.2 * b) + ')' : 'rgba(255,255,255,' + (0.55 + 0.3 * b) + ')'; ca.beginPath(); ca.ellipse(s.x - s.w * 0.15, s.base, s.w * (0.7 + 0.3 * b), 2 + b * 2, 0, 0, 7); ca.fill(); });
      // ---- the horses: mostly grazing; now and then one lifts its head, looks round and tosses its mane
      horses.forEach(function (o, n) { var h = o.h, c = (tt + o.ph) % o.per, up = iceland_env(c, 0.4, 1.4, 4.2, 5.4), g = 1 - up * 0.9 + Math.sin(tt * 2.2 + n) * 0.03 * (1 - up), toss = up * Math.max(0, Math.sin((c - 1.6) * 7)) * 0.22 * f.a * (c > 1.6 && c < 2.5 ? 1 : 0), w = tt * 2.4 + o.wph;
        var p = iceland_horse(h.x, h.y, h.s, h.dir, g, -toss, w), col = C.horse[h.col];
        ca.fillStyle = dk ? 'rgba(0,0,10,0.3)' : 'rgba(40,70,30,0.22)'; ca.beginPath(); ca.ellipse(h.x, h.y, 18 * h.s, 2.6 * h.s, 0, 0, 7); ca.fill();
        ca.fillStyle = col[0]; ca.fill(new Path2D(p.body)); ca.fillStyle = col[1]; ca.fill(new Path2D(p.mane)); ca.fillStyle = dk ? '#0A0A0E' : '#2A2422'; ca.fill(new Path2D(p.dark)); });
      // ---- the geyser: a quiet wisp and a bubbling pool, then (moment) a dome, a tall column and a drifting billow
      var dome = iceland_env(T, 0.1, 0.9, 1.2, 1.5), erupt = iceland_env(T, 1.2, 1.9, 6.2, 8.4);
      for (k = 0; k < 3; k++) { var bu = ((tt * 0.9 + k / 3) % 1); ca.strokeStyle = dk ? 'rgba(170,230,240,' + (0.5 * (1 - bu)) + ')' : 'rgba(255,255,255,' + (0.8 * (1 - bu)) + ')'; ca.lineWidth = 1.2; ca.beginPath(); ca.ellipse(G.x + (k - 1) * G.r * 0.35, G.y, G.r * 0.12 + bu * G.r * 0.3, (G.r * 0.12 + bu * G.r * 0.3) * 0.28, 0, 0, 7); ca.stroke(); }
      if (dome > 0) { var dh = G.r * (0.25 + 0.45 * dome) * (1 + 0.12 * Math.sin(tt * 14)); var gd = ca.createRadialGradient(G.x - G.r * 0.2, G.y - dh * 0.6, 1, G.x, G.y, G.r); gd.addColorStop(0, 'rgba(240,252,255,' + 0.95 * dome + ')'); gd.addColorStop(1, dk ? 'rgba(90,170,190,' + 0.8 * dome + ')' : 'rgba(110,200,220,' + 0.9 * dome + ')'); ca.fillStyle = gd; ca.beginPath(); ca.ellipse(G.x, G.y, G.r * 0.75, dh, 0, Math.PI, 2 * Math.PI); ca.fill(); }
      steam.forEach(function (p) { var k2 = (t - p.t0) / p.life; iceland_dot(ca, steamG, p.x, p.y, p.r, p.a * Math.sin(Math.PI * Math.min(1, k2 * 1.4)) * (1 - k2)); });
      if (erupt > 0) { var top = G.y - (G.y - H * (ph ? 0.2 : 0.1)) * erupt * (0.96 + 0.04 * Math.sin(tt * 9)), N = 22;
        for (k = N; k >= 0; k--) { var q = k / N, yy2 = G.y - (G.y - top) * q, rr = G.r * (0.32 + 0.75 * q * q + 0.25 * q) * (1 + 0.12 * Math.sin(tt * 11 + k * 1.7)), xx = G.x + Math.sin(tt * 3 + k * 0.6) * G.r * 0.12 * q + q * q * G.r * 0.6;
          iceland_dot(ca, steamG, xx, yy2, rr * 2, (0.6 + 0.3 * (1 - q)) * erupt); }
        // the solid jet of water at the heart of the column
        ca.fillStyle = dk ? 'rgba(225,240,250,' + 0.92 * erupt + ')' : 'rgba(255,255,255,' + 0.97 * erupt + ')'; ca.beginPath(); ca.moveTo(G.x - G.r * 0.4, G.y); ca.quadraticCurveTo(G.x - G.r * 0.45, G.y - (G.y - top) * 0.55, G.x - G.r * 0.8 + Math.sin(tt * 7) * 2, G.y - (G.y - top) * 0.9); ca.quadraticCurveTo(G.x + Math.sin(tt * 5) * 3, G.y - (G.y - top) * 1.02, G.x + G.r * 0.9 + Math.sin(tt * 7) * 2, G.y - (G.y - top) * 0.88); ca.quadraticCurveTo(G.x + G.r * 0.45, G.y - (G.y - top) * 0.55, G.x + G.r * 0.4, G.y); ca.closePath(); ca.fill(); }
      spray.forEach(function (p) { if (t < p.t0) return; ca.fillStyle = dk ? 'rgba(220,240,255,0.8)' : 'rgba(255,255,255,0.95)'; ca.beginPath(); ca.arc(p.x, p.y, p.r, 0, 7); ca.fill(); });
      // ---- the falls: streaks sliding down each sheet, rings on the pools (inside the water only)
      cb.save(); cb.clip(fallP); cb.lineCap = 'round';
      streaks.forEach(function (q) { var tr = tiers[q.n], vv = (q.v0 + tt * q.sp * 0.55) % 1, hw = tr.hwT + (tr.hwB - tr.hwT) * Math.sqrt(vv), x = tr.cx + q.u * hw, y = tr.lip + (tr.base - tr.lip) * vv, L = (tr.base - tr.lip) * 0.28;
        cb.strokeStyle = dk ? 'rgba(220,240,255,' + (0.55 * Math.sin(Math.PI * vv)) + ')' : 'rgba(255,255,255,' + (0.9 * Math.sin(Math.PI * vv)) + ')'; cb.lineWidth = (ph ? 1.4 : 2) * S; cb.beginPath(); cb.moveTo(x, y); cb.lineTo(tr.cx + q.u * (tr.hwT + (tr.hwB - tr.hwT) * Math.sqrt(Math.min(1, vv + 0.25))), y + L); cb.stroke(); });
      rings.forEach(function (r) { var k2 = (t - r.t0) / 1.8; cb.strokeStyle = dk ? 'rgba(220,240,255,' + 0.5 * (1 - k2) + ')' : 'rgba(255,255,255,' + 0.85 * (1 - k2) + ')'; cb.lineWidth = 1.2; cb.beginPath(); cb.ellipse(r.x, r.y, r.r * (0.3 + k2), r.r * (0.3 + k2) * 0.28, 0, 0, 7); cb.stroke(); });
      cb.restore();
      // white water churning where each sheet lands, and mist rising off it
      tiers.forEach(function (tr, n) { for (var q = 0; q < 6; q++) { var x = tr.cx - tr.hwB * 0.85 + q / 5 * tr.hwB * 1.7, r = tr.hwB * 0.17 * (1 + 0.3 * Math.sin(tt * 5 + q * 2.3 + n)); cb.fillStyle = dk ? 'rgba(215,235,248,0.8)' : 'rgba(255,255,255,0.95)'; cb.beginPath(); cb.ellipse(x, tr.base - r * 0.3 - Math.abs(Math.sin(tt * 4 + q * 1.7)) * r * 0.5, r, r * 0.62, 0, 0, 7); cb.fill(); } });
      mist.forEach(function (m) { var tr = tiers[m.k], age = ((tt + m.ph * 2) % m.life) / m.life, x = tr.cx + (m.u - 0.5) * tr.hwB * 2.4 + Math.sin(tt * 0.6 + m.ph) * 8 + age * 14, y = tr.base - age * H * 0.07; iceland_dot(cb, mistG, x, y, tr.hwB * (0.5 + age * 0.9), Math.sin(Math.PI * age) * (dk ? 0.5 : 0.65), 0.6); });
      // ---- the rainbow in the spray (moment)
      var rbk = iceland_env(T, 2.2, 3.8, 10, 12.5); if (rbk > 0) { var bw = (ph ? 5 : 8) * S + 1, cols = ['#FF6A6A', '#FFA94A', '#FFE05A', '#7EDB6A', '#5AB8F2', '#9A7BF0'];
        cb.save(); cb.globalAlpha = rbk * (dk ? 0.26 : 0.38); cb.lineWidth = bw; cols.forEach(function (col, q) { cb.strokeStyle = col; cb.beginPath(); cb.arc(rb.x, rb.y, rb.R - q * bw, Math.PI * 1.04, Math.PI * 1.96); cb.stroke(); }); cb.restore(); }
      // ---- grass rippling in the wind (a gust rolls across from the left)
      cb.fillStyle = C.grass; A.blades.forEach(function (b) { var gust = 0.5 + 0.5 * Math.sin(tt * 0.7 - b[0] * 0.006), sw = (Math.sin(tt * 2.1 - b[0] * 0.03) * 0.5 + gust * 0.7) * b[2] * 0.22 * f.a, tx = b[0] + b[3] + sw, ty = b[1] - b[2] + Math.abs(sw) * 0.25, w = b[4] * 0.5;
        cb.beginPath(); cb.moveTo(b[0] - w, b[1]); cb.quadraticCurveTo(b[0] - w * 0.5 + (tx - b[0]) * 0.2, (b[1] + ty) / 2, tx, ty); cb.quadraticCurveTo(b[0] + w * 0.5 + (tx - b[0]) * 0.25, (b[1] + ty) / 2, b[0] + w, b[1]); cb.closePath(); cb.fill(); });
      // ---- puffins flapping past, and the moment's flock flying through the rainbow
      puffins.forEach(function (p) { if (p.wait > 0) return; iceland_puffin(cb, p.x, p.y + Math.sin(tt * 2 + p.ph) * 4, p.s, tt * 16 + p.ph, p.dir, dk); });
      flock.forEach(function (b) { if (t < b.t0) return; var x = b.x, y = b.y + Math.sin((x / W) * 5 + b.ph) * H * 0.02; iceland_puffin(cb, x, y, b.s, tt * 17 + b.ph, 1, dk); });
      // ---- warm windows at night
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.lights.forEach(function (l, q) { iceland_dot(cb, litG, l[0], l[1], l[2] * 3.4, 0.5 + 0.2 * flick(tt * 0.6, q * 1.3)); }); cb.restore(); }
    },
    finish: function (t) { T0 = t; spray = []; flock = [];
      for (var q = 0; q < (ph ? 30 : 50); q++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 0.9, sp = (ph ? 140 : 230) * S * (0.6 + Math.random() * 0.5); spray.push({x: G.x, y: G.y - (G.y - H * (ph ? 0.2 : 0.1)) * (0.5 + Math.random() * 0.5), vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp * 0.3, r: 1 + Math.random() * 1.6, t0: t + 1.8 + Math.random() * 3}); }
      for (q = 0; q < (ph ? 6 : 9); q++) flock.push({x: -40 - Math.random() * 120 - q * 22, y: rb.y - rb.R * (0.75 + Math.random() * 0.35), v: (ph ? 110 : 190) * (0.9 + Math.random() * 0.25), t0: t + 2.4 + q * 0.12, ph: Math.random() * 6.28, s: (ph ? 0.75 : 1.05) * (0.85 + Math.random() * 0.3)}); }
  };
};
UIC.iceland = {L: ['#3E7A6A', '#245448', 'rgba(255,255,255,0.86)', '#18302C', '#56706A', '#2E7A66', '#2E7A66', '#3E86A8', '#FFFFFF'], D: ['#14304A', '#0A1A2E', 'rgba(12,26,46,0.8)', '#E8F4F2', '#A2BCC0', '#7CE0B0', '#7CE0B0', '#9FD8F0', '#0A1A2E']};
