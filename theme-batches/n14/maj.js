/* New theme ideas, batch n14: lotus (Lotus Lake).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n14lotus: {d: "M0 9C-3.6 9 -9.6 6.4 -10.6 0.6C-7.6 0.4 -5.2 1.6 -4 3C-4.6 -2.4 -2.6 -7.4 0 -10C2.6 -7.4 4.6 -2.4 4 3C5.2 1.6 7.6 0.4 10.6 0.6C9.6 6.4 3.6 9 0 9Z", detail: "M0 -6.6V6.4", dstroke: true},
    n14pad: {d: "M-10.5 0.5C-10.5 -5.6 -5.6 -9 0 -9C5.6 -9 10.5 -5.6 10.5 0.5C10.5 6 5.6 9 0 9C-5.6 9 -10.5 6 -10.5 0.5Z", detail: "M0 0L-7 -4M0 0L0 -7.6M0 0L7 -4M0 0L7.6 3M0 0L0 7.6M0 0L-7.6 3", dstroke: true},
    n14petal: {d: "M0 -10C4.6 -5 5.4 2.6 3.6 6.8C2.6 9 -2.6 9 -3.6 6.8C-5.4 2.6 -4.6 -5 0 -10Z", detail: "M0 -6.8V6.4", dstroke: true},
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
})();
