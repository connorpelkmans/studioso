/* New theme ideas, batch n4: nightmarket, diadelosmuertos, holi, ramadan, midautumn */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const star = (cx, cy, R, r, n) => pts(Array.from({length: n * 2}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n4chochin: {d: "M-3.6 -11H3.6V-8.6H-3.6Z M-3.6 8.6H3.6V11H-3.6Z" + ell(0, 0, 7.4, 9), detail: "M-6.6 -4.4Q0 -3 6.6 -4.4M-7.3 0Q0 1.4 7.3 0M-6.6 4.4Q0 5.8 6.6 4.4", dstroke: true},
    n4fish: {d: "M-3 0C-3 -5 3 -7 8 -3C10 -1.5 10 1.5 8 3C3 7 -3 5 -3 0Z M-3 0L-11 -6L-8.5 0L-11 6Z", detail: circ(5.2, -1, 1.1), dfill: true},
    n4mari: {d: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = i / 10 * Math.PI * 2; return circ(Math.cos(a) * 7.2, Math.sin(a) * 7.2, 3.8); }).join("") + circ(0, 0, 8), detail: circ(0, 0, 4.2) + [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2 + 0.3; return `M0 0L${r1(Math.cos(a) * 7)} ${r1(Math.sin(a) * 7)}`; }).join(""), dstroke: true},
    n4picado: {d: "M-9 -11H9V8L7.5 10.5L6 8L4.5 10.5L3 8L1.5 10.5L0 8L-1.5 10.5L-3 8L-4.5 10.5L-6 8L-7.5 10.5L-9 8Z", detail: circ(0, -1.5, 3) + "M-5.5 -7.5l1.5 1.5l-1.5 1.5l-1.5 -1.5z M5.5 -7.5l1.5 1.5l-1.5 1.5l-1.5 -1.5z M-5.5 3l1.5 1.5l-1.5 1.5l-1.5 -1.5z M5.5 3l1.5 1.5l-1.5 1.5l-1.5 -1.5z", dfill: true},
    n4splash: {d: circ(0, 0, 6.4) + [0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * Math.PI * 2 + 0.3, d = 8.4 + (i % 2) * 1.6; return circ(Math.cos(a) * d, Math.sin(a) * d, 1.6 + (i % 3) * 0.5) + circ(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 3.4); }).join("")},
    n4fanous: {d: "M-0.9 -12A1.6 1.6 0 1 1 0.9 -12Z M-4 -8Q-4 -11 0 -11Q4 -11 4 -8Z M-5 -8H5V-6.4H-5Z M-5 -6.4H5L4 3H-4Z M-4.4 3H4.4V4.4H-4.4Z M-4 4.4H4L1 8.6H-1Z M-1 9A1 1 0 1 0 1 9A1 1 0 1 0 -1 9Z", detail: "M-1.6 -6.4L-1.4 3M1.6 -6.4L1.4 3M0 -4.8L1 -2.6L0 -0.4L-1 -2.6Z", dstroke: true},
    n4cres: {d: "M3 -10A10 10 0 1 0 10 3A7.6 7.6 0 1 1 3 -10Z"},
    n4star8: {d: star(0, 0, 10, 7.4, 8)},
    n4mooncake: {d: circ(0, 0, 10.4), detail: circ(0, 0, 7) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * Math.PI * 2; return `M${r1(Math.cos(a) * 3)} ${r1(Math.sin(a) * 3)}L${r1(Math.cos(a) * 5.6)} ${r1(Math.sin(a) * 5.6)}`; }).join(""), dstroke: true},
    n4osma: {d: [0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + 0.4; return circ(Math.cos(a) * 5, Math.sin(a) * 5, 5); }).join(""), detail: circ(0, 0, 2.2), dfill: true},
    n4rabbit: {d: ell(-1, 4, 7.6, 6.4) + ell(1.6, -3, 4.6, 4) + ell(-0.4, -10, 1.6, 5) + ell(2.8, -10, 1.5, 4.6) + circ(-8.6, 6, 2.2)},
    n4skylan: {d: "M-8 -10Q0 -14 8 -10L6 10Q0 12 -6 10Z", detail: "M-2.4 -12V11M2.4 -12V11M-7.4 -1Q0 1 7.4 -1", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "nightmarket", name: "Night Market", group: "ideas", desc: "Food stalls under strings of paper lanterns.",
      light: ["#FBF1EC", "rgba(194,58,52,.10)", "#FFFFFF", "#3A1E22", "#7A5258", "#EED8D2", "#F5E6E1", "#FDF8F6", "#C23A34", "#D5635A", "#FFFFFF", "#7E2420", "#7E2A30", "#F4D6CE", "#FFE3A0"],
      dark: ["#1A0F22", "rgba(255,182,94,.08)", "#251530", "#FBEFF2", "#C8AFBF", "#3E2648", "#311D3C", "#1F1228", "#FFB65E", "#FFD28A", "#2A1420", "#8A5A30", "#24102A", "#E6CCDA", "#6A4424"],
      glow: ["linear-gradient(180deg,#F6D1B5,#FBE7D6 45%,#F0C9C0)", "linear-gradient(180deg,#1D1430,#3A1E45 45%,#7A2E4A)"],
      spine: [lg("#B2453E", "#7E2A30"), lg("#4A2140", "#24102A")], btn: [lg2("#C23A34", "#E07A3A"), lg2("#FFB65E", "#FFD28A")]},
    kit: {motif: "n4chochin", card: ["#FFF8F4", "#F8E4DC"], ink: "#3A1E22", bd: "#EBC6BC", mc: "#D9473F", r: 14, notes: ["#FBD9CF"].concat(NOTES), shape: "rounded", pin: "washi2", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(10), "n4skylan", d ? ["#FFC870", "#FFB060", "#FFDD9A"] : ["#F4A040", "#F08A3A", "#E8B050"], {smin: 14, smax: 20, vmin: 1, vmax: 1.8, sway: 0.7, life: 320, glow: d ? 16 : 6})
      .concat(fxBurst(W, H, n(16), "n4fish", ["#FF7A3A", "#F0442E", "#FF9A5A"], [[0.15, 1.02], [0.85, 1.02]], {smin: 10, smax: 14}),
        fxFall(W, H, n(12), "n4chochin", d ? ["#FF7A5A", "#FFE0A0", "#FFB060"] : ["#E04C42", "#F2A040", "#FFFFFF"], {sway: 1.2, smin: 12, smax: 16, vmin: 1, vmax: 1.8, glow: d ? 12 : 0}).map(p => Object.assign(p, {vr: fxR(-0.02, 0.02), rot: fxR(-0.2, 0.2)})),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#FFB65E"] : ["#F2B53A", "#FFD86B", "#E04C42"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A street of food stalls under swaying paper lanterns, with a goldfish pool and a balloon seller"
  });
  MAJ_THEMES.push({
    skin: {id: "diadelosmuertos", name: "Día de los Muertos", group: "ideas", desc: "Papel picado, marigolds and a candlelit ofrenda.",
      light: ["#FDF3EC", "rgba(194,54,122,.10)", "#FFFFFF", "#3A1A2E", "#7A5068", "#F0D8DE", "#F7E7EA", "#FEF9F7", "#C2367A", "#D2609A", "#FFFFFF", "#7A1E4E", "#8A2058", "#F6D2E2", "#FFD98A"],
      dark: ["#190E26", "rgba(255,162,58,.08)", "#241433", "#FCEFF6", "#C9AFC4", "#3E2450", "#311C42", "#1E1130", "#FFA23A", "#FFC86A", "#2A1420", "#8A5420", "#24102E", "#E8CFE4", "#6A4420"],
      glow: ["linear-gradient(180deg,#F8C77A,#FCE3B5 45%,#F5B6A6)", "linear-gradient(180deg,#1E1236,#3A1B4E 45%,#8A3058)"],
      spine: [lg("#C2367A", "#8A2058"), lg("#4A1E54", "#24102E")], btn: [lg2("#C2367A", "#F07A2A"), lg2("#FFA23A", "#FFC86A")]},
    kit: {motif: "n4mari", card: ["#FFF9F4", "#FBE6EC"], ink: "#3A1A2E", bd: "#F0C6D6", mc: "#F07A2A", r: 16, notes: ["#FCD9C0"].concat(NOTES), shape: "scallop", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(46), "petal", d ? ["#FFA23A", "#FFC83A", "#FF8A1E"] : ["#F48A1C", "#F7C22A", "#FF9A2E"], {sway: 1.8, flip: true, smin: 6, smax: 10, glow: d ? 6 : 0})
      .concat(fxFlutter(W, H, n(10), ["#F4891E", "#F7A23A", "#FF9A2E"]),
        fxBurst(W, H, n(16), "n4mari", ["#F48A1C", "#F7C22A"], [[0.15, 1.02], [0.85, 1.02]], {smin: 9, smax: 13}),
        fxFall(W, H, n(10), "n4picado", d ? ["#E8508E", "#2EB8C8", "#F2CC3A", "#9A62E0"] : ["#FF5FA2", "#2EC4D0", "#FFD23A", "#9A5AE0", "#3FC27A"], {sway: 1.4, smin: 12, smax: 16, vmin: 0.9, vmax: 1.6}).map(p => Object.assign(p, {vr: fxR(-0.03, 0.03), rot: fxR(-0.3, 0.3)})),
        fxTw(W, H, n(28), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#FFA23A"] : ["#F2B53A", "#FF5FA2", "#2EC4D0"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A street dressed for the Day of the Dead, with papel picado, a marigold arch and a candlelit ofrenda"
  });
  MAJ_THEMES.push({
    skin: {id: "holi", name: "Holi", group: "ideas", desc: "A courtyard full of flying colour and marigold garlands.",
      light: ["#FDF3F7", "rgba(210,58,130,.10)", "#FFFFFF", "#3A1A30", "#76546A", "#F2D8E4", "#F8E8EF", "#FEFAFC", "#D23A82", "#E0669E", "#FFFFFF", "#8A1E52", "#9A2A6A", "#FBD2E4", "#FFE38A"],
      dark: ["#1C0F2A", "rgba(255,138,200,.08)", "#281638", "#FCEFFA", "#CBB0D6", "#432858", "#361E4A", "#221333", "#FF8AC8", "#FFB0DA", "#2A1030", "#8A3A6A", "#2A1040", "#ECD0EC", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#FFD6E8,#FFF1C9 45%,#CFF1E6)", "linear-gradient(180deg,#2A1840,#4A2160 45%,#8A2E6A)"],
      spine: [lg("#D8407E", "#9A2A6A"), lg("#5A2470", "#2A1040")], btn: [lg2("#D23A82", "#F08A2A"), lg2("#FF8AC8", "#FFC86A")]},
    kit: {motif: "n4splash", card: ["#FFFAFD", "#FBE6F0"], ink: "#3A1A30", bd: "#F2C6DC", mc: "#D23A82", r: 20, notes: ["#FBD2E4", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "cloud", pin: "magnet", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "puff", d ? ["#FF6AB4", "#FFD23A", "#4AD08A", "#5A9AF8", "#B07AF0"] : ["#FF4A9A", "#FFC62A", "#2EC07A", "#3A8AE8", "#9A5AE0"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 5, smax: 10, glow: d ? 8 : 0}).map(p => Object.assign(p, {alpha: 0.85}))
      .concat(fxRise(W, H, n(14), "n4splash", d ? ["#FF6AB4", "#FFD23A", "#4AD08A", "#5A9AF8"] : ["#FF4A9A", "#FFC62A", "#2EC07A", "#3A8AE8", "#9A5AE0"], {smin: 14, smax: 22, vmin: 1, vmax: 2, sway: 0.9, life: 260, alpha: 0.85}).map(p => Object.assign(p, {vr: fxR(-0.03, 0.03), rot: fxR(0, 6)})),
        fxFall(W, H, n(30), "petal", ["#FF5A8A", "#FF9A1E", "#FFC62A"], {sway: 1.6, flip: true, smin: 6, smax: 9}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#FF8AC8"] : ["#FF4A9A", "#FFC62A", "#2EC07A", "#3A8AE8"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A haveli courtyard mid-celebration, with drifting clouds of coloured powder and marigold garlands"
  });
  MAJ_THEMES.push({
    skin: {id: "ramadan", name: "Ramadan Nights", group: "ideas", desc: "Rooftops under a crescent moon, hung with fanous lanterns.",
      light: ["#FAF5EC", "rgba(42,122,120,.10)", "#FFFFFF", "#2A2418", "#6E6250", "#EADFCC", "#F3EBDD", "#FDFAF5", "#2A7A78", "#4E9896", "#FFFFFF", "#1A5250", "#1E5654", "#D6EAE6", "#FFE3A0"],
      dark: ["#0E1230", "rgba(242,196,90,.08)", "#171C42", "#F2F0FA", "#B4B2D2", "#2C3266", "#222858", "#131838", "#F2C45A", "#F6D892", "#14183A", "#7A6230", "#121638", "#D4D6F0", "#6A5420"],
      glow: ["linear-gradient(180deg,#F3D9B0,#F8EBD3 45%,#E9C9A0)", "linear-gradient(180deg,#0F1638,#1E2558 45%,#3E3A78)"],
      spine: [lg("#2E7C7A", "#1E5654"), lg("#252C66", "#121638")], btn: [lg2("#2A7A78", "#C99A2E"), lg2("#F2C45A", "#F6D892")]},
    kit: {motif: "n4fanous", card: ["#FFFBF4", "#F4EAD8"], ink: "#2A2418", bd: "#E6D3B0", mc: "#C99A2E", r: 12, notes: ["#F2E2C2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "gold", fab: "22px 22px 6px 22px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(10), "n4fanous", d ? ["#F2C45A", "#FF9A6A", "#7AE0A8", "#9AB8FF"] : ["#D9A43A", "#E8463A", "#2EA86A", "#3A6AD8"], {smin: 14, smax: 20, vmin: 0.9, vmax: 1.6, sway: 0.6, life: 320, glow: d ? 14 : 4})
      .concat(fxTw(W, H, n(26), "star", d ? ["#FFE7A0", "#FFFFFF", "#F2C45A"] : ["#D9A43A", "#F2C45A", "#2A7A78"], {smin: 4, smax: 8, glow: d ? 12 : 4, top: 0.7}),
        fxFall(W, H, n(14), "n4star8", d ? ["#F2C45A", "#FFFFFF"] : ["#D9A43A", "#2A7A78"], {sway: 1, smin: 8, smax: 12, vmin: 0.9, vmax: 1.6, glow: d ? 8 : 0}),
        fxRise(W, H, n(3), "n4cres", d ? ["#FFF2C6"] : ["#E2B04A"], {cx: [0.25, 0.75], smin: 16, smax: 22, vmin: 0.9, vmax: 1.3, sway: 0.5, life: 320, glow: d ? 16 : 4}).map(p => Object.assign(p, {vr: 0, rot: -0.3})),
        fxTw(W, H, n(20), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "Old-city rooftops under a crescent moon, hung with fanous lanterns and strings of little stars"
  });
  MAJ_THEMES.push({
    skin: {id: "midautumn", name: "Mid-Autumn Festival", group: "ideas", desc: "A riverside pavilion under a giant full moon.",
      light: ["#FBF4EA", "rgba(184,64,46,.10)", "#FFFFFF", "#2E2420", "#6E5E52", "#ECDCCA", "#F4EADC", "#FDFAF5", "#B8402E", "#CC6A50", "#FFFFFF", "#7A2418", "#7E2C2A", "#F2D8C8", "#FFE3A0"],
      dark: ["#10142E", "rgba(242,196,106,.08)", "#191E40", "#F4F0FA", "#B8B4D4", "#2E3462", "#242A56", "#151A38", "#F2C46A", "#F6D892", "#161A3A", "#7A6232", "#161A3A", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#F2D6A2,#F8E8C9 45%,#E7C6A0)", "linear-gradient(180deg,#141B3A,#26305A 45%,#5A4A7A)"],
      spine: [lg("#B8463A", "#7E2C2A"), lg("#2E3466", "#161A3A")], btn: [lg2("#B8402E", "#D99A2E"), lg2("#F2C46A", "#F6D892")]},
    kit: {motif: "n4mooncake", card: ["#FFFBF4", "#F6E8D6"], ink: "#2E2420", bd: "#E8D2B6", mc: "#B8402E", r: 18, notes: ["#F6E0C0", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "circle", pin: "gold", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "n4chochin", d ? ["#FF7A50", "#FFB060", "#FF6A5A"] : ["#E04C3A", "#F08A3A", "#D8402E"], {smin: 12, smax: 18, vmin: 1, vmax: 1.8, sway: 0.8, life: 320, glow: d ? 16 : 6})
      .concat(fxFall(W, H, n(40), "n4osma", d ? ["#F2B83A", "#FFD86A"] : ["#F6B02A", "#E8A01E", "#FFC84A"], {sway: 1.6, smin: 5, smax: 8, vmin: 0.9, vmax: 1.8, glow: d ? 6 : 0}),
        fxBurst(W, H, n(12), "n4mooncake", d ? ["#E8A84A", "#D99A3E"] : ["#E0A24A", "#C88A34"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxRise(W, H, n(2), "n4rabbit", d ? ["#FFF4DC"] : ["#FFFFFF"], {cx: [0.3, 0.7], smin: 18, smax: 22, vmin: 0.9, vmax: 1.2, sway: 0.4, life: 320, glow: d ? 14 : 6}).map(p => Object.assign(p, {vr: 0})),
        fxTw(W, H, n(24), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A riverside pavilion under a giant full moon, with lotus lanterns drifting on the water and osmanthus in bloom"
  });
})();
