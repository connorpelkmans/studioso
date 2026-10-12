// ---- world theme engine: australia (Sydney Harbour)
// Loop: green-and-cream ferries cross the harbour leaving wakes, sailboats tack, the water glints, gum leaves sway, the
// sleeping koala's ear twitches, cockatoos and rainbow lorikeets fly in to perch on the gum and the bottlebrush and off
// again, and a pelican glides low over the water now and then. Night: the sails glow softly, the bridge is lit along its
// arch and deck, the skyline sparkles and the lights' reflections ripple. Moment: fireworks burst over the bridge in gold,
// red and blue, the sails light up in colours, and a flock of rainbow lorikeets swoops across.
function australia_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function australia_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return australia_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - australia_ease((T - c) / (d - c)); }
var australia_gc = null;
function australia_rg(col, mid) { var g = (australia_gc || (australia_gc = document.createElement('canvas').getContext('2d'))).createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function australia_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function australia_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function australia_blit(c, sp, x, y, s, rot, a, flip) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (a != null) c.globalAlpha = a; if (flip) c.scale(-1, 1); c.drawImage(sp, -sp.w * s / 2, -sp.h * s / 2, sp.w * s, sp.h * s); c.restore(); }
function australia_path(P) { var p = new Path2D(); P.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; }
// a sulphur-crested cockatoo at (x, y), facing dir; fl is the wingbeat (null when perched), bob nods the head
function australia_cocky(c, x, y, s, dir, fl, bob, dk) {
  var Wt = dk ? '#C8C6DA' : '#FFFFFF', Sh = dk ? '#9C9AB4' : '#E2E4EA', Y = dk ? '#C8A84A' : '#F6D23A';
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  if (fl == null) { c.fillStyle = Sh; c.beginPath(); c.moveTo(-4, 2); c.lineTo(-14, 10); c.lineTo(-10, 11); c.lineTo(-1, 5); c.fill();
    c.fillStyle = Wt; c.beginPath(); c.ellipse(0, -2, 6.4, 8.6, 0.35, 0, 7); c.fill(); c.fillStyle = Sh; c.beginPath(); c.ellipse(-2, -1, 4, 7, 0.4, 0, 7); c.fill();
    c.strokeStyle = dk ? '#555066' : '#6A6470'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-1, 6); c.lineTo(-2, 9); c.moveTo(2, 6); c.lineTo(2, 9); c.stroke(); }
  else { var a = Math.sin(fl) * 0.9; c.fillStyle = Wt; c.beginPath(); c.ellipse(0, 0, 9, 4.6, -0.1, 0, 7); c.fill(); c.beginPath(); c.moveTo(-8, 0); c.lineTo(-16, 3); c.lineTo(-15, -1); c.fill();
    [1, -1].forEach(function (sd) { c.save(); c.translate(0, -1); c.rotate(-sd * 0.2 + a * sd); c.fillStyle = sd > 0 ? Wt : Sh; c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-2, -14 * sd, 6, -19 * sd); c.quadraticCurveTo(6, -8 * sd, 5, 0); c.fill(); c.fillStyle = Y; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(2, -9 * sd, 2, 5, 0, 0, 7); c.fill(); c.restore(); }); }
  var hx = fl == null ? 3 : 9, hy = (fl == null ? -10 : -2) + (bob || 0) * 2;
  c.fillStyle = Y; c.beginPath(); c.moveTo(hx - 3, hy - 2); c.quadraticCurveTo(hx - 8, hy - 10, hx - 9, hy - 13); c.quadraticCurveTo(hx - 3, hy - 9, hx, hy - 3); c.fill();
  c.beginPath(); c.moveTo(hx - 2, hy - 3); c.quadraticCurveTo(hx - 3, hy - 11, hx - 4, hy - 14); c.quadraticCurveTo(hx + 1, hy - 8, hx + 1, hy - 3); c.fill();
  c.fillStyle = Wt; c.beginPath(); c.arc(hx, hy, 4.2, 0, 7); c.fill();
  c.fillStyle = '#3A3A44'; c.beginPath(); c.moveTo(hx + 3, hy - 1.6); c.quadraticCurveTo(hx + 7, hy - 1, hx + 5, hy + 3); c.lineTo(hx + 3, hy + 2); c.fill();
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(hx + 1.2, hy - 1, 0.9, 0, 7); c.fill();
  c.restore(); }
// a rainbow lorikeet: blue head, red-orange breast, green back, wings and tail
function australia_lory(c, x, y, s, dir, fl, bob, dk) {
  var G = dk ? '#3E7A4A' : '#3EA84A', G2 = dk ? '#2E5E3A' : '#2E8A3E', Bl = dk ? '#4A56A8' : '#3A5EE0', R = dk ? '#C04A3A' : '#F2562E', Yl = dk ? '#C8B040' : '#F6D02E';
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  if (fl == null) { c.fillStyle = G2; c.beginPath(); c.moveTo(-3, 3); c.lineTo(-13, 11); c.lineTo(-10, 12); c.lineTo(-1, 6); c.fill();
    c.fillStyle = G; c.beginPath(); c.ellipse(-1, -1, 5, 7, 0.35, 0, 7); c.fill(); c.fillStyle = R; c.beginPath(); c.ellipse(1.6, -2, 3.2, 4, 0.2, 0, 7); c.fill(); c.fillStyle = Bl; c.beginPath(); c.ellipse(1.2, 2.4, 2.6, 2.4, 0, 0, 7); c.fill(); }
  else { var a = Math.sin(fl) * 1; c.fillStyle = G; c.beginPath(); c.ellipse(0, 0, 7.6, 3.6, -0.1, 0, 7); c.fill(); c.fillStyle = G2; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-16, 2); c.lineTo(-15, -1); c.fill(); c.fillStyle = R; c.beginPath(); c.ellipse(4, 1, 3, 2.4, 0, 0, 7); c.fill();
    [1, -1].forEach(function (sd) { c.save(); c.rotate(a * sd - sd * 0.1); c.fillStyle = sd > 0 ? G : G2; c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-1, -11 * sd, 5, -14 * sd); c.quadraticCurveTo(5, -6 * sd, 4, 0); c.fill(); c.fillStyle = R; c.globalAlpha = 0.7; c.beginPath(); c.ellipse(1, -5 * sd, 1.4, 3, 0, 0, 7); c.fill(); c.restore(); }); }
  var hx = fl == null ? 2.6 : 8, hy = (fl == null ? -8 : -1) + (bob || 0) * 2;
  c.fillStyle = Yl; c.beginPath(); c.arc(hx - 0.8, hy + 2.6, 2.6, 0, 7); c.fill();
  c.fillStyle = Bl; c.beginPath(); c.arc(hx, hy, 3.4, 0, 7); c.fill();
  c.fillStyle = '#F2602E'; c.beginPath(); c.moveTo(hx + 2.4, hy - 1.4); c.quadraticCurveTo(hx + 5.6, hy, hx + 3.4, hy + 2.2); c.lineTo(hx + 2.2, hy + 1); c.fill();
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(hx + 1, hy - 0.8, 0.8, 0, 7); c.fill();
  c.restore(); }
// a pelican gliding: long wings with black flight feathers, the big pink bill
function australia_pelican(c, x, y, s, dir, fl, dk) {
  var Wt = dk ? '#C4C2D8' : '#FFFFFF', Bk = dk ? '#26243A' : '#2A2830', Bi = dk ? '#C08A8E' : '#F2A8A0';
  c.save(); c.translate(x, y); c.scale(s * dir, s); var a = fl * 0.5;
  [-1, 1].forEach(function (sd) { c.save(); c.scale(1, sd > 0 ? 1 : 0.55); c.rotate(-a * sd); c.fillStyle = Bk; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-14, -10, -30, -14); c.quadraticCurveTo(-18, -2, -8, 2); c.fill();
    c.fillStyle = sd > 0 ? Wt : '#D8D8E0'; c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-8, -9, -20, -12); c.quadraticCurveTo(-12, -3, -6, 2); c.fill(); c.restore(); });
  c.fillStyle = Wt; c.beginPath(); c.ellipse(0, 0, 13, 5, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-12, -1); c.lineTo(-18, 0); c.lineTo(-12, 2); c.fill();
  c.beginPath(); c.arc(13, -3, 3.4, 0, 7); c.fill();
  c.fillStyle = Bi; c.beginPath(); c.moveTo(15, -4); c.lineTo(32, -1); c.lineTo(31, 0.6); c.quadraticCurveTo(22, 4, 15, 0); c.fill();
  c.fillStyle = '#1A1820'; c.beginPath(); c.arc(14, -4, 0.8, 0, 7); c.fill();
  c.restore(); }
ENGINES.australia = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, C = A.C, S = A.S, i, j, B = A.B, hb = A.hb, wl = A.wl, swTop = A.swTop;
  // what stands behind the Opera House is clipped to everything outside its outline
  var behind = new Path2D(); behind.rect(-60, -60, W + 120, H + 120); behind.moveTo(A.sil[0][0], A.sil[0][1]); A.sil.forEach(function (p) { behind.lineTo(p[0], p[1]); }); behind.closePath();
  var shellP = new Path2D(), shell2P = new Path2D(); A.shells.forEach(function (P) { shellP.addPath(australia_path(P)); }); A.shells2.forEach(function (P) { shell2P.addPath(australia_path(P)); });
  var bothP = new Path2D(); bothP.addPath(shell2P); bothP.addPath(shellP);
  var warmG = australia_rg('rgba(255,214,150,0.8)', [0.3, 0.35]), flashG = australia_rg('rgba(255,240,210,0.9)', [0.3, 0.3]);
  // glints on the water
  var rip = []; for (i = 0; i < (ph ? 44 : 90); i++) rip.push({x: hash(i + 11) * W, y: hb + 4 + Math.pow(hash(i + 12), 0.8) * (swTop - hb - 8), l: 5 + hash(i + 13) * 18, ph: hash(i + 14) * 6.28, v: 3 + hash(i + 15) * 5});
  // a few city windows switch on and off at night
  var tw = A.wins.filter(function (w) { return w[4] >= 0.42 && w[4] < 0.52; }).map(function (w) { return {w: w, on: hash(w[0] + w[1]) < 0.5}; }), nextFlip = 2;
  // ---- the ferries: green hulls, cream decks with a gold band, a wheelhouse in the middle (they run both ways)
  var FERRY = australia_sprite(160, 56, 3, function (o) { o.translate(0, 12);
    o.fillStyle = dk ? 'rgba(0,0,0,0.3)' : 'rgba(20,50,80,0.18)'; o.beginPath(); o.ellipse(0, 1, 70, 3.4, 0, 0, 7); o.fill();
    o.fillStyle = dk ? '#1E4430' : '#2C6A44'; o.beginPath(); o.moveTo(-74, -10); o.lineTo(74, -10); o.quadraticCurveTo(70, 0, 62, 1); o.lineTo(-62, 1); o.quadraticCurveTo(-70, 0, -74, -10); o.fill();
    o.fillStyle = dk ? '#C8B060' : '#F2C641'; o.fillRect(-72, -9, 144, 1.8);
    o.fillStyle = dk ? '#BEB8C8' : '#FBF2D8'; o.fillRect(-62, -24, 124, 14); o.fillRect(-46, -35, 92, 11);
    o.fillStyle = dk ? '#A8A2B8' : '#F0E2B8'; o.fillRect(-66, -26, 132, 2.4); o.fillRect(-50, -37, 100, 2.2);
    o.fillStyle = dk ? '#C8B060' : '#F2C641'; o.fillRect(-14, -46, 28, 9); o.fillStyle = dk ? '#1E4430' : '#2C6A44'; o.fillRect(-16, -48, 32, 2.4);
    for (var k = 0; k < 12; k++) { o.fillStyle = dk ? (k % 4 ? '#FFD890' : '#F2B860') : '#5E7E92'; o.fillRect(-58 + k * 10, -21, 6.6, 6.4); }
    for (k = 0; k < 8; k++) { o.fillStyle = dk ? '#FFE2A8' : '#6E8EA2'; o.fillRect(-42 + k * 11, -33, 7, 5.2); }
    o.fillStyle = dk ? '#FFE2A8' : '#A8C8DA'; o.fillRect(-11, -44, 22, 4.4);
    o.strokeStyle = dk ? '#6A6680' : '#6A7480'; o.lineWidth = 0.7; o.beginPath(); for (k = 0; k < 26; k++) { o.moveTo(-62 + k * 4.9, -37); o.lineTo(-62 + k * 4.9, -40); } o.moveTo(-50, -40); o.lineTo(50, -40); o.stroke(); });
  var ferries = [{x: W * 0.3, y: A.lane1, s: A.fS * 0.55, v: (ph ? 9 : 14) * S, dir: 1, far: 1}, {x: W * 0.7, y: A.lane2, s: A.fS, v: (ph ? 14 : 22) * S, dir: -1, far: 0}];
  // ---- sailboats that tack: the boom swings over and the boat heels the other way
  var sails = [{x: W * 0.28, y: A.lane2 - (swTop - wl) * 0.12, s: A.fS * 0.95, h: 1, t: 3}, {x: W * 0.8, y: wl + (swTop - wl) * 0.18, s: A.fS * 0.7, h: -1, t: 7}, {x: W * 0.62, y: hb + (wl - hb) * 0.25, s: A.fS * 0.45, h: 1, t: 11, far: 1}];
  sails.forEach(function (b) { b.side = b.h; b.sw = b.h; });
  function sailboat(c, b, tt) { var s = b.s, sw = b.sw, heel = sw * 0.1 + Math.sin(tt * 1.1 + b.x) * 0.03;
    c.save(); c.translate(b.x, b.y);
    c.fillStyle = dk ? 'rgba(200,210,255,0.14)' : 'rgba(255,255,255,0.3)'; c.beginPath(); c.moveTo(-18 * s, 3 * s); c.lineTo(18 * s, 3 * s); c.lineTo(sw * 6 * s, 34 * s); c.fill();
    c.rotate(heel);
    c.fillStyle = dk ? '#BEBCD0' : '#FFFFFF'; c.beginPath(); c.moveTo(-18 * s * b.h, -4 * s); c.lineTo(20 * s * b.h, -4 * s); c.lineTo(13 * s * b.h, 3 * s); c.lineTo(-12 * s * b.h, 3 * s); c.fill();
    c.fillStyle = dk ? '#4A4E78' : '#2A4E7A'; c.fillRect(-14 * s, -2.4 * s, 28 * s, 1.4 * s);
    c.fillStyle = dk ? '#6A6880' : '#5A5A68'; c.fillRect(-0.7 * s, -54 * s, 1.4 * s, 50 * s);
    var main = dk ? '#D2D0E4' : '#FFFFFF', jib = dk ? '#BAB8D2' : '#F2F4F8';
    c.fillStyle = main; c.beginPath(); c.moveTo(sw * 1.5 * s, -52 * s); c.quadraticCurveTo(sw * 14 * s, -30 * s, sw * 22 * s, -7 * s); c.lineTo(sw * 1.5 * s, -7 * s); c.fill();
    c.fillStyle = jib; c.beginPath(); c.moveTo(-sw * 1.5 * s, -46 * s); c.quadraticCurveTo(-sw * 10 * s, -26 * s, -sw * 14 * s, -6 * s); c.lineTo(-sw * 1.5 * s, -6 * s); c.fill();
    c.strokeStyle = dk ? '#7A7890' : '#C8CCD6'; c.lineWidth = 0.6 * s; c.beginPath(); c.moveTo(sw * 1.5 * s, -36 * s); c.lineTo(sw * 12 * s, -26 * s); c.stroke();
    if (dk) { c.fillStyle = '#FFE0A0'; c.beginPath(); c.arc(0, -55 * s, 1.2, 0, 7); c.fill(); }
    c.restore(); }
  // ---- the pelican, now and then
  var pel = {x: -99, y: 0, t: 6, dir: 1};
  // ---- birds: cockatoos come to the gum, lorikeets to the bottlebrush
  var birds = [], spots = A.perch.map(function (p) { return {x: p[0], y: p[1], k: 'c'}; }).concat(A.brushes.filter(function (b, n) { return n % 3 === 1; }).map(function (b) { return {x: b[0], y: b[1] - 6 * A.tS, k: 'l'}; }));
  for (i = 0; i < 4; i++) birds.push({k: i < 2 ? 'c' : 'l', st: 'away', t: 2 + i * 3.5, x: -99, y: 0, dir: 1, fl: 0, bob: 0, sp: null});
  function free(k) { var s = spots.filter(function (p) { return p.k === k && !p.busy; }); return s.length ? s[Math.floor(Math.random() * s.length)] : null; }
  // ---- gum leaves that sway at the edges of each clump
  var GUM = [C.lfD, C.lfL].map(function (col) { return australia_sprite(14, 40, 3, function (o) { o.fillStyle = col; o.beginPath(); o.moveTo(0, -18); o.quadraticCurveTo(5, -6, 2, 8); o.quadraticCurveTo(0, 15, -1, 18); o.quadraticCurveTo(-4, 6, -2, -6); o.quadraticCurveTo(-1, -14, 0, -18); o.fill(); o.strokeStyle = 'rgba(255,255,255,0.2)'; o.lineWidth = 0.6; o.beginPath(); o.moveTo(0, -17); o.quadraticCurveTo(1, 2, -1, 17); o.stroke(); }); });
  var sway = []; A.clumps.forEach(function (c2, n) { for (var k = 0; k < (ph ? 4 : 6); k++) { var a = (k / 6 + hash(n * 7 + k) * 0.2) * Math.PI + Math.PI * 0.05; sway.push({x: c2[0] + Math.cos(a) * c2[2] * 0.9, y: c2[1] + Math.sin(a) * c2[2] * 0.6, s: A.tS * (0.8 + hash(k + n) * 0.5) * (ph ? 0.8 : 1), c: k % 2, ph: hash(n * 3 + k) * 6.28, a0: (hash(n + k * 5) - 0.5) * 0.6}); } });
  // ---- the koala: asleep in the fork, its ear flicking now and then, breathing slowly
  var K = A.koala, ear = 0, earT = 3;
  function koala(c, tt) { var x = K[0], y = K[1], s = K[2], br = Math.sin(tt * 1.3) * 0.025, G = dk ? '#6E6C86' : '#9C9CA6', G2 = dk ? '#58566E' : '#84848E', Wh = dk ? '#B8B6CC' : '#F2F0EE';
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = G2; c.beginPath(); c.ellipse(4, 2, 17, 14.5 * (1 + br), -0.2, 0, 7); c.fill();
    c.fillStyle = G; c.beginPath(); c.ellipse(2, 0, 15, 13 * (1 + br), -0.2, 0, 7); c.fill();
    c.fillStyle = Wh; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(-6, 4, 6, 8, 0.2, 0, 7); c.fill(); c.globalAlpha = 1;
    // arms round the trunk
    c.fillStyle = G2; c.beginPath(); c.ellipse(10, 6, 10, 4.4, -0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(-6, -6, 9, 4, 0.5, 0, 7); c.fill();
    c.fillStyle = '#4A4650'; for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(18 + k * 1.6, 3 + k * 1.4, 1, 0, 7); c.fill(); }
    // head resting on the arm, ears
    var hx = -12, hy = -13;
    [[-10, -9, -1], [9, -10, 1]].forEach(function (e) { c.save(); c.translate(hx + e[0], hy + e[1]); c.rotate(e[2] > 0 ? ear * 0.5 : 0); c.fillStyle = G; c.beginPath(); c.arc(0, 0, 7.4, 0, 7); c.fill(); c.fillStyle = Wh; c.beginPath(); c.arc(e[2] * 0.6, 0.6, 4.4, 0, 7); c.fill(); c.fillStyle = G; c.beginPath(); c.arc(-e[2] * 1.6, 2, 3, 0, 7); c.fill(); c.restore(); });
    c.fillStyle = G; c.beginPath(); c.ellipse(hx, hy, 12, 10.6, 0.1, 0, 7); c.fill();
    c.fillStyle = '#2E2A34'; c.beginPath(); c.ellipse(hx - 1, hy + 2, 3.8, 5, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(hx - 2, hy - 0.6, 1, 1.6, 0, 0, 7); c.fill();
    c.strokeStyle = '#2E2A34'; c.lineWidth = 1.2; c.beginPath(); c.arc(hx - 7, hy - 2, 2.4, 0.3, 2.8); c.moveTo(hx + 7.4, hy - 2); c.arc(hx + 5, hy - 2, 2.4, 0.3, 2.8); c.stroke();
    c.restore();
    // a little "z" drifting up
    var zt = (tt * 0.35) % 1; c.save(); c.globalAlpha = Math.sin(zt * Math.PI) * 0.6; c.fillStyle = dk ? '#D8D6EC' : '#5A6A7A'; c.font = '600 ' + Math.round(9 * s) + 'px sans-serif'; c.fillText('z', x - 4 * s + zt * 8 * s, y - 30 * s - zt * 16 * s); c.restore(); }
  // ---- the moment: fireworks over the bridge, the sails in colours, a flock of lorikeets
  var shells = [], flock = [], COL = [['#FFD36A', '#FFF2C0'], ['#FF5A4A', '#FFC2A8'], ['#5AA8FF', '#D2E8FF'], ['#FFD36A', '#FFFFFF'], ['#C878FF', '#F0D8FF']];
  function boom(x, y, col, n) { var parts = []; for (var k = 0; k < n; k++) { var a = k / n * Math.PI * 2 + Math.random() * 0.1, sp = (ph ? 66 : 108) * S * (0.75 + Math.random() * 0.4); parts.push({x: x, y: y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp}); } shells.push({parts: parts, col: col, age: 0, x: x, y: y, crackle: Math.random() < 0.4}); }
  var plan = [];
  return {
    step: function (dt, t, f) {
      var tt = t * f.s;
      rip.forEach(function (r) { r.x -= r.v * dt * f.s; if (r.x + r.l < -10) r.x = W + 10; });
      ferries.forEach(function (fy) { fy.x += fy.dir * fy.v * dt * f.s; if (fy.dir > 0 && fy.x > W + 100 * fy.s) fy.x = -100 * fy.s - Math.random() * W * 0.3; if (fy.dir < 0 && fy.x < -100 * fy.s) fy.x = W + 100 * fy.s + Math.random() * W * 0.3; });
      sails.forEach(function (b) { b.t -= dt * f.s; b.x += b.h * (ph ? 4 : 7) * S * b.s * dt * f.s; if (b.t <= 0 || (b.h > 0 && b.x > W * 0.95) || (b.h < 0 && b.x < W * 0.05)) { b.side = -b.side; b.t = 7 + Math.random() * 6; if ((b.h > 0 && b.x > W * 0.9) || (b.h < 0 && b.x < W * 0.1) || Math.random() < 0.4) b.h = -b.h; }
        b.sw += (b.side - b.sw) * Math.min(1, dt * 1.6); });
      pel.t -= dt * f.s; if (pel.x < -98) { if (pel.t <= 0) { pel.dir = Math.random() < 0.5 ? 1 : -1; pel.x = pel.dir > 0 ? -60 : W + 60; pel.y = wl + (swTop - wl) * (0.25 + Math.random() * 0.3) - 26 * S; } }
      else { pel.x += pel.dir * (ph ? 30 : 46) * S * dt * f.s; if (pel.x < -80 || pel.x > W + 80) { pel.x = -99; pel.t = 18 + Math.random() * 14; } }
      if (dk && t > nextFlip && tw.length) { var w = tw[Math.floor(Math.random() * tw.length)]; w.on = !w.on; nextFlip = t + 1 + Math.random() * 2.5; }
      earT -= dt; if (earT <= 0) { earT = 2.5 + Math.random() * 4; ear = 1; } ear = Math.max(0, ear - dt * 3.2);
      birds.forEach(function (b) { b.fl += dt * (b.k === 'c' ? 11 : 17); b.t -= dt * f.s;
        if (b.st === 'away' && b.t <= 0) { var sp = free(b.k); if (sp) { sp.busy = 1; b.sp = sp; b.st = 'in'; b.x0 = Math.random() < 0.5 ? -40 : W + 40; b.y0 = H * (0.08 + Math.random() * 0.25); b.u = 0; b.x = b.x0; b.y = b.y0; } else b.t = 2; }
        if (b.st === 'in' || b.st === 'out') { b.u += dt * f.s / 3.2; var u = australia_ease(b.u), tx = b.st === 'in' ? b.sp.x : b.x1, ty = b.st === 'in' ? b.sp.y : b.y1, sx = b.st === 'in' ? b.x0 : b.sp.x, sy = b.st === 'in' ? b.y0 : b.sp.y;
          b.dir = tx > sx ? 1 : -1; b.x = sx + (tx - sx) * u; b.y = sy + (ty - sy) * u - Math.sin(u * Math.PI) * H * 0.06;
          if (b.u >= 1) { if (b.st === 'in') { b.st = 'perch'; b.t = 4 + Math.random() * 6; b.x = b.sp.x; b.y = b.sp.y; } else { b.st = 'away'; b.sp.busy = 0; b.t = 5 + Math.random() * 8; b.x = -99; } } }
        else if (b.st === 'perch') { b.bob = Math.max(0, Math.sin(tt * 2.2 + b.x)) * (Math.sin(tt * 0.7 + b.y) > 0.3 ? 1 : 0); if (b.t <= 0) { b.st = 'out'; b.u = 0; b.x1 = Math.random() < 0.5 ? -60 : W + 60; b.y1 = H * (0.05 + Math.random() * 0.2); } } });
      // fireworks
      for (i = plan.length - 1; i >= 0; i--) if (t - T0 >= plan[i][0]) { boom(plan[i][1], plan[i][2], plan[i][3], plan[i][4]); plan.splice(i, 1); }
      shells.forEach(function (sh) { sh.age += dt; sh.parts.forEach(function (p) { p.px = p.x; p.py = p.y; p.vx *= Math.pow(0.18, dt); p.vy = p.vy * Math.pow(0.18, dt) + 30 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); });
      shells = shells.filter(function (sh) { return sh.age < 2.6; });
      flock.forEach(function (b) { b.u += dt / b.d; b.fl += dt * 18; });
      flock = flock.filter(function (b) { return b.u < 1.05; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, Tm = t - T0, col = australia_env(Tm, 0.5, 1.4, 5.2, 6.6);
      // ---- behind the Opera House: the lit bridge and city, the far ferry and sailboat, the fireworks
      ca.save(); ca.clip(behind, 'evenodd');
      if (dk) {
        ca.save(); ca.globalCompositeOperation = 'lighter';
        // floodlit pylons
        B.pyl.forEach(function (p) { australia_dot(ca, warmG, p[0], p[2] - (p[2] - p[1]) * 0.45, (p[2] - p[1]) * 0.6, 0.35); });
        // lamps along the arch and the deck
        B.lights.forEach(function (p, n) { var a = 0.75 + 0.25 * Math.sin(tt * 2 + n * 0.7); ca.fillStyle = 'rgba(255,236,190,' + a + ')'; ca.beginPath(); ca.arc(p[0], p[1], 1.3 * S, 0, 7); ca.fill(); if (n % 2 === 0) australia_dot(ca, warmG, p[0], p[1], 7 * S, 0.3 * a); });
        B.deck.forEach(function (p, n) { australia_dot(ca, warmG, p[0], p[1], 5 * S, 0.7); ca.fillStyle = '#FFF0C8'; ca.fillRect(p[0] - 0.8, p[1] - 0.8, 1.6, 1.6); });
        // city sparkle: windows switching on and off, the tower's turret aglow, house lights on the north shore
        ca.fillStyle = 'rgba(255,214,140,0.9)'; tw.forEach(function (o) { if (o.on) ca.fillRect(o.w[0], o.w[1], o.w[2], o.w[3]); });
        var sp = A.spire; australia_dot(ca, warmG, sp[0], sp[1] + sp[3] / 2, sp[2] * 0.9, 0.55 + 0.1 * Math.sin(tt * 1.5));
        ca.fillStyle = '#FF6A5A'; ca.globalAlpha = 0.5 + 0.5 * Math.sin(tt * 3); ca.beginPath(); ca.arc(sp[0], hb - H * (ph ? 0.43 : 0.46), 1.6, 0, 7); ca.fill(); ca.globalAlpha = 1;
        A.houses.forEach(function (h, n) { if (hash(n + 3) < 0.6) { ca.fillStyle = 'rgba(255,210,130,0.85)'; ca.fillRect(h[0], h[1], 2.4 * S, 2 * S); } });
        ca.restore();
      }
      // the far ferry and sailboat
      ferries.forEach(function (fy) { if (fy.far) drawFerry(ca, fy, tt); });
      sails.forEach(function (b) { if (b.far) sailboat(ca, b, tt); });
      // fireworks: trails of sparks that slow, droop and fade, a flash at each burst
      if (shells.length) { ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; ca.lineCap = 'round';
        shells.forEach(function (sh) { var life = Math.max(0, 1 - sh.age / 2.6);
          if (sh.age < 0.25) australia_dot(ca, flashG, sh.x, sh.y, (ph ? 40 : 70) * S * (sh.age / 0.25 + 0.3), (1 - sh.age / 0.25) * (dk ? 0.8 : 0.5));
          sh.parts.forEach(function (p, n) { var tw2 = sh.crackle && sh.age > 1 ? (Math.sin(t * 40 + n * 3) > 0 ? 1 : 0.15) : 1;
            ca.strokeStyle = sh.col[0]; ca.globalAlpha = life * tw2 * (dk ? 0.9 : 0.95); ca.lineWidth = (dk ? 1.7 : 2.6) * S; ca.beginPath(); ca.moveTo(p.x - (p.x - p.px) * 4, p.y - (p.y - p.py) * 4); ca.lineTo(p.x, p.y); ca.stroke();
            ca.fillStyle = sh.col[1]; ca.beginPath(); ca.arc(p.x, p.y, (dk ? 1.4 : 1.8) * S, 0, 7); ca.fill(); }); });
        ca.restore(); }
      ca.restore();
      // ---- the Opera House: a soft glow on the sails at night, colours in the moment
      if (dk || col > 0) { ca.save();
        if (dk) { var g = ca.createLinearGradient(0, A.wl, 0, A.wl - A.U * 1.6); g.addColorStop(0, 'rgba(255,214,160,0.34)'); g.addColorStop(1, 'rgba(255,240,220,0.08)'); ca.fillStyle = g; ca.globalCompositeOperation = 'screen'; ca.fill(bothP); ca.globalCompositeOperation = 'source-over'; }
        if (col > 0) { ca.save(); ca.clip(bothP); var span = A.pr - A.pl, cols = ['#FF5A8A', '#FFB43A', '#3AC8E8', '#8A5AFF', '#3AD88A', '#FF5A4A'];
          for (i = 0; i < 6; i++) { var x0 = A.pl + ((i / 6 + tt * 0.07) % 1) * span * 1.4 - span * 0.2, gr = ca.createLinearGradient(x0 - span * 0.14, 0, x0 + span * 0.14, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, cols[(i + Math.floor(tt * 0.5)) % 6]); gr.addColorStop(1, 'rgba(0,0,0,0)');
            ca.globalAlpha = col * (dk ? 0.6 : 0.5); ca.fillStyle = gr; ca.fillRect(x0 - span * 0.14, A.wl - A.U * 2, span * 0.28, A.U * 2); }
          ca.restore(); }
        ca.restore(); }
      // ---- the water: glints, the night's rippling reflections, the near ferry and boats, the pelican
      ca.save(); ca.clip(behind, 'evenodd'); ca.beginPath(); ca.rect(-10, hb + 1, W + 20, swTop - hb); ca.clip(); ca.lineCap = 'round';
      rip.forEach(function (r) { var a = 0.5 + 0.5 * Math.sin(tt * 1.5 + r.ph); ca.strokeStyle = dk ? 'rgba(170,180,255,' + (0.3 * a) + ')' : 'rgba(255,255,255,' + (0.7 * a) + ')'; ca.lineWidth = 1.2; ca.beginPath(); ca.moveTo(r.x, r.y); ca.lineTo(r.x + r.l, r.y); ca.stroke(); });
      if (dk || shells.length) { ca.globalCompositeOperation = 'lighter';
        if (dk) { B.lights.forEach(function (p, n) { if (n % 3) return; var ry = hb + (hb - p[1]) * 0.42; for (j = 0; j < 4; j++) { var yy = ry + j * 3.2, ww = 4 + 3 * Math.sin(tt * 2 + n + j); ca.fillStyle = 'rgba(255,220,150,' + (0.3 - j * 0.06) + ')'; ca.fillRect(p[0] - ww / 2 + Math.sin(tt * 1.7 + j + n) * 2, yy, ww, 1.4); } });
          A.glass.forEach(function (P) { var gx = P[P.length - 2][0], gy = A.wl + 2; for (j = 0; j < 8; j++) { var ww2 = 14 * S * (1 - j / 10) * (0.6 + 0.4 * Math.sin(tt * 2.3 + j)); ca.fillStyle = 'rgba(255,200,120,' + (0.32 - j * 0.03) + ')'; ca.fillRect(gx - ww2 + Math.sin(tt * 1.3 + j) * 3, gy + j * 4, ww2 * 2, 1.6); } }); }
        shells.forEach(function (sh) { var life = Math.max(0, 1 - sh.age / 2.6); for (j = 0; j < 6; j++) { var yy2 = hb + (hb - sh.y) * 0.4 + j * 5, w2 = 30 * S * (1 - j / 8); if (yy2 > swTop) break; ca.fillStyle = sh.col[0]; ca.globalAlpha = life * (dk ? 0.35 : 0.25) * (1 - j / 7); ca.fillRect(sh.x - w2 + Math.sin(tt * 2 + j) * 4, yy2, w2 * 2, 2); } ca.globalAlpha = 1; });
        ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      sails.forEach(function (b) { if (!b.far) sailboat(ca, b, tt); });
      ferries.forEach(function (fy) { if (!fy.far) drawFerry(ca, fy, tt); });
      if (pel.x > -98) { var py = pel.y + Math.sin(tt * 0.8) * 3, fl2 = Math.sin(tt * 3) > 0.7 ? Math.sin(tt * 9) : 0.15, ps = (ph ? 0.75 : 1.1) * S;
        ca.save(); ca.globalAlpha = dk ? 0.18 : 0.22; ca.translate(0, 2 * (pel.y + 20 * S)); ca.scale(1, -1); australia_pelican(ca, pel.x, py, ps, pel.dir, fl2, dk); ca.restore();
        australia_pelican(ca, pel.x, py, ps, pel.dir, fl2, dk); }
      // ---- in front: swaying gum leaves, the koala, the birds, the lorikeet flock
      sway.forEach(function (l) { var a = l.a0 + (Math.sin(tt * 1.2 + l.ph) * 0.18 + Math.sin(tt * 0.45 + l.x * 0.01) * 0.1) * f.a; cb.save(); cb.translate(l.x, l.y); cb.rotate(a); cb.drawImage(GUM[l.c], -7 * l.s, -2 * l.s, 14 * l.s, 40 * l.s); cb.restore(); });
      koala(cb, tt);
      var bs = (ph ? 0.8 : 1.1) * S;
      birds.forEach(function (b) { if (b.x < -90) return; var fly = b.st !== 'perch', fn = b.k === 'c' ? australia_cocky : australia_lory; fn(cb, b.x, b.y, bs * (b.k === 'c' ? 1.15 : 1), b.dir, fly ? b.fl : null, b.bob, dk); });
      flock.forEach(function (b) { var u = b.u, x = b.x0 + (b.x1 - b.x0) * u, y = b.y0 + Math.sin(u * Math.PI) * b.dip + Math.sin(u * 9 + b.ph) * 8 * S; australia_lory(cb, x, y, b.s, b.x1 > b.x0 ? 1 : -1, b.fl, 0, dk); });
    },
    finish: function (t) { T0 = t; shells = []; plan = [];
      var x0 = A.xS, x1 = Math.min(W * 0.98, A.xN), yT = A.top;
      for (i = 0; i < (ph ? 9 : 14); i++) { var tt2 = 0.15 + i * (ph ? 0.5 : 0.36) + Math.random() * 0.2, fx = x0 + (x1 - x0) * (0.1 + Math.random() * 0.8) - (ph ? W * 0.15 : 0), fy = yT - H * (0.05 + Math.random() * 0.2); plan.push([tt2, fx, fy, COL[i % COL.length], ph ? 30 : 44]); }
      flock = []; var dir = Math.random() < 0.5 ? 1 : -1;
      for (i = 0; i < (ph ? 9 : 14); i++) flock.push({u: -i * 0.04 - Math.random() * 0.05, d: 3.4, x0: dir > 0 ? -60 - Math.random() * 60 : W + 60 + Math.random() * 60, x1: dir > 0 ? W + 80 : -80, y0: H * (0.18 + Math.random() * 0.2), dip: H * (0.12 + Math.random() * 0.1), ph: Math.random() * 6, fl: Math.random() * 6, s: (ph ? 0.8 : 1.1) * S * (0.85 + Math.random() * 0.3)});
      birds.forEach(function (b) { if (b.st === 'perch') { b.st = 'out'; b.u = 0; b.x1 = Math.random() < 0.5 ? -60 : W + 60; b.y1 = H * 0.1; } }); }
  };
  function drawFerry(c, fy, tt) { var s = fy.s, y = fy.y;
    // the wake: a fan of foam lines and a frothy trail behind the stern
    c.save(); c.lineCap = 'round'; c.strokeStyle = dk ? 'rgba(190,200,255,0.3)' : 'rgba(255,255,255,0.85)'; c.lineWidth = 1.3;
    var sx = fy.x - fy.dir * 72 * s; for (j = 0; j < 5; j++) { var L = (30 + j * 26) * s, yy = y + 1 + j * 1.8 * s; c.globalAlpha = 1 - j * 0.17; c.beginPath(); c.moveTo(sx - fy.dir * L * 0.3, yy); c.lineTo(sx - fy.dir * L, yy + 1.6 * s + Math.sin(tt * 3 + j) * 0.6); c.stroke(); }
    c.globalAlpha = 0.6; c.fillStyle = dk ? 'rgba(190,200,255,0.25)' : 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(sx - fy.dir * 10 * s, y + 1, 16 * s, 2.2 * s, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(fy.x + fy.dir * 70 * s, y, 6 * s, 1.6 * s, 0, 0, 7); c.fill(); c.restore();
    c.save(); c.globalAlpha = dk ? 0.25 : 0.2; c.translate(fy.x, y + 2); c.scale(s, -s * 0.55); c.drawImage(FERRY, -80, -40, 160, 56); c.restore();
    australia_blit(c, FERRY, fy.x, y - 16 * s + Math.sin(tt * 1.5 + fy.x * 0.01) * 0.5, s, 0, 1, fy.dir < 0);
    if (dk) australia_dot(c, warmG, fy.x, y - 14 * s, 70 * s, 0.35); }
};
UIC.australia = {L: ['#24588A', '#163C62', 'rgba(255,255,255,0.86)', '#15283A', '#566876', '#1F6AA6', '#1F6AA6', '#2E8AB0', '#FFFFFF'], D: ['#26305E', '#101834', 'rgba(20,28,64,0.8)', '#F2F2FA', '#B6B8D6', '#F6C25E', '#F6C25E', '#F8D68C', '#121A3A']};
