// -- world theme engine
function morocco_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function morocco_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return morocco_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - morocco_ease((T - c) / (d - c)); }
var morocco_gc = null;
function morocco_ctx() { return morocco_gc || (morocco_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1 that fades to transparent
function morocco_rg(col, mid) { var g = morocco_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function morocco_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
// a small offscreen canvas, drawn at k times the size, centred on (w/2, h/2)
function morocco_sprite(w, h, k, fn) { var cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); var o = cv.getContext('2d'); o.scale(k, k); o.translate(w / 2, h / 2); o.lineJoin = o.lineCap = 'round'; fn(o); cv.w = w; cv.h = h; return cv; }
function morocco_starPath(o, x, y, r, k, n, rot) { o.beginPath(); for (var i = 0; i < n * 2; i++) { var a = (rot || 0) - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r * k : r; if (i) o.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); else o.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } o.closePath(); }
// A pierced brass lantern (R = 16 units)
function morocco_lantern(o, R, lit, k, floor) {
  var dark = '#6A4416', G = ['#3EC0B0', '#E8506A', '#6A9AF0'][k % 3];
  var brass = function (y0, y1) { var g = o.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, lit ? '#B8782A' : '#B07A2A'); g.addColorStop(0.45, lit ? '#FFE09A' : '#F6D27A'); g.addColorStop(1, lit ? '#A86A20' : '#9A6420'); return g; };
  o.lineJoin = 'round'; o.strokeStyle = dark; o.lineWidth = R * 0.07;
  if (!floor) { o.beginPath(); o.arc(0, -R * 2.02, R * 0.15, 0, 7); o.stroke(); }
  o.fillStyle = brass(); o.beginPath(); o.moveTo(-R * 0.05, -R * 1.86); o.lineTo(R * 0.05, -R * 1.86); o.lineTo(R * 0.08, -R * 1.62); o.lineTo(-R * 0.08, -R * 1.62); o.closePath(); o.fill();
  o.beginPath(); o.arc(0, -R * 1.62, R * 0.1, 0, 7); o.fill(); o.stroke();
  o.beginPath(); o.moveTo(0, -R * 1.56); o.bezierCurveTo(R * 0.2, -R * 1.46, R * 0.78, -R * 1.36, R * 0.62, -R * 1.08); o.lineTo(-R * 0.62, -R * 1.08); o.bezierCurveTo(-R * 0.78, -R * 1.36, -R * 0.2, -R * 1.46, 0, -R * 1.56); o.closePath(); o.fill(); o.stroke();
  o.fillStyle = lit ? '#FFF2B8' : 'rgba(80,45,10,0.55)'; for (var q = -2; q <= 2; q++) { o.beginPath(); o.arc(q * R * 0.2, -R * 1.22, R * 0.055, 0, 7); o.fill(); }
  o.fillStyle = brass(); o.beginPath(); o.rect(-R * 0.72, -R * 1.1, R * 1.44, R * 0.18); o.fill(); o.stroke();
  var top = -R * 0.92, bot = R * 0.48, panels = [[-R * 0.7, -R * 0.38, -R * 0.55, -R * 0.3, 0.7], [-R * 0.38, R * 0.38, -R * 0.3, R * 0.3, 1], [R * 0.38, R * 0.7, R * 0.3, R * 0.55, 0.7]];
  panels.forEach(function (p, pi) {
    o.fillStyle = lit ? (pi === 1 ? '#5A3410' : '#4A2A0C') : brass(); o.beginPath(); o.moveTo(p[0], top); o.lineTo(p[1], top); o.lineTo(p[3], bot); o.lineTo(p[2], bot); o.closePath(); o.fill();
    if (!lit && pi !== 1) { o.fillStyle = 'rgba(90,50,10,0.25)'; o.fill(); }
    o.stroke();
    var cx = (p[0] + p[1] + p[2] + p[3]) / 4, ww = (p[1] - p[0]) * p[4];
    for (var r = 0; r < 4; r++) { var yy = top + (r + 0.6) * (bot - top) / 4.2, s = R * 0.12 * (pi === 1 ? 1 : 0.75), glass = lit && pi === 1 && r === 1;
      o.fillStyle = lit ? (glass ? G : '#FFE9A0') : 'rgba(80,45,10,0.6)'; morocco_starPath(o, cx, yy, s, 0.5, 8, 0); o.fill();
      if (pi === 1) { o.beginPath(); o.arc(cx - ww * 0.3, yy + R * 0.12, R * 0.04, 0, 7); o.arc(cx + ww * 0.3, yy + R * 0.12, R * 0.04, 0, 7); o.fill(); } } });
  if (lit) { var gl = o.createRadialGradient(0, -R * 0.2, 0, 0, -R * 0.2, R * 0.85); gl.addColorStop(0, 'rgba(255,240,180,0.55)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); o.fillStyle = gl; o.beginPath(); o.arc(0, -R * 0.2, R * 0.85, 0, 7); o.fill(); }
  o.fillStyle = brass(); o.beginPath(); o.rect(-R * 0.6, bot, R * 1.2, R * 0.16); o.fill(); o.stroke();
  if (floor) { o.beginPath(); o.moveTo(-R * 0.42, bot + R * 0.16); o.lineTo(R * 0.42, bot + R * 0.16); o.lineTo(R * 0.6, bot + R * 0.5); o.lineTo(-R * 0.6, bot + R * 0.5); o.closePath(); o.fill(); o.stroke(); }
  else { o.beginPath(); o.moveTo(-R * 0.5, bot + R * 0.16); o.lineTo(R * 0.5, bot + R * 0.16); o.lineTo(0, bot + R * 0.8); o.closePath(); o.fill(); o.stroke(); o.beginPath(); o.arc(0, bot + R * 0.86, R * 0.08, 0, 7); o.fill(); }
  o.fillStyle = 'rgba(255,255,255,0.4)'; o.beginPath(); o.moveTo(-R * 0.32, -R * 1.4); o.quadraticCurveTo(-R * 0.5, -R * 1.25, -R * 0.52, -R * 1.12); o.lineTo(-R * 0.42, -R * 1.12); o.quadraticCurveTo(-R * 0.4, -R * 1.28, -R * 0.32, -R * 1.4); o.fill();
}
// a little bulbul
function morocco_bird(c, x, y, s, dir, peck, flap, dk) {
  c.save(); c.translate(x, y); c.scale(dir * s / 16, s / 16);
  c.fillStyle = dk ? '#4A3A44' : '#7A6450'; c.beginPath(); c.moveTo(-6, -6); c.lineTo(-15, -3.5); c.lineTo(-14, -1); c.lineTo(-5, -3); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(-1, -6, 7.4, 5.2, -0.15, 0, 7); c.fill();
  c.fillStyle = dk ? '#8A7A80' : '#EAD8B8'; c.beginPath(); c.ellipse(0.6, -4.2, 5, 3.2, -0.1, 0, 7); c.fill();
  c.fillStyle = '#F2C23A'; c.beginPath(); c.ellipse(-4.4, -2.6, 2.2, 1.4, 0, 0, 7); c.fill();
  c.fillStyle = dk ? '#3A2C36' : '#5E4A3A'; c.save(); c.translate(-2, -7.5); c.rotate(-flap * 1.1); c.beginPath(); c.ellipse(-2, 0, 5.6, 2.6 + flap * 1.2, -0.1, 0, 7); c.fill(); c.restore();
  var hx = 5 + peck * 2.6, hy = -10 + peck * 6.6; c.fillStyle = dk ? '#4A3A44' : '#7A6450'; c.beginPath(); c.arc(hx, hy, 3.6, 0, 7); c.fill();
  c.fillStyle = dk ? '#241C26' : '#3A2C24'; c.beginPath(); c.arc(hx, hy - 0.6, 3.4, Math.PI * 1.05, Math.PI * 2.05); c.fill(); c.beginPath(); c.moveTo(hx - 2.4, hy - 2.6); c.lineTo(hx - 3.8, hy - 6.2); c.lineTo(hx + 0.6, hy - 3.2); c.closePath(); c.fill();
  c.fillStyle = '#F4F0E8'; c.beginPath(); c.ellipse(hx + 1, hy + 1.2, 1.6, 1.2, 0, 0, 7); c.fill();
  c.fillStyle = '#1A1218'; c.beginPath(); c.arc(hx + 1.4, hy - 0.4, 0.9, 0, 7); c.fill();
  c.fillStyle = '#E8A040'; c.beginPath(); c.moveTo(hx + 3.2, hy - 0.6); c.lineTo(hx + 6.2, hy + 0.6 + peck); c.lineTo(hx + 3.2, hy + 1); c.closePath(); c.fill();
  c.strokeStyle = '#C08040'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, -1.2); c.lineTo(-1.6, 0); c.moveTo(1.6, -1.2); c.lineTo(1.8, 0); c.stroke();
  c.restore(); }
ENGINES.morocco = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.C, F = A.fount, S = F.s, T0 = -99, i;
  var warmG = morocco_rg(dk ? 'rgba(255,180,90,0.62)' : 'rgba(255,210,140,0.45)', [0.3, dk ? 0.3 : 0.2]), hotG = morocco_rg('rgba(255,236,170,0.9)', [0.25, 0.5]), starG = morocco_rg(dk ? 'rgba(255,240,200,0.6)' : 'rgba(255,255,255,0.5)');
  var lanG = dk ? warmG : morocco_rg('rgba(255,160,50,0.75)', [0.3, 0.35]), dapG = morocco_rg('rgba(255,250,225,0.5)', [0.5, 0.3]), waterG = morocco_rg(dk ? 'rgba(160,220,255,0.35)' : 'rgba(255,255,255,0.5)');
  var SPR = [0, 1, 2].map(function (k) { return [false, true].map(function (lit) { return [false, true].map(function (fl) { return morocco_sprite(40, 80, 3, function (o) { o.translate(0, 4); morocco_lantern(o, 16, lit, k, fl); }); }); }); });
  var cx0 = W / 2, cy0 = H * 0.62, lan = A.lan.map(function (l, j) { var ly = l.y + l.len, a = Math.atan2(cy0 - ly, l.x - cx0); if (a < -Math.PI / 2) a += Math.PI * 2; return {x: l.x, y: l.y, len: l.len, R: l.R, kind: l.kind, k: l.k % 3, a: a, ph: hash(j + 3) * 6.28}; });
  lan.slice().sort(function (p, q) { return q.a - p.a; }).forEach(function (l, j) { l.d = 0.3 + j * (ph ? 0.5 : 0.42); });
  var pat = []; for (i = 0; i < 26; i++) pat.push({a: i / 26 * Math.PI * 2 + hash(i + 50) * 0.2, d: 0.35 + hash(i + 51) * 0.65, s: 0.6 + hash(i + 52) * 0.6, st: i % 3 !== 2});
  var star8 = new Path2D(); (function () { for (var q = 0; q < 16; q++) { var a = -Math.PI / 2 + Math.PI / 16 + q * Math.PI / 8, r = q % 2 ? 0.55 : 1; if (q) star8.lineTo(Math.cos(a) * r, Math.sin(a) * r); else star8.moveTo(Math.cos(a) * r, Math.sin(a) * r); } star8.closePath(); })();
  var spark = new Path2D('M0 -1L0.22 -0.22L1 0L0.22 0.22L0 1L-0.22 0.22L-1 0L-0.22 -0.22Z');
  var leafC = dk ? ['#2E6A4E', '#1A3E34', '#3E7E5A'] : ['#4E9A52', '#2E6E3E', '#7CBE5E'];
  var trees = A.trees.map(function (t) { var s = t.s, cl = [[-26, -112, 40], [26, -122, 42], [0, -152, 38], [-6, -120, 30]];
    return {x: t.x, y: t.y, s: s, fq: t.fq || 0.3, ph: hash(t.k + 9) * 6.28, cl: cl.map(function (q, n) { var r = q[2] * s;
      return {dx: q[0] * s, dy: q[1] * s, r: r, ph: hash(n + t.k * 7) * 6.28, spr: morocco_sprite(r * 2.6, r * 2.6, 2, function (o) {
        for (var m = 0; m < 46; m++) { var a = hash(m + n * 60 + t.k * 300) * 6.28, dd = Math.sqrt(hash(m + 7 + n * 60 + t.k * 300)) * r * 0.92, lx = Math.cos(a) * dd, ly = Math.sin(a) * dd * 0.9, ang = hash(m + 13 + n * 60) * 6.28, len = r * (0.26 + hash(m + 17) * 0.1);
          o.fillStyle = leafC[ly < -r * 0.2 && m % 3 ? 2 : m % 2]; o.save(); o.translate(lx, ly); o.rotate(ang); o.beginPath(); o.ellipse(len * 0.5, 0, len * 0.5, len * 0.2, 0, 0, 7); o.fill(); o.restore(); }
        for (m = 0; m < 6; m++) { a = hash(m + 90 + n * 9 + t.k * 31) * 6.28; dd = Math.sqrt(hash(m + 91 + n * 9)) * r * 0.75; var ox = Math.cos(a) * dd, oy = Math.sin(a) * dd * 0.9 + r * 0.1, orr = r * 0.13; var g = o.createRadialGradient(ox - orr * 0.4, oy - orr * 0.4, orr * 0.1, ox, oy, orr); g.addColorStop(0, dk ? '#F6B060' : '#FFC870'); g.addColorStop(1, dk ? '#B8601E' : '#E8701A'); o.fillStyle = g; o.beginPath(); o.arc(ox, oy, orr, 0, 7); o.fill(); }
        for (m = 0; m < 4; m++) { a = hash(m + 140 + n * 5 + t.k * 17) * 6.28; dd = Math.sqrt(hash(m + 141 + n * 5)) * r * 0.8; o.fillStyle = dk ? '#E8E0F0' : '#FFFFFF'; for (var p = 0; p < 5; p++) { var pa = p / 5 * Math.PI * 2; o.beginPath(); o.arc(Math.cos(a) * dd + Math.cos(pa) * r * 0.035, Math.sin(a) * dd + Math.sin(pa) * r * 0.035, r * 0.03, 0, 7); o.fill(); } } })}; })}; });
  var arches = A.arches.map(function (a, j) { var p = new Path2D(); a.pts.forEach(function (q, n) { if (n) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return {x: a.x, w: a.w, top: a.top, yb: a.yb, clip: p, ph: hash(j + 20) * 6.28}; });
  var curtainC = dk ? 'rgba(190,170,230,0.28)' : 'rgba(255,248,236,0.62)', foldC = dk ? 'rgba(220,200,255,0.18)' : 'rgba(220,170,130,0.35)';
  var waterClip = new Path2D(); waterClip.ellipse(F.x, F.y, F.rx, F.ry, 0, 0, 7);
  var bowlClip = new Path2D(); bowlClip.ellipse(F.x, F.bowlY, F.brx - 3, F.bry, 0, 0, 7);
  var streams = (ph ? [0, 0.3, 0.7, 1] : [0, 0.18, 0.36, 0.64, 0.82, 1]).map(function (u) { var a = u * Math.PI, x0 = F.x + Math.cos(a) * F.brx * 0.98, y0 = F.bowlY + Math.sin(a) * F.bry, x1 = F.x + Math.cos(a) * F.rx * 0.46, y1 = F.y + Math.sin(a) * F.ry * 0.46;
    return {x0: x0, y0: y0, x1: x1, y1: y1, cx: x0 + (x1 - x0) * 0.35, cy: y0 - 6 * S, ph: hash(u * 10 + 4) * 6.28}; });
  var rings = [], nextRing = 0, petals = [], drops = [], shower = [];
  for (i = 0; i < (ph ? 5 : 8); i++) petals.push({a: hash(i + 70) * 6.28, d: 0.55 + hash(i + 71) * 0.4, v: (0.04 + hash(i + 72) * 0.05) * (i % 2 ? 1 : -1), rot: hash(i + 73) * 6.28, s: (ph ? 4.2 : 6) * S * (0.8 + hash(i + 74) * 0.4), k: i % 3});
  var dapples = []; for (i = 0; i < (ph ? 10 : 18); i++) dapples.push({x: hash(i + 200) * W, y: A.yf + 8 + hash(i + 201) * (H - A.yf - 8), r: (ph ? 14 : 24) * (0.6 + hash(i + 202) * 0.8), ph: hash(i + 203) * 6.28});
  var stars = A.stars.map(function (s, j) { return {x: s.x, y: s.y, r: s.r, ph: s.k * 6.28, sp: 0.6 + hash(j + 9) * 1.2}; });
  var bird = {u: 0.3, to: 0.3, hop: 0, peck: 0, dir: 1, wait: 1.5, flap: 0, act: 0};
  function rimPt(u) { var a = Math.PI * (0.12 + u * 0.76); return [F.x + Math.cos(a) * F.rimRx * 0.96, F.y + Math.sin(a) * F.rimRy * 0.7]; }
  var PET = [['#FF9AB4', '#E2406A'], ['#FFB6C8', '#F06A8C'], ['#FF8AA4', '#C8304E']];
  function petal(c, x, y, s, rot, k, a) { c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); var g = c.createLinearGradient(0, -s, 0, s); g.addColorStop(0, PET[k][0]); g.addColorStop(1, PET[k][1]); c.fillStyle = g; c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.9, -s, s * 0.9, s * 0.4, 0, s); c.bezierCurveTo(-s * 0.9, s * 0.4, -s * 0.9, -s, 0, -s); c.fill(); c.restore(); }
  function blossom(c, x, y, s, rot, a) { c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.fillStyle = '#FFFFFF'; for (var p = 0; p < 5; p++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -s * 0.55, s * 0.36, s * 0.55, 0, 0, 7); c.fill(); } c.fillStyle = '#F6D24A'; c.beginPath(); c.arc(0, 0, s * 0.25, 0, 7); c.fill(); c.restore(); }
  function lit(l, t) { return Math.max(dk ? 1 : 0, morocco_env(t - T0 - l.d, 0, 0.35, 12, 15)); }
  return {
    step: function (dt, t, f) {
      var T = t - T0;
      nextRing -= dt * f.s; if (nextRing <= 0) { nextRing = 0.25 + Math.random() * 0.35; var sm = streams[Math.floor(Math.random() * streams.length)]; rings.push({x: sm.x1 + (Math.random() - 0.5) * 8, y: sm.y1 + (Math.random() - 0.5) * 3, t0: t, L: 1.6 + Math.random()}); if (Math.random() < 0.35) rings.push({x: F.x + (Math.random() - 0.5) * F.rx * 1.4, y: F.y + (Math.random() - 0.5) * F.ry * 1.2, t0: t, L: 2.4}); }
      rings = rings.filter(function (r) { return t - r.t0 < r.L; });
      petals.forEach(function (p) { p.a += p.v * dt * f.s; p.rot += p.v * 0.6 * dt * f.s; });
      var b = bird; b.flap = Math.max(0, b.flap - dt * 3);
      if (b.hop > 0) { b.hop = Math.max(0, b.hop - dt * 2.4); if (b.hop === 0) { b.u = b.to; b.wait = 0.8 + Math.random() * 2.2; } }
      else { b.wait -= dt * f.s; if (b.act > 0) b.act -= dt; b.peck = b.act > 0 ? Math.abs(Math.sin(b.act * 9)) : Math.max(0, b.peck - dt * 4);
        if (b.wait <= 0) { if (Math.random() < 0.4 && b.act <= 0) { b.act = 0.7; b.wait = 1; } else { var nu = Math.max(0.05, Math.min(0.95, b.u + (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.16))); b.dir = nu > b.u ? 1 : -1; b.to = nu; b.hop = 1; b.flap = 1; } } }
      if (T > 0.6 && T < 6.5) { var n = Math.round(dt * (ph ? 70 : 120)); for (var q = 0; q < n; q++) { var ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.7, sp = H * (0.55 + Math.random() * 0.35) * Math.min(1, (T - 0.6) * 2) * (T > 5.5 ? (6.5 - T) : 1); drops.push({x: F.x + (Math.random() - 0.5) * 4 * S, y: F.spout, vx: Math.cos(ang) * sp * 0.6, vy: Math.sin(ang) * sp, t0: t, sp: Math.random() < 0.25, g: Math.random() < 0.5}); } }
      drops.forEach(function (d) { d.vy += H * 1.1 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.y > F.y && d.vy > 0) { d.dead = true; if (Math.random() < 0.15) rings.push({x: d.x, y: Math.min(d.y, F.y + F.ry * 0.6), t0: t, L: 1.4}); } });
      drops = drops.filter(function (d) { return !d.dead && t - d.t0 < 4; });
      shower.forEach(function (p) { if (t < p.t0) return; p.y += p.vy * dt; p.x += (Math.sin(t * p.sw + p.ph) * 26 + 8) * dt; p.rot += p.vr * dt; });
      shower = shower.filter(function (p) { return p.y < H + 20; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, glow = morocco_env(T, 0.4, 1.2, 9, 13);
      if (dk) { ca.fillStyle = '#FFF4DA'; stars.forEach(function (s) { var a = 0.5 + 0.5 * Math.sin(tt * s.sp + s.ph); if (s.r > 1.3) { morocco_dot(ca, starG, s.x, s.y, s.r * 5, a * 0.6); ca.save(); ca.translate(s.x, s.y); ca.scale(s.r * 2.2 * (0.6 + a * 0.4), s.r * 2.2 * (0.6 + a * 0.4)); ca.globalAlpha = 0.6 + a * 0.4; ca.fill(spark); ca.restore(); } else { ca.globalAlpha = 0.45 + a * 0.5; ca.beginPath(); ca.arc(s.x, s.y, s.r, 0, 7); ca.fill(); } }); ca.globalAlpha = 1; }
      if (!dk) { ca.save(); dapples.forEach(function (d) { var a = 0.35 + 0.35 * Math.sin(tt * 0.5 + d.ph), x = d.x + Math.sin(tt * 0.23 + d.ph) * 14; morocco_dot(ca, dapG, x, d.y, d.r * (0.8 + 0.2 * Math.sin(tt * 0.7 + d.ph)), a, 0.32); }); ca.restore(); }
      arches.forEach(function (a, j) { ca.save(); ca.clip(a.clip); var hgt = a.yb - a.top;
        if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter'; morocco_dot(ca, warmG, a.x, a.yb - hgt * 0.25, a.w * 0.9, 0.45 + 0.08 * flick(tt * 0.4, j), 1.3); ca.restore(); }
        [-1, 1].forEach(function (sd) { var b = Math.sin(tt * 0.7 + a.ph + sd) * 0.5 + Math.sin(tt * 1.7 + a.ph * 2) * 0.2, edge = a.x + sd * a.w * 0.5, out = a.x + sd * (a.w * 0.6 + 4), tie = a.top + hgt * 0.62, inner = a.x + sd * a.w * (0.16 - 0.06 * b * f.a), waist = edge - sd * a.w * 0.18;
          var cu = new Path2D(); cu.moveTo(out, a.top - 4); cu.lineTo(a.x - sd * 2, a.top - 4); cu.bezierCurveTo(a.x - sd * 2, a.top + hgt * 0.25, inner, tie - hgt * 0.15, waist, tie);
          cu.bezierCurveTo(edge - sd * a.w * (0.26 + 0.08 * b * f.a), tie + hgt * 0.2, edge - sd * a.w * (0.3 + 0.06 * b * f.a), a.yb - hgt * 0.06, edge - sd * a.w * (0.24 + 0.08 * b * f.a), a.yb + 2); cu.lineTo(out, a.yb + 2); cu.closePath();
          ca.fillStyle = curtainC; ca.fill(cu); ca.save(); ca.clip(cu);
          ca.strokeStyle = foldC; ca.lineWidth = 1; for (var q = 1; q < 4; q++) { var fx = edge - sd * a.w * 0.05 * q; ca.beginPath(); ca.moveTo(fx, a.top); ca.quadraticCurveTo(fx - sd * a.w * 0.03 * q, tie, fx - sd * a.w * (0.05 + 0.02 * b) * q, a.yb); ca.stroke(); }
          ca.fillStyle = dk ? '#C8A04A' : '#D9A43A'; ca.fillRect(Math.min(waist, out) - 1, tie - 1.6, Math.abs(out - waist) + 2, 3.2); ca.restore();
          ca.beginPath(); ca.arc(waist + sd * 1.5, tie + 3, 2.2, 0, 7); ca.fill(); ca.fillRect(waist + sd * 1.5 - 0.6, tie + 4, 1.2, 4); });
        ca.restore(); });
      trees.forEach(function (tr) { var s = tr.s, sw = Math.sin(tt * 0.6 + tr.ph) * 0.025 * f.a;
        ca.save(); ca.translate(tr.x, tr.y); ca.rotate(sw);
        ca.strokeStyle = dk ? '#2A1E24' : '#6A4A30'; ca.lineCap = 'round'; ca.lineWidth = 7 * s; ca.beginPath(); ca.moveTo(0, 4 * s); ca.lineTo(0, -90 * s); ca.stroke();
        ca.lineWidth = 4 * s; ca.beginPath(); ca.moveTo(0, -80 * s); ca.quadraticCurveTo(-14 * s, -96 * s, -22 * s, -108 * s); ca.moveTo(0, -86 * s); ca.quadraticCurveTo(14 * s, -104 * s, 24 * s, -118 * s); ca.moveTo(0, -90 * s); ca.lineTo(0, -140 * s); ca.stroke();
        tr.cl.forEach(function (c) { var r2 = Math.sin(tt * 0.9 + c.ph + tr.ph) * 0.05 * f.a, w = c.spr.w; ca.save(); ca.translate(c.dx, c.dy + c.r * 0.3); ca.rotate(r2); ca.drawImage(c.spr, -w / 2, -w / 2 - c.r * 0.3, w, w); ca.restore(); });
        ca.restore(); });
      var drawLan = function (c, l, L, x, y, rot) { var sc = l.R / 16, fl = l.kind === 'floor' ? 1 : 0; c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(sc, sc); c.drawImage(SPR[l.k][0][fl], -20, -44, 40, 80); if (L > 0.01) { c.globalAlpha = L; c.drawImage(SPR[l.k][1][fl], -20, -44, 40, 80); } c.restore(); c.globalAlpha = 1; };
      var throwStars = function (c, l, x, y, L, rad) { if (L <= 0.02) return; c.save(); c.globalCompositeOperation = dk ? 'lighter' : 'source-over';
        morocco_dot(c, lanG, x, y, rad * 0.9, L * (dk ? 0.75 : 0.6));
        pat.forEach(function (p, j) { var rr = rad * p.d, px = x + Math.cos(p.a) * rr, py = y + Math.sin(p.a) * rr * 0.8, s = (ph ? 2.6 : 4) * p.s * (l.R / 12), al = L * (dk ? 0.8 : 0.35) * (0.75 + 0.25 * Math.sin(tt * 2.3 + j + l.ph)) * (1 - p.d * 0.45);
          c.globalAlpha = al; c.fillStyle = dk ? '#FFD890' : '#F09A28'; c.save(); c.translate(px, py); c.scale(s, s); if (p.st) c.fill(star8); else { c.beginPath(); c.arc(0, 0, 0.45, 0, 7); c.fill(); } c.restore(); });
        c.restore(); c.globalAlpha = 1; };
      lan.forEach(function (l) { if (l.kind !== 'wall') return; var L = lit(l, t);
        ca.strokeStyle = dk ? '#C8A050' : '#8A5A24'; ca.lineWidth = 1.4; ca.beginPath(); ca.moveTo(l.x, l.y - l.R * 2.2); ca.lineTo(l.x, l.y - l.R * 3); ca.stroke(); ca.fillStyle = dk ? '#C8A050' : '#C8902E'; ca.save(); ca.translate(l.x, l.y - l.R * 3.2); ca.scale(l.R * 0.5, l.R * 0.5); ca.fill(star8); ca.restore();
        throwStars(ca, l, l.x, l.y - l.R * 0.2, L * (0.85 + 0.15 * Math.sin(tt * 3 + l.ph)), l.R * 7);
        drawLan(ca, l, L, l.x, l.y - l.R * 0.2); });
      lan.forEach(function (l) { if (l.kind !== 'floor') return; throwStars(ca, l, l.x, l.y - l.R * 1.2, lit(l, t), l.R * 9); });
      if (glow > 0) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; morocco_dot(cb, warmG, W / 2, H * 0.6, W * 0.6, glow * (dk ? 0.25 : 0.15), 0.6); cb.restore(); }
      cb.save(); cb.clip(waterClip);
      cb.strokeStyle = dk ? 'rgba(170,220,255,0.55)' : 'rgba(255,255,255,0.8)'; cb.lineWidth = 1.2;
      rings.forEach(function (r) { var k = (t - r.t0) / r.L, rr = (4 + k * 34) * S; cb.globalAlpha = (1 - k) * 0.8; cb.beginPath(); cb.ellipse(r.x, r.y, rr, rr * F.ry / F.rx * 1.3, 0, 0, 7); cb.stroke(); });
      cb.globalAlpha = 1;
      for (i = 0; i < (ph ? 5 : 9); i++) { var ga = 0.5 + 0.5 * Math.sin(tt * 2.1 + i * 1.7); if (ga < 0.6) continue; var gx = F.x + Math.cos(i * 2.4 + tt * 0.1) * F.rx * 0.75, gy = F.y + Math.sin(i * 2.4) * F.ry * 0.6; cb.save(); cb.translate(gx, gy); cb.scale(3 * S, 1.6 * S); cb.globalAlpha = (ga - 0.6) * 2; cb.fillStyle = dk ? '#CFE8FF' : '#FFFFFF'; cb.fill(spark); cb.restore(); }
      petals.forEach(function (p) { var x = F.x + Math.cos(p.a) * F.rx * p.d * 0.85, y = F.y + Math.sin(p.a) * F.ry * p.d * 0.8 + Math.sin(tt * 1.4 + p.rot) * 0.8; petal(cb, x, y, p.s, p.rot, p.k, 0.95); });
      cb.restore(); cb.globalAlpha = 1;
      var jh = (ph ? 9 : 14) * S * (1 + 0.15 * Math.sin(tt * 6));
      cb.strokeStyle = dk ? 'rgba(190,230,255,0.75)' : 'rgba(255,255,255,0.9)'; cb.lineWidth = 2 * S; cb.beginPath(); cb.moveTo(F.x, F.spout); cb.lineTo(F.x, F.spout - jh); cb.stroke();
      cb.lineWidth = 1.1 * S; [-1, -0.4, 0.4, 1].forEach(function (d) { cb.beginPath(); cb.moveTo(F.x, F.spout - jh); cb.quadraticCurveTo(F.x + d * F.brx * 0.3, F.spout - jh - 4 * S, F.x + d * F.brx * 0.55, F.bowlY - 1); cb.stroke(); });
      cb.save(); cb.clip(bowlClip); cb.strokeStyle = dk ? 'rgba(170,220,255,0.5)' : 'rgba(255,255,255,0.7)'; cb.lineWidth = 1; for (i = 0; i < 2; i++) { var kk = ((tt * 0.8 + i * 0.5) % 1); cb.globalAlpha = 1 - kk; cb.beginPath(); cb.ellipse(F.x, F.bowlY, F.brx * kk, F.bry * kk, 0, 0, 7); cb.stroke(); } cb.restore(); cb.globalAlpha = 1;
      if (A.soffit) { var SO = A.soffit[0], SI = A.soffit[1], sC = A.C.ncream, carveC = A.C.carve;
        for (var si = 0; si < SO.length - 1; si++) { var o0 = SO[si], o1 = SO[si + 1], i0 = SI[si], i1 = SI[si + 1], nx = 0, ny = 0; for (var sj = Math.max(0, si - 3); sj <= Math.min(SO.length - 1, si + 4); sj++) { nx += SI[sj][0] - SO[sj][0]; ny += SI[sj][1] - SO[sj][1]; } var nl = Math.hypot(nx, ny) || 1;
          var sLit = Math.max(0, (nx / nl) * 0.86 - (ny / nl) * 0.5), dark = 0.42 - 0.34 * sLit, m0 = [o0[0] + (i0[0] - o0[0]) * 0.55, o0[1] + (i0[1] - o0[1]) * 0.55], m1 = [o1[0] + (i1[0] - o1[0]) * 0.55, o1[1] + (i1[1] - o1[1]) * 0.55];
          cb.beginPath(); cb.moveTo(o0[0], o0[1]); cb.lineTo(o1[0], o1[1]); cb.lineTo(i1[0], i1[1]); cb.lineTo(i0[0], i0[1]); cb.closePath(); cb.fillStyle = sC; cb.fill(); cb.lineWidth = 0.8; cb.strokeStyle = sC; cb.stroke();
          cb.fillStyle = (dk ? 'rgba(6,2,20,' : 'rgba(90,45,20,') + dark.toFixed(3) + ')'; cb.fill();
          cb.beginPath(); cb.moveTo(m0[0], m0[1]); cb.lineTo(m1[0], m1[1]); cb.lineTo(i1[0], i1[1]); cb.lineTo(i0[0], i0[1]); cb.closePath(); cb.fillStyle = dk ? 'rgba(6,2,20,0.16)' : 'rgba(90,45,20,0.1)'; cb.fill(); }
        cb.strokeStyle = carveC; cb.lineWidth = 1.2; cb.beginPath(); SI.forEach(function (p, q) { if (q) cb.lineTo(p[0], p[1]); else cb.moveTo(p[0], p[1]); }); SO.forEach(function (p, q) { if (q) cb.lineTo(p[0], p[1]); else cb.moveTo(p[0], p[1]); });
        for (si = 2; si < SO.length - 2; si += 4) { cb.moveTo(SO[si][0], SO[si][1]); cb.lineTo(SI[si][0], SI[si][1]); } cb.stroke(); }
      trees.forEach(function (tr) { var s = tr.s, sw = Math.sin(tt * 0.6 + tr.ph) * 0.025 * f.a, ry = 29 * s * tr.fq;
        cb.fillStyle = dk ? '#1C1218' : '#5E3E28'; cb.beginPath(); cb.ellipse(tr.x, tr.y, 29 * s, ry, 0, 0, 7); cb.fill();
        cb.fillStyle = dk ? 'rgba(255,255,255,0.05)' : 'rgba(255,230,200,0.14)'; cb.beginPath(); cb.ellipse(tr.x - 6 * s, tr.y + ry * 0.2, 16 * s, ry * 0.45, 0, 0, 7); cb.fill();
        cb.save(); cb.translate(tr.x, tr.y); cb.rotate(sw); cb.fillStyle = dk ? '#2A1E24' : '#6A4A30';
        cb.beginPath(); cb.moveTo(-6.5 * s, 1.5 * s); cb.quadraticCurveTo(-3.5 * s, 0, -3.5 * s, -3 * s); cb.lineTo(-3.5 * s, -ry - 6 * s); cb.lineTo(3.5 * s, -ry - 6 * s); cb.lineTo(3.5 * s, -3 * s); cb.quadraticCurveTo(3.5 * s, 0, 6.5 * s, 1.5 * s); cb.closePath(); cb.fill();
        cb.fillStyle = 'rgba(0,0,0,0.18)'; cb.fillRect(1.2 * s, -ry - 6 * s, 2.3 * s, ry + 4 * s); cb.restore(); });
      cb.lineCap = 'round'; streams.forEach(function (sm, j) { cb.strokeStyle = dk ? 'rgba(170,215,250,0.5)' : 'rgba(255,255,255,0.65)'; cb.lineWidth = 1.6 * S; cb.setLineDash([6 * S, 4 * S]); cb.lineDashOffset = -tt * 30 - j * 3; cb.beginPath(); cb.moveTo(sm.x0, sm.y0); cb.quadraticCurveTo(sm.cx, sm.cy, sm.x1, sm.y1); cb.stroke(); cb.setLineDash([]); cb.strokeStyle = dk ? 'rgba(130,190,240,0.25)' : 'rgba(220,250,255,0.4)'; cb.lineWidth = 3 * S; cb.beginPath(); cb.moveTo(sm.x0, sm.y0); cb.quadraticCurveTo(sm.cx, sm.cy, sm.x1, sm.y1); cb.stroke(); });
      if (drops.length) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; drops.forEach(function (d, j) { if (d.sp) { cb.save(); cb.translate(d.x, d.y); var s2 = 3.4 * S * (0.6 + 0.4 * Math.sin(tt * 12 + j)); cb.scale(s2 * 1.4, s2 * 1.4); cb.fillStyle = d.g ? (dk ? '#FFE08A' : '#F2B030') : (dk ? '#FFFFFF' : '#5AB8E0'); cb.fill(spark); cb.restore(); } else { var vl = Math.hypot(d.vx, d.vy) || 1, ll = 5 * S; cb.strokeStyle = dk ? 'rgba(190,230,255,0.8)' : 'rgba(70,170,215,0.85)'; cb.lineWidth = 2.2 * S; cb.beginPath(); cb.moveTo(d.x, d.y); cb.lineTo(d.x - d.vx / vl * ll, d.y - d.vy / vl * ll); cb.stroke(); cb.fillStyle = '#FFFFFF'; cb.beginPath(); cb.arc(d.x, d.y, 1.1 * S, 0, 7); cb.fill(); } }); cb.restore(); }
      var b = bird, p0 = rimPt(b.u), p1 = rimPt(b.to), hk = 1 - b.hop, bx = b.hop > 0 ? p0[0] + (p1[0] - p0[0]) * hk : p0[0], by = b.hop > 0 ? p0[1] + (p1[1] - p0[1]) * hk - Math.sin(hk * Math.PI) * 14 * S : p0[1];
      cb.fillStyle = 'rgba(40,30,40,0.18)'; cb.beginPath(); cb.ellipse(bx, (b.hop > 0 ? p0[1] + (p1[1] - p0[1]) * hk : p0[1]) + 1, 6 * S, 1.6 * S, 0, 0, 7); cb.fill();
      morocco_bird(cb, bx, by, (ph ? 14 : 20) * S, b.dir, b.peck, b.hop > 0 ? Math.abs(Math.sin(hk * Math.PI * 3)) : b.flap * 0.5, dk);
      A.candles.forEach(function (c, j) { var cs = c[4], fk = flick(tt * 1.2, j * 1.9), fh = 9 * cs * (0.8 + 0.3 * fk), y = c[3], on = dk ? 1 : 0.55 + 0.45 * glow;
        cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; morocco_dot(cb, warmG, c[0], y - fh * 0.5, 26 * cs * (0.9 + 0.2 * fk), (dk ? 0.85 : 0.35) * on); cb.restore();
        cb.fillStyle = 'rgba(255,170,60,' + (0.9 * on) + ')'; cb.beginPath(); cb.moveTo(c[0], y - fh); cb.quadraticCurveTo(c[0] + 3.4 * cs, y - fh * 0.35, c[0], y); cb.quadraticCurveTo(c[0] - 3.4 * cs, y - fh * 0.35, c[0], y - fh); cb.fill();
        cb.fillStyle = 'rgba(255,248,210,' + on + ')'; cb.beginPath(); cb.ellipse(c[0], y - fh * 0.32, 1.4 * cs, fh * 0.24, 0, 0, 7); cb.fill(); });
      lan.forEach(function (l) { if (l.kind === 'wall') return; var L = lit(l, t), fl = l.kind === 'floor';
        if (fl) { if (L > 0.01) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; morocco_dot(cb, lanG, l.x, l.y - l.R * 1.2, l.R * 3.4, L * (dk ? 0.7 : 0.75)); cb.restore(); } drawLan(cb, l, L, l.x, l.y - l.R * 1.42); if (L > 0.5 && T - l.d < 0.6 && T - l.d > 0) { cb.save(); cb.translate(l.x, l.y - l.R * 1.4); cb.scale(l.R * 2, l.R * 2); cb.fillStyle = 'rgba(255,255,255,' + (1 - (T - l.d) / 0.6) + ')'; cb.fill(spark); cb.restore(); } return; }
        var sw = (Math.sin(tt * 0.8 + l.ph) * 0.06 + Math.sin(tt * 0.31 + l.ph * 2) * 0.03) * f.a, cyy = l.len + l.R * 2.1, x = l.x + Math.sin(sw) * cyy, y = l.y + Math.cos(sw) * cyy;
        if (L > 0.01) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; morocco_dot(cb, lanG, x, y, l.R * 4.2, L * (dk ? 0.8 : 0.8)); morocco_dot(cb, hotG, x, y - l.R * 0.2, l.R * 1.3, L * (dk ? 0.35 : 0.7));
          for (var q = 0; q < 8; q++) { var a = q / 8 * Math.PI * 2 + tt * 0.05; cb.globalAlpha = L * (dk ? 0.4 : 0.6); cb.fillStyle = dk ? '#FFD890' : '#F0A030'; cb.save(); cb.translate(x + Math.cos(a) * l.R * 2.6, y + Math.sin(a) * l.R * 2.4); cb.scale(l.R * 0.22, l.R * 0.22); cb.fill(star8); cb.restore(); } cb.restore(); cb.globalAlpha = 1; }
        cb.strokeStyle = dk ? 'rgba(220,190,130,0.75)' : 'rgba(110,70,30,0.75)'; cb.lineWidth = 1.2; cb.beginPath(); cb.moveTo(l.x, l.y); cb.lineTo(l.x + Math.sin(sw) * (l.len + l.R * 0.1), l.y + Math.cos(sw) * (l.len + l.R * 0.1)); cb.stroke();
        cb.fillStyle = dk ? '#C8A04A' : '#B8862E'; cb.beginPath(); cb.ellipse(l.x, l.y - 1, 3.4, 2, 0, 0, 7); cb.fill();
        drawLan(cb, l, L, x, y, -sw);
        if (L > 0.5 && T - l.d < 0.6 && T - l.d > 0) { cb.save(); cb.translate(x, y); cb.scale(l.R * 2.2, l.R * 2.2); cb.fillStyle = 'rgba(255,255,255,' + (1 - (T - l.d) / 0.6) + ')'; cb.fill(spark); cb.restore(); } });
      shower.forEach(function (p) { if (t < p.t0) return; var a = Math.min(1, (t - p.t0) * 3); if (p.b) blossom(cb, p.x, p.y, p.s, p.rot, a); else petal(cb, p.x, p.y, p.s, p.rot, p.k, a); });
    },
    finish: function (t) { T0 = t; drops = [];
      for (var k = 0; k < (ph ? 40 : 80); k++) shower.push({x: Math.random() * W, y: -20 - Math.random() * 40, vy: (40 + Math.random() * 50) * (ph ? 0.9 : 1.2), sw: 0.8 + Math.random(), ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 3, s: (ph ? 4 : 6) * (0.7 + Math.random() * 0.6), b: k % 3 === 0, k: k % 3, t0: t + 1.2 + Math.random() * 4.5}); }
  };
};
UIC.morocco = {L: ['#2C5FA8', '#1E3A6E', 'rgba(255,252,246,0.86)', '#2A2230', '#6E5E58', '#2C5FA8', '#2C5FA8', '#C8642E', '#FFFFFF'], D: ['#2A2156', '#121434', 'rgba(22,20,52,0.8)', '#F4F0FA', '#BCB2D2', '#E8B860', '#E8B860', '#F2CC84', '#16142E']};
