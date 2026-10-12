// ---- world theme engines: netherlands
function nl_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function nl_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return nl_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - nl_ease((T - c) / (d - c)); }
var nl_gc = null;
function nl_ctx() { return nl_gc || (nl_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent (draw it with nl_dot)
function nl_rg(col, mid) { var g = nl_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function nl_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function nl_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function nl_fillPts(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); c.fill(); }
function nl_mixHex(a, b, t) { var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), m = function (s) { return Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); }; return 'rgb(' + m(16) + ',' + m(8) + ',' + m(0) + ')'; }

// ---------- Netherlands
// Loop: the windmill sails turn at their own speeds, light ripples across the tulip stripes and the near tulips sway in
// waves, cumulus clouds sail across the big sky, ducks paddle in the canal, a bicycle rides along the dike road (and waits
// at the bridge), and the drawbridge rises whenever the houseboat comes up or down the canal. Night: the canal houses'
// windows and the street lamps glow and shimmer in the canal, and stars come out over the fields.
// Moment: all the windmills spin up together, the tulip stripes bloom one row after another like a wave of colour, and
// a V of geese flies across the sky.
// a cumulus cloud: a flat, shaded base with round heads on top
function nl_cloud(o, w, dk, seed) {
  var top = dk ? '#55608E' : '#FFFFFF', bot = dk ? '#353E6A' : '#D6E2F0', rim = dk ? 'rgba(255,240,200,0.18)' : 'rgba(255,255,255,0)';
  var g = o.createLinearGradient(0, -w * 0.32, 0, w * 0.08); g.addColorStop(0, top); g.addColorStop(0.6, top); g.addColorStop(1, bot); o.fillStyle = g;
  o.beginPath(); var n = 5 + Math.floor(hash(seed) * 3);
  for (var i = 0; i < n; i++) { var u = (i + 0.5) / n, x = (u - 0.5) * w * 0.82, r = w * (0.1 + 0.11 * Math.sin(u * Math.PI) + hash(seed + i) * 0.05); o.moveTo(x + r, -r * 0.7); o.arc(x, -r * 0.7, r, 0, 7); }
  o.moveTo(-w * 0.48, 0); o.ellipse(0, 0, w * 0.48, w * 0.07, 0, 0, 7); o.fill();
  if (dk) { o.fillStyle = rim; o.beginPath(); o.ellipse(-w * 0.1, -w * 0.2, w * 0.25, w * 0.05, 0, 0, 7); o.fill(); } }
// the houseboat seen from behind (going away) or from the front (coming back), its waterline at (x, y), s pixels a metre
function nl_boat(c, x, y, s, away, dk, t) {
  var U = function (u) { return x + u * s; }, V = function (v) { return y - v * s; }, R = function (u0, v0, u1, v1, col) { c.fillStyle = col; c.fillRect(U(u0), V(v1), (u1 - u0) * s, (v1 - v0) * s); };
  // reflection
  var rg = c.createLinearGradient(0, y, 0, y + 1.4 * s); rg.addColorStop(0, dk ? 'rgba(10,20,48,0.4)' : 'rgba(30,80,80,0.35)'); rg.addColorStop(1, 'rgba(30,80,80,0)'); c.fillStyle = rg;
  c.beginPath(); c.moveTo(U(-1.7), y); c.lineTo(U(1.7), y); c.lineTo(U(1.4), y + 1.4 * s); c.lineTo(U(-1.4), y + 1.4 * s); c.closePath(); c.fill();
  c.fillStyle = dk ? '#163A40' : '#2E6A5E'; c.beginPath(); c.moveTo(U(-1.8), V(1.0)); c.lineTo(U(1.8), V(1.0)); c.lineTo(U(1.65), V(0.1)); c.quadraticCurveTo(U(0), V(-0.15), U(-1.65), V(0.1)); c.closePath(); c.fill();
  R(-1.8, 0.78, 1.8, 0.9, dk ? '#8C88A8' : '#F4EEDC'); R(-1.8, 0.98, 1.8, 1.08, dk ? '#2A2232' : '#5A3A2A');
  R(-1.35, 1.08, 1.35, 2.45, dk ? '#7A7698' : '#F2E2C2'); R(-1.35, 1.08, -0.95, 2.45, dk ? 'rgba(0,0,20,0.25)' : 'rgba(120,80,40,0.12)');
  R(-1.6, 2.45, 1.6, 2.7, dk ? '#1C1A30' : '#3E5A7A');
  var lit = dk ? '#FFC870' : '#46607A';
  if (away) { R(-0.38, 1.08, 0.38, 2.15, dk ? '#3A2A2E' : '#8A5A3A'); R(-1.1, 1.55, -0.6, 2.1, lit); R(0.6, 1.55, 1.1, 2.1, lit); c.fillStyle = dk ? '#12121E' : '#3A302C'; c.fillRect(U(-0.06), V(0.3), 0.12 * s, 0.6 * s); }
  else { R(-1.1, 1.5, -0.4, 2.15, lit); R(-0.25, 1.5, 0.25, 2.15, lit); R(0.4, 1.5, 1.1, 2.15, lit); }
  if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,190,100,0.16)'; c.beginPath(); c.arc(U(0), V(1.8), 1.0 * s, 0, 7); c.fill(); c.restore(); }
  // chimney and window boxes of geraniums on the roof
  R(0.85, 2.7, 1.05, 3.25, dk ? '#12121E' : '#3A302C');
  for (var k = 0; k < 5; k++) { c.fillStyle = dk ? '#1E3434' : '#4E8A3A'; c.beginPath(); c.arc(U(-1.25 + k * 0.3), V(2.82), 0.17 * s, 0, 7); c.fill(); c.fillStyle = k % 2 ? (dk ? '#A04A64' : '#E8485A') : (dk ? '#A08A40' : '#F7C925'); c.beginPath(); c.arc(U(-1.25 + k * 0.3), V(2.92), 0.09 * s, 0, 7); c.fill(); }
  if (dk) { var sm = Math.sin(t * 2) * 0.1; c.fillStyle = 'rgba(200,200,230,0.12)'; c.beginPath(); c.arc(U(0.95 + sm), V(3.6), 0.25 * s, 0, 7); c.fill(); }
  else { c.fillStyle = 'rgba(255,255,255,0.5)'; for (var q = 0; q < 3; q++) { var u = ((t * 0.3 + q / 3) % 1); c.beginPath(); c.arc(U(0.95 + u * 0.5), V(3.3 + u * 1.2), (0.12 + u * 0.18) * s, 0, 7); c.fill(); } } }
// a mallard: body, tail, head and bill, facing dir, its waterline at (x, y), s pixels a metre
function nl_duck(c, x, y, s, dir, dk, hen, t, ph) {
  c.save(); c.translate(x, y - Math.sin(t * 2 + ph) * 0.015 * s); c.scale(dir * s, s);
  c.fillStyle = dk ? 'rgba(0,0,10,0.25)' : 'rgba(40,70,90,0.18)'; c.beginPath(); c.ellipse(0, 0.02, 0.24, 0.035, 0, 0, 7); c.fill();
  c.fillStyle = hen ? (dk ? '#5A4A44' : '#A07A54') : (dk ? '#6A6670' : '#C8C0B4'); c.beginPath(); c.moveTo(-0.24, -0.08); c.quadraticCurveTo(-0.3, -0.16, -0.18, -0.13); c.quadraticCurveTo(0, -0.2, 0.16, -0.12); c.quadraticCurveTo(0.24, -0.05, 0.16, 0); c.lineTo(-0.18, 0); c.closePath(); c.fill();
  c.fillStyle = hen ? (dk ? '#4A3A36' : '#8A6440') : (dk ? '#4A3A3A' : '#7A4A30'); c.beginPath(); c.ellipse(0.1, -0.1, 0.07, 0.05, 0, 0, 7); c.fill();
  c.fillStyle = hen ? (dk ? '#5A4A44' : '#A07A54') : (dk ? '#1E4A3A' : '#2E7A4E'); c.beginPath(); c.arc(0.17, -0.2, 0.06, 0, 7); c.fill(); c.fillRect(0.14, -0.2, 0.05, 0.08);
  c.fillStyle = dk ? '#A08A40' : '#F2B02A'; c.beginPath(); c.moveTo(0.21, -0.22); c.lineTo(0.3, -0.2); c.lineTo(0.21, -0.18); c.fill();
  if (!hen) { c.fillStyle = dk ? '#9A98B8' : '#FFFFFF'; c.fillRect(0.13, -0.15, 0.06, 0.012); }
  c.restore(); }
// a goose in flight, wings at phase w (-1 .. 1)
function nl_goose(c, x, y, s, w, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.ellipse(0, 0, 1, 0.28, 0, 0, 7); c.fill(); c.lineWidth = 0.22; c.beginPath(); c.moveTo(-0.8, -0.05); c.lineTo(-1.5, -0.15); c.stroke(); c.beginPath(); c.arc(-1.55, -0.16, 0.16, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-0.3, 0); c.quadraticCurveTo(0.1, -1.2 * w - 0.2, 0.5, -1.6 * w); c.lineTo(0.35, 0); c.closePath(); c.fill(); c.restore(); }
ENGINES.netherlands = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, cm = A.cam, C = A.C, P = function (X, Y, Z) { return nl_P(cm, X, Y, Z); }, hz = cm.hz, T0 = -99, i;
  // ---- the sky: stars, the moon, cumulus clouds, painted into one canvas and cut out where houses, towers and trees stand
  var KS = 1.5, sky = document.createElement('canvas'); sky.width = Math.ceil(W * KS); sky.height = Math.ceil(hz * KS); var so = sky.getContext('2d'), sil = new Path2D(A.sil);
  var CL = [0, 1, 2, 3].map(function (k) { var w = 240 + k * 30; return nl_sprite(w, w * 0.5, 1.5, function (o) { o.translate(0, w * 0.14); nl_cloud(o, w, dk, k * 7 + 3); }); });
  var clouds = (ph ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5]).map(function (k) { return {x: hash(k + 3) * W, y: H * (0.06 + hash(k + 9) * (ph ? 0.36 : 0.3)), s: (ph ? 0.55 : 0.9) * (0.7 + hash(k + 7) * 0.6), v: 5 + hash(k + 5) * 6, spr: CL[k % 4]}; });
  var GH = H - hz + 2, gcv = document.createElement('canvas'); gcv.width = Math.ceil(W); gcv.height = Math.ceil(GH); var go = gcv.getContext('2d'), petals = [];
  var stars = A.stars, moonG = nl_rg('rgba(255,244,210,0.5)', [0.3, 0.2]), sunG = nl_rg('rgba(255,252,236,0.65)', [0.25, 0.25]);
  // ---- windmills, field stripes, near tulips, windows, lamps
  var mills = A.mills.map(function (m, k) { return {m: m, a: 0.4 + k * 0.5}; }), boost = 0;
  var stripes = A.stripes.map(function (s, k) { var key = s.b < 2 ? s.x * 0.5 + s.b * 0.5 : 12 + (s.z0 - 60) * 0.12; return {p: new Path2D(nl_pg(s.p)), ci: s.ci, key: key, b: s.b, k: k}; });
  var keys = stripes.map(function (s) { return s.key; }), kMax = Math.max.apply(null, keys);
  var tul = A.tulips, TC = C.tul, TB = dk ? ['#E05070', '#F2D060', '#F49AC0', '#F59A4A', '#A47AE0'] : ['#FF5A5A', '#FFE04A', '#FFAED0', '#FFA84A', '#B07AF0'];
  var water = new Path2D(nl_pg(A.water)), wins = A.wins.map(function (w, k) { return {p: new Path2D(nl_pg(w.q)), rp: w.rq ? new Path2D(nl_pg(w.rq)) : null, q: w.q, lit: w.lit, ph: hash(k + 5) * 6.28, door: w.door, mill: w.mill}; });
  var winG = nl_rg('rgba(255,190,100,0.5)', [0.3, 0.3]), lampG = nl_rg('rgba(255,210,140,0.6)', [0.25, 0.3]);
  var lamps = A.lamps.map(function (L) { var p = P(L[0] + 0.15, L[1] - 0.2, L[2]); return {x: p[0], y: p[1], s: cm.f / L[2], r: P(L[0] + 0.15, -1.6 - L[1] + 0.2, L[2])}; });
  // ---- the drawbridge, the houseboat, the ducks, the bicycle
  var BR = A.bridge, bAng = 0, boat = {st: 'wait', z: 6, x: 1.7, wait: 4}, bike = {x: 34, dir: -1, wait: 2, wh: 0};
  var ducks = [0, 1, 2, 3].map(function (k) { return {x: (hash(k + 20) - 0.5) * 6, z: 7 + hash(k + 21) * (k < 2 ? 3 : 10), dir: hash(k + 22) < 0.5 ? -1 : 1, v: 0.12 + hash(k + 23) * 0.12, hen: k % 2, ph: k * 1.7, turn: 3 + hash(k) * 6}; });
  var geese = [], WL = A.willow, wil = {g: new Path2D(WL.g), tr: new Path2D(WL.tr), dk: new Path2D(WL.dk), lt: new Path2D(WL.lt)};
  // the willow behind the road, its hanging strands swinging gently from the crown
  function willowDraw(c, t) { var sk = Math.sin(t * 0.9) * 0.035 + Math.sin(t * 2.3) * 0.012;
    c.fillStyle = C.grass; c.fill(wil.g);
    c.save(); c.transform(1, 0, sk * 0.6, 1, -sk * 0.6 * WL.y, 0); c.fillStyle = C.leaf; c.fill(wil.dk); c.restore();
    c.fillStyle = C.wood; c.fill(wil.tr);
    c.save(); c.transform(1, 0, sk * 1.3, 1, -sk * 1.3 * WL.y, 0); c.fillStyle = C.willow; c.fill(wil.lt); c.restore(); }
  function bridgeDraw(c, a) { var o = nl_bridge(cm, BR, a), lw = ph ? 0.9 : 1.2;
    c.fillStyle = dk ? '#3E3446' : '#8A7058'; c.fill(new Path2D(o.deck)); c.fillStyle = dk ? '#2A2232' : '#5A4636'; c.fill(new Path2D(o.side));
    c.fillStyle = dk ? '#A6A4C6' : '#F7F2E8'; c.fill(new Path2D(o.white));
    c.lineCap = 'round'; c.strokeStyle = dk ? '#12121E' : '#3A302C'; c.lineWidth = lw; c.stroke(new Path2D(o.dark)); c.strokeStyle = dk ? '#9896BA' : '#F4F0E6'; c.lineWidth = lw; c.stroke(new Path2D(o.rail)); }
  function boatDraw(c, t) { if (boat.st === 'wait') return; var y = P(boat.x, -0.8, boat.z), s = cm.f / boat.z, al = Math.min(1, (170 - boat.z) / 40); if (al <= 0) return;
    // the wake: a V of ripples spreading out behind
    c.save(); c.globalAlpha = al; c.strokeStyle = dk ? 'rgba(190,210,255,0.3)' : 'rgba(255,255,255,0.7)'; c.lineWidth = Math.max(0.6, s * 0.05);
    var away = boat.st === 'out'; for (var k = 1; k <= 3; k++) { var dz = (away ? -1 : 1) * k * 1.2, zz = boat.z + dz; if (zz < 5.5) continue; var l = P(boat.x - 1.9 - k * 0.5, -0.8, zz), r = P(boat.x + 1.9 + k * 0.5, -0.8, zz), wv = Math.sin(t * 3 + k) * 0.3 * s; c.beginPath(); c.moveTo(l[0], l[1] + wv * 0.1); c.lineTo(l[0] + 0.8 * s, l[1]); c.moveTo(r[0], r[1]); c.lineTo(r[0] - 0.8 * s, r[1] + wv * 0.1); c.stroke(); }
    nl_boat(c, y[0], y[1], s, away, dk, t); c.restore(); }
  function bikeDraw(c, t) { if (bike.wait > 0) return; var Y = Math.abs(bike.x) < 5 ? 0.3 + 0 * Math.sin(bAng) : 0, b = P(bike.x, Y, 11.2), s = cm.f / 11.2, d = bike.dir;
    c.save(); c.strokeStyle = dk ? '#C8C6E0' : '#2E3A44'; c.lineWidth = Math.max(1, s * 0.05); c.lineCap = 'round'; c.stroke(new Path2D(nl_bike(b[0], b[1], s, d, 0)));
    // spokes turning, a front basket full of tulips
    for (var w = -1; w <= 1; w += 2) { var cx = b[0] + w * 0.52 * d * s, cy = b[1] - 0.34 * s; for (var k = 0; k < 3; k++) { var a = bike.wh + k * Math.PI / 3; c.beginPath(); c.moveTo(cx - Math.cos(a) * 0.32 * s, cy - Math.sin(a) * 0.32 * s); c.lineTo(cx + Math.cos(a) * 0.32 * s, cy + Math.sin(a) * 0.32 * s); c.lineWidth = Math.max(0.5, s * 0.015); c.stroke(); } }
    var bx = b[0] + 0.62 * d * s, by = b[1] - 0.95 * s; c.fillStyle = dk ? '#5A4636' : '#B8865A'; c.fillRect(bx - 0.2 * s, by - 0.05 * s, 0.4 * s, 0.25 * s);
    for (var q = 0; q < 4; q++) { c.fillStyle = dk ? '#1E3434' : '#4E8A3A'; c.fillRect(bx - 0.15 * s + q * 0.1 * s, by - 0.2 * s, 0.025 * s, 0.18 * s); c.fillStyle = (dk ? TB : TC)[q % 5]; c.beginPath(); c.ellipse(bx - 0.14 * s + q * 0.1 * s, by - 0.22 * s, 0.05 * s, 0.06 * s, 0, 0, 7); c.fill(); }
    c.restore(); }
  function tulipHead(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w * 0.5, y); c.lineTo(x - w * 0.54, y - h * 0.5); c.lineTo(x - w * 0.41, y - h); c.lineTo(x - w * 0.22, y - h * 0.62); c.lineTo(x, y - h * 1.08); c.lineTo(x + w * 0.22, y - h * 0.62); c.lineTo(x + w * 0.41, y - h); c.lineTo(x + w * 0.54, y - h * 0.5); c.lineTo(x + w * 0.5, y); c.quadraticCurveTo(x, y + h * 0.45, x - w * 0.5, y); c.fill(); }
  return {
    step: function (dt, t, f) {
      var T = t - T0; boost = nl_env(T, 0.2, 1.6, 7, 11);
      clouds.forEach(function (c) { c.x += c.v * dt * f.s; if (c.x > W + 220) c.x = -220; });
      mills.forEach(function (M) { M.a += M.m.sp * (1 + boost * 5) * dt * f.s; });
      // the houseboat goes up the canal, waits out of sight, then comes back; the bridge opens for it
      var b = boat, sp = (0.09 * b.z + 0.35) * f.s * dt;
      if (b.st === 'wait') { b.wait -= dt; if (b.wait <= 0) { if (b.z < 50) { b.st = 'out'; b.z = 6.3; b.x = 1.7; } else { b.st = 'in'; b.z = 165; b.x = -1.7; } } }
      else if (b.st === 'out') { var hold = b.z > 8.2 && b.z < 10.2 && bAng < 1.05; if (!hold) b.z += sp; if (b.z > 165) { b.st = 'wait'; b.wait = 6 + Math.random() * 6; b.z = 165; } }
      else { var hold2 = b.z < 15.5 && b.z > 12.2 && bAng < 1.05; if (!hold2) b.z -= sp * 1.0; if (b.z < 5.2) { b.st = 'wait'; b.wait = 10 + Math.random() * 8; b.z = 6; } }
      var want = b.st !== 'wait' && ((b.st === 'out' && b.z > 6.4 && b.z < 13.8) || (b.st === 'in' && b.z < 18 && b.z > 8.8));
      // (the bridge also waits for the bicycle to get off it)
      if (want && Math.abs(bike.x) < 5.6 && bike.wait <= 0 && bAng < 0.02) want = false;
      bAng += Math.max(-dt * 0.45, Math.min(dt * 0.45, (want ? 1.18 : 0) - bAng));
      // the bicycle rides along the dike road and stops at the bridge while it is up
      if (bike.wait > 0) { bike.wait -= dt; if (bike.wait <= 0) { bike.dir = -bike.dir; bike.x = bike.dir < 0 ? 40 : -40; } }
      else { var nx = bike.x + bike.dir * 3.6 * f.s * dt, gate = bAng > 0.02 || want; if (gate && ((bike.dir < 0 && bike.x > 5.6 && nx <= 7) || (bike.dir > 0 && bike.x < -5.6 && nx >= -7))) nx = bike.x; else bike.wh += (nx - bike.x) / 0.34 * bike.dir; bike.x = nx; if (Math.abs(bike.x) > 42) bike.wait = 5 + Math.random() * 7; }
      // ducks paddle about, turning now and then and keeping clear of the boat
      ducks.forEach(function (d) { d.turn -= dt; if (d.turn < 0) { d.dir = -d.dir; d.turn = 4 + Math.random() * 7; } if (Math.abs(d.x) > 3.6) d.dir = d.x > 0 ? -1 : 1; var away = boat.st !== 'wait' && Math.abs(boat.z - d.z) < 3 && Math.abs(boat.x - d.x) < 2.6 ? (d.x > boat.x ? 1 : -1) : 0; d.x += (d.dir * d.v + away * 0.8) * dt * f.s; });
      geese.forEach(function (g) { g.x -= g.v * dt * f.s; }); geese = geese.filter(function (g) { return g.x > -200; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0;
      // the sky canvas
      so.setTransform(KS, 0, 0, KS, 0, 0); so.clearRect(0, 0, W, hz); so.globalCompositeOperation = 'source-over';
      var S = A.sun;
      if (dk) { stars.forEach(function (s, k) { var tw = 0.55 + 0.45 * Math.sin(tt * (0.8 + s.k * 1.6) + k * 2.3); so.globalAlpha = tw; so.fillStyle = '#FFF4DA'; so.beginPath(); so.arc(s.x, s.y, s.r, 0, 7); so.fill(); }); so.globalAlpha = 1;
        nl_dot(so, moonG, S[0], S[1], ph ? 60 : 90, 0.8); so.fillStyle = '#FFF2CC'; so.beginPath(); so.arc(S[0], S[1], ph ? 15 : 21, 0, 7); so.fill(); so.fillStyle = 'rgba(220,200,150,0.35)'; so.beginPath(); so.arc(S[0] - 5, S[1] - 3, 4, 0, 7); so.arc(S[0] + 6, S[1] + 5, 3, 0, 7); so.fill(); }
      else nl_dot(so, sunG, S[0], S[1], ph ? 70 : 110, 0.9);
      clouds.forEach(function (c) { var w = c.spr.w * c.s, h = c.spr.h * c.s; so.drawImage(c.spr, c.x - w / 2, c.y - h / 2, w, h); });
      so.globalCompositeOperation = 'destination-out'; so.globalAlpha = 1; so.fillStyle = '#000'; so.fill(sil); so.globalCompositeOperation = 'source-over';
      ca.drawImage(sky, 0, 0, W, hz);
      // light rippling across the tulip stripes, and the bloom wave of the moment
      // (drawn into their own canvas and cut out where the houses, the towers and the trees stand in front of the fields)
      var bl = T < 12 ? 1 : 0;
      go.setTransform(1, 0, 0, 1, 0, 0); go.clearRect(0, 0, gcv.width, gcv.height); go.translate(0, -hz);
      stripes.forEach(function (s) { var a = Math.pow(Math.max(0, Math.sin(tt * 0.7 - s.key * 0.45)), 4) * (dk ? 0.07 : 0.16) * f.a; if (a > 0.005) { go.fillStyle = dk ? 'rgba(200,210,255,' + a + ')' : 'rgba(255,255,236,' + a + ')'; go.fill(s.p); }
        if (bl) { var ts = 0.5 + s.key / kMax * 4, e = nl_env(T, ts, ts + 0.4, ts + 3.5, ts + 5.5), fl = nl_env(T, ts, ts + 0.25, ts + 0.45, ts + 1.4);
          if (e > 0) { go.globalAlpha = e; go.fillStyle = TB[s.ci]; go.fill(s.p); go.globalAlpha = e * 0.12 + fl * (dk ? 0.35 : 0.55); go.fillStyle = dk ? '#FFE6C0' : '#FFFFFF'; go.fill(s.p); go.globalAlpha = 1; } } });
      go.globalCompositeOperation = 'destination-out'; go.globalAlpha = 1; go.fillStyle = '#000'; go.fill(sil); go.globalCompositeOperation = 'source-over';
      ca.drawImage(gcv, 0, hz, gcv.width, gcv.height);
      // windows and street lamps at night, shimmering in the canal
      if (dk) {
        ca.save(); ca.clip(water); ca.globalCompositeOperation = 'lighter';
        wins.forEach(function (w) { if (!w.lit || !w.rp) return; var fl = 0.7 + 0.3 * Math.sin(tt * 1.7 + w.ph); ca.save(); ca.translate(Math.sin(tt * 1.3 + w.ph) * 1.5, 0); ca.globalAlpha = 0.4 * fl; ca.fillStyle = '#FFB850'; ca.fill(w.rp); ca.restore(); });
        lamps.forEach(function (L, k) { for (var q = 0; q < 5; q++) { var yy = L.r[1] - q * L.s * 0.3, ww = L.s * (0.6 - q * 0.08) * (0.7 + 0.3 * Math.sin(tt * 2 + q + k)); ca.fillStyle = 'rgba(255,200,120,' + (0.35 - q * 0.05) + ')'; ca.fillRect(L.r[0] - ww / 2 + Math.sin(tt * 1.6 + q) * 1.5, yy, ww, Math.max(1, L.s * 0.08)); } });
        ca.restore();
        ca.save(); ca.globalCompositeOperation = 'lighter';
        wins.forEach(function (w) { if (!w.lit) return; var fl = 0.85 + 0.15 * Math.sin(tt * 0.9 + w.ph); ca.globalAlpha = fl; ca.fillStyle = w.door ? '#E8A048' : '#FFC060'; ca.fill(w.p); ca.globalAlpha = 1; var q = w.q, cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2, r = Math.max(4, Math.abs(q[2][1] - q[0][1]) * 1.1); nl_dot(ca, winG, cx, cy, r, 0.5 * fl); });
        lamps.forEach(function (L) { nl_dot(ca, lampG, L.x, L.y, L.s * 2.2, 0.85); ca.fillStyle = '#FFE6B0'; ca.beginPath(); ca.arc(L.x, L.y, Math.max(1.2, L.s * 0.16), 0, 7); ca.fill(); });
        ca.restore();
      }
      // the sails (the far ones first)
      mills.slice().sort(function (p, q) { return q.m.Z - p.m.Z; }).forEach(function (M) { var o = nl_sails(cm, M.m, M.a), lw = Math.max(0.5, cm.f / M.m.Z * 0.08);
        ca.fillStyle = dk ? '#2A2436' : '#5A4234'; ca.fill(new Path2D(o.stock)); ca.fillStyle = dk ? 'rgba(160,156,196,0.75)' : 'rgba(250,244,230,0.92)'; ca.fill(new Path2D(o.cloth)); ca.strokeStyle = dk ? '#3A3248' : '#6A4E3A'; ca.lineWidth = lw; ca.stroke(new Path2D(o.lat));
        var h = nl_P(cm, M.m.X, M.m.H + 1.1, M.m.Z); ca.fillStyle = dk ? '#1C1A30' : '#3A302C'; ca.beginPath(); ca.arc(h[0], h[1], cm.f / M.m.Z * 0.35, 0, 7); ca.fill(); });
      // ducks beyond the bridge, the boat if it is beyond the bridge, the bridge, the bicycle, then everything nearer
      var nearZ = BR.z1;
      ducks.forEach(function (d) { if (d.z > nearZ) { var p = P(d.x, -0.8, d.z); nl_duck(ca, p[0], p[1], cm.f / d.z, d.dir, dk, d.hen, tt, d.ph); } });
      if (boat.z > BR.z0 + 1) boatDraw(ca, tt);
      willowDraw(ca, tt);
      bridgeDraw(ca, bAng);
      bikeDraw(ca, tt);
      ducks.forEach(function (d) { if (d.z <= nearZ) { var p = P(d.x, -0.8, d.z), s = cm.f / d.z; ca.strokeStyle = dk ? 'rgba(190,210,255,0.25)' : 'rgba(255,255,255,0.6)'; ca.lineWidth = 1; ca.beginPath(); ca.moveTo(p[0] - d.dir * 0.2 * s, p[1]); ca.lineTo(p[0] - d.dir * 0.6 * s, p[1] - 0.04 * s); ca.moveTo(p[0] - d.dir * 0.2 * s, p[1] + 0.02 * s); ca.lineTo(p[0] - d.dir * 0.6 * s, p[1] + 0.08 * s); ca.stroke(); nl_duck(ca, p[0], p[1], s, d.dir, dk, d.hen, tt, d.ph); } });
      if (boat.z <= BR.z0 + 1) boatDraw(ca, tt);
      // the near tulips, swaying in waves (on top of the near leaves); in the moment they bloom bigger, row by row
      tul.forEach(function (u) { var s = u.s, sw = Math.sin(tt * 1.5 - u.ph * 0.35) * 0.035 * s * f.a, ts = 0.5 + ((u.x - cm.vx) / s * 0.5) / kMax * 4, e = bl ? nl_env(T, ts, ts + 0.4, ts + 3.5, ts + 5) : 0, k = 1 + e * 0.7;
        cb.strokeStyle = dk ? '#163028' : '#3F7E36'; cb.lineWidth = Math.max(0.6, s * 0.02); cb.beginPath(); cb.moveTo(u.x, u.y - 0.2 * s); cb.quadraticCurveTo(u.x, u.y - 0.3 * s, u.x + sw, u.y - 0.34 * s); cb.stroke();
        cb.fillStyle = e > 0 ? nl_mixHex(TC[u.ci], TB[u.ci], e) : TC[u.ci]; tulipHead(cb, u.x + sw, u.y - 0.33 * s, 0.13 * s * k, 0.13 * s * k); });
      // petals thrown up as each near stripe blooms
      petals.forEach(function (p) { var u = (t - p.t0) / p.life; if (u < 0 || u > 1) return; var x = p.x + p.vx * u * p.life + Math.sin(u * 9 + p.ph) * 6, y = p.y - p.vy * u * p.life + 60 * u * u * p.life * 0.4; cb.save(); cb.globalAlpha = Math.min(1, u * 8, (1 - u) * 3); cb.translate(x, y); cb.rotate(u * 8 + p.ph); cb.fillStyle = p.c; cb.beginPath(); cb.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 7); cb.fill(); cb.restore(); });
      // the V of geese
      geese.forEach(function (g) { var w = Math.sin(tt * 7 + g.ph); nl_goose(cb, g.x, g.y + Math.sin(tt * 1.3 + g.ph) * 2, g.s, w, dk ? 'rgba(200,205,235,0.85)' : 'rgba(60,64,76,0.85)'); });
    },
    finish: function (t) { T0 = t; geese = []; petals = []; var y0 = H * (ph ? 0.1 : 0.12), s = ph ? 5 : 8;
      stripes.forEach(function (st) { if (st.b > 1) return; var q = A.stripes[st.k].p, x0 = (q[0][0] + q[1][0]) / 2, y = Math.min(H - 4, (q[0][1] + q[1][1]) / 2); if (x0 < 0 || x0 > W) return;
        for (var j = 0; j < (st.b ? 4 : 9); j++) petals.push({x: x0 + (Math.random() - 0.5) * 50, y: y - Math.random() * 20, vx: (Math.random() - 0.5) * 12, vy: 40 + Math.random() * 40, t0: t + 0.5 + st.key / kMax * 4 + Math.random() * 0.4, life: 2.4 + Math.random(), r: (ph ? 3.5 : 5) * (0.7 + Math.random() * 0.6), ph: Math.random() * 6, c: TB[st.ci]}); });
      for (var k = 0; k < 9; k++) { var row = Math.ceil(k / 2), side = k === 0 ? 0 : (k % 2 ? -1 : 1); geese.push({x: W + 60 + row * 26 * s / 6, y: y0 + side * row * 13 * s / 6, s: s * (0.9 + hash(k) * 0.2), v: (ph ? 70 : 105), ph: k * 0.7}); } }
  };
};
UIC.netherlands = {L: ['#2F5E9E', '#1E3E70', 'rgba(255,255,255,0.86)', '#1C2A3E', '#56667E', '#2F5E9E', '#C2561C', '#D27A26', '#FFFFFF'], D: ['#23305A', '#101A38', 'rgba(22,28,60,0.8)', '#EEF2FA', '#AAB4D0', '#F2A85A', '#F2A85A', '#FFD08A', '#1A1430']};
