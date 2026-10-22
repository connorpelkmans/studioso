/* ===== module: 20-scenes-maj-m1.js ===== */
/* Study Fields themes, batch m1: business, nursing, psych, biology */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

  /* ---------- Market District (Business) ---------- */
  MAJ_THEMES.push({
    skin: {id: "business", name: "Market District", desc: "Glass towers, a stock ticker and a rising chart line.",
      light: ["#EEF2F6", "rgba(35,136,90,.10)", "#FFFFFF", "#16243A", "#56657A", "#D5DDE6", "#E5EBF1", "#F7F9FB", "#23885A", "#4FA77C", "#FFFFFF", "#155C3C", "#26405F", "#CFE0F0", "#FFE3A0"],
      dark: ["#0F1129", "rgba(124,240,168,.07)", "#181A38", "#F1F0FA", "#B0AECB", "#2C2E58", "#22244A", "#13152F", "#7CF0A8", "#9CF5BF", "#0E1A20", "#3E7A5A", "#121430", "#D2D0F0", "#4A6A3A"],
      glow: ["linear-gradient(180deg,#86C3F2,#BCCBF4 28%,#F7C6DC 58%,#FFC28C)", "linear-gradient(180deg,#120E36,#271B58 34%,#4F2A70 64%,#C85E7E)"],
      spine: [lg("#3D5E86", "#26405F"), lg("#25285A", "#121430")], btn: [lg2("#23885A", "#2E9E6A"), lg2("#7CF0A8", "#9CF5BF")]},
    kit: {motif: "bizchart", card: ["#F6F9FC", "#E2EAF2"], ink: "#16243A", bd: "#BCCCDD", mc: "#2E9E6A", r: 10, notes: ["#D6EEDF"].concat(NOTES), shape: "gridnote", pin: "binder", fab: "12px", btn: "10px"},
    shapes: {
      bizchart: {d: "M-10 3H-5.6V10H-10Z M-3 -0.6H1.4V10H-3Z M4 -4H8.4V10H4Z M2.4 -11.2H10.4V-3.2L7.6 -6L1.8 -0.2L-0.6 -2.6L5.2 -8.4Z"},
      bizarrow: {d: "M0 -10.5L8.6 -1.2H3.4V10H-3.4V-1.2H-8.6Z"}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "coin", d ? ["#FFD27A", "#F6C453", "#FFE3A8"] : ["#E8B030", "#F2C24A", "#D49A20"], {smin: 9, smax: 14, vmin: 1.3, vmax: 2.5, sway: 0.8, life: 270, glow: d ? 8 : 0}).map(p => Object.assign(p, {flip: true}))
      .concat(fxRise(W, H, n(14), "bizarrow", d ? ["#7CF0A8", "#9CF5BF"] : ["#2E9E6A", "#23885A", "#4FBF84"], {smin: 8, smax: 12, vmin: 1.8, vmax: 3, sway: 0.3, life: 240, glow: d ? 8 : 0}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#9CF5BF"] : ["#F2B53A", "#FFD86B", "#4FBF84"], {smin: 3, smax: 6, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => { // a thin chart line climbs across the lower screen
        const p = Math.min(1, f / 80), a = f < 170 ? 1 : Math.max(0, 1 - (f - 170) / 40); if (a <= 0) return;
        const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([W * (0.04 + 0.92 * u), H * (0.92 - 0.3 * (0.7 * u + 0.3 * u * u)) + (i % 2 ? 1 : -1) * H * 0.018 * (i && i < 10 ? 1 : 0)]); }
        const L = Math.max(1, Math.floor(p * 10)), fr = p * 10 - L + 1;
        g.save(); g.globalAlpha = a * 0.75; g.lineJoin = g.lineCap = "round"; g.shadowBlur = 14; g.shadowColor = d ? "#7CF0A8" : "#4FBF84"; g.strokeStyle = d ? "#9CF5BF" : "#2E9E6A"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < L; i++) g.lineTo(pts[i][0], pts[i][1]);
        const q = pts[L - 1], r = pts[Math.min(10, L)], e = [q[0] + (r[0] - q[0]) * Math.min(1, fr), q[1] + (r[1] - q[1]) * Math.min(1, fr)]; g.lineTo(e[0], e[1]); g.stroke();
        g.shadowBlur = 0; g.fillStyle = d ? "#E8FFF0" : "#FFFFFF"; g.beginPath(); g.arc(e[0], e[1], 4, 0, 7); g.fill(); g.restore(); }},
    tag: "An evening financial district with glass towers, a scrolling stock ticker and a glowing chart line"
  });

  /* ---------- Night Shift (Nursing) ---------- */
  MAJ_THEMES.push({
    skin: {id: "nursing", name: "Night Shift", desc: "A cozy nurses' station by a window over the city.",
      light: ["#F1F6F4", "rgba(46,140,120,.10)", "#FFFFFF", "#163130", "#55706C", "#D4E3DF", "#E4EFEC", "#F8FBFA", "#2E8C78", "#5BA898", "#FFFFFF", "#1E5E50", "#24524C", "#CDEBE4", "#FFD9C8"],
      dark: ["#10142A", "rgba(125,224,190,.07)", "#191E36", "#EEF2F8", "#A9B2C8", "#2B3150", "#222842", "#141831", "#7DE0BE", "#A6EED4", "#0E1E1C", "#3D6E64", "#0E1226", "#CFE8E2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#9FC0E4,#D9D6EA 40%,#F8D2BE 70%,#F6B595)", "linear-gradient(180deg,#0E1430,#1E2552 45%,#2F2F62)"],
      spine: [lg("#3B7A72", "#24524C"), lg("#1E2546", "#0E1226")], btn: [lg2("#2E8C78", "#3FA08A"), lg2("#7DE0BE", "#A6EED4")]},
    kit: {motif: "pulseheart", card: ["#F6FBFA", "#E0F0EC"], ink: "#163130", bd: "#A9D8CC", mc: "#E8708C", r: 18, notes: ["#FFDCE4"].concat(NOTES), shape: "rounded", pin: "clip", fab: "999px", btn: "14px"},
    shapes: {
      pulseheart: {d: "M0 9C-8 3.4 -10.4 -1.6 -9.2 -5.2C-8 -9 -2.4 -9.6 0 -5C2.4 -9.6 8 -9 9.2 -5.2C10.4 -1.6 8 3.4 0 9Z", detail: "M-8.4 -0.6H-4.4L-2.6 -4.2L0.4 3L2.4 -0.6H8.4", dstroke: true}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(18), "heart", d ? ["#FF9DB4", "#F6B3C4", "#FFD0DA"] : ["#E8708C", "#F29AAE", "#F7B6C4"], {smin: 8, smax: 13, vmin: 1.1, vmax: 2.2, sway: 1, life: 280, glow: d ? 10 : 0})
      .concat(fxRise(W, H, n(7), "pulseheart", d ? ["#7DE0BE", "#A6EED4"] : ["#2E8C78", "#3FA08A"], {smin: 12, smax: 16, vmin: 1, vmax: 1.6, sway: 0.6, life: 300, glow: d ? 10 : 0}),
        fxTw(W, H, n(24), "sparkle", d ? ["#FFFFFF", "#A6EED4", "#FFD0DA"] : ["#F2B53A", "#7CCFB6", "#F29AAE"], {smin: 3, smax: 6, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => { // a heartbeat line sweeps across the bottom of the screen
        const p = Math.min(1, f / 110), a = f < 160 ? 1 : Math.max(0, 1 - (f - 160) / 40); if (a <= 0) return;
        const y0 = H * 0.86, beat = Math.max(60, W / 5), amp = Math.min(46, H * 0.06), xe = W * p;
        g.save(); g.globalAlpha = a * 0.8; g.lineJoin = g.lineCap = "round"; g.shadowBlur = 12; g.shadowColor = d ? "#7DE0BE" : "#5BA898"; g.strokeStyle = d ? "#A6EED4" : "#2E8C78"; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(0, y0);
        for (let x = 0; x <= xe; x += 3) { const u = (x % beat) / beat; let y = y0; if (u > 0.4 && u < 0.46) y = y0 - amp * 0.18 * Math.sin((u - 0.4) / 0.06 * Math.PI); else if (u > 0.5 && u < 0.54) y = y0 + amp * 0.25 * ((u - 0.5) / 0.04); else if (u >= 0.54 && u < 0.58) y = y0 + amp * 0.25 - amp * 1.25 * ((u - 0.54) / 0.04); else if (u >= 0.58 && u < 0.63) y = y0 - amp + amp * 1.3 * ((u - 0.58) / 0.05); else if (u >= 0.63 && u < 0.66) y = y0 + amp * 0.3 * (1 - (u - 0.63) / 0.03); g.lineTo(x, y); }
        g.stroke(); g.shadowBlur = 0; g.fillStyle = d ? "#FFFFFF" : "#FFFFFF"; g.beginPath(); g.arc(xe, y0, 3.5, 0, 7); g.fill(); g.restore(); }},
    tag: "A cozy nurses' station by a big window, with a desk lamp, a warm mug and a glowing heartbeat line"
  });

  /* ---------- Mind Garden (Psychology) ---------- */
  MAJ_THEMES.push({
    skin: {id: "psych", name: "Mind Garden", desc: "A dreamy pastel garden of hedges, thought bubbles and butterflies.",
      light: ["#F5F2FA", "rgba(122,92,184,.10)", "#FFFFFF", "#251C3A", "#625A76", "#E1DAEC", "#ECE6F5", "#FBF9FD", "#7A5CB8", "#9A80CC", "#FFFFFF", "#523A85", "#463872", "#E2D8F6", "#FFE3B0"],
      dark: ["#141030", "rgba(255,192,138,.07)", "#1E1940", "#F4F0FB", "#BBB0D4", "#352E5C", "#29224E", "#181337", "#FFC08A", "#FFD6AE", "#221838", "#8A6A5A", "#120E2C", "#DCD0F2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#B4B4F4,#D6C4F6 30%,#F8C8E6 60%,#BDEAC8)", "linear-gradient(180deg,#191540,#3A2D68 45%,#7A4F86 75%,#B8708A)"],
      spine: [lg("#6A58A0", "#463872"), lg("#2E2560", "#141030")], btn: [lg2("#7A5CB8", "#9A6CC0"), lg2("#FFC08A", "#FFD6AE")]},
    kit: {motif: "thought", card: ["#FBF8FF", "#ECE4F8"], ink: "#251C3A", bd: "#D6C8EE", mc: "#9A6CC0", r: 22, notes: ["#E8DCF8"].concat(NOTES), shape: "cloud", pin: "pin", fab: "999px", btn: "999px"},
    shapes: {
      thought: {d: c(-4, -3, 5) + c(2, -5, 5.6) + c(6.4, 0, 4.4) + c(0, 1.6, 5) + c(-7.4, 7.6, 2) + c(-10, 10.6, 1.2)},
      idea: {d: "M0 -10.4C5 -10.4 7.4 -6.6 7.4 -3.4C7.4 0 5 2 3.6 4V5.6H-3.6V4C-5 2 -7.4 0 -7.4 -3.4C-7.4 -6.6 -5 -10.4 0 -10.4Z M-3.4 6.8H3.4V8.2H-3.4Z M-2.4 9.2H2.4V10.6H-2.4Z", detail: "M-1.6 3.6V-1.2L0 0.4L1.6 -1.2V3.6", dstroke: true},
      inkfly: {d: "M0.4 -1C2.4 -8.6 10.2 -10.4 10.6 -5C10.8 -2.4 8 -1.4 9.4 1.4C11.2 5 6.6 9.6 3.4 6.6C1.8 5.2 1 3 0.4 1Z M-0.4 -1C-2.4 -8.6 -10.2 -10.4 -10.6 -5C-10.8 -2.4 -8 -1.4 -9.4 1.4C-11.2 5 -6.6 9.6 -3.4 6.6C-1.8 5.2 -1 3 -0.4 1Z",
        detail: "M3.4 -5.2a1.7 2.3 0 1 0 3.4 0a1.7 2.3 0 1 0 -3.4 0Z M-6.8 -5.2a1.7 2.3 0 1 0 3.4 0a1.7 2.3 0 1 0 -3.4 0Z M4 3.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z M-6.6 3.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z M-0.7 -4H0.7V6H-0.7Z", dfill: true}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "thought", d ? ["#E6DCFF", "#FFE0EC", "#FFFFFF"] : ["#B9A2E8", "#E8B6CC", "#A6C4EC"], {smin: 12, smax: 18, vmin: 0.9, vmax: 1.7, sway: 1, life: 300, alpha: 0.9, glow: d ? 10 : 0})
      .concat(fxTw(W, H, n(10), "idea", d ? ["#FFE08A", "#FFD27A"] : ["#F2B53A", "#F6C453"], {smin: 9, smax: 13, glow: 12}),
        fxFlutter(W, H, n(8), d ? ["#F6C7E0", "#C9B8FF", "#FFD6AE"] : ["#9A6CC0", "#E08AA8", "#6A8AD0"]).map(p => Object.assign(p, {shape: "inkfly"})),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFFFFF", "#FFD6AE"] : ["#F2B53A", "#C9A0E8"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A dreamy pastel garden with rounded hedges, a still pond, drifting thought bubbles and inkblot butterflies"
  });

  /* ---------- Cell Garden (Biology) ---------- */
  MAJ_THEMES.push({
    skin: {id: "biology", name: "Cell Garden", desc: "A microscope view of drifting cells and tiny swimmers.",
      light: ["#F6F3EC", "rgba(58,138,114,.10)", "#FFFEFB", "#1E2A26", "#5E6A64", "#E3DED2", "#EEEAE0", "#FBFAF6", "#3A8A72", "#62A690", "#FFFFFF", "#285E4E", "#2E4A44", "#D8ECE4", "#FFE3B8"],
      dark: ["#070D1E", "rgba(92,242,196,.07)", "#0F1830", "#E8F4F8", "#9CB0C4", "#1E2C4A", "#16223E", "#0B1326", "#5CF2C4", "#8AF7D8", "#06141A", "#2C7A68", "#050A18", "#BDE6F0", "#2A5A66"],
      glow: ["radial-gradient(75% 75% at 50% 48%,#FFFEF6,#FEF2EE 50%,#E4D0E6)", "radial-gradient(75% 75% at 50% 48%,#1E2E72,#141E52 55%,#070A20)"],
      spine: [lg("#4A7068", "#2E4A44"), lg("#102044", "#050A18")], btn: [lg2("#3A8A72", "#4AA088"), lg2("#5CF2C4", "#8AF7D8")]},
    kit: {motif: "cell", card: ["#FDFBF6", "#EAF2EC"], ink: "#1E2A26", bd: "#BFDCCD", mc: "#3A8A72", r: 20, notes: ["#DDF0E4"].concat(NOTES), shape: "circle", pin: "magnet", fab: "999px", btn: "12px"},
    shapes: {
      cell: {d: c(0, 0, 10), detail: c(2, -1.6, 3.8) + c(-4.6, 3.6, 1.4) + c(-3, -5, 1.1), dfill: true},
      helix: {d: "M-5 -11C5 -6.5 5 -5.5 0 0C-5 5.5 -5 6.5 5 11M5 -11C-5 -6.5 -5 -5.5 0 0C5 5.5 5 6.5 -5 11M-3.2 -8.4H3.2M-3.2 8.4H3.2M-2.6 -3.4H2.6M-2.6 3.4H2.6", stroke: true, lw: 1.8},
      diatom: {d: "M-10.6 0C-6.4 -4.6 6.4 -4.6 10.6 0C6.4 4.6 -6.4 4.6 -10.6 0Z", detail: "M-6.6 -2.4V2.4M-3.4 -3.2V3.2M0 -3.4V3.4M3.4 -3.2V3.2M6.6 -2.4V2.4", dstroke: true}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "cell", d ? ["#5CF2C4", "#8AD8FF", "#FF7AC6"] : ["#7CC46A", "#E896B0", "#8FC8D8"], {smin: 9, smax: 15, vmin: 0.9, vmax: 1.8, sway: 1.1, life: 300, alpha: 0.85, glow: d ? 12 : 0}).map(p => Object.assign(p, {vr: fxR(-0.02, 0.02)}))
      .concat(fxRise(W, H, n(7), "helix", d ? ["#8AF7D8", "#B8A6FF"] : ["#3A8A72", "#9A6CC0"], {smin: 12, smax: 16, vmin: 1.2, vmax: 2, sway: 0.6, life: 260, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(-0.5, 0.5), vr: fxR(-0.02, 0.02)})),
        fxRise(W, H, n(8), "diatom", d ? ["#FFD36A", "#FFE6A0"] : ["#D4A24A", "#C9A060"], {smin: 8, smax: 12, vmin: 1, vmax: 1.8, sway: 0.8, life: 280, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(0, 6.3), vr: fxR(-0.015, 0.015)})),
        fxRise(W, H, n(30), "circle", d ? ["#BDE6F0", "#8AF7D8"] : ["#FFFFFF", "#B8D8C8"], {smin: 1.5, smax: 3.2, vmin: 1.4, vmax: 2.6, sway: 0.6, alpha: 0.8}))},
    tag: "A microscope view of drifting cells, diatoms and little swimmers around a faint DNA ribbon"
  });
})();

