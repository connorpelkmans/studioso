/* ===== module: 20-scenes-maj-n1.js ===== */
/* New theme ideas, batch n1 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a scalloped round (n bumps), for anemones
  const scallop = (R, n, b) => { let d = ""; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; d += circ(R * Math.cos(a), R * Math.sin(a), b); } return d + circ(0, 0, R); };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n1yuzu: {d: circ(0, 1.6, 9) + "M0.6 -7.2C2.4 -11.8 7.6 -12.6 10.2 -10.2C8.2 -6.8 3.8 -6.2 0.6 -7.2Z", detail: "M-4.6 -1.6A5.4 5.4 0 0 1 -0.6 -5.2", dstroke: true},
    n1maple: {d: "M0.0 4.4L-1.8 5.4L-2.8 6.0L-4.1 6.3L-4.6 6.1L-6.2 6.6L-5.0 5.4L-4.9 4.9L-4.0 3.9L-4.8 3.1L-5.9 1.9L-7.2 0.5L-7.4 -0.3L-9.1 -1.9L-6.8 -1.3L-6.1 -1.6L-4.2 -1.2L-2.5 -1.1L-2.0 -3.4L-1.3 -5.4L-0.6 -5.9L-0.0 -8.5L0.6 -5.9L1.3 -5.4L2.0 -3.4L2.5 -1.1L4.2 -1.2L6.1 -1.6L6.8 -1.3L9.1 -1.9L7.4 -0.3L7.2 0.5L5.9 1.9L4.8 3.1L4.0 3.9L4.9 4.9L5.0 5.4L6.2 6.6L4.6 6.1L4.1 6.3L2.8 6.0L1.7 5.4Z", detail: "M0 9V-6M0 1L-5 -1.6M0 1L5 -1.6", dstroke: true},
    n1monstera: {d: "M0 11C-1.2 6.4 -10.6 4.4 -10.6 -3C-10.6 -9.2 -4.4 -11.4 0 -8.2C4.4 -11.4 10.6 -9.2 10.6 -3C10.6 4.4 1.2 6.4 0 11Z", detail: "M0 9.4V-6.4M0 3.2L-7.4 -0.6M0 -1.4L-6.6 -5.6M0 3.2L7.4 -0.6M0 -1.4L6.6 -5.6", dstroke: true},
    n1feather: {d: "M-10.5 10.5C-7 3 -1 -5 10.5 -11C8.6 -3.2 2.4 5 -10.5 10.5Z", detail: "M-10 10L7 -8", dstroke: true},
    n1anem: {d: scallop(6.6, 12, 2.6), detail: circ(0, 0, 2.4), dfill: true},
    n1hibiscus: {d: [0, 72, 144, 216, 288].map(a => { const t = (a - 90) * Math.PI / 180; return circ(5.2 * Math.cos(t), 5.2 * Math.sin(t), 4.8); }).join(""), detail: circ(0, 0, 2.2), dfill: true},
    n1acacia: {d: "M-1.2 11L-0.8 2.6L-5.6 -2.4L-4.4 -3.2L-0.4 0.6L-0.2 -3H1.2L1.2 0.8L5.2 -3.4L6.4 -2.6L1.6 2.6L1.8 11Z M-11.4 -3.6C-11 -7.8 -5.4 -9.2 0 -9.2C5.4 -9.2 11 -7.8 11.4 -3.6C8 -1.8 -8 -1.8 -11.4 -3.6Z"},
    n1lava: {d: "M0 -11C3.6 -6 8 -2 8 3.4C8 8 4.4 11 0 11C-4.4 11 -8 8 -8 3.4C-8 -2 -3.6 -6 0 -11Z", detail: circ(-2.6, 3.2, 1.6) + circ(2.6, 3.2, 1.6), dfill: true}
  });

  /* ---- completion animations ---- */
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const hump = (f, a, b) => Math.sin(Math.PI * Math.max(0, Math.min(1, (f - a) / (b - a))));
  const fillP = (g, c, d) => { g.fillStyle = c; g.fill(new Path2D(d)); };
  const sheen = (g, dk, k = 1) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${0.34 * k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dk ? 0.26 : 0.2})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const scl = (W, H) => 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
  Object.assign(FX_SHAPES, {
    // a soft round puff of steam or smoke that fades to clear in its own color
    n1soft: {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, c); gr.addColorStop(0.5, c + "99"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }},
    // a blue morpho, seen from above
    n1morpho: {d: FX_SHAPES.butterfly.d, paint: (g, c, dk) => { const w = new Path2D(FX_SHAPES.butterfly.d); g.fillStyle = "#16182A"; g.fill(w); g.save(); g.clip(w);
      [[5.6, -4.4, 4.6, 3.4, -0.5], [4.2, 3.6, 3, 2.4, 0.5]].forEach(([x, y, rx, ry, a]) => [-1, 1].forEach(s => { const gr = g.createRadialGradient(s * x * 0.6, y, 0, s * x, y, rx * 1.2); gr.addColorStop(0, "#7FE4FF"); gr.addColorStop(0.5, c); gr.addColorStop(1, "#1A3AB8"); g.fillStyle = gr; g.beginPath(); g.ellipse(s * x, y, rx, ry, s * a, 0, 6.3); g.fill(); }));
      g.restore(); g.fillStyle = "rgba(255,255,255,.85)"; [[9, -6.6], [9.6, -4.2], [6.4, 6.6]].forEach(([x, y]) => [-1, 1].forEach(s => { g.beginPath(); g.arc(s * x, y, 0.6, 0, 6.3); g.fill(); })); g.fillStyle = "#16182A"; g.beginPath(); g.ellipse(0, 0.6, 0.9, 5.6, 0, 0, 6.3); g.fill(); }},
    // a shore crab from the front, claws up
    n1crab: {d: "M-7 0C-7 -4 -3.6 -5.6 0 -5.6C3.6 -5.6 7 -4 7 0C7 3.4 3.6 4.6 0 4.6C-3.6 4.6 -7 3.4 -7 0Z M-6 -2L-9.6 -6.6L-11 -10.4L-7.4 -9.6Z M6 -2L9.6 -6.6L11 -10.4L7.4 -9.6Z", paint: (g, c, dk) => { g.strokeStyle = c; g.lineWidth = 1.2; g.lineCap = "round"; [-1, 1].forEach(s => { [[1, 2.2], [2.4, 3.8], [3.4, 5.4]].forEach(([y, e]) => { g.beginPath(); g.moveTo(s * 5.6, y); g.lineTo(s * 9, y + 1); g.lineTo(s * 10.6, y + e); g.stroke(); }); g.beginPath(); g.moveTo(s * 5, -2.6); g.lineTo(s * 8.6, -6); g.stroke(); });
      g.fillStyle = c; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 7.6, -6.4); g.bezierCurveTo(s * 12.6, -6.6, s * 12.4, -11.6, s * 9.4, -11.4); g.lineTo(s * 9.6, -9); g.lineTo(s * 7.4, -10.2); g.closePath(); g.fill(); });
      g.beginPath(); g.ellipse(0, 0, 7, 5, 0, 0, 6.3); g.fill(); sheen(g, dk); g.strokeStyle = c; g.lineWidth = 0.9; [-2, 2].forEach(x => { g.beginPath(); g.moveTo(x, -4); g.lineTo(x, -7); g.stroke(); g.fillStyle = "#1A1A22"; g.beginPath(); g.arc(x, -7.4, 1.1, 0, 6.3); g.fill(); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x - 0.3, -7.8, 0.35, 0, 6.3); g.fill(); }); }},
    // a glowing lava bomb with a dark cracked crust
    n1bomb: {d: "M-8 0C-8 -5 -4 -8.6 0.6 -8.6C5.4 -8.6 8.6 -4.6 8.6 0.4C8.6 5 5 8.4 0 8.4C-5 8.4 -8 4.6 -8 0Z", paint: (g, c, dk) => { const gr = g.createRadialGradient(-1, -1, 0, 0, 0, 9); gr.addColorStop(0, "#FFF2A0"); gr.addColorStop(0.45, c); gr.addColorStop(1, "#B8301A"); g.fillStyle = gr; g.fill(new Path2D(FX_SHAPES.n1bomb.d));
      g.fillStyle = dk ? "#3A1A16" : "#4A2420"; g.fill(new Path2D("M-7.6 -1.6C-6 -6 -2 -8.4 1 -8.4L0 -5L-3 -4.6L-4.4 -1.4Z M2.6 -8.2C6 -7.4 8.4 -4 8.6 -0.6L5 0.4L4.4 -3.6Z M8.4 2C7.4 5.6 4 8.2 0.6 8.4L1.4 5L5 4.4Z M-1.6 8.2C-5 7.6 -7.6 5 -8 1.6L-4.6 2.2L-3.4 5.4Z")); }},
    n1yuzu2: {d: FX_SHAPES.n1yuzu.d, paint: (g, c, dk) => { g.fillStyle = c; g.beginPath(); g.arc(0, 1.6, 9, 0, 6.3); g.fill(); g.fillStyle = "rgba(200,130,20,.35)"; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(Math.cos(i * 2.4) * (2 + i * 0.45), 1.6 + Math.sin(i * 2.4) * (2 + i * 0.45), 0.35, 0, 6.3); g.fill(); } sheen(g, dk, 1.2); fillP(g, "#4E9A3A", "M0.6 -7.2C2.4 -11.8 7.6 -12.6 10.2 -10.2C8.2 -6.8 3.8 -6.2 0.6 -7.2Z"); }}
  });

  // Hot spring: maple leaves spin down through rising steam and land on the pool in little ripples; yuzu bob past
  let RIP = null;
  const ripDraw = (g, f, W, H, dk) => { if (!RIP) return; g.lineWidth = 1.6; RIP.forEach(r => { const t = (f - r.t) / 80; if (t <= 0 || t >= 1) return; const a = (1 - t) * (1 - t) * (dk ? 0.5 : 0.55); g.strokeStyle = dk ? `rgba(255,226,190,${a})` : `rgba(60,100,140,${a})`; [1, 0.6].forEach(k => { const rx = r.R * k * ease(Math.min(1, t * 1.4)); if (rx < 1) return; g.beginPath(); g.ellipse(r.x, r.y, rx, rx * 0.28, 0, 0, 6.3); g.stroke(); }); }); };

  // Rainforest: a warm shower sweeps through, then blue morphos flutter up past falling leaves
  let RAIN = null;
  const rainDraw = (g, f, W, H, dk) => { if (!RAIN) return; const a = ease(f / 20) * (1 - ease((f - 110) / 70)); if (a <= 0) return; g.strokeStyle = dk ? `rgba(190,240,230,${0.4 * a})` : `rgba(40,110,120,${0.36 * a})`; g.lineWidth = 1.4; g.lineCap = "round"; g.beginPath();
    RAIN.forEach(r => { const y = (r.y + f * r.v) % (H + 60) - 30, x = (r.x + f * r.v * 0.22) % (W + 40) - 20; g.moveTo(x, y); g.lineTo(x - r.l * 0.22, y - r.l); }); g.stroke(); };

  // Tide pools: a wave surges up the screen and pulls back, tossing sea stars and shells; crabs scuttle in
  const waveDraw = (g, f, W, H, dk) => { const h = hump(f, 0, 140); if (h <= 0.002) return; const lvl = H * (1 - 0.42 * h), yAt = x => lvl + Math.sin(x * 0.018 + f * 0.09) * 9 + Math.sin(x * 0.043 - f * 0.06) * 5;
    const gr = g.createLinearGradient(0, lvl - 20, 0, H); gr.addColorStop(0, dk ? "rgba(110,200,230,.28)" : "rgba(80,180,210,.32)"); gr.addColorStop(1, dk ? "rgba(60,140,190,.14)" : "rgba(60,160,200,.16)"); g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, yAt(x)); g.lineTo(W, H); g.fill();
    g.strokeStyle = `rgba(255,255,255,${dk ? 0.6 : 0.9})`; g.lineWidth = 4; g.lineJoin = "round"; g.beginPath(); for (let x = 0; x <= W + 20; x += 20) x ? g.lineTo(x, yAt(x)) : g.moveTo(x, yAt(x)); g.stroke();
    g.fillStyle = `rgba(255,255,255,${dk ? 0.5 : 0.8})`; for (let x = 7; x < W; x += 31) { const y = yAt(x) + 8 + (x * 7 % 13); g.beginPath(); g.arc(x, y, 1.6 + (x % 3), 0, 6.3); g.fill(); } };

  // Volcano: the vent glows and throws glowing lava bombs high, with a smoke plume and embers
  const ventDraw = (g, f, W, H, dk) => { const a = ease(f / 14) * (0.8 + 0.2 * Math.sin(f * 0.3)) * (1 - 0.5 * ease((f - 120) / 100)), R = Math.min(W, H) * 0.42, gr = g.createRadialGradient(W / 2, H, 0, W / 2, H, R); gr.addColorStop(0, `rgba(255,190,90,${(dk ? 0.6 : 0.5) * a})`); gr.addColorStop(0.4, `rgba(255,110,50,${(dk ? 0.3 : 0.22) * a})`); gr.addColorStop(1, "rgba(255,90,40,0)"); g.fillStyle = gr; g.fillRect(W / 2 - R, H - R, 2 * R, R); };

  // Savanna: a huge sun rises at the bottom while a flock of birds crosses the sky
  let FLOCK = null;
  const sunDraw = (g, f, W, H, dk) => { const R = Math.min(W, H) * 0.28, cx = W / 2, cy = H + R * 0.25 - ease(f / 130) * R * 0.85, gr = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.4);
    gr.addColorStop(0, dk ? "rgba(255,150,80,.35)" : "rgba(255,190,90,.45)"); gr.addColorStop(1, "rgba(255,160,80,0)"); g.fillStyle = gr; g.fillRect(cx - R * 2.4, cy - R * 2.4, R * 4.8, R * 4.8);
    const dg = g.createLinearGradient(0, cy - R, 0, cy + R); dg.addColorStop(0, dk ? "#FFC27A" : "#FFD27A"); dg.addColorStop(1, dk ? "#E8603A" : "#F28A3A"); g.globalAlpha = 0.9; g.fillStyle = dg; g.beginPath(); g.arc(cx, cy, R, 0, 6.3); g.fill(); g.globalAlpha = 1; };
  const birdsOver = (g, f, W, H, dk) => { if (!FLOCK) return; const u = Math.max(9, Math.min(W, H) * 0.022); g.strokeStyle = g.fillStyle = dk ? "#2A1424" : "#3A2412"; g.lineWidth = Math.max(1.6, u * 0.28); g.lineCap = g.lineJoin = "round";
    FLOCK.forEach(b => { const t = f - b.d; if (t < 0) return; const x = b.x + b.vx * t, y = b.y + Math.sin(t * 0.03 + b.ph) * u * 0.8 + b.vy * t, fl = Math.sin(t * b.fs + b.ph), w = u * b.s; g.beginPath(); g.moveTo(x - w * 1.3, y - fl * w * 0.7); g.quadraticCurveTo(x - w * 0.6, y - w * 0.45 - fl * w * 0.2, x, y); g.quadraticCurveTo(x + w * 0.6, y - w * 0.45 - fl * w * 0.2, x + w * 1.3, y - fl * w * 0.7); g.stroke(); g.beginPath(); g.ellipse(x + w * 0.1, y + w * 0.08, w * 0.35, w * 0.16, 0, 0, 6.3); g.fill(); }); };

  const FX = {
    onsen: {spawn: (W, H, d, n) => { RIP = Array.from({length: n(14)}, () => ({x: fxR(0.05, 0.95) * W, y: H * fxR(0.8, 0.97), R: fxR(30, 60) * scl(W, H) / 1.6, t: fxR(30, 190)}));
        return fxRise(W, H, n(20), "n1soft", d ? ["#E8E4FF"] : ["#FFFFFF"], {smin: 14, smax: 22, vmin: 0.7, vmax: 1.3, sway: 1.4, life: 240, grow: 0.3, alpha: d ? 0.16 : 0.6, spread: 120, depth: false})
          .concat(fxFall(W, H, n(44), "n1maple", d ? ["#F0606A", "#F29A4A", "#F2C45A"] : ["#E2402E", "#F27A2A", "#F2B83A", "#C8302A"], {vmin: 0.9, vmax: 1.6, sway: 1.8, flip: true, smin: 12, smax: 17}),
            Array.from({length: 4}, (_, i) => ({shape: "n1yuzu2", c: d ? "#FFD25A" : "#FFC21E", x: i % 2 ? W + 30 : -30, y: H * fxR(0.84, 0.95), vx: (i % 2 ? -1 : 1) * fxR(0.6, 1.1), vy: 0, g: 0, size: fxR(12, 15), rot: fxR(-0.3, 0.3), vr: 0, rock: 0.18, swf: 0.04, sway: 0, life: 330, delay: 20 + i * 25})));
      }, draw: ripDraw},
    rainforest: {spawn: (W, H, d, n) => { RAIN = Array.from({length: n(90)}, () => ({x: fxR(0, W + 40), y: fxR(0, H + 60), v: fxR(9, 14), l: fxR(12, 22)}));
        return fxFlutter(W, H, n(12), d ? ["#3FA8FF", "#4FC0FF"] : ["#1E8AF0", "#2F9CFF"]).map(p => Object.assign(p, {shape: "n1morpho", size: fxR(15, 21), delay: 40 + Math.floor(fxR(0, 90))}))
          .concat(fxFall(W, H, n(16), "n1monstera", d ? ["#2E7A5A", "#3E9A6A", "#5AB87A"] : ["#2B7A4E", "#4FAA60", "#3E8A50"], {sway: 2, flip: true, smin: 13, smax: 18, vmin: 1, vmax: 1.9, spread: 60}),
            d ? fxTw(W, H, n(26), "circle", ["#C8FF8A", "#9FFFE8"], {smin: 2, smax: 3.5, glow: 10, vy: -0.3, spread: 180}).map(p => Object.assign(p, {delay: p.delay + 60})) : []);
      }, draw: rainDraw},
    tidepool: {spawn: (W, H, d, n) => { const s = scl(W, H);
        return fxBurst(W, H, n(16), "starfish", d ? ["#FF9A5A", "#C88AF0", "#FFC84A"] : ["#F2783A", "#9E62CC", "#F2A83A", "#E8566C"], [[0.2, 1.02], [0.5, 1.04], [0.8, 1.02]], {smin: 12, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08), delay: p.delay + 40, vx: p.vx * 0.8, vy: p.vy * 0.85}))
          .concat(fxBurst(W, H, n(12), "shell", d ? ["#FFE4D0", "#F7C6D8", "#FFF2E0"] : ["#F6D0B8", "#F7B6C0", "#FFE6CC"], [[0.3, 1.02], [0.7, 1.02]], {smin: 11, smax: 14}).map(p => Object.assign(p, {delay: p.delay + 46, vx: p.vx * 0.8, vy: p.vy * 0.8})),
            Array.from({length: Math.max(3, Math.min(6, Math.round(W / 220)))}, (_, i) => { const lr = i % 2 === 0, sz = fxR(15, 19); return {shape: "n1crab", c: fxPick(d ? ["#FF7A5A", "#FF9A4A"] : ["#E2502E", "#F06A2A"]), x: lr ? -30 : W + 30, y: H - sz * s * 1.05 - fxR(0, 4), vx: (lr ? 1 : -1) * (W * fxR(0.0028, 0.004) + 0.6), vy: -fxR(1.5, 2.5), g: 0.3, bounce: true, size: sz, rot: 0, vr: 0, rock: 0.12, swf: 0.35, sway: 0, life: 300, delay: 60 + i * 22}; }),
            fxRise(W, H, n(26), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#CFEFF5"], {smin: 4, smax: 8, sway: 1, vmin: 1.4, vmax: 2.6, spread: 90}));
      }, draw: waveDraw},
    volcano: {spawn: (W, H, d, n) => Array.from({length: n(30)}, (_, i) => { const a = fxR(-0.45, 0.45), sp = H * fxR(0.022, 0.033); return {shape: "n1bomb", c: fxPick(["#FF8A2A", "#FF6A1E", "#FFA83A"]), x: W / 2 + fxR(-20, 20), y: H + 10, vx: Math.sin(a) * sp, vy: -Math.cos(a) * sp, g: 0.3, drag: 0.99, size: fxR(9, 14), rot: fxR(0, 6), vr: fxR(-0.1, 0.1), sway: 0, life: 200, delay: [0, 32, 64][i % 3] + Math.floor(fxR(0, 10)), glow: d ? 14 : 8}; })
        .concat(Array.from({length: n(60)}, () => ({shape: "circle", c: fxPick(["#FFB347", "#FF8A3A", "#FFE08A"]), x: W / 2 + fxR(-40, 40), y: H - fxR(0, 20), vx: fxR(-2.6, 2.6), vy: -fxR(4, 9), g: 0.07, drag: 0.985, size: fxR(1.8, 3.4), rot: 0, vr: 0, sway: 0.6, swf: 0.1, grow: -0.04, life: fxR(80, 140), delay: Math.floor(fxR(0, 120)), glow: 10})),
          fxRise(W, H, n(10), "n1soft", d ? ["#8A7A90"] : ["#E2C4B4"], {cx: [0.42, 0.58], smin: 12, smax: 17, vmin: 1.2, vmax: 2, sway: 1, grow: 0.2, alpha: d ? 0.2 : 0.14, life: 200, spread: 110, depth: false})),
      draw: ventDraw},
    savanna: {spawn: (W, H, d, n) => { const k = Math.max(7, Math.min(11, Math.round(W / 110))), u = Math.max(9, Math.min(W, H) * 0.022), vx = W * 0.0042 + 1.2, y0 = H * fxR(0.42, 0.52);
        FLOCK = Array.from({length: k}, (_, i) => { const r = Math.ceil(i / 2), s = i % 2 ? 1 : -1; return {x: -u * 3 - r * u * 3.2, y: y0 + s * r * u * 2.2, vx, vy: -0.08, d: 10 + r * 2, s: fxR(0.9, 1.15), fs: fxR(0.16, 0.22), ph: fxR(0, 6.3)}; });
        return fxRise(W, H, n(46), "circle", d ? ["#FFD08A", "#F6B87A"] : ["#E8A84A", "#D99040", "#F2C46A"], {smin: 2, smax: 4, vmin: 0.4, vmax: 1.1, sway: 1.4, life: 240, glow: d ? 10 : 6, spread: 120}).map(p => Object.assign(p, {y: H * fxR(0.55, 1)}))
          .concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFE3B0", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 4, smax: 7, glow: d ? 10 : 4, top: 0.8, spread: 160}));
      }, draw: sunDraw, over: birdsOver}
  };
  /* ---- end of completion animations ---- */

  MAJ_THEMES.push({
    skin: {id: "onsen", name: "Hot Spring", group: "ideas", desc: "A steaming rock pool under autumn maples, with lanterns and a little ryokan.",
      light: ["#EEF3F8", "rgba(78,110,142,.10)", "#FFFFFF", "#1C2A38", "#566676", "#D6E0EA", "#E4ECF3", "#F8FAFC", "#B8523A", "#CB7458", "#FFFFFF", "#7A2E1E", "#33506E", "#D2E2F0", "#FFE3B0"],
      dark: ["#14172E", "rgba(242,168,106,.08)", "#1C2040", "#F1EFFA", "#B4B2CE", "#2E3258", "#242849", "#171A34", "#F2A86A", "#F7C48E", "#1C1830", "#8A5A38", "#161A36", "#D4D4F0", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#BFD8EE,#E8F1F8 55%,#F6EEE6)", "linear-gradient(180deg,#1C2340,#3A3F6B 60%,#6B5A7A)"],
      spine: [lg("#4E6E8E", "#33506E"), lg("#2A2F57", "#161A36")], btn: [lg2("#B8523A", "#C96A40"), lg2("#F2A86A", "#F7C48E")]},
    kit: {motif: "n1yuzu", card: ["#F8FAFD", "#E4ECF4"], ink: "#1C2A38", bd: "#C6D6E6", mc: "#E0A02A", r: 16, notes: ["#E2ECF6"].concat(NOTES), shape: "cloud", pin: "magnet", fab: "999px", btn: "14px"},
    fx: FX.onsen,
    tag: "A steaming rock pool under red and gold maples, with a bamboo spout that tips and clacks, floating yuzu, stone lanterns, a vermilion torii, a little ryokan and a snow-capped peak"
  });
  MAJ_THEMES.push({
    skin: {id: "rainforest", name: "Rainforest Canopy", group: "ideas", desc: "Giant leaves, hanging vines and a distant waterfall, high in the treetops.",
      light: ["#EEF6EF", "rgba(47,122,85,.10)", "#FFFFFF", "#132A1E", "#4E6A58", "#CFE3D4", "#E0EFE3", "#F7FBF7", "#C2482E", "#D26A4A", "#FFFFFF", "#7A2A18", "#1C5238", "#CDE8D4", "#FFE3A0"],
      dark: ["#0A1E1C", "rgba(127,240,208,.07)", "#102A27", "#E6F6EE", "#9EC2B2", "#1E423C", "#173733", "#0D2421", "#7FF0D0", "#A8F5DE", "#0C201A", "#3E8A72", "#0A221E", "#BFE6D8", "#2E6A5A"],
      glow: ["linear-gradient(180deg,#9FD4B8,#D9F0C9 55%,#F3F7D8)", "linear-gradient(180deg,#0F2A2A,#174240 55%,#2D5C4E)"],
      spine: [lg("#2F7A55", "#1C5238"), lg("#14403A", "#0A221E")], btn: [lg2("#C2482E", "#D26A2E"), lg2("#7FF0D0", "#B8F59A")]},
    kit: {motif: "n1monstera", card: ["#F5FBF6", "#DDEFE2"], ink: "#132A1E", bd: "#B6D8C0", mc: "#2F8A55", r: 18, notes: ["#D3EBD9"].concat(NOTES), shape: "scallop", pin: "pin", fab: "24px 24px 24px 8px", btn: "12px"},
    fx: FX.rainforest,
    tag: "Giant leaves, swaying vines and a distant waterfall seen from the treetops, with a hopping toucan, tree frogs and glowing mushrooms at night"
  });
  MAJ_THEMES.push({
    skin: {id: "tidepool", name: "Tide Pools", group: "ideas", desc: "Colourful tide pools full of life below a lighthouse and sea stacks.",
      light: ["#EEF6F7", "rgba(47,122,142,.10)", "#FFFFFF", "#132B33", "#4E6870", "#D0E3E6", "#E1EFF1", "#F7FBFB", "#C2486E", "#D06A8A", "#FFFFFF", "#7A2244", "#1D5466", "#CDE6EC", "#FFE3B0"],
      dark: ["#0E1828", "rgba(127,224,240,.07)", "#152338", "#EAF2FA", "#A6B6CC", "#24364E", "#1C2C44", "#111D30", "#7FE0F0", "#A8EAF6", "#0E1A2E", "#3A8A9A", "#121F36", "#C6DAEC", "#2A5A6A"],
      glow: ["linear-gradient(180deg,#A8D8E8,#E6F3F2 55%,#E9DCC6)", "linear-gradient(180deg,#1A2B44,#2C4462 55%,#4A5A6E)"],
      spine: [lg("#2F7A8E", "#1D5466"), lg("#22385A", "#121F36")], btn: [lg2("#C2486E", "#D9685A"), lg2("#7FE0F0", "#B8A0FF")]},
    kit: {motif: "n1anem", card: ["#F5FBFB", "#DDEEF0"], ink: "#132B33", bd: "#B4D6DC", mc: "#C2486E", r: 20, notes: ["#D3EAEE"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "999px"},
    fx: FX.tidepool,
    tag: "Tide pools of every shape and color, with anemones, sea stars, urchins, snails, little fish and a crab, below a lighthouse, sea stacks and a passing sailboat"
  });
  MAJ_THEMES.push({
    skin: {id: "volcano", name: "Volcano Island", group: "ideas", desc: "A friendly little volcano on a tropical island with palms and black sand.",
      light: ["#FBF2EA", "rgba(184,86,58,.10)", "#FFFCF8", "#3A1C14", "#7A5A4C", "#EED8C8", "#F6E6DA", "#FFFAF5", "#1E8A8C", "#3EA2A0", "#FFFFFF", "#145A5C", "#7E3424", "#F4DCCB", "#FFE3A0"],
      dark: ["#1A0E1E", "rgba(255,154,90,.08)", "#26142A", "#FBEDEA", "#C8A8B0", "#3E2238", "#311B30", "#1F1024", "#FF9A5A", "#FFC07A", "#26142A", "#8A4A2A", "#160A18", "#E8C8D0", "#6A3A20"],
      glow: ["linear-gradient(180deg,#F7C9A0,#FBE6C8 50%,#BFE3D9)", "linear-gradient(180deg,#26142A,#4A1F33 55%,#8A3A35)"],
      spine: [lg("#B8563A", "#7E3424"), lg("#4A1F33", "#26142A")], btn: [lg2("#1E8A8C", "#2EA2A0"), lg2("#FF9A5A", "#FFC07A")]},
    kit: {motif: "n1hibiscus", card: ["#FFF8F2", "#F6E2D4"], ink: "#3A1C14", bd: "#EAC8B4", mc: "#E0533A", r: 14, notes: ["#F6DCCC"].concat(NOTES), shape: "folded", pin: "corners", fab: "22px 6px 22px 6px", btn: "10px"},
    fx: FX.volcano,
    tag: "A friendly volcano puffing over a tropical island, with swaying palms, black sand, steaming vents and glowing lava rivers at night"
  });
  MAJ_THEMES.push({
    skin: {id: "savanna", name: "Savanna Sunset", group: "ideas", desc: "Golden grassland, flat-topped acacias and a huge low sun.",
      light: ["#FBF4E6", "rgba(184,120,46,.10)", "#FFFDF7", "#3A2412", "#7A604A", "#EEDDC0", "#F6EAD2", "#FFFBF2", "#B8502A", "#CC7448", "#FFFFFF", "#6E2E14", "#7E4E1C", "#F4E0BC", "#FFE3A0"],
      dark: ["#1A1226", "rgba(242,166,106,.08)", "#241830", "#F8EEF2", "#C2AEC4", "#3A2846", "#2E203C", "#1E1428", "#F2A66A", "#F6C88A", "#24162E", "#8A5A38", "#2A1C3E", "#E2D0E2", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#F9D68B,#FBE9B9 55%,#E8D59A)", "linear-gradient(180deg,#2A1C3E,#5A2E4A 55%,#B4523E)"],
      spine: [lg("#B8782E", "#7E4E1C"), lg("#3E2446", "#2A1C3E")], btn: [lg2("#B8502A", "#D27A2A"), lg2("#F2A66A", "#F6C88A")]},
    kit: {motif: "n1acacia", card: ["#FFFAF0", "#F6E8CC"], ink: "#3A2412", bd: "#E8D0A4", mc: "#B8782E", r: 12, notes: ["#F4E2BC"].concat(NOTES), shape: "torn", pin: "tape", fab: "18px 18px 6px 18px", btn: "10px"},
    fx: FX.savanna,
    tag: "A huge low sun over golden grass, with flat-topped acacias, a munching giraffe, swallows over the watering hole and a baby elephant who loves a splash"
  });
})();
/* end of module 20-scenes-maj-n1.js */






