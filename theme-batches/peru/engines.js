// ---- world theme engines: peru (Machu Picchu)
// Loop: clouds rise out of the valleys and wrap round Huayna Picchu, wind ripples run across the terrace grass, llamas
// graze (heads down, chewing, ears twitching, tails swishing), a condor circles on the thermals and a hummingbird darts
// between the kantu flowers. Night: the Milky Way arcs over Huayna Picchu, stars twinkle, the moon is up and the mist
// glows in its light. Moment: a cloud bank parts all at once to reveal the citadel, golden beams sweep across the
// terraces from the Sun Gate like a sunrise, and a condor glides right across the scene.
function peru_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function peru_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return peru_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - peru_ease((T - c) / (d - c)); }
function peru_mix(a, b, t) { var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), f = function (s) { return Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); }; return 'rgb(' + f(16) + ',' + f(8) + ',' + f(0) + ')'; }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function peru_spr(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function peru_glow(c, x, y, r, col, a) { if (a <= 0.003 || r <= 0) return; var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col + a + ')'); g.addColorStop(0.4, col + (a * 0.35) + ')'); g.addColorStop(1, col + '0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
// a soft cloud: overlapping round puffs that fade at their edges, a cool shade along the flat underside
function peru_cloud(w, h, seed, dk) { return peru_spr(w * 1.5, h * 2.4, 1.5, function (o) {
  var puff = function (x, y, r, col, a) { var g = o.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col + a + ')'); g.addColorStop(0.55, col + (a * 0.8) + ')'); g.addColorStop(1, col + '0)'); o.fillStyle = g; o.beginPath(); o.arc(x, y, r, 0, 7); o.fill(); };
  var n = Math.max(9, Math.round(w / h * 3.4)); for (var p = 0; p < 2; p++) for (var i = 0; i < n; i++) { var u = i / (n - 1) - 0.5, x = u * w * 0.78 + (hash(seed + i) - 0.5) * w * 0.08, r = h * (0.36 + 0.22 * Math.cos(u * Math.PI) + hash(seed + i * 3) * 0.1), y = h * 0.16 - r * 0.45;
    if (p === 0) puff(x, y + h * 0.08, r, dk ? 'rgba(60,70,130,' : 'rgba(196,212,226,', 0.55); else puff(x, y, r * 0.94, dk ? 'rgba(130,144,206,' : 'rgba(255,255,255,', dk ? 0.72 : 0.92); } }); }
// a condor with its wings spread: L is half the wingspan, dir the way it flies, flex lifts the wingtips
function peru_condor(c, x, y, L, dir, flex, col, band) {
  c.save(); c.translate(x, y); c.scale(1, 1.45); c.fillStyle = col;
  [-1, 1].forEach(function (s) { c.beginPath(); c.moveTo(0, -0.04 * L); c.quadraticCurveTo(s * 0.3 * L, -0.16 * L - flex * 0.5, s * 0.55 * L, -0.15 * L - flex); c.lineTo(s * 0.9 * L, -0.08 * L - flex * 1.4);
    [[1, -0.03], [0.88, 0.02], [0.97, 0.05], [0.84, 0.07], [0.9, 0.11], [0.76, 0.1], [0.8, 0.15], [0.66, 0.13]].forEach(function (q) { c.lineTo(s * q[0] * L, (q[1] - flex / L * (q[0] - 0.4)) * L); });
    c.quadraticCurveTo(s * 0.35 * L, 0.17 * L, s * 0.1 * L, 0.12 * L); c.lineTo(0, 0.1 * L); c.fill();
    c.strokeStyle = band; c.lineWidth = 0.04 * L; c.beginPath(); c.moveTo(s * 0.16 * L, 0.07 * L); c.quadraticCurveTo(s * 0.4 * L, 0.02 * L - flex * 0.4, s * 0.62 * L, 0.04 * L - flex * 0.7); c.stroke(); });
  c.beginPath(); c.ellipse(-dir * 0.02 * L, 0.03 * L, 0.2 * L, 0.075 * L, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-dir * 0.18 * L, 0.02 * L); c.lineTo(-dir * 0.34 * L, -0.02 * L); c.lineTo(-dir * 0.35 * L, 0.09 * L); c.closePath(); c.fill();
  c.fillStyle = '#F4F0EA'; c.beginPath(); c.arc(dir * 0.16 * L, 0.0, 0.06 * L, 0, 7); c.fill();
  c.fillStyle = '#B58A84'; c.beginPath(); c.arc(dir * 0.23 * L, -0.015 * L, 0.045 * L, 0, 7); c.fill();
  c.restore(); }
var peru_COATS = [{w: '#F6EEDC', s: '#D9C9AA', f: '#EFE2C8', m: '#BFA888', t: ['#E8407A', '#F6B42A']}, {w: '#C08A56', s: '#946238', f: '#D29E6A', m: '#6E4A2E', t: ['#2E9ED6', '#F05A3A']}, {w: '#6E4A36', s: '#4C3224', f: '#F2E6D2', m: '#B49C80', t: ['#F6B42A', '#E8407A']}];
// a llama in profile, its feet at (0, 0), facing +x: k = 0 head up, 1 grazing; ear and tail are swing angles
function peru_llama(c, L, t, dk) {
  var C = peru_COATS[L.coat % 3], night = '#4A5080', W_ = dk ? peru_mix(C.w, night, 0.5) : C.w, S_ = dk ? peru_mix(C.s, night, 0.55) : C.s, F_ = dk ? peru_mix(C.f, night, 0.5) : C.f, M_ = dk ? peru_mix(C.m, night, 0.5) : C.m, ink = dk ? '#1A1A2E' : '#2B2233';
  c.save(); c.translate(L.x, L.y); c.scale(L.dir * L.s, L.s); c.lineCap = 'round';
  c.fillStyle = dk ? 'rgba(5,8,25,0.35)' : 'rgba(40,60,30,0.22)'; c.beginPath(); c.ellipse(-1, 0.5, 21, 2.8, 0, 0, 7); c.fill();
  var leg = function (x, col) { c.strokeStyle = col; c.lineWidth = 3.8; c.beginPath(); c.moveTo(x, -21); c.lineTo(x + 0.6, -10); c.lineTo(x, -1.2); c.stroke(); c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 0.6, -0.8); c.lineTo(x + 1.2, -0.8); c.stroke(); };
  leg(-10, S_); leg(9, S_); leg(-14, W_); leg(5.5, W_);
  c.save(); c.translate(-18, -30); c.rotate(L.tail); c.fillStyle = W_; c.beginPath(); c.ellipse(-2, 1.5, 3.4, 5, 0.5, 0, 7); c.fill(); c.restore();
  var g = c.createLinearGradient(0, -37, 0, -16); g.addColorStop(0, W_); g.addColorStop(1, S_); c.fillStyle = g;
  c.beginPath(); c.ellipse(-2, -27, 17, 10, 0, 0, 7); for (var a = 0; a < 6.28; a += 0.42) { c.moveTo(-2 + Math.cos(a) * 16 + 3.2, -27 + Math.sin(a) * 9.4); c.arc(-2 + Math.cos(a) * 16, -27 + Math.sin(a) * 9.4, 3.2, 0, 7); } c.fill();
  var na = -1.3 + L.k * 2.2, dx = Math.cos(na), dy = Math.sin(na), hx = 10 + dx * 21, hy = -31 + dy * 21, ha = (L.k * 1.5) + (L.k > 0.9 ? Math.sin(t * 9) * 0.05 : 0);
  c.strokeStyle = W_; c.lineWidth = 9; c.beginPath(); c.moveTo(8, -29); c.lineTo(hx, hy); c.stroke();
  c.fillStyle = W_; for (var q = 0.15; q < 0.95; q += 0.2) { c.beginPath(); c.arc(8 + (hx - 8) * q - dy * 4.6, -29 + (hy + 29) * q + dx * 4.6, 2.4, 0, 7); c.fill(); }
  c.save(); c.translate(hx, hy); c.rotate(ha);
  [[-2.4, -3.4, -0.35, 0], [0.6, -4, -0.05, 1]].forEach(function (e) { c.save(); c.translate(e[0], e[1]); c.rotate(e[2] + (L.earN === e[3] ? L.ear : 0)); c.fillStyle = e[3] ? F_ : S_; c.beginPath(); c.ellipse(0, -4.6, 1.9, 5, 0, 0, 7); c.fill(); c.fillStyle = C.t[e[3]]; c.beginPath(); c.arc(0, -1, 1.7, 0, 7); c.fill(); c.restore(); });
  c.fillStyle = F_; c.beginPath(); c.ellipse(3.6, 0, 7.4, 4.8, 0.08, 0, 7); c.fill();
  c.fillStyle = M_; c.beginPath(); c.ellipse(9.4, 1.2, 2.6, 2.8, 0, 0, 7); c.fill();
  c.fillStyle = ink; c.beginPath(); c.ellipse(2.8, -1.4, 1.15, L.blink ? 0.2 : 1.2, 0, 0, 7); c.fill(); if (!L.blink) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(3.2, -1.8, 0.4, 0, 7); c.fill(); }
  c.restore(); c.restore(); }
// a hummingbird hovering, facing +x: green back, ruby throat, a long fine beak and wings beating to a blur
function peru_humm(c, x, y, s, dir, t) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = 'rgba(210,240,230,0.45)'; [-1, 1].forEach(function (k) { c.save(); c.translate(-0.6, -2.6); c.rotate(-0.4 + k * 0.9 * Math.sin(t * 55)); c.beginPath(); c.ellipse(-5, 0, 6.4, 1.7, 0, 0, 7); c.fill(); c.restore(); });
  c.fillStyle = '#1E6E52'; c.beginPath(); c.moveTo(-4, 2.4); c.lineTo(-8.6, 6.4); c.lineTo(-5.6, 6.8); c.lineTo(-2.6, 3.6); c.fill();
  var g = c.createLinearGradient(-4, -4, 4, 4); g.addColorStop(0, '#3CCB8A'); g.addColorStop(1, '#1E7E5C'); c.fillStyle = g; c.save(); c.rotate(-0.6); c.beginPath(); c.ellipse(0, 0, 5.8, 3.2, 0, 0, 7); c.fill(); c.restore();
  c.fillStyle = '#EEF4EE'; c.beginPath(); c.ellipse(0.6, 1.4, 3, 1.6, -0.6, 0, 7); c.fill();
  c.fillStyle = '#2FAE74'; c.beginPath(); c.arc(3.6, -3.4, 2.6, 0, 7); c.fill(); c.fillStyle = '#E8325E'; c.beginPath(); c.ellipse(3.8, -1.4, 1.9, 1.2, 0.3, 0, 7); c.fill();
  c.strokeStyle = '#2B2233'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(5.8, -3.8); c.lineTo(13, -2.8); c.stroke(); c.fillStyle = '#1A1A22'; c.beginPath(); c.arc(4.3, -4, 0.7, 0, 7); c.fill();
  c.restore(); }
ENGINES.peru = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, T0 = -99, i, sun = A.sun, hp = A.hp;
  var skyP = new Path2D(A.skyClip), behind = new Path2D('M-60 -60 H' + (W + 60) + ' V' + (H + 60) + ' H-60 Z ' + A.mask), terP = new Path2D(A.terr), ngP = new Path2D(A.ngrass);
  // the night sky: stars, and the Milky Way painted once into its own canvas
  var stars = []; if (dk) for (i = 0; i < (ph ? 80 : 160); i++) stars.push({x: Math.random() * W, y: Math.random() * H * 0.62, r: 0.4 + Math.pow(Math.random(), 3) * 1.4, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 2});
  var mw = null; if (dk) mw = peru_spr(W, H, 1, function (o) { o.translate(-W / 2, -H / 2);
    var P0 = [hp[0] - W * (ph ? 0.6 : 0.33), H * 0.62], P1 = [hp[0], -H * (ph ? 0.12 : 0.26)], P2 = [hp[0] + W * (ph ? 0.6 : 0.33), H * 0.6], B = function (u) { return [(1 - u) * (1 - u) * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1]]; };
    var bw = (ph ? 34 : 60) * S, cols = ['rgba(170,165,255,', 'rgba(255,190,225,', 'rgba(150,195,255,', 'rgba(255,240,215,'];
    o.globalCompositeOperation = 'lighter'; for (var j = 0; j < 140; j++) { var u = j / 139, p = B(u), q = B(Math.min(1, u + 0.01)), a = Math.atan2(q[1] - p[1], q[0] - p[0]), off = (hash(j + 5) - 0.5) * bw * 0.8, x = p[0] - Math.sin(a) * off, y = p[1] + Math.cos(a) * off, r = bw * (0.6 + hash(j) * 0.7), g = o.createRadialGradient(x, y, 0, x, y, r), al = 0.06 + 0.05 * Math.sin(u * 9);
      g.addColorStop(0, cols[j % 4] + al + ')'); g.addColorStop(1, cols[j % 4] + '0)'); o.fillStyle = g; o.beginPath(); o.arc(x, y, r, 0, 7); o.fill(); }
    o.globalCompositeOperation = 'destination-out'; for (j = 0; j < 40; j++) { u = 0.15 + j / 39 * 0.7; p = B(u); var r2 = bw * (0.18 + hash(j + 40) * 0.2), g2 = o.createRadialGradient(p[0] + 6, p[1] + 4, 0, p[0] + 6, p[1] + 4, r2); g2.addColorStop(0, 'rgba(0,0,0,0.45)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = g2; o.beginPath(); o.arc(p[0] + 6, p[1] + 4, r2, 0, 7); o.fill(); }
    o.globalCompositeOperation = 'lighter'; for (j = 0; j < (ph ? 500 : 1100); j++) { u = Math.random(); p = B(u); var o2 = (Math.random() + Math.random() + Math.random() - 1.5) * bw * 0.9; o.fillStyle = 'rgba(255,250,240,' + (0.25 + Math.random() * 0.6) + ')'; o.beginPath(); o.arc(p[0] + o2 * 0.4, p[1] + o2, Math.random() * 0.9 + 0.2, 0, 7); o.fill(); } });
  // clouds: some rise out of the valleys and fade, two long ones wrap round Huayna Picchu
  var CL = [peru_cloud(260, 90, 3, dk), peru_cloud(220, 80, 11, dk), peru_cloud(300, 70, 19, dk)], WR = peru_cloud(340, 54, 27, dk), clouds = [];
  function spawn(c, mid) { var q = A.valleys[Math.floor(Math.random() * A.valleys.length)]; c.x = q[0] + (Math.random() - 0.5) * 120 * S; c.y = q[1] + Math.random() * 20; c.s = (0.55 + Math.random() * 0.5) * S * (ph ? 0.6 : 1); c.vx = (Math.random() - 0.5) * 6; c.vy = -(2.4 + Math.random() * 3); c.life = 26 + Math.random() * 16; c.age = mid ? Math.random() * c.life : 0; c.k = Math.floor(Math.random() * 3); return c; }
  for (i = 0; i < (ph ? 5 : 8); i++) clouds.push(spawn({}, true));
  var llamas = A.llamas.map(function (l, j) { return {x: l.x, y: l.y, s: l.s, dir: l.dir, coat: l.coat, k: j % 2, want: j % 2, tm: 2 + j * 1.7, ear: 0, earN: 0, earT: -9, nextEar: 1 + j, tail: 0, tailT: -9, blink: 0}; });
  var fl = A.flowers.slice(0, 7), hb = {i: 0, x: fl[0][0] - 14, y: fl[0][1] - 4, dir: 1, tm: 1.5, tx: 0, ty: 0, away: 0};
  function hbTarget() { var f = fl[hb.i]; hb.tx = f[0] - hb.dir * 14 * S; hb.ty = f[1] - 3 * S; }
  hbTarget();
  var bank = []; for (i = 0; i < 16; i++) bank.push({side: i % 2 ? 1 : -1, x: (hash(i + 70) * 0.62) * W, y: H * (0.3 + hash(i + 71) * 0.7), s: (1.5 + hash(i + 72) * 1.3) * S * (ph ? 0.6 : 1), k: i % 3});
  return {
    step: function (dt, t, f) {
      clouds.forEach(function (c) { c.age += dt * f.s; c.x += c.vx * dt * f.s; c.y += c.vy * dt * f.s; if (c.age > c.life) spawn(c, false); });
      llamas.forEach(function (L) {
        L.tm -= dt; if (L.tm <= 0) { L.want = L.want ? 0 : 1; L.tm = L.want ? 4 + Math.random() * 4 : 2.5 + Math.random() * 3; }
        L.k += Math.max(-dt * 1.3, Math.min(dt * 1.3, L.want - L.k));
        L.nextEar -= dt; if (L.nextEar <= 0) { L.nextEar = 1.6 + Math.random() * 3; L.earT = t; L.earN = Math.random() < 0.5 ? 0 : 1; }
        var e = (t - L.earT) / 0.45; L.ear = e < 1 ? -Math.sin(e * Math.PI) * 0.7 * f.a : 0;
        if (Math.random() < dt * 0.25) L.tailT = t; var q = (t - L.tailT) / 1.2; L.tail = q < 1 ? Math.sin(q * Math.PI * 3) * 0.5 * (1 - q) * f.a : 0;
        L.blink = ((t * 0.31 + L.x * 0.01) % 4) < 0.12;
      });
      if (!dk) { hb.tm -= dt * f.s; if (hb.tm <= 0) {
          if (!hb.away && Math.random() < 0.25) { hb.away = 1; hb.tx = hb.x + (Math.random() - 0.3) * 80 * S; hb.ty = hb.y - (30 + Math.random() * 40) * S; hb.tm = 0.8 + Math.random() * 0.8; }
          else { hb.away = 0; var j = Math.floor(Math.random() * fl.length); if (j === hb.i) j = (j + 1) % fl.length; hb.dir = fl[j][0] >= hb.x ? 1 : -1; hb.i = j; hbTarget(); hb.tm = 1.4 + Math.random() * 1.8; } }
        var k = Math.min(1, dt * 5.5); hb.x += (hb.tx - hb.x) * k; hb.y += (hb.ty - hb.y) * k; }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0;
      // sky: sun or moon, stars and the Milky Way, behind the mountains
      ca.save(); ca.clip(skyP);
      if (dk) { ca.globalAlpha = 0.85 + 0.08 * Math.sin(tt * 0.3); ca.drawImage(mw, 0, 0, W, H); ca.globalAlpha = 1;
        stars.forEach(function (s) { var a = 0.45 + 0.55 * Math.sin(tt * s.sp + s.ph); if (a < 0.05) return; ca.fillStyle = 'rgba(255,250,235,' + a + ')'; ca.beginPath(); ca.arc(s.x, s.y, s.r * (0.8 + 0.3 * a), 0, 7); ca.fill(); });
        peru_glow(ca, sun[0], sun[1], 110 * S, 'rgba(200,210,255,', 0.32); ca.fillStyle = '#F6F2E0'; ca.beginPath(); ca.arc(sun[0], sun[1], 22 * S, 0, 7); ca.fill(); ca.fillStyle = 'rgba(200,190,160,0.35)'; [[-0.3, -0.2, 0.25], [0.3, 0.2, 0.2], [0.05, 0.45, 0.14]].forEach(function (q) { ca.beginPath(); ca.arc(sun[0] + q[0] * 22 * S, sun[1] + q[1] * 22 * S, q[2] * 22 * S, 0, 7); ca.fill(); }); }
      else { peru_glow(ca, sun[0], sun[1], 170 * S * (1 + 0.04 * Math.sin(tt * 0.4)), 'rgba(255,250,215,', 0.85); ca.fillStyle = 'rgba(255,255,244,0.95)'; ca.beginPath(); ca.arc(sun[0], sun[1], 30 * S, 0, 7); ca.fill(); }
      ca.restore();
      // the condor circling on the thermals (by day)
      if (!dk) { var th = tt * 0.11, cx = W * (ph ? 0.42 : 0.5) + Math.cos(th) * W * (ph ? 0.26 : 0.16), cy = H * (ph ? 0.22 : 0.2) + Math.sin(th) * H * 0.05, cL = (ph ? 22 : 32) * S * (1 + Math.sin(th) * 0.15); peru_condor(ca, cx, cy, cL, -Math.sin(th) >= 0 ? 1 : -1, Math.sin(tt * 1.3) * cL * 0.04, '#24212C', 'rgba(216,214,220,0.75)'); }
      // clouds rise out of the valleys and wrap the peak, always behind the citadel's ridge
      ca.save(); ca.clip(behind, 'evenodd');
      clouds.forEach(function (c) { var u = c.age / c.life, a = Math.min(1, u * 5, (1 - u) * 3.5) * 0.85, sc = c.s * (0.8 + 0.6 * u), sp = CL[c.k]; if (a <= 0) return; ca.globalAlpha = a; ca.drawImage(sp, c.x - sp.w * sc / 2, c.y - sp.h * sc / 2, sp.w * sc, sp.h * sc); });
      [0, 1].forEach(function (j) { var y = hp[1] + H * (0.12 + j * 0.15), x = hp[0] + Math.sin(tt * 0.05 + j * 2.4) * W * (ph ? 0.12 : 0.07), sc = S * (ph ? 0.6 : 1) * (1 - j * 0.15); ca.globalAlpha = 0.6 + 0.2 * Math.sin(tt * 0.13 + j); ca.drawImage(WR, x - WR.w * sc / 2, y - WR.h * sc / 2, WR.w * sc, WR.h * sc); });
      ca.globalAlpha = 1; if (dk) { ca.globalCompositeOperation = 'lighter'; clouds.forEach(function (c) { var u = c.age / c.life, a = Math.min(1, u * 5, (1 - u) * 3.5) * 0.18; if (a > 0) peru_glow(ca, c.x, c.y, 120 * c.s, 'rgba(170,190,255,', a); }); ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      // wind running across the terrace grass, and the golden light of the moment
      var ripple = function (c, P, off, a) { c.save(); c.clip(P); for (var j = 0; j < 2; j++) { var gx = ((tt * 70 + off + j * (W + 500) / 2) % (W + 500)) - 250, g = c.createLinearGradient(gx - 140, 0, gx + 140, 0); g.addColorStop(0, 'rgba(255,255,220,0)'); g.addColorStop(0.5, dk ? 'rgba(190,210,255,' + a * 0.6 + ')' : 'rgba(255,255,220,' + a + ')'); g.addColorStop(1, 'rgba(255,255,220,0)'); c.fillStyle = g; c.fillRect(gx - 140, 0, 280, H); } c.restore(); };
      ripple(ca, terP, 0, 0.22 * f.a);
      var ray = peru_env(T, 0.9, 1.9, 5.2, 7.4);
      if (ray > 0) { ca.save(); ca.clip(terP); ca.fillStyle = dk ? 'rgba(255,214,140,' + 0.14 * ray + ')' : 'rgba(255,200,90,' + 0.2 * ray + ')'; ca.fillRect(0, 0, W, H); var sx = -200 + (T - 0.9) / 5 * (W + 400), g3 = ca.createLinearGradient(sx - 160, 0, sx + 160, 0); g3.addColorStop(0, 'rgba(255,230,150,0)'); g3.addColorStop(0.5, 'rgba(255,230,150,' + 0.4 * ray + ')'); g3.addColorStop(1, 'rgba(255,230,150,0)'); ca.fillStyle = g3; ca.fillRect(sx - 160, 0, 320, H); ca.restore(); }
      // the llamas
      llamas.forEach(function (L) { peru_llama(ca, L, tt, dk); });
      // front: wind on the near terraces, the hummingbird at the kantu flowers
      ripple(cb, ngP, 300, 0.16 * f.a);
      if (!dk) peru_humm(cb, hb.x, hb.y + Math.sin(tt * 7) * 1.2, (ph ? 0.75 : 1) * S, hb.dir, t);
      // the moment: the clouds part, beams sweep from the Sun Gate, a condor glides across
      var bk = peru_env(T, 0, 0.4, 0.9, 3.1), op = peru_ease((T - 0.8) / 2.2) * W * 0.8;
      if (bk > 0) bank.forEach(function (b) { var sp = CL[b.k], x = b.side < 0 ? b.x - op : W - b.x + op; cb.globalAlpha = bk; cb.drawImage(sp, x - sp.w * b.s / 2, b.y - sp.h * b.s / 2, sp.w * b.s, sp.h * b.s); });
      cb.globalAlpha = 1;
      if (ray > 0) { var G = A.gate; cb.save(); cb.globalCompositeOperation = 'lighter';
        for (var j = 0; j < 6; j++) { var an = -0.1 + j * 0.09 + Math.sin(T * 0.5 + j) * 0.015 + (T - 0.9) * 0.04, wd = 0.03 + hash(j + 90) * 0.03, Ln = W * 1.4;
          // each beam is four nested wedges, so its edges fade instead of ending in a hard line
          for (var q = 0; q < 4; q++) { var w2 = wd * (1 - q * 0.24), g4 = cb.createLinearGradient(G[0], G[1], G[0] + Math.cos(an) * Ln, G[1] + Math.sin(an) * Ln);
            g4.addColorStop(0, dk ? 'rgba(255,214,140,' + 0.06 * ray + ')' : 'rgba(255,214,120,' + 0.1 * ray + ')'); g4.addColorStop(1, 'rgba(255,214,120,0)'); cb.fillStyle = g4;
            cb.beginPath(); cb.moveTo(G[0], G[1]); cb.lineTo(G[0] + Math.cos(an - w2) * Ln, G[1] + Math.sin(an - w2) * Ln); cb.lineTo(G[0] + Math.cos(an + w2) * Ln, G[1] + Math.sin(an + w2) * Ln); cb.closePath(); cb.fill(); } }
        peru_glow(cb, G[0], G[1], 150 * S, 'rgba(255,220,140,', 0.9 * ray); cb.restore(); }
      if (T > 1.4 && T < 8.6) { var u = (T - 1.4) / 7, gx2 = -W * 0.15 + u * W * 1.3, gy2 = H * (ph ? 0.3 : 0.34) + Math.sin(u * 3.4) * H * 0.03 - u * H * 0.06, gL = (ph ? 46 : 74) * S;
        peru_condor(cb, gx2, gy2, gL, 1, Math.sin(T * 1.1) * gL * 0.05, dk ? '#14121E' : '#24212C', dk ? 'rgba(154,160,200,0.8)' : 'rgba(226,224,230,0.75)'); }
    },
    finish: function (t) { T0 = t; }
  };
};
UIC.peru = {L: ['#3A7A52', '#24533A', 'rgba(255,255,255,0.86)', '#1E2E24', '#566A5A', '#2F7A4A', '#2F7A4A', '#4A9A5A', '#FFFFFF'], D: ['#1E2C58', '#0E1630', 'rgba(18,26,52,0.8)', '#EEF4F0', '#AEBFC2', '#8ADBA6', '#8ADBA6', '#F2C46A', '#0E1A28']};
