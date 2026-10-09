// batch n3 engines: greenhouse, pottery, campfire, aquarium, treehouse (Cozy Spots, New Theme Ideas)
function n3_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n3_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n3_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n3_ease((T - c) / (d - c)); }
var n3_gc = null;
function n3_ctx() { return n3_gc || (n3_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius 1, from colour rgba(...,a) to transparent: draw with n3_dot
function n3_rg(col, mid) { var g = n3_ctx().createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n3_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n3_path(pts) { var p = new Path2D(); pts.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; }
function n3_lin(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
// kawaii bits for the little scene critters
var n3_INK = '#3A2A33', n3_BLUSH = 'rgba(255,120,150,0.5)';
function n3_blinkAt(t, seed) { var u = (t * 0.31 + seed * 3.7) % 4.3; return u < 0.12 ? Math.abs(u - 0.06) / 0.06 : 1; }
function n3_eyes(c, x, y, gap, r, blink, happy) { c.fillStyle = n3_INK; c.strokeStyle = n3_INK;
  if (happy) { c.lineWidth = r * 0.8; c.lineCap = 'round'; c.beginPath(); c.arc(x - gap, y + r * 0.5, r, Math.PI * 1.15, Math.PI * 1.85); c.moveTo(x + gap + r * Math.cos(Math.PI * 1.15), y + r * 0.5 + r * Math.sin(Math.PI * 1.15)); c.arc(x + gap, y + r * 0.5, r, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); return; }
  if (blink < 0.25) { c.lineWidth = r * 0.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - gap - r, y); c.lineTo(x - gap + r, y); c.moveTo(x + gap - r, y); c.lineTo(x + gap + r, y); c.stroke(); return; }
  c.beginPath(); c.ellipse(x - gap, y, r, r * blink, 0, 0, 7); c.ellipse(x + gap, y, r, r * blink, 0, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - gap + r * 0.35, y - r * 0.35, r * 0.35, 0, 7); c.arc(x + gap + r * 0.35, y - r * 0.35, r * 0.35, 0, 7); c.fill(); }
function n3_cheeks(c, x, y, gap, r) { c.fillStyle = n3_BLUSH; c.beginPath(); c.ellipse(x - gap, y, r, r * 0.6, 0, 0, 7); c.ellipse(x + gap, y, r, r * 0.6, 0, 0, 7); c.fill(); }
function n3_smile(c, x, y, r, lw) { c.strokeStyle = n3_INK; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.arc(x, y - r * 0.4, r, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); }
function n3_face(c, x, y, r, blink, happy) { n3_eyes(c, x, y - r * 0.08, r * 0.32, r * 0.1, blink, happy); n3_cheeks(c, x, y + r * 0.16, r * 0.52, r * 0.13); n3_smile(c, x, y + r * 0.2, r * 0.13, Math.max(1, r * 0.06)); }
function n3_cspark(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }
function n3_butterfly(c, x, y, s, t, ph, col, col2) { var fl = 0.25 + 0.75 * Math.abs(Math.sin(t * 9 + ph)); c.fillStyle = col; c.beginPath(); c.ellipse(x - 4 * fl * s, y - 1.5 * s, 4.2 * fl * s, 5 * s, -0.3, 0, 7); c.ellipse(x + 4 * fl * s, y - 1.5 * s, 4.2 * fl * s, 5 * s, 0.3, 0, 7); c.fill(); c.fillStyle = col2 || col; c.beginPath(); c.ellipse(x - 3 * fl * s, y + 3 * s, 2.8 * fl * s, 3.2 * s, 0.4, 0, 7); c.ellipse(x + 3 * fl * s, y + 3 * s, 2.8 * fl * s, 3.2 * s, -0.4, 0, 7); c.fill(); c.fillStyle = '#4A3A4A'; c.fillRect(x - 0.7 * s, y - 4 * s, 1.4 * s, 8 * s); }

// ---------- Greenhouse: hanging baskets swing and slowly turn, beads of condensation gather and trickle down the glass, the misting
// nozzles puff, the corner monsteras sway; sun shafts and drifting pollen by day, rain on the roof and warm grow lamps at night.
// Moment: the rare night-blooming flower in the aisle opens its petals and glows, breathing out sparkles of pollen.
ENGINES.greenhouse = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, i;
  var glassBot = H * (ph ? 0.4 : 0.37);
  var mistG = n3_rg(dk ? 'rgba(200,235,228,0.42)' : 'rgba(255,255,255,0.75)', [0.45, dk ? 0.24 : 0.45]), lampG = n3_rg('rgba(255,196,120,0.6)', [0.3, 0.3]), bloomG = n3_rg(dk ? 'rgba(240,255,250,0.9)' : 'rgba(255,255,240,0.85)', [0.25, dk ? 0.45 : 0.4]), pollG = n3_rg('rgba(255,240,170,0.9)'), roomG = n3_rg('rgba(200,255,235,0.5)', [0.4, 0.18]);
  // condensation beads on the roof glass
  var beads = [];
  function bead(fresh) { var y = 8 + Math.pow(Math.random(), 0.8) * (glassBot - 20); return {x: 6 + Math.random() * (W - 12), y: y, r: 1 + Math.random() * 2.4 + (Math.random() < 0.18 ? 1.4 : 0), a: fresh ? 0 : 1, slide: false, v: 0, wob: Math.random() * 6}; }
  for (i = 0; i < (ph ? 46 : 110); i++) beads.push(bead(false));
  var trail = [], nextSlide = 1.2;
  var cBody = dk ? 'rgba(170,220,210,0.22)' : 'rgba(255,255,255,0.45)', cShade = dk ? 'rgba(0,10,10,0.3)' : 'rgba(60,110,90,0.16)', cHi = dk ? 'rgba(220,255,245,0.75)' : 'rgba(255,255,255,0.95)', cTrail = dk ? 'rgba(170,220,210,' : 'rgba(255,255,255,';
  // mist puffs
  var puffs = [], nextPuff = 1.5, nozK = 0;
  // rain (night)
  var rain = []; if (dk) for (i = 0; i < (ph ? 40 : 90); i++) rain.push({x: Math.random() * (W + 200), y: Math.random() * glassBot, v: 520 + Math.random() * 200, l: 10 + Math.random() * 10});
  var ticks = [];
  // sun shafts and motes (day)
  var shafts = [[0.5, 0.18, 0.06], [0.64, 0.12, 0.09], [0.78, 0.2, 0.05], [0.9, 0.1, 0.07]], motes = []; for (i = 0; i < (ph ? 14 : 34); i++) motes.push({u: Math.random(), v: Math.random(), ph: Math.random() * 6.28, s: 0.6 + Math.random()});
  // monstera paths in leaf space
  var mons = A.corners.map(function (c, k) { var pts = n3_monsteraPts(0, 0, c.len, 0, c.sp), veins = new Path2D(); veins.moveTo(c.len * 0.12, 0); veins.lineTo(c.len * 0.95, 0);
    for (var j = 0; j < 5; j++) { var u = 0.25 + j * 0.15, sx = c.len * u; veins.moveTo(sx, 0); veins.quadraticCurveTo(sx + c.len * 0.06, c.len * 0.14, sx + c.len * 0.03, c.len * 0.3 * Math.sin(Math.PI * (u + 0.05))); veins.moveTo(sx, 0); veins.quadraticCurveTo(sx + c.len * 0.06, -c.len * 0.14, sx + c.len * 0.03, -c.len * 0.3 * Math.sin(Math.PI * (u + 0.05))); }
    var half = []; pts.forEach(function (p) { if (p[1] <= 0.5) half.push(p); });
    return {c: c, p: n3_path(pts), half: n3_path(half), veins: veins, ph: k * 1.7}; });
  var monA = dk ? '#1B4A33' : '#2F8752', monB = dk ? '#2C6646' : '#4DAA66', monHi = dk ? 'rgba(120,200,150,0.18)' : 'rgba(190,240,190,0.35)', monV = dk ? 'rgba(140,210,160,0.35)' : 'rgba(225,255,215,0.6)';
  // the flower
  var F = A.flower, S = F.s, pollen = [];
  var petO = dk ? ['#E9C9B6', '#B88470'] : ['#F6D6C2', '#D9967A'], petI = dk ? ['#FFFFFF', '#DCEDE8'] : ['#FFFFFF', '#F1EEE6'];
  function petal(c, len, w) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, w, len, 0); c.quadraticCurveTo(len * 0.45, -w, 0, 0); c.fill(); }
  function flower(c, t) {
    var T = t - T0, o = n3_ease(n3_env(T, 0.1, 3.4, 16, 22)), axis = -1.2 + Math.sin(t * 0.6) * 0.04 * (1 - o), cx = F.x, cy = F.y - o * 6 * S;
    var glowA = (dk ? 0.85 : 0.5) * o + (dk ? 0.14 : 0) * (0.6 + 0.4 * Math.sin(t * 1.3));
    if (glowA > 0.01) { c.save(); c.globalCompositeOperation = dk ? 'lighter' : 'source-over'; n3_dot(c, bloomG, cx, cy, (40 + 70 * o) * S * (1 + 0.04 * Math.sin(t * 2)), glowA); if (dk && o > 0.02) n3_dot(c, roomG, cx, cy, 300 * S, 0.35 * o); c.restore(); }
    c.save(); c.translate(cx, cy);
    var sets = [[12, 40 * S, 4.6 * S, petO, 0.12], [14, 33 * S, 8.5 * S, petI, 0]];
    (o < 0.3 ? [1, 0] : [0, 1]).forEach(function (si) { var st = sets[si]; for (var k = 0; k < st[0]; k++) { var th = (k / st[0]) * Math.PI * 2 + st[4] + si * 0.2, rel = Math.atan2(Math.sin(th - axis), Math.cos(th - axis)), a = axis + rel * o * (si ? 1 : 1.02), ln = st[1] * (si ? 0.72 + 0.28 * o : 0.9 + 0.1 * o) * (1 + 0.05 * Math.sin(k * 2.3)), w = st[2] * (si ? 0.3 + 0.7 * o : 0.75 + 0.25 * o);
      c.save(); c.rotate(a); c.fillStyle = n3_lin(c, 0, 0, ln, 0, [[0, st[3][1]], [0.6, st[3][0]], [1, st[3][0]]]); petal(c, ln, w); c.restore(); } });
    if (o > 0.15) { var oc = (o - 0.15) / 0.85; c.globalAlpha = oc; c.fillStyle = dk ? '#F7F1D6' : '#FFF6D8'; c.beginPath(); c.arc(0, 0, 9 * S, 0, 7); c.fill();
      c.strokeStyle = '#F2D27A'; c.lineWidth = 1 * S; c.lineCap = 'round'; for (var k2 = 0; k2 < 22; k2++) { var a2 = k2 / 22 * 6.283 + 0.1, r2 = (10 + (k2 % 3) * 2) * S * oc; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a2 + 0.3) * r2 * 0.6, Math.sin(a2 + 0.3) * r2 * 0.6, Math.cos(a2) * r2, Math.sin(a2) * r2); c.stroke(); c.fillStyle = '#F5B83A'; c.beginPath(); c.arc(Math.cos(a2) * r2, Math.sin(a2) * r2, 1.3 * S, 0, 7); c.fill(); }
      c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.6 * S; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6 * S, -10 * S, 2 * S, -18 * S * oc); c.stroke(); c.fillStyle = '#FFFFFF'; n3_cspark(c, 2 * S, -18 * S * oc, 4 * S * oc); c.globalAlpha = 1; }
    else { c.fillStyle = petO[1]; c.globalAlpha = 1 - o / 0.15; c.save(); c.rotate(axis); c.beginPath(); c.ellipse(4 * S, 0, 7 * S, 3.4 * S, 0, 0, 7); c.fill(); c.restore(); c.globalAlpha = 1; }
    c.restore();
    return o;
  }
  // a pair of butterflies by day, two moths round the lamps by night
  var flyers = [{x0: W * 0.2, y0: H * 0.72, ph: 0, c: '#F7B84A', c2: '#F48A5A'}, {x0: W * 0.78, y0: H * 0.68, ph: 2.4, c: '#8CCBF2', c2: '#B8A2F0'}];
  return {
    step: function (dt, t, f) {
      nextSlide -= dt * f.s; if (nextSlide <= 0) { nextSlide = 1 + Math.random() * 1.8; var cand = beads.filter(function (d) { return !d.slide && d.r > 2.4 && d.a > 0.9; }); if (cand.length) cand[Math.floor(Math.random() * cand.length)].slide = true; }
      beads.forEach(function (d) {
        if (d.a < 1) d.a = Math.min(1, d.a + dt * 0.8);
        if (!d.slide) return;
        var sk = Math.sin(d.y * 0.07 + d.wob * 3), tg = (14 + d.r * 7) * (0.15 + 0.85 * (sk > 0 ? Math.sqrt(sk) : 0.05)); d.v += (tg - d.v) * Math.min(1, dt * 3);
        d.y += d.v * f.s * dt; d.x += Math.sin(t * 1.7 + d.wob + d.y * 0.05) * 3 * dt;
        if (Math.random() < dt * 7) trail.push({x: d.x + (Math.random() - 0.5) * 1.5, y: d.y - d.r, r: 0.5 + Math.random() * 1, t0: t});
        beads.forEach(function (o) { if (o !== d && !o.dead && !o.slide && Math.abs(o.x - d.x) < d.r + o.r && Math.abs(o.y - d.y) < d.r + o.r) { d.r = Math.min(5, Math.sqrt(d.r * d.r + o.r * o.r)); o.dead = true; } });
        if (d.y > glassBot + 30) d.dead = true;
      });
      var n0 = beads.length; beads = beads.filter(function (d) { return !d.dead; }); for (i = beads.length; i < n0; i++) beads.push(bead(true));
      trail = trail.filter(function (p) { return t - p.t0 < 7; });
      nextPuff -= dt * f.s; if (nextPuff <= 0 && A.noz.length) { nextPuff = 2.2 + Math.random() * 2.5; var nz = A.noz[nozK++ % A.noz.length]; for (var k = 0; k < 7; k++) puffs.push({x: nz.x, y: nz.y, vx: (Math.random() - 0.5) * 34, vy: 8 + Math.random() * 22, r0: 3 + Math.random() * 3, t0: t + k * 0.06, s: nz.s}); }
      puffs = puffs.filter(function (p) { return t - p.t0 < 3.6; });
      rain.forEach(function (r) { r.y += r.v * dt; r.x -= r.v * 0.25 * dt; if (r.y > glassBot) { if (Math.random() < 0.5) ticks.push({x: r.x, y: 6 + Math.random() * glassBot * 0.8, t0: t}); r.y = -20; r.x = Math.random() * (W + 200); } });
      ticks = ticks.filter(function (k) { return t - k.t0 < 0.5; });
      var T = t - T0; if (T > 0.8 && T < 15 && Math.random() < dt * 9) { var a = Math.random() * 6.28; pollen.push({x: F.x + Math.cos(a) * 10 * S, y: F.y - 6 * S + Math.sin(a) * 8 * S, vx: (Math.random() - 0.5) * 24, vy: -18 - Math.random() * 26, t0: t, l: 2.5 + Math.random() * 2}); }
      pollen = pollen.filter(function (p) { return t - p.t0 < p.l; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s;
      // sun shafts and motes (behind the front plants)
      if (!dk) { ca.save(); shafts.forEach(function (s, k) { var x = W * s[0], w = W * s[2], a = 0.11 + 0.05 * Math.sin(tt * 0.3 + k * 1.9), dx = -H * 0.42; var g = ca.createLinearGradient(0, 0, 0, H * 0.85); g.addColorStop(0, 'rgba(255,250,215,' + a + ')'); g.addColorStop(1, 'rgba(255,250,215,0)'); ca.fillStyle = g; ca.beginPath(); ca.moveTo(x, -10); ca.lineTo(x + w, -10); ca.lineTo(x + w + dx, H * 0.85); ca.lineTo(x + dx, H * 0.85); ca.fill(); });
        ca.fillStyle = 'rgba(255,248,210,0.8)'; motes.forEach(function (m) { var k = Math.floor(m.u * shafts.length), s = shafts[k], yy = ((m.v + tt * 0.012 * m.s) % 1) * H * 0.75, xx = W * s[0] + W * s[2] * ((m.u * shafts.length) % 1) - H * 0.42 * (yy / (H * 0.85)) + Math.sin(tt * 0.5 + m.ph) * 6; ca.globalAlpha = 0.4 + 0.4 * Math.sin(tt + m.ph); ca.beginPath(); ca.arc(xx, yy, 1.1 * m.s, 0, 7); ca.fill(); }); ca.restore(); }
      // rain on the roof glass
      if (dk) { ca.strokeStyle = 'rgba(170,215,210,0.22)'; ca.lineWidth = 1; ca.beginPath(); rain.forEach(function (r) { ca.moveTo(r.x, r.y); ca.lineTo(r.x + r.l * 0.25, r.y - r.l); }); ca.stroke();
        ticks.forEach(function (k) { var u = (t - k.t0) / 0.5; ca.strokeStyle = 'rgba(190,230,225,' + (0.5 * (1 - u)) + ')'; ca.beginPath(); ca.ellipse(k.x, k.y, 2 + u * 7, 1 + u * 2, 0, 0, 7); ca.stroke(); }); }
      // condensation
      ca.fillStyle = cTrail + '0.3)'; trail.forEach(function (p) { ca.globalAlpha = 1 - (t - p.t0) / 7; ca.beginPath(); ca.arc(p.x, p.y, p.r, 0, 7); ca.fill(); }); ca.globalAlpha = 1;
      beads.forEach(function (d) { var r = d.r, x = d.x, y = d.y, st = d.slide ? Math.min(1.7, 1 + d.v / 40) : 1; ca.globalAlpha = d.a * (y > glassBot ? Math.max(0, 1 - (y - glassBot) / 30) : 1);
        ca.fillStyle = cShade; ca.beginPath(); ca.ellipse(x + r * 0.15, y + r * 0.4, r * 0.75, r * 0.4, 0, 0, 7); ca.fill();
        ca.fillStyle = cBody; ca.beginPath(); ca.arc(x, y, r, 0, 7); ca.fill(); if (d.slide) { ca.beginPath(); ca.moveTo(x - r * 0.6, y - r * 0.75); ca.lineTo(x, y - r * 1.9 * st); ca.lineTo(x + r * 0.6, y - r * 0.75); ca.fill(); }
        ca.fillStyle = cHi; ca.beginPath(); ca.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); ca.fill(); }); ca.globalAlpha = 1;
      // grow lamps: cord, shade, and (at night) their warm cones
      A.lamps.forEach(function (lp, k) { var s = lp.s, sw = Math.sin(tt * 0.5 + k) * 0.02, x = lp.x + Math.sin(sw) * (lp.y - lp.top), y = lp.y;
        if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; var fl = 0.92 + 0.08 * Math.sin(tt * 3 + k); var g = cb.createLinearGradient(0, y, 0, y + 230 * s); g.addColorStop(0, 'rgba(255,190,110,' + 0.22 * fl + ')'); g.addColorStop(1, 'rgba(255,170,90,0)'); cb.fillStyle = g; cb.beginPath(); cb.moveTo(x - 9 * s, y + 6 * s); cb.lineTo(x + 9 * s, y + 6 * s); cb.lineTo(x + 70 * s, y + 230 * s); cb.lineTo(x - 70 * s, y + 230 * s); cb.fill(); n3_dot(cb, lampG, x, y + 8 * s, 46 * s, 0.9 * fl); cb.restore(); }
        cb.strokeStyle = dk ? '#5E6E68' : '#7A847E'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(lp.x, lp.top); cb.lineTo(x, y - 6 * s); cb.stroke();
        cb.fillStyle = dk ? '#FFE2A8' : '#FFF8E6'; cb.beginPath(); cb.arc(x, y + 6 * s, 4.2 * s, 0, 7); cb.fill();
        cb.fillStyle = n3_lin(cb, x - 12 * s, 0, x + 12 * s, 0, dk ? [[0, '#3E5E50'], [1, '#22392F']] : [[0, '#5FA27A'], [1, '#2F6E4E']]); cb.beginPath(); cb.moveTo(x - 13 * s, y + 6 * s); cb.quadraticCurveTo(x - 12 * s, y - 8 * s, x, y - 8 * s); cb.quadraticCurveTo(x + 12 * s, y - 8 * s, x + 13 * s, y + 6 * s); cb.closePath(); cb.fill(); });
      // hanging baskets: swing on their chains and turn slowly, vines trailing
      A.baskets.forEach(function (b) { var s = b.s, sw = Math.sin(tt * 0.55 + b.k * 1.3) * 0.045 + Math.sin(tt * 1.15 + b.k) * 0.012, bx = b.x + Math.sin(sw) * b.len, by = b.y + Math.cos(sw) * b.len, turn = tt * 0.16 + b.k * 1.1;
        cb.strokeStyle = dk ? 'rgba(150,170,160,0.7)' : 'rgba(110,116,110,0.85)'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(b.x, b.y); cb.lineTo(bx - 14 * s, by); cb.moveTo(b.x, b.y); cb.lineTo(bx + 14 * s, by); cb.moveTo(b.x, b.y); cb.lineTo(bx + Math.cos(turn) * 4 * s, by - 2 * s); cb.stroke();
        var strands = []; for (var j = 0; j < 8; j++) { var th = j / 8 * 6.283 + turn, z = Math.sin(th); strands.push({x: Math.cos(th) * 12 * s, z: z, l: (22 + ((j * 13 + b.k * 7) % 26)) * s, j: j}); }
        function vine(st) { var n = 7, px = bx + st.x, py = by + 4 * s, dark = st.z < 0; cb.strokeStyle = dark ? (dk ? '#24493A' : '#3C7E52') : (dk ? '#2F5E46' : '#4E9E5C'); cb.lineWidth = 1.2 * s; cb.beginPath(); cb.moveTo(px, py); var pts = [];
          for (var q = 1; q <= n; q++) { var u = q / n, xx = px + Math.sin(q * 0.7 + tt * 0.9 + st.j) * 2.4 * s * u + Math.sin(sw) * st.l * u * 0.5, yy = py + st.l * u; cb.lineTo(xx, yy); pts.push([xx, yy]); } cb.stroke();
          cb.fillStyle = dark ? (dk ? '#2A5240' : '#3F8A55') : (dk ? '#3A7050' : '#6CBB6E'); pts.forEach(function (p, q) { if (q % 1) return; cb.beginPath(); cb.ellipse(p[0] + (q % 2 ? 2.5 : -2.5) * s, p[1], 2.6 * s, 1.6 * s, q % 2 ? 0.5 : -0.5, 0, 7); cb.fill(); }); }
        strands.filter(function (q) { return q.z < 0; }).forEach(vine);
        cb.fillStyle = n3_lin(cb, bx - 15 * s, 0, bx + 15 * s, 0, dk ? [[0, '#9A6048'], [1, '#5E3626']] : [[0, '#F0A276'], [1, '#B8603E']]); cb.beginPath(); cb.moveTo(bx - 15 * s, by); cb.lineTo(bx + 15 * s, by); cb.quadraticCurveTo(bx + 13 * s, by + 13 * s, bx, by + 14 * s); cb.quadraticCurveTo(bx - 13 * s, by + 13 * s, bx - 15 * s, by); cb.fill();
        cb.fillStyle = dk ? '#B0745A' : '#F6B58E'; cb.fillRect(bx - 16 * s, by - 1.5 * s, 32 * s, 3.5 * s);
        cb.fillStyle = dk ? '#2C5A42' : '#4FA060'; cb.beginPath(); cb.ellipse(bx, by - 2 * s, 14 * s, 6 * s, 0, Math.PI, 0); cb.fill(); cb.fillStyle = dk ? '#3E7452' : '#7CC67A'; for (j = 0; j < 5; j++) { cb.beginPath(); cb.ellipse(bx - 10 * s + j * 5 * s + Math.cos(turn + j) * 1.5 * s, by - 4 * s - (j % 2) * 2 * s, 3.4 * s, 2 * s, -0.4 + j * 0.2, 0, 7); cb.fill(); }
        if (b.k % 2 === 0) { cb.fillStyle = dk ? '#D07A98' : '#FF8FB0'; for (j = 0; j < 4; j++) { var fa = turn * 1 + j * 1.6; if (Math.sin(fa) < -0.2) continue; cb.beginPath(); cb.arc(bx + Math.cos(fa) * 9 * s, by - 5 * s + j % 2 * 2 * s, 2.1 * s, 0, 7); cb.fill(); } }
        strands.filter(function (q) { return q.z >= 0; }).forEach(vine); });
      // mist
      puffs.forEach(function (p) { var u = (t - p.t0) / 3.6; if (u < 0) return; var x = p.x + p.vx * u * 2.2, y = p.y + p.vy * u * 2.4 + u * u * 10; n3_dot(cb, mistG, x, y, (p.r0 + u * 26) * p.s, Math.sin(Math.PI * Math.min(1, u * 1.15)) * 0.9); });
      A.noz.forEach(function (nz) { cb.fillStyle = dk ? '#A88A4A' : '#C9A050'; cb.fillRect(nz.x - 1.5, nz.y - 3, 3, 4); cb.beginPath(); cb.moveTo(nz.x - 3, nz.y + 1); cb.lineTo(nz.x + 3, nz.y + 1); cb.lineTo(nz.x, nz.y + 4); cb.fill(); });
      // butterflies (day) or moths round the lamps (night)
      flyers.forEach(function (b, k) { var x, y; if (dk) { var lp = A.lamps[k % A.lamps.length]; x = lp.x + Math.cos(tt * 1.3 + b.ph) * 30 * lp.s; y = lp.y + 20 * lp.s + Math.sin(tt * 2.1 + b.ph) * 14 * lp.s; n3_butterfly(cb, x, y, (ph ? 0.7 : 0.9), tt * 1.4, b.ph, 'rgba(240,232,210,0.85)', 'rgba(220,210,190,0.8)'); }
        else { x = b.x0 + Math.sin(tt * 0.21 + b.ph) * W * 0.12 + Math.sin(tt * 0.9 + b.ph) * 14; y = b.y0 + Math.sin(tt * 0.43 + b.ph * 2) * 40 + Math.sin(tt * 1.7) * 6; n3_butterfly(cb, x, y, ph ? 0.9 : 1.2, tt, b.ph, b.c, b.c2); } });
      // the corner monsteras, swaying
      mons.forEach(function (M, k) { var c = M.c, a = (c.ang + Math.sin(tt * 0.45 + M.ph) * 2.4 + Math.sin(tt * 1.25 + M.ph * 2) * 0.7) * Math.PI / 180;
        cb.save(); cb.translate(c.x, c.y); cb.rotate(a); cb.fillStyle = n3_lin(cb, 0, 0, c.len, 0, [[0, monA], [1, monB]]); cb.fill(M.p); cb.fillStyle = monHi; cb.fill(M.half); cb.strokeStyle = monV; cb.lineWidth = Math.max(1.2, c.len / 90); cb.lineCap = 'round'; cb.stroke(M.veins); cb.restore(); });
      // the flower and its pollen
      flower(cb, t);
      cb.save(); if (dk) cb.globalCompositeOperation = 'lighter'; pollen.forEach(function (p) { var u = (t - p.t0) / p.l, x = p.x + p.vx * u * p.l + Math.sin(u * 9 + p.l) * 6, y = p.y + p.vy * u * p.l; n3_dot(cb, pollG, x, y, 5 * S, Math.sin(Math.PI * u) * 0.9); cb.fillStyle = 'rgba(255,250,220,' + Math.sin(Math.PI * u) + ')'; cb.beginPath(); cb.arc(x, y, 1.1 * S, 0, 7); cb.fill(); }); cb.restore();
    },
    finish: function (t) { var T = t - T0; if (T > 3.4 && T < 16) T0 = t - 3.4; else if (!(T >= 0 && T <= 3.4)) T0 = t; }
  };
};
UIC.greenhouse = {L: ['#3E7A5C', '#28553F', 'rgba(255,255,252,0.86)', '#16291F', '#56685C', '#2F7D52', '#2F7D52', '#4E9A62', '#FFFFFF'], D: ['#1C3A36', '#0E201E', 'rgba(14,32,30,0.80)', '#E8F4EF', '#A2BFB4', '#F2C27A', '#F2C27A', '#F6D69E', '#14241F']};

// ---------- Pottery Studio: the wheel turns while a lump of clay rises and settles under wet throwing lines, dust motes drift in the
// window's sunbeam, the kiln door glows (and at night lights the whole room, flickering on the shelves), test tiles sway, the cat dozes.
// Moment: the lump is pulled up into a tall vase, then a glaze sweeps up it, shifting from teal to blue to violet to rose.
ENGINES.pottery = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, i, Wh = A.wheel, ws = Wh.s, K = A.kiln, spin = 0;
  var glowK = n3_rg('rgba(255,140,60,0.9)', [0.35, 0.4]), roomK = n3_rg('rgba(255,130,60,0.5)', [0.5, 0.18]), steamG = n3_rg(dk ? 'rgba(230,220,210,0.35)' : 'rgba(255,255,255,0.7)'), sparkG = n3_rg('rgba(255,250,220,0.9)');
  var motes = []; for (i = 0; i < (ph ? 16 : 36); i++) motes.push({u: Math.random(), v: Math.random(), ph: Math.random() * 6.28, s: 0.6 + Math.random()});
  var steam = [], sparks = [];
  var clayC = dk ? ['#A88A7C', '#6E5246', '#C9AA9A'] : ['#C8A493', '#8E6A5C', '#E6CBBE'];
  var GLZ = ['#2FA7A0', '#3F63C8', '#8E5BC8', '#D8708E', '#E8A23A'];
  function glazeAt(k) { k = ((k % GLZ.length) + GLZ.length) % GLZ.length; var a = Math.floor(k), f = k - a; return mix(GLZ[a], GLZ[(a + 1) % GLZ.length], n3_ease(f)); }
  // clay profile (half widths, in units of ws) at height fraction u for the lump (rising/settling) and the finished vase
  function lumpR(u, rise) { return (26 - rise * 6) * Math.pow(Math.max(0, 1 - Math.pow(u, 2.2)), 0.55) + 4 * (1 - u); }
  function vaseR(u) { return u < 0.62 ? 15 + 17 * Math.sin(Math.PI * (u / 0.62) * 0.92) * (0.6 + 0.4 * (1 - u)) : 11 + 4 * Math.pow((u - 0.62) / 0.38, 1.6) + (u > 0.94 ? 3 : 0); }
  function drawPot(c, t) {
    var T = t - T0, form = n3_ease(n3_env(T, 0.15, 2.6, 15, 17.5)), rise = 0.5 + 0.5 * Math.sin(t * 0.55), lumpH = 30 + rise * 16, hgt = (lumpH + (124 - lumpH) * form) * ws, x = Wh.x, base = Wh.y - 5 * ws;
    var n = 24, L = [], R = [];
    for (var k = 0; k <= n; k++) { var u = k / n, r = (lumpR(u, rise) * (1 - form) + vaseR(u) * form) * ws; L.push([x - r, base - u * hgt]); R.push([x + r, base - u * hgt]); }
    var glazeU = n3_ease((T - 2.7) / 1.6) * (T < 17.5 ? 1 : 0), glazeA = n3_env(T, 2.7, 3.2, 15, 17), sh = t * 0.35;
    var body = new Path2D(); body.moveTo(L[0][0], L[0][1]); for (k = 1; k <= n; k++) body.lineTo(L[k][0], L[k][1]); body.quadraticCurveTo(x, R[n][1] - 4 * ws * (form > 0.5 ? 0 : 1), R[n][0], R[n][1]); for (k = n - 1; k >= 0; k--) body.lineTo(R[k][0], R[k][1]); body.closePath();
    var wl = Math.max(30 * ws, R[Math.round(n * 0.3)][0] - x) * 1.1;
    c.fillStyle = n3_lin(c, x - wl, 0, x + wl, 0, [[0, clayC[1]], [0.32, clayC[2]], [0.62, clayC[0]], [1, clayC[1]]]); c.fill(body);
    // glaze sweeping up from the foot, colours flowing as it climbs
    if (glazeA > 0.01) { c.save(); c.clip(body); var top = base - hgt * glazeU - 6 * ws; c.globalAlpha = glazeA;
      var g = c.createLinearGradient(0, base, 0, base - hgt); g.addColorStop(0, glazeAt(sh)); g.addColorStop(0.5, glazeAt(sh + 1)); g.addColorStop(1, glazeAt(sh + 2)); c.fillStyle = g;
      c.beginPath(); c.moveTo(x - wl * 2, base + 4); c.lineTo(x - wl * 2, top); for (var q = 0; q <= 16; q++) { var xx = x - wl * 2 + q / 16 * wl * 4; c.lineTo(xx, top + Math.sin(q * 1.9 + t * 3) * 3 * ws + (q % 3 === 0 ? 5 * ws : 0)); } c.lineTo(x + wl * 2, base + 4); c.fill();
      c.fillStyle = n3_lin(c, x - wl, 0, x + wl, 0, [[0, 'rgba(0,0,0,0.25)'], [0.3, 'rgba(255,255,255,0.35)'], [0.42, 'rgba(255,255,255,0)'], [0.85, 'rgba(0,0,0,0.12)'], [1, 'rgba(0,0,0,0.3)']]); c.fillRect(x - wl * 2, top - 10, wl * 4, base - top + 14); c.restore(); }
    // throwing lines turning with the wheel
    c.save(); c.clip(body); c.strokeStyle = form > 0.5 && glazeA > 0.5 ? 'rgba(255,255,255,0.18)' : (dk ? 'rgba(60,40,34,0.35)' : 'rgba(110,76,64,0.32)'); c.lineWidth = 1.2 * ws;
    for (var j = 1; j < 9; j++) { var uu = (j / 9 + (spin * 0.02) % (1 / 9)), kk = Math.min(n, Math.round(uu * n)), rr = R[kk][0] - x, yy = base - uu * hgt; c.beginPath(); c.ellipse(x, yy, rr, rr * 0.18, 0, 0.15, Math.PI - 0.15); c.stroke(); }
    c.restore();
    // the opening at the top once it is a vase
    if (form > 0.3) { var tr = R[n][0] - x; c.fillStyle = 'rgba(60,30,24,' + (0.8 * form) + ')'; c.beginPath(); c.ellipse(x, R[n][1], tr * 0.85, tr * 0.24, 0, 0, 7); c.fill(); }
    // wet sheen highlight
    c.fillStyle = 'rgba(255,255,255,' + (dk ? 0.12 : 0.22) + ')'; c.beginPath(); c.ellipse(x - wl * 0.45, base - hgt * 0.45, 3 * ws, hgt * 0.28, 0, 0, 7); c.fill();
    return {top: base - hgt, done: form > 0.98 && glazeU > 0.98};
  }
  // the cat on the sill
  var Cs = A.sill;
  function cat(c, t, happy) { var s = Cs.s, x = Cs.x, y = Cs.y, f = dk ? ['#E8B07A', '#C88A58'] : ['#F2B880', '#D9925A'], sleep = dk || Math.sin(t * 0.07) > 0.2, tail = Math.sin(t * 1.4) * (sleep ? 0.2 : 0.6);
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = f[0]; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-14, -4); c.quadraticCurveTo(-24, -2 + tail * 4, -22 - tail * 3, 8 + tail * 3); c.stroke();
    c.fillStyle = f[0]; c.beginPath(); c.ellipse(-2, -8, 15, 8.5, 0, 0, 7); c.fill(); c.fillStyle = f[1]; c.beginPath(); c.ellipse(-6, -13, 6, 2.6, 0.2, 0, 7); c.ellipse(-13, -9, 2.6, 3.6, 0.2, 0, 7); c.fill();
    c.save(); c.translate(11, -14); c.rotate(Math.sin(t * 0.5) * 0.05); var ear = Math.sin(t * 3.1) > 0.97 ? 0.25 : 0;
    c.fillStyle = f[0]; c.beginPath(); c.moveTo(-8, -2); c.lineTo(-7, -12 + ear * 4); c.lineTo(-1.5, -7); c.moveTo(1.5, -7); c.lineTo(7, -12); c.lineTo(8, -2); c.fill();
    c.fillStyle = '#FFB3C6'; c.beginPath(); c.moveTo(-6, -5); c.lineTo(-6, -9.5); c.lineTo(-3.5, -6.5); c.moveTo(6, -5); c.lineTo(6, -9.5); c.lineTo(3.5, -6.5); c.fill();
    c.fillStyle = f[0]; c.beginPath(); c.ellipse(0, 0, 9.5, 8, 0, 0, 7); c.fill(); c.fillStyle = f[1]; c.beginPath(); c.moveTo(-2, -7.6); c.lineTo(0, -4); c.lineTo(2, -7.6); c.fill();
    if (sleep && !happy) { c.strokeStyle = n3_INK; c.lineWidth = 1.1; c.beginPath(); c.arc(-3.4, -0.4, 1.8, 0.2, Math.PI - 0.2); c.moveTo(5.2, -0.2); c.arc(3.4, -0.4, 1.8, 0.2, Math.PI - 0.2); c.stroke(); }
    else n3_eyes(c, 0, -0.8, 3.4, 1.4, happy ? 1 : n3_blinkAt(t, 3), happy);
    c.fillStyle = '#F28A9A'; c.beginPath(); c.moveTo(-1, 1.8); c.lineTo(1, 1.8); c.lineTo(0, 3); c.fill(); n3_cheeks(c, 0, 3, 5.2, 1.7); c.restore();
    if (sleep && !happy) { var z = (t * 0.35) % 1; c.fillStyle = dk ? 'rgba(255,240,220,' + Math.sin(z * Math.PI) * 0.8 + ')' : 'rgba(120,90,80,' + Math.sin(z * Math.PI) * 0.7 + ')'; c.font = '700 ' + (8 + z * 4) + 'px sans-serif'; c.fillText('z', 18 + z * 8, -24 - z * 12); }
    c.restore(); }
  var tl = A.tiles, tileCols = ['#3FA6A0', '#4A68C0', '#E5B24A', '#D8708E', '#A8D2BC', '#8E5BC8', '#E07A4A', '#5FAFC2', '#C9A0DC', '#7FBF6A'];
  return {
    step: function (dt, t, f) {
      var T = t - T0; spin += dt * f.s * (6 + (T > 0 && T < 4 ? 8 * n3_env(T, 0, 0.5, 3, 4) : 0));
      if (Math.random() < dt * 3) steam.push({t0: t, x: (Math.random() - 0.5) * 6, l: 2.6 + Math.random()});
      steam = steam.filter(function (s) { return t - s.t0 < s.l; });
      if (T > 4 && T < 5.2 && Math.random() < dt * 30) { var a = Math.random() * 6.28; sparks.push({t0: t, x: Wh.x + Math.cos(a) * 50 * ws, y: Wh.y - 70 * ws + Math.sin(a) * 60 * ws, r: 3 + Math.random() * 4}); }
      sparks = sparks.filter(function (s) { return t - s.t0 < 1.4; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, fk = flick(tt * 0.7, 1.3), T = t - T0;
      // sunbeam from the window across the floor, with motes (day); the kiln's warm light filling the room (night)
      var Wn = A.win;
      if (!dk) { var dx = (H * 0.78 - Wn.y1) * 0.55, a = 0.26 + 0.05 * Math.sin(tt * 0.25), g = ca.createLinearGradient(Wn.x0, Wn.y0, Wn.x0 + dx, H * 0.95); g.addColorStop(0, 'rgba(255,246,214,' + a + ')'); g.addColorStop(1, 'rgba(255,246,214,0)');
        ca.fillStyle = g; ca.beginPath(); ca.moveTo(Wn.x0, Wn.y0); ca.lineTo(Wn.x1, Wn.y0); ca.lineTo(Wn.x1 + dx * 1.8, H * 0.98); ca.lineTo(Wn.x0 + dx * 1.2, H * 0.98); ca.fill();
        ca.fillStyle = 'rgba(255,250,225,0.9)'; motes.forEach(function (m) { var yy = Wn.y0 + ((m.v + tt * 0.01 * m.s) % 1) * (H * 0.9 - Wn.y0), fr = (yy - Wn.y0) / (H * 0.98 - Wn.y0), xx = Wn.x0 + (Wn.x1 - Wn.x0) * m.u + dx * (1.2 + 0.6 * m.u) * fr + Math.sin(tt * 0.4 + m.ph) * 8; ca.globalAlpha = 0.35 + 0.4 * Math.sin(tt * 0.9 + m.ph); ca.beginPath(); ca.arc(xx, yy, 1.2 * m.s, 0, 7); ca.fill(); }); ca.globalAlpha = 1; }
      else { ca.save(); ca.globalCompositeOperation = 'lighter'; n3_dot(ca, roomK, K.cx, K.y1 - (K.y1 - K.top) * 0.4, W * (ph ? 1.1 : 0.85), 0.6 + 0.16 * fk); ca.restore();
        // flicker catching the right side of each pot on the shelves
        ca.fillStyle = 'rgba(255,170,90,' + (0.18 + 0.2 * fk) + ')'; A.pots.forEach(function (p) { ca.beginPath(); ca.ellipse(p.x + p.w * 0.3, p.y, p.w * 0.1, p.h * 0.32, 0, 0, 7); ca.fill(); }); }
      // glaze test tiles swaying on their string
      cb.strokeStyle = dk ? 'rgba(200,170,150,0.6)' : 'rgba(120,90,70,0.8)'; cb.lineWidth = 1; cb.beginPath(); cb.moveTo(tl.a, tl.y); cb.quadraticCurveTo((tl.a + tl.b) / 2, tl.y + tl.sag * 2, tl.b, tl.y); cb.stroke();
      for (var q = 1; q < tl.n; q++) { var u = q / tl.n, px = tl.a + (tl.b - tl.a) * u, py = tl.y + tl.sag * 4 * u * (1 - u), sw = Math.sin(tt * 1.1 + q * 0.9) * 0.12, ts = ph ? 0.75 : 1;
        cb.save(); cb.translate(px, py); cb.rotate(sw); cb.fillStyle = dk ? '#C8B0A0' : '#F2E2D2'; cb.fillRect(-6 * ts, 2, 12 * ts, 15 * ts); cb.fillStyle = mix(tileCols[q % tileCols.length], dk ? '#201418' : '#FFFFFF', dk ? 0.25 : 0); cb.fillRect(-6 * ts, 2, 12 * ts, 9 * ts); cb.fillStyle = 'rgba(255,255,255,0.35)'; cb.fillRect(-4.5 * ts, 3.5, 2 * ts, 6 * ts); cb.restore(); }
      // pendant lamps under the beam
      A.lamps.forEach(function (l, k) { var x = l[0] + Math.sin(tt * 0.4 + k) * 1.5, y = l[1] + (ph ? 30 : 46), s = ph ? 0.75 : 1; cb.strokeStyle = dk ? '#7A6458' : '#6A5040'; cb.beginPath(); cb.moveTo(l[0], l[1]); cb.lineTo(x, y - 10 * s); cb.stroke();
        if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; n3_dot(cb, glowK, x, y + 4 * s, 34 * s, 0.35); cb.restore(); }
        cb.fillStyle = dk ? '#FFD9A0' : '#FFF6E0'; cb.beginPath(); cb.arc(x, y + 2 * s, 4.5 * s, 0, 7); cb.fill(); cb.fillStyle = n3_lin(cb, x - 15 * s, 0, x + 15 * s, 0, dk ? [[0, '#3E7C78'], [1, '#24504E']] : [[0, '#6CC2B6'], [1, '#3A8C86']]); cb.beginPath(); cb.moveTo(x - 16 * s, y + 3 * s); cb.quadraticCurveTo(x - 14 * s, y - 12 * s, x, y - 12 * s); cb.quadraticCurveTo(x + 14 * s, y - 12 * s, x + 16 * s, y + 3 * s); cb.closePath(); cb.fill(); });
      // the kiln door: glowing seam and peephole
      cb.save(); cb.globalCompositeOperation = 'lighter'; var kg = (dk ? 0.75 : 0.45) * (0.7 + 0.3 * fk);
      n3_dot(cb, glowK, K.peep[0], K.peep[1], (ph ? 22 : 34), kg); cb.strokeStyle = 'rgba(255,150,70,' + (kg * 0.7) + ')'; cb.lineWidth = 2; cb.beginPath(); K.door.forEach(function (p, k) { if (k) cb.lineTo(p[0], p[1]); else cb.moveTo(p[0], p[1]); }); cb.stroke(); cb.restore();
      cb.fillStyle = 'rgba(255,' + Math.round(170 + 60 * fk) + ',90,1)'; cb.beginPath(); cb.arc(K.peep[0], K.peep[1], ph ? 3 : 4.5, 0, 7); cb.fill();
      // the firebox slot at the foot of the door, and its light pooling on the floor
      var dd = K.door, fx0 = dd[0][0] + 6, fx1 = dd[dd.length - 1][0] - 6, fyb = dd[0][1] - (ph ? 10 : 16), fh = ph ? 6 : 9;
      cb.fillStyle = n3_lin(cb, 0, fyb - fh, 0, fyb, [[0, 'rgba(255,' + Math.round(200 + 40 * fk) + ',120,1)'], [1, 'rgba(255,110,40,1)']]); cb.fillRect(fx0, fyb - fh, fx1 - fx0, fh);
      cb.fillStyle = 'rgba(40,20,16,0.6)'; for (var gx = fx0 + 6; gx < fx1 - 3; gx += ph ? 7 : 10) cb.fillRect(gx, fyb - fh, 2, fh);
      cb.save(); cb.globalCompositeOperation = 'lighter'; cb.save(); cb.translate(K.cx, K.y1 + (ph ? 8 : 14)); cb.scale(1, 0.22); n3_dot(cb, glowK, 0, 0, (K.x1 - K.x0) * 1.3, (dk ? 0.6 : 0.25) * (0.75 + 0.25 * fk)); cb.restore(); n3_dot(cb, glowK, (fx0 + fx1) / 2, fyb - fh / 2, (fx1 - fx0) * 0.8, (dk ? 0.5 : 0.25) * fk); cb.restore();
      // heat shimmer over the kiln top
      cb.strokeStyle = dk ? 'rgba(255,190,140,0.12)' : 'rgba(255,255,255,0.3)'; cb.lineWidth = 1.5; for (var hs = 0; hs < 3; hs++) { var hx = K.cx - 20 + hs * 20, hy = K.top - 8 - ((tt * 14 + hs * 13) % 36); cb.beginPath(); cb.moveTo(hx, hy); cb.quadraticCurveTo(hx + 6, hy - 6, hx, hy - 12); cb.quadraticCurveTo(hx - 6, hy - 18, hx, hy - 24); cb.stroke(); }
      // mug steam
      var M = A.mug; steam.forEach(function (s) { var u = (t - s.t0) / s.l; n3_dot(cb, steamG, M[0] + s.x + Math.sin(u * 6 + s.l) * 4 * M[2], M[1] - u * 34 * M[2], (3 + u * 7) * M[2], Math.sin(Math.PI * u) * 0.8); });
      // the wheel: splash pan, turning head, clay, pan front lip
      var x = Wh.x, y = Wh.y, s = ws, pan = Wh.pan;
      cb.fillStyle = mix(pan, '#000000', 0.25); cb.beginPath(); cb.ellipse(x, y, 74 * s, 19 * s, 0, Math.PI, 0); cb.lineTo(x + 74 * s, y + 16 * s); cb.ellipse(x, y + 16 * s, 74 * s, 19 * s, 0, 0, Math.PI); cb.closePath(); cb.fill();
      cb.fillStyle = dk ? '#2A2428' : '#5A5058'; cb.beginPath(); cb.ellipse(x, y, 66 * s, 15 * s, 0, 0, 7); cb.fill();
      cb.fillStyle = dk ? 'rgba(160,130,120,0.3)' : 'rgba(170,140,125,0.55)'; cb.beginPath(); cb.ellipse(x, y + 2 * s, 60 * s, 12 * s, 0, 0, 7); cb.fill();
      cb.fillStyle = dk ? '#6E7680' : '#B8C0C8'; cb.beginPath(); cb.ellipse(x, y - 4 * s, 44 * s, 11 * s, 0, 0, 7); cb.fill(); cb.fillStyle = dk ? '#545C66' : '#949CA6'; cb.fillRect(x - 44 * s, y - 4 * s, 88 * s, 3 * s);
      cb.strokeStyle = dk ? 'rgba(30,30,40,0.5)' : 'rgba(80,86,96,0.5)'; cb.lineWidth = 1.2; for (var k2 = 0; k2 < 8; k2++) { var an = spin + k2 * Math.PI / 4, cs = Math.cos(an), sn = Math.sin(an); if (sn < 0) continue; cb.beginPath(); cb.moveTo(x + cs * 18 * s, y - 4 * s + sn * 4.5 * s); cb.lineTo(x + cs * 40 * s, y - 4 * s + sn * 10 * s); cb.stroke(); }
      var res = drawPot(cb, t);
      cb.fillStyle = pan; cb.beginPath(); cb.ellipse(x, y + 1 * s, 74 * s, 19 * s, 0, 0.05, Math.PI - 0.05); cb.ellipse(x, y + 1 * s, 66 * s, 15 * s, 0, Math.PI - 0.05, 0.05, true); cb.closePath(); cb.fill();
      cb.fillStyle = 'rgba(255,255,255,0.25)'; cb.beginPath(); cb.ellipse(x - 40 * s, y + 12 * s, 16 * s, 2.5 * s, 0.05, 0, 7); cb.fill();
      // finishing sparkle
      cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; sparks.forEach(function (sp) { var u = (t - sp.t0) / 1.4; n3_dot(cb, sparkG, sp.x, sp.y - u * 20, sp.r * 3, Math.sin(Math.PI * u) * 0.7); cb.fillStyle = 'rgba(255,255,240,' + Math.sin(Math.PI * u) + ')'; n3_cspark(cb, sp.x, sp.y - u * 20, sp.r * (1 - u * 0.4)); }); cb.restore();
      cat(cb, tt, T > 3 && T < 9);
      void res;
    },
    finish: function (t) { var T = t - T0; if (T > 2.6 && T < 15) T0 = t - 2.6; else if (!(T >= 0 && T <= 2.6)) T0 = t; }
  };
};
UIC.pottery = {L: ['#A0583A', '#723C26', 'rgba(255,252,248,0.86)', '#2E1E16', '#6E5A4E', '#B2572E', '#B2572E', '#C9773E', '#FFFFFF'], D: ['#3E2826', '#1E1214', 'rgba(36,24,24,0.80)', '#F6ECE4', '#C2AEA2', '#F2A86A', '#F2A86A', '#F6C48E', '#24160F']};

// ---------- Campfire Night: flames flicker over crossed logs, sparks drift up and fade, smoke curls by day, the lake shimmers and a
// little loon paddles across, a marshmallow slowly toasts on its stick; at night stars twinkle, fireflies blink and the tent glows.
// Moment: the marshmallow toasts golden, the s'more squishes together, and the fire pops a fountain of sparks into the sky.
ENGINES.campfire = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, i, Fi = A.fire, fs = Fi.s, Lk = A.lake;
  var glowF = n3_rg('rgba(255,150,60,0.75)', [0.3, 0.35]), emberG = n3_rg('rgba(255,120,40,0.9)', [0.4, 0.5]), sparkG = n3_rg('rgba(255,200,110,0.9)'), smokeG = n3_rg(dk ? 'rgba(150,150,170,0.25)' : 'rgba(235,235,235,0.6)'), flyG = n3_rg('rgba(220,255,140,0.6)'), tentG = n3_rg('rgba(255,190,100,0.8)', [0.5, 0.45]), starG = n3_rg('rgba(255,250,230,0.8)');
  var sparks = [], smoke = [], flies = [], rip = [], popped = false;
  for (i = 0; i < (ph ? 5 : 9); i++) flies.push({x0: W * (0.05 + Math.random() * 0.9), y0: Lk.bot + (H - Lk.bot) * (0.15 + Math.random() * 0.6), ph: Math.random() * 6.28});
  for (i = 0; i < (ph ? 14 : 26); i++) rip.push({x: Math.random() * W, y: Lk.top + 6 + Math.pow(Math.random(), 1.4) * (Lk.bot - Lk.top - 10), w: 10 + Math.random() * 30, ph: Math.random() * 6.28, v: 3 + Math.random() * 6});
  var stA = A.stick[0], stB = A.stick[1], sAng = Math.atan2(stB[1] - stA[1], stB[0] - stA[0]);
  var tongues = [[-24, 0.48, 9], [-12, 0.78, 11], [0, 1, 12], [12, 0.74, 11], [23, 0.46, 9]];
  function flame(c, t, scale, hMul, cols, seed) { var x = Fi.x, y = Fi.y; tongues.forEach(function (q, k) { var fk = 0.75 + 0.35 * flick(t * 1.3, k * 1.7 + seed), h = 74 * fs * q[1] * hMul * fk * scale, w = q[2] * fs * scale * 1.15, x0 = x + q[0] * fs * scale, sway = Math.sin(t * 3.1 + k * 1.3 + seed) * 7 * fs * scale + Math.sin(t * 7.3 + k) * 2 * fs;
      c.fillStyle = n3_lin(c, 0, y, 0, y - h, cols); c.beginPath(); c.moveTo(x0 - w, y); c.bezierCurveTo(x0 - w * 1.1, y - h * 0.45, x0 + sway * 0.5 - w * 0.5, y - h * 0.68, x0 + sway, y - h); c.bezierCurveTo(x0 + sway * 0.5 + w * 0.5, y - h * 0.68, x0 + w * 1.1, y - h * 0.45, x0 + w, y); c.closePath(); c.fill(); }); }
  function cracker(c, s) { c.fillStyle = '#D9A060'; c.beginPath(); if (c.roundRect) c.roundRect(-11 * s, -11 * s, 22 * s, 22 * s, 3 * s); else c.rect(-11 * s, -11 * s, 22 * s, 22 * s); c.fill(); c.fillStyle = '#B9803E'; for (var a = -1; a <= 1; a += 2) for (var b = -1; b <= 1; b += 2) { c.beginPath(); c.arc(a * 5 * s, b * 5 * s, 1.1 * s, 0, 7); c.fill(); } c.fillRect(-0.6 * s, -9 * s, 1.2 * s, 18 * s); }
  // the loon on the lake
  var loon = {u: Math.random()};
  return {
    step: function (dt, t, f) {
      var T = t - T0, rate = dk ? 7 : 4;
      if (Math.random() < dt * rate * f.s) sparks.push({x: Fi.x + (Math.random() - 0.5) * 30 * fs, y: Fi.y - 40 * fs, vx: (Math.random() - 0.5) * 20, vy: -(50 + Math.random() * 70) * fs, t0: t, l: 1.4 + Math.random() * 1.6, r: (1.2 + Math.random() * 1.4) * fs});
      if (T > 2.6 && T < 3.4 && !popped) { popped = true; for (var k = 0; k < (ph ? 60 : 110); k++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.3, sp = (200 + Math.random() * 320) * fs; sparks.push({x: Fi.x, y: Fi.y - 30 * fs, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 160, t0: t, l: 2 + Math.random() * 1.8, r: (1.6 + Math.random() * 2) * fs, big: 1}); } }
      if (T > 3.4) popped = false;
      sparks.forEach(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; if (s.g) s.vy += s.g * dt; s.vx += Math.sin(t * 3 + s.t0 * 7) * 30 * dt; s.vx *= 0.99; });
      sparks = sparks.filter(function (s) { return t - s.t0 < s.l; });
      if (Math.random() < dt * (dk ? 1.2 : 2.2)) smoke.push({t0: t, x: Fi.x + (Math.random() - 0.5) * 16 * fs, l: 5 + Math.random() * 3, dr: 10 + Math.random() * 20});
      smoke = smoke.filter(function (s) { return t - s.t0 < s.l; });
      loon.u = (loon.u + dt * f.s / 70) % 1;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, fk = flick(tt, 2.1);
      // stars
      if (dk) A.twk.forEach(function (s, k) { var a = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(tt * (0.8 + s.k) + k * 2.3), 2); n3_dot(ca, starG, s.x, s.y, s.r * 2.6, a * 0.6); ca.fillStyle = 'rgba(255,250,232,' + a + ')'; n3_cspark(ca, s.x, s.y, s.r * (0.7 + 0.3 * a)); });
      else { ca.strokeStyle = 'rgba(70,80,100,0.55)'; ca.lineWidth = 1.3; ca.lineCap = 'round'; for (var b = 0; b < 3; b++) { var bx = ((tt * 14 + b * 90 + 200) % (W + 200)) - 100, by = H * 0.24 + b * 14 + Math.sin(tt * 0.6 + b) * 6, fl = Math.sin(tt * 6 + b * 2) * 3; ca.beginPath(); ca.moveTo(bx - 7, by - 2 - fl); ca.quadraticCurveTo(bx - 3, by - 4, bx, by); ca.quadraticCurveTo(bx + 3, by - 4, bx + 7, by - 2 - fl); ca.stroke(); } }
      // lake shimmer and the moon or sun glints
      ca.lineCap = 'round'; rip.forEach(function (r) { var a = 0.5 + 0.5 * Math.sin(tt * 0.9 + r.ph), x = (r.x + tt * r.v) % (W + 60) - 30, d = (r.y - Lk.top) / (Lk.bot - Lk.top); ca.strokeStyle = dk ? 'rgba(170,190,240,' + (0.22 * a) + ')' : 'rgba(255,255,255,' + (0.55 * a) + ')'; ca.lineWidth = 1 + d * 1.2; ca.beginPath(); ca.moveTo(x - r.w * (0.5 + d), r.y); ca.lineTo(x + r.w * (0.5 + d), r.y); ca.stroke(); });
      var Mo = A.moon; for (var k = 0; k < 7; k++) { var yy = Lk.top + 10 + k * (ph ? 10 : 13), w = Mo[2] * (1.2 - k * 0.08) * (0.55 + 0.45 * Math.sin(tt * 1.3 + k * 1.7)); ca.fillStyle = dk ? 'rgba(250,244,220,0.5)' : 'rgba(255,253,240,0.75)'; ca.fillRect(Mo[0] - w + Math.sin(tt * 0.8 + k) * 4, yy, w * 2, 2); }
      // the loon and its wake
      var lx = -40 + (W + 80) * loon.u, ly = Lk.top + (Lk.bot - Lk.top) * 0.42, ls = ph ? 0.8 : 1.15, bob = Math.sin(tt * 1.6) * 0.8;
      ca.strokeStyle = dk ? 'rgba(170,190,240,0.3)' : 'rgba(255,255,255,0.7)'; ca.lineWidth = 1; for (k = 1; k < 4; k++) { ca.beginPath(); ca.moveTo(lx - 10 * ls - k * 14 * ls, ly + 2 + k * 3 * ls); ca.lineTo(lx - 8 * ls, ly + 3); ca.lineTo(lx - 10 * ls - k * 14 * ls, ly + 4 - k * 0 - k * 1.5 * ls + k * 1.5 * ls); ca.stroke(); }
      ca.save(); ca.translate(lx, ly + bob); ca.scale(ls, ls); ca.fillStyle = dk ? '#3A4052' : '#2E3440'; ca.beginPath(); ca.ellipse(0, 0, 13, 5.5, 0, Math.PI, 0); ca.quadraticCurveTo(10, 3, 0, 3); ca.quadraticCurveTo(-10, 3, -13, 0); ca.fill();
      ca.fillStyle = dk ? '#DDE2EE' : '#FFFFFF'; for (var dd = -8; dd < 6; dd += 3.5) { ca.beginPath(); ca.arc(dd, -2.5, 0.8, 0, 7); ca.fill(); } ca.fillStyle = dk ? '#3A4052' : '#2E3440'; ca.beginPath(); ca.moveTo(7, -2); ca.quadraticCurveTo(9, -10, 12, -11); ca.lineTo(14, -9); ca.quadraticCurveTo(12, -6, 11, -1); ca.fill(); ca.beginPath(); ca.arc(12.5, -10.5, 3.6, 0, 7); ca.fill(); ca.fillStyle = '#1E2228'; ca.beginPath(); ca.moveTo(15.5, -11); ca.lineTo(20, -10); ca.lineTo(15.5, -9.4); ca.fill();
      ca.fillStyle = '#E8504A'; ca.beginPath(); ca.arc(13.4, -11.2, 1, 0, 7); ca.fill(); ca.fillStyle = n3_BLUSH; ca.beginPath(); ca.arc(13.6, -9, 1.3, 0, 7); ca.fill(); ca.restore();
      // fire light on everything (night), the tent's warm glow
      cb.save(); cb.globalCompositeOperation = 'lighter';
      if (dk) { n3_dot(cb, glowF, Fi.x, Fi.y - 30 * fs, 300 * fs * (0.95 + 0.08 * fk), 0.38 + 0.12 * fk); cb.save(); cb.translate(Fi.x, Fi.y + 6 * fs); cb.scale(1, 0.28); n3_dot(cb, glowF, 0, 0, 220 * fs, 0.5 + 0.15 * fk); cb.restore(); }
      else n3_dot(cb, glowF, Fi.x, Fi.y - 20 * fs, 90 * fs, 0.3 + 0.1 * fk);
      var Tn = A.tent; if (dk) { var tg = 0.75 + 0.15 * Math.sin(tt * 1.7) + 0.1 * fk; cb.save(); cb.beginPath(); cb.moveTo(Tn.x - Tn.w * 0.55, Tn.y + 4); cb.lineTo(Tn.x - Tn.w * 0.12, Tn.y - Tn.h * 0.82); cb.lineTo(Tn.x + Tn.w * 0.04, Tn.y + 7); cb.closePath(); cb.clip(); n3_dot(cb, tentG, Tn.x - Tn.w * 0.2, Tn.y - Tn.h * 0.2, Tn.h * 0.9, tg); cb.restore();
        cb.save(); cb.beginPath(); cb.moveTo(Tn.x - Tn.w, Tn.y); cb.lineTo(Tn.x - Tn.w * 0.12, Tn.y - Tn.h); cb.lineTo(Tn.x + Tn.w * 0.12, Tn.y - Tn.h); cb.lineTo(Tn.x + Tn.w * 1.05, Tn.y); cb.lineTo(Tn.x + Tn.w * 0.2, Tn.y + 10); cb.closePath(); cb.clip(); n3_dot(cb, tentG, Tn.x, Tn.y - Tn.h * 0.4, Tn.w * 1.3, 0.28 * tg); cb.restore(); }
      cb.restore();
      // smoke
      smoke.forEach(function (s) { var u = (t - s.t0) / s.l; n3_dot(cb, smokeG, s.x + u * s.dr * 3 + Math.sin(u * 5 + s.l) * 8, Fi.y - 70 * fs - u * 220 * fs, (8 + u * 30) * fs, Math.sin(Math.PI * Math.min(1, u * 1.3)) * (dk ? 0.5 : 0.7)); });
      // embers and flames
      cb.save(); cb.globalCompositeOperation = 'lighter'; n3_dot(cb, emberG, Fi.x, Fi.y, 40 * fs, 0.6 + 0.3 * fk); cb.restore();
      var hm = dk ? 1 : 0.8, pop = T > 2.5 && T < 3.6 ? 1 + 0.5 * Math.sin(Math.PI * (T - 2.5) / 1.1) : 1;
      flame(cb, tt, 1.15, hm * pop, [[0, 'rgba(232,70,40,0.95)'], [0.6, 'rgba(250,110,50,0.9)'], [1, 'rgba(255,150,60,0.0)']], 0);
      flame(cb, tt * 1.1, 0.82, hm * pop, [[0, 'rgba(255,140,40,1)'], [0.7, 'rgba(255,180,60,0.9)'], [1, 'rgba(255,200,80,0)']], 3);
      flame(cb, tt * 1.25, 0.5, hm * pop, [[0, 'rgba(255,235,140,1)'], [0.8, 'rgba(255,240,170,0.9)'], [1, 'rgba(255,250,200,0)']], 7);
      // the marshmallow stick and its treat
      var bobS = Math.sin(tt * 0.9) * 2, ex = stB[0], ey = stB[1] + bobS;
      cb.strokeStyle = dk ? '#6A4630' : '#8A5A36'; cb.lineWidth = 3.2 * fs; cb.lineCap = 'round'; cb.beginPath(); cb.moveTo(stA[0], stA[1]); cb.quadraticCurveTo((stA[0] + ex) / 2, (stA[1] + ey) / 2 - 4 * fs, ex, ey); cb.stroke();
      var toast = T > 0 && T < 11 ? Math.min(1, 0.25 + T / 1.6 * 0.75) : ((tt * 0.03) % 1) * 0.6, fade = T > 10 && T < 11.5 ? 1 - (T - 10) / 1.5 : 1, mc = toast < 0.5 ? mix('#FFF8EE', '#F2C470', toast * 2) : mix('#F2C470', '#B87838', (toast - 0.5) * 2);
      cb.save(); cb.translate(ex, ey); cb.rotate(sAng); cb.scale(1.35, 1.35); cb.globalAlpha = fade;
      var squish = T > 1.6 && T < 11 ? n3_ease((T - 1.6) / 0.9) : 0;
      if (squish > 0) { cb.save(); cb.translate(4 * fs, -(26 - 14.5 * squish) * fs); cracker(cb, fs); cb.restore(); cb.fillStyle = '#6A3A22'; cb.fillRect(-6 * fs, -(14 - 4 * squish) * fs, 20 * fs, 4 * fs); }
      cb.fillStyle = mc; var mw = 15 * fs * (1 + squish * 0.25), mh = 12 * fs * (1 - squish * 0.35); cb.beginPath(); if (cb.roundRect) cb.roundRect(-3 * fs, -mh / 2, mw, mh, 4 * fs); else cb.rect(-3 * fs, -mh / 2, mw, mh); cb.fill();
      cb.fillStyle = 'rgba(255,255,255,0.45)'; cb.fillRect(0, -mh / 2 + 1.5 * fs, mw * 0.6, 2 * fs);
      if (squish > 0) { cb.save(); cb.translate(4 * fs, (26 - 14.5 * squish) * fs); cracker(cb, fs); cb.restore(); }
      if (squish > 0.9 && T < 9) { cb.rotate(-sAng); n3_face(cb, 8 * fs, -2 * fs, 9 * fs, n3_blinkAt(tt, 2), T > 2.6); }
      cb.restore(); cb.globalAlpha = 1;
      // sparks
      cb.save(); cb.globalCompositeOperation = 'lighter'; sparks.forEach(function (s) { var u = (t - s.t0) / s.l, a = (1 - u) * (u < 0.1 ? u * 10 : 1); n3_dot(cb, sparkG, s.x, s.y, s.r * (s.big ? 5 : 4), a * 0.7); cb.fillStyle = 'rgba(255,' + Math.round(240 - u * 120) + ',' + Math.round(170 - u * 120) + ',' + a + ')'; cb.beginPath(); cb.arc(s.x, s.y, s.r * (1 - u * 0.5), 0, 7); cb.fill(); }); cb.restore();
      // fireflies over the meadow
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; flies.forEach(function (q) { var x = q.x0 + Math.sin(tt * 0.3 + q.ph) * 40, y = q.y0 + Math.sin(tt * 0.5 + q.ph * 2) * 16, a = Math.pow(Math.max(0, Math.sin(tt * 1.1 + q.ph * 1.7)), 2) * 0.9 + 0.08; n3_dot(cb, flyG, x, y, 12, a); cb.fillStyle = 'rgba(235,255,180,' + a + ')'; cb.beginPath(); cb.arc(x, y, 1.6, 0, 7); cb.fill(); }); cb.restore(); }
    },
    finish: function (t) { var T = t - T0; if (T > 2.6 && T < 10) { T0 = t - 2.4; } else if (!(T >= 0 && T <= 2.6)) T0 = t; }
  };
};
UIC.campfire = {L: ['#3E6A5A', '#27463C', 'rgba(255,255,252,0.86)', '#18261F', '#55665C', '#C2582A', '#C2582A', '#D9783A', '#FFFFFF'], D: ['#1E2844', '#0E1326', 'rgba(16,20,40,0.80)', '#F2EEE6', '#B4B2C2', '#F5A04E', '#F5A04E', '#F8C27A', '#1A1220']};

// ---------- Aquarium Tunnel: schools of fish sweep over the tunnel, light ripples across the walkway, bubbles rise in columns, a manta
// ray glides past now and then, kelp sways; at night the tank goes deep blue and jellyfish drift and glow.
// Moment: a whale shark passes slowly overhead, its shadow sweeping the tunnel, and the schools swirl into a ring around it.
function n3_fish(c, x, y, ang, s, kind, dk, t, ph) {
  c.save(); c.translate(x, y); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1); c.scale(s, s);
  var wag = Math.sin(t * 9 + ph) * 0.3, K = n3_FISH[kind], body = dk ? mix(K[0], '#0A1A33', 0.35) : K[0], fin = dk ? mix(K[1], '#0A1A33', 0.3) : K[1];
  c.fillStyle = fin; c.beginPath(); c.moveTo(-K[2] * 0.8, 0); c.lineTo(-K[2] * 1.45, -K[3] * 0.9 + wag * 3); c.lineTo(-K[2] * 1.3, 0); c.lineTo(-K[2] * 1.45, K[3] * 0.9 + wag * 3); c.closePath(); c.fill();
  if (kind !== 2) { c.beginPath(); c.moveTo(-K[2] * 0.3, -K[3] * 0.8); c.quadraticCurveTo(0, -K[3] * 1.6, K[2] * 0.3, -K[3] * 0.85); c.fill(); }
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, K[2], K[3], 0, 0, 7); c.fill();
  if (kind === 1) { c.fillStyle = dk ? '#C8D4E0' : '#FFFFFF'; c.fillRect(K[2] * 0.25, -K[3] * 0.95, K[2] * 0.2, K[3] * 1.9); c.fillRect(-K[2] * 0.4, -K[3] * 0.9, K[2] * 0.18, K[3] * 1.8); }
  if (kind === 2) { c.fillStyle = dk ? 'rgba(120,170,220,0.6)' : '#5A8ACB'; c.fillRect(-K[2] * 0.8, -K[3] * 0.7, K[2] * 1.6, K[3] * 0.5); }
  if (kind === 3) { c.fillStyle = '#2A2A3A'; c.fillRect(K[2] * 0.25, -K[3] * 0.9, K[2] * 0.14, K[3] * 1.8); }
  c.fillStyle = dk ? '#E6F2FF' : '#FFFFFF'; c.beginPath(); c.arc(K[2] * 0.55, -K[3] * 0.15, K[3] * 0.32, 0, 7); c.fill(); c.fillStyle = n3_INK; c.beginPath(); c.arc(K[2] * 0.6, -K[3] * 0.15, K[3] * 0.2, 0, 7); c.fill();
  c.restore(); }
var n3_FISH = [['#3E7FE0', '#F2D24A', 10, 5.5], ['#FF8A3A', '#FF8A3A', 9, 5], ['#D2DEEA', '#AFC4D8', 9, 2.4], ['#F7D23A', '#F7D23A', 7.5, 6], ['#F27BA0', '#C9579A', 8, 4.5]];
ENGINES.aquarium = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, i, j, vx = A.vp[0], vy = A.vp[1], Tn = A.tun;
  var bubG = n3_rg(dk ? 'rgba(160,220,255,0.5)' : 'rgba(255,255,255,0.8)', [0.6, dk ? 0.15 : 0.3]), jellyG = [n3_rg('rgba(255,120,220,0.7)', [0.35, 0.3]), n3_rg('rgba(110,240,255,0.7)', [0.35, 0.3]), n3_rg('rgba(180,140,255,0.7)', [0.35, 0.3])], shadeG = n3_rg('rgba(0,20,40,0.5)', [0.5, 0.35]);
  var fs = ph ? 1.05 : 1.6;
  // schools: each follows its own sweeping path overhead; members trail the leader along the same path
  var schools = [], kinds = dk ? [2, 0, 3] : [0, 2, 1, 3, 4];
  kinds.forEach(function (kd, k) { var n = kd === 2 ? (ph ? 12 : 22) : (ph ? 5 : 9), sc = {kind: kd, sp: 0.06 + hash(k + 3) * 0.05, p1: hash(k) * 6.28, p2: hash(k + 7) * 6.28, yc: H * (0.14 + 0.08 * (k % 3)), yA: H * (0.06 + 0.05 * hash(k + 11)), m: []};
    for (j = 0; j < n; j++) sc.m.push({lag: j * (kd === 2 ? 0.55 : 0.9) + hash(j + k * 13) * 0.4, dx: (hash(j * 3 + k) - 0.5) * 30, dy: (hash(j * 5 + k + 1) - 0.5) * (kd === 2 ? 26 : 34), ph: hash(j + 40) * 6.28, s: fs * (kd === 2 ? 0.95 : 1.25) * (0.8 + hash(j + 9) * 0.4)});
    schools.push(sc); });
  function lead(sc, t) { return [vx + W * 0.5 * Math.sin(t * sc.sp + sc.p1) + W * 0.06 * Math.sin(t * sc.sp * 3.1 + sc.p2), sc.yc + sc.yA * Math.sin(t * sc.sp * 2 + sc.p2)]; }
  var bubbles = [], manta = null, nextManta = 7;
  var jellies = []; if (dk) for (i = 0; i < (ph ? 4 : 7); i++) jellies.push({x: W * (0.08 + 0.84 * hash(i + 2)), y: H * (0.08 + 0.4 * hash(i + 5)), s: (ph ? 0.8 : 1.2) * (0.7 + hash(i + 8) * 0.6), ph: hash(i + 3) * 6.28, k: i % 3});
  var caus = []; for (i = 0; i < (ph ? 26 : 44); i++) caus.push({u: Math.random(), v: Math.random(), ph: Math.random() * 6.28, r: 0.4 + Math.random() * 0.6});
  function floorPt(u, vv) { var m = Math.pow(12, vv), x = (u * 2 - 1) * Tn.af * 0.95; return [vx + x * m, vy + Tn.fB * m, m]; }
  function shark(c, x, y, L, t) { var und = Math.sin(t * 1.4) * 0.06, tail = Math.sin(t * 1.4 + 1) * L * 0.08;
    c.save(); c.translate(x, y); c.rotate(und * 0.3);
    var top = dk ? '#2C4466' : '#4E6E8E', belly = dk ? '#8AA4C0' : '#EAF2F8';
    c.fillStyle = top; c.beginPath(); c.moveTo(-L * 0.48, 0); c.lineTo(-L * 0.62, -L * 0.13 + tail); c.lineTo(-L * 0.56, 0 + tail * 0.3); c.lineTo(-L * 0.6, L * 0.08 + tail); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-L * 0.1, -L * 0.07); c.lineTo(-L * 0.2, -L * 0.16); c.lineTo(-L * 0.24, -L * 0.07); c.fill();
    c.beginPath(); c.moveTo(L * 0.12, L * 0.05); c.lineTo(-L * 0.02, L * 0.17 + Math.sin(t * 1.4) * L * 0.02); c.lineTo(-L * 0.06, L * 0.06); c.fill();
    c.beginPath(); c.moveTo(L * 0.42, -L * 0.02); c.bezierCurveTo(L * 0.4, -L * 0.1, L * 0.1, -L * 0.1, -L * 0.2, -L * 0.065); c.bezierCurveTo(-L * 0.35, -L * 0.045, -L * 0.45, -L * 0.02, -L * 0.5, 0); c.bezierCurveTo(-L * 0.4, L * 0.04, -L * 0.1, L * 0.085, L * 0.2, L * 0.075); c.bezierCurveTo(L * 0.38, L * 0.07, L * 0.44, L * 0.03, L * 0.42, -L * 0.02); c.fill();
    c.fillStyle = belly; c.beginPath(); c.moveTo(L * 0.42, L * 0.01); c.bezierCurveTo(L * 0.3, L * 0.065, -L * 0.1, L * 0.08, -L * 0.42, L * 0.02); c.bezierCurveTo(-L * 0.1, L * 0.05, L * 0.25, L * 0.04, L * 0.42, L * 0.01); c.fill();
    c.fillStyle = dk ? 'rgba(220,235,255,0.55)' : 'rgba(255,255,255,0.85)'; for (var q = 0; q < 34; q++) { var u = hash(q + 1), w = hash(q + 50), sx = L * (0.36 - u * 0.78), sy = -L * 0.06 + w * L * 0.08 * (1 - u * 0.4); c.beginPath(); c.arc(sx, sy, L * 0.007 * (1.4 - u * 0.6), 0, 7); c.fill(); }
    c.strokeStyle = dk ? 'rgba(220,235,255,0.25)' : 'rgba(255,255,255,0.5)'; c.lineWidth = L * 0.004; for (q = 0; q < 3; q++) { c.beginPath(); c.moveTo(-L * (0.05 + q * 0.1), -L * 0.06); c.lineTo(-L * (0.05 + q * 0.1), L * 0.05); c.stroke(); }
    c.fillStyle = n3_INK; c.beginPath(); c.arc(L * 0.36, -L * 0.012, L * 0.009, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(L * 0.363, -L * 0.016, L * 0.003, 0, 7); c.fill();
    c.strokeStyle = n3_INK; c.lineWidth = L * 0.004; c.lineCap = 'round'; c.beginPath(); c.arc(L * 0.4, L * 0.012, L * 0.02, 0.4, 1.4); c.stroke(); c.fillStyle = n3_BLUSH; c.beginPath(); c.ellipse(L * 0.34, L * 0.02, L * 0.014, L * 0.008, 0, 0, 7); c.fill();
    c.restore(); }
  function mantaDraw(c, x, y, s, t) { var flap = Math.sin(t * 1.8) * 0.35; c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = dk ? '#243A5A' : '#3A5878';
    c.beginPath(); c.moveTo(30, 0); c.quadraticCurveTo(10, -8, 0, -10); c.quadraticCurveTo(-16, -30 - flap * 30, -36, -38 - flap * 40); c.quadraticCurveTo(-22, -12, -26, 0); c.quadraticCurveTo(-22, 12, -36, 38 + flap * 40); c.quadraticCurveTo(-16, 30 + flap * 30, 0, 10); c.quadraticCurveTo(10, 8, 30, 0); c.fill();
    c.strokeStyle = c.fillStyle; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-62, Math.sin(t * 2) * 4); c.stroke(); c.beginPath(); c.moveTo(30, -4); c.lineTo(37, -8); c.moveTo(30, 4); c.lineTo(37, 8); c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(4, 0, 14, 4, 0, 0, 7); c.fill(); c.restore(); }
  return {
    step: function (dt, t, f) {
      A.bubbles.forEach(function (b, k) { if (Math.random() < dt * 2.6) bubbles.push({x: b.x + (Math.random() - 0.5) * 6 * b.s, y: b.y, r: (1.6 + Math.random() * 2.6) * b.s, v: (40 + Math.random() * 30) * b.s, ph: Math.random() * 6.28, t0: t}); });
      bubbles.forEach(function (b) { b.y -= b.v * dt; b.r *= 1 + dt * 0.08; }); bubbles = bubbles.filter(function (b) { return b.y > -20; });
      nextManta -= dt * f.s; if (nextManta <= 0 && !manta) { nextManta = 26 + Math.random() * 14; var lr = Math.random() < 0.5; manta = {t0: t, d: 16, dir: lr ? 1 : -1, y: H * (0.1 + Math.random() * 0.16)}; }
      if (manta && t - manta.t0 > manta.d) manta = null;
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, T = t - T0, Sk = n3_env(T, 0, 0.01, 11.5, 11.6) > 0 ? (T / 11.5) : -1, ring = n3_env(T, 0.8, 2.4, 9.5, 11.5);
      var Lsh = W * (ph ? 0.95 : 0.52), sx = -Lsh * 0.65 + (W + Lsh * 1.3) * Math.max(0, Sk), sy = H * (ph ? 0.2 : 0.24) + Math.sin(tt * 0.5) * 8;
      // jellies (night)
      jellies.forEach(function (J, k) { var pu = 0.5 + 0.5 * Math.sin(tt * 1.6 + J.ph), x = J.x + Math.sin(tt * 0.12 + J.ph) * 30, y = J.y - ((tt * 4 + J.ph * 40) % (H * 0.6)) * 0 + Math.sin(tt * 0.3 + J.ph) * 20, s = J.s, col = ['rgba(255,150,225,', 'rgba(120,240,255,', 'rgba(190,160,255,'][J.k];
        ca.save(); ca.globalCompositeOperation = 'lighter'; n3_dot(ca, jellyG[J.k], x, y, 34 * s, 0.6 + 0.3 * pu); ca.restore();
        ca.strokeStyle = col + '0.5)'; ca.lineWidth = 1.2; for (var q = 0; q < 5; q++) { ca.beginPath(); ca.moveTo(x - 8 * s + q * 4 * s, y + 4 * s); for (var z = 1; z <= 6; z++) ca.lineTo(x - 8 * s + q * 4 * s + Math.sin(tt * 2 + z * 0.8 + q) * 3 * s, y + 4 * s + z * 6 * s * (1.1 - pu * 0.2)); ca.stroke(); }
        ca.fillStyle = col + '0.75)'; ca.beginPath(); ca.ellipse(x, y + 2 * s, (12 + pu * 2) * s, (11 - pu * 2) * s, 0, Math.PI, 0); ca.quadraticCurveTo(x, y + 7 * s, x - (12 + pu * 2) * s, y + 2 * s); ca.fill();
        ca.fillStyle = 'rgba(255,255,255,0.5)'; ca.beginPath(); ca.ellipse(x - 4 * s, y - 4 * s, 3 * s, 2 * s, -0.5, 0, 7); ca.fill(); n3_eyes(ca, x, y - 1 * s, 3.2 * s, 1.1 * s, n3_blinkAt(tt, k), false); });
      // manta
      if (manta) { var mu = (t - manta.t0) / manta.d, mx2 = manta.dir > 0 ? -120 + (W + 240) * mu : W + 120 - (W + 240) * mu; ca.save(); if (manta.dir < 0) { ca.translate(mx2, 0); ca.scale(-1, 1); ca.translate(-mx2, 0); } mantaDraw(ca, mx2, manta.y + Math.sin(mu * 6) * 14, ph ? 0.9 : 1.5, tt); ca.restore(); }
      // whale shark
      if (Sk >= 0) shark(ca, sx, sy, Lsh, tt);
      // fish schools
      schools.forEach(function (sc, k) { sc.m.forEach(function (F, q) { var tl = tt - F.lag, p = lead(sc, tl), p2 = lead(sc, tl - 0.05), x = p[0] + F.dx + Math.sin(tt * 1.3 + F.ph) * 5, y = p[1] + F.dy + Math.sin(tt * 1.7 + F.ph) * 4, ang = Math.atan2(p[1] - p2[1], p[0] - p2[0]);
        if (ring > 0) { var th = q / sc.m.length * 6.283 + tt * (0.7 + k * 0.1) * (k % 2 ? -1 : 1), rr = Lsh * (0.36 + k * 0.06), rx = sx + Math.cos(th) * rr, ry = sy + Math.sin(th) * rr * 0.42, ra = th + (k % 2 ? -1 : 1) * Math.PI / 2; x = x + (rx - x) * ring; y = y + (ry - y) * ring; if (ring > 0.5) ang = ra; }
        n3_fish(ca, x, y, ang, F.s, sc.kind, dk, tt, F.ph); }); });
      // bubbles
      bubbles.forEach(function (b) { var x = b.x + Math.sin(tt * 3 + b.ph + b.y * 0.03) * 3; n3_dot(ca, bubG, x, b.y, b.r, 0.9); ca.strokeStyle = dk ? 'rgba(180,230,255,0.5)' : 'rgba(255,255,255,0.8)'; ca.lineWidth = 0.8; ca.beginPath(); ca.arc(x, b.y, b.r, 0, 7); ca.stroke(); });
      // caustic light dancing on the walkway, and the shark's shadow sweeping across it
      cb.save(); var fl = A.floor; cb.beginPath(); cb.moveTo(fl[0][0], fl[0][1]); for (i = 1; i < 4; i++) cb.lineTo(fl[i][0], fl[i][1]); cb.closePath(); cb.clip();
      cb.globalCompositeOperation = 'lighter'; cb.strokeStyle = dk ? 'rgba(90,190,255,0.16)' : 'rgba(200,250,255,0.28)';
      for (var cl = 0; cl < 22; cl++) { var vv0 = ((cl / 22) + tt * 0.006) % 1; cb.lineWidth = 0.6 + vv0 * 3; cb.beginPath(); for (var cu = 0; cu <= 16; cu++) { var p = floorPt(cu / 16, Math.min(1, vv0 + Math.sin(cu * 1.3 + tt * 0.9 + cl * 2.1) * 0.012)); if (cu) cb.lineTo(p[0], p[1]); else cb.moveTo(p[0], p[1]); } cb.stroke(); }
      for (cl = 0; cl < 9; cl++) { var u0 = (cl + 0.5) / 9; cb.lineWidth = 1; cb.beginPath(); for (var cv = 0; cv <= 20; cv++) { var vv2 = cv / 20, p2 = floorPt(u0 + Math.sin(vv2 * 9 + tt * 0.8 + cl * 1.7) * 0.03, vv2); cb.lineWidth = 0.6 + vv2 * 3; if (cv) cb.lineTo(p2[0], p2[1]); else cb.moveTo(p2[0], p2[1]); } cb.stroke(); }
      cb.globalCompositeOperation = 'source-over';
      if (Sk >= 0) { var shx = sx, shy = vy + Tn.fB * 3.2; cb.save(); cb.translate(shx, shy); cb.scale(1, 0.2); n3_dot(cb, shadeG, 0, 0, Lsh * 0.55, 0.9 * n3_env(T, 0, 1.5, 9, 11.5)); cb.restore(); }
      cb.restore();
      // LED strips glow gently
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; cb.globalAlpha = 0.25 + 0.1 * Math.sin(tt); cb.strokeStyle = 'rgba(95,224,255,0.5)'; cb.lineWidth = 3; [[-1], [1]].forEach(function (q) { var a = [vx + q[0] * Tn.af * 0.93, vy + Tn.fB * 0.99], b = [vx + q[0] * Tn.af * 0.93 * 12, vy + Tn.fB * 0.99 * 12]; cb.beginPath(); cb.moveTo(a[0], a[1]); cb.lineTo(b[0], b[1]); cb.stroke(); }); cb.restore(); }
    },
    finish: function (t) { var T = t - T0; if (!(T >= 0 && T < 11.5)) T0 = t; }
  };
};
UIC.aquarium = {L: ['#1E6E96', '#124C6E', 'rgba(255,255,255,0.84)', '#0E2A3A', '#4A6A7A', '#1A76A8', '#1A76A8', '#2F9AC2', '#FFFFFF'], D: ['#0E2A4E', '#06142A', 'rgba(8,22,44,0.80)', '#E6F4FC', '#9CBCD2', '#6FE3FF', '#6FE3FF', '#B4A6FF', '#06142A']};

// ---------- Treehouse: leaves rustle and now and then one drifts down, the rope ladder and the tire swing sway, the tin-can telephone
// string wobbles when someone talks, a bird lands on the deck railing to hop and peck; fairy lights twinkle and the windows glow at night.
// Moment: a paper airplane launches from the window, loops all the way around the tree, and glides back in.
ENGINES.treehouse = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = !v.desk, T0 = -99, i, Lt = A.lights, Tr = A.tree, Wn = A.win, gy = A.gy;
  var bulbG = n3_rg('rgba(255,214,130,0.85)'), winG = n3_rg('rgba(255,200,110,0.75)', [0.4, 0.35]), flyG = n3_rg('rgba(220,255,150,0.6)'), sparkG = n3_rg('rgba(255,240,180,0.9)');
  var bulbCols = ['#FF7A8A', '#FFD25A', '#7AD8FF', '#9AE07A', '#C9A0FF'];
  // little leaf sprigs around the canopy edges that flutter in gusts
  var sprigs = []; A.canopy.forEach(function (c, k) { for (var j = 0; j < (ph ? 3 : 5); j++) { var a = hash(k * 7 + j) * 6.28, r = c[2] * (0.75 + hash(k + j * 3) * 0.3); sprigs.push({x: c[0] + Math.cos(a) * r, y: c[1] + Math.sin(a) * r * 0.75, a: a, ph: hash(k * 3 + j * 11) * 6.28, s: (ph ? 0.8 : 1.1) * (0.8 + hash(j + k) * 0.5)}); } });
  sprigs = sprigs.filter(function (s) { return s.y < H * 0.62 && s.y > -10 && s.x > -10 && s.x < W + 10; });
  var falling = [], nextLeaf = 2, bird = null, nextBird = 3, flies = [];
  for (i = 0; i < (ph ? 5 : 9); i++) flies.push({x0: W * (0.05 + Math.random() * 0.9), y0: gy - H * (0.02 + Math.random() * 0.25), ph: Math.random() * 6.28});
  var leafCols = dk ? ['#3E6A48', '#5A8A50', '#8A7A3A'] : ['#6CB85E', '#F2B33A', '#E8743A', '#8ACB6A'];
  var plane = [], sparks = [];
  function gust(t) { return 0.5 + 0.5 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1); }
  function lightString(c, pts, sag, n, t, start) { c.strokeStyle = dk ? 'rgba(40,40,60,0.8)' : 'rgba(90,70,60,0.6)'; c.lineWidth = 1; var out = [];
    for (var s = 0; s < pts.length - 1; s++) { var a = pts[s], b = pts[s + 1]; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); c.stroke();
      for (var k = 1; k < n; k++) { var u = k / n, x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * (a[0] + b[0]) / 2 + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * ((a[1] + b[1]) / 2 + sag) + u * u * b[1]; out.push([x, y + 3]); } }
    out.forEach(function (p, k) { var tw = 0.55 + 0.45 * Math.sin(t * 1.9 + k * 2.3 + start), boost = Math.max(0, 1 - Math.abs((t - T0) * 6 - k - start) / 4) * (t - T0 < 4 ? 1 : 0);
      if (dk || boost > 0) { c.save(); c.globalCompositeOperation = 'lighter'; n3_dot(c, bulbG, p[0], p[1], 10 + boost * 10, (dk ? tw * 0.7 : 0) + boost * 0.8); c.restore(); }
      c.fillStyle = bulbCols[(k + start) % bulbCols.length]; c.globalAlpha = dk ? 0.55 + 0.45 * tw : 0.95; c.beginPath(); c.ellipse(p[0], p[1], 2.2, 3, 0, 0, 7); c.fill(); c.globalAlpha = 1; }); }
  function birdDraw(c, x, y, s, dir, flap, peck, t) { c.save(); c.translate(x, y); c.scale(s * dir, s); var b = dk ? '#6A8AC8' : '#5A9AE8', bl = dk ? '#E8D6C8' : '#FFE6D2';
    c.fillStyle = b; c.beginPath(); c.ellipse(0, -6, 7, 6, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-6, -7); c.lineTo(-11, -10); c.lineTo(-10, -4); c.fill();
    c.fillStyle = bl; c.beginPath(); c.ellipse(2, -4, 4, 3.5, 0, 0, 7); c.fill();
    c.save(); c.translate(4, -10 + peck * 3); c.fillStyle = b; c.beginPath(); c.arc(0, 0, 4.4, 0, 7); c.fill(); c.fillStyle = '#F2A23A'; c.beginPath(); c.moveTo(3.6, -0.6); c.lineTo(7, 0.4); c.lineTo(3.6, 1.4); c.fill(); n3_eyes(c, 1.6, -0.8, 0.001, 1, n3_blinkAt(t, 4), false); c.fillStyle = n3_BLUSH; c.beginPath(); c.arc(2.4, 1.6, 1.1, 0, 7); c.fill(); c.restore();
    c.fillStyle = mix(b, '#000000', 0.15); c.save(); c.translate(-1, -7); c.rotate(-0.3 - flap * 1.4); c.beginPath(); c.ellipse(-3, 0, 6, 3, 0, 0, 7); c.fill(); c.restore();
    c.strokeStyle = '#E8A040'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, -1); c.lineTo(-1, 1.5); c.moveTo(2, -1); c.lineTo(2, 1.5); c.stroke(); c.restore(); }
  function paperPlane(c, x, y, ang, s) { c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s); c.fillStyle = '#FFFFFF'; c.strokeStyle = 'rgba(90,100,130,0.7)'; c.lineWidth = 1 / s; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(14, 0); c.lineTo(-10, -8); c.lineTo(-5, 0); c.lineTo(-10, 8); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#DDE6F2'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-5, 0); c.lineTo(-10, 8); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,150,200,0.5)'; c.beginPath(); c.moveTo(-6, -4); c.lineTo(6, -2); c.stroke(); c.restore(); }
  // the plane's path: out of the window, a full loop round the tree, back in
  var DUR = 7.2, phi0 = Math.atan2((Wn.y - Tr.y) / Tr.ry, (Wn.x - Tr.x) / Tr.rx);
  function planeAt(T) { var u = Math.max(0, Math.min(1, T / DUR)), phi = phi0 - u * Math.PI * 2, ex = Tr.x + Math.cos(phi) * Tr.rx, ey = Tr.y + Math.sin(phi) * Tr.ry, blend = Math.min(1, u / 0.1, (1 - u) / 0.1), bb = n3_ease(blend);
    var dip = Math.sin(u * Math.PI * 2) * 18; return {x: Wn.x + (ex - Wn.x) * bb, y: Wn.y + (ey + dip - Wn.y) * bb, z: Math.sin(phi), u: u}; }
  return {
    step: function (dt, t, f) {
      nextLeaf -= dt * f.s * (0.5 + gust(t)); if (nextLeaf <= 0 && sprigs.length) { nextLeaf = 2.5 + Math.random() * 3; var sp = sprigs[Math.floor(Math.random() * sprigs.length)]; falling.push({x: sp.x, y: sp.y, vx: 10 + Math.random() * 16, t0: t, ph: Math.random() * 6.28, c: leafCols[Math.floor(Math.random() * leafCols.length)], s: sp.s}); }
      falling.forEach(function (l) { l.y += (22 + Math.sin(t * 2 + l.ph) * 8) * dt; l.x += (l.vx + Math.sin(t * 1.3 + l.ph) * 24) * dt; }); falling = falling.filter(function (l) { return l.y < gy + 10; });
      nextBird -= dt * f.s; if (!bird && nextBird <= 0) { var R = A.rail, spots = [R.x0 + (R.hx0 - R.x0) * 0.5, R.hx1 + (R.x1 - R.hx1) * 0.5]; bird = {t0: t, x: spots[Math.floor(Math.random() * 2)], y: R.y, dir: Math.random() < 0.5 ? 1 : -1}; }
      if (bird && t - bird.t0 > 11) { bird = null; nextBird = 6 + Math.random() * 8; }
      var T = t - T0; if (T > 0 && T < DUR) { var P = planeAt(T); if (Math.random() < dt * 30) plane.push({x: P.x, y: P.y, t0: t, z: P.z}); }
      plane = plane.filter(function (p) { return t - p.t0 < 1.4; });
      if (T > DUR - 0.3 && T < DUR + 0.6 && Math.random() < dt * 40) { var a = Math.random() * 6.28; sparks.push({x: Wn.x + Math.cos(a) * Wn.w, y: Wn.y + Math.sin(a) * Wn.h, t0: t}); }
      sparks = sparks.filter(function (s) { return t - s.t0 < 1.2; });
    },
    draw: function (ca, cb, t, f) {
      var tt = t * f.s, g = gust(tt), T = t - T0;
      // window glow at night
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; var wg = 0.75 + 0.1 * Math.sin(tt * 1.3); n3_dot(cb, winG, Wn.x, Wn.y, Wn.w * 2.6, wg); n3_dot(cb, winG, A.round[0], A.round[1], A.round[2] * 3.4, wg * 0.8); cb.restore(); }
      // fairy lights along the railing and the roof
      lightString(cb, Lt[0], ph ? 5 : 8, ph ? 7 : 11, tt, 0); lightString(cb, Lt[1], ph ? 4 : 6, ph ? 5 : 7, tt, 3);
      // the tin-can telephone: string wobbles when someone talks
      var C0 = A.can[0], C1 = A.can[1], talk = Math.max(0, Math.sin(tt * 0.5)) * (0.4 + 0.6 * Math.abs(Math.sin(tt * 9))), amp = 1.5 + talk * 4;
      cb.strokeStyle = dk ? 'rgba(220,210,190,0.7)' : 'rgba(110,90,70,0.85)'; cb.lineWidth = 1; cb.beginPath(); for (i = 0; i <= 20; i++) { var u = i / 20, x = C0[0] + (C1[0] - C0[0]) * u, y = C0[1] + (C1[1] - C0[1]) * u + Math.sin(Math.PI * u) * 18 + Math.sin(Math.PI * u * 3 + tt * 14) * amp * Math.sin(Math.PI * u); if (i) cb.lineTo(x, y); else cb.moveTo(x, y); } cb.stroke();
      [C0, C1].forEach(function (cp, k) { var cs = ph ? 0.8 : 1.15, sw = k ? Math.sin(tt * 1.4) * 0.12 + talk * 0.08 * Math.sin(tt * 20) : 0; cb.save(); cb.translate(cp[0], cp[1]); cb.rotate(sw); cb.fillStyle = n3_lin(cb, -6 * cs, 0, 6 * cs, 0, [[0, '#9AA6B4'], [0.4, '#E8EEF4'], [1, '#7A8696']]); cb.fillRect(-6 * cs, 0, 12 * cs, 15 * cs); cb.fillStyle = k ? '#E8504A' : '#4FA0E8'; cb.fillRect(-6 * cs, 4 * cs, 12 * cs, 6 * cs); cb.fillStyle = '#5A6470'; cb.fillRect(-6.5 * cs, 0, 13 * cs, 1.5 * cs); cb.fillRect(-6.5 * cs, 13.5 * cs, 13 * cs, 1.5 * cs); cb.restore(); });
      // rope ladder
      var Ld = A.ladder, la = Math.sin(tt * 0.8) * 0.03 * (0.6 + g), lw = Ld.w, rungN = Math.floor(Ld.len / (ph ? 14 : 20));
      function lp(side, u) { var off = Math.sin(la) * Ld.len * u + Math.sin(u * Math.PI) * 3 * Math.sin(tt * 1.3); return [Ld.x + side * lw + off, Ld.y + Ld.len * u * Math.cos(la)]; }
      cb.strokeStyle = dk ? '#A8906A' : '#9A7A50'; cb.lineWidth = ph ? 1.6 : 2.2; [0, 1].forEach(function (sd) { cb.beginPath(); for (var q = 0; q <= 12; q++) { var p = lp(sd, q / 12); if (q) cb.lineTo(p[0], p[1]); else cb.moveTo(p[0], p[1]); } cb.stroke(); });
      cb.fillStyle = dk ? '#A07850' : '#E0B47E'; for (i = 1; i <= rungN; i++) { var uu = i / (rungN + 0.4), p0 = lp(0, uu), p1 = lp(1, uu); cb.fillRect(p0[0] - 2, p0[1] - 1.5, p1[0] - p0[0] + 4, ph ? 3 : 4); }
      // tire swing
      var S = A.swing, sa = Math.sin(tt * 1.05) * (0.1 + 0.08 * g), bx = S.x + Math.sin(sa) * S.len, by = S.y + Math.cos(sa) * S.len, r = S.r;
      cb.strokeStyle = dk ? '#A8906A' : '#9A7A50'; cb.lineWidth = ph ? 1.6 : 2.2; cb.beginPath(); cb.moveTo(S.x - r * 0.3, S.y); cb.lineTo(bx - r * 0.5, by); cb.moveTo(S.x + r * 0.3, S.y); cb.lineTo(bx + r * 0.5, by); cb.stroke();
      cb.save(); cb.translate(bx, by + r * 0.85); cb.rotate(sa * 0.5); cb.fillStyle = dk ? '#1E1E26' : '#34343E'; cb.beginPath(); cb.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2); cb.moveTo(r * 0.52, 0); cb.ellipse(0, 0, r * 0.52, r * 0.46, 0, 0, Math.PI * 2); cb.fill('evenodd');
      cb.strokeStyle = 'rgba(255,255,255,0.14)'; cb.lineWidth = r * 0.12; cb.beginPath(); cb.arc(0, 0, r * 0.76, Math.PI * 1.1, Math.PI * 1.6); cb.stroke(); cb.restore();
      // the bird on the railing
      if (bird) { var bt = t - bird.t0, bs = ph ? 0.9 : 1.3, inU = n3_ease(bt / 1.6), outU = n3_ease((bt - 9) / 1.8), x2 = bird.x + bird.dir * 220 * (1 - inU) + -bird.dir * 260 * outU, y2 = bird.y - 120 * (1 - inU) * (1 - inU) - 140 * outU * outU, fl = bt < 1.6 || bt > 9 ? Math.abs(Math.sin(tt * 18)) : 0, hop = bt > 2 && bt < 9 ? Math.abs(Math.sin(bt * 2.2)) * (Math.sin(bt * 0.9) > 0.3 ? 4 : 0) : 0, peck = bt > 2 && bt < 9 && Math.sin(bt * 1.7) > 0.6 ? Math.abs(Math.sin(bt * 12)) : 0;
        birdDraw(cb, x2 + (bt > 2 && bt < 9 ? Math.sin(bt * 0.8) * 10 : 0), y2 - hop, bs, bt > 9 ? -bird.dir : (bt < 2 ? -bird.dir : (Math.sin(bt * 0.5) > 0 ? 1 : -1)), fl, peck, tt); }
      // leaf sprigs fluttering and leaves drifting down
      sprigs.forEach(function (s) { var a = s.a + Math.sin(tt * 2.6 + s.ph) * 0.25 * (0.4 + g); cb.fillStyle = dk ? '#2E5238' : '#7CC266'; for (var q = 0; q < 3; q++) { var aa = a + (q - 1) * 0.5; cb.beginPath(); cb.ellipse(s.x + Math.cos(aa) * 6 * s.s, s.y + Math.sin(aa) * 6 * s.s, 6 * s.s, 2.6 * s.s, aa, 0, 7); cb.fill(); } });
      falling.forEach(function (l) { var sp2 = Math.sin(tt * 3 + l.ph); cb.save(); cb.translate(l.x, l.y); cb.rotate(sp2 * 0.8); cb.scale(1, 0.4 + 0.6 * Math.abs(sp2)); cb.fillStyle = l.c; cb.beginPath(); cb.ellipse(0, 0, 6 * l.s, 3 * l.s, 0, 0, 7); cb.fill(); cb.restore(); });
      // fireflies (night) or butterflies (day) over the meadow
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; flies.forEach(function (q) { var x = q.x0 + Math.sin(tt * 0.3 + q.ph) * 40, y = q.y0 + Math.sin(tt * 0.5 + q.ph * 2) * 16, a = Math.pow(Math.max(0, Math.sin(tt * 1.1 + q.ph * 1.7)), 2) * 0.9 + 0.08; n3_dot(cb, flyG, x, y, 12, a); cb.fillStyle = 'rgba(235,255,180,' + a + ')'; cb.beginPath(); cb.arc(x, y, 1.6, 0, 7); cb.fill(); }); cb.restore(); }
      else flies.slice(0, 2).forEach(function (q, k) { n3_butterfly(cb, q.x0 + Math.sin(tt * 0.25 + q.ph) * 60, q.y0 + Math.sin(tt * 0.6 + q.ph) * 20, ph ? 0.9 : 1.2, tt, q.ph, k ? '#F7B84A' : '#F28BB0', k ? '#F48A5A' : '#B8A2F0'); });
      // the paper airplane and its dotted trail
      if (T > 0 && T < DUR + 0.2) { var P = planeAt(Math.min(T, DUR)), P2 = planeAt(Math.min(T, DUR) - 0.04), ang = Math.atan2(P.y - P2.y, P.x - P2.x), sc = (ph ? 1.4 : 2.2) * (0.85 + 0.35 * P.z) * Math.min(1, 0.4 + P.u * 8, 0.3 + (1 - P.u) * 7);
        var hidden = P.z < -0.2 && Math.abs(P.x - Tr.x) < W * 0.05;
        plane.forEach(function (p) { var a = (1 - (t - p.t0) / 1.4) * 0.7; if (p.z < -0.2 && Math.abs(p.x - Tr.x) < W * 0.05) return; cb.fillStyle = dk ? 'rgba(255,255,255,' + a + ')' : 'rgba(255,255,255,' + a + ')'; cb.beginPath(); cb.arc(p.x, p.y, 1.6, 0, 7); cb.fill(); });
        if (!hidden) paperPlane(P.z < 0 ? ca : cb, P.x, P.y, ang, sc); }
      cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; sparks.forEach(function (s) { var u = (t - s.t0) / 1.2; n3_dot(cb, sparkG, s.x, s.y - u * 16, 9, Math.sin(Math.PI * u) * 0.7); cb.fillStyle = 'rgba(255,250,220,' + Math.sin(Math.PI * u) + ')'; n3_cspark(cb, s.x, s.y - u * 16, 3.5); }); cb.restore();
    },
    finish: function (t) { var T = t - T0; if (!(T >= 0 && T < DUR + 0.5)) T0 = t; }
  };
};
UIC.treehouse = {L: ['#5A7A3C', '#3C5626', 'rgba(255,255,250,0.86)', '#1E2A16', '#58664C', '#3F7A2E', '#3F7A2E', '#5A9A3A', '#FFFFFF'], D: ['#1E2C44', '#0E1628', 'rgba(16,24,40,0.80)', '#EEF2E8', '#AEB8A8', '#F4C46A', '#F4C46A', '#F8D898', '#141E10']};
