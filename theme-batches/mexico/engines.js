// ---- world theme engine: mexico
// Loop: jacaranda petals drift down, the papel picado strings flutter over the plaza, the talavera fountain splashes,
// two hummingbirds visit the bougainvillea, the balcony geraniums sway, the jacarandas stir, and the balloon seller's
// bunch bobs on its pole. Night: the cathedral is floodlit pink and gold, windows twinkle up the hills, the bandstand's
// bulbs and the iron lamps glow, and stars and a crescent moon come out.
// Moment: the cathedral bells ring (they swing in the belfry and send rings of sound out), a gust sweeps confetti and
// papel picado ribbons across the plaza, and the balloon seller's balloons rise up over the spires.
function mexico_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function mexico_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return mexico_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - mexico_ease((T - c) / (d - c)); }
var mexico_gc = null;
function mexico_ctx() { return mexico_gc || (mexico_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (drawn with mexico_dot)
function mexico_rg(col, mid) { var g = mexico_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function mexico_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// a small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function mexico_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
// a party balloon of radius r, flat-shaded like the rest of the scene: a solid body, its lower right in a slightly deeper
// shade of the same colour, one soft highlight and a little knot (no glossy gradient)
function mexico_mix(h, k) { var n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')'; }
function mexico_balloon(c, x, y, r, col, dk, a) {
  c.save(); c.globalAlpha = a == null ? 1 : a; c.translate(x, y);
  var body = new Path2D(); body.moveTo(0, r * 1.15); body.bezierCurveTo(-r * 1.25, r * 0.55, -r * 1.05, -r * 1.1, 0, -r * 1.1); body.bezierCurveTo(r * 1.05, -r * 1.1, r * 1.25, r * 0.55, 0, r * 1.15);
  c.fillStyle = col; c.fill(body);
  c.save(); c.clip(body); c.fillStyle = mexico_mix(col, 0.82); c.beginPath(); c.ellipse(-r * 0.45, -r * 0.5, r * 1.35, r * 1.6, 0, 0, 7); c.rect(-r * 3, -r * 3, r * 6, r * 6); c.fill('evenodd'); c.restore();
  c.fillStyle = mexico_mix(col, 0.82); c.beginPath(); c.moveTo(0, r * 1.1); c.lineTo(-r * 0.16, r * 1.32); c.lineTo(r * 0.16, r * 1.32); c.closePath(); c.fill();
  c.fillStyle = dk ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-r * 0.42, -r * 0.48, r * 0.14, r * 0.26, 0.5, 0, 7); c.fill();
  c.restore(); }
// a national flag waving from its pole at (F.x, F.y): bands (vertical when vert) in cols, an optional emblem drawn by em
function mexico_flag(c, F, t, vert, cols, em, dk) { var top = [], bot = [], k, u, wv = function (u2) { return Math.sin(u2 * Math.PI * 1.6 - t * 2.2) * F.h * 0.08 * u2; };
  var pt = function (u2, v2) { return [F.x + F.w * u2, F.y + F.h * v2 + wv(u2)]; }, piece = function (u0, u1, v0, v1) { var p = [], q; for (q = 0; q <= 8; q++) p.push(pt(u0 + (u1 - u0) * q / 8, v0)); for (q = 8; q >= 0; q--) p.push(pt(u0 + (u1 - u0) * q / 8, v1)); c.beginPath(); p.forEach(function (pp, i) { if (i) c.lineTo(pp[0], pp[1]); else c.moveTo(pp[0], pp[1]); }); c.closePath(); c.fill(); };
  var dim = function (h) { if (!dk) return h; var n = parseInt(h.slice(1), 16); return 'rgb(' + Math.round((n >> 16) * 0.8) + ',' + Math.round(((n >> 8) & 255) * 0.8) + ',' + Math.round((n & 255) * 0.8) + ')'; }; // (solid at night too, just a little dimmer)
  c.save(); cols.forEach(function (col, i) { c.fillStyle = dim(col); var a0 = i / cols.length, a1 = (i + 1) / cols.length + 0.004; if (vert) piece(a0, a1, 0, 1); else piece(0, 1, a0, a1); });
  if (em) { var m = pt(0.5, 0.5); em(c, m[0], m[1], F.h); } c.restore(); }
// a hummingbird about 24 units long, facing right when dir is 1; w is the wing beat (0..1)
function mexico_hummer(c, x, y, s, dir, w, tilt, dk) {
  c.save(); c.translate(x, y); c.scale(dir * s / 24, s / 24); c.rotate(tilt || 0);
  c.fillStyle = dk ? 'rgba(200,220,255,0.3)' : 'rgba(255,255,255,0.55)';
  c.save(); c.translate(-2, -4); c.rotate(-0.6 - w * 1.4); c.beginPath(); c.ellipse(-8, 0, 10, 3.2, 0, 0, 7); c.fill(); c.restore();
  c.fillStyle = dk ? '#2E5A54' : '#2E9E6A'; c.beginPath(); c.moveTo(-6, 2); c.lineTo(-16, 6); c.lineTo(-15, 2); c.lineTo(-17, -1); c.lineTo(-6, -1); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(-1, 0, 8, 4.6, -0.25, 0, 7); c.fill();
  c.fillStyle = dk ? '#C8C0D8' : '#F2EEE2'; c.beginPath(); c.ellipse(0, 2.4, 5.6, 2.2, -0.2, 0, 7); c.fill();
  c.fillStyle = dk ? '#3A6E62' : '#36B47A'; c.beginPath(); c.arc(7, -3, 3.6, 0, 7); c.fill();
  c.fillStyle = dk ? '#8A2E5C' : '#E2306E'; c.beginPath(); c.ellipse(7.6, 0.6, 2.6, 1.8, 0.3, 0, 7); c.fill();
  c.fillStyle = '#1A1420'; c.beginPath(); c.arc(8.4, -3.6, 0.9, 0, 7); c.fill();
  c.strokeStyle = '#2A2024'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(10.2, -3); c.lineTo(20, -1.4); c.stroke();
  c.fillStyle = dk ? 'rgba(200,220,255,0.38)' : 'rgba(255,255,255,0.75)';
  c.save(); c.translate(-1, -4); c.rotate(-0.3 - w * 1.6); c.beginPath(); c.ellipse(-8, 0, 10, 3.4, 0, 0, 7); c.fill(); c.restore();
  c.restore(); }
// a bronze bell hanging from (x, y), swung by ang
function mexico_bell(c, x, y, s, ang, dk) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = dk ? '#6A4A2A' : '#5A3A1A'; c.fillRect(-7, -2, 14, 3);
  var g = c.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, dk ? '#8A6A3A' : '#9A6A26'); g.addColorStop(0.4, dk ? '#E8C27A' : '#F2CE6A'); g.addColorStop(1, dk ? '#6A4A26' : '#8A5A1E'); c.fillStyle = g;
  c.beginPath(); c.moveTo(-4, 1); c.bezierCurveTo(-5, 5, -6, 10, -8, 13); c.lineTo(-10, 16); c.lineTo(10, 16); c.lineTo(8, 13); c.bezierCurveTo(6, 10, 5, 5, 4, 1); c.closePath(); c.fill();
  c.fillStyle = dk ? '#3A2A1A' : '#4A2E12'; c.beginPath(); c.arc(0, 17, 2.2, 0, 7); c.fill();
  c.restore(); }
ENGINES.mexico = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.C, S = A.S, F = A.fount, T0 = -99, i, k;
  var warmG = mexico_rg(dk ? 'rgba(255,190,110,0.7)' : 'rgba(255,215,150,0.5)', [0.3, dk ? 0.32 : 0.2]), starG = mexico_rg('rgba(255,240,210,0.6)'), pinkG = mexico_rg('rgba(255,170,190,0.55)', [0.4, 0.3]);
  var winG = mexico_rg('rgba(255,200,110,0.7)', [0.25, 0.25]), goldG = mexico_rg('rgba(255,214,120,0.7)', [0.35, 0.3]);
  var spark = new Path2D('M0 -1L0.22 -0.22L1 0L0.22 0.22L0 1L-0.22 0.22L-1 0L-0.22 -0.22Z');
  var cathP = new Path2D(A.cath);
  var stars = A.stars.map(function (s, j) { return {x: s.x, y: s.y, r: s.r, ph: s.k * 6.28, sp: 0.6 + hash(j + 9) * 1.2}; });
  var wins = A.wins.map(function (w, j) { return {x: w.x, y: w.y, w: w.w, h: w.h, on: w.k < 0.72, ph: hash(j + 77) * 6.28, next: 3 + hash(j + 31) * 20}; });
  // jacaranda blossom clusters: a soft cloud of tiny lavender florets
  var JC = dk ? ['#6A5AB2', '#8070C8', '#5048A0', '#9A8ADA'] : ['#9C88E6', '#B4A2F0', '#8070D6', '#C8BCF6'];
  var jSpr = [0, 1, 2].map(function (q) { return mexico_sprite(64, 52, 2, function (o) {
    for (var m = 0; m < 110; m++) { var a = hash(m + q * 300) * 6.28, d = Math.sqrt(hash(m + 7 + q * 300)), x = Math.cos(a) * d * 28, y = Math.sin(a) * d * 20 + d * 2; o.fillStyle = JC[m % 4]; o.beginPath(); o.arc(x, y, 2 + hash(m + 3) * 2.4, 0, 7); o.fill(); }
    o.fillStyle = dk ? '#2E3A30' : '#5E8A3E'; for (m = 0; m < 10; m++) { var a2 = hash(m + 60 + q) * 6.28, d2 = 14 + hash(m + 61) * 12; o.save(); o.translate(Math.cos(a2) * d2, Math.sin(a2) * d2 * 0.7 + 6); o.rotate(a2); o.beginPath(); o.ellipse(0, 0, 4, 1.4, 0, 0, 7); o.fill(); o.restore(); } }); });
  var mkTree = function (x, y, s, n, spread, lean) { var cl = []; for (var q = 0; q < n; q++) { var a = -Math.PI / 2 + (q / (n - 1) - 0.5) * spread + (hash(q + x) - 0.5) * 0.3, d = (0.55 + hash(q + 2 + x) * 0.45); cl.push({a: a, d: d, sc: s * (0.9 + hash(q + 5 + x) * 0.5), ph: hash(q + 9 + x) * 6.28, spr: jSpr[q % 3]}); } return {x: x, y: y, s: s, cl: cl, lean: lean || 0, ph: hash(x) * 6.28}; };
  var pTrees = A.pj.map(function (q) { return mkTree(q[0], q[1], q[2] * S, 7, 2.2, 0); });
  var jt = A.jtl, tl = {x: jt.x, y: jt.y, s: jt.s, cl: []};
  for (i = 0; i < (ph ? 7 : 12); i++) { var u = i / ((ph ? 7 : 12) - 1); tl.cl.push({x: jt.x + (20 + u * 220) * jt.s + hash(i + 5) * 20, y: jt.y + (u * 50 - 20 + (hash(i + 6) - 0.5) * 60) * jt.s, sc: jt.s * (1.3 - u * 0.4 + hash(i + 7) * 0.3), ph: hash(i + 8) * 6.28, spr: jSpr[i % 3]}); }
  // bougainvillea sprays: bracts in clusters along a hanging stem
  var BG = dk ? ['#9C306C', '#B8407E', '#7A2458'] : ['#E2468C', '#F06AA6', '#C8326E'];
  var bSpr = [0, 1].map(function (q) { return mexico_sprite(40, 40, 2, function (o) { for (var m = 0; m < 9; m++) { var a = hash(m + 20 + q * 50) * 6.28, d = hash(m + 21 + q) * 11; o.fillStyle = dk ? '#24443E' : '#4F8C40'; o.save(); o.translate(Math.cos(a) * d * 1.3, Math.sin(a) * d * 1.3); o.rotate(a); o.beginPath(); o.ellipse(5, 0, 6, 3, 0, 0, 7); o.fill(); o.restore(); }
    for (m = 0; m < 26; m++) { a = hash(m + q * 90) * 6.28; d = Math.sqrt(hash(m + 1 + q * 90)) * 13; o.fillStyle = BG[m % 3]; o.save(); o.translate(Math.cos(a) * d, Math.sin(a) * d); o.rotate(a * 2); o.beginPath(); o.moveTo(0, -4.4); o.quadraticCurveTo(4.4, 0, 0, 4.4); o.quadraticCurveTo(-4.4, 0, 0, -4.4); o.fill(); o.restore(); }
    o.fillStyle = '#FFF2C8'; for (m = 0; m < 5; m++) { a = hash(m + 70 + q) * 6.28; o.beginPath(); o.arc(Math.cos(a) * 6, Math.sin(a) * 6, 1, 0, 7); o.fill(); } }); });
  var boug = A.boug.map(function (b) { return {x: b.x, y: b.y, len: b.len, r: b.r, ph: hash(b.k + 3) * 6.28}; });
  function sprayAt(b, m, tt, a) { var u = m / 4, sw = Math.sin(tt * 0.9 + b.ph) * 6 * S * u * a; return [b.x + sw + Math.sin(m + b.ph) * 5 * S, b.y + b.len * u]; }
  var hum = [0, 1].map(function (q) { return {x: W * 0.9, y: H * 0.2, tx: 0, ty: 0, fx: 0, fy: 0, t: 0, wait: q * 1.6, b: q, dir: -1, tilt: 0, from: null}; });
  // papel picado: three cut patterns, flags hung along each string
  var PP = dk ? ['#E05A9A', '#F2B44A', '#4A7AE0', '#8ACB5A', '#F2805A', '#3ABAB8', '#A07AE0'] : ['#E2468C', '#F4B23A', '#3462B6', '#8CC24E', '#F27A5A', '#2AAEB0', '#9A6AE0'];
  var flagPath = [0, 1, 2].map(function (q) { var p = new Path2D(), zz = 'M-0.5 0H0.5V1'; for (var z = 1; z <= 6; z++) zz += 'L' + (0.5 - z / 6) + ' ' + (z % 2 ? 0.9 : 1); p.addPath(new Path2D(zz + 'Z'));
    var hole = function (d) { p.addPath(new Path2D(d)); };
    if (q === 0) { for (var m = 0; m < 6; m++) { var a = m / 6 * Math.PI * 2; hole('M' + (Math.cos(a) * 0.14) + ' ' + (0.45 + Math.sin(a) * 0.14) + 'm-0.07 0a0.07 0.07 0 1 0 0.14 0a0.07 0.07 0 1 0 -0.14 0'); } hole('M-0.04 0.45a0.04 0.04 0 1 0 0.08 0a0.04 0.04 0 1 0 -0.08 0'); }
    else if (q === 1) { hole('M0 0.22L0.18 0.45L0 0.68L-0.18 0.45Z'); hole('M-0.34 0.2L-0.26 0.3L-0.34 0.4L-0.42 0.3Z'); hole('M0.34 0.2L0.42 0.3L0.34 0.4L0.26 0.3Z'); hole('M-0.34 0.55L-0.26 0.65L-0.34 0.75L-0.42 0.65Z'); hole('M0.34 0.55L0.42 0.65L0.34 0.75L0.26 0.65Z'); }
    else { hole('M0 0.2C0.2 0.2 0.28 0.5 0 0.72C-0.28 0.5 -0.2 0.2 0 0.2Z'); for (m = 0; m < 5; m++) hole('M' + (-0.36 + m * 0.18) + ' 0.82a0.035 0.035 0 1 0 0.07 0a0.035 0.035 0 1 0 -0.07 0'); }
    for (m = 0; m < 6; m++) hole('M' + (-0.38 + m * 0.15) + ' 0.08h0.06v0.06h-0.06Z');
    return p; });
  var strings = A.strings.map(function (st, sn) { var L = Math.hypot(st[2] - st[0], st[3] - st[1]), nf = Math.floor(L / ((ph ? 28 : 40) * S)), fl = [];
    // (where a later string crosses an earlier one, its flags near the crossing are left off so they don't pile up)
    var at0 = function (s2, u) { return [s2[0] + (s2[2] - s2[0]) * u, s2[1] + (s2[3] - s2[1]) * u + s2[4] * 4 * u * (1 - u)]; }, fwq = (ph ? 18 : 26) * S;
    for (var q = 0; q < nf; q++) { var u = (q + 0.5) / nf, pq = at0(st, u), near = A.strings.slice(0, sn).some(function (o) { for (var m = 0; m <= 60; m++) { var po = at0(o, m / 60); if (Math.abs(po[0] - pq[0]) < fwq * 1.1 && Math.abs(po[1] - pq[1]) < fwq * 1.6) return true; } return false; });
      if (!near) fl.push({u: u, c: PP[(q * 3 + sn * 2) % PP.length], p: (q + sn) % 3, ph: hash(q + sn * 40) * 6.28}); }
    return {x0: st[0], y0: st[1], x1: st[2], y1: st[3], sag: st[4], fl: fl, ph: sn * 1.3}; });
  var fw = (ph ? 18 : 26) * S;
  function strAt(st, u, tt, a) { var sg = st.sag * (1 + 0.06 * Math.sin(tt * 0.7 + st.ph) * a); return [st.x0 + (st.x1 - st.x0) * u, st.y0 + (st.y1 - st.y0) * u + sg * 4 * u * (1 - u)]; }
  // balcony geraniums
  var bal = A.bal.map(function (b) { return {x: b.x, y: b.y, w: b.w, ph: hash(b.k + 50) * 6.28, n: 5 + Math.floor(hash(b.k + 51) * 3)}; });
  var GER = dk ? ['#A83A4A', '#C25A6A', '#9A2E5A'] : ['#E2363E', '#F2606A', '#E2468C'];
  // fountain
  var waterClip = new Path2D(); waterClip.ellipse(F.x, F.y, F.rx, F.ry, 0, 0, 7); waterClip.moveTo(F.x - 9.4 * S, F.y + 1); waterClip.lineTo(F.x - 6.4 * S, F.bowlY + 12 * S); waterClip.lineTo(F.x + 6.4 * S, F.bowlY + 12 * S); waterClip.lineTo(F.x + 9.4 * S, F.y + 1); waterClip.closePath();
  var streams = (ph ? [0, 0.33, 0.67, 1] : [0, 0.2, 0.4, 0.6, 0.8, 1]).map(function (u) { var a = u * Math.PI, x0 = F.x + Math.cos(a) * F.brx * 0.98, y0 = F.bowlY + Math.sin(a) * F.bry, x1 = F.x + Math.cos(a) * F.rx * 0.5, y1 = F.y + Math.sin(a) * F.ry * 0.5; return {x0: x0, y0: y0, x1: x1, y1: y1, cx: x0 + (x1 - x0) * 0.3, cy: y0 - 6 * S}; });
  var rings = [], nextRing = 0, splash = [];
  // balloons on the cart
  var BC = dk ? ['#B0487A', '#C89448', '#4A6AB0', '#6E9A50', '#C06A58', '#8A6AB8', '#B8B0CC'] : ['#E2468C', '#F4B23A', '#3462B6', '#8CC24E', '#F27A5A', '#9A6AE0', '#FBF3E4'];
  var cart = A.cart, bR = (ph ? 10 : 14) * cart.s / 0.95;
  var balloons = []; for (i = 0; i < 9; i++) balloons.push({dx: (((i * 0.618) % 1) - 0.5) * 84 * cart.s, dy: -(50 + ((i * 0.382 + hash(i + 81) * 0.3) % 1) * 64) * cart.s, c: BC[i % BC.length], ph: hash(i + 82) * 6.28, r: bR * (0.85 + hash(i + 83) * 0.3), fly: null});
  balloons.sort(function (p, q) { return p.dy - q.dy; });
  var petals = []; for (i = 0; i < (ph ? 14 : 26); i++) petals.push({x: hash(i + 120) * W, y: hash(i + 121) * H, v: 14 + hash(i + 122) * 18, ph: hash(i + 123) * 6.28, s: (ph ? 3 : 4) * (0.7 + hash(i + 124) * 0.6), rot: hash(i + 125) * 6.28, c: JC[i % 4]});
  var conf = [], ribbons = [], waves = [], lastW = -1;
  function petal(c, x, y, s, rot, col, a) { c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.8, 0, s); c.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.9, -s * 0.6, 0, -s); c.fill(); c.restore(); }
  function cluster(c, x, y, sc, spr, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.drawImage(spr, -32, -26, 64, 52); c.restore(); }
  return {
    step: function (dt, t, f) {
      var T = t - T0, tt = t * f.s;
      // every stream splashes where it lands, steadily (each on its own beat, so they don't all pulse together): a ring
      // spreading from that point and a couple of drops thrown up
      streams.forEach(function (sm, j) { if (sm.nx == null) sm.nx = j * 0.13; sm.nx -= dt * f.s; if (sm.nx > 0) return; sm.nx += 0.5;
        rings.push({x: sm.x1, y: sm.y1, t0: t, L: 1.6});
        for (var q = 0; q < 2; q++) splash.push({x: sm.x1, y: sm.y1, vx: (q ? 1 : -1) * (8 + Math.random() * 10) * S, vy: -(22 + Math.random() * 14) * S, t0: t}); });
      rings = rings.filter(function (r) { return t - r.t0 < r.L; });
      splash.forEach(function (d) { d.vy += 160 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt; }); splash = splash.filter(function (d) { return t - d.t0 < 0.7; });
      petals.forEach(function (p) { p.y += p.v * dt * f.s; p.x += (Math.sin(tt * 0.8 + p.ph) * 16 + 10) * dt * f.s; p.rot += dt * 1.2; if (p.y > H + 10 || p.x > W + 10) { p.y = -10; p.x = Math.random() * W * 0.9; } });
      wins.forEach(function (w) { w.next -= dt; if (w.next <= 0) { w.next = 6 + Math.random() * 24; if (Math.random() < 0.5) w.on = !w.on; } });
      // the hummingbirds: hover at a spray, then dart to another
      hum.forEach(function (h, q) { h.wait -= dt * f.s;
        if (h.from) { h.t = Math.min(1, h.t + dt * 2.2); if (h.t >= 1) { h.from = null; h.wait = 1.4 + Math.random() * 2.2; } }
        else if (h.wait <= 0) { var nb; do { nb = Math.floor(Math.random() * boug.length); } while (boug.length > 1 && (nb === h.b || nb === hum[1 - q].b)); h.from = [h.x, h.y]; h.b = nb; h.t = 0; } });
      // the finish: confetti and ribbons on a gust from the left, balloons let go one by one
      conf.forEach(function (p) { if (t < p.t0) return; p.vx += (W * 0.05 - p.vx * 0.2) * dt; p.vy += (30 - p.vy * 0.6) * dt; p.x += p.vx * dt; p.y += p.vy * dt + Math.sin(t * 3 + p.ph) * 0.6; p.rot += p.vr * dt; });
      conf = conf.filter(function (p) { return p.x < W + 30 && p.y < H + 30; });
      ribbons = ribbons.filter(function (r) { return t - r.t0 < r.L; });
      waves = waves.filter(function (w) { return t - w.t0 < 2.4; });
      balloons.forEach(function (b, j) { if (b.fly) { var fl = b.fly; if (t < fl.t0) return; fl.vy = Math.max(-H * 0.2, fl.vy - H * 0.05 * dt); fl.y += fl.vy * dt; fl.x += (Math.sin(t * 1.3 + b.ph) * 18 + (A.cx - fl.x) * 0.12) * dt; if (fl.y < -bR * 4) b.gone = true; } });
      if (T > 10.5) balloons.forEach(function (b) { if (b.gone) { b.fly = null; b.gone = false; b.back = t; } });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, ring = mexico_env(T, 0.2, 0.8, 6, 7.5), i;
      // the night sky: stars and a crescent moon
      if (dk) { ca.fillStyle = '#FFF4DA'; stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * s.sp + s.ph); if (s.r > 1.3) { mexico_dot(ca, starG, s.x, s.y, s.r * 5, a * 0.6); ca.save(); ca.translate(s.x, s.y); ca.scale(s.r * 2.2 * (0.6 + a * 0.4), s.r * 2.2 * (0.6 + a * 0.4)); ca.globalAlpha = 0.6 + a * 0.4; ca.fill(spark); ca.restore(); } else { ca.globalAlpha = 0.45 + a * 0.5; ca.beginPath(); ca.arc(s.x, s.y, s.r, 0, 7); ca.fill(); } }); ca.globalAlpha = 1;
        var mx = W * (ph ? 0.3 : 0.45), my = H * (ph ? 0.2 : 0.185), mr = (ph ? 13 : 18) * S; mexico_dot(ca, starG, mx, my, mr * 4, 0.5); ca.fillStyle = '#FFF2D0'; ca.beginPath(); ca.arc(mx, my, mr, 0, 7); ca.arc(mx + mr * 0.45, my - mr * 0.25, mr * 0.88, 0, 7, true); ca.fill('evenodd'); }
      // windows twinkling up the hills
      if (dk) { ca.save(); wins.forEach(function (w) { var a = w.on ? 0.75 + 0.25 * Math.sin(tt * 0.6 + w.ph) : 0; if (a <= 0) return; ca.globalAlpha = a; ca.fillStyle = '#FFD27A'; ca.fillRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h); mexico_dot(ca, winG, w.x, w.y, w.w * 3.6, a * 0.65); }); ca.restore(); ca.globalAlpha = 1; }
      // the cathedral: floodlit pink and gold at night, warm gold while the bells ring
      var flood = dk ? 1 : 0, gl = ring * (dk ? 0.35 : 0.3);
      if (flood || gl > 0) { ca.save(); ca.clip(cathP); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
        var g = ca.createLinearGradient(0, A.spireTop, 0, A.yb); g.addColorStop(0, 'rgba(255,200,140,' + (0.08 * flood + gl * 0.6) + ')'); g.addColorStop(0.6, 'rgba(255,150,170,' + (0.26 * flood + gl * 0.5) + ')'); g.addColorStop(1, 'rgba(255,190,120,' + (0.32 * flood + gl * 0.7) + ')');
        ca.fillStyle = g; ca.fillRect(A.cx - 200 * S, A.spireTop - 10, 400 * S, A.yb - A.spireTop + 20);
        if (flood) [-1, 0, 1].forEach(function (q) { mexico_dot(ca, goldG, A.cx + q * 110 * S, A.yb, 90 * S, 0.45, 2.4); });
        ca.restore(); }
      // the bells: still until the moment, then swinging, with rings of sound going out
      A.bells.forEach(function (b, j) { var sw = ring * Math.sin(tt * 4.2 + j * 1.3) * 0.55; mexico_bell(ca, b.x, b.y, b.s, sw, dk); });
      // balcony geraniums
      bal.forEach(function (b) { var bw = b.w; ca.fillStyle = dk ? '#5A2E2A' : '#B85A32'; ca.fillRect(b.x - bw / 2, b.y + 6 * S, bw, 5 * S);
        for (var m = 0; m < b.n; m++) { var px = b.x - bw / 2 + (m + 0.5) * bw / b.n, sw = Math.sin(tt * 1.1 + b.ph + m * 0.7) * 1.6 * S * f.a, py = b.y + 4 * S - (m % 2 ? 3 : 1) * S;
          ca.fillStyle = dk ? '#22403A' : '#3E7A34'; ca.beginPath(); ca.ellipse(px + sw * 0.5, py + 3 * S, 3.6 * S, 2.2 * S, 0, 0, 7); ca.fill();
          ca.fillStyle = GER[m % 3]; ca.beginPath(); ca.arc(px + sw, py - 1 * S, 2.6 * S, 0, 7); ca.fill(); ca.beginPath(); ca.arc(px + sw + 1.6 * S, py + 0.6 * S, 1.8 * S, 0, 7); ca.fill(); }
        ca.strokeStyle = dk ? '#22403A' : '#4F8C40'; ca.lineWidth = 1.2 * S; ca.beginPath(); var vx = b.x - bw * 0.3; ca.moveTo(vx, b.y + 10 * S); ca.quadraticCurveTo(vx - 3 * S + Math.sin(tt + b.ph) * 2 * S, b.y + 18 * S, vx + Math.sin(tt * 0.8 + b.ph) * 3 * S, b.y + 24 * S); ca.stroke(); });
      // the plaza jacarandas: trunk, branches, swaying clusters, and a lilac carpet of fallen flowers
      pTrees.forEach(function (tr) { var s = tr.s, sw = Math.sin(tt * 0.5 + tr.ph) * 0.02 * f.a;
        ca.fillStyle = dk ? 'rgba(110,90,190,0.25)' : 'rgba(160,140,230,0.35)'; ca.beginPath(); ca.ellipse(tr.x, tr.y + 4 * s, 80 * s, 10 * s, 0, 0, 7); ca.fill();
        ca.save(); ca.translate(tr.x, tr.y); ca.rotate(sw); ca.strokeStyle = dk ? '#241C2A' : '#5A4038'; ca.lineCap = 'round';
        ca.lineWidth = 9 * s; ca.beginPath(); ca.moveTo(0, 4 * s); ca.quadraticCurveTo(-4 * s, -50 * s, 2 * s, -96 * s); ca.stroke();
        ca.lineWidth = 4.4 * s; tr.cl.forEach(function (c) { ca.beginPath(); ca.moveTo(0, -80 * s); ca.quadraticCurveTo(Math.cos(c.a) * 30 * s, -100 * s, Math.cos(c.a) * 72 * s * c.d, -110 * s + Math.sin(c.a) * 44 * s * c.d); ca.stroke(); });
        tr.cl.forEach(function (c) { var r2 = Math.sin(tt * 0.8 + c.ph) * 0.06 * f.a; cluster(ca, Math.cos(c.a) * 72 * s * c.d, -112 * s + Math.sin(c.a) * 44 * s * c.d, c.sc * 1.3, c.spr, r2); });
        ca.restore(); });
      // the fountain: rings and glints on the basin, the jet, the streams from the upper bowl
      cb.save(); cb.clip(waterClip, 'evenodd'); var wg = cb.createLinearGradient(0, F.y - F.ry, 0, F.y + F.ry); wg.addColorStop(0, dk ? 'rgba(60,120,170,0.6)' : 'rgba(110,210,225,0.85)'); wg.addColorStop(1, dk ? 'rgba(40,80,150,0.5)' : 'rgba(60,170,205,0.75)'); cb.fillStyle = wg; cb.fillRect(F.x - F.rx, F.y - F.ry, F.rx * 2, F.ry * 2);
      cb.strokeStyle = dk ? 'rgba(170,210,255,0.5)' : 'rgba(255,255,255,0.75)'; cb.lineWidth = 1.2;
      rings.forEach(function (r) { var k = (t - r.t0) / r.L, rr = (4 + k * 30) * S; cb.globalAlpha = (1 - k) * 0.8; cb.beginPath(); cb.ellipse(r.x, r.y, rr, rr * F.ry / F.rx * 1.3, 0, 0, 7); cb.stroke(); });
      cb.globalAlpha = 1; for (i = 0; i < (ph ? 5 : 9); i++) { var ga = 0.5 + 0.5 * Math.sin(tt * 2.1 + i * 1.7); if (ga < 0.6) continue; cb.save(); cb.translate(F.x + Math.cos(i * 2.4 + tt * 0.1) * F.rx * 0.75, F.y + Math.sin(i * 2.4) * F.ry * 0.6); cb.scale(3 * S, 1.6 * S); cb.globalAlpha = (ga - 0.6) * 2; cb.fillStyle = '#FFFFFF'; cb.fill(spark); cb.restore(); }
      cb.restore(); cb.globalAlpha = 1;
      cb.fillStyle = dk ? 'rgba(60,120,170,0.55)' : 'rgba(110,210,225,0.85)'; cb.beginPath(); cb.ellipse(F.x, F.bowlY, F.brx - 3, Math.max(1, F.bry - 1.4), 0, 0, 7); cb.fill();
      var jh = (ph ? 12 : 20) * S * (1 + 0.15 * Math.sin(tt * 6));
      cb.strokeStyle = dk ? 'rgba(190,225,255,0.75)' : 'rgba(255,255,255,0.92)'; cb.lineWidth = 2.2 * S; cb.lineCap = 'round'; cb.beginPath(); cb.moveTo(F.x, F.spout); cb.lineTo(F.x, F.spout - jh); cb.stroke();
      cb.lineWidth = 1.2 * S; [-1, -0.45, 0.45, 1].forEach(function (d) { cb.beginPath(); cb.moveTo(F.x, F.spout - jh); cb.quadraticCurveTo(F.x + d * F.brx * 0.3, F.spout - jh - 5 * S, F.x + d * F.brx * 0.6, F.bowlY - 1); cb.stroke(); });
      streams.forEach(function (sm, j) { cb.strokeStyle = dk ? 'rgba(170,215,250,0.55)' : 'rgba(255,255,255,0.75)'; cb.lineWidth = 1.7 * S; cb.setLineDash([6 * S, 4 * S]); cb.lineDashOffset = -tt * 30 - j * 3; cb.beginPath(); cb.moveTo(sm.x0, sm.y0); cb.quadraticCurveTo(sm.cx, sm.cy, sm.x1, sm.y1); cb.stroke(); cb.setLineDash([]); cb.strokeStyle = dk ? 'rgba(130,190,240,0.25)' : 'rgba(220,245,255,0.45)'; cb.lineWidth = 3.4 * S; cb.beginPath(); cb.moveTo(sm.x0, sm.y0); cb.quadraticCurveTo(sm.cx, sm.cy, sm.x1, sm.y1); cb.stroke(); });
      cb.fillStyle = dk ? 'rgba(200,230,255,0.8)' : 'rgba(255,255,255,0.95)'; splash.forEach(function (d) { cb.globalAlpha = 1 - (t - d.t0) / 0.7; cb.beginPath(); cb.arc(d.x, d.y, 1.3 * S, 0, 7); cb.fill(); }); cb.globalAlpha = 1;
      // the iron lamps and the bandstand bulbs
      A.lamps.forEach(function (l, j) { var fk = flick(tt * 0.8, j * 2.1); if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; mexico_dot(cb, warmG, l.x, l.y, 60 * l.s * (0.95 + 0.1 * fk), 0.75); cb.restore(); }
        cb.fillStyle = dk ? 'rgba(255,220,140,' + (0.85 + 0.15 * fk) + ')' : 'rgba(255,240,200,0.5)'; cb.fillRect(l.x - 5 * l.s, l.y - 7 * l.s, 10 * l.s, 14 * l.s); });
      var K = A.kiosk; K.bulbs.forEach(function (b, j) { var chase = ring > 0 ? 0.5 + 0.5 * Math.sin(tt * 8 - j * 0.9) : 1, on = dk ? 0.85 * chase + 0.15 : ring * chase;
        cb.strokeStyle = dk ? 'rgba(20,16,30,0.6)' : 'rgba(50,40,40,0.5)'; cb.lineWidth = 0.8; cb.beginPath(); cb.moveTo(b.x, b.y - 4 * S); cb.lineTo(b.x, b.y); cb.stroke();
        if (on > 0.02) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; mexico_dot(cb, warmG, b.x, b.y + 2 * S, 14 * S, on * (dk ? 0.8 : 0.5)); cb.restore(); }
        cb.fillStyle = on > 0.3 ? '#FFE6A0' : (dk ? '#6A6080' : '#FFF6E4'); cb.beginPath(); cb.arc(b.x, b.y + 2 * S, 2.6 * S, 0, 7); cb.fill(); });
      // the balloon seller's bunch: strings to the pole, balloons bobbing (or rising away during the moment)
      cb.strokeStyle = dk ? 'rgba(220,210,240,0.45)' : 'rgba(70,60,70,0.5)'; cb.lineWidth = 0.9;
      balloons.forEach(function (b, j) { var a = b.back ? Math.min(1, (t - b.back) / 1.2) : 1, x, y;
        if (b.fly && t >= b.fly.t0) { x = b.fly.x; y = b.fly.y; cb.beginPath(); cb.moveTo(x, y + b.r * 1.3); cb.quadraticCurveTo(x - 4 * S, y + b.r * 2.4, x + Math.sin(t * 3 + j) * 3 * S, y + b.r * 3.6); cb.stroke(); }
        else { x = cart.tie[0] + b.dx + Math.sin(tt * 0.9 + b.ph) * 3 * S * f.a; y = cart.tie[1] + b.dy + Math.sin(tt * 1.3 + b.ph * 2) * 2.4 * S * f.a; cb.globalAlpha = a; cb.beginPath(); cb.moveTo(cart.tie[0], cart.tie[1]); cb.quadraticCurveTo((x + cart.tie[0]) / 2 + 3 * S, (y + cart.tie[1]) / 2, x, y + b.r * 1.3); cb.stroke(); cb.globalAlpha = 1; }
        mexico_balloon(cb, x, y, b.r, b.c, dk, a); });
      // the jacaranda leaning in at the top left
      var jsw = Math.sin(tt * 0.45) * 0.015 * f.a; cb.save(); cb.translate(tl.x, tl.y); cb.rotate(jsw); cb.translate(-tl.x, -tl.y);
      cb.strokeStyle = dk ? '#1E1824' : '#4E3830'; cb.lineCap = 'round'; cb.lineWidth = 16 * tl.s; cb.beginPath(); cb.moveTo(tl.x - 10, tl.y - 34 * tl.s); cb.quadraticCurveTo(tl.x + 90 * tl.s, tl.y - 10 * tl.s, tl.x + 200 * tl.s, tl.y + 14 * tl.s); cb.stroke();
      cb.lineWidth = 6 * tl.s; tl.cl.forEach(function (c, j) { if (j % 2) return; cb.beginPath(); cb.moveTo(tl.x + (c.x - tl.x) * 0.6, tl.y - 20 * tl.s + (c.x - tl.x) * 0.18); cb.lineTo(c.x, c.y); cb.stroke(); });
      tl.cl.forEach(function (c) { cluster(cb, c.x + Math.sin(tt * 0.7 + c.ph) * 2 * S, c.y, c.sc * 1.5, c.spr, Math.sin(tt * 0.9 + c.ph) * 0.05 * f.a); });
      cb.restore();
      // the bougainvillea spilling off the pergola, and the hummingbirds
      boug.forEach(function (b, j) { cb.strokeStyle = dk ? '#1E2A26' : '#5A4A2A'; cb.lineWidth = 1.6 * S; cb.beginPath(); cb.moveTo(b.x, b.y); for (var m = 1; m <= 4; m++) { var p = sprayAt(b, m, tt, f.a); cb.lineTo(p[0], p[1]); } cb.stroke();
        for (m = 0; m <= 4; m++) { var q = sprayAt(b, m, tt, f.a); cluster(cb, q[0], q[1], b.r / 16 * (1.1 - m * 0.12), bSpr[(m + j) % 2], Math.sin(tt * 0.9 + b.ph + m) * 0.15 * f.a); } });
      hum.forEach(function (h, q) { var tb = boug[h.b], tp = sprayAt(tb, 2.5, tt, f.a), hx = tp[0] - 22 * S * (q ? -1 : 1), hy = tp[1] - 6 * S + Math.sin(tt * 3 + q) * 3 * S;
        if (h.from) { var e = mexico_ease(h.t); h.x = h.from[0] + (hx - h.from[0]) * e; h.y = h.from[1] + (hy - h.from[1]) * e - Math.sin(e * Math.PI) * 20 * S; h.dir = hx > h.from[0] ? 1 : -1; h.tilt = 0.25; }
        else { h.x = hx; h.y = hy; h.dir = tp[0] > hx ? 1 : -1; h.tilt = -0.15; }
        mexico_hummer(cb, h.x, h.y, (ph ? 16 : 22) * S, h.dir, 0.5 + 0.5 * Math.sin(tt * 60 + q), h.tilt, dk); });
      if (A.mxflag) mexico_flag(cb, A.mxflag, tt, true, ['#006847', '#FFFFFF', '#CE1126'], function (c, x, y, h) { c.fillStyle = '#8A5A2B'; c.beginPath(); c.ellipse(x, y, h * 0.13, h * 0.15, 0, 0, 7); c.fill(); c.fillStyle = '#3E8A3A'; c.beginPath(); c.ellipse(x, y + h * 0.13, h * 0.16, h * 0.05, 0, 0, 7); c.fill(); }, dk);
      // papel picado: flags swing and turn on the strings
      strings.forEach(function (st) { cb.strokeStyle = dk ? 'rgba(220,210,240,0.5)' : 'rgba(60,50,60,0.55)'; cb.lineWidth = 1; cb.beginPath(); for (var m = 0; m <= 24; m++) { var p = strAt(st, m / 24, tt, f.a); if (m) cb.lineTo(p[0], p[1]); else cb.moveTo(p[0], p[1]); } cb.stroke();
        st.fl.forEach(function (fl) { var p = strAt(st, fl.u, tt, f.a), w = Math.sin(tt * 1.6 + fl.ph + p[0] * 0.01), turn = 0.78 + 0.22 * Math.cos(tt * 1.1 + fl.ph * 1.7), gust = ring * Math.sin(tt * 5 + fl.ph) * 0.4;
          cb.save(); cb.translate(p[0], p[1]); cb.transform(turn * fw, 0, (w * 0.18 + gust) * fw, fw * 1.25 * (0.94 + 0.06 * w), 0, 0); cb.fillStyle = fl.c; cb.globalAlpha = dk ? 0.88 : 0.95; cb.fill(flagPath[fl.p], 'evenodd'); cb.restore(); }); });
      cb.globalAlpha = 1;
      // drifting jacaranda petals
      petals.forEach(function (p) { petal(cb, p.x, p.y, p.s, p.rot, p.c, 0.85); });
      // the moment: rings of sound from the belfry, ribbons and confetti on the gust, balloons rising past the spires
      if (ring > 0.3 && Math.floor(T * 2.2) !== lastW) { lastW = Math.floor(T * 2.2); waves.push({t0: t}); }
      waves.forEach(function (w) { var k = (t - w.t0) / 2.4, b0 = A.bells[0], b1 = A.bells[1] || b0, wx = (b0.x + b1.x) / 2, wy = b0.y + 10 * S; cb.strokeStyle = dk ? 'rgba(255,220,140,' + (1 - k) * 0.7 + ')' : 'rgba(230,160,40,' + (1 - k) * 0.7 + ')'; cb.lineWidth = 2.4 * S * (1 - k * 0.5);
        [-1, 1].forEach(function (sd) { cb.beginPath(); cb.arc(wx, wy, 40 * S + k * 160 * S, sd < 0 ? Math.PI * 0.8 : -Math.PI * 0.2, sd < 0 ? Math.PI * 1.2 : Math.PI * 0.2); cb.stroke(); }); });
      ribbons.forEach(function (r) { var k = (t - r.t0) / r.L; if (k < 0) return; var head = -200 + k * (W + 600); cb.strokeStyle = r.c; cb.lineWidth = r.w; cb.lineCap = 'round'; cb.globalAlpha = Math.min(1, (1 - k) * 4);
        cb.beginPath(); for (var m = 0; m <= 30; m++) { var x = head - m * r.len / 30, y = r.y + Math.sin(x * r.f + t * 4 + r.ph) * r.a + m * 0.6; if (m) cb.lineTo(x, y); else cb.moveTo(x, y); } cb.stroke(); cb.globalAlpha = 1; });
      conf.forEach(function (p) { if (t < p.t0) return; cb.save(); cb.translate(p.x, p.y); cb.rotate(p.rot); cb.scale(1, Math.cos(t * p.fl + p.ph)); cb.fillStyle = p.c; cb.fillRect(-p.s / 2, -p.s * 0.35, p.s, p.s * 0.7); cb.restore(); });
    },
    finish: function (t) { T0 = t; conf = []; ribbons = []; waves = [];
      for (k = 0; k < (ph ? 90 : 170); k++) conf.push({x: -20 - Math.random() * W * 0.4, y: H * (0.15 + Math.random() * 0.8), vx: W * (0.18 + Math.random() * 0.2), vy: -20 + Math.random() * 30, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8, fl: 4 + Math.random() * 6, ph: Math.random() * 6.28, s: (ph ? 5 : 7) * (0.7 + Math.random() * 0.6), c: PP[k % PP.length], t0: t + 0.7 + Math.random() * 2.2});
      for (k = 0; k < (ph ? 5 : 9); k++) ribbons.push({t0: t + 0.8 + k * 0.35, L: 3.6 + Math.random(), y: H * (0.2 + Math.random() * 0.7), c: PP[(k * 2) % PP.length], w: (ph ? 3 : 5) * S, len: (ph ? 110 : 220) * S, a: 14 * S, f: 0.02 + Math.random() * 0.01, ph: Math.random() * 6.28});
      balloons.forEach(function (b, j) { var x = cart.tie[0] + b.dx, y = cart.tie[1] + b.dy; b.back = 0; b.gone = false; b.fly = {t0: t + 0.8 + j * 0.3, x: x, y: y, vy: -H * 0.04}; }); }
  };
};
UIC.mexico = {L: ['#C2456E', '#7E2848', 'rgba(255,252,246,0.86)', '#2E1E2A', '#6E5A62', '#C2456E', '#C2456E', '#E07A3A', '#FFFFFF'], D: ['#3A2A62', '#1A1638', 'rgba(24,20,54,0.8)', '#F6EEF8', '#C2B2D2', '#F2A2C0', '#F2A2C0', '#F6C88A', '#1C1634']};
