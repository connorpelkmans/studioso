/* New theme ideas, batch n1: onsen (Hot Spring), rainforest (Rainforest Canopy), tidepool (Tide Pools), volcano (Volcano Island), savanna (Savanna Sunset).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a scalloped round (n bumps), for anemones
  const scallop = (R, n, b) => { let d = ""; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; d += circ(R * Math.cos(a), R * Math.sin(a), b); } return d + circ(0, 0, R); };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n1yuzu: {d: circ(0, 1.6, 9) + "M0.6 -7.2C2.4 -11.8 7.6 -12.6 10.2 -10.2C8.2 -6.8 3.8 -6.2 0.6 -7.2Z", detail: "M-4.6 -1.6A5.4 5.4 0 0 1 -0.6 -5.2", dstroke: true},
    n1monstera: {d: "M0 11C-1.2 6.4 -10.6 4.4 -10.6 -3C-10.6 -9.2 -4.4 -11.4 0 -8.2C4.4 -11.4 10.6 -9.2 10.6 -3C10.6 4.4 1.2 6.4 0 11Z", detail: "M0 9.4V-6.4M0 3.2L-7.4 -0.6M0 -1.4L-6.6 -5.6M0 3.2L7.4 -0.6M0 -1.4L6.6 -5.6", dstroke: true},
    n1feather: {d: "M-10.5 10.5C-7 3 -1 -5 10.5 -11C8.6 -3.2 2.4 5 -10.5 10.5Z", detail: "M-10 10L7 -8", dstroke: true},
    n1anem: {d: scallop(6.6, 12, 2.6), detail: circ(0, 0, 2.4), dfill: true},
    n1hibiscus: {d: [0, 72, 144, 216, 288].map(a => { const t = (a - 90) * Math.PI / 180; return circ(5.2 * Math.cos(t), 5.2 * Math.sin(t), 4.8); }).join(""), detail: circ(0, 0, 2.2), dfill: true},
    n1acacia: {d: "M-1.2 11L-0.8 2.6L-5.6 -2.4L-4.4 -3.2L-0.4 0.6L-0.2 -3H1.2L1.2 0.8L5.2 -3.4L6.4 -2.6L1.6 2.6L1.8 11Z M-11.4 -3.6C-11 -7.8 -5.4 -9.2 0 -9.2C5.4 -9.2 11 -7.8 11.4 -3.6C8 -1.8 -8 -1.8 -11.4 -3.6Z"},
    n1lava: {d: "M0 -11C3.6 -6 8 -2 8 3.4C8 8 4.4 11 0 11C-4.4 11 -8 8 -8 3.4C-8 -2 -3.6 -6 0 -11Z", detail: circ(-2.6, 3.2, 1.6) + circ(2.6, 3.2, 1.6), dfill: true}
  });
  // a soft rainbow arc that grows over the page and then fades (frames f)
  const rainbow = (g, f, W, H, d, cx, cy, R) => { const a = f < 40 ? f / 40 : f < 170 ? 1 : Math.max(0, 1 - (f - 170) / 50); if (a <= 0) return; const grow = Math.min(1, f / 50);
    g.save(); g.globalAlpha = a * (d ? 0.35 : 0.5); g.lineWidth = Math.max(6, R * 0.05); ["#FF6A6A", "#FFA94A", "#FFE05A", "#7EDB6A", "#5AB8F2", "#9A7BF0"].forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(cx * W, cy * H, R - i * g.lineWidth, Math.PI, Math.PI + Math.PI * grow); g.stroke(); }); g.restore(); };

  MAJ_THEMES.push({
    skin: {id: "onsen", name: "Hot Spring", group: "ideas", desc: "A steaming outdoor bath in the snowy mountains.",
      light: ["#EEF3F8", "rgba(78,110,142,.10)", "#FFFFFF", "#1C2A38", "#566676", "#D6E0EA", "#E4ECF3", "#F8FAFC", "#B8523A", "#CB7458", "#FFFFFF", "#7A2E1E", "#33506E", "#D2E2F0", "#FFE3B0"],
      dark: ["#14172E", "rgba(242,168,106,.08)", "#1C2040", "#F1EFFA", "#B4B2CE", "#2E3258", "#242849", "#171A34", "#F2A86A", "#F7C48E", "#1C1830", "#8A5A38", "#161A36", "#D4D4F0", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#BFD8EE,#E8F1F8 55%,#F6EEE6)", "linear-gradient(180deg,#1C2340,#3A3F6B 60%,#6B5A7A)"],
      spine: [lg("#4E6E8E", "#33506E"), lg("#2A2F57", "#161A36")], btn: [lg2("#B8523A", "#C96A40"), lg2("#F2A86A", "#F7C48E")]},
    kit: {motif: "n1yuzu", card: ["#F8FAFD", "#E4ECF4"], ink: "#1C2A38", bd: "#C6D6E6", mc: "#E0A02A", r: 16, notes: ["#E2ECF6"].concat(NOTES), shape: "cloud", pin: "magnet", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "puff", d ? ["rgba(220,222,255,.45)", "rgba(255,210,160,.4)"] : ["rgba(255,255,255,.85)", "rgba(230,238,248,.9)"], {smin: 9, smax: 18, vmin: 0.8, vmax: 1.6, sway: 1.4, life: 260, grow: 0.12, alpha: 0.55})
      .concat(fxBurst(W, H, n(10), "n1yuzu", d ? ["#F2C24A", "#FFD45A"] : ["#FFC93A", "#F2B02A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08)})),
        fxFall(W, H, n(46), "snow", d ? ["#FFFFFF", "#DCE2FF"] : ["#A9C2E0", "#C6D8EE", "#FFFFFF"], {vmin: 0.8, vmax: 1.6, sway: 1.2, smin: 5, smax: 9, glow: d ? 6 : 0}),
        fxTw(W, H, n(20), "sparkle", d ? ["#FFE3B0", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A steaming outdoor bath ringed by snowy stones, pines and a little bathhouse, with a dozing snow monkey and a deer scarer that tips and clacks"
  });
  MAJ_THEMES.push({
    skin: {id: "rainforest", name: "Rainforest Canopy", group: "ideas", desc: "Giant leaves, hanging vines and a distant waterfall, high in the treetops.",
      light: ["#EEF6EF", "rgba(47,122,85,.10)", "#FFFFFF", "#132A1E", "#4E6A58", "#CFE3D4", "#E0EFE3", "#F7FBF7", "#C2482E", "#D26A4A", "#FFFFFF", "#7A2A18", "#1C5238", "#CDE8D4", "#FFE3A0"],
      dark: ["#0A1E1C", "rgba(127,240,208,.07)", "#102A27", "#E6F6EE", "#9EC2B2", "#1E423C", "#173733", "#0D2421", "#7FF0D0", "#A8F5DE", "#0C201A", "#3E8A72", "#0A221E", "#BFE6D8", "#2E6A5A"],
      glow: ["linear-gradient(180deg,#9FD4B8,#D9F0C9 55%,#F3F7D8)", "linear-gradient(180deg,#0F2A2A,#174240 55%,#2D5C4E)"],
      spine: [lg("#2F7A55", "#1C5238"), lg("#14403A", "#0A221E")], btn: [lg2("#C2482E", "#D26A2E"), lg2("#7FF0D0", "#B8F59A")]},
    kit: {motif: "n1monstera", card: ["#F5FBF6", "#DDEFE2"], ink: "#132A1E", bd: "#B6D8C0", mc: "#2F8A55", r: 18, notes: ["#D3EBD9"].concat(NOTES), shape: "scallop", pin: "pin", fab: "24px 24px 24px 8px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(36), "n1monstera", d ? ["#2E7A5A", "#3E9A6A", "#5AB87A"] : ["#2B7A4E", "#4FAA60", "#6FBE58"], {sway: 2, flip: true, smin: 11, smax: 16, vmin: 1, vmax: 1.9})
      .concat(fxFall(W, H, n(60), "drop", d ? ["#9FE8E0", "#C8F5EE"] : ["#7CC8E8", "#A8DCF2"], {vmin: 5, vmax: 8, sway: 0, smin: 4, smax: 6, glow: d ? 6 : 0}).map(p => Object.assign(p, {rot: 0, vr: 0, vx: 0.2, g: 0.04, life: 170, delay: Math.floor(fxR(0, 120))})),
        fxFall(W, H, n(14), "n1feather", ["#E83A3A", "#2F8EE8", "#FFC93A", "#2FB0A8"], {sway: 2.4, smin: 12, smax: 17, vmin: 0.8, vmax: 1.4}),
        fxFlutter(W, H, n(7), d ? ["#7FDBFF", "#9FF7E0"] : ["#2F7CF0", "#4FA0FF", "#7FD0FF"]),
        fxTw(W, H, n(20), "circle", d ? ["#C8FF8A", "#9FFFE8"] : ["#F2E7A0", "#E4F0B8"], {smin: 2, smax: 4, glow: 10, vy: -0.3}))},
    tag: "Giant leaves, swaying vines and a distant waterfall seen from the treetops, with a hopping toucan, tree frogs and glowing mushrooms at night"
  });
  MAJ_THEMES.push({
    skin: {id: "tidepool", name: "Tide Pools", group: "ideas", desc: "A rocky shore at low tide, with clear little pools full of life.",
      light: ["#EEF6F7", "rgba(47,122,142,.10)", "#FFFFFF", "#132B33", "#4E6870", "#D0E3E6", "#E1EFF1", "#F7FBFB", "#C2486E", "#D06A8A", "#FFFFFF", "#7A2244", "#1D5466", "#CDE6EC", "#FFE3B0"],
      dark: ["#0E1828", "rgba(127,224,240,.07)", "#152338", "#EAF2FA", "#A6B6CC", "#24364E", "#1C2C44", "#111D30", "#7FE0F0", "#A8EAF6", "#0E1A2E", "#3A8A9A", "#121F36", "#C6DAEC", "#2A5A6A"],
      glow: ["linear-gradient(180deg,#A8D8E8,#E6F3F2 55%,#E9DCC6)", "linear-gradient(180deg,#1A2B44,#2C4462 55%,#4A5A6E)"],
      spine: [lg("#2F7A8E", "#1D5466"), lg("#22385A", "#121F36")], btn: [lg2("#C2486E", "#D9685A"), lg2("#7FE0F0", "#B8A0FF")]},
    kit: {motif: "n1anem", card: ["#F5FBFB", "#DDEEF0"], ink: "#132B33", bd: "#B4D6DC", mc: "#C2486E", r: 20, notes: ["#D3EAEE"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(46), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#7CC9D6"], {smin: 3, smax: 8, sway: 1, vmin: 1.6, vmax: 3})
      .concat(fxBurst(W, H, n(16), "n1anem", d ? ["#FF8FB8", "#6EE0A8", "#B58CF2"] : ["#FF7FA8", "#4ED69A", "#A884F0", "#FF9A5A"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 10, smax: 14}),
        fxBurst(W, H, n(10), "starfish", ["#F2884A", "#9E62CC", "#F2B53A"], [[0.3, 1.02], [0.7, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxBurst(W, H, n(8), "shell", ["#F6E0D0", "#F7C6C6", "#FFF2E0"], [[0.15, 1.02], [0.85, 1.02]], {smin: 10, smax: 13}),
        fxTw(W, H, n(26), "sparkle", d ? ["#7FE0F0", "#FFFFFF"] : ["#4FB8D8", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 12 : 3}))},
    tag: "Clear pools on a rocky shore at low tide, with waving anemones, kelp, a darting sculpin, a little crab and glowing splashes at night"
  });
  MAJ_THEMES.push({
    skin: {id: "volcano", name: "Volcano Island", group: "ideas", desc: "A friendly little volcano on a tropical island with palms and black sand.",
      light: ["#FBF2EA", "rgba(184,86,58,.10)", "#FFFCF8", "#3A1C14", "#7A5A4C", "#EED8C8", "#F6E6DA", "#FFFAF5", "#1E8A8C", "#3EA2A0", "#FFFFFF", "#145A5C", "#7E3424", "#F4DCCB", "#FFE3A0"],
      dark: ["#1A0E1E", "rgba(255,154,90,.08)", "#26142A", "#FBEDEA", "#C8A8B0", "#3E2238", "#311B30", "#1F1024", "#FF9A5A", "#FFC07A", "#26142A", "#8A4A2A", "#160A18", "#E8C8D0", "#6A3A20"],
      glow: ["linear-gradient(180deg,#F7C9A0,#FBE6C8 50%,#BFE3D9)", "linear-gradient(180deg,#26142A,#4A1F33 55%,#8A3A35)"],
      spine: [lg("#B8563A", "#7E3424"), lg("#4A1F33", "#26142A")], btn: [lg2("#1E8A8C", "#2EA2A0"), lg2("#FF9A5A", "#FFC07A")]},
    kit: {motif: "n1hibiscus", card: ["#FFF8F2", "#F6E2D4"], ink: "#3A1C14", bd: "#EAC8B4", mc: "#E0533A", r: 14, notes: ["#F6DCCC"].concat(NOTES), shape: "folded", pin: "corners", fab: "22px 6px 22px 6px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "circle", d ? ["#FFB05A", "#FFE08A", "#FF7A3A"] : ["#FF8A3A", "#FFC24A", "#F25A3A"], [[0.5, 1.04]], {smin: 2.5, smax: 5, glow: 12})
      .concat(fxBurst(W, H, n(22), "n1hibiscus", d ? ["#FF6A8A", "#FFB0C8", "#FFFFFF", "#FFA05A"] : ["#F2486A", "#FF8AB0", "#FFFFFF", "#FF9A3A"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
        fxRise(W, H, n(8), "n1lava", d ? ["#FF7A3A", "#FFB05A"] : ["#E8603A", "#FF9A3A"], {smin: 12, smax: 16, vmin: 1, vmax: 1.8, sway: 0.8, life: 280, glow: d ? 14 : 6}),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFE08A", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 12 : 4}))},
    tag: "A friendly volcano puffing over a tropical island, with swaying palms, black sand, steaming vents and glowing lava rivers at night"
  });
  MAJ_THEMES.push({
    skin: {id: "savanna", name: "Savanna Sunset", group: "ideas", desc: "Golden grassland, flat-topped acacias and a huge low sun.",
      light: ["#FBF4E6", "rgba(184,120,46,.10)", "#FFFDF7", "#3A2412", "#7A604A", "#EEDDC0", "#F6EAD2", "#FFFBF2", "#B8502A", "#CC7448", "#FFFFFF", "#6E2E14", "#7E4E1C", "#F4E0BC", "#FFE3A0"],
      dark: ["#1A1226", "rgba(242,166,106,.08)", "#241830", "#F8EEF2", "#C2AEC4", "#3A2846", "#2E203C", "#1E1428", "#F2A66A", "#F6C88A", "#24162E", "#8A5A38", "#2A1C3E", "#E2D0E2", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#F9D68B,#FBE9B9 55%,#E8D59A)", "linear-gradient(180deg,#2A1C3E,#5A2E4A 55%,#B4523E)"],
      spine: [lg("#B8782E", "#7E4E1C"), lg("#3E2446", "#2A1C3E")], btn: [lg2("#B8502A", "#D27A2A"), lg2("#F2A66A", "#F6C88A")]},
    kit: {motif: "n1acacia", card: ["#FFFAF0", "#F6E8CC"], ink: "#3A2412", bd: "#E8D0A4", mc: "#B8782E", r: 12, notes: ["#F4E2BC"].concat(NOTES), shape: "torn", pin: "tape", fab: "18px 18px 6px 18px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(60), "drop", d ? ["#B8D8FF", "#E8F0FF"] : ["#7CC8E8", "#A8DCF2", "#FFFFFF"], [[0.3, 1.04], [0.7, 1.04]], {smin: 4, smax: 7, glow: d ? 6 : 0}).map(p => Object.assign(p, {rot: 0, vr: 0}))
      .concat(Array.from({length: n(70)}, () => ({shape: "circle", c: fxPick(d ? ["#F6C88A", "#E2B07A"] : ["#E8B85A", "#D9A04A", "#F2CC7A"]), x: fxR(-W * 0.4, -10), y: fxR(H * 0.3, H), vx: fxR(4, 7.5), vy: fxR(-0.6, 0.2), g: 0, size: fxR(1.5, 3), rot: 0, vr: 0, sway: 0.9, swf: fxR(0.05, 0.1), life: 220, delay: Math.floor(fxR(0, 80)), alpha: 0.85})),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE3B0", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => rainbow(g, f, W, H, d, 0.5, 0.95, Math.min(W, H) * 0.42)},
    tag: "A huge low sun over golden grass, with flat-topped acacias, a munching giraffe, swallows over the watering hole and a baby elephant who loves a splash"
  });
})();
