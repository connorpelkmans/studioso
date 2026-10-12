// ---- world theme engine: venice (Venice)
// Loop: a gondolier rows away from us down the canal, under the bridge and out towards the lagoon; the water ripples and
// breaks up the reflections, the moored gondolas bob, flowers in the window boxes and the washing on the line sway,
// shutters swing in the breeze and pigeons peck, hop and flutter off the bridge. Night: windows and the bridge's lanterns
// glow and their light shimmers on the water.
// Moment: the campanile's bells ring out, pigeons burst up over the domes, a fleet of gondolas glides out across the
// lagoon and a sweep of golden light runs down the water towards us.
function venice_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function venice_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return venice_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - venice_ease((T - c) / (d - c)); }
var venice_gc = null;
function venice_rg(col, mid) { var g = (venice_gc || (venice_gc = document.createElement('canvas').getContext('2d'))).createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function venice_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function venice_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function venice_blit(c, sp, x, y, s, rot, a) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (a != null) c.globalAlpha = a; c.drawImage(sp, -sp.w * s / 2, -sp.h * s / 2, sp.w * s, sp.h * s); c.restore(); }
function venice_path(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
// a pigeon standing at (x, y) (its feet), facing dir; peck 0..1 lowers the head, flap > 0 spreads the wings
function venice_pigeon(c, x, y, s, dir, t, peck, flap, dk) {
  var P = dk ? {b: '#6E7290', w: '#82869E', bar: '#2E3044', h: '#5E6280', g: '#4A8A7A', p: '#7A5A92', f: '#C07888'} : {b: '#9EA4B4', w: '#BAC0CC', bar: '#4A4E5C', h: '#868CA0', g: '#5FA888', p: '#9070B0', f: '#E08A96'};
  c.save(); c.translate(x, y); c.scale(s * dir, s); c.lineCap = 'round';
  if (!flap) { c.strokeStyle = P.f; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1, -4); c.lineTo(-2, 0); c.moveTo(2, -4); c.lineTo(2.6, 0); c.stroke(); }
  c.fillStyle = P.b; c.beginPath(); c.moveTo(-6, -7); c.lineTo(-13.6, -5); c.lineTo(-13, -2.4); c.lineTo(-5, -4.4); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0, -7.4, 8, 5.2, -0.12, 0, 7); c.fill();
  if (flap) { var a = Math.sin(t * 30) * 0.9; c.fillStyle = P.w; [1, -1].forEach(function (sd) { c.save(); c.translate(-1, -10); c.rotate(-0.4 + sd * 0.15 + a * (sd > 0 ? 1 : 0.8)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -12, -11, -14); c.lineTo(-8, -6); c.lineTo(-12, -6); c.quadraticCurveTo(-6, -1, 0, 1.5); c.fill(); c.restore(); }); }
  else { c.fillStyle = P.w; c.beginPath(); c.ellipse(-2, -7.6, 6.2, 3.6, -0.12, 0, 7); c.fill(); c.strokeStyle = P.bar; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-5.4, -8.6); c.lineTo(-1.4, -9.2); c.moveTo(-6.4, -6.8); c.lineTo(-2.2, -7.4); c.stroke(); }
  var hy = -12 + peck * 7, hx = 6 + peck * 2.4;
  c.fillStyle = P.h; c.beginPath(); c.moveTo(3, -10); c.quadraticCurveTo(hx - 1, hy + 1, hx, hy - 1); c.lineTo(hx + 2.6, hy + 1); c.quadraticCurveTo(7, -7, 5, -5); c.fill();
  c.globalAlpha = 0.85; c.fillStyle = P.g; c.beginPath(); c.ellipse(4.6, -9.6 + peck * 3, 2.2, 2.6, 0.5, 0, 7); c.fill(); c.fillStyle = P.p; c.beginPath(); c.ellipse(5.2, -8.4 + peck * 3, 1.6, 1.8, 0.5, 0, 7); c.fill(); c.globalAlpha = 1;
  c.fillStyle = P.h; c.beginPath(); c.arc(hx, hy, 2.8, 0, 7); c.fill();
  c.fillStyle = '#3A3430'; c.beginPath(); c.moveTo(hx + 2.4, hy - 0.4); c.lineTo(hx + 5, hy + 0.6); c.lineTo(hx + 2.4, hy + 1); c.fill();
  c.fillStyle = '#E86A3A'; c.beginPath(); c.arc(hx + 0.6, hy - 0.8, 0.9, 0, 7); c.fill(); c.fillStyle = '#1A1418'; c.beginPath(); c.arc(hx + 0.7, hy - 0.8, 0.45, 0, 7); c.fill();
  c.restore(); }
// the gondolier seen from behind, feet at (x, y), k pixels per metre; st -1..1 is where the oar is in its stroke
function venice_gondolier(c, x, y, k, st, dk) {
  var nv = dk ? '#1C1E36' : '#1E2440', wt = dk ? '#C8C4DA' : '#FFFFFF', sk = dk ? '#A07868' : '#D89A74', hr = dk ? '#2A1E1E' : '#3A2A22', hat = dk ? '#B8A070' : '#EAD08A', rb = dk ? '#8A2E3A' : '#C8302E';
  c.save(); c.translate(x, y); c.scale(k, -k); c.lineCap = c.lineJoin = 'round';
  var lean = st * 0.05;
  c.fillStyle = nv; c.beginPath(); c.moveTo(-0.17, 0); c.lineTo(-0.03, 0); c.lineTo(-0.01 + lean, 0.86); c.lineTo(-0.19 + lean, 0.86); c.fill(); c.beginPath(); c.moveTo(0.04, 0); c.lineTo(0.18, 0); c.lineTo(0.2 + lean, 0.86); c.lineTo(0.02 + lean, 0.86); c.fill();
  c.fillStyle = '#2A2228'; c.fillRect(-0.2, 0, 0.18, 0.05); c.fillRect(0.03, 0, 0.18, 0.05);
  c.save(); c.translate(lean, 0); c.fillStyle = wt; c.beginPath(); c.moveTo(-0.21, 0.84); c.lineTo(0.22, 0.84); c.lineTo(0.24, 1.42); c.quadraticCurveTo(0, 1.5, -0.23, 1.42); c.fill();
  c.fillStyle = nv; for (var i = 0; i < 5; i++) c.fillRect(-0.22, 0.9 + i * 0.11, 0.45, 0.05);
  // arms reaching to the oar on the right
  c.strokeStyle = wt; c.lineWidth = 0.1; c.beginPath(); c.moveTo(-0.19, 1.36); c.lineTo(0.08 + st * 0.08, 1.12); c.lineTo(0.34 + st * 0.06, 1.18); c.moveTo(0.2, 1.38); c.lineTo(0.4 + st * 0.06, 1.24); c.stroke();
  c.fillStyle = sk; c.beginPath(); c.arc(0.36 + st * 0.06, 1.2, 0.05, 0, 7); c.fill(); c.fillRect(-0.05, 1.42, 0.1, 0.08);
  c.fillStyle = hr; c.beginPath(); c.arc(0, 1.6, 0.12, 0, 7); c.fill();
  c.fillStyle = hat; c.beginPath(); c.ellipse(0, 1.69, 0.26, 0.05, 0, 0, 7); c.fill(); c.fillRect(-0.15, 1.69, 0.3, 0.12); c.fillStyle = rb; c.fillRect(-0.15, 1.7, 0.3, 0.04);
  c.restore(); c.restore(); }
// a little gondola in profile, far out on the lagoon: waterline centre (x, y), k pixels per metre, heading dir
function venice_gondolaP(c, x, y, k, dir, t, dk) {
  c.save(); c.translate(x, y); c.scale(k * dir, k);
  c.fillStyle = dk ? '#0E0E1A' : '#16161E'; c.beginPath(); c.moveTo(-5.6, -1.6); c.quadraticCurveTo(-5.4, -0.2, -3.6, 0.15); c.quadraticCurveTo(0, 0.4, 3.8, 0.1); c.quadraticCurveTo(5, -0.3, 5.3, -1.4); c.lineTo(5.7, -1.9); c.lineTo(5.1, -2); c.lineTo(4.6, -0.8); c.quadraticCurveTo(0, -0.3, -4.6, -0.7); c.lineTo(-5.1, -1.5); c.closePath(); c.fill();
  c.fillStyle = dk ? '#C8C8D8' : '#D8DCE4'; c.fillRect(5.0, -2.1, 0.5, 0.3);
  var st = Math.sin(t * 2.2);
  c.fillStyle = dk ? '#1C1E36' : '#1E2440'; c.fillRect(-4.2, -2.1, 0.32, 1.5); c.fillStyle = dk ? '#C8C4DA' : '#FFFFFF'; c.fillRect(-4.25, -2.6, 0.42, 0.6);
  c.fillStyle = dk ? '#B8A070' : '#EAD08A'; c.fillRect(-4.35, -2.95, 0.62, 0.12); c.fillRect(-4.2, -3.05, 0.32, 0.12);
  c.strokeStyle = dk ? '#8A7A60' : '#6A5240'; c.lineWidth = 0.12; c.beginPath(); c.moveTo(-3.9, -2.3); c.lineTo(-2.6 + st * 0.6, 0.1); c.stroke();
  c.restore(); }
ENGINES.venice = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, C = A.C, J = A.J, S = A.S, hz = J.hz, i, j;
  var P = function (x, h, z) { return venice_P(J, x, h, z); }, BR = A.br, zB = A.zB;
  function deck(m) { var u = Math.min(1, Math.abs(m) / (J.xs + 1.6)); return 1.2 + BR.deckK * Math.pow(Math.cos(u * Math.PI / 2), 1.25); }
  var BY = function (h) { return hz + (J.e - h) * BR.s; }, BX = function (m) { return J.vx + m * BR.s; };
  var XL = J.vx - J.xs * J.f / A.zEndL, XR = J.vx + J.xs * J.f / A.zEndR;
  // the water seen from the eye: between the two banks' waterlines, and out on the lagoon between the last palazzos
  var WC = new Path2D(), zz; WC.moveTo(XL, hz + 0.5); for (zz = A.zEndL; zz > 5; zz *= 0.9) { var wp = P(-J.xs, 0, zz); WC.lineTo(wp[0], wp[1]); } WC.lineTo(-60, H + 60); WC.lineTo(W + 60, H + 60);
  for (zz = 5; zz < A.zEndR; zz /= 0.9) { var wq = P(J.xs, 0, zz); WC.lineTo(wq[0], wq[1]); } WC.lineTo(XR, hz + 0.5); WC.closePath();
  var lampG = venice_rg(dk ? 'rgba(255,200,120,0.8)' : 'rgba(255,226,170,0.3)', [0.25, 0.35]), winG = venice_rg('rgba(255,196,110,0.45)', [0.3, 0.3]), goldG = venice_rg('rgba(255,210,120,0.7)', [0.3, 0.3]);
  // ripples on the water, in the canal and out on the lagoon: light ones and darker ones that break up the reflections
  var rip = []; for (i = 0; i < (ph ? 60 : 110); i++) { var z = 12 * Math.pow(30, hash(i + 3)), lim = z < A.zEndL ? J.xs * 0.95 : J.xs * z / A.zEndL * 0.98; rip.push({x: (hash(i + 7) * 2 - 1) * lim, z: z, l: 0.6 + hash(i + 9) * 1.8, ph: hash(i + 11) * 6.28, d: hash(i + 13) < 0.35, v: 0.15 + hash(i + 15) * 0.25, lim: lim}); }
  // windows that light up at night: about four in ten, a few switch on and off now and then
  var wins = A.wins.map(function (w) { return {p: new Path2D(w.p), on: w.k < 0.42, k: w.k, r: w.r, s: w.s}; }), nwins = A.nwins.map(function (w) { return {p: new Path2D(w.p), on: w.k < 0.45, k: w.k, r: w.r, s: w.s}; }), nextFlip = 2;
  // the rowing gondola: its stern at rz, moving away down the canal at a pace that looks even on screen
  var lane = J.xs * (ph ? 0.3 : 0.36), rz = 16, wait = 0, rows = 0;
  // the lagoon fleet for the finish
  var fleet = [];
  // flowers in the window boxes: geranium clusters in red, pink and white
  var FL = (dk ? ['#9A3448', '#9A4A78', '#B8B0C8'] : ['#D8403A', '#E8689A', '#FAF2EE']).map(function (fc) { return venice_sprite(30, 30, 3, function (o) {
    o.fillStyle = dk ? '#24403E' : '#4E7E50'; [[-7, 6, 6], [0, 8, 6.4], [7, 6, 6], [-3, 3, 5], [4, 3, 5]].forEach(function (q) { o.beginPath(); o.arc(q[0], q[1], q[2], 0, 7); o.fill(); });
    o.fillStyle = dk ? '#2E5248' : '#6E9E5A'; [[-5, 4, 2.6], [5, 5, 2.4]].forEach(function (q) { o.beginPath(); o.arc(q[0], q[1], q[2], 0, 7); o.fill(); });
    o.fillStyle = fc; [[-6, -3, 4.4], [2, -6, 5], [8, -1, 4]].forEach(function (q) { for (var k = 0; k < 6; k++) { var a = k / 6 * 6.28; o.beginPath(); o.arc(q[0] + Math.cos(a) * q[2] * 0.55, q[1] + Math.sin(a) * q[2] * 0.55, q[2] * 0.5, 0, 7); o.fill(); } });
    o.fillStyle = 'rgba(255,255,255,0.35)'; o.beginPath(); o.arc(1, -8, 1.6, 0, 7); o.arc(-7, -5, 1.3, 0, 7); o.fill(); }); });
  // the washing: a sheet, striped shirts, a skirt and a towel, each swinging from its pegs
  var CLC = dk ? [['#B8B4CC', '#9894B0'], ['#9A4A5A', '#C8C4DA'], ['#B8A070', '#9A8458'], ['#5A78A8', '#8AA4C8'], ['#3E6A5E', '#5A8A7A']] : [['#FFFFFF', '#E6E8EE'], ['#D8443C', '#FFFFFF'], ['#F2CC5A', '#E4B440'], ['#6AA4D8', '#B8D8F2'], ['#3E9A84', '#7AC4AE']];
  function cloth(c, o, t, f) { var a = Math.sin(t * 1.4 + o.x * 0.05) * 0.07 * f.a + Math.sin(t * 3.1 + o.x) * 0.02 * f.a, w = o.w, h = o.h, col = CLC[o.t];
    c.save(); c.translate(o.x, o.y); c.rotate(a); c.fillStyle = col[0];
    var bw = Math.sin(t * 2.4 + o.x * 0.1) * h * 0.04 * f.a;
    if (o.t === 0 || o.t === 4) { c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w / 2 + bw, h); for (var k = 4; k >= 0; k--) c.quadraticCurveTo(-w / 2 + (k + 0.5) * w / 5 + bw, h + (k % 2 ? 2 : -2), -w / 2 + k * w / 5 + bw, h); c.closePath(); c.fill();
      c.fillStyle = col[1]; if (o.t === 4) { c.fillRect(-w / 2, h * 0.75, w, h * 0.08); c.fillRect(-w / 2, h * 0.85, w, h * 0.04); } else { c.globalAlpha = 0.6; c.fillRect(-w / 2, 0, w * 0.08, h); c.globalAlpha = 1; } }
    else if (o.t === 2) { c.beginPath(); c.moveTo(-w * 0.32, 0); c.lineTo(w * 0.32, 0); c.lineTo(w / 2 + bw, h); c.lineTo(-w / 2 + bw, h); c.closePath(); c.fill(); c.fillStyle = col[1]; c.fillRect(-w * 0.32, 0, w * 0.64, h * 0.1); }
    else { c.beginPath(); c.moveTo(-w * 0.3, 0); c.lineTo(w * 0.3, 0); c.lineTo(w * 0.55, h * 0.12); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w * 0.36, h * 0.38); c.lineTo(w * 0.34 + bw, h); c.lineTo(-w * 0.34 + bw, h); c.lineTo(-w * 0.36, h * 0.38); c.lineTo(-w * 0.62, h * 0.42); c.lineTo(-w * 0.55, h * 0.12); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = col[1]; for (var y2 = h * 0.08; y2 < h; y2 += h * 0.16) c.fillRect(-w, y2, w * 2, h * 0.07); c.restore(); }
    c.fillStyle = dk ? '#7A6A5A' : '#B88A5A'; c.fillRect(-w * 0.3 - 1, -2, 2, 4); c.fillRect(w * 0.3 - 1, -2, 2, 4);
    c.restore(); }
  // pigeons on the bridge's parapet, and one on a pole by the near water door
  var pigs = [], pS = BR.s * 0.024;
  for (i = 0; i < (ph ? 3 : 5); i++) { var pm = (hash(i + 41) * 2 - 1) * BR.xe * 0.82; pigs.push({m: pm, hm: pm, x: 0, y: 0, dir: hash(i + 43) < 0.5 ? -1 : 1, st: 'idle', tt: hash(i + 44) * 2, dur: 1, z: 0, peck: 0, x0: 0, fx: 0, s: pS}); }
  function pigNext(p) { var r = Math.random(); p.st = r < 0.4 ? 'peck' : r < 0.78 ? 'hop' : r < 0.94 ? 'idle' : 'fly'; p.dur = p.st === 'peck' ? 0.7 : p.st === 'hop' ? 0.32 : p.st === 'fly' ? 3.2 : 0.8 + Math.random() * 1.4; p.tt = 0; p.x0 = p.m;
    if (p.st === 'hop') { if (Math.random() < 0.3) p.dir *= -1; p.fx = Math.max(-BR.xe * 0.85, Math.min(BR.xe * 0.85, p.m + p.dir * (0.3 + Math.random() * 0.5))); }
    if (p.st === 'fly') { p.fx = (Math.random() * 2 - 1) * BR.xe * 0.82; p.dir = p.fx > p.m ? 1 : -1; } }
  // birds of the finish: a flock rising off the domes
  var flock = [];
  var lastT = 0;
  function drawG3(c, G, kind, a) {
    c.save(); if (a != null) c.globalAlpha = a;
    var gr = c.createLinearGradient(0, Math.min(G.stern[1], G.bow[1]) - 20, 0, Math.max(G.stern[1], G.bow[1]) + 10); gr.addColorStop(0, dk ? '#22223A' : '#2A2A36'); gr.addColorStop(1, dk ? '#0A0A16' : '#121218');
    c.fillStyle = gr; venice_path(c, G.hull); c.fill();
    if (G.inner.length > 4) { c.fillStyle = dk ? '#2E2230' : '#4A3226'; venice_path(c, G.inner); c.fill(); c.strokeStyle = dk ? 'rgba(200,170,110,0.4)' : 'rgba(214,170,80,0.7)'; c.lineWidth = 0.8; c.beginPath(); for (var q = 2; q < G.inner.length / 2 - 1; q += 2) { var a1 = G.inner[q], a2 = G.inner[G.inner.length - 1 - q]; c.moveTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); } c.stroke(); }
    c.fillStyle = dk ? '#C8C8D8' : '#E0E4EC'; venice_path(c, G.fer); c.fill();
    c.fillStyle = kind ? (dk ? '#5A2838' : '#9A2A30') : (dk ? '#24345E' : '#2E4E8E'); venice_path(c, G.cov); c.fill();
    if (!kind) { c.strokeStyle = dk ? 'rgba(160,170,220,0.35)' : 'rgba(255,255,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(G.cov[0][0], G.cov[0][1]); for (var k = 1; k < 9; k++) c.lineTo(G.cov[k][0], G.cov[k][1]); c.stroke(); }
    c.strokeStyle = dk ? 'rgba(220,190,120,0.5)' : 'rgba(214,170,80,0.85)'; c.lineWidth = 1; c.beginPath(); for (k = 2; k < 16; k++) { var p = G.hull[k]; if (k === 2) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); } c.stroke();
    c.restore(); }
  function rowing(c, part, t) {
    if (wait > 0) return;
    var st = Math.sin(t * 2.1), lift = Math.sin(t * 1.7) * 0.04, G = venice_gondola3(J, lane, rz, lift, Math.sin(t * 1.3) * 0.02, 1), fade = rz > 180 ? Math.max(0, 1 - (rz - 180) / 80) : 1, zg = rz + 0.9;
    if (part === 'hull') {
      // wake, reflection, hull
      c.save(); c.globalAlpha = fade; c.strokeStyle = dk ? 'rgba(180,190,255,0.25)' : 'rgba(255,255,255,0.6)'; c.lineWidth = Math.max(0.6, J.f / rz * 0.05);
      c.beginPath(); [-1, 1].forEach(function (sd) { for (var q = 0; q < 3; q++) { var za = rz - 0.6 - q * 1.6, zb = za - 1.2, a1 = P(lane + sd * (0.8 + (rz - za) * 0.3), 0, za), a2 = P(lane + sd * (0.8 + (rz - zb) * 0.3), 0, zb); if (zb > 4) { c.moveTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); } } }); c.stroke(); c.restore();
      var Rf = venice_gondola3(J, lane, rz, lift, 0, 1, -1); c.save(); c.globalAlpha = (dk ? 0.3 : 0.22) * fade; c.fillStyle = '#10141C'; venice_path(c, Rf.hull); c.fill(); c.restore();
      drawG3(c, G, 1, fade);
    } else {
      // the gondolier on the stern deck and his oar, worked against the forcola on the right
      var ft = P(lane, 0.55, zg), k = J.f / zg, hand = P(lane + 0.38 + st * 0.06, 1.2, zg), blade = P(lane + 1.05, -0.1, zg + 2.6 + st * 0.9), fork = P(lane + 0.62, 0.95, zg + 0.9);
      c.save(); c.globalAlpha = fade;
      c.fillStyle = dk ? '#3A2A22' : '#6A4430'; c.fillRect(fork[0] - 0.05 * k, fork[1], 0.1 * k, 0.4 * k);
      c.strokeStyle = dk ? '#7A6A58' : '#A8865A'; c.lineCap = 'round'; c.lineWidth = Math.max(0.8, 0.07 * k); c.beginPath(); c.moveTo(hand[0], hand[1]); c.lineTo(blade[0], blade[1]); c.stroke();
      c.strokeStyle = dk ? 'rgba(180,190,255,0.3)' : 'rgba(255,255,255,0.7)'; c.lineWidth = Math.max(0.6, 0.04 * k); c.beginPath(); c.ellipse(blade[0], blade[1], 0.4 * k, 0.08 * k, 0, 0, 7); c.stroke();
      venice_gondolier(c, ft[0], ft[1], k, st, dk); c.restore();
    } }
  return {
    step: function (dt, t, f) {
      lastT = t;
      if (wait > 0) { wait -= dt * f.s; if (wait <= 0) { rz = 16; rows++; } } else { rz += rz * 0.075 * dt * f.s; if (rz > 260) { wait = 6; } }
      rip.forEach(function (r) { r.x += r.v * dt * f.s; if (r.x > r.lim) r.x = -r.lim; });
      if (dk && t > nextFlip) { var w = wins[Math.floor(Math.random() * wins.length)]; if (w) w.on = !w.on; nextFlip = t + 1.5 + Math.random() * 3; }
      pigs.forEach(function (p) { p.tt += dt * f.s; var u = Math.max(0, Math.min(1, p.tt / p.dur));
        p.peck = p.st === 'peck' && Math.sin(u * Math.PI * 2) > 0 ? Math.sin(u * Math.PI * 2) : 0;
        if (p.st === 'hop') { p.m = p.x0 + (p.fx - p.x0) * u; p.z = Math.sin(u * Math.PI) * 0.25; }
        else if (p.st === 'fly' || p.st === 'burst') { p.m = p.x0 + (p.fx - p.x0) * venice_ease(u); p.z = Math.sin(u * Math.PI) * (p.st === 'burst' ? 9 : 2.6); }
        else p.z = 0;
        if (u >= 1) { p.z = 0; pigNext(p); } });
      fleet.forEach(function (g) { g.t += dt * f.s; });
      flock.forEach(function (b) { b.t += dt * f.s; if (b.t > 0) { b.x += b.vx * dt * f.s; b.y += b.vy * dt * f.s; b.vy += 4 * dt * f.s; b.vx += Math.sin(b.t * 2 + b.ph) * 6 * dt; } });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, Tm = t - T0, bells = venice_env(Tm, 0, 0.3, 5.5, 7), gold = venice_env(Tm, 0.8, 2, 6.5, 9), i2;
      // ---- back canvas (over the far banks, under the bridge and the near palazzos)
      // the finish: a warm glow over the lagoon, the bells ringing out from the campanile
      if (gold > 0) { ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; venice_dot(ca, goldG, A.SM.domes[0], hz, W * 0.35, gold * (dk ? 0.5 : 0.45)); ca.restore(); }
      if (bells > 0) { var B = A.SM.bell, ring = (Tm % 0.9) / 0.9, sw = Math.sin(Tm * 7);
        ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; venice_dot(ca, goldG, B[0], B[1], A.sk * 9 * (1 + 0.3 * (1 - ring)), bells * (0.5 + 0.4 * (1 - ring)));
        ca.strokeStyle = dk ? 'rgba(255,226,160,1)' : 'rgba(255,250,235,1)'; ca.lineCap = 'round';
        for (i = 0; i < 3; i++) { var rr = ((Tm + i * 0.3) % 0.9) / 0.9, R = A.sk * (8 + rr * 26); ca.globalAlpha = bells * (1 - rr) * 0.9; ca.lineWidth = Math.max(1, A.sk * 0.6);
          [-1, 1].forEach(function (sd) { ca.beginPath(); ca.arc(B[0], B[1], R, sd < 0 ? Math.PI * 0.75 : -Math.PI * 0.25, sd < 0 ? Math.PI * 1.25 : Math.PI * 0.25); ca.stroke(); }); }
        ca.globalAlpha = bells; ca.fillStyle = '#E8B84A'; ca.save(); ca.translate(B[0], B[1] - A.sk * 2.4); ca.rotate(sw * 0.5); ca.beginPath(); ca.moveTo(-A.sk * 1.1, A.sk * 2.6); ca.quadraticCurveTo(-A.sk * 0.8, 0, 0, 0); ca.quadraticCurveTo(A.sk * 0.8, 0, A.sk * 1.1, A.sk * 2.6); ca.closePath(); ca.fill(); ca.restore();
        ca.restore(); }
      // lit windows on the far banks, and the light they throw on the water
      if (dk) { ca.save(); wins.forEach(function (w) { if (!w.on) return; ca.fillStyle = w.k < 0.15 ? '#FFE2A8' : '#F6C070'; ca.globalAlpha = 0.95; ca.fill(w.p); }); ca.restore(); }
      // the water: ripples and, at night, lights shimmering
      ca.save(); ca.clip(WC); ca.lineCap = 'round';
      rip.forEach(function (r) { var p = P(r.x, 0, r.z), k = J.f / r.z, a = 0.5 + 0.5 * Math.sin(tt * 1.3 + r.ph); if (r.z > A.zEndL && (p[0] < XL || p[0] > XR)) return;
        ca.strokeStyle = r.d ? (dk ? 'rgba(10,16,40,' + (0.45 * a) + ')' : 'rgba(40,110,104,' + (0.55 * a) + ')') : (dk ? 'rgba(170,190,255,' + (0.3 * a) + ')' : 'rgba(255,255,255,' + (0.7 * a) + ')');
        ca.lineWidth = Math.max(0.7, k * 0.05); var L = r.l * k * (0.8 + 0.2 * Math.sin(tt + r.ph)); ca.beginPath(); ca.moveTo(p[0] - L / 2, p[1]); ca.lineTo(p[0] + L / 2, p[1]); ca.stroke(); });
      if (dk) { ca.globalCompositeOperation = 'lighter';
        wins.concat(nwins).forEach(function (w, n) { if (!w.on || w.r[1] < hz + 2) return; for (var q = 0; q < 3; q++) { var yy = w.r[1] + (q - 1) * w.s * 0.35, ww = w.s * (0.5 + 0.3 * Math.sin(tt * 2.2 + n + q)); ca.fillStyle = 'rgba(255,196,110,' + (0.22 + 0.1 * Math.sin(tt * 3 + n * 1.7 + q)) + ')'; ca.fillRect(w.r[0] - ww / 2 + Math.sin(tt * 1.7 + n + q) * w.s * 0.15, yy, ww, Math.max(1, w.s * 0.08)); } });
        A.lamps.forEach(function (l, n) { for (var q = 0; q < 12; q++) { var yy = l[3] - q * l[2] * 6, ww = l[2] * (10 - q * 0.5) * (0.6 + 0.4 * Math.sin(tt * 2.6 + q * 1.3 + n)); if (yy < hz) break; ca.fillStyle = 'rgba(255,206,120,' + (0.5 - q * 0.035) + ')'; ca.fillRect(l[0] - ww / 2 + Math.sin(tt * 1.9 + q) * l[2] * 2, yy, ww, Math.max(1, l[2] * 1.4)); } });
        ca.globalCompositeOperation = 'source-over'; }
      // the finish's sweep of golden light, running down the water from the lagoon towards us, glittering
      if (gold > 0) { var u = venice_ease((Tm - 0.8) / 3.4), yc = hz + (H - hz) * u, bh = (H - hz) * (0.12 + 0.3 * u);
        ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
        var g = ca.createLinearGradient(0, yc - bh, 0, yc + bh); g.addColorStop(0, 'rgba(255,214,120,0)'); g.addColorStop(0.5, 'rgba(255,214,120,' + (gold * (dk ? 0.38 : 0.6)) + ')'); g.addColorStop(1, 'rgba(255,214,120,0)'); ca.fillStyle = g; ca.fillRect(-10, yc - bh, W + 20, bh * 2);
        var g2 = ca.createLinearGradient(0, hz, 0, H); g2.addColorStop(0, 'rgba(255,214,120,' + (gold * (dk ? 0.3 : 0.4)) + ')'); g2.addColorStop(1, 'rgba(255,220,140,0)'); ca.fillStyle = g2; ca.fillRect(-10, hz, W + 20, (yc - hz));
        for (i = 0; i < (ph ? 50 : 110); i++) { var gx = W * hash(i * 1.7 + 4), gy = hz + (H - hz) * Math.pow(hash(i * 2.3 + 1), 1.6); if (gy > yc + bh) continue; var sh = 0.5 + 0.5 * Math.sin(t * 7 + i * 1.3); ca.fillStyle = 'rgba(255,240,190,' + (gold * sh * 0.9) + ')'; var gl = 3 + (gy - hz) / (H - hz) * 16; ca.fillRect(gx - gl / 2, gy, gl, 1 + (gy - hz) / (H - hz) * 1.6); }
        ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      // the lagoon fleet: little gondolas gliding across the basin in the finish
      if (fleet.length) { ca.save(); ca.beginPath(); ca.rect(XL, hz - H * 0.1, XR - XL, H * 0.3); ca.clip();
        fleet.forEach(function (g) { if (g.t < 0) return; var k = J.f / g.z, x = XL - 60 + g.t * g.v * k, y = hz + J.e * k + Math.sin(t * 1.6 + g.z) * 0.3, al = Math.min(1, g.t * 0.8) * Math.min(1, Math.max(0, 14 - g.t) / 2);
          ca.globalAlpha = al * 0.35; ca.save(); ca.translate(0, 2 * y); ca.scale(1, -1); venice_gondolaP(ca, x, y, k, 1, t + g.z, dk); ca.restore(); ca.globalAlpha = al; venice_gondolaP(ca, x, y, k, 1, t + g.z, dk);
          ca.strokeStyle = dk ? 'rgba(255,220,150,0.5)' : 'rgba(255,255,255,0.8)'; ca.lineWidth = 0.8; ca.beginPath(); ca.moveTo(x - 6 * k, y + 0.5); ca.lineTo(x - 12 * k, y + 1.2); ca.stroke(); });
        ca.restore(); }
      // the rowing gondola: behind the bridge once past it
      var hullFar = rz + 10.8 > zB, manFar = rz + 0.9 > zB;
      if (hullFar) rowing(ca, 'hull', tt); if (manFar) rowing(ca, 'man', tt);
      // the flock off the domes
      if (flock.length) { ca.save(); ca.strokeStyle = dk ? 'rgba(220,220,240,0.9)' : 'rgba(70,70,90,0.85)'; ca.lineCap = 'round';
        flock.forEach(function (b) { if (b.t < 0 || b.t > 7) return; var wv = Math.sin(t * 16 + b.ph) * b.s * 0.6; ca.globalAlpha = Math.min(1, (7 - b.t) / 1.5); ca.lineWidth = Math.max(0.8, b.s * 0.3); ca.beginPath(); ca.moveTo(b.x - b.s, b.y - wv); ca.quadraticCurveTo(b.x - b.s * 0.4, b.y - b.s * 0.3, b.x, b.y); ca.quadraticCurveTo(b.x + b.s * 0.4, b.y - b.s * 0.3, b.x + b.s, b.y - wv); ca.stroke(); });
        ca.restore(); }
      // ---- front canvas (over the bridge and the near palazzos)
      // moored gondolas bob at the near steps, tied to the poles
      A.moor.forEach(function (m, n) { var lift = Math.sin(tt * 1.1 + n * 1.7) * 0.05 * f.a, roll = Math.sin(tt * 0.8 + n) * 0.03 * f.a, G = venice_gondola3(J, m.x, m.z, lift, roll, m.dir), Rf = venice_gondola3(J, m.x, m.z, lift, 0, m.dir, -1);
        cb.save(); cb.globalAlpha = dk ? 0.3 : 0.22; cb.fillStyle = '#10141C'; venice_path(cb, Rf.hull); cb.fill(); cb.restore(); drawG3(cb, G, 0); });
      if (!hullFar) rowing(cb, 'hull', tt); if (!manFar) rowing(cb, 'man', tt);
      // shutters swinging in the breeze
      A.shut.forEach(function (s, n) { var th = 0.35 + 0.9 * Math.pow(0.5 + 0.5 * Math.sin(tt * 0.5 + n * 2.1), 3) * f.a + Math.sin(tt * 3 + n) * 0.04;
        [-1, 1].forEach(function (sd) { var hg = s.u + sd * s.w / 2, oz = hg + sd * 0.42 * Math.cos(th), ox = s.xs - s.sg * 0.42 * Math.sin(th), pts = [P(s.xs, s.v, hg), P(ox, s.v, oz), P(ox, s.v + s.h, oz), P(s.xs, s.v + s.h, hg)];
          cb.fillStyle = dk ? '#24403E' : '#4E7E58'; venice_path(cb, pts); cb.fill();
          cb.strokeStyle = dk ? 'rgba(0,0,20,0.35)' : 'rgba(20,40,20,0.3)'; cb.lineWidth = 0.8; cb.beginPath(); for (var q = 1; q < 8; q++) { var a1 = P(s.xs, s.v + s.h * q / 8, hg), a2 = P(ox, s.v + s.h * q / 8, oz); cb.moveTo(a1[0], a1[1]); cb.lineTo(a2[0], a2[1]); } cb.stroke(); }); });
      // lit windows of the near palazzos at night
      if (dk) { cb.save(); nwins.forEach(function (w) { if (!w.on) return; cb.fillStyle = w.k < 0.15 ? '#FFE2A8' : '#F6C070'; cb.globalAlpha = 0.95; cb.fill(w.p); }); cb.restore(); }
      // flowers swaying in the window boxes
      A.flw.forEach(function (fl, n) { venice_blit(cb, FL[fl[3]], fl[0], fl[1] - fl[2] * 0.12, fl[2] * 0.02, Math.sin(tt * 1.5 + n * 0.7) * 0.08 * f.a); });
      // the washing on the line
      A.cloth.forEach(function (o) { cloth(cb, o, tt, f); });
      // pigeons on the parapet
      pigs.forEach(function (p) { var yb = BY(deck(p.m) + 1.22), x = BX(p.m), ps = p.s, flying = p.st === 'fly' || p.st === 'burst';
        if (!flying) { cb.fillStyle = dk ? 'rgba(0,0,10,0.25)' : 'rgba(60,40,20,0.16)'; cb.beginPath(); cb.ellipse(x, yb, 6 * ps, 1.2 * ps, 0, 0, 7); cb.fill(); }
        venice_pigeon(cb, x, yb - p.z * BR.s, ps, p.dir, t, p.peck, flying && p.z > 0.05, dk); });
      // the bridge's lanterns and the wall lantern: glass and glow
      A.lamps.forEach(function (l, n) { cb.save(); cb.fillStyle = dk ? '#FFD890' : 'rgba(255,248,230,0.85)'; cb.fillRect(l[0] - 4 * l[2], l[1] - 9 * l[2], 8 * l[2], 18 * l[2] * 0.95); cb.restore();
        if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; venice_dot(cb, lampG, l[0], l[1], 34 * l[2] * (ph ? 1.2 : 1), 0.8 + 0.08 * Math.sin(tt * 2 + n)); cb.restore(); } });
    },
    finish: function (t) { T0 = t;
      pigs.forEach(function (p, k) { p.st = 'burst'; p.dur = 3.6 + k * 0.3; p.tt = -k * 0.12; p.x0 = p.m; p.fx = (Math.random() * 2 - 1) * BR.xe * 0.8; p.dir = p.fx > p.m ? 1 : -1; });
      fleet = []; for (var k = 0; k < (ph ? 4 : 6); k++) fleet.push({z: 150 + k * 22 + Math.random() * 10, t: -0.6 - k * 0.7, v: 2.2 + Math.random() * 0.6});
      var D = A.SM.domes; flock = []; for (k = 0; k < (ph ? 22 : 36); k++) flock.push({x: D[0] + (Math.random() - 0.5) * A.sk * 40, y: D[1] + Math.random() * A.sk * 8, vx: (Math.random() - 0.5) * 60 * A.sk / 2.4, vy: -(30 + Math.random() * 40) * A.sk / 2.4, s: (2 + Math.random() * 2) * A.sk / 2.4, t: -Math.random() * 0.8 - 0.3, ph: Math.random() * 6});
      if (wait > 0 || rz > 120) { wait = 0; rz = 16; } }
  };
};
UIC.venice = {L: ['#357A74', '#22504C', 'rgba(255,253,250,0.86)', '#1F2E2C', '#5C6866', '#A84A32', '#A84A32', '#C9784C', '#FFFFFF'], D: ['#262C60', '#121834', 'rgba(22,26,58,0.8)', '#F4F0FA', '#B8B4D6', '#F2C878', '#F2C878', '#F6DA9E', '#161A3A']};
