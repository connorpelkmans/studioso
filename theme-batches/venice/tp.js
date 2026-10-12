/* Theme Collections, around the world: venice (Venice) */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // a gondola in profile, waterline centre (x, y), len long
  const gondola = (x, y, len, fill) => { const k = len / 24, P = (a, b) => `${+(x + a * k).toFixed(1)} ${+(y + b * k).toFixed(1)}`;
    return `<path d="M${P(-12.6, -4)}Q${P(-12.8, -1.4)} ${P(-11.4, 0.6)}Q${P(-6, 3.4)} ${P(4, 3)}Q${P(9, 2.6)} ${P(10.6, -0.8)}L${P(11.4, -4.6)}L${P(12.8, -5)}L${P(12.4, -6.8)}L${P(10.6, -6.4)}L${P(10, -2.4)}Q${P(9, -0.4)} ${P(6.6, 0)}Q${P(-1, 1)} ${P(-8.6, -0.6)}Q${P(-11, -1.4)} ${P(-11.6, -4)}Z" fill="${fill}" ${SOw(1.6)}/>
      <path d="M${P(11, -5.6)}H${P(12.6, -5.6).split(" ")[0]}M${P(11.1, -4.4)}H${P(12.4, -4.4).split(" ")[0]}" stroke="#E4E8F0" stroke-width="1.2" stroke-linecap="round"/>`; };
  // the campanile, base centre (x, y), h tall
  const campanile = (x, y, h) => { const k = h / 50, R = (a, b, c, d, f) => `<rect x="${+(x + a * k).toFixed(1)}" y="${+(y - d * k).toFixed(1)}" width="${+((c - a) * k).toFixed(1)}" height="${+((d - b) * k).toFixed(1)}" fill="${f}" ${SOw(1.4)}/>`;
    return `${R(-4, 0, 4, 28, "#C0664E")}${R(-4.4, 28, 4.4, 34, "#F6EEE2")}${R(-4, 34, 4, 38, "#C0664E")}
      <path d="M${x - 4.2 * k} ${y - 38 * k}L${x} ${y - 49 * k}L${x + 4.2 * k} ${y - 38 * k}Z" fill="#7FA59A" ${SOw(1.4)}/><circle cx="${x}" cy="${y - 50 * k}" r="${1.2 * k}" fill="#E2B048"/>
      <path d="M${x - 2.4 * k} ${y - 29 * k}V${y - 33 * k}M${x} ${y - 29 * k}V${y - 33 * k}M${x + 2.4 * k} ${y - 29 * k}V${y - 33 * k}" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>`; };

  TP_DATA.push({
    theme: "venice",
    pack: {name: "Venice Postcards", items: {
      venice_gondola: `${lg("ve-gw", "#8ED2C8", "#3E9A92")}
        <path d="M4 44Q14 40 24 44Q34 48 44 44Q54 40 60 44V54Q32 60 4 54Z" fill="url(#ve-gw)" ${S2}/>
        ${gondola(32, 42, 52, "#26263A")}
        <path d="M23 34V20" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M23 34V20" stroke="#1E2440" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="19.6" y="12" width="7" height="9" rx="1.6" fill="#FFFFFF" ${SOw(1.4)}/><path d="M19.6 14.6H26.6M19.6 17.6H26.6" stroke="#1E2440" stroke-width="1.4"/>
        <circle cx="23" cy="9.4" r="3" fill="#D89A74" ${SOw(1.4)}/><ellipse cx="23" cy="7" rx="5.6" ry="1.4" fill="#EAD08A" ${SOw(1.2)}/><rect x="20.2" y="4.4" width="5.6" height="2.6" fill="#EAD08A" ${SOw(1.2)}/>
        <path d="M27 18L40 46" stroke="#8A6440" stroke-width="1.8" stroke-linecap="round"/>
        ${spark(52, 12, 3.4, "#FFE27A")}${spark(44, 24, 2.2, "#FFFFFF")}`,
      venice_mask: `${lg("ve-mk", "#F8D878", "#C88E2E")}
        <path d="M6 28Q5 14 18 15Q27 16 32 23Q37 16 46 15Q59 14 58 28Q57 42 45 43Q37 44 32 34Q27 44 19 43Q7 42 6 28Z" fill="url(#ve-mk)" ${SOw(2.6)}/>
        <ellipse cx="20" cy="27" rx="7" ry="4.6" fill="#2E7A86" ${S2}/><ellipse cx="44" cy="27" rx="7" ry="4.6" fill="#2E7A86" ${S2}/>
        <circle cx="21.4" cy="26" r="2.2" fill="${O}"/><circle cx="45.4" cy="26" r="2.2" fill="${O}"/><circle cx="22.2" cy="25.2" r=".8" fill="#fff"/><circle cx="46.2" cy="25.2" r=".8" fill="#fff"/>
        <path d="M29 20L32 16L35 20L32 24Z" fill="#C8463E" ${SOw(1.2)}/>
        <path d="M6 28Q0 26 2 18M58 28Q64 26 62 18" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M6 28Q0 26 2 18M58 28Q64 26 62 18" fill="none" stroke="#E2B048" stroke-width="2" stroke-linecap="round"/>
        <path d="M44 15Q48 4 58 2Q54 10 50 15Z" fill="#C8463E" ${SOw(1.4)}/><path d="M48 15Q56 8 62 10Q56 14 52 17Z" fill="#2E7A86" ${SOw(1.4)}/>
        ${smile(32, 48, 4, 2.2)}${spark(12, 52, 3, "#FFE27A")}${spark(54, 50, 2.6, "#FFE27A")}${spark(10, 10, 2.4, "#FFFFFF")}`,
      venice_pigeon: `${lg("ve-pg", "#C8CEDC", "#8E94AA")}
        <path d="M18 40L4 44L6 49L20 46Z" fill="#8A90A4" ${S2}/>
        <ellipse cx="30" cy="42" rx="17" ry="13" fill="url(#ve-pg)" ${SOw(2.4)}/>
        <path d="M18 38Q26 50 40 44" fill="none" stroke="#4A4E5C" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M36 32Q44 38 50 30Q48 24 42 24Z" fill="#5FA888" ${SOw(1.6)}/>
        <circle cx="46" cy="22" r="10" fill="#A4AABE" ${SOw(2.2)}/><path d="M55 22L61 24L55 26Z" fill="#3A3430" ${SOw(1.2)}/><ellipse cx="55" cy="21" rx="2" ry="1" fill="#F2ECEA"/>
        ${EYES(44, 51, 20, 1.8)}${blush(42, 53, 25, 1.8, 1.2)}
        <path d="M26 54V60M34 54V60M23 61H29M31 61H37" stroke="#E88A96" stroke-width="2" stroke-linecap="round"/>
        ${spark(12, 18, 3, "#FFE27A")}`,
      venice_campanile: `<circle cx="32" cy="34" r="27" fill="#FCE6C4" ${SOw(2)}/>
        <path d="M6 46H58V52Q32 60 6 52Z" fill="#7CC4BA"/>
        ${campanile(26, 48, 42)}
        <path d="M36 48V38Q36 32 42 31Q48 32 48 38V48Z" fill="#F6EEE2" ${SOw(1.4)}/><path d="M37 36Q37 26 42 26Q47 26 47 36Z" fill="#8FA3A6" ${SOw(1.4)}/><circle cx="42" cy="24.4" r="1.4" fill="#E2B048"/>
        <path d="M38 48V43Q38 41 40 41Q42 41 42 43V48Z" fill="#E2B048" opacity=".8"/>
        <path d="M14 14q2 -2 4 0q2 -2 4 0M44 12q2 -2 4 0q2 -2 4 0" fill="none" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>`,
      venice_bridge: `${lg("ve-br", "#D8846A", "#B8604A")}
        <path d="M4 52H60V58H4Z" fill="#5AAEA4"/>
        <path d="M4 52Q4 30 32 24Q60 30 60 52H50Q48 36 32 34Q16 36 14 52Z" fill="url(#ve-br)" ${SOw(2.2)}/>
        <path d="M14 52Q16 36 32 34Q48 36 50 52" fill="none" stroke="#F6EEE2" stroke-width="3"/>
        <path d="M4 34Q4 22 32 18Q60 22 60 34" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M4 34Q4 22 32 18Q60 22 60 34" fill="none" stroke="#F6EEE2" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M8 34V40M16 28V36M24 24V33M32 22V32M40 24V33M48 28V36M56 34V40" stroke="#8A4A3A" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M18 56Q32 48 46 56" fill="none" stroke="#B8604A" stroke-width="2" opacity=".5"/>
        ${spark(54, 10, 3, "#FFE27A")}${spark(10, 12, 2.4, "#FFFFFF")}`,
      venice_lantern: `${lg("ve-ln", "#4A4450", "#2A2430")}
        <defs><radialGradient id="ve-lg"><stop offset="0" stop-color="#FFE08A" stop-opacity=".85"/><stop offset=".55" stop-color="#FFE08A" stop-opacity=".3"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs>
        <circle cx="32" cy="30" r="17" fill="url(#ve-lg)"/>
        <path d="M8 10H30V14" fill="none" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M8 10H30V14" fill="none" stroke="#4A4450" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M22 18H42L38 14H26Z" fill="url(#ve-ln)" ${S2}/><path d="M24 18H40L38 42H26Z" fill="#FFE6A0" ${S2}/><path d="M32 18V42M25 30H39" stroke="#4A4450" stroke-width="1.4"/>
        <path d="M24 42H40L36 48H28Z" fill="url(#ve-ln)" ${S2}/><circle cx="32" cy="50" r="2" fill="#4A4450" ${SOw(1.2)}/>
        ${EYES(28.6, 35.4, 27, 1.8)}${smile(32, 33, 1.8, 1.5)}${spark(52, 30, 3.4, "#FFE27A")}${spark(12, 36, 2.8, "#FFE27A")}`,
      venice_glass: `${lg("ve-gl", "#8ED8F0", "#4A86D6")}
        <path d="M24 8H40V14Q46 18 46 30Q46 46 36 54H28Q18 46 18 30Q18 18 24 14Z" fill="url(#ve-gl)" ${SOw(2.4)}/>
        <path d="M18 30Q32 24 46 30M19 38Q32 32 45 38" fill="none" stroke="#F2C860" stroke-width="2.2" stroke-linecap="round"/>
        ${[[26, 22, "#E85A7A"], [36, 20, "#F2C860"], [30, 44, "#F2FFFF"], [40, 44, "#E85A7A"], [24, 46, "#F2C860"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2" fill="${c}" ${SOw(.8)}/>`).join("")}
        <ellipse cx="32" cy="56" rx="10" ry="3" fill="#4A86D6" ${SOw(1.6)}/>
        <path d="M23 18Q22 26 22 32" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
        ${spark(54, 14, 3.4, "#FFE27A")}${spark(10, 44, 2.6, "#FFFFFF")}`,
      venice_badge: `${lg("ve-bd", "#357A74", "#22504C")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#ve-bd)" ${SOw(2.5)}/>
        ${gondola(46, 42, 22, "#F6DA9E")}
        ${T("BRAVO!", 25, 37, 11, "#FFFFFF", 36)}
        ${spark(9, 10, 3.4, "#FFE27A")}${spark(56, 56, 3, "#F2A8C0")}`
    }},
    pins: [
      {id: "tp-venice-mask", name: "Carnival Mask Pin", kind: "badge", desc: "A tiny golden carnival mask with teal eyes and a red jewel.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="ve-pin-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8D878"/><stop offset="1" stop-color="#C88E2E"/></linearGradient></defs>
          <path d="M3 14Q2.6 7 9 7.6Q13 8 15 11.4Q17 8 21 7.6Q27.4 7 27 14Q26.6 21 21 21.4Q17 21.8 15 17Q13 21.8 9 21.4Q3.4 21 3 14Z" fill="url(#ve-pin-m)" stroke="#6A4A1A" stroke-width="1.1" stroke-linejoin="round"/>
          <ellipse cx="9.6" cy="14" rx="3.4" ry="2.2" fill="#2E7A86" stroke="#6A4A1A" stroke-width=".8"/><ellipse cx="20.4" cy="14" rx="3.4" ry="2.2" fill="#2E7A86" stroke="#6A4A1A" stroke-width=".8"/>
          <path d="M13.6 10.6L15 9L16.4 10.6L15 12.2Z" fill="#C8463E"/><ellipse cx="7" cy="10" rx="1.6" ry=".8" fill="#fff" opacity=".6" transform="rotate(-20 7 10)"/></svg>`},
      {id: "tp-venice-poles", name: "Mooring Pole Washi", kind: "tape", desc: "Red-and-white striped mooring poles with a little gondola gliding by.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="ve-pin-c"><path d="${tapeEdge}"/></clipPath></defs><path d="${tapeEdge}" fill="#E6F4F2" opacity=".95"/>
          <g clip-path="url(#ve-pin-c)" opacity=".9">${Array.from({length: 12}, (_, i) => `<path d="M${i * 8 - 4} 26L${i * 8 + 6} 0H${i * 8 + 10}L${i * 8} 26Z" fill="#D8443C"/>`).join("")}<path d="M0 20Q8 17 16 20Q24 23 32 20Q40 17 48 20Q56 23 64 20Q72 17 80 20Q84 21 86 20V26H0Z" fill="#4E9A92"/></g>
          <ellipse cx="43" cy="12" rx="14" ry="8" fill="#E6F4F2"/>${gondola(43, 15, 24, "#26263A").replace(/stroke-width="1.6"/, 'stroke-width=".8"')}</svg>`}
    ],
    card: {id: "tp-venice", name: "Canal Postcard", desc: "Cream paper with a little gondola under a Gothic window and canal ripples along the bottom. Lantern-lit night blue in dark mode."}
  });
})();
