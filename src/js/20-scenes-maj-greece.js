/* ===== module: 20-scenes-maj-greece.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // an ellipse turned by ang degrees, as a polygon
  const rell = (x, y, rx, ry, ang) => { const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts(Array.from({length: 20}, (_, i) => { const t = i / 20 * Math.PI * 2, px = rx * Math.cos(t), py = ry * Math.sin(t); return [x + px * c - py * s, y + px * s + py * c]; })); };
  const half = (cx, by, r, k) => pts(Array.from({length: 17}, (_, i) => { const a = Math.PI + i / 16 * Math.PI; return [cx + Math.cos(a) * r, by + Math.sin(a) * r * k]; }));
  Object.assign(FX_SHAPES, {
    // a white dove in flight, wings raised
    greecedove: {d: "M-10.5 2.4C-6.5 0.4 -2 0.2 2 1.2L6 -0.8C8 -1.8 10.2 -1.4 11.2 0.2L8.4 1.4C7.2 3.6 4 5.2 0 5.2C-4.4 5.2 -8.2 4.2 -10.5 2.4Z M-3.4 1.4C-6 -3.6 -4 -9 2.6 -11.4C1.6 -6.4 1.8 -2.4 3 1.2Z M-10.5 2.4L-12 -1.6L-8.6 1.2Z", detail: circ(8.4, -0.2, 0.7), dfill: true},
    // a sprig of bougainvillea
    greecebloom: {d: [-90, 30, 150].map(a => rell(Math.cos(a * Math.PI / 180) * 4.6, Math.sin(a * Math.PI / 180) * 4.6, 5, 3.6, a)).join(""), detail: circ(0, 0, 1.6) + circ(1.2, 1.4, 0.9), dfill: true},
    // a blue dome on its drum
    greecedome: {d: half(0, 4, 8.6, 1.02) + "M-9.4 4H9.4V9.6H-9.4Z M-0.7 -10.6H0.7V-4.2H-0.7Z M-2.6 -8.8H2.6V-7.6H-2.6Z", detail: "M-5.6 9V6.6M0 9V6.6M5.6 9V6.6", dstroke: true}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // a bird in profile, head toward +x, painted with its wings at angle th (three poses make a flap)
  const BIRD = "M-11 -1.4L-5 -0.4C-3 -2.6 3 -2.6 5.6 -1.4A2.4 2.4 0 1 1 7 1C4 3.8 -3 4 -4.6 2L-11.2 2.2Z";
  const bird = (sp, th) => (g, c) => { const ln = sp.line || "rgba(40,50,70,.35)", body = sp.body || c, wp = new Path2D("M0.6 -1.2C-3 -2.6 -7.4 -2.4 -10.4 0C-7.4 1.2 -3 1.8 0.6 1.4Z"); g.scale(sp.k || 1, sp.k || 1); g.translate(sp.ox || 0, 0); g.lineCap = "round"; g.lineWidth = 0.3;
    const wing = (x, y, a, col, tip) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.fill(wp); g.save(); g.clip(wp); g.fillStyle = tip; g.fillRect(-11, -3, 4.4, 6); if (sp.bars) { g.fillStyle = sp.bars; g.fillRect(-5.4, -3, 0.9, 6); g.fillRect(-3.8, -3, 0.9, 6); } g.restore(); g.strokeStyle = ln; g.stroke(wp); g.restore(); };
    wing(1.4, -1.8, th + 0.25, mix(sp.wing || body, "#000000", 0.2), mix(sp.tip || sp.wing || body, "#000000", 0.2));
    g.fillStyle = sp.tail || body; g.beginPath(); g.moveTo(-5, -0.6); g.lineTo(-11, -1.6); g.lineTo(-11.2, 2.2); g.lineTo(-4.6, 2.2); g.closePath(); g.fill(); g.strokeStyle = ln; g.stroke(); if (sp.under) { g.fillStyle = sp.under; g.beginPath(); g.moveTo(-4.6, 1.2); g.lineTo(-7.4, 1.8); g.lineTo(-4.4, 2.8); g.fill(); }
    const bp = new Path2D(); bp.ellipse(-0.6, 0.6, 6.4, 3.1, -0.06, 0, 6.3); g.fillStyle = body; g.fill(bp); g.save(); g.clip(bp); g.fillStyle = sp.belly || body; g.fillRect(-8, 1.5, 16, 3); if (sp.bib) { g.fillStyle = sp.bib; oval(g, 5, 0.4, 2.8, 2.8); g.fill(); } g.restore(); g.strokeStyle = ln; g.stroke(bp);
    const nl = sp.neck || 0, hr = sp.hr || 2.3, hx = 4.8 + nl * 0.75, hy = -1.6 - nl * 0.6;
    if (nl) { g.strokeStyle = sp.head; g.lineWidth = 2.3; g.beginPath(); g.moveTo(3.4, -0.2); g.quadraticCurveTo(hx - 0.6, -0.4, hx, hy); g.stroke(); g.lineWidth = 0.3; }
    const [bl, bh, bc, bcol, btip] = sp.beak, bx = hx + hr * 0.7, bk = new Path2D(`M${bx - 0.6} ${hy - bh * 0.5}Q${bx + bl * 0.6} ${hy - bh * 0.5 + bc * 0.3} ${bx + bl} ${hy + bc}Q${bx + bl * 0.45} ${hy + bh * 0.5 + bc * 0.6} ${bx - 0.6} ${hy + bh * 0.5}Z`);
    g.fillStyle = bcol; g.fill(bk); if (btip) { g.save(); g.clip(bk); g.fillStyle = btip; g.fillRect(bx + bl * 0.74, hy - 6, 8, 12); g.restore(); } if (sp.bill) { g.fillStyle = "rgba(255,255,255,.35)"; g.save(); g.clip(bk); g.fillRect(bx - 1, hy - bh, bl + 2, bh * 0.45); g.restore(); }
    g.fillStyle = sp.head || body; oval(g, hx, hy, hr, hr * 0.92); g.fill(); g.strokeStyle = ln; g.stroke(); if (sp.cheek) { g.fillStyle = sp.cheek; oval(g, hx - 0.3, hy + 0.7, hr * 0.55, hr * 0.38, 0.4); g.fill(); }
    if (sp.ring) { g.fillStyle = sp.ring; oval(g, hx + hr * 0.3, hy - hr * 0.2, 0.95, 0.95); g.fill(); } g.fillStyle = sp.eye || "#1A1A22"; oval(g, hx + hr * 0.3, hy - hr * 0.2, 0.5, 0.5); g.fill();
    sheen(g, 0.24, 0.16); wing(0.4, -1.2, th, sp.wing || body, sp.tip || sp.wing || body); };
  const birdShapes = (name, sp) => [1.25, 0.3, -0.75].forEach((th, i) => { FX_SHAPES[name + i] = {d: BIRD, paint: bird(sp, th)}; });
  // a flock drawn by hand so the wings can really flap: each bird is {x, y, vx, vy, ay, t0, life, fr, ph, size, c}
  let flock = [];
  const flockDraw = base => (g, f, W, H, d) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
    flock.forEach(b => { const t = f - b.t0; if (t < 0 || t > b.life) return; const a = fxEase(t / 12) * fxEase((b.life - t) / 40); if (a <= 0.01) return;
      const w = Math.sin(t * b.fr + b.ph), vy = b.vy + b.ay * t, x = b.x + b.vx * t, y = b.y + b.vy * t + b.ay * t * t / 2 + w * (b.bob || 0.6) * sc, spr = fxSprite(base + (w > 0.4 ? 0 : w < -0.4 ? 2 : 1), b.c, b.glow || 0, d), s = b.size * sc / 10, h = spr._half * s, L = b.vx < 0;
      g.globalAlpha = a * (b.alpha || 1); g.save(); g.translate(x, y); g.rotate(L ? Math.atan2(-vy, -b.vx) : Math.atan2(vy, b.vx)); g.scale(L ? -1 : 1, 1); g.drawImage(spr, -h, -h, 2 * h, 2 * h); g.restore(); }); g.globalAlpha = 1; };
  birdShapes("greecedv", {wing: "#F4F6FA", tip: "#C8D0DC", beak: [2, 1, 0.3, "#D8A8A0"], line: "rgba(70,90,130,.4)", hr: 2.2});
  // bougainvillea: three papery magenta bracts around tiny cream flowers
  FX_SHAPES.greecebvg = {d: FX_SHAPES.greecebloom.d, paint: (g, c) => { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * 2.094 - 1.571); const gr = g.createLinearGradient(0, 0, 10, 0); gr.addColorStop(0, mix(c, "#FFFFFF", 0.3)); gr.addColorStop(1, c); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(2, -5.4, 8.6, -5.4, 10, 0); g.bezierCurveTo(8.6, 5.4, 2, 5.4, 0, 0); g.fill(); g.strokeStyle = mix(c, "#000000", 0.25); g.globalAlpha = 0.5; g.lineWidth = 0.35; g.beginPath(); g.moveTo(1, 0); g.lineTo(8.6, 0); g.moveTo(4.4, 0); g.lineTo(6.4, -2.2); g.moveTo(4.4, 0); g.lineTo(6.4, 2.2); g.stroke(); g.restore(); }
    g.fillStyle = "#FFF4D6"; [[0, -1.2], [1.1, 0.6], [-1.1, 0.6]].forEach(([x, y]) => { oval(g, x, y, 0.9, 0.9); g.fill(); }); }};
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "greece", name: "Greece", group: "world", desc: "White cave houses and blue domes on the caldera cliff above the Aegean.",
      light: ["#F1F6FB", "rgba(31,92,170,.10)", "#FFFFFF", "#13253D", "#4C5F77", "#D5E1EE", "#E5EEF7", "#F8FBFE", "#1F5CAA", "#3D7CC6", "#FFFFFF", "#163F7A", "#1B4E92", "#D0E0F4", "#FFE3A0"],
      dark: ["#0C1430", "rgba(242,184,102,.08)", "#141E42", "#EEF2FC", "#AEB8D6", "#2B3868", "#1F2A56", "#111A3A", "#F2B866", "#F6D08E", "#141C3A", "#7A5A34", "#121A3C", "#D4DAF0", "#6A5428"],
      glow: ["linear-gradient(180deg,#8EC9F0,#D8EEFA 45%,#FFF2DC)", "linear-gradient(180deg,#0E1838,#1D2A5A 45%,#6A3E62)"],
      spine: [lg("#2A64AE", "#173F7A"), lg("#1D2A5A", "#0E1838")], btn: [lg2("#1F5CAA", "#3B86C9"), lg2("#F2B866", "#F6D08E")]},
    kit: {motif: "greecedome", card: ["#FAFCFF", "#E4EEF8"], ink: "#13253D", bd: "#BCD2EA", mc: "#2F6DB8", r: 14, notes: ["#D6E6F8", "#FFF3B8", "#D9F0D8", "#FBD3E6", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { flock = Array.from({length: n(11)}, (_, i) => { const s = i % 2 ? 1 : -1; return {x: W * (0.5 + s * fxR(0.05, 0.3)), y: H + fxR(20, 60), vx: s * W / fxR(220, 340), vy: -fxR(2, 3), ay: 0.008, t0: Math.floor(i * 7 + fxR(0, 10)), life: 230, fr: fxR(0.22, 0.3), ph: fxR(0, 6.3), size: fxR(19, 26), c: d ? "#F4F2FF" : "#FFFFFF", glow: d ? 8 : 0}; });
      return fxFall(W, H, n(40), "greecebvg", d ? ["#E0559E", "#C84A8E", "#F08CC0"] : ["#D42A84", "#E255A2", "#C21C74"], {sway: 1.8, flip: true, smin: 9, smax: 13, vmin: 1, vmax: 1.8})
        .concat(fxTw(W, H, n(20), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFFFFF"], {smin: 3, smax: 6, glow: d ? 10 : 6})); },
      draw: flockDraw("greecedv")},
    tag: "Oia's white cave houses and blue domes stacked along the caldera cliff, a windmill on the rim, a mule path zig-zagging down to the harbour, bougainvillea and the famous sunset over the deep blue Aegean"
  });
})();
/* end of module 20-scenes-maj-greece.js */


