/* New theme ideas, batch n8: waterfall (Fern Falls), redwoods (Redwood Grove).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a fern frond: a stem with paired leaflets that shrink toward the tip (points up)
  const frond = (() => { let d = "M-0.7 11L-0.5 -10.5L0.5 -10.5L0.7 11Z"; for (let i = 0; i < 7; i++) { const y = 8 - i * 2.7, L = 7.2 * (1 - i * 0.12); [-1, 1].forEach(s => { d += `M0 ${r1(y)}Q${r1(s * L * 0.55)} ${r1(y - 3.2)} ${r1(s * L)} ${r1(y - 2.6)}Q${r1(s * L * 0.5)} ${r1(y + 0.4)} 0 ${r1(y + 1.4)}Z`; }); } return d; })();
  // a heart-shaped leaflet pointing out from the centre, turned by a (radians)
  const heart = a => { const P = (x, y) => { const c = Math.cos(a), s = Math.sin(a); return `${r1(x * c - y * s)} ${r1(x * s + y * c)}`; };
    return `M${P(0, 0)}C${P(-2, -2.4)} ${P(-7.6, -2.4)} ${P(-8.2, -7)}C${P(-8.6, -10.6)} ${P(-4.4, -11.6)} ${P(0, -8.6)}C${P(4.4, -11.6)} ${P(8.6, -10.6)} ${P(8.2, -7)}C${P(7.6, -2.4)} ${P(2, -2.4)} ${P(0, 0)}Z`; };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n8frond: {d: frond},
    n8sorrel: {d: heart(0) + heart(2.094) + heart(4.189), detail: circ(0, 0, 1.2), dfill: true},
    n8cone: {d: "M0 -10.5C5.6 -10.5 8 -4.6 8 0.6C8 6.6 4.4 10.5 0 10.5C-4.4 10.5 -8 6.6 -8 0.6C-8 -4.6 -5.6 -10.5 0 -10.5Z", detail: "M-6.6 -3.4L6.6 4.4M-7.4 2.6L4.6 9.4M-4.4 -8.4L7.6 -1.6M6.6 -3.4L-6.6 4.4M7.4 2.6L-4.6 9.4M4.4 -8.4L-7.6 -1.6", dstroke: true},
    n8spray: {d: "M-10 6L10 -6", stroke: true, lw: 1.4, detail: "M-7 4.2L-8.6 0.6M-7 4.2L-5.4 7.8M-3 1.8L-4.6 -1.8M-3 1.8L-1.4 5.4M1 -0.6L-0.6 -4.2M1 -0.6L2.6 3M5 -3L3.4 -6.6M5 -3L6.6 0.6", dstroke: true}
  });
  // a soft rainbow arc that grows over the page and then fades (frames f)
  const rainbow = (g, f, W, H, d, cx, cy, R) => { const a = f < 40 ? f / 40 : f < 170 ? 1 : Math.max(0, 1 - (f - 170) / 50); if (a <= 0) return; const grow = Math.min(1, f / 50);
    g.save(); g.globalAlpha = a * (d ? 0.3 : 0.48); g.lineWidth = Math.max(6, R * 0.05); ["#FF6A6A", "#FFA94A", "#FFE05A", "#7EDB6A", "#5AB8F2", "#9A7BF0"].forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(cx * W, cy * H, R - i * g.lineWidth, Math.PI, Math.PI + Math.PI * grow); g.stroke(); }); g.restore(); };
  // slanting light shafts from the upper left that swell and fade (frames f)
  const shafts = (g, f, W, H, d) => { const a = Math.sin(Math.min(1, f / 210) * Math.PI); if (a <= 0) return; g.save(); g.globalCompositeOperation = "lighter";
    [0.1, 0.28, 0.46, 0.66].forEach((u, i) => { const x = W * u + f * 0.3, w = W * (0.05 + (i % 2) * 0.03); g.fillStyle = d ? `rgba(160,200,255,${0.07 * a})` : `rgba(255,236,170,${0.16 * a})`; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + w, -10); g.lineTo(x + w + H * 0.55, H + 10); g.lineTo(x + H * 0.55 - w * 0.4, H + 10); g.fill(); }); g.restore(); };

  MAJ_THEMES.push({
    skin: {id: "waterfall", name: "Fern Falls", group: "ideas", desc: "A tall, lacy waterfall tumbling down a mossy gorge into a green pool.",
      light: ["#EEF6F2", "rgba(46,122,104,.10)", "#FFFFFF", "#132A26", "#4C6A62", "#CFE4DC", "#E0EFE9", "#F7FBF9", "#1E7466", "#2E908A", "#FFFFFF", "#0E4A40", "#1E4A44", "#CDE8E0", "#FFE7A0"],
      dark: ["#0C1A20", "rgba(130,230,210,.07)", "#12242A", "#E6F4F2", "#9CBEB8", "#1E3A40", "#18303A", "#0F2026", "#7FE6D2", "#A8F0E2", "#0C201C", "#3E8A7E", "#0A1C22", "#BFE4DC", "#2E6A60"],
      glow: ["linear-gradient(180deg,#A9D6E4,#DDF1EA 60%,#EEF6E4)", "linear-gradient(180deg,#0B1828,#1A3A44 65%,#1E4440)"],
      spine: [lg("#2E6A5E", "#1E4A44"), lg("#163A3E", "#0A1C22")], btn: [lg2("#1E7466", "#2E908A"), lg2("#7FE6D2", "#A8D8F0")]},
    kit: {motif: "n8frond", card: ["#F5FBF8", "#DDEFE8"], ink: "#132A26", bd: "#B6D8CC", mc: "#2E908A", r: 18, notes: ["#D6ECE4"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "16px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(64), "drop", d ? ["#BFE4FF", "#E8F6FF", "#9FE8E0"] : ["#7CC8E8", "#A8DCF2", "#FFFFFF"], [[0.5, 1.04], [0.35, 1.03], [0.65, 1.03]], {smin: 4, smax: 7, glow: d ? 6 : 0}).map(p => Object.assign(p, {rot: 0, vr: 0}))
      .concat(fxFall(W, H, n(26), "n8frond", d ? ["#2E7A5A", "#3E9A6A", "#5AB87A"] : ["#2F7A44", "#4E9C4E", "#86CC62"], {sway: 1.8, flip: true, smin: 12, smax: 17, vmin: 1, vmax: 1.8}),
        fxRise(W, H, n(14), "puff", d ? ["rgba(200,225,240,.4)"] : ["rgba(255,255,255,.85)"], {smin: 12, smax: 22, vmin: 0.7, vmax: 1.3, sway: 1.2, life: 240, grow: 0.15, alpha: 0.5}),
        fxTw(W, H, n(d ? 34 : 20), d ? "circle" : "sparkle", d ? ["#8FFFE8", "#B8F4FF", "#6FE0FF"] : ["#FFFFFF", "#BFE8F2", "#FFE68A"], {smin: d ? 1.6 : 3, smax: d ? 3 : 6, glow: d ? 12 : 4})),
      draw: (g, f, W, H, d) => rainbow(g, f, W, H, d, 0.5, 0.92, Math.min(W, H) * 0.4)},
    tag: "A tall, lacy waterfall tumbling in tiers down a mossy basalt gorge into a clear green pool, framed by tree ferns, with mist, a rainbow in the spray and glow-worm lights at night"
  });
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
