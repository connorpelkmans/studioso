// ---- batch japan engines: japan
function japan_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function japan_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return japan_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - japan_ease((T - c) / (d - c)); }
var japan_gc = null;
function japan_ctx() { return japan_gc || (japan_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with japan_dot)
function japan_rg(col, mid) { var g = japan_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function japan_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function japan_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
// one sakura petal (a rounded drop with a notch), about 2s long, pointing up
function japan_petal(c, s) { c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(-s * 0.24, -s); c.bezierCurveTo(-s * 0.72, -s * 0.9, -s * 0.72, -s * 0.2, -s * 0.44, s * 0.36); c.quadraticCurveTo(-s * 0.2, s * 0.8, 0, s); c.quadraticCurveTo(s * 0.2, s * 0.8, s * 0.44, s * 0.36); c.bezierCurveTo(s * 0.72, -s * 0.2, s * 0.72, -s * 0.9, s * 0.24, -s); c.closePath(); c.fill(); }
// a five-petal cherry blossom of radius r
function japan_flower(c, x, y, r, rot, col, mid) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; for (var i = 0; i < 5; i++) { c.save(); c.rotate(i * Math.PI * 2 / 5); c.translate(0, -r * 0.5); japan_petal(c, r * 0.5); c.restore(); } c.fillStyle = mid; c.beginPath(); c.arc(0, 0, r * 0.18, 0, 7); c.fill(); c.restore(); }
// a red-crowned crane in flight, facing +x, s about a fifth of its length; flap -1 (down) .. 1 (up)
function japan_crane(c, x, y, s, flap, dk) {
  var white = dk ? '#E8E6F4' : '#FFFFFF', blk = dk ? '#16142A' : '#22202C', grey = dk ? '#B8B6CC' : '#D8DCE6';
  c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
  // the far wing, a shade darker, then the body; the near wing goes over it
  var wy = -30 * s * flap, wy2 = -24 * s * flap, wing = function (dy, col, tip) { c.fillStyle = col; c.beginPath(); c.moveTo(-9 * s, -1 * s); c.quadraticCurveTo(-14 * s, dy * 0.55, -20 * s, dy); c.quadraticCurveTo(-4 * s, dy * 0.9, 9 * s, -1.5 * s); c.closePath(); c.fill();
    c.fillStyle = tip; c.beginPath(); c.moveTo(-20 * s, dy); c.quadraticCurveTo(-14 * s, dy * 0.55, -9 * s, -1 * s); c.lineTo(-4 * s, -1 * s); c.quadraticCurveTo(-10 * s, dy * 0.5, -12 * s, dy * 0.92); c.closePath(); c.fill(); };
  wing(wy2, grey, dk ? '#2A2838' : '#4A4858');
  // legs trailing behind, the black tail plumes
  c.strokeStyle = blk; c.lineWidth = 1.3 * s; c.beginPath(); c.moveTo(-12 * s, 2 * s); c.lineTo(-34 * s, 4 * s); c.moveTo(-12 * s, 3 * s); c.lineTo(-33 * s, 6 * s); c.stroke();
  c.fillStyle = blk; c.beginPath(); c.moveTo(-12 * s, -3 * s); c.quadraticCurveTo(-24 * s, -1 * s, -22 * s, 4 * s); c.quadraticCurveTo(-16 * s, 4 * s, -10 * s, 3 * s); c.closePath(); c.fill();
  // body, neck and head (black neck, white cheek, red crown)
  c.fillStyle = white; c.beginPath(); c.ellipse(-1 * s, 0, 15 * s, 5.6 * s, -0.05, 0, 7); c.fill();
  c.strokeStyle = blk; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(10 * s, -1.5 * s); c.quadraticCurveTo(22 * s, -3 * s, 31 * s, -3.6 * s); c.stroke();
  c.fillStyle = blk; c.beginPath(); c.ellipse(33 * s, -3.8 * s, 3.4 * s, 2.4 * s, 0, 0, 7); c.fill();
  c.fillStyle = white; c.beginPath(); c.ellipse(30 * s, -3 * s, 1.6 * s, 1.1 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#E8303A'; c.beginPath(); c.arc(33.4 * s, -5.6 * s, 1.3 * s, 0, 7); c.fill();
  c.strokeStyle = dk ? '#8A8A70' : '#9A9A7A'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(36 * s, -3.6 * s); c.lineTo(43 * s, -2.6 * s); c.stroke();
  wing(wy, white, blk);
  c.restore(); }

// ---- the buildings and the bridge, painted once into canvases at the screen's pixel density (they need far more tones than
// the eight colours a layer has). Everything is drawn in a gentle oblique view: front faces lit by the sun in the west (left),
// right-hand side faces in shade, shadows cast to the right and back, roofs with lit and shaded slopes.
function japan_rs(seed) { var s = Math.floor(Math.abs(seed)) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
function japan_mix(a, b, t) { var p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), f = function (sh) { var x = (p >> sh) & 255, y = (q >> sh) & 255; return Math.round(x + (y - x) * t); };
  return '#' + ((1 << 24) + (f(16) << 16) + (f(8) << 8) + f(0)).toString(16).slice(1); }
// an offscreen canvas covering x0..x0+w, y0..y0+h of the scene at k pixels per unit; fn paints in scene units
function japan_deco(x0, y0, w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k)); var o = cv.getContext('2d');
  o.scale(k, k); o.translate(-x0, -y0); o.lineJoin = o.lineCap = 'round'; fn(o); cv.x0 = x0; cv.y0 = y0; cv.w = w; cv.h = h; return cv; }
function japan_poly(o, p, col) { o.beginPath(); o.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) o.lineTo(p[i][0], p[i][1]); o.closePath(); if (col) { o.fillStyle = col; o.fill(); } }
function japan_path(o, p, col, w) { o.beginPath(); o.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) o.lineTo(p[i][0], p[i][1]); if (col) { o.strokeStyle = col; o.lineWidth = w; o.stroke(); } }
// colours for night and for distance: shade t darkens toward the shadow tone, at night everything sinks toward the night blue,
// hz mixes in the haze of distance
function japan_tone(dk, hz) { var N = '#1E2148', HZ = dk ? '#34376A' : '#D3DEEC';
  return function (c, t) { var v = dk ? japan_mix(c, N, 0.46 + (t || 0) * 0.32) : (t ? japan_mix(c, '#2A2442', t) : c); return hz > 0 ? japan_mix(v, HZ, hz) : v; }; }
// a hipped roof in the oblique view P(X, Y, Z): eaves rx by rz (half sizes) at height ye with the corners swept up by lift, a
// concave sweep up to the top (half sizes tx, tz) at yt; under it the eave soffit back to the wall (half sizes ix, iz at yi).
// c: {roof, side, line, ridge, hl, fas, fasS, under, underS, raft, dot}; returns the three visible corner tips
function japan_hip(o, P, rx, rz, ye, tx, tz, yt, lift, f, ix, iz, yi, s, c) { var n = 16, i, u, k, A, B, e, t, p, y0;
  var eF = function (u, dy) { return P(-rx + 2 * rx * u, ye + lift * Math.pow(Math.abs(2 * u - 1), 3) + (dy || 0), -rz); };
  var eR = function (v, dy) { return P(rx, ye + lift * Math.pow(Math.abs(2 * v - 1), 3) + (dy || 0), -rz + 2 * rz * v); };
  var hip = function (sx, sz, t) { return P(sx * (rx + (tx - rx) * t), ye + lift + (yt - ye - lift) * Math.pow(t, 1.6), sz * (rz + (tz - rz) * t)); };
  var line = function (sx, sz, rev) { var q = []; for (var j = 0; j <= 8; j++) q.push(hip(sx, sz, rev ? 1 - j / 8 : j / 8)); return q; };
  // the soffit under the eaves, with its rafters
  A = []; for (i = 0; i <= n; i++) A.push(eF(i / n, -f)); japan_poly(o, A.concat([P(ix, yi, -iz), P(-ix, yi, -iz)]), c.under);
  B = []; for (i = 0; i <= n; i++) B.push(eR(i / n, -f)); japan_poly(o, B.concat([P(ix, yi, iz), P(ix, yi, -iz)]), c.underS);
  o.strokeStyle = c.raft; o.lineWidth = 0.5 * s; o.beginPath(); var nr = Math.max(6, Math.round(rx / (2.2 * s)));
  for (i = 1; i < nr; i++) { u = i / nr; var a = eF(u, -f), b = P(-ix + 2 * ix * u, yi, -iz); o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); } o.stroke();
  // the slopes: front lit, right side in shade
  var fr = []; for (i = 0; i <= n; i++) fr.push(eF(i / n)); fr = fr.concat(line(1, -1), [P(tx, yt, -tz), P(-tx, yt, -tz)], line(-1, -1, true)); japan_poly(o, fr, c.roof);
  var sd = []; for (i = 0; i <= n; i++) sd.push(eR(i / n)); sd = sd.concat(line(1, 1), [P(tx, yt, tz), P(tx, yt, -tz)], line(1, -1, true)); japan_poly(o, sd, c.side);
  // tile channels running down the slopes
  o.save(); japan_poly(o, fr); o.clip(); o.strokeStyle = c.line; o.lineWidth = 0.55 * s; o.beginPath(); var nt = Math.round(rx / (1.5 * s));
  for (i = 1; i < nt; i++) { u = i / nt; e = eF(u); var x0 = -rx + 2 * rx * u; y0 = ye + lift * Math.pow(Math.abs(2 * u - 1), 3); o.moveTo(e[0], e[1]);
    for (k = 1; k <= 6; k++) { t = k / 6; p = P(x0 + (-tx + 2 * tx * u - x0) * t, y0 + (yt - y0) * Math.pow(t, 1.6), -rz + (rz - tz) * t); o.lineTo(p[0], p[1]); } } o.stroke(); o.restore();
  o.save(); japan_poly(o, sd); o.clip(); o.strokeStyle = c.line; o.lineWidth = 0.55 * s; o.beginPath(); nt = Math.round(rz / (1.5 * s));
  for (i = 1; i < nt; i++) { u = i / nt; e = eR(u); var z0 = -rz + 2 * rz * u; y0 = ye + lift * Math.pow(Math.abs(2 * u - 1), 3); o.moveTo(e[0], e[1]);
    for (k = 1; k <= 6; k++) { t = k / 6; p = P(rx + (tx - rx) * t, y0 + (yt - y0) * Math.pow(t, 1.6), z0 + (-tz + 2 * tz * u - z0) * t); o.lineTo(p[0], p[1]); } } o.stroke(); o.restore();
  // the fascia boards along the eaves, with the rafter ends under them
  A = []; B = []; for (i = 0; i <= n; i++) { A.push(eF(i / n)); B.unshift(eF(i / n, -f)); } japan_poly(o, A.concat(B), c.fas);
  A = []; B = []; for (i = 0; i <= n; i++) { A.push(eR(i / n)); B.unshift(eR(i / n, -f)); } japan_poly(o, A.concat(B), c.fasS);
  if (c.dot) { o.fillStyle = c.dot; for (i = 1; i < nr; i++) { var q = eF(i / nr, -f * 0.55); o.fillRect(q[0] - 0.5 * s, q[1] - 0.45 * s, 1 * s, 0.9 * s); } }
  // the hip ridges, the lit one catching the light
  [[-1, -1], [1, -1], [1, 1]].forEach(function (h) { japan_path(o, line(h[0], h[1]), c.ridge, 1.9 * s); });
  japan_path(o, line(-1, -1).map(function (p) { return [p[0] - 0.4 * s, p[1] - 0.5 * s]; }), c.hl, 0.6 * s);
  return [eF(0, -f), eF(1, -f), eR(1, -f)]; }

// the five-storey pagoda: a stone podium, then five storeys of vermilion posts, white plaster panels and studded doors under
// bracket sets, deep shadowed soffits and sweeping tiled roofs, a railed balcony on each upper storey, bells at the eave corners
// and the bronze spire on top. Its shadow falls on the wooded hill behind (hill: a Path2D to clip it to).
function japan_paintPagoda(o, G, dk, hill, lights) {
  var s = G.s, cx = G.x, by = G.y, kx = 0.42, ky = 0.11, K = japan_tone(dk, 0), i, q, sp, r1, r2;
  var P = function (X, Y, Z) { return [cx + X + Z * kx, by - Y - Z * ky]; };
  var RED = '#D8432C', PL = '#F7EFDF', WOOD = '#4A2C26', ROOF = '#58627C', GOLD = '#E2B04A';
  var rc = {roof: K(ROOF), side: K(ROOF, 0.34), line: dk ? 'rgba(6,6,20,0.35)' : 'rgba(20,24,44,0.3)', ridge: K('#343A50'), hl: dk ? 'rgba(190,200,255,0.18)' : 'rgba(255,255,255,0.35)',
    fas: K(RED), fasS: K(RED, 0.32), under: K('#7A2C22', 0.2), underS: K('#7A2C22', 0.42), raft: K('#3A1612'), dot: K('#F2D488', 0.15)};
  var box = function (x0, x1, y0, y1, z0, z1, cf, cs, ct) { japan_poly(o, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], cf); japan_poly(o, [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], cs);
    if (ct) japan_poly(o, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], ct); };
  // the silhouette, for the shadow on the hill
  var sil = [[44, 0], [44, 6]], Y = 6 * s, a, bh, R, an, yt, Yb, top, st = [];
  for (i = 0; i < 5; i++) { a = (62 - i * 7.4) / 2; bh = i ? 21 : 27; R = a + (i ? 23 : 26); var yy = Y / s; sil.push([a + 3, yy], [a + 2, yy + bh + 4.6], [R + 3, yy + bh + 4.6 + 6.4], [a - 6, yy + bh + 23.6]); st.push(Y); Y += (bh + 23.6) * s; }
  sil.push([6, Y / s], [3, Y / s + 10], [1, Y / s + 64]);
  o.save(); o.clip(hill); o.fillStyle = dk ? 'rgba(8,8,30,0.22)' : 'rgba(30,50,40,0.18)'; o.beginPath();
  sil.forEach(function (q, n) { var h = q[1] * s, x = cx + q[0] * s + h * 0.42, y = by - h * 0.78; if (n) o.lineTo(x, y); else o.moveTo(x, y); });
  sil.slice().reverse().forEach(function (q) { var h = q[1] * s; o.lineTo(cx - q[0] * s * 0.4 + h * 0.42, by - h * 0.78); }); o.closePath(); o.fill(); o.restore();
  // the podium and its steps
  var a0 = 44 * s; box(-a0, a0, -6 * s, 6 * s, -a0, a0, K('#CFC6B8'), K('#CFC6B8', 0.3), K('#E4DCCE'));
  o.strokeStyle = K('#9A9284'); o.lineWidth = 0.5 * s; o.beginPath(); for (i = -3; i <= 3; i++) { r1 = P(i * a0 / 3.5, -6 * s, -a0); r2 = P(i * a0 / 3.5, 6 * s, -a0); o.moveTo(r1[0], r1[1]); o.lineTo(r2[0], r2[1]); } o.stroke();
  for (i = 0; i < 3; i++) box(-12 * s, 12 * s, -6 * s, (2 - i * 4) * s, -a0 - (i + 1) * 3 * s, -a0 - i * 3 * s, K('#D8D0C2'), K('#D8D0C2', 0.3), K('#ECE6DA'));
  for (i = 0; i < 5; i++) {
    Y = st[i]; a = (62 - i * 7.4) / 2 * s; bh = (i ? 21 : 27) * s; R = a + (i ? 23 : 26) * s; an = i < 4 ? (62 - (i + 1) * 7.4) / 2 * s + 3.4 * s : 7 * s; yt = Y + bh; Yb = yt + 4.6 * s; top = Yb + 19 * s;
    if (i) box(-a - 3 * s, a + 3 * s, Y, Y + 1.6 * s, -a - 3 * s, a + 3 * s, K(RED, 0.25), K(RED, 0.5), K('#8A5040'));
    var b0 = Y + (i ? 1.6 * s : 0), aa = a;
    // the walls: posts and beams in vermilion, plaster panels in the outer bays, a studded door in the middle
    box(-a, a, b0, yt, -a, a, K(RED), K(RED, 0.34));
    [[-a + 1.8 * s, -a / 3 - 1.3 * s], [a / 3 + 1.3 * s, a - 1.8 * s]].forEach(function (q) { japan_poly(o, [P(q[0], b0 + 2.6 * s, -aa), P(q[1], b0 + 2.6 * s, -aa), P(q[1], yt - 3.6 * s, -aa), P(q[0], yt - 3.6 * s, -aa)], K(PL));
      japan_poly(o, [P(aa, b0 + 2.6 * s, q[0]), P(aa, b0 + 2.6 * s, q[1]), P(aa, yt - 3.6 * s, q[1]), P(aa, yt - 3.6 * s, q[0])], K(PL, 0.3));
      japan_poly(o, [P(q[0], b0 + 2.6 * s, -aa), P(q[1], b0 + 2.6 * s, -aa), P(q[1], b0 + 3.4 * s, -aa), P(q[0], b0 + 3.4 * s, -aa)], K(PL, 0.18)); });
    japan_poly(o, [P(-a / 3 + 1.3 * s, b0 + 0.4 * s, -a), P(a / 3 - 1.3 * s, b0 + 0.4 * s, -a), P(a / 3 - 1.3 * s, yt - 3.6 * s, -a), P(-a / 3 + 1.3 * s, yt - 3.6 * s, -a)], K(WOOD));
    japan_poly(o, [P(a, b0 + 0.4 * s, -a / 3 + 1.3 * s), P(a, b0 + 0.4 * s, a / 3 - 1.3 * s), P(a, yt - 3.6 * s, a / 3 - 1.3 * s), P(a, yt - 3.6 * s, -a / 3 + 1.3 * s)], K(WOOD, 0.3));
    o.fillStyle = K(GOLD, 0.15); for (var dr = 0; dr < 4; dr++) for (var dc = 0; dc < 4; dc++) { sp = P(-a / 3 + 1.3 * s + (dc + 0.5) * (2 * a / 3 - 2.6 * s) / 4, b0 + 0.4 * s + (dr + 0.6) * (bh - 4.4 * s) / 4.2, -a); o.fillRect(sp[0] - 0.35 * s, sp[1] - 0.35 * s, 0.7 * s, 0.7 * s); }
    japan_path(o, [P(0, b0 + 0.4 * s, -a), P(0, yt - 3.6 * s, -a)], K('#24140F'), 0.5 * s);
    if (i === 0) lights.push([P(0, b0, -a)[0], P(0, b0 + bh * 0.4, -a)[1], 12 * s]);
    // the eave's shadow over the top of the walls
    var g = o.createLinearGradient(0, P(0, yt, -a)[1], 0, P(0, yt - bh * 0.55, -a)[1]); g.addColorStop(0, dk ? 'rgba(6,4,20,0.55)' : 'rgba(50,14,20,0.42)'); g.addColorStop(1, 'rgba(50,14,20,0)');
    o.fillStyle = g; japan_poly(o, [P(-a, yt - bh * 0.55, -a), P(a, yt - bh * 0.55, -a), P(a, yt - bh * 0.55, a), P(a, yt, a), P(a, yt, -a), P(-a, yt, -a)]); o.fill();
    // the balcony railing in front of the upper storeys
    if (i) { var ra = a + 3 * s, rh = 4.4 * s; o.strokeStyle = K(RED, 0.1); o.lineWidth = 0.7 * s; o.beginPath();
      for (q = -ra; q <= ra + 0.1; q += 2.6 * s) { r1 = P(q, Y + 1.6 * s, -ra); r2 = P(q, Y + rh, -ra); o.moveTo(r1[0], r1[1]); o.lineTo(r2[0], r2[1]); } o.stroke();
      o.strokeStyle = K(RED, 0.4); o.beginPath(); for (q = -ra; q <= ra + 0.1; q += 2.6 * s) { r1 = P(ra, Y + 1.6 * s, q); r2 = P(ra, Y + rh, q); o.moveTo(r1[0], r1[1]); o.lineTo(r2[0], r2[1]); } o.stroke();
      japan_path(o, [P(ra, Y + rh, ra), P(ra, Y + rh, -ra)], K(RED, 0.4), 1.1 * s); japan_path(o, [P(-ra, Y + rh, -ra), P(ra, Y + rh, -ra)], K(RED), 1.1 * s); }
    // the bracket sets under the eaves
    box(-a - 1.6 * s, a + 1.6 * s, yt, Yb, -a - 1.6 * s, a + 1.6 * s, K(RED, 0.4), K(RED, 0.58));
    o.fillStyle = K('#EACB86', 0.42); var nb = Math.round(a / (2.4 * s)); for (q = 0; q <= nb; q++) { var bx = -a - 1 * s + q * (2 * a + 2 * s) / nb; sp = P(bx, Yb - 1.6 * s, -a - 1.6 * s); o.fillRect(sp[0] - 0.7 * s, sp[1], 1.4 * s, 1.1 * s); sp = P(bx, yt + 1.6 * s, -a - 1.6 * s); o.fillRect(sp[0] - 0.5 * s, sp[1], 1 * s, 1 * s); }
    // the roof, and a bell at each corner
    var tips = japan_hip(o, P, R, R, Yb + 1.4 * s, an, an, top, (i ? 5.4 : 6.4) * s, 2.4 * s, a + 1.6 * s, a + 1.6 * s, Yb, s, rc);
    tips.forEach(function (t) { japan_path(o, [t, [t[0], t[1] + 2.4 * s]], K('#3A3020'), 0.4 * s); o.fillStyle = K(GOLD, 0.1); o.beginPath(); o.moveTo(t[0] - 0.9 * s, t[1] + 4.6 * s); o.quadraticCurveTo(t[0], t[1] + 1.4 * s, t[0] + 0.9 * s, t[1] + 4.6 * s); o.closePath(); o.fill(); });
  }
  // the spire: a dew basin, nine rings on the mast, the water-flame and the jewel
  Y = top; box(-6 * s, 6 * s, Y - 1 * s, Y + 4 * s, -6 * s, 6 * s, K('#3E4258'), K('#3E4258', 0.35), K('#5A607A'));
  var m0 = P(0, Y + 4 * s, 0), m1 = P(0, Y + 56 * s, 0); japan_path(o, [m0, m1], K('#8A6A2A'), 1.5 * s); japan_path(o, [[m0[0] - 0.3 * s, m0[1]], [m1[0] - 0.3 * s, m1[1]]], K(GOLD), 0.6 * s);
  for (i = 0; i < 9; i++) { var rp = P(0, Y + (9 + i * 4.4) * s, 0), rr = (6.2 - i * 0.3) * s; o.fillStyle = K('#9A7428'); o.beginPath(); o.ellipse(rp[0], rp[1] + 0.3 * s, rr, rr * 0.3, 0, 0, 7); o.fill();
    o.fillStyle = K(GOLD); o.beginPath(); o.ellipse(rp[0] - 0.3 * s, rp[1], rr * 0.96, rr * 0.22, 0, Math.PI, 2 * Math.PI); o.fill(); }
  var fp = P(0, Y + 52 * s, 0); o.fillStyle = K(GOLD); o.beginPath(); o.moveTo(fp[0], fp[1] - 11 * s); o.quadraticCurveTo(fp[0] + 5 * s, fp[1] - 5 * s, fp[0] + 1 * s, fp[1]); o.lineTo(fp[0] - 1 * s, fp[1]); o.quadraticCurveTo(fp[0] - 5 * s, fp[1] - 5 * s, fp[0], fp[1] - 11 * s); o.fill();
  o.fillStyle = K('#F4D27A'); o.beginPath(); o.arc(fp[0] - 0.4 * s, fp[1] - 12.4 * s, 1.5 * s, 0, 7); o.fill(); }

// a round tree (or a blossoming cherry): a shaded mass with lit puffs to the upper left and its shadow to the right
function japan_tree(o, K, cx, yb, r, pink, sh) { var base = pink ? '#F2A8C0' : '#4E8A5A', i;
  o.fillStyle = sh; o.beginPath(); o.ellipse(cx + r * 0.7, yb - r * 0.1, r * 1.1, r * 0.32, 0, 0, 7); o.fill();
  japan_poly(o, [[cx - r * 0.1, yb], [cx - r * 0.06, yb - r * 0.8], [cx + r * 0.06, yb - r * 0.8], [cx + r * 0.12, yb]], K('#5A4034'));
  var pf = [[0, -1.05, 0.72], [-0.6, -0.68, 0.52], [0.6, -0.66, 0.54], [-0.25, -1.4, 0.48], [0.32, -1.32, 0.5]];
  o.fillStyle = K(base, 0.3); pf.forEach(function (q) { o.beginPath(); o.arc(cx + q[0] * r, yb + q[1] * r, q[2] * r, 0, 7); o.fill(); });
  o.fillStyle = K(base); pf.forEach(function (q) { o.beginPath(); o.arc(cx + q[0] * r - q[2] * r * 0.22, yb + q[1] * r - q[2] * r * 0.2, q[2] * r * 0.74, 0, 7); o.fill(); });
  o.fillStyle = K(pink ? '#FFD6E2' : '#7DB46A'); for (i = 0; i < 5; i++) { var q = pf[i]; o.beginPath(); o.arc(cx + q[0] * r - q[2] * r * 0.4, yb + q[1] * r - q[2] * r * 0.38, q[2] * r * 0.3, 0, 7); o.fill(); } }

// a town house in the oblique view: H.x, H.yb (front left foot), H.w wide, H.hh a storey high. Kinds: a two-storey machiya (a
// latticed wooden shop front with noren under a pent roof, slatted windows above), a single-storey house (plaster and dark
// timber, shoji windows), a kura storehouse (white plaster on a black-tiled base) and the riverside teahouse. Gable or hipped
// roofs with tile channels, eave tiles, ridges and end tiles. Windows go to wins, lanterns to lamps; returns its bounding box.
function japan_house(o, K, sh, H, wins, lamps, dk) {
  var x = H.x, yb = H.yb, w = H.w, hh = H.hh, sc = H.sc, two = H.two, kura = H.kura, r = japan_rs(H.seed * 7919 + 13), hgt = two ? hh * 1.7 : hh, d = w * 0.4 + 8 * sc, kx = 0.3, ky = 0.2, i, k, p, g;
  var Q = function (X, Y, Z) { return [x + X + Z * kx, yb - Y - Z * ky]; };
  var ov = 2.6 * sc, o2 = 3.2 * sc, he = hgt - 0.4 * sc, rz = d / 2, rh = (kura ? 0.6 : 0.5) * d + 2 * sc, hr = hgt + rh, hip = H.hip;
  var ROOF = H.roof || '#59627A', wallC = kura ? '#F4F0E6' : two ? (r() < 0.3 ? '#8A6448' : '#EFE5D3') : (r() < 0.25 ? '#E8DCC4' : '#F3ECDD'), WOOD = r() < 0.5 ? '#5E4032' : '#6E4A36';
  var rect = function (x0, y0, x1, y1, c) { japan_poly(o, [Q(x0, y0, 0), Q(x1, y0, 0), Q(x1, y1, 0), Q(x0, y1, 0)], c); };
  // the shadow it casts to the right and back
  japan_poly(o, [Q(w, 0, 0), Q(w + hr * 0.55, 0, hr * 0.3), Q(w + hr * 0.55, 0, d + hr * 0.3), Q(hr * 0.55, 0, d + hr * 0.3), Q(0, 0, d)], sh);
  // the shaded side face (and the gable end)
  japan_poly(o, [Q(w, 0, 0), Q(w, 0, d), Q(w, hgt, d), Q(w, hgt, 0)], K(wallC, 0.34));
  if (!hip) japan_poly(o, [Q(w, hgt - 0.1, 0), Q(w, hr - 0.6 * sc, rz), Q(w, hgt - 0.1, d)], K(wallC, 0.4));
  if (kura) japan_poly(o, [Q(w, 0, 0), Q(w, 0, d), Q(w, hgt * 0.3, d), Q(w, hgt * 0.3, 0)], K('#3E4458', 0.3));
  else { japan_path(o, [Q(w, 0, d * 0.5), Q(w, hgt, d * 0.5)], K(WOOD, 0.4), 0.6 * sc); if (two) japan_path(o, [Q(w, hh, 0), Q(w, hh, d)], K(WOOD, 0.4), 0.7 * sc); }
  if (two && !kura && r() < 0.6) { var sw0 = Q(w, hh * 1.5, d * 0.25), sw1 = Q(w, hh * 1.5, d * 0.45); japan_poly(o, [sw0, sw1, [sw1[0], sw1[1] + hh * 0.3], [sw0[0], sw0[1] + hh * 0.3]], K('#3A3036', 0.2)); }
  // the front
  rect(0, 0, w, hgt, K(wallC));
  var win = function (wx, wy, ww, wh, kind) { // kind 0: shoji, 1: slatted (mushiko), 2: wooden lattice
    var p = Q(wx, wy + wh, 0); japan_poly(o, [p, [p[0] + ww, p[1]], [p[0] + ww, p[1] + wh], [p[0], p[1] + wh]], kind === 0 ? K('#FBF4E2', 0.06) : K('#3A2E2C', 0.1));
    o.strokeStyle = kind === 0 ? K('#7A6656', 0.1) : K(kind === 1 ? wallC : '#9A7656'); o.lineWidth = Math.max(0.3, (kind ? 0.6 : 0.3) * sc); o.beginPath();
    var st = kind === 0 ? 1.8 * sc : 1.1 * sc, xx, yy; for (xx = p[0] + st; xx < p[0] + ww - 0.2 * sc; xx += st) { o.moveTo(xx, p[1]); o.lineTo(xx, p[1] + wh); }
    if (kind === 0) for (yy = p[1] + st; yy < p[1] + wh - 0.2 * sc; yy += st) { o.moveTo(p[0], yy); o.lineTo(p[0] + ww, yy); } o.stroke();
    o.strokeStyle = K(WOOD, 0.1); o.lineWidth = 0.5 * sc; o.strokeRect(p[0], p[1], ww, wh); wins.push([p[0], p[1], ww, wh, r(), kind]); };
  var noren = function (nx, nw, ny, nh) { var cols = ['#2E4A7A', '#B8402E', '#F4EEE2', '#4A3A5A'], nc = cols[Math.floor(r() * cols.length)], p = Q(nx, ny, 0), pw = nw / 3;
    for (var j = 0; j < 3; j++) japan_poly(o, [[p[0] + j * pw + 0.15 * sc, p[1]], [p[0] + (j + 1) * pw - 0.15 * sc, p[1]], [p[0] + (j + 1) * pw - 0.15 * sc, p[1] + nh], [p[0] + j * pw + 0.15 * sc, p[1] + nh]], K(nc, j === 2 ? 0.12 : 0));
    o.fillStyle = K(nc === '#F4EEE2' ? '#2E4A7A' : '#F4EEE2'); o.beginPath(); o.arc(p[0] + nw / 2, p[1] + nh * 0.42, Math.min(pw, nh) * 0.22, 0, 7); o.fill(); };
  var lantern = function (lx, ly, lr) { var p = Q(lx, ly, -1.5 * sc); japan_path(o, [[p[0], p[1] - lr * 2], [p[0], p[1] - lr]], K('#2A2228'), 0.3 * sc);
    o.fillStyle = dk ? '#C8503A' : '#D8402E'; o.beginPath(); o.ellipse(p[0], p[1], lr * 0.75, lr, 0, 0, 7); o.fill(); o.fillStyle = K('#2A2228'); o.fillRect(p[0] - lr * 0.45, p[1] - lr * 1.08, lr * 0.9, lr * 0.3); o.fillRect(p[0] - lr * 0.45, p[1] + lr * 0.8, lr * 0.9, lr * 0.3);
    o.fillStyle = 'rgba(255,255,255,0.25)'; o.beginPath(); o.ellipse(p[0] - lr * 0.25, p[1] - lr * 0.2, lr * 0.2, lr * 0.55, 0, 0, 7); o.fill(); lamps.push([p[0], p[1], lr]); };
  if (kura) { // black namako base with its white lattice, a little window with heavy shutters high up
    rect(0, 0, w, hgt * 0.3, K('#3E4458')); o.save(); japan_poly(o, [Q(0, 0, 0), Q(w, 0, 0), Q(w, hgt * 0.3, 0), Q(0, hgt * 0.3, 0)]); o.clip();
    o.strokeStyle = K('#DCD8CE', 0.1); o.lineWidth = 0.35 * sc; o.beginPath(); var b0 = Q(0, 0, 0), dd = 2.4 * sc, hb = hgt * 0.3; for (k = -hb; k < w + hb; k += dd) { o.moveTo(b0[0] + k, b0[1]); o.lineTo(b0[0] + k + hb, b0[1] - hb); o.moveTo(b0[0] + k, b0[1] - hb); o.lineTo(b0[0] + k + hb, b0[1]); } o.stroke(); o.restore();
    japan_path(o, [Q(0, hgt * 0.3, 0), Q(w, hgt * 0.3, 0)], K('#2A2E3E'), 0.8 * sc);
    var kw = Math.min(w * 0.3, 6 * sc); win(w / 2 - kw / 2, hgt * 0.56, kw, kw * 0.8, 2); p = Q(w / 2 - kw / 2, hgt * 0.56 + kw * 0.8, 0); japan_poly(o, [[p[0] - kw * 0.5, p[1]], [p[0], p[1]], [p[0], p[1] + kw * 0.8], [p[0] - kw * 0.5, p[1] + kw * 0.8]], K('#2E2A30'));
  } else if (H.tea) { // the teahouse: an open front between posts, noren, lanterns
    rect(1.2 * sc, 0, w - 1.2 * sc, hgt * 0.8, K('#2E2224', 0.1)); wins.push([Q(1.2 * sc, 0, 0)[0], Q(0, hgt * 0.8, 0)[1], w - 2.4 * sc, hgt * 0.8, 0.05, 3]);
    for (k = 0; k <= 3; k++) rect(k * (w - 1.4 * sc) / 3, 0, k * (w - 1.4 * sc) / 3 + 1.4 * sc, hgt, K(WOOD));
    noren(w * 0.36, w * 0.3, hgt * 0.8, hgt * 0.36); lantern(w * 0.16, hgt * 0.78, 2.2 * sc); lantern(w * 0.84, hgt * 0.78, 2.2 * sc);
  } else if (two) { // the shop floor: a lattice front, a doorway with noren; the pent roof; slatted windows above
    rect(0, 0, w, hh, K(WOOD));
    var left = r() < 0.5, dx = left ? w * 0.08 : w * 0.64, dw = w * 0.28; win(left ? w * 0.42 : w * 0.08, hh * 0.08, w * 0.5, hh * 0.68, 2);
    rect(dx, 0, dx + dw, hh * 0.82, K('#24181A')); wins.push([Q(dx, 0, 0)[0], Q(dx, hh * 0.82, 0)[1], dw, hh * 0.82, r(), 3]);
    if (r() < 0.8) noren(dx, dw, hh * 0.82, hh * 0.38);
    if (r() < 0.45) lantern(left ? dx + dw + 2 * sc : dx - 2 * sc, hh * 0.66, 1.8 * sc);
    var nw = Math.max(1, Math.round(w / (16 * sc))); for (k = 0; k < nw; k++) win((k + 0.5) * w / nw - w * 0.3 / nw, hh * 1.2, w * 0.6 / nw, hh * 0.3, wallC === '#8A6448' ? 2 : 1);
    // the pent roof between the floors, its shadow on the shop front under it
    g = o.createLinearGradient(0, Q(0, hh, 0)[1], 0, Q(0, hh * 0.7, 0)[1]); g.addColorStop(0, dk ? 'rgba(4,4,20,0.5)' : 'rgba(30,20,30,0.38)'); g.addColorStop(1, 'rgba(30,20,30,0)'); o.fillStyle = g; japan_poly(o, [Q(0, hh * 0.7, 0), Q(w, hh * 0.7, 0), Q(w, hh, 0), Q(0, hh, 0)]); o.fill();
    japan_poly(o, [Q(-0.6 * sc, hh + 2.2 * sc, 0), Q(w + 0.6 * sc, hh + 2.2 * sc, 0), Q(w + 0.6 * sc, hh - 0.2 * sc, -3.4 * sc), Q(-0.6 * sc, hh - 0.2 * sc, -3.4 * sc)], K(ROOF));
    o.strokeStyle = K(ROOF, 0.3); o.lineWidth = 0.35 * sc; o.beginPath(); for (k = 1.4 * sc; k < w; k += 1.4 * sc) { var t0 = Q(k, hh + 2.2 * sc, 0), t1 = Q(k, hh - 0.2 * sc, -3.4 * sc); o.moveTo(t0[0], t0[1]); o.lineTo(t1[0], t1[1]); } o.stroke();
    japan_poly(o, [Q(w + 0.6 * sc, hh + 2.2 * sc, 0), Q(w + 0.6 * sc, hh - 0.2 * sc, -3.4 * sc), Q(w + 0.6 * sc, hh - 1 * sc, -3.4 * sc), Q(w + 0.6 * sc, hh + 1.4 * sc, 0)], K(ROOF, 0.45));
    japan_path(o, [Q(-0.6 * sc, hh - 0.6 * sc, -3.4 * sc), Q(w + 0.6 * sc, hh - 0.6 * sc, -3.4 * sc)], K('#2E3044'), 0.8 * sc);
  } else { // a single storey: dark timber frame, plaster, shoji windows, sometimes a door with noren
    var nw2 = Math.max(1, Math.round(w / (14 * sc))), door = r() < 0.4;
    for (k = 0; k < nw2; k++) { if (door && k === nw2 - 1) { var ddx = (k + 0.5) * w / nw2 - 2.6 * sc; rect(ddx, 0, ddx + 5.2 * sc, hgt * 0.74, K('#2A2022')); noren(ddx, 5.2 * sc, hgt * 0.74, hgt * 0.32); continue; }
      win((k + 0.5) * w / nw2 - w * 0.3 / nw2, hgt * 0.24, w * 0.6 / nw2, hgt * 0.46, r() < 0.7 ? 0 : 2); }
    japan_path(o, [Q(0, hgt * 0.84, 0), Q(w, hgt * 0.84, 0)], K(WOOD), 0.8 * sc);
  }
  // timber posts at the corners
  if (!kura) { rect(0, 0, 1.1 * sc, hgt, K(WOOD)); rect(w - 1.1 * sc, 0, w, hgt, K(WOOD, 0.1)); }
  // the eave's shadow on the top of the front
  g = o.createLinearGradient(0, Q(0, hgt, 0)[1], 0, Q(0, hgt - 4 * sc, 0)[1]); g.addColorStop(0, dk ? 'rgba(4,4,20,0.55)' : 'rgba(30,20,30,0.4)'); g.addColorStop(1, 'rgba(30,20,30,0)');
  o.fillStyle = g; japan_poly(o, [Q(0, hgt - 4 * sc, 0), Q(w, hgt - 4 * sc, 0), Q(w, hgt, 0), Q(0, hgt, 0)]); o.fill();
  // the roof: the front slope lit, the hipped end or the back slope's edge in shade, tile channels, eave tiles, the ridge
  var RL = K(ROOF), RS = K(ROOF, 0.36), RD = K('#2C3044'), n = 12, eave = [], lf = [], rt = [], ridge;
  var lift = function (u) { return 1.2 * sc * Math.pow(Math.abs(2 * u - 1), 4); };
  for (i = 0; i <= n; i++) eave.push(Q(-ov + (w + 2 * ov) * i / n, he + lift(i / n), -o2));
  var rx0 = hip ? -ov + (rz + o2) * 0.95 : -ov, rx1 = hip ? w + ov - (rz + o2) * 0.95 : w + ov; if (rx1 < rx0 + 2 * sc) { rx0 = w / 2 - 1 * sc; rx1 = w / 2 + 1 * sc; }
  var side = function (xe, xr, t, z1) { return Q(xe + (xr - xe) * t, he + 1.2 * sc + (hr - he - 1.2 * sc) * Math.pow(t, 1.35), -o2 + (z1 + o2) * t); };
  for (i = 0; i <= 8; i++) { rt.push(side(w + ov, rx1, i / 8, rz)); lf.unshift(side(-ov, rx0, i / 8, rz)); }
  ridge = [Q(rx1, hr, rz), Q(rx0, hr, rz)];
  // the eave's underside along the side wall, and on a gable the end of the roof from the ridge to the back eave, so no
  // background shows between the roof's edge (which overhangs) and the wall under it
  japan_poly(o, [Q(w, hgt - 0.3 * sc, 0), Q(w + ov, he + 1.2 * sc, -o2), Q(w + ov, he + 1.2 * sc, d + o2), Q(w, hgt - 0.3 * sc, d)], K(ROOF, 0.55));
  if (!hip) japan_poly(o, [Q(w + ov, hr, rz), Q(w + ov, he + 1.2 * sc, d + o2), Q(w, hgt - 0.3 * sc, d), Q(w, hr - 0.6 * sc, rz)], RS);
  if (hip) { var bk = []; for (i = 0; i <= 8; i++) bk.push(Q(w + ov + (rx1 - w - ov) * (1 - i / 8), he + 1.2 * sc + (hr - he - 1.2 * sc) * Math.pow(1 - i / 8, 1.35), d + o2 - (d + o2 - rz) * (1 - i / 8)));
    japan_poly(o, [Q(w + ov, he + 1.2 * sc, -o2)].concat(bk.reverse(), rt.slice().reverse()), RS); }
  else japan_poly(o, [Q(w + ov, hr, rz), Q(w + ov, he + 1.2 * sc, d + o2), Q(w + ov - 1.6 * sc, he + 1.2 * sc, d + o2)], RS);
  var fr = eave.concat(rt, ridge, lf); japan_poly(o, fr, RL);
  o.save(); japan_poly(o, fr); o.clip(); o.strokeStyle = dk ? 'rgba(6,6,20,0.32)' : 'rgba(20,24,44,0.28)'; o.lineWidth = Math.max(0.3, 0.45 * sc); o.beginPath();
  for (k = 1.5 * sc; k < w + 2 * ov; k += 1.5 * sc) { var e0 = Q(-ov + k, he, -o2), e1 = Q(Math.max(rx0, Math.min(rx1, -ov + k)), hr, rz); o.moveTo(e0[0], e0[1] + 1); o.lineTo(e1[0], e1[1]); } o.stroke();
  var gr = o.createLinearGradient(0, ridge[0][1], 0, eave[0][1]); gr.addColorStop(0, dk ? 'rgba(150,160,230,0.12)' : 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); o.fillStyle = gr; japan_poly(o, fr); o.fill(); o.restore();
  if (!hip) japan_path(o, rt.concat([Q(w + ov, he + 0.6 * sc, d + o2)]), RD, 0.9 * sc); else { japan_path(o, rt, RD, 0.9 * sc); japan_path(o, lf, RD, 0.9 * sc); }
  japan_path(o, eave.map(function (p) { return [p[0], p[1] + 0.4 * sc]; }), RD, 0.8 * sc);
  o.fillStyle = dk ? K('#A8B0CC') : japan_mix(ROOF, '#FFFFFF', 0.3); for (k = 0; k <= w + 2 * ov; k += 1.5 * sc) { var ep = Q(-ov + k, he + lift(k / (w + 2 * ov)), -o2); o.beginPath(); o.arc(ep[0], ep[1] - 0.2 * sc, 0.42 * sc, 0, 7); o.fill(); }
  japan_path(o, ridge, RD, (kura ? 2.2 : 1.7) * sc); ridge.forEach(function (p) { japan_poly(o, [[p[0] - 0.9 * sc, p[1] + 0.4 * sc], [p[0] + 0.9 * sc, p[1] + 0.4 * sc], [p[0] + 1.1 * sc, p[1] - 2 * sc], [p[0] - 0.7 * sc, p[1] - 1.6 * sc]], RD); });
  return [x - ov - 1, ridge[0][1] - 3 * sc, x + w + ov + (d + o2) * kx + 1, yb]; }

// a small castle keep on its curved stone base, far off behind the town: white walls, three tiers of dark roofs, gables and gold
// shachihoko on the top ridge; windows go to wins
function japan_castle(o, K, sh, cx, yb, s, wins) { var kx = 0.34, ky = 0.16, i;
  var P = function (X, Y, Z) { return [cx + X + Z * kx, yb - Y - Z * ky]; };
  var rc = {roof: K('#4E586E'), side: K('#4E586E', 0.36), line: 'rgba(20,24,44,0.25)', ridge: K('#2C3044'), hl: 'rgba(255,255,255,0.25)', fas: K('#F2EEE6'), fasS: K('#F2EEE6', 0.32), under: K('#C8C2B8', 0.3), underS: K('#C8C2B8', 0.5), raft: K('#8A847C'), dot: null};
  // its shadow on the town behind, then the stone base with its curved batter
  japan_poly(o, [P(30 * s, 0, -20 * s), P(64 * s, 0, 0), P(64 * s, 0, 40 * s), P(30 * s, 0, 20 * s)], sh);
  var base = function (X, Z, y) { var f = 1 - 0.18 * Math.pow(y / 14, 1.6); return P(X * f, y * s, Z * f); }, fr = [], sd = [];
  for (i = 0; i <= 8; i++) { fr.push(base(-30 * s, -20 * s, 14 * i / 8)); sd.unshift(base(30 * s, -20 * s, 14 * i / 8)); } japan_poly(o, fr.concat(sd), K('#B4AA9A'));
  fr = []; sd = []; for (i = 0; i <= 8; i++) { fr.push(base(30 * s, -20 * s, 14 * i / 8)); sd.unshift(base(30 * s, 20 * s, 14 * i / 8)); } japan_poly(o, fr.concat(sd), K('#B4AA9A', 0.35));
  o.strokeStyle = K('#8A8070'); o.lineWidth = 0.35 * s; o.beginPath(); for (i = 1; i < 6; i++) { var a = base(-30 * s, -20 * s, 14 * i / 6), b = base(30 * s, -20 * s, 14 * i / 6); o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); } o.stroke();
  var tiers = [[24, 15, 14, 12], [17, 11, 30, 10], [11, 7.5, 44, 9]];
  tiers.forEach(function (t, n) { var hx = t[0] * s, hz = t[1] * s, h = t[3] * s, Y = t[2] * s, j;
    japan_poly(o, [P(-hx, Y, -hz), P(hx, Y, -hz), P(hx, Y + h, -hz), P(-hx, Y + h, -hz)], K('#F6F2EA')); japan_poly(o, [P(hx, Y, -hz), P(hx, Y, hz), P(hx, Y + h, hz), P(hx, Y + h, -hz)], K('#F6F2EA', 0.32));
    var nw = n === 2 ? 3 : 4; for (j = 0; j < nw; j++) { var wp = P(-hx + (j + 0.5) * 2 * hx / nw - 1.2 * s, Y + h * 0.75, -hz); o.fillStyle = K('#2E2A30'); o.fillRect(wp[0], wp[1], 2.4 * s, h * 0.4); wins.push([wp[0], wp[1], 2.4 * s, h * 0.4, 0.3 + j * 0.1 + n * 0.05, 2]); }
    var g = o.createLinearGradient(0, P(0, Y + h, -hz)[1], 0, P(0, Y + h * 0.4, -hz)[1]); g.addColorStop(0, 'rgba(30,30,50,0.35)'); g.addColorStop(1, 'rgba(30,30,50,0)'); o.fillStyle = g; japan_poly(o, [P(-hx, Y + h * 0.4, -hz), P(hx, Y + h * 0.4, -hz), P(hx, Y + h, -hz), P(-hx, Y + h, -hz)]); o.fill();
    var top = n < 2 ? tiers[n + 1][2] * s : Y + h + 9 * s;
    japan_hip(o, P, hx + 6 * s, hz + 6 * s, Y + h + 0.6 * s, n < 2 ? tiers[n + 1][0] * s + 1 * s : 3 * s, n < 2 ? tiers[n + 1][1] * s + 1 * s : 1 * s, top, 2.6 * s, 1.3 * s, hx, hz, Y + h, s * 0.6, rc);
    // a gable on the front of the lower roofs, gold shachihoko on the top ridge
    if (n < 2) { var gp = P(0, Y + h + 0.6 * s, -hz - 6 * s), gt = P(0, Y + h + 8 * s, -hz - 3 * s); japan_poly(o, [[gp[0] - 6 * s, gp[1] - 1 * s], gt, [gp[0] + 6 * s, gp[1] - 1 * s]], K('#F6F2EA')); japan_path(o, [[gp[0] - 7.4 * s, gp[1] - 0.2 * s], gt, [gp[0] + 7.4 * s, gp[1] - 0.2 * s]], K('#2C3044'), 1.2 * s); }
    else { o.fillStyle = K('#E2B04A'); [P(-3 * s, top, -1 * s), P(3 * s, top, -1 * s)].forEach(function (p) { o.beginPath(); o.ellipse(p[0], p[1] - 1.4 * s, 0.9 * s, 1.6 * s, 0, 0, 7); o.fill(); }); }
  }); }

// the drum bridge over the river: far piers and the far railing seen through, the plank deck with its cleats, the near beam
// with the shadowed girders under it, the near piers on stone footings (tied across), the near railing with bronze-capped
// newel posts, and (shadow: true) its shadow on the water. B: {x0, x1, y (the bank line at its feet), ah (arch rise), S}
function japan_bridgeGeo(B) { var S = B.S; return {Dw: 15 * S, kx: 0.32, ky: 0.46, T: 6 * S, RH: 13 * S, WL: -4 * S}; }
function japan_paintBridge(o, B, dk, shadow) {
  var S = B.S, x0 = B.x0, bL = B.x1 - B.x0, y0 = B.y, ah = B.ah, G = japan_bridgeGeo(B), Dw = G.Dw, kx = G.kx, ky = G.ky, T = G.T, RH = G.RH, WL = G.WL, K = japan_tone(dk, 0), i, u, a, b;
  var RED = '#DA452E', Yf = function (u) { return ah * (1 - Math.pow(2 * u - 1, 2)); };
  var Q = function (X, Y, Z) { return [x0 + X + Z * kx, y0 - Y - Z * ky]; }, U = function (u, dy, Z) { return Q(bL * u, Yf(u) + dy, Z); };
  var n = 48, PU = [0.13, 0.25, 0.37, 0.5, 0.63, 0.75, 0.87], RU = [];
  for (i = 0; i <= 14; i++) RU.push(0.025 + i / 14 * 0.95);
  if (shadow) { // its shadow on the water, falling toward us and to the right
    var sp = function (u, dy, Z) { var Y = Yf(u) + dy; return Q(bL * u + Y * 0.3, WL, Z - Y * 0.5); }, A = [], Bk = [];
    for (i = 0; i <= n; i++) { A.push(sp(i / n, 0, 0)); Bk.unshift(sp(i / n, 0, Dw)); } o.fillStyle = dk ? 'rgba(4,4,24,0.3)' : 'rgba(24,46,90,0.2)'; japan_poly(o, A.concat(Bk)); o.fill();
    o.strokeStyle = o.fillStyle; o.lineWidth = 1.6 * S; A = []; for (i = 0; i <= n; i++) A.push(sp(0.02 + i / n * 0.96, RH, 0)); japan_path(o, A); o.stroke();
    o.lineWidth = 1.2 * S; o.beginPath(); RU.forEach(function (u) { var a = sp(u, 0, 0), b = sp(u, RH, 0); o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); }); o.stroke(); }
  // the far piers and the far railing, in shade
  PU.forEach(function (u) { var X = bL * u, top = Yf(u) - T, Z = Dw - 2 * S; if (top > WL + 1) japan_poly(o, [Q(X - 1.6 * S, WL, Z), Q(X + 1.6 * S, WL, Z), Q(X + 1.6 * S, top, Z), Q(X - 1.6 * S, top, Z)], K(RED, 0.55)); });
  var tieY = ah * 0.32, tie = function (Z, c, w) { var us = PU.filter(function (u) { return Yf(u) - T > tieY + 2 * S; }); if (us.length > 1) japan_path(o, [Q(bL * us[0] - 2 * S, tieY, Z), Q(bL * us[us.length - 1] + 2 * S, tieY, Z)], c, w); };
  tie(Dw - 2 * S, K(RED, 0.6), 1.6 * S);
  var rail = function (Z, c, cs, cap, hl) { var A, k;
    [2.6 * S, RH * 0.55].forEach(function (h) { A = []; for (k = 0; k <= n; k++) A.push(U(0.02 + k / n * 0.96, h, Z)); japan_path(o, A, cs, 1.1 * S); });
    RU.forEach(function (u, j) { var end = j === 0 || j === RU.length - 1, wd = (end ? 2 : 1.1) * S, X = bL * u, b = Yf(u), h = RH + (end ? 3.4 * S : 0.8 * S);
      japan_poly(o, [Q(X - wd, b, Z), Q(X + wd, b, Z), Q(X + wd, b + h, Z), Q(X - wd, b + h, Z)], c); japan_poly(o, [Q(X + wd * 0.3, b, Z), Q(X + wd, b, Z), Q(X + wd, b + h, Z), Q(X + wd * 0.3, b + h, Z)], cs);
      if (end) { var g = Q(X, b + h, Z); o.fillStyle = cap; o.beginPath(); o.moveTo(g[0] - 2.4 * S, g[1]); o.quadraticCurveTo(g[0] - 2.6 * S, g[1] - 3.2 * S, g[0], g[1] - 4.6 * S); o.quadraticCurveTo(g[0] + 2.6 * S, g[1] - 3.2 * S, g[0] + 2.4 * S, g[1]); o.closePath(); o.fill();
        o.beginPath(); o.arc(g[0], g[1] - 5.2 * S, 0.8 * S, 0, 7); o.fill(); } });
    A = []; for (k = 0; k <= n; k++) A.push(U(0.02 + k / n * 0.96, RH, Z)); japan_path(o, A, c, 2.2 * S); japan_path(o, A.map(function (p) { return [p[0], p[1] - 0.6 * S]; }), hl, 0.6 * S); };
  rail(Dw, K(RED, 0.36), K(RED, 0.52), K('#9A7A3A', 0.35), K(RED, 0.25));
  // the deck: planks with cleats, lit on the rising half and shaded on the falling half
  var top = [], far = []; for (i = 0; i <= n; i++) { top.push(U(i / n, 0, 0)); far.unshift(U(i / n, 0, Dw)); }
  japan_poly(o, top.concat(far), K('#A27454')); o.save(); japan_poly(o, top.concat(far)); o.clip();
  var gd = o.createLinearGradient(x0, 0, x0 + bL, 0); gd.addColorStop(0, 'rgba(255,240,220,0.18)'); gd.addColorStop(0.5, 'rgba(255,240,220,0)'); gd.addColorStop(0.52, 'rgba(30,10,20,0.08)'); gd.addColorStop(1, 'rgba(30,10,20,0.3)'); o.fillStyle = gd; o.fill();
  o.strokeStyle = K('#6A4636'); o.lineWidth = 0.5 * S; o.beginPath(); for (i = 1; i < 70; i++) { u = i / 70; a = U(u, 0, 0); b = U(u, 0, Dw); o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); } o.stroke();
  o.strokeStyle = K('#5A3A2C'); o.lineWidth = 0.9 * S; o.beginPath(); for (i = 1; i < 26; i++) { u = i / 26; if (Math.abs(u - 0.5) < 0.17) continue; a = U(u, 0.4 * S, 0.4 * S); b = U(u, 0.4 * S, Dw - 0.4 * S); o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); } o.stroke(); o.restore();
  // the girders under the deck, in its shadow, with the joist ends showing
  var gA = [], gB = [], gs = 3.4 * S; for (i = 0; i <= n; i++) { u = i / n; gA.push(U(u, -T, 0)); gB.unshift(Q(bL * u, Math.max(WL, Yf(u) - T - gs), 0.8 * S)); }
  japan_poly(o, gA.concat(gB), K('#6A2018', 0.25));
  o.fillStyle = K('#E8B070', 0.4); for (i = 1; i < 20; i++) { u = i / 20; if (Yf(u) - T - gs * 0.6 < WL) continue; var jp = U(u, -T - gs * 0.55, 0); o.fillRect(jp[0] - 0.6 * S, jp[1] - 0.6 * S, 1.2 * S, 1.2 * S); }
  // the near piers on their stone footings
  PU.forEach(function (u) { var X = bL * u; if (Yf(u) - T < WL + 1) return; var f0 = Q(X - 3.2 * S, WL - 1 * S, -1 * S);
    japan_poly(o, [Q(X - 3.2 * S, WL - 1 * S, -1 * S), Q(X + 3.2 * S, WL - 1 * S, -1 * S), Q(X + 3.2 * S, WL + 2.2 * S, -1 * S), Q(X - 3.2 * S, WL + 2.2 * S, -1 * S)], K('#B8B0A2'));
    japan_poly(o, [Q(X - 3.2 * S, WL + 2.2 * S, -1 * S), Q(X + 3.2 * S, WL + 2.2 * S, -1 * S), Q(X + 3.2 * S, WL + 2.2 * S, 2.4 * S), Q(X - 3.2 * S, WL + 2.2 * S, 2.4 * S)], K('#D8D0C2'));
    japan_poly(o, [Q(X + 3.2 * S, WL - 1 * S, -1 * S), Q(X + 3.2 * S, WL - 1 * S, 2.4 * S), Q(X + 3.2 * S, WL + 2.2 * S, 2.4 * S), Q(X + 3.2 * S, WL + 2.2 * S, -1 * S)], K('#B8B0A2', 0.35));
    if (shadow) { o.strokeStyle = dk ? 'rgba(200,210,255,0.25)' : 'rgba(255,255,255,0.7)'; o.lineWidth = 0.6 * S; o.beginPath(); o.ellipse(f0[0] + 3.6 * S, f0[1] + 0.6 * S, 5.4 * S, 1.3 * S, 0, 0, 7); o.stroke(); }
    var bt = Yf(u) - T - gs * 0.4; japan_poly(o, [Q(X - 1.9 * S, WL + 2 * S, 0), Q(X + 1.9 * S, WL + 2 * S, 0), Q(X + 1.9 * S, bt, 0), Q(X - 1.9 * S, bt, 0)], K(RED, 0.08));
    japan_poly(o, [Q(X + 0.6 * S, WL + 2 * S, 0), Q(X + 1.9 * S, WL + 2 * S, 0), Q(X + 1.9 * S, bt, 0), Q(X + 0.6 * S, bt, 0)], K(RED, 0.38));
    var gg = o.createLinearGradient(0, Q(0, bt, 0)[1], 0, Q(0, bt - 6 * S, 0)[1]); gg.addColorStop(0, 'rgba(40,10,10,0.4)'); gg.addColorStop(1, 'rgba(40,10,10,0)'); o.fillStyle = gg; japan_poly(o, [Q(X - 1.9 * S, bt - 6 * S, 0), Q(X + 1.9 * S, bt - 6 * S, 0), Q(X + 1.9 * S, bt, 0), Q(X - 1.9 * S, bt, 0)]); o.fill(); });
  tie(-0.2 * S, K(RED, 0.12), 1.8 * S);
  // the near beam (the deck's edge), with a bright top edge and bronze fittings
  var bm = [], bb = []; for (i = 0; i <= n; i++) { bm.push(U(i / n, 0, 0)); bb.unshift(U(i / n, -T, 0)); } japan_poly(o, bm.concat(bb), K(RED));
  o.save(); japan_poly(o, bm.concat(bb)); o.clip(); var gb = o.createLinearGradient(x0, 0, x0 + bL, 0); gb.addColorStop(0, 'rgba(255,230,200,0.12)'); gb.addColorStop(0.5, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(40,0,10,0.18)'); o.fillStyle = gb; o.fill(); o.restore();
  japan_path(o, bm, K('#F48A6A', dk ? 0.2 : 0), 0.7 * S); japan_path(o, bb.slice().reverse().map(function (p) { return [p[0], p[1] - 0.3 * S]; }), K('#7A2418'), 0.6 * S);
  o.fillStyle = K('#C8963A', 0.1); for (i = 0; i <= 8; i++) { u = 0.04 + i / 8 * 0.92; var cp = U(u, -T * 0.5, -0.1 * S); o.fillRect(cp[0] - 1.1 * S, cp[1] - T * 0.42, 2.2 * S, T * 0.84); }
  // the near railing
  rail(-0.2 * S, K(RED), K(RED, 0.3), K('#C8963A', 0.05), K('#F48A6A', dk ? 0.2 : 0)); }

// the town: rows of houses from the back (small, hazy) to the front, trees among them, the castle at the back. T: the scene's
// layout; which: 'back' (the rows behind the koinobori pole, and the castle) or 'front' (the rest, the riverside lane of trees
// and the teahouse). Adds to out.wins / out.lamps the windows and lanterns that nothing painted later covers.
function japan_paintTown(o, T, dk, W, H, S, ph, which, out) {
  var rows = T.rows, items = [], wins = [], lamps = [], cast = T.castle, ROOFS = ['#59627A', '#535C74', '#5E667C', '#4F5870', '#6A6670'];
  var sh = function (hz) { return dk ? 'rgba(6,6,26,' + (0.3 * (1 - hz)).toFixed(3) + ')' : 'rgba(40,40,80,' + (0.2 * (1 - hz)).toFixed(3) + ')'; };
  var take = function (wb, lb) { var m = items.length - 1; wb.forEach(function (w) { w.n = m; wins.push(w); }); (lb || []).forEach(function (l) { l.n = m; lamps.push(l); }); };
  // where row rr's street starts: its first house (the trees and the castle aside)
  var firstHouse = function (rr) { var sc = S * (0.5 + rr * (ph ? 0.15 : 0.13)), yb = H * rows[rr], px0 = T.tx0 + (rr % 2) * 18 * sc - rr * W * 0.02;
    for (var pn = 0; px0 < W + 40; pn++) { var phw = (34 + hash(rr * 40 + pn) * 26) * sc;
      if (!(rr === 0 && px0 + phw > cast[0] - 34 * S && px0 < cast[0] + 44 * S) && yb < japan_yAt(T.Urev, px0 + phw / 2) - 4 && yb < japan_yAt(T.Urev, px0 - 4) - 2 && !(px0 < T.hx1 && yb < japan_yAt(T.HL, px0 + phw / 2) + 8) && !T.hillT.some(function (c) { return Math.abs(px0 + phw / 2 - c[0]) < c[2] * 1.05 + phw * 0.4 && yb < c[1] + c[2] * 0.35; }) && hash(rr * 40 + pn + 0.3) >= 0.18 && hash(rr * 40 + pn + 0.4) >= 0.14) return px0;
      px0 += phw + (6 + hash(rr * 9 + pn) * 16) * sc; }
    return W + 40; };
  rows.forEach(function (ry, r) { var sc = S * (0.5 + r * (ph ? 0.15 : 0.13)), yb = H * ry, xx = T.tx0 + (r % 2) * 18 * sc - r * W * 0.02, n = 0, hz = Math.max(0, 0.42 - r * 0.11);
    if ((which === 'back') !== (yb <= T.kp[1] + 2)) return;
    var K = japan_tone(dk, hz);
    /* the gap after the n-th house, opened up wide where an alley runs through to the street behind (none from row 0):
       two per row, a third and two thirds of the way along the gaps where both streets run */
    var gap0 = function (n2) { return (6 + hash(r * 9 + n2) * 16) * sc; }, AL = {};
    var stOK = function (x2, y2) { return y2 + 1 < japan_yAt(T.Urev, x2) - 3 * sc && !(x2 < T.hx1 && y2 < japan_yAt(T.HL, x2) + 8) && !T.hillT.some(function (c) { return Math.abs(x2 - c[0]) < c[2] * 1.1 && y2 < c[1] + c[2] * 0.6; }); };
    if (r > 0) { var yP0 = H * rows[r - 1], cand = []; for (var cx0 = xx, cn = 0; cx0 < W + 40; cn++) { var chw = (34 + hash(r * 40 + cn) * 26) * sc, cgx = cx0 + chw + gap0(cn) / 2;
        if (cgx > Math.max(firstHouse(r), firstHouse(r - 1)) + 16 * sc && stOK(cgx - 12 * sc, yb) && stOK(cgx + 12 * sc, yb) && stOK(cgx - 12 * sc, yP0 + (yb - yP0) * 0.42) && stOK(cgx + 12 * sc, yP0 + (yb - yP0) * 0.42)) cand.push(cn); cx0 += chw + gap0(cn); }
      if (cand.length > 1) { AL[cand[Math.floor(cand.length / 3)]] = 1; AL[cand[Math.floor(cand.length * 2 / 3)]] = 1; } }
    var alleyAt = function (n2) { return !!AL[n2]; }, gapAt = function (n2) { return gap0(n2) + (alleyAt(n2) ? 22 * sc : 0); };
    // the street this row of houses fronts onto: laid before the row (and so under it and under every nearer row), running
    // from the hill's foot to the river bank
    var gapY = H * ((rows[r + 1] || ry + 0.034) - ry), stH = gapY * 0.42, top = [], bot = [];
    /* it starts at the row's first house (so it never stops short out on the hillside) */
    var sx0 = W + 40; for (var px0 = xx, pn = 0; px0 < W + 40 && sx0 > W; pn++) { var phw = (34 + hash(r * 40 + pn) * 26) * sc;
      if (!(r === 0 && px0 + phw > cast[0] - 34 * S && px0 < cast[0] + 44 * S) && yb < japan_yAt(T.Urev, px0 + phw / 2) - 4 && yb < japan_yAt(T.Urev, px0 - 4) - 2 && !(px0 < T.hx1 && yb < japan_yAt(T.HL, px0 + phw / 2) + 8) && !T.hillT.some(function (c) { return Math.abs(px0 + phw / 2 - c[0]) < c[2] * 1.05 + phw * 0.4 && yb < c[1] + c[2] * 0.35; }) && hash(r * 40 + pn + 0.3) >= 0.18 && hash(r * 40 + pn + 0.4) >= 0.14) sx0 = px0 + 2 * sc; /* (a house, not one of the trees) */
      px0 += phw + gapAt(pn); }
    for (var sx = sx0; sx < W + 40; sx += 6) { var bk = japan_yAt(T.Urev, sx) - 3 * sc; if (yb + 1 > bk || (sx < T.hx1 && yb < japan_yAt(T.HL, sx) + 8) || T.hillT.some(function (c) { return Math.abs(sx - c[0]) < c[2] * 1.1 && yb < c[1] + c[2] * 0.6; })) { if (top.length > 1) japan_poly(o, top.concat(bot), K('#D8CCB2')); top = []; bot = []; continue; }
      top.push([sx, yb - 4 * sc]) /* (up under the houses, which sit as much as 3sc above the row line) */; bot.unshift([sx, Math.min(yb + stH, bk)]); }
    if (top.length > 1) japan_poly(o, top.concat(bot), K('#D8CCB2'));
    // alleys up through some of the gaps between this row's houses to the street behind
    if (r > 0) { var yP = H * rows[r - 1], stP = (yb - yP) * 0.42, scP = S * (0.5 + (r - 1) * (ph ? 0.15 : 0.13));
      for (var ax = xx, an = 0; ax < W + 40; an++) { var ahw = (34 + hash(r * 40 + an) * 26) * sc, agap = gapAt(an), gx = ax + ahw + agap * 0.58, aw = Math.min(agap * 0.5, 13 * sc); /* (a little right of centre, clear of the house's side face and eaves) */
        if (alleyAt(an) && gx > sx0 && stOK(gx - aw, yb) && stOK(gx + aw, yb) && stOK(gx - aw, yP + stP) && stOK(gx + aw, yP + stP))
          japan_poly(o, [[gx - aw / 2, yb + 1 * sc], [gx + aw / 2, yb + 1 * sc], [gx + aw * 0.4, yP + stP - 1 * scP], [gx - aw * 0.4, yP + stP - 1 * scP]], K('#D8CCB2'));
        ax += ahw + agap; } }
    if (which === 'front' && r === rows.length - 1) {
      // the lane from the front street down to the bridge's foot
      var bxF = T.bridgeX + 4 * S, byF = T.bridgeY, lx0 = bxF - (ph ? 40 : 70) * S, lyT = yb + stH * 0.5, wl = function (u) { return (9 + 9 * u) * S; }, L1 = [], L2 = [];
      for (var u = 0; u <= 1.001; u += 0.1) { var lx = lx0 + (bxF - lx0) * (u * u * (3 - 2 * u)), ly = lyT + (byF - lyT) * u; L1.push([lx - wl(u) / 2, ly]); L2.unshift([lx + wl(u) / 2, ly]); }
      japan_poly(o, L1.concat(L2), K('#D8CCB2')); }
    if (r === 0) { var cs = S * (ph ? 0.55 : 0.78), wb = []; japan_castle(o, japan_tone(dk, hz + 0.06), sh(hz), cast[0], cast[1], cs, wb); items.push({box: [cast[0] - 32 * cs, cast[1] - 58 * cs, cast[0] + 44 * cs, cast[1]]}); take(wb); }
    while (xx < W + 40) { var hw = (34 + hash(r * 40 + n) * 26) * sc, hh = (18 + hash(r * 40 + n + 0.5) * 8) * sc, two = hash(r * 40 + n + 0.7) < 0.32, kura = hash(r * 40 + n + 0.9) < 0.12, gap = gapAt(n);
      var nearCastle = r === 0 && xx + hw > cast[0] - 34 * S && xx < cast[0] + 44 * S;
      if (!nearCastle && yb < japan_yAt(T.Urev, xx + hw / 2) - 4 && yb < japan_yAt(T.Urev, xx - 4) - 2 && !(xx < T.hx1 && yb < japan_yAt(T.HL, xx + hw / 2) + 8)) {
        var cx = xx + hw / 2, yb2 = yb - hash(r * 40 + n + 0.8) * 3 * sc;
        if (T.hillT.some(function (c) { return Math.abs(cx - c[0]) < c[2] * 1.05 + hw * 0.4 && yb < c[1] + c[2] * 0.35; })) { xx += hw + gap; n++; continue; }
        if (hash(r * 40 + n + 0.3) < 0.18) { japan_tree(o, K, cx, yb2, hh * 0.85, false, sh(hz)); items.push({box: [cx - hh, yb2 - hh * 1.9, cx + hh, yb2]}); }
        else if (hash(r * 40 + n + 0.4) < 0.14) { japan_tree(o, K, cx, yb2, hh * 0.8, true, sh(hz)); items.push({box: [cx - hh, yb2 - hh * 1.8, cx + hh, yb2]}); }
        else { var wb2 = [], lb = [], box = japan_house(o, K, sh(hz), {x: xx, yb: yb2, w: hw, hh: hh, sc: sc, two: two, kura: kura, hip: !kura && hash(r * 40 + n + 0.6) < 0.32, seed: r * 97 + n, roof: ROOFS[Math.floor(hash(r * 13 + n * 3.7) * ROOFS.length)]}, wb2, lb, dk);
          items.push({box: box}); take(wb2, lb); }
      }
      xx += hw + gap; n++; }
  });
  if (which === 'front') { var K0 = japan_tone(dk, 0), bx = T.bank, tea = T.tea;
    // the lane of trees along the river bank, and the teahouse among them with a red bench and a parasol
    for (var x = bx[0]; x < Math.min(bx[1], T.bridgeX - ((ph ? 40 : 70) + 22) * S); /* (clear of the lane to the bridge) */ x += (ph ? 20 : 30) * S) { if (Math.abs(x - tea[0] + 22 * S) < 52 * S) continue; var by = japan_yAt(T.Urev, x) - 4 * S, tr = (9 + hash(x) * 7) * S;
      if (by < H * 0.95) { japan_tree(o, K0, x, by + tr * 0.1, tr, hash(x + 1) < 0.35, sh(0)); items.push({box: [x - tr * 1.3, by - tr * 2, x + tr * 1.3, by]}); } }
    if (tea[1] > H * 0.7) { var wb3 = [], lb3 = [], tb = japan_house(o, K0, sh(0), {x: tea[0] - 60 * S, yb: tea[1] + 10 * S, w: 76 * S, hh: 26 * S, sc: S * 1.45, hip: true, tea: true, seed: 5, roof: '#56607A'}, wb3, lb3, dk);
      items.push({box: tb}); take(wb3, lb3);
      var px = tea[0] - 76 * S, py = tea[1] + 12 * S; o.fillStyle = sh(0); o.beginPath(); o.ellipse(px + 6 * S, py, 14 * S, 2.6 * S, 0, 0, 7); o.fill();
      japan_poly(o, [[px - 8 * S, py - 4 * S], [px + 8 * S, py - 4 * S], [px + 10 * S, py - 6 * S], [px - 6 * S, py - 6 * S]], K0('#E04A34')); japan_poly(o, [[px - 8 * S, py - 4 * S], [px + 8 * S, py - 4 * S], [px + 8 * S, py - 2.6 * S], [px - 8 * S, py - 2.6 * S]], K0('#A8301E'));
      o.fillStyle = K0('#3A2A24'); o.fillRect(px - 7 * S, py - 2.6 * S, 1 * S, 2.6 * S); o.fillRect(px + 6 * S, py - 2.6 * S, 1 * S, 2.6 * S);
      japan_path(o, [[px + 2 * S, py - 3 * S], [px + 3 * S, py - 26 * S]], K0('#4A3A30'), 0.8 * S);
      o.fillStyle = K0('#E04A34'); o.beginPath(); o.moveTo(px - 12 * S, py - 21 * S); o.quadraticCurveTo(px + 3 * S, py - 33 * S, px + 18 * S, py - 21 * S); o.quadraticCurveTo(px + 3 * S, py - 24 * S, px - 12 * S, py - 21 * S); o.fill();
      o.fillStyle = K0('#E04A34', 0.3); o.beginPath(); o.moveTo(px + 3 * S, py - 27.6 * S); o.quadraticCurveTo(px + 12 * S, py - 25 * S, px + 18 * S, py - 21 * S); o.quadraticCurveTo(px + 8 * S, py - 23.4 * S, px + 3 * S, py - 23 * S); o.fill(); } }
  // keep only the windows and lanterns nothing nearer covers
  var hid = function (p) { var cx = p[0] + (p[2] || 0) / 2, cy = p[1] + (p[3] || 0) / 2; for (var j = p.n + 1; j < items.length; j++) { var b = items[j].box; if (cx > b[0] && cx < b[2] && cy > b[1] && cy < b[3]) return true; } return false; };
  wins.forEach(function (w) { if (!hid(w)) out.wins.push(w); }); lamps.forEach(function (l) { if (!hid(l)) out.lamps.push(l); }); }

// ---------- Japan
// Loop: blossom petals drift on the breeze and settle on the river, the cherry branches sway, clouds slide across Fuji's
// shoulder, a grey heron wades by the bridge and the koinobori carp ripple on their pole in town. Night: the paper lanterns
// on the stair path glow, town windows light up, the moon rises beside Fuji and the river holds its reflection.
// Moment: Fuji's snowcap blushes pink in the alpenglow, a gust lifts a swirl of blossom off the trees, and a pair of
// red-crowned cranes flies across the mountain.
ENGINES.japan = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, C = A.C, M = A.moon, F = A.fuji, T0 = -99, i, gust = 0;
  var hx = japan_ctx();
  // the sky behind everything near: above the foothills and the pagoda hill, not over the pagoda
  var skyClip = new Path2D(), hp = A.horizon; skyClip.moveTo(hp[0][0], -60); hp.forEach(function (p) { skyClip.lineTo(p[0], p[1]); }); skyClip.lineTo(hp[hp.length - 1][0], -60); skyClip.closePath();
  var pt = A.ptop; skyClip.rect(pt[0], pt[1], pt[2] - pt[0], pt[3] - pt[1]);
  var river = new Path2D(japan_pg(A.river)), snow = new Path2D(japan_pg(F.snow)), fuji = new Path2D(japan_pg(F.body.concat([[F.body[F.body.length - 1][0], F.base], [F.body[0][0], F.base]])));
  var glowM = japan_rg(dk ? 'rgba(255,236,200,0.5)' : 'rgba(255,255,255,0.4)', [0.3, 0.22]), winG = japan_rg('rgba(255,196,110,0.55)', [0.35, 0.3]), lanG = japan_rg(dk ? 'rgba(255,170,90,0.75)' : 'rgba(255,200,140,0.4)', [0.3, 0.3]);
  var moonSpr = japan_sprite(M[2] * 2.2, M[2] * 2.2, 2, function (o) { var r = M[2], g = o.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFFF6'); g.addColorStop(0.75, '#FFF2D0'); g.addColorStop(1, '#F4DCA4'); o.fillStyle = g; o.beginPath(); o.arc(0, 0, r, 0, 7); o.fill();
    o.fillStyle = 'rgba(214,190,140,0.3)'; [[-0.3, -0.2, 0.2], [0.28, 0.22, 0.16], [0.05, -0.45, 0.1], [-0.15, 0.42, 0.12]].forEach(function (q) { o.beginPath(); o.arc(q[0] * r, q[1] * r, q[2] * r, 0, 7); o.fill(); }); });
  var CLD = japan_sprite(240, 56, 1.5, function (o) { o.fillStyle = dk ? 'rgba(150,146,200,0.75)' : 'rgba(255,255,255,0.9)'; [[-80, 8, 44, 10], [-26, 0, 54, 16], [34, 4, 50, 13], [88, 10, 28, 7], [0, 12, 100, 8]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); });
    o.fillStyle = dk ? 'rgba(220,200,240,0.3)' : 'rgba(255,236,242,0.7)'; o.beginPath(); o.ellipse(-20, -8, 44, 5, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (k) { return {x: F.x - F.bw * 0.8 + hash(k + 3) * F.bw * 1.8, y: F.top + F.hf * (0.32 + k * 0.1), s: (ph ? 0.6 : 1) * (0.75 + hash(k + 7) * 0.5), v: (5 + hash(k + 5) * 6) * (ph ? 0.6 : 1)}; });
  // the swaying branches: painted once into sprites, rotated about where they leave the edge
  var BR = A.branch, flowerCols = dk ? ['#D896BA', '#E8B0CC', '#C47EA8'] : ['#F7B4C8', '#FFD0DE', '#F29CB8'];
  function branchSprite(len, seed) { var sc = 2;
    return japan_sprite(len * 2.3, len * 1.0, sc, function (o) { o.translate(-len * 1.15, -len * 0.3);
      o.fillStyle = C.trunk; o.strokeStyle = C.trunk; o.lineCap = 'round';
      var limb = function (x0, y0, x1, y1, w0, w1, b) { var n = 12; for (var k = 0; k < n; k++) { var u = k / n, u2 = (k + 1) / n, bx = Math.sin(Math.PI * u) * b, bx2 = Math.sin(Math.PI * u2) * b; o.lineWidth = w0 + (w1 - w0) * u; o.beginPath(); o.moveTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + bx); o.lineTo(x0 + (x1 - x0) * u2, y0 + (y1 - y0) * u2 + bx2); o.stroke(); } };
      limb(0, 0, len, len * 0.2, 16 * S, 3 * S, -len * 0.06); /* the twigs start on the main limb's (bowed) centreline */ var on = function (u) { return len * (0.2 * u - 0.06 * Math.sin(Math.PI * u)); };
      limb(len * 0.35, on(0.35), len * 0.6, len * 0.32, 7 * S, 2 * S, len * 0.03); limb(len * 0.6, on(0.6), len * 0.85, len * 0.05, 5 * S, 1.6 * S, -len * 0.02); limb(len * 0.2, on(0.2), len * 0.32, len * 0.24, 5 * S, 1.6 * S, 4 * S);
      var spots = [[0.5, 0.17], [0.62, 0.3], [0.75, 0.2], [0.9, 0.2], [0.82, 0.07], [0.38, 0.12], [0.28, 0.2], [0.55, 0.08], [0.98, 0.21], [0.68, 0.12]];
      spots.forEach(function (q, n) { var cx = len * q[0], cy = len * q[1]; for (var k = 0; k < 9; k++) { var a = hash(seed + n * 9 + k) * 6.28, d = hash(seed + n * 5 + k * 3) * 16 * S; japan_flower(o, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, (6 + hash(seed + k + n) * 4) * S, a, flowerCols[k % 3], dk ? '#8A3A60' : '#D0507A'); } });
      for (var k = 0; k < 14; k++) { o.fillStyle = dk ? '#5A6A40' : '#8AB860'; o.save(); o.translate(len * (0.3 + hash(seed + k * 7) * 0.65), len * (0.1 + hash(seed + k * 3) * 0.2)); o.rotate(hash(k) * 6); o.beginPath(); o.ellipse(4 * S, 0, 4 * S, 1.8 * S, 0, 0, 7); o.fill(); o.restore(); }
    }); }
  var branches = [{x: BR.x, y: BR.y, len: BR.len, ang: 0.1, ph: 0, spr: branchSprite(BR.len, 11)}];
  if (!ph) branches.push({x: W + 12, y: -4, len: BR.len * 0.6, ang: Math.PI - 0.5, ph: 2, flip: true, spr: branchSprite(BR.len * 0.6, 29)});
  // petals: falling ones (on top), and ones that have landed and float downstream
  var fall = [], floatP = [], N = ph ? 22 : 42, trees = A.trees;
  function newPetal(top) { var tr = trees[Math.floor(Math.random() * trees.length)], fromBr = Math.random() < 0.45;
    var x = fromBr ? BR.x + Math.random() * BR.len : tr[0] + (Math.random() - 0.5) * tr[2] * 2, y = fromBr ? BR.y + Math.random() * BR.len * 0.25 : tr[1] + (Math.random() - 0.5) * tr[3];
    if (top) { x = Math.random() * W * 0.8; y = -10 - Math.random() * H * 0.3; }
    return {x: x, y: y, vx: 10 + Math.random() * 16, vy: 12 + Math.random() * 12, s: (ph ? 3 : 4) * S * (0.7 + Math.random() * 0.6), ph: Math.random() * 6.28, sp: 1 + Math.random() * 2, c: flowerCols[Math.floor(Math.random() * 3)], land: H * (0.82 + Math.random() * 0.16)}; }
  for (i = 0; i < N; i++) { var p0 = newPetal(i % 2 === 0); p0.y = Math.random() * H; p0.x = Math.random() * W; fall.push(p0); }
  for (i = 0; i < (ph ? 5 : 9); i++) floatP.push({x: A.U[Math.floor(hash(i + 2) * A.U.length)][0] + 30, y: A.U[Math.floor(hash(i + 2) * A.U.length)][1] + 14 + hash(i) * 30, age: hash(i + 5) * 10, s: (ph ? 3 : 4) * S, c: flowerCols[i % 3], rot: hash(i) * 6});
  // the heron
  var her = {x: A.heron[0], y: A.heron[1], dir: -1, step: 0, peck: 0, next: 4};
  function heron(c, t) { var s = (ph ? 0.4 : 0.5) * S, x = her.x, y = her.y, ph2 = Math.sin(her.step * 3.2), pk = japan_ease(Math.min(1, her.peck * 2)) * japan_ease(Math.min(1, (1 - her.peck) * 3)), d = her.dir;
    c.save(); c.translate(x, y); c.scale(d, 1); c.lineCap = 'round'; c.lineJoin = 'round';
    var grey = dk ? '#7A7C9A' : '#9AA2B4', dgrey = dk ? '#4E5070' : '#6A7084', wht = dk ? '#C8C8DC' : '#F4F4F8', leg = dk ? '#8A8460' : '#C8B070';
    c.strokeStyle = leg; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(-2 * s, -22 * s); c.lineTo(-3 * s + ph2 * 3 * s, 0); c.moveTo(1 * s, -22 * s); c.lineTo(2 * s - ph2 * 3 * s, -Math.max(0, ph2) * 3 * s); c.stroke();
    c.fillStyle = grey; c.beginPath(); c.moveTo(-14 * s, -24 * s); c.quadraticCurveTo(-4 * s, -40 * s, 8 * s, -34 * s); c.quadraticCurveTo(6 * s, -22 * s, -4 * s, -21 * s); c.closePath(); c.fill();
    c.fillStyle = dgrey; c.beginPath(); c.moveTo(-12 * s, -27 * s); c.quadraticCurveTo(-2 * s, -36 * s, 6 * s, -32 * s); c.quadraticCurveTo(0, -27 * s, -12 * s, -27 * s); c.fill();
    var hx2 = 10 * s + pk * 10 * s, hy = -52 * s + pk * 46 * s;
    c.strokeStyle = wht; c.lineWidth = 3.4 * s; c.beginPath(); c.moveTo(6 * s, -33 * s); c.bezierCurveTo(14 * s, -38 * s - pk * 2 * s, 2 * s + pk * 12 * s, -44 * s + pk * 30 * s, hx2, hy); c.stroke();
    c.fillStyle = wht; c.beginPath(); c.ellipse(hx2 + 1 * s, hy, 3.4 * s, 2.6 * s, 0.2 + pk * 1.2, 0, 7); c.fill();
    c.strokeStyle = '#E2B040'; c.lineWidth = 1.8 * s; c.beginPath(); c.moveTo(hx2 + 3 * s, hy); c.lineTo(hx2 + 3 * s + Math.cos(0.15 + pk * 1.3) * 11 * s, hy + Math.sin(0.15 + pk * 1.3) * 11 * s); c.stroke();
    c.strokeStyle = '#22202C'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(hx2 - 1 * s, hy - 1.6 * s); c.lineTo(hx2 - 9 * s, hy - 3 * s + pk * 4 * s); c.stroke();
    c.fillStyle = '#22202C'; c.beginPath(); c.arc(hx2 + 1.6 * s, hy - 0.6 * s, 0.8 * s, 0, 7); c.fill();
    c.restore(); }
  // the koinobori: a streamer and three carp on a tall pole
  var K = A.koi, koiCols = [['#2E2E3E', '#E8E4F0'], ['#D8402E', '#FFE0D0'], ['#3A78C8', '#E0F0FF']];
  function carp(c, x, y, L, hgt, cols, t, ph3) { var n = 14, up = [], lo = [], k;
    for (k = 0; k <= n; k++) { var u = k / n, wv = Math.sin(t * 4.4 - u * 5 + ph3) * hgt * 0.45 * u + u * hgt * 0.5 * (0.6 + 0.4 * Math.sin(t * 0.7 + ph3)), w = hgt * 0.5 * (1 - 0.25 * u) * (0.85 + 0.15 * Math.sin(t * 6 - u * 7 + ph3)); up.push([x + u * L, y + wv - w]); lo.unshift([x + u * L, y + wv + w]); }
    var tw = Math.sin(t * 4.4 - 5 + ph3) * hgt * 0.45 + hgt * 0.5, tx = x + L;
    c.fillStyle = cols[0]; c.beginPath(); c.moveTo(up[0][0], up[0][1]); up.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(tx + hgt * 0.5, y + tw - hgt * 0.7); c.lineTo(tx + hgt * 0.15, y + tw); c.lineTo(tx + hgt * 0.5, y + tw + hgt * 0.7); lo.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.closePath(); c.fill();
    c.strokeStyle = cols[1]; c.globalAlpha = 0.55; c.lineWidth = Math.max(0.8, hgt * 0.08); c.beginPath(); for (k = 3; k < n; k += 2) { c.moveTo(up[k][0], up[k][1] + hgt * 0.2); c.quadraticCurveTo(up[k][0] + hgt * 0.25, (up[k][1] + lo[n - k][1]) / 2, lo[n - k][0], lo[n - k][1] - hgt * 0.2); } c.stroke(); c.globalAlpha = 1;
    c.fillStyle = cols[1]; c.beginPath(); c.arc(x + hgt * 0.45, y - hgt * 0.05, hgt * 0.26, 0, 7); c.fill(); c.fillStyle = '#1A1820'; c.beginPath(); c.arc(x + hgt * 0.45, y - hgt * 0.05, hgt * 0.13, 0, 7); c.fill();
    c.strokeStyle = cols[1]; c.lineWidth = Math.max(1, hgt * 0.1); c.beginPath(); c.moveTo(x + 0.5, y - hgt * 0.5); c.lineTo(x + 0.5, y + hgt * 0.5); c.stroke(); }
  function koinobori(c, t) { var x = K[0], y0 = K[1], h = K[2], s = h / 120;
    c.strokeStyle = dk ? '#2A2830' : '#5A4A40'; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 - h); c.stroke();
    c.fillStyle = '#E6B23A'; c.beginPath(); c.arc(x, y0 - h - 3 * s, 3 * s, 0, 7); c.fill();
    c.save(); c.translate(x, y0 - h + 3 * s); c.rotate(t * 3); c.strokeStyle = '#E6B23A'; c.lineWidth = 1.2 * s; for (var k = 0; k < 4; k++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-5 * s, 0); c.lineTo(5 * s, 0); c.stroke(); } c.restore();
    // the five-coloured streamer
    ['#3A78C8', '#F2F2F2', '#D8402E', '#F2C23A', '#3A9A5A'].forEach(function (col, k) { c.strokeStyle = col; c.lineWidth = 2.4 * s; c.beginPath(); for (var j = 0; j <= 10; j++) { var u = j / 10, xx = x + u * 34 * s, yy = y0 - h + 9 * s + k * 2.3 * s + Math.sin(t * 5 - u * 6 + k * 0.3) * 3 * s * u + u * 4 * s; if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); });
    carp(c, x + 1, y0 - h + 26 * s, 46 * s, 12 * s, koiCols[0], t, 0); carp(c, x + 1, y0 - h + 46 * s, 38 * s, 10 * s, koiCols[1], t, 1.1); carp(c, x + 1, y0 - h + 63 * s, 31 * s, 8 * s, koiCols[2], t, 2.3); }
  // the painted parts, at the screen's pixel density: the shading of the hills and of Fuji, the pagoda, the town (the rows behind
  // the koinobori pole, then the ones in front of it), the bridge and its reflection
  var DK = Math.min(3, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)), HS = A.hills, TN = A.town, lit = {wins: [], lamps: []}, litB, pagLights = [];
  var aboveHills = new Path2D(japan_pg(HS.fh1.concat([[HS.fh1[HS.fh1.length - 1][0], -100], [HS.fh1[0][0], -100]])));
  var hillP = new Path2D(japan_pg(HS.HL.concat([[HS.hx1 + 30, H + 10], [-60, H + 10]])));
  var hillsSpr = japan_deco(-60, 0, W + 120, HS.gy + 6, DK, function (o) {
    var sideFaces = function (pts, deep, shade, light) { for (var i = 1; i < pts.length - 1; i++) { if (!(pts[i][1] <= pts[i - 1][1] && pts[i][1] < pts[i + 1][1])) continue;
        var j = i, k = i, pk = pts[i]; while (j < pts.length - 1 && pts[j + 1][1] >= pts[j][1]) j++; while (k > 0 && pts[k - 1][1] >= pts[k][1]) k--;
        var g = o.createLinearGradient(0, pk[1], 0, pk[1] + deep); g.addColorStop(0, shade); g.addColorStop(1, shade.replace(/[\d.]+\)$/, '0)'));
        japan_poly(o, pts.slice(i, j + 1).concat([[pts[j][0], pts[j][1] + deep], [pk[0] + (pts[j][0] - pk[0]) * 0.3, pk[1] + deep * 1.2]])); o.fillStyle = g; o.fill();
        g = o.createLinearGradient(0, pk[1], 0, pk[1] + deep); g.addColorStop(0, light); g.addColorStop(1, light.replace(/[\d.]+\)$/, '0)'));
        japan_poly(o, pts.slice(k, i + 1).concat([[pk[0] - (pk[0] - pts[k][0]) * 0.15, pk[1] + deep * 1.2], [pts[k][0], pts[k][1] + deep]])); o.fillStyle = g; o.fill(); } };
    var f1 = HS.fh1, f2 = HS.fh2, above1 = new Path2D(japan_pg(f1.concat([[f1[f1.length - 1][0], -100], [f1[0][0], -100]]))), below1 = new Path2D(japan_pg(f1.concat([[f1[f1.length - 1][0], H], [f1[0][0], H]])));
    var notF = new Path2D(); notF.rect(-200, -200, W + 400, H + 400); notF.addPath(fuji);
    // Fuji: the sunlit west flank a little brighter, the east a little deeper
    o.save(); o.clip(skyClip, 'evenodd'); o.clip(above1); o.clip(fuji); var gf = o.createLinearGradient(F.x - F.bw * 0.7, 0, F.x + F.bw * 0.8, 0);
    gf.addColorStop(0, dk ? 'rgba(190,190,255,0.08)' : 'rgba(255,255,255,0.14)'); gf.addColorStop(0.45, 'rgba(255,255,255,0)'); gf.addColorStop(0.6, 'rgba(20,30,80,0)'); gf.addColorStop(1, dk ? 'rgba(4,4,24,0.22)' : 'rgba(30,40,100,0.16)');
    o.fillStyle = gf; o.fillRect(-60, 0, W + 120, H); o.restore();
    // the far range, around Fuji
    o.save(); o.clip(skyClip, 'evenodd'); o.clip(notF, 'evenodd'); o.clip(above1); sideFaces(HS.rg, H * 0.12, dk ? 'rgba(8,8,36,0.3)' : 'rgba(60,80,150,0.2)', dk ? 'rgba(150,150,220,0.1)' : 'rgba(255,255,255,0.22)'); o.restore();
    // the wooded foothills: lit and shaded flanks, and clumps of trees
    o.save(); o.clip(skyClip, 'evenodd'); o.clip(below1); var gh = o.createLinearGradient(0, H * 0.48, 0, HS.gy); gh.addColorStop(0, dk ? 'rgba(140,150,220,0.08)' : 'rgba(255,255,240,0.16)'); gh.addColorStop(1, dk ? 'rgba(4,6,24,0.16)' : 'rgba(30,70,60,0.12)'); o.fillStyle = gh; o.fillRect(-60, 0, W + 120, H);
    var rr = japan_rs(77); for (var x = -40; x < W + 40; x += (ph ? 9 : 13) * S) { var y0 = japan_yAt(f1, x) + 5 * S, y1 = japan_yAt(f2, x) + 6 * S; if (y1 < y0 + 4 * S) continue; var y = y0 + rr() * (y1 - y0), r = (3 + rr() * 2.4) * S * (0.7 + 0.5 * (y - y0) / Math.max(1, y1 - y0));
      o.fillStyle = dk ? 'rgba(6,8,28,0.18)' : 'rgba(30,70,60,0.18)'; o.beginPath(); o.ellipse(x + r * 0.35, y + r * 0.2, r * 1.2, r * 0.85, 0, 0, 7); o.ellipse(x - r * 0.9, y + r * 0.45, r * 0.8, r * 0.6, 0, 0, 7); o.fill();
      o.fillStyle = dk ? 'rgba(120,130,200,0.08)' : 'rgba(230,245,220,0.26)'; o.beginPath(); o.ellipse(x - r * 0.35, y - r * 0.3, r * 0.7, r * 0.5, 0, 0, 7); o.fill(); } o.restore();
    // the front band of trees along the horizon: each crown shaded on its right
    var band = new Path2D(japan_pg(f2.concat([[f2[f2.length - 1][0], HS.gy], [f2[0][0], HS.gy]]))), notHill = new Path2D(); notHill.rect(-200, -200, W + 400, H + 400); notHill.addPath(hillP);
    o.save(); o.clip(band); o.clip(notHill, 'evenodd'); f2.forEach(function (p) { o.fillStyle = dk ? 'rgba(4,6,24,0.16)' : 'rgba(20,60,50,0.18)'; o.beginPath(); o.ellipse(p[0] + 4 * S, p[1] + 5 * S, 5.6 * S, 5 * S, 0, 0, 7); o.fill();
      o.fillStyle = dk ? 'rgba(120,130,200,0.08)' : 'rgba(230,245,220,0.24)'; o.beginPath(); o.ellipse(p[0] - 2.6 * S, p[1] + 2.4 * S, 3 * S, 2.2 * S, 0, 0, 7); o.fill(); }); o.restore();
    // nothing of this over the wooded hill, its cedars and its cherry trees (they stand in front)
    o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; o.fill(new Path2D(HS.occ)); o.globalCompositeOperation = 'source-over'; });
  var PG = A.pagoda, ps = PG.s, pagSpr = japan_deco(PG.x - 92 * ps, A.ptop[1] - 8 * ps, 260 * ps, PG.y - A.ptop[1] + 26 * ps, DK, function (o) { japan_paintPagoda(o, PG, dk, hillP, pagLights); });
  var BRG = A.bridge; TN.bridgeX = BRG[0]; TN.bridgeY = BRG[2];
  var tx0 = Math.min(TN.tx0 - W * 0.12, TN.bank[0]) - 60 * S, ty0 = H * TN.rows[0] - 120 * S;
  var townB = japan_deco(tx0, ty0, W + 60 - tx0, TN.kp[1] + 14 - ty0, DK, function (o) { japan_paintTown(o, TN, dk, W, H, S, ph, 'back', lit); });
  litB = lit.wins.length; var litL = lit.lamps.length;
  var townF = japan_deco(tx0, ty0, W + 60 - tx0, H * 0.97 - ty0, DK, function (o) { japan_paintTown(o, TN, dk, W, H, S, ph, 'front', lit); });
  // the bridge, and its reflection: painted upside down about the water line, tinted with the river and fading with depth
  var BB = {x0: BRG[0], x1: BRG[1], y: BRG[2], ah: BRG[3] * 1.2, S: S}, BG = japan_bridgeGeo(BB), bReach = BB.ah + BG.RH;
  var bTop = BB.y - bReach - 8 * S - BG.Dw * BG.ky, bBot = BB.y + 12 * S + bReach * 0.3, bLeft = BB.x0 - 10 * S, bRight = BB.x1 + BG.Dw * BG.kx + bReach * 0.35 + 10 * S, yw = BB.y - BG.WL;
  var brSpr = japan_deco(bLeft, bTop, bRight - bLeft, bBot - bTop, DK, function (o) { japan_paintBridge(o, BB, dk, true); });
  var brRef = japan_deco(bLeft, yw, bRight - bLeft, yw - bTop, DK, function (o) { o.translate(0, 2 * yw); o.scale(1, -1); japan_paintBridge(o, BB, dk, false);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-atop'; o.fillStyle = dk ? 'rgba(42,52,104,0.45)' : 'rgba(158,205,226,0.4)'; o.fillRect(0, 0, o.canvas.width, o.canvas.height);
    o.globalCompositeOperation = 'destination-in'; var g = o.createLinearGradient(0, 0, 0, o.canvas.height); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.15)'); o.fillStyle = g; o.fillRect(0, 0, o.canvas.width, o.canvas.height); });
  function deco(c, cv) { c.drawImage(cv, cv.x0, cv.y0, cv.w, cv.h); }
  function bridgeRefl(c, t) { var k = brRef.width / brRef.w, st = 2 * S; c.save(); c.globalAlpha = dk ? 0.55 : 0.6;
    for (var yy = 0; yy < brRef.h; yy += st) { var off = Math.sin(t * 1.7 + (yw + yy) * 0.16) * (0.6 + yy / brRef.h * 2.2) * S, hh = Math.min(st, brRef.h - yy);
      c.drawImage(brRef, 0, yy * k, brRef.width, hh * k, brRef.x0 + off, brRef.y0 + yy, brRef.w, hh + 0.4); } c.restore(); }
  function glows(c, t, list) { c.save(); c.globalCompositeOperation = 'lighter'; list.forEach(function (w) { var on = japan_ease((t - w[4] * 8) / 1.2) * (w[4] < 0.85 ? 1 : 0) * (Math.sin(t * 0.07 + w[4] * 90) > 0.93 ? 0.15 : 1); if (on <= 0) return;
      c.fillStyle = 'rgba(255,190,100,' + (0.55 * on) + ')'; c.fillRect(w[0], w[1], w[2], w[3]); japan_dot(c, winG, w[0] + w[2] / 2, w[1] + w[3] / 2, Math.max(w[2], w[3]) * 1.6, on * 0.5); }); c.restore(); }
  function lamps(c, t, list) { c.save(); c.globalCompositeOperation = 'lighter'; list.forEach(function (l, k) { japan_dot(c, lanG, l[0], l[1], l[2] * 6, 0.5 + 0.2 * flick(t, k * 1.3)); c.fillStyle = 'rgba(255,170,90,0.6)'; c.beginPath(); c.ellipse(l[0], l[1], l[2] * 0.7, l[2] * 0.9, 0, 0, 7); c.fill(); }); c.restore(); }
  // the paper lanterns on the stair path, and the stone lanterns' windows
  var PL = A.paper, SL = A.stone;
  // the lanterns further up the path than the torii stand behind it: they are drawn clipped to everywhere outside the gate
  var toriiMask = (A.toriiPolys || []).map(function (p) { var m = new Path2D(); m.rect(-500, -500, W + 1000, H + 1000); m.addPath(new Path2D(japan_pg(p))); return m; });
  function behindTorii(c) { toriiMask.forEach(function (m) { c.clip(m, 'evenodd'); }); }
  // the Hinomaru: a white cloth with the red sun, rippling gently from its pole
  function flag(c, t) { var F2 = A.flag, top = [], bot = [], k, u, wv = function (u2) { return Math.sin(u2 * Math.PI * 1.6 - t * 2.2) * 2.4 * S * u2; };
    for (k = 0; k <= 16; k++) { u = k / 16; top.push([F2[0] + F2[2] * u, F2[1] + wv(u)]); bot.unshift([F2[0] + F2[2] * u * (1 - 0.02 * Math.sin(t * 2.2)), F2[1] + F2[3] + wv(u)]); }
    var cl = new Path2D(japan_pg(top.concat(bot)));
    c.fillStyle = dk ? '#F4F2F8' : '#FFFFFF'; c.fill(cl); c.strokeStyle = dk ? 'rgba(20,16,40,0.35)' : 'rgba(80,70,70,0.22)'; c.lineWidth = 0.8; c.stroke(cl);
    c.fillStyle = dk ? '#D23A3A' : '#D8402E'; c.beginPath(); c.arc(F2[0] + F2[2] * 0.5, F2[1] + F2[3] * 0.5 + wv(0.5), F2[3] * 0.3, 0, 7); c.fill(); }
  function paperLantern(c, x, y, s, t, k) { var sw = Math.sin(t * 1.3 + k * 1.7) * 0.07 + Math.sin(t * 0.5 + k) * 0.04, L = 6 * s;
    c.save(); c.translate(x, y); c.rotate(sw); c.strokeStyle = '#2A2228'; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, L); c.stroke(); c.translate(0, L + 7 * s);
    var lit = dk ? 0.85 + 0.15 * flick(t, k * 1.9) : 0;
    var g = c.createLinearGradient(-6 * s, 0, 6 * s, 0); g.addColorStop(0, dk ? 'rgba(255,170,90,1)' : '#F2E6DA'); g.addColorStop(0.5, dk ? '#FFE6B0' : '#FFFAF2'); g.addColorStop(1, dk ? 'rgba(240,140,70,1)' : '#E6D6C6');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 5.4 * s, 7.4 * s, 0, 0, 7); c.fill();
    c.fillStyle = dk ? 'rgba(220,60,40,0.75)' : '#D8402E'; c.fillRect(-5 * s, -1.6 * s, 10 * s, 3.2 * s);
    c.strokeStyle = dk ? 'rgba(160,70,30,0.5)' : 'rgba(120,90,70,0.35)'; c.lineWidth = 0.6 * s; c.beginPath(); for (var j = -2; j <= 2; j++) { if (!j) continue; c.moveTo(-5.2 * s * Math.sqrt(1 - j * j / 9), j * 2.4 * s); c.lineTo(5.2 * s * Math.sqrt(1 - j * j / 9), j * 2.4 * s); } c.stroke();
    c.fillStyle = '#2A2228'; c.fillRect(-2.6 * s, -8.6 * s, 5.2 * s, 2 * s); c.fillRect(-2.6 * s, 6.8 * s, 5.2 * s, 2 * s);
    c.restore(); return lit; }
  // cranes for the moment
  var cranes = [];
  return {
    step: function (dt, t, f) {
      gust = Math.max(0, japan_env(t - T0, 0.4, 1.4, 4.5, 7.5));
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 200) c.x = -200; });
      // the heron: a few slow steps, a pause, sometimes a peck at the water
      her.next -= dt * f.s; if (her.peck > 0) { her.peck += dt * 0.7; if (her.peck >= 1) her.peck = 0; }
      else if (her.walk > 0) { her.walk -= dt * f.s; her.step += dt * f.s; her.x += her.dir * 6 * S * dt * f.s; if (Math.abs(her.x - A.heron[0]) > 40 * S) her.dir = her.x > A.heron[0] ? -1 : 1; }
      else if (her.next <= 0) { her.next = 3 + Math.random() * 4; if (Math.random() < 0.4) her.peck = 0.001; else { her.walk = 1.6 + Math.random() * 2; if (Math.random() < 0.3) her.dir = -her.dir; } }
      // petals
      var wind = 1 + gust * 2.5;
      fall.forEach(function (p) { if (p.gust) { if (t < p.t0) return; var g2 = Math.max(gust, 0.25); p.x += (p.vx * g2 + Math.sin(t * p.sp + p.ph) * 70 * g2) * dt * f.s; p.y += (p.vy - p.lift * g2 + Math.cos(t * p.sp + p.ph) * 60 * g2) * dt * f.s; p.ph += dt * f.s * 1.2; }
        else { p.x += (p.vx * wind + Math.sin(t * p.sp + p.ph) * 14) * dt * f.s; p.y += (p.vy * (1 - gust * 0.5)) * dt * f.s; p.ph += dt * f.s * 0.6; }
        if (!p.gust && p.y > p.land && hx.isPointInPath(river, p.x, p.y)) { floatP.push({x: p.x, y: p.y, age: 0, s: p.s, c: p.c, rot: p.ph}); Object.assign(p, newPetal(false)); }
        else if (p.y > H + 20 || p.x > W + 30 || p.y < -H * 0.6) { if (p.gust) p.dead = true; else Object.assign(p, newPetal(Math.random() < 0.4)); } });
      fall = fall.filter(function (p) { return !p.dead; });
      floatP.forEach(function (p) { p.age += dt * f.s; p.x -= 9 * S * dt * f.s; p.y += 4.5 * S * dt * f.s; p.rot += dt * 0.2; });
      floatP = floatP.filter(function (p) { return p.age < 26 && hx.isPointInPath(river, p.x, p.y); });
      if (floatP.length < (ph ? 4 : 7) && Math.random() < dt * 0.4) { var j = Math.floor(Math.random() * A.U.length * 0.6); floatP.push({x: A.U[j][0] + 10, y: A.U[j][1] + 10 + Math.random() * 20, age: 0, s: (ph ? 3 : 4) * S, c: flowerCols[0], rot: Math.random() * 6}); }
      cranes.forEach(function (c) { c.x += c.v * dt * f.s; });
      cranes = cranes.filter(function (c) { return c.x < W + 160; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, glowK = japan_env(T, 0.2, 2.2, 7, 10.5), k;
      // ---- canvas A: the shading of the hills, the sky things over the mountain (clipped to the sky), the pagoda, the town, the river
      deco(ca, hillsSpr);
      ca.save(); ca.clip(skyClip, 'evenodd');
      if (dk) { var rise = japan_ease(Math.min(1, t / 14)), my = M[1] + H * 0.16 * (1 - rise);
        ca.save(); ca.globalCompositeOperation = 'lighter'; japan_dot(ca, glowM, M[0], my, M[2] * 4, 0.55 + 0.05 * Math.sin(tt * 0.6)); ca.restore();
        ca.drawImage(moonSpr, M[0] - moonSpr.w / 2, my - moonSpr.h / 2, moonSpr.w, moonSpr.h); }
      // alpenglow: the snow and then the whole cone flush rose-pink, strongest on the sunlit (west) side
      if (glowK > 0) { ca.save(); ca.clip(aboveHills); ca.globalAlpha = glowK * (dk ? 0.42 : 0.55); var gg = ca.createLinearGradient(0, F.top, 0, F.ys + F.hf * 0.16); gg.addColorStop(0, 'rgba(255,120,150,0.75)'); gg.addColorStop(0.5, 'rgba(255,150,170,0.5)'); gg.addColorStop(1, 'rgba(255,190,200,0.15)'); ca.fillStyle = gg; ca.fill(snow); ca.globalAlpha = glowK * (dk ? 0.14 : 0.18); ca.fillStyle = '#F08AA6'; ca.fill(fuji); ca.restore(); }
      clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 120 * c.s, c.y - 28 * c.s, 240 * c.s, 56 * c.s); });
      ca.restore();
      cranes.forEach(function (c) { var y = c.y + Math.sin(c.x * 0.01 + c.ph) * 10 * S, fl = Math.sin(tt * 4.2 + c.ph); japan_crane(ca, c.x, y, c.s, fl, dk); });
      // the pagoda (its doorway glowing at night); the town behind the koinobori pole, the pole, the town in front of it; windows
      // lighting up at night a few at a time, shop lanterns glowing
      deco(ca, pagSpr); if (dk) pagLights.forEach(function (l) { ca.save(); ca.globalCompositeOperation = 'lighter'; japan_dot(ca, lanG, l[0], l[1], l[2], 0.45 + 0.1 * flick(tt, 3)); ca.restore(); });
      deco(ca, townB); if (dk) { glows(ca, t, lit.wins.slice(0, litB)); lamps(ca, tt, lit.lamps.slice(0, litL)); }
      koinobori(ca, tt);
      deco(ca, townF); if (dk) { glows(ca, t, lit.wins.slice(litB)); lamps(ca, tt, lit.lamps.slice(litL)); }
      // the river: glints by day, the moon's path by night, the bridge's reflection, floating petals, the heron
      ca.save(); ca.clip(river);
      bridgeRefl(ca, tt);
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; var top = A.U.reduce(function (m, p) { return Math.abs(p[0] - M[0]) < Math.abs(m[0] - M[0]) ? p : m; }, A.U[0])[1];
        for (k = 0; k < 14; k++) { var yy = top + 4 + k * 5 * S, w = M[2] * (0.9 + k * 0.08) * (0.6 + 0.4 * Math.sin(tt * 1.4 + k * 1.9)), xx = M[0] + Math.sin(tt * 0.9 + k) * 4; ca.fillStyle = 'rgba(255,236,190,' + Math.max(0, 0.42 - k * 0.025) * japan_ease(Math.min(1, t / 14)) + ')'; ca.fillRect(xx - w / 2, yy, w, 1.8 * S); } ca.restore(); }
      else { for (k = 0; k < 18; k++) { var gx = W * hash(k * 3.3), gy = H * (0.72 + hash(k * 7.1) * 0.28), ga = Math.max(0, Math.sin(tt * (0.8 + hash(k) * 0.8) + k * 2.1)); if (ga > 0.3) { ca.fillStyle = 'rgba(255,255,255,' + (ga - 0.3) * 1.2 + ')'; ca.beginPath(); ca.ellipse(gx, gy, 5 * S * ga, 1 * S, 0, 0, 7); ca.fill(); } } }
      floatP.forEach(function (p) { var a = Math.min(1, p.age * 2, (26 - p.age) / 4); ca.globalAlpha = a; ca.strokeStyle = dk ? 'rgba(200,210,255,0.35)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 0.8; ca.beginPath(); ca.ellipse(p.x, p.y + 1, p.s * 1.8 * (1 + (p.age % 3) * 0.3), p.s * 0.5, 0, 0, 7); ca.stroke(); ca.fillStyle = p.c; ca.save(); ca.translate(p.x, p.y); ca.rotate(p.rot); ca.scale(1, 0.55); japan_petal(ca, p.s); ca.restore(); }); ca.globalAlpha = 1;
      // the heron's reflection and ripples, then the heron
      ca.save(); ca.globalAlpha = 0.25; ca.translate(0, her.y * 2 + 2); ca.scale(1, -1); heron(ca, tt); ca.restore();
      ca.strokeStyle = dk ? 'rgba(200,210,255,0.3)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1; for (k = 0; k < 2; k++) { var ru = (tt * 0.5 + k * 0.5) % 1; ca.globalAlpha = 1 - ru; ca.beginPath(); ca.ellipse(her.x, her.y + 1, 6 * S + ru * 16 * S, 1.5 * S + ru * 3 * S, 0, 0, 7); ca.stroke(); } ca.globalAlpha = 1;
      ca.restore();
      deco(ca, brSpr);
      heron(ca, tt);
      // ---- canvas B: lanterns, branches and falling petals over everything
      if (A.flag) flag(cb, tt);
      SL.forEach(function (l, k2) { if (!dk) return; if (l[3]) { cb.save(); behindTorii(cb); } cb.save(); cb.globalCompositeOperation = 'lighter'; japan_dot(cb, lanG, l[0], l[1], 14 * l[2], 0.7 + 0.2 * flick(tt, k2 + 5)); cb.fillStyle = 'rgba(255,200,120,0.8)'; cb.fillRect(l[0] - 3 * l[2], l[1] - 3 * l[2], 6 * l[2], 6 * l[2]); cb.restore(); if (l[3]) cb.restore(); });
      PL.forEach(function (p) { if (p[4]) { cb.save(); behindTorii(cb); } var lit = paperLantern(cb, p[0], p[1], p[2], tt, p[3]); if (lit > 0) { cb.save(); cb.globalCompositeOperation = 'lighter'; japan_dot(cb, lanG, p[0], p[1] + 13 * p[2], 24 * p[2], lit * 0.8); cb.restore(); } if (p[4]) cb.restore(); });
      branches.forEach(function (b) { var sw = (Math.sin(tt * 0.9 + b.ph) * 0.025 + Math.sin(tt * 2.1 + b.ph * 2) * 0.008) * f.a + gust * 0.05 * Math.sin(tt * 5 + b.ph); cb.save(); cb.translate(b.x, b.y); if (b.flip) { cb.scale(-1, 1); } cb.rotate((b.flip ? 0.42 : 0) + sw); cb.drawImage(b.spr, -b.spr.w / 2 + b.len * 1.15, -b.spr.h / 2 + b.len * 0.3, b.spr.w, b.spr.h); cb.restore(); });
      fall.forEach(function (p) { if (p.gust && t < p.t0) return; cb.save(); cb.translate(p.x, p.y); cb.rotate(p.ph * 0.7); cb.scale(Math.cos(p.ph * 2.2), 1); cb.fillStyle = p.c; japan_petal(cb, p.s); cb.restore(); });
    },
    finish: function (t) { T0 = t;
      // the gust: a big swirl of blossom lifted off the trees
      for (var k = 0; k < (ph ? 70 : 140); k++) { var p = newPetal(false); p.gust = true; p.t0 = t + 0.3 + Math.random() * 1.6; p.vx = 50 + Math.random() * 70; p.vy = -10 + Math.random() * 20; p.lift = 25 + Math.random() * 45; p.sp = 1.5 + Math.random() * 2.5; p.s *= 1.1; fall.push(p); }
      // two red-crowned cranes across the mountain
      var cy = F.top + F.hf * (ph ? 0.32 : 0.24), s = (ph ? 0.9 : 1.6) * S;
      cranes.push({x: -40, y: cy, v: (ph ? 70 : 130) * S, s: s, ph: 0}, {x: -210, y: cy + 50 * S, v: (ph ? 70 : 130) * S, s: s * 0.86, ph: 1.4}); }
  };
};
UIC.japan = {L: ['#34477A', '#22305A', 'rgba(255,252,252,0.86)', '#26233A', '#6A6478', '#C8442E', '#C8442E', '#D8607A', '#FFFFFF'], D: ['#2A2D5A', '#14183A', 'rgba(24,26,60,0.8)', '#F4F0FA', '#B9B4D6', '#F4A0B8', '#F4A0B8', '#F8C8A8', '#1A1838']};
