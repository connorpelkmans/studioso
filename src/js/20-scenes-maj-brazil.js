/* ===== module: 20-scenes-maj-brazil.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a monstera leaf
  const monstera = () => { const L = [], R = []; for (let i = 0; i <= 20; i++) { const t = i / 20, w = 10.4 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.85) * (1 - 0.12 * t), y = 10.6 - t * 21.2, cut = i > 3 && i < 18 && i % 4 === 1;
    L.push(`${r1(-w * (cut ? 0.22 : 1))} ${r1(y)}`); R.unshift(`${r1(w * (i > 3 && i < 18 && i % 4 === 3 ? 0.22 : 1))} ${r1(y)}`); } return `M${L.join("L")}L${R.join("L")}Z`; };
  Object.assign(FX_SHAPES, {
    brazilmonstera: {d: monstera(), detail: "M0 10.6L0 -9", dstroke: true},
    // Sugarloaf and Morro da Urca with the cable car's wire and a car on it
    brazilloaf: {d: "M-12 9C-12 4 -10 2 -8 1C-6 -1 -2 -1 -1 1L1 2C2 -4 3 -9 6 -10.4C9 -11 10 -6 10.6 -1C11 3 12 6 12.6 9Z", detail: "M-4 -1.6L5.4 -9.4 M1.2 -6.6V-4.6 M-0.4 -4.6H2.8V-2.6H-0.4Z", dstroke: true},
    // a toco toucan's head and its great orange beak
    braziltoucan: {d: "M-10 6C-12 -2 -8 -8 -2 -8C1 -8 3 -7 4 -6C8 -7 12 -6 12.6 -3C12.8 -1.6 12 -1 11 -1.4C8 -2 6 -1.6 4 -1C3 4 0 9 -4 10C-7 10.6 -9 9 -10 6Z", detail: circ(-1.6, -3.6, 2) + "M4 -6C8 -7 12 -6 12.6 -3C12.8 -1.6 12 -1 11 -1.4C8 -2 6 -1.6 4 -1Z", dfill: true},
    // a coconut with a straw and a little cocktail umbrella
    braziloco: {d: circ(0, 3, 8.4), detail: "M2 -4L6 -11 M-6 -6L1 -9.4L-3 -12Z", dstroke: true},
    // a piece of samba confetti
    brazilconf: {d: "M-5 -2.6H5V2.6H-5Z"}
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
  birdShapes("braziltc", {body: "#1A1A22", belly: "#1A1A22", wing: "#24242C", tip: "#121218", tail: "#1A1A22", under: "#E8302A", bib: "#FFF2C8", head: "#1A1A22", hr: 2.6, beak: [8.2, 3.4, 0.8, "#F7931E", "#1A1A22"], ring: "#5AB0F0", eye: "#101010", bill: true, k: 0.76, ox: -2, line: "rgba(255,255,255,.22)"});
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "brazil", name: "Brazil", group: "world", desc: "Christ the Redeemer, a colourful favela and Sugarloaf over a golden beach.",
      light: ["#F5FAF5", "rgba(19,128,78,.10)", "#FFFFFF", "#163026", "#4C6A5C", "#D2E6D8", "#E4F2E8", "#FAFDFA", "#13804E", "#2FA06A", "#FFFFFF", "#0C5A36", "#11603E", "#CDEBD8", "#FFE3A0"],
      dark: ["#0E1534", "rgba(255,210,74,.08)", "#17204A", "#F2F2FA", "#B4B8D6", "#2C3870", "#222C5E", "#121A3E", "#FFD24A", "#FFE08A", "#0C1838", "#7A6232", "#0C1838", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#7CC6F0,#D4EEF8 45%,#FCE8C4)", "linear-gradient(180deg,#0C1838,#1E2C5E 45%,#6A3A5E)"],
      spine: [lg("#1E8A5A", "#11603E"), lg("#1E2C5E", "#0C1838")], btn: [lg2("#13804E", "#E8A21E"), lg2("#FFD24A", "#7FE0A0")]},
    kit: {motif: "brazilmonstera", card: ["#FBFEF9", "#E8F6EA"], ink: "#163026", bd: "#BFE0C8", mc: "#E8A21E", r: 16, notes: ["#FFE9A8"].concat(NOTES), shape: "rounded", pin: "starpin", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => { flock = Array.from({length: n(4)}, (_, i) => { const s = i % 2 ? -1 : 1; return {x: s > 0 ? -70 : W + 70, y: H * (0.18 + 0.5 * (i + fxR(0.2, 0.8)) / n(4)), vx: s * W / fxR(200, 240), vy: -fxR(0, 0.3), ay: 0, t0: Math.floor(i * 18 + fxR(0, 10)), life: 300, fr: fxR(0.2, 0.26), ph: fxR(0, 6.3), bob: 1.2, size: fxR(24, 30), c: d ? "#FFD24A" : "#1A1A22", glow: d ? 10 : 0}; });
      return fxFall(W, H, n(64), "brazilconf", d ? ["#4ADE7A", "#FFD24A", "#5A9AF0", "#FF7AB4", "#FFA24A", "#B07AF0"] : ["#1FA34A", "#FFC81E", "#2A6FD6", "#FF5FA2", "#FF8A2A", "#9A4FD6"], {sway: 2, flip: true, smin: 7, smax: 10, vmin: 1.4, vmax: 2.6})
        .concat(fxBurst(W, H, n(10), "brazilmonstera", d ? ["#3A9A5A", "#5ABA6A"] : ["#2E8A3E", "#4EAA48"], [[0.08, 1.02], [0.92, 1.02]], {smin: 13, smax: 18}).map(p => Object.assign(p, {vx: p.vx * 0.7, vy: p.vy * 0.8, g: 0.15, term: fxR(1.6, 2.2), vr: fxR(-0.05, 0.05), life: 280})),
          fxTw(W, H, n(18), "sparkle", d ? ["#FFE6A6", "#FFFFFF"] : ["#FFC81E", "#FFFFFF"], {smin: 3, smax: 7, glow: d ? 10 : 6})); },
      len: 300, draw: flockDraw("braziltc")},
    tag: "Christ the Redeemer on Corcovado above a dense hillside favela of bright little houses and the towers of downtown, Sugarloaf and its glass bondinho cable cars over the bay, and a golden beach with umbrellas, towels, a coconut kiosk, palms, the waving Brazilian flag and a toucan in the rainforest"
  });
})();
/* end of module 20-scenes-maj-brazil.js */


