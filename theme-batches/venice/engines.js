// -- world theme engine
function venice_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function venice_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return venice_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - venice_ease((T - c) / (d - c)); }
var venice_gc = null;
function venice_rg(col, mid) { var g = (venice_gc || (venice_gc = document.createElement('canvas').getContext('2d'))).createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function venice_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function venice_path(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
// a pigeon standing at (x, y) (its feet), facing dir; peck 0..1 lowers the head
function venice_pigeon(c, x, y, s, dir, t, peck, flap, dk) {
  var P = dk ? {b: '#6E7290', w: '#82869E', bar: '#2E3044', h: '#5E6280', g: '#4A8A7A', p: '#7A5A92', f: '#C07888'} : {b: '#9EA4B4', w: '#BAC0CC', bar: '#4A4E5C', h: '#868CA0', g: '#5FA888', p: '#9070B0', f: '#E08A96'};
  c.save(); c.translate(x, y); c.scale(s * dir, s); c.lineCap = 'round';
  if (!flap) { c.strokeStyle = P.f; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1, -4); c.lineTo(-2, 0); c.moveTo(2, -4); c.lineTo(2.6, 0); c.stroke(); }
  c.fillStyle = P.b; c.beginPath(); c.moveTo(-6, -7); c.lineTo(-13.6, -5); c.lineTo(-13, -2.4); c.lineTo(-5, -4.4); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0, -7.4, 8, 5.2, -0.12, 0, 7); c.fill();
  if (flap) { var a = Math.sin(t * 30) * 0.9; c.fillStyle = P.w; [1, -1].forEach(function (sd) { c.save(); c.translate(-1, -10); c.rotate(-0.4 + sd * 0.15 + a * (sd > 0 ? 1 : 0.8)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -12, -11, -14); c.lineTo(-8, -6); c.lineTo(-12, -6); c.quadraticCurveTo(-6, -1, 0, 1.5); c.fill(); c.restore(); }); }
  else { c.fillStyle = P.w; c.beginPath(); c.ellipse(-2, -7.6, 6.2, 3.6, -0.12, 0, 7); c.fill(); c.strokeStyle = P.bar; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-5.4, -8.6); c.lineTo(-1.4, -9.2); c.moveTo(-6.4, -6.8); c.lineTo(-2.2, -7.4); c.stroke(); }
  var hy = -12 + peck * 7, hx = 6 + peck * 2.4;
  c.fillStyle = P.h; c.beginPath(); c.moveTo(3, -10); c.quadraticCurveTo(hx - 1, hy + 1, hx, hy - 1); c.lineTo(hx + 2.6, hy + 1); c.quadraticCurveTo(7, -7, 5, -5); c.fill();
  c.globalAlpha = 0.85; c.fillStyle = P.g; c.beginPath(); c.ellipse(4.6, -9.6 + peck * 3, 2.2, 2.6, 0.5, 0, 7); c.fill(); c.fillStyle = P.p; c.beginPath(); c.ellipse(5.2, -8.4 + peck * 3, 1.6, 1.8, 0.5, 0, 7); c.fill(); c.globalAlpha = 1;
  c.fillStyle = P.h; c.beginPath(); c.arc(hx, hy, 2.8, 0, 7); c.fill();
  c.fillStyle = '#3A3430'; c.beginPath(); c.moveTo(hx + 2.4, hy - 0.4); c.lineTo(hx + 5, hy + 0.6); c.lineTo(hx + 2.4, hy + 1); c.fill();
  c.fillStyle = '#E86A3A'; c.beginPath(); c.arc(hx + 0.6, hy - 0.8, 0.9, 0, 7); c.fill(); c.fillStyle = '#1A1418'; c.beginPath(); c.arc(hx + 0.7, hy - 0.8, 0.45, 0, 7); c.fill();
  c.restore(); }
// the Italian tricolour waving
function venice_flag(c, x, y, w, h, t, amp, dk) {
  var cols = dk ? ['#2A6650', '#C9C5DC', '#97384A'] : ['#2E9A5C', '#FBF8F2', '#D6403F'], N = 28, i, top = [], bot = [], sl = [];
  function off(u) { return Math.sin(t * 3.2 - u * 6.5) * h * 0.075 * amp * Math.pow(u, 0.9) + Math.sin(t * 1.7 - u * 3.1) * h * 0.035 * amp * u; }
  function X(u) { return x + u * w * (1 - 0.05 * amp * u) + Math.sin(t * 3.2 - u * 6.5 - 1.2) * w * 0.012 * amp * u; }
  for (i = 0; i <= N; i++) { var u = i / N, o = off(u); top.push([X(u), y + o]); bot.push([X(u), y + o + h * (1 - 0.05 * u) + h * 0.06 * u * u]); sl.push((off(Math.min(1, u + 0.02)) - off(Math.max(0, u - 0.02))) / (0.04 * w)); }
  function outline(dx, dy) { c.beginPath(); c.moveTo(top[0][0] + dx, top[0][1] + dy); for (i = 1; i <= N; i++) c.lineTo(top[i][0] + dx, top[i][1] + dy); for (i = N; i >= 0; i--) c.lineTo(bot[i][0] + dx, bot[i][1] + dy); c.closePath(); }
  c.save(); c.lineJoin = 'round';
  outline(1.2, 1.8); c.fillStyle = dk ? 'rgba(0,0,20,0.22)' : 'rgba(60,40,30,0.13)'; c.fill();
  outline(0, 0); c.clip();
  [0, 1, 2].forEach(function (k) { var u0 = k / 3, u1 = Math.min(1, (k + 1) / 3 + 0.008), M = 10, j, u, o, p = [], q = [];
    for (j = 0; j <= M; j++) { u = u0 + (u1 - u0) * j / M; o = off(u); p.push([X(u) - (j === 0 && k === 0 ? 2 : 0), y + o - 2]); q.push([X(u) - (j === 0 && k === 0 ? 2 : 0), y + o + h * (1 - 0.05 * u) + h * 0.06 * u * u + 2]); }
    if (k === 2) { p[M][0] += 2; q[M][0] += 2; }
    c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (j = 1; j <= M; j++) c.lineTo(p[j][0], p[j][1]); for (j = M; j >= 0; j--) c.lineTo(q[j][0], q[j][1]); c.closePath(); c.fillStyle = cols[k]; c.fill(); });
  var g = c.createLinearGradient(x, 0, x + w, 0);
  for (i = 0; i <= N; i += 2) { var v = sl[i] * 2.2; g.addColorStop(i / N, v > 0 ? 'rgba(20,10,40,' + Math.min(0.17, v * 0.45).toFixed(3) + ')' : 'rgba(255,255,255,' + Math.min(0.2, -v * 0.5).toFixed(3) + ')'); }
  c.fillStyle = g; c.fillRect(x - 2, y - h, w + 6, h * 3);
  c.restore();
  c.save(); c.strokeStyle = dk ? 'rgba(10,8,30,0.35)' : 'rgba(60,40,30,0.25)'; c.lineWidth = Math.max(0.8, h * 0.035); c.lineCap = 'round'; c.beginPath(); c.moveTo(top[0][0] + 0.3, top[0][1] + 0.5); c.lineTo(bot[0][0] + 0.3, bot[0][1] - 0.5); c.stroke(); c.restore(); }
// a gondola in profile at waterline centre (x, y), k pixels per metre, heading dir
function venice_gondola(c, x, y, k, dir, t, st, dk, man) {
  var hullC = dk ? '#0C0C18' : '#1A1A24', gold = dk ? '#B89A5A' : '#D8AE4A', red = dk ? '#6E2434' : '#B8323A';
  c.save(); c.translate(x, y); c.scale(k * dir, k); c.lineJoin = c.lineCap = 'round';
  var hx = -3.95 + st * 0.32, hy = -2.05 - Math.abs(st) * 0.05, fx = -3.3, fy = -1.32, dx = fx - hx, dy = fy - hy, L = Math.hypot(dx, dy), ex = hx + dx / L * 4.4, ey = hy + dy / L * 4.4, wt = -hy / (ey - hy), wx = hx + (ex - hx) * wt;
  var ga0 = c.globalAlpha;
  if (man) { c.strokeStyle = dk ? '#5E5068' : '#9A7450'; c.lineWidth = 0.11; c.beginPath(); c.moveTo(hx, hy); c.lineTo(wx, 0); c.stroke(); c.globalAlpha = ga0 * 0.35; c.lineWidth = 0.22; c.beginPath(); c.moveTo(wx, 0); c.lineTo(ex, ey); c.stroke(); c.globalAlpha = ga0;
    c.save(); c.scale(1 / k, 1 / k); c.scale(dir, 1); c.strokeStyle = dk ? 'rgba(180,190,255,0.3)' : 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(0.8, 0.05 * k); c.beginPath(); c.ellipse(dir * wx * k, 0.05 * k, (0.35 + 0.1 * Math.abs(st)) * k, 0.07 * k, 0, 0, 7); c.stroke(); c.restore(); }
  c.fillStyle = hullC; venice_path(c, venice_HULL); c.fill();
  c.strokeStyle = gold; c.lineWidth = 0.07; c.beginPath(); venice_GUN.forEach(function (p, i) { if (p[0] > 4.6 || p[0] < -4.8) return; if (i && venice_GUN[i - 1][0] <= 4.6) c.lineTo(p[0], p[1] + 0.14); else c.moveTo(p[0], p[1] + 0.14); }); c.stroke();
  c.strokeStyle = dk ? 'rgba(160,160,220,0.25)' : 'rgba(255,255,255,0.28)'; c.lineWidth = 0.06; c.beginPath(); venice_GUN.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1] + 0.03); else c.moveTo(p[0], p[1] + 0.03); }); c.stroke();
  c.fillStyle = gold; c.beginPath(); c.arc(-0.2, -0.36, 0.13, 0, 7); c.arc(-2.6, -0.4, 0.1, 0, 7); c.arc(2.2, -0.36, 0.1, 0, 7); c.fill();
  c.fillStyle = red; c.beginPath(); c.moveTo(-1.45, -0.62); c.lineTo(0.75, -0.62); c.quadraticCurveTo(0.8, -1.02, 0.5, -1.02); c.lineTo(-1.1, -1.02); c.lineTo(-1.1, -1.36); c.quadraticCurveTo(-1.3, -1.48, -1.45, -1.36); c.closePath(); c.fill();
  c.fillStyle = gold; c.fillRect(-1.1, -1.04, 1.6, 0.07); c.fillRect(-1.45, -1.4, 0.35, 0.07);
  c.fillStyle = dk ? '#2E3A6A' : '#2E5AA0'; c.fillRect(1.0, -0.72, 1.4, 0.1);
  c.fillStyle = dk ? '#B8B8CC' : '#E4E8F0'; venice_path(c, venice_FERRO); c.fill();
  c.fillStyle = gold; c.beginPath(); c.arc(-5.62, -1.56, 0.14, 0, 7); c.fill();
  c.fillStyle = dk ? '#3A2A22' : '#6A4430'; c.beginPath(); c.moveTo(-3.42, -0.74); c.lineTo(-3.2, -0.74); c.lineTo(-3.18, -1.22); c.lineTo(-3.08, -1.36); c.lineTo(-3.3, -1.3); c.lineTo(-3.44, -1.4); c.closePath(); c.fill();
  if (man) {
    var nv = dk ? '#1C1E36' : '#1E2440', wt2 = dk ? '#C8C4DA' : '#FFFFFF', sk = dk ? '#A07868' : '#E3A47C', hat = dk ? '#B8A070' : '#F0D488', rb = dk ? '#8A2E3A' : '#D0303A';
    c.save(); c.translate(-4.45, -0.88); c.rotate(st * 0.07); c.scale(1.3, 1.3);
    c.fillStyle = nv; c.beginPath(); c.moveTo(-0.2, 0); c.lineTo(-0.06, 0); c.lineTo(0.02, -0.86); c.lineTo(-0.2, -0.86); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0.06, 0); c.lineTo(0.22, 0); c.lineTo(0.18, -0.86); c.lineTo(-0.02, -0.86); c.closePath(); c.fill();
    c.fillStyle = '#2A2228'; c.fillRect(-0.24, -0.06, 0.22, 0.07); c.fillRect(0.04, -0.06, 0.24, 0.07);
    c.save(); c.beginPath(); c.moveTo(-0.24, -0.82); c.lineTo(0.22, -0.82); c.lineTo(0.24, -1.4); c.quadraticCurveTo(0, -1.5, -0.24, -1.4); c.closePath(); c.fillStyle = wt2; c.fill(); c.clip();
    c.fillStyle = nv; for (var i = 0; i < 5; i++) c.fillRect(-0.3, -0.92 - i * 0.11, 0.6, 0.05); c.restore();
    c.fillStyle = rb; c.fillRect(-0.25, -0.88, 0.5, 0.08); c.beginPath(); c.moveTo(-0.08, -1.42); c.lineTo(0.14, -1.42); c.lineTo(0.06, -1.28); c.closePath(); c.fill();
    c.restore();
    c.strokeStyle = wt2; c.lineWidth = 0.13; var sx = -4.45 + 0.05 + st * 0.08, sy = -0.88 - 1.72;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo((sx + hx) / 2 - 0.05, (sy + hy) / 2 + 0.12, hx, hy); c.stroke();
    c.beginPath(); c.moveTo(sx + 0.06, sy + 0.04); c.quadraticCurveTo((sx + hx) / 2 + 0.1, (sy + hy) / 2 + 0.2, hx + 0.18, hy + 0.1); c.stroke();
    c.fillStyle = sk; c.beginPath(); c.arc(hx, hy, 0.07, 0, 7); c.arc(hx + 0.18, hy + 0.1, 0.07, 0, 7); c.fill();
    var px = -4.45 + st * 0.13, py = -0.88 - 2.13;
    c.fillStyle = sk; c.beginPath(); c.arc(px + 0.04, py, 0.25, 0, 7); c.fill();
    c.fillStyle = dk ? '#2A1E1E' : '#4A3226'; c.beginPath(); c.arc(px - 0.06, py - 0.02, 0.22, Math.PI * 0.55, Math.PI * 1.45); c.fill();
    c.fillStyle = '#231A1C'; c.beginPath(); c.arc(px + 0.16, py, 0.035, 0, 7); c.fill();
    c.fillStyle = 'rgba(240,120,120,0.55)'; c.beginPath(); c.arc(px + 0.12, py + 0.1, 0.05, 0, 7); c.fill();
    c.fillStyle = hat; c.beginPath(); c.ellipse(px + 0.03, py - 0.17, 0.4, 0.06, 0, 0, 7); c.fill(); c.fillRect(px - 0.19, py - 0.36, 0.44, 0.19);
    c.fillStyle = rb; c.fillRect(px - 0.19, py - 0.25, 0.44, 0.07);
  }
  c.restore(); }
// a gull gliding, centre (x, y), size s, wings at phase w
function venice_gull(c, x, y, s, dir, w, dk) {
  c.save(); c.translate(x, y); c.scale(s * dir, s); c.lineCap = c.lineJoin = 'round';
  var up = Math.sin(w) * 4;
  c.fillStyle = dk ? '#B8BCD6' : '#FFFFFF'; c.strokeStyle = dk ? '#6A6E8E' : '#8A93A4'; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-1, 0); c.quadraticCurveTo(-7, -4 - up, -14, -1 - up * 1.4); c.quadraticCurveTo(-7, -1 - up * 0.4, -1, 2); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(1, 0); c.quadraticCurveTo(7, -4 - up, 14, -1 - up * 1.4); c.quadraticCurveTo(7, -1 - up * 0.4, 1, 2); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, 1, 5, 2.2, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#F2B84A'; c.beginPath(); c.moveTo(4.6, 0.4); c.lineTo(7, 1); c.lineTo(4.6, 1.6); c.fill();
  c.restore(); }
ENGINES.venice = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, s = A.s, yB = A.yB, T0 = -99, i;
  var lampG = venice_rg(dk ? 'rgba(255,200,120,0.8)' : 'rgba(255,226,170,0.3)', [0.25, 0.35]), goldG = venice_rg('rgba(255,210,120,0.7)', [0.3, 0.3]);
  var rip = []; for (i = 0; i < (ph ? 50 : 90); i++) { var u = hash(i + 3); rip.push({x: hash(i + 7) * W, y: yB + 5 * s + Math.pow(u, 1.15) * (H - yB), l: (6 + hash(i + 9) * 18) * s * (0.5 + u), ph: hash(i + 11) * 6.28, d: hash(i + 13) < 0.4, v: (3 + hash(i + 15) * 5) * s * (hash(i + 17) < 0.5 ? 1 : -1), f: u}); }
  var wins = A.wins.map(function (w) { return {p: new Path2D(w.p), on: w.k < 0.42, k: w.k, x: w.x, y: w.y, w: w.w, h: w.h}; }), nextFlip = 2;
  var L = A.lanes, gs = [{L: L[0], x: W * 0.72, dir: -1, wait: 0, ph: 1.3}, {L: L[1], x: W * (ph ? 0.4 : 0.3), dir: 1, wait: 0, ph: 0.2}], regatta = [];
  function len(g) { return g.L.k * 6.5; }
  var perches = A.perch.filter(function (p) { return p[1] - p[0] > 30 * s; }), pigs = [], pS = 0.8 * s;
  for (i = 0; i < (ph ? 4 : 7) && perches.length; i++) { var pr = perches[Math.floor(hash(i * 3.1 + 2) * perches.length)], px = pr[0] + (pr[1] - pr[0]) * (0.15 + hash(i + 41) * 0.7);
    pigs.push({pr: pr, x: px, dir: hash(i + 43) < 0.5 ? -1 : 1, st: 'idle', tt: hash(i + 44) * 2, dur: 1, z: 0, peck: 0, x0: px, fx: px}); }
  function pigNext(p) { var r = Math.random(), pr = p.pr; p.st = r < 0.4 ? 'peck' : r < 0.78 ? 'hop' : r < 0.94 ? 'idle' : 'fly'; p.dur = p.st === 'peck' ? 0.7 : p.st === 'hop' ? 0.32 : p.st === 'fly' ? 2.6 : 0.8 + Math.random() * 1.4; p.tt = 0; p.x0 = p.x;
    if (p.st === 'hop') { if (Math.random() < 0.3) p.dir *= -1; p.fx = Math.max(pr[0] + 4 * s, Math.min(pr[1] - 4 * s, p.x + p.dir * (6 + Math.random() * 10) * s)); }
    if (p.st === 'fly') { p.fx = pr[0] + (pr[1] - pr[0]) * (0.1 + Math.random() * 0.8); p.dir = p.fx > p.x ? 1 : -1; } }
  var gulls = [0, 1].map(function (n) { return {x: n ? W * 0.3 : -999, y: H * (0.1 + n * 0.08), dir: n ? 1 : -1, v: (24 + n * 8) * s, wait: n ? 0 : 6}; });
  var flock = [];
  var CLC = dk ? [['#B8B4CC', '#9894B0'], ['#9A4A5A', '#C8C4DA'], ['#B8A070', '#9A8458'], ['#5A78A8', '#8AA4C8'], ['#3E6A5E', '#5A8A7A']] : [['#FFFFFF', '#E6E8EE'], ['#D8443C', '#FFFFFF'], ['#F2CC5A', '#E4B440'], ['#6AA4D8', '#B8D8F2'], ['#3E9A84', '#7AC4AE']];
  function cloth(c, o, t, f) { var a = Math.sin(t * 1.4 + o.x * 0.05) * 0.07 * f.a + Math.sin(t * 3.1 + o.x) * 0.02 * f.a, w = o.w, h = o.h, col = CLC[o.t];
    c.save(); c.translate(o.x, o.y); c.rotate(a); c.fillStyle = col[0];
    var bw = Math.sin(t * 2.4 + o.x * 0.1) * h * 0.04 * f.a;
    if (o.t === 0 || o.t === 4) { c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w / 2 + bw, h); for (var k = 4; k >= 0; k--) c.quadraticCurveTo(-w / 2 + (k + 0.5) * w / 5 + bw, h + (k % 2 ? 2 : -2), -w / 2 + k * w / 5 + bw, h); c.closePath(); c.fill();
      c.fillStyle = col[1]; if (o.t === 4) { c.fillRect(-w / 2, h * 0.75, w, h * 0.08); c.fillRect(-w / 2, h * 0.85, w, h * 0.04); } else { c.globalAlpha = 0.6; c.fillRect(-w / 2, 0, w * 0.08, h); c.globalAlpha = 1; } }
    else if (o.t === 2) { c.beginPath(); c.moveTo(-w * 0.32, 0); c.lineTo(w * 0.32, 0); c.lineTo(w / 2 + bw, h); c.lineTo(-w / 2 + bw, h); c.closePath(); c.fill(); c.fillStyle = col[1]; c.fillRect(-w * 0.32, 0, w * 0.64, h * 0.1); }
    else { c.beginPath(); c.moveTo(-w * 0.3, 0); c.lineTo(w * 0.3, 0); c.lineTo(w * 0.55, h * 0.12); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w * 0.36, h * 0.38); c.lineTo(w * 0.34 + bw, h); c.lineTo(-w * 0.34 + bw, h); c.lineTo(-w * 0.36, h * 0.38); c.lineTo(-w * 0.62, h * 0.42); c.lineTo(-w * 0.55, h * 0.12); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = col[1]; for (var y2 = h * 0.08; y2 < h; y2 += h * 0.16) c.fillRect(-w, y2, w * 2, h * 0.07); c.restore(); }
    c.fillStyle = dk ? '#7A6A5A' : '#B88A5A'; c.fillRect(-w * 0.3 - 1, -2, 2, 4); c.fillRect(w * 0.3 - 1, -2, 2, 4);
    c.restore(); }
  var rC = document.createElement('canvas'), rX = rC.getContext('2d');
  function reflect(c, x, y, k, dir, t, st, man) {
    var tr = c.getTransform(), sc = Math.max(1, Math.hypot(tr.a, tr.b)), x0 = x - 6.8 * k, y0 = y - 0.6 * k, bw = 13.6 * k, bh = 4.4 * k, pw = Math.ceil(bw * sc), phh = Math.ceil(bh * sc);
    if (rC.width < pw || rC.height < phh) { rC.width = Math.max(rC.width, pw); rC.height = Math.max(rC.height, phh); }
    rX.setTransform(1, 0, 0, 1, 0, 0); rX.clearRect(0, 0, pw + 2, phh + 2); rX.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc);
    rX.translate(0, 1.85 * y); rX.scale(1, -0.85); venice_gondola(rX, x, y, k, dir, t, st, dk, man);
    c.save(); c.globalAlpha *= dk ? 0.3 : 0.22; c.drawImage(rC, 0, 0, pw, phh, x0, y0, bw, bh); c.restore(); }
  function boat(c, x, y, k, dir, t, man, pen, flagT, a) {
    var st = Math.sin(t * 2.1);
    c.save(); if (a != null) c.globalAlpha = a;
    reflect(c, x, y, k, dir, t, st, man);
    c.strokeStyle = dk ? 'rgba(180,190,255,0.3)' : 'rgba(255,255,255,0.7)'; c.lineCap = 'round'; c.lineWidth = Math.max(0.8, 0.07 * k);
    for (var q = 0; q < 3; q++) { var wx0 = x - dir * (5.6 + q * 1.6) * k, wl = (1.2 - q * 0.25) * k, wy = y + (0.25 + q * 0.12) * k; c.globalAlpha = (a == null ? 1 : a) * (0.8 - q * 0.22); c.beginPath(); c.moveTo(wx0, wy); c.lineTo(wx0 - dir * wl, wy); c.moveTo(wx0 + dir * 0.6 * k, wy - 0.2 * k); c.lineTo(wx0 - dir * wl * 0.5, wy - 0.2 * k); c.stroke(); }
    c.globalAlpha = a == null ? 1 : a;
    var bob = Math.sin(t * 1.6) * 0.04 * k;
    venice_gondola(c, x, y + bob, k, dir, t, st, dk, man);
    if (pen) { var sx = x + dir * 2.9 * k, sy = y + bob - 0.6 * k, top = sy - 1.7 * k; c.strokeStyle = dk ? '#8A7A60' : '#6A5240'; c.lineWidth = Math.max(0.8, 0.07 * k); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, top); c.stroke();
      venice_flag(c, sx + 0.04 * k, top + 0.05 * k, 0.95 * k, 0.6 * k, flagT, 1.3, dk); }
    c.restore(); }
  var lastT = 0;
  return {
    step: function (dt, t, f) {
      lastT = t; var d = dt * f.s;
      gs.forEach(function (g) { if (g.wait > 0) { g.wait -= d; if (g.wait <= 0) { g.dir = Math.random() < 0.5 ? 1 : -1; g.x = g.dir > 0 ? -len(g) : W + len(g); } }
        else { g.x += g.dir * g.L.v * d; if (g.x < -len(g) - 4 || g.x > W + len(g) + 4) g.wait = 3 + Math.random() * 5; } });
      regatta.forEach(function (g) { g.t += d; if (g.t > 0) g.x += g.v * d; });
      rip.forEach(function (r) { r.x += r.v * d; if (r.x > W + 30) r.x = -30; if (r.x < -30) r.x = W + 30; });
      if (dk && t > nextFlip) { var w = wins[Math.floor(Math.random() * wins.length)]; if (w) w.on = !w.on; nextFlip = t + 1.5 + Math.random() * 3; }
      pigs.forEach(function (p) { p.tt += d; var u = Math.max(0, Math.min(1, p.tt / p.dur));
        p.peck = p.st === 'peck' && Math.sin(u * Math.PI * 2) > 0 ? Math.sin(u * Math.PI * 2) : 0;
        if (p.st === 'hop') { p.x = p.x0 + (p.fx - p.x0) * u; p.z = Math.sin(u * Math.PI) * 4 * s; }
        else if (p.st === 'fly' || p.st === 'burst') { p.x = p.x0 + (p.fx - p.x0) * venice_ease(u); p.z = Math.sin(u * Math.PI) * (p.st === 'burst' ? 70 : 26) * s; }
        else p.z = 0;
        if (u >= 1) { p.z = 0; pigNext(p); } });
      gulls.forEach(function (g) { if (g.wait > 0) { g.wait -= d; if (g.wait <= 0) { g.dir = Math.random() < 0.5 ? 1 : -1; g.x = g.dir > 0 ? -40 : W + 40; g.y = H * (0.07 + Math.random() * 0.16); g.v = (22 + Math.random() * 14) * s; } return; }
        g.x += g.dir * g.v * d; if (g.x < -60 || g.x > W + 60) g.wait = 6 + Math.random() * 10; });
      flock.forEach(function (b) { b.t += d; if (b.t > 0) b.x += b.vx * d; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, Tm = t - T0, bells = venice_env(Tm, 0, 0.3, 5.5, 7), gold = venice_env(Tm, 0.6, 1.6, 6.5, 8.5), fin = venice_env(Tm, 0, 0.6, 7, 9);
      // -- back canvas (over the palazzos, under the bank's stone, shutters and poles)
      if (bells > 0) { var B = A.bell, ring = (Tm % 0.9) / 0.9, sw = Math.sin(Tm * 7), sk = A.tk;
        ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over'; venice_dot(ca, goldG, B[0], B[1], sk * 9 * (1 + 0.3 * (1 - ring)), bells * (0.5 + 0.4 * (1 - ring)));
        ca.strokeStyle = dk ? 'rgba(255,226,160,1)' : 'rgba(255,250,235,1)'; ca.lineCap = 'round';
        for (i = 0; i < 3; i++) { var rr = ((Tm + i * 0.3) % 0.9) / 0.9, R = sk * (8 + rr * 26); ca.globalAlpha = bells * (1 - rr) * 0.9; ca.lineWidth = Math.max(1, sk * 0.6);
          [-1, 1].forEach(function (sd) { ca.beginPath(); ca.arc(B[0], B[1], R, sd < 0 ? Math.PI * 0.75 : -Math.PI * 0.25, sd < 0 ? Math.PI * 1.25 : Math.PI * 0.25); ca.stroke(); }); }
        ca.globalAlpha = bells; ca.fillStyle = '#E8B84A'; ca.save(); ca.translate(B[0], B[1] - sk * 2.4); ca.rotate(sw * 0.5); ca.beginPath(); ca.moveTo(-sk * 1.1, sk * 2.6); ca.quadraticCurveTo(-sk * 0.8, 0, 0, 0); ca.quadraticCurveTo(sk * 0.8, 0, sk * 1.1, sk * 2.6); ca.closePath(); ca.fill(); ca.restore();
        ca.restore(); }
      if (dk) { ca.save(); wins.forEach(function (w) { if (!w.on) return; ca.fillStyle = w.k < 0.15 ? '#FFE2A8' : '#F6C070'; ca.globalAlpha = 0.95; ca.fill(w.p); }); ca.restore(); }
      ca.save(); ca.beginPath(); ca.rect(-10, yB + 2 * s, W + 20, H - yB + 10); ca.clip(); ca.lineCap = 'round';
      rip.forEach(function (r) { var a = 0.5 + 0.5 * Math.sin(tt * 1.3 + r.ph);
        ca.strokeStyle = r.d ? (dk ? 'rgba(10,16,40,' + (0.45 * a) + ')' : 'rgba(30,100,96,' + (0.4 * a) + ')') : (dk ? 'rgba(170,190,255,' + (0.3 * a) + ')' : 'rgba(255,255,255,' + (0.7 * a) + ')');
        ca.lineWidth = Math.max(0.8, (1 + r.f * 1.4) * s); var Lr = r.l * (0.8 + 0.2 * Math.sin(tt + r.ph)); ca.beginPath(); ca.moveTo(r.x - Lr / 2, r.y); ca.lineTo(r.x + Lr / 2, r.y); ca.stroke(); });
      if (dk) { ca.globalCompositeOperation = 'lighter';
        wins.forEach(function (w, n) { if (!w.on) return; var ry = 2 * yB - w.y; if (ry > H) return; for (var q = 0; q < 3; q++) { var yy = ry + q * w.h * 0.3, ww = w.w * (0.6 + 0.3 * Math.sin(tt * 2.2 + n + q)); ca.fillStyle = 'rgba(255,196,110,' + (0.2 + 0.08 * Math.sin(tt * 3 + n * 1.7 + q)) + ')'; ca.fillRect(w.x - ww / 2 + Math.sin(tt * 1.7 + n + q) * w.w * 0.2, yy, ww, Math.max(1, 1.6 * s)); } });
        A.lamps.forEach(function (l, n) { for (var q = 0; q < 16; q++) { var yy = yB + 4 * s + q * 7 * s, ww = s * (16 - q * 0.6) * (0.6 + 0.4 * Math.sin(tt * 2.6 + q * 1.3 + n)); if (yy > H) break; ca.fillStyle = 'rgba(255,206,120,' + (0.45 - q * 0.025) + ')'; ca.fillRect(l[0] - ww / 2 + Math.sin(tt * 1.9 + q) * 2 * s, yy, ww, Math.max(1, 1.8 * s)); } });
        if (A.moon) for (var q2 = 0; q2 < 10; q2++) { var my = yB + 6 * s + q2 * 9 * s, mw = (30 - q2 * 2) * s * (0.6 + 0.4 * Math.sin(tt * 2 + q2)); ca.fillStyle = 'rgba(220,220,255,' + (0.16 - q2 * 0.012) + ')'; ca.fillRect(A.moon[0] - mw / 2 + Math.sin(tt * 1.3 + q2) * 3 * s, my, mw, 1.6 * s); }
        ca.globalCompositeOperation = 'source-over'; }
      else { ca.globalCompositeOperation = 'source-over';
        for (i = 0; i < (ph ? 12 : 24); i++) { var gx = W * hash(i * 2.7 + 5), gy = yB + (H - yB) * (0.08 + 0.9 * hash(i * 1.9 + 3)), sh = Math.max(0, Math.sin(tt * 2.4 + i * 2.1)); if (sh < 0.6) continue; ca.fillStyle = 'rgba(255,255,255,' + ((sh - 0.6) * 2) + ')'; ca.fillRect(gx - 3 * s, gy, 6 * s, 1.4 * s); ca.fillRect(gx - 0.7 * s, gy - 2 * s, 1.4 * s, 5.4 * s); } }
      if (gold > 0) { var xc = -W * 0.3 + W * 1.6 * venice_ease((Tm - 0.6) / 5.4), bw = W * 0.35;
        ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
        var g = ca.createLinearGradient(xc - bw, 0, xc + bw, 0); g.addColorStop(0, 'rgba(255,214,120,0)'); g.addColorStop(0.5, 'rgba(255,214,120,' + (gold * (dk ? 0.32 : 0.42)) + ')'); g.addColorStop(1, 'rgba(255,214,120,0)'); ca.fillStyle = g; ca.fillRect(xc - bw, yB, bw * 2, H - yB);
        for (i = 0; i < (ph ? 50 : 110); i++) { var gx2 = W * hash(i * 1.7 + 4), gy2 = yB + (H - yB) * hash(i * 2.3 + 1); if (Math.abs(gx2 - xc) > bw) continue; var sh2 = 0.5 + 0.5 * Math.sin(t * 7 + i * 1.3), gl = (4 + (gy2 - yB) / (H - yB) * 14) * s; ca.fillStyle = 'rgba(255,240,190,' + (gold * sh2 * 0.9 * (1 - Math.abs(gx2 - xc) / bw)) + ')'; ca.fillRect(gx2 - gl / 2, gy2, gl, Math.max(1, 1.6 * s)); }
        ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      // -- front canvas
      pigs.forEach(function (p) { var yb = p.pr[2], flying = p.st === 'fly' || p.st === 'burst';
        if (!flying || p.z < 2) { cb.fillStyle = dk ? 'rgba(0,0,10,0.25)' : 'rgba(60,40,20,0.16)'; cb.beginPath(); cb.ellipse(p.x, yb, 6 * pS, 1.2 * pS, 0, 0, 7); cb.fill(); }
        venice_pigeon(cb, p.x, yb - p.z, pS, p.dir, t, p.peck, flying && p.z > 1, dk); });
      var F = A.flag; venice_flag(cb, F.x, F.y, F.w, F.h, tt, (1 + fin * 0.8) * f.a, dk);
      A.cloth.forEach(function (o) { cloth(cb, o, tt, f); });
      gulls.forEach(function (g) { if (g.wait > 0) return; venice_gull(cb, g.x, g.y + Math.sin(tt * 0.9 + g.v) * 6 * s, 0.9 * s, g.dir, tt * 2.2 + g.v, dk); });
      A.moor.forEach(function (m, n) { boat(cb, m.x, m.y + Math.sin(tt * 1.1 + n * 1.7) * 0.6 * s * f.a, m.k, m.dir, 0, false, false, tt); });
      var ga = regatta.length ? 1 - fin : 1; if (ga > 0.01) gs.forEach(function (g, n) { if (g.wait > 0) return; boat(cb, g.x, g.L.y, g.L.k, g.dir, tt + g.ph, true, n === 1, tt + n, ga); });
      regatta.forEach(function (g) { if (g.t < 0) return; boat(cb, g.x, g.y, g.k, 1, tt + g.ph, true, true, tt + g.ph, Math.min(1, g.t * 1.5)); });
      if (flock.length) { cb.save(); cb.strokeStyle = dk ? 'rgba(220,220,240,0.9)' : 'rgba(70,70,90,0.85)'; cb.lineCap = 'round';
        flock.forEach(function (b) { if (b.t < 0) return; var y = b.y + Math.sin(b.t * 1.5 + b.ph) * 8 * s, wv = Math.sin(t * 14 + b.ph) * b.s * 0.6; cb.globalAlpha = Math.min(1, b.t * 2); cb.lineWidth = Math.max(0.9, b.s * 0.3); cb.beginPath(); cb.moveTo(b.x - b.s, y - wv); cb.quadraticCurveTo(b.x - b.s * 0.4, y - b.s * 0.3, b.x, y); cb.quadraticCurveTo(b.x + b.s * 0.4, y - b.s * 0.3, b.x + b.s, y - wv); cb.stroke(); });
        cb.restore(); }
      if (dk) A.lamps.forEach(function (l, n) { cb.save(); cb.globalCompositeOperation = 'lighter'; cb.fillStyle = '#FFD890'; cb.fillRect(l[0] - 4 * l[2], l[1] - 6 * l[2], 8 * l[2], 11 * l[2]); venice_dot(cb, lampG, l[0], l[1], 40 * l[2], 0.8 + 0.08 * Math.sin(tt * 2 + n)); cb.restore(); });
    },
    finish: function (t) { T0 = t;
      pigs.forEach(function (p, k) { var pr = p.pr; p.st = 'burst'; p.dur = 3.2 + k * 0.25; p.tt = -k * 0.12; p.x0 = p.x; p.fx = pr[0] + (pr[1] - pr[0]) * (0.1 + Math.random() * 0.8); p.dir = p.fx > p.x ? 1 : -1; });
      var fr = ph ? [0.42, 0.7, 0.92] : [0.5, 0.74, 0.97], kk = [0.66, 0.82, 1]; regatta = [];
      for (var k = 0; k < 3; k++) regatta.push({x: -L[1].k * 7 - [2, 0, 1][k] * 170 * s, y: yB + (H - yB) * fr[k], k: L[1].k * kk[k], v: (W + L[1].k * 14 + 340 * s) / 8, t: -0.2 - k * 0.3, ph: k * 1.7});
      regatta.sort(function (a, b) { return a.y - b.y; });
      flock = []; for (k = 0; k < (ph ? 16 : 28); k++) flock.push({x: -20 - Math.random() * W * 0.5, y: H * (0.06 + Math.random() * 0.22), vx: (90 + Math.random() * 70) * s, s: (3 + Math.random() * 2.4) * s, t: -Math.random() * 0.8, ph: Math.random() * 6});
    }
  };
};
UIC.venice = {L: ['#357A74', '#22504C', 'rgba(255,253,250,0.86)', '#1F2E2C', '#5C6866', '#A84A32', '#A84A32', '#C9784C', '#FFFFFF'], D: ['#262C60', '#121834', 'rgba(22,26,58,0.8)', '#F4F0FA', '#B8B4D6', '#F2C878', '#F2C878', '#F6DA9E', '#161A3A']};
