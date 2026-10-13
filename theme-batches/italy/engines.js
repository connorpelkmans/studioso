// ---- world theme engines: italy (Amalfi Coast)
// Loop: small waves wash up the pebble beach, the boats in the cove bob at anchor, the Italian flag waves on the terrace,
// laundry flutters on a line across a house front, lemons sway on the terraces, gulls glide and flap, shutters swing. Night: the windows
// glow warm all the way up the slope, the dome is lit, and the lights shimmer on the water under a crescent moon.
// Moment: the church bells swing and ring, a little red scooter zips along the coast road, a sailboat glides into the
// cove and a burst of lemon blossoms drifts out over the water.
function italy_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function italy_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return italy_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - italy_ease((T - c) / (d - c)); }
var italy_gc = null;
function italy_ctx() { return italy_gc || (italy_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with italy_dot)
function italy_rg(col, mid) { var g = italy_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function italy_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function italy_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
// a little wooden gozzo boat (bow to the right), its waterline at y = 0
function italy_gozzo(o, stripe, dk) {
  var g = o.createLinearGradient(0, -9, 0, 3); g.addColorStop(0, dk ? '#C9CDDE' : '#FFFFFF'); g.addColorStop(1, dk ? '#8A8EA6' : '#DDE6EA'); o.fillStyle = g;
  o.beginPath(); o.moveTo(-22, -8); o.lineTo(20, -9.5); o.quadraticCurveTo(26, -11, 27, -15); o.quadraticCurveTo(26, -4, 18, 1.5); o.lineTo(-17, 1.5); o.quadraticCurveTo(-22, -2, -22, -8); o.closePath(); o.fill();
  o.fillStyle = stripe; o.beginPath(); o.moveTo(-21.6, -5.6); o.lineTo(22.6, -7.4); o.lineTo(22, -5.2); o.lineTo(-20.6, -3.4); o.closePath(); o.fill();
  o.strokeStyle = dk ? '#4A3434' : '#8A5E3E'; o.lineWidth = 1.6; o.beginPath(); o.moveTo(-22, -8); o.lineTo(20, -9.5); o.quadraticCurveTo(26, -11, 27, -15); o.stroke();
  o.fillStyle = dk ? '#5A4040' : '#B07A50'; o.fillRect(-12, -11, 3, 3); o.fillRect(4, -11.5, 3, 3);
  o.fillStyle = 'rgba(0,0,0,0.12)'; o.fillRect(-17, 0, 35, 1.5); }
// a sailboat (bow to the right), waterline at y = 0
function italy_sailboat(o, dk) {
  o.fillStyle = dk ? '#2A3A6A' : '#1F4E79'; o.beginPath(); o.moveTo(-24, -6); o.lineTo(26, -6); o.quadraticCurveTo(22, 2, 16, 2.5); o.lineTo(-18, 2.5); o.closePath(); o.fill();
  o.fillStyle = dk ? '#C9CDDE' : '#FFFFFF'; o.fillRect(-24, -7.6, 50, 2);
  o.strokeStyle = dk ? '#8A7A6A' : '#6A4A34'; o.lineWidth = 1.6; o.beginPath(); o.moveTo(0, -6); o.lineTo(0, -62); o.stroke();
  var g = o.createLinearGradient(-20, -60, 10, -8); g.addColorStop(0, dk ? '#E8EAF6' : '#FFFFFF'); g.addColorStop(1, dk ? '#A8ACC6' : '#EDE6D6'); o.fillStyle = g;
  o.beginPath(); o.moveTo(-2, -60); o.quadraticCurveTo(-14, -34, -22, -10); o.lineTo(-2, -10); o.closePath(); o.fill();
  o.beginPath(); o.moveTo(2, -56); o.quadraticCurveTo(14, -32, 24, -10); o.lineTo(2, -10); o.closePath(); o.fill();
  o.fillStyle = dk ? '#D8B040' : '#F7CB34'; o.beginPath(); o.moveTo(-6.4, -50); o.quadraticCurveTo(-12, -38, -15.6, -28); o.lineTo(-13, -26); o.quadraticCurveTo(-8, -38, -4.6, -46); o.closePath(); o.fill();
  o.save(); o.beginPath(); o.moveTo(0.8, -63); o.quadraticCurveTo(6, -61.5, 11, -60.4); o.quadraticCurveTo(6, -59.2, 0.8, -57.6); o.closePath(); o.fillStyle = dk ? '#A6AAC4' : '#FBF8F0'; o.fill(); o.clip();
  o.fillStyle = dk ? '#245E4C' : '#2E9A5E'; o.fillRect(0, -64, 4.2, 8); o.fillStyle = dk ? '#8C3C48' : '#D8443F'; o.fillRect(7.4, -64, 5, 8); o.restore(); }
// the little red scooter (facing right), wheels on y = 0
function italy_scooter(o, dk) {
  o.fillStyle = '#2A2228'; [[-9, -3.4], [9, -3.4]].forEach(function (w) { o.beginPath(); o.arc(w[0], w[1], 3.4, 0, 7); o.fill(); });
  o.fillStyle = '#B8BCC8'; [[-9, -3.4], [9, -3.4]].forEach(function (w) { o.beginPath(); o.arc(w[0], w[1], 1.3, 0, 7); o.fill(); });
  var g = o.createLinearGradient(0, -16, 0, -2); g.addColorStop(0, '#FF6A5A'); g.addColorStop(1, '#C8282A'); o.fillStyle = g;
  o.beginPath(); o.moveTo(-14, -5); o.quadraticCurveTo(-15, -13, -7, -13); o.lineTo(0, -12); o.lineTo(2, -5); o.closePath(); o.fill();
  o.beginPath(); o.moveTo(2, -5); o.lineTo(6, -16); o.lineTo(9, -16); o.quadraticCurveTo(13, -9, 12, -5); o.closePath(); o.fill();
  o.fillStyle = '#4A3A3A'; o.beginPath(); o.ellipse(-6, -14, 6, 1.8, 0, 0, 7); o.fill();
  o.strokeStyle = '#3A3A44'; o.lineWidth = 1.4; o.beginPath(); o.moveTo(7, -16); o.lineTo(6, -21); o.lineTo(2.6, -22); o.stroke();
  o.fillStyle = dk ? '#FFF2B0' : '#FFF8E0'; o.beginPath(); o.arc(9.6, -16, 1.8, 0, 7); o.fill();
  o.fillStyle = '#FFFFFF'; o.globalAlpha = 0.5; o.fillRect(-11, -11.5, 6, 1.2); o.globalAlpha = 1; }
function italy_lemonAt(c, x, y, r, rot, dk) { c.save(); c.translate(x, y); c.rotate(rot); var g = c.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r * 1.3); g.addColorStop(0, dk ? '#F6E08A' : '#FFF29A'); g.addColorStop(1, dk ? '#C8A030' : '#F2BC1A'); c.fillStyle = g;
  c.beginPath(); c.moveTo(-r * 1.45, 0); c.quadraticCurveTo(-r * 1.1, -r * 0.95, 0, -r * 0.95); c.quadraticCurveTo(r * 1.1, -r * 0.95, r * 1.45, 0); c.quadraticCurveTo(r * 1.1, r * 0.95, 0, r * 0.95); c.quadraticCurveTo(-r * 1.1, r * 0.95, -r * 1.45, 0); c.fill(); c.restore(); }
function italy_blossom(c, x, y, s, rot, a) { c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.fillStyle = '#FFFFFF'; for (var q = 0; q < 5; q++) { c.rotate(Math.PI * 0.4); c.beginPath(); c.ellipse(s * 0.85, 0, s * 0.7, s * 0.5, 0, 0, 7); c.fill(); } c.fillStyle = '#F6D04A'; c.beginPath(); c.arc(0, 0, s * 0.38, 0, 7); c.fill(); c.restore(); }
ENGINES.italy = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, C = A.C, S = A.S, i, hz = A.hz, yV = A.yV;
  var winG = italy_rg('rgba(255,200,110,0.55)', [0.3, 0.3]), domeG = italy_rg('rgba(150,240,200,0.4)', [0.4, 0.3]), warmG = italy_rg('rgba(255,210,140,0.5)', [0.3, 0.25]), lampG = italy_rg('rgba(255,236,170,0.8)', [0.25, 0.3]);
  var stripes = ['#2A6FB8', '#2C9A70', '#E8644A', '#2A6FB8'];
  // boats at anchor in the cove: left of the cliff and out from the beach
  var boats = [], BS = [];
  for (i = 0; i < 4; i++) BS.push(italy_sprite(60, 34, 2.5, function (o) { o.translate(0, 8); italy_gozzo(o, stripes[i], dk); }));
  A.boats.forEach(function (q, k) { boats.push({x: q[0], y: q[1], s: q[2], ph: hash(k + 3) * 6.28, spr: BS[k % 4], flip: k % 2}); });
  var SB = italy_sprite(60, 80, 5, function (o) { o.translate(0, 26); italy_sailboat(o, dk); }), SC = italy_sprite(34, 28, 3, function (o) { o.translate(0, 10); italy_scooter(o, dk); });
  // gulls
  var gulls = []; for (i = 0; i < (dk ? 1 : (ph ? 3 : 5)); i++) gulls.push({x: hash(i + 11) * W, y: H * (0.08 + hash(i + 12) * 0.3), v: (14 + hash(i + 13) * 12) * (hash(i + 14) < 0.5 ? 1 : -1), s: (ph ? 0.8 : 1) * (0.8 + hash(i + 15) * 0.5) * S, ph: hash(i + 16) * 6.28});
  // sparkles on the water (day) and shimmering lights (night)
  var glints = []; for (i = 0; i < (ph ? 40 : 70); i++) { var gy = hz + 6 + hash(i + 70) * (H - hz - 10), gx = hash(i + 71) * W; if (A.isSea(gx - 8, gy) && A.isSea(gx + 8, gy)) glints.push({x: gx, y: gy, ph: hash(i + 72) * 6.28, s: 0.6 + (gy - hz) / (H - hz)}); }
  // night: the town's lights shimmer in the cove below the beach
  var lights = [], sh0 = A.shore; if (dk) for (i = 0; i < (ph ? 18 : 32); i++) { var lp = sh0[Math.floor(hash(i + 90) * sh0.length)], ly = lp[1] + (6 + hash(i + 91) * (H - lp[1])) ; if (A.isSea(lp[0], ly)) lights.push({x: lp[0], y: ly, w: (8 + hash(i + 92) * 18) * S, ph: hash(i + 93) * 6.28}); }
  // the sailboat's course: in from the left, stopping short of the cliffs
  var sbY = hz + (yV - hz) * (ph ? 0.22 : 0.2), sbX = -60; for (var q2 = 0; q2 < W; q2 += 6) { if (!A.isSea(q2 + 45 * S, sbY) || !A.isSea(q2 + 45 * S, sbY + 4)) break; sbX = q2; } sbX = Math.min(sbX, W * (ph ? 0.3 : 0.32));
  // the flag
  var FL = A.flag, flagCols = dk ? ['#245E4C', '#A6AAC4', '#8C3C48'] : ['#2E9A5E', '#FBF8F0', '#D8443F'], gustS = 1;
  // the shutters that swing, the laundry, the lemons
  var shut = A.shut.map(function (s, k) { return {s: s, o: hash(k + 50) < 0.5 ? 1 : 0, to: 1, t: 2 + hash(k + 51) * 8}; });
  var LD = A.ldry, clothes = []; for (i = 0; i < 5; i++) clothes.push({u: 0.12 + i * 0.19, kind: i % 4, col: ['#FFFFFF', '#E8644A', '#7FC8E8', '#F7CB34', '#FFFFFF'][i], ph: i * 1.3});
  var lemons = A.lemons.map(function (l, k) { return {x: l[0], y: l[1], r: l[2], ph: hash(k + 200) * 6.28}; });
  var blossoms = [], rings = [], lastRing = -99;
  var road = A.road;
  function roadY(x) { var j = Math.max(0, Math.min(road.length - 2, Math.floor((x - road[0][0]) / (road[1][0] - road[0][0])))), f = Math.max(0, Math.min(1, (x - road[j][0]) / (road[j + 1][0] - road[j][0]))); return road[j][1] * (1 - f) + road[j + 1][1] * f; }
  return {
    step: function (dt, t, f) {
      gulls.forEach(function (g) { g.x += g.v * dt * f.s; g.y += Math.sin(t * 0.4 + g.ph) * 3 * dt; if (g.x > W + 40) g.x = -40; if (g.x < -40) g.x = W + 40; });
      shut.forEach(function (s) { s.t -= dt * f.s; if (s.t < 0) { s.to = 1 - s.to; s.t = 5 + Math.random() * 9; } s.o += (s.to - s.o) * Math.min(1, dt * 1.4); });
      blossoms = blossoms.filter(function (b) { return t - b.t0 < b.life; });
      blossoms.forEach(function (b) { if (t < b.t0) return; b.vx += (-26 - b.vx) * dt * 0.4; b.vy += (3 - b.vy) * dt * 0.8; b.x += (b.vx + Math.sin(t * 1.4 + b.ph) * 10) * dt; b.y += b.vy * dt; b.rot += b.vr * dt; });
      rings = rings.filter(function (r) { return t - r.t0 < 1.8; });
      if (t - T0 > 0.3 && t - T0 < 6 && t - lastRing > 0.55) { lastRing = t; A.bells.forEach(function (b) { rings.push({x: b[0], y: b[1], t0: t}); }); }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0;
      // water: glints by day; by night the moon's path and the village lights shimmering
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      if (!dk) glints.forEach(function (g) { var a = Math.max(0, Math.sin(tt * 1.6 + g.ph)); if (a < 0.05) return; ca.fillStyle = 'rgba(255,255,255,' + (a * 0.85) + ')'; var L = 6 * g.s * a; ca.fillRect(g.x - L, g.y - 0.6, L * 2, 1.2); ca.fillRect(g.x - 0.6, g.y - L * 0.5, 1.2, L); });
      else { var M = A.sun; for (i = 0; i < (ph ? 12 : 16); i++) { var yy = hz + 6 + i * (H * 0.92 - hz) / (ph ? 12 : 16), w = M[2] * (0.5 + i * 0.06) * (0.7 + 0.3 * Math.sin(tt * 1.3 + i * 1.7)), xx = M[0] + Math.sin(tt * 0.8 + i) * 5; if (!A.isSea(xx + w / 2, yy) || !A.isSea(xx - w / 2, yy)) continue; ca.fillStyle = 'rgba(220,226,255,' + (0.2 - i * 0.008) + ')'; ca.fillRect(xx - w / 2, yy, w, 2); }
        lights.forEach(function (l) { var a = 0.35 + 0.35 * Math.sin(tt * 2 + l.ph); ca.fillStyle = 'rgba(255,200,110,' + a + ')'; var dx = Math.sin(tt * 1.1 + l.ph) * 3; ca.fillRect(l.x - l.w / 2 + dx, l.y, l.w, 1.6); ca.fillRect(l.x - l.w * 0.3 - dx, l.y + 4, l.w * 0.6, 1.2); }); }
      ca.restore();
      // foam breathing round the rocks at the foot of the cliff
      (A.rocks || []).forEach(function (r, k) { var u = (tt * 0.45 + hash(k + 300)) % 1; ca.strokeStyle = dk ? 'rgba(210,225,255,' + (1 - u) * 0.4 + ')' : 'rgba(255,255,255,' + (1 - u) * 0.9 + ')'; ca.lineWidth = 1.2 * S; ca.beginPath(); ca.ellipse(r[0], r[1], r[2] * (1.05 + u * 0.7), r[2] * (0.3 + u * 0.25), 0, 0.15, Math.PI - 0.15); ca.stroke(); });
      // boats at anchor, with their reflections
      boats.forEach(function (b) { var bob = Math.sin(tt * 1.3 + b.ph) * 1.4 * b.s, rot = Math.sin(tt * 1.1 + b.ph + 1) * 0.04 * f.a, w = 60 * b.s, h = 34 * b.s;
        ca.save(); ca.translate(b.x, b.y + bob); if (b.flip) ca.scale(-1, 1); ca.save(); ca.globalAlpha = dk ? 0.18 : 0.22; ca.scale(1, -0.55); ca.drawImage(b.spr, -w / 2, -h / 2 - 8 * b.s, w, h); ca.restore();
        ca.rotate(rot); ca.drawImage(b.spr, -w / 2, -h / 2 - 8 * b.s, w, h); ca.restore();
        ca.strokeStyle = dk ? 'rgba(200,220,255,0.25)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1; ca.beginPath(); ca.ellipse(b.x, b.y + 1.5 * b.s, (20 + Math.sin(tt * 1.3 + b.ph) * 2) * b.s, 1.6 * b.s, 0, 0, 7); ca.stroke(); });
      // the sailboat gliding into the cove
      if (T > 0 && T < 26) { var u = italy_ease((T - 0.3) / 8), sx = -70 + (sbX + 70) * u - Math.max(0, T - 14) * 6, sy = sbY, ss = (ph ? 0.75 : 1) * S, al = Math.min(1, (26 - T) / 4);
        ca.save(); ca.globalAlpha = al; ca.translate(sx, sy + Math.sin(tt * 1.2) * 1.2); ca.save(); ca.globalAlpha = al * 0.2; ca.scale(1, -0.5); ca.drawImage(SB, -30 * ss, -66 * ss, 60 * ss, 80 * ss); ca.restore(); ca.rotate(Math.sin(tt) * 0.02); ca.drawImage(SB, -30 * ss, -66 * ss, 60 * ss, 80 * ss); ca.restore();
        ca.strokeStyle = dk ? 'rgba(200,220,255,0.3)' : 'rgba(255,255,255,0.8)'; ca.lineWidth = 1.2; ca.beginPath(); ca.moveTo(sx - 24 * ss, sy + 2); ca.lineTo(sx - 24 * ss - 40 * ss * (1 - u + 0.2), sy + 3); ca.stroke(); }
      // night: warm windows all up the slope and the lit dome
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; A.wins.forEach(function (w, k) { italy_dot(ca, winG, w[0], w[1], w[2] * 3.2, 0.5 + 0.18 * Math.sin(tt * 0.7 + k * 1.7)); }); var D = A.dome; italy_dot(ca, domeG, D[0], D[1], D[2] * 2.6, 0.75 + 0.1 * Math.sin(tt * 0.8)); italy_dot(ca, warmG, A.church[0], A.church[1], A.church[2] * 1.6, 0.5); ca.restore(); }
      // the bells in the tower: still, until the moment swings them
      var sw = italy_env(T, 0.2, 0.8, 5.5, 7.5);
      A.bells.forEach(function (b, k) { var a = Math.sin(T * 5.2 + k * 1.6) * 0.7 * sw, s = S * 1.05; ca.save(); ca.translate(b[0], b[1]); ca.rotate(a);
        var g = ca.createLinearGradient(-4 * s, 0, 4 * s, 0); g.addColorStop(0, '#9A6A22'); g.addColorStop(0.5, '#F2C86A'); g.addColorStop(1, '#8A5A1A'); ca.fillStyle = g;
        ca.beginPath(); ca.moveTo(-1.8 * s, 0); ca.quadraticCurveTo(-2.6 * s, 4.6 * s, -4.4 * s, 6.6 * s); ca.lineTo(4.4 * s, 6.6 * s); ca.quadraticCurveTo(2.6 * s, 4.6 * s, 1.8 * s, 0); ca.closePath(); ca.fill();
        ca.fillStyle = '#6A4A1A'; ca.beginPath(); ca.arc(Math.sin(a * 2) * 1.6 * s, 7.4 * s, 1.1 * s, 0, 7); ca.fill(); ca.restore(); });
      // laundry on a line across a house front
      if (LD) { var lx = LD[0], ly = LD[1], L = LD[2], sag = 4 * S;
      ca.strokeStyle = dk ? 'rgba(220,220,240,0.6)' : 'rgba(70,60,60,0.75)'; ca.lineWidth = 0.8; ca.beginPath(); ca.moveTo(lx, ly); ca.quadraticCurveTo(lx + L / 2, ly + sag * 2, lx + L, ly + 1); ca.stroke();
      ca.fillStyle = dk ? '#3A3040' : '#6A5A50'; ca.fillRect(lx - 1.5 * S, ly - 1.5 * S, 3 * S, 3 * S); ca.fillRect(lx + L - 1.5 * S, ly - 0.5 * S, 3 * S, 3 * S);
      clothes.forEach(function (c) { var u = c.u, px = lx + L * u, py = ly + sag * 4 * u * (1 - u) + 1 * u, fl = Math.sin(tt * 2.6 + c.ph) * 0.18 * f.a + Math.sin(tt * 5.1 + c.ph) * 0.06 * f.a, s = S;
        ca.save(); ca.translate(px, py); ca.transform(1, 0, fl, 1, 0, 0); ca.fillStyle = dk ? 'rgba(160,160,190,1)' : c.col; if (dk && c.col !== '#FFFFFF') ca.fillStyle = c.col === '#E8644A' ? '#8A4A50' : c.col === '#7FC8E8' ? '#4A6A8A' : '#8A7A4A';
        if (c.kind === 0) { ca.beginPath(); ca.moveTo(-4 * s, 0); ca.lineTo(4 * s, 0); ca.lineTo(6.5 * s, 2.5 * s); ca.lineTo(5 * s, 4 * s); ca.lineTo(3.4 * s, 3 * s); ca.lineTo(3.4 * s, 9 * s); ca.lineTo(-3.4 * s, 9 * s); ca.lineTo(-3.4 * s, 3 * s); ca.lineTo(-5 * s, 4 * s); ca.lineTo(-6.5 * s, 2.5 * s); ca.closePath(); ca.fill(); }
        else if (c.kind === 1) { ca.fillRect(-4.5 * s, 0, 9 * s, 11 * s); ca.fillStyle = 'rgba(255,255,255,0.75)'; ca.fillRect(-4.5 * s, 3 * s, 9 * s, 1.4 * s); ca.fillRect(-4.5 * s, 6.4 * s, 9 * s, 1.4 * s); }
        else if (c.kind === 2) { ca.beginPath(); ca.moveTo(-4 * s, 0); ca.lineTo(4 * s, 0); ca.lineTo(4 * s, 7 * s); ca.lineTo(1 * s, 7 * s); ca.lineTo(0, 3 * s); ca.lineTo(-1 * s, 7 * s); ca.lineTo(-4 * s, 7 * s); ca.closePath(); ca.fill(); }
        else { ca.fillRect(-1.6 * s, 0, 3 * s, 6 * s); ca.fillRect(-1.6 * s, 4.4 * s, 4.4 * s, 2 * s); }
        ca.fillStyle = '#C8A070'; ca.fillRect(-0.6 * s, -1 * s, 1.2 * s, 2 * s); ca.restore(); }); }
      // shutters swinging on their hinges
      shut.forEach(function (o) { var s = o.s, wx = s[0], wy = s[1], ww = s[2], wh = s[3], th = Math.PI * italy_ease(o.o), cw = Math.cos(th) * ww * 0.55;
        [[wx - ww * 0.02, 1], [wx + ww * 1.02, -1]].forEach(function (hg) { var x0 = hg[0], x1 = hg[0] + hg[1] * cw; ca.fillStyle = Math.abs(Math.cos(th)) > 0.3 ? C.green : (dk ? '#164A3E' : '#1E7A58'); ca.fillRect(Math.min(x0, x1), wy - 0.3, Math.max(0.6, Math.abs(x1 - x0)), wh + 0.6);
          ca.fillStyle = 'rgba(0,0,0,0.18)'; for (var q = 1; q < 4; q++) ca.fillRect(Math.min(x0, x1), wy + wh * q / 4, Math.abs(x1 - x0), 0.6); }); });
      // the scooter zipping along the coast road (behind the road's stone wall, which is drawn over this canvas)
      if (T > 0.5 && T < 8.5) { var su = italy_ease((T - 0.5) / 7.8) * 0.4 + (T - 0.5) / 7.8 * 0.6, x0 = road[0][0] + 6 * S, x1 = W + 40, scx = x0 + (x1 - x0) * su, scy = roadY(scx) + 3.5 * S, ang = Math.atan2(roadY(scx + 6) - roadY(scx - 6), 12), ks = 1.6 * S * (ph ? 0.85 : 1);
        if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; ca.translate(scx, scy); ca.rotate(ang); var bm = ca.createLinearGradient(8 * ks, 0, 60 * ks, 0); bm.addColorStop(0, 'rgba(255,240,180,0.55)'); bm.addColorStop(1, 'rgba(255,240,180,0)'); ca.fillStyle = bm; ca.beginPath(); ca.moveTo(9 * ks, -13 * ks); ca.lineTo(60 * ks, -20 * ks); ca.lineTo(60 * ks, -2 * ks); ca.closePath(); ca.fill(); ca.restore(); }
        for (i = 1; i < 5; i++) { var px3 = scx - i * 9 * ks - 8 * ks, ag = 1 - i / 5; ca.fillStyle = dk ? 'rgba(200,200,220,' + ag * 0.25 + ')' : 'rgba(255,255,255,' + ag * 0.7 + ')'; ca.beginPath(); ca.arc(px3, roadY(px3) + (1 - i * 0.6) * S, (1.5 + i * 0.9) * ks, 0, 7); ca.fill(); }
        ca.save(); ca.globalAlpha = Math.min(1, (T - 0.5) * 3); ca.translate(scx, scy); ca.rotate(ang); ca.translate(0, Math.abs(Math.sin(T * 30)) * -0.5); ca.drawImage(SC, -17 * ks, -18 * ks, 34 * ks, 28 * ks); ca.restore(); }
      // ---- canvas B: waves washing the beach, lemons, gulls, the bells' ringing and the blossoms
      var sh = A.shore, wash = (0.5 + 0.5 * Math.sin(tt * 0.9)) * 4.5 * S * f.a, wash2 = (0.5 + 0.5 * Math.sin(tt * 0.9 - 1.6));
      cb.save(); cb.beginPath(); sh.forEach(function (p, k) { var off = wash * (0.7 + 0.3 * Math.sin(k * 1.3 + tt)); if (k) cb.lineTo(p[0], p[1] - off); else cb.moveTo(p[0], p[1] - off); }); for (i = sh.length - 1; i >= 0; i--) cb.lineTo(sh[i][0], sh[i][1] + 2); cb.closePath();
      cb.fillStyle = dk ? 'rgba(160,190,230,0.22)' : 'rgba(210,245,245,0.6)'; cb.fill();
      cb.strokeStyle = dk ? 'rgba(220,235,255,0.5)' : 'rgba(255,255,255,0.95)'; cb.lineWidth = 1.6 * S; cb.beginPath(); sh.forEach(function (p, k) { var off = wash * (0.7 + 0.3 * Math.sin(k * 1.3 + tt)); if (k) cb.lineTo(p[0], p[1] - off); else cb.moveTo(p[0], p[1] - off); }); cb.stroke();
      // the next little wave coming in, out on the water
      cb.globalAlpha = Math.sin(wash2 * Math.PI) * 0.85; cb.lineWidth = 1.2 * S; cb.beginPath(); sh.forEach(function (p, k) { var off = 14 * S * (1 - wash2) + 3 * S; if (k) cb.lineTo(p[0], p[1] + off + Math.sin(k * 2 + tt * 2) * 0.8); else cb.moveTo(p[0], p[1] + off); }); cb.stroke(); cb.restore();
      // the flag waving on its pole: one cloth outline (hoist fixed to the pole, a travelling wave that grows towards the fly
      // end, a little sag), a white base with the green and red bands clipped into it, folds shaded by a gradient that follows
      // the wave, and a soft shadow
      var fx0 = FL[0], fy0 = FL[1], fw = FL[2], fh = FL[3], gT = 1 + 0.18 * Math.sin(tt * 0.31) + 0.35 * (T > 0 ? italy_env(T, 0, 1.5, 6, 9) : 0); gustS += (gT - gustS) * 0.05; var gs = gustS, NP = 28, ph0 = tt * 3.2;
      var wy = function (u) { return Math.sin(u * 5.6 - ph0) * fh * 0.075 * Math.pow(u, 1.1) * gs + u * u * fh * 0.07 / gs; }, wx = function (u) { return fx0 + u * fw * (1 - 0.035 * gs * (0.5 + 0.5 * Math.sin(ph0 * 0.5))) ; };
      var cloth = function (c, dx, dy, u0, u1) { c.beginPath(); var q, u; for (q = 0; q <= NP; q++) { u = u0 + (u1 - u0) * q / NP; c[q ? 'lineTo' : 'moveTo'](wx(u) + dx, fy0 + wy(u) + dy); } for (q = NP; q >= 0; q--) { u = u0 + (u1 - u0) * q / NP; c.lineTo(wx(u) + dx + Math.sin(u * 5.6 - ph0 + 0.6) * u * 0.6 * S, fy0 + fh + wy(u) + dy - u * fh * 0.02); } c.closePath(); };
      cb.save(); cloth(cb, 2.5 * S, 3.5 * S, 0, 1); cb.fillStyle = dk ? 'rgba(0,0,20,0.18)' : 'rgba(20,50,80,0.12)'; cb.fill();
      cloth(cb, 0, 0, 0, 1); cb.fillStyle = flagCols[1]; cb.fill(); cb.save(); cb.clip();
      cloth(cb, 0, 0, 0, 1 / 3 + 0.004); cb.fillStyle = flagCols[0]; cb.fill(); cloth(cb, 0, 0, 2 / 3 - 0.004, 1); cb.fillStyle = flagCols[2]; cb.fill();
      var fg = cb.createLinearGradient(fx0, 0, fx0 + fw, 0); for (i = 0; i <= 16; i++) { var uu = i / 16, sl = Math.cos(uu * 5.6 - ph0) * Math.pow(uu, 0.9) * gs; fg.addColorStop(uu, sl > 0 ? 'rgba(30,20,40,' + Math.min(0.2, sl * 0.2) + ')' : 'rgba(255,255,255,' + Math.min(0.2, -sl * 0.2) + ')'); }
      cb.fillStyle = fg; cb.fillRect(fx0 - 2, fy0 - fh * 0.3, fw + 4, fh * 1.6); cb.restore();
      cb.strokeStyle = dk ? 'rgba(0,0,20,0.25)' : 'rgba(60,50,60,0.18)'; cb.lineWidth = 0.6 * S; cloth(cb, 0, 0, 0, 1); cb.stroke(); cb.restore();
      // lemons swaying on their trees
      lemons.forEach(function (l) { var sx2 = Math.sin(tt * 1.3 + l.ph) * 0.9 * S * f.a + Math.sin(tt * 2.7 + l.ph) * 0.3 * S * f.a; italy_lemonAt(cb, l.x + sx2, l.y + Math.abs(sx2) * 0.2, l.r, sx2 * 0.15 + 0.2, dk); });
      // gulls: a slow glide with a few wing beats now and then
      gulls.forEach(function (g) { var fl = Math.sin(tt * 7 + g.ph) * (Math.sin(tt * 0.5 + g.ph) > 0.4 ? 1 : 0.15), s = g.s, d = g.v > 0 ? 1 : -1;
        cb.save(); cb.translate(g.x, g.y); cb.scale(d, 1); cb.strokeStyle = dk ? '#C9CDDE' : '#FFFFFF'; cb.lineWidth = 2.4 * s; cb.beginPath(); cb.moveTo(-9 * s, -2 * s - fl * 4 * s); cb.quadraticCurveTo(-4 * s, -5 * s - fl * 2 * s, 0, 0); cb.quadraticCurveTo(4 * s, -5 * s - fl * 2 * s, 9 * s, -2 * s - fl * 4 * s); cb.stroke();
        cb.strokeStyle = dk ? '#6A6E8A' : '#5A6670'; cb.lineWidth = 1 * s; cb.beginPath(); cb.moveTo(-9 * s, -2 * s - fl * 4 * s); cb.lineTo(-7 * s, -2.6 * s - fl * 3.4 * s); cb.moveTo(9 * s, -2 * s - fl * 4 * s); cb.lineTo(7 * s, -2.6 * s - fl * 3.4 * s); cb.stroke(); cb.fillStyle = '#F2B53A'; cb.fillRect(1 * s, -0.6 * s, 2 * s, 1 * s); cb.restore(); });
      // the bells' ringing: arcs spreading from the tower
      rings.forEach(function (r) { var u = (t - r.t0) / 1.8; cb.strokeStyle = dk ? 'rgba(255,230,160,' + (1 - u) * 0.7 + ')' : 'rgba(200,140,40,' + (1 - u) * 0.75 + ')'; cb.lineWidth = 1.6 * S; [-1, 1].forEach(function (d) { cb.beginPath(); cb.arc(r.x, r.y + 3 * S, (6 + u * 26) * S, d > 0 ? -0.6 : Math.PI - 0.6, d > 0 ? 0.6 : Math.PI + 0.6); cb.stroke(); }); });
      // lemon blossoms drifting out over the water
      blossoms.forEach(function (b) { if (t < b.t0) return; var u = (t - b.t0) / b.life; italy_blossom(cb, b.x, b.y, b.s, b.rot, Math.min(1, u * 8, (1 - u) * 4) * (dk ? 0.9 : 1)); });
    },
    finish: function (t) { T0 = t; rings = [];
      for (var k = 0; k < (ph ? 26 : 44); k++) { var l = lemons[Math.floor(Math.random() * lemons.length)] || {x: W * 0.4, y: H * 0.4}; blossoms.push({x: l.x, y: l.y, vx: -30 - Math.random() * 50, vy: -6 - Math.random() * 8, ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 3, s: (2.6 + Math.random() * 1.8) * S * (ph ? 0.85 : 1), t0: t + 1.2 + Math.random() * 1.6, life: 7 + Math.random() * 4}); } }
  };
};
UIC.italy = {L: ['#2C7FA8', '#1E5778', 'rgba(255,255,255,0.86)', '#1E2C38', '#56656F', '#C4522F', '#C4522F', '#E39A2E', '#FFFFFF'], D: ['#22305A', '#101C3A', 'rgba(20,26,56,0.8)', '#F2F2FA', '#B6B8D2', '#F6C84A', '#F6C84A', '#FFE08A', '#1A2040']};
