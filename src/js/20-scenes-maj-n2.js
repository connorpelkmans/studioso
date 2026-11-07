/* ===== module: 20-scenes-maj-n2.js ===== */
/* New theme ideas, batch n2 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const petals = (n, R, w, rr) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), q = [[rr, -w], [R * 0.7, -w * 1.1], [R, 0], [R * 0.7, w * 1.1], [rr, w]]; return pts(q.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c])); }).join("");
  Object.assign(FX_SHAPES, {
    n2shroom: {d: "M-10.5 -1.5C-10.5 -8.5 -5.5 -11 0 -11C5.5 -11 10.5 -8.5 10.5 -1.5C10.5 0.2 9 0.6 7 0.6H-7C-9 0.6 -10.5 0.2 -10.5 -1.5Z M-3.2 0.6H3.2L3.8 9.4C3.8 10.6 2.4 11 0 11C-2.4 11 -3.8 10.6 -3.8 9.4Z", detail: circ(-5, -4.5, 1.7) + circ(1, -7.6, 2) + circ(5.6, -3.2, 1.4) + circ(-1.4, -2.8, 1), dfill: true},
    n2spore: {d: circ(0, 0, 4.5) + circ(-6, 5, 2.2) + circ(6.5, -4, 2) + circ(4, 7, 1.4)},
    n2sunfl: {d: petals(12, 10.5, 2.4, 3) + circ(0, 0, 4.6), detail: circ(0, 0, 4.4), dfill: true},
    n2petal: {d: "M0 -10C3.6 -6 3.6 4 0 10C-3.6 4 -3.6 -6 0 -10Z", detail: "M0 -7V7", dstroke: true},
    n2ticket: {d: "M-11 -6H11V-2.2A2.2 2.2 0 0 0 11 2.2V6H-11V2.2A2.2 2.2 0 0 0 -11 -2.2Z", detail: circ(-5.5, 0, 1.4) + circ(0, 0, 1.4) + circ(5.5, 0, 1.4), dfill: true},
    n2steam: {d: "M-3 10C-8 4 2 0 -2 -4C-5 -7 -1 -10 1 -11C0 -8 4 -6 3 -2C1.5 3 -5 5 0.5 10Z"},
    n2naruto: {d: "M-10 0C-10 -6.5 -5 -10 0 -10C5 -10 10 -6.5 10 0C10 6.5 5 10 0 10C-5 10 -10 6.5 -10 0Z", detail: "M0 0C1 -1.5 3 -0.5 2.6 1.2C2 3.6 -1.6 3.8 -3 1.6C-4.8 -1.2 -2.4 -5 1.2 -4.8C5 -4.6 6.6 -0.6 5.6 2.6", dstroke: true},
    n2egg: {d: "M0 -10.5C6 -10.5 9.5 -4 9.5 1.5C9.5 7 5.5 10.5 0 10.5C-5.5 10.5 -9.5 7 -9.5 1.5C-9.5 -4 -6 -10.5 0 -10.5Z", detail: circ(0, 2, 5), dfill: true}
  });

  /* ---- completion animations ---- */
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const fillP = (g, c, d) => { g.fillStyle = c; g.fill(new Path2D(d)); };
  const sheen = (g, dk, k = 1) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${0.34 * k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dk ? 0.26 : 0.2})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const dots = (g, a, r) => { g.beginPath(); a.forEach(([x, y, k]) => { const rr = r * (k || 1); g.moveTo(x + rr, y); g.arc(x, y, rr, 0, 6.3); }); g.fill(); };
  const scl = (W, H) => 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
  const CAP = "M-10.5 -1C-10.5 -7.6 -5.6 -10.8 0 -10.8C5.6 -10.8 10.5 -7.6 10.5 -1C10.5 0.8 8.6 1.2 6.4 1.2H-6.4C-8.6 1.2 -10.5 0.8 -10.5 -1Z", STEM = "M-3.4 0.6H3.4C3.8 4 4.4 7 4.6 9.6C4.6 10.8 2.6 11.2 0 11.2C-2.6 11.2 -4.6 10.8 -4.6 9.6C-4.4 7 -3.8 4 -3.4 0.6Z";
  Object.assign(FX_SHAPES, {
    n2soft: {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, c); gr.addColorStop(0.5, c + "99"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }},
    // a toadstool for the fairy ring: cap in its color with pale spots, cream stem
    n2toad: {d: CAP + STEM, paint: (g, c, dk) => { fillP(g, dk ? "#E8E6F4" : "#F6EEDC", STEM); sheen(g, dk, 0.5); fillP(g, dk ? "#C8C4DC" : "#E2D2B4", "M-6.4 1.2H6.4L5.8 2.4H-5.8Z"); fillP(g, c, CAP); sheen(g, dk, 1.2); g.fillStyle = dk ? "rgba(240,255,255,.8)" : "#FFF8EE"; dots(g, [[-5.6, -4.6, 1.1], [0.4, -7.8, 1.3], [5.4, -4, 1], [-1.4, -3, 0.7], [7.6, -1.4, 0.6], [-8, -1.6, 0.6]], 1.6); }},
    // a sunflower head: two rings of petals round a seedy brown middle
    n2head: {d: FX_SHAPES.n2sunfl.d, paint: (g, c, dk) => { for (let L = 0; L < 2; L++) { g.fillStyle = L ? c : "#E89A10"; for (let i = 0; i < 13; i++) { g.save(); g.rotate((i + L * 0.5) / 13 * Math.PI * 2); g.beginPath(); g.ellipse(0, -7.2 + L * 0.6, 1.9, 4, 0, 0, 6.3); g.fill(); g.restore(); } }
      const gr = g.createRadialGradient(-1, -1, 0, 0, 0, 5); gr.addColorStop(0, "#8A5A2A"); gr.addColorStop(1, "#4A2A12"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 4.8, 0, 6.3); g.fill(); g.fillStyle = "rgba(255,210,120,.45)"; for (let i = 0; i < 18; i++) { const r = Math.sqrt(i / 18) * 4, a = i * 2.4; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 0.36, 0, 6.3); g.fill(); } }},
    // a bumblebee pointing to +x, wings up
    n2bee: {d: "M-7 1C-7 -3.4 -3 -5 1 -5C5 -5 8.4 -3 8.4 0.6C8.4 4 5 5.6 1 5.6C-3 5.6 -7 4.6 -7 1Z M-3 -4L-7 -10.4L-0.6 -5Z M1 -4.6L1.6 -11L4.6 -4.6Z", paint: (g, c, dk) => { g.fillStyle = dk ? "rgba(230,245,255,.7)" : "rgba(255,255,255,.85)"; g.strokeStyle = "rgba(60,80,110,.5)"; g.lineWidth = 0.5; [[-3.4, -7.4, 2.6, 4.6, -0.5], [1.6, -8, 2.2, 4, 0.15]].forEach(([x, y, rx, ry, a]) => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 6.3); g.fill(); g.stroke(); });
      const b = new Path2D("M-7 1C-7 -3.4 -3 -5 1 -5C5 -5 8.4 -3 8.4 0.6C8.4 4 5 5.6 1 5.6C-3 5.6 -7 4.6 -7 1Z"); g.fillStyle = "#FFC81E"; g.fill(b); g.save(); g.clip(b); g.fillStyle = "#2A2018"; [-5.4, -1.4, 2.6].forEach(x => g.fillRect(x, -6, 2, 12)); g.fillRect(6.4, -6, 4, 12); g.restore(); sheen(g, dk); fillP(g, "#2A2018", "M-7 0.4L-9.6 1L-7 1.8Z"); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(7.2, -1.4, 0.7, 0, 6.3); g.fill(); }},
    // ramen toppings
    n2nar: {d: FX_SHAPES.n2naruto.d, paint: (g, c, dk) => { g.fillStyle = "#FFFDF8"; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = i % 2 ? 9.2 : 10; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); sheen(g, dk, 0.6); g.strokeStyle = "#F0609A"; g.lineWidth = 1.6; g.lineCap = "round"; g.beginPath(); for (let t = 0; t < 4 * Math.PI; t += 0.2) { const r = 0.6 + t * 0.48; g.lineTo(Math.cos(t) * r, Math.sin(t) * r); } g.stroke(); }},
    n2egg2: {d: "M-10 0C-10 -6 -5 -8.6 0 -8.6C5 -8.6 10 -6 10 0C10 6 5 8.6 0 8.6C-5 8.6 -10 6 -10 0Z", paint: (g, c, dk) => { fillP(g, "#C88A4A", "M-10 0C-10 -6 -5 -8.6 0 -8.6C5 -8.6 10 -6 10 0C10 6 5 8.6 0 8.6C-5 8.6 -10 6 -10 0Z"); fillP(g, "#FFFAF0", "M-9 0C-9 -5.2 -4.6 -7.6 0 -7.6C4.6 -7.6 9 -5.2 9 0C9 5.2 4.6 7.6 0 7.6C-4.6 7.6 -9 5.2 -9 0Z"); const gr = g.createRadialGradient(0.6, 0, 0, 0.6, 0.6, 5); gr.addColorStop(0, "#FFB42A"); gr.addColorStop(1, "#F07A10"); g.fillStyle = gr; g.beginPath(); g.ellipse(0.6, 0.6, 4.8, 4.2, 0, 0, 6.3); g.fill(); sheen(g, dk, 0.8); }},
    n2nori: {d: "M-7 -10H7V10H-7Z", paint: (g, c, dk) => { fillP(g, dk ? "#2E4A36" : "#1E3424", "M-7 -10H7V10H-7Z"); g.strokeStyle = "rgba(140,200,150,.3)"; g.lineWidth = 0.5; for (let i = -9; i < 10; i += 2.4) { g.beginPath(); g.moveTo(-7, i); g.lineTo(7, i + 1.2); g.stroke(); } sheen(g, dk, 0.6); }},
    n2chashu: {d: "M-9.6 0A9.6 9 0 1 0 9.6 0A9.6 9 0 1 0 -9.6 0Z", paint: (g, c, dk) => { g.fillStyle = "#8A4A26"; g.beginPath(); g.ellipse(0, 0, 9.6, 9, 0, 0, 6.3); g.fill(); g.fillStyle = "#E8B890"; g.beginPath(); g.ellipse(0, 0, 8, 7.4, 0, 0, 6.3); g.fill(); g.fillStyle = "#C87A56"; g.beginPath(); g.ellipse(0.4, 0.4, 6.4, 5.6, 0.3, 0, 6.3); g.fill(); g.strokeStyle = "#F2D2B4"; g.lineWidth = 0.9; g.beginPath(); for (let t = 0; t < 3 * Math.PI; t += 0.25) { const r = 0.6 + t * 0.48; g.lineTo(Math.cos(t) * r, Math.sin(t) * r * 0.9); } g.stroke(); sheen(g, dk, 0.6); }},
    n2negi: {d: "M-6 0A6 6 0 1 0 6 0A6 6 0 1 0 -6 0Z M-3 0A3 3 0 1 1 3 0A3 3 0 1 1 -3 0Z", paint: (g, c, dk) => { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 4.5, 0, 6.3); g.stroke(); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, 3.2, 3.6, 5.4); g.stroke(); }}
  });

  // Mushroom glade: a fairy ring of toadstools pops up along the bottom one after another, each puffing glowing spores
  // Sunflowers: sunflower heads tumble up from the field while bumblebees buzz across and petals drift down
  // Night train: a little train with lit windows rolls along the bottom, puffing steam, under the stars
  const trainAt = (f, W, H) => { const th = Math.max(28, Math.min(66, Math.min(W, H) * 0.095)), L = th * 12.8, v = (W + L + 20) / 230; return {th, L, x: -10 + v * f, v}; };
  const trainDraw = (g, f, W, H, dk) => { const {th, L, x} = trainAt(f, W, H), base = H - th * 0.22, a = ease(f / 12); g.globalAlpha = a;
    g.strokeStyle = dk ? "rgba(200,190,230,.35)" : "rgba(60,60,90,.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, base + th * 0.16); g.lineTo(W, base + th * 0.16); g.stroke();
    const body = dk ? "#2A3256" : "#2E3A5A", roof = dk ? "#1A2040" : "#1E2640", win = "#FFD27A";
    if (dk) { const gr = g.createLinearGradient(x, 0, x + th * 6, 0); gr.addColorStop(0, "rgba(255,230,150,.35)"); gr.addColorStop(1, "rgba(255,230,150,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(x, base - th * 0.6); g.lineTo(x + th * 6, base - th * 1.6); g.lineTo(x + th * 6, base + th * 0.3); g.fill(); }
    for (let c = 0; c < 3; c++) { const x1 = x - th * 2.9 - c * th * 3.35, x0 = x1 - th * 3.2; g.fillStyle = roof; g.fillRect(x0 - th * 0.06, base - th * 1.08, th * 3.32, th * 0.16); g.fillStyle = body; g.fillRect(x0, base - th * 0.94, th * 3.2, th * 0.78); g.fillStyle = "#C8384A"; g.fillRect(x0, base - th * 0.3, th * 3.2, th * 0.07);
      for (let w = 0; w < 4; w++) { const wx = x0 + th * (0.25 + w * 0.75); if (dk) { g.fillStyle = "rgba(255,210,122,.25)"; g.fillRect(wx - th * 0.08, base - th * 0.8, th * 0.6, th * 0.44); } g.fillStyle = win; g.fillRect(wx, base - th * 0.74, th * 0.44, th * 0.32); }
      g.strokeStyle = roof; g.lineWidth = th * 0.1; g.beginPath(); g.moveTo(x1, base - th * 0.5); g.lineTo(x1 + th * 0.15, base - th * 0.5); g.stroke(); }
    g.fillStyle = body; g.beginPath(); g.moveTo(x - th * 2.7, base - th * 1.15); g.lineTo(x - th * 1.6, base - th * 1.15); g.lineTo(x - th * 1.6, base - th * 0.8); g.lineTo(x - th * 0.3, base - th * 0.8); g.quadraticCurveTo(x + th * 0.12, base - th * 0.6, x + th * 0.1, base - th * 0.16); g.lineTo(x - th * 2.7, base - th * 0.16); g.fill();
    g.fillStyle = roof; g.fillRect(x - th * 2.84, base - th * 1.26, th * 1.36, th * 0.14); g.fillRect(x - th * 0.95, base - th * 1.2, th * 0.3, th * 0.42); g.fillStyle = "#C8384A"; g.fillRect(x - th * 2.7, base - th * 0.3, th * 2.8, th * 0.07); g.fillStyle = win; g.fillRect(x - th * 2.45, base - th * 1, th * 0.5, th * 0.34); g.fillStyle = "#FFF2B0"; g.beginPath(); g.arc(x + th * 0.02, base - th * 0.42, th * 0.09, 0, 6.3); g.fill();
    g.fillStyle = dk ? "#0E1226" : "#1A1E30"; for (let k = 0; k < 15; k++) { const wx = x - th * 0.5 - k * th * 0.82; if (wx < x - L) break; g.beginPath(); g.arc(wx, base - th * 0.1, th * 0.17, 0, 6.3); g.fill(); } g.globalAlpha = 1; };
  // Ramen: a steaming bowl pops up and flings its toppings into the air
  const bowlAt = (f, W, H) => { const bw = Math.max(170, Math.min(440, Math.min(W, H) * 0.56)); return {bw, y: H - bw * 0.12 + (1 - ease(f / 18)) * bw * 0.6 + ease((f - 205) / 45) * bw * 0.6}; };
  const bowlDraw = (g, f, W, H, dk) => { const {bw, y} = bowlAt(f, W, H), cx = W / 2, r = bw / 2;
    g.fillStyle = "#C8302A"; g.beginPath(); g.moveTo(cx - r, y); g.bezierCurveTo(cx - r, y + r * 0.75, cx + r, y + r * 0.75, cx + r, y); g.fill();
    g.strokeStyle = "rgba(255,240,230,.85)"; g.lineWidth = Math.max(1.5, r * 0.025); g.beginPath(); for (let k = 0; k <= 16; k++) { const t = k / 16, xx = cx - r * 0.9 + t * r * 1.8, yy = y + r * 0.16 + (k % 2 ? r * 0.06 : 0) + Math.pow(t - 0.5, 2) * r * 0.1; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
    g.fillStyle = "#1E1418"; g.beginPath(); g.ellipse(cx, y, r, r * 0.17, 0, 0, 6.3); g.fill(); g.fillStyle = "#E8A85A"; g.beginPath(); g.ellipse(cx, y + r * 0.01, r * 0.92, r * 0.13, 0, 0, 6.3); g.fill();
    g.strokeStyle = "#F7D27A"; g.lineWidth = Math.max(1.5, r * 0.025); for (let k = 0; k < 5; k++) { g.beginPath(); for (let t = 0; t <= 1; t += 0.1) { const xx = cx - r * 0.7 + t * r * 1.4, yy = y + Math.sin(t * 18 + k * 2) * r * 0.025 + (k - 2) * r * 0.022; t ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } };

  const FX = {
    mushrooms: {spawn: (W, H, d, n) => { const s = scl(W, H), k = Math.max(5, Math.min(14, Math.round(W / 95))), caps = d ? ["#4FD6E8", "#7FA6FF", "#6FE8C0", "#B88AFF"] : ["#E2463A", "#E86A3A", "#C8503A", "#B87A4A"], out = [];
        for (let i = 0; i < k; i++) { const sz = fxR(18, 25) * (i % 3 === 1 ? 0.78 : 1), x = (i + 0.5 + fxR(-0.25, 0.25)) / k * W, rise = 23 * sz * s / 10, t = 8 + i * Math.floor(110 / k) + Math.floor(fxR(0, 6)), c = caps[i % caps.length];
          out.push({shape: "n2toad", c, x, y: H + 12 * sz * s / 10, vx: 0, vy: -rise * 0.12, g: 0, drag: 0.88, size: sz, rot: fxR(-0.12, 0.12), vr: 0, rock: 0.06, swf: 0.05, sway: 0, life: 330, delay: t, glow: d ? 10 : 0});
          for (let j = 0; j < 7; j++) out.push({shape: "circle", c: d ? fxPick(["#C8FFF4", "#B8D8FF", c]) : fxPick(["#F6D25A", "#FFE69A", "#F2B83A"]), x: x + fxR(-6, 6) * sz * s / 10, y: H - 16 * sz * s / 10, vx: fxR(-0.8, 0.8), vy: -fxR(0.8, 2), g: -0.004, drag: 0.995, size: fxR(1.8, 3.4), rot: 0, vr: 0, sway: fxR(0.6, 1.4), swf: fxR(0.04, 0.08), life: fxR(120, 180), delay: t + 16 + Math.floor(fxR(0, 14)), glow: d ? 12 : 8}); }
        return out.concat(fxFall(W, H, n(12), "leaf", d ? ["#3A8A74", "#2A6A5E"] : ["#7FB466", "#A2CF7C", "#5E9A4E"], {sway: 1.8, flip: true, smin: 9, smax: 13, vmin: 0.8, vmax: 1.4, spread: 80}));
      }},
    sunflowers: {spawn: (W, H, d, n) => fxBurst(W, H, n(12), "n2head", d ? ["#FFD24A", "#F6C030"] : ["#FFC81E", "#FFD23F"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 17, smax: 23}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)}))
        .concat(fxFall(W, H, n(40), "n2petal", d ? ["#F2D27A", "#FFE6A0", "#E6B84A"] : ["#FFD23F", "#FFC21F", "#F5A51A"], {sway: 1.6, flip: true, smin: 8, smax: 12, vmin: 1, vmax: 1.8, spread: 70}),
          Array.from({length: n(8)}, (_, i) => { const lr = i % 2 === 0; return {shape: "n2bee", c: "#FFC81E", x: lr ? -30 : W + 30, y: H * fxR(0.15, 0.75), vx: (lr ? 1 : -1) * (W * fxR(0.0035, 0.005) + 1), vy: fxR(-0.5, 0.5), g: 0, size: fxR(14, 18), face: true, wig: 0.22, rot: 0, vr: 0, sway: 0.4, swf: 0.2, life: 330, delay: 15 + Math.floor(fxR(0, 110))}; }),
          fxTw(W, H, n(18), "sparkle", d ? ["#FFF4C2", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 4, smax: 8, glow: d ? 10 : 4, spread: 160}))},
    nighttrain: {spawn: (W, H, d, n) => { const {th, v} = trainAt(0, W, H), base = H - th * 0.22;
        return Array.from({length: 34}, (_, i) => { const t = 4 + i * 6; return {shape: "n2soft", c: d ? "#E8E4F4" : "#FFFFFF", x: -10 + v * t - th * 0.8, y: base - th * 1.3, vx: -v * 0.25 + fxR(-0.3, 0.3), vy: -fxR(0.8, 1.4), g: 0, drag: 0.99, size: fxR(9, 12) * th / 40, grow: 0.35, rot: 0, vr: 0, sway: 0.5, swf: 0.05, alpha: d ? 0.24 : 0.85, life: 110, delay: t}; }).filter(p => p.delay < 200)
          .concat(d ? fxTw(W, H, n(46), "star", ["#FFFFFF", "#FFE7B0", "#C9D4FF"], {smin: 3, smax: 7, top: 0.65, glow: 10, spread: 170}) : fxTw(W, H, n(22), "sparkle", ["#F2B84A", "#E8706A", "#7FB8D8"], {smin: 4, smax: 8, top: 0.7, glow: 4, spread: 170}),
            d ? fxStreaks(W, H, n(4), ["#FFFFFF", "#FFE7B0"]) : []);
      }, draw: trainDraw},
    ramen: {spawn: (W, H, d, n) => { const {bw} = bowlAt(30, W, H), py = (H - bw * 0.12) / H, top = [["n2nar", ["#FFFFFF"], 8], ["n2egg2", ["#FFFFFF"], 6], ["n2nori", ["#1E3424"], 6], ["n2chashu", ["#C87A56"], 6], ["n2negi", ["#5AB84A", "#8AD06A"], 14]];
        return top.flatMap(([s, c, k]) => fxBurst(W, H, n(k), s, c, [[0.45, py], [0.55, py]], {smin: s === "n2negi" ? 8 : 14, smax: s === "n2negi" ? 11 : 19, flip: s === "n2nori"}).map(p => Object.assign(p, {vx: p.vx * 0.6, delay: 18 + Math.floor(fxR(0, 10)), vr: fxR(-0.1, 0.1)})))
          .concat(fxRise(W, H, n(14), "n2steam", d ? ["#F2E8F4"] : ["#FFFFFF"], {cx: [0.4, 0.6], smin: 14, smax: 20, vmin: 0.8, vmax: 1.4, sway: 1.4, alpha: d ? 0.45 : 0.9, life: 150, spread: 140, depth: false}).map(p => Object.assign(p, {y: H - bw * 0.2, rot: 0, rock: 0.2, delay: p.delay + 22})),
            fxTw(W, H, n(16), "sparkle", d ? ["#FFE7B0", "#FFFFFF"] : ["#F2B53A", "#E8505E"], {smin: 4, smax: 8, glow: d ? 10 : 4, top: 0.7, spread: 160}));
      }, draw: bowlDraw}
  };
  /* ---- end of completion animations ---- */

  MAJ_THEMES.push({
    skin: {id: "mushrooms", name: "Mushroom Hollow", group: "ideas", desc: "A mossy glade full of toadstools, ferns and drifting spores.",
      light: ["#F4F1E6", "rgba(184,67,47,.10)", "#FFFFFF", "#2A2418", "#6E6450", "#E3DCC8", "#EEE8D6", "#FBF9F2", "#B8432F", "#D2643C", "#FFFFFF", "#5A4430", "#4A3C28", "#E8DCC0", "#FFE7A0"],
      dark: ["#121A2E", "rgba(111,224,236,.08)", "#1A2440", "#ECF4FA", "#A6B6CC", "#2C3A58", "#222E4A", "#151E36", "#6FE0EC", "#9CC4FF", "#0E1A2A", "#2E5A78", "#0E1424", "#CFE6F0", "#2A5A68"],
      glow: ["linear-gradient(180deg,#CFE3C5,#EEF3DE 60%,#F2E6D8)", "linear-gradient(180deg,#141A2E,#22304A 60%,#3A3058)"],
      spine: [lg("#6E5A3E", "#4A3C28"), lg("#22304A", "#0E1424")], btn: [lg2("#B8432F", "#D2643C"), lg2("#6FE0EC", "#9CC4FF")]},
    kit: {motif: "n2shroom", card: ["#FBF8EE", "#EFE8D4"], ink: "#2A2418", bd: "#DCCFB0", mc: "#C8503A", r: 18, notes: ["#F6E3C8", "#FFF3B8", "#D9F0D8", "#FFD9D2", "#E6F0C8", "#EBD9FF"], shape: "scallop", pin: "pin", fab: "999px", btn: "999px"},
    fx: FX.mushrooms,
    tag: "A mossy glade of breathing toadstools, uncurling ferns and a fairy ring that plays like a xylophone"
  });
  MAJ_THEMES.push({
    skin: {id: "sunflowers", name: "Sunflower Field", group: "ideas", desc: "Rows of tall sunflowers rolling toward a red barn.",
      light: ["#FBF7E8", "rgba(194,86,26,.10)", "#FFFFFF", "#2A2410", "#6A6248", "#EAE2C2", "#F3EDD4", "#FDFBF2", "#C2561A", "#E08A1A", "#FFFFFF", "#4A5A22", "#33531C", "#E2EBC8", "#FFE27A"],
      dark: ["#161838", "rgba(246,200,74,.08)", "#1E2148", "#F6F2E4", "#BAB4CC", "#30335E", "#262A54", "#191C40", "#F6C84A", "#FFE08A", "#1E1A0A", "#6A5A2A", "#10122C", "#E6E0C8", "#5A4A1A"],
      glow: ["linear-gradient(180deg,#9ED0F0,#D6ECF8 60%,#F8E7A6)", "linear-gradient(180deg,#1B2246,#2F2F5E 60%,#4C3E5A)"],
      spine: [lg("#4E7A2E", "#33531C"), lg("#2F2F5E", "#10122C")], btn: [lg2("#C2561A", "#E08A1A"), lg2("#F6C84A", "#FFE08A")]},
    kit: {motif: "n2sunfl", card: ["#FFFBEA", "#F6EBC4"], ink: "#2A2410", bd: "#EAD48A", mc: "#E0A21A", r: 16, notes: ["#FFF0B0", "#FFE0B8", "#E2F0C0", "#D6E6FF", "#FFD9C8", "#F2E2FF"], shape: "rounded", pin: "tape", fab: "999px", btn: "12px"},
    fx: FX.sunflowers,
    tag: "Sunflowers that follow the sun across the sky toward a red barn, with bees, hay bales and a dirt road"
  });
  MAJ_THEMES.push({
    skin: {id: "nighttrain", name: "Night Train", group: "ideas", desc: "A cozy train compartment with velvet seats facing each other, hills and towns sliding past the window.",
      light: ["#F8F2E8", "rgba(184,72,76,.10)", "#FFFFFF", "#2E2018", "#6E5E50", "#E8DCCB", "#F1E8DA", "#FCF9F4", "#B8484C", "#D06A4A", "#FFFFFF", "#5A3A2A", "#55331F", "#EAD8C4", "#FFE2A8"],
      dark: ["#1C1628", "rgba(255,194,122,.08)", "#261E34", "#F4EEF8", "#BDB0CC", "#3A2E48", "#30263E", "#211A2E", "#FFC27A", "#FFD9A0", "#2A1A0A", "#6A4A3A", "#140F1C", "#E6DCEC", "#5A3E22"],
      glow: ["linear-gradient(180deg,#B9D7EA,#EAF2EE 60%,#E7D2B8)", "linear-gradient(180deg,#141C33,#25304E 60%,#5B4A6A)"],
      spine: [lg("#7A4C30", "#55331F"), lg("#3A2C46", "#140F1C")], btn: [lg2("#B8484C", "#D06A4A"), lg2("#FFC27A", "#FFD9A0")]},
    kit: {motif: "n2ticket", card: ["#FCF7EE", "#F0E4D0"], ink: "#2E2018", bd: "#DCC8A8", mc: "#B8484C", r: 10, notes: ["#F6E6CC", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "gold", fab: "14px", btn: "10px"},
    fx: FX.nighttrain,
    tag: "A train compartment with velvet seats, luggage on the brass rack, a swaying table lamp and the countryside rushing past the window"
  });
  MAJ_THEMES.push({
    skin: {id: "ramen", name: "Ramen Shop", group: "ideas", desc: "A late-night ramen counter with noren curtains and rain on the window.",
      light: ["#FBF3EA", "rgba(200,52,58,.10)", "#FFFFFF", "#2E1E16", "#6E5A4E", "#EDDCCC", "#F4E8DC", "#FDF9F4", "#C8343A", "#E0603A", "#FFFFFF", "#6A2A22", "#5E241C", "#F0D6C8", "#FFE2A0"],
      dark: ["#1E1620", "rgba(255,138,122,.08)", "#2A1E28", "#F8EEF0", "#C8B0B8", "#3E2C38", "#342630", "#241A24", "#FF8A7A", "#FFB08A", "#2A0E0A", "#6A3A3A", "#160F16", "#ECDCE0", "#5E2E22"],
      glow: ["linear-gradient(180deg,#F1DCC3,#F8EBDA 60%,#E7C9A8)", "linear-gradient(180deg,#1E1A2A,#3B2734 60%,#7A3E3A)"],
      spine: [lg("#8A3A2E", "#5E241C"), lg("#3B2734", "#160F16")], btn: [lg2("#C8343A", "#E0603A"), lg2("#FF8A7A", "#FFB08A")]},
    kit: {motif: "n2naruto", card: ["#FFFAF2", "#F4E6D4"], ink: "#2E1E16", bd: "#E6CBB0", mc: "#D2464E", r: 14, notes: ["#FFE8C8", "#FFF3B8", "#E2F0D0", "#FFD9D8", "#F2E2FF", "#D6E6FF"], shape: "folded", pin: "pin", fab: "16px", btn: "12px"},
    fx: FX.ramen,
    tag: "A cozy ramen counter on a rainy night, with a cheerful chef, a simmering pot, noren curtains and a lucky cat"
  });
})();
/* end of module 20-scenes-maj-n2.js */






