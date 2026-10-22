/* ===== module: 20-scenes-maj-m4.js ===== */
/* Study Fields themes, batch m4: concert, track, math, chem */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];

  /* ---------- Concert Hall (Music) ---------- */
  MAJ_THEMES.push({
    skin: {id: "concert", name: "Concert Hall",
      light: ["#F7EFE6", "rgba(168,48,62,.10)", "#FFFCF8", "#2E1418", "#74585A", "#EBDCD0", "#F3E6DC", "#FDF9F5", "#A8303E", "#C05A64", "#FFFFFF", "#6E1C28", "#6E1C28", "#F2D6D8", "#F5D9A0"],
      dark: ["#170B12", "rgba(240,194,122,.08)", "#22121B", "#F8ECEC", "#C8A8AE", "#3E2430", "#2E1824", "#1B0E15", "#F0C27A", "#F5D49A", "#2A1208", "#8A5A36", "#1C0A10", "#F2D6D8", "#6E4A26"],
      glow: ["linear-gradient(180deg,#EAD3BE,#F1DFCB 50%,#E6C9AE)", "linear-gradient(180deg,#140A16,#22101E 45%,#2E1520)"],
      spine: [lg("#9A2C3A", "#6E1C28"), lg("#3A1420", "#1C0A10")], btn: [lg2("#A8303E", "#B8562E"), lg2("#F0C27A", "#F5D49A")]},
    kit: {motif: "note", card: ["#FFFAF5", "#F5E4DC"], ink: "#2E1418", bd: "#E6C8C4", mc: "#A8303E", r: 14, notes: ["#F2D6D8"].concat(NOTES), shape: "lined", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(46), "note", d ? ["#FFD27A", "#FF9CC8", "#8FE0FF", "#C8A8FF", "#9CF0C0"] : ["#E8457A", "#F0A020", "#2EB8B0", "#7C6CE0", "#4E9CE8"], {smin: 10, smax: 16, sway: 1.8, vmin: 1.4, vmax: 2.8, glow: d ? 8 : 0})
      .concat(fxRise(W, H, n(8), "balloon", ["#FF6FA8", "#FFC94A", "#5ED6C4", "#7EB6FF", "#B88CFF"], {smin: 14, smax: 20, vmin: 1, vmax: 1.8, sway: 1, life: 300}).map(p => Object.assign(p, {rot: fxR(-0.15, 0.15)})),
        fxFall(W, H, n(50), "confetti", ["#FF6FA8", "#FFC94A", "#5ED6C4", "#7EB6FF", "#B88CFF"], {sway: 1.6, flip: true, smin: 5, smax: 8}), fxTw(W, H, n(20), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#E8A93A", "#F2C24A"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A concert hall where a conductor leads the show under rainbow stage lights, fairy lights and a twirling mirror ball"
  });

  /* ---------- Track and Field (Kinesiology) ---------- */
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
      medal: {d: "M-4.6 -11H-1.2L1.6 -3.4H-1.6Z M4.6 -11H1.2L-1.6 -3.4H1.6Z M-6.4 3.2a6.4 6.4 0 1 0 12.8 0a6.4 6.4 0 1 0 -12.8 0Z", detail: "M-3.8 3.2a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0 -7.6 0", dstroke: true}
    },
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(50), "confetti", ["#E0504A", "#3E74D0", "#F2C230", d ? "#FFFFFF" : "#2E9E6A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 5, smax: 8, flip: true})
      .concat(fxBurst(W, H, n(8), "medal", ["#F2C24A", "#E8B23A", "#C9CED6", "#D08A4A"], [[0.3, 1.02], [0.7, 1.02]], {smin: 12, smax: 16, glow: d ? 10 : 0}),
        fxBurst(W, H, n(4), "trophy", ["#F2C24A", "#E8B23A"], [[0.5, 1.04]], {smin: 15, smax: 19, glow: d ? 12 : 4}),
        fxFall(W, H, n(5), "bball", ["#E8803A", "#F08A3A"], {vmin: 3, vmax: 5, sway: 0, smin: 13, smax: 17}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08)})),
        fxFall(W, H, n(3), "ball", ["#3E74D0", "#E0504A", "#2E9E6A"], {vmin: 3, vmax: 5, sway: 0, smin: 13, smax: 17}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08)})),
        fxRise(W, H, n(5), "whistle", d ? ["#C9CED6", "#F2C24A"] : ["#8A94A6", "#E8B23A"], {smin: 11, smax: 15, vmin: 1.6, vmax: 2.6}).map(p => Object.assign(p, {rot: fxR(-0.4, 0.4)})))},
    tag: "A golden-hour stadium with a running track, a marked football and soccer field, a high jump and a big scoreboard"
  });

  /* ---------- Infinite Grid (Mathematics) ---------- */
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
      pisym: {d: "M-9 -6.6C-4 -8.4 4 -8.6 9.4 -7.4L9 -4.6C7.6 -4.9 5.8 -5 4.4 -5C4.2 -1 4.2 4 6.8 6.6C7.6 7.4 8.6 7.2 9.2 6.4L10 7.6C8.8 9.6 5.8 10.2 4 8.4C1.4 5.6 1.4 0 1.8 -5.1L-2.6 -5C-2.8 0 -3.6 5.6 -5.8 9.2L-8.6 8.4C-6.2 4.6 -5.6 0 -5.4 -4.9C-6.8 -4.8 -8 -4.6 -9.4 -4.2Z"}
    },
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(30), "cube3", d ? ["#FF8AC8", "#6FF0D0", "#FFD86A", "#8AC4FF", "#C8A8FF"] : ["#E8588E", "#2EB894", "#E8A420", "#4A8EE8", "#8A66E0"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 8, smax: 12})
      .concat(fxRise(W, H, n(16), "pisym", d ? ["#FFE3A0", "#FF9AD0", "#8AF0E0"] : ["#6A4FC0", "#E8588E", "#2EB894"], {smin: 9, smax: 14, sway: 1.2, vmin: 1.2, vmax: 2.2}), fxTw(W, H, n(10), "spiral", d ? ["#FFD478"] : ["#D69634"], {smin: 12, smax: 20, glow: d ? 10 : 0}), fxTw(W, H, n(20), "sparkle", d ? ["#FFE9B0", "#A6E9FF"] : ["#E8A93A", "#B9A2F0"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A candy geometry world where smiling shapes bounce, polygon kites fly and rainbow dice roll by"
  });

  /* ---------- Chem Lab (Chemistry) ---------- */
  MAJ_THEMES.push({
    skin: {id: "chem", name: "Chem Lab",
      light: ["#EFF7F4", "rgba(46,138,128,.10)", "#FFFFFF", "#16302C", "#526A66", "#D4E6E1", "#E3EFEB", "#F8FCFB", "#2E8A80", "#55A39A", "#FFFFFF", "#1C5A52", "#256058", "#CDEBE5", "#FFD9E8"],
      dark: ["#0C1826", "rgba(111,230,214,.08)", "#142334", "#E8F6F8", "#A2BCC6", "#24384C", "#1A2C3E", "#0F1C2A", "#6FE6D6", "#9AEEE2", "#0A1A20", "#2E7A74", "#0C1826", "#C8EAF0", "#6A3A56"],
      glow: ["linear-gradient(180deg,#EDF6F2,#E3F0EB 55%,#D9EBE4)", "linear-gradient(180deg,#132238,#1A2E46 55%,#203752)"],
      spine: [lg("#3E8E86", "#256058"), lg("#1C3348", "#0C1826")], btn: [lg2("#2E8A80", "#C0568E"), lg2("#6FE6D6", "#FF8FC4")]},
    kit: {motif: "flask", card: ["#F7FCFB", "#E2F2EE"], ink: "#16302C", bd: "#B8DED6", mc: "#2E8A80", r: 16, notes: ["#D6F0EA"].concat(NOTES), shape: "rounded", pin: "clip", fab: "999px", btn: "12px"},
    shapes: {
      flask: {d: "M-3.2 -11H3.2V-9.6H2.4V-4.2L8.8 6.6C9.8 8.4 8.6 10.4 6.6 10.4H-6.6C-8.6 10.4 -9.8 8.4 -8.8 6.6L-2.4 -4.2V-9.6H-3.2Z", detail: "M-6.4 3.4H6.4", dstroke: true},
      molecule: {d: "M-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0Z M4.4 -7.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z M-8.6 -5a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z M0.8 6.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0Z", detail: "M0 0L6.5 -7.4M0 0L-6.5 -5M0 0L2.9 6.4", dstroke: true}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(40), "bubble", d ? ["#FF8FC4", "#6FE6D6", "#FFD36A", "#C0A0FF"] : ["#F584AE", "#46C2BA", "#E8A830", "#A58AEA"], {smin: 6, smax: 14, sway: 1.3, vmin: 1.4, vmax: 2.8, glow: d ? 8 : 0})
      .concat(fxBurst(W, H, n(10), "flask", d ? ["#6FE6D6", "#FF8FC4"] : ["#2E8A80", "#C0568E"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {rot: fxR(-0.35, 0.35), vr: fxR(-0.04, 0.04)})), fxRise(W, H, n(8), "molecule", d ? ["#C8EAF0", "#FFD36A"] : ["#5E6878", "#2E8A80"], {smin: 11, smax: 16, vmin: 1, vmax: 1.8}).map(p => Object.assign(p, {vr: fxR(-0.02, 0.02)})),
      fxBurst(W, H, n(40), "confetti", ["#FF6FA8", "#FFC94A", "#5ED6C4", "#7EB6FF", "#B88CFF"], [[0.15, 1.02], [0.85, 1.02]], {smin: 5, smax: 8, flip: true}), fxTw(W, H, n(16), "sparkle", d ? ["#FFE9B8", "#A6E9FF"] : ["#F2B53A", "#FF8FB4"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A bubbly lab with rainbow flasks, a lava lamp, smoke rings and molecules floating by"
  });
})();

