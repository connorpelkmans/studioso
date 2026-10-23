/* ===== module: 20-scenes-maj-m3.js ===== */
/* Study Fields themes, batch m3: civics, justice, writing */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];

  /* ---------- Civic Square (Political Science and Law) ---------- */
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
    fx: {spawn: (W, H, d, n) => {
      return fxRise(W, H, n(14), "balloon", d ? ["#FF8FA8", "#7EC8F8", "#FFD45E", "#8FE0A8", "#C9A0FF"] : ["#FF6F91", "#4FB4F0", "#FFC93C", "#5FD08A", "#A88BF5"], {smin: 12, smax: 18, vmin: 1.3, vmax: 2.4, sway: 1, life: 300, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(-0.12, 0.12)})).concat(fxBurst(W, H, n(26), "pennant", d ? ["#E9949A", "#8FB8E0", "#F0CC7A", "#9CCBA6"] : ["#E07A70", "#5E9CCB", "#E8B440", "#6FAF82"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 8, smax: 12, flip: true}),
          fxTw(W, H, n(22), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8B440", "#FFD86B"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4}));
    }},
    tag: "A festival square before a domed courthouse, with kites, balloons and bunting"
  });

  /* ---------- Case Room (Criminal Justice) ---------- */
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
    fx: {spawn: (W, H, d, n) => {
      const papers = fxFall(W, H, n(22), "clue", d ? ["#F8E07C", "#F6B6BE", "#B8D4EA", "#FBF7EE"] : ["#F4D660", "#F2A2AC", "#9CC2E2", "#FFFFFF"], {vmin: 1, vmax: 2, sway: 1.6, smin: 9, smax: 13});
      return papers.concat(fxRise(W, H, n(6), "magnifier", d ? ["#F2A070", "#E8C890"] : ["#8A5A3A", "#B23A30"], {cx: [0.1, 0.9], smin: 10, smax: 15, vmin: 1.2, vmax: 2, sway: 0.8, life: 240, glow: d ? 10 : 0}),
        fxBurst(W, H, n(10), "fingerprint", d ? ["#F07A5E", "#E8C890"] : ["#B23A30", "#8A5A3A"], [[0.15, 1.02], [0.85, 1.02]], {smin: 8, smax: 12}),
        fxTw(W, H, n(18), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8B440", "#F2C24A"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4}));
    }},
    tag: "Neon rain, fairy lights and a corkboard of clues tied with red string in a cozy detective office"
  });

  /* ---------- Writer's Retreat (English) ---------- */
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
    fx: {spawn: (W, H, d, n) => {
      const birds = Array.from({length: n(12)}, () => { const sp = fxR(2.4, 3.6), a = -fxR(0.4, 0.85);
        return {shape: "paperbird", c: fxPick(d ? ["#F6F0E6", "#E8DCC4", "#F6CF94"] : ["#FFFFFF", "#F4EDE0", "#E8DCC8"]), x: fxR(-60, W * 0.6), y: H + fxR(10, 80), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, size: fxR(15, 22), rot: a * 0.5, vr: 0, sway: 0.5, swf: 0.05, life: 260, delay: Math.floor(fxR(0, 70)), glow: d ? 6 : 0}; });
      return birds.concat(fxRise(W, H, n(26), "letter", d ? ["#F6CF94", "#E0D6EA"] : ["#A8553A", "#4A6A5A", "#C0703E"], {smin: 6, smax: 9, vmin: 1.2, vmax: 2.2, sway: 1, life: 220}).map(p => Object.assign(p, {rot: fxR(-0.4, 0.4), vr: fxR(-0.02, 0.02)})),
        fxTw(W, H, n(20), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8B440", "#F2C24A"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4}));
    }},
    tag: "A storybook writing nook where a quill writes by itself and letters drift up like dust motes"
  });
})();

