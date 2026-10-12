/* Theme Collections, new theme ideas batch n7: saltflats */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const hexP = (cx, cy, r, sy = 1) => Array.from({length: 6}, (_, i) => { const a = i * Math.PI / 3; return (i ? "L" : "M") + f1(cx + r * Math.cos(a)) + " " + f1(cy + r * Math.sin(a) * sy); }).join("") + "z";
  const puffP = (cx, cy, r, n, bump = 1.15) => { const p = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }; const br = r * Math.sin(Math.PI / n) * bump; let d = `M${f1(p(0)[0])} ${f1(p(0)[1])}`; for (let i = 1; i <= n; i++) { const q = p(i); d += `A${f1(br)} ${f1(br)} 0 0 1 ${f1(q[0])} ${f1(q[1])}`; } return d + "Z"; };

  /* ================= MIRROR FLATS ================= */
  TP_DATA.push({
    theme: "saltflats",
    pack: {name: "Mirror Sky Club", items: {
      salt_salty: `${lg("n7-ss-f", "#FFFFFF", "#E8E0F4")}
        <rect x="19" y="52" width="9" height="7" rx="2.5" fill="#E2D8F0" ${S2}/><rect x="36" y="52" width="9" height="7" rx="2.5" fill="#E2D8F0" ${S2}/>
        <path d="M46 20L54 12V44L46 54Z" fill="#D2C4EA" ${SO}/><path d="M14 20L22 12H54L46 20Z" fill="#FFFFFF" ${SO}/>
        <rect x="14" y="20" width="32" height="34" rx="3" fill="url(#n7-ss-f)" ${SO}/>
        ${EYES(24, 36, 35, 2.6)}${blush(19.5, 40.5, 40)}${smile(30, 40.5, 2.2, 1.8)}<path d="M18 25h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${spark(58, 8, 4, "#F6B8D0")}${spark(8, 12, 3, "#B8A0E8")}`,
      salt_mira: `${lg("n7-sm-b", "#F0FAFF", "#6EAEE6")}
        <ellipse cx="32" cy="58" rx="22" ry="3.4" fill="#C8DEF6" ${S2}/>
        <path d="M32 6C36 14 50 25 50 39C50 50 42 55 32 55C22 55 14 50 14 39C14 25 28 14 32 6Z" fill="url(#n7-sm-b)" ${SO}/>
        <path d="M16 43Q32 50 48 43Q46 52 32 53Q18 52 16 43Z" fill="#F6B8CE" opacity=".6"/>
        ${EYES(26, 38, 35, 2.6)}${blush(21, 43, 40)}${smile(32, 41, 2.2, 1.8)}${SHINE(23, 24, 2.6, 5, 25)}${spark(52, 10, 3.6, "#fff")}<path d="M52 6.4Q52 10 55.6 10Q52 10 52 13.6Q52 10 48.4 10Q52 10 52 6.4Z" fill="none" stroke="${O}" stroke-width="1"/>`,
      salt_blush: `${rg("n7-sb-b", "#FFF4F6", "#F2A2BC", .42, .32)}
        <circle cx="46" cy="18" r="9" fill="#FFD27A" ${S2}/><path d="M46 4v-2M57 9l2-2M60 18h2" stroke="#FFB43A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="${puffP(30, 36, 20, 9, 1.16)}" fill="url(#n7-sb-b)" ${SO}/>
        ${EYES(24, 36, 36, 2.5)}${blush(19, 41, 40.5)}${smile(30, 41, 2.2, 1.8)}<path d="M15 28Q19 22 25 21" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
      salt_mirror: `${lg("n7-sr-s", "#A9BCE4", "#FFE2C2")}${lg("n7-sr-w", "#FFE2C2", "#9AA8D8")}
        <circle cx="32" cy="32" r="26" fill="url(#n7-sr-s)"/><path d="M6 32A26 26 0 0 0 58 32Z" fill="url(#n7-sr-w)"/>
        <circle cx="38" cy="26" r="5.6" fill="#FFF6E2"/><circle cx="38" cy="38" r="5.6" fill="#FFEBD2" opacity=".85"/>
        <path d="M12 30Q16 24 22 27Q26 22 30 27H12Z" fill="#fff" opacity=".9"/><path d="M12 34Q16 40 22 37Q26 42 30 37H12Z" fill="#fff" opacity=".55"/>
        <path d="M8 32H56" stroke="#fff" stroke-width="1.6"/><path d="M14 44h8M36 48h10" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <circle cx="32" cy="32" r="26" fill="none" ${SO}/>`,
      salt_hex: `<path d="${hexP(32, 34, 26)}" fill="#FFFAF4" ${SO}/><path d="${hexP(32, 34, 19)}" fill="#EEE2E6" ${S15}/>
        <path d="M15 34L22.5 21H41.5L49 34" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${EYES(26, 38, 33, 2.6)}${blush(21, 43, 38)}${smile(32, 38, 2.2, 1.8)}${spark(55, 10, 3.6, "#F6B8D0")}${spark(9, 56, 2.6, "#B8A0E8")}`,
      salt_cone: `${lg("n7-sc-w", "#F2C2D0", "#A9BCE4")}
        <path d="M2 40H62V58Q62 62 58 62H6Q2 62 2 58Z" fill="url(#n7-sc-w)" ${S2}/>
        <path d="M8 40C11 29 20 20 32 20C44 20 53 29 56 40Z" fill="#FFF6EE" ${SO}/><path d="M32 20C24 22 18 30 17 40H8C11 29 20 20 32 20Z" fill="#E8D2E2"/>
        <path d="M10 42C13 50 22 56 32 56C42 56 51 50 54 42Z" fill="#F6E4EC" opacity=".55"/>
        ${EYES(27, 39, 31, 2.4)}${blush(22, 44, 35)}${smile(33, 35, 2, 1.6)}${spark(55, 12, 3.6, "#FFD8A8")}`,
      salt_reflect: `${T("REFLECT", 32, 30, 12, "#7650B0", 50)}<g transform="translate(0 64) scale(1 -1)" opacity=".38">${T("REFLECT", 32, 30, 12, "#C0628E", 50)}</g>
        <path d="M6 33.5H58" stroke="#9A78CC" stroke-width="1.6" stroke-linecap="round"/>${spark(57, 14, 3.6, "#F6B8D0")}${spark(7, 50, 2.6, "#B8A0E8")}`,
      salt_meteor: `<rect x="4" y="4" width="56" height="56" rx="14" fill="#141A44" ${SO}/><path d="M5.5 32H58.5" stroke="#8A88C0" stroke-width="1.2"/>
        <path d="M44 10L22 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M44 54L22 40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>
        ${spark(22, 24, 3.6, "#FFFFFF")}${spark(22, 40, 3, "#D8D0FF")}<circle cx="14" cy="12" r="1" fill="#fff"/><circle cx="14" cy="52" r=".9" fill="#fff" opacity=".6"/><circle cx="50" cy="22" r=".8" fill="#fff"/><circle cx="50" cy="42" r=".7" fill="#fff" opacity=".6"/>`
    }},
    pins: [
      {id: "tp-saltflats-hex", name: "Salt Hex Pin", kind: "badge", desc: "A tile of white salt crust with a little sparkle.",
        svg: `<svg viewBox="0 0 30 30"><path d="${hexP(15, 15, 12.5)}" fill="#FFFAF4" stroke="#6A5A8A" stroke-width="1.3"/><path d="${hexP(15, 15, 8.5)}" fill="#EEE2EC" stroke="#B8A8CC" stroke-width="1"/>${spark(19, 11, 2.4, "#F6B8D0")}</svg>`},
      {id: "tp-saltflats-sky", name: "Mirror Sky Washi", kind: "tape", desc: "Pastel sunset washi with clouds above and their reflections below.",
        svg: `<svg viewBox="0 0 86 26"><defs><linearGradient id="n7-pt-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9BCE4"/><stop offset=".5" stop-color="#FFE2C2"/><stop offset="1" stop-color="#A9BCE4"/></linearGradient></defs><path d="${tapeEdge}" fill="url(#n7-pt-s)" opacity=".95"/>
          ${[14, 40, 66].map(x => `<path d="M${x - 7} 12Q${x - 6} 8 ${x - 2} 9Q${x} 5 ${x + 4} 8Q${x + 8} 8 ${x + 8} 12Z" fill="#fff"/><path d="M${x - 7} 14Q${x - 6} 18 ${x - 2} 17Q${x} 21 ${x + 4} 18Q${x + 8} 18 ${x + 8} 14Z" fill="#fff" opacity=".5"/>`).join("")}
          <path d="M4 13H82" stroke="#fff" stroke-width=".8" opacity=".8"/></svg>`}
    ],
    card: {id: "tp-saltflats", name: "Mirror Sky", desc: "Pastel sunset paper that mirrors itself, with a cloud and its reflection in the corner and salt hexagons below. Starry violet in dark mode."}
  });
})();
