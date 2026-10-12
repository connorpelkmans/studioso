// ---- batch n7: saltflats (Mirror Flats)
// Every shape helper here winds clockwise, so overlapping shapes in one layer slot always union (never punch holes).
function n7_cw(pts) { var a = 0, n = pts.length; for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; }
function n7_P(pts) { return poly(n7_cw(pts)); }
function n7_C(x, y, r) { return 'M' + PT(x - r, y) + ' a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(2 * r) + ' 0 a' + n1(r) + ' ' + n1(r) + ' 0 1 1 ' + n1(-2 * r) + ' 0 Z '; }
function n7_E(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }

// =============== 1. Mirror Flats: a white salt flat under a thin sheet of water that mirrors the sky, with hexagonal crust where it's dry
// a flat-bottomed cumulus built from puffs: base (shadowed), lit tops toward the sun, a bright rim and a flat underside
function n7_cloud(x, y, w, h, rnd, sunX) { var o = {base: '', lit: '', rim: ''}, n = 5 + Math.floor(w / 60), lean = sunX > x ? 1 : -1, puffs = [], i;
  for (i = 0; i < n; i++) { var u = i / (n - 1), bump = Math.sin(Math.PI * Math.pow(u, 0.9)), r = h * (0.28 + 0.5 * bump) * (0.8 + rnd() * 0.45); puffs.push([x - w / 2 + u * w + (rnd() - 0.5) * w * 0.05, y - r * 0.5 - bump * h * 0.18, r]); }
  // a second row of towers on top, off-centre
  for (i = 0; i < Math.max(2, n - 3); i++) { var u2 = 0.22 + 0.56 * i / Math.max(1, n - 4) + (rnd() - 0.5) * 0.08, r2 = h * (0.3 + 0.28 * Math.sin(Math.PI * u2)) * (0.75 + rnd() * 0.4); puffs.push([x - w / 2 + u2 * w, y - h * 0.62 - r2 * 0.5, r2]); }
  puffs.forEach(function (p, j) { o.base += n7_C(p[0], p[1], p[2]); o.lit += n7_C(p[0] + lean * p[2] * 0.14, p[1] - p[2] * 0.2, p[2] * 0.84); if (j >= n || p[2] > h * 0.5) o.rim += n7_C(p[0] + lean * p[2] * 0.22, p[1] - p[2] * 0.36, p[2] * 0.58); });
  o.base += n7_E(x, y - h * 0.08, w * 0.54, h * 0.14); return o; }
// mirror a path string about the water line y = hy: absolute M/L points flip, relative arcs flip their sweep and dy, relative curves and v negate y
// (mirrored shapes all wind the other way, so shapes in one slot still union)
function n7_flipD(d, hy) { return d.replace(/([MLaZhvqtc])([^MLaZhvqtc]*)/g, function (m, cmd, args) { var n = args.trim() ? args.trim().split(/[\s,]+/).map(parseFloat) : [], i;
  if (cmd === 'M' || cmd === 'L') { for (i = 1; i < n.length; i += 2) n[i] = n1(2 * hy - n[i]); }
  else if (cmd === 'a') { for (i = 0; i + 6 < n.length + 1; i += 7) { n[i + 4] = n[i + 4] ? 0 : 1; n[i + 6] = -n[i + 6]; } }
  else if (cmd === 'v') n = n.map(function (q) { return -q; });
  else if (cmd === 'q' || cmd === 't' || cmd === 'c') { for (i = 1; i < n.length; i += 2) n[i] = -n[i]; }
  return cmd + (n.length ? n.join(' ') : '') + ' '; }); }

SCENES.saltflats = function (W, H, dk, rnd) {
  var ph = H > W, hy = Math.round(H * (ph ? 0.47 : 0.52)), far = Lay(dk ? 0.4 : 1.2), refl = Lay(dk ? 0.7 : 0.9), mid = Lay(0), near = Lay(0), S = ph ? 0.62 : Math.min(1.15, H / 800), i, x, k, cx = W * 0.5;
  var hf = hy / H * 100, C = dk ? ['#080B26', '#141A44', '#2E2D66', '#57487E'] : ['#97AEDC', '#C2B6E2', '#F2C2D0', '#FFE2C2'];
  var R = C.map(function (c, j) { return mix(c, dk ? '#06081C' : '#8A7AB0', dk ? 0.18 : 0.1 + j * 0.02); });
  var sky = 'linear-gradient(180deg,' + C[0] + ' 0%,' + C[1] + ' ' + n1(hf * 0.38) + '%,' + C[2] + ' ' + n1(hf * 0.74) + '%,' + C[3] + ' ' + n1(hf) + '%,' + C[3] + ' 100%)';
  var bh = H - hy, bp = function (f) { return n1(hy * f / bh * 100) + '%'; };
  var band = {top: hy, bg: 'linear-gradient(180deg,' + R[3] + ' 0%,' + R[2] + ' ' + bp(0.26) + ',' + R[1] + ' ' + bp(0.62) + ',' + R[0] + ' ' + bp(1) + ')'};
  // the low sun (and its twin in the water), or the moon and the stars and theirs
  var sunX = W * (ph ? 0.68 : 0.64), sunY = hy - H * (ph ? 0.06 : 0.075), sr = ph ? 17 : 25, mx = W * (ph ? 0.5 : 0.58), my = H * (ph ? 0.12 : 0.15), mr = ph ? 14 : 20;
  if (dk) {
    add(far, 'a', n7_C(mx, my, mr * 2.6) + n7_C(mx, 2 * hy - my, mr * 2.6), 'rgba(200,200,255,0.1)'); add(far, 'b', n7_C(mx, my, mr * 1.5) + n7_C(mx, 2 * hy - my, mr * 1.5), 'rgba(220,220,255,0.12)');
    add(far, 'c', n7_C(mx, my, mr), '#F4F0E0'); add(far, 'd', n7_C(mx - mr * 0.3, my - mr * 0.2, mr * 0.22) + n7_C(mx + mr * 0.35, my + mr * 0.3, mr * 0.15), 'rgba(200,190,170,0.5)');
    add(refl, 'a', n7_C(mx, 2 * hy - my, mr), '#CFCBD0');
    var st = '', st2 = ''; spread(0, 0, W, hy - 4, ph ? 26 : 30, ph ? 26 : 30, rnd, 1).forEach(function (c) { if (c.q < 0.62 && Math.hypot(c.x - mx, c.y - my) > mr * 2.4) { var r = 0.45 + c.r * c.r * 1.3; st += n7_C(c.x, c.y, r); st2 += n7_C(c.x, 2 * hy - c.y, r * 0.9); } });
    add(far, 'e', st, 'rgba(255,250,240,0.9)'); add(far, 'f', st2, 'rgba(235,232,255,0.6)');
  } else {
    [[3.4, 0.08], [2.2, 0.12], [1.5, 0.2]].forEach(function (q, j) { add(far, 'abc'[j], n7_C(sunX, sunY, sr * q[0]) + n7_C(sunX, 2 * hy - sunY, sr * q[0]), 'rgba(255,240,215,' + q[1] + ')'); });
    add(far, 'd', n7_C(sunX, sunY, sr), '#FFF6E2'); add(far, 'e', n7_C(sunX, 2 * hy - sunY, sr), '#FFEBD2');
    add(far, 'f', n7_E(W * 0.5, hy, W * 0.7, H * 0.012), 'rgba(255,246,230,0.55)');
  }
  // low clouds along the horizon, behind the hills
  var lowC = ''; for (i = 0; i < (ph ? 4 : 7); i++) { var lx = W * (i + 0.5) / (ph ? 4 : 7) + (rnd() - 0.5) * 60, ly = hy - H * (0.03 + rnd() * 0.03), lw = (ph ? 70 : 120) * (0.7 + rnd() * 0.6); lowC += n7_E(lx, ly, lw, 6 + rnd() * 4) + n7_C(lx - lw * 0.3, ly - 4, 9 + rnd() * 6) + n7_C(lx + lw * 0.1, ly - 6, 11 + rnd() * 7); }
  add(far, 'g', lowC + n7_flipD(lowC, hy), dk ? 'rgba(90,80,140,0.45)' : 'rgba(255,226,226,0.75)');
  // far low mountains: a hazy range with sunlit faces, and a darker nearer ridge on the left; all mirrored below
  var rng = [], pk = [], np = ph ? 5 : 9; for (i = 0; i <= np; i++) pk.push([-60 + (W + 120) * i / np + (rnd() - 0.5) * W / np * 0.6, hy - H * (0.022 + rnd() * (ph ? 0.035 : 0.042))]);
  for (i = 0; i < pk.length; i++) { rng.push(pk[i]); if (i < pk.length - 1) { var nx = pk[i + 1]; rng.push([(pk[i][0] + nx[0]) / 2 + (rnd() - 0.5) * 16, Math.max(pk[i][1], nx[1]) + H * (0.006 + rnd() * 0.012)]); } }
  var rough = []; for (i = 0; i < rng.length - 1; i++) { var A0 = rng[i], B0 = rng[i + 1]; for (var j0 = 0; j0 < 4; j0++) { var f0 = j0 / 4; rough.push([A0[0] + (B0[0] - A0[0]) * f0, A0[1] + (B0[1] - A0[1]) * f0 + (j0 ? (rnd() - 0.5) * 3 : 0)]); } } rough.push(rng[rng.length - 1]);
  var mtn = n7_P(rough.concat([[W + 60, hy], [-60, hy]])), lit2 = '';
  for (k = 0; k < rng.length - 1; k += 2) { var p = rng[k], q2 = rng[k + 1]; lit2 += n7_P([p, [q2[0], q2[1]], [q2[0] - (q2[0] - p[0]) * 0.1, hy], [p[0] + (q2[0] - p[0]) * 0.25, hy], [p[0] + (q2[0] - p[0]) * 0.12, p[1] + (hy - p[1]) * 0.5]]); }
  add(far, 'h', mtn, dk ? '#262650' : '#A898C8');
  add(refl, 'b', n7_flipD(mtn, hy), dk ? '#1C1C44' : '#9C8CC0');
  var near2 = []; for (x = -60; x <= W * (ph ? 0.5 : 0.36); x += 10) { var u = (x + 60) / (W * (ph ? 0.5 : 0.36) + 60); near2.push([x, hy - H * (ph ? 0.05 : 0.06) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1)), 0.7) * (0.85 + 0.15 * Math.sin(x / 9))]); }
  var mesa = n7_P(near2.concat([[near2[near2.length - 1][0], hy], [-60, hy]]));
  add(mid, 'a', lit2, dk ? '#30305E' : '#B8A8D2'); add(mid, 'b', mesa, dk ? '#1E1C42' : '#8676AE');
  add(refl, 'c', n7_flipD(lit2, hy), dk ? '#24244E' : '#AA9ACA'); add(refl, 'd', n7_flipD(mesa, hy), dk ? '#16163A' : '#7C6CA4');
  stk(refl, 's', seg(-60, hy, W + 60, hy), dk ? 'rgba(170,160,220,0.45)' : 'rgba(255,248,240,0.9)', 1.4);
  // the big clouds of the sunset (thin wisps only at night) and their mirror images
  var clouds = dk ? [[0.3, 0.3, 0.3, 0.05], [0.68, 0.36, 0.26, 0.04]] : (ph ? [[0.3, 0.17, 0.62, 0.11], [0.78, 0.3, 0.5, 0.08], [0.2, 0.37, 0.36, 0.05]] : [[0.24, 0.2, 0.3, 0.13], [0.7, 0.15, 0.24, 0.1], [0.5, 0.33, 0.16, 0.06], [0.9, 0.36, 0.14, 0.05], [0.08, 0.4, 0.12, 0.04]]);
  var cb = '', cl = '', cr = '';
  if (dk) clouds.forEach(function (q) { var x0 = W * q[0], y0 = H * q[1], w0 = W * q[2] * (ph ? 1.6 : 1); for (var j = 0; j < 5; j++) { var ex = x0 + (j - 2) * w0 * 0.2 + (rnd() - 0.5) * 20, ey = y0 + (rnd() - 0.5) * 8 - Math.sin(Math.PI * j / 4) * 6; cb += n7_E(ex, ey, w0 * (0.28 + rnd() * 0.12), 5 + rnd() * 4); cl += n7_E(ex + 6, ey - 2, w0 * 0.2, 2.5 + rnd() * 1.5); } });
  else clouds.forEach(function (q) { var o = n7_cloud(W * q[0], H * q[1], W * q[2], H * q[3] * (ph ? 0.8 : 1), rnd, sunX); cb += o.base; cl += o.lit; cr += o.rim; });
  var CC = dk ? ['rgba(70,66,120,0.55)', 'rgba(130,126,190,0.45)', '#5A5A96', '#24244E'] : ['#DDB2CC', '#F6CFD6', '#FFF0E2', '#C9A2C6'], RC = CC.map(function (c) { return c.charAt(0) === '#' ? mix(c, dk ? '#0A0C24' : '#9A86B6', 0.14) : c.replace(/[\d.]+\)$/, '0.35)'); });
  add(refl, 'e', n7_flipD(cb, hy), RC[0]); add(refl, 'f', n7_flipD(cl, hy), RC[1]); add(refl, 'g', n7_flipD(cr, hy), RC[2]); 
  // perspective on the flat: ground point (X, Z) -> screen, with Z = c at the bottom edge
  var c = H - hy, P2 = function (X, Z) { var yy = hy + c * c / Z; return [cx + X * (yy - hy) / c, yy]; };
  // salt cones (harvest mounds) standing in the shallows: shaded side, sunlit side, and a reflection under each
  var cones = '', conesL = '', conesR = '';
  var cz = ph ? [[-120, 3.4], [-100, 4.4], [-84, 5.6], [-72, 7.2]] : [[-420, 3.3], [-372, 4.0], [-334, 4.9], [-302, 6.0], [-276, 7.4], [-256, 9.2]];
  cz.forEach(function (q) { var Z = c * q[1], b = P2(q[0] * (ph ? 1 : 1.2), Z), sc2 = c / Z, w = 84 * sc2 * S * (ph ? 1.4 : 1.3), h = 34 * sc2 * S * (ph ? 1.4 : 1.3), ptsT = [];
    for (var j = 0; j <= 12; j++) { var u2 = j / 12, xx = b[0] - w / 2 + u2 * w, d = Math.abs(u2 - 0.5) * 2; ptsT.push([xx, b[1] - h * Math.pow(1 - Math.pow(d, 1.5), 0.85) * (1 - 0.05 * Math.sin(u2 * 9))]); }
    cones += n7_P(ptsT.concat([[b[0] + w / 2, b[1] + 1], [b[0] - w / 2, b[1] + 1]]));
    conesR += n7_P(ptsT.filter(function (pp, j) { return j >= 4; }).concat([[b[0] + w / 2, b[1] + 1], [b[0] + w * 0.1, b[1] + 1], [b[0] - w * 0.05, b[1] - h * 0.5]]));
    conesL += n7_P(ptsT.map(function (pp) { return [pp[0], 2 * b[1] - pp[1] + 1]; }).concat([[b[0] - w / 2, b[1]], [b[0] + w / 2, b[1]]])); });
  // clouds and cones share slots (clouds only above the horizon, cones only below it)
  add(mid, 'c', cb + cones, CC[0]); add(mid, 'd', cl, CC[1]); add(mid, 'e', cr + conesR, CC[2]);
  add(mid, 'g', conesL, dk ? 'rgba(110,112,170,0.35)' : 'rgba(246,226,232,0.5)');
  // dry islands of hexagonal salt crust (near layer): a wet darker margin, white raised ridges, plates of two tones and lit crests
  var hr = (ph ? 20 : 30) * (ph ? 1 : S), hx = hr * 1.5, hz = hr * Math.sqrt(3), thick = '', margin = '', ridge = '', plate = '', plate2 = '', crest = '';
  var patches = ph ? [[-150, 1.05, 160, 0.42], [175, 1.15, 150, 0.5], [50, 2.2, 80, 0.3], [-40, 3.4, 70, 0.45], [120, 4.4, 100, 0.7]] : [[-470, 1.0, 330, 0.36], [500, 1.08, 300, 0.46], [150, 2.1, 130, 0.26], [-40, 3.1, 150, 0.45], [360, 3.8, 230, 0.6], [-330, 5.2, 200, 0.9]];
  var inPatch = function (X, Z) { for (var j = 0; j < patches.length; j++) { var pp = patches[j], dx2 = (X - pp[0]) / pp[2], dz = (Z / c - pp[1]) / pp[3], n = 1 + 0.18 * Math.sin(X * 0.05 + Z * 0.03 + j) + 0.1 * Math.sin(X * 0.13 - j); if (dx2 * dx2 + dz * dz < n) return true; } return false; };
  for (var zi = 0; zi < 400; zi++) { var Zc = c * 0.86 + zi * hz * 0.5; if (Zc > c * 7) break;
    for (var xi = -60; xi <= 60; xi++) { var Xc = xi * hx, odd = ((xi % 2) + 2) % 2; if ((zi % 2) !== odd || !inPatch(Xc, Zc)) continue;
      var pc = P2(Xc, Zc); if (pc[0] < -100 || pc[0] > W + 100) continue;
      var hexA = [], hexB = [], hexC = []; for (var a = 0; a < 6; a++) { var an = a * Math.PI / 3, ox = Math.cos(an) * hr, oz = Math.sin(an) * hr; hexA.push(P2(Xc + ox * 1.14, Zc + oz * 1.14)); hexB.push(P2(Xc + ox * 1.02, Zc + oz * 1.02)); hexC.push(P2(Xc + ox * 0.8, Zc + oz * 0.8)); }
      thick += n7_P(hexA.map(function (q) { return [q[0], q[1] + Math.max(0.6, (q[1] - hy) * 0.012)]; })); margin += n7_P(hexA); ridge += n7_P(hexB); if (rnd() < 0.5) plate += n7_P(hexC); else plate2 += n7_P(hexC);
      crest += pline([hexC[3], hexC[4], hexC[5], hexC[0]]); } }
  add(near, 'a', thick, dk ? '#181838' : '#B8A0BC'); add(near, 'b', margin, dk ? '#2A2A56' : '#DCC8D6'); add(near, 'c', ridge, dk ? '#A2A2D2' : '#FFFAF4'); add(near, 'd', plate, dk ? '#6E70A4' : '#EEE2E6'); add(near, 'e', plate2, dk ? '#76789E' : '#F3E9EA');
  stk(near, 's', crest, dk ? 'rgba(210,214,255,0.45)' : 'rgba(255,255,255,0.9)', ph ? 0.8 : 1.1);
  if (ANIM) {
    ANIM.hy = hy; ANIM.sun = [sunX, sunY, sr]; ANIM.S = S * (ph ? 0.9 : 1); ANIM.ph = ph; ANIM.c = c;
    ANIM.cloudD = cb; ANIM.cloudRD = n7_flipD(cb, hy); ANIM.coneD = cones + conesL; ANIM.moon = dk ? [mx, my, mr] : null;
  }
  return {sky: sky, band: band, far: far, refl: refl, mid: mid, near: near};
};
