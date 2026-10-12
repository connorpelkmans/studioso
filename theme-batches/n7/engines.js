// ---- batch n7 engines: canyon, saltflats
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
// a soft beam of light from (x0, y0) to (x1, y1), w0 wide at the top and w1 at the bottom, fading along its length
function n7_beam(c, x0, y0, x1, y1, w0, w1, a, col, grow) { var gL = grow == null ? 1 : Math.max(0, Math.min(1, grow)); if (a <= 0.003 || gL <= 0) return;
  var xe = x0 + (x1 - x0) * gL, ye = y0 + (y1 - y0) * gL, we = w0 + (w1 - w0) * gL, gr = c.createLinearGradient(x0, y0, xe, ye);
  gr.addColorStop(0, col + '1)'); gr.addColorStop(0.75, col + (gL < 1 ? 0.8 : 0.5) + ')'); gr.addColorStop(1, col + (gL < 1 ? 0 : 0.35) + ')');
  c.save(); c.fillStyle = gr;
  // nested soft trapezoids: wide and faint outside, narrow and brighter in the core
  [1, 0.72, 0.46, 0.22].forEach(function (f) { c.globalAlpha = a * 0.3; c.beginPath(); c.moveTo(x0 - w0 * f / 2, y0); c.lineTo(x0 + w0 * f / 2, y0); c.lineTo(xe + we * f / 2, ye); c.lineTo(xe - we * f / 2, ye); c.closePath(); c.fill(); });
  c.restore(); }
// a little four-petal desert primrose opening (k 0..1), seen a little from above
function n7_primrose(c, x, y, s, k, col, eye, stem) { if (k <= 0) return; var g = Math.min(1, k * 2), o = n7_ease((k - 0.4) / 0.6), h = 16 * s * g;
  c.strokeStyle = stem; c.lineWidth = 1.6 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 2 * s, y - h * 0.5, x, y - h); c.stroke();
  c.fillStyle = stem; [-1, 1].forEach(function (sd) { c.save(); c.translate(x, y - h * 0.25); c.rotate(sd * (0.9 - 0.3 * g)); n7_ell(c, sd * 4 * s * g, 0, 4.5 * s * g, 1.6 * s * g); c.fill(); c.restore(); });
  c.save(); c.translate(x, y - h); c.scale(1, 0.62);
  if (o <= 0.02) { c.fillStyle = col; n7_ell(c, 0, -2 * s, 2.6 * s * g, 4 * s * g); c.fill(); c.restore(); return; }
  c.fillStyle = col; for (var p = 0; p < 4; p++) { var a = p * Math.PI / 2 + Math.PI / 4; c.save(); c.rotate(a); n7_ell(c, 0, -5.2 * s * o, 4.6 * s * (0.4 + 0.6 * o), 5.6 * s * o); c.fill(); c.restore(); }
  c.fillStyle = 'rgba(255,255,255,0.35)'; for (p = 0; p < 4; p++) { c.save(); c.rotate(p * Math.PI / 2 + Math.PI / 4); n7_ell(c, -1.2 * s, -6 * s * o, 1.6 * s * o, 3 * s * o); c.fill(); c.restore(); }
  c.fillStyle = eye; c.beginPath(); c.arc(0, 0, 2.2 * s * o, 0, 7); c.fill(); c.restore(); }

// ---------- Slot Canyon: shafts of sunlight fall from the crack of sky and breathe as clouds pass, dust floats in them,
// cottonwood fluff drifts down, and now and then a trickle of sand pours from a ledge. Night: a strip of stars and the Milky Way,
// moonlight on the wall edges, glints of mica and the odd shooting star.
// Moment: the sun lines up with the slot: one great beam pours down to the floor, the walls glow from top to bottom,
// dust swirls up through the light and a little ring of desert primroses opens where it lands.
ENGINES.canyon = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, i, maskP = new Path2D(A.mask), nearP = new Path2D(A.nearMask);
  var inWall = function (x, y, upto) { for (var k = 0; k < (upto || A.walls.length); k++) if (n7_inPoly(A.walls[k], x, y)) return true; return false; };
  var xL = A.top[0], xR = A.top[1], cxk = (xL + xR) / 2;
  // the backdrop (sky glow, the Milky Way and the stars), drawn once and cut to the visible strip of sky
  var stars = [], skyCv = n7_off(W, H, function (g) {
    if (dk) {
      var mwG = n7_rg('rgba(180,170,255,0.26)', [0.5, 0.4]), mwC = n7_rg('rgba(255,236,220,0.3)', [0.4, 0.3]);
      for (i = 0; i < 40; i++) { var u = i / 39, x = cxk + (ph ? -0.06 + u * 0.16 : -0.07 + u * 0.12) * W + Math.sin(i * 1.3) * 8, y = -H * 0.05 + u * H * 0.42; n7_dot(g, mwG, x, y, (ph ? 36 : 54) * (0.7 + Math.random() * 0.5), 0.55, 0.8); if (i % 3 === 0) n7_dot(g, mwC, x + 4, y, (ph ? 14 : 22), 0.6, 0.7); }
      for (i = 0; i < (ph ? 260 : 420); i++) { var sx = cxk + (Math.random() - 0.5) * W * (ph ? 0.5 : 0.36), sy = Math.random() * H * 0.36, r = Math.random(); if (inWall(sx, sy, 5)) continue;
        g.fillStyle = 'rgba(255,250,240,' + (0.35 + r * 0.6) + ')'; g.beginPath(); g.arc(sx, sy, 0.35 + r * r * 1.3, 0, 7); g.fill(); if (r > 0.86) stars.push({x: sx, y: sy, r: 0.8 + r * 1.4, ph: Math.random() * 6.28}); }
    } else {
      n7_dot(g, n7_rg('rgba(255,252,236,0.9)', [0.35, 0.5]), xR - (xR - xL) * 0.2, -H * 0.02, H * 0.22, 0.85);
      n7_dot(g, n7_rg('rgba(255,236,190,0.6)', [0.4, 0.3]), A.crack[0], A.crack[1], W * 0.14, 0.7, 0.6);
    }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(maskP); g.globalCompositeOperation = 'source-over'; });
  // the shafts of light: [top x, bottom x, bottom y, top width, bottom width, strength]
  var fx = function (lvl, x) { return A.floors[lvl](x); }, beams = [];
  if (dk) { var b0 = xL + (xR - xL) * 0.55, b1 = b0 - W * 0.05; beams.push([b0, b1, fx(2, b1), 20 * S, 70 * S, 0.2]); }
  else { [[0.62, -0.085, 2, 22, 80, 0.62], [0.36, -0.045, 1, 12, 44, 0.45], [0.82, -0.02, 1, 8, 26, 0.35]].forEach(function (q) { var x0 = xL + (xR - xL) * q[0], x1 = x0 + q[1] * W * (ph ? 1.4 : 1); beams.push([x0, x1, fx(q[2], x1), q[3] * S * (ph ? 1.3 : 1), q[4] * S * (ph ? 1.3 : 1), q[5]]); }); }
  var beamCol = dk ? 'rgba(190,205,255,' : 'rgba(255,238,196,', poolG = n7_rg(dk ? 'rgba(180,195,255,0.5)' : 'rgba(255,236,190,0.75)', [0.45, 0.35]);
  // floating dust
  var dust = []; for (i = 0; i < (ph ? 46 : 90); i++) dust.push({x: cxk + (Math.random() - 0.5) * W * 0.5, y: Math.random() * H * 0.85, r: 0.5 + Math.random() * 1.6, vy: (Math.random() - 0.6) * 4, ph: Math.random() * 6.28});
  var lit = function (x, y) { var best = 0; beams.forEach(function (b) { var u = (y + 10) / (b[2] + 10); if (u < 0 || u > 1.05) return; var bx = b[0] + (b[1] - b[0]) * u, w = (b[3] + (b[4] - b[3]) * u) * 0.5, d = Math.abs(x - bx) / w; if (d < 1) best = Math.max(best, (1 - d * d) * b[5] * (1 - 0.5 * u)); }); return best; };
  // cottonwood fluff (day)
  var fluff = []; if (!dk) for (i = 0; i < (ph ? 2 : 4); i++) fluff.push({x: cxk + (Math.random() - 0.5) * W * 0.3, y: Math.random() * H * 0.8, s: (0.8 + Math.random() * 0.5) * S, ph: Math.random() * 6.28, vy: 7 + Math.random() * 5});
  // the sand trickle
  var grains = [], lastT = 0;
  // mica glints along the lit edges (night) - near ones on the top canvas, middle ones under the near walls
  var glints = []; A.edges.forEach(function (E, k) { for (var j = 0; j < (ph ? 4 : 7); j++) { var y = H * (0.12 + Math.random() * 0.7), x = n7_xAt(E, y) + (k % 2 ? 2 : -2) * S; if (k >= 2 && (n7_inPoly(A.walls[5], x, y) || n7_inPoly(A.walls[6], x, y))) continue; glints.push({x: x, y: y, near: k < 2, ph: Math.random() * 20, per: 4 + Math.random() * 5}); } });
  var shoot = null, nextShoot = 6, fin = null;
  var dustG = n7_rg(dk ? 'rgba(220,226,255,0.9)' : 'rgba(255,240,200,0.95)', [0.4, 0.4]), washG = dk ? 'rgba(160,180,255,' : 'rgba(255,186,110,';
  var flowerCol = dk ? '#F8F4FF' : '#FFF1A8', flowerEye = dk ? '#F6D86A' : '#F2A23A', stemCol = dk ? '#4E6A6A' : '#6E9A4A';
  return {
    maxDpr: 2,
    step: function (dt, t, f) {
      dust.forEach(function (d) { d.y += d.vy * dt * f.s; d.x += Math.sin(t * 0.4 + d.ph) * 3 * dt; if (d.y < -10) d.y = H * 0.85; if (d.y > H * 0.88) d.y = 0; });
      fluff.forEach(function (q) { q.y += q.vy * dt * f.s; q.x += Math.sin(t * 0.6 + q.ph) * 10 * dt; if (q.y > fx(2, q.x) - 4) { q.y = -20; q.x = cxk + (Math.random() - 0.5) * W * 0.25; } });
      // the trickle runs for 3.4 s out of every 12
      var u = (t + 4) % 12; if (u < 3.4 && t - lastT > 0.08) { lastT = t; for (var k = 0; k < 1; k++) grains.push({x: A.ledgeTip[0] + Math.random() * 3 * S, y: A.ledgeTip[1] + 4 * S, vx: (Math.random() - 0.3) * S * 12, vy: 20 * S, r: 0.6 + Math.random() * 0.9}); }
      grains.forEach(function (g) { g.vy += 380 * S * dt; g.x += g.vx * dt; g.y += g.vy * dt; }); grains = grains.filter(function (g) { return g.y < A.pile[1]; });
      if (dk && !shoot && t > nextShoot) { var sx = cxk + (Math.random() - 0.3) * W * 0.12; shoot = {t0: t, x: sx, y: H * (0.02 + Math.random() * 0.08), dx: -W * 0.08 * (Math.random() < 0.5 ? 1 : -1), dy: H * 0.2}; nextShoot = t + 7 + Math.random() * 8; }
      if (shoot && t - shoot.t0 > 0.9) shoot = null;
      if (fin && t - fin.t0 > 24) fin = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = fin ? t - fin.t0 : -1, k;
      ca.drawImage(skyCv, 0, 0, W, H);
      if (dk) { stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * 2.2 + s.ph); n7_twinkle(ca, s.x, s.y, s.r * (1.6 + a * 1.4), '#FFFFFF', 0.25 + a * 0.6); }); }
      if (shoot) { var ks = (t - shoot.t0) / 0.9; n7_occl(ca, maskP, function (g) { var x = shoot.x + shoot.dx * ks, y = shoot.y + shoot.dy * ks, gr = g.createLinearGradient(x, y, x - shoot.dx * 0.35, y - shoot.dy * 0.35); gr.addColorStop(0, 'rgba(255,255,255,' + 0.9 * Math.sin(Math.PI * ks) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = gr; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - shoot.dx * 0.35, y - shoot.dy * 0.35); g.stroke(); }); }
      // the shafts and their pools of light
      ca.save(); ca.globalCompositeOperation = 'lighter';
      beams.forEach(function (b, j) { var br = 0.78 + 0.16 * Math.sin(tt * 0.35 + j * 2.1) + 0.08 * Math.sin(tt * 0.9 + j), sh = Math.sin(tt * 0.12 + j) * 6 * S; n7_beam(ca, b[0] + sh * 0.3, -12, b[1] + sh, b[2], b[3], b[4], b[5] * br * (dk ? 1 : 1.25), beamCol);
        n7_dot(ca, poolG, b[1] + sh, b[2] + 6 * S, b[4] * 0.85, b[5] * br * 1.1, 0.24); });
      // the moment's great beam and the glow running down the walls
      if (T >= 0) { var ea = n7_env(T, 0, 1.2, 9, 13), bx1 = cxk - W * 0.015, by1 = fx(2, bx1), grow = n7_ease(T / 1.6);
        n7_beam(ca, cxk, -14, bx1, by1, 40 * S, 120 * S, 0.95 * ea, beamCol, grow); n7_dot(ca, poolG, bx1, by1 + 8 * S, 150 * S, 1.2 * ea * n7_ease((T - 1.2) / 0.8), 0.24); }
      ca.restore();
      if (T >= 0) { var wa = n7_env(T, 0.8, 2.6, 6, 9.5); if (wa > 0) { var wy = -H * 0.3 + Math.min(1.3, T / 3) * H * 1.2;
        [[ca, maskP, dk ? 0.5 : 0.75], [cb, nearP, dk ? 0.32 : 0.45]].forEach(function (q) { var c = q[0]; c.save(); c.clip(q[1]); c.globalCompositeOperation = 'lighter'; var gr = c.createLinearGradient(0, wy - H * 0.5, 0, wy + H * 0.2); gr.addColorStop(0, washG + 0 + ')'); gr.addColorStop(0.7, washG + q[2] * wa + ')'); gr.addColorStop(1, washG + q[2] * wa * 0.3 + ')'); c.fillStyle = gr; c.fillRect(-40, -40, W + 80, H + 80); c.restore(); }); } }
      // dust motes glowing where the light catches them
      dust.forEach(function (d) { var l = lit(d.x, d.y), tw = 0.6 + 0.4 * Math.sin(tt * 1.7 + d.ph); n7_dot(ca, dustG, d.x, d.y, d.r * (1.8 + l * 2.4), (dk ? 0.14 : 0.16) + l * 1.6 * tw); });
      // cottonwood fluff
      fluff.forEach(function (q) { var l = 0.4 + lit(q.x, q.y) * 1.5; ca.save(); ca.translate(q.x, q.y); ca.rotate(Math.sin(tt * 0.8 + q.ph) * 0.4); ca.strokeStyle = 'rgba(255,255,255,' + Math.min(0.9, 0.45 * l) + ')'; ca.lineWidth = 0.7; ca.beginPath(); for (var j = 0; j < 8; j++) { var a = j / 8 * 6.283; ca.moveTo(0, 0); ca.lineTo(Math.cos(a) * 5 * q.s, Math.sin(a) * 5 * q.s - 1); } ca.stroke(); ca.fillStyle = 'rgba(255,250,235,' + Math.min(1, 0.6 * l) + ')'; ca.beginPath(); ca.arc(0, 0, 1.3 * q.s, 0, 7); ca.fill(); ca.restore(); });
      // the trickle of sand and its little puff
      // the little sandstone ledge the sand pours from (live art, so the still picture has none)
      var lx = A.ledge[0], ly = A.ledge[1] - 2 * S; ca.fillStyle = dk ? '#2C2250' : '#8E4248'; ca.beginPath(); ca.moveTo(lx - 8 * S, ly - 7 * S); ca.lineTo(lx + 8 * S, ly - 6 * S); ca.quadraticCurveTo(lx + 21 * S, ly - 4 * S, lx + 19 * S, ly + 1 * S); ca.quadraticCurveTo(lx + 8 * S, ly + 9 * S, lx - 8 * S, ly + 16 * S); ca.closePath(); ca.fill();
      ca.fillStyle = dk ? '#9AABEC' : '#FFC27E'; ca.beginPath(); ca.moveTo(lx - 8 * S, ly - 7 * S); ca.lineTo(lx + 8 * S, ly - 6 * S); ca.quadraticCurveTo(lx + 21 * S, ly - 4 * S, lx + 19 * S, ly + 1 * S); ca.quadraticCurveTo(lx + 12 * S, ly - 3 * S, lx - 8 * S, ly - 4 * S); ca.closePath(); ca.fill();
      ca.fillStyle = dk ? 'rgba(10,6,30,0.3)' : 'rgba(70,16,40,0.25)'; ca.beginPath(); ca.moveTo(lx - 8 * S, ly + 16 * S); ca.quadraticCurveTo(lx + 8 * S, ly + 9 * S, lx + 17 * S, ly + 3 * S); ca.quadraticCurveTo(lx + 6 * S, ly + 20 * S, lx - 8 * S, ly + 30 * S); ca.closePath(); ca.fill();
      var su = (t + 4) % 12, sa = su < 3.4 ? Math.min(1, su * 3) * Math.min(1, (3.4 - su) * 2) : 0, sx0 = A.ledgeTip[0], sy0 = A.ledgeTip[1];
      if (sa > 0) { var sg = ca.createLinearGradient(0, sy0, 0, A.pile[1]); sg.addColorStop(0, dk ? 'rgba(180,170,220,0.9)' : 'rgba(255,214,160,1)'); sg.addColorStop(1, dk ? 'rgba(180,170,220,0.15)' : 'rgba(255,214,160,0.2)'); ca.save(); ca.globalAlpha = sa; ca.strokeStyle = sg; ca.lineCap = 'round';
        ca.lineWidth = 1.8 * S; ca.beginPath(); ca.moveTo(sx0, sy0); ca.bezierCurveTo(sx0 + 6 * S, sy0 + 6 * S, sx0 + 4 * S + Math.sin(tt * 7) * 0.8, sy0 + 40 * S, sx0 + 4 * S, A.pile[1]); ca.stroke(); ca.restore(); }
      ca.fillStyle = dk ? 'rgba(180,170,220,0.8)' : 'rgba(255,214,160,0.9)'; grains.forEach(function (g) { ca.beginPath(); ca.arc(g.x, g.y, g.r * S, 0, 7); ca.fill(); });
      var u = (t + 4) % 12; if (u > 0.4 && u < 4.4) n7_dot(ca, dustG, A.pile[0], A.pile[1], 16 * S, 0.22 * Math.sin(Math.PI * (u - 0.4) / 4), 0.5);
      // mica glints at night
      if (dk) glints.forEach(function (g) { var p = (tt + g.ph) % g.per, a = p < 0.7 ? Math.sin(Math.PI * p / 0.7) : 0; if (a > 0) n7_twinkle(g.near ? cb : ca, g.x, g.y, 4 * S * (0.6 + a), '#E8EEFF', a * 0.9); });
      // the moment: glitter swirling up the beam, primroses opening where it lands
      if (T >= 0) { var bx = cxk - W * 0.015, by = fx(2, bx);
        for (k = 0; k < (ph ? 26 : 46); k++) { var st = 1.4 + k * 0.09, kk = (T - st) / 5.5; if (kk <= 0 || kk >= 1) continue; var yy = by - kk * (by + 20) * 0.92, ang = kk * 9 + k * 2.4, rr = (40 + 50 * kk) * S * (0.5 + (k % 3) * 0.3); n7_twinkle(ca, bx + Math.cos(ang) * rr * (1 - kk * 0.4), yy, (2 + (k % 4)) * S, dk ? '#F0F2FF' : '#FFF6D8', Math.sin(Math.PI * kk) * 0.95); }
        var gone = 1 - n7_ease((T - 20) / 3);
        [0, 1, 2, 3, 4, 5, 6].map(function (j) { var a2 = (j / 7) * 6.283 + 0.5; return {j: j, x: bx + Math.cos(a2) * 58 * S * (j % 2 ? 1.25 : 0.8), y: by + 12 * S + Math.sin(a2) * 12 * S}; }).sort(function (p, q) { return p.y - q.y; }).forEach(function (p) { n7_primrose(ca, p.x, p.y, S * (ph ? 1.6 : 1.5) * (p.j % 2 ? 0.8 : 1), n7_ease((T - 2.4 - p.j * 0.26) / 1.4) * gone, flowerCol, flowerEye, stemCol); }); }
    },
    finish: function (t) { fin = {t0: t}; }
  };
};
UIC.canyon = {L: ['#8A3A4E', '#5E2440', 'rgba(255,252,248,0.86)', '#3A1C1E', '#7A5A54', '#B0463A', '#B0463A', '#CC6A3A', '#FFFFFF'], D: ['#2E2450', '#16112C', 'rgba(26,20,48,0.8)', '#F6ECF2', '#BFAFC8', '#FFB46C', '#FFB46C', '#FFD49A', '#1C1426']};

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
