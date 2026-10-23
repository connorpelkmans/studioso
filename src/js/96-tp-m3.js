/* ===== module: 96-tp-m3.js ===== */
/* Theme Collections, Study Fields batch m3: civics, justice, writing */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w, fam) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${fam || "Lexend,Arial Rounded MT Bold,Arial,sans-serif"}" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const rot = (n, f) => Array.from({length: n}, (_, i) => f(i * 360 / n, i)).join("");
  const star = (cx, cy, R, r, n = 5) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + (cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  // small face: eyes, cheeks and a smile, scaled by k
  const face = (x, y, k = 1, gap = 9) => `${EYES(x - gap / 2, x + gap / 2, y, 2.3 * k)}<ellipse cx="${x - gap / 2 - 3.6 * k}" cy="${y + 3.4 * k}" rx="${2.5 * k}" ry="${1.6 * k}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${x + gap / 2 + 3.6 * k}" cy="${y + 3.4 * k}" rx="${2.5 * k}" ry="${1.6 * k}" fill="#FF8FA8" opacity=".8"/><path d="M${x - 2 * k} ${y + 2.6 * k}q${2 * k} ${1.8 * k} ${4 * k} 0" fill="none" stroke="${O}" stroke-width="${1.9 * k}" stroke-linecap="round"/>`;
  // a thick outlined stroke (outline then fill colour), for tusks, jets, string
  const tube = (d, w, c) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 2.8}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const leaf = (x, y, a, l, w, c) => `<path d="M0 0Q${l / 2} ${-w} ${l} 0Q${l / 2} ${w} 0 0z" fill="${c}" ${SOw(1.4)} transform="translate(${x} ${y}) rotate(${a})"/>`;

  /* ================= CIVIC SQUARE ================= */
  // a laurel wreath: two leafy branches curving up around (cx, cy)
  const laurelRing = (cx, cy, r, c, c2, n = 7) => {
    let g = `<path d="M${cx - 4} ${cy + r}A${r} ${r} 0 0 1 ${cx - r * .62} ${cy - r * .78}M${cx + 4} ${cy + r}A${r} ${r} 0 0 0 ${cx + r * .62} ${cy - r * .78}" fill="none" stroke="#4E7A56" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let i = 0; i < n; i++) {
      const t = 108 + i * (126 / (n - 1));
      for (const side of [1, -1]) {
        const th = side > 0 ? t : 180 - t, a = th * Math.PI / 180, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        const tan = side > 0 ? th + 90 : th - 90;
        g += leaf(x.toFixed(1), y.toFixed(1), (tan - side * 34).toFixed(0), 10, 3.8, i % 2 ? c2 : c);
        if (i < n - 1) g += leaf(x.toFixed(1), y.toFixed(1), (tan + side * 30).toFixed(0), 8.5, 3.4, i % 2 ? c : c2);
      }
    }
    return g;
  };
  TP_DATA.push({
    theme: "civics",
    pack: {name: "Order in Class", items: {
      civics_courthouse: `${lg("m3cv-ch-d", "#B6E0D3", "#79B7A4")}${lg("m3cv-ch-w", "#FFFBF2", "#EADFC9")}
        <path d="M32 6.5V3.6" stroke="${O}" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="3.6" r="1.6" fill="#E3B25A" ${SOw(1.3)}/>
        <path d="M19 21C19 12 25 7 32 7C39 7 45 12 45 21z" fill="url(#m3cv-ch-d)" ${SO}/>
        <path d="M27 20Q27.5 12 32 7.5M37 20Q36.5 12 32 7.5" fill="none" stroke="#E9FFF8" stroke-width="1.3" opacity=".8"/>
        <rect x="21" y="18" width="22" height="5" rx="1.5" fill="#EADFC9" ${S2}/>
        <rect x="9" y="33" width="46" height="18" fill="#D4BF9E" ${S2}/>
        <rect x="27" y="39" width="10" height="12" rx="5" fill="#A8876C" ${S15}/>
        ${[11, 20, 39, 48].map(x => `<rect x="${x}" y="34" width="5" height="16.5" fill="#FFFBF3" ${SOw(1.5)}/><path d="M${x + 2.5} 37v11" stroke="#E2D3BA" stroke-width="1.2"/>`).join("")}
        <path d="M17 35h3v8l-1.5-1.6-1.5 1.6z" fill="#EE8F84" ${SOw(1.1)}/><path d="M44 35h3v8l-1.5-1.6-1.5 1.6z" fill="#F0C860" ${SOw(1.1)}/>
        <path d="M5 31L32 16L59 31z" fill="url(#m3cv-ch-w)" ${SO}/>
        <rect x="6" y="30" width="52" height="5" rx="1.5" fill="#FFF8EC" ${S2}/>
        <rect x="6" y="50" width="52" height="4.5" rx="1.5" fill="#EFE5D2" ${S2}/><rect x="3" y="54" width="58" height="5" rx="2" fill="#E2D3BA" ${S2}/>
        ${EYES(27.8, 36.2, 24.6, 1.9)}<ellipse cx="23.6" cy="27.4" rx="2.1" ry="1.3" fill="#FF8FA8" opacity=".85"/><ellipse cx="40.4" cy="27.4" rx="2.1" ry="1.3" fill="#FF8FA8" opacity=".85"/><path d="M30.4 26.6q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${spark(8, 12, 3, "#F0C860")}${spark(56, 10, 2.4, "#F0C860")}`,
      civics_pigeon: `${lg("m3cv-pg-b", "#C4C5DD", "#8E8FB3")}${rg("m3cv-pg-h", "#D3D4E8", "#9C9DBF")}
        <path d="M14 42L3 33Q1.5 42 5 51z" fill="#7C7DA2" ${S2}/>
        <path d="M24 55v4.5M33 55v4.5M22 59.5h4.5M31 59.5h4.5" stroke="#E68A4E" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="30" cy="42" rx="21" ry="15" fill="url(#m3cv-pg-b)" ${SO}/>
        <path d="M14 39Q24 32 36 41Q30 51 17 48z" fill="#A9AACB" ${SOw(1.6)}/>
        <path d="M20 42.5l7 1M19.5 46l6 .8" stroke="#6F7096" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="41" cy="24" r="13" fill="url(#m3cv-pg-h)" ${SO}/>
        <path d="M30.5 31.5Q41 39.5 51.5 31.5" fill="none" stroke="#7FCBAA" stroke-width="3" stroke-linecap="round"/><path d="M32.5 34.5Q41 40.5 49.5 34.5" fill="none" stroke="#B38BD0" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
        ${EYES(36.5, 45.5, 22.5, 2.4)}<path d="M39.3 25.6h3.4L41 29.4z" fill="#F2A65A" ${SOw(1.3)}/>
        <ellipse cx="33" cy="27.5" rx="2.6" ry="1.7" fill="#FF8FA8" opacity=".8"/><ellipse cx="49" cy="27.5" rx="2.6" ry="1.7" fill="#FF8FA8" opacity=".8"/>
        <ellipse cx="35" cy="15" rx="3" ry="1.6" fill="#fff" opacity=".55" transform="rotate(-30 35 15)"/>
        ${leaf(50, 9, -20, 9, 3.4, "#9ACB9E")}${leaf(52, 9, 40, 7, 3, "#7FB585")}`,
      civics_fountain: `${lg("m3cv-ft-s", "#FFFBF2", "#E2D3BA")}${lg("m3cv-ft-w", "#C4ECF7", "#7CC6E0")}
        <path d="M32 13Q20 13 17.5 30M32 13Q44 13 46.5 30" fill="none" stroke="${O}" stroke-width="5.2" stroke-linecap="round"/><path d="M32 13Q20 13 17.5 30M32 13Q44 13 46.5 30" fill="none" stroke="#BFE9F7" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M17 32Q9 35 8 45M47 32Q55 35 56 45" fill="none" stroke="${O}" stroke-width="5.2" stroke-linecap="round"/><path d="M17 32Q9 35 8 45M47 32Q55 35 56 45" fill="none" stroke="#BFE9F7" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M32 3.5C36 9 36.5 12.5 32 15.5C27.5 12.5 28 9 32 3.5z" fill="url(#m3cv-ft-w)" ${S2}/>
        <rect x="29" y="15" width="6" height="16" fill="url(#m3cv-ft-s)" ${S2}/>
        <rect x="28.5" y="35" width="7" height="12" fill="url(#m3cv-ft-s)" ${S2}/>
        <path d="M16 30Q16 38.5 32 38.5Q48 38.5 48 30z" fill="url(#m3cv-ft-s)" ${SO}/><ellipse cx="32" cy="30" rx="16" ry="3.6" fill="url(#m3cv-ft-w)" ${S2}/>
        <path d="M4 46Q4 59 32 59Q60 59 60 46z" fill="url(#m3cv-ft-s)" ${SO}/><ellipse cx="32" cy="46" rx="28" ry="5.5" fill="url(#m3cv-ft-w)" ${S2}/>
        <path d="M14 46.5q4 1.6 8 0M38 45.5q4 1.6 8 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
        ${face(32, 51.8, .95, 11)}
        <circle cx="9" cy="23" r="1.6" fill="#7CC6E0"/><circle cx="55" cy="21" r="1.4" fill="#7CC6E0"/>${spark(52, 9, 2.6, "#F0C860")}`,
      civics_pennants: `
        <path d="M3 10Q32 22 61 10" fill="none" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M6 11.2L22 15.2L12.5 48z" fill="#EE8F84" ${SO}/><path d="M8.6 18.4l11 2.8" stroke="#FFF3E6" stroke-width="2" stroke-linecap="round"/>
        <path d="M42 15.2L58 11.2L51.5 48z" fill="#8DB4DE" ${SO}/><path d="M44.4 21.2l11-2.8" stroke="#FFF3E6" stroke-width="2" stroke-linecap="round"/>
        <path d="M23 15.4H41L32 59z" fill="#F0C860" ${SO}/><path d="M25 21.5h14" stroke="#FFF3E6" stroke-width="2" stroke-linecap="round"/>
        <path d="${star(14.8, 30, 3.4, 1.5)}" fill="#FFF3E6"/><path d="${star(49.4, 30, 3.4, 1.5)}" fill="#FFF3E6"/>
        ${face(32, 31, .9, 8)}
        <circle cx="22.5" cy="15.3" r="1.6" fill="#9ACB9E" ${SOw(1.1)}/><circle cx="41.5" cy="15.3" r="1.6" fill="#9ACB9E" ${SOw(1.1)}/>`,
      civics_gavel: `${lg("m3cv-gv-w", "#D9A06A", "#9C6436")}${lg("m3cv-gv-b", "#C88A55", "#8E5A2C")}
        <path d="M8 50Q8 46 18 45H46Q56 46 56 50V53Q56 58 46 58H18Q8 58 8 53z" fill="url(#m3cv-gv-b)" ${SO}/><ellipse cx="32" cy="49" rx="22" ry="3.4" fill="#E2B27A" ${S15}/>
        <g transform="rotate(-32 32 27)">
          <rect x="29" y="25" width="6" height="24" rx="3" fill="url(#m3cv-gv-w)" ${S2}/><rect x="28" y="44" width="8" height="5" rx="2.5" fill="#F0C860" ${SOw(1.6)}/>
          <rect x="12" y="11" width="40" height="17" rx="7" fill="url(#m3cv-gv-w)" ${SO}/>
          <rect x="12" y="11" width="7" height="17" rx="3" fill="#F0C860" ${S2}/><rect x="45" y="11" width="7" height="17" rx="3" fill="#F0C860" ${S2}/>
          <ellipse cx="26" cy="14.5" rx="4" ry="1.4" fill="#fff" opacity=".45"/>
          ${EYES(28, 36, 19, 2.1)}<path d="M30.4 21.8q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>
          <ellipse cx="24.6" cy="22" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/><ellipse cx="39.4" cy="22" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/>
        </g>
        ${spark(52, 36, 3.4, "#F0C860")}${spark(57, 26, 2.2, "#F0C860")}${spark(9, 40, 2.4, "#8DB4DE")}`,
      civics_objection: `${lg("m3cv-ob-b", "#FFFBF2", "#F6E6CF")}
        <path d="M12 41L8 56L24 44z" fill="#FFF6E8" ${SO}/>
        <rect x="3" y="12" width="58" height="33" rx="14" fill="url(#m3cv-ob-b)" ${SO}/>
        <path d="M14 44L11 52L20 45" fill="#FFF6E8"/>
        <rect x="7" y="16" width="50" height="25" rx="10.5" fill="none" stroke="#EE8F84" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>
        ${T("Objection!", 32, 33, 11.5, "#D75F55", 46)}
        ${spark(56, 7, 3, "#F0C860")}${spark(49, 54, 2.4, "#8DB4DE")}<path d="M47 5.5l2.5 3.5M53 12.5l3.5 1" stroke="#F0C860" stroke-width="1.8" stroke-linecap="round"/>`,
      civics_podium: `${lg("m3cv-pd-b", "#9CC9EC", "#5F93C7")}${lg("m3cv-pd-t", "#FFFBF2", "#E2D3BA")}
        <path d="M35 21Q38 10 47 9" fill="none" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="44" y="4" width="8" height="10" rx="4" fill="#6E7088" ${S2} transform="rotate(25 48 9)"/>
        <path d="M14 26H50L46 58H18z" fill="url(#m3cv-pd-b)" ${SO}/>
        <path d="M20 31H44L42 49H22z" fill="#8DB4DE" stroke="#FFF3E6" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M8 21H56L52 27H12z" fill="url(#m3cv-pd-t)" ${SO}/>
        <path d="${star(32, 50.5, 2.6, 1.1)}" fill="#F0C860" ${SOw(.9)}/>
        <rect x="15" y="55" width="34" height="4.5" rx="2" fill="#4E79A6" ${S2}/>
        ${face(32, 38, 1, 9)}
        <path d="M54 18q3-1.5 4 1.5M57 13q2.8-1 3.5 1.8" fill="none" stroke="#EE8F84" stroke-width="1.6" stroke-linecap="round"/>`,
      civics_laurel: `${rg("m3cv-lr-g", "#FFE9A6", "#E0A83E", .4, .35)}
        <path d="M24 48L19 60L25 57L28 61L31 50z" fill="#EE8F84" ${S2}/><path d="M40 48L45 60L39 57L36 61L33 50z" fill="#8DB4DE" ${S2}/>
        ${laurelRing(32, 31, 21, "#9ACB9E", "#7FB585", 6)}
        <circle cx="32" cy="31" r="15" fill="url(#m3cv-lr-g)" ${SO}/>
        <circle cx="32" cy="31" r="11.5" fill="none" stroke="#FFF3C8" stroke-width="1.4" opacity=".9"/>
        ${face(32, 31.5, 1, 9)}
        <path d="${star(32, 8, 4.6, 2)}" fill="#F0C860" ${SOw(1.4)}/>`
    }},
    pins: [
      {id: "tp-civics-laurel", name: "Laurel Medal", kind: "badge", desc: "A golden medal ringed in laurel leaves.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="m3cv-pl-g" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFEDB0"/><stop offset="1" stop-color="#D49A32"/></radialGradient></defs>
          ${rot(12, a => `<ellipse cx="15" cy="2.8" rx="2" ry="3.4" fill="${a % 60 ? "#8FC49A" : "#6FAE7E"}" stroke="#3E6E4A" stroke-width=".7" transform="rotate(${a + 15} 15 15)"/>`)}
          <circle cx="15" cy="15" r="10" fill="url(#m3cv-pl-g)" stroke="#8A5E14" stroke-width="1.1"/>
          <circle cx="15" cy="15" r="7.6" fill="none" stroke="#FFF3C8" stroke-width=".8"/>
          <path d="${star(15, 15.4, 5, 2.2)}" fill="#FFF6D8" stroke="#A87420" stroke-width=".8" stroke-linejoin="round"/>
          <ellipse cx="11" cy="10.5" rx="2.6" ry="1.3" fill="#fff" opacity=".6" transform="rotate(-35 11 10.5)"/></svg>`},
      {id: "tp-civics-bunting", name: "Bunting Washi", kind: "tape", desc: "Cream washi tape strung with little pastel pennants.",
        svg: `<svg viewBox="0 0 86 26"><defs><pattern id="m3cv-pt-p" width="24" height="26" patternUnits="userSpaceOnUse"><path d="M0 6Q12 10 24 6" fill="none" stroke="#7C6A58" stroke-width=".9"/><path d="M1.5 6.6L8.5 8.6L4 19z" fill="#EE8F84"/><path d="M9 8.8L16 8.8L12.5 21z" fill="#F0C860"/><path d="M16.5 8.6L23 6.6L19.5 19z" fill="#8DB4DE"/><circle cx="12.5" cy="12.2" r=".9" fill="#FFF8EC"/></pattern></defs>
          <path d="M4 1H82L79 4.5L82 8L79 11.5L82 15L79 18.5L82 22L79 25H4L7 21.5L4 18L7 14.5L4 11L7 7.5L4 4z" fill="#FBF3E4" opacity=".92"/>
          <path d="M4 1H82L79 4.5L82 8L79 11.5L82 15L79 18.5L82 22L79 25H4L7 21.5L4 18L7 14.5L4 11L7 7.5L4 4z" fill="url(#m3cv-pt-p)"/>
          <path d="M6 23H80" stroke="#9ACB9E" stroke-width="1.4" opacity=".7"/></svg>`}
    ],
    card: {id: "tp-civics", name: "Marble Steps", desc: "Warm marble paper with laurel sprigs in the corners and a little pennant string across the top."}
  });

  /* ================= CASE ROOM ================= */
  TP_DATA.push({
    theme: "justice",
    pack: {name: "Clue Crew", items: {
      justice_cat: `${rg("m3js-ct-f", "#FFE2B8", "#F2A85E", .4, .35)}${lg("m3js-ct-h", "#D8BE92", "#AC8C5E")}${rg("m3js-ct-l", "#E9F7FF", "#A9D4EE", .35, .3)}
        <circle cx="29" cy="38" r="19" fill="url(#m3js-ct-f)" ${SO}/>
        <path d="M14 23L10 6L24 15z" fill="#F2A85E" ${SO}/><path d="M44 23L48 6L34 15z" fill="#F2A85E" ${SO}/>
        <path d="M14 18L12.5 11L18.5 15z M44 18L45.5 11L39.5 15z" fill="#FFB8C4"/>
        <path d="M12 30C12 17 19 12 29 12C39 12 46 17 46 30z" fill="url(#m3js-ct-h)" ${SO}/>
        <path d="M17 18.5H41M14 24.5H44M22 13.5V30M29 12V30M36 13.5V30" stroke="#8A6A40" stroke-width="1.2" opacity=".55"/>
        <path d="M18 29Q29 25 40 29Q38 34.5 29 34.5Q20 34.5 18 29z" fill="#C6A878" ${S2}/>
        <path d="M24 12.5q5-4 10 0q-5 2.6-10 0z" fill="#8A6A40" ${SOw(1.3)}/>
        ${EYES(22, 36, 41, 2.5)}<ellipse cx="17" cy="46" rx="3" ry="2" fill="#FF8FA8" opacity=".8"/><ellipse cx="41" cy="46" rx="3" ry="2" fill="#FF8FA8" opacity=".8"/>
        <path d="M27.5 44.5h3L29 46.3z" fill="#E86A80"/><path d="M26 47.2q1.5 1.6 3 0q1.5 1.6 3 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M8 43.5l6 1M8.5 48l5.5-1" stroke="${O}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
        <path d="M54 54L60 60" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M54 54L60 60" stroke="#8E5A2C" stroke-width="3.4" stroke-linecap="round"/>
        <circle cx="48" cy="47" r="9.5" fill="#E2B24F" ${SO}/><circle cx="48" cy="47" r="6.8" fill="url(#m3js-ct-l)" ${SOw(1.4)}/>
        <path d="M44.5 45q1-3.2 4-3.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="53.5" cy="55" rx="4" ry="3.4" fill="#FFE2B8" ${S2}/>`,
      justice_corkboard: `${lg("m3js-cb-f", "#C08A52", "#8E5A2C")}${lg("m3js-cb-c", "#E2B47C", "#CC9A60")}
        <rect x="3" y="7" width="58" height="48" rx="5" fill="url(#m3js-cb-f)" ${SO}/>
        <rect x="8" y="12" width="48" height="38" rx="2" fill="url(#m3js-cb-c)" ${SOw(1.4)}/>
        <g fill="#A87444" opacity=".55"><circle cx="13" cy="44" r=".8"/><circle cx="50" cy="45" r=".8"/><circle cx="44" cy="31" r=".8"/><circle cx="12" cy="30" r=".8"/><circle cx="27" cy="46" r=".8"/></g>
        <g transform="rotate(-6 18 22)"><rect x="11" y="15" width="15" height="14" rx="1" fill="#F7DA74" ${SOw(1.4)}/>${EYES(15.5, 21.5, 22, 1.5)}<path d="M17.4 24.2q1.1 1 2.2 0" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/></g>
        <g transform="rotate(6 44 22)"><rect x="37" y="14" width="15" height="17" rx="1" fill="#FFFDF7" ${SOw(1.4)}/><rect x="39" y="16" width="11" height="10" fill="#9DBCE0"/><path d="M40.5 26v-3.5l2-2 2 2 2-2.6 2.2 2.6V26z" fill="#4E5E84"/></g>
        <g transform="rotate(-3 32 40)"><rect x="24" y="33" width="16" height="14" rx="1" fill="#F3A9B3" ${SOw(1.4)}/>${T("?", 32, 44.5, 11, "#C23F52")}</g>
        <path d="M18.5 17L45 16.5L32 35L18.5 17" fill="none" stroke="#E0544B" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="18.5" cy="17" r="2.2" fill="#E0544B" ${SOw(1.2)}/><circle cx="45" cy="16.5" r="2.2" fill="#5B8FD6" ${SOw(1.2)}/><circle cx="32" cy="35" r="2.2" fill="#F0C048" ${SOw(1.2)}/>
        <path d="M14 55L11 60M50 55L53 60" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`,
      justice_lamp: `${lg("m3js-lp-s", "#7CCB98", "#2F7A52")}${lg("m3js-lp-b", "#F4CF74", "#C8902E")}${lg("m3js-lp-gl", "#FFF2B8", "#FFF2B8", 0, 1)}
        <ellipse cx="32" cy="46" rx="22" ry="12" fill="#FFE9A0" opacity=".5"/>
        <path d="M28.5 29H35.5V51H28.5z" fill="url(#m3js-lp-b)" ${S2}/>
        <path d="M10 56Q10 50 32 50Q54 50 54 56Q54 60 32 60Q10 60 10 56z" fill="url(#m3js-lp-b)" ${SO}/><ellipse cx="25" cy="53.5" rx="7" ry="1.3" fill="#fff" opacity=".45"/>
        <path d="M46 30V40" stroke="${O}" stroke-width="1.5"/><circle cx="46" cy="41.5" r="2.2" fill="#F0C048" ${SOw(1.3)}/>
        <path d="M6 30Q6 12 32 12Q58 12 58 30z" fill="url(#m3js-lp-s)" ${SO}/>
        <path d="M6 30H58" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/><path d="M8.5 30.4H55.5" stroke="#FFF3C0" stroke-width="2" stroke-linecap="round"/>
        <path d="M14 22Q18 16 26 14.5" fill="none" stroke="#C9F0D8" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <rect x="30" y="7.5" width="4" height="5" rx="1.5" fill="url(#m3js-lp-b)" ${SOw(1.4)}/>
        ${face(32, 21.5, 1, 10)}
        ${spark(56, 41, 3, "#FFE58A")}${spark(8, 41, 2.4, "#FFE58A")}`,
      justice_window: `${lg("m3js-wn-s", "#3A4C7E", "#24305A")}${lg("m3js-wn-f", "#B98552", "#8E5A2C")}
        <rect x="5" y="5" width="54" height="50" rx="5" fill="url(#m3js-wn-f)" ${SO}/>
        <rect x="10" y="10" width="44" height="40" rx="2" fill="url(#m3js-wn-s)" ${SOw(1.5)}/>
        <circle cx="44" cy="19" r="5" fill="#FFF3C8"/><circle cx="46.5" cy="17.5" r="4.4" fill="#2F3D6A"/>
        <path d="M10 50V36h6v-6h7v10h5V27h8v13h5v-8h6v6h7v12z" fill="#151C38"/>
        <g fill="#FFD36B"><rect x="12" y="39" width="2" height="2"/><rect x="19" y="33" width="2" height="2"/><rect x="19" y="38" width="2" height="2"/><rect x="30" y="30" width="2" height="2"/><rect x="33" y="35" width="2" height="2"/><rect x="30" y="41" width="2" height="2"/><rect x="43" y="35" width="2" height="2"/><rect x="48" y="41" width="2" height="2"/><rect x="25" y="43" width="2" height="2"/></g>
        <g stroke="#A9C8F0" stroke-width="1.2" stroke-linecap="round" opacity=".75"><path d="M15 14l-1.5 4M24 19l-1.5 4M38 13l-1.5 4M51 27l-1.5 4M17 25l-1.5 4M36 23l-1.5 4"/></g>
        <path d="M32 10V50M10 30H54" stroke="#B98552" stroke-width="2.6"/><path d="M32 10V50M10 30H54" stroke="${O}" stroke-width="2.6" opacity=".25"/>
        <rect x="3" y="51" width="58" height="7" rx="2.5" fill="#D9A26A" ${SO}/>
        <path d="M42 42h9v6.5q0 3-3 3h-3q-3 0-3-3z" fill="#E0544B" ${SOw(1.6)}/><path d="M51 44q3 0 3 2t-3 2" fill="none" stroke="${O}" stroke-width="1.4"/>
        <path d="M45 39q-1.5-2 0-4M48 39q1.5-2 0-4" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
`,
      justice_solved: `${lg("m3js-sv-m", "#FBE7B8", "#EDCB86")}
        <g transform="rotate(-7 32 33)">
          <path d="M5 18H22L25 14H40L43 18H59V52H5z" fill="url(#m3js-sv-m)" ${SO}/>
          <rect x="9" y="22.5" width="46" height="25.5" rx="5" fill="none" stroke="#D9473F" stroke-width="2.4"/>
          ${T("CASE", 32, 33.6, 9.5, "#D9473F", 28)}${T("CLOSED", 32, 44.6, 10.5, "#D9473F", 40)}
        </g>
        <circle cx="50" cy="12" r="5.4" fill="#E0544B" ${S2}/><circle cx="48.5" cy="10.5" r="1.6" fill="#fff" opacity=".7"/>
        ${spark(9, 9, 3, "#F0C048")}${spark(57, 57, 2.6, "#F0C048")}`,
      justice_notebook: `${lg("m3js-nb-p", "#FFFDF6", "#F1E6CF")}${lg("m3js-nb-c", "#4E6496", "#2E3A5C")}
        <rect x="9" y="8" width="40" height="52" rx="5" fill="url(#m3js-nb-c)" ${SO}/>
        <rect x="12" y="11" width="35" height="47" rx="3" fill="url(#m3js-nb-p)" ${S2}/>
        <path d="M17 26H42M17 32H42M17 38H42M17 44H36M17 50H32" stroke="#C9D7EA" stroke-width="1.3" stroke-linecap="round"/>
        ${[16, 22, 28, 34, 40].map(x => `<rect x="${x}" y="5" width="3" height="9" rx="1.5" fill="#C8CDD8" ${SOw(1.2)}/>`).join("")}
        ${T("?", 26, 47, 14, "#E0544B")}<path d="M33 40.5l2.6 2.6 5-5.6" fill="none" stroke="#4E9A6E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 21h12" stroke="#2E3A5C" stroke-width="2" stroke-linecap="round"/>
        <g transform="rotate(30 50 34)"><rect x="47" y="14" width="7" height="32" rx="1.5" fill="#F2C24A" ${S2}/><path d="M47 46h7l-3.5 8z" fill="#F6DDB4" ${S2}/><path d="M49.6 51.6l1 2.4 1-2.4z" fill="${O}"/><rect x="47" y="12" width="7" height="4" rx="1.5" fill="#F3A9B3" ${SOw(1.6)}/></g>`,
      justice_key: `${lg("m3js-ky-g", "#FBDC8A", "#CF952E")}
        <g transform="rotate(-35 32 32)">
          <rect x="29" y="27" width="6.5" height="34" rx="3" fill="url(#m3js-ky-g)" ${SO}/>
          <path d="M35 47H42V51.5H38.5V55H35z" fill="url(#m3js-ky-g)" ${S2}/>
          <rect x="27" y="27" width="10.5" height="4" rx="2" fill="#E8B54E" ${SOw(1.8)}/>
          <path d="M32.25 30C20 22 16 13 22.5 7.5C27 4 31 6.6 32.25 9C33.5 6.6 37.5 4 42 7.5C48.5 13 44.5 22 32.25 30z" fill="url(#m3js-ky-g)" ${SO}/>
          ${EYES(28.6, 35.9, 15, 1.9)}<path d="M30.8 17.6q1.45 1.3 2.9 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
          <ellipse cx="25.4" cy="17.8" rx="2" ry="1.3" fill="#FF8FA8" opacity=".85"/><ellipse cx="39.1" cy="17.8" rx="2" ry="1.3" fill="#FF8FA8" opacity=".85"/>
          <ellipse cx="25" cy="10" rx="2.6" ry="1.3" fill="#fff" opacity=".6" transform="rotate(-35 25 10)"/>
        </g>
        ${spark(52, 12, 3, "#FFE58A")}${spark(12, 50, 2.6, "#FFE58A")}`,
      justice_question: `${rg("m3js-qm-g", "#FFF3B8", "#F2B83E", .4, .35)}
                <path d="M21 22.5Q21 9 32.5 9Q44 9 44 20.5Q44 27 37 30.5Q33 32.5 33 38" fill="none" stroke="${O}" stroke-width="13.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 22.5Q21 9 32.5 9Q44 9 44 20.5Q44 27 37 30.5Q33 32.5 33 38" fill="none" stroke="#F5C04E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22.5 18Q24.5 11.5 31 11.5" fill="none" stroke="#FFF6CC" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="33" cy="51.5" r="8" fill="url(#m3js-qm-g)" ${SO}/>
        ${EYES(30, 36, 51, 1.7)}<path d="M31.8 53.6q1.2 1 2.4 0" fill="none" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="27.6" cy="54" rx="1.7" ry="1.1" fill="#FF8FA8"/><ellipse cx="38.4" cy="54" rx="1.7" ry="1.1" fill="#FF8FA8"/>
        ${spark(52, 44, 3.4, "#F5C04E")}${spark(11, 40, 2.8, "#F5C04E")}${spark(53, 9, 2.4, "#E0544B")}`
    }},
    pins: [
      {id: "tp-justice-pushpin", name: "Clue Pushpin", kind: "badge", desc: "A glossy red pushpin with a loop of red string.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="m3js-pp-g" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FF9A8E"/><stop offset="1" stop-color="#B8322C"/></radialGradient></defs>
          <path d="M3 27C7 22 9 26 12 22.5M27 27C23 22 21 26 18 22.5" fill="none" stroke="#E0544B" stroke-width="1.3" stroke-linecap="round"/>
          <ellipse cx="15" cy="21" rx="6" ry="2.6" fill="#8E2420" stroke="#5A1612" stroke-width=".9"/>
          <path d="M11.5 20.5L12.5 12H17.5L18.5 20.5z" fill="#D9473F" stroke="#5A1612" stroke-width=".9" stroke-linejoin="round"/>
          <circle cx="15" cy="9" r="7" fill="url(#m3js-pp-g)" stroke="#5A1612" stroke-width="1"/>
          <ellipse cx="12.4" cy="6.6" rx="2.4" ry="1.4" fill="#fff" opacity=".7" transform="rotate(-30 12.4 6.6)"/></svg>`},
      {id: "tp-justice-clip", name: "Brass Paperclip", kind: "clip", desc: "A brass paperclip holding a tiny red case tag.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="m3js-pc-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6D98A"/><stop offset=".5" stop-color="#D9A848"/><stop offset="1" stop-color="#A97A24"/></linearGradient></defs>
          <path d="M14 34L18 33L19.5 41L15.5 42z" fill="#E0544B" stroke="#7A1E18" stroke-width=".7" stroke-linejoin="round"/><circle cx="16" cy="35" r=".9" fill="#FFF3E0"/>
          <path d="M6 40V8.5a5 5 0 0 1 10 0V42a7 7 0 0 1-14 0V14" fill="none" stroke="#6E4E14" stroke-width="3.6" stroke-linecap="round"/>
          <path d="M6 40V8.5a5 5 0 0 1 10 0V42a7 7 0 0 1-14 0V14" fill="none" stroke="url(#m3js-pc-g)" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M16.6 10v14" stroke="#FFF6D0" stroke-width=".7" opacity=".8"/></svg>`}
    ],
    card: {id: "tp-justice", name: "Case File", desc: "A manila case folder with a red string clue in the corner and a brass clip, warm under the desk lamp at night."}
  });

  /* ================= WRITER'S RETREAT ================= */
  TP_DATA.push({
    theme: "writing",
    pack: {name: "Plot Twists", items: {
      writing_inkpot: `${lg("m3wr-ip-b", "#4E6496", "#26304E")}${lg("m3wr-ip-q", "#FFFFFF", "#CFE6DC", 1, 1)}
        <path d="M33 25C35 14 44 6 57 3.5C56 15 47 23 33 25z" fill="url(#m3wr-ip-q)" ${SO}/>
        <path d="M33.5 24.5L55 5" stroke="#8DB8A8" stroke-width="1.5" stroke-linecap="round"/><path d="M41 14l4 2M45 10.5l4 2M38 18l3.6 1.6" stroke="#B9D9CC" stroke-width="1.2" stroke-linecap="round"/>
        <rect x="23" y="17" width="18" height="10" rx="2" fill="#3A4C7E" ${S2}/><rect x="21" y="14" width="22" height="5" rx="2" fill="#C9684A" ${S2}/>
        <path d="M11 38Q11 27 22 27H42Q53 27 53 38V52Q53 59 46 59H18Q11 59 11 52z" fill="url(#m3wr-ip-b)" ${SO}/>
        <path d="M15 37Q15 31 21 30" fill="none" stroke="#9DB2DE" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
        <rect x="17" y="37" width="30" height="16" rx="3" fill="#FBF3E4" ${S15}/>
        ${face(32, 44, .95, 9)}`,
      writing_bookworm: `${lg("m3wr-bw-p", "#FFFDF6", "#F1E3C8")}${rg("m3wr-bw-w", "#C8EBB0", "#7DBE74")}
        <path d="M32 33Q19 27 5 31V57Q19 53 32 59Q45 53 59 57V31Q45 27 32 33z" fill="#C9684A" ${SO}/>
        <path d="M32 31Q20 25 7 29V53Q20 49 32 55Q44 49 57 53V29Q44 25 32 31z" fill="url(#m3wr-bw-p)" ${S2}/>
        <path d="M32 31V55" stroke="${O}" stroke-width="1.6"/>
        <path d="M12 35Q19 33.5 26 36M12 40Q19 38.5 26 41M12 45Q19 43.5 26 46M38 36Q45 33.5 52 35M38 41Q45 38.5 52 40M38 46Q45 43.5 52 45" fill="none" stroke="#D7C7A8" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="31" cy="30" r="6.5" fill="url(#m3wr-bw-w)" ${S2}/>
        <circle cx="35" cy="17" r="12" fill="url(#m3wr-bw-w)" ${SO}/>
        <path d="M30 6Q27 2.5 24.5 3.5M38 5.4Q40 2 42.5 2.6" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/><circle cx="24.5" cy="3.6" r="1.6" fill="#F2B83E"/><circle cx="42.5" cy="2.8" r="1.5" fill="#F2B83E"/>
        <circle cx="30.5" cy="16.5" r="4.2" fill="#fff" fill-opacity=".45" ${SOw(1.6)}/><circle cx="40.5" cy="16.5" r="4.2" fill="#fff" fill-opacity=".45" ${SOw(1.6)}/><path d="M34.7 16.2h1.6" stroke="${O}" stroke-width="1.6"/>
        <circle cx="30.5" cy="16.8" r="1.7" fill="${O}"/><circle cx="40.5" cy="16.8" r="1.7" fill="${O}"/><circle cx="31.1" cy="16.2" r=".6" fill="#fff"/><circle cx="41.1" cy="16.2" r=".6" fill="#fff"/>
        <ellipse cx="26" cy="22.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".85"/><ellipse cx="45" cy="22.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".85"/>
        <path d="M33.6 22.6q1.9 1.6 3.8 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>`,
      writing_bird: `${lg("m3wr-pb-a", "#FFFDF6", "#EADBC0")}${lg("m3wr-pb-b", "#F6EBD6", "#D9C4A0")}
        <path d="M33 38L23 6L42 35z" fill="url(#m3wr-pb-b)" ${SO}/>
        <path d="M27 14l7 17M25.5 20l5.5 13" stroke="#C9B48E" stroke-width="1.1"/>
        <path d="M23 45L9 19L28 40z" fill="url(#m3wr-pb-b)" ${SO}/><path d="M9 19L3.5 25.5L11.5 23.5z" fill="url(#m3wr-pb-a)" ${S2}/>
        <path d="M42 45L61 25L47 48z" fill="url(#m3wr-pb-b)" ${SO}/>
        <path d="M15 44L32 35L50 44L32 55z" fill="url(#m3wr-pb-a)" ${SO}/>
        <path d="M32 35V55" stroke="#D9C4A0" stroke-width="1.2"/>
        <path d="M29 41L53 8L45 39z" fill="#FFFDF6" ${SO}/>
        <path d="M45 18l-8 14M49.5 16l-6.5 13" stroke="#D9C4A0" stroke-width="1.1"/>
        ${EYES(27.5, 36.5, 45.5, 1.9)}<path d="M30.6 48q1.4 1.2 2.8 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <ellipse cx="23.8" cy="48" rx="2" ry="1.3" fill="#FF8FA8" opacity=".85"/><ellipse cx="40.2" cy="48" rx="2" ry="1.3" fill="#FF8FA8" opacity=".85"/>
        ${T("a", 9, 12, 9, "#4E8F87")}${T("b", 56, 60, 8, "#C9684A")}${spark(14, 56, 2.6, "#E0AE4A")}`,
      writing_teacup: `${lg("m3wr-tc-c", "#FFFFFF", "#F1E3EE")}${lg("m3wr-tc-t", "#E7A35A", "#B86A2C")}
        <path d="M24 5Q20 9 24 13Q28 17 24 21" fill="none" stroke="#CDBFD8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M34 3Q30 7.5 34 12Q38 16.5 34 21" fill="none" stroke="#CDBFD8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M44 31Q55 29 55 37.5Q55 46 42 45" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
        <path d="M44 31Q55 29 55 37.5Q55 46 42 45" fill="none" stroke="#F4E6F0" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M9 25H47Q47 50 28 52Q9 50 9 25z" fill="url(#m3wr-tc-c)" ${SO}/>
        <ellipse cx="28" cy="25" rx="19" ry="4.2" fill="url(#m3wr-tc-t)" ${SO}/>
        <path d="M14 30Q28 34 42 30" fill="none" stroke="#F2A7C3" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M38 24L41 9" stroke="#8A6A9E" stroke-width="1.4"/>
        <rect x="37" y="5" width="9" height="7" rx="1.6" transform="rotate(12 41.5 8.5)" fill="#F2A7C3" ${SOw(1.6)}/>
        <path d="M41.2 7.2c.8-1 2.3-.2 1.7 1-.4.8-1.7 1.6-1.7 1.6s-1.3-.8-1.7-1.6c-.6-1.2.9-2 1.7-1z" fill="#fff"/>
        <path d="M4 54Q4 50 28 50Q52 50 52 54Q52 59 28 59Q4 59 4 54z" fill="#E9D7E6" ${SO}/>
        ${EYES(22, 34, 39, 2.5)}${BLUSH(17.5, 38.5, 44)}${SMILE(28, 44, 3)}`,
      writing_candle: `${lg("m3wr-cd-h", "#F2D48A", "#C99A3E")}${rg("m3wr-cd-g", "#FFF6C8", "#FFB547", .5, .65)}
        <circle cx="32" cy="14" r="12" fill="#FFE9A0" opacity=".45"/>
        <path d="M32 3C37 9.5 38 13.5 38 16A6 6 0 0 1 26 16C26 13.5 27 9.5 32 3z" fill="#FFB547" ${SO}/><path d="M32 9C34.4 12.4 35 14.2 35 15.6A3 3 0 0 1 29 15.6C29 14.2 29.6 12.4 32 9z" fill="url(#m3wr-cd-g)"/>
        <path d="M32 20.5V23" stroke="${O}" stroke-width="1.6"/>
        <path d="M21 26Q21 23 32 23Q43 23 43 26V51H21z" fill="#FFF8EC" ${SO}/>
        <path d="M21 26Q21 31 24 31Q26 31 26 28Q27 34 30 34Q32 34 32 28.5Q34 31 38 31Q43 31 43 26" fill="#FFFDF6" stroke="#E7D8BE" stroke-width="1.2"/>
        <path d="M24.5 31V37" stroke="#E7D8BE" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M8 52Q8 47 32 47Q56 47 56 52Q56 58 32 58Q8 58 8 52z" fill="url(#m3wr-cd-h)" ${SO}/>
        <ellipse cx="32" cy="50" rx="13" ry="2.4" fill="#E2B25A" ${S15}/>
        <path d="M56 51Q62 51 61 55Q60 58 55 56" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M56 51Q62 51 61 55Q60 58 55 56" fill="none" stroke="#E2B25A" stroke-width="2.4" stroke-linecap="round"/>
        ${face(32, 39, .95, 9)}`,
      writing_letter: `${lg("m3wr-lt-e", "#FFFBF2", "#EFE1C6")}${rg("m3wr-lt-s", "#E88A6E", "#B04A30", .38, .32)}
        <g transform="rotate(-6 32 34)">
          <rect x="14" y="7" width="36" height="30" rx="2" fill="#FFFDF6" ${S2}/>
          <path d="M19 14h20M19 19h26M19 24h22" stroke="#9DB2C8" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M5 24H59V54Q59 57 56 57H8Q5 57 5 54z" fill="url(#m3wr-lt-e)" ${SO}/>
          <path d="M5 26L32 44L59 26" fill="#F6EAD2" ${SO}/>
          <path d="M6 56L24 41M58 56L40 41" stroke="#D9C4A0" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M32 36.5Q37 35 40 39Q42 43 39.5 47Q36 51 32 50Q27 51 24.5 47Q22 43 24 39Q27 35 32 36.5z" fill="url(#m3wr-lt-s)" ${S2}/>
          <path d="M32 47.4C27.5 44.4 27 42 28.6 40.6C30 39.6 31.4 40.4 32 41.4C32.6 40.4 34 39.6 35.4 40.6C37 42 36.5 44.4 32 47.4z" fill="#FFD9C8"/>
        </g>
        ${spark(56, 12, 3, "#E0AE4A")}${spark(8, 14, 2.2, "#4E8F87")}`,
      writing_quotes: `${rg("m3wr-qt-a", "#7FC4BA", "#3E8279")}${rg("m3wr-qt-b", "#F09A78", "#C2583C")}
        <path d="M14 34Q11 18 26 9" fill="none" stroke="${O}" stroke-width="10.8" stroke-linecap="round"/><path d="M14 34Q11 18 26 9" fill="none" stroke="#5FA79D" stroke-width="7.6" stroke-linecap="round"/>
        <circle cx="19" cy="38" r="12" fill="url(#m3wr-qt-a)" ${SO}/>
        <path d="M40 34Q37 18 52 9" fill="none" stroke="${O}" stroke-width="10.8" stroke-linecap="round"/><path d="M40 34Q37 18 52 9" fill="none" stroke="#E07A5A" stroke-width="7.6" stroke-linecap="round"/>
        <circle cx="45" cy="38" r="12" fill="url(#m3wr-qt-b)" ${SO}/>
        ${face(19, 38.5, .9, 8)}${face(45, 38.5, .9, 8)}
        <ellipse cx="14.5" cy="32" rx="3" ry="1.6" fill="#fff" opacity=".5" transform="rotate(-35 14.5 32)"/><ellipse cx="40.5" cy="32" rx="3" ry="1.6" fill="#fff" opacity=".5" transform="rotate(-35 40.5 32)"/>
        <path d="M32 55.5C29 53.4 28.6 51.6 29.8 50.6C30.8 49.9 31.6 50.4 32 51C32.4 50.4 33.2 49.9 34.2 50.6C35.4 51.6 35 53.4 32 55.5z" fill="#E0AE4A" ${SOw(1.2)}/>`,
      writing_plottwist: `${lg("m3wr-pt-p", "#FFFDF6", "#F4E8D2")}
        <path d="M6 12L11 9L16 12L21 9L26 12L31 9L36 12L41 9L46 12L51 9L56 12L58 10.5V55Q58 58 55 58H9Q6 58 6 55z" fill="url(#m3wr-pt-p)" ${SO}/>
        <path d="M14 15V55" stroke="#F2A0A0" stroke-width="1.2"/>
        <path d="M9 22H55M9 33.5H55M9 45H55" stroke="#CFE0EC" stroke-width="1.2"/>
        ${T("Plot", 34, 30, 13, "#3A4C7E", 26, "Georgia,'Times New Roman',serif")}${T("Twist!", 34, 47, 14, "#C9684A", 36, "Georgia,'Times New Roman',serif")}
        <path d="M20 51Q28 54 36 51T52 51" fill="none" stroke="#E0AE4A" stroke-width="2" stroke-linecap="round"/>`
    }},
    pins: [
      {id: "tp-writing-seal", name: "Wax Seal", kind: "badge", desc: "A terracotta wax seal pressed with a little quill.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="m3wr-ps-g" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#F2A084"/><stop offset="1" stop-color="#A8432A"/></radialGradient></defs>
          <path d="M15 1.6Q19 2.6 21.5 2.8Q25 4.5 26.5 8Q28.6 11 28 15Q28.8 19.5 26 22.6Q24.4 26.4 20 27.4Q17 28.8 13.6 28.2Q9 28.4 6 25.4Q2.4 23 2.2 18Q1 14.4 2.6 10.6Q3.6 6 7.6 4Q11 1.4 15 1.6z" fill="url(#m3wr-ps-g)" stroke="#6E2414" stroke-width="1"/>
          <circle cx="15" cy="15" r="8.6" fill="none" stroke="#7E2E1A" stroke-width="1.2" opacity=".7"/>
          <path d="M11 20C12 14 15 10.5 20 9C19.5 14 16.5 18 11 20z" fill="#FFD2BE" stroke="#7E2E1A" stroke-width=".7" stroke-linejoin="round"/><path d="M11 20.5L18.5 11" stroke="#7E2E1A" stroke-width=".7"/>
          <ellipse cx="9.4" cy="8.6" rx="2.6" ry="1.3" fill="#fff" opacity=".5" transform="rotate(-35 9.4 8.6)"/></svg>`},
      {id: "tp-writing-script", name: "Manuscript Washi", kind: "tape", desc: "Ruled paper washi tape with looping handwritten words.",
        svg: `<svg viewBox="0 0 86 26"><defs><pattern id="m3wr-pt-s" width="40" height="26" patternUnits="userSpaceOnUse"><path d="M0 8.5H40M0 15.5H40M0 22.5H40" stroke="#B8CDE0" stroke-width=".6"/><path d="M3 13Q5 7 7 12.5T11 12.5T15 12Q16 7 17.5 11Q19 14 21 11.5M25 20Q27 15 29 19.5T33 19T37 18.5" fill="none" stroke="#3A4C7E" stroke-width=".9" stroke-linecap="round"/></pattern></defs>
          <path d="M4 1H82L79 4.5L82 8L79 11.5L82 15L79 18.5L82 22L79 25H4L7 21.5L4 18L7 14.5L4 11L7 7.5L4 4z" fill="#FBF4E6" opacity=".93"/>
          <path d="M4 1H82L79 4.5L82 8L79 11.5L82 15L79 18.5L82 22L79 25H4L7 21.5L4 18L7 14.5L4 11L7 7.5L4 4z" fill="url(#m3wr-pt-s)"/>
          <path d="M12 1V25" stroke="#F2A0A0" stroke-width=".9" opacity=".9"/></svg>`}
    ],
    card: {id: "tp-writing", name: "Manuscript Page", desc: "Cream ruled paper with a red margin, an ink pot and quill in the corner and paper birds taking flight."}
  });
})();

