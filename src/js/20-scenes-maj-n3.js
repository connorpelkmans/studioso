/* ===== module: 20-scenes-maj-n3.js ===== */
/* New Theme Ideas, batch n3 (Cozy Spots) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a monstera leaf pointing up, with two slits each side
  const monstera = (() => { const TH = [0, 0.06, 0.25, 0.5, 0.75, 0.9, 1], RR = [0.6, 0.52, 0.48, 0.44, 0.46, 0.4, 0.3], up = [];
    const rad = t => { for (let k = 1; k < TH.length; k++) if (t <= TH[k]) return RR[k - 1] + (RR[k] - RR[k - 1]) * (t - TH[k - 1]) / (TH[k] - TH[k - 1]); return 0.3; };
    for (let i = 0; i <= 40; i++) { const t = i / 40; let rr = rad(t); for (let s = 0; s < 2; s++) { const c = 0.24 + 0.52 * (s + 0.5) / 2, d = Math.abs(t - c); if (d < 0.03) rr = Math.min(rr, 0.16 + d * 6); } up.push([rr * Math.sin(t * Math.PI) * 1.05 * 22, -(0.42 * 22 + rr * 22 * Math.cos(t * Math.PI)) + 11]); }
    const lo = up.slice(1, -1).reverse().map(p => [-p[0], p[1]]);
    return {d: pts(up.concat(lo)) + "M-0.7 10.5V12H0.7V10.5Z", detail: "M0 9.5L0 -9.5M0 -2L4.5 -5M0 -2L-4.5 -5M0 3L4 0.5M0 3L-4 0.5", dstroke: true}; })();
  const bloom = (() => { let d = ""; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), q = [[0, 0], [2.6, 4.5], [0, 11], [-2.6, 4.5]]; d += pts(q.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c])); } return {d: d + circ(0, 0, 3.4), detail: circ(0, 0, 2.2), dfill: true}; })();
  Object.assign(FX_SHAPES, {
    n3leaf: monstera,
    n3bloom: bloom,
    n3vase: {d: "M-3 -11H3V-9.6H2.2V-7.6C6.6 -5.6 8.6 -2 8.6 2C8.6 7 5 10.2 2.6 11.2H-2.6C-5 10.2 -8.6 7 -8.6 2C-8.6 -2 -6.6 -5.6 -2.2 -7.6V-9.6H-3Z", detail: "M-8.2 0.6H8.2M-7.4 4.6H7.4", dstroke: true},
    n3flame: {d: "M0 -11.5C3 -7 8.2 -4 8.2 2.6C8.2 7.6 4.6 11 0 11C-4.6 11 -8.2 7.6 -8.2 2.6C-8.2 -1.6 -5.6 -3.6 -4.6 -7.2C-3 -4.6 -2.6 -2.4 -1 -1.2C-1.6 -5 -1 -8.6 0 -11.5Z", detail: "M0 0.5C2 2.5 3.8 4 3.8 6.6C3.8 9 2 10.4 0 10.4C-2 10.4 -3.8 9 -3.8 6.6C-3.8 4.6 -1.6 3 0 0.5Z", dfill: true},
    n3mallow: {d: "M-8 -6C-8 -9.6 8 -9.6 8 -6V6C8 9.6 -8 9.6 -8 6Z", detail: "M-8 -6C-8 -2.6 8 -2.6 8 -6", dstroke: true},
    n3fish: {d: "M-6 0C-3 -6.4 6 -7.4 11.4 0C6 7.4 -3 6.4 -6 0Z M-5 0L-11.5 -6V6Z", detail: circ(5.6, -1.2, 1.5), dfill: true},
  });

  /* ---- completion animations ---- */
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const fillP = (g, c, d) => { g.fillStyle = c; g.fill(new Path2D(d)); };
  // soft light top left, shade bottom right, for painted sprites
  const sheen = (g, dk, k = 1) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${0.34 * k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dk ? 0.26 : 0.2})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const eye = (g, x, y, r) => { g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); g.fillStyle = "#14202A"; g.beginPath(); g.arc(x + r * 0.25, y, r * 0.62, 0, 6.3); g.fill(); };
  // reef fish, all pointing to +x with the back up
  const FB = "M-7 0C-4 -6.6 5 -7.4 10.6 0C5 7.4 -4 6.6 -7 0Z", FT = "M-6 0L-11.6 -5.8Q-10 0 -11.6 5.8Z";
  const TB = "M-7.5 0C-5 -7.8 5 -8.2 10.4 -0.6C10.8 0 10.8 0.4 10.4 0.8C5 8 -5 7.8 -7.5 0Z", TT = "M-6.6 0L-11.8 -5.6L-10.4 0L-11.8 5.6Z";
  const YB = "M-6 0C-6 -8.6 2 -10.4 9.8 -1C10.4 -0.4 10.4 0.4 9.8 1C2 10.4 -6 8.6 -6 0Z", YT = "M-5.4 0L-10.8 -4.8L-9.6 0L-10.8 4.8Z";
  Object.assign(FX_SHAPES, {
    // a soft round puff that fades to clear in its own color
    n3soft: {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, c); gr.addColorStop(0.5, c + "99"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }},
    n3clown: {d: FB + FT, paint: (g, c, dk) => { const b = new Path2D(FB); fillP(g, "#E05A16", FT); fillP(g, "#F07020", "M-2.4 -5.2Q1 -9.6 5.4 -5.4Z M-1.4 5.2Q1.4 8.8 4.6 5.2Z"); g.fillStyle = "#F7801F"; g.fill(b);
      g.save(); g.clip(b); g.fillStyle = "#FFFFFF"; g.strokeStyle = "#1A1A22"; g.lineWidth = 0.8; [[4.8, 2.4], [-0.4, 2.6], [-5.4, 1.8]].forEach(([x, w]) => { g.fillRect(x - w / 2, -9, w, 18); g.strokeRect(x - w / 2, -9, w, 18); }); g.restore();
      sheen(g, dk); eye(g, 7.2, -1.5, 1.5); }},
    n3tang: {d: TB + TT, paint: (g, c, dk) => { fillP(g, "#FFC81E", TT); fillP(g, "#1E3E9E", "M-5 -5.4Q1 -10.4 7 -5.6Z M-4.6 5.4Q1 9.6 6 5.4Z"); fillP(g, "#2F62E0", TB);
      fillP(g, "#12204A", "M-5.6 -3.4C-1 -7 5.4 -6 8.2 -2.6C4.6 -4 0.4 -2.6 -1.6 0.6C-2.8 2.6 -5.4 2.2 -5.6 -3.4Z"); sheen(g, dk); eye(g, 6.8, -1.8, 1.4); }},
    n3ytang: {d: YB + YT, paint: (g, c, dk) => { fillP(g, "#F2B50E", YT); fillP(g, "#FFD526", YB); fillP(g, "#F5BE12", "M-4.4 -5.6Q1 -11 7 -4.4L4 -3.4Q0 -6.4 -4.4 -5.6Z"); sheen(g, dk); fillP(g, "#FFFFFF", "M-4.6 0.6L-3.2 -0.4L-3 1.4Z"); eye(g, 6.4, -2, 1.3); }},
    n3gramma: {d: FB + FT, paint: (g, c, dk) => { const b = new Path2D(FB); fillP(g, "#FFC21E", FT); g.save(); g.clip(b); g.fillStyle = "#FFC21E"; g.fillRect(-13, -13, 26, 26); g.fillStyle = "#9A4CE0"; g.beginPath(); g.moveTo(1.6, -9); g.bezierCurveTo(-1, -3, 1, 3, -1.6, 9); g.lineTo(12, 9); g.lineTo(12, -9); g.fill(); g.restore(); fillP(g, "#8A40D0", "M0 -5.6Q3 -9.4 6.4 -5Z"); sheen(g, dk); eye(g, 7.2, -1.5, 1.4); }},
    // a tiny clay drop, a grown vase, a log
    n3clay: {d: "M0 -6C3.4 -2 4.6 0.6 4.6 2.4A4.6 4.6 0 0 1 -4.6 2.4C-4.6 0.6 -3.4 -2 0 -6Z"}
  });
  // a school: a few fish of one kind swimming together, entering from one side
  const school = (W, H, n, shapes, o = {}) => { const out = []; for (let s = 0; out.length < n; s++) { const lr = s % 2 === 0, z = fxR(0.72, 1.1), sh = shapes[s % shapes.length], y0 = fxR(H * (o.y0 || 0.15), H * (o.y1 || 0.85)), sp = (W * fxR(0.0042, 0.006) + 1.2) * z, vy = fxR(-0.3, 0.3), d0 = Math.floor(fxR(0, o.spread || 80)), sz = fxR(o.smin || 12, o.smax || 16) * z, per = o.per || 5;
    for (let i = 0; i < per && out.length < n; i++) out.push({shape: sh, c: "#FFFFFF", x: lr ? -40 : W + 40, y: y0 + fxR(-1, 1) * sz * 3.4, vx: (lr ? 1 : -1) * sp * fxR(0.94, 1.06), vy: vy + fxR(-0.08, 0.08), g: 0, size: sz * fxR(0.85, 1.05), z, face: true, wig: 0.13, rot: 0, vr: 0, sway: 0, life: 320, delay: Math.min(150, d0 + Math.floor(i * fxR(5, 11))), alpha: fxDim(z)}); } return out; };
  // soft sun shafts from the top
  const rays = (g, f, W, H, dk, rgb) => { const a = ease(f / 40); g.globalCompositeOperation = dk ? "lighter" : "source-over"; for (let i = 0; i < 4; i++) { const x = W * (0.08 + i * 0.27) + Math.sin(f * 0.012 + i * 1.9) * W * 0.04, w = W * (0.04 + 0.025 * (i % 2)) + 20, gr = g.createLinearGradient(0, 0, 0, H * 0.95); gr.addColorStop(0, `rgba(${rgb},${(dk ? 0.12 : 0.34) * a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(x - w * 0.4, 0); g.lineTo(x + w * 0.4, 0); g.lineTo(x + w * 1.6 + H * 0.22, H * 0.95); g.lineTo(x - w * 0.3 + H * 0.22, H * 0.95); g.fill(); } };
  // little twinkles in a given box
  const twIn = (n, shape, cols, x0, x1, y0, y1, o = {}) => Array.from({length: n}, () => ({shape, c: fxPick(cols), x: fxR(x0, x1), y: fxR(y0, y1), vx: 0, vy: o.vy || 0, g: 0, size: fxR(o.smin || 4, o.smax || 8), rot: 0, vr: fxR(-0.02, 0.02), sway: 0, life: fxR(50, 90), delay: Math.floor(fxR(o.d0 || 0, o.d1 || 120)), tw: true, glint: true, glow: o.glow}));

  // Greenhouse: seedlings sprout along the bottom, unfurl leaves and open a flower each, under a fine mist
  let GH = null;
  const ghDraw = (g, f, W, H, dk) => { if (!GH) return; const u = Math.min(W, H) / 100, lw = Math.max(2.4, 0.75 * u);
    GH.forEach((s, i) => { const p = ease((f - s.t0) / 85); if (p <= 0) return; const sw = Math.sin(f * 0.03 + i) * s.h * 0.03, ex = s.x + s.lean + sw, ey = H - s.h, cx = s.x + s.lean * 0.15, cy = H - s.h * 0.5;
      const at = t => [(1 - t) * (1 - t) * s.x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) * (1 - t) * (H + 6) + 2 * (1 - t) * t * cy + t * t * ey];
      g.strokeStyle = dk ? "#5FB07A" : "#3E8A4E"; g.lineWidth = lw; g.lineCap = "round"; g.beginPath(); for (let k = 0; k <= 24; k++) { const q = at(k / 24 * p); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke();
      [0.3, 0.5, 0.68, 0.84].forEach((t, j) => { const ls = ease((p - t) / 0.16); if (ls <= 0) return; const q = at(t), q2 = at(t + 0.02), ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]), side = (j + s.side) % 2 ? 1 : -1;
        g.save(); g.translate(q[0], q[1]); g.rotate(ang + side * 1.15); g.scale(ls * u * (0.8 - j * 0.1), ls * u * (0.8 - j * 0.1) * side); g.fillStyle = j % 2 ? (dk ? "#3E9A6A" : "#2F7D52") : (dk ? "#5AB87A" : "#4FAA60"); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(3, -4, 9, -4.4, 12, 0); g.bezierCurveTo(9, 3.4, 3, 3, 0, 0); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(1, 0); g.lineTo(10, -0.2); g.stroke(); g.restore(); });
      const bs = ease((p - 0.86) / 0.14); if (bs <= 0) return; const R = 3.4 * u * bs * (1 + 0.08 * Math.sin(f * 0.05 + i));
      g.save(); g.translate(ex, ey); g.rotate(f * 0.004 + i); g.fillStyle = s.c; for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.ellipse(R * 0.62, 0, R * 0.62, R * 0.34, 0, 0, 6.3); g.fill(); } g.fillStyle = "rgba(255,255,255,.28)"; for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.ellipse(R * 0.5, -R * 0.08, R * 0.32, R * 0.12, 0, 0, 6.3); g.fill(); } g.fillStyle = dk ? "#FFD86A" : "#F2B53A"; g.beginPath(); g.arc(0, 0, R * 0.3, 0, 6.3); g.fill(); g.restore(); }); };

  // Pottery: a lump of clay rises on the wheel and is thrown into a vase, then dipped in glaze
  const VK = [[0, 0.72], [0.38, 1.08], [0.82, 0.42], [1, 0.6]];
  const vaseR = t => { for (let k = 1; k < VK.length; k++) if (t <= VK[k][0]) { const a = VK[k - 1], b = VK[k], q = (1 - Math.cos(Math.PI * (t - a[0]) / (b[0] - a[0]))) / 2; return a[1] + (b[1] - a[1]) * q; } return 0.6; };
  let POT = null;
  const potDraw = (g, f, W, H, dk) => { const u = Math.min(W, H) / 100, cx = W / 2, yo = (1 - ease(f / 26)) * 46 * u, by = H - 3 * u + yo, gr0 = ease((f - 14) / 110), hh = 32 * u * (0.36 + 0.64 * gr0), rb = 13 * u;
    const R = t => rb * ((1 - gr0) * 1.12 * (1 - t * t * 0.55) + gr0 * vaseR(t));
    g.fillStyle = dk ? "#3A3236" : "#6E625C"; g.beginPath(); g.ellipse(cx, by + 2.4 * u, 24 * u, 5 * u, 0, 0, 6.3); g.fill(); g.fillStyle = dk ? "#5A4E52" : "#9A8C84"; g.beginPath(); g.ellipse(cx, by, 22 * u, 4.2 * u, 0, 0, 6.3); g.fill();
    const path = new Path2D(); for (let k = 0; k <= 30; k++) { const t = k / 30; path[k ? "lineTo" : "moveTo"](cx - R(t), by - t * hh); } for (let k = 30; k >= 0; k--) { const t = k / 30; path.lineTo(cx + R(t), by - t * hh); } path.closePath();
    const Rm = rb * 1.12, lg0 = g.createLinearGradient(cx - Rm, 0, cx + Rm, 0); lg0.addColorStop(0, "#7A4024"); lg0.addColorStop(0.32, "#D98E62"); lg0.addColorStop(0.55, "#BC6E44"); lg0.addColorStop(1, "#6A361E");
    g.fillStyle = lg0; g.fill(path); g.save(); g.clip(path);
    const q = ease((f - 132) / 56); if (q > 0) { const top = by - hh * 1.02 * q; g.fillStyle = POT ? POT.c : "#2E9A94"; g.globalAlpha = 0.86; g.beginPath(); g.moveTo(cx - Rm * 1.2, by + 2); for (let x = -1.2; x <= 1.21; x += 0.1) g.lineTo(cx + x * Rm, top + Math.sin(x * 7 + f * 0.05) * 1.6 * u * (1 - q)); g.lineTo(cx + Rm * 1.2, by + 2); g.fill(); g.globalAlpha = 1; g.fillStyle = lg0; g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.55 * q; g.fillRect(cx - Rm, by - hh - 4, Rm * 2, hh + 8); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; }
    g.strokeStyle = "rgba(60,25,10,.28)"; g.lineWidth = Math.max(1, 0.35 * u); for (let k = 1; k < 8; k++) { const t = k / 8, r = R(t), y = by - t * hh; g.beginPath(); g.ellipse(cx, y, r, r * 0.12, 0, 0.15, Math.PI - 0.15); g.stroke(); }
    const spin = gr0 < 1 || f < 132 ? 1 : 1 - ease((f - 132) / 60); if (spin > 0.01) { g.strokeStyle = `rgba(255,225,200,${0.45 * spin})`; g.lineWidth = Math.max(1.2, 0.5 * u); for (let k = 0; k < 5; k++) { const ph = f * 0.21 + k * 1.26, c = Math.cos(ph); if (c < 0.1) continue; const t0 = 0.12 + k * 0.17, x = cx + R(t0) * Math.sin(ph) * 0.92, y = by - t0 * hh; g.globalAlpha = c; g.beginPath(); g.moveTo(x, y - 2 * u); g.lineTo(x, y + 2 * u); g.stroke(); } g.globalAlpha = 1; }
    g.restore(); g.fillStyle = "rgba(60,25,10,.35)"; g.beginPath(); g.ellipse(cx, by - hh, R(1) * 0.86, R(1) * 0.14, 0, 0, 6.3); g.fill(); };

  // Campfire: the fire flares up. Flame tongues sway over crossed logs whose cracks glow, sparks spiral up and cool as
  // they climb, and a marshmallow on a stick reaches in from the corner and toasts golden
  let CF = null;
  const hexMix = (a, b, t) => { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16); return "rgb(" + [16, 8, 0].map(s => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t)).join(",") + ")"; };
  const ramp = (cols, t) => { t = Math.max(0, Math.min(0.999, t)) * (cols.length - 1); const i = Math.floor(t); return hexMix(cols[i], cols[i + 1], t - i); };
  const cfSize = (W, H) => Math.max(96, Math.min(W * (W < H ? 0.46 : 0.36), H * 0.3, 270));
  // the two crossed logs (bark, grooves, cut ends) and their ember cracks, prebuilt once per size
  const cfLogs = (S, dk) => { const key = S + "|" + dk; if (CF.logs && CF.logs.key === key) return CF.logs;
    const w = Math.ceil(S * 1.5), h = Math.ceil(S * 0.6), L = S * 0.6, T = S * 0.15, mk = () => { const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; const x = c.getContext("2d"); x.scale(2, 2); x.translate(w / 2, h / 2); return [c, x]; };
    const [lc, l] = mk(), [cc, c] = mk(), A = [[0.2, 1], [-0.2, -1]];
    const logPath = (x, a) => { x.save(); x.rotate(a); x.beginPath(); x.roundRect(-L, -T / 2, 2 * L, T, T * 0.35); x.restore(); };
    A.forEach(([a, s], i) => { l.save(); l.rotate(a);
      const gr = l.createLinearGradient(0, -T / 2, 0, T / 2); gr.addColorStop(0, dk ? "#7A5236" : "#86583A"); gr.addColorStop(0.45, dk ? "#4E3020" : "#5E3A24"); gr.addColorStop(1, dk ? "#24140C" : "#341E10");
      l.fillStyle = gr; l.beginPath(); l.roundRect(-L, -T / 2, 2 * L, T, T * 0.35); l.fill();
      l.strokeStyle = "rgba(25,12,5,.5)"; l.lineCap = "round";
      for (let j = 0; j < 8; j++) { const y = -T * 0.38 + j * T * 0.105, x0 = -L * 0.95 + ((j * 7 + i * 3) % 5) / 5 * L * 0.5; l.lineWidth = Math.max(0.8, T * (0.035 + 0.02 * (j % 2))); l.beginPath(); l.moveTo(x0, y); l.bezierCurveTo(x0 + L * 0.4, y + T * 0.06, x0 + L * 0.8, y - T * 0.06, Math.min(L * 0.95, x0 + L * 1.4), y); l.stroke(); }
      l.strokeStyle = "rgba(255,220,180,.16)"; l.lineWidth = Math.max(0.8, T * 0.05); l.beginPath(); l.moveTo(-L * 0.9, -T * 0.32); l.lineTo(L * 0.9, -T * 0.32); l.stroke();
      const ex = s * L - s * T * 0.12; l.fillStyle = dk ? "#B88A58" : "#D4A46C"; l.beginPath(); l.ellipse(ex, 0, T * 0.22, T * 0.48, 0, 0, 6.3); l.fill();
      l.strokeStyle = "rgba(120,72,36,.75)"; l.lineWidth = Math.max(0.7, T * 0.035); [0.34, 0.2, 0.08].forEach(r => { l.beginPath(); l.ellipse(ex, 0, T * r * 0.45, T * r, 0, 0, 6.3); l.stroke(); }); l.restore();
      // cracks: the log in front hides the cracks of the one behind it
      if (i) { c.save(); c.globalCompositeOperation = "destination-out"; logPath(c, a); c.fill(); c.restore(); }
      c.save(); c.rotate(a); c.lineJoin = c.lineCap = "round"; c.shadowColor = "#FF4A0A"; c.shadowBlur = T * 0.35;
      for (let j = 0; j < 5; j++) { let x = -L * 0.5 + j * L * 0.24 + i * T * 0.3, y = (j % 2 ? 0.12 : -0.22) * T; c.strokeStyle = j % 2 ? "#FF6A14" : "#FF9A2A"; c.lineWidth = Math.max(1.1, T * (0.07 + 0.03 * (j % 3))); c.beginPath(); c.moveTo(x, y);
        for (let q = 0; q < 4; q++) { x += T * (0.22 + 0.14 * ((q + j) % 3)); y = Math.max(-T * 0.38, Math.min(T * 0.38, y + T * ((q + j) % 2 ? 0.16 : -0.13))); c.lineTo(x, y); } c.stroke(); }
      c.restore(); });
    return CF.logs = {key, lc, cc, w, h}; };
  // one tongue of flame: a teardrop whose tip sways and whips
  const tongue = (g, x, by, w, h, f, ph) => { const N = 12, P = [];
    for (let j = 0; j <= N; j++) { const t = j / N, cx = x + (Math.sin(f * 0.085 + ph - t * 2.6) * 0.6 + Math.sin(f * 0.2 + ph * 1.7 - t * 5) * 0.22) * w * t * t * 1.3, hw = w * Math.pow(Math.cos(t * 1.5708), 1.3) * (1 + 0.22 * Math.sin(t * 3.1)); P.push([cx, by - h * t, hw]); }
    g.beginPath(); g.moveTo(P[0][0] - P[0][2], P[0][1]); for (let j = 1; j <= N; j++) g.lineTo(P[j][0] - P[j][2], P[j][1]); for (let j = N - 1; j >= 0; j--) g.lineTo(P[j][0] + P[j][2], P[j][1]);
    g.quadraticCurveTo(x, by + w * 0.7, P[0][0] - P[0][2], P[0][1]); g.fill(); };
  const fireDraw = (g, f, W, H, dk) => { if (!CF) return; const S = cfSize(W, H), cx = W / 2, by = H - S * 0.16, k = ease(f / 22), fl = ease((f - 26) / 24) * (1 - ease((f - 78) / 45)), set = 1 - 0.2 * ease((f - 150) / 90);
    const fH = S * (0.95 + 0.62 * fl) * k * set, pulse = 0.85 + 0.09 * Math.sin(f * 0.21) + 0.06 * Math.sin(f * 0.53);
    // warm light pooling around the fire, breathing with the flame
    const gR = S * (1.5 + 0.45 * fl) * pulse, gy = by - S * 0.25; let gr = g.createRadialGradient(cx, gy, 0, cx, gy, gR);
    gr.addColorStop(0, `rgba(255,150,60,${(dk ? 0.34 : 0.2) * k * pulse})`); gr.addColorStop(0.5, `rgba(255,120,40,${(dk ? 0.12 : 0.07) * k * pulse})`); gr.addColorStop(1, "rgba(255,120,40,0)"); g.fillStyle = gr; g.fillRect(cx - gR, gy - gR, 2 * gR, 2 * gR);
    g.save(); g.translate(cx, by + S * 0.05); g.scale(1, 0.28); gr = g.createRadialGradient(0, 0, 0, 0, 0, S * 1.3); gr.addColorStop(0, `rgba(255,170,80,${(dk ? 0.4 : 0.26) * k * pulse})`); gr.addColorStop(1, "rgba(255,150,60,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, S * 1.3, 0, 6.3); g.fill(); g.restore();
    // ember bed under the logs
    g.globalAlpha = k; g.save(); g.translate(cx, by + S * 0.04); g.scale(1, 0.3); gr = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.42); gr.addColorStop(0, "#FFB040"); gr.addColorStop(0.5, "#E8501A"); gr.addColorStop(1, "rgba(120,30,10,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, S * 0.42, 0, 6.3); g.fill(); g.restore();
    const LG = cfLogs(S, dk), lw = LG.w, lh = LG.h, ly = by + (1 - k) * S * 0.4; g.drawImage(LG.lc, cx - lw / 2, ly - lh / 2, lw, lh);
    g.globalAlpha = k * (0.55 + 0.3 * Math.sin(f * 0.07) + 0.15 * Math.sin(f * 0.19 + 1)); g.drawImage(LG.cc, cx - lw / 2, ly - lh / 2, lw, lh); g.globalAlpha = k;
    // the flame: every tongue in four layers, outer red-orange to a pale core
    const COL = ["#E8401E", "#FF7E1C", "#FFC23A", dk ? "#FFF6D2" : "#FFF0B0"], SC = [[1, 1], [0.76, 0.8], [0.52, 0.6], [0.3, 0.36]], fb = by - S * 0.06;
    if (fH > 2) { g.fillStyle = "#FF5A1E"; g.globalAlpha = k * (dk ? 0.28 : 0.2); CF.T.forEach(t => tongue(g, cx + t.x * S, fb + S * 0.02, t.w * S * 1.3, fH * t.h * 1.12 * (0.84 + 0.1 * Math.sin(f * 0.19 + t.ph) + 0.06 * Math.sin(f * 0.47 + t.ph * 3)), f, t.ph));
      g.globalAlpha = k; SC.forEach(([sw, sh], L) => { g.fillStyle = COL[L]; CF.T.forEach(t => { if (L >= 2 && Math.abs(t.x) > 0.24) return; tongue(g, cx + t.x * S * (1 - L * 0.12), fb, t.w * S * sw, fH * t.h * sh * (0.84 + 0.1 * Math.sin(f * 0.19 + t.ph + L * 0.4) + 0.06 * Math.sin(f * 0.47 + t.ph * 3)), f, t.ph + L * 0.25); }); }); }
    // sparks spiral up on short glowing trails and cool from white-yellow to red
    const SP = dk ? ["#FFFBE0", "#FFD04A", "#FF8A22", "#E0401A", "#80220E"] : ["#FFD24A", "#FFA22A", "#F0641E", "#C8341A", "#8A2A14"];
    g.lineCap = "round"; const pos = (s, a) => [cx + s.x * S + s.dr * a + s.r * S * Math.min(1, a / 26) * Math.sin(s.w * a + s.ph), by - S * 0.45 - s.v * a * (1 - a / (2.8 * s.life))];
    for (const s of CF.S) { const a = f - s.t0; if (a <= 0 || a > s.life) continue; const q = a / s.life, al = ease(a / 5) * (1 - q * q), col = ramp(SP, q * 0.95), sz = s.sz * (1 - 0.5 * q);
      g.strokeStyle = col; let p0 = pos(s, a); for (let j = 1; j <= 5; j++) { const p1 = pos(s, Math.max(0, a - j * 1.8)); g.globalAlpha = al * (1 - j / 6); g.lineWidth = sz * (1.05 - j * 0.15); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); p0 = p1; }
      const h = pos(s, a); g.globalAlpha = al * (dk ? 0.22 : 0.14); g.fillStyle = col; g.beginPath(); g.arc(h[0], h[1], sz * 1.6, 0, 6.3); g.fill(); g.globalAlpha = al; g.fillStyle = q < 0.3 ? SP[0] : col; g.beginPath(); g.arc(h[0], h[1], sz * 0.75, 0, 6.3); g.fill(); }
    // a faint warm wisp above the tips
    const pf = CF.puff || (CF.puff = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.5, "rgba(255,255,255,.4)"); q.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = q; x.fillRect(0, 0, 64, 64); x.globalCompositeOperation = "source-in"; x.fillStyle = "#FFD2A8"; x.fillRect(0, 0, 64, 64); return c; })());
    for (let i = 0; i < 7; i++) { const a = (f * 0.5 + i * 19) % 130, x = cx + Math.sin(a * 0.045 + i) * S * 0.14 * (a / 130), y = by - fH * 0.9 - a * S * 0.01, r = S * (0.12 + a / 130 * 0.3);
      g.globalAlpha = k * (dk ? 0.07 : 0.1) * Math.sin(Math.PI * a / 130) * ease((f - 40) / 60); g.drawImage(pf, x - r, y - r, 2 * r, 2 * r); }
    // the marshmallow on its stick reaches in from the lower right and toasts
    const ang = Math.atan2(0.6, 1), ca = Math.cos(ang), sa = Math.sin(ang), rch = (1 - ease((f - 8) / 42)) * S * 1.4 + Math.sin(f * 0.045) * S * 0.015, tx = cx + S * 0.36 + ca * rch, ty = by - S * 0.98 + sa * rch, sL = Math.hypot(W, H);
    g.globalAlpha = ease((f - 8) / 20); g.strokeStyle = dk ? "#A0784C" : "#8A5E36"; g.lineWidth = Math.max(2.5, S * 0.026); g.beginPath(); g.moveTo(tx - ca * S * 0.04, ty - sa * S * 0.04); g.lineTo(tx + ca * sL, ty + sa * sL); g.stroke();
    g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = Math.max(1, S * 0.009); g.beginPath(); g.moveTo(tx + ca * S * 0.2, ty + sa * S * 0.2 + S * 0.006); g.lineTo(tx + ca * sL, ty + sa * sL + S * 0.006); g.stroke();
    const mx = tx + ca * S * 0.13, my = ty + sa * S * 0.13, m = S * 0.11, mr = S * 0.085, toast = ease((f - 30) / 170), fx0 = cx - mx, fy0 = gy - my, fd = Math.hypot(fx0, fy0);
    g.save(); g.translate(mx, my); g.rotate(ang); const lfx = (fx0 * ca + fy0 * sa) / fd, lfy = (-fx0 * sa + fy0 * ca) / fd;
    g.beginPath(); g.roundRect(-m, -mr, 2 * m, 2 * mr, mr * 0.55); g.fillStyle = ramp(["#FFFDF6", "#F8E2B0", "#E2AA60"], toast * 0.9); g.fill();
    gr = g.createLinearGradient(lfx * mr * 1.2, lfy * mr * 1.2, -lfx * mr, -lfy * mr); gr.addColorStop(0, `rgba(130,66,22,${0.95 * toast})`); gr.addColorStop(0.5, `rgba(180,108,44,${0.45 * toast})`); gr.addColorStop(1, "rgba(200,140,70,0)"); g.fillStyle = gr; g.fill();
    g.strokeStyle = `rgba(${dk ? "255,200,150" : "120,80,40"},${dk ? 0.25 : 0.4})`; g.lineWidth = Math.max(1, S * 0.006); g.stroke();
    g.fillStyle = `rgba(255,255,255,${0.7 - 0.35 * toast})`; g.beginPath(); g.ellipse(-m * 0.1, -mr * 0.5, m * 0.6, mr * 0.18, 0, 0, 6.3); g.fill();
    g.fillStyle = `rgba(255,170,80,${0.35 * k * pulse})`; g.beginPath(); g.ellipse(-m + mr * 0.2, mr * 0.2, mr * 0.18, mr * 0.7, 0, 0, 6.3); g.fill(); g.restore(); g.globalAlpha = 1; };

  // Aquarium: the tunnel comes alive. A sea turtle glides over, a manta swoops through flapping, a school streams by as
  // one flock, jellies pulse and caustic light ripples along the top
  let AQ = null;
  Object.assign(FX_SHAPES, {
    // a small blue-green chromis for the school, pointing to +x
    n3chromis: {d: FB + FT, paint: (g, c, dk) => { const b = new Path2D(FB); fillP(g, "#2E8ED0", FT); g.fillStyle = "#4AB4F0"; g.fill(b); g.save(); g.clip(b); g.fillStyle = "#1E5E9E"; g.beginPath(); g.ellipse(1, -5.4, 10, 4, 0, 0, 6.3); g.fill(); g.fillStyle = "#BFEAFF"; g.beginPath(); g.ellipse(1, 5.6, 9, 3.2, 0, 0, 6.3); g.fill(); g.restore(); sheen(g, dk, 1.1); eye(g, 7, -1.4, 1.5); }}
  });
  // the turtle's shell, painted once: scutes with warm centres, dark seams and a scalloped rim
  const aqShell = (T, dk) => { const key = T + "|" + dk; if (AQ.shell && AQ.shell.key === key) return AQ.shell;
    const c = document.createElement("canvas"), sz = Math.ceil(T * 1.1); c.width = c.height = sz * 2; const g = c.getContext("2d"); g.scale(2 * T, 2 * T); g.translate(0.55, 0.55);
    const rim = new Path2D(); rim.ellipse(0, 0, 0.5, 0.4, 0, 0, 6.3); g.fillStyle = "#4A3418"; g.fill(rim); g.save(); g.clip(rim);
    g.fillStyle = "#7A5A2A"; g.beginPath(); g.ellipse(0, 0, 0.44, 0.34, 0, 0, 6.3); g.fill();
    const scute = (pts, cx, cy, r) => { const q = new Path2D(); pts.forEach((p, i) => q[i ? "lineTo" : "moveTo"](p[0], p[1])); q.closePath(); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, "#D9A85A"); gr.addColorStop(0.5, "#A8783A"); gr.addColorStop(1, "#6E4E22"); g.fillStyle = gr; g.fill(q); g.strokeStyle = "#33240E"; g.lineWidth = 0.014; g.stroke(q); };
    const E = x => 0.34 * Math.sqrt(Math.max(0, 1 - (x / 0.44) * (x / 0.44)));
    [-1, 1].forEach(s => { const xs = [-0.4, -0.2, -0.02, 0.16, 0.36]; for (let i = 0; i < 4; i++) { const a = xs[i], b = xs[i + 1], P = [[a + 0.02, 0.1 * s], [a, E(a) * s], [(a + b) / 2, (E((a + b) / 2) + 0.01) * s], [b, E(b) * s], [b - 0.02, 0.1 * s]]; scute(P, (a + b) / 2, (0.1 + E((a + b) / 2)) / 2 * s, 0.14); } });
    for (let i = 0; i < 5; i++) { const x = -0.32 + i * 0.16, w = i === 0 || i === 4 ? 0.075 : 0.1; scute([[x - 0.08, 0], [x - 0.045, -w], [x + 0.045, -w], [x + 0.08, 0], [x + 0.045, w], [x - 0.045, w]], x, 0, 0.11); }
    g.strokeStyle = "#33240E"; g.lineWidth = 0.012; g.beginPath(); g.ellipse(0, 0, 0.44, 0.34, 0, 0, 6.3); g.stroke(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; g.beginPath(); g.moveTo(Math.cos(a) * 0.44, Math.sin(a) * 0.34); g.lineTo(Math.cos(a) * 0.5, Math.sin(a) * 0.4); g.stroke(); }
    const hl = g.createLinearGradient(-0.3, -0.35, 0.3, 0.35); hl.addColorStop(0, "rgba(255,240,200,.28)"); hl.addColorStop(0.5, "rgba(255,255,255,0)"); hl.addColorStop(1, `rgba(0,0,0,${dk ? 0.3 : 0.22})`); g.fillStyle = hl; g.fillRect(-0.6, -0.6, 1.2, 1.2); g.restore();
    return AQ.shell = {key, c, sz}; };
  const leaf = (g, len, wd) => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.3, -wd, len * 0.8, -wd * 0.6, len, 0); g.bezierCurveTo(len * 0.7, wd * 0.5, len * 0.3, wd * 0.8, 0, 0); g.fill(); };
  const aqTurtle = (g, f, W, H, dk) => { const t = AQ.tu, T = t.T, u = (f - t.d0) / 260; if (u <= 0) return; const X = q => t.dir > 0 ? -T + (W + 2 * T) * q : W + T - (W + 2 * T) * q, Y = q => t.y + Math.sin(q * 5 + t.ph) * H * 0.025;
    const x = X(u), y = Y(u), ang = Math.atan2(Y(u + 0.002) - y, X(u + 0.002) - x), sk = dk ? "#8FA070" : "#7A8A52", sp = "rgba(40,50,20,.35)";
    g.save(); g.globalAlpha = ease((f - t.d0) / 30); g.translate(x, y); g.rotate(ang); g.fillStyle = sk;
    const st = Math.sin(f * 0.055), st2 = Math.sin(f * 0.055 - 1.2);
    [-1, 1].forEach(s => { g.save(); g.translate(0.27 * T, 0.27 * T * s); g.rotate(s * (1.75 + 0.5 * st)); g.scale(1, s); leaf(g, 0.62 * T, 0.13 * T); g.fillStyle = sp; g.beginPath(); g.ellipse(0.25 * T, 0, 0.05 * T, 0.03 * T, 0, 0, 6.3); g.ellipse(0.4 * T, 0.01 * T, 0.04 * T, 0.025 * T, 0, 0, 6.3); g.fill(); g.restore(); g.fillStyle = sk;
      g.save(); g.translate(-0.34 * T, 0.22 * T * s); g.rotate(s * (2.35 + 0.3 * st2)); g.scale(1, s); leaf(g, 0.26 * T, 0.09 * T); g.restore(); });
    g.beginPath(); g.moveTo(-0.45 * T, -0.04 * T); g.lineTo(-0.6 * T, 0); g.lineTo(-0.45 * T, 0.04 * T); g.fill();
    const hs = Math.sin(f * 0.03) * 0.08; g.save(); g.translate(0.46 * T, 0); g.rotate(hs); g.beginPath(); g.ellipse(0.1 * T, 0, 0.17 * T, 0.12 * T, 0, 0, 6.3); g.fill(); g.strokeStyle = sp; g.lineWidth = Math.max(0.8, T * 0.008); g.beginPath(); g.moveTo(0.04 * T, -0.1 * T); g.lineTo(0.12 * T, 0); g.lineTo(0.04 * T, 0.1 * T); g.moveTo(0.12 * T, 0); g.lineTo(0.22 * T, 0); g.stroke();
    g.fillStyle = "#1A1E10"; g.beginPath(); g.arc(0.17 * T, -0.075 * T, 0.022 * T, 0, 6.3); g.arc(0.17 * T, 0.075 * T, 0.022 * T, 0, 6.3); g.fill(); g.restore();
    const sh = aqShell(T, dk); g.drawImage(sh.c, -0.55 * T, -0.55 * T, sh.sz, sh.sz); g.restore(); };
  // the manta, top-down: a broad diamond with convex leading edges sweeping back to long pointed tips; the tips curl
  // up and down as it flaps (the span narrows a little on the upstroke), head first, a slim whip tail trailing
  const aqManta = (g, f, W, H, dk) => { const m = AQ.ma, u = (f - m.d0) / 210; if (u <= 0 || u >= 1.2) return; const L = m.L, P = q => { const a = 1 - q; return [a * a * m.p[0][0] + 2 * a * q * m.p[1][0] + q * q * m.p[2][0], a * a * m.p[0][1] + 2 * a * q * m.p[1][1] + q * q * m.p[2][1]]; };
    const [x, y] = P(u), [x2, y2] = P(u + 0.003), fl = Math.sin(f * 0.075), up = Math.max(0, fl), dn = Math.max(0, -fl), ty = 0.76 * (1 - 0.1 * up + 0.02 * dn), tx = -0.12 + 0.04 * up - 0.015 * dn;
    g.save(); g.globalAlpha = ease((f - m.d0) / 25); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x)); g.scale(L, L);
    const back = dk ? "#23324A" : "#2E3F58";
    g.lineCap = "round"; g.strokeStyle = back; for (let i = 0; i < 12; i++) { g.lineWidth = 0.022 * (1 - i / 12) + 0.004; g.beginPath(); g.moveTo(-0.38 - i * 0.05, Math.sin(i * 0.55 - f * 0.12) * 0.01 * i); g.lineTo(-0.38 - (i + 1) * 0.05, Math.sin((i + 1) * 0.55 - f * 0.12) * 0.01 * (i + 1)); g.stroke(); }
    const half = s => [[0.22, 0.32 * s, 0.06, ty * 0.82 * s, tx, ty * s], [-0.12, ty * 0.66 * s, -0.12, 0.24 * s, -0.22, 0.12 * s]];
    const body = new Path2D(); body.moveTo(0.3, 0); body.quadraticCurveTo(0.31, -0.07, 0.28, -0.1);
    let [a, b] = half(-1); body.bezierCurveTo(...a); body.bezierCurveTo(...b); body.quadraticCurveTo(-0.34, -0.11, -0.4, 0); body.quadraticCurveTo(-0.34, 0.11, -0.22, 0.12);
    [a, b] = half(1); body.bezierCurveTo(b[2], b[3], b[0], b[1], tx, ty); body.bezierCurveTo(a[2], a[3], a[0], a[1], 0.28, 0.1); body.quadraticCurveTo(0.31, 0.07, 0.3, 0);
    g.fillStyle = back; g.fill(body); g.save(); g.clip(body);
    let gr = g.createLinearGradient(0, 0, 0, ty); gr.addColorStop(0, "rgba(255,255,255,.06)"); gr.addColorStop(0.5, "rgba(0,0,0,0)"); gr.addColorStop(1, dk ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.2)"); g.fillStyle = gr; g.fillRect(-0.4, 0, 0.8, 0.8); g.save(); g.scale(1, -1); g.fillRect(-0.4, 0, 0.8, 0.8); g.restore();
    // the curled tips catch the light on the upstroke and fall into shade on the downstroke
    [-1, 1].forEach(s => { gr = g.createLinearGradient(0, 0.4 * s, 0, ty * s); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, up > 0 ? `rgba(200,220,245,${0.32 * up})` : `rgba(0,0,0,${0.3 * dn})`); g.fillStyle = gr; g.fillRect(-0.4, Math.min(0.4 * s, ty * s), 0.8, Math.abs(ty - 0.4)); });
    g.fillStyle = `rgba(225,236,248,${dk ? 0.13 : 0.16})`; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(0.1, 0.2 * s, 0.12, 0.032, -0.75 * s, 0, 6.3); g.fill(); });
    g.strokeStyle = "rgba(225,238,250,.22)"; g.lineWidth = 0.05; g.stroke(body); g.restore();
    g.strokeStyle = "rgba(225,238,250,.5)"; g.lineWidth = 0.01; g.stroke(body);
    g.fillStyle = back; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(0.27, 0.11 * s); g.bezierCurveTo(0.34, 0.13 * s, 0.4, 0.11 * s, 0.405, 0.07 * s); g.quadraticCurveTo(0.4, 0.045 * s, 0.38, 0.055 * s); g.bezierCurveTo(0.35, 0.07 * s, 0.32, 0.065 * s, 0.295, 0.05 * s); g.fill(); g.strokeStyle = "rgba(225,238,250,.4)"; g.lineWidth = 0.007; g.stroke(); });
    g.fillStyle = "rgba(0,0,0,.35)"; [-1, 1].forEach(s => { g.beginPath(); g.arc(0.265, 0.088 * s, 0.011, 0, 6.3); g.fill(); });
    g.restore(); };
  // a jelly: the bell squashes and stretches as it pulses, tentacles trail in waves
  const aqJelly = (g, f, W, H, dk, j) => { const a = f - j.d0; if (a <= 0) return; const p = a * 0.06 + j.ph, c = Math.pow(Math.sin(p), 2), y = j.y - a * 0.18 * j.k - (p / 2 - Math.sin(2 * p) / 4) * 6 * j.k, x = j.x + Math.sin(a * 0.01 + j.ph) * 12, w = j.r * (1 - 0.16 * c), h = j.r * (0.8 + 0.18 * c);
    g.save(); g.globalAlpha = ease(a / 40) * (dk ? 0.9 : 0.85); g.translate(x, y); g.strokeStyle = `rgba(${j.c},${dk ? 0.5 : 0.6})`; g.lineCap = "round";
    for (let i = 0; i < 6; i++) { const x0 = (i / 5 - 0.5) * w * 1.6; g.lineWidth = Math.max(1, j.r * 0.045); g.beginPath(); g.moveTo(x0, h * 0.05); for (let k = 1; k <= 10; k++) { const t = k / 10; g.lineTo(x0 * (1 - t * 0.3) + Math.sin(t * 5 - a * 0.1 + i) * j.r * 0.22 * t, h * 0.05 + t * j.r * (1.9 + 0.3 * (i % 2)) * (1 - 0.15 * c)); } g.stroke(); }
    g.lineWidth = Math.max(2, j.r * 0.13); g.strokeStyle = `rgba(${j.c},${dk ? 0.42 : 0.5})`; [-0.15, 0.15].forEach((o, i) => { g.beginPath(); g.moveTo(o * w, 0); for (let k = 1; k <= 8; k++) { const t = k / 8; g.lineTo(o * w + Math.sin(t * 4 - a * 0.08 + i * 2) * j.r * 0.14 * t, t * j.r * 1.2); } g.stroke(); });
    const gr = g.createRadialGradient(0, -h * 0.5, 0, 0, -h * 0.3, w * 1.1); gr.addColorStop(0, `rgba(255,255,255,${dk ? 0.75 : 0.85})`); gr.addColorStop(0.35, `rgba(${j.c},${dk ? 0.6 : 0.7})`); gr.addColorStop(1, `rgba(${j.c},${dk ? 0.28 : 0.38})`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, w, h, 0, Math.PI, 0); g.quadraticCurveTo(w * 0.5, h * 0.22, 0, h * 0.12); g.quadraticCurveTo(-w * 0.5, h * 0.22, -w, 0); g.fill();
    g.strokeStyle = `rgba(255,255,255,${dk ? 0.5 : 0.7})`; g.lineWidth = Math.max(1, j.r * 0.05); g.beginPath(); g.ellipse(0, 0, w * 0.75, h * 0.7, 0, Math.PI * 1.15, Math.PI * 1.5); g.stroke(); g.restore(); };
  // caustics: a net of bright wavering lines along the top of the tank
  const aqCaustic = (g, f, W, H, dk) => { const a = ease(f / 40), top = H * 0.24, gr = g.createLinearGradient(0, 0, 0, top); gr.addColorStop(0, `rgba(255,255,255,${(dk ? 0.12 : 0.45) * a})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.strokeStyle = gr; g.lineWidth = Math.max(1.2, Math.min(W, H) * 0.0035); g.lineJoin = "round"; const st = Math.max(8, W / 90);
    for (let i = 0; i < 7; i++) { g.beginPath(); for (let x = -st; x <= W + st; x += st) { const y = top * (i / 6) * 0.9 + Math.sin(x * 0.013 + f * 0.035 + i * 2.3) * top * 0.07 + Math.sin(x * 0.037 - f * 0.05 + i) * top * 0.03; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 6; i++) { g.beginPath(); for (let x = -st; x <= W + st; x += st) { const y = top * (i / 5) * 0.85 + Math.sin(x * 0.021 - f * 0.03 + i * 4.1) * top * 0.1 + Math.sin(x * 0.009 + f * 0.02 + i) * top * 0.05; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); } };
  // the school: one flock following a curving path, each fish facing along it
  const aqSchool = (g, f, W, H, dk) => { const S = AQ.sc, sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900)), lead = -0.1 * W + (f - S.d0) * S.v;
    const yA = x => S.y + Math.sin(x / W * 5.2 + S.ph) * H * S.amp, spr = fxSprite("n3chromis", "#FFFFFF", 0, dk), h = spr._half;
    for (const q of S.F) { const xs = lead - q.lag; if (xs < -60 || xs > W + 60) continue; const xx = S.dir > 0 ? xs : W - xs, y0 = yA(xx), y1 = yA(xx + S.dir * 3), ang = Math.atan2(y1 - y0, S.dir * 3), nx = -Math.sin(ang), ny = Math.cos(ang), off = q.side + Math.sin(f * 0.05 + q.ph) * 4;
      const s = q.sz * sc / 10, mx = S.dir > 0 ? 1 : -1, rot = (S.dir > 0 ? ang : ang - Math.PI) + Math.sin(f * 0.3 + q.ph) * 0.1 * mx;
      g.save(); g.globalAlpha = q.al; g.translate(xx + nx * off, y0 + ny * off); g.rotate(rot); g.scale(s * mx, s); g.drawImage(spr, -h, -h, 2 * h, 2 * h); g.restore(); } };
  const aqDraw = (g, f, W, H, dk) => { if (!AQ) return; rays(g, f, W, H, dk, dk ? "140,220,255" : "255,255,255"); g.globalCompositeOperation = "source-over"; aqCaustic(g, f, W, H, dk);
    AQ.je.forEach(j => aqJelly(g, f, W, H, dk, j)); aqSchool(g, f, W, H, dk); aqManta(g, f, W, H, dk); aqTurtle(g, f, W, H, dk); };

  const FX = {
    greenhouse: {spawn: (W, H, d, n) => { const k = Math.max(4, Math.min(9, Math.round(W / 170))), cols = d ? ["#FFFFFF", "#F6B8D0", "#FFE08A", "#C9B0FF"] : ["#F27BA0", "#F7A93A", "#B884E8", "#FF7A5A"];
        GH = Array.from({length: k}, (_, i) => ({x: (i + 0.5 + fxR(-0.28, 0.28)) / k * W, h: H * fxR(0.2, 0.4) * (i % 2 ? 0.85 : 1), lean: fxR(-0.22, 0.22) * H * 0.3, t0: Math.floor(fxR(0, 45)), side: i % 2, c: cols[i % cols.length]}));
        return fxFall(W, H, n(40), "drop", d ? ["#A9E0D6", "#E8F4EF"] : ["#7CC4D8", "#A8D8E8"], {vmin: 1.6, vmax: 2.8, sway: 0.5, smin: 3, smax: 5.5, glow: d ? 6 : 0, depth: false}).map(p => Object.assign(p, {rot: 0, vr: 0, alpha: 0.75}))
          .concat(GH.flatMap(s => twIn(3, "sparkle", d ? ["#FFF4D0", "#FFFFFF"] : ["#F2C24A", "#FFFFFF"], s.x + s.lean - 40, s.x + s.lean + 40, H - s.h - 40, H - s.h + 40, {d0: s.t0 + 85, d1: s.t0 + 150, smin: 5, smax: 9, glow: d ? 10 : 4})),
            d ? [] : fxFlutter(W, H, n(4), ["#F2A0C0", "#F7C84A", "#A0C8F2"]));
      }, draw: ghDraw},
    pottery: {spawn: (W, H, d, n) => { const u = Math.min(W, H) / 100; POT = {c: fxPick(d ? ["#3FB0A8", "#5A86E0", "#C27AD8"] : ["#2E9A94", "#3A62C0", "#9A5AC8"])};
        return Array.from({length: n(46)}, () => { const L = Math.random() < 0.5, t = fxR(18, 120); return {shape: "n3clay", c: fxPick(["#B8693E", "#C8784A", "#9A5432"]), x: W / 2 + (L ? -1 : 1) * 13 * u, y: H - 3 * u - fxR(6, 20) * u, vx: (L ? -1 : 1) * fxR(2.5, 6), vy: -fxR(1, 3.4), g: 0.22, size: fxR(4, 7), rot: L ? -1.2 : 1.2, vr: 0, sway: 0, life: 110, delay: Math.floor(t)}; })
          .concat(twIn(n(18), "sparkle", d ? ["#FFFFFF", "#F6C48E", POT.c] : ["#FFFFFF", "#F2C24A", POT.c], W / 2 - 22 * u, W / 2 + 22 * u, H - 40 * u, H - 4 * u, {d0: 170, d1: 205, smin: 6, smax: 11, glow: d ? 10 : 6}));
      }, draw: potDraw},
    campfire: {spawn: (W, H, d, n) => { const S = cfSize(W, H);
        CF = {logs: CF && CF.logs, T: [[-0.27, 0.1, 0.5], [-0.15, 0.12, 0.78], [-0.05, 0.13, 1], [0.06, 0.13, 0.92], [0.17, 0.11, 0.7], [0.28, 0.09, 0.46]].map(([x, w, h], i) => ({x, w, h: h * fxR(0.9, 1.05), ph: i * 1.9 + fxR(0, 1)})),
          S: Array.from({length: n(70)}, () => { const life = fxR(60, 110), fl = Math.random() < 0.75; return {t0: Math.floor(fl ? fxR(28, 105) : fxR(10, 175)), life, x: fxR(-0.16, 0.16), dr: fxR(-0.25, 0.25), v: fxR(S * 0.014, S * 0.026) * (fl ? 1.2 : 0.9), r: fxR(0.05, 0.13), w: fxR(0.09, 0.16) * (Math.random() < 0.5 ? -1 : 1), ph: fxR(0, 6.3), sz: fxR(1.4, 2.6) * Math.max(1, S / 160)}; })};
        return d ? fxTw(W, H, n(46), "star", ["#FFFFFF", "#FFE7B0", "#C9D4FF"], {smin: 3, smax: 6.5, top: 0.6, glow: 10, spread: 170}) : [];
      }, draw: fireDraw},
    aquarium: {spawn: (W, H, d, n) => { const M = Math.min(W, H), ph = W < H, dir = Math.random() < 0.5 ? 1 : -1, L = Math.max(130, Math.min(M * (ph ? 0.42 : 0.34), 280)), cols = d ? ["255,150,220", "120,230,255", "190,160,255"] : ["235,95,175", "40,165,220", "150,110,235"];
        const N = n(30), rows = 5, sz = 10.5;
        AQ = {shell: AQ && AQ.shell, tu: {T: Math.max(70, Math.min(M * 0.2, 160)), d0: 6, dir, y: H * (ph ? 0.17 : 0.2), ph: fxR(0, 6)},
          ma: {L, d0: 40, p: dir > 0 ? [[W + L, H * 0.34], [W * 0.5, H * (ph ? 0.72 : 0.82)], [-L, H * 0.36]] : [[-L, H * 0.34], [W * 0.5, H * (ph ? 0.72 : 0.82)], [W + L, H * 0.36]]},
          sc: {d0: 30, v: W * 1.5 / 210, dir: -dir, y: H * (ph ? 0.62 : 0.66), amp: ph ? 0.06 : 0.1, ph: fxR(0, 6), F: Array.from({length: N}, (_, i) => { const r = i % rows, c = Math.floor(i / rows), z = fxR(0.85, 1.1); return {lag: c * sz * 3.6 + fxR(0, sz * 2) + (r % 2) * sz * 1.6, side: (r - (rows - 1) / 2) * sz * 3 * (ph ? 0.8 : 1) + fxR(-sz, sz), ph: fxR(0, 6.3), sz: sz * z, al: fxDim(z)}; })},
          je: Array.from({length: ph ? 3 : 4}, (_, i) => ({x: W * (i + 0.5) / (ph ? 3 : 4) + fxR(-0.06, 0.06) * W, y: H * fxR(0.78, 0.98), r: Math.max(16, M * fxR(0.035, 0.05)), k: fxR(0.8, 1.2), ph: fxR(0, 6), d0: Math.floor(fxR(0, 50)), c: cols[i % 3]}))};
        return school(W, H, n(5), ["n3clown", "n3ytang", "n3gramma", "n3tang"], {per: 1, smin: 13, smax: 16, y0: 0.4, y1: 0.9, spread: 90})
          .concat(fxRise(W, H, n(22), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#E8FAFF"], {smin: 4, smax: 8, sway: 1, vmin: 1.4, vmax: 2.6, spread: 140}));
      }, draw: aqDraw}
  };
  /* ---- end of completion animations ---- */

  MAJ_THEMES.push({
    skin: {id: "greenhouse", name: "Greenhouse", group: "ideas", desc: "A Victorian glass greenhouse packed with tropical plants.",
      light: ["#EFF6EF", "rgba(47,125,82,.10)", "#FFFFFF", "#16291F", "#56685C", "#D3E4D8", "#E3EFE6", "#F8FBF8", "#2F7D52", "#4E9A62", "#FFFFFF", "#1F5A3A", "#28553F", "#CFE8D8", "#FFE7A0"],
      dark: ["#0E1C1B", "rgba(242,194,122,.07)", "#152826", "#E8F4EF", "#A2BFB4", "#26403C", "#1C3330", "#10201E", "#F2C27A", "#F6D69E", "#14241F", "#7A6438", "#0E201E", "#CFE6DC", "#6A5428"],
      glow: ["linear-gradient(180deg,#CDE9DA,#EEF7EF 55%,#F7F1E3)", "linear-gradient(180deg,#13252A,#1F3A3C 55%,#3F5A55)"],
      spine: [lg("#3E7A5C", "#28553F"), lg("#1C3A36", "#0E201E")], btn: [lg2("#2F7D52", "#4E9A62"), lg2("#F2C27A", "#F6D69E")]},
    kit: {motif: "n3leaf", card: ["#F6FBF7", "#E1EFE5"], ink: "#16291F", bd: "#BFDCC8", mc: "#3E9A62", r: 16, notes: ["#D6EBDC"].concat(NOTES), shape: "rounded", pin: "tape", fab: "999px", btn: "14px"},
    fx: FX.greenhouse,
    tag: "A Victorian glass greenhouse packed with palms and monsteras, misting nozzles, hanging baskets and a rare night bloom"
  });
  MAJ_THEMES.push({
    skin: {id: "pottery", name: "Pottery Studio", group: "ideas", desc: "A sunlit studio with a spinning wheel, shelves of pots and a warm kiln.",
      light: ["#F8F1EA", "rgba(178,87,46,.10)", "#FFFCF8", "#2E1E16", "#6E5A4E", "#E8D8CA", "#F2E6DA", "#FFFBF7", "#B2572E", "#C9773E", "#FFFFFF", "#7A3A1C", "#723C26", "#F2DCCB", "#FFE0A8"],
      dark: ["#1A1214", "rgba(242,168,106,.08)", "#241A1C", "#F6ECE4", "#C2AEA2", "#3E2E2C", "#2E2224", "#1E1517", "#F2A86A", "#F6C48E", "#24160F", "#8A5A38", "#1E1214", "#EAD6C8", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#EAD7C3,#F6ECE1 55%,#D9B79A)", "linear-gradient(180deg,#221A1E,#3E2C2A 55%,#7A4A34)"],
      spine: [lg("#A0583A", "#723C26"), lg("#3E2826", "#1E1214")], btn: [lg2("#B2572E", "#C9773E"), lg2("#F2A86A", "#F6C48E")]},
    kit: {motif: "n3vase", card: ["#FFF9F3", "#F3E3D4"], ink: "#2E1E16", bd: "#E6C8AE", mc: "#C9773E", r: 12, notes: ["#F2DCCB"].concat(NOTES), shape: "folded", pin: "clip", fab: "18px", btn: "10px"},
    fx: FX.pottery,
    tag: "A sunlit pottery studio with a turning wheel, shelves of drying pots, a glowing brick kiln and a sleepy cat"
  });
  MAJ_THEMES.push({
    skin: {id: "campfire", name: "Campfire Night", group: "ideas", desc: "A crackling campfire and a tent by a still mountain lake.",
      light: ["#F1F4EE", "rgba(194,88,42,.09)", "#FFFFFF", "#18261F", "#55665C", "#D8E0D6", "#E6ECE2", "#F9FBF7", "#C2582A", "#D9783A", "#FFFFFF", "#7A3416", "#27463C", "#D2E4DA", "#FFE3A0"],
      dark: ["#0E1224", "rgba(245,160,78,.08)", "#171C32", "#F2EEE6", "#B4B2C2", "#2A2F48", "#1F2540", "#11162A", "#F5A04E", "#F8C27A", "#1A1220", "#8A5A2A", "#0E1326", "#D8D4E4", "#6A4A22"],
      glow: ["linear-gradient(180deg,#B5D3E6,#E7EFE7 55%,#CBD8B3)", "linear-gradient(180deg,#10162A,#1E2742 55%,#46352E)"],
      spine: [lg("#3E6A5A", "#27463C"), lg("#1E2844", "#0E1326")], btn: [lg2("#C2582A", "#D9783A"), lg2("#F5A04E", "#F8C27A")]},
    kit: {motif: "n3flame", card: ["#FBFAF5", "#EEF0E4"], ink: "#18261F", bd: "#D4D8C2", mc: "#D9783A", r: 14, notes: ["#F6DCC6"].concat(NOTES), shape: "classic", pin: "pin", fab: "999px", btn: "12px"},
    fx: FX.campfire,
    tag: "A crackling campfire by a still mountain lake, with a glowing tent, toasting marshmallows and a sky full of stars"
  });
  MAJ_THEMES.push({
    skin: {id: "aquarium", name: "Aquarium Tunnel", group: "ideas", desc: "A glass tunnel through a giant tank, with fish swimming all around.",
      light: ["#EAF6FA", "rgba(26,118,168,.10)", "#FFFFFF", "#0E2A3A", "#4A6A7A", "#CBE3EC", "#DDEFF5", "#F6FBFD", "#1A76A8", "#2F9AC2", "#FFFFFF", "#0F4A6E", "#124C6E", "#CDE8F4", "#FFE9A8"],
      dark: ["#06122A", "rgba(111,227,255,.07)", "#0C1C36", "#E6F4FC", "#9CBCD2", "#1B3150", "#132642", "#08162E", "#6FE3FF", "#B4A6FF", "#06142A", "#2A7F9C", "#06142A", "#C6E2F2", "#2A5A66"],
      glow: ["linear-gradient(180deg,#6FC3DF,#A9E0EE 55%,#D7F1F4)", "linear-gradient(180deg,#081A33,#0E2E52 55%,#1E4A6E)"],
      spine: [lg("#1E6E96", "#124C6E"), lg("#0E2A4E", "#06142A")], btn: [lg2("#1A76A8", "#2F9AC2"), lg2("#6FE3FF", "#B4A6FF")]},
    kit: {motif: "n3fish", card: ["#F4FBFD", "#DCEFF6"], ink: "#0E2A3A", bd: "#A8D6E6", mc: "#2F9AC2", r: 20, notes: ["#CDEAF4"].concat(NOTES), shape: "speech", pin: "magnet", fab: "999px", btn: "999px"},
    fx: FX.aquarium,
    tag: "A glass tunnel through a giant tank, with schools of fish, a gliding manta, glowing jellies and a passing whale shark"
  });
})();
/* end of module 20-scenes-maj-n3.js */


