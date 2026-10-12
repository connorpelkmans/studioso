// ---- batch n9 engines: bayou, karst
function n9_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n9_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n9_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n9_ease((T - c) / (d - c)); }
var n9_gc = null;
function n9_ctx() { return n9_gc || (n9_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) that fades to transparent; draw it with n9_glow
function n9_rg(col, mid) { var g = n9_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n9_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n9_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
// a soft round light baked once into a small canvas, so hundreds of fireflies cost one drawImage each
function n9_sprite(inner, outer, size) { var cv = document.createElement('canvas'), n = size || 64; cv.width = cv.height = n; var g = cv.getContext('2d'), r = n / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, inner); gr.addColorStop(0.18, inner); gr.addColorStop(0.32, outer); gr.addColorStop(1, outer.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(0, 0, n, n); return cv; }
function n9_fillPts(c, pts, dx, dy) { c.beginPath(); c.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] + dx, pts[i][1] + dy); c.closePath(); c.fill(); }
// a pointed petal from (0,0) along angle a, length L, half width w; squash flattens it toward the water (seen from a low angle)
function n9_petal(c, x, y, a, L, w, squash) { var ca = Math.cos(a), sa = Math.sin(a), P = function (u, v) { return [x + u * ca - v * sa, y + (u * sa + v * ca) * squash]; }, p0 = P(0, 0), p1 = P(L * 0.45, -w), p2 = P(L, 0), p3 = P(L * 0.45, w);
  c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.quadraticCurveTo(p3[0], p3[1], p0[0], p0[1]); c.fill(); }

// ---------- Firefly Bayou: the water lies still and mirrors everything, mist drifts low over it, Spanish moss sways, drops from the
// moss ring the water. By day golden motes float in the hazy sun rays; at night hundreds of fireflies glow and blink over the water.
// Moment: the fireflies flash together in waves, the lily buds open one after another, and a ribbon of light spirals up to ring the moon.
ENGINES.bayou = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = A.ph, S = A.S, hy = A.hy, M = A.moon, i;
  var mistG = n9_rg(dk ? 'rgba(150,200,185,0.2)' : 'rgba(255,246,222,0.55)', [0.5, 0.45]), warmG = n9_rg(dk ? 'rgba(255,220,120,0.55)' : 'rgba(255,236,170,0.6)', [0.35, 0.3]), moonG = n9_rg(dk ? 'rgba(230,245,225,0.35)' : 'rgba(255,240,190,0.5)', [0.4, 0.3]);
  var spr = dk ? n9_sprite('rgba(255,250,200,1)', 'rgba(255,200,70,0.5)') : n9_sprite('rgba(255,252,230,1)', 'rgba(255,220,140,0.35)');
  // fireflies by night, golden motes in the sun by day. k: nearness (bigger, brighter, faster toward the bottom of the picture)
  var flies = [], N = dk ? (ph ? 150 : 300) : (ph ? 26 : 50);
  for (i = 0; i < N; i++) { var yy = dk ? hy - H * 0.26 + Math.pow(Math.random(), 0.8) * (H * 1.22 - hy) : hy - H * 0.3 + Math.random() * H * 0.36, k = Math.max(0.25, Math.min(1.3, (yy - (hy - H * 0.3)) / (H - hy + H * 0.3) * 1.3)), x0 = dk ? Math.random() * W : M[0] + (Math.random() - 0.5) * W * 0.5;
    flies.push({x0: x0, y0: yy, k: k, ax: (10 + Math.random() * 30) * S * k, ay: (6 + Math.random() * 14) * S * k, f1: 0.1 + Math.random() * 0.25, f2: 0.3 + Math.random() * 0.4, f3: 0.12 + Math.random() * 0.2, p1: Math.random() * 6.28, p2: Math.random() * 6.28, p3: Math.random() * 6.28,
      per: 2.8 + Math.random() * 4, bp: Math.random(), surf: Math.min(H + 40, Math.max(hy + 4, yy + (0.03 + Math.random() * 0.1) * H * k)), front: k > 1.12 && Math.random() < 0.5}); }
  var buds = A.buds.map(function (b, j) { return {x: b.x, y: b.y, s: b.s, o: 0, ph: j * 1.3}; }).sort(function (p, q) { return p.x - q.x; });
  var ripples = [], nextDrop = 1.5, fin = null;
  var swarmN = ph ? 44 : 80, mossC = dk ? '#3A4E48' : '#A9AA86', mossH = dk ? '#536A62' : '#C6C4A0';
  function fly(q, t) { return [q.x0 + Math.sin(t * q.f1 + q.p1) * q.ax + Math.sin(t * q.f2 + q.p2) * q.ax * 0.35, q.y0 + Math.sin(t * q.f3 + q.p3) * q.ay]; }
  function blink(q, t, T) { var u = ((t / q.per) + q.bp) % 1, b = dk ? 0.2 + 0.8 * Math.pow(Math.max(0, Math.sin(u * Math.PI * 2)), 2) : 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(u * Math.PI * 2)), 2);
    // the moment: three waves of light roll across the water, everyone flashing together
    if (T != null && T < 4.5) { for (var w = 0; w < 3; w++) { var d = T - 0.3 - w * 1.2 - q.x0 / W * 0.6; if (d > 0 && d < 0.7) b = Math.max(b, Math.sin(d / 0.7 * Math.PI)); } }
    return b; }
  function drawFly(c, q, t, T) { var p = fly(q, t), b = blink(q, t, T), r = (dk ? 11 : 6) * q.k * S * (0.6 + 0.6 * b) + 2, a = b * (dk ? 1 : 0.55) * (T != null && T > 3 && T < 11 ? 0.65 : 1);
    c.globalAlpha = a; c.drawImage(spr, p[0] - r, p[1] - r, r * 2, r * 2);
    // its reflection in the still water, a little dimmer and wobbling
    if (q.surf < H && p[1] < q.surf) { var ry = q.surf + (q.surf - p[1]) * 0.85; if (ry < H + 10) { c.globalAlpha = a * (dk ? 0.38 : 0.22); var rr = r * 0.8; c.drawImage(spr, p[0] - rr + Math.sin(t * 2 + q.p1) * 1.5, ry - rr * 0.6, rr * 2, rr * 1.2); } } }
  function drawBud(c, b, t) { var s = b.s, o = b.o, sw = Math.sin(t * 0.8 + b.ph) * 0.03;
    c.save(); c.translate(b.x, b.y);
    if (o > 0.02) { var g = o * (dk ? 0.9 : 0.6); c.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n9_glow(c, warmG, 0, -s * 0.2, s * 2.4, g * (fin ? n9_env(t - fin.t0, 0, 1, 16, 22) * 0.8 : 0.5), 0.6); c.globalCompositeOperation = 'source-over'; }
    // back ring of petals, then the front ring, opening from a closed bud
    var spread = 0.06 + o * 0.94, cols = dk ? ['#C8B4C4', '#E8E2EC', '#F8F4FA'] : ['#F2A6BC', '#FFE4EC', '#FFFFFF'];
    c.fillStyle = cols[0]; for (i = 0; i < 7; i++) n9_petal(c, 0, 0, -Math.PI / 2 + (i - 3) * 0.5 * spread + sw, s * 1.05, s * 0.2, 0.62 + 0.38 * (1 - o));
    c.fillStyle = cols[1]; for (i = 0; i < 5; i++) n9_petal(c, 0, -s * 0.05, -Math.PI / 2 + (i - 2) * 0.42 * spread + sw, s * 0.85, s * 0.19, 0.8 + 0.2 * (1 - o));
    c.fillStyle = cols[2]; n9_petal(c, 0, -s * 0.05, -Math.PI / 2 + sw, s * 0.7 * (1 - o * 0.4), s * 0.16, 1);
    if (o > 0.3) { c.fillStyle = dk ? 'rgba(255,214,100,' + o + ')' : 'rgba(242,190,60,' + o + ')'; n9_ell(c, 0, -s * 0.14, s * 0.16 * o, s * 0.08 * o); c.fill(); }
    c.restore(); }
  function drawMoss(c, t) { A.moss.forEach(function (m) { var sw = Math.sin(t * 0.55 + m.ph) * 0.07 + Math.sin(t * 1.3 + m.ph * 2) * 0.02;
      m.strands.forEach(function (st, k) { c.fillStyle = k % 3 === 2 ? mossH : mossC; c.beginPath(); st.forEach(function (p, q) { var u = Math.max(0, p[1]) / m.len, x = m.x + p[0] + sw * m.len * u * u, y = m.y + p[1] - Math.abs(sw) * m.len * u * u * 0.1; if (q) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); c.fill(); }); }); }
  return {
    step: function (dt, t, f) {
      nextDrop -= dt * f.s; if (nextDrop <= 0) { nextDrop = 0.8 + Math.random() * 2.2; var m = A.moss[Math.floor(Math.random() * A.moss.length)], wy = hy + Math.random() * (H - hy);
        ripples.push({x: m ? m.x + (Math.random() - 0.5) * 30 : Math.random() * W, y: wy, t0: t, r: (10 + 30 * (wy - hy) / (H - hy)) * S, life: 2.4}); }
      ripples = ripples.filter(function (r) { return t - r.t0 < r.life; });
      var T = fin ? t - fin.t0 : -1;
      buds.forEach(function (b, j) { var want = 0; if (fin) { var tb = 1 + j * (4.5 / Math.max(1, buds.length)); want = T > tb && T < 20 ? 1 : 0; if (T > tb && T < tb + 0.1 && !b.rang) { b.rang = 1; ripples.push({x: b.x, y: b.y + b.s * 0.2, t0: t, r: b.s * 2.6, life: 1.8, glow: 1}); } }
        b.o += (want - b.o) * Math.min(1, dt * (want ? 2.2 : 0.5)); });
      if (fin && T > 26) { fin = null; buds.forEach(function (b) { b.rang = 0; }); }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = fin ? t - fin.t0 : null, j;
      // the moon's (or sun's) glitter path on the water
      ca.save(); ca.lineCap = 'round';
      for (i = 0; i < (ph ? 26 : 44); i++) { var u = (i + 0.5) / (ph ? 26 : 44), y = hy + 4 + u * u * (H - hy), wid = (M[2] * (dk ? 0.5 : 0.9) + u * W * 0.05) * (0.5 + 0.5 * Math.sin(tt * 0.9 + i * 2.7)), x = M[0] + Math.sin(tt * 0.5 + i * 1.9) * wid * 0.6, a = (dk ? 0.45 : 0.55) * (0.4 + 0.6 * Math.abs(Math.sin(tt * 1.3 + i * 4.1))) * (1 - u * 0.5);
        ca.strokeStyle = dk ? 'rgba(235,240,215,' + a + ')' : 'rgba(255,244,205,' + a + ')'; ca.lineWidth = 1 + u * 2.2; ca.beginPath(); ca.moveTo(x - wid * 0.5, y); ca.lineTo(x + wid * 0.5, y); ca.stroke(); }
      // faint shimmer lines over the rest of the still water
      for (i = 0; i < (ph ? 10 : 18); i++) { var u2 = (i + 0.5) / (ph ? 10 : 18), y2 = hy + 10 + u2 * (H - hy - 20), x2 = ((i * 0.37 + tt * 0.004 * (1 + i % 3)) % 1) * W, w2 = (30 + u2 * 90) * S;
        ca.strokeStyle = dk ? 'rgba(150,200,190,0.12)' : 'rgba(255,250,230,0.3)'; ca.lineWidth = 1.2; ca.beginPath(); ca.moveTo(x2 - w2, y2); ca.quadraticCurveTo(x2, y2 - 1.5, x2 + w2, y2); ca.stroke(); }
      ca.restore();
      // mist drifting low over the water
      for (j = 0; j < 3; j++) for (i = 0; i < (ph ? 4 : 7); i++) { var mxp = ((i / (ph ? 4 : 7)) * (W + 500) + tt * (5 + j * 3) * (j % 2 ? -1 : 1)) % (W + 500); if (mxp < 0) mxp += W + 500; n9_glow(ca, mistG, mxp - 250, hy + H * (0.005 + j * 0.035) + Math.sin(tt * 0.2 + i + j) * 5, (ph ? 120 : 220) * S * (1 + j * 0.3), (dk ? 0.35 : 0.42) * (1 - j * 0.25), 0.1); }
      // rings from drops of the moss, and the gentle lapping round the knees
      ripples.forEach(function (r) { var k = (t - r.t0) / r.life; for (var q = 0; q < 2; q++) { var kk = k - q * 0.2; if (kk <= 0) continue; ca.strokeStyle = (r.glow && dk ? 'rgba(255,224,140,' : dk ? 'rgba(170,215,205,' : 'rgba(255,250,230,') + (0.6 * (1 - kk)) + ')'; ca.lineWidth = 1.2; n9_ell(ca, r.x, r.y, 2 + kk * r.r, (2 + kk * r.r) * 0.3); ca.stroke(); } });
      A.knees.forEach(function (kn, q) { var k = (tt * 0.25 + q * 0.37) % 1; ca.strokeStyle = dk ? 'rgba(170,215,205,' + 0.3 * (1 - k) + ')' : 'rgba(255,250,230,' + 0.45 * (1 - k) + ')'; ca.lineWidth = 1; n9_ell(ca, kn.x, kn.y + 1, kn.w * (1.4 + k * 2), kn.w * (1.4 + k * 2) * 0.28); ca.stroke(); });
      // sun rays through the haze (day), a soft breathing glow round the moon (night)
      ca.save(); ca.globalCompositeOperation = 'lighter';
      if (!dk) { var boost = T != null ? n9_env(T, 0.5, 2, 10, 13) : 0; for (i = 0; i < 7; i++) { var an = Math.PI * (0.16 + i * 0.11) + Math.sin(tt * 0.07 + i) * 0.02, RL = (hy - M[1]) * 2.6, aw = 0.022 + 0.012 * Math.sin(i * 1.7), al = (0.07 + 0.05 * Math.sin(tt * 0.35 + i * 1.9)) * (1 + boost * 1.2);
        var gr = ca.createLinearGradient(M[0], M[1], M[0] + Math.cos(an) * RL, M[1] + Math.sin(an) * RL); gr.addColorStop(0, 'rgba(255,244,200,' + al + ')'); gr.addColorStop(1, 'rgba(255,244,200,0)'); ca.fillStyle = gr;
        ca.beginPath(); ca.moveTo(M[0], M[1]); ca.lineTo(M[0] + Math.cos(an - aw) * RL, M[1] + Math.sin(an - aw) * RL); ca.lineTo(M[0] + Math.cos(an + aw) * RL, M[1] + Math.sin(an + aw) * RL); ca.fill(); } }
      n9_glow(ca, moonG, M[0], M[1], M[2] * (dk ? 2.6 : 3.4) * (1 + 0.04 * Math.sin(tt * 0.6)), dk ? 0.5 : 0.35);
      // fireflies and their reflections (the far ones behind the foreground trunk and banks)
      flies.forEach(function (q) { if (!q.front) drawFly(ca, q, tt, T); });
      ca.restore(); ca.globalAlpha = 1;
      // in front: the nearest fireflies, the swaying moss, and the lily buds
      drawMoss(cb, tt);
      buds.forEach(function (b) { drawBud(cb, b, tt); });
      cb.save(); cb.globalCompositeOperation = 'lighter'; flies.forEach(function (q) { if (q.front) drawFly(cb, q, tt, T); }); cb.globalAlpha = 1;
      // the moment: a ribbon of light spirals up from the water and rings the moon (or the low sun), then drifts apart
      if (T != null && T > 2.6 && T < 15) { var sx = W * 0.5, sy = H * (ph ? 0.86 : 0.88), env = n9_env(T, 2.6, 3.6, 11, 14.5);
        for (i = 0; i < swarmN; i++) { var o = i / swarmN, p = n9_ease((T - 3 - o * 1.6) / 4.2); if (p <= 0) continue; var ang = p * Math.PI * 4 + o * Math.PI * 2, rad = (1 - p) * W * (ph ? 0.12 : 0.07) * Math.sin(Math.PI * Math.min(1, p * 1.4) + 0.3), ring = M[2] * (dk ? 1.7 : 2.1),
          ea = o * Math.PI * 2 + Math.max(0, T - 7) * 0.35, ex = M[0] + Math.cos(ea) * ring, ey = M[1] + Math.sin(ea) * ring * 0.92, px = sx + (ex - sx) * p + Math.cos(ang) * rad, py = sy + (ey - sy) * n9_ease(p * 1.05) + Math.sin(ang) * rad * 0.35;
          if (T > 11) { var dsp = (T - 11) * (18 + (i % 7) * 6) * S; px += Math.cos(ea) * dsp; py += Math.sin(ea) * dsp + (T - 11) * 6; }
          var br = 0.6 + 0.4 * Math.sin(tt * 6 + i * 1.7), rr2 = (dk ? 11 : 13) * S * (0.7 + 0.5 * (i % 3) / 2);
          cb.globalAlpha = env * br; cb.drawImage(spr, px - rr2, py - rr2, rr2 * 2, rr2 * 2);
          // a short glowing tail behind each light while it climbs
          if (p < 1) { cb.globalAlpha = env * br * 0.35; var px2 = px - Math.cos(ang + 0.6) * rad * 0.2, py2 = py + 10 * S; cb.drawImage(spr, px2 - rr2 * 0.6, py2 - rr2 * 0.6, rr2 * 1.2, rr2 * 1.2); } }
        n9_glow(cb, moonG, M[0], M[1], M[2] * 3.2, 0.6 * n9_env(T, 6, 8, 11, 14)); }
      cb.restore(); cb.globalAlpha = 1;
    },
    finish: function (t) { fin = {t0: t}; buds.forEach(function (b) { b.rang = 0; }); }
  };
};

UIC.bayou = {L: ['#3E5E42', '#2E4A34', 'rgba(255,255,252,0.84)', '#1C2618', '#56604C', '#A8562A', '#A8562A', '#C27A36', '#FFFFFF'], D: ['#0E2628', '#08161A', 'rgba(10,28,30,0.78)', '#EEF4E8', '#A8BCAE', '#FFD36E', '#FFD36E', '#FFE9A8', '#14200E']};

// ---------- Karst River: mist drifts between the towers, the still river shimmers and mirrors them, the foreground bamboo sways and
// drops a leaf now and then, the little raft drifts along with its lantern swinging, and far birds glide by day.
// Night: the lantern glows and lays a warm path on the water under the moon.
// Moment: the raft's lantern flares, river lanterns light one by one and float downstream, and sky lanterns rise between the peaks.
function n9_raft(c, x, y, s, t, dk, glowK, lanG) { c.save(); c.translate(x, y); c.scale(s, s);
  var logA = dk ? '#6E6A4A' : '#D2B878', logB = dk ? '#5A573C' : '#B89A5A', cap = dk ? '#3E3C2A' : '#8A7040';
  // five bamboo logs side by side, their front ends curving up a little
  for (var i = 0; i < 5; i++) { var yy = -8 + i * 4; c.fillStyle = i % 2 ? logB : logA; c.beginPath(); c.moveTo(-50 + i * 1.5, yy); c.lineTo(44 - i * 1.2, yy); c.quadraticCurveTo(54 - i, yy - 0.5, 58 - i * 1.2, yy - 7 + i * 0.6); c.lineTo(58.5 - i * 1.2, yy - 3.6 + i * 0.6); c.quadraticCurveTo(52 - i, yy + 3.6, 44 - i * 1.2, yy + 3.6); c.lineTo(-50 + i * 1.5, yy + 3.6); c.closePath(); c.fill();
    c.fillStyle = cap; n9_ell(c, -50 + i * 1.5, yy + 1.8, 1.3, 1.8); c.fill(); }
  c.strokeStyle = dk ? '#2E2A1E' : '#6E5530'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-34, -9); c.lineTo(-31, 12); c.moveTo(22, -9); c.lineTo(24, 12); c.stroke();
  // a straw hat and a little basket resting on the logs
  c.fillStyle = dk ? '#8A8058' : '#E8CF8A'; c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(-18, -19, -10, -6); c.quadraticCurveTo(-18, -3, -26, -6); c.fill();
  c.fillStyle = dk ? '#6E6446' : '#C8A85E'; n9_ell(c, -18, -5.5, 10, 2.4); c.fill();
  c.fillStyle = dk ? '#5A4E36' : '#A0783E'; c.beginPath(); c.moveTo(6, -12); c.lineTo(18, -12); c.lineTo(16, -3); c.lineTo(8, -3); c.closePath(); c.fill(); c.strokeStyle = dk ? '#3E3424' : '#7A5A2E'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(7, -9); c.lineTo(17, -9); c.moveTo(7.5, -6); c.lineTo(16.5, -6); c.stroke();
  // the lantern pole at the stern, bending over, with a red paper lantern swinging from it
  c.strokeStyle = dk ? '#4A4030' : '#8A6A3A'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(38, -4); c.lineTo(38, -62); c.quadraticCurveTo(38, -70, 28, -70); c.stroke();
  var sw = Math.sin(t * 1.3) * 0.12 + Math.sin(t * 0.47) * 0.05; c.save(); c.translate(26, -70); c.rotate(sw);
  c.strokeStyle = dk ? '#2E2A20' : '#4A3A2A'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 7); c.stroke();
  if (glowK > 0) { c.save(); c.globalCompositeOperation = 'lighter'; n9_glow(c, lanG, 0, 16, 40 * (0.8 + glowK * 0.4), glowK); c.restore(); }
  c.fillStyle = dk ? '#FF7A52' : '#E0503E'; n9_ell(c, 0, 16, 7.5, 9.5); c.fill();
  if (dk) { c.fillStyle = 'rgba(255,220,140,0.55)'; n9_ell(c, -1, 15, 4.5, 6.5); c.fill(); }
  c.strokeStyle = dk ? 'rgba(140,40,20,0.6)' : 'rgba(130,30,20,0.45)'; c.lineWidth = 0.7; c.beginPath(); for (var r = -2; r <= 2; r++) { c.moveTo(-7, 16 + r * 3.4); c.lineTo(7, 16 + r * 3.4); } c.stroke();
  c.fillStyle = '#2E2A30'; c.fillRect(-4, 6, 8, 2); c.fillRect(-4, 24.5, 8, 2); c.fillStyle = dk ? '#FFB060' : '#E8A030'; c.fillRect(-0.5, 26.5, 1, 4);
  c.restore(); c.restore(); }
// a floating lotus lantern with its candle
function n9_lotusLantern(c, x, y, s, t, dk, ph) { c.save(); c.translate(x, y); c.scale(s, s);
  var p1 = dk ? '#F7B6C8' : '#F49AB4', p2 = dk ? '#FFE0E8' : '#FFD2DE', i;
  c.fillStyle = p1; for (i = 0; i < 5; i++) n9_petal(c, 0, 0, -Math.PI / 2 + (i - 2) * 0.55, 13, 4.2, 0.7);
  var fl = 0.8 + 0.2 * Math.sin(t * 9 + ph); c.fillStyle = dk ? 'rgba(255,230,150,0.95)' : 'rgba(255,214,110,0.95)'; c.beginPath(); c.moveTo(0, -14 * fl); c.quadraticCurveTo(3, -8, 0, -5); c.quadraticCurveTo(-3, -8, 0, -14 * fl); c.fill();
  c.fillStyle = p2; for (i = 0; i < 4; i++) n9_petal(c, 0, 1, -Math.PI / 2 + (i - 1.5) * 0.7, 10, 3.8, 0.55);
  c.fillStyle = dk ? '#3E8A5A' : '#5EA86A'; n9_ell(c, 0, 3, 13, 3.2); c.fill(); c.fillStyle = p1; n9_ell(c, 0, 1.6, 9, 2.4); c.fill();
  c.restore(); }
ENGINES.karst = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = A.ph, S = A.S, hy = A.hy, M = A.moon, R = A.raft, i;
  var mistG = n9_rg(dk ? 'rgba(160,195,205,0.2)' : 'rgba(255,255,252,0.75)', [0.5, 0.45]), lanG = n9_rg('rgba(255,170,90,0.75)', [0.3, 0.3]), warmG = n9_rg(dk ? 'rgba(255,190,110,0.6)' : 'rgba(255,200,140,0.45)', [0.35, 0.3]), moonG = n9_rg(dk ? 'rgba(220,235,240,0.3)' : 'rgba(255,252,236,0.4)', [0.4, 0.3]);
  var leaves = [], nextLeaf = 2, birds = [], fin = null, ripples = [], nextRip = 1;
  var leafC = dk ? '#2E5A3E' : '#7EB060', culmC = dk ? '#2A4636' : '#7EA456', nodeC = dk ? '#162A22' : '#4E7034', fgLeaf = dk ? '#1C3A2E' : '#4E8A44';
  if (!dk) for (i = 0; i < 3; i++) birds.push({x: W * (0.2 + i * 0.25), y: H * (0.12 + i * 0.05), v: (8 + i * 3) * S, ph: i * 2.1, s: (ph ? 2.6 : 4) * (1 - i * 0.15)});
  function raftX(t) { var span = W * 1.3, u = (t * W * 0.004 / span + (R.x / W + 0.15) / 1.3) % 1; return -W * 0.15 + u * span; }
  function sky(T, k0) { var k = (T - 2.4 - k0 * 0.7); if (k < 0 || k > 12) return null; var u = k / 12, x0 = W * (ph ? 0.2 + k0 * 0.15 : 0.22 + k0 * 0.13) + Math.sin(k0 * 2.3) * 30, y0 = H * 0.98; return {x: x0 + Math.sin(k * 0.6 + k0) * 22 * S + u * 40 * S, y: y0 - (y0 + 60) * (1 - Math.pow(1 - u, 1.6)), s: (ph ? 0.8 : 1.2) * S * (1 - u * 0.65), a: n9_env(k, 0, 0.8, 9.5, 12)}; }
  function river(T, k0) { var k = T - 0.8 - k0 * 0.4; if (k < 0 || k > 11) return null; var p = Math.min(1, k / 10.5), x0 = W * (0.4 + ((k0 * 37) % 17) / 17 * 0.24), yy = hy + H * 0.05 + (H * 1.04 - hy - H * 0.05) * Math.pow(p, 1.3);
    return {x: x0 + (x0 - W * 0.52) * 2.4 * p + Math.sin(p * 4 + k0) * W * 0.03, y: yy, s: (0.35 + 1.15 * Math.pow(p, 1.2)) * (ph ? 0.8 : 1.25) * S, a: Math.min(1, k * 1.5) * (1 - n9_ease((p - 0.9) / 0.1))}; }
  return {
    step: function (dt, t, f) {
      nextLeaf -= dt * f.s; if (nextLeaf <= 0) { nextLeaf = 2.5 + Math.random() * 4; var c = A.fg[Math.floor(Math.random() * A.fg.length)], p = n9_culmPt(c, 0.5 + Math.random() * 0.4, 0); leaves.push({x: p[0], y: p[1], vx: (10 + Math.random() * 20) * S * (c.x < W / 2 ? 1 : -1), vy: (18 + Math.random() * 12) * S, r: Math.random() * 6, vr: (Math.random() - 0.5) * 2, ph: Math.random() * 6, t0: t, land: hy + Math.random() * (H - hy) * 0.9}); }
      leaves.forEach(function (l) { if (l.wet) { l.a = (l.a || 1) - dt * 0.15; return; } l.x += (l.vx + Math.sin(t * 1.8 + l.ph) * 20 * S) * dt; l.y += l.vy * dt; l.r += l.vr * dt; if (l.y > l.land) { l.wet = 1; ripples.push({x: l.x, y: l.y, t0: t, r: 22 * S, life: 2.2}); } });
      leaves = leaves.filter(function (l) { return !(l.a < 0) && l.y < H + 30 && l.x > -40 && l.x < W + 40; });
      nextRip -= dt * f.s; if (nextRip <= 0) { nextRip = 1 + Math.random() * 2.5; var yy = hy + 10 + Math.random() * (H - hy) * 0.8; ripples.push({x: Math.random() * W, y: yy, t0: t, r: (8 + 26 * (yy - hy) / (H - hy)) * S, life: 2.6}); }
      ripples = ripples.filter(function (r) { return t - r.t0 < r.life; });
      birds.forEach(function (b) { b.x += b.v * dt * f.s; if (b.x > W + 40) { b.x = -40; b.y = H * (0.1 + Math.random() * 0.15); } });
      if (fin && t - fin.t0 > 17) fin = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = fin ? t - fin.t0 : null, clearK = T != null ? n9_env(T, 0.5, 2.5, 11, 15) : 0, j;
      // the moon's (or the pale sun's) glow and its path on the water
      ca.save(); ca.globalCompositeOperation = 'lighter'; n9_glow(ca, moonG, M[0], M[1], M[2] * 3, dk ? 0.6 : 0.4); ca.restore();
      ca.save(); ca.lineCap = 'round';
      for (i = 0; i < (ph ? 18 : 30); i++) { var u = (i + 0.5) / (ph ? 18 : 30), y = hy + 6 + u * u * (H - hy), wd = (M[2] * 0.6 + u * W * 0.04) * (0.5 + 0.5 * Math.sin(tt * 0.8 + i * 2.3)), x = M[0] + Math.sin(tt * 0.45 + i * 1.7) * wd * 0.5, a = (dk ? 0.4 : 0.35) * (0.4 + 0.6 * Math.abs(Math.sin(tt * 1.1 + i * 3.7))) * (1 - u * 0.6);
        ca.strokeStyle = dk ? 'rgba(230,238,230,' + a + ')' : 'rgba(255,255,248,' + a + ')'; ca.lineWidth = 1 + u * 1.8; ca.beginPath(); ca.moveTo(x - wd * 0.5, y); ca.lineTo(x + wd * 0.5, y); ca.stroke(); }
      for (i = 0; i < (ph ? 10 : 18); i++) { var u2 = (i + 0.5) / (ph ? 10 : 18), y2 = hy + 8 + u2 * (H - hy - 16), x2 = ((i * 0.41 + tt * 0.005 * (1 + i % 3)) % 1) * W, w2 = (26 + u2 * 80) * S;
        ca.strokeStyle = dk ? 'rgba(160,200,210,0.14)' : 'rgba(255,255,255,0.4)'; ca.lineWidth = 1.2; ca.beginPath(); ca.moveTo(x2 - w2, y2); ca.quadraticCurveTo(x2, y2 - 1.5, x2 + w2, y2); ca.stroke(); }
      ca.restore();
      ripples.forEach(function (r) { var k = (t - r.t0) / r.life; for (var q = 0; q < 2; q++) { var kk = k - q * 0.2; if (kk <= 0) continue; ca.strokeStyle = (dk ? 'rgba(170,210,220,' : 'rgba(255,255,255,') + (0.55 * (1 - kk)) + ')'; ca.lineWidth = 1.1; n9_ell(ca, r.x, r.y, 2 + kk * r.r, (2 + kk * r.r) * 0.3); ca.stroke(); } });
      // mist drifting between the towers (it parts for the moment)
      [[hy - H * 0.02, 1, 0.8], [hy - H * 0.1, -1, 0.45], [hy - H * 0.2, 1, 0.3], [hy + H * 0.01, -1, 0.6]].forEach(function (b, k) { for (j = 0; j < (ph ? 4 : 7); j++) { var xx = ((j / (ph ? 4 : 7)) * (W + 500) + tt * (4 + k * 2) * b[1] + k * 170) % (W + 500); if (xx < 0) xx += W + 500; n9_glow(ca, mistG, xx - 250, b[0] + Math.sin(tt * 0.2 + j + k) * 6, (ph ? 120 : 230) * S, b[2] * (dk ? 0.38 : 0.5) * (1 - clearK * 0.7), 0.16); } });
      // far birds, tiny, by day
      ca.strokeStyle = 'rgba(60,80,80,0.55)'; ca.lineWidth = 1.1; ca.lineCap = 'round'; birds.forEach(function (b) { var fl = Math.sin(tt * 5 + b.ph) * 0.5, by = b.y + Math.sin(tt * 0.5 + b.ph) * 6; ca.beginPath(); ca.moveTo(b.x - b.s, by - b.s * fl); ca.quadraticCurveTo(b.x - b.s * 0.4, by - b.s * 0.3, b.x, by); ca.quadraticCurveTo(b.x + b.s * 0.4, by - b.s * 0.3, b.x + b.s, by - b.s * fl); ca.stroke(); });
      // the raft, its reflection, the lantern's glow on the water and the little wake behind it
      var rx = raftX(tt), ry = R.y + Math.sin(tt * 1.1) * 1.2 * R.s, gk = (dk ? 0.85 : 0.25) * (0.75 + 0.25 * flick(tt, 3)) + (T != null ? n9_env(T, 0, 0.4, 1.6, 3) * 0.9 : 0);
      ca.save(); ca.beginPath(); ca.rect(-10, ry + 6 * R.s, W + 20, H); ca.clip(); ca.globalAlpha = dk ? 0.3 : 0.25; ca.translate(0, (ry + 6 * R.s) * 2); ca.scale(1, -1); n9_raft(ca, rx, ry, R.s, tt, dk, 0, lanG); ca.restore();
      if (dk || gk > 0.5) { ca.save(); ca.globalCompositeOperation = 'lighter'; var lx = rx + 26 * R.s; for (j = 0; j < 9; j++) { var gy = ry + 12 * R.s + j * 9 * R.s; n9_glow(ca, warmG, lx + Math.sin(tt * 1.4 + j) * 4 * R.s, gy, (26 - j * 1.5) * R.s, gk * 0.5 * (1 - j / 10), 0.22); } ca.restore(); }
      ca.strokeStyle = dk ? 'rgba(170,210,220,0.3)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 1.1; for (j = 0; j < 3; j++) { var k2 = (tt * 0.4 + j / 3) % 1, wx = rx - 52 * R.s - k2 * 60 * R.s; ca.globalAlpha = 1 - k2; ca.beginPath(); ca.moveTo(rx - 48 * R.s, ry + 9 * R.s); ca.quadraticCurveTo(wx + 20 * R.s, ry + 9 * R.s - 2, wx, ry + 9 * R.s - k2 * 6 * R.s); ca.moveTo(rx - 48 * R.s, ry + 9 * R.s); ca.quadraticCurveTo(wx + 20 * R.s, ry + 9 * R.s + 2, wx, ry + 9 * R.s + k2 * 9 * R.s); ca.stroke(); } ca.globalAlpha = 1;
      n9_raft(ca, rx, ry, R.s, tt, dk, gk, lanG);
      // the moment: river lanterns float downstream (on the water, behind the foreground)
      if (T != null) { for (i = 0; i < (ph ? 9 : 15); i++) { var L = river(T, i); if (!L) continue; ca.save(); ca.globalAlpha = L.a; ca.globalCompositeOperation = 'lighter'; n9_glow(ca, warmG, L.x, L.y - 6 * L.s, 34 * L.s, dk ? 0.9 : 0.8); n9_glow(ca, warmG, L.x, L.y + 14 * L.s, 22 * L.s, dk ? 0.5 : 0.3, 0.35); ca.restore(); ca.save(); ca.globalAlpha = L.a; n9_lotusLantern(ca, L.x, L.y, L.s, tt, dk, i); ca.restore(); } }
      // the swaying foreground bamboo
      A.fg.forEach(function (c) { var sw = Math.sin(tt * 0.5 + c.ph) * 0.025 + Math.sin(tt * 1.15 + c.ph * 2) * 0.008, bp = n9_bambooPaths(c, sw);
        cb.fillStyle = culmC; n9_fillPts(cb, bp.culm, 0, 0); cb.strokeStyle = nodeC; cb.lineWidth = Math.max(1.4, c.w * 0.16); cb.lineCap = 'round'; cb.beginPath(); bp.nodes.forEach(function (nd) { cb.moveTo(nd[0][0], nd[0][1]); cb.lineTo(nd[1][0], nd[1][1]); }); cb.stroke();
        cb.fillStyle = fgLeaf; bp.leaves.forEach(function (l) { n9_fillPts(cb, l, 0, 0); }); });
      // falling leaves
      cb.fillStyle = leafC; leaves.forEach(function (l) { cb.save(); cb.globalAlpha = l.a == null ? 1 : Math.max(0, l.a); cb.translate(l.x, l.y); cb.rotate(l.wet ? 0.2 : l.r + Math.sin(tt * 3 + l.ph) * 0.5); cb.scale(1, l.wet ? 0.35 : 1); n9_petal(cb, -9 * S, 0, 0, 18 * S, 2.6 * S, 1); cb.restore(); });
      // the moment: sky lanterns rise between the peaks
      if (T != null) for (i = 0; i < 5; i++) { var K = sky(T, i); if (!K) continue; cb.save(); cb.globalAlpha = K.a; cb.globalCompositeOperation = 'lighter'; n9_glow(cb, lanG, K.x, K.y, 46 * K.s, dk ? 0.9 : 0.5); cb.restore();
        cb.save(); cb.globalAlpha = K.a; cb.translate(K.x, K.y); cb.scale(K.s, K.s); cb.fillStyle = dk ? '#FFB070' : '#F08A5A'; cb.beginPath(); cb.moveTo(-9, -12); cb.quadraticCurveTo(0, -17, 9, -12); cb.lineTo(7, 10); cb.quadraticCurveTo(0, 12, -7, 10); cb.closePath(); cb.fill(); cb.fillStyle = dk ? 'rgba(255,240,180,0.85)' : 'rgba(255,230,160,0.8)'; n9_ell(cb, 0, 6, 4, 3); cb.fill(); cb.restore(); }
      cb.globalAlpha = 1;
    },
    finish: function (t) { fin = {t0: t}; }
  };
};

UIC.karst = {L: ['#3E7E70', '#2E6A5E', 'rgba(255,255,255,0.84)', '#14282A', '#4E6662', '#B8443A', '#B8443A', '#CC6A3E', '#FFFFFF'], D: ['#16303C', '#0C1C26', 'rgba(12,28,38,0.78)', '#EAF2F0', '#A2B8B6', '#FFB36A', '#FFB36A', '#FFD39A', '#1C140C']};
