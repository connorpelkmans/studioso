/* Around the World: venice (Venice) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  Object.assign(FX_SHAPES, {
    // a gondola in profile: the long black hull rising to the stern curl and the toothed bow iron
    venicegondola: {d: "M-12.6 -3.6Q-12.8 -1.4 -11.4 0.6Q-6 3.6 4 3.2Q9 2.8 10.6 -0.6L11.4 -4.6L12.6 -5L12.4 -6.6L10.6 -6.2L10 -2.2Q9 -0.2 6.6 0.2Q-1 1.2 -8.6 -0.4Q-11 -1.2 -11.6 -3.6Z",
      detail: "M10.8 -5.4H12.4M11 -4.4H12.2M11.1 -3.4H12M-4 0.6Q0 1.2 4 0.8", dstroke: true},
    // a carnival half-mask, the eyes cut out, a curl at each side
    venicemask: {d: "M-11 -2.6Q-11.6 -7 -6.4 -6.4Q-2.4 -5.8 0 -3.6Q2.4 -5.8 6.4 -6.4Q11.6 -7 11 -2.6Q10.6 2.8 6 3.6Q2.4 4.2 0 1.4Q-2.4 4.2 -6 3.6Q-10.6 2.8 -11 -2.6Z" + ell(-5.2, -1.6, 2.6, 1.6) + ell(5.2, -1.6, 2.6, 1.6),
      detail: "M-11 -2.6Q-13 -6 -10.6 -8.6M11 -2.6Q13 -6 10.6 -8.6M-1.6 -4.6Q0 -6.4 1.6 -4.6", dstroke: true},
    // a pigeon in flight (its flap squeezes it sideways, like wingbeats)
    venicepigeon: {d: ell(0, 1, 5, 2.8) + ell(5.4, -0.6, 2.2, 2) + pts([[-4.6, 0], [-10.6, -1.4], [-10.4, 2.4], [-4, 2.6]]) + pts([[-1.6, -0.6], [-7, -9.4], [-2.6, -8.6], [2.4, -0.8]]) + pts([[7.2, -0.8], [9.4, -0.2], [7.2, 0.4]]),
      detail: "M-4.6 -5L-0.6 -1.6M-2.6 -7L0.6 -2.2", dstroke: true},
    // a feather drifting down
    venicefeather: {d: "M0 -10Q5 -6 4.4 1Q3.6 6 0.6 9.4L-0.6 9.4Q-3.6 6 -4.4 1Q-5 -6 0 -10Z", detail: "M0 -8.6V11M0 -4L3 -6M0 0L3.4 -2M0 4L2.8 2.2M0 -2L-3 -4M0 2L-3.2 0", dstroke: true},
    // a stone Gothic window, its ogee point on top
    venicearch: {d: "M-5 10V-1Q-5 -5 -2.6 -7.4Q-0.8 -9 0 -11Q0.8 -9 2.6 -7.4Q5 -5 5 -1V10Z", detail: "M-3 9V-0.6Q-3 -3.8 -1.2 -5.8Q-0.4 -6.8 0 -8Q0.4 -6.8 1.2 -5.8Q3 -3.8 3 -0.6V9Z", dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "venice", name: "Venice", group: "world", desc: "Gondolas glide along a canal of old palazzos.",
      light: ["#F6F0E6", "rgba(46,110,104,.10)", "#FFFFFF", "#22302F", "#5C6866", "#E6DCCD", "#F0E8DC", "#FCF9F4", "#A84A32", "#C26A4C", "#FFFFFF", "#6A2A1C", "#2C5E5A", "#D2E8E4", "#FFE2A6"],
      dark: ["#0E1432", "rgba(242,200,120,.08)", "#181E42", "#F4F0FA", "#B8B4D6", "#2E3464", "#242A58", "#151A3A", "#F2C878", "#F6DA9E", "#161A3A", "#7A6232", "#121834", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#A8D2EE,#F2ECDD 50%,#F6D3B0)", "linear-gradient(180deg,#0E1636,#22285A 50%,#5A3A62)"],
      spine: [lg("#357A74", "#22504C"), lg("#262C60", "#121834")], btn: [lg2("#A84A32", "#C9784C"), lg2("#F2C878", "#F6DA9E")]},
    kit: {motif: "venicegondola", card: ["#FFFCF6", "#F2E9DC"], ink: "#22302F", bd: "#E4D4BE", mc: "#A84A32", r: 14, notes: ["#F7D8CC", "#FFF1B8", "#D4ECE6", "#D6E4FA", "#EADCF8", "#FFE0C4"], shape: "scallop", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxTw(W, H, n(40), "sparkle", d ? ["#FFFFFF", "#FFF0C8", "#FFE0A0"] : ["#F2C46A", "#FFFFFF", "#F6D892"], {top: 0.9, smin: 3, smax: 7, glow: d ? 12 : 6})
      .concat(fxRise(W, H, n(12), "venicepigeon", d ? ["#B8BCD0", "#9EA4BE"] : ["#8E95A6", "#A4AAB8", "#7C8496"], {smin: 12, smax: 17, vmin: 1.4, vmax: 2.4, sway: 1.1, life: 280}).map(p => Object.assign(p, {flap: fxR(0.25, 0.38), vx: fxR(-1.4, 1.4)})),
        fxFall(W, H, n(14), "venicefeather", d ? ["#D6D8E8", "#B8BCD0"] : ["#FFFFFF", "#D8DCE4", "#BFC4D0"], {sway: 1.6, smin: 8, smax: 12, vmin: 0.7, vmax: 1.3}).map(p => Object.assign(p, {vr: fxR(-0.04, 0.04)})),
        fxBurst(W, H, n(10), "venicemask", d ? ["#F2C878", "#E890B0", "#9AD0E0"] : ["#C8463E", "#E2B048", "#2E7A86", "#B85A9A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 12, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxRise(W, H, n(3), "venicegondola", d ? ["#F6DA9E"] : ["#22202A"], {cx: [0.25, 0.75], smin: 22, smax: 26, vmin: 0.9, vmax: 1.2, sway: 0.3, life: 320, glow: d ? 14 : 0}).map(p => Object.assign(p, {vr: 0})))},
    tag: "A Venetian canal of faded palazzos with Gothic windows, a humpbacked bridge, gondolas and St. Mark's at the lagoon's edge"
  });
})();
