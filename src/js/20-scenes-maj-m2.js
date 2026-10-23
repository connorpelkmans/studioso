/* ===== module: 20-scenes-maj-m2.js ===== */
/* Study Fields themes, batch m2 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // gear outline in the -12..12 box
  const gearD = (() => { let d = ""; const N = 8, R = 10.6, r = 8.2; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, w = Math.PI / N; [[a - w * 0.42, r], [a - w * 0.26, R], [a + w * 0.26, R], [a + w * 0.42, r], [a + w * 0.58, r]].forEach(([b, rr], k) => { d += (i === 0 && k === 0 ? "M" : "L") + (Math.round(rr * Math.cos(b) * 100) / 100) + " " + (Math.round(rr * Math.sin(b) * 100) / 100); }); } return d + "Z M3.4 0a3.4 3.4 0 1 0 -6.8 0a3.4 3.4 0 1 0 6.8 0Z"; })();
  const hexD = (R, r) => { let d = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; d += (i ? "L" : "M") + (Math.round(R * Math.cos(a) * 100) / 100) + " " + (Math.round(R * Math.sin(a) * 100) / 100); } return d + `Z M${r} 0a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0Z`; };

  /* Code Night */
  MAJ_THEMES.push({
    skin: {id: "compsci", name: "Code Night", desc: "A glowing circuit-board city with data pulses.",
      light: ["#EAF6F1", "rgba(31,138,110,.10)", "#FFFFFF", "#12302A", "#4D6B63", "#CFE6DD", "#E0F0E9", "#F6FBF9", "#1B7F66", "#4FA58C", "#FFFFFF", "#145C49", "#1D5E4D", "#C9EDE2", "#FFE7A0"],
      dark: ["#081A22", "rgba(95,230,210,.08)", "#0F2630", "#E3F6F3", "#9CC2BC", "#1E3C48", "#16303B", "#0B1F28", "#5FE6D2", "#9AF0E2", "#062027", "#2B7C74", "#081B24", "#BFEDE6", "#5A4A22"],
      glow: ["radial-gradient(120% 95% at 50% 55%,#E4F5EE,#D2EEE2 60%,#BFE3D4)", "radial-gradient(120% 95% at 50% 55%,#12303F,#0C2230 55%,#081822)"],
      spine: [lg("#2F8A72", "#1D5E4D"), lg("#123544", "#081B24")], btn: [lg2("#1B7F66", "#25967A"), lg2("#5FE6D2", "#9AF0E2")]},
    kit: {motif: "cs_code", card: ["#F5FBF8", "#DFF1E9"], ink: "#12302A", bd: "#A9D8C6", mc: "#1F8A6E", r: 8, notes: ["#D4EEE4"].concat(NOTES), shape: "gridnote", pin: "binder", fab: "10px", btn: "8px"},
    shapes: {
      cs_code: {d: "M-4.6 -6.4L-10.4 0L-4.6 6.4M4.6 -6.4L10.4 0L4.6 6.4M1.8 -8.6L-1.8 8.6", stroke: true, lw: 2.2},
      cs_brace: {d: "M-3.4 -9.4Q-6.6 -9.4 -6.6 -6.2V-2.6Q-6.6 0 -9.4 0Q-6.6 0 -6.6 2.6V6.2Q-6.6 9.4 -3.4 9.4M3.4 -9.4Q6.6 -9.4 6.6 -6.2V-2.6Q6.6 0 9.4 0Q6.6 0 6.6 2.6V6.2Q6.6 9.4 3.4 9.4", stroke: true, lw: 2.2},
      cs_pheart: {d: "M-6 -10H-2V-6H-6ZM2 -10H6V-6H2ZM-10 -6H-6V-2H-10ZM-6 -6H-2V-2H-6ZM-2 -6H2V-2H-2ZM2 -6H6V-2H2ZM6 -6H10V-2H6ZM-10 -2H-6V2H-10ZM-6 -2H-2V2H-6ZM-2 -2H2V2H-2ZM2 -2H6V2H2ZM6 -2H10V2H6ZM-6 2H-2V6H-6ZM-2 2H2V6H-2ZM2 2H6V6H2ZM-2 6H2V10H-2Z"},
      cs_chip: {d: "M-6.5 -6.5H6.5V6.5H-6.5Z M-4.5 -10H-2.5V-6.5H-4.5Z M-1 -10H1V-6.5H-1Z M2.5 -10H4.5V-6.5H2.5Z M-4.5 6.5H-2.5V10H-4.5Z M-1 6.5H1V10H-1Z M2.5 6.5H4.5V10H2.5Z M-10 -4.5H-6.5V-2.5H-10Z M-10 -1H-6.5V1H-10Z M-10 2.5H-6.5V4.5H-10Z M6.5 -4.5H10V-2.5H6.5Z M6.5 -1H10V1H6.5Z M6.5 2.5H10V4.5H6.5Z", detail: "M-3 -3H3V3H-3Z", dfill: true}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(10), "cs_code", d ? ["#8FF5E6", "#FFD08A", "#C9F7F0"] : ["#1F8A6E", "#2FA88A", "#3D9AC2"], {smin: 12, smax: 18, vmin: 1.2, vmax: 2.2, sway: 0.7, glow: d ? 12 : 0, life: 260})
      .concat(fxRise(W, H, n(7), "cs_brace", d ? ["#8FF5E6", "#FFD08A"] : ["#1F8A6E", "#3D9AC2", "#E07A5F"], {smin: 12, smax: 17, vmin: 1, vmax: 1.9, sway: 0.8, glow: d ? 12 : 0, life: 280}),
        fxRise(W, H, n(40), "pixel", d ? ["#5FE6D2", "#9AF0E2", "#FFC77A"] : ["#1F8A6E", "#5FC2A6", "#F2B53A"], {smin: 1.6, smax: 3, vmin: 2.4, vmax: 4.4, sway: 0.2, glow: d ? 8 : 0}),
        fxBurst(W, H, n(18), "cs_pheart", ["#FF6FA8", "#FF8FC0", "#FFD84A", "#B89CFF"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 7, smax: 11, glow: d ? 8 : 0}),
        fxTw(W, H, n(20), "sparkle", d ? ["#C9F7F0", "#FFFFFF"] : ["#2FA88A", "#F2B53A"], {smin: 3, smax: 6, glow: d ? 10 : 3}))},
    tag: "A glowing circuit-board city where data pulses race along the traces and code brackets float"
  });

  /* Gear Works */
  MAJ_THEMES.push({
    skin: {id: "engineering", name: "Gear Works", desc: "A warm workshop wall with turning gears.",
      light: ["#F6F0E8", "rgba(176,94,40,.10)", "#FFFFFF", "#2A2018", "#6E5E50", "#E8DCCD", "#F1E8DD", "#FCF9F5", "#AE5A24", "#C47C4E", "#FFFFFF", "#6E3614", "#26405F", "#F3DCC8", "#FFE3A0"],
      dark: ["#16120F", "rgba(242,166,90,.08)", "#211B16", "#F6EEE6", "#BEAE9E", "#3A3028", "#2C241D", "#1A1511", "#F2A65A", "#F6C08A", "#2A1606", "#8A5A30", "#0E1420", "#F4DCC4", "#6A4A22"],
      glow: ["linear-gradient(180deg,#EADBC6,#E2CFB6 60%,#D7BF9F)", "linear-gradient(180deg,#2A2018,#211912 60%,#18120D)"],
      spine: [lg("#3E5F86", "#26405F"), lg("#1E2A3C", "#0E1420")], btn: [lg2("#AE5A24", "#C9782E"), lg2("#F2A65A", "#F6C08A")]},
    kit: {motif: "en_gear", card: ["#FCF8F3", "#F0E4D6"], ink: "#2A2018", bd: "#E0C9AE", mc: "#C9782E", r: 10, notes: ["#DCE6F2"].concat(NOTES), shape: "folded", pin: "pin", fab: "14px", btn: "10px"},
    shapes: {
      en_gear: {d: gearD},
      en_duck: {d: "M-7 2C-9 -2 -6 -5 -2 -4C-3 -9 3 -11 5 -7C6 -6 6 -4 5 -3L9 -3C9 -1 7 0 5 0C8 2 8 7 3 8H-4C-8 8 -10 5 -7 2Z", detail: "M2.2 -6.4a0.9 0.9 0 1 0 0.1 0Z", dfill: true},
      en_nut: {d: hexD(9.6, 4)},
      en_bolt: {d: "M-5.5 -10H5.5V-5.5H-5.5Z M-2.4 -5.5H2.4V10H-2.4Z", detail: "M-2.4 -2.5L2.4 -1M-2.4 0.8L2.4 2.3M-2.4 4.1L2.4 5.6M-2.4 7.4L2.4 8.9", dstroke: true}
    },
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(16), "en_gear", d ? ["#F2A65A", "#E8C27A", "#C98A52"] : ["#C9782E", "#D9A441", "#9A6A3A"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 11, smax: 17}).map(p => Object.assign(p, {vr: fxR(-0.09, 0.09)}))
      .concat(fxBurst(W, H, n(14), "en_nut", d ? ["#B8C2CC", "#E8EEF2"] : ["#8A97A3", "#B8C2CC"], [[0.2, 1.02], [0.8, 1.02]], {smin: 6, smax: 9}), fxBurst(W, H, n(8), "en_bolt", d ? ["#B8C2CC"] : ["#7E8B96", "#A3AEB8"], [[0.3, 1.02], [0.7, 1.02]], {smin: 8, smax: 11}),
        fxRise(W, H, n(8), "en_gear", d ? ["#F2A65A", "#E8C27A"] : ["#C9782E", "#D9A441"], {smin: 9, smax: 14, vmin: 1, vmax: 1.8, sway: 0.5, life: 260}).map(p => Object.assign(p, {vr: fxR(-0.04, 0.04)})),
        fxTw(W, H, n(16), "sparkle", d ? ["#FFE0A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A warm workshop wall with blueprints, turning brass gears and a truss bridge out the window"
  });

  /* Sunny Classroom */
  MAJ_THEMES.push({
    skin: {id: "education", name: "Sunny Classroom", desc: "A bright classroom with a chalkboard.",
      light: ["#F7F3EA", "rgba(47,107,79,.10)", "#FFFFFF", "#22261E", "#626A5A", "#E4E3D6", "#EEECE2", "#FCFBF7", "#C2463A", "#D06E62", "#FFFFFF", "#7A2A22", "#2F5E47", "#F2D8D2", "#FFE38A"],
      dark: ["#13161A", "rgba(255,183,110,.08)", "#1C2026", "#F4F0E8", "#B6B0A4", "#323840", "#262B31", "#171A1F", "#FFB36E", "#FFCB98", "#2A1606", "#8A6038", "#0E1A14", "#F2E2CC", "#6A5424"],
      glow: ["linear-gradient(180deg,#F3E7CF,#EADBBE 60%,#DCC7A2)", "linear-gradient(180deg,#22242E,#1B1D25 60%,#15161C)"],
      spine: [lg("#2F6B4F", "#1F4A36"), lg("#1B3328", "#0E1A14")], btn: [lg2("#C2463A", "#D9663A"), lg2("#FFB36E", "#FFCB98")]},
    kit: {motif: "ed_apple", card: ["#FFFDF7", "#F4EEDD"], ink: "#22261E", bd: "#E3D9BE", mc: "#C2463A", r: 12, notes: ["#F6E7B4"].concat(NOTES), shape: "lined", pin: "tape", fab: "16px", btn: "12px"},
    shapes: {
      ed_apple: {d: "M0 -5.2C2.6 -7.4 8.4 -7.2 9 -1.4C9.6 4.6 5.4 9.8 2.4 9.8C1.4 9.8 0.8 9.2 0 9.2C-0.8 9.2 -1.4 9.8 -2.4 9.8C-5.4 9.8 -9.6 4.6 -9 -1.4C-8.4 -7.2 -2.6 -7.4 0 -5.2Z M-0.6 -5.6C-0.8 -8 0 -9.6 1.2 -10.6L2 -9.8C1 -8.8 0.6 -7.4 0.8 -5.6Z M1.6 -8.4C3 -10.6 6.4 -10.8 7.6 -9.8C6.4 -7.6 3.4 -7.2 1.6 -8.4Z", detail: "M-5.2 -2.6Q-5.8 0.6 -4 3.2", dstroke: true},
      ed_aplus: {d: "M-11 8L-6.4 -8L-1.8 8M-9.4 2.6H-3.4M4.6 -4.4V7.4M-1.2 1.5H10.4", stroke: true, lw: 2.4},
      ed_pencil: {d: "M-10.6 3.2L5.2 3.2L10.8 0L5.2 -3.2L-10.6 -3.2Z", detail: "M5.2 -3.2L5.2 3.2M-7.6 -3.2V3.2M8.6 -1.2L10.8 0L8.6 1.2Z", dstroke: true}
    },
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "star", d ? ["#FFD86B", "#FFE9A8", "#F2B53A"] : ["#F2B53A", "#FFCF4A", "#E8A21C"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 7, smax: 12, glow: d ? 10 : 3})
      .concat(fxBurst(W, H, n(8), "ed_apple", ["#D9473A", "#E8604A", "#7FB24A"], [[0.25, 1.02], [0.75, 1.02]], {smin: 10, smax: 14}), fxRise(W, H, n(3), "ed_aplus", d ? ["#FFFFFF", "#FFE9A8"] : ["#2F6B4F", "#C2463A"], {smin: 12, smax: 16, vmin: 1, vmax: 1.6, sway: 0.6, life: 280, glow: d ? 10 : 0}),
        fxRise(W, H, n(14), "heart", ["#FF8FB8", "#FF9C8C", "#FFD465"], {smin: 6, smax: 10, sway: 1.2}), fxBurst(W, H, n(10), "ed_pencil", ["#F2C14A", "#E8A21C"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 15}), fxTw(W, H, n(20), "sparkle", d ? ["#FFE9A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A sunny classroom with chalk doodles, paper chains, an apple on the desk and trees outside"
  });

  /* On Air */
  MAJ_THEMES.push({
    skin: {id: "comms", name: "On Air", desc: "A cozy radio studio with a glowing ON AIR sign.",
      light: ["#F4F1F4", "rgba(194,58,74,.10)", "#FFFFFF", "#24202E", "#665E70", "#E2DCE4", "#ECE7EE", "#FBF9FB", "#C23A4A", "#D06A76", "#FFFFFF", "#7A1F2C", "#3A3152", "#F2D3D8", "#FFE3A0"],
      dark: ["#120F1A", "rgba(255,122,134,.08)", "#1C1826", "#F4EEF6", "#B4AAC2", "#332C42", "#282233", "#16121E", "#FF7A86", "#FF9EA8", "#2A0A10", "#8A3A48", "#0B0912", "#F6D2D8", "#6A3A3E"],
      glow: ["linear-gradient(180deg,#E9E2EC,#E1D8E4 60%,#D4C9D8)", "linear-gradient(180deg,#1E1A2A,#18141F 60%,#120F18)"],
      spine: [lg("#3A3152", "#241E36"), lg("#1C1728", "#0B0912")], btn: [lg2("#C23A4A", "#D8604A"), lg2("#FF7A86", "#FFA98A")]},
    kit: {motif: "cm_mic", card: ["#FBF9FB", "#EEE6EF"], ink: "#24202E", bd: "#DCCFDE", mc: "#C23A4A", r: 16, notes: ["#EED8DC"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "999px"},
    shapes: {
      cm_mic: {d: "M-4.6 -6.4A4.6 4.6 0 0 1 4.6 -6.4V0.6A4.6 4.6 0 0 1 -4.6 0.6Z M-7.6 -0.4H-6.2A6.2 6.2 0 0 0 6.2 -0.4H7.6A7.6 7.6 0 0 1 0.7 7.2V9H3.6V10.6H-3.6V9H-0.7V7.2A7.6 7.6 0 0 1 -7.6 -0.4Z", detail: "M-4.6 -4.6H4.6M-4.6 -2.2H4.6", dstroke: true},
      cm_wave: {d: "M-11 0C-9 -6 -7 -6 -5.5 0S-2 6 0 0S3.5 -6 5.5 0S9 6 11 0", stroke: true, lw: 2},
      cm_bubble: {d: "M-10 -7A3 3 0 0 1 -7 -10H7A3 3 0 0 1 10 -7V2A3 3 0 0 1 7 5H-2L-7 10L-5.5 5H-7A3 3 0 0 1 -10 2Z", detail: "M0 2.6C-4.6 -0.6 -4.4 -4.8 -2 -5.4C-1 -5.6 -0.3 -5 0 -4.2C0.3 -5 1 -5.6 2 -5.4C4.4 -4.8 4.6 -0.6 0 2.6Z", dfill: true},
      cm_bars: {d: "M-9 2H-6V10H-9Z M-4.5 -4H-1.5V10H-4.5Z M0 -9H3V10H0Z M4.5 -2H7.5V10H4.5Z"}
    },
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(24), "note", d ? ["#FF9EA8", "#FFD08A", "#C9B8FF"] : ["#C23A4A", "#6A4FC9", "#E0883A"], {smin: 9, smax: 14, sway: 1.6, vmin: 1.4, vmax: 2.6})
      .concat(fxRise(W, H, n(10), "cm_wave", d ? ["#FF9EA8", "#9FD8FF"] : ["#C23A4A", "#3D7AB8"], {smin: 12, smax: 18, sway: 0.8, vmin: 1, vmax: 1.8, life: 240, glow: d ? 10 : 0}),
        fxRise(W, H, n(9), "cm_bubble", d ? ["#FF8FC0", "#8FF0E4", "#FFD27A"] : ["#FF4F9A", "#23B5A8", "#F5A623", "#8E6FE8"], {smin: 12, smax: 17, vmin: 1, vmax: 1.8, sway: 0.9, life: 260}),
        fxBurst(W, H, n(6), "cm_mic", d ? ["#E8E2EE", "#C9C2D2"] : ["#4A4258", "#6A6278"], [[0.2, 1.02], [0.8, 1.02]], {smin: 12, smax: 16}), fxTw(W, H, n(18), "sparkle", d ? ["#FFD08A", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => { [0, 22, 44].forEach(t0 => { const t = f - t0; if (t < 0 || t > 120) return; const r = 30 + t * Math.max(W, H) / 150, a = 1 - t / 120; g.save(); g.globalAlpha = a * (d ? 0.5 : 0.4); g.strokeStyle = d ? "#FF9EA8" : "#C23A4A"; g.lineWidth = 3; g.lineCap = "round"; [-1, 1].forEach(s => { g.beginPath(); g.arc(W / 2, H + 10, r, s < 0 ? Math.PI * 1.05 : Math.PI * 1.62, s < 0 ? Math.PI * 1.38 : Math.PI * 1.95); g.stroke(); }); g.restore(); }); }},
    tag: "A cozy radio studio with a glowing ON AIR sign, a big microphone and the city skyline outside"
  });
})();

