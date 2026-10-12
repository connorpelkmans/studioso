/* Theme Collections, Around the World: netherlands (Netherlands) */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  // a tulip cup at (x, y) (its base), w wide
  const cup = (x, y, w, fill, sw = 1.6) => { const h = w * 1.05, p = [[-.5, 0], [-.54, -.5], [-.41, -1], [-.22, -.62], [0, -1.08], [.22, -.62], [.41, -1], [.54, -.5], [.5, 0]]; return `<path d="M${p.map(q => `${f1(x + q[0] * w)} ${f1(y + q[1] * h)}`).join("L")}Q${x} ${f1(y + h * .45)} ${f1(x - w * .5)} ${y}Z" fill="${fill}" ${SOw(sw)}/>`; };
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // four lattice sails at angle a around (cx, cy), length L
  const sails = (cx, cy, L, a, cloth) => [0, 1, 2, 3].map(k => { const t = a + k * Math.PI / 2, c = Math.cos(t), s = Math.sin(t), P = (r, n) => `${f1(cx + c * r - s * n)} ${f1(cy + s * r + c * n)}`;
    return `<path d="M${P(-2, -1)}L${P(L, -1)}L${P(L, 1)}L${P(-2, 1)}Z" fill="#6A4A34" ${SOw(1.4)}/><path d="M${P(4, 1)}L${P(L, 1)}L${P(L, L * .26)}L${P(4, L * .26)}Z" fill="${cloth}" ${SOw(1.4)}/><path d="M${P(4 + (L - 4) / 3, 1)}L${P(4 + (L - 4) / 3, L * .26)}M${P(4 + (L - 4) * 2 / 3, 1)}L${P(4 + (L - 4) * 2 / 3, L * .26)}" stroke="#8A6A50" stroke-width="1"/>`; }).join("");

  TP_DATA.push({
    theme: "netherlands",
    pack: {name: "Dutch Delights", items: {
      netherlands_windmill: `${lg("nl-tp-wm", "#6A5A5E", "#3E3438")}
        <path d="M22 60L26 26H38L42 60Z" fill="url(#nl-tp-wm)" ${SO}/>
        <path d="M18 60H46V54H18Z" fill="#B0503A" ${S2}/><path d="M28 60V50Q32 46 36 50V60Z" fill="#F6F0E2" ${SOw(1.6)}/>
        <path d="M23 26Q24 16 32 15Q40 16 41 26Z" fill="#4E4246" ${S2}/><rect x="22" y="25" width="20" height="3" rx="1" fill="#F6F0E2" ${SOw(1.4)}/>
        ${sails(32, 21, 21, 0.5, "#FFF6E4")}
        <circle cx="32" cy="21" r="3.4" fill="#3A302C" ${S2}/>
        <circle cx="28" cy="37" r="1.8" fill="#fff"/><circle cx="36" cy="37" r="1.8" fill="#fff"/><circle cx="28.4" cy="37.2" r="1" fill="${O}"/><circle cx="36.4" cy="37.2" r="1" fill="${O}"/>${smile(32, 41, 1.8, 1.5)}
        ${spark(57, 52, 3.4, "#FFD86B")}`,
      netherlands_tulip: `${lg("nl-tp-tu", "#FF8A96", "#D8283A")}
        ${tube("M32 60Q33 50 32 40", "#4E9A4E", 3.4)}
        <path d="M32 56C24 56 16 50 13 40C22 39 29 46 32 52Z" fill="#6AB45A" ${S2}/><path d="M32 52C40 50 47 43 50 34C41 35 34 41 32 48Z" fill="#6AB45A" ${S2}/>
        ${cup(32, 38, 30, "url(#nl-tp-tu)", 2.5)}
        ${EYES(26, 38, 28, 2.4)}${blush(22, 42, 32)}${smile(32, 31.4, 2.2)}
        <path d="M21 22Q22 17 25 16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
        ${spark(10, 12, 3.4, "#FFD86B")}${spark(55, 18, 2.6, "#FF9AB8")}`,
      netherlands_clog: `${lg("nl-tp-cl", "#FFE29A", "#D8962E")}
        <path d="M6 40C6 34 10 32 16 32H34C40 32 42 36 44 38C50 41 58 42 60 48C62 54 58 58 50 58H14C8 58 6 54 6 48Z" fill="url(#nl-tp-cl)" ${SO}/>
        <path d="M12 37C13 35 16 34 19 34H33C35 34 37 35 37 37C37 39 34 40 30 40H17C14 40 12 39 12 37Z" fill="#5A3416" ${SOw(1.6)}/>
        <path d="M9 44Q30 47 46 42" fill="none" stroke="#2F5E9E" stroke-width="2.6" stroke-linecap="round"/>
        ${cup(50, 48, 7, "#E8384A", 1.2)}<path d="M50 49V54M50 52Q46 51 45 49" fill="none" stroke="#3E8A4E" stroke-width="1.4" stroke-linecap="round"/>
        ${tube("M24 33Q23 22 26 12", "#4E9A4E", 2.4)}${cup(26, 14, 11, "#F7C925", 1.8)}
        ${EYES(22, 32, 49, 2.2)}${blush(18, 36, 53, 2.2, 1.4)}${smile(27, 52.6, 2)}`,
      netherlands_stroopwafel: `${rg("nl-tp-sw", "#F8CC7A", "#C07A2E", .4, .35)}
        <circle cx="32" cy="32" r="26" fill="url(#nl-tp-sw)" ${SO}/>
        <g stroke="#A8642A" stroke-width="1.4" opacity=".5">${[-15, -9, -3, 3, 9, 15].map(k => `<path d="M${f1(32 + k - 14)} ${f1(32 - k - 14)}L${f1(32 + k + 14)} ${f1(32 - k + 14)}"/><path d="M${f1(32 + k - 14)} ${f1(32 + k + 14)}L${f1(32 + k + 14)} ${f1(32 + k - 14)}"/>`).join("")}</g>
        <circle cx="32" cy="32" r="21" fill="none" stroke="#A8642A" stroke-width="1.5" opacity=".7"/>
        <path d="M7 29Q32 26 57 29" fill="none" stroke="#8A4A18" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M20 58Q21 63 19 64Q17 62 18 57Z" fill="#9A541C" ${SOw(1.2)}/>
        <path d="M14 18Q19 11 28 9" fill="none" stroke="#FFF0C8" stroke-width="2.6" stroke-linecap="round"/>
        ${EYES(25, 39, 37, 2.4)}${blush(20, 44, 42)}${smile(32, 41, 2.4)}`,
      netherlands_bike: `<g fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="16" cy="44" r="11"/><circle cx="48" cy="44" r="11"/>
          <path d="M16 44L28 44L22 28M16 44L22 28H42M28 44L42 28M48 44L42 28L40 22M36 22H44M20 25H26"/></g>
        <g fill="none" stroke="#2F5E9E" stroke-width="1.4" stroke-linecap="round"><circle cx="16" cy="44" r="11"/><circle cx="48" cy="44" r="11"/><path d="M16 44L28 44L22 28M16 44L22 28H42M28 44L42 28M48 44L42 28"/></g>
        <path d="M44 22H58L56 30H46Z" fill="#C8955A" ${S2}/><path d="M46 25H56M47 28H55" stroke="#8A5A30" stroke-width="1"/>
        ${cup(48, 21, 6, "#E8384A", 1.2)}${cup(54, 20, 6, "#F7C925", 1.2)}${cup(51, 17, 6, "#F38AB2", 1.2)}
        <circle cx="16" cy="44" r="2" fill="${O}"/><circle cx="48" cy="44" r="2" fill="${O}"/>
        ${spark(8, 14, 3, "#FFD86B")}`,
      netherlands_house: `${lg("nl-tp-hs", "#C8644A", "#9A3E2E")}
        <path d="M14 60V24H18V18H22V12H28V6H36V12H42V18H46V24H50V60Z" fill="url(#nl-tp-hs)" ${SO}/>
        <path d="M14 24H18M18 18H22M22 12H28M36 12H42M42 18H46M46 24H50" stroke="#F6F0E2" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="29" y="10" width="6" height="7" rx="1" fill="#3E4C60" stroke="#F6F0E2" stroke-width="1.6"/>
        <rect x="19" y="28" width="9" height="11" rx="1" fill="#3E4C60" stroke="#F6F0E2" stroke-width="2"/><rect x="36" y="28" width="9" height="11" rx="1" fill="#3E4C60" stroke="#F6F0E2" stroke-width="2"/>
        <path d="M27 60V50Q32 45 37 50V60Z" fill="#2E5A4E" ${SOw(1.6)}/>
        <path d="M32 6L32 3M30.5 8.5L35 8.5" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${EYES(26.5, 37.5, 44, 1.9)}${blush(22, 42, 47, 2, 1.3)}
        ${spark(58, 12, 3.2, "#FFD86B")}${spark(6, 30, 2.4, "#9CC8F0")}`,
      netherlands_cheese: `${lg("nl-tp-ch", "#FFE27A", "#F2B42E")}
        <path d="M32 32L32 8A24 24 0 1 0 52.8 20Z" fill="url(#nl-tp-ch)" ${SO}/>
        <path d="M32 8A24 24 0 1 0 52.8 20" fill="none" stroke="#E8384A" stroke-width="3.4" opacity=".85"/>
        <circle cx="22" cy="24" r="2" fill="#E8A82A" opacity=".6"/><circle cx="44" cy="50" r="1.6" fill="#E8A82A" opacity=".6"/>
        ${EYES(24, 38, 40, 2.3)}${blush(19, 43, 44.4, 2.2, 1.4)}${smile(31, 43.6, 2.1)}
        <path d="M14 30Q15 22 21 17" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
        ${spark(10, 10, 3.2, "#FFD86B")}`,
      netherlands_badge: `${lg("nl-tp-bd", "#3E6EAE", "#1E3E70")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#nl-tp-bd)" ${SO}/>
        ${cup(52, 20, 10, "#F5862A", 1.6)}
        ${T("GOED", 26, 30, 10, "#FFD08A", 28)}${T("ZO!", 30, 42.5, 12, "#FFFFFF", 26)}
        ${spark(9, 10, 3.4, "#FFD86B")}${spark(56, 56, 3, "#F38AB2")}`
    }},
    pins: [
      {id: "tp-netherlands-tulip", name: "Tulip Pin", kind: "badge", desc: "A glossy red tulip pin with two green leaves.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="nl-tpp-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A96"/><stop offset="1" stop-color="#C8202E"/></linearGradient></defs>
          <path d="M15 27V18" stroke="#3E8A4E" stroke-width="2" stroke-linecap="round"/><path d="M15 25C11 25 7 22 6 17C10 17 14 20 15 23Z M15 23C19 22 22 19 23 15C19 15 16 18 15 21Z" fill="#6AB45A" stroke="#2B4A2A" stroke-width=".8"/>
          <path d="M8 13L7.6 7L10.4 9L12 3.6L15 8L18 3.6L19.6 9L22.4 7L22 13Q22 19 15 19Q8 19 8 13Z" fill="url(#nl-tpp-t)" stroke="#6A1420" stroke-width="1" stroke-linejoin="round"/>
          <ellipse cx="11" cy="11" rx="1.6" ry="2.6" fill="#fff" opacity=".55" transform="rotate(-15 11 11)"/></svg>`},
      {id: "tp-netherlands-delft", name: "Delft Tile Washi", kind: "tape", desc: "White washi tape painted with little blue Delft tiles and windmills.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#F6F8FC" opacity=".94"/>
          <g fill="none" stroke="#2F5E9E" stroke-width="1">${[0, 1, 2, 3, 4].map(i => `<rect x="${7 + i * 15}" y="5" width="13" height="16" rx="1"/>`).join("")}</g>
          ${[0, 1, 2, 3, 4].map(i => { const x = 13.5 + i * 15; return i % 2 ? `<path d="M${x} 16V10M${x - 2.6} 13H${x + 2.6}M${x} 10L${x - 2} 8M${x} 10L${x + 2} 8" stroke="#2F5E9E" stroke-width="1.1" stroke-linecap="round"/><circle cx="${x}" cy="13" r="1" fill="#2F5E9E"/>` : `<path d="M${x - 2} 17L${x - 1.2} 11H${x + 1.2}L${x + 2} 17Z" fill="#2F5E9E"/><path d="M${x - 4} 8L${x + 4} 14M${x + 4} 8L${x - 4} 14" stroke="#2F5E9E" stroke-width="1" stroke-linecap="round"/>`; }).join("")}</svg>`}
    ],
    card: {id: "tp-netherlands", name: "Tulip Fields", desc: "Pale sky-blue paper with a windmill in the corner and bold tulip stripes along the bottom. Deep night blue in dark mode."}
  });
})();
