// ---- batch n13 engines: maples
function n13_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n13_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n13_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n13_ease((T - c) / (d - c)); }
var n13_gc = null;
function n13_ctx() { return n13_gc || (n13_gc = document.createElement('canvas').getContext('2d')); }
// a unit radial glow (radius 1) that fades to transparent; draw it with n13_glow
function n13_rg(col, mid) { var g = n13_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n13_glow(c, g, x, y, r, a, sy) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r * (sy || 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n13_ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, 7); }
function n13_spark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.22, y - r * 0.22); c.lineTo(x + r, y); c.lineTo(x + r * 0.22, y + r * 0.22); c.lineTo(x, y + r); c.lineTo(x - r * 0.22, y + r * 0.22); c.lineTo(x - r, y); c.lineTo(x - r * 0.22, y - r * 0.22); c.closePath(); c.fill(); }
// a falling or floating leaf: Path2D p (unit size), at x,y, size r, spin s (the flip as it tumbles), rotation rot
function n13_leafAt(c, p, col, x, y, r, rot, flip, a) { if (a <= 0.01) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(rot); c.scale(r * (0.25 + 0.75 * Math.abs(flip)), r); c.fillStyle = col; c.fill(p); c.restore(); }

// ---------- Maple Ravine: maple leaves drift down and spin, some land on the pools and ride the little falls down the ravine;
// water streams over every lip, foam churns at the foot of each fall, glints wander over the pools, mist drifts low and the hanging
// sprays sway. Night: the moon glows behind the red canopy, the water is silvered, the stone lantern burns softly, stars twinkle.
// Moment: a gust shakes the canopy: a whirl of crimson, orange and gold leaves spirals up the ravine, sunbeams (moonbeams) fan through
// the gap in the trees, the pools glitter, the lantern flares and a raft of leaves rides down every fall.
ENGINES.maples = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, S = A.S, i, tnow = 0;
  var MAP = new Path2D(n13_mleaf(0, 0, 1, 0, 7, true)), cols = dk ? ['#8A2434', '#A2343A', '#B44C3C', '#C46E42'] : ['#C42A26', '#E04A2A', '#F28A32', '#F6BE44'];
  var pools = A.pools, cur = A.cur, Mo = A.moon, lan = A.lan, ls = A.ls;
  var moonG = n13_rg(dk ? 'rgba(220,226,255,0.32)' : 'rgba(255,248,215,0.42)', [0.4, 0.3]), mistG = n13_rg(dk ? 'rgba(170,184,236,0.1)' : 'rgba(255,255,255,0.08)', [0.5, 0.5]), lanG = n13_rg('rgba(255,196,110,0.7)', [0.25, 0.3]), twG = n13_rg('rgba(255,250,235,0.9)', [0.25, 0.3]), foamG = n13_rg('rgba(255,255,255,0.5)', [0.4, 0.4]);
  var sprays = A.sprays.map(function (s) { var ps = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], tw = new Path2D(n13_band(n13_fn(0, 1, 0.125, function (u) { return u; }).map(function (p) { var u = p[0]; return [Math.sin(u * 1.6) * s.len * s.lean, u * s.len]; }), 1.4 * S + 0.6, 0.5));
    s.lv.forEach(function (l) { ps[l[4]].addPath(new Path2D(n13_mleaf(l[0], l[1], l[2], l[3], 7, true))); }); return {x: s.x, y: s.y, ps: ps, tw: tw, ph: s.ph}; });
  var lipY = function (p, x) { var u = (x - p.cx) / p.hw; return p.cy + p.hd * Math.sqrt(Math.max(0, 1 - u * u)) * 0.95; };
  var falling = [], floats = [], storm = [], glits = [], stars = [], fin = null, nextLeaf = 0.5, nextStar = 6, ripples = [];
  var tws = []; for (i = 0; i < 300 && tws.length < (ph ? 10 : 22); i++) { var tx = Math.random() * W, ty = Math.random() * H * 0.16; if (Math.hypot(tx - Mo[0], ty - Mo[1]) > Mo[2] * 2.5) tws.push([tx, ty, Math.random() * 6.28]); }
  function newFloat(pi, x, y) { var p = pools[pi]; floats.push({pi: pi, x: x, y: y, r: ls * (0.9 + Math.random() * 0.4) * (0.5 + 0.5 * Math.min(1, p.hw / (W * 0.2))), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.6, c: Math.floor(Math.random() * 4), st: 0, off: (Math.random() - 0.5) * 0.7, sp: 0.6 + Math.random() * 0.6, born: tnow}); }
  function inPool(p, x, y, k) { var u = (x - p.cx) / (p.hw * k), w = (y - p.cy) / (p.hd * k); return u * u + w * w < 1; }
  function seedFloat(pi) { var p = pools[pi]; for (var tries = 0; tries < 10; tries++) { var x = p.cx + (Math.random() - 0.5) * p.hw * 1.3, y = p.cy + (Math.random() - 0.5) * p.hd * 1.2; if (inPool(p, x, y, 0.7)) { newFloat(pi, x, y); return; } } }
  pools.forEach(function (p, pi) { for (var k = 0; k < (pi === pools.length - 1 ? 3 : 2); k++) seedFloat(pi); });
  function dropLeaf(fromStorm) { var c = A.cl[Math.floor(Math.random() * A.cl.length)]; if (!c) return; var x = c[0] + (Math.random() - 0.5) * c[2], y = c[1] + c[2] * 0.4;
    falling.push({x: x, y: y, vx: (6 + Math.random() * 16) * S * (x < W / 2 ? 1 : -0.6), vy: (26 + Math.random() * 18) * S, r: ls * (1.1 + Math.random() * 0.5), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 2.4, sp: 2 + Math.random() * 3, ph: Math.random() * 6.28, c: Math.floor(Math.random() * 4), land: A.gTop + (H - A.gTop) * (0.05 + Math.random() * 0.9), t0: tnow, lay: 0}); }
  function gustAt(t) { return fin ? n13_env(t - fin.t0, 0, 0.6, 2.4, 4.5) : 0; }
  return {
    step: function (dt, t, f) { tnow = t; var g = gustAt(t);
      nextLeaf -= dt * f.s * (1 + g * 3); if (nextLeaf <= 0) { nextLeaf = (ph ? 1.6 : 0.9) * (0.5 + Math.random()); if (falling.length < (ph ? 10 : 18)) dropLeaf(); }
      falling.forEach(function (l) { if (l.lay) { l.lay += dt; return; } var sw = Math.sin((t - l.t0) * 1.6 + l.ph);
        l.x += (l.vx + sw * 22 * S + g * 120 * S) * dt; l.y += l.vy * dt * (0.75 + 0.25 * Math.cos((t - l.t0) * 3.2 + l.ph)); l.rot += l.vr * dt;
        if (l.y >= l.land) { var hit = -1; pools.forEach(function (p, pi) { if (hit < 0 && inPool(p, l.x, l.y, 0.72)) hit = pi; }); if (hit >= 0 && floats.length < (ph ? 22 : 36)) { newFloat(hit, l.x, l.y); floats[floats.length - 1].c = l.c; ripples.push({x: l.x, y: l.y, t0: t, r: pools[hit].hw * 0.12 + 6}); l.dead = 1; } else l.lay = 0.001; } });
      falling = falling.filter(function (l) { return !l.dead && l.lay < 4 && l.x > -40 && l.x < W + 40; });
      // floating leaves drift to the lip of their pool, tumble down the fall and carry on in the pool below
      floats.forEach(function (l) { var p = pools[l.pi], c = cur[l.pi + 1]; l.rot += l.vr * dt;
        if (l.st === 0) { if (!c) { l.y += 7 * S * l.sp * dt; l.x += Math.sin(t * 0.5 + l.rot) * 3 * S * dt; if (l.y > H + 20) l.dead = 1; return; }
          var tx = c.x + l.off * c.w0, ty = lipY(p, tx) - 1, dx = tx - l.x, dy = ty - l.y, d = Math.hypot(dx, dy), sp = (5 + 10 * Math.min(1, 30 / Math.max(8, d))) * S * l.sp * (1 + gustAt(t));
          if (d < 2) { l.st = 1; l.x = tx; l.fy = ty; } else { l.x += dx / d * sp * dt + Math.sin(t * 0.7 + l.rot) * 2 * S * dt; l.y += dy / d * sp * dt; } }
        else { l.y += (40 + (l.y - l.fy) * 4) * S * dt; l.vr = 3; if (l.y >= c.yb) { var np = pools[l.pi + 1]; l.pi++; l.st = 0; l.vr = (Math.random() - 0.5) * 0.6; l.y = np.yb + np.hd * 0.45; l.x += (Math.random() - 0.5) * c.w1 * 0.6; l.off = (Math.random() - 0.5) * 0.7; ripples.push({x: l.x, y: l.y, t0: t, r: np.hw * 0.1 + 5}); } } });
      floats = floats.filter(function (l) { return !l.dead; });
      if (floats.length < (ph ? 6 : 10) && Math.random() < dt * 0.3) seedFloat(Math.floor(Math.random() * (pools.length - 1)));
      ripples = ripples.filter(function (r) { return t - r.t0 < 2.4; });
      if (dk) { nextStar -= dt * f.s; if (nextStar <= 0) { nextStar = 10 + Math.random() * 12; stars.push({t0: t, x: W * (0.3 + Math.random() * 0.5), y: H * (0.03 + Math.random() * 0.08)}); } }
      stars = stars.filter(function (s) { return t - s.t0 < 1.3; });
      if (fin) { var T = t - fin.t0;
        if (T > 0.2 && T < 3.2) { var em = dt * (ph ? 55 : 100); while (em > 0) { if (Math.random() < em) { var c2 = A.cl[Math.floor(Math.random() * A.cl.length)], x0 = c2[0] + (Math.random() - 0.5) * c2[2], y0 = c2[1] + (Math.random() - 0.5) * c2[2] * 0.6;
          storm.push({x0: x0, y0: y0, t0: t, cx: W * (0.42 + Math.random() * 0.2) + (Math.random() - 0.5) * W * 0.1, up: (40 + Math.random() * 60) * S, rad: (26 + Math.random() * 46) * S * (ph ? 0.7 : 1), w: 2 + Math.random() * 1.4, ph: Math.random() * 6.28, r: ls * (1.4 + Math.random() * 0.8), c: Math.floor(Math.random() * 4), vr: (Math.random() - 0.5) * 6}); } em -= 1; } }
        if (T > 0.6 && T < 5.5 && Math.random() < dt * (ph ? 14 : 26)) { var gp = pools[Math.floor(Math.random() * pools.length)]; glits.push({x: gp.cx + (Math.random() - 0.5) * gp.hw * 1.5, y: gp.cy + (Math.random() - 0.5) * gp.hd * 1.2, t0: t, r: (3 + Math.random() * 4) * S + 1.5, p: gp}); }
        if (!fin.raft && T > 1.4) { fin.raft = 1; pools.forEach(function (p, pi) { for (var k = 0; k < (ph ? 3 : 5); k++) if (floats.length < 60) seedFloat(pi); }); }
        if (T > 12) fin = null; }
      storm = storm.filter(function (s) { return t - s.t0 < 5.2; }); glits = glits.filter(function (g2) { return t - g2.t0 < 1.4 && inPool(g2.p, g2.x, g2.y, 0.85); });
    },
    draw: function (ca, cb, t, f) { tnow = t; var tt = t * f.s, T = fin ? t - fin.t0 : -1, beam = fin ? n13_env(T, 0.5, 1.6, 5, 8) : 0, g = gustAt(t);
      // the sun's or moon's glow, behind the canopy; stronger in the moment, with beams fanning down through the gap in the trees
      ca.save(); ca.globalCompositeOperation = 'lighter'; n13_glow(ca, moonG, Mo[0], Mo[1], Mo[2] * (dk ? 4.4 : 3.8) * (1 + 0.04 * Math.sin(tt * 0.6) + beam * 0.5), 0.8 + beam * 0.3);
      if (beam > 0) { for (i = 0; i < 9; i++) { var a = Math.PI * (0.3 + i * 0.055) + Math.sin(tt * 0.25 + i) * 0.015, L = H * 1.2, w = (20 + (i % 3) * 16) * S; ca.fillStyle = dk ? 'rgba(200,210,255,' + (0.06 * beam) + ')' : 'rgba(255,240,200,' + (0.11 * beam * (0.6 + 0.4 * Math.sin(tt * 1.1 + i * 2))) + ')';
        ca.beginPath(); ca.moveTo(Mo[0], Mo[1]); ca.lineTo(Mo[0] + Math.cos(a - 0.02) * L - w, Mo[1] + Math.sin(a - 0.02) * L); ca.lineTo(Mo[0] + Math.cos(a + 0.02) * L + w, Mo[1] + Math.sin(a + 0.02) * L); ca.closePath(); ca.fill(); } }
      if (dk) tws.forEach(function (s, j) { var a2 = Math.pow(Math.max(0, Math.sin(tt * 1.2 + s[2] + j)), 4); n13_glow(ca, twG, s[0], s[1], 4 + a2 * 3, a2 * 0.9); });
      ca.restore();
      // water streaming over each lip: bright streaks running down the curtains, churning foam at their feet, rings spreading into the pool
      ca.lineCap = 'round';
      cur.forEach(function (c, j) { var fall = c.yb - c.yt, n = Math.max(3, Math.round(c.w0 / (5 * S)));
        for (var k = 0; k < n; k++) { var u = ((tt * (0.9 + (k % 3) * 0.25) + k * 0.37 + j * 0.21) % 1), xx = c.x - c.w0 + 2 * c.w0 * ((k + 0.5) / n), xb = c.x - c.w1 + 2 * c.w1 * ((k + 0.5) / n), x = xx + (xb - xx) * u, y = c.yt + fall * u;
          ca.strokeStyle = dk ? 'rgba(230,236,255,' + (0.7 * Math.sin(Math.PI * u)) + ')' : 'rgba(255,255,255,' + (0.9 * Math.sin(Math.PI * u)) + ')'; ca.lineWidth = (1.2 + (k % 2) * 0.8) * S + 0.5; ca.beginPath(); ca.moveTo(x, y); ca.lineTo(x + (xb - xx) * 0.2, y + Math.min(fall * 0.28, 14 * S + 4)); ca.stroke(); }
        ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
        for (var q = 0; q < 5; q++) { var fx = c.x + (q / 4 - 0.5) * c.w1 * 2, fr = c.w1 * (0.3 + 0.12 * Math.sin(tt * 4 + q * 1.7 + j)) + 2; n13_glow(ca, foamG, fx, c.yb + 1, fr, dk ? 0.5 : 0.85, 0.5); }
        ca.restore();
        for (var r2 = 0; r2 < 2; r2++) { var k2 = ((tt * 0.45 + r2 * 0.5 + j * 0.3) % 1); ca.strokeStyle = dk ? 'rgba(200,214,250,' + (0.4 * (1 - k2)) + ')' : 'rgba(255,255,255,' + (0.55 * (1 - k2)) + ')'; ca.lineWidth = 1.2; n13_ell(ca, c.x, c.yb + 3 + k2 * c.w1 * 0.2, c.w1 * (1.1 + k2 * 0.9), c.w1 * (0.12 + k2 * 0.18)); ca.stroke(); } });
      // glints wandering over the pools
      ca.fillStyle = dk ? '#DCE4FF' : '#FFFFFF';
      pools.forEach(function (p, j) { for (var k = 0; k < (p.hw > W * 0.08 ? 6 : 3); k++) { var u = ((tt * 0.03 + k * 0.173 + j * 0.31) % 1), x = p.cx + (u * 2 - 1) * p.hw * 0.75, y = p.cy + Math.sin(k * 2.3 + j) * p.hd * 0.45, a = Math.sin(Math.PI * u) * Math.max(0, Math.sin(tt * 2.1 + k * 1.9 + j)); if (a < 0.05) continue; ca.globalAlpha = a * (dk ? 0.55 : 0.8); n13_ell(ca, x, y, p.hw * 0.07 + 2, Math.max(0.6, p.hd * 0.04)); ca.fill(); } }); ca.globalAlpha = 1;
      ripples.forEach(function (r) { var k = (t - r.t0) / 2.4; ca.strokeStyle = dk ? 'rgba(200,214,250,' + (0.5 * (1 - k)) + ')' : 'rgba(255,255,255,' + (0.7 * (1 - k)) + ')'; ca.lineWidth = 1.1; n13_ell(ca, r.x, r.y, r.r * (0.3 + k * 1.4), r.r * (0.3 + k * 1.4) * 0.3); ca.stroke(); });
      // leaves riding the stream
      floats.forEach(function (l) { var p = pools[l.pi]; var a = Math.min(1, (t - l.born) * 2); if (l.st === 0 && !cur[l.pi + 1]) a *= Math.max(0, Math.min(1, (H + 10 - l.y) / 40));
        ca.save(); ca.globalAlpha = 0.25 * a; ca.fillStyle = dk ? '#000010' : '#1E4A4A'; n13_ell(ca, l.x + 1.5, l.y + 2, l.r * 0.8, l.r * 0.3); ca.fill(); ca.restore();
        n13_leafAt(ca, MAP, cols[l.c], l.x, l.y + Math.sin(tt * 1.4 + l.rot) * 0.8, l.r, l.rot, l.st ? Math.cos(l.y * 0.1) : 0.45, a); });
      // glitter on the pools in the moment
      glits.forEach(function (g2) { var k = (t - g2.t0) / 1.4, a = Math.sin(Math.PI * k); ca.fillStyle = dk ? 'rgba(230,236,255,' + a + ')' : 'rgba(255,250,225,' + a + ')'; n13_spark(ca, g2.x, g2.y, g2.r * (0.6 + 0.4 * a)); });
      // mist drifting low over the ravine floor
      for (i = 0; i < 4; i++) { var mx = ((tt * (4 + i) + i * 380) % (W + 700)) - 350, my = A.gTop + H * (0.0 + i * 0.03); n13_glow(ca, mistG, mx, my, (200 + i * 40) * S * (ph ? 1.5 : 1), 0.9, 0.1); }
      // the stone lantern: a soft flame by night (and a flare in the moment)
      var lf = (dk ? 0.85 : 0) + (fin ? n13_env(T, 0.3, 1, 6, 9) * (dk ? 0.6 : 0.5) : 0);
      if (lf > 0.01) { var fk = 0.85 + 0.1 * Math.sin(tt * 7.3) + 0.05 * Math.sin(tt * 13.1); ca.fillStyle = 'rgba(255,214,140,' + Math.min(1, lf * fk) + ')'; ca.fillRect(lan.wx - lan.ww, lan.wy - lan.wh, lan.ww * 2, lan.wh * 2);
        ca.save(); ca.globalCompositeOperation = 'lighter'; n13_glow(ca, lanG, lan.wx, lan.wy, lan.ww * 9 * (0.9 + 0.1 * fk), lf * 0.8 * fk); ca.restore(); }
      // falling leaves, tumbling as they come down (resting a moment where they land)
      falling.forEach(function (l) { var age = t - l.t0, a = Math.min(1, age * 2) * (l.lay ? Math.max(0, 1 - l.lay / 4) : 1), fl = l.lay ? 0.6 : Math.cos(age * l.sp + l.ph); n13_leafAt(cb, MAP, cols[l.c], l.x, l.y, l.r, l.rot, fl, a); });
      // the hanging sprays, swaying (hard in the gust)
      sprays.forEach(function (s, j) { var ang = (Math.sin(tt * 0.9 + s.ph) * 0.035 + Math.sin(tt * 2.3 + s.ph * 2) * 0.012) * f.a + g * (0.16 * Math.sin(tt * 9 + j) + 0.12);
        cb.save(); cb.translate(s.x, s.y); cb.rotate(ang); cb.fillStyle = dk ? '#140E14' : '#3E2C26'; cb.fill(s.tw); s.ps.forEach(function (p, k) { cb.fillStyle = cols[k]; cb.fill(p); }); cb.restore(); });
      // the whirl of leaves in the moment
      storm.forEach(function (s) { var age = t - s.t0, a = Math.min(1, age * 3) * Math.min(1, (5.2 - age) / 1.5), rr = s.rad * (0.4 + age * 0.8), e = n13_ease(age / 1.6), x = s.x0 + (s.cx - s.x0) * e + Math.cos(age * s.w + s.ph) * rr * e, y = s.y0 + H * 0.12 * Math.sin(Math.min(1, age / 1.6) * Math.PI) - s.up * Math.max(0, age - 0.8) * (0.6 + age * 0.2) + Math.sin(age * s.w + s.ph) * rr * 0.45 * e;
        n13_leafAt(cb, MAP, cols[s.c], x, y, s.r, s.ph + age * s.vr, Math.cos(age * 5 + s.ph), a); });
      stars.forEach(function (s) { var k = (t - s.t0) / 1.3; cb.strokeStyle = 'rgba(255,248,230,' + Math.sin(Math.PI * k) * 0.9 + ')'; cb.lineWidth = 1.5; cb.beginPath(); cb.moveTo(s.x - k * 160, s.y + k * 50); cb.lineTo(s.x - k * 160 + 44, s.y + k * 50 - 14); cb.stroke(); });
    },
    finish: function (t) { fin = {t0: t}; if (dk) stars.push({t0: t + 1, x: W * 0.62, y: H * 0.05}); }
  };
};

UIC.maples = {L: ['#8A3424', '#5A2018', 'rgba(255,252,247,0.86)', '#2E1E18', '#6E5A50', '#B8382A', '#B8382A', '#D2602E', '#FFFFFF'], D: ['#2A1A2E', '#140E20', 'rgba(24,18,36,0.8)', '#F4ECF0', '#BCAEB8', '#F08A6A', '#F08A6A', '#F6B07A', '#1C1018']};
