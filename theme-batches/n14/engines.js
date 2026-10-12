// ---- batch n14 engines: lotus
function n14_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n14_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n14_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n14_ease((T - c) / (d - c)); }
var n14_gc = null;
function n14_ctx() { return n14_gc || (n14_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) that fades to transparent; draw it with n14_glow (sy squashes it vertically)
function n14_rg(col, mid) { var g = n14_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n14_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n14_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
function n14_spark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.25, y - r * 0.25); c.lineTo(x + r, y); c.lineTo(x + r * 0.25, y + r * 0.25); c.lineTo(x, y + r); c.lineTo(x - r * 0.25, y + r * 0.25); c.lineTo(x - r, y); c.lineTo(x - r * 0.25, y - r * 0.25); c.closePath(); c.fill(); }

// ---------- Lotus Lake: the near lotus plants sway in the dawn air, rings spread where dew drips off the leaves, loose petals drift on
// the still water, mist ribbons slide along the far shore and the sun's path shimmers. Night: closed buds, moon path, twinkling stars.
// Moment: a wave of warm light spreads over the lake from the sun, the near buds unfurl one after another into full blooms that breathe
// out golden pollen sparkles, rings ripple across the water and sunbeams fan through the mist. At night the buds open and glow softly.
ENGINES.lotus = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, Sn = A.sun, hz = A.hz, i, P = A.pal.leaf, F = A.pal.flw;
  var sunG = n14_rg(dk ? 'rgba(200,214,255,0.32)' : 'rgba(255,236,200,0.55)', [0.35, 0.35]), mistG = n14_rg(dk ? 'rgba(130,150,210,0.16)' : 'rgba(255,240,236,0.5)', [0.5, 0.55]),
    twG = n14_rg('rgba(255,250,235,0.9)', [0.25, 0.3]), pinkG = n14_rg(dk ? 'rgba(255,150,200,0.55)' : 'rgba(255,190,214,0.5)', [0.35, 0.3]), goldG = n14_rg(dk ? 'rgba(255,230,170,0.9)' : 'rgba(255,214,120,0.9)', [0.3, 0.35]);
  var fe = A.fe.map(function (e, j) { return {e: e, j: j, base: e.open || 0, open: e.open || 0, want: e.open || 0, ph: e.ph}; });
  var order = fe.filter(function (f) { return f.e.k !== 'leaf'; }).concat(fe.filter(function (f) { return f.e.k === 'leaf'; }));
  var cache = {};
  function paths(f) { var q = f.e.k === 'leaf' || f.e.k === 'pod' ? 0 : Math.round(f.open * 20), key = f.j + '_' + q; if (cache[key]) return cache[key];
    var o = {a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: '', s: '', t: ''}; o.s = n14_fePaint(o, f.e, q / 20) + o.s; var r = {}; Object.keys(o).forEach(function (k) { if (o[k]) r[k] = new Path2D(o[k]); }); return (cache[key] = r); }
  var dew = []; fe.forEach(function (f) { if (f.e.k === 'leaf') for (var k = 0; k < 3; k++) { var a = Math.random() * 6.28, rr = 0.25 + Math.random() * 0.5; dew.push({f: f, x: f.e.x + Math.cos(a) * f.e.rx * rr, y: f.e.y + Math.sin(a) * f.e.ry * rr, ph: Math.random() * 6.28}); } });
  var tws = []; if (dk) for (i = 0; i < 300 && tws.length < (ph ? 14 : 30); i++) { var tx = Math.random() * W, ty = Math.random() * hz * 0.8; if (Math.hypot(tx - Sn[0], ty - Sn[1]) > Sn[2] * 3.5) tws.push([tx, ty, Math.random() * 6.28]); }
  var spots = A.spots, ripples = [], drops = [], petals = [], motes = [], swirl = [], stars = [], nextR = 1, nextD = 2.5, nextP = 6, nextStar = 6, fin = null, tnow = 0;
  function yU(y) { return Math.max(0.02, (y - hz) / (H - hz)); }
  function ring(x, y, t0, big) { ripples.push({x: x, y: y, t0: t0, u: yU(y), big: big || 1}); }
  // a few loose petals already floating on the water
  for (i = 0; i < (ph ? 3 : 5) && spots.length; i++) { var sp = spots[Math.floor(Math.random() * spots.length)]; petals.push({x: sp[0], y: sp[1], u: sp[2], rot: Math.random() * 6.28, vx: (Math.random() - 0.5) * 3, ph: Math.random() * 6.28, t0: -9}); }
  return {
    step: function (dt, t, f) { tnow = t;
      nextR -= dt * f.s; if (nextR <= 0 && spots.length) { nextR = 1.4 + Math.random() * 2.4; var s = spots[Math.floor(Math.random() * spots.length)]; ring(s[0], s[1], t); }
      nextD -= dt * f.s; if (nextD <= 0 && A.drips.length) { nextD = 3 + Math.random() * 4; var d = A.drips[Math.floor(Math.random() * A.drips.length)]; drops.push({x: d[0], y0: d[1], y1: d[2], u: d[3], t0: t}); }
      drops.forEach(function (d) { var k = (t - d.t0), y = d.y0 + 260 * S * k * k; if (y >= d.y1 && !d.done) { d.done = 1; ring(d.x, d.y1, t); } }); drops = drops.filter(function (d) { return !d.done; });
      ripples = ripples.filter(function (r) { return t - r.t0 < 3.6 * r.big; });
      // now and then a petal lets go of a near bloom and spins down onto the water (day)
      nextP -= dt * f.s; if (!dk && nextP <= 0) { nextP = 9 + Math.random() * 8; var src = fe.filter(function (q) { return q.e.k === 'bloom' && q.open > 0.6; }); if (src.length) { var b = src[Math.floor(Math.random() * src.length)].e; swirl.push({x: b.x, y: b.y - b.r * 0.6, vx: (12 + Math.random() * 20) * S * (b.x > W / 2 ? -1 : 1), vy: 6 * S, t0: t, rot: Math.random() * 6, land: b.y + (H - b.y) * (0.3 + Math.random() * 0.4), fall: 1}); } }
      swirl.forEach(function (p) { var age = t - p.t0; if (p.fall) { p.vy = 18 * S + Math.sin(age * 2.4) * 10 * S; p.x += (p.vx + Math.sin(age * 1.7) * 14 * S) * dt; p.y += p.vy * dt; p.rot += dt * 1.6; if (p.y > p.land) { p.gone = 1; petals.push({x: p.x, y: p.y, u: yU(p.y), rot: p.rot, vx: (Math.random() - 0.5) * 3, ph: Math.random() * 6.28, t0: t}); ring(p.x, p.y, t); } }
        else { p.vy -= 10 * S * dt; p.x += (p.vx + Math.cos(age * 2 + p.ph) * 30 * S) * dt; p.y += (p.vy + Math.sin(age * 2.6 + p.ph) * 18 * S) * dt; p.rot += p.vr * dt; if (age > 7 || p.y < -20) p.gone = 1; } });
      swirl = swirl.filter(function (p) { return !p.gone; });
      petals.forEach(function (p) { p.x += p.vx * dt * f.s; }); petals = petals.filter(function (p) { return p.x > -30 && p.x < W + 30; }); if (petals.length > (ph ? 6 : 10)) petals.shift();
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 10 + Math.random() * 10; stars.push({t0: t, x: W * (0.4 + Math.random() * 0.55), y: hz * (0.1 + Math.random() * 0.35)}); } }
      stars = stars.filter(function (s2) { return t - s2.t0 < 1.2; });
      if (fin) { var T = t - fin.t0;
        fe.forEach(function (q) { if (q.e.k === 'leaf' || q.e.k === 'pod') return; var at = 0.5 + (q.e.x / W) * 1.6; if (T > at && !q.hit) { q.hit = 1; q.want = 1; q.tOpen = t; ring(q.e.x, Math.min(H - 6, q.e.y + (H - q.e.y) * 0.75), t, 1.4); } });
        if (T > 0.5 && T < 3.2 && Math.random() < dt * 5 && spots.length) { var s3 = spots[Math.floor(Math.random() * spots.length)]; ring(s3[0], s3[1], t, 1.3); }
        if (T > 0.8 && T < 7) fe.forEach(function (q) { if (q.hit && q.open > 0.5 && Math.random() < dt * (ph ? 7 : 10)) motes.push({x: q.e.x + (Math.random() - 0.5) * q.e.r, y: q.e.y - q.e.r * 0.5, t0: t, ph: Math.random() * 6.28, rr: q.e.r * (0.4 + Math.random() * 0.8), sp: 30 + Math.random() * 40}); });
        if (T > 1 && T < 4 && Math.random() < dt * (ph ? 4 : 7)) { var q2 = fe[Math.floor(Math.random() * fe.length)].e; swirl.push({x: q2.x, y: q2.y - 20 * S, vx: (40 + Math.random() * 50) * S * (Math.random() < 0.5 ? -1 : 1), vy: -(20 + Math.random() * 30) * S, t0: t, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 5, ph: Math.random() * 6.28}); }
        if (T > 15) fe.forEach(function (q) { q.want = q.base; q.hit = 0; });
        if (T > 20) fin = null; }
      motes = motes.filter(function (m) { return t - m.t0 < 3.5; });
      fe.forEach(function (q) { q.open += (q.want - q.open) * Math.min(1, dt * (q.want > q.open ? 1.6 : 0.35)); });
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, rk = fin ? n14_env(T, 0.2, 1.4, 6, 10) : 0;
      ca.save(); ca.globalCompositeOperation = 'lighter';
      // the sun's (moon's) glow, and in the moment sunbeams fanning out through the mist
      n14_glow(ca, sunG, Sn[0], Sn[1], Sn[2] * (dk ? 4 : 4.4) * (1 + 0.03 * Math.sin(tt * 0.6) + rk * 0.6), 0.8 + rk * 0.2);
      if (!dk) for (i = 0; i < 9; i++) { var a = -Math.PI + 0.25 + i * 0.33 + Math.sin(tt * 0.12 + i) * 0.02, L = W * 0.9, w = (16 + (i % 3) * 14) * S, al = 0.035 + rk * 0.1; ca.fillStyle = 'rgba(255,240,210,' + (al * (0.6 + 0.4 * Math.sin(tt * 0.5 + i * 2))) + ')'; ca.beginPath(); ca.moveTo(Sn[0], Sn[1]); ca.lineTo(Sn[0] + Math.cos(a - 0.025) * L - w, Sn[1] + Math.sin(a - 0.025) * L); ca.lineTo(Sn[0] + Math.cos(a + 0.025) * L + w, Sn[1] + Math.sin(a + 0.025) * L); ca.closePath(); ca.fill(); }
      if (dk) tws.forEach(function (s, j) { var a2 = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] + j)), 4); n14_glow(ca, twG, s[0], s[1], 3 + a2 * 3, a2 * 0.9); });
      // the sun's path on the water shimmering
      ca.fillStyle = dk ? 'rgba(230,236,255,0.9)' : 'rgba(255,248,226,0.95)';
      for (i = 0; i < (ph ? 14 : 24); i++) { var gy = hz + 4 + ((i * 41.7) % ((H - hz) * 0.75)), gu = yU(gy), gx = Sn[0] + (Math.sin(i * 12.9) * 0.5) * (10 + gu * W * 0.08), ga = Math.pow(Math.max(0, Math.sin(tt * 2.2 + i * 1.9)), 4) * (1 + rk); if (ga > 0.02) { ca.globalAlpha = Math.min(1, ga * 0.8); n14_ell(ca, gx, gy, (3 + gu * 22) * S, 0.6 + gu * 1.4); ca.fill(); } }
      ca.globalAlpha = 1;
      // the moment's wave of warm light spreading over the lake
      if (fin && T < 6) { ca.save(); ca.beginPath(); ca.rect(-50, hz + 1, W + 100, H); ca.clip(); var wr = n14_ease(T / 5) * W * 1.1, wa = (1 - n14_ease(T / 6)) * 0.5; ca.strokeStyle = dk ? 'rgba(200,215,255,' + wa * 0.6 + ')' : 'rgba(255,226,180,' + wa + ')'; ca.lineWidth = (30 + T * 20) * S; n14_ell(ca, Sn[0], hz + 2, wr, wr * 0.22); ca.stroke(); ca.restore(); }
      ca.restore();
      // mist ribbons sliding along the far shore
      for (i = 0; i < 4; i++) { var mx = ((tt * (6 + i * 1.5) + i * 380) % (W + 800)) - 400, my = hz + (i - 1.2) * H * 0.012; n14_glow(ca, mistG, mx, my, (260 + i * 60) * S * (ph ? 1.4 : 1), 0.9 - rk * 0.4, 0.07); }
      // falling dew drops and the rings they (and the breeze) leave on the water
      ca.fillStyle = dk ? 'rgba(210,225,255,0.85)' : 'rgba(255,255,255,0.95)'; drops.forEach(function (d) { var k = t - d.t0, y = d.y0 + 260 * S * k * k, rr = (0.8 + d.u * 2) * S + 0.5; n14_ell(ca, d.x, y, rr * 0.8, rr * 1.2); ca.fill(); });
      ca.lineWidth = 1.2;
      ripples.forEach(function (r) { var dur = 3.6 * r.big, k = (t - r.t0) / dur; for (var j = 0; j < 3; j++) { var kk = k - j * 0.14; if (kk <= 0 || kk >= 1) continue; var rx = (6 + kk * 70 * r.big) * (0.25 + r.u * 1.1) * S * (ph ? 1.4 : 1); ca.strokeStyle = (dk ? 'rgba(170,190,240,' : 'rgba(255,255,255,') + (0.6 * (1 - kk) * Math.min(1, kk * 10)) + ')'; ca.lineWidth = (0.8 + r.u * 1.2) * S + 0.3; n14_ell(ca, r.x, r.y, rx, rx * (0.16 + r.u * 0.2)); ca.stroke(); } });
      // loose petals floating, gently rocking
      petals.forEach(function (p) { var sz = (3 + p.u * 14) * S * (ph ? 1.3 : 1), bob = Math.sin(tt * 1.2 + p.ph) * 0.15, al = Math.min(1, (t - p.t0) * 2 + (p.t0 < 0 ? 1 : 0));
        ca.save(); ca.globalAlpha = al; ca.translate(p.x, p.y); ca.scale(1, 0.4 + p.u * 0.25); ca.rotate(p.rot + bob);
        ca.fillStyle = dk ? 'rgba(0,10,20,0.3)' : 'rgba(60,100,120,0.18)'; n14_ell(ca, sz * 0.1, sz * 0.25, sz, sz * 0.5); ca.fill();
        ca.fillStyle = dk ? '#9C7A92' : '#FBE0E8'; n14_ell(ca, 0, 0, sz, sz * 0.48); ca.fill(); ca.fillStyle = dk ? '#B0627E' : '#EE8CB0'; n14_ell(ca, sz * 0.45, 0, sz * 0.5, sz * 0.3); ca.fill(); ca.restore(); });
      // the near lotus plants, swaying (blooms behind, the big leaves in front)
      order.forEach(function (q) { var e = q.e, lf = e.k === 'leaf', ang = (Math.sin(tt * (lf ? 0.5 : 0.7) + q.ph) * (lf ? 0.012 : 0.03) + Math.sin(tt * 1.7 + q.ph * 2) * (lf ? 0.004 : 0.008)) * f.a, pth = paths(q);
        cb.save(); cb.translate(e.bx, e.by); cb.rotate(ang); cb.translate(-e.bx, -e.by);
        if (!lf && e.k !== 'pod' && q.open > 0.3 && (dk || rk > 0)) { cb.save(); cb.globalCompositeOperation = 'lighter'; n14_glow(cb, pinkG, e.x, e.y - e.r * 0.4, e.r * 2.4, (dk ? 0.55 : 0.3) * n14_ease((q.open - 0.3) / 0.5) * (dk ? 1 : rk)); cb.restore(); }
        [['a', P[0]], ['b', P[1]], ['c', P[2]], ['d', P[3]], ['e', F[0]], ['f', F[1]], ['g', F[2]], ['h', F[3]]].forEach(function (z) { if (pth[z[0]]) { cb.fillStyle = z[1]; cb.fill(pth[z[0]]); } });
        if (pth.s) { cb.strokeStyle = P[4]; cb.lineWidth = 1.1 * S + 0.3; cb.lineCap = 'round'; cb.stroke(pth.s); }
        if (pth.t) { cb.strokeStyle = F[4]; cb.lineWidth = 3 * S + 0.6; cb.lineCap = 'round'; cb.stroke(pth.t); }
        cb.restore(); });
      // dew drops twinkling on the big leaves
      dew.forEach(function (d) { var e = d.f.e, ang = Math.sin(tt * 0.5 + d.f.ph) * 0.012 * f.a, c = Math.cos(ang), s = Math.sin(ang), x = e.bx + (d.x - e.bx) * c - (d.y - e.by) * s, y = e.by + (d.x - e.bx) * s + (d.y - e.by) * c, r = (ph ? 2.6 : 3.4) * S + 1;
        cb.fillStyle = dk ? 'rgba(170,200,220,0.5)' : 'rgba(220,245,230,0.75)'; n14_ell(cb, x, y, r, r * 0.8); cb.fill(); cb.fillStyle = dk ? 'rgba(240,246,255,0.8)' : '#FFFFFF'; n14_ell(cb, x - r * 0.3, y - r * 0.25, r * 0.35, r * 0.3); cb.fill();
        var tw = Math.pow(Math.max(0, Math.sin(tt * 1.4 + d.ph)), 8); if (tw > 0.05) { cb.globalAlpha = tw; n14_spark(cb, x - r * 0.3, y - r * 0.3, r * 2.2); cb.globalAlpha = 1; } });
      // petals in the air, and the moment's golden pollen sparkles spiralling up from the new blooms
      swirl.forEach(function (p) { var age = t - p.t0, al = p.fall ? 1 : Math.min(1, age * 3) * Math.min(1, (7 - age) / 2); cb.save(); cb.globalAlpha = al; cb.translate(p.x, p.y); cb.rotate(p.rot); var sz = (6 * S + 2) * (ph ? 1.2 : 1);
        cb.fillStyle = dk ? '#C08CAC' : '#FBDCE6'; n14_ell(cb, 0, 0, sz, sz * 0.5); cb.fill(); cb.fillStyle = dk ? '#C86C90' : '#F08CB2'; n14_ell(cb, sz * 0.45, 0, sz * 0.5, sz * 0.32); cb.fill(); cb.restore(); });
      cb.save(); cb.globalCompositeOperation = 'lighter'; motes.forEach(function (m) { var age = t - m.t0, k = age / 3.5, x = m.x + Math.cos(age * 3 + m.ph) * m.rr * (0.4 + k), y = m.y - age * m.sp * S, a2 = Math.sin(Math.PI * k);
        n14_glow(cb, goldG, x, y, (4 + 3 * Math.sin(age * 6 + m.ph)) * S + 1.5, a2 * 0.9); }); cb.restore();
      stars.forEach(function (s2) { var k = (t - s2.t0) / 1.2; cb.strokeStyle = 'rgba(255,248,230,' + Math.sin(Math.PI * k) * 0.9 + ')'; cb.lineWidth = 1.6; cb.beginPath(); cb.moveTo(s2.x - k * 160, s2.y + k * 56); cb.lineTo(s2.x - k * 160 + 44, s2.y + k * 56 - 15); cb.stroke(); });
    },
    finish: function (t) { fin = {t0: t}; fe.forEach(function (q) { q.hit = 0; }); if (dk) { stars.push({t0: t + 0.8, x: W * 0.8, y: hz * 0.2}); stars.push({t0: t + 2.6, x: W * 0.55, y: hz * 0.3}); } }
  };
};

UIC.lotus = {L: ['#3E7258', '#2A5240', 'rgba(255,255,255,0.84)', '#22302C', '#5E6C68', '#C04C7A', '#C04C7A', '#D86A8E', '#FFFFFF'], D: ['#1C2A50', '#0E1830', 'rgba(18,26,52,0.78)', '#EEF0FA', '#AEB6CE', '#EE8AB4', '#EE8AB4', '#F2A6B8', '#1A1020']};
