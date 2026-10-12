// ---- world theme engine: thailand
function thailand_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function thailand_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return thailand_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - thailand_ease((T - c) / (d - c)); }
var thailand_gc = null;
function thailand_ctx() { return thailand_gc || (thailand_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with thailand_dot)
function thailand_rg(col, mid) { var g = thailand_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function thailand_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function thailand_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function thailand_spark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }

// ---------- Thailand
// Loop: the turquoise bay shimmers and small waves lap the sand, the longtail boats rock with their garlands fluttering,
// the palms sway, a hornbill flies between the islands, the temple bells swing on the eaves and sunlight glints on the
// chedi. Night: the temple is lit gold, candle krathong float across the bay and the breaking waves glow blue.
// Moment: lotus flowers bloom across the water, the chedi flashes in a sunburst, the bells ring and a longtail boat
// zooms across the bay leaving a curling white wake.
// a palm frond: a curved rib with leaflets, pointing along +x, length L, drooping by d
function thailand_frond(L, d) { var rib = [], i, out = new Path2D(); for (i = 0; i <= 12; i++) { var u = i / 12, a = d * u * u; rib.push([Math.cos(a) * L * u, Math.sin(a) * L * u + d * 0.25 * L * u * u]); }
  for (i = 1; i < rib.length; i++) { var p = rib[i - 1], q = rib[i], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, u2 = i / 12, w = L * 0.17 * Math.sin(Math.PI * Math.min(1, u2 * 1.08)) + 1.2;
    out.moveTo(p[0], p[1]); out.lineTo(q[0] - dy / dl * w * 0.25 + dx * 0.5, q[1] + dx / dl * w * 0.25 + dy * 0.5 + w); out.lineTo(q[0], q[1]); out.closePath();
    out.moveTo(p[0], p[1]); out.lineTo(q[0] + dy / dl * w * 0.25 + dx * 0.5, q[1] - dx / dl * w * 0.25 + dy * 0.5 - w * 0.55); out.lineTo(q[0], q[1]); out.closePath(); }
  out.moveTo(0, -1.2); rib.forEach(function (p) { out.lineTo(p[0], p[1] - 1); }); for (i = rib.length - 1; i >= 0; i--) out.lineTo(rib[i][0], rib[i][1] + 1); out.closePath(); return out; }
// a longtail boat side-on, bow to +x, waterline at y = 0 (about 190 units from the propeller to the prow at scale 1).
// k picks its paint; t drives the fluttering garland ribbons; speed > 0 lifts the bow and sprays at the stern.
function thailand_boat(c, k, t, dk, speed) {
  var P = [['#2E86C8', '#F2C84A', '#E8487A'], ['#D84A32', '#2EA86A', '#F2C84A'], ['#2EA86A', '#F2C84A', '#E86AA8'], ['#E8962E', '#2E86C8', '#FFFFFF']][k % 4];
  var wood = dk ? '#5A3E40' : '#8E5C3A', woodD = dk ? '#3A2830' : '#6A4026', ink = dk ? '#1E1424' : '#3A2418';
  // the long-tail: engine on its pivot at the stern, a long shaft reaching back into the water, the propeller's splash
  c.strokeStyle = ink; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-64, -20); c.lineTo(-122, speed ? 2 : 6); c.stroke();
  c.fillStyle = dk ? '#5A6078' : '#7A8494'; c.fillRect(-74, -32, 18, 13); c.fillStyle = dk ? '#3A3E52' : '#4E5664'; c.fillRect(-74, -24, 18, 4); c.fillRect(-66, -38, 4, 7);
  c.fillStyle = dk ? '#C8C0D0' : '#D8D8D0'; c.beginPath(); c.arc(-60, -26, 2.6, 0, 7); c.fill();
  c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-58, -30); c.lineTo(-44, -36); c.stroke();
  // hull: a long low body that sweeps up into a tall thin prow
  c.fillStyle = wood; c.beginPath(); c.moveTo(-76, -16); c.lineTo(40, -14); c.quadraticCurveTo(66, -18, 78, -50); c.lineTo(84, -66); c.lineTo(88, -64); c.quadraticCurveTo(82, -30, 62, -4); c.quadraticCurveTo(50, 8, 30, 8); c.lineTo(-60, 8); c.quadraticCurveTo(-74, 6, -76, -16); c.closePath(); c.fill();
  c.fillStyle = woodD; c.beginPath(); c.moveTo(-74, -2); c.lineTo(52, 0); c.quadraticCurveTo(46, 8, 30, 8); c.lineTo(-60, 8); c.quadraticCurveTo(-72, 6, -74, -2); c.closePath(); c.fill();
  // painted bands under the gunwale, following the sweep of the prow
  c.lineCap = 'butt'; [[P[0], -12, 3.4], [P[1], -8, 2.2]].forEach(function (b) { c.strokeStyle = b[0]; c.lineWidth = b[2]; c.beginPath(); c.moveTo(-74, b[1] - 2); c.lineTo(40, b[1]); c.quadraticCurveTo(62 - b[1] * 0.4, b[1] - 4, 74 + b[1] * 0.1, -46 - b[1] * 0.4); c.stroke(); });
  c.lineCap = 'round';
  // benches showing over the gunwale, a striped canopy on two posts
  c.fillStyle = woodD; [-46, -16, 14].forEach(function (x) { c.fillRect(x, -19, 12, 4); });
  c.strokeStyle = ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-34, -16); c.lineTo(-34, -42); c.moveTo(18, -15); c.lineTo(18, -42); c.stroke();
  for (var s = 0; s < 6; s++) { c.fillStyle = s % 2 ? P[2] : (dk ? '#D8D0E0' : '#FFFFFF'); c.fillRect(-42 + s * 11, -48, 11, 6); c.beginPath(); c.arc(-36.5 + s * 11, -42, 5.5, 0, Math.PI); c.fill(); }
  // garlands at the prow: a loop of jasmine and marigold, and ribbons of cloth fluttering in the breeze
  var px = 85, py = -64, sw = Math.sin(t * 1.7) * 0.15;
  c.save(); c.translate(px, py); c.rotate(sw);
  for (var r = 0; r < 4; r++) { var col = [P[2], '#FFE070', '#7AD07A', '#FFFFFF'][r]; c.fillStyle = col; c.beginPath(); c.moveTo(-1, 0);
    var pts = []; for (var j = 0; j <= 8; j++) { var u = j / 8, wv = Math.sin(t * (5 + r) - u * 6 + r) * (2 + u * 5) * (speed ? 2 : 1); pts.push([-u * (speed ? 30 : 10) - r * 2 + wv * (speed ? 0.3 : 1), u * (speed ? 6 : 24 + r * 3) + (speed ? wv : 0)]); }
    pts.forEach(function (p) { c.lineTo(p[0] - 1.6, p[1]); }); for (j = pts.length - 1; j >= 0; j--) c.lineTo(pts[j][0] + 1.6, pts[j][1] + 1); c.closePath(); c.fill(); }
  for (j = 0; j < 9; j++) { var a = Math.PI * (0.15 + j / 8 * 0.7), gx = -8 + Math.cos(a) * 9, gy = 4 + Math.sin(a) * 12; c.fillStyle = j % 3 === 1 ? '#FF8A2A' : '#FFFFF4'; c.beginPath(); c.arc(gx, gy, 2.4, 0, 7); c.fill(); }
  c.fillStyle = '#E84A6A'; c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill();
  c.restore();
  if (dk) { c.fillStyle = 'rgba(255,220,150,0.18)'; c.fillRect(-42, -42, 66, 26); }
}
// an Oriental pied hornbill in flight, facing -x (left); w is the wing stroke from -1 (down) to 1 (up)
function thailand_hornbill(c, w, dk) {
  var blk = dk ? '#141020' : '#1E1A22', wht = dk ? '#C8C4D8' : '#FFFFFF', yel = '#F4C430', org = '#E88A2A';
  // far wing (a little behind and smaller)
  c.fillStyle = dk ? '#100C18' : '#141018'; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(0, -8 - w * 12, 4, -10 - w * 20); c.quadraticCurveTo(14, -8 - w * 14, 16, -1); c.closePath(); c.fill();
  // tail: long, black with white tips
  c.fillStyle = blk; c.beginPath(); c.moveTo(14, -3); c.lineTo(44, -6); c.lineTo(46, 3); c.lineTo(14, 4); c.closePath(); c.fill();
  c.fillStyle = wht; c.fillRect(38, -6.2, 8, 9);
  // body, white belly
  c.fillStyle = blk; c.beginPath(); c.ellipse(4, 0, 15, 6.5, -0.05, 0, 7); c.fill();
  c.fillStyle = wht; c.beginPath(); c.ellipse(8, 3.2, 8, 3, 0, 0, 7); c.fill();
  // head and the great yellow bill with its casque
  c.fillStyle = blk; c.beginPath(); c.arc(-11, -2, 5.4, 0, 7); c.fill();
  c.fillStyle = yel; c.beginPath(); c.moveTo(-14, -4.5); c.quadraticCurveTo(-24, -6, -30, 2); c.quadraticCurveTo(-22, -0.5, -14, 1); c.closePath(); c.fill();
  c.fillStyle = org; c.beginPath(); c.moveTo(-13, -5); c.quadraticCurveTo(-18, -11, -26, -5.5); c.quadraticCurveTo(-20, -6.4, -14, -3.5); c.closePath(); c.fill();
  c.fillStyle = wht; c.beginPath(); c.arc(-12, -3, 1.6, 0, 7); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(-12.2, -3, 0.8, 0, 7); c.fill();
  // near wing: broad and fingered, black with a white trailing edge; it sweeps from well above the back to below the belly
  var tx = -4 + Math.abs(w) * 2, ty = -4 - w * 28;
  c.fillStyle = blk; c.beginPath(); c.moveTo(-7, -1); c.quadraticCurveTo(-8, ty * 0.5, tx - 3, ty); c.lineTo(tx + 3, ty - w * 2); c.lineTo(tx + 8, ty + w * 1); c.lineTo(tx + 13, ty + w * 3); c.quadraticCurveTo(20, (ty - 2) * 0.45, 13, 1); c.closePath(); c.fill();
  c.strokeStyle = wht; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx + 12, ty + w * 4); c.quadraticCurveTo(18.5, (ty - 2) * 0.45, 12, 0); c.stroke();
}
// a krathong: a round float of folded banana leaf, flowers, a candle and three incense sticks (the flame is drawn live)
function thailand_krathongArt(o) {
  o.fillStyle = '#2E6A3A'; o.beginPath(); o.ellipse(0, 6, 17, 5, 0, 0, 7); o.fill();
  for (var i = 0; i < 9; i++) { var x = -15 + i * 3.75; o.fillStyle = i % 2 ? '#4E9A4A' : '#3E8A3E'; o.beginPath(); o.moveTo(x - 3.4, 6); o.lineTo(x, -4 - (i % 2) * 2); o.lineTo(x + 3.4, 6); o.closePath(); o.fill(); }
  [[-9, -3, '#FF9A2A'], [9, -3, '#FF9A2A'], [-4, -6, '#FFFFFF'], [4, -6, '#F27AAE'], [0, -3, '#FFD24A']].forEach(function (f) { o.fillStyle = f[2]; for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; o.beginPath(); o.arc(f[0] + Math.cos(a) * 1.8, f[1] + Math.sin(a) * 1.4, 1.6, 0, 7); o.fill(); } });
  o.fillStyle = '#FFF4D8'; o.fillRect(-1.6, -15, 3.2, 10);
  o.strokeStyle = '#8A4A2A'; o.lineWidth = 0.8; o.beginPath(); o.moveTo(5, -4); o.lineTo(7, -16); o.moveTo(6.5, -4); o.lineTo(9.5, -15); o.moveTo(3.5, -4); o.lineTo(4.5, -16.5); o.stroke();
  o.fillStyle = '#FF5A3A'; [[7, -16], [9.5, -15], [4.5, -16.5]].forEach(function (p) { o.beginPath(); o.arc(p[0], p[1], 0.9, 0, 7); o.fill(); });
}
// a lotus blossom opening (u from 0 = bud to 1 = open) on its pad
function thailand_lotus(c, x, y, s, u, dk) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = dk ? '#2E6A4E' : '#4EA05A'; c.beginPath(); c.ellipse(4, 3, 16, 5, 0, 0.35, Math.PI * 2 - 0.1); c.lineTo(4, 3); c.closePath(); c.fill();
  c.fillStyle = dk ? '#3A7A5A' : '#6ABA6A'; c.beginPath(); c.ellipse(3, 2, 10, 3, 0, 0, 7); c.fill();
  var P1 = dk ? ['#FFD8E8', '#E86AA0'] : ['#FFE4EE', '#F06A9E'], P2 = dk ? ['#FFC0D8', '#D8508A'] : ['#FFD0E0', '#E0508A'];
  [[7, 1, P2, 0.9], [5, 0.75, P1, 0.55]].forEach(function (ring) { for (var i = 0; i < ring[0]; i++) { var a = (i / (ring[0] - 1) - 0.5) * Math.PI * (0.25 + 0.75 * u) * ring[1] * 1.3; c.save(); c.translate(0, 0); c.rotate(a);
      var g = c.createLinearGradient(0, -14, 0, 0); g.addColorStop(0, ring[2][0]); g.addColorStop(1, ring[2][1]); c.fillStyle = g; var h = 13 * ring[3] + 2;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-5.4 * ring[1], -h * 0.5, 0, -h); c.quadraticCurveTo(5.4 * ring[1], -h * 0.5, 0, 0); c.fill(); c.restore(); } });
  if (u > 0.5) { c.fillStyle = '#FFD24A'; c.globalAlpha = (u - 0.5) * 2; c.beginPath(); c.ellipse(0, -4, 3.2, 1.8, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
  c.restore();
}
ENGINES.thailand = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, hz = A.hz, T0 = -99, i, shore = A.shore;
  var yShore = function (x) { for (var j = 1; j < shore.length; j++) if (shore[j][0] >= x) { var a = shore[j - 1], b = shore[j], f = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, f)); } return shore[shore.length - 1][1]; };
  var sunG = thailand_rg(dk ? 'rgba(200,210,255,0.45)' : 'rgba(255,250,215,0.85)', [0.25, 0.4]), goldG = thailand_rg(dk ? 'rgba(255,190,90,0.6)' : 'rgba(255,220,130,0.5)', [0.35, 0.3]), hotG = thailand_rg('rgba(255,244,200,0.95)', [0.2, 0.55]), flameG = thailand_rg('rgba(255,170,80,0.7)', [0.3, 0.3]), bioG = thailand_rg('rgba(90,230,255,0.75)', [0.3, 0.35]), foamG = thailand_rg('rgba(255,255,255,0.9)', [0.4, 0.5]);
  // the bay without the headland: things on the water pass behind it
  var bay = new Path2D(); bay.rect(-60, -60, W + 120, H + 120); var hd = new Path2D(); A.head.forEach(function (p, j) { if (j) hd.lineTo(p[0], p[1]); else hd.moveTo(p[0], p[1]); }); hd.closePath(); bay.addPath(hd);
  var sh0 = yShore(W * 0.6);
  var waterY = function (f, x) { return hz + (yShore(x) - hz) * f; };
  // glints scattered over the water, and the column of glitter under the sun
  var glints = []; for (i = 0; i < (ph ? 26 : 54); i++) { var gx = hash(i + 3) * W, gf = Math.pow(hash(i + 7), 0.8) * 0.9 + 0.04; glints.push({x: gx, f: gf, ph: hash(i + 11) * 6.28, sp: 0.6 + hash(i + 13) * 1.4}); }
  var boats = A.boats.map(function (q, j) { var x = W * q[0], y = q[1] < 0 ? yShore(x) + q[1] * H : waterY(q[1], x); return {x: x, y: y, s: q[2] * S * (ph ? 1.4 : 1), k: q[3], dir: q[4], ph: j * 1.9, moored: q[1] < 0}; });
  var crowns = A.crowns, frond = {}; function frondP(L) { var k = Math.round(L); return frond[k] || (frond[k] = thailand_frond(k, 0.95)); }
  var KR = thailand_sprite(40, 30, 3, function (o) { o.translate(0, 4); thailand_krathongArt(o); });
  var krath = []; if (dk) for (i = 0; i < (ph ? 3 : 6); i++) krath.push({x: hash(i + 21) * W, f: 0.22 + hash(i + 22) * 0.6, v: 5 + hash(i + 23) * 5, ph: hash(i + 24) * 6.28});
  var bird = {t0: 3, dur: ph ? 13 : 18}, lotus = [], wake = [], zoom = null, lastW = 0;
  var ch = A.chedi, cc = [ch[0], ch[1] - 58 * ch[2]], ts = ch[2];
  // places on the open water for the finish moment's lotus flowers
  var spots = []; for (i = 0; i < 80 && spots.length < (ph ? 9 : 18); i++) { var lx = W * (0.03 + hash(i + 140) * 0.94), lf = 0.3 + hash(i + 141) * 0.62, ly = waterY(lf, lx);
    if (ly > A.py - H * 0.14 && lx < A.hx2 + 20) continue; if (boats.some(function (b) { return Math.abs(lx - b.x) < 135 * b.s && ly > b.y - 80 * b.s && ly < b.y + 26 * b.s; })) continue; if (spots.some(function (p) { return Math.hypot(p[0] - lx, p[1] - ly) < (ph ? 36 : 60); })) continue; spots.push([lx, ly, (ph ? 0.75 : 1.05) * S * (0.6 + lf * 0.6)]); }
  return {
    step: function (dt, t, f) {
      krath.forEach(function (k) { k.x += k.v * dt * f.s; if (k.x > W + 30) k.x = -30; });
      if (t - bird.t0 > bird.dur + 12) bird.t0 = t;
      if (zoom) { var u = (t - zoom.t0) / zoom.dur; if (u > 0 && u < 1 && t - lastW > 0.04) { lastW = t; var p = zoom.at(u); wake.push({x: p[0] - 70 * p[2] * 0.95, y: p[1] + 4 * p[2], t0: t, s: p[2]}); } if (u > 1.1) zoom = null; }
      wake = wake.filter(function (w) { return t - w.t0 < 4.5; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, j;
      // the sun (a full moon at night) with its glow, and the glitter path beneath it on the water
      var M = A.sun; ca.save(); if (dk) ca.globalCompositeOperation = 'lighter'; thailand_dot(ca, sunG, M[0], M[1], M[2] * (3.2 + 0.15 * Math.sin(tt * 0.6)), dk ? 0.6 : 0.85); ca.restore();
      ca.fillStyle = dk ? '#FFF6D8' : '#FFFBEA'; ca.beginPath(); ca.arc(M[0], M[1], M[2], 0, 7); ca.fill();
      if (dk) { ca.fillStyle = 'rgba(214,190,150,0.28)'; [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.18], [0.1, -0.45, 0.12], [-0.15, 0.4, 0.14]].forEach(function (q) { ca.beginPath(); ca.arc(M[0] + q[0] * M[2], M[1] + q[1] * M[2], q[2] * M[2], 0, 7); ca.fill(); }); }
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      var n = ph ? 12 : 18; for (j = 0; j < n; j++) { var u = j / n, yy = hz + 4 + Math.pow(u, 1.3) * (sh0 - hz - 14), w = M[2] * (0.6 + u * 1.6) * (0.55 + 0.45 * Math.sin(tt * 1.4 + j * 1.9)), xx = M[0] + Math.sin(tt * 0.7 + j * 2.3) * 8 * (1 + u);
        ca.fillStyle = dk ? 'rgba(255,240,200,' + (0.32 - u * 0.2) + ')' : 'rgba(255,255,240,' + (0.8 - u * 0.45) + ')'; ca.fillRect(xx - w / 2, yy, w, 1.6 + u * 1.6); }
      ca.restore();
      // glints twinkling over the bay
      ca.save(); ca.clip(bay, 'evenodd'); ca.fillStyle = dk ? 'rgba(220,235,255,0.8)' : 'rgba(255,255,255,0.95)';
      glints.forEach(function (g) { var a = Math.pow(Math.max(0, Math.sin(tt * g.sp + g.ph)), 10); if (a < 0.05) return; var y = waterY(g.f, g.x), r = (1.5 + g.f * 4) * S * a * (ph ? 0.8 : 1); ca.globalAlpha = a; thailand_spark(ca, g.x + Math.sin(tt * 0.3 + g.ph) * 6, y, r * 1.6); });
      ca.globalAlpha = 1;
      // candle krathong drifting across the bay at night, each with its warm glow and reflection
      krath.forEach(function (k, m) { var x = k.x, y = waterY(k.f, x) + Math.sin(tt * 1.3 + k.ph) * 1.2, s = (ph ? 0.75 : 1.1) * S * (0.6 + k.f * 0.7);
        ca.save(); ca.globalCompositeOperation = 'lighter'; thailand_dot(ca, flameG, x, y - 12 * s, 34 * s, 0.75); for (var q = 0; q < 4; q++) thailand_dot(ca, flameG, x + Math.sin(tt * 2 + q) * 2, y + 6 * s + q * 7 * s, (10 - q * 1.5) * s, 0.35 - q * 0.07); ca.restore();
        ca.drawImage(KR, x - 20 * s, y - 19 * s, 40 * s, 30 * s);
        var fl = flick(tt * 1.4, m), fh = 6 * s * (0.75 + 0.3 * fl); ca.fillStyle = '#FFC24A'; ca.beginPath(); ca.moveTo(x, y - 15 * s - fh); ca.quadraticCurveTo(x + 2.2 * s, y - 15 * s - fh * 0.3, x, y - 14 * s); ca.quadraticCurveTo(x - 2.2 * s, y - 15 * s - fh * 0.3, x, y - 15 * s - fh); ca.fill(); });
      // the finish moment: lotus flowers blooming in a wave across the water
      lotus.forEach(function (l) { var u2 = (t - l.t0) / 0.9, life = 1 - thailand_ease((t - l.t0 - 11) / 2); if (u2 <= 0 || life <= 0) return; var o = thailand_ease(u2);
        ca.save(); ca.globalAlpha = life; if (dk) { ca.globalCompositeOperation = 'lighter'; thailand_dot(ca, goldG, l.x, l.y - 6 * l.s, 26 * l.s, 0.35 * o); ca.globalCompositeOperation = 'source-over'; }
        ca.strokeStyle = dk ? 'rgba(170,200,255,0.4)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1.2; var rr = (1 - Math.max(0, 1 - u2 * 0.6)) * 30 * l.s; if (u2 < 1.8) { ca.globalAlpha = life * Math.max(0, 1 - u2 / 1.8); ca.beginPath(); ca.ellipse(l.x, l.y + 3 * l.s, rr, rr * 0.3, 0, 0, 7); ca.stroke(); ca.globalAlpha = life; }
        thailand_lotus(ca, l.x, l.y, l.s * (0.4 + 0.6 * Math.min(1, u2 * 2)), o, dk); ca.restore(); });
      // the zooming longtail's wake: a white ribbon that spreads into two curling lines behind it
      if (wake.length > 1) { ca.lineCap = 'round'; ca.lineJoin = 'round';
        for (j = 1; j < wake.length; j++) { var p0 = wake[j - 1], p1 = wake[j], age = t - p1.t0, al = Math.max(0, 1 - age / 4.5), dx = p1.x - p0.x, dy = p1.y - p0.y, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, spr = (3 + age * 16) * p1.s;
          ca.strokeStyle = dk ? 'rgba(200,230,255,' + (0.7 * al) + ')' : 'rgba(255,255,255,' + (0.95 * al) + ')'; ca.lineWidth = (7 - age * 1.2) * p1.s + 1; ca.beginPath(); ca.moveTo(p0.x, p0.y); ca.lineTo(p1.x, p1.y); ca.stroke();
          ca.lineWidth = 2 * p1.s + 0.6; ca.beginPath(); ca.moveTo(p0.x + nx * spr * 0.94, p0.y + ny * spr * 0.3); ca.lineTo(p1.x + nx * spr, p1.y + ny * spr * 0.32); ca.moveTo(p0.x - nx * spr * 0.94, p0.y - ny * spr * 0.3); ca.lineTo(p1.x - nx * spr, p1.y - ny * spr * 0.32); ca.stroke();
          if (j % 9 === 0 && age > 0.3) { var cr = (1.5 + age * 2.4) * p1.s; ca.beginPath(); ca.arc(p1.x - nx * spr, p1.y + cr * 0.3 - ny * spr * 0.32, cr, -Math.PI * 0.2, Math.PI * 1.3); ca.stroke(); ca.beginPath(); ca.arc(p1.x + nx * spr, p1.y - cr * 0.3 + ny * spr * 0.32, cr, Math.PI * 0.8, Math.PI * 2.3); ca.stroke(); }
          if (dk && j % 3 === 0) { ca.save(); ca.globalCompositeOperation = 'lighter'; thailand_dot(ca, bioG, p1.x + nx * spr, p1.y + ny * spr * 0.32, 5 * p1.s, al * 0.8); thailand_dot(ca, bioG, p1.x - nx * spr, p1.y - ny * spr * 0.32, 5 * p1.s, al * 0.8); ca.restore(); } } }
      if (zoom) { var uz = (t - zoom.t0) / zoom.dur; if (uz > 0 && uz < 1) { var pz = zoom.at(uz); ca.save(); ca.translate(pz[0], pz[1]); ca.scale(pz[2] * 0.95, pz[2] * 0.95); ca.rotate(-0.07 + Math.sin(tt * 9) * 0.015); thailand_boat(ca, 3, tt, dk, 1); ca.restore();
          ca.fillStyle = dk ? 'rgba(200,230,255,0.7)' : 'rgba(255,255,255,0.9)'; for (j = 0; j < 7; j++) { var sa = hash(j + Math.floor(tt * 12)) ; ca.beginPath(); ca.arc(pz[0] - 112 * pz[2] - sa * 18 * pz[2], pz[1] - sa * 10 * pz[2] + 2, (1.5 + sa * 2.4) * pz[2], 0, 7); ca.fill(); } } }
      ca.restore();
      // small waves lapping the sand: the wash slides up and back, its foam edge glowing blue at night where it breaks
      for (var wv = 0; wv < 2; wv++) { var u3 = ((tt / 6) + wv * 0.5) % 1, k2 = u3 < 0.4 ? thailand_ease(u3 / 0.4) : 1 - thailand_ease((u3 - 0.4) / 0.6), d = H * (ph ? 0.012 : 0.016) * k2 * (wv ? 0.6 : 1) + 2;
        ca.fillStyle = dk ? 'rgba(90,150,220,' + (0.25 * k2) + ')' : 'rgba(150,240,228,' + (0.6 * k2) + ')'; ca.beginPath(); ca.moveTo(shore[0][0], shore[0][1] - 4); shore.forEach(function (p) { ca.lineTo(p[0], p[1] + d + Math.sin(p[0] / 37 + tt + wv) * 1.6); }); ca.lineTo(shore[shore.length - 1][0], shore[shore.length - 1][1] - 4); ca.closePath(); ca.fill();
        ca.strokeStyle = dk ? 'rgba(170,230,255,' + (0.5 * k2) + ')' : 'rgba(255,255,255,' + (0.95 * k2) + ')'; ca.lineWidth = 2 * S + 0.6; ca.beginPath(); shore.forEach(function (p, m) { var y = p[1] + d + Math.sin(p[0] / 37 + tt + wv) * 1.6; if (m) ca.lineTo(p[0], y); else ca.moveTo(p[0], y); }); ca.stroke();
        if (dk && k2 > 0.2) { ca.save(); ca.globalCompositeOperation = 'lighter'; shore.forEach(function (p, m) { var tw = Math.max(0, Math.sin(m * 1.7 + tt * 2.3 + wv * 3)); if (tw < 0.4) return; var y = p[1] + d + Math.sin(p[0] / 37 + tt + wv) * 1.6; thailand_dot(ca, bioG, p[0], y, (6 + tw * 6) * S, k2 * tw * 0.7); ca.fillStyle = 'rgba(200,250,255,' + (k2 * tw) + ')'; ca.beginPath(); ca.arc(p[0] + 3, y - 1, 1.2, 0, 7); ca.fill(); }); ca.restore(); } }
      // the longtail boats rocking at their moorings (the far one at anchor in the bay)
      boats.forEach(function (b) { var rk = Math.sin(tt * 1.1 + b.ph) * 0.03 * f.a, bob = Math.sin(tt * 1.3 + b.ph) * 1.2 * b.s;
        ca.save(); ca.globalAlpha = dk ? 0.3 : 0.25; ca.fillStyle = dk ? '#0A1430' : '#1E6A70'; ca.beginPath(); ca.ellipse(b.x + 6 * b.s * b.dir, b.y + 6 * b.s, 80 * b.s, 6 * b.s, 0, 0, 7); ca.fill(); ca.restore();
        if (b.moored) { ca.strokeStyle = dk ? 'rgba(200,190,210,0.45)' : 'rgba(110,80,50,0.7)'; ca.lineWidth = 1; ca.beginPath(); ca.moveTo(b.x + b.dir * 70 * b.s, b.y - 30 * b.s + bob); ca.quadraticCurveTo(b.x + b.dir * 88 * b.s, b.y + 14 * b.s, b.x + b.dir * 100 * b.s, b.y + 22 * b.s); ca.stroke(); ca.fillStyle = dk ? '#3A2C34' : '#7A5432'; ca.fillRect(b.x + b.dir * 100 * b.s - 1.5, b.y + 12 * b.s, 3, 12 * b.s); }
        ca.save(); ca.translate(b.x, b.y + bob); ca.scale(b.s * b.dir, b.s); ca.rotate(rk); thailand_boat(ca, b.k, tt + b.ph, dk, 0); ca.restore();
        ca.strokeStyle = dk ? 'rgba(170,200,255,0.3)' : 'rgba(255,255,255,0.75)'; ca.lineWidth = 1.2; ca.beginPath(); ca.ellipse(b.x, b.y + 8 * b.s + bob * 0.3, 70 * b.s + Math.sin(tt * 1.3 + b.ph) * 3, 3 * b.s, 0, 0.1, Math.PI - 0.1); ca.stroke(); });
      // a hornbill flying from the big island across the bay
      var bu = (t - bird.t0) / bird.dur; if (bu > 0 && bu < 1) { var bx = W * (1.06 - bu * 1.18), by = H * (ph ? 0.3 : 0.24) - Math.sin(bu * Math.PI) * H * 0.1 + Math.sin(bu * 14) * H * 0.008, cyc = (bu * (ph ? 9 : 13)) % 2, wg = cyc < 1.2 ? Math.sin(cyc / 1.2 * Math.PI * 2) : 0.2;
        ca.save(); ca.translate(bx, by); ca.scale((ph ? 0.6 : 0.95) * S, (ph ? 0.6 : 0.95) * S); thailand_hornbill(ca, wg, dk); ca.restore(); }
      // the temple: a halo behind it at night, the chedi's sunburst in the moment
      var burst = thailand_env(T, 0.2, 0.9, 2.6, 4.6), hl = A.hall;
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; thailand_dot(ca, goldG, hl[0], hl[1] - 30 * ts, 150 * ts, 0.45 + 0.05 * Math.sin(tt * 0.8)); thailand_dot(ca, goldG, cc[0], cc[1] - 30 * ts, 120 * ts, 0.55); ca.restore(); }
      if (burst > 0) { ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; ca.translate(cc[0], cc[1] - 30 * ts); ca.rotate(tt * 0.25);
        for (j = 0; j < 18; j++) { ca.rotate(Math.PI * 2 / 18); var R = (j % 2 ? 190 : 260) * ts * (0.6 + 0.4 * burst); var gr = ca.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, dk ? 'rgba(255,230,140,' + (0.55 * burst) + ')' : 'rgba(255,196,40,' + (0.6 * burst) + ')'); gr.addColorStop(1, 'rgba(255,210,100,0)'); ca.fillStyle = gr; ca.beginPath(); ca.moveTo(0, 0); ca.lineTo(R, -R * 0.07); ca.lineTo(R, R * 0.07); ca.closePath(); ca.fill(); }
        ca.restore(); ca.save(); ca.globalCompositeOperation = 'lighter'; thailand_dot(ca, goldG, cc[0], cc[1] - 30 * ts, 200 * ts * burst, burst * 0.8); ca.restore(); }
      // ---- in front: the temple's lights, the glint on the chedi, the bells, the palm crowns
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter';
        A.doors.forEach(function (dd, m) { var fl2 = 0.8 + 0.2 * flick(tt, m * 3); cb.fillStyle = 'rgba(255,190,90,' + (0.55 * fl2) + ')'; cb.beginPath(); cb.moveTo(dd[0] - dd[2], dd[1] + dd[3] / 2); cb.lineTo(dd[0] - dd[2], dd[1] - dd[3] / 2 + dd[2] * 0.5); cb.quadraticCurveTo(dd[0] - dd[2], dd[1] - dd[3] / 2 - dd[2] * 0.6, dd[0], dd[1] - dd[3] / 2 - dd[2] * 0.9); cb.quadraticCurveTo(dd[0] + dd[2], dd[1] - dd[3] / 2 - dd[2] * 0.6, dd[0] + dd[2], dd[1] - dd[3] / 2 + dd[2] * 0.5); cb.lineTo(dd[0] + dd[2], dd[1] + dd[3] / 2); cb.closePath(); cb.fill(); thailand_dot(cb, flameG, dd[0], dd[1], dd[3] * 1.1, 0.5 * fl2); });
        thailand_dot(cb, goldG, cc[0], cc[1], 60 * ts, 0.5); thailand_dot(cb, goldG, A.tip[0], A.tip[1] + 30 * ts, 30 * ts, 0.4); cb.restore(); }
      var flash = thailand_env(T, 0.2, 0.5, 1.0, 2.4); if (flash > 0) { cb.save(); cb.globalCompositeOperation = 'lighter'; thailand_dot(cb, hotG, cc[0], cc[1] - 20 * ts, 90 * ts, flash * 0.9); cb.fillStyle = 'rgba(255,255,230,' + flash + ')'; thailand_spark(cb, A.tip[0], A.tip[1] + 14 * ts, 34 * ts * flash); cb.restore(); }
      // the glint: a soft band of light sliding over the golden bell, and a star at the spire now and then
      var gp = (tt * 0.12) % 1, ga = Math.sin(gp * Math.PI); cb.save(); cb.globalCompositeOperation = 'lighter'; thailand_dot(cb, hotG, cc[0] - 10 * ts + gp * 16 * ts, cc[1] + 14 * ts - gp * 52 * ts, 12 * ts, (dk ? 0.35 : 0.6) * ga);
      var st = (tt / 5.5) % 1; if (st < 0.14) { var sa2 = Math.sin(st / 0.14 * Math.PI); cb.fillStyle = 'rgba(255,255,240,' + (0.95 * sa2) + ')'; thailand_spark(cb, A.tip[0], A.tip[1] + 20 * ts, 13 * ts * sa2); thailand_dot(cb, hotG, A.tip[0], A.tip[1] + 20 * ts, 14 * ts, 0.6 * sa2); } cb.restore();
      // bells hanging from the eave ends, each with a leaf-shaped wind catcher; they ring hard in the moment
      var ring = 1 + 3 * thailand_env(T, 0.25, 0.5, 3.4, 5.4);
      A.bells.forEach(function (b, m) { var sw = (Math.sin(tt * 2.3 + m * 1.7) * 0.16 + Math.sin(tt * 0.7 + m) * 0.08) * f.a * ring * (ring > 1 ? (0.8 + 0.2 * Math.sin(tt * 9 + m)) : 1), s = ts * (ph ? 1.3 : 1);
        cb.save(); cb.translate(b[0], b[1]); cb.rotate(Math.max(-0.7, Math.min(0.7, sw))); cb.strokeStyle = dk ? '#B8964A' : '#8A6A2A'; cb.lineWidth = 0.9; cb.beginPath(); cb.moveTo(0, 0); cb.lineTo(0, 5 * s); cb.stroke();
        var g = cb.createLinearGradient(-4 * s, 0, 4 * s, 0); g.addColorStop(0, '#B8862E'); g.addColorStop(0.5, '#FFE08A'); g.addColorStop(1, '#A8761E'); cb.fillStyle = g; cb.beginPath(); cb.moveTo(-2 * s, 5 * s); cb.quadraticCurveTo(-2.4 * s, 9.5 * s, -4.2 * s, 11 * s); cb.lineTo(4.2 * s, 11 * s); cb.quadraticCurveTo(2.4 * s, 9.5 * s, 2 * s, 5 * s); cb.closePath(); cb.fill();
        cb.strokeStyle = '#C8962E'; cb.beginPath(); cb.moveTo(0, 11 * s); cb.lineTo(0, 15 * s); cb.stroke(); cb.fillStyle = '#F2C24A'; cb.beginPath(); cb.moveTo(0, 14 * s); cb.quadraticCurveTo(3.6 * s, 17 * s, 0, 21.5 * s); cb.quadraticCurveTo(-3.6 * s, 17 * s, 0, 14 * s); cb.fill(); cb.restore();
        if (ring > 1.3) { var nu = ((tt * 1.3 + m * 0.37) % 1); cb.fillStyle = 'rgba(255,236,160,' + ((ring - 1) / 3 * Math.sin(nu * Math.PI)) + ')'; thailand_spark(cb, b[0] + Math.sin(m * 2.1 + nu * 3) * 10 * s, b[1] + 6 * s - nu * 28 * s, 3.4 * s); } });
      // palm crowns swaying over everything
      crowns.forEach(function (c, m) { var sw = Math.sin(tt * 0.8 + c.ph) * 0.06 * f.a + Math.sin(tt * 1.9 + c.ph * 2) * 0.018 * f.a;
        [-2.95, -2.55, -2.1, -1.65, -1.2, -0.75, -0.3, 0.2, 0.65, 2.7].forEach(function (a, q) { var aa = a + sw * (1 + q * 0.12), L = c.L * (0.82 + (q % 3) * 0.1), left = Math.cos(aa) < 0; cb.save(); cb.translate(c.x, c.y); if (left) { cb.scale(-1, 1); aa = Math.PI - aa; } cb.rotate(aa); cb.fillStyle = q % 2 ? (dk ? '#1A3A30' : '#3A8A3E') : (dk ? '#24483A' : '#5AAA4A'); cb.fill(frondP(L)); cb.restore(); });
        cb.fillStyle = dk ? '#3A3024' : '#6E5A2A'; [[-5, 5], [5, 6], [0, 10], [-9, 9]].forEach(function (q) { cb.beginPath(); cb.arc(c.x + q[0] * S, c.y + q[1] * S, 5 * S + 1, 0, 7); cb.fill(); });
        cb.fillStyle = dk ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,220,0.35)'; cb.beginPath(); cb.arc(c.x - 6 * S, c.y + 3 * S, 1.8 * S + 0.5, 0, 7); cb.fill(); });
    },
    finish: function (t) { T0 = t; lotus = spots.map(function (p) { return {x: p[0], y: p[1], s: p[2], t0: t + 0.5 + (p[0] / W) * 2.2 + hash(p[1]) * 0.25}; });
      var sx = A.hx2 - W * 0.06, x1 = W + 160, fA = 0.62, fB = 0.3;
      zoom = {t0: t + 0.8, dur: ph ? 4.2 : 5.5, at: function (u) { var e = u, x = sx + (x1 - sx) * e, fr = fA + (fB - fA) * e, y = waterY(fr, Math.min(W, Math.max(0, x))) + Math.sin(e * Math.PI * 2) * H * 0.025; return [x, y, (ph ? 0.5 : 0.85) * S * (0.6 + fr * 0.6)]; }}; wake = []; }
  };
};
UIC.thailand = {L: ['#16807A', '#0E5A58', 'rgba(255,253,247,0.86)', '#10302E', '#4A6864', '#0E7470', '#0E7470', '#C88A1E', '#FFFFFF'], D: ['#1E2E5E', '#0E1838', 'rgba(16,26,56,0.8)', '#F2F2FA', '#B2B6D4', '#F2C45A', '#F2C45A', '#F6D892', '#0E1838']};
