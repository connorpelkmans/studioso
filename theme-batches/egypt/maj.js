/* Around the World: Egypt (the pyramids of Giza, the Sphinx and the Nile at golden hour) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // the Great Pyramid with its courses
    egyptpyr: {d: "M0 -10L11.5 8.6H-11.5Z", detail: "M-3.8 -3.8H3.8M-6.3 0.3H6.3M-8.8 4.4H8.8M0 -10L2.4 8.6", dstroke: true},
    // a blue lotus flower opening on its pad
    egyptlotus: {d: "M0 6C-2.2 2 -2.2 -4 0 -10C2.2 -4 2.2 2 0 6Z M-0.4 6C-4.6 4.6 -8.4 -0.6 -8.6 -6.4C-4.4 -4.4 -1.4 -0.4 -0.4 6Z M0.4 6C4.6 4.6 8.4 -0.6 8.6 -6.4C4.4 -4.4 1.4 -0.4 0.4 6Z M-10 7.4Q0 3.6 10 7.4Q0 10.6 -10 7.4Z", detail: "M0 4V-6M-1.6 4.6Q-5 1 -6.4 -3.6M1.6 4.6Q5 1 6.4 -3.6", dstroke: true},
    // an ibis in flight: wings up, long neck and curved bill
    egyptibis: {d: "M-9 1C-6 -1.4 2 -1.6 4.6 -0.6L8.4 -1.8Q10.8 -2.2 11.8 0.8L11.2 1.2Q10.2 -0.4 8.6 -0.2L5 1.6C1.6 3 -4.6 3 -9 1Z M-3.4 -0.6L-6.6 -10L-1.6 -9.2L2.4 -0.8Z M-11.6 1.6L-8 0.6L-7.6 2.2Z"},
    // a scarab beetle seen from above
    egyptscarab: {d: ell(0, 2, 6.4, 7.6) + ell(0, -6.8, 3.8, 2.6) + "M-2.4 -9.4L-4 -11.6L-1.4 -9.8Z M2.4 -9.4L4 -11.6L1.4 -9.8Z M-6 -1L-10 -3.4L-9.6 -2L-6 0.4Z M6 -1L10 -3.4L9.6 -2L6 0.4Z M-6 3.6L-10.4 3.4L-10 4.6L-5.8 5Z M6 3.6L10.4 3.4L10 4.6L5.8 5Z M-4.6 7.4L-8 10.6L-6.8 11L-3.6 8.6Z M4.6 7.4L8 10.6L6.8 11L3.6 8.6Z", detail: "M0 -4.4V9.4M-5.6 -2.4Q0 -5.2 5.6 -2.4", dstroke: true},
    // a papyrus umbel: a burst of rays on a short stem
    egyptpapy: {d: "M0 11V-1" + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = -Math.PI * (0.04 + 0.92 * i / 8), c = Math.cos(a), s = Math.sin(a); return `M0 -1Q${r1(c * 5)} ${r1(-1 + s * 6)} ${r1(c * 9.6)} ${r1(-1 + s * 9.6 + 3 * c * c)}`; }).join(""), stroke: true, lw: 1.3},
    // a felucca's lateen sail on its hull
    egyptsail: {d: "M5.4 6.4L-6.6 -11.4Q-1.6 -2.6 -5 5.2Q0.4 4.4 5.4 6.4Z M-9.6 7.2H9.6L7.6 10.4H-7.6Z", detail: "M5.6 6.6L-7.4 -12.4M0.6 6L-0.4 -8.6", dstroke: true},
    // the low sun with short rays
    egyptsun: {d: circ(0, 0, 5.6) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = i / 10 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return pts([[c * 7 - s * 1.2, s * 7 + c * 1.2], [c * 11, s * 11], [c * 7 + s * 1.2, s * 7 - c * 1.2]]); }).join(""), detail: circ(0, 0, 3.4), dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "egypt", name: "Egypt", group: "world", desc: "The pyramids at golden hour above the Nile.",
      light: ["#FBF5EA", "rgba(176,100,28,.10)", "#FFFFFF", "#2A2216", "#6E604C", "#ECDDC4", "#F5EBDA", "#FDFAF4", "#B0641C", "#C98A3E", "#FFFFFF", "#7A4214", "#1D3D6A", "#E6EEF8", "#FFE3A0"],
      dark: ["#0E1230", "rgba(242,196,98,.08)", "#171B40", "#F6F0E2", "#BDB4CF", "#2C3062", "#22275A", "#131736", "#F2C462", "#F7DC94", "#1A1838", "#7A6232", "#14163A", "#D8D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#9CCBEA,#F4E6C6 45%,#F6C98A)", "linear-gradient(180deg,#0C1232,#1E2050 45%,#4E3260)"],
      spine: [lg("#2F5E96", "#1D3D6A"), lg("#2A2E66", "#14163A")], btn: [lg2("#B0641C", "#D9962E"), lg2("#F2C462", "#F7DC94")]},
    kit: {motif: "egyptpyr", card: ["#FFFAF0", "#F6E6CC"], ink: "#2A2216", bd: "#E8D0A8", mc: "#B0641C", r: 12, notes: ["#F6E2BC", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(10), "egyptibis", d ? ["#F4F0FF", "#E2DCF6"] : ["#3A2A26", "#5A4034"], {smin: 12, smax: 18, vmin: 1.1, vmax: 1.9, sway: 0.6, life: 320, glow: d ? 10 : 0})
      .concat(fxFall(W, H, n(32), "egyptlotus", d ? ["#9AB4FF", "#C4D0FF", "#F6C4D8"] : ["#3E6FC6", "#5A8CE0", "#E888A8"], {sway: 1.6, flip: true, smin: 7, smax: 11, vmin: 0.9, vmax: 1.8, glow: d ? 6 : 0}),
        fxBurst(W, H, n(10), "egyptscarab", d ? ["#4AC8B8", "#3AA8C8"] : ["#1F8A84", "#2A6FA0"], [[0.2, 1.02], [0.8, 1.02]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxBurst(W, H, n(4), "egyptpyr", d ? ["#F2C462"] : ["#E0A040"], [[0.5, 1.04]], {smin: 14, smax: 18, glow: d ? 12 : 4}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "The pyramids of Giza and the Sphinx at golden hour, above the Nile with its palms, papyrus and a white-sailed felucca"
  });
})();
