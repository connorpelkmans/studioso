// ---- batch n8 engines: redwoods
function n8_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n8_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n8_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n8_ease((T - c) / (d - c)); }
var n8_gc = null;
function n8_ctx() { return n8_gc || (n8_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) centred on 0,0 that fades to transparent; draw it with n8_dot
function n8_rg(col, mid) { var g = n8_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n8_dot(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n8_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }

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

UIC.redwoods = {L: ['#7A3E28', '#5A2E20', 'rgba(255,253,249,0.84)', '#2A1A14', '#6E5A4E', '#A2452A', '#A2452A', '#C0663A', '#FFFFFF'], D: ['#1E2A40', '#0C1220', 'rgba(16,22,34,0.78)', '#ECF0F6', '#A6B2C4', '#F0A57A', '#F0A57A', '#F6C49E', '#1C1420']};
