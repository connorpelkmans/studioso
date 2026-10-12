// ---- batch n16 engines: saguaro, baobab
function n16_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n16_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n16_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n16_ease((T - c) / (d - c)); }
var n16_gc = null;
function n16_ctx() { return n16_gc || (n16_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n16_glow
function n16_rg(col, mid) { var g = n16_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n16_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n16_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
function n16_spark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.25, y - r * 0.25); c.lineTo(x + r, y); c.lineTo(x + r * 0.25, y + r * 0.25); c.lineTo(x, y + r); c.lineTo(x - r * 0.25, y + r * 0.25); c.lineTo(x - r, y); c.lineTo(x - r * 0.25, y - r * 0.25); c.closePath(); c.fill(); }
// draw fn(ctx) on a scratch canvas, erase what the mask (a Path2D of shapes nearer than the drawing) covers, then lay it on c
var n16_scr = null;
function n16_occl(c, mask, fn) { var cv = c.canvas, W = cv.width, H = cv.height; if (!n16_scr) n16_scr = document.createElement('canvas'); if (n16_scr.width !== W || n16_scr.height !== H) { n16_scr.width = W; n16_scr.height = H; }
  var g = n16_scr.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(c.getTransform()); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  fn(g); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(mask); g.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(n16_scr, 0, 0); c.restore(); }
function n16_shoot(c, s, t, dur, dx, dy, col) { var k = (t - s.t0) / dur; if (k < 0 || k > 1) return; var x = s.x + k * dx, y = s.y + k * dy, g = c.createLinearGradient(x, y, x - dx * 0.28, y - dy * 0.28); g.addColorStop(0, col.replace('A', Math.sin(Math.PI * k) * 0.95)); g.addColorStop(1, col.replace('A', 0));
  c.strokeStyle = g; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - dx * 0.28, y - dy * 0.28); c.stroke(); }

// ---------- Saguaro Sunset: the low sun glows and breathes, ocotillo canes and brittlebush daisies sway in the evening breeze,
// dry grass ripples along the bottom and golden dust motes drift through the last light. Night: the moon rises from behind the
// ranges, stars twinkle and shooting stars cross the desert sky.
// Moment: the sky blushes and the sun fans out its rays while every saguaro bursts into bloom, crown after crown across the
// desert, each puff of white blossoms sending up gold pollen. At night the blossoms open glowing under the moon (saguaros
// really do bloom at night) during a meteor shower.
// one saguaro blossom: a cup of creamy petals around a golden heart; s 0..1 opens it
function n16_sagBloom(c, x, y, r, s, dk) { if (s <= 0.01) return; c.save(); c.translate(x, y); c.scale(s, s); var i;
  c.fillStyle = dk ? '#C8C4E4' : '#F2E2CC'; for (i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + 0.2; n16_ell(c, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.42, r * 0.52, r * 0.3, a); c.fill(); }
  c.fillStyle = dk ? '#F2F0FF' : '#FFFBF2'; for (i = 0; i < 8; i++) { var a2 = i / 8 * Math.PI * 2; n16_ell(c, Math.cos(a2) * r * 0.5, Math.sin(a2) * r * 0.34 - r * 0.06, r * 0.46, r * 0.26, a2); c.fill(); }
  c.fillStyle = dk ? '#C8B866' : '#F6C83A'; n16_ell(c, 0, -r * 0.05, r * 0.3, r * 0.22); c.fill(); c.fillStyle = dk ? '#A89848' : '#E2A420'; n16_ell(c, 0, -r * 0.02, r * 0.14, r * 0.1); c.fill(); c.restore(); }
ENGINES.saguaro = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Sn = A.sun, Mo = A.moon, i, mask = new Path2D(A.mask);
  var sunG = n16_rg('rgba(255,220,160,0.5)', [0.35, 0.3]), blushG = n16_rg('rgba(255,150,140,0.45)', [0.5, 0.35]), moonG = n16_rg('rgba(255,230,200,0.35)', [0.3, 0.3]), twG = n16_rg('rgba(255,250,240,0.95)', [0.25, 0.3]), polG = n16_rg('rgba(255,214,120,0.9)', [0.3, 0.35]), wG = n16_rg('rgba(240,236,255,0.7)', [0.3, 0.35]);
  var tips = A.tips.map(function (t) { return {x: t[0], y: t[1], r: Math.max(1.4, t[2] * (t[3] === 0 ? 0.9 : 0.75)), L: t[3], d: 0}; });
  var motes = []; for (i = 0; i < (ph ? 18 : 34); i++) motes.push({x: Math.random() * W, y: A.hz + Math.random() * (H - A.hz) * 0.8 - H * 0.08, ph: Math.random() * 6.28, sp: 4 + Math.random() * 8, r: (0.8 + Math.random() * 1.4) * S + 0.5});
  var pollen = [], stars = [], nextStar = 5, fin = null, tnow = 0;
  function gust(x, t) { var g = 0.5 + 0.5 * Math.sin(x * 0.004 - t * 0.9); return g * g + (fin ? n16_env(t - fin.t0, 0.2, 1, 3, 5) * 0.6 : 0); }
  function drawOco(c, t) { A.ocos.forEach(function (oc) { var w = Math.max(1.2, oc.h * 0.012);
    oc.st.forEach(function (s) { var sw = Math.sin(t * 0.9 + s.ph) * 0.03 + gust(oc.x, t) * 0.05, a = s.a + sw, ex = oc.x + Math.cos(a) * s.L, ey = oc.y + Math.sin(a) * s.L, mx = oc.x + Math.cos(a - s.b) * s.L * 0.55, my = oc.y + Math.sin(a - s.b) * s.L * 0.55, k;
      c.strokeStyle = dk ? '#2A2A3A' : '#5E5040'; c.lineWidth = 1.7 * S + 0.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(oc.x, oc.y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      c.fillStyle = dk ? '#1E2A36' : '#6E7A46'; for (k = 1; k < 7; k++) { var u = k / 7.2, px = (1 - u) * (1 - u) * oc.x + 2 * u * (1 - u) * mx + u * u * ex, py = (1 - u) * (1 - u) * oc.y + 2 * u * (1 - u) * my + u * u * ey; n16_ell(c, px + Math.cos(a + (k % 2 ? 0.9 : -0.9)) * w * 1.6, py + Math.sin(a + (k % 2 ? 0.9 : -0.9)) * w * 1.6, w * 1.6, w * 0.6, a + (k % 2 ? 0.9 : -0.9)); c.fill(); }
      c.fillStyle = dk ? '#7A2E48' : '#C8304E'; [[0, 1, 3.5], [-0.25, 0.75, 2.6], [0.25, 0.75, 2.6]].forEach(function (q) { var aa = a + q[0]; n16_ell(c, ex + Math.cos(aa) * w * q[2] * 0.9, ey + Math.sin(aa) * w * q[2] * 0.9 + w, w * q[2], w * 0.8 * q[1] + 0.4, aa); c.fill(); }); }); }); }
  return {
    step: function (dt, t, f) { tnow = t;
      motes.forEach(function (m) { m.x += (m.sp + gust(m.x, t) * 14) * S * dt; m.y += Math.sin(t * 0.7 + m.ph) * 4 * S * dt - 2 * S * dt; if (m.x > W + 10) { m.x = -10; m.y = A.hz + Math.random() * (H - A.hz) * 0.8 - H * 0.08; } });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 8 + Math.random() * 9; stars.push({t0: t, x: W * (0.2 + Math.random() * 0.7), y: A.peak * (0.1 + Math.random() * 0.4), d: 1.1}); } }
      pollen.forEach(function (p) { p.vy -= 6 * S * dt; p.x += (p.vx + Math.sin((t - p.t0) * 3 + p.ph) * 10 * S) * dt; p.y += p.vy * dt; });
      pollen = pollen.filter(function (p) { return t - p.t0 < 3.5; }); stars = stars.filter(function (s) { return t - s.t0 < s.d + 0.1; });
      if (fin) { var T = t - fin.t0;
        tips.forEach(function (tp) { if (!tp.popped && T > tp.d) { tp.popped = 1; var n = tp.L === 0 ? 1 : tp.L === 1 ? 3 : 6; for (var k = 0; k < n; k++) pollen.push({x: tp.x + (Math.random() - 0.5) * tp.r, y: tp.y, vx: (Math.random() - 0.5) * 30 * S, vy: -(14 + Math.random() * 30) * S * (tp.L ? 1 : 0.5), t0: t, ph: Math.random() * 6.28, r: (tp.L === 2 ? 1.6 : 1) * S + 0.6, front: tp.L === 2}); } });
        if (T > 16) { fin = null; tips.forEach(function (tp) { tp.popped = 0; }); } }
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, bk = fin ? n16_env(T, 0, 1.2, 7, 11) : 0;
      // the sun's glow (day) or the rising moon behind the ranges (night), and the sky's blush in the moment
      ca.save(); ca.globalCompositeOperation = 'lighter';
      if (!dk) n16_occl(ca, mask, function (ca) { ca.globalCompositeOperation = 'lighter'; n16_glow(ca, sunG, Sn[0], Sn[1], Sn[2] * (3.4 + 0.15 * Math.sin(tt * 0.6)) * (1 + bk * 0.5), 0.8 + bk * 0.2);
        if (bk > 0) { n16_glow(ca, blushG, Sn[0], Sn[1] - H * 0.1, W * 0.75, bk * 0.6, 0.6);
          for (i = 0; i < 11; i++) { var a = -Math.PI + 0.12 + i * (Math.PI - 0.24) / 10 + Math.sin(tt * 0.4 + i) * 0.02, Lr = W * 1.1, wr = 0.022 + (i % 3) * 0.01; ca.fillStyle = 'rgba(255,236,200,' + (0.1 * bk * (0.6 + 0.4 * Math.sin(tt * 1.3 + i * 2))) + ')'; ca.beginPath(); ca.moveTo(Sn[0], Sn[1]); ca.lineTo(Sn[0] + Math.cos(a - wr) * Lr, Sn[1] + Math.sin(a - wr) * Lr); ca.lineTo(Sn[0] + Math.cos(a + wr) * Lr, Sn[1] + Math.sin(a + wr) * Lr); ca.closePath(); ca.fill(); } } });
      else { A.tw.forEach(function (s, j) { var a2 = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] * 6.28 + j)), 4); n16_glow(ca, twG, s[0], s[1], 3 + a2 * 3.5, a2 * 0.9); }); }
      ca.restore();
      if (dk) { var rise = n16_ease(tt / 30), my = Mo[1] + Mo[2] * 0.95 * (1 - rise), mr = Mo[2];
        n16_occl(ca, mask, function (c) { c.save(); c.globalCompositeOperation = 'lighter'; n16_glow(c, moonG, Mo[0], my, mr * 3.2 * (1 + bk * 0.3), 0.7 + bk * 0.3); c.restore();
          c.fillStyle = '#FFE6C0'; c.beginPath(); c.arc(Mo[0], my, mr, 0, 7); c.fill();
          c.fillStyle = 'rgba(214,180,150,0.35)'; [[-0.3, -0.2, 0.28], [0.25, 0.1, 0.22], [-0.05, 0.35, 0.18], [0.35, -0.35, 0.12]].forEach(function (q) { c.beginPath(); c.arc(Mo[0] + q[0] * mr, my + q[1] * mr, q[2] * mr, 0, 7); c.fill(); }); });
        stars.forEach(function (s) { n16_shoot(ca, s, t, s.d, -W * 0.16, H * 0.07, 'rgba(255,246,230,A)'); }); }
      // ocotillo canes swaying (they sit in the middle distance, behind the foreground)
      drawOco(ca, tt);
      // the moment's blossoms: far and middle saguaros on the canvas under the foreground, the big ones on top
      var blooms = function (c, L) { tips.forEach(function (tp) { if (tp.L !== L || !fin) return; var age = T - tp.d; if (age < 0) return; var sc = (age < 0.45 ? n16_ease(age / 0.45) * (1 + 0.25 * Math.sin(Math.PI * age / 0.45)) : 1) * (1 - n16_ease((T - 12) / 2.5)); if (sc <= 0.01) return;
          if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; n16_glow(c, wG, tp.x, tp.y, tp.r * 3, 0.45 * sc); c.restore(); }
          if (L === 0) { c.fillStyle = dk ? '#F2F0FF' : '#FFFBF2'; c.beginPath(); c.arc(tp.x, tp.y, tp.r * sc, 0, 7); c.fill(); return; }
          if (L === 2) { n16_sagBloom(c, tp.x - tp.r * 0.75, tp.y + tp.r * 0.35, tp.r * 0.6, sc * Math.min(1, age * 2), dk); n16_sagBloom(c, tp.x + tp.r * 0.75, tp.y + tp.r * 0.4, tp.r * 0.55, sc * Math.min(1, Math.max(0, age - 0.2) * 2), dk); }
          n16_sagBloom(c, tp.x, tp.y, tp.r * (L === 2 ? 0.8 : 1), sc, dk); }); };
      blooms(ca, 0); blooms(ca, 1);
      ca.save(); ca.globalCompositeOperation = 'lighter'; pollen.forEach(function (p) { if (p.front) return; var al = Math.min(1, (t - p.t0) * 3) * Math.min(1, (3.5 - (t - p.t0)) / 1.2); n16_glow(ca, dk ? wG : polG, p.x, p.y, p.r * 3, al); }); ca.restore();
      // golden dust motes drifting through the low light (day)
      if (!dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; motes.forEach(function (m) { var a3 = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(tt * 1.7 + m.ph)), 2); n16_glow(ca, polG, m.x, m.y, m.r * 2.6, a3 * 0.55); }); ca.restore(); }
      // brittlebush daisies nodding on their stems
      A.bbf.forEach(function (fl) { var g = gust(fl.x, tt), sw = (Math.sin(tt * 1.6 + fl.ph) * 0.6 + g * 1.4) * fl.r * 0.9, hx = fl.x + sw, hy = fl.y + Math.abs(sw) * 0.08, k;
        cb.strokeStyle = dk ? 'rgba(4,8,14,0.6)' : 'rgba(40,60,36,0.6)'; cb.lineWidth = ph ? 1.2 : 1.5; cb.beginPath(); cb.moveTo(fl.x0, fl.y0); cb.quadraticCurveTo(fl.x0, fl.y, hx, hy); cb.stroke();
        cb.save(); cb.translate(hx, hy); cb.rotate(sw * 0.02); cb.fillStyle = dk ? '#B4A868' : '#F6C83A'; for (k = 0; k < 9; k++) { var a4 = k / 9 * Math.PI * 2; n16_ell(cb, Math.cos(a4) * fl.r * 0.62, Math.sin(a4) * fl.r * 0.5, fl.r * 0.5, fl.r * 0.2, a4); cb.fill(); }
        cb.fillStyle = dk ? '#7A6A3A' : '#C8783A'; n16_ell(cb, 0, 0, fl.r * 0.3, fl.r * 0.26); cb.fill(); cb.restore(); });
      blooms(cb, 2);
      cb.save(); cb.globalCompositeOperation = 'lighter'; pollen.forEach(function (p) { if (!p.front) return; var al = Math.min(1, (t - p.t0) * 3) * Math.min(1, (3.5 - (t - p.t0)) / 1.2); n16_glow(cb, dk ? wG : polG, p.x, p.y, p.r * 3.2, al); cb.fillStyle = dk ? 'rgba(255,255,255,' + al + ')' : 'rgba(255,240,190,' + al + ')'; n16_spark(cb, p.x, p.y, p.r * 1.6); }); cb.restore();
      // dry grass rippling along the bottom edge
      cb.lineCap = 'round'; A.gr.forEach(function (b, j) { var bend = (gust(b.x, tt) * 0.5 + b.lean + Math.sin(tt * 2 + b.ph) * 0.06) * b.h * 0.5; cb.strokeStyle = dk ? (j % 2 ? 'rgba(130,130,170,0.5)' : 'rgba(100,100,140,0.5)') : (j % 2 ? 'rgba(250,206,150,0.8)' : 'rgba(222,160,100,0.8)'); cb.lineWidth = ph ? 1.4 : 1.8; cb.beginPath(); cb.moveTo(b.x, H + 4); cb.quadraticCurveTo(b.x + bend * 0.3, H + 4 - b.h * 0.6, b.x + bend, H + 4 - b.h + Math.abs(bend) * 0.15); cb.stroke(); });
      if (dk && fin) { fin.ms.forEach(function (s) { n16_shoot(cb, s, t, 0.9, -W * 0.2, H * 0.12, 'rgba(255,248,236,A)'); }); }
    },
    finish: function (t) { fin = {t0: t, ms: []}; tips.forEach(function (tp) { tp.popped = 0; tp.d = 0.5 + (tp.L === 2 ? 0 : 0.3) + (tp.x / W) * 2.4 + Math.random() * 0.35; });
      if (dk) for (i = 0; i < (ph ? 7 : 12); i++) fin.ms.push({t0: t + 0.3 + i * 0.35 + Math.random() * 0.3, x: W * (0.3 + Math.random() * 0.75), y: A.peak * (0.05 + Math.random() * 0.5)}); }
  };
};

UIC.saguaro = {L: ['#6A3A6E', '#3E2448', 'rgba(255,255,255,0.84)', '#3A1E28', '#7A5A62', '#C8463A', '#C8463A', '#E0683E', '#FFFFFF'], D: ['#1E1E4A', '#0A0A22', 'rgba(20,20,48,0.78)', '#F2EEF8', '#B4AECA', '#F4A07A', '#F4A07A', '#F7BC96', '#1A0E18']};

// ---------- Baobab Dusk: the puddles shimmer as the evening breeze ruffles them (their mirrored sky and trees waver), the grass
// along the verges ripples, the afterglow at the end of the avenue breathes and warm dust motes drift. Night: the Milky Way
// stands over the avenue, stars twinkle in the sky and in the puddles, and shooting stars cross both.
// Moment: a last beam of sunset light runs down the avenue from the vanishing point: each pair of baobabs flashes gold along its
// trunk as it passes, each puddle turns to a golden mirror with a spray of sparkles, and the sky blushes. At night the light is
// silver, the Milky Way brightens and a meteor shower falls, mirrored in the puddles.
ENGINES.baobab = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, i, hz = A.hz, F = A.F, VX = A.VX;
  var pds = A.pds.map(function (p) { return {path: new Path2D(p.d), cx: p.cx, cy: p.cy, rx: p.rx, ry: p.ry, z: F / Math.max(1, p.cy - hz)}; }), allP = new Path2D(); pds.forEach(function (p) { allP.addPath(p.path); });
  var reflP = new Path2D(A.refl), trees = A.trees.map(function (t) { return {rim: new Path2D(t.rim), x: t.x, y: t.y, h: t.h, z: t.z}; });
  var glowG = n16_rg(dk ? 'rgba(170,150,230,0.35)' : 'rgba(255,214,160,0.5)', [0.4, 0.3]), goldG = n16_rg(dk ? 'rgba(220,230,255,0.9)' : 'rgba(255,220,150,0.9)', [0.3, 0.35]), twG = n16_rg('rgba(255,250,240,0.95)', [0.25, 0.3]), moteG = n16_rg('rgba(255,224,170,0.9)', [0.3, 0.35]);
  var pc = null, pcK = 0, stars = [], nextStar = 4, fin = null, spk = [];
  var motes = []; for (i = 0; i < (ph ? 16 : 30); i++) motes.push({x: Math.random() * W, y: hz - H * 0.15 + Math.random() * (H - hz) * 0.9, ph: Math.random() * 6.28, sp: 3 + Math.random() * 7, r: (0.8 + Math.random() * 1.2) * S + 0.5});
  // the puddles' contents (mirrored sky gradient and trees) painted once at device resolution
  function paintPC(ca) { var tf = ca.getTransform(), k = tf.a; pc = document.createElement('canvas'); pc.width = ca.canvas.width; pc.height = ca.canvas.height; pcK = k; var g = pc.getContext('2d'); g.setTransform(tf);
    g.save(); g.clip(allP); var gr = g.createLinearGradient(0, hz, 0, 2 * hz); A.SK.slice().reverse().forEach(function (q) { gr.addColorStop(1 - q[0], q[1]); }); g.fillStyle = gr; g.fillRect(0, hz, W, H - hz + 10);
    if (dk) { g.fillStyle = 'rgba(240,244,255,0.85)'; for (var j = 0; j < 400; j++) { var px = Math.random() * W, py = hz + Math.random() * (H - hz); g.beginPath(); g.arc(px, py, 0.4 + Math.random() * 0.7, 0, 7); g.fill(); } }
    else { g.fillStyle = 'rgba(255,236,200,0.25)'; pds.forEach(function (p) { n16_ell(g, p.cx, p.cy - p.ry * 0.5, p.rx * 0.8, p.ry * 0.25); g.fill(); }); }
    g.fillStyle = dk ? 'rgba(4,4,14,0.8)' : 'rgba(90,50,74,0.62)'; g.fill(reflP); g.restore(); }
  function inPuddles(c, fn) { c.save(); c.clip(allP); fn(c); c.restore(); }
  return {
    step: function (dt, t, f) {
      motes.forEach(function (m) { m.x += m.sp * S * dt; m.y += Math.sin(t * 0.6 + m.ph) * 3 * S * dt; if (m.x > W + 10) m.x = -10; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 6 + Math.random() * 8; stars.push({t0: t, x: W * (0.15 + Math.random() * 0.8), y: hz * (0.05 + Math.random() * 0.4), d: 1.1}); } }
      stars = stars.filter(function (s) { return t - s.t0 < s.d + 0.2; });
      spk.forEach(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * S * dt; }); spk = spk.filter(function (s) { return t - s.t0 < 1.6; });
      if (fin) { var T = t - fin.t0, zf = 60 * Math.pow(1 / 60, Math.min(1, T / 2.8));
        pds.forEach(function (p) { if (!p.hit && zf < p.z) { p.hit = t; for (var k = 0; k < (ph ? 14 : 24); k++) { var a = Math.random() * 6.28, rr = Math.random(); spk.push({x: p.cx + Math.cos(a) * p.rx * rr, y: p.cy + Math.sin(a) * p.ry * rr, vx: (Math.random() - 0.5) * 40 * S, vy: -(30 + Math.random() * 60) * S, t0: t, r: (1 + Math.random() * 1.6) * S + 0.6}); } } });
        trees.forEach(function (tr) { if (!tr.hit && zf < tr.z) tr.hit = t; });
        if (T > 12) { fin = null; pds.forEach(function (p) { p.hit = 0; }); trees.forEach(function (tr) { tr.hit = 0; }); } }
    },
    draw: function (ca, cb, t, f) { var tt = t * f.s, T = fin ? t - fin.t0 : -1, bk = fin ? n16_env(T, 0, 1, 6, 10) : 0;
      if (!pc || pc.width !== ca.canvas.width || pcK !== ca.getTransform().a) paintPC(ca);
      // the afterglow at the end of the avenue (behind the trees), twinkling stars, shooting stars
      ca.save(); ca.globalCompositeOperation = 'lighter';
      n16_glow(ca, glowG, VX, hz, W * 0.4 * (1 + 0.04 * Math.sin(tt * 0.5) + bk * 0.4), 0.7 + bk * 0.3, 0.35);
      if (bk > 0 && !dk) n16_glow(ca, n16_rg('rgba(255,160,150,0.4)', [0.5, 0.3]), VX, hz * 0.6, W * 0.8, bk * 0.6, 0.6);
      // the sun peeks out once more at the end of the avenue, its rays fanning up between the trunks
      var pk = fin && !dk ? n16_env(T, 0, 0.6, 3, 6) : 0;
      if (pk > 0) { n16_glow(ca, goldG, VX, hz, 26 * S + 10, pk, 0.8); n16_glow(ca, glowG, VX, hz, W * 0.25, pk * 0.8, 0.5);
        for (i = 0; i < 13; i++) { var ra = -Math.PI + 0.08 + i * (Math.PI - 0.16) / 12 + Math.sin(tt * 0.5 + i) * 0.015, Lr = W, wr = 0.016 + (i % 3) * 0.008; ca.fillStyle = dk ? 'rgba(200,210,255,' + (0.07 * pk) + ')' : 'rgba(255,226,180,' + (0.13 * pk) + ')'; ca.beginPath(); ca.moveTo(VX, hz); ca.lineTo(VX + Math.cos(ra - wr) * Lr, hz + Math.sin(ra - wr) * Lr); ca.lineTo(VX + Math.cos(ra + wr) * Lr, hz + Math.sin(ra + wr) * Lr); ca.closePath(); ca.fill(); } }
      if (dk) { A.tw.forEach(function (s, j) { var a = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] * 6.28 + j)), 4); n16_glow(ca, twG, s[0], s[1], 3 + a * 3.5, a * 0.9); });
        if (bk > 0) { var ang = (ph ? -82 : -73) * Math.PI / 180, LEN = Math.hypot(W, hz) * 1.1; for (i = 1; i < 8; i++) n16_glow(ca, glowG, VX - W * 0.05 + Math.cos(ang) * LEN * i / 10, hz + Math.sin(ang) * LEN * i / 10, W * 0.12 * (ph ? 1.5 : 1), bk * 0.5); } }
      ca.restore();
      // the puddles, wavering in the breeze: their contents laid down in thin rows, each nudged sideways
      ca.save(); ca.setTransform(1, 0, 0, 1, 0, 0); var k = pcK;
      pds.forEach(function (p, j) { var y0 = Math.floor((p.cy - p.ry * 1.2) * k), y1 = Math.ceil((p.cy + p.ry * 1.2) * k), x0 = Math.max(0, Math.floor((p.cx - p.rx * 1.2) * k)), x1 = Math.min(pc.width, Math.ceil((p.cx + p.rx * 1.2) * k)), st = Math.max(2, Math.round(k * 1.5)), gust = 0.5 + 0.5 * Math.sin(tt * 0.5 + j * 1.3);
        for (var yy = Math.max(0, y0); yy < Math.min(pc.height, y1); yy += st) { var dx = Math.sin(yy / k * 0.45 + tt * 2.2 + j) * (0.4 + gust * 1.1) * k * S * (p.rx / 100 + 0.5) * 0.6; ca.drawImage(pc, x0, yy, x1 - x0, st, x0 + dx, yy, x1 - x0, st); } });
      ca.restore();
      // breeze streaks sliding over the water, and shooting stars mirrored in it
      inPuddles(ca, function (c) { pds.forEach(function (p, j) { var u = ((tt * 0.07 + j * 0.37) % 1.4) - 0.2, a = Math.sin(Math.PI * Math.max(0, Math.min(1, u))); if (a <= 0.02) return; c.fillStyle = dk ? 'rgba(180,190,255,' + (0.12 * a) + ')' : 'rgba(255,240,220,' + (0.28 * a) + ')'; for (var m = 0; m < 3; m++) { n16_ell(c, p.cx - p.rx + u * p.rx * 2 + m * p.rx * 0.12, p.cy - p.ry * 0.4 + m * p.ry * 0.35, p.rx * 0.35, Math.max(0.6, p.ry * 0.05), 0); c.fill(); } });
        stars.forEach(function (s) { n16_shoot(c, {t0: s.t0, x: s.x, y: 2 * hz - s.y}, t, s.d, W * 0.15, -H * 0.06 * -1, 'rgba(230,236,255,A)'); });
        if (fin && dk) fin.ms.forEach(function (s) { n16_shoot(c, {t0: s.t0, x: s.x, y: 2 * hz - s.y}, t, 0.9, -W * 0.18, -H * 0.1, 'rgba(240,244,255,A)'); });
        // the moment: each puddle turns to a golden (silver) mirror as the light passes
        if (fin) { c.globalCompositeOperation = 'lighter'; pds.forEach(function (p) { if (!p.hit) return; var a = n16_env(t - p.hit, 0, 0.3, 1.6, 3.6); if (a > 0) n16_glow(c, goldG, p.cx, p.cy, p.rx * 1.3, a * 0.75, p.ry / p.rx * 1.6); }); } });
      // the beam of light running down the road
      if (fin && T < 3.6) { var zf = 60 * Math.pow(1 / 60, Math.min(1, T / 2.8)), yf = hz + F / zf, rw = A.RW * F / zf, al = n16_env(T, 0, 0.3, 2.6, 3.6);
        ca.save(); ca.globalCompositeOperation = 'lighter';
        var rg = ca.createLinearGradient(0, hz, 0, yf + 4); rg.addColorStop(0, dk ? 'rgba(200,210,255,0)' : 'rgba(255,210,150,0)'); rg.addColorStop(1, dk ? 'rgba(200,210,255,' + (0.3 * al) + ')' : 'rgba(255,210,150,' + (0.45 * al) + ')'); ca.fillStyle = rg;
        ca.beginPath(); ca.moveTo(VX - A.RW * F / 60, hz + F / 60); ca.lineTo(VX + A.RW * F / 60, hz + F / 60); ca.lineTo(VX + rw, yf); ca.lineTo(VX - rw, yf); ca.closePath(); ca.fill();
        n16_glow(ca, goldG, VX, yf, rw * 1.6 + 8, al * 0.7, 0.25); n16_glow(ca, glowG, VX, (yf + hz) / 2, rw + 20, al * 0.6, Math.max(0.3, (yf - hz) / (rw + 20) * 0.6)); ca.restore(); }
      // drifting dust motes in the warm light (day)
      if (!dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; motes.forEach(function (m) { var a = 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(tt * 1.5 + m.ph)), 2); n16_glow(ca, moteG, m.x, m.y, m.r * 2.6, a * 0.5); }); ca.restore(); }
      else stars.forEach(function (s) { n16_shoot(ca, s, t, s.d, W * 0.15, H * 0.06, 'rgba(255,248,236,A)'); });
      // the moment on the trees: each trunk's lit edge flashes as the light reaches it
      if (fin) { cb.save(); cb.globalCompositeOperation = 'lighter'; trees.forEach(function (tr) { if (!tr.hit) return; var a = n16_env(t - tr.hit, 0, 0.25, 1.4, 3.4); if (a <= 0) return; cb.fillStyle = dk ? 'rgba(200,210,255,' + (0.7 * a) + ')' : 'rgba(255,214,150,' + (0.8 * a) + ')'; cb.fill(tr.rim); n16_glow(cb, glowG, tr.x, tr.y - tr.h * 0.45, tr.h * 0.35, a * 0.5, 1.4); });
        spk.forEach(function (s) { var a = Math.min(1, (t - s.t0) * 4) * (1 - (t - s.t0) / 1.6); cb.fillStyle = dk ? 'rgba(235,240,255,' + a + ')' : 'rgba(255,236,180,' + a + ')'; n16_spark(cb, s.x, s.y, s.r * 2); });
        if (dk) fin.ms.forEach(function (s) { n16_shoot(cb, s, t, 0.9, -W * 0.18, H * 0.1, 'rgba(255,250,240,A)'); }); cb.restore(); }
      // tall grass along the bottom edge rippling in the breeze
      cb.lineCap = 'round'; A.gr.forEach(function (b) { var g = 0.5 + 0.5 * Math.sin(b.x * 0.005 - tt * 1.1), bend = (g * g * 0.55 + b.lean + Math.sin(tt * 2.1 + b.ph) * 0.05) * b.h * 0.5; cb.strokeStyle = dk ? (b.c ? '#2E3A48' : '#243040') : (b.c ? '#B8A262' : '#8E8446'); cb.lineWidth = ph ? 1.6 : 2; cb.beginPath(); cb.moveTo(b.x, H + 4); cb.quadraticCurveTo(b.x + bend * 0.3, H + 4 - b.h * 0.6, b.x + bend, H + 4 - b.h + Math.abs(bend) * 0.15); cb.stroke(); });
    },
    finish: function (t) { fin = {t0: t, ms: []}; pds.forEach(function (p) { p.hit = 0; }); trees.forEach(function (tr) { tr.hit = 0; });
      if (dk) for (i = 0; i < (ph ? 7 : 12); i++) fin.ms.push({t0: t + 0.4 + i * 0.32 + Math.random() * 0.3, x: W * (0.25 + Math.random() * 0.75), y: hz * (0.05 + Math.random() * 0.45)}); }
  };
};

UIC.baobab = {L: ['#7A4A48', '#4A2A2C', 'rgba(255,255,255,0.84)', '#3A2420', '#7A6058', '#B8503A', '#B8503A', '#D0704E', '#FFFFFF'], D: ['#1A1E44', '#080A1E', 'rgba(16,20,46,0.78)', '#EEF0FA', '#AAB0CC', '#F2A58A', '#F2A58A', '#F6C0A6', '#180E12']};
