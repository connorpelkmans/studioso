/* Theme Collections, Around the World */
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
  const tube = (d, c, w, ow = w + 3.6) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const blossom = (x, y, r) => Array.from({length: 5}, (_, i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r)}" r="${f1(r * .85)}" fill="#fff" ${SOw(1)}/>`; }).join("") + `<circle cx="${x}" cy="${y}" r="${f1(r * .6)}" fill="#F6C833"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // a lemon (pointed ends) centred on cx, cy, half-length r
  const lemon = (cx, cy, r, id, rot = -20) => `<g transform="rotate(${rot} ${cx} ${cy})"><path d="M${cx - r} ${cy}Q${cx - r * .8} ${cy - r * .72} ${cx} ${cy - r * .72}Q${cx + r * .8} ${cy - r * .72} ${cx + r} ${cy}Q${cx + r * .8} ${cy + r * .72} ${cx} ${cy + r * .72}Q${cx - r * .8} ${cy + r * .72} ${cx - r} ${cy}Z" fill="url(#${id})" ${SO}/></g>`;

  TP_DATA.push({
    theme: "italy",
    pack: {name: "Dolce Vita", items: {
      italy_lemon: `${rg("it-lm", "#FFF6B0", "#EDB018", .38, .3)}
        ${tube("M34 14Q36 8 40 6", "#7A5A34", 2.6)}
        <path d="M38 10C44 2 56 2 60 8C54 14 44 14 38 10Z" fill="#5EAA5E" ${S2}/><path d="M40 10Q50 7 58 7.6" fill="none" stroke="#2E6E3A" stroke-width="1.2" stroke-linecap="round"/>
        ${lemon(32, 36, 25, "it-lm", -10)}
        <path d="M17 26Q21 19 29 17" fill="none" stroke="#FFFBE0" stroke-width="3" stroke-linecap="round"/>
        ${EYES(25, 39, 37, 2.4)}${blush(20.5, 43.5, 42.4, 2.4, 1.5)}${smile(32, 41.6, 2.2)}
        ${blossom(12, 12, 3)}`,
      italy_scooter: `${lg("it-sc", "#FF7A6A", "#C8282A")}
        <circle cx="17" cy="48" r="8" fill="#3A3238" ${SO}/><circle cx="17" cy="48" r="3" fill="#C8C8D4"/><circle cx="48" cy="48" r="8" fill="#3A3238" ${SO}/><circle cx="48" cy="48" r="3" fill="#C8C8D4"/>
        <path d="M6 44Q4 28 20 28L30 29L33 44Z" fill="url(#it-sc)" ${SO}/>
        <path d="M33 44L41 16H46Q56 30 56 44Z" fill="url(#it-sc)" ${SO}/>
        <ellipse cx="18" cy="27" rx="12" ry="3.6" fill="#5A4048" ${S2}/>
        ${tube("M44 16L42 8L36 7", "#5A5462", 2.2)}<circle cx="47.4" cy="18" r="3.4" fill="#FFF2B0" ${SOw(1.6)}/>
        <path d="M10 34Q12 30 18 30" fill="none" stroke="#FFD6CC" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(42, 50, 31, 1.8)}${smile(46, 35, 1.6, 1.5)}
        <path d="M1 54H8M-1 58H6" stroke="#8ACFE0" stroke-width="2" stroke-linecap="round"/>`,
      italy_gelato: `${lg("it-gc", "#F6CC86", "#D8954A", 1, 0)}${rg("it-gp", "#E8F4C0", "#9CC46A")}${rg("it-gs", "#FFE0EA", "#F48AA6")}
        <path d="M20 36H44L33.5 61Q32 63 30.5 61Z" fill="url(#it-gc)" ${SO}/>
        <path d="M24 42H40M27 49H37M24 37L34 58M32 37L38 47M40 37L30 58" stroke="#B8763A" stroke-width="1.2" opacity=".75"/>
        <path d="M32 6C40 6 45 11 45 17C45 22 40 25 32 25C24 25 19 22 19 17C19 11 24 6 32 6Z" fill="url(#it-gs)" ${SO}/>
        <path d="M32 18C43 18 49 25 49 32C49 36 46 38 44 39Q41 42 38 39Q35 42 32 39Q29 42 26 39Q23 42 20 39Q16 37 15 32C15 25 21 18 32 18Z" fill="url(#it-gp)" ${SO}/>
        <path d="M21 25Q24 21 29 20" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(26, 38, 30, 2.1)}${blush(22, 42, 34, 2, 1.3)}${smile(32, 33.4, 1.9)}
        ${tube("M40 8Q44 1 50 3", "#C8783A", 2)}${spark(10, 10, 3, "#F6C833")}`,
      italy_dome: `${rg("it-dm", "#7ED8A8", "#1E7A58", .4, .3)}
        <rect x="14" y="42" width="36" height="16" rx="2" fill="#FCF3E4" ${SO}/>
        ${[19, 27, 35, 43].map(x => `<path d="M${x} 56V49A2 2 0 0 1 ${x + 4} 49V56Z" fill="#5C4A50"/>`).join("")}
        <path d="M10 43C10 24 20 14 32 14C44 14 54 24 54 43Z" fill="url(#it-dm)" ${SO}/>
        ${[[20, 36], [28, 36], [36, 36], [44, 36], [24, 29], [32, 29], [40, 29], [28, 22], [36, 22]].map(([x, y]) => `<path d="M${x} ${y - 3.4}L${x + 2.6} ${y}L${x} ${y + 3.4}L${x - 2.6} ${y}Z" fill="#F6C833"/>`).join("")}
        <rect x="9" y="41" width="46" height="3.4" rx="1" fill="#F6C833" ${SOw(1.4)}/>
        <rect x="29" y="6" width="6" height="9" fill="#FCF3E4" ${S2}/><circle cx="32" cy="4" r="2.4" fill="#F6C833" ${SOw(1.2)}/>
        ${spark(56, 12, 3.4, "#F6C833")}${spark(8, 16, 2.6, "#7FD4E0")}`,
      italy_umbrella: `${Array.from({length: 6}, (_, i) => { const a0 = i / 6, a1 = (i + 1) / 6, x0 = 6 + 52 * a0, x1 = 6 + 52 * a1; return `<path d="M32 8L${f1(x0)} ${f1(30 + Math.sin(Math.PI * a0) * 3)}Q${f1((x0 + x1) / 2)} ${f1(35 + Math.sin(Math.PI * (a0 + a1) / 2) * 3)} ${f1(x1)} ${f1(30 + Math.sin(Math.PI * a1) * 3)}Z" fill="${i % 2 ? "#FFFFFF" : "#E8644A"}"/>`; }).join("")}
        <path d="M32 8L6 30Q32 40 58 30Z" fill="none" ${SO}/>
        ${tube("M32 8V58", "#9A6A44", 2.4)}${tube("M32 4V8", "#9A6A44", 2)}
        <path d="M8 60Q32 54 58 60" fill="none" stroke="#E2D2B8" stroke-width="4" stroke-linecap="round"/>
        <path d="M38 52H58L56 56H40Z" fill="#7FC8E8" ${SOw(1.6)}/>`,
      italy_boat: `${lg("it-bt", "#FFFFFF", "#D8E4EA")}
        <path d="M2 54Q16 50 32 54T62 54" fill="none" stroke="#45C4CC" stroke-width="3" stroke-linecap="round"/>
        <path d="M4 34L56 32Q62 30 63 24Q63 40 54 48H14Q6 44 4 34Z" fill="url(#it-bt)" ${SO}/>
        <path d="M5 39L60 37L58 41L7 43Z" fill="#2A6FB8"/>
        ${tube("M4 34L56 32Q62 30 63 24", "#9A6A44", 1.6, 4.4)}
        <rect x="20" y="28" width="5" height="5" fill="#B07A50" ${SOw(1.4)}/>
        ${EYES(42, 50, 38, 1.8)}${smile(46, 42.4, 1.6, 1.5)}${spark(14, 14, 3, "#F6C833")}`,
      italy_tile: `<rect x="6" y="6" width="52" height="52" rx="6" fill="#FFFDF6" ${SO}/>
        <rect x="11" y="11" width="42" height="42" rx="3" fill="#2A8FB8"/>
        <path d="M32 14L37 27L50 32L37 37L32 50L27 37L14 32L27 27Z" fill="#F6C833" ${SOw(1.6)}/>
        <circle cx="32" cy="32" r="5" fill="#2C9A70" ${SOw(1.4)}/>
        ${[[11, 11], [53, 11], [11, 53], [53, 53]].map(([x, y]) => `<path d="M${x} ${y}L${x + (x < 32 ? 9 : -9)} ${y}L${x} ${y + (y < 32 ? 9 : -9)}Z" fill="#FFFFFF"/>`).join("")}
        ${[[32, 18], [46, 32], [32, 46], [18, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join("")}`,
      italy_badge: `${lg("it-bd", "#2A93BC", "#1E5778")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#it-bd)" ${SO}/>
        <path d="M6 42Q18 38 32 42T58 42V46Q46 50 32 47T6 46Z" fill="#45C4CC" opacity=".8"/>
        ${T("CIAO", 25, 30, 10, "#F6C833", 26)}${T("BELLA!", 31, 42.5, 11, "#FFFFFF", 38)}
        ${rg("it-bl", "#FFF6B0", "#EDB018")}${lemon(52, 18, 8, "it-bl", 20)}${spark(8, 10, 3, "#F6C833")}`
    }},
    pins: [
      {id: "tp-italy-lemon", name: "Amalfi Lemon Pin", kind: "badge", desc: "A glossy Amalfi lemon with a green leaf.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="it-pin-l" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFF6B0"/><stop offset="1" stop-color="#E8A818"/></radialGradient></defs>
          <path d="M16 7C19 2 25 2 27 5C24 8 19 9 16 7Z" fill="#5EAA5E" stroke="#2B2233" stroke-width="1"/>
          <g transform="rotate(-18 15 17)"><path d="M2 17Q4 9 15 9Q26 9 28 17Q26 25 15 25Q4 25 2 17Z" fill="url(#it-pin-l)" stroke="#2B2233" stroke-width="1.1"/></g>
          <ellipse cx="10" cy="13.6" rx="3" ry="1.4" fill="#fff" opacity=".6" transform="rotate(-30 10 13.6)"/></svg>`},
      {id: "tp-italy-tiles", name: "Majolica Washi", kind: "tape", desc: "Washi tape painted with blue and yellow majolica tiles.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFFDF6" opacity=".95"/>
          ${[14, 33, 52, 71].map((x, i) => `<g transform="translate(${x} 13) scale(.78)"><rect x="-10" y="-10" width="20" height="20" rx="2" fill="${i % 2 ? "#2C9A70" : "#2A8FB8"}"/><path d="M0 -8L2.4 -2.4L8 0L2.4 2.4L0 8L-2.4 2.4L-8 0L-2.4 -2.4Z" fill="#F6C833"/><circle r="1.8" fill="#fff"/></g>`).join("")}</svg>`}
    ],
    card: {id: "tp-italy", name: "Lemon Terrace", desc: "Warm cream paper with a lemon branch in the corner and a little boat on turquoise water below. Deep Amalfi night in dark mode."}
  });
})();
