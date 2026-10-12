/* New theme ideas, batch n10: icecave (Blue Ice Cave).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n10crystal: {d: "M0 -11.5L5.6 -5.4V5.4L0 11.5L-5.6 5.4V-5.4Z", detail: "M0 -11L0 11M-5.4 -5.2L0 -1.6L5.4 -5.2", dstroke: true},
    n10icicle: {d: "M-7 -10H7L5.6 -6.6L3.6 -6.8L2 1.4L0.6 11L-0.8 1L-2.4 -6.4L-4.8 -6.2Z", detail: "M-1.2 -6L-0.4 4", dstroke: true}
  });
  // a slow wash of light (ice blue by day, aurora green and pink at night) rising from the bottom of the page
  const iceGlow = (g, f, W, H, d) => { const a = f < 30 ? f / 30 : f < 150 ? 1 : Math.max(0, 1 - (f - 150) / 60); if (a <= 0) return; const R = Math.max(W, H) * (0.3 + 0.5 * Math.min(1, f / 120));
    g.save(); g.globalCompositeOperation = "lighter"; (d ? [["90,255,190", 0.3, 0.3], ["255,120,210", 0.7, 0.22]] : [["150,240,255", 0.5, 0.26]]).forEach(([c, x, k]) => { const gr = g.createRadialGradient(x * W, H * 1.05, 0, x * W, H * 1.05, R); gr.addColorStop(0, `rgba(${c},${k * a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }); g.restore(); };

  MAJ_THEMES.push({
    skin: {id: "icecave", name: "Blue Ice Cave", group: "ideas", desc: "Inside a glacier, where the ice glows blue with the light outside.",
      light: ["#EAF6FA", "rgba(30,120,180,.10)", "#FFFFFF", "#10283C", "#4A6678", "#CDE5EE", "#DFEFF5", "#F6FBFD", "#1E74AE", "#3E92C4", "#FFFFFF", "#0E4A72", "#184A84", "#C8E6F2", "#FFE9B0"],
      dark: ["#0C1232", "rgba(110,255,200,.07)", "#141C44", "#EAF2FF", "#A8B6DA", "#2A3666", "#1F2A58", "#11183C", "#7FE8D8", "#A8F2E6", "#0E1830", "#3E8A90", "#121A46", "#C4D0F0", "#3A6A6A"],
      glow: ["linear-gradient(180deg,#7DBDEB,#D6EEFA 55%,#E2FAFE)", "linear-gradient(180deg,#0E1640,#2C3E74 60%,#3E5BAE)"],
      spine: [lg("#2A7FB8", "#184A84"), lg("#1E2A60", "#0E1436")], btn: [lg2("#1E74AE", "#2A9CC4"), lg2("#7FE8D8", "#A8C8FF")]},
    kit: {motif: "n10crystal", card: ["#F4FBFD", "#DCEFF6"], ink: "#10283C", bd: "#A8D6E8", mc: "#2A9CC4", r: 16, notes: ["#D6EEF7"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "n10crystal", d ? ["#8FF2E0", "#A8C8FF", "#F0A8E8"] : ["#4FC0E0", "#8ADCF0", "#2A9CC4"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 8, smax: 13, glow: d ? 12 : 4}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08)}))
      .concat(fxFall(W, H, n(50), "snow", d ? ["#FFFFFF", "#CFE0FF"] : ["#8FC8E8", "#B8DCF0", "#5AA8D8"], {vmin: 0.8, vmax: 1.6, sway: 1.3, smin: 5, smax: 10, glow: d ? 6 : 0}),
        fxFall(W, H, n(10), "n10icicle", d ? ["#A8C8FF", "#C8F4FF"] : ["#7FCDE8", "#A8E2F2"], {vmin: 1.6, vmax: 2.6, sway: 0, smin: 12, smax: 17}).map(p => Object.assign(p, {rot: 0, vr: 0})),
        fxTw(W, H, n(30), "sparkle", d ? ["#B8FFE8", "#FFFFFF", "#FFC8F0"] : ["#7FD8F0", "#FFFFFF", "#4FB8E0"], {smin: 3, smax: 7, glow: d ? 12 : 6})),
      draw: iceGlow},
    tag: "Inside a glacier, scalloped turquoise walls glow with outside light, icicles drip onto a frozen meltwater floor and a snowy peak shines through the mouth, with an aurora at night"
  });
})();
