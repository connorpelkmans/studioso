/* ===== module: 20-scenes-maj-n6.js ===== */
/* Study Fields themes, batch n6 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const hole = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 1 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 1 ${r1(-2 * r)} 0Z`;
  Object.assign(FX_SHAPES, {
    n6clap: {d: "M-10 -3H10V10H-10Z M-10.6 -4.6L9.4 -9.8L10.4 -6.2L-9.6 -1Z", detail: "M-6.4 -7.9L-4 -2.9M-1 -9.3L1.4 -4.3M4.4 -10.7L6.8 -5.7M-10 3H10", dstroke: true},
    n6reel: {d: circ(0, 0, 10.5) + hole(0, -5, 2.8) + hole(4.3, 2.5, 2.8) + hole(-4.3, 2.5, 2.8) + hole(0, 0, 1.2)},
    n6corn: {d: "M-4 2C-8 1 -8.6 -4.6 -4.4 -5.4C-4 -9.4 1.6 -10 2.6 -6.4C6.6 -7.6 9 -2.4 6 0C8.4 3 5.4 7.2 2 5.6C0.6 9 -4.6 8.4 -4.6 4.6C-7.6 4.4 -7.6 2 -4 2Z", detail: "M-1.6 -2.4Q0 -1 1.8 -2.6M-2.6 1.6Q-0.6 3 1 1.6", dstroke: true},
    n6toque: {d: "M-7 3C-11.6 2.4 -12.4 -5.6 -7.4 -6.6C-7.6 -11.6 -1.6 -12.6 0 -9C1.6 -12.6 7.6 -11.6 7.4 -6.6C12.4 -5.6 11.6 2.4 7 3V10H-7Z", detail: "M-7 5.6H7M-3 3V-2M3 3V-2", dstroke: true},
    n6tomato: {d: "M0 -5C6 -5 9 -1 9 3C9 8 5 10 0 10C-5 10 -9 8 -9 3C-9 -1 -6 -5 0 -5Z M0 -4L-4 -9L-1 -6L0 -10L1 -6L4 -9Z", detail: "M-5 1Q-4 -1 -2 -1.6", dstroke: true},
    n6egg: {d: "M-9 1C-11 -5 -5 -9.6 0 -8.4C5 -10.6 11 -6 9.6 0C11 6 5 9.6 0 8.4C-5 10.4 -11 6.6 -9 1Z", detail: "M-3.8 0A3.8 3.8 0 1 0 3.8 0A3.8 3.8 0 1 0 -3.8 0", dfill: true},
    n6whisk: {d: "M0 11V3M0 3C-6 -2 -5 -10 0 -11C5 -10 6 -2 0 3M0 3C-2.6 -2 -2.4 -9 0 -11C2.4 -9 2.6 -2 0 3", stroke: true, lw: 1.5},
    n6fish: {d: "M-11 0L-15 -5.4L-14 0L-15 5.4Z M-9 0C-6 -6.4 4 -7.4 9.4 -1.6C10.4 -0.6 10.4 0.6 9.4 1.6C4 7.4 -6 6.4 -9 0Z", detail: "M5.4 -1.6A1.4 1.4 0 1 0 5.41 -1.6", dfill: true},
    n6dolphin: {d: "M-11 1C-6 -5 2 -6 7 -4C9 -6 9 -9 7 -10C10 -9 11 -6 10.4 -3C12 -2 13.6 -1 14.6 0.4C13 1.4 11 1.6 9 2C3 6 -4 5 -9 3L-13 6.6L-12.6 2L-15.4 -1.6L-11 1Z", detail: "M6.4 -1.4A1 1 0 1 0 6.41 -1.4", dfill: true},
    n6ticket: {d: "M-11 -6H11V-2.4A2.4 2.4 0 0 0 11 2.4V6H-11V2.4A2.4 2.4 0 0 0 -11 -2.4Z", detail: "M-5 -6V6", dstroke: true}
  });

  /* ---- completion animations ---- */
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const fillP = (g, c, d) => { g.fillStyle = c; g.fill(new Path2D(d)); };
  const sheen = (g, dk, k = 1) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${0.34 * k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dk ? 0.26 : 0.2})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const eye = (g, x, y, r) => { g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); g.fillStyle = "#14202A"; g.beginPath(); g.arc(x + r * 0.25, y, r * 0.62, 0, 6.3); g.fill(); };
  const blobs = (g, a) => { g.beginPath(); a.forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.3); }); };
  const GB = "M-7.6 0C-6 -8 5 -8.6 10.4 -0.8C10.8 0 10.8 0.4 10.4 1C5 8.4 -6 8 -7.6 0Z", GT = "M-6.6 0L-11.8 -5L-10.6 0L-11.8 5Z";
  const SB = "M-8 0C-4 -3.4 5 -3.6 11 0C5 3.6 -4 3.4 -8 0Z", ST = "M-7 0L-11.4 -3.6L-10.4 0L-11.4 3.6Z";
  Object.assign(FX_SHAPES, {
    // a soft round puff that fades to clear in its own color
    n6soft: {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, c); gr.addColorStop(0.5, c + "99"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }},
    // popcorn: a puffy cluster with butter on it
    n6pop: {d: "M-7 2A4.6 4.6 0 0 1 -4 -6A5 5 0 0 1 4.6 -5.6A4.6 4.6 0 0 1 7.4 2.4A4.6 4.6 0 0 1 0 7.6A4.6 4.6 0 0 1 -7 2Z", paint: (g, c, dk) => { g.fillStyle = "#FFF8E8"; blobs(g, [[-3.4, 1.6, 4.4], [3.2, 2, 4.2], [0, -3.4, 4.8], [-4.2, -3, 3.2], [4.4, -3, 3.2], [0, 4.4, 3.4]]); g.fill();
      g.fillStyle = c; g.globalAlpha = 0.8; blobs(g, [[-0.6, 1, 2.6], [2.4, -1.6, 1.8], [-3, -1.2, 1.5]]); g.fill(); g.globalAlpha = 1; g.strokeStyle = "rgba(170,120,60,.45)"; g.lineWidth = 0.5; blobs(g, [[-3.4, 1.6, 4.4], [3.2, 2, 4.2], [0, -3.4, 4.8]]); g.stroke(); sheen(g, dk, 0.6); }},
    // ingredients for the skillet toss
    n6tom: {d: "M0 -6.4C5.6 -6.4 8.6 -3 8.6 1.4C8.6 6.4 4.6 9 0 9C-4.6 9 -8.6 6.4 -8.6 1.4C-8.6 -3 -5.6 -6.4 0 -6.4Z", paint: (g, c, dk) => { fillP(g, "#E2382E", FX_SHAPES.n6tom.d); sheen(g, dk, 1.2); fillP(g, "#3E8E3A", "M0 -5L-5 -8.6L-1.4 -5.4L-2.6 -9.4L0 -6L2.6 -9.4L1.4 -5.4L5 -8.6Z M-0.6 -6H0.6V-10.4H-0.6Z"); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(-3.6, -1.6, 1.6, 1, -0.6, 0, 6.3); g.fill(); }},
    n6basil: {d: "M0 -10.5C6 -6 6.6 4 0 10.5C-6.6 4 -6 -6 0 -10.5Z", paint: (g, c, dk) => { fillP(g, c, FX_SHAPES.n6basil.d); sheen(g, dk); g.strokeStyle = "rgba(230,255,220,.55)"; g.lineWidth = 0.7; g.lineCap = "round"; g.stroke(new Path2D("M0 -8.6V9M0 -3L3.2 -5.4M0 1L3.8 -1.6M0 5L3 3M0 -3L-3.2 -5.4M0 1L-3.8 -1.6M0 5L-3 3")); }},
    n6carrot: {d: "M-8.4 0A8.4 8.4 0 1 0 8.4 0A8.4 8.4 0 1 0 -8.4 0Z", paint: (g, c, dk) => { g.fillStyle = "#F07A1E"; g.beginPath(); g.arc(0, 0, 8.4, 0, 6.3); g.fill(); g.fillStyle = "#F8A040"; g.beginPath(); g.arc(0, 0, 6.6, 0, 6.3); g.fill(); g.fillStyle = "#F58A2A"; g.beginPath(); g.arc(0, 0, 3, 0, 6.3); g.fill(); g.strokeStyle = "rgba(255,230,190,.6)"; g.lineWidth = 0.5; for (let i = 0; i < 8; i++) { const a = i * 0.785; g.beginPath(); g.moveTo(Math.cos(a) * 3.4, Math.sin(a) * 3.4); g.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); g.stroke(); } sheen(g, dk, 0.7); }},
    n6shroom: {d: "M-9 0C-9 -6 -4.6 -9 0 -9C4.6 -9 9 -6 9 0C9 1.6 7 1.6 3.4 1.4V8.6C3.4 9.6 -3.4 9.6 -3.4 8.6V1.4C-7 1.6 -9 1.6 -9 0Z", paint: (g, c, dk) => { fillP(g, "#F2E4CC", FX_SHAPES.n6shroom.d); g.strokeStyle = "#B88A5A"; g.lineWidth = 1.4; g.stroke(new Path2D("M-8.2 -0.4C-8.2 -5.6 -4.2 -8.2 0 -8.2C4.2 -8.2 8.2 -5.6 8.2 -0.4")); g.fillStyle = "#E2CCA8"; g.beginPath(); g.ellipse(0, -1, 5.4, 1.2, 0, 0, 6.3); g.fill(); sheen(g, dk, 0.6); }},
    n6chili: {d: "M-9.6 -3.4C-6 -1 0 0.6 5 -1C7.4 -1.8 8.4 -0.6 8 1.4C6.6 5.6 -2 6.4 -9.6 -3.4Z M6.6 -1.4C7.6 -4 9.6 -5.4 11 -5L10.6 -4C9.4 -4 8.4 -2.8 8 -1.2Z", paint: (g, c, dk) => { fillP(g, "#D8281E", "M-9.6 -3.4C-6 -1 0 0.6 5 -1C7.4 -1.8 8.4 -0.6 8 1.4C6.6 5.6 -2 6.4 -9.6 -3.4Z"); sheen(g, dk, 1.2); fillP(g, "#3E8E3A", "M4.6 -1.6C6 -2.8 8 -2.6 8.6 -1C8.6 0.4 6.6 0.6 4.6 -1.6Z M6.6 -1.4C7.6 -4 9.6 -5.4 11 -5L10.6 -4C9.4 -4 8.4 -2.8 8 -1.2Z"); }},
    // kelp forest fish: a garibaldi and a sardine, pointing to +x
    n6gari: {d: GB + GT, paint: (g, c, dk) => { fillP(g, "#F0600E", GT); fillP(g, "#F26A12", "M-5 -5.4Q0 -10 6 -5.8Z M-4.6 5.4Q0 9 5 5.6Z"); fillP(g, "#FF7E1A", GB); sheen(g, dk, 1.1); eye(g, 6.8, -1.6, 1.4); }},
    n6sard: {d: SB + ST, paint: (g, c, dk) => { fillP(g, "#7E96AE", ST); fillP(g, "#D6E2EC", SB); g.save(); g.clip(new Path2D(SB)); g.fillStyle = "#4E6E90"; g.fillRect(-9, -4, 21, 3.4); g.fillStyle = "rgba(255,255,255,.7)"; g.fillRect(-9, -0.8, 21, 0.9); g.restore(); eye(g, 7.4, -0.6, 1); }},
    // the little yellow research sub
    n6sub: {d: "M-9 -4.6H5C9 -4.6 11.4 -2.4 11.4 0.6C11.4 3.6 9 5.6 5 5.6H-9C-11 5.6 -11.6 3.4 -11.6 0.6C-11.6 -2.4 -11 -4.6 -9 -4.6Z M-3.6 -4.6V-8.4H2.4V-4.6Z", paint: (g, c, dk) => { fillP(g, "#4A4E56", "M-11 -1.6L-13.4 -4.4V5.6L-11 2.8Z"); fillP(g, "#F2C21E", FX_SHAPES.n6sub.d); sheen(g, dk, 1.1); fillP(g, "#E0A814", "M-3.6 -8.4H2.4V-7.4H-3.6Z M-9 3.6H8.4V5.6H-9Z");
      g.fillStyle = "#A8E4F0"; g.beginPath(); g.arc(6.2, -0.2, 3.2, 0, 6.3); g.fill(); g.strokeStyle = "#8A7A5A"; g.lineWidth = 0.9; g.stroke(); g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(5.2, -1.4, 1, 0, 6.3); g.fill(); g.fillStyle = "#2E3A4A"; [-5.6, -1.6].forEach(x => { g.beginPath(); g.arc(x, 0.2, 1.4, 0, 6.3); g.fill(); }); }}
  });
  // a school of one kind of fish, entering from one side
  const school = (W, H, n, shape, o = {}) => { const out = []; for (let s = 0; out.length < n; s++) { const lr = (s + (o.side || 0)) % 2 === 0, z = fxR(0.75, 1.1), y0 = fxR(H * (o.y0 || 0.15), H * (o.y1 || 0.85)), sp = (W * fxR(0.004, 0.0058) + 1.2) * z * (o.sp || 1), vy = fxR(-0.3, 0.3), d0 = Math.floor(fxR(0, o.spread || 80)), sz = fxR(o.smin || 12, o.smax || 16) * z, per = o.per || 5;
    for (let i = 0; i < per && out.length < n; i++) out.push({shape, c: "#FFFFFF", x: lr ? -40 : W + 40, y: y0 + fxR(-1, 1) * sz * (o.tight || 3.4), vx: (lr ? 1 : -1) * sp * fxR(0.95, 1.05), vy: vy + fxR(-0.06, 0.06), g: 0, size: sz * fxR(0.88, 1.05), z, face: true, wig: o.wig || 0.13, rot: 0, vr: 0, sway: 0, life: 330, delay: Math.min(150, d0 + Math.floor(i * fxR(3, o.gap || 10))), alpha: fxDim(z)}); } return out; };
  const rays = (g, f, W, H, dk, rgb) => { const a = ease(f / 40); g.globalCompositeOperation = dk ? "lighter" : "source-over"; for (let i = 0; i < 4; i++) { const x = W * (0.08 + i * 0.27) + Math.sin(f * 0.012 + i * 1.9) * W * 0.04, w = W * (0.04 + 0.025 * (i % 2)) + 20, gr = g.createLinearGradient(0, 0, 0, H * 0.95); gr.addColorStop(0, `rgba(${rgb},${(dk ? 0.12 : 0.3) * a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(x - w * 0.4, 0); g.lineTo(x + w * 0.4, 0); g.lineTo(x + w * 1.6 + H * 0.22, H * 0.95); g.lineTo(x - w * 0.3 + H * 0.22, H * 0.95); g.fill(); } g.globalCompositeOperation = "source-over"; };
  const scl = (W, H) => 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));

  // Film: a strip of film unspools across the screen, frames rolling by, with a burst of popcorn
  const FILMC = ["#F2B85A", "#E86A5A", "#7FB8C8", "#F2D48A", "#C88AB8"];
  const filmDraw = (g, f, W, H, dk) => { const cw = Math.max(34, Math.min(W, H) * 0.085), sh = cw * 0.9, hx = -cw + ease(f / 100) * (W + 2 * cw), off = f * 1.4, yAt = x => H * 0.3 + Math.sin(x / W * Math.PI * 1.5 + 0.5) * H * 0.09 + x / W * H * 0.12;
    const k0 = Math.floor((-cw - off) / cw), k1 = Math.ceil((hx - off) / cw);
    for (let k = k0; k <= k1; k++) { const x = k * cw + off; if (x > hx || x < -cw * 1.5) continue; const y = yAt(x), a = Math.atan2(yAt(x + 4) - y, 4);
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = dk ? "#0E0A10" : "#2A2226"; g.fillRect(-cw / 2 - 0.5, -sh / 2, cw + 1, sh);
      g.fillStyle = dk ? "#5A4A50" : "#F4E7DC"; for (let j = 0; j < 3; j++) { g.fillRect(-cw / 2 + cw * (0.1 + j * 0.33), -sh * 0.44, cw * 0.14, sh * 0.1); g.fillRect(-cw / 2 + cw * (0.1 + j * 0.33), sh * 0.34, cw * 0.14, sh * 0.1); }
      const c = FILMC[((k % 5) + 5) % 5]; g.fillStyle = c; g.fillRect(-cw * 0.42, -sh * 0.27, cw * 0.84, sh * 0.54); g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(-cw * 0.42, -sh * 0.27, cw * 0.84, sh * 0.14); g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.arc(-cw * 0.05, sh * 0.06, sh * 0.13, 0, 6.3); g.fill(); g.fillRect(-cw * 0.3, sh * 0.12, cw * 0.6, sh * 0.15); g.restore(); } };

  // Culinary: a skillet pops up and tosses the ingredients high, steam curling off
  const panAt = (f, W, H) => { const u = Math.min(W, H) / 100, pw = Math.max(70, 22 * u), y = H - pw * 0.12 + (1 - ease(f / 18)) * pw * 0.9 - Math.sin(Math.max(0, Math.min(1, (f - 16) / 14)) * Math.PI) * pw * 0.2 + ease((f - 200) / 50) * pw; return {pw, y, tilt: -Math.sin(Math.max(0, Math.min(1, (f - 16) / 14)) * Math.PI) * 0.22}; };
  const panDraw = (g, f, W, H, dk) => { const {pw, y, tilt} = panAt(f, W, H), cx = W / 2; g.translate(cx, y); g.rotate(tilt);
    g.strokeStyle = dk ? "#8A6448" : "#3A2C24"; g.lineWidth = pw * 0.11; g.lineCap = "round"; g.beginPath(); g.moveTo(pw * 0.9, -pw * 0.02); g.lineTo(pw * 1.7, -pw * 0.16); g.stroke();
    g.fillStyle = dk ? "#5A5A66" : "#26262C"; g.beginPath(); g.ellipse(0, pw * 0.06, pw, pw * 0.3, 0, 0, Math.PI); g.lineTo(-pw, 0); g.ellipse(0, 0, pw, pw * 0.26, 0, Math.PI, 0); g.fill();
    g.fillStyle = dk ? "#767684" : "#4A4A52"; g.beginPath(); g.ellipse(0, 0, pw * 0.92, pw * 0.22, 0, 0, 6.3); g.fill(); g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.ellipse(-pw * 0.2, -pw * 0.04, pw * 0.5, pw * 0.08, 0, 0, 6.3); g.fill(); };

  // Kelp forest: the yellow research sub cruises through with its lamp on, past schools of garibaldi and sardines
  let SUB = null;
  const subDraw = (g, f, W, H, dk) => { rays(g, f, W, H, dk, dk ? "160,230,210" : "255,244,200"); if (!SUB || f < SUB.d0) return; const t = f - SUB.d0, x = SUB.x + SUB.vx * t, y = SUB.y + SUB.vy * t, L = Math.min(W, H) * 0.5, a = ease(t / 30) * (dk ? 0.3 : 0.32);
    const gr = g.createRadialGradient(x, y, 0, x, y, L); gr.addColorStop(0, `rgba(255,240,170,${a})`); gr.addColorStop(1, "rgba(255,240,170,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + L, y - L * 0.36); g.lineTo(x + L, y + L * 0.36); g.lineTo(x, y + 4); g.fill(); };

  const FX = {
    film: {spawn: (W, H, d, n) => fxBurst(W, H, n(44), "n6pop", d ? ["#F6C64A", "#FFE08A"] : ["#F2B83A", "#F6C64A"], [[0.12, 1.02], [0.88, 1.02]], {smin: 12, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.12, 0.12), delay: p.delay + 30}))
        .concat(fxTw(W, H, n(26), "star", d ? ["#FFE7B0", "#FFFFFF", "#F2C46A"] : ["#F2B53A", "#E8A040", "#E05A6A"], {smin: 5, smax: 10, glow: d ? 10 : 4, spread: 150})),
      draw: filmDraw},
    culinary: {spawn: (W, H, d, n) => { const {pw} = panAt(30, W, H), py = (H - pw * 0.3) / H, ing = [["n6tom", ["#E2382E"]], ["n6basil", d ? ["#5DB85A", "#3E9A4A"] : ["#3E9A3A", "#56B24A"]], ["n6carrot", ["#F07A1E"]], ["n6shroom", ["#F2E4CC"]], ["n6chili", ["#D8281E"]]];
        return ing.flatMap(([s, c], i) => fxBurst(W, H, n(i === 1 ? 14 : 9), s, c, [[0.47, py], [0.53, py]], {smin: 12, smax: 16, flip: s === "n6basil"}).map(p => Object.assign(p, {vx: p.vx * 0.55, vy: p.vy * 0.95, delay: 22 + Math.floor(fxR(0, 8)), vr: fxR(-0.12, 0.12)})))
          .concat(fxRise(W, H, n(12), "n6soft", ["#FFFFFF"], {cx: [0.42, 0.58], smin: 8, smax: 12, vmin: 0.8, vmax: 1.4, sway: 1.2, grow: 0.3, alpha: d ? 0.09 : 0.5, life: 150, spread: 150, depth: false}).map(p => Object.assign(p, {y: H - pw * 0.3, delay: p.delay + 24})),
            fxTw(W, H, n(18), "sparkle", d ? ["#FFE7B0", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 4, smax: 8, glow: d ? 10 : 4, top: 0.7, spread: 160}));
      }, draw: panDraw},
    marinebio: {spawn: (W, H, d, n) => { const s = scl(W, H), sz = 34, vx = W * 0.0034 + 0.9; SUB = {x: -70, y: H * fxR(0.26, 0.34), vx, vy: -0.05, d0: 16};
        const sub = {shape: "n6sub", c: "#F2C21E", x: SUB.x, y: SUB.y, vx, vy: SUB.vy, g: 0, size: sz, face: true, rot: 0, vr: 0, sway: 0, life: 360, delay: SUB.d0};
        const trail = Array.from({length: n(34)}, (_, i) => { const t = 6 + i * 7; return {shape: "bubble", c: d ? "#C8F5EE" : "#FFFFFF", x: SUB.x + vx * t - sz * s * 1.2, y: SUB.y + SUB.vy * t + fxR(-4, 4), vx: fxR(-0.3, 0.1), vy: -fxR(0.6, 1.4), g: -0.006, size: fxR(3, 6), rot: 0, vr: 0, sway: 0.5, swf: 0.08, life: 110, delay: SUB.d0 + t}; }).filter(p => p.delay < 210);
        return school(W, H, n(18), "n6gari", {per: 3, smin: 14, smax: 18, spread: 90, y0: 0.15, y1: 0.85}).concat(school(W, H, n(26), "n6sard", {per: 13, smin: 9, smax: 11, tight: 4, gap: 5, sp: 1.25, wig: 0.08, side: 1, y0: 0.6, y1: 0.85}), [sub], trail,
          fxRise(W, H, n(24), "bubble", d ? ["#9EE6EE", "#E2F8FA"] : ["#FFFFFF", "#E2F6F2"], {smin: 4, smax: 9, sway: 1, spread: 140}));
      }, draw: subDraw}
  };
  /* ---- end of completion animations ---- */

  MAJ_THEMES.push({
    skin: {id: "film", name: "Movie Palace", group: "ideas", desc: "An old picture palace with red velvet seats, a marquee and a projector beam.",
      light: ["#F8F0E8", "rgba(168,48,62,.10)", "#FFFFFF", "#2E1418", "#74585A", "#EBD9CF", "#F4E6DC", "#FCF8F4", "#A8303E", "#C8564A", "#FFFFFF", "#6E1C28", "#5A1E2E", "#F2DCD0", "#FFE3A3"],
      dark: ["#170E16", "rgba(242,196,106,.08)", "#22141E", "#F8EEEE", "#C2A8B0", "#3A2432", "#2C1A26", "#1C1019", "#F2C46A", "#F6D592", "#2A1220", "#7A5A30", "#1A0E16", "#E8D2D8", "#6A4A26"],
      glow: ["linear-gradient(180deg,#E7D3C3,#F4E7DC 45%,#D7B6A0)", "linear-gradient(180deg,#160F1E,#2A1A2E 50%,#5A1E2E)"],
      spine: [lg("#7A2434", "#5A1E2E"), lg("#3A1A2A", "#1A0E16")], btn: [lg2("#A8303E", "#C0503A"), lg2("#F2C46A", "#F6D592")]},
    kit: {motif: "n6reel", card: ["#FCF7F2", "#F1E2D8"], ink: "#2E1418", bd: "#E2C6B8", mc: "#A8303E", r: 12, notes: ["#F6DCD2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "gold", fab: "999px", btn: "10px"},
    fx: FX.film,
    tag: "An old picture palace: red velvet seats, gathered curtains, a marquee of chasing bulbs and a projector beam full of dust"
  });
  MAJ_THEMES.push({
    skin: {id: "culinary", name: "Test Kitchen", group: "ideas", desc: "A bright professional kitchen with copper pots, an herb window box and order tickets on the pass.",
      light: ["#F6F8F2", "rgba(62,122,90,.10)", "#FFFFFF", "#2A2018", "#6E6052", "#E2E6DA", "#EEF2E8", "#FBFCF8", "#C8603A", "#D97B45", "#FFFFFF", "#7A3418", "#285A40", "#E6F0E8", "#FFE7A0"],
      dark: ["#16141A", "rgba(242,163,90,.08)", "#211E24", "#F4EEE6", "#B8ACA0", "#36303A", "#2A2530", "#1A171E", "#F2A35A", "#F6C27A", "#241A14", "#7A5230", "#141218", "#E8DED4", "#6A4A26"],
      glow: ["linear-gradient(180deg,#F2E3CF,#FBF4EA 50%,#DCE8D2)", "linear-gradient(180deg,#1C1A22,#2E2830 50%,#5A3E34)"],
      spine: [lg("#3E7A5A", "#285A40"), lg("#2A2830", "#141218")], btn: [lg2("#C8603A", "#D97B45"), lg2("#F2A35A", "#F6C27A")]},
    kit: {motif: "n6toque", card: ["#FBFCF8", "#ECF2E6"], ink: "#2A2018", bd: "#D2DEC8", mc: "#C8603A", r: 14, notes: ["#E2EED8", "#FFF3B8", "#FFE0CC", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "lined", pin: "magnet", fab: "16px", btn: "12px"},
    fx: FX.culinary,
    tag: "A bright test kitchen: copper pots on the rack, herbs in the window box, order tickets on the pass and pots simmering on the range"
  });

  MAJ_THEMES.push({
    skin: {id: "marinebio", name: "Kelp Forest", group: "ideas", desc: "An underwater kelp forest with sunbeams, an otter and a little research submarine.",
      light: ["#EEF8F6", "rgba(46,138,134,.10)", "#FFFFFF", "#0E2E30", "#4C6A6A", "#CFE6E2", "#E0F2EE", "#F6FCFB", "#1F8A86", "#3AA6A0", "#FFFFFF", "#145E5A", "#1A5E5E", "#D8F2EE", "#FFE7A0"],
      dark: ["#071A20", "rgba(242,194,48,.07)", "#0D2830", "#E6F6F4", "#9CC0BE", "#1C4048", "#14343C", "#0A2026", "#F2C230", "#F6D86A", "#0A2028", "#7A6A20", "#06161C", "#CFEAE6", "#5A4A1A"],
      glow: ["linear-gradient(180deg,#C8EBDD,#8FD0C2 40%,#5FB6B0)", "linear-gradient(180deg,#1E4E52,#0E3440 40%,#08202A)"],
      spine: [lg("#2E8A86", "#1A5E5E"), lg("#0E3440", "#06161C")], btn: [lg2("#1F8A86", "#3AA6A0"), lg2("#F2C230", "#F6D86A")]},
    kit: {motif: "n6fish", card: ["#F4FBFA", "#DDF0EC"], ink: "#0E2E30", bd: "#A8D6CE", mc: "#1F8A86", r: 20, notes: ["#D6F0EA", "#FFF3B8", "#FFE0CC", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "magnet", fab: "999px", btn: "999px"},
    fx: FX.marinebio,
    tag: "Under the sea in a kelp forest: sunbeams, swaying golden kelp, an otter napping on the surface and a little yellow research sub"
  });

})();
/* end of module 20-scenes-maj-n6.js */




