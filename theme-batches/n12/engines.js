// ---- batch n12 engines: wisteria, bluebells
function n12_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n12_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n12_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n12_ease((T - c) / (d - c)); }
var n12_gc = null;
function n12_ctx() { return n12_gc || (n12_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n12_glow
function n12_rg(col, mid) { var g = n12_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n12_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n12_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
function n12_canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function n12_inPoly(P, x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

// ---------- Wisteria Walk: the racemes sway as breezes roll down the tunnel, sun flecks dance on the stone path, petals drift down,
// light shafts slant in through the far opening and the pond glints. Night: moonlight, the blossoms glow pale against deep violet.
// Moment: a warm breeze rushes down the tunnel: the racemes swing one arch after another, a cascade of lavender and white petals
// streams toward the bridge, the light shafts blaze, and the petals settle on the pond in rings of ripples.
// one raceme sprite (hanging from x = w/2, y = 0): florets with a lit standard petal over a shaded keel, pale open blooms at the top
// and deep buds at the tip; white racemes go cream with green-tipped buds
function n12_bakeRaceme(w, L, white, dk, seed) { var pad = w * 0.3, cv = n12_canvas(w + pad * 2, L + pad), c = cv.getContext('2d'), rows = Math.round(L / (w * 0.13)), i, j, R = function (k) { return hash(seed * 7.13 + k * 1.37); };
  var pal = white ? (dk ? [['#E6E2F6', '#FFFFFF'], ['#D6D0EE', '#F4F0FF'], ['#B8C0B4', '#D8E2D0']] : [['#E8E2D8', '#FFFFFF'], ['#D8D0E2', '#F6F2FA'], ['#A8BC90', '#C8D8A8']])
    : (dk ? [['#A898DC', '#D8D0FA'], ['#7E6CC4', '#B2A4EA'], ['#56449E', '#7C68C4']] : [['#B49CE0', '#DCD0F4'], ['#9070CC', '#B79AE4'], ['#6A48AE', '#8A66C6']]);
  c.translate(pad + w / 2, 2);
  c.strokeStyle = dk ? '#3A3A5A' : '#6A8A4A'; c.lineWidth = Math.max(1, w * 0.04); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w * 0.05, L * 0.5, (R(1) - 0.5) * w * 0.2, L * 0.96); c.stroke();
  for (i = rows - 1; i >= 0; i--) { var t = i / (rows - 1), cy = t * L * 0.97 + w * 0.06, cx = Math.sin(t * 4 + seed) * w * 0.04 + (R(2) - 0.5) * w * 0.25 * t * t, r = w * 0.17 * (1 - 0.68 * Math.pow(t, 0.85)) + 0.6, sp = w * 0.3 * (1 - 0.75 * t), m = t < 0.72 ? 3 : t < 0.9 ? 2 : 1, ci = t < 0.36 ? 0 : t < 0.7 ? 1 : 2;
    for (j = 0; j < m; j++) { var fx = cx + (m === 1 ? 0 : (j / (m - 1) - 0.5) * 2 * sp) + (i % 2 ? sp * 0.25 : -sp * 0.25) + (R(i * 3 + j) - 0.5) * r * 0.6, fy = cy + (R(i * 5 + j) - 0.5) * r * 0.5, col = pal[ci];
      if (t > 0.72) { c.fillStyle = col[0]; n12_ell(c, fx, fy, r * 0.7, r * 0.95); c.fill(); c.fillStyle = col[1]; n12_ell(c, fx - r * 0.2, fy - r * 0.25, r * 0.28, r * 0.42); c.fill(); continue; }
      c.fillStyle = col[0]; n12_ell(c, fx, fy + r * 0.2, r * 0.82, r * 0.62); c.fill();
      c.fillStyle = col[1]; n12_ell(c, fx + (R(i * 7 + j) - 0.5) * r * 0.4, fy - r * 0.25, r * 0.72, r * 0.6, (R(i + j * 9) - 0.5) * 1.2); c.fill();
      if (!white && t < 0.5 && R(i * 11 + j) < 0.5) { c.fillStyle = dk ? '#E8E0A8' : '#F2E08A'; n12_ell(c, fx, fy - r * 0.15, r * 0.18, r * 0.14); c.fill(); } } }
  c.fillStyle = dk ? '#2A3058' : '#6C9A52'; [[-0.9, 0.22], [0.75, 0.18]].forEach(function (q) { c.save(); c.rotate(q[0]); n12_ell(c, w * q[1] * 2, 0, w * 0.34, w * 0.09); c.fill(); c.restore(); });
  return {cv: cv, ax: pad + w / 2, w: w + pad * 2, h: L + pad, bw: w, bL: L}; }
// a soft glow sprite for the same raceme shape (night)
function n12_bakeGlow(w, L, col) { var pad = w * 0.8, cv = n12_canvas(w + pad * 2, L + pad * 2), c = cv.getContext('2d'), g = n12_rg(col, [0.4, 0.5]); for (var i = 0; i < 8; i++) { var t = i / 7, r = w * (0.9 - 0.55 * t); c.save(); c.translate(pad + w / 2, pad + t * L * 0.9); c.scale(r, r); c.fillStyle = g; c.globalAlpha = 0.5; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); } return {cv: cv, ax: pad + w / 2, ay: pad, w: w + pad * 2, h: L + pad * 2, bw: w, bL: L}; }
ENGINES.wisteria = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, vx = A.vp[0], vy = A.vp[1], D = A.vp[2], i, tnow = 0;
  var X = function (x, z) { return vx + x * D / z; }, Y = function (y, z) { return vy + (1 - y) * D / z; };
  var spr = [], glows = [], BW = ph ? 40 : 60;
  for (i = 0; i < 16; i++) { var Lr = BW * (3.4 + hash(i * 3.1) * 2.6); spr.push(n12_bakeRaceme(BW, Lr, i >= 12, dk, i + 1)); }
  if (dk) [0, 1].forEach(function (k) { glows.push(n12_bakeGlow(BW, BW * 4.6, k ? 'rgba(240,236,255,0.5)' : 'rgba(190,170,255,0.5)')); });
  var rac = A.rac.map(function (r) { var s = r.wh ? spr[12 + r.v % 4] : spr[r.v % 12]; return {x: r.x, y: r.y, L: r.L, w: r.w, z: r.z, s: s, wh: r.wh, ph: r.ph, sx: r.v % 2 ? -1 : 1, a: 0, va: 0}; });
  var trHi = new Path2D(A.trHi || ''), farR = rac.filter(function (r) { return r.z > 1.3; }), nearR = rac.filter(function (r) { return r.z <= 1.3; });
  var sunG = n12_rg(dk ? 'rgba(210,200,255,0.4)' : 'rgba(255,250,220,0.6)', [0.35, 0.35]), fleckG = n12_rg(dk ? 'rgba(210,214,255,0.5)' : 'rgba(255,246,200,0.75)', [0.45, 0.5]), twG = n12_rg('rgba(255,250,255,0.95)', [0.25, 0.3]), petG = n12_rg('rgba(220,200,255,0.8)', [0.3, 0.3]);
  var flecks = []; for (i = 0; i < (ph ? 22 : 36); i++) flecks.push({x: (Math.random() - 0.5) * A.P * 2.6, z: A.Zn + 0.15 + Math.pow(Math.random(), 0.8) * (A.Zp - A.Zn - 0.2), r: 0.03 + Math.random() * 0.07, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.2});
  var tws = []; for (i = 0; i < 400 && tws.length < (ph ? 8 : 14); i++) { var tx = vx + (Math.random() - 0.5) * W * 0.5, ty = vy - Math.random() * D * 0.6; if (n12_inPoly(A.opening, tx, ty) && ty < vy - 30 && Math.hypot(tx - A.sun[0], ty - A.sun[1]) > A.sun[2] * 3) tws.push([tx, ty, Math.random() * 6.28]); }
  var petals = [], rings = [], fin = null;
  var PCOL = dk ? ['#C8BEF2', '#E8E4FA', '#A898E0'] : ['#B49AE2', '#D2C2F0', '#FFFFFF', '#9A7AD2'];
  function spawnPetal(zMin, zMax, burst) { var z = zMin + Math.random() * (zMax - zMin); petals.push({x: (Math.random() - 0.5) * A.A * (burst ? 2.2 : 1.6), y: burst ? 1.1 + Math.random() * 1.5 : 2.0 + Math.random() * 0.6, z: z, vx: (Math.random() - 0.5) * (burst ? 0.4 : 0.1), vy: -(0.12 + Math.random() * 0.12) * (burst ? 0.6 : 1), vz: burst ? 0.25 + Math.random() * 0.45 : 0.02, big: burst ? 1.5 : 1, ph: Math.random() * 6.28, c: PCOL[Math.floor(Math.random() * PCOL.length)], t0: tnow, land: 0}); }
  function gustAt(z, t) { var zg = A.Zn - 0.6 + ((t * 0.32) % 6.5), d = (z - zg) / 0.7, g = Math.exp(-d * d) * 0.55; if (fin) { var T = t - fin.t0, zf = A.Zn - 0.4 + T * 1.5, d2 = (z - zf) / 0.55; if (T < 4.5) g += Math.exp(-d2 * d2) * 2.2; } return g; }
  function drawR(c, r, t) { var s = r.s; c.save(); c.translate(r.x, r.y); c.rotate(r.a); c.scale(r.sx * r.w / s.bw, r.L / s.bL); c.drawImage(s.cv, -s.ax, -2); c.restore(); }
  function drawGlow(c, r, al) { var g = glows[r.wh ? 1 : 0]; c.save(); c.globalAlpha = al; c.translate(r.x, r.y); c.rotate(r.a); c.scale(r.w / g.bw, r.L / g.bL); c.drawImage(g.cv, -g.ax, -g.ay); c.restore(); }
  function drawPetal(c, p, t) { var px = X(p.x, p.z), py = Y(p.y, p.z), s = (0.022 * D / p.z) * (0.7 + 0.3 * Math.sin(p.ph)) * p.big, age = t - p.t0, al = Math.min(1, age * 2) * (p.land ? Math.max(0, 1 - (t - p.land) / 3) : 1); if (al <= 0) return;
    if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; n12_glow(c, petG, px, py, s * 3, al * 0.35); c.restore(); }
    c.save(); c.globalAlpha = al; c.translate(px, py); c.rotate(p.land ? p.ph : age * 2.6 + p.ph); c.fillStyle = p.c; n12_ell(c, 0, 0, s, s * (p.land ? 0.55 : 0.5 + 0.4 * Math.abs(Math.sin(age * 4 + p.ph)))); c.fill(); c.restore(); }
  return {
    step: function (dt, t, f) { tnow = t;
      rac.forEach(function (r) { var g = gustAt(r.z, t * f.s), target = (Math.sin(t * 0.7 * f.s + r.ph) * 0.022 + Math.sin(t * 1.9 * f.s + r.ph * 2) * 0.006) * f.a + g * 0.07 * (r.z < 1.5 ? 0.8 : 1); r.va += ((target - r.a) * 9 - r.va * 2.6) * dt; r.a += r.va * dt; });
      if (Math.random() < dt * (ph ? 0.9 : 1.6) && petals.length < (ph ? 26 : 44)) spawnPetal(A.Zn + 0.1, A.Ze, false);
      petals.forEach(function (p) { if (p.land) return; var g = gustAt(p.z, t); p.x += (p.vx + Math.sin((t - p.t0) * 2 + p.ph) * 0.12) * dt; p.y += (p.vy + Math.cos((t - p.t0) * 3 + p.ph) * 0.05) * dt; p.z += (p.vz + g * 0.25) * dt; p.vz *= Math.pow(0.8, dt);
        if (p.z > A.Zp + 0.4 && p.z < A.Zp + 4.5 && p.y <= 0.02 && n12_inPoly(A.pond, X(p.x, p.z), Y(0, p.z))) { p.y = 0; p.land = t; rings.push({x: p.x, z: p.z, t0: t}); }
        else if (p.y <= 0) { p.y = 0; p.land = t; } });
      petals = petals.filter(function (p) { return !p.land || t - p.land < 3; }); rings = rings.filter(function (r) { return t - r.t0 < 3; });
      if (fin) { var T = t - fin.t0; if (T < 2.6) { var em = dt * (ph ? 45 : 80); while (em > 0) { if (Math.random() < em) spawnPetal(A.Zn - 0.2 + T * 0.3, A.Zn + 0.5 + T * 0.6, true); em -= 1; } } if (T > 12) fin = null; }
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, rk = fin ? n12_env(T, 0.3, 1.4, 5, 8.5) : 0, Sn = A.sun;
      // the sun's or moon's halo, and twinkling stars in the far opening
      ca.save(); ca.globalCompositeOperation = 'lighter'; n12_glow(ca, sunG, Sn[0], Sn[1], Sn[2] * (dk ? 3.6 : 3.2) * (1 + 0.04 * Math.sin(tt * 0.6) + rk * 0.5), 0.8 + rk * 0.2);
      if (dk) tws.forEach(function (s, j) { var a2 = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] + j)), 4); n12_glow(ca, twG, s[0], s[1], 3 + a2 * 3, a2 * 0.9); });
      // pond: glints (moon shimmer at night) and petal ripple rings
      for (i = 0; i < (ph ? 10 : 18); i++) { var u = hash(i * 3.7), w2 = hash(i * 9.1), gx = dk ? Sn[0] + (u - 0.5) * 30 * (1 + w2 * 2) : vx + (u - 0.5) * D * 1.4, gy = A.pTop + 4 + w2 * (A.pBot - A.pTop - 8), a3 = Math.pow(Math.max(0, Math.sin(tt * 1.6 + i * 2.3)), 3) * (dk ? 0.55 : 0.7);
        if (a3 > 0.02 && n12_inPoly(A.pond, gx - 8, gy) && n12_inPoly(A.pond, gx + 8, gy)) { ca.fillStyle = dk ? 'rgba(240,232,255,' + a3 + ')' : 'rgba(255,255,255,' + a3 + ')'; n12_ell(ca, gx, gy, 5 + w2 * 9, 0.9); ca.fill(); } }
      ca.restore();
      ca.lineWidth = 1; rings.forEach(function (r) { var k = (t - r.t0) / 3, rx = (0.04 + k * 0.3) * D / r.z; ca.strokeStyle = dk ? 'rgba(220,210,255,' + (0.5 * (1 - k)) + ')' : 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')'; n12_ell(ca, X(r.x, r.z), Y(0, r.z), rx, rx / r.z * 0.8); ca.stroke(); });
      // sun flecks dancing on the path as the canopy moves (moonlight at night)
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      flecks.forEach(function (q) { var a4 = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(tt * q.sp + q.ph), 2), dx = Math.sin(tt * 0.5 + q.ph) * 0.03 + gustAt(q.z, tt) * 0.04, rx = q.r * D / q.z; n12_glow(ca, fleckG, X(q.x + dx, q.z), Y(0, q.z), rx * (1 + rk * 0.4), (dk ? 0.35 : 0.55) * a4 * (1 + rk * 0.6), 0.8 / q.z); });
      ca.restore();
      // light shafts slanting in from the opening
      ca.save(); ca.globalCompositeOperation = 'lighter';
      for (i = 0; i < 4; i++) { var bx0 = Sn[0] + (i - 1.5) * D * 0.16, ba = (dk ? 0.03 : 0.05) * (0.6 + 0.4 * Math.sin(tt * 0.35 + i * 1.7)) + rk * 0.07, bw = (18 + i * 8) * S + 6, by1 = vy + D * 0.9, bx1 = bx0 - D * (0.5 + i * 0.12);
        var gr = ca.createLinearGradient(bx0, Sn[1], bx1, by1); gr.addColorStop(0, dk ? 'rgba(200,190,255,0)' : 'rgba(255,248,214,0)'); gr.addColorStop(0.35, dk ? 'rgba(200,190,255,' + ba + ')' : 'rgba(255,248,214,' + ba + ')'); gr.addColorStop(1, dk ? 'rgba(200,190,255,0)' : 'rgba(255,248,214,0)');
        ca.fillStyle = gr; ca.beginPath(); ca.moveTo(bx0 - bw * 0.3, Sn[1]); ca.lineTo(bx0 + bw * 0.3, Sn[1]); ca.lineTo(bx1 + bw * 2, by1); ca.lineTo(bx1 - bw * 2, by1); ca.closePath(); ca.fill(); }
      ca.restore();
      // a soft light catching one side of the twisted trunks
      ca.fillStyle = dk ? 'rgba(150,140,200,0.35)' : 'rgba(200,184,164,0.7)'; ca.fill(trHi);
      // the racemes: far ones under the near foliage, near ones on top; a pale glow under them at night
      var pz = petals.slice().sort(function (a, b) { return b.z - a.z; });
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; farR.forEach(function (r) { drawGlow(ca, r, 0.22 + 0.08 * Math.sin(tt * 0.8 + r.ph) + rk * 0.25 + gustAt(r.z, tt) * 0.06); }); ca.restore(); }
      var pi = 0; farR.forEach(function (r) { while (pi < pz.length && pz[pi].z > r.z) { if (pz[pi].z > 1.3) drawPetal(ca, pz[pi], t); pi++; } drawR(ca, r, t); });
      for (; pi < pz.length; pi++) if (pz[pi].z > 1.3) drawPetal(ca, pz[pi], t);
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; nearR.forEach(function (r) { drawGlow(cb, r, 0.2 + 0.08 * Math.sin(tt * 0.8 + r.ph) + rk * 0.25); }); cb.restore(); }
      nearR.forEach(function (r) { drawR(cb, r, t); });
      pz.forEach(function (p) { if (p.z <= 1.3) drawPetal(cb, p, t); });
    },
    finish: function (t) { fin = {t0: t}; }
  };
};

UIC.wisteria = {L: ['#5E4A8E', '#3E2E66', 'rgba(255,255,255,0.84)', '#2A2238', '#625A72', '#7A52B8', '#7A52B8', '#9A6ED0', '#FFFFFF'], D: ['#241C48', '#120E26', 'rgba(24,20,48,0.78)', '#F0ECFA', '#B4AACC', '#C2A8FF', '#C2A8FF', '#E0CCFF', '#1A1430']};

// ---------- Bluebell Wood: the foreground bluebells nod as breezes pass, sunbeams slant down through the canopy and drift, sun flecks
// shift over the carpet and the path, motes float in the light and a fresh beech leaf twirls down now and then.
// Night (blue hour): mist drifts low over the bluebells, the bells glimmer softly and the stars show between the crowns.
// Moment: a breath of wind rolls through the wood: a wave of nodding runs through the bluebells and a shimmer of violet light rolls
// away across the carpet into the distance, golden sunbeams fan down through the canopy (the mist glows at night) and fresh beech leaves spin down.
// a bluebell bell (unit size, hanging from 0,0): a narrow tube flaring to curled-back tips
function n12_bellPath() { return new Path2D('M-0.34 0C-0.42 0.3 -0.4 0.62 -0.5 0.86C-0.62 0.98 -0.74 0.96 -0.8 1.06C-0.6 1.12 -0.44 1.02 -0.3 1.04C-0.18 1.14 -0.08 1.06 0 1.12C0.08 1.06 0.18 1.14 0.3 1.04C0.44 1.02 0.6 1.12 0.8 1.06C0.74 0.96 0.62 0.98 0.5 0.86C0.4 0.62 0.42 0.3 0.34 0C0.2 -0.1 -0.2 -0.1 -0.34 0Z'); }
ENGINES.bluebells = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, vx = A.vp[0], vy = A.vp[1], D = A.vp[2], i, tnow = 0, bell = n12_bellPath();
  var fb = A.fb.map(function (f) { return {x: f.x, y: f.y, h: f.h, lean: f.lean, ph: f.ph, n: f.n, sd: f.lean >= 0 ? 1 : -1}; });
  var cBell = dk ? '#6A70DA' : '#5A56C8', cBell2 = dk ? '#8A92F0' : '#7C78DE', cIn = dk ? '#3E3E9A' : '#3E3A9C', cStem = dk ? '#3A5A72' : '#4E8A44';
  var beamCol = dk ? 'rgba(170,190,255,' : 'rgba(255,246,200,', fleckG = n12_rg(dk ? 'rgba(170,190,255,0.35)' : 'rgba(255,250,210,0.7)', [0.45, 0.5]), mistG = n12_rg(dk ? 'rgba(150,170,240,0.22)' : 'rgba(255,255,255,0.18)', [0.5, 0.55]), glowB = n12_rg(dk ? 'rgba(140,150,255,0.55)' : 'rgba(200,190,255,0.6)', [0.4, 0.5]), sparkG = n12_rg('rgba(255,255,255,0.95)', [0.25, 0.3]);
  var flecks = []; for (i = 0; i < (ph ? 18 : 32); i++) flecks.push({z: 1.1 + Math.pow(Math.random(), 1.2) * 8, x: (Math.random() - 0.5) * 2.4, r: 0.08 + Math.random() * 0.16, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.8});
  var motes = []; for (i = 0; i < (ph ? 22 : 40); i++) motes.push({x: Math.random() * W, y: Math.random() * H * 0.8, ph: Math.random() * 6.28, r: 0.8 + Math.random() * 1.4});
  var leaves = [], fin = null, beams = []; for (i = 0; i < (ph ? 4 : 6); i++) beams.push({x: W * (0.1 + i / (ph ? 4 : 6) * 0.9) + Math.random() * 40, w: (30 + Math.random() * 50) * S + 10, ph: Math.random() * 6.28});
  function finW(x, y) { if (!fin) return 0; var T = tnow - fin.t0, d = (x - (-100 + (W + 200) * T / 1.6)) / (W * 0.12 + 50); return T < 2.2 ? Math.exp(-d * d) * 1.4 : 0; }
  function wind(x, t) { var g = 0.5 + 0.5 * Math.sin(x * 0.006 - t * 1.1); return 0.15 + g * g * 0.5 + Math.sin(t * 1.9 + x * 0.02) * 0.06 + finW(x); }
  function addLeaf(burst) { leaves.push({x: burst ? Math.random() * W : W * (0.1 + Math.random() * 0.8), y: burst ? -20 - Math.random() * H * 0.25 : -20, vx: (Math.random() - 0.3) * 30 * S, vy: (40 + Math.random() * 30) * S, ph: Math.random() * 6.28, s: ((9 + Math.random() * 6) * S + 3) * (burst ? 1.4 : 1), t0: tnow, c: Math.random() < 0.5 ? 0 : 1}); }
  function drawBluebell(c, f, t) { var w = wind(f.x, t), bend = (w * 0.5 + Math.sin(t * 1.4 + f.ph) * 0.05) * f.h * 0.35, tx = f.x + f.sd * f.h * 0.2 + bend, ty = f.y - f.h + Math.abs(bend) * 0.25, cx = f.x + bend * 0.25 + f.sd * f.h * 0.02, cy = f.y - f.h * 0.8;
    c.strokeStyle = cStem; c.lineWidth = Math.max(1, f.h * 0.022); c.beginPath(); c.moveTo(f.x, f.y); c.quadraticCurveTo(cx, cy, tx, ty); c.stroke();
    var bs = f.h * 0.1, nod = 0.15 + w * 0.35;
    for (var k = 0; k < f.n; k++) { var u = 0.45 + 0.55 * k / (f.n - 1), iu = 1 - u, px = iu * iu * f.x + 2 * iu * u * cx + u * u * tx, py = iu * iu * f.y + 2 * iu * u * cy + u * u * ty, s2 = bs * (1.1 - u * 0.4);
      c.save(); c.translate(px, py); c.rotate(-f.sd * 0.25 + Math.sin(t * 2 + f.ph + k) * 0.08 + bend * 0.004 + (f.sd > 0 ? nod * 0.3 : -nod * 0.3)); c.scale(s2, s2 * 1.1);
      c.fillStyle = k % 2 ? cBell2 : cBell; c.fill(bell); c.fillStyle = cIn; c.beginPath(); c.ellipse(0, 1.0, 0.42, 0.08, 0, 0, 7); c.fill(); c.restore(); } }
  return {
    step: function (dt, t, f) { tnow = t;
      if (!dk && Math.random() < dt * 0.12 && leaves.length < 4) addLeaf(false);
      leaves.forEach(function (l) { var age = t - l.t0; l.x += (l.vx + Math.sin(age * 1.6 + l.ph) * 40 * S) * dt; l.y += l.vy * dt * (0.7 + 0.3 * Math.sin(age * 2 + l.ph)); });
      leaves = leaves.filter(function (l) { return l.y < H + 30 && t - l.t0 < 20; });
      if (fin) { var T = t - fin.t0; if (T < 3 && Math.random() < dt * (ph ? 18 : 30)) addLeaf(true); if (T > 12) fin = null; }
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, rk = fin ? n12_env(T, 0.4, 1.6, 4.5, 8) : 0;
      // sunbeams slanting down through the canopy (faint moonlit shafts at night), fanning out in the moment
      ca.save(); ca.globalCompositeOperation = 'lighter';
      beams.forEach(function (b, j) { var a = (dk ? 0.035 : 0.075) * (0.55 + 0.45 * Math.sin(tt * 0.25 + b.ph)) + rk * (dk ? 0.07 : 0.15), x0 = b.x + Math.sin(tt * 0.05 + b.ph) * 30, sl = -0.35 - (rk * (j - beams.length / 2) * 0.12), x1 = x0 + sl * H, y1 = H * 0.95;
        var g = ca.createLinearGradient(x0, 0, x1, y1); g.addColorStop(0, beamCol + '0)'); g.addColorStop(0.3, beamCol + a + ')'); g.addColorStop(0.85, beamCol + (a * 0.5) + ')'); g.addColorStop(1, beamCol + '0)'); ca.fillStyle = g;
        ca.beginPath(); ca.moveTo(x0 - b.w * 0.4, 0); ca.lineTo(x0 + b.w * 0.4, 0); ca.lineTo(x1 + b.w * 1.4, y1); ca.lineTo(x1 - b.w * 1.4, y1); ca.closePath(); ca.fill(); });
      // sun flecks on the carpet and the path
      flecks.forEach(function (q) { var a2 = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(tt * q.sp + q.ph), 2), xw = q.x + A.pathX(q.z) * 0.5 + Math.sin(tt * 0.3 + q.ph) * 0.05, rx = q.r * D / q.z; n12_glow(ca, fleckG, vx + xw * D / q.z, vy + D / q.z, rx, (dk ? 0.25 : 0.5) * a2 * (1 + rk), 0.35); });
      // motes floating in the light
      ca.fillStyle = dk ? 'rgba(200,214,255,0.7)' : 'rgba(255,250,220,0.85)';
      motes.forEach(function (m) { var x = m.x + Math.sin(tt * 0.3 + m.ph) * 20, y = m.y + Math.sin(tt * 0.2 + m.ph * 2) * 16 - (tt * 4 % 40), a3 = 0.3 + 0.7 * Math.max(0, Math.sin(tt * 0.9 + m.ph)); ca.globalAlpha = a3 * (dk ? 0.5 : 0.8); ca.beginPath(); ca.arc(x, y, m.r * S + 0.3, 0, 7); ca.fill(); }); ca.globalAlpha = 1;
      // mist drifting low over the bluebells (stronger at night)
      for (i = 0; i < 5; i++) { var mz = 1.6 + i * 1.6, mxx = ((tt * (6 + i * 2) + i * 380) % (W + 800)) - 400, my = vy + D / mz; n12_glow(ca, mistG, mxx, my, (260 + i * 40) * S * (ph ? 1.4 : 1) * (2.4 / mz + 0.4), dk ? 1 : 0.6, 0.12); }
      // the moment: a shimmer of violet light rolling away across the carpet
      if (fin && T < 5.5) { var al = n12_env(T, 0, 0.4, 3.4, 5.5); for (var gi = 0; gi < (ph ? 110 : 220); gi++) { var zf = 1.1 * Math.pow(20, Math.min(1, Math.max(0, T - hash(gi * 1.7) * 0.5) / 4)) * (0.92 + hash(gi * 3.3) * 0.16), gx = vx + (hash(gi * 5.9) - 0.5) * W * 1.2 * zf / D * D / zf * 1.0, gy = vy + D / zf, blocked = false;
          A.trunks.forEach(function (tk) { if (Math.abs(gx - tk[0]) < tk[2] * 0.6 && gy < tk[1]) blocked = true; }); if (blocked || gy > H) continue;
          var gr2 = (14 * S + 5) * (1.4 / zf + 0.2), tw2 = 0.6 + 0.4 * Math.sin(tt * 6 + gi); n12_glow(ca, glowB, gx, gy, gr2 * 2.2, al * 0.32, 0.4); n12_glow(ca, sparkG, gx, gy - gr2 * 0.3, gr2 * 0.42, al * tw2); } }
      ca.restore();
      // the foreground bluebells, with a soft glimmer at night and sparkles when the moment's wave reaches them
      cb.lineCap = 'round';
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; fb.forEach(function (fl, j) { if (j % 2) return; var g = 0.18 + 0.12 * Math.sin(tt * 0.9 + fl.ph); n12_glow(cb, glowB, fl.x + fl.sd * fl.h * 0.15, fl.y - fl.h * 0.75, fl.h * 0.35, g, 1.1); }); cb.restore(); }
      fb.forEach(function (fl) { drawBluebell(cb, fl, tt); });
      if (fin && T < 3) { cb.save(); cb.globalCompositeOperation = 'lighter'; fb.forEach(function (fl, j) { var w2 = finW(fl.x, fl.y); if (w2 > 0.2 && j % 2 === 0) n12_glow(cb, sparkG, fl.x + fl.sd * fl.h * 0.18, fl.y - fl.h * 0.8, 6 * S + 3, w2 * 0.6); }); cb.restore(); }
      // fresh beech leaves twirling down
      leaves.forEach(function (l) { var age = t - l.t0; cb.save(); cb.translate(l.x, l.y); cb.rotate(Math.sin(age * 2.2 + l.ph) * 0.9 + age); cb.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(age * 2.6 + l.ph)));
        cb.fillStyle = dk ? (l.c ? '#3A5A62' : '#2E4A56') : (l.c ? '#A8D85A' : '#86C04A'); cb.beginPath(); cb.moveTo(-l.s, 0); cb.quadraticCurveTo(0, -l.s * 0.5, l.s, 0); cb.quadraticCurveTo(0, l.s * 0.5, -l.s, 0); cb.fill();
        cb.strokeStyle = dk ? 'rgba(20,30,50,0.5)' : 'rgba(70,110,40,0.6)'; cb.lineWidth = 0.8; cb.beginPath(); cb.moveTo(-l.s * 0.9, 0); cb.lineTo(l.s * 0.9, 0); cb.stroke(); cb.restore(); });
    },
    finish: function (t) { fin = {t0: t}; }
  };
};

UIC.bluebells = {L: ['#4E6A3A', '#33492A', 'rgba(255,255,255,0.84)', '#1E2434', '#58607A', '#4E56B8', '#4E56B8', '#6A62CC', '#FFFFFF'], D: ['#1A2448', '#0C1226', 'rgba(16,22,44,0.78)', '#EDF0FA', '#AAB4CE', '#9AA8FF', '#9AA8FF', '#BCC0FF', '#10142A']};
