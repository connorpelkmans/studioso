/* ===== module: 20-scenes-maj-france.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  Object.assign(FX_SHAPES, {
    // the tower: legs, the arch, two platforms and the mast, with its lattice as the detail
    franceeiffel: {d: "M-9.4 11L-5.6 3.6L-6.6 3.6L-6.6 2.2L-3.6 2.2L-2.4 -2.6L-3.4 -2.6L-3.4 -3.8L-1.6 -3.8L-0.7 -9.6L-0.4 -12.4L0.4 -12.4L0.7 -9.6L1.6 -3.8L3.4 -3.8L3.4 -2.6L2.4 -2.6L3.6 2.2L6.6 2.2L6.6 3.6L5.6 3.6L9.4 11L6.6 11Q5 6.8 0 6Q-5 6.8 -6.6 11Z",
      detail: "M-4.6 3.6L-2.2 -2.6M4.6 3.6L2.2 -2.6M-1.4 -3.8L1.2 -9M1.4 -3.8L-1.2 -9M-7.4 9L-4 3.6M7.4 9L4 3.6", dstroke: true},
    francecroissant: {d: "M-11 3Q-12 -1 -8 -3Q-4 -7 0 -7Q4 -7 8 -3Q12 -1 11 3Q8 1 6 2Q3 -1 0 -1Q-3 -1 -6 2Q-8 1 -11 3Z",
      detail: "M-6 2Q-5 -3 -3 -5M0 -1V-7M6 2Q5 -3 3 -5", dstroke: true},
    francemacaron: {d: ell(0, -4, 9.4, 4.4) + ell(0, 4, 9.4, 4.4) + "M-9 -1.4H9V1.4H-9Z", detail: "M-8.6 0Q-6 1.6 -3.6 0Q-1.2 1.6 1.2 0Q3.6 1.6 6 0Q7.6 1.2 8.6 0", dstroke: true},
    francechestnut: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + (i - 2) * 0.62, L = 10 - Math.abs(i - 2) * 1.6, cx = Math.cos(a) * L * 0.55, cy = 4 + Math.sin(a) * L * 0.55, c = Math.cos(a), s = Math.sin(a), rx = L * 0.52, ry = L * 0.2;
        return pts(Array.from({length: 14}, (_, k) => { const t = k / 14 * Math.PI * 2; return [cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c]; })); }).join(""),
      detail: "M0 4L0 11", dstroke: true},
    francelamp: {d: "M-1 11V-2H1V11Z M-4.6 -2L-5.4 -9H5.4L4.6 -2Z M-6 -9L0 -13.4L6 -9Z", detail: circ(0, -5.6, 2.2), dfill: true}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // a macaron from the side: two domed shells with ruffled feet and a cream filling
  Object.assign(FX_SHAPES, {
    francemac: {d: ell(0, -4, 9.4, 4.4) + ell(0, 4, 9.4, 4.4) + "M-9 -1.4H9V1.4H-9Z", paint: (g, c) => { const dk = mix(c, "#000000", 0.18), fill = c === "#B98A6A" ? "#5A3A2A" : mix(c, "#FFF8EE", 0.75);
      const shell = (y0, up) => { g.fillStyle = c; g.beginPath(); g.moveTo(-9.6, y0); g.bezierCurveTo(-9.6, y0 + (up ? -7 : 5.6), 9.6, y0 + (up ? -7 : 5.6), 9.6, y0); g.closePath(); g.fill(); g.fillStyle = mix(c, "#FFFFFF", 0.22); for (let x = -8.8; x <= 8.8; x += 1.3) { oval(g, x, y0 + (up ? 0.4 : -0.4), 0.8, 0.75); g.fill(); } };
      shell(2.4, false); g.fillStyle = fill; g.beginPath(); g.moveTo(-8.8, -1.6); g.quadraticCurveTo(-9.6, 0.4, -8.8, 2.4); g.lineTo(8.8, 2.4); g.quadraticCurveTo(9.6, 0.4, 8.8, -1.6); g.closePath(); g.fill(); shell(-1.6, true);
      sheen(g, 0.36, 0.2); g.fillStyle = "rgba(255,255,255,.5)"; oval(g, -3.6, -5.2, 3, 0.8, -0.12); g.fill(); g.strokeStyle = dk; g.globalAlpha = 0.25; g.lineWidth = 0.3; g.beginPath(); g.moveTo(-9, 2.4); g.lineTo(9, 2.4); g.stroke(); }}
  });
  // The tower rises into view at the side and does its famous hourly sparkle: hundreds of little lights flicker all over
  // its lattice while (at night) the beacon at the top sweeps the sky. The tower is drawn once into its own canvas.
  const twr = {};
  const hw = u => u > 0.93 ? 0.006 : 0.27 * Math.pow(1 - u, 2.4) + 0.011;
  const towerDraw = (g, f, W, H, d) => { const a = fxEase(f / 40) * fxOut(f, 195, 265); if (a <= 0) return; const ph = W < H, Ht = H * (ph ? 0.42 : 0.66), cx = W * (ph ? 0.76 : 0.8), by = H + 2 + (1 - fxEase(f / 60)) * Ht * 0.3, key = Math.round(Ht) + (d ? "d" : "l");
    const T = twr[key] || (twr[key] = (() => { for (const k in twr) delete twr[k]; const c = document.createElement("canvas"), w = Math.ceil(Ht * 0.62), sc = 2; c.width = w * sc; c.height = Math.ceil(Ht * 1.02) * sc; const t = c.getContext("2d"), col = d ? "#D9A050" : "#5A3E2A", ax = hw(0) * 0.6, ay = 0.105;
      t.scale(sc, sc); t.translate(w / 2, Ht * 1.01); t.scale(Ht, Ht); const out = new Path2D(); for (let u = 0; u <= 1.0001; u += 0.01) out.lineTo(-hw(u), -u); for (let u = 1; u >= -0.0001; u -= 0.01) out.lineTo(hw(u), -u); out.closePath();
      t.fillStyle = col; t.globalAlpha = 0.42; t.fill(out); t.globalAlpha = 1; t.save(); t.clip(out); t.strokeStyle = col; t.lineWidth = 0.004; t.beginPath(); for (let k = -1; k <= 1; k += 0.022) { t.moveTo(k - 0.5, 0); t.lineTo(k + 0.5, -1); t.moveTo(k + 0.5, 0); t.lineTo(k - 0.5, -1); } t.stroke(); t.restore();
      t.lineWidth = 0.009; t.lineJoin = "round"; t.strokeStyle = col; t.stroke(out); t.fillStyle = col; [[0.115, 1.12, 0.022], [0.42, 1.18, 0.016], [0.86, 1.6, 0.012]].forEach(([u, k, h]) => t.fillRect(-hw(u) * k, -u - h / 2, 2 * hw(u) * k, h));
      t.globalCompositeOperation = "destination-out"; t.beginPath(); t.ellipse(0, 0, ax, ay, 0, Math.PI, 0); t.fill(); t.globalCompositeOperation = "source-over"; t.lineWidth = 0.008; t.beginPath(); t.ellipse(0, 0, ax, ay, 0, Math.PI, 0); t.stroke();
      const L = []; while (L.length < 240) { const u = 0.02 + Math.random() * 0.94, x = (Math.random() * 2 - 1) * hw(u) * 0.92; if (u < ay && Math.abs(x) < ax * Math.sqrt(Math.max(0, 1 - (u / ay) ** 2)) + 0.01) continue; L.push([x, u, Math.random() * 6.3, 0.16 + Math.random() * 0.14, Math.random()]); }
      const dot = document.createElement("canvas"); dot.width = dot.height = 32; const q = dot.getContext("2d"), gr = q.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(0.18, d ? "rgba(255,246,220,.95)" : "rgba(255,240,190,1)"); gr.addColorStop(0.45, d ? "rgba(255,226,160,.35)" : "rgba(255,200,90,.45)"); gr.addColorStop(1, "rgba(255,220,140,0)"); q.fillStyle = gr; q.fillRect(0, 0, 32, 32);
      return {c, w, L, dot}; })());
    g.globalAlpha = a * (d ? 0.85 : 0.8); g.drawImage(T.c, cx - T.w / 2, by - Ht * 1.01, T.w, T.c.height / 2);
    const top = by - Ht, on = fxEase((f - 45) / 25) * a;
    if (d && on > 0) { g.globalCompositeOperation = "lighter"; [0, Math.PI].forEach(o => { const t = f * 0.022 + o + 0.6, L = Math.max(W, H) * 0.6, gx = Math.cos(t) * L, gy = -Math.abs(Math.sin(t)) * L * 0.5 - L * 0.12, gr = g.createLinearGradient(cx, top, cx + gx, top + gy); gr.addColorStop(0, "rgba(255,236,190,.16)"); gr.addColorStop(1, "rgba(255,236,190,0)");
      g.globalAlpha = on; g.fillStyle = gr; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx + gx - gy * 0.06, top + gy + gx * 0.06); g.lineTo(cx + gx + gy * 0.06, top + gy - gx * 0.06); g.closePath(); g.fill(); }); }
    if (on > 0) { g.globalCompositeOperation = d ? "lighter" : "source-over"; const r = Math.max(3, Ht * 0.014);
      for (const [x, u, p, sp, k] of T.L) { const v = Math.sin(f * sp + p); if (v < 0.5) continue; const e = Math.pow((v - 0.5) / 0.5, 2), s = r * (0.7 + 0.6 * k) * (0.6 + 0.6 * e); g.globalAlpha = on * e; g.drawImage(T.dot, cx + x * Ht - s, by - u * Ht - s, 2 * s, 2 * s); }
      g.globalAlpha = on * (0.6 + 0.4 * Math.sin(f * 0.1)); const s = r * 3; g.drawImage(T.dot, cx - s, top - s, 2 * s, 2 * s); }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; };
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "france", name: "Paris", group: "world", desc: "The Eiffel Tower, the Seine and flower-boxed Haussmann rooftops.",
      light: ["#F5F1EA", "rgba(46,62,102,.10)", "#FFFFFF", "#1F2A3C", "#5E6676", "#E4DDD2", "#EFE9E0", "#FCFAF6", "#B8403A", "#CC6A5A", "#FFFFFF", "#7A2420", "#2E3E66", "#D6DFEE", "#FFE3A0"],
      dark: ["#10142E", "rgba(242,196,106,.08)", "#191E40", "#F4F0FA", "#B8B4D4", "#2E3462", "#242A56", "#151A38", "#F2C46A", "#F6D892", "#161A3A", "#7A6232", "#141834", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#B9D6EE,#E9F1F6 45%,#F6E4D6)", "linear-gradient(180deg,#121A36,#263258 45%,#5A4468)"],
      spine: [lg("#3A4E7A", "#24345A"), lg("#2A3060", "#141834")], btn: [lg2("#B8403A", "#D9704E"), lg2("#F2C46A", "#F6D892")]},
    kit: {motif: "franceeiffel", card: ["#FFFCF6", "#F1EADF"], ink: "#1F2A3C", bd: "#E2D6C2", mc: "#B8403A", r: 14, notes: ["#F9D6DE", "#FFF1B8", "#D8EDD2", "#D6E4FA", "#EADCF8", "#FFE0C4"], shape: "folded", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(18), "petal", d ? ["#F7A8C0", "#FFD0DE", "#E8789E"] : ["#E86A8E", "#F4A2BC", "#D84A72"], {sway: 1.7, flip: true, smin: 9, smax: 13, spread: 90}).map(p => Object.assign(p, {delay: p.delay + 30}))
      .concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFFFFF", "#FFF4D0", "#FFE3A8"] : ["#E8B04A", "#F2C46A"], {top: 0.7, smin: 3, smax: 6, glow: d ? 12 : 6, spread: 150})), draw: towerDraw},
    tag: "The Eiffel Tower over the Seine and flower-boxed Haussmann rooftops, with tricolour flags, a stone bridge, booksellers' stalls, a cafe and a flower cart on the quay"
  });
})();
/* end of module 20-scenes-maj-france.js */


