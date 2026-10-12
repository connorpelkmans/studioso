// ---- batch n10 engines: icecave
function n10_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n10_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n10_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n10_ease((T - c) / (d - c)); }
var n10_gc = null;
function n10_ctx() { return n10_gc || (n10_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n10_dot
function n10_rg(col, mid) { var g = n10_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n10_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n10_pts(p, pts) { pts.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; }
function n10_path(pts) { return n10_pts(new Path2D(), pts); }
// a four-point sparkle
function n10_star(c, x, y, r, a, col) { if (a <= 0.01 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y); c.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r); c.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y); c.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r); c.fill(); c.restore(); }
function n10_drop(c, x, y, r, st) { c.beginPath(); c.moveTo(x, y - r * st); c.quadraticCurveTo(x + r * 1.05, y - r * 0.2, x + r, y + r * 0.1); c.arc(x, y, r, 0, Math.PI); c.quadraticCurveTo(x - r * 1.05, y - r * 0.2, x, y - r * st); c.fill(); }

// ---------- Blue Ice Cave: light glows through the thin ice and shifts slowly, drips gather on the icicles and fall into the
// meltwater with little rings, snow drifts past the mouth and the odd flake blows in, ice glints. Night: an aurora dances outside
// and tints the ice. Moment: the light floods in; a wave of glow runs out through every band of ice, the icicles chime with light
// one after another, and diamond dust spirals in through the mouth (by day a prism of colour lands on the floor).
ENGINES.icecave = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, C = A.cave, S = A.S, i, k;
  var openP = n10_path(A.open), floorP = n10_path(A.floor), rp = A.ridge, wallP = n10_pts(new Path2D(), A.floor); wallP.rect(-80, -80, W + 160, H + 160);
  var skyP = new Path2D(); skyP.moveTo(rp[0][0], rp[0][1]); rp.forEach(function (q) { skyP.lineTo(q[0], q[1]); }); skyP.lineTo(rp[rp.length - 1][0], -60); skyP.lineTo(rp[0][0], -60); skyP.closePath();
  var bands = A.rings.map(function (r, j) { var p = new Path2D(); if (j < A.rings.length - 1) n10_pts(p, A.rings[j + 1]); else p.rect(-80, -80, W + 160, H + 160); return n10_pts(p, r); });
  var glowG = n10_rg(dk ? 'rgba(100,160,255,0.6)' : 'rgba(190,252,255,0.75)', [0.4, 0.3]), aurG = n10_rg('rgba(90,255,190,0.45)', [0.4, 0.25]), pinkG = n10_rg('rgba(255,120,210,0.4)', [0.4, 0.25]);
  var bloomG = n10_rg(dk ? 'rgba(140,190,255,0.5)' : 'rgba(255,255,248,0.9)', [0.35, 0.35]), moteG = n10_rg(dk ? 'rgba(200,220,255,0.9)' : 'rgba(255,255,255,1)', [0.4, 0.5]);
  var ox0 = C.vx - C.rx * 1.1, ow0 = C.rx * 2.2;
  function inOpen(x, y) { return n10_inPoly(A.open, x, y); }
  function openPt() { for (var n = 0; n < 30; n++) { var x = ox0 + Math.random() * ow0, y = C.top + Math.random() * C.oh * 0.92; if (inOpen(x, y)) return [x, y]; } return [C.vx, C.vy]; }
  // drips: a bead swells at an icicle tip, falls, and rings out on the meltwater
  var tips = A.tips.slice().sort(function () { return Math.random() - 0.5; }).slice(0, ph ? 6 : 11), drips = tips.map(function (tp) { return {tp: tp, g: Math.random(), per: 2.5 + Math.random() * 5, fall: false, y: 0, vy: 0}; }), ripples = [];
  // snow beyond the mouth, and flakes the wind blows in toward us
  var snow = []; for (i = 0; i < (ph ? 22 : 40); i++) { var p0 = openPt(); snow.push({x: p0[0], y: p0[1], r: 0.6 + Math.random() * 1.3, vy: 10 + Math.random() * 16, ph: Math.random() * 6.28}); }
  function gust(fresh) { var p = openPt(); return {p: p, z: fresh ? 1 : 1 + Math.random() * 4, k: 0.22 + Math.random() * 0.2, r: 0.5 + Math.random() * 0.7, ph: Math.random() * 6.28, dir: Math.random() < 0.5 ? -1 : 1}; }
  var gusts = []; for (i = 0; i < (ph ? 7 : 13); i++) gusts.push(gust(false));
  var motes = []; for (i = 0; i < (ph ? 12 : 22); i++) motes.push({u: Math.random(), w: Math.random(), ph: Math.random() * 6.28, s: 0.5 + Math.random()});
  var twk = [], nextTw = 0.3, fin = null, dust = [];
  var chimes = A.tips.concat(A.bigTips.map(function (b) { return {x: b.x, y: b.y, s: 2.5, big: 1}; })).map(function (tp) { return {x: tp.x, y: tp.y, s: tp.s, d: Math.hypot(tp.x - C.vx, tp.y - C.vy)}; }).sort(function (a, b) { return a.d - b.d; });
  var dropC = dk ? 'rgba(205,222,255,0.92)' : 'rgba(240,253,255,0.96)', dropE = dk ? 'rgba(20,30,80,0.55)' : 'rgba(30,110,170,0.5)', ringC = dk ? 'rgba(190,210,255,' : 'rgba(255,255,255,', twC = dk ? '#DDE8FF' : '#FFFFFF';
  var AUR = [[110, 255, 190], [140, 255, 225], [255, 130, 210]], aurGr = AUR.map(function (c) { var g = n10_ctx().createLinearGradient(0, -1, 0, 0); g.addColorStop(0, 'rgba(' + c + ',0)'); g.addColorStop(0.65, 'rgba(' + c + ',0.32)'); g.addColorStop(0.95, 'rgba(' + c + ',0.85)'); g.addColorStop(1, 'rgba(' + c + ',0)'); return g; });
  function aurora(c, t, boost) {
    c.save(); c.clip(openP); c.clip(skyP); c.globalCompositeOperation = 'lighter';
    var sw = ph ? 3 : 4;
    for (var r = 0; r < 3; r++) { var base = C.top + C.oh * (0.2 + r * 0.11), sp = 1 + r * 0.25;
      for (var x = ox0 - 10; x < ox0 + ow0 + 10; x += sw) { var yb = base + Math.sin(x * 0.016 + t * 0.33 * sp + r * 2) * C.oh * 0.07 + Math.sin(x * 0.047 - t * 0.55 + r) * C.oh * 0.022, h = C.oh * (0.16 + 0.09 * Math.sin(x * 0.028 + t * 0.5 + r * 1.3)) * (r === 2 ? 0.7 : 1), a = (0.42 + 0.3 * Math.sin(x * 0.06 + t * 1.1 + r * 2.1)) * boost * (r === 2 ? 0.6 : 1);
        if (a <= 0.01) continue; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, yb); c.scale(1, h); c.fillStyle = aurGr[r]; c.fillRect(0, -1, sw + 0.6, 1.02); c.restore(); } }
    c.restore(); }
  return {
    step: function (dt, t, f) {
      drips.forEach(function (d) { var tp = d.tp;
        if (!d.fall) { d.g += dt * f.s / d.per; if (d.g >= 1) { d.fall = true; d.y = tp.y + 2; d.vy = 0; } }
        else { d.vy += 1300 * S * dt; d.y += d.vy * dt; if (d.y >= tp.fy) { ripples.push({x: tp.x, y: tp.fy, t0: t, s: tp.s}); d.fall = false; d.g = 0; d.per = 2.5 + Math.random() * 5; } } });
      ripples = ripples.filter(function (r) { return t - r.t0 < 1.6; });
      snow.forEach(function (q) { q.y += q.vy * dt * f.s; q.x += Math.sin(t * 0.8 + q.ph) * 6 * dt; if (q.y > C.yF) { var p = openPt(); q.x = p[0]; q.y = C.top - 4; } });
      gusts.forEach(function (g, j) { g.z += g.z * g.k * dt * f.s; var x = C.vx + (g.p[0] - C.vx) * g.z, y = C.vy + (g.p[1] - C.vy) * g.z; if (g.z > 9 || x < -20 || x > W + 20 || y > H + 20 || y < -20) gusts[j] = gust(true); });
      nextTw -= dt; if (nextTw <= 0) { nextTw = 0.18 + Math.random() * 0.35; var src = Math.random() < 0.55 && chimes.length ? chimes[Math.floor(Math.random() * chimes.length)] : null, x, y;
        if (src) { x = src.x; y = src.y; } else { var rr = A.rings[1 + Math.floor(Math.random() * 5)], q = rr[Math.floor(Math.random() * rr.length)]; x = q[0]; y = q[1]; }
        if (x > -10 && x < W + 10 && y > -10 && y < H + 10) twk.push({x: x, y: y, t0: t, r: (2.5 + Math.random() * 3.5) * S * (src && src.big ? 1.6 : 1)}); }
      twk = twk.filter(function (q) { return t - q.t0 < 1.1; });
      if (fin) { var T = t - fin.t0; if (T > 10.5) { fin = null; dust = []; } else dust.forEach(function (d) { if (T > d.d) d.z = Math.exp((T - d.d) * d.k); }); }
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = fin ? t - fin.t0 : -1, boost = fin ? 1 + 2.2 * n10_env(T, 0.2, 1.2, 6, 9.5) : 1;
      // the aurora (night), then light from the mouth, glows in the walls and shafts across the floor
      if (dk) aurora(ca, tt, boost);
      ca.save(); ca.globalCompositeOperation = 'lighter';
      n10_dot(ca, bloomG, C.vx, C.vy - C.oh * 0.05, C.rx * 1.7, (dk ? 0.22 : 0.42) * (0.9 + 0.1 * Math.sin(tt * 0.5)), 0.85);
      A.glows.forEach(function (g, j) { var a = (dk ? 0.42 : 0.5) * (0.45 + 0.55 * Math.sin(tt * 0.33 + g.ph)), gx = g.x + Math.sin(tt * 0.11 + g.ph) * 8 * S;
        n10_dot(ca, glowG, gx, g.y, g.r, a, 0.75); if (dk && g.k < 3) n10_dot(ca, j % 3 ? aurG : pinkG, gx, g.y, g.r * 0.8, 0.22 * (0.5 + 0.5 * Math.sin(tt * 0.5 + j)) * boost, 0.75); });
      if (dk) A.open.forEach(function (q, j) { if (j % 8 === 0 && q[1] < C.yF - 6) n10_dot(ca, j % 16 ? aurG : pinkG, q[0], q[1], C.rx * 0.35, 0.16 * boost * (0.6 + 0.4 * Math.sin(tt * 0.7 + j)), 0.8); });
      var sha = dk ? 0.05 : 0.13;
      for (k = 0; k < 3; k++) { var cx = C.vx + (k - 1) * C.rx * 0.55, w0 = C.rx * 0.28, yt = C.yF - C.oh * 0.25, a = sha * (0.7 + 0.3 * Math.sin(tt * 0.4 + k * 2.1)), gr = ca.createLinearGradient(0, yt, 0, H);
        gr.addColorStop(0, dk ? 'rgba(150,200,255,' + a + ')' : 'rgba(255,255,240,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ca.fillStyle = gr;
        ca.beginPath(); ca.moveTo(cx - w0, yt); ca.lineTo(cx + w0, yt); ca.lineTo(C.vx + (cx - C.vx) * 3.4 + w0 * 3.2, H + 10); ca.lineTo(C.vx + (cx - C.vx) * 3.4 - w0 * 3.2, H + 10); ca.closePath(); ca.fill(); }
      motes.forEach(function (m) { var u = (m.u + tt * 0.012 * m.s) % 1, y = C.yF - C.oh * 0.2 + u * (H - C.yF) * 0.9, x = C.vx + (m.w - 0.5) * C.rx * (1.2 + u * 4) + Math.sin(tt * 0.6 + m.ph) * 6 * S; n10_dot(ca, moteG, x, y, (1 + u * 1.6) * S, (dk ? 0.35 : 0.55) * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(tt * 3 + m.ph))); });
      ca.restore();
      // the floor: shimmer on the glassy meltwater and the drip rings
      ca.save(); ca.clip(floorP); ca.lineCap = 'round';
      for (i = 0; i < (ph ? 5 : 8); i++) { var yy = C.yF + 8 + Math.pow((i + 0.5) / (ph ? 5 : 8), 1.4) * (H - C.yF) * 0.85, sc = (yy - C.vy) / C.ryL, xx = C.vx + Math.sin(tt * 0.22 + i * 1.9) * C.rx * 0.5 * sc * 0.4, ww = C.rx * sc * (0.12 + 0.06 * Math.sin(i * 2.3 + tt * 0.35));
        ca.strokeStyle = dk ? 'rgba(170,195,255,0.18)' : 'rgba(255,255,255,0.5)'; ca.lineWidth = 1.2 + sc * 0.3; ca.beginPath(); ca.moveTo(xx - ww, yy); ca.quadraticCurveTo(xx, yy - 2, xx + ww, yy); ca.stroke(); }
      if (dk) { ca.globalCompositeOperation = 'lighter'; n10_dot(ca, aurG, C.vx, C.yF + C.oh * 0.2, C.rx * 1.1, 0.16 * boost * (0.7 + 0.3 * Math.sin(tt * 0.6)), 0.35); ca.globalCompositeOperation = 'source-over'; }
      ripples.forEach(function (r) { var q = (t - r.t0) / 1.6; for (var j = 0; j < 2; j++) { var qq = q - j * 0.2; if (qq <= 0) continue; ca.strokeStyle = ringC + (0.7 * (1 - qq)) + ')'; ca.lineWidth = 1.1; ca.beginPath(); ca.ellipse(r.x, r.y, (2 + qq * 16) * r.s * S, (2 + qq * 16) * r.s * S * 0.3, 0, 0, 7); ca.stroke(); }
        if (q < 0.35) { ca.fillStyle = ringC + (0.8 * (1 - q / 0.35)) + ')'; for (var s2 = -1; s2 <= 1; s2++) { ca.beginPath(); ca.arc(r.x + s2 * q * 18 * S * r.s * 0.4, r.y - Math.sin(Math.PI * q / 0.35) * 8 * S * r.s * 0.5, 1 * r.s * 0.6, 0, 7); ca.fill(); } } });
      // day prism on the floor during the moment
      if (fin && !dk) { var pa = n10_env(T, 1.5, 2.6, 6, 8.5) * 0.24; if (pa > 0) { ca.globalCompositeOperation = 'lighter'; ca.globalAlpha = pa; ca.lineWidth = 6 * S; var R0 = (H - C.yF) * 1.05, pcy = C.yF + R0 * 0.98;
        ['#FF5A5A', '#FFA040', '#FFE050', '#70E070', '#50B0FF', '#9A70FF'].forEach(function (col, j) { ca.strokeStyle = col; ca.beginPath(); ca.ellipse(C.vx, pcy, (R0 - j * 6 * S) * 1.3, R0 - j * 6 * S, 0, Math.PI * 1.32, Math.PI * 1.68); ca.stroke(); }); ca.globalAlpha = 1; ca.globalCompositeOperation = 'source-over'; } }
      ca.restore();
      // snow beyond the mouth
      ca.save(); ca.clip(openP); ca.fillStyle = dk ? 'rgba(225,232,255,0.85)' : 'rgba(255,255,255,0.95)';
      snow.forEach(function (q) { ca.beginPath(); ca.arc(q.x, q.y, q.r, 0, 7); ca.fill(); }); ca.restore();
      // drips on the icicles
      drips.forEach(function (d) { var tp = d.tp, s = tp.s * S;
        ca.fillStyle = dropC; ca.strokeStyle = dropE; ca.lineWidth = 0.8;
        if (!d.fall) { var r = (0.6 + 1.6 * d.g) * Math.min(2.2, s); n10_drop(ca, tp.x, tp.y + r * 0.9, r, 1.6); ca.stroke(); }
        else { var r2 = 1.6 * Math.min(2.2, s), st = 1.6 + Math.min(2, d.vy / 300); n10_drop(ca, tp.x, d.y, r2, st); ca.stroke(); } });
      // the finish: a wave of light through each band of ice
      if (fin) {
        ca.save(); ca.globalCompositeOperation = 'lighter';
        n10_dot(ca, bloomG, C.vx, C.vy, C.rx * 2.8, 0.55 * n10_env(T, 0, 0.5, 2.2, 4.8), 0.85);
        n10_dot(ca, dk ? aurG : glowG, C.vx, C.yF + (H - C.yF) * 0.35, C.rx * 2.4, 0.5 * n10_env(T, 0.5, 1.5, 4, 7), 0.4);
        ca.clip(wallP, 'evenodd');
        var after = n10_env(T, 1.2, 2.6, 5, 8.5) * 0.07;
        bands.forEach(function (b, j) { var w = n10_env(T, 0.2 + j * 0.24, 0.42 + j * 0.24, 0.55 + j * 0.24, 1.15 + j * 0.24) * (dk ? 0.2 : 0.24) + after; if (w <= 0.005) return;
          ca.globalAlpha = Math.min(1, w); ca.fillStyle = dk ? (j % 2 ? 'rgb(220,120,210)' : 'rgb(90,230,190)') : 'rgb(160,240,255)'; ca.fill(b, 'evenodd'); });
        ca.restore();
      }
      // in front: glints on the ice, flakes blown in, and the moment's chimes and diamond dust
      cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      twk.forEach(function (q) { var k2 = (t - q.t0) / 1.1, a = Math.sin(Math.PI * k2); n10_star(cb, q.x, q.y, q.r * (0.5 + a * 0.7), a * 0.95, twC); });
      cb.restore();
      cb.fillStyle = dk ? 'rgba(230,236,255,0.9)' : 'rgba(255,255,255,0.95)';
      gusts.forEach(function (g) { var x = C.vx + (g.p[0] - C.vx) * g.z + Math.sin(tt * 1.3 + g.ph) * 4 * g.z * S, y = C.vy + (g.p[1] - C.vy) * g.z + g.z * g.z * 0.6 * S, a = Math.min(1, (g.z - 1) * 1.5) * (g.z > 6 ? Math.max(0, 1 - (g.z - 6) / 3) : 1);
        cb.globalAlpha = a; cb.beginPath(); cb.arc(x, y, g.r * g.z * S, 0, 7); cb.fill(); });
      cb.globalAlpha = 1;
      if (fin) {
        cb.save(); if (dk) cb.globalCompositeOperation = 'lighter';
        chimes.forEach(function (q, j) { var d = 1 + Math.min(3, j * 0.055), a = n10_env(T, d, d + 0.12, d + 0.3, d + 1); if (a <= 0) return; var r = (q.big ? 11 : 5 + 2 * q.s) * S;
          n10_dot(cb, moteG, q.x, q.y, r * 1.6, a * 0.5); n10_star(cb, q.x, q.y, r * (0.6 + a * 0.6), a, twC); });
        dust.forEach(function (d) { if (T < d.d) return; var rot = (d.z - 1) * 0.22 * d.dir, dx = (d.p[0] - C.vx) * d.z, dy = (d.p[1] - C.vy) * d.z, x = C.vx + dx * Math.cos(rot) - dy * Math.sin(rot), y = C.vy + dx * Math.sin(rot) + dy * Math.cos(rot);
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return; var a = Math.min(1, (T - d.d) * 2) * (1 - n10_ease((T - 7) / 3)) * (0.55 + 0.45 * Math.sin(tt * 6 + d.ph));
          n10_star(cb, x, y, d.r * Math.min(6, d.z) * S, a, d.c); });
        cb.restore();
      }
    },
    finish: function (t) { fin = {t0: t}; dust = [];
      var cols = dk ? ['#B8FFE6', '#FFFFFF', '#FFC8F0', '#A8D8FF'] : ['#FFFFFF', '#E8FCFF', '#BDF2FF', '#FFF6D8'];
      for (var j = 0; j < (ph ? 60 : 110); j++) dust.push({p: openPt(), z: 1, d: 0.6 + Math.random() * 2.6, k: 0.28 + Math.random() * 0.22, r: 0.9 + Math.random() * 1.3, dir: Math.random() < 0.5 ? -1 : 1, ph: Math.random() * 6.28, c: cols[j % cols.length]}); }
  };
};
UIC.icecave = {L: ['#2A7FB8', '#184A84', 'rgba(255,255,255,0.84)', '#10283C', '#4A6678', '#1E74AE', '#1E74AE', '#2A9CC4', '#FFFFFF'], D: ['#1E2A60', '#0E1436', 'rgba(16,22,58,0.78)', '#EAF2FF', '#A8B6DA', '#7FE8D8', '#7FE8D8', '#A8C8FF', '#0E1830']};
