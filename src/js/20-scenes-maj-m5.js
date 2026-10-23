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
  const streaks = (W, H, n, cols) => Array.from({length: n}, () => { const sp = fxR(8, 12); return {shape: null, streak: true, c: fxPick(cols), x: fxR(W * 0.3, W * 1.15), y: fxR(-40, H * 0.4), vx: -sp, vy: sp * 0.55, g: 0, size: 2, life: 80, delay: Math.floor(fxR(0, 150)), glow: 12}; });

  MAJ_THEMES.push({
    skin: {id: "observatory", name: "Observatory", desc: "A domed observatory on a hill under a huge starry sky.",
      light: ["#F1F0F8", "rgba(79,79,176,.10)", "#FFFFFF", "#1B1D3A", "#5A5C7A", "#DCDCEC", "#E8E7F3", "#F9F9FC", "#4F4FB0", "#7272C4", "#FFFFFF", "#33337A", "#262A5C", "#D6D6F0", "#FFE3A8"],
      dark: ["#0D1030", "rgba(242,196,106,.08)", "#171A3E", "#EEEEFA", "#ABADD0", "#2C2F5A", "#22254D", "#12153A", "#F2C46A", "#F6D592", "#1A1530", "#7A6438", "#0B0E28", "#D2D4F0", "#6A5428"],
      glow: ["linear-gradient(180deg,#84ACDB,#B2CAEB 32%,#E6D1E3 66%,#F9D8C5)", "linear-gradient(180deg,#080C28,#121848 38%,#232766 68%,#3E356C)"],
      spine: [lg("#3E4290", "#262A5C"), lg("#1D2156", "#0B0E28")], btn: [lg2("#4F4FB0", "#7A5BC0"), lg2("#F2C46A", "#F6D592")]},
    kit: {motif: "planet", card: ["#F8F8FD", "#E6E6F5"], ink: "#1B1D3A", bd: "#CFCFEA", mc: "#5A5ACC", r: 18, notes: ["#DCDCF2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "circle", pin: "starpin", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => streaks(W, H, n(7), d ? ["#FFFFFF", "#FFE7B0", "#BFD0FF"] : ["#7A86D8", "#B08AE0", "#5A6AC8"])
      .concat(fxRise(W, H, n(9), "planet", d ? ["#F2C46A", "#9FB4FF", "#E89AB8", "#9ADCC8"] : ["#6A6AD0", "#E08A5A", "#B07AD0", "#4FA0B8"], {smin: 12, smax: 18, vmin: 1.1, vmax: 2, sway: 0.8, life: 300, glow: d ? 10 : 0}).map(p => Object.assign(p, {rot: fxR(-0.3, 0.3)})),
        fxRise(W, H, n(5), "atom", d ? ["#BFD0FF", "#9ADCC8"] : ["#4F4FB0", "#3A8AA8"], {smin: 12, smax: 16, vmin: 1, vmax: 1.7, sway: 0.6, life: 300, glow: d ? 8 : 0}).map(p => Object.assign(p, {vr: fxR(-0.02, 0.02)})),
        fxRise(W, H, n(4), "rocket", d ? ["#FF9AB8", "#FFFFFF", "#FFD86B"] : ["#FF6F91", "#4FA0E8", "#F2A23A"], {smin: 13, smax: 17, vmin: 2.4, vmax: 3.6, sway: 0.4, life: 240, glow: d ? 12 : 4}),
        fxTw(W, H, n(40), "sparkle", d ? ["#FFFFFF", "#FFE7B0", "#C9D4FF", "#FFB3D9"] : ["#F2B53A", "#8C8CE0", "#FFD86B", "#FF8FB3"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A domed observatory on a hilltop, its telescope tracking a sky full of stars"
  });
  MAJ_THEMES.push({
    skin: {id: "ruins", name: "Ancient Ruins", desc: "A gold-trimmed temple above a whitewashed island village and a deep blue sea.",
      light: ["#F1F5FC", "rgba(31,95,184,.10)", "#FFFFFF", "#14213D", "#55627E", "#D6DFEF", "#E5ECF8", "#F8FAFE", "#1F5FB8", "#C9962A", "#FFFFFF", "#163F80", "#123A78", "#D8E4F8", "#F2D27A"],
      dark: ["#0B1430", "rgba(242,196,90,.08)", "#131F42", "#EEF2FC", "#A8B4D4", "#26345E", "#1C2A52", "#0F1A3A", "#F2C45A", "#F6D688", "#1A1404", "#7A6230", "#08102A", "#E2E8F8", "#6A5420"],
      glow: ["linear-gradient(180deg,#3E9CEA,#86C8F4 33%,#FFF2CC 54%,#FFDC8C 60%,#1F78C8)", "linear-gradient(180deg,#081038,#13226A 36%,#2A3A88 60%,#14205A)"],
      spine: [lg("#1F4E96", "#123A78"), lg("#14224E", "#08102A")], btn: [lg2("#1C56AE", "#2E6FC6"), lg2("#F2C45A", "#F6D688")]},
    kit: {motif: "column", card: ["#F8FAFE", "#E4ECF8"], ink: "#14213D", bd: "#C8D6EE", mc: "#C9962A", r: 10, notes: ["#E2EAF7", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "torn", pin: "gold", fab: "14px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(34), "laurel", d ? ["#F2C45A", "#F6D688", "#E0B040"] : ["#E3A928", "#F2C04A", "#C9962A"], {sway: 1.8, flip: true, smin: 9, smax: 13, vmin: 1, vmax: 2, glow: d ? 6 : 0})
      .concat(fxBurst(W, H, n(22), "coin", ["#E9B84A", "#F2CF6E", "#D9A23A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 7, smax: 10, glow: d ? 10 : 0}),
        fxBurst(W, H, n(9), "amphora", d ? ["#C87A50", "#B0683E", "#D8906A"] : ["#D88450", "#C0703E", "#E39A68"], [[0.25, 1.02], [0.75, 1.02]], {smin: 12, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06), rot: fxR(-0.3, 0.3)})),
        fxRise(W, H, n(3), "hourglass", d ? ["#F2C45A"] : ["#C9962A"], {cx: [0.2, 0.8], smin: 14, smax: 18, vmin: 1, vmax: 1.5, sway: 0.6, life: 300, glow: d ? 10 : 0}).map(p => Object.assign(p, {vr: 0, rot: 0})),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFE7B0", "#FFFFFF", "#F2C45A"] : ["#F2B53A", "#FFD86B", "#2F6FD0"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A gold-trimmed temple above a whitewashed island village and a deep blue sea, with an island cat, an owl and doves"
  });
  MAJ_THEMES.push({
    skin: {id: "valley", name: "Green Valley", desc: "A green valley with wind turbines and a winding river.",
      light: ["#EFF6EE", "rgba(47,125,74,.10)", "#FFFFFF", "#15291C", "#55695B", "#D3E4D5", "#E3EFE3", "#F8FBF7", "#2F7D4A", "#55A06A", "#FFFFFF", "#1E5532", "#24533A", "#CDE8D3", "#FFE7A0"],
      dark: ["#0C1A1A", "rgba(143,214,154,.07)", "#132424", "#E8F4EC", "#A2BCAE", "#243B38", "#1B302D", "#0F1F1F", "#8FD69A", "#B2E4B6", "#0F2416", "#4A7A52", "#0A1616", "#C2E0CC", "#4A6A3A"],
      glow: ["linear-gradient(180deg,#A9D3EE,#D7EBF2 50%,#EAF2DA)", "linear-gradient(180deg,#0B1530,#16284A 50%,#2A3D58)"],
      spine: [lg("#3C7A52", "#24533A"), lg("#16302E", "#0A1616")], btn: [lg2("#2F7D4A", "#4A9A5A"), lg2("#8FD69A", "#C2E89A")]},
    kit: {motif: "turbine", card: ["#F7FBF6", "#E2EFE0"], ink: "#15291C", bd: "#C2DCC6", mc: "#2F7D4A", r: 16, notes: ["#D3E8D5", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "pin", fab: "24px 24px 24px 8px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => gust(W, H, n(40), "leaf", d ? ["#7FCB8A", "#A8DC8E", "#5AA86A"] : ["#3E9E4F", "#6CC070", "#8FCF5A", "#2F7A3E"], {vmin: 3.2, vmax: 5.6, sway: 1.6, flip: true, smin: 7, smax: 11})
      .concat(gust(W, H, n(26), "seed", d ? ["#F4F1E6", "#DDEBE0"] : ["#FFFFFF", "#EEF2E6"], {vmin: 2.4, vmax: 4, sway: 2.4, smin: 9, smax: 13, glow: d ? 6 : 3}).map(p => Object.assign(p, {vr: 0.01, rot: fxR(-0.4, 0.4)})),
        fxFlutter(W, H, n(8), d ? ["#FFB3D9", "#FFE38A", "#B8F0FF"] : ["#FF7FA8", "#FFD45A", "#8FD8FF", "#B58CF2"]),
        fxBurst(W, H, n(26), "flower", ["#FF7FA8", "#FFD45A", "#FFFFFF", "#B58CF2"], [[0.15, 1.02], [0.85, 1.02]], {smin: 7, smax: 11}),
        fxTw(W, H, n(26), "circle", d ? ["#F6E68A", "#C8F28A"] : ["#F2D24A", "#B8E07A"], {smin: 1.6, smax: 3, glow: 10, vy: -0.4}))},
    tag: "Wind turbines turning over a green valley with solar fields, a winding river and a little farm"
  });
  MAJ_THEMES.push({
    skin: {id: "sketchcity", name: "Sketch City", desc: "A city skyline drawn on drafting paper, from sketch to finished.",
      light: ["#F6F3EA", "rgba(47,94,158,.10)", "#FFFEFA", "#1C2533", "#5E6878", "#E0DED4", "#ECE9DF", "#FCFBF7", "#2F5E9E", "#5580B8", "#FFFFFF", "#1E3E6E", "#22395A", "#D6E2F2", "#FFE7A0"],
      dark: ["#0C2246", "rgba(168,212,255,.08)", "#12305C", "#EAF3FF", "#A6BEDC", "#24477A", "#1A3B6A", "#0F2850", "#A8D4FF", "#C8E4FF", "#0C2246", "#3E6AA0", "#081A38", "#CFE2F8", "#3E5A80"],
      glow: ["linear-gradient(180deg,#F8F5EC,#F1EDE1)", "linear-gradient(180deg,#123466,#0C2650)"],
      spine: [lg("#34557F", "#22395A"), lg("#123566", "#081A38")], btn: [lg2("#2F5E9E", "#4A78B4"), lg2("#A8D4FF", "#D2E8FF")]},
    kit: {motif: "house", card: ["#FDFCF7", "#EEEBE0"], ink: "#1C2533", bd: "#D6D3C6", mc: "#2F5E9E", r: 6, notes: ["#DCE6F2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "gridnote", pin: "tape", fab: "8px", btn: "6px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "house", d ? ["#EAF3FF", "#A8D4FF"] : ["#2F5E9E", "#C0603A", "#3A8A7A", "#5E6878"], {smin: 12, smax: 18, vmin: 1.1, vmax: 2, sway: 0.7, life: 300, glow: d ? 8 : 0})
      .concat(fxBurst(W, H, n(16), "girder", d ? ["#CFE2F8", "#FFD27F"] : ["#C0603A", "#2F5E9E"], [[0.15, 1.02], [0.85, 1.02]], {smin: 10, smax: 14}),
        fxFall(W, H, n(10), "setsq", d ? ["rgba(168,212,255,.75)", "rgba(255,255,255,.6)"] : ["rgba(47,94,158,.55)", "rgba(192,96,58,.5)"], {sway: 1.2, smin: 12, smax: 16, vmin: 1, vmax: 1.8}),
        Array.from({length: n(6)}, (_, i) => { const lr = i % 2 === 0, sp = fxR(3.2, 4.6), a = -fxR(0.15, 0.45); return {shape: "plane", c: fxPick(d ? ["#FFFFFF", "#FFE3A8", "#FFB3D9"] : ["#FF6F91", "#4FA0E8", "#F2A23A", "#4FD1C5"]), x: lr ? fxR(-60, -10) : W + fxR(10, 60), y: fxR(H * 0.5, H * 0.95), vx: (lr ? 1 : -1) * Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, size: fxR(13, 18), rot: lr ? a : Math.PI - a, vr: 0, sway: 0, life: 260, delay: Math.floor(fxR(0, 80))}; }),
        fxTw(W, H, n(34), "star", d ? ["#FFFFFF", "#A8D4FF", "#FFB3D9", "#FFE38A"] : ["#FF6F91", "#F2B53A", "#4FD1C5", "#9B7BF0"], {smin: 3, smax: 7, glow: d ? 10 : 2})),
      draw: (g, f, W, H, d) => {
        const a = f < 160 ? 1 : Math.max(0, 1 - (f - 160) / 60); if (a <= 0) return;
        g.save(); g.strokeStyle = d ? "rgba(200,225,255,.55)" : "rgba(47,94,158,.45)"; g.lineWidth = 1.2; g.setLineDash([10, 6]); g.globalAlpha = a;
        [[0, 0.82, 1, 0.82, 0], [0.12, 0, 0.12, 1, 14], [1, 0.18, 0, 0.18, 26], [0.9, 1, 0.9, 0, 40]].forEach(([x0, y0, x1, y1, t0]) => { const u = Math.min(1, Math.max(0, (f - t0) / 50)); if (u <= 0) return; const e = 1 - Math.pow(1 - u, 3); g.beginPath(); g.moveTo(x0 * W, y0 * H); g.lineTo((x0 + (x1 - x0) * e) * W, (y0 + (y1 - y0) * e) * H); g.stroke(); });
        g.restore(); }},
    tag: "A skyline on drafting paper, from pencil sketch to scaffolding to finished color, with cranes at work"
  });
})();































