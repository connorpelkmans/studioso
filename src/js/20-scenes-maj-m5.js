/* ===== module: 20-scenes-maj-m5.js ===== */
/* Study Fields themes, batch m5 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  // ellipse ring (outline band) as a filled path
  const ellPts = (cx, cy, rx, ry, rot, n = 28, rev = false) => { const o = [], a0 = rot * Math.PI / 180; for (let i = 0; i < n; i++) { const t = (rev ? -1 : 1) * i / n * Math.PI * 2, x = rx * Math.cos(t), y = ry * Math.sin(t); o.push([cx + x * Math.cos(a0) - y * Math.sin(a0), cy + x * Math.sin(a0) + y * Math.cos(a0)]); } return o; };
  const band = (rx, ry, w, rot) => pts(ellPts(0, 0, rx, ry, rot)) + pts(ellPts(0, 0, rx - w, Math.max(0.3, ry - w), rot, 28, true));
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const leafAt = (x, y, len, w, ang) => { const o = []; for (let i = 0; i <= 10; i++) { const t = i / 10; o.push([t * len, w * Math.sin(Math.PI * t)]); } for (let i = 9; i > 0; i--) { const t = i / 10; o.push([t * len, -w * Math.sin(Math.PI * t)]); } const a = ang * Math.PI / 180; return pts(o.map(p => [x + p[0] * Math.cos(a) - p[1] * Math.sin(a), y + p[0] * Math.sin(a) + p[1] * Math.cos(a)])); };
  const laurel = (() => { let d = "M-0.5 11.5L0.5 11.5L0.5 -8L-0.5 -8Z"; [7.5, 3.2, -1.1, -5.2].forEach((y, k) => { const L = 7 - k * 0.5; d += leafAt(-0.3, y, L, 2.1, -138) + leafAt(0.3, y - 1.2, L, 2.1, -42); }); d += leafAt(0, -7.6, 4.6, 1.9, -90); return {d}; })();
  const blades = (r, w, cy) => [0, 120, 240].map(a => { const t = (a - 90) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), q = [[0, -w * 0.6], [r * 0.25, -w], [r, -w * 0.25], [r, 0.2], [0, w * 0.6]]; return pts(q.map(p => [p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c])); }).join("");
  Object.assign(FX_SHAPES, {
    planet: {d: circ(0, 0, 5.8) + band(11.4, 3.6, 1.5, -18), detail: "M-9.6 2.6Q0 3.6 9.6 -3.6", dstroke: true},
    comet: {d: circ(5, -5, 4.3) + "M1 -7.6L-11 10.5L7.6 -1Z"},
    atom: {d: band(11, 4, 1.3, 0) + band(11, 4, 1.3, 60) + band(11, 4, 1.3, 120) + circ(0, 0, 2.6)},
    ruincol: {d: "M-7.5 -11H7.5V-8.6H5.4V7.6H7.2V9.4H8.4V11.4H-8.4V9.4H-7.2V7.6H-5.4V-8.6H-7.5Z", detail: "M-2.4 -7V6.4M0 -7V6.4M2.4 -7V6.4", dstroke: true},
    laurel: laurel,
    hourglass: {d: "M-7 -11H7V-9H5.4C5.4 -4 1.8 -2 1.3 0C1.8 2 5.4 4 5.4 9H7V11H-7V9H-5.4C-5.4 4 -1.8 2 -1.3 0C-1.8 -2 -5.4 -4 -5.4 -9H-7Z", detail: "M-3.4 -5H3.4L0 -0.8Z M0 2.6L3.8 8H-3.8Z", dfill: true},
    turbine: {d: "M-0.9 -1H0.9L1.6 11.5H-1.6Z" + circ(0, -1.8, 1.7) + blades(10, 1.5, -1.8)},
    seed: {d: "M0 11V-2.2M0 -2.2L-6.6 -8.4M0 -2.2L-2.6 -10.6M0 -2.2L2.6 -10.6M0 -2.2L6.6 -8.4M0 -2.2L-8.6 -3.6M0 -2.2L8.6 -3.6", stroke: true, lw: 1.1},
    house: {d: "M-9 10.5V-0.5L0 -9L9 -0.5V10.5Z M-3 10.5V3.5H3V10.5 M5.2 -4.2V-9H7.6V-1.9", stroke: true, lw: 1.6},
    girder: {d: "M-11.5 -3.4H11.5V3.4H-11.5Z M-11.5 3.4L-7.7 -3.4L-3.8 3.4L0 -3.4L3.8 3.4L7.7 -3.4L11.5 3.4", stroke: true, lw: 1.3},
    setsq: {d: pts([[-10, 9], [-10, -10], [10, 9]]) + pts([[-6.4, 5.6], [2, 5.6], [-6.4, -2.4]])},
    rocket: {d: "M0 -11.5C4.2 -7.5 4.6 -1 4 5H-4C-4.6 -1 -4.2 -7.5 0 -11.5Z M-4 0.5L-8 7.5L-4 6Z M4 0.5L8 7.5L4 6Z M-2.4 6H2.4L0 11Z", detail: circ(0, -3.5, 1.9), dfill: true},
    catface: {d: circ(0, 1.5, 8.6) + "M-8.4 -1.4L-1.6 -6.6L-7.2 -11.4Z M8.4 -1.4L7.2 -11.4L1.6 -6.6Z", detail: circ(-3.3, 0.8, 1.4) + circ(3.3, 0.8, 1.4) + "M-1.3 3.6H1.3L0 5Z", dfill: true},
    amphora: {d: "M-2.2 -11H2.2V-9.6H1.5V-7.4C4.8 -6 7 -3 7 0.6C7 4.4 4.6 7.2 2.2 8.6L2.8 10.4H3.6V11.4H-3.6V10.4H-2.8L-2.2 8.6C-4.6 7.2 -7 4.4 -7 0.6C-7 -3 -4.8 -6 -1.5 -7.4V-9.6H-2.2Z M-1.6 -8.6C-6 -9.6 -7.8 -6.4 -5.4 -4.4L-4.4 -5.4C-5.6 -6.6 -4.6 -8 -1.6 -7.4Z M1.6 -8.6C6 -9.6 7.8 -6.4 5.4 -4.4L4.4 -5.4C5.6 -6.6 4.6 -8 1.6 -7.4Z", detail: "M-6.4 -1.6H6.4M-6.6 1.8H6.6M-5 5H5", dstroke: true},
    dcompass: {d: "M0 -11V-7.6M-1.2 -6A2.4 2.4 0 1 0 1.2 -6A2.4 2.4 0 1 0 -1.2 -6M-1.4 -4.2L-7 10.6M1.4 -4.2L7 10.6M-4.6 4.2Q0 6.4 4.6 4.2", stroke: true, lw: 1.5}
  });

  // gusts that blow leaves and seeds sideways across the page, swirling
  const gust = (W, H, n, shape, cols, o) => Array.from({length: n}, () => ({shape, c: fxPick(cols), x: fxR(-W * 0.35, -10), y: fxR(H * 0.15, H * 0.95), vx: fxR(o.vmin, o.vmax), vy: fxR(-0.9, 0.3), g: 0, size: fxR(o.smin, o.smax), rot: fxR(0, 6.3), vr: fxR(-0.05, 0.05), sway: o.sway, swf: fxR(0.04, 0.08), flip: o.flip, life: 260, delay: Math.floor(fxR(0, 70)), glow: o.glow}));
  const scB = []; // Sketch City buildings, rebuilt by each spawn
  const streaks = (W, H, n, cols) => Array.from({length: n}, () => { const sp = fxR(8, 12); return {shape: null, streak: true, c: fxPick(cols), x: fxR(W * 0.3, W * 1.15), y: fxR(-40, H * 0.4), vx: -sp, vy: sp * 0.55, g: 0, size: 2, life: 80, delay: Math.floor(fxR(0, 150)), glow: 12}; });

  // laurel wreath for Ancient Ruins: ring center and radius, then leaves [x, y, angle, start frame] growing up both sides
  const ruR = (W, H) => ({cx: W / 2, cy: H * (W < H ? 0.66 : 0.68), r: Math.min(W, H) * (W < H ? 0.3 : 0.22)});
  const ruW = (W, H) => { const {cx, cy, r} = ruR(W, H), o = [], N = 11; [-1, 1].forEach(s => { for (let i = 0; i < N; i++) { const th = Math.PI / 2 + s * (0.16 + i / (N - 1) * (Math.PI - 0.66)), x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r, tg = th + s * Math.PI / 2;
    o.push([x, y, tg - 0.62, 6 + i * 7], [x, y, tg + 0.62, 9 + i * 7]); } }); return o; };
  Object.assign(FX_SHAPES, {
    // a white dove in flight, facing +x, one wing raised
    ru_dove: {d: "M10.6 -2.6C9 -4.2 6.8 -4 5.6 -2.4C2 -1.6 -3 -1.2 -6.4 0.4L-11.4 -1.6L-9.4 2.2L-11.2 5L-5.4 3.8C-2 5.6 3.6 5.2 6.6 2.2C8.2 0.6 9 -1 10.6 -2.6Z M-1.6 0.4C-2.6 -4.6 -5.4 -9 -9.6 -11C-4.4 -10.6 1.4 -6.4 3.4 -0.8Z", paint: (g, col, dk) => {
      const body = new Path2D("M10.6 -2.6C9 -4.2 6.8 -4 5.6 -2.4C2 -1.6 -3 -1.2 -6.4 0.4L-11.4 -1.6L-9.4 2.2L-11.2 5L-5.4 3.8C-2 5.6 3.6 5.2 6.6 2.2C8.2 0.6 9 -1 10.6 -2.6Z"), wing = new Path2D("M-1.6 0.4C-2.6 -4.6 -5.4 -9 -9.6 -11C-4.4 -10.6 1.4 -6.4 3.4 -0.8Z");
      g.strokeStyle = dk ? "rgba(255,255,255,.4)" : "rgba(90,110,140,.55)"; g.lineWidth = 0.8; g.lineJoin = "round"; g.fillStyle = col; g.fill(body); g.stroke(body); g.fillStyle = fxShade(col, 0.9); g.fill(wing); g.stroke(wing);
      g.strokeStyle = dk ? "rgba(255,255,255,.35)" : "rgba(90,110,140,.4)"; g.beginPath(); g.moveTo(-6.6, -9.4); g.lineTo(-3.8, -4.6); g.moveTo(-3.6, -8.4); g.lineTo(-1.6, -3.6); g.stroke();
      g.fillStyle = "#F0A040"; g.beginPath(); g.moveTo(10.4, -2.8); g.lineTo(12.4, -2); g.lineTo(10.2, -1.6); g.fill(); g.fillStyle = "#2A2A3A"; g.beginPath(); g.arc(8.2, -2.4, 0.6, 0, 7); g.fill(); }}
  });

  MAJ_THEMES.push({
    skin: {id: "observatory", name: "Observatory", desc: "A domed observatory on a hill under a huge starry sky.",
      light: ["#F1F0F8", "rgba(79,79,176,.10)", "#FFFFFF", "#1B1D3A", "#5A5C7A", "#DCDCEC", "#E8E7F3", "#F9F9FC", "#4F4FB0", "#7272C4", "#FFFFFF", "#33337A", "#262A5C", "#D6D6F0", "#FFE3A8"],
      dark: ["#0D1030", "rgba(242,196,106,.08)", "#171A3E", "#EEEEFA", "#ABADD0", "#2C2F5A", "#22254D", "#12153A", "#F2C46A", "#F6D592", "#1A1530", "#7A6438", "#0B0E28", "#D2D4F0", "#6A5428"],
      glow: ["linear-gradient(180deg,#84ACDB,#B2CAEB 32%,#E6D1E3 66%,#F9D8C5)", "linear-gradient(180deg,#080C28,#121848 38%,#232766 68%,#3E356C)"],
      spine: [lg("#3E4290", "#262A5C"), lg("#1D2156", "#0B0E28")], btn: [lg2("#4F4FB0", "#7A5BC0"), lg2("#F2C46A", "#F6D592")]},
    kit: {motif: "planet", card: ["#F8F8FD", "#E6E6F5"], ink: "#1B1D3A", bd: "#CFCFEA", mc: "#5A5ACC", r: 18, notes: ["#DCDCF2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "circle", pin: "starpin", fab: "999px", btn: "999px"},
    // the Big Dipper and Cassiopeia join up star by star, like a sky chart being traced, while shooting stars cross and the sky twinkles
    fx: {spawn: (W, H, d, n) => streaks(W, H, n(6), d ? ["#FFFFFF", "#FFE7B0", "#BFD0FF"] : ["#7A86D8", "#B08AE0", "#5A6AC8"]).map(p => Object.assign(p, {delay: 20 + Math.floor(fxR(0, 120))}))
      .concat(fxTw(W, H, n(36), "sparkle", d ? ["#FFFFFF", "#FFE7B0", "#C9D4FF"] : ["#E8A21C", "#7A7AD8", "#F2B53A"], {smin: 3, smax: 7, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 180) / 60); if (a <= 0.01) return;
        const ph = W < H, line = d ? "rgba(191,208,255,.75)" : "rgba(79,79,176,.6)", star = d ? "#FFFFFF" : "#F2A81C", glo = d ? "#BFD0FF" : "#F2B53A";
        const C = [{p: [[0, 0.1], [0.17, 0], [0.3, 0.03], [0.44, 0.1], [0.47, 0.3], [0.68, 0.33], [0.7, 0.1]], l: [0, 1, 2, 3, 4, 5, 6, 3], x: ph ? 0.1 : 0.3, y: ph ? 0.14 : 0.1, w: ph ? 0.8 : 0.6, t0: 4},
          {p: [[0, 0], [0.12, 0.22], [0.24, 0.08], [0.37, 0.26], [0.5, 0.02]], l: [0, 1, 2, 3, 4], x: ph ? 0.32 : 0.05, y: ph ? 0.62 : 0.6, w: ph ? 0.6 : 0.36, t0: 60}];
        g.lineCap = "round";
        C.forEach(c => { const bw = Math.min(W * c.w, 640), X = q => [W * c.x + q[0] * bw, H * c.y + q[1] * bw], P = c.p.map(X), step = 9;
          for (let i = 0; i < c.l.length - 1; i++) { const u = Math.min(1, Math.max(0, (f - c.t0 - 8 - i * step) / step)); if (u <= 0) break; const [x0, y0] = P[c.l[i]], [x1, y1] = P[c.l[i + 1]];
            g.globalAlpha = a; g.strokeStyle = line; g.lineWidth = 1.8; g.setLineDash([]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u); g.stroke(); }
          P.forEach(([x, y], i) => { const k = c.l.indexOf(i), t = f - c.t0 - Math.max(0, k) * step; if (t <= 0) return; const e = Math.min(1, t / 10), pop = 1 + 0.8 * Math.exp(-t / 8) * (t > 2 ? 1 : 0), r = (i % 3 ? 4 : 5.2) * e * pop, tw = 0.85 + 0.15 * Math.sin(f * 0.15 + i * 2);
            g.globalAlpha = a * e; g.shadowBlur = 14; g.shadowColor = glo; g.fillStyle = star; g.beginPath(); for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4, rr = j % 2 ? r * 0.38 : r * 2 * tw; g.lineTo(x + Math.cos(an - Math.PI / 2) * rr, y + Math.sin(an - Math.PI / 2) * rr); } g.fill(); g.shadowBlur = 0; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill(); }); }); }},
    tag: "A domed observatory on a hilltop, its telescope tracking a sky full of stars"
  });
  MAJ_THEMES.push({
    skin: {id: "ruins", name: "Ancient Ruins", desc: "A gold-trimmed temple above a whitewashed island village and a deep blue sea.",
      light: ["#F1F5FC", "rgba(31,95,184,.10)", "#FFFFFF", "#14213D", "#55627E", "#D6DFEF", "#E5ECF8", "#F8FAFE", "#1F5FB8", "#C9962A", "#FFFFFF", "#163F80", "#123A78", "#D8E4F8", "#F2D27A"],
      dark: ["#0B1430", "rgba(242,196,90,.08)", "#131F42", "#EEF2FC", "#A8B4D4", "#26345E", "#1C2A52", "#0F1A3A", "#F2C45A", "#F6D688", "#1A1404", "#7A6230", "#08102A", "#E2E8F8", "#6A5420"],
      glow: ["linear-gradient(180deg,#3E9CEA,#86C8F4 33%,#FFF2CC 54%,#FFDC8C 60%,#1F78C8)", "linear-gradient(180deg,#081038,#13226A 36%,#2A3A88 60%,#14205A)"],
      spine: [lg("#1F4E96", "#123A78"), lg("#14224E", "#08102A")], btn: [lg2("#1C56AE", "#2E6FC6"), lg2("#F2C45A", "#F6D688")]},
    kit: {motif: "column", card: ["#F8FAFE", "#E4ECF8"], ink: "#14213D", bd: "#C8D6EE", mc: "#C9962A", r: 10, notes: ["#E2EAF7", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "torn", pin: "gold", fab: "14px", btn: "10px"},
    // a golden laurel wreath grows leaf by leaf up both sides; doves fly up past it, and when it is complete its leaves let go and drift down
    fx: {spawn: (W, H, d, n) => { const P = [], wr = ruW(W, H);
      wr.forEach(([x, y, ang, t0], i) => { if (i % 2) return; P.push({shape: "leaf", c: fxPick(d ? ["#F2C45A", "#F6D688", "#E0B040"] : ["#E3A928", "#F2C04A", "#C9962A"]), x, y, vx: fxR(-0.4, 0.4), vy: fxR(0.4, 1), g: 0.012, size: fxR(7, 9), rot: ang, vr: 0, rock: 0.5, sway: 1, swf: fxR(0.03, 0.06), flip: true, life: 110, delay: 150 + Math.floor(fxR(0, 18)), glow: d ? 6 : 0}); });
      for (let i = 0, N = n(7); i < N; i++) { const lr = i % 2 ? 1 : -1, sp = fxR(2.4, 3.4), an = -fxR(0.35, 0.8);
        P.push({shape: "ru_dove", c: d ? "#F4F6FA" : "#FFFFFF", x: lr > 0 ? fxR(-60, W * 0.2) : fxR(W * 0.8, W + 60), y: H + fxR(10, 70), vx: lr * Math.cos(an) * sp, vy: Math.sin(an) * sp, g: 0, drag: 0.999, size: fxR(15, 20), face: true, wig: 0.08, rot: 0, vr: 0, sway: 0.5, swf: 0.04, life: 200, delay: Math.floor(fxR(10, 100)), glow: d ? 6 : 0}); }
      return P.concat(fxTw(W, H, n(22), "sparkle", d ? ["#FFE7B0", "#FFFFFF", "#F2C45A"] : ["#F2B53A", "#FFD86B", "#FFFFFF"], {smin: 3, smax: 7, glow: d ? 10 : 6})); },
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 145) / 30); if (a <= 0.01) return;
        const wr = ruW(W, H), sz = Math.min(W, H) * 0.026, gold = d ? ["#F6D688", "#E0B040"] : ["#E8B030", "#C9962A"];
        g.globalAlpha = a; g.shadowBlur = d ? 12 : 6; g.shadowColor = d ? "rgba(255,210,120,.6)" : "rgba(200,140,30,.4)";
        // the two stems
        const R = ruR(W, H); g.strokeStyle = gold[1]; g.lineWidth = Math.max(2, sz * 0.18); g.lineCap = "round";
        [-1, 1].forEach(s => { const p = fxEase(f / 70); g.beginPath(); g.arc(R.cx, R.cy, R.r, Math.PI / 2, Math.PI / 2 + s * p * (Math.PI - 0.5), s < 0); g.stroke(); });
        wr.forEach(([x, y, ang, t0], i) => { const e = Math.min(1, Math.max(0, (f - t0) / 12)); if (e <= 0) return; const sc = sz * (1 - Math.pow(1 - e, 3)) * (1 + 0.25 * Math.sin(e * Math.PI));
          g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = gold[i % 2]; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sc * 0.55, -sc * 0.42, sc * 1.25, 0); g.quadraticCurveTo(sc * 0.55, sc * 0.42, 0, 0); g.fill(); g.restore(); });
        // a soft glow ring when it closes
        const t = f - 82; if (t > 0 && t < 50) { g.shadowBlur = 0; g.globalAlpha = a * 0.4 * Math.sin(t / 50 * Math.PI); g.strokeStyle = gold[0]; g.lineWidth = 3; g.beginPath(); g.arc(R.cx, R.cy, R.r * (1.15 + t * 0.006), 0, 7); g.stroke(); } }},
    tag: "A gold-trimmed temple above a whitewashed island village and a deep blue sea, with an island cat, an owl and doves"
  });
  MAJ_THEMES.push({
    skin: {id: "valley", name: "Green Valley", desc: "A green valley with wind turbines and a winding river.",
      light: ["#EFF6EE", "rgba(47,125,74,.10)", "#FFFFFF", "#15291C", "#55695B", "#D3E4D5", "#E3EFE3", "#F8FBF7", "#2F7D4A", "#55A06A", "#FFFFFF", "#1E5532", "#24533A", "#CDE8D3", "#FFE7A0"],
      dark: ["#0C1A1A", "rgba(143,214,154,.07)", "#132424", "#E8F4EC", "#A2BCAE", "#243B38", "#1B302D", "#0F1F1F", "#8FD69A", "#B2E4B6", "#0F2416", "#4A7A52", "#0A1616", "#C2E0CC", "#4A6A3A"],
      glow: ["linear-gradient(180deg,#A9D3EE,#D7EBF2 50%,#EAF2DA)", "linear-gradient(180deg,#0B1530,#16284A 50%,#2A3D58)"],
      spine: [lg("#3C7A52", "#24533A"), lg("#16302E", "#0A1616")], btn: [lg2("#2F7D4A", "#4A9A5A"), lg2("#8FD69A", "#C2E89A")]},
    kit: {motif: "turbine", card: ["#F7FBF6", "#E2EFE0"], ink: "#15291C", bd: "#C2DCC6", mc: "#2F7D4A", r: 16, notes: ["#D3E8D5", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "pin", fab: "24px 24px 24px 8px", btn: "12px"},
    // a kite catches the wind: it climbs from the bottom corner in big lazy swoops, its tail of bows hanging and fluttering
    // below and its string running back to the corner, then sails off up and away while dandelion seeds drift by
    fx: {len: 280, spawn: (W, H, d, n) => gust(W, H, n(20), "seed", d ? ["#F4F1E6", "#DDEBE0"] : ["#FFFFFF", "#F4F6EC"], {vmin: 1.6, vmax: 2.8, sway: 2.2, smin: 10, smax: 15, glow: d ? 6 : 4}).map(p => Object.assign(p, {vr: 0, rock: 0.3, rot: fxR(-0.4, 0.4), vy: fxR(-1, -0.2)}))
      .concat(fxFlutter(W, H, n(4), d ? ["#FFB3D9", "#FFE38A", "#B8F0FF"] : ["#FF7FA8", "#FFC23A", "#5FB0F0", "#B58CF2"]),
        fxTw(W, H, n(12), "circle", d ? ["#F6E68A", "#C8F28A"] : ["#F2D24A", "#B8E07A"], {smin: 1.8, smax: 3, glow: 10, vy: -0.4})),
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 8); if (f > 300) return;
        const ph = W < H, K = Math.min(W, H) * (ph ? 0.13 : 0.125), ax = W * 0.04, ay = H + 30;
        const pos = t => { const u = Math.max(0, t) / 190, e = fxEase(Math.min(1, u)), away = Math.max(0, t - 185) / 90;
          return [W * (0.2 + 0.55 * e) + Math.sin(u * 8.5) * W * (ph ? 0.1 : 0.07) + away * away * W * 0.4, H * (1.12 - 0.82 * e) + Math.sin(u * 12 + 1) * H * 0.04 - away * away * H * 0.7]; };
        const tilt = t => { const [x0] = pos(t - 2), [x1] = pos(t + 2); return Math.max(-0.6, Math.min(0.6, (x1 - x0) * 0.03)) + Math.sin(t * 0.09) * 0.08; };
        const [kx, ky] = pos(f), tl = tilt(f), rot = (x, y, r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
        g.globalAlpha = a; g.lineCap = g.lineJoin = "round";
        // string
        const [bx, by] = rot(0, 0.15 * K, tl); g.strokeStyle = d ? "rgba(230,240,235,.55)" : "rgba(40,60,50,.45)"; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(kx + bx, ky + by); g.quadraticCurveTo((kx + ax) / 2 + W * 0.05, Math.max(ky, ay) + H * 0.02, ax, ay); g.stroke();
        // tail: follows where the kite was a moment ago
        const [tx, ty] = rot(0, 1.05 * K, tl), pts = []; for (let j = 0; j <= 16; j++) { const [hx] = pos(f - j * 1.6), w = Math.sin(f * 0.22 - j * 0.7) * K * 0.07 * Math.min(1, j / 3); pts.push([kx + tx + (hx - kx) * 0.55 + w, ky + ty + j * K * 0.11]); }
        g.strokeStyle = d ? "#F2EEDC" : "#4A4A5A"; g.lineWidth = 1.6; g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
        const bowC = ["#E8463C", "#F2B53A", "#3A86D8", "#3FAE6A"];
        pts.forEach(([x, y], j) => { if (j % 3 !== 2) return; const s = K * 0.12 * (1 - j / 34); g.fillStyle = bowC[Math.floor(j / 3) % 4]; g.beginPath(); g.moveTo(x, y); g.lineTo(x - s * 1.4, y - s); g.lineTo(x - s * 1.4, y + s); g.closePath(); g.moveTo(x, y); g.lineTo(x + s * 1.4, y - s); g.lineTo(x + s * 1.4, y + s); g.closePath(); g.fill(); });
        // the kite: four colored panels, spars and a little shading
        g.save(); g.translate(kx, ky); g.rotate(tl);
        const T = [0, -K], R = [0.64 * K, -0.16 * K], B = [0, 1.05 * K], L = [-0.64 * K, -0.16 * K], C = [0, -0.16 * K];
        [[T, R, "#E8463C"], [R, B, "#F2B53A"], [B, L, "#3A86D8"], [L, T, "#3FAE6A"]].forEach(([p, q, c], i) => { g.fillStyle = i % 2 ? fxShade(c, 0.9) : c; g.beginPath(); g.moveTo(C[0], C[1]); g.lineTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.closePath(); g.fill(); });
        const sh = g.createLinearGradient(-0.5 * K, -K, 0.5 * K, K); sh.addColorStop(0, "rgba(255,255,255,.28)"); sh.addColorStop(0.5, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,0,0,.16)");
        g.fillStyle = sh; g.beginPath(); g.moveTo(T[0], T[1]); g.lineTo(R[0], R[1]); g.lineTo(B[0], B[1]); g.lineTo(L[0], L[1]); g.closePath(); g.fill();
        g.strokeStyle = d ? "rgba(255,255,255,.75)" : "rgba(70,45,30,.6)"; g.lineWidth = Math.max(1.4, K * 0.022); g.beginPath(); g.moveTo(T[0], T[1]); g.lineTo(B[0], B[1]); g.moveTo(L[0], L[1]); g.lineTo(R[0], R[1]); g.stroke();
        g.restore(); }},
    tag: "Wind turbines turning over a green valley with solar fields, a winding river and a little farm"
  });
  MAJ_THEMES.push({
    skin: {id: "sketchcity", name: "Sketch City", desc: "A city skyline drawn on drafting paper, from sketch to finished.",
      light: ["#F6F3EA", "rgba(47,94,158,.10)", "#FFFEFA", "#1C2533", "#5E6878", "#E0DED4", "#ECE9DF", "#FCFBF7", "#2F5E9E", "#5580B8", "#FFFFFF", "#1E3E6E", "#22395A", "#D6E2F2", "#FFE7A0"],
      dark: ["#0C2246", "rgba(168,212,255,.08)", "#12305C", "#EAF3FF", "#A6BEDC", "#24477A", "#1A3B6A", "#0F2850", "#A8D4FF", "#C8E4FF", "#0C2246", "#3E6AA0", "#081A38", "#CFE2F8", "#3E5A80"],
      glow: ["linear-gradient(180deg,#F8F5EC,#F1EDE1)", "linear-gradient(180deg,#123466,#0C2650)"],
      spine: [lg("#34557F", "#22395A"), lg("#123566", "#081A38")], btn: [lg2("#2F5E9E", "#4A78B4"), lg2("#A8D4FF", "#D2E8FF")]},
    kit: {motif: "house", card: ["#FDFCF7", "#EEEBE0"], ink: "#1C2533", bd: "#D6D3C6", mc: "#2F5E9E", r: 6, notes: ["#DCE6F2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "gridnote", pin: "tape", fab: "8px", btn: "6px"},
    // a skyline sketches itself along the bottom in pencil, block by block, then each building washes in with watercolor and its windows light up; paper planes glide over it
    fx: {spawn: (W, H, d, n) => { scB.length = 0; let x = -W * 0.02; const ph = W < H;
      while (x < W) { const w = W * fxR(ph ? 0.12 : 0.06, ph ? 0.2 : 0.11), h = H * fxR(ph ? 0.12 : 0.16, ph ? 0.3 : 0.42); scB.push({x, w, h, t0: Math.floor(scB.length * 6 + fxR(0, 6)), c: fxPick(d ? ["#7FB2F0", "#F29A7A", "#6FD0B8", "#F2CC6A", "#B9A2F0"] : ["#2F5E9E", "#C0603A", "#3A8A7A", "#E8A42A", "#7A5EC8"]), roof: fxPick([0, 0, 1, 2])}); x += w * fxR(0.85, 1.02); }
      const planes = Array.from({length: n(5)}, (_, i) => { const lr = i % 2 === 0, sp = fxR(3, 4.4), an = -fxR(0.08, 0.3);
        return {shape: "plane", c: fxPick(d ? ["#FFFFFF", "#FFE3A8", "#FFB3D9"] : ["#FF6F91", "#4FA0E8", "#F2A23A", "#3FB8AA"]), x: lr ? fxR(-60, -10) : W + fxR(10, 60), y: fxR(H * 0.2, H * 0.5), vx: (lr ? 1 : -1) * Math.cos(an) * sp, vy: Math.sin(an) * sp, g: 0.004, size: fxR(14, 18), face: true, wig: 0.04, rot: 0, vr: 0, sway: 0.4, swf: 0.04, life: 240, delay: 30 + Math.floor(fxR(0, 80))}; });
      return planes.concat(fxTw(W, H, n(20), "star", d ? ["#FFFFFF", "#A8D4FF", "#FFE38A"] : ["#FF6F91", "#F2B53A", "#4FD1C5", "#9B7BF0"], {smin: 4, smax: 7, top: 0.55, glow: d ? 10 : 2}).map(p => Object.assign(p, {delay: 60 + Math.floor(fxR(0, 90))}))); },
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 175) / 60); if (a <= 0.01) return;
        const pen = d ? "rgba(225,238,255,.85)" : "rgba(40,56,84,.8)"; g.lineCap = g.lineJoin = "round";
        scB.forEach(b => { const t = f - b.t0; if (t <= 0) return; const x0 = b.x, x1 = b.x + b.w, top = H - b.h, rh = b.roof === 1 ? b.w * 0.35 : b.roof === 2 ? b.w * 0.25 : 0;
          const pts = [[x0, H + 2], [x0, top], ...(b.roof === 1 ? [[(x0 + x1) / 2, top - rh]] : b.roof === 2 ? [[x0 + b.w * 0.3, top], [x0 + b.w * 0.3, top - rh], [x0 + b.w * 0.7, top - rh], [x0 + b.w * 0.7, top]] : []), [x1, top], [x1, H + 2]];
          const wash = fxEase((t - 26) / 24); if (wash > 0) { g.globalAlpha = a * wash * (d ? 0.3 : 0.24); g.fillStyle = b.c; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
            // windows
            const cw = Math.max(5, b.w * 0.14), gap = cw * 0.9, cols = Math.max(1, Math.floor((b.w - gap) / (cw + gap))), rows = Math.floor((b.h - gap * 2) / (cw * 1.3 + gap)), ox = x0 + (b.w - cols * (cw + gap) + gap) / 2;
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const on = fxEase((t - 40 - ((r * 7 + c * 13) % 17)) / 8); if (on <= 0) continue; g.globalAlpha = a * on * (((r * 3 + c * 5) % 4) ? 0.55 : 0.85); g.fillStyle = d ? "#FFE38A" : b.c; g.fillRect(ox + c * (cw + gap), top + gap * 1.5 + r * (cw * 1.3 + gap), cw, cw * 1.3); } }
          // pencil outline traced along the edge, with a light overshoot at the corners
          let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); let left = L * Math.min(1, t / 26);
          g.globalAlpha = a; g.strokeStyle = pen; g.lineWidth = 1.6; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length && left > 0; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), u = Math.min(1, left / l); g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); left -= l; } g.stroke(); }); }},
    tag: "A skyline on drafting paper, from pencil sketch to scaffolding to finished color, with cranes at work"
  });
})();































