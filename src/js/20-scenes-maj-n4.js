/* ===== module: 20-scenes-maj-n4.js ===== */
/* New theme ideas, batch n4 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const star = (cx, cy, R, r, n) => pts(Array.from({length: n * 2}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n4chochin: {d: "M-3.6 -11H3.6V-8.6H-3.6Z M-3.6 8.6H3.6V11H-3.6Z" + ell(0, 0, 7.4, 9), detail: "M-6.6 -4.4Q0 -3 6.6 -4.4M-7.3 0Q0 1.4 7.3 0M-6.6 4.4Q0 5.8 6.6 4.4", dstroke: true},
    n4mari: {d: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = i / 10 * Math.PI * 2; return circ(Math.cos(a) * 7.2, Math.sin(a) * 7.2, 3.8); }).join("") + circ(0, 0, 8), detail: circ(0, 0, 4.2) + [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2 + 0.3; return `M0 0L${r1(Math.cos(a) * 7)} ${r1(Math.sin(a) * 7)}`; }).join(""), dstroke: true},
    n4picado: {d: "M-9 -11H9V8L7.5 10.5L6 8L4.5 10.5L3 8L1.5 10.5L0 8L-1.5 10.5L-3 8L-4.5 10.5L-6 8L-7.5 10.5L-9 8Z", detail: circ(0, -1.5, 3) + "M-5.5 -7.5l1.5 1.5l-1.5 1.5l-1.5 -1.5z M5.5 -7.5l1.5 1.5l-1.5 1.5l-1.5 -1.5z M-5.5 3l1.5 1.5l-1.5 1.5l-1.5 -1.5z M5.5 3l1.5 1.5l-1.5 1.5l-1.5 -1.5z", dfill: true},
    n4splash: {d: circ(0, 0, 6.4) + [0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * Math.PI * 2 + 0.3, d = 8.4 + (i % 2) * 1.6; return circ(Math.cos(a) * d, Math.sin(a) * d, 1.6 + (i % 3) * 0.5) + circ(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 3.4); }).join("")},
    n4fanous: {d: "M-0.9 -12A1.6 1.6 0 1 1 0.9 -12Z M-4 -8Q-4 -11 0 -11Q4 -11 4 -8Z M-5 -8H5V-6.4H-5Z M-5 -6.4H5L4 3H-4Z M-4.4 3H4.4V4.4H-4.4Z M-4 4.4H4L1 8.6H-1Z M-1 9A1 1 0 1 0 1 9A1 1 0 1 0 -1 9Z", detail: "M-1.6 -6.4L-1.4 3M1.6 -6.4L1.4 3M0 -4.8L1 -2.6L0 -0.4L-1 -2.6Z", dstroke: true},
    n4cres: {d: "M3 -10A10 10 0 1 0 10 3A7.6 7.6 0 1 1 3 -10Z"},
    n4star8: {d: star(0, 0, 10, 7.4, 8)},
    n4mooncake: {d: circ(0, 0, 10.4), detail: circ(0, 0, 7) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * Math.PI * 2; return `M${r1(Math.cos(a) * 3)} ${r1(Math.sin(a) * 3)}L${r1(Math.cos(a) * 5.6)} ${r1(Math.sin(a) * 5.6)}`; }).join(""), dstroke: true},
    n4osma: {d: [0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + 0.4; return circ(Math.cos(a) * 5, Math.sin(a) * 5, 5); }).join(""), detail: circ(0, 0, 2.2), dfill: true},
    n4rabbit: {d: ell(-1, 4, 7.6, 6.4) + ell(1.6, -3, 4.6, 4) + ell(-0.4, -10, 1.6, 5) + ell(2.8, -10, 1.5, 4.6) + circ(-8.6, 6, 2.2)},
  });

  /* ---- completion animations ---- */
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const fillP = (g, c, d) => { g.fillStyle = c; g.fill(new Path2D(d)); };
  const sheen = (g, dk, k = 1) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${0.34 * k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dk ? 0.26 : 0.2})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // stamp a cached sprite at x, y with a given width in px, pivoting at its top edge (top = the shape's top y in units)
  const hang = (g, spr, x, y, w, rot, top) => { const k = w / 20, h = spr._half * k; g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(spr, -h, -h - top * k, 2 * h, 2 * h); g.restore(); };
  Object.assign(FX_SHAPES, {
    n4soft: {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, c); gr.addColorStop(0.55, c + "AA"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }},
    // a cut tissue-paper flag with a flower and a row of little cut shapes
    n4flag: {d: FX_SHAPES.n4picado.d, paint: (g, c) => { fillP(g, c, FX_SHAPES.n4picado.d); g.globalCompositeOperation = "destination-out"; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.moveTo(Math.cos(a) * 3.6 + 1.6, -1 + Math.sin(a) * 3.6); g.arc(Math.cos(a) * 3.6, -1 + Math.sin(a) * 3.6, 1.6, 0, 6.3); } g.moveTo(1, -1); g.arc(0, -1, 1, 0, 6.3); g.fill();
      g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(i * 3.4, -9); g.lineTo(i * 3.4 + 1.1, -7.4); g.lineTo(i * 3.4, -5.8); g.lineTo(i * 3.4 - 1.1, -7.4); } for (let i = -2; i <= 2; i++) { g.moveTo(i * 3.4 + 0.8, 5.4); g.arc(i * 3.4, 5.4, 0.8, 0, 6.3); } g.fill(); g.globalCompositeOperation = "source-over"; }},
    // a monarch butterfly from above
    n4monarch: {d: FX_SHAPES.butterfly.d, paint: (g, c, dk) => { const w = new Path2D(FX_SHAPES.butterfly.d); g.fillStyle = "#1A1210"; g.fill(w); g.save(); g.clip(w); g.fillStyle = c; [[5.4, -4.6, 4.4, 3.2, -0.5], [4.2, 3.4, 2.8, 2.2, 0.5]].forEach(([x, y, rx, ry, a]) => [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * x, y, rx, ry, s * a, 0, 6.3); g.fill(); })); g.strokeStyle = "#1A1210"; g.lineWidth = 0.6; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(0, -1); g.lineTo(s * 9, -7); g.moveTo(0, -1); g.lineTo(s * 9.6, -3.4); g.moveTo(0, 1); g.lineTo(s * 6.4, 5); g.stroke(); }); g.restore();
      g.fillStyle = "#FFFFFF"; [[9.6, -6.4], [10.2, -4], [7, 7], [8, 5.2]].forEach(([x, y]) => [-1, 1].forEach(s => { g.beginPath(); g.arc(s * x, y, 0.5, 0, 6.3); g.fill(); })); g.fillStyle = "#1A1210"; g.beginPath(); g.ellipse(0, 0.6, 0.9, 5.4, 0, 0, 6.3); g.fill(); }},
    // a fanous: gold frame, glowing colored glass, a dome and a ring on top
    n4lamp: {d: FX_SHAPES.n4fanous.d, paint: (g, c, dk) => { const gold = "#C8962A"; fillP(g, gold, "M-0.9 -12A1.6 1.6 0 1 1 0.9 -12Z M-4 -8Q-4 -11 0 -11Q4 -11 4 -8Z M-5 -8H5V-6.4H-5Z M-4.4 3H4.4V4.4H-4.4Z M-4 4.4H4L1 8.6H-1Z M-1 9A1 1 0 1 0 1 9A1 1 0 1 0 -1 9Z");
      const gr = g.createRadialGradient(0, -1.6, 0, 0, -1.6, 6); gr.addColorStop(0, "#FFF4C0"); gr.addColorStop(0.45, c); gr.addColorStop(1, fxShadeN(c)); g.fillStyle = gr; g.fill(new Path2D("M-5 -6.4H5L4 3H-4Z")); g.strokeStyle = gold; g.lineWidth = 0.7; g.stroke(new Path2D("M-1.7 -6.4L-1.4 3M1.7 -6.4L1.4 3M-4.6 -2H4.6")); sheen(g, dk, 0.5); }},
    // a red paper lantern with gold caps and a tassel
    n4lant: {d: FX_SHAPES.n4chochin.d, paint: (g, c, dk) => { fillP(g, "#C8962A", "M-3.8 -11H3.8V-8.4H-3.8Z M-3.8 8.4H3.8V10.6H-3.8Z M-0.5 10.6H0.5V13H-0.5Z"); const gr = g.createRadialGradient(-1, -1, 0, 0, 0, 9.4); gr.addColorStop(0, "#FFD07A"); gr.addColorStop(0.5, c); gr.addColorStop(1, fxShadeN(c)); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 7.6, 9, 0, 0, 6.3); g.fill();
      g.strokeStyle = "rgba(90,20,10,.35)"; g.lineWidth = 0.5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.ellipse(0, i * 2.5, 7.6 * Math.sqrt(1 - Math.pow(i * 2.5 / 9, 2)), 0.8, 0, 0, Math.PI); g.stroke(); } g.beginPath(); g.ellipse(0, 0, 3.4, 9, 0, 0, 6.3); g.stroke(); }}
  });
  function fxShadeN(c) { return fxShade(c, 0.62); }

  // Day of the Dead: strings of papel picado drop in across the top and flutter, marigold petals fall and monarchs flit up
  let PIC = null;
  const picDraw = (g, f, W, H, dk) => { if (!PIC) return; const fw = PIC.fw;
    PIC.rows.forEach((r, ri) => { const drop = (1 - ease((f - ri * 12) / 45)) * (r.y + fw * 1.4), yAt = x => r.y - drop + Math.sin(x / W * Math.PI) * r.sag;
      g.strokeStyle = dk ? "rgba(255,230,200,.6)" : "rgba(90,50,30,.55)"; g.lineWidth = 1.2; g.beginPath(); for (let x = 0; x <= W; x += 16) x ? g.lineTo(x, yAt(x)) : g.moveTo(x, yAt(x)); g.stroke();
      r.flags.forEach((fl, i) => { const x = fl.x, sw = Math.sin(f * 0.07 + fl.ph) * 0.12 * (0.4 + 0.6 * Math.abs(Math.sin(f * 0.02 + ri))); hang(g, fl.spr, x, yAt(x), fw, sw, -11); }); }); };

  // Holi: handfuls of colored powder are thrown across the screen and bloom into soft clouds
  const throwAt = (W, H, x, y, t, c, n, d) => Array.from({length: n(16)}, () => { const a = fxR(0, 6.3), sp = fxR(2, 10); return {shape: "n4soft", c, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8, g: 0.006, drag: 0.93, size: fxR(9, 15), grow: 0.16, rot: 0, vr: 0, sway: 0, alpha: d ? 0.4 : 0.42, life: fxR(130, 170), delay: t + Math.floor(fxR(0, 4))}; })
    .concat(Array.from({length: n(22)}, () => { const a = fxR(0, 6.3), sp = fxR(4, 13); return {shape: "circle", c, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.05, drag: 0.94, size: fxR(1.6, 3.2), rot: 0, vr: 0, sway: 0, life: fxR(90, 130), delay: t + 2}; }));

  // Ramadan: fanous lanterns lower on their chains from the top and sway, under a glowing crescent and twinkling stars
  let LAMPS = null, MOONC = null;
  const crescent = (R, dk) => { const key = R + "|" + dk; if (MOONC && MOONC.key === key) return MOONC.c; const c = document.createElement("canvas"), S = Math.ceil(R * 2 + 60); c.width = c.height = S; const x = c.getContext("2d"); x.translate(S / 2, S / 2); x.shadowBlur = 28; x.shadowColor = dk ? "rgba(255,230,150,.8)" : "rgba(230,160,40,.6)"; x.fillStyle = dk ? "#FFF0C0" : "#F2C24A"; x.beginPath(); x.arc(0, 0, R, 0, 6.3); x.fill(); x.shadowBlur = 0; x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(R * 0.42, -R * 0.24, R * 0.86, 0, 6.3); x.fill(); MOONC = {key, c}; return c; };
  const lampDraw = (g, f, W, H, dk) => { const R = Math.round(Math.min(W, H) * 0.09), mc = crescent(R, dk), ma = ease((f - 10) / 50); g.globalAlpha = ma; g.drawImage(mc, W * 0.82 - mc.width / 2, H * 0.16 - mc.width / 2 + (1 - ma) * 20); g.globalAlpha = 1; if (!LAMPS) return;
    LAMPS.forEach(l => { const p = ease((f - l.d) / 55); if (p <= 0) return; const len = l.len * p, sw = Math.sin(f * 0.045 + l.ph) * 0.14 * (1 - 0.4 * p), ex = l.x + Math.sin(sw) * len, ey = Math.cos(sw) * len;
      g.strokeStyle = dk ? "rgba(240,200,120,.7)" : "rgba(140,100,40,.7)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(l.x, 0); g.lineTo(ex, ey); g.stroke();
      if (dk) { const gr = g.createRadialGradient(ex, ey + l.w * 0.55, 0, ex, ey + l.w * 0.55, l.w * 1.3); gr.addColorStop(0, "rgba(255,210,120,.35)"); gr.addColorStop(1, "rgba(255,210,120,0)"); g.fillStyle = gr; g.fillRect(ex - l.w * 1.3, ey - l.w * 0.75, l.w * 2.6, l.w * 2.6); }
      hang(g, l.spr, ex, ey, l.w, sw, -13); }); };

  // Mid-Autumn: a huge full moon rises with the jade rabbit on it, red lanterns float up and osmanthus drifts down
  let MOONF = null;
  const moonDraw = (g, f, W, H, dk) => { const R = Math.min(W, H) * 0.17, a = ease(f / 60), cx = W * 0.74, cy = H * (0.42 - 0.2 * ease(f / 150)); const key = Math.round(R) + "|" + dk;
    if (!MOONF || MOONF.key !== key) { const c = document.createElement("canvas"), S = Math.ceil(R * 4.4); c.width = c.height = S; const x = c.getContext("2d"), m = S / 2, hg = x.createRadialGradient(m, m, R * 0.9, m, m, R * 2.2); hg.addColorStop(0, dk ? "rgba(255,236,170,.4)" : "rgba(255,244,210,.7)"); hg.addColorStop(1, "rgba(255,236,170,0)"); x.fillStyle = hg; x.fillRect(0, 0, S, S);
      const dg = x.createRadialGradient(m - R * 0.3, m - R * 0.3, 0, m, m, R); dg.addColorStop(0, dk ? "#FFF8DC" : "#FFFBEE"); dg.addColorStop(1, dk ? "#F2D38A" : "#F4D492"); x.fillStyle = dg; x.beginPath(); x.arc(m, m, R, 0, 6.3); x.fill();
      x.fillStyle = dk ? "rgba(200,160,80,.22)" : "rgba(210,170,100,.22)"; [[-0.35, -0.3, 0.2], [0.3, 0.25, 0.16], [0.42, -0.35, 0.1], [-0.1, 0.45, 0.12]].forEach(([u, v, r]) => { x.beginPath(); x.arc(m + u * R, m + v * R, r * R, 0, 6.3); x.fill(); });
      x.save(); x.translate(m + R * 0.05, m + R * 0.12); x.scale(R / 26, R / 26); x.fillStyle = dk ? "rgba(170,130,70,.38)" : "rgba(190,150,90,.35)"; x.fill(new Path2D(FX_SHAPES.n4rabbit.d)); x.restore(); MOONF = {key, c}; }
    g.globalAlpha = a; g.drawImage(MOONF.c, cx - MOONF.c.width / 2, cy - MOONF.c.width / 2); g.globalAlpha = 1; };

  const FX = {
    diadelosmuertos: {spawn: (W, H, d, n) => { const fw = Math.max(26, Math.min(56, Math.min(W, H) * 0.075)), cols = d ? ["#FF6AA8", "#3ED6E0", "#FFD23A", "#B47AFF", "#5AE08A", "#FF8A3A"] : ["#F23A8A", "#14AAB8", "#8A4AD8", "#2EAA5A", "#F2602A", "#E8B010"];
        PIC = {fw, rows: [[H * 0.06, H * 0.05], [H * 0.17, H * 0.07]].map(([y, sag], ri) => { const k = Math.ceil(W / (fw * 1.3)) + 1; return {y, sag, flags: Array.from({length: k}, (_, i) => ({x: (i + (ri ? 0.5 : 0.1)) * fw * 1.3, ph: fxR(0, 6.3), spr: fxSprite("n4flag", cols[(i + ri * 3) % cols.length], 0, d)}))}; })};
        return fxFall(W, H, n(24), "n4mari", d ? ["#FFA23A", "#FFC83A"] : ["#F7901A", "#FFB21E"], {sway: 1.6, smin: 10, smax: 14, spread: 70}).concat(fxFall(W, H, n(30), "petal", d ? ["#FFA23A", "#FFC83A", "#FF8A1E"] : ["#FF9A1E", "#FFC21E", "#F27A1A"], {sway: 1.8, flip: true, smin: 8, smax: 11, spread: 80}))
          .concat(fxFlutter(W, H, n(8), d ? ["#FF9A2E", "#FFA83A"] : ["#F47A10", "#F58A1E"]).map(p => Object.assign(p, {shape: "n4monarch", size: fxR(15, 20), delay: 30 + Math.floor(fxR(0, 80))})),
            fxTw(W, H, n(18), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#F23A8A"], {smin: 4, smax: 8, glow: d ? 10 : 4, spread: 160}));
      }, draw: picDraw},
    holi: {spawn: (W, H, d, n) => { const cols = d ? ["#FF5AAE", "#FFD23A", "#3AE08A", "#4A9AFF", "#B06AFF", "#FF8A3A"] : ["#F2348A", "#FFB81E", "#1EBA6A", "#2A7AE8", "#8A44D8", "#FF6A1E"], pick = cols.slice().sort(() => Math.random() - 0.5);
        return [0, 22, 44, 70, 100].flatMap((t, i) => throwAt(W, H, W * ((i % 2 ? 0.72 : 0.28) + fxR(-0.14, 0.14)), H * fxR(0.2, 0.8), t, pick[i % pick.length], n, d))
          .concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFFFFF", "#FFE3A8"] : ["#F2348A", "#FFB81E"], {smin: 4, smax: 8, glow: d ? 10 : 4, spread: 160}));
      }},
    ramadan: {spawn: (W, H, d, n) => { const k = Math.max(3, Math.min(7, Math.round(W / 170))), w = Math.max(54, Math.min(120, Math.min(W, H) * 0.16)), cols = d ? ["#FFB04A", "#FF6A5A", "#5AE0A8", "#7AA8FF"] : ["#E8962A", "#D8402E", "#1E9A6A", "#2E62C8"];
        LAMPS = Array.from({length: k}, (_, i) => ({x: (i + 0.5) / k * W * 0.8 + fxR(-0.03, 0.03) * W, len: H * (i % 2 ? fxR(0.12, 0.2) : fxR(0.22, 0.32)), w: w * (i % 2 ? 0.85 : 1), d: Math.floor(i * 9 + fxR(0, 10)), ph: fxR(0, 6.3), spr: fxSprite("n4lamp", cols[i % cols.length], 0, d)}));
        return fxTw(W, H, n(36), "n4star8", d ? ["#FFE7A0", "#FFFFFF", "#F2C45A"] : ["#D9A43A", "#2A7A78", "#C8962A"], {smin: 5, smax: 9, glow: d ? 12 : 4, top: 0.75, spread: 170})
          .concat(fxFall(W, H, n(16), "star", d ? ["#FFE7A0", "#FFFFFF"] : ["#D9A43A", "#E8B84A"], {sway: 1, smin: 6, smax: 9, vmin: 0.9, vmax: 1.5, glow: d ? 8 : 0, spread: 90}));
      }, draw: lampDraw},
    midautumn: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "n4lant", d ? ["#FF5A40", "#FF7A3A", "#F2483A"] : ["#E0402E", "#E85A2A", "#D8342A"], {smin: 18, smax: 26, vmin: 0.9, vmax: 1.6, sway: 0.8, life: 330, glow: d ? 16 : 6, spread: 90}).map(p => Object.assign(p, {rock: 0.1, swf: 0.03}))
        .concat(fxFall(W, H, n(44), "n4osma", d ? ["#F2B83A", "#FFD86A"] : ["#F6B02A", "#E8A01E", "#FFC84A"], {sway: 1.6, smin: 6, smax: 9, vmin: 0.9, vmax: 1.6, glow: d ? 6 : 0, spread: 80}),
          fxTw(W, H, n(16), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 4, smax: 7, glow: d ? 10 : 4, spread: 160})),
      draw: moonDraw}
  };
  /* ---- end of completion animations ---- */

  MAJ_THEMES.push({
    skin: {id: "diadelosmuertos", name: "Día de los Muertos", group: "ideas", desc: "Papel picado, marigolds and a candlelit ofrenda.",
      light: ["#FDF3EC", "rgba(194,54,122,.10)", "#FFFFFF", "#3A1A2E", "#7A5068", "#F0D8DE", "#F7E7EA", "#FEF9F7", "#C2367A", "#D2609A", "#FFFFFF", "#7A1E4E", "#8A2058", "#F6D2E2", "#FFD98A"],
      dark: ["#190E26", "rgba(255,162,58,.08)", "#241433", "#FCEFF6", "#C9AFC4", "#3E2450", "#311C42", "#1E1130", "#FFA23A", "#FFC86A", "#2A1420", "#8A5420", "#24102E", "#E8CFE4", "#6A4420"],
      glow: ["linear-gradient(180deg,#F8C77A,#FCE3B5 45%,#F5B6A6)", "linear-gradient(180deg,#1E1236,#3A1B4E 45%,#8A3058)"],
      spine: [lg("#C2367A", "#8A2058"), lg("#4A1E54", "#24102E")], btn: [lg2("#C2367A", "#F07A2A"), lg2("#FFA23A", "#FFC86A")]},
    kit: {motif: "n4mari", card: ["#FFF9F4", "#FBE6EC"], ink: "#3A1A2E", bd: "#F0C6D6", mc: "#F07A2A", r: 16, notes: ["#FCD9C0"].concat(NOTES), shape: "scallop", pin: "washi2", fab: "999px", btn: "14px"},
    fx: FX.diadelosmuertos,
    tag: "A street dressed for the Day of the Dead, with papel picado, a marigold arch and a candlelit ofrenda"
  });
  MAJ_THEMES.push({
    skin: {id: "holi", name: "Holi", group: "ideas", desc: "A courtyard full of flying color and marigold garlands.",
      light: ["#FDF3F7", "rgba(210,58,130,.10)", "#FFFFFF", "#3A1A30", "#76546A", "#F2D8E4", "#F8E8EF", "#FEFAFC", "#D23A82", "#E0669E", "#FFFFFF", "#8A1E52", "#9A2A6A", "#FBD2E4", "#FFE38A"],
      dark: ["#1C0F2A", "rgba(255,138,200,.08)", "#281638", "#FCEFFA", "#CBB0D6", "#432858", "#361E4A", "#221333", "#FF8AC8", "#FFB0DA", "#2A1030", "#8A3A6A", "#2A1040", "#ECD0EC", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#FFD6E8,#FFF1C9 45%,#CFF1E6)", "linear-gradient(180deg,#2A1840,#4A2160 45%,#8A2E6A)"],
      spine: [lg("#D8407E", "#9A2A6A"), lg("#5A2470", "#2A1040")], btn: [lg2("#D23A82", "#F08A2A"), lg2("#FF8AC8", "#FFC86A")]},
    kit: {motif: "n4splash", card: ["#FFFAFD", "#FBE6F0"], ink: "#3A1A30", bd: "#F2C6DC", mc: "#D23A82", r: 20, notes: ["#FBD2E4", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "cloud", pin: "magnet", fab: "999px", btn: "999px"},
    fx: FX.holi,
    tag: "A haveli courtyard mid-celebration, with drifting clouds of coloured powder and marigold garlands"
  });
  MAJ_THEMES.push({
    skin: {id: "ramadan", name: "Ramadan Nights", group: "ideas", desc: "Rooftops under a crescent moon, hung with fanous lanterns.",
      light: ["#FAF5EC", "rgba(42,122,120,.10)", "#FFFFFF", "#2A2418", "#6E6250", "#EADFCC", "#F3EBDD", "#FDFAF5", "#2A7A78", "#4E9896", "#FFFFFF", "#1A5250", "#1E5654", "#D6EAE6", "#FFE3A0"],
      dark: ["#0E1230", "rgba(242,196,90,.08)", "#171C42", "#F2F0FA", "#B4B2D2", "#2C3266", "#222858", "#131838", "#F2C45A", "#F6D892", "#14183A", "#7A6230", "#121638", "#D4D6F0", "#6A5420"],
      glow: ["linear-gradient(180deg,#F3D9B0,#F8EBD3 45%,#E9C9A0)", "linear-gradient(180deg,#0F1638,#1E2558 45%,#3E3A78)"],
      spine: [lg("#2E7C7A", "#1E5654"), lg("#252C66", "#121638")], btn: [lg2("#2A7A78", "#C99A2E"), lg2("#F2C45A", "#F6D892")]},
    kit: {motif: "n4fanous", card: ["#FFFBF4", "#F4EAD8"], ink: "#2A2418", bd: "#E6D3B0", mc: "#C99A2E", r: 12, notes: ["#F2E2C2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "gold", fab: "22px 22px 6px 22px", btn: "10px"},
    fx: FX.ramadan,
    tag: "Old-city rooftops under a crescent moon, hung with fanous lanterns and strings of little stars"
  });
  MAJ_THEMES.push({
    skin: {id: "midautumn", name: "Mid-Autumn Festival", group: "ideas", desc: "A riverside pavilion under a giant full moon.",
      light: ["#FBF4EA", "rgba(184,64,46,.10)", "#FFFFFF", "#2E2420", "#6E5E52", "#ECDCCA", "#F4EADC", "#FDFAF5", "#B8402E", "#CC6A50", "#FFFFFF", "#7A2418", "#7E2C2A", "#F2D8C8", "#FFE3A0"],
      dark: ["#10142E", "rgba(242,196,106,.08)", "#191E40", "#F4F0FA", "#B8B4D4", "#2E3462", "#242A56", "#151A38", "#F2C46A", "#F6D892", "#161A3A", "#7A6232", "#161A3A", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#F2D6A2,#F8E8C9 45%,#E7C6A0)", "linear-gradient(180deg,#141B3A,#26305A 45%,#5A4A7A)"],
      spine: [lg("#B8463A", "#7E2C2A"), lg("#2E3466", "#161A3A")], btn: [lg2("#B8402E", "#D99A2E"), lg2("#F2C46A", "#F6D892")]},
    kit: {motif: "n4mooncake", card: ["#FFFBF4", "#F6E8D6"], ink: "#2E2420", bd: "#E8D2B6", mc: "#B8402E", r: 18, notes: ["#F6E0C0", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "circle", pin: "gold", fab: "999px", btn: "14px"},
    fx: FX.midautumn,
    tag: "A riverside pavilion under a giant full moon, with lotus lanterns drifting on the water and osmanthus in bloom"
  });
})();
/* end of module 20-scenes-maj-n4.js */








