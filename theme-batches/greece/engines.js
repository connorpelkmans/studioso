// ---- world theme engine: greece (Santorini)
function greece_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function greece_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return greece_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - greece_ease((T - c) / (d - c)); }
var greece_gc = null;
function greece_ctx() { return greece_gc || (greece_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with greece_dot)
function greece_rg(col, mid) { var g = greece_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function greece_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function greece_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function greece_mix(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
// a dove seen from the side, facing right, wings beating with 'fl' (-1 down .. 1 up)
function greece_dove(c, x, y, sz, dir, fl, col, a) {
  if (a <= 0) return; c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(dir * sz, sz); c.fillStyle = col;
  c.beginPath(); c.ellipse(0, 0, 6, 2.6, -0.08, 0, 7); c.fill();
  c.beginPath(); c.arc(5.4, -1.6, 2, 0, 7); c.fill();
  c.beginPath(); c.moveTo(7, -1.6); c.lineTo(9.2, -1); c.lineTo(7, -0.6); c.fill();
  c.beginPath(); c.moveTo(-5, -0.4); c.lineTo(-10, -2.6); c.lineTo(-9.6, 1.8); c.closePath(); c.fill();
  var wy = -fl * 9; c.beginPath(); c.moveTo(-2.6, -0.6); c.quadraticCurveTo(-3, wy * 0.7 - 1, 1.6 + fl * 1.5, wy - 1); c.quadraticCurveTo(2.4, wy * 0.4, 2.6, -0.8); c.closePath(); c.fill();
  c.restore(); }
// the island cat walking along the wall: phase p moves the legs, sit (0..1) folds it down, tail swishes with sw
function greece_kitty(c, x, y, sz, dir, p, sit, sw, col, dark) {
  c.save(); c.translate(x, y); c.scale(dir * sz, sz); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  var by = -9 + sit * 2, lg = 7 * (1 - sit * 0.75);
  c.lineWidth = 2.2; [[-6, 0], [-3.6, Math.PI], [4.6, Math.PI * 0.5], [7, Math.PI * 1.5]].forEach(function (q) { var a = Math.sin(p + q[1]) * 0.45 * (1 - sit); c.beginPath(); c.moveTo(q[0], by + 1); c.lineTo(q[0] + Math.sin(a) * lg, by + 1 + Math.cos(a) * lg); c.stroke(); });
  c.beginPath(); c.ellipse(sit * -1.5, by - sit * 1.5, 9.5 - sit * 2, 4.4 + sit * 1.6, -sit * 0.35, 0, 7); c.fill();
  // tail: up and curling at the tip, swishing
  c.lineWidth = 2.4; c.beginPath(); c.moveTo(-8.5, by - 1); c.quadraticCurveTo(-14 - sw * 2, by - 6, -12 + sw * 3, by - 14 + sit * 6); c.stroke();
  // head and ears
  var hx = 9.5 - sit * 2.5, hy = by - 5 - sit * 2;
  c.beginPath(); c.arc(hx, hy, 4.2, 0, 7); c.fill();
  c.beginPath(); c.moveTo(hx - 3.6, hy - 1.6); c.lineTo(hx - 2.6, hy - 7); c.lineTo(hx - 0.4, hy - 3.6); c.closePath(); c.moveTo(hx + 0.6, hy - 3.8); c.lineTo(hx + 2.8, hy - 7.2); c.lineTo(hx + 3.8, hy - 1.8); c.closePath(); c.fill();
  c.fillStyle = dark; c.beginPath(); c.ellipse(-1, by - 3.4, 1.2, 3, 0.2, 0, 7); c.ellipse(2.6, by - 3.8, 1.2, 2.8, 0.2, 0, 7); c.ellipse(-4.4, by - 3, 1.1, 2.6, 0.2, 0, 7); c.fill();
  c.beginPath(); c.arc(hx + 2, hy - 0.6, 0.75, 0, 7); c.fill();
  c.restore(); }

// ---------- Santorini
// Loop: the sun (or moon) glows over the bay, clouds drift, sunlight glints on the water (a shimmering moon path at
// night), a little sailboat drifts across, the windmill's sails turn, bougainvillea sways, a cat strolls along the
// terrace wall and stops for a sit, doves circle the bell tower. Night: warm windows and string lights.
// Moment: the famous sunset. The sun sinks into the sea, the village turns gold and then pink, the bells ring and a
// flock of white doves lifts off over the domes. At night an afterglow blooms on the horizon and the lights come on.
ENGINES.greece = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, u = A.u, s = A.s, hz = A.hz, C = A.C, T0 = -99, i, k;
  // clips: the open sky above the skyline, and the open sea (not the cliff or the islet)
  var skyClip = new Path2D(); skyClip.moveTo(-40, -40); skyClip.lineTo(W + 40, -40); for (i = A.sky.length - 1; i >= 0; i--) skyClip.lineTo(A.sky[i][0], A.sky[i][1]); skyClip.closePath();
  var seaClip = new Path2D(); seaClip.rect(-40, hz + 1, W + 80, H - hz + 40); seaClip.moveTo(A.cliff[0][0], A.cliff[0][1]); for (i = 1; i < A.cliff.length; i++) seaClip.lineTo(A.cliff[i][0], A.cliff[i][1]); seaClip.closePath(); seaClip.rect(A.kam[0], A.kam[1], A.kam[2], A.kam[3]);
  var sunG = greece_rg('rgba(255,244,214,0.75)', [0.3, 0.3]), warmG = greece_rg('rgba(255,150,70,0.6)', [0.35, 0.3]), moonG = greece_rg('rgba(210,220,255,0.4)', [0.3, 0.3]);
  var winG = greece_rg('rgba(255,190,100,0.55)', [0.3, 0.25]), bulbG = greece_rg('rgba(255,206,120,0.85)', [0.25, 0.3]);
  var Sx = A.sun[0], Sy = A.sun[1], SR = A.sun[2], setX = A.setX, Mx = A.moon[0], My = A.moon[1], MR = A.moon[2];
  var moonSpr = greece_sprite(MR * 2.4, MR * 2.4, 2, function (o) { var g = o.createRadialGradient(-MR * 0.3, -MR * 0.3, MR * 0.1, 0, 0, MR); g.addColorStop(0, '#FFFFF6'); g.addColorStop(0.8, '#FFF2D2'); g.addColorStop(1, '#F2DCB0'); o.fillStyle = g; o.beginPath(); o.arc(0, 0, MR, 0, 7); o.fill();
    o.fillStyle = 'rgba(214,190,150,0.3)'; [[-0.3, -0.2, 0.22], [0.32, 0.22, 0.17], [0.05, 0.45, 0.13]].forEach(function (q) { o.beginPath(); o.arc(q[0] * MR, q[1] * MR, q[2] * MR, 0, 7); o.fill(); }); });
  var CLD = greece_sprite(220, 50, 1.5, function (o) { o.fillStyle = 'rgba(255,255,255,0.9)'; [[-70, 6, 40, 10], [-20, -2, 50, 15], [40, 4, 46, 12], [84, 9, 24, 7], [0, 10, 92, 8]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); }); o.fillStyle = 'rgba(255,238,214,0.6)'; o.beginPath(); o.ellipse(-10, 13, 80, 4, 0, 0, 7); o.fill(); });
  var clouds = dk ? [] : [0, 1, 2].map(function (q) { return {x: hash(q + 3) * W, y: H * (0.06 + q * 0.07), s: (ph ? 0.6 : 1) * (0.75 + hash(q + 7) * 0.4), v: 4 + hash(q + 5) * 4}; });
  // every window's glow, drawn once; at night it breathes as one, and in the moment each window lights in a wave
  var WG = null; if (dk) { var off = document.createElement('canvas'), dpr = 1.25; off.width = Math.ceil(W * dpr); off.height = Math.ceil(H * dpr); var oc = off.getContext('2d'); oc.scale(dpr, dpr);
    A.wins.forEach(function (w) { greece_dot(oc, winG, w[0], w[1], w[2] * 2.6, 0.8); }); WG = off; }
  var glints = []; for (i = 0; i < (ph ? 22 : 40); i++) { var gx = hash(i + 11), near = i % 3 === 0; glints.push({x: near ? (dk ? Mx : Sx) + (hash(i + 12) - 0.5) * W * 0.14 : A.sea[0] + gx * A.sea[2], y: A.sea[1] + Math.pow(hash(i + 13), 1.3) * A.sea[3], ph: hash(i + 14) * 6.28, f: 0.6 + hash(i + 15) * 0.9}); }
  var boat = {x: W * 0.3, v: 7 * u}, B = A.boat, cat = {x: A.cat.x0 + (A.cat.x1 - A.cat.x0) * 0.3, dir: 1, p: 0, sit: 0, wait: 3, mode: 'walk'};
  var sprays = A.sprays.map(function (q, j) { return {x: q.x, y: q.y, len: q.len, s: q.s, ph: hash(j + 31) * 6.28}; }), petals = [], flock = [];
  var TW = A.tower, doves = [0, 1, 2].map(function (q) { return {a: q * 2.1, v: 0.5 + q * 0.08, ry: (14 + q * 5) * s, rx: (60 + q * 16) * s, fl: 7 + q}; });
  var dvCol = dk ? '#E4E2F6' : '#FFFFFF', catCol = dk ? '#8A6458' : '#E8A160', catDk = dk ? '#5E4038' : '#C2763A';
  var towerOut = new Path2D(); towerOut.rect(-40, -40, W + 80, H + 80); towerOut.rect(TW[0] - TW[2] * 0.5, TW[1] - 2 * s, TW[2], H);
  function sky(c) { c.save(); c.clip(skyClip); }
  return {
    step: function (dt, t, f) {
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 180) c.x = -180; });
      boat.x += boat.v * dt * f.s; if (boat.x > W + 80) boat.x = -80;
      // the cat walks, stops now and then to sit and swish its tail, and turns at the ends of the wall
      var cs = A.cat;
      if (cat.mode === 'walk') { cat.x += cat.dir * 13 * s * dt * f.s; cat.p += dt * 7 * f.s; cat.sit = Math.max(0, cat.sit - dt * 2); cat.wait -= dt;
        if (cat.x > cs.x1) { cat.x = cs.x1; cat.dir = -1; } if (cat.x < cs.x0) { cat.x = cs.x0; cat.dir = 1; }
        if (cat.wait <= 0) { cat.mode = 'sit'; cat.wait = 3 + Math.random() * 3; } }
      else { cat.sit = Math.min(1, cat.sit + dt * 2); cat.wait -= dt; if (cat.wait <= 0) { cat.mode = 'walk'; cat.wait = 5 + Math.random() * 6; if (Math.random() < 0.3) cat.dir = -cat.dir; } }
      doves.forEach(function (d) { d.a += d.v * dt * f.s; });
      if (Math.random() < dt * 0.5 * f.s && petals.length < 8) { var q = sprays[Math.floor(Math.random() * sprays.length)]; petals.push({x: q.x, y: q.y + q.len * 0.6, vx: 6 + Math.random() * 8, vy: 9 + Math.random() * 6, r: Math.random() * 6, t0: t}); }
      petals.forEach(function (p) { p.x += (p.vx + Math.sin(t * 2 + p.r) * 8) * dt * f.s; p.y += p.vy * dt * f.s; p.r += dt * 2; });
      petals = petals.filter(function (p) { return p.y < H + 10 && t - p.t0 < 14; });
      flock.forEach(function (d) { if (t < d.t0) return; d.x += d.vx * dt; d.y += d.vy * dt; d.vy -= 4 * s * dt; });
      flock = flock.filter(function (d) { return d.y > -40 && t - d.t0 < 12; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0;
      // ----- the sun's journey in the moment (day): down to the sea and back up later, out of sight
      var mom = !dk && T >= 0 && T < 12, down = mom ? greece_ease(T / 7.5) : 0, back = !dk && T >= 12 && T < 14 ? greece_ease((T - 12) / 2) : 1, sx = Sx + (setX - Sx) * (mom ? greece_ease(T / 4.2) : 0), sy = Sy + (hz + SR * 1.4 - Sy) * Math.pow(down, 1.4), sr = SR * (1 + down * 0.25);
      var gold = dk ? 0 : greece_env(T, 0.4, 3, 6, 8.5), pink = dk ? 0 : greece_env(T, 5.6, 8, 10, 13), glow = dk ? greece_env(T, 0.3, 2.6, 8, 12) : 0;
      // ----- sky (canvas A, clipped to the open sky): sun or moon, clouds, the afterglow
      sky(ca);
      if (!dk) { var cA = back, col = greece_mix([255, 248, 226], [255, 120, 60], Math.min(1, down * 1.2));
        greece_dot(ca, sunG, sx, sy, sr * (3.6 + 0.2 * Math.sin(tt * 0.6)), cA); if (down > 0.1) { ca.save(); ca.globalCompositeOperation = 'lighter'; greece_dot(ca, warmG, sx, sy, sr * 5, down * cA * 0.8); ca.restore(); }
        ca.globalAlpha = cA; ca.fillStyle = 'rgb(' + col.join(',') + ')'; ca.beginPath(); ca.arc(sx, sy, sr, 0, 7); ca.fill(); ca.globalAlpha = 1;
        clouds.forEach(function (c) { var w = 220 * c.s; ca.globalAlpha = 1 - down * 0.4; ca.drawImage(CLD, c.x - w / 2, c.y - 25 * c.s, w, 50 * c.s); }); ca.globalAlpha = 1;
        if (gold + pink > 0) { var gr = ca.createLinearGradient(0, -40, 0, hz); gr.addColorStop(0, 'rgba(255,130,150,' + (0.25 * pink + 0.12 * gold) + ')'); gr.addColorStop(0.55, 'rgba(255,125,140,' + (0.32 * pink + 0.2 * gold) + ')'); gr.addColorStop(1, 'rgba(255,170,70,' + (0.55 * gold + 0.35 * pink) + ')'); ca.fillStyle = gr; ca.fillRect(-40, -40, W + 80, hz + 42); } }
      else { ca.save(); ca.globalCompositeOperation = 'lighter'; greece_dot(ca, moonG, Mx, My, MR * (4 + 0.2 * Math.sin(tt * 0.5)), 0.9); ca.restore(); var S2 = moonSpr.w; ca.drawImage(moonSpr, Mx - S2 / 2, My - S2 / 2, S2, S2);
        if (glow > 0) { var ag = ca.createLinearGradient(0, hz - H * 0.22, 0, hz); ag.addColorStop(0, 'rgba(255,110,150,0)'); ag.addColorStop(0.6, 'rgba(255,110,140,' + (0.35 * glow) + ')'); ag.addColorStop(1, 'rgba(255,190,110,' + (0.6 * glow) + ')'); ca.fillStyle = ag; ca.fillRect(-40, hz - H * 0.22, W + 80, H * 0.22 + 2); } }
      ca.restore();
      // ----- the sea (clipped to open water): glints, the sun's or moon's path, the sailboat
      ca.save(); ca.clip(seaClip, 'evenodd');
      if (!dk) { glints.forEach(function (g) { var a = Math.max(0, Math.sin(tt * g.f + g.ph)); a = a * a * a; if (a < 0.05) return; var r = (1.5 + (g.y - hz) / (H - hz) * 4) * u * (0.5 + a * 0.7); ca.fillStyle = 'rgba(255,255,250,' + (0.9 * a * (1 - down * 0.6)) + ')'; ca.beginPath(); ca.moveTo(g.x, g.y - r * 2); ca.lineTo(g.x + r * 0.4, g.y - r * 0.4); ca.lineTo(g.x + r * 2.4, g.y); ca.lineTo(g.x + r * 0.4, g.y + r * 0.4); ca.lineTo(g.x, g.y + r * 2); ca.lineTo(g.x - r * 0.4, g.y + r * 0.4); ca.lineTo(g.x - r * 2.4, g.y); ca.lineTo(g.x - r * 0.4, g.y - r * 0.4); ca.fill(); });
        // the setting sun's golden road across the water
        var road = Math.min(1, down * 1.6) * (1 - greece_ease((T - 9.5) / 2.4)); if (road > 0) for (i = 0; i < (ph ? 14 : 20); i++) { var yy = hz + 3 + i * (A.sea[3] - 4) / (ph ? 14 : 20), ww = sr * (0.8 + i * 0.12) * (0.6 + 0.4 * Math.sin(tt * 1.7 + i * 1.9)), xx = setX + Math.sin(tt * 0.9 + i) * 5; ca.fillStyle = 'rgba(255,190,90,' + (road * (0.7 - i * 0.02)) + ')'; ca.fillRect(xx - ww / 2, yy, ww, 2.6 * u); } }
      else { ca.save(); ca.globalCompositeOperation = 'lighter'; for (i = 0; i < (ph ? 14 : 20); i++) { var yy2 = hz + 3 + i * (A.sea[3] - 4) / (ph ? 14 : 20), w2 = MR * (0.9 + i * 0.16) * (0.6 + 0.4 * Math.sin(tt * 1.3 + i * 1.7)), x2 = Mx + Math.sin(tt * 0.8 + i) * 5; ca.fillStyle = 'rgba(255,236,190,' + (0.3 - i * 0.008) + ')'; ca.fillRect(x2 - w2 / 2, yy2, w2, 2.2 * u); } ca.restore(); }
      // the sailboat, with its reflection
      var bs = B.s, bx = boat.x, by = B.y + Math.sin(tt * 1.4) * 1.2 * bs, rk = Math.sin(tt * 1.1) * 0.03;
      ca.save(); ca.translate(bx, by); ca.globalAlpha = 0.25; ca.scale(1, -0.6); ca.rotate(rk); drawBoat(ca, bs); ca.restore();
      ca.save(); ca.translate(bx, by); ca.rotate(rk); drawBoat(ca, bs); if (dk) { ca.globalCompositeOperation = 'lighter'; greece_dot(ca, bulbG, 0, -40 * bs, 9 * bs, 0.6 + 0.2 * flick(tt, 3)); } ca.restore();
      ca.restore();
      // ----- the windmill's sails (canvas A, in front of the village on the cliff)
      var M = A.mill, ang = tt * 0.45;
      ca.save(); ca.translate(M.x, M.y); ca.rotate(ang);
      // eight spars, each with a triangular cloth sail, tied tip to tip with a guy rope
      ca.strokeStyle = dk ? 'rgba(160,150,190,0.3)' : 'rgba(110,86,64,0.28)'; ca.lineWidth = 0.5 * u; ca.beginPath();
      for (k = 0; k <= 8; k++) { var ga = k * Math.PI / 4; if (k) ca.lineTo(Math.cos(ga) * M.L, Math.sin(ga) * M.L); else ca.moveTo(M.L, 0); } ca.stroke();
      for (k = 0; k < 8; k++) { ca.save(); ca.rotate(k * Math.PI / 4);
        ca.fillStyle = dk ? 'rgba(176,180,214,0.9)' : 'rgba(252,248,238,0.97)'; ca.beginPath(); ca.moveTo(M.L * 0.16, 0); ca.lineTo(M.L * 0.97, 0); ca.quadraticCurveTo(M.L * 0.7, M.L * 0.2, M.L * 0.3, M.L * 0.3); ca.closePath(); ca.fill();
        ca.fillStyle = dk ? 'rgba(120,124,170,0.6)' : 'rgba(200,190,170,0.5)'; ca.beginPath(); ca.moveTo(M.L * 0.2, M.L * 0.05); ca.lineTo(M.L * 0.6, M.L * 0.08); ca.lineTo(M.L * 0.32, M.L * 0.27); ca.closePath(); ca.fill();
        ca.strokeStyle = dk ? '#3A3048' : '#6E5640'; ca.lineWidth = 1.4 * u; ca.beginPath(); ca.moveTo(0, 0); ca.lineTo(M.L, 0); ca.stroke(); ca.restore(); }
      ca.fillStyle = dk ? '#3A3048' : '#6E5640'; ca.beginPath(); ca.arc(0, 0, 2.4 * u, 0, 7); ca.fill(); ca.restore();
      // ----- window glows on the cliff (A: the foreground covers them where it stands in front)
      if (dk && WG) { ca.save(); ca.globalCompositeOperation = 'lighter'; ca.globalAlpha = 0.75 + 0.1 * Math.sin(tt * 0.7) + glow * 0.25; ca.drawImage(WG, 0, 0, W, H); ca.restore();
        if (glow > 0) { ca.save(); ca.globalCompositeOperation = 'lighter'; A.wins.forEach(function (w) { var on = greece_ease((T - 1 - (w[0] / W) * 3) * 2) * (1 - greece_ease((T - 9) / 3)); if (on > 0) greece_dot(ca, winG, w[0], w[1], w[2] * 3.4, on * 0.6); }); ca.restore(); } }
      // ----- moonlight on the blue domes
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.domeR.forEach(function (d) { greece_dot(cb, moonG, d[0] - d[2] * 0.35, d[1] - d[2] * 0.55, d[2] * 0.75, 0.55); }); cb.restore(); }
      // ----- doves circling the bell tower: all on B (they are nearer than the village), but on the far side of their circle
      // the tower hides them (B is clipped to everything but the tower there)
      doves.forEach(function (d) { var x = TW[0] + Math.cos(d.a) * d.rx, y = TW[1] - 14 * s + Math.sin(d.a) * d.ry + Math.sin(d.a * 3) * 4 * s, dir = -Math.sin(d.a) < 0 ? -1 : 1, fl = Math.sin(tt * d.fl);
        cb.save(); if (Math.sin(d.a) < 0) cb.clip(towerOut, 'evenodd'); greece_dove(cb, x, y, s * 1.45, dir, fl, dvCol, 1 - greece_env(T, 6.4, 7, 14, 15)); cb.restore(); });
      // ----- bells (B, inside the tower's arches); they ring in the moment
      var ring = greece_env(T, 6, 6.4, 9, 11);
      A.bells.forEach(function (b, j) { var sw = Math.sin(tt * 0.8 + j * 2) * 0.04 + ring * Math.sin((t - T0) * (j === 2 ? 11 : 8) + j) * 0.55, bw = 24 * s * b.s;
        cb.save(); cb.translate(b.x, b.y - bw * 0.28); cb.rotate(sw); var g = cb.createLinearGradient(-bw * 0.3, 0, bw * 0.3, 0); g.addColorStop(0, dk ? '#7A5A2A' : '#9A6A26'); g.addColorStop(0.45, dk ? '#C8A050' : '#F0C460'); g.addColorStop(1, dk ? '#6A4A22' : '#8A5A1E');
        cb.strokeStyle = dk ? '#2A2030' : '#4A3A2A'; cb.lineWidth = 1.2 * s; cb.beginPath(); cb.moveTo(0, -bw * 0.12); cb.lineTo(0, bw * 0.08); cb.stroke();
        cb.fillStyle = g; cb.beginPath(); cb.moveTo(-bw * 0.12, bw * 0.06); cb.quadraticCurveTo(-bw * 0.17, bw * 0.38, -bw * 0.3, bw * 0.56); cb.lineTo(bw * 0.3, bw * 0.56); cb.quadraticCurveTo(bw * 0.17, bw * 0.38, bw * 0.12, bw * 0.06); cb.quadraticCurveTo(0, -bw * 0.04, -bw * 0.12, bw * 0.06); cb.fill();
        cb.fillStyle = dk ? '#5A4220' : '#7A5420'; cb.beginPath(); cb.arc(Math.sin(sw * 2) * bw * 0.06, bw * 0.6, bw * 0.06, 0, 7); cb.fill(); cb.restore(); });
      if (ring > 0) { cb.save(); cb.strokeStyle = dk ? 'rgba(255,230,170,' : 'rgba(255,255,255,'; for (k = 0; k < 3; k++) { var rp = ((t - T0) * 0.8 + k / 3) % 1, rr = TW[2] * (0.7 + rp * 1.6); cb.strokeStyle = (dk ? 'rgba(255,226,160,' : 'rgba(255,250,236,') + (ring * (1 - rp) * 0.8) + ')'; cb.lineWidth = 2 * s; cb.beginPath(); cb.arc(TW[0], TW[1] + TW[2] * 0.9, rr, Math.PI * 1.08, Math.PI * 1.42); cb.stroke(); cb.beginPath(); cb.arc(TW[0], TW[1] + TW[2] * 0.9, rr, Math.PI * 1.58, Math.PI * 1.92); cb.stroke(); } cb.restore(); }
      // ----- bougainvillea sprays swaying over the walls, and a few bracts drifting down
      sprays.forEach(function (q) { var sw = Math.sin(tt * 1.1 + q.ph) * 0.12 * f.a + Math.sin(tt * 2.3 + q.ph * 2) * 0.04 * f.a, L = q.len, ex = q.x + Math.sin(sw) * L, ey = q.y + Math.cos(sw) * L;
        cb.strokeStyle = dk ? '#3A2A22' : '#7A5236'; cb.lineWidth = 1.2 * q.s; cb.beginPath(); cb.moveTo(q.x, q.y); cb.quadraticCurveTo(q.x + Math.sin(sw) * L * 0.2 + 4 * q.s, q.y + L * 0.5, ex, ey); cb.stroke();
        for (var n = 1; n <= 5; n++) { var uu = n / 5, px = q.x + (ex - q.x) * uu + Math.sin(uu * 3) * 3 * q.s, py = q.y + (ey - q.y) * uu, rr2 = (3.4 - uu * 1.2) * q.s;
          cb.fillStyle = C.leaf; cb.beginPath(); cb.ellipse(px - rr2 * 1.2, py - 1, rr2 * 1.1, rr2 * 0.6, 0.6, 0, 7); cb.fill();
          cb.fillStyle = C.fl; cb.beginPath(); cb.arc(px, py, rr2, 0, 7); cb.arc(px + rr2 * 1.1, py + rr2 * 0.6, rr2 * 0.85, 0, 7); cb.arc(px - rr2 * 0.4, py + rr2 * 1.1, rr2 * 0.8, 0, 7); cb.fill(); } });
      petals.forEach(function (p) { cb.save(); cb.translate(p.x, p.y); cb.rotate(p.r); cb.fillStyle = C.fl; cb.beginPath(); cb.ellipse(0, 0, 3 * s, 2 * s, 0, 0, 7); cb.fill(); cb.restore(); });
      // ----- the cat on the terrace wall
      greece_kitty(cb, cat.x, A.cat.y, A.cat.s * 1.15, cat.dir, cat.p, greece_ease(cat.sit), Math.sin(tt * (cat.mode === 'sit' ? 2.4 : 1.4)) * f.a, catCol, catDk);
      // ----- string lights and the windows of the terrace
      A.bulbs.forEach(function (b, j) { var on = dk ? 0.75 + 0.25 * flick(tt * 0.7, j * 1.3) : 0, pop = dk ? greece_ease((T - 0.6 - j * 0.07) * 3) * (1 - greece_ease((T - 9) / 3)) : 0;
        if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; greece_dot(cb, bulbG, b[0], b[1], (9 + pop * 6) * s, on * 0.8 + pop * 0.5); cb.restore(); }
        cb.fillStyle = dk ? '#FFE6A8' : ['#FFF8E8', '#FFE8B0', '#FFF8E8', '#F8F0E0'][b[2]]; cb.strokeStyle = dk ? 'rgba(0,0,0,0)' : 'rgba(120,100,80,0.5)'; cb.lineWidth = 0.8; cb.beginPath(); cb.ellipse(b[0], b[1], 2 * s, 2.6 * s, 0, 0, 7); cb.fill(); if (!dk) cb.stroke(); });
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.nearWins.forEach(function (w, j) { greece_dot(cb, winG, w[0], w[1], w[2] * 2.2, 0.55 + 0.1 * flick(tt * 0.4, j) + glow * 0.3); }); cb.restore(); }
      // ----- the flock lifting off over the domes
      flock.forEach(function (d) { if (t < d.t0) return; var a = Math.min(1, (t - d.t0) * 3, (12 - (t - d.t0)) / 2); greece_dove(cb, d.x, d.y, d.sz, -1, Math.sin(tt * d.fl + d.ph), dvCol, a); });
      // ----- the light of the sunset over everything: gold, then pink
      if (gold + pink > 0) { var tg = cb.createLinearGradient(0, 0, 0, H); tg.addColorStop(0, 'rgba(255,' + Math.round(150 - pink * 40) + ',' + Math.round(60 + pink * 80) + ',' + (0.2 * gold + 0.2 * pink) + ')'); tg.addColorStop(1, 'rgba(255,' + Math.round(176 - pink * 50) + ',' + Math.round(80 + pink * 70) + ',' + (0.3 * gold + 0.24 * pink) + ')'); cb.fillStyle = tg; cb.fillRect(0, 0, W, H); }
    },
    finish: function (t) {
      T0 = t; flock = [];
      var src = A.domes.concat([[TW[0], TW[1]]]);
      for (k = 0; k < (ph ? 12 : 22); k++) { var o = src[k % src.length]; flock.push({x: o[0] + (Math.random() - 0.5) * 30 * s, y: o[1] + (Math.random() - 0.5) * 10 * s, vx: -(36 + Math.random() * 40) * s, vy: -(40 + Math.random() * 30) * s, t0: t + 6.6 + k * 0.09, sz: s * (1.3 + Math.random() * 0.5), fl: 9 + Math.random() * 4, ph: Math.random() * 6}); }
    }
  };
  function drawBoat(c, bs) {
    c.fillStyle = dk ? '#C8CCE6' : '#FFFFFF'; c.beginPath(); c.moveTo(-17 * bs, -5 * bs); c.lineTo(17 * bs, -5 * bs); c.lineTo(12 * bs, 2 * bs); c.lineTo(-13 * bs, 2 * bs); c.closePath(); c.fill();
    c.fillStyle = dk ? '#2C3F86' : '#2F6DB8'; c.fillRect(-15.6 * bs, -3 * bs, 31 * bs, 1.6 * bs);
    c.strokeStyle = dk ? '#4A4458' : '#6E5640'; c.lineWidth = 1.2 * bs; c.beginPath(); c.moveTo(0, -5 * bs); c.lineTo(0, -40 * bs); c.stroke();
    c.fillStyle = dk ? '#D6D6EE' : '#FFFDF6'; c.beginPath(); c.moveTo(1.4 * bs, -39 * bs); c.quadraticCurveTo(12 * bs, -22 * bs, 14 * bs, -7 * bs); c.lineTo(1.4 * bs, -7 * bs); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-1.4 * bs, -34 * bs); c.lineTo(-1.4 * bs, -7 * bs); c.lineTo(-12 * bs, -7 * bs); c.closePath(); c.fill();
    c.fillStyle = dk ? 'rgba(120,120,170,0.5)' : 'rgba(150,170,200,0.45)'; c.beginPath(); c.moveTo(1.4 * bs, -39 * bs); c.quadraticCurveTo(6 * bs, -24 * bs, 6 * bs, -7 * bs); c.lineTo(1.4 * bs, -7 * bs); c.closePath(); c.fill();
  }
};
UIC.greece = {L: ['#2A64AE', '#173F7A', 'rgba(255,255,255,0.86)', '#13253D', '#4C5F77', '#1F5CAA', '#1F5CAA', '#3B86C9', '#FFFFFF'], D: ['#1D2A5A', '#0E1838', 'rgba(20,28,62,0.8)', '#EEF2FC', '#AEB8D6', '#F2B866', '#F2B866', '#F6D08E', '#141C3A']};
