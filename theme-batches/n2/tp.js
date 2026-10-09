/* Theme Collections, new theme ideas batch n2: mushrooms, sunflowers, cloudkingdom, nighttrain, ramen */
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
  const shut = (x, y, w = 2.6) => `<path d="M${x - w} ${y}q${w} ${w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const happy = (x, y, w = 2.4) => `<path d="M${x - w} ${y}q${w} ${-w * 1.1} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const petals = (cx, cy, n, R, w, rr, fill, sw = 1.6) => Array.from({length: n}, (_, i) => { const a = i * 360 / n; return `<path d="M${cx + rr} ${cy}Q${f1(cx + (rr + R) / 2)} ${cy - w} ${cx + R} ${cy}Q${f1(cx + (rr + R) / 2)} ${cy + w} ${cx + rr} ${cy}z" transform="rotate(${a} ${cx} ${cy})" fill="${fill}" ${SOw(sw)}/>`; }).join("");
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const naruto = (cx, cy, r, sw = 1.8) => { let d = ""; for (let k = 0; k <= 24; k++) { const a = k / 24 * 9.5, q = k / 24 * r * .72; d += (k ? "L" : "M") + f1(cx + Math.cos(a) * q) + " " + f1(cy + Math.sin(a) * q); } return `<path d="${d}" fill="none" stroke="#F27AA0" stroke-width="${sw}" stroke-linecap="round"/>`; };

  /* ================= MUSHROOM HOLLOW ================= */
  TP_DATA.push({
    theme: "mushrooms",
    pack: {name: "Hollow Friends", items: {
      mushrooms_toad: `${rg("n2-mu-cap", "#FF9E86", "#D9443A", .35, .25)}${lg("n2-mu-stem", "#FFFBF2", "#EAD6BC", 1, 0)}
        <path d="M24 34Q22 50 20 56Q32 60 44 56Q42 50 40 34z" fill="url(#n2-mu-stem)" ${SO}/>
        <path d="M6 33C6 15 18 6 32 6C46 6 58 15 58 33C58 37 54 38 48 38H16C10 38 6 37 6 33z" fill="url(#n2-mu-cap)" ${SO}/>
        <ellipse cx="18" cy="22" rx="4.6" ry="3.6" fill="#FFF8EE"/><ellipse cx="33" cy="14" rx="5.4" ry="4" fill="#FFF8EE"/><ellipse cx="47" cy="24" rx="4" ry="3.2" fill="#FFF8EE"/><ellipse cx="29" cy="29" rx="3" ry="2.4" fill="#FFF8EE"/><ellipse cx="42" cy="13" rx="2" ry="1.6" fill="#FFF8EE"/>
        ${EYES(27, 37, 46, 2.3)}${blush(23.5, 40.5, 50, 2.2, 1.4)}${smile(32, 49.6, 2, 1.7)}
        <path d="M14 58Q22 54 26 58M40 58Q46 54 52 58" fill="none" stroke="#6DB35E" stroke-width="2.6" stroke-linecap="round"/>${spark(56, 50, 3.4, "#F6C85A")}`,
      mushrooms_snail: `${rg("n2-mu-sh", "#FFD99A", "#D98A3E", .35, .3)}
        <path d="M6 54Q8 44 18 44H44Q50 38 52 30Q55 24 60 28Q62 40 54 50Q50 56 40 56H10Q6 56 6 54z" fill="#F6DCBC" ${SO}/>
        <path d="M53 29L51 18M57 29L60 19" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/><circle cx="51" cy="17" r="2.6" fill="${O}"/><circle cx="60.5" cy="18" r="2.6" fill="${O}"/><circle cx="51.8" cy="16.2" r=".9" fill="#fff"/><circle cx="61.3" cy="17.2" r=".9" fill="#fff"/>
        <ellipse cx="57" cy="40" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/>${smile(55, 36, 1.8, 1.6)}
        <circle cx="28" cy="32" r="17" fill="url(#n2-mu-sh)" ${SO}/>
        <path d="M28 32m-2 0a2 2 0 1 1 4 0a5 5 0 1 1 -9 -1a8 8 0 1 1 15 4a11 11 0 1 1 -20 -6" fill="none" stroke="#A85E26" stroke-width="2.2" stroke-linecap="round"/>
        ${SHINE(21, 22, 3.6, 2, -35)}${spark(8, 12, 4, "#8CCB6A")}<circle cx="16" cy="6" r="1.6" fill="#F6C85A"/>`,
      mushrooms_fern: `${lg("n2-mu-fern", "#A6DA7E", "#4F9A55", 0, 1)}
        <path d="M30 60Q28 44 33 30Q38 16 30 12Q22 9 20 17Q19 23 25 24Q30 24 29 19" fill="none" stroke="${O}" stroke-width="7.4" stroke-linecap="round"/>
        <path d="M30 60Q28 44 33 30Q38 16 30 12Q22 9 20 17Q19 23 25 24Q30 24 29 19" fill="none" stroke="url(#n2-mu-fern)" stroke-width="4" stroke-linecap="round"/>
        ${[[31, 52, -1], [31, 44, 1], [33, 36, -1], [34, 29, 1]].map(([x, y, s]) => `<path d="M${x} ${y}Q${x + s * 10} ${y - 8} ${x + s * 18} ${y - 4}Q${x + s * 10} ${y + 1} ${x} ${y}z" fill="#8CCB6A" ${S15}/>`).join("")}
        ${EYES(22.5, 28.5, 17.6, 1.5)}${blush(20.5, 31, 21, 1.6, 1.1)}
        ${spark(48, 14, 4, "#F6C85A")}${spark(12, 40, 3, "#8CCB6A")}<circle cx="50" cy="52" r="1.8" fill="#C8A0F0"/>`,
      mushrooms_acorn: `${lg("n2-mu-ac", "#E8A868", "#B86E34")}${lg("n2-mu-cup", "#A87A50", "#6E4A2E")}
        <path d="M14 30Q14 52 32 58Q50 52 50 30z" fill="url(#n2-mu-ac)" ${SO}/>
        <path d="M10 30Q10 16 32 14Q54 16 54 30Q54 34 50 34H14Q10 34 10 30z" fill="url(#n2-mu-cup)" ${SO}/>
        <path d="M16 24l4 4M24 20l4 4M32 18l4 4M40 20l4 4M18 30l3-3M28 28l3-3M38 28l3-3M46 28l3-3" stroke="#5A3A22" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M32 14Q31 8 36 5" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M32 14Q31 8 36 5" fill="none" stroke="#7A5232" stroke-width="2" stroke-linecap="round"/>
        ${EYES(26, 38, 42, 2.3)}${blush(22, 42, 47, 2.3, 1.5)}${smile(32, 46.4, 2, 1.7)}${SHINE(20, 38, 2.4, 4, 10)}`,
      mushrooms_glow: `${rg("n2-mu-g1", "#C8FFFF", "#4FC8E0", .4, .3)}${rg("n2-mu-g2", "#D8E0FF", "#7A90F0", .4, .3)}
        <circle cx="32" cy="34" r="27" fill="#1E2A48" ${SO}/>
        <circle cx="32" cy="38" r="20" fill="#5FD6E8" opacity=".18"/>
        <path d="M22 54V40M42 54V44M32 54V36" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M22 54V40M42 54V44M32 54V36" stroke="#DCE6FF" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M13 40Q14 30 22 30Q30 30 31 40z" fill="url(#n2-mu-g1)" ${S2}/><path d="M35 44Q36 35 42 35Q49 35 50 44z" fill="url(#n2-mu-g2)" ${S2}/><path d="M23 36Q24 24 32 24Q40 24 41 36z" fill="url(#n2-mu-g1)" ${S2}/>
        <circle cx="29" cy="30" r="1.6" fill="#fff"/><circle cx="35" cy="28" r="1.2" fill="#fff"/><circle cx="18" cy="35" r="1.3" fill="#fff"/>
        ${spark(16, 18, 2.6, "#B8F6FF")}${spark(48, 22, 2.2, "#C8FFE8")}<circle cx="40" cy="16" r="1.4" fill="#fff"/><circle cx="24" cy="14" r="1" fill="#fff"/><circle cx="50" cy="32" r="1" fill="#B8F6FF"/>`,
      mushrooms_ring: `${["#F48A8A", "#F6B26B", "#F2D55E", "#9BD77A", "#6FD1C6", "#79A8F2"].map((c, i) => { const a = Math.PI + i / 5 * Math.PI, x = f1(32 + Math.cos(a) * 22), y = f1(44 + Math.sin(a) * -6 + 6); return `<path d="M${x - 1.6} ${y + 8}V${y}h3.2V${y + 8}z" fill="#FFF8EE" ${SOw(1.4)}/><path d="M${x - 7} ${y + 1}Q${x - 6} ${y - 7} ${x} ${y - 7}Q${x + 6} ${y - 7} ${x + 7} ${y + 1}z" fill="${c}" ${SOw(1.6)}/><circle cx="${x - 2}" cy="${y - 3}" r="1" fill="#fff"/>`; }).join("")}
        <path d="M18 8v12M18 8l8-2v12" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/><ellipse cx="16" cy="20" rx="3" ry="2.2" fill="#A98BEA" ${SOw(1.4)}/><ellipse cx="24" cy="18" rx="3" ry="2.2" fill="#A98BEA" ${SOw(1.4)}/>
        <path d="M44 12v10" stroke="${O}" stroke-width="2" stroke-linecap="round"/><path d="M44 12q5 1 6 6" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/><ellipse cx="42" cy="22.5" rx="3" ry="2.2" fill="#F49AC8" ${SOw(1.4)}/>
        ${spark(33, 24, 3, "#F6C85A")}${spark(56, 30, 2.4, "#79A8F2")}`,
      mushrooms_hazel: `${rg("n2-mu-hz", "#E8B078", "#A8642E", .35, .3)}
        <path d="M32 58C18 58 10 48 10 36C10 26 20 20 32 20C44 20 54 26 54 36C54 48 46 58 32 58z" fill="url(#n2-mu-hz)" ${SO}/>
        <path d="M14 26Q16 12 32 10Q48 12 50 26Q42 22 32 22Q22 22 14 26z" fill="#9ACB6A" ${SO}/><path d="M22 14Q28 18 32 14Q36 18 42 14" fill="none" stroke="#5E9A4E" stroke-width="1.6" stroke-linecap="round"/>
        ${shut(25.5, 38, 2.4)}${shut(36.5, 38, 2.4)}${blush(21, 43, 43, 2.4, 1.5)}${smile(32, 45, 1.8, 1.7)}${SHINE(19, 32, 3, 2, -30)}
        ${T("z", 52, 14, 9, "#8C93D8")}${T("z", 58, 7, 6.5, "#B5BAE8")}`,
      mushrooms_sign: `${lg("n2-mu-wd", "#D9A46A", "#A8703E")}
        <path d="M30 44V62M34 44V62" stroke="${O}" stroke-width="5.6" stroke-linecap="round"/><path d="M30 44V62M34 44V62" stroke="#8A5A34" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="4" y="16" width="56" height="30" rx="8" fill="url(#n2-mu-wd)" ${SO}/>
        <path d="M8 22Q20 12 30 18Q40 10 52 16Q58 14 60 20" fill="none" stroke="#6DB35E" stroke-width="4" stroke-linecap="round"/>
        ${T("GROW SLOW", 32, 37.5, 9.5, "#5A3420", 46)}
        <path d="M50 14Q50 8 55 8Q60 8 60 14z" fill="#E45A48" ${SOw(1.5)}/><circle cx="53.5" cy="11" r="1" fill="#fff"/>${spark(8, 52, 3, "#8CCB6A")}`
    }},
    pins: [
      {id: "tp-mushrooms-toad", name: "Toadstool Pin", kind: "badge", desc: "A glossy red toadstool with white spots.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n2-mu-pin" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="#FF9E86"/><stop offset="1" stop-color="#C8382E"/></radialGradient></defs>
          <path d="M12 16Q11.4 23 10.6 26Q15 27.6 19.4 26Q18.6 23 18 16z" fill="#FFF8EE" stroke="#6A2A22" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M3 16C3 8 8.4 3.6 15 3.6C21.6 3.6 27 8 27 16C27 18 25.4 18.4 22 18.4H8C4.6 18.4 3 18 3 16z" fill="url(#n2-mu-pin)" stroke="#6A2A22" stroke-width="1.1" stroke-linejoin="round"/>
          <ellipse cx="9" cy="11" rx="2.2" ry="1.7" fill="#FFF8EE"/><ellipse cx="16" cy="7.6" rx="2.6" ry="1.9" fill="#FFF8EE"/><ellipse cx="22" cy="12" rx="1.9" ry="1.5" fill="#FFF8EE"/><ellipse cx="14" cy="14" rx="1.4" ry="1.1" fill="#FFF8EE"/></svg>`},
      {id: "tp-mushrooms-moss", name: "Moss and Spots Washi", kind: "tape", desc: "Moss green washi tape scattered with tiny red toadstools and spores.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#7DB264" opacity=".88"/>
          ${[12, 34, 56, 76].map((x, i) => `<path d="M${x - 1.2} 19V14h2.4V19z" fill="#FFF8EE"/><path d="M${x - 5} 14.6Q${x - 4.4} 8.6 ${x} 8.6Q${x + 4.4} 8.6 ${x + 5} 14.6z" fill="${i % 2 ? "#F2C24A" : "#E45A48"}"/><circle cx="${x - 1.6}" cy="11.6" r=".9" fill="#fff"/>`).join("")}
          ${[[23, 9], [45, 17], [66, 8], [7, 7], [82, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#FFF4C2"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-mushrooms", name: "Forest Floor", desc: "Mossy cream paper with a red toadstool in the corner and ferns below. Deep glowing blue in dark mode."}
  });

  /* ================= SUNFLOWER FIELD ================= */
  TP_DATA.push({
    theme: "sunflowers",
    pack: {name: "Sunny Field", items: {
      sunflowers_bloom: `${lg("n2-sf-p", "#FFE680", "#F5A51A")}${rg("n2-sf-c", "#A8683A", "#5A3018", .4, .35)}
        ${petals(32, 32, 14, 29, 6.4, 12, "url(#n2-sf-p)", 1.6)}
        <circle cx="32" cy="32" r="14" fill="url(#n2-sf-c)" ${SO}/>
        ${[...Array(10)].map((_, k) => { const a = k * 2.4, r = Math.sqrt(k / 10) * 10; return `<circle cx="${f1(32 + Math.cos(a) * r)}" cy="${f1(32 + Math.sin(a) * r)}" r=".9" fill="#E8A860" opacity=".6"/>`; }).join("")}
        ${EYES(27, 37, 31, 2.2)}${blush(24, 40, 35.4, 2, 1.3)}${smile(32, 35, 2, 1.7)}`,
      sunflowers_bee: `${lg("n2-sf-b", "#FFE06A", "#F5B21F")}
        <ellipse cx="24" cy="18" rx="9" ry="12" transform="rotate(-25 24 18)" fill="#EAF6FF" opacity=".95" ${S15}/><ellipse cx="38" cy="16" rx="8" ry="11" transform="rotate(20 38 16)" fill="#EAF6FF" opacity=".95" ${S15}/>
        <path d="M8 38C8 26 18 22 32 22C46 22 56 28 56 38C56 48 46 54 32 54C18 54 8 50 8 38z" fill="url(#n2-sf-b)" ${SO}/>
        <path d="M20 23.5Q16 38 20 52.6M30 22Q26 38 30 54M40 22.6Q37 38 40 53.6" fill="none" stroke="${O}" stroke-width="4.4"/>
        <path d="M56 38L62 36L56 41" fill="${O}"/>
        ${EYES(46, 52, 34, 2)}<ellipse cx="50" cy="40" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".8"/>${smile(49, 38.6, 1.6, 1.5)}
        <path d="M48 23Q50 14 46 10M52 24Q57 16 56 11" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/><circle cx="46" cy="10" r="1.8" fill="${O}"/><circle cx="56" cy="11" r="1.8" fill="${O}"/>`,
      sunflowers_barn: `${lg("n2-sf-br", "#E8584A", "#B8362E")}
        <path d="M6 58V30L32 10L58 30V58z" fill="url(#n2-sf-br)" ${SO}/>
        <path d="M2 31L32 7L62 31" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 31L32 7L62 31" fill="none" stroke="#7A2C2C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="20" y="36" width="24" height="22" fill="#FFF8EE" ${S2}/><path d="M20 36L44 58M44 36L20 58" stroke="#B8362E" stroke-width="2.4"/><path d="M32 36V58" stroke="#B8362E" stroke-width="1.6"/>
        <rect x="27" y="20" width="10" height="9" rx="1.5" fill="#FFF8EE" ${SOw(1.6)}/>
        ${shut(28.5, 25, 1.6)}${shut(35.5, 25, 1.6)}
        <path d="M6 58H58" stroke="${O}" stroke-width="2.5"/>${spark(56, 10, 4, "#F6C431")}`,
      sunflowers_bale: `${lg("n2-sf-h", "#F6D27A", "#D9A040")}
        <rect x="6" y="18" width="52" height="36" rx="9" fill="url(#n2-sf-h)" ${SO}/>
        <path d="M10 30H54M10 42H54" stroke="#C8902E" stroke-width="1.6" stroke-linecap="round"/><path d="M22 18V54M42 18V54" stroke="#B8402E" stroke-width="3"/>
        <path d="M8 18l-3-5M16 18l-1-6M48 18l2-6M56 19l4-4M10 54l-4 4M56 53l4 4" stroke="#D9A040" stroke-width="2" stroke-linecap="round"/>
        ${EYES(27, 37, 34, 2.3)}${blush(24, 40, 39, 2.2, 1.4)}${smile(32, 38.4, 2, 1.7)}`,
      sunflowers_seed: `${lg("n2-sf-s", "#6A5A4A", "#3A2E26", 1, 0)}
        <path d="M32 6C46 16 50 34 44 48C40 56 24 56 20 48C14 34 18 16 32 6z" fill="url(#n2-sf-s)" ${SO}/>
        <path d="M27 14Q24 30 26 48M37 14Q40 30 38 48" fill="none" stroke="#E8DCC8" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="27" cy="36" r="2.6" fill="#fff"/><circle cx="37" cy="36" r="2.6" fill="#fff"/><circle cx="27.4" cy="36.4" r="1.5" fill="${O}"/><circle cx="37.4" cy="36.4" r="1.5" fill="${O}"/>
        ${blush(24, 40, 41.5, 2, 1.3)}<path d="M30 42q2 1.6 4 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>${spark(52, 12, 4, "#F6C431")}${spark(12, 50, 3, "#F6C431")}`,
      sunflowers_sun: `${rg("n2-sf-sun", "#FFF6C2", "#FFC21F", .4, .35)}
        ${Array.from({length: 12}, (_, i) => `<path d="M32 2L35.4 10H28.6z" transform="rotate(${i * 30} 32 32)" fill="#FFB020" ${SOw(1.4)}/>`).join("")}
        <circle cx="32" cy="32" r="19" fill="url(#n2-sf-sun)" ${SO}/>
        ${happy(26, 31, 2.4)}${happy(38, 31, 2.4)}${blush(23, 41, 36, 2.6, 1.6)}<path d="M28 37q4 4 8 0" fill="#E85A4A" ${SOw(1.5)}/>${SHINE(24, 22, 3.4, 2, -35)}`,
      sunflowers_honey: `${lg("n2-sf-jar", "#FFD86B", "#E8A020")}
        <path d="M14 24Q10 26 10 34V52Q10 58 18 58H46Q54 58 54 52V34Q54 26 50 24z" fill="url(#n2-sf-jar)" ${SO}/>
        <rect x="12" y="14" width="40" height="11" rx="4" fill="#C8682E" ${SO}/><path d="M18 14Q20 8 26 12Q30 6 34 12Q40 8 44 14" fill="none" stroke="#F6E2B0" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="18" y="34" width="28" height="16" rx="4" fill="#FFF6DC" ${S15}/>${T("HONEY", 32, 45.5, 7.6, "#B8682E", 22)}
        <path d="M24 25Q24 31 26 31Q28 31 28 25" fill="#E8A020" ${SOw(1.3)}/>${SHINE(16, 34, 2.4, 5, 0)}${spark(56, 14, 3.6, "#F6C431")}`,
      sunflowers_badge: `${lg("n2-sf-bd", "#5E9A3E", "#3A7A2A")}
        <rect x="4" y="18" width="56" height="30" rx="15" fill="url(#n2-sf-bd)" ${SO}/>
        <rect x="8.5" y="22.5" width="47" height="21" rx="10.5" fill="none" stroke="#FFE680" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>
        ${T("SHINE ON", 32, 37.8, 11, "#FFE680", 40)}
        ${petals(52, 14, 10, 9, 2.4, 3.4, "#FFC21F", 1.2)}<circle cx="52" cy="14" r="3.6" fill="#7A4A1E" ${SOw(1.2)}/>${spark(10, 54, 3.4, "#F6C431")}`
    }},
    pins: [
      {id: "tp-sunflowers-bloom", name: "Sunflower Pin", kind: "badge", desc: "A golden sunflower with a smiling brown center.",
        svg: `<svg viewBox="0 0 30 30">${Array.from({length: 12}, (_, i) => `<path d="M15 15L13 4.5Q15 2 17 4.5z" transform="rotate(${i * 30} 15 15)" fill="#FFC21F" stroke="#8A5A10" stroke-width=".8" stroke-linejoin="round"/>`).join("")}
          <circle cx="15" cy="15" r="6.6" fill="#7A4A1E" stroke="#4A2A10" stroke-width="1"/><circle cx="13" cy="13" r="1.6" fill="#A8683A"/><circle cx="17" cy="16.5" r="1" fill="#A8683A"/></svg>`},
      {id: "tp-sunflowers-washi", name: "Sunflower Washi", kind: "tape", desc: "Sky blue washi tape with sunflowers and buzzing bees.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#8EC8EE" opacity=".88"/>
          ${[14, 42, 70].map(x => `${Array.from({length: 8}, (_, i) => `<ellipse cx="${x}" cy="8" rx="1.6" ry="3.6" transform="rotate(${i * 45} ${x} 13)" fill="#FFC21F"/>`).join("")}<circle cx="${x}" cy="13" r="3" fill="#7A4A1E"/>`).join("")}
          ${[28, 56].map(x => `<ellipse cx="${x}" cy="14" rx="3.4" ry="2.4" fill="#FFD23F"/><path d="M${x - 1} 11.8v4.4M${x + 1.2} 11.8v4.4" stroke="#3A2A20" stroke-width="1"/><ellipse cx="${x - 1}" cy="10.6" rx="1.6" ry="1.1" fill="#fff"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-sunflowers", name: "Field Notes", desc: "Sunny cream paper with a sunflower peeking in and a row of blooms along the bottom. Twilight blue in dark mode."}
  });

  /* ================= CLOUD KINGDOM ================= */
  TP_DATA.push({
    theme: "cloudkingdom",
    pack: {name: "Sky Isles", items: {
      cloudkingdom_island: `${lg("n2-ck-r", "#D8B496", "#A8826A")}${lg("n2-ck-w", "#BFE6FF", "#7FC4F0")}
        <path d="M10 28Q20 62 32 58Q46 56 54 28z" fill="url(#n2-ck-r)" ${SO}/><path d="M20 38H30M28 46H40M34 36H44" stroke="#8A6A54" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M50 29V58" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M50 29V58" stroke="url(#n2-ck-w)" stroke-width="3.6" stroke-linecap="round"/>
        <ellipse cx="32" cy="28" rx="25" ry="6" fill="#7FD06E" ${SO}/>
        <path d="M22 26V16" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M22 26V16" stroke="#8A6040" stroke-width="2.4" stroke-linecap="round"/><circle cx="22" cy="12" r="8" fill="#5AB860" ${SO}/>
        <path d="M34 26V18h10V26z" fill="#FFF6EA" ${S15}/><path d="M32 19L39 12L46 19z" fill="#F07A6A" ${S15}/><rect x="37.4" y="21" width="3.2" height="5" rx="1" fill="#8A5A44"/>
        ${spark(54, 8, 4, "#FFD86B")}<circle cx="8" cy="12" r="1.6" fill="#B9A0F0"/>`,
      cloudkingdom_cloud: `${lg("n2-ck-c", "#FFFFFF", "#DCE4FA")}
        <path d="M14 48C6 48 4 38 11 35C9 25 20 20 26 25C29 15 45 14 47 25C56 23 61 33 55 39C61 44 56 50 50 48z" fill="url(#n2-ck-c)" ${SO}/>
        ${EYES(26, 40, 36, 2.4)}${blush(22, 44, 41, 2.6, 1.6)}${smile(33, 40.6, 2.2, 1.8)}
        <path d="M22 54l-2 5M32 54l-2 5M42 54l-2 5" stroke="#7FC4F0" stroke-width="2.4" stroke-linecap="round"/>${spark(54, 12, 3.6, "#FFD86B")}`,
      cloudkingdom_kite: `<path d="M32 4L54 26L32 50L10 26z" fill="#FF8FA8" ${SO}/><path d="M32 4L32 50M10 26H54" stroke="${O}" stroke-width="1.6"/>
        <path d="M32 4L54 26H32z" fill="#FFD86B"/><path d="M10 26L32 50V26z" fill="#8FD8FF"/><path d="M32 4L54 26L32 50L10 26z" fill="none" ${SO}/>
        <path d="M32 50Q28 56 34 58Q40 60 36 63" fill="none" stroke="${O}" stroke-width="1.4"/><path d="M28 55l-4-2v5zM40 60l4-2v5z" fill="#B9A0F0" ${SOw(1.2)}/>
        <circle cx="29" cy="24" r="2" fill="${O}"/><circle cx="35" cy="24" r="2" fill="${O}"/>${blush(26.5, 37.5, 29, 1.8, 1.2)}${smile(32, 28.6, 1.6, 1.5)}`,
      cloudkingdom_rainbow: `${["#FF6F7F", "#FFA552", "#FFD84A", "#6FCF6A", "#5AB8F0", "#B07AE8"].map((c, i) => `<path d="M${8 + i * 3.4} 46A${24 - i * 3.4} ${24 - i * 3.4} 0 0 1 ${56 - i * 3.4} 46" fill="none" stroke="${c}" stroke-width="3.6"/>`).join("")}
        <path d="M8 46A24 24 0 0 1 56 46M28.4 46A3.6 3.6 0 0 1 35.6 46" fill="none" stroke="${O}" stroke-width="1.5"/>
        <path d="M4 52C0 52 0 45 5 44C5 38 13 37 15 41C19 38 25 42 23 47C26 49 24 53 20 53z" fill="#fff" ${SO}/><path d="M60 52C64 52 64 45 59 44C59 38 51 37 49 41C45 38 39 42 41 47C38 49 40 53 44 53z" fill="#fff" ${SO}/>
        ${shut(10, 47, 1.5)}${shut(17, 47, 1.5)}${shut(47, 47, 1.5)}${shut(54, 47, 1.5)}${spark(32, 12, 3.6, "#FFD86B")}`,
      cloudkingdom_castle: `${lg("n2-ck-ca", "#F6F0FF", "#D6CCF0")}
        <path d="M6 54C2 54 2 47 8 46C8 40 16 40 18 44C22 40 30 44 28 49C32 50 30 55 26 55z" fill="#fff" ${SO}/>
        <rect x="18" y="24" width="28" height="28" fill="url(#n2-ck-ca)" ${SO}/><rect x="12" y="18" width="10" height="34" fill="url(#n2-ck-ca)" ${SO}/><rect x="42" y="18" width="10" height="34" fill="url(#n2-ck-ca)" ${SO}/>
        <path d="M10 19L17 6L24 19z" fill="#FF8FB8" ${S2}/><path d="M40 19L47 6L54 19z" fill="#FF8FB8" ${S2}/><path d="M24 25L32 12L40 25z" fill="#B9A0F0" ${S2}/>
        <path d="M28 52V44a4 4 0 0 1 8 0V52z" fill="#8A6AC8" ${SOw(1.5)}/><circle cx="17" cy="30" r="2" fill="#FFD86B"/><circle cx="47" cy="30" r="2" fill="#FFD86B"/>
        ${shut(29, 33, 1.6)}${shut(35, 33, 1.6)}${blush(27, 37.6, 37, 1.6, 1.1)}
        <path d="M58 56C62 56 62 50 57 49C57 44 50 44 49 48C45 46 41 50 43 53z" fill="#fff" ${SO}/>${spark(30, 4, 3, "#FFD86B")}`,
      cloudkingdom_drop: `${lg("n2-ck-d", "#CFEFFF", "#5AB8F0")}
        <path d="M32 6C40 20 50 30 50 42C50 52 42 58 32 58C22 58 14 52 14 42C14 30 24 20 32 6z" fill="url(#n2-ck-d)" ${SO}/>
        ${EYES(26, 38, 41, 2.4)}${blush(22.5, 41.5, 46, 2.4, 1.5)}${smile(32, 45.6, 2, 1.7)}<path d="M21 34Q21 24 28 17" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>${spark(54, 12, 3.6, "#FFD86B")}`,
      cloudkingdom_plane: `<path d="M4 34L58 10L40 54L30 40z" fill="#FFFFFF" ${SO}/><path d="M30 40L58 10L24 44z" fill="#DCE4FA" ${SO}/><path d="M24 44L30 40L28 52z" fill="#C8D2F0" ${S2}/>
        <path d="M6 50Q12 46 16 50M2 58Q10 54 16 58" fill="none" stroke="#8FB0F0" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3"/>
        ${spark(52, 44, 4, "#FFD86B")}<circle cx="16" cy="16" r="1.8" fill="#FF8FB8"/>`,
      cloudkingdom_badge: `${lg("n2-ck-bd", "#7A90F0", "#5A62D0")}
        <path d="M10 48C2 48 2 36 10 34C8 24 20 18 26 24C30 14 46 14 48 24C56 22 62 32 56 38C62 42 58 48 52 48z" fill="url(#n2-ck-bd)" ${SO}/>
        ${T("DREAM BIG", 32, 40, 10, "#FFFFFF", 38)}${spark(12, 12, 4, "#FFD86B")}${spark(54, 54, 3.4, "#FF8FB8")}<circle cx="50" cy="12" r="1.6" fill="#B9A0F0"/>`
    }},
    pins: [
      {id: "tp-cloudkingdom-cloud", name: "Cloud Pin", kind: "badge", desc: "A fluffy little cloud with a sleepy smile.",
        svg: `<svg viewBox="0 0 30 30"><path d="M7 22C3 22 2.4 17 6 16C5.4 11 11 9 13.4 12C15 7 22.6 7.4 23 12.6C27 12.4 28.6 17.6 25.4 19.6C27 21.6 25.4 22.6 23.4 22z" fill="#FFFFFF" stroke="#5A62A0" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M11.4 17q1.2 1 2.4 0M17.4 17q1.2 1 2.4 0" fill="none" stroke="#2B2233" stroke-width="1" stroke-linecap="round"/><ellipse cx="10" cy="19" rx="1.3" ry=".8" fill="#FF8FA8"/><ellipse cx="21.2" cy="19" rx="1.3" ry=".8" fill="#FF8FA8"/></svg>`},
      {id: "tp-cloudkingdom-rainbow", name: "Rainbow Washi", kind: "tape", desc: "Pastel rainbow stripes with little white clouds.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFFFFF" opacity=".5"/>
          ${["#FF9AA8", "#FFC08A", "#FFE69A", "#A8E6A0", "#9AD0FF", "#C8B0F8"].map((c, i) => `<rect x="4" y="${2 + i * 3.7}" width="79" height="3.8" fill="${c}" opacity=".85"/>`).join("")}
          ${[16, 46, 72].map(x => `<path d="M${x - 7} 16C${x - 9} 16 ${x - 9} 12 ${x - 6} 12C${x - 6} 9 ${x - 1} 8 ${x} 10C${x + 2} 7 ${x + 7} 8 ${x + 7} 12C${x + 10} 12 ${x + 10} 16 ${x + 7} 16z" fill="#fff"/>`).join("")}</svg>`}
    ],
    card: {id: "tp-cloudkingdom", name: "Cloud Paper", desc: "Soft sky paper with a floating island in the corner and puffy clouds drifting below. Lavender night in dark mode."}
  });

  /* ================= NIGHT TRAIN ================= */
  TP_DATA.push({
    theme: "nighttrain",
    pack: {name: "All Aboard", items: {
      nighttrain_engine: `${lg("n2-nt-b", "#E8584A", "#B8362E")}${lg("n2-nt-k", "#4A4A6A", "#2A2A40")}
        <rect x="22" y="6" width="10" height="12" rx="2" fill="url(#n2-nt-k)" ${SO}/><path d="M18 4Q27 -2 36 4" fill="none" stroke="#D9D4E8" stroke-width="3" stroke-linecap="round"/>
        <path d="M10 22Q10 16 16 16H48Q54 16 54 22V46H10z" fill="url(#n2-nt-b)" ${SO}/>
        <circle cx="32" cy="32" r="13" fill="#2A2A40" ${SO}/><circle cx="32" cy="32" r="10" fill="#FFF6E0"/>
        ${EYES(28, 36, 31, 1.8)}${blush(25.5, 38.5, 35, 1.7, 1.1)}${smile(32, 34.6, 1.6, 1.5)}
        <rect x="6" y="44" width="52" height="7" rx="3" fill="#2A2A40" ${SO}/><path d="M8 51L4 58H60L56 51" fill="#D9A848" ${SO}/>
        <circle cx="16" cy="56" r="5" fill="#2A2A40" ${S2}/><circle cx="48" cy="56" r="5" fill="#2A2A40" ${S2}/><circle cx="16" cy="56" r="1.6" fill="#D9A848"/><circle cx="48" cy="56" r="1.6" fill="#D9A848"/>
        <circle cx="14" cy="22" r="3" fill="#FFE08A" ${SOw(1.4)}/><circle cx="50" cy="22" r="3" fill="#FFE08A" ${SOw(1.4)}/>`,
      nighttrain_ticket: `${lg("n2-nt-t", "#FFF4D8", "#F2DCA8")}
        <path d="M4 18H60V28A4 4 0 0 0 60 36V46H4V36A4 4 0 0 0 4 28z" fill="url(#n2-nt-t)" ${SO} transform="rotate(-8 32 32)"/>
        <g transform="rotate(-8 32 32)"><path d="M44 19V45" stroke="#C8A070" stroke-width="1.6" stroke-dasharray="2.4 2.4"/>
        ${T("ADMIT", 24, 30, 8, "#B8484C", 26)}${T("ONE", 24, 40, 8.6, "#B8484C", 18)}
        <circle cx="52" cy="25" r="2.2" fill="#F2F0F6" ${SOw(1.2)}/><circle cx="52" cy="32" r="2.2" fill="#F2F0F6" ${SOw(1.2)}/><circle cx="52" cy="39" r="2.2" fill="#F2F0F6" ${SOw(1.2)}/></g>
        ${spark(56, 8, 3.6, "#FFC27A")}<circle cx="8" cy="56" r="1.6" fill="#B8484C"/>`,
      nighttrain_tea: `${lg("n2-nt-cup", "#FFFFFF", "#E6DCD4", 1, 0)}
        <path d="M24 18Q20 12 24 8M32 18Q28 11 32 6M40 18Q36 12 40 8" fill="none" stroke="#B8C8E8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M48 30A8 8 0 1 1 48 46" fill="none" stroke="${O}" stroke-width="6.4"/><path d="M48 30A8 8 0 1 1 48 46" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <path d="M12 24H52Q52 50 40 54H24Q12 50 12 24z" fill="url(#n2-nt-cup)" ${SO}/><ellipse cx="32" cy="25" rx="19" ry="3.6" fill="#C8783A" ${SOw(1.6)}/>
        <path d="M14 34H50" stroke="#E8889A" stroke-width="3"/>
        ${shut(27.5, 41, 2)}${shut(36.5, 41, 2)}${blush(23.5, 40.5, 45, 2, 1.3)}<path d="M6 58H58" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="32" cy="56" rx="22" ry="3" fill="#F4EEE8" ${S2}/>`,
      nighttrain_case: `${lg("n2-nt-s", "#C8905A", "#8A5A34")}
        <path d="M24 16V10Q24 7 27 7H37Q40 7 40 10V16" fill="none" stroke="${O}" stroke-width="5.4"/><path d="M24 16V10Q24 7 27 7H37Q40 7 40 10V16" fill="none" stroke="#5A3A22" stroke-width="2.6"/>
        <rect x="6" y="16" width="52" height="40" rx="7" fill="url(#n2-nt-s)" ${SO}/><path d="M18 16V56M46 16V56" stroke="#5A3A22" stroke-width="3"/>
        <circle cx="30" cy="28" r="6" fill="#8FD8FF" ${SOw(1.4)}/><path d="M27 28h6M30 25v6" stroke="#fff" stroke-width="1.4"/><rect x="34" y="38" width="12" height="9" rx="2" fill="#FFD86B" ${SOw(1.4)} transform="rotate(10 40 42)"/>
        <path d="M10 44l6-4l2 6z" fill="#FF8FA8" ${SOw(1.3)}/>${spark(25, 46, 3.4, "#fff")}${spark(56, 8, 3.6, "#FFC27A")}`,
      nighttrain_lamp: `${lg("n2-nt-l", "#F07A6A", "#B8484C")}${rg("n2-nt-gl", "#FFF6C8", "#FFD27A", .5, .4)}
        <path d="M32 58V30" stroke="${O}" stroke-width="5.4" stroke-linecap="round"/><path d="M32 58V30" stroke="#D9A848" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="32" cy="58" rx="14" ry="3.6" fill="#D9A848" ${S2}/>
        <path d="M32 40L20 56H44z" fill="#FFE6A0" opacity=".45"/>
        <path d="M22 10H42L52 34Q32 40 12 34z" fill="url(#n2-nt-l)" ${SO}/><ellipse cx="32" cy="35" rx="8" ry="3.4" fill="url(#n2-nt-gl)" ${SOw(1.4)}/>
        ${shut(27, 24, 1.8)}${shut(37, 24, 1.8)}${blush(24.5, 39.5, 28, 1.8, 1.2)}<path d="M18 30H46" stroke="#D9A848" stroke-width="1.6"/>`,
      nighttrain_window: `${lg("n2-nt-w", "#1E2650", "#5B4A6A")}
        <path d="M10 58V24Q10 6 32 6Q54 6 54 24V58z" fill="#7A4C30" ${SO}/><path d="M15 54V25Q15 11 32 11Q49 11 49 25V54z" fill="url(#n2-nt-w)"/>
        <path d="M15 46Q24 40 32 44Q40 38 49 42V54H15z" fill="#2C3762"/><path d="M15 50Q26 46 32 49Q42 45 49 48V54H15z" fill="#1E2848"/>
        <circle cx="40" cy="22" r="6" fill="#FFF6DA"/><circle cx="43" cy="20" r="5" fill="#2A3460"/>
        <circle cx="22" cy="20" r="1" fill="#fff"/><circle cx="28" cy="30" r=".8" fill="#fff"/><circle cx="44" cy="34" r=".8" fill="#fff"/><circle cx="20" cy="40" r="1.6" fill="#FFD27A"/><circle cx="26" cy="43" r="1.2" fill="#FFD27A"/>
        <path d="M32 11V54M15 32H49" stroke="#7A4C30" stroke-width="2"/><rect x="6" y="54" width="52" height="6" rx="2" fill="#C48C5C" ${S2}/>`,
      nighttrain_clock: `${lg("n2-nt-c", "#E8C060", "#B8902E")}
        <path d="M32 2V8" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 2V8" stroke="#B8902E" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="32" cy="34" r="25" fill="url(#n2-nt-c)" ${SO}/><circle cx="32" cy="34" r="19" fill="#FFFBF0" ${S2}/>
        ${Array.from({length: 12}, (_, i) => `<path d="M32 17.6V20.4" transform="rotate(${i * 30} 32 34)" stroke="${O}" stroke-width="${i % 3 ? 1.2 : 2}" stroke-linecap="round"/>`).join("")}
        <path d="M32 34L32 23M32 34L40 38" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="34" r="2" fill="#B8484C"/>
        ${blush(22, 42, 42, 2, 1.3)}${spark(58, 12, 3.4, "#FFC27A")}`,
      nighttrain_badge: `${lg("n2-nt-bd", "#3A2C46", "#1E1628")}
        <rect x="4" y="18" width="56" height="30" rx="6" fill="url(#n2-nt-bd)" ${SO}/>
        <rect x="8.5" y="22.5" width="47" height="21" rx="3" fill="none" stroke="#FFC27A" stroke-width="1.4" stroke-dasharray="3 2.4"/>
        ${T("ALL ABOARD", 32, 37.6, 9.6, "#FFD9A0", 42)}
        <path d="M6 54H58M10 54V58M18 54V58M26 54V58M34 54V58M42 54V58M50 54V58" stroke="#8A6A50" stroke-width="2" stroke-linecap="round"/>${spark(56, 10, 4, "#FFC27A")}<circle cx="8" cy="10" r="1.6" fill="#FFD9A0"/>`
    }},
    pins: [
      {id: "tp-nighttrain-ticket", name: "Ticket Pin", kind: "badge", desc: "A tiny golden train ticket with a punched hole.",
        svg: `<svg viewBox="0 0 30 30"><g transform="rotate(-12 15 15)"><path d="M3 9H27V13A2 2 0 0 0 27 17V21H3V17A2 2 0 0 0 3 13z" fill="#F6D27A" stroke="#7A5A1E" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M21 9.6V20.4" stroke="#B8902E" stroke-width=".9" stroke-dasharray="1.4 1.2"/><circle cx="24" cy="15" r="1.6" fill="#FFF6E0" stroke="#7A5A1E" stroke-width=".8"/><path d="M7 13.4H17M7 16.6H14" stroke="#B8484C" stroke-width="1.4" stroke-linecap="round"/></g></svg>`},
      {id: "tp-nighttrain-rails", name: "Railway Washi", kind: "tape", desc: "Night blue washi tape with a little train chugging along the tracks.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2C3762" opacity=".88"/>
          <path d="M4 20H82" stroke="#C8A070" stroke-width="1.2"/>${[8, 16, 24, 32, 40, 48, 56, 64, 72, 80].map(x => `<path d="M${x} 18.6V21.6" stroke="#C8A070" stroke-width="1.6"/>`).join("")}
          <rect x="18" y="10" width="12" height="7" rx="1.5" fill="#E8584A"/><rect x="31" y="11" width="10" height="6" rx="1.2" fill="#F6D27A"/><rect x="42" y="11" width="10" height="6" rx="1.2" fill="#8FD8FF"/><rect x="20" y="6" width="3" height="4" fill="#E8584A"/>
          ${[21, 27, 34, 39, 45, 50].map(x => `<circle cx="${x}" cy="17.6" r="1.2" fill="#1A1A2A"/>`).join("")}<circle cx="64" cy="7" r="2.4" fill="#FFF6DA"/><circle cx="10" cy="7" r=".9" fill="#fff"/><circle cx="76" cy="12" r=".8" fill="#fff"/></svg>`}
    ],
    card: {id: "tp-nighttrain", name: "Train Ticket", desc: "Warm ticket paper with a punched edge, a little steam engine and a rail line along the bottom. Plum night in dark mode."}
  });

  /* ================= RAMEN SHOP ================= */
  TP_DATA.push({
    theme: "ramen",
    pack: {name: "Late Night Slurp", items: {
      ramen_bowl: `${lg("n2-ra-b", "#FFFFFF", "#E6DCD4", 1, 0)}
        <path d="M40 22V6M46 22V6" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M40 22V6M46 22V6" stroke="#D9A46A" stroke-width="2" stroke-linecap="round"/>
        <rect x="34" y="12" width="9" height="14" rx="1" fill="#2E4A34" ${SOw(1.4)} transform="rotate(10 38 19)"/>
        <path d="M4 28H60Q60 52 42 57H22Q4 52 4 28z" fill="url(#n2-ra-b)" ${SO}/><path d="M6 36Q32 44 58 36" fill="none" stroke="#D2464E" stroke-width="3"/>
        <ellipse cx="32" cy="28" rx="28" ry="6.4" fill="#F2C870" ${SO}/>
        <ellipse cx="18" cy="27" rx="6" ry="3.2" fill="#C8806A" ${SOw(1.3)}/><ellipse cx="31" cy="26" rx="5.4" ry="3.6" fill="#fff" ${SOw(1.3)}/><ellipse cx="31" cy="26" rx="2.8" ry="2" fill="#F6A23A"/>
        <ellipse cx="45" cy="28" rx="5" ry="2.8" fill="#fff" ${SOw(1.3)}/>${naruto(45, 28, 4.4, 1.2)}<circle cx="24" cy="30" r="1" fill="#7ACB5A"/><circle cx="38" cy="30.6" r="1" fill="#7ACB5A"/><circle cx="52" cy="26" r="1" fill="#7ACB5A"/>
        ${EYES(26, 38, 45, 2)}${blush(22.5, 41.5, 49, 2, 1.3)}${smile(32, 48.6, 1.8, 1.6)}`,
      ramen_egg: `${lg("n2-ra-e", "#FFFFFF", "#F0E6D8")}${rg("n2-ra-y", "#FFC86A", "#F08A1A", .4, .35)}
        <path d="M32 6C46 6 56 22 56 36C56 50 46 58 32 58C18 58 8 50 8 36C8 22 18 6 32 6z" fill="url(#n2-ra-e)" ${SO}/>
        <circle cx="32" cy="38" r="14" fill="url(#n2-ra-y)" ${S2}/>
        ${EYES(27, 37, 36, 2.2)}${blush(23.5, 40.5, 41, 2, 1.3)}${smile(32, 40.4, 1.8, 1.6)}${SHINE(20, 20, 3.4, 2, -40)}${spark(58, 10, 3.4, "#F6A23A")}`,
      ramen_naruto: `<path d="M8 32C8 18 18 8 32 8C46 8 56 18 56 32C56 46 46 56 32 56C18 56 8 46 8 32z" fill="#FFFFFF" ${SO}/>
        ${[...Array(16)].map((_, i) => `<path d="M32 8L33.4 4.6L35.2 8.2" transform="rotate(${i * 22.5} 32 32)" fill="#fff" ${SOw(1.3)}/>`).join("")}
        ${naruto(32, 32, 20, 3.2)}
        ${EYES(24, 40, 31, 2.2)}${blush(20, 44, 36, 2.2, 1.4)}${SHINE(18, 18, 3, 1.8, -40)}`,
      ramen_lantern: `${rg("n2-ra-l", "#FFA08A", "#D2363E", .4, .4)}
        <path d="M32 2V8" stroke="${O}" stroke-width="2"/><rect x="22" y="8" width="20" height="6" rx="1.5" fill="#2A1C18" ${S15}/>
        <ellipse cx="32" cy="34" rx="20" ry="22" fill="url(#n2-ra-l)" ${SO}/>
        <path d="M13.4 26H50.6M12 34H52M13.4 42H50.6" stroke="#8A2A2A" stroke-width="1.2" opacity=".5"/>
        <rect x="22" y="54" width="20" height="6" rx="1.5" fill="#2A1C18" ${S15}/><path d="M28 60v3M32 60v4M36 60v3" stroke="#E8B040" stroke-width="1.6" stroke-linecap="round"/>
        ${shut(27, 33, 2)}${shut(37, 33, 2)}${blush(24, 40, 37.4, 2, 1.3)}${smile(32, 37.4, 1.6, 1.6)}${SHINE(21, 24, 2.4, 4, 15)}`,
      ramen_neko: `${lg("n2-ra-n", "#FFFFFF", "#F0E8DE")}
        <path d="M44 30Q50 18 46 10" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M44 30Q50 18 46 10" fill="none" stroke="#fff" stroke-width="5.4" stroke-linecap="round"/><circle cx="46" cy="10" r="3" fill="#FFB3C6"/>
        <path d="M14 60V42Q14 30 32 30Q50 30 50 42V60z" fill="url(#n2-ra-n)" ${SO}/><circle cx="32" cy="48" r="6" fill="#F2C24A" ${S15}/><path d="M18 38H46" stroke="#D2464E" stroke-width="3"/>
        <path d="M14 26L14 10L24 18z" fill="#fff" ${SO}/><path d="M50 26L50 10L40 18z" fill="#fff" ${SO}/>
        <ellipse cx="32" cy="26" rx="18" ry="13" fill="url(#n2-ra-n)" ${SO}/><ellipse cx="42" cy="18" rx="5" ry="4" fill="#F2A23A"/>
        ${happy(26, 26, 2.2)}${happy(38, 26, 2.2)}${blush(22, 42, 30, 2, 1.3)}<path d="M30 30q2 1.6 4 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>`,
      ramen_sticks: `<path d="M8 44L52 4M14 48L58 12" stroke="${O}" stroke-width="5.6" stroke-linecap="round"/><path d="M8 44L52 4M14 48L58 12" stroke="#D9A46A" stroke-width="3" stroke-linecap="round"/>
        <path d="M24 32Q20 44 26 50Q32 56 28 62M28 30Q26 42 32 48Q38 54 34 62M32 28Q32 40 38 46Q44 52 40 60" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/>
        <path d="M24 32Q20 44 26 50Q32 56 28 62M28 30Q26 42 32 48Q38 54 34 62M32 28Q32 40 38 46Q44 52 40 60" fill="none" stroke="#F6DC8A" stroke-width="2.4" stroke-linecap="round"/>
        ${spark(54, 40, 3.6, "#F6A23A")}<circle cx="10" cy="10" r="1.6" fill="#D2464E"/>`,
      ramen_gyoza: `${lg("n2-ra-g", "#FFF2DA", "#F2CC90")}
        <path d="M6 42Q8 22 32 18Q56 22 58 42Q58 50 48 50H16Q6 50 6 42z" fill="url(#n2-ra-g)" ${SO}/>
        <path d="M14 26q4 6 0 10M22 21q4 7 0 12M32 19q4 7 0 12M42 21q4 7 0 12M50 26q4 6 0 10" fill="none" stroke="#D9A860" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M10 46Q32 52 54 46" fill="none" stroke="#C8783A" stroke-width="3" stroke-linecap="round"/>
        ${EYES(26, 38, 39, 2.1)}${blush(22.5, 41.5, 43, 2, 1.3)}${smile(32, 42.6, 1.8, 1.6)}${spark(56, 10, 3.6, "#F6A23A")}`,
      ramen_badge: `${lg("n2-ra-bd", "#2B4078", "#1E2C58")}
        <path d="M6 14H58V44Q46 50 32 44Q18 50 6 44z" fill="url(#n2-ra-bd)" ${SO}/>
        <path d="M6 14H58" stroke="#5A3420" stroke-width="5" stroke-linecap="round"/><path d="M24 14V40M40 14V40" stroke="#fff" stroke-width="1" opacity=".35"/>
        ${T("SLURP!", 32, 34, 13, "#FFFFFF", 40)}
        <path d="M18 56Q14 50 18 46M32 58Q28 52 32 48M46 56Q42 50 46 46" fill="none" stroke="#E6DCE8" stroke-width="2.2" stroke-linecap="round"/>`
    }},
    pins: [
      {id: "tp-ramen-naruto", name: "Fishcake Pin", kind: "badge", desc: "A round fishcake slice with a pink swirl.",
        svg: `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="11.4" fill="#FFFFFF" stroke="#8A3A4A" stroke-width="1.2"/>
          ${[...Array(12)].map((_, i) => `<path d="M15 3.6L16 1.6L17 3.8" transform="rotate(${i * 30} 15 15)" fill="#fff" stroke="#8A3A4A" stroke-width=".8"/>`).join("")}
          <path d="M15 15c.8-1 2.4-.4 2.2.9c-.4 2-3 2.2-4.2.6c-1.4-2 .2-4.8 3-4.6c3 .2 4.4 3.2 3.6 5.8" fill="none" stroke="#F27AA0" stroke-width="1.6" stroke-linecap="round"/></svg>`},
      {id: "tp-ramen-noren", name: "Noren Washi", kind: "tape", desc: "Indigo washi tape with white wave crests and steaming bowls.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2B4078" opacity=".9"/>
          ${[10, 30, 50, 70].map(x => `<path d="M${x - 8} 19a8 8 0 0 1 16 0" fill="none" stroke="#fff" stroke-width="1.1" opacity=".55"/><path d="M${x - 5} 19a5 5 0 0 1 10 0" fill="none" stroke="#fff" stroke-width="1" opacity=".45"/>`).join("")}
          ${[20, 60].map(x => `<path d="M${x - 5} 11h10q-1 5 -5 5.4q-4 -.4 -5 -5.4z" fill="#fff"/><path d="M${x - 2} 9q-1 -2 0 -4M${x + 2} 9q-1 -2 0 -4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round"/>`).join("")}</svg>`}
    ],
    card: {id: "tp-ramen", name: "Menu Card", desc: "A warm paper menu card with a steaming bowl in the corner and an indigo noren band across the top. Lantern-lit plum in dark mode."}
  });
})();
