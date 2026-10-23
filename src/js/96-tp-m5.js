/* ===== module: 96-tp-m5.js ===== */
/* Theme Collections, Study Fields batch m5 */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const rot = (n, f) => Array.from({length: n}, (_, i) => f(i * 360 / n, i)).join("");
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const shut = (x, y, w = 2.6) => `<path d="M${x - w} ${y}q${w} ${w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  // a thick line with a dark outline (cartoon tube)
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  // crescent: circle (cx,cy,R) with the circle (qx,qy,r) cut away
  const cres = (cx, cy, R, qx, qy, r) => {
    const dx = qx - cx, dy = qy - cy, d = Math.hypot(dx, dy), a = (R * R - r * r + d * d) / (2 * d), h = Math.sqrt(R * R - a * a);
    const px = cx + a * dx / d, py = cy + a * dy / d;
    const x1 = px - h * dy / d, y1 = py + h * dx / d, x2 = px + h * dy / d, y2 = py - h * dx / d;
    return `M${f1(x1)} ${f1(y1)}A${R} ${R} 0 1 1 ${f1(x2)} ${f1(y2)}A${r} ${r} 0 ${a > d ? 1 : 0} 0 ${f1(x1)} ${f1(y1)}z`;
  };
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";

  /* ================= OBSERVATORY (Physics) ================= */
  TP_DATA.push({
    theme: "observatory",
    pack: {name: "Stargazer Club", items: {
      observatory_planet: `${rg("o5-pl-b", "#FFD9B8", "#B978C8", .32, .26)}
        <g transform="translate(32 34) rotate(-16)"><ellipse rx="25" ry="7.6" fill="none" stroke="${O}" stroke-width="6.6"/><ellipse rx="25" ry="7.6" fill="none" stroke="#F6C85A" stroke-width="3"/></g>
        <circle cx="32" cy="32" r="17" fill="url(#o5-pl-b)" ${SO}/>
        <path d="M18.5 24.5Q32 20 45.5 24.5" fill="none" stroke="#FFEADB" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>
        ${SHINE(24, 21, 3.4, 2, -30)}
        <g transform="translate(32 34) rotate(-16)"><path d="M-25 0A25 7.6 0 0 0 25 0" fill="none" stroke="${O}" stroke-width="6.6"/><path d="M-25.2 0A25 7.6 0 0 0 25.2 0" fill="none" stroke="#F6C85A" stroke-width="3"/><path d="M-12 6.2Q0 8.4 12 6.6" fill="none" stroke="#FFF1C2" stroke-width="1.3" stroke-linecap="round"/></g>
        ${EYES(26, 38, 29.5, 2.4)}${blush(21.5, 42.5, 34)}${smile(32, 33, 2.4)}
        ${spark(9, 11, 4.5, "#F6C85A")}${spark(55, 53, 3.6, "#9FB8F0")}<circle cx="53" cy="12" r="1.6" fill="#C7A8F0"/>`,
      observatory_moon: `${rg("o5-mn-b", "#FFF6CF", "#F2C24A", .3, .4)}
        <path d="${cres(30, 33, 26, 45, 25, 20)}" fill="url(#o5-mn-b)" ${SO}/>
        <circle cx="14" cy="47" r="2.2" fill="#E6AE3A" opacity=".5"/><circle cx="11" cy="24" r="1.5" fill="#E6AE3A" opacity=".5"/>
        ${shut(12.5, 35, 2.3)}${shut(21.5, 38.5, 2.3)}<ellipse cx="11" cy="40.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/><ellipse cx="24" cy="44" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/>
        <path d="M15.5 44q2 1.8 4 .8" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M44 34v8" stroke="${O}" stroke-width="1.4"/>
        <path d="${star(44, 46.5, 7, 3.4, 5)}" fill="#FFE27A" ${S15}/><circle cx="42.5" cy="46.5" r=".9" fill="${O}"/><circle cx="45.5" cy="46.5" r=".9" fill="${O}"/>
        ${T("z", 50, 22, 8, "#8C93D8")}${T("z", 56, 15, 6, "#B5BAE8")}`,
      observatory_dome: `${lg("o5-dm-d", "#FFFFFF", "#CBD0EE")}${lg("o5-dm-w", "#F4F2FB", "#CFCBE8")}${lg("o5-dm-h", "#A6D8A0", "#5FA866")}
        ${spark(10, 11, 4.8, "#F6C85A")}${spark(56, 22, 3.4, "#9FB8F0")}<circle cx="22" cy="7" r="1.5" fill="#C7A8F0"/><circle cx="57" cy="5" r="1.3" fill="#F6C85A"/>
        <path d="M3 52Q32 43 61 52V57.5Q61 61 57.5 61H6.5Q3 61 3 57.5z" fill="url(#o5-dm-h)" ${SO}/>
        <path d="M13 40A19 19 0 0 1 51 40z" fill="url(#o5-dm-d)" ${SO}/>
        <path d="M21.5 40Q21.5 27 31 21.3M42.5 40Q42.5 27 33 21.3" fill="none" stroke="#AEB4DA" stroke-width="1.5"/>
        <path d="M29 21.4Q32 20.6 35 21.4V39H29z" fill="#3B3F7A" ${SOw(1.6)}/>
        ${tube("M32.5 31L44.5 11.5", "#7C86D6", 6)}<path d="M36.6 21.4l4.6 2.8" stroke="#F6C85A" stroke-width="2.6"/><circle cx="44.6" cy="11.4" r="1.6" fill="#DDE3FF"/>
        <rect x="11" y="39" width="42" height="17" rx="3" fill="url(#o5-dm-w)" ${SO}/>
        <rect x="9.5" y="37" width="45" height="5" rx="2.5" fill="#8C93D8" ${S2}/>
        ${EYES(26, 38, 47.5, 2.3)}${blush(21.5, 42.5, 51.5, 2.4, 1.5)}${smile(32, 50.6, 2.2, 1.8)}`,
      observatory_wish: `${rg("o5-ws-g", "#FFF4B8", "#F2B530", .4, .35)}
        <g fill="none" stroke-linecap="round">
          <path d="M27 21Q15 22 4 18M30 33Q18 42 5 43M38 38Q30 50 18 58" stroke="${O}" stroke-width="8.6"/>
          <path d="M27 21Q15 22 4 18" stroke="#C7A8F0" stroke-width="5"/><path d="M30 33Q18 42 5 43" stroke="#F7A8C8" stroke-width="5"/><path d="M38 38Q30 50 18 58" stroke="#9FC2F5" stroke-width="5"/></g>
        <path d="${star(40, 25, 20, 10.5, 5)}" fill="url(#o5-ws-g)" ${SO}/>
        ${EYES(35, 45, 25, 2.3)}${blush(31, 49, 30, 2.3, 1.5)}${smile(40, 29.2, 2.3, 1.8)}
        ${spark(12, 30, 2.6, "#fff")}${spark(55, 54, 4, "#F6C85A")}`,
      observatory_apple: `${lg("o5-ap-r", "#FF9A86", "#D9443A")}${lg("o5-ap-l", "#9BDB7E", "#4E9A4A")}
        <path d="M13 4v6M19 7v3M51 4v6M45 7v3" stroke="#B9B6EE" stroke-width="2" stroke-linecap="round"/>
        <path d="M32 22C25 16 10 18 10 35C10 50 21 60 28 58Q32 57 36 58C43 60 54 50 54 35C54 18 39 16 32 22z" fill="url(#o5-ap-r)" ${SO}/>
        <path d="M32 22Q31 16 34 12" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 22Q31 16 34 12" fill="none" stroke="#9A6A3A" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M34 15C36 8 42 6 46 8C44 14 39 16 34 15z" fill="url(#o5-ap-l)" ${S2}/>
        ${SHINE(17, 30, 4, 2.4, -60)}
        ${EYES(25, 39, 38, 2.5)}${BLUSH(20, 44, 44)}${SMILE(32, 43, 2.8)}`,
      observatory_prism: `${lg("o5-pr-g", "#FBFEFF", "#BFE3F2", .3, 1)}
        ${["#FF8A8A", "#FFB86B", "#FFE07A", "#8FD88A", "#7FB8F0", "#B59AF0"].map((c, i) => `<path d="M34 33L60 ${22 + i * 5}V${27 + i * 5}z" fill="${c}"/>`).join("")}
        <path d="M34 33L60 22V52z" fill="none" ${S2}/>
        ${tube("M3 24L18 32", "#FFFFFF", 3.2, 6.4)}
        <path d="M28 11L49 50Q49.5 52 47.5 52H8.5Q6.5 52 7 50z" fill="url(#o5-pr-g)" ${SO}/>
        <path d="M25.5 18L14.5 41" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        ${EYES(23.5, 33.5, 39, 2.3)}${blush(19, 38, 43.5, 2.3, 1.5)}${smile(28.5, 42.6, 2.2, 1.8)}
        ${spark(10, 10, 4, "#F6C85A")}<circle cx="52" cy="12" r="1.6" fill="#B59AF0"/>`,
      observatory_magnet: `${lg("o5-mg-r", "#FF968A", "#D63E3A", 1, 1)}${lg("o5-mg-s", "#FFFFFF", "#AEB6C4")}
        <path d="M8 16H24V34A8 8 0 0 0 40 34V16H56V34A24 24 0 0 1 8 34z" fill="url(#o5-mg-r)" ${SO}/>
        <rect x="8" y="6" width="16" height="12" rx="2.5" fill="url(#o5-mg-s)" ${SO}/><rect x="40" y="6" width="16" height="12" rx="2.5" fill="url(#o5-mg-s)" ${SO}/>
        <path d="M12.5 23V36" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
        <g transform="rotate(14 32 8)"><path d="M30 13V5.5a2.2 2.2 0 0 1 4.4 0V12a1.4 1.4 0 0 1-2.8 0V6.5" fill="none" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/><path d="M30 13V5.5a2.2 2.2 0 0 1 4.4 0V12a1.4 1.4 0 0 1-2.8 0V6.5" fill="none" stroke="#C9D2E2" stroke-width="1.4" stroke-linecap="round"/></g>
        ${EYES(26, 38, 48.5, 2.2)}${blush(20.5, 43.5, 51.5, 2.3, 1.5)}${smile(32, 51.5, 2.2, 1.8)}
        ${spark(4.5, 26, 3, "#F6C85A")}${spark(59.5, 26, 3, "#F6C85A")}`,
      observatory_lookup: `${lg("o5-lu-b", "#525AAE", "#2C2C66")}
        <rect x="4" y="17" width="56" height="34" rx="13" fill="url(#o5-lu-b)" ${SO}/>
        <rect x="8.5" y="21.5" width="47" height="25" rx="9" fill="none" stroke="#F6C85A" stroke-width="1.5" stroke-dasharray="1 3.2" stroke-linecap="round"/>
        ${T("LOOK UP!", 32, 39.3, 12.5, "#FFE58A", 42)}
        ${spark(13, 9, 5, "#FFE27A")}${spark(52, 8, 3.6, "#BFD0FF")}<circle cx="31" cy="7" r="1.5" fill="#F7A8C8"/>
        ${spark(48, 57.5, 3.5, "#F7A8C8")}<circle cx="18" cy="57" r="1.6" fill="#BFD0FF"/>`
    }},
    pins: [
      {id: "tp-observatory-planet", name: "Ringed Planet Pin", kind: "badge", desc: "A glossy little ringed planet in dawn pink and gold.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="o5-pp-b" cx=".32" cy=".28" r=".8"><stop offset="0" stop-color="#FFE0C4"/><stop offset="1" stop-color="#A866BC"/></radialGradient></defs>
          <g transform="translate(15 16) rotate(-18)"><ellipse rx="13.4" ry="4" fill="none" stroke="#6A3E7A" stroke-width="3.4"/><ellipse rx="13.4" ry="4" fill="none" stroke="#F6C85A" stroke-width="1.8"/></g>
          <circle cx="15" cy="15" r="8.6" fill="url(#o5-pp-b)" stroke="#6A3E7A" stroke-width="1.1"/>
          <g transform="translate(15 16) rotate(-18)"><path d="M-13.4 0A13.4 4 0 0 0 13.4 0" fill="none" stroke="#6A3E7A" stroke-width="3.4"/><path d="M-13.6 0A13.4 4 0 0 0 13.6 0" fill="none" stroke="#F6C85A" stroke-width="1.8"/></g>
          <ellipse cx="11.6" cy="10.8" rx="2.4" ry="1.3" fill="#fff" opacity=".75" transform="rotate(-35 11.6 10.8)"/>
          <path d="M25 3.5l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#F6C85A"/></svg>`},
      {id: "tp-observatory-stars", name: "Constellation Washi", kind: "tape", desc: "Night blue washi tape with gold stars joined into little constellations.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#3B3F86" opacity=".86"/>
          <path d="M10 18L20 9L30 14L38 7M50 19L58 12L66 16L74 8" fill="none" stroke="#C9CDF5" stroke-width=".8" opacity=".75"/>
          ${[[10, 18, 1.6], [20, 9, 2.2], [30, 14, 1.5], [38, 7, 1.8], [50, 19, 1.6], [58, 12, 2.2], [66, 16, 1.5], [74, 8, 1.8]].map(([x, y, s]) => spark(x, y, s * 1.4, "#FFE27A")).join("")}
          <circle cx="44" cy="20" r=".9" fill="#fff"/><circle cx="26" cy="21" r=".8" fill="#fff"/><circle cx="80" cy="18" r=".8" fill="#fff"/><circle cx="14" cy="6" r=".8" fill="#fff"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-observatory", name: "Star Chart", desc: "Dawn lavender paper with a ringed planet in the corner and a constellation and crescent moon below. Deep night blue in dark mode."}
  });

  /* ================= ANCIENT RUINS (History) ================= */
  const laurelLeaves = (cx, cy, r, from, to, step, fill, sz = 1) => {
    let s = "";
    for (let th = from, i = 0; th <= to + .01; th += step, i++) {
      const rad = th * Math.PI / 180, x = cx + r * Math.sin(rad), y = cy - r * Math.cos(rad);
      const left = th > 180, base = left ? th + 90 : th - 90;
      for (const side of [-1, 1]) s += `<path d="M0 0Q${3.2 * sz} ${-4 * sz} 0 ${-9 * sz}Q${-3.2 * sz} ${-4 * sz} 0 0z" fill="${fill}" stroke="${O}" stroke-width="1.3" stroke-linejoin="round" transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(base + side * 38 * (left ? 1 : -1))})"/>`;
    }
    return s;
  };
  TP_DATA.push({
    theme: "ruins",
    pack: {name: "Ancient Finds", items: {
      ruins_column: `${lg("r5-cl-m", "#FFFFFF", "#E2D6C4", 1, .4)}${lg("r5-cl-v", "#9BD08A", "#4E9A4A")}
        <rect x="12" y="54" width="40" height="6" rx="2" fill="url(#r5-cl-m)" ${SO}/>
        <rect x="15" y="49" width="34" height="6" rx="2" fill="url(#r5-cl-m)" ${SO}/>
        <rect x="18" y="20" width="28" height="30" fill="url(#r5-cl-m)" ${SO}/>
        <path d="M22.5 23V47M41.5 23V47" stroke="#D3C6B2" stroke-width="2" stroke-linecap="round"/>
        <rect x="15" y="15" width="34" height="7" rx="3" fill="url(#r5-cl-m)" ${SO}/>
        <circle cx="14" cy="18.5" r="6" fill="url(#r5-cl-m)" ${SO}/><circle cx="50" cy="18.5" r="6" fill="url(#r5-cl-m)" ${SO}/>
        <path d="M14 18.5m-1.4 0a1.4 1.4 0 1 1 2.8 0a2.8 2.8 0 1 1-5.6 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M50 18.5m1.4 0a1.4 1.4 0 1 0-2.8 0a2.8 2.8 0 1 0 5.6 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M9 6.5H55L54 13.5H10z" fill="url(#r5-cl-m)" ${SO}/><path d="M44 6.5l-2 3.5 3 1.5" fill="none" stroke="#C4B49C" stroke-width="1.3" stroke-linecap="round"/>
        ${EYES(27, 37, 32, 2.4)}${blush(24.5, 39.5, 37, 2.5, 1.6)}${smile(32, 36.5, 2.4, 1.9)}
        <path d="M15 54Q11 46 18 42" fill="none" stroke="#4E8F4A" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M13 50q-5-1-6 3q5 1 6-3zM16 44.5q-3-4-7-2q3 4 7 2zM18.5 42q1-4.5 5-4q-1 4.5-5 4z" fill="url(#r5-cl-v)" ${SOw(1.4)}/>`,
      ruins_amphora: `${lg("r5-am-b", "#F7AE78", "#C2643A")}<defs><clipPath id="r5-am-c"><path d="M26 12H38V17C50 20 54 28 54 34C54 46 42 52 36 54H28C22 52 10 46 10 34C10 28 14 20 26 17z"/></clipPath></defs>
        ${tube("M26 15C15 12 10 20 14 27", "#D9784A", 3)}${tube("M38 15C49 12 54 20 50 27", "#D9784A", 3)}
        <path d="M27 53H37L41 59Q41 60.5 39.5 60.5H24.5Q23 60.5 23 59z" fill="#B85A34" ${SO}/>
        <path d="M26 12H38V17C50 20 54 28 54 34C54 46 42 52 36 54H28C22 52 10 46 10 34C10 28 14 20 26 17z" fill="url(#r5-am-b)"/>
        <g clip-path="url(#r5-am-c)"><rect x="0" y="40" width="64" height="6" fill="#3A2A2A"/>
          <path d="M10 43q3-3 6 0t6 0t6 0t6 0t6 0t6 0t6 0" fill="none" stroke="#F7AE78" stroke-width="1.5"/></g>
        <path d="M26 12H38V17C50 20 54 28 54 34C54 46 42 52 36 54H28C22 52 10 46 10 34C10 28 14 20 26 17z" fill="none" ${SO}/>
        <path d="M27 16.5H37" stroke="#3A2A2A" stroke-width="1.6"/>
        <rect x="22" y="5" width="20" height="7" rx="2.5" fill="#D9784A" ${SO}/>
        ${SHINE(17, 30, 3.6, 2.2, -60)}
        ${EYES(26, 38, 29.5, 2.4)}${BLUSH(21, 43, 34.5)}${SMILE(32, 33.5, 2.6)}`,
      ruins_owl: `${lg("r5-ow-b", "#CDB49C", "#8C7058")}${lg("r5-ow-w", "#A8896E", "#6E5442")}
        <path d="M15 20L12 6L25 14zM49 20L52 6L39 14z" fill="url(#r5-ow-b)" ${SO}/>
        <ellipse cx="32" cy="36" rx="21.5" ry="23" fill="url(#r5-ow-b)" ${SO}/>
        <path d="M11.5 32Q5 46 17 55Q14 44 18 35z" fill="url(#r5-ow-w)" ${S2}/><path d="M52.5 32Q59 46 47 55Q50 44 46 35z" fill="url(#r5-ow-w)" ${S2}/>
        <ellipse cx="32" cy="47" rx="12" ry="10" fill="#F1E3CF"/>
        <path d="M26 44l2 2 2-2M34 44l2 2 2-2M30 50l2 2 2-2" fill="none" stroke="#B79C82" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="24" cy="29" r="8.6" fill="#F8EEDF" ${S2}/><circle cx="40" cy="29" r="8.6" fill="#F8EEDF" ${S2}/>
        <circle cx="24" cy="29.5" r="4.8" fill="${O}"/><circle cx="40" cy="29.5" r="4.8" fill="${O}"/>
        <circle cx="25.7" cy="27.8" r="1.8" fill="#fff"/><circle cx="41.7" cy="27.8" r="1.8" fill="#fff"/><circle cx="22.7" cy="31.4" r=".8" fill="#fff"/><circle cx="38.7" cy="31.4" r=".8" fill="#fff"/>
        <path d="M29.5 34.5H34.5L32 38.5z" fill="#F2B530" ${SOw(1.5)}/>
        ${blush(16.5, 47.5, 38.5, 2.4, 1.6)}
        <ellipse cx="26" cy="58.6" rx="3.2" ry="1.9" fill="#F2B530" ${SOw(1.5)}/><ellipse cx="38" cy="58.6" rx="3.2" ry="1.9" fill="#F2B530" ${SOw(1.5)}/>`,
      ruins_laurel: `${lg("r5-lr-l", "#BDE6A0", "#5FA866")}${lg("r5-lr-s", "#FFE58A", "#E0A12A")}
        <path d="M24 53.5A22 22 0 0 1 21 13.5M40 53.5A22 22 0 0 0 43 13.5" fill="none" stroke="#4E7A3A" stroke-width="2.6" stroke-linecap="round"/>
        ${laurelLeaves(32, 32, 21.5, 205, 335, 21.5, "url(#r5-lr-l)", 1.25)}${laurelLeaves(32, 32, 21.5, 25, 155, 21.5, "url(#r5-lr-l)", 1.25)}
        <path d="M32 53L22 61L25 52.5zM32 53L42 61L39 52.5z" fill="#D9573F" ${SOw(1.6)}/>
        <path d="M32 53C26 47 21 51 24 55C26 57 30 55 32 53zM32 53C38 47 43 51 40 55C38 57 34 55 32 53z" fill="#E86A52" ${SOw(1.6)}/>
        <circle cx="32" cy="53" r="2.6" fill="#C2442E" ${SOw(1.5)}/>
        <path d="${star(32, 31, 10, 4.8, 5)}" fill="url(#r5-lr-s)" ${S2}/>
        ${spark(32, 7, 3.6, "#F6C85A")}`,
      ruins_olive: `${lg("r5-ol-l", "#C2D8A8", "#6E9A5E")}${rg("r5-ol-g", "#D2E88A", "#7FA83A")}${rg("r5-ol-p", "#B48ACC", "#4E2E66")}
        ${tube("M6 59Q20 46 30 34T58 6", "#8A6A4A", 2.8)}
        ${[[12, 53, -25, 11], [17, 48, 112, 11], [26, 39, -30, 11], [36, 28, -20, 12], [43, 21, 112, 11], [49, 14, -12, 10], [54, 10, 100, 7]].map(([x, y, r, l]) => `<path d="M0 0Q${l * .3} ${-l * .45} 0 ${-l}Q${-l * .3} ${-l * .45} 0 0z" fill="url(#r5-ol-l)" ${S15} transform="translate(${x} ${y}) rotate(${r})"/><path d="M0 -1.5V${f1(-l * .75)}" stroke="#E6F0D8" stroke-width=".9" stroke-linecap="round" transform="translate(${x} ${y}) rotate(${r})"/>`).join("")}
        <path d="M22 41L18 30M33 30L39 36" fill="none" stroke="#6A4E34" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="16.5" cy="25" rx="6.2" ry="7.6" fill="url(#r5-ol-p)" ${S2}/><ellipse cx="15" cy="22.5" rx="1.6" ry="2.2" fill="#fff" opacity=".55"/>
        <ellipse cx="41" cy="45" rx="12" ry="13" fill="url(#r5-ol-g)" ${SO}/>
        ${SHINE(35, 38, 3, 1.9, -50)}
        ${EYES(36.5, 46.5, 45, 2.3)}${blush(33, 50, 49.5, 2.3, 1.5)}${smile(41.5, 49, 2.2, 1.8)}`,
      ruins_coin: `${rg("r5-cn-g", "#FFF1B0", "#E0A12A", .35, .3)}
        <circle cx="32" cy="32" r="27" fill="url(#r5-cn-g)" ${SO}/>
        <circle cx="32" cy="32" r="21.5" fill="none" stroke="#B57E1E" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="24.2" fill="none" stroke="#C99230" stroke-width="1.6" stroke-dasharray=".1 3.4" stroke-linecap="round"/>
        <g fill="#F4C64E" stroke="#9A6812" stroke-width="1.2" stroke-linejoin="round">
          <path d="M17 26.5L32 18L47 26.5z"/><rect x="17" y="26.5" width="30" height="3.2"/>
          <rect x="19.5" y="29.7" width="3.4" height="11.5"/><rect x="26.2" y="29.7" width="3.4" height="11.5"/><rect x="34.4" y="29.7" width="3.4" height="11.5"/><rect x="41.1" y="29.7" width="3.4" height="11.5"/>
          <rect x="16" y="41.2" width="32" height="3.2"/><rect x="14" y="44.4" width="36" height="3"/></g>
        <circle cx="32" cy="23.6" r="1.4" fill="#9A6812"/>
        ${SHINE(19, 15, 5, 2.6, -40)}${spark(55, 8, 4, "#FFE58A")}${spark(7, 55, 3, "#FFE58A")}`,
      ruins_temple: `${lg("r5-tm-s", "#F4A7B4", "#FFE2A6")}${lg("r5-tm-h", "#B9CE86", "#7FA060")}${lg("r5-tm-m", "#FFFFFF", "#E6DACA")}
        <defs><clipPath id="r5-tm-c"><path d="M5 57V30A27 27 0 0 1 59 30V57Q59 60 56 60H8Q5 60 5 57z"/></clipPath></defs>
        <g clip-path="url(#r5-tm-c)">
          <rect x="0" y="0" width="64" height="64" fill="url(#r5-tm-s)"/>
          <circle cx="44" cy="34" r="12" fill="#FFF3C8" opacity=".55"/><circle cx="44" cy="34" r="7.5" fill="#FFE7A0"/>
          <rect x="0" y="38" width="64" height="12" fill="#8FC3D8"/><path d="M38 42h12M44 45h8" stroke="#E6F6FA" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M0 50Q22 39 64 47V64H0z" fill="url(#r5-tm-h)"/>
          <path d="M54 50C50 44 51 32 54.5 22C58 32 59 44 55 50z" fill="#4E7A4E" stroke="${O}" stroke-width="1.6"/>
          <g fill="url(#r5-tm-m)" stroke="${O}" stroke-width="1.6" stroke-linejoin="round">
            <rect x="9" y="47" width="36" height="3.4" rx="1"/><rect x="11" y="44" width="32" height="3.4" rx="1"/>
            <rect x="14" y="30.5" width="4" height="13.5"/><rect x="21" y="30.5" width="4" height="13.5"/><rect x="28" y="30.5" width="4" height="13.5"/>
            <path d="M35 44V36.5L36.5 35.2L37.4 36.4L39 35.5V44z"/>
            <path d="M12 30.5V27.4H34.5L33 30.5z"/><path d="M12 27.4L27 20L32.5 22.6L31 27.4z"/></g>
          <path d="M18 14q2-1.6 4 0q2-1.6 4 0M28 10q1.6-1.3 3.2 0q1.6-1.3 3.2 0" fill="none" stroke="#9C5A6A" stroke-width="1.3" stroke-linecap="round"/></g>
        <path d="M5 57V30A27 27 0 0 1 59 30V57Q59 60 56 60H8Q5 60 5 57z" fill="none" ${SO}/>`,
      ruins_history: `${lg("r5-mh-t", "#FFFBF2", "#E6D8C0")}${lg("r5-mh-l", "#A6D486", "#4E8F4A")}
        <rect x="5" y="9" width="54" height="40" rx="7" fill="url(#r5-mh-t)" ${SO}/>
        <rect x="9.5" y="13.5" width="45" height="31" rx="4" fill="none" stroke="#C9B48E" stroke-width="1.4"/>
        <path d="M51 9.5l-2.6 4.2 2.4 2.2" fill="none" stroke="#B6A07C" stroke-width="1.3" stroke-linecap="round"/>
        ${T("MAKE", 32, 27.5, 11, "#B5523A", 28)}${T("HISTORY", 32, 40.5, 11, "#2F5E66", 40)}
        <path d="M32 58Q20 60 10 52M32 58Q44 60 54 52" fill="none" stroke="#4E7A3A" stroke-width="1.8" stroke-linecap="round"/>
        ${[[14, 54.5, -150], [20, 57.5, -120], [26, 58.8, -100], [50, 54.5, 150], [44, 57.5, 120], [38, 58.8, 100]].map(([x, y, r]) => `<path d="M0 0Q2.6 -3.2 0 -7.4Q-2.6 -3.2 0 0z" fill="url(#r5-mh-l)" stroke="${O}" stroke-width="1.4" stroke-linejoin="round" transform="translate(${x} ${y}) rotate(${r})"/>`).join("")}
        <circle cx="32" cy="58" r="2" fill="#D9573F" ${SOw(1.4)}/>`
    }},
    pins: [
      {id: "tp-ruins-owlcoin", name: "Owl Coin Pin", kind: "badge", desc: "A tiny golden coin stamped with a wise little owl.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="r5-pc-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF1B0"/><stop offset="1" stop-color="#D2921E"/></radialGradient></defs>
          <circle cx="15" cy="15" r="13" fill="url(#r5-pc-g)" stroke="#7A5210" stroke-width="1.1"/>
          <circle cx="15" cy="15" r="10.2" fill="none" stroke="#B57E1E" stroke-width=".9"/>
          <g stroke="#8A5E12" stroke-width=".9" stroke-linejoin="round"><path d="M9.6 10L9 6.6L12.2 8.6zM20.4 10L21 6.6L17.8 8.6z" fill="#E8B640"/>
          <ellipse cx="15" cy="15.6" rx="6.6" ry="7" fill="#F2C24A"/><circle cx="12.4" cy="13.6" r="2.4" fill="#FFF0B8"/><circle cx="17.6" cy="13.6" r="2.4" fill="#FFF0B8"/></g>
          <circle cx="12.6" cy="13.8" r="1.2" fill="#5A3E0A"/><circle cx="17.4" cy="13.8" r="1.2" fill="#5A3E0A"/><path d="M14.2 16.2h1.6L15 17.6z" fill="#B5521E"/>
          <ellipse cx="9" cy="7.6" rx="2.4" ry="1.2" fill="#fff" opacity=".7" transform="rotate(-40 9 7.6)"/></svg>`},
      {id: "tp-ruins-meander", name: "Meander Washi", kind: "tape", desc: "Terracotta washi tape printed with a classic Greek key border.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#C9673E" opacity=".84"/>
          <path d="${Array.from({length: 8}, (_, i) => { const x = 6 + i * 9.5; return `M${x} 18.5H${f1(x + 9.5)}M${x} 18.5V7.5H${f1(x + 7)}V14.5H${f1(x + 3)}V11`; }).join("")}" fill="none" stroke="#FFF1DC" stroke-width="1.4" stroke-linejoin="round" opacity=".95"/>
          <path d="M5 4H81M5 22H81" stroke="#FFF1DC" stroke-width=".9" opacity=".7"/></svg>`}
    ],
    card: {id: "tp-ruins", name: "Marble Tablet", desc: "Warm marble paper with a Greek key border, a little Ionic column and an olive sprig. Moonlit slate in dark mode."}
  });

  /* ================= GREEN VALLEY (Environmental Science) ================= */
  const loopArrows = (cx, cy, r, cols) => {
    let back = "", front = "";
    cols.forEach((c, i) => {
      const a0 = (i * 120 + 18) * Math.PI / 180, a1 = (i * 120 + 92) * Math.PI / 180;
      const P = a => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
      const [x0, y0] = P(a0), [x1, y1] = P(a1);
      const d = `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 0 1 ${f1(x1)} ${f1(y1)}`;
      const tx = Math.cos(a1), ty = Math.sin(a1), nx = Math.sin(a1), ny = -Math.cos(a1);
      const head = `M${f1(x1 + nx * 7)} ${f1(y1 + ny * 7)}L${f1(x1 + tx * 9)} ${f1(y1 + ty * 9)}L${f1(x1 - nx * 7)} ${f1(y1 - ny * 7)}z`;
      back += `<path d="${d}" fill="none" stroke="${O}" stroke-width="9.6"/>`;
      front += `<path d="${d}" fill="none" stroke="${c}" stroke-width="5.4"/><path d="${head}" fill="${c}" ${S2}/>`;
    });
    return back + front;
  };
  TP_DATA.push({
    theme: "valley",
    pack: {name: "Grow Green", items: {
      valley_sprout: `${lg("v5-sp-p", "#F7AE78", "#C2643A")}${lg("v5-sp-l", "#A6DE8A", "#4E9A4A")}
        ${tube("M32 31V19", "#5FA866", 2.6)}
        <path d="M32 21C27 11 15 10 9 14C13 23 26 26 32 21z" fill="url(#v5-sp-l)" ${SO}/><path d="M31 20.5C25 16 18 15 13 15.5" fill="none" stroke="#D8F4C8" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M32 19C36 8 48 4 55 8C51 19 40 23 32 19z" fill="url(#v5-sp-l)" ${SO}/><path d="M33 18C38 12 45 9 51 9" fill="none" stroke="#D8F4C8" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M16 37H48L44 57.5Q43.5 60 41 60H23Q20.5 60 20 57.5z" fill="url(#v5-sp-p)" ${SO}/>
        <rect x="11" y="29" width="42" height="9" rx="3.5" fill="#E08A56" ${SO}/>
        ${EYES(26, 38, 45.5, 2.4)}${blush(22, 42, 50.5, 2.6, 1.7)}${smile(32, 49.5, 2.5, 2)}
        ${spark(8, 32, 3.6, "#F6C84E")}${spark(56, 22, 3, "#9FD49A")}`,
      valley_solar: `${lg("v5-so-p", "#6FA8E8", "#2F5FA8", 1, 1)}${rg("v5-so-s", "#FFF4B8", "#F6B830", .5, .5)}
        <g fill="#F6C84E">${rot(8, a => `<path d="M14 14L12 2.5Q14 1 16 2.5z" transform="rotate(${a} 14 14)"/>`)}</g>
        <circle cx="14" cy="14" r="7.6" fill="url(#v5-so-s)" ${S2}/>
        <rect x="4" y="55" width="56" height="6" rx="3" fill="#7CC47A" ${S2}/>
        ${tube("M26 47V56M44 44V56", "#9AA6B8", 2.6)}
        <path d="M17 26L55 20L60 42L11 49z" fill="url(#v5-so-p)" ${SO}/>
        <path d="M14 37.5L57.5 31M26.7 24.5L24.4 47M36.3 23L37.5 45M45.9 21.5L49.3 43.4" fill="none" stroke="#CFE3FA" stroke-width="1.2" opacity=".75"/>
        <path d="M20 28L30 26.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <circle cx="30" cy="35" r="3.2" fill="#fff"/><circle cx="42" cy="33" r="3.2" fill="#fff"/><circle cx="30.4" cy="35.4" r="2" fill="${O}"/><circle cx="42.4" cy="33.4" r="2" fill="${O}"/>
        <path d="M33.5 39.6q2.8 2.4 5.6-.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="25.5" cy="39.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".85"/><ellipse cx="46.5" cy="37" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".85"/>`,
      valley_bee: `${rg("v5-be-b", "#FFF0A0", "#F2B530", .3, .3)}<defs><clipPath id="v5-be-c"><ellipse cx="30" cy="39" rx="18.5" ry="15"/></clipPath></defs>
        <path d="M11 61V53" stroke="#4E9A4A" stroke-width="1.8" stroke-linecap="round"/><g fill="#FFFFFF" ${SOw(1.3)}>${rot(5, a => `<circle cx="11" cy="47" r="2.6" transform="rotate(${a} 11 51)"/>`)}</g><circle cx="11" cy="51" r="2" fill="#F6C84E" ${SOw(1.2)}/>
        <ellipse cx="27" cy="19" rx="8" ry="10.5" fill="#E6F4FF" fill-opacity=".95" ${S2} transform="rotate(-20 27 19)"/>
        <ellipse cx="39" cy="20" rx="7.5" ry="10" fill="#E6F4FF" fill-opacity=".95" ${S2} transform="rotate(18 39 20)"/>
        <path d="M27 14q-1 6 1 10M39 15q1 5-1 9" fill="none" stroke="#B8D6EE" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M48 39L55 37L49 43z" fill="${O}" ${SOw(1.6)}/>
        <ellipse cx="30" cy="39" rx="18.5" ry="15" fill="url(#v5-be-b)"/>
        <g clip-path="url(#v5-be-c)"><path d="M33 22h5.5v36H33zM42.5 22H48v36h-5.5z" fill="#3A2E3E"/></g>
        <ellipse cx="30" cy="39" rx="18.5" ry="15" fill="none" ${SO}/>
        <path d="M17 27Q13 20 9 21M23 25Q22 18 24 15" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="21" r="2.2" fill="${O}"/><circle cx="24" cy="15" r="2.2" fill="${O}"/>
        ${EYES(19, 28, 37, 2.3)}${blush(15.5, 31, 42, 2.3, 1.5)}${smile(23.5, 41, 2.3, 1.8)}
        ${spark(56, 10, 4, "#F6C84E")}`,
      valley_loop: `${lg("v5-lp-l", "#B6E89A", "#4E9A4A")}
        ${loopArrows(32, 33, 20, ["#5FB86A", "#3F9A5A", "#7CC47A"])}
        <path d="M32 46C22 41 22 29 32 20C42 29 42 41 32 46z" fill="url(#v5-lp-l)" ${S2}/>
        <path d="M32 46V40.5" stroke="#3F8F4E" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="28.8" cy="33" r="1.7" fill="${O}"/><circle cx="35.2" cy="33" r="1.7" fill="${O}"/><circle cx="29.3" cy="32.4" r=".55" fill="#fff"/><circle cx="35.7" cy="32.4" r=".55" fill="#fff"/>
        <path d="M30.3 36.2q1.7 1.4 3.4 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="26.6" cy="36.6" rx="1.5" ry="1" fill="#FF8FA8"/><ellipse cx="37.4" cy="36.6" rx="1.5" ry="1" fill="#FF8FA8"/>`,
      valley_acorn: `${rg("v5-ac-n", "#FFD89A", "#C98A3E", .35, .3)}${lg("v5-ac-c", "#B47A46", "#7A4A24")}<defs><clipPath id="v5-ac-k"><path d="M9 30C9 18 19 11 32 11C45 11 55 18 55 30Q32 37 9 30z"/></clipPath></defs>
        <path d="M14 29C14 46 24 58 32 60C40 58 50 46 50 29z" fill="url(#v5-ac-n)" ${SO}/>
        ${SHINE(19, 40, 3.4, 2, -70)}
        <path d="M9 30C9 18 19 11 32 11C45 11 55 18 55 30Q32 37 9 30z" fill="url(#v5-ac-c)"/>
        <g clip-path="url(#v5-ac-k)" stroke="#5E3A1C" stroke-width="1.2" opacity=".6">${Array.from({length: 9}, (_, i) => `<path d="M${i * 7 - 4} 40L${i * 7 + 16} 8M${i * 7 + 4} 40L${i * 7 - 16} 8"/>`).join("")}</g>
        <path d="M9 30C9 18 19 11 32 11C45 11 55 18 55 30Q32 37 9 30z" fill="none" ${SO}/>
        ${tube("M32 11Q32 6 37 4", "#7A4A24", 2.6)}
        ${EYES(26, 38, 41.5, 2.4)}${BLUSH(21, 43, 46.5)}${SMILE(32, 45.5, 2.6)}`,
      valley_hills: `${lg("v5-hl-s", "#B6E2F6", "#EFF9E6")}${lg("v5-hl-a", "#A9DA8E", "#7CC47A")}${lg("v5-hl-b", "#7CC47A", "#4E9A4A")}
        <defs><clipPath id="v5-hl-c"><circle cx="32" cy="32" r="27"/></clipPath></defs>
        <g clip-path="url(#v5-hl-c)">
          <rect width="64" height="64" fill="url(#v5-hl-s)"/>
          <circle cx="47" cy="17" r="6" fill="#FFE07A"/>
          <path d="M8 13q2-2 4 0q2-2 4 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          <path d="M0 38Q16 25 34 34T64 30V64H0z" fill="url(#v5-hl-a)" stroke="${O}" stroke-width="1.6"/>
          <path d="M20 32V14" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/><path d="M20 32V14" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
          <g stroke="${O}" stroke-width="1.1" fill="#fff" stroke-linejoin="round">${[0, 120, 240].map(a => `<path d="M20 14L19 4.5Q20 3.5 21 4.5z" transform="rotate(${a + 15} 20 14)"/>`).join("")}</g><circle cx="20" cy="14" r="1.5" fill="#F6C84E" stroke="${O}" stroke-width="1"/>
          <path d="M0 50Q24 38 44 47T64 44V64H0z" fill="url(#v5-hl-b)" stroke="${O}" stroke-width="1.6"/>
          <path d="M30 64C34 57 25 53 31 46.5L34.5 46.8C30 53 40 57 37 64z" fill="#8FD0EE" stroke="${O}" stroke-width="1.4"/>
          <circle cx="12" cy="47" r="3.6" fill="#3F8F4E" stroke="${O}" stroke-width="1.4"/><circle cx="50" cy="45" r="3.2" fill="#3F8F4E" stroke="${O}" stroke-width="1.4"/><circle cx="55.5" cy="46" r="2.4" fill="#5FA866" stroke="${O}" stroke-width="1.4"/></g>
        <circle cx="32" cy="32" r="27" fill="none" ${SO}/>`,
      valley_can: `${lg("v5-wc-b", "#86D8D6", "#2F8F90")}${lg("v5-wc-l", "#A6DE8A", "#4E9A4A")}
        ${tube("M27 27C27 14 5 14 9.5 37", "#2F8F90", 3.4)}
        ${tube("M35 47L49 28", "#3FA3A2", 4.4)}
        <ellipse cx="51" cy="25.5" rx="4" ry="6.4" fill="#86D8D6" ${S2} transform="rotate(37 51 25.5)"/>
        <g fill="#8FC8F0" ${SOw(1.3)}><path d="M56 31c1 1.8 2 2.8 2 3.8a2 2 0 0 1-4 0c0-1 1-2 2-3.8z"/><path d="M50 36c1 1.8 2 2.8 2 3.8a2 2 0 0 1-4 0c0-1 1-2 2-3.8z"/><path d="M57 41c1 1.8 2 2.8 2 3.8a2 2 0 0 1-4 0c0-1 1-2 2-3.8z"/></g>
        <rect x="9" y="27" width="27" height="27" rx="5.5" fill="url(#v5-wc-b)" ${SO}/>
        <path d="M13.5 32V44" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
        ${EYES(18, 28, 39, 2.3)}${blush(14.6, 31.4, 43.6, 2.3, 1.5)}${smile(23, 42.6, 2.3, 1.8)}
        <ellipse cx="51" cy="59" rx="9" ry="2.8" fill="#A0643A" ${SOw(1.6)}/>
        <path d="M51 57V51" stroke="#4E9A4A" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M51 52C48 48 44 49 43 51C46 54 49 53 51 52zM51 51C53 47 57 47 59 49C57 52 53 53 51 51z" fill="url(#v5-wc-l)" ${SOw(1.4)}/>`,
      valley_gogreen: `${lg("v5-gg-l", "#8ED67E", "#2F8A4E", 1, 1)}
        <path d="M9 55Q5 59 3 58" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M9 55Q5 59 3 58" fill="none" stroke="#3F8F4E" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M8 56C3 30 22 5 59 5C61 41 38 61 8 56z" fill="url(#v5-gg-l)" ${SO}/>
        <path d="M9 55L16 48M46 18L56 8" stroke="#D8F4C8" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>
        ${T("GO", 33, 31, 14, "#FFFFFF", 22)}${T("GREEN", 31, 45.5, 11, "#FFF6C4", 34)}
        ${spark(12, 12, 4.6, "#F6C84E")}${spark(57, 52, 3.4, "#9FD49A")}`
    }},
    pins: [
      {id: "tp-valley-ladybug", name: "Ladybug Pin", kind: "badge", desc: "A shiny little ladybug resting on a leaf.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="v5-pl-r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF8A7A"/><stop offset="1" stop-color="#C8302A"/></radialGradient></defs>
          <path d="M2 24C4 14 14 8 28 10C26 22 16 28 2 24z" fill="#6FBF6A" stroke="#2F6F3A" stroke-width="1"/><path d="M4 23C12 19 18 15 25 12" fill="none" stroke="#C8EDB4" stroke-width=".8"/>
          <circle cx="15" cy="8.6" r="4" fill="#2B2233"/><circle cx="13.5" cy="8" r=".9" fill="#fff"/><circle cx="16.5" cy="8" r=".9" fill="#fff"/>
          <ellipse cx="15" cy="16" rx="9" ry="8.4" fill="url(#v5-pl-r)" stroke="#5A1414" stroke-width="1.1"/>
          <path d="M15 8V24" stroke="#2B2233" stroke-width="1.1"/>
          <g fill="#2B2233"><circle cx="10.5" cy="14" r="1.7"/><circle cx="19.5" cy="14" r="1.7"/><circle cx="11" cy="19.5" r="1.4"/><circle cx="19" cy="19.5" r="1.4"/></g>
          <ellipse cx="11" cy="10.8" rx="2" ry="1.1" fill="#fff" opacity=".7" transform="rotate(-30 11 10.8)"/></svg>`},
      {id: "tp-valley-meadow", name: "Meadow Washi", kind: "tape", desc: "Fresh green washi tape with leaves and tiny wind turbines.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#9ED89A" opacity=".82"/>
          <path d="M3 21Q20 16 40 20T83 18V24.5H3z" fill="#5FA866" opacity=".55"/>
          ${[[22, 20], [62, 18.5]].map(([x, y]) => `<path d="M${x} ${y}V9" stroke="#fff" stroke-width="1.2"/>${[0, 120, 240].map(a => `<path d="M${x} 9L${x - .7} 3.4Q${x} 2.8 ${x + .7} 3.4z" fill="#fff" transform="rotate(${a + 20} ${x} 9)"/>`).join("")}<circle cx="${x}" cy="9" r=".9" fill="#F6C84E"/>`).join("")}
          ${[[9, 10, -30], [40, 8, 20], [50, 13, -50], [76, 9, 30]].map(([x, y, r]) => `<path d="M0 3Q-3 0 0 -4Q3 0 0 3z" fill="#3F8F4E" transform="translate(${x} ${y}) rotate(${r})"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-valley", name: "Meadow Notes", desc: "Fresh mint paper with rolling hills and a wind turbine in the corner and a leafy sprig above. Firefly night in dark mode."}
  });

  /* ================= SKETCH CITY (Architecture) ================= */
  TP_DATA.push({
    theme: "sketchcity",
    pack: {name: "Draft and Build", items: {
      sketchcity_pencil: `${lg("s5-pn-b", "#9CB4DA", "#5D78A6")}${lg("s5-pn-f", "#FFFFFF", "#AEB6C4")}
        <path d="M6 58q4-5 8-1t8-1" fill="none" stroke="#7A8CA8" stroke-width="2.2" stroke-linecap="round"/>
        <g transform="rotate(-40 32 32)">
          <path d="M4 32L16 25V39z" fill="#F3D3A8" ${SO}/><path d="M4 32L8.6 29.3V34.7z" fill="#4A4A58"/>
          <rect x="16" y="25" width="30" height="14" fill="url(#s5-pn-b)" ${SO}/>
          <path d="M18 27.8H44" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
          <rect x="46" y="25" width="6.5" height="14" fill="url(#s5-pn-f)" ${SO}/><path d="M49.2 25.6V38.4" stroke="#8C94A6" stroke-width="1.2"/>
          <path d="M52.5 25H57Q60.5 25 60.5 28.5V35.5Q60.5 39 57 39H52.5z" fill="#F7A6B8" ${SO}/>
          ${EYES(27, 35, 31.4, 1.9)}<path d="M29.4 34.6q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
          <ellipse cx="23.6" cy="34.6" rx="1.9" ry="1.2" fill="#FF8FA8" opacity=".85"/><ellipse cx="38.4" cy="34.6" rx="1.9" ry="1.2" fill="#FF8FA8" opacity=".85"/></g>
        ${spark(52, 50, 4, "#F6C84E")}`,
      sketchcity_square: `${lg("s5-sq-g", "#DDF5F0", "#8FD3C8", 1, 1)}
        <path d="M7 9Q7 4.5 10.2 7.7L56.3 53.8Q59.5 57 55 57H10Q7 57 7 54z" fill="url(#s5-sq-g)" ${SO}/>
        <path d="M13.5 23.5V38H28z" fill="#F8FFFD" ${S2}/>
        <path d="${Array.from({length: 11}, (_, i) => `M${12 + i * 4} 57V${i % 2 ? 54.4 : 53}`).join("")}${Array.from({length: 10}, (_, i) => `M7 ${16 + i * 4}H${i % 2 ? 9.6 : 11}`).join("")}" stroke="#2F7F7A" stroke-width="1.2" stroke-linecap="round"/>
        ${EYES(19, 30, 44.5, 2.2)}${blush(15.5, 34, 49, 2.3, 1.5)}${smile(24.5, 48.4, 2.2, 1.8)}
        ${spark(50, 14, 4.4, "#F6C84E")}<circle cx="40" cy="8" r="1.5" fill="#7FB8F0"/>`,
      sketchcity_blueprint: `${lg("s5-bp-s", "#5C92DA", "#2F5FA8")}${lg("s5-bp-r", "#9CC4F2", "#4F7FC8")}
        <rect x="9" y="14" width="46" height="45" rx="2" fill="url(#s5-bp-s)" ${SO}/>
        <path d="${Array.from({length: 7}, (_, i) => `M${15 + i * 6} 19V57`).join("")}${Array.from({length: 6}, (_, i) => `M11 ${24 + i * 6}H53`).join("")}" stroke="#fff" stroke-width=".8" opacity=".18"/>
        <g fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
          <path d="M18 49V35L32 25L46 35V49z"/><path d="M29 49V41.5H35V49"/><rect x="20.5" y="37.5" width="5.5" height="5"/><rect x="38" y="37.5" width="5.5" height="5"/>
          <path d="M18 54H46M18 52V56M46 52V56" stroke-width="1.3"/></g>
        <path d="M55 51L47 59H53Q55 59 55 57z" fill="#BCD6F4" ${S2}/>
        <rect x="5" y="7" width="54" height="11" rx="5.5" fill="url(#s5-bp-r)" ${SO}/>
        <circle cx="10.5" cy="12.5" r="3.4" fill="#DDEBFB" ${SOw(1.5)}/><path d="M10.5 12.5m-1 0a1 1 0 1 1 2 0" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M17 10H54" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
      sketchcity_tower: `${lg("s5-tw-b", "#FFD0B0", "#F29A7A")}
        <rect x="4" y="56.5" width="56" height="4.5" rx="2.2" fill="#B8C4D4" ${S2}/>
        <rect x="14" y="12" width="36" height="22" fill="#EEF4FF"/>
        <g fill="none" stroke="#5F7FB8" stroke-width="1.8" stroke-dasharray="3 2.4" stroke-linecap="round">
          <path d="M14 33V12H50V33"/><rect x="18.5" y="15" width="7" height="6"/><rect x="38.5" y="15" width="7" height="6"/><rect x="28.5" y="15" width="7" height="6"/></g>
                <g transform="translate(45 13) rotate(52)"><rect x="-2.7" y="-13" width="5.4" height="9" fill="#7F9CC8" ${SOw(1.5)}/><path d="M-2.7 -13V-14.2Q-2.7 -16 0 -16Q2.7 -16 2.7 -14.2V-13z" fill="#F7A6B8" ${SOw(1.5)}/><path d="M0 0L2.7 -4H-2.7z" fill="#F3D3A8" ${SOw(1.5)}/><path d="M0 0L1 -1.5H-1z" fill="#4A4A58"/></g>
        <rect x="14" y="33" width="36" height="24" rx="1.5" fill="url(#s5-tw-b)" ${SO}/>
        <path d="M14 36.5H50" stroke="#D9785A" stroke-width="1.4"/>
        <path d="M28.5 57V51.5Q28.5 49 32 49Q35.5 49 35.5 51.5V57z" fill="#4FA3A8" ${SOw(1.6)}/>
        <rect x="17" y="49" width="6" height="5" rx="1" fill="#9FD8E6" ${SOw(1.4)}/><rect x="41" y="49" width="6" height="5" rx="1" fill="#9FD8E6" ${SOw(1.4)}/>
        ${EYES(26, 38, 42, 2.3)}${blush(21.5, 42.5, 46, 2.4, 1.5)}${smile(32, 45.2, 2.3, 1.8)}
        ${spark(57, 5, 3.6, "#7FB8F0")}`,
      sketchcity_hardhat: `${lg("s5-hh-y", "#FFE88A", "#F2B530")}
        <g transform="translate(0 6)">
          <path d="M11 41C11 23 20 12 32 12C44 12 53 23 53 41z" fill="url(#s5-hh-y)" ${SO}/>
          <path d="M27.5 12.8Q32 11.4 36.5 12.8V20.5Q32 19.4 27.5 20.5z" fill="#FFD24A" ${S2}/>
          <path d="M4 44.5Q4 40 9 40H55Q60 40 60 44.5Q60 49 55 49H9Q4 49 4 44.5z" fill="#F2B530" ${SO}/>
          ${SHINE(18.5, 24, 4, 2.2, -55)}
          ${EYES(25, 39, 30, 2.4)}${BLUSH(20, 44, 35)}${SMILE(32, 34, 2.6)}</g>
        ${spark(56, 9, 4, "#7FB8F0")}${spark(8, 11, 3, "#F6C84E")}`,
      sketchcity_cone: `${lg("s5-cn-o", "#FFB070", "#F0702E", 1, 0)}<defs><clipPath id="s5-cn-c"><path d="M28 7Q32 4.6 36 7L48 51H16z"/></clipPath></defs>
        <rect x="7" y="49" width="50" height="9" rx="3" fill="#E0602A" ${SO}/>
        <path d="M28 7Q32 4.6 36 7L48 51H16z" fill="url(#s5-cn-o)"/>
        <g clip-path="url(#s5-cn-c)" fill="#FFF6EA"><rect x="0" y="15" width="64" height="6.5"/><rect x="0" y="37" width="64" height="7"/></g>
        <path d="M28 7Q32 4.6 36 7L48 51H16z" fill="none" ${SO}/>
        <path d="M27 13L20 40" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>
        ${EYES(27.5, 36.5, 28, 2.1)}${blush(24.5, 39.5, 32.4, 2, 1.3)}${smile(32, 31.4, 2.1, 1.7)}
        ${spark(54, 14, 4, "#F6C84E")}${spark(10, 30, 3, "#7FB8F0")}`,
      sketchcity_skyline: `${rg("s5-sk-b", "#4A82D2", "#1F4A8A", .4, .3)}<defs><clipPath id="s5-sk-c"><circle cx="32" cy="32" r="27"/></clipPath></defs>
        <circle cx="32" cy="32" r="27" fill="url(#s5-sk-b)"/>
        <g clip-path="url(#s5-sk-c)">
          <path d="${Array.from({length: 8}, (_, i) => `M${4 + i * 8} 0V64M0 ${4 + i * 8}H64`).join("")}" stroke="#fff" stroke-width=".7" opacity=".15"/>
          <g fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">
            <path d="M9 58V38H19V58M21 58V24H31V58M27 24V19"/><path d="M33 58V32H42V58" stroke-dasharray="2.6 2"/><path d="M44 58V40H54V58"/>
            <path d="M24 29h4M24 35h4M24 41h4M24 47h4M12 43h4M12 49h4M47 45h4M47 51h4" stroke-width="1.4"/>
            <path d="M4 58H60" stroke-width="1.6"/>
            <path d="M48 40V14M38 15H58M48 14L42 15M58 15V20" stroke="#FFD86B" stroke-width="1.6"/><path d="M54 15V23.5" stroke="#FFD86B" stroke-width="1"/></g>
          <path d="M11 30A22 22 0 0 1 30 10" fill="none" stroke="#BFD6F6" stroke-width="1.2" stroke-dasharray="2 2.4"/></g>
        <circle cx="32" cy="32" r="27" fill="none" ${SO}/>`,
      sketchcity_buildbig: `${lg("s5-bb-b", "#5690DE", "#2A5AA6")}<defs><clipPath id="s5-bb-c"><rect x="4" y="18" width="56" height="38" rx="9"/></clipPath></defs>
        <path d="M14 19L32 6.5L50 19" fill="none" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M32 7V3.5" stroke="${O}" stroke-width="1.8"/><path d="M29.5 3.4A2.5 2.5 0 1 1 32 5.6" fill="none" stroke="#F6C84E" stroke-width="2" stroke-linecap="round"/>
        <rect x="4" y="18" width="56" height="38" rx="9" fill="url(#s5-bb-b)"/>
        <g clip-path="url(#s5-bb-c)"><path d="${Array.from({length: 9}, (_, i) => `M${8 + i * 6} 18V56`).join("")}${Array.from({length: 6}, (_, i) => `M4 ${22 + i * 6}H60`).join("")}" stroke="#fff" stroke-width=".8" opacity=".16"/></g>
        <rect x="4" y="18" width="56" height="38" rx="9" fill="none" ${SO}/>
        <circle cx="14" cy="19" r="1.8" fill="#DDEBFB" ${SOw(1.2)}/><circle cx="50" cy="19" r="1.8" fill="#DDEBFB" ${SOw(1.2)}/>
        ${T("BUILD", 32, 35.5, 12.5, "#FFFFFF", 38)}${T("BIG!", 32, 50, 13, "#FFD86B", 28)}`
    }},
    pins: [
      {id: "tp-sketchcity-hardhat", name: "Hard Hat Pin", kind: "badge", desc: "A glossy little yellow hard hat, ready for the build.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="s5-ph-y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEB9A"/><stop offset="1" stop-color="#E8A820"/></linearGradient></defs>
          <path d="M5 20C5 11 9.5 5 15 5C20.5 5 25 11 25 20z" fill="url(#s5-ph-y)" stroke="#8A5E10" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M12.8 5.4Q15 4.8 17.2 5.4V10Q15 9.4 12.8 10z" fill="#FFD24A" stroke="#8A5E10" stroke-width=".9"/>
          <path d="M1.5 21.5Q1.5 19 4 19H26Q28.5 19 28.5 21.5Q28.5 24 26 24H4Q1.5 24 1.5 21.5z" fill="#F2B530" stroke="#8A5E10" stroke-width="1.1"/>
          <ellipse cx="9.4" cy="11" rx="2.2" ry="1.2" fill="#fff" opacity=".75" transform="rotate(-50 9.4 11)"/></svg>`},
      {id: "tp-sketchcity-ruler", name: "Ruler Clip", kind: "clip", desc: "A little wooden scale ruler that clips over the edge of the note.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="s5-pr-w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FBE2B0"/><stop offset="1" stop-color="#D9A862"/></linearGradient></defs>
          <path d="M8 13V5a3.5 3.5 0 0 1 7 0v10" fill="none" stroke="#6E7686" stroke-width="2.6" stroke-linecap="round"/><path d="M8 13V5a3.5 3.5 0 0 1 7 0v10" fill="none" stroke="#D6DCE6" stroke-width="1.2" stroke-linecap="round"/>
          <rect x="4" y="10" width="13" height="38" rx="2" fill="url(#s5-pr-w)" stroke="#7D5226" stroke-width="1.1"/>
          <path d="${Array.from({length: 12}, (_, i) => `M17 ${13 + i * 3}H${i % 2 ? 14.4 : 12.4}`).join("")}" stroke="#7D5226" stroke-width=".8"/>
          <path d="M6.5 13V45" stroke="#fff" stroke-width="1" opacity=".55"/>
          <circle cx="8.6" cy="44.5" r="1.4" fill="#4F86D6"/></svg>`}
    ],
    card: {id: "tp-sketchcity", name: "Drafting Sheet", desc: "Crisp drafting paper with a blue grid, a pencil skyline in the corner and a set square up top. Blueprint blue in dark mode."}
  });
})();































