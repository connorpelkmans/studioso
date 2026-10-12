// ---- world theme: iceland (Iceland)
// Helpers. Every shape here is drawn clockwise (like rect() and rrect()), so shapes that share a layer slot always merge
// instead of punching holes in each other.
function iceland_area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function iceland_pg(p) { return poly(iceland_area(p) < 0 ? p.slice().reverse() : p); }
function iceland_e(x, y, rx, ry) { return 'M' + PT(x - rx, y) + ' a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(2 * rx) + ' 0 a' + n1(rx) + ' ' + n1(ry) + ' 0 1 1 ' + n1(-2 * rx) + ' 0 Z '; }
function iceland_c(x, y, r) { return iceland_e(x, y, r, r); }
function iceland_re(x, y, rx, ry, ang) { var p = []; for (var i = 0; i < 20; i++) { var t = i / 20 * Math.PI * 2; p.push([rx * Math.cos(t), ry * Math.sin(t)]); } return iceland_pg(rotp(p, x, y, ang)); }
// y of a polyline (sorted by x) at x, flat beyond its ends
function iceland_yAt(pts, x) { if (x <= pts[0][0]) return pts[0][1]; for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if (x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1); } return pts[pts.length - 1][1]; }
// x where one side of a peak (a polyline that only climbs or only falls) reaches height y
function iceland_xAt(side, y) { for (var i = 0; i < side.length - 1; i++) { var a = side[i], b = side[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0) return a[0] + (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) || 1); } return side[side.length - 1][0]; }
// an open Catmull-Rom curve through the points, n steps per span
function iceland_curve(p, n) { var q = [p[0]].concat(p, [p[p.length - 1]]), o = [];
  for (var i = 1; i < q.length - 2; i++) { var a = q[i - 1], b = q[i], c = q[i + 1], d = q[i + 2]; for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
    o.push([0.5 * (2 * b[0] + (c[0] - a[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (c[1] - a[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * t3)]); } }
  o.push(p[p.length - 1]); return o; }
// a tapering blade or stem from (x, y) leaning by lean, h tall and w wide at the foot, bowed by bend
function iceland_blade(x, y, h, w, lean, bend) { var A = [], B = [], n = 6; for (var i = 0; i <= n; i++) { var u = i / n, cx = x + lean * u * u + bend * Math.sin(Math.PI * u), cy = y - h * u, ww = w * (1 - u) * 0.5 + 0.15; A.push([cx - ww, cy]); B.unshift([cx + ww, cy]); } return iceland_pg(A.concat(B)); }
// Kirkjufell's arrowhead outline, foot to foot, as (across, up) fractions of its half width and height
var iceland_KP = [[-1, 0], [-0.8, 0.04], [-0.6, 0.11], [-0.45, 0.21], [-0.34, 0.34], [-0.27, 0.5], [-0.22, 0.64], [-0.17, 0.78], [-0.12, 0.9], [-0.07, 0.97], [-0.03, 1], [0.02, 0.98], [0.07, 0.91], [0.12, 0.8], [0.18, 0.7], [0.26, 0.63], [0.36, 0.57], [0.46, 0.5], [0.56, 0.4], [0.68, 0.28], [0.8, 0.17], [0.9, 0.08], [1, 0]];
function iceland_kirk(cx, by, hw, h) { var pts = iceland_curve(iceland_KP.map(function (p) { return [cx + p[0] * hw, by - p[1] * h]; }), 5), top = 0;
  pts.forEach(function (p, i) { if (p[1] < pts[top][1]) top = i; }); return {pts: pts, L: pts.slice(0, top + 1), R: pts.slice(top), peak: pts[top]}; }
// A shaggy Icelandic horse standing on (x, y), scale s (about 36 * s long), facing dir (1 right, -1 left).
// g: 0 head up .. 1 grazing; toss: a small head toss (radians); wind: the phase of the mane and tail's flutter. Returns path strings.
function iceland_horse(x, y, s, dir, g, toss, wind) {
  var P = function (lx, ly) { return [x + dir * lx * s, y + ly * s]; }, Q = function (arr) { return iceland_pg(arr.map(function (q) { return P(q[0], q[1]); })); };
  var body = '', mane = '', dark = '', w = wind || 0;
  // barrel, chest and rump
  body += Q([[-14, -21], [-6, -24], [4, -24], [11, -22.5], [14.6, -18], [13, -12.6], [6, -11], [-6, -11], [-12.6, -12], [-15.6, -16]]);
  // legs: short, sturdy, slightly apart
  [[-12, 0.6], [-8.2, -0.4], [7.4, 0.4], [10.8, -0.6]].forEach(function (L) { var lx = L[0], k = L[1]; body += Q([[lx - 2.2, -13], [lx + 2.2, -13], [lx + 1.6 + k * 0.3, -5], [lx + 1.5 + k, -1.6], [lx - 1.5 + k, -1.6], [lx - 1.7 + k * 0.3, -5]]); dark += Q([[lx - 1.8 + k, -1.8], [lx + 1.8 + k, -1.8], [lx + 2.1 + k, 0], [lx - 2.1 + k, 0]]); });
  // neck and head: up, or down to the grass
  var na = (-56 + g * 108) * Math.PI / 180 + toss, sx = 9.5, sy = -20.5, nl = 13.5, px = sx + Math.cos(na) * nl, py = sy + Math.sin(na) * nl, nx = -Math.sin(na), ny = Math.cos(na);
  body += Q([[sx - 4.6 * nx - 1.5, sy - 4.6 * ny], [px - 3 * nx, py - 3 * ny], [px + 3 * nx, py + 3 * ny], [sx + 4.6 * nx + 2.5, sy + 5 * ny + 2]]);
  var ha = na + (68 - g * 26) * Math.PI / 180, hx = Math.cos(ha), hy = Math.sin(ha), hl = 10.5, mx = px + hx * hl, my = py + hy * hl, kx = -hy, ky = hx;
  body += Q([[px - kx * 3.4, py - ky * 3.4], [px + kx * 3.6, py + ky * 3.6], [mx + kx * 2.3, my + ky * 2.3], [mx - kx * 2.1, my - ky * 2.1]]) + iceland_c(P(mx, my)[0], P(mx, my)[1], 2.3 * s);
  // ears, standing up behind the poll
  var ex = px - hx * 1 - kx * 2.6, ey = py - hy * 1 - ky * 2.6; body += Q([[ex - hx * 1.4, ey - hy * 1.4], [ex + hx * 1.6, ey + hy * 1.6], [ex - kx * 4.2 - hx * 0.6, ey - ky * 4.2 - hy * 0.6]]);
  dark += iceland_c(P(px + hx * 4 - kx * 1.2, py + hy * 4 - ky * 1.2)[0], P(px + hx * 4 - kx * 1.2, py + hy * 4 - ky * 1.2)[1], 0.75 * s);
  // the thick mane along the top of the neck, falling to one side, and a forelock over the brow
  var mn = []; for (var i = 0; i <= 6; i++) { var u = i / 6, bx = sx - 2 + (px - sx + 2) * u, by = sy - 3 + (py - sy + 3) * u; mn.push([bx - nx * 4.2, by - ny * 4.2]); }
  for (i = 6; i >= 0; i--) { u = i / 6; bx = sx - 2 + (px - sx + 2) * u; by = sy - 3 + (py - sy + 3) * u; var hang = 3 + (i % 2) * 2.2 + Math.sin(i * 1.7 + w) * (w ? 1.4 : 0); mn.push([bx + nx * (hang - 3) - 1.2, by + ny * (hang - 3) + hang * 0.55]); }
  mane += Q(mn) + Q([[px - kx * 3, py - ky * 3], [px + hx * 4.6 - kx * 1.6 + Math.sin(w) * 1.2, py + hy * 4.6 - ky * 1.6], [px + hx * 3.4 + kx * 1.6, py + hy * 3.4 + ky * 1.6]]);
  // a long full tail
  var tw = Math.sin(w * 0.8) * 2.4; mane += Q([[-14.6, -20.4], [-17.8, -17], [-19.6 - tw * 0.6, -10], [-19.4 - tw, -3.2], [-16.4 - tw * 0.8, -2.4], [-16.6 - tw * 0.5, -9], [-14.6, -15.6]]);
  return {body: body, mane: mane, dark: dark};
}
// a red-roofed church seen from the side, its little tower to the left; (x, y) is the middle of its foot
function iceland_church(x, y, s) { var nw = 34 * s, nh = 13 * s, x0 = x - nw * 0.36, tw = 9 * s, th = 13 * s;
  return {wall: rect(x0, y - nh, nw, nh + 2) + rect(x0 - tw, y - nh - th, tw, nh + th + 2),
    roof: iceland_pg([[x0 - 1.5 * s, y - nh], [x0 + 3 * s, y - nh - 9 * s], [x0 + nw - 3 * s, y - nh - 9 * s], [x0 + nw + 2 * s, y - nh], [x0 + nw + 2 * s, y - nh + 1.6 * s], [x0 - 1.5 * s, y - nh + 1.6 * s]]) + iceland_pg([[x0 - tw - 1.2 * s, y - nh - th], [x0 - tw / 2, y - nh - th - 12 * s], [x0 + 1.2 * s, y - nh - th]]),
    win: [0.22, 0.47, 0.72].map(function (u) { return rect(x0 + nw * u - 1.7 * s, y - nh * 0.78, 3.4 * s, 5.6 * s) + iceland_c(x0 + nw * u, y - nh * 0.78, 1.7 * s); }).join('') + rect(x0 - tw / 2 - 1.4 * s, y - nh - th * 0.72, 2.8 * s, 3.6 * s),
    dark: rect(x0 - tw / 2 - 2.2 * s, y - 7 * s, 4.4 * s, 7 * s) + iceland_c(x0 - tw / 2, y - nh - th - 12.6 * s, 1.1 * s),
    lights: [0.22, 0.47, 0.72].map(function (u) { return [x0 + nw * u, y - nh * 0.6, 3.4 * s]; })}; }
// a row of turf-roofed cottages: white, red or tarred gables side by side under one grassy roof; (x, y) is the left foot
function iceland_turf(x, y, s, kinds) { var gw = 15 * s, wh = 9 * s, rh = 9.5 * s, n = kinds.length, x1 = x + n * gw, turf = [[x - 5 * s, y + 1], [x - 4 * s, y - wh * 0.8]], fronts = ['', '', ''], win = '', dark = '', lights = [];
  for (var i = 0; i < n; i++) { var gx = x + i * gw, mx = gx + gw / 2; turf.push([gx + 1.5 * s, y - wh - 1 * s], [mx - 2 * s, y - wh - rh + 1.2 * s], [mx, y - wh - rh - 1.6 * s], [mx + 2 * s, y - wh - rh + 1.2 * s], [gx + gw - 1.5 * s, y - wh - 1 * s]);
    fronts[kinds[i]] += iceland_pg([[gx + 1.6 * s, y + 1], [gx + 1.6 * s, y - wh], [mx, y - wh - rh + 1.8 * s], [gx + gw - 1.6 * s, y - wh], [gx + gw - 1.6 * s, y + 1]]);
    if (i % 2 === 0) { dark += rect(mx - 2 * s, y - 6.4 * s, 4 * s, 6.4 * s + 1); win += rect(mx - 1.4 * s, y - wh - rh * 0.48, 2.8 * s, 2.8 * s); lights.push([mx, y - wh - rh * 0.36, 2.6 * s]); }
    else { win += rect(mx - 3.4 * s, y - 6.6 * s, 2.8 * s, 3.2 * s) + rect(mx + 0.6 * s, y - 6.6 * s, 2.8 * s, 3.2 * s); lights.push([mx, y - 5 * s, 4 * s]); } }
  turf.push([x1 + 4 * s, y - wh * 0.8], [x1 + 5 * s, y + 1]);
  return {turf: iceland_pg(turf), fronts: fronts, win: win, dark: dark, lights: lights}; }
// a sea stack: a ragged basalt pillar with a split top, standing in the water at (x, base)
function iceland_stack(x, base, w, h, rnd) { var L = [], R = [], n = 8, i;
  for (i = 0; i <= n; i++) { var u = i / n, ww = w * (0.5 - u * 0.16) * (1 + (rnd() - 0.5) * 0.12); L.push([x - ww + Math.sin(u * 3) * w * 0.06, base - h * u * 0.86]); R.unshift([x + ww * 0.92 + Math.sin(u * 2.4) * w * 0.05, base - h * u * (0.8 + (u > 0.6 ? 0.04 : 0))]); }
  var t = L[n], r = R[0], mid = [(t[0] + r[0]) / 2, base - h * 0.84];
  return iceland_pg(L.concat([[t[0] + w * 0.08, base - h], [mid[0] - w * 0.04, base - h * 0.88], mid, [mid[0] + w * 0.08, base - h * 0.95], [r[0] - w * 0.04, base - h * 0.87]], R)); }

// ---------------------------------------------------------------- Iceland
// Kirkjufell, the arrowhead mountain, rising beside a bay; snow-streaked hills beyond; a red-roofed church and turf-roofed
// cottages on the far shore; a green meadow where Icelandic horses graze, with a geyser vent; a black sand beach with sea
// stacks on the right; and in front a cascade of small waterfalls over mossy basalt ledges, with lupines and cotton grass.
// The water in the falls, mist, horses, puffins, waves, geyser, rippling grass, aurora and window glows are the engine's.
var iceland_PAL = {
  L: {water: '#78AEC4', hill: '#A3B9C9', mtG: '#86A66A', rock: '#77716A', snow: '#F6FAFC', shade: 'rgba(40,62,72,0.15)', sun: 'rgba(255,253,240,0.95)', shine: 'rgba(255,255,255,0.62)', strata: 'rgba(58,54,48,0.32)',
    meadow: '#86B45C', pool: '#7FD6E0', white: '#F7F3EA', red: '#C8402E', turf: '#7C9A48', win: '#3E4C56', basalt: '#3A3B40', dark: '#26282C', hatch: 'rgba(52,90,40,0.32)', foam: 'rgba(255,255,255,0.4)',
    lrock: '#56575A', face: '#46474B', moss: '#86BE4A', fall: '#E2F2F7', froth: '#FFFFFF', grass: '#5E9A3C', lupin: '#8C6CD6', mossHi: '#B2D85E', joint: 'rgba(30,32,36,0.42)', streak: 'rgba(255,255,255,0.75)',
    horse: [['#B0643A', '#F0E2C0'], ['#2E2A2C', '#1E1A1C'], ['#EDE6DA', '#8E8A86']]},
  D: {water: '#1A3E56', hill: '#2C4462', mtG: '#2A4C48', rock: '#2C3240', snow: '#C2D4E6', shade: 'rgba(4,10,24,0.32)', sun: '#F6F2DC', shine: 'rgba(180,220,255,0.3)', strata: 'rgba(8,12,24,0.4)',
    meadow: '#24463A', pool: '#3A8A9C', white: '#B9C4CE', red: '#7A2C2E', turf: '#2C4834', win: '#FFC870', basalt: '#14171E', dark: '#0E1016', hatch: 'rgba(0,10,10,0.3)', foam: 'rgba(200,230,255,0.25)',
    lrock: '#1E232C', face: '#171B23', moss: '#2E5C3A', fall: '#9CC4D6', froth: '#D2E6F0', grass: '#22462E', lupin: '#5C4C96', mossHi: '#3E7044', joint: 'rgba(0,0,8,0.5)', streak: 'rgba(210,235,255,0.55)',
    horse: [['#6E3C26', '#B8A688'], ['#16141A', '#0E0C10'], ['#9EA2A8', '#56585E']]}
};
SCENES.iceland = function (W, H, dk, rnd) {
  var ph = H > W, far = Lay(14), bg = Lay(1.1), mid = Lay(0), near = Lay(0), C = iceland_PAL[dk ? 'D' : 'L'], i, j, x, k;
  var sy = H * (ph ? 0.5 : 0.585), nsy = H * (ph ? 0.632 : 0.7), S = ph ? 0.72 : Math.max(0.6, Math.min(1.15, H / 800));
  var sky = dk ? 'linear-gradient(180deg,#08142C 0%,#10264A 46%,#1F4A5A 100%)' : 'linear-gradient(180deg,#A8CFE6 0%,#E2EEF2 52%,#E6EEDD 100%)';
  // light low over the far hills, soft clouds by day; the sun (pale, behind thin cloud) or the moon
  add(far, 'a', iceland_e(W * 0.5, sy - H * 0.05, W * 0.85, H * 0.13), dk ? 'rgba(90,200,170,0.16)' : 'rgba(255,255,248,0.85)');
  var moon = [W * (ph ? 0.18 : 0.2), H * (ph ? 0.13 : 0.15), ph ? 15 : 22 * S];
  if (!dk) spread(0, H * 0.06, W, H * 0.28, ph ? 200 : 320, 90, rnd, 0.8).forEach(function (c) { if (c.q < 0.6) add(far, 'b', iceland_e(c.x, c.y, 70 + c.r * 70, 9 + c.k * 7) + iceland_e(c.x + 30, c.y - 7, 40, 9), 'rgba(255,255,255,0.88)'); });
  add(far, 'c', iceland_c(moon[0], moon[1], moon[2] * 2.6), dk ? 'rgba(200,230,255,0.22)' : 'rgba(255,252,236,0.75)');
  // the far hills, highest behind the village, streaked with old snow in their gullies
  var hill = []; for (x = -60; x <= W + 60; x += 8) hill.push([x, sy - H * (0.03 + 0.07 * Math.exp(-Math.pow((x - W * (ph ? 0.12 : 0.17)) / (W * (ph ? 0.3 : 0.22)), 2)) + 0.035 * Math.exp(-Math.pow((x - W * 0.97) / (W * 0.16), 2))) + Math.sin(x / 37 + 1) * H * 0.006 + Math.sin(x / 13) * H * 0.002]);
  var snowD = '';
  // old snow lies in patches just under the crests, reaching down the gullies in uneven fingers
  for (x = -20; x < W + 20;) { var pw0 = (ph ? 26 : 40) + rnd() * (ph ? 40 : 70), hy = iceland_yAt(hill, x + pw0 / 2); if (hy > sy - H * 0.045 || rnd() < 0.3) { x += pw0 * 0.8; continue; }
    var top = [], bot = [], fg = [0, 1, 2].map(function () { return [x + pw0 * (0.15 + rnd() * 0.7), (ph ? 3 : 5) + rnd() * 6, rnd() < 0.6 ? (0.05 + rnd() * 0.14) : 0]; });
    for (var sx2 = x; sx2 <= x + pw0; sx2 += 3) { var hy2 = iceland_yAt(hill, sx2), ed = Math.sin(Math.PI * (sx2 - x) / pw0), fing = 0; fg.forEach(function (f) { fing += (sy - hy2) * f[2] * Math.exp(-Math.pow((sx2 - f[0]) / f[1], 2)); });
      top.push([sx2, hy2 + 1.2]); bot.unshift([sx2, hy2 + 1.2 + (1.5 + ed * 4) + fing * ed]); }
    snowD += iceland_pg(top.concat(bot)); x += pw0 + rnd() * (ph ? 20 : 40); }
  // Kirkjufell, beside the bay
  var mcx = W * (ph ? 0.64 : 0.645), mhw = W * (ph ? 0.44 : 0.25), mh = H * (ph ? 0.24 : 0.36), K = iceland_kirk(mcx, sy + 1, mhw, mh), mP = K.pts;
  var mtn = iceland_pg(mP.concat([[mcx + mhw, sy + 3], [mcx - mhw, sy + 3]]));
  var vy = function (v) { return sy + 1 - v * mh; }, band = function (v1, v2, rag) { var y1 = vy(v1), y2 = vy(v2), a = iceland_xAt(K.L, y2), b = iceland_xAt(K.R, y2), c2 = iceland_xAt(K.R, y1), d = iceland_xAt(K.L, y1), p = [];
    for (var q = 0; q <= 10; q++) { var u = q / 10; p.push([a + (b - a) * u, y2 + Math.sin(u * 17 + v1 * 40) * rag]); } for (q = 10; q >= 0; q--) { u = q / 10; p.push([d + (c2 - d) * u, y1 + Math.sin(u * 13 + v2 * 30) * rag * 1.4 + (q % 2) * rag]); } return iceland_pg(p); };
  // the rocky cap: the outline above v = 0.6, with a ragged lower edge
  var cv = 0.6, cy = vy(cv), cap = [[iceland_xAt(K.L, cy), cy]]; mP.forEach(function (p) { if (p[1] < cy) cap.push(p); }); cap.push([iceland_xAt(K.R, cy), cy]);
  var cxl = cap[0][0], cxr = cap[cap.length - 1][0]; for (k = 9; k >= 1; k--) { var u0 = k / 10; cap.push([cxl + (cxr - cxl) * u0, cy + 3 + Math.sin(u0 * 23) * 4 + (k % 3) * 2.4]); }
  var rock = iceland_pg(cap) + band(0.17, 0.205, 1.4) + band(0.29, 0.335, 1.6) + band(0.41, 0.465, 2) + band(0.515, 0.565, 2.2);
  // strata lines across the cap and the grassy ledges, gullies down the cliffs, and snow left in the highest gullies
  var strata = '', mSnow = '';
  [0.1, 0.24, 0.36, 0.49, 0.64, 0.7, 0.76, 0.82, 0.88].forEach(function (v, q) { var y = vy(v), a = iceland_xAt(K.L, y) + 3, b = iceland_xAt(K.R, y) - 3, p = []; for (var z = 0; z <= 12; z++) { var u = z / 12; p.push([a + (b - a) * u, y + Math.sin(u * 11 + q) * 1.6]); } strata += pline(p); });
  for (k = 0; k < (ph ? 9 : 14); k++) { var gv = 0.62 + hash(k + 3) * 0.3, gy = vy(gv), ga = iceland_xAt(K.L, gy), gb = iceland_xAt(K.R, gy), gx = ga + (gb - ga) * (0.12 + hash(k + 7) * 0.76), gl = mh * (0.05 + hash(k + 11) * 0.1);
    strata += seg(gx, gy, gx + (gx - mcx) * 0.08, gy + gl);
  }
  // the shady eastern face, and the mountain's reflection in the bay
  var sh = [K.peak]; K.R.forEach(function (p, q) { if (q) sh.push(p); }); sh.push([mcx + mhw, sy + 2], [mcx + mhw * 0.12, sy + 2], [mcx + mhw * 0.05, vy(0.3)], [K.peak[0] + mhw * 0.04, vy(0.7)]);
  var refl = iceland_pg(mP.map(function (p) { return [p[0], sy + (sy - p[1]) * 0.3]; }).concat([[mcx + mhw, sy], [mcx - mhw, sy]]));
  // the far shore: a low green strip under the hills where the village stands, and the mountain's grassy foot
  var shore = []; for (x = -20; x <= W + 20; x += 10) shore.push([x, sy - H * 0.01 - Math.sin(x / 50) * 1.5 - Math.exp(-Math.pow((x - mcx) / mhw, 2)) * H * 0.008]);
  var shoreD = iceland_pg(shore.concat([[W + 20, sy + 3], [-20, sy + 3]]));
  // the bay, with glints
  var shine = ''; spread(0, sy + 6, W, nsy - sy, ph ? 80 : 120, 14, rnd, 1).forEach(function (c) { if (c.q < 0.5) shine += seg(c.x, c.y, c.x + 10 + c.r * 24, c.y); });
  add(bg, 'a', rect(-10, sy, W + 20, H - sy + 10), C.water); add(bg, 'b', below(hill, sy + 2), C.hill); add(bg, 'c', mtn + shoreD, C.mtG); add(bg, 'd', rock, C.rock); add(bg, 'e', snowD + mSnow, C.snow); add(bg, 'f', iceland_pg(sh) + refl, C.shade);
  stk(bg, 's', strata, C.strata, 1); stk(bg, 't', shine, C.shine, 1.2);
  // stars over everything but the land, and the moon (by day a pale sun behind thin cloud)
  var skyline = []; for (x = -50; x <= W + 50; x += 10) skyline.push([x, Math.min(iceland_yAt(hill, x), x > mcx - mhw && x < mcx + mhw ? iceland_yAt(mP, x) : 1e9)]);
  if (dk) { var st = ''; spread(0, 0, W, sy - H * 0.06, 30, 30, rnd, 1).forEach(function (c) { if (c.q < 0.32 && c.y < iceland_yAt(skyline, c.x) - 8 && Math.hypot(c.x - moon[0], c.y - moon[1]) > moon[2] + 8) st += iceland_c(c.x, c.y, 0.45 + c.r * 0.85); }); add(bg, 'h', st, 'rgba(232,242,255,0.82)'); }
  add(bg, 'g', iceland_c(moon[0], moon[1], moon[2]), C.sun);
  // ---- the village on the far shore
  var VS = (ph ? 0.75 : 1.3) * Math.min(1.15, Math.max(0.7, S)), vyb = sy - H * 0.006, ch = iceland_church(W * (ph ? 0.15 : 0.2), vyb, VS), lights = [].concat(ch.lights);
  var tA = iceland_turf(W * (ph ? 0.27 : 0.27), vyb, VS, [0, 2, 1, 0]), tB = iceland_turf(W * (ph ? 0.01 : 0.055), vyb, VS * 0.92, [1, 0, 0]), tC = iceland_turf(W * (ph ? 0.4 : 0.36), vyb + 1, VS * 0.85, [0, 1]);
  lights = lights.concat(tA.lights, tB.lights, tC.lights);
  var fence = ''; [[W * 0.005, W * (ph ? 0.12 : 0.15)], [W * (ph ? 0.33 : 0.32), W * (ph ? 0.47 : 0.42)]].forEach(function (f) { fence += seg(f[0], vyb + 1.5, f[1], vyb + 1.5); for (var fx = f[0]; fx <= f[1]; fx += 6 * VS) fence += seg(fx, vyb + 2, fx, vyb - 3.5 * VS); });
  // ---- the near meadow (with tussocks), the black sand beach and the sea stacks
  var xm1 = W * (ph ? 0.68 : 0.58), xm2 = W * (ph ? 0.8 : 0.68), nm = [];
  for (x = -20; x <= xm1; x += 10) nm.push([x, nsy + Math.sin(x / 70) * H * 0.004 + (x / W) * H * 0.012]);
  // the meadow ends in a low grassy bank above the beach, bulging out a little
  var nmEnd = nm[nm.length - 1], me = []; for (k = 0; k <= 12; k++) { var u1 = k / 12; me.push([xm1 + 4 + (xm2 - xm1 + 4) * u1 + Math.sin(u1 * Math.PI) * W * 0.035 + Math.sin(u1 * 11) * 3, nmEnd[1] + 2 + (H + 10 - nmEnd[1] - 2) * u1]); }
  var meadow = iceland_pg(nm.concat(me, [[-20, H + 10]]));
  var hatch = ''; spread(0, nsy + 6, xm2, H - nsy, ph ? 22 : 30, ph ? 12 : 16, rnd, 1).forEach(function (c) { if (c.q < 0.55) hatch += 'M' + PT(c.x - 4, c.y) + ' Q' + PT(c.x, c.y - 3.4) + ' ' + PT(c.x + 4, c.y) + ' '; });
  var yb0 = nmEnd[1] + 3, ybR = H * (ph ? 0.79 : 0.86), wl = []; for (k = 0; k <= 24; k++) { var u = k / 24; wl.push([xm1 - 2 + (W + 24 - xm1) * u, yb0 + (ybR - yb0) * (u * 0.62 + 0.38 * u * u) + Math.sin(u * 9) * 2]); }
  var beach = iceland_pg(wl.concat([[W + 24, H + 10]], me.slice().reverse().map(function (p) { return [p[0] - 5, p[1]]; }), [[xm1 - 2, yb0]]));
  // the black sand: wind ripples and pebbles, a little lighter than the sand
  var sand = '', pebs = ''; spread(xm1, yb0, W - xm1, H - yb0, ph ? 18 : 26, ph ? 9 : 12, rnd, 1).forEach(function (c) { var wy = iceland_yAt(wl, c.x); if (c.y < wy + 7 || c.x < iceland_xAt(me, c.y) + 4) return; var d = (c.y - wy) / (H - wy + 1);
    if (c.q < 0.45) sand += iceland_re(c.x, c.y, (6 + c.r * 10) * (0.6 + d), 0.7 + d * 0.8, -6 + c.k * 4); else if (c.q < 0.62) pebs += iceland_e(c.x, c.y, (1.4 + c.r * 2.4) * (0.6 + d), (0.9 + c.r * 1.4) * (0.6 + d)); });
  var stacks = (ph ? [[0.84, 0.035, 0.07, 0.12], [0.95, 0.06, 0.05, 0.075]] : [[0.855, 0.0, 0.03, 0.17], [0.91, 0.022, 0.018, 0.1], [0.965, 0.034, 0.034, 0.19]]).map(function (q) { return {x: W * q[0], base: nsy + H * q[1], w: W * q[2], h: H * q[3]}; });
  var stD = '', stL = '', stF = ''; stacks.forEach(function (s) { stD += iceland_stack(s.x, s.base, s.w, s.h, rnd); for (var q = -1; q <= 1; q++) stL += seg(s.x + q * s.w * 0.22, s.base - 2, s.x + q * s.w * 0.2, s.base - s.h * (0.62 + 0.1 * (q + 1))); stF += seg(s.x - s.w * 0.8, s.base + 1, s.x + s.w * 0.8, s.base + 1); s.top = s.base - s.h; });
  stacks.forEach(function (s) { skyline.forEach(function (p) { if (Math.abs(p[0] - s.x) < s.w * 0.6) p[1] = Math.min(p[1], s.top); }); });
  // the geyser's pale sinter mound and its little blue pool
  var gX = W * (ph ? 0.13 : 0.405), gY = nsy + H * (ph ? 0.016 : 0.025), gR = (ph ? 13 : 20) * S, sinter = iceland_e(gX, gY + gR * 0.08, gR * 1.5, gR * 0.34), gpool = iceland_e(gX, gY, gR * 0.78, gR * 0.2);
  // three horses grazing (the engine animates them)
  var horses = (ph ? [[0.57, 0.022, 0.72, 1, 0], [0.66, 0.036, 0.78, -1, 1], [0.6, 0.062, 0.84, 1, 2]] : [[0.465, 0.045, 1.3, 1, 0], [0.55, 0.062, 1.36, -1, 1], [0.5, 0.088, 1.45, 1, 2]]).map(function (q, n) { return {x: W * q[0], y: nsy + H * q[1], s: q[2] * (ph ? 1 : S), dir: q[3], col: q[4], g: [0.85, 0.2, 1][n]}; });
  var hW = '', hR = '', hD = '', hB = '';
  if (!ANIM) horses.forEach(function (h) { var p = iceland_horse(h.x, h.y, h.s, h.dir, h.g, 0, 0); if (h.col === 0) { hR += p.body; hW += p.mane; } else if (h.col === 1) { hD += p.body + p.mane; } else { hW += p.body; hB += p.mane; } hD += p.dark; });
  add(mid, 'a', meadow, C.meadow); add(mid, 'b', tA.turf + tB.turf + tC.turf, C.turf);
  add(mid, 'c', ch.wall + tA.fronts[0] + tB.fronts[0] + tC.fronts[0] + sinter + hW, C.white);
  add(mid, 'd', ch.roof + tA.fronts[1] + tB.fronts[1] + tC.fronts[1] + hR, C.red);
  add(mid, 'e', gpool, C.pool); add(mid, 'f', ch.win + tA.win + tB.win + tC.win, C.win);
  add(mid, 'g', beach + stD + hB, C.basalt); add(mid, 'h', ch.dark + tA.dark + tB.dark + tC.dark + tA.fronts[2] + tB.fronts[2] + tC.fronts[2] + hD, C.dark);
  stk(mid, 's', hatch + stL + fence, C.hatch, 1.1); stk(mid, 't', stF, C.foam, 1.4);
  // ---- the cascade: three tiers of falls over mossy basalt ledges, each a little wider and nearer
  var T = ph ? [[0.36, 0.672, 0.745, 0.06, 0.08], [0.32, 0.76, 0.85, 0.105, 0.125], [0.26, 0.868, 0.955, 0.15, 0.18]] : [[0.258, 0.745, 0.8, 0.026, 0.036], [0.245, 0.815, 0.89, 0.046, 0.058], [0.215, 0.905, 0.972, 0.074, 0.09]];
  var tiers = T.map(function (q, n) { return {cx: W * q[0], lip: H * q[1], base: H * q[2], hwT: W * q[3], hwB: W * q[4], R: W * q[0] + W * (ph ? 0.13 + n * 0.05 : 0.12 + n * 0.03)}; });
  var lrock = '', face = '', moss = '', mossHi = '', fall = '', froth = '', joints = '', streaks = '', pools = [], mh2 = (ph ? 9 : 12) * S;
  tiers.forEach(function (t, n) { var nxt = tiers[n + 1], bot = nxt ? nxt.lip + 6 : H + 12, L = -30, edge = [], q;
    // the ledge's front edge: ragged rock, but a smooth lip where the water spills
    for (x = L; x <= t.R; x += 8) { var inC = Math.abs(x - t.cx) < t.hwT + 3; edge.push([x, t.lip + (inC ? 0 : Math.sin(x * 0.21 + n) * 2.2 + Math.sin(x * 0.07) * 2) - (x > t.R - 40 ? Math.pow((x - t.R + 40) / 40, 2) * mh2 * 0.8 : 0)]); }
    var er = edge[edge.length - 1];
    lrock += iceland_pg(edge.map(function (p) { return [p[0], p[1] - mh2 * 0.5]; }).concat([[er[0] + 10, er[1] + 4], [er[0] + 14, bot], [L, bot]]));
    // basalt columns on the face: every other one in shade, with their joints (none behind the falling water)
    var cw0 = (ph ? 9 : 12) * S, cw;
    for (x = L + (n * 5) % cw0; x < t.R - 4; x += cw) { cw = cw0 * (0.7 + hash(x * 0.37 + n) * 0.7); var y0 = iceland_yAt(edge, x + cw / 2) + 2 + hash(x + 3 * n) * 4, cl = Math.abs(x + cw / 2 - t.cx) < t.hwB + cw * 0.5; if (cl || x + cw > t.R - 6) continue;
      if (hash(x * 1.7 + n) < 0.45) face += rect(x, y0, cw, bot - y0); else if (hash(x * 2.3) < 0.3) face += rect(x + cw * 0.55, y0 + 2, cw * 0.45, bot - y0); joints += seg(x, y0 + 1, x, bot - 2); if (hash(x + n) < 0.5) joints += seg(x, y0 + (bot - y0) * (0.3 + hash(x * 3) * 0.4), x + cw, y0 + (bot - y0) * (0.34 + hash(x * 3) * 0.4)); }
    // a thick cushion of moss along the top, hanging over the lip, with bright tufts
    var mt = edge.map(function (p) { return [p[0], p[1] - mh2]; }), mb = []; edge.forEach(function (p, z) { var inC = Math.abs(p[0] - t.cx) < t.hwT + 3; mb.unshift([p[0], p[1] + (inC ? -1 : 2 + (z % 3) * 1.6 + Math.sin(z * 2.3) * 1.2)]); });
    moss += iceland_pg(mt.concat([[er[0] + 8, er[1] - 2]], mb)); edge.forEach(function (p, z) { if (Math.abs(p[0] - t.cx) < t.hwT + 6) return; moss += iceland_e(p[0], p[1] - mh2 + 1, (6 + (z % 3) * 2) * S, (3 + (z % 2) * 1.6) * S);
      if (hash(z * 3.1 + n) < 0.28 && Math.abs(p[0] - t.cx) > t.hwB + 10) { var tl = (6 + hash(z + n) * 12) * S; moss += iceland_pg([[p[0] - 4 * S, p[1] + 1], [p[0] + 4 * S, p[1] + 1], [p[0] + 1.6 * S, p[1] + tl], [p[0] - 1.2 * S, p[1] + tl * 0.9]]); } }); edge.forEach(function (p, z) { if (z % 3 === 1 && Math.abs(p[0] - t.cx) > t.hwT + 8) mossHi += iceland_e(p[0], p[1] - mh2 * 0.7, (ph ? 5 : 7) * S, (ph ? 2 : 2.6) * S); });
    // the falling sheet, flaring as it drops, and the pool it lands in on the next ledge
    var sheet = [], hwm; for (q = 0; q <= 8; q++) { var v = q / 8; hwm = t.hwT + (t.hwB - t.hwT) * Math.sqrt(v); sheet.push([t.cx - hwm, t.lip + (t.base - t.lip) * v]); }
    for (q = 8; q >= 0; q--) { v = q / 8; hwm = t.hwT + (t.hwB - t.hwT) * Math.sqrt(v); sheet.push([t.cx + hwm, t.lip + (t.base - t.lip) * v]); }
    sheet.push([t.cx + t.hwT * 0.5, t.lip - 2.4], [t.cx - t.hwT * 0.5, t.lip - 2.4]); fall += iceland_pg(sheet);
    var pcx = nxt ? (t.cx + nxt.cx) / 2 : t.cx, pry = nxt ? Math.max(5, (nxt.lip - t.base) * 0.6 + 4) : (ph ? 14 : 16) * S, pool = {x: pcx, y: nxt ? (t.base + nxt.lip) / 2 + 1 : t.base + pry * 0.6, rx: t.hwB * 1.5, ry: pry};
    fall += iceland_e(pool.x, pool.y, pool.rx, pool.ry); pools.push(pool);
    // white water where the sheet lands: big soft puffs with smaller ones on top
    for (q = 0; q < 7; q++) { var fxp = t.cx - t.hwB * 0.95 + q / 6 * t.hwB * 1.9, fr = t.hwB * (0.2 + hash(q + n * 9) * 0.1); froth += iceland_e(fxp, t.base - fr * 0.1, fr, fr * 0.55); if (q % 2) froth += iceland_e(fxp + fr * 0.4, t.base - fr * 0.6, fr * 0.6, fr * 0.4); }
    for (q = 1; q < 6; q++) { var sxp = -1 + q / 3; streaks += seg(t.cx + sxp * t.hwT * 0.8, t.lip + 3, t.cx + sxp * t.hwB * 0.8, t.base - 4); } });
  // rounded boulders around the bottom pool, moss on their crowns
  var last = tiers[2], bPool = pools[2];
  [[-1.25, 0.2, 1.1], [1.2, 0.35, 0.9], [1.55, -0.1, 0.6], [-1.6, -0.2, 0.7]].forEach(function (q) { var bx = bPool.x + q[0] * bPool.rx, by2 = bPool.y + q[1] * bPool.ry, r = (ph ? 18 : 26) * S * q[2]; lrock += iceland_e(bx, by2, r, r * 0.62); moss += iceland_e(bx - r * 0.1, by2 - r * 0.4, r * 0.72, r * 0.24); });
  // the shingle where the cascade meets the beach, and boulders on the black sand
  [[0.08, 0.008, 1], [0.2, 0.05, 0.7], [0.3, 0.1, 1.3]].forEach(function (q, n) { var bx = W - W * q[0] * (ph ? 1.3 : 1), by2 = H * (1.01 - q[1]), r = (ph ? 20 : 30) * S * q[2]; lrock += iceland_pg([[bx - r, by2 + r * 0.4], [bx - r * 0.85, by2 - r * 0.3], [bx - r * 0.2, by2 - r * 0.62], [bx + r * 0.6, by2 - r * 0.45], [bx + r, by2 + r * 0.4]]); if (n !== 1) face += iceland_pg([[bx + r * 0.1, by2 - r * 0.55], [bx + r * 0.6, by2 - r * 0.45], [bx + r, by2 + r * 0.4], [bx + r * 0.2, by2 + r * 0.4]]); });
  // grass, lupines and cotton grass: along the cascade's right end, the meadow's edge by the beach, and the bottom corners
  var grass = '', lup = '', cot = '', blades = [], clumps = [];
  var spots = [[last.R + W * 0.01, H * 0.985, 1.2], [tiers[1].R + 6, tiers[1].lip - 4, 0.9], [tiers[0].R + 4, tiers[0].lip - 4, 0.75], [xm1 + (xm2 - xm1) * 0.3, nmEnd[1] + (H - nmEnd[1]) * 0.3, 0.85], [xm1 + (xm2 - xm1) * 0.62, nmEnd[1] + (H - nmEnd[1]) * 0.62, 1], [xm2 - 4, H * 0.99, 1.2], [W * 0.012, H * 0.99, 1.1], [W * (ph ? 0.5 : 0.36), H * 1.0, 1]];
  spots.forEach(function (p, n) { var sc = p[2] * (ph ? 0.8 : 1) * S; clumps.push([p[0], p[1], sc]);
    for (var q = 0; q < 9; q++) { var bx = p[0] + (q - 4) * 4.4 * sc + Math.sin(q * 3 + n) * 2, bh = (16 + hash(q + n * 7) * 16) * sc; if (!ANIM) grass += iceland_blade(bx, p[1] + 2, bh, 3.2 * sc, (q - 4) * 2.2 * sc, (hash(q * 5 + n) - 0.5) * 6 * sc); blades.push([bx, p[1] + 2, bh * 1.05, (q - 4) * 2.2 * sc, 3.2 * sc]); }
    for (q = 0; q < 3; q++) { var lx = p[0] + (q - 1) * 11 * sc + 3, lh = (30 + hash(q + n * 3) * 18) * sc, ly = p[1] + 1; if (n % 3 === 2 && q === 1) continue;
      grass += iceland_blade(lx, ly, lh * 0.55, 2.2 * sc, 0, 1) + iceland_re(lx - 5 * sc, ly - lh * 0.3, 5 * sc, 1.6 * sc, -30) + iceland_re(lx + 5 * sc, ly - lh * 0.34, 5 * sc, 1.6 * sc, 30);
      for (var z = 0; z < 7; z++) { var fy = ly - lh * 0.48 - z * lh * 0.075, fr = (3 - z * 0.25) * sc; lup += iceland_e(lx - fr * 0.7, fy, fr * 0.75, fr * 0.6) + iceland_e(lx + fr * 0.7, fy - fr * 0.2, fr * 0.75, fr * 0.6); } lup += iceland_e(lx, ly - lh * 0.48 - 7 * lh * 0.075, 1.6 * sc, 2.6 * sc); }
    if (n % 2 === 0) for (q = 0; q < 4; q++) { var cx2 = p[0] + (q - 1.5) * 8 * sc + 18 * sc, chh = (20 + hash(q + n) * 10) * sc; grass += iceland_blade(cx2, p[1] + 1, chh, 1.2 * sc, (q - 1.5) * 1.5, 0); cot += iceland_e(cx2 + (q - 1.5) * 1.5, p[1] + 1 - chh, 3.2 * sc, 3.8 * sc); } });
  // a fringe of lyme grass along the bank above the beach
  me.forEach(function (p, q) { if (q === me.length - 1) return; for (var z = 0; z < 3; z++) { var bx = p[0] - 4 + z * 3, by3 = p[1] + 2 + z * 2, bh = (8 + hash(q * 3 + z) * 10) * S * (0.7 + p[1] / H * 0.5); grass += iceland_blade(bx, by3, bh, 2 * S, (z - 1) * 3 + 2, 1); } });
  // tussocks scattered over the open meadow (not over the horses, the geyser or the cascade)
  spread(0, nsy + 10, xm1, H - nsy - 10, ph ? 34 : 46, ph ? 16 : 20, rnd, 1).forEach(function (c) { if (c.q > 0.5 || c.x > iceland_xAt(me, c.y) - 12) return;
    if (tiers.some(function (tt) { return c.x < tt.R + 10 && c.y > tt.lip - mh2 * 2; })) return;
    if (Math.hypot(c.x - gX, (c.y - gY) * 2) < gR * 2.4 || horses.some(function (h) { return Math.abs(c.x - h.x) < 30 * h.s && c.y < h.y + 4 && c.y > h.y - 34 * h.s; })) return;
    var d = (c.y - nsy) / (H - nsy), sc = (0.5 + d * 0.9) * S; mossHi += iceland_e(c.x, c.y, 6 * sc, 2.4 * sc); for (var q = 0; q < 3; q++) grass += iceland_blade(c.x + (q - 1) * 2.6 * sc, c.y + 1, (6 + c.r * 6) * sc, 1.6 * sc, (q - 1) * 2 * sc, 0); });
  add(near, 'a', lrock, C.lrock); add(near, 'b', face + sand + pebs, C.face); add(near, 'c', moss, C.moss); add(near, 'd', fall, C.fall); add(near, 'e', froth + cot, C.froth);
  add(near, 'f', grass, C.grass); add(near, 'g', lup, C.lupin); add(near, 'h', mossHi, C.mossHi); stk(near, 's', joints, C.joint, 1.1);
  if (!ANIM) stk(near, 't', streaks, C.streak, ph ? 1.4 : 1.8);
  if (ANIM) {
    ANIM.C = C; ANIM.sy = sy; ANIM.nsy = nsy; ANIM.S = S; ANIM.moon = moon; ANIM.peak = K.peak; ANIM.mtn = {cx: mcx, hw: mhw, h: mh};
    ANIM.skyline = skyline; ANIM.tiers = tiers; ANIM.pools = pools; ANIM.fallPath = fall; ANIM.horses = horses; ANIM.geyser = {x: gX, y: gY, r: gR}; ANIM.wl = wl; ANIM.stacks = stacks; ANIM.lights = lights; ANIM.blades = blades; ANIM.clumps = clumps;
  }
  return {sky: sky, far: far, refl: bg, mid: mid, near: near};
};
