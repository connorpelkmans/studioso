/* Around the World: Mexico (a rainbow hillside town around a pink cathedral) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ring = (n, f) => Array.from({length: n}, (_, i) => f(i / n * Math.PI * 2, i)).join("");
  Object.assign(FX_SHAPES, {
    // a talavera tile flower: four round petals around a heart, with little pointed leaves between them
    mexicotile: {d: ring(4, a => circ(Math.cos(a + Math.PI / 4) * 5.2, Math.sin(a + Math.PI / 4) * 5.2, 4.4)) + ring(4, a => pts([[Math.cos(a) * 6, Math.sin(a) * 6], [Math.cos(a + 0.35) * 11, Math.sin(a + 0.35) * 11], [Math.cos(a) * 12, Math.sin(a) * 12], [Math.cos(a - 0.35) * 11, Math.sin(a - 0.35) * 11]])), detail: circ(0, 0, 2.6), dfill: true},
    // a papel picado flag: a zigzag bottom edge with a cut flower and four diamonds
    mexicopapel: {d: "M-8 -9H8V8L5.3 6L2.7 8L0 6L-2.7 8L-5.3 6L-8 8Z", detail: circ(0, -1.5, 2.6) + "M-5 -6L-4 -4.8L-5 -3.6L-6 -4.8Z M5 -6L6 -4.8L5 -3.6L4 -4.8Z M-5 2L-4 3.2L-5 4.4L-6 3.2Z M5 2L6 3.2L5 4.4L4 3.2Z", dfill: true},
    // a jacaranda flower: a little lilac trumpet seen from the front
    mexicojac: {d: ring(5, a => circ(Math.cos(a - Math.PI / 2) * 3.8, Math.sin(a - Math.PI / 2) * 3.8, 3.4)), detail: circ(0, 0.4, 1.8), dfill: true},
    // a party balloon with its knot and a curl of string
    mexicoballoon: {d: "M0 -11C7 -11 9.4 -4 8.4 0.6C7.4 5.6 3 9 0 9.6C-3 9 -7.4 5.6 -8.4 0.6C-9.4 -4 -7 -11 0 -11Z M-1.6 9.4H1.6L0 11.6Z", detail: "M0 11.6Q-2.6 14 0 16Q2.6 18 0 20", dstroke: true},
    mexicoconfetti: {d: "M-5 -2.6H5V2.6H-5Z"}
  });
  MAJ_THEMES.push({
    skin: {id: "mexico", name: "Mexico", group: "world", desc: "A rainbow hillside town around a pink cathedral.",
      light: ["#FCF6EE", "rgba(194,69,110,.10)", "#FFFFFF", "#2E1E2A", "#6E5A62", "#EEDCCC", "#F7ECE2", "#FEFAF5", "#C2456E", "#2F5FB0", "#FFFFFF", "#8E2E50", "#7E2848", "#F6D8E2", "#FFE2A8"],
      dark: ["#120F2C", "rgba(242,162,192,.08)", "#1C1838", "#F6EEF8", "#C2B2D2", "#34295A", "#26204A", "#161330", "#F2A2C0", "#F6C88A", "#16132E", "#7A3A5A", "#16122E", "#E2D2F0", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#8CCBF0,#E4F2F6 45%,#FCE2C6)", "linear-gradient(180deg,#0F1636,#2A2458 45%,#6A3458)"],
      spine: [lg("#C2456E", "#7E2848"), lg("#2A2458", "#0F1636")], btn: [lg2("#C2456E", "#E07A3A"), lg2("#F2A2C0", "#F6C88A")]},
    kit: {motif: "mexicotile", card: ["#FFFBF5", "#F6E6EC"], ink: "#2E1E2A", bd: "#EBCFD8", mc: "#C2456E", r: 14, notes: ["#FFE2EC", "#FFF1B8", "#DDF2CC", "#D6E4FF", "#FFDCC8", "#E8DCFF"], shape: "torn", pin: "tape", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "mexicoballoon", d ? ["#E05A9A", "#F2B44A", "#4A7AE0", "#8ACB5A", "#F2805A"] : ["#E2468C", "#F4B23A", "#3462B6", "#8CC24E", "#F27A5A"], {smin: 14, smax: 22, vmin: 1.2, vmax: 2.2, sway: 0.7, life: 320, glow: d ? 8 : 0})
      .concat(fxFall(W, H, n(40), "mexicopapel", d ? ["#E05A9A", "#F2B44A", "#4A7AE0", "#8ACB5A", "#3ABAB8"] : ["#E2468C", "#F4B23A", "#3462B6", "#8CC24E", "#2AAEB0"], {sway: 1.9, flip: true, smin: 8, smax: 12}),
        fxFall(W, H, n(36), "mexicojac", d ? ["#8070C8", "#9A8ADA", "#B4A2F0"] : ["#9C88E6", "#B4A2F0", "#8070D6"], {sway: 1.6, flip: true, smin: 6, smax: 9, vmin: 0.9, vmax: 1.8}),
        fxBurst(W, H, n(40), "mexicoconfetti", ["#E2468C", "#F4B23A", "#3462B6", "#8CC24E", "#F27A5A", "#2AAEB0"], [[0.15, 1.02], [0.85, 1.02]], {smin: 7, smax: 10, flip: true}),
        fxTw(W, H, n(18), "mexicotile", d ? ["#F2C45A", "#7AA0F0", "#FFFFFF"] : ["#2F5FB0", "#C2456E", "#E8A030"], {smin: 6, smax: 10, glow: d ? 10 : 0, top: 0.8}))},
    tag: "A Guanajuato-style hillside of saffron, cobalt, coral and magenta houses around a pink Gothic cathedral, with a talavera fountain, a wrought-iron bandstand, jacarandas and papel picado over the plaza"
  });
})();
