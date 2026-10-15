// ---- world theme engine: egypt (Egypt)
// Loop: the felucca's sail fills as it drifts along the Nile (a smaller one far off the other way), palm fronds sway,
// papyrus nods, heat shimmers over the sand, a camel caravan plods across the far dunes, ibises wade and feed in the
// shallows and pigeons circle the dovecote. Night: stars twinkle over the Milky Way (now and then a shooting star), the
// Nile carries the moon's path and the village windows glow. Moment: the sun (the moon at night) slides down onto the tip
// of the Great Pyramid, its capstone flashes gold, light sweeps down the stone faces of all three pyramids and a flock of
// ibises rises off the Nile across the glow.
function egypt_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function egypt_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return egypt_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - egypt_ease((T - c) / (d - c)); }
// a soft round glow: col is 'r,g,b', a its strength at the centre
function egypt_glow(c, x, y, r, col, a) { if (a <= 0.003 || r <= 0) return; var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + Math.min(1, a) + ')'); g.addColorStop(0.35, 'rgba(' + col + ',' + Math.min(1, a) * 0.4 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
// a sacred ibis in flight, facing right: white body and wings with black tips, black head, neck and curved bill. fl -1..1 is the wingbeat.
function egypt_flyIbis(c, x, y, s, fl, K) {
  // a wing seen from the side: a long pointed blade from the shoulder, up or down with the beat, black at the tip
  var wing = function (dx, up, col, tip) { var tx = x + (-0.1 + dx) * s - Math.abs(up) * 0.06 * s, ty = y - up * 0.66 * s, mx = x + (0.02 + dx) * s, my = y - up * 0.34 * s;
    c.fillStyle = col; c.beginPath(); c.moveTo(x + (0.15 + dx) * s, y - 0.02 * s); c.quadraticCurveTo(mx + 0.1 * s, my, tx, ty); c.quadraticCurveTo(mx - 0.12 * s, my + up * 0.02 * s, x + (-0.12 + dx) * s, y); c.closePath(); c.fill();
    c.fillStyle = tip; c.beginPath(); var a1 = [tx + (mx + 0.1 * s - tx) * 0.35, ty + (my - ty) * 0.35], a2 = [tx + (mx - 0.12 * s - tx) * 0.3, ty + (my - ty) * 0.3]; c.moveTo(a1[0], a1[1]); c.lineTo(tx, ty); c.lineTo(a2[0], a2[1]); c.closePath(); c.fill(); };
  wing(0.06, fl * 0.8, K.ibisFar, K.ibisDark);
  c.strokeStyle = K.ibisDark; c.lineCap = 'round'; c.lineWidth = Math.max(0.6, s * 0.035); c.beginPath(); c.moveTo(x - 0.24 * s, y + 0.03 * s); c.lineTo(x - 0.62 * s, y + 0.08 * s); c.stroke();
  c.fillStyle = K.ibis; c.beginPath(); c.ellipse(x, y, s * 0.31, s * 0.1, -0.06, 0, 7); c.fill();
  c.fillStyle = K.ibisDark; c.beginPath(); c.moveTo(x - 0.28 * s, y - 0.03 * s); c.lineTo(x - 0.44 * s, y + 0.02 * s); c.lineTo(x - 0.27 * s, y + 0.05 * s); c.fill();
  c.lineWidth = Math.max(0.8, s * 0.075); c.beginPath(); c.moveTo(x + 0.24 * s, y - 0.02 * s); c.quadraticCurveTo(x + 0.42 * s, y - 0.07 * s, x + 0.56 * s, y - 0.05 * s); c.stroke();
  c.lineWidth = Math.max(0.6, s * 0.03); c.beginPath(); c.moveTo(x + 0.56 * s, y - 0.05 * s); c.quadraticCurveTo(x + 0.76 * s, y - 0.06 * s, x + 0.86 * s, y + 0.06 * s); c.stroke();
  wing(-0.02, fl, K.ibis, K.ibisDark);
}

ENGINES.egypt = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, U = A.U, ku = A.ku, kh = A.kh, T0 = -99, i;
  var K = dk ? {palmB: '#183225', palmF: '#22432E', dates: '#5A2E28', boots: '#2A1E26', stem: '#264630', umb: '#3A6440', bract: '#2E5236', hull: '#1E151C', stripe: '#2A4A7A', sail: '#CFC8E0', seam: 'rgba(80,70,120,0.45)', spar: '#140E16',
    ibis: '#DCDAEE', ibisFar: '#B4B0CE', ibisDark: '#0E0A14', camel: '#1C1636', pigeon: '#4A4868', star: '255,248,232', sun: ['#FFFDF2', '#ECE4CC'], glowC: '225,228,255', path: 'rgba(255,240,205,'} :
    {palmB: '#4C7838', palmF: '#6A9846', dates: '#B4602A', boots: '#7E5636', stem: '#689A42', umb: '#88B252', bract: '#5A8A3A', hull: '#5A3A26', stripe: '#2F6FA8', sail: '#FDF6E8', seam: 'rgba(170,140,100,0.45)', spar: '#43301E',
    ibis: '#FFFFFF', ibisFar: '#E8E2DA', ibisDark: '#1E1A1E', camel: 'rgba(132,76,50,0.82)', pigeon: '#8C8AA2', star: '255,248,232', sun: ['#FFFDF0', '#FFE09A'], glowC: '255,214,140', path: 'rgba(255,242,206,'};
  // the sky things (sun, stars, caravan) stay behind every pyramid and the Sphinx: one even-odd clip per outline
  var outs = A.sil.map(function (p) { return new Path2D(rect(-60, -60, W + 120, H + 120) + poly(p)); });
  var skyClip = function (c) { outs.forEach(function (q) { c.clip(q, 'evenodd'); }); };
  var kuFaces = new Path2D(ku.left + ku.right), faFaces = new Path2D(A.fa.left + A.fa.right), meFaces = new Path2D(A.me.left + A.me.right);
  var capL = new Path2D(poly([ku.at(ku.L, 0.9), ku.at(ku.F, 0.9), ku.A])), capR = new Path2D(poly([ku.at(ku.F, 0.9), ku.at(ku.R, 0.9), ku.A]));
  var boats = A.boats.map(function (b, k) { return {x: b.x, y: b.y, L: b.L, dir: b.dir, v: b.v * U, ph: k * 2.3}; })
    .sort(function (p, q) { return p.y - q.y; }); // (drawn far to near, so the far one passes behind the near one)
  var waders = A.ibis.map(function (b, k) { return {x0: b.x, x: b.x, y: b.y, s: b.s, dir: b.dir, ph: k * 1.9 + 0.5, a: 1}; });
  var camels = []; for (i = 0; i < 4; i++) camels.push({off: i * 27 * U, s: 20 * U * (1 - i * 0.04) * (ph ? 0.8 : 1)});
  var cx = W * 0.1, twk = [], flock = [], shoot = null, nextShoot = 6;
  for (i = 0; i < (ph ? 16 : 30); i++) twk.push({x: hash(i + 3) * W, y: hash(i + 7) * (A.hz - H * 0.12), r: 1.4 + hash(i + 9) * 1.8, ph: hash(i + 11) * 6.28, sp: 1 + hash(i + 13) * 2});
  // sun position: in the loop it rests above and right of the Great Pyramid; the moment slides it onto the tip and back
  function sunPos(t) { var T = t - T0, go = egypt_ease((T - 0.1) / 2.0), back = egypt_ease((T - 12.5) / 3.5), k = go * (1 - back); return [A.sun[0] + (ku.A[0] - A.sun[0]) * k, A.sun[1] + (ku.A[1] - A.sun[1]) * k - Math.sin(k * Math.PI) * H * 0.025, k]; }
  function drawBoat(c, b, t, f, refl) { var fill = 0.5 + 0.5 * Math.sin(t * 0.55 * f.s + b.ph), y = b.y + Math.sin(t * 1.3 + b.ph) * 0.8 * f.a, P = egypt_boat(b.x, y, b.L, fill, b.dir);
    c.fillStyle = K.sail; c.fill(new Path2D(P.sail)); c.strokeStyle = K.seam; c.lineWidth = 0.8; c.stroke(new Path2D(P.seams));
    c.strokeStyle = K.spar; c.lineWidth = Math.max(1, b.L * 0.022); c.lineCap = 'round'; c.stroke(new Path2D(P.spars));
    c.fillStyle = K.hull; c.fill(new Path2D(P.hull)); c.fillStyle = K.stripe; c.fill(new Path2D(P.stripe));
    if (dk && !refl) { var lx = b.x - b.L * 0.38 * b.dir, ly = y - b.L * 0.22; c.save(); c.globalCompositeOperation = 'lighter'; egypt_glow(c, lx, ly, b.L * 0.3, '255,190,110', 0.6 * (0.8 + 0.2 * flick(t, b.ph))); c.restore(); c.fillStyle = '#FFD890'; c.beginPath(); c.arc(lx, ly, Math.max(1.2, b.L * 0.022), 0, 7); c.fill(); } }
  function drawWader(c, w, t, f) { var cyc = (t * 0.45 * f.s + w.ph) % 6.28, dip = Math.max(0, Math.min(1, Math.sin(cyc) * 1.6 + 0.2)), P = egypt_ibis(w.x, w.y, w.s, w.dir, dip, t * 0.6 * f.s + w.ph);
    c.strokeStyle = K.ibisDark; c.lineWidth = Math.max(0.8, w.s * 0.04); c.lineCap = 'round'; c.stroke(new Path2D(P.legs)); c.fillStyle = K.ibis; c.fill(new Path2D(P.body)); c.fillStyle = K.ibisDark; c.fill(new Path2D(P.dark)); }
  return {
    step: function (dt, t, f) {
      var T = t - T0;
      boats.forEach(function (b) { b.x += b.v * b.dir * dt * f.s; if (b.dir > 0 && b.x > W + b.L * 1.2) b.x = -b.L * 1.2; if (b.dir < 0 && b.x < -b.L * 1.2) b.x = W + b.L * 1.2; });
      waders.forEach(function (w) { var walk = Math.max(0, Math.cos((t * 0.45 * f.s + w.ph) % 6.28)); w.x += w.dir * 3.2 * U * walk * dt * f.s; if (Math.abs(w.x - w.x0) > 34 * U) { w.dir = w.x > w.x0 ? -1 : 1; } w.a = T > 2.6 && T < 16 ? Math.max(0, 1 - (T - 2.6) / 0.35) : T >= 16 && T < 18 ? (T - 16) / 2 : 1; });
      cx += 6 * U * dt * f.s; if (cx > W + 160 * U) cx = -140 * U;
      nextShoot -= dt; if (dk && nextShoot <= 0 && !shoot) { nextShoot = 9 + Math.random() * 9; shoot = {x: W * (0.2 + Math.random() * 0.6), y: H * (0.04 + Math.random() * 0.18), t0: t, a: Math.PI * (0.78 + Math.random() * 0.1)}; }
      if (shoot && t - shoot.t0 > 1.1) shoot = null;
      flock = flock.filter(function (b) { return t - b.t0 < b.life; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, S = sunPos(t), al = S[2], hz = A.hz, ry = A.ry, by = A.by, sr = A.sunR;
      // ---- the sky behind the pyramids: twinkling stars, a shooting star, the sun or moon, the caravan on the far dunes
      ca.save(); skyClip(ca);
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; twk.forEach(function (s) { var a = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(tt * s.sp + s.ph), 3); ca.fillStyle = 'rgba(' + K.star + ',' + a * 0.9 + ')'; ca.beginPath(); ca.moveTo(s.x, s.y - s.r * 2); ca.quadraticCurveTo(s.x, s.y, s.x + s.r * 2, s.y); ca.quadraticCurveTo(s.x, s.y, s.x, s.y + s.r * 2); ca.quadraticCurveTo(s.x, s.y, s.x - s.r * 2, s.y); ca.quadraticCurveTo(s.x, s.y, s.x, s.y - s.r * 2); ca.fill(); });
        if (shoot) { var u = (t - shoot.t0) / 1.1, L = H * 0.22, hx = shoot.x + Math.cos(shoot.a) * L * u, hy = shoot.y + Math.sin(shoot.a) * L * u, g = ca.createLinearGradient(hx, hy, hx - Math.cos(shoot.a) * L * 0.35, hy - Math.sin(shoot.a) * L * 0.35); g.addColorStop(0, 'rgba(255,250,235,' + (1 - u) + ')'); g.addColorStop(1, 'rgba(255,250,235,0)'); ca.strokeStyle = g; ca.lineWidth = 1.6; ca.beginPath(); ca.moveTo(hx, hy); ca.lineTo(hx - Math.cos(shoot.a) * L * 0.35, hy - Math.sin(shoot.a) * L * 0.35); ca.stroke(); }
        ca.restore(); }
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      egypt_glow(ca, S[0], S[1], sr * (dk ? 4.4 : 6) * (1 + al * 0.6), K.glowC, (dk ? 0.32 : 0.55) * (1 + al * 0.8)); egypt_glow(ca, S[0], S[1], sr * 2, dk ? '240,240,255' : '255,240,200', dk ? 0.3 : 0.6); ca.restore();
      var sg = ca.createRadialGradient(S[0] - sr * 0.25, S[1] - sr * 0.25, sr * 0.1, S[0], S[1], sr); sg.addColorStop(0, K.sun[0]); sg.addColorStop(1, K.sun[1]); ca.fillStyle = sg; ca.beginPath(); ca.arc(S[0], S[1], sr, 0, 7); ca.fill();
      if (dk) { ca.fillStyle = 'rgba(190,175,140,0.22)'; [[-0.3, -0.2, 0.24], [0.28, 0.22, 0.2], [0.1, -0.42, 0.13], [-0.18, 0.4, 0.15]].forEach(function (q) { ca.beginPath(); ca.arc(S[0] + q[0] * sr, S[1] + q[1] * sr, q[2] * sr, 0, 7); ca.fill(); }); }
      ca.fillStyle = K.camel; camels.forEach(function (c, k) { var x = cx - c.off, y = egypt_yOn(A.ridge, x) + 2; if (x < -60 || x > W + 60) return; ca.fill(new Path2D(egypt_camel(x, y, c.s, x / (c.s * 0.32) + k))); });
      ca.restore();
      // ---- heat shimmer over the sand (day)
      if (!dk) { ca.save(); ca.lineWidth = 1.3; ca.lineCap = 'round';
        for (i = 0; i < 7; i++) { var yy = hz - H * 0.034 + i * H * 0.006, q = i * 1.7; ca.setLineDash([30 + i * 4, 50 + i * 7]); ca.lineDashOffset = -tt * (14 + i * 3) + i * 37; ca.strokeStyle = 'rgba(255,250,236,' + (0.1 + 0.07 * Math.sin(tt * 0.9 + q)) * f.a + ')'; ca.beginPath();
          for (var x = -10; x <= W + 10; x += 12) { var y2 = yy + Math.sin(x / 22 + tt * 2.2 + q) * 1.4 + Math.sin(x / 57 - tt * 1.3) * 1; if (x === -10) ca.moveTo(x, y2); else ca.lineTo(x, y2); } ca.stroke(); }
        ca.restore(); }
      // ---- the moment on the pyramids: the gold capstone, its flash and the light sweeping down the faces
      var gold = egypt_env(T, 1.6, 2.2, 11, 14), flash = egypt_env(T, 1.9, 2.3, 2.7, 5);
      if (gold > 0) { ca.save(); ca.globalAlpha = gold; var gg = ca.createLinearGradient(ku.A[0], ku.A[1], ku.A[0], ku.A[1] + kh * 0.1); gg.addColorStop(0, '#FFF6C0'); gg.addColorStop(1, '#F2B62E'); ca.fillStyle = gg; ca.fill(capR); ca.fillStyle = '#D89220'; ca.fill(capL); ca.restore(); }
      [[kuFaces, 2.3, 0], [faFaces, 2.8, 1], [meFaces, 3.2, 2]].forEach(function (q, k) { var u = (T - q[1]) / 3.4; if (u <= 0 || u >= 1.25) return; var P = k === 0 ? ku : k === 1 ? A.fa : A.me, top = P.A[1], bot = P.by + P.h * 0.08, yc = top + (bot - top) * egypt_ease(u / 1.1) * 1.1, hb = P.h * 0.26, a = Math.min(1, u * 5, (1.25 - u) * 3);
        ca.save(); if (k) ca.clip(outs[0], 'evenodd'); ca.clip(q[0]); ca.globalCompositeOperation = 'lighter'; var g = ca.createLinearGradient(0, yc - hb, 0, yc + hb); g.addColorStop(0, 'rgba(255,226,150,0)'); g.addColorStop(0.5, 'rgba(255,236,170,' + (dk ? 0.5 : 0.7) * a + ')'); g.addColorStop(1, 'rgba(255,226,150,0)'); ca.fillStyle = g; ca.fillRect(P.L[0] - 4, yc - hb, P.R[0] - P.L[0] + 8, hb * 2); ca.restore(); });
      if (flash > 0) { ca.save(); ca.globalCompositeOperation = 'lighter'; egypt_glow(ca, ku.A[0], ku.A[1], kh * 0.7 * (0.6 + flash * 0.6), '255,220,120', 0.8 * flash); ca.translate(ku.A[0], ku.A[1]); ca.rotate(tt * 0.15);
        for (i = 0; i < 8; i++) { ca.rotate(Math.PI / 4); var rl = kh * (i % 2 ? 0.45 : 0.8) * (0.5 + flash * 0.5), rg = ca.createLinearGradient(0, 0, rl, 0); rg.addColorStop(0, 'rgba(255,240,190,' + 0.8 * flash + ')'); rg.addColorStop(1, 'rgba(255,240,190,0)'); ca.fillStyle = rg; ca.beginPath(); ca.moveTo(0, -kh * 0.012); ca.lineTo(rl, 0); ca.lineTo(0, kh * 0.012); ca.fill(); }
        ca.restore(); }
      // ---- the river: the far bank's reflection, the sun's (moon's) path, the feluccas and the wading ibises with their reflections
      var rg2 = ca.createLinearGradient(0, ry, 0, ry + (by - ry) * 0.35); rg2.addColorStop(0, dk ? 'rgba(8,16,22,0.4)' : 'rgba(70,100,50,0.28)'); rg2.addColorStop(1, dk ? 'rgba(8,16,22,0)' : 'rgba(70,100,50,0)'); ca.fillStyle = rg2; ca.fillRect(0, ry, W, (by - ry) * 0.35);
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; var nR = ph ? 11 : 15;
      for (i = 0; i < nR; i++) { var y3 = ry + 5 + i * (by - ry) / nR, w3 = sr * (0.6 + i * 0.13) * (0.6 + 0.4 * Math.sin(tt * 1.4 + i * 1.9)), x3 = S[0] + Math.sin(tt * 0.8 + i) * 5; ca.fillStyle = K.path + ((dk ? 0.3 : 0.55) - i * 0.015) * (1 + al * 0.4) + ')'; ca.fillRect(x3 - w3 / 2, y3, w3, 2.2); }
      ca.restore();
      boats.forEach(function (b) { ca.save(); ca.beginPath(); ca.rect(-20, b.y, W + 40, H); ca.clip(); ca.translate(0, b.y); ca.scale(1, -0.6); ca.translate(0, -b.y); ca.globalAlpha = dk ? 0.28 : 0.2; drawBoat(ca, b, tt, f, true); ca.restore(); drawBoat(ca, b, tt, f, false); });
      waders.forEach(function (w) { if (w.a <= 0) return; ca.save(); ca.globalAlpha = w.a * 0.22; ca.translate(0, w.y); ca.scale(1, -0.55); ca.translate(0, -w.y); drawWader(ca, w, tt, f); ca.restore(); ca.save(); ca.globalAlpha = w.a; drawWader(ca, w, tt, f); ca.restore(); });
      // ---- in front of everything: papyrus, palms, pigeons, the night windows, the rising ibises
      A.papy.forEach(function (p) { var sw = (Math.sin(tt * 1.1 + p.ph) * 2.6 + Math.sin(tt * 0.43 + p.ph * 2) * 1.8) * U * f.a, tx = p.x + p.lean + sw, ty = p.y - p.h + Math.abs(sw) * 0.1;
        cb.fillStyle = K.stem; cb.fill(new Path2D(egypt_limb(p.x, p.y, tx, ty, 2.4 * U, 1.3 * U, p.lean * 0.2 + sw * 0.3)));
        cb.strokeStyle = K.umb; cb.lineWidth = 1.1; cb.lineCap = 'round'; cb.stroke(new Path2D(egypt_umbel(tx, ty, p.s, (p.lean + sw) * 1.5)));
        cb.fillStyle = K.bract; cb.beginPath(); cb.moveTo(tx - p.s * 0.13, ty + p.s * 0.13); cb.lineTo(tx + p.s * 0.13, ty + p.s * 0.13); cb.lineTo(tx, ty - p.s * 0.06); cb.fill(); });
      A.palms.forEach(function (p) { var sw = (Math.sin(tt * 0.8 + p.seed) * 0.16 + Math.sin(tt * 0.33 + p.seed * 2) * 0.1) * f.a, cr = egypt_crown(p.x, p.y, p.s, sw, p.seed);
        cb.fillStyle = K.palmB; cb.fill(new Path2D(cr.back)); cb.fillStyle = K.boots; cb.fill(new Path2D(cr.boots)); cb.fillStyle = K.dates; cb.fill(new Path2D(cr.dates)); cb.fillStyle = K.palmF; cb.fill(new Path2D(cr.front)); });
      if (!dk) { var D = A.dove; cb.fillStyle = K.pigeon; for (i = 0; i < 3; i++) { var a = tt * (0.7 + i * 0.12) + i * 2.1, R = D[3] * (1.2 + i * 0.35), px = D[0] + Math.cos(a) * R, py = D[1] - D[2] * 0.06 + Math.sin(a) * R * 0.35 - i * 4 * U, fl = Math.sin(tt * 11 + i * 2) * 3 * U, s = 3.4 * U, dr = -Math.sin(a) > 0 ? 1 : -1;
        cb.beginPath(); cb.moveTo(px - s * 1.2 * dr, py); cb.quadraticCurveTo(px - s * 0.5 * dr, py - fl - s * 0.4, px, py); cb.quadraticCurveTo(px + s * 0.5 * dr, py - fl - s * 0.4, px + s * 1.2 * dr, py); cb.quadraticCurveTo(px, py + s * 0.5, px - s * 1.2 * dr, py); cb.fill(); } }
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.wins.forEach(function (w, k) { egypt_glow(cb, w[0], w[1], w[2] * 4.5, '255,180,90', 0.42 * (0.75 + 0.25 * flick(tt * 0.7, k * 1.3))); }); cb.restore(); }
      flock.forEach(function (b) { var u = (t - b.t0) / b.life; if (u < 0) return; var e = egypt_ease(u * 1.1) * 0.25 + u * 0.75, x = (1 - e) * (1 - e) * b.x0 + 2 * (1 - e) * e * b.cx + e * e * b.x1, y = (1 - e) * (1 - e) * b.y0 + 2 * (1 - e) * e * b.cy + e * e * b.y1, s = b.s * (1 - u * 0.5), fl = Math.sin(t * (u < 0.15 ? 11 : 7) + b.ph), a = Math.min(1, u * 12, (1 - u) * 5);
        cb.save(); cb.globalAlpha = a; egypt_flyIbis(cb, x, y, s, fl, K); cb.restore(); });
      if (T > 2 && T < 9) { cb.save(); cb.globalCompositeOperation = 'lighter'; for (i = 0; i < 14; i++) { var u2 = ((T - 2) * 0.22 + hash(i) ) % 1, sa = hash(i + 5) * 6.28, sd = kh * (0.1 + u2 * 0.6), sx = ku.A[0] + Math.cos(sa) * sd, sy = ku.A[1] + Math.sin(sa) * sd * 0.6 - u2 * kh * 0.2, sa2 = Math.sin(u2 * Math.PI) * egypt_env(T, 2, 3, 7, 9); egypt_glow(cb, sx, sy, 5 * U, '255,226,140', 0.9 * sa2); } cb.restore(); }
    },
    finish: function (t) {
      T0 = t; flock = [];
      var n = ph ? 7 : 11;
      for (var k = 0; k < n; k++) { var w = waders[k], x0 = w ? w.x : W * (0.25 + Math.random() * 0.5), y0 = w ? w.y - w.s * 0.6 : A.ry + (A.by - A.ry) * (0.25 + Math.random() * 0.6);
        flock.push({x0: x0, y0: y0, cx: ku.A[0] - W * (0.12 + Math.random() * 0.1), cy: ku.A[1] + H * (0.02 + Math.random() * 0.08), x1: W * (1.02 + Math.random() * 0.15), y1: H * (0.02 + Math.random() * 0.18), t0: t + 2.6 + (w ? 0 : 0.15 + k * 0.14), life: 7 + Math.random() * 2, s: (ph ? 34 : 50) * U * (0.85 + Math.random() * 0.3), ph: Math.random() * 6.28}); }
    }
  };
};
UIC.egypt = {L: ['#2F5E96', '#1D3D6A', 'rgba(255,252,245,0.86)', '#2A2216', '#6E604C', '#B0641C', '#B0641C', '#D9962E', '#FFFFFF'], D: ['#2A2E66', '#14163A', 'rgba(20,22,52,0.8)', '#F6F0E2', '#BDB4CF', '#F2C462', '#F2C462', '#F7DC94', '#1A1838']};
