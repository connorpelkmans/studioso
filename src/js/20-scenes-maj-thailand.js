/* ===== module: 20-scenes-maj-thailand.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a petal as a pointed ellipse from (0,0) out to length L at angle a (radians), width w
  const petal = (cx, cy, a, L, w) => { const c = Math.cos(a), s = Math.sin(a), P = (u, v) => `${r1(cx + c * u - s * v)} ${r1(cy + s * u + c * v)}`; return `M${P(0, 0)}Q${P(L * 0.45, -w)} ${P(L, 0)}Q${P(L * 0.45, w)} ${P(0, 0)}Z`; };
  Object.assign(FX_SHAPES, {
    // frangipani: five overlapping petals around a golden centre
    thailandfrang: {d: [0, 1, 2, 3, 4].map(i => petal(0, 0, i / 5 * Math.PI * 2 - Math.PI / 2, 10.6, 4.6)).join(""), detail: circ(0, 0, 2.6), dfill: true},
    // a lotus in bloom, seen from the side
    thailandlotus: {d: petal(0, 7, -Math.PI / 2, 17, 5.2) + petal(-1, 7, -Math.PI / 2 - 0.55, 14, 4.6) + petal(1, 7, -Math.PI / 2 + 0.55, 14, 4.6) + petal(-2, 7.6, -Math.PI + 0.35, 11, 3.8) + petal(2, 7.6, -0.35, 11, 3.8), detail: "M-9 9.6Q0 12.4 9 9.6", dstroke: true},
    // a candle krathong
    thailandkrathong: {d: "M-11 4H11Q11 9 0 9Q-11 9 -11 4Z M-10 4L-8 -1L-6 4Z M-6 4L-4 -2L-2 4Z M2 4L4 -2L6 4Z M6 4L8 -1L10 4Z M-1.3 4V-4H1.3V4Z M0 -11.4C1.8 -8.8 1.8 -6.6 0 -5.2C-1.8 -6.6 -1.8 -8.8 0 -11.4Z", detail: circ(-4, 1.6, 1.6) + circ(4, 1.6, 1.6) + circ(0, 2.4, 1.6), dfill: true},
    // a golden chedi
    thailandchedi: {d: "M-10 11H10V9H8V7H-8V9H-10Z M-7 7C-7 1 -5 -2 -2.4 -3.6H2.4C5 -2 7 1 7 7Z M-2.4 -3.6V-5.4H2.4V-3.6Z M-2 -5.4L-0.4 -12H0.4L2 -5.4Z", detail: "M-6.6 3.4H6.6M-1.6 -7.4H1.6M-1.2 -9.4H1.2", dstroke: true}
  });
  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const KHOM = "M-6.4 -10.4Q0 -11.8 6.4 -10.4L4.4 7.4Q0 8.6 -4.4 7.4Z";
  Object.assign(FX_SHAPES, {
    // a khom loi sky lantern: a paper shade glowing from the little flame at its open base
    thailandkhom: {d: KHOM, paint: (g, c, d) => { const p = new Path2D(KHOM); g.save(); g.shadowColor = d ? "rgba(255,170,70,.9)" : "rgba(255,150,60,.55)"; g.shadowBlur = d ? 9 : 4; g.fillStyle = c; g.fill(p); g.restore();
      g.save(); g.clip(p); const gr = g.createRadialGradient(0, 8, 0.5, 0, 6, 15); gr.addColorStop(0, "#FFF6D0"); gr.addColorStop(0.35, mix(c, "#FFF2C0", 0.5)); gr.addColorStop(1, mix(c, "#B0501A", 0.3)); g.fillStyle = gr; g.fillRect(-7, -12, 14, 21);
      g.strokeStyle = "rgba(160,80,20,.25)"; g.lineWidth = 0.35; g.beginPath(); [-2.2, 2.2].forEach(x => { g.moveTo(x * 1.35, -10.8); g.lineTo(x, 8); }); [-5, 0, 5].forEach(y => { g.moveTo(-7, y); g.lineTo(7, y); }); g.stroke(); g.restore();
      g.fillStyle = "#FFE9A0"; g.beginPath(); g.moveTo(0, 5.2); g.quadraticCurveTo(1.6, 8, 0, 9.6); g.quadraticCurveTo(-1.6, 8, 0, 5.2); g.fill(); g.fillStyle = "#FFFFFF"; oval(g, 0, 8.2, 0.5, 0.9); g.fill(); }},
    // frangipani: five waxy petals, white or pink, warming to yellow at the heart
    thailandplum: {d: [0, 1, 2, 3, 4].map(i => { const a = i / 5 * 6.283 - 1.571, c = Math.cos(a), s = Math.sin(a); return `M0 0Q${(c * 5 - s * 5).toFixed(2)} ${(s * 5 + c * 5).toFixed(2)} ${(c * 10.6).toFixed(2)} ${(s * 10.6).toFixed(2)}Q${(c * 7 + s * 2).toFixed(2)} ${(s * 7 - c * 2).toFixed(2)} 0 0Z`; }).join(""), paint: (g, c) => {
      for (let i = 0; i < 5; i++) { g.save(); g.rotate(i / 5 * 6.283 - 1.571); const gr = g.createLinearGradient(0, 0, 10.6, 0); gr.addColorStop(0, "#F6C43A"); gr.addColorStop(0.38, mix(c, "#FFE9A0", 0.4)); gr.addColorStop(1, c); g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(2, 4.4, 8.4, 5.4, 10.6, 1.6); g.bezierCurveTo(11.2, -1.4, 8, -2.6, 0, 0); g.fill(); g.strokeStyle = "rgba(160,120,90,.25)"; g.lineWidth = 0.3; g.stroke(); g.restore(); } sheen(g, 0.22, 0.16); }}
  });
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "thailand", name: "Thailand", group: "world", desc: "Limestone islands, longtail boats and a golden temple.",
      light: ["#F2FAF7", "rgba(14,116,112,.10)", "#FFFFFF", "#10302E", "#4A6864", "#D0E6E0", "#E2F2EE", "#F8FCFB", "#0E7470", "#3A928C", "#FFFFFF", "#0A4A48", "#0E5A58", "#C8EAE2", "#FFE3A0"],
      dark: ["#0C1530", "rgba(242,196,90,.08)", "#141F42", "#F2F2FA", "#B2B6D4", "#2A3766", "#202C58", "#111A3A", "#F2C45A", "#F6D892", "#0E1838", "#7A6232", "#0E1838", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#8ED4EE,#D6F2F2 45%,#F6EED2)", "linear-gradient(180deg,#0C1A36,#1C2E58 45%,#4A3A6A)"],
      spine: [lg("#16807A", "#0E5A58"), lg("#1E2E5E", "#0E1838")], btn: [lg2("#0E7470", "#C88A1E"), lg2("#F2C45A", "#F6D892")]},
    kit: {motif: "thailandlotus", card: ["#F8FDFB", "#E2F4EE"], ink: "#10302E", bd: "#B6DDD4", mc: "#E0508A", r: 16, notes: ["#FBE0EA", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "gold", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(13), "thailandkhom", d ? ["#FFC870", "#FFB060", "#FFD890"] : ["#F6B860", "#F2A050", "#F8C878"], {smin: 16, smax: 25, vmin: 1.2, vmax: 2.1, sway: 0.6, rock: 0.06, life: 300, glow: d ? 16 : 0})
      .concat(fxFall(W, H, n(26), "thailandplum", d ? ["#FFF6E8", "#FFC8DE", "#FFFFFF"] : ["#FFFFFF", "#F8B8D0", "#FFF4E4"], {sway: 1.5, smin: 9, smax: 13, vmin: 0.9, vmax: 1.6, rock: 0.6}),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A tropical bay of jungle-topped limestone islands, longtail boats on a white beach and a golden temple on the headland"
  });
})();
/* end of module 20-scenes-maj-thailand.js */


