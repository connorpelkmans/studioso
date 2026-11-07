/* ===== module: 20-scenes-maj-japan.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a cherry blossom
  const sakura = (R, notch) => [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * Math.PI * 2 / 5, c = Math.cos(a), s = Math.sin(a), P = (u, v) => `${r1(c * u - s * v)} ${r1(s * u + c * v)}`;
    return `M${P(1.2, 0)}C${P(3.4, -4.4)} ${P(R - 1, -4.6)} ${P(R, -1.6)}L${P(R - notch, 0)}L${P(R, 1.6)}C${P(R - 1, 4.6)} ${P(3.4, 4.4)} ${P(1.2, 0)}Z`; }).join("");
  Object.assign(FX_SHAPES, {
    japansakura: {d: sakura(10.6, 2.2), detail: circ(0, 0, 1.8) + [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + (i + 0.5) * Math.PI * 2 / 5; return circ(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0.8); }).join(""), dfill: true},
    japanpetal: {d: "M0 -6L-2.2 -9.4C-6.4 -8.4 -6.6 -2 -4.2 3.4C-2.8 6.4 -1.2 8.4 0 9.6C1.2 8.4 2.8 6.4 4.2 3.4C6.6 -2 6.4 -8.4 2.2 -9.4Z"},
    japanfuji: {d: "M-11.6 8.4L-3.4 -6.6Q0 -7.6 3.4 -6.6L11.6 8.4Z", detail: "M-3.4 -6.6Q0 -7.6 3.4 -6.6L5.8 -2.2L3.6 -0.8L2 -2.8L0.4 -0.4L-1.4 -2.8L-3.4 -0.6L-5.8 -2.2Z", dfill: true},
    japankoi: {d: "M-11 -4.6C-4 -6.4 4 -5.6 8 -2.6L11.4 -5.4L10 0L11.4 5.4L8 2.6C4 5.6 -4 6.4 -11 4.6Z", detail: circ(-6.6, -0.6, 1.8) + "M-2 -4.6Q-0.4 0 -2 4.6M2.4 -4.4Q4 0 2.4 4.4", dstroke: true},
    japantorii: {d: "M-11.6 -9.4Q0 -7.4 11.6 -9.4L10.6 -6.4H-10.6Z M-8.6 -4.4H8.6V-2.2H-8.6Z M-7.4 -6.4H-4.6V10H-7.4Z M4.6 -6.4H7.4V10H4.6Z M-1 -6.4H1V-4.4H-1Z"}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // koinobori, the carp streamers of Children's Day, mouth toward +x so they swim head first
  const KOINOBORI = "M10 -4.4C4 -5.8 -4 -5.4 -8 -2.8L-11.6 -5.4L-10 0L-11.6 5.4L-8 2.8C-4 5.4 4 5.8 10 4.4Z";
  Object.assign(FX_SHAPES, {
    japankoi: {d: KOINOBORI, paint: (g, c, d) => { const p = new Path2D(KOINOBORI), lt = mix(c, "#FFFFFF", 0.5); g.save(); g.fillStyle = c; g.fill(p); g.clip(p);
      g.fillStyle = mix(c, "#FFFFFF", 0.22); g.fillRect(-12, 1.2, 24, 6); g.strokeStyle = lt; g.lineWidth = 0.55; g.beginPath(); for (let x = 2; x > -8; x -= 2.6) for (let y = -3.6; y <= 3.6; y += 2.4) { const o = (Math.round((y + 3.6) / 2.4) % 2) * 1.3; g.moveTo(x - o + 1.2, y - 1.2); g.arc(x - o, y, 1.4, -1, 1); } g.stroke();
      g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(-8.6, -6, 1.2, 12); g.restore(); sheen(g, 0.28, 0.2);
      g.fillStyle = "#FFFFFF"; oval(g, 9.6, 0, 1, 4.4); g.fill(); g.fillStyle = "#F2C24A"; oval(g, 5.6, -0.6, 2.5, 2.5); g.fill(); g.fillStyle = "#FFFFFF"; oval(g, 5.6, -0.6, 1.9, 1.9); g.fill(); g.fillStyle = "#1A1824"; oval(g, 5.9, -0.6, 1.1, 1.1); g.fill();
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 0.3; g.stroke(p); }},
    // a petal with soft pink shading toward its notched tip
    japanpetal: {d: "M0 -6L-2.2 -9.4C-6.4 -8.4 -6.6 -2 -4.2 3.4C-2.8 6.4 -1.2 8.4 0 9.6C1.2 8.4 2.8 6.4 4.2 3.4C6.6 -2 6.4 -8.4 2.2 -9.4Z", paint: (g, c) => { const p = new Path2D("M0 -6L-2.2 -9.4C-6.4 -8.4 -6.6 -2 -4.2 3.4C-2.8 6.4 -1.2 8.4 0 9.6C1.2 8.4 2.8 6.4 4.2 3.4C6.6 -2 6.4 -8.4 2.2 -9.4Z"), gr = g.createLinearGradient(0, 9.6, 0, -9.4);
      gr.addColorStop(0, mix(c, "#FFFFFF", 0.65)); gr.addColorStop(1, c); g.fillStyle = gr; g.fill(p); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 0.4; g.beginPath(); g.moveTo(0, 8); g.lineTo(0, -4); g.stroke(); sheen(g, 0.2, 0.14); }}
  });
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "japan", name: "Japan", group: "world", desc: "Mount Fuji over a pagoda in cherry blossom.",
      light: ["#FAF4F5", "rgba(200,68,46,.10)", "#FFFFFF", "#26233A", "#6A6478", "#ECDCE0", "#F4E8EC", "#FDF9FA", "#C8442E", "#D86A50", "#FFFFFF", "#8A2A1E", "#2E3E66", "#F6D6DE", "#FFE3A0"],
      dark: ["#121530", "rgba(246,166,190,.08)", "#1B1F42", "#F4F0FA", "#B9B4D6", "#30355F", "#262A55", "#161A3A", "#F4A0B8", "#F8C0D0", "#1A1838", "#8A4A62", "#14183A", "#DCD2EC", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#BFDDF2,#EAF3F8 45%,#FBE6EA)", "linear-gradient(180deg,#141A3A,#2A2D5A 45%,#5A4570)"],
      spine: [lg("#34477A", "#22305A"), lg("#2A2D5A", "#14183A")], btn: [lg2("#C8442E", "#D8607A"), lg2("#F4A0B8", "#F8C8A8")]},
    kit: {motif: "japansakura", card: ["#FFFAFB", "#F8E6EC"], ink: "#26233A", bd: "#EEC8D4", mc: "#D8607A", r: 14, notes: ["#F8D8E2"].concat(NOTES), shape: "folded", pin: "washi2", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "japanpetal", d ? ["#F6B6CC", "#FFD6E4", "#E894B4"] : ["#F28AAE", "#F7A8C0", "#E8789E"], {sway: 1.8, flip: true, smin: 8, smax: 12, glow: d ? 6 : 0}).map(p => Object.assign(p, {vx: fxR(0.8, 1.8), x: p.x - W * 0.25}))
      .concat(Array.from({length: n(5)}, (_, i) => { const z = fxR(0.8, 1.1), vy = -fxR(1.3, 2) * z, vx = (i % 2 ? 1 : -1) * fxR(0.3, 0.8);
          return {shape: "japankoi", c: d ? ["#FF7A6A", "#7AA8F0", "#E8E4F4"][i % 3] : ["#D8402E", "#3A78C8", "#33333F"][i % 3], x: W * (0.12 + 0.76 * (i + fxR(0.2, 0.8)) / n(5)), y: H + fxR(30, 90), vx, vy, g: 0, z, face: true, wig: 0.13, size: fxR(20, 27) * z, sway: 0.6, swf: 0.03, life: 300, delay: Math.floor(fxR(0, 50)), glow: d ? 8 : 0}; }),
        fxBurst(W, H, n(10), "japansakura", d ? ["#F6B6CC", "#FFE0EA"] : ["#F7A8C0", "#FFD0DE", "#F28AAE"], [[0.15, 1.02], [0.85, 1.02]], {smin: 11, smax: 15}),
        fxTw(W, H, n(16), "sparkle", d ? ["#FFE3EE", "#FFFFFF"] : ["#F28AAE", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "Mount Fuji's snowy cone over a five-storey pagoda in a sea of cherry blossom, with a torii stair path, a little town and a red bridge"
  });
})();
/* end of module 20-scenes-maj-japan.js */


