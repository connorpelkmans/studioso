/* Theme Collections, batch n4: nightmarket, diadelosmuertos, holi, ramadan, midautumn */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const shut = (x, y, w = 2.6) => `<path d="M${x - w} ${y}q${w} ${-w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const petals = (cx, cy, n, r, rx, ry, fill, extra = "") => Array.from({length: n}, (_, i) => { const a = i * 360 / n; return `<ellipse cx="${f1(cx + r * Math.cos(a * Math.PI / 180))}" cy="${f1(cy + r * Math.sin(a * Math.PI / 180))}" rx="${rx}" ry="${ry}" transform="rotate(${f1(a)} ${f1(cx + r * Math.cos(a * Math.PI / 180))} ${f1(cy + r * Math.sin(a * Math.PI / 180))})" fill="${fill}" ${extra}/>`; }).join("");
  const mari = (cx, cy, r, a = "#F48A1C", b = "#FFC22A", id) => `${petals(cx, cy, 12, r * .62, r * .42, r * .3, a, SOw(1.2))}${petals(cx, cy, 9, r * .36, r * .34, r * .26, b, SOw(1))}<circle cx="${cx}" cy="${cy}" r="${f1(r * .24)}" fill="#E06A10" ${SOw(1)}/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const chochin = (x, y, s, body = "#E8483A", id = "") => `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 -15V-12" stroke="${O}" stroke-width="2"/><rect x="-6" y="-13" width="12" height="4" rx="1.5" fill="#3A2228" ${SOw(1.4)}/>
      <ellipse cx="0" cy="0" rx="10" ry="10.5" fill="${id ? `url(#${id})` : body}" ${SOw(1.8)}/>
      <path d="M-9.4 -4Q0 -2 9.4 -4M-10 1Q0 3 10 1M-8.4 5.6Q0 7.4 8.4 5.6" fill="none" stroke="rgba(90,20,20,.4)" stroke-width="1"/>
      <rect x="-6" y="9" width="12" height="4" rx="1.5" fill="#3A2228" ${SOw(1.4)}/><path d="M-2 13V18M0 13V19M2 13V18" stroke="#E8B04A" stroke-width="1.2" stroke-linecap="round"/></g>`;

  /* ================= NIGHT MARKET ================= */
  TP_DATA.push({
    theme: "nightmarket",
    pack: {name: "Night Market Treats", items: {
      nightmarket_lantern: `${rg("n4-nm-lan", "#FFE3A0", "#E0402E", .4, .35)}
        <path d="M32 3V10" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="21" y="8" width="22" height="7" rx="2.5" fill="#3A2228" ${S2}/>
        <ellipse cx="32" cy="34" rx="20" ry="20" fill="url(#n4-nm-lan)" ${SO}/>
        <path d="M13.4 25Q32 29 50.6 25M12 34Q32 38.4 52 34M13.6 43Q32 47 50.4 43" fill="none" stroke="#A82A22" stroke-width="1.3" opacity=".55"/>
        <rect x="21" y="52" width="22" height="7" rx="2.5" fill="#3A2228" ${S2}/>
        <path d="M28 59V63M32 59V64M36 59V63" stroke="#E8B04A" stroke-width="2" stroke-linecap="round"/>
        ${SHINE(21, 24, 3.6, 6, 20)}
        ${EYES(25, 39, 34, 2.4)}${blush(20.5, 43.5, 39)}${smile(32, 38.4, 2.4)}
        ${spark(54, 10, 4, "#FFD86B")}${spark(9, 52, 3, "#FFB3C6")}`,
      nightmarket_goldfish: `${lg("n4-nm-bag", "#E8F8FF", "#9FD8F2")}${rg("n4-nm-fish", "#FFD08A", "#F2602E", .4, .35)}
        <path d="M24 13Q32 17 40 13L38 9Q32 11 26 9z" fill="#FF8FB3" ${S2}/><path d="M29 9Q32 3 35 9" fill="none" stroke="#FF8FB3" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M25 14Q10 26 11 42Q12 60 32 60Q52 60 53 42Q54 26 39 14z" fill="url(#n4-nm-bag)" opacity=".92" ${SO}/>
        <path d="M13 36Q32 31 51 36V44Q50 58 32 58Q14 58 13 44z" fill="#6EC3EA" opacity=".55"/>
        <path d="M26 42C26 35 34 32 40 37C43 39.5 43 43.5 40 46C34 51 26 48 26 42Z" fill="url(#n4-nm-fish)" ${S2}/>
        <path d="M27 42L18 35L20 42L18 49Z" fill="#FF9A5A" ${SOw(1.8)}/>
        <circle cx="37" cy="40" r="1.8" fill="${O}"/><circle cx="37.6" cy="39.4" r=".6" fill="#fff"/><ellipse cx="38" cy="44" rx="1.6" ry="1" fill="#FF8FA8"/>
        <circle cx="46" cy="30" r="2" fill="#fff" opacity=".9"/><circle cx="43" cy="24" r="1.2" fill="#fff" opacity=".9"/>
        <path d="M18 24Q16 30 17 36" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
      nightmarket_taiyaki: `${lg("n4-nm-tai", "#FFD38A", "#D9822E")}
        <path d="M7 34Q10 18 30 17L45 14L50 7L55 18Q61 26 55 34Q61 42 55 50L50 61L45 54L30 51Q10 50 7 34Z" fill="url(#n4-nm-tai)" ${SO}/>
        <path d="M44 22Q38 34 44 46" fill="none" stroke="#B8682A" stroke-width="2" stroke-linecap="round"/>
        <path d="M30 24Q34 27 31 31M36 28Q40 31 37 35M30 38Q34 41 31 45" fill="none" stroke="#C47A30" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 30Q14 26 18 26" fill="none" stroke="#FFF0C8" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(16, 26, 33, 2.2)}${blush(12, 30, 38, 2.2, 1.4)}${smile(21, 37.4, 2.2, 1.8)}
        ${spark(56, 6, 3.4, "#FFD86B")}`,
      nightmarket_apple: `${rg("n4-nm-ap", "#FF9A8A", "#C8202A", .35, .3)}
        ${tube("M32 34V61", "#F2DFB8", 3.2)}
        <path d="M32 14C25 9 10 12 10 30C10 44 20 52 28 50Q32 49 36 50C44 52 54 44 54 30C54 12 39 9 32 14Z" fill="url(#n4-nm-ap)" ${SO}/>
        <path d="M32 14Q31 8 34 4" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M32 14Q31 8 34 4" fill="none" stroke="#8A5A2A" stroke-width="2" stroke-linecap="round"/>
        <path d="M34 8C37 2 44 2 46 5C43 10 38 11 34 8Z" fill="#7AC86A" ${S2}/>
        <path d="M16 22Q18 17 23 16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><circle cx="15" cy="28" r="1.6" fill="#fff" opacity=".85"/>
        ${EYES(25, 39, 32, 2.4)}${blush(20, 44, 37)}${smile(32, 36.4, 2.4)}`,
      nightmarket_takoyaki: `${rg("n4-nm-tk", "#F8C27A", "#B8642A", .4, .3)}
        <path d="M4 44H60L54 56Q32 60 10 56Z" fill="#E8C496" ${SO}/><path d="M8 47H56" stroke="#C99A62" stroke-width="1.6"/>
        <circle cx="20" cy="38" r="10" fill="url(#n4-nm-tk)" ${S2}/><circle cx="44" cy="38" r="10" fill="url(#n4-nm-tk)" ${S2}/><circle cx="32" cy="30" r="11" fill="url(#n4-nm-tk)" ${S2}/>
        <path d="M13 34Q20 30 27 34M37 34Q44 30 51 34M24 25Q32 20 40 25" fill="none" stroke="#5A2A16" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M14 33L17 30L20 33L23 30M38 33L41 30L44 33L47 30M26 24L29 21L32 24L35 21L38 24" fill="none" stroke="#FFF4DE" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${tube("M47 8L38 28", "#F2DFB8", 2)}
        ${EYES(28, 36, 31, 1.8)}${smile(32, 34.4, 1.6, 1.5)}<circle cx="24" cy="18" r="1.2" fill="#5AA84A"/><circle cx="40" cy="16" r="1.2" fill="#5AA84A"/>`,
      nightmarket_cotton: `${rg("n4-nm-cc", "#FFFFFF", "#FFA6CC", .4, .35)}
        ${tube("M32 40V62", "#F2DFB8", 3.2)}
        <path d="M17 36C8 36 6 24 13 20C11 10 22 5 28 10C32 3 44 4 46 12C55 11 59 22 53 28C58 36 49 44 42 40C38 46 26 46 22 40C20 40 18.5 38 17 36Z" fill="url(#n4-nm-cc)" ${SO}/>
        <path d="M18 18Q22 13 28 14M42 13Q47 13 49 17" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="48" cy="30" r="2.4" fill="#C8E8FF"/><circle cx="16" cy="28" r="2" fill="#FFF0A0"/>
        ${EYES(26, 38, 27, 2.3)}${blush(21, 43, 32, 2.4, 1.6)}${smile(32, 31.4, 2.2)}`,
      nightmarket_balloon: `${rg("n4-nm-b1", "#FFE0EC", "#F2709E")}${rg("n4-nm-b2", "#D8F8EA", "#3EB896")}${rg("n4-nm-b3", "#DCEBFF", "#5A92E8")}
        <path d="M18 34Q24 48 30 61M44 30Q38 46 31 61M33 22Q32 42 30.5 61" fill="none" stroke="${O}" stroke-width="1.4"/>
        <ellipse cx="17" cy="24" rx="11" ry="13" fill="url(#n4-nm-b1)" ${S2}/><path d="M15 37L19 37L17 34z" fill="#F2709E" ${SOw(1.2)}/>
        <ellipse cx="46" cy="21" rx="11" ry="13" fill="url(#n4-nm-b3)" ${S2}/><path d="M44 34L48 34L46 31z" fill="#5A92E8" ${SOw(1.2)}/>
        <ellipse cx="32" cy="16" rx="12" ry="13.5" fill="url(#n4-nm-b2)" ${S2}/><path d="M30 29.5L34 29.5L32 26.5z" fill="#3EB896" ${SOw(1.2)}/>
        <path d="M26 9Q28 6 31 6M11 18Q12 15 15 14M40 14Q41 11 44 10" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${EYES(28, 36, 17, 1.8)}${blush(25, 39, 20.5, 1.8, 1.2)}${smile(32, 20, 1.6, 1.5)}`,
      nightmarket_yum: `${lg("n4-nm-yum", "#E8483A", "#A82A2A")}
        <path d="M32 6V10" stroke="${O}" stroke-width="2.4"/><rect x="20" y="9" width="24" height="6" rx="2" fill="#3A2228" ${S2}/>
        <rect x="4" y="15" width="56" height="34" rx="16" fill="url(#n4-nm-yum)" ${SO}/>
        <path d="M8 24Q32 20 56 24M8 40Q32 44 56 40" fill="none" stroke="#FFB0A0" stroke-width="1.2" opacity=".6"/>
        ${T("YUM!", 32, 38.6, 15, "#FFF2D0", 36)}
        <rect x="20" y="49" width="24" height="6" rx="2" fill="#3A2228" ${S2}/><path d="M28 55V60M32 55V61M36 55V60" stroke="#E8B04A" stroke-width="2" stroke-linecap="round"/>
        ${spark(56, 8, 4, "#FFD86B")}${spark(7, 56, 3.4, "#FFD86B")}`
    }},
    pins: [
      {id: "tp-nightmarket-lantern", name: "Paper Lantern Pin", kind: "badge", desc: "A glossy red paper lantern with gold tassels.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n4-nmp-l" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFE3A0"/><stop offset="1" stop-color="#D8382A"/></radialGradient></defs>
          <rect x="9.5" y="3" width="11" height="3.4" rx="1.2" fill="#3A2228"/><ellipse cx="15" cy="15" rx="9.6" ry="9.4" fill="url(#n4-nmp-l)" stroke="#6A1E1A" stroke-width="1.1"/>
          <path d="M6 11Q15 13 24 11M5.4 15.5Q15 17.5 24.6 15.5M6.4 20Q15 22 23.6 20" fill="none" stroke="#9A2A22" stroke-width=".7" opacity=".6"/>
          <rect x="9.5" y="23.4" width="11" height="3.2" rx="1.2" fill="#3A2228"/><path d="M13.6 26.6V29M15 26.6V29.4M16.4 26.6V29" stroke="#E8B04A" stroke-width="1"/>
          <ellipse cx="10.6" cy="10.6" rx="1.6" ry="2.8" fill="#fff" opacity=".6" transform="rotate(20 10.6 10.6)"/></svg>`},
      {id: "tp-nightmarket-string", name: "Lantern String Washi", kind: "tape", desc: "Warm red washi tape with a little string of paper lanterns.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#D8463E" opacity=".9"/>
          <path d="M6 6Q24 12 43 6Q62 12 80 6" fill="none" stroke="#3A2228" stroke-width=".8"/>
          ${[[14, 8.4, "#FFE9C8"], [28, 9.6, "#FFB04A"], [43, 7.2, "#FFE9C8"], [58, 9.6, "#FFB04A"], [72, 8.4, "#FFE9C8"]].map(([x, y, c]) => `<rect x="${x - 2.4}" y="${y}" width="4.8" height="1.6" fill="#3A2228"/><ellipse cx="${x}" cy="${y + 6}" rx="4" ry="4.6" fill="${c}"/><rect x="${x - 2.4}" y="${y + 10.2}" width="4.8" height="1.6" fill="#3A2228"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-nightmarket", name: "Lantern Stall", desc: "Warm cream paper with a string of red paper lanterns along the top and a goldfish in the corner. Deep plum at night."}
  });

  /* ================= DIA DE LOS MUERTOS ================= */
  const skull = (cx, cy, r, c1, c2, c3) => `<path d="M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Q${cx + r} ${cy + r * .7} ${cx + r * .5} ${cy + r * .82}V${cy + r * 1.05}Q${cx} ${cy + r * 1.2} ${cx - r * .5} ${cy + r * 1.05}V${cy + r * .82}Q${cx - r} ${cy + r * .7} ${cx - r} ${cy}Z" fill="url(#n4-dm-sk)" ${SO}/>
      <circle cx="${cx - r * .4}" cy="${cy + r * .08}" r="${f1(r * .32)}" fill="${c1}" ${S2}/><circle cx="${cx + r * .4}" cy="${cy + r * .08}" r="${f1(r * .32)}" fill="${c2}" ${S2}/>
      <circle cx="${cx - r * .4}" cy="${cy + r * .1}" r="${f1(r * .17)}" fill="${O}"/><circle cx="${cx + r * .4}" cy="${cy + r * .1}" r="${f1(r * .17)}" fill="${O}"/><circle cx="${f1(cx - r * .35)}" cy="${f1(cy + r * .03)}" r="${f1(r * .06)}" fill="#fff"/><circle cx="${f1(cx + r * .45)}" cy="${f1(cy + r * .03)}" r="${f1(r * .06)}" fill="#fff"/>
      ${petals(cx, cy - r * .55, 6, r * .17, r * .13, r * .09, c3, SOw(.8))}<circle cx="${cx}" cy="${f1(cy - r * .55)}" r="${f1(r * .09)}" fill="#FFD23A"/>
      <path d="M${cx} ${f1(cy + r * .5)}l${f1(-r * .1)} ${f1(-r * .12)}a${f1(r * .055)} ${f1(r * .055)} 0 0 1 ${f1(r * .1)} -.02a${f1(r * .055)} ${f1(r * .055)} 0 0 1 ${f1(r * .1)} .02z" fill="#F27BA6"/>
      <path d="M${f1(cx - r * .32)} ${f1(cy + r * .66)}Q${cx} ${f1(cy + r * .86)} ${f1(cx + r * .32)} ${f1(cy + r * .66)}" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M${f1(cx - r * .16)} ${f1(cy + r * .7)}v${f1(r * .12)}M${cx} ${f1(cy + r * .74)}v${f1(r * .12)}M${f1(cx + r * .16)} ${f1(cy + r * .7)}v${f1(r * .12)}" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="${f1(cx - r * .78)}" cy="${f1(cy - r * .2)}" r="${f1(r * .07)}" fill="${c1}"/><circle cx="${f1(cx + r * .78)}" cy="${f1(cy - r * .2)}" r="${f1(r * .07)}" fill="${c2}"/><circle cx="${f1(cx - r * .62)}" cy="${f1(cy - r * .58)}" r="${f1(r * .06)}" fill="${c3}"/><circle cx="${f1(cx + r * .62)}" cy="${f1(cy - r * .58)}" r="${f1(r * .06)}" fill="${c3}"/>`;
  TP_DATA.push({
    theme: "diadelosmuertos",
    pack: {name: "Ofrenda Treasures", items: {
      diadelosmuertos_skull: `${rg("n4-dm-sk", "#FFFFFF", "#E6DCEA", .35, .3)}${skull(32, 28, 21, "#2EC4D0", "#F27BA6", "#FF9A2E")}
        ${spark(57, 8, 4, "#FFD23A")}${spark(7, 52, 3.2, "#2EC4D0")}`,
      diadelosmuertos_marigold: `${mari(32, 30, 27)}
        ${EYES(26, 38, 29, 2.4)}${blush(21, 43, 34)}${smile(32, 33.4, 2.4)}
        <path d="M30 56Q28 60 24 62M34 56Q38 59 42 60" fill="none" stroke="#3E8E52" stroke-width="3" stroke-linecap="round"/>`,
      diadelosmuertos_pan: `${rg("n4-dm-pan", "#F8D08A", "#C27434", .4, .3)}
        <path d="M6 46Q6 18 32 18Q58 18 58 46Q32 54 6 46Z" fill="url(#n4-dm-pan)" ${SO}/>
        ${tube("M13 38Q32 22 51 38", "#B0602A", 3.4, 6.4)}${tube("M24 44Q26 32 32 24M40 44Q38 32 32 24", "#B0602A", 3.2, 6)}
        <circle cx="32" cy="21" r="5" fill="#B0602A" ${S2}/>
        ${Array.from({length: 16}, (_, i) => `<circle cx="${f1(12 + (i * 37 % 40))}" cy="${f1(27 + (i * 23 % 17))}" r=".9" fill="#FFF4DA"/>`).join("")}
        ${EYES(24, 40, 40, 2.2)}${blush(19, 45, 44.5, 2.2, 1.4)}${smile(32, 44, 2.2)}`,
      diadelosmuertos_candle: `${lg("n4-dm-cd", "#FFF8EA", "#EAD8C0")}${rg("n4-dm-fl", "#FFFBE0", "#FF9A2E", .5, .7)}
        <circle cx="32" cy="15" r="13" fill="#FFD86B" opacity=".35"/>
        <path d="M32 3C37 10 38 16 32 22C26 16 27 10 32 3Z" fill="url(#n4-dm-fl)" ${S2}/>
        <path d="M32 22V25" stroke="${O}" stroke-width="2"/>
        <path d="M21 26H43V56Q32 60 21 56Z" fill="url(#n4-dm-cd)" ${SO}/>
        <path d="M21 26Q24 30 26 27Q28 33 30 27" fill="#FFFFFF" ${SOw(1.4)}/>
        <path d="M14 56H50L48 61H16Z" fill="#C8367E" ${S2}/>
        ${EYES(27, 37, 40, 2.2)}${blush(24, 40, 45, 2, 1.3)}${smile(32, 44.4, 2)}`,
      diadelosmuertos_picado: `<path d="M4 8Q32 14 60 8" fill="none" stroke="${O}" stroke-width="1.8"/>
        <path d="M11 10H53V48L49.5 54L46 48L42.5 54L39 48L35.5 54L32 48L28.5 54L25 48L21.5 54L18 48L14.5 54L11 48Z" fill="#FF5FA2" ${SO}/>
        ${petals(32, 27, 6, 5, 3.6, 2, "#FFF4FA")}<circle cx="32" cy="27" r="2.6" fill="#FFF4FA"/>
        ${[[18, 16], [46, 16], [18, 40], [46, 40], [32, 14], [32, 41]].map(([x, y]) => `<path d="M${x} ${y - 2.6}l2.6 2.6l-2.6 2.6l-2.6 -2.6z" fill="#FFF4FA"/>`).join("")}
        <path d="M14 21Q12 28 14 35M50 21Q52 28 50 35" fill="none" stroke="#FFF4FA" stroke-width="1.6" stroke-dasharray="1.6 2.6" stroke-linecap="round"/>`,
      diadelosmuertos_monarch: `${rg("n4-dm-mw", "#FFC36A", "#E8701A", .5, .5)}
        <path d="M31 30C26 12 10 6 6 14C3 22 14 30 31 32Z" fill="url(#n4-dm-mw)" ${SO}/><path d="M33 30C38 12 54 6 58 14C61 22 50 30 33 32Z" fill="url(#n4-dm-mw)" ${SO}/>
        <path d="M31 33C20 34 12 42 16 49C20 54 28 46 31 36Z" fill="url(#n4-dm-mw)" ${SO}/><path d="M33 33C44 34 52 42 48 49C44 54 36 46 33 36Z" fill="url(#n4-dm-mw)" ${SO}/>
        <path d="M30 30L12 16M30 31L8 22M30 35L18 46M34 30L52 16M34 31L56 22M34 35L46 46" stroke="${O}" stroke-width="1.3" opacity=".7"/>
        ${[[9, 15], [13, 11], [55, 15], [51, 11], [17, 49], [47, 49]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#fff"/>`).join("")}
        <ellipse cx="32" cy="34" rx="3.2" ry="11" fill="#3A2420" ${S2}/><circle cx="32" cy="22" r="4.4" fill="#3A2420" ${S2}/>
        <path d="M30.5 19Q28 12 25 11M33.5 19Q36 12 39 11" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="30.4" cy="21.6" r="1" fill="#fff"/><circle cx="33.6" cy="21.6" r="1" fill="#fff"/>`,
      diadelosmuertos_cocoa: `${lg("n4-dm-mug", "#FFFFFF", "#F2D8C8")}
        <path d="M24 16Q20 10 25 6M34 16Q30 10 35 6" fill="none" stroke="#C8B8C8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M46 28H50Q58 28 57 37Q56 46 46 44" fill="none" stroke="${O}" stroke-width="7.4" stroke-linecap="round"/><path d="M46 28H50Q58 28 57 37Q56 46 46 44" fill="none" stroke="#2EC4D0" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M10 20H48L45 52Q44 58 38 58H20Q14 58 13 52Z" fill="url(#n4-dm-mug)" ${SO}/>
        <ellipse cx="29" cy="21" rx="18" ry="4" fill="#7A3A1E" ${S2}/>
        <path d="M12 30Q29 34 47 30" fill="none" stroke="#2EC4D0" stroke-width="3"/><path d="M14 44Q29 48 45 44" fill="none" stroke="#F27BA6" stroke-width="3"/>
        ${tube("M40 22L52 6", "#A0602A", 2.6)}
        ${EYES(23, 35, 37, 2.2)}${blush(19, 39, 41.4, 2.2, 1.4)}${smile(29, 41, 2)}`,
      diadelosmuertos_badge: `${lg("n4-dm-bd", "#F27BA6", "#C2367A")}
        <rect x="3" y="16" width="58" height="32" rx="15" fill="url(#n4-dm-bd)" ${SO}/>
        ${T("RECUERDA", 32, 37, 10.5, "#FFF6E0", 44)}
        <path d="M9 21Q32 18 55 21" fill="none" stroke="#FFD0E2" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>
        ${mari(9, 14, 9)}${mari(55, 50, 9)}${spark(54, 9, 3.6, "#FFD23A")}${spark(10, 54, 3, "#2EC4D0")}`
    }},
    pins: [
      {id: "tp-diadelosmuertos-skull", name: "Sugar Skull Pin", kind: "badge", desc: "A smiling sugar skull iced with flowers in pink and turquoise.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n4-dmp-s" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E2D6E8"/></radialGradient></defs>
          <path d="M5 13A10 10 0 1 1 25 13Q25 19.5 20 20.4V24Q15 26 10 24V20.4Q5 19.5 5 13Z" fill="url(#n4-dmp-s)" stroke="#5A2A46" stroke-width="1.1"/>
          <circle cx="11" cy="14" r="3.4" fill="#2EC4D0"/><circle cx="19" cy="14" r="3.4" fill="#F27BA6"/><circle cx="11" cy="14.3" r="1.8" fill="#2B2233"/><circle cx="19" cy="14.3" r="1.8" fill="#2B2233"/>
          <circle cx="15" cy="7.4" r="1.6" fill="#FF9A2E"/><circle cx="13.4" cy="6.4" r="1" fill="#FF9A2E"/><circle cx="16.6" cy="6.4" r="1" fill="#FF9A2E"/><circle cx="15" cy="7.4" r=".8" fill="#FFD23A"/>
          <path d="M11.5 20.4Q15 22.6 18.5 20.4" fill="none" stroke="#2B2233" stroke-width="1"/><path d="M15 18.8l-1 -1.2a.6 .6 0 0 1 1 -.1a.6 .6 0 0 1 1 .1z" fill="#F27BA6"/></svg>`},
      {id: "tp-diadelosmuertos-picado", name: "Papel Picado Washi", kind: "tape", desc: "Bright washi tape strung with little cut-paper flags.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFF0D6" opacity=".92"/>
          <path d="M5 5Q43 9 81 5" fill="none" stroke="#5A2A36" stroke-width=".7"/>
          ${["#FF5FA2", "#FF9A2E", "#FFD23A", "#3FC27A", "#2EC4D0", "#9A5AE0", "#FF5FA2"].map((c, i) => { const x = 9 + i * 11.4, y = 5.6 + Math.sin(i / 6 * Math.PI) * 1.8; return `<path d="M${f1(x - 4.6)} ${f1(y)}H${f1(x + 4.6)}V${f1(y + 10)}L${f1(x + 2.3)} ${f1(y + 12)}L${f1(x)} ${f1(y + 10)}L${f1(x - 2.3)} ${f1(y + 12)}L${f1(x - 4.6)} ${f1(y + 10)}Z" fill="${c}"/><circle cx="${f1(x)}" cy="${f1(y + 5)}" r="1.6" fill="#FFF0D6"/>`; }).join("")}</svg>`}
    ],
    card: {id: "tp-diadelosmuertos", name: "Papel Picado", desc: "Warm cream paper with a row of cut-paper flags across the top and a marigold in the corner. Deep plum at night."}
  });

  /* ================= HOLI ================= */
  const splash = (cx, cy, r, c) => { let d = ""; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, q = r * (i % 2 ? .78 : 1.02); d += `<circle cx="${f1(cx + Math.cos(a) * q * .55)}" cy="${f1(cy + Math.sin(a) * q * .55)}" r="${f1(r * .5)}" fill="${c}"/>`; } return d; };
  TP_DATA.push({
    theme: "holi",
    pack: {name: "Festival of Colours", items: {
      holi_splash: `${rg("n4-ho-sp", "#FFB0D8", "#E8408E", .4, .35)}
        <path d="M32 7C40 7 42 13 47 13C54 13 58 20 55 27C60 33 57 42 50 43C49 51 41 56 34 52C28 58 18 55 17 47C9 46 5 38 10 32C5 25 10 16 18 17C20 10 26 7 32 7Z" fill="url(#n4-ho-sp)" ${SO}/>
        <circle cx="58" cy="10" r="3.4" fill="#FFC62A" ${S2}/><circle cx="6" cy="54" r="3" fill="#3A8AE8" ${S2}/><circle cx="58" cy="52" r="2.4" fill="#2EC07A" ${S2}/><circle cx="7" cy="12" r="2" fill="#9A5AE0" ${SOw(1.4)}/>
        <path d="M17 24Q20 18 26 17" fill="none" stroke="#FFE0F0" stroke-width="2.6" stroke-linecap="round"/>
        ${EYES(26, 38, 31, 2.4)}${blush(21, 43, 36, 2.4, 1.6)}${smile(32, 35.4, 2.4)}`,
      holi_pichkari: `${lg("n4-ho-pk", "#FFE9A0", "#D89A2A")}
        <path d="M50 30Q56 22 63 24M50 34Q58 34 62 40M50 32Q60 29 63 32" fill="none" stroke="#5AC8F0" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 3"/>
        <circle cx="61" cy="19" r="2.6" fill="#FF4A9A" ${SOw(1.2)}/><circle cx="62" cy="45" r="2.2" fill="#2EC07A" ${SOw(1.2)}/><circle cx="57" cy="12" r="1.6" fill="#FFC62A"/>
        ${tube("M3 32H12", "#C8862A", 3.4)}${tube("M4 24V40", "#C8862A", 3.4)}
        <rect x="12" y="21" width="30" height="22" rx="7" fill="url(#n4-ho-pk)" ${SO}/>
        <path d="M18 21V43M36 21V43" stroke="#B8781E" stroke-width="1.6"/>
        <path d="M42 26L52 30V34L42 38Z" fill="#E0A030" ${S2}/>
        <path d="M17 26Q20 23 26 23" fill="none" stroke="#FFF6D0" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(23, 31, 32, 2)}${blush(20, 34, 36, 1.8, 1.2)}${smile(27, 35.6, 1.8, 1.6)}
        <circle cx="10" cy="54" r="5" fill="#FF7AB8" opacity=".85"/><circle cx="18" cy="58" r="3.4" fill="#9A5AE0" opacity=".85"/><circle cx="46" cy="54" r="4" fill="#FFC62A" opacity=".85"/>`,
      holi_plate: `${lg("n4-ho-th", "#FFE38A", "#D09A2E")}
        <ellipse cx="32" cy="46" rx="29" ry="11" fill="#B8781E" ${SO}/><ellipse cx="32" cy="43" rx="29" ry="10" fill="url(#n4-ho-th)" ${SO}/>
        <ellipse cx="32" cy="42.4" rx="23" ry="7" fill="none" stroke="#B8781E" stroke-width="1.2" opacity=".6"/>
        <path d="M8 41Q16 22 24 41Z" fill="#FF4A9A" ${S2}/><path d="M22 43Q31 18 40 43Z" fill="#FFC62A" ${S2}/><path d="M38 41Q47 23 56 41Z" fill="#2EC07A" ${S2}/>
        <path d="M18 47Q24 33 30 47Z" fill="#3A8AE8" ${S2}/><path d="M34 47Q40 34 46 47Z" fill="#9A5AE0" ${S2}/>
        ${EYES(28, 36, 37, 1.9)}${smile(32, 39.6, 1.8, 1.5)}${spark(56, 12, 4, "#FF4A9A")}${spark(9, 16, 3, "#3A8AE8")}`,
      holi_balloon: `${rg("n4-ho-wb", "#D8F8FF", "#3AA8E8", .4, .35)}
        <path d="M32 6C46 6 54 20 52 34C50 48 40 54 32 54C24 54 14 48 12 34C10 20 18 6 32 6Z" fill="url(#n4-ho-wb)" ${SO}/>
        <path d="M28 54L36 54L34 58Q32 60 30 58Z" fill="#3AA8E8" ${S2}/>
        <path d="M20 18Q23 12 29 11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/><circle cx="18" cy="25" r="1.6" fill="#fff"/>
        <circle cx="54" cy="56" r="3" fill="#FF4A9A"/><circle cx="58" cy="48" r="1.8" fill="#FFC62A"/><circle cx="8" cy="54" r="2.2" fill="#2EC07A"/>
        ${EYES(26, 38, 31, 2.4)}${blush(21, 43, 36)}${smile(32, 35.4, 2.4)}`,
      holi_gujiya: `${lg("n4-ho-gj", "#FFE6B0", "#E0A24A")}
        <path d="M6 42Q8 16 32 14Q56 16 58 42Z" fill="url(#n4-ho-gj)" ${SO}/>
        <path d="M6 42Q32 50 58 42" fill="none" stroke="${O}" stroke-width="2.5"/>
        ${Array.from({length: 11}, (_, i) => { const a = Math.PI + (i + .5) / 11 * Math.PI, x = 32 + Math.cos(a) * 25, y = 42 + Math.sin(a) * 26; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#F2C47A" ${SOw(1.2)}/>`; }).join("")}
        <path d="M18 28Q22 24 27 23" fill="none" stroke="#FFF6DE" stroke-width="2.4" stroke-linecap="round"/>
        ${[[20, 36], [42, 32], [30, 30], [46, 38]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="1.4" rx=".7" fill="${["#FF4A9A", "#2EC07A", "#3A8AE8", "#FFC62A"][i]}" transform="rotate(${i * 40} ${x} ${y})"/>`).join("")}
        ${EYES(27, 37, 36, 2)}${blush(23, 41, 40, 2, 1.3)}${smile(32, 39.6, 2)}`,
      holi_garland: `<path d="M4 10Q32 40 60 10" fill="none" stroke="${O}" stroke-width="1.6"/>
        ${[[8, 14], [15, 21], [23, 26], [32, 28], [41, 26], [49, 21], [56, 14]].map(([x, y], i) => mari(x, y, 8.4, i % 2 ? "#F48A1C" : "#FFB01E", i % 2 ? "#FFC62A" : "#FFE07A")).join("")}
        ${tube("M32 34V44", "#3E8E52", 1.6)}${mari(32, 46, 9)}${mari(32, 58, 7, "#FFB01E", "#FFE07A")}
        <path d="M27 36Q20 38 18 44Q24 43 27 38ZM37 36Q44 38 46 44Q40 43 37 38Z" fill="#5EA850" ${SOw(1.4)}/>`,
      holi_dholak: `${lg("n4-ho-dh", "#E0844A", "#A04A22")}
        <path d="M10 22Q32 14 54 22V44Q32 52 10 44Z" fill="url(#n4-ho-dh)" ${SO}/>
        <ellipse cx="10" cy="33" rx="5" ry="11" fill="#FFF2DA" ${S2}/><ellipse cx="54" cy="33" rx="5" ry="11" fill="#FFF2DA" ${S2}/>
        <path d="M12 23L22 44M22 21L32 46M32 19L42 46M42 21L52 44M22 44L32 19M32 46L42 21" stroke="#FFD86B" stroke-width="1.5"/>
        <path d="M14 30Q32 26 50 30" fill="none" stroke="#FF4A9A" stroke-width="3"/><path d="M14 38Q32 42 50 38" fill="none" stroke="#2EC07A" stroke-width="3"/>
        ${EYES(27, 37, 33.4, 2)}${smile(32, 36.8, 2, 1.7)}
        <path d="M4 10q2 -4 5 0M55 10q2 -4 5 0M8 58q2 -4 5 0" fill="none" stroke="#9A5AE0" stroke-width="2" stroke-linecap="round"/>`,
      holi_badge: `<rect x="3" y="16" width="58" height="32" rx="15" fill="#FFF8F0" ${SO}/>
        ${splash(9, 16, 8, "#FF4A9A")}${splash(56, 48, 8, "#3A8AE8")}${splash(57, 15, 6, "#FFC62A")}${splash(7, 49, 6, "#2EC07A")}
        ${T("HAPPY", 32, 30, 10, "#E8408E", 32)}${T("HOLI!", 32, 42.5, 12, "#7A3AC8", 32)}`
    }},
    pins: [
      {id: "tp-holi-splash", name: "Gulal Splash Pin", kind: "badge", desc: "A round splash of pink powder with flecks of every colour.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n4-hop-s" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFB8DC"/><stop offset="1" stop-color="#E03A8A"/></radialGradient></defs>
          <path d="M15 3C19 3 20 6 23 6C27 6 28.6 10 27 13C29.6 16 28 20.6 24.6 21C24 25 20 27 16.6 25C13.6 28 8.6 26.6 8.2 22.6C4.6 22 2.6 18 5 15C2.6 11.6 5 7 9 8C10 4.6 12.4 3 15 3Z" fill="url(#n4-hop-s)" stroke="#8A1E52" stroke-width="1.1"/>
          <circle cx="27" cy="4" r="1.8" fill="#FFC62A"/><circle cx="3" cy="26" r="1.6" fill="#3A8AE8"/><circle cx="27.4" cy="26" r="1.3" fill="#2EC07A"/>
          <ellipse cx="10.6" cy="10.6" rx="2.4" ry="1.4" fill="#fff" opacity=".6" transform="rotate(-35 10.6 10.6)"/></svg>`},
      {id: "tp-holi-rainbow", name: "Rainbow Powder Washi", kind: "tape", desc: "Washi tape dusted with soft clouds of pink, yellow, green and blue.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFF6EC" opacity=".95"/>
          ${[["#FF7AB8", 12], ["#FFD24A", 28], ["#4AD08A", 44], ["#5AA0F0", 60], ["#B07AF0", 75]].map(([c, x], i) => `<ellipse cx="${x}" cy="${13 + (i % 2 ? 2 : -2)}" rx="9" ry="7" fill="${c}" opacity=".75"/><circle cx="${x + 6}" cy="${8 + (i % 2) * 8}" r="1.4" fill="${c}"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".5"/></svg>`}
    ],
    card: {id: "tp-holi", name: "Colour Splash", desc: "Soft white paper splashed with pink, yellow, green and blue powder in the corners. Deep violet at night."}
  });

  /* ================= RAMADAN NIGHTS ================= */
  const fanous = (x, y, s, k = 0) => { const G = [["#FF8A6A", "#E8463A"], ["#7AE0A8", "#2EA86A"], ["#9AB8FF", "#3A6AD8"], ["#FFE08A", "#F2A21E"]], a = G[k % 4], b = G[(k + 1) % 4], c = G[(k + 2) % 4];
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="0" cy="-27" r="2.6" fill="none" stroke="${O}" stroke-width="2"/>
      <path d="M-9 -16Q-8 -25 0 -25Q8 -25 9 -16Z" fill="#E2B04A" ${S2}/><rect x="-12" y="-17" width="24" height="4" rx="1" fill="#E2B04A" ${S2}/>
      <path d="M-12 -13H-5L-4 8H-9Z" fill="${b[1]}" ${S2}/><path d="M12 -13H5L4 8H9Z" fill="${c[1]}" ${S2}/><path d="M-5 -13H5L4 8H-4Z" fill="${a[1]}" ${S2}/>
      <path d="M-3 -10H-1.4L-1.6 4H-2.8Z" fill="#fff" opacity=".55"/><path d="M0 -8L2 -4L0 0L-2 -4Z" fill="#FFE9A0"/>
      <rect x="-10" y="8" width="20" height="3.4" rx="1" fill="#E2B04A" ${S2}/><path d="M-9 11.4H9L2.6 20H-2.6Z" fill="#E2B04A" ${S2}/><circle cx="0" cy="22" r="2.2" fill="#E2B04A" ${SOw(1.6)}/></g>`; };
  const cres = (cx, cy, R, qx, qy, r) => { const dx = qx - cx, dy = qy - cy, d = Math.hypot(dx, dy), a = (R * R - r * r + d * d) / (2 * d), h = Math.sqrt(R * R - a * a), px = cx + a * dx / d, py = cy + a * dy / d;
    const x1 = px - h * dy / d, y1 = py + h * dx / d, x2 = px + h * dy / d, y2 = py - h * dx / d; return `M${f1(x1)} ${f1(y1)}A${R} ${R} 0 1 1 ${f1(x2)} ${f1(y2)}A${r} ${r} 0 ${a > d ? 1 : 0} 0 ${f1(x1)} ${f1(y1)}z`; };
  TP_DATA.push({
    theme: "ramadan",
    pack: {name: "Lantern Nights", items: {
      ramadan_fanous: `<circle cx="32" cy="34" r="22" fill="#FFE08A" opacity=".3"/>${fanous(32, 34, 1.15, 0)}
        <g transform="translate(32 34) scale(1.15)">${EYES(-2.6, 2.6, -2, 1.2)}<path d="M-1.4 1.6q1.4 1.2 2.8 0" fill="none" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/></g>
        ${spark(56, 12, 4, "#F2C45A")}${spark(9, 50, 3.4, "#F2C45A")}`,
      ramadan_crescent: `${rg("n4-rm-mn", "#FFFBE6", "#F2C24A", .3, .4)}
        <path d="${cres(30, 33, 26, 45, 25, 20)}" fill="url(#n4-rm-mn)" ${SO}/>
        ${shut(12.5, 35, 2.3)}${shut(21.5, 38.5, 2.3)}<ellipse cx="11" cy="40.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/><ellipse cx="24" cy="44" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/>
        <path d="M15.5 44q2 1.8 4 .8" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M46 4v12" stroke="${O}" stroke-width="1.3"/><path d="${star(46, 21, 7.4, 3.4, 5)}" fill="#FFE27A" ${S15}/>
        ${spark(54, 42, 3.4, "#9AB8FF")}${spark(40, 54, 2.6, "#F2C45A")}`,
      ramadan_dates: `${lg("n4-rm-bw", "#3EB0A8", "#1E7A74")}${rg("n4-rm-dt", "#C8703A", "#6A2A16", .35, .3)}
        ${[[18, 26, -20], [28, 22, 10], [38, 24, -5], [46, 28, 25], [23, 32, 15], [34, 31, -15], [43, 34, 5]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.4" transform="rotate(${r} ${x} ${y})" fill="url(#n4-rm-dt)" ${S2}/>`).join("")}
        <path d="M5 36H59Q57 52 44 56H20Q7 52 5 36Z" fill="url(#n4-rm-bw)" ${SO}/>
        <path d="M10 42Q32 46 54 42" fill="none" stroke="#F2C45A" stroke-width="2"/>${[16, 24, 32, 40, 48].map(x => `<path d="M${x} 47l2 2l-2 2l-2 -2z" fill="#F2C45A"/>`).join("")}
        <path d="M24 56H40V60H24Z" fill="#1E7A74" ${S2}/>
        ${EYES(27, 37, 50.5, 1.9)}${smile(32, 53.4, 1.8, 1.5)}`,
      ramadan_teapot: `${lg("n4-rm-tp", "#FFE6A0", "#D09A2E")}
        <path d="M30 8Q32 3 34 8" fill="none" stroke="${O}" stroke-width="2.4"/><path d="M24 14Q24 8 32 8Q40 8 40 14Z" fill="url(#n4-rm-tp)" ${S2}/>
        <path d="M20 14H44L46 22Q50 30 48 42Q44 52 32 52Q20 52 16 42Q14 30 18 22Z" fill="url(#n4-rm-tp)" ${SO}/>
        ${tube("M18 30Q8 30 5 18", "#E2B04A", 4.4)}
        <path d="M46 24Q56 24 55 34Q54 42 46 42" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M46 24Q56 24 55 34Q54 42 46 42" fill="none" stroke="#E2B04A" stroke-width="3" stroke-linecap="round"/>
        <path d="M20 26H44" stroke="#2A7A78" stroke-width="2.6"/>${[24, 30, 36, 42].map(x => `<circle cx="${x - 2}" cy="26" r="1" fill="#FFF2C0"/>`).join("")}
        <path d="M22 34Q24 30 27 29" fill="none" stroke="#FFF6D0" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(27, 37, 38, 2.1)}${blush(23, 41, 42, 2.1, 1.4)}${smile(32, 41.6, 2)}
        <path d="M26 52H38L39 57H25Z" fill="#C88A2E" ${S2}/>`,
      ramadan_kahk: `${rg("n4-rm-kk", "#FFF2DA", "#E2B47A", .4, .35)}
        <circle cx="32" cy="32" r="24" fill="url(#n4-rm-kk)" ${SO}/>
        ${Array.from({length: 12}, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${f1(32 + Math.cos(a) * 13)} ${f1(32 + Math.sin(a) * 13)}L${f1(32 + Math.cos(a) * 20)} ${f1(32 + Math.sin(a) * 20)}" stroke="#C8925A" stroke-width="1.6" stroke-linecap="round"/>`; }).join("")}
        <circle cx="32" cy="32" r="11" fill="none" stroke="#C8925A" stroke-width="1.4"/>
        ${Array.from({length: 22}, (_, i) => `<circle cx="${f1(14 + (i * 41 % 36))}" cy="${f1(14 + (i * 29 % 36))}" r=".9" fill="#FFFFFF"/>`).join("")}
        ${EYES(27, 37, 31, 2.1)}${blush(23.5, 40.5, 35, 2, 1.3)}${smile(32, 34.6, 2)}`,
      ramadan_star: `${rg("n4-rm-st", "#FFF6C8", "#F2B030", .5, .5)}
        <circle cx="32" cy="32" r="26" fill="#FFE08A" opacity=".25"/>
        <path d="${star(32, 32, 24, 17.6, 8)}" fill="url(#n4-rm-st)" ${SO}/>
        <path d="${star(32, 32, 14, 10.4, 8)}" fill="none" stroke="#C88A2E" stroke-width="1.4"/>
        ${EYES(27, 37, 31, 2.2)}${blush(23.5, 40.5, 35, 2, 1.3)}${smile(32, 34.6, 2)}
        ${spark(57, 8, 3.6, "#9AB8FF")}${spark(8, 56, 3, "#F2C45A")}`,
      ramadan_tile: `<rect x="6" y="6" width="52" height="52" rx="9" fill="#2A7A78" ${SO}/>
        <rect x="11" y="11" width="42" height="42" rx="6" fill="none" stroke="#F2C45A" stroke-width="1.6"/>
        <path d="${star(32, 32, 16, 12, 8)}" fill="#FFF4DE" ${S2}/><path d="${star(32, 32, 8, 5.4, 8)}" fill="#E8463A"/>
        ${[[11, 11], [53, 11], [11, 53], [53, 53]].map(([x, y]) => `<path d="M${x} ${y - 5}L${x + 5} ${y}L${x} ${y + 5}L${x - 5} ${y}Z" fill="#F2C45A" ${SOw(1.2)}/>`).join("")}
        ${[[32, 11], [32, 53], [11, 32], [53, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#9AE0D8"/>`).join("")}`,
      ramadan_badge: `${lg("n4-rm-bd", "#353C86", "#1E2458")}
        <path d="M6 54V28Q6 10 32 6Q58 10 58 28V54Z" fill="url(#n4-rm-bd)" ${SO}/>
        <path d="M11 50V29Q11 14 32 11Q53 14 53 29V50" fill="none" stroke="#F2C45A" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>
        <path d="${cres(32, 20, 6, 35, 17.6, 4.8)}" fill="#FFE08A"/>
        ${T("RAMADAN", 32, 37, 9.4, "#FFE08A", 38)}${T("KAREEM", 32, 47, 9.4, "#FFFFFF", 34)}
        ${spark(47, 21, 2.6, "#FFE08A")}${spark(17, 22, 2, "#FFFFFF")}`
    }},
    pins: [
      {id: "tp-ramadan-crescent", name: "Crescent Pin", kind: "badge", desc: "A golden crescent moon with a tiny star.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n4-rmp-m" cx=".3" cy=".4" r=".8"><stop offset="0" stop-color="#FFF8D6"/><stop offset="1" stop-color="#E8AE30"/></radialGradient></defs>
          <path d="${cres(14, 16, 11, 20.5, 12.5, 9)}" fill="url(#n4-rmp-m)" stroke="#8A5E14" stroke-width="1.1"/>
          <path d="${star(22.5, 19, 4, 1.8, 5)}" fill="#FFE08A" stroke="#8A5E14" stroke-width=".7"/><ellipse cx="8" cy="13" rx="1.4" ry="2.6" fill="#fff" opacity=".6" transform="rotate(20 8 13)"/></svg>`},
      {id: "tp-ramadan-stars", name: "Star Lights Washi", kind: "tape", desc: "Midnight blue washi tape with a string of little golden stars.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#252C66" opacity=".9"/>
          <path d="M5 6Q43 14 81 6" fill="none" stroke="#E2B04A" stroke-width=".7"/>
          ${[10, 22, 34, 46, 58, 70, 80].map((x, i) => { const y = 6 + Math.sin(i / 6 * Math.PI) * 4 + 4; return `<path d="M${x} ${f1(y - 3)}V${f1(y)}" stroke="#E2B04A" stroke-width=".6"/><path d="${star(x, y + 2.4, 3.2, 1.4, 5)}" fill="${i % 2 ? "#FFF2C0" : "#F2C45A"}"/>`; }).join("")}</svg>`}
    ],
    card: {id: "tp-ramadan", name: "Moonlit Arch", desc: "Warm sand paper framed by a pointed arch, with a fanous lantern and a crescent in the corners. Midnight blue at night."}
  });

  /* ================= MID-AUTUMN ================= */
  TP_DATA.push({
    theme: "midautumn",
    pack: {name: "Moon Festival", items: {
      midautumn_moon: `${rg("n4-ma-mn", "#FFFFF0", "#F6D890", .35, .3)}
        <circle cx="32" cy="32" r="26" fill="url(#n4-ma-mn)" ${SO}/>
        <circle cx="20" cy="22" r="4" fill="#E8C878" opacity=".5"/><circle cx="44" cy="44" r="3" fill="#E8C878" opacity=".5"/>
        <g fill="#D8B070" opacity=".75"><ellipse cx="29" cy="38" rx="9" ry="7"/><ellipse cx="33" cy="29" rx="5" ry="4.4"/><ellipse cx="31" cy="21" rx="1.6" ry="5" transform="rotate(-12 31 21)"/><ellipse cx="35" cy="21" rx="1.5" ry="4.6" transform="rotate(10 35 21)"/><path d="M40 38H48L46 46H42Z"/></g>
        ${spark(57, 8, 4, "#FFE27A")}${spark(7, 56, 3, "#FFE27A")}`,
      midautumn_mooncake: `${rg("n4-ma-mc", "#F8CC7A", "#C8822E", .4, .35)}
        <path d="M32 6C46 6 56 14 56 30C56 46 46 54 32 54C18 54 8 46 8 30C8 14 18 6 32 6Z" fill="url(#n4-ma-mc)" ${SO}/>
        ${Array.from({length: 14}, (_, i) => { const a = i / 14 * Math.PI * 2; return `<circle cx="${f1(32 + Math.cos(a) * 21.4)}" cy="${f1(30 + Math.sin(a) * 21.4)}" r="3.4" fill="#D8923A" stroke="#A8641E" stroke-width="1"/>`; }).join("")}
        <circle cx="32" cy="30" r="15" fill="none" stroke="#A8641E" stroke-width="1.6"/>
        <path d="M24 20Q22 16 26 15M40 20Q42 16 38 15" fill="none" stroke="#A8641E" stroke-width="1.4" stroke-linecap="round"/>
        ${EYES(26.5, 37.5, 30, 2.3)}${blush(22.5, 41.5, 34.4, 2.2, 1.4)}${smile(32, 33.8, 2.2)}
        <path d="M14 18Q17 13 22 11" fill="none" stroke="#FFE6B0" stroke-width="2.4" stroke-linecap="round"/>`,
      midautumn_rabbit: `${lg("n4-ma-rb", "#FFFFFF", "#E2E8F2")}
        <ellipse cx="25" cy="16" rx="5" ry="13" transform="rotate(-12 25 16)" fill="url(#n4-ma-rb)" ${SO}/><ellipse cx="25" cy="16" rx="2.2" ry="9" transform="rotate(-12 25 16)" fill="#FFC1D0"/>
        <ellipse cx="39" cy="16" rx="5" ry="13" transform="rotate(12 39 16)" fill="url(#n4-ma-rb)" ${SO}/><ellipse cx="39" cy="16" rx="2.2" ry="9" transform="rotate(12 39 16)" fill="#FFC1D0"/>
        <path d="M32 26C46 26 54 36 54 46C54 56 44 60 32 60C20 60 10 56 10 46C10 36 18 26 32 26Z" fill="url(#n4-ma-rb)" ${SO}/>
        <path d="M18 34Q20 30 25 29" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(25, 39, 41, 2.4)}${blush(20, 44, 46)}<path d="M30 45.6L34 45.6L32 47.6Z" fill="#FF8FA8"/><path d="M32 47.6q-2 2 -3.6 .6M32 47.6q2 2 3.6 .6" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="50" cy="10" r="5" fill="#FFF0B8" ${S2}/>${spark(9, 10, 3, "#FFE27A")}`,
      midautumn_lantern: `${rg("n4-ma-ln", "#FFE6A0", "#D8402E", .4, .35)}
        <path d="M32 2V8" stroke="${O}" stroke-width="2.2"/><rect x="22" y="7" width="20" height="6" rx="2" fill="#E2A83A" ${S2}/>
        <ellipse cx="32" cy="31" rx="23" ry="19" fill="url(#n4-ma-ln)" ${SO}/>
        <path d="M32 12V50M21 14Q15 31 21 48M43 14Q49 31 43 48" fill="none" stroke="#A82A22" stroke-width="1.3" opacity=".55"/>
        <rect x="22" y="48" width="20" height="6" rx="2" fill="#E2A83A" ${S2}/>
        ${tube("M32 54V62", "#E2A83A", 2.4)}
        ${SHINE(19, 22, 3.4, 6, 20)}
        ${EYES(26, 38, 31, 2.3)}${blush(21.5, 42.5, 36, 2.3, 1.5)}${smile(32, 35.4, 2.2)}`,
      midautumn_lotus: `${lg("n4-ma-lp", "#FFE6EE", "#F27AA0")}
        <ellipse cx="32" cy="52" rx="26" ry="6" fill="#5EA070" ${SO}/>
        <path d="M10 48Q6 36 16 32Q20 40 24 48Z" fill="url(#n4-ma-lp)" ${S2}/><path d="M54 48Q58 36 48 32Q44 40 40 48Z" fill="url(#n4-ma-lp)" ${S2}/>
        <path d="M18 50Q12 30 26 22Q30 34 30 50Z" fill="url(#n4-ma-lp)" ${S2}/><path d="M46 50Q52 30 38 22Q34 34 34 50Z" fill="url(#n4-ma-lp)" ${S2}/>
        <path d="M32 50Q20 36 32 16Q44 36 32 50Z" fill="url(#n4-ma-lp)" ${SO}/>
        <rect x="29.5" y="28" width="5" height="8" rx="1" fill="#FFF6DC" ${SOw(1.4)}/><path d="M32 18C35 22 35 25 32 27C29 25 29 22 32 18Z" fill="#FFB040" ${SOw(1.2)}/>
        <circle cx="32" cy="23" r="10" fill="#FFE08A" opacity=".3"/>
        ${EYES(28.6, 35.4, 42, 1.7)}${smile(32, 44.6, 1.6, 1.4)}`,
      midautumn_tea: `${lg("n4-ma-tp", "#E8F4EE", "#A8CDBE")}
        <path d="M22 12Q22 6 30 6Q38 6 38 12Z" fill="url(#n4-ma-tp)" ${S2}/><circle cx="30" cy="5" r="2.4" fill="#5E9A82" ${SOw(1.4)}/>
        <path d="M14 14H46Q52 30 46 42Q40 50 30 50Q20 50 14 42Q8 30 14 14Z" fill="url(#n4-ma-tp)" ${SO}/>
        ${tube("M12 26Q4 26 3 16", "#A8CDBE", 4)}
        <path d="M46 20Q56 20 54 30Q52 38 46 38" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M46 20Q56 20 54 30Q52 38 46 38" fill="none" stroke="#7AB8A2" stroke-width="2.6" stroke-linecap="round"/>
        ${[[22, 22], [30, 20], [38, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#F6B42A"/>`).join("")}
        ${EYES(25, 35, 32, 2.1)}${blush(21, 39, 36.4, 2, 1.3)}${smile(30, 36, 2)}
        <path d="M44 52H60L58 60H46Z" fill="url(#n4-ma-tp)" ${S2}/><path d="M48 50Q50 46 48 43M54 50Q56 46 54 43" fill="none" stroke="#C8B8C8" stroke-width="1.8" stroke-linecap="round"/>`,
      midautumn_osmanthus: `${tube("M8 58Q24 40 30 22Q34 12 44 6", "#7A4A36", 3)}
        ${[[18, 44, -40], [26, 30, 30], [36, 16, -50], [14, 50, 40], [40, 12, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="3.6" transform="rotate(${r} ${x} ${y})" fill="#5E9A62" ${SOw(1.6)}/>`).join("")}
        ${[[24, 38], [31, 26], [38, 20], [20, 46], [46, 10], [33, 34], [27, 20], [42, 26]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 20})">${petals(0, 0, 4, 2.2, 2.2, 1.6, "#F6B42A", SOw(.8))}<circle r="1" fill="#FFE9A0"/></g>`).join("")}
        ${spark(54, 30, 3.4, "#FFE27A")}${spark(12, 18, 2.6, "#FFE27A")}`,
      midautumn_badge: `${lg("n4-ma-bd", "#3A4280", "#1E2450")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#n4-ma-bd)" ${SO}/>
        <circle cx="49" cy="21" r="9" fill="#FFF0B8" ${S2}/>
        ${T("FULL", 26, 30, 10, "#FFE08A", 26)}${T("MOON!", 30, 42.5, 11, "#FFFFFF", 38)}
        ${spark(9, 10, 3.4, "#FFE27A")}${spark(56, 56, 3, "#F6B42A")}`
    }},
    pins: [
      {id: "tp-midautumn-mooncake", name: "Mooncake Pin", kind: "badge", desc: "A golden mooncake stamped with a lucky flower pattern.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n4-map-m" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FAD48A"/><stop offset="1" stop-color="#C47E2A"/></radialGradient></defs>
          <circle cx="15" cy="15" r="12" fill="url(#n4-map-m)" stroke="#7A4A14" stroke-width="1.1"/>
          ${Array.from({length: 12}, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${f1(15 + Math.cos(a) * 10)}" cy="${f1(15 + Math.sin(a) * 10)}" r="1.6" fill="#D8923A" stroke="#A8641E" stroke-width=".5"/>`; }).join("")}
          <circle cx="15" cy="15" r="6.4" fill="none" stroke="#A8641E" stroke-width=".9"/>${Array.from({length: 6}, (_, i) => { const a = i / 6 * Math.PI * 2; return `<path d="M15 15L${f1(15 + Math.cos(a) * 5)} ${f1(15 + Math.sin(a) * 5)}" stroke="#A8641E" stroke-width=".8"/>`; }).join("")}
          <ellipse cx="10.4" cy="9.8" rx="2.4" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-35 10.4 9.8)"/></svg>`},
      {id: "tp-midautumn-osmanthus", name: "Osmanthus Washi", kind: "tape", desc: "Moonlit blue washi tape sprinkled with tiny golden osmanthus flowers.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2E3466" opacity=".88"/>
          <path d="M6 18Q24 8 44 14Q62 20 80 8" fill="none" stroke="#6A4A3A" stroke-width="1.2"/>
          ${[[14, 13], [24, 11], [36, 13], [50, 16], [60, 15], [72, 11], [30, 18], [66, 8]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 25})">${petals(0, 0, 4, 1.4, 1.4, 1, "#F6B42A")}<circle r=".6" fill="#FFE9A0"/></g>`).join("")}
          <circle cx="78" cy="19" r="3" fill="#FFF0B8" opacity=".9"/></svg>`}
    ],
    card: {id: "tp-midautumn", name: "Moonlit River", desc: "Pale gold paper with a big full moon in the corner and a lotus lantern drifting on the water below. Deep night blue in dark mode."}
  });
})();
