/* Theme Collection, world theme: morocco */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n, rot = 0) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = rot - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tube = (d, c, w, ow = w + 3.6) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const glow = (id, cx, cy, r) => `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#FFE08A" stop-opacity=".75"/><stop offset=".55" stop-color="#FFE08A" stop-opacity=".3"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const blossom = (x, y, r) => Array.from({length: 5}, (_, i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return `<circle cx="${f1(x + Math.cos(a) * r * .6)}" cy="${f1(y + Math.sin(a) * r * .6)}" r="${f1(r * .55)}" fill="#fff" ${SOw(1)}/>`; }).join("") + `<circle cx="${x}" cy="${y}" r="${f1(r * .36)}" fill="#F6D24A"/>`;

  TP_DATA.push({
    theme: "morocco",
    pack: {name: "Riad Afternoon", items: {
      morocco_teapot: `${lg("wm-mo-tp", "#FFFFFF", "#AAB4C4")}
        <path d="M17 30Q4 30 6 42Q8 52 18 50" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M17 30Q4 30 6 42Q8 52 18 50" fill="none" stroke="#C8D0DC" stroke-width="3" stroke-linecap="round"/>
        <path d="M47 46Q55 44 57 32L60 22Q62 20 62.6 23L61 33Q58 50 47 52Z" fill="url(#wm-mo-tp)" ${S2}/>
        <path d="M32 18C46 18 50 30 50 40C50 52 43 56 32 56C21 56 14 52 14 40C14 30 18 18 32 18Z" fill="url(#wm-mo-tp)" ${SO}/>
        <path d="M24 18Q25 10 32 9Q39 10 40 18Z" fill="url(#wm-mo-tp)" ${S2}/><circle cx="32" cy="6.4" r="2.4" fill="#E2B04A" ${S15}/>
        <path d="M17 30Q32 35 47 30" fill="none" stroke="#C99A2E" stroke-width="2"/>${[22, 32, 42].map(x => `<path d="${star(x, x === 32 ? 33.6 : 32.8, 2, 1, 8)}" fill="#C99A2E"/>`).join("")}
        <path d="M20 44Q21 37 26 34" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        ${EYES(27, 37, 42, 2.2)}${blush(22.5, 41.5, 46, 2.1, 1.4)}${smile(32, 46, 2)}
        <path d="M44 12C46 6 52 5 55 8C53 13 48 15 44 12Z" fill="#5EB86A" ${SOw(1.4)}/><path d="M40 14Q42 8 44 12" fill="none" stroke="#3E8A4E" stroke-width="1.6"/>
        <path d="M54 4q2 -2 0 -4M58 6q2 -2 0 -4" fill="none" stroke="#C8D0DC" stroke-width="1.6" stroke-linecap="round"/>`,
      morocco_lantern: `${glow("wm-mo-lg", 32, 36, 28)}${lg("wm-mo-ln", "#FFE6A0", "#C88A2A", 1, 0)}
        <path d="M32 2V7" stroke="${O}" stroke-width="2"/><circle cx="32" cy="9" r="2.2" fill="#E2B04A" ${S15}/>
        <path d="M32 11C35 12 46 14 43 21H21C18 14 29 12 32 11Z" fill="url(#wm-mo-ln)" ${S2}/>
        <rect x="18" y="20" width="28" height="4" rx="1.4" fill="#E2B04A" ${S2}/>
        <path d="M19 24H45L42 47H22Z" fill="#6A3A12" ${SO}/>
        ${[[26, 29], [38, 29], [32, 35], [26, 41], [38, 41]].map(([x, y], i) => `<path d="${star(x, y, 3.2, 1.6, 8)}" fill="${i === 2 ? "#3EC0B0" : "#FFE08A"}"/>`).join("")}
        <circle cx="32" cy="28" r="1.2" fill="#FFE08A"/><circle cx="32" cy="42" r="1.2" fill="#FFE08A"/>
        <rect x="20" y="47" width="24" height="4" rx="1.4" fill="#E2B04A" ${S2}/><path d="M22 51H42L32 61Z" fill="#E2B04A" ${S2}/>
        ${spark(54, 14, 3.4, "#F2C45A")}${spark(10, 50, 3, "#F2C45A")}`,
      morocco_fennec: `${lg("wm-mo-fx", "#F8DEB4", "#E2B07A")}
        <path d="M18 30C8 20 4 6 8 2C16 2 26 16 28 26Z" fill="url(#wm-mo-fx)" ${SO}/><path d="M18 25C12 18 9 10 10.6 7.4C15 8.6 21 16 23 22Z" fill="#FFC6C2"/>
        <path d="M46 30C56 20 60 6 56 2C48 2 38 16 36 26Z" fill="url(#wm-mo-fx)" ${SO}/><path d="M46 25C52 18 55 10 53.4 7.4C49 8.6 43 16 41 22Z" fill="#FFC6C2"/>
        <path d="M32 22C48 22 54 34 54 42C54 52 44 60 32 60C20 60 10 52 10 42C10 34 16 22 32 22Z" fill="url(#wm-mo-fx)" ${SO}/>
        <path d="M21 50C23 44 28 43 32 45C36 43 41 44 43 50C40 57 24 57 21 50Z" fill="#FFF8EC"/>
        <ellipse cx="32" cy="47" rx="3.2" ry="2.3" fill="${O}"/><path d="M32 49.6v2M29 52q3 2 6 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        ${EYES(24, 40, 40, 2.5)}${blush(18.5, 45.5, 46, 2.2, 1.4)}
        <path d="M16 34Q19 28 25 26" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
      morocco_orange: `${rg("wm-mo-or", "#FFD890", "#E8701A", .38, .32)}
        <circle cx="32" cy="37" r="23" fill="url(#wm-mo-or)" ${SO}/>
        ${Array.from({length: 14}, (_, i) => `<circle cx="${f1(32 + Math.cos(i * 2.4) * (6 + i % 5 * 3.4))}" cy="${f1(37 + Math.sin(i * 2.4) * (6 + i % 5 * 3.4))}" r=".8" fill="#D8600E" opacity=".5"/>`).join("")}
        ${tube("M32 15Q31 11 33 7", "#7A4A2A", 2)}
        <path d="M33 11C38 3 49 3 52 7C48 14 39 15 33 11Z" fill="#4EA05A" ${S2}/><path d="M35 10Q43 6 50 7" fill="none" stroke="#2E7A3E" stroke-width="1.2"/>
        ${blossom(21, 12, 5)}
        <path d="M17 32Q19 24 26 20" fill="none" stroke="#FFF2D0" stroke-width="2.6" stroke-linecap="round"/>
        ${EYES(26, 38, 38, 2.3)}${blush(21.5, 42.5, 43, 2.2, 1.4)}${smile(32, 43, 2.2)}`,
      morocco_zellige: `<rect x="6" y="6" width="52" height="52" rx="6" fill="#2C5FA8" ${SO}/>
        <path d="${star(32, 32, 19, 14, 8, Math.PI / 8)}" fill="#FFFBF2" ${S15}/><path d="${star(32, 32, 10, 7.4, 8)}" fill="#2E8E6E" ${SOw(1.2)}/><path d="${star(32, 32, 4.4, 2.4, 8, Math.PI / 8)}" fill="#F2902E"/>
        ${[[6, 6], [58, 6], [6, 58], [58, 58]].map(([x, y]) => `<path d="M${x} ${y - 8}L${x + 8} ${y}L${x} ${y + 8}L${x - 8} ${y}Z" fill="#2E8E6E" opacity=".95"/>`).join("")}
        ${[[32, 8], [32, 56], [8, 32], [56, 32]].map(([x, y]) => `<path d="${star(x, y, 3, 1.8, 8)}" fill="#F2C45A"/>`).join("")}
        <rect x="6" y="6" width="52" height="52" rx="6" fill="none" ${SO}/>`,
      morocco_arch: `${lg("wm-mo-ar", "#3A70C0", "#1E4680")}
        <path d="M8 60V28Q8 6 32 5Q56 6 56 28V60Z" fill="#FBEBD2" ${SO}/>
        <path d="M14 60V31Q12 16 20 12Q26 9 32 9Q38 9 44 12Q52 16 50 31V60Z" fill="url(#wm-mo-ar)" ${S2}/>
        <path d="M19 60V33Q17 20 25 16Q32 13 39 16Q47 20 45 33V60Z" fill="#A86A4A" ${S15}/>
        <path d="M19 33Q24 38 28 60H19Z M45 33Q40 38 36 60H45Z" fill="#FFF6E8" opacity=".85"/>
        ${[[11, 18], [53, 18], [32, 6.8]].map(([x, y]) => `<path d="${star(x, y, 2.4, 1.3, 8)}" fill="#2E8E6E"/>`).join("")}
        <path d="M30 46L34 46" stroke="#F2C45A" stroke-width="3" stroke-linecap="round"/>
        ${EYES(27, 37, 38, 2)}${smile(32, 42, 1.8, 1.6)}`,
      morocco_tea: `${glow("wm-mo-tg", 32, 30, 24)}${lg("wm-mo-gl", "#E8B04A", "#A86A1A")}
        <path d="M18 18H46L42 56H22Z" fill="#FFFFFF" opacity=".55" ${SO}/>
        <path d="M19.4 26H44.6L42 54H22Z" fill="url(#wm-mo-gl)"/>
        ${[[26, 34], [36, 38], [30, 46], [38, 49]].map(([x, y], i) => `<path d="${star(x, y, 2.4, 1.2, 8, i * .3)}" fill="#F6D27A" opacity=".9"/>`).join("")}
        <path d="M18 18H46L42 56H22Z" fill="none" ${SO}/>
        <path d="M30 20C26 8 34 2 40 4C42 12 36 18 30 20Z" fill="#5EB86A" ${S2}/><path d="M38 18C40 10 48 8 52 12C49 18 43 20 38 18Z" fill="#7ACC7A" ${S2}/>
        <path d="M22 30Q23 40 24 50" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        ${EYES(28, 37, 38, 1.9)}${smile(32.5, 42, 1.8, 1.5)}`,
      morocco_babouche: `${lg("wm-mo-bb", "#FFE27A", "#E8A81E")}
        <path d="M6 44C6 36 16 32 28 34L40 36Q46 37 42 44Q36 52 20 52Q6 52 6 44Z" fill="url(#wm-mo-bb)" ${SO}/>
        <path d="M26 34Q34 30 42 34Q44 40 40 43" fill="#F6C845" ${S2}/>
        <path d="M22 46Q30 47 36 43" fill="none" stroke="#C88A1A" stroke-width="1.6" stroke-dasharray="1.5 2.5"/>
        <path d="M22 28C22 20 32 16 44 18L56 20Q62 21 58 28Q52 36 36 36Q22 36 22 28Z" fill="url(#wm-mo-bb)" ${SO}/>
        <path d="M42 18Q50 14 58 18Q60 24 56 27" fill="#F6C845" ${S2}/><path d="${star(50, 22, 3.4, 1.8, 8)}" fill="#2C5FA8"/>
        ${spark(10, 20, 3.2, "#F2C45A")}${spark(52, 50, 2.8, "#2C5FA8")}`,
      morocco_badge: `${lg("wm-mo-bd", "#2C5FA8", "#1E3A6E")}
        <path d="M6 56V26Q6 8 32 5Q58 8 58 26V56Z" fill="url(#wm-mo-bd)" ${SO}/>
        <path d="M11 52V27Q11 13 32 10Q53 13 53 27V52" fill="none" stroke="#F2C45A" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>
        <path d="${star(32, 21, 6, 4.4, 8, Math.PI / 8)}" fill="#F2C45A"/>
        ${T("MAR", 32, 38, 10, "#FFFFFF", 22)}${T("HABA!", 32, 48, 9.4, "#FFE08A", 30)}`
    }},
    pins: [
      {id: "tp-morocco-zellige", name: "Zellige Star Pin", kind: "badge", desc: "A glazed eight-point zellige star in cobalt, white and green.",
        svg: `<svg viewBox="0 0 30 30"><path d="${star(15, 15, 13, 9.6, 8, Math.PI / 8)}" fill="#2C5FA8" stroke="#14244A" stroke-width="1.1"/><path d="${star(15, 15, 8, 5.8, 8)}" fill="#FFFBF2"/><path d="${star(15, 15, 4, 2.4, 8, Math.PI / 8)}" fill="#2E8E6E"/><circle cx="15" cy="15" r="1.3" fill="#F2902E"/><ellipse cx="9.6" cy="8.6" rx="2.2" ry="1.2" fill="#fff" opacity=".55" transform="rotate(-35 9.6 8.6)"/></svg>`},
      {id: "tp-morocco-tiles", name: "Riad Tile Washi", kind: "tape", desc: "Cobalt washi tape patterned with white zellige stars and little green diamonds.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2C5FA8" opacity=".9"/>
          ${[12, 26, 40, 54, 68, 80].map((x, i) => `<path d="${star(x, 13, 5.6, 4, 8, Math.PI / 8)}" fill="#FFFBF2"/><path d="${star(x, 13, 2, 1.2, 8)}" fill="${i % 2 ? "#F2902E" : "#2E8E6E"}"/>`).join("")}
          ${[19, 33, 47, 61, 75].map(x => `<path d="M${x} 9L${x + 2.4} 13L${x} 17L${x - 2.4} 13Z" fill="#3EAE8A"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-morocco", name: "Riad Courtyard", desc: "Warm plaster paper framed by a carved horseshoe arch, with a brass lantern and a strip of zellige stars. Deep indigo at night."}
  });
})();
