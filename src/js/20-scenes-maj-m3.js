/* ===== module: 20-scenes-maj-m3.js ===== */
/* Study Fields themes, batch m3 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // the signature flourish: a looping line across the lower page (u in 0..1), then an underline swash back
  const wrPt = (u, W, H) => { const x0 = W * 0.12, L = W * 0.76, y0 = H * (W < H ? 0.7 : 0.72), r = Math.min(H * 0.07, L * 0.05);
    if (u < 0.8) { const t = u / 0.8 * Math.PI * 8, aa = L / (Math.PI * 8); return [x0 + aa * t - r * 1.5 * Math.sin(t), y0 - r * 1.8 * (1 - Math.cos(t)) * (0.6 + 0.4 * Math.sin(t / 8))]; }
    const v = (u - 0.8) / 0.2; return [x0 + L - L * 0.9 * v, y0 + r * 1.2 * Math.sin(v * Math.PI) * 0.6 + r * 0.5 * v]; };
  const wrQ = new Path2D("M-9 11C-7 4 -3 -3 3 -8C6 -10.4 9 -11.4 11 -11.4C10.4 -8 8.6 -3.6 5 0C1.6 3.4 -3 5.6 -7 7.4L-9 11Z");

  /* Civic Square (Political Science and Law) */
  MAJ_THEMES.push({
    skin: {id: "civics", name: "Civic Square", desc: "A sunny plaza before a domed courthouse, with fountains and banners.",
      light: ["#F2F5F8", "rgba(47,110,142,.10)", "#FFFFFF", "#1E2A36", "#5C6672", "#D7E0E8", "#E6EDF3", "#F8FAFC", "#2F6E8E", "#5A8CA6", "#FFFFFF", "#1F4C63", "#2F5672", "#CFE1EC", "#FFE3A3"],
      dark: ["#13122C", "rgba(240,194,122,.08)", "#1C1A3A", "#F3F0FA", "#B6B0CE", "#302D56", "#252249", "#17152F", "#F0C27A", "#F6D69E", "#1D1A33", "#8A6E3E", "#17163A", "#D6D0EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#7CC8F2,#B4E2F7 40%,#FDE6D8 70%,#F4CDB8)", "linear-gradient(180deg,#1A1A4A,#33307A 42%,#6A4A8E 70%,#3A2E5A)"],
      spine: [lg("#4F7FA0", "#2F5672"), lg("#2C2C5C", "#17163A")], btn: [lg2("#2F6E8E", "#3F86A0"), lg2("#F0C27A", "#F6D69E")]},
    kit: {motif: "column", card: ["#F9FBFC", "#E8EEF3"], ink: "#1E2A36", bd: "#C4D3DE", mc: "#2F6E8E", r: 12, notes: ["#F6E3C8"].concat(NOTES), shape: "classic", pin: "gold", fab: "14px", btn: "10px"},
    shapes: {
      column: {d: "M-9 -11H9V-8.4H-9Z M-7.4 -8.4H7.4V-6.6H-7.4Z M-5.6 -6.6H5.6V7H-5.6Z M-7.4 7H7.4V8.8H-7.4Z M-9 8.8H9V11.4H-9Z", detail: "M-2.8 -5.4V5.8M0 -5.4V5.8M2.8 -5.4V5.8", dstroke: true},
      pennant: {d: "M-5 -10H5V9L0 5.2L-5 9Z", detail: "M-5 -6.6H5", dstroke: true},
      laurel: {d: "M-1 9C-6.4 7 -9 2.4 -8.4 -3.6L-6.8 -3.4C-7.2 1.6 -5 5.4 -0.4 7.4Z M1 9C6.4 7 9 2.4 8.4 -3.6L6.8 -3.4C7.2 1.6 5 5.4 0.4 7.4Z M-9.4 -5.4a1.6 3 -20 1 0 3.2 0a1.6 3 -20 1 0 -3.2 0Z M6.2 -5.4a1.6 3 20 1 0 3.2 0a1.6 3 20 1 0 -3.2 0Z M-9.6 1a1.4 2.8 -50 1 0 2.8 0a1.4 2.8 -50 1 0 -2.8 0Z M6.8 1a1.4 2.8 50 1 0 2.8 0a1.4 2.8 50 1 0 -2.8 0Z M-6.6 5.4a1.3 2.6 -70 1 0 2.6 0a1.3 2.6 -70 1 0 -2.6 0Z M4 5.4a1.3 2.6 70 1 0 2.6 0a1.3 2.6 70 1 0 -2.6 0Z"}
    },
    // two strings of festival bunting drop in from the top and swing to rest, while balloons rise past the courthouse
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(10), "balloon", d ? ["#FF8FA8", "#7EC8F8", "#FFD45E", "#8FE0A8", "#C9A0FF"] : ["#FF6F91", "#4FB4F0", "#FFC93C", "#5FD08A", "#A88BF5"], {smin: 15, smax: 20, vmin: 1.3, vmax: 2.2, sway: 1, life: 300, spread: 60, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(-0.12, 0.12), delay: p.delay + 20}))
      .concat(fxTw(W, H, n(18), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8B440", "#FFD86B"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 6) * (1 - fxEase((f - 180) / 60)); if (a <= 0.01) return;
        const cols = d ? ["#F07A80", "#7EB8F0", "#F6CC5A", "#7ED0A0", "#C9A0FF"] : ["#E0544A", "#3C8AD8", "#F2B23A", "#3FA868", "#8A6AE0"], fl = Math.max(16, Math.min(W, H) * 0.045);
        g.globalAlpha = a; g.lineCap = g.lineJoin = "round";
        [[-0.02, 0.02, 0.64, -0.02, 0.17, 0], [0.36, -0.02, 1.02, 0.04, 0.15, 10]].forEach(([x0, y0, x1, y1, sag, t0], si) => {
          const t = Math.max(0, f - t0), drop = (1 - Math.exp(-t / 9) * Math.cos(t / 7)) , dy = -H * 0.3 * (1 - Math.min(1.08, drop)), A = [x0 * W, y0 * H + dy], B = [x1 * W, y1 * H + dy], s = sag * H;
          const P = u => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + s * 4 * u * (1 - u)];
          g.strokeStyle = d ? "rgba(240,230,210,.7)" : "rgba(90,70,50,.6)"; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= 30; i++) { const [x, y] = P(i / 30); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          const len = Math.hypot(B[0] - A[0], B[1] - A[1]), N = Math.floor(len / (fl * 1.35));
          for (let i = 0; i < N; i++) { const u0 = (i + 0.1) / N, u1 = (i + 0.9) / N, [ax, ay] = P(u0), [bx, by] = P(u1), sw = Math.sin(f * 0.07 + i * 0.9 + si) * 0.16 * Math.exp(-t / 120) + Math.sin(f * 0.03 + i) * 0.05, mx = (ax + bx) / 2, my = (ay + by) / 2, ang = Math.atan2(by - ay, bx - ax) + sw;
            g.save(); g.translate(mx, my); g.rotate(ang); const hw = Math.hypot(bx - ax, by - ay) / 2; g.fillStyle = cols[(i + si * 2) % cols.length]; g.beginPath(); g.moveTo(-hw, 0); g.lineTo(hw, 0); g.lineTo(0, fl * 1.25); g.closePath(); g.fill();
            g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.moveTo(-hw, 0); g.lineTo(0, 0); g.lineTo(0, fl * 1.25); g.closePath(); g.fill(); g.restore(); } }); }},
    tag: "A festival square before a domed courthouse, with kites, balloons and bunting"
  });

  /* Case Room (Criminal Justice) */
  MAJ_THEMES.push({
    skin: {id: "justice", name: "Case Room", desc: "A cozy detective's office with a corkboard of clues on a rainy day.",
      light: ["#F5F0EA", "rgba(178,58,48,.09)", "#FFFDF9", "#2A1E18", "#6A5A50", "#E6DBD0", "#EFE7DE", "#FBF8F4", "#B23A30", "#C66A5E", "#FFFFFF", "#6E2018", "#4E3626", "#EED6CC", "#FFE29A"],
      dark: ["#171015", "rgba(240,122,94,.08)", "#21171D", "#F5ECE4", "#C2AFA6", "#3A2A32", "#2C2026", "#1B1318", "#F07A5E", "#F2A070", "#24161A", "#8A4A3A", "#1C1418", "#EAD2C8", "#6A4428"],
      glow: ["linear-gradient(180deg,#8ED2C8,#8ED2C8 62%,#B24A5C)", "linear-gradient(180deg,#1E4A50,#1E4A50 62%,#5A2234)"],
      spine: [lg("#7A5A44", "#4E3626"), lg("#3A2A34", "#1C1418")], btn: [lg2("#B23A30", "#C4553A"), lg2("#F07A5E", "#F2A070")]},
    kit: {motif: "magnifier", card: ["#FFFCF6", "#F2E8DA"], ink: "#2A1E18", bd: "#DCC8B2", mc: "#B23A30", r: 6, notes: ["#F8E07C", "#F6B6BE", "#B8D4EA", "#FBF7EE", "#D9F0D8", "#FFD9C8"], shape: "classic", pin: "pin", fab: "8px", btn: "6px"},
    shapes: {
      magnifier: {d: "M-3 -11A8 8 0 1 0 -3 5A8 8 0 1 0 -3 -11Z M-3 -8.4A5.4 5.4 0 1 1 -3 2.4A5.4 5.4 0 1 1 -3 -8.4Z M2.4 3.6L4.6 1.6L11.2 8.4L9 10.6Z"},
      clue: {d: "M-8 -9H8V9H-8Z", detail: "M-5 -4.6H5M-5 -1H5M-5 2.6H2", dstroke: true},
      fingerprint: {d: "M0 -10A8 10 0 0 1 8 0V3A8 10 0 0 1 -8 3V0A8 10 0 0 1 0 -10Z", detail: "M0 -7A5.4 7 0 0 1 5.4 0V2.6M-5.4 2.6V0A5.4 7 0 0 1 2 -6.6M0 -4A2.6 4 0 0 1 2.6 0V5M-2.6 5V0A2.6 4 0 0 1 0 -4M0 -1V8", dstroke: true},
      qmark: {d: "M-4.6 -4.2C-4.6 -8.6 -1.8 -10.6 1 -10.6C4.4 -10.6 6.4 -8.2 6.4 -5.6C6.4 -2.4 4 -1.4 2.4 -0.2C1.6 0.4 1.4 1.4 1.4 2.6H-1.8C-1.8 0.4 -1.2 -0.8 0.6 -2.2C2 -3.2 3.2 -3.8 3.2 -5.6C3.2 -6.8 2.4 -7.8 0.9 -7.8C-0.6 -7.8 -1.4 -6.6 -1.4 -4.2Z M-2 5.2H1.6V8.8H-2Z"}
    },
    // red string links four pinned clues, then a big CASE CLOSED stamp thumps down in the middle and the case notes flutter off the board
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(18), "clue", d ? ["#F8E07C", "#F6B6BE", "#B8D4EA", "#FBF7EE"] : ["#F4D660", "#F2A2AC", "#9CC2E2", "#FFFFFF"], {vmin: 0.8, vmax: 1.6, sway: 1.6, smin: 10, smax: 14, rock: 0.5, spread: 70}).map(p => Object.assign(p, {delay: p.delay + 44}))
      .concat(fxBurst(W, H, n(8), "fingerprint", d ? ["#F07A5E", "#E8C890"] : ["#B23A30", "#8A5A3A"], [[0.15, 1.02], [0.85, 1.02]], {smin: 9, smax: 12}).map(p => Object.assign(p, {delay: 40 + Math.floor(fxR(0, 10))})),
        fxTw(W, H, n(14), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8B440", "#F2C24A"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 6) * (1 - fxEase((f - 180) / 60)); if (a <= 0.01) return;
        const cx = W / 2, cy = H * 0.72, bw = Math.min(W * 0.72, 380), bh = bw * 0.32, ink = d ? "#FF6A5E" : "#C42E26";
        // pins and red string
        const pins = [[cx - bw * 0.6, cy - bh * 1.05], [cx + bw * 0.56, cy - bh * 1.2], [cx + bw * 0.62, cy + bh * 1.05], [cx - bw * 0.54, cy + bh * 1.15]];
        g.lineCap = "round"; g.globalAlpha = a; g.strokeStyle = d ? "#FF5A5A" : "#C8282E"; g.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const p = fxEase((f - 4 - i * 7) / 9); if (p <= 0) break; const [x0, y0] = pins[i], [x1, y1] = pins[(i + 1) % 4]; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 14, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p + 14 * Math.sin(Math.PI * p) * 0.5); g.stroke(); }
        pins.forEach(([x, y], i) => { const p = fxEase((f - i * 7) / 6); if (p <= 0) return; g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.arc(x + 2, y + 2, 6 * p, 0, 7); g.fill(); g.fillStyle = ["#E0463C", "#3D7BE0", "#F2B53A", "#2E9E5B"][i]; g.beginPath(); g.arc(x, y, 6 * p, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(x - 2, y - 2, 2 * p, 0, 7); g.fill(); });
        // the stamp drops from above and lands at f = 40 with a small squash
        const t = f - 30; if (t <= 0) return; const land = Math.min(1, t / 10), sc = 1 + 0.9 * Math.pow(1 - land, 2) - 0.05 * Math.sin(Math.min(1, Math.max(0, (t - 10) / 10)) * Math.PI);
        g.save(); g.translate(cx, cy); g.rotate(-0.1); g.scale(sc, sc); g.globalAlpha = a * (0.25 + 0.65 * land); g.strokeStyle = ink; g.fillStyle = ink;
        g.lineWidth = Math.max(3, bh * 0.07); g.lineJoin = "round"; g.strokeRect(-bw / 2, -bh / 2, bw, bh); g.lineWidth = Math.max(1.5, bh * 0.03); g.strokeRect(-bw / 2 + bh * 0.11, -bh / 2 + bh * 0.11, bw - bh * 0.22, bh * 0.78);
        let fs = bh * 0.5; g.font = `900 ${fs}px "Arial Black", Impact, system-ui, sans-serif`; const tw = g.measureText("CASE CLOSED").width; if (tw > bw * 0.84) { fs *= bw * 0.84 / tw; g.font = `900 ${fs}px "Arial Black", Impact, system-ui, sans-serif`; }
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CASE CLOSED", 0, bh * 0.03);
        // worn ink: a few gaps knocked out of the print
        g.globalCompositeOperation = "destination-out"; g.globalAlpha = 0.5; for (let i = 0; i < 14; i++) { const u = Math.sin(i * 12.9898) * 43758.5453, v = u - Math.floor(u), w = Math.sin(i * 78.233) * 12345.678, z = w - Math.floor(w); g.beginPath(); g.ellipse((v - 0.5) * bw, (z - 0.5) * bh, bh * 0.08, bh * 0.03, v * 3, 0, 7); g.fill(); }
        g.restore();
        if (t > 9 && t < 40) { const q = (t - 9) / 31; g.globalAlpha = a * 0.45 * (1 - q); g.strokeStyle = ink; g.lineWidth = 2; for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2, r0 = bw * 0.52 + q * 30, r1 = r0 + 14; g.beginPath(); g.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 0.45); g.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1 * 0.45); g.stroke(); } } }},
    tag: "Neon rain, fairy lights and a corkboard of clues tied with red string in a cozy detective office"
  });

  /* Writer's Retreat (English) */
  MAJ_THEMES.push({
    skin: {id: "writing", name: "Writer's Retreat", desc: "A cottage writing desk with a typewriter by a garden window.",
      light: ["#F7F2EA", "rgba(168,85,58,.09)", "#FFFDF8", "#2A2622", "#6A625A", "#E8DFD2", "#F0E9DF", "#FCFAF6", "#A8553A", "#C07A60", "#FFFFFF", "#6A3220", "#4A6A5A", "#DCE8E0", "#FFE4A0"],
      dark: ["#15121C", "rgba(240,184,112,.08)", "#1F1B28", "#F6F0E6", "#C2B8AC", "#352F42", "#2A2534", "#19161F", "#F0B870", "#F6CF94", "#221C18", "#86643A", "#1E1A26", "#E0D6EA", "#6A5228"],
      glow: ["linear-gradient(180deg,#FFE4D6,#FFE4D6 70%,#CC9466)", "linear-gradient(180deg,#33284A,#33284A 70%,#6A4A38)"],
      spine: [lg("#6E8E7E", "#4A6A5A"), lg("#3A3446", "#1E1A26")], btn: [lg2("#A8553A", "#C0703E"), lg2("#F0B870", "#F6CF94")]},
    kit: {motif: "quill", card: ["#FFFDF8", "#F3ECE0"], ink: "#2A2622", bd: "#E0D2BE", mc: "#A8553A", r: 10, notes: ["#F4E6C8", "#DCE8E0"].concat(NOTES), shape: "lined", pin: "pin", fab: "16px 16px 16px 4px", btn: "10px"},
    shapes: {
      quill: {d: "M-9 11C-7 4 -3 -3 3 -8C6 -10.4 9 -11.4 11 -11.4C10.4 -8 8.6 -3.6 5 0C1.6 3.4 -3 5.6 -7 7.4L-9 11Z", detail: "M-8.4 10.4C-3 3 3 -3.6 10 -10.6", dstroke: true},
      paperbird: {d: "M-11 1.6L11 -2.4L-3.6 5.6Z M-3.4 0.6L5.6 -0.8L-6.4 -11.4Z", detail: "M-3.4 0.6L-6.4 -11.4", dstroke: true},
      letter: {d: "M-10 -7H10V7H-10Z", detail: "M-10 -7L0 1L10 -7", dstroke: true},
      inkdrop: {d: "M0 -10C3.5 -4 6.5 0 6.5 3.5A6.5 6.5 0 0 1 -6.5 3.5C-6.5 0 -3.5 -4 0 -10Z"}
    },
    // a quill signs a looping flourish across the page; as the ink dries, paper birds lift off the line and fly away
    fx: {spawn: (W, H, d, n) => { const P = [], N = n(12);
      for (let i = 0; i < N; i++) { const u = (i + fxR(0.2, 0.8)) / N, [x, y] = wrPt(u, W, H), sp = fxR(2.2, 3.2), an = -fxR(0.5, 1.1), lr = fxR(0, 1) < 0.7 ? 1 : -1;
        P.push({shape: "paperbird", c: fxPick(d ? ["#F6F0E6", "#E8DCC4", "#F6CF94", "#A8C8F0"] : ["#4F7FC4", "#E2765A", "#3F9A80", "#F2B53A"]), x, y: y - 8, vx: lr * Math.cos(an) * sp, vy: Math.sin(an) * sp, g: -0.006, drag: 0.998, size: fxR(16, 21), face: true, wig: 0.06, rot: 0, vr: 0, sway: 0.6, swf: 0.05, life: 170, delay: Math.round(18 + u * 80 + fxR(10, 26)), glow: d ? 6 : 3}); }
      return P.concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8B440", "#F2C24A"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4})); },
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 175) / 60); if (a <= 0.01) return;
        const p = Math.min(1, Math.max(0, (f - 8) / 92)), M = 160, k = Math.floor(p * M), ink = d ? "#F6D9A0" : "#24304E";
        g.lineCap = g.lineJoin = "round"; g.strokeStyle = ink; g.globalAlpha = a; g.shadowBlur = d ? 6 : 0; g.shadowColor = ink;
        let [px, py] = wrPt(0, W, H); for (let i = 1; i <= k; i++) { const [x, y] = wrPt(i / M, W, H); g.lineWidth = 1.4 + 2.2 * Math.abs(Math.sin(Math.atan2(y - py, x - px) + 0.6)); g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); px = x; py = y; }
        const [hx, hy] = wrPt(p, W, H); g.lineTo(hx, hy);
        // the quill rides the tip of the line and lifts away once it is done
        const off = fxEase((f - 100) / 30), qa = a * (1 - off); if (qa <= 0.01) return;
        const s = Math.max(2.2, Math.min(W, H) * 0.006); g.save(); g.shadowBlur = 0; g.globalAlpha = qa; g.translate(hx + 9 * s + off * 40, hy - 11 * s - off * 50); g.scale(s, s);
        g.fillStyle = d ? "#F4EEE2" : "#FFFFFF"; g.strokeStyle = d ? "#C9B89A" : "#8A7A66"; g.lineWidth = 0.6; g.fill(wrQ); g.stroke(wrQ); g.beginPath(); g.moveTo(-8.4, 10.4); g.bezierCurveTo(-3, 3, 3, -3.6, 10, -10.6); g.stroke(); g.restore(); }},
    tag: "A storybook writing nook where a quill writes by itself and letters drift up like dust motes"
  });
})();

