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
// a magnificent frigatebird in profile, flying toward +x: slim body, hooked bill, forked tail, long crooked wings beating up and down
// (flap -1 down .. 1 up); the far wing is drawn first, a little lighter
function brazil_frigate(c, x, y, s, flap, dir, col, far) { c.save(); c.translate(x, y); c.scale(dir, 1); c.fillStyle = col;
  var wing = function (f, k) { var ty = -15 * s * f * k, ey = -6 * s * f * k; c.beginPath(); c.moveTo(4 * s, -0.8 * s); c.quadraticCurveTo(1 * s, ey - 2.4 * s, -3 * s, ey - 0.6 * s); c.quadraticCurveTo(-9 * s, ty * 0.85 - 1 * s, -16 * s, ty + 1.5 * s);
    c.quadraticCurveTo(-8 * s, ey + 1.2 * s, -4 * s, 1.2 * s); c.closePath(); c.fill(); };
  c.save(); c.fillStyle = far; wing(flap * 0.8 + 0.15, 0.85); c.restore();
  c.beginPath(); c.ellipse(0, 0, 9 * s, 2.5 * s, -0.04, 0, 7); c.fill();
  c.beginPath(); c.arc(8.6 * s, -1.2 * s, 2.4 * s, 0, 7); c.fill();
  c.beginPath(); c.moveTo(10 * s, -2 * s); c.lineTo(15.6 * s, -1 * s); c.quadraticCurveTo(16.4 * s, -0.4 * s, 15.6 * s, 0.4 * s); c.lineTo(10 * s, 0.2 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-7 * s, -1.2 * s); c.lineTo(-19 * s, -3.6 * s); c.lineTo(-12 * s, 0); c.lineTo(-19 * s, 3.2 * s); c.lineTo(-7 * s, 1.4 * s); c.closePath(); c.fill();
  wing(flap, 1);
  c.restore(); }
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

// ---- painters for the parts of the Rio scene that need more colours and depth than the scene's layers can hold. Each paints
// once into an offscreen canvas (brazil_deco) that the engine blits every frame.
function brazil_hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function brazil_mix(a, b, t) { var p = brazil_hex(a), q = brazil_hex(b); return 'rgb(' + p.map(function (v, i) { return Math.round(v + (q[i] - v) * t); }).join(',') + ')'; }
// a seeded random stream, so the favela and the towers come out the same every time
function brazil_rs(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
// an offscreen canvas covering x0..x0+w, y0..y0+h of the scene at k pixels per scene unit; fn paints in scene units
function brazil_deco(x0, y0, w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k)); var o = cv.getContext('2d');
  o.scale(k, k); o.translate(-x0, -y0); o.lineJoin = o.lineCap = 'round'; fn(o); cv.x0 = x0; cv.y0 = y0; cv.w = w; cv.h = h; return cv; }
// the favela: rows of houses packed up the hill (curve HL) from the shore at hz, painted from the hilltop down so nearer rows
// overlap the ones behind; each row hazes the rows already painted a little more. Houses: painted, bare brick or concrete,
// 2..4 storeys, some with an extra floor stacked on top, side faces in shade, slab roofs, shadows on the houses behind, windows,
// doors, water tanks, antennas, dishes, laundry, alleys; tangled power lines over it all. Lit windows are baked in at night,
// and a few twinklers go to 'tw'.
function brazil_paintFavela(o, F, dk, tw) { var r = brazil_rs(9137), HL = F.HL, x0 = F.x0, x1 = F.x1, hz = F.hz, top = F.top, s0 = F.s;
  var NIGHT = '#1A1E44', PAINT = ['#F2708C', '#FFC93C', '#2EC2AE', '#4A9CEA', '#A584E0', '#F28A4E', '#FFF4E2', '#86D05E', '#FF9EC0', '#5FCFE6', '#F6E07A', '#E8584E'];
  var col = function (c, t) { return dk ? brazil_mix(c, NIGHT, 0.5 + (t || 0) * 0.3) : (t ? brazil_mix(c, '#20203A', t) : c); };
  var haze, rows = [], yb = hz;
  while (yb > top - 2 * s0 && rows.length < 60) { var f = Math.max(0, Math.min(1, (hz - yb) / Math.max(1, hz - top))), s = s0 * (1 - 0.42 * f); rows.push({yb: yb, s: s}); yb -= 7.4 * s; }
  var ha = 1 - Math.pow(dk ? 0.55 : 0.62, 1 / Math.max(1, rows.length)); haze = dk ? 'rgba(30,36,80,' + ha.toFixed(4) + ')' : 'rgba(200,226,236,' + ha.toFixed(4) + ')';
  rows.reverse().forEach(function (R, ri) { var s = R.s, x = x0 - r() * 8 * s, fh = 5.6 * s;
    while (x < x1) { var w = (8 + r() * 11) * s, st = 2 + Math.floor(r() * 2.7), h = st * fh + 1.2 * s, base = R.yb + r() * 1.6 * s, hill = Math.min(brazil_yAt(HL, x), brazil_yAt(HL, x + w));
      if (base - h < hill - 3 * s) { st = Math.floor((base - hill + 2 * s) / fh); h = st * fh + 1.2 * s; }
      if (st < 1 || base < hill + 2 * s) { x += w * 0.8; continue; }
      // a narrow alley with steps now and then
      if (r() < 0.07) { o.fillStyle = col('#3A3448', 0.1); o.fillRect(x, base - h * 0.9, 2.6 * s, h * 0.9); o.fillStyle = col('#E8E0D0', 0.2); for (var yy = base - 1.5 * s; yy > base - h * 0.85; yy -= 1.8 * s) o.fillRect(x + 0.3 * s, yy, 2 * s, 0.5 * s); x += 2.6 * s; }
      var kind = r(), base_c = kind < 0.2 ? '#C0704A' : kind < 0.3 ? '#BDB4A6' : PAINT[Math.floor(r() * PAINT.length)], y0 = base - h, sw = (1.6 + r() * 1.2) * s;
      // its shadow on the houses behind, its shaded side face, its front
      o.fillStyle = dk ? 'rgba(6,8,24,0.35)' : 'rgba(40,30,60,0.22)'; o.fillRect(x + w, y0 + 1.6 * s, sw + 2.2 * s, h);
      o.fillStyle = col(base_c, 0.32); o.beginPath(); o.moveTo(x + w, y0); o.lineTo(x + w + sw, y0 - 1 * s); o.lineTo(x + w + sw, base); o.lineTo(x + w, base); o.closePath(); o.fill();
      o.fillStyle = col(base_c); o.fillRect(x, y0, w, h);
      if (kind < 0.2) { o.strokeStyle = dk ? 'rgba(10,8,20,0.25)' : 'rgba(110,50,30,0.28)'; o.lineWidth = 0.35 * s; o.beginPath(); for (var by = y0 + 1.4 * s; by < base; by += 1.4 * s) { o.moveTo(x, by); o.lineTo(x + w, by); } o.stroke(); }
      else if (kind < 0.3) { o.fillStyle = dk ? 'rgba(0,0,0,0.12)' : 'rgba(90,80,70,0.14)'; o.fillRect(x + w * r(), y0 + h * r() * 0.6, w * 0.3, h * 0.3); }
      else { o.fillStyle = dk ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.14)'; o.fillRect(x, y0, w * 0.18, h); }
      // windows by floor (some with shutters), and a door on the ground floor
      var nw = Math.max(1, Math.floor(w / (4.4 * s)));
      for (var fl = 0; fl < st; fl++) for (var j = 0; j < nw; j++) { var wx = x + (j + 0.5) * w / nw - 1 * s, wy = y0 + 1.9 * s + fl * fh;
        if (fl === st - 1 && j === nw - 1 && r() < 0.5) { o.fillStyle = col('#3A2E3A'); o.fillRect(wx, base - 3.8 * s, 2.2 * s, 3.8 * s); continue; }
        var lit = dk && r() < 0.42; o.fillStyle = lit ? (r() < 0.5 ? '#FFD487' : '#FFC46A') : col('#2E3350');
        o.fillRect(wx, wy, 2 * s, 2.5 * s); if (!dk && r() < 0.3) { o.fillStyle = col(PAINT[Math.floor(r() * PAINT.length)], 0.15); o.fillRect(wx - 0.7 * s, wy, 0.6 * s, 2.5 * s); o.fillRect(wx + 2.1 * s, wy, 0.6 * s, 2.5 * s); }
        if (lit && r() < 0.12 && tw.length < 140) tw.push([wx, wy, 2 * s, 2.5 * s, r()]); }
      // the slab roof
      o.fillStyle = col(dk ? '#8A88A8' : '#E6DED0'); o.fillRect(x - 0.5 * s, y0 - 1 * s, w + sw + 0.5 * s, 1.2 * s); o.fillStyle = 'rgba(0,0,0,0.22)'; o.fillRect(x, y0 + 0.2 * s, w, 0.5 * s);
      var ry = y0 - 1 * s, rx0 = x, rw = w;
      // an extra floor stacked unevenly on top
      if (r() < 0.32 && ry - fh > hill - 3 * s) { var ew = w * (0.45 + r() * 0.3), ex = x + r() * (w - ew), ec = r() < 0.4 ? '#C0704A' : PAINT[Math.floor(r() * PAINT.length)], eh = fh * 1.05;
        o.fillStyle = col(ec, 0.32); o.fillRect(ex + ew, ry - eh, 1.2 * s, eh); o.fillStyle = col(ec); o.fillRect(ex, ry - eh, ew, eh);
        o.fillStyle = dk && r() < 0.5 ? '#FFD487' : col('#2E3350'); o.fillRect(ex + ew * 0.5 - 1 * s, ry - eh + 1.6 * s, 2 * s, 2.4 * s);
        o.fillStyle = col(dk ? '#8A88A8' : '#E6DED0'); o.fillRect(ex - 0.4 * s, ry - eh - 1 * s, ew + 1.6 * s, 1.1 * s); ry = ry - eh - 1 * s; rx0 = ex; rw = ew; }
      // things on the roof: a blue water tank, an antenna, a dish, laundry
      var q = r();
      if (q < 0.5) { var tx = rx0 + rw * (0.2 + r() * 0.5); o.fillStyle = col('#3F86D8'); o.beginPath(); o.moveTo(tx, ry); o.lineTo(tx + 3.4 * s, ry); o.lineTo(tx + 3.1 * s, ry - 2.6 * s); o.lineTo(tx + 0.3 * s, ry - 2.6 * s); o.closePath(); o.fill();
        o.fillStyle = col('#2A62B0'); o.fillRect(tx, ry - 3.2 * s, 3.4 * s, 0.8 * s); o.fillStyle = 'rgba(255,255,255,0.3)'; o.fillRect(tx + 0.6 * s, ry - 2.4 * s, 0.5 * s, 2 * s); }
      if (r() < 0.28) { var ax = rx0 + rw * (0.1 + r() * 0.8); o.strokeStyle = col('#4A4A5A'); o.lineWidth = 0.35 * s; o.beginPath(); o.moveTo(ax, ry); o.lineTo(ax, ry - 5 * s); o.moveTo(ax - 1.4 * s, ry - 4.2 * s); o.lineTo(ax + 1.4 * s, ry - 4.2 * s); o.moveTo(ax - 1 * s, ry - 3.2 * s); o.lineTo(ax + 1 * s, ry - 3.2 * s); o.stroke(); }
      if (r() < 0.18) { var dx = rx0 + rw * (0.15 + r() * 0.7); o.fillStyle = col('#E8E6EE'); o.beginPath(); o.ellipse(dx, ry - 2.2 * s, 1.1 * s, 1.6 * s, -0.5, 0, 7); o.fill(); o.strokeStyle = col('#6A6A7A'); o.lineWidth = 0.35 * s; o.beginPath(); o.moveTo(dx, ry - 1.2 * s); o.lineTo(dx, ry); o.stroke(); }
      if (q > 0.78 && rw > 8 * s) { var ly = ry - 3.4 * s; o.strokeStyle = col('#5A5060'); o.lineWidth = 0.3 * s; o.beginPath(); o.moveTo(rx0 + 0.8 * s, ry); o.lineTo(rx0 + 0.8 * s, ly); o.quadraticCurveTo(rx0 + rw / 2, ly + 0.8 * s, rx0 + rw - 0.8 * s, ly); o.lineTo(rx0 + rw - 0.8 * s, ry); o.stroke();
        for (var cx = rx0 + 2 * s; cx < rx0 + rw - 2 * s; cx += 2.2 * s) { o.fillStyle = col(PAINT[Math.floor(r() * PAINT.length)]); o.fillRect(cx, ly + 0.35 * s, 1.5 * s, (1.2 + r()) * s); } }
      x += w + sw * 0.4 - r() * 1.2 * s; }
    // haze over everything painted so far: the higher rows get it many times over
    o.save(); o.globalCompositeOperation = 'source-atop'; o.fillStyle = haze; o.fillRect(x0 - 40, top - 60, x1 - x0 + 80, hz - top + 80); o.restore(); });
  // power lines strung across the rooftops on leaning poles
  o.strokeStyle = dk ? 'rgba(150,150,190,0.28)' : 'rgba(40,36,56,0.32)'; o.lineWidth = 0.4 * s0;
  for (var k = 0; k < 12; k++) { var lx = x0 + r() * (x1 - x0) * 0.85, lw = Math.min((24 + r() * 40) * s0, x1 - 6 * s0 - lx), pyA = hz - (hz - top) * r() * 0.6, pyB, pa = Math.min(brazil_yAt(HL, lx), brazil_yAt(HL, lx + lw));
    if (pyA < pa + 26 * s0) pyA = pa + 26 * s0; if (pyA > hz - 4 * s0 || lw < 15 * s0) continue; pyB = pyA + (r() - 0.5) * 10 * s0;
    o.beginPath(); o.moveTo(lx, pyA - 9 * s0); o.lineTo(lx + 0.6 * s0, pyA); o.moveTo(lx + lw, pyB - 9 * s0); o.lineTo(lx + lw - 0.6 * s0, pyB); o.stroke();
    for (var m = 0; m < 3; m++) { o.beginPath(); o.moveTo(lx, pyA - 9 * s0 + m * 1.2 * s0); o.quadraticCurveTo(lx + lw / 2, (pyA + pyB) / 2 - 9 * s0 + (4 + m * 1.6 + r() * 3) * s0, lx + lw, pyB - 9 * s0 + m * 1.2 * s0); o.stroke(); } } }
// downtown at the shore: a back rank of tall hazier towers and a front rank of lower blocks. Apartment blocks with balconies,
// glass office towers, stepped Art Deco blocks and modernist slabs with sun louvres, each with a shaded side face.
function brazil_paintTown(o, T, dk, tw) { var r = brazil_rs(T.seed), s = T.s, hz = T.hz;
  var NIGHT = '#1A1E44', col = function (c, t) { return dk ? brazil_mix(c, NIGHT, 0.55 + (t || 0) * 0.25) : (t ? brazil_mix(c, '#24243E', t) : c); };
  var WALL = ['#F6EEDF', '#F4D2B8', '#F2B8B4', '#CFE6E0', '#F6E2A4', '#E2D6F0', '#FFFFFF', '#D8E8F4', '#F0C890'];
  function wins(x, y0, w, h, fw, fh, ww, wh, glass) { for (var yy = y0 + fh * 0.5; yy < y0 + h - fh * 0.6; yy += fh) for (var xx = x + fw * 0.5; xx < x + w - fw * 0.5; xx += fw) { var lit = dk && r() < (glass ? 0.3 : 0.45);
    o.fillStyle = lit ? (r() < 0.6 ? '#FFD68E' : '#FFF0C4') : (glass ? 'rgba(20,40,80,0.28)' : col('#3A4260')); o.fillRect(xx - ww / 2, yy - wh / 2, ww, wh); if (lit && r() < 0.06 && tw.length < 200) tw.push([xx - ww / 2, yy - wh / 2, ww, wh, r()]); } }
  function bld(x, w, h, kind, back) { var y0 = hz - h, side = w * 0.16, wc = WALL[Math.floor(r() * WALL.length)], fh = 4.2 * s;
    o.fillStyle = dk ? 'rgba(6,8,24,0.3)' : 'rgba(40,40,70,0.16)'; o.fillRect(x + w, y0 + 3 * s, side + 3 * s, h);
    if (kind === 'glass') { var g = o.createLinearGradient(x, y0, x + w, hz); g.addColorStop(0, col('#A6D8F0')); g.addColorStop(0.5, col('#5AA2D0')); g.addColorStop(1, col('#2E6A9E')); o.fillStyle = col('#2A5A86', 0.2); o.fillRect(x + w, y0 + 1 * s, side, h);
      o.fillStyle = g; o.fillRect(x, y0, w, h); o.strokeStyle = dk ? 'rgba(160,190,255,0.18)' : 'rgba(255,255,255,0.4)'; o.lineWidth = 0.4 * s; o.beginPath();
      for (var gx = x + 3 * s; gx < x + w; gx += 3 * s) { o.moveTo(gx, y0); o.lineTo(gx, hz); } for (var gy = y0 + 3 * s; gy < hz; gy += 3 * s) { o.moveTo(x, gy); o.lineTo(x + w, gy); } o.stroke();
      o.save(); o.beginPath(); o.rect(x, y0, w, h); o.clip(); o.fillStyle = dk ? 'rgba(180,200,255,0.08)' : 'rgba(255,255,255,0.28)'; o.beginPath(); o.moveTo(x + w * 0.2, y0); o.lineTo(x + w * 0.55, y0); o.lineTo(x - w * 0.1, y0 + h * 0.7); o.lineTo(x - w * 0.45, y0 + h * 0.7); o.closePath(); o.fill(); o.restore();
      if (dk) wins(x, y0, w, h, 3 * s, 3 * s, 2.2 * s, 2.2 * s, true);
      o.fillStyle = col('#3A4A64'); o.fillRect(x - 0.5 * s, y0 - 1.5 * s, w + side + 0.5 * s, 1.6 * s); if (r() < 0.5) { o.fillRect(x + w * 0.45, y0 - 8 * s, 0.7 * s, 7 * s); if (dk) { o.fillStyle = '#FF6A5A'; o.fillRect(x + w * 0.45 - 0.3 * s, y0 - 8.6 * s, 1.3 * s, 1.3 * s); } }
      return; }
    o.fillStyle = col(wc, 0.3); o.beginPath(); o.moveTo(x + w, y0); o.lineTo(x + w + side, y0 - side * 0.35); o.lineTo(x + w + side, hz); o.lineTo(x + w, hz); o.closePath(); o.fill();
    if (kind === 'deco') { var st1 = h * 0.72, st2 = h * 0.86; o.fillStyle = col(wc); o.fillRect(x, hz - st1, w, st1); o.fillRect(x + w * 0.14, hz - st2, w * 0.72, st2); o.fillRect(x + w * 0.3, y0, w * 0.4, h);
      o.fillStyle = col(wc, 0.18); for (var px = x + w * 0.1; px < x + w; px += w * 0.2) o.fillRect(px, hz - st1 + 2 * s, 0.8 * s, st1 - 2 * s);
      wins(x + w * 0.05, hz - st1, w * 0.9, st1, w * 0.2, fh, w * 0.08, 2.6 * s); o.fillStyle = col(wc, 0.12); o.fillRect(x + w * 0.47, y0 - 6 * s, w * 0.06, 6 * s); return; }
    o.fillStyle = col(wc); o.fillRect(x, y0, w, h);
    if (kind === 'modern') { wins(x, y0, w, h - 4 * s, 3.6 * s, fh, 2.8 * s, 2.6 * s); o.strokeStyle = col(wc, 0.25); o.lineWidth = 0.55 * s; o.beginPath(); for (var ly = y0 + 1.4 * s; ly < hz - 4 * s; ly += 1.4 * s) { o.moveTo(x, ly); o.lineTo(x + w, ly); } o.stroke();
      o.fillStyle = col('#3A3448', 0.1); o.fillRect(x + 1 * s, hz - 4 * s, w - 2 * s, 4 * s); o.fillStyle = col(wc); for (var pl = x + 2 * s; pl < x + w - 1 * s; pl += 5 * s) o.fillRect(pl, hz - 4 * s, 1 * s, 4 * s); }
    else { // apartment block: balconies on every floor, a coloured stripe, rooftop water tanks
      wins(x, y0, w, h, 4.6 * s, fh, 2.6 * s, 2.6 * s);
      o.fillStyle = col(wc, -0.0001); for (var fy = y0 + fh; fy < hz - 2 * s; fy += fh) { o.fillStyle = dk ? 'rgba(200,200,240,0.15)' : 'rgba(255,255,255,0.75)'; o.fillRect(x + 1 * s, fy - 1 * s, w - 2 * s, 0.9 * s); o.fillStyle = dk ? 'rgba(0,0,0,0.25)' : 'rgba(60,60,90,0.2)'; o.fillRect(x + 1 * s, fy - 0.1 * s, w - 2 * s, 0.5 * s); }
      if (r() < 0.5) { o.fillStyle = col(['#E8584E', '#2EC2AE', '#4A9CEA', '#FFC93C'][Math.floor(r() * 4)], 0.05); o.fillRect(x + w * 0.42, y0 + 2 * s, w * 0.14, h - 2 * s); } }
    o.fillStyle = col('#8A8496', 0.1); o.fillRect(x - 0.6 * s, y0 - 1.4 * s, w + side + 0.6 * s, 1.5 * s);
    if (r() < 0.5) { o.fillStyle = col('#B8B2C4'); o.fillRect(x + w * 0.2, y0 - 4 * s, w * 0.25, 2.6 * s); } }
  [true, false].forEach(function (back) { var x = T.x0 - r() * 10 * s;
    while (x < T.x1) { var u = (x - T.x0) / (T.x1 - T.x0), prof = T.prof(u), w = (back ? 16 + r() * 16 : 13 + r() * 14) * s, h = T.tall * prof * (back ? 0.6 + r() * 0.4 : 0.28 + r() * 0.34) + 10 * s, kinds = ['apt', 'apt', 'glass', 'deco', 'modern'];
      if (prof > 0.05) bld(x, w, h, kinds[Math.floor(r() * kinds.length)], back);
      x += w * (back ? 1.05 + r() * 0.5 : 0.95 + r() * 0.35); }
    if (back) { o.save(); o.globalCompositeOperation = 'source-atop'; o.fillStyle = dk ? 'rgba(30,36,80,0.22)' : 'rgba(200,226,240,0.25)'; o.fillRect(T.x0 - 40, hz - T.tall - 60, T.x1 - T.x0 + 80, T.tall + 70); o.restore(); } });
  // the waterfront road and a row of little trees
  o.fillStyle = col('#7A7488'); o.fillRect(T.x0 - 20, hz - 1.6 * s, T.x1 - T.x0 + 40, 1.8 * s);
  for (var tx = T.x0 + 4 * s; tx < T.x1; tx += (8 + r() * 6) * s) { o.fillStyle = col('#4A8A4A'); o.beginPath(); o.arc(tx, hz - 4 * s, 2.6 * s, 0, 7); o.fill(); o.fillStyle = col('#3A7A40'); o.beginPath(); o.arc(tx + 1.2 * s, hz - 3.2 * s, 1.8 * s, 0, 7); o.fill(); } }
// Christ the Redeemer, feet at 0,0 in units of s (about 40 tall with the base): the stepped summit platform and chapel, the
// pedestal, the Art Deco robe with straight folds and a cord, the outstretched arms with the angular sleeves hanging from them,
// the bowed head with hair to the shoulders; lit from the left, shaded on the right.
function brazil_paintChrist(o, s, dk) { var L = dk ? '#E4E6FA' : '#F7F2E8', D = dk ? '#A6AAD0' : '#D8CEBE', LN = dk ? 'rgba(80,84,130,0.55)' : 'rgba(120,108,92,0.5)';
  o.save(); o.scale(s, s); o.lineJoin = 'round'; o.lineCap = 'round';
  var P = function (pts) { o.beginPath(); o.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) o.lineTo(pts[i][0], pts[i][1]); o.closePath(); o.fill(); };
  // the stepped platform on the summit, then the pedestal with its cornice
  o.fillStyle = dk ? '#8E92B8' : '#D9D2C4'; P([[-12.4, 3], [12.4, 3], [11, -0.8], [-11, -0.8]]); /* the footing runs down into the rock so neither shoulder of the peak leaves it hanging */ P([[-9, -0.8], [9, -0.8], [8.4, -2.8], [-8.4, -2.8]]);
  o.fillStyle = L; P([[-6.4, -2.8], [6.4, -2.8], [6, -4.4], [-6, -4.4]]);
  P([[-4.2, -4.4], [4.2, -4.4], [3.9, -10.4], [-3.9, -10.4]]); P([[-5, -10.4], [5, -10.4], [5, -11.6], [-5, -11.6]]);
  // the robe, flaring a little at the hem
  // (the real proportions: a 30 m figure with a 28 m span on an 8 m pedestal) a slim column of a robe, feet showing at the hem
  o.beginPath(); o.moveTo(-3.1, -11.6); o.lineTo(3.1, -11.6); o.quadraticCurveTo(2.6, -18, 2.45, -24); o.lineTo(2.9, -35.2); o.quadraticCurveTo(0, -36, -2.9, -35.2); o.lineTo(-2.45, -24); o.quadraticCurveTo(-2.6, -18, -3.1, -11.6); o.closePath(); o.fill();
  // the arms held straight out at the shoulders, slender, with open hands
  [-1, 1].forEach(function (sd) { o.beginPath(); o.moveTo(sd * 2.6, -36.2); o.lineTo(sd * 12.6, -35.9); o.quadraticCurveTo(sd * 14.1, -35.7, sd * 14, -35.1); o.quadraticCurveTo(sd * 13.9, -34.5, sd * 12.6, -34.6); o.lineTo(sd * 2.6, -34.2); o.closePath(); o.fill();
    // the wide sleeve hanging from the upper arm and forearm, deepest by the body
    P([[sd * 2.6, -34.6], [sd * 10.4, -34.8], [sd * 9.6, -33.6], [sd * 4.2, -29.6], [sd * 2.5, -29.8]]); });
  // neck, head (bowed a little), hair to the shoulders
  o.fillRect(-0.7, -37.2, 1.4, 1.4); o.beginPath(); o.ellipse(0, -38.6, 1.35, 1.75, 0, 0, 7); o.fill();
  o.fillStyle = D; o.beginPath(); o.moveTo(-1.35, -38.8); o.quadraticCurveTo(-1.45, -40.5, 0, -40.5); o.quadraticCurveTo(1.45, -40.5, 1.35, -38.8); o.lineTo(1.45, -36.8); o.lineTo(0.85, -37); o.lineTo(0.8, -39); o.quadraticCurveTo(0, -39.5, -0.8, -39); o.lineTo(-0.85, -37); o.lineTo(-1.45, -36.8); o.closePath(); o.fill();
  // shade the right side of everything painted so far, and the undersides of the arms
  o.save(); o.globalCompositeOperation = 'source-atop'; var g = o.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(0.53, dk ? 'rgba(60,64,120,0.4)' : 'rgba(150,130,110,0.4)'); g.addColorStop(1, dk ? 'rgba(60,64,120,0.5)' : 'rgba(150,130,110,0.5)');
  o.fillStyle = g; o.fillRect(-22, -42, 44, 46); o.fillStyle = dk ? 'rgba(60,64,120,0.25)' : 'rgba(150,130,110,0.28)'; o.fillRect(-22, -34.6, 44, 0.5); o.restore();
  // the folds of the robe and sleeves, the cord at the waist, the pedestal's joints, a face hint
  o.strokeStyle = LN; o.lineWidth = 0.3;
  o.beginPath(); [-1.8, -0.9, 0, 0.9, 1.8].forEach(function (fx, i) { o.moveTo(fx, -29.6); o.quadraticCurveTo(fx * 0.95 + (i % 2 ? 0.12 : -0.12), -20, fx * 1.35, -11.8); });
  o.moveTo(-2.45, -25); o.quadraticCurveTo(0, -24.5, 2.45, -25);
  [-1, 1].forEach(function (sd) { o.moveTo(sd * 8.8, -34.4); o.lineTo(sd * 5.2, -31); o.moveTo(sd * 6.8, -34.4); o.lineTo(sd * 4, -31.2); });
  o.moveTo(-4, -8.4); o.lineTo(4, -8.4); o.moveTo(-4.1, -6.4); o.lineTo(4.1, -6.4); o.stroke();
  o.fillStyle = dk ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)'; o.beginPath(); o.ellipse(-0.35, -38.4, 0.42, 0.75, 0, 0, 7); o.fill();
  o.restore(); }
// a cable car station: a concrete base, a glass hall with a slab roof and yellow trim, and the dark housing of the bull wheel on
// the side the cables leave from (dir +1 right, -1 left)
function brazil_station(o, x, y, s, dir, dk) { var w = 30 * s, h = 14 * s, l = x - w / 2;
  o.fillStyle = dk ? 'rgba(6,8,24,0.3)' : 'rgba(40,40,70,0.18)'; o.fillRect(l + 2 * s, y - 2 * s, w + 3 * s, 4 * s);
  o.fillStyle = dk ? '#5A5A7A' : '#C9C2B4'; o.fillRect(l, y - 4 * s, w, 5 * s);
  o.fillStyle = dk ? '#7A7A9A' : '#F4F0E8'; o.fillRect(l + 1.5 * s, y - h, w - 3 * s, h - 4 * s);
  o.fillStyle = dk ? '#FFD68E' : '#8EC6E4'; o.fillRect(l + 3 * s, y - h + 2.6 * s, w - 6 * s, 5.4 * s);
  o.fillStyle = dk ? 'rgba(80,70,60,0.5)' : 'rgba(60,80,110,0.5)'; for (var k = 1; k < 5; k++) o.fillRect(l + 3 * s + k * (w - 6 * s) / 5 - 0.3 * s, y - h + 2.6 * s, 0.6 * s, 5.4 * s);
  o.fillStyle = dk ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)'; o.fillRect(l + 4 * s, y - h + 3.2 * s, 3 * s, 1 * s);
  o.fillStyle = dk ? '#8E8EAE' : '#FFFFFF'; o.fillRect(l - 1.5 * s, y - h - 2 * s, w + 3 * s, 2.2 * s);
  o.fillStyle = dk ? '#A88A40' : '#F2B81E'; o.fillRect(l - 1.5 * s, y - h + 0.2 * s, w + 3 * s, 0.9 * s);
  var hx = dir > 0 ? l + w - 2 * s : l - 6 * s; o.fillStyle = dk ? '#2E2E48' : '#4A4A5C'; o.fillRect(hx, y - h + 1.4 * s, 8 * s, 7.6 * s);
  o.fillStyle = dk ? '#4A4A6A' : '#6A6A80'; o.beginPath(); o.arc(hx + 4 * s, y - h + 5.2 * s, 2.4 * s, 0, 7); o.fill(); }
// a bondinho: the carriage running on the cable, the hanger arm, and the rounded glass cabin with a coloured roof and frame
function brazil_gondola(o, x, y, s, ang, swing, frame, dk) { o.save(); o.translate(x, y); o.rotate(ang);
  o.fillStyle = dk ? '#3A3A58' : '#3A3A4A'; o.fillRect(-4.6 * s, -1.2 * s, 9.2 * s, 2.6 * s); o.fillStyle = dk ? '#6A6A8A' : '#7A7A8A'; o.beginPath(); o.arc(-2.8 * s, -1.2 * s, 1.2 * s, 0, 7); o.arc(2.8 * s, -1.2 * s, 1.2 * s, 0, 7); o.fill();
  o.rotate(-ang + swing);
  o.strokeStyle = dk ? '#7A7A9A' : '#4A4A5A'; o.lineWidth = 1.1 * s; o.beginPath(); o.moveTo(0, 1.2 * s); o.lineTo(0, 4 * s); o.quadraticCurveTo(-3 * s, 5.5 * s, -2 * s, 8.4 * s); o.stroke();
  var cy = 8 * s, w = 22 * s, h = 15 * s, rr = 5 * s, gl = dk ? 'rgba(255,210,140,0.92)' : 'rgba(176,222,244,0.92)';
  var cab = function () { o.beginPath(); o.moveTo(-w / 2 + rr, cy); o.lineTo(w / 2 - rr, cy); o.quadraticCurveTo(w / 2, cy, w / 2, cy + rr); o.lineTo(w / 2 - 0.6 * s, cy + h - rr * 0.8); o.quadraticCurveTo(w / 2 - 1.2 * s, cy + h, w / 2 - rr, cy + h); o.lineTo(-w / 2 + rr, cy + h); o.quadraticCurveTo(-w / 2 + 1.2 * s, cy + h, -w / 2 + 0.6 * s, cy + h - rr * 0.8); o.lineTo(-w / 2, cy + rr); o.quadraticCurveTo(-w / 2, cy, -w / 2 + rr, cy); o.closePath(); };
  cab(); o.fillStyle = gl; o.fill();
  o.save(); cab(); o.clip();
  o.fillStyle = frame; o.fillRect(-w / 2, cy, w, 3.2 * s); o.fillRect(-w / 2, cy + h - 3 * s, w, 3 * s);
  o.fillStyle = dk ? 'rgba(80,60,40,0.55)' : 'rgba(40,70,100,0.4)'; [-0.25, 0, 0.25].forEach(function (u) { o.fillRect(u * w - 0.45 * s, cy + 3 * s, 0.9 * s, h - 6 * s); });
  if (!dk) { o.fillStyle = 'rgba(255,255,255,0.55)'; o.beginPath(); o.moveTo(-w * 0.38, cy + 3.4 * s); o.lineTo(-w * 0.28, cy + 3.4 * s); o.lineTo(-w * 0.4, cy + h - 3.2 * s); o.lineTo(-w * 0.5, cy + h - 3.2 * s); o.closePath(); o.fill(); }
  else { o.fillStyle = 'rgba(60,40,40,0.5)'; o.beginPath(); o.arc(-w * 0.12, cy + h - 3.4 * s, 1.6 * s, Math.PI, 0); o.arc(w * 0.16, cy + h - 3.4 * s, 1.6 * s, Math.PI, 0); o.fill(); }
  o.fillStyle = 'rgba(0,0,0,0.12)'; o.fillRect(w * 0.2, cy, w * 0.3, h); o.restore();
  o.strokeStyle = dk ? 'rgba(20,20,40,0.5)' : 'rgba(40,40,60,0.35)'; o.lineWidth = 0.6 * s; cab(); o.stroke();
  o.fillStyle = frame; o.beginPath(); o.ellipse(0, cy + 0.2 * s, 5 * s, 1.4 * s, 0, 0, 7); o.fill();
  o.restore(); }

// ---------- Brazil
// Loop: the surf rolls in and its foam slides up the sand, the cable cars glide between Urca and Sugarloaf, the palms sway,
// the Brazilian flag ripples on its pole, the toucan tilts its head and hops along its branch, frigatebirds glide sideways
// across the sky, sailboats drift across the bay and the beach umbrellas flutter. Night: Christ the Redeemer glows on Corcovado,
// the favela's windows twinkle, the kiosk's string of bulbs lights up, the moon lays its path on the bay and the cable cars
// glide by with their lights on.
// Moment: a sunset blaze behind Sugarloaf, a flock of macaws and parrots flying sideways out of the forest across the bay, and
// samba-coloured confetti tossed up over the beach.
ENGINES.brazil = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, C = A.C, M = A.moon, LF = A.loaf, T0 = -99, i, k;
  // the sky behind everything: above the hills, Sugarloaf and Urca
  var skyClip = new Path2D(), hp = A.horizon; skyClip.moveTo(hp[0][0], -60); hp.forEach(function (p) { skyClip.lineTo(p[0], p[1]); }); skyClip.lineTo(hp[hp.length - 1][0], -60); skyClip.closePath();
  var water = new Path2D(brazil_pg(A.water)), below = new Path2D(); below.rect(-60, A.hz, W + 120, H - A.hz + 60);
  var glowM = brazil_rg(dk ? 'rgba(255,236,200,0.5)' : 'rgba(255,255,255,0.4)', [0.3, 0.22]), winG = brazil_rg('rgba(255,196,110,0.55)', [0.35, 0.3]), lampG = brazil_rg('rgba(255,206,120,0.8)', [0.25, 0.32]), sunG = brazil_rg('rgba(255,150,70,0.9)', [0.3, 0.45]), christG = brazil_rg('rgba(230,236,255,0.55)', [0.25, 0.3]);
  var moonSpr = brazil_sprite(M[2] * 2.2, M[2] * 2.2, 2, function (o) { var r = M[2], g = o.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFFF4'); g.addColorStop(0.75, '#FFF0CC'); g.addColorStop(1, '#F2D8A0'); o.fillStyle = g; o.beginPath(); o.arc(0, 0, r, 0, 7); o.fill();
    o.fillStyle = 'rgba(214,190,140,0.3)'; [[-0.3, -0.2, 0.2], [0.28, 0.22, 0.16], [0.05, -0.45, 0.1], [-0.15, 0.42, 0.12]].forEach(function (q) { o.beginPath(); o.arc(q[0] * r, q[1] * r, q[2] * r, 0, 7); o.fill(); }); });
  var CLD = brazil_sprite(220, 50, 1.5, function (o) { o.fillStyle = dk ? 'rgba(120,110,170,0.45)' : 'rgba(255,255,255,0.88)'; [[-70, 8, 40, 9], [-22, 0, 48, 15], [30, 4, 44, 12], [80, 9, 26, 7], [0, 11, 92, 7]].forEach(function (q) { o.beginPath(); o.ellipse(q[0], q[1], q[2], q[3], 0, 0, 7); o.fill(); });
    o.fillStyle = dk ? 'rgba(200,170,220,0.2)' : 'rgba(255,240,220,0.6)'; o.beginPath(); o.ellipse(-16, -7, 40, 4, 0, 0, 7); o.fill(); });
  var clouds = [0, 1, 2].map(function (j) { return {x: W * hash(j + 3), y: H * (ph ? 0.08 + j * 0.06 : 0.06 + j * 0.09), s: (ph ? 0.55 : 1) * (0.7 + hash(j + 7) * 0.5), v: (5 + hash(j + 5) * 5) * (ph ? 0.6 : 1)}; });
  // sailboats drifting across the bay
  var SAILS = [['#FFFFFF', '#F2F0EA'], ['#FFFFFF', '#FFC84A'], ['#FFF6E6', '#FF7A4A'], ['#FFFFFF', '#4AA8E0']];
  var boats = []; for (i = 0; i < (ph ? 3 : 5); i++) { var fr = 0.15 + hash(i * 2.3) * 0.65, by = A.hz + (brazil_yAt(A.SH, W * 0.5) - A.hz) * fr; boats.push({x: W * hash(i * 4.1 + 1), fr: fr, y: by, s: S * (ph ? 0.55 : 0.7) * (0.6 + fr * 0.8), v: (3 + hash(i) * 5) * (hash(i + 9) < 0.5 ? -1 : 1), c: SAILS[i % 4], ph: hash(i) * 6}); }
  // frigatebirds gliding across the sky, sideways, with a few wingbeats now and then
  var birds = [0, 1, 2, 3].map(function (j) { var dir = j % 3 ? 1 : -1; return {x: W * hash(j * 2.7 + 1), y: H * (ph ? 0.1 + j * 0.035 : 0.08 + j * 0.04), dir: dir, v: (ph ? 22 : 38) * (0.8 + hash(j + 2) * 0.5) * dir, s: S * (ph ? 0.7 : 1) * (0.8 + hash(j + 4) * 0.4), fl: hash(j) * 2, ph: hash(j + 6) * 6.28}; });
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
  // the Brazilian flag as cloth: every part (field, rhombus, globe, band, stars) is a path through points of the flag (u along
  // it from the pole, v down it) that a travelling wave displaces, growing toward the fly end, which sags a little; the folds are
  // shaded with a gradient that follows the wave. Drawn as vectors every frame, so it stays crisp at any pixel ratio.
  var FL = A.flag, FC = dk ? ['#2A6A54', '#B8A456', '#2E3C78', '#B8BAD0'] : ['#2E9A55', '#F3D046', '#2D4F9C', '#F7F5EC'];
  var FBand = [], FStars = [[0.53, 0.62], [0.46, 0.65], [0.58, 0.6], [0.5, 0.69], [0.43, 0.58], [0.56, 0.67], [0.52, 0.56]];
  for (i = 0; i <= 16; i++) { var fa = -Math.PI / 2 - 0.62 + 1.24 * i / 16; FBand.push([fa]); }
  function flagDraw(c, tt, wind) { var w = FL.w, h = FL.h, amp = h * 0.08 * (0.85 + 0.15 * wind), sp = 2.4 * (0.85 + 0.15 * wind);
    var M = function (u, v) { var p = u * 6.4 - tt * sp, e = Math.pow(u, 1.15); return [FL.x + u * w * (1 - 0.035 * u) - amp * 0.3 * e * (1 + Math.cos(p)), FL.y + v * h + amp * e * Math.sin(p) * (0.92 + 0.16 * v) + u * u * h * 0.06 + amp * 0.25 * e * Math.sin(u * 2.4 - tt * sp * 0.55)]; };
    var path = function (uv) { c.beginPath(); uv.forEach(function (q, n) { var p = M(q[0], q[1]); if (n) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); };
    var edge = function (a, b, n) { var out = []; for (var k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); return out; };
    var field = edge([0, 0], [1, 0], 24).concat(edge([1, 0], [1, 1], 6), edge([1, 1], [0, 1], 24), edge([0, 1], [0, 0], 6));
    var ru = 0.25 * h / w, globe = []; for (var k = 0; k < 36; k++) { var a = k / 36 * Math.PI * 2; globe.push([0.5 + Math.cos(a) * ru, 0.5 + Math.sin(a) * 0.25]); }
    c.save(); c.lineJoin = 'round';
    path(field); c.fillStyle = FC[0]; c.fill();
    path(edge([0.085, 0.5], [0.5, 0.12], 10).concat(edge([0.5, 0.12], [0.915, 0.5], 10), edge([0.915, 0.5], [0.5, 0.88], 10), edge([0.5, 0.88], [0.085, 0.5], 10))); c.fillStyle = FC[1]; c.fill();
    path(globe); c.fillStyle = FC[2]; c.fill();
    c.save(); path(globe); c.clip(); var bo = FBand.map(function (q) { return [0.4 + Math.cos(q[0]) * 0.6 * h / w, 1.02 + Math.sin(q[0]) * 0.63]; }), bi = FBand.map(function (q) { return [0.4 + Math.cos(q[0]) * 0.6 * h / w, 1.02 + Math.sin(q[0]) * 0.57]; }).reverse();
    path(bo.concat(bi)); c.fillStyle = FC[3]; c.fill();
    FStars.forEach(function (q) { var p = M(q[0], q[1]); c.beginPath(); c.arc(p[0], p[1], h * 0.013, 0, 7); c.fill(); }); c.restore();
    // the folds: dark where the cloth turns away, light where it faces the sun
    var g = c.createLinearGradient(FL.x, 0, FL.x + w, 0);
    for (k = 0; k <= 14; k++) { var u = k / 14, sl = Math.cos(u * 6.4 - tt * sp) * Math.pow(u, 1.15), al = Math.min(0.32, Math.abs(sl) * 0.32); g.addColorStop(u, sl > 0 ? 'rgba(20,30,40,' + al.toFixed(3) + ')' : 'rgba(255,255,240,' + (al * 0.7).toFixed(3) + ')'); }
    path(field); c.fillStyle = g; c.fill();
    c.strokeStyle = dk ? 'rgba(8,10,30,0.4)' : 'rgba(30,50,40,0.22)'; c.lineWidth = Math.max(0.6, 0.7 * FL.s); c.stroke();
    c.restore(); }
  // the favela, downtown and Christ the Redeemer, painted once at the screen's pixel density (tw: the windows that twinkle at night)
  var DK = Math.min(3, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)), tw = [], FV = A.fav, TN = A.town;
  var dTop = Math.min(FV.top, Math.min.apply(null, TN.map(function (q) { return A.hz - q.tall; }))) - 30 * S, dX1 = Math.max(FV.x1, Math.max.apply(null, TN.map(function (q) { return q.x1; }))) + 40 * S;
  var decor = brazil_deco(-40, dTop, dX1 + 40, A.hz + 6 - dTop, DK, function (o) { brazil_paintFavela(o, FV, dk, tw); TN.forEach(function (q) { brazil_paintTown(o, q, dk, tw); }); });
  var CH = A.christ, chS = CH[2], christSpr = brazil_deco(CH[0] - 20 * chS, CH[1] - 44 * chS, 40 * chS, 47 * chS, DK, function (o) { o.translate(CH[0], CH[1]); brazil_paintChrist(o, chS, dk); });
  // the cable car: two smooth cables between the stations on Urca and Sugarloaf, a bondinho on each, gliding in counter-motion
  // (one up while the other comes down), easing out of and into the stations and swinging gently on its hanger
  var CB = A.cab, ST = A.st, bs = ST.bs, CBO = [0, 3.6 * bs], TRIP = ph ? 18 : 22, DWELL = 4, cabT = 6;
  var cabAt = function (t, off) { return [CB.x1 + (CB.x2 - CB.x1) * t, CB.y1 + off + (CB.y2 - CB.y1) * t + CB.sag * 4 * t * (1 - t)]; };
  var cabAng = function (t) { return Math.atan2(CB.y2 - CB.y1 + CB.sag * 4 * (1 - 2 * t), CB.x2 - CB.x1); };
  var cabU = function (T) { var cyc = 2 * (TRIP + DWELL), l = ((T % cyc) + cyc) % cyc, e = function (q) { return q * q * q * (q * (q * 6 - 15) + 10); }; return l < TRIP ? e(l / TRIP) : l < TRIP + DWELL ? 1 : l < 2 * TRIP + DWELL ? 1 - e((l - TRIP - DWELL) / TRIP) : 0; };
  var cars = [{sw: 0, sv: 0, px: 0, pv: 0, c: dk ? '#B8902E' : '#F2B81E'}, {sw: 0, sv: 0, px: 0, pv: 0, c: dk ? '#A84A3A' : '#E2483A'}];
  var carT = function (n) { var u = cabU(cabT); return 0.06 + 0.88 * (n ? 1 - u : u); };
  function cableDraw(c) { brazil_station(c, ST.a[0], ST.a[1], bs, 1, dk); brazil_station(c, ST.b[0], ST.b[1], bs * 0.85, -1, dk);
    c.strokeStyle = dk ? 'rgba(200,200,230,0.5)' : 'rgba(44,44,60,0.75)'; c.lineWidth = Math.max(0.7, 0.9 * bs);
    CBO.forEach(function (o) { c.beginPath(); c.moveTo(CB.x1, CB.y1 + o); c.quadraticCurveTo((CB.x1 + CB.x2) / 2, (CB.y1 + CB.y2) / 2 + o + 2 * CB.sag, CB.x2, CB.y2 + o); c.stroke(); });
    cars.forEach(function (car, n) { var t = carT(n), p = cabAt(t, CBO[n]); brazil_gondola(c, p[0], p[1], bs * 0.8, cabAng(t), car.sw, car.c, dk);
      if (dk) { c.save(); c.globalCompositeOperation = 'lighter'; brazil_dot(c, winG, p[0], p[1] + 14 * bs, 18 * bs, 0.55); c.restore(); } }); }
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
  // the near things the surf must not wash over: each as the whole frame with that shape cut out (clipped one at a time)
  var occP = (A.occ || []).map(function (q) { var o = new Path2D(); o.rect(-100, -100, v.bw + 200, v.bh + 200); o.addPath(new Path2D(q.d)); o.y = q.y; return o; });
  var palms = A.palms.map(function (p) { return {x: p.x, y: p.y, royal: p.royal, nuts: p.nuts ? new Path2D(p.nuts) : null, fr: p.fr.map(function (f) { return {p: new Path2D(f.d), back: f.back, ph: f.ph}; }).sort(function (a, b) { return (b.back ? 1 : 0) - (a.back ? 1 : 0); })}; });
  var jungle = A.jungle.map(function (j) { return {p: new Path2D(j.d), v: new Path2D(j.v), dark: j.dark, pv: j.pv, ph: j.ph, amp: j.amp, top: j.top}; });
  var hel = {stem: new Path2D(A.hel.stem), red: new Path2D(A.hel.red), yel: new Path2D(A.hel.yel), pv: A.hel.pv}, branch = new Path2D(A.branch);
  function rot(c, pv, a) { c.translate(pv[0], pv[1]); c.rotate(a); c.translate(-pv[0], -pv[1]); }
  // night lights: the windows that light up, the far shore's street lights, the promenade lamps
  var wins = tw, shoreL = [];
  for (var sxx = 0; sxx < A.city; sxx += 9 * S) shoreL.push(sxx);
  // the moment: sunset, the flock and the confetti
  var flock = [], conf = [], CONF = ['#1FA34A', '#FFD23A', '#2A6FD6', '#FF5FA2', '#FF8A2A', '#9A4FD6', '#FFFFFF', '#2AC8C0'];
  var sunX = LF.x + LF.wr * 0.42, sunY0 = LF.top + (A.hz - LF.top) * 0.3, loafEdge = new Path2D(); var rimOn = false; LF.body.forEach(function (p) { if (p[1] < A.hz - (A.hz - LF.top) * 0.32) { if (rimOn) loafEdge.lineTo(p[0], p[1]); else loafEdge.moveTo(p[0], p[1]); rimOn = true; } else rimOn = false; });
  return {
    step: function (dt, t, f) { var d = dt * f.s;
      clouds.forEach(function (c) { c.x += c.v * d; if (c.x > W + 180) c.x = -180; });
      boats.forEach(function (b) { b.x += b.v * S * d; if (b.x > W + 60) b.x = -60; if (b.x < -60) b.x = W + 60; });
      birds.forEach(function (b) { b.x += b.v * S * d; if (b.x > W + 60) b.x = -60; if (b.x < -60) b.x = W + 60; if (b.fl > 0) b.fl -= d; else if (Math.random() < d * 0.25) b.fl = 1.4; });
      if (d > 0) { cabT += d; cars.forEach(function (car, n) { var x = cabAt(carT(n), 0)[0], v = (x - car.px) / d, acc = (v - car.pv) / d; if (cabT < 6.2) acc = 0; car.px = x; car.pv = v;
        car.sv += (-28 * car.sw - 3.2 * car.sv + acc * 0.0045 / Math.max(0.5, bs)) * d; car.sw = Math.max(-0.25, Math.min(0.25, car.sw + car.sv * d)); }); }
      // the toucan: tilts its head now and then, sometimes hops to a new spot (and turns round)
      tou.next -= d; if (tou.blink > 0) tou.blink -= d; else if (Math.random() < d * 0.25) tou.blink = 0.14;
      tou.tilt += (tou.tgt - tou.tilt) * Math.min(1, d * 6);
      if (tou.hop) { tou.hop.u += d / 0.55; if (tou.hop.u >= 1) { tou.x = tou.hop.x1; tou.hop = null; } }
      else if (tou.next <= 0) { tou.next = 1.6 + Math.random() * 2.6;
        if (Math.random() < 0.3) { var x1 = A.brX[0] + Math.random() * (A.brX[1] - A.brX[0]); if (Math.abs(x1 - tou.x) > 14 * S) { tou.dir = x1 > tou.x ? 1 : -1; tou.hop = {x0: tou.x, x1: x1, u: 0}; tou.tgt = 0; } }
        else { tou.tgt = [-0.32, -0.16, 0, 0.14, 0.26][Math.floor(Math.random() * 5)]; if (Math.random() < 0.2) tou.dir = -tou.dir; } }
      flock.forEach(function (b) { if (t < b.t0) return; b.x += b.vx * d; b.y += (b.vy + Math.sin((t - b.t0) * 2.4 + b.ph) * 14 * S) * d; b.vy *= Math.pow(0.6, d); });
      flock = flock.filter(function (b) { return b.x < W + 120 && b.y > -200; });
      conf.forEach(function (p) { if (t < p.t0) return; p.vy += 150 * S * d; p.vy = Math.min(p.vy, p.term); p.vx *= Math.pow(0.4, d); p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 22 * S) * d; p.y += p.vy * d; p.r += p.vr * d; });
      conf = conf.filter(function (p) { return p.y < H + 20; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, blaze = brazil_env(T, 0.2, 2.4, 7.5, 11.5), wind = 1 + blaze * 0.6, j;
      // ---- canvas A: the sky things behind the mountains
      ca.save(); ca.clip(skyClip);
      if (blaze > 0) { var sy = sunY0 + (A.hz - sunY0) * 0.45 * brazil_ease(T / 11);
        ca.save(); ca.globalAlpha = blaze; var gs = ca.createLinearGradient(0, 0, 0, A.hz); gs.addColorStop(0, dk ? 'rgba(120,60,120,0.35)' : 'rgba(255,170,120,0.25)'); gs.addColorStop(0.55, dk ? 'rgba(255,120,90,0.45)' : 'rgba(255,140,80,0.55)'); gs.addColorStop(1, dk ? 'rgba(255,170,90,0.6)' : 'rgba(255,200,110,0.8)'); ca.fillStyle = gs; ca.fillRect(-60, -60, W + 120, A.hz + 60); ca.restore();
        ca.save(); ca.globalCompositeOperation = 'lighter'; brazil_dot(ca, sunG, sunX, sy, (ph ? 160 : 320) * S, blaze * 0.9); ca.restore();
        ca.save(); ca.globalAlpha = blaze; var gd = ca.createRadialGradient(sunX, sy, 0, sunX, sy, 30 * S); gd.addColorStop(0, '#FFF6D0'); gd.addColorStop(0.7, '#FFD070'); gd.addColorStop(1, '#FFA040'); ca.fillStyle = gd; ca.beginPath(); ca.arc(sunX, sy, 30 * S, 0, 7); ca.fill(); ca.restore(); }
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; brazil_dot(ca, glowM, M[0], M[1], M[2] * 4, 0.55 + 0.05 * Math.sin(tt * 0.6)); ca.restore(); ca.drawImage(moonSpr, M[0] - moonSpr.w / 2, M[1] - moonSpr.h / 2, moonSpr.w, moonSpr.h); }
      clouds.forEach(function (c) { ca.drawImage(CLD, c.x - 110 * c.s, c.y - 25 * c.s, 220 * c.s, 50 * c.s); });
      ca.restore();
      // the favela and downtown; Christ the Redeemer, lit up at night (and touched with gold in the sunset)
      ca.drawImage(decor, decor.x0, decor.y0, decor.w, decor.h);
      if (dk || blaze > 0) { ca.save(); ca.globalCompositeOperation = 'lighter'; brazil_dot(ca, christG, CH[0], CH[1] - 26 * chS, 42 * chS, dk ? 0.75 + 0.05 * Math.sin(tt * 0.7) : blaze * 0.6); ca.restore(); }
      ca.drawImage(christSpr, christSpr.x0, christSpr.y0, christSpr.w, christSpr.h);
      // Sugarloaf's west face catches the sunset
      if (blaze > 0) { ca.save(); ca.globalAlpha = blaze * 0.7; ca.strokeStyle = '#FFB070'; ca.lineWidth = 3 * S; ca.lineJoin = 'round'; ca.stroke(loafEdge); ca.restore(); }
      // frigatebirds
      birds.forEach(function (b, n) { var y = b.y + Math.sin(tt * 0.5 + b.ph) * 6 * S, fl = b.fl > 0 ? Math.sin(b.fl * 11) * 0.9 : 0.12 + Math.sin(tt * 0.8 + n) * 0.08; brazil_frigate(ca, b.x, y, b.s, fl, b.dir, dk ? 'rgba(20,18,40,0.9)' : 'rgba(40,38,56,0.92)', dk ? 'rgba(40,36,70,0.7)' : 'rgba(84,82,104,0.8)'); });
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
      // night: windows, the far shore's street lights, the cable car stations
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter';
        wins.forEach(function (w) { var on = brazil_ease((t - w[4] * 6) / 1.2) * (Math.sin(t * 0.09 + w[4] * 90) > 0.94 ? 0.2 : 1) * (0.85 + 0.15 * Math.sin(tt * 3 + w[4] * 40)); if (on <= 0) return; ca.fillStyle = 'rgba(255,206,120,' + (0.9 * on) + ')'; ca.fillRect(w[0], w[1], w[2], w[3]); if (w[4] < 0.14) brazil_dot(ca, winG, w[0] + w[2] / 2, w[1] + w[3] / 2, w[3] * 2.6, on * 0.5); });
        shoreL.forEach(function (x, n) { brazil_dot(ca, lampG, x, A.hz - 2, 4 * S, 0.5 + 0.2 * flick(tt, n)); });
        brazil_dot(ca, winG, ST.a[0], ST.a[1] - 8 * bs, 30 * bs, 0.5); brazil_dot(ca, winG, ST.b[0], ST.b[1] - 7 * bs, 24 * bs, 0.5);
        ca.restore(); }
      cableDraw(ca);
      // the flock bursting out of the forest
      flock.forEach(function (b) { if (t < b.t0) return; var fl = Math.sin((t - b.t0) * b.fs + b.ph); brazil_macaw(ca, b.x, b.y, b.s, fl, b.kind, dk); });
      // ---- canvas B: the lamps, the palm crowns, the rainforest corner with the toucan, the confetti
      // the surf: a crest runs in, breaks, and its foam slides up the sand and back
      // (clipped to outside the palm trunks, the flagpole and the toucan's branch, which stand in front of it)
      cb.save(); cb.clip(below); occP.forEach(function (o) { cb.clip(o, 'evenodd'); });
      for (k = 0; k < 3; k++) { var pp = ((tt / 6.5) + k / 3) % 1, SHp = A.SH, cr, run, j2;
        if (pp < 0.42) { cr = -38 * S * (1 - brazil_ease(pp / 0.42)) - 3 * S; cb.strokeStyle = dk ? 'rgba(200,210,255,' + (0.35 * Math.sin(Math.PI * pp / 0.42)) + ')' : 'rgba(255,255,255,' + (0.85 * Math.sin(Math.PI * pp / 0.42)) + ')'; cb.lineWidth = (1.6 + pp * 4) * S; cb.beginPath();
          for (j2 = 0; j2 < SHp.length; j2++) { var py = SHp[j2][1] + cr * (0.8 + 0.2 * Math.sin(SHp[j2][0] * 0.013 + k * 2)); if (j2) cb.lineTo(SHp[j2][0], py); else cb.moveTo(SHp[j2][0], py); } cb.stroke(); }
        if (pp > 0.36) { var q = (pp - 0.36) / 0.64; run = A.sandW * 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, q * 1.15)), 0.7); var fa = (1 - q) * 0.9 * brazil_ease(Math.min(1, q * 5)); // (fades in as the wave breaks, so the foam line never pops on)
          cb.fillStyle = dk ? 'rgba(170,180,230,' + fa * 0.35 + ')' : 'rgba(255,255,255,' + fa * 0.6 + ')'; cb.beginPath();
          for (j2 = 0; j2 < SHp.length; j2++) cb.lineTo(SHp[j2][0], SHp[j2][1] - 4 * S);
          for (j2 = SHp.length - 1; j2 >= 0; j2--) cb.lineTo(SHp[j2][0], SHp[j2][1] + run * (0.7 + 0.3 * Math.sin(SHp[j2][0] * 0.021 + k * 1.7)));
          cb.closePath(); cb.fill();
          cb.strokeStyle = dk ? 'rgba(200,210,255,' + fa * 0.5 + ')' : 'rgba(255,255,255,' + Math.min(1, fa * 1.2) + ')'; cb.lineWidth = 1.6 * S; cb.beginPath();
          for (j2 = 0; j2 < SHp.length; j2++) { var ly = SHp[j2][1] + run * (0.7 + 0.3 * Math.sin(SHp[j2][0] * 0.021 + k * 1.7)) + Math.sin(SHp[j2][0] * 0.3 + tt) * 0.8; if (j2) cb.lineTo(SHp[j2][0], ly); else cb.moveTo(SHp[j2][0], ly); } cb.stroke(); } }
      cb.restore();
      // the umbrellas on the sand, the flag waving on its pole
      // (an umbrella further up the beach than a palm or the flagpole goes behind its trunk)
      A.umb.forEach(function (u) { cb.save(); occP.forEach(function (o) { if (o.y > u[1]) cb.clip(o, 'evenodd'); }); umbrella(cb, u, tt); cb.restore(); });
      flagDraw(cb, tt, wind);
      // night: the kiosk's string of bulbs and its warm glow
      if (dk) { var K = A.kiosk, ks = K[2]; cb.save(); cb.globalCompositeOperation = 'lighter'; brazil_dot(cb, lampG, K[0], K[1] - 30 * ks, 70 * ks, 0.35 + 0.05 * flick(tt, 2));
        for (k = 0; k < 9; k++) { var bx2 = K[0] - 34 * ks + k * 8.5 * ks, by2 = K[1] - 47 * ks + Math.sin(Math.PI * k / 8) * 3 * ks, ba = 0.7 + 0.3 * Math.sin(tt * 2.4 + k * 1.7); cb.fillStyle = ['rgba(255,214,120,', 'rgba(140,255,170,', 'rgba(255,150,170,'][k % 3] + ba + ')'; cb.beginPath(); cb.arc(bx2, by2, 1.6 * ks, 0, 7); cb.fill(); brazil_dot(cb, lampG, bx2, by2, 7 * ks, ba * 0.4); }
        cb.restore(); }
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
      for (k = 0; k < n; k++) { var kind = k % 5 === 4 ? 2 : k % 2; flock.push({x: F[0] + Math.random() * (F[1] - F[0]), y: F[2] + Math.random() * (F[3] - F[2]), vx: (ph ? 80 : 160) * S * (0.8 + Math.random() * 0.5), vy: -(6 + Math.random() * 16) * S, t0: t + 0.3 + Math.random() * 1.8, s: S * (ph ? 0.75 : 1.1) * (0.75 + Math.random() * 0.45) * (kind === 2 ? 0.8 : 1), kind: kind, fs: 9 + Math.random() * 4, ph: Math.random() * 6.28}); }
      // samba-coloured confetti tossed up over the beach
      for (k = 0; k < (ph ? 80 : 170); k++) { var x = Math.random() * W, y0 = brazil_yAt(A.PA, x) + Math.random() * 30 * S; conf.push({x: x, y: y0, vx: (Math.random() - 0.5) * 80 * S, vy: -(180 + Math.random() * 230) * S * (ph ? 0.9 : 1), term: (30 + Math.random() * 40) * S, t0: t + 0.6 + Math.random() * 1.8, c: CONF[k % CONF.length], w: (4 + Math.random() * 4) * S, h: (2.4 + Math.random() * 2) * S, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, sp: 1 + Math.random() * 2, ph: Math.random() * 6, round: Math.random() < 0.2}); } }
  };
};
UIC.brazil = {L: ['#1E8A5A', '#11603E', 'rgba(255,253,246,0.86)', '#163026', '#4C6A5C', '#13804E', '#13804E', '#E8A21E', '#FFFFFF'], D: ['#1E2C5E', '#0C1838', 'rgba(16,24,58,0.8)', '#F2F2FA', '#B4B8D6', '#FFD24A', '#FFD24A', '#7FE0A0', '#0C1838']};
