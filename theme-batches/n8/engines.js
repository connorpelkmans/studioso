// ---- batch n8 engines: waterfall, redwoods
function n8_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n8_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n8_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n8_ease((T - c) / (d - c)); }
var n8_gc = null;
function n8_ctx() { return n8_gc || (n8_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n8_dot
function n8_rg(col, mid) { var g = n8_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n8_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n8_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
// a four-point glint
function n8_glint(c, x, y, r, a, col) { if (a <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }
function n8_drop(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r * 2.2); c.quadraticCurveTo(x + r * 1.1, y - r * 0.4, x + r, y + r * 0.1); c.arc(x, y, r, 0, Math.PI); c.quadraticCurveTo(x - r * 1.1, y - r * 0.4, x, y - r * 2.2); c.fill(); }
var n8_RAINBOW = ['#FF6A6A', '#FFA94A', '#FFE05A', '#7EDB6A', '#5AB8F2', '#9A7BF0'];
function n8_arc(c, cx, cy, R, bw, a0, a1, alpha, rev) { c.save(); c.globalAlpha = alpha; c.lineWidth = bw; c.lineCap = 'butt'; (rev ? n8_RAINBOW.slice().reverse() : n8_RAINBOW).forEach(function (col, j) { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, R - j * bw, a0, a1); c.stroke(); }); c.restore(); }

// ---------- Fern Falls: water pours down the three tiers in moving streaks, foam churns where each tier lands, spray mist rises from the
// plunge pool and drifts, rings spread across the water, a small rainbow hangs in the spray by day, moss drips, wet rocks glint and a
// leaf now and then spins down and floats away. Night: moonlight on the falling water and glow-worm lights speckling the gorge walls.
// Moment: a surge of bright water races down the falls tier by tier; where it lands the pool blooms with rings and a double rainbow
// (a silver moonbow at night) arches across the gorge, while the glow-worm lights brighten in a wave up the walls.
ENGINES.waterfall = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, P = A.pool, fx = A.fx, i;
  var foamG = n8_rg(dk ? 'rgba(210,228,248,0.85)' : 'rgba(255,255,255,0.95)', [0.5, 0.6]), mistG = n8_rg(dk ? 'rgba(160,196,232,0.26)' : 'rgba(255,255,255,0.75)', [0.5, 0.45]),
    glowG = n8_rg('rgba(110,255,225,0.7)', [0.25, 0.3]), moonG = n8_rg('rgba(200,220,255,0.5)', [0.4, 0.3]), sunG = n8_rg('rgba(255,250,215,0.6)', [0.4, 0.3]);
  // each tier: a clip path of its strands, and per strand its centre line and half width so streaks can follow it
  var tiers = A.tiers.map(function (T, ti) { var path = new Path2D(), lines = [];
    T.strands.forEach(function (sp) { var n = sp.length / 2, c = []; path.moveTo(sp[0][0], sp[0][1]); for (var q = 1; q < sp.length; q++) path.lineTo(sp[q][0], sp[q][1]); path.closePath();
      for (q = 0; q < n; q++) { var a = sp[q], b = sp[sp.length - 1 - q]; c.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2]); } lines.push(c); });
    path.rect(fx - T.wT / 2 - 2, T.yT - 6, T.wT + 4, (T.yB - T.yT) * 0.16 + 6);
    var streaks = []; lines.forEach(function (c, li) { for (var k = 0; k < (ph ? 3 : 4); k++) streaks.push({l: li, u: hash(ti * 31 + li * 7 + k), sp: 0.38 + hash(ti * 13 + li * 3 + k * 5) * 0.25, dark: k % 2, off: (hash(li * 9 + k) - 0.5) * 0.9}); });
    return {T: T, path: path, lines: lines, streaks: streaks}; });
  function along(c, u) { var f = Math.max(0, Math.min(0.999, u)) * (c.length - 1), j = Math.floor(f), r = f - j, a = c[j], b = c[j + 1]; return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r, a[2] + (b[2] - a[2]) * r]; }
  var mist = [], rings = [], leaves = [], glints = [], lastMist = 0, lastRing = 0, nextLeaf = 3, lastGlint = 0, surge = null, sparks = [];
  var drips = A.hang.map(function (p, j) { return {x: p[0], y: p[1], g: hash(j + 3), rate: 0.16 + hash(j + 9) * 0.18}; }), falling = [];
  var glow = A.glow.map(function (p, j) { var pts = []; for (var k = 0; k < 4; k++) pts.push([(hash(j * 5 + k) - 0.5) * 16 * S, (hash(j * 7 + k + 2) - 0.3) * 10 * S, hash(j + k * 11) * 6.28]); return {x: p[0], y: p[1], pts: pts}; });
  var impact = P.cy - P.ry * 0.3, wB = A.tiers[2].wB;
  function inPool(x, y, k) { var dx = (x - P.cx) / (P.rx * k), dy = (y - P.cy) / (P.ry * k); return dx * dx + dy * dy < 1; }
  return {
    step: function (dt, t, f) {
      var sg = surge ? t - surge.t0 : -1;
      if (t - lastMist > (sg > 2.2 && sg < 5 ? 0.06 : 0.16)) { lastMist = t; var big = sg > 2.2 && sg < 5; mist.push({x: fx + (Math.random() - 0.5) * wB * (big ? 1.4 : 0.9), y: impact, vx: (Math.random() - 0.5) * 14 * S, vy: -(14 + Math.random() * 16) * S * (big ? 1.8 : 1), r0: (12 + Math.random() * 10) * S, age: 0, life: 4 + Math.random() * 2.5});
        if (Math.random() < 0.45) { var tl = A.tiers[Math.random() < 0.5 ? 0 : 1]; mist.push({x: fx + (Math.random() - 0.5) * tl.wB, y: tl.yB, vx: (Math.random() - 0.5) * 10 * S, vy: -(6 + Math.random() * 8) * S, r0: (6 + Math.random() * 6) * S, age: 0, life: 2.5 + Math.random() * 1.5, small: 1}); } }
      mist.forEach(function (m) { m.age += dt * f.s; m.x += m.vx * dt; m.y += m.vy * dt; m.vy *= 0.995; }); mist = mist.filter(function (m) { return m.age < m.life; });
      if (t - lastRing > 0.55) { lastRing = t; rings.push({x: fx + (Math.random() - 0.5) * wB * 0.4, t0: t, d: 3.4}); }
      rings = rings.filter(function (r) { return t - r.t0 < r.d; });
      // a leaf now and then
      if (t > nextLeaf) { nextLeaf = t + 6 + Math.random() * 6; var lx = P.cx + (Math.random() < 0.5 ? -1 : 1) * P.rx * (0.35 + Math.random() * 0.45); leaves.push({x0: lx, x: lx, y: -20, ph: Math.random() * 6.28, rot: 0, land: P.cy + (Math.random() - 0.4) * P.ry * 0.6, t0: t, float: 0, col: Math.random() < 0.5 ? (dk ? '#B88A3A' : '#E0A83A') : (dk ? '#5A9A4A' : '#8CC860')}); }
      leaves.forEach(function (l) { if (!l.float) { l.y += 38 * S * dt * f.s; l.x = l.x0 + Math.sin((t - l.t0) * 1.6 + l.ph) * 26 * S; l.rot = Math.sin((t - l.t0) * 1.6 + l.ph) * 0.9; if (l.y >= l.land) { l.float = t; l.y = l.land; rings.push({x: l.x, y: l.y, t0: t, d: 1.6, small: 1}); } }
        else { var dir = l.x > fx ? 1 : -1; l.x += dir * 7 * S * dt; l.rot += dir * 0.1 * dt; } });
      leaves = leaves.filter(function (l) { return !l.float || (t - l.float < 9 && inPool(l.x, l.y, 0.98)); });
      drips.forEach(function (d) { d.g += dt * d.rate * f.s; if (d.g >= 1) { d.g = 0; falling.push({x: d.x, y: d.y, vy: 0, y0: d.y}); } });
      falling.forEach(function (q) { q.vy += 900 * dt; q.y += q.vy * dt; }); falling = falling.filter(function (q) { return q.y < H + 10 && q.y - q.y0 < H * 0.6; });
      if (t - lastGlint > 0.35 && A.glints.length) { lastGlint = t; var g = A.glints[Math.floor(Math.random() * A.glints.length)]; glints.push({x: g[0], y: g[1], t0: t}); } glints = glints.filter(function (g) { return t - g.t0 < 0.9; });
      // the moment
      if (surge) { if (sg > 2.3 && !surge.hit) { surge.hit = 1; for (i = 0; i < 4; i++) rings.push({x: fx, t0: t + i * 0.25, d: 4, big: 1}); for (i = 0; i < (ph ? 26 : 44); i++) { var an = -Math.PI * (0.1 + Math.random() * 0.8); sparks.push({x: fx + (Math.random() - 0.5) * wB * 0.6, y: impact, vx: Math.cos(an) * (60 + Math.random() * 120) * S, vy: Math.sin(an) * (120 + Math.random() * 160) * S, t0: t, life: 1.2 + Math.random() * 0.8}); } }
        if (sg > 12) surge = null; }
      sparks.forEach(function (p) { p.vy += 300 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); sparks = sparks.filter(function (p) { return t - p.t0 < p.life; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, sg = surge ? t - surge.t0 : -1, wave = sg >= 0 && sg < 3 ? A.lip + (P.cy - A.lip) * (sg / 2.4) : -1e9, i;
      // glow-worm lights on the walls (night), brighter where the moment's wave has passed
      if (dk) { ca.save(); ca.globalCompositeOperation = 'lighter';
        glow.forEach(function (g, j) { var up = sg > 2.3 ? n8_env(sg - 2.3 - (P.cy - g.y) / H * 2.2, 0, 0.4, 2.5, 4.5) : 0; g.pts.forEach(function (q, k) { var tw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(tt * (0.6 + k * 0.17) + q[2]), 2), x = g.x + q[0], y = g.y + q[1];
          n8_dot(ca, glowG, x, y, (5 + up * 5) * S + 2, (0.5 * tw + up * 0.6)); ca.fillStyle = 'rgba(200,255,245,' + Math.min(1, 0.7 * tw + up) + ')'; ca.beginPath(); ca.arc(x, y, 0.9 + up * 0.6, 0, 7); ca.fill(); }); }); ca.restore(); }
      // moving streaks down each tier
      tiers.forEach(function (Ti, ti) { var T = Ti.T; ca.save(); ca.clip(Ti.path); ca.lineCap = 'round';
        Ti.streaks.forEach(function (s) { var c = Ti.lines[s.l], u = (s.u + tt * s.sp * (1 + ti * 0.15)) % 1, L = 0.12 + 0.1 * u, a = along(c, u), b = along(c, u + L), x0 = a[0] + s.off * a[2] * 0.7, x1 = b[0] + s.off * b[2] * 0.7, fade = Math.sin(Math.PI * Math.min(1, u * 1.05));
          var lit = wave > -1e8 && Math.abs((a[1] + b[1]) / 2 - wave) < H * 0.08 ? 1 : 0;
          if (s.dark && !lit) { ca.strokeStyle = dk ? 'rgba(110,140,175,' + 0.5 * fade + ')' : 'rgba(130,185,200,' + 0.5 * fade + ')'; ca.lineWidth = Math.max(1, a[2] * 0.22); }
          else { ca.strokeStyle = dk ? 'rgba(235,245,255,' + (0.7 * fade + lit * 0.3) + ')' : 'rgba(255,255,255,' + (0.9 * fade) + ')'; ca.lineWidth = Math.max(1.2, a[2] * (0.3 + lit * 0.4)); }
          ca.beginPath(); ca.moveTo(x0, a[1]); ca.lineTo(x1, b[1]); ca.stroke(); });
        // the moment: a bright band racing down
        if (wave > -1e8 && wave > T.yT - H * 0.1 && wave < T.yB + H * 0.1) { var gr = ca.createLinearGradient(0, wave - H * 0.08, 0, wave + H * 0.05); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, dk ? 'rgba(220,240,255,0.75)' : 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ca.fillStyle = gr; ca.fillRect(fx - T.wB, wave - H * 0.08, T.wB * 2, H * 0.13); }
        ca.restore();
        // foam churning where the tier lands (swelling when the surge arrives)
        var hitK = sg > 0 ? n8_env(sg - (T.yB - A.lip) / (P.cy - A.lip) * 2.4, 0, 0.2, 0.8, 1.8) : 0, fy = ti < 2 ? T.yB + A.ld * 0.15 : impact;
        for (var k = 0; k < 6; k++) { var fxp = fx + (k - 2.5) * T.wB * 0.18 + Math.sin(tt * 2.1 + k * 1.7 + ti) * 3 * S, r = T.wB * (0.13 + 0.03 * Math.sin(tt * 3 + k)) * (1 + hitK * 0.6); n8_dot(ca, foamG, fxp, fy - r * 0.2 - hitK * 4 * S, r, 0.75, 0.5); } });
      // rings across the pool
      ca.save(); n8_ell(ca, P.cx, P.cy, P.rx * 1.08, P.ry * 1.3); ca.clip(); ca.lineWidth = 1.4;
      rings.forEach(function (r) { var k = (t - r.t0) / r.d; if (k < 0) return; var R = r.small ? 4 * S + k * 30 * S : wB * 0.45 + k * P.rx * (r.big ? 1.1 : 0.85), a = (1 - k) * (r.big ? 0.8 : 0.5); ca.strokeStyle = dk ? 'rgba(180,210,240,' + a + ')' : 'rgba(255,255,255,' + a + ')'; n8_ell(ca, r.x, r.y || impact + P.ry * 0.15, R, R * P.ry / P.rx * 1.1); ca.stroke(); });
      // shimmer, and moonlight on the water at night
      for (i = 0; i < (ph ? 6 : 10); i++) { var yy = P.cy - P.ry * 0.1 + (i % 3) * P.ry * 0.3, xx = P.cx + ((i * 0.37 + tt * 0.02) % 1 - 0.5) * P.rx * 1.8, ww = 10 * S + 6 * Math.sin(tt + i); if (Math.abs(xx - fx) < wB * 0.6) continue; ca.strokeStyle = dk ? 'rgba(170,200,240,0.28)' : 'rgba(255,255,255,0.55)'; ca.beginPath(); ca.moveTo(xx - ww, yy); ca.quadraticCurveTo(xx, yy - 2.5, xx + ww, yy); ca.stroke(); }
      if (dk) { ca.globalCompositeOperation = 'lighter'; for (i = 0; i < 6; i++) { var my = P.cy - P.ry * 0.5 + i * P.ry * 0.28, mxp = P.cx - P.rx * 0.45 + Math.sin(tt * 0.8 + i * 1.3) * 6; n8_dot(ca, moonG, mxp, my, P.rx * (0.1 - i * 0.008), 0.55, 0.22); } ca.globalCompositeOperation = 'source-over'; }
      ca.restore();
      // floating leaves (on the water, under the foreground stones)
      leaves.forEach(function (l) { if (!l.float) return; var a = 1 - n8_ease((t - l.float - 7) / 2); ca.save(); ca.globalAlpha = a; ca.translate(l.x, l.y + Math.sin(tt * 2 + l.ph) * 1.2 * S); ca.rotate(l.rot); ca.fillStyle = l.col; n8_ell(ca, 0, 0, 7 * S + 2, 3 * S + 1); ca.fill(); ca.strokeStyle = 'rgba(0,0,0,0.2)'; ca.lineWidth = 0.8; ca.beginPath(); ca.moveTo(-6 * S, 0); ca.lineTo(6 * S, 0); ca.stroke(); ca.restore(); });
      // the little rainbow in the spray (day), and the moment's double rainbow / moonbow
      var bowK = sg > 0 ? n8_env(sg, 2.2, 3.6, 8.5, 11) : 0;
      ca.save(); ca.beginPath(); ca.rect(-20, -20, W + 40, impact + P.ry * 0.1 + 20); ca.clip();
      if (!dk) { var rbA = 0.18 + 0.07 * Math.sin(tt * 0.7); n8_arc(ca, fx, P.cy, wB * 1.05, (ph ? 3 : 4.5) * S + 1, Math.PI * 1.62, Math.PI * 1.96, rbA * (1 - bowK)); }
      if (bowK > 0) { var R0 = ph ? W * 0.44 : W * 0.3, bw = (ph ? 5 : 8) * S + 2, grow = n8_ease((sg - 2.2) / 1.6);
        if (dk) { ca.save(); ca.globalAlpha = bowK * 0.4; ca.lineWidth = bw * 4; ca.strokeStyle = 'rgba(225,235,255,0.9)'; ca.beginPath(); ca.arc(fx, P.cy, R0, Math.PI, Math.PI + Math.PI * grow); ca.stroke(); ca.restore(); n8_arc(ca, fx, P.cy, R0 + bw * 0.5, bw * 0.7, Math.PI, Math.PI + Math.PI * grow, bowK * 0.16); }
        else { n8_arc(ca, fx, P.cy, R0, bw, Math.PI, Math.PI + Math.PI * grow, bowK * 0.5); n8_arc(ca, fx, P.cy, R0 * 1.22, bw * 0.8, Math.PI, Math.PI + Math.PI * grow, bowK * 0.2, true); } }
      ca.restore();
      // spray mist rising off the pool and the ledges
      mist.forEach(function (m) { var k = m.age / m.life, r = m.r0 * (1 + k * (m.small ? 1.6 : 2.6)); n8_dot(ca, mistG, m.x, m.y, r, Math.sin(Math.PI * k) * (m.small ? 0.5 : 0.7), 0.75); });
      // in front: a faint veil of mist low over the pool, drips from the hanging moss, glints on wet stone, falling leaves, sparkles
      for (i = 0; i < (ph ? 3 : 5); i++) { var vx = P.cx - P.rx * 0.8 + ((i / (ph ? 3 : 5)) + tt * 0.008) % 1 * P.rx * 1.6, ve = Math.sin(Math.PI * (vx - P.cx + P.rx * 0.8) / (P.rx * 1.6)); n8_dot(cb, mistG, vx, P.cy - P.ry * 0.7 + Math.sin(i * 2.3 + tt * 0.3) * 4, P.rx * 0.32, (0.28 + bowK * 0.2) * ve, 0.2); }
      cb.fillStyle = dk ? 'rgba(180,215,240,0.85)' : 'rgba(225,246,255,0.95)';
      drips.forEach(function (d) { var r = (0.5 + d.g * 2.2) * S + 0.4; n8_drop(cb, d.x, d.y + r, r); }); falling.forEach(function (q) { n8_drop(cb, q.x, q.y, 2.2 * S + 0.5); });
      glints.forEach(function (g) { var k = (t - g.t0) / 0.9; n8_glint(cb, g[0] || g.x, g.y, (5 + 4 * Math.sin(Math.PI * k)) * S, Math.sin(Math.PI * k), dk ? '#DCEBFF' : '#FFFFFF'); });
      leaves.forEach(function (l) { if (l.float) return; cb.save(); cb.translate(l.x, l.y); cb.rotate(l.rot); cb.fillStyle = l.col; n8_ell(cb, 0, 0, 7 * S + 2, 3 * S + 1); cb.fill(); cb.restore(); });
      if (sparks.length) { cb.save(); cb.globalCompositeOperation = 'lighter'; sparks.forEach(function (p) { var k = (t - p.t0) / p.life; n8_glint(cb, p.x, p.y, (4 + 3 * (1 - k)) * S, 1 - k, dk ? '#CFF4FF' : '#FFFFFF'); }); cb.restore(); }
      if (sg > 0 && !dk) { var ks = n8_env(sg, 2, 3.4, 7, 10); if (ks > 0) { cb.save(); cb.globalCompositeOperation = 'lighter'; n8_dot(cb, sunG, A.moon[0], A.moon[1], (ph ? 80 : 140) * ks, 0.7 * ks); cb.restore(); } }
    },
    finish: function (t) { surge = {t0: t}; }
  };
};

// ---------- Redwood Grove: god rays slant through the fog and slowly breathe, fog banks drift between the trunks, dust motes glitter
// where the light falls, little redwood sprays and sorrel leaves twirl down. Night: blue fog, pale moonbeams and a few tiny lights.
// Moment: the fog parts and a broad warm sunbeam (a silver moonbeam at night) sweeps across the grove, lighting each trunk as it
// passes, and behind it the redwood sorrel opens its little pink-white flowers one after another along the forest floor.
ENGINES.redwoods = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, i, src = A.src, slope = 0.5;
  var fogG = n8_rg(dk ? 'rgba(110,150,210,0.3)' : 'rgba(255,253,244,0.6)', [0.35, 0.6]), moteG = n8_rg(dk ? 'rgba(210,230,255,0.8)' : 'rgba(255,240,190,0.85)', [0.3, 0.3]), flyG = n8_rg('rgba(220,255,170,0.75)', [0.25, 0.3]), warmG = n8_rg(dk ? 'rgba(190,215,255,0.5)' : 'rgba(255,214,140,0.55)', [0.4, 0.3]);
  var rays = (ph ? [0.0, 0.16, 0.34, 0.52] : [-0.04, 0.1, 0.24, 0.38, 0.52]).map(function (u, j) { return {x: src[0] + W * u - W * 0.08, w: W * (0.035 + hash(j + 4) * 0.04), ph: hash(j + 1) * 6.28, sp: 0.12 + hash(j + 8) * 0.1}; });
  var trunks = A.trunks.map(function (p) { var pa = new Path2D(); p.forEach(function (q, j) { if (j) pa.lineTo(q[0], q[1]); else pa.moveTo(q[0], q[1]); }); pa.closePath(); var xs = p.map(function (q) { return q[0]; }); return {p: pa, x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2}; });
  var big = A.big.map(function (p) { var pa = new Path2D(); p.forEach(function (q, j) { if (j) pa.lineTo(q[0], q[1]); else pa.moveTo(q[0], q[1]); }); pa.closePath(); var xs = p.map(function (q) { return q[0]; }); return {p: pa, x: Math.max(0, Math.min(W, (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2))}; });
  var motes = []; for (i = 0; i < (ph ? 30 : 60); i++) motes.push({x: hash(i + 2) * W, y: hash(i + 7) * H * 0.85, ph: hash(i + 11) * 6.28, r: 0.8 + hash(i + 13) * 1.6});
  var bugs = []; if (dk) for (i = 0; i < (ph ? 5 : 9); i++) bugs.push({x0: W * (0.1 + hash(i + 30) * 0.8), y0: A.gy + (hash(i + 40) - 0.3) * H * 0.2, ph: hash(i + 50) * 6.28});
  var fall = [], nextFall = 1, sweep = null;
  var flowers = A.flowers.filter(function (p, j) { return j % (ph ? 2 : 3) === 0; }).map(function (p, j) { return {x: p[0], y: p[1], d: hash(j + 21) * 0.4, s: 0.8 + hash(j + 5) * 0.5}; });
  function rayA(r, tt) { return 0.55 + 0.45 * Math.sin(tt * r.sp + r.ph); }
  function drawSpray(c, x, y, s, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-9 * s, 0); c.lineTo(9 * s, 0); c.stroke(); for (var k = -3; k <= 3; k++) { n8_ell(c, k * 2.4 * s, -2 * s, 0.9 * s, 2.2 * s, 0.3); c.fill(); n8_ell(c, k * 2.4 * s, 2 * s, 0.9 * s, 2.2 * s, -0.3); c.fill(); } c.restore(); }
  function drawFlower(c, x, y, s, k) { if (k <= 0) return; var sc = s * (k < 1 ? n8_ease(k) * (1 + 0.25 * Math.sin(Math.PI * k)) : 1); c.save(); c.translate(x, y); c.scale(sc, sc);
    c.strokeStyle = dk ? '#4E8A6A' : '#5A9A48'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, 9); c.stroke();
    for (var p = 0; p < 5; p++) { c.save(); c.rotate(p / 5 * 6.283); c.fillStyle = dk ? '#F2E4F0' : '#FFF4F8'; n8_ell(c, 0, -3.4, 2.2, 3.4); c.fill(); c.strokeStyle = dk ? 'rgba(220,150,200,0.7)' : 'rgba(230,120,160,0.7)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, -1.4); c.lineTo(0, -5); c.stroke(); c.restore(); }
    c.fillStyle = '#FFD45A'; c.beginPath(); c.arc(0, 0, 1.4, 0, 7); c.fill(); c.restore(); }
  return {
    step: function (dt, t, f) {
      if (t > nextFall) { nextFall = t + 1.2 + Math.random() * 2.2; fall.push({x: W * (0.05 + Math.random() * 0.9), y: -20, vy: (16 + Math.random() * 14) * S, ph: Math.random() * 6.28, s: (0.9 + Math.random() * 0.5) * S + 0.3, kind: Math.random() < 0.6 ? 0 : 1, t0: t}); }
      fall.forEach(function (q) { q.y += q.vy * dt * f.s; }); fall = fall.filter(function (q) { return q.y < H + 20; });
      if (sweep && t - sweep.t0 > 13) sweep = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, sg = sweep ? t - sweep.t0 : -1, part = sg > 0 ? n8_env(sg, 0, 1, 6, 9) : 0, bx = sg > 0 ? -W * 0.15 + (W * 1.3) * Math.max(0, Math.min(1, (sg - 0.6) / 5.4)) : -1e9, bk = sg > 0 ? n8_env(sg, 0.3, 1.1, 6, 7.6) : 0, i;
      // fog banks drifting between the trunks (thinner while the moment parts them)
      [[0.5, 1, 0.09], [0.62, -1, 0.07], [0.76, 1, 0.06]].forEach(function (b, k) { for (var j = 0; j < (ph ? 3 : 5); j++) { var x = ((j / (ph ? 3 : 5)) * (W + 500) + tt * 6 * b[1] * (1 + k * 0.4) + k * 170) % (W + 500); if (x < 0) x += W + 500; n8_dot(ca, fogG, x - 250, H * b[0] + Math.sin(tt * 0.2 + j * 2 + k) * 10, ph ? W * 0.7 : 300 * S, (dk ? 0.42 : 0.4) * (1 - part * 0.6), ph ? b[2] * 2.2 : b[2] * 3.4); } });
      // god rays / moonbeams (under the giant foreground trunks)
      ca.save(); ca.globalCompositeOperation = 'lighter';
      rays.forEach(function (r) { var a = rayA(r, tt) * (1 - part * 0.5), x = r.x + Math.sin(tt * 0.05 + r.ph) * 14, g = ca.createLinearGradient(x, 0, x + H * slope, H); g.addColorStop(0, dk ? 'rgba(150,190,255,' + 0.14 * a + ')' : 'rgba(255,236,180,' + 0.3 * a + ')'); g.addColorStop(0.75, dk ? 'rgba(150,190,255,' + 0.05 * a + ')' : 'rgba(255,236,180,' + 0.1 * a + ')'); g.addColorStop(1, 'rgba(255,236,180,0)');
        ca.fillStyle = g; ca.beginPath(); ca.moveTo(x, -10); ca.lineTo(x + r.w, -10); ca.lineTo(x + r.w * 1.6 + H * slope, H + 10); ca.lineTo(x - r.w * 0.2 + H * slope, H + 10); ca.fill(); });
      // the moment's sweeping beam and the trunks it lights
      var bw = W * (ph ? 0.3 : 0.16);
      function beam(c, al) { [[1, 0.5], [0.45, 1]].forEach(function (L) { var w = bw * L[0], g2 = c.createLinearGradient(bx - w, 0, bx + w, 0); g2.addColorStop(0, 'rgba(255,220,150,0)'); g2.addColorStop(0.5, dk ? 'rgba(190,215,255,' + 0.26 * al * L[1] + ')' : 'rgba(255,214,128,' + 0.5 * al * L[1] + ')'); g2.addColorStop(1, 'rgba(255,220,150,0)');
        c.fillStyle = g2; c.beginPath(); c.moveTo(bx - w - H * slope * 0.5, -10); c.lineTo(bx + w - H * slope * 0.5, -10); c.lineTo(bx + w + H * slope * 0.5, H + 10); c.lineTo(bx - w + H * slope * 0.5, H + 10); c.fill(); }); }
      if (bk > 0) { beam(ca, bk); n8_dot(ca, warmG, bx + (A.gy - H / 2) * slope, A.gy + H * 0.06, W * 0.2, bk * 0.9, 0.25);
        trunks.forEach(function (tr) { var k = Math.max(0, 1 - Math.abs(tr.x - bx) / (bw * 1.2)) * bk; if (k <= 0) return; ca.fillStyle = dk ? 'rgba(150,180,240,' + 0.35 * k + ')' : 'rgba(255,160,80,' + 0.55 * k + ')'; ca.fill(tr.p); }); }
      ca.restore();
      // dust motes glittering in the light (brightest inside a ray)
      cb.save(); cb.globalCompositeOperation = 'lighter';
      motes.forEach(function (m, j) { var x = (m.x + Math.sin(tt * 0.15 + m.ph) * 30 + tt * 3) % W, y = m.y + Math.sin(tt * 0.22 + m.ph * 2) * 20 - (tt * 2 % 40), inRay = 0;
        rays.forEach(function (r) { var rx = r.x + (y + 10) * slope, d = x - rx; if (d > -r.w * 0.3 && d < r.w * 1.4) inRay = Math.max(inRay, rayA(r, tt)); });
        if (bk > 0) inRay = Math.max(inRay, Math.max(0, 1 - Math.abs(x - (bx + (y - H / 2) * slope)) / (W * 0.15)) * bk * 1.5);
        var a = (0.15 + 0.85 * inRay) * (0.5 + 0.5 * Math.sin(tt * 1.3 + m.ph * 3)); n8_dot(cb, moteG, x, y, m.r * 3 * S + 1.5, a * (dk ? 0.6 : 0.8)); });
      if (dk) bugs.forEach(function (q) { var x = q.x0 + Math.sin(tt * 0.25 + q.ph) * 50, y = q.y0 + Math.sin(tt * 0.4 + q.ph * 3) * 24, al = 0.2 + 0.8 * Math.pow(Math.max(0, Math.sin(tt * 0.9 + q.ph * 1.7)), 2); n8_dot(cb, flyG, x, y, 11, al); cb.fillStyle = 'rgba(240,255,200,' + al + ')'; cb.beginPath(); cb.arc(x, y, 1.5, 0, 7); cb.fill(); });
      // the beam warming the giant foreground trunks
      if (bk > 0) beam(cb, bk * 0.35);
      if (bk > 0) big.forEach(function (tr) { var k = Math.max(0, 1 - Math.abs(tr.x - bx) / (W * 0.22)) * bk; if (k <= 0) return; cb.fillStyle = dk ? 'rgba(150,180,240,' + 0.18 * k + ')' : 'rgba(255,170,90,' + 0.22 * k + ')'; cb.fill(tr.p); });
      cb.restore();
      // twirling sprays and sorrel leaves
      fall.forEach(function (q) { var x = q.x + Math.sin((t - q.t0) * 1.4 + q.ph) * 26 * S, rot = Math.sin((t - q.t0) * 1.4 + q.ph) * 1.1 + q.ph;
        if (q.kind) drawSpray(cb, x, q.y, q.s, rot, dk ? '#3E7A5A' : '#4E7E3A');
        else { cb.save(); cb.translate(x, q.y); cb.rotate(rot); cb.fillStyle = dk ? '#4E9A6A' : '#7CBE5A'; for (var p = 0; p < 3; p++) { cb.save(); cb.rotate(p * 2.094); n8_ell(cb, 0, -3.4 * q.s, 2.6 * q.s, 2.2 * q.s); cb.fill(); cb.restore(); } cb.restore(); } });
      // sorrel flowers opening behind the beam
      if (sg > 0) flowers.forEach(function (fl) { var reach = (fl.x - (-W * 0.15)) / (W * 1.3), tOpen = 0.9 + 5.4 * reach + fl.d, k = (sg - tOpen) / 0.7, fade = 1 - n8_ease((sg - 10.5) / 2.5); if (k <= 0 || fade <= 0) return; cb.save(); cb.globalAlpha = fade;
        if (k < 1.2) { cb.globalCompositeOperation = 'lighter'; n8_dot(cb, warmG, fl.x, fl.y, 14 * S * fl.s, 0.8 * Math.sin(Math.PI * Math.min(1, k / 1.2))); cb.globalCompositeOperation = 'source-over'; }
        drawFlower(cb, fl.x, fl.y, (ph ? 1.1 : 1.6) * S * fl.s + 0.5, Math.min(1, k)); cb.restore(); });
    },
    finish: function (t) { sweep = {t0: t}; }
  };
};

UIC.waterfall = {L: ['#2E6A5E', '#1E4A44', 'rgba(255,255,255,0.84)', '#132A26', '#4C6A62', '#1E7466', '#1E7466', '#2E908A', '#FFFFFF'], D: ['#163A3E', '#0A1C22', 'rgba(12,28,34,0.78)', '#E6F4F2', '#9CBEB8', '#7FE6D2', '#7FE6D2', '#A8D8F0', '#0C201C']};
UIC.redwoods = {L: ['#7A3E28', '#5A2E20', 'rgba(255,253,249,0.84)', '#2A1A14', '#6E5A4E', '#A2452A', '#A2452A', '#C0663A', '#FFFFFF'], D: ['#1E2A40', '#0C1220', 'rgba(16,22,34,0.78)', '#ECF0F6', '#A6B2C4', '#F0A57A', '#F0A57A', '#F6C49E', '#1C1420']};
