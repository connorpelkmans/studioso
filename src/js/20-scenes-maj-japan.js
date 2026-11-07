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
  Object.assign(FX_SHAPES, {
    // a petal with soft pink shading toward its notched tip
    japanpetal: {d: "M0 -6L-2.2 -9.4C-6.4 -8.4 -6.6 -2 -4.2 3.4C-2.8 6.4 -1.2 8.4 0 9.6C1.2 8.4 2.8 6.4 4.2 3.4C6.6 -2 6.4 -8.4 2.2 -9.4Z", paint: (g, c) => { const p = new Path2D("M0 -6L-2.2 -9.4C-6.4 -8.4 -6.6 -2 -4.2 3.4C-2.8 6.4 -1.2 8.4 0 9.6C1.2 8.4 2.8 6.4 4.2 3.4C6.6 -2 6.4 -8.4 2.2 -9.4Z"), gr = g.createLinearGradient(0, 9.6, 0, -9.4);
      gr.addColorStop(0, mix(c, "#FFFFFF", 0.65)); gr.addColorStop(1, c); g.fillStyle = gr; g.fill(p); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 0.4; g.beginPath(); g.moveTo(0, 8); g.lineTo(0, -4); g.stroke(); sheen(g, 0.2, 0.14); }}
  });

  // a blossoming branch: it grows in from a top corner, buds swell and open one by one, then a gust carries a hanafubuki
  // (a swirling stream of petals) across. Built once per play in spawn, drawn by hand so every part moves smoothly.
  const ez = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t), cvs = fn => { const c = document.createElement("canvas"); c.width = c.height = 64; fn(c.getContext("2d")); return c; }, IMG = {};
  // one petal, base at the bottom middle, notched tip at the top, pale toward the base
  const petalImg = d => IMG["p" + d] || (IMG["p" + d] = cvs(p => { const pp = new Path2D("M32 62C17 52 6 34 12 14C15 7 22 4 27 8L32 15L37 8C42 4 49 7 52 14C58 34 47 52 32 62Z"), gr = p.createLinearGradient(0, 62, 0, 4);
    gr.addColorStop(0, d ? "#FFF6FA" : "#FFF2F6"); gr.addColorStop(0.45, d ? "#FCD2E0" : "#F9C4D6"); gr.addColorStop(1, d ? "#F4A2BE" : "#EE8AAE"); p.fillStyle = gr; p.fill(pp);
    p.strokeStyle = d ? "rgba(255,255,255,.35)" : "rgba(214,96,140,.28)"; p.lineWidth = 1; p.beginPath(); p.moveTo(32, 56); p.lineTo(32, 20); p.moveTo(31, 46); p.quadraticCurveTo(22, 34, 20, 18); p.moveTo(33, 46); p.quadraticCurveTo(42, 34, 44, 18); p.stroke();
    p.strokeStyle = d ? "rgba(255,230,240,.5)" : "rgba(200,80,120,.35)"; p.lineWidth = 0.8; p.stroke(pp); }));
  // the heart of the flower: a rosy eye with fine stamens tipped in gold
  const eyeImg = d => IMG["e" + d] || (IMG["e" + d] = cvs(p => { p.translate(32, 32); const gr = p.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, d ? "#F8E8A0" : "#E8E29A"); gr.addColorStop(0.45, d ? "#FF9CB8" : "#E8608A"); gr.addColorStop(1, "rgba(232,96,138,0)");
    p.fillStyle = gr; p.beginPath(); p.arc(0, 0, 12, 0, 6.3); p.fill(); p.lineCap = "round"; for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 15 + (i % 3) * 3, x = Math.cos(a) * r, y = Math.sin(a) * r;
      p.strokeStyle = d ? "rgba(255,240,246,.85)" : "rgba(236,120,160,.85)"; p.lineWidth = 1.1; p.beginPath(); p.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); p.quadraticCurveTo(Math.cos(a + 0.2) * r * 0.6, Math.sin(a + 0.2) * r * 0.6, x, y); p.stroke();
      p.fillStyle = d ? "#FFE07A" : "#E8A92A"; p.beginPath(); p.arc(x, y, 2, 0, 6.3); p.fill(); } p.fillStyle = d ? "#FFF0B0" : "#F2E2A0"; p.beginPath(); p.arc(0, 0, 3, 0, 6.3); p.fill(); }));
  let JP = null;
  const jpBuild = (W, H, n) => { const ph = W < H, U = ph ? W * 0.98 : Math.min(W * 0.5, H * 0.8), R = Math.max(10, Math.min(20, U * 0.044)), segs = [], buds = []; let sd = 11;
    const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, sp = U / 34;   // growth speed, px per frame
    const limb = (x, y, a, len, w, dep, t, side) => { const k = dep > 1 ? 5 : 3, st = len / k;
      for (let i = 0; i < k; i++) { a += (rnd() - 0.5) * 0.3 + (dep > 1 ? 0.05 : 0.02); const nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st, w1 = Math.max(2, w * (1 - 0.4 * (i + 1) / k)), t1 = t + st / sp;
        segs.push({x0: x, y0: y, x1: nx, y1: ny, w0: w, w1, t0: t, t1});
        if (dep > 0 && i < k - 1 && (i % 2 === (dep > 1 ? 1 : 0) || rnd() < 0.3)) { side = -side; limb(nx, ny, a + side * (0.55 + rnd() * 0.3), len * (dep > 1 ? 0.48 : 0.6), w1 * 0.66, dep - 1, t1, side); }
        if (dep < 2) for (let j = 0, m = 1 + (rnd() < 0.55); j < m; j++) { const s = j ? -1 : 1, ba = a + s * (0.8 + rnd() * 0.6); buds.push({x: nx + Math.cos(ba) * R * 0.7, y: ny + Math.sin(ba) * R * 0.7, sx: nx, sy: ny, a: ba, t: t1 + j * 4}); }
        x = nx; y = ny; w = w1; t = t1; }
      buds.push({x: x + Math.cos(a) * R * 0.6, y: y + Math.sin(a) * R * 0.6, sx: x, sy: y, a, t}); };
    const rx = ph ? -W * 0.08 : -U * 0.1, ry = ph ? H * 0.03 : -U * 0.04;
    limb(rx, ry, ph ? 0.5 : 0.36, U * 1.05, Math.max(8, U * 0.042), 2, 0, -1);
    buds.sort((a, b) => a.t - b.t); const nb = buds.length; buds.forEach((b, i) => { b.open = 34 + i * 96 / nb + rnd() * 8; b.rot = rnd() * 6.3; b.r = R * (0.82 + rnd() * 0.3); });
    // the hanafubuki: petals come in on the wind from the left and loop as they go; some leave the branch itself
    const band = x => H * (ph ? 0.3 + 0.32 * x / W : 0.26 + 0.34 * x / W), P = [], sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
    const add = (x0, yo, s) => P.push({x0, yo, s, v: W / fxR(95, 150), r: fxR(14, 44) * sc / 1.6, w: fxR(0.05, 0.1) * (Math.random() < 0.5 ? -1 : 1), ph: fxR(0, 6.3), size: fxR(18, 28) * sc / 1.6, z: fxR(0.7, 1.15), fs: fxR(0.06, 0.13), fp: fxR(0, 6.3), r0: fxR(0, 6.3), vr: fxR(-0.03, 0.03)});
    for (let i = 0, m = n(78); i < m; i++) add(-fxR(20, 80), fxR(-1, 1) * H * (ph ? 0.08 : 0.09), 114 + fxR(0, 92) * Math.sqrt(i / m));
    buds.forEach(b => { if (Math.random() < 0.6) add(b.x, b.y - band(b.x), 120 + b.x / W * 30 + fxR(0, 10)); });
    P.sort((a, b) => a.z - b.z); return {segs, buds, P, rx, ry, U, R, band, sc}; };
  const jpDraw = (g, f, W, H, d) => { if (!JP) return; const {segs, buds, rx, ry, U} = JP, gust = ez((f - 112) / 22) * (1 - ez((f - 160) / 90));
    // a soft pink glow behind the branch
    const ga = ez(f / 50) * (d ? 0.16 : 0.2), gr = g.createRadialGradient(rx + U * 0.3, ry + U * 0.2, 0, rx + U * 0.3, ry + U * 0.2, U * 1.1); gr.addColorStop(0, `rgba(${d ? "246,160,190" : "248,170,196"},${ga})`); gr.addColorStop(1, "rgba(248,170,196,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the gust bends the branch a little, then it settles back
    const sw = gust * (0.022 + 0.012 * Math.sin((f - 112) * 0.11)); g.translate(rx, ry); g.rotate(sw); g.translate(-rx, -ry); g.lineCap = "round";
    // bark: each piece is a tapered quad with a round joint, so the limb narrows smoothly; then a thin light ridge on top
    const vis = segs.map(s => { const k = Math.min(1, (f - s.t0) / (s.t1 - s.t0)); if (k <= 0) return null; const dx = s.x1 - s.x0, dy = s.y1 - s.y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, x = s.x0 + dx * k, y = s.y0 + dy * k, w1 = s.w0 + (s.w1 - s.w0) * k; return {s, x, y, w1, nx, ny}; }).filter(Boolean);
    g.fillStyle = d ? "#5A3E4C" : "#4A3036"; g.beginPath(); for (const v of vis) { const {s, x, y, w1, nx, ny} = v, a = s.w0 / 2, b = w1 / 2; g.moveTo(s.x0 + nx * a, s.y0 + ny * a); g.lineTo(x + nx * b, y + ny * b); g.lineTo(x - nx * b, y - ny * b); g.lineTo(s.x0 - nx * a, s.y0 - ny * a); g.closePath(); g.moveTo(x + b, y); g.arc(x, y, b, 0, 6.3); g.moveTo(s.x0 + a, s.y0); g.arc(s.x0, s.y0, a, 0, 6.3); } g.fill("nonzero");
    g.strokeStyle = d ? "#7A5A6A" : "#6E5050"; for (const v of vis) { const {s, x, y, w1} = v; if (w1 < 3) continue; g.lineWidth = w1 * 0.22; g.beginPath(); g.moveTo(s.x0, s.y0 - s.w0 * 0.24); g.lineTo(x, y - w1 * 0.24); g.stroke(); }
    const pi = petalImg(d), ei = eyeImg(d);
    for (const b of buds) { const sw0 = ez((f - b.t + 4) / 12); if (sw0 <= 0) continue; const o = ez((f - b.open) / 26), R = b.r;
      g.strokeStyle = d ? "#6A4A5A" : "#5A3A3E"; g.lineWidth = Math.max(1.2, R * 0.12); g.beginPath(); g.moveTo(b.sx, b.sy); g.lineTo(b.sx + (b.x - b.sx) * sw0, b.sy + (b.y - b.sy) * sw0); g.stroke();
      g.save(); g.translate(b.x, b.y);
      if (o < 1) { const bs = R * (0.3 + 0.25 * ez((f - b.t) / 30) + 0.12 * ez((f - b.open + 14) / 14)) * sw0; g.globalAlpha = 1 - o; g.rotate(b.a + Math.PI / 2);
        g.fillStyle = d ? "#F590B0" : "#E0628E"; g.beginPath(); g.ellipse(0, -bs * 0.6, bs * 0.55, bs * 0.85, 0, 0, 6.3); g.fill(); g.fillStyle = d ? "rgba(255,230,240,.6)" : "rgba(255,210,226,.7)"; g.beginPath(); g.ellipse(-bs * 0.15, -bs * 0.9, bs * 0.18, bs * 0.32, 0, 0, 6.3); g.fill();
        g.fillStyle = d ? "#8A5A50" : "#7A3E34"; g.beginPath(); g.ellipse(0, 0, bs * 0.42, bs * 0.3, 0, 0, 6.3); g.fill(); g.rotate(-(b.a + Math.PI / 2)); g.globalAlpha = 1; }
      if (o > 0) { const L = R * (0.4 + 0.6 * o), tw = (1 - o) * 0.9, bb = gust * 0.12 * Math.sin(f * 0.2 + b.rot);
        for (let i = 0; i < 5; i++) { g.save(); g.rotate(b.rot + i * 1.2566 + tw + bb); g.scale(0.7 + 0.3 * o, 1); g.drawImage(pi, -L / 2, -L * 0.97, L, L); g.restore(); }
        g.globalAlpha = o; const e = R * 1.15; g.drawImage(ei, -e / 2, -e / 2, e, e); g.globalAlpha = 1; }
      g.restore(); } };
  const jpOver = (g, f, W, H, d) => { if (!JP) return; const {P, band} = JP, pi = petalImg(d);
    for (const p of P) { const t = f - p.s; if (t < 0) continue; const xl = p.x0 + p.v * t * (0.35 + 0.65 * ez(t / 30)), x = xl + p.r * Math.cos(p.w * t + p.ph), yo = p.yo * (1 - 0.45 * ez(t / 90)), y = band(xl) + yo + p.r * 0.8 * Math.sin(p.w * t + p.ph) + t * 0.15;
      if (x > W + 40) continue; const a = ez(t / 14) * (0.55 + 0.45 * Math.min(1, p.z)), fl = Math.cos(t * p.fs + p.fp), L = p.size * p.z;
      g.globalAlpha = a * (fl < 0 ? 0.82 : 1); g.save(); g.translate(x, y); g.rotate(p.r0 + t * p.vr + 0.5 * Math.sin(t * 0.05 + p.ph)); g.scale(Math.max(0.12, Math.abs(fl)), 1); g.drawImage(pi, -L / 2, -L / 2, L, L); g.restore(); }
    g.globalAlpha = 1; };
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "japan", name: "Japan", group: "world", desc: "Mount Fuji over a pagoda in cherry blossom.",
      light: ["#FAF4F5", "rgba(200,68,46,.10)", "#FFFFFF", "#26233A", "#6A6478", "#ECDCE0", "#F4E8EC", "#FDF9FA", "#C8442E", "#D86A50", "#FFFFFF", "#8A2A1E", "#2E3E66", "#F6D6DE", "#FFE3A0"],
      dark: ["#121530", "rgba(246,166,190,.08)", "#1B1F42", "#F4F0FA", "#B9B4D6", "#30355F", "#262A55", "#161A3A", "#F4A0B8", "#F8C0D0", "#1A1838", "#8A4A62", "#14183A", "#DCD2EC", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#BFDDF2,#EAF3F8 45%,#FBE6EA)", "linear-gradient(180deg,#141A3A,#2A2D5A 45%,#5A4570)"],
      spine: [lg("#34477A", "#22305A"), lg("#2A2D5A", "#14183A")], btn: [lg2("#C8442E", "#D8607A"), lg2("#F4A0B8", "#F8C8A8")]},
    kit: {motif: "japansakura", card: ["#FFFAFB", "#F8E6EC"], ink: "#26233A", bd: "#EEC8D4", mc: "#D8607A", r: 14, notes: ["#F8D8E2"].concat(NOTES), shape: "folded", pin: "washi2", fab: "999px", btn: "12px"},
    fx: {len: 300, spawn: (W, H, d, n) => { JP = jpBuild(W, H, n); return fxTw(W, H, n(10), "sparkle", d ? ["#FFE3EE", "#FFFFFF"] : ["#F28AAE", "#FFC8D8"], {smin: 3, smax: 6, top: 0.55, glow: d ? 10 : 4, spread: 140}).map(p => Object.assign(p, {delay: p.delay + 40})); },
      draw: jpDraw, over: jpOver},
    tag: "Mount Fuji's snowy cone over a five-storey pagoda in a sea of cherry blossom, with a torii stair path, a little town and a red bridge"
  });
})();
/* end of module 20-scenes-maj-japan.js */


