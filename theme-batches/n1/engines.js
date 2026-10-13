// ---- batch n1 engines: onsen, rainforest, tidepool, volcano, savanna
function n1_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n1_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n1_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n1_ease((T - c) / (d - c)); }
var n1_gc = null;
function n1_ctx() { return n1_gc || (n1_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n1_dot
function n1_rg(col, mid) { var g = n1_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n1_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n1_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
var n1_INK = '#3A2A30';
function n1_closedEyes(c, x, y, gap, r, lw) { c.strokeStyle = n1_INK; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.arc(x - gap, y - r * 0.3, r, Math.PI * 0.15, Math.PI * 0.85); c.moveTo(x + gap + r * Math.cos(Math.PI * 0.15), y - r * 0.3 + r * Math.sin(Math.PI * 0.15)); c.arc(x + gap, y - r * 0.3, r, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
function n1_eye(c, x, y, r, blink) { c.fillStyle = n1_INK; if (blink < 0.25) { c.strokeStyle = n1_INK; c.lineWidth = r * 0.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke(); return; } n1_ell(c, x, y, r * 0.86, r * blink); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x + r * 0.3, y - r * 0.35, r * 0.34, 0, 7); c.fill(); }
function n1_blink(t, seed) { var u = (t * 0.29 + seed * 3.7) % 4.1; return u < 0.13 ? Math.abs(u - 0.065) / 0.065 : 1; }
// draw fn(ctx) on a scratch canvas, erase what the mask (a Path2D of shapes nearer than the drawing) covers, then lay it on c.
// For canvas art that must pass BEHIND static art of the layer below the canvas (a branch, a rock) without that art being redrawn.
var n1_scr = null;
function n1_occl(c, mask, fn) { var cv = c.canvas, W = cv.width, H = cv.height; if (!n1_scr) n1_scr = document.createElement('canvas'); if (n1_scr.width !== W || n1_scr.height !== H) { n1_scr.width = W; n1_scr.height = H; }
  var g = n1_scr.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(c.getTransform()); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  fn(g); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; (mask.length ? mask : [mask]).forEach(function (m) { if (m.w) { g.lineWidth = m.w; g.lineCap = 'round'; g.stroke(m.p); } else g.fill(m.p || m); }); g.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(n1_scr, 0, 0); c.restore(); }
function n1_blush(c, x, y, r) { c.fillStyle = 'rgba(255,120,140,0.45)'; n1_ell(c, x, y, r, r * 0.6); c.fill(); }

// ---------- Hot Spring: steam curls off the water and bends in the breeze, maple leaves drift down and float across the pool with a
// few yuzu, the bamboo deer scarer fills, tips and clacks, red paper lanterns sway under the maple. Night: the lanterns glow and light the steam.
// Moment: an autumn breeze sweeps a flurry of maple leaves across the scene, and the spout tumbles a string of yuzu into the pool.
var n1_MAPLE = null;
function n1_mapleDraw(c, x, y, s, rot, col, sy) { if (!n1_MAPLE) n1_MAPLE = new Path2D(n1_P(n1_maplePts(0, 0, 1, 0)));
  c.save(); c.translate(x, y); if (sy) c.scale(1, sy); c.rotate(rot); c.scale(s, s); c.fillStyle = col; c.fill(n1_MAPLE);
  c.strokeStyle = 'rgba(90,30,20,0.35)'; c.lineWidth = 0.12; c.beginPath(); c.moveTo(0, 0.4); c.lineTo(0, -0.7); c.moveTo(0, 0); c.lineTo(-0.55, -0.35); c.moveTo(0, 0); c.lineTo(0.55, -0.35); c.stroke(); c.restore(); }
ENGINES.onsen = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, P = A.pool, sp = A.sp, S = A.S, i;
  var steamG = n1_rg(dk ? 'rgba(220,222,255,0.5)' : 'rgba(255,255,255,0.95)', [0.5, 0.45]), mistG = n1_rg(dk ? 'rgba(170,175,230,0.3)' : 'rgba(255,255,255,0.8)', [0.5, 0.5]), warmG = n1_rg('rgba(255,196,120,0.55)', [0.45, 0.25]), lanG = n1_rg('rgba(255,190,100,0.8)', [0.3, 0.35]), winG = n1_rg('rgba(255,200,120,0.6)', [0.4, 0.25]);
  var LC = dk ? ['#C8434E', '#D9703E', '#E0AC44', '#B23C4C'] : ['#E8483A', '#F5873A', '#F7C445', '#D93A3A'];
  function inPool(x, y, k) { var dx = (x - P.cx) / (P.rx * k), dy = (y - P.cy) / (P.ry * k); return dx * dx + dy * dy < 1; }
  function poolPt(k) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * k; return [P.cx + Math.cos(a) * P.rx * r, P.cy + Math.sin(a) * P.ry * r]; }
  var steam = []; for (i = 0; i < (ph ? 16 : 30); i++) { var p0 = poolPt(0.85); steam.push({x: p0[0], y: p0[1], age: Math.random() * 7, life: 5 + Math.random() * 3, vy: (16 + Math.random() * 12) * S, s: (18 + Math.random() * 16) * S, ph: Math.random() * 6.28}); }
  // falling maple leaves: mostly from under the canopy; the ones that reach the water float on it
  function leaf(top, gust) { var cn = A.canopy[Math.floor(Math.random() * A.canopy.length)], x = gust ? -30 - Math.random() * 120 : cn[0] + Math.random() * (cn[1] - cn[0]), y = gust ? H * (0.05 + Math.random() * 0.8) : top ? cn[2] + (Math.random() - 0.5) * 40 : Math.random() * H;
    var land = H + 20; if (!gust && Math.abs(x - P.cx) < P.rx * 0.9) land = P.cy + (Math.random() - 0.5) * P.ry * 1.2 * Math.sqrt(Math.max(0, 1 - Math.pow((x - P.cx) / (P.rx * 0.9), 2)));
    return {x: x, y: y, vx: gust ? (150 + Math.random() * 140) * S : (6 + Math.random() * 14) * S, vy: gust ? (Math.random() - 0.3) * 30 : (20 + Math.random() * 16) * S, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * (gust ? 8 : 2.4), s: (ph ? 5 : 7) * S * (0.8 + Math.random() * 0.5) * 1.2, c: LC[Math.floor(Math.random() * LC.length)], ph: Math.random() * 6.28, land: land, gust: gust}; }
  var leaves = []; for (i = 0; i < (ph ? 9 : 16); i++) leaves.push(leaf(false));
  // things floating on the pool: they drift slowly to the right on the current and fade at the far rim
  var floats = [];
  function addFloat(kind, x, y, born) { floats.push({k: kind, x: x, y: y, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, c: LC[Math.floor(Math.random() * LC.length)], s: kind === 'y' ? (ph ? 0.6 : 0.95) * S : (ph ? 5 : 7) * S * (0.9 + Math.random() * 0.4) * 1.2, ph: Math.random() * 6.28, born: born, a: 0, out: 0}); }
  [[-0.5, 0.1], [0.1, -0.25], [0.45, 0.3]].forEach(function (q) { addFloat('y', P.cx + q[0] * P.rx, P.cy + q[1] * P.ry, -9); });
  for (i = 0; i < (ph ? 4 : 7); i++) { var fp = poolPt(0.75); addFloat('l', fp[0], fp[1], -9); }
  var rings = [], clack = -9, pour = 0, splashes = [], gust = null, drops = [];
  function tubeAngle(t) { var u = t % 7.4; if (u < 5.4) return sp.a0 + (u > 4.9 ? Math.max(0, Math.sin((u - 4.9) * 26)) * 0.025 * (u - 4.9) * 2 : 0); if (u < 5.75) return sp.a0 + (sp.a1 - sp.a0) * n1_ease((u - 5.4) / 0.35); if (u < 6.3) return sp.a1 + Math.sin((u - 5.75) * 9) * 0.02; if (u < 6.45) return sp.a1 + (sp.a0 - 0.1 - sp.a1) * n1_ease((u - 6.3) / 0.15); return sp.a0 - 0.1 * Math.exp(-(u - 6.45) * 8) * Math.cos((u - 6.45) * 30); }
  var prevU = 0;
  function drawTube(c, a) { var L = sp.L, w = sp.w; c.save(); c.translate(sp.px, sp.py); c.rotate(a);
    c.fillStyle = dk ? '#6E9A62' : '#9CCC6C'; c.beginPath(); c.moveTo(-L * 0.4, -w / 2); c.lineTo(L * 0.6, -w / 2); c.lineTo(L * 0.6 - w * 0.5, w / 2); c.lineTo(-L * 0.4, w / 2); c.closePath(); c.fill();
    c.fillStyle = dk ? 'rgba(20,30,20,0.25)' : 'rgba(60,100,40,0.22)'; c.fillRect(-L * 0.4, w * 0.12, L * 0.98, w * 0.38);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-L * 0.38, -w * 0.38, L * 0.9, w * 0.16);
    c.fillStyle = dk ? '#4E6A46' : '#6E9A50'; c.fillRect(L * 0.05, -w / 2, w * 0.18, w); c.fillRect(-L * 0.4, -w / 2, w * 0.2, w);
    c.fillStyle = dk ? '#1E2A1E' : '#3E5A2E'; n1_ell(c, L * 0.6 - w * 0.25, 0, w * 0.18, w * 0.5, 0.45); c.fill();
    c.fillStyle = dk ? '#3A4E3A' : '#5E7A44'; c.beginPath(); c.arc(0, 0, w * 0.22, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-w * 0.06, -w * 0.06, w * 0.08, 0, 7); c.fill();
    c.restore(); }
  function drawYuzu(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = dk ? '#E8B83A' : '#FFC93A'; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
    c.fillStyle = dk ? 'rgba(160,100,20,0.35)' : 'rgba(220,140,20,0.35)'; c.beginPath(); c.arc(1.5, 2.5, 9.5, 0.2, Math.PI * 0.95); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; n1_ell(c, -4, -4.5, 3.6, 2.2, -0.6); c.fill();
    c.fillStyle = dk ? 'rgba(200,140,40,0.5)' : 'rgba(230,150,30,0.45)'; [[3, -2], [-2, 4], [5, 4], [-5, 0]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 0.7, 0, 7); c.fill(); });
    c.fillStyle = '#6A4A2A'; c.fillRect(-0.8, -13.5, 1.6, 3.6);
    c.fillStyle = dk ? '#5E9A4E' : '#6CC060'; c.beginPath(); c.moveTo(0.5, -12.5); c.quadraticCurveTo(7, -18, 12, -13); c.quadraticCurveTo(6, -9, 0.5, -12.5); c.fill();
    c.restore(); }
  // a red paper lantern (chochin) hanging on a cord from (x,y), swinging by angle sw
  function chochin(c, x, y, s, sw, t, k) { c.save(); c.translate(x, y); c.rotate(sw); c.strokeStyle = dk ? '#2A1E26' : '#3A2A2A'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14 * s); c.stroke();
    if (dk) { c.globalCompositeOperation = 'lighter'; n1_dot(c, lanG, 0, 30 * s, 52 * s, 0.6 + 0.15 * flick(t, 9 + k)); c.globalCompositeOperation = 'source-over'; }
    c.fillStyle = dk ? '#FF7A4E' : '#E8453A'; n1_ell(c, 0, 30 * s, 12 * s, 16 * s); c.fill();
    c.fillStyle = dk ? 'rgba(255,220,140,0.55)' : 'rgba(255,255,255,0.3)'; n1_ell(c, -4 * s, 25 * s, 3.5 * s, 8 * s); c.fill();
    c.strokeStyle = dk ? 'rgba(130,30,20,0.5)' : 'rgba(140,30,20,0.4)'; c.lineWidth = 0.9; c.beginPath(); for (var r = -2; r <= 2; r++) { var yy = 30 * s + r * 5.4 * s, hw = 12 * s * Math.sqrt(Math.max(0, 1 - Math.pow(r * 5.4 / 16, 2))); c.moveTo(-hw, yy); c.lineTo(hw, yy); } c.stroke();
    c.fillStyle = '#2E2A30'; c.fillRect(-6.5 * s, 13.5 * s, 13 * s, 3 * s); c.fillRect(-6.5 * s, 44 * s, 13 * s, 3 * s);
    c.fillStyle = dk ? '#FFD86A' : '#F7C445'; c.fillRect(-1 * s, 47 * s, 2 * s, 6 * s);
    c.restore(); }
  function waterClip(c, wl) { c.save(); c.beginPath(); c.rect(-50, -50, W + 100, wl + 50); c.clip(); }
  function ring(c, x, y, r, a, col) { if (a <= 0) return; c.strokeStyle = col + a + ')'; c.lineWidth = 1.3; n1_ell(c, x, y, r, r * 0.32); c.stroke(); }
  var ringC = dk ? 'rgba(200,215,255,' : 'rgba(255,255,255,';
  function wind(t) { return gust ? n1_env(t - gust.t0, 0, 1.4, 6.5, 10) : 0; }
  return {
    step: function (dt, t, f) {
      var wd = wind(t);
      steam.forEach(function (q) { q.age += dt * f.s; if (q.age > q.life) { var p = poolPt(0.85); q.x = p[0]; q.y = p[1]; q.age = 0; q.life = 5 + Math.random() * 3; } });
      leaves.forEach(function (q, j) { var sw = Math.sin(t * 1.3 + q.ph); q.x += (q.vx + sw * 14 * S + wd * 90 * S) * dt * f.s; q.y += (q.vy * (q.gust ? 1 : 0.8 + 0.4 * Math.abs(sw))) * dt * f.s; q.rot += q.vr * dt * f.s;
        if (!q.gust && q.y >= q.land) { if (q.land < H) { rings.push({x: q.x, y: q.land, t0: t, r: 8 + Math.random() * 5}); if (floats.length < (ph ? 12 : 18) && inPool(q.x, q.land, 0.92)) { addFloat('l', q.x, q.land, t); floats[floats.length - 1].c = q.c; } } leaves[j] = leaf(true); }
        else if (q.gust && q.x > W + 40) leaves[j] = null; else if (q.x > W + 40) leaves[j] = leaf(true); });
      leaves = leaves.filter(function (q) { return q; });
      if (gust && t - gust.t0 < 6.5 && Math.random() < dt * (ph ? 14 : 26)) leaves.push(leaf(false, true));
      floats.forEach(function (q) { q.x += (5 + wd * 22) * S * dt * f.s * (q.k === 'y' ? 0.8 : 1); q.y += Math.sin(t * 0.3 + q.ph) * 1.2 * S * dt; q.rot += q.vr * dt * f.s;
        if (!inPool(q.x, q.y, 0.86)) q.out += dt; q.a = Math.min(1, (t - q.born) / 0.6) * Math.max(0, 1 - q.out / 1.2); });
      floats = floats.filter(function (q) { return q.out < 1.2; });
      if (floats.filter(function (q) { return q.k === 'y'; }).length < 2) addFloat('y', P.cx - P.rx * 0.6, P.cy + (Math.random() - 0.5) * P.ry * 0.6, t);
      rings = rings.filter(function (r) { return t - r.t0 < 1.4; });
      var u = t % 7.4; if (u < prevU) prevU = 0;
      if (prevU < 5.6 && u >= 5.6) { pour = t; }
      if (prevU < 6.45 && u >= 6.45) { clack = t; }
      prevU = u;
      if (pour && t - pour < 0.7 && Math.random() < dt * 14) { var a = sp.a1, ox = sp.px + Math.cos(a) * sp.L * 0.6; splashes.push({x: ox + 10 * S + Math.random() * 8, y: P.cy - P.ry * 0.62, t0: t}); }
      splashes = splashes.filter(function (q) { return t - q.t0 < 1.2; });
      // the moment: yuzu tumble from the spout's mouth one after another and splash into the pool
      if (gust) { var T = t - gust.t0; gust.plan = gust.plan.filter(function (d) { if (T >= d) { var pm = sp.pipe; drops.push({x: pm[0], y: pm[1], vx: (30 + Math.random() * 30) * S, vy: -20 * S, t0: t, rot: 0}); return false; } return true; }); if (T > 12) gust = null; }
      drops = drops.filter(function (d) { d.vy += 520 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += 4 * dt; var land = P.cy - P.ry * 0.45;
        if (d.y >= land && d.vy > 0) { rings.push({x: d.x, y: land, t0: t, r: 20}); splashes.push({x: d.x, y: land, t0: t}); addFloat('y', d.x, land, t - 0.6); return false; } return true; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, wd = wind(t), i;
      for (i = 0; i < (ph ? 5 : 9); i++) { var mxp = ((i / (ph ? 5 : 9)) * (W + 300) + tt * 6) % (W + 300) - 150; n1_dot(ca, mistG, mxp, A.ground + Math.sin(i * 2.1) * 6 * S, (ph ? 90 : 170) * S, dk ? 0.6 : 0.7, 0.16); }
      // shimmer on the water
      ca.save(); ca.beginPath(); ca.ellipse(P.cx, P.cy, P.rx, P.ry, 0, 0, 7); ca.clip(); ca.lineCap = 'round';
      for (i = 0; i < (ph ? 7 : 12); i++) { var yy = P.cy - P.ry * 0.8 + (i + 0.5) / (ph ? 7 : 12) * P.ry * 1.6, xx = P.cx + Math.sin(tt * 0.25 + i * 1.7) * P.rx * 0.5, ww = P.rx * (0.12 + 0.08 * Math.sin(i * 2.3 + tt * 0.4)); ca.strokeStyle = dk ? 'rgba(170,200,255,0.22)' : 'rgba(255,255,255,0.55)'; ca.lineWidth = 1.6; ca.beginPath(); ca.moveTo(xx - ww, yy); ca.quadraticCurveTo(xx, yy - 2.5, xx + ww, yy); ca.stroke(); }
      if (dk) { ca.globalCompositeOperation = 'lighter'; A.lan.forEach(function (L, k) { var fk = flick(tt * 0.8, k * 2.3); for (var j = 0; j < 5; j++) { var ry = P.cy - P.ry * 0.7 + j * P.ry * 0.3; n1_dot(ca, warmG, L.x + Math.sin(tt * 1.3 + j) * 4, ry, L.r * (0.5 - j * 0.05), 0.35 * fk, 0.25); } }); ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      rings.forEach(function (r) { var k = (t - r.t0) / 1.4; ring(ca, r.x, r.y, 2 + k * r.r, 0.7 * (1 - k), ringC); });
      splashes.forEach(function (q) { var k = (t - q.t0) / 1.2; ring(ca, q.x, q.y, 3 + k * 22 * S, 0.8 * (1 - k), ringC); });
      // floating leaves and yuzu, half sunk in the water
      floats.forEach(function (q) { if (q.a <= 0) return; ca.save(); ca.globalAlpha = q.a; var bob = Math.sin(tt * 1.6 + q.ph) * 1.2 * S;
        if (q.k === 'y') { ring(ca, q.x, q.y + 4 * q.s, 13 * q.s + Math.sin(tt * 2 + q.ph) * 1.5, 0.5, ringC); ca.fillStyle = dk ? 'rgba(10,30,50,0.25)' : 'rgba(30,110,120,0.2)'; n1_ell(ca, q.x + 2, q.y + 5 * q.s, 12 * q.s, 3.5 * q.s); ca.fill(); waterClip(ca, q.y + 4 * q.s + bob * 0.3); drawYuzu(ca, q.x, q.y + bob, q.s, Math.sin(tt * 0.7 + q.ph) * 0.2); ca.restore(); }
        else { ca.fillStyle = dk ? 'rgba(10,30,50,0.2)' : 'rgba(30,110,120,0.16)'; n1_ell(ca, q.x + 1.5, q.y + 2, q.s * 0.9, q.s * 0.35); ca.fill(); n1_mapleDraw(ca, q.x, q.y + bob * 0.4, q.s, q.rot, q.c, 0.5); }
        ca.restore(); });
      // the deer scarer: water trickles from the spout, it tips, pours, and clacks back
      var a = tubeAngle(tt), oe = [sp.px + Math.cos(a) * sp.L * 0.55, sp.py + Math.sin(a) * sp.L * 0.55];
      ca.strokeStyle = dk ? 'rgba(190,210,255,0.7)' : 'rgba(255,255,255,0.95)'; ca.lineWidth = Math.max(1.2, 2 * S); ca.lineCap = 'round'; ca.beginPath(); ca.moveTo(sp.pipe[0], sp.pipe[1] + 2); ca.lineTo(sp.pipe[0] + Math.sin(tt * 9) * 0.6, Math.min(oe[1] - 3, sp.pipe[1] + sp.L * 0.9)); ca.stroke();
      drawTube(ca, a);
      var u = tt % 7.4; if (u > 5.55 && u < 6.35) { var pa = Math.min(1, (u - 5.55) * 6) * (1 - n1_ease((u - 6.1) / 0.25)); ca.strokeStyle = dk ? 'rgba(190,210,255,' + 0.8 * pa + ')' : 'rgba(255,255,255,' + 0.95 * pa + ')'; ca.lineWidth = sp.w * 0.5; ca.beginPath(); ca.moveTo(oe[0], oe[1]); ca.quadraticCurveTo(oe[0] + 10 * S, oe[1] + 4, oe[0] + 12 * S, P.cy - P.ry * 0.62); ca.stroke(); }
      if (t - clack < 0.5) { var kc = (t - clack) / 0.5, cx0 = sp.stone[0] + 4, cy0 = sp.stone[1] - 6 * S; cb.strokeStyle = dk ? 'rgba(255,240,200,' + (1 - kc) + ')' : 'rgba(90,80,70,' + (0.8 * (1 - kc)) + ')'; cb.lineWidth = 1.8; cb.lineCap = 'round'; cb.beginPath(); [-2.2, -1.6, -1.0].forEach(function (an) { var r0 = (8 + kc * 8) * S, r1 = r0 + 7 * S; cb.moveTo(cx0 + Math.cos(an) * r0, cy0 + Math.sin(an) * r0); cb.lineTo(cx0 + Math.cos(an) * r1, cy0 + Math.sin(an) * r1); }); cb.stroke(); }
      // yuzu tumbling from the spout in the moment
      drops.forEach(function (d) { drawYuzu(cb, d.x, d.y, (ph ? 0.6 : 0.95) * S, d.rot); });
      // steam: soft puffs that rise, swell and lean in the breeze (warm where the lanterns light them at night)
      steam.forEach(function (q) { var k = q.age / q.life, lean = Math.sin(tt * 0.22 + q.ph) * 10 + k * k * (46 + wd * 120) * S, x = q.x + lean + Math.sin(tt * 0.9 + q.ph + k * 4) * 6 * S, y = q.y - q.age * q.vy, r = q.s * (1 + k * 2.2), al = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (dk ? 0.42 : 0.6);
        n1_dot(cb, steamG, x, y, r, al, 0.8);
        if (dk) { var best = 0; A.lan.forEach(function (L) { best = Math.max(best, 1 - Math.hypot(L.x - x, L.y - y) / (L.r * 3)); }); if (best > 0) { cb.globalCompositeOperation = 'lighter'; n1_dot(cb, warmG, x, y, r, al * best * 0.9, 0.8); cb.globalCompositeOperation = 'source-over'; } } });
      // lantern and window light
      cb.save(); cb.globalCompositeOperation = 'lighter';
      A.lan.forEach(function (L, k) { var fk = flick(tt * 0.9, k * 2.3); n1_dot(cb, lanG, L.x, L.y, L.r * (dk ? 1.4 : 0.6), (dk ? 0.75 : 0.25) * (0.7 + 0.4 * fk)); });
      if (dk) A.house.wins.forEach(function (w, k) { n1_dot(cb, winG, w[0], w[1], A.house.bw * 0.2, 0.45 + 0.1 * Math.sin(tt * 1.3 + k)); });
      cb.restore();
      // red paper lanterns: under the ryokan eaves and hanging from the maple branches
      var ls = (ph ? 0.62 : 1) * S;
      A.house.eave.forEach(function (e, k) { chochin(cb, e[0], e[1], ls * 0.7, Math.sin(tt * 1.4 + k) * 0.08 * (1 + wd * 2), tt, k); });
      A.hang.forEach(function (h, k) { var sw = Math.sin(tt * 1.1 + k * 1.7) * 0.07 + Math.sin(tt * 0.47 + k) * 0.04 + wd * 0.25 * (0.8 + 0.2 * Math.sin(tt * 3 + k)); chochin(cb, h[0], h[1], ls * (ph ? 1.2 : 1.1), sw, tt, k + 3); });
      // falling and gusting leaves
      leaves.forEach(function (q) { n1_mapleDraw(cb, q.x, q.y, q.s, q.rot, q.c, Math.abs(Math.cos(tt * 1.7 + q.ph)) * 0.6 + 0.4); });
    },
    finish: function (t) { gust = {t0: t, plan: [1.2, 1.9, 2.6, 3.3, 4.0]}; for (var j = 0; j < (ph ? 16 : 30); j++) leaves.push(leaf(false, true)); }
  };
};

UIC.onsen = {L: ['#4E6E8E', '#33506E', 'rgba(255,255,255,0.84)', '#1C2A38', '#566676', '#B8523A', '#B8523A', '#C96A40', '#FFFFFF'], D: ['#2A2F57', '#161A36', 'rgba(24,26,52,0.78)', '#F1EFFA', '#B4B2CE', '#F2A86A', '#F2A86A', '#F7C48E', '#1C1830']};

// ---------- Rainforest Canopy: mist drifts between the layers, vines sway, raindrops gather and drip from leaf tips, the waterfall
// pours, a toucan hops along the branches, butterflies by day. Night: glowing mushrooms, tree frogs and fireflies.
// Moment: sun breaks through the waterfall mist and paints a rainbow, and a flock of macaws flies right through it.
function n1_toucan(c, x, y, s, dir, t, fly, flap) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  var blk = '#26242E', bib = '#FFF1C8', bk1 = '#FF8A2A', bk2 = '#FFD23F';
  if (fly) { c.fillStyle = blk; c.save(); c.translate(-2, -14); c.rotate(-0.9 + flap * 1.1); c.beginPath(); c.ellipse(-2, -9, 5, 12, 0.3, 0, 7); c.fill(); c.restore(); }
  c.fillStyle = blk; c.beginPath(); c.moveTo(-5, -8); c.lineTo(-15, 8); c.lineTo(-10, 10); c.lineTo(-1, -4); c.fill();
  c.fillStyle = '#E8403A'; n1_ell(c, -4, -3, 3, 2.2, 0.6); c.fill();
  c.fillStyle = blk; n1_ell(c, 0, -12, 8.5, 12, -0.35); c.fill();
  c.fillStyle = bib; n1_ell(c, 5, -17, 4.8, 6.4, -0.3); c.fill();
  c.fillStyle = blk; c.beginPath(); c.arc(3, -23.5, 6.5, 0, 7); c.fill();
  c.fillStyle = bk1; c.beginPath(); c.moveTo(7, -27.5); c.quadraticCurveTo(22, -29, 28, -21); c.quadraticCurveTo(20, -18.5, 7.5, -20.5); c.closePath(); c.fill();
  c.fillStyle = bk2; c.beginPath(); c.moveTo(7, -27.5); c.quadraticCurveTo(20, -29, 27, -22.5); c.quadraticCurveTo(18, -25, 7.5, -24.5); c.closePath(); c.fill();
  c.fillStyle = blk; c.beginPath(); c.moveTo(25, -24); c.quadraticCurveTo(29, -22, 28, -21); c.quadraticCurveTo(26, -20.6, 24.5, -21); c.fill();
  c.fillStyle = '#5EC8F2'; c.beginPath(); c.arc(4.4, -24.5, 2.6, 0, 7); c.fill();
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(4.8, -24.6, 1.2, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(5.3, -25.1, 0.45, 0, 7); c.fill();
  if (!fly) { c.fillStyle = '#3A3842'; n1_ell(c, -2, -11, 4.5, 9, -0.2); c.fill(); c.fillStyle = '#7A8494'; c.fillRect(-2, -1, 1.6, 2.4); c.fillRect(2, -1, 1.6, 2.4); }
  else { c.fillStyle = '#3A3842'; c.save(); c.translate(-1, -14); c.rotate(-0.4 - flap * 1.2); n1_ell(c, -1, -10, 5, 13, -0.2); c.fill(); c.restore(); }
  c.restore(); }
function n1_macaw(c, x, y, s, flap, kind) { c.save(); c.translate(x, y); c.scale(s, s);
  var body = kind ? '#2F8EE8' : '#E83A3A', belly = kind ? '#FFC93A' : '#E83A3A', w1 = kind ? '#2F6FD0' : '#2F7FE0', w2 = kind ? '#2FB0E8' : '#FFC93A';
  c.fillStyle = kind ? '#2F6FD0' : '#E83A3A'; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-34, 6); c.lineTo(-33, 9); c.lineTo(-7, 4); c.fill();
  c.fillStyle = w2; c.beginPath(); c.moveTo(-9, 1.5); c.lineTo(-30, 8); c.lineTo(-8, 3.5); c.fill();
  c.save(); c.translate(-1, -1); c.scale(1, flap); c.fillStyle = w1; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-4, -18, 6, -22); c.quadraticCurveTo(6, -10, 4, 0); c.fill(); c.fillStyle = w2; c.beginPath(); c.moveTo(-5, -1); c.quadraticCurveTo(-3, -9, 3, -10); c.quadraticCurveTo(4, -5, 3, -1); c.fill(); c.restore();
  c.fillStyle = body; n1_ell(c, 0, 0, 11, 5.5, -0.08); c.fill(); c.fillStyle = belly; n1_ell(c, 1, 2.6, 8, 2.8, -0.08); c.fill();
  c.fillStyle = body; c.beginPath(); c.arc(10, -2, 5, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; n1_ell(c, 11.5, -2, 2.6, 2, 0); c.fill(); c.fillStyle = '#1A1820'; c.beginPath(); c.arc(11.6, -2.4, 0.9, 0, 7); c.fill();
  c.fillStyle = '#3A3236'; c.beginPath(); c.moveTo(14, -4); c.quadraticCurveTo(19, -3, 17, 2); c.lineTo(14, 0.5); c.fill();
  c.restore(); }
ENGINES.rainforest = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, F = A.fall, i;
  var mistG = n1_rg(dk ? 'rgba(150,210,200,0.32)' : 'rgba(255,255,255,0.7)', [0.5, 0.45]), mushG = n1_rg('rgba(120,255,225,0.7)', [0.3, 0.3]), flyG = n1_rg('rgba(210,255,140,0.75)', [0.25, 0.3]), frogG = n1_rg('rgba(90,220,255,0.6)', [0.3, 0.3]), sunG = n1_rg('rgba(255,250,210,0.55)', [0.4, 0.3]);
  var drips = A.tips.map(function (p, j) { return {x: p[0], y: p[1], g: hash(j + 1), rate: 0.18 + hash(j + 7) * 0.22}; }), falling = [];
  var fl = []; for (i = 0; i < (ph ? 18 : 34); i++) fl.push({u: hash(i + 3), sp: 0.5 + hash(i + 5) * 0.6, x: hash(i + 11)});
  var bugs = []; for (i = 0; i < (dk ? (ph ? 9 : 16) : (ph ? 2 : 3)); i++) bugs.push({x0: W * (0.08 + hash(i + 30) * 0.84), y0: H * (dk ? 0.35 + hash(i + 40) * 0.6 : 0.62 + hash(i + 40) * 0.3), ph: hash(i + 50) * 6.28});
  var frogs = A.frogs, occ = [new Path2D(A.occ), {p: new Path2D(A.occL.d), w: A.occL.w + 1}];
  var P = A.perch, tc = {i: P.length - 2, x: P[P.length - 2].x, y: P[P.length - 2].y, dir: -1, mv: null, wait: 2};
  var rb = null;
  function drop(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r * 2.2); c.quadraticCurveTo(x + r * 1.1, y - r * 0.4, x + r, y + r * 0.1); c.arc(x, y, r, 0, Math.PI); c.quadraticCurveTo(x - r * 1.1, y - r * 0.4, x, y - r * 2.2); c.fill(); }
  return {
    step: function (dt, t, f) {
      drips.forEach(function (d) { d.g += dt * d.rate * f.s; if (d.g >= 1) { d.g = 0; falling.push({x: d.x, y: d.y, vy: 0, y0: d.y}); } });
      falling.forEach(function (q) { q.vy += 900 * dt; q.y += q.vy * dt; }); falling = falling.filter(function (q) { return q.y < H + 10 && q.y - q.y0 < H * 0.5; });
      // toucan: rest, then hop to a neighbour perch (or fly to the other branch now and then)
      if (tc.mv) { var u = (t - tc.mv.t0) / tc.mv.dur; if (u >= 1) { tc.i = tc.mv.to; tc.x = P[tc.i].x; tc.y = P[tc.i].y; tc.mv = null; tc.wait = 2.5 + Math.random() * 4; } }
      else { tc.wait -= dt * f.s; if (tc.wait <= 0) { var cand = [], cur = P[tc.i]; P.forEach(function (p, j) { if (j !== tc.i && p.b === cur.b && Math.abs(j - tc.i) === 1) cand.push(j); }); if (Math.random() < 0.22 || !cand.length) P.forEach(function (p, j) { if (p.b !== cur.b) cand.push(j); });
        var to = cand[Math.floor(Math.random() * cand.length)], fly = P[to].b !== cur.b; tc.mv = {from: tc.i, to: to, t0: t, dur: fly ? 2.4 : 0.55, fly: fly}; tc.dir = P[to].x > cur.x ? 1 : -1; } }
      if (rb && t - rb.t0 > 11) rb = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i;
      // the waterfall pours (behind the upper branch)
      n1_occl(ca, occ, function (g) { g.save(); g.beginPath(); g.rect(F.x - F.w * 0.7, F.top, F.w * 1.4, F.bot - F.top - 6); g.clip(); g.lineCap = 'round';
        fl.forEach(function (q) { var u = (q.u + tt * q.sp * 0.5) % 1, y = F.top + u * (F.bot - F.top), x = F.x + (q.x - 0.5) * F.w * (1 + u * 0.25); g.strokeStyle = dk ? 'rgba(200,235,235,' + (0.5 * Math.sin(Math.PI * u)) + ')' : 'rgba(170,215,215,' + (0.55 * Math.sin(Math.PI * u)) + ')'; g.lineWidth = 1.6 * S + 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 22 * S); g.stroke(); });
        g.restore();
        // the rainbow (moment)
        if (rb) { var T = t - rb.t0, k = n1_env(T, 0.3, 1.8, 8, 10.5); if (k > 0) { var R0 = ph ? W * 0.42 : W * 0.21, cx = F.x, cy = F.bot + H * 0.02, bw = (ph ? 6 : 9) * S + 2, cols = ['#FF6A6A', '#FFA94A', '#FFE05A', '#7EDB6A', '#5AB8F2', '#9A7BF0'];
          g.save(); g.beginPath(); g.rect(-10, -10, W + 20, F.bot + H * 0.03); g.clip(); g.globalAlpha = k * (dk ? 0.3 : 0.5); g.lineWidth = bw;
          cols.forEach(function (col, j) { g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, R0 - j * bw, Math.PI, 2 * Math.PI); g.stroke(); }); g.restore(); } } });
      for (i = 0; i < 4; i++) n1_dot(ca, mistG, F.x + Math.sin(tt * 0.4 + i * 1.7) * F.w * 1.5, F.bot - 8 - i * 4, F.w * (1.4 + i * 0.35), 0.75, 0.45);
      // drifting mist between the canopy layers
      [[0.55, 0.12, 1], [0.66, 0.1, -1], [0.82, 0.08, 1]].forEach(function (b, k) { for (var j = 0; j < (ph ? 4 : 7); j++) { var x = ((j / (ph ? 4 : 7)) * (W + 400) + tt * 9 * b[2] * (1 + k * 0.3) + k * 140) % (W + 400); if (x < 0) x += W + 400; n1_dot(ca, mistG, x - 200, H * b[0] + Math.sin(tt * 0.3 + j * 2 + k) * 8, (ph ? 100 : 170) * S, (dk ? 0.4 : 0.34) * (k < 2 ? 0.7 : 1), 0.14); } });
      // swaying vines
      ca.lineCap = 'round';
      A.vines.forEach(function (vn) { var sw = Math.sin(tt * 0.6 + vn.ph) * 0.06 + Math.sin(tt * 1.3 + vn.ph * 2) * 0.015, pts = [], n = 14; for (var j = 0; j <= n; j++) { var u = j / n, a = sw * u * u; pts.push([vn.x + Math.sin(a) * vn.L * u + Math.sin(u * 6 + vn.ph) * 4, -12 + vn.L * u * Math.cos(a)]); }
        ca.strokeStyle = dk ? '#1E4A3A' : '#5A8A3E'; ca.lineWidth = 2.4 * S + 0.6; ca.beginPath(); pts.forEach(function (p, j) { if (j) ca.lineTo(p[0], p[1]); else ca.moveTo(p[0], p[1]); }); ca.stroke();
        ca.fillStyle = dk ? '#24584A' : '#6CB04E'; pts.forEach(function (p, j) { if (j < 2) return; var sd = j % 2 ? 1 : -1; ca.save(); ca.translate(p[0], p[1]); ca.rotate(sd * 0.9 + sw * 3); n1_ell(ca, sd * 6 * S, 0, 6.5 * S, 3 * S); ca.fill(); ca.restore(); }); });
      // drops gathering on leaf tips and falling
      cb.fillStyle = dk ? 'rgba(170,230,240,0.8)' : 'rgba(225,248,255,0.92)';
      drips.forEach(function (d) { var r = (0.6 + d.g * 2.8) * S + 0.4; drop(cb, d.x, d.y + r, r); });
      falling.forEach(function (q) { drop(cb, q.x, q.y, 2.6 * S + 0.6); });
      cb.fillStyle = 'rgba(255,255,255,0.8)'; drips.forEach(function (d) { if (d.g > 0.3) { var r = (0.6 + d.g * 2.8) * S; cb.beginPath(); cb.arc(d.x - r * 0.35, d.y + r * 0.7, r * 0.3, 0, 7); cb.fill(); } });
      // tree frogs on the low leaves (glowing at night)
      frogs.forEach(function (p, j) { var s = (ph ? 0.8 : 1.2) * S, x = p[0], y = p[1], pf = Math.max(0, Math.sin(tt * 1.7 + j * 2)) ; if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; n1_dot(cb, frogG, x, y - 6 * s, 26 * s, 0.6 + 0.3 * Math.sin(tt * 1.3 + j)); cb.restore(); }
        cb.save(); cb.translate(x, y); cb.scale(s, s); cb.fillStyle = dk ? '#3FB8F0' : '#2F8FE8'; n1_ell(cb, 0, -6, 9, 7); cb.fill(); cb.beginPath(); cb.arc(-5, -12, 3.6, 0, 7); cb.arc(5, -12, 3.6, 0, 7); cb.fill();
        cb.fillStyle = '#FFFFFF'; cb.beginPath(); cb.arc(-5, -12.4, 2.4, 0, 7); cb.arc(5, -12.4, 2.4, 0, 7); cb.fill(); var bl = n1_blink(tt, j + 3); cb.fillStyle = '#1A1820'; n1_ell(cb, -5, -12.4, 1.4, 1.6 * bl); cb.fill(); n1_ell(cb, 5, -12.4, 1.4, 1.6 * bl); cb.fill();
        cb.fillStyle = '#FFE0F0'; n1_ell(cb, 0, -3 + pf * 0.5, 3 + pf * 2.2, 2 + pf * 1.6); cb.fill(); cb.fillStyle = 'rgba(255,120,150,0.55)'; n1_ell(cb, -6.5, -7.5, 2, 1.2); cb.fill(); n1_ell(cb, 6.5, -7.5, 2, 1.2); cb.fill();
        cb.fillStyle = '#FF9A3A'; [[-9, -1], [-6, 0.5], [6, 0.5], [9, -1]].forEach(function (q) { cb.beginPath(); cb.arc(q[0], q[1], 1.5, 0, 7); cb.fill(); });
        if (dk) { cb.fillStyle = 'rgba(200,255,255,0.9)'; [[-3, -6], [3, -4], [0, -8]].forEach(function (q) { cb.beginPath(); cb.arc(q[0], q[1], 0.8, 0, 7); cb.fill(); }); } cb.restore(); });
      // the toucan
      var tx = tc.x, ty = tc.y, fly = false, flap = 0;
      if (tc.mv) { var a = P[tc.mv.from], b = P[tc.mv.to], uu = Math.min(1, (t - tc.mv.t0) / tc.mv.dur), e = tc.mv.fly ? n1_ease(uu) : uu; tx = a.x + (b.x - a.x) * e; ty = a.y + (b.y - a.y) * e - Math.sin(Math.PI * uu) * (tc.mv.fly ? H * 0.12 : 16 * S); fly = tc.mv.fly; flap = Math.sin(t * 16); }
      n1_toucan(cb, tx, ty + (fly ? 0 : Math.abs(Math.sin(tt * 2)) * -0.6), (ph ? 0.85 : 1.35) * S, tc.dir, tt, fly, flap);
      // butterflies (day) or fireflies (night)
      cb.save(); if (dk) cb.globalCompositeOperation = 'lighter';
      bugs.forEach(function (q, j) { var x = q.x0 + Math.sin(tt * 0.27 + q.ph) * 60 + Math.sin(tt * 0.9 + q.ph * 2) * 12, y = q.y0 + Math.sin(tt * 0.45 + q.ph * 3) * 28;
        if (dk) { var al = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(tt * 1.1 + q.ph * 1.7)), 2); n1_dot(cb, flyG, x, y, 12, al); cb.fillStyle = 'rgba(240,255,190,' + al + ')'; cb.beginPath(); cb.arc(x, y, 1.6, 0, 7); cb.fill(); }
        else { var fw = 0.2 + 0.8 * Math.abs(Math.sin(tt * 7 + q.ph)), s = (ph ? 0.9 : 1.3) * S;
          // a blue morpho: dark-edged fore and hind wings, bright inner panels, a slim body with feelers
          cb.fillStyle = '#1E3A8A'; n1_ell(cb, x - 5 * fw * s, y - 1.5 * s, 6 * fw * s, 7.4 * s, -0.25); cb.fill(); n1_ell(cb, x + 5 * fw * s, y - 1.5 * s, 6 * fw * s, 7.4 * s, 0.25); cb.fill(); n1_ell(cb, x - 3.6 * fw * s, y + 4 * s, 4 * fw * s, 4.4 * s, 0.3); cb.fill(); n1_ell(cb, x + 3.6 * fw * s, y + 4 * s, 4 * fw * s, 4.4 * s, -0.3); cb.fill();
          cb.fillStyle = '#3E8CF5'; n1_ell(cb, x - 4.6 * fw * s, y - 1.6 * s, 4.4 * fw * s, 5.8 * s, -0.25); cb.fill(); n1_ell(cb, x + 4.6 * fw * s, y - 1.6 * s, 4.4 * fw * s, 5.8 * s, 0.25); cb.fill(); n1_ell(cb, x - 3.3 * fw * s, y + 3.8 * s, 2.8 * fw * s, 3.2 * s, 0.3); cb.fill(); n1_ell(cb, x + 3.3 * fw * s, y + 3.8 * s, 2.8 * fw * s, 3.2 * s, -0.3); cb.fill();
          cb.fillStyle = '#9FDDFF'; n1_ell(cb, x - 4 * fw * s, y - 2.6 * s, 2 * fw * s, 2.8 * s); cb.fill(); n1_ell(cb, x + 4 * fw * s, y - 2.6 * s, 2 * fw * s, 2.8 * s); cb.fill();
          cb.fillStyle = '#2A2430'; n1_ell(cb, x, y + 0.5 * s, 0.9 * s, 5 * s); cb.fill(); cb.strokeStyle = '#2A2430'; cb.lineWidth = 0.8; cb.beginPath(); cb.moveTo(x, y - 4 * s); cb.quadraticCurveTo(x - 1.5 * s, y - 7 * s, x - 2.6 * s, y - 8 * s); cb.moveTo(x, y - 4 * s); cb.quadraticCurveTo(x + 1.5 * s, y - 7 * s, x + 2.6 * s, y - 8 * s); cb.stroke(); } });
      // glowing mushrooms
      if (dk) A.mush.forEach(function (m, j) { n1_dot(cb, mushG, m[0], m[1], m[2] * 4.5, 0.55 + 0.25 * Math.sin(tt * 1.2 + j * 0.9)); });
      cb.restore();
      // the moment: sunbeams, then the macaws fly through the rainbow
      if (rb) { var T2 = t - rb.t0, ks = n1_env(T2, 0, 1, 5, 8);
        if (ks > 0) { cb.save(); cb.globalCompositeOperation = 'lighter'; var sx = A.moon[0], sy = A.moon[1]; for (var r = 0; r < 6; r++) { var an = 0.35 + r * 0.16 + Math.sin(T2 * 0.4 + r) * 0.02; cb.fillStyle = dk ? 'rgba(200,240,255,' + (0.05 * ks) + ')' : 'rgba(255,248,210,' + (0.12 * ks) + ')'; cb.beginPath(); cb.moveTo(sx, sy); cb.lineTo(sx + Math.cos(an - 0.04) * H * 1.3, sy + Math.sin(an - 0.04) * H * 1.3); cb.lineTo(sx + Math.cos(an + 0.04) * H * 1.3, sy + Math.sin(an + 0.04) * H * 1.3); cb.fill(); } n1_dot(cb, sunG, sx, sy, (ph ? 90 : 150) * ks, 0.8 * ks); cb.restore(); }
        var R0b = ph ? W * 0.42 : W * 0.21, yl = F.bot + H * 0.02 - R0b * 0.75;
        for (var m = 0; m < 6; m++) { var tm = T2 - 1.0 - m * 0.18; if (tm < 0) continue; var u3 = tm / (ph ? 3.4 : 4.6); if (u3 > 1.1) continue; var mxp = -80 + (W + 200) * u3 + ((m % 2) ? -30 : 0) * S, myp = yl + (m - 2.5) * 16 * S + Math.sin(tm * 2 + m) * 8 - Math.sin(Math.PI * Math.min(1, u3)) * H * 0.06;
          n1_macaw(cb, mxp, myp, (ph ? 0.75 : 1.2) * S, Math.sin(tm * 11 + m) * 0.9 + 0.1, m % 2); } }
    },
    finish: function (t) { rb = {t0: t}; }
  };
};

UIC.rainforest = {L: ['#2F7A55', '#1C5238', 'rgba(255,255,255,0.84)', '#132A1E', '#4E6A58', '#C2482E', '#C2482E', '#D26A2E', '#FFFFFF'], D: ['#14403A', '#0A221E', 'rgba(10,34,30,0.78)', '#E6F6EE', '#9EC2B2', '#7FF0D0', '#7FF0D0', '#B8F59A', '#0C201A']};

// ---------- Tide Pools: swells slide along the horizon, a sailboat tacks across behind the sea stacks, gulls glide, surf bursts at the
// stacks, little washes run sideways along the shelf, anemones wave, kelp sways, a sculpin and tiny fish dart sideways, a crab scuttles.
// Night: the lighthouse beam sweeps and soft blue sparkles glow where the water splashes.
// Moment: a wave sweeps sideways across the shelf, and as it drains away every anemone opens like a flower, one after another.
var n1_AN = [['#3E9E7A', '#6EE0A8', '#D6FFE6'], ['#C84E7C', '#FF8FB8', '#FFE0EC'], ['#7656BE', '#B58CF2', '#F0E2FF'], ['#D0663A', '#FFA866', '#FFE8D0']];
function n1_anemone(c, x, y, r, col, o, t, ph, dk) {
  var body = col[0], ten = col[1], tip = col[2], n = 18, i;
  c.fillStyle = body; n1_ell(c, x, y + r * 0.12, r * 0.44, r * 0.3); c.fill();
  if (o < 0.05) { c.fillStyle = ten; n1_ell(c, x, y - r * 0.05, r * 0.36, r * 0.26); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; n1_ell(c, x - r * 0.1, y - r * 0.14, r * 0.14, r * 0.07); c.fill(); return; }
  c.lineCap = 'round';
  for (var pass = 0; pass < 2; pass++) for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2 + ph, back = Math.sin(a) < 0; if (back !== (pass === 0)) continue;
    var L = r * (0.2 + 0.85 * o) * (0.88 + 0.12 * Math.sin(i * 2.7 + ph)), sw = Math.sin(t * 1.5 + i * 0.8 + ph) * 0.35 * o, ex = x + Math.cos(a + sw) * L, ey = y + Math.sin(a + sw) * L * 0.6 - r * 0.06, mx = x + Math.cos(a) * L * 0.5, my = y + Math.sin(a) * L * 0.3 - r * 0.12;
    c.strokeStyle = back ? body : ten; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(x, y - r * 0.04); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.fillStyle = tip; c.beginPath(); c.arc(ex, ey, r * 0.085, 0, 7); c.fill(); }
  c.fillStyle = tip; n1_ell(c, x, y - r * 0.05, r * 0.2 * (0.6 + 0.4 * o), r * 0.12 * (0.6 + 0.4 * o)); c.fill();
  c.fillStyle = body; n1_ell(c, x, y - r * 0.05, r * 0.07, r * 0.035); c.fill(); }
function n1_sculpin(c, x, y, s, dir, t, swim) { c.save(); c.translate(x, y); c.scale(s * dir, s); var wig = Math.sin(t * (swim ? 22 : 3)) * (swim ? 0.25 : 0.06);
  c.fillStyle = '#8A6E52'; c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(8, -6, 0, -5.5); c.quadraticCurveTo(-10, -3, -18, wig * 10); c.quadraticCurveTo(-10, 3, 0, 5.5); c.quadraticCurveTo(8, 6, 10, 0); c.fill();
  c.fillStyle = '#A88A68'; c.beginPath(); c.moveTo(-17, wig * 10); c.lineTo(-24, -4 + wig * 14); c.lineTo(-23, 4 + wig * 14); c.fill();
  c.fillStyle = 'rgba(214,180,130,0.85)'; [-1, 1].forEach(function (sd) { c.beginPath(); c.moveTo(2, sd * 4); c.quadraticCurveTo(-2, sd * (12 + Math.sin(t * 4) * 1.5), -7, sd * 9); c.quadraticCurveTo(-4, sd * 5, 2, sd * 4); c.fill(); });
  c.fillStyle = '#5E4836'; [[-4, -2, 1.6], [-10, 1, 1.3], [1, 2, 1.2], [-13, -1.5, 1]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2], 0, 7); c.fill(); });
  c.fillStyle = '#FFE6B0'; [[5, -3], [5, 3]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.9, 0, 7); c.fill(); }); c.fillStyle = '#1A1820'; [[5.4, -3], [5.4, 3]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1, 0, 7); c.fill(); });
  c.restore(); }
// a tiny striped fish seen from the side
function n1_minnow(c, x, y, s, dir, t, col) { c.save(); c.translate(x, y); c.scale(s * dir, s); var w = Math.sin(t * 12) * 1.5;
  c.fillStyle = col[0]; c.beginPath(); c.moveTo(9, 0); c.quadraticCurveTo(6, -4.5, -2, -4); c.quadraticCurveTo(-7, -2, -9, w * 0.4); c.quadraticCurveTo(-7, 2, -2, 4); c.quadraticCurveTo(6, 4.5, 9, 0); c.fill();
  c.beginPath(); c.moveTo(-8, w * 0.4); c.lineTo(-14, -4 + w); c.lineTo(-14, 4 + w); c.fill();
  c.fillStyle = col[1]; c.fillRect(-1, -4, 2.2, 8); c.fillRect(-6, -2.6, 1.8, 5.2);
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(5.2, -1, 1.2, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(5.5, -1.4, 0.4, 0, 7); c.fill(); c.restore(); }
function n1_crab(c, x, y, s, t, walk, happy) { c.save(); c.translate(x, y + (walk ? Math.abs(Math.sin(t * 12)) * -1 : 0)); c.scale(s, s);
  var sh = '#E8603A', dkr = '#C8482A'; c.fillStyle = 'rgba(40,30,30,0.2)'; n1_ell(c, 0, 2, 16, 3); c.fill();
  c.strokeStyle = dkr; c.lineWidth = 2; c.lineCap = 'round'; for (var i = 0; i < 3; i++) [-1, 1].forEach(function (sd) { var k = walk ? Math.sin(t * 14 + i * 2 + (sd > 0 ? 1 : 0)) * 2 : 0; c.beginPath(); c.moveTo(sd * 6, -4 + i * 1.5); c.lineTo(sd * (12 + i * 1.5), -6 + i * 2 + k); c.lineTo(sd * (15 + i * 2), 1 + k * 0.5); c.stroke(); });
  var cl = happy ? -0.7 + Math.sin(t * 10) * 0.3 : Math.sin(t * 1.3) * 0.15; [-1, 1].forEach(function (sd) { c.save(); c.translate(sd * 8, -9); c.rotate(sd * cl); c.fillStyle = sh; n1_ell(c, sd * 4, -5, 4.5, 3.6, sd * 0.4); c.fill(); c.fillStyle = dkr; c.beginPath(); c.moveTo(sd * 6, -6); c.lineTo(sd * 9, -9); c.lineTo(sd * 7.5, -4.5); c.fill(); c.restore(); });
  c.fillStyle = sh; n1_ell(c, 0, -6, 11, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; n1_ell(c, -3, -9, 5, 2.4); c.fill();
  c.strokeStyle = dkr; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, -12); c.lineTo(-4, -16); c.moveTo(3, -12); c.lineTo(4, -16); c.stroke();
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(-4, -17, 1.8, 0, 7); c.arc(4, -17, 1.8, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-3.5, -17.6, 0.6, 0, 7); c.arc(4.5, -17.6, 0.6, 0, 7); c.fill();
  n1_blush(c, -6, -5, 2); n1_blush(c, 6, -5, 2); c.strokeStyle = n1_INK; c.lineWidth = 1; c.beginPath(); c.arc(0, -6, 2, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
  c.restore(); }
// a little sailboat, its bow toward dir
function n1_sailboat(c, x, y, s, dir, t, dk) { c.save(); c.translate(x, y + Math.sin(t * 1.6) * 0.8 * s); c.scale(s * dir, s); c.rotate(Math.sin(t * 1.3) * 0.03);
  c.fillStyle = dk ? '#3A2E4A' : '#7A4A3A'; c.fillRect(-0.8, -34, 1.6, 34);
  c.fillStyle = dk ? '#D8D8F0' : '#FFFFFF'; c.beginPath(); c.moveTo(1.5, -33); c.quadraticCurveTo(14, -18, 16, -3); c.lineTo(1.5, -3); c.closePath(); c.fill();
  c.fillStyle = dk ? '#E07A7A' : '#FF6A5A'; c.beginPath(); c.moveTo(-1.5, -30); c.quadraticCurveTo(-9, -16, -12, -4); c.lineTo(-1.5, -4); c.closePath(); c.fill();
  c.fillStyle = dk ? '#FFD86A' : '#FFC93A'; c.beginPath(); c.moveTo(0.8, -34); c.lineTo(7, -32); c.lineTo(0.8, -30); c.fill();
  c.fillStyle = dk ? '#2E4A7A' : '#2E6AB8'; c.beginPath(); c.moveTo(-17, -2); c.lineTo(19, -2); c.quadraticCurveTo(15, 5, 10, 5); c.lineTo(-12, 5); c.quadraticCurveTo(-16, 3, -17, -2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(-14, -0.5, 30, 1.6);
  c.restore(); }
ENGINES.tidepool = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Pl = A.pools, sh = A.shelf, i;
  var sparkG = n1_rg('rgba(110,230,255,0.85)', [0.3, 0.3]), glowG = n1_rg('rgba(255,255,255,0.7)', [0.3, 0.3]), lampG = n1_rg('rgba(255,230,150,0.9)', [0.25, 0.35]);
  var WAT = {deep: dk ? ['rgba(14,40,90,0.72)', 'rgba(50,110,160,0.3)'] : ['rgba(16,110,170,0.62)', 'rgba(110,220,230,0.25)'], sand: dk ? ['rgba(30,70,130,0.5)', 'rgba(60,110,160,0.22)'] : ['rgba(40,175,215,0.55)', 'rgba(120,225,235,0.28)'],
    pink: dk ? ['rgba(30,60,120,0.5)', 'rgba(60,100,150,0.2)'] : ['rgba(60,160,215,0.42)', 'rgba(150,225,240,0.15)'], grass: dk ? ['rgba(20,70,100,0.55)', 'rgba(40,110,120,0.2)'] : ['rgba(40,160,170,0.45)', 'rgba(130,230,210,0.15)']};
  var grads = {}; Object.keys(WAT).forEach(function (k) { var g = n1_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, WAT[k][0]); g.addColorStop(1, WAT[k][1]); grads[k] = g; });
  var under = A.under.map(function (q) { return [new Path2D(q[0]), q[1]]; }), over = A.over.map(function (q) { return [new Path2D(q[0]), q[1]]; }), poolP = Pl.map(function (p) { return new Path2D(p.d); });
  var an = A.anem.map(function (q, j) { return {x: q.x, y: q.y, r: q.r, c: n1_AN[q.c], ph: hash(j + 3) * 6.28, o: 1, pool: q.pool}; });
  var P0 = Pl[0], fish = {x: P0.cx, y: P0.cy + P0.ry * 0.15, tx: P0.cx, dir: 1, wait: 1, t0: 0, fx: P0.cx, mv: 0};
  var minnows = []; Pl.forEach(function (p, k) { if (p.ty !== 'sand' && p.ty !== 'grass') return; for (var m = 0; m < (p.rx > 60 ? 3 : 2); m++) minnows.push({p: p, ph: hash(k * 7 + m) * 6.28, sp: 0.25 + hash(k + m * 3) * 0.2, dy: (hash(k * 3 + m + 1) - 0.5) * 0.8, col: m % 2 ? ['#FFC93A', '#3E6AD8'] : ['#6ED0F0', '#FFFFFF']}); });
  var gulls = []; for (i = 0; i < (ph ? 3 : 4); i++) gulls.push({x: hash(i + 1) * W, y: A.hz * (0.3 + hash(i + 2) * 0.5), sp: (12 + hash(i + 3) * 10) * (i % 2 ? 1 : -1), ph: hash(i + 4) * 6.28});
  var boat = {x: W * 0.4, dir: 1};
  var wash = null, nextWash = 2, big = null, sparks = [], masks = [new Path2D(A.rmask)], fgMask = [new Path2D(A.fg)];
  function poolClip(c, k) { c.clip(poolP[k]); }
  return {
    step: function (dt, t, f) {
      nextWash -= dt * f.s; if (nextWash <= 0 && !big) { nextWash = 6 + Math.random() * 4; wash = {t0: t, d: H * (ph ? 0.05 : 0.07) * (0.7 + Math.random() * 0.6), dir: Math.random() < 0.5 ? 1 : -1}; }
      if (wash && t - wash.t0 > 4.5) wash = null;
      // the sculpin rests, then darts sideways somewhere new
      if (fish.mv) { var u = (t - fish.t0) / 0.6; if (u >= 1) { fish.mv = 0; fish.x = fish.tx; fish.wait = 1.5 + Math.random() * 3; } else fish.x = fish.fx + (fish.tx - fish.fx) * (1 - Math.pow(1 - u, 3)); }
      else { fish.wait -= dt * f.s; if (fish.wait <= 0) { fish.fx = fish.x; fish.tx = P0.cx + (Math.random() - 0.5) * P0.rx * 1.2; fish.dir = fish.tx > fish.x ? 1 : -1; fish.t0 = t; fish.mv = 1; } }
      gulls.forEach(function (g) { g.x += g.sp * dt * f.s; if (g.x > W + 40) g.x = -40; if (g.x < -40) g.x = W + 40; });
      boat.x += boat.dir * 9 * S * dt * f.s; if (boat.x > W + 60) boat.x = -60;
      if (big) { var T = t - big.t0; an.forEach(function (q) { var rel = big.dir > 0 ? q.x / W : 1 - q.x / W, hit = 0.1 + rel * 1.5, op = 3.2 + big.order.indexOf(q) * (ph ? 0.26 : 0.22);
          if (T < hit) q.o = Math.max(q.o, 1); else if (T < op) q.o = Math.max(0, q.o - dt * 4); else { var k = (T - op) / 0.55; q.o = k >= 1 ? 1 : n1_ease(k) * (1 + 0.25 * Math.sin(Math.PI * k)); if (!q.pop && T > op) { q.pop = 1; for (var m = 0; m < 6; m++) sparks.push({x: q.x, y: q.y - q.r * 0.2, a: m / 6 * 6.28, t0: t, c: q.c[2]}); } } });
        if (T > 3.2 + an.length * 0.3 + 1.5) { big = null; an.forEach(function (q) { q.o = 1; q.pop = 0; }); } }
      sparks = sparks.filter(function (s) { return t - s.t0 < 0.9; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i, x, k;
      // gulls
      ca.strokeStyle = dk ? 'rgba(220,226,240,0.75)' : 'rgba(70,80,90,0.75)'; ca.lineWidth = 1.6; ca.lineCap = 'round'; ca.beginPath();
      gulls.forEach(function (g) { var y = g.y + Math.sin(tt * 0.5 + g.ph) * 6, fl = Math.sin(tt * 3 + g.ph) * 3, s = 8 * S + 3; ca.moveTo(g.x - s, y - 2 - fl); ca.quadraticCurveTo(g.x - s * 0.4, y - 4 - fl * 0.5, g.x, y); ca.quadraticCurveTo(g.x + s * 0.4, y - 4 - fl * 0.5, g.x + s, y - 2 - fl); }); ca.stroke();
      // the sailboat on the horizon, passing behind the headland and the stacks (and through the arch)
      n1_occl(ca, fgMask, function (c) { n1_sailboat(c, boat.x, A.boat.y, A.boat.s, boat.dir, tt, dk); if (dk) { c.globalCompositeOperation = 'lighter'; n1_dot(c, lampG, boat.x, A.boat.y - 6 * A.boat.s, 14 * A.boat.s, 0.5); c.globalCompositeOperation = 'source-over'; } });
      // surf bursting at the foot of the stacks
      A.foam.forEach(function (fb, m) { var u = ((tt * 0.3 + m * 0.37) % 1), a = Math.sin(Math.PI * Math.min(1, u * 1.6)); if (u > 0.62) return; ca.fillStyle = dk ? 'rgba(210,225,255,' + 0.45 * a + ')' : 'rgba(255,255,255,' + 0.85 * a + ')';
        for (var j = 0; j < 9; j++) { var px = fb[0] + (fb[1] - fb[0]) * (j + 0.5) / 9, hgt = (6 + hash(j + m * 9) * 16) * S * Math.sin(Math.PI * Math.min(1, u * 1.6)); ca.beginPath(); ca.arc(px, fb[2] - hgt, (0.8 + hash(j + m) * 1.6) * S + 0.6, 0, 7); ca.fill(); ca.beginPath(); ca.arc(px + 3, fb[2] - hgt * 0.5, (0.6 + hash(j + 5) * 1.2) * S + 0.6, 0, 7); ca.fill(); }
        ca.beginPath(); ca.ellipse((fb[0] + fb[1]) / 2, fb[2] - 2, (fb[1] - fb[0]) * 0.6, 4 * S + 2 * a, 0, Math.PI, 0); ca.fill(); });
      // swell lines slide along the sea, the surf and the small washes pass behind the back ridge of rocks
      n1_occl(ca, masks, function (ca) {
        ca.lineWidth = 1.6; ca.lineCap = 'round'; for (i = 0; i < 5; i++) { var y = A.hz + 10 + Math.pow((i + 0.5) / 5, 1.5) * (sh - A.hz - 14), al = dk ? 0.25 : 0.5; ca.strokeStyle = dk ? 'rgba(170,200,240,' + al + ')' : 'rgba(255,255,255,' + al + ')';
          for (var x0 = -80 + ((tt * (8 + i * 3) + i * 97) % 160); x0 < W + 80; x0 += 160) { var w2 = (24 + i * 8) * S; ca.beginPath(); ca.moveTo(x0 - w2, y); ca.quadraticCurveTo(x0, y - 3, x0 + w2, y); ca.stroke(); } }
        ca.strokeStyle = dk ? 'rgba(200,225,255,0.55)' : 'rgba(255,255,255,0.85)'; ca.lineWidth = 3 * S + 1; ca.beginPath(); for (x = -10; x <= W + 10; x += 12) { var sy = sh - 6 + Math.sin(x / 40 + tt * 1.3) * 2.5 + Math.sin(x / 13 + tt * 2.1) * 1.2; if (x === -10) ca.moveTo(x, sy); else ca.lineTo(x, sy); } ca.stroke();
        if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; for (i = 0; i < (ph ? 10 : 22); i++) { var bx = (hash(i + 7) * W + tt * 14 * (i % 2 ? 1 : -1)) % W, a2 = Math.pow(Math.max(0, Math.sin(tt * 2.3 + i * 1.9)), 3); if (bx < 0) bx += W; n1_dot(ca, sparkG, bx, sh - 6 + Math.sin(bx / 40 + tt * 1.3) * 2.5, 7, a2 * 0.8); } ca.restore(); }
        // a small wash runs sideways along the top of the shelf
        if (wash) { var T = t - wash.t0, fr = n1_ease(Math.min(1, T / 2.4)), al3 = T < 2.4 ? 1 : 1 - n1_ease((T - 2.4) / 2.1), xa = wash.dir > 0 ? -20 : W + 20, xf = xa + wash.dir * (W + 40) * fr, yb = sh + wash.d;
          ca.globalAlpha = al3; ca.fillStyle = dk ? 'rgba(90,150,210,0.26)' : 'rgba(120,210,235,0.34)'; ca.beginPath(); ca.moveTo(xa, sh - 8); ca.lineTo(xf, sh - 8);
          for (var yy = sh - 8; yy <= yb; yy += 6) ca.lineTo(xf + wash.dir * Math.sin(yy / 9 + T * 4) * 6, yy); ca.lineTo(xa, yb); ca.fill();
          ca.strokeStyle = dk ? 'rgba(200,230,255,0.6)' : 'rgba(255,255,255,0.9)'; ca.lineWidth = 2.6; ca.beginPath(); ca.moveTo(xa, yb); for (x = xa; wash.dir > 0 ? x <= xf : x >= xf; x += wash.dir * 16) ca.lineTo(x, yb + Math.sin(x / 50 + T * 2) * 3); ca.stroke(); ca.globalAlpha = 1; }
      });
      // the pools: floors, then clear water with depth, then the life in them
      under.forEach(function (q) { ca.fillStyle = q[1]; ca.fill(q[0]); });
      Pl.forEach(function (p, k) { ca.save(); poolClip(ca, k); ca.save(); ca.translate(p.cx, p.cy); ca.scale(p.rx, p.ry); ca.fillStyle = grads[p.ty]; ca.fillRect(-1.3, -1.3, 2.6, 2.6); ca.restore();
        // the darker back wall under the far rim
        ca.fillStyle = dk ? 'rgba(10,20,40,0.35)' : 'rgba(20,70,90,0.22)'; n1_ell(ca, p.cx, p.cy - p.ry * 1.05, p.rx * 1.05, p.ry * 0.35); ca.fill();
        A.kelp.forEach(function (q) { if (q.pool !== k) return; var Lp = [], Rp = []; for (var j = 0; j <= 12; j++) { var u = j / 12, cx2 = q.x + Math.sin(tt * 1.1 + q.ph + u * 4) * 9 * u * S + u * q.L * 0.9, cy2 = q.y - u * q.L * 0.45 + Math.sin(tt * 0.8 + u * 5 + q.ph) * 3 * u, w = (2 + 5 * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.1))) * S * (1 + 0.25 * Math.sin(u * 9 + tt * 2)); Lp.push([cx2, cy2 - w]); Rp.unshift([cx2, cy2 + w]); }
          ca.fillStyle = p.ty === 'grass' ? (dk ? 'rgba(90,170,110,0.7)' : 'rgba(80,190,100,0.85)') : (dk ? 'rgba(170,140,70,0.7)' : 'rgba(196,150,46,0.85)'); ca.beginPath(); Lp.concat(Rp).forEach(function (pp, j) { if (j) ca.lineTo(pp[0], pp[1]); else ca.moveTo(pp[0], pp[1]); }); ca.closePath(); ca.fill();
          ca.strokeStyle = dk ? 'rgba(220,190,110,0.45)' : 'rgba(255,240,170,0.7)'; ca.lineWidth = 1.2; ca.beginPath(); Lp.forEach(function (pp, j) { var mpx = (pp[0] + Rp[12 - j][0]) / 2, mpy = (pp[1] + Rp[12 - j][1]) / 2; if (j) ca.lineTo(mpx, mpy); else ca.moveTo(mpx, mpy); }); ca.stroke(); });
        ca.restore(); });
      over.forEach(function (q) { ca.fillStyle = q[1]; ca.fill(q[0]); });
      Pl.forEach(function (p, k) { ca.save(); poolClip(ca, k);
        ca.strokeStyle = dk ? 'rgba(150,200,255,0.22)' : 'rgba(255,255,255,0.55)'; ca.lineWidth = 1.3; var nl = Math.max(2, Math.round(p.rx / 30)); for (var m = 0; m < nl; m++) { var yy2 = p.cy - p.ry * 0.7 + (m + 0.5) / nl * p.ry * 1.4, xx = p.cx + Math.sin(tt * 0.3 + m * 2.1 + k) * p.rx * 0.5, ww2 = p.rx * 0.15; ca.beginPath(); ca.moveTo(xx - ww2, yy2); ca.quadraticCurveTo(xx, yy2 - 2.5, xx + ww2, yy2); ca.stroke(); }
        minnows.forEach(function (mn) { if (mn.p !== p) return; var u = tt * mn.sp + mn.ph, mx = p.cx + Math.sin(u) * p.rx * 0.6, my = p.cy + mn.dy * p.ry + Math.sin(u * 2.3) * 1.5; n1_minnow(ca, mx, my, (ph ? 0.6 : 0.85) * S, Math.cos(u) > 0 ? 1 : -1, tt + mn.ph, mn.col); });
        if (k === 0) { ca.fillStyle = 'rgba(20,40,50,0.18)'; n1_ell(ca, fish.x + 3, fish.y + 5, 14 * S, 4 * S); ca.fill(); n1_sculpin(ca, fish.x, fish.y + Math.sin(tt * 0.7) * 1.5, (ph ? 0.8 : 1.15) * S, fish.dir, tt, fish.mv); }
        ca.restore(); });
      an.forEach(function (q) { if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; n1_dot(ca, glowG, q.x, q.y, q.r * 1.4, 0.12 * q.o); ca.restore(); } n1_anemone(ca, q.x, q.y, q.r, q.c, Math.max(0, q.o) * (0.92 + 0.08 * Math.sin(tt * 0.9 + q.ph)), tt, q.ph, dk); });
      // the lighthouse: a soft lamp by day; at night its beam sweeps from side to side
      var L = A.lh, ph2 = tt * 0.7;
      cb.save(); cb.globalCompositeOperation = 'lighter';
      if (dk) { var cs = Math.cos(ph2), face = Math.max(0, Math.sin(ph2)), len = W * (ph ? 0.9 : 0.55) * Math.abs(cs), spr = (10 + 40 * (1 - Math.abs(cs))) * S;
        if (len > 10) { var g = cb.createLinearGradient(L.x, L.y, L.x + cs * len, L.y); g.addColorStop(0, 'rgba(255,236,170,0.5)'); g.addColorStop(1, 'rgba(255,236,170,0)'); cb.fillStyle = g; cb.beginPath(); cb.moveTo(L.x, L.y - 3 * L.s); cb.lineTo(L.x + cs * len, L.y - spr); cb.lineTo(L.x + cs * len, L.y + spr); cb.lineTo(L.x, L.y + 3 * L.s); cb.fill(); }
        n1_dot(cb, lampG, L.x, L.y, (16 + face * 40) * L.s, 0.7 + face * 0.3); }
      else n1_dot(cb, lampG, L.x, L.y, 10 * L.s, 0.35 + 0.15 * Math.sin(tt * 2));
      cb.restore();
      var Cr = A.crab, cu = (tt * 0.05) % 2, cx3 = Cr.x0 + (Cr.x1 - Cr.x0) * (cu < 1 ? n1_ease(cu) : 1 - n1_ease(cu - 1)), walk = Math.abs(Math.sin(tt * 0.05 * Math.PI)) > 0.15;
      n1_crab(cb, cx3, Cr.y, (ph ? 0.8 : 1.2) * S, tt, walk, big && t - big.t0 > 3.2);
      sparks.forEach(function (s) { var k2 = (t - s.t0) / 0.9, d = 6 + k2 * 26 * S; cb.fillStyle = s.c; cb.globalAlpha = 1 - k2; var x = s.x + Math.cos(s.a) * d, y = s.y + Math.sin(s.a) * d * 0.7, r = (3.5 - k2 * 2) * S + 1; cb.beginPath(); cb.moveTo(x, y - r * 1.6); cb.lineTo(x + r * 0.4, y - r * 0.4); cb.lineTo(x + r * 1.6, y); cb.lineTo(x + r * 0.4, y + r * 0.4); cb.lineTo(x, y + r * 1.6); cb.lineTo(x - r * 0.4, y + r * 0.4); cb.lineTo(x - r * 1.6, y); cb.lineTo(x - r * 0.4, y - r * 0.4); cb.fill(); }); cb.globalAlpha = 1;
      // the big wave: sweeps sideways across the shelf, then drains away
      if (big) { var T2 = t - big.t0, dir = big.dir, top = sh - 14, fr2 = n1_ease(Math.min(1, T2 / 1.6)), xa2 = dir > 0 ? -40 : W + 40, front = xa2 + dir * (W + 80) * fr2, al2 = T2 < 2.4 ? 1 : Math.max(0, 1 - (T2 - 2.4) / 1.3);
        if (al2 > 0) { var edge = function (y) { return front + dir * (Math.sin(y / 40 + T2 * 4) * 12 + Math.sin(y / 17 + T2 * 7) * 4) * S; };
          cb.fillStyle = dk ? 'rgba(50,120,190,' + (0.4 * al2) + ')' : 'rgba(70,185,225,' + (0.42 * al2) + ')'; cb.beginPath(); cb.moveTo(xa2, top); for (var y4 = top; y4 <= H + 10; y4 += 12) cb.lineTo(edge(y4), y4); cb.lineTo(xa2, H + 10); cb.fill();
          cb.save(); cb.beginPath(); cb.moveTo(xa2, top); for (y4 = top; y4 <= H + 10; y4 += 12) cb.lineTo(edge(y4), y4); cb.lineTo(xa2, H + 10); cb.clip(); cb.strokeStyle = dk ? 'rgba(170,220,255,' + (0.3 * al2) + ')' : 'rgba(255,255,255,' + (0.5 * al2) + ')'; cb.lineWidth = 2;
          for (i = 0; i < (ph ? 14 : 26); i++) { var lx = (hash(i + 101) * W + T2 * 60 * dir + W * 2) % W, ly = top + 20 + hash(i + 111) * (H - top), lw = (30 + hash(i + 121) * 60) * S; cb.beginPath(); cb.moveTo(lx - lw, ly); cb.quadraticCurveTo(lx, ly - 6 - Math.sin(T2 * 3 + i) * 4, lx + lw, ly); cb.stroke(); } cb.restore();
          cb.strokeStyle = dk ? 'rgba(210,240,255,' + (0.7 * al2) + ')' : 'rgba(255,255,255,' + (0.95 * al2) + ')'; cb.lineWidth = 6 * S + 2; cb.lineCap = 'round'; cb.beginPath(); for (y4 = top; y4 <= H + 10; y4 += 12) { if (y4 === top) cb.moveTo(edge(y4), y4); else cb.lineTo(edge(y4), y4); } cb.stroke();
          cb.fillStyle = dk ? 'rgba(220,245,255,' + (0.6 * al2) + ')' : 'rgba(255,255,255,' + (0.85 * al2) + ')'; for (i = 0; i < (ph ? 30 : 60); i++) { var by2 = top + hash(i + 51) * (H - top), bx2 = edge(by2) + dir * (6 + hash(i + 61) * 40 * S); cb.beginPath(); cb.arc(bx2, by2, (1 + hash(i + 71) * 3) * S + 0.5, 0, 7); cb.fill(); }
          if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; for (i = 0; i < (ph ? 16 : 34); i++) { var sy2 = top + hash(i + 91) * (H - top), sx2 = xa2 + (front - xa2) * hash(i + 81); n1_dot(cb, sparkG, sx2, sy2, 8, al2 * 0.7 * Math.pow(Math.abs(Math.sin(tt * 3 + i * 1.3)), 2)); } cb.restore(); } } }
    },
    finish: function (t) { var dir = Math.random() < 0.5 ? 1 : -1; big = {t0: t, dir: dir, order: an.slice().sort(function (a, b) { return (a.x - b.x) * dir; })}; wash = null; an.forEach(function (q) { q.pop = 0; }); }
  };
};

UIC.tidepool = {L: ['#2F7A8E', '#1D5466', 'rgba(255,255,255,0.84)', '#132B33', '#4E6870', '#C2486E', '#C2486E', '#D9685A', '#FFFFFF'], D: ['#22385A', '#121F36', 'rgba(18,30,52,0.78)', '#EAF2FA', '#A6B6CC', '#7FE0F0', '#7FE0F0', '#B8A0FF', '#0E1A2E']};

// ---------- Volcano Island: a soft plume puffs from the crater, steam vents hiss, palm fronds sway, waves lap the black sand.
// Night: slow lava glows in rivers down the slope and lights the clouds orange.
// Moment: the volcano gives a tiny happy burp of sparks; where they land, tropical flowers pop up along the slope.
function n1_flower(c, x, y, r, k, sc, t) { if (sc <= 0) return; var C = [['#FF4F6E', '#FFD45A'], ['#FFFFFF', '#FFC93A'], ['#FF8A3A', '#FFE07A'], ['#C77DFF', '#FFE6F0'], ['#FF7FB8', '#FFF0A0']][k % 5];
  c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(k * 1.3 + Math.sin(t * 0.8 + k) * 0.08);
  c.fillStyle = '#3E8A4A'; n1_ell(c, -r * 0.9, r * 0.6, r * 0.8, r * 0.32, 0.5); c.fill(); n1_ell(c, r * 0.9, r * 0.7, r * 0.8, r * 0.32, -0.5); c.fill();
  c.fillStyle = C[0]; for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; n1_ell(c, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.62, r * 0.42, a); c.fill(); }
  c.fillStyle = C[1]; c.beginPath(); c.arc(0, 0, r * 0.3, 0, 7); c.fill(); c.restore(); }
ENGINES.volcano = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Cr = A.crater, i;
  var puffG = n1_rg(dk ? 'rgba(110,70,90,0.7)' : 'rgba(250,246,242,0.92)', [0.55, 0.5]), shadeG = n1_rg(dk ? 'rgba(40,20,40,0.5)' : 'rgba(170,150,150,0.35)', [0.5, 0.4]), lavaG = n1_rg('rgba(255,120,40,0.65)', [0.3, 0.3]), hotG = n1_rg('rgba(255,170,80,0.6)', [0.35, 0.3]), sparkG = n1_rg('rgba(255,220,120,0.9)', [0.25, 0.4]), emberG = n1_rg('rgba(255,120,40,0.95)', [0.35, 0.55]), steamG = n1_rg(dk ? 'rgba(230,200,210,0.5)' : 'rgba(255,255,255,0.85)', [0.5, 0.45]);
  var puffs = [], lastPuff = -1, wisps = [], fronds = {}, sparks = [], flowers = [], burp = null, rmask = new Path2D(A.rmask);
  function frondPath(L) { var k = Math.round(L); return fronds[k] || (fronds[k] = new Path2D(n1_frond(0, 0, 0, L, 0.9))); }
  var vents = A.vents.map(function (p, j) { return {x: p[0], y: p[1], next: 1 + j * 2.3, burst: -9}; });
  var lavaLen = A.lava.map(function (pts) { var L = 0; for (var j = 1; j < pts.length; j++) L += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); return L; });
  function along(pts, u) { var f = u * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(f)), r = f - j; return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * r, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * r]; }
  return {
    step: function (dt, t, f) {
      if (t - lastPuff > (burp && t - burp.t0 < 1 ? 0.12 : 0.42)) { lastPuff = t; puffs.push({t0: t, x: Cr[0] + (Math.random() - 0.5) * Cr[2] * 0.8, vx: (6 + Math.random() * 6) * S, vy: (16 + Math.random() * 8) * S, r: (6 + Math.random() * 5) * S, life: 8 + Math.random() * 3, ph: Math.random() * 6.28}); }
      puffs = puffs.filter(function (q) { return t - q.t0 < q.life; });
      vents.forEach(function (vt) { vt.next -= dt * f.s; if (vt.next <= 0) { vt.next = 4 + Math.random() * 5; vt.burst = t; } if (Math.random() < dt * (t - vt.burst < 1.2 ? 14 : 2.2)) wisps.push({x: vt.x + (Math.random() - 0.5) * 6, y: vt.y, t0: t, b: t - vt.burst < 1.2 ? 1 : 0, ph: Math.random() * 6.28}); });
      wisps = wisps.filter(function (q) { return t - q.t0 < 2.6; });
      sparks.forEach(function (s) { if (!s.done && t - s.t0 >= s.dur) { s.done = 1; flowers.push({x: s.tx, y: s.ty, t0: t, k: s.k, r: (ph ? 6 : 9) * S * (0.8 + Math.random() * 0.4)}); if (flowers.length > 46) flowers.shift(); } });
      sparks = sparks.filter(function (s) { return !s.done; }); flowers = flowers.filter(function (q) { return t - q.t0 < 40; });
      if (burp && t - burp.t0 > 8) burp = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i, j;
      // lava rivers glowing at night
      if (dk) { ca.save(); ca.lineCap = 'round'; ca.lineJoin = 'round'; A.lava.forEach(function (pts, k) { ca.strokeStyle = 'rgba(255,110,40,0.85)'; ca.lineWidth = (ph ? 2 : 3.2) * S + 0.6; ca.beginPath(); pts.forEach(function (p, m) { if (m) ca.lineTo(p[0], p[1]); else ca.moveTo(p[0], p[1]); }); ca.stroke();
          ca.globalCompositeOperation = 'lighter'; for (j = 0; j < 7; j++) { var u = ((tt * 0.035 + j / 7 + k * 0.13) % 1), p = along(pts, u); n1_dot(ca, lavaG, p[0], p[1], (10 + 6 * Math.sin(tt + j)) * S, 0.8 * (1 - u * 0.5)); ca.fillStyle = 'rgba(255,230,140,' + (0.9 * (1 - u * 0.6)) + ')'; ca.beginPath(); ca.arc(p[0], p[1], 1.6 * S + 0.5, 0, 7); ca.fill(); } ca.globalCompositeOperation = 'source-over'; });
        ca.globalCompositeOperation = 'lighter'; n1_dot(ca, hotG, Cr[0], Cr[1], Cr[2] * 2.4, 0.6 + 0.2 * Math.sin(tt * 1.3)); for (j = 0; j < 6; j++) n1_dot(ca, lavaG, Cr[0] + Math.sin(tt * 0.3 + j) * 30 * S, A.hz + 6 + j * j * 3, (30 + j * 8) * S, 0.25, 0.12); ca.restore(); }
      // the plume
      puffs.forEach(function (q) { var k = (t - q.t0) / q.life, x = q.x + q.vx * (t - q.t0) + Math.sin(tt * 0.5 + q.ph) * 6 * k, y = Cr[1] - q.vy * (t - q.t0) * (1 - k * 0.35), r = q.r * (1 + k * 5), al = Math.min(1, k * 6) * (1 - k);
        n1_dot(ca, shadeG, x + r * 0.15, y + r * 0.2, r, al * 0.8); n1_dot(ca, puffG, x, y, r, al);
        if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; n1_dot(ca, hotG, x, y + r * 0.3, r * 0.9, al * Math.max(0, 0.7 - k)); ca.restore(); } });
      // steam vents
      wisps.forEach(function (q) { var k = (t - q.t0) / 2.6; n1_dot(ca, steamG, q.x + Math.sin(k * 5 + q.ph) * 4 + k * 10 * S, q.y - k * (q.b ? 60 : 34) * S, (3 + k * (q.b ? 14 : 9)) * S, (q.b ? 0.9 : 0.6) * Math.sin(Math.PI * k)); });
      // a little outrigger canoe sails slowly across, and two frigatebirds circle the island
      var cu = ((tt / (ph ? 70 : 110)) + 0.35) % 1, cxp = -60 + (W + 120) * cu, cyp = A.hz + (A.beach[0][1] - A.hz) * 0.42, cs = (ph ? 0.85 : 1.35) * S, bob = Math.sin(tt * 1.6) * 1.2;
      ca.save(); ca.translate(cxp, cyp + bob); ca.scale(cs, cs); ca.rotate(Math.sin(tt * 1.6 + 1) * 0.03);
      ca.fillStyle = dk ? 'rgba(255,170,140,0.25)' : 'rgba(255,255,255,0.5)'; n1_ell(ca, 0, 3, 30, 2.4); ca.fill();
      ca.strokeStyle = dk ? '#2A1A24' : '#5A3A28'; ca.lineWidth = 1.6; ca.beginPath(); ca.moveTo(-8, 0); ca.lineTo(-6, 7); ca.moveTo(8, 0); ca.lineTo(6, 7); ca.stroke();
      ca.fillStyle = dk ? '#3A2430' : '#7A4E32'; n1_ell(ca, -1, 8, 16, 1.6); ca.fill();
      ca.fillStyle = dk ? '#4A2E36' : '#8E5A36'; ca.beginPath(); ca.moveTo(-24, -2); ca.quadraticCurveTo(0, 5, 24, -2); ca.lineTo(20, 2); ca.quadraticCurveTo(0, 6, -20, 2); ca.closePath(); ca.fill();
      ca.strokeStyle = dk ? '#2A1A24' : '#5A3A28'; ca.lineWidth = 1.4; ca.beginPath(); ca.moveTo(2, 0); ca.lineTo(4, -30); ca.stroke();
      ca.fillStyle = dk ? '#C88A7A' : '#FFE6C0'; ca.beginPath(); ca.moveTo(4, -32); ca.quadraticCurveTo(18, -18, 16, -2); ca.lineTo(5, -1); ca.closePath(); ca.fill();
      ca.fillStyle = dk ? '#B0503E' : '#E8603A'; ca.beginPath(); ca.moveTo(4.5, -24); ca.quadraticCurveTo(14, -15, 13.4, -9); ca.lineTo(5.2, -9); ca.closePath(); ca.fill();
      ca.restore();
      ca.strokeStyle = dk ? 'rgba(255,220,210,0.55)' : 'rgba(60,40,50,0.6)'; ca.lineWidth = 1.5; ca.lineCap = 'round'; ca.beginPath();
      for (var bi = 0; bi < 2; bi++) { var ba = tt * (0.11 + bi * 0.03) + bi * 2.4, bx2 = Cr[0] + Math.cos(ba) * W * (0.16 + bi * 0.05), by2 = Cr[1] - H * (0.08 + bi * 0.04) + Math.sin(ba) * H * 0.04, bs = (9 + bi * 2) * S + 2, bf = Math.sin(tt * 2 + bi) * 0.25;
        ca.moveTo(bx2 - bs, by2 - bs * (0.25 + bf)); ca.quadraticCurveTo(bx2 - bs * 0.45, by2 - bs * 0.35, bx2, by2); ca.quadraticCurveTo(bx2 + bs * 0.45, by2 - bs * 0.35, bx2 + bs, by2 - bs * (0.25 + bf)); }
      ca.stroke();
      // waves lapping the black sand: they wash around the beach rocks, not over them
      var B = A.beach; n1_occl(ca, rmask, function (ca) { for (var w = 0; w < 2; w++) { var u2 = ((tt / 5.5) + w * 0.5) % 1, k2 = u2 < 0.45 ? n1_ease(u2 / 0.45) : 1 - n1_ease((u2 - 0.45) / 0.55), d = H * (ph ? 0.025 : 0.035) * k2 * (w ? 0.6 : 1);
        ca.fillStyle = dk ? 'rgba(120,70,110,' + (0.35 * k2) + ')' : 'rgba(120,215,215,' + (0.55 * k2) + ')'; ca.beginPath(); ca.moveTo(B[0][0], B[0][1] - 4); B.forEach(function (p) { ca.lineTo(p[0], p[1] + d + Math.sin(p[0] / 40 + tt) * 2); }); ca.lineTo(B[B.length - 1][0], B[B.length - 1][1] - 4); ca.fill();
        ca.strokeStyle = dk ? 'rgba(255,200,190,' + (0.55 * k2) + ')' : 'rgba(255,255,255,' + (0.95 * k2) + ')'; ca.lineWidth = 2.4 * S + 0.6; ca.beginPath(); B.forEach(function (p, m) { var yy = p[1] + d + Math.sin(p[0] / 40 + tt) * 2; if (m) ca.lineTo(p[0], yy); else ca.moveTo(p[0], yy); }); ca.stroke();  } });
      ca.strokeStyle = dk ? 'rgba(255,190,170,0.4)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1.6; for (i = 0; i < 4; i++) { var u3 = ((tt * 0.07 + i / 4) % 1), yy3 = A.hz + 8 + Math.pow(u3, 1.5) * (B[0][1] - A.hz - 14); ca.globalAlpha = Math.sin(Math.PI * u3); ca.beginPath(); for (var x = -10; x <= W + 10; x += 24) { var y4 = yy3 + Math.sin(x / 60 + i * 3 + tt * 0.5) * 2; if (x === -10) ca.moveTo(x, y4); else ca.lineTo(x, y4); } ca.stroke(); } ca.globalAlpha = 1;
      // flowers that sprang up where the sparks landed
      flowers.forEach(function (q) { var k = (t - q.t0) / 0.45, sc = (k >= 1 ? 1 : n1_ease(k) * (1 + 0.35 * Math.sin(Math.PI * k))) * (1 - n1_ease((t - q.t0 - 36) / 4)); n1_flower(ca, q.x, q.y, q.r, q.k, sc, tt); });
      // the burp: a puff ring and sparks arcing out
      if (burp) { var T = t - burp.t0; if (T < 1.6) { var kk = T / 1.6; ca.strokeStyle = dk ? 'rgba(255,200,150,' + (0.8 * (1 - kk)) + ')' : 'rgba(255,255,255,' + (0.9 * (1 - kk)) + ')'; ca.lineWidth = (6 - kk * 4) * S + 1; n1_ell(ca, Cr[0], Cr[1] - kk * 50 * S, Cr[2] * (0.6 + kk * 1.4), Cr[2] * (0.25 + kk * 0.5)); ca.stroke(); } }
      cb.save(); if (dk) cb.globalCompositeOperation = 'lighter';
      sparks.forEach(function (s) { var u = Math.max(0, (t - s.t0) / s.dur); if (u <= 0) return; for (var m = 0; m < 5; m++) { var uu = Math.max(0, u - m * 0.025), x = Cr[0] + (s.tx - Cr[0]) * uu, y = Cr[1] + (s.ty - Cr[1]) * uu - Math.sin(Math.PI * uu) * s.h; n1_dot(cb, dk ? sparkG : emberG, x, y, (8 - m) * S + 1, (1 - m * 0.18) * 0.95); if (!m) { cb.fillStyle = dk ? '#FFF4C0' : '#FFF6D0'; cb.beginPath(); cb.arc(x, y, 2.2 * S + 0.6, 0, 7); cb.fill(); } } });
      cb.restore();
      // palm crowns swaying over everything
      A.crowns.forEach(function (c, k) { var sw = Math.sin(tt * 0.8 + c.ph) * 0.05 + Math.sin(tt * 1.9 + c.ph * 2) * 0.015; cb.fillStyle = dk ? '#1E3A2A' : '#3E8A44';
        [-2.9, -2.5, -2.05, -1.6, -1.15, -0.7, -0.25, 0.25, 2.85].forEach(function (a, m) { var aa = a + sw * (1 + m * 0.1), L = c.L * (0.85 + (m % 3) * 0.1), left = Math.cos(a) < 0;   /* which way a frond curls comes from where it grows, not its sway, so the top frond never flips side to side */ cb.save(); cb.translate(c.x, c.y); if (left) { cb.scale(-1, 1); aa = Math.PI - aa; } cb.rotate(aa); cb.fillStyle = m % 2 ? (dk ? '#1E3A2A' : '#3E8A44') : (dk ? '#284A34' : '#56A64E'); cb.fill(frondPath(L)); cb.restore(); });
        cb.fillStyle = dk ? '#3A2A22' : '#7A5432'; [[-5, 6], [4, 7], [0, 11]].forEach(function (q) { cb.beginPath(); cb.arc(c.x + q[0] * S, c.y + q[1] * S, 5 * S + 1, 0, 7); cb.fill(); }); });
      // at night the clouds near the summit glow orange from below
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; n1_dot(cb, hotG, Cr[0] + 20 * S, Cr[1] - 70 * S, 140 * S, 0.22 + 0.06 * Math.sin(tt * 0.7), 0.5); cb.restore(); }
    },
    finish: function (t) { burp = {t0: t};
      var spots = A.spots.slice().sort(function () { return Math.random() - 0.5; }).slice(0, ph ? 9 : 14);
      spots.forEach(function (p, j) { sparks.push({t0: t + 0.2 + j * 0.07, dur: 1.1 + Math.random() * 0.7, tx: p[0], ty: p[1], h: (60 + Math.random() * 70) * S, k: j}); }); }
  };
};

UIC.volcano = {L: ['#B8563A', '#7E3424', 'rgba(255,252,247,0.84)', '#3A1C14', '#7A5A4C', '#1E8A8C', '#1E8A8C', '#2EA2A0', '#FFFFFF'], D: ['#4A1F33', '#26142A', 'rgba(38,20,42,0.78)', '#FBEDEA', '#C8A8B0', '#FF9A5A', '#FF9A5A', '#FFC07A', '#26142A']};

// ---------- Savanna Sunset: wind sends waves through the tall grass, heat shimmers on the horizon, a giraffe munches acacia
// leaves, swallows skim the watering hole. Night: stars over the acacias, a shooting star now and then, silvered grass.
// Moment: a baby elephant walks up to the water, fills its trunk and sprays it into the air, making a rainbow.
// a giraffe browsing, facing right: hooves at 0,0, about 204 units from the hooves up to the mouth (local units, scaled by s).
// Built so every part overlaps the next: legs tuck up into the body, the neck grows out of the shoulders, the head sits over the neck top.
function n1_giraffe(c, x, y, s, t, chew, reach, dk) { c.save(); c.translate(x, y); c.scale(s, s);
  var base = dk ? '#9A7A70' : '#F2C46A', baseD = dk ? '#806462' : '#DDA954', spot = dk ? '#6A4A50' : '#C2783A', spotD = dk ? '#5A4048' : '#A9662F', dark = dk ? '#4A3038' : '#8A5A30', hoof = dk ? '#3A2830' : '#5A3A2A', belly = dk ? '#B4968C' : '#FAE0A8';
  function band(pts, ws, col) { var L = [], R = []; pts.forEach(function (p, j) { var q = pts[Math.min(pts.length - 1, j + 1)], o = pts[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], dl = Math.hypot(dx, dy) || 1, w = ws[j]; L.push([p[0] - dy / dl * w, p[1] + dx / dl * w]); R.push([p[0] + dy / dl * w, p[1] - dx / dl * w]); });
    c.fillStyle = col; c.beginPath(); L.concat(R.reverse()).forEach(function (p, j) { if (j) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.fill(); }
  function leg(hx, hy, kx, ky, fx, col, far) { var m = [(kx + fx) / 2, ky / 2 - 1]; band([[hx, hy], [(hx + kx) / 2, (hy + ky) / 2], [kx, ky], m, [fx, -3]], [8.5, 6.5, 4.6, 3.8, 3.6], col);
    c.fillStyle = far ? spotD : dark; c.globalAlpha = 0.35; n1_ell(c, kx, ky, 4.4, 3.4); c.fill(); c.globalAlpha = 1;
    c.fillStyle = hoof; c.beginPath(); c.moveTo(fx - 4, -4.5); c.lineTo(fx + 4, -4.5); c.lineTo(fx + 5, 0); c.lineTo(fx - 4.4, 0); c.closePath(); c.fill(); }
  // far legs, tail, body, near legs
  leg(-30, -94, -38, -42, -31, baseD, 1); leg(20, -94, 23, -44, 21, baseD, 1);
  c.strokeStyle = baseD; c.lineWidth = 2.4; c.lineCap = 'round'; var tw = Math.sin(t * 1.3) * 3; c.beginPath(); c.moveTo(-40, -104); c.quadraticCurveTo(-49, -92, -48 + tw * 0.5, -70); c.stroke();
  c.fillStyle = dark; n1_ell(c, -48 + tw * 0.5, -66, 3, 5.5, tw * 0.03); c.fill();
  c.fillStyle = base; c.beginPath(); c.moveTo(-41, -100); c.bezierCurveTo(-43, -113, -24, -116, -4, -114); c.bezierCurveTo(12, -114, 24, -125, 36, -119); c.bezierCurveTo(47, -113, 45, -92, 32, -85); c.bezierCurveTo(14, -79, -14, -79, -30, -83); c.bezierCurveTo(-42, -87, -42, -94, -41, -100); c.closePath(); c.fill();
  c.fillStyle = belly; n1_ell(c, 2, -84.5, 24, 4.2); c.fill();
  leg(-22, -92, -29, -40, -22, base, 0); leg(27, -92, 30, -43, 28, base, 0);
  // the neck grows out of the shoulders and leans up and forward
  var a = -1.08 - reach * 0.06, Ln = 94, B = [27, -106], dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx, nl = [], nw = [];
  for (var k = 0; k <= 8; k++) { var u = k / 8, bend = Math.sin(Math.PI * u) * 3.5; nl.push([B[0] + dx * Ln * u + px * bend, B[1] + dy * Ln * u + py * bend]); nw.push(15 - 8.4 * Math.pow(u, 0.8)); }
  band(nl, nw, base);
  c.fillStyle = base; n1_ell(c, B[0] + 2, B[1] + 2, 17, 12, a + 1.2); c.fill();   // the base of the neck blends into the shoulder
  // patches
  c.fillStyle = spot; [[-28, -101, 6, 4.6, 0.3], [-14, -105, 6.4, 5, -0.2], [0, -101, 7, 5.4, 0.4], [14, -107, 6, 4.6, 0.1], [-22, -90, 5.6, 4, 0.2], [-6, -90, 6, 4.2, -0.3], [9, -92, 5.6, 4.2, 0.2], [24, -98, 5, 4.6, 0.5], [-35, -92, 3.6, 3.4, 0]].forEach(function (q) { n1_ell(c, q[0], q[1], q[2], q[3], q[4]); c.fill(); });
  for (k = 1; k < 8; k++) { var p = nl[k], w2 = nw[k]; n1_ell(c, p[0] + px * w2 * 0.25 * (k % 2 ? 1 : -1), p[1] + py * w2 * 0.25 * (k % 2 ? 1 : -1), w2 * 0.42, w2 * 0.3, a); c.fill(); }
  [[-25, -62], [-31, -66], [27, -64], [24, -70]].forEach(function (q) { n1_ell(c, q[0], q[1], 2.6, 2.2); c.fill(); });
  // mane along the back of the neck
  c.strokeStyle = dark; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); for (k = 1; k <= 8; k++) { var mp = nl[k], mw = nw[k] - 1.4; if (k === 1) c.moveTo(mp[0] - px * mw, mp[1] - py * mw); else c.lineTo(mp[0] - px * mw, mp[1] - py * mw); } c.stroke();
  // the head, tilted up into the leaves
  var T = nl[8], ha = -0.3 - reach * 0.25; c.save(); c.translate(T[0], T[1]); c.rotate(ha);
  c.strokeStyle = dark; c.lineWidth = 2.4; c.beginPath(); c.moveTo(1, -5); c.lineTo(-2, -15); c.moveTo(6, -6); c.lineTo(5.5, -16); c.stroke(); c.fillStyle = dark; c.beginPath(); c.arc(-2.2, -16, 2.4, 0, 7); c.arc(5.5, -17, 2.4, 0, 7); c.fill();
  c.fillStyle = baseD; n1_ell(c, -5, -3, 7, 2.8, -0.5); c.fill();
  c.fillStyle = base; n1_ell(c, 8, 0, 15, 8.6); c.fill();
  c.fillStyle = belly; n1_ell(c, 23, 1.6 + chew * 1.2, 8, 6.2 + chew * 0.8); c.fill();
  c.fillStyle = spot; n1_ell(c, 4, -4, 3, 2.2, 0.3); c.fill();
  c.strokeStyle = n1_INK; c.lineWidth = 1.6; c.beginPath(); c.arc(10, -1.5, 2.6, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  n1_blush(c, 14, 3, 3); c.fillStyle = n1_INK; c.beginPath(); c.arc(28.5, -0.5, 1, 0, 7); c.fill();
  c.strokeStyle = n1_INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(25, 5.5 + chew * 1.6); c.quadraticCurveTo(28, 6.5 + chew * 1.6, 30, 5 + chew); c.stroke();
  c.restore(); c.restore(); }
function n1_elephant(c, x, y, s, dir, t, walk, trunk, ear, dk) { c.save(); c.translate(x, y); c.scale(s * dir, s);
  var g = dk ? '#8A8098' : '#A9A2AE', gl = dk ? '#A49AB2' : '#C6C0CA', gd = dk ? '#6A6078' : '#8E8794', pink = dk ? '#D8A0B0' : '#F4B4BE';
  var st = walk ? Math.sin(t * 7) : 0;
  function leg(lx, ph) { c.fillStyle = gd; c.beginPath(); c.roundRect ? c.roundRect(lx - 6 + ph * 2, -24, 12, 24, 4) : c.rect(lx - 6, -24, 12, 24); c.fill(); }
  leg(14, -st); leg(-20, st); c.fillStyle = gd; c.strokeStyle = gd; c.lineWidth = 2; c.beginPath(); c.moveTo(30, -34); c.quadraticCurveTo(38, -28, 36, -18); c.stroke();
  c.fillStyle = g; n1_ell(c, 6, -34, 30, 21); c.fill(); c.fillStyle = gl; n1_ell(c, 4, -46, 20, 7); c.fill();
  c.fillStyle = g; leg(20, st); leg(-12, -st); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(14 + st * 2, -24, 12, 24, 4) : c.rect(14, -24, 12, 24); c.fill(); c.beginPath(); c.roundRect ? c.roundRect(-18 - st * 2, -24, 12, 24, 4) : c.rect(-18, -24, 12, 24); c.fill();
  // trunk: from the face, down into the water (trunk = 0), or curled up high (trunk = 1)
  var tx0 = -36, ty0 = -40, tip = [-40 - 6 * (1 - trunk) - 20 * trunk, -6 - 66 * trunk], cp = [-50 - 18 * trunk, -26 - 6 * trunk];
  c.strokeStyle = g; c.lineCap = 'round'; c.lineWidth = 10; c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(cp[0], cp[1], tip[0], tip[1]); c.stroke();
  c.strokeStyle = gd; c.lineWidth = 1.2; for (var k = 1; k < 5; k++) { var u = k / 5, px = (1 - u) * (1 - u) * tx0 + 2 * (1 - u) * u * cp[0] + u * u * tip[0], py = (1 - u) * (1 - u) * ty0 + 2 * (1 - u) * u * cp[1] + u * u * tip[1]; c.beginPath(); c.arc(px, py, 3.5, 0.3, 2.4); c.stroke(); }
  c.fillStyle = g; c.beginPath(); c.arc(-24, -46, 18, 0, 7); c.fill();
  c.fillStyle = gl; n1_ell(c, -28, -56, 9, 4.5, -0.3); c.fill();
  c.save(); c.translate(-12, -48); c.scale(0.75 + 0.25 * ear, 1); c.fillStyle = gd; n1_ell(c, 4, 2, 14, 17, 0.1); c.fill(); c.fillStyle = pink; n1_ell(c, 4, 3, 9, 12, 0.1); c.fill(); c.restore();
  c.fillStyle = n1_INK; if (trunk > 0.6 && ear > 0.5) { c.strokeStyle = n1_INK; c.lineWidth = 1.8; c.beginPath(); c.arc(-30, -48, 3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } else { c.beginPath(); c.arc(-30, -48, 2.4, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-29.2, -48.8, 0.8, 0, 7); c.fill(); }
  n1_blush(c, -34, -40, 3.5);
  c.restore(); return [x + tip[0] * s * dir, y + tip[1] * s]; }
ENGINES.savanna = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Pd = A.pond, Gf = A.giraffe, i;
  var flyG = n1_rg('rgba(255,240,170,0.7)', [0.25, 0.3]), sunG = n1_rg('rgba(255,250,220,0.6)', [0.5, 0.3]);
  var gs = (Gf.y - Gf.hy) / 204, girX = Gf.hx - 102 * gs;
  var blades = []; for (i = 0; i < (ph ? 46 : 110); i++) blades.push({x: (i + Math.random()) / (ph ? 46 : 110) * (W + 40) - 20, h: (ph ? 36 : 64) * (0.6 + Math.random() * 0.7), c: Math.random() < 0.5, ph: Math.random() * 6.28});
  var birds = []; for (i = 0; i < 2; i++) birds.push({ph: i * 3.1, sp: 0.35 + i * 0.1});
  var ripples = [], star = null, nextStar = 6, leaves = [], el = null, drops = [];
  function pondY(x) { var u = (x - Pd.x) / Pd.rx; return Math.abs(u) < 1 ? Pd.y : null; }
  return {
    step: function (dt, t, f) {
      ripples = ripples.filter(function (r) { return t - r.t0 < 1.5; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 7 + Math.random() * 9; star = {t0: t, x: W * (0.3 + Math.random() * 0.6), y: H * (0.05 + Math.random() * 0.2)}; } if (star && t - star.t0 > 1.2) star = null; }
      if (Math.random() < dt * 0.25) leaves.push({x: Gf.hx + 4 * gs, y: Gf.hy, t0: t, ph: Math.random() * 6.28}); leaves = leaves.filter(function (q) { return t - q.t0 < 4; });
      if (el) { var T = t - el.t0; if (T > 3.6 && T < 6.4 && el.tip) for (var k = 0; k < 3; k++) if (Math.random() < dt * 40) drops.push({x: el.tip[0], y: el.tip[1], vx: (90 + Math.random() * 130) * S * (ph ? 0.8 : 1.3), vy: (-280 - Math.random() * 130) * S * (ph ? 0.8 : 1.25), t0: t});
        if (T > 16) el = null; }
      drops.forEach(function (d) { d.vy += 520 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (!d.hit && d.vy > 0 && d.y > Pd.y - 2 && pondY(d.x) !== null) { d.hit = 1; ripples.push({x: d.x, y: Pd.y + (Math.random() - 0.5) * Pd.ry, t0: t, r: 8}); } });
      drops = drops.filter(function (d) { return !d.hit && d.y < H + 20; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i;
      // heat shimmer on the horizon and the glow of the big sun
      if (!dk) { ca.lineWidth = 1.4; for (i = 0; i < 6; i++) { var y = A.hz - 8 + i * 4; ca.strokeStyle = 'rgba(255,250,230,' + (0.35 - i * 0.04) + ')'; ca.beginPath(); for (var x = -10; x <= W + 10; x += 14) { var yy = y + Math.sin(x / 26 + tt * 2.4 + i) * 1.4; if (x === -10) ca.moveTo(x, yy); else ca.lineTo(x, yy); } ca.stroke(); }
        if (A.sun) { ca.save(); ca.globalCompositeOperation = 'lighter'; n1_dot(ca, sunG, A.sun[0], A.sun[1], A.sun[2] * (1.4 + 0.05 * Math.sin(tt)), 0.35); ca.restore(); } }
      // a skein of birds crosses the sky now and then, high above the plain
      var fu = (tt / 46) % 1; if (fu < 0.62) { var fx0 = -80 + (W + 160) * fu / 0.62, fy0 = H * (ph ? 0.2 : 0.16) + Math.sin(fu * 6) * 10; ca.strokeStyle = dk ? 'rgba(240,226,236,0.6)' : 'rgba(90,52,40,0.55)'; ca.lineWidth = 1.5; ca.lineCap = 'round'; ca.beginPath();
        for (var fb = 0; fb < 7; fb++) { var row = Math.ceil(fb / 2), sd2 = fb % 2 ? 1 : -1, bx3 = fx0 - row * 16 * S, by3 = fy0 + sd2 * row * 9 * S, bs3 = (5.5 - row * 0.4) * S + 1.5, bf3 = Math.sin(tt * 5 + fb) * 0.5; ca.moveTo(bx3 - bs3, by3 - bs3 * (0.3 + bf3 * 0.4)); ca.quadraticCurveTo(bx3 - bs3 * 0.4, by3 - bs3 * 0.4, bx3, by3); ca.quadraticCurveTo(bx3 + bs3 * 0.4, by3 - bs3 * 0.4, bx3 + bs3, by3 - bs3 * (0.3 + bf3 * 0.4)); }
        ca.stroke(); }
      // a traveling gust brightens the grass
      var gx = ((tt * 60) % (W + 600)) - 300; ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n1_dot(ca, n1_rg(dk ? 'rgba(200,190,230,0.18)' : 'rgba(255,240,180,0.45)'), gx, A.gy + (H - A.gy) * 0.4, 260 * S, 0.8, 0.3); ca.restore();
      // ripples on the watering hole
      ripples.forEach(function (r) { var k = (t - r.t0) / 1.5; ca.strokeStyle = dk ? 'rgba(220,210,255,' + 0.6 * (1 - k) + ')' : 'rgba(255,255,255,' + 0.8 * (1 - k) + ')'; ca.lineWidth = 1.2; n1_ell(ca, r.x, r.y, 2 + k * r.r * 2 * S + 2, (2 + k * r.r * 2 * S) * 0.3); ca.stroke(); });
      var sh = Math.sin(tt * 0.6) * 0.5 + 0.5; ca.strokeStyle = dk ? 'rgba(220,210,255,0.3)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 1.4; for (i = 0; i < 3; i++) { var lx = Pd.x - Pd.rx * 0.5 + i * Pd.rx * 0.45 + Math.sin(tt * 0.4 + i) * 10, ly = Pd.y - Pd.ry * 0.2 + i * Pd.ry * 0.25; ca.beginPath(); ca.moveTo(lx - 14 * S, ly); ca.lineTo(lx + 14 * S, ly); ca.stroke(); }
      // the giraffe browsing the near acacia: it stands behind the tree and the tall grass, so it is drawn under them
      var chew = Math.max(0, Math.sin(tt * 5)) * (Math.sin(tt * 0.5) > -0.6 ? 1 : 0), reach = 0.5 + 0.5 * Math.sin(tt * 0.35);
      n1_giraffe(ca, girX, Gf.y, gs, tt, chew, reach, dk);
      // swallows skimming the water
      ca.strokeStyle = dk ? '#C8C0E0' : '#3A3036'; ca.lineWidth = 1.8; ca.lineCap = 'round';
      birds.forEach(function (b, k) { var a = tt * b.sp + b.ph, x = Pd.x + Math.sin(a) * Pd.rx * 1.3, y = Pd.y - Pd.ry * 1.2 - Math.abs(Math.cos(a * 2)) * H * 0.08, fl = Math.sin(tt * 9 + k) * 3, s = 7 * S + 2, dir = Math.cos(a) > 0 ? 1 : -1;
        if (Math.abs(Math.cos(a * 2)) < 0.05 && Math.random() < 0.3) ripples.push({x: x, y: Pd.y, t0: t, r: 6});
        ca.beginPath(); ca.moveTo(x - s, y - 2 - fl); ca.quadraticCurveTo(x - s * 0.3, y - 3, x, y); ca.quadraticCurveTo(x + s * 0.3, y - 3, x + s, y - 2 - fl); ca.moveTo(x - dir * 2, y); ca.lineTo(x - dir * s * 0.8, y + 3); ca.stroke(); });
      // the baby elephant moment: it walks along the near bank, behind the acacia trunk and the tall grass (so it is drawn under them)
      if (el) { var T = t - el.t0, es = (ph ? 0.85 : 1.6) * S, xe = Pd.x - Pd.rx - 30 * es, x0 = -90 * es, ex, walk = false, dir = -1, trunk = 0.35, ear = 0.4 + 0.1 * Math.sin(tt * 2);
        if (T < 2.4) { ex = x0 + (xe - x0) * n1_ease(T / 2.4); walk = true; }
        else if (T < 12) { ex = xe; if (T < 3.0) trunk = 0.35 - 0.35 * n1_ease((T - 2.4) / 0.6); else if (T < 3.6) trunk = n1_ease((T - 3.0) / 0.6); else if (T < 7) { trunk = 1; ear = 0.5 + 0.5 * Math.abs(Math.sin((T - 3.6) * 6)); } else trunk = 1 - 0.65 * n1_ease((T - 7) / 1); }
        else { ex = xe + (x0 - xe) * n1_ease((T - 12) / 4); walk = true; dir = 1; }
        if (T > 2.6 && T < 3.1 && Math.random() < 0.3) ripples.push({x: xe + 44 * es, y: Pd.y, t0: t, r: 7});
        el.tip = n1_elephant(ca, ex, Pd.y + Pd.ry * 0.6, es, dir, tt, walk, trunk, ear, dk);
        // spray and the rainbow in it
        var rk = n1_env(T, 3.9, 4.8, 7.4, 9.5); if (rk > 0) { var rcx = xe + 120 * es, rcy = Pd.y - 16 * es, R0 = 92 * es, bw = 5 * es; ca.save(); ca.globalAlpha = rk * (dk ? 0.35 : 0.55); ca.lineWidth = bw; ['#FF6A6A', '#FFA94A', '#FFE05A', '#7EDB6A', '#5AB8F2', '#9A7BF0'].forEach(function (col, j) { ca.strokeStyle = col; ca.beginPath(); ca.arc(rcx, rcy, R0 - j * bw, Math.PI * 1.05, Math.PI * 1.95); ca.stroke(); }); ca.restore(); }
        ca.fillStyle = dk ? 'rgba(220,230,255,0.85)' : 'rgba(255,255,255,0.95)'; drops.forEach(function (d) { ca.beginPath(); ca.arc(d.x, d.y, 2.2 * S + 0.6, 0, 7); ca.fill(); });
        ca.fillStyle = dk ? 'rgba(140,190,255,0.6)' : 'rgba(120,200,240,0.7)'; drops.forEach(function (d) { ca.beginPath(); ca.arc(d.x + 0.6, d.y + 0.6, 1.3 * S + 0.4, 0, 7); ca.fill(); }); }
      // the giraffe browsing the acacia

      leaves.forEach(function (q) { var k = (t - q.t0) / 4; cb.fillStyle = dk ? '#3A2E40' : '#7A9A3E'; cb.save(); cb.translate(q.x + Math.sin(k * 8 + q.ph) * 12, q.y + k * (Gf.y - q.y) * 0.95); cb.rotate(k * 9); n1_ell(cb, 0, 0, 4 * S + 1, 2 * S + 0.5); cb.fill(); cb.restore(); });
      // tall grass in front, waving as gusts pass
      cb.lineCap = 'round';
      blades.forEach(function (b) { var w = 0.5 + 0.5 * Math.sin(b.x * 0.006 - tt * 1.7), bend = (0.15 + w * 0.5) * b.h * 0.5 + Math.sin(tt * 2.2 + b.ph) * 3, x = b.x, y = H + 4;
        cb.strokeStyle = dk ? (b.c ? '#4E3858' : '#6A5070') : (b.c ? '#C8963A' : '#E8BC5E'); cb.lineWidth = (ph ? 2.2 : 3) * S + 0.6; cb.beginPath(); cb.moveTo(x, y); cb.quadraticCurveTo(x + bend * 0.3, y - b.h * 0.6, x + bend, y - b.h); cb.stroke();
        if (dk) { cb.strokeStyle = 'rgba(220,214,240,' + (0.35 + w * 0.3) + ')'; cb.lineWidth = 1.2; cb.beginPath(); cb.moveTo(x + bend * 0.75, y - b.h * 0.86); cb.lineTo(x + bend, y - b.h); cb.stroke(); }
        else if (b.c) { cb.fillStyle = '#F2D488'; n1_ell(cb, x + bend, y - b.h - 2, 2.2 * S + 0.6, 5 * S + 1, Math.atan2(bend, b.h)); cb.fill(); } });
      if (star) { var k = (t - star.t0) / 1.2; cb.strokeStyle = 'rgba(255,245,230,' + Math.sin(Math.PI * k) + ')'; cb.lineWidth = 2; cb.beginPath(); cb.moveTo(star.x - k * 160, star.y + k * 70); cb.lineTo(star.x - k * 160 + 50, star.y + k * 70 - 22); cb.stroke(); }
    },
    finish: function (t) { el = {t0: t}; drops = []; }
  };
};

UIC.savanna = {L: ['#B8782E', '#7E4E1C', 'rgba(255,252,244,0.84)', '#3A2412', '#7A604A', '#B8502A', '#B8502A', '#D27A2A', '#FFFFFF'], D: ['#3E2446', '#2A1C3E', 'rgba(36,22,48,0.78)', '#F8EEF2', '#C2AEC4', '#F2A66A', '#F2A66A', '#F6C88A', '#24162E']};
