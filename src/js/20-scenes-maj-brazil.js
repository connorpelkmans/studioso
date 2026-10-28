/* ===== module: 20-scenes-maj-brazil.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a monstera leaf
  const monstera = () => { const L = [], R = []; for (let i = 0; i <= 20; i++) { const t = i / 20, w = 10.4 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.85) * (1 - 0.12 * t), y = 10.6 - t * 21.2, cut = i > 3 && i < 18 && i % 4 === 1;
    L.push(`${r1(-w * (cut ? 0.22 : 1))} ${r1(y)}`); R.unshift(`${r1(w * (i > 3 && i < 18 && i % 4 === 3 ? 0.22 : 1))} ${r1(y)}`); } return `M${L.join("L")}L${R.join("L")}Z`; };
  Object.assign(FX_SHAPES, {
    brazilmonstera: {d: monstera(), detail: "M0 10.6L0 -9", dstroke: true},
    // Sugarloaf and Morro da Urca with the cable car's wire and a car on it
    brazilloaf: {d: "M-12 9C-12 4 -10 2 -8 1C-6 -1 -2 -1 -1 1L1 2C2 -4 3 -9 6 -10.4C9 -11 10 -6 10.6 -1C11 3 12 6 12.6 9Z", detail: "M-4 -1.6L5.4 -9.4 M1.2 -6.6V-4.6 M-0.4 -4.6H2.8V-2.6H-0.4Z", dstroke: true},
    // a toco toucan's head and its great orange beak
    braziltoucan: {d: "M-10 6C-12 -2 -8 -8 -2 -8C1 -8 3 -7 4 -6C8 -7 12 -6 12.6 -3C12.8 -1.6 12 -1 11 -1.4C8 -2 6 -1.6 4 -1C3 4 0 9 -4 10C-7 10.6 -9 9 -10 6Z", detail: circ(-1.6, -3.6, 2) + "M4 -6C8 -7 12 -6 12.6 -3C12.8 -1.6 12 -1 11 -1.4C8 -2 6 -1.6 4 -1Z", dfill: true},
    // a coconut with a straw and a little cocktail umbrella
    braziloco: {d: circ(0, 3, 8.4), detail: "M2 -4L6 -11 M-6 -6L1 -9.4L-3 -12Z", dstroke: true},
    // a piece of samba confetti
    brazilconf: {d: "M-5 -2.6H5V2.6H-5Z"}
  });

  MAJ_THEMES.push({
    skin: {id: "brazil", name: "Brazil", group: "world", desc: "Christ the Redeemer, a colourful favela and Sugarloaf over a golden beach.",
      light: ["#F5FAF5", "rgba(19,128,78,.10)", "#FFFFFF", "#163026", "#4C6A5C", "#D2E6D8", "#E4F2E8", "#FAFDFA", "#13804E", "#2FA06A", "#FFFFFF", "#0C5A36", "#11603E", "#CDEBD8", "#FFE3A0"],
      dark: ["#0E1534", "rgba(255,210,74,.08)", "#17204A", "#F2F2FA", "#B4B8D6", "#2C3870", "#222C5E", "#121A3E", "#FFD24A", "#FFE08A", "#0C1838", "#7A6232", "#0C1838", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#7CC6F0,#D4EEF8 45%,#FCE8C4)", "linear-gradient(180deg,#0C1838,#1E2C5E 45%,#6A3A5E)"],
      spine: [lg("#1E8A5A", "#11603E"), lg("#1E2C5E", "#0C1838")], btn: [lg2("#13804E", "#E8A21E"), lg2("#FFD24A", "#7FE0A0")]},
    kit: {motif: "brazilmonstera", card: ["#FBFEF9", "#E8F6EA"], ink: "#163026", bd: "#BFE0C8", mc: "#E8A21E", r: 16, notes: ["#FFE9A8"].concat(NOTES), shape: "rounded", pin: "starpin", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "brazilconf", d ? ["#4ADE7A", "#FFD24A", "#5A9AF0", "#FF7AB4", "#FFA24A", "#B07AF0"] : ["#1FA34A", "#FFC81E", "#2A6FD6", "#FF5FA2", "#FF8A2A", "#9A4FD6"], {sway: 2, flip: true, smin: 5, smax: 8, glow: d ? 6 : 0})
      .concat(fxBurst(W, H, n(14), "brazilmonstera", d ? ["#3A9A5A", "#5ABA6A"] : ["#2E8A3E", "#4EAA48", "#3C9A44"], [[0.12, 1.02], [0.88, 1.02]], {smin: 12, smax: 17}),
        fxRise(W, H, n(4), "braziltoucan", d ? ["#FFA24A", "#FFC86A"] : ["#F28A1E", "#E8702A"], {cx: [0.15, 0.85], smin: 18, smax: 24, vmin: 1, vmax: 1.5, sway: 0.8, life: 300, glow: d ? 10 : 0}).map(p => Object.assign(p, {vr: 0})),
        fxRise(W, H, n(2), "brazilloaf", d ? ["#8A90C0"] : ["#6A7488"], {cx: [0.3, 0.7], smin: 20, smax: 24, vmin: 0.9, vmax: 1.2, sway: 0.3, life: 320, glow: d ? 12 : 0}).map(p => Object.assign(p, {vr: 0, rot: 0})),
        fxTw(W, H, n(24), "sparkle", d ? ["#FFE6A6", "#FFFFFF", "#7FE0A0"] : ["#FFC81E", "#FFD86B", "#1FA34A"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "Christ the Redeemer on Corcovado above a dense hillside favela of bright little houses and the towers of downtown, Sugarloaf and its glass bondinho cable cars over the bay, and a golden beach with umbrellas, towels, a coconut kiosk, palms, the waving Brazilian flag and a toucan in the rainforest"
  });
})();
/* end of module 20-scenes-maj-brazil.js */


