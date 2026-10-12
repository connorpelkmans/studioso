/* Around the World: Morocco (a tiled riad courtyard below the Atlas mountains) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const star = (cx, cy, R, r, n, rot = 0) => pts(Array.from({length: n * 2}, (_, i) => { const a = rot - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  Object.assign(FX_SHAPES, {
    // a zellige star: an eight-point star with a smaller star set inside it
    moroccostar: {d: star(0, 0, 10.4, 7.6, 8, Math.PI / 8), detail: star(0, 0, 4.6, 3.2, 8), dstroke: true},
    // a pierced brass lantern: finial, onion dome, a body with little holes, a pointed foot
    moroccolantern: {d: "M-0.8 -12.6H0.8V-10.4H-0.8Z M-4.4 -6.6Q-4.4 -10.6 0 -10.8Q4.4 -10.6 4.4 -6.6Z M-5.4 -6.6H5.4V-5H-5.4Z M-5 -5H5L4.2 4.4H-4.2Z M-4.8 4.4H4.8V5.8H-4.8Z M-3.8 5.8H3.8L0 11.4Z",
      detail: circ(-2, -2.6, 0.7) + circ(2, -2.6, 0.7) + circ(0, -0.4, 0.8) + circ(-2, 1.8, 0.7) + circ(2, 1.8, 0.7), dfill: true},
    moroccopetal: {d: "M0 -7.6C4.6 -7.8 7 -3 5.4 1.6C4 5.6 1.4 7.6 0 7.6C-1.4 7.6 -4 5.6 -5.4 1.6C-7 -3 -4.6 -7.8 0 -7.6Z", detail: "M0 -4.6Q-0.6 1 0 5.4", dstroke: true},
    moroccoblossom: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 3.6); }).join(""), detail: circ(0, 0, 2), dfill: true},
    moroccoorange: {d: circ(0, 1.4, 8.6) + "M0.4 -7.2Q4 -12.4 9 -10.4Q6.4 -5.8 0.4 -7.2Z", detail: "M-3.6 -1.8A4.4 4.4 0 0 1 0 -4.6", dstroke: true}
  });
  MAJ_THEMES.push({
    skin: {id: "morocco", name: "Morocco", group: "world", desc: "A tiled riad courtyard below the Atlas mountains.",
      light: ["#FBF5EC", "rgba(44,95,168,.10)", "#FFFFFF", "#2A2230", "#6E5E58", "#EADCC8", "#F5EBDD", "#FDFAF5", "#2C5FA8", "#C8642E", "#FFFFFF", "#1E4680", "#1E3A6E", "#D6E2F4", "#FFE3A0"],
      dark: ["#100F2A", "rgba(232,184,96,.08)", "#1A1838", "#F4F0FA", "#BCB2D2", "#302A5A", "#24204A", "#151330", "#E8B860", "#F2CC84", "#16142E", "#7A6230", "#141232", "#D8D2F0", "#6A5420"],
      glow: ["linear-gradient(180deg,#A9D3F0,#F3E6CF 45%,#F2C79A)", "linear-gradient(180deg,#121434,#2A2156 45%,#6A3A4E)"],
      spine: [lg("#2C5FA8", "#1E3A6E"), lg("#2A2156", "#121434")], btn: [lg2("#2C5FA8", "#C8642E"), lg2("#E8B860", "#F2CC84")]},
    kit: {motif: "moroccostar", card: ["#FFFBF4", "#F4E8D8"], ink: "#2A2230", bd: "#E2CFAE", mc: "#2C5FA8", r: 14, notes: ["#F6E2C4", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "gold", fab: "999px 999px 12px 12px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(9), "moroccolantern", d ? ["#F2C45A", "#FFD27A", "#E8A84A"] : ["#D9A43A", "#C8902E", "#E2B04A"], {smin: 14, smax: 20, vmin: 0.9, vmax: 1.6, sway: 0.6, life: 320, glow: d ? 16 : 4})
      .concat(fxFall(W, H, n(36), "moroccopetal", d ? ["#F27A96", "#FF9AB2", "#E8607E"] : ["#E8506E", "#F27A96", "#D93A5E"], {sway: 1.7, flip: true, smin: 6, smax: 9}),
        fxFall(W, H, n(22), "moroccoblossom", d ? ["#FFF6E8", "#FFFFFF"] : ["#FFFFFF", "#FFF4E0"], {sway: 1.4, smin: 6, smax: 9, vmin: 0.9, vmax: 1.8, glow: d ? 6 : 0}),
        fxBurst(W, H, n(10), "moroccoorange", d ? ["#F29A3A", "#E8862A"] : ["#F2902E", "#E87A1E"], [[0.2, 1.02], [0.8, 1.02]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08)})),
        fxTw(W, H, n(22), "moroccostar", d ? ["#F2C45A", "#7AB0F0", "#FFFFFF"] : ["#2C5FA8", "#2E8E6E", "#D9A43A"], {smin: 6, smax: 10, glow: d ? 10 : 0, top: 0.8}))},
    tag: "A Marrakech riad seen through a carved horseshoe arch: zellige tiles, a bubbling fountain, orange trees and brass lanterns below the snowy Atlas"
  });
})();
