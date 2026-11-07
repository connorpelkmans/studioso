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
    n3clown: {d: FB + FT, paint: (g, c, dk) => { const b = new Path2D(FB); fillP(g, "#E05A16", FT); fillP(g, "#F07020", "M-2.4 -5.2Q1 -9.6 5.4 -5.4Z M-1.4 5.2Q1.4 8.8 4.6 5.2Z"); g.fillStyle = "#F7801F"; g.fill(b);
      g.save(); g.clip(b); g.fillStyle = "#FFFFFF"; g.strokeStyle = "#1A1A22"; g.lineWidth = 0.8; [[4.8, 2.4], [-0.4, 2.6], [-5.4, 1.8]].forEach(([x, w]) => { g.fillRect(x - w / 2, -9, w, 18); g.strokeRect(x - w / 2, -9, w, 18); }); g.restore();
      sheen(g, dk); eye(g, 7.2, -1.5, 1.5); }},
    n3tang: {d: TB + TT, paint: (g, c, dk) => { fillP(g, "#FFC81E", TT); fillP(g, "#1E3E9E", "M-5 -5.4Q1 -10.4 7 -5.6Z M-4.6 5.4Q1 9.6 6 5.4Z"); fillP(g, "#2F62E0", TB);
      fillP(g, "#12204A", "M-5.6 -3.4C-1 -7 5.4 -6 8.2 -2.6C4.6 -4 0.4 -2.6 -1.6 0.6C-2.8 2.6 -5.4 2.2 -5.6 -3.4Z"); sheen(g, dk); eye(g, 6.8, -1.8, 1.4); }},
    n3ytang: {d: YB + YT, paint: (g, c, dk) => { fillP(g, "#F2B50E", YT); fillP(g, "#FFD526", YB); fillP(g, "#F5BE12", "M-4.4 -5.6Q1 -11 7 -4.4L4 -3.4Q0 -6.4 -4.4 -5.6Z"); sheen(g, dk); fillP(g, "#FFFFFF", "M-4.6 0.6L-3.2 -0.4L-3 1.4Z"); eye(g, 6.4, -2, 1.3); }},
    n3gramma: {d: FB + FT, paint: (g, c, dk) => { const b = new Path2D(FB); fillP(g, "#FFC21E", FT); g.save(); g.clip(b); g.fillStyle = "#FFC21E"; g.fillRect(-13, -13, 26, 26); g.fillStyle = "#9A4CE0"; g.beginPath(); g.moveTo(1.6, -9); g.bezierCurveTo(-1, -3, 1, 3, -1.6, 9); g.lineTo(12, 9); g.lineTo(12, -9); g.fill(); g.restore(); fillP(g, "#8A40D0", "M0 -5.6Q3 -9.4 6.4 -5Z"); sheen(g, dk); eye(g, 7.2, -1.5, 1.4); }},
    // a manta seen from above, wings out to the sides
    n3manta: {d: "M11 0C8 -1.6 4 -2 1 -3C-2 -6 -5 -10 -7 -11.4C-6 -7 -6 -3.6 -7 -1.4L-12.4 0L-7 1.4C-6 3.6 -6 7 -7 11.4C-5 10 -2 6 1 3C4 2 8 1.6 11 0Z", paint: (g, c, dk) => { const d = FX_SHAPES.n3manta.d; fillP(g, dk ? "#5A7CA8" : "#2E4462", d); fillP(g, dk ? "#5A7CA8" : "#2E4462", "M9.6 -1.6L12.6 -3L12 -0.8Z M9.6 1.6L12.6 3L12 0.8Z");
      g.save(); g.clip(new Path2D(d)); g.fillStyle = dk ? "rgba(220,236,255,.5)" : "rgba(230,240,250,.55)"; g.beginPath(); g.ellipse(1.6, -3.4, 2.4, 1.2, -0.5, 0, 6.3); g.ellipse(1.6, 3.4, 2.4, 1.2, 0.5, 0, 6.3); g.fill(); g.restore(); sheen(g, dk, 0.8); }},
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

  // Campfire: a crackling fire rises at the bottom and throws sparks and smoke into the sky
  const fireDraw = (g, f, W, H, dk) => { const u = Math.min(W, H) / 100, k = ease(f / 30) * (1 - 0.3 * ease((f - 150) / 90)), cx = W / 2, by = H + 3 * u, F = 28 * u * k; if (F < 1) return;
    const gr = g.createRadialGradient(cx, by, 0, cx, by, F * 2.8); gr.addColorStop(0, `rgba(255,160,60,${dk ? 0.42 : 0.3})`); gr.addColorStop(1, "rgba(255,140,60,0)"); g.fillStyle = gr; g.fillRect(cx - F * 2.8, by - F * 2.8, F * 5.6, F * 2.8);
    [[1, "#E2482A"], [0.8, "#F5843A"], [0.58, "#FFBE3E"], [0.32, "#FFF0B0"]].forEach(([s, c], L) => { g.fillStyle = c; for (let i = -2; i <= 2; i++) { const ph = f * 0.17 + i * 1.7 + L * 0.9, w = F * 0.25 * s * (1 - Math.abs(i) * 0.12), h = F * s * (1 - Math.abs(i) * 0.24) * (0.86 + 0.14 * Math.sin(ph)), x = cx + i * F * 0.19 * s, tip = Math.sin(ph * 0.7) * w * 0.7;
      g.beginPath(); g.moveTo(x - w, by); g.bezierCurveTo(x - w, by - h * 0.45, x + tip - w * 0.25, by - h * 0.72, x + tip, by - h); g.bezierCurveTo(x + tip + w * 0.25, by - h * 0.72, x + w, by - h * 0.45, x + w, by); g.closePath(); g.fill(); } });
    g.strokeStyle = dk ? "#4A2E22" : "#6A4026"; g.lineWidth = F * 0.15; g.lineCap = "round"; [[-0.32, 1], [0.32, -1]].forEach(([o, s]) => { const x = cx + o * F * 0.6, y = by - F * 0.1, c = Math.cos(s * 0.32) * F * 0.6, si = Math.sin(s * 0.32) * F * 0.6; g.beginPath(); g.moveTo(x - c, y - si); g.lineTo(x + c, y + si); g.stroke(); }); };

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
    campfire: {spawn: (W, H, d, n) => { const u = Math.min(W, H) / 100;
        return Array.from({length: n(80)}, () => ({shape: "circle", c: fxPick(["#FFB347", "#FF8A3A", "#FFE08A", "#FF6A3A"]), x: W / 2 + fxR(-12, 12) * u, y: H - fxR(4, 18) * u, vx: fxR(-0.6, 0.6), vy: -fxR(2.2, 4.4), g: -0.004, size: fxR(1.8, 3.6), rot: 0, vr: 0, sway: fxR(0.8, 2), swf: fxR(0.05, 0.12), grow: -0.05, life: fxR(80, 150), delay: Math.floor(fxR(14, 175)), glow: 10}))
          .concat(fxRise(W, H, n(14), "puffsoft", d ? ["#9A9AB0"] : ["#B4BAC4"], {cx: [0.44, 0.56], smin: 10, smax: 15, vmin: 0.9, vmax: 1.5, sway: 1.2, grow: 0.35, alpha: d ? 0.14 : 0.16, life: 170, spread: 150, depth: false}).map(p => Object.assign(p, {y: H - 26 * u, delay: p.delay + 30})),
            d ? fxTw(W, H, n(40), "star", ["#FFFFFF", "#FFE7B0", "#C9D4FF"], {smin: 3, smax: 6, top: 0.55, glow: 10, spread: 160}) : fxTw(W, H, n(16), "sparkle", ["#F5913A", "#F7C04A"], {smin: 4, smax: 7, top: 0.7, glow: 4, spread: 160}));
      }, draw: fireDraw},
    aquarium: {spawn: (W, H, d, n) => school(W, H, n(28), ["n3clown", "n3tang", "n3ytang", "n3gramma"], {per: 5, smin: 14, smax: 19})
        .concat([{shape: "n3manta", c: "#FFFFFF", x: -90, y: H * fxR(0.22, 0.36), vx: W * 0.0034 + 1, vy: -0.12, g: 0, size: 32, face: true, wig: 0.04, rot: 0, vr: 0, sway: 0, life: 360, delay: 10, alpha: d ? 0.9 : 0.85}],
          fxRise(W, H, n(40), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#E8FAFF"], {smin: 4, smax: 9, sway: 1, vmin: 1.4, vmax: 2.8, spread: 140}),
          d ? fxRise(W, H, n(6), "jelly", ["#FF9CD8", "#6FF3FF", "#B89CFF"], {smin: 13, smax: 18, vmin: 0.8, vmax: 1.4, sway: 1.2, glow: 16, life: 330}) : []),
      draw: (g, f, W, H, d) => rays(g, f, W, H, d, d ? "140,220,255" : "255,255,255")}
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


