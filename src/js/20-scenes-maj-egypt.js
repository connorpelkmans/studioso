/* ===== module: 20-scenes-maj-egypt.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // the Great Pyramid with its courses
    egyptpyr: {d: "M0 -10L11.5 8.6H-11.5Z", detail: "M-3.8 -3.8H3.8M-6.3 0.3H6.3M-8.8 4.4H8.8M0 -10L2.4 8.6", dstroke: true},
    // a blue lotus flower opening on its pad
    egyptlotus: {d: "M0 6C-2.2 2 -2.2 -4 0 -10C2.2 -4 2.2 2 0 6Z M-0.4 6C-4.6 4.6 -8.4 -0.6 -8.6 -6.4C-4.4 -4.4 -1.4 -0.4 -0.4 6Z M0.4 6C4.6 4.6 8.4 -0.6 8.6 -6.4C4.4 -4.4 1.4 -0.4 0.4 6Z M-10 7.4Q0 3.6 10 7.4Q0 10.6 -10 7.4Z", detail: "M0 4V-6M-1.6 4.6Q-5 1 -6.4 -3.6M1.6 4.6Q5 1 6.4 -3.6", dstroke: true},
    // an ibis in flight
    egyptibis: {d: "M-9 1C-6 -1.4 2 -1.6 4.6 -0.6L8.4 -1.8Q10.8 -2.2 11.8 0.8L11.2 1.2Q10.2 -0.4 8.6 -0.2L5 1.6C1.6 3 -4.6 3 -9 1Z M-3.4 -0.6L-6.6 -10L-1.6 -9.2L2.4 -0.8Z M-11.6 1.6L-8 0.6L-7.6 2.2Z"},
    // a scarab beetle seen from above
    egyptscarab: {d: ell(0, 2, 6.4, 7.6) + ell(0, -6.8, 3.8, 2.6) + "M-2.4 -9.4L-4 -11.6L-1.4 -9.8Z M2.4 -9.4L4 -11.6L1.4 -9.8Z M-6 -1L-10 -3.4L-9.6 -2L-6 0.4Z M6 -1L10 -3.4L9.6 -2L6 0.4Z M-6 3.6L-10.4 3.4L-10 4.6L-5.8 5Z M6 3.6L10.4 3.4L10 4.6L5.8 5Z M-4.6 7.4L-8 10.6L-6.8 11L-3.6 8.6Z M4.6 7.4L8 10.6L6.8 11L3.6 8.6Z", detail: "M0 -4.4V9.4M-5.6 -2.4Q0 -5.2 5.6 -2.4", dstroke: true},
    // a papyrus umbel
    egyptpapy: {d: "M0 11V-1" + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = -Math.PI * (0.04 + 0.92 * i / 8), c = Math.cos(a), s = Math.sin(a); return `M0 -1Q${r1(c * 5)} ${r1(-1 + s * 6)} ${r1(c * 9.6)} ${r1(-1 + s * 9.6 + 3 * c * c)}`; }).join(""), stroke: true, lw: 1.3},
    // a felucca's lateen sail on its hull
    egyptsail: {d: "M5.4 6.4L-6.6 -11.4Q-1.6 -2.6 -5 5.2Q0.4 4.4 5.4 6.4Z M-9.6 7.2H9.6L7.6 10.4H-7.6Z", detail: "M5.6 6.6L-7.4 -12.4M0.6 6L-0.4 -8.6", dstroke: true},
    // the low sun with short rays
    egyptsun: {d: circ(0, 0, 5.6) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = i / 10 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return pts([[c * 7 - s * 1.2, s * 7 + c * 1.2], [c * 11, s * 11], [c * 7 + s * 1.2, s * 7 - c * 1.2]]); }).join(""), detail: circ(0, 0, 3.4), dfill: true}
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
  birdShapes("egyptib", {body: "#FFFFFF", wing: "#F6F3EE", tip: "#1E1A1C", tail: "#2A2426", head: "#1E1A1C", neck: 3.6, hr: 1.7, beak: [6.4, 0.9, 2.8, "#2A2224"], k: 0.74, ox: -2.4, line: "rgba(70,56,40,.45)"});
  // a blue water lily opening above its pad
  FX_SHAPES.egyptlily = {d: FX_SHAPES.egyptlotus.d, paint: (g, c) => { g.fillStyle = "#4E9A5A"; g.beginPath(); g.moveTo(-10, 7.4); g.quadraticCurveTo(0, 3.6, 10, 7.4); g.quadraticCurveTo(0, 10.6, -10, 7.4); g.fill();
    [[-1.05, 9.6, 0.82], [1.05, 9.6, 0.82], [-0.55, 12.6, 1], [0.55, 12.6, 1], [0, 15, 1.08]].forEach(([a, L, k]) => { g.save(); g.translate(0, 6); g.rotate(a); const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, "#F6E2A0"); gr.addColorStop(0.35, mix(c, "#FFFFFF", 0.35)); gr.addColorStop(1, mix(c, "#000000", 0.12 * (2 - k)));
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-3, -L * 0.35, -1.8, -L * 0.8, 0, -L); g.bezierCurveTo(1.8, -L * 0.8, 3, -L * 0.35, 0, 0); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 0.3; g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -L * 0.8); g.stroke(); g.restore(); });
    g.fillStyle = "#F2C24A"; oval(g, 0, 5.2, 2, 1); g.fill(); }};
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "egypt", name: "Egypt", group: "world", desc: "The pyramids at golden hour above the Nile.",
      light: ["#FBF5EA", "rgba(176,100,28,.10)", "#FFFFFF", "#2A2216", "#6E604C", "#ECDDC4", "#F5EBDA", "#FDFAF4", "#B0641C", "#C98A3E", "#FFFFFF", "#7A4214", "#1D3D6A", "#E6EEF8", "#FFE3A0"],
      dark: ["#0E1230", "rgba(242,196,98,.08)", "#171B40", "#F6F0E2", "#BDB4CF", "#2C3062", "#22275A", "#131736", "#F2C462", "#F7DC94", "#1A1838", "#7A6232", "#14163A", "#D8D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#9CCBEA,#F4E6C6 45%,#F6C98A)", "linear-gradient(180deg,#0C1232,#1E2050 45%,#4E3260)"],
      spine: [lg("#2F5E96", "#1D3D6A"), lg("#2A2E66", "#14163A")], btn: [lg2("#B0641C", "#D9962E"), lg2("#F2C462", "#F7DC94")]},
    kit: {motif: "egyptpyr", card: ["#FFFAF0", "#F6E6CC"], ink: "#2A2216", bd: "#E8D0A8", mc: "#B0641C", r: 12, notes: ["#F6E2BC", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { const k = n(7), sp = W / 250, y0 = H * fxR(0.14, 0.24); flock = Array.from({length: k}, (_, i) => ({x: -60 - i * W * 0.07 - fxR(0, 20), y: y0 + i * H * 0.045 + fxR(-8, 8), vx: sp * fxR(0.96, 1.04), vy: -fxR(0.1, 0.35), ay: 0, t0: Math.floor(fxR(0, 8)), life: 330, fr: fxR(0.17, 0.21), ph: fxR(0, 6.3), size: fxR(20, 26), c: "#FFFFFF", glow: d ? 6 : 0}));
      return fxFall(W, H, n(22), "egyptlily", d ? ["#8EA8FF", "#B4C4FF", "#7A90F0"] : ["#3E6FC6", "#5A8CE0", "#4A78D0"], {sway: 1.4, smin: 11, smax: 15, vmin: 0.8, vmax: 1.5, rock: 0.4})
        .concat(fxTw(W, H, n(34), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#F2C462"] : ["#E0A040", "#F2B53A", "#FFFFFF"], {smin: 3, smax: 7, glow: d ? 10 : 6})); },
      len: 300, draw: flockDraw("egyptib")},
    tag: "The pyramids of Giza and the Sphinx at golden hour, above the Nile with its palms, papyrus and a white-sailed felucca"
  });
})();
/* end of module 20-scenes-maj-egypt.js */


