// ---- batch n4 engines: nightmarket, diadelosmuertos, holi, ramadan, midautumn
function n4_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n4_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n4_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n4_ease((T - c) / (d - c)); }
var n4_gc = null;
function n4_ctx() { return n4_gc || (n4_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with n4_dot)
function n4_rg(col, mid) { var g = n4_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n4_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function n4_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function n4_off(W, H, k) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(W * k)); cv.height = Math.max(1, Math.ceil(H * k)); var o = cv.getContext('2d'); o.scale(k, k); o.lineJoin = o.lineCap = 'round'; return {cv: cv, o: o}; }
function n4_blink(t, seed) { var u = (t * 0.29 + seed * 3.7) % 4.6; return u < 0.13 ? Math.abs(u - 0.065) / 0.065 : 1; }
var n4_INK = '#3A2430', n4_BLUSH = 'rgba(255,120,150,0.5)';
// a tiny kawaii face: s is the face size (eye gap about s * 0.7)
function n4_face(c, x, y, s, o) { o = o || {}; c.save(); c.fillStyle = o.ink || n4_INK; c.strokeStyle = o.ink || n4_INK; c.lineCap = 'round';
  var g = s * 0.36, er = Math.max(0.7, s * 0.1);
  if (o.happy || o.sleep) { c.lineWidth = Math.max(0.8, s * 0.08); c.beginPath(); if (o.happy) { c.arc(x - g, y + er, er * 1.3, Math.PI * 1.15, Math.PI * 1.85); c.moveTo(x + g + er * 1.3 * Math.cos(Math.PI * 1.15), y + er + er * 1.3 * Math.sin(Math.PI * 1.15)); c.arc(x + g, y + er, er * 1.3, Math.PI * 1.15, Math.PI * 1.85); } else { c.arc(x - g, y - er * 0.5, er * 1.2, Math.PI * 0.15, Math.PI * 0.85); c.moveTo(x + g + er * 1.2 * Math.cos(Math.PI * 0.15), y - er * 0.5 + er * 1.2 * Math.sin(Math.PI * 0.15)); c.arc(x + g, y - er * 0.5, er * 1.2, Math.PI * 0.15, Math.PI * 0.85); } c.stroke(); }
  else { var b = o.blink == null ? 1 : o.blink; c.beginPath(); c.ellipse(x - g, y, er, er * Math.max(0.15, b), 0, 0, 7); c.ellipse(x + g, y, er, er * Math.max(0.15, b), 0, 0, 7); c.fill(); if (b > 0.5) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - g + er * 0.35, y - er * 0.35, er * 0.38, 0, 7); c.arc(x + g + er * 0.35, y - er * 0.35, er * 0.38, 0, 7); c.fill(); } }
  c.fillStyle = n4_BLUSH; c.beginPath(); c.ellipse(x - g * 1.55, y + s * 0.2, s * 0.15, s * 0.09, 0, 0, 7); c.ellipse(x + g * 1.55, y + s * 0.2, s * 0.15, s * 0.09, 0, 0, 7); c.fill();
  c.strokeStyle = o.ink || n4_INK; c.lineWidth = Math.max(0.8, s * 0.07); c.beginPath(); c.arc(x, y + s * 0.1, s * (o.big ? 0.16 : 0.1), Math.PI * 0.15, Math.PI * 0.85); c.stroke(); c.restore(); }

// ---------- Night Market
// Loop: the paper lanterns sway on their strings, steam curls up from the griddles, goldfish dart about the pool (ripples),
// the balloon bunch bobs. Night: everything glows warm red and gold.
// Moment: the lanterns light up stall by stall down the street, and a big sky lantern floats up over the rooftops.
function n4_chochin(o, R, k, lit) {
  var rx = R * 0.82, body = k === 1 ? (lit ? ['#FFFBEA', '#FFE2A6', '#F6B870'] : ['#FFFFFF', '#FFF2E2', '#EBCFB4']) : k === 2 ? (lit ? ['#FFF0B0', '#FFB858', '#EE7A30'] : ['#FFC27A', '#F59A48', '#D9702E']) : (lit ? ['#FFE7A6', '#FF8A50', '#E0402E'] : ['#FF8A6C', '#E8483A', '#B82C28']);
  var g = o.createRadialGradient(-rx * 0.25, -R * 0.25, R * 0.1, 0, 0, R * 1.05); g.addColorStop(0, body[0]); g.addColorStop(0.55, body[1]); g.addColorStop(1, body[2]);
  o.fillStyle = g; o.beginPath(); o.ellipse(0, 0, rx, R, 0, 0, 7); o.fill();
  if (k === 1) { o.fillStyle = lit ? 'rgba(232,70,50,0.85)' : '#E0483C'; o.save(); o.beginPath(); o.ellipse(0, 0, rx, R, 0, 0, 7); o.clip(); o.fillRect(-rx, -R * 0.2, rx * 2, R * 0.4); o.restore(); }
  o.strokeStyle = k === 1 ? 'rgba(170,100,70,0.35)' : 'rgba(110,20,20,0.3)'; o.lineWidth = Math.max(0.6, R * 0.05);
  for (var j = -3; j <= 3; j++) { var yy = j * R * 0.26, w = rx * Math.sqrt(Math.max(0, 1 - (yy / R) * (yy / R))); o.beginPath(); o.ellipse(0, yy, w, R * 0.06, 0, 0, Math.PI); o.stroke(); }
  o.fillStyle = '#3A2228'; o.beginPath(); if (o.roundRect) { o.roundRect(-rx * 0.52, -R - R * 0.16, rx * 1.04, R * 0.26, R * 0.06); o.roundRect(-rx * 0.52, R - R * 0.1, rx * 1.04, R * 0.26, R * 0.06); } else { o.rect(-rx * 0.52, -R - R * 0.16, rx * 1.04, R * 0.26); o.rect(-rx * 0.52, R - R * 0.1, rx * 1.04, R * 0.26); } o.fill();
  o.fillStyle = '#E8B04A'; o.fillRect(-rx * 0.52, -R - R * 0.16 + R * 0.2, rx * 1.04, R * 0.05); o.fillRect(-rx * 0.52, R - R * 0.1, rx * 1.04, R * 0.05);
  o.strokeStyle = k === 1 ? '#E0483C' : '#E8B04A'; o.lineWidth = Math.max(0.7, R * 0.07); o.beginPath(); for (var q = -2; q <= 2; q++) { o.moveTo(q * R * 0.09, R + R * 0.16); o.lineTo(q * R * 0.11, R + R * 0.55); } o.stroke();
  o.fillStyle = 'rgba(255,255,255,0.45)'; o.beginPath(); o.ellipse(-rx * 0.45, -R * 0.3, rx * 0.16, R * 0.35, 0.2, 0, 7); o.fill();
}
ENGINES.nightmarket = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.C, T0 = -99, K = ph ? 2 : 1.5;
  var warmG = n4_rg(dk ? 'rgba(255,170,90,0.6)' : 'rgba(255,200,140,0.45)', [0.3, dk ? 0.3 : 0.2]), hotG = n4_rg('rgba(255,236,170,0.9)', [0.25, 0.5]), streetG = n4_rg(dk ? 'rgba(255,140,80,0.35)' : 'rgba(255,220,180,0)'), steamG = n4_rg(dk ? 'rgba(255,236,220,0.5)' : 'rgba(255,255,255,0.75)', [0.5, dk ? 0.25 : 0.4]);
  // lantern sprites (unlit and lit) for the three colours
  var SPR = [0, 1, 2].map(function (k) { return [false, true].map(function (lit) { return n4_sprite(40, 48, 3, function (o) { n4_chochin(o, 16, k, lit); }); }); });
  var lan = A.lan.map(function (l, i) { return {x: l.x, y: l.y, len: l.len, r: l.r, k: l.k, ph: hash(i + 1) * 6.28, sp: 0.8 + hash(i + 5) * 0.5, top: l.top, stall: l.stall, d: l.stall != null ? 0.25 + l.stall * (ph ? 0.55 : 0.32) : 0.1 + l.x / W * (ph ? 1.6 : 2.1)}; });
  var strings = A.strings.map(function (p) { var q = new Path2D(); p.forEach(function (pt, i) { if (i) q.lineTo(pt[0], pt[1]); else q.moveTo(pt[0], pt[1]); }); return q; });
  // steam vents and the goods on the counters (painted once)
  var dec = n4_off(W, H, K), o = dec.o, steam = [], puffs = [];
  A.stalls.forEach(function (s) { var cx = (s.x0 + s.x1) / 2, w = s.x1 - s.x0, y = s.ct - 7, sc = ph ? 0.72 : 1; o.save(); o.translate(cx, y); o.scale(sc, sc);
    var ww = w / sc;
    if (s.good === 'tako') { o.fillStyle = '#3A3036'; o.beginPath(); o.roundRect ? o.roundRect(-ww * 0.36, -14, ww * 0.72, 14, 4) : o.rect(-ww * 0.36, -14, ww * 0.72, 14); o.fill();
      for (var r = 0; r < 2; r++) for (var q = 0; q < 5; q++) { var bx = -ww * 0.28 + q * ww * 0.14, by = -14 - r * 7 + 2; var g = o.createRadialGradient(bx - 2, by - 3, 1, bx, by, 8); g.addColorStop(0, '#F4B66A'); g.addColorStop(1, '#B8642A'); o.fillStyle = g; o.beginPath(); o.arc(bx, by, 7, Math.PI, 0); o.fill(); o.strokeStyle = '#5A2A16'; o.lineWidth = 2.2; o.beginPath(); o.moveTo(bx - 5, by - 3); o.quadraticCurveTo(bx, by - 7, bx + 5, by - 3); o.stroke(); o.strokeStyle = '#FFF4DE'; o.lineWidth = 0.9; o.beginPath(); o.moveTo(bx - 4, by - 2); o.lineTo(bx - 1, by - 5); o.lineTo(bx + 2, by - 2); o.lineTo(bx + 4, by - 4); o.stroke(); o.fillStyle = '#4A8A3A'; o.fillRect(bx - 1, by - 5, 1.6, 1.2); o.fillRect(bx + 2, by - 4, 1.4, 1.2); }
      steam.push({x: cx - w * 0.15, y: y - 20 * sc}, {x: cx + w * 0.15, y: y - 20 * sc}); }
    else if (s.good === 'apple') { o.fillStyle = '#C98A56'; o.beginPath(); o.moveTo(-ww * 0.38, 0); o.lineTo(ww * 0.38, 0); o.lineTo(ww * 0.34, -10); o.lineTo(-ww * 0.34, -10); o.fill();
      for (r = 0; r < 2; r++) for (q = 0; q < 5; q++) { bx = -ww * 0.27 + q * ww * 0.135 + r * ww * 0.065; by = -18 - r * 16; if (r && q === 4) continue; o.strokeStyle = '#E8D2A8'; o.lineWidth = 2; o.beginPath(); o.moveTo(bx, by); o.lineTo(bx, -8 - r * 4); o.stroke(); var ap = q === 2 && r === 0 ? ['#FFB2C6', '#E25A8A'] : ['#FF7A6A', '#C8202A']; g = o.createRadialGradient(bx - 3, by - 4, 1, bx, by, 9); g.addColorStop(0, ap[0]); g.addColorStop(1, ap[1]); o.fillStyle = g; o.beginPath(); o.arc(bx, by, 8, 0, 7); o.fill(); o.strokeStyle = 'rgba(80,10,20,0.5)'; o.lineWidth = 1; o.stroke(); o.fillStyle = 'rgba(255,255,255,0.8)'; o.beginPath(); o.ellipse(bx - 3, by - 3.5, 2.2, 1.4, -0.6, 0, 7); o.fill(); o.strokeStyle = '#7A4A2A'; o.lineWidth = 1.6; o.beginPath(); o.moveTo(bx, by - 8); o.lineTo(bx + 1, by - 11); o.stroke(); } }
    else if (s.good === 'taiyaki') { o.fillStyle = '#C9CED8'; o.beginPath(); o.ellipse(0, -3, ww * 0.38, 7, 0, 0, 7); o.fill();
      for (q = 0; q < 4; q++) { bx = -ww * 0.24 + q * ww * 0.16; by = -9 - (q % 2) * 3; o.save(); o.translate(bx, by); o.rotate(q % 2 ? 0.12 : -0.1); g = o.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, '#F6C470'); g.addColorStop(1, '#C47A2E'); o.fillStyle = g; o.beginPath(); o.moveTo(-13, 0); o.quadraticCurveTo(-10, -9, 3, -7); o.lineTo(10, -10); o.lineTo(8, 0); o.lineTo(10, 10); o.lineTo(3, 7); o.quadraticCurveTo(-10, 9, -13, 0); o.fill(); o.strokeStyle = '#8A4A1A'; o.lineWidth = 1; o.stroke(); o.strokeStyle = 'rgba(140,70,20,0.6)'; o.beginPath(); o.arc(-2, 0, 3, -1.2, 1.2); o.moveTo(2, -3); o.lineTo(4, 3); o.stroke(); o.fillStyle = '#3A2018'; o.beginPath(); o.arc(-8, -2, 1.3, 0, 7); o.fill(); o.restore(); }
      steam.push({x: cx, y: y - 16 * sc}); }
    else if (s.good === 'cotton') { o.fillStyle = '#B8C2CE'; o.beginPath(); o.ellipse(-ww * 0.16, -6, 22, 8, 0, 0, 7); o.fill(); o.fillStyle = '#E4EAF0'; o.beginPath(); o.ellipse(-ww * 0.16, -9, 20, 5, 0, 0, 7); o.fill();
      [[-30, -20, 11], [-17, -24, 13], [-4, -18, 10], [-20, -12, 10]].forEach(function (p) { g = o.createRadialGradient(p[0] - 3, p[1] - 3, 1, p[0], p[1], p[2]); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#FFB6D4'); o.fillStyle = g; o.beginPath(); o.arc(p[0] + ww * 0.16 - ww * 0.32 + 4, p[1], p[2], 0, 7); o.fill(); });
      [['#FFD3E6', '#F48CB8'], ['#CFE8FF', '#7FB2EE'], ['#FFF0B8', '#F2C44A']].forEach(function (cc, j) { bx = ww * 0.06 + j * ww * 0.12; by = -30 - (j % 2) * 6; o.strokeStyle = '#E8D2A8'; o.lineWidth = 2; o.beginPath(); o.moveTo(bx, by + 14); o.lineTo(bx, 0); o.stroke(); g = o.createLinearGradient(0, by - 14, 0, by + 14); g.addColorStop(0, cc[0]); g.addColorStop(1, cc[1]); o.fillStyle = g; o.beginPath(); o.moveTo(bx - 9, by - 12); o.quadraticCurveTo(bx, by - 17, bx + 9, by - 12); o.lineTo(bx + 7, by + 12); o.lineTo(bx - 7, by + 12); o.closePath(); o.fill(); o.strokeStyle = 'rgba(60,30,50,0.5)'; o.lineWidth = 1; o.stroke(); n4_face(o, bx, by + 1, 9, {}); }); }
    else if (s.good === 'yaki') { o.fillStyle = '#3A3036'; o.fillRect(-ww * 0.36, -12, ww * 0.72, 12); o.fillStyle = '#FF7A3A'; o.globalAlpha = dk ? 0.9 : 0.6; o.fillRect(-ww * 0.34, -12, ww * 0.68, 3); o.globalAlpha = 1;
      for (q = 0; q < 5; q++) { by = -16; bx = -ww * 0.26 + q * ww * 0.13; o.strokeStyle = '#E8D2A8'; o.lineWidth = 1.6; o.beginPath(); o.moveTo(bx - 3, by + 10); o.lineTo(bx + 4, by - 24); o.stroke(); for (var m = 0; m < 3; m++) { var mx = bx - 1 + m * 1.6, my = by + 2 - m * 8; g = o.createRadialGradient(mx - 1, my - 1, 0.5, mx, my, 5); g.addColorStop(0, '#E2955A'); g.addColorStop(1, '#8A4422'); o.fillStyle = g; o.beginPath(); o.ellipse(mx, my, 4.6, 3.8, 0, 0, 7); o.fill(); } o.fillStyle = '#6AA84A'; o.beginPath(); o.ellipse(bx + 0.6, by - 2, 3, 2, 0, 0, 7); o.fill(); }
      steam.push({x: cx - w * 0.12, y: y - 30 * sc}, {x: cx + w * 0.14, y: y - 30 * sc}); }
    else { [['#FF6A7A', '#FFB0BA'], ['#5AC8E8', '#B8ECF8'], ['#7AD07A', '#C6F0B0']].forEach(function (cc, j) { bx = -ww * 0.22 + j * ww * 0.22; by = -4; o.fillStyle = 'rgba(220,240,255,0.85)'; o.beginPath(); o.moveTo(bx - 10, by - 14); o.lineTo(bx + 10, by - 14); o.lineTo(bx + 7, by); o.lineTo(bx - 7, by); o.fill(); o.strokeStyle = 'rgba(90,120,150,0.6)'; o.lineWidth = 1; o.stroke(); g = o.createLinearGradient(0, by - 34, 0, by - 12); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, cc[0]); o.fillStyle = g; o.beginPath(); o.ellipse(bx, by - 18, 12, 14, 0, Math.PI, 0); o.lineTo(bx + 11, by - 14); o.lineTo(bx - 11, by - 14); o.fill(); o.fillStyle = cc[1]; o.beginPath(); o.ellipse(bx - 3, by - 26, 4, 2.4, -0.4, 0, 7); o.fill(); o.fillStyle = '#FFE27A'; o.fillRect(bx + 4, by - 40, 1.6, 12); }); }
    o.restore(); });
  // the goldfish
  var P = A.pool, fish = [], ripples = [], FC = [['#FF8A3A', '#FFC07A'], ['#F0442E', '#FF9A7A'], ['#FFF4EA', '#F0442E'], ['#2A2638', '#5A5470']];
  for (var fi = 0; fi < (ph ? 6 : 9); fi++) fish.push({u: (hash(fi + 2) - 0.5) * 1.2, v: (hash(fi + 7) - 0.5) * 1.2, a: hash(fi + 11) * 6.28, sp: 0.18 + hash(fi + 3) * 0.12, L: (ph ? 10 : 14) * (0.8 + hash(fi + 9) * 0.4), c: FC[fi % 4], ph: hash(fi) * 6.28});
  var poolClip = new Path2D(); poolClip.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, 7);
  // balloons
  var B = A.bal, BC = [['#FFD0E0', '#F2709E'], ['#FFF2B0', '#F2B630'], ['#C8F4E0', '#3EB896'], ['#D0E6FF', '#5A92E8'], ['#EAD8FF', '#9A6ED8']], balls = [[0, 0, 1], [-17, 9, 0.9], [17, 7, 0.92], [-7, -17, 0.95], [10, -15, 0.88]].map(function (q, i) { return {dx: q[0], dy: q[1], s: q[2], c: BC[i], ph: hash(i + 30) * 6.28}; });
  var balSpr = BC.map(function (cc) { return n4_sprite(30, 34, 3, function (o) { var g = o.createRadialGradient(-4, -6, 1, 0, -1, 13); g.addColorStop(0, cc[0]); g.addColorStop(1, cc[1]); o.fillStyle = g; o.beginPath(); o.ellipse(0, -1, 11, 12.5, 0, 0, 7); o.fill(); o.fillStyle = cc[1]; o.beginPath(); o.moveTo(-2.4, 13.5); o.lineTo(2.4, 13.5); o.lineTo(0, 10.5); o.fill(); o.fillStyle = 'rgba(255,255,255,0.75)'; o.beginPath(); o.ellipse(-4.5, -6, 2.6, 4, 0.5, 0, 7); o.fill(); }); });
  // the sky lantern
  var S = A.sky, skyT = -99, embers = [], skies = [{dx: 0, dt: 0, s: 1}, {dx: -0.2, dt: 1.1, s: 0.55}, {dx: 0.16, dt: 1.9, s: 0.45}];
  var skySpr = n4_sprite(60, 70, 3, function (o) { var g = o.createLinearGradient(0, -28, 0, 26); g.addColorStop(0, '#FFE6B0'); g.addColorStop(0.6, '#FFC070'); g.addColorStop(1, '#FF9A50'); o.fillStyle = g; o.beginPath(); o.moveTo(-18, -22); o.quadraticCurveTo(0, -34, 18, -22); o.lineTo(14, 24); o.quadraticCurveTo(0, 28, -14, 24); o.closePath(); o.fill(); o.strokeStyle = 'rgba(200,110,50,0.45)'; o.lineWidth = 1; o.beginPath(); o.moveTo(-6, -27); o.lineTo(-5, 26); o.moveTo(6, -27); o.lineTo(5, 26); o.moveTo(-17, -6); o.quadraticCurveTo(0, -2, 17, -6); o.moveTo(-15.5, 10); o.quadraticCurveTo(0, 14, 15.5, 10); o.stroke(); o.strokeStyle = '#A85A2A'; o.lineWidth = 1.6; o.beginPath(); o.ellipse(0, 24.5, 14, 2.6, 0, 0, 7); o.stroke(); var f = o.createRadialGradient(0, 18, 0, 0, 18, 12); f.addColorStop(0, 'rgba(255,255,220,1)'); f.addColorStop(1, 'rgba(255,200,90,0)'); o.fillStyle = f; o.beginPath(); o.arc(0, 18, 12, 0, 7); o.fill(); n4_face(o, 0, 2, 13, {happy: true}); });
  function lit(l, t) { var fin = n4_env(t - T0 - l.d, 0, 0.35, 6, 8.5); return Math.max(dk ? 1 : 0, fin); }
  return {
    stat: dec.cv, hosted: false,
    step: function (dt, t, f) {
      // steam puffs
      steam.forEach(function (s, i) { if (Math.random() < dt * 2.2 * f.s) puffs.push({x: s.x + (Math.random() - 0.5) * 10, y: s.y, t0: t, ph: Math.random() * 6.28, r: (ph ? 5 : 7) + Math.random() * 4}); });
      puffs = puffs.filter(function (p) { return t - p.t0 < 3.2; });
      // goldfish wander inside the pool (unit disc), turning away from the rim
      fish.forEach(function (F, i) { F.a += (Math.sin(t * 0.7 + F.ph) * 0.9 + Math.sin(t * 1.9 + F.ph * 2) * 0.5) * dt; var r = Math.hypot(F.u, F.v); if (r > 0.78) { var to = Math.atan2(-F.v, -F.u), d = to - F.a; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; F.a += d * dt * 3; }
        var sp = F.sp * (1 + (t - T0 < 4 ? 1.2 : 0)) * f.s; F.u += Math.cos(F.a) * sp * dt; F.v += Math.sin(F.a) * sp * dt * 1.0; });
      if (Math.random() < dt * 0.5 * f.s) ripples.push({u: (Math.random() - 0.5) * 1.4, v: (Math.random() - 0.5) * 1.2, t0: t});
      ripples = ripples.filter(function (r) { return t - r.t0 < 2.6; });
      if (skyT > 0 && t - skyT < 12 && Math.random() < dt * 8) embers.push({t0: t, dx: (Math.random() - 0.5) * 16, vy: 20 + Math.random() * 20});
      embers = embers.filter(function (e) { return t - e.t0 < 1.6; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i;
      // warm pools of light on the street under the stalls (night), and lit windows
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; A.stalls.forEach(function (s, j) { n4_dot(ca, streetG, (s.x0 + s.x1) / 2, s.sb + 12, (s.x1 - s.x0) * 0.6, 0.8 + 0.1 * Math.sin(tt * 1.3 + j)); }); A.wins.forEach(function (w, j) { n4_dot(ca, warmG, w[0], w[1], w[2] * 1.4, 0.35 + 0.05 * flick(tt * 0.4, j)); }); ca.restore(); }
      // strings, then the lanterns hanging from them
      ca.strokeStyle = dk ? 'rgba(30,10,24,0.85)' : 'rgba(110,60,60,0.6)'; ca.lineWidth = 1.1; strings.forEach(function (q) { ca.stroke(q); });
      if (!this.hosted) cb.drawImage(dec.cv, 0, 0, W, H);
      // stall bulbs and their glow (night), steam over the griddles
      A.stalls.forEach(function (s, j) { var bx = (s.x0 + s.x1) / 2, by = s.ab + (ph ? 12 : 16), on = dk ? 1 : Math.max(0, n4_env(t - T0 - (0.25 + j * (ph ? 0.55 : 0.32)), 0, 0.35, 6, 8.5)) * 0.7;
        if (on > 0) { cb.save(); cb.globalCompositeOperation = 'lighter'; n4_dot(cb, warmG, bx, by + 10, (s.x1 - s.x0) * 0.42, on * (0.75 + 0.1 * flick(tt * 0.5, j))); cb.restore(); }
        cb.strokeStyle = '#3A2228'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(bx, s.ab + 2); cb.lineTo(bx, by - 4); cb.stroke(); cb.fillStyle = on > 0.3 || dk ? '#FFF2C0' : '#F4E8D8'; cb.beginPath(); cb.arc(bx, by, ph ? 3.2 : 4.2, 0, 7); cb.fill(); if (on > 0) n4_dot(cb, hotG, bx, by, 10, on); });
      puffs.forEach(function (p) { var u = (t - p.t0) / 3.2, a = Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u) * 0.9; n4_dot(cb, steamG, p.x + Math.sin(u * 5 + p.ph) * 8 * f.a + u * 10, p.y - u * (ph ? 50 : 70), p.r * (1 + u * 2.2), a); });
      // lanterns
      lan.forEach(function (l) { var sw = (Math.sin(tt * l.sp + l.ph) * 0.07 + Math.sin(tt * 0.37 + l.ph * 2) * 0.04) * f.a, L = lit(l, t), cy = l.len + l.r; var cx2 = l.x + Math.sin(sw) * cy, cy2 = l.y + Math.cos(sw) * cy;
        if (L > 0.01) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n4_dot(cb, warmG, cx2, cy2, l.r * (dk ? 3.4 : 2.8), (dk ? 0.75 : 0.55) * L + (L > 0.99 && !dk ? 0 : 0)); cb.restore(); }
        cb.strokeStyle = dk ? 'rgba(40,16,24,0.9)' : 'rgba(90,50,50,0.7)'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(l.x, l.y); cb.lineTo(l.x + Math.sin(sw) * l.len, l.y + Math.cos(sw) * l.len); cb.stroke();
        cb.save(); cb.translate(cx2, cy2); cb.rotate(-sw); var sc = l.r / 16; cb.scale(sc, sc); var sp = SPR[l.k]; cb.drawImage(sp[0], -20, -24, 40, 48); if (L > 0.01) { cb.globalAlpha = L; cb.drawImage(sp[1], -20, -24, 40, 48); } cb.restore(); });
      // goldfish pool
      cb.save(); cb.clip(poolClip);
      ripples.forEach(function (r) { var k = (t - r.t0) / 2.6, x = P.x + r.u * P.rx * 0.8, y = P.y + r.v * P.ry * 0.8; cb.strokeStyle = 'rgba(255,255,255,' + (0.55 * (1 - k)) + ')'; cb.lineWidth = 1.2; cb.beginPath(); cb.ellipse(x, y, 4 + k * 28, (4 + k * 28) * P.ry / P.rx * 1.3, 0, 0, 7); cb.stroke(); });
      fish.forEach(function (F) { var x = P.x + F.u * P.rx * 0.95, y = P.y + F.v * P.ry * 0.95, a = Math.atan2(Math.sin(F.a) * P.ry * 1.6, Math.cos(F.a) * P.rx), L = F.L, wig = Math.sin(tt * 9 + F.ph) * 0.35;
        cb.save(); cb.translate(x, y); cb.scale(1, 0.75); cb.rotate(a);
        cb.fillStyle = 'rgba(0,30,60,0.18)'; cb.beginPath(); cb.ellipse(-L * 0.1 + 2, 4, L * 0.45, L * 0.2, 0, 0, 7); cb.fill();
        cb.fillStyle = F.c[1]; cb.globalAlpha = 0.85; cb.beginPath(); cb.moveTo(-L * 0.35, 0); cb.quadraticCurveTo(-L * 0.8, -L * 0.45 + wig * L * 0.3, -L * 0.95, -L * 0.25 + wig * L * 0.4); cb.quadraticCurveTo(-L * 0.7, wig * L * 0.3, -L * 0.95, L * 0.25 + wig * L * 0.4); cb.quadraticCurveTo(-L * 0.8, L * 0.45 + wig * L * 0.3, -L * 0.35, 0); cb.fill(); cb.globalAlpha = 1;
        cb.fillStyle = F.c[0]; cb.beginPath(); cb.ellipse(0, 0, L * 0.45, L * 0.22, 0, 0, 7); cb.fill(); if (F.c[0] === '#FFF4EA') { cb.fillStyle = F.c[1]; cb.beginPath(); cb.ellipse(L * 0.05, 0, L * 0.18, L * 0.14, 0, 0, 7); cb.fill(); }
        cb.fillStyle = '#1A1420'; cb.beginPath(); cb.arc(L * 0.3, -L * 0.11, Math.max(0.8, L * 0.06), 0, 7); cb.arc(L * 0.3, L * 0.11, Math.max(0.8, L * 0.06), 0, 7); cb.fill(); cb.restore(); });
      cb.strokeStyle = dk ? 'rgba(200,230,255,0.25)' : 'rgba(255,255,255,0.7)'; cb.lineWidth = 1.4; for (i = 0; i < 4; i++) { var gx = P.x + Math.sin(tt * 0.3 + i * 1.7) * P.rx * 0.6, gy = P.y - P.ry * 0.3 + i * P.ry * 0.2; cb.beginPath(); cb.moveTo(gx - 8, gy); cb.lineTo(gx + 8, gy); cb.stroke(); }
      cb.restore();
      // balloon bunch
      balls.forEach(function (b, i) { var bx = B.cx + (b.dx + Math.sin(tt * 0.8 + b.ph) * 2.4 * f.a) * B.s, by = B.cy + (b.dy + Math.sin(tt * 1.1 + b.ph) * 2.6 * f.a) * B.s; cb.strokeStyle = dk ? 'rgba(240,220,230,0.5)' : 'rgba(90,60,70,0.5)'; cb.lineWidth = 0.9; cb.beginPath(); cb.moveTo(bx, by + 13 * b.s * B.s); cb.quadraticCurveTo((bx + B.kx) / 2 + 6, (by + B.ky) / 2, B.kx, B.ky); cb.stroke(); b.x = bx; b.y = by; });
      balls.forEach(function (b, i) { var s = b.s * B.s; cb.drawImage(balSpr[i], b.x - 15 * s, b.y - 17 * s, 30 * s, 34 * s); if (i === 0) n4_face(cb, b.x, b.y - 1 * s, 10 * s, {blink: n4_blink(t, 3), happy: t - T0 < 5}); });
      // the sky lantern
      if (skyT > 0) skies.forEach(function (K, ki) { var u = (t - skyT - K.dt) / 12; if (u <= 0 || u >= 1) return; var e = 1 - Math.pow(1 - u, 1.6), sx = S.x + K.dx * W + Math.sin(u * 7 + ki) * 18, sy = S.y0 + (S.y1 - S.y0) * e * (1 - ki * 0.12), s = (ph ? 1.0 : 1.6) * K.s * (1 - u * 0.35), al = Math.min(1, u * 8, (1 - u) * 6);
        cb.save(); cb.globalCompositeOperation = 'lighter'; n4_dot(cb, warmG, sx, sy, 70 * s, al * (dk ? 0.95 : 0.75)); cb.restore();
        if (!ki) embers.forEach(function (em) { var k = (t - em.t0) / 1.6; cb.fillStyle = 'rgba(255,200,110,' + (al * (1 - k)) + ')'; cb.beginPath(); cb.arc(sx + em.dx * s + Math.sin(k * 6) * 3, sy + 26 * s + k * em.vy, 1.6 * (1 - k * 0.5), 0, 7); cb.fill(); });
        cb.globalAlpha = al; cb.drawImage(skySpr, sx - 30 * s, sy - 35 * s, 60 * s, 70 * s); cb.globalAlpha = 1; });
    },
    finish: function (t) { T0 = t; skyT = t + 0.3; embers = []; }
  };
};
UIC.nightmarket = {L: ['#B2453E', '#7E2A30', 'rgba(255,252,248,0.86)', '#3A1E22', '#7A5258', '#C23A34', '#C23A34', '#E07A3A', '#FFFFFF'], D: ['#4A2140', '#24102A', 'rgba(36,18,44,0.8)', '#FBEFF2', '#C8AFBF', '#FFB65E', '#FFB65E', '#FFD28A', '#2A1420']};

// ---------- Dia de los Muertos
// Loop: papel picado flutters on its strings, candle flames flicker on the ofrenda, marigold petals drift down and
// monarch butterflies float by. Moment: the petal path lights up toward the ofrenda, its candles glow one by one, and a
// cloud of monarchs rises into the sky.
function n4_monarch(c, x, y, s, t, ph, ang) {
  var fl = 0.2 + 0.8 * Math.abs(Math.cos(t * 7 + ph)); c.save(); c.translate(x, y); c.rotate(ang || 0); c.scale(s, s);
  c.lineJoin = 'round'; c.lineWidth = 1.1; c.strokeStyle = '#2A1A1A';
  [-1, 1].forEach(function (d) { c.save(); c.scale(d * fl, 1);
    c.fillStyle = '#F4891E'; c.beginPath(); c.moveTo(0, -1); c.bezierCurveTo(4, -9, 12, -10, 11, -3); c.bezierCurveTo(10, 0, 5, 1, 0, 1); c.fill(); c.stroke();
    c.fillStyle = '#F7A23A'; c.beginPath(); c.moveTo(0, 0.5); c.bezierCurveTo(6, 1, 9, 5, 6, 8); c.bezierCurveTo(4, 9, 1, 6, 0, 2); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(42,26,26,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(1, -1); c.lineTo(9, -6); c.moveTo(1, -0.5); c.lineTo(10, -2); c.moveTo(1, 1.5); c.lineTo(5, 6); c.stroke();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(10, -5, 0.7, 0, 7); c.arc(8.4, -8, 0.6, 0, 7); c.arc(6, 7.2, 0.6, 0, 7); c.fill(); c.restore(); });
  c.fillStyle = '#2A1A1A'; c.beginPath(); c.ellipse(0, 0.5, 1, 4.5, 0, 0, 7); c.fill(); c.restore(); }
function n4_sugarSkull(o, x, y, r, cols) {
  o.save(); o.translate(x, y);
  var g = o.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#EDE2EE');
  o.fillStyle = g; o.strokeStyle = '#5A2A46'; o.lineWidth = Math.max(0.8, r * 0.08);
  o.beginPath(); o.arc(0, -r * 0.1, r, Math.PI * 0.8, Math.PI * 2.2); o.quadraticCurveTo(r * 0.75, r * 0.85, r * 0.45, r * 0.95); o.lineTo(-r * 0.45, r * 0.95); o.quadraticCurveTo(-r * 0.75, r * 0.85, -r * Math.cos(Math.PI * 0.2), -r * 0.1 + r * Math.sin(Math.PI * 0.2)); o.closePath(); o.fill(); o.stroke();
  [-1, 1].forEach(function (d, i) { o.fillStyle = cols[i]; o.beginPath(); o.arc(d * r * 0.38, r * 0.02, r * 0.3, 0, 7); o.fill(); o.fillStyle = '#3A1A2E'; o.beginPath(); o.arc(d * r * 0.38, r * 0.05, r * 0.17, 0, 7); o.fill(); o.fillStyle = '#FFFFFF'; o.beginPath(); o.arc(d * r * 0.38 + r * 0.06, r * -0.02, r * 0.06, 0, 7); o.fill(); });
  o.fillStyle = cols[2]; for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; o.beginPath(); o.arc(Math.cos(a) * r * 0.16, -r * 0.55 + Math.sin(a) * r * 0.16, r * 0.12, 0, 7); o.fill(); } o.fillStyle = '#FFD23A'; o.beginPath(); o.arc(0, -r * 0.55, r * 0.09, 0, 7); o.fill();
  o.fillStyle = '#F27BA6'; o.beginPath(); o.moveTo(0, r * 0.42); o.lineTo(-r * 0.09, r * 0.32); o.arc(-r * 0.045, r * 0.3, r * 0.05, Math.PI, 0); o.arc(r * 0.045, r * 0.3, r * 0.05, Math.PI, 0); o.closePath(); o.fill();
  o.strokeStyle = '#3A1A2E'; o.lineWidth = Math.max(0.7, r * 0.06); o.beginPath(); o.arc(0, r * 0.45, r * 0.32, Math.PI * 0.2, Math.PI * 0.8); o.stroke();
  o.beginPath(); for (k = -2; k <= 2; k++) { var mx = k * r * 0.11; o.moveTo(mx, r * 0.66); o.lineTo(mx, r * 0.8); } o.stroke();
  o.fillStyle = cols[0]; [[-0.75, -0.35], [0.75, -0.35], [-0.6, -0.75], [0.6, -0.75]].forEach(function (p) { o.beginPath(); o.arc(p[0] * r, p[1] * r, r * 0.06, 0, 7); o.fill(); });
  o.restore(); }
function n4_pan(o, x, y, r) { o.save(); o.translate(x, y); var g = o.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, -r * 0.2, r * 1.1); g.addColorStop(0, '#F6C77A'); g.addColorStop(1, '#C27434'); o.fillStyle = g; o.strokeStyle = '#7A3E1A'; o.lineWidth = 1;
  o.beginPath(); o.ellipse(0, 0, r, r * 0.62, 0, Math.PI, 0); o.lineTo(r, 0); o.quadraticCurveTo(0, r * 0.14, -r, 0); o.fill(); o.stroke();
  o.strokeStyle = '#B0602A'; o.lineWidth = r * 0.16; o.beginPath(); o.moveTo(-r * 0.7, -r * 0.18); o.quadraticCurveTo(0, -r * 0.62, r * 0.7, -r * 0.18); o.moveTo(-r * 0.25, -r * 0.05); o.quadraticCurveTo(-r * 0.1, -r * 0.5, 0, -r * 0.58); o.moveTo(r * 0.25, -r * 0.05); o.quadraticCurveTo(r * 0.1, -r * 0.5, 0, -r * 0.58); o.stroke();
  o.fillStyle = '#B0602A'; o.beginPath(); o.arc(0, -r * 0.6, r * 0.16, 0, 7); o.fill(); o.fillStyle = 'rgba(255,240,210,0.85)'; for (var k = 0; k < 14; k++) { o.fillRect(-r * 0.8 + (k * 37 % 16) / 16 * r * 1.6, -r * 0.45 + (k * 23 % 9) / 9 * r * 0.4, 1.2, 1.2); } o.restore(); }
ENGINES.diadelosmuertos = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.C, T0 = -99, K = ph ? 2 : 1.5;
  var flameG = n4_rg(dk ? 'rgba(255,170,80,0.7)' : 'rgba(255,190,110,0.5)', [0.3, dk ? 0.32 : 0.2]), hotG = n4_rg('rgba(255,246,200,0.95)', [0.3, 0.6]), winG = n4_rg('rgba(255,180,90,0.4)', [0.4, 0.2]), pathG = n4_rg(dk ? 'rgba(255,190,80,0.8)' : 'rgba(255,170,40,0.85)', [0.35, 0.4]);
  // papel picado: six colours, each flag with cut-out flowers and diamonds
  var PC = dk ? ['#E8508E', '#F2902E', '#F2CC3A', '#3CB87A', '#2EB8C8', '#9A62E0'] : ['#FF5FA2', '#FF9A2E', '#FFD23A', '#3FC27A', '#2EC4D0', '#9A5AE0'], fw = ph ? 26 : 34, fh = fw * 1.25;
  var FL = PC.map(function (col, ci) { return n4_sprite(fw + 4, fh + 4, 3, function (o) { o.translate(0, -fh / 2); o.fillStyle = col; o.beginPath(); o.moveTo(-fw / 2, 0); o.lineTo(fw / 2, 0); o.lineTo(fw / 2, fh * 0.86); for (var q = 0; q <= 6; q++) o.lineTo(fw / 2 - q * fw / 6, fh * (q % 2 ? 1 : 0.86)); o.closePath(); o.fill();
    o.globalCompositeOperation = 'destination-out'; var cx = 0, cy = fh * 0.45, r = fw * 0.16; for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; o.beginPath(); o.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.55, r * 0.3, a, 0, 7); o.fill(); } o.beginPath(); o.arc(cx, cy, r * 0.32, 0, 7); o.fill();
    [[-0.32, 0.14], [0.32, 0.14], [-0.32, 0.76], [0.32, 0.76], [0, 0.12], [0, 0.78]].forEach(function (p) { var dx = p[0] * fw, dy = p[1] * fh, d = fw * 0.06; o.beginPath(); o.moveTo(dx, dy - d); o.lineTo(dx + d, dy); o.lineTo(dx, dy + d); o.lineTo(dx - d, dy); o.fill(); });
    for (k = 0; k < 5; k++) { o.beginPath(); o.arc(-fw * 0.36 + k * fw * 0.18, fh * 0.04, fw * 0.025, 0, 7); o.fill(); }
    o.globalCompositeOperation = 'source-over'; o.fillStyle = 'rgba(255,255,255,0.25)'; o.fillRect(-fw / 2, 0, fw, fh * 0.05); }); });
  var flags = [], strs = [];
  A.picado.forEach(function (s, si) { var p = new Path2D(); n4_cat(s[0], s[1], s[2], s[3], s[4], 40).forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); strs.push(p); var n = Math.floor((s[2] - s[0]) / (fw + 6)); for (var q = 0; q < n; q++) { var pt = n4_at(s[0], s[1], s[2], s[3], s[4], (q + 0.5) / n); flags.push({x: pt[0], y: pt[1], c: (q + si * 2) % 6, ph: hash(q + si * 40) * 6.28}); } });
  // the ofrenda's treats and the candle jars, painted once
  var dec = n4_off(W, H, K), o = dec.o, SKC = [['#F27BA6', '#2EC4D0', '#FFB23A'], ['#2EC4D0', '#F27BA6', '#9A5AE0'], ['#FFB23A', '#3FC27A', '#F27BA6']];
  A.treats.forEach(function (T) { var w = T.x1 - T.x0, cx = (T.x0 + T.x1) / 2, s = ph ? 0.75 : 1;
    if (T.ti === 2) { [-1, 1].forEach(function (d, i) { var fx = cx + d * w * 0.26, fy = T.y - 30 * s, fwid = 26 * s, fhgt = 32 * s; o.save(); o.translate(fx, fy); o.rotate(d * 0.06); o.fillStyle = '#C9962E'; o.strokeStyle = '#6A4418'; o.lineWidth = 1.2; o.beginPath(); o.rect(-fwid / 2, -fhgt / 2, fwid, fhgt); o.fill(); o.stroke(); var g = o.createLinearGradient(0, -fhgt / 2, 0, fhgt / 2); g.addColorStop(0, i ? '#BFE6F2' : '#FFE0C8'); g.addColorStop(1, i ? '#7CC8A0' : '#F6A6B8'); o.fillStyle = g; o.fillRect(-fwid / 2 + 3.5 * s, -fhgt / 2 + 3.5 * s, fwid - 7 * s, fhgt - 7 * s); o.fillStyle = i ? '#FFF6D0' : '#FF6F91';
        if (i) { o.beginPath(); o.arc(4 * s, -6 * s, 3.5 * s, 0, 7); o.fill(); o.fillStyle = '#5AA86A'; o.beginPath(); o.moveTo(-9 * s, 12 * s); o.quadraticCurveTo(0, 2 * s, 9 * s, 12 * s); o.fill(); } else { o.beginPath(); o.moveTo(0, 6 * s); o.bezierCurveTo(-9 * s, -1 * s, -4 * s, -9 * s, 0, -3 * s); o.bezierCurveTo(4 * s, -9 * s, 9 * s, -1 * s, 0, 6 * s); o.fill(); } o.restore(); });
      n4_sugarSkull(o, cx, T.y - 15 * s, 14 * s, SKC[0]); }
    else if (T.ti === 1) { n4_pan(o, cx - w * 0.27, T.y - 1, 17 * s); n4_pan(o, cx + w * 0.27, T.y - 1, 15 * s); n4_sugarSkull(o, cx - w * 0.04, T.y - 11 * s, 10 * s, SKC[1]); n4_sugarSkull(o, cx + w * 0.1, T.y - 9 * s, 8 * s, SKC[2]); }
    else { [[-0.36, '#FFA23A'], [-0.28, '#FF8A1E'], [0.24, '#9AD06A'], [0.32, '#FFA23A']].forEach(function (q) { var g = o.createRadialGradient(cx + q[0] * w - 2, T.y - 9 * s, 1, cx + q[0] * w, T.y - 7 * s, 8 * s); g.addColorStop(0, '#FFE2A0'); g.addColorStop(1, q[1]); o.fillStyle = g; o.beginPath(); o.arc(cx + q[0] * w, T.y - 7 * s, 7 * s, 0, 7); o.fill(); });
      n4_sugarSkull(o, cx - w * 0.1, T.y - 9 * s, 8 * s, SKC[2]); n4_sugarSkull(o, cx + w * 0.06, T.y - 9 * s, 8 * s, SKC[1]);
      // a cup of hot chocolate
      var mx = cx - w * 0.01, my = T.y; o.fillStyle = '#E8DCCB'; o.strokeStyle = '#7A4A2A'; o.lineWidth = 1; o.beginPath(); o.moveTo(mx - 6 * s, my - 12 * s); o.lineTo(mx + 6 * s, my - 12 * s); o.lineTo(mx + 5 * s, my); o.lineTo(mx - 5 * s, my); o.closePath(); o.fill(); o.stroke(); o.fillStyle = '#6A3418'; o.beginPath(); o.ellipse(mx, my - 12 * s, 6 * s, 1.6 * s, 0, 0, 7); o.fill(); } });
  A.candles.forEach(function (c) { if (!c.jar) return; var g = o.createLinearGradient(c.x - c.w, 0, c.x + c.w, 0); g.addColorStop(0, 'rgba(200,40,60,0.85)'); g.addColorStop(0.5, 'rgba(255,110,110,0.75)'); g.addColorStop(1, 'rgba(170,30,60,0.85)'); o.fillStyle = g; o.beginPath(); if (o.roundRect) o.roundRect(c.x - c.w, c.y - 2, c.w * 2, c.h + 3, 3); else o.rect(c.x - c.w, c.y - 2, c.w * 2, c.h + 3); o.fill(); o.fillStyle = 'rgba(255,230,160,0.9)'; o.fillRect(c.x - c.w * 0.6, c.y + c.h * 0.35, c.w * 1.2, c.h * 0.3); });
  var candles = A.candles.map(function (c, i) { return {x: c.x, y: c.y, w: c.w, h: c.h, jar: c.jar, ph: hash(i + 3) * 6.28, d: 1.6 + i * 0.14}; });
  // petals and monarchs
  var petals = [], bflies = [];
  for (var i = 0; i < (ph ? 9 : 16); i++) petals.push({x: hash(i + 1) * W, y: hash(i + 2) * H, vy: 14 + hash(i + 3) * 12, ph: hash(i + 4) * 6.28, c: i % 2 ? C.ora : C.yel2, s: (ph ? 2.6 : 3.4) * (0.8 + hash(i + 5) * 0.4)});
  for (i = 0; i < (ph ? 3 : 5); i++) bflies.push({x0: hash(i + 20) * W, y0: H * (0.08 + hash(i + 21) * 0.5), vx: (hash(i + 22) < 0.5 ? -1 : 1) * (14 + hash(i + 23) * 10), ph: hash(i + 24) * 6.28, s: ph ? 0.9 : 1.2, t0: 0, amb: 1});
  var P = A.path, plen = P.length - 1;
  return {
    stat: dec.cv, hosted: false,
    step: function (dt, t, f) {
      petals.forEach(function (p) { p.y += p.vy * dt * f.s; p.x += Math.sin(t * 0.8 + p.ph) * 12 * dt * f.a + 4 * dt; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } if (p.x > W + 10) p.x = -10; });
      bflies.forEach(function (b) { if (b.amb) { b.x0 += b.vx * dt * f.s; if (b.x0 > W + 30) b.x0 = -30; if (b.x0 < -30) b.x0 = W + 30; } });
      bflies = bflies.filter(function (b) { return b.amb || t - b.t0 < b.life; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, i, T = t - T0;
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; A.wins.forEach(function (w, j) { n4_dot(ca, winG, w[0], w[1], w[2] * 1.5, 0.7 + 0.15 * flick(tt * 0.3, j)); }); ca.restore(); }
      // the petal path lights up toward the ofrenda
      if (T > 0 && T < 14) { cb.save(); cb.globalCompositeOperation = 'lighter'; var head = Math.min(plen, T / 1.8 * plen), fade = n4_env(T, 0, 0.3, 9, 13);
        for (i = 0; i <= head; i++) { var p = P[i], near = Math.max(0, 1 - (head - i) / 8), k = 0.35 + 0.65 * near; n4_dot(cb, pathG, p[0], p[1], (ph ? 22 : 34) * (1 - i / plen * 0.45) * (0.7 + near * 0.5), (dk ? 0.55 : 0.6) * k * fade); }
        if (head >= plen) n4_dot(cb, flameG, A.ofr.x, A.ofr.y + 40, A.ofr.ary * 1.4, 0.5 * fade * n4_env(T, 1.8, 2.6, 9, 13)); cb.restore(); }
      if (!this.hosted) cb.drawImage(dec.cv, 0, 0, W, H);
      // candle flames
      candles.forEach(function (c, j) { var boost = n4_env(T - c.d, 0, 0.25, 6, 9), fk = flick(tt * 1.4, c.ph), fh = c.h * (0.55 + 0.15 * fk) * (1 + boost * 0.5) * (ph ? 1.1 : 1), fwid = c.w * 0.45 * (1 + boost * 0.3), fx = c.x + Math.sin(tt * 3 + c.ph) * 0.8, fy = c.y - 1;
        cb.save(); cb.globalCompositeOperation = 'lighter'; n4_dot(cb, flameG, fx, fy - fh * 0.5, c.h * (dk ? 2.3 : 1.6) * (1 + boost * 0.8), (dk ? 0.85 : 0.5) * (0.85 + 0.15 * fk) + boost * 0.3); cb.restore();
        cb.strokeStyle = '#3A2420'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(c.x, c.y + 1); cb.lineTo(c.x, c.y - 2); cb.stroke();
        cb.fillStyle = '#FF9A2E'; cb.beginPath(); cb.moveTo(fx, fy - fh); cb.quadraticCurveTo(fx + fwid * 1.6, fy - fh * 0.3, fx, fy); cb.quadraticCurveTo(fx - fwid * 1.6, fy - fh * 0.3, fx, fy - fh); cb.fill();
        cb.fillStyle = '#FFF2B8'; cb.beginPath(); cb.moveTo(fx, fy - fh * 0.65); cb.quadraticCurveTo(fx + fwid * 0.8, fy - fh * 0.2, fx, fy - 0.5); cb.quadraticCurveTo(fx - fwid * 0.8, fy - fh * 0.2, fx, fy - fh * 0.65); cb.fill(); });
      // papel picado
      cb.strokeStyle = dk ? 'rgba(255,230,240,0.45)' : 'rgba(90,50,60,0.55)'; cb.lineWidth = 1; strs.forEach(function (s) { cb.stroke(s); });
      flags.forEach(function (F) { var sw = (Math.sin(tt * 1.7 + F.ph) * 0.1 + Math.sin(tt * 0.6 + F.x * 0.01) * 0.08) * f.a, sk = Math.sin(tt * 2.3 + F.ph * 1.3) * 0.12 * f.a; cb.save(); cb.translate(F.x, F.y); cb.rotate(sw); cb.transform(1, 0, sk, 1, 0, 0); cb.scale(1, 0.94 + 0.06 * Math.cos(tt * 2.1 + F.ph)); var S = FL[F.c]; cb.drawImage(S, -S.w / 2, -2, S.w, S.h); cb.restore(); });
      // drifting petals
      petals.forEach(function (p) { cb.save(); cb.translate(p.x, p.y); cb.rotate(tt * 1.5 + p.ph); cb.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(tt * 2 + p.ph))); cb.fillStyle = p.c; cb.beginPath(); cb.ellipse(0, 0, p.s * 1.3, p.s * 0.75, 0, 0, 7); cb.fill(); cb.restore(); });
      // monarchs
      bflies.forEach(function (b) { var x, y, a = 0; if (b.amb) { x = b.x0; y = b.y0 + Math.sin(tt * 0.9 + b.ph) * 26 + Math.sin(tt * 2.3 + b.ph) * 6; a = b.vx > 0 ? 0.25 : -0.25; }
        else { var u = (t - b.t0) / b.life; if (u < 0) return; x = b.x + b.dx * u + Math.sin(u * 8 + b.ph) * 22; y = b.y - b.rise * (1 - Math.pow(1 - u, 1.5)) + Math.sin(u * 13 + b.ph) * 6; a = Math.sin(u * 6 + b.ph) * 0.3; cb.globalAlpha = Math.min(1, u * 8, (1 - u) * 4); }
        n4_monarch(cb, x, y, b.s, tt, b.ph, a); cb.globalAlpha = 1; });
    },
    finish: function (t) { T0 = t; var O = A.ofr; for (var i = 0; i < (ph ? 18 : 30); i++) bflies.push({x: O.x + (Math.random() - 0.5) * O.ary * 1.4, y: O.y + Math.random() * 60, dx: (Math.random() - 0.3) * W * 0.5, rise: H * (0.5 + Math.random() * 0.4), t0: t + 1.9 + Math.random() * 1.6, life: 6 + Math.random() * 3, ph: Math.random() * 6.28, s: (ph ? 0.8 : 1.1) * (0.8 + Math.random() * 0.5)}); }
  };
};
UIC.diadelosmuertos = {L: ['#C2367A', '#8A2058', 'rgba(255,252,246,0.86)', '#3A1A2E', '#7A5068', '#C2367A', '#C2367A', '#F07A2A', '#FFFFFF'], D: ['#4A1E54', '#24102E', 'rgba(34,16,44,0.8)', '#FCEFF6', '#C9AFC4', '#FFA23A', '#FFA23A', '#FFC86A', '#2A1420']};

// ---------- Holi
// Loop: soft clouds of pink, yellow, green and blue powder drift and mix, now and then a handful of gulal is thrown up
// from the courtyard, petals tumble and the marigold garlands sway. Night: fairy lights twinkle along the arches.
// Moment: a big wave of colour bursts across the whole sky, then settles into the stripes of a rainbow.
ENGINES.holi = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, C = A.C;
  var PC = dk ? ['240,80,170', '250,200,60', '60,200,140', '90,150,250', '170,110,240', '255,130,60'] : ['255,90,170', '255,200,50', '50,200,120', '80,150,250', '160,100,240', '255,140,60'];
  var CL = PC.map(function (c, ci) { return n4_sprite(160, 120, 1, function (o) { for (var k = 0; k < 7; k++) { var x = (hash(k + ci * 9) - 0.5) * 80, y = (hash(k * 3 + ci) - 0.5) * 44, r = 26 + hash(k + 50 + ci) * 22, g = o.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + c + ',0.55)'); g.addColorStop(0.6, 'rgba(' + c + ',0.3)'); g.addColorStop(1, 'rgba(' + c + ',0)'); o.fillStyle = g; o.beginPath(); o.arc(x, y, r, 0, 7); o.fill(); } }); });
  var POM = ['#FF9A1E', '#FFC62A', '#FF7A1A'].map(function (c) { return n4_sprite(20, 20, 3, function (o) { var g = o.createRadialGradient(-2, -2, 0.5, 0, 0, 8); g.addColorStop(0, '#FFE9A0'); g.addColorStop(1, c); o.fillStyle = g; for (var k = 0; k < 8; k++) { var a = k / 8 * 6.28; o.beginPath(); o.arc(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 3.6, 0, 7); o.fill(); } o.beginPath(); o.arc(0, 0, 5, 0, 7); o.fill(); o.fillStyle = 'rgba(160,70,0,0.35)'; o.beginPath(); o.arc(0.6, 0.6, 1.8, 0, 7); o.fill(); }); });
  var LEAF = n4_sprite(14, 26, 3, function (o) { o.fillStyle = '#4E9A44'; o.beginPath(); o.moveTo(0, -12); o.quadraticCurveTo(7, 0, 0, 12); o.quadraticCurveTo(-7, 0, 0, -12); o.fill(); o.strokeStyle = '#2E6A2E'; o.lineWidth = 0.8; o.beginPath(); o.moveTo(0, -10); o.lineTo(0, 10); o.stroke(); });
  var lightG = n4_rg('rgba(255,220,150,0.8)', [0.3, 0.3]), winG = n4_rg('rgba(255,190,110,0.45)', [0.4, 0.2]);
  var clouds = [], i;
  for (i = 0; i < (ph ? 6 : 10); i++) { var low = i % 4 === 3; clouds.push({x: hash(i + 1) * W, y: low ? A.gy + (hash(i + 2) * 0.6 + 0.1) * (H - A.gy) : H * 0.04 + hash(i + 2) * (A.ft - H * 0.04), s: (ph ? 0.9 : 1.4) * (0.7 + hash(i + 3) * 0.6), c: i % 6, vx: (hash(i + 4) - 0.5) * 10, ph: hash(i + 5) * 6.28, a: low ? 0.55 : 0.7}); }
  var puffs = [], dots = [], petals = [], nextThrow = 2;
  for (i = 0; i < (ph ? 10 : 18); i++) petals.push({x: hash(i + 30) * W, y: hash(i + 31) * H, vy: 16 + hash(i + 32) * 14, ph: hash(i + 33) * 6.28, c: ['#FF5A8A', '#FF9A1E', '#FFC62A', '#F2479A'][i % 4], s: (ph ? 2.8 : 3.6) * (0.8 + hash(i + 34) * 0.4)});
  var G = A.gar, nG = Math.ceil((W + G.step * 2) / G.step);
  function throwAt(x, y, big, t0) { var c = Math.floor(Math.random() * 6); puffs.push({x: x, y: y, t0: t0, c: c, s: (ph ? 0.7 : 1) * (big ? 2.2 + Math.random() * 1.4 : 0.9 + Math.random() * 0.5), life: big ? 5.5 : 4, vy: big ? 6 : 26, big: big});
    for (var k = 0; k < (big ? 6 : 18); k++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; dots.push({x: x, y: y, vx: Math.cos(a) * (40 + Math.random() * 80), vy: Math.sin(a) * (80 + Math.random() * 90), t0: t0, c: c}); } }
  return {
    step: function (dt, t, f) {
      clouds.forEach(function (c) { c.x += (c.vx + 4) * dt * f.s; if (c.x > W + 120) c.x = -120; if (c.x < -120) c.x = W + 120; });
      nextThrow -= dt * f.s; if (nextThrow <= 0) { nextThrow = 2.5 + Math.random() * 3; throwAt(W * (0.1 + Math.random() * 0.8), A.gy + (H - A.gy) * (0.2 + Math.random() * 0.5), false, t); }
      var T = t - T0; if (T > 0 && T < 2.4) { var fx = -0.15 * W + T / 2.2 * W * 1.3; if (Math.random() < dt * (ph ? 12 : 18)) throwAt(fx + (Math.random() - 0.5) * 60, H * (0.04 + Math.random() * 0.62), true, t); }
      puffs = puffs.filter(function (p) { return t - p.t0 < p.life; }); dots = dots.filter(function (d) { return t - d.t0 < 1.6; });
      petals.forEach(function (p) { p.y += p.vy * dt * f.s; p.x += Math.sin(t * 0.9 + p.ph) * 14 * dt * f.a; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0;
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; A.wins.forEach(function (w, j) { n4_dot(ca, winG, w[0], w[1], w[2] * 1.3, 0.75 + 0.15 * flick(tt * 0.3, j)); }); ca.restore(); }
      // drifting colour clouds (behind the trees and the haveli's front)
      clouds.forEach(function (c) { var S = CL[c.c], s = c.s * (1 + 0.06 * Math.sin(tt * 0.4 + c.ph)); ca.globalAlpha = c.a; ca.drawImage(S, c.x - 80 * s, c.y + Math.sin(tt * 0.3 + c.ph) * 8 - 60 * s, 160 * s, 120 * s); }); ca.globalAlpha = 1;
      // the rainbow the wave settles into
      var R = n4_env(T, 2.2, 3.8, 10, 12.5);
      if (R > 0) { var rcx = W * 0.5, rcy = H * (ph ? 0.62 : 0.98), rr = ph ? W * 0.62 : H * 0.8, bw = ph ? 9 : 15, RB = ['#FF5A6A', '#FF9A3A', '#FFD23A', '#5AD07A', '#4AA8F0', '#6A6AE0', '#B070E0'];
        cb.save(); cb.lineCap = 'butt'; RB.forEach(function (col, k) { var r = rr - k * bw, sweep = Math.min(1, (T - 2.2) / 1.2); cb.strokeStyle = col; cb.globalAlpha = 0.25 * R; cb.lineWidth = bw * 1.6; cb.beginPath(); cb.arc(rcx, rcy, r, Math.PI, Math.PI + Math.PI * sweep); cb.stroke(); cb.globalAlpha = 0.72 * R; cb.lineWidth = bw; cb.beginPath(); cb.arc(rcx, rcy, r, Math.PI, Math.PI + Math.PI * sweep); cb.stroke(); }); cb.restore(); }
      // thrown powder: a puff that grows and fades, with a spray of grains
      puffs.forEach(function (p) { var u = (t - p.t0) / p.life, S = CL[p.c], s = p.s * (0.35 + Math.pow(u, 0.5) * 1.1); cb.globalAlpha = Math.min(1, u * 8) * (1 - u) * (p.big ? 0.95 : 0.85); cb.drawImage(S, p.x - 80 * s, p.y - p.vy * u * 4 - 60 * s, 160 * s, 120 * s); }); cb.globalAlpha = 1;
      dots.forEach(function (d) { var u = (t - d.t0), x = d.x + d.vx * u, y = d.y + d.vy * u + 90 * u * u; cb.fillStyle = 'rgba(' + PC[d.c] + ',' + (0.9 * (1 - u / 1.6)) + ')'; cb.beginPath(); cb.arc(x, y, ph ? 1.6 : 2.2, 0, 7); cb.fill(); });
      // fairy lights along the arches at night
      if (dk) { A.arches.forEach(function (a, j) { for (var q = 0; q <= 8; q++) { var ang = Math.PI + q / 8 * Math.PI, x = a.x + Math.cos(ang) * a.w * 0.56, y = a.y + a.w * 0.5 + Math.sin(ang) * a.w * 0.6 - 4, k = 0.55 + 0.45 * Math.sin(tt * 1.8 + q * 1.3 + j); n4_dot(cb, lightG, x, y, 9, k * 0.7); cb.fillStyle = ['#FFE08A', '#FF9AC8', '#9AF0D0'][q % 3]; cb.beginPath(); cb.arc(x, y, 1.8, 0, 7); cb.fill(); } }); }
      // petals
      petals.forEach(function (p) { cb.save(); cb.translate(p.x, p.y); cb.rotate(tt * 1.3 + p.ph); cb.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(tt * 1.8 + p.ph))); cb.fillStyle = p.c; cb.beginPath(); cb.ellipse(0, 0, p.s * 1.3, p.s * 0.8, 0, 0, 7); cb.fill(); cb.restore(); });
      // marigold garlands swaying across the top
      var ps = ph ? 0.75 : 1, step = ph ? 9 : 11;
      for (i = 0; i < nG; i++) { var x0 = -G.step * 0.5 + i * G.step, x1 = x0 + G.step, sag = G.sag * (1 + 0.08 * Math.sin(tt * 0.9 + i)), dx = Math.sin(tt * 0.7 + i * 1.3) * 4 * f.a, n = Math.round(G.step / step);
        for (var q = 1; q < n; q++) { var u = q / n, p = n4_at(x0, G.y, x1, G.y, sag, u), sw = Math.sin(Math.PI * u) * dx, S = POM[q % 3]; cb.drawImage(S, p[0] + sw - 10 * ps, p[1] - 10 * ps, 20 * ps, 20 * ps); }
        cb.save(); cb.translate(x0, G.y + 2); cb.rotate(Math.sin(tt * 1.1 + i) * 0.06); [-0.5, 0, 0.5].forEach(function (a) { cb.save(); cb.rotate(a); cb.drawImage(LEAF, -7 * ps, 4 * ps, 14 * ps, 26 * ps); cb.restore(); });
        for (q = 1; q <= 4; q++) cb.drawImage(POM[q % 3], -10 * ps, (q * 9 - 4) * ps, 20 * ps, 20 * ps); cb.restore(); }
    },
    finish: function (t) { T0 = t; }
  };
};
UIC.holi = {L: ['#D8407E', '#9A2A6A', 'rgba(255,253,250,0.86)', '#3A1A30', '#76546A', '#D23A82', '#D23A82', '#F08A2A', '#FFFFFF'], D: ['#5A2470', '#2A1040', 'rgba(36,18,52,0.8)', '#FCEFFA', '#CBB0D6', '#FF8AC8', '#FF8AC8', '#FFC86A', '#2A1030']};

// ---------- Ramadan Nights
// Loop: fanous lanterns sway on their strings and a floor lantern throws little stars of coloured light across the
// terrace, the sky's stars twinkle, the crescent glows softly and the string lights shiver in the breeze.
// Moment: the crescent brightens over the domes, lanterns and windows light up roof by roof across the city, and a
// string of stars blinks on overhead.
function n4_fanous(o, R, lit, k) {
  var gold = lit ? '#F6CE6A' : '#D9A43A', dark = '#7A4E1A', G = [['#E8463A', '#FFB070'], ['#2EA86A', '#9AF0B0'], ['#3A6AD8', '#A8C8FF'], ['#F2A21E', '#FFE08A']];
  var a = G[k % 4], b = G[(k + 1) % 4], c = G[(k + 2) % 4];
  o.lineJoin = 'round'; o.strokeStyle = dark; o.lineWidth = R * 0.06;
  o.beginPath(); o.arc(0, -R * 1.95, R * 0.16, 0, 7); o.stroke();
  o.fillStyle = gold; o.beginPath(); o.moveTo(-R * 0.55, -R * 1.25); o.quadraticCurveTo(-R * 0.5, -R * 1.78, 0, -R * 1.8); o.quadraticCurveTo(R * 0.5, -R * 1.78, R * 0.55, -R * 1.25); o.closePath(); o.fill(); o.stroke();
  o.beginPath(); o.rect(-R * 0.72, -R * 1.28, R * 1.44, R * 0.24); o.fill(); o.stroke();
  function pane(x0, x1, y0, y1, x2, x3, col) { var g = o.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, lit ? col[1] : col[0]); g.addColorStop(1, lit ? col[0] : col[0]); o.fillStyle = g; o.globalAlpha = lit ? 1 : 0.85; o.beginPath(); o.moveTo(x0, y0); o.lineTo(x1, y0); o.lineTo(x3, y1); o.lineTo(x2, y1); o.closePath(); o.fill(); o.globalAlpha = 1; o.stroke(); }
  pane(-R * 0.3, R * 0.3, -R * 1.04, R * 0.5, -R * 0.24, R * 0.24, a);
  pane(-R * 0.72, -R * 0.3, -R * 1.04, R * 0.5, -R * 0.52, -R * 0.24, b);
  pane(R * 0.3, R * 0.72, -R * 1.04, R * 0.5, R * 0.24, R * 0.52, c);
  if (lit) { var gl = o.createRadialGradient(0, -R * 0.25, 0, 0, -R * 0.25, R * 0.8); gl.addColorStop(0, 'rgba(255,250,210,0.9)'); gl.addColorStop(1, 'rgba(255,220,140,0)'); o.fillStyle = gl; o.beginPath(); o.arc(0, -R * 0.25, R * 0.8, 0, 7); o.fill(); }
  o.fillStyle = gold; o.beginPath(); o.moveTo(0, -R * 0.62); o.lineTo(R * 0.11, -R * 0.32); o.lineTo(0, -R * 0.02); o.lineTo(-R * 0.11, -R * 0.32); o.closePath(); o.fill();
  o.beginPath(); o.arc(-R * 0.51, -R * 0.3, R * 0.07, 0, 7); o.arc(R * 0.51, -R * 0.3, R * 0.07, 0, 7); o.fill();
  o.beginPath(); o.rect(-R * 0.62, R * 0.46, R * 1.24, R * 0.18); o.fill(); o.stroke();
  o.beginPath(); o.moveTo(-R * 0.55, R * 0.64); o.lineTo(R * 0.55, R * 0.64); o.lineTo(R * 0.12, R * 1.2); o.lineTo(-R * 0.12, R * 1.2); o.closePath(); o.fill(); o.stroke();
  o.beginPath(); o.arc(0, R * 1.32, R * 0.13, 0, 7); o.fill(); o.stroke();
  o.fillStyle = 'rgba(255,255,255,0.45)'; o.beginPath(); o.moveTo(-R * 0.22, -R * 0.95); o.lineTo(-R * 0.12, -R * 0.95); o.lineTo(-R * 0.14, R * 0.2); o.lineTo(-R * 0.2, R * 0.2); o.closePath(); o.fill();
}
ENGINES.ramadan = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, C = A.C, M = A.moon, i;
  var warmG = n4_rg(dk ? 'rgba(255,190,110,0.6)' : 'rgba(255,210,150,0.45)', [0.3, dk ? 0.28 : 0.18]), starG = n4_rg(dk ? 'rgba(255,240,200,0.6)' : 'rgba(255,255,255,0.5)'), moonG = n4_rg(dk ? 'rgba(255,240,190,0.5)' : 'rgba(255,255,240,0.6)', [0.4, 0.2]);
  var LCOL = [['rgba(255,110,90,0.55)', 'rgba(110,240,160,0.5)', 'rgba(130,170,255,0.55)', 'rgba(255,210,110,0.6)']][0].map(function (c) { return n4_rg(c, [0.4, 0.35]); });
  var SPR = [0, 1, 2, 3].map(function (k) { return [false, true].map(function (lit) { return n4_sprite(40, 76, 3, function (o) { o.translate(0, 2); n4_fanous(o, 16, lit, k); }); }); });
  var spark = new Path2D(n4_spark(0, 0, 1)), star5 = new Path2D(n4_star5(0, 0, 1, 0.45));
  var moonSpr = n4_sprite(M[2] * 2.6, M[2] * 2.6, 3, function (o) { var r = M[2], g = o.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, dk ? '#FFE6A0' : '#F6D9A4'); o.fillStyle = g; o.fill(new Path2D(n4_cres(0, 0, r, r * 0.45, -r * 0.25, r * 0.85))); if (!dk) { o.strokeStyle = 'rgba(200,150,80,0.35)'; o.lineWidth = 1; o.stroke(new Path2D(n4_cres(0, 0, r, r * 0.45, -r * 0.25, r * 0.85))); } });
  // lanterns on the strings, star lights between them
  var lan = [], lines = [], slights = [];
  A.lines.forEach(function (s, si) { var p = new Path2D(); n4_cat(s[0], s[1], s[2], s[3], s[4], 40).forEach(function (q, j) { if (j) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); lines.push(p);
    var len = s[2] - s[0], n = Math.max(3, Math.round(len / (ph ? 80 : 120))); for (var j = 0; j < n; j++) { var u = (j + 0.5) / n, q = n4_at(s[0], s[1], s[2], s[3], s[4], u); if (q[0] < -10 || q[0] > W + 10 || Math.abs(q[0] - M[0]) < M[2] * 1.7) continue; lan.push({x: q[0], y: q[1], len: (ph ? 10 : 16) + ((j * 5 + si * 3) % 4) * (ph ? 8 : 14), R: (ph ? 9 : 13) * (0.85 + ((j + si) % 3) * 0.15), k: (j + si * 2) % 4, ph: hash(j + si * 10) * 6.28}); }
    for (j = 0; j < n * 4; j++) { u = (j + 0.25) / (n * 4); if (j % 4 === 1) continue; q = n4_at(s[0], s[1], s[2], s[3], s[4], u); slights.push({x: q[0], y: q[1], ph: hash(j + 77 + si) * 6.28, c: j % 3}); } });
  var SL = A.starLine, sline = new Path2D(), sstars = []; n4_cat(SL[0], SL[1], SL[2], SL[3], SL[4], 40).forEach(function (q, j) { if (j) sline.lineTo(q[0], q[1]); else sline.moveTo(q[0], q[1]); });
  var nS = Math.round((SL[2] - SL[0]) / (ph ? 28 : 38)); for (i = 0; i < nS; i++) { var q = n4_at(SL[0], SL[1], SL[2], SL[3], SL[4], (i + 0.5) / nS); sstars.push({x: q[0], y: q[1] + (ph ? 7 : 10), d: 1.0 + i * (ph ? 0.12 : 0.07), ph: hash(i + 300) * 6.28}); }
  var wins = A.wins.map(function (w, j) { return {x: w.x, y: w.y, on: dk && hash(j + 5) < 0.45, d: 0.6 + (w.x / W) * (ph ? 2.2 : 3)}; }), roofs = A.roofs.map(function (r) { return {x: r.x, y: r.y, d: 0.5 + (r.x / W) * (ph ? 2.2 : 3)}; });
  var stars = A.stars.map(function (s, j) { return {x: s.x, y: s.y, r: s.r, ph: s.k * 6.28, sp: 0.6 + hash(j + 9) * 1.2}; });
  var FLn = A.floorLan, pat = []; for (i = 0; i < (ph ? 22 : 34); i++) { var a = hash(i + 400) * 6.28, d = 0.4 + hash(i + 401) * 0.6; pat.push({a: a, d: d, c: i % 4, s: 0.6 + hash(i + 402) * 0.6}); }
  var LC2 = ['#FF8A7A', '#7AF0A8', '#9AB8FF', '#FFD27A'];
  return {
    step: function () {},
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, mb = n4_env(T, 0, 0.8, 7, 10);
      // stars and the crescent
      ca.fillStyle = dk ? '#FFF4DA' : '#FFFFFF';
      stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * s.sp + s.ph); if (s.r > 1.3) { n4_dot(ca, starG, s.x, s.y, s.r * 5, a * (dk ? 0.6 : 0.3)); ca.save(); ca.translate(s.x, s.y); ca.scale(s.r * 2.2 * (0.6 + a * 0.4), s.r * 2.2 * (0.6 + a * 0.4)); ca.globalAlpha = dk ? 0.6 + a * 0.4 : 0.5; ca.fill(spark); ca.restore(); } else { ca.globalAlpha = (dk ? 0.45 : 0.3) + a * 0.5; ca.beginPath(); ca.arc(s.x, s.y, s.r, 0, 7); ca.fill(); } }); ca.globalAlpha = 1;
      var my = M[1] - mb * H * 0.02;
      n4_dot(ca, moonG, M[0], my, M[2] * (2.8 + 0.2 * Math.sin(tt * 0.6) + mb * 1.6), 0.8 + mb * 0.2);
      if (mb > 0) { ca.strokeStyle = 'rgba(255,240,200,' + (0.5 * mb * (1 - ((T * 0.4) % 1))) + ')'; ca.lineWidth = 2; ca.beginPath(); ca.arc(M[0], my, M[2] * (1.4 + ((T * 0.4) % 1) * 1.6), 0, 7); ca.stroke(); }
      var MS = moonSpr.w; ca.drawImage(moonSpr, M[0] - MS / 2, my - MS / 2, MS, MS);
      // windows and rooftop lamps across the city
      ca.save(); if (dk) ca.globalCompositeOperation = 'lighter';
      wins.forEach(function (w, j) { var L = Math.max(w.on ? 0.85 + 0.15 * flick(tt * 0.3, j) : 0, n4_env(T - w.d, 0, 0.3, 30, 32)); if (L <= 0) return; n4_dot(ca, warmG, w.x, w.y, ph ? 9 : 13, L * (dk ? 0.9 : 0.6)); ca.fillStyle = 'rgba(255,214,130,' + L + ')'; ca.beginPath(); ca.arc(w.x, w.y, ph ? 2 : 2.8, 0, 7); ca.fill(); });
      roofs.forEach(function (r, j) { var L = Math.max(dk ? 0.5 : 0, n4_env(T - r.d, 0, 0.3, 30, 32)); if (L <= 0) return; n4_dot(ca, warmG, r.x, r.y - 6, ph ? 14 : 20, L * 0.9); ca.fillStyle = LC2[j % 4]; ca.globalAlpha = L; ca.beginPath(); ca.arc(r.x, r.y - 6, ph ? 2.4 : 3.2, 0, 7); ca.fill(); ca.globalAlpha = 1; });
      ca.restore();
      // the floor lantern and the stars of light it throws across the terrace
      var fs = FLn.s, Lf = dk ? 1 : 0.5 + mb * 0.5;
      cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n4_dot(cb, warmG, FLn.x, FLn.y - 22 * fs, 60 * fs, (dk ? 0.6 : 0.3) * Lf);
      pat.forEach(function (p, j) { var rr = (ph ? 70 : 120) * p.d * (1 + 0.03 * Math.sin(tt * 1.3 + j)), x = FLn.x + Math.cos(p.a + Math.sin(tt * 0.4) * 0.03) * rr, y = FLn.y - 10 * fs + Math.sin(p.a) * rr * 0.32, s = (ph ? 3.6 : 5) * p.s; if (y < A.pt - 4) return; var al = (dk ? 0.6 : 0.45) * Lf * (0.7 + 0.3 * flick(tt * 0.6, j)); cb.globalAlpha = al; cb.save(); cb.translate(x, y); cb.scale(s, s * 0.7); cb.fillStyle = LC2[p.c]; cb.fill(star5); cb.restore(); }); cb.globalAlpha = 1; cb.restore();
      cb.save(); cb.translate(FLn.x, FLn.y - 21 * fs); cb.scale(fs, fs); cb.drawImage(SPR[0][0], -20, -38, 40, 76); cb.globalAlpha = Lf; cb.drawImage(SPR[0][1], -20, -38, 40, 76); cb.restore(); cb.globalAlpha = 1;
      // strings, star lights and hanging lanterns
      cb.strokeStyle = dk ? 'rgba(220,200,150,0.45)' : 'rgba(120,80,40,0.55)'; cb.lineWidth = 1; lines.forEach(function (p) { cb.stroke(p); }); cb.stroke(sline);
      slights.forEach(function (s, j) { var a = 0.55 + 0.45 * Math.sin(tt * 2 + s.ph); if (dk) n4_dot(cb, starG, s.x, s.y + 3, 7, a * 0.7); cb.fillStyle = dk ? ['#FFE7A0', '#FFFFFF', '#FFD27A'][s.c] : ['#E2B04A', '#F2C86A', '#D9A43A'][s.c]; cb.save(); cb.translate(s.x, s.y + 3); cb.scale(ph ? 3 : 4, ph ? 3 : 4); cb.fill(star5); cb.restore(); });
      sstars.forEach(function (s) { var on = n4_env(T - s.d, 0, 0.12, 14, 16), base = dk ? 0.25 : 0, L = Math.max(base, on * (0.75 + 0.25 * Math.sin(tt * 3 + s.ph))), sz = ph ? 4.2 : 5.6;
        cb.strokeStyle = dk ? 'rgba(220,200,150,0.4)' : 'rgba(120,80,40,0.45)'; cb.beginPath(); cb.moveTo(s.x, s.y - (ph ? 7 : 10)); cb.lineTo(s.x, s.y - sz); cb.stroke();
        if (L > 0.05) n4_dot(cb, starG, s.x, s.y, sz * 4, L * (dk ? 1 : 0.8)); cb.fillStyle = L > 0.3 ? '#FFF6D0' : (dk ? '#8A7A5A' : '#D9A43A'); cb.save(); cb.translate(s.x, s.y); cb.rotate(Math.sin(tt * 1.2 + s.ph) * 0.15); cb.scale(sz, sz); cb.fill(star5); cb.restore();
        if (on > 0.5 && on < 1 && T - s.d < 0.5) { cb.save(); cb.translate(s.x, s.y); cb.scale(sz * 2.4, sz * 2.4); cb.fillStyle = 'rgba(255,255,255,' + (1 - (T - s.d) * 2) + ')'; cb.fill(spark); cb.restore(); } });
      lan.forEach(function (l, j) { var sw = (Math.sin(tt * 0.8 + l.ph) * 0.07 + Math.sin(tt * 0.31 + l.ph * 2) * 0.04) * f.a, L = Math.max(dk ? 1 : 0, n4_env(T - 0.4 - (l.x / W) * 1.6, 0, 0.3, 8, 10)), cyy = l.len + l.R * 2.2, x = l.x + Math.sin(sw) * cyy, y = l.y + Math.cos(sw) * cyy;
        if (L > 0.01) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n4_dot(cb, LCOL[l.k], x, y, l.R * 3.4, (dk ? 0.8 : 0.5) * L); n4_dot(cb, warmG, x, y, l.R * 2.2, (dk ? 0.6 : 0.4) * L); cb.restore(); }
        cb.strokeStyle = dk ? 'rgba(220,200,150,0.55)' : 'rgba(120,80,40,0.6)'; cb.beginPath(); cb.moveTo(l.x, l.y); cb.lineTo(l.x + Math.sin(sw) * l.len, l.y + Math.cos(sw) * l.len); cb.stroke();
        cb.save(); cb.translate(x, y); cb.rotate(-sw); var sc = l.R / 16; cb.scale(sc, sc); cb.drawImage(SPR[l.k][0], -20, -40, 40, 76); if (L > 0.01) { cb.globalAlpha = L; cb.drawImage(SPR[l.k][1], -20, -40, 40, 76); } cb.restore(); cb.globalAlpha = 1; });
    },
    finish: function (t) { T0 = t; }
  };
};
UIC.ramadan = {L: ['#2E7C7A', '#1E5654', 'rgba(255,253,247,0.86)', '#2A2418', '#6E6250', '#2A7A78', '#2A7A78', '#C99A2E', '#FFFFFF'], D: ['#252C66', '#121638', 'rgba(20,24,58,0.8)', '#F2F0FA', '#B4B2D2', '#F2C45A', '#F2C45A', '#F6D892', '#14183A']};

// ---------- Mid-Autumn Festival
// Loop: lotus lanterns drift downstream with their reflections, osmanthus blossoms fall, clouds slide across the moon
// and the pavilion's bells and red lanterns sway. Moment: the jade rabbit appears on the moon and pounds its mortar,
// and a cluster of lanterns rises off the river into the sky.
function n4_lotus(o, s, lit) {
  var P = [['#FFD0DC', '#F27AA0'], ['#FFE2EA', '#F69AB6']];
  o.save(); o.scale(s, s);
  o.fillStyle = '#5EA070'; o.beginPath(); o.ellipse(0, 2, 15, 3.6, 0, 0, 7); o.fill();
  [-1, 1].forEach(function (d) { for (var k = 2; k >= 0; k--) { var g = o.createLinearGradient(0, -12, 0, 2); g.addColorStop(0, P[k % 2][0]); g.addColorStop(1, P[k % 2][1]); o.fillStyle = g; o.save(); o.translate(d * (3 + k * 3.4), 1); o.rotate(d * (0.35 + k * 0.32)); o.beginPath(); o.moveTo(0, 0); o.quadraticCurveTo(-4.6, -6, 0, -12); o.quadraticCurveTo(4.6, -6, 0, 0); o.fill(); o.restore(); } });
  var g2 = o.createLinearGradient(0, -14, 0, 1); g2.addColorStop(0, '#FFF0F4'); g2.addColorStop(1, '#F48AAA'); o.fillStyle = g2; o.beginPath(); o.moveTo(0, 1); o.quadraticCurveTo(-5.4, -7, 0, -14); o.quadraticCurveTo(5.4, -7, 0, 1); o.fill();
  o.fillStyle = '#FFF4DC'; o.fillRect(-1.6, -11, 3.2, 5); o.restore(); }
function n4_rabbit(c, x, y, r, t, a, ink) {
  // the jade rabbit, kneeling and pounding a mortar, as a soft shape on the moon
  var up = Math.max(0, Math.sin(t * 6)); c.save(); c.translate(x, y); c.scale(r / 40, r / 40); c.globalAlpha = a; c.fillStyle = ink;
  c.beginPath(); c.ellipse(-8, 8, 13, 11, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-2, -6, 8, 7, 0.2, 0, 7); c.fill();
  c.beginPath(); c.ellipse(-6, -19, 2.6, 9, -0.25, 0, 7); c.ellipse(-1, -19, 2.4, 8.4, 0.15, 0, 7); c.fill();
  c.beginPath(); c.arc(-20, 12, 3.4, 0, 7); c.fill();
  c.beginPath(); c.moveTo(11, 10); c.lineTo(23, 10); c.lineTo(20, 22); c.lineTo(14, 22); c.closePath(); c.fill(); c.fillRect(12, 8, 10, 2.4);
  c.save(); c.translate(4, 0); c.rotate(-0.5 + up * -0.5); c.fillRect(0, -1.4, 18, 2.8); c.fillRect(14, -3.2, 6, 6.4); c.restore();
  c.globalAlpha = a * 0.9; c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(1.6, -7, 1.3, 0, 7); c.fill(); c.restore(); }
ENGINES.midautumn = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, M = A.moon, C = A.C, i;
  var glowG = n4_rg(dk ? 'rgba(255,236,180,0.5)' : 'rgba(255,250,236,0.65)', [0.35, 0.25]), lanG = n4_rg(dk ? 'rgba(255,170,90,0.7)' : 'rgba(255,190,120,0.5)', [0.3, 0.3]), redG = n4_rg(dk ? 'rgba(255,90,60,0.55)' : 'rgba(255,120,80,0.35)', [0.3, 0.3]);
  var moonSpr = n4_sprite(M[2] * 2.2, M[2] * 2.2, 2, function (o) { var r = M[2], g = o.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFFF4'); g.addColorStop(0.7, dk ? '#FFF0C0' : '#FFF6E2'); g.addColorStop(1, dk ? '#F6D890' : '#F8E2BE'); o.fillStyle = g; o.beginPath(); o.arc(0, 0, r, 0, 7); o.fill();
    o.fillStyle = dk ? 'rgba(210,180,120,0.22)' : 'rgba(220,190,150,0.2)'; [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.18], [0.1, -0.45, 0.12], [-0.2, 0.45, 0.14], [0.5, -0.15, 0.09]].forEach(function (q) { o.beginPath(); o.arc(q[0] * r, q[1] * r, q[2] * r, 0, 7); o.fill(); }); });
  var CLD = n4_sprite(220, 50, 1.5, function (o) { o.fillStyle = dk ? 'rgba(130,140,200,0.8)' : 'rgba(255,255,255,0.92)'; [[-70, 6, 40, 11], [-20, -2, 52, 16], [40, 4, 46, 12], [85, 9, 24, 7], [0, 10, 90, 8]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); }); o.fillStyle = dk ? 'rgba(255,236,190,0.35)' : 'rgba(255,240,215,0.6)'; o.beginPath(); o.ellipse(-20, -9, 40, 5, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (k) { return {x: hash(k + 3) * W, y: M[1] + (k - 1) * M[2] * 0.6 + M[2] * 0.2, s: (ph ? 0.7 : 1.1) * (0.8 + hash(k + 7) * 0.4), v: 7 + hash(k + 5) * 6}; });
  var ry0 = A.ry0, by = A.by, lotus = [], blossoms = [], rising = [];
  for (i = 0; i < (ph ? 4 : 7); i++) { var u = hash(i + 40); lotus.push({x: hash(i + 41) * W, y: ry0 + (by - ry0) * (0.35 + u * 0.6), v: 8 + hash(i + 42) * 8, ph: hash(i + 43) * 6.28}); }
  var LS = n4_sprite(36, 22, 3, function (o) { o.translate(0, 5); n4_lotus(o, 1, true); });
  for (i = 0; i < (ph ? 10 : 18); i++) blossoms.push({x: hash(i + 60) * W, y: hash(i + 61) * H, vy: 10 + hash(i + 62) * 10, ph: hash(i + 63) * 6.28, s: (ph ? 1.6 : 2.2) * (0.8 + hash(i + 64) * 0.4)});
  var RL = n4_sprite(30, 36, 3, function (o) { var g = o.createRadialGradient(-3, -4, 1, 0, 0, 13); g.addColorStop(0, '#FFE2A0'); g.addColorStop(0.5, '#FF8A50'); g.addColorStop(1, '#D8402E'); o.fillStyle = g; o.beginPath(); o.ellipse(0, 0, 12, 11, 0, 0, 7); o.fill(); o.strokeStyle = 'rgba(140,30,20,0.35)'; o.lineWidth = 0.8; for (var k = -2; k <= 2; k++) { o.beginPath(); o.ellipse(0, 0, Math.abs(k) * 3 + 0.5, 11, 0, 0, 7); o.stroke(); } o.fillStyle = '#E8B04A'; o.fillRect(-5, -13, 10, 3); o.fillRect(-5, 10, 10, 3); o.strokeStyle = '#E8B04A'; o.lineWidth = 1; o.beginPath(); o.moveTo(0, 13); o.lineTo(0, 17); o.stroke(); });
  return {
    step: function (dt, t, f) {
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 180) c.x = -180; });
      lotus.forEach(function (l) { l.x += l.v * dt * f.s; if (l.x > W + 40) { l.x = -40; } });
      blossoms.forEach(function (b) { b.y += b.vy * dt * f.s; b.x += (Math.sin(t * 0.7 + b.ph) * 10 + 5) * dt * f.a; if (b.y > H + 6) { b.y = -6; b.x = Math.random() * W; } if (b.x > W + 6) b.x = -6; });
      rising = rising.filter(function (r) { return t - r.t0 < r.life; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, rab = n4_env(T, 0.2, 1.4, 12, 14);
      // the moon, its glow and the jade rabbit
      n4_dot(ca, glowG, M[0], M[1], M[2] * (2.3 + 0.1 * Math.sin(tt * 0.5) + rab * 0.4), 0.9);
      var S = moonSpr.w; ca.drawImage(moonSpr, M[0] - S / 2, M[1] - S / 2, S, S);
      if (rab > 0) n4_rabbit(ca, M[0] + M[2] * 0.02, M[1] + M[2] * 0.1, M[2] * 0.9, T, rab * 0.55, dk ? '#B89A5A' : '#D2B086');
      clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 110 * c.s, c.y - 25 * c.s, 220 * c.s, 50 * c.s); });
      // the moon's path on the water
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; for (i = 0; i < (ph ? 12 : 16); i++) { var yy = ry0 + 6 + i * (by - ry0 - 10) / (ph ? 12 : 16), w = M[2] * (0.5 + i * 0.05) * (0.7 + 0.3 * Math.sin(tt * 1.3 + i * 1.7)), xx = M[0] + Math.sin(tt * 0.8 + i) * 6; ca.fillStyle = dk ? 'rgba(255,236,180,' + (0.28 - i * 0.01) + ')' : 'rgba(255,255,250,' + (0.6 - i * 0.02) + ')'; ca.fillRect(xx - w / 2, yy, w, 2.4); } ca.restore();
      // lotus lanterns and their reflections
      lotus.forEach(function (l, j) { var k = (l.y - ry0) / (by - ry0), s = (ph ? 0.75 : 1) * (0.7 + k * 0.6), y = l.y + Math.sin(tt * 1.2 + l.ph) * 1.2;
        ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n4_dot(ca, lanG, l.x, y - 8 * s, 26 * s, dk ? 0.75 : 0.35); ca.globalAlpha = dk ? 0.3 : 0.2; ca.drawImage(LS, l.x - 18 * s, y + 4 * s, 36 * s, -22 * s); ca.restore();
        ca.drawImage(LS, l.x - 18 * s, y - 16 * s, 36 * s, 22 * s);
        var fk = flick(tt * 1.3, j), fh = 6 * s * (0.8 + 0.2 * fk); ca.fillStyle = '#FFB040'; ca.beginPath(); ca.moveTo(l.x, y - 13 * s - fh); ca.quadraticCurveTo(l.x + 2.4 * s, y - 13 * s - fh * 0.3, l.x, y - 12 * s); ca.quadraticCurveTo(l.x - 2.4 * s, y - 13 * s - fh * 0.3, l.x, y - 13 * s - fh); ca.fill(); });
      // the pavilion's red lanterns and bells
      var rs = A.rs;
      A.plan.forEach(function (p, j) { var sw = Math.sin(tt * 1 + j * 2) * 0.08 * f.a, L = 14 * rs, x = p[0] + Math.sin(sw) * L, y = p[1] + Math.cos(sw) * L; cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n4_dot(cb, redG, x, y, 30 * rs, dk ? 0.9 : 0.5); cb.restore(); cb.strokeStyle = '#3A2A2A'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(p[0], p[1]); cb.lineTo(x, y - 10 * rs); cb.stroke(); cb.drawImage(RL, x - 15 * rs * 0.9, y - 18 * rs * 0.9, 30 * rs * 0.9, 36 * rs * 0.9); });
      A.bells.forEach(function (b, j) { var sw = (Math.sin(tt * 2.2 + j * 1.7) * 0.25 + Math.sin(tt * 0.7 + j) * 0.1) * f.a, s = rs * (ph ? 1.2 : 1); cb.save(); cb.translate(b[0], b[1]); cb.rotate(sw); cb.strokeStyle = '#4A3A2A'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(0, 0); cb.lineTo(0, 6 * s); cb.stroke(); var g = cb.createLinearGradient(-5 * s, 0, 5 * s, 0); g.addColorStop(0, '#B8862E'); g.addColorStop(0.5, '#F2C86A'); g.addColorStop(1, '#A8761E'); cb.fillStyle = g; cb.beginPath(); cb.moveTo(-2.4 * s, 6 * s); cb.quadraticCurveTo(-3 * s, 12 * s, -5 * s, 14 * s); cb.lineTo(5 * s, 14 * s); cb.quadraticCurveTo(3 * s, 12 * s, 2.4 * s, 6 * s); cb.closePath(); cb.fill(); cb.fillStyle = '#8A5A1E'; cb.beginPath(); cb.arc(Math.sin(sw * 3) * 2 * s, 15 * s, 1.4 * s, 0, 7); cb.fill(); cb.fillStyle = '#C8402E'; cb.fillRect(-1 * s, 15 * s, 2 * s, 6 * s); cb.restore(); });
      // osmanthus blossoms drifting down
      blossoms.forEach(function (b) { cb.save(); cb.translate(b.x, b.y); cb.rotate(tt + b.ph); cb.fillStyle = dk ? '#F2B83A' : '#F6B02A'; for (var q = 0; q < 4; q++) { cb.rotate(Math.PI / 2); cb.beginPath(); cb.ellipse(b.s * 0.8, 0, b.s * 0.75, b.s * 0.5, 0, 0, 7); cb.fill(); } cb.fillStyle = '#FFE9A0'; cb.beginPath(); cb.arc(0, 0, b.s * 0.4, 0, 7); cb.fill(); cb.restore(); });
      // lanterns rising off the river into the sky
      rising.forEach(function (r) { var u = (t - r.t0) / r.life; if (u < 0) return; var e = 1 - Math.pow(1 - u, 1.5), x = r.x + Math.sin(u * 6 + r.ph) * 14 + r.dx * e, y = r.y - (r.y - r.y1) * e, s = r.s * (1 - u * 0.45), al = Math.min(1, u * 10, (1 - u) * 4);
        cb.save(); cb.globalCompositeOperation = 'lighter'; n4_dot(cb, lanG, x, y, 36 * s, al * (dk ? 0.9 : 0.6)); cb.restore(); cb.globalAlpha = al; cb.drawImage(RL, x - 15 * s, y - 18 * s, 30 * s, 36 * s); cb.globalAlpha = 1; });
    },
    finish: function (t) { T0 = t; for (var k = 0; k < (ph ? 6 : 10); k++) { var l = lotus[k % lotus.length]; rising.push({x: (k < lotus.length ? l.x : W * (0.2 + Math.random() * 0.7)), y: ry0 + (by - ry0) * (0.4 + Math.random() * 0.5), y1: H * (0.04 + Math.random() * 0.25), dx: (Math.random() - 0.5) * W * 0.2, t0: t + 1.0 + k * 0.28, life: 8 + Math.random() * 3, ph: Math.random() * 6.28, s: (ph ? 0.9 : 1.3) * (0.8 + Math.random() * 0.4)}); } }
  };
};
UIC.midautumn = {L: ['#B8463A', '#7E2C2A', 'rgba(255,252,246,0.86)', '#2E2420', '#6E5E52', '#B8402E', '#B8402E', '#D99A2E', '#FFFFFF'], D: ['#2E3466', '#161A3A', 'rgba(22,26,58,0.8)', '#F4F0FA', '#B8B4D4', '#F2C46A', '#F2C46A', '#F6D892', '#161A3A']};
