/* New theme ideas, batch n11: meadow (Poppy Meadow), glowbay (Glowing Bay).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const starD = (R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + r1(q * Math.cos(a)) + " " + r1(q * Math.sin(a)); } return d + "Z"; };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n11poppy: {d: "M-9.5 -1.5C-11 -8 -5 -11 0 -7.5C5 -11 11 -8 9.5 -1.5C9 5 4.6 9.5 0 9.5C-4.6 9.5 -9 5 -9.5 -1.5Z", detail: "M-3.6 -3.4C-3.6 -5.4 3.6 -5.4 3.6 -3.4C3.6 -1.6 -3.6 -1.6 -3.6 -3.4Z", dfill: true},
    n11corn: {d: starD(10.5, 6, 9), detail: circ(0, 0, 2.8), dfill: true},
    n11daisy: {d: [0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => { const t = a * Math.PI / 180, x = r1(Math.cos(t) * 6.4), y = r1(Math.sin(t) * 6.4); return `M${x} ${y}m-3.4 0a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0Z`; }).join(""), detail: circ(0, 0, 3.4), dfill: true},
    n11wave: {d: "M-11.5 8C-11 0 -6 -9 2.5 -9.5C8.5 -10 11.5 -5.5 10.5 -1.5C9.4 2.6 4 2.4 3.6 -1C3.3 -3.4 5.6 -4.6 7 -3.6C6 -6.6 1 -6.6 -1.6 -3C-4.6 1.2 -4 6 -1 8Z"},
    n11frond: {d: "M-11 9C-6 -1 2 -7 11 -9C9 -6 6 -5.6 4.6 -2.6C7 -3.2 8 -2.4 8.6 -1.6C5.4 -0.6 3 0.8 1.4 2.8C3.6 2.4 4.8 3 5.4 3.6C1.6 4.6 -2.6 5.8 -11 9Z", detail: "M-10.5 8.6Q1 -1 10.6 -8.6", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "meadow", name: "Poppy Meadow", group: "ideas", desc: "A rolling alpine meadow of poppies under big summer clouds.",
      light: ["#F1F6EC", "rgba(76,138,52,.10)", "#FFFFFF", "#1E3020", "#55675A", "#D8E6D0", "#E6F0DF", "#F9FBF6", "#C2362A", "#D45E4C", "#FFFFFF", "#7A1E14", "#2E5A36", "#D2EAC6", "#FFE3A8"],
      dark: ["#0E1428", "rgba(240,120,106,.08)", "#16203A", "#EEF1FA", "#AEB6CE", "#28324E", "#1E2842", "#121A30", "#F0786A", "#F59A8E", "#1A1220", "#8A3A34", "#101A34", "#CCD6EE", "#6A3A3A"],
      glow: ["linear-gradient(180deg,#98CBF0,#C8E4F6 50%,#B4D894)", "linear-gradient(180deg,#0A1330,#26356A 55%,#213E3E)"],
      spine: [lg("#3E7A44", "#2A5530"), lg("#1E2A50", "#101A34")], btn: [lg2("#C2362A", "#D4502E"), lg2("#F0786A", "#F59A7A")]},
    kit: {motif: "n11poppy", card: ["#FAFCF6", "#E6F1DC"], ink: "#1E3020", bd: "#C6DCB4", mc: "#E0402E", r: 16, notes: ["#FBD9D2"].concat(NOTES), shape: "scallop", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "n11poppy", d ? ["#E8606A", "#F08A8A", "#C8485A"] : ["#E8402C", "#F2584A", "#D8302A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 10, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)}))
      .concat(fxBurst(W, H, n(14), "n11corn", d ? ["#8AA4FF", "#B0C0FF"] : ["#4C78DA", "#6A90F0"], [[0.25, 1.02], [0.75, 1.02]], {smin: 9, smax: 13}),
        fxBurst(W, H, n(14), "n11daisy", d ? ["#E8ECFA", "#FFFFFF"] : ["#FFFFFF", "#FFF8E8"], [[0.35, 1.02], [0.65, 1.02]], {smin: 9, smax: 13}),
        fxFall(W, H, n(46), "petal", d ? ["#E8606A", "#F4A0A8", "#D8DCF0"] : ["#E8402C", "#F2685A", "#FFFFFF"], {sway: 2, flip: true, smin: 6, smax: 10, vmin: 0.9, vmax: 1.7}).map(p => Object.assign(p, {vx: fxR(0.8, 1.8)})),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFF0C8", "#FFFFFF"] : ["#F6C83A", "#FFE07A"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A rolling alpine meadow full of poppies, cornflowers and daisies, with a winding stream, a lone oak and blue mountains under big summer clouds; moonlit and silvered at night"
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
