// ---- batch n2 engines: mushrooms, sunflowers, cloudkingdom, nighttrain, ramen
function n2_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n2_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n2_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n2_ease((T - c) / (d - c)); }
var n2_gc = null;
function n2_ctx() { return n2_gc || (n2_gc = document.createElement('canvas').getContext('2d')); }
// radial glow of radius 1 centred on 0,0 fading to transparent; col is 'rgba(r,g,b,a)'
function n2_rg(col, mid) { var g = n2_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n2_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n2_blink(t, seed) { var u = (t * 0.29 + seed * 3.7) % 4.6; return u < 0.13 ? Math.abs(u - 0.065) / 0.065 : 1; }
// an offscreen canvas of w x h (scene units) drawn by fn(ctx) with 0,0 at the top-left, at k pixels per unit
function n2_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k)); var o = cv.getContext('2d'); o.scale(k, k); fn(o); cv.uw = w; cv.uh = h; return cv; }
var n2_INK = '#3A2A3A', n2_BLUSH = 'rgba(255,120,150,0.5)';
// kawaii face centred at x,y with size r. mode 0 open (blinks), 1 sleeping, 2 happy
function n2_face(c, x, y, r, mode, t, seed, ink) {
  var k = ink || n2_INK, g = r * 0.34, er = r * 0.1;
  c.fillStyle = k; c.strokeStyle = k; c.lineCap = 'round'; c.lineWidth = Math.max(0.8, r * 0.07);
  if (mode === 1) { c.beginPath(); c.arc(x - g, y - r * 0.05, r * 0.13, Math.PI * 0.15, Math.PI * 0.85); c.moveTo(x + g + r * 0.13 * Math.cos(Math.PI * 0.15), y - r * 0.05 + r * 0.13 * Math.sin(Math.PI * 0.15)); c.arc(x + g, y - r * 0.05, r * 0.13, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
  else if (mode === 2) { c.beginPath(); c.arc(x - g, y + r * 0.04, r * 0.13, Math.PI * 1.15, Math.PI * 1.85); c.moveTo(x + g + r * 0.13 * Math.cos(Math.PI * 1.15), y + r * 0.04 + r * 0.13 * Math.sin(Math.PI * 1.15)); c.arc(x + g, y + r * 0.04, r * 0.13, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else { var b = n2_blink(t, seed || 0); if (b < 0.3) { c.beginPath(); c.moveTo(x - g - er, y); c.lineTo(x - g + er, y); c.moveTo(x + g - er, y); c.lineTo(x + g + er, y); c.stroke(); }
    else { c.beginPath(); c.ellipse(x - g, y, er, er * 1.15 * b, 0, 0, 7); c.ellipse(x + g, y, er, er * 1.15 * b, 0, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - g + er * 0.35, y - er * 0.4, er * 0.38, 0, 7); c.arc(x + g + er * 0.35, y - er * 0.4, er * 0.38, 0, 7); c.fill(); } }
  c.fillStyle = n2_BLUSH; c.beginPath(); c.ellipse(x - g * 1.45, y + r * 0.16, r * 0.13, r * 0.08, 0, 0, 7); c.ellipse(x + g * 1.45, y + r * 0.16, r * 0.13, r * 0.08, 0, 0, 7); c.fill();
  c.strokeStyle = k; c.lineWidth = Math.max(0.8, r * 0.06); c.beginPath(); if (mode === 2) { c.arc(x, y + r * 0.1, r * 0.13, 0.1, Math.PI - 0.1); } else c.arc(x, y + r * 0.08, r * 0.08, 0.3, Math.PI - 0.3); c.stroke();
}
function n2_note(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, 3.4, 2.5, -0.4, 0, 7); c.fill(); c.beginPath(); c.moveTo(3, -1); c.lineTo(3, -13); c.quadraticCurveTo(7, -10, 8, -6); c.stroke(); c.restore(); }
function n2_star(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }

// ---------- Mushroom Hollow: caps breathe, spores drift through the light, a fern uncurls, a snail crosses the log.
// Night: the mushrooms glow blue and teal. Moment: the fairy ring lights up one by one like a xylophone, each puffing sparkles.
ENGINES.mushrooms = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, ctx = n2_ctx();
  var CAP = dk ? [['#B8F6FF', '#5FD6E8', '#2E8FB0'], ['#C8D8FF', '#7FA6FF', '#4A5AC0'], ['#C8FFE8', '#6FE8C0', '#2E9A88']] : [['#FF9E86', '#E45A48', '#B83A34'], ['#F2C79A', '#C98B5A', '#94603A'], ['#E8D2FF', '#B48AD8', '#8A5AB0']];
  var RC = A.ring.cols, STEM = dk ? ['#DCE6FF', '#9AAAD0'] : ['#FFFBF2', '#E4D2B8'], UNDER = dk ? '#3A5A88' : '#E6C2A4', SPOT = dk ? '#F0FFFF' : '#FFF8EE';
  var glowT = n2_rg('rgba(110,240,255,0.55)', [0.35, 0.22]), glowB = n2_rg('rgba(140,170,255,0.5)', [0.35, 0.2]), sporeG = n2_rg(dk ? 'rgba(150,255,230,0.9)' : 'rgba(255,214,90,0.95)', [0.3, 0.45]);
  var sh = A.shrooms.map(function (m, i) {
    var P = n2_shroom(0, 0, m.h, m.r, m.lean, m.kind), ring = m.ring != null, cc;
    if (ring) { var base = RC[m.ring]; cc = dk ? [mix(base, '#FFFFFF', 0.5), mix(base, '#4A6AB0', 0.35), mix(base, '#1A2A50', 0.55)] : [mix(base, '#FFFFFF', 0.45), base, mix(base, '#5A3A50', 0.35)]; }
    else cc = CAP[m.col];
    var tx = P.top[0], ty = P.top[1], ry = m.kind === 'flat' ? 0.42 : m.kind === 'bell' ? 1.05 : 0.8, g = ctx.createRadialGradient(tx - m.r * 0.35, ty - m.r * ry * 0.75, m.r * 0.05, tx, ty - m.r * ry * 0.3, m.r * 1.15);
    g.addColorStop(0, cc[0]); g.addColorStop(0.45, cc[1]); g.addColorStop(1, cc[2]);
    var sg = ctx.createLinearGradient(-m.r * 0.3, 0, m.r * 0.3, 0); sg.addColorStop(0, STEM[0]); sg.addColorStop(1, STEM[1]);
    return {x: m.x, y: m.y, h: m.h, r: m.r, top: P.top, ry: ry, ring: m.ring, face: m.face, ph: i * 1.37, stem: new Path2D(P.stem), under: new Path2D(P.under), cap: new Path2D(P.cap), spots: P.spots ? new Path2D(P.spots) : null, shine: new Path2D(P.shine), g: g, sg: sg, base: ring ? RC[m.ring] : null, glow: ring ? n2_rg(rgba(RC[m.ring], dk ? 0.6 : 0.55), [0.35, dk ? 0.25 : 0.2]) : m.col === 1 ? glowB : glowT, lit: 0};
  });
  var ringOrder = sh.filter(function (m) { return m.ring != null; }).sort(function (p, q) { return p.ring - q.ring; });
  // spores
  var spores = [], NS = ph ? 34 : 70;
  function spore(fresh) { var b = A.beams[Math.floor(Math.random() * A.beams.length)], y = fresh ? Math.random() * H : A.gy + Math.random() * (H - A.gy) * 0.6, x = b[0] + (y + 40) / (A.gy + 50) * b[2] + (Math.random() - 0.5) * b[1] * 1.6;
    if (dk || Math.random() < 0.35) { var m = sh[Math.floor(Math.random() * sh.length)]; x = m.x + m.top[0] + (Math.random() - 0.5) * m.r; y = m.y + m.top[1] - m.r * 0.3; if (fresh) y -= Math.random() * H * 0.4; }
    return {x: x, y: y, vx: (Math.random() - 0.3) * 6, vy: -(4 + Math.random() * 9), r: 0.8 + Math.random() * 1.6, ph: Math.random() * 6.28, a: fresh ? 1 : 0}; }
  for (var i = 0; i < NS; i++) spores.push(spore(true));
  var puffs = [], notes = [], mom = null, L = A.log, F = A.fern;
  var snail = {u: 0.15}, la = Math.atan2(L.y1 - L.y0, L.x1 - L.x0);
  function drawSnail(c, t, x, y, s, happy) {
    c.save(); c.translate(x, y); c.rotate(la); c.scale(s, s); var st = Math.sin(t * 2) * 0.6;
    c.fillStyle = dk ? '#AFC2E6' : '#F3D7B4'; c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-4, -2, 6, -3); c.quadraticCurveTo(13, -4, 14, -10); c.quadraticCurveTo(17, -14, 19, -9); c.quadraticCurveTo(19, -1, 12, 0.5); c.closePath(); c.fill();
    c.strokeStyle = dk ? '#AFC2E6' : '#E8C49C'; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(16, -12); c.lineTo(15 + st, -19); c.moveTo(18, -12); c.lineTo(20 + st, -18); c.stroke();
    c.fillStyle = n2_INK; c.beginPath(); c.arc(15 + st, -19, 1.2, 0, 7); c.arc(20 + st, -18, 1.2, 0, 7); c.fill();
    var sg = c.createRadialGradient(-5, -12, 1, -3, -9, 11); sg.addColorStop(0, dk ? '#E8D8FF' : '#FFD99A'); sg.addColorStop(1, dk ? '#7A6AC0' : '#D98A3E'); c.fillStyle = sg; c.beginPath(); c.arc(-3, -9, 9.5, 0, 7); c.fill();
    c.strokeStyle = dk ? 'rgba(40,30,80,0.6)' : 'rgba(150,80,30,0.65)'; c.lineWidth = 1.3; c.beginPath(); for (var k = 0; k <= 40; k++) { var a = k / 40 * 11, rr = 1 + k / 40 * 7.5; c.lineTo(-3 + Math.cos(a) * rr, -9 + Math.sin(a) * rr); } c.stroke();
    c.fillStyle = n2_BLUSH; c.beginPath(); c.arc(16, -6, 1.6, 0, 7); c.fill(); c.strokeStyle = n2_INK; c.lineWidth = 0.9; c.beginPath(); c.arc(14.5, -5, 1.4, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
  }
  return {
    step: function (dt, t, f) {
      spores.forEach(function (p) { p.x += (p.vx + Math.sin(t * 0.7 + p.ph) * 5) * dt * f.s; p.y += p.vy * dt * f.s; p.a = Math.min(1, p.a + dt * 0.6); if (p.y < -20 || p.x < -30 || p.x > W + 30) { var q = spore(false); for (var k in q) p[k] = q[k]; } });
      snail.u += dt * f.s * 0.006; if (snail.u > 1.08) snail.u = -0.05;
      puffs.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 18 * dt; p.vx *= 0.985; p.life -= dt; }); puffs = puffs.filter(function (p) { return p.life > 0; });
      notes.forEach(function (n) { n.y -= 30 * dt; n.x += Math.sin(t * 3 + n.ph) * 12 * dt; n.life -= dt; }); notes = notes.filter(function (n) { return n.life > 0; });
      if (mom) { var T = t - mom.t0; ringOrder.forEach(function (m, k) { var t1 = 0.25 + k * 0.33; if (!m.fired && T >= t1) { m.fired = 1; m.hit = t;
            for (var j = 0; j < (ph ? 9 : 14); j++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 30 + Math.random() * 60; puffs.push({x: m.x + m.top[0], y: m.y + m.top[1] - m.r * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 1.4 + Math.random() * 0.8, c: m.base, r: 1.5 + Math.random() * 2.5}); }
            notes.push({x: m.x + m.top[0] + 6, y: m.y + m.top[1] - m.r - 6, ph: k, life: 2.2, c: m.base}); } });
        if (T > 9) { mom = null; ringOrder.forEach(function (m) { m.fired = 0; }); } }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i, T = mom ? t - mom.t0 : -1, all = mom ? n2_env(T, 3.0, 3.6, 6.5, 8.5) : 0;
      // spores drifting in the light (behind the front layer)
      ca.save(); if (dk) ca.globalCompositeOperation = 'lighter';
      spores.forEach(function (p, k) { var tw = 0.55 + 0.45 * Math.sin(tt * 1.7 + p.ph); n2_dot(ca, sporeG, p.x, p.y, p.r * (dk ? 5 : 4.5), p.a * tw * (dk ? 0.9 : 0.9)); });
      ca.restore();
      // the snail on the log
      var su = Math.max(0, Math.min(1, snail.u)), sx = L.x0 + (L.x1 - L.x0) * (0.08 + su * 0.84), sy = L.y0 + (L.y1 - L.y0) * (0.08 + su * 0.84) - L.th * 0.45;
      ca.save(); ca.globalAlpha = Math.min(1, (snail.u + 0.05) * 10, (1.08 - snail.u) * 10); drawSnail(ca, tt, sx, sy, ph ? 0.75 : 1.05, mom); ca.restore();
      // the uncurling fiddlehead
      var cu = 0.5 + 0.5 * Math.cos(tt * 2 * Math.PI / 30), sway = Math.sin(tt * 0.8) * 0.04;
      cb.fillStyle = dk ? '#2A6A5E' : '#6DB35E'; cb.fill(new Path2D(n2_frond(F.x, F.y, F.len, -1.62 + sway, 0.3, 0.15 + cu * 0.85, ph ? 2.6 : 3.6)));
      cb.fillStyle = dk ? '#3A8A74' : '#8CCB6A'; cb.fill(new Path2D(n2_frond(F.x + 8, F.y + 4, F.len * 0.75, -1.3 + sway, 0.5, 0.3 + (1 - cu) * 0.6, ph ? 2.2 : 3)));
      // mushrooms
      sh.forEach(function (m, k) {
        var b = Math.sin(tt * 0.9 + m.ph), hit = m.hit && t - m.hit < 0.6 ? Math.sin((t - m.hit) / 0.6 * Math.PI) : 0, lit = mom && m.ring != null ? Math.max(m.fired ? n2_env(t - m.hit, 0, 0.1, 0.5, 2.2) * 0.85 + all * 0.75 : 0, all * 0.75) : 0;
        if (dk || lit > 0) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; var gg = m.glow;
          n2_dot(cb, gg, m.x + m.top[0], m.y + m.top[1] - m.r * 0.2, m.r * (2.2 + lit * 1.3), dk ? 0.55 + 0.2 * b + lit * 0.4 : lit * 0.9); cb.restore(); }
        cb.save(); cb.translate(m.x, m.y); var sy = 1 + 0.03 * b - hit * 0.12, sx = 1 - 0.02 * b + hit * 0.1; cb.scale(sx, sy);
        cb.fillStyle = m.sg; cb.fill(m.stem); cb.fillStyle = UNDER; cb.fill(m.under);
        cb.save(); cb.translate(m.top[0], m.top[1]); var cs = 1 + 0.025 * b; cb.scale(cs, 1 / cs); cb.translate(-m.top[0], -m.top[1]); cb.fillStyle = m.g; cb.fill(m.cap);
        if (m.spots) { cb.fillStyle = SPOT; cb.globalAlpha = dk ? 0.85 : 0.95; cb.fill(m.spots); cb.globalAlpha = 1; }
        cb.fillStyle = 'rgba(255,255,255,' + (dk ? 0.35 : 0.5) + ')'; cb.fill(m.shine);
        if (lit > 0) { cb.globalAlpha = lit * 0.5; cb.fillStyle = '#FFFFFF'; cb.fill(m.cap); cb.globalAlpha = 1; }
        cb.restore();
        if (m.face) { var fr = m.r * (m.face === 3 ? 0.55 : 0.42), fy = -m.h * (m.face === 3 ? 0.5 : 0.42), fx = m.top[0] * 0.45; n2_face(cb, fx, fy, fr, mom ? 2 : m.face === 1 ? 0 : (m.face === 2 ? 0 : 1), tt, k, dk ? '#2A2A4A' : n2_INK); }
        cb.restore();
      });
      // sparkle puffs and notes from the fairy ring
      puffs.forEach(function (p) { var a = Math.min(1, p.life); cb.fillStyle = rgba(p.c, a); n2_star(cb, p.x, p.y, p.r * 1.6); cb.fillStyle = 'rgba(255,255,255,' + a * 0.8 + ')'; cb.beginPath(); cb.arc(p.x, p.y, p.r * 0.45, 0, 7); cb.fill(); });
      notes.forEach(function (n) { cb.globalAlpha = Math.min(1, n.life); n2_note(cb, n.x, n.y, ph ? 0.9 : 1.2, mix(n.c, dk ? '#FFFFFF' : '#3A2A4A', 0.35)); cb.globalAlpha = 1; });
    },
    finish: function (t) { if (!mom) mom = {t0: t}; }
  };
};
// ---------- Sunflower Field: the sun crosses the sky and every head follows it, bees drift between flowers, cloud shadows slide over
// the field. Night: the heads droop sleepily, fireflies and the barn windows glow. Moment: every flower turns to face you, nods, and tosses petals.
ENGINES.sunflowers = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = ph ? 0.62 : 1, R0 = 48, i;
  var PET = dk ? ['#F2D27A', '#C89A36', '#9A6E24'] : ['#FFE680', '#FFC21F', '#E89A10'], DISC = dk ? ['#5A3A24', '#2E1C14'] : ['#8A5428', '#4A2A14'];
  function headImg(back) { return n2_sprite(R0 * 2.6, R0 * 2.6, 1.5, function (o) { o.translate(R0 * 1.3, R0 * 1.3);
    if (back) { o.fillStyle = dk ? '#2E5A3E' : '#5E9A3E'; for (var k = 0; k < 14; k++) { o.save(); o.rotate(k / 14 * 6.283); o.beginPath(); o.ellipse(R0 * 0.62, 0, R0 * 0.42, R0 * 0.13, 0, 0, 7); o.fill(); o.restore(); } o.fillStyle = dk ? '#3A6A48' : '#77B04E'; o.beginPath(); o.arc(0, 0, R0 * 0.62, 0, 7); o.fill(); o.fillStyle = 'rgba(0,0,0,0.12)'; o.beginPath(); o.arc(R0 * 0.1, R0 * 0.08, R0 * 0.45, 0, 7); o.fill(); return; }
    for (var L = 0; L < 2; L++) for (var k = 0; k < 16; k++) { o.save(); o.rotate((k + L * 0.5) / 16 * 6.283); var g = o.createLinearGradient(R0 * 0.3, 0, R0 * 1.05, 0); g.addColorStop(0, L ? PET[2] : PET[1]); g.addColorStop(1, L ? PET[1] : PET[0]); o.fillStyle = g; o.beginPath(); o.moveTo(R0 * 0.35, 0); o.quadraticCurveTo(R0 * 0.62, -R0 * (L ? 0.17 : 0.2), R0 * (L ? 0.92 : 1.02), 0); o.quadraticCurveTo(R0 * 0.62, R0 * (L ? 0.17 : 0.2), R0 * 0.35, 0); o.fill(); o.restore(); }
    var dg = o.createRadialGradient(-R0 * 0.12, -R0 * 0.15, R0 * 0.05, 0, 0, R0 * 0.5); dg.addColorStop(0, DISC[0]); dg.addColorStop(1, DISC[1]); o.fillStyle = dg; o.beginPath(); o.arc(0, 0, R0 * 0.48, 0, 7); o.fill();
    o.fillStyle = dk ? 'rgba(200,150,80,0.35)' : 'rgba(255,200,110,0.45)'; for (k = 0; k < 90; k++) { var a = k * 2.39996, rr = Math.sqrt(k / 90) * R0 * 0.42; o.beginPath(); o.arc(Math.cos(a) * rr, Math.sin(a) * rr, R0 * 0.025, 0, 7); o.fill(); }
    o.fillStyle = 'rgba(255,255,255,0.18)'; o.beginPath(); o.ellipse(-R0 * 0.18, -R0 * 0.2, R0 * 0.18, R0 * 0.1, -0.6, 0, 7); o.fill(); }); }
  var front = headImg(false), backI = headImg(true), leafP = new Path2D(leaf(0, 0, 1, 0.34, 0));
  var fl = A.flowers.map(function (q) { return {x: q.x, y: q.y, r: q.r, h: q.h, z: q.z, ph: q.ph, face: q.face, yaw: 0, tilt: 0}; });
  var sunG = n2_rg('rgba(255,236,150,0.75)', [0.3, 0.35]), moonG = n2_rg('rgba(255,240,200,0.4)', [0.3, 0.15]), flyG = n2_rg('rgba(230,255,140,0.9)', [0.25, 0.35]), winG = n2_rg('rgba(255,200,110,0.6)', [0.3, 0.3]), shadowG = n2_rg('rgba(30,60,20,0.16)', [0.6, 0.12]), popG = n2_rg(dk ? 'rgba(255,220,120,0.7)' : 'rgba(255,240,170,0.85)', [0.4, 0.35]);
  var clouds = dk ? [] : [{x: W * 0.1, y: H * 0.12, s: 1.1}, {x: W * 0.55, y: H * 0.26, s: 0.8}, {x: W * 0.85, y: H * 0.08, s: 0.9}];
  var bees = [], NB = dk ? 0 : (ph ? 3 : 5), cand = fl.filter(function (q) { return q.z > 0.45; });
  for (i = 0; i < NB; i++) bees.push({x: Math.random() * W, y: H * 0.7, tg: null, next: 0, ph: Math.random() * 6.28});
  var flies = []; if (dk) for (i = 0; i < (ph ? 16 : 30); i++) flies.push({x: Math.random() * W, y: A.fieldTop + Math.random() * (H - A.fieldTop), ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.5});
  var petals = [], mom = null, sun = {x: W * 0.3, y: H * 0.15};
  function cloud(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.arc(-34, 6, 18, 0, 7); c.arc(-12, -8, 26, 0, 7); c.arc(18, -2, 22, 0, 7); c.arc(40, 8, 14, 0, 7); c.rect(-40, 4, 80, 20); c.fill(); c.fillStyle = 'rgba(220,235,250,0.7)'; c.beginPath(); c.ellipse(0, 20, 46, 6, 0, 0, 7); c.fill(); c.restore(); }
  function bee(c, x, y, s, t, dir) { c.save(); c.translate(x, y); c.scale(s * dir, s); var fl2 = Math.abs(Math.sin(t * 40));
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(-1, -5 - fl2 * 2, 3.4, 5 * (0.4 + fl2 * 0.6), -0.4, 0, 7); c.ellipse(3, -5 - fl2 * 2, 3, 4.4 * (0.4 + fl2 * 0.6), 0.4, 0, 7); c.fill();
    c.fillStyle = '#FFCB2E'; c.beginPath(); c.ellipse(0, 0, 7, 5, 0, 0, 7); c.fill(); c.fillStyle = '#3A2A20'; c.fillRect(-3.4, -4.6, 2, 9.2); c.fillRect(0.6, -4.9, 2, 9.8); c.beginPath(); c.moveTo(-7, -1); c.lineTo(-10, 0); c.lineTo(-7, 1); c.fill();
    c.fillStyle = n2_INK; c.beginPath(); c.arc(4.6, -1, 0.9, 0, 7); c.fill(); c.fillStyle = n2_BLUSH; c.beginPath(); c.arc(4.8, 1.3, 1.1, 0, 7); c.fill(); c.restore(); }
  return {
    step: function (dt, t, f) {
      var tt = t * f.s, th = tt * 2 * Math.PI / 160;
      sun.x = W * (0.5 - 0.4 * Math.cos(th)); sun.y = H * (ph ? 0.2 : 0.21) - H * 0.11 * Math.abs(Math.sin(th));
      var T = mom ? t - mom.t0 : -1, face = mom ? n2_env(T, 0, 0.6, 5.2, 6.5) : 0, wake = dk ? face : 0;
      fl.forEach(function (q, k) {
        var want = dk ? Math.sin(q.ph) * 0.3 : Math.max(-0.95, Math.min(0.95, (sun.x - q.x) / (W * 0.45)));
        want = want * (1 - face); q.yaw += (want - q.yaw) * Math.min(1, dt * (mom ? 4 : 0.8));
        var nod = mom ? Math.sin((T - 0.7) * 7) * 0.22 * n2_env(T, 0.6, 0.9, 2.4, 3) : 0, droop = dk ? 0.55 * (1 - wake) : 0;
        q.tilt = Math.sin(tt * 0.7 + q.ph) * 0.05 + nod + droop * (q.yaw >= 0 ? 1 : -1) * 0.6; q.droop = droop;
        if (mom && T > 1.0 && !q.tossed && Math.random() < dt * 4) { q.tossed = 1; q.pop = t; for (var j = 0; j < (q.r > 25 ? 7 : q.r > 14 ? 4 : 2); j++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = (140 + Math.random() * 220) * (0.6 + q.z * 0.7); petals.push({x: q.x, y: q.y - q.h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: q.r * 0.42 + 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6, life: 4 + Math.random() * 2, fl: Math.random() * 6}); } }
      });
      if (mom && T > 8) { mom = null; fl.forEach(function (q) { q.tossed = 0; }); }
      petals.forEach(function (p) { p.vy += 120 * dt; p.vx *= Math.pow(0.4, dt); p.vy *= Math.pow(0.25, dt); p.x += (p.vx + Math.sin(t * 2 + p.fl) * 20) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt; }); petals = petals.filter(function (p) { return p.life > 0 && p.y < H + 20; });
      bees.forEach(function (b) { b.next -= dt; if (b.next <= 0 || !b.tg) { b.tg = cand[Math.floor(Math.random() * cand.length)]; b.next = 3 + Math.random() * 4; }
        var tx = b.tg.x + Math.sin(t * 2.3 + b.ph) * b.tg.r * 0.8, ty = b.tg.y - b.tg.h - b.tg.r * 0.9 + Math.sin(t * 3.1 + b.ph) * 8; b.vx = (tx - b.x) * Math.min(1, dt * 1.2); b.x += b.vx; b.y += (ty - b.y) * Math.min(1, dt * 1.2); });
      clouds.forEach(function (c) { c.x += dt * f.s * 6 * c.s; if (c.x > W + 120) c.x = -120; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = mom ? t - mom.t0 : -1, J = mom ? n2_env(T, 0, 0.4, 5, 6.5) : 0;
      // sky: the sun with its rays (day) or a sleepy moon (night); clouds
      if (!dk) { n2_dot(ca, sunG, sun.x, sun.y, 120 * S, 0.9); ca.save(); ca.translate(sun.x, sun.y); ca.rotate(tt * 0.05); ca.fillStyle = 'rgba(255,214,90,0.55)'; for (i = 0; i < 12; i++) { ca.rotate(Math.PI / 6); ca.beginPath(); ca.moveTo(42 * S, -6 * S); ca.lineTo(62 * S, 0); ca.lineTo(42 * S, 6 * S); ca.fill(); } ca.restore();
        var sg = ca.createRadialGradient(sun.x - 10 * S, sun.y - 10 * S, 4, sun.x, sun.y, 36 * S); sg.addColorStop(0, '#FFF6C2'); sg.addColorStop(1, '#FFC93A'); ca.fillStyle = sg; ca.beginPath(); ca.arc(sun.x, sun.y, 34 * S, 0, 7); ca.fill(); n2_face(ca, sun.x, sun.y + 2 * S, 30 * S, J > 0.2 ? 2 : 2, tt, 1); }
      else { var mx = W * (ph ? 0.78 : 0.66), my = H * 0.15, mr = 26 * S; n2_dot(ca, moonG, mx, my, mr * 3.2, 1); ca.fillStyle = '#FFF4D2'; ca.beginPath(); ca.arc(mx, my, mr, Math.PI * 0.35, Math.PI * 1.65); ca.arc(mx + mr * 0.55, my - mr * 0.2, mr * 0.82, Math.PI * 1.45, Math.PI * 0.62, true); ca.fill(); n2_face(ca, mx - mr * 0.42, my + 2, mr * 0.5, J > 0.2 ? 2 : 1, tt, 2);
        ca.fillStyle = '#FFF4DA'; for (i = 0; i < (ph ? 10 : 18); i++) { var sx = hash(i * 3.1) * W, sy = hash(i * 7.7) * H * 0.4, a = 0.5 + 0.5 * Math.sin(tt * (0.8 + hash(i) * 1.5) + i); ca.globalAlpha = 0.3 + 0.7 * a; n2_star(ca, sx, sy, 2 + a * 2.5); } ca.globalAlpha = 1; }
      clouds.forEach(function (c) { cloud(ca, c.x, c.y, c.s * S); });
      // barn windows glow at night
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.barn.wins.forEach(function (w, k) { n2_dot(cb, winG, w[0], w[1], 26 * A.barn.s, 0.8 + 0.2 * flick(tt * 0.3, k)); }); cb.restore(); }
      // the sunflowers, back rows first
      var stemC = dk ? '#2C5A3A' : '#4E8E34', leafC = dk ? '#2A5236' : '#5A9E3A';
      fl.forEach(function (q, k) {
        var r = q.r, sc = r / R0, hx = q.x + Math.sin(tt * 0.7 + q.ph) * r * 0.08, hy = q.y - q.h + (q.droop || 0) * r * 0.7;
        cb.strokeStyle = stemC; cb.lineWidth = Math.max(1, r * 0.15); cb.lineCap = 'round'; cb.beginPath(); cb.moveTo(q.x, q.y + r * 1.5); cb.quadraticCurveTo(q.x, hy + r * 1.2, hx, hy + r * 0.2); cb.stroke();
        if (r > 14) { cb.fillStyle = leafC; [[0.45, -1], [0.7, 1]].forEach(function (L2, n) { var ly = q.y + r * 1.5 - (q.y + r * 1.5 - hy) * L2[0], sw = Math.sin(tt * 0.9 + q.ph + n) * 0.12; cb.save(); cb.translate(q.x + (hx - q.x) * L2[0], ly); cb.rotate(L2[1] > 0 ? -0.35 + sw : Math.PI + 0.35 + sw); cb.scale(r * 1.15, r * 1.15); cb.fill(leafP); cb.restore(); }); }
        var yaw = q.yaw, cx = Math.max(0.3, Math.cos(yaw)), sn = Math.sin(yaw);
        if (q.pop && t - q.pop < 1.2) n2_dot(cb, popG, hx, hy, r * (1.6 + (t - q.pop) * 1.5), 1 - (t - q.pop) / 1.2);
        cb.save(); cb.translate(hx, hy); cb.rotate(q.tilt); if (q.droop) cb.scale(1, 1 - q.droop * 0.3); if (q.pop && t - q.pop < 0.5) { var pk = 1 + 0.15 * Math.sin((t - q.pop) / 0.5 * Math.PI); cb.scale(pk, pk); }
        if (r > 12) { cb.save(); cb.translate(-sn * r * 0.22, 0); cb.scale(cx * sc * 0.96, sc * 0.96); cb.drawImage(backI, -backI.uw / 2, -backI.uh / 2, backI.uw, backI.uh); cb.restore(); }
        cb.save(); cb.translate(sn * r * 0.1, 0); cb.scale(cx * sc, sc); cb.drawImage(front, -front.uw / 2, -front.uh / 2, front.uw, front.uh);
        if (q.face) { cb.scale(1 / sc, 1 / sc); n2_face(cb, 0, r * 0.02, r * 0.42, J > 0.2 ? 2 : dk ? 1 : 0, tt, k, '#2A1608'); }
        cb.restore(); cb.restore();
      });
      // cloud shadows over the field (day), fireflies (night)
      if (!dk) clouds.forEach(function (c) { var sx = c.x + W * 0.05, sy = A.fieldTop + (H - A.fieldTop) * (0.35 + 0.4 * ((c.x / W + c.s) % 1)); cb.save(); cb.translate(sx, sy); cb.scale(150 * S * c.s, 50 * S * c.s); cb.fillStyle = shadowG; cb.beginPath(); cb.arc(0, 0, 1, 0, 7); cb.fill(); cb.restore(); });
      cb.save(); cb.globalCompositeOperation = 'lighter'; flies.forEach(function (p) { var x = p.x + Math.sin(tt * p.sp + p.ph) * 40, y = p.y + Math.sin(tt * p.sp * 1.3 + p.ph * 2) * 18, a = Math.max(0, Math.sin(tt * 1.3 + p.ph * 3)); n2_dot(cb, flyG, x, y, 10, a); }); cb.restore();
      bees.forEach(function (b) { bee(cb, b.x, b.y, S * 1.1, t, b.vx >= 0 ? 1 : -1); });
      petals.forEach(function (p) { cb.save(); cb.translate(p.x, p.y); cb.rotate(p.rot); var fc = Math.cos(t * 4 + p.fl); cb.scale(fc < 0 ? Math.min(-0.35, fc) : Math.max(0.35, fc), 1); cb.globalAlpha = Math.min(1, p.life); cb.fillStyle = PET[p.fl > 3 ? 0 : 1]; cb.beginPath(); cb.moveTo(0, -p.r); cb.quadraticCurveTo(p.r * 0.5, 0, 0, p.r); cb.quadraticCurveTo(-p.r * 0.5, 0, 0, -p.r); cb.fill(); cb.fillStyle = 'rgba(255,255,255,0.35)'; cb.beginPath(); cb.ellipse(-p.r * 0.1, -p.r * 0.3, p.r * 0.1, p.r * 0.4, 0, 0, 7); cb.fill(); cb.restore(); });
    },
    finish: function (t) { if (!mom) mom = {t0: t}; }
  };
};
UIC.sunflowers = {L: ['#4E7A2E', '#33531C', 'rgba(255,253,244,0.86)', '#2A2410', '#6A6248', '#C2561A', '#C2561A', '#E08A1A', '#FFFFFF'], D: ['#2F2F5E', '#1B1E40', 'rgba(24,26,56,0.80)', '#F6F2E4', '#BAB4CC', '#F6C84A', '#F6C84A', '#FFE08A', '#1E1A0A']};
UIC.mushrooms ={L: ['#6E5A3E', '#4A3C28', 'rgba(255,253,246,0.86)', '#2A2418', '#6E6450', '#B8432F', '#B8432F', '#D2643C', '#FFFFFF'], D: ['#22304A', '#121A2E', 'rgba(18,24,44,0.80)', '#ECF4FA', '#A6B6CC', '#6FE0EC', '#6FE0EC', '#9CC4FF', '#0E1A2A']};

// ---------- Cloud Kingdom: the cloud sea rolls, the islands bob, waterfalls mist into the clouds, paper kites drift on the wind.
// Night: moonlight on the clouds and the little windows glow. Moment: a rainbow bridge builds itself plank by plank between two islands, and a kite flies across it.
ENGINES.cloudkingdom = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = ph ? 0.65 : 1, K = n2_islandCols(dk), sea = A.sea, i;
  var ORDER = ['rock', 'dark', 'strata', 'grass', 'grassL', 'trunk', 'tree', 'treeD', 'wall', 'chim', 'roof', 'door', 'win', 'fls'];
  var isl = A.isl.map(function (P, i) { var b = P.box; return {P: P, ph: i * 2.1 + 0.5, amp: (ph ? 3 : 5) + i * 1.2, bob: 0, img: n2_sprite(b[2], b[3], 2, function (o) { o.translate(-b[0], -b[1]); ORDER.forEach(function (k) { if (P[k]) { o.fillStyle = K[k]; o.fill(new Path2D(P[k])); } });
    var hl = o.createLinearGradient(b[0], 0, b[0] + b[2], 0); hl.addColorStop(0, 'rgba(255,255,255,0.18)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)'); o.fillStyle = hl; o.fill(new Path2D(P.rock)); })}; });
  var band = [], x; for (x = -240; x < W + 240; x += ph ? 60 : 90) band.push({x: x, y: sea + (Math.random() - 0.3) * 18, r: (ph ? 30 : 46) + Math.random() * (ph ? 18 : 26)});
  var BW = Math.ceil((W + 480) / (ph ? 60 : 90)) * (ph ? 60 : 90);
  var sunG = n2_rg(dk ? 'rgba(255,240,210,0.45)' : 'rgba(255,248,220,0.85)', [0.3, dk ? 0.18 : 0.4]), mistG = n2_rg(dk ? 'rgba(200,200,255,0.5)' : 'rgba(255,255,255,0.85)', [0.4, 0.5]), winG = n2_rg('rgba(255,210,130,0.7)', [0.3, 0.3]), sparkG = n2_rg('rgba(255,255,255,0.9)', [0.2, 0.4]);
  var RB = dk ? ['#FF9AB0', '#FFC08A', '#FFE69A', '#A8F0A0', '#9AD8FF', '#A8B0FF', '#D8B0FF'] : ['#FF6F7F', '#FFA552', '#FFD84A', '#6FCF6A', '#5AB8F0', '#6F82E8', '#B07AE8'];
  var kites = [{i: 0, dx: -130, dy: -190, cols: ['#FF8FA8', '#FFD86B', '#8FD8FF', '#FFB36B'], ph: 0}, {i: 1, dx: 110, dy: -150, cols: ['#9BE07A', '#FFFFFF', '#B9A0F0', '#FFE07A'], ph: 2}];
  var birds = dk ? [] : [{x: -60, y: H * 0.22, sp: 22}], mom = null, trail = [];
  function anchor(k) { var I = isl[k.i], P = I.P; return P.wins.length ? [P.wins[0][0], P.wins[0][1] - 14 * S + I.bob] : [P.cx + P.w * 0.05, P.ty - P.w * 0.2 + I.bob]; }
  function kite(c, x, y, s, t, cols, ph2, happy, tail) {
    var rot = Math.sin(t * 0.9 + ph2) * 0.18; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    if (tail) { c.strokeStyle = 'rgba(80,70,110,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 22); for (var k = 1; k <= 10; k++) c.lineTo(Math.sin(t * 3 + k * 0.7 + ph2) * 6, 22 + k * 7); c.stroke(); for (k = 1; k <= 3; k++) { var bx = Math.sin(t * 3 + k * 2.3 + ph2) * 6, by = 22 + k * 20; c.fillStyle = cols[k % 4]; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - 5, by - 3); c.lineTo(bx - 5, by + 3); c.lineTo(bx + 5, by - 3); c.lineTo(bx + 5, by + 3); c.closePath(); c.fill(); } }
    var q = [[0, -24], [17, -2], [0, 22], [-17, -2]];
    for (var j = 0; j < 4; j++) { c.fillStyle = cols[j]; c.beginPath(); c.moveTo(0, -2); c.lineTo(q[j][0], q[j][1]); c.lineTo(q[(j + 1) % 4][0], q[(j + 1) % 4][1]); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(60,50,90,0.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -24); c.lineTo(0, 22); c.moveTo(-17, -2); c.lineTo(17, -2); c.stroke();
    n2_face(c, 0, 0, 13, happy ? 2 : 0, t, ph2 + 3); c.restore(); }
  function arc(u) { var L = isl[1], R = isl[0], p0 = [L.P.cx + L.P.w * 0.44, L.P.ty + L.bob - 3], p1 = [R.P.cx - R.P.w * 0.44, R.P.ty + R.bob - 3], cx = (p0[0] + p1[0]) / 2, cy = Math.min(p0[1], p1[1]) - Math.abs(p1[0] - p0[0]) * 0.26, a = 1 - u;
    return [a * a * p0[0] + 2 * a * u * cx + u * u * p1[0], a * a * p0[1] + 2 * a * u * cy + u * u * p1[1], 2 * a * (cx - p0[0]) + 2 * u * (p1[0] - cx), 2 * a * (cy - p0[1]) + 2 * u * (p1[1] - cy)]; }
  return {
    step: function (dt, t, f) {
      isl.forEach(function (I) { I.bob = Math.sin(t * f.s * 0.45 + I.ph) * I.amp; });
      birds.forEach(function (b) { b.x += b.sp * dt * f.s; if (b.x > W + 80) { b.x = -80; b.y = H * (0.12 + Math.random() * 0.2); } });
      trail.forEach(function (p) { p.life -= dt; p.y += 10 * dt; }); trail = trail.filter(function (p) { return p.life > 0; });
      if (mom && t - mom.t0 > 10) mom = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = mom ? t - mom.t0 : -1;
      // sun or moon, twinkling stars
      if (!dk) { var sx = W * (ph ? 0.3 : 0.32), sy = H * (ph ? 0.12 : 0.17); n2_dot(ca, sunG, sx, sy, 150 * S, 1); var g = ca.createRadialGradient(sx - 8, sy - 8, 3, sx, sy, 34 * S); g.addColorStop(0, '#FFFDF0'); g.addColorStop(1, '#FFE6A8'); ca.fillStyle = g; ca.beginPath(); ca.arc(sx, sy, 32 * S, 0, 7); ca.fill(); n2_face(ca, sx, sy + 2, 28 * S, 2, tt, 1, '#8A6A3A'); }
      else { var mx = W * (ph ? 0.32 : 0.34), my = H * (ph ? 0.12 : 0.16), mr = 30 * S; n2_dot(ca, sunG, mx, my, mr * 4, 1); var mg = ca.createRadialGradient(mx - 8, my - 8, 3, mx, my, mr); mg.addColorStop(0, '#FFFBEA'); mg.addColorStop(1, '#F2E2C2'); ca.fillStyle = mg; ca.beginPath(); ca.arc(mx, my, mr, 0, 7); ca.fill(); ca.fillStyle = 'rgba(200,180,200,0.4)'; ca.beginPath(); ca.arc(mx + mr * 0.4, my - mr * 0.35, mr * 0.14, 0, 7); ca.arc(mx - mr * 0.5, my + mr * 0.45, mr * 0.1, 0, 7); ca.fill(); n2_face(ca, mx, my + 3, mr * 0.9, 1, tt, 2, '#6A5A7A');
        ca.fillStyle = '#FFF4DA'; for (i = 0; i < (ph ? 10 : 20); i++) { var a = 0.5 + 0.5 * Math.sin(tt * (0.7 + hash(i) * 1.4) + i * 2); ca.globalAlpha = 0.2 + 0.8 * a; n2_star(ca, hash(i * 5.3) * W, hash(i * 9.1) * (sea - H * 0.15), 1.5 + a * 3); } ca.globalAlpha = 1; }
      birds.forEach(function (b) { ca.strokeStyle = 'rgba(70,80,120,0.6)'; ca.lineWidth = 1.6; ca.lineCap = 'round'; ca.beginPath(); for (var k = 0; k < 3; k++) { var x = b.x - k * 22 * S, y = b.y + k * 8 * S + Math.sin(tt * 0.8 + k) * 3, fl = Math.sin(tt * 7 + k) * 4 * S; ca.moveTo(x - 7 * S, y - fl); ca.quadraticCurveTo(x - 3 * S, y - 3 * S, x, y); ca.quadraticCurveTo(x + 3 * S, y - 3 * S, x + 7 * S, y - fl); } ca.stroke(); });
      // the rolling cloud sea behind the front clouds
      var off = (tt * 7) % BW;
      ca.fillStyle = dk ? '#4E4688' : '#CDD2F0'; ca.beginPath(); band.forEach(function (p) { var x = ((p.x + off + 240) % BW) - 240; ca.moveTo(x + p.r, p.y + 8); ca.arc(x, p.y + 8, p.r, 0, 7); }); ca.fill();
      ca.fillStyle = dk ? '#6A5EA8' : '#F2F1FC'; ca.beginPath(); band.forEach(function (p) { var x = ((p.x + off + 240) % BW) - 240; ca.moveTo(x + p.r * 0.9, p.y); ca.arc(x, p.y, p.r * 0.9, 0, 7); }); ca.fill();
      // waterfalls, then the islands
      isl.forEach(function (I, k) { var P = I.P; if (!P.wf) return; var x0 = P.wf[0], y0 = P.wf[1] + I.bob, ww = (ph ? 7 : 11) * P.w / 240 + 3, dir = P.wf[0] > P.cx ? 1 : -1, y1 = sea + 30;
        var g = ca.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, dk ? 'rgba(170,200,255,0.85)' : 'rgba(150,215,255,0.95)'); g.addColorStop(0.7, dk ? 'rgba(170,200,255,0.5)' : 'rgba(190,230,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ca.fillStyle = g; ca.beginPath(); ca.moveTo(x0 - ww / 2, y0); ca.quadraticCurveTo(x0 + dir * ww * 1.4, y0 - 2, x0 + dir * ww * 1.3 + ww / 2, y0 + ww * 1.5); ca.lineTo(x0 + dir * ww * 1.3 + ww * 0.7, y1); ca.lineTo(x0 + dir * ww * 1.3 - ww * 0.7, y1); ca.lineTo(x0 + dir * ww * 1.3 - ww / 2, y0 + ww * 1.5); ca.closePath(); ca.fill();
        ca.strokeStyle = 'rgba(255,255,255,0.85)'; ca.lineWidth = 1.4; ca.beginPath(); var L = y1 - y0 - ww * 1.5, xb = x0 + dir * ww * 1.3; for (var j = 0; j < 4; j++) { var lx = xb + (j - 1.5) * ww * 0.28; for (var m = 0; m < 3; m++) { var yy = y0 + ww * 1.5 + ((tt * 90 + j * 23 + m * L / 3) % L); ca.moveTo(lx, yy); ca.lineTo(lx, Math.min(y1, yy + 14)); } } ca.stroke();
        for (j = 0; j < 4; j++) { var mph = tt * 1.3 + j * 1.7; n2_dot(ca, mistG, xb + Math.sin(mph) * ww * 2, sea + 4 - j * 3, (ph ? 16 : 26) * (0.8 + 0.3 * Math.sin(mph * 1.3)), 0.9); } });
      isl.forEach(function (I) { var b = I.P.box; ca.drawImage(I.img, b[0], b[1] + I.bob, b[2], b[3]); });
      // windows glow at night
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; isl.forEach(function (I, k) { I.P.wins.forEach(function (w, n) { n2_dot(cb, winG, w[0], w[1] + I.bob, w[2] * 4, 0.75 + 0.25 * flick(tt * 0.4, n + k * 3)); }); }); cb.restore(); }
      // kites on their strings
      kites.forEach(function (k) { var a = anchor(k), kx = a[0] + k.dx * S + Math.sin(tt * 0.5 + k.ph) * 22 * S, ky = a[1] + k.dy * S + Math.sin(tt * 0.8 + k.ph) * 12 * S;
        cb.strokeStyle = dk ? 'rgba(220,220,255,0.5)' : 'rgba(90,80,120,0.5)'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(a[0], a[1]); cb.quadraticCurveTo((a[0] + kx) / 2 + 10, (a[1] + ky) / 2 + 30 * S, kx, ky + 20 * S); cb.stroke();
        kite(cb, kx, ky, S * 0.95, tt, k.cols, k.ph, !!mom, true); });
      // the rainbow bridge, built plank by plank, and the kite that flies over it
      if (mom) { var N = 28, al = n2_env(T, 0, 0.01, 8, 9.5), bw = (ph ? 2.8 : 4.2);
        cb.save(); cb.globalAlpha = al; if (dk) cb.globalCompositeOperation = 'lighter';
        for (var j = 0; j < N; j++) { var tj = T - (0.15 + j * 0.085); if (tj < 0) break; var pop = Math.min(1, tj / 0.25), u0 = j / N, u1 = (j + 1) / N - 0.004, A0 = arc(u0), A1 = arc(u1);
          [A0, A1].forEach(function (q) { var l = Math.hypot(q[2], q[3]) || 1; q.nx = -q[3] / l; q.ny = q[2] / l; });
          for (var bnd = 0; bnd < 7; bnd++) { var o0 = (bnd - 3.5) * bw * pop, o1 = o0 + bw * pop; cb.fillStyle = RB[bnd]; cb.beginPath(); cb.moveTo(A0[0] + A0.nx * o0, A0[1] + A0.ny * o0); cb.lineTo(A1[0] + A1.nx * o0, A1[1] + A1.ny * o0); cb.lineTo(A1[0] + A1.nx * o1, A1[1] + A1.ny * o1); cb.lineTo(A0[0] + A0.nx * o1, A0[1] + A0.ny * o1); cb.closePath(); cb.fill(); }
          if (tj < 0.5) n2_dot(cb, sparkG, A1[0], A1[1], 18 * S * (1 - tj), 1 - tj * 2); }
        cb.restore();
        if (T > 2.7 && T < 6.6) { var u = n2_ease((T - 2.7) / 3.6), p = arc(u); trail.push({x: p[0], y: p[1] - 34 * S, life: 1.2}); kite(cb, p[0], p[1] - 34 * S, S * 1.15, tt * 2, ['#FF8FA8', '#FFD86B', '#8FD8FF', '#B9A0F0'], 1, true, false); }
        cb.fillStyle = dk ? '#FFF4C2' : '#FFFFFF'; trail.forEach(function (q, n) { if (n % 2) return; cb.globalAlpha = q.life * 0.8; n2_star(cb, q.x + Math.sin(n) * 6, q.y + 10, 3 + q.life * 2); }); cb.globalAlpha = 1; }
    },
    finish: function (t) { if (!mom) { mom = {t0: t}; trail = []; } }
  };
};
UIC.cloudkingdom = {L: ['#5B78C8', '#3E58A0', 'rgba(255,255,255,0.86)', '#1E2A48', '#5A6888', '#4A62D0', '#4A62D0', '#8A6AE0', '#FFFFFF'], D: ['#3A3474', '#1C1F4A', 'rgba(28,28,70,0.80)', '#F2EEFA', '#B8B0D8', '#FFB8D8', '#FFB8D8', '#C8B0FF', '#2A1A3A']};

// ---------- Night Train: hills, trees, poles and towns slide past the window in layers, the carriage rocks, the lamp sways and the tea ripples.
// Night: town lights stream by and the moon keeps pace. Moment: a tunnel dims everything, then the train runs out onto a long bridge over the sea at sunrise (moonrise).
ENGINES.nighttrain = function (A, v, dk) {
  var W = v.bw, H = v.bh, G = A.G, ph = G.ph, S = ph ? 0.65 : 1, ww = G.x1 - G.x0, wh = G.y1 - G.y0, X = 0, mom = null;
  var win = new Path2D(rrect(G.x0, G.y0, ww, wh, G.r));
  var LC = dk ? ['#2C3762', '#1E2848', '#16203A', '#101830'] : ['#A9C3DC', '#94C08A', '#72A866', '#4E8A4E'];
  var lampG = n2_rg(dk ? 'rgba(255,200,120,0.55)' : 'rgba(255,220,160,0.35)', [0.3, dk ? 0.3 : 0.18]), townG = n2_rg('rgba(255,200,120,0.9)', [0.25, 0.4]), sunG = n2_rg(dk ? 'rgba(255,240,200,0.5)' : 'rgba(255,230,170,0.85)', [0.3, 0.35]), tunG = n2_rg('rgba(255,170,80,0.9)', [0.2, 0.4]);
  // the props on the table, painted once
  var tw = (G.tbl[1] - G.tbl[0]), props = n2_sprite(tw, 90 * S, 2, function (o) { o.translate(0, 90 * S); o.scale(S, S); var bx = 20;
    // books
    [['#5A7AB8', 60], ['#E0A040', 52], ['#B85A6A', 56]].forEach(function (b, k) { o.fillStyle = b[0]; o.fill(new Path2D(rrect(bx - 4 + k * 3, -4 - (k + 1) * 11, b[1], 10, 2))); o.fillStyle = 'rgba(255,255,255,0.7)'; o.fillRect(bx + 2 + k * 3, -4 - (k + 1) * 11 + 3, b[1] - 12, 1.6); });
    // teapot with a face
    var tx = tw / S - 70; o.fillStyle = dk ? '#D8D0EC' : '#F6F1EA'; o.beginPath(); o.ellipse(tx, -26, 26, 22, 0, 0, 7); o.fill(); o.beginPath(); o.moveTo(tx - 22, -30); o.quadraticCurveTo(tx - 44, -36, tx - 46, -50); o.lineTo(tx - 40, -50); o.quadraticCurveTo(tx - 38, -38, tx - 18, -20); o.fill();
    o.strokeStyle = dk ? '#D8D0EC' : '#F6F1EA'; o.lineWidth = 5; o.beginPath(); o.arc(tx + 25, -26, 11, -1.2, 1.2); o.stroke(); o.fillStyle = '#7FB8D8'; o.beginPath(); o.ellipse(tx, -46, 13, 5, 0, 0, 7); o.fill(); o.beginPath(); o.arc(tx, -51, 4, 0, 7); o.fill();
    o.fillStyle = '#7FB8D8'; o.fillRect(tx - 26, -24, 52, 4); n2_face(o, tx + 2, -30, 16, 1, 0, 0);
    o.fillStyle = 'rgba(0,0,0,0.12)'; o.beginPath(); o.ellipse(tx, -3, 26, 3, 0, 0, 7); o.fill();
    // a little vase with a flower
    var vx = tw / S * 0.5 + 10; o.fillStyle = '#9AD0C8'; o.beginPath(); o.moveTo(vx - 7, -2); o.quadraticCurveTo(vx - 12, -18, vx - 4, -24); o.lineTo(vx + 4, -24); o.quadraticCurveTo(vx + 12, -18, vx + 7, -2); o.fill();
    o.strokeStyle = '#5E9A4E'; o.lineWidth = 2; o.beginPath(); o.moveTo(vx, -24); o.quadraticCurveTo(vx + 4, -40, vx - 2, -52); o.stroke(); o.fillStyle = '#FF9AB0'; for (var k = 0; k < 5; k++) { o.beginPath(); o.arc(vx - 2 + Math.cos(k * 1.256) * 4.5, -54 + Math.sin(k * 1.256) * 4.5, 3.6, 0, 7); o.fill(); } o.fillStyle = '#FFE08A'; o.beginPath(); o.arc(vx - 2, -54, 2.8, 0, 7); o.fill(); });
  // a pillow and a folded blanket on the bench; a suitcase on the rack, a framed map and a scarf on the hook (desktop)
  var decor = n2_sprite(W, H, 2, function (o) {
    var by = G.bench, px = W * (ph ? 0.12 : 0.1), g = o.createLinearGradient(0, by - 30 * S, 0, by + 30 * S); g.addColorStop(0, dk ? '#E8DCF0' : '#FFF8EE'); g.addColorStop(1, dk ? '#A898C0' : '#E8D8C4');
    o.fillStyle = g; o.beginPath(); o.moveTo(px - 50 * S, by + 26 * S); o.quadraticCurveTo(px - 60 * S, by - 8 * S, px - 40 * S, by - 22 * S); o.quadraticCurveTo(px, by - 30 * S, px + 40 * S, by - 22 * S); o.quadraticCurveTo(px + 60 * S, by - 8 * S, px + 50 * S, by + 26 * S); o.quadraticCurveTo(px, by + 34 * S, px - 50 * S, by + 26 * S); o.fill();
    o.strokeStyle = dk ? 'rgba(120,100,150,0.5)' : 'rgba(180,150,120,0.5)'; o.lineWidth = 1.5; o.beginPath(); o.moveTo(px - 30 * S, by - 4 * S); o.quadraticCurveTo(px, by + 6 * S, px + 30 * S, by - 4 * S); o.stroke();
    var bx2 = W * (ph ? 0.4 : 0.3), bw = 110 * S; o.fillStyle = dk ? '#7A3A58' : '#C85A5A'; o.fillRect(bx2, by - 8 * S, bw, 34 * S); o.fillStyle = dk ? '#9A4A70' : '#E07A6A'; o.fillRect(bx2, by - 8 * S, bw, 12 * S);
    o.strokeStyle = dk ? 'rgba(255,220,180,0.5)' : 'rgba(255,240,210,0.8)'; o.lineWidth = 2 * S; o.beginPath(); for (var k = 1; k < 5; k++) { o.moveTo(bx2 + k * bw / 5, by - 8 * S); o.lineTo(bx2 + k * bw / 5, by + 26 * S); } o.moveTo(bx2, by + 12 * S); o.lineTo(bx2 + bw, by + 12 * S); o.stroke();
    o.fillStyle = 'rgba(255,255,255,0.18)'; o.fillRect(-10, by + 2, W + 20, 6 * S);
    if (ph) return;
    var sx = G.x1 + G.fr + 70, sw = 120; o.fillStyle = dk ? '#7A5A48' : '#B87A44'; o.fillRect(sx, H * 0.06 - 46, sw, 46); o.fillStyle = dk ? '#5A3E30' : '#8A5A30'; o.fillRect(sx + 24, H * 0.06 - 46, 8, 46); o.fillRect(sx + sw - 32, H * 0.06 - 46, 8, 46);
    o.fillStyle = '#8FD8FF'; o.beginPath(); o.arc(sx + 60, H * 0.06 - 24, 9, 0, 7); o.fill(); o.fillStyle = '#FFD86B'; o.fillRect(sx + 76, H * 0.06 - 38, 16, 12); o.fillStyle = '#FF8FA8'; o.beginPath(); o.moveTo(sx + 38, H * 0.06 - 6); o.lineTo(sx + 50, H * 0.06 - 18); o.lineTo(sx + 52, H * 0.06 - 4); o.fill();
    var mx = G.x1 + G.fr + 64, my = G.y0 + 230, mw = W - mx - 36, mh = 92; o.fillStyle = dk ? '#2A1C2C' : '#7A4C30'; o.fillRect(mx - 6, my - 6, mw + 12, mh + 12); o.fillStyle = dk ? '#C8BCA8' : '#F6EBD2'; o.fillRect(mx, my, mw, mh);
    o.fillStyle = dk ? '#7A9A8A' : '#A8D49A'; o.beginPath(); o.ellipse(mx + mw * 0.3, my + mh * 0.6, mw * 0.25, mh * 0.25, 0.3, 0, 7); o.ellipse(mx + mw * 0.72, my + mh * 0.35, mw * 0.2, mh * 0.2, -0.3, 0, 7); o.fill(); o.fillStyle = dk ? '#6A8AB0' : '#9AD0F0'; o.fillRect(mx + mw * 0.55, my + mh * 0.62, mw * 0.4, mh * 0.3);
    o.strokeStyle = '#B8484C'; o.lineWidth = 2; o.setLineDash([4, 4]); o.beginPath(); o.moveTo(mx + 10, my + mh - 12); o.quadraticCurveTo(mx + mw * 0.5, my + 10, mx + mw - 12, my + 18); o.stroke(); o.setLineDash([]);
    o.fillStyle = '#B8484C'; o.beginPath(); o.arc(mx + 10, my + mh - 12, 3.5, 0, 7); o.arc(mx + mw - 12, my + 18, 3.5, 0, 7); o.fill();
    var hx = W - 28, hy = G.y1 - 30; o.fillStyle = dk ? '#C8A050' : '#D9A848'; o.beginPath(); o.arc(hx, hy, 5, 0, 7); o.fill();
    var sc2 = dk ? ['#4A6AA0', '#E8DCF0'] : ['#5A8AC8', '#FFF4E0']; for (k = 0; k < 9; k++) { o.fillStyle = sc2[k % 2]; o.fillRect(hx - 16, hy + 4 + k * 10, 14, 10); o.fillRect(hx + 2, hy + 10 + k * 10, 12, 10); }
    o.fillStyle = sc2[0]; o.beginPath(); o.ellipse(hx - 1, hy + 4, 15, 7, 0, 0, 7); o.fill(); });
  function cup(c, x, y, t, rock) { c.save(); c.translate(x, y); c.scale(S, S);
    c.fillStyle = dk ? '#E6DEF4' : '#FFFFFF'; c.beginPath(); c.moveTo(-17, -24); c.lineTo(17, -24); c.quadraticCurveTo(16, -2, 8, 0); c.lineTo(-8, 0); c.quadraticCurveTo(-16, -2, -17, -24); c.fill(); c.strokeStyle = dk ? '#E6DEF4' : '#FFFFFF'; c.lineWidth = 4; c.beginPath(); c.arc(19, -14, 7, -1.4, 1.4); c.stroke();
    c.fillStyle = '#E8889A'; c.fillRect(-16, -16, 32, 3); c.fillStyle = dk ? '#D8D0EC' : '#F4EEE8'; c.beginPath(); c.ellipse(0, 1, 24, 4, 0, 0, 7); c.fill();
    c.fillStyle = '#B86A3A'; c.beginPath(); c.ellipse(0, -23.5, 15.5, 4, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,230,190,0.75)'; c.lineWidth = 1; for (var k = 0; k < 3; k++) { var ph2 = (t * 0.9 + k / 3) % 1; c.globalAlpha = (1 - ph2) * (0.4 + Math.abs(rock) * 0.5); c.beginPath(); c.ellipse(rock * 3, -23.5, 3 + ph2 * 11, 0.8 + ph2 * 2.8, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
    c.strokeStyle = dk ? 'rgba(255,240,230,0.35)' : 'rgba(255,255,255,0.85)'; c.lineWidth = 2.2; c.lineCap = 'round'; for (k = 0; k < 2; k++) { var u = (t * 0.35 + k * 0.5) % 1; c.globalAlpha = Math.sin(Math.PI * u) * 0.9; c.beginPath(); for (var j = 0; j <= 10; j++) { var yy = -28 - u * 30 - j * 3.2; c.lineTo(Math.sin(j * 0.7 + t * 2 + k * 2) * 4 + (k - 0.5) * 8, yy); } c.stroke(); } c.globalAlpha = 1; c.restore(); }
  function lamp(c, t, sw, glow) { var L = G.lamp; c.save(); c.translate(L[0], L[1]); c.scale(S, S);
    if (ph) { c.strokeStyle = dk ? '#C8A050' : '#B08A3A'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 0); c.stroke(); }
    else { c.fillStyle = dk ? '#C8A050' : '#D9A848'; c.fill(new Path2D(rrect(28, -18, 10, 36, 4))); c.strokeStyle = c.fillStyle; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(33, 0); c.quadraticCurveTo(10, -6, 0, -20); c.stroke(); c.translate(0, -20); }
    c.rotate(sw); c.strokeStyle = dk ? '#C8A050' : '#B08A3A'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 16); c.stroke();
    if (glow > 0) { c.save(); c.globalCompositeOperation = dk ? 'lighter' : 'source-over'; c.fillStyle = dk ? 'rgba(255,200,120,0.12)' : 'rgba(255,230,170,0.18)'; c.beginPath(); c.moveTo(-14, 40); c.lineTo(14, 40); c.lineTo(80, 260); c.lineTo(-80, 260); c.closePath(); c.fill(); c.restore(); n2_dot(c, lampG, 0, 44, 120 * glow, 1); }
    var g = c.createLinearGradient(-26, 0, 26, 0); g.addColorStop(0, dk ? '#E87A6A' : '#E8706A'); g.addColorStop(1, dk ? '#A84A50' : '#B8484C'); c.fillStyle = g; c.beginPath(); c.moveTo(-10, 16); c.lineTo(10, 16); c.lineTo(26, 42); c.quadraticCurveTo(0, 48, -26, 42); c.closePath(); c.fill();
    c.fillStyle = '#FFF2C8'; c.beginPath(); c.ellipse(0, 44, 9, 4, 0, 0, 7); c.fill(); c.fillStyle = '#D9A848'; c.fillRect(-24, 40, 48, 3); c.restore(); }
  function hills(c, k, off, base, amp, col) { c.fillStyle = col; c.beginPath(); c.moveTo(G.x0 - 10, G.y1 + 10); for (var x = G.x0 - 10; x <= G.x1 + 12; x += 8) c.lineTo(x, base + amp * n2_land(k, x + off)); c.lineTo(G.x1 + 12, G.y1 + 10); c.closePath(); c.fill(); }
  function land(c, t, X) {
    var y0 = G.y0, f0 = X * 0.05, f1 = X * 0.18, f2 = X * 0.45, f3 = X * 1.3, i, cell;
    // moon or sun, then clouds
    if (dk) { var mx = G.x0 + ww * 0.72, my = y0 + wh * 0.2, mr = 20 * S; n2_dot(c, sunG, mx, my, mr * 4, 1); c.fillStyle = '#FFF6DA'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill(); n2_face(c, mx, my + 2, mr * 0.9, 1, t, 3, '#7A6A7A'); }
    else { for (i = 0; i < 3; i++) { var cx = G.x0 + ((i * ww * 0.45 - X * 0.03) % (ww + 200) + ww + 200) % (ww + 200) - 100, cy = y0 + wh * (0.14 + i * 0.09); c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(cx, cy, 16 * S, 0, 7); c.arc(cx + 18 * S, cy - 8 * S, 20 * S, 0, 7); c.arc(cx + 40 * S, cy, 15 * S, 0, 7); c.rect(cx, cy, 40 * S, 12 * S); c.fill(); } }
    hills(c, 0, f0, y0 + wh * 0.55, wh * 0.1, LC[0]);
    hills(c, 1, f1, y0 + wh * 0.7, wh * 0.08, LC[1]);
    // houses on the middle hills, windows lit at night
    for (cell = Math.floor((G.x0 + f1) / 170) - 1; cell * 170 < G.x1 + f1 + 170; cell++) { if (hash(cell * 1.7) > 0.45) continue; var hx = cell * 170 + hash(cell) * 80 - f1, hy = y0 + wh * 0.7 + wh * 0.08 * n2_land(1, hx + f1) + 2, s2 = S * 0.9;
      c.fillStyle = dk ? '#3A3A5A' : '#F4E8D8'; c.fillRect(hx - 10 * s2, hy - 12 * s2, 20 * s2, 12 * s2); c.fillStyle = dk ? '#5A3048' : '#D86A5A'; c.beginPath(); c.moveTo(hx - 13 * s2, hy - 11 * s2); c.lineTo(hx, hy - 21 * s2); c.lineTo(hx + 13 * s2, hy - 11 * s2); c.fill();
      if (dk) { n2_dot(c, townG, hx, hy - 6 * s2, 9 * s2, 0.7); c.fillStyle = '#FFD27A'; c.fillRect(hx - 3 * s2, hy - 8 * s2, 6 * s2, 4 * s2); } }
    hills(c, 2, f2, y0 + wh * 0.84, wh * 0.06, LC[2]);
    // trees on the near hills, town lights at night
    for (cell = Math.floor((G.x0 + f2) / 46) - 1; cell * 46 < G.x1 + f2 + 46; cell++) { var hv = hash(cell * 3.3), tx = cell * 46 + hv * 30 - f2, ty = y0 + wh * 0.84 + wh * 0.06 * n2_land(2, tx + f2) + 3, ts = (0.7 + hv * 0.6) * S;
      if (hv < 0.55) { c.fillStyle = LC[3]; c.beginPath(); c.moveTo(tx - 9 * ts, ty); c.lineTo(tx, ty - 30 * ts); c.lineTo(tx + 9 * ts, ty); c.fill(); }
      else if (dk && hv > 0.8) { for (var j = 0; j < 4; j++) n2_dot(c, townG, tx + j * 7 * S, ty - 3 - hash(cell + j) * 6, 5 * S, 0.6 + 0.4 * hash(cell * j + 1)); } }
    // the fast foreground: bushes and telegraph poles with sagging wires
    c.fillStyle = dk ? '#0C1222' : '#3E7A44'; c.beginPath(); c.moveTo(G.x0 - 10, G.y1 + 10); for (var x = G.x0 - 10; x <= G.x1 + 12; x += 10) c.lineTo(x, G.y1 - wh * 0.05 - Math.abs(Math.sin((x + f3) / 37)) * wh * 0.05); c.lineTo(G.x1 + 12, G.y1 + 10); c.fill();
    var gap = 300 * S, p0 = Math.floor((G.x0 + X * 2.2) / gap) - 1, pc = dk ? '#0A0E1A' : '#5A4A40'; c.strokeStyle = pc; c.fillStyle = pc;
    for (var p = p0; p * gap < G.x1 + X * 2.2 + gap; p++) { var px = p * gap - X * 2.2, top = y0 + wh * 0.18; c.fillRect(px - 3 * S, top, 6 * S, wh); c.fillRect(px - 16 * S, top + 6 * S, 32 * S, 4 * S);
      c.lineWidth = 1.2; c.beginPath(); [-12, 12].forEach(function (o) { c.moveTo(px + o * S, top + 6 * S); c.quadraticCurveTo(px + gap / 2, top + 6 * S + wh * 0.12, px + gap + o * S, top + 6 * S); }); c.stroke(); }
  }
  function seaView(c, t, T, X) {
    var hz = G.y0 + wh * 0.56, rise = n2_ease((T - 2) / 6), sx = G.x0 + ww * 0.62, sy = hz + 20 * S - rise * wh * 0.42, sr = 26 * S;
    var g = c.createLinearGradient(0, G.y0, 0, hz); g.addColorStop(0, dk ? '#1E2650' : '#F6C6A8'); g.addColorStop(1, dk ? '#6A5A8A' : '#FFE4B0'); c.fillStyle = g; c.fillRect(G.x0 - 5, G.y0 - 5, ww + 10, hz - G.y0 + 5);
    n2_dot(c, sunG, sx, sy, sr * 5, 1); c.fillStyle = dk ? '#FFF6DA' : '#FFE07A'; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill(); n2_face(c, sx, sy + 2, sr * 0.9, dk ? 1 : 2, t, 4, dk ? '#7A6A7A' : '#9A5A2A');
    var s2 = c.createLinearGradient(0, hz, 0, G.y1); s2.addColorStop(0, dk ? '#3A3A72' : '#7FC0E0'); s2.addColorStop(1, dk ? '#1A2048' : '#3A88C0'); c.fillStyle = s2; c.fillRect(G.x0 - 5, hz, ww + 10, G.y1 - hz + 5);
    c.fillStyle = dk ? 'rgba(255,246,210,0.7)' : 'rgba(255,250,220,0.85)'; for (var k = 0; k < 14; k++) { var yy = hz + 4 + k * k * 1.2 * S, wv = (6 + k * 2.5) * S * (0.6 + 0.4 * Math.sin(t * 2 + k)); c.fillRect(sx - wv + Math.sin(t * 3 + k) * 4, yy, wv * 2, 1.4); }
    c.fillStyle = dk ? 'rgba(160,170,230,0.35)' : 'rgba(255,255,255,0.5)'; for (k = 0; k < 18; k++) { var wx = G.x0 + ((hash(k) * ww - X * 0.2 * (1 + hash(k + 9))) % ww + ww) % ww, wy = hz + 10 + hash(k * 2) * (G.y1 - hz - 20); c.fillRect(wx, wy, 10 * S, 1.2); }
    // a sailboat far away
    var bxp = G.x0 + ((ww * 0.25 - X * 0.02) % ww + ww) % ww; c.fillStyle = dk ? '#C8C0E8' : '#FFFFFF'; c.beginPath(); c.moveTo(bxp, hz - 2); c.lineTo(bxp, hz - 22 * S); c.lineTo(bxp + 12 * S, hz - 2); c.fill(); c.fillStyle = dk ? '#5A4A6A' : '#C86A4A'; c.fillRect(bxp - 6 * S, hz - 2, 18 * S, 3 * S);
    // the bridge: railings and a truss sliding past fast
    var bc = dk ? '#2A2440' : '#C8504A', bt = G.y0 + wh * 0.1, bb = G.y1 - wh * 0.12, gap = 120 * S, o = (X * 2.6) % gap;
    c.fillStyle = bc; c.fillRect(G.x0 - 5, bt - 6 * S, ww + 10, 8 * S); c.fillRect(G.x0 - 5, bb, ww + 10, G.y1 - bb + 5); c.fillRect(G.x0 - 5, bb - 18 * S, ww + 10, 4 * S);
    c.strokeStyle = bc; c.lineWidth = 4 * S; c.beginPath(); for (var x = G.x0 - o - gap; x < G.x1 + gap; x += gap) { c.moveTo(x, bt); c.lineTo(x, bb); c.moveTo(x, bt); c.lineTo(x + gap, bb); } c.stroke();
  }
  return {
    step: function (dt, t, f) { X += dt * 240 * f.s * (mom ? 1.2 : 1); if (mom && t - mom.t0 > 13) mom = null; },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = mom ? t - mom.t0 : -1, rock = Math.sin(tt * 1.4) * 0.6 + Math.sin(tt * 3.1) * 0.25, bob = Math.sin(tt * 9) * 0.5 + rock;
      ca.save(); ca.clip(win); ca.translate(0, bob);
      var seaA = mom ? n2_env(T, 1.85, 2.0, 11, 12.5) : 0;
      if (seaA < 1) land(ca, tt, X);
      if (seaA > 0) { ca.globalAlpha = seaA; seaView(ca, tt, T, X); ca.globalAlpha = 1; }
      if (mom && T < 2.1) { // the tunnel: its mouth sweeps in, then darkness with lamps streaking past
        var cover = T < 0.45 ? n2_ease(T / 0.45) : T > 1.85 ? 1 - n2_ease((T - 1.85) / 0.25) : 1, edge = T < 0.45 ? G.x1 - cover * (ww + 40) : G.x0 - 20;
        ca.fillStyle = '#120E18'; if (T < 0.45) ca.fillRect(edge, G.y0 - 10, G.x1 - edge + 20, wh + 20); else { ca.globalAlpha = cover; ca.fillRect(G.x0 - 10, G.y0 - 10, ww + 20, wh + 20); ca.globalAlpha = 1; }
        if (T < 0.45) { ca.fillStyle = '#5A4E5A'; ca.fillRect(edge - 18 * S, G.y0 - 10, 18 * S, wh + 20); }
        if (T > 0.45 && T < 1.9) for (var k = 0; k < 4; k++) { var lx = G.x1 - (((T - 0.45) * 900 + k * ww / 3) % (ww + 200)) + 100; n2_dot(ca, tunG, lx, G.y0 + wh * 0.3, 30 * S, cover); n2_dot(ca, tunG, lx - 40, G.y0 + wh * 0.3, 14 * S, cover * 0.6); }
      }
      ca.restore();
      // soft reflection of the room on the glass at night
      if (dk) { ca.save(); ca.clip(win); ca.fillStyle = 'rgba(255,200,140,0.05)'; ca.fillRect(G.x0, G.y0, ww, wh); ca.restore(); }
      // inside: table props, tea, lamp, curtain tassels
      var dim = mom ? n2_env(T, 0.3, 0.5, 1.8, 2.2) : 0;
      if (!this.hosted) cb.drawImage(decor, 0, 0, W, H); cb.drawImage(props, G.tbl[0], G.ty - 90 * S, G.tbl[1] - G.tbl[0], 90 * S);
      cup(cb, G.cup[0], G.ty - 2, tt, rock);
      [-1, 1].forEach(function (sd, k) { var ex = sd < 0 ? G.x0 - G.fr - 10 : G.x1 + G.fr + 10, cw = ph ? 34 : 64, x = ex - sd * cw * 0.32, y = G.y0 + wh * 0.62 + 5 * S, sw = Math.sin(tt * 1.4 + k) * 0.12 + rock * 0.05;
        cb.save(); cb.translate(x, y); cb.rotate(sw); cb.strokeStyle = dk ? '#C8A050' : '#D9A848'; cb.lineWidth = 2 * S; cb.beginPath(); cb.moveTo(0, 0); cb.lineTo(0, 16 * S); cb.stroke(); cb.fillStyle = dk ? '#C8A050' : '#E0B050'; cb.beginPath(); cb.arc(0, 18 * S, 4 * S, 0, 7); cb.fill(); cb.beginPath(); cb.moveTo(-4 * S, 20 * S); cb.lineTo(4 * S, 20 * S); cb.lineTo(6 * S, 34 * S); cb.lineTo(-6 * S, 34 * S); cb.fill(); cb.restore(); });
      if (dim > 0) { cb.fillStyle = 'rgba(8,6,16,' + (0.62 * dim) + ')'; cb.fillRect(-10, -10, W + 20, H + 20); }
      lamp(cb, tt, Math.sin(tt * 1.4) * 0.07 + rock * 0.04, (dk ? 1 : 0.55) + dim * 0.6);
    },
    finish: function (t) { if (!mom) mom = {t0: t}; },
    stat: decor, hosted: false
  };
};
UIC.nighttrain = {L: ['#7A4C30', '#55331F', 'rgba(255,252,246,0.86)', '#2E2018', '#6E5E50', '#B8484C', '#B8484C', '#D06A4A', '#FFFFFF'], D: ['#3A2C46', '#1E1628', 'rgba(30,24,44,0.80)', '#F4EEF8', '#BDB0CC', '#FFC27A', '#FFC27A', '#FFD9A0', '#2A1A0A']};

// ---------- Ramen Shop: steam rises from the pots and bowls, the noren flutter, the broth simmers, rain runs down the window.
// Night: the sign outside hums and glows on the wet street. Moment: the chef flicks a strainer of noodles into a bowl, tops it and slides it down the counter to you.
// a ramen bowl standing on 0,0 with radius r; top: 0..5 toppings shown (chashu, egg, nori, naruto, onions)
function n2_bowl(c, r, dk, top, t, happy) {
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, 1, r * 0.75, r * 0.12, 0, 0, 7); c.fill();
  if (top > 2) { c.save(); c.translate(r * 0.38, -r * 0.62); c.rotate(0.12); c.fillStyle = '#2E4A34'; c.fillRect(-r * 0.16, -r * 0.42, r * 0.32, r * 0.5); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(-r * 0.1, -r * 0.38, r * 0.04, r * 0.4); c.restore(); }
  var g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, dk ? '#D8CCD8' : '#FFFFFF'); g.addColorStop(1, dk ? '#A898B0' : '#E6DCD4'); c.fillStyle = g;
  c.beginPath(); c.moveTo(-r, -r * 0.58); c.bezierCurveTo(-r * 0.95, -r * 0.05, -r * 0.5, -r * 0.02, -r * 0.34, 0); c.lineTo(r * 0.34, 0); c.bezierCurveTo(r * 0.5, -r * 0.02, r * 0.95, -r * 0.05, r, -r * 0.58); c.closePath(); c.fill();
  c.fillStyle = '#D2464E'; c.beginPath(); c.moveTo(-r * 0.97, -r * 0.42); c.bezierCurveTo(-r * 0.6, -r * 0.3, r * 0.6, -r * 0.3, r * 0.97, -r * 0.42); c.lineTo(r * 0.9, -r * 0.3); c.bezierCurveTo(r * 0.6, -r * 0.18, -r * 0.6, -r * 0.18, -r * 0.9, -r * 0.3); c.fill();
  c.fillStyle = dk ? '#C8A060' : '#F2C870'; c.beginPath(); c.ellipse(0, -r * 0.58, r * 0.96, r * 0.24, 0, 0, 7); c.fill();
  c.fillStyle = dk ? '#E8B860' : '#F6D888'; c.beginPath(); c.ellipse(0, -r * 0.6, r * 0.86, r * 0.19, 0, 0, 7); c.fill();
  c.strokeStyle = dk ? '#F0D890' : '#FFEFB0'; c.lineWidth = Math.max(1, r * 0.05); c.lineCap = 'round'; c.beginPath(); for (var k = 0; k < 5; k++) { var y = -r * 0.66 + k * r * 0.045; c.moveTo(-r * 0.7 + k * 4, y); for (var j = 1; j <= 8; j++) c.lineTo(-r * 0.7 + k * 4 + j * r * 0.16, y + Math.sin(j * 1.7 + k) * r * 0.03); } c.stroke();
  if (top > 0) { c.fillStyle = '#C8806A'; c.beginPath(); c.ellipse(-r * 0.45, -r * 0.64, r * 0.24, r * 0.12, -0.2, 0, 7); c.fill(); c.strokeStyle = '#F2D2C0'; c.lineWidth = r * 0.03; c.beginPath(); c.ellipse(-r * 0.45, -r * 0.64, r * 0.16, r * 0.07, -0.2, 0, 7); c.stroke(); }
  if (top > 1) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(-r * 0.05, -r * 0.7, r * 0.2, r * 0.13, 0, 0, 7); c.fill(); c.fillStyle = '#F6A23A'; c.beginPath(); c.ellipse(-r * 0.05, -r * 0.7, r * 0.11, r * 0.075, 0, 0, 7); c.fill(); n2_face(c, -r * 0.05, -r * 0.71, r * 0.12, happy ? 2 : 0, t || 0, 5); }
  if (top > 3) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(r * 0.42, -r * 0.6, r * 0.2, r * 0.11, 0.1, 0, 7); c.fill(); c.strokeStyle = '#FF7FA0'; c.lineWidth = r * 0.035; c.beginPath(); for (k = 0; k <= 20; k++) { var a = k / 20 * 9, rr = k / 20 * r * 0.15; c.lineTo(r * 0.42 + Math.cos(a) * rr, -r * 0.6 + Math.sin(a) * rr * 0.55); } c.stroke(); }
  if (top > 4) { c.fillStyle = '#7ACB5A'; for (k = 0; k < 9; k++) { c.beginPath(); c.arc(-r * 0.3 + hash(k) * r * 0.55, -r * 0.55 - hash(k + 3) * r * 0.12, r * 0.035, 0, 7); c.fill(); } }
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(-r * 0.6, -r * 0.3, r * 0.08, r * 0.15, 0.4, 0, 7); c.fill();
}
ENGINES.ramen = function (A, v, dk) {
  var W = v.bw, H = v.bh, G = A.G, ph = G.ph, S = G.S, i, mom = null;
  var winP = new Path2D(rect(G.wx0, G.wy0, G.wx1 - G.wx0, G.wy1 - G.wy0)), ww = G.wx1 - G.wx0, wh = G.wy1 - G.wy0;
  var neonG = n2_rg('rgba(255,90,110,0.7)', [0.3, 0.3]), lanG = n2_rg('rgba(255,150,90,0.6)', [0.3, 0.25]), steamG = n2_rg(dk ? 'rgba(255,240,250,0.35)' : 'rgba(255,255,255,0.75)', [0.4, 0.4]), sparkG = n2_rg('rgba(255,240,180,0.9)', [0.2, 0.4]), fireG = n2_rg('rgba(90,150,255,0.8)', [0.3, 0.4]);
  var beads = [], slides = [], rain = [];
  for (i = 0; i < (ph ? 22 : 40); i++) beads.push({x: G.wx0 + Math.random() * ww, y: G.wy0 + Math.random() * wh, r: 1 + Math.random() * 2.2});
  for (i = 0; i < (ph ? 30 : 60); i++) rain.push({x: Math.random(), y: Math.random(), l: 0.04 + Math.random() * 0.05, s: 0.8 + Math.random() * 0.6});
  var steam = []; function puff(x, y, s) { steam.push({x: x, y: y, s: s, age: 0, life: 2.5 + Math.random() * 1.5, vx: (Math.random() - 0.5) * 8, ph: Math.random() * 6}); }
  var cx = G.chef[0], hy = G.chef[1], cs = S * 1.0, bx = cx + 125 * S, bTop = G.ct - 34 * S, P = G.pot;
  var nekoP = G.neko, bowlP = G.bowl, cad = G.caddy;
  var props = n2_sprite(120, 80, 2, function (o) { o.translate(60, 78); // condiment caddy and chopstick box
    o.fillStyle = '#7A4A2C'; o.fillRect(-56, -26, 54, 26); o.fillStyle = '#5A3420'; o.fillRect(-56, -30, 54, 6);
    [['#C83A2A', -48], ['#3A2A1A', -34], ['#F2E0B0', -20]].forEach(function (q) { o.fillStyle = q[0]; o.beginPath(); o.ellipse(q[1] + 5, -40, 6, 14, 0, 0, 7); o.fill(); o.fillStyle = '#E8E0D0'; o.fillRect(q[1], -58, 10, 6); });
    o.fillStyle = '#C8904A'; o.fillRect(8, -36, 40, 36); o.fillStyle = '#E8C48A'; for (var k = 0; k < 7; k++) o.fillRect(11 + k * 5.2, -52 - (k % 2) * 3, 2.6, 18); o.fillStyle = '#A06A30'; o.fillRect(8, -36, 40, 4); });
  function neko(c, x, y, s, t, J) { c.save(); c.translate(x, y); c.scale(s, s); var w = '#FFFDF8';
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(0, 0, 22, 4, 0, 0, 7); c.fill();
    c.fillStyle = w; c.beginPath(); c.ellipse(0, -18, 18, 19, 0, 0, 7); c.fill(); c.fillStyle = '#F2C24A'; c.beginPath(); c.ellipse(0, -10, 8, 8, 0, 0, 7); c.fill(); c.fillStyle = '#D2464E'; c.fillRect(-12, -27, 24, 4);
    var wave = Math.sin(t * (J ? 9 : 3.2)) * 0.45; c.save(); c.translate(12, -32); c.rotate(-0.4 + wave); c.fillStyle = w; c.beginPath(); c.ellipse(0, -8, 6, 10, 0, 0, 7); c.fill(); c.fillStyle = '#FFB3C6'; c.beginPath(); c.arc(0, -15, 2.4, 0, 7); c.fill(); c.restore();
    c.fillStyle = w; c.beginPath(); c.ellipse(0, -46, 17, 14, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-15, -50); c.lineTo(-12, -64); c.lineTo(-4, -56); c.moveTo(15, -50); c.lineTo(12, -64); c.lineTo(4, -56); c.fill();
    c.fillStyle = '#F2A23A'; c.beginPath(); c.ellipse(9, -54, 6, 5, 0.4, 0, 7); c.fill(); c.fillStyle = '#FFB3C6'; c.beginPath(); c.moveTo(-12, -58); c.lineTo(-11, -62); c.lineTo(-7, -57); c.fill();
    n2_face(c, 0, -45, 15, J ? 2 : 1, t, 7); c.restore(); }
  function lantern(c, x, y, s, t, k) { var sw = Math.sin(t * 1.1 + k * 2) * 0.06; c.save(); c.translate(x, y); c.rotate(sw); c.scale(s, s);
    c.strokeStyle = '#3A2A20'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 0); c.stroke();
    if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; n2_dot(c, lanG, 0, 38, 90, 0.85 + 0.15 * flick(t * 0.5, k)); c.restore(); }
    var g = c.createRadialGradient(-6, 30, 4, 0, 38, 34); g.addColorStop(0, dk ? '#FFB27A' : '#FF8A6A'); g.addColorStop(1, dk ? '#C8343A' : '#D2363E'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 38, 24, 32, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(80,20,20,0.35)'; c.lineWidth = 1.2; c.beginPath(); for (var j = -3; j <= 3; j++) c.ellipse(0, 38 + j * 8.5, 24 * Math.sqrt(1 - Math.pow(j * 8.5 / 32, 2)), 2.5, 0, 0, Math.PI); c.stroke();
    c.fillStyle = '#2A1C18'; c.fillRect(-13, 2, 26, 6); c.fillRect(-13, 68, 26, 6);
    c.fillStyle = 'rgba(255,240,220,0.85)'; c.beginPath(); c.arc(0, 38, 9, 0, 7); c.fill(); c.strokeStyle = '#C8343A'; c.lineWidth = 2; c.beginPath(); c.arc(0, 38, 5, 0.3, 5.5); c.stroke();
    c.strokeStyle = '#E8B040'; c.lineWidth = 1.5; c.beginPath(); for (j = -2; j <= 2; j++) { c.moveTo(j * 2, 74); c.lineTo(j * 2.6, 88 + Math.sin(t * 2 + j) * 1.5); } c.stroke(); c.restore(); }
  function noren(c, t, J) { var N = G.noren, n = ph ? 3 : 5, pw = (N[1] - N[0]) / n, col = dk ? '#26315E' : '#2B4078', col2 = dk ? '#1E2850' : '#22356A';
    c.fillStyle = '#5A3420'; c.fillRect(N[0] - 10, N[2] - 5 * S, N[1] - N[0] + 20, 7 * S);
    for (var k = 0; k < n; k++) { var x0 = N[0] + k * pw + 2, x1 = x0 + pw - 4, len = N[3] - N[2], wv = (Math.sin(t * 1.4 + k * 0.9) * 6 + Math.sin(t * 2.3 + k * 1.7) * 3 + J * Math.sin(t * 6 + k) * 8) * S;
      c.fillStyle = k % 2 ? col : col2; c.beginPath(); c.moveTo(x0, N[2]); c.lineTo(x1, N[2]); c.quadraticCurveTo(x1 + wv * 0.5, N[2] + len * 0.6, x1 + wv, N[2] + len); c.lineTo(x0 + wv, N[2] + len); c.quadraticCurveTo(x0 + wv * 0.5, N[2] + len * 0.6, x0, N[2]); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(x0 + wv * 0.6, N[2] + len - 7 * S, pw - 4, 2.5 * S); }
    // the emblem across the middle panels: a bowl with steam
    var ex = (N[0] + N[1]) / 2, ey = N[2] + (N[3] - N[2]) * 0.48, er = (ph ? 20 : 30), wv2 = Math.sin(t * 1.4 + 2) * 4 * S; c.save(); c.translate(ex + wv2 * 0.5, ey); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, er, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(-er * 0.62, -er * 0.05); c.lineTo(er * 0.62, -er * 0.05); c.quadraticCurveTo(er * 0.55, er * 0.55, 0, er * 0.58); c.quadraticCurveTo(-er * 0.55, er * 0.55, -er * 0.62, -er * 0.05); c.fill();
    c.strokeStyle = col; c.lineWidth = er * 0.1; c.lineCap = 'round'; c.beginPath(); for (var j = -1; j <= 1; j++) { c.moveTo(j * er * 0.25, -er * 0.2); c.quadraticCurveTo(j * er * 0.25 - er * 0.12, -er * 0.38, j * er * 0.25, -er * 0.55); } c.stroke(); c.restore(); }
  function chef(c, t, arm, J, look) { c.save(); c.translate(cx, hy + Math.sin(t * 1.6) * 1.5 * S); c.scale(cs, cs);
    c.fillStyle = dk ? '#E8E2F0' : '#FFFFFF'; c.beginPath(); c.moveTo(-48, 40); c.quadraticCurveTo(-58, 120, -60, 200); c.lineTo(60, 200); c.quadraticCurveTo(58, 120, 48, 40); c.quadraticCurveTo(0, 26, -48, 40); c.fill();
    c.fillStyle = dk ? '#2A3260' : '#2B4078'; c.fillRect(-46, 104, 92, 100); c.strokeStyle = dk ? '#2A3260' : '#2B4078'; c.lineWidth = 4; c.beginPath(); c.moveTo(-30, 104); c.lineTo(-20, 44); c.moveTo(30, 104); c.lineTo(20, 44); c.stroke();
    c.fillStyle = dk ? '#C8C0D8' : '#E8E4EC'; c.beginPath(); c.moveTo(-16, 40); c.lineTo(0, 62); c.lineTo(16, 40); c.fill();
    // left arm resting, right arm to the strainer
    c.strokeStyle = dk ? '#E8E2F0' : '#FFFFFF'; c.lineCap = 'round'; c.lineWidth = 20; c.beginPath(); c.moveTo(-44, 56); c.quadraticCurveTo(-66, 96, -40, 118); c.stroke();
    c.beginPath(); c.moveTo(44, 56); c.quadraticCurveTo(arm[0] * 0.4 + 30, arm[1] * 0.5 + 60, arm[0], arm[1]); c.stroke();
    c.fillStyle = '#F7D2B0'; c.beginPath(); c.arc(-40, 120, 9, 0, 7); c.arc(arm[0], arm[1], 9, 0, 7); c.fill();
    // head
    c.save(); c.rotate(look); c.fillStyle = '#F7D8B8'; c.beginPath(); c.arc(-36, 2, 8, 0, 7); c.arc(36, 2, 8, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0, 36, 0, 7); c.fill();
    c.fillStyle = '#3A2A28'; c.beginPath(); c.arc(0, -6, 35, Math.PI * 1.08, Math.PI * 1.92); c.fill();
    c.fillStyle = dk ? '#E8E2F0' : '#FFFFFF'; c.beginPath(); c.moveTo(-37, -14); c.quadraticCurveTo(0, -30, 37, -14); c.lineTo(37, -4); c.quadraticCurveTo(0, -20, -37, -4); c.fill();
    c.strokeStyle = '#2B4078'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(-34, -10); c.quadraticCurveTo(0, -25, 34, -10); c.stroke(); c.setLineDash([]);
    c.fillStyle = dk ? '#E8E2F0' : '#FFFFFF'; c.beginPath(); c.ellipse(34, -16, 7, 5, 0.6, 0, 7); c.ellipse(40, -8, 6, 4, -0.4, 0, 7); c.fill();
    n2_face(c, 0, 10, 30, J ? 2 : 0, t, 9); c.restore(); c.restore(); }
  function strainer(c, x, y, ang, full) { c.save(); c.translate(x, y); c.rotate(ang); c.scale(cs, cs); c.strokeStyle = '#8A6A40'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 36); c.stroke();
    c.fillStyle = '#C8CCD6'; c.beginPath(); c.moveTo(-15, 36); c.lineTo(15, 36); c.quadraticCurveTo(14, 66, 0, 72); c.quadraticCurveTo(-14, 66, -15, 36); c.fill(); c.strokeStyle = 'rgba(80,80,100,0.35)'; c.lineWidth = 1; c.beginPath(); for (var k = 0; k < 4; k++) { c.moveTo(-13 + k * 2, 42 + k * 7); c.lineTo(13 - k * 2, 42 + k * 7); } c.stroke();
    if (full) { c.fillStyle = '#F6DC8A'; c.beginPath(); c.ellipse(0, 38, 14, 6, 0, 0, 7); c.fill(); c.strokeStyle = '#E8C060'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-10, 38); c.quadraticCurveTo(0, 30, 10, 38); c.moveTo(-6, 36); c.quadraticCurveTo(2, 31, 8, 35); c.stroke(); }
    c.restore(); }
  var drops = [], spark = [], hum = 1;
  return {
    step: function (dt, t, f) {
      var tt = t * f.s;
      if (Math.random() < dt * 3) { var b = beads[Math.floor(Math.random() * beads.length)]; if (b.r > 1.8) slides.push({x: b.x, y: b.y, v: 20 + Math.random() * 30, r: b.r, trail: []}); }
      slides.forEach(function (s) { s.y += s.v * dt; s.trail.push([s.x, s.y]); if (s.trail.length > 30) s.trail.shift(); }); slides = slides.filter(function (s) { return s.y < G.wy1 + 4; });
      if (Math.random() < dt * (ph ? 4 : 7)) puff(P[0] + (Math.random() - 0.5) * 60 * S, P[1] - 4, S);
      if (Math.random() < dt * 3) puff(bx + (Math.random() - 0.5) * 40 * S, bTop - 4, S * 0.8);
      if (Math.random() < dt * 1.5) puff(bowlP[0] + (Math.random() - 0.5) * 20 * S, bowlP[1] - 30 * S, S * 0.45);
      if (mom && t - mom.t0 > 2.3 && Math.random() < dt * 2.5) { var mb = mom.bp; if (mb) puff(mb[0] + (Math.random() - 0.5) * 24 * S, mb[1] - 36 * S, S * 0.5); }
      steam.forEach(function (p) { p.age += dt; p.y -= 26 * p.s * dt * f.s; p.x += (p.vx + Math.sin(tt * 1.2 + p.ph) * 8) * dt; }); steam = steam.filter(function (p) { return p.age < p.life; });
      drops.forEach(function (d) { d.vy += 300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; }); drops = drops.filter(function (d) { return d.life > 0; });
      spark.forEach(function (p) { p.life -= dt; p.y -= 14 * dt; }); spark = spark.filter(function (p) { return p.life > 0; });
      hum = Math.random() < 0.02 ? 0.35 : Math.min(1, hum + dt * 4);
      if (mom && t - mom.t0 > 11) mom = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = mom ? t - mom.t0 : -1, J = mom && T < 9 ? 1 : 0;
      // the window: rain outside, the neon sign humming, drops on the glass
      ca.save(); ca.clip(winP);
      var sg = A.sign, on = (dk ? 1 : 0.6) * hum;
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n2_dot(ca, neonG, sg[0], sg[1], sg[2] * 1.6, on * (dk ? 0.9 : 0.4)); ca.fillStyle = dk ? 'rgba(255,100,120,' + 0.25 * on + ')' : 'rgba(255,255,255,0.2)'; ca.fillRect(sg[0] - sg[2] * 0.6, A.gy + 2, sg[2] * 1.2, wh * 0.25); ca.restore();
      ca.fillStyle = '#FFF4F0'; ca.globalAlpha = 0.5 + 0.5 * on; ca.beginPath(); ca.moveTo(sg[0] - sg[2] * 0.3, sg[1] - sg[2] * 0.05); ca.lineTo(sg[0] + sg[2] * 0.3, sg[1] - sg[2] * 0.05); ca.quadraticCurveTo(sg[0] + sg[2] * 0.26, sg[1] + sg[2] * 0.22, sg[0], sg[1] + sg[2] * 0.22); ca.quadraticCurveTo(sg[0] - sg[2] * 0.26, sg[1] + sg[2] * 0.22, sg[0] - sg[2] * 0.3, sg[1] - sg[2] * 0.05); ca.fill(); ca.globalAlpha = 1;
      ca.strokeStyle = dk ? 'rgba(200,210,255,0.35)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 1; ca.beginPath(); rain.forEach(function (r) { var y = G.wy0 + ((r.y + tt * r.s * 1.2) % 1) * wh, x = G.wx0 + ((r.x - tt * 0.05) % 1 + 1) % 1 * ww; ca.moveTo(x, y); ca.lineTo(x - wh * r.l * 0.25, y + wh * r.l); }); ca.stroke();
      ca.fillStyle = dk ? 'rgba(220,230,255,0.45)' : 'rgba(255,255,255,0.7)'; beads.forEach(function (b) { ca.beginPath(); ca.arc(b.x, b.y, b.r, 0, 7); ca.fill(); });
      slides.forEach(function (s) { ca.strokeStyle = dk ? 'rgba(220,230,255,0.25)' : 'rgba(255,255,255,0.45)'; ca.lineWidth = s.r * 0.8; ca.beginPath(); s.trail.forEach(function (q, k) { if (k) ca.lineTo(q[0], q[1]); else ca.moveTo(q[0], q[1]); }); ca.stroke(); ca.beginPath(); ca.arc(s.x, s.y, s.r * 1.2, 0, 7); ca.fill(); });
      ca.restore();
      // the kitchen: stockpot on its burner, the noodle boiler, the chef
      var pw = 64 * S, ph2 = G.ct - P[1];
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; n2_dot(ca, fireG, P[0], G.ct - 4, 40 * S, 0.5 + 0.2 * Math.sin(tt * 9)); ca.restore(); }
      var pg = ca.createLinearGradient(P[0] - pw, 0, P[0] + pw, 0); pg.addColorStop(0, dk ? '#8A8AA0' : '#D8DCE4'); pg.addColorStop(0.4, dk ? '#B8B8CC' : '#F4F6FA'); pg.addColorStop(1, dk ? '#5A5A70' : '#A8ACB8'); ca.fillStyle = pg; ca.fillRect(P[0] - pw, P[1], pw * 2, ph2 + 2);
      ca.fillStyle = dk ? '#5A5A70' : '#A8ACB8'; ca.fillRect(P[0] - pw - 8 * S, P[1] + 14 * S, 10 * S, 8 * S); ca.fillRect(P[0] + pw - 2, P[1] + 14 * S, 10 * S, 8 * S);
      ca.fillStyle = dk ? '#C89848' : '#E8B860'; ca.beginPath(); ca.ellipse(P[0], P[1], pw, 9 * S, 0, 0, 7); ca.fill();
      ca.fillStyle = dk ? '#F0C870' : '#FFE29A'; for (i = 0; i < 6; i++) { var bu = (tt * 0.8 + i * 0.37) % 1, bxp = P[0] + (hash(i * 3) - 0.5) * pw * 1.5, br = (2 + hash(i) * 3) * S * Math.sin(Math.PI * bu); if (br > 0.2) { ca.beginPath(); ca.arc(bxp, P[1] - 1, br, 0, 7); ca.fill(); } }
      ca.strokeStyle = '#8A6A40'; ca.lineWidth = 4 * S; ca.beginPath(); ca.moveTo(P[0] + pw * 0.3, P[1]); ca.lineTo(P[0] + pw * 0.6, P[1] - 50 * S); ca.stroke();
      ca.fillStyle = dk ? '#6A6A80' : '#B8BCC6'; ca.fillRect(bx - 46 * S, bTop, 92 * S, G.ct - bTop + 2); ca.fillStyle = dk ? '#3A3A50' : '#7A7E88'; ca.beginPath(); ca.ellipse(bx, bTop, 46 * S, 7 * S, 0, 0, 7); ca.fill();
      // strainer and chef arm through the moment
      var lift = 0, sxp = bx - 10 * S, syp = bTop - 40 * S, sang = 0.15, full = true, bp = [cx - 30 * S, G.ct + (G.cf - G.ct) * 0.55];
      if (mom) { if (T < 0.6) lift = n2_ease(T / 0.6); else if (T < 1.6) lift = 1 + Math.abs(Math.sin((T - 0.6) * Math.PI * 4)) * 0.25; else if (T < 2.3) lift = 1; else lift = Math.max(0, 1 - (T - 2.3) / 0.6);
        syp -= lift * 60 * S; if (T > 1.6 && T < 2.6) { var mv = n2_ease((T - 1.6) / 0.45); sxp = lerp(sxp, bp[0] + 26 * S, mv); syp = lerp(syp, bp[1] - 120 * S, mv); sang = lerp(0.15, -1.6, n2_ease((T - 1.95) / 0.35)); full = T < 2.15; }
        else if (T >= 2.6) { sxp = lerp(bp[0] + 26 * S, bx - 10 * S, n2_ease((T - 2.6) / 0.6)); syp = lerp(bp[1] - 120 * S, bTop - 40 * S, n2_ease((T - 2.6) / 0.6)); sang = lerp(-1.6, 0.15, n2_ease((T - 2.6) / 0.6)); full = false; }
        if (T > 0.6 && T < 1.6 && Math.random() < 0.5) drops.push({x: sxp, y: syp + 60 * S, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 100, life: 0.8}); }
      var arm = [(sxp - cx) / cs, (syp - hy) / cs]; chef(ca, tt, arm, J, mom ? Math.sin(T * 2) * 0.05 : Math.sin(tt * 0.4) * 0.08);
      strainer(ca, sxp, syp, sang, full);
      ca.fillStyle = 'rgba(190,220,255,0.8)'; drops.forEach(function (d) { ca.beginPath(); ca.arc(d.x, d.y, 2 * S, 0, 7); ca.fill(); });
      // steam
      steam.forEach(function (p) { var u = p.age / p.life; n2_dot(ca, steamG, p.x, p.y, (14 + u * 30) * p.s, Math.sin(Math.PI * u) * 0.8); });
      // the counter: maneki-neko, a bowl, condiments; the new bowl sliding down to you
      neko(cb, nekoP[0], nekoP[1] + 4 * S, S * (ph ? 0.8 : 1.1), tt, J);
      cb.drawImage(props, cad[0] - 60 * S, cad[1] - 72 * S, 120 * S, 80 * S);
      cb.save(); cb.translate(bowlP[0], bowlP[1] + 6 * S); n2_bowl(cb, 38 * S, dk, 5, tt, J); cb.restore();
      if (mom && T > 1.9) { var sl = n2_ease((T - 3.1) / 1.2), dest = [W * (ph ? 0.36 : 0.45), G.cf - 4 * S], x = lerp(bp[0], dest[0], sl), y = lerp(bp[1], dest[1], sl), sc = (ph ? 0.85 : 1) * (1 + sl * 0.15) * Math.min(1, (T - 1.9) / 0.15), al = T > 9.5 ? Math.max(0, 1 - (T - 9.5) / 1.2) : 1; mom.bp = [x, y];
        var tops = T < 2.4 ? 0 : Math.min(5, 1 + Math.floor((T - 2.4) / 0.13));
        cb.save(); cb.globalAlpha = al; cb.translate(x, y); cb.scale(sc, sc); n2_bowl(cb, 46 * S, dk, tops, tt, true); cb.restore();
        if (T > 1.95 && T < 2.35) { cb.strokeStyle = '#F6DC8A'; cb.lineWidth = 3 * S; cb.beginPath(); for (var k = 0; k < 5; k++) { var nx = x - 10 * S + k * 5 * S; cb.moveTo(nx, y - 120 * S + (T - 1.95) * 200 * S); cb.quadraticCurveTo(nx + 6, y - 70 * S, nx, y - 30 * S); } cb.stroke(); }
        if (Math.floor(T * 10) !== mom.k && T > 2.3 && T < 5) { mom.k = Math.floor(T * 10); spark.push({x: x + (Math.random() - 0.5) * 80 * S, y: y - 40 * S - Math.random() * 40 * S, life: 1}); }
        if (sl > 0 && sl < 1) { cb.strokeStyle = 'rgba(255,255,255,0.6)'; cb.lineWidth = 2; cb.beginPath(); for (k = 0; k < 3; k++) { cb.moveTo(x + 50 * S + k * 10, y - 10 - k * 9); cb.lineTo(x + 90 * S + k * 16, y - 10 - k * 9); } cb.stroke(); } }
      cb.fillStyle = '#FFE8A0'; spark.forEach(function (p) { cb.globalAlpha = p.life; n2_star(cb, p.x, p.y, 4 + p.life * 4); }); cb.globalAlpha = 1;
      noren(cb, tt, J ? 1 : 0);
      G.lant.forEach(function (L, k) { lantern(cb, L[0], L[1], S * (ph ? 0.75 : 1), tt, k); });
    },
    finish: function (t) { if (!mom) mom = {t0: t}; }
  };
};
UIC.ramen = {L: ['#8A3A2E', '#5E241C', 'rgba(255,252,246,0.86)', '#2E1E16', '#6E5A4E', '#C8343A', '#C8343A', '#E0603A', '#FFFFFF'], D: ['#3B2734', '#1E1620', 'rgba(32,22,30,0.80)', '#F8EEF0', '#C8B0B8', '#FF8A7A', '#FF8A7A', '#FFB08A', '#2A0E0A']};
