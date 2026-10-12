/* New theme ideas, batch n8: redwoods (Redwood Grove).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a heart-shaped leaflet pointing out from the centre, turned by a (radians)
  const heart = a => { const P = (x, y) => { const c = Math.cos(a), s = Math.sin(a); return `${r1(x * c - y * s)} ${r1(x * s + y * c)}`; };
    return `M${P(0, 0)}C${P(-2, -2.4)} ${P(-7.6, -2.4)} ${P(-8.2, -7)}C${P(-8.6, -10.6)} ${P(-4.4, -11.6)} ${P(0, -8.6)}C${P(4.4, -11.6)} ${P(8.6, -10.6)} ${P(8.2, -7)}C${P(7.6, -2.4)} ${P(2, -2.4)} ${P(0, 0)}Z`; };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n8sorrel: {d: heart(0) + heart(2.094) + heart(4.189), detail: circ(0, 0, 1.2), dfill: true},
    n8cone: {d: "M0 -10.5C5.6 -10.5 8 -4.6 8 0.6C8 6.6 4.4 10.5 0 10.5C-4.4 10.5 -8 6.6 -8 0.6C-8 -4.6 -5.6 -10.5 0 -10.5Z", detail: "M-6.6 -3.4L6.6 4.4M-7.4 2.6L4.6 9.4M-4.4 -8.4L7.6 -1.6M6.6 -3.4L-6.6 4.4M7.4 2.6L-4.6 9.4M4.4 -8.4L-7.6 -1.6", dstroke: true},
    n8spray: {d: "M-10 6L10 -6", stroke: true, lw: 1.4, detail: "M-7 4.2L-8.6 0.6M-7 4.2L-5.4 7.8M-3 1.8L-4.6 -1.8M-3 1.8L-1.4 5.4M1 -0.6L-0.6 -4.2M1 -0.6L2.6 3M5 -3L3.4 -6.6M5 -3L6.6 0.6", dstroke: true}
  });
  // slanting light shafts from the upper left that swell and fade (frames f)
  const shafts = (g, f, W, H, d) => { const a = Math.sin(Math.min(1, f / 210) * Math.PI); if (a <= 0) return; g.save(); g.globalCompositeOperation = "lighter";
    [0.1, 0.28, 0.46, 0.66].forEach((u, i) => { const x = W * u + f * 0.3, w = W * (0.05 + (i % 2) * 0.03); g.fillStyle = d ? `rgba(160,200,255,${0.07 * a})` : `rgba(255,236,170,${0.16 * a})`; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + w, -10); g.lineTo(x + w + H * 0.55, H + 10); g.lineTo(x + H * 0.55 - w * 0.4, H + 10); g.fill(); }); g.restore(); };

  MAJ_THEMES.push({
    skin: {id: "redwoods", name: "Redwood Grove", group: "ideas", desc: "Towering redwoods, sword ferns and slanting sunbeams through the fog.",
      light: ["#F4F1EA", "rgba(150,74,46,.09)", "#FFFDF9", "#2A1A14", "#6E5A4E", "#E6DCCE", "#EFE8DC", "#FBF8F2", "#A2452A", "#B85E3A", "#FFFFFF", "#5E2414", "#5A2E20", "#EDD8C8", "#FFE3A0"],
      dark: ["#0E1520", "rgba(150,190,240,.07)", "#151E2C", "#ECF0F6", "#A6B2C4", "#26324A", "#1E293C", "#121A28", "#F0A57A", "#F6C49E", "#1C1420", "#7A4A3A", "#0C1220", "#D2DCEC", "#5A3A2E"],
      glow: ["linear-gradient(180deg,#CFDFD8,#E6EEE2 55%,#F2EBDA)", "linear-gradient(180deg,#0C1626,#18283C 55%,#263A48)"],
      spine: [lg("#7A3E28", "#5A2E20"), lg("#1E2A40", "#0C1220")], btn: [lg2("#A2452A", "#C0663A"), lg2("#F0A57A", "#F6C49E")]},
    kit: {motif: "n8sorrel", card: ["#FBF8F2", "#EDE4D6"], ink: "#2A1A14", bd: "#DCC8B4", mc: "#A2452A", r: 12, notes: ["#EADFCF"].concat(NOTES), shape: "folded", pin: "pin", fab: "16px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(40), "n8sorrel", d ? ["#3E9A6A", "#5AB87A", "#7FCB8A"] : ["#4E9C4E", "#6FBE58", "#8ACF6A"], {sway: 1.8, flip: true, smin: 9, smax: 14, vmin: 0.9, vmax: 1.7})
      .concat(fxFall(W, H, n(26), "petal", d ? ["#F6C6D6", "#FFFFFF"] : ["#F6B8CC", "#FFFFFF", "#F8D2DE"], {sway: 1.6, flip: true, smin: 5, smax: 8, vmin: 0.8, vmax: 1.5}),
        fxBurst(W, H, n(12), "n8cone", d ? ["#B07A5A", "#C8906A"] : ["#8A5A3A", "#A8704A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxFall(W, H, n(16), "n8spray", d ? ["#4E8A6A"] : ["#3E6E3A", "#5A8A44"], {sway: 1.4, smin: 12, smax: 16, vmin: 0.8, vmax: 1.4}),
        fxTw(W, H, n(30), "circle", d ? ["#CFE4FF", "#FFF4C8", "#B8FFE0"] : ["#FFE7A0", "#FFF6D8", "#FFD27A"], {smin: 1.4, smax: 3, glow: 10, vy: -0.25})),
      draw: shafts},
    tag: "Towering red-brown redwoods rising out of sight, with sword ferns, sorrel and a fallen mossy log, slanting god rays through the fog by day and moonbeams in blue fog at night"
  });
})();
