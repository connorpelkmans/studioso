/* New theme ideas, batch n11: glowbay (Glowing Bay).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n11wave: {d: "M-11.5 8C-11 0 -6 -9 2.5 -9.5C8.5 -10 11.5 -5.5 10.5 -1.5C9.4 2.6 4 2.4 3.6 -1C3.3 -3.4 5.6 -4.6 7 -3.6C6 -6.6 1 -6.6 -1.6 -3C-4.6 1.2 -4 6 -1 8Z"},
    n11frond: {d: "M-11 9C-6 -1 2 -7 11 -9C9 -6 6 -5.6 4.6 -2.6C7 -3.2 8 -2.4 8.6 -1.6C5.4 -0.6 3 0.8 1.4 2.8C3.6 2.4 4.8 3 5.4 3.6C1.6 4.6 -2.6 5.8 -11 9Z", detail: "M-10.5 8.6Q1 -1 10.6 -8.6", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "glowbay", name: "Glowing Bay", group: "ideas", desc: "A sheltered tropical cove whose waves glow electric blue at night.",
      light: ["#F2F8F6", "rgba(30,150,170,.10)", "#FFFFFF", "#123034", "#4A686A", "#CFE6E4", "#E0F1EF", "#F7FCFB", "#C8582A", "#DC7A4A", "#FFFFFF", "#76300F", "#16697A", "#CBECEC", "#FFE0A8"],
      dark: ["#050D20", "rgba(80,230,255,.08)", "#0B1830", "#E6F6FC", "#9CB8C8", "#1A2E48", "#12233C", "#08142A", "#5CE6FF", "#8CF0FF", "#04121F", "#2A8A9C", "#040C1E", "#B8E8F4", "#1E5A6A"],
      glow: ["linear-gradient(180deg,#84C2DA,#E4D8B2 46%,#3FC0C2)", "linear-gradient(180deg,#02061A,#0C2250 46%,#04132A)"],
      spine: [lg("#1E7A8A", "#135866"), lg("#0A1C3A", "#040C1E")], btn: [lg2("#C8582A", "#DC7A3A"), lg2("#3FE0FF", "#7AF0FF")]},
    kit: {motif: "n11wave", card: ["#F6FCFB", "#DDF1EE"], ink: "#123034", bd: "#AED8D4", mc: "#1FA8B8", r: 20, notes: ["#D2F0EC"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => (d
      ? fxRise(W, H, n(60), "circle", ["#5CE6FF", "#8CF0FF", "#3FC8FF", "#B8F8FF"], {smin: 2, smax: 5, vmin: 0.9, vmax: 2, sway: 1.2, life: 240, glow: 14})
        .concat(fxBurst(W, H, n(16), "n11wave", ["#5CE6FF", "#8CF0FF"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 12, smax: 17, glow: 16}), fxTw(W, H, n(30), "sparkle", ["#B8F8FF", "#FFFFFF"], {smin: 3, smax: 6, glow: 14}))
      : fxBurst(W, H, n(18), "n11wave", ["#2EB6C4", "#5CD0D4", "#FFFFFF"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 12, smax: 17})
        .concat(fxBurst(W, H, n(12), "n11frond", ["#3E9A4A", "#5AB45A"], [[0.1, 1.02], [0.9, 1.02]], {smin: 13, smax: 18}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
          fxRise(W, H, n(36), "bubble", ["#FFFFFF", "#9ADCD8"], {smin: 3, smax: 7, sway: 1, vmin: 1.4, vmax: 2.6}),
          fxTw(W, H, n(24), "sparkle", ["#F6B64A", "#FFE08A"], {smin: 3, smax: 6, glow: 4})))},
    tag: "A sheltered cove between dark rock headlands, with a crescent of white sand, leaning palms and turquoise water at golden hour; at night the waves glow electric blue under the Milky Way"
  });
})();
