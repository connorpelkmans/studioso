/* ===== module: 20-scenes-maj-m4.js ===== */
/* Study Fields themes, batch m4 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // golden rectangle cut into Fibonacci squares, biggest first; each square carries a quarter arc of the spiral.
  // Returns squares [x, y, side, arc center x, arc center y, start angle] and the spiral's inner end point
  const mtRect = (W, H) => { const ph = 1.618, tall = H > W; let w = Math.min(W * 0.86, H * 0.8 * (tall ? 1 / ph : ph)), h = tall ? w * ph : w / ph; if (h > H * 0.8) { h = H * 0.8; w = tall ? h / ph : h * ph; }
    let x = (W - w) / 2, y = (H - h) / 2 + H * 0.04; const sq = []; let ex = 0, ey = 0;
    for (let i = 0; i < 9; i++) { const k = (i + (tall ? 1 : 0)) % 4;
      if (k === 0) { const s = h; sq.push([x, y, s, x + s, y + s, Math.PI]); x += s; w -= s; ex = x; ey = y; }
      else if (k === 1) { const s = w; sq.push([x, y, s, x, y + s, -Math.PI / 2]); y += s; h -= s; ex = x + s; ey = y; }
      else if (k === 2) { const s = h; sq.push([x + w - s, y, s, x + w - s, y, 0]); w -= s; ex = x + w; ey = y + s; }
      else { const s = w; sq.push([x, y + h - s, s, x + s, y + h - s, Math.PI / 2]); h -= s; ex = x; ey = y + h; } }
    return {sq, ex, ey}; };

  /* Concert Hall (Music) */
  MAJ_THEMES.push({
    skin: {id: "concert", name: "Concert Hall",
      light: ["#F7EFE6", "rgba(168,48,62,.10)", "#FFFCF8", "#2E1418", "#74585A", "#EBDCD0", "#F3E6DC", "#FDF9F5", "#A8303E", "#C05A64", "#FFFFFF", "#6E1C28", "#6E1C28", "#F2D6D8", "#F5D9A0"],
      dark: ["#170B12", "rgba(240,194,122,.08)", "#22121B", "#F8ECEC", "#C8A8AE", "#3E2430", "#2E1824", "#1B0E15", "#F0C27A", "#F5D49A", "#2A1208", "#8A5A36", "#1C0A10", "#F2D6D8", "#6E4A26"],
      glow: ["linear-gradient(180deg,#EAD3BE,#F1DFCB 50%,#E6C9AE)", "linear-gradient(180deg,#140A16,#22101E 45%,#2E1520)"],
      spine: [lg("#9A2C3A", "#6E1C28"), lg("#3A1420", "#1C0A10")], btn: [lg2("#A8303E", "#B8562E"), lg2("#F0C27A", "#F5D49A")]},
    kit: {motif: "note", card: ["#FFFAF5", "#F5E4DC"], ink: "#2E1418", bd: "#E6C8C4", mc: "#A8303E", r: 14, notes: ["#F2D6D8"].concat(NOTES), shape: "lined", pin: "gold", fab: "999px", btn: "12px"},
    shapes: {
      // a long-stemmed rose thrown to the stage, bloom up
      cn_rose: {d: "M-1 -4.6C-5.6 -5 -6.6 -9.4 -3.4 -10.6C-1.6 -11.4 0.4 -10.6 1 -9.6C2.4 -11 5.6 -10.4 5.6 -7.6C5.6 -5.4 3.2 -4.4 1 -4.4L0.8 10.6H-0.6Z", paint: (g, col, dk) => {
        g.strokeStyle = "#3E8A4A"; g.lineWidth = 1.3; g.lineCap = "round"; g.beginPath(); g.moveTo(0.2, -4); g.quadraticCurveTo(-0.8, 3, 0.4, 11); g.stroke();
        g.fillStyle = "#4FA25A"; g.beginPath(); g.ellipse(-2.6, 3.4, 2.8, 1.2, 0.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(2.8, 6.2, 2.6, 1.1, -0.6, 0, 7); g.fill();
        g.fillStyle = "#3E8A4A"; g.beginPath(); g.moveTo(-3.6, -5); g.lineTo(0.2, -3); g.lineTo(3.8, -5); g.lineTo(0.2, -5.8); g.fill();
        g.fillStyle = fxShade(col, 0.78); g.beginPath(); g.arc(0.2, -8, 4.8, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(-1, -8.6, 3.6, 0, 7); g.arc(1.8, -8.4, 3.2, 0, 7); g.fill();
        g.strokeStyle = fxShade(col, 0.6); g.lineWidth = 0.8; g.beginPath(); g.arc(0.2, -8.6, 1.6, 0.5, 5.4); g.stroke(); g.beginPath(); g.arc(0.2, -8.4, 3.2, 3.6, 5.6); g.stroke(); }}
    },
    // stage spotlights sweep across the hall while roses are thrown up from the crowd and notes drift up into the light
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(16), "cn_rose", d ? ["#FF4F6E", "#FF7A9A", "#E0304E"] : ["#D8243E", "#E8455E", "#C01A36"], [[0.08, 1.02], [0.92, 1.02], [0.3, 1.04], [0.7, 1.04]], {smin: 17, smax: 21, g: 0.26}).map(p => Object.assign(p, {vr: fxR(-0.12, 0.12), delay: 24 + Math.floor(fxR(0, 50))}))
      .concat(fxRise(W, H, n(22), "note", d ? ["#FFD27A", "#FF9CC8", "#8FE0FF", "#C8A8FF"] : ["#A8303E", "#C9862A", "#6A4FC9"], {smin: 10, smax: 14, sway: 1.6, vmin: 1.4, vmax: 2.4, spread: 80, glow: d ? 8 : 0}),
        fxTw(W, H, n(18), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8A93A", "#F2C24A"], {smin: 3, smax: 7, top: 0.6, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 30) * (1 - fxEase((f - 170) / 70)); if (a <= 0.01) return;
        if (d) g.globalCompositeOperation = "lighter";
        [[0.12, "255,214,140", 0, 1], [0.5, "255,170,200", 1.7, -1], [0.88, "170,210,255", 3.1, 1]].forEach(([x0, rgb, ph, dir]) => {
          const ang = dir * 0.42 * Math.sin(f * 0.022 + ph) + (0.5 - x0) * 0.9, L = Math.hypot(W, H) * 1.05, sp = 0.13, X = x0 * W, Y = -20;
          const ex = X + Math.sin(ang) * L, ey = Y + Math.cos(ang) * L, gr = g.createLinearGradient(X, Y, ex, ey); gr.addColorStop(0, `rgba(${rgb},${d ? 0.34 : 0.4})`); gr.addColorStop(0.7, `rgba(${rgb},${d ? 0.1 : 0.14})`); gr.addColorStop(1, `rgba(${rgb},0)`);
          g.globalAlpha = a * (d ? 0.6 : 0.55); g.fillStyle = gr; g.beginPath(); g.moveTo(X - 6, Y); g.lineTo(X + Math.sin(ang - sp) * L, Y + Math.cos(ang - sp) * L); g.lineTo(X + Math.sin(ang + sp) * L, Y + Math.cos(ang + sp) * L); g.lineTo(X + 6, Y); g.fill(); }); }},
    tag: "A concert hall where a conductor leads the show under rainbow stage lights, fairy lights and a twirling mirror ball"
  });

  /* Track and Field (Kinesiology) */
  MAJ_THEMES.push({
    skin: {id: "track", name: "Track and Field",
      light: ["#FBF2E8", "rgba(178,74,42,.10)", "#FFFCF7", "#2E1E16", "#76604E", "#EEDCCB", "#F5E8DA", "#FFFBF5", "#B24A2A", "#C8704E", "#FFFFFF", "#6E2C16", "#8E3E26", "#F6D8C8", "#FFE0A0"],
      dark: ["#0E1228", "rgba(242,182,90,.08)", "#171C36", "#EEF0FA", "#A9AECB", "#2C3254", "#222844", "#121730", "#F2B65A", "#F6CF86", "#1A1408", "#8A6A38", "#0E1228", "#D6DAF0", "#6A5226"],
      glow: ["linear-gradient(180deg,#8CBEDF,#F4D9AE 30%,#F5B57C)", "linear-gradient(180deg,#0A1230,#1A2350 30%,#33335E)"],
      spine: [lg("#C8603E", "#8E3E26"), lg("#22284A", "#0E1228")], btn: [lg2("#B24A2A", "#D07A2A"), lg2("#F2B65A", "#F6CF86")]},
    kit: {motif: "sneaker", card: ["#FFFAF4", "#F6E6D6"], ink: "#2E1E16", bd: "#EBCBB4", mc: "#D96E48", r: 12, notes: ["#F6D8C8"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "10px"},
    shapes: {
      sneaker: {d: "M-10.5 4.5C-10.8 1.5 -10 -2.6 -8 -4.4C-6.6 -5.6 -4.4 -5.4 -3.4 -3.8C-2 -1.6 1 -0.6 4 -0.2C7.6 0.3 10.6 1.6 10.8 4.5C10.9 6.2 9.8 7 8.4 7H-9C-10 7 -10.5 6 -10.5 4.5Z", detail: "M-10.4 4.6H10.8M-5.4 -2.6L-3.2 -4.6M-3.4 -0.8L-1 -2.8M-1.2 0.6L1.2 -1.2", dstroke: true},
      trophy: {d: "M-7 -10H7V-4C7 0 4 3 1.4 3.6V6H4.4V9.6H-4.4V6H-1.4V3.6C-4 3 -7 0 -7 -4Z M6.6 -8.6H10.4C10.4 -4 9 -2 6.2 -1.2L6.6 -2.8C8.2 -3.4 8.8 -5 8.8 -7H6.6Z M-6.6 -8.6H-10.4C-10.4 -4 -9 -2 -6.2 -1.2L-6.6 -2.8C-8.2 -3.4 -8.8 -5 -8.8 -7H-6.6Z", detail: "M-3 -6.4L3 -6.4", dstroke: true},
      whistle: {d: "M-10 1a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0 -11.2 0Z M-1.6 -4.6H10.6V0.4H-1.6Z", detail: "M-6.2 1a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0Z", dfill: true},
      bball: {d: "M-9.6 0a9.6 9.6 0 1 0 19.2 0a9.6 9.6 0 1 0 -19.2 0Z", detail: "M-9.6 0H9.6M0 -9.6V9.6M-6.8 -6.8C-3.2 -3 -3.2 3 -6.8 6.8M6.8 -6.8C3.2 -3 3.2 3 6.8 6.8", dstroke: true},
      medal: {d: "M-4.6 -11H-1.2L1.6 -3.4H-1.6Z M4.6 -11H1.2L-1.6 -3.4H1.6Z M-6.4 3.2a6.4 6.4 0 1 0 12.8 0a6.4 6.4 0 1 0 -12.8 0Z", detail: "M-3.8 3.2a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0 -7.6 0", dstroke: true},
      // a medal on a striped ribbon: the disc takes the color (gold, silver, bronze)
      tk_medal: {d: "M-4.6 -11H-1.2L1.6 -3.4H-1.6Z M4.6 -11H1.2L-1.6 -3.4H1.6Z M-6.4 3.2a6.4 6.4 0 1 0 12.8 0a6.4 6.4 0 1 0 -12.8 0Z", paint: (g, col) => {
        g.fillStyle = "#2F64C0"; g.beginPath(); g.moveTo(-6, -11.4); g.lineTo(-1.8, -11.4); g.lineTo(1.4, -2.6); g.lineTo(-2.4, -2.6); g.fill(); g.fillStyle = "#E0504A"; g.beginPath(); g.moveTo(6, -11.4); g.lineTo(1.8, -11.4); g.lineTo(-1.4, -2.6); g.lineTo(2.4, -2.6); g.fill();
        g.fillStyle = fxShade(col, 0.82); g.beginPath(); g.arc(0, 3.6, 7, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(-0.3, 3.3, 5.8, 0, 7); g.fill();
        g.fillStyle = fxShade(col, 0.7); g.fill(new Path2D("M-0.3 -0.4L0.8 2L3.4 2.2L1.4 3.9L2.1 6.4L-0.3 5L-2.7 6.4L-2 3.9L-4 2.2L-1.4 2Z")); g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(-2.8, 0.8, 1.6, 0.8, -0.7, 0, 7); g.fill(); }}
    },

    // the finish tape stretches, snaps in the middle and the two ends whip away; confetti bursts from the break and medals spin down
    fx: {spawn: (W, H, d, n) => { const y = H * 0.6 / H; return fxBurst(W, H, n(60), "confetti", ["#E0504A", "#3E74D0", "#F2C230", d ? "#FFFFFF" : "#2E9E6A"], [[0.5, y]], {smin: 6, smax: 9, flip: true, g: 0.14}).map(p => { const an = fxR(0, 6.3), sp = fxR(3, 10); return Object.assign(p, {vx: Math.cos(an) * sp * 1.2, vy: Math.sin(an) * sp - 3, delay: 28 + Math.floor(fxR(0, 6))}); })
      .concat(fxFall(W, H, n(10), "tk_medal", ["#F2C24A", "#F6CE5A", "#C9CED6", "#D08A4A"], {smin: 13, smax: 17, vmin: 1.4, vmax: 2.2, rock: 0.5, sway: 1, spread: 50}).map(p => Object.assign(p, {delay: p.delay + 40})),
        fxTw(W, H, n(14), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 7, glow: d ? 10 : 4})); },
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 6) * (1 - fxEase((f - 170) / 60)); if (a <= 0.01) return;
        const y = H * 0.6, tb = 28, lw = Math.max(6, Math.min(W, H) * 0.012); g.lineCap = "round";
        const band = (pts) => { [[d ? "#FF6A5E" : "#E0443C", lw], ["rgba(255,255,255,.5)", lw * 0.28]].forEach(([c, w], j) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([x, yy], i) => { const o = j ? -lw * 0.2 : 0; i ? g.lineTo(x, yy + o) : g.moveTo(x, yy + o); }); g.stroke(); }); };
        g.globalAlpha = a; g.fillStyle = d ? "#D8DEE8" : "#5E6878"; [[W * 0.04], [W * 0.96]].forEach(([x]) => { g.fillRect(x - 3, y - lw * 2, 6, H - y + lw * 2); g.beginPath(); g.arc(x, y - lw * 2, 5, 0, 7); g.fill(); });
        if (f < tb) { const push = fxEase(f / tb) * H * 0.05, pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, x = W * (0.04 + 0.92 * u); pts.push([x, y - push * Math.exp(-Math.pow((u - 0.5) * 6, 2))]); } band(pts); return; }
        // after the snap each half is a whip: anchored at its post, the free end swings out and down and settles
        const t = f - tb; [-1, 1].forEach(s => { const ax = s < 0 ? W * 0.04 : W * 0.96, half = W * 0.46, sw = Math.exp(-t / 36), ang = Math.min(1.5, (1 - sw * Math.cos(t / 10)) * 1.3), pts = [];
          for (let i = 0; i <= 24; i++) { const u = i / 24, r = half * u, bend = Math.sin(u * Math.PI) * half * 0.08 * Math.sin(t / 10) * sw, wv = Math.sin(t * 0.35 - u * 7) * 5 * u * sw; pts.push([ax - s * Math.cos(ang) * r + Math.sin(ang) * (bend + wv) * -s, y + Math.sin(ang) * r + Math.cos(ang) * (bend + wv)]); } band(pts); });
        if (t < 30) { g.globalAlpha = a * 0.5 * (1 - t / 30); g.strokeStyle = d ? "#FFE3A8" : "#F2B53A"; g.lineWidth = 2.5; for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + 0.2, r0 = 10 + t * 2.4; g.beginPath(); g.moveTo(W / 2 + Math.cos(an) * r0, y + Math.sin(an) * r0); g.lineTo(W / 2 + Math.cos(an) * (r0 + 16), y + Math.sin(an) * (r0 + 16)); g.stroke(); } } }},
    tag: "A golden-hour stadium with a running track, a marked football and soccer field, a high jump and a big scoreboard"
  });

  /* Infinite Grid (Mathematics) */
  MAJ_THEMES.push({
    skin: {id: "math", name: "Infinite Grid",
      light: ["#F6F1FB", "rgba(106,79,192,.10)", "#FFFFFF", "#241A3E", "#675C80", "#E2D9F2", "#EDE6F7", "#FBF9FE", "#6A4FC0", "#8C76D0", "#FFFFFF", "#44308A", "#4E3C8E", "#DED2F6", "#FFE3A8"],
      dark: ["#0E0B26", "rgba(127,223,255,.08)", "#17133A", "#F0ECFF", "#AEA6D2", "#2C2758", "#211C48", "#120F2E", "#7FDFFF", "#A6E9FF", "#0E0A28", "#3A6E8A", "#100C2C", "#D8D0FF", "#2A5A6A"],
      glow: ["linear-gradient(180deg,#C4B2EE,#EACAEA 37%,#FCE3D2 60%,#E4D0EC)", "linear-gradient(180deg,#0D0A2C,#1E174C 37%,#43216A 60%,#0B0820)"],
      spine: [lg("#7A62C0", "#4E3C8E"), lg("#2A2160", "#100C2C")], btn: [lg2("#6A4FC0", "#C0568E"), lg2("#7FDFFF", "#D59CFF")]},
    kit: {motif: "spiral", card: ["#FCFAFF", "#ECE4FA"], ink: "#241A3E", bd: "#D6CAF0", mc: "#6A4FC0", r: 10, notes: ["#E6DCFA"].concat(NOTES), shape: "gridnote", pin: "corners", fab: "14px", btn: "10px"},
    shapes: {
      spiral: {d: "M0.6 -0.4A1.1 1.1 0 0 0 -1.4 0.6A2.6 2.6 0 0 0 2.4 2A4.4 4.4 0 0 0 0.4 -5.6A7.2 7.2 0 0 0 -7.4 2.6A10.6 10.6 0 0 0 6.6 9.6", stroke: true, lw: 1.8},
      cube3: {d: "M0 -10L8.7 -5V5L0 10L-8.7 5V-5Z", detail: "M-8.7 -5L0 0L8.7 -5M0 0V10", dstroke: true},
      pisym: {d: "M-9 -6.6C-4 -8.4 4 -8.6 9.4 -7.4L9 -4.6C7.6 -4.9 5.8 -5 4.4 -5C4.2 -1 4.2 4 6.8 6.6C7.6 7.4 8.6 7.2 9.2 6.4L10 7.6C8.8 9.6 5.8 10.2 4 8.4C1.4 5.6 1.4 0 1.8 -5.1L-2.6 -5C-2.8 0 -3.6 5.6 -5.8 9.2L-8.6 8.4C-6.2 4.6 -5.6 0 -5.4 -4.9C-6.8 -4.8 -8 -4.6 -9.4 -4.2Z"},
      // candy-colored solids that tumble: triangle, hexagon, square, circle
      mt_tri: {d: "M0 -10L9.6 7.4H-9.6Z", detail: "M0 -5.6L5.6 4.6H-5.6Z", dstroke: true},
      mt_hex: {d: "M0 -10.4L9 -5.2V5.2L0 10.4L-9 5.2V-5.2Z", detail: "M0 -6.2L5.4 -3.1V3.1L0 6.2L-5.4 3.1V-3.1Z", dstroke: true},
      mt_sq: {d: "M-8.4 -8.4H8.4V8.4H-8.4Z", detail: "M-4.8 -4.8H4.8V4.8H-4.8Z", dstroke: true}
    },

    // a golden spiral draws itself through a growing set of Fibonacci squares, then candy-colored shapes tumble out of it
    fx: {spawn: (W, H, d, n) => { const R = mtRect(W, H), cols = d ? ["#FF8AC8", "#6FF0D0", "#FFD86A", "#8AC4FF", "#C8A8FF"] : ["#E8588E", "#2EB894", "#E8A420", "#4A8EE8", "#8A66E0"];
      return fxBurst(W, H, n(36), "mt_tri", cols, [[R.ex / W, R.ey / H]], {smin: 9, smax: 13, g: 0.16, flip: true}).map((p, i) => Object.assign(p, {shape: ["mt_tri", "mt_hex", "mt_sq", "circle"][i % 4], size: i % 4 === 3 ? fxR(6, 8) : p.size, ...(an => ({vx: Math.cos(an) * fxR(3, 9), vy: Math.sin(an) * fxR(3, 8) - 3}))(fxR(0, 6.3)), term: 4, delay: 92 + Math.floor(fxR(0, 14)), life: 170}))
        .concat(fxRise(W, H, n(10), "pisym", d ? ["#FFE3A0", "#FF9AD0", "#8AF0E0"] : ["#6A4FC0", "#E8588E", "#2EB894"], {smin: 10, smax: 14, sway: 1.2, vmin: 1.2, vmax: 2, spread: 70}),
          fxTw(W, H, n(16), "sparkle", d ? ["#FFE9B0", "#A6E9FF"] : ["#E8A93A", "#B9A2F0"], {smin: 3, smax: 6, glow: d ? 10 : 4})); },
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 8) * (1 - fxEase((f - 175) / 60)); if (a <= 0.01) return;
        const R = mtRect(W, H); g.lineCap = g.lineJoin = "round";
        R.sq.forEach(([x, y, s, cx, cy, a0], i) => { const t0 = i * 9, p = fxEase((f - t0) / 14); if (p <= 0) return;
          g.globalAlpha = a * p * (d ? 0.4 : 0.32); g.strokeStyle = d ? "#C8A8FF" : "#6A4FC0"; g.lineWidth = 1.4; g.strokeRect(x, y, s, s);
          g.globalAlpha = a * p * 0.08; g.fillStyle = ["#E8588E", "#2EB894", "#E8A420", "#4A8EE8", "#8A66E0"][i % 5]; g.fillRect(x, y, s, s);
          const q = Math.min(1, Math.max(0, (f - t0 - 4) / 12)); if (q <= 0) return; g.globalAlpha = a; g.strokeStyle = d ? "#FFD86A" : "#E8588E"; g.shadowBlur = d ? 10 : 4; g.shadowColor = g.strokeStyle; g.lineWidth = Math.max(2.5, Math.min(W, H) * 0.005);
          g.beginPath(); g.arc(cx, cy, s, a0, a0 + q * Math.PI / 2); g.stroke(); g.shadowBlur = 0; });
        const t = f - 92; if (t > 0 && t < 40) { g.globalAlpha = a * 0.6 * (1 - t / 40); g.strokeStyle = d ? "#FFD86A" : "#E8588E"; g.lineWidth = 2; g.beginPath(); g.arc(R.ex, R.ey, 4 + t * 1.5, 0, 7); g.stroke(); } }},
    tag: "A candy geometry world where smiling shapes bounce, polygon kites fly and rainbow dice roll by"
  });

  /* Chem Lab (Chemistry) */
  MAJ_THEMES.push({
    skin: {id: "chem", name: "Chem Lab",
      light: ["#EFF7F4", "rgba(46,138,128,.10)", "#FFFFFF", "#16302C", "#526A66", "#D4E6E1", "#E3EFEB", "#F8FCFB", "#2E8A80", "#55A39A", "#FFFFFF", "#1C5A52", "#256058", "#CDEBE5", "#FFD9E8"],
      dark: ["#0C1826", "rgba(111,230,214,.08)", "#142334", "#E8F6F8", "#A2BCC6", "#24384C", "#1A2C3E", "#0F1C2A", "#6FE6D6", "#9AEEE2", "#0A1A20", "#2E7A74", "#0C1826", "#C8EAF0", "#6A3A56"],
      glow: ["linear-gradient(180deg,#EDF6F2,#E3F0EB 55%,#D9EBE4)", "linear-gradient(180deg,#132238,#1A2E46 55%,#203752)"],
      spine: [lg("#3E8E86", "#256058"), lg("#1C3348", "#0C1826")], btn: [lg2("#2E8A80", "#C0568E"), lg2("#6FE6D6", "#FF8FC4")]},
    kit: {motif: "flask", card: ["#F7FCFB", "#E2F2EE"], ink: "#16302C", bd: "#B8DED6", mc: "#2E8A80", r: 16, notes: ["#D6F0EA"].concat(NOTES), shape: "rounded", pin: "clip", fab: "999px", btn: "12px"},
    shapes: {
      flask: {d: "M-3.2 -11H3.2V-9.6H2.4V-4.2L8.8 6.6C9.8 8.4 8.6 10.4 6.6 10.4H-6.6C-8.6 10.4 -9.8 8.4 -8.8 6.6L-2.4 -4.2V-9.6H-3.2Z", detail: "M-6.4 3.4H6.4", dstroke: true},
      molecule: {d: "M-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0Z M4.4 -7.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z M-8.6 -5a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z M0.8 6.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z", detail: "M0 0L6.5 -7.4M0 0L-6.5 -5M0 0L2.9 6.4", dstroke: true},
      // ball-and-stick molecule: the center atom takes the color, with white and red atoms around it
      ch_mol: {d: "M-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0Z M4.4 -7.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z M-8.6 -5a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z M0.8 6.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z", paint: (g, col, dk) => {
        g.strokeStyle = dk ? "#C8D4DC" : "#8A96A3"; g.lineWidth = 1.6; g.lineCap = "round"; [[6.6, -6.6], [-6.8, -4.2], [-3.6, 7.4], [5.4, 5]].forEach(([x, y]) => { g.beginPath(); g.moveTo(0, 0); g.lineTo(x, y); g.stroke(); });
        const ball = (x, y, r, c) => { g.fillStyle = fxShade(c, 0.78); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(x - r * 0.15, y - r * 0.15, r * 0.82, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(x - r * 0.38, y - r * 0.38, r * 0.28, 0, 7); g.fill(); };
        ball(6.6, -6.6, 2.8, "#F2F4F6"); ball(-6.8, -4.2, 2.8, "#F2F4F6"); ball(-3.6, 7.4, 3.2, "#E8463C"); ball(5.4, 5, 2.6, "#F2F4F6"); ball(0, 0, 4.6, col); }}
    },

    // colored liquid fills the bottom of the screen like a beaker, shifting hue as it reacts; bubbles fizz up through it and molecules float off the surface
    fx: {spawn: (W, H, d, n) => { const top = H * 0.74;
      return fxRise(W, H, n(60), "bubble", d ? ["#FFFFFF", "#D8F6F2", "#FFE3F0"] : ["#FFFFFF", "#F2FFFC"], {smin: 3, smax: 8, sway: 0.9, vmin: 1.4, vmax: 3, spread: 120, alpha: 0.9}).map(p => Object.assign(p, {life: Math.round((p.y - top) / -p.vy + fxR(-10, 10)), delay: p.delay + 16}))
        .concat(fxRise(W, H, n(10), "ch_mol", d ? ["#4A5260", "#3FD0C0", "#FFC94A"] : ["#3A404A", "#2E8A80", "#E8A830"], {smin: 15, smax: 19, vmin: 1, vmax: 1.6, sway: 0.8, life: 200}).map(p => Object.assign(p, {y: top + fxR(-10, 10), delay: 50 + Math.floor(fxR(0, 70)), vr: fxR(-0.03, 0.03), rot: fxR(0, 6.3)})),
          fxTw(W, H, n(14), "sparkle", d ? ["#FFE9B8", "#A6E9FF"] : ["#F2B53A", "#FF8FB4"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4})); },
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 170) / 70); if (a <= 0.01) return;
        const lv = H * 0.26 * (1 - Math.pow(1 - Math.min(1, f / 60), 3)) - H * 0.08 * fxEase((f - 160) / 80), y0 = H - lv, hue = 330 - 150 * fxEase((f - 20) / 140), amp = Math.min(14, H * 0.016) * (0.6 + 0.4 * Math.exp(-f / 60));
        if (lv <= 1) return;
        const gr = g.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, `hsla(${hue},${d ? 80 : 72}%,${d ? 62 : 60}%,${d ? 0.34 : 0.32})`); gr.addColorStop(1, `hsla(${hue + 30},${d ? 80 : 70}%,${d ? 50 : 52}%,${d ? 0.5 : 0.46})`);
        const Y = x => y0 + Math.sin(x / 90 + f * 0.09) * amp + Math.sin(x / 37 - f * 0.13) * amp * 0.4;
        g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, Y(x)); g.lineTo(W, H); g.closePath(); g.fill();
        g.strokeStyle = `hsla(${hue},90%,${d ? 80 : 88}%,.85)`; g.lineWidth = 2.5; g.beginPath(); for (let x = 0; x <= W + 8; x += 8) x ? g.lineTo(x, Y(x)) : g.moveTo(x, Y(x)); g.stroke(); }},
    tag: "A bubbly lab with rainbow flasks, a lava lamp, smoke rings and molecules floating by"
  });
})();

