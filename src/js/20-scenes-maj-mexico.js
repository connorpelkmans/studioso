/* ===== module: 20-scenes-maj-mexico.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ring = (n, f) => Array.from({length: n}, (_, i) => f(i / n * Math.PI * 2, i)).join("");
  Object.assign(FX_SHAPES, {
    // a talavera tile flower
    mexicotile: {d: ring(4, a => circ(Math.cos(a + Math.PI / 4) * 5.2, Math.sin(a + Math.PI / 4) * 5.2, 4.4)) + ring(4, a => pts([[Math.cos(a) * 6, Math.sin(a) * 6], [Math.cos(a + 0.35) * 11, Math.sin(a + 0.35) * 11], [Math.cos(a) * 12, Math.sin(a) * 12], [Math.cos(a - 0.35) * 11, Math.sin(a - 0.35) * 11]])), detail: circ(0, 0, 2.6), dfill: true},
    // a papel picado flag
    mexicopapel: {d: "M-8 -9H8V8L5.3 6L2.7 8L0 6L-2.7 8L-5.3 6L-8 8Z", detail: circ(0, -1.5, 2.6) + "M-5 -6L-4 -4.8L-5 -3.6L-6 -4.8Z M5 -6L6 -4.8L5 -3.6L4 -4.8Z M-5 2L-4 3.2L-5 4.4L-6 3.2Z M5 2L6 3.2L5 4.4L4 3.2Z", dfill: true},
    // a jacaranda flower
    mexicojac: {d: ring(5, a => circ(Math.cos(a - Math.PI / 2) * 3.8, Math.sin(a - Math.PI / 2) * 3.8, 3.4)), detail: circ(0, 0.4, 1.8), dfill: true},
    // a party balloon with its knot and a curl of string
    mexicoballoon: {d: "M0 -11C7 -11 9.4 -4 8.4 0.6C7.4 5.6 3 9 0 9.6C-3 9 -7.4 5.6 -8.4 0.6C-9.4 -4 -7 -11 0 -11Z M-1.6 9.4H1.6L0 11.6Z", detail: "M0 11.6Q-2.6 14 0 16Q2.6 18 0 20", dstroke: true},
    mexicoconfetti: {d: "M-5 -2.6H5V2.6H-5Z"}
  });
  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // papel picado: a tissue-paper flag with its pattern really cut out
  const FLAG = "M-8 -9.6H8V8L5.3 6L2.7 8L0 6L-2.7 8L-5.3 6L-8 8Z";
  Object.assign(FX_SHAPES, {
    mexicoflag: {d: FLAG, paint: (g, c) => { g.fillStyle = c; g.fill(new Path2D(FLAG)); g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(-8, -9.6, 16, 1.6); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
      g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * 0.785; g.moveTo(0, -1.4); g.ellipse(Math.cos(a) * 2.6, -1.4 + Math.sin(a) * 2.6, 1.3, 0.55, a, 0, 6.3); } g.fill(); oval(g, 0, -1.4, 0.9, 0.9); g.fill();
      [[-5, -5.4], [5, -5.4], [-5, 2.8], [5, 2.8]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 1.4); g.lineTo(x + 1, y); g.lineTo(x, y + 1.4); g.lineTo(x - 1, y); g.fill(); });
      for (let x = -6.6; x <= 6.6; x += 2.2) { oval(g, x, -7.4, 0.5, 0.5); g.fill(); } [-4, 0, 4].forEach(x => { oval(g, x, 5.2, 0.6, 0.6); g.fill(); }); g.globalCompositeOperation = "source-over"; }}
  });
  // strings of flags drop in across the top, flutter in the breeze, then lift away
  const papelDraw = (g, f, W, H, d) => { const u = Math.max(1.6, Math.min(3, Math.min(W, H) / 230)), fw = 16 * u * 1.18, cols = d ? ["#F06AA8", "#F6B84A", "#5A8AF0", "#8ED05A", "#4ACACA", "#B07AF0"] : ["#E2468C", "#F4A62A", "#3462B6", "#7CB83E", "#21A8AA", "#9A4FD6"];
    [[0.05, 0.05, 0], [0.2, 0.06, 14]].forEach(([yy, sag, t0], r) => { const t = f - t0; if (t < 0) return; const e = t < 50 ? 1 - Math.pow(1 - t / 50, 3) : 1, out = fxEase((t - 190) / 60), y0 = H * yy - (1 - e) * H * 0.3 - out * H * 0.1, sg = H * sag, k = Math.ceil(W / fw) + 1, a = 1 - out;
      if (a <= 0.01) return; const Y = x => y0 + 4 * sg * (x / W) * (1 - x / W) + Math.sin(t * 0.05 + x / 120) * u * 1.4; g.globalAlpha = a; g.strokeStyle = d ? "rgba(240,230,250,.6)" : "rgba(80,60,70,.55)"; g.lineWidth = 1;
      g.beginPath(); for (let x = -10; x <= W + 10; x += 20) x < 0 ? g.moveTo(x, Y(x)) : g.lineTo(x, Y(x)); g.stroke();
      for (let i = 0; i < k; i++) { const x = (i + 0.5 + r * 0.5) * fw - fw * 0.5, spr = fxSprite("mexicoflag", cols[(i + r * 3) % cols.length], 0, d), h = spr._half * u, sw = Math.sin(t * 0.07 + i * 0.9 + r) * 0.16 * (1 - e * 0.4);
        g.save(); g.translate(x, Y(x)); g.rotate(sw); g.drawImage(spr, -h, -h + 9.6 * u, 2 * h, 2 * h); g.restore(); } }); g.globalAlpha = 1; };
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "mexico", name: "Mexico", group: "world", desc: "A rainbow hillside town around a pink cathedral.",
      light: ["#FCF6EE", "rgba(194,69,110,.10)", "#FFFFFF", "#2E1E2A", "#6E5A62", "#EEDCCC", "#F7ECE2", "#FEFAF5", "#C2456E", "#2F5FB0", "#FFFFFF", "#8E2E50", "#7E2848", "#F6D8E2", "#FFE2A8"],
      dark: ["#120F2C", "rgba(242,162,192,.08)", "#1C1838", "#F6EEF8", "#C2B2D2", "#34295A", "#26204A", "#161330", "#F2A2C0", "#F6C88A", "#16132E", "#7A3A5A", "#16122E", "#E2D2F0", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#8CCBF0,#E4F2F6 45%,#FCE2C6)", "linear-gradient(180deg,#0F1636,#2A2458 45%,#6A3458)"],
      spine: [lg("#C2456E", "#7E2848"), lg("#2A2458", "#0F1636")], btn: [lg2("#C2456E", "#E07A3A"), lg2("#F2A2C0", "#F6C88A")]},
    kit: {motif: "mexicotile", card: ["#FFFBF5", "#F6E6EC"], ink: "#2E1E2A", bd: "#EBCFD8", mc: "#C2456E", r: 14, notes: ["#FFE2EC", "#FFF1B8", "#DDF2CC", "#D6E4FF", "#FFDCC8", "#E8DCFF"], shape: "torn", pin: "tape", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(46), "mexicoconfetti", ["#E2468C", "#F4B23A", "#3462B6", "#8CC24E", "#F27A5A", "#2AAEB0"], [[0.12, 1.02], [0.88, 1.02]], {smin: 8.5, smax: 11.5, flip: true}).map(p => Object.assign(p, {vx: p.vx * 0.8, vy: p.vy * 0.92, g: 0.14, term: fxR(1.3, 1.9), fsw: fxR(0.8, 1.4), life: 280}))
      .concat(fxFall(W, H, n(26), "mexicojac", d ? ["#8070C8", "#9A8ADA", "#B4A2F0"] : ["#9C88E6", "#B4A2F0", "#8070D6"], {sway: 1.6, flip: true, smin: 8, smax: 11, vmin: 0.9, vmax: 1.6}).map(p => Object.assign(p, {delay: p.delay + 40})),
        fxTw(W, H, n(14), "sparkle", d ? ["#FFE6A6", "#FFFFFF"] : ["#F4B23A", "#FFFFFF"], {smin: 3, smax: 6, glow: d ? 10 : 6})),
      draw: papelDraw},
    tag: "A Guanajuato-style hillside of saffron, cobalt, coral and magenta houses around a pink Gothic cathedral, with a talavera fountain, a wrought-iron bandstand, jacarandas and papel picado over the plaza"
  });
})();
/* end of module 20-scenes-maj-mexico.js */


