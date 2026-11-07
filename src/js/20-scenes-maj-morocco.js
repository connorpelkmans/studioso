/* ===== module: 20-scenes-maj-morocco.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const star = (cx, cy, R, r, n, rot = 0) => pts(Array.from({length: n * 2}, (_, i) => { const a = rot - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  Object.assign(FX_SHAPES, {
    // a zellige star
    moroccostar: {d: star(0, 0, 10.4, 7.6, 8, Math.PI / 8), detail: star(0, 0, 4.6, 3.2, 8), dstroke: true},
    // a pierced brass lantern
    moroccolantern: {d: "M-0.8 -12.6H0.8V-10.4H-0.8Z M-4.4 -6.6Q-4.4 -10.6 0 -10.8Q4.4 -10.6 4.4 -6.6Z M-5.4 -6.6H5.4V-5H-5.4Z M-5 -5H5L4.2 4.4H-4.2Z M-4.8 4.4H4.8V5.8H-4.8Z M-3.8 5.8H3.8L0 11.4Z",
      detail: circ(-2, -2.6, 0.7) + circ(2, -2.6, 0.7) + circ(0, -0.4, 0.8) + circ(-2, 1.8, 0.7) + circ(2, 1.8, 0.7), dfill: true},
    moroccopetal: {d: "M0 -7.6C4.6 -7.8 7 -3 5.4 1.6C4 5.6 1.4 7.6 0 7.6C-1.4 7.6 -4 5.6 -5.4 1.6C-7 -3 -4.6 -7.8 0 -7.6Z", detail: "M0 -4.6Q-0.6 1 0 5.4", dstroke: true},
    moroccoblossom: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 3.6); }).join(""), detail: circ(0, 0, 2), dfill: true},
    moroccoorange: {d: circ(0, 1.4, 8.6) + "M0.4 -7.2Q4 -12.4 9 -10.4Q6.4 -5.8 0.4 -7.2Z", detail: "M-3.6 -1.8A4.4 4.4 0 0 1 0 -4.6", dstroke: true}
  });
  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // a pierced brass lantern, lit from inside: warm light shines through its star cut-outs
  const LANT = "M-0.8 -12.6H0.8V-10.4H-0.8Z M-4.4 -6.6Q-4.4 -10.6 0 -10.8Q4.4 -10.6 4.4 -6.6Z M-5.4 -6.6H5.4V-5H-5.4Z M-5 -5H5L4.2 4.4H-4.2Z M-4.8 4.4H4.8V5.8H-4.8Z M-3.8 5.8H3.8L0 11.4Z";
  Object.assign(FX_SHAPES, {
    moroccolamp: {d: LANT, paint: (g, c, d) => { const p = new Path2D(LANT), lit = d ? "#FFE6A0" : "#FFE2A0"; g.save(); g.shadowColor = "rgba(255,190,90,.9)"; g.shadowBlur = 10; g.fillStyle = "rgba(255,200,110,.35)"; oval(g, 0, 0, 7, 8); g.fill(); g.restore();
      g.fillStyle = c; g.fill(p); sheen(g, 0.4, 0.3); g.fillStyle = lit; g.save(); g.shadowColor = "#FFC060"; g.shadowBlur = 3;
      [[-2.4, -2.4], [0, -2.6], [2.4, -2.4], [-2, 0.4], [0, 0.6], [2, 0.4], [-1, 2.8], [1, 2.8]].forEach(([x, y], i) => { if (i % 3 === 1) { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * 0.785, r = k % 2 ? 0.55 : 1.2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } else { oval(g, x, y, 0.6, 0.85); g.fill(); } });
      [-3, -1, 1, 3].forEach(x => { oval(g, x, -8.4, 0.5, 0.7); g.fill(); }); g.restore(); g.fillStyle = mix(c, "#000000", 0.35); g.fillRect(-5.4, -5.4, 10.8, 0.5); g.fillRect(-4.8, 4.4, 9.6, 0.5); }}
  });
  // lanterns let down on chains from the top, swinging gently, then drawn back up
  let lamps = [];
  const lampDraw = (g, f, W, H, d) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900)); g.lineCap = "round";
    lamps.forEach(l => { const t = f - l.t0; if (t < 0) return; const e = t < 70 ? 1 - Math.pow(1 - t / 70, 3) * Math.cos(t / 70 * 3) : 1, up = fxEase((t - 175) / 70), L = l.L * (e - up * 0.9), a = fxEase(t / 10) * (1 - up);
      if (a <= 0.01 || L <= 0) return; const th = Math.sin(t * 0.045 + l.ph) * 0.12 * (1 - t / 400), s = l.size * sc / 10, x = l.x + Math.sin(th) * L, y = Math.cos(th) * L;
      g.globalAlpha = a; g.strokeStyle = d ? "rgba(232,184,96,.7)" : "rgba(150,110,50,.75)"; g.lineWidth = Math.max(1, s * 0.45); g.setLineDash([s * 1.2, s * 0.6]); g.beginPath(); g.moveTo(l.x, -4); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
      const spr = fxSprite("moroccolamp", l.c, 0, d), h = spr._half; g.save(); g.translate(x, y); g.rotate(-th); g.translate(0, 12.6 * s); g.drawImage(spr, -h * s, -h * s, 2 * h * s, 2 * h * s); g.restore(); }); g.globalAlpha = 1; };
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "morocco", name: "Morocco", group: "world", desc: "A tiled riad courtyard below the Atlas mountains.",
      light: ["#FBF5EC", "rgba(44,95,168,.10)", "#FFFFFF", "#2A2230", "#6E5E58", "#EADCC8", "#F5EBDD", "#FDFAF5", "#2C5FA8", "#C8642E", "#FFFFFF", "#1E4680", "#1E3A6E", "#D6E2F4", "#FFE3A0"],
      dark: ["#100F2A", "rgba(232,184,96,.08)", "#1A1838", "#F4F0FA", "#BCB2D2", "#302A5A", "#24204A", "#151330", "#E8B860", "#F2CC84", "#16142E", "#7A6230", "#141232", "#D8D2F0", "#6A5420"],
      glow: ["linear-gradient(180deg,#A9D3F0,#F3E6CF 45%,#F2C79A)", "linear-gradient(180deg,#121434,#2A2156 45%,#6A3A4E)"],
      spine: [lg("#2C5FA8", "#1E3A6E"), lg("#2A2156", "#121434")], btn: [lg2("#2C5FA8", "#C8642E"), lg2("#E8B860", "#F2CC84")]},
    kit: {motif: "moroccostar", card: ["#FFFBF4", "#F4E8D8"], ink: "#2A2230", bd: "#E2CFAE", mc: "#2C5FA8", r: 14, notes: ["#F6E2C4", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { const k = Math.max(3, Math.min(7, Math.round(W / 170))); lamps = Array.from({length: k}, (_, i) => ({x: W * (i + 0.5) / k + fxR(-0.15, 0.15) * W / k, L: H * fxR(0.12, 0.34), t0: Math.floor(i % 2 * 12 + fxR(0, 20)), ph: fxR(0, 6.3), size: fxR(24, 31), c: fxPick(d ? ["#C89A3A", "#B8862E"] : ["#B8862E", "#A87A2A", "#C8963A"])}));
      return fxFall(W, H, n(30), "moroccopetal", d ? ["#F27A96", "#FF9AB2", "#E8607E"] : ["#E8506E", "#F27A96", "#D93A5E"], {sway: 1.7, flip: true, smin: 7, smax: 10}).map(p => Object.assign(p, {delay: p.delay + 30}))
        .concat(fxTw(W, H, n(22), "moroccostar", d ? ["#F2C45A", "#7AB0F0", "#FFFFFF"] : ["#2C5FA8", "#2E8E6E", "#D9A43A"], {smin: 7, smax: 11, glow: d ? 10 : 0, top: 0.9, glint: true})); },
      draw: lampDraw},
    tag: "A Marrakech riad seen through a carved horseshoe arch: zellige tiles, a bubbling fountain, orange trees and brass lanterns below the snowy Atlas"
  });
})();
/* end of module 20-scenes-maj-morocco.js */


