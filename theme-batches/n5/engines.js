// Batch n5 engines: pride, graduation, birthday, geology
// (uses the m5 helpers m5_ease, m5_env, m5_rg, m5_dot, m5_eyes, m5_face, m5_cheeks, m5_blinkAt from engines_m5.js: same scene library closure)
var n5_sprites = {};
function n5_sprite(key, w, h, fn) { if (n5_sprites[key]) return n5_sprites[key]; var k = 2, cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); fn(o); cv.hw = w / 2; cv.hh = h / 2; return (n5_sprites[key] = cv); }
function n5_blit(c, img, x, y, s, rot, a) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (a != null) c.globalAlpha = a; c.drawImage(img, -img.hw * s, -img.hh * s, img.hw * 2 * s, img.hh * 2 * s); c.restore(); }
function n5_light(hex, k) { return mix(hex, '#FFFFFF', k); }
function n5_dark(hex, k) { return mix(hex, '#000000', k); }
// a glossy party balloon (sprite) of radius r, knot at the bottom
function n5_balloonImg(col, r) { return n5_sprite('bl' + col + r, r * 2.4, r * 2.8, function (o) { o.translate(0, -r * 0.2);
  var g = o.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15); g.addColorStop(0, n5_light(col, 0.45)); g.addColorStop(0.55, col); g.addColorStop(1, n5_dark(col, 0.22));
  o.fillStyle = g; o.beginPath(); o.moveTo(0, r * 1.12); o.bezierCurveTo(-r * 0.5, r * 1.05, -r, r * 0.55, -r, -r * 0.05); o.bezierCurveTo(-r, -r * 0.7, -r * 0.55, -r * 1.05, 0, -r * 1.05); o.bezierCurveTo(r * 0.55, -r * 1.05, r, -r * 0.7, r, -r * 0.05); o.bezierCurveTo(r, r * 0.55, r * 0.5, r * 1.05, 0, r * 1.12); o.fill();
  o.fillStyle = n5_dark(col, 0.15); o.beginPath(); o.moveTo(-r * 0.14, r * 1.24); o.lineTo(r * 0.14, r * 1.24); o.lineTo(0, r * 1.08); o.fill();
  o.fillStyle = 'rgba(255,255,255,0.6)'; o.beginPath(); o.ellipse(-r * 0.42, -r * 0.48, r * 0.16, r * 0.3, 0.6, 0, 7); o.fill(); o.beginPath(); o.arc(-r * 0.2, -r * 0.78, r * 0.07, 0, 7); o.fill(); }); }
// confetti pieces falling with a flutter; spawn() adds one; burst() throws a cone of them
function n5_confetti(W, H, cols) {
  var list = [];
  function make(x, y, vx, vy, big) { return {x: x, y: y, vx: vx, vy: vy, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8, fl: Math.random() * 6.28, w: (big ? 5 : 3.5) + Math.random() * 3, h: 2 + Math.random() * 2.5, c: cols[Math.floor(Math.random() * cols.length)], kind: Math.random() < 0.18 ? 1 : 0, life: 0}; }
  return {list: list,
    drift: function (n) { for (var i = 0; i < n; i++) list.push(Object.assign(make(Math.random() * W, Math.random() * H, 0, 18 + Math.random() * 20), {ambient: 1})); },
    burst: function (x, y, ang, spread, n, sp) { for (var i = 0; i < n; i++) { var a = ang + (Math.random() - 0.5) * spread, v = sp * (0.55 + Math.random() * 0.6); list.push(make(x, y, Math.cos(a) * v, Math.sin(a) * v, true)); } },
    step: function (dt, f) { for (var i = list.length - 1; i >= 0; i--) { var p = list[i]; p.life += dt;
      if (p.ambient) { p.x += (Math.sin(p.fl + p.life * 1.3) * 14) * dt; p.y += p.vy * dt * f.s; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } }
      else { p.vx *= Math.pow(0.35, dt); p.vy = p.vy * Math.pow(0.35, dt) + 260 * dt; if (p.vy > 70) p.vy = 70; p.x += (p.vx + Math.sin(p.fl + p.life * 4) * 30) * dt; p.y += p.vy * dt; if (p.y > H + 20 || p.life > 9) list.splice(i, 1); }
      p.r += p.vr * dt; p.fl += dt * 5; } },
    draw: function (c) { list.forEach(function (p) { var sy = Math.cos(p.fl); c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.scale(1, Math.max(0.15, Math.abs(sy))); c.fillStyle = p.c; if (p.kind) { c.beginPath(); c.arc(0, 0, p.h * 1.2, 0, 7); c.fill(); } else c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); if (sy < 0) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); } c.restore(); }); }
  };
}
// a waving flag: hoist at (x, y), fl long and fh tall, flying in dir; stripes = [[colour, weight]...]
function n5_flag(c, x, y, fl, fh, dir, t, stripes, amp, seed) {
  var N = 14, tot = 0, i, j; stripes.forEach(function (s) { tot += s[1]; });
  function P(u, v) { var w = Math.sin(t * 4.2 + seed - u * 6.5) * amp * u, dx = Math.cos(t * 4.2 + seed - u * 6.5) * amp * 0.35 * u; return [x + dir * (u * fl - Math.abs(dx) * 0.6), y + v * fh + w + u * u * fh * 0.12]; }
  var v0 = 0; stripes.forEach(function (s) { var v1 = v0 + s[1] / tot; c.fillStyle = s[0]; c.beginPath(); for (i = 0; i <= N; i++) { var p = P(i / N, v0); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } for (i = N; i >= 0; i--) { var q = P(i / N, v1 + 0.003); c.lineTo(q[0], q[1]); } c.fill(); v0 = v1; });
  // light and shade bands follow the wave
  for (j = 0; j < N; j++) { var u = (j + 0.5) / N, s2 = Math.cos(t * 4.2 + seed - u * 6.5); c.fillStyle = s2 > 0 ? 'rgba(255,255,255,' + (0.22 * s2 * u) + ')' : 'rgba(30,10,40,' + (-0.2 * s2 * u) + ')'; var a = P(j / N, 0), b = P((j + 1) / N, 0), cc = P((j + 1) / N, 1), d = P(j / N, 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.fill(); }
}
var n5_FLAGS = [
  [['#E8404E', 1], ['#F5923A', 1], ['#F8D33E', 1], ['#4FB25A', 1], ['#3F82D8', 1], ['#8A4FC4', 1]],
  [['#5BCEFA', 1], ['#F5A9B8', 1], ['#FFFFFF', 1], ['#F5A9B8', 1], ['#5BCEFA', 1]],
  [['#D60270', 2], ['#9B4F96', 1], ['#0038A8', 2]]
];
// a corgi in a rainbow bandana, trotting (dir 1 = right)
function n5_corgi(c, x, y, s, dir, t, run, happy) {
  var o = '#F2A25A', w = '#FFF6EA', b = Math.abs(Math.sin(t * 9)) * 2 * run, lg = Math.sin(t * 9) * 4 * run;
  c.save(); c.translate(x, y - b); c.scale(s * dir, s);
  c.fillStyle = 'rgba(40,20,60,0.18)'; c.beginPath(); c.ellipse(0, b + 0.5, 16, 2.6, 0, 0, 7); c.fill();
  c.strokeStyle = o; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-9, -5); c.lineTo(-9 - lg * 0.5, 0); c.moveTo(-4, -5); c.lineTo(-4 + lg * 0.5, 0); c.moveTo(7, -5); c.lineTo(7 + lg * 0.5, 0); c.moveTo(11, -5); c.lineTo(11 - lg * 0.5, 0); c.stroke();
  c.fillStyle = o; c.beginPath(); c.ellipse(1, -9, 15, 7, 0, 0, 7); c.fill(); c.fillStyle = w; c.beginPath(); c.ellipse(4, -5.5, 10, 3.6, 0, 0, 7); c.fill();
  c.fillStyle = o; c.beginPath(); c.ellipse(-15, -12, 4, 3, -0.6 + Math.sin(t * 12) * 0.4 * (run + 0.3), 0, 7); c.fill();
  c.save(); c.translate(14, -16); c.rotate(Math.sin(t * 2) * 0.05);
  c.fillStyle = o; c.beginPath(); c.moveTo(-6, -4); c.lineTo(-5, -15); c.lineTo(0, -7); c.moveTo(1, -7); c.lineTo(6, -15); c.lineTo(7, -3); c.fill(); c.fillStyle = '#FFC9B0'; c.beginPath(); c.moveTo(-4.2, -6); c.lineTo(-4.2, -12); c.lineTo(-1.6, -7.5); c.moveTo(4.6, -6.5); c.lineTo(5, -12); c.lineTo(2.6, -7.5); c.fill();
  c.fillStyle = o; c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fill(); c.fillStyle = w; c.beginPath(); c.ellipse(4, 2.5, 6.5, 4.4, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -5, 1.6, 3, 0, 0, 7); c.fill();
  c.fillStyle = '#3A2A3A'; c.beginPath(); c.arc(9.6, 1, 1.6, 0, 7); c.fill();
  m5_eyes(c, 3, -1.5, 0.001, 1.3, happy ? 1 : m5_blinkAt(t, x * 0.01), happy); c.fillStyle = m5_BLUSH; c.beginPath(); c.ellipse(4, 2.4, 2.2, 1.3, 0, 0, 7); c.fill();
  c.restore();
  // rainbow bandana
  var R = n5_RAINBOW; for (var k = 0; k < 6; k++) { c.fillStyle = R[k]; c.beginPath(); c.moveTo(9 - k * 0.2, -15 + k * 1.3); c.lineTo(13.5 - k * 0.2, -15 + k * 1.3); c.lineTo(11.5 - k * 0.6, -6 + k * 0.3); c.fill(); }
  c.restore(); }

// a cute parade float: a little truck with a rainbow skirt and a heart on top (x = centre, y = road)
function n5_float(c, x, y, s, dir, t, R, dk) {
  c.save(); c.translate(x, y); c.scale(s * dir, s); var b = Math.abs(Math.sin(t * 7)) * 0.8;
  c.fillStyle = 'rgba(30,20,50,0.25)'; c.beginPath(); c.ellipse(0, 0, 70, 5, 0, 0, 7); c.fill();
  c.fillStyle = '#3A3050'; [-44, -16, 40].forEach(function (wx) { c.beginPath(); c.arc(wx, -7, 8, 0, 7); c.fill(); }); c.fillStyle = '#D8D0E8'; [-44, -16, 40].forEach(function (wx) { c.beginPath(); c.arc(wx, -7, 3.4, 0, 7); c.fill(); });
  c.translate(0, -b);
  // cab with a face
  var g = c.createLinearGradient(0, -46, 0, -10); g.addColorStop(0, '#FFE3F1'); g.addColorStop(1, '#F4A6CB'); c.fillStyle = g; c.beginPath(); c.moveTo(26, -12); c.lineTo(26, -40); c.quadraticCurveTo(26, -46, 32, -46); c.lineTo(46, -46); c.quadraticCurveTo(56, -44, 60, -30); c.lineTo(62, -18); c.quadraticCurveTo(62, -12, 56, -12); c.closePath(); c.fill();
  c.fillStyle = dk ? '#FFE3A8' : '#BFE6FF'; c.beginPath(); c.moveTo(42, -42); c.lineTo(47, -42); c.quadraticCurveTo(54, -40, 56, -30); c.lineTo(42, -30); c.closePath(); c.fill();
  m5_face(c, 36, -24, 9, false, m5_blinkAt(t, 3), true);
  // the deck with a rainbow skirt
  for (var k = 0; k < 6; k++) { c.fillStyle = R[k]; c.fillRect(-62, -30 + k * 3.4, 86, 3.6); }
  c.fillStyle = '#FFFFFF'; c.beginPath(); for (var q = 0; q < 11; q++) { c.moveTo(-62 + q * 8.6, -10); c.arc(-57.7 + q * 8.6, -10, 4.3, 0, Math.PI); } c.fill();
  c.fillStyle = dk ? '#F0E6FF' : '#FFFFFF'; c.fillRect(-64, -33, 90, 4);
  // a big heart on top and two little flags
  c.save(); c.translate(-20, -52 + Math.sin(t * 2) * 1.5); var hs = 1 + Math.sin(t * 4) * 0.04; c.scale(hs, hs); var hg = c.createLinearGradient(0, -16, 0, 16); hg.addColorStop(0, '#FF8FB8'); hg.addColorStop(1, '#E8405E'); c.fillStyle = hg; c.beginPath(); c.moveTo(0, 15); c.bezierCurveTo(-24, 0, -18, -20, 0, -9); c.bezierCurveTo(18, -20, 24, 0, 0, 15); c.fill(); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-7, -7, 3, 5, 0.6, 0, 7); c.fill(); m5_face(c, 0, 1, 9, false, m5_blinkAt(t, 5), true); c.restore();
  [-56, 16].forEach(function (fx, j) { c.fillStyle = '#6A6488'; c.fillRect(fx, -58, 1.6, 26); n5_flag(c, fx + 1.6, -58, 18, 12, -1, t + j, n5_FLAGS[j], 1.5, j); });
  c.restore(); }

// ---------- Pride Parade: flags ripple, bunting sways between the lamp posts, confetti drifts, rainbow balloons bob, a corgi trots by.
// Moment: a confetti cannon pops and a rainbow arch draws itself across the sky, stripe by stripe.
ENGINES.pride = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, R = dk ? n5_RAINBOW_D : n5_RAINBOW, yb = A.yb;
  var conf = n5_confetti(W, H, R.concat(dk ? ['#FFFFFF', '#FFB3E6'] : ['#FFFFFF', '#FF8FC8'])); conf.drift(ph ? 22 : 40);
  var winG = m5_rg('rgba(255,200,130,0.45)', 1), lampG = m5_rg(dk ? 'rgba(255,214,150,0.55)' : 'rgba(255,240,200,0.25)', 1, [0.35, dk ? 0.3 : 0.12]), bulbG = m5_rg('rgba(255,230,160,0.6)', 1), starG = m5_rg('rgba(255,240,255,0.7)', 1);
  var wins = A.wins.filter(function (w) { return w.k < 0.62; });
  var stars = []; if (dk) for (var i = 0; i < (ph ? 30 : 60); i++) stars.push({x: Math.random() * W, y: Math.random() * yb * 0.5, r: 0.6 + Math.random() * 1.4, ph: Math.random() * 6.28});
  // balloon bunches on some lamp posts
  var bunches = A.lamps.filter(function (l, j) { return j % 2 === 0; }).map(function (l, j) { var n = 5, b = []; for (var q = 0; q < n; q++) b.push({dx: (q - (n - 1) / 2) * 15 + Math.sin(q * 2.1) * 4, dy: -26 - Math.abs(q - 2) * -6 - (q % 2) * 16, c: R[(q + j * 2) % 6], r: (ph ? 10 : 13) + (q % 2) * 1.5, ph: q * 1.3 + j}); return {x: l.x, y: l.top + 10, b: b}; });
  var dog = {x: W * 0.3, dir: 1, sp: ph ? 30 : 44}, mom = null, cannon = [], flt = null, nextFloat = 5;
  // the moon sits clear of the moment's rainbow arch (top right, where the day's sun is)
  var M = [W * (ph ? 0.8 : 0.9), H * (ph ? 0.17 : 0.1), ph ? 20 : 26], moonG = m5_rg('rgba(255,230,250,0.45)', 1);
  // the rainbow is in the sky, so the townhouses (their facades, cornices and roofs) are cut out of it
  var silP = A.sil ? new Path2D(A.sil) : null, off = null;
  function rainbow(c, t) {
    var T = t - mom.t0, cx = W * 0.5, cy = yb + 10, R0 = ph ? H * 0.56 : W * 0.5, sw = ph ? 11 : 16, fade = T > 7 ? Math.max(0, 1 - (T - 7) / 1.5) : 1;
    if (fade <= 0) return;
    var cv = c.canvas; if (!off || off.width !== cv.width || off.height !== cv.height) { off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height; }
    var o = off.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height); o.setTransform(c.getTransform());
    o.globalAlpha = fade * (dk ? 0.85 : 0.8); o.lineCap = 'butt';
    for (var k = 0; k < 6; k++) { var u = m5_ease((T - 0.9 - k * 0.32) / 1.1); if (u <= 0) continue; var r = R0 - k * sw; o.strokeStyle = R[k]; o.lineWidth = sw + 0.8; o.beginPath(); o.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * u); o.stroke();
      if (u < 1) { var a = Math.PI + Math.PI * u; m5_dot(o, starG, cx + Math.cos(a) * r, cy + Math.sin(a) * r, sw * 1.4, 0.9); } }
    o.globalAlpha = 1; if (silP) { o.globalCompositeOperation = 'destination-out'; o.fill(silP); o.globalCompositeOperation = 'source-over'; }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(off, 0, 0); c.restore();
  }
  function drawCannon(c, t, C) { var T = t - C.t0, kick = T < 0.25 ? Math.sin(T / 0.25 * Math.PI) * 6 : 0, a = Math.min(1, T * 4) * (T > 6 ? Math.max(0, 1 - (T - 6)) : 1); if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(C.x, C.y); c.scale(C.s * C.dir, C.s); c.rotate(-0.75);
    c.fillStyle = '#5A4A7A'; c.beginPath(); c.arc(-6, 10, 6, 0, 7); c.arc(10, 10, 6, 0, 7); c.fill();
    var g = c.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, '#FF8FC8'); g.addColorStop(1, '#C24F8A'); c.fillStyle = g; c.beginPath(); c.moveTo(-14 - kick, -7); c.lineTo(20 - kick, -9); c.lineTo(20 - kick, 9); c.lineTo(-14 - kick, 7); c.closePath(); c.fill();
    for (var k = 0; k < 6; k++) { c.fillStyle = R[k]; c.fillRect(-8 - kick + k * 4, -8, 2.4, 16); }
    c.fillStyle = '#3A2A4A'; c.beginPath(); c.ellipse(20 - kick, 0, 3, 9, 0, 0, 7); c.fill();
    if (T < 0.5) { c.fillStyle = 'rgba(255,255,255,' + (1 - T * 2) + ')'; c.beginPath(); c.arc(28, 0, 6 + T * 40, 0, 7); c.fill(); }
    c.restore(); }
  return {
    step: function (dt, t, f) {
      conf.step(dt, f);
      dog.x += dog.dir * dog.sp * dt * f.s; if (dog.x > W + 40) { dog.dir = -1; } if (dog.x < -40) dog.dir = 1;
      cannon.forEach(function (C) { if (!C.fired && t - C.t0 > 0.15) { C.fired = 1; conf.burst(C.x + C.dir * 20 * C.s, C.y - 20 * C.s, C.dir > 0 ? -1.0 : -Math.PI + 1.0, 0.7, ph ? 50 : 90, ph ? 420 : 600); } });
      if (mom && t - mom.t0 > 9) { mom = null; cannon = []; }
      nextFloat -= dt * f.s; if (!flt && nextFloat <= 0) { var d0 = Math.random() < 0.5 ? 1 : -1; flt = {x: d0 > 0 ? -90 : W + 90, dir: d0}; nextFloat = 35 + Math.random() * 20; }
      if (flt) { flt.x += flt.dir * (ph ? 34 : 48) * dt * f.s; if (flt.x < -120 || flt.x > W + 120) flt = null; }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i;
      if (dk) { stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * 1.3 + s.ph); m5_dot(ca, starG, s.x, s.y, s.r * 3, 0.5 * a); ca.fillStyle = 'rgba(255,245,255,' + (0.5 + 0.5 * a) + ')'; ca.beginPath(); ca.arc(s.x, s.y, s.r, 0, 7); ca.fill(); });
        wins.forEach(function (w, j) { var fl = 0.75 + 0.25 * Math.sin(tt * 0.4 + j * 1.7); ca.fillStyle = w.shop ? 'rgba(255,190,140,' + (0.75 * fl) + ')' : 'rgba(255,214,150,' + (0.8 * fl) + ')';
          if (w.arch) { ca.beginPath(); ca.moveTo(w.x, w.y + w.h); ca.lineTo(w.x, w.y + w.w / 2); ca.arc(w.x + w.w / 2, w.y + w.w / 2, w.w / 2, Math.PI, 0); ca.lineTo(w.x + w.w, w.y + w.h); ca.fill(); } else ca.fillRect(w.x, w.y, w.w, w.h);
          m5_dot(ca, winG, w.x + w.w / 2, w.y + w.h / 2, w.w * 1.3, 0.6 * fl); }); }
      if (dk) { m5_dot(ca, moonG, M[0], M[1], M[2] * 3, 0.8); ca.fillStyle = '#FFF4E0'; ca.beginPath(); ca.arc(M[0], M[1], M[2], Math.PI * 0.35, Math.PI * 1.65); ca.arc(M[0] + M[2] * 0.55, M[1] - M[2] * 0.2, M[2] * 0.82, Math.PI * 1.45, Math.PI * 0.62, true); ca.fill(); ca.save(); ca.translate(M[0] - M[2] * 0.35, M[1]); m5_face(ca, 0, 0, M[2] * 0.55, !mom, 1, !!mom); ca.restore(); }
      if (mom) rainbow(ca, t);
      // roof flags on poles
      A.roofFlags.forEach(function (q, j) { var s = q.s, ph2 = 40 * s; ca.fillStyle = dk ? '#C8C0E8' : '#6A6488'; ca.fillRect(q.x - 1.2, q.y - ph2 - 30 * s, 2.4, ph2 + 30 * s); ca.beginPath(); ca.arc(q.x, q.y - ph2 - 31 * s, 2.6, 0, 7); ca.fill(); n5_flag(ca, q.x + 1, q.y - ph2 - 28 * s, 44 * s, 28 * s, j % 2 ? -1 : 1, tt, n5_FLAGS[j % 3 === 2 ? 1 : 0], 3.5 * s, j * 2); });
      // facade flags on leaning poles
      A.flags.forEach(function (q, j) { var s = q.s, L = 46 * s, ax = q.x + q.dir * L * 0.55, ay = q.y - L * 0.83; ca.strokeStyle = dk ? '#C8C0E8' : '#6A6488'; ca.lineWidth = 2.4; ca.lineCap = 'round'; ca.beginPath(); ca.moveTo(q.x, q.y); ca.lineTo(ax, ay); ca.stroke(); ca.fillStyle = dk ? '#FFE08A' : '#E8B84A'; ca.beginPath(); ca.arc(ax, ay, 2.8, 0, 7); ca.fill();
        ca.fillStyle = dk ? '#2A2050' : '#FFFFFF'; ca.fillRect(q.x - 3, q.y - 2, 6, 5);
        n5_flag(ca, ax - q.dir * 3, ay + 2, 50 * s, 32 * s, q.dir, tt + j * 0.7, n5_FLAGS[q.kind], 4 * s, j); });
      // a cat in a window, watching the street
      if (A.wins.length > 4) { var cw = A.wins[ph ? 3 : 7]; if (cw && !cw.shop) m5_cat(ca, cw.x + cw.w * 0.5, cw.y + cw.h, ph ? 0.9 : 1.1, 1, tt, ['#F6F0EA', '#E8A060'], 'loaf', Math.sin(tt * 1.6) * 0.5, Math.sin(tt * 0.3) * 0.1, false, !!mom); }
      // lamp glows (front canvas)
      A.lamps.forEach(function (l, j) { m5_dot(cb, lampG, l.x, l.y, dk ? 70 : 40, dk ? 0.9 : 0.6); });
      // bunting between lamp posts
      for (i = 0; i < A.lamps.length - 1; i++) { var a = A.lamps[i], b = A.lamps[i + 1], sag = (ph ? 26 : 34) + Math.sin(tt * 0.9 + i) * 4, n = Math.max(6, Math.round((b.x - a.x) / 22)), y0 = a.top + 4, y1 = b.top + 4;
        cb.strokeStyle = dk ? 'rgba(230,220,255,0.6)' : 'rgba(90,70,110,0.55)'; cb.lineWidth = 1.1; cb.beginPath(); for (var q = 0; q <= 20; q++) { var u = q / 20, x = a.x + (b.x - a.x) * u, y = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u); if (q) cb.lineTo(x, y); else cb.moveTo(x, y); } cb.stroke();
        for (q = 1; q < n; q++) { u = q / n; x = a.x + (b.x - a.x) * u; y = y0 + (y1 - y0) * u + sag * 4 * u * (1 - u); var sw = Math.sin(tt * 2.2 + q * 0.8 + i) * 0.22, pw = ph ? 6.5 : 8, phh = ph ? 11 : 14; cb.save(); cb.translate(x, y); cb.rotate(sw); cb.fillStyle = R[(q + i) % 6]; cb.beginPath(); cb.moveTo(-pw, 0); cb.lineTo(pw, 0); cb.lineTo(0, phh); cb.fill(); cb.fillStyle = 'rgba(255,255,255,0.28)'; cb.beginPath(); cb.moveTo(-pw, 0); cb.lineTo(-pw * 0.2, 0); cb.lineTo(0, phh); cb.fill(); cb.restore();
          if (dk && q % 2 === 0) { m5_dot(cb, bulbG, x, y + 1, 9, 0.5 + 0.4 * Math.sin(tt * 2 + q)); cb.fillStyle = '#FFF0C0'; cb.beginPath(); cb.arc(x, y + 1, 1.6, 0, 7); cb.fill(); } } }
      // balloon bunches
      bunches.forEach(function (B, j) { B.b.forEach(function (o) { var bx = B.x + o.dx + Math.sin(tt * 0.8 + o.ph) * 4, by = B.y + o.dy - 30 + Math.sin(tt * 1.1 + o.ph * 1.3) * 3, img = n5_balloonImg(o.c, o.r);
        cb.strokeStyle = dk ? 'rgba(230,220,255,0.55)' : 'rgba(90,70,110,0.5)'; cb.lineWidth = 0.9; cb.beginPath(); cb.moveTo(B.x, B.y); cb.quadraticCurveTo((B.x + bx) / 2 + Math.sin(tt + o.ph) * 4, (B.y + by) / 2 + 10, bx, by + o.r * 1.15); cb.stroke();
        n5_blit(cb, img, bx, by, 1, Math.sin(tt * 0.9 + o.ph) * 0.08); }); });
      // the corgi on the sidewalk
      n5_corgi(cb, dog.x, (yb + A.yc) / 2 + 3, ph ? 0.85 : 1.1, dog.dir, tt, 1, !!mom);
      // the confetti cannons stand on the curb, behind the float driving along the road
      cannon.forEach(function (C) { drawCannon(cb, t, C); });
      if (flt) n5_float(cb, flt.x, A.yr + (H - A.yr) * (ph ? 0.55 : 0.5), ph ? 0.75 : 1.05, flt.dir, tt, R, dk);
      conf.draw(cb);
    },
    finish: function (t) { if (mom) return; mom = {t0: t}; if (!flt) { flt = {x: -90, dir: 1}; } var s = ph ? 0.9 : 1.2; cannon = [{x: W * (ph ? 0.12 : 0.1), y: A.yc - 4, dir: 1, s: s, t0: t}, {x: W * (ph ? 0.88 : 0.9), y: A.yc - 4, dir: -1, s: s, t0: t + 0.35}]; }
  };
};
UIC.pride = {L: ['#7A4A9E', '#4E2E72', 'rgba(255,255,255,0.86)', '#2A1E3A', '#6A5A7A', '#B8407A', '#B8407A', '#7A4AB8', '#FFFFFF'], D: ['#3A2560', '#1E1A3E', 'rgba(36,26,64,0.80)', '#F8F0FF', '#C2B2D8', '#FF8FC8', '#FF8FC8', '#C6A0FF', '#1E1A3E']};

// a mortarboard seen at an angle: spin turns it about its own axis, a = board size
function n5_cap(c, x, y, a, rot, spin, col, tassel, tsw) {
  c.save(); c.translate(x, y); c.rotate(rot); var sx = Math.cos(spin);
  c.fillStyle = n5_dark(col, 0.25); c.beginPath(); c.moveTo(-a * 0.55, 0); c.lineTo(-a * 0.5, a * 0.42); c.quadraticCurveTo(0, a * 0.6, a * 0.5, a * 0.42); c.lineTo(a * 0.55, 0); c.fill();
  c.scale(1, 1); c.fillStyle = col; c.beginPath(); c.moveTo(-a * sx, 0); c.lineTo(0, -a * 0.36); c.lineTo(a * sx, 0); c.lineTo(0, a * 0.36); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(-a * sx, 0); c.lineTo(0, -a * 0.36); c.lineTo(0, 0); c.fill();
  c.fillStyle = tassel; c.beginPath(); c.arc(0, 0, a * 0.1, 0, 7); c.fill();
  if (tsw != null) { var ex = a * 0.78 * sx + Math.sin(tsw) * a * 0.12, ey = a * 0.1; c.strokeStyle = tassel; c.lineWidth = Math.max(1, a * 0.07); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(ex * 0.6, -a * 0.05, ex, ey); c.lineTo(ex + Math.sin(tsw) * a * 0.1, ey + a * 0.55); c.stroke(); c.fillStyle = tassel; c.beginPath(); c.moveTo(ex - a * 0.09 + Math.sin(tsw) * a * 0.1, ey + a * 0.4); c.lineTo(ex + a * 0.09 + Math.sin(tsw) * a * 0.1, ey + a * 0.4); c.lineTo(ex + a * 0.12 + Math.sin(tsw) * a * 0.14, ey + a * 0.72); c.lineTo(ex - a * 0.12 + Math.sin(tsw) * a * 0.14, ey + a * 0.72); c.fill(); }
  c.restore(); }

// ---------- Graduation Day: graduates wait in their seats with tassels swaying, banners sway, balloons tug at their strings, confetti drifts, the clock ticks.
// Moment: every cap flies into the air, spins and tumbles back down, and a diploma unrolls with a ribbon.
ENGINES.graduation = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, NAVY = dk ? '#4A60B0' : '#2E4A8A', GOLD = dk ? '#F2C85A' : '#F2B83A', MAR = dk ? '#A04A62' : '#9A2E4A';
  var conf = n5_confetti(W, H, [GOLD, '#FFFFFF', '#7FB8F0', NAVY, '#F7A8C8']); conf.drift(ph ? 14 : 26);
  var chairC = dk ? '#9A98C4' : '#FFFFFF', chairS = dk ? 'rgba(10,14,40,0.35)' : 'rgba(40,70,40,0.18)', HAIR = ['#3A2A2A', '#6A4A3A', '#D9AE62', '#24181A', '#9A5232', '#5A3A4A'];
  var winG = m5_rg('rgba(255,206,140,0.5)', 1), lampG = m5_rg('rgba(255,220,150,0.55)', 1, [0.3, 0.25]), bulbG = m5_rg('rgba(255,230,160,0.6)', 1), starG = m5_rg('rgba(230,236,255,0.7)', 1);
  var rows = A.rows.map(function (R, ri) { var p = new Path2D(), sh = new Path2D(), g = []; R.xs.forEach(function (x, j) { p.addPath(new Path2D(n5_chair(x, R.y, R.s))); sh.addPath(new Path2D(ell(x, R.y + 1, 13 * R.s, 3 * R.s)));
      if (hash(ri * 31 + j * 7.3) < (ri === 0 ? 0.5 : 0.7)) g.push({x: x, y: R.y, s: R.s, hair: HAIR[Math.floor(hash(j * 3.1 + ri) * HAIR.length)], ph: hash(j + ri * 9) * 6.28, gown: hash(j * 1.7 + ri) < 0.2 ? MAR : NAVY, cap: null}); });
    return {p: p, sh: sh, g: g, y: R.y, s: R.s}; });
  var grads = []; rows.forEach(function (R) { grads = grads.concat(R.g); });
  var stars = []; if (dk) for (var i = 0; i < (ph ? 30 : 60); i++) stars.push({x: Math.random() * W, y: Math.random() * A.yl * 0.6, r: 0.5 + Math.random() * 1.3, ph: Math.random() * 6.28});
  var S = A.stage, bal = [[S[0] - S[2] / 2 + 6, S[1]], [S[0] + S[2] / 2 - 6, S[1]]].map(function (p, j) { var b = []; for (var q = 0; q < 4; q++) b.push({dx: (q - 1.5) * 13, dy: -(ph ? 46 : 60) - (q % 2) * 16, c: [NAVY, GOLD, '#FFFFFF', '#7FB8F0'][(q + j) % 4], r: ph ? 9 : 12, ph: q * 1.7 + j * 3}); return {x: p[0], y: p[1], b: b}; });
  var mom = null, extra = [];
  function capPos(g, t) { // the flight of a graduate's cap during the moment
    var T = t - mom.t0 - g.dl; if (T <= 0) return null; var D = 3.6; if (T > D) return null; var u = T / D, hy = g.y - 40 * g.s, peak = H * (ph ? 0.18 : 0.12) + g.k * H * 0.2;
    return {x: g.x + Math.sin(u * Math.PI) * g.dx, y: hy - (hy - peak) * Math.sin(u * Math.PI), rot: Math.sin(u * 9 + g.k * 6) * 0.6, spin: u * 12 + g.k * 3}; }
  function grad(c, g, t) {
    var s = g.s, x = g.x, y = g.y - 13 * s, bob = Math.sin(t * 1.2 + g.ph) * 0.6 * s, look = Math.sin(t * 0.35 + g.ph * 2) * 0.12 + (mom && t - mom.t0 < 1 ? -0.1 : 0);
    c.fillStyle = g.gown; c.beginPath(); c.moveTo(x - 12 * s, y); c.quadraticCurveTo(x - 12 * s, y - 15 * s, x, y - 16 * s + bob); c.quadraticCurveTo(x + 12 * s, y - 15 * s, x + 12 * s, y); c.fill();
    c.save(); c.translate(x, y - 22 * s + bob); c.rotate(look); c.fillStyle = g.hair; c.beginPath(); c.arc(0, 0, 7.4 * s, 0, 7); c.fill(); c.fillStyle = '#F2C7A6'; c.beginPath(); c.arc(-7 * s, 1 * s, 2 * s, 0, 7); c.arc(7 * s, 1 * s, 2 * s, 0, 7); c.fill();
    var fly = mom ? capPos(g, t) : null; if (!fly) n5_cap(c, 0, -5 * s, 10 * s, 0, 0, NAVY, GOLD, t * 2.4 + g.ph); c.restore(); }
  function diploma(c, t) {
    var T = t - mom.t0 - 1.2; if (T <= 0) return; var a = T > 6.2 ? Math.max(0, 1 - (T - 6.2) / 0.8) : Math.min(1, T * 3); if (a <= 0) return;
    var cx = W * (ph ? 0.5 : 0.46), cy = H * (ph ? 0.235 : 0.2), L = (ph ? 0.8 : 0.34) * W, hh = ph ? 50 : 72, u = m5_ease(T / 1.4), half = 10 + (L / 2 - 10) * u;
    c.save(); c.globalAlpha = a; c.translate(cx, cy + Math.sin(t * 1.5) * 3); c.rotate(-0.03);
    c.fillStyle = 'rgba(40,30,20,0.18)'; c.fillRect(-half + 4, -hh / 2 + 6, half * 2, hh);
    var g = c.createLinearGradient(0, -hh / 2, 0, hh / 2); g.addColorStop(0, '#FFFBEE'); g.addColorStop(1, '#F2E2BC'); c.fillStyle = g; c.fillRect(-half, -hh / 2, half * 2, hh);
    c.strokeStyle = 'rgba(180,140,70,0.6)'; c.lineWidth = 1.4; c.strokeRect(-half + 6, -hh / 2 + 6, half * 2 - 12, hh - 12);
    if (u > 0.6) { var ta = (u - 0.6) / 0.4; c.globalAlpha = a * ta; c.fillStyle = '#6A5030'; c.font = '700 ' + (ph ? 11 : 15) + 'px Lexend, Georgia, serif'; c.textAlign = 'center'; c.fillText('Diploma', L * 0.1, -hh * 0.1); c.fillStyle = 'rgba(106,80,48,0.45)'; c.fillRect(L * 0.1 - L * 0.18, hh * 0.08, L * 0.36, 2); c.fillRect(L * 0.1 - L * 0.12, hh * 0.2, L * 0.24, 2); c.globalAlpha = a; }
    [-1, 1].forEach(function (sd) { var rx = sd * half, rg = c.createLinearGradient(rx - 8, 0, rx + 8, 0); rg.addColorStop(0, '#E8D2A0'); rg.addColorStop(0.5, '#FFF8E6'); rg.addColorStop(1, '#D8BE88'); c.fillStyle = rg; c.beginPath(); c.ellipse(rx, 0, 9, hh / 2 + 4, 0, 0, 7); c.fill(); c.fillStyle = '#C9A866'; c.beginPath(); c.ellipse(rx, -hh / 2 - 3, 9, 3.4, 0, 0, 7); c.ellipse(rx, hh / 2 + 3, 9, 3.4, 0, 0, 7); c.fill(); });
    // ribbon and seal, a third of the way along
    c.translate(-half * 0.6, 0); c.fillStyle = MAR; c.fillRect(-6, -hh / 2 - 2, 12, hh + 4); c.beginPath(); c.moveTo(-4, hh * 0.3); c.lineTo(-14, hh * 0.85); c.lineTo(-6, hh * 0.78); c.lineTo(-2, hh * 0.92); c.closePath(); c.moveTo(4, hh * 0.3); c.lineTo(14, hh * 0.85); c.lineTo(6, hh * 0.78); c.lineTo(2, hh * 0.92); c.closePath(); c.fill();
    c.fillStyle = MAR; c.beginPath(); c.ellipse(-10, -2, 9, 5, -0.5, 0, 7); c.ellipse(10, -2, 9, 5, 0.5, 0, 7); c.fill();
    var sg = c.createRadialGradient(-3, -3, 1, 0, 0, 11); sg.addColorStop(0, '#FFE9A0'); sg.addColorStop(1, '#D9A030'); c.fillStyle = sg; c.beginPath(); for (var k = 0; k < 16; k++) { var aa = k / 16 * 6.283, rr = k % 2 ? 9 : 11; c.lineTo(Math.cos(aa) * rr, 6 + Math.sin(aa) * rr); } c.fill();
    c.fillStyle = '#FFF6D0'; c.beginPath(); c.arc(0, 6, 4, 0, 7); c.fill();
    c.restore(); }
  return {
    step: function (dt, t, f) {
      conf.step(dt, f);
      if (mom && t - mom.t0 > 9) { mom = null; extra = []; }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s;
      if (dk) { stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * 1.2 + s.ph); m5_dot(ca, starG, s.x, s.y, s.r * 3, 0.5 * a); ca.fillStyle = 'rgba(240,244,255,' + (0.5 + 0.5 * a) + ')'; ca.beginPath(); ca.arc(s.x, s.y, s.r, 0, 7); ca.fill(); });
        var M = [W * (ph ? 0.15 : 0.16), H * (ph ? 0.14 : 0.14), ph ? 18 : 24]; ca.fillStyle = '#FFF6E0'; ca.beginPath(); ca.arc(M[0], M[1], M[2], 0, 7); ca.fill(); ca.fillStyle = 'rgba(220,210,190,0.5)'; ca.beginPath(); ca.arc(M[0] - 6, M[1] - 4, M[2] * 0.2, 0, 7); ca.arc(M[0] + 7, M[1] + 6, M[2] * 0.15, 0, 7); ca.fill(); m5_face(ca, M[0], M[1] + 2, M[2], !mom, 1, !!mom);
        A.wins.forEach(function (w, j) { if (w.k > 0.7) return; var fl = 0.8 + 0.2 * Math.sin(tt * 0.5 + j); ca.fillStyle = 'rgba(255,206,140,' + (0.8 * fl) + ')'; ca.beginPath(); ca.moveTo(w.x, w.y + w.h); ca.lineTo(w.x, w.y + w.w / 2); ca.arc(w.x + w.w / 2, w.y + w.w / 2, w.w / 2, Math.PI, 0); ca.lineTo(w.x + w.w, w.y + w.h); ca.fill(); m5_dot(ca, winG, w.x + w.w / 2, w.y + w.h / 2, w.w * 1.4, 0.6 * fl); }); }
      // the clock: the minute hand ticks round once a minute
      var C = A.clock, sec = Math.floor(tt), mnA = (sec % 60) / 60 * Math.PI * 2 - Math.PI / 2 + Math.min(1, (tt - sec) * 8) * Math.PI / 30, hrA = -Math.PI / 2 + Math.PI * 1.65 + (tt / 720) * Math.PI * 2;
      ca.fillStyle = dk ? '#FFF2C8' : '#FFFFFF'; ca.beginPath(); ca.arc(C[0], C[1], C[2], 0, 7); ca.fill(); if (dk) m5_dot(ca, winG, C[0], C[1], C[2] * 2.4, 0.7);
      ca.fillStyle = '#3A3A5A'; for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2; ca.beginPath(); ca.arc(C[0] + Math.cos(a) * C[2] * 0.8, C[1] + Math.sin(a) * C[2] * 0.8, k % 3 ? 0.7 : 1.3, 0, 7); ca.fill(); }
      ca.strokeStyle = '#2A2A44'; ca.lineCap = 'round'; ca.lineWidth = 2; ca.beginPath(); ca.moveTo(C[0], C[1]); ca.lineTo(C[0] + Math.cos(hrA) * C[2] * 0.5, C[1] + Math.sin(hrA) * C[2] * 0.5); ca.stroke(); ca.lineWidth = 1.3; ca.beginPath(); ca.moveTo(C[0], C[1]); ca.lineTo(C[0] + Math.cos(mnA) * C[2] * 0.78, C[1] + Math.sin(mnA) * C[2] * 0.78); ca.stroke();
      ca.fillStyle = GOLD; ca.beginPath(); ca.arc(C[0], C[1], 1.6, 0, 7); ca.fill();
      // the school pennant on the cupola
      n5_flag(ca, A.flag[0] + 1, A.flag[1], ph ? 16 : 22, ph ? 9 : 12, 1, tt, [[NAVY, 1], [GOLD, 1]], 1.5, 0);
      if (mom) diploma(ca, t);
      // banners on their poles
      A.bans.forEach(function (b, j) { var sw = Math.sin(tt * 1.1 + j * 1.4) * 0.06 + Math.sin(tt * 2.3 + j) * 0.02, w = b.w, h = b.h, col = j % 2 ? NAVY : MAR;
        cb.fillStyle = dk ? '#8E8AB0' : '#5A5A78'; cb.fillRect(b.x - w * 0.62, b.y - 2, w * 1.24, 3);
        cb.save(); cb.translate(b.x, b.y); cb.transform(1, 0, sw, 1, 0, 0); var g = cb.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, n5_light(col, 0.12)); g.addColorStop(1, n5_dark(col, 0.12)); cb.fillStyle = g;
        cb.beginPath(); cb.moveTo(-w / 2, 0); cb.lineTo(w / 2, 0); cb.lineTo(w / 2, h); cb.lineTo(0, h - w * 0.35); cb.lineTo(-w / 2, h); cb.closePath(); cb.fill();
        cb.fillStyle = GOLD; cb.fillRect(-w / 2, h * 0.06, w, 2); cb.fillRect(-w / 2, h * 0.7, w, 2);
        cb.save(); cb.translate(0, h * 0.36); var s2 = w / 24; cb.scale(s2, s2); cb.beginPath(); cb.moveTo(-7, -7); cb.lineTo(7, -7); cb.lineTo(7, 1); cb.quadraticCurveTo(7, 7, 0, 10); cb.quadraticCurveTo(-7, 7, -7, 1); cb.closePath(); cb.fill(); cb.fillStyle = col; cb.fillRect(-4, -3, 8, 1.6); cb.fillRect(-4, 0.5, 8, 1.6); cb.restore();
        cb.restore(); });
      // rows of chairs, back to front, with graduates in them
      rows.forEach(function (R) { cb.fillStyle = chairS; cb.fill(R.sh); R.g.forEach(function (g) { grad(cb, g, tt); }); cb.fillStyle = chairC; cb.fill(R.p); });
      // balloons tied at the stage corners
      bal.forEach(function (B) { B.b.forEach(function (o, q) { var tug = Math.max(0, Math.sin(tt * 0.7 + o.ph)) * 6, bx = B.x + o.dx + Math.sin(tt * 0.9 + o.ph) * 5, by = B.y + o.dy + Math.sin(tt * 1.3 + o.ph) * 3 - tug;
        cb.strokeStyle = dk ? 'rgba(220,220,255,0.5)' : 'rgba(60,60,90,0.45)'; cb.lineWidth = 0.9; cb.beginPath(); cb.moveTo(B.x, B.y); cb.quadraticCurveTo((B.x + bx) / 2 - Math.sin(tt + q) * 5, (B.y + by) / 2, bx, by + o.r * 1.15); cb.stroke(); n5_blit(cb, n5_balloonImg(o.c, o.r), bx, by, 1, Math.sin(tt * 0.9 + o.ph) * 0.1); }); });
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.bans.forEach(function (b, j) { if (j > 1) return; m5_dot(cb, lampG, b.x, b.y - 8, 40, 0.5 + 0.1 * Math.sin(tt * 2 + j)); }); cb.restore();
        var a0 = A.bans[0], a1 = A.bans[1]; for (var q = 1; q < 16; q++) { var u = q / 16, lx = a0.x + (a1.x - a0.x) * u, ly = a0.y - 6 + 30 * 4 * u * (1 - u); m5_dot(cb, bulbG, lx, ly, 9, 0.5 + 0.4 * Math.sin(tt * 2 + q)); cb.fillStyle = '#FFF2C0'; cb.beginPath(); cb.arc(lx, ly, 1.6, 0, 7); cb.fill(); } }
      // flying caps
      if (mom) { grads.concat(extra).forEach(function (g) { var p = capPos(g, t); if (p) n5_cap(cb, p.x, p.y, 10 * g.s * (g.big || 1.15), p.rot, p.spin, NAVY, GOLD, tt * 6 + g.ph); }); }
      conf.draw(cb);
    },
    finish: function (t) { if (mom) return; mom = {t0: t}; grads.forEach(function (g) { g.dl = Math.random() * 0.35; g.dx = (Math.random() - 0.5) * 120; g.k = Math.random(); });
      extra = []; for (var i = 0; i < (ph ? 10 : 20); i++) { var sx = Math.random() * W; extra.push({x: sx, y: H + 60, s: ph ? 1 : 1.3, ph: Math.random() * 6, dl: 0.2 + Math.random() * 0.6, dx: (Math.random() - 0.5) * 200, k: Math.random(), big: 1.2}); }
      conf.burst(A.stage[0], A.stage[1] - 40, -Math.PI / 2, 1.6, ph ? 40 : 70, ph ? 380 : 520); }
  };
};
UIC.graduation = {L: ['#2E4A8A', '#1E3366', 'rgba(255,255,255,0.86)', '#16213A', '#566078', '#2E4A8A', '#2E4A8A', '#4A6AB0', '#FFFFFF'], D: ['#22305A', '#141E3A', 'rgba(20,30,58,0.80)', '#EEF2FC', '#A8B4D4', '#F2C85A', '#F2C85A', '#F6DA8A', '#141E3A']};

// a llama pinata with rainbow fringe; turn (-1..1) is how far it has turned (it flips to show its other side)
var n5_FRINGE = ['#FF8FB8', '#FFD45A', '#5CCFC0', '#B58CF2', '#FF9F5A'];
function n5_llama(c, x, y, s, t, turn, happy) {
  var sx = Math.abs(turn) < 0.18 ? (turn < 0 ? -0.18 : 0.18) : turn; c.save(); c.translate(x, y); c.scale(s * sx, s);
  function fr(x0, y0, w, h, rows, off) { for (var r = 0; r < rows; r++) { var yy = y0 + r * h / rows; c.fillStyle = n5_FRINGE[(r + off) % 5]; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy); c.lineTo(x0 + w, yy + h / rows + 2); for (var q = w; q > 0; q -= 5) c.lineTo(x0 + q, yy + h / rows + (q % 10 ? 4.5 : 2)); c.lineTo(x0, yy + h / rows + 3); c.fill(); } }
  // legs
  [-22, -10, 12, 22].forEach(function (lx, j) { fr(lx - 4.5, 10, 9, 22, 3, j); });
  // body and neck
  fr(-32, -16, 60, 30, 5, 0); fr(14, -52, 16, 40, 6, 2);
  // head and ears
  c.save(); c.translate(24, -56); c.rotate(Math.sin(t * 0.9) * 0.05);
  c.fillStyle = '#FFF4E6'; c.beginPath(); c.moveTo(-6, -8); c.lineTo(-4, -22); c.lineTo(1, -10); c.moveTo(4, -10); c.lineTo(9, -22); c.lineTo(11, -8); c.fill(); c.fillStyle = '#FFB3C6'; c.beginPath(); c.moveTo(-4.4, -10); c.lineTo(-3.6, -18); c.lineTo(-1, -10.5); c.moveTo(6, -10.5); c.lineTo(8.6, -18); c.lineTo(9.4, -10); c.fill();
  c.fillStyle = '#FFF4E6'; c.beginPath(); c.ellipse(3, 0, 12, 10, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(12, 3, 7, 6, 0, 0, 7); c.fill();
  c.fillStyle = n5_FRINGE[0]; c.beginPath(); c.ellipse(1, -9, 7, 3.4, 0, 0, 7); c.fill(); c.fillStyle = n5_FRINGE[1]; c.beginPath(); c.arc(-4, -10, 2.2, 0, 7); c.arc(6, -10, 2.2, 0, 7); c.fill();
  m5_eyes(c, 5, -1, 3.2, 1.5, happy ? 1 : m5_blinkAt(t, 9), happy); c.fillStyle = m5_BLUSH; c.beginPath(); c.ellipse(0, 3.5, 2.4, 1.4, 0, 0, 7); c.ellipse(12, 3.5, 2.4, 1.4, 0, 0, 7); c.fill();
  c.strokeStyle = '#3A2A3A'; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.arc(13.5, 4.5, 1.6, 0.2, Math.PI - 0.2); c.stroke();
  c.restore();
  // tail tuft
  c.fillStyle = n5_FRINGE[3]; c.beginPath(); c.ellipse(-34, -12, 5, 7, -0.5, 0, 7); c.fill();
  c.restore(); }
// a party hat (cone) at x, y (brim centre)
function n5_hat(c, x, y, s, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.moveTo(-6, 0); c.lineTo(0, -15); c.lineTo(6, 0); c.quadraticCurveTo(0, 2, -6, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.moveTo(-3.6, -5); c.lineTo(3.6, -5); c.lineTo(2.4, -8); c.lineTo(-2.4, -8); c.fill(); c.fillStyle = '#FFD45A'; c.beginPath(); c.arc(0, -15.5, 2.4, 0, 7); c.fill(); c.restore(); }

// ---------- Birthday Bash: balloons bob and tug at their strings, streamers sway, party lights blink in a chase, the pinata turns slowly, candles flicker.
// Moment: a party popper bursts confetti, the top gift box pops open, and balloons float up out of it.
ENGINES.birthday = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, BC = dk ? ['#FF7FA8', '#7FE0C8', '#FFD86B', '#C6A0FF', '#7FC8FF', '#FF9F6A'] : ['#FF8FB8', '#7FD8C0', '#FFD45A', '#B58CF2', '#7FC8F0', '#FF9F7A'];
  var conf = n5_confetti(W, H, BC.concat(['#FFFFFF'])); conf.drift(ph ? 12 : 22);
  var bulbG = m5_rg('rgba(255,230,170,0.75)', 1), candleG = m5_rg('rgba(255,200,110,0.6)', 1, [0.3, 0.3]), lampG = m5_rg('rgba(255,220,150,0.5)', 1, [0.3, 0.22]), starG = m5_rg('rgba(255,250,230,0.8)', 1);
  var Wn = A.win, stars = []; if (dk) for (var i = 0; i < 12; i++) stars.push({x: Wn[0] + 6 + Math.random() * (Wn[2] - Wn[0] - 12), y: Wn[1] + 6 + Math.random() * (Wn[3] - Wn[1] - 12), ph: Math.random() * 6.28});
  // balloons floating at the ceiling (left and right) and a bunch tied to the table
  function bunch(x, y, n, r, ceil, off) { var b = []; for (var q = 0; q < n; q++) b.push({dx: (q - (n - 1) / 2) * r * 1.5 + Math.sin(q * 2.1) * r * 0.3, dy: ceil ? r * 1.2 + (q % 2) * r * 0.9 : -r * 3 - (q % 2) * r * 1.2 - Math.abs(q - (n - 1) / 2) * -r * 0.3, c: BC[(q + off) % 6], r: r * (0.92 + (q % 3) * 0.06), ph: q * 1.7 + off}); return {x: x, y: y, b: b, ceil: ceil}; }
  var R0 = ph ? 13 : 18, bunches = [bunch(W * (ph ? 0.12 : 0.05), 0, ph ? 4 : 5, R0, true, 0), bunch(W * (ph ? 0.9 : 0.94), 0, ph ? 4 : 5, R0, true, 2), bunch(A.table[0] + (ph ? 40 : 62), A.table[1] - 2, 3, R0 * 0.85, false, 4)];
  if (!ph) bunches.push(bunch(W * 0.58, 0, 3, R0 * 0.9, true, 1));
  var G = A.gift, mom = null, risers = [], pop = null, BG = {};
  function bulbOf(col, on) { var k = col + on; return BG[k] || (BG[k] = m5_rg(rgba(col, on ? 0.75 : 0.35), 1)); }
  function cake(c, t) { var x = A.cake[0], y = A.cake[1], s = A.cake[2]; c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = dk ? '#E8DDF2' : '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, 40, 6, 0, 0, 7); c.fill();
    var g = c.createLinearGradient(-34, 0, 34, 0); g.addColorStop(0, '#FFB8D0'); g.addColorStop(0.5, '#FFD0E0'); g.addColorStop(1, '#F49AB8'); c.fillStyle = g; c.fillRect(-34, -28, 68, 28); c.beginPath(); c.ellipse(0, 0, 34, 5, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, -28, 34, 6, 0, 0, 7); c.fill(); c.beginPath(); for (var q = -34; q <= 34; q += 8.5) { c.moveTo(q, -28); c.arc(q + 4.25, -28, 4.25, 0, Math.PI); } c.fill(); [-24, -6, 14, 28].forEach(function (dx, j) { c.beginPath(); c.ellipse(dx, -21 + (j % 2) * 3, 2.6, 5 + (j % 2) * 2, 0, 0, 7); c.fill(); });
    var g2 = c.createLinearGradient(-24, 0, 24, 0); g2.addColorStop(0, '#9FE0D0'); g2.addColorStop(0.5, '#C6F0E4'); g2.addColorStop(1, '#7FD0BC'); c.fillStyle = g2; c.fillRect(-23, -50, 46, 22); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, -50, 23, 4.5, 0, 0, 7); c.fill(); c.beginPath(); for (q = -23; q <= 23; q += 7.6) { c.moveTo(q, -50); c.arc(q + 3.8, -50, 3.8, 0, Math.PI); } c.fill();
    var SP = ['#FF5A7A', '#FFD45A', '#5AB8F0', '#B58CF2', '#5CCF8A']; for (q = 0; q < 16; q++) { c.fillStyle = SP[q % 5]; c.save(); c.translate(-30 + (q * 37) % 60, -16 + (q * 13) % 12); c.rotate(q); c.fillRect(-1.6, -0.6, 3.2, 1.2); c.restore(); }
    for (q = 0; q < 5; q++) { var cx = -16 + q * 8, ch = 14; c.fillStyle = SP[q]; c.fillRect(cx - 1.5, -50 - ch, 3, ch); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(cx - 1.5, -50 - ch + 3, 3, 1.4); c.fillRect(cx - 1.5, -50 - ch + 8, 3, 1.4);
      var fl = flick(t * 1.4, q * 1.3), fy = -50 - ch - 2; m5_dot(c, candleG, cx, fy - 3, dk ? 16 : 9, dk ? 0.8 : 0.5); c.fillStyle = '#FFB53A'; c.beginPath(); c.moveTo(cx - 2.6, fy); c.quadraticCurveTo(cx - 2.6 + Math.sin(t * 9 + q) * 0.6, fy - 6 - fl * 3, cx + Math.sin(t * 7 + q) * 0.8, fy - 8 - fl * 3); c.quadraticCurveTo(cx + 2.6, fy - 4, cx + 2.6, fy); c.fill(); c.fillStyle = '#FFF4C0'; c.beginPath(); c.ellipse(cx, fy - 2, 1.2, 2.4, 0, 0, 7); c.fill(); }
    c.restore(); }
  function gift(c, t) { var x = G[0], y = G[1], w = G[2], h = G[3], T = mom ? t - mom.t0 : -1, lh = Math.min(h * 0.24, 12), wob = T > 0.8 && T < 1.4 ? Math.sin((T - 0.8) * 40) * 0.05 : 0;
    c.save(); c.translate(x, y); c.rotate(wob);
    var g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, dk ? '#8A5AD0' : '#C6A0FF'); g.addColorStop(1, dk ? '#6A3AB0' : '#9F78E8'); c.fillStyle = g; c.fillRect(-w / 2, -h, w, h);
    c.fillStyle = dk ? '#F2E6FF' : '#FFFFFF'; c.fillRect(-w * 0.08, -h, w * 0.16, h); c.fillStyle = 'rgba(255,255,255,0.25)'; for (var q = 0; q < 4; q++) { c.beginPath(); c.arc(-w * 0.3 + (q % 2) * w * 0.6, -h * 0.25 - Math.floor(q / 2) * h * 0.45, 3, 0, 7); c.fill(); }
    c.restore();
    // the lid: pops off and tumbles away during the moment
    var lx = x, ly = y - h, lr = 0, la = 1; if (T > 1.4 && T < 3.6) { var u = T - 1.4; lx = x + u * 70; ly = y - h - u * 260 + u * u * 230; lr = u * 4; }
    // after the moment a fresh lid settles back on, so the scene returns to normal smoothly
    if (T >= 3.6 && T < 7.4) return; if (T >= 7.4) { var k = Math.min(1, (T - 7.4) / 0.7); ly = y - h - (1 - k) * 26; la = k; }
    c.save(); c.globalAlpha = la; c.translate(lx, ly); c.rotate(lr);
    c.fillStyle = dk ? '#7A4AC0' : '#B58CF2'; c.beginPath(); c.rect(-w / 2 - 4, -lh, w + 8, lh); c.fill(); c.fillStyle = dk ? '#F2E6FF' : '#FFFFFF'; c.fillRect(-w * 0.08, -lh, w * 0.16, lh);
    c.fillStyle = '#FFD45A'; c.beginPath(); c.ellipse(-w * 0.17, -lh - 6, w * 0.17, 6, -0.35, 0, 7); c.ellipse(w * 0.17, -lh - 6, w * 0.17, 6, 0.35, 0, 7); c.fill(); c.fillStyle = '#F2B83A'; c.beginPath(); c.arc(0, -lh - 4, 4.5, 0, 7); c.fill();
    c.restore(); }
  function popper(c, t) { var T = t - pop.t0; if (T > 5) return; var a = Math.min(1, T * 5) * (T > 4 ? Math.max(0, 5 - T) : 1), kick = T > 0.5 && T < 0.8 ? Math.sin((T - 0.5) / 0.3 * Math.PI) * 5 : 0;
    c.save(); c.globalAlpha = a; c.translate(pop.x, pop.y); c.rotate(pop.ang); c.translate(-kick, 0);
    var g = c.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, '#FFD45A'); g.addColorStop(1, '#F29A3A'); c.fillStyle = g; c.beginPath(); c.moveTo(-22, 0); c.lineTo(10, -11); c.lineTo(10, 11); c.closePath(); c.fill();
    c.fillStyle = '#FF7FA8'; for (var q = 0; q < 3; q++) { c.beginPath(); c.moveTo(-12 + q * 8, -4 - q * 2.7); c.lineTo(-8 + q * 8, -5.4 - q * 2.7); c.lineTo(-8 + q * 8, 5.4 + q * 2.7); c.lineTo(-12 + q * 8, 4 + q * 2.7); c.fill(); }
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(10, 0, 3, 11, 0, 0, 7); c.fill();
    if (T > 0.5 && T < 0.9) { c.fillStyle = 'rgba(255,255,255,' + (1 - (T - 0.5) / 0.4) + ')'; c.beginPath(); c.arc(18, 0, 5 + (T - 0.5) * 60, 0, 7); c.fill(); }
    c.restore(); }
  function lights(c, t) { var y0 = H * (ph ? 0.035 : 0.05), n = ph ? 2 : 3, seg = W / n, k = 0;
    for (var s2 = 0; s2 < n; s2++) { var x0 = s2 * seg, x1 = x0 + seg, sag = H * (ph ? 0.06 : 0.08);
      c.strokeStyle = dk ? 'rgba(40,20,60,0.8)' : 'rgba(120,80,110,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0); c.stroke();
      for (var q = 1; q < 10; q++, k++) { var u = q / 10, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = y0 + 2 * (1 - u) * u * sag * 2 + 5, on = ((k + Math.floor(t * 5)) % 4 === 0) || (mom && t - mom.t0 < 6 && (k + Math.floor(t * 12)) % 2 === 0), col = BC[k % 6];
        c.fillStyle = dk ? '#3A2A40' : '#8A7080'; c.fillRect(x - 2, y - 6, 4, 4);
        if (on || dk) m5_dot(c, bulbOf(col, on), x, y + 3, on ? 18 : 10, 1);
        c.fillStyle = on ? n5_light(col, 0.4) : (dk ? n5_dark(col, 0.25) : col); c.beginPath(); c.ellipse(x, y + 3, 3.4, 4.6, 0, 0, 7); c.fill(); } } }
  function banner(c, t) { var word = ph ? 'HAPPY BDAY!' : 'HAPPY BIRTHDAY', x0 = W * (ph ? 0.06 : 0.22), x1 = W * (ph ? 0.94 : 0.78), y0 = H * (ph ? 0.12 : 0.155), sag = H * 0.025 + Math.sin(t * 0.8) * 2, n = word.length, pw = (x1 - x0) / (n + 1) * 0.86;
    c.strokeStyle = dk ? 'rgba(230,210,255,0.6)' : 'rgba(120,80,110,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0); c.stroke();
    c.font = '800 ' + Math.round(pw * 0.62) + 'px Lexend, Arial Rounded MT Bold, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (var q = 0; q < n; q++) { if (word[q] === ' ') continue; var u = (q + 1) / (n + 1), x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = y0 + 2 * (1 - u) * u * sag * 2, sw = Math.sin(t * 1.6 + q * 0.7) * 0.12;
      c.save(); c.translate(x, y); c.rotate(sw); c.fillStyle = BC[q % 6]; c.beginPath(); c.moveTo(-pw / 2, 0); c.lineTo(pw / 2, 0); c.lineTo(pw / 2, pw * 1.05); c.lineTo(0, pw * 1.35); c.lineTo(-pw / 2, pw * 1.05); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(-pw / 2, 0, pw * 0.22, pw * 1.05); c.fillStyle = '#FFFFFF'; c.fillText(word[q], 0, pw * 0.56); c.restore(); } }
  function streamers(c, t) { var cols = [BC[0], BC[1], BC[3], BC[4]];
    // twisted crepe streamers swagging from the ceiling corners
    [[0, H * 0.02, W * 0.5, H * 0.03, 0], [W, H * 0.02, W * 0.5, H * 0.03, 1]].forEach(function (q, j) { var sag = H * (ph ? 0.1 : 0.14) + Math.sin(t * 0.7 + j) * 4; for (var k = 0; k < 2; k++) { c.strokeStyle = cols[j * 2 + k]; c.lineWidth = ph ? 4 : 5; c.setLineDash([7, 3]); c.lineDashOffset = -t * 4 * (k ? 1 : -1); c.beginPath(); c.moveTo(q[0], q[1] + k * 6); c.quadraticCurveTo((q[0] + q[2]) / 2, q[1] + sag * 2 - k * 10, q[2], q[3] + k * 6); c.stroke(); } });
    c.setLineDash([]);
    // curly streamers hanging down
    (ph ? [0.3, 0.7] : [0.12, 0.34, 0.66, 0.79]).forEach(function (fx, j) { var x = W * fx, L = H * (ph ? 0.1 : 0.16) + (j % 2) * 20; c.strokeStyle = cols[j % 4]; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); for (var q = 0; q <= 30; q++) { var u = q / 30, xx = x + Math.sin(u * 14 + t * 2 + j) * (4 + u * 5) + Math.sin(t * 0.9 + j) * u * 10, yy = u * L; if (q) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); }); }
  function balloons(c, t) { bunches.forEach(function (B) { B.b.forEach(function (o, q) { var tug = B.ceil ? 0 : Math.max(0, Math.sin(t * 0.8 + o.ph)) * 5, bx = B.x + o.dx + Math.sin(t * 0.7 + o.ph) * 5, by = B.y + o.dy + Math.sin(t * 1.1 + o.ph) * 4 - tug, img = n5_balloonImg(o.c, o.r);
      c.strokeStyle = dk ? 'rgba(230,210,255,0.5)' : 'rgba(120,80,110,0.45)'; c.lineWidth = 1; c.beginPath();
      if (B.ceil) { var L = o.r * 4 + q % 2 * 20; c.moveTo(bx, by + o.r * 1.15); c.bezierCurveTo(bx + Math.sin(t + q) * 8, by + L * 0.4, bx - Math.sin(t * 1.3 + q) * 8, by + L * 0.7, bx + Math.sin(t * 0.8 + q) * 5, by + L); c.stroke(); n5_blit(c, img, bx, by, 1, Math.sin(t * 0.6 + o.ph) * 0.08); }
      else { c.moveTo(B.x, B.y); c.quadraticCurveTo((B.x + bx) / 2 + Math.sin(t + q) * 5, (B.y + by) / 2 + 10, bx, by + o.r * 1.15); c.stroke(); n5_blit(c, img, bx, by, 1, Math.sin(t * 0.9 + o.ph) * 0.1); } }); }); }
  return {
    step: function (dt, t, f) { conf.step(dt, f);
      risers.forEach(function (r) { r.y -= r.v * dt; r.v = Math.min(r.v + dt * 30, 140); }); risers = risers.filter(function (r) { return r.y > -80; });
      if (pop && !pop.fired && t - pop.t0 > 0.5) { pop.fired = 1; conf.burst(pop.x + Math.cos(pop.ang) * 14, pop.y + Math.sin(pop.ang) * 14, pop.ang, 0.8, ph ? 50 : 90, ph ? 380 : 560); }
      if (mom && !mom.out && t - mom.t0 > 1.5) { mom.out = 1; for (var q = 0; q < 5; q++) risers.push({x: G[0] + (q - 2) * G[2] * 0.22, y: G[1] - G[3] - 10, v: 30 + q * 7, c: BC[q], r: (ph ? 14 : 21) * (0.9 + (q % 2) * 0.15), ph: q * 1.4, dx: (q - 2) * (ph ? 14 : 26)}); }
      if (mom && t - mom.t0 > 9) { mom = null; pop = null; } },
    draw: function (ca, cb, t, f) { var tt = t * f.s;
      if (dk) { stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * 1.4 + s.ph); m5_dot(ca, starG, s.x, s.y, 4, 0.6 * a); }); var mx = Wn[2] - (Wn[2] - Wn[0]) * 0.28, my = Wn[1] + (Wn[3] - Wn[1]) * 0.28, mr = (Wn[2] - Wn[0]) * 0.1; ca.fillStyle = '#FFF4D8'; ca.beginPath(); ca.arc(mx, my, mr, 0, 7); ca.fill(); m5_face(ca, mx, my + 1, mr, true, 1, false);
        m5_dot(ca, lampG, A.lamp[0], A.lamp[1], 120, 0.9); }
      streamers(ca, tt); banner(ca, tt);
      // the pinata, turning slowly on its string
      // (it hangs in the top strip, clear of the banner, so the board never hides it; the string is tied to the middle of its back)
      var px = W * (ph ? 0.48 : 0.87), py = H * (ph ? 0.29 : 0.25), ls = ph ? 0.75 : 0.95, sw = Math.sin(tt * 0.6) * 0.06, ly = py - 4 + (mom ? -Math.abs(Math.sin((t - mom.t0) * 6)) * 6 * Math.max(0, 1 - (t - mom.t0) / 3) : 0);
      ca.save(); ca.translate(px, 0); ca.rotate(-sw); ca.strokeStyle = dk ? 'rgba(230,210,255,0.6)' : 'rgba(120,80,110,0.6)'; ca.lineWidth = 1.1; ca.beginPath(); ca.moveTo(0, -4); ca.lineTo(0, ly - 15 * ls); ca.stroke();
      n5_llama(ca, 0, ly, ls, tt, (function (q) { return (q < 0 ? -1 : 1) * (0.3 + 0.7 * Math.sqrt(Math.abs(q))); })(Math.cos(tt * 0.3)), !!mom);
      ca.fillStyle = dk ? '#C9B8E0' : '#A88A9A'; ca.beginPath(); ca.arc(0, ly - 16 * ls, 1.8, 0, 7); ca.fill(); ca.restore();
      lights(cb, tt);
      cake(cb, tt);
      // the cat in a party hat beside the gifts
      var cx = A.gifts[0] - (ph ? 70 : 112), cy = A.gifts[1] - 2, cs = ph ? 1.2 : 1.7, look = Math.sin(tt * 0.4) * 0.15 - 0.1; m5_cat(cb, cx, cy, cs, 1, tt, ['#F6F0EA', '#E8A060'], 'sit', Math.sin(tt * 1.4) * 0.6, look, false, !!mom); n5_hat(cb, cx + 1 * cs + Math.sin(look) * 6, cy - 31 * cs, cs, look + 0.15, BC[3]);
      gift(cb, t);
      balloons(cb, tt);
      risers.forEach(function (r) { var bx = r.x + r.dx * Math.min(1, (G[1] - r.y) / 120) + Math.sin(t * 1.4 + r.ph) * 8; cb.strokeStyle = dk ? 'rgba(230,210,255,0.5)' : 'rgba(120,80,110,0.45)'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(bx, r.y + r.r * 1.15); cb.quadraticCurveTo(bx + Math.sin(t * 2 + r.ph) * 6, r.y + r.r * 2.4, bx - 2, r.y + r.r * 3.4); cb.stroke(); n5_blit(cb, n5_balloonImg(r.c, r.r), bx, r.y, 1, Math.sin(t + r.ph) * 0.1); });
      if (pop) popper(cb, t);
      conf.draw(cb); },
    finish: function (t) { if (mom) return; mom = {t0: t}; pop = {t0: t, x: A.gifts[0] - (ph ? 90 : 170), y: H * 0.95, ang: -Math.PI / 2 + 0.45}; }
  };
};
UIC.birthday = {L: ['#C2508A', '#8A3466', 'rgba(255,255,255,0.86)', '#3A1E30', '#7A5A6A', '#C2407A', '#C2407A', '#8A5AD0', '#FFFFFF'], D: ['#4A2A62', '#20183A', 'rgba(40,26,64,0.80)', '#FCEFFA', '#CDB4D8', '#FF8FC8', '#FF8FC8', '#FFD86B', '#20183A']};

// one half of a geode, cut face towards us: side -1 = left half, 1 = right half; r = size, open = how much of the inside shows (0..1)
function n5_geoHalf(c, side, r, open, t) {
  c.save(); c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r * 0.8); c.ellipse(0, 0, r, r * 0.8, 0, Math.PI / 2, Math.PI * 1.5, side > 0); c.closePath();
  var g = c.createRadialGradient(side * r * 0.2, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#B8A898'); g.addColorStop(1, '#7A6A5E'); c.fillStyle = g; c.fill(); c.clip();
  if (open > 0) { c.globalAlpha = open;
    c.fillStyle = '#F4F0FA'; c.beginPath(); c.ellipse(0, 0, r * 0.8, r * 0.64, 0, 0, 7); c.fill(); c.fillStyle = '#D8C8F0'; c.beginPath(); c.ellipse(0, 0, r * 0.7, r * 0.55, 0, 0, 7); c.fill();
    var cg = c.createRadialGradient(0, 0, 1, 0, 0, r * 0.6); cg.addColorStop(0, '#FFF0FF'); cg.addColorStop(0.4, '#C47AF0'); cg.addColorStop(1, '#7A3EC8'); c.fillStyle = cg; c.beginPath(); c.ellipse(0, 0, r * 0.6, r * 0.46, 0, 0, 7); c.fill();
    for (var k = 0; k < 14; k++) { var a = k / 14 * Math.PI * 2, x0 = Math.cos(a) * r * 0.58, y0 = Math.sin(a) * r * 0.44, x1 = Math.cos(a) * r * 0.22, y1 = Math.sin(a) * r * 0.17; c.fillStyle = k % 2 ? '#E2B8FF' : '#9A5AE0'; c.beginPath(); c.moveTo(x0 + Math.sin(a) * r * 0.07, y0 - Math.cos(a) * r * 0.05); c.lineTo(x1, y1); c.lineTo(x0 - Math.sin(a) * r * 0.07, y0 + Math.cos(a) * r * 0.05); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * Math.sin(t * 5)) + ')'; c.beginPath(); c.arc(-side * r * 0.12, -r * 0.1, r * 0.05, 0, 7); c.fill(); c.globalAlpha = 1; }
  c.restore();
  c.strokeStyle = 'rgba(60,40,40,0.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, Math.PI / 2, Math.PI * 1.5, side > 0); c.stroke(); }
function n5_bat(c, x, y, s, t, awake, flap) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.8) * 0.12); c.scale(s, s);
  c.strokeStyle = '#4A3A5A'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-2, 0); c.lineTo(-2, 4); c.moveTo(2, 0); c.lineTo(2, 4); c.stroke();
  var wg = 0.25 + flap * 0.75; c.fillStyle = '#6A5A8A'; [-1, 1].forEach(function (sd) { c.beginPath(); c.moveTo(sd * 3, 6); c.quadraticCurveTo(sd * (8 + 10 * wg), 4 - wg * 4, sd * (12 + 8 * wg), 12 + wg * 2); c.quadraticCurveTo(sd * (8 + 4 * wg), 12, sd * (7 + 2 * wg), 16); c.quadraticCurveTo(sd * 5, 14, sd * 3, 17); c.fill(); });
  c.fillStyle = '#8A78AA'; c.beginPath(); c.ellipse(0, 11, 6, 8, 0, 0, 7); c.fill();
  // ears (it hangs upside down, so they point down) grow out of the head, not beside it
  c.fillStyle = '#8A78AA'; c.beginPath(); c.moveTo(-4.6, 15); c.lineTo(-6.6, 24.5); c.lineTo(-1.4, 17.6); c.moveTo(4.6, 15); c.lineTo(6.6, 24.5); c.lineTo(1.4, 17.6); c.fill(); c.fillStyle = '#FFB3C6'; c.beginPath(); c.moveTo(-4.4, 18.6); c.lineTo(-5.7, 22.8); c.lineTo(-3.1, 19.4); c.moveTo(4.4, 18.6); c.lineTo(5.7, 22.8); c.lineTo(3.1, 19.4); c.fill();
  c.save(); c.translate(0, 13); c.rotate(Math.PI); if (awake) m5_eyes(c, 0, 1, 2.4, 1.1, m5_blinkAt(t, 4), false); else { c.strokeStyle = m5_INK; c.lineWidth = 0.9; c.beginPath(); c.arc(-2.4, 0.5, 1.2, 0.2, Math.PI - 0.2); c.moveTo(3.6, 0.5); c.arc(2.4, 0.5, 1.2, 0.2, Math.PI - 0.2); c.stroke(); } m5_cheeks(c, 0, 3, 3.6, 1.1); c.restore();
  c.restore(); }

// ---------- Crystal Cave: crystals pulse with a soft glow, drips fall from stalactites and ring out in the pools, dust sparkles in the lamplight. At night only the crystals light the cave.
// Moment: a geode on the floor cracks open in two halves and spills out a shimmer of light.
ENGINES.geology = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, CC = [['rgba(170,110,255,', '#E2C8FF'], ['rgba(80,220,230,', '#C8FAFF'], ['rgba(255,120,200,', '#FFD8EE']];
  var GG = CC.map(function (c) { return m5_rg(c[0] + (dk ? '0.55)' : '0.32)'), 1, [0.35, dk ? 0.22 : 0.12]); }), sparkG = m5_rg('rgba(255,255,255,0.9)', 1), warmG = m5_rg('rgba(255,200,120,0.55)', 1, [0.3, 0.25]), starG = m5_rg('rgba(240,236,255,0.8)', 1);
  var glow = A.glow.map(function (g, i) { return {x: g.x, y: g.y, r: g.r, c: g.c, tips: g.tips, ph: hash(i + 2) * 6.28, sp: 0.5 + hash(i + 7) * 0.5}; });
  var pools = A.pools, drips = [], rip = [], motes = [], O = A.open, stars = [], tw = [];
  var tips = A.tips.filter(function (tp) { return !A.bat || Math.abs(tp[0] - A.bat[0]) > 12; }).sort(function (a, b) { var pa = pools.some(function (p) { return Math.abs(a[0] - p.x) < p.rx * 0.8; }) ? 0 : 1, pb = pools.some(function (p) { return Math.abs(b[0] - p.x) < p.rx * 0.8; }) ? 0 : 1; return pa - pb; }).slice(0, ph ? 5 : 8);
  tips.forEach(function (tp, i) { drips.push({x: tp[0], y0: tp[1], y: tp[1], v: 0, st: 0, wait: 1 + hash(i * 3) * 6}); });
  for (var i = 0; i < (ph ? 22 : 40); i++) motes.push({x: Math.random(), y: Math.random(), ph: Math.random() * 6.28, s: 0.5 + Math.random()});
  if (dk) for (i = 0; i < 24; i++) { var a = Math.random() * Math.PI, rr = Math.random() * 0.9; stars.push({x: O[0] + Math.cos(a) * O[1] * rr, y: Math.sin(a) * O[2] * rr * 0.8, ph: Math.random() * 6.28}); }
  var G = A.geode, GR = ph ? 32 : 50, mom = null, rays = [];
  function landY(x) { for (var k = 0; k < pools.length; k++) { var p = pools[k], u = (x - p.x) / p.rx; if (Math.abs(u) < 0.9) return {y: p.y, pool: p}; } return {y: A.yF(x) + 6, pool: null}; }
  function shaft(x, y) { var u = (y - O[2] * 0.7) / (H * 0.95 - O[2] * 0.7), xa = O[0] - O[1] * 0.7 + (W * (ph ? 0.1 : 0.2) - (O[0] - O[1] * 0.7)) * u, xb = O[0] + O[1] * 0.5 + (W * (ph ? 0.6 : 0.5) - (O[0] + O[1] * 0.5)) * u; return x > xa && x < xb && u > 0 && u < 1; }
  function geode(c, t) { var x = G[0], y = G[1], r = GR, T = mom ? t - mom.t0 : -1, crack = T < 0 ? 0 : Math.min(1, T / 0.8), shake = T > 0.6 && T < 1.3 ? Math.sin(T * 60) * 1.5 : 0, sp = T > 1.3 ? m5_ease((T - 1.3) / 0.7) : 0, back = T > 8 ? m5_ease((T - 8) / 0.9) : 0; sp *= 1 - back;
    c.save(); c.translate(x + shake, y - r * 0.8);
    c.fillStyle = 'rgba(20,10,30,0.3)'; c.beginPath(); c.ellipse(0, r * 0.8, r * (1.2 + sp * 0.8), r * 0.18, 0, 0, 7); c.fill();
    if (sp > 0) { // the light inside spills out
      c.save(); c.globalCompositeOperation = 'lighter'; var la = sp * (1 - back); m5_dot(c, GG[0], 0, 0, r * (3 + sp * 3.5), 0.95 * la); m5_dot(c, GG[2], 0, -r * 0.6, r * (1.5 + sp * 2), 0.6 * la); c.globalAlpha = 0.55 * la;
      var ringT = T - 1.3; if (ringT > 0 && ringT < 1.6) { c.strokeStyle = 'rgba(235,210,255,' + (0.8 * (1 - ringT / 1.6)) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, r * 0.4, r * (1 + ringT * 4), r * (0.25 + ringT), 0, 0, 7); c.stroke(); }
      for (var k = 0; k < 13; k++) { var a = -Math.PI / 2 + (k - 6) * 0.2 + Math.sin(t * 0.8 + k) * 0.05, L = r * (4.5 + 2.5 * Math.sin(t * 2 + k * 1.7)) * sp; var lg = c.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); lg.addColorStop(0, 'rgba(230,200,255,0.9)'); lg.addColorStop(1, 'rgba(200,160,255,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - 0.06) * L, Math.sin(a - 0.06) * L); c.lineTo(Math.cos(a + 0.06) * L, Math.sin(a + 0.06) * L); c.fill(); }
      c.restore(); }
    [-1, 1].forEach(function (sd) { c.save(); c.translate(sd * sp * r * 0.9, -sp * r * 0.1); c.rotate(sd * sp * 0.5); if (sp > 0) n5_geoHalf(c, sd, r, sp, t); else { c.restore(); return; } c.restore(); });
    if (sp <= 0) { var g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); g.addColorStop(0, '#C4B4A4'); g.addColorStop(1, '#7A6A5E'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(90,70,60,0.35)'; [[-0.4, 0.2, 0.16], [0.3, -0.3, 0.12], [0.45, 0.3, 0.1], [-0.1, -0.5, 0.08]].forEach(function (q) { c.beginPath(); c.arc(q[0] * r, q[1] * r, q[2] * r, 0, 7); c.fill(); });
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.4, r * 0.25, r * 0.12, -0.5, 0, 7); c.fill();
      if (crack > 0) { c.strokeStyle = '#E8D0FF'; c.lineWidth = 1.6; c.shadowColor = '#C890FF'; c.shadowBlur = 8; c.beginPath(); var n = Math.ceil(crack * 6); c.moveTo(0, -r * 0.8); for (var q = 1; q <= n; q++) c.lineTo((q % 2 ? 1 : -1) * r * 0.12, -r * 0.8 + q * r * 0.27); c.stroke(); c.shadowBlur = 0; } }
    c.restore(); }
  return {
    step: function (dt, t, f) {
      drips.forEach(function (d) { if (d.st === 0) { d.wait -= dt * f.s; if (d.wait <= 0) { d.st = 1; d.grow = 0; } } else if (d.st === 1) { d.grow += dt * 0.8; if (d.grow >= 1) { d.st = 2; d.v = 0; d.y = d.y0; d.land = landY(d.x); } } else if (d.st === 2) { d.v += 900 * dt; d.y += d.v * dt; if (d.y >= d.land.y) { rip.push({x: d.x, y: d.land.y, t0: t, pool: !!d.land.pool, s: d.land.pool ? 1 : 0.5}); d.st = 0; d.wait = 3 + Math.random() * 6; d.y = d.y0; } } });
      rip = rip.filter(function (r) { return t - r.t0 < 2.4; });
      motes.forEach(function (m) { m.y -= dt * 0.006 * m.s; m.x += Math.sin(t * 0.3 + m.ph) * dt * 0.004; if (m.y < 0) m.y = 1; });
      rays = rays.filter(function (r) { r.y -= r.v * dt; r.x += Math.sin(t * 2 + r.ph) * 10 * dt; return t - r.t0 < r.life; });
      if (mom && t - mom.t0 > 1.6 && t - mom.t0 < 7) for (var q = 0; q < 3; q++) rays.push({x: G[0] + (Math.random() - 0.5) * GR * 1.4, y: G[1] - GR * 0.6, v: 40 + Math.random() * 80, t0: t, life: 2 + Math.random() * 2.4, ph: Math.random() * 6, c: Math.floor(Math.random() * 3), s: 0.8 + Math.random() * 0.9});
      if (mom && t - mom.t0 > 9.2) mom = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s;
      if (dk) { stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * 1.3 + s.ph); m5_dot(ca, starG, s.x, s.y, 3.5, 0.7 * a); }); var mx = O[0] + O[1] * 0.4, my = O[2] * (ph ? 0.7 : 0.35); ca.fillStyle = '#FFF6E0'; ca.beginPath(); ca.arc(mx, my, ph ? 12 : 16, 0, 7); ca.fill(); m5_face(ca, mx, my + 1, ph ? 12 : 16, !mom, 1, !!mom); }
      // dust motes in the shaft of light (day) or around the crystals (night)
      motes.forEach(function (m, k) { var x = m.x * W, y = H * 0.15 + m.y * H * 0.8, a = 0.5 + 0.5 * Math.sin(tt * 2 + m.ph); if (!dk && !shaft(x, y)) return; if (dk) { var g0 = glow[k % glow.length]; x = g0.x + Math.sin(m.ph + tt * 0.2) * g0.r * 1.2; y = g0.y - (m.y * 1.6 - 0.8) * g0.r; } ca.fillStyle = dk ? 'rgba(220,200,255,' + (0.6 * a) + ')' : 'rgba(255,250,220,' + (0.9 * a) + ')'; ca.beginPath(); ca.arc(x, y, 1 + m.s * 0.8, 0, 7); ca.fill(); });
      // drips forming and falling
      drips.forEach(function (d) { if (d.st === 0) return; var r = d.st === 1 ? 1 + d.grow * 1.8 : 2.4; ca.fillStyle = dk ? 'rgba(170,200,255,0.75)' : 'rgba(220,240,255,0.95)'; ca.beginPath(); ca.moveTo(d.x, d.y - r * (d.st === 2 ? 2.4 : 1)); ca.quadraticCurveTo(d.x + r, d.y, d.x, d.y + r); ca.quadraticCurveTo(d.x - r, d.y, d.x, d.y - r * (d.st === 2 ? 2.4 : 1)); ca.fill(); });
      // crystal glows and the twinkle on their tips (front canvas, so they light the floor crystals too)
      cb.save(); cb.globalCompositeOperation = 'lighter';
      glow.forEach(function (g, k) { var p = 0.6 + 0.4 * Math.sin(tt * g.sp + g.ph), boost = mom && t - mom.t0 > 1.3 ? Math.max(0, 1 - (t - mom.t0 - 1.3) / 5) * 0.6 : 0; m5_dot(cb, GG[g.c], g.x, g.y, g.r * (1.3 + 0.2 * p) * (dk ? 1.3 : 1), (dk ? 0.85 : 0.6) * p + boost);
        var tp = g.tips[Math.floor((tt * 0.3 + k) % g.tips.length)], tw0 = Math.max(0, Math.sin(tt * 1.7 + k * 2.3)); if (tp && tw0 > 0.6) { var s = (tw0 - 0.6) * 2.5 * (ph ? 6 : 8); cb.save(); cb.translate(tp[0], tp[1]); cb.rotate(tt * 0.5); cb.fillStyle = CC[g.c][1]; cb.beginPath(); cb.moveTo(0, -s); cb.lineTo(s * 0.18, -s * 0.18); cb.lineTo(s, 0); cb.lineTo(s * 0.18, s * 0.18); cb.lineTo(0, s); cb.lineTo(-s * 0.18, s * 0.18); cb.lineTo(-s, 0); cb.lineTo(-s * 0.18, -s * 0.18); cb.fill(); cb.restore(); } });
      cb.restore();
      // the pools: crystal light shimmering on the water and rings where the drips land
      pools.forEach(function (p, k) { cb.save(); cb.beginPath(); cb.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); cb.clip(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over';
        glow.forEach(function (g) { if (Math.abs(g.x - p.x) < p.rx * 1.6) m5_dot(cb, GG[g.c], g.x + (p.x - g.x) * 0.3, p.y + Math.sin(tt * 0.8 + g.ph) * 2, g.r * 0.9, dk ? 0.6 : 0.35); });
        cb.strokeStyle = dk ? 'rgba(190,210,255,0.35)' : 'rgba(255,255,255,0.6)'; cb.lineWidth = 1.2; for (var q = 0; q < 7; q++) { var yy = p.y - p.ry * 0.7 + q / 6 * p.ry * 1.4, ww = p.rx * (0.15 + 0.1 * Math.sin(q * 2.1)), xx = p.x + Math.sin(tt * 0.5 + q * 1.9) * p.rx * 0.5; cb.beginPath(); cb.moveTo(xx - ww, yy); cb.lineTo(xx + ww, yy); cb.stroke(); }
        cb.restore(); });
      rip.forEach(function (r) { var k = (t - r.t0) / 2.4; for (var j = 0; j < 3; j++) { var kk = k - j * 0.15; if (kk <= 0) continue; cb.strokeStyle = (dk ? 'rgba(170,210,255,' : 'rgba(255,255,255,') + (0.8 * (1 - kk)) + ')'; cb.lineWidth = 1.2; cb.beginPath(); cb.ellipse(r.x, r.y, (4 + kk * 34) * r.s, (1.5 + kk * 8) * r.s, 0, 0, 7); cb.stroke(); }
        if (k < 0.25) { cb.fillStyle = dk ? 'rgba(180,210,255,0.8)' : 'rgba(255,255,255,0.9)'; for (j = -1; j <= 1; j += 2) { cb.beginPath(); cb.arc(r.x + j * k * 30, r.y - Math.sin(k / 0.25 * Math.PI) * 10, 1.4, 0, 7); cb.fill(); } } });
      // the lantern (lit by day; at night the crystals are the only light)
      var L = A.lantern, ls = ph ? 0.9 : 1.2; cb.save(); cb.translate(L[0], L[1]); cb.scale(ls, ls);
      if (!dk) m5_dot(cb, warmG, 0, -16, 70, 0.75 + 0.1 * flick(tt, 2));
      cb.fillStyle = '#5A4A5A'; cb.fillRect(-10, -4, 20, 4); cb.fillRect(-8, -30, 16, 3); cb.beginPath(); cb.arc(0, -33, 5, Math.PI, 0); cb.lineWidth = 1.6; cb.strokeStyle = '#5A4A5A'; cb.stroke();
      cb.fillStyle = dk ? 'rgba(120,110,150,0.5)' : 'rgba(255,220,140,0.85)'; cb.fillRect(-7, -27, 14, 23); if (!dk) { cb.fillStyle = '#FFF4C8'; cb.beginPath(); cb.ellipse(0, -14, 3, 5 + flick(tt, 1) * 2, 0, 0, 7); cb.fill(); }
      cb.strokeStyle = '#5A4A5A'; cb.lineWidth = 1.4; cb.strokeRect(-7, -27, 14, 23); cb.beginPath(); cb.moveTo(0, -27); cb.lineTo(0, -4); cb.stroke(); cb.restore();
      geode(cb, t);
      rays.forEach(function (r) { var a = Math.min(1, (t - r.t0) * 3) * Math.max(0, 1 - (t - r.t0) / r.life), s = (5 + Math.sin(t * 5 + r.ph) * 2) * (r.s || 1); cb.save(); cb.translate(r.x, r.y); cb.rotate(t + r.ph); cb.globalAlpha = a; cb.fillStyle = CC[r.c][1]; cb.beginPath(); cb.moveTo(0, -s); cb.lineTo(s * 0.2, -s * 0.2); cb.lineTo(s, 0); cb.lineTo(s * 0.2, s * 0.2); cb.lineTo(0, s); cb.lineTo(-s * 0.2, s * 0.2); cb.lineTo(-s, 0); cb.lineTo(-s * 0.2, -s * 0.2); cb.fill(); cb.restore(); });
      // a little bat hanging from a stalactite: asleep by day, awake at night
      var B = A.bat; n5_bat(ca, B[0], B[1] - 2, ph ? 1 : 1.3, tt, dk || !!mom, mom ? Math.abs(Math.sin(tt * 10)) * Math.max(0, 1 - (t - mom.t0) / 3) : 0);
    },
    finish: function (t) { if (!mom) mom = {t0: t}; }
  };
};
UIC.geology = {L: ['#6A5490', '#463466', 'rgba(255,255,255,0.86)', '#241A36', '#655878', '#7A3EC8', '#7A3EC8', '#3E9AB0', '#FFFFFF'], D: ['#2A1E4A', '#120E24', 'rgba(26,18,48,0.80)', '#F2ECFF', '#B8AAD6', '#C29AFF', '#C29AFF', '#7AE8F0', '#120E24']};



