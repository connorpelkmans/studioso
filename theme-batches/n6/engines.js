// Study Fields batch n6 engines: film, culinary, marinebio
function n6_ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function n6_env(T, a, b, c, d) { if (T < a || T > d) return 0; if (T < b) return n6_ease((T - a) / (b - a)); if (T <= c) return 1; return 1 - n6_ease((T - c) / (d - c)); }
var n6_gc = null;
function n6_ctx() { return n6_gc || (n6_gc = document.createElement('canvas').getContext('2d')); }
// radial glow centred on 0,0 with radius r that fades to transparent (col is an rgba() string)
function n6_rg(col, r, mid) { var g = n6_ctx().createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, col); if (mid) g.addColorStop(mid[0], col.replace(/[\d.]+\)$/, mid[1] + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); return g; }
function n6_dot(c, g, x, y, r, a) { if (a <= 0.003 || r <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y); c.scale(r, r); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
function n6_blinkAt(t, seed) { var u = (t * 0.31 + seed * 3.7) % 4.3; return u < 0.12 ? Math.abs(u - 0.06) / 0.06 : 1; }
var n6_INK = '#3A2A3A', n6_BLUSH = 'rgba(255,120,150,0.45)';
function n6_eyes(c, x, y, gap, r, blink, happy) { c.fillStyle = n6_INK; c.strokeStyle = n6_INK;
  if (happy) { c.lineWidth = r * 0.8; c.lineCap = 'round'; c.beginPath(); c.arc(x - gap, y + r * 0.6, r * 1.2, Math.PI * 1.15, Math.PI * 1.85); c.moveTo(x + gap + r * 1.2 * Math.cos(Math.PI * 1.15), y + r * 0.6 + r * 1.2 * Math.sin(Math.PI * 1.15)); c.arc(x + gap, y + r * 0.6, r * 1.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); return; }
  if (blink < 0.25) { c.lineWidth = r * 0.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - gap - r, y); c.lineTo(x - gap + r, y); c.moveTo(x + gap - r, y); c.lineTo(x + gap + r, y); c.stroke(); return; }
  c.beginPath(); c.ellipse(x - gap, y, r, r * blink, 0, 0, 7); c.ellipse(x + gap, y, r, r * blink, 0, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - gap + r * 0.35, y - r * 0.35, r * 0.36, 0, 7); c.arc(x + gap + r * 0.35, y - r * 0.35, r * 0.36, 0, 7); c.fill(); }
function n6_cheeks(c, x, y, gap, r) { c.fillStyle = n6_BLUSH; c.beginPath(); c.ellipse(x - gap, y, r, r * 0.62, 0, 0, 7); c.ellipse(x + gap, y, r, r * 0.62, 0, 0, 7); c.fill(); }
function n6_smile(c, x, y, r, lw) { c.strokeStyle = n6_INK; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.arc(x, y - r * 0.4, r, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); }
function n6_face(c, x, y, r, blink, happy) { n6_eyes(c, x, y - r * 0.08, r * 0.32, r * 0.1, blink, happy); n6_cheeks(c, x, y + r * 0.18, r * 0.52, r * 0.14); n6_smile(c, x, y + r * 0.2, r * (happy ? 0.2 : 0.12), Math.max(1, r * 0.06)); }
function n6_text(c, s, x, y, px, col, font, align) { c.font = (font || '800 ') + px + 'px Lexend, "Arial Rounded MT Bold", Arial, sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); }
// a sprite: draw once into an offscreen canvas (k: pixel density) and blit it
function n6_sprite(w, h, fn, k) { k = k || 2; var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k)); var o = cv.getContext('2d'); o.scale(k, k); fn(o); return cv; }
// an offscreen canvas in scene units at pixel density k (an engine's unchanging decor: the host paints it once, see eng.stat)
function n6_off(w, h, k) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k)); var o = cv.getContext('2d'); o.scale(k, k); return {cv: cv, o: o}; }
function n6_hull(pts) { pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }); var cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [], i;
  for (i = 0; i < pts.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], pts[i]) <= 0) lo.pop(); lo.push(pts[i]); }
  for (i = pts.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], pts[i]) <= 0) up.pop(); up.push(pts[i]); }
  up.pop(); lo.pop(); return lo.concat(up); }
function n6_path(c, pts) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }

// ==== n6:film ====
// ---------- Movie Palace: the picture flickers on the screen with dust in the projector beam, the reels turn, the marquee
// bulbs chase, popcorn pops in the cart. Moment: a clapperboard snaps, the screen plays a tiny silent film of a sunrise, then THE END.
ENGINES.film = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = A.ph, S = A.screen, C = A.cols, M = A.marq, G = A.glass, T0 = -99;
  var sx = S[0], sy = S[1], sw = S[2], sh = S[3];
  var bulbG = n6_rg('rgba(255,210,120,0.85)', 1), lampG = n6_rg(dk ? 'rgba(255,196,120,0.6)' : 'rgba(255,214,150,0.35)', 1, [0.3, dk ? 0.3 : 0.16]), moteG = n6_rg('rgba(255,244,214,0.9)', 1), scrG = n6_rg(dk ? 'rgba(255,236,190,0.22)' : 'rgba(255,250,230,0)', 1);
  // the projector beam: from the lens to the screen
  var L = A.lens, hull = n6_hull([L, [sx + 4, sy + 4], [sx + sw - 4, sy + 4], [sx + sw - 4, sy + sh - 4], [sx + 4, sy + sh - 4]]);
  var beamG = (function () { var g = n6_ctx().createLinearGradient(L[0], L[1], sx + sw * 0.5, sy + sh * 0.5); g.addColorStop(0, dk ? 'rgba(255,246,214,0.42)' : 'rgba(255,255,240,0.32)'); g.addColorStop(0.35, dk ? 'rgba(255,240,200,0.16)' : 'rgba(255,252,236,0.12)'); g.addColorStop(1, dk ? 'rgba(255,236,190,0.05)' : 'rgba(255,250,230,0.03)'); return g; })();
  var motes = []; for (var i = 0; i < (ph ? 22 : 46); i++) motes.push({u: Math.random(), w: Math.random() * 2 - 1, sp: 0.006 + Math.random() * 0.012, ph: Math.random() * 6.28, r: 0.8 + Math.random() * 1.6});
  function beamAt(u, w) { var tx = sx + sw * (0.5 + w * 0.48), ty = sy + sh * (0.5 + w * 0.3 * (ph ? 1 : -1)); return [L[0] + (tx - L[0]) * u, L[1] + (ty - L[1]) * u]; }
  // the silent film on the screen: sepia hills, drifting clouds, a little train puffing along
  var hillA = [], hillB = []; for (var x = 0; x <= 1.0001; x += 0.025) { hillA.push([x, 0.62 + 0.06 * Math.sin(x * 7 + 1) + 0.03 * Math.sin(x * 17)]); hillB.push([x, 0.74 + 0.05 * Math.sin(x * 5 + 3) + 0.02 * Math.sin(x * 13 + 1)]); }
  function hills(c, pts, col) { c.fillStyle = col; c.beginPath(); c.moveTo(sx, sy + sh); pts.forEach(function (p) { c.lineTo(sx + p[0] * sw, sy + p[1] * sh); }); c.lineTo(sx + sw, sy + sh); c.closePath(); c.fill(); }
  function puff(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x - r * 0.8, y + r * 0.2, r * 0.7, 0, 7); c.arc(x + r * 0.8, y + r * 0.25, r * 0.65, 0, 7); c.fill(); }
  function grain(c, t, k) { // flicker, scratches, specks and a vignette over whatever is on the screen
    var fr = Math.floor(t * 12), fl = 0.05 + 0.05 * hash(fr * 1.7);
    c.fillStyle = 'rgba(40,24,10,' + fl * k + ')'; c.fillRect(sx, sy, sw, sh);
    c.strokeStyle = 'rgba(60,40,20,' + 0.2 * k + ')'; c.lineWidth = 1;
    for (var j = 0; j < 2; j++) if (t > 0.5 && hash(fr * 3 + j) < 0.45) { var xx = sx + sw * hash(fr * 7 + j * 13); c.beginPath(); c.moveTo(xx, sy); c.lineTo(xx + (hash(fr + j) - 0.5) * 6, sy + sh); c.stroke(); }
    c.fillStyle = 'rgba(40,26,12,' + 0.5 * k + ')'; for (j = 0; j < 5; j++) { var h1 = hash(fr * 11 + j * 5); if (h1 < 0.6) { c.beginPath(); c.arc(sx + sw * hash(fr * 5 + j), sy + sh * hash(fr * 9 + j * 3), 0.8 + h1 * 2, 0, 7); c.fill(); } }
    var vg = c.createRadialGradient(sx + sw / 2, sy + sh / 2, Math.min(sw, sh) * 0.35, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * 0.62); vg.addColorStop(0, 'rgba(30,18,8,0)'); vg.addColorStop(1, 'rgba(30,18,8,' + 0.32 * k + ')'); c.fillStyle = vg; c.fillRect(sx, sy, sw, sh);
  }
  function loopFilm(c, t, f) {
    var g = c.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, '#F2E6C8'); g.addColorStop(1, '#D9C39A'); c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
    c.fillStyle = 'rgba(255,250,236,0.85)'; for (var j = 0; j < 4; j++) { var cxx = sx + ((hash(j + 1) * sw + t * (6 + j * 2) * f.s) % (sw + 120)) - 60, cyy = sy + sh * (0.14 + 0.1 * j % 0.3); puff(c, cxx, cyy, sh * (0.05 + 0.015 * j)); }
    hills(c, hillA, '#BFA174'); hills(c, hillB, '#9C7C52');
    // the train: crosses every 26 s
    var u = ((t * f.s) % 26) / 26, tx = sx - sw * 0.2 + u * sw * 1.4, ty = sy + sh * 0.86, s = sh / 120;
    c.fillStyle = 'rgba(240,230,210,0.85)'; for (j = 0; j < 5; j++) { var pu = ((t * 1.3 + j * 0.4) % 2) / 2; c.globalAlpha = 0.8 * (1 - pu); puff(c, tx + 18 * s - pu * 40 * s, ty - 26 * s - pu * 34 * s, (4 + pu * 9) * s); } c.globalAlpha = 1;
    c.fillStyle = '#4A3826'; c.fillRect(sx, ty + 6 * s, sw, 2 * s);
    c.fillRect(tx, ty - 14 * s, 26 * s, 14 * s); c.fillRect(tx - 2 * s, ty - 22 * s, 12 * s, 10 * s); c.fillRect(tx + 16 * s, ty - 24 * s, 5 * s, 10 * s);
    c.fillRect(tx - 34 * s, ty - 13 * s, 28 * s, 13 * s); c.fillRect(tx - 68 * s, ty - 13 * s, 28 * s, 13 * s);
    c.fillStyle = '#F2E6C8'; [-30, -22, -14, -64, -56, -48].forEach(function (q) { c.fillRect(tx + q * s, ty - 10 * s, 5 * s, 4 * s); });
    c.fillStyle = '#4A3826'; [4, 18, -28, -12, -62, -46].forEach(function (q) { c.beginPath(); c.arc(tx + q * s, ty + 1 * s, 3.6 * s, 0, 7); c.fill(); });
  }
  function sunrise(c, T) { // T: 0..1 through the little film
    var e = n6_ease(Math.min(1, T * 1.5)), g = c.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, e < 0.3 ? '#C9B49A' : '#F6D89A'); g.addColorStop(0.65, '#F8C27A'); g.addColorStop(1, '#F29A68'); c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
    var cxx = sx + sw * 0.5, sun = sy + sh * (0.8 - 0.46 * e), r = sh * 0.16;
    var gl = c.createRadialGradient(cxx, sun, r * 0.5, cxx, sun, r * 4.5); gl.addColorStop(0, 'rgba(255,244,200,' + (0.4 + 0.4 * e) + ')'); gl.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = gl; c.fillRect(sx, sy, sw, sh);
    c.save(); c.translate(cxx, sun); c.rotate(T * 1.4); c.fillStyle = 'rgba(255,206,110,' + (0.45 + 0.4 * e) + ')';
    for (var j = 0; j < 12; j++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(r * 1.15, -r * 0.14); c.lineTo(r * (2.1 + 0.35 * Math.sin(T * 9 + j)), 0); c.lineTo(r * 1.15, r * 0.14); c.fill(); } c.restore();
    c.fillStyle = '#FFE48A'; c.beginPath(); c.arc(cxx, sun, r, 0, 7); c.fill(); c.fillStyle = '#FFF4C8'; c.beginPath(); c.arc(cxx - r * 0.32, sun - r * 0.32, r * 0.32, 0, 7); c.fill();
    n6_face(c, cxx, sun + r * 0.1, r * 0.9, 1, e > 0.5);
    hills(c, hillA, '#C08A58'); hills(c, hillB, '#8E5E3A');
    c.fillStyle = 'rgba(255,250,236,0.9)'; for (j = 0; j < 3; j++) puff(c, sx + sw * (0.12 + 0.36 * j) + T * sw * 0.08, sy + sh * (0.2 + 0.07 * (j % 2)), sh * 0.06);
    c.strokeStyle = '#5A3A22'; c.lineWidth = Math.max(1.4, sh * 0.012); c.lineCap = 'round';
    for (j = 0; j < 4; j++) { var bx = sx + sw * (0.1 + 0.8 * ((T * 0.5 + j * 0.23) % 1)), by = sy + sh * (0.3 + 0.06 * j), fl = Math.sin(T * 30 + j * 2) * sh * 0.015, bs = sh * 0.032; c.beginPath(); c.moveTo(bx - bs, by + fl); c.quadraticCurveTo(bx - bs * 0.4, by - bs * 0.5, bx, by); c.quadraticCurveTo(bx + bs * 0.4, by - bs * 0.5, bx + bs, by + fl); c.stroke(); }
  }
  function titleCard(c, T) {
    c.fillStyle = '#1C1612'; c.fillRect(sx, sy, sw, sh);
    var m = Math.min(sw, sh) * 0.08; c.strokeStyle = '#EFE4CC'; c.lineWidth = 2; c.strokeRect(sx + m, sy + m, sw - 2 * m, sh - 2 * m); c.lineWidth = 1; c.strokeRect(sx + m * 1.35, sy + m * 1.35, sw - 2.7 * m, sh - 2.7 * m);
    c.fillStyle = '#EFE4CC'; [[sx + m, sy + m], [sx + sw - m, sy + m], [sx + m, sy + sh - m], [sx + sw - m, sy + sh - m]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(Math.PI / 4); c.fillRect(-m * 0.22, -m * 0.22, m * 0.44, m * 0.44); c.restore(); });
    var px = Math.min(sh * 0.24, sw * 0.12); c.font = 'italic 700 ' + px + 'px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F6EEDA'; c.fillText('The End', sx + sw / 2, sy + sh * 0.46);
    c.fillRect(sx + sw * 0.36, sy + sh * 0.63, sw * 0.28, 2); c.beginPath(); c.arc(sx + sw / 2, sy + sh * 0.635, 3.4, 0, 7); c.fill();
    c.font = '600 ' + Math.round(px * 0.3) + 'px Georgia, "Times New Roman", serif'; c.fillStyle = 'rgba(246,238,218,0.75)'; c.fillText('~ well done ~', sx + sw / 2, sy + sh * 0.73);
  }
  function clapper(c, T) { // T seconds into the moment
    var a = n6_env(T, 0, 0.22, 1.05, 1.4); if (a <= 0) return;
    var bw = Math.min(sw * 0.36, sh * 0.7), bh = bw * 0.62, x = sx + sw / 2 - bw / 2, y = sy + sh * 0.5 - bh * 0.3 + (1 - n6_ease(T / 0.22)) * 30 + n6_ease((T - 1.05) / 0.35) * 40;
    var open = T < 0.18 ? 0 : T < 0.42 ? n6_ease((T - 0.18) / 0.24) : T < 0.55 ? 1 - n6_ease((T - 0.42) / 0.13) : 0, snap = T > 0.55 && T < 0.9 ? 1 - (T - 0.55) / 0.35 : 0;
    c.save(); c.globalAlpha = a; c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(6, 8, bw, bh);
    c.fillStyle = '#26222A'; c.fillRect(0, 0, bw, bh);
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bw * 0.06, bh * 0.42); c.lineTo(bw * 0.94, bh * 0.42); c.moveTo(bw * 0.06, bh * 0.7); c.lineTo(bw * 0.94, bh * 0.7); c.moveTo(bw * 0.5, bh * 0.42); c.lineTo(bw * 0.5, bh * 0.94); c.stroke();
    n6_text(c, 'SCENE', bw * 0.28, bh * 0.56, Math.round(bh * 0.1), 'rgba(255,255,255,0.8)'); n6_text(c, 'TAKE', bw * 0.72, bh * 0.56, Math.round(bh * 0.1), 'rgba(255,255,255,0.8)');
    n6_text(c, 'DONE', bw * 0.28, bh * 0.83, Math.round(bh * 0.16), '#FFE08A'); n6_text(c, '1', bw * 0.72, bh * 0.83, Math.round(bh * 0.18), '#FFE08A');
    n6_text(c, 'STUDY HALL PICTURES', bw * 0.5, bh * 0.25, Math.round(bh * 0.09), 'rgba(255,255,255,0.9)');
    function stripes(w, h) { c.fillStyle = '#F4F0EA'; c.fillRect(0, 0, w, h); c.fillStyle = '#26222A'; for (var k = 0; k < 6; k++) { c.beginPath(); c.moveTo(k * w / 6 + w * 0.02, 0); c.lineTo(k * w / 6 + w / 12 + w * 0.02, 0); c.lineTo(k * w / 6 + w * 0.02, h); c.lineTo(k * w / 6 - w / 12 + w * 0.02, h); c.fill(); } }
    var sh2 = bh * 0.2; c.save(); c.translate(0, -1); c.translate(0, -sh2); stripes(bw, sh2); c.restore();
    c.save(); c.translate(0, -sh2); c.rotate(-0.55 * open); c.translate(0, -sh2 * 1.02); stripes(bw, sh2); c.restore();
    c.fillStyle = '#B8BCC8'; c.beginPath(); c.arc(bw * 0.03, -sh2, sh2 * 0.28, 0, 7); c.fill();
    if (snap > 0) { c.strokeStyle = 'rgba(255,236,170,' + snap + ')'; c.lineWidth = 3; c.lineCap = 'round'; for (var k = 0; k < 6; k++) { var an = -Math.PI * (0.15 + k * 0.14), r0 = bw * 0.62 + (1 - snap) * 18; c.beginPath(); c.moveTo(bw * 0.5 + Math.cos(an) * r0, -sh2 + Math.sin(an) * r0 * 0.6); c.lineTo(bw * 0.5 + Math.cos(an) * (r0 + 16), -sh2 + Math.sin(an) * (r0 + 16) * 0.6); c.stroke(); } }
    c.restore();
  }
  // popcorn
  var kx = G[0] + G[2] / 2, ky = G[1] + G[3] * 0.28, kr = G[2] * 0.16 / 0.84, pops = [], nextPop = 0.3, cornC = dk ? ['#FFF1C2', '#FBE39A'] : ['#FFFBEA', '#FFEFB8'];
  function corn(c, x, y, r, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = cornC[0]; c.beginPath(); c.arc(0, 0, r, 0, 7); c.arc(r * 0.8, -r * 0.3, r * 0.7, 0, 7); c.arc(-r * 0.6, -r * 0.6, r * 0.65, 0, 7); c.fill(); c.fillStyle = cornC[1]; c.beginPath(); c.arc(r * 0.2, r * 0.35, r * 0.45, 0, 7); c.fill(); c.fillStyle = '#E2A23A'; c.beginPath(); c.arc(-r * 0.2, r * 0.7, r * 0.22, 0, 7); c.fill(); c.restore(); }
  var proj = A.proj, reel = proj ? n6_sprite(proj.s * 50, proj.s * 50, function (o) { var r = proj.s * 22; o.translate(proj.s * 25, proj.s * 25); o.fillStyle = C.metal; o.beginPath(); o.arc(0, 0, r, 0, 7); o.fill(); o.fillStyle = C.booth; for (var k = 0; k < 3; k++) { var a = k * Math.PI * 2 / 3; o.beginPath(); o.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.28, 0, 7); o.fill(); } o.fillStyle = dk ? '#B8C0D0' : '#DDE2EA'; o.beginPath(); o.arc(0, 0, r * 0.16, 0, 7); o.fill(); o.strokeStyle = 'rgba(0,0,0,0.25)'; o.lineWidth = r * 0.1; o.beginPath(); o.arc(0, 0, r * 0.94, 0, 7); o.stroke(); }, 3) : null;
  return {
    maxDpr: 1.25,
    step: function (dt, t, f) {
      motes.forEach(function (m) { m.u += m.sp * dt * f.s * (dk ? 1 : 0.8); if (m.u > 1) { m.u = 0.05; m.w = Math.random() * 2 - 1; } m.w += Math.sin(t * 0.7 + m.ph) * 0.004; });
      nextPop -= dt * f.s * (t - T0 < 3 ? 3 : 1); if (nextPop <= 0) { nextPop = 0.25 + Math.random() * 0.6; if (pops.length < 26) pops.push({x: kx + (Math.random() - 0.5) * kr, y: ky + 2, vx: (Math.random() - 0.5) * G[2] * 1.6, vy: -G[3] * (0.9 + Math.random() * 0.8), r: G[2] * (0.045 + Math.random() * 0.02), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8, rest: 0}); }
      pops.forEach(function (p) { if (p.rest) { p.rest += dt; return; } p.vy += G[3] * 4.2 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.x < G[0] + p.r) { p.x = G[0] + p.r; p.vx = -p.vx * 0.6; } if (p.x > G[0] + G[2] - p.r) { p.x = G[0] + G[2] - p.r; p.vx = -p.vx * 0.6; } if (p.y < G[1] + p.r) { p.y = G[1] + p.r; p.vy = Math.abs(p.vy) * 0.4; }
        var floor = G[4] - p.r * 0.2 + Math.sin(p.x * 0.7) * 3; if (p.y > floor) { p.y = floor; if (Math.abs(p.vy) < G[3] * 0.4) { p.rest = 0.001; } else { p.vy = -p.vy * 0.3; p.vx *= 0.6; } } });
      pops = pops.filter(function (p) { return p.rest < 4; });
    },
    draw: function (ca, cb, t, f) {
      var T = t - T0, j;
      // ---- canvas A (under the seats): the picture, the beam with its dust, the popcorn ----
      ca.save(); ca.beginPath(); ca.rect(sx, sy, sw, sh); ca.clip();
      var inFilm = T > 1.15 && T < 7.2, lit = dk ? 1 : 0.55 + 0.45 * n6_env(T, 0.6, 1.2, 6.4, 7.2);
      ca.globalAlpha = lit;
      if (!inFilm) loopFilm(ca, t, f);
      else if (T < 4.3) sunrise(ca, (T - 1.15) / 3.15);
      else titleCard(ca, T - 4.3);
      if (inFilm && T > 6.6) { ca.globalAlpha = lit * n6_ease((T - 6.6) / 0.6); loopFilm(ca, t, f); ca.globalAlpha = lit; }
      var flash = n6_env(T, 0.85, 1.1, 1.15, 1.5); if (flash > 0) { ca.fillStyle = 'rgba(255,252,240,' + flash + ')'; ca.fillRect(sx, sy, sw, sh); }
      grain(ca, t, T > 4.3 && T < 6.8 ? 0.6 : 1);
      ca.globalAlpha = 1; ca.restore();
      // beam + dust
      var fl = 0.82 + 0.18 * flick(t * 2, 3) + (T > 1 && T < 7 ? 0.25 : 0);
      ca.save(); ca.globalAlpha = Math.min(1, fl * (dk ? 1 : 0.7)); ca.fillStyle = beamG; n6_path(ca, hull); ca.fill(); ca.restore();
      ca.save(); ca.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      motes.forEach(function (m) { var p = beamAt(m.u, m.w), tw = 0.5 + 0.5 * Math.sin(t * 2.3 + m.ph); n6_dot(ca, moteG, p[0], p[1], m.r * 2.4, (dk ? 0.75 : 0.6) * tw * Math.sin(Math.PI * m.u)); });
      ca.restore();
      // popcorn in the glass
      ca.save(); ca.beginPath(); ca.rect(G[0], G[1], G[2], G[3]); ca.clip();
      pops.forEach(function (p) { ca.globalAlpha = p.rest > 3 ? 4 - p.rest : 1; corn(ca, p.x, p.y, p.r, p.rot); }); ca.globalAlpha = 1;
      var glare = ca.createLinearGradient(G[0], G[1], G[0] + G[2], G[1] + G[3]); glare.addColorStop(0, 'rgba(255,255,255,0.28)'); glare.addColorStop(0.5, 'rgba(255,255,255,0)'); ca.fillStyle = glare; ca.fillRect(G[0], G[1], G[2], G[3]);
      if (dk) { ca.globalCompositeOperation = 'lighter'; n6_dot(ca, lampG, kx, ky + G[3] * 0.2, G[2] * 0.7, 0.55); }
      ca.restore();
      // ---- canvas B (on top): reels, marquee, glows, the clapperboard ----
      if (proj && reel) { [[-18, -40], [20, -40]].forEach(function (q, k) { cb.save(); cb.translate(proj.x + q[0] * proj.s, proj.y + q[1] * proj.s); cb.rotate(t * (k ? 1.6 : 1.9) * f.s); cb.drawImage(reel, -proj.s * 25, -proj.s * 25, proj.s * 50, proj.s * 50); cb.restore(); });
        cb.strokeStyle = C.metal; cb.lineWidth = Math.max(1, proj.s * 1.6); cb.beginPath(); cb.moveTo(proj.x - 18 * proj.s, proj.y - 18 * proj.s); cb.lineTo(proj.x - 12 * proj.s, proj.y - 16 * proj.s); cb.moveTo(proj.x + 20 * proj.s, proj.y - 18 * proj.s); cb.lineTo(proj.x + 14 * proj.s, proj.y - 16 * proj.s); cb.stroke(); }
      // the marquee: lettering and chasing bulbs
      var mx = M[0], my = M[1], mw = M[2], mh = M[3], big = T > 0 && T < 6;
      n6_text(cb, ph ? 'NOW SHOWING' : 'NOW  SHOWING', mx + mw / 2, my + mh * 0.54, Math.round(mh * 0.48), C.plum, '900 ');
      var nB = A.bulbs.length, chase = t * 7 * f.s;
      cb.save(); if (dk) cb.globalCompositeOperation = 'lighter';
      A.bulbs.forEach(function (b, k) { var on = big ? (Math.floor(t * 6) % 2 ? 1 : 0.35) : ((k - chase) % 4 + 4) % 4 < 2 ? 1 : 0.25; n6_dot(cb, bulbG, b[0], b[1], (ph ? 7 : 10) * (0.7 + 0.3 * on), on * (dk ? 0.9 : 0.6)); });
      cb.restore();
      A.bulbs.forEach(function (b, k) { var on = big ? (Math.floor(t * 6) % 2 ? 1 : 0.35) : ((k - chase) % 4 + 4) % 4 < 2 ? 1 : 0.25; cb.fillStyle = on > 0.5 ? '#FFF4C8' : (dk ? '#8A6A3A' : '#E8C878'); cb.beginPath(); cb.arc(b[0], b[1], ph ? 2.2 : 2.9, 0, 7); cb.fill(); });
      // POPCORN on the cart roof
      var ct = A.cart; n6_text(cb, 'POPCORN', ct[0], ct[1], Math.round(ct[2] * (ph ? 0.12 : 0.13)), '#FFF4D0', '900 ');
      // warm lamps: sconces and footlights
      cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      A.sconces.forEach(function (s, k) { n6_dot(cb, lampG, s[0], s[1] - 4 * s[2], (dk ? 110 : 70) * s[2], (dk ? 0.8 : 0.6) * (0.92 + 0.08 * Math.sin(t * 1.3 + k))); });
      A.foot.forEach(function (p, k) { n6_dot(cb, lampG, p[0], p[1], ph ? 14 : 22, (dk ? 0.6 : 0.35) * (0.85 + 0.15 * Math.sin(t * 2 + k))); });
      if (dk) n6_dot(cb, n6_rg('rgba(255,236,190,0.5)', 1), A.lens[0], A.lens[1], 26, 0.9 * fl);
      cb.restore();
      // the screen's light falling on the room at night
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; cb.globalAlpha = 0.5 * fl; cb.translate(sx + sw / 2, sy + sh * 0.6); cb.scale(sw * 0.75, sh * 1.1); cb.fillStyle = scrG; cb.beginPath(); cb.arc(0, 0, 1, 0, 7); cb.fill(); cb.restore(); }
      if (T >= 0 && T < 1.5) clapper(cb, T);
    },
    finish: function (t) { T0 = t; }
  };
};
UIC.film = {L: ['#8E2A36', '#5A1E2E', 'rgba(255,251,245,0.86)', '#2E1418', '#74585A', '#A8303E', '#A8303E', '#C0503A', '#FFFFFF'], D: ['#3A1A2A', '#1A0E16', 'rgba(30,16,26,0.8)', '#F8EEEE', '#C2A8B0', '#F2C46A', '#F2C46A', '#F6D592', '#2A1220']};
// ==== /n6:film ====
// ==== n6:culinary ====
// ---------- Test Kitchen: pots simmer and the stockpot lid rattles, steam rises, herbs sway in the window box, order tickets
// flutter on the rail, the heat lamps glow. Moment: the pan flips the omelette high into the air, it lands, and a pinch of herbs falls on top.
ENGINES.culinary = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = A.ph, C = A.cols, Wn = A.win, T0 = -99, ctop = A.ctop;
  var steamG = n6_rg(dk ? 'rgba(230,226,240,0.35)' : 'rgba(255,255,255,0.75)', 1, [0.4, dk ? 0.18 : 0.4]), lampG = n6_rg(dk ? 'rgba(255,160,70,0.6)' : 'rgba(255,170,90,0.4)', 1, [0.3, dk ? 0.3 : 0.18]);
  var flameG = n6_rg('rgba(90,150,255,0.7)', 1), sparkG = n6_rg('rgba(255,250,220,0.95)', 1, [0.25, 0.5]), ovenG = n6_rg('rgba(255,150,60,0.55)', 1);
  var clock = null, puffs = [], nextPuff = 0, rattle = 0, nextRattle = 2.5, gust = 0, nextGust = 4, flecks = [], sparks = [];
  var herbP = A.herbs.map(function (h) { return {h: h, p: new Path2D(n6_herb(0, 0, h.kind, h.s)), ph: h.x * 0.07}; });
  var herbC = dk ? ['#4E8A4A', '#3E7A52', '#5A9A4A'] : ['#5DA84E', '#4A8E5E', '#72BE5A'];
  var tk = A.tickets.map(function (q) { return {x: q[0], y: q[1], s: q[2], k: q[3], a: 0, va: 0, lines: [0.5 + hash(q[3] + 1) * 0.4, 0.4 + hash(q[3] + 2) * 0.5, 0.6 + hash(q[3] + 3) * 0.3, 0.3 + hash(q[3] + 4) * 0.4]}; });
  var TC = ['#E25A4A', '#3E9E6A', '#F2A33A', '#4A86D8'];
  var clouds = dk ? [] : [0, 1].map(function (i) { return {x: Wn[0] + Wn[2] * (0.2 + 0.5 * i), y: Wn[1] + Wn[3] * (0.16 + 0.12 * i), s: Wn[2] / (ph ? 260 : 300) * (1 - i * 0.2), v: 3 + i * 2}; });
  var stars = []; if (dk) for (var i = 0; i < 14; i++) stars.push([Wn[0] + Wn[2] * hash(i + 4), Wn[1] + Wn[3] * 0.5 * hash(i + 9), hash(i + 13) * 6]);
  var PX = A.pan[0], PY = A.pan[1] - 7, PW = A.pan[2], S = A.stock;
  // ---- unchanging decor, painted once: steel shading, oven glass, a dish towel, the chalkboard menu, a clock, window light ----
  var K = Math.min(1.5, Math.max(1.15, (window.devicePixelRatio || 1) * 0.9)), dec = n6_off(W, H, K), o = dec.o;
  (function () {
    var g = o.createLinearGradient(0, ctop, 0, H); g.addColorStop(0, 'rgba(255,255,255,' + (dk ? 0.08 : 0.3) + ')'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (dk ? 0.2 : 0.1) + ')'); o.fillStyle = g; o.fillRect(0, ctop + H * 0.024, W, H);
    o.fillStyle = 'rgba(255,255,255,' + (dk ? 0.18 : 0.6) + ')'; o.fillRect(0, ctop, W, 2);
    A.ovens.forEach(function (r) { o.save(); o.beginPath(); o.rect(r[0], r[1], r[2], r[3]); o.clip(); o.fillStyle = 'rgba(255,255,255,' + (dk ? 0.05 : 0.12) + ')'; for (var k = 0; k < 2; k++) { o.beginPath(); o.moveTo(r[0] + r[2] * (0.15 + k * 0.2), r[1]); o.lineTo(r[0] + r[2] * (0.27 + k * 0.2), r[1]); o.lineTo(r[0] + r[2] * (0.12 + k * 0.2), r[1] + r[3]); o.lineTo(r[0] + r[2] * (0.0 + k * 0.2), r[1] + r[3]); o.fill(); } o.restore(); });
    var k;

    // the window's light falling across the wall by day
    var wn = A.win; if (!dk) { var lg = o.createLinearGradient(wn[0], wn[1], wn[0] + W * 0.25, wn[1] + H * 0.45); lg.addColorStop(0, 'rgba(255,248,220,0.38)'); lg.addColorStop(1, 'rgba(255,248,220,0)'); o.fillStyle = lg; o.beginPath(); o.moveTo(wn[0] + wn[2], wn[1]); o.lineTo(wn[0] + wn[2] + W * 0.22, wn[1] + H * 0.36); o.lineTo(wn[0] + wn[2] + W * 0.08, wn[1] + wn[3] + H * 0.4); o.lineTo(wn[0] + wn[2], wn[1] + wn[3]); o.fill(); }
    // the range front: knob bezels and pointers, framed oven windows, a control-panel seam, a maker's plate, vents and a kick plate
    var kr = ph ? 6 : 8, ky = ctop + H * 0.045;
    A.burners.forEach(function (b, i) { o.fillStyle = 'rgba(255,255,255,' + (dk ? 0.12 : 0.55) + ')'; o.beginPath(); o.arc(b[0], ky, kr + 3, 0, 7); o.fill(); o.fillStyle = dk ? '#2E2C36' : '#5A5E6A'; o.beginPath(); o.arc(b[0], ky, kr, 0, 7); o.fill();
      o.strokeStyle = dk ? '#C9C2B4' : '#FFFFFF'; o.lineWidth = 2; o.lineCap = 'round'; var a = -Math.PI / 2 + (i - 1) * 0.6; o.beginPath(); o.moveTo(b[0] + Math.cos(a) * kr * 0.2, ky + Math.sin(a) * kr * 0.2); o.lineTo(b[0] + Math.cos(a) * kr * 0.8, ky + Math.sin(a) * kr * 0.8); o.stroke();
      o.fillStyle = 'rgba(255,255,255,' + (dk ? 0.12 : 0.35) + ')'; o.beginPath(); o.arc(b[0] - kr * 0.35, ky - kr * 0.35, kr * 0.3, 0, 7); o.fill(); });
    o.fillStyle = 'rgba(0,0,0,' + (dk ? 0.22 : 0.08) + ')'; o.fillRect(0, ctop + H * (ph ? 0.05 : 0.066), W, 2); o.fillStyle = 'rgba(255,255,255,' + (dk ? 0.06 : 0.4) + ')'; o.fillRect(0, ctop + H * (ph ? 0.05 : 0.066) + 2, W, 1.5);
    A.ovens.forEach(function (r) { o.strokeStyle = 'rgba(255,255,255,' + (dk ? 0.14 : 0.6) + ')'; o.lineWidth = 3; o.beginPath(); o.roundRect ? o.roundRect(r[0] - 5, r[1] - 5, r[2] + 10, r[3] + 10, 11) : o.rect(r[0] - 5, r[1] - 5, r[2] + 10, r[3] + 10); o.stroke();
      o.strokeStyle = 'rgba(0,0,0,' + (dk ? 0.3 : 0.12) + ')'; o.lineWidth = 1.5; o.beginPath(); o.roundRect ? o.roundRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2, 9) : o.rect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); o.stroke(); });
    var pmx = ph ? W * 0.5 : (A.burners[1][0] + A.burners[2][0]) / 2, pmy = ky; o.fillStyle = dk ? '#8A7448' : '#C8A45A'; o.beginPath(); o.roundRect ? o.roundRect(pmx - 26, pmy - 6, 52, 12, 4) : o.rect(pmx - 26, pmy - 6, 52, 12); o.fill(); n6_text(o, 'TEST KITCHEN', pmx, pmy + 0.5, 6.5, dk ? '#2A2418' : '#5A4420', '800 ');
    o.fillStyle = 'rgba(0,0,0,' + (dk ? 0.3 : 0.14) + ')'; o.fillRect(0, H - H * 0.03, W, H * 0.03); o.fillStyle = 'rgba(255,255,255,' + (dk ? 0.05 : 0.3) + ')'; o.fillRect(0, H - H * 0.03, W, 1.5);
    if (!ph) { for (k = 0; k < 6; k++) { o.fillStyle = 'rgba(0,0,0,' + (dk ? 0.3 : 0.15) + ')'; o.beginPath(); o.roundRect ? o.roundRect(W * 0.835 + k * W * 0.022, ctop + H * 0.115, W * 0.012, H * 0.035, 3) : o.rect(W * 0.835 + k * W * 0.022, ctop + H * 0.115, W * 0.012, H * 0.035); o.fill(); } }
    // a striped dish towel over the left oven handle (after the oven's details: it hangs in front of the door)
    var ov = A.ovensX[0], tx = ov[0] + (ov[1] - ov[0]) * (ph ? 0.7 : 0.66), tw = W * (ph ? 0.09 : 0.045), ty = A.oy - 2, th = H * (ph ? 0.075 : 0.095);
    o.fillStyle = 'rgba(0,0,0,0.12)'; o.beginPath(); o.moveTo(tx + 3, ty + 4); o.lineTo(tx + tw + 3, ty + 4); o.lineTo(tx + tw * 1.02 + 3, ty + th + 3); o.lineTo(tx + 1, ty + th + 3); o.fill();
    o.fillStyle = dk ? '#C9C2B4' : '#FFFFFF'; o.beginPath(); o.moveTo(tx, ty); o.lineTo(tx + tw, ty); o.lineTo(tx + tw * 1.02, ty + th); o.lineTo(tx - tw * 0.02, ty + th); o.fill();
    o.fillStyle = dk ? 'rgba(168,70,62,0.75)' : 'rgba(226,90,74,0.7)'; for (k = 0; k < 5; k++) o.fillRect(tx - tw * 0.01, ty + th * (0.24 + k * 0.15), tw * 1.02, th * 0.06); for (k = 0; k < 3; k++) o.fillRect(tx + tw * (0.18 + k * 0.28), ty, tw * 0.08, th);
    o.fillStyle = 'rgba(0,0,0,0.12)'; o.fillRect(tx, ty, tw, th * 0.12);
    o.fillStyle = dk ? '#B8B0A2' : '#F2EEE6'; o.beginPath(); o.moveTo(tx - 2, ty - 6); o.lineTo(tx + tw + 2, ty - 6); o.lineTo(tx + tw, ty + th * 0.16); o.lineTo(tx, ty + th * 0.16); o.fill();
    o.fillStyle = dk ? 'rgba(168,70,62,0.75)' : 'rgba(226,90,74,0.7)'; for (k = 0; k < 3; k++) o.fillRect(tx + tw * (0.18 + k * 0.28), ty - 6, tw * 0.08, th * 0.16 + 6);
    if (!A.clock) return;
    // a round wall clock (its hands move on canvas B)
    var cx = A.clock[0], cy = A.clock[1], cr = A.clock[2]; o.fillStyle = dk ? '#3A3A44' : '#E25A4A'; o.beginPath(); o.arc(cx, cy, cr + 4, 0, 7); o.fill(); o.fillStyle = dk ? '#E8E2D6' : '#FFFFFF'; o.beginPath(); o.arc(cx, cy, cr, 0, 7); o.fill();
    o.fillStyle = '#3A3440'; for (k = 0; k < 12; k++) { var a = k * Math.PI / 6; o.beginPath(); o.arc(cx + Math.cos(a) * cr * 0.8, cy + Math.sin(a) * cr * 0.8, k % 3 ? 1 : 1.8, 0, 7); o.fill(); }
    clock = [cx, cy, cr];
  })();
  // the chalkboard's writing (the board itself is in the scene): on canvas A, under the utensils standing in front of it
  var BD = A.board, chalk = BD ? n6_sprite(BD[2], BD[3] + 12, function (o) { var bw = BD[2], bh = BD[3], ch = 'rgba(250,248,240,0.88)';
    o.fillStyle = 'rgba(255,255,255,0.05)'; o.fillRect(0, 0, bw, bh * 0.4);
    o.fillStyle = 'rgba(255,255,255,0.04)'; [[0.3, 0.6, 0.4], [0.7, 0.3, 0.3]].forEach(function (q) { o.beginPath(); o.ellipse(bw * q[0], bh * q[1], bw * q[2], bh * 0.12, -0.2, 0, 7); o.fill(); });   // old chalk smudges
    n6_text(o, "TODAY'S SPECIALS", bw / 2, bh * 0.14, Math.round(bw * 0.075), '#F6D38A', '800 ');
    o.fillStyle = ch; o.fillRect(bw * 0.2, bh * 0.24, bw * 0.6, 1.5);
    [['Herb Omelette', 0.38], ['Garden Soup', 0.55], ['Lemon Tart', 0.72]].forEach(function (q) { n6_text(o, q[0], bw * 0.08, bh * q[1], Math.round(bw * 0.075), ch, '600 ', 'left'); });
    o.strokeStyle = ch; o.lineWidth = 1.5; o.beginPath(); o.ellipse(bw * 0.88, bh * 0.38, 7, 5, 0, 0, 7); o.stroke(); o.fillStyle = '#F6D38A'; o.beginPath(); o.arc(bw * 0.88, bh * 0.38, 2.4, 0, 7); o.fill();
    o.strokeStyle = '#9ADB8A'; o.beginPath(); o.moveTo(bw * 0.84, bh * 0.88); o.quadraticCurveTo(bw * 0.9, bh * 0.8, bw * 0.95, bh * 0.84); o.quadraticCurveTo(bw * 0.9, bh * 0.92, bw * 0.84, bh * 0.88); o.stroke();
    o.fillStyle = '#FFFFFF'; o.fillRect(bw * 0.6, bh + 3, 16, 4); }, 2) : null;
  function omelette(c, x, y, rx, ry, rot, sy) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, sy);
    c.fillStyle = '#F4C64A'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = '#FBDD72'; c.beginPath(); c.ellipse(-rx * 0.1, -ry * 0.15, rx * 0.8, ry * 0.6, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(214,140,40,0.55)'; [[-0.4, 0.1, 0.12], [0.25, -0.2, 0.09], [0.5, 0.25, 0.08], [-0.1, 0.35, 0.07]].forEach(function (q) { c.beginPath(); c.ellipse(q[0] * rx, q[1] * ry, q[2] * rx, q[2] * rx * 0.5, 0, 0, 7); c.fill(); });
    c.strokeStyle = 'rgba(200,130,40,0.6)'; c.lineWidth = Math.max(1, ry * 0.12); c.beginPath(); c.ellipse(0, ry * 0.05, rx * 0.82, ry * 0.5, 0, Math.PI * 0.1, Math.PI * 0.9); c.stroke(); c.restore(); }
  function pan(c, x, y, rot) { var rx = PW / 2, ry = PW * 0.16; c.save(); c.translate(x, y); c.rotate(rot);
    c.strokeStyle = dk ? '#26242C' : '#3A3A44'; c.lineCap = 'round'; c.lineWidth = PW * 0.06; c.beginPath(); c.moveTo(rx * 0.9, -ry * 0.1); c.lineTo(rx * 1.7, -ry * 0.75); c.stroke();
    c.strokeStyle = C.utens; c.lineWidth = PW * 0.075; c.beginPath(); c.moveTo(rx * 1.45, -ry * 0.55); c.lineTo(rx * 1.9, -ry * 0.95); c.stroke();
    c.fillStyle = dk ? '#26242C' : '#3A3A44'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI); c.lineTo(-rx, -ry * 0.1); c.ellipse(0, -ry * 0.1, rx, ry, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = dk ? '#3E3C46' : '#55555F'; c.beginPath(); c.ellipse(0, -ry * 0.18, rx * 0.88, ry * 0.78, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(-rx * 0.35, -ry * 0.4, rx * 0.3, ry * 0.18, -0.1, 0, 7); c.fill(); c.restore(); }
  function lid(c, x, y, w, rot, lift) { c.save(); c.translate(x, y - lift); c.rotate(rot); var hw = w * 0.53;
    c.fillStyle = dk ? '#9AA4B4' : '#D6DDE4'; c.beginPath(); c.moveTo(-hw, 0); c.quadraticCurveTo(0, -w * 0.2, hw, 0); c.closePath(); c.fill();
    c.fillStyle = dk ? '#7A8494' : '#AEB8C4'; c.fillRect(-hw, -2, hw * 2, 4); c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-hw * 0.35, -w * 0.07, hw * 0.25, w * 0.02, -0.15, 0, 7); c.fill();
    c.fillStyle = C.dark; c.beginPath(); c.roundRect ? c.roundRect(-w * 0.07, -w * 0.15, w * 0.14, w * 0.05, 3) : c.rect(-w * 0.07, -w * 0.15, w * 0.14, w * 0.05); c.fill(); c.fillRect(-w * 0.02, -w * 0.11, w * 0.04, w * 0.03); c.restore(); }
  function flames(c, b, t, k) { var n = Math.max(3, Math.round(b[2] / 14)); for (var j = 0; j < n; j++) { var fx = b[0] - b[2] * 0.42 + b[2] * 0.84 * j / (n - 1), fh = (ph ? 6 : 9) * (0.7 + 0.3 * Math.sin(t * 13 + j * 2.1 + k) + 0.15 * Math.sin(t * 29 + j)); c.fillStyle = 'rgba(70,130,255,0.85)'; c.beginPath(); c.moveTo(fx - 3, b[1]); c.quadraticCurveTo(fx - 2.5, b[1] - fh * 0.6, fx, b[1] - fh); c.quadraticCurveTo(fx + 2.5, b[1] - fh * 0.6, fx + 3, b[1]); c.fill(); c.fillStyle = 'rgba(200,230,255,0.9)'; c.beginPath(); c.ellipse(fx, b[1] - 1.5, 1.2, fh * 0.3, 0, 0, 7); c.fill(); } }
  function ticket(c, q, t) { c.save(); c.translate(q.x, q.y); c.rotate(q.a); var w = q.s * 0.66, h = q.s;
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(-w / 2 + 2, 3, w, h);
    c.fillStyle = dk ? '#E8E2D6' : '#FFFEF8'; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w / 2, h); for (var z = 0; z <= 6; z++) c.lineTo(w / 2 - w * z / 6, h + (z % 2 ? -2 : 0)); c.closePath(); c.fill();
    c.fillStyle = TC[q.k % 4]; c.fillRect(-w / 2, h * 0.08, w, h * 0.13);
    c.fillStyle = 'rgba(80,70,70,0.45)'; q.lines.forEach(function (l, j) { c.fillRect(-w * 0.38, h * (0.32 + j * 0.15), w * 0.76 * l, Math.max(1.2, h * 0.04)); });
    c.fillStyle = dk ? '#7A808C' : '#9AA4B0'; c.fillRect(-w * 0.18, -3, w * 0.36, 6); c.restore(); }
  return {
    maxDpr: 1.25, stat: dec.cv, hosted: false,
    step: function (dt, t, f) {
      var T = t - T0;
      nextPuff -= dt * f.s; if (nextPuff <= 0) { nextPuff = 0.16; puffs.push({x: S[0] + (Math.random() - 0.5) * S[2] * 0.6, y: S[1] - 6, vx: (Math.random() - 0.5) * 6, vy: -(18 + Math.random() * 14), r: S[2] * 0.09, t0: t, life: 3.2 + Math.random()});
        if (Math.random() < 0.5) puffs.push({x: A.sauce[0] + (Math.random() - 0.5) * A.sauce[2] * 0.5, y: A.sauce[1] - 2, vx: (Math.random() - 0.5) * 5, vy: -(14 + Math.random() * 10), r: A.sauce[2] * 0.12, t0: t, life: 2.4}); }
      if (rattle > 0) { rattle -= dt; if (Math.random() < dt * 6) puffs.push({x: S[0] + (Math.random() < 0.5 ? -1 : 1) * S[2] * 0.45, y: S[1] - 4, vx: (Math.random() - 0.5) * 20, vy: -30, r: S[2] * 0.08, t0: t, life: 1.8}); }
      nextRattle -= dt * f.s; if (nextRattle <= 0) { nextRattle = 3 + Math.random() * 4; rattle = 1.1; }
      puffs.forEach(function (p) { p.x += (p.vx + Math.sin((t - p.t0) * 1.6 + p.y * 0.05) * 6) * dt; p.y += p.vy * dt; p.vy *= 0.995; });
      puffs = puffs.filter(function (p) { return t - p.t0 < p.life; });
      gust = Math.max(0, gust - dt * 0.6); nextGust -= dt * f.s; if (nextGust <= 0) { nextGust = 4 + Math.random() * 5; gust = 1; }
      tk.forEach(function (q, j) { var target = Math.sin(t * 1.4 + j * 0.9) * 0.04 + gust * Math.sin(t * 9 + j * 1.3) * 0.22; q.va += (target - q.a) * 30 * dt; q.va *= Math.pow(0.04, dt); q.a += q.va * dt; });
      clouds.forEach(function (c) { c.x += c.v * f.s * dt; if (c.x > Wn[0] + Wn[2] + 50) c.x = Wn[0] - 50; });
      // the moment's herbs: a pinch falls and settles on the omelette
      if (T > 2.0 && T < 2.9 && flecks.length < 40 && Math.random() < dt * 40) { var a = Math.random() * 6.28; flecks.push({x: PX + (Math.random() - 0.5) * PW * 0.12, y: PY - PW * 0.9, vx: Math.cos(a) * PW * 0.12, vy: 10, r: 1.6 + Math.random() * 2, rot: Math.random() * 6, land: [PX - 2 + (Math.random() - 0.5) * PW * 0.5, PY - PW * 0.02 + (Math.random() - 0.5) * PW * 0.07], k: Math.random() < 0.3 ? 1 : 0, done: 0}); }
      flecks.forEach(function (p) { if (p.done) return; p.vy += 260 * dt; p.x += (p.land[0] - p.x) * Math.min(1, dt * 2.4) + p.vx * dt * 0.2; p.y += p.vy * dt; p.rot += dt * 6; if (p.y >= p.land[1]) { p.y = p.land[1]; p.x = p.land[0]; p.done = 1; } });
      if (T > 7.5) flecks = [];
      if (T > 1.85 && T < 4.8 && Math.random() < dt * 9) sparks.push({x: PX + (Math.random() - 0.5) * PW * 1.1, y: PY - Math.random() * PW * 0.5, t0: t, s: 4 + Math.random() * 5});
      sparks = sparks.filter(function (p) { return t - p.t0 < 1.2; });
    },
    draw: function (ca, cb, t, f) {
      var T = t - T0, j;
      // ---- canvas A: the window view and the herbs (the box hides their stems) ----
      ca.save(); ca.beginPath(); ca.rect(Wn[0], Wn[1], Wn[2], Wn[3]); ca.clip();
      ca.fillStyle = 'rgba(255,255,255,0.92)'; clouds.forEach(function (c) { ca.beginPath(); ca.ellipse(c.x, c.y, 34 * c.s, 9 * c.s, 0, 0, 7); ca.ellipse(c.x + 12 * c.s, c.y - 7 * c.s, 18 * c.s, 10 * c.s, 0, 0, 7); ca.fill(); });
      stars.forEach(function (s) { var tw = 0.5 + 0.5 * Math.sin(t * 1.3 + s[2]); n6_dot(ca, sparkG, s[0], s[1], 2.6, tw); });
      ca.restore();
      if (chalk) ca.drawImage(chalk, BD[0], BD[1], BD[2], BD[3] + 12);
      if (dk && A.ovens.length) { var ovr = A.ovens[0], ofl = 0.75 + 0.25 * flick(t, 2); ca.save(); ca.globalCompositeOperation = 'lighter'; ca.beginPath(); ca.rect(ovr[0], ovr[1], ovr[2], ovr[3]); ca.clip(); ca.translate(ovr[0] + ovr[2] / 2, ovr[1] + ovr[3] * 0.7); ca.scale(ovr[2] * 0.6, ovr[3] * 0.9); ca.globalAlpha = ofl; ca.fillStyle = ovenG; ca.beginPath(); ca.arc(0, 0, 1, 0, 7); ca.fill(); ca.restore(); }   // the oven light (under the towel)
      herbP.forEach(function (h, k) { var sw = Math.sin(t * 1.1 * f.s + h.ph) * 0.07 + gust * Math.sin(t * 6 + k) * 0.08; ca.save(); ca.translate(h.h.x, h.h.y); ca.rotate(sw); ca.fillStyle = herbC[h.h.kind]; ca.fill(h.p);
        if (h.h.kind === 2) { ca.fillStyle = dk ? '#B48AD8' : '#C79AF0'; ca.beginPath(); ca.arc(0, -30 * h.h.s, 4 * h.h.s, 0, 7); ca.fill(); }
        if (h.h.kind === 0 && k % 2) { ca.fillStyle = '#FFFFFF'; ca.beginPath(); ca.arc(0, -33 * h.h.s, 1.6 * h.h.s, 0, 7); ca.fill(); }
        ca.restore(); });
      // ---- canvas B: decor (unless the host paints it), clock hands, lamps, tickets, flames, lid, pan, steam ----
      if (!this.hosted) cb.drawImage(dec.cv, 0, 0, W, H);
      if (clock) { var ck = clock, mn = t * 0.02 * f.s, hr = mn / 12; cb.strokeStyle = '#3A3440'; cb.lineCap = 'round'; cb.lineWidth = 2.4; cb.beginPath(); cb.moveTo(ck[0], ck[1]); cb.lineTo(ck[0] + Math.cos(hr - 1.2) * ck[2] * 0.5, ck[1] + Math.sin(hr - 1.2) * ck[2] * 0.5); cb.stroke(); cb.lineWidth = 1.6; cb.beginPath(); cb.moveTo(ck[0], ck[1]); cb.lineTo(ck[0] + Math.cos(mn - 2) * ck[2] * 0.72, ck[1] + Math.sin(mn - 2) * ck[2] * 0.72); cb.stroke(); cb.strokeStyle = '#E25A4A'; cb.lineWidth = 1; var sa = t * f.s * Math.PI / 30; cb.beginPath(); cb.moveTo(ck[0], ck[1]); cb.lineTo(ck[0] + Math.cos(sa - 1.57) * ck[2] * 0.8, ck[1] + Math.sin(sa - 1.57) * ck[2] * 0.8); cb.stroke(); }
      cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over';
      A.lamps.forEach(function (l, k) { var p = 0.85 + 0.15 * Math.sin(t * 1.7 + k); n6_dot(cb, lampG, l[0], l[1] + 4, ph ? 40 : 70, p);
        var g = cb.createLinearGradient(0, l[1], 0, l[1] + H * (ph ? 0.12 : 0.18)); g.addColorStop(0, dk ? 'rgba(255,170,80,0.22)' : 'rgba(255,190,110,0.16)'); g.addColorStop(1, 'rgba(255,170,80,0)'); cb.fillStyle = g; cb.beginPath(); cb.moveTo(l[0] - 10, l[1]); cb.lineTo(l[0] + 10, l[1]); cb.lineTo(l[0] + (ph ? 34 : 58), l[1] + H * (ph ? 0.12 : 0.18)); cb.lineTo(l[0] - (ph ? 34 : 58), l[1] + H * (ph ? 0.12 : 0.18)); cb.fill(); });

      cb.restore();
      A.pots.forEach(function (p, k) { var g = Math.pow(Math.max(0, Math.sin(t * 0.5 + k * 1.9)), 30); if (g > 0.02) n6_dot(cb, sparkG, p.x - p.w * 0.2, p.y + p.h * 0.3, 10 + g * 8, g); });
      tk.forEach(function (q) { ticket(cb, q, t); });
      A.burners.forEach(function (b, k) { cb.save(); if (dk) cb.globalCompositeOperation = 'lighter'; flames(cb, b, t * f.s, k); n6_dot(cb, flameG, b[0], b[1], b[2] * 0.4, dk ? 0.35 : 0.15); cb.restore(); });
      // stockpot lid
      var rt = rattle > 0 ? Math.sin(t * 38) * 0.05 * Math.min(1, rattle * 2) : 0, lf = rattle > 0 ? Math.abs(Math.sin(t * 19)) * 3 * Math.min(1, rattle * 2) : 0;
      lid(cb, S[0], S[1] - 2, S[2], rt, lf);
      // the pan and the omelette
      var pr = 0, pdy = 0, ox = PX - 2, oy = PY - PW * 0.02, orot = 0, osy = 1, ofront = false;
      if (T >= 0 && T < 2.4) {
        if (T < 0.25) { var u = n6_ease(T / 0.25); pdy = 6 * u; pr = 0.1 * u; } else if (T < 0.42) { u = n6_ease((T - 0.25) / 0.17); pdy = 6 - 22 * u; pr = 0.1 - 0.32 * u; } else if (T < 0.9) { u = n6_ease((T - 0.42) / 0.48); pdy = -16 * (1 - u); pr = -0.22 * (1 - u); }
        if (T > 1.83 && T < 2.3) { u = (T - 1.83) / 0.47; pdy = Math.sin(u * Math.PI) * 6; }
        if (T > 0.33 && T < 1.83) { var fu = (T - 0.33) / 1.5, peak = H * (ph ? 0.3 : 0.42); oy = PY - PW * 0.02 - peak * 4 * fu * (1 - fu); ox = PX - 2 + Math.sin(fu * Math.PI) * PW * 0.12; osy = Math.cos(fu * Math.PI * 2); osy = (osy < 0 ? -1 : 1) * Math.max(0.32, Math.abs(osy)); orot = Math.sin(fu * Math.PI) * 0.4; ofront = true; }
        else if (T >= 1.83 && T < 2.2) osy = 0.75 + 0.25 * n6_ease((T - 1.83) / 0.37);
      }
      pan(cb, PX, PY + pdy, pr);
      var orx = PW * 0.3, ory = PW * 0.075, osc = ofront ? 1 + 0.45 * Math.sin(Math.PI * Math.max(0, Math.min(1, (T - 0.33) / 1.5))) : 1;
      if (!ofront) { cb.save(); cb.translate(PX, PY + pdy); cb.rotate(pr); omelette(cb, ox - PX, oy - PY + Math.sin(t * 3) * 0.6, orx, ory, 0, osy); cb.restore(); }
      else { if (osy < 0) { cb.save(); cb.translate(ox, oy); cb.scale(1, -1); cb.translate(-ox, -oy); omelette(cb, ox, oy, orx * osc, ory * osc, -orot, -osy); cb.restore(); } else omelette(cb, ox, oy, orx * osc, ory * osc, orot, Math.max(0.08, osy));
        cb.strokeStyle = 'rgba(255,255,255,' + (dk ? 0.35 : 0.8) + ')'; cb.lineWidth = 2; cb.lineCap = 'round'; for (j = 0; j < 3; j++) { cb.beginPath(); cb.moveTo(ox - orx * 0.6 + j * orx * 0.6, oy + ory * osc * 2.2); cb.lineTo(ox - orx * 0.6 + j * orx * 0.6, oy + ory * osc * 2.2 + 18); cb.stroke(); } }
      flecks.forEach(function (p) { var a = T > 6.5 ? Math.max(0, 1 - (T - 6.5) / 0.8) : 1; if (a <= 0) return; cb.globalAlpha = a; cb.fillStyle = p.k ? '#2E7A3A' : '#5DB84E'; cb.save(); cb.translate(p.x, p.y + (p.done ? pdy : 0)); cb.rotate(p.rot); cb.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9); cb.restore(); cb.globalAlpha = 1; });
      // a chef's hand pinching the herbs over the pan
      var hA = n6_env(T, 1.85, 2.1, 2.9, 3.3); if (hA > 0) { var hx = PX + PW * 0.06 + Math.sin(T * 22) * 2, hy = PY - PW * 0.95 - (1 - hA) * 60, hs = PW / 170; cb.save(); cb.globalAlpha = hA; cb.translate(hx, hy); cb.scale(hs, hs); cb.rotate(-0.35);
        cb.fillStyle = dk ? '#DCD6CC' : '#FFFFFF'; cb.fillRect(-14, -40 - (hy + 40) / hs * 1.3, 28, 16 + (hy + 40) / hs * 1.3); cb.fillStyle = 'rgba(0,0,0,0.08)'; cb.fillRect(-14, -36, 28, 10); cb.fillRect(4, -40 - (hy + 40) / hs * 1.3, 10, 16 + (hy + 40) / hs * 1.3);   // the chef's sleeve reaches in from above the picture
        cb.fillStyle = '#F2C49A'; cb.beginPath(); cb.ellipse(0, -14, 14, 16, 0, 0, 7); cb.fill(); cb.beginPath(); cb.ellipse(-6, 4, 5, 10, 0.3, 0, 7); cb.ellipse(5, 5, 5, 10, -0.3, 0, 7); cb.fill();
        cb.fillStyle = '#E8A87A'; cb.beginPath(); cb.ellipse(-0.5, 13, 4, 3, 0, 0, 7); cb.fill(); cb.restore(); }
      // sizzle sparkles while it cooks, little stars after the landing
      if (Math.sin(t * 2.3) > 0.6) for (j = 0; j < 3; j++) { var sx = PX + (hash(Math.floor(t * 8) + j) - 0.5) * PW * 0.6, sy = PY - PW * 0.05 - hash(Math.floor(t * 8) * 3 + j) * 6; cb.fillStyle = 'rgba(255,240,200,0.8)'; cb.beginPath(); cb.arc(sx, sy, 1.2, 0, 7); cb.fill(); }
      sparks.forEach(function (p) { var a = Math.sin(Math.PI * (t - p.t0) / 1.2); cb.fillStyle = dk ? 'rgba(255,236,180,' + a + ')' : 'rgba(255,190,70,' + a + ')'; cb.beginPath(); var s2 = p.s * a, y2 = p.y - (t - p.t0) * 12; cb.moveTo(p.x, y2 - s2); cb.quadraticCurveTo(p.x, y2, p.x + s2, y2); cb.quadraticCurveTo(p.x, y2, p.x, y2 + s2); cb.quadraticCurveTo(p.x, y2, p.x - s2, y2); cb.quadraticCurveTo(p.x, y2, p.x, y2 - s2); cb.fill(); });
      // steam last, so it drifts in front of everything
      puffs.forEach(function (p) { var u = (t - p.t0) / p.life, a = Math.sin(Math.PI * Math.min(1, u)) * (dk ? 0.5 : 0.55); n6_dot(cb, steamG, p.x, p.y, p.r * (1 + u * 2.6), a); });
    },
    finish: function (t) { T0 = t; flecks = []; }
  };
};
UIC.culinary = {L: ['#3E7A5A', '#285A40', 'rgba(255,255,252,0.86)', '#2A2018', '#6E6052', '#C8603A', '#C8603A', '#D97B45', '#FFFFFF'], D: ['#2A2830', '#141218', 'rgba(28,24,30,0.8)', '#F4EEE6', '#B8ACA0', '#F2A35A', '#F2A35A', '#F6C27A', '#241A14']};
// ==== /n6:culinary ====
// ==== n6:marinebio ====
// ---------- Kelp Forest: the kelp sways in the current, sunbeams flicker through the water, bubbles rise, fish dart about, an otter
// naps on the surface; at night the sub's headlights sweep the dark water. Moment: the sub's sonar pings, and a pod of dolphins circles it.
function n6_fish(c, x, y, s, dir, t, body, fin, ph) { c.save(); c.translate(x, y); c.scale(s * dir, s); var w = Math.sin(t * 9 + ph) * 0.25;
  c.fillStyle = fin; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-15, -6 + w * 6); c.lineTo(-14, 0); c.lineTo(-15, 6 + w * 6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-2, -6); c.quadraticCurveTo(2, -11, 6, -6); c.fill();
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 10, 6.5, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(1, -2.4, 6, 2, 0, 0, 7); c.fill();
  c.fillStyle = n6_INK; c.beginPath(); c.arc(5, -1, 1.5, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(5.5, -1.6, 0.6, 0, 7); c.fill();
  c.fillStyle = n6_BLUSH; c.beginPath(); c.ellipse(4.6, 2, 1.8, 1.1, 0, 0, 7); c.fill(); c.restore(); }
var n6_dolG = null;   // the dolphin's body gradient (local coordinates, made once)
function n6_dolphin(c, x, y, s, dir, tilt, t, happy) { c.save(); c.translate(x, y); c.scale(s * dir, s); c.rotate(tilt); var fl = Math.sin(t * 8) * 0.25;
  c.fillStyle = '#6E9AC0'; c.beginPath(); c.moveTo(-18, -2); c.lineTo(-25, -7 + fl * 8); c.quadraticCurveTo(-24, -1, -26, 5 + fl * 8); c.lineTo(-18, 2); c.fill();
  c.beginPath(); c.moveTo(-2, -8); c.quadraticCurveTo(-4, -16, -9, -17); c.quadraticCurveTo(-6, -12, -7, -7); c.fill();
  var g = n6_dolG || (n6_dolG = (function () { var q = c.createLinearGradient(0, -9, 0, 9); q.addColorStop(0, '#7FAED6'); q.addColorStop(1, '#5A88B4'); return q; })()); c.fillStyle = g;
  c.beginPath(); c.moveTo(-20, 0); c.quadraticCurveTo(-12, -10, 4, -9); c.quadraticCurveTo(14, -8, 17, -3); c.quadraticCurveTo(24, -2, 25, 0.5); c.quadraticCurveTo(22, 3, 15, 3.5); c.quadraticCurveTo(4, 9, -8, 6); c.quadraticCurveTo(-16, 4, -20, 0); c.fill();
  c.fillStyle = '#EAF4FA'; c.beginPath(); c.moveTo(-10, 4.5); c.quadraticCurveTo(4, 8.4, 15, 3.4); c.quadraticCurveTo(4, 4, -10, 4.5); c.fill();
  c.fillStyle = '#5A88B4'; c.beginPath(); c.ellipse(2, 5, 5, 2, 0.6 + fl * 0.5, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(2, -6, 8, 1.6, -0.05, 0, 7); c.fill();
  if (happy) { c.strokeStyle = n6_INK; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.arc(11, -1.6, 1.6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  else { c.fillStyle = n6_INK; c.beginPath(); c.arc(11, -2, 1.5, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(11.5, -2.6, 0.55, 0, 7); c.fill(); }
  c.fillStyle = n6_BLUSH; c.beginPath(); c.ellipse(12.5, 1.4, 2, 1.2, 0, 0, 7); c.fill(); c.restore(); }
ENGINES.marinebio = function (A, v, dk) {
  var W = v.bw, H = v.bh, ph = A.ph, C = A.cols, T0 = -99, FY = A.floorY, SB = A.sub, OT = A.otter;
  var bubG = n6_rg(dk ? 'rgba(190,240,255,0.5)' : 'rgba(255,255,255,0.7)', 1, [0.6, 0.15]), lightG = n6_rg('rgba(255,250,210,0.9)', 1, [0.25, 0.4]), pingG = n6_rg('rgba(170,255,240,0.8)', 1);
  var kelpCol = dk ? ['#5A6A2E', '#7A8A3A', '#8A8A3A'] : ['#A8902E', '#C8B048', '#E0C454'];
  var kel = A.kelps.map(function (q, i) { var g = n6_kelpGeom(q.x, q.y, q.h, q.b, q.seed); return {q: q, ph: i * 1.7, blades: g.bl.map(function (b) { return {p: new Path2D(n6_leaf(0, 0, b[2], b[3], 0)), L: b[2]}; })}; });
  var bubbles = [], nextBub = 0, fishes = [], school = [], dol = [];
  var rayG = n6_ctx().createLinearGradient(0, 0, 0, H * 0.85); rayG.addColorStop(0, 'rgba(255,255,230,1)'); rayG.addColorStop(1, 'rgba(255,255,230,0)');
  var FC = dk ? [['#E8743A', '#C85A2A'], ['#E8743A', '#C85A2A'], ['#F2C230', '#D89A2A']] : [['#FF8A3A', '#F06A2A'], ['#FF8A3A', '#F06A2A'], ['#FFD23A', '#F2A82A']];
  for (var i = 0; i < (ph ? 3 : 4); i++) fishes.push({x0: W * [0.2, 0.44, 0.66, 0.86][i], y0: H * [0.42, 0.64, 0.5, 0.7][i], ax: W * (0.08 + 0.1 * hash(i + 8)), ay: H * 0.04, sp: 0.18 + 0.12 * hash(i + 11), ph: i * 2.3, s: (ph ? 1.15 : 1.7) * (0.85 + 0.3 * hash(i + 14)), c: FC[i % 3]});
  for (i = 0; i < (ph ? 14 : 24); i++) school.push({dx: (hash(i * 3 + 1) - 0.5) * (ph ? 60 : 110), dy: (hash(i * 3 + 2) - 0.5) * (ph ? 30 : 50), ph: hash(i * 3 + 3) * 6.28, s: 0.5 + 0.25 * hash(i + 40)});
  var sc = {x: W * 0.3, y: H * 0.4, dir: 1, turn: 1, tNext: 6};
  function sub(c, x, y, L, t, k) { // the research sub, nose to the right
    c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.7) * 0.03); var s = L / 150;
    c.scale(s, s);
    // propeller
    c.save(); c.translate(-78, 2); c.fillStyle = dk ? '#8A8A6A' : '#B8B48A'; c.fillRect(-6, -3, 10, 6); c.scale(1, Math.cos(t * 14)); c.fillStyle = dk ? '#9A9070' : '#C8C098'; c.beginPath(); c.ellipse(-8, 0, 3, 14, 0, 0, 7); c.fill(); c.restore();
    c.fillStyle = dk ? '#C89A22' : '#F2C230'; c.beginPath(); c.moveTo(-74, -4); c.lineTo(-86, -18); c.lineTo(-80, -18); c.lineTo(-64, -8); c.fill(); c.beginPath(); c.moveTo(-74, 6); c.lineTo(-86, 18); c.lineTo(-80, 18); c.lineTo(-64, 10); c.fill();
    // hull
    var g = c.createLinearGradient(0, -34, 0, 34); g.addColorStop(0, dk ? '#E8BC3A' : '#FFDA4A'); g.addColorStop(0.6, dk ? '#C8961E' : '#F2B624'); g.addColorStop(1, dk ? '#9A6E14' : '#D8941A'); c.fillStyle = g;
    c.beginPath(); c.moveTo(-70, 0); c.bezierCurveTo(-70, -32, 40, -36, 66, -12); c.quadraticCurveTo(78, 0, 66, 12); c.bezierCurveTo(40, 36, -70, 32, -70, 0); c.fill();
    c.fillStyle = dk ? '#C8961E' : '#F2B624'; c.beginPath(); c.moveTo(-26, -24); c.lineTo(-20, -44); c.lineTo(12, -44); c.lineTo(20, -26); c.fill();
    c.fillStyle = dk ? '#6A6A72' : '#8A8A96'; c.fillRect(-6, -60, 4, 18); c.fillRect(-6, -60, 14, 4);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-20, -18, 34, 5, -0.05, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(-60, 6, 110, 3);
    // portholes
    [[-40, 0, 7], [-18, 0, 7]].forEach(function (q) { c.fillStyle = dk ? '#7A6A3A' : '#C89A2A'; c.beginPath(); c.arc(q[0], q[1], q[2] + 2.5, 0, 7); c.fill(); c.fillStyle = dk ? '#FFD88A' : '#BFE8F2'; c.beginPath(); c.arc(q[0], q[1], q[2], 0, 7); c.fill(); });
    // the big front dome window, with a little pilot looking out
    c.fillStyle = dk ? '#7A6A3A' : '#C89A2A'; c.beginPath(); c.arc(38, -2, 21, 0, 7); c.fill();
    var gw = c.createRadialGradient(32, -8, 2, 38, -2, 18); gw.addColorStop(0, dk ? '#BFEFFF' : '#E8FBFF'); gw.addColorStop(1, dk ? '#3A8AA8' : '#7ACCE0'); c.fillStyle = gw; c.beginPath(); c.arc(38, -2, 17, 0, 7); c.fill();
    c.fillStyle = '#F2C49A'; c.beginPath(); c.arc(40, 4, 9, 0, 7); c.fill(); c.fillStyle = '#5A3A2A'; c.beginPath(); c.arc(40, 1, 9.4, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    n6_eyes(c, 42, 5, 3.2, 1.3, n6_blinkAt(t, 3), k > 0); c.fillStyle = n6_BLUSH; c.beginPath(); c.ellipse(46.5, 8, 2, 1.2, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(31, -11, 6, 3, -0.6, 0, 7); c.fill();
    // headlight + arm
    c.fillStyle = dk ? '#FFF2C0' : '#FFFFFF'; c.beginPath(); c.ellipse(68, 8, 4, 5, 0, 0, 7); c.fill();
    c.strokeStyle = dk ? '#6A6A72' : '#8A8A96'; c.lineWidth = 4; c.lineCap = 'round'; var aa = Math.sin(t * 0.8) * 0.2; c.beginPath(); c.moveTo(30, 24); c.lineTo(46 + Math.cos(aa) * 4, 38 + Math.sin(aa) * 6); c.lineTo(60, 42 + Math.sin(aa) * 8); c.stroke(); c.lineWidth = 2.4; c.beginPath(); c.moveTo(60, 42 + Math.sin(aa) * 8); c.lineTo(66, 38 + Math.sin(aa) * 8); c.moveTo(60, 42 + Math.sin(aa) * 8); c.lineTo(66, 47 + Math.sin(aa) * 8); c.stroke();
    c.fillStyle = dk ? '#3A3A44' : '#3A3440'; c.font = '800 9px Lexend, Arial, sans-serif'; c.textAlign = 'center'; c.fillText('SB-1', -50, -10);
    c.restore(); }
  function otter(c, x, y, s, t, sleep) { c.save(); c.translate(x, y + Math.sin(t * 1.4) * 2); c.rotate(Math.sin(t * 0.9) * 0.05); c.scale(s, s);
    c.fillStyle = '#8A5A3A'; c.beginPath(); c.ellipse(0, 0, 30, 11, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-30, 2, 10, 4, -0.2, 0, 7); c.fill();
    c.fillStyle = '#C89A72'; c.beginPath(); c.ellipse(4, -3, 18, 7, 0, 0, 7); c.fill();
    // hind feet up out of the water, the shell held on the chest with both front paws
    c.fillStyle = '#7A4C30'; c.beginPath(); c.ellipse(-24, -9 + Math.sin(t * 1.1) * 0.8, 3.6, 6, -0.7, 0, 7); c.ellipse(-17, -10 + Math.sin(t * 1.1 + 1) * 0.8, 3.6, 6, -0.35, 0, 7); c.fill();
    c.fillStyle = dk ? '#C8B8A0' : '#FFF4E4'; c.beginPath(); c.arc(6, -8, 6.5, Math.PI * 0.95, Math.PI * 2.05); c.closePath(); c.fill();
    c.strokeStyle = dk ? 'rgba(120,100,80,0.6)' : 'rgba(200,150,120,0.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(6, -8); c.lineTo(2, -13); c.moveTo(6, -8); c.lineTo(6, -14.2); c.moveTo(6, -8); c.lineTo(10, -13); c.stroke();
    c.fillStyle = '#7A4C30'; c.beginPath(); c.ellipse(0.5, -8.6, 3.4, 2.6, 0.3, 0, 7); c.ellipse(11.5, -8.6, 3.4, 2.6, -0.3, 0, 7); c.fill();
    c.fillStyle = '#9A6A48'; c.beginPath(); c.arc(32, -6, 11, 0, 7); c.fill(); c.fillStyle = '#E8D2B8'; c.beginPath(); c.ellipse(35, -3, 7, 6, 0, 0, 7); c.fill();
    c.fillStyle = '#9A6A48'; c.beginPath(); c.arc(26, -15, 3.2, 0, 7); c.arc(37, -16, 3.2, 0, 7); c.fill();
    c.fillStyle = n6_INK; c.beginPath(); c.ellipse(35.5, -2.8, 2, 1.4, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(80,60,50,0.45)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(31, -1.5); c.lineTo(25, -2.5); c.moveTo(31, -0.5); c.lineTo(25.5, 0.8); c.moveTo(40, -1.5); c.lineTo(46, -2.5); c.moveTo(40, -0.5); c.lineTo(45.5, 0.8); c.stroke();
    if (sleep) { c.strokeStyle = n6_INK; c.lineWidth = 1.2; c.beginPath(); c.arc(30, -7, 1.8, 0.2, Math.PI - 0.2); c.moveTo(41.6, -7); c.arc(40, -7, 1.6, 0.2, Math.PI - 0.2); c.stroke(); n6_text(c, 'z', 50, -22 - Math.sin(t) * 2, 9, 'rgba(220,240,255,0.8)'); }
    else n6_eyes(c, 35, -7, 5, 1.3, n6_blinkAt(t, 6), false);
    c.fillStyle = n6_BLUSH; c.beginPath(); c.ellipse(29, -2, 2.4, 1.4, 0, 0, 7); c.ellipse(41, -2, 2.4, 1.4, 0, 0, 7); c.fill(); c.restore(); }
  return {
    maxDpr: 1.25,
    step: function (dt, t, f) {
      var T = t - T0;
      nextBub -= dt * f.s; if (nextBub <= 0) { nextBub = 0.18; var src = Math.random();
        if (src < 0.35) bubbles.push({x: SB[0] - SB[2] * 0.45, y: SB[1], r: 2 + Math.random() * 3, vy: 30 + Math.random() * 20, ph: Math.random() * 6});
        else if (src < 0.7) { var kk = A.kelps[Math.floor(Math.random() * A.kelps.length)]; bubbles.push({x: kk.x + (Math.random() - 0.5) * 20, y: FY + 10, r: 1.5 + Math.random() * 2.5, vy: 24 + Math.random() * 14, ph: Math.random() * 6}); }
        else bubbles.push({x: Math.random() * W, y: FY + 20, r: 1.2 + Math.random() * 2, vy: 20 + Math.random() * 10, ph: Math.random() * 6}); }
      bubbles.forEach(function (b) { b.y -= b.vy * dt * f.s; b.x += Math.sin(t * 2 + b.ph) * 10 * dt; b.r *= 1 + dt * 0.04; });
      bubbles = bubbles.filter(function (b) { return b.y > H * 0.03; });
      // the school drifts on a slow figure-eight and darts round now and then
      sc.tNext -= dt; if (sc.tNext <= 0) { sc.tNext = 5 + Math.random() * 5; sc.dir = -sc.dir; }
      sc.turn += (sc.dir - sc.turn) * Math.min(1, dt * 3);
      sc.x += sc.turn * W * 0.035 * dt * f.s * (1 + Math.abs(sc.dir - sc.turn) * 3); sc.y = H * (0.38 + 0.08 * Math.sin(t * 0.21)); if (sc.x < -W * 0.1) sc.x = W * 1.1; if (sc.x > W * 1.1) sc.x = -W * 0.1;
      if (T > 0.6 && T < 7) { if (!dol.length) for (var j = 0; j < 4; j++) dol.push({a: j * Math.PI / 2, k: j}); }
      else dol = [];
    },
    draw: function (ca, cb, t, f) {
      var T = t - T0, j;
      // ---- canvas A: sunbeams, the surface shimmer, the school, the kelp ----
      ca.save(); ca.globalCompositeOperation = 'lighter'; ca.fillStyle = rayG;
      for (j = 0; j < (ph ? 3 : 5); j++) { var bx = W * (0.08 + j * (ph ? 0.3 : 0.2)) + Math.sin(t * 0.13 + j) * 30; ca.globalAlpha = (dk ? 0.05 : 0.12) * (0.6 + 0.4 * Math.sin(t * 0.7 + j * 1.7)) * (0.7 + 0.3 * flick(t * 0.3, j)); ca.beginPath(); ca.moveTo(bx, 0); ca.lineTo(bx + 50 + j * 6, 0); ca.lineTo(bx + 50 + H * 0.32, H * 0.85); ca.lineTo(bx - 20 + H * 0.28, H * 0.85); ca.fill(); }
      ca.restore();
      ca.strokeStyle = dk ? 'rgba(170,230,230,0.3)' : 'rgba(255,255,255,0.75)'; ca.lineWidth = 2;
      for (j = 0; j < 3; j++) { ca.beginPath(); for (var x = -10; x <= W + 10; x += 12) { var yy = H * (0.012 + j * 0.013) + Math.sin(x / (40 + j * 13) + t * (1 + j * 0.3) * f.s) * 3 + Math.sin(x / 17 - t * 1.7) * 1.4; if (x < 0) ca.moveTo(x, yy); else ca.lineTo(x, yy); } ca.globalAlpha = 1 - j * 0.3; ca.stroke(); } ca.globalAlpha = 1;
      ca.fillStyle = dk ? 'rgba(150,190,200,0.55)' : 'rgba(80,130,150,0.45)';
      ca.beginPath(); school.forEach(function (m) { var x = sc.x + m.dx * (1 + 0.1 * Math.sin(t + m.ph)), y = sc.y + m.dy + Math.sin(t * 2 + m.ph) * 4, d = sc.turn >= 0 ? 1 : -1, s = m.s * (ph ? 0.8 : 1); ca.moveTo(x + 9 * s, y); ca.ellipse(x, y, 9 * s, 2.6 * s, 0, 0, 7); ca.moveTo(x - 8 * s * d, y); ca.lineTo(x - 13 * s * d, y - 3.5 * s); ca.lineTo(x - 13 * s * d, y + 3.5 * s); ca.closePath(); }); ca.fill();   // the whole school in one path
      kel.forEach(function (k, n) { var q = k.q, sway = Math.sin(t * 0.45 * f.s + k.ph) * W * 0.025 + Math.sin(t * 0.21 + n) * W * 0.01, g = n6_kelpGeom(q.x, q.y, q.h, q.b + sway, q.seed);
        ca.strokeStyle = kelpCol[0]; ca.lineWidth = q.w; ca.lineCap = 'round'; ca.lineJoin = 'round'; ca.beginPath(); g.pts.forEach(function (p, i) { if (i) ca.lineTo(p[0], p[1]); else ca.moveTo(p[0], p[1]); }); ca.stroke();
        // the blades, batched by colour into three paths (one fill each instead of one per blade)
        var pA = new Path2D(), pB = new Path2D(), pC = new Path2D();
        g.bl.forEach(function (b, i) { var fl = Math.sin(t * 1.3 * f.s + i * 0.7 + k.ph) * 9, an = (b[4] + fl) * Math.PI / 180, co = Math.cos(an), si = Math.sin(an); (i % 3 ? pB : pA).addPath(k.blades[i].p, {a: co, b: si, c: -si, d: co, e: b[0], f: b[1]}); var cx = b[0] + co * q.w * 0.8, cy = b[1] + si * q.w * 0.8; pC.moveTo(cx + q.w * 0.5, cy); pC.arc(cx, cy, q.w * 0.5, 0, 7); });
        ca.fillStyle = kelpCol[0]; ca.fill(pA); ca.fillStyle = kelpCol[1]; ca.fill(pB); ca.fillStyle = kelpCol[2]; ca.fill(pC); });
      // ---- canvas B: anemone tentacles, fish, bubbles, the sub (and its lights), the otter, the moment ----
      A.anem.forEach(function (a, n) { for (var jj = -4; jj <= 4; jj++) { var sw = Math.sin(t * 1.6 * f.s + n + jj * 0.4) * 10; cb.save(); cb.translate(a[0] + jj * a[2] * 0.15, a[1] - a[2] * 0.62); cb.rotate((-90 + jj * 14 + sw) * Math.PI / 180); cb.fillStyle = C.anemL; cb.beginPath(); cb.ellipse(a[2] * 0.4, 0, a[2] * 0.42, a[2] * 0.1, 0, 0, 7); cb.fill(); cb.fillStyle = '#FFFFFF'; cb.globalAlpha = 0.6; cb.beginPath(); cb.arc(a[2] * 0.8, 0, a[2] * 0.06, 0, 7); cb.fill(); cb.restore(); } });
      fishes.forEach(function (fi) { var u = t * fi.sp * f.s + fi.ph, x = fi.x0 + Math.sin(u) * fi.ax, y = fi.y0 + Math.sin(u * 2.1) * fi.ay, dir = Math.cos(u) >= 0 ? 1 : -1; n6_fish(cb, x, y, fi.s, dir, t, fi.c[0], fi.c[1], fi.ph); });
      cb.strokeStyle = dk ? 'rgba(190,240,255,0.5)' : 'rgba(255,255,255,0.8)'; cb.lineWidth = 1; cb.beginPath(); bubbles.forEach(function (b) { cb.moveTo(b.x + b.r, b.y); cb.arc(b.x, b.y, b.r, 0, 7); }); cb.stroke();
      cb.fillStyle = dk ? 'rgba(190,240,255,0.5)' : 'rgba(255,255,255,0.9)'; cb.beginPath(); bubbles.forEach(function (b) { var r = b.r * 0.3; cb.moveTo(b.x - b.r * 0.35 + r, b.y - b.r * 0.35); cb.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, r, 0, 7); }); cb.fill();
      // the sub: headlight beam, then dolphins behind it, the sub, dolphins in front
      var sx = SB[0], sy = SB[1] + Math.sin(t * 0.9) * 5, L = SB[2], s = L / 150, beam = Math.sin(t * 0.35 * f.s) * 0.35 + 0.15;
      cb.save(); cb.globalCompositeOperation = 'lighter'; cb.translate(sx + 68 * s, sy + 8 * s); cb.rotate(beam);
      var bg = cb.createLinearGradient(0, 0, W * 0.4, 0); bg.addColorStop(0, dk ? 'rgba(255,246,200,0.45)' : 'rgba(255,255,240,0.25)'); bg.addColorStop(1, 'rgba(255,246,200,0)'); cb.fillStyle = bg; cb.beginPath(); cb.moveTo(0, -4); cb.lineTo(W * 0.4, -W * 0.09); cb.lineTo(W * 0.4, W * 0.09); cb.lineTo(0, 4); cb.fill(); cb.restore();
      if (dk) { cb.save(); cb.globalCompositeOperation = 'lighter'; n6_dot(cb, lightG, sx + 68 * s, sy + 8 * s, 18, 0.9); [[-40, 0], [-18, 0]].forEach(function (q) { n6_dot(cb, n6_rg('rgba(255,210,130,0.6)', 1), sx + q[0] * s, sy + q[1] * s, 16 * s, 0.7); }); cb.restore(); }
      var orb = function (d) { var e = n6_env(T, 0.6, 2, 5, 6.6), ang = d.a + (T - 0.6) * 1.5, rx = W * (ph ? 0.38 : 0.22) * (1 + (1 - e) * 2.2), ry = H * (ph ? 0.08 : 0.12) * (1 + (1 - e) * 0.6), x = sx + Math.cos(ang) * rx + (T > 5 ? (T - 5) * W * 0.3 : 0), y = sy + Math.sin(ang) * ry, dx = -Math.sin(ang) * rx, dy = Math.cos(ang) * ry; return {x: x, y: y, dir: dx >= 0 ? 1 : -1, tilt: Math.atan2(dy, Math.abs(dx)) * 0.5, back: Math.sin(ang) < 0}; };
      dol.forEach(function (d) { var p = orb(d); if (p.back) n6_dolphin(cb, p.x, p.y, (ph ? 1.2 : 2) * 0.88, p.dir, p.tilt, t + d.k, T > 2 && T < 5); });
      sub(cb, sx, sy, L, t, T > 0 && T < 7 ? 1 : 0);
      dol.forEach(function (d) { var p = orb(d); if (!p.back) n6_dolphin(cb, p.x, p.y, (ph ? 1.2 : 2) * 1.08, p.dir, p.tilt, t + d.k, T > 2 && T < 5); });
      // sonar pings: three rings out of the sub
      if (T >= 0 && T < 4) { cb.save(); cb.globalCompositeOperation = dk ? 'lighter' : 'source-over'; for (j = 0; j < 3; j++) { var u = (T - j * 0.8) / 1.8; if (u < 0 || u > 1) continue; var R = 20 + u * W * (ph ? 0.5 : 0.32); cb.strokeStyle = dk ? 'rgba(150,255,230,' + (1 - u) * 0.8 + ')' : 'rgba(255,255,255,' + (1 - u) * 0.95 + ')'; cb.lineWidth = 3 * (1 - u) + 1; cb.beginPath(); cb.ellipse(sx, sy, R, R * 0.6, 0, 0, 7); cb.stroke(); if (u < 0.3) n6_dot(cb, pingG, sx, sy, 40, (0.3 - u) * 2); } cb.restore(); }
      otter(cb, OT[0], OT[1], OT[2], t, dk);
    },
    finish: function (t) { T0 = t; }
  };
};
UIC.marinebio = {L: ['#2E8A86', '#1A5E5E', 'rgba(255,255,255,0.84)', '#0E2E30', '#4C6A6A', '#1F8A86', '#1F8A86', '#3AA6A0', '#FFFFFF'], D: ['#0E3440', '#06161C', 'rgba(8,30,38,0.78)', '#E6F6F4', '#9CC0BE', '#F2C230', '#F2C230', '#F6D86A', '#0A2028']};
// ==== /n6:marinebio ====
