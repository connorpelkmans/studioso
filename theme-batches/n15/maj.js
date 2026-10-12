/* New theme ideas, batch n15: fjord (Fjord), storm (Storm Prairie).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n15bell: {d: "M-1.2 -10.5C-1 -8 -0.6 -7.4 0 -7.2C5.6 -7 8.4 -2 8.6 3.4C8.8 6.4 10.6 8 10.6 8.6C7.4 10 3.6 8.2 0 9.8C-3.6 8.2 -7.4 10 -10.6 8.6C-10.6 8 -8.8 6.4 -8.6 3.4C-8.4 -2 -5.6 -7 -1.2 -7.4Z", detail: "M-4 8.6Q0 6.4 4 8.6", dstroke: true},
    n15birch: {d: "M0 -11C5.6 -7.6 9.4 -2.4 8.6 3C7.8 8 3.6 10.4 0 11C-3.6 10.4 -7.8 8 -8.6 3C-9.4 -2.4 -5.6 -7.6 0 -11Z", detail: "M0 -9.6V10M0 -3L-5 -6.4M0 -3L5 -6.4M0 3L-6 0M0 3L6 0", dstroke: true},
    n15drop: {d: "M0 -11C3 -6 8 -1.4 8 4C8 8.6 4.4 11.4 0 11.4C-4.4 11.4 -8 8.6 -8 4C-8 -1.4 -3 -6 0 -11Z", detail: circ(-2.8, 3, 2.2), dfill: true},
    n15wheat: {d: "M-0.8 11V-2.2C-3.4 -2.6 -4.4 -4.4 -4 -6C-2.4 -5.6 -1.2 -4.6 -0.8 -3.6V-4.6C-3.4 -5 -4.4 -6.8 -4 -8.4C-2.4 -8 -1.2 -7 -0.8 -6V-7C-2.6 -8 -2.6 -10.2 0 -12C2.6 -10.2 2.6 -8 0.8 -7V-6C1.2 -7 2.4 -8 4 -8.4C4.4 -6.8 3.4 -5 0.8 -4.6V-3.6C1.2 -4.6 2.4 -5.6 4 -6C4.4 -4.4 3.4 -2.6 0.8 -2.2V11Z"},
    n15bolt: {d: "M2.6 -11.5L-6.4 1.4H-0.8L-3.2 11.5L6.6 -2H1L2.6 -11.5Z"}
  });

  MAJ_THEMES.push({
    skin: {id: "fjord", name: "Fjord", group: "ideas", desc: "Sheer granite walls, ribbon waterfalls and mirror-still water.",
      light: ["#EEF3F4", "rgba(46,104,128,.10)", "#FFFFFF", "#17262E", "#52646C", "#D2DEE2", "#E2EBEE", "#F8FBFB", "#B8392C", "#CC5A48", "#FFFFFF", "#6E1E16", "#24485A", "#C9DDE4", "#FFE3A8"],
      dark: ["#121834", "rgba(231,191,164,.08)", "#1A2244", "#EEF0FA", "#AEB4D0", "#2A3258", "#212A4C", "#161E3C", "#E7A88E", "#F0BEA6", "#1A1428", "#8A4A3E", "#121A3A", "#CCD2EE", "#6A4A4A"],
      glow: ["linear-gradient(180deg,#93BAD8,#EEF1E8 50%,#7FA6C4)", "linear-gradient(180deg,#283466,#E7BFA4 50%,#2C3666)"],
      spine: [lg("#2E5A6E", "#1C3A4A"), lg("#2A3462", "#161C3C")], btn: [lg2("#B8392C", "#CC5A3A"), lg2("#E7A88E", "#F0C2A0")]},
    kit: {motif: "n15bell", card: ["#F8FBFB", "#E2EDF0"], ink: "#17262E", bd: "#B8CED6", mc: "#5A6AD0", r: 16, notes: ["#DCE8F0"].concat(NOTES), shape: "rounded", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(20), "n15bell", d ? ["#8A92E0", "#A8B0F0"] : ["#5A6AD8", "#7A8AE8"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)}))
      .concat(fxBurst(W, H, n(16), "n15birch", d ? ["#6A9A7A", "#8AB890"] : ["#8CC060", "#B4D870", "#E8D060"], [[0.1, 1.02], [0.9, 1.02]], {smin: 9, smax: 13}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08)})),
        fxFall(W, H, n(40), "n15drop", d ? ["#C8D0F4", "#E8EAFF"] : ["#BFE2F2", "#E4F4FA", "#FFFFFF"], {sway: 0.6, smin: 4, smax: 7, vmin: 1.6, vmax: 2.8}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE6C8", "#FFFFFF"] : ["#FFFFFF", "#FFF2C8"], {smin: 3, smax: 6, glow: d ? 10 : 5}))},
    tag: "A deep Norwegian fjord between sheer green-and-granite cliffs with ribbon waterfalls, a tiny red cabin on a grassy ledge and mirror-still water; a pale summer twilight with the moon at night"
  });
  MAJ_THEMES.push({
    skin: {id: "storm", name: "Storm Prairie", group: "ideas", desc: "Golden wheat under a towering, sunlit supercell.",
      light: ["#F6F2E6", "rgba(184,118,42,.10)", "#FFFFFF", "#26241E", "#6A6456", "#E4DCC8", "#EEE8D8", "#FCFAF4", "#B86A1E", "#CC8A3A", "#FFFFFF", "#5A320C", "#3A4A5E", "#E8DDBE", "#FFE3A0"],
      dark: ["#0E1428", "rgba(150,180,255,.08)", "#161E38", "#EDF0FA", "#A8B2CE", "#26304E", "#1E2744", "#121A30", "#9EB8FF", "#B8CCFF", "#101830", "#3A4C8A", "#0E1630", "#C8D4F0", "#3A4A7A"],
      glow: ["linear-gradient(180deg,#5A6A82,#E8C88A 55%,#D8A84E)", "linear-gradient(180deg,#0A1024,#26345E 55%,#1C2A3E)"],
      spine: [lg("#4A5A72", "#2E3A4E"), lg("#1C2648", "#0C1228")], btn: [lg2("#B86A1E", "#D88A2E"), lg2("#8EA8FF", "#B8CCFF")]},
    kit: {motif: "n15wheat", card: ["#FDFAF2", "#F2E8CC"], ink: "#26241E", bd: "#E0CFA0", mc: "#C8902E", r: 14, notes: ["#F6E6B8"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => (d
      ? fxTw(W, H, n(10), "n15bolt", ["#DDE6FF", "#B8CCFF", "#FFFFFF"], {smin: 12, smax: 20, glow: 18, top: 0.5})
        .concat(fxBurst(W, H, n(18), "n15wheat", ["#C8B478", "#E2D098"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
          fxTw(W, H, n(30), "sparkle", ["#DDE6FF", "#FFFFFF"], {smin: 3, smax: 6, glow: 12}))
      : fxBurst(W, H, n(22), "n15wheat", ["#E2A83A", "#F0C25A", "#D08A2A"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)}))
        .concat(fxFall(W, H, n(40), "n15drop", ["#A8C4DC", "#C8DCEC"], {sway: 0.4, smin: 4, smax: 7, vmin: 2, vmax: 3.4}),
          fxTw(W, H, n(24), "sparkle", ["#FFE08A", "#FFFFFF"], {smin: 3, smax: 6, glow: 5})))},
    tag: "A vast golden wheat prairie under a towering sculpted supercell with sunlit edges, distant rain curtains and a lone windbreak of trees; silent lightning flickers inside the clouds at night"
  });
})();
