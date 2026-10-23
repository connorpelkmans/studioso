/* ===== module: 20-scenes-maj-italy.js ===== */
/* Around the World: italy (Amalfi Coast) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // an Amalfi lemon: pointed at both ends, with a leaf
    italylemon: {d: "M-10 1C-10 -4 -5 -7.4 0 -7.4C5 -7.4 10 -4 10 1C10 5 5 7.4 0 7.4C-5 7.4 -10 5 -10 1Z M-10 1L-12 0.2L-10.4 -0.6Z M10 1L12 0.2L10.4 -0.6Z M1 -7.2C3 -11 7 -12 10 -11C8 -8 4 -7 1 -7.2Z", detail: "M-5 -3.4Q-2 -5.4 2 -5", dstroke: true},
    // lemon blossom: five round petals and a yellow heart
    italyblossom: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 5.4, Math.sin(a) * 5.4, 4.6); }).join("") + circ(0, 0, 4), detail: circ(0, 0, 2.2), dfill: true},
    // a striped beach umbrella
    italyumb: {d: "M-11 -1C-10 -8 -4 -10.5 0 -10.5C4 -10.5 10 -8 11 -1Z M-0.8 -1H0.8V10H-0.8Z", detail: "M0 -10.5L-6 -1M0 -10.5L6 -1M0 -10.5V-1", dstroke: true},
    // a little sailboat
    italysail: {d: "M0.6 -11L9 4H0.6Z M-1 -8L-8.6 4H-1Z M-11 5.6H11L7.6 10.4H-7.6Z"},
    // a majolica tile: a square with a flower star
    italytile: {d: "M-9 -9H9V9H-9Z", detail: "M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z" + circ(0, 0, 1.4), dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "italy", name: "Amalfi Coast", group: "world", desc: "A pastel cliff town tumbling down to a turquoise cove.",
      light: ["#F3F8FA", "rgba(38,138,176,.10)", "#FFFFFF", "#1E2C38", "#56656F", "#D6E6EC", "#E6F0F3", "#FAFCFD", "#C4522F", "#D7744F", "#FFFFFF", "#7A2E18", "#1E5778", "#D2EAF2", "#FFE6A0"],
      dark: ["#0F1630", "rgba(246,200,74,.08)", "#18203E", "#F2F2FA", "#B6B8D2", "#2C3460", "#232A52", "#141A36", "#F6C84A", "#FADB86", "#1A2040", "#7A6A32", "#101C3A", "#D4D6EE", "#6A5A2A"],
      glow: ["linear-gradient(180deg,#9FD3F0,#DDF0F7 45%,#FCEBD0)", "linear-gradient(180deg,#101C3A,#22305A 45%,#5A3C5E)"],
      spine: [lg("#2C7FA8", "#1E5778"), lg("#22305A", "#101C3A")], btn: [lg2("#C4522F", "#E39A2E"), lg2("#F6C84A", "#FFE08A")]},
    kit: {motif: "italylemon", card: ["#FFFDF6", "#EAF5F7"], ink: "#1E2C38", bd: "#BFDDE6", mc: "#E8B820", r: 16, notes: ["#FFF0A8", "#FBD8D2"].concat(NOTES), shape: "rounded", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "italylemon", d ? ["#F6D04A", "#FFE07A", "#E8B830"] : ["#F7CB34", "#F2B820", "#FFD84A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)}))
      .concat(fxFall(W, H, n(40), "italyblossom", d ? ["#FFFFFF", "#F6E8F0"] : ["#FFFFFF", "#FFF6E0", "#FDE4EC"], {sway: 1.6, smin: 6, smax: 9, vmin: 0.8, vmax: 1.6, glow: d ? 6 : 0}),
        fxRise(W, H, n(3), "italysail", d ? ["#F2F2FA", "#FFE08A"] : ["#FFFFFF", "#F6F0E0"], {cx: [0.25, 0.75], smin: 18, smax: 24, vmin: 0.8, vmax: 1.2, sway: 0.5, life: 320, glow: d ? 10 : 0}).map(p => Object.assign(p, {vr: 0, rot: 0})),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#7FD4E0", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A Positano-style town of pastel houses stacked down limestone cliffs to a turquoise cove, with a majolica dome, lemon terraces, striped umbrellas and the Italian flag waving on the terrace"
  });
})();
/* end of module 20-scenes-maj-italy.js */


