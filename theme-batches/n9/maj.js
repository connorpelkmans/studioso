/* New theme ideas, batch n9: bayou (Firefly Bayou).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a pointed petal from the centre out along angle a (degrees), length L, half width w
  const petal = (a, L, w) => { const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), P = (x, y) => `${r1(x * c - y * s)} ${r1(x * s + y * c)}`; return `M${P(0, 0)}Q${P(L * 0.45, -w)} ${P(L, 0)}Q${P(L * 0.45, w)} ${P(0, 0)}Z`; };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // a water lily seen from above: eight pointed petals round a golden heart
    n9lily: {d: [0, 45, 90, 135, 180, 225, 270, 315].map(a => petal(a, 10.5, 3.6)).join(""), detail: circ(0, 0, 2.6), dfill: true},
    // a lily pad with its notch
    n9pad: {d: "M0 0L1.6 -10.4A10.5 10.5 0 1 1 -1.6 -10.4Z", detail: "M0 0L6 -6M0 0L8 2M0 0L2 8M0 0L-6 6M0 0L-8 -2", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "bayou", name: "Firefly Bayou", group: "ideas", desc: "A still green bayou of cypress and Spanish moss, glowing with fireflies at night.",
      light: ["#F3F4EA", "rgba(78,110,70,.10)", "#FFFFFC", "#1C2618", "#56604C", "#D8DECB", "#E8EDDC", "#FAFBF5", "#A8562A", "#C07438", "#FFFFFF", "#6E3414", "#2E4A34", "#D2E2C8", "#FFE3A0"],
      dark: ["#08161A", "rgba(255,214,110,.07)", "#0F2226", "#EEF4E8", "#A8BCAE", "#1F3A3A", "#163030", "#0B1C20", "#FFD36E", "#FFE6A0", "#14200E", "#8A6A20", "#0A1C1E", "#D6E6D0", "#6A5A20"],
      glow: ["linear-gradient(180deg,#A9C9B6,#EADFAE 55%,#F6CC8C)", "linear-gradient(180deg,#07141A,#123230 55%,#1C4038)"],
      spine: [lg("#3E5E42", "#2E4A34"), lg("#0E2628", "#08161A")], btn: [lg2("#A8562A", "#C27A36"), lg2("#FFD36E", "#FFE9A8")]},
    kit: {motif: "n9lily", card: ["#F8F9F0", "#E6ECD8"], ink: "#1C2618", bd: "#C8D4B4", mc: "#A8562A", r: 16, notes: ["#E4EDD2"].concat(NOTES), shape: "scallop", pin: "pin", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(60), "circle", d ? ["#FFE27A", "#FFD04A", "#F2FF9A"] : ["#FFD86B", "#F2C24A", "#FFF0B0"], {smin: 2.5, smax: 5, vmin: 0.6, vmax: 1.5, sway: 2.2, life: 280, glow: d ? 14 : 8})
      .concat(fxBurst(W, H, n(16), "n9lily", d ? ["#F4F0F8", "#FFC8DA", "#FFFFFF"] : ["#FFFFFF", "#FFB8CC", "#FFE0EA"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
        fxBurst(W, H, n(10), "n9pad", d ? ["#2E6A44", "#3E7E50"] : ["#5E9A3E", "#79B04A"], [[0.3, 1.02], [0.7, 1.02]], {smin: 11, smax: 15}),
        fxTw(W, H, n(24), "sparkle", d ? ["#FFE27A", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 12 : 4}))},
    tag: "A still green bayou of bald cypress, knees and curtains of Spanish moss, with water lilies, duckweed and hundreds of fireflies over mirror-black water at night"
  });
})();
