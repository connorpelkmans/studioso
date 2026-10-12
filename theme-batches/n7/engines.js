// ---- batch n7 engines: saltflats
function n7_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n7_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n7_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n7_ease((T - c) / (d - c)); }
var n7_gc = null;
function n7_ctx() { return n7_gc || (n7_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n7_dot
function n7_rg(col, mid) { var g = n7_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n7_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n7_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
// an offscreen canvas at 2x the scene size, drawn once in scene units
function n7_off(W, H, fn) { var q = 2, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(W * q)); cv.height = Math.max(1, Math.ceil(H * q)); var g = cv.getContext('2d'); g.scale(q, q); fn(g); return cv; }
// draw fn(ctx) on a scratch canvas, erase what the mask (Path2D of art nearer than the drawing) covers, then lay it on c
var n7_scr = null;
function n7_occl(c, mask, fn) { var cv = c.canvas, W = cv.width, H = cv.height; if (!n7_scr) n7_scr = document.createElement('canvas'); if (n7_scr.width !== W || n7_scr.height !== H) { n7_scr.width = W; n7_scr.height = H; }
  var g = n7_scr.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(c.getTransform()); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  fn(g); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(mask); g.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(n7_scr, 0, 0); c.restore(); }
// a four-point twinkle
function n7_twinkle(c, x, y, r, col, a) { if (a <= 0.01) return; c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }

// ---------- Mirror Flats: small clouds drift across the sky and across their twins in the water, breeze ripples slide over the mirror and
// little rings spread on it, and the low sun glitters on the water. Night: stars twinkle together with their reflections, the Milky Way
// lies in the water too, and shooting stars streak across both skies.
// Moment: a ring of ripples runs out over the flat, the sun throws a pillar of light through itself and its twin, and every cloud
// above and below blushes gold. Night: a meteor shower falls through the sky while its mirror image falls up through the water.
ENGINES.saltflats = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, hy = A.hy, c = A.c, i, sun = A.sun;
  var coneP = new Path2D(A.coneD), cloudP = new Path2D(A.cloudD + A.cloudRD), behind = new Path2D(A.coneD + A.cloudD + A.cloudRD);
  var depth = function (y) { return Math.max(0.02, (y - hy) / c); };
  // the night sky's Milky Way and its reflection, drawn once
  var skyCv = dk ? n7_off(W, H, function (g) { var mwG = n7_rg('rgba(170,160,255,0.22)', [0.5, 0.4]), mwC = n7_rg('rgba(255,236,226,0.22)', [0.4, 0.3]);
    for (i = 0; i < 140; i++) { var u = i / 139, x = W * (-0.05 + u * 0.75) + (Math.random() - 0.5) * 30, y = H * 0.02 + u * (hy - H * 0.1) + Math.sin(u * 5) * H * 0.03 + (Math.random() - 0.5) * 20, r = (ph ? 34 : 56) * (0.5 + Math.random() * 0.7);
      n7_dot(g, mwG, x, y, r, 0.22, 0.6); n7_dot(g, mwG, x, 2 * hy - y, r, 0.13, 0.6); if (i % 4 === 0) { n7_dot(g, mwC, x, y, r * 0.35, 0.35, 0.7); n7_dot(g, mwC, x, 2 * hy - y, r * 0.35, 0.2, 0.7); } }
    for (i = 0; i < 260; i++) { var u3 = Math.random(), x3 = W * (-0.05 + u3 * 0.75) + (Math.random() - 0.5) * 70, y3 = H * 0.02 + u3 * (hy - H * 0.1) + Math.sin(u3 * 5) * H * 0.03 + (Math.random() - 0.5) * 50, r3 = 0.3 + Math.random() * 0.8;
      g.fillStyle = 'rgba(255,250,255,' + (0.3 + Math.random() * 0.5) + ')'; g.beginPath(); g.arc(x3, y3, r3, 0, 7); g.fill(); g.globalAlpha = 0.5; g.beginPath(); g.arc(x3, 2 * hy - y3, r3 * 0.9, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(coneP); }) : null;
  var stars = []; if (dk) for (i = 0; i < (ph ? 26 : 50); i++) { var sx = Math.random() * W, sy = Math.random() * (hy - H * 0.06); if (A.moon && Math.hypot(sx - A.moon[0], sy - A.moon[1]) < A.moon[2] * 3) continue; stars.push({x: sx, y: sy, r: 1 + Math.random() * 1.6, ph: Math.random() * 6.28, sp: 1.4 + Math.random() * 2}); }
  // little drifting clouds (day)
  var puffG = n7_rg('rgba(255,244,240,0.85)', [0.55, 0.6]), puffS = n7_rg('rgba(236,196,214,0.7)', [0.55, 0.5]), lets = [];
  if (!dk) for (i = 0; i < (ph ? 2 : 4); i++) lets.push({x: Math.random() * W, y: H * (0.08 + Math.random() * 0.3), w: (ph ? 40 : 60) * (0.7 + Math.random() * 0.6), v: 3 + Math.random() * 4});
  var drawLet = function (g, L, y, a) { for (var k = 0; k < 5; k++) { var dx = (k - 2) * L.w * 0.22, r = L.w * (0.22 + 0.12 * Math.sin(Math.PI * k / 4)); n7_dot(g, puffS, L.x + dx, y + r * 0.25, r, a * 0.8, 0.7); n7_dot(g, puffG, L.x + dx + 3, y - r * 0.1, r * 0.85, a, 0.7); } };
  // breeze streaks and little ripple rings on the water
  var streaks = [], rings = [], nextRing = 1, shoot = null, nextShoot = 5, fin = null, meteors = [];
  var newStreak = function (t) { var q = Math.pow(Math.random(), 1.4) * 0.95 + 0.04, y = hy + q * c; return {x: Math.random() * W, y: y, L: (20 + Math.random() * 60) * S * (0.3 + q * 1.4), t0: t, life: 3 + Math.random() * 3, v: (4 + Math.random() * 6) * (0.3 + q)}; };
  for (i = 0; i < (ph ? 10 : 18); i++) streaks.push(newStreak(-Math.random() * 5));
  var lineC = dk ? 'rgba(200,196,255,' : 'rgba(255,255,255,', glitter = [];
  if (!dk) for (i = 0; i < (ph ? 14 : 24); i++) { var gy = hy + 3 + Math.pow(Math.random(), 1.6) * (2 * (hy - sun[1]) + 70 * S), q2 = depth(gy); glitter.push({x: sun[0] + (Math.random() - 0.5) * (12 + 70 * q2) * S, y: gy, ph: Math.random() * 6.28, sp: 2 + Math.random() * 3, r: (1.5 + 3 * q2) * S}); }
  var glowW = n7_rg('rgba(255,236,206,0.9)', [0.35, 0.4]), moonG = n7_rg('rgba(220,220,255,0.5)', [0.3, 0.3]), blush = dk ? 'rgba(170,160,255,' : 'rgba(255,170,130,';
  var streak = function (g, x, y, dx, dy, a, w) { var gr = g.createLinearGradient(x, y, x - dx, y - dy); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = gr; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - dx, y - dy); g.stroke(); };
  return {
    maxDpr: 2,
    step: function (dt, t, f) {
      lets.forEach(function (L) { L.x += L.v * dt * f.s; if (L.x - L.w * 1.5 > W) L.x = -L.w * 1.5; });
      streaks.forEach(function (q, j) { q.x += q.v * dt * f.s; if (t - q.t0 > q.life) streaks[j] = newStreak(t); });
      if (t > nextRing) { var y = hy + (0.12 + Math.random() * 0.8) * c; rings.push({x: W * (0.1 + Math.random() * 0.8), y: y, t0: t, q: depth(y)}); nextRing = t + 1.6 + Math.random() * 2.4; } rings = rings.filter(function (r) { return t - r.t0 < 3; });
      if (dk && !shoot && t > nextShoot) { shoot = {t0: t, x: W * (0.2 + Math.random() * 0.7), y: H * (0.04 + Math.random() * 0.15), dx: -W * 0.16, dy: H * 0.1}; nextShoot = t + 6 + Math.random() * 7; }
      if (shoot && t - shoot.t0 > 1) shoot = null;
      if (fin && t - fin.t0 > 16) fin = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = fin ? t - fin.t0 : -1, k;
      if (skyCv) { ca.drawImage(skyCv, 0, 0, W, H); if (T >= 0) { ca.save(); ca.globalAlpha = 0.8 * n7_env(T, 0.5, 2.5, 9, 13); ca.drawImage(skyCv, 0, 0, W, H); ca.restore(); } }
      // drifting cloudlets and their twins
      if (lets.length) n7_occl(ca, behind, function (g) { lets.forEach(function (L) { drawLet(g, L, L.y, 0.6); drawLet(g, L, 2 * hy - L.y, 0.38); }); });
      // stars twinkling with their reflections
      stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * s.sp + s.ph); n7_twinkle(ca, s.x, s.y, s.r * (1.4 + a * 1.6), '#FFFFFF', 0.25 + a * 0.65); n7_twinkle(ca, s.x, 2 * hy - s.y, s.r * (1.2 + a * 1.2), '#E8E4FF', 0.15 + a * 0.4); });
      if (shoot) { var ks = t - shoot.t0, x = shoot.x + shoot.dx * ks, y = shoot.y + shoot.dy * ks, a = Math.sin(Math.PI * Math.min(1, ks)); streak(ca, x, y, shoot.dx * 0.3, shoot.dy * 0.3, 0.9 * a, 1.6); streak(ca, x, 2 * hy - y, shoot.dx * 0.3, -shoot.dy * 0.3, 0.5 * a, 1.3); }
      // the sun's glitter path
      glitter.forEach(function (g) { var a = Math.max(0, Math.sin(tt * g.sp + g.ph)); n7_twinkle(ca, g.x, g.y, g.r * (0.6 + a), '#FFF8E8', a * 0.9); });
      // breeze streaks and rings
      ca.lineCap = 'round';
      streaks.forEach(function (q) { var k2 = (t - q.t0) / q.life; if (k2 < 0) return; var a = Math.sin(Math.PI * k2) * (dk ? 0.28 : 0.45); ca.strokeStyle = lineC + a + ')'; ca.lineWidth = Math.max(0.6, 1.4 * depth(q.y) * S + 0.4); ca.beginPath(); ca.moveTo(q.x - q.L, q.y); ca.quadraticCurveTo(q.x, q.y - 1, q.x + q.L, q.y); ca.stroke(); });
      rings.forEach(function (r) { var k2 = (t - r.t0) / 3, R = (6 + k2 * 60) * S * (0.2 + r.q * 1.4); ca.strokeStyle = lineC + (0.5 * (1 - k2)) + ')'; ca.lineWidth = Math.max(0.6, 1.2 * r.q + 0.3); n7_ell(ca, r.x, r.y, R, R * (0.08 + 0.16 * r.q)); ca.stroke(); if (k2 > 0.25) { ca.strokeStyle = lineC + (0.3 * (1 - k2)) + ')'; n7_ell(ca, r.x, r.y, R * 0.6, R * 0.6 * (0.08 + 0.16 * r.q)); ca.stroke(); } });
      if (T < 0) return;
      // ---- the moment: rings of ripples running out over the flat
      var wy = hy + c * 0.42, wq = depth(wy);
      for (k = 0; k < 4; k++) { var kr = (T - k * 0.45) / 4.5; if (kr <= 0 || kr >= 1) continue; var R = kr * W * 0.7; ca.strokeStyle = lineC + (0.75 * (1 - kr)) + ')'; ca.lineWidth = 2.2 - k * 0.3; n7_ell(ca, W * 0.5, wy, R, R * (0.06 + 0.14 * wq)); ca.stroke(); }
      if (!dk) {
        // the sun pillar, the clouds blushing above and below, and a sparkle where the sun meets its twin
        var pa = n7_env(T, 0.4, 2, 7, 11); ca.save(); ca.globalCompositeOperation = 'lighter';
        n7_dot(ca, glowW, sun[0], sun[1], sun[2] * 1.6, pa * 0.9, 9); n7_dot(ca, glowW, sun[0], 2 * hy - sun[1], sun[2] * 1.6, pa * 0.7, 9); n7_dot(ca, glowW, sun[0], hy, sun[2] * 9, pa * 0.6, 0.12);
        ca.restore();
        var ba = n7_env(T, 0.8, 3, 7.5, 12); if (ba > 0) { ca.save(); ca.clip(cloudP); ca.globalCompositeOperation = 'lighter'; var gr = ca.createRadialGradient(sun[0], hy, 10, sun[0], hy, W * 0.9); gr.addColorStop(0, blush + (0.55 * ba) + ')'); gr.addColorStop(1, blush + (0.18 * ba) + ')'); ca.fillStyle = gr; ca.fillRect(-40, -40, W + 80, H + 80); ca.restore(); }
        for (k = 0; k < 18; k++) { var kk = (T - 1 - k * 0.06) / 3; if (kk <= 0 || kk >= 1) continue; var an = k / 18 * 6.283, rr = kk * (60 + (k % 3) * 30) * S; n7_twinkle(cb, sun[0] + Math.cos(an) * rr, hy + Math.sin(an) * rr * 0.5, (3 + (k % 3)) * S, '#FFF6E0', Math.sin(Math.PI * kk)); }
      } else {
        // a meteor shower with its mirror image, and the moon glowing brighter
        for (k = 0; k < (ph ? 9 : 14); k++) { var m = meteors[k] || (meteors[k] = {x: W * (0.15 + Math.random() * 0.85), y: H * (0.02 + Math.random() * 0.2), l: 0.4 + Math.random() * 0.4}), km = (T - 0.4 - k * 0.42) / 0.9; if (km <= 0 || km >= 1) continue;
          var dx = -W * 0.2 * m.l, dy = H * 0.16 * m.l, xm = m.x + dx * km, ym = m.y + dy * km, am = Math.sin(Math.PI * km); streak(ca, xm, ym, dx * 0.4, dy * 0.4, am, 1.8); streak(ca, xm, 2 * hy - ym, dx * 0.4, -dy * 0.4, am * 0.55, 1.5); n7_twinkle(ca, xm, ym, 3 * S, '#FFFFFF', am); }
        if (A.moon) { var mg = n7_env(T, 0.3, 2, 8, 12); ca.save(); ca.globalCompositeOperation = 'lighter'; n7_dot(ca, moonG, A.moon[0], A.moon[1], A.moon[2] * 5, mg * 0.7); n7_dot(ca, moonG, A.moon[0], 2 * hy - A.moon[1], A.moon[2] * 5, mg * 0.45); ca.restore(); }
      }
    },
    finish: function (t) { fin = {t0: t}; meteors = []; }
  };
};
UIC.saltflats = {L: ['#6A5A9E', '#4A3E7A', 'rgba(255,255,255,0.86)', '#2A2440', '#6A6284', '#7650B0', '#7650B0', '#C0628E', '#FFFFFF'], D: ['#1E2050', '#0E1030', 'rgba(16,18,46,0.8)', '#EEEAFB', '#ACA6CC', '#B8A6FF', '#B8A6FF', '#F2B8D8', '#14102E']};
