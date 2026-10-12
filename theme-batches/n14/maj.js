/* New theme ideas, batch n14: lotus (Lotus Lake), seastacks (Sea Stacks).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n14lotus: {d: "M0 9C-3.6 9 -9.6 6.4 -10.6 0.6C-7.6 0.4 -5.2 1.6 -4 3C-4.6 -2.4 -2.6 -7.4 0 -10C2.6 -7.4 4.6 -2.4 4 3C5.2 1.6 7.6 0.4 10.6 0.6C9.6 6.4 3.6 9 0 9Z", detail: "M0 -6.6V6.4", dstroke: true},
    n14pad: {d: "M-10.5 0.5C-10.5 -5.6 -5.6 -9 0 -9C5.6 -9 10.5 -5.6 10.5 0.5C10.5 6 5.6 9 0 9C-5.6 9 -10.5 6 -10.5 0.5Z", detail: "M0 0L-7 -4M0 0L0 -7.6M0 0L7 -4M0 0L7.6 3M0 0L0 7.6M0 0L-7.6 3", dstroke: true},
    n14petal: {d: "M0 -10C4.6 -5 5.4 2.6 3.6 6.8C2.6 9 -2.6 9 -3.6 6.8C-5.4 2.6 -4.6 -5 0 -10Z", detail: "M0 -6.8V6.4", dstroke: true},
    n14stack: {d: "M-6.4 10.5C-6.6 6 -7.4 1 -6.6 -3.6C-6 -6.8 -4.6 -9.6 -1.4 -10.3C2.2 -11 5.6 -9 6.4 -5.6C7.2 -1.2 6.4 4.6 6.6 10.5Z", detail: "M-6 -1.6H6.2M-6.4 3.4H6.4M-5.8 -6.2H5.4", dstroke: true},
    n14thrift: {d: circ(0, -2, 7.4) + "M-0.8 4.4H0.8V11H-0.8Z", detail: circ(-2.6, -4, 1.4) + circ(2.4, -3.4, 1.4) + circ(0, 0.4, 1.4), dfill: true},
    n14foam: {d: circ(-4.6, 2, 5.4) + circ(3.4, 1, 6.4) + circ(0, -4, 5.6), detail: circ(-3, -4, 1.6) + circ(4.2, -1, 1.2), dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "lotus", name: "Lotus Lake", group: "ideas", desc: "A misty lake at dawn crowded with giant lotus leaves and pink blooms.",
      light: ["#F6F2F2", "rgba(206,100,140,.10)", "#FFFFFF", "#22302C", "#5E6C68", "#E2DEE0", "#EEE8EA", "#FBF9F9", "#C04C7A", "#D46A92", "#FFFFFF", "#7A2348", "#2F5A48", "#F4D8E2", "#FFE2C8"],
      dark: ["#0C1228", "rgba(232,140,180,.08)", "#141C38", "#EEF0FA", "#AEB6CE", "#283050", "#1C2442", "#10172E", "#EE8AB4", "#F2A6C6", "#1A1020", "#8A3C5C", "#0E1830", "#D0D8F0", "#5A3248"],
      glow: ["linear-gradient(180deg,#B4C6E2,#F4D8C6 50%,#A6C4D2)", "linear-gradient(180deg,#0F1940,#2E3C6C 50%,#0E1834)"],
      spine: [lg("#3E7258", "#2A5240"), lg("#1C2A50", "#0E1830")], btn: [lg2("#C04C7A", "#D86A8E"), lg2("#EE8AB4", "#F2A6B8")]},
    kit: {motif: "n14lotus", card: ["#FCF8F9", "#F2E6EA"], ink: "#22302C", bd: "#E2C8D2", mc: "#D2588A", r: 18, notes: ["#FBE0EA"].concat(NOTES), shape: "rounded", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(22), "n14lotus", d ? ["#E8A0C4", "#F2B8D2", "#C888B0"] : ["#EC7CA6", "#F49CBC", "#FBD0DE"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 11, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)}))
      .concat(fxBurst(W, H, n(12), "n14pad", d ? ["#3E6E6A", "#4E8278"] : ["#5A9E62", "#78B66E"], [[0.25, 1.02], [0.75, 1.02]], {smin: 11, smax: 15}),
        fxFall(W, H, n(40), "n14petal", d ? ["#E8A0C4", "#F4C4DA", "#D8DCF0"] : ["#F28CB2", "#F8B6CE", "#FFFFFF"], {sway: 2, flip: true, smin: 6, smax: 10, vmin: 0.8, vmax: 1.5}),
        fxRise(W, H, n(26), "circle", d ? ["#FFE6B0", "#FFF4D8"] : ["#FFD86A", "#FFE9A8"], {smin: 2, smax: 4, vmin: 0.8, vmax: 1.8, sway: 1.2, life: 220, glow: d ? 12 : 5}),
        fxTw(W, H, n(20), "sparkle", d ? ["#FFF0C8", "#FFFFFF"] : ["#F6C83A", "#FFE07A"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A wide still lake at dawn filled with giant round lotus leaves standing at different heights, pink blooms, buds and seed pods, soft mist and willows; moonlit with closed buds at night"
  });
  MAJ_THEMES.push({
    skin: {id: "seastacks", name: "Sea Stacks", group: "ideas", desc: "Golden limestone stacks rising from a turquoise sea below tall cliffs.",
      light: ["#F6F4EE", "rgba(42,140,160,.10)", "#FFFFFF", "#1E2C30", "#56686A", "#DEE2DC", "#EAEEE8", "#FAFBF8", "#C2702E", "#D68A48", "#FFFFFF", "#6E3A12", "#245E6A", "#CDEAE6", "#FFE2B4"],
      dark: ["#0A1124", "rgba(232,184,112,.08)", "#121B34", "#EEF2FA", "#AEB8CE", "#24304E", "#1A2440", "#0F172C", "#E8B870", "#F2CC90", "#1A1508", "#8A6A38", "#0C162E", "#C8D8F0", "#4A3E2A"],
      glow: ["linear-gradient(180deg,#8CBEE4,#E6DCBC 46%,#2AB0B6)", "linear-gradient(180deg,#0A1636,#22365E 46%,#0B1B36)"],
      spine: [lg("#2A7A8C", "#1A5664"), lg("#1A2A4E", "#0C162E")], btn: [lg2("#C2702E", "#D88A3A"), lg2("#E8B870", "#F2CC90")]},
    kit: {motif: "n14stack", card: ["#FBF8F2", "#EEF4EE"], ink: "#1E2C30", bd: "#D4D8C8", mc: "#2A9AA8", r: 14, notes: ["#FBE8CC"].concat(NOTES), shape: "torn", pin: "tape", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => (d
      ? fxBurst(W, H, n(40), "n14foam", ["#C8D8F4", "#E8F0FF", "#A8BCE8"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 9, smax: 15, glow: 10})
        .concat(fxRise(W, H, n(40), "circle", ["#D8E4FF", "#FFFFFF"], {smin: 2, smax: 4, vmin: 1, vmax: 2.2, sway: 1, life: 220, glow: 10}), fxTw(W, H, n(30), "sparkle", ["#FFF4D6", "#FFFFFF"], {smin: 3, smax: 6, top: 0.5, glow: 12}))
      : fxBurst(W, H, n(36), "n14foam", ["#FFFFFF", "#E6FAF8", "#BFEDEA"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 9, smax: 15})
        .concat(fxBurst(W, H, n(14), "n14thrift", ["#E886B4", "#F2A6C8", "#F6C83C"], [[0.12, 1.02], [0.88, 1.02]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
          fxBurst(W, H, n(10), "n14stack", ["#ECB86C", "#D89A52"], [[0.3, 1.02], [0.7, 1.02]], {smin: 11, smax: 15}),
          fxTw(W, H, n(26), "sparkle", ["#F6B64A", "#FFE08A"], {smin: 3, smax: 6, glow: 4})))},
    tag: "Golden limestone sea stacks and an arch rising from a turquoise sea below tall receding cliffs in late afternoon light, surf foaming at their feet, a green clifftop with wildflowers; stars and silver surf at night"
  });
})();
