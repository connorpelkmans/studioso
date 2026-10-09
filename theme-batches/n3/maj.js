/* New Theme Ideas, batch n3 (Cozy Spots): greenhouse, pottery, campfire, aquarium, treehouse */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a monstera leaf pointing up, with two slits each side
  const monstera = (() => { const TH = [0, 0.06, 0.25, 0.5, 0.75, 0.9, 1], RR = [0.6, 0.52, 0.48, 0.44, 0.46, 0.4, 0.3], up = [];
    const rad = t => { for (let k = 1; k < TH.length; k++) if (t <= TH[k]) return RR[k - 1] + (RR[k] - RR[k - 1]) * (t - TH[k - 1]) / (TH[k] - TH[k - 1]); return 0.3; };
    for (let i = 0; i <= 40; i++) { const t = i / 40; let rr = rad(t); for (let s = 0; s < 2; s++) { const c = 0.24 + 0.52 * (s + 0.5) / 2, d = Math.abs(t - c); if (d < 0.03) rr = Math.min(rr, 0.16 + d * 6); } up.push([rr * Math.sin(t * Math.PI) * 1.05 * 22, -(0.42 * 22 + rr * 22 * Math.cos(t * Math.PI)) + 11]); }
    const lo = up.slice(1, -1).reverse().map(p => [-p[0], p[1]]);
    return {d: pts(up.concat(lo)) + "M-0.7 10.5V12H0.7V10.5Z", detail: "M0 9.5L0 -9.5M0 -2L4.5 -5M0 -2L-4.5 -5M0 3L4 0.5M0 3L-4 0.5", dstroke: true}; })();
  const bloom = (() => { let d = ""; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), q = [[0, 0], [2.6, 4.5], [0, 11], [-2.6, 4.5]]; d += pts(q.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c])); } return {d: d + circ(0, 0, 3.4), detail: circ(0, 0, 2.2), dfill: true}; })();
  Object.assign(FX_SHAPES, {
    n3leaf: monstera,
    n3bloom: bloom,
    n3vase: {d: "M-3 -11H3V-9.6H2.2V-7.6C6.6 -5.6 8.6 -2 8.6 2C8.6 7 5 10.2 2.6 11.2H-2.6C-5 10.2 -8.6 7 -8.6 2C-8.6 -2 -6.6 -5.6 -2.2 -7.6V-9.6H-3Z", detail: "M-8.2 0.6H8.2M-7.4 4.6H7.4", dstroke: true},
    n3flame: {d: "M0 -11.5C3 -7 8.2 -4 8.2 2.6C8.2 7.6 4.6 11 0 11C-4.6 11 -8.2 7.6 -8.2 2.6C-8.2 -1.6 -5.6 -3.6 -4.6 -7.2C-3 -4.6 -2.6 -2.4 -1 -1.2C-1.6 -5 -1 -8.6 0 -11.5Z", detail: "M0 0.5C2 2.5 3.8 4 3.8 6.6C3.8 9 2 10.4 0 10.4C-2 10.4 -3.8 9 -3.8 6.6C-3.8 4.6 -1.6 3 0 0.5Z", dfill: true},
    n3mallow: {d: "M-8 -6C-8 -9.6 8 -9.6 8 -6V6C8 9.6 -8 9.6 -8 6Z", detail: "M-8 -6C-8 -2.6 8 -2.6 8 -6", dstroke: true},
    n3fish: {d: "M-6 0C-3 -6.4 6 -7.4 11.4 0C6 7.4 -3 6.4 -6 0Z M-5 0L-11.5 -6V6Z", detail: circ(5.6, -1.2, 1.5), dfill: true},
    n3acorn: {d: "M-7.4 -3C-7.4 -8.6 7.4 -8.6 7.4 -3Z M-6 -3H6C6 4 3 9 0 11.2C-3 9 -6 4 -6 -3Z M-0.9 -11H0.9V-7.6H-0.9Z", detail: "M-6.6 -4.4H6.6", dstroke: true}
  });
  const swim = (W, H, n, shape, cols, d) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0, sp = fxR(2.2, 3.8), vx = (left ? 1 : -1) * sp, vy = -fxR(0.1, 0.7);
    return {shape, c: fxPick(cols), x: left ? fxR(-70, -20) : W + fxR(20, 70), y: fxR(H * 0.25, H * 0.95), vx, vy, g: 0, size: fxR(12, 20), rot: Math.atan2(vy, vx), vr: 0, sway: 0, life: 280, delay: Math.floor(fxR(0, 60)), glow: d ? 8 : 0}; });
  const planes = (W, H, n, cols) => Array.from({length: n}, (_, i) => { const lr = i % 2 === 0, sp = fxR(3.2, 4.6), a = -fxR(0.15, 0.45);
    return {shape: "plane", c: fxPick(cols), x: lr ? fxR(-60, -10) : W + fxR(10, 60), y: fxR(H * 0.5, H * 0.95), vx: (lr ? 1 : -1) * Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, size: fxR(13, 18), rot: lr ? a : Math.PI - a, vr: 0, sway: 0, life: 260, delay: Math.floor(fxR(0, 80))}; });

  MAJ_THEMES.push({
    skin: {id: "greenhouse", name: "Greenhouse", group: "ideas", desc: "A Victorian glass greenhouse packed with tropical plants.",
      light: ["#EFF6EF", "rgba(47,125,82,.10)", "#FFFFFF", "#16291F", "#56685C", "#D3E4D8", "#E3EFE6", "#F8FBF8", "#2F7D52", "#4E9A62", "#FFFFFF", "#1F5A3A", "#28553F", "#CFE8D8", "#FFE7A0"],
      dark: ["#0E1C1B", "rgba(242,194,122,.07)", "#152826", "#E8F4EF", "#A2BFB4", "#26403C", "#1C3330", "#10201E", "#F2C27A", "#F6D69E", "#14241F", "#7A6438", "#0E201E", "#CFE6DC", "#6A5428"],
      glow: ["linear-gradient(180deg,#CDE9DA,#EEF7EF 55%,#F7F1E3)", "linear-gradient(180deg,#13252A,#1F3A3C 55%,#3F5A55)"],
      spine: [lg("#3E7A5C", "#28553F"), lg("#1C3A36", "#0E201E")], btn: [lg2("#2F7D52", "#4E9A62"), lg2("#F2C27A", "#F6D69E")]},
    kit: {motif: "n3leaf", card: ["#F6FBF7", "#E1EFE5"], ink: "#16291F", bd: "#BFDCC8", mc: "#3E9A62", r: 16, notes: ["#D6EBDC"].concat(NOTES), shape: "rounded", pin: "tape", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(30), "n3leaf", d ? ["#3E7A55", "#5A9A6A", "#2F6A48"] : ["#3E9A62", "#5BAA6A", "#2F7D52", "#8CCB7C"], {sway: 1.8, flip: true, smin: 11, smax: 17, vmin: 1, vmax: 2})
      .concat(fxRise(W, H, n(26), "drop", d ? ["#A9E0D6", "#E8F4EF"] : ["#7CC4D8", "#BFE6EE", "#FFFFFF"], {smin: 4, smax: 8, vmin: 1.2, vmax: 2.6, sway: 0.6, glow: d ? 6 : 0}),
        fxBurst(W, H, n(12), "n3bloom", d ? ["#FFFFFF", "#F6E6EE", "#FFF4D0"] : ["#F28BA8", "#FFFFFF", "#F7B84A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 10, smax: 14, glow: d ? 12 : 0}),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFF4D0", "#FFFFFF", "#F2C27A"] : ["#8CCB7C", "#F2D24A", "#FFFFFF"], {smin: 3, smax: 6, glow: d ? 10 : 3}))},
    tag: "A Victorian glass greenhouse packed with palms and monsteras, misting nozzles, hanging baskets and a rare night bloom"
  });
  MAJ_THEMES.push({
    skin: {id: "pottery", name: "Pottery Studio", group: "ideas", desc: "A sunlit studio with a spinning wheel, shelves of pots and a warm kiln.",
      light: ["#F8F1EA", "rgba(178,87,46,.10)", "#FFFCF8", "#2E1E16", "#6E5A4E", "#E8D8CA", "#F2E6DA", "#FFFBF7", "#B2572E", "#C9773E", "#FFFFFF", "#7A3A1C", "#723C26", "#F2DCCB", "#FFE0A8"],
      dark: ["#1A1214", "rgba(242,168,106,.08)", "#241A1C", "#F6ECE4", "#C2AEA2", "#3E2E2C", "#2E2224", "#1E1517", "#F2A86A", "#F6C48E", "#24160F", "#8A5A38", "#1E1214", "#EAD6C8", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#EAD7C3,#F6ECE1 55%,#D9B79A)", "linear-gradient(180deg,#221A1E,#3E2C2A 55%,#7A4A34)"],
      spine: [lg("#A0583A", "#723C26"), lg("#3E2826", "#1E1214")], btn: [lg2("#B2572E", "#C9773E"), lg2("#F2A86A", "#F6C48E")]},
    kit: {motif: "n3vase", card: ["#FFF9F3", "#F3E3D4"], ink: "#2E1E16", bd: "#E6C8AE", mc: "#C9773E", r: 12, notes: ["#F2DCCB"].concat(NOTES), shape: "folded", pin: "clip", fab: "18px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "n3vase", d ? ["#3FA6A0", "#6A88E0", "#B08AE0", "#E8A0B8", "#F2C46A"] : ["#3FA6A0", "#4A68C0", "#8E5BC8", "#D8708E", "#E5B24A"], {smin: 13, smax: 19, vmin: 1.1, vmax: 2, sway: 0.7, life: 300, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(-0.15, 0.15)}))
      .concat(fxBurst(W, H, n(26), "circle", d ? ["#C8A493", "#A88A7C"] : ["#C8A493", "#B9988A", "#E6CBBE"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 4, smax: 8}),
        fxTw(W, H, n(36), "sparkle", d ? ["#F6C48E", "#FFFFFF", "#9FE0DA", "#C9B0FF"] : ["#3FA6A0", "#4A68C0", "#E5B24A", "#D8708E"], {smin: 3, smax: 7, glow: d ? 10 : 3}))},
    tag: "A sunlit pottery studio with a turning wheel, shelves of drying pots, a glowing brick kiln and a sleepy cat"
  });
  MAJ_THEMES.push({
    skin: {id: "campfire", name: "Campfire Night", group: "ideas", desc: "A crackling campfire and a tent by a still mountain lake.",
      light: ["#F1F4EE", "rgba(194,88,42,.09)", "#FFFFFF", "#18261F", "#55665C", "#D8E0D6", "#E6ECE2", "#F9FBF7", "#C2582A", "#D9783A", "#FFFFFF", "#7A3416", "#27463C", "#D2E4DA", "#FFE3A0"],
      dark: ["#0E1224", "rgba(245,160,78,.08)", "#171C32", "#F2EEE6", "#B4B2C2", "#2A2F48", "#1F2540", "#11162A", "#F5A04E", "#F8C27A", "#1A1220", "#8A5A2A", "#0E1326", "#D8D4E4", "#6A4A22"],
      glow: ["linear-gradient(180deg,#B5D3E6,#E7EFE7 55%,#CBD8B3)", "linear-gradient(180deg,#10162A,#1E2742 55%,#46352E)"],
      spine: [lg("#3E6A5A", "#27463C"), lg("#1E2844", "#0E1326")], btn: [lg2("#C2582A", "#D9783A"), lg2("#F5A04E", "#F8C27A")]},
    kit: {motif: "n3flame", card: ["#FBFAF5", "#EEF0E4"], ink: "#18261F", bd: "#D4D8C2", mc: "#D9783A", r: 14, notes: ["#F6DCC6"].concat(NOTES), shape: "classic", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(60), "circle", ["#FFB347", "#FF8A3A", "#FFE08A", "#FF6A3A"], {cx: [0.25, 0.75], smin: 2, smax: 4, vmin: 2.4, vmax: 4.6, sway: 1.4, life: 150, glow: 12})
      .concat(fxRise(W, H, n(7), "n3mallow", ["#FFF8EE", "#F7E6CC", "#F2C470"], {smin: 12, smax: 16, vmin: 1, vmax: 1.8, sway: 0.8, life: 300}).map(p => Object.assign(p, {rot: fxR(-0.4, 0.4), vr: fxR(-0.02, 0.02)})),
        fxBurst(W, H, n(10), "n3flame", d ? ["#FFB347", "#FF7A3A", "#FFE08A"] : ["#F5913A", "#E8643A", "#F7C04A"], [[0.5, 1.04]], {smin: 11, smax: 16, glow: d ? 14 : 4}),
        d ? fxTw(W, H, n(40), "star", ["#FFFFFF", "#FFE7B0", "#C9D4FF"], {smin: 3, smax: 6, top: 0.6, glow: 10}) : fxTw(W, H, n(24), "sparkle", ["#F5913A", "#F7C04A"], {smin: 3, smax: 6, glow: 4}))},
    tag: "A crackling campfire by a still mountain lake, with a glowing tent, toasting marshmallows and a sky full of stars"
  });
  MAJ_THEMES.push({
    skin: {id: "aquarium", name: "Aquarium Tunnel", group: "ideas", desc: "A glass tunnel through a giant tank, with fish swimming all around.",
      light: ["#EAF6FA", "rgba(26,118,168,.10)", "#FFFFFF", "#0E2A3A", "#4A6A7A", "#CBE3EC", "#DDEFF5", "#F6FBFD", "#1A76A8", "#2F9AC2", "#FFFFFF", "#0F4A6E", "#124C6E", "#CDE8F4", "#FFE9A8"],
      dark: ["#06122A", "rgba(111,227,255,.07)", "#0C1C36", "#E6F4FC", "#9CBCD2", "#1B3150", "#132642", "#08162E", "#6FE3FF", "#B4A6FF", "#06142A", "#2A7F9C", "#06142A", "#C6E2F2", "#2A5A66"],
      glow: ["linear-gradient(180deg,#6FC3DF,#A9E0EE 55%,#D7F1F4)", "linear-gradient(180deg,#081A33,#0E2E52 55%,#1E4A6E)"],
      spine: [lg("#1E6E96", "#124C6E"), lg("#0E2A4E", "#06142A")], btn: [lg2("#1A76A8", "#2F9AC2"), lg2("#6FE3FF", "#B4A6FF")]},
    kit: {motif: "n3fish", card: ["#F4FBFD", "#DCEFF6"], ink: "#0E2A3A", bd: "#A8D6E6", mc: "#2F9AC2", r: 20, notes: ["#CDEAF4"].concat(NOTES), shape: "speech", pin: "magnet", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => swim(W, H, n(14), "n3fish", d ? ["#6FA8F0", "#F0915A", "#E8D06A", "#C8D6E2"] : ["#3E7FE0", "#FF8A3A", "#F7D23A", "#F27BA0"], d)
      .concat(fxRise(W, H, n(46), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#7CC9D6"], {smin: 3, smax: 8, sway: 1, vmin: 1.6, vmax: 3}),
        d ? fxRise(W, H, n(8), "jelly", ["#FF9CD8", "#6FF3FF", "#B89CFF"], {smin: 12, smax: 18, vmin: 0.9, vmax: 1.6, sway: 1.2, glow: 16, life: 320}) : fxTw(W, H, n(20), "sparkle", ["#FFFFFF", "#9FE0F0"], {smin: 3, smax: 6, glow: 4}))},
    tag: "A glass tunnel through a giant tank, with schools of fish, a gliding manta, glowing jellies and a passing whale shark"
  });
  MAJ_THEMES.push({
    skin: {id: "treehouse", name: "Treehouse", group: "ideas", desc: "A wooden treehouse high in an old oak, with a rope ladder and fairy lights.",
      light: ["#F2F6EC", "rgba(63,122,46,.10)", "#FFFFFF", "#1E2A16", "#58664C", "#D8E4CC", "#E7EFDC", "#FAFCF6", "#3F7A2E", "#5A9A3A", "#FFFFFF", "#2A5420", "#3C5626", "#D8E8C8", "#FFE7A0"],
      dark: ["#0E1424", "rgba(244,196,106,.07)", "#161E32", "#EEF2E8", "#AEB8A8", "#283248", "#1E2740", "#111828", "#F4C46A", "#F8D898", "#141E10", "#7A6438", "#0E1628", "#D8E0D0", "#6A5428"],
      glow: ["linear-gradient(180deg,#B7DCEF,#E3F1E2 55%,#CFE2B4)", "linear-gradient(180deg,#16203A,#253456 55%,#3B4A3C)"],
      spine: [lg("#5A7A3C", "#3C5626"), lg("#1E2C44", "#0E1628")], btn: [lg2("#3F7A2E", "#5A9A3A"), lg2("#F4C46A", "#F8D898")]},
    kit: {motif: "n3acorn", card: ["#FAFCF5", "#E8F0DC"], ink: "#1E2A16", bd: "#C6DAB0", mc: "#5A9A3A", r: 10, notes: ["#E2EDCF"].concat(NOTES), shape: "lined", pin: "washi2", fab: "16px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => planes(W, H, n(8), d ? ["#FFFFFF", "#FFE3A8", "#D8E0D0"] : ["#FFFFFF", "#F2F6FA", "#FFE9B8"])
      .concat(fxFall(W, H, n(40), "leaf", d ? ["#5A8A50", "#8A7A3A", "#3E6A48"] : ["#6CB85E", "#F2B33A", "#E8743A", "#8ACB6A"], {sway: 2, flip: true, smin: 8, smax: 12}),
        fxBurst(W, H, n(12), "n3acorn", d ? ["#B8885A", "#9A6A40"] : ["#C08A50", "#A8703A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 9, smax: 13}),
        fxTw(W, H, n(34), "circle", d ? ["#FF7A8A", "#FFD25A", "#7AD8FF", "#9AE07A"] : ["#FF7A8A", "#FFD25A", "#7AD8FF", "#C9A0FF"], {smin: 2, smax: 4, glow: d ? 10 : 4, top: 0.5}))},
    tag: "A wooden treehouse in an old oak, with a rope ladder, a tire swing, fairy lights and a tin-can telephone"
  });
})();
