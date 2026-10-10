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
function n1_blush(c, x, y, r) { c.fillStyle = 'rgba(255,120,140,0.45)'; n1_ell(c, x, y, r, r * 0.6); c.fill(); }

// ---------- Hot Spring: steam curls off the water and bends in the breeze, snowflakes vanish in tiny rings on the water,
// the bamboo deer scarer fills, tips and clacks, the monkey dozes. Night: stone lanterns flicker and light the steam.
// Moment: a capybara drifts in with a yuzu on its head, sighs, and the yuzu rolls off and bobs away across the pool.
ENGINES.onsen = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, P = A.pool, sp = A.sp, S = A.S, i;
  var steamG = n1_rg(dk ? 'rgba(220,222,255,0.5)' : 'rgba(255,255,255,0.95)', [0.5, 0.45]), mistG = n1_rg(dk ? 'rgba(170,175,230,0.3)' : 'rgba(255,255,255,0.8)', [0.5, 0.5]), warmG = n1_rg('rgba(255,196,120,0.55)', [0.45, 0.25]), lanG = n1_rg('rgba(255,190,100,0.8)', [0.3, 0.35]), winG = n1_rg('rgba(255,200,120,0.6)', [0.4, 0.25]);
  function inPool(x, y, k) { var dx = (x - P.cx) / (P.rx * k), dy = (y - P.cy) / (P.ry * k); return dx * dx + dy * dy < 1; }
  function poolPt(k) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * k; return [P.cx + Math.cos(a) * P.rx * r, P.cy + Math.sin(a) * P.ry * r]; }
  var steam = []; for (i = 0; i < (ph ? 16 : 30); i++) { var p0 = poolPt(0.85); steam.push({x: p0[0], y: p0[1], age: Math.random() * 7, life: 5 + Math.random() * 3, vy: (16 + Math.random() * 12) * S, s: (18 + Math.random() * 16) * S, ph: Math.random() * 6.28}); }
  var flakes = []; function flake(top) { var x = Math.random() * W, land = inPool(x, P.cy, 0.98) ? P.cy + (Math.random() - 0.5) * P.ry * 1.3 * Math.sqrt(Math.max(0, 1 - Math.pow((x - P.cx) / P.rx, 2))) : H + 10; return {x: x, y: top ? -10 - Math.random() * 40 : Math.random() * H, r: 1 + Math.random() * 2.2, vy: 18 + Math.random() * 22, ph: Math.random() * 6.28, land: land}; }
  for (i = 0; i < (ph ? 38 : 80); i++) flakes.push(flake(false));
  var rings = [], smoke = [], lastSmoke = 0, clack = -9, pour = 0, cap = null, splashes = [];
  var mon = A.monkey;
  function tubeAngle(t) { var u = t % 7.4; if (u < 5.4) return sp.a0 + Math.pow(u / 5.4, 3) * 0.12; if (u < 5.75) return sp.a0 + 0.12 + (sp.a1 - sp.a0 - 0.12) * n1_ease((u - 5.4) / 0.35); if (u < 6.3) return sp.a1 + Math.sin((u - 5.75) * 9) * 0.02; if (u < 6.45) return sp.a1 + (sp.a0 - 0.1 - sp.a1) * n1_ease((u - 6.3) / 0.15); return sp.a0 - 0.1 * Math.exp(-(u - 6.45) * 8) * Math.cos((u - 6.45) * 30); }
  var prevU = 0;
  function drawTube(c, a, t) { var L = sp.L, w = sp.w; c.save(); c.translate(sp.px, sp.py); c.rotate(a);
    c.fillStyle = dk ? '#6E8E62' : '#9CC474'; c.beginPath(); c.moveTo(-L * 0.4, -w / 2); c.lineTo(L * 0.6, -w / 2); c.lineTo(L * 0.6 - w * 0.5, w / 2); c.lineTo(-L * 0.4, w / 2); c.closePath(); c.fill();
    c.fillStyle = dk ? 'rgba(20,30,20,0.25)' : 'rgba(60,100,40,0.22)'; c.fillRect(-L * 0.4, w * 0.12, L * 0.98, w * 0.38);
    c.fillStyle = dk ? '#4E6A46' : '#6E9A50'; c.fillRect(L * 0.05, -w / 2, w * 0.18, w); c.fillRect(-L * 0.4, -w / 2, w * 0.2, w);
    c.fillStyle = dk ? '#1E2A1E' : '#3E5A2E'; n1_ell(c, L * 0.6 - w * 0.25, 0, w * 0.18, w * 0.5, 0.45); c.fill();
    c.restore(); }
  function drawCapy(c, x, y, s, sleepy, t, mood) { // facing left, floating: the head and back above the water line y
    c.save(); c.translate(x, y); c.scale(s, s);
    var fur = dk ? '#A07A62' : '#B98A5E', furD = dk ? '#80604E' : '#9A6C46', snout = dk ? '#B08C72' : '#CDA27A';
    c.fillStyle = furD; n1_ell(c, 22, 2, 40, 18); c.fill();
    c.fillStyle = fur; n1_ell(c, 20, -2, 38, 16); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; n1_ell(c, 24, -11, 22, 4); c.fill();
    // head: a boxy rounded snout leaning forward
    c.fillStyle = fur; c.beginPath(); c.moveTo(-6, -24); c.quadraticCurveTo(-18, -32, -36, -27); c.quadraticCurveTo(-50, -23, -50, -10); c.quadraticCurveTo(-50, 2, -36, 4); c.lineTo(-4, 6); c.quadraticCurveTo(6, -8, -6, -24); c.fill();
    c.fillStyle = snout; c.beginPath(); c.moveTo(-36, -20); c.quadraticCurveTo(-50, -18, -50, -8); c.quadraticCurveTo(-49, 2, -38, 3); c.quadraticCurveTo(-30, -8, -36, -20); c.fill();
    c.fillStyle = furD; n1_ell(c, -8, -25, 5, 4.2, -0.3); c.fill(); c.fillStyle = dk ? '#C89C88' : '#E8A898'; n1_ell(c, -8, -24.6, 2.4, 2, -0.3); c.fill();
    c.fillStyle = n1_INK; n1_ell(c, -46, -12, 1.3, 2, 0.3); c.fill();
    if (sleepy) { c.strokeStyle = n1_INK; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); c.arc(-27, -17, 3.4, Math.PI * 0.1, Math.PI * 0.9); c.stroke(); }
    else n1_eye(c, -27, -16, 3.2, n1_blink(t, 2));
    n1_blush(c, -31, -7, 4.2);
    c.strokeStyle = n1_INK; c.lineWidth = 1.5; c.beginPath(); if (mood) c.arc(-43, -6, 3, Math.PI * 0.2, Math.PI * 0.85); else { c.moveTo(-45, -4); c.lineTo(-41, -3.4); } c.stroke();
    c.restore(); }
  function drawYuzu(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = dk ? '#E8B83A' : '#FFC93A'; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
    c.fillStyle = dk ? 'rgba(160,100,20,0.35)' : 'rgba(220,140,20,0.35)'; c.beginPath(); c.arc(1.5, 2.5, 9.5, 0.2, Math.PI * 0.95); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; n1_ell(c, -4, -4.5, 3.6, 2.2, -0.6); c.fill();
    c.fillStyle = dk ? 'rgba(200,140,40,0.5)' : 'rgba(230,150,30,0.45)'; [[3, -2], [-2, 4], [5, 4], [-5, 0]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 0.7, 0, 7); c.fill(); });
    c.fillStyle = '#6A4A2A'; c.fillRect(-0.8, -13.5, 1.6, 3.6);
    c.fillStyle = dk ? '#5E9A4E' : '#6CC060'; c.beginPath(); c.moveTo(0.5, -12.5); c.quadraticCurveTo(7, -18, 12, -13); c.quadraticCurveTo(6, -9, 0.5, -12.5); c.fill();
    c.restore(); }
  function drawMonkey(c, x, y, s, t, awake) { c.save(); c.translate(x, y + Math.sin(t * 0.8) * 1.2); c.scale(s, s);
    var fur = dk ? '#9A92A6' : '#B9AC9C', furL = dk ? '#B6AEC0' : '#D8CCBC', face = dk ? '#D88A92' : '#F28C8C';
    c.fillStyle = fur; n1_ell(c, 0, 4, 21, 13); c.fill();
    c.fillStyle = furL; n1_ell(c, 0, -14, 17, 16); c.fill();
    c.fillStyle = fur; [[-15, -14], [15, -14]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 4.2, 0, 7); c.fill(); });
    c.fillStyle = face; c.beginPath(); c.moveTo(0, -24); c.bezierCurveTo(10, -26, 13, -14, 9, -6); c.quadraticCurveTo(0, -1, -9, -6); c.bezierCurveTo(-13, -14, -10, -26, 0, -24); c.fill();
    if (awake) { n1_eye(c, -4.5, -15, 2, n1_blink(t, 5)); n1_eye(c, 4.5, -15, 2, n1_blink(t, 5)); } else n1_closedEyes(c, 0, -14, 4.5, 2.2, 1.4);
    c.fillStyle = 'rgba(120,40,40,0.5)'; c.beginPath(); c.arc(-1.2, -9.5, 0.7, 0, 7); c.arc(1.2, -9.5, 0.7, 0, 7); c.fill();
    c.strokeStyle = n1_INK; c.lineWidth = 1.1; c.beginPath(); c.arc(0, -8.5, 2, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    c.fillStyle = dk ? '#E4E8FF' : '#FFFFFF'; c.beginPath(); c.arc(1, -32, 6, 0, 7); c.fill(); c.fillStyle = dk ? 'rgba(150,160,220,0.4)' : 'rgba(170,190,220,0.45)'; c.beginPath(); c.arc(2.5, -30, 4.2, 0.3, 2.6); c.fill();
    c.restore(); }
  function waterClip(c, wl) { c.save(); c.beginPath(); c.rect(-50, -50, W + 100, wl + 50); c.clip(); }
  function ring(c, x, y, r, a, col) { if (a <= 0) return; c.strokeStyle = col + a + ')'; c.lineWidth = 1.3; n1_ell(c, x, y, r, r * 0.32); c.stroke(); }
  var ringC = dk ? 'rgba(200,215,255,' : 'rgba(255,255,255,';
  return {
    step: function (dt, t, f) {
      steam.forEach(function (q) { q.age += dt * f.s; if (q.age > q.life) { var p = poolPt(0.85); q.x = p[0]; q.y = p[1]; q.age = 0; q.life = 5 + Math.random() * 3; } });
      flakes.forEach(function (q, j) { q.y += q.vy * dt * f.s; q.x += Math.sin(t * 0.7 + q.ph) * 8 * dt; if (q.y >= q.land) { if (q.land < H) rings.push({x: q.x, y: q.land, t0: t, r: 7 + Math.random() * 5}); flakes[j] = flake(true); } });
      rings = rings.filter(function (r) { return t - r.t0 < 1.4; });
      if (t - lastSmoke > 0.5) { lastSmoke = t; smoke.push({t0: t, ph: Math.random() * 6.28}); } smoke = smoke.filter(function (q) { return t - q.t0 < 5; });
      var u = t % 7.4; if (u < prevU) prevU = 0;
      if (prevU < 5.6 && u >= 5.6) { pour = t; }
      if (prevU < 6.45 && u >= 6.45) { clack = t; }
      prevU = u;
      if (pour && t - pour < 0.7 && Math.random() < dt * 14) { var a = sp.a1, ox = sp.px + Math.cos(a) * sp.L * 0.6; splashes.push({x: ox + 10 * S + Math.random() * 8, y: P.cy - P.ry * 0.62, t0: t}); }
      splashes = splashes.filter(function (q) { return t - q.t0 < 1.2; });
      if (cap) { var T = t - cap.t0; if (T > 27) cap = null; }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i;
      for (i = 0; i < (ph ? 5 : 9); i++) { var mxp = ((i / (ph ? 5 : 9)) * (W + 300) + tt * 6) % (W + 300) - 150; n1_dot(ca, mistG, mxp, A.ground + Math.sin(i * 2.1) * 6 * S, (ph ? 90 : 170) * S, 0.8, 0.16); }
      // shimmer on the water
      ca.save(); ca.beginPath(); ca.ellipse(P.cx, P.cy, P.rx, P.ry, 0, 0, 7); ca.clip(); ca.lineCap = 'round';
      for (i = 0; i < (ph ? 7 : 12); i++) { var yy = P.cy - P.ry * 0.8 + (i + 0.5) / (ph ? 7 : 12) * P.ry * 1.6, xx = P.cx + Math.sin(tt * 0.25 + i * 1.7) * P.rx * 0.5, ww = P.rx * (0.12 + 0.08 * Math.sin(i * 2.3 + tt * 0.4)); ca.strokeStyle = dk ? 'rgba(170,200,255,0.22)' : 'rgba(255,255,255,0.5)'; ca.lineWidth = 1.6; ca.beginPath(); ca.moveTo(xx - ww, yy); ca.quadraticCurveTo(xx, yy - 2.5, xx + ww, yy); ca.stroke(); }
      if (dk) { ca.globalCompositeOperation = 'lighter'; A.lan.forEach(function (L, k) { var fk = flick(tt * 0.8, k * 2.3); for (var j = 0; j < 5; j++) { var ry = P.cy - P.ry * 0.7 + j * P.ry * 0.3; n1_dot(ca, warmG, L.x + Math.sin(tt * 1.3 + j) * 4, ry, L.r * (0.5 - j * 0.05), 0.35 * fk, 0.25); } }); ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      rings.forEach(function (r) { var k = (t - r.t0) / 1.4; ring(ca, r.x, r.y, 2 + k * r.r, 0.7 * (1 - k), ringC); });
      splashes.forEach(function (q) { var k = (t - q.t0) / 1.2; ring(ca, q.x, q.y, 3 + k * 22 * S, 0.8 * (1 - k), ringC); });
      // the dozing snow monkey
      var mw = mon.y + 7 * mon.s, awake = cap && t - cap.t0 > 0.6 && t - cap.t0 < 21;
      waterClip(ca, mw); drawMonkey(ca, mon.x, mon.y, mon.s, tt, awake); ca.restore();
      ring(ca, mon.x, mw, 24 * mon.s + Math.sin(tt * 1.6) * 2, 0.55, ringC);
      // the capybara moment
      if (cap) { var T = t - cap.t0, s = (ph ? 0.85 : 1.45) * S, x0 = P.cx + P.rx * 1.05, x1 = P.cx + P.rx * (ph ? 0.08 : 0.12), x = T < 2.2 ? x0 + (x1 - x0) * (1 - Math.pow(1 - T / 2.2, 2)) : T < 20 ? x1 : x1 + (x0 + 60 - x1) * n1_ease((T - 20) / 6), wl = P.cy - P.ry * 0.05, bob = Math.sin(T * 2.2) * 1.4, y = wl + bob, moving = T < 2.2 || T > 20;
        if (moving) { ca.strokeStyle = ringC + '0.5)'; ca.lineWidth = 1.4; var dir = T < 2.2 ? 1 : -1; for (var w = 0; w < 3; w++) { var k2 = ((tt * 1.5 + w / 3) % 1), bx = x + dir * (40 + k2 * 70) * s; ca.globalAlpha = 1 - k2; ca.beginPath(); ca.moveTo(x - dir * 48 * s + dir * k2 * 10, wl); ca.quadraticCurveTo(bx - dir * 10, wl - 6 * s * (1 - k2), bx, wl - 12 * s * (1 - k2)); ca.moveTo(x - dir * 48 * s + dir * k2 * 10, wl); ca.quadraticCurveTo(bx - dir * 10, wl + 6 * s * (1 - k2), bx, wl + 12 * s * (1 - k2)); ca.stroke(); } ca.globalAlpha = 1; }
        ca.fillStyle = dk ? 'rgba(120,90,80,0.25)' : 'rgba(150,100,60,0.18)'; n1_ell(ca, x + 8 * s, wl + 10 * s, 50 * s, 10 * s); ca.fill();
        var sleepy = T > 2.4 && T < 20.5, happy = T > 2.4;
        waterClip(ca, wl); drawCapy(ca, x, y, s, sleepy, tt, happy);
        // the yuzu: on the head, rolls off at 3.0, then bobs away to the left
        var hx = x - 22 * s, hy = y - 34 * s, yx, yy, yr = 0, onHead = T < 3.0;
        if (onHead) { yx = hx + Math.sin(T * 2.2) * 1.2 * s; yy = hy - 10 * s + (T > 2.4 ? Math.sin((T - 2.4) * 18) * 1.5 * s : 0); }
        else if (T < 3.7) { var k = (T - 3.0) / 0.7; yx = hx - k * 40 * s; yy = hy - 10 * s + (wl - (hy - 10 * s)) * k * k - Math.sin(Math.PI * k) * 14 * s; yr = -k * 4; }
        else { var dT = T - 3.7, dx = Math.min(P.rx * 1.1, 34 * S * dT * Math.exp(-dT * 0.04)); yx = hx - 40 * s - dx; yy = wl - 6 * s + Math.sin(dT * 2.6) * 2.5 * s; yr = -4 - dx / (11 * s); }
        ca.restore();
        if (onHead || T < 3.7) drawYuzu(ca, yx, yy, s, yr); else { waterClip(ca, wl + 3 * s + Math.sin((T - 3.7) * 2.6) * 2.5 * s); drawYuzu(ca, yx, yy, s, yr); ca.restore(); ring(ca, yx, wl + 2 * s, 14 * s + Math.sin(T * 3) * 2, 0.6 * Math.max(0, 1 - Math.max(0, T - 24)), ringC); }
        if (T > 3.6 && T < 4.8) { var k3 = (T - 3.6) / 1.2; ring(ca, hx - 40 * s, wl, 6 + k3 * 34 * s, 0.9 * (1 - k3), ringC); ring(ca, hx - 40 * s, wl, 3 + k3 * 18 * s, 0.7 * (1 - k3), ringC); }
        ring(ca, x - 6 * s, wl + 1, 50 * s + Math.sin(T * 2.2) * 2, 0.35, ringC); ring(ca, x - 6 * s, wl + 1, 58 * s + Math.sin(T * 2.2 + 1) * 3, 0.18, ringC);
        // the happy sigh: a little puff and a heart
        if (T > 2.4 && T < 4.6) { var k4 = (T - 2.4) / 2.2; n1_dot(cb, steamG, x - 58 * s - k4 * 26 * s, y - 14 * s - k4 * 30 * s, (8 + k4 * 16) * s, 0.9 * Math.sin(Math.PI * k4)); cb.save(); cb.globalAlpha = Math.sin(Math.PI * k4); cb.translate(x - 30 * s, y - 62 * s - k4 * 26 * s); cb.scale(s * (0.8 + k4 * 0.4), s * (0.8 + k4 * 0.4)); cb.fillStyle = dk ? '#FF9AB8' : '#FF7FA0'; cb.beginPath(); cb.moveTo(0, 4); cb.bezierCurveTo(-8, -2, -5, -9, 0, -5); cb.bezierCurveTo(5, -9, 8, -2, 0, 4); cb.fill(); cb.restore(); }
      }
      // the deer scarer: water trickles from the spout, it tips, pours, and clacks back
      var a = tubeAngle(tt), oe = [sp.px + Math.cos(a) * sp.L * 0.55, sp.py + Math.sin(a) * sp.L * 0.55];
      ca.strokeStyle = dk ? 'rgba(190,210,255,0.7)' : 'rgba(255,255,255,0.9)'; ca.lineWidth = Math.max(1.2, 2 * S); ca.lineCap = 'round'; ca.beginPath(); ca.moveTo(sp.pipe[0], sp.pipe[1] + 2); ca.lineTo(sp.pipe[0] + Math.sin(tt * 9) * 0.6, Math.min(oe[1] - 3, sp.pipe[1] + sp.L * 0.9)); ca.stroke();
      drawTube(ca, a, tt);
      var u = tt % 7.4; if (u > 5.55 && u < 6.35) { var pa = Math.min(1, (u - 5.55) * 6) * (1 - n1_ease((u - 6.1) / 0.25)); ca.strokeStyle = dk ? 'rgba(190,210,255,' + 0.8 * pa + ')' : 'rgba(255,255,255,' + 0.95 * pa + ')'; ca.lineWidth = sp.w * 0.5; ca.beginPath(); ca.moveTo(oe[0], oe[1]); ca.quadraticCurveTo(oe[0] + 10 * S, oe[1] + 4, oe[0] + 12 * S, P.cy - P.ry * 0.62); ca.stroke(); }
      if (t - clack < 0.5) { var kc = (t - clack) / 0.5, cx0 = sp.stone[0] + 4, cy0 = sp.stone[1] - 6 * S; cb.strokeStyle = dk ? 'rgba(255,240,200,' + (1 - kc) + ')' : 'rgba(90,80,70,' + (0.8 * (1 - kc)) + ')'; cb.lineWidth = 1.8; cb.lineCap = 'round'; cb.beginPath(); [-2.2, -1.6, -1.0].forEach(function (an) { var r0 = (8 + kc * 8) * S, r1 = r0 + 7 * S; cb.moveTo(cx0 + Math.cos(an) * r0, cy0 + Math.sin(an) * r0); cb.lineTo(cx0 + Math.cos(an) * r1, cy0 + Math.sin(an) * r1); }); cb.stroke(); }
      // steam: soft puffs that rise, swell and lean in the breeze (warm where the lanterns light them at night)
      steam.forEach(function (q) { var k = q.age / q.life, lean = Math.sin(tt * 0.22 + q.ph) * 10 + k * k * 46 * S, x = q.x + lean + Math.sin(tt * 0.9 + q.ph + k * 4) * 6 * S, y = q.y - q.age * q.vy, r = q.s * (1 + k * 2.2), al = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (dk ? 0.42 : 0.7);
        n1_dot(cb, steamG, x, y, r, al, 0.8);
        if (dk) { var best = 0; A.lan.forEach(function (L) { best = Math.max(best, 1 - Math.hypot(L.x - x, L.y - y) / (L.r * 3)); }); if (best > 0) { cb.globalCompositeOperation = 'lighter'; n1_dot(cb, warmG, x, y, r, al * best * 0.9, 0.8); cb.globalCompositeOperation = 'source-over'; } } });
      // chimney smoke
      smoke.forEach(function (q) { var k = (t - q.t0) / 5; n1_dot(cb, steamG, A.house.chim[0] + k * 40 * S + Math.sin(k * 6 + q.ph) * 4, A.house.chim[1] - k * 70 * S, (4 + k * 14) * S, 0.45 * Math.sin(Math.PI * k)); });
      // lantern and window light
      cb.save(); cb.globalCompositeOperation = 'lighter';
      A.lan.forEach(function (L, k) { var fk = flick(tt * 0.9, k * 2.3); n1_dot(cb, lanG, L.x, L.y, L.r * (dk ? 1.4 : 0.6), (dk ? 0.75 : 0.25) * (0.7 + 0.4 * fk)); });
      if (dk) A.house.wins.forEach(function (w, k) { n1_dot(cb, winG, w[0], w[1], A.house.bw * 0.3, 0.5 + 0.1 * Math.sin(tt * 1.3 + k)); });
      cb.restore();
      // the red paper lantern under the eave, swinging a little
      var hl = A.house.lantern, sw = Math.sin(tt * 1.4) * 0.09 + Math.sin(tt * 0.53) * 0.04, ls = (ph ? 0.6 : 1) * S;
      cb.save(); cb.translate(hl[0], hl[1]); cb.rotate(sw); cb.strokeStyle = '#3A2A2A'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(0, 0); cb.lineTo(0, 8 * ls); cb.stroke();
      if (dk) { cb.globalCompositeOperation = 'lighter'; n1_dot(cb, lanG, 0, 20 * ls, 34 * ls, 0.55 + 0.15 * flick(tt, 9)); cb.globalCompositeOperation = 'source-over'; }
      cb.fillStyle = dk ? '#F0704A' : '#E0533A'; n1_ell(cb, 0, 20 * ls, 9 * ls, 12 * ls); cb.fill();
      cb.strokeStyle = dk ? 'rgba(120,30,20,0.6)' : 'rgba(140,40,30,0.45)'; cb.lineWidth = 0.9; cb.beginPath(); for (var r = -2; r <= 2; r++) { cb.moveTo(-8.5 * ls, 20 * ls + r * 4 * ls); cb.lineTo(8.5 * ls, 20 * ls + r * 4 * ls); } cb.stroke();
      cb.fillStyle = '#2E2A30'; cb.fillRect(-5 * ls, 7.5 * ls, 10 * ls, 2.5 * ls); cb.fillRect(-5 * ls, 30 * ls, 10 * ls, 2.5 * ls);
      cb.restore();
      // falling snow
      cb.fillStyle = dk ? 'rgba(235,238,255,0.9)' : 'rgba(255,255,255,0.95)';
      flakes.forEach(function (q) { cb.beginPath(); cb.arc(q.x, q.y, q.r, 0, 7); cb.fill(); });
      if (!dk) { cb.fillStyle = 'rgba(150,170,200,0.35)'; flakes.forEach(function (q) { if (q.r > 2) { cb.beginPath(); cb.arc(q.x + 0.4, q.y + 0.6, q.r * 0.7, 0, 3.2); cb.fill(); } }); }
    },
    finish: function (t) { cap = {t0: t}; }
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
  var frogs = A.tips.filter(function (p) { return p[1] > H * 0.62; }).slice(0, 2);
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
      // the waterfall pours
      ca.save(); ca.beginPath(); ca.rect(F.x - F.w * 0.7, F.top, F.w * 1.4, F.bot - F.top - 6); ca.clip(); ca.lineCap = 'round';
      fl.forEach(function (q) { var u = (q.u + tt * q.sp * 0.5) % 1, y = F.top + u * (F.bot - F.top), x = F.x + (q.x - 0.5) * F.w * (1 + u * 0.25); ca.strokeStyle = dk ? 'rgba(200,235,235,' + (0.5 * Math.sin(Math.PI * u)) + ')' : 'rgba(170,215,215,' + (0.55 * Math.sin(Math.PI * u)) + ')'; ca.lineWidth = 1.6 * S + 1; ca.beginPath(); ca.moveTo(x, y); ca.lineTo(x, y + 22 * S); ca.stroke(); });
      ca.restore();
      for (i = 0; i < 4; i++) n1_dot(ca, mistG, F.x + Math.sin(tt * 0.4 + i * 1.7) * F.w * 1.5, F.bot - 8 - i * 4, F.w * (1.4 + i * 0.35), 0.75, 0.45);
      // drifting mist between the canopy layers
      [[0.55, 0.12, 1], [0.66, 0.1, -1], [0.82, 0.08, 1]].forEach(function (b, k) { for (var j = 0; j < (ph ? 4 : 7); j++) { var x = ((j / (ph ? 4 : 7)) * (W + 400) + tt * 9 * b[2] * (1 + k * 0.3) + k * 140) % (W + 400); if (x < 0) x += W + 400; n1_dot(ca, mistG, x - 200, H * b[0] + Math.sin(tt * 0.3 + j * 2 + k) * 8, (ph ? 100 : 170) * S, dk ? 0.4 : 0.34, 0.14); } });
      // the rainbow (moment)
      if (rb) { var T = t - rb.t0, k = n1_env(T, 0.3, 1.8, 8, 10.5); if (k > 0) { var R0 = ph ? W * 0.42 : W * 0.21, cx = F.x, cy = F.bot + H * 0.02, bw = (ph ? 6 : 9) * S + 2, cols = ['#FF6A6A', '#FFA94A', '#FFE05A', '#7EDB6A', '#5AB8F2', '#9A7BF0'];
        ca.save(); ca.beginPath(); ca.rect(-10, -10, W + 20, F.bot + H * 0.03); ca.clip(); ca.globalAlpha = k * (dk ? 0.3 : 0.5); ca.lineWidth = bw;
        cols.forEach(function (col, j) { ca.strokeStyle = col; ca.beginPath(); ca.arc(cx, cy, R0 - j * bw, Math.PI, 2 * Math.PI); ca.stroke(); }); ca.restore(); } }
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
      frogs.forEach(function (p, j) { var s = (ph ? 0.8 : 1.2) * S, x = p[0] + (j ? 10 : -10) * s, y = p[1] - 4 * s, pf = Math.max(0, Math.sin(tt * 1.7 + j * 2)) ; if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; n1_dot(cb, frogG, x, y - 6 * s, 26 * s, 0.6 + 0.3 * Math.sin(tt * 1.3 + j)); cb.restore(); }
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
        else { var fw = 0.2 + 0.8 * Math.abs(Math.sin(tt * 7 + q.ph)), s = (ph ? 0.9 : 1.3) * S; cb.fillStyle = '#2F7CF0'; n1_ell(cb, x - 5 * fw * s, y - 1, 5.5 * fw * s, 7 * s, -0.2); cb.fill(); n1_ell(cb, x + 5 * fw * s, y - 1, 5.5 * fw * s, 7 * s, 0.2); cb.fill(); cb.fillStyle = '#7FD0FF'; n1_ell(cb, x - 4 * fw * s, y - 2, 2.5 * fw * s, 3.5 * s); cb.fill(); n1_ell(cb, x + 4 * fw * s, y - 2, 2.5 * fw * s, 3.5 * s); cb.fill(); cb.fillStyle = '#2A2430'; cb.fillRect(x - 0.7, y - 5 * s, 1.4, 9 * s); } });
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

// ---------- Tide Pools: small waves wash over the rocks and refill the pools, anemone tentacles wave, kelp ribbons sway, a tiny
// sculpin darts between stones, gulls glide. Night: soft blue sparkles glow wherever the water splashes.
// Moment: a bigger wave rolls over everything, and as it drains away every anemone opens like a flower, one after another.
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
function n1_crab(c, x, y, s, t, walk, happy) { c.save(); c.translate(x, y + (walk ? Math.abs(Math.sin(t * 12)) * -1 : 0)); c.scale(s, s);
  var sh = '#E8603A', dkr = '#C8482A'; c.fillStyle = 'rgba(40,30,30,0.2)'; n1_ell(c, 0, 2, 16, 3); c.fill();
  c.strokeStyle = dkr; c.lineWidth = 2; c.lineCap = 'round'; for (var i = 0; i < 3; i++) [-1, 1].forEach(function (sd) { var k = walk ? Math.sin(t * 14 + i * 2 + (sd > 0 ? 1 : 0)) * 2 : 0; c.beginPath(); c.moveTo(sd * 6, -4 + i * 1.5); c.lineTo(sd * (12 + i * 1.5), -6 + i * 2 + k); c.lineTo(sd * (15 + i * 2), 1 + k * 0.5); c.stroke(); });
  var cl = happy ? -0.7 + Math.sin(t * 10) * 0.3 : Math.sin(t * 1.3) * 0.15; [-1, 1].forEach(function (sd) { c.save(); c.translate(sd * 8, -9); c.rotate(sd * cl); c.fillStyle = sh; n1_ell(c, sd * 4, -5, 4.5, 3.6, sd * 0.4); c.fill(); c.fillStyle = dkr; c.beginPath(); c.moveTo(sd * 6, -6); c.lineTo(sd * 9, -9); c.lineTo(sd * 7.5, -4.5); c.fill(); c.restore(); });
  c.fillStyle = sh; n1_ell(c, 0, -6, 11, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; n1_ell(c, -3, -9, 5, 2.4); c.fill();
  c.strokeStyle = dkr; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, -12); c.lineTo(-4, -16); c.moveTo(3, -12); c.lineTo(4, -16); c.stroke();
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(-4, -17, 1.8, 0, 7); c.arc(4, -17, 1.8, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-3.5, -17.6, 0.6, 0, 7); c.arc(4.5, -17.6, 0.6, 0, 7); c.fill();
  n1_blush(c, -6, -5, 2); n1_blush(c, 6, -5, 2); c.strokeStyle = n1_INK; c.lineWidth = 1; c.beginPath(); c.arc(0, -6, 2, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
  c.restore(); }
ENGINES.tidepool = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Pl = A.pools, sh = A.shelf, i;
  var sparkG = n1_rg('rgba(110,230,255,0.85)', [0.3, 0.3]), glowG = n1_rg('rgba(255,255,255,0.7)', [0.3, 0.3]);
  var an = A.anem.map(function (q, j) { return {x: q.x, y: q.y, r: q.r, c: n1_AN[q.c], ph: hash(j + 3) * 6.28, o: 1, pool: q.pool}; });
  var order = an.slice().sort(function (a, b) { return a.x - b.x; });
  var P0 = Pl[0], fish = {x: P0.cx, y: P0.cy, tx: P0.cx, ty: P0.cy, dir: 1, wait: 1, t0: 0, fx: P0.cx, fy: P0.cy, mv: 0};
  var gulls = []; for (i = 0; i < (ph ? 2 : 3); i++) gulls.push({x: hash(i + 1) * W, y: A.hz * (0.35 + hash(i + 2) * 0.45), sp: 14 + hash(i + 3) * 10, ph: hash(i + 4) * 6.28});
  var wash = null, nextWash = 2, big = null, sparks = [];
  function poolClip(c, p, k) { c.beginPath(); c.ellipse(p.cx, p.cy, p.rx * k, p.ry * k, 0, 0, 7); }
  return {
    step: function (dt, t, f) {
      nextWash -= dt * f.s; if (nextWash <= 0 && !big) { nextWash = 6 + Math.random() * 4; wash = {t0: t, d: H * (ph ? 0.06 : 0.08) * (0.7 + Math.random() * 0.6)}; }
      if (wash && t - wash.t0 > 4.5) wash = null;
      // the sculpin rests, then darts somewhere new
      if (fish.mv) { var u = (t - fish.t0) / 0.45; if (u >= 1) { fish.mv = 0; fish.x = fish.tx; fish.y = fish.ty; fish.wait = 1.5 + Math.random() * 3; } else { var e = 1 - Math.pow(1 - u, 3); fish.x = fish.fx + (fish.tx - fish.fx) * e; fish.y = fish.fy + (fish.ty - fish.fy) * e; } }
      else { fish.wait -= dt * f.s; if (fish.wait <= 0) { var a = Math.random() * 6.28, rr = 0.2 + Math.random() * 0.55; fish.fx = fish.x; fish.fy = fish.y; fish.tx = P0.cx + Math.cos(a) * P0.rx * rr; fish.ty = P0.cy + Math.sin(a) * P0.ry * rr * 0.7; fish.dir = fish.tx > fish.x ? 1 : -1; fish.t0 = t; fish.mv = 1; } }
      gulls.forEach(function (g) { g.x += g.sp * dt * f.s; if (g.x > W + 40) g.x = -40; });
      // the anemones: closed under the big wave, then open one after another
      if (big) { var T = t - big.t0; an.forEach(function (q) { var hit = 0.15 + (q.y / H) * 1.1, op = 3.4 + order.indexOf(q) * (ph ? 0.26 : 0.22);
          if (T < hit) q.o = Math.max(q.o, 1); else if (T < op) q.o = Math.max(0, q.o - dt * 4); else { var k = (T - op) / 0.55; q.o = k >= 1 ? 1 : n1_ease(k) * (1 + 0.25 * Math.sin(Math.PI * k)); if (!q.pop && T > op) { q.pop = 1; for (var m = 0; m < 6; m++) sparks.push({x: q.x, y: q.y - q.r * 0.2, a: m / 6 * 6.28, t0: t, c: q.c[2]}); } } });
        if (T > 3.4 + an.length * 0.3 + 1.5) { big = null; an.forEach(function (q) { q.o = 1; q.pop = 0; }); } }
      sparks = sparks.filter(function (s) { return t - s.t0 < 0.9; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i;
      // gulls
      ca.strokeStyle = dk ? 'rgba(220,226,240,0.7)' : 'rgba(70,80,90,0.7)'; ca.lineWidth = 1.5; ca.lineCap = 'round'; ca.beginPath();
      gulls.forEach(function (g) { var y = g.y + Math.sin(tt * 0.5 + g.ph) * 6, fl = Math.sin(tt * 3 + g.ph) * 3, s = 8 * S + 3; ca.moveTo(g.x - s, y - 2 - fl); ca.quadraticCurveTo(g.x - s * 0.4, y - 4 - fl * 0.5, g.x, y); ca.quadraticCurveTo(g.x + s * 0.4, y - 4 - fl * 0.5, g.x + s, y - 2 - fl); }); ca.stroke();
      // swell lines rolling in toward the rocks
      ca.lineWidth = 1.6; for (i = 0; i < 5; i++) { var u = ((tt * 0.08 + i / 5) % 1), y = A.hz + 10 + Math.pow(u, 1.6) * (sh - A.hz - 14), al = Math.sin(Math.PI * u) * (dk ? 0.25 : 0.5); ca.strokeStyle = dk ? 'rgba(170,200,240,' + al + ')' : 'rgba(255,255,255,' + al + ')'; ca.beginPath(); for (var x = -10; x <= W + 10; x += 20) { var yy = y + Math.sin(x / 70 + i * 2 + tt * 0.4) * 2.5; if (x === -10) ca.moveTo(x, yy); else ca.lineTo(x, yy); } ca.stroke(); }
      // surf along the rock edge
      ca.strokeStyle = dk ? 'rgba(200,225,255,0.55)' : 'rgba(255,255,255,0.85)'; ca.lineWidth = 3 * S + 1; ca.beginPath(); for (x = -10; x <= W + 10; x += 12) { var sy = sh - 6 + Math.sin(x / 40 + tt * 1.3) * 2.5 + Math.sin(x / 13 + tt * 2.1) * 1.2; if (x === -10) ca.moveTo(x, sy); else ca.lineTo(x, sy); } ca.stroke();
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; for (i = 0; i < (ph ? 10 : 22); i++) { var bx = (hash(i + 7) * W + tt * 14 * (i % 2 ? 1 : -1)) % W, a2 = Math.pow(Math.max(0, Math.sin(tt * 2.3 + i * 1.9)), 3); if (bx < 0) bx += W; n1_dot(cb, sparkG, bx, sh - 6 + Math.sin(bx / 40 + tt * 1.3) * 2.5, 7, a2 * 0.8); } cb.restore(); }
      // a small wave washes over the shelf
      if (wash) { var T = t - wash.t0, k = T < 1.6 ? n1_ease(T / 1.6) : 1 - n1_ease((T - 1.6) / 2.9), fy = sh - 4 + wash.d * k;
        ca.fillStyle = dk ? 'rgba(90,150,210,0.26)' : 'rgba(120,210,235,0.32)'; ca.beginPath(); ca.moveTo(-10, sh - 8); for (x = -10; x <= W + 10; x += 16) ca.lineTo(x, fy + Math.sin(x / 50 + T * 2) * 5 * k); ca.lineTo(W + 10, sh - 8); ca.fill();
        ca.strokeStyle = dk ? 'rgba(200,230,255,' + (0.6 * k) + ')' : 'rgba(255,255,255,' + (0.9 * k) + ')'; ca.lineWidth = 2.6; ca.beginPath(); for (x = -10; x <= W + 10; x += 16) { var y2 = fy + Math.sin(x / 50 + T * 2) * 5 * k; if (x === -10) ca.moveTo(x, y2); else ca.lineTo(x, y2); } ca.stroke();
        if (dk && T < 2.4) { cb.save(); cb.globalCompositeOperation = 'lighter'; for (i = 0; i < (ph ? 8 : 16); i++) n1_dot(cb, sparkG, hash(i + 31) * W, fy + Math.sin(hash(i + 31) * W / 50 + T * 2) * 5 * k, 6, k * Math.pow(Math.abs(Math.sin(tt * 4 + i)), 2)); cb.restore(); } }
      // inside the pools: shimmer, kelp, the sculpin and the anemones
      Pl.forEach(function (p, k) { ca.save(); poolClip(ca, p, 0.98); ca.clip();
        ca.strokeStyle = dk ? 'rgba(150,200,255,0.2)' : 'rgba(255,255,255,0.45)'; ca.lineWidth = 1.3; for (var m = 0; m < Math.max(3, Math.round(p.rx / 30)); m++) { var yy2 = p.cy - p.ry * 0.7 + (m + 0.5) / Math.max(3, Math.round(p.rx / 30)) * p.ry * 1.4, xx = p.cx + Math.sin(tt * 0.3 + m * 2.1 + k) * p.rx * 0.5, ww2 = p.rx * 0.15; ca.beginPath(); ca.moveTo(xx - ww2, yy2); ca.quadraticCurveTo(xx, yy2 - 2.5, xx + ww2, yy2); ca.stroke(); }
        A.kelp.forEach(function (q) { if (q.pool !== k) return; var Lp = [], Rp = []; for (var j = 0; j <= 12; j++) { var u = j / 12, cx2 = q.x + Math.sin(tt * 1.1 + q.ph + u * 4) * 9 * u * S + u * q.L * 0.9, cy2 = q.y - u * q.L * 0.45 + Math.sin(tt * 0.8 + u * 5 + q.ph) * 3 * u, w = (2 + 5 * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.1))) * S * (1 + 0.25 * Math.sin(u * 9 + tt * 2)); Lp.push([cx2, cy2 - w]); Rp.unshift([cx2, cy2 + w]); }
          ca.fillStyle = dk ? 'rgba(170,140,70,0.7)' : 'rgba(196,150,46,0.85)'; ca.beginPath(); Lp.concat(Rp).forEach(function (pp, j) { if (j) ca.lineTo(pp[0], pp[1]); else ca.moveTo(pp[0], pp[1]); }); ca.closePath(); ca.fill();
          ca.strokeStyle = dk ? 'rgba(220,190,110,0.5)' : 'rgba(240,210,120,0.75)'; ca.lineWidth = 1.2; ca.beginPath(); Lp.forEach(function (pp, j) { var mpx = (pp[0] + Rp[12 - j][0]) / 2, mpy = (pp[1] + Rp[12 - j][1]) / 2; if (j) ca.lineTo(mpx, mpy); else ca.moveTo(mpx, mpy); }); ca.stroke(); });
        if (k === 0) { ca.fillStyle = 'rgba(20,40,50,0.18)'; n1_ell(ca, fish.x + 3, fish.y + 5, 14 * S, 4 * S); ca.fill(); n1_sculpin(ca, fish.x, fish.y, (ph ? 0.8 : 1.15) * S, fish.dir, tt, fish.mv); }
        ca.restore(); });
      an.forEach(function (q) { if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; n1_dot(ca, glowG, q.x, q.y, q.r * 1.4, 0.12 * q.o); ca.restore(); } n1_anemone(ca, q.x, q.y, q.r, q.c, Math.max(0, q.o) * (0.92 + 0.08 * Math.sin(tt * 0.9 + q.ph)), tt, q.ph, dk); });
      var Cr = A.crab, cu = (tt * 0.05) % 2, cx3 = Cr.x0 + (Cr.x1 - Cr.x0) * (cu < 1 ? n1_ease(cu) : 1 - n1_ease(cu - 1)), walk = Math.abs(Math.sin(tt * 0.05 * Math.PI)) > 0.15;
      n1_crab(cb, cx3, Cr.y, (ph ? 0.8 : 1.2) * S, tt, walk, big && t - big.t0 > 3.4);
      sparks.forEach(function (s) { var k = (t - s.t0) / 0.9, d = 6 + k * 26 * S; cb.fillStyle = s.c; cb.globalAlpha = 1 - k; var x = s.x + Math.cos(s.a) * d, y = s.y + Math.sin(s.a) * d * 0.7, r = (3.5 - k * 2) * S + 1; cb.beginPath(); cb.moveTo(x, y - r * 1.6); cb.lineTo(x + r * 0.4, y - r * 0.4); cb.lineTo(x + r * 1.6, y); cb.lineTo(x + r * 0.4, y + r * 0.4); cb.lineTo(x, y + r * 1.6); cb.lineTo(x - r * 0.4, y + r * 0.4); cb.lineTo(x - r * 1.6, y); cb.lineTo(x - r * 0.4, y - r * 0.4); cb.fill(); }); cb.globalAlpha = 1;
      // the big wave: rolls down over everything, then drains back
      if (big) { var T2 = t - big.t0, front, top = A.hz - 4;
        if (T2 < 1.3) front = sh + (H + 60 - sh) * n1_ease(T2 / 1.3) * 1.0 - (1 - n1_ease(T2 / 1.3)) * (sh - A.hz); else if (T2 < 2.3) front = H + 60; else front = H + 60 - (H + 60 - sh + 10) * n1_ease((T2 - 2.3) / 1.6);
        var al2 = T2 < 3.9 ? 1 : Math.max(0, 1 - (T2 - 3.9) / 0.8);
        if (al2 > 0) { cb.fillStyle = dk ? 'rgba(50,120,190,' + (0.42 * al2) + ')' : 'rgba(70,185,225,' + (0.45 * al2) + ')'; cb.beginPath(); cb.moveTo(-10, top); for (x = -10; x <= W + 10; x += 14) cb.lineTo(x, front + Math.sin(x / 60 + T2 * 3) * 9 + Math.sin(x / 23 + T2 * 5) * 3); cb.lineTo(W + 10, top); cb.fill();
          cb.save(); cb.beginPath(); cb.rect(-10, top, W + 20, Math.max(0, front - top)); cb.clip(); cb.strokeStyle = dk ? 'rgba(170,220,255,' + (0.3 * al2) + ')' : 'rgba(255,255,255,' + (0.45 * al2) + ')'; cb.lineWidth = 2;
          for (i = 0; i < (ph ? 14 : 26); i++) { var lx = (hash(i + 101) * W + T2 * 30 * (i % 2 ? 1 : -1) + W) % W, ly = top + 20 + hash(i + 111) * (H - top), lw = (30 + hash(i + 121) * 60) * S; cb.beginPath(); cb.moveTo(lx - lw, ly); cb.quadraticCurveTo(lx, ly - 6 - Math.sin(T2 * 3 + i) * 4, lx + lw, ly); cb.stroke(); } cb.restore();
          cb.strokeStyle = dk ? 'rgba(210,240,255,' + (0.7 * al2) + ')' : 'rgba(255,255,255,' + (0.95 * al2) + ')'; cb.lineWidth = 6 * S + 2; cb.lineCap = 'round'; cb.beginPath(); for (x = -10; x <= W + 10; x += 14) { var y3 = front + Math.sin(x / 60 + T2 * 3) * 9 + Math.sin(x / 23 + T2 * 5) * 3; if (x === -10) cb.moveTo(x, y3); else cb.lineTo(x, y3); } cb.stroke();
          cb.fillStyle = dk ? 'rgba(220,245,255,' + (0.6 * al2) + ')' : 'rgba(255,255,255,' + (0.85 * al2) + ')'; for (i = 0; i < (ph ? 30 : 60); i++) { var bx2 = hash(i + 51) * W, by2 = front - 6 - hash(i + 61) * 40 * S + Math.sin(bx2 / 60 + T2 * 3) * 9; if (by2 > top) { cb.beginPath(); cb.arc(bx2, by2, (1 + hash(i + 71) * 3) * S + 0.5, 0, 7); cb.fill(); } }
          if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; for (i = 0; i < (ph ? 16 : 34); i++) { var sx2 = hash(i + 81) * W, sy2 = top + hash(i + 91) * (front - top); n1_dot(cb, sparkG, sx2, sy2, 8, al2 * 0.7 * Math.pow(Math.abs(Math.sin(tt * 3 + i * 1.3)), 2)); } cb.restore(); } } }
    },
    finish: function (t) { big = {t0: t}; wash = null; an.forEach(function (q) { q.pop = 0; }); }
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
  var puffG = n1_rg(dk ? 'rgba(110,70,90,0.7)' : 'rgba(250,246,242,0.92)', [0.55, 0.5]), shadeG = n1_rg(dk ? 'rgba(40,20,40,0.5)' : 'rgba(170,150,150,0.35)', [0.5, 0.4]), lavaG = n1_rg('rgba(255,120,40,0.65)', [0.3, 0.3]), hotG = n1_rg('rgba(255,170,80,0.6)', [0.35, 0.3]), sparkG = n1_rg('rgba(255,220,120,0.9)', [0.25, 0.4]), steamG = n1_rg(dk ? 'rgba(230,200,210,0.5)' : 'rgba(255,255,255,0.85)', [0.5, 0.45]);
  var puffs = [], lastPuff = -1, wisps = [], fronds = {}, sparks = [], flowers = [], burp = null;
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
      sparks.forEach(function (s) { if (!s.done && t - s.t0 >= s.dur) { s.done = 1; flowers.push({x: s.tx, y: s.ty, t0: t, k: s.k, r: (ph ? 5 : 7.5) * S * (0.8 + Math.random() * 0.4)}); if (flowers.length > 46) flowers.shift(); } });
      sparks = sparks.filter(function (s) { return !s.done; });
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
      // waves lapping the black sand
      var B = A.beach; for (var w = 0; w < 2; w++) { var u2 = ((tt / 5.5) + w * 0.5) % 1, k2 = u2 < 0.45 ? n1_ease(u2 / 0.45) : 1 - n1_ease((u2 - 0.45) / 0.55), d = H * (ph ? 0.025 : 0.035) * k2 * (w ? 0.6 : 1);
        ca.fillStyle = dk ? 'rgba(120,70,110,' + (0.35 * k2) + ')' : 'rgba(120,215,215,' + (0.55 * k2) + ')'; ca.beginPath(); ca.moveTo(B[0][0], B[0][1] - 4); B.forEach(function (p) { ca.lineTo(p[0], p[1] + d + Math.sin(p[0] / 40 + tt) * 2); }); ca.lineTo(B[B.length - 1][0], B[B.length - 1][1] - 4); ca.fill();
        ca.strokeStyle = dk ? 'rgba(255,200,190,' + (0.55 * k2) + ')' : 'rgba(255,255,255,' + (0.95 * k2) + ')'; ca.lineWidth = 2.4 * S + 0.6; ca.beginPath(); B.forEach(function (p, m) { var yy = p[1] + d + Math.sin(p[0] / 40 + tt) * 2; if (m) ca.lineTo(p[0], yy); else ca.moveTo(p[0], yy); }); ca.stroke(); }
      ca.strokeStyle = dk ? 'rgba(255,190,170,0.4)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1.6; for (i = 0; i < 4; i++) { var u3 = ((tt * 0.07 + i / 4) % 1), yy3 = A.hz + 8 + Math.pow(u3, 1.5) * (B[0][1] - A.hz - 14); ca.globalAlpha = Math.sin(Math.PI * u3); ca.beginPath(); for (var x = -10; x <= W + 10; x += 24) { var y4 = yy3 + Math.sin(x / 60 + i * 3 + tt * 0.5) * 2; if (x === -10) ca.moveTo(x, y4); else ca.lineTo(x, y4); } ca.stroke(); } ca.globalAlpha = 1;
      // flowers that sprang up where the sparks landed
      flowers.forEach(function (q) { var k = (t - q.t0) / 0.45, sc = k >= 1 ? 1 : n1_ease(k) * (1 + 0.35 * Math.sin(Math.PI * k)); n1_flower(ca, q.x, q.y, q.r, q.k, sc, tt); });
      // the burp: a puff ring and sparks arcing out
      if (burp) { var T = t - burp.t0; if (T < 1.6) { var kk = T / 1.6; ca.strokeStyle = dk ? 'rgba(255,200,150,' + (0.8 * (1 - kk)) + ')' : 'rgba(255,255,255,' + (0.9 * (1 - kk)) + ')'; ca.lineWidth = (6 - kk * 4) * S + 1; n1_ell(ca, Cr[0], Cr[1] - kk * 50 * S, Cr[2] * (0.6 + kk * 1.4), Cr[2] * (0.25 + kk * 0.5)); ca.stroke(); } }
      cb.save(); cb.globalCompositeOperation = 'lighter';
      sparks.forEach(function (s) { var u = Math.max(0, (t - s.t0) / s.dur); if (u <= 0) return; for (var m = 0; m < 5; m++) { var uu = Math.max(0, u - m * 0.025), x = Cr[0] + (s.tx - Cr[0]) * uu, y = Cr[1] + (s.ty - Cr[1]) * uu - Math.sin(Math.PI * uu) * s.h; n1_dot(cb, sparkG, x, y, (7 - m) * S + 1, (1 - m * 0.18) * 0.9); } });
      cb.restore();
      // palm crowns swaying over everything
      A.crowns.forEach(function (c, k) { var sw = Math.sin(tt * 0.8 + c.ph) * 0.05 + Math.sin(tt * 1.9 + c.ph * 2) * 0.015; cb.fillStyle = dk ? '#1E3A2A' : '#3E8A44';
        [-2.9, -2.5, -2.05, -1.6, -1.15, -0.7, -0.25, 0.25, 2.85].forEach(function (a, m) { var aa = a + sw * (1 + m * 0.1), L = c.L * (0.85 + (m % 3) * 0.1), left = Math.cos(aa) < 0; cb.save(); cb.translate(c.x, c.y); if (left) { cb.scale(-1, 1); aa = Math.PI - aa; } cb.rotate(aa); cb.fillStyle = m % 2 ? (dk ? '#1E3A2A' : '#3E8A44') : (dk ? '#284A34' : '#56A64E'); cb.fill(frondPath(L)); cb.restore(); });
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
function n1_giraffe(c, x, y, s, t, chew, reach, dk) { c.save(); c.translate(x, y); c.scale(s, s);
  var base = dk ? '#9A7A70' : '#F2C46A', spot = dk ? '#6A4A50' : '#C2783A', dark = dk ? '#4A3038' : '#8A5A30', hoof = dk ? '#3A2830' : '#5A3A2A';
  function leg(x0, x1, ph) { c.strokeStyle = base; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, -78); c.lineTo(x0 + (x1 - x0) * 0.5 + ph, -38); c.lineTo(x1, -2); c.stroke(); c.fillStyle = dark; c.beginPath(); c.arc(x0 + (x1 - x0) * 0.5 + ph, -38, 3.6, 0, 7); c.fill(); c.fillStyle = hoof; c.fillRect(x1 - 3.5, -4, 7, 4); }
  leg(-26, -30, -1); leg(20, 22, 1); c.globalAlpha = 1;
  c.strokeStyle = dark; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-38, -92); c.quadraticCurveTo(-46, -78, -44, -58); c.stroke(); c.fillStyle = dark; n1_ell(c, -44, -56, 2.6, 5); c.fill();
  c.fillStyle = base; c.save(); c.rotate(-0.14); n1_ell(c, -2, -92, 40, 21); c.fill(); c.restore();
  leg(-18, -16, 1); leg(28, 32, -1);
  // neck reaching up to the leaves
  var nb = [24, -104], hx = 66 + reach * 6, hy = -196 - reach * 8, nm = [nb[0] + (hx - nb[0]) * 0.5 - 6, nb[1] + (hy - nb[1]) * 0.5];
  c.fillStyle = base; c.beginPath(); c.moveTo(nb[0] - 14, nb[1] + 10); c.quadraticCurveTo(nm[0] - 9, nm[1], hx - 6, hy + 8); c.lineTo(hx + 6, hy + 12); c.quadraticCurveTo(nm[0] + 9, nm[1] + 4, nb[0] + 16, nb[1] + 14); c.fill();
  c.strokeStyle = dark; c.lineWidth = 3; c.beginPath(); c.moveTo(nb[0] - 13, nb[1] + 4); c.quadraticCurveTo(nm[0] - 10, nm[1] - 3, hx - 7, hy + 4); c.stroke();
  // spots
  c.fillStyle = spot; [[-24, -96, 7, 5], [-8, -100, 6, 5], [8, -94, 7, 6], [-16, -84, 6, 4], [2, -82, 5, 4], [18, -100, 5, 4], [-30, -86, 4, 4]].forEach(function (q) { n1_ell(c, q[0], q[1], q[2], q[3], 0.3); c.fill(); });
  for (var k = 1; k < 5; k++) { var u = k / 5, qx = nb[0] + (hx - nb[0]) * u + Math.sin(u * 3) * -4, qy = nb[1] + (hy - nb[1]) * u + 4; n1_ell(c, qx, qy, 4.5 - u, 3.6 - u * 0.5, 0.8); c.fill(); }
  // head, tilted up into the leaves
  c.save(); c.translate(hx, hy); c.rotate(-0.55 - reach * 0.2);
  c.fillStyle = base; n1_ell(c, 10, 0, 17, 9); c.fill(); c.fillStyle = dk ? '#B89A90' : '#F7D8A0'; n1_ell(c, 22, 1 + chew * 1.5, 7, 6 + chew); c.fill();
  c.strokeStyle = dark; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, -6); c.lineTo(-3, -16); c.moveTo(5, -7); c.lineTo(4, -17); c.stroke(); c.fillStyle = dark; c.beginPath(); c.arc(-3, -17, 2.4, 0, 7); c.arc(4, -18, 2.4, 0, 7); c.fill();
  c.fillStyle = base; n1_ell(c, -5, -4, 6, 2.6, -0.6); c.fill();
  c.strokeStyle = n1_INK; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.arc(8, -1, 2.6, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  n1_blush(c, 12, 3, 3); c.fillStyle = n1_INK; c.beginPath(); c.arc(27, -1, 1, 0, 7); c.fill();
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
  var gs = (Gf.y - Gf.crown - 12 * S) / 205; Gf.s = gs;
  var blades = []; for (i = 0; i < (ph ? 46 : 110); i++) blades.push({x: (i + Math.random()) / (ph ? 46 : 110) * (W + 40) - 20, h: (ph ? 36 : 64) * (0.6 + Math.random() * 0.7), c: Math.random() < 0.5, ph: Math.random() * 6.28});
  var birds = []; for (i = 0; i < 2; i++) birds.push({ph: i * 3.1, sp: 0.35 + i * 0.1});
  var ripples = [], star = null, nextStar = 6, leaves = [], el = null, drops = [];
  function pondY(x) { var u = (x - Pd.x) / Pd.rx; return Math.abs(u) < 1 ? Pd.y : null; }
  return {
    step: function (dt, t, f) {
      ripples = ripples.filter(function (r) { return t - r.t0 < 1.5; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 7 + Math.random() * 9; star = {t0: t, x: W * (0.3 + Math.random() * 0.6), y: H * (0.05 + Math.random() * 0.2)}; } if (star && t - star.t0 > 1.2) star = null; }
      if (Math.random() < dt * 0.25) leaves.push({x: Gf.x + 60 * gs, y: Gf.crown + 10 * S, t0: t, ph: Math.random() * 6.28}); leaves = leaves.filter(function (q) { return t - q.t0 < 4; });
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
      // a traveling gust brightens the grass
      var gx = ((tt * 60) % (W + 600)) - 300; ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n1_dot(ca, n1_rg(dk ? 'rgba(200,190,230,0.18)' : 'rgba(255,240,180,0.45)'), gx, A.gy + (H - A.gy) * 0.4, 260 * S, 0.8, 0.3); ca.restore();
      // ripples on the watering hole
      ripples.forEach(function (r) { var k = (t - r.t0) / 1.5; ca.strokeStyle = dk ? 'rgba(220,210,255,' + 0.6 * (1 - k) + ')' : 'rgba(255,255,255,' + 0.8 * (1 - k) + ')'; ca.lineWidth = 1.2; n1_ell(ca, r.x, r.y, 2 + k * r.r * 2 * S + 2, (2 + k * r.r * 2 * S) * 0.3); ca.stroke(); });
      var sh = Math.sin(tt * 0.6) * 0.5 + 0.5; ca.strokeStyle = dk ? 'rgba(220,210,255,0.3)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 1.4; for (i = 0; i < 3; i++) { var lx = Pd.x - Pd.rx * 0.5 + i * Pd.rx * 0.45 + Math.sin(tt * 0.4 + i) * 10, ly = Pd.y - Pd.ry * 0.2 + i * Pd.ry * 0.25; ca.beginPath(); ca.moveTo(lx - 14 * S, ly); ca.lineTo(lx + 14 * S, ly); ca.stroke(); }
      // swallows skimming the water
      ca.strokeStyle = dk ? '#C8C0E0' : '#3A3036'; ca.lineWidth = 1.8; ca.lineCap = 'round';
      birds.forEach(function (b, k) { var a = tt * b.sp + b.ph, x = Pd.x + Math.sin(a) * Pd.rx * 1.3, y = Pd.y - Pd.ry * 1.2 - Math.abs(Math.cos(a * 2)) * H * 0.08, fl = Math.sin(tt * 9 + k) * 3, s = 7 * S + 2, dir = Math.cos(a) > 0 ? 1 : -1;
        if (Math.abs(Math.cos(a * 2)) < 0.05 && Math.random() < 0.3) ripples.push({x: x, y: Pd.y, t0: t, r: 6});
        ca.beginPath(); ca.moveTo(x - s, y - 2 - fl); ca.quadraticCurveTo(x - s * 0.3, y - 3, x, y); ca.quadraticCurveTo(x + s * 0.3, y - 3, x + s, y - 2 - fl); ca.moveTo(x - dir * 2, y); ca.lineTo(x - dir * s * 0.8, y + 3); ca.stroke(); });
      // the baby elephant moment
      if (el) { var T = t - el.t0, es = (ph ? 0.85 : 1.6) * S, xe = Pd.x - Pd.rx - 30 * es, x0 = -90 * es, ex, walk = false, dir = -1, trunk = 0.35, ear = 0.4 + 0.1 * Math.sin(tt * 2);
        if (T < 2.4) { ex = x0 + (xe - x0) * n1_ease(T / 2.4); walk = true; }
        else if (T < 12) { ex = xe; if (T < 3.0) trunk = 0.35 - 0.35 * n1_ease((T - 2.4) / 0.6); else if (T < 3.6) trunk = n1_ease((T - 3.0) / 0.6); else if (T < 7) { trunk = 1; ear = 0.5 + 0.5 * Math.abs(Math.sin((T - 3.6) * 6)); } else trunk = 1 - 0.65 * n1_ease((T - 7) / 1); }
        else { ex = xe + (x0 - xe) * n1_ease((T - 12) / 4); walk = true; dir = 1; }
        if (T > 2.6 && T < 3.1 && Math.random() < 0.3) ripples.push({x: xe + 44 * es, y: Pd.y, t0: t, r: 7});
        el.tip = n1_elephant(cb, ex, Pd.y + Pd.ry * 0.6, es, dir, tt, walk, trunk, ear, dk);
        // spray and the rainbow in it
        var rk = n1_env(T, 3.9, 4.8, 7.4, 9.5); if (rk > 0) { var rcx = xe + 120 * es, rcy = Pd.y - 16 * es, R0 = 92 * es, bw = 5 * es; cb.save(); cb.globalAlpha = rk * (dk ? 0.35 : 0.55); cb.lineWidth = bw; ['#FF6A6A', '#FFA94A', '#FFE05A', '#7EDB6A', '#5AB8F2', '#9A7BF0'].forEach(function (col, j) { cb.strokeStyle = col; cb.beginPath(); cb.arc(rcx, rcy, R0 - j * bw, Math.PI * 1.05, Math.PI * 1.95); cb.stroke(); }); cb.restore(); }
        cb.fillStyle = dk ? 'rgba(220,230,255,0.85)' : 'rgba(255,255,255,0.95)'; drops.forEach(function (d) { cb.beginPath(); cb.arc(d.x, d.y, 2.2 * S + 0.6, 0, 7); cb.fill(); });
        cb.fillStyle = dk ? 'rgba(140,190,255,0.6)' : 'rgba(120,200,240,0.7)'; drops.forEach(function (d) { cb.beginPath(); cb.arc(d.x + 0.6, d.y + 0.6, 1.3 * S + 0.4, 0, 7); cb.fill(); }); }
      // the giraffe browsing the acacia
      var chew = Math.max(0, Math.sin(tt * 5)) * (Math.sin(tt * 0.5) > -0.6 ? 1 : 0), reach = 0.5 + 0.5 * Math.sin(tt * 0.35);
      n1_giraffe(cb, Gf.x, Gf.y, gs, tt, chew, reach, dk);
      leaves.forEach(function (q) { var k = (t - q.t0) / 4; cb.fillStyle = dk ? '#3A2E40' : '#7A9A3E'; cb.save(); cb.translate(q.x + Math.sin(k * 8 + q.ph) * 12, q.y + k * (Gf.y - q.y) * 0.9); cb.rotate(k * 9); n1_ell(cb, 0, 0, 4 * S + 1, 2 * S + 0.5); cb.fill(); cb.restore(); });
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
