/* ===== module: 20-scenes-maj-canada.js ===== */
/* Around the World, batch canada */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  const LEAF = [[0, -1], [0.14, -0.6], [0.4, -0.76], [0.32, -0.36], [0.82, -0.5], [0.64, -0.16], [0.94, 0.02], [0.5, 0.2], [0.56, 0.46], [0.12, 0.3], [0.05, 0.78], [-0.05, 0.78], [-0.12, 0.3], [-0.56, 0.46], [-0.5, 0.2], [-0.94, 0.02], [-0.64, -0.16], [-0.82, -0.5], [-0.32, -0.36], [-0.4, -0.76], [-0.14, -0.6]];
  Object.assign(FX_SHAPES, {
    canadaleaf: {d: pts(LEAF.map(p => [p[0] * 11.5, p[1] * 11.5 - 1])), detail: "M0 7.6L0 -9M0 1L6.4 -4M0 1L-6.4 -4M0 3L5 3.6M0 3L-5 3.6", dstroke: true},
    canadaspruce: {d: "M0 -11.5L3 -6.5L1.6 -6.4L5.4 -1.4L3.4 -1.2L8 4.6L1.4 4.6V11H-1.4V4.6L-8 4.6L-3.4 -1.2L-5.4 -1.4L-1.6 -6.4L-3 -6.5Z"},
    canadacanoe: {d: "M-11.5 -3.6Q-9 0 -6 0.4H6Q9 0 11.5 -3.6Q10.4 3.6 4 4.4H-4Q-10.4 3.6 -11.5 -3.6Z M5.6 -10.4L6.8 -10.2L3.4 2.2L2.2 2Z", detail: "M-8 0.6H8", dstroke: true},
    canadamtn: {d: "M-11.5 8.5L-5.4 -2.4L-3.2 0.2L1.2 -8.6L6.2 0.6L8 -1.6L11.5 8.5Z", detail: "M1.2 -8.6L3.6 -3.8L2 -4.6L0.6 -3L-0.8 -4.8Z", dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "canada", name: "Canada", group: "world", desc: "A turquoise lake below the Rocky Mountains.",
      light: ["#EEF6F5", "rgba(184,58,44,.10)", "#FFFFFF", "#17303A", "#4E6670", "#D2E3E2", "#E2EEED", "#F7FBFA", "#B83A2C", "#CF6252", "#FFFFFF", "#7A2218", "#134C56", "#CDEDEA", "#FFE2A8"],
      dark: ["#0B1428", "rgba(94,212,208,.08)", "#13203A", "#EEF4FA", "#A9BBD0", "#263A5A", "#1C2D4C", "#0F1A32", "#5ED4D0", "#8FE6DC", "#0E1E30", "#2A7A80", "#0A1430", "#C4E2EC", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#9CCDF0,#DCEEF8 45%,#EFF3E6)", "linear-gradient(180deg,#0A1430,#172A50 45%,#2C4A5E)"],
      spine: [lg("#1E7480", "#134C56"), lg("#172A50", "#0A1430")], btn: [lg2("#B83A2C", "#D9662A"), lg2("#5ED4D0", "#8FE6DC")]},
    kit: {motif: "canadaleaf", card: ["#FBFDFC", "#E3F2F0"], ink: "#17303A", bd: "#B8DAD6", mc: "#C8392B", r: 12, notes: ["#FBD8C8", "#CDEDEA"].concat(NOTES), shape: "folded", pin: "tape", fab: "18px 18px 6px 18px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "canadaleaf", d ? ["#E0503A", "#F08A3A", "#F2B04A", "#C83A2E"] : ["#D6382A", "#EE8C2A", "#F2B23E", "#B82E22"], {sway: 2.2, flip: true, smin: 9, smax: 15, vmin: 1, vmax: 2.2}).map(p => Object.assign(p, {vx: fxR(0.4, 1.4)}))
      .concat(fxBurst(W, H, n(12), "canadacanoe", d ? ["#E05A44", "#F2B04A"] : ["#D6382A", "#C8462E"], [[0.2, 1.02], [0.8, 1.02]], {smin: 13, smax: 17}).map(p => Object.assign(p, {vr: fxR(-0.04, 0.04)})),
        fxBurst(W, H, n(14), "canadaspruce", d ? ["#3A7A62", "#2E6650"] : ["#2B5345", "#3A6656", "#2F6A4E"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 10, smax: 14}),
        fxTw(W, H, n(26), "sparkle", d ? ["#7CF0C0", "#C49CFF", "#FFFFFF"] : ["#5ED2D0", "#FFFFFF", "#F2B23E"], {smin: 3, smax: 7, top: 0.6, glow: d ? 12 : 4}))},
    tag: "A turquoise glacier lake below a jagged wall of snowy Rocky Mountain peaks, with red canoes at the dock, a log cabin and maples in autumn color"
  });
})();
/* end of module 20-scenes-maj-canada.js */


