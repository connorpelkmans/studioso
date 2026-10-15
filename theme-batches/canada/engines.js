// ---- batch canada engines: canada
function canada_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function canada_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return canada_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - canada_ease((T - c) / (d - c)); }
var canada_gc = null;
function canada_ctx() { return canada_gc || (canada_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with canada_dot)
function canada_rg(col, mid) { var g = canada_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function canada_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function canada_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function canada_leafPath(o, s) { o.beginPath(); canada_LEAFU.forEach(function (p, i) { if (i) o.lineTo(p[0] * s, p[1] * s); else o.moveTo(p[0] * s, p[1] * s); }); o.closePath(); }
// a canoe seen from the side, L long, centred on its waterline; the far inner wall shows above the near gunwale
function canada_hull(c, L) { var h = L * 0.13; c.beginPath(); c.moveTo(-L / 2, -h); c.quadraticCurveTo(-L * 0.42, -h * 0.3, -L * 0.3, -h * 0.3); c.lineTo(L * 0.3, -h * 0.3); c.quadraticCurveTo(L * 0.42, -h * 0.3, L / 2, -h);
  c.quadraticCurveTo(L * 0.45, h * 0.45, L * 0.28, h * 0.5); c.lineTo(-L * 0.28, h * 0.5); c.quadraticCurveTo(-L * 0.45, h * 0.45, -L / 2, -h); c.closePath(); }
function canada_canoe(c, L, dk, inside) {
  var h = L * 0.13;
  c.fillStyle = dk ? '#4A1A18' : '#8E2418'; c.beginPath(); c.moveTo(-L * 0.47, -h * 0.92); c.quadraticCurveTo(-L * 0.4, -h * 0.62, -L * 0.3, -h * 0.6); c.lineTo(L * 0.3, -h * 0.6); c.quadraticCurveTo(L * 0.4, -h * 0.62, L * 0.47, -h * 0.92); c.lineTo(L * 0.3, -h * 0.3); c.lineTo(-L * 0.3, -h * 0.3); c.closePath(); c.fill();
  if (inside) inside();
  var g = c.createLinearGradient(0, -h, 0, h * 0.5); g.addColorStop(0, dk ? '#C24A3A' : '#F05A44'); g.addColorStop(0.5, dk ? '#9A3028' : '#D6382A'); g.addColorStop(1, dk ? '#6A2020' : '#A82A20');
  c.fillStyle = g; canada_hull(c, L); c.fill();
  c.strokeStyle = dk ? '#B88A5A' : '#F2D2A0'; c.lineWidth = Math.max(1, L * 0.025); c.beginPath(); c.moveTo(-L / 2 + 1, -h + 1); c.quadraticCurveTo(-L * 0.42, -h * 0.3, -L * 0.3, -h * 0.3); c.lineTo(L * 0.3, -h * 0.3); c.quadraticCurveTo(L * 0.42, -h * 0.3, L / 2 - 1, -h + 1); c.stroke();
  c.strokeStyle = dk ? 'rgba(255,200,180,0.25)' : 'rgba(255,255,255,0.45)'; c.lineWidth = Math.max(0.8, L * 0.016); c.beginPath(); c.moveTo(-L * 0.36, -h * 0.02); c.lineTo(L * 0.36, -h * 0.02); c.stroke(); }
// a little beaver in a red toque, sitting in a canoe, facing left (the canoe's bow)
function canada_beaver(c, L, dk) { var u = L / 90;
  c.fillStyle = dk ? '#5A3A2A' : '#8A5A38'; c.beginPath(); c.ellipse(2 * u, -16 * u, 9 * u, 11 * u, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(-3 * u, -29 * u, 7.4 * u, 0, 7); c.fill(); c.beginPath(); c.arc(1 * u, -35 * u, 2.4 * u, 0, 7); c.fill();
  c.fillStyle = dk ? '#8A6A50' : '#C89A70'; c.beginPath(); c.ellipse(-8.6 * u, -27 * u, 3.6 * u, 3 * u, 0, 0, 7); c.fill();
  c.fillStyle = '#FFFFFF'; c.fillRect(-10 * u, -25 * u, 2.4 * u, 2.4 * u);
  c.fillStyle = '#2A1A14'; c.beginPath(); c.arc(-6 * u, -31 * u, 1.2 * u, 0, 7); c.arc(-11.2 * u, -28.4 * u, 1.1 * u, 0, 7); c.fill();
  c.fillStyle = dk ? '#A8342C' : '#D6382A'; c.beginPath(); c.moveTo(-10 * u, -33 * u); c.quadraticCurveTo(-4 * u, -44 * u, 5 * u, -34 * u); c.closePath(); c.fill();
  c.fillStyle = '#F4EEE4'; c.fillRect(-10.4 * u, -34.4 * u, 15.6 * u, 2.6 * u); c.beginPath(); c.arc(-2 * u, -42.6 * u, 2.4 * u, 0, 7); c.fill(); }
// the common loon on the water, facing right, waterline at y = 0
function canada_loon(c, s, dk) {
  c.fillStyle = dk ? '#0E1416' : '#1A2022'; c.beginPath(); c.ellipse(0, -2.4 * s, 13 * s, 5 * s, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(7 * s, -4 * s); c.quadraticCurveTo(9 * s, -9 * s, 11 * s, -11 * s); c.lineTo(14 * s, -10 * s); c.quadraticCurveTo(12 * s, -6 * s, 12 * s, -3 * s); c.closePath(); c.fill();
  c.fillStyle = dk ? '#122220' : '#1C3430'; c.beginPath(); c.arc(12 * s, -11 * s, 3.4 * s, 0, 7); c.fill();
  c.fillStyle = dk ? '#2A3236' : '#2E3A3C'; c.beginPath(); c.moveTo(15 * s, -12 * s); c.lineTo(21 * s, -10.4 * s); c.lineTo(15 * s, -9.4 * s); c.closePath(); c.fill();
  c.fillStyle = '#E0302A'; c.beginPath(); c.arc(13.2 * s, -11.6 * s, 0.8 * s, 0, 7); c.fill();
  c.fillStyle = dk ? 'rgba(220,230,240,0.7)' : 'rgba(255,255,255,0.9)';
  for (var i = 0; i < 9; i++) { var px = -8 * s + i * 1.9 * s, py = -4.6 * s - (i % 2) * 1.3 * s; if (i < 8) c.fillRect(px, py, 1 * s, 0.9 * s); }
  c.fillRect(9.4 * s, -8.4 * s, 2 * s, 0.6 * s); c.fillRect(9 * s, -7.2 * s, 2.2 * s, 0.6 * s); }
// a bull moose seen from the side, facing right, waterline at y = 0. lift: 0 = drinking with the muzzle at the water, 1 = head up.
// walk: the leg swing phase (0 = standing)
function canada_moose(c, s, lift, walk, dk) {
  var body = dk ? '#2E2420' : '#5A3A26', legC = dk ? '#221A18' : '#3E2818', ant = dk ? '#A89878' : '#DCC8A0', light = dk ? '#3E3028' : '#7A5236';
  c.save(); c.scale(s, s); c.lineCap = 'round';
  var legs = [[-24, 1], [-15, -1], [15, -1], [24, 1]];
  legs.forEach(function (l, i) { var sw = Math.sin(walk + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * (walk ? 0.32 : 0), kx = l[0] + Math.sin(sw) * 9 + (i > 1 ? 1.5 : -1.5), hx = l[0] + Math.sin(sw * 1.4) * 18, far = i === 0 || i === 3;
    c.strokeStyle = far ? legC : body; c.lineWidth = 7; c.beginPath(); c.moveTo(l[0], -46); c.lineTo(kx, -22); c.stroke();
    c.strokeStyle = far ? (dk ? '#3E3430' : '#7A6450') : (dk ? '#4E423C' : '#9A8268'); c.lineWidth = 4; c.beginPath(); c.moveTo(kx, -22); c.lineTo(hx, 14); c.stroke();
    c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(kx, -22, 2.6, 0, 7); c.fill(); });
  c.fillStyle = body; c.beginPath(); c.ellipse(0, -50, 33, 14, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(15, -58, 18, 13, -0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(-23, -51, 14, 13, 0, 0, 7); c.fill();
  c.fillStyle = light; c.beginPath(); c.ellipse(-4, -58, 18, 4, -0.05, 0, 7); c.fill();
  c.fillStyle = body; c.beginPath(); c.ellipse(-36, -54, 3, 5, 0.4, 0, 7); c.fill();
  // neck and head pivot at the shoulder
  var a = 1.22 - lift * 1.36; c.save(); c.translate(22, -60); c.rotate(a);
  c.fillStyle = body; c.beginPath(); c.moveTo(-6, -11); c.lineTo(24, -8); c.lineTo(26, 9); c.lineTo(-4, 14); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(20, -9); c.lineTo(42, -8); c.quadraticCurveTo(52, -6, 55, 1); c.quadraticCurveTo(55, 9, 47, 9); c.lineTo(34, 8); c.lineTo(22, 10); c.closePath(); c.fill();
  c.fillStyle = light; c.beginPath(); c.ellipse(49, 2, 7, 6.4, 0, 0, 7); c.fill();
  c.fillStyle = body; c.beginPath(); c.moveTo(28, 9); c.quadraticCurveTo(26, 22, 31, 24); c.quadraticCurveTo(34, 18, 34, 9); c.closePath(); c.fill();   // the bell
  c.fillStyle = dk ? '#0A0808' : '#1E140E'; c.beginPath(); c.arc(52, 0, 1.4, 0, 7); c.fill(); c.beginPath(); c.arc(34, -3, 1.6, 0, 7); c.fill();
  c.fillStyle = body; c.beginPath(); c.ellipse(22, -12, 6, 2.6, -0.9, 0, 7); c.fill();
  // palmate antlers
  c.fillStyle = ant; c.beginPath(); c.moveTo(27, -8); c.lineTo(18, -16); c.lineTo(10, -20); c.lineTo(13, -23); c.lineTo(8, -29); c.lineTo(15, -27); c.lineTo(15, -35); c.lineTo(20, -29); c.lineTo(24, -36); c.lineTo(26, -28); c.lineTo(33, -33); c.lineTo(32, -24); c.lineTo(38, -24); c.quadraticCurveTo(34, -14, 30, -8); c.closePath(); c.fill();
  c.restore(); c.restore(); }
// a national flag waving from its pole at (F.x, F.y): bands (vertical when vert) in cols, an optional emblem drawn by em
function canada_flag(c, F, t, vert, cols, em, dk) { var top = [], bot = [], k, u, wv = function (u2) { return Math.sin(u2 * Math.PI * 1.6 - t * 2.2) * F.h * 0.08 * u2; };
  var pt = function (u2, v2) { return [F.x + F.w * u2, F.y + F.h * v2 + wv(u2)]; }, piece = function (u0, u1, v0, v1) { var p = [], q; for (q = 0; q <= 8; q++) p.push(pt(u0 + (u1 - u0) * q / 8, v0)); for (q = 8; q >= 0; q--) p.push(pt(u0 + (u1 - u0) * q / 8, v1)); c.beginPath(); p.forEach(function (pp, i) { if (i) c.lineTo(pp[0], pp[1]); else c.moveTo(pp[0], pp[1]); }); c.closePath(); c.fill(); };
  var dim = function (h) { if (!dk) return h; var n = parseInt(h.slice(1), 16); return 'rgb(' + Math.round((n >> 16) * 0.8) + ',' + Math.round(((n >> 8) & 255) * 0.8) + ',' + Math.round((n & 255) * 0.8) + ')'; }; // (solid at night too, just a little dimmer)
  c.save(); cols.forEach(function (col, i) { c.fillStyle = dim(col); var a0 = i / cols.length, a1 = (i + 1) / cols.length + 0.004; if (vert) piece(a0, a1, 0, 1); else piece(0, 1, a0, a1); });
  if (em) { var m = pt(0.5, 0.5); em(c, m[0], m[1], F.h); } c.restore(); }
ENGINES.canada = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.C, S = A.S, hz = A.hz, gp = A.gp, T0 = -99, i;
  var gnd = function (x) { return canada_yAt(gp, x); };
  var glowW = canada_rg(dk ? 'rgba(255,190,100,0.6)' : 'rgba(255,220,150,0.3)', [0.35, 0.3]), smokeG = canada_rg(dk ? 'rgba(150,165,190,0.5)' : 'rgba(250,250,248,0.75)', [0.5, 0.6]), ringC = dk ? 'rgba(160,210,240,' : 'rgba(255,255,255,';
  // sky clip (above the peaks) and lake clip (below the far shore, above the near one) for the aurora and its reflection
  var skyClip = new Path2D(), lakeClip = new Path2D();
  skyClip.moveTo(-40, -40); A.sky.forEach(function (p) { skyClip.lineTo(p[0], p[1]); }); skyClip.lineTo(W + 40, -40); skyClip.closePath();
  lakeClip.moveTo(-40, hz + 5); lakeClip.lineTo(W + 40, hz + 5); gp.slice().reverse().forEach(function (p) { lakeClip.lineTo(p[0], p[1] - 2); }); lakeClip.closePath();
  var CLD = canada_sprite(240, 60, 1.5, function (o) { o.fillStyle = dk ? 'rgba(120,140,190,0.55)' : 'rgba(255,255,255,0.95)'; [[-80, 8, 44, 12], [-24, -2, 56, 18], [36, 4, 50, 14], [88, 10, 26, 8], [0, 12, 100, 9]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); }); o.fillStyle = dk ? 'rgba(200,215,240,0.25)' : 'rgba(205,225,240,0.6)'; o.beginPath(); o.ellipse(0, 16, 92, 5, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (k) { return {x: hash(k + 3) * W, y: A.peakY + (k - 0.5) * H * 0.06, s: (ph ? 0.6 : 1) * (0.8 + hash(k + 7) * 0.5), v: 5 + hash(k + 5) * 5}; });
  // aurora rays: a vertical strip, bright at its foot, stretched over each ray
  var RAYG = canada_sprite(4, 128, 1, function (o) { var g = o.createLinearGradient(0, 64, 0, -64); g.addColorStop(0, 'rgba(120,255,190,0)'); g.addColorStop(0.06, 'rgba(120,255,190,0.95)'); g.addColorStop(0.3, 'rgba(70,230,160,0.55)'); g.addColorStop(0.7, 'rgba(110,160,240,0.18)'); g.addColorStop(1, 'rgba(170,110,255,0)'); o.fillStyle = g; o.fillRect(-2, -64, 4, 128); });
  var RAYV = canada_sprite(4, 128, 1, function (o) { var g = o.createLinearGradient(0, 64, 0, -64); g.addColorStop(0, 'rgba(200,120,255,0)'); g.addColorStop(0.08, 'rgba(190,120,255,0.75)'); g.addColorStop(0.45, 'rgba(150,100,240,0.3)'); g.addColorStop(1, 'rgba(120,90,230,0)'); o.fillStyle = g; o.fillRect(-2, -64, 4, 128); });
  // leaves: three colours, a sprite each
  var LC = dk ? [['#C8402E', '#8A2418'], ['#D8742A', '#9A4A18'], ['#E0A23A', '#9A6A1E']] : [['#E0402C', '#9A2216'], ['#F2902E', '#B0561A'], ['#F6BC40', '#B8801E']];
  var LS = LC.map(function (q) { return canada_sprite(24, 24, 3, function (o) { o.fillStyle = q[0]; canada_leafPath(o, 11); o.fill(); o.strokeStyle = q[1]; o.lineWidth = 0.9; o.beginPath(); o.moveTo(0, 8); o.lineTo(0, -8); o.moveTo(0, 1); o.lineTo(6, -4); o.moveTo(0, 1); o.lineTo(-6, -4); o.moveTo(0, 3); o.lineTo(5, 4); o.moveTo(0, 3); o.lineTo(-5, 4); o.stroke(); }); });
  var lakeAt = function (x, y) { return y > hz + 10 && y < gnd(x) - 5; };
  function newLeaf(fresh) { var m = A.maples[Math.floor(Math.random() * A.maples.length)], x = m[0] + (Math.random() - 0.5) * m[2] * 1.6, y = fresh ? m[1] + (Math.random() - 0.5) * m[2] : m[1] + (Math.random() - 0.3) * m[2] * 0.6, wl = gnd(x);
    var land = Math.random() < 0.6 && x > 0 && x < W ? Math.min(wl - 6, Math.max(y + 30, hz + 20 + Math.random() * (wl - hz - 30))) : wl + 6 + Math.random() * 18;
    return {x: x, y: y, land: Math.max(land, y + 10), vy: (12 + Math.random() * 10) * (ph ? 0.8 : 1), ph: Math.random() * 6.28, k: Math.floor(Math.random() * 3), s: (ph ? 7 : 10) * S * (0.8 + Math.random() * 0.4), a: fresh ? 1 : 0}; }
  var gustAt = 0, falling = [], floating = [], gust = [], smoke = [], rings = [], nextSmoke = 0;
  for (i = 0; i < (ph ? 7 : 12); i++) falling.push(newLeaf(true));
  for (i = 0; i < (ph ? 4 : 8); i++) { var fx = W * (0.05 + Math.random() * 0.9), fy = hz + 20 + Math.random() * (gnd(fx) - hz - 30); if (lakeAt(fx, fy)) floating.push({x: fx, y: fy, r: Math.random() * 6.28, k: i % 3, s: (ph ? 7 : 10) * S, age: Math.random() * 10, life: 26}); }
  // loon: glides back and forth across the lower lake and dives now and then
  var loon = {x: W * 0.3, dir: 1, y: hz + (A.bay[2] - hz) * 0.55, s: (ph ? 1 : 1.45) * S, next: 6, dive: -1, under: 0};
  // the loon is drawn in front of the near layer (so it passes in front of the boulders further out in the water), clipped
  // out wherever something nearer stands: the boulders that sit lower than its waterline, the maples and the moose
  var loonMin = W * 0.06, nearRocks = (A.rockP || []).filter(function (r) { return r.bot > loon.y + 2; });
  // is the loon (at x, waterline y) hidden behind one of the nearer boulders? then its reflection and wake are too
  function loonHidden(x, y) { var pts = [[x, y - 3 * loon.s], [x - 10 * loon.s * loon.dir, y - 3 * loon.s], [x + 10 * loon.s * loon.dir, y - 8 * loon.s]];
    return nearRocks.some(function (r) { return pts.some(function (pt) { var c2 = false; for (var i = 0, j = r.p.length - 1; i < r.p.length; j = i++) { var a = r.p[i], b = r.p[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c2 = !c2; } return c2; }); }); }
  function loonClip(c) { var cut = function (add) { var m = new Path2D(); m.rect(-50, -50, W + 100, H + 100); add(m); c.clip(m, 'evenodd'); };
    nearRocks.forEach(function (r) { cut(function (m) { m.moveTo(r.p[0][0], r.p[0][1]); for (var q = 1; q < r.p.length; q++) m.lineTo(r.p[q][0], r.p[q][1]); m.closePath(); }); });
    A.maples.forEach(function (mp) { if (mp[2] < 20) return; cut(function (m) { m.moveTo(mp[0] + mp[2] * 1.2, mp[1]); m.ellipse(mp[0], mp[1], mp[2] * 1.2, mp[2] * 0.95, 0, 0, Math.PI * 2); }); cut(function (m) { m.rect(mp[0] - mp[2] * 0.2, mp[1], mp[2] * 0.4, mp[2] * 2.2); }); });
    if (mo.vis && mo.x != null) cut(function (m) { m.rect(mo.x - 70 * mo.s, mo.y - 110 * mo.s, 140 * mo.s, 112 * mo.s); }); }
  var mo = {x0: A.bay[0], x1: A.bay[1], y0: gnd(A.bay[0]) - 14 * S, y1: A.bay[2] - 22 * S, s: (ph ? 0.8 : 1.05) * S};
  var paddle = {x0: A.canoes[0].x, y0: A.canoes[0].y, x1: W * (ph ? 0.3 : 0.44), y1: hz + (A.bay[2] - hz) * 0.28};
  function ring(x, y, r0) { rings.push({x: x, y: y, r: r0 || 3, age: 0}); }
  return {
    step: function (dt, t, f) {
      var T = t - T0;
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 200) c.x = -200; });
      falling.forEach(function (l, j) { l.a = Math.min(1, l.a + dt); l.y += l.vy * dt * f.s; l.x += (Math.sin(t * 1.3 + l.ph) * 22 + 6) * dt * f.a;
        if (l.y >= l.land) { if (lakeAt(l.x, l.y)) { floating.push({x: l.x, y: l.y, r: t + l.ph, k: l.k, s: l.s, age: 0, life: 22 + Math.random() * 10}); ring(l.x, l.y, 2); } falling[j] = newLeaf(false); } });
      floating.forEach(function (l) { l.age += dt; l.x += 3 * dt * f.s; }); floating = floating.filter(function (l) { return l.age < l.life && l.x < W + 20; });
      // chimney smoke
      if (t > nextSmoke) { nextSmoke = t + 0.45; smoke.push({x: A.chim[0], y: A.chim[1], t0: t, ph: Math.random() * 6.28}); }
      smoke = smoke.filter(function (p) { return t - p.t0 < 7; });
      rings.forEach(function (r) { r.age += dt; }); rings = rings.filter(function (r) { return r.age < 2.4; });
      // the loon
      if (loon.dive < 0) { loon.x += loon.dir * 8 * S * dt * f.s; if (loon.x > W * (ph ? 0.75 : 0.62) && loon.dir > 0) loon.dir = -1; if (loon.x < loonMin && loon.dir < 0) loon.dir = 1; loon.next -= dt; if (loon.next < 0) { loon.dive = 0; ring(loon.x, loon.y, 4); } }
      else { loon.dive += dt; if (loon.dive > 0.7 && !loon.under) { loon.under = 1; } if (loon.dive > 3.6 && loon.under === 1) { loon.under = 2; loon.x = Math.max(loonMin, loon.x + loon.dir * 60 * S); ring(loon.x, loon.y, 4); } if (loon.dive > 4.2) { loon.dive = -1; loon.under = 0; loon.next = 12 + Math.random() * 8; } }
      // the gust of red leaves in the moment
      if (gustAt && t > gustAt) for (i = 0; i < (ph ? 20 : 36); i++) gust.push({x: -40 - Math.random() * W * 0.4, y: hz + 10 + Math.random() * (H - hz) * 0.75, vx: (ph ? 120 : 200) + Math.random() * 140, ph: Math.random() * 6.28, k: i % 3, s: (ph ? 8 : 11) * S * (0.7 + Math.random() * 0.6), w: 1.5 + Math.random() * 2});
      if (gustAt && t > gustAt) gustAt = 0;
      gust.forEach(function (g) { g.x += g.vx * dt; g.y += Math.sin(t * g.w + g.ph) * 50 * dt - 6 * dt; }); gust = gust.filter(function (g) { return g.x < W + 60; });
      // the moose: wade in, drink, lift its head, stand, wade back out (ripples at the legs while it walks)
      var wk = T > 0.4 && T < 4.2 || T > 13 && T < 17.5; if (wk && Math.random() < dt * 3) ring(mo.x + (Math.random() - 0.5) * 40 * mo.s, mo.y + 2, 4);
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, j;
      // clouds drifting past the peaks
      ca.globalAlpha = dk ? 0.45 : 0.9; clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 120 * c.s, c.y - 30 * c.s, 240 * c.s, 60 * c.s); }); ca.globalAlpha = 1;
      // the aurora over the peaks and in the lake
      if (dk) { var rays = function (refl) { ca.save(); ca.globalCompositeOperation = 'lighter'; ca.clip(refl ? lakeClip : skyClip);
          for (var k = 0; k < 2; k++) { var spr = k ? RAYV : RAYG, yb = H * (ph ? 0.2 : 0.2) - k * H * 0.07;
            for (var x = -10; x < W + 10; x += 4) { var y = yb + Math.sin(x / 170 + tt * 0.22 + k * 2) * H * 0.04 + Math.sin(x / 61 - tt * 0.4) * H * 0.012, hh = H * (0.12 + 0.06 * Math.sin(x / 90 + tt * 0.5 + k)), e = 0.5 + 0.5 * Math.sin(x / 260 + tt * 0.09 + k * 2.4), a = (0.28 + 0.22 * Math.sin(x / 23 + tt * 1.6 + k)) * e * e * (k ? 0.7 : 1);
              if (a < 0.02) continue; ca.globalAlpha = a * (refl ? 0.35 : 1); if (refl) { var ry = hz + (hz - y) * 0.7 + 8; ca.drawImage(spr, x, ry, 5, -hh * 0.7); } else ca.drawImage(spr, x, y - hh * 0.06, 5, -hh); } }
          ca.restore(); ca.globalAlpha = 1; };
        rays(false); rays(true);
        // a few of the reflected stars twinkle
        for (j = 0; j < (ph ? 6 : 12); j++) { var sx = hash(j + 90) * W, sy = hz + 20 + hash(j + 91) * (gnd(sx) - hz - 30), al = 0.5 + 0.5 * Math.sin(tt * 2 + j * 1.7); if (!lakeAt(sx, sy)) continue; ca.fillStyle = 'rgba(230,245,255,' + (al * 0.8) + ')'; ca.fillRect(sx - 2.5, sy - 0.5, 5, 1); ca.fillRect(sx - 0.5, sy - 1.5, 1, 3); } }
      // leaves floating on the lake
      floating.forEach(function (l) { var a = Math.min(1, l.age * 2, (l.life - l.age) / 3), s = l.s * 0.9; ca.save(); ca.globalAlpha = a * 0.9; ca.translate(l.x, l.y + Math.sin(tt * 1.4 + l.r) * 0.8); ca.scale(1, 0.45); ca.rotate(l.r); ca.drawImage(LS[l.k], -s, -s, s * 2, s * 2); ca.restore(); });
      // ripple rings
      rings.forEach(function (r) { var u = r.age / 2.4; ca.strokeStyle = ringC + (0.6 * (1 - u)) + ')'; ca.lineWidth = 1; ca.beginPath(); ca.ellipse(r.x, r.y, (r.r + u * 26) * S, (r.r + u * 26) * S * 0.28, 0, 0, 7); ca.stroke(); });
      // the near spruces, their tips swaying (harder in the gust)
      var gu = canada_env(T, 1, 2, 4, 6); ca.fillStyle = C.near;
      var sprDraw = function (c2, s, k) { var lean = (Math.sin(tt * 0.9 + k * 1.3) * 0.6 + Math.sin(tt * 2.1 + k) * 0.25) * s[2] * 0.025 * f.a + gu * s[2] * 0.05 * (0.7 + 0.3 * Math.sin(tt * 4 + k)); c2.beginPath(); canada_sprucePts(s[0], s[1] - s[2] * 0.06, s[2], s[3], s[4], lean).forEach(function (p, q) { if (q) c2.lineTo(p[0], p[1]); else c2.moveTo(p[0], p[1]); }); c2.closePath(); c2.fill(); };
      ca.fillStyle = C.woodD; A.spr.forEach(function (s) { if (s[5]) return; var tw2 = s[3] * 0.11; ca.beginPath(); ca.moveTo(s[0] - tw2 * 1.6, s[1] + 2); ca.lineTo(s[0] - tw2 * 0.8, s[1] - s[2] * 0.14); ca.lineTo(s[0] + tw2 * 0.8, s[1] - s[2] * 0.14); ca.lineTo(s[0] + tw2 * 1.6, s[1] + 2); ca.closePath(); ca.fill(); }); ca.fillStyle = C.near;
      A.spr.forEach(function (s, k) { if (!s[5]) sprDraw(ca, s, k); });
      // the canoes bobbing at the dock; in the moment the front one paddles out across the reflection with a beaver aboard
      A.canoes.forEach(function (cn, k) { var x = cn.x, y = cn.y, sc = 1, al = 1, bv = 0, row = 0;
        if (k === 0 && T > 0 && T < 19) { var u = canada_ease((T - 1.6) / 13.4); x = paddle.x0 + (paddle.x1 - paddle.x0) * u; y = paddle.y0 + (paddle.y1 - paddle.y0) * u; sc = 1 - u * 0.45; bv = canada_env(T, 0.6, 1.4, 15, 16.2); row = T > 1.6 && T < 15 ? 1 : 0; al = T < 15.2 ? 1 : T < 16.4 ? 1 - (T - 15.2) / 1.2 : T < 17.4 ? 0 : (T - 17.4) / 1.4; if (T > 16.4) { x = cn.x; y = cn.y; sc = 1; } }
        if (al <= 0) return;
        var L = cn.L * sc, bob = Math.sin(tt * 1.4 + k * 2) * 1.2 * sc, rot = Math.sin(tt * 1.1 + k) * 0.02;
        ca.save(); ca.globalAlpha = al * 0.28; ca.translate(x, y + 2); ca.scale(1, -0.6); canada_hull(ca, L); ca.fillStyle = dk ? '#6A2020' : '#B83A2C'; ca.fill(); ca.restore();
        ca.save(); ca.globalAlpha = al; ca.translate(x, y + bob); ca.rotate(rot);
        canada_canoe(ca, L, dk, bv > 0 ? function () { ca.save(); ca.globalAlpha = al * bv; ca.translate(L * 0.08, -L * 0.04 * (1 - bv)); canada_beaver(ca, L, dk); ca.restore(); } : null);
        if (bv > 0) { var pa = row ? Math.sin(tt * 3.2) : 0, u2 = L / 90; ca.globalAlpha = al * bv; ca.strokeStyle = dk ? '#9A7A50' : '#C8A06A'; ca.lineWidth = 2 * u2; ca.beginPath(); ca.moveTo(-4 * u2 + pa * 8 * u2, -34 * u2); ca.lineTo(4 * u2 - pa * 10 * u2, 8 * u2); ca.stroke(); ca.fillStyle = dk ? '#9A7A50' : '#C8A06A'; ca.beginPath(); ca.ellipse(5 * u2 - pa * 11 * u2, 10 * u2, 2.6 * u2, 6 * u2, -0.2, 0, 7); ca.fill();
          if (row && Math.sin(tt * 3.2) > 0.95 && Math.random() < 0.3) ring(x + 6 * u2, y + 3, 2); }
        ca.restore(); });
      // the moose wades into the shallows from behind the rockpile, drinks, lifts its head, and later wades back out
      mo.vis = T > 0 && T < 19;
      if (T > 0 && T < 19) { var walkIn = canada_ease((T - 0.4) / 3.8), walkOut = canada_ease((T - 13) / 4.5), pos = walkIn - walkOut, mx = mo.x0 + (mo.x1 - mo.x0) * pos, my = mo.y0 + (mo.y1 - mo.y0) * pos, lift = T < 4.4 ? 0.55 - walkIn * 0.55 : T < 5.6 ? 0 : canada_ease((T - 5.6) / 1.1), walking = T > 0.4 && T < 4.2 || T > 13 && T < 17.5, ma = Math.min(1, T * 2, (19 - T) / 1.5);
        if (T > 12.6) lift = 1 - canada_ease((T - 12.6) / 1) * 0.45; var face = T > 12.8 ? -1 : 1; mo.x = mx; mo.y = my;
        ca.save(); ca.globalAlpha = ma; ca.beginPath(); ca.rect(-20, -20, W + 40, my + 21); ca.clip(); ca.translate(mx, my); ca.scale(face, 1); canada_moose(ca, mo.s, lift, walking ? tt * 4 : 0, dk); ca.restore();
        ca.save(); ca.globalAlpha = ma * 0.22; ca.beginPath(); ca.rect(-20, my, W + 40, H); ca.clip(); ca.translate(mx, my); ca.scale(face, -0.75); canada_moose(ca, mo.s, lift, walking ? tt * 4 : 0, dk); ca.restore();
        ca.strokeStyle = ringC + (0.55 * ma) + ')'; ca.lineWidth = 1.2; [-20, -12, 12, 20].forEach(function (lx, q) { var rr = (5 + Math.sin(tt * 2 + q) * 1.5) * mo.s; ca.beginPath(); ca.ellipse(mx + lx * mo.s * face, my + 1, rr * 1.6, rr * 0.4, 0, 0, 7); ca.stroke(); });
        // water drips from its muzzle as it lifts its head
        var dr = canada_env(T, 5.6, 5.9, 7, 7.8); if (dr > 0) { ca.fillStyle = ringC + (0.8 * dr) + ')'; for (j = 0; j < 4; j++) { var du = ((T * 1.6 + j * 0.25) % 1), dxp = mx + (60 + j * 2) * mo.s, dyp = my - 30 * mo.s + du * 30 * mo.s; ca.beginPath(); ca.arc(dxp, dyp, 1.3 * mo.s, 0, 7); ca.fill(); } } }
      // ---- front canvas: chimney smoke, window light, falling and gusting leaves
      smoke.forEach(function (p) { var u = (t - p.t0) / 7, cs = A.chim[2]; canada_dot(cb, smokeG, p.x + u * 46 * cs + Math.sin(u * 5 + p.ph) * 6 * cs, p.y - u * 90 * cs * (ph ? 0.8 : 1), (4 + u * 16) * cs, (1 - u) * Math.min(1, u * 8) * (dk ? 0.6 : 0.8)); });
      if (dk) { A.wins.forEach(function (w, k) { var fl = 0.85 + 0.15 * flick(tt * 0.6, k); cb.save(); cb.globalCompositeOperation = 'lighter'; canada_dot(cb, glowW, w[0] + w[2] / 2, w[1] + w[3] / 2, w[2] * 1.8, fl); cb.restore(); cb.fillStyle = 'rgba(255,196,110,' + (0.85 * fl) + ')'; cb.fillRect(w[0], w[1], w[2], w[3]); cb.fillStyle = 'rgba(80,40,20,0.6)'; cb.fillRect(w[0] + w[2] / 2 - 0.8, w[1], 1.6, w[3]); cb.fillRect(w[0], w[1] + w[3] / 2 - 0.8, w[2], 1.6); }); }
      cb.fillStyle = C.woodD; A.spr.forEach(function (s) { if (!s[5]) return; var tw2 = s[3] * 0.11; cb.beginPath(); cb.moveTo(s[0] - tw2 * 1.6, s[1] + 2); cb.lineTo(s[0] - tw2 * 0.8, s[1] - s[2] * 0.14); cb.lineTo(s[0] + tw2 * 0.8, s[1] - s[2] * 0.14); cb.lineTo(s[0] + tw2 * 1.6, s[1] + 2); cb.closePath(); cb.fill(); });
      cb.fillStyle = C.near; A.spr.forEach(function (s, k) { if (s[5]) sprDraw(cb, s, k); }); // (the spruces by the rockpile stand in front of it)
      // the loon (it tips forward and slips under, then pops up further along)
      if (loon.under !== 1) { cb.save(); loonClip(cb); var dv = loon.dive < 0 ? 0 : loon.dive < 0.7 ? loon.dive / 0.7 : loon.dive > 3.6 ? 1 - (loon.dive - 3.6) / 0.6 : 0, sink = loon.dive >= 0 && loon.dive < 0.7 ? dv : loon.under === 2 ? dv : 0;
        var ly = loon.y + Math.sin(tt * 1.2) * 0.6;
        cb.save(); cb.beginPath(); cb.rect(-20, -20, W + 40, ly - (-20)); cb.clip(); cb.translate(loon.x, ly + sink * 14 * loon.s); cb.scale(loon.dir, 1); cb.rotate(sink * 0.5); canada_loon(cb, loon.s, dk); cb.restore();
        var hid = loonHidden(loon.x, ly); if (!hid) { cb.save(); cb.globalAlpha = 0.25 * (1 - sink); cb.translate(loon.x, ly + 1); cb.scale(loon.dir, -0.7); canada_loon(cb, loon.s, dk); cb.restore(); }
        if (loon.dive < 0 && !hid) { cb.strokeStyle = ringC + '0.5)'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(loon.x - loon.dir * 18 * loon.s, ly + 1); cb.lineTo(loon.x - loon.dir * 40 * loon.s, ly + 2.5); cb.moveTo(loon.x - loon.dir * 16 * loon.s, ly + 2); cb.lineTo(loon.x - loon.dir * 30 * loon.s, ly + 5); cb.stroke(); }  cb.restore(); }
      if (A.caflag) canada_flag(cb, A.caflag, tt, true, ['#D52B1E', '#FFFFFF', '#FFFFFF', '#D52B1E'], function (c, x, y, h) { c.save(); c.translate(x, y + h * 0.04); c.fillStyle = dk ? 'rgb(170,34,24)' : '#D52B1E'; canada_leafPath(c, h * 0.3); c.fill(); c.restore(); }, dk);
      falling.forEach(function (l) { var s = l.s, flip = Math.cos(tt * 2 + l.ph); cb.save(); cb.globalAlpha = l.a; cb.translate(l.x, l.y); cb.rotate(Math.sin(tt * 1.3 + l.ph) * 0.9 + l.ph); cb.scale(0.35 + 0.65 * Math.abs(flip), 1); cb.drawImage(LS[l.k], -s, -s, s * 2, s * 2); cb.restore(); });
      gust.forEach(function (g) { cb.save(); cb.translate(g.x, g.y); cb.rotate(tt * g.w * 2 + g.ph); cb.scale(0.4 + 0.6 * Math.abs(Math.cos(tt * 3 + g.ph)), 1); cb.drawImage(LS[g.k === 2 ? 0 : g.k], -g.s, -g.s, g.s * 2, g.s * 2); cb.restore(); });
    },
    finish: function (t) { T0 = t; gustAt = t + 1; }
  };
};
UIC.canada = {L: ['#1E7480', '#134C56', 'rgba(255,255,255,0.86)', '#17303A', '#4E6670', '#B83A2C', '#B83A2C', '#D9662A', '#FFFFFF'], D: ['#172A50', '#0A1430', 'rgba(14,24,48,0.8)', '#EEF4FA', '#A9BBD0', '#5ED4D0', '#5ED4D0', '#8FE6DC', '#0E1E30']};
