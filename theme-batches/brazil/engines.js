// ---- batch brazil engines: brazil
function brazil_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function brazil_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return brazil_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - brazil_ease((T - c) / (d - c)); }
var brazil_gc = null;
function brazil_ctx() { return brazil_gc || (brazil_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with brazil_dot)
function brazil_rg(col, mid) { var g = brazil_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function brazil_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function brazil_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
// a magnificent frigatebird seen from below: long crooked wings and a forked tail; flap -1 .. 1
function brazil_frigate(c, x, y, s, flap, col) { var f = flap * 5 * s;
  c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.moveTo(0, -1.2 * s);
  c.quadraticCurveTo(-6 * s, -5 * s - f, -11 * s, -6 * s - f); c.quadraticCurveTo(-18 * s, -3 * s - f * 0.4, -27 * s, 3 * s - f * 0.2); c.quadraticCurveTo(-17 * s, -1 * s - f * 0.3, -10 * s, -2.6 * s - f * 0.7); c.quadraticCurveTo(-5 * s, -0.6 * s - f * 0.3, -1.4 * s, 2 * s);
  c.lineTo(-3.4 * s, 12 * s); c.lineTo(0, 6 * s); c.lineTo(3.4 * s, 12 * s); c.lineTo(1.4 * s, 2 * s);
  c.quadraticCurveTo(5 * s, -0.6 * s - f * 0.3, 10 * s, -2.6 * s - f * 0.7); c.quadraticCurveTo(17 * s, -1 * s - f * 0.3, 27 * s, 3 * s - f * 0.2); c.quadraticCurveTo(18 * s, -3 * s - f * 0.4, 11 * s, -6 * s - f); c.quadraticCurveTo(6 * s, -5 * s - f, 0, -1.2 * s); c.fill();
  c.beginPath(); c.arc(0, -1.6 * s, 1.9 * s, 0, 7); c.fill(); c.restore(); }
// a macaw or parrot in flight facing +x; kind 0 scarlet macaw, 1 blue-and-yellow macaw, 2 green parrot; flap -1 (down) .. 1 (up)
var brazil_BIRD = [{body: '#E2302A', wing: '#2A6AD0', cov: '#FFC81E', sh: '#E2302A', tail: '#D8282A', tip: '#2A6AD0', belly: '#E2302A', L: 1},
  {body: '#2A8AE0', wing: '#1E62C0', cov: '#2A8AE0', sh: '#36A0E8', tail: '#1E70D0', tip: '#1E62C0', belly: '#FFC21E', L: 1},
  {body: '#3CB44A', wing: '#2E9A3E', cov: '#5CCB5A', sh: '#3CB44A', tail: '#3CA848', tip: '#2E86C8', belly: '#7CD45A', L: 0.55}];
function brazil_macaw(c, x, y, s, flap, kind, dk) { var K = brazil_BIRD[kind], L = K.L;
  c.save(); c.translate(x, y); if (dk) c.globalAlpha = 0.92;
  var wing = function (dy, col, cov, shade) { c.fillStyle = col; c.beginPath(); c.moveTo(4 * s, -1 * s); c.quadraticCurveTo(-2 * s, dy * 0.6, -10 * s, dy); c.quadraticCurveTo(-6 * s, dy * 0.4, -5 * s, 1 * s); c.closePath(); c.fill();
    c.fillStyle = cov; c.beginPath(); c.moveTo(4 * s, -1 * s); c.quadraticCurveTo(0, dy * 0.35, -4 * s, dy * 0.55); c.quadraticCurveTo(-3 * s, dy * 0.2, -3 * s, 1 * s); c.closePath(); c.fill();
    if (shade) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(4 * s, -1 * s); c.quadraticCurveTo(-2 * s, dy * 0.6, -10 * s, dy); c.quadraticCurveTo(-6 * s, dy * 0.4, -5 * s, 1 * s); c.closePath(); c.fill(); } };
  wing(-20 * s * flap + 2 * s, K.wing, K.cov, true);
  // the long tail, then the body and head
  c.fillStyle = K.tail; c.beginPath(); c.moveTo(-5 * s, -1.6 * s); c.quadraticCurveTo(-18 * s * L, 0, -32 * s * L, 3 * s); c.lineTo(-31 * s * L, 4.4 * s); c.quadraticCurveTo(-18 * s * L, 2.4 * s, -5 * s, 2.2 * s); c.closePath(); c.fill();
  c.fillStyle = K.tip; c.beginPath(); c.moveTo(-24 * s * L, 1.8 * s); c.quadraticCurveTo(-28 * s * L, 2.2 * s, -32 * s * L, 3 * s); c.lineTo(-31 * s * L, 4.4 * s); c.quadraticCurveTo(-27 * s * L, 3.6 * s, -24 * s * L, 3.6 * s); c.closePath(); c.fill();
  c.fillStyle = K.body; c.beginPath(); c.ellipse(1 * s, 0, 9 * s, 3.6 * s, -0.08, 0, 7); c.fill();
  c.fillStyle = K.belly; c.beginPath(); c.ellipse(1 * s, 1.4 * s, 7 * s, 2 * s, -0.08, 0, 7); c.fill();
  c.fillStyle = K.body; c.beginPath(); c.arc(9.6 * s, -1.6 * s, 3.7 * s, 0, 7); c.fill();
  if (kind < 2) { c.fillStyle = '#FFF8F0'; c.beginPath(); c.ellipse(10.6 * s, -1.2 * s, 2 * s, 1.6 * s, 0, 0, 7); c.fill(); }
  c.fillStyle = kind === 2 ? '#F2E2B0' : '#2A2430'; c.beginPath(); c.moveTo(12.6 * s, -3 * s); c.quadraticCurveTo(16.4 * s, -2.6 * s, 15 * s, 1 * s); c.lineTo(12.4 * s, 0.6 * s); c.closePath(); c.fill();
  c.fillStyle = '#1A1620'; c.beginPath(); c.arc(10.4 * s, -2.2 * s, 0.8 * s, 0, 7); c.fill();
  wing(-22 * s * flap, K.wing, K.cov, false);
  c.fillStyle = K.sh; c.beginPath(); c.ellipse(1.4 * s, -1.4 * s, 3 * s, 1.6 * s, -0.2 - flap * 0.4, 0, 7); c.fill();
  c.restore(); }

// ---------- Brazil
// Loop: the surf rolls in and its foam slides up the sand, the cable cars glide between Urca and Sugarloaf, the palms sway,
// the toucan tilts its head and hops along its branch, frigatebirds circle, sailboats drift across the bay and the beach
// umbrellas flutter. Night: the lamps curve along the promenade, the city and hill windows twinkle, the moon lays its path on
// the bay and the cable cars glide by with their lights on.
// Moment: a sunset blaze behind Sugarloaf, a flock of macaws and parrots bursting out of the forest across the bay, and
// samba-coloured confetti tossed up over the promenade.
ENGINES.brazil = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, C = A.C, M = A.moon, LF = A.loaf, T0 = -99, i, k;
  // the sky behind everything: above the hills, Sugarloaf and Urca
  var skyClip = new Path2D(), hp = A.horizon; skyClip.moveTo(hp[0][0], -60); hp.forEach(function (p) { skyClip.lineTo(p[0], p[1]); }); skyClip.lineTo(hp[hp.length - 1][0], -60); skyClip.closePath();
  var water = new Path2D(brazil_pg(A.water)), below = new Path2D(); below.rect(-60, A.hz, W + 120, H - A.hz + 60);
  var glowM = brazil_rg(dk ? 'rgba(255,236,200,0.5)' : 'rgba(255,255,255,0.4)', [0.3, 0.22]), winG = brazil_rg('rgba(255,196,110,0.55)', [0.35, 0.3]), lampG = brazil_rg('rgba(255,206,120,0.8)', [0.25, 0.32]), sunG = brazil_rg('rgba(255,150,70,0.9)', [0.3, 0.45]);
  var moonSpr = brazil_sprite(M[2] * 2.2, M[2] * 2.2, 2, function (o) { var r = M[2], g = o.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFFF4'); g.addColorStop(0.75, '#FFF0CC'); g.addColorStop(1, '#F2D8A0'); o.fillStyle = g; o.beginPath(); o.arc(0, 0, r, 0, 7); o.fill();
    o.fillStyle = 'rgba(214,190,140,0.3)'; [[-0.3, -0.2, 0.2], [0.28, 0.22, 0.16], [0.05, -0.45, 0.1], [-0.15, 0.42, 0.12]].forEach(function (q) { o.beginPath(); o.arc(q[0] * r, q[1] * r, q[2] * r, 0, 7); o.fill(); }); });
  var CLD = brazil_sprite(220, 50, 1.5, function (o) { o.fillStyle = dk ? 'rgba(120,110,170,0.45)' : 'rgba(255,255,255,0.88)'; [[-70, 8, 40, 9], [-22, 0, 48, 15], [30, 4, 44, 12], [80, 9, 26, 7], [0, 11, 92, 7]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); });
    o.fillStyle = dk ? 'rgba(200,170,220,0.2)' : 'rgba(255,240,220,0.6)'; o.beginPath(); o.ellipse(-16, -7, 40, 4, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (j) { return {x: W * hash(j + 3), y: H * (ph ? 0.08 + j * 0.06 : 0.06 + j * 0.09), s: (ph ? 0.55 : 1) * (0.7 + hash(j + 7) * 0.5), v: (5 + hash(j + 5) * 5) * (ph ? 0.6 : 1)}; });
  // sailboats drifting across the bay
  var SAILS = [['#FFFFFF', '#F2F0EA'], ['#FFFFFF', '#FFC84A'], ['#FFF6E6', '#FF7A4A'], ['#FFFFFF', '#4AA8E0']];
  var boats = []; for (i = 0; i < (ph ? 3 : 5); i++) { var fr = 0.15 + hash(i * 2.3) * 0.65, by = A.hz + (brazil_yAt(A.SH, W * 0.5) - A.hz) * fr; boats.push({x: W * hash(i * 4.1 + 1), fr: fr, y: by, s: S * (ph ? 0.55 : 0.7) * (0.6 + fr * 0.8), v: (3 + hash(i) * 5) * (hash(i + 9) < 0.5 ? -1 : 1), c: SAILS[i % 4], ph: hash(i) * 6}); }
  // frigatebirds circling high over the bay
  var birds = [0, 1, 2].map(function (j) { return {cx: W * (ph ? 0.3 + j * 0.25 : 0.25 + j * 0.22), cy: H * (ph ? 0.12 + j * 0.05 : 0.12 + j * 0.06), R: (ph ? 50 : 110) * (0.7 + hash(j) * 0.5), a: hash(j + 3) * 6.28, w: (0.13 + hash(j + 1) * 0.08) * (j % 2 ? -1 : 1), s: S * (ph ? 0.6 : 0.85) * (0.8 + hash(j + 4) * 0.4), fl: 0}; });
  // beach umbrellas
  var UC = [['#FFD23A', '#1FA34A'], ['#FF6A3A', '#FFFFFF'], ['#2A7AD6', '#FFD23A'], ['#E8407A', '#FFFFFF'], ['#24B4A8', '#FFF0C0'], ['#FF9A2A', '#2A7AD6'], ['#8A5AD6', '#FFFFFF']];
  function umbrella(c, u, t) { var x = u[0], y = u[1], s = u[2], cols = UC[u[3] % UC.length], top = y - 34 * s, tilt = Math.sin(t * 1.1 + u[3]) * 0.03 + Math.sin(t * 2.7 + u[3] * 2) * 0.012;
    c.save(); c.translate(x, y); c.rotate(tilt); c.translate(-x, -y);
    c.strokeStyle = dk ? '#3A3448' : '#6A5A50'; c.lineWidth = 1.8 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x, top - 2 * s); c.stroke();
    var R = 25 * s, n = 8;
    for (var j = 0; j < n; j++) { var a0 = Math.PI + j / n * Math.PI, a1 = Math.PI + (j + 1) / n * Math.PI; c.fillStyle = j % 2 ? cols[1] : cols[0]; if (dk) c.globalAlpha = 0.7;
      c.beginPath(); c.moveTo(x, top - 4 * s); c.lineTo(x + Math.cos(a0) * R, top + 8 * s + Math.sin(a0 + Math.PI) * 0); var fl = Math.sin(t * 6 + j * 1.3 + u[3]) * 1.4 * s;
      c.quadraticCurveTo(x + Math.cos((a0 + a1) / 2) * R * 1.02, top + 10.5 * s + fl, x + Math.cos(a1) * R, top + 8 * s); c.closePath(); c.fill(); }
    c.globalAlpha = 1; c.fillStyle = dk ? 'rgba(10,8,30,0.25)' : 'rgba(120,60,20,0.12)'; c.beginPath(); c.moveTo(x, top - 4 * s); c.lineTo(x + R, top + 8 * s); c.quadraticCurveTo(x + R * 0.5, top + 9.5 * s, x, top + 9 * s); c.closePath(); c.fill();
    c.fillStyle = dk ? '#5A5068' : '#FFF6E0'; c.beginPath(); c.arc(x, top - 4.6 * s, 1.6 * s, 0, 7); c.fill();
    c.restore(); }
  // the cable cars, hanging under the wires
  var CB = A.cab, bs = A.cabS, cabAt = function (t) { return [CB.x1 + (CB.x2 - CB.x1) * t, CB.y1 + (CB.y2 - CB.y1) * t + CB.sag * 4 * t * (1 - t)]; };
  function car(c, t, lit) { var p = cabAt(t), x = p[0], y = p[1] + 1.5 * bs, s = bs, ang = Math.atan2(CB.y2 - CB.y1 + CB.sag * 4 * (1 - 2 * t), CB.x2 - CB.x1) * 0.3;
    c.save(); c.translate(x, y); c.strokeStyle = dk ? '#C8C8E0' : '#3A3A48'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(-2 * s, 0); c.lineTo(2 * s, 0); c.moveTo(0, 0); c.lineTo(0, 7 * s); c.stroke();
    c.rotate(ang * 0.2); c.fillStyle = dk ? '#6A6A8A' : '#F2EEE6'; c.beginPath(); c.moveTo(-8 * s, 7 * s); c.lineTo(8 * s, 7 * s); c.quadraticCurveTo(9 * s, 13 * s, 7 * s, 18 * s); c.lineTo(-7 * s, 18 * s); c.quadraticCurveTo(-9 * s, 13 * s, -8 * s, 7 * s); c.fill();
    c.fillStyle = lit ? 'rgba(255,214,140,0.95)' : (dk ? '#2A2A48' : '#5E7898'); c.fillRect(-6.6 * s, 9 * s, 13.2 * s, 5 * s);
    c.fillStyle = dk ? '#4A4A6A' : '#E2B23A'; c.fillRect(-8 * s, 15.6 * s, 16 * s, 1.4 * s);
    c.restore(); if (lit) { c.save(); c.globalCompositeOperation = 'lighter'; brazil_dot(c, winG, x, y + 12 * s, 20 * s, 0.7); c.restore(); } }
  var cars = [{t: 0.2, dir: 1, wait: 0}, {t: 0.8, dir: -1, wait: 0}];
  // the toucan: its paths in its own coordinates (feet at 0,0), head tilting about the neck, hopping along the branch
  var TP = brazil_toucanParts(0, 0, 1), tbody = new Path2D(TP.body), tbib = new Path2D(TP.bib), tbeak = new Path2D(TP.beak), ttip = new Path2D(TP.tip), tvent = new Path2D(TP.vent);
  var tou = {x: A.toucan[0], s: A.toucan[2], dir: 1, tilt: 0, tgt: 0, next: 2, hop: null, blink: 0};
  var brA = A.brY[0], brB = A.brY[1], brBend = A.brY[2], brY = function (xx) { var t = (xx - brA[0]) / (brB[0] - brA[0]); return brA[1] + (brB[1] - brA[1]) * t - Math.sin(Math.PI * t) * brBend; };
  function toucan(c, tt) { var s = tou.s, x = tou.x, y = brY(x) - 5 * s, hy = 0;
    if (tou.hop) { var u = Math.min(1, tou.hop.u); x = tou.hop.x0 + (tou.hop.x1 - tou.hop.x0) * brazil_ease(u); y = brY(x) - 5 * s - Math.sin(Math.PI * u) * 16 * s; }
    var squash = tou.hop ? (tou.hop.u < 0.12 ? 1 - tou.hop.u * 1.2 : 1) : 1 + Math.sin(tt * 2.2) * 0.01;
    c.save(); c.translate(x, y); c.scale(tou.dir * s, s * squash);
    c.strokeStyle = dk ? '#6A7090' : '#7A8AB0'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-4, -4); c.lineTo(-5, 2); c.moveTo(1, -4); c.lineTo(2, 2); c.stroke();
    c.fillStyle = dk ? '#0E0C16' : '#1C1A22'; c.fill(tbody);
    c.fillStyle = dk ? '#D8CCA0' : '#FFF4D0'; c.fill(tbib); c.fillStyle = dk ? 'rgba(220,180,60,0.6)' : 'rgba(255,214,90,0.7)'; c.beginPath(); c.ellipse(6, -24.6, 4.4, 2.4, -0.2, 0, 7); c.fill();
    c.fillStyle = dk ? '#A8302A' : '#E2302A'; c.fill(tvent);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(-6, -22, 3.4, 10, -0.35, 0, 7); c.fill();
    // the head and the great beak, tilting
    c.translate(1, -31); c.rotate(tou.tilt); c.translate(-1, 31);
    c.fillStyle = dk ? '#0E0C16' : '#1C1A22'; c.beginPath(); c.arc(1, -37, 9.4, 0, 7); c.fill();
    var g = c.createLinearGradient(8, -46, 30, -32); g.addColorStop(0, dk ? '#C86A28' : '#FFB02E'); g.addColorStop(0.6, dk ? '#D07A2A' : '#FF8A1E'); g.addColorStop(1, dk ? '#B85A22' : '#F26A18');
    c.fillStyle = g; c.fill(tbeak); c.fillStyle = '#16141C'; c.fill(ttip);
    c.strokeStyle = dk ? 'rgba(200,60,40,0.7)' : '#E8402A'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(9, -45); c.quadraticCurveTo(26, -48.6, 38, -40.6); c.stroke();
    c.strokeStyle = dk ? 'rgba(0,0,0,0.4)' : 'rgba(120,50,10,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(9, -38); c.quadraticCurveTo(24, -37, 40, -35.6); c.stroke();
    c.fillStyle = dk ? '#C87A30' : '#FF9A2A'; c.beginPath(); c.arc(4.6, -39, 4.4, 0, 7); c.fill();
    c.fillStyle = dk ? '#3A6AB0' : '#3A8AE8'; c.beginPath(); c.arc(4.6, -39, 3.2, 0, 7); c.fill();
    if (tou.blink > 0) { c.strokeStyle = '#16141C'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(2.6, -39); c.lineTo(6.6, -39); c.stroke(); }
    else { c.fillStyle = '#100E16'; c.beginPath(); c.arc(4.9, -39, 1.6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(5.4, -39.6, 0.55, 0, 7); c.fill(); }
    c.restore(); }
  // palm crowns, jungle leaves and heliconia as paths; each frond and leaf swings about its own root
  var palms = A.palms.map(function (p) { return {x: p.x, y: p.y, royal: p.royal, nuts: p.nuts ? new Path2D(p.nuts) : null, fr: p.fr.map(function (f) { return {p: new Path2D(f.d), back: f.back, ph: f.ph}; }).sort(function (a, b) { return (b.back ? 1 : 0) - (a.back ? 1 : 0); })}; });
  var jungle = A.jungle.map(function (j) { return {p: new Path2D(j.d), v: new Path2D(j.v), dark: j.dark, pv: j.pv, ph: j.ph, amp: j.amp, top: j.top}; });
  var hel = {stem: new Path2D(A.hel.stem), red: new Path2D(A.hel.red), yel: new Path2D(A.hel.yel), pv: A.hel.pv}, branch = new Path2D(A.branch);
  function rot(c, pv, a) { c.translate(pv[0], pv[1]); c.rotate(a); c.translate(-pv[0], -pv[1]); }
  // night lights: the windows that light up, the far shore's street lights, the promenade lamps
  var wins = A.wins.filter(function (w) { return w[4] < 0.85; }), shoreL = [];
  for (var sxx = 0; sxx < A.city; sxx += 9 * S) shoreL.push(sxx);
  // the moment: sunset, the flock and the confetti
  var flock = [], conf = [], CONF = ['#1FA34A', '#FFD23A', '#2A6FD6', '#FF5FA2', '#FF8A2A', '#9A4FD6', '#FFFFFF', '#2AC8C0'];
  var sunX = LF.x + LF.wr * 0.42, sunY0 = LF.top + (A.hz - LF.top) * 0.3, loafEdge = new Path2D(); var rimOn = false; LF.body.forEach(function (p) { if (p[1] < A.hz - (A.hz - LF.top) * 0.32) { if (rimOn) loafEdge.lineTo(p[0], p[1]); else loafEdge.moveTo(p[0], p[1]); rimOn = true; } else rimOn = false; });
  return {
    step: function (dt, t, f) { var d = dt * f.s;
      clouds.forEach(function (c) { c.x += c.v * d; if (c.x > W + 180) c.x = -180; });
      boats.forEach(function (b) { b.x += b.v * S * d; if (b.x > W + 60) b.x = -60; if (b.x < -60) b.x = W + 60; });
      birds.forEach(function (b) { b.a += b.w * d; if (b.fl > 0) b.fl -= d; else if (Math.random() < d * 0.15) b.fl = 1.2; });
      cars.forEach(function (c) { if (c.wait > 0) { c.wait -= d; return; } c.t += c.dir * d / (ph ? 20 : 24); if (c.t >= 1 || c.t <= 0) { c.t = Math.max(0, Math.min(1, c.t)); c.dir = -c.dir; c.wait = 4; } });
      // the toucan: tilts its head now and then, sometimes hops to a new spot (and turns round)
      tou.next -= d; if (tou.blink > 0) tou.blink -= d; else if (Math.random() < d * 0.25) tou.blink = 0.14;
      tou.tilt += (tou.tgt - tou.tilt) * Math.min(1, d * 6);
      if (tou.hop) { tou.hop.u += d / 0.55; if (tou.hop.u >= 1) { tou.x = tou.hop.x1; tou.hop = null; } }
      else if (tou.next <= 0) { tou.next = 1.6 + Math.random() * 2.6;
        if (Math.random() < 0.3) { var x1 = A.brX[0] + Math.random() * (A.brX[1] - A.brX[0]); if (Math.abs(x1 - tou.x) > 14 * S) { tou.dir = x1 > tou.x ? 1 : -1; tou.hop = {x0: tou.x, x1: x1, u: 0}; tou.tgt = 0; } }
        else { tou.tgt = [-0.32, -0.16, 0, 0.14, 0.26][Math.floor(Math.random() * 5)]; if (Math.random() < 0.2) tou.dir = -tou.dir; } }
      flock.forEach(function (b) { if (t < b.t0) return; b.x += b.vx * d; b.y += (b.vy + Math.sin((t - b.t0) * 2.4 + b.ph) * 30 * S) * d; b.vy *= Math.pow(0.6, d); });
      flock = flock.filter(function (b) { return b.x < W + 120 && b.y > -200; });
      conf.forEach(function (p) { if (t < p.t0) return; p.vy += 150 * S * d; p.vy = Math.min(p.vy, p.term); p.vx *= Math.pow(0.4, d); p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 22 * S) * d; p.y += p.vy * d; p.r += p.vr * d; });
      conf = conf.filter(function (p) { return p.y < H + 20; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, blaze = brazil_env(T, 0.2, 2.4, 7.5, 11.5), j;
      // ---- canvas A: the sky things behind the mountains
      ca.save(); ca.clip(skyClip);
      if (blaze > 0) { var sy = sunY0 + (A.hz - sunY0) * 0.45 * brazil_ease(T / 11);
        ca.save(); ca.globalAlpha = blaze; var gs = ca.createLinearGradient(0, 0, 0, A.hz); gs.addColorStop(0, dk ? 'rgba(120,60,120,0.35)' : 'rgba(255,170,120,0.25)'); gs.addColorStop(0.55, dk ? 'rgba(255,120,90,0.45)' : 'rgba(255,140,80,0.55)'); gs.addColorStop(1, dk ? 'rgba(255,170,90,0.6)' : 'rgba(255,200,110,0.8)'); ca.fillStyle = gs; ca.fillRect(-60, -60, W + 120, A.hz + 60); ca.restore();
        ca.save(); ca.globalCompositeOperation = 'lighter'; brazil_dot(ca, sunG, sunX, sy, (ph ? 160 : 320) * S, blaze * 0.9); ca.restore();
        ca.save(); ca.globalAlpha = blaze; var gd = ca.createRadialGradient(sunX, sy, 0, sunX, sy, 30 * S); gd.addColorStop(0, '#FFF6D0'); gd.addColorStop(0.7, '#FFD070'); gd.addColorStop(1, '#FFA040'); ca.fillStyle = gd; ca.beginPath(); ca.arc(sunX, sy, 30 * S, 0, 7); ca.fill(); ca.restore(); }
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; brazil_dot(ca, glowM, M[0], M[1], M[2] * 4, 0.55 + 0.05 * Math.sin(tt * 0.6)); ca.restore(); ca.drawImage(moonSpr, M[0] - moonSpr.w / 2, M[1] - moonSpr.h / 2, moonSpr.w, moonSpr.h); }
      clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 110 * c.s, c.y - 25 * c.s, 220 * c.s, 50 * c.s); });
      ca.restore();
      // Sugarloaf's west face catches the sunset
      if (blaze > 0) { ca.save(); ca.globalAlpha = blaze * 0.7; ca.strokeStyle = '#FFB070'; ca.lineWidth = 3 * S; ca.lineJoin = 'round'; ca.stroke(loafEdge); ca.restore(); }
      // frigatebirds
      birds.forEach(function (b, n) { var x = b.cx + Math.cos(b.a) * b.R, y = b.cy + Math.sin(b.a) * b.R * 0.35, fl = b.fl > 0 ? Math.sin(b.fl * 12) * 0.8 : Math.sin(tt * 0.8 + n) * 0.15; brazil_frigate(ca, x, y, b.s, fl, dk ? 'rgba(20,18,40,0.85)' : 'rgba(40,38,52,0.85)'); });
      // the bay: deeper blue out in the bay, turquoise at the beach; glints by day, the moon's path by night, the boats
      ca.save(); ca.clip(water);
      var gw = ca.createLinearGradient(0, A.hz, 0, brazil_yAt(A.SH, W * 0.5)); gw.addColorStop(0, dk ? 'rgba(60,70,130,0.35)' : 'rgba(150,210,230,0.55)'); gw.addColorStop(0.4, dk ? 'rgba(30,40,90,0)' : 'rgba(40,130,190,0)'); gw.addColorStop(1, dk ? 'rgba(60,110,140,0.3)' : 'rgba(60,210,200,0.5)'); ca.fillStyle = gw; ca.fillRect(-60, A.hz, W + 120, H);
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter';
        for (k = 0; k < 22; k++) { var yy = A.hz + 3 + k * 4.6 * S, w = M[2] * (0.8 + k * 0.1) * (0.55 + 0.45 * Math.sin(tt * 1.4 + k * 1.9)), xx = M[0] + Math.sin(tt * 0.9 + k) * 4; ca.fillStyle = 'rgba(255,236,190,' + Math.max(0, 0.4 - k * 0.016) + ')'; ca.fillRect(xx - w / 2, yy, w, 1.6 * S); }
        // the city lights reflected in the water
        for (k = 0; k < shoreL.length; k += 2) { var la = 0.25 + 0.15 * Math.sin(tt * 1.3 + k); ca.fillStyle = 'rgba(255,200,120,' + la + ')'; ca.fillRect(shoreL[k] - 1, A.hz + 3 + Math.sin(tt * 2 + k) * 1.5, 2.4 * S, 8 * S); }
        ca.restore(); }
      else { for (k = 0; k < 26; k++) { var gx = W * hash(k * 3.3), gy = A.hz + 6 + (H * 0.8 - A.hz) * hash(k * 7.1), ga = Math.max(0, Math.sin(tt * (0.8 + hash(k) * 0.8) + k * 2.1)); if (ga > 0.3) { ca.fillStyle = 'rgba(255,255,255,' + (ga - 0.3) * 1.2 + ')'; ca.beginPath(); ca.ellipse(gx, gy, 5 * S * ga, 1 * S, 0, 0, 7); ca.fill(); } } }
      if (blaze > 0) { ca.save(); ca.globalAlpha = blaze; ca.fillStyle = 'rgba(255,150,80,0.22)'; ca.fillRect(-60, A.hz, W + 120, H); ca.globalCompositeOperation = 'lighter';
        for (k = 0; k < 18; k++) { var yy2 = A.hz + 3 + k * 5 * S, w2 = (40 + k * 6) * S * (0.5 + 0.5 * Math.sin(tt * 1.6 + k * 1.7)); ca.fillStyle = 'rgba(255,190,110,' + Math.max(0, 0.5 - k * 0.022) + ')'; ca.fillRect(sunX - w2 / 2 + Math.sin(tt + k) * 4, yy2, w2, 1.8 * S); } ca.restore(); }
      boats.forEach(function (b) { var bob = Math.sin(tt * 1.6 + b.ph) * 0.8 * b.s, x = b.x, y = b.y + bob, s = b.s, dir = b.v > 0 ? 1 : -1;
        for (var pass = 0; pass < 2; pass++) { ca.save(); if (pass === 0) { ca.globalAlpha = 0.25; ca.translate(0, y * 2 + 2 * s); ca.scale(1, -1); } ca.translate(x, y); ca.scale(dir, 1); ca.rotate(Math.sin(tt * 1.2 + b.ph) * 0.03);
          ca.fillStyle = dk ? '#3A3A58' : '#FFFFFF'; ca.beginPath(); ca.moveTo(-16 * s, -4 * s); ca.lineTo(17 * s, -4 * s); ca.lineTo(12 * s, 2 * s); ca.lineTo(-13 * s, 2 * s); ca.closePath(); ca.fill();
          ca.fillStyle = dk ? '#20203A' : '#2A4A7A'; ca.fillRect(-14 * s, -1 * s, 28 * s, 1.4 * s);
          ca.strokeStyle = dk ? '#8A8AA8' : '#4A4A58'; ca.lineWidth = 1.1 * s; ca.beginPath(); ca.moveTo(0, -4 * s); ca.lineTo(0, -40 * s); ca.stroke();
          ca.fillStyle = dk ? '#B8B4D0' : b.c[0]; ca.beginPath(); ca.moveTo(-1 * s, -39 * s); ca.quadraticCurveTo(-12 * s, -22 * s, -15 * s, -6 * s); ca.lineTo(-1 * s, -6 * s); ca.closePath(); ca.fill();
          ca.fillStyle = dk ? '#9A96B8' : b.c[1]; ca.beginPath(); ca.moveTo(1 * s, -36 * s); ca.quadraticCurveTo(9 * s, -20 * s, 14 * s, -6 * s); ca.lineTo(1 * s, -6 * s); ca.closePath(); ca.fill();
          if (dk) { ca.fillStyle = 'rgba(255,220,140,0.9)'; ca.beginPath(); ca.arc(0, -41 * s, 1.2 * s, 0, 7); ca.fill(); }
          ca.restore(); }
        ca.strokeStyle = dk ? 'rgba(190,200,255,0.25)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1; ca.beginPath(); ca.moveTo(x - dir * 14 * s, y + 2.4 * s); ca.lineTo(x - dir * 34 * s, y + 3.4 * s); ca.stroke(); });
      ca.restore();
      // the surf: a crest runs in, breaks, and its foam slides up the sand and back
      ca.save(); ca.clip(below);
      for (k = 0; k < 3; k++) { var pp = ((tt / 6.5) + k / 3) % 1, SHp = A.SH, cr, run, j2;
        if (pp < 0.42) { cr = -38 * S * (1 - brazil_ease(pp / 0.42)) - 3 * S; ca.strokeStyle = dk ? 'rgba(200,210,255,' + (0.35 * Math.sin(Math.PI * pp / 0.42)) + ')' : 'rgba(255,255,255,' + (0.85 * Math.sin(Math.PI * pp / 0.42)) + ')'; ca.lineWidth = (1.6 + pp * 4) * S; ca.beginPath();
          for (j2 = 0; j2 < SHp.length; j2++) { var py = SHp[j2][1] + cr * (0.8 + 0.2 * Math.sin(SHp[j2][0] * 0.013 + k * 2)); if (j2) ca.lineTo(SHp[j2][0], py); else ca.moveTo(SHp[j2][0], py); } ca.stroke(); }
        if (pp > 0.36) { var q = (pp - 0.36) / 0.64; run = A.sandW * 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, q * 1.15)), 0.7); var fa = (1 - q) * 0.9;
          ca.fillStyle = dk ? 'rgba(170,180,230,' + fa * 0.35 + ')' : 'rgba(255,255,255,' + fa * 0.6 + ')'; ca.beginPath();
          for (j2 = 0; j2 < SHp.length; j2++) ca.lineTo(SHp[j2][0], SHp[j2][1] - 4 * S);
          for (j2 = SHp.length - 1; j2 >= 0; j2--) ca.lineTo(SHp[j2][0], SHp[j2][1] + run * (0.7 + 0.3 * Math.sin(SHp[j2][0] * 0.021 + k * 1.7)));
          ca.closePath(); ca.fill();
          ca.strokeStyle = dk ? 'rgba(200,210,255,' + fa * 0.5 + ')' : 'rgba(255,255,255,' + Math.min(1, fa * 1.2) + ')'; ca.lineWidth = 1.6 * S; ca.beginPath();
          for (j2 = 0; j2 < SHp.length; j2++) { var ly = SHp[j2][1] + run * (0.7 + 0.3 * Math.sin(SHp[j2][0] * 0.021 + k * 1.7)) + Math.sin(SHp[j2][0] * 0.3 + tt) * 0.8; if (j2) ca.lineTo(SHp[j2][0], ly); else ca.moveTo(SHp[j2][0], ly); } ca.stroke(); } }
      ca.restore();
      // night: windows, the far shore's street lights, the cable car stations
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter';
        wins.forEach(function (w) { var on = brazil_ease((t - w[4] * 6) / 1.2) * (Math.sin(t * 0.09 + w[4] * 90) > 0.94 ? 0.2 : 1) * (0.85 + 0.15 * Math.sin(tt * 3 + w[4] * 40)); if (on <= 0) return; ca.fillStyle = 'rgba(255,206,120,' + (0.9 * on) + ')'; ca.fillRect(w[0], w[1], w[2], w[3]); if (w[4] < 0.25) brazil_dot(ca, winG, w[0] + w[2] / 2, w[1] + w[3] / 2, w[3] * 2.6, on * 0.5); });
        A.hillL.forEach(function (l, n) { var a = 0.55 + 0.35 * Math.sin(tt * (0.7 + l[2]) + n * 2.3); ca.fillStyle = 'rgba(255,214,140,' + a + ')'; ca.fillRect(l[0], l[1], 1.8 * S, 1.8 * S); if (n % 4 === 0) brazil_dot(ca, winG, l[0], l[1], 6 * S, a * 0.5); });
        shoreL.forEach(function (x, n) { brazil_dot(ca, lampG, x, A.hz - 2, 4 * S, 0.5 + 0.2 * flick(tt, n)); });
        brazil_dot(ca, winG, CB.x1 - 15 * bs, CB.y1, 26 * bs, 0.5); brazil_dot(ca, winG, CB.x2 + 12 * bs, CB.y2, 22 * bs, 0.5);
        ca.restore(); }
      cars.forEach(function (c) { car(ca, c.t, dk); });
      // the umbrellas on the sand
      A.umb.forEach(function (u) { umbrella(ca, u, tt); });
      // the flock bursting out of the forest
      flock.forEach(function (b) { if (t < b.t0) return; var fl = Math.sin((t - b.t0) * b.fs + b.ph); brazil_macaw(ca, b.x, b.y, b.s, fl, b.kind, dk); });
      // ---- canvas B: the lamps, the palm crowns, the rainforest corner with the toucan, the confetti
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.lamps.forEach(function (l, n) { brazil_dot(cb, lampG, l[0], l[1], 26 * l[2], 0.75 + 0.1 * flick(tt, n + 3)); brazil_dot(cb, lampG, l[0] - 4 * l[2], l[1] + 50 * l[2], 30 * l[2], 0.22); }); cb.restore(); }
      var wind = 1 + blaze * 0.6;
      palms.forEach(function (p, n) { p.fr.forEach(function (fr2) { var a = (Math.sin(tt * 0.9 + fr2.ph) * 0.035 + Math.sin(tt * 1.9 + fr2.ph * 1.7) * 0.014) * f.a * wind + Math.sin(tt * 0.5 + n) * 0.02;
          cb.save(); rot(cb, [p.x, p.y], a); cb.fillStyle = fr2.back ? C.dleaf : C.leaf; cb.fill(fr2.p); cb.restore(); });
        if (p.nuts) { cb.fillStyle = dk ? '#3A3A2A' : '#7A8A3A'; cb.fill(p.nuts); } });
      jungle.forEach(function (lf) { var a = (Math.sin(tt * 0.7 + lf.ph) * lf.amp + Math.sin(tt * 1.6 + lf.ph * 2) * lf.amp * 0.3) * f.a;
        cb.save(); rot(cb, lf.pv, a); cb.fillStyle = lf.dark ? C.dleaf : C.leaf; cb.fill(lf.p); cb.strokeStyle = C.vein; cb.lineWidth = 1.1; cb.stroke(lf.v); cb.restore(); });
      cb.save(); rot(cb, hel.pv, Math.sin(tt * 0.8 + 1) * 0.03 * f.a); cb.fillStyle = C.leaf; cb.fill(hel.stem); cb.fillStyle = dk ? '#A8303A' : '#E8302E'; cb.fill(hel.red); cb.fillStyle = dk ? '#C8A040' : '#FFD23A'; cb.fill(hel.yel); cb.restore();
      cb.fillStyle = C.wood; cb.fill(branch);
      toucan(cb, tt);
      conf.forEach(function (p) { if (t < p.t0) return; cb.save(); cb.translate(p.x, p.y); cb.rotate(p.r); cb.scale(Math.cos(p.r * 2.3), 1); cb.fillStyle = p.c; if (p.round) { cb.beginPath(); cb.arc(0, 0, p.w * 0.5, 0, 7); cb.fill(); } else cb.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cb.restore(); });
    },
    finish: function (t) { T0 = t;
      // macaws and parrots burst out of the forest on the hills across the bay and fly over toward Sugarloaf
      var F = A.forest, n = ph ? 12 : 20;
      for (k = 0; k < n; k++) { var kind = k % 5 === 4 ? 2 : k % 2; flock.push({x: F[0] + Math.random() * (F[1] - F[0]), y: F[2] + Math.random() * (F[3] - F[2]), vx: (ph ? 70 : 150) * S * (0.8 + Math.random() * 0.5), vy: -(30 + Math.random() * 60) * S, t0: t + 0.3 + Math.random() * 1.8, s: S * (ph ? 0.75 : 1.1) * (0.75 + Math.random() * 0.45) * (kind === 2 ? 0.8 : 1), kind: kind, fs: 9 + Math.random() * 4, ph: Math.random() * 6.28}); }
      // samba-coloured confetti tossed up over the promenade
      for (k = 0; k < (ph ? 80 : 170); k++) { var x = Math.random() * W, y0 = brazil_yAt(A.PA, x) + Math.random() * 30 * S; conf.push({x: x, y: y0, vx: (Math.random() - 0.5) * 80 * S, vy: -(180 + Math.random() * 230) * S * (ph ? 0.9 : 1), term: (30 + Math.random() * 40) * S, t0: t + 0.6 + Math.random() * 1.8, c: CONF[k % CONF.length], w: (4 + Math.random() * 4) * S, h: (2.4 + Math.random() * 2) * S, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, sp: 1 + Math.random() * 2, ph: Math.random() * 6, round: Math.random() < 0.2}); } }
  };
};
UIC.brazil = {L: ['#1E8A5A', '#11603E', 'rgba(255,253,246,0.86)', '#163026', '#4C6A5C', '#13804E', '#13804E', '#E8A21E', '#FFFFFF'], D: ['#1E2C5E', '#0C1838', 'rgba(16,24,58,0.8)', '#F2F2FA', '#B4B8D6', '#FFD24A', '#FFD24A', '#7FE0A0', '#0C1838']};
