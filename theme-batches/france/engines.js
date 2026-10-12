// ---- world theme engine: france (Paris)
// Loop: the Seine ripples and a tour boat glides along it and under the bridge, pigeons hop, peck and flutter on the
// quay, the chestnut leaves sway, the cafe awning flaps and a hot-air balloon drifts above the rooftops. Night: the
// tower glows gold and its beacon sweeps the sky, windows and lamps light up and their reflections shimmer in the river.
// Moment: the tower bursts into its sparkle of twinkling white lights, the beacon sweeps bright, a ribbon of glowing
// reflections runs down the river and the pigeons take off.
function france_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function france_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return france_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - france_ease((T - c) / (d - c)); }
var france_gc = null;
function france_rg(col, mid) { var g = (france_gc || (france_gc = document.createElement('canvas').getContext('2d'))).createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function france_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function france_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function france_blit(c, sp, x, y, s, rot, a) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (a != null) c.globalAlpha = a; c.drawImage(sp, -sp.w * s / 2, -sp.h * s / 2, sp.w * s, sp.h * s); c.restore(); }
// a pigeon standing at (x, y) (its feet), facing dir (1 right, -1 left); peck 0..1 lowers the head, flap > 0 spreads the wings
function france_pigeon(c, x, y, s, dir, t, peck, flap, dk) {
  var P = dk ? {b: '#6A6E86', w: '#7E8298', bar: '#2E3044', h: '#5A5E76', g: '#4A8A7A', p: '#7A5A92', f: '#C07888'} : {b: '#A2A8B6', w: '#BCC0CC', bar: '#4A4E5C', h: '#8A90A0', g: '#5FA888', p: '#9070B0', f: '#E08A96'};
  c.save(); c.translate(x, y); c.scale(s * dir, s); c.lineCap = 'round';
  if (!flap) { c.strokeStyle = P.f; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1, -4); c.lineTo(-2, 0); c.moveTo(2, -4); c.lineTo(2.6, 0); c.moveTo(-3.6, 0); c.lineTo(-0.4, 0); c.moveTo(1, 0); c.lineTo(4.2, 0); c.stroke(); }
  c.fillStyle = P.b; c.beginPath(); c.moveTo(-6, -7); c.lineTo(-14, -5.4); c.lineTo(-13.4, -2.6); c.lineTo(-5, -4.4); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0, -7.4, 8, 5.2, -0.12, 0, 7); c.fill();
  if (flap) { var a = Math.sin(t * 28) * 0.9; c.fillStyle = P.w; [1, -1].forEach(function (sd) { c.save(); c.translate(-1, -10); c.rotate(-0.4 + sd * 0.15 + a * (sd > 0 ? 1 : 0.8)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -12, -11, -14); c.lineTo(-8, -6); c.lineTo(-12, -6); c.quadraticCurveTo(-6, -1, 0, 1.5); c.fill(); c.restore(); }); }
  else { c.fillStyle = P.w; c.beginPath(); c.ellipse(-2, -7.6, 6.2, 3.6, -0.12, 0, 7); c.fill(); c.strokeStyle = P.bar; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-5.4, -8.6); c.lineTo(-1.4, -9.2); c.moveTo(-6.4, -6.8); c.lineTo(-2.2, -7.4); c.stroke(); }
  var hy = -12 + peck * 7, hx = 6 + peck * 2.4;
  c.fillStyle = P.h; c.beginPath(); c.moveTo(3, -10); c.quadraticCurveTo(hx - 1, hy + 1, hx, hy - 1); c.lineTo(hx + 2.6, hy + 1); c.quadraticCurveTo(7, -7, 5, -5); c.fill();
  c.fillStyle = P.g; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(4.6, -9.6 + peck * 3, 2.2, 2.6, 0.5, 0, 7); c.fill(); c.fillStyle = P.p; c.beginPath(); c.ellipse(5.2, -8.4 + peck * 3, 1.6, 1.8, 0.5, 0, 7); c.fill(); c.globalAlpha = 1;
  c.fillStyle = P.h; c.beginPath(); c.arc(hx, hy, 2.8, 0, 7); c.fill();
  c.fillStyle = '#3A3430'; c.beginPath(); c.moveTo(hx + 2.4, hy - 0.4); c.lineTo(hx + 5, hy + 0.6); c.lineTo(hx + 2.4, hy + 1); c.fill();
  c.fillStyle = '#F0E8E0'; c.beginPath(); c.arc(hx + 2.4, hy - 0.6, 0.7, 0, 7); c.fill();
  c.fillStyle = '#E86A3A'; c.beginPath(); c.arc(hx + 0.6, hy - 0.8, 0.9, 0, 7); c.fill(); c.fillStyle = '#1A1418'; c.beginPath(); c.arc(hx + 0.7, hy - 0.8, 0.45, 0, 7); c.fill();
  c.restore(); }
ENGINES.france = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, C = A.C, S = A.S, i, j;
  var TW = A.T, tBody = new Path2D(TW.body), tLat = new Path2D(TW.lat), ry0 = A.ry0, ptop = A.ptop, pbot = A.pbot, yw = A.yw;
  // the sky above the far bank's skyline, where the tower's lights may show
  var skyClip = new Path2D(), SK = A.SK; skyClip.moveTo(-40, -40); skyClip.lineTo(W + 40, -40); skyClip.lineTo(W + 40, SK[SK.length - 1]); for (i = SK.length - 1; i >= 0; i--) skyClip.lineTo(i * A.SKs, SK[i] + 1); skyClip.lineTo(-40, SK[0]); skyClip.closePath();
  var goldG = france_rg('rgba(255,196,96,0.5)', [0.35, 0.22]), lampG = france_rg(dk ? 'rgba(255,200,120,0.75)' : 'rgba(255,220,160,0.35)', [0.25, 0.35]), whiteG = france_rg('rgba(255,255,255,0.95)', [0.2, 0.4]), winG = france_rg('rgba(255,200,120,0.4)', [0.3, 0.3]);
  // sparkle points: at most about 900, spread evenly over the tower
  var SP = TW.pts; if (SP.length > 1800) { var st = SP.length / 1800, s2 = []; for (i = 0; i < SP.length; i += st) s2.push(SP[Math.floor(i)]); SP = s2; }
  var spPh = SP.map(function (p, k) { return [hash(k * 3.1 + 1) * 6.28, 9 + hash(k * 1.7 + 5) * 9]; });
  // ripples on the Seine
  var rip = []; for (i = 0; i < (ph ? 40 : 80); i++) rip.push({x: hash(i + 11) * W, y: ry0 + 5 + hash(i + 12) * (ptop - ry0 - 9), l: 6 + hash(i + 13) * 22, ph: hash(i + 14) * 6.28, v: 4 + hash(i + 15) * 6});
  // lit windows at night: about four in ten, a few switch on and off now and then
  var wins = A.wins.map(function (w) { return {x: w[0], y: w[1], w: w[2], h: w[3], on: w[4] < 0.42, k: w[4]}; }), nextFlip = 2;
  // the tour boat
  var bs = A.boat.s, boatY = A.boat.y, boatX = W * 0.62, boatV = (ph ? 13 : 20) * (ph ? 1 : S);
  var BOAT = france_sprite(140, 40, 3, function (o) { o.translate(0, 8);
    o.fillStyle = dk ? 'rgba(0,0,0,0.25)' : 'rgba(30,50,70,0.15)'; o.beginPath(); o.ellipse(0, 1, 62, 3, 0, 0, 7); o.fill();
    var g = o.createLinearGradient(0, -8, 0, 0); g.addColorStop(0, dk ? '#2A3458' : '#2E4064'); g.addColorStop(1, dk ? '#1A2040' : '#1E2C48'); o.fillStyle = g;
    o.beginPath(); o.moveTo(-64, -8); o.lineTo(58, -8); o.lineTo(68, -13); o.lineTo(64, -1); o.quadraticCurveTo(60, 1, 54, 1); o.lineTo(-58, 1); o.quadraticCurveTo(-63, 0, -64, -8); o.fill();
    o.fillStyle = dk ? '#A84048' : '#C8463E'; o.fillRect(-62, -6.5, 122, 1.6);
    o.fillStyle = dk ? '#C8C4D8' : '#FFFFFF'; o.beginPath(); o.moveTo(-54, -8); o.lineTo(-52, -21); o.lineTo(46, -21); o.lineTo(52, -8); o.fill();
    o.fillStyle = dk ? '#9A98B0' : '#E4E6EC'; o.beginPath(); o.moveTo(-55, -21); o.lineTo(-50, -25); o.lineTo(44, -25); o.lineTo(48, -21); o.fill();
    for (var k = 0; k < 10; k++) { var gx = -49 + k * 9.6, gg = o.createLinearGradient(0, -19, 0, -11); if (dk) { gg.addColorStop(0, '#FFE2A0'); gg.addColorStop(1, '#F2B860'); } else { gg.addColorStop(0, '#CFE6F2'); gg.addColorStop(1, '#8EB4CC'); } o.fillStyle = gg; o.fillRect(gx, -19, 7.4, 8.4); }
    o.fillStyle = dk ? '#C8C4D8' : '#FFFFFF'; o.fillRect(-60, -30, 10, 9); o.fillStyle = dk ? '#FFE2A0' : '#9EC4DA'; o.fillRect(-58.6, -28.6, 7.2, 4.4);
    o.fillStyle = dk ? '#A84048' : '#C8463E'; o.fillRect(-61, -31.4, 12, 1.8);
    o.strokeStyle = dk ? '#8A88A0' : '#5A6478'; o.lineWidth = 0.8; o.beginPath(); for (k = 0; k < 20; k++) { o.moveTo(-52 + k * 5, -8); o.lineTo(-52 + k * 5, -5.5); } o.moveTo(-58, -8); o.lineTo(54, -8); o.stroke(); });
  // the hot-air balloon: coral, cream and teal gores
  var bal = {x: W * (ph ? 0.2 : 0.3), y: H * (ph ? 0.3 : 0.22), v: ph ? 3 : 5}, BR = ph ? 13 : 17 * S;
  var BAL = france_sprite(60, 80, 3, function (o) { o.translate(0, -10); var cols = ['#F0806A', '#FFF4E2', '#4EA8A0', '#FFF4E2', '#F0806A', '#F6C25A'];
    o.save(); o.beginPath(); o.moveTo(-9, 26); o.bezierCurveTo(-22, 14, -26, -4, -22, -14); o.arc(0, -10, 22.4, Math.PI * 1.06, Math.PI * 1.94); o.bezierCurveTo(26, -4, 22, 14, 9, 26); o.closePath(); o.clip();
    for (var k = 0; k < 6; k++) { o.fillStyle = cols[k]; o.beginPath(); o.ellipse(0, -2, 26 - k * 4.4, 32, 0, 0, 7); o.fill(); }
    var g = o.createLinearGradient(-24, 0, 24, 0); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,30,60,0.25)'); o.fillStyle = g; o.fillRect(-30, -40, 60, 70); o.restore();
    o.strokeStyle = '#6A5040'; o.lineWidth = 0.8; o.beginPath(); o.moveTo(-8, 26); o.lineTo(-5, 34); o.moveTo(8, 26); o.lineTo(5, 34); o.stroke();
    o.fillStyle = '#9A6A40'; o.fillRect(-5.4, 34, 10.8, 7); o.fillStyle = '#7A5030'; o.fillRect(-5.4, 34, 10.8, 1.6); });
  // pigeons on the cobbles
  var px0 = W * (ph ? 0.4 : 0.31), px1 = W * (ph ? 0.84 : 0.6), py0 = pbot + H * 0.025, py1 = H - H * 0.02, pigs = [];
  for (i = 0; i < (ph ? 3 : 5); i++) pigs.push({x: px0 + hash(i + 31) * (px1 - px0), y: py0 + hash(i + 32) * (py1 - py0), dir: hash(i + 33) < 0.5 ? -1 : 1, st: 'idle', tt: hash(i + 34) * 2, dur: 1, z: 0, peck: 0, vx: 0, vy: 0, fx: 0, fy: 0, x0: 0, y0: 0});
  function pigNext(p) { var r = Math.random(); p.st = r < 0.42 ? 'peck' : r < 0.82 ? 'hop' : r < 0.96 ? 'idle' : 'fly'; p.dur = p.st === 'peck' ? 0.7 : p.st === 'hop' ? 0.32 : p.st === 'fly' ? 2.6 : 0.8 + Math.random() * 1.4; p.tt = 0; p.x0 = p.x; p.y0 = p.y;
    if (p.st === 'hop') { if (Math.random() < 0.25) p.dir *= -1; p.fx = Math.max(px0, Math.min(px1, p.x + p.dir * (6 + Math.random() * 8) * (ph ? 0.8 : S))); p.fy = Math.max(py0, Math.min(py1, p.y + (Math.random() - 0.5) * 6)); }
    if (p.st === 'fly') { p.fx = px0 + Math.random() * (px1 - px0); p.fy = py0 + Math.random() * (py1 - py0); p.dir = p.fx > p.x ? 1 : -1; } }
  // chestnut leaves that sway at the edge of each canopy (sprites in the two greens), and a few falling leaves
  var LEAF = [C.lfD, C.lfL].map(function (col) { return france_sprite(30, 30, 3, function (o) { o.fillStyle = col; for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + (k - 2) * 0.5, L = 13 * (1 - Math.abs(k - 2) * 0.16); o.save(); o.rotate(a); o.beginPath(); o.ellipse(L * 0.55, 0, L * 0.5, L * 0.18, 0, 0, 7); o.fill(); o.restore(); } o.strokeStyle = col; o.lineWidth = 1; o.beginPath(); o.moveTo(0, 0); o.lineTo(0, 5); o.stroke(); }); });
  var sway = []; A.trees.forEach(function (tr, n) { tr.blobs.forEach(function (b, m) { for (var k = 0; k < 5; k++) { var a = (k / 5 + hash(m * 5 + k + n * 50) * 0.15) * Math.PI * 2; if (Math.sin(a) < -0.6 && hash(k + m) < 0.6) continue; sway.push({x: b[0] + Math.cos(a) * b[2] * 0.98, y: b[1] + Math.sin(a) * b[2] * 0.98, a: a + Math.PI / 2, s: tr.s * (0.8 + hash(k * 7 + m) * 0.4), c: k % 3 === 0 ? 1 : 0, ph: hash(k + m * 3 + n) * 6.28, gx: tr.x}); } }); });
  var fall = []; for (i = 0; i < (ph ? 2 : 4); i++) fall.push({x: -99, y: 0, vx: 0, vy: 0, r: 0, t: i * 3.4});
  var FALLL = france_sprite(30, 30, 3, function (o) { o.fillStyle = dk ? '#7A8A4A' : '#C8A84A'; for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + (k - 2) * 0.5, L = 13 * (1 - Math.abs(k - 2) * 0.16); o.save(); o.rotate(a); o.beginPath(); o.ellipse(L * 0.55, 0, L * 0.5, L * 0.18, 0, 0, 7); o.fill(); o.restore(); } });
  // the cafe awning: red and cream stripes with a scalloped valance that lifts in the breeze
  var AW = A.awn;
  function awning(c, t, f) { var sw = (AW.x1 - AW.x0) / AW.n, dep = AW.y1 - AW.y0;
    for (var k = 0; k < AW.n; k++) { var x0 = AW.x0 + k * sw, wv = Math.sin(t * 2.3 - k * 0.55) * 1.6 * f.a + Math.sin(t * 5.1 + k) * 0.5 * f.a, lift = (1.2 + Math.sin(t * 1.3) * 0.8) * f.a;
      c.fillStyle = k % 2 ? C.cream : C.red; c.beginPath(); c.moveTo(x0, AW.y0); c.lineTo(x0 + sw, AW.y0); c.lineTo(x0 + sw + 3, AW.y1 - lift + wv * 0.4); c.lineTo(x0 + 3, AW.y1 - lift + wv * 0.4); c.fill();
      c.beginPath(); c.ellipse(x0 + 3 + sw / 2, AW.y1 - lift + wv, sw / 2, 4 * S + wv * 0.3, 0, 0, Math.PI); c.lineTo(x0 + 3, AW.y1 - lift + wv * 0.4 - 2); c.lineTo(x0 + 3 + sw, AW.y1 - lift + wv * 0.4 - 2); c.fill(); }
    c.fillStyle = dk ? 'rgba(10,8,30,0.25)' : 'rgba(80,30,20,0.12)'; c.fillRect(AW.x0, AW.y0, AW.x1 - AW.x0 + 3, dep * 0.25);
    c.fillStyle = C.dark; c.fillRect(AW.x0, AW.y0 - 2, AW.x1 - AW.x0 + 2, 2.4); }
  var lastT = 0;
  return {
    step: function (dt, t, f) {
      lastT = t;
      rip.forEach(function (r) { r.x -= r.v * dt * f.s; if (r.x + r.l < -10) r.x = W + 10; });
      boatX -= boatV * dt * f.s; if (boatX < -160 * bs) boatX = W + 260 * bs;
      bal.x += bal.v * dt * f.s; if (bal.x > W + 40) bal.x = -40;
      if (dk && t > nextFlip) { var w = wins[Math.floor(Math.random() * wins.length)]; if (w) w.on = !w.on; nextFlip = t + 1.5 + Math.random() * 3; }
      pigs.forEach(function (p) { p.tt += dt * f.s; var u = Math.max(0, Math.min(1, p.tt / p.dur));
        if (p.st === 'peck') p.peck = Math.sin(u * Math.PI * 2) > 0 ? Math.sin(u * Math.PI * 2) : 0;
        else p.peck = 0;
        if (p.st === 'hop') { p.x = p.x0 + (p.fx - p.x0) * u; p.y = p.y0 + (p.fy - p.y0) * u; p.z = Math.sin(u * Math.PI) * 5; }
        else if (p.st === 'fly') { p.x = p.x0 + (p.fx - p.x0) * france_ease(u); p.y = p.y0 + (p.fy - p.y0) * u; p.z = Math.sin(u * Math.PI) * H * 0.12; }
        else p.z = 0;
        if (u >= 1) { p.z = 0; pigNext(p); } });
      fall.forEach(function (l) { if (l.x < -50 || l.y > H + 20) { l.t -= dt; if (l.t <= 0) { var tr = A.trees[Math.floor(Math.random() * A.trees.length)]; l.x = tr.x + (Math.random() - 0.5) * tr.R; l.y = tr.y + Math.random() * tr.R * 0.3; l.vy = 14 + Math.random() * 8; l.vx = -6 - Math.random() * 6; l.r = Math.random() * 6; l.t = 4 + Math.random() * 5; } return; }
        l.y += l.vy * dt * f.s; l.x += (l.vx + Math.sin(t * 1.6 + l.r) * 14) * dt * f.s; l.r += dt * 1.4; if (l.y > H + 20) l.x = -99; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, Tm = t - T0, spk = france_env(Tm, 0.3, 0.9, 7.4, 9), ribbon = france_env(Tm, 0.6, 1.6, 8, 10), beamA = dk ? 0.35 + spk * 0.6 : spk * 0.55;
      // the balloon, behind the tower and buildings' tops
      france_blit(ca, BAL, bal.x, bal.y + Math.sin(tt * 0.6) * 4, BR / 17, Math.sin(tt * 0.5) * 0.04, dk ? 0.75 : 1);
      if (dk) france_dot(ca, france_rg('rgba(255,170,80,0.6)'), bal.x, bal.y + BR * 1.4, BR * 0.8, 0.3 + 0.3 * flick(tt, 2));
      // the tower: gold at night, the beacon, the sparkle (only where it shows above the far bank)
      var B = TW.beacon;
      ca.save(); ca.clip(skyClip);
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; france_dot(ca, goldG, A.TX, A.TB - A.TH * 0.4, A.TH * 0.55, 0.55 - spk * 0.2); ca.restore();
        ca.globalAlpha = 0.92 - spk * 0.3; ca.fillStyle = '#E8A848'; ca.fill(tBody); ca.strokeStyle = '#F6C462'; ca.lineWidth = Math.max(0.8, A.TH * 0.0024); ca.stroke(tLat); ca.globalAlpha = 1;
        ca.save(); ca.globalCompositeOperation = 'lighter'; ca.globalAlpha = 0.35; ca.strokeStyle = '#FFE2A0'; ca.lineWidth = Math.max(0.6, A.TH * 0.0012); ca.stroke(tLat); ca.restore(); }
      if (beamA > 0.01) { var th = tt * (0.45 + spk * 0.5), L = W * 0.75;
        [0, Math.PI].forEach(function (o2) { var a = th + o2, cx = Math.cos(a), sy = Math.sin(a), vis = 0.35 + 0.65 * Math.abs(cx), ex = B[0] + cx * L, ey = B[1] - 6 + sy * L * 0.06, wd = L * (0.03 + 0.05 * (1 - Math.abs(cx)));
          var g = ca.createLinearGradient(B[0], B[1], ex, ey); g.addColorStop(0, 'rgba(255,248,220,' + (0.55 * beamA * vis) + ')'); g.addColorStop(1, 'rgba(255,248,220,0)');
          ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; ca.fillStyle = g; ca.beginPath(); ca.moveTo(B[0], B[1] - 1.5); ca.lineTo(ex, ey - wd); ca.lineTo(ex, ey + wd); ca.lineTo(B[0], B[1] + 1.5); ca.fill(); ca.restore(); });
        ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; france_dot(ca, whiteG, B[0], B[1], 9 + 4 * Math.sin(tt * 3), 0.4 + beamA * 0.6); ca.restore(); }
      if (spk > 0) { ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; var rr = Math.max(1.1, A.TH * 0.0032);
        if (!dk) { ca.save(); ca.globalAlpha = spk * 0.5; ca.fillStyle = '#5A4434'; ca.fill(tBody); ca.restore(); }
        for (i = 0; i < SP.length; i++) { var q = spPh[i], vv = Math.sin(t * q[1] + q[0]); if (vv < 0.25) continue; var al = Math.min(1, (vv - 0.25) / 0.5) * spk, p = SP[i];
          if (!dk) { ca.fillStyle = 'rgba(255,200,90,' + (al * 0.55) + ')'; ca.beginPath(); ca.arc(p[0], p[1], rr * 2.4, 0, 7); ca.fill(); }
          ca.fillStyle = 'rgba(255,255,255,' + al + ')'; ca.beginPath(); ca.arc(p[0], p[1], rr * (0.6 + vv * 0.6), 0, 7); ca.fill();
          if (vv > 0.97) france_dot(ca, whiteG, p[0], p[1], rr * 6, al * 0.7); }
        ca.restore(); }
      ca.restore();
      // lit windows at night
      if (dk) { ca.save(); wins.forEach(function (w) { if (!w.on && spk < 0.5) return; ca.fillStyle = w.k < 0.15 ? '#FFE6B0' : '#F6C878'; ca.globalAlpha = w.on ? 0.95 : spk * 0.6; ca.fillRect(w.x, w.y, w.w, w.h); ca.fillStyle = 'rgba(160,90,40,0.35)'; ca.fillRect(w.x + w.w * 0.46, w.y, w.w * 0.08, w.h); ca.fillRect(w.x, w.y + w.h * 0.4, w.w, w.h * 0.06); }); ca.restore(); }
      // the river: ripples, the tower's reflection, windows' reflections, and the finishing ribbon of light
      ca.save(); ca.beginPath(); ca.rect(-10, ry0, W + 20, ptop - ry0 + 2); ca.clip();
      ca.lineCap = 'round';
      rip.forEach(function (r) { var a = 0.5 + 0.5 * Math.sin(tt * 1.4 + r.ph); ca.strokeStyle = dk ? 'rgba(170,190,255,' + (0.28 * a) + ')' : 'rgba(255,255,255,' + (0.75 * a) + ')'; ca.lineWidth = 1.2; ca.beginPath(); ca.moveTo(r.x, r.y); ca.lineTo(r.x + r.l, r.y); ca.stroke(); });
      if (dk || ribbon > 0) { ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; var n = ph ? 14 : 20, hw = TW.hw * 0.7;
        for (i = 0; i < n; i++) { var yy = ry0 + 4 + i * (ptop - ry0 - 6) / n, ww2 = hw * (1 - i / n * 0.6) * (0.6 + 0.4 * Math.sin(tt * 2.1 + i * 1.9)), xx = A.TX + Math.sin(tt * 1.3 + i * 0.8) * 4;
          ca.fillStyle = (dk ? 'rgba(255,200,110,' : 'rgba(255,230,150,') + ((dk ? 0.38 : 0) + ribbon * (dk ? 0.5 : 0.8)) * (1 - i / n * 0.5) + ')'; ca.fillRect(xx - ww2 / 2, yy, ww2, 1.8); } }
      if (dk) wins.forEach(function (w, k) { if (!w.on || w.y + w.h < A.hb - H * 0.12 || k % 3) return; var yy2 = ry0 + 4 + (k % 5) * 3; ca.fillStyle = 'rgba(255,200,120,' + (0.18 + 0.12 * Math.sin(tt * 2 + k)) + ')'; ca.fillRect(w.x - 1 + Math.sin(tt * 1.7 + k) * 2, yy2, w.w + 2, 1.6); });
      if (ribbon > 0) { var front = A.TX - (Tm - 0.6) * W * 0.22, gl = dk ? 'lighter' : 'source-over'; ca.globalCompositeOperation = gl;
        for (i = 0; i < (ph ? 70 : 140); i++) { var rx = W * hash(i * 1.3 + 2), ry = ry0 + 4 + hash(i * 2.1 + 3) * (ptop - ry0 - 8); if (rx < front) continue; var fade = Math.min(1, (rx - front) / 60) * ribbon, wl = 6 + hash(i + 9) * 20, sh = 0.5 + 0.5 * Math.sin(t * 6 + i);
          ca.fillStyle = (dk ? 'rgba(255,220,140,' : 'rgba(255,236,170,') + (fade * sh * 0.95) + ')'; ca.fillRect(rx - wl / 2 - (t * 6 % 12), ry, wl, dk ? 1.8 : 2.4); } }
      ca.restore();
      // the boat, with its reflection; the bridge (in front) hides it as it passes under
      ca.save(); ca.globalAlpha = dk ? 0.25 : 0.18; ca.translate(boatX, boatY + 2); ca.scale(bs, -bs * 0.6); ca.drawImage(BOAT, -70, -28, 140, 40); ca.restore();
      france_blit(ca, BOAT, boatX, boatY - 12 * bs + Math.sin(tt * 1.6) * 0.5, bs, 0);
      ca.strokeStyle = dk ? 'rgba(200,210,255,0.3)' : 'rgba(255,255,255,0.8)'; ca.lineWidth = 1.2; ca.beginPath(); for (i = 0; i < 3; i++) { var wx = boatX + (66 + i * 16) * bs; ca.moveTo(wx, boatY + 1 + i * 1.6); ca.lineTo(wx + 14 * bs, boatY + 2 + i * 2.2); } ca.stroke();
      if (dk) france_dot(ca, winG, boatX, boatY - 10 * bs, 60 * bs, 0.5);
      // ---- front canvas: the awning, the chestnut leaves, pigeons, lamps
      awning(cb, tt, f);
      sway.forEach(function (l) { var a = l.a + (Math.sin(tt * 1.3 + l.ph) * 0.14 + Math.sin(tt * 0.5 + l.gx * 0.01) * 0.08) * f.a; france_blit(cb, LEAF[l.c], l.x, l.y, l.s * 0.95, a); });
      fall.forEach(function (l) { if (l.x > -50) france_blit(cb, FALLL, l.x, l.y, 0.7 * S, l.r); });
      pigs.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (p) { var ps = (ph ? 1.05 : 1.45 * S) * (0.85 + (p.y - py0) / (py1 - py0 + 1) * 0.3);
        cb.fillStyle = dk ? 'rgba(0,0,10,0.25)' : 'rgba(60,40,20,0.16)'; cb.beginPath(); cb.ellipse(p.x, p.y, 7 * ps * Math.max(0.4, 1 - p.z / 60), 1.6 * ps, 0, 0, 7); cb.fill();
        france_pigeon(cb, p.x, p.y - p.z, ps, p.dir, t, p.peck, p.st === 'fly' || p.z > 3 && p.st !== 'hop', dk); });
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; A.lamps.forEach(function (l, k) { france_dot(cb, lampG, l[0], l[1], 30 * l[2], 0.75 + 0.08 * Math.sin(tt * 2 + k)); }); A.cafe.forEach(function (g) { france_dot(cb, winG, g[0] + g[2] / 2, g[1] + g[3] / 2, g[3] * 0.9, 0.5); }); cb.restore();
        cb.save(); cb.globalAlpha = 0.5; cb.fillStyle = '#F6C070'; A.cafe.forEach(function (g) { cb.fillRect(g[0], g[1], g[2], g[3]); }); cb.restore(); }
    },
    finish: function (t) { T0 = t; pigs.forEach(function (p, k) { p.st = 'fly'; p.dur = 2.4 + k * 0.2; p.tt = -k * 0.15; p.x0 = p.x; p.y0 = p.y; p.fx = px0 + Math.random() * (px1 - px0); p.fy = py0 + Math.random() * (py1 - py0); p.dir = p.fx > p.x ? 1 : -1; }); }
  };
};
UIC.france = {L: ['#3A4E7A', '#24345A', 'rgba(255,253,250,0.86)', '#1F2A3C', '#5E6676', '#B8403A', '#B8403A', '#D9704E', '#FFFFFF'], D: ['#2E3466', '#161A3A', 'rgba(22,26,58,0.8)', '#F4F0FA', '#B8B4D4', '#F2C46A', '#F2C46A', '#F6D892', '#161A3A']};
