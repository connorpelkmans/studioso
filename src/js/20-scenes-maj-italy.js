/* ===== module: 20-scenes-maj-italy.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // an Amalfi lemon
    italylemon: {d: "M-10 1C-10 -4 -5 -7.4 0 -7.4C5 -7.4 10 -4 10 1C10 5 5 7.4 0 7.4C-5 7.4 -10 5 -10 1Z M-10 1L-12 0.2L-10.4 -0.6Z M10 1L12 0.2L10.4 -0.6Z M1 -7.2C3 -11 7 -12 10 -11C8 -8 4 -7 1 -7.2Z", detail: "M-5 -3.4Q-2 -5.4 2 -5", dstroke: true},
    // lemon blossom
    italyblossom: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 5.4, Math.sin(a) * 5.4, 4.6); }).join("") + circ(0, 0, 4), detail: circ(0, 0, 2.2), dfill: true},
    // a striped beach umbrella
    italyumb: {d: "M-11 -1C-10 -8 -4 -10.5 0 -10.5C4 -10.5 10 -8 11 -1Z M-0.8 -1H0.8V10H-0.8Z", detail: "M0 -10.5L-6 -1M0 -10.5L6 -1M0 -10.5V-1", dstroke: true},
    // a little sailboat
    italysail: {d: "M0.6 -11L9 4H0.6Z M-1 -8L-8.6 4H-1Z M-11 5.6H11L7.6 10.4H-7.6Z"},
    // a majolica tile
    italytile: {d: "M-9 -9H9V9H-9Z", detail: "M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z" + circ(0, 0, 1.4), dfill: true}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const LEMON = "M-9.6 2C-9.6 -3 -4.8 -6.4 0 -6.4C4.8 -6.4 9.6 -3 9.6 2C9.6 5.6 4.8 7.6 0 7.6C-4.8 7.6 -9.6 5.6 -9.6 2Z M-9.6 2L-11.6 1.2L-9.8 0.4Z M9.6 2L11.6 1.2L9.8 0.4Z";
  Object.assign(FX_SHAPES, {
    // an Amalfi lemon with its glossy leaf
    italylem: {d: LEMON + "M0.6 -6C2 -10.4 6.4 -12 10.4 -10.6C8.6 -7 4.4 -5.6 0.6 -6Z", paint: (g, c) => { const p = new Path2D(LEMON), gr = g.createRadialGradient(-3, -2, 1, 0, 1, 11); gr.addColorStop(0, mix(c, "#FFFFFF", 0.45)); gr.addColorStop(0.6, c); gr.addColorStop(1, mix(c, "#B07800", 0.4)); g.fillStyle = gr; g.fill(p);
      g.save(); g.clip(p); g.fillStyle = "rgba(170,120,0,.18)"; for (let i = 0; i < 26; i++) { oval(g, Math.sin(i * 7.3) * 8, 1 + Math.cos(i * 3.1) * 5.4, 0.35, 0.35); g.fill(); } g.restore(); g.fillStyle = "rgba(255,255,255,.55)"; oval(g, -4, -2.8, 2.6, 1.1, -0.4); g.fill();
      const lf = new Path2D("M0.6 -6C2 -10.4 6.4 -12 10.4 -10.6C8.6 -7 4.4 -5.6 0.6 -6Z"); g.fillStyle = "#3E8A3A"; g.fill(lf); g.fillStyle = "#5EA84A"; g.save(); g.clip(lf); g.fillRect(-1, -13, 13, 4.6); g.restore(); g.strokeStyle = "rgba(220,240,200,.6)"; g.lineWidth = 0.35; g.beginPath(); g.moveTo(1, -6.2); g.quadraticCurveTo(5, -9.4, 10, -10.5); g.stroke(); }},
    // a lemon blossom: five white petals around golden stamens
    italyflower: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 5.4, Math.sin(a) * 5.4, 4.6); }).join(""), paint: (g, c, d) => { for (let i = 0; i < 5; i++) { g.save(); g.rotate(i / 5 * 6.283); g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-4.6, -3, -3.4, -10.4, 0, -10.6); g.bezierCurveTo(3.4, -10.4, 4.6, -3, 0, 0); g.fill(); g.strokeStyle = d ? "rgba(200,200,230,.5)" : "rgba(190,170,150,.6)"; g.lineWidth = 0.35; g.stroke(); g.restore(); }
      sheen(g, 0.2, 0.18); g.strokeStyle = "#E8B83A"; g.lineWidth = 0.4; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i * 0.7; g.moveTo(0, 0); g.lineTo(Math.cos(a) * 3.2, Math.sin(a) * 3.2); } g.stroke(); g.fillStyle = "#F2C53A"; for (let i = 0; i < 9; i++) { const a = i * 0.7; oval(g, Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0.5, 0.5); g.fill(); } g.fillStyle = "#9CC24A"; oval(g, 0, 0, 1.2, 1.2); g.fill(); }}
  });
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "italy", name: "Italy", group: "world", desc: "A pastel cliff town tumbling down to a turquoise cove.",
      light: ["#F3F8FA", "rgba(38,138,176,.10)", "#FFFFFF", "#1E2C38", "#56656F", "#D6E6EC", "#E6F0F3", "#FAFCFD", "#C4522F", "#D7744F", "#FFFFFF", "#7A2E18", "#1E5778", "#D2EAF2", "#FFE6A0"],
      dark: ["#0F1630", "rgba(246,200,74,.08)", "#18203E", "#F2F2FA", "#B6B8D2", "#2C3460", "#232A52", "#141A36", "#F6C84A", "#FADB86", "#1A2040", "#7A6A32", "#101C3A", "#D4D6EE", "#6A5A2A"],
      glow: ["linear-gradient(180deg,#9FD3F0,#DDF0F7 45%,#FCEBD0)", "linear-gradient(180deg,#101C3A,#22305A 45%,#5A3C5E)"],
      spine: [lg("#2C7FA8", "#1E5778"), lg("#22305A", "#101C3A")], btn: [lg2("#C4522F", "#E39A2E"), lg2("#F6C84A", "#FFE08A")]},
    kit: {motif: "italylemon", card: ["#FFFDF6", "#EAF5F7"], ink: "#1E2C38", bd: "#BFDDE6", mc: "#E8B820", r: 16, notes: ["#FFF0A8", "#FBD8D2"].concat(NOTES), shape: "rounded", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(22), "italylem", d ? ["#F6D04A", "#FFE07A", "#F0C232"] : ["#F7CB34", "#F2B820", "#FFD84A"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 13, smax: 18}).map(p => Object.assign(p, {vx: p.vx * 0.8, vy: p.vy * 0.8, g: 0.15, vr: fxR(-0.06, 0.06), term: fxR(1.8, 2.4), life: 280}))
      .concat(fxFall(W, H, n(30), "italyflower", d ? ["#FFFFFF", "#F6EEF6"] : ["#FFFFFF", "#FFFDF4"], {sway: 1.6, smin: 8, smax: 11, vmin: 0.8, vmax: 1.5, rock: 0.6}),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#7FD4E0", "#FFFFFF"], {smin: 3, smax: 6, glow: d ? 10 : 6}))},
    tag: "A Positano-style town of pastel houses stacked down limestone cliffs to a turquoise cove, with a majolica dome, lemon terraces, striped umbrellas and the Italian flag waving on the terrace"
  });
})();
/* end of module 20-scenes-maj-italy.js */


