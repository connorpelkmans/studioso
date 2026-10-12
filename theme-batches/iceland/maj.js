/* Around the World: Iceland */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // Kirkjufell: the arrowhead peak with a strata line and a snow streak
    icelandkirk: {d: pts([[-11, 9], [-7, 5], [-4.4, 0], [-2.4, -5], [-0.6, -9.6], [0.8, -10], [2.4, -6.4], [4.4, -3.4], [7, -0.4], [9.4, 4], [11, 9]]), detail: "M-5.6 2.4Q0 1 6.6 2.4M-3.4 -2.6Q0 -3.6 4 -2.6M-1 -7.4L-0.4 -4", dstroke: true},
    // a puffin seen from the front, wings spread (its flap squeezes it sideways, like wingbeats)
    icelandpuffin: {d: ell(0, 1.6, 4.6, 6) + circ(0, -5.4, 4) + pts([[-3.6, -0.6], [-11, -4.4], [-10, -1], [-4, 3]]) + pts([[3.6, -0.6], [11, -4.4], [10, -1], [4, 3]]) + pts([[-1.8, 7], [-3.6, 9.6], [-0.6, 8.6]]) + pts([[1.8, 7], [3.6, 9.6], [0.6, 8.6]]),
      detail: ell(0, -5, 3, 2.6) + ell(0, 2.4, 3, 4.4), dfill: true},
    // a lupine spike
    icelandlupine: {d: "M-0.7 2H0.7V11H-0.7Z" + [0, 1, 2, 3, 4].map(i => ell(-1.7, 1 - i * 2.4, 1.8 - i * 0.18, 1.3) + ell(1.7, -0.2 - i * 2.4, 1.8 - i * 0.18, 1.3)).join("") + ell(0, -11, 1, 1.6)},
    // a water drop of spray
    icelanddrop: {d: "M0 -9C3 -4 6 -0.6 6 3A6 6 0 0 1 -6 3C-6 -0.6 -3 -4 0 -9Z", detail: "M-3 2.4Q-3 -0.4 -1 -2.4", dstroke: true},
    // a curl of the aurora
    icelandaurora: {d: "M-11 6C-8 -2 -4 -8 0 -9C4 -10 8 -6 11 -9L11 -5C8 -2 4 -6 0 -4C-4 -2 -7 2 -8 8Z"}
  });

  MAJ_THEMES.push({
    skin: {id: "iceland", name: "Iceland", group: "world", desc: "A lone peak, waterfalls and black sand shores.",
      light: ["#EEF5F3", "rgba(46,122,102,.10)", "#FFFFFF", "#18302C", "#56706A", "#D2E2DE", "#E3EEEB", "#F8FBFA", "#2E7A66", "#4E9686", "#FFFFFF", "#1C5244", "#245448", "#D0EAE2", "#FFE7A8"],
      dark: ["#081426", "rgba(124,224,176,.08)", "#0F1E36", "#E8F4F2", "#A2BCC0", "#22385A", "#18294A", "#0C1830", "#7CE0B0", "#A6EECB", "#0A1A2E", "#3E8A70", "#0A1A2E", "#C6E4DC", "#3E6A54"],
      glow: ["linear-gradient(180deg,#A8CFE6,#E2EEF2 50%,#E6EEDD)", "linear-gradient(180deg,#08142C,#10264A 48%,#1F4A5A)"],
      spine: [lg("#3E7A6A", "#245448"), lg("#14304A", "#0A1A2E")], btn: [lg2("#2E7A66", "#3E86A8"), lg2("#7CE0B0", "#9FD8F0")]},
    kit: {motif: "icelandkirk", card: ["#F9FCFB", "#E6F1EE"], ink: "#18302C", bd: "#C6DCD6", mc: "#2E7A66", r: 16, notes: ["#E2F0D6"].concat(NOTES), shape: "torn", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(9), "icelandpuffin", d ? ["#2E2C36", "#3A3844"] : ["#2A2830", "#34323C"], {smin: 14, smax: 20, vmin: 1.4, vmax: 2.4, sway: 1.2, life: 280, glow: d ? 6 : 0}).map(p => Object.assign(p, {flap: fxR(0.25, 0.38), vx: fxR(0.6, 1.6)}))
      .concat(fxBurst(W, H, n(26), "icelanddrop", d ? ["#9CD8F0", "#C8ECF8", "#7CE0B0"] : ["#7CC4E0", "#A8DCEE", "#5AAED0"], [[0.2, 1.02], [0.5, 1.04], [0.8, 1.02]], {smin: 6, smax: 10}),
        fxFall(W, H, n(14), "icelandlupine", d ? ["#9A86E8", "#B8A8F0"] : ["#8C6CD6", "#A88CE8", "#6E54C0"], {sway: 1.4, smin: 11, smax: 15, vmin: 1, vmax: 1.8}).map(p => Object.assign(p, {vr: fxR(-0.03, 0.03), rot: fxR(-0.4, 0.4)})),
        d ? fxTw(W, H, n(6), "icelandaurora", ["#7CE0B0", "#9AF0C8", "#B89CFF"], {smin: 26, smax: 40, top: 0.5, glow: 16, alpha: 0.7}) : [],
        fxTw(W, H, n(24), "sparkle", d ? ["#C8F4E0", "#FFFFFF"] : ["#7CC4E0", "#FFFFFF", "#F2C84A"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "Kirkjufell above a bay, with a cascade of little waterfalls over mossy basalt, turf-roofed cottages and a black sand beach"
  });
})();
