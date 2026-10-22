/* ===== module: 96-tp-m1.js ===== */
/* Theme Collections, Study Fields batch m1: business, nursing, psych, biology */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const rot = (n, f) => Array.from({length: n}, (_, i) => f(i * 360 / n, i)).join("");
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const star = (cx, cy, R, r, n = 5) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + (cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1); } return d + "z"; };
  const scal = (cx, cy, r, n, b) => { let d = ""; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1)), c = [cx + (r + b) * Math.cos(am), cy + (r + b) * Math.sin(am)].map(v => v.toFixed(1)); d += (i ? "" : `M${p(a0)}`) + `Q${c} ${p(a1)}`; } return d + "z"; };
  // small mouth and blush helpers sized for tight spots
  const mouth = (x, y, w = 2, sw = 1.8) => `<path d="M${x - w} ${y}q${w} ${w * .85} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const cheeks = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const shut = (a, b, y, w = 2.6) => `<path d="M${a - w} ${y}q${w} ${-w * .9} ${w * 2} 0M${b - w} ${y}q${w} ${-w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const heartD = (cx, cy, s) => `M${cx} ${cy + 9 * s}C${cx - 4 * s} ${cy + 6 * s} ${cx - 10 * s} ${cy + 2 * s} ${cx - 10 * s} ${cy - 3 * s}C${cx - 10 * s} ${cy - 7 * s} ${cx - 7 * s} ${cy - 9 * s} ${cx - 4.5 * s} ${cy - 9 * s}C${cx - 2.4 * s} ${cy - 9 * s} ${cx - .8 * s} ${cy - 8 * s} ${cx} ${cy - 6 * s}C${cx + .8 * s} ${cy - 8 * s} ${cx + 2.4 * s} ${cy - 9 * s} ${cx + 4.5 * s} ${cy - 9 * s}C${cx + 7 * s} ${cy - 9 * s} ${cx + 10 * s} ${cy - 7 * s} ${cx + 10 * s} ${cy - 3 * s}C${cx + 10 * s} ${cy + 2 * s} ${cx + 4 * s} ${cy + 6 * s} ${cx} ${cy + 9 * s}z`;
  // a thick outlined stroke (outline first, colour on top)
  const tube = (d, w, c, extra = "") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

  /* ================= BUSINESS: Market District ================= */
  TP_DATA.push({
    theme: "business",
    pack: {name: "Profit Pals", items: {
      business_coin: `${rg("bz-cn-g", "#FFF4B8", "#EDB02E")}
        <circle cx="32" cy="34" r="26" fill="#C98A1A" ${SO}/>
        <circle cx="32" cy="31" r="26" fill="url(#bz-cn-g)" ${SO}/>
        <circle cx="32" cy="31" r="20.5" fill="none" stroke="#D9981E" stroke-width="2.4" stroke-dasharray=".1 4.6" stroke-linecap="round"/>
        <path d="${star(32, 15.5, 4.6, 2)}" fill="#FFF8D6" stroke="#C98A1A" stroke-width="1.2" stroke-linejoin="round"/>
        ${EYES(24, 40, 31, 2.7)}${cheeks(19, 45, 37, 3, 2)}${mouth(32, 36, 3, 2.2)}
        ${SHINE(17, 19, 5, 2.6, -40)}${spark(55, 9, 4.5, "#FFE07A")}`,
      business_chart: `${lg("bz-ch-a", "#8FE0C8", "#3BA88A")}${lg("bz-ch-b", "#7FC4F2", "#3A7FC8")}${lg("bz-ch-c", "#FFD36B", "#F0A030")}
        <rect x="5" y="40" width="15" height="19" rx="3.5" fill="url(#bz-ch-b)" ${SO}/>
        <rect x="24.5" y="31" width="15" height="28" rx="3.5" fill="url(#bz-ch-a)" ${SO}/>
        <rect x="44" y="19" width="15" height="40" rx="3.5" fill="url(#bz-ch-c)" ${SO}/>
        <path d="M8 43.5v5M27.5 34.5v6M47 22.5v6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
        ${EYES(48, 55, 33, 2)}${cheeks(46, 57, 37.5, 2, 1.4)}${mouth(51.5, 37, 1.7, 1.7)}
        ${tube("M6 33L17 24.5L26 28L41 11", 4, "#3DBF73")}
        <path d="M45.5 5.5L37.5 7.6L44 14.2z" fill="#3DBF73" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        ${spark(13, 11, 4.5, "#FFC93C")}<circle cx="23" cy="14" r="1.6" fill="#7FC4F2"/>`,
      business_coffee: `${lg("bz-cf-c", "#FFFFFF", "#E8E4F0")}${lg("bz-cf-s", "#3E5C94", "#2A3F6E")}
        <path d="M14 20H50L46 58Q45.7 61 43 61H21Q18.3 61 18 58z" fill="url(#bz-cf-c)" ${SO}/>
        <path d="M15.4 28H48.6L47.4 41H16.6z" fill="url(#bz-cf-s)" ${S2}/>
        <path d="M25 37.5l3.2-3.6 2.6 2 4.6-5" fill="none" stroke="#7DE0A6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M33.6 30.6h2.2v2.2" fill="none" stroke="#7DE0A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="11" y="14" width="42" height="8" rx="4" fill="#C9845A" ${SO}/>
        <path d="M18 14.5Q19 8 25 8H39Q45 8 46 14.5z" fill="#B06E46" ${S2}/>
        <rect x="35" y="9.5" width="6" height="3" rx="1.5" fill="#7A4628"/>
        ${EYES(26, 38, 48.5, 2.4)}${cheeks(21.5, 42.5, 53, 2.4, 1.6)}${mouth(32, 52.5, 2.2)}
        <path d="M19 24.5v1.6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        <path d="M58 6q-2 3 0 6t0 6" fill="none" stroke="#C9B9DA" stroke-width="2" stroke-linecap="round"/>`,
      business_tower: `${lg("bz-tw-g", "#BFE3FF", "#5B8FD6", 1, 1)}${lg("bz-tw-t", "#9CC8F2", "#4A78BE")}
        <path d="M32 2.5V9" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/><circle cx="32" cy="4" r="2" fill="#FF6F7D" stroke="${O}" stroke-width="1.2"/>
        <rect x="22" y="8.5" width="20" height="8" rx="2.5" fill="url(#bz-tw-t)" ${S2}/>
        <rect x="16" y="15" width="32" height="46" rx="4" fill="url(#bz-tw-g)" ${SO}/>
        <g fill="#FFE58A">${[20.5, 27.5].map(y => [20, 27.5, 35].map(x => `<rect x="${x}" y="${y}" width="5.5" height="4.5" rx="1.2"${(x + y) % 3 < 1.5 ? ' fill="#E3F2FF" opacity=".75"' : ""}/>`).join("")).join("")}<rect x="42.5" y="20.5" width="2.2" height="11.5" rx="1" fill="#E3F2FF" opacity=".6"/></g>
        ${EYES(26, 38, 38.5, 2.4)}${cheeks(21.5, 42.5, 43, 2.4, 1.6)}${mouth(32, 42.5, 2.2)}
        <path d="M27 61V52.5Q27 49.5 30 49.5H34Q37 49.5 37 52.5V61" fill="#3A5A92" ${S2}/><path d="M32 50v11" stroke="#9CC8F2" stroke-width="1.2"/>
        <circle cx="9" cy="54" r="6.5" fill="#6DBB76" ${S2}/><circle cx="55" cy="54" r="6.5" fill="#6DBB76" ${S2}/>
        <circle cx="7" cy="52" r="1.3" fill="#FF9EB5"/><circle cx="57" cy="52.5" r="1.3" fill="#FF9EB5"/><circle cx="10.5" cy="56.5" r="1.1" fill="#FFE58A"/>
        <path d="M19 19v9" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
      business_calc: `${lg("bz-ca-b", "#A6E6D2", "#4DB39A")}${lg("bz-ca-s", "#E4F7C9", "#B9DE92")}
        <rect x="11" y="3" width="42" height="58" rx="9" fill="url(#bz-ca-b)" ${SO}/>
        <rect x="16" y="8.5" width="32" height="17" rx="4" fill="url(#bz-ca-s)" ${S2}/>
        ${EYES(26, 38, 16, 2.3)}${cheeks(21.5, 42.5, 20.5, 2.2, 1.4)}${mouth(32, 20, 2, 1.8)}
        <g ${S15}>${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${16.5 + c * 11}" y="${30.5 + r * 9.5}" width="9" height="7" rx="2.6" fill="${r === 2 && c === 2 ? "#FFB347" : c === 2 ? "#FFE3A6" : "#F4FFFB"}"/>`).join("")).join("")}</g>
        <path d="M40 46.4h3M40 48.4h3" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M14.5 9v12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
      business_tie: `${lg("bz-ti-b", "#4F6FB8", "#2C4380")}
        <path d="M28 16H36L45 47L32 61L19 47z" fill="url(#bz-ti-b)" ${SO}/>
        <g fill="#F7C548"><circle cx="30" cy="22" r="1.6"/><circle cx="35" cy="28" r="1.6"/><circle cx="27" cy="30" r="1.6"/><circle cx="23.6" cy="47" r="1.6"/><circle cx="32" cy="55" r="1.6"/><circle cx="40.4" cy="47" r="1.6"/></g>
        <path d="M25 5H39L36.5 16H27.5z" fill="#3A5596" ${SO}/>
        <rect x="21" y="25" width="22" height="4.4" rx="2.2" fill="#F7C548" ${S15}/><circle cx="23.6" cy="27.2" r=".9" fill="#fff"/>
        ${EYES(27.5, 36.5, 38, 2.3)}${cheeks(24, 40, 42.5, 2.2, 1.5)}${mouth(32, 42, 2)}
        <path d="M28 7.5h3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
      business_moneytree: `${lg("bz-mt-p", "#F2A07A", "#C96A44")}${rg("bz-mt-c", "#FFF4B8", "#EDB02E")}${lg("bz-mt-l", "#9EE08A", "#4EA85A")}
        <path d="M32 44C32 34 31 26 32 16" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 44C32 34 31 26 32 16" fill="none" stroke="#5DAA5E" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M31.5 32C24 33 17 29 15 22C22 20 30 24 31.5 32z" fill="url(#bz-mt-l)" ${S2}/>
        <path d="M32.5 26C40 27 47 23 49 16C42 14 34 18 32.5 26z" fill="url(#bz-mt-l)" ${S2}/>
        <circle cx="32" cy="11" r="7" fill="url(#bz-mt-c)" ${S2}/><circle cx="13" cy="15" r="5.6" fill="url(#bz-mt-c)" ${S2}/><circle cx="51" cy="29" r="5.6" fill="url(#bz-mt-c)" ${S2}/>
        <path d="${star(32, 11, 3.2, 1.4)}" fill="#FFF8D6"/><path d="${star(13, 15, 2.5, 1.1)}" fill="#FFF8D6"/><path d="${star(51, 29, 2.5, 1.1)}" fill="#FFF8D6"/>
        <path d="M17 44H47L44 59Q43.6 61 41.5 61H22.5Q20.4 61 20 59z" fill="url(#bz-mt-p)" ${SO}/>
        <rect x="14" y="40" width="36" height="7" rx="3" fill="#E08A62" ${SO}/>
        ${EYES(26.5, 37.5, 52.5, 2.2)}${cheeks(22.5, 41.5, 56.5, 2.2, 1.4)}${mouth(32, 56, 1.9)}`,
      business_profit: `${lg("bz-pf-b", "#4CC98A", "#22895A")}${rg("bz-pf-c", "#FFF4B8", "#EDB02E")}
        <path d="M24 22V13H17L32 2.5L47 13H40V22" fill="#FFC93C" ${SO}/>
        <rect x="3" y="20" width="58" height="30" rx="11" fill="url(#bz-pf-b)" ${SO}/>
        <rect x="7.5" y="24.5" width="49" height="21" rx="7.5" fill="none" stroke="#C7F5DA" stroke-width="1.5" stroke-dasharray="1 3.2" stroke-linecap="round"/>
        ${T("PROFIT!", 32, 40.5, 13, "#FFFFFF", 44)}
        <circle cx="52" cy="52" r="8" fill="url(#bz-pf-c)" ${S2}/><path d="${star(52, 52.3, 3.6, 1.5)}" fill="#FFF8D6" stroke="#C98A1A" stroke-width=".9" stroke-linejoin="round"/>
        <circle cx="12" cy="55" r="1.8" fill="#7FE0B0"/><circle cx="19" cy="58" r="1.3" fill="#FFC93C"/>
        ${spark(8, 9, 4, "#FFC93C")}${spark(56, 8, 3.2, "#7FE0B0")}`
    }},
    pins: [
      {id: "tp-business-coin", name: "Gold Coin Pin", kind: "badge", desc: "A shiny gold coin pin stamped with a lucky star.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="bz-pc-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF6C4"/><stop offset=".6" stop-color="#F2C24A"/><stop offset="1" stop-color="#C98A1A"/></radialGradient></defs>
          <circle cx="15" cy="16.4" r="12.5" fill="#B07818"/>
          <circle cx="15" cy="15" r="12.5" fill="url(#bz-pc-g)" stroke="#8A5E10" stroke-width="1.1"/>
          <circle cx="15" cy="15" r="9.4" fill="none" stroke="#C98A1A" stroke-width="1.2" stroke-dasharray=".1 2.6" stroke-linecap="round"/>
          <path d="${star(15, 15.4, 6, 2.6)}" fill="#FFF3C4" stroke="#B07818" stroke-width=".9" stroke-linejoin="round"/>
          <ellipse cx="9.5" cy="9" rx="2.6" ry="1.4" fill="#fff" opacity=".75" transform="rotate(-40 9.5 9)"/></svg>`},
      {id: "tp-business-ticker", name: "Ticker Tape", kind: "tape", desc: "Midnight blue tape with a glowing stock ticker, all arrows pointing up.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 2H83L80 6L83 10L80 14L83 18L80 22L83 24H3L6 20L3 16L6 12L3 8L6 4z" fill="#22335A" opacity=".9"/>
          <path d="M6 5H80M6 21H80" stroke="#4A6496" stroke-width="1" opacity=".8"/>
          <g fill="#6FF0A6"><path d="M11 15L14 10L17 15z"/><path d="M39 15L42 10L45 15z"/><path d="M67 15L70 10L73 15z"/></g>
          <g fill="#BFEFFF" font-family="Lexend,Arial,sans-serif" font-weight="700" font-size="7"><text x="19" y="15.5">+12</text><text x="47" y="15.5">+30</text><text x="75" y="15.5" fill="#FFD36B">$</text></g>
          <path d="M33 13l2-1.5 2 1 1.6-2" fill="none" stroke="#FFD36B" stroke-width="1.1" stroke-linecap="round"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".25"/></svg>`}
    ],
    card: {id: "tp-business", name: "Bull Run", desc: "Crisp ledger paper with a rising green chart in the corner and a little stack of gold coins. Glows on navy at night."}
  });

  /* ================= NURSING: Night Shift ================= */
  // a crescent from two circles (outer one minus inner one), as a path
  const crescent = (cx, cy, r, ix, iy, ir) => {
    const dx = ix - cx, dy = iy - cy, d = Math.hypot(dx, dy), a = (d * d + r * r - ir * ir) / (2 * d), h = Math.sqrt(r * r - a * a);
    const mx = cx + a * dx / d, my = cy + a * dy / d, p1 = [mx + h * dy / d, my - h * dx / d], p2 = [mx - h * dy / d, my + h * dx / d], f = v => v.toFixed(1);
    return `M${f(p1[0])} ${f(p1[1])}A${r} ${r} 0 1 0 ${f(p2[0])} ${f(p2[1])}A${ir} ${ir} 0 0 1 ${f(p1[0])} ${f(p1[1])}z`;
  };
  TP_DATA.push({
    theme: "nursing",
    pack: {name: "Care Crew", items: {
      nursing_heart: `${lg("nu-ht-g", "#FF9DB0", "#E9506E", .3, 1)}
        <path d="${heartD(32, 31, 2.75)}" fill="url(#nu-ht-g)" ${SO}/>
        <path d="M8 22H19L22.5 16L27 28L31 12L35 25L37.5 22H56" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 22H19L22.5 16L27 28L31 12L35 25L37.5 22H56" fill="none" stroke="#C9FFE6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        ${EYES(24.5, 39.5, 36, 2.7)}${cheeks(19.5, 44.5, 41.5, 3, 2)}${mouth(32, 41, 2.6, 2.1)}
        <ellipse cx="14" cy="15" rx="3.4" ry="1.8" fill="#fff" opacity=".6" transform="rotate(-45 14 15)"/>`,
      nursing_cap: `${lg("nu-cp-g", "#FFFFFF", "#E6ECF5")}${lg("nu-cp-h", "#FF9DB0", "#E9506E")}
        <path d="M7 42Q6 30 14 22Q22 14 32 14Q42 14 50 22Q58 30 57 42Q44 36 32 36Q20 36 7 42z" fill="url(#nu-cp-g)" ${SO}/>
        <path d="M5 44Q18 36 32 36Q46 36 59 44L57 52Q45 45 32 45Q19 45 7 52z" fill="#FFFFFF" ${SO}/>
        <path d="M8 47.5Q20 40.5 32 40.5Q44 40.5 56 47.5" fill="none" stroke="#FF9DB0" stroke-width="2.4" stroke-linecap="round"/>
        <path d="${heartD(32, 25, 1.05)}" fill="url(#nu-cp-h)" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M14 30Q16 23 22 20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        ${spark(54, 11, 4.5, "#FFC2D0")}${spark(10, 12, 3, "#9FE3CC")}`,
      nursing_stetho: `${lg("nu-st-c", "#EAF2F8", "#A9BCCB")}${lg("nu-st-h", "#FF9DB0", "#E9506E")}
        ${tube("M20 6L22.5 15M44 6L41.5 15", 3, "#8C9CB0")}
        ${tube("M32 52C19 43 11 36 11 27C11 19 16 15 22 15C27 15 30 18 32 22C34 18 37 15 42 15C48 15 53 19 53 27C53 34 49 39 44 43", 4.4, "#5EC4B0")}
        <circle cx="20" cy="5.5" r="2.6" fill="#5A6478" stroke="${O}" stroke-width="1.4"/><circle cx="44" cy="5.5" r="2.6" fill="#5A6478" stroke="${O}" stroke-width="1.4"/>
        <path d="${heartD(32, 32, .95)}" fill="url(#nu-st-h)" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="47" cy="50" r="10.5" fill="url(#nu-st-c)" ${SO}/><circle cx="47" cy="50" r="6.6" fill="#DDE8F0" stroke="#8C9CB0" stroke-width="1.4"/>
        ${EYES(43.6, 50.4, 49.5, 1.7)}${mouth(47, 52.6, 1.4, 1.5)}<ellipse cx="41.2" cy="53" rx="1.6" ry="1.1" fill="#FF8FA8"/><ellipse cx="52.8" cy="53" rx="1.6" ry="1.1" fill="#FF8FA8"/>`,
      nursing_mug: `${lg("nu-mg-g", "#A9EBD7", "#5EC4B0")}
        <path d="M23 14q-3-4 0-8M33 14q-3-4 0-8" fill="none" stroke="#C2C8D8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="${heartD(43, 9.5, .55)}" fill="#FF9DB0" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M46 28H50A8.5 8.5 0 0 1 50 45H46" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M46 28H50A8.5 8.5 0 0 1 50 45H46" fill="none" stroke="#5EC4B0" stroke-width="4" stroke-linecap="round"/>
        <path d="M8 20H48V50Q48 60 38 60H18Q8 60 8 50z" fill="url(#nu-mg-g)" ${SO}/>
        <ellipse cx="28" cy="20" rx="20" ry="3.4" fill="#8A5A3C" ${S2}/>
        <path d="M8 28H48" stroke="#FFFFFF" stroke-width="3" opacity=".8"/><path d="M14 30.5H42" stroke="#FF9DB0" stroke-width="2" stroke-linecap="round" stroke-dasharray=".1 4"/>
        ${EYES(21, 35, 42, 2.6)}${cheeks(16, 40, 47.5, 2.8, 1.8)}${mouth(28, 47, 2.4, 2)}
        <path d="M12 36v12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
      nursing_clipboard: `${lg("nu-cb-b", "#F6A68C", "#DD7A62")}${lg("nu-cb-c", "#D2DCE8", "#8C9CB0")}
        <rect x="9" y="7" width="46" height="55" rx="7" fill="url(#nu-cb-b)" ${SO}/>
        <rect x="14.5" y="14" width="35" height="43" rx="3" fill="#FFFDF8" ${S2}/>
        <rect x="22" y="3" width="20" height="10" rx="3.6" fill="url(#nu-cb-c)" ${S2}/><circle cx="32" cy="7" r="1.8" fill="#fff" stroke="${O}" stroke-width="1.2"/>
        <rect x="18.5" y="19" width="6" height="6" rx="1.6" fill="#E3FFF3" stroke="${O}" stroke-width="1.4"/><path d="M19.8 22l1.6 1.7 3.2-4" fill="none" stroke="#2FA07E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="18.5" y="28" width="6" height="6" rx="1.6" fill="#E3FFF3" stroke="${O}" stroke-width="1.4"/><path d="M19.8 31l1.6 1.7 3.2-4" fill="none" stroke="#2FA07E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M28 22h17M28 31h14" stroke="#B9C4D4" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(26, 38, 43.5, 2.4)}${cheeks(21.5, 42.5, 48.5, 2.4, 1.6)}${mouth(32, 48, 2.2)}
        <path d="M12.5 12v10" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,
      nursing_moon: `${lg("nu-mn-g", "#FFF2B8", "#F4C64E", 1, 1)}${lg("nu-mn-c", "#FFFFFF", "#E6ECF5")}
        <path d="${crescent(29, 34, 25, 44, 22, 19)}" fill="url(#nu-mn-g)" ${SO}/>
        ${shut(16, 25, 37.5, 2.2)}${cheeks(14, 29, 42.5, 2.4, 1.6)}${mouth(21.5, 43, 1.8)}
        <path d="M5.5 20Q6 13 12 9.5Q16 7.5 20 8.5L21 14Q15 13.5 11.5 18Q9 22 5.5 20z" fill="url(#nu-mn-c)" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="${heartD(13.6, 13.4, .32)}" fill="#FF7A95"/>
        <g fill="#B8A8F0">${T("z", 46, 44, 9, "#9F8FE6")}${T("z", 53, 36, 7, "#B8A8F0")}</g>
        ${spark(52, 54, 4, "#FFE07A")}${spark(56, 12, 3, "#FFE07A")}`,
      nursing_badge: `${rg("nu-bg-r", "#FFD0DC", "#F28AA6")}${lg("nu-bg-c", "#FFFFFF", "#EEF3F8")}
        <path d="M32 31V40" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/><path d="M32 31V40" stroke="#C9D3E3" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="27" y="2.5" width="10" height="6" rx="2" fill="#8C9CB0" ${S15}/>
        <circle cx="32" cy="20" r="13" fill="url(#nu-bg-r)" ${SO}/>
        ${EYES(27, 37, 19.5, 2.3)}${cheeks(23, 41, 24, 2.3, 1.5)}${mouth(32, 23.5, 2)}
        <ellipse cx="25" cy="13" rx="3" ry="1.6" fill="#fff" opacity=".65" transform="rotate(-35 25 13)"/>
        <rect x="13" y="38" width="38" height="23" rx="4.5" fill="url(#nu-bg-c)" ${SO}/>
        <rect x="27" y="36" width="10" height="4" rx="1.6" fill="#5EC4B0" ${S15}/>
        <rect x="17" y="43" width="12" height="13" rx="2.5" fill="#BFEBDD" stroke="${O}" stroke-width="1.4"/><path d="${heartD(23, 49.4, .42)}" fill="#FF7A95"/>
        <path d="M33 46h13M33 50.5h10M33 55h12" stroke="#B9C4D4" stroke-width="2" stroke-linecap="round"/><path d="M33 46h7" stroke="#F28AA6" stroke-width="2" stroke-linecap="round"/>
        ${spark(54, 9, 4, "#FFE07A")}`,
      nursing_gotthis: `${lg("nu-gt-g", "#FFB2C2", "#EC5E7C", .3, 1)}
        <path d="${heartD(32, 30.5, 2.85)}" fill="url(#nu-gt-g)" ${SO}/>
        <rect x="4" y="23" width="56" height="27" rx="9" fill="#FFF8F0" ${S2}/>
        ${T("You Got", 32, 34.6, 10.5, "#C2385A", 40)}${T("This!", 32, 46.3, 11.5, "#2B8C78", 32)}
        <ellipse cx="14" cy="12" rx="3.4" ry="1.8" fill="#fff" opacity=".6" transform="rotate(-45 14 12)"/>
        ${spark(56, 7, 3.6, "#FFE07A")}`
    }},
    pins: [
      {id: "tp-nursing-heart", name: "Heartbeat Pin", kind: "badge", desc: "A glossy pink heart pin with a tiny glowing heartbeat.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="nu-ph-g" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#FFB8C6"/><stop offset="1" stop-color="#D9405F"/></linearGradient></defs>
          <path d="${heartD(15, 15.6, 1.36)}" fill="url(#nu-ph-g)" stroke="#8E2440" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M3.6 14.5H9.5L11.2 11.5L13.6 18L15.8 9L17.8 15.5L19 14.5H26.4" fill="none" stroke="#E9FFF5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="8.4" cy="7.6" rx="2.4" ry="1.3" fill="#fff" opacity=".7" transform="rotate(-40 8.4 7.6)"/></svg>`},
      {id: "tp-nursing-pulse", name: "Heartbeat Washi", kind: "tape", desc: "Soft mint washi tape with a pink heartbeat line and little hearts.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z" fill="#A9E6D4" opacity=".8"/>
          <path d="M6 14H18L21 9L25 19L28.5 6L32 16L34 14H50L53 9L57 19L60.5 6L64 16L66 14H80" fill="none" stroke="#E9506E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
          <g fill="#FF8FA8"><path d="${heartD(42, 7.5, .25)}"/><path d="${heartD(11, 20, .22)}"/><path d="${heartD(74, 20, .22)}"/></g>
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".45"/></svg>`}
    ],
    card: {id: "tp-nursing", name: "Heartbeat Notes", desc: "Soft blush paper with a mint heartbeat line that draws a little heart in the corner, and a sleepy moon on night shifts."}
  });

  /* ================= PSYCHOLOGY: Mind Garden ================= */
  // one inkblot wing pair (left half), mirrored for the right
  const psWings = (c1, c2, blot) => {
    const half = `<path d="M30 30C24 14 14 6 7 10C2 14 4 24 12 30C6 33 5 42 10 46C16 50 24 44 30 36z" fill="${c1}" ${S2}/>
      <path d="M26 27C22 20 17 14 12 15C9 17 11 22 14 25Q18 27 22 26C20 30 16 33 13 37C12 40 15 43 19 41C23 39 26 34 27 31z" fill="${blot}" opacity=".9"/>
      <circle cx="9.5" cy="15" r="1.8" fill="${c2}"/><circle cx="10" cy="41" r="1.6" fill="${c2}"/>`;
    return half + `<g transform="translate(64 0) scale(-1 1)">${half}</g>`;
  };
  TP_DATA.push({
    theme: "psych",
    pack: {name: "Mind Blooms", items: {
      psych_brain: `${lg("ps-br-g", "#FFC4DA", "#F08AB4", .4, 1)}
        <path d="M32 9C24 3 12 7 11 17C4 20 4 31 8.5 35C6.5 44 14 52 23 50C27 56 37 56 41 50C50 52 57.5 44 55.5 35C60 31 60 20 53 17C52 7 40 3 32 9z" fill="url(#ps-br-g)" ${SO}/>
        <g fill="none" stroke="#C85A8C" stroke-width="2" stroke-linecap="round"><path d="M32 9.5V20"/><path d="M19 13Q22 17 19 22M45 13Q42 17 45 22M10.5 26Q15 26 16 30M53.5 26Q49 26 48 30M17 45Q19 42 23 43M47 45Q45 42 41 43"/></g>
        ${EYES(24.5, 39.5, 33, 2.7)}${cheeks(19.5, 44.5, 38.5, 3, 2)}${mouth(32, 38, 2.6, 2.1)}
        <ellipse cx="16" cy="16" rx="3.4" ry="1.8" fill="#fff" opacity=".6" transform="rotate(-40 16 16)"/>
        ${spark(57, 7, 3.8, "#FFE07A")}`,
      psych_butterfly: `${lg("ps-bf-w", "#D9CCFF", "#A28BEA", 1, 1)}
        ${psWings("url(#ps-bf-w)", "#FFF2FA", "#6A55C2")}
        <path d="M32 18L26 7M32 18L38 7" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/><circle cx="26" cy="7" r="2" fill="#F7B6D0" stroke="${O}" stroke-width="1.2"/><circle cx="38" cy="7" r="2" fill="#F7B6D0" stroke="${O}" stroke-width="1.2"/>
        <rect x="28.5" y="22" width="7" height="30" rx="3.5" fill="#5A4A9A" ${S2}/>
        <circle cx="32" cy="20.5" r="6.2" fill="#6A58AE" ${S2}/>
        <circle cx="29.6" cy="20.3" r="1.5" fill="#fff"/><circle cx="34.4" cy="20.3" r="1.5" fill="#fff"/><circle cx="29.9" cy="20.5" r=".8" fill="${O}"/><circle cx="34.7" cy="20.5" r=".8" fill="${O}"/>
        <path d="M30.8 23q1.2 1 2.4 0" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`,
      psych_bulb: `${rg("ps-lb-g", "#FFFBE0", "#FFD45C", .4, .35)}${lg("ps-lb-s", "#E2E4F0", "#A6A9C4")}
        <g stroke="#FFC93C" stroke-width="2.6" stroke-linecap="round"><path d="M32 2.5v3.5M9 13l3 2.4M55 13l-3 2.4M4.5 30h3.8M55.7 30h3.8"/></g>
        <path d="M32 8C20.5 8 13 16.5 13 27C13 35 18 39 21.5 43.5Q23 45.5 23 48H41Q41 45.5 42.5 43.5C46 39 51 35 51 27C51 16.5 43.5 8 32 8z" fill="url(#ps-lb-g)" ${SO}/>
        <path d="M27 48V40Q27 36 30 36M37 48V40Q37 36 34 36" fill="none" stroke="#E8A93A" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="22" y="47.5" width="20" height="10" rx="3" fill="url(#ps-lb-s)" ${S2}/><path d="M23 51.5h18M23 54.5h18" stroke="#8B8EAB" stroke-width="1.2"/>
        <path d="M27 57.5h10q-1 4-5 4t-5-4z" fill="#6E6A8E" ${S15}/>
        ${EYES(25, 39, 25, 2.5)}${cheeks(20.5, 43.5, 30.5, 2.6, 1.7)}${mouth(32, 30, 2.4, 2)}
        <path d="M18.5 22Q19.5 15 25 12.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`,
      psych_spiral: `${rg("ps-sp-g", "#E8E0FF", "#9F8FE6", .4, .35)}
        <circle cx="32" cy="32" r="27" fill="url(#ps-sp-g)" ${SO}/>
        <path d="M32 32C32 29 36 29 36 32C36 37 28 37 28 31C28 24 39 23 41 31C43 40 31 44 25 38C18 31 24 18 34 18C46 18 50 30 47 38C44 47 33 51 25 47" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <path d="${star(14, 18, 3.4, 1.4)}" fill="#FFE07A"/><path d="${star(49, 50, 2.8, 1.2)}" fill="#FFE07A"/>
        <circle cx="49" cy="15" r="1.6" fill="#FFD3E6"/><circle cx="14" cy="46" r="1.4" fill="#FFD3E6"/>
        <ellipse cx="18" cy="13.5" rx="4" ry="2" fill="#fff" opacity=".45" transform="rotate(-35 18 13.5)"/>`,
      psych_topiary: `${lg("ps-tp-l", "#A8E0B6", "#4E9E6E", .3, 1)}${lg("ps-tp-p", "#FFFFFF", "#DCD6EE")}
        <path d="M32 40V50" stroke="#8A5A3C" stroke-width="3.4" stroke-linecap="round"/>
        <circle cx="32" cy="13" r="9" fill="url(#ps-tp-l)" ${SO}/>
        <path d="M32 21.5V26" stroke="#8A5A3C" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="35" r="13.5" fill="url(#ps-tp-l)" ${SO}/>
        <g fill="#FFB8D0"><circle cx="24" cy="10" r="1.6"/><circle cx="38" cy="14" r="1.5"/><circle cx="22" cy="40" r="1.6"/><circle cx="43" cy="30" r="1.6"/></g>
        ${EYES(26.5, 37.5, 35, 2.3)}${cheeks(22.5, 41.5, 39.5, 2.3, 1.5)}${mouth(32, 39, 2)}
        <path d="M19 49H45L42 60Q41.6 61.5 40 61.5H24Q22.4 61.5 22 60z" fill="url(#ps-tp-p)" ${SO}/><rect x="17" y="46.5" width="30" height="5" rx="2.2" fill="#ECE6FA" ${S2}/>
        <ellipse cx="27" cy="27" rx="3.6" ry="1.8" fill="#fff" opacity=".5" transform="rotate(-30 27 27)"/>`,
      psych_couch: `${lg("ps-co-g", "#C9B8FF", "#8E78E0")}${lg("ps-co-c", "#FFD3E6", "#F59AC0")}
        <path d="M9 48v8M55 48v8" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M9 48v8M55 48v8" stroke="#C9A27A" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 50V36Q5 30 11 30H53Q59 30 59 36V50z" fill="url(#ps-co-g)" ${SO}/>
        <path d="M4 44Q4 20 13 15Q19 12 21 18Q22 26 17 32V44z" fill="url(#ps-co-g)" ${SO}/>
        <path d="M16 32H58V44Q58 49 53 49H16z" fill="#B6A2F6" ${S2}/>
        <path d="M24 33Q24 25 32 24Q40 24 40 30Q40 34 34 34H26z" fill="url(#ps-co-c)" ${S2}/><path d="M28 27q3-1.4 6 0" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>
        ${EYES(31, 42, 40.5, 2.2)}${cheeks(27.5, 45.5, 44.5, 2.2, 1.4)}${mouth(36.5, 44, 1.9)}
        <path d="M9 22Q11 17 14.5 17" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${spark(52, 14, 4, "#FFE07A")}`,
      psych_puzzle: `${lg("ps-pz-g", "#B8EEDD", "#5EC4A8", .3, 1)}
        <path d="M10 18H25C22.5 13.5 24 7 30.5 7C37 7 38.5 13.5 36 18H50V31C54.5 28.5 60 30 60 36.5C60 43 54.5 44.5 50 42V57H10z" fill="url(#ps-pz-g)" ${SO}/>
        ${EYES(23, 37, 36, 2.6)}${cheeks(18, 42, 41.5, 2.8, 1.8)}${mouth(30, 41, 2.4, 2.1)}
        <path d="M14 23v14" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
        <path d="M45 50l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z" fill="#fff" opacity=".8"/>`,
      psych_mindblown: `${lg("ps-mb-g", "#FFC7DE", "#C9A8FF", 1, 1)}
        <path d="${scal(32, 32, 24, 13, 6)}" fill="url(#ps-mb-g)" ${SO}/>
        ${T("MIND", 32, 30.5, 12, "#5A3FA8", 32)}${T("BLOWN!", 32, 43, 11, "#D23F7E", 40)}
        ${spark(56, 8, 4, "#FFE07A")}${spark(8, 56, 3.4, "#9FE3CC")}<circle cx="9" cy="9" r="1.8" fill="#C9A8FF"/>`
    }},
    pins: [
      {id: "tp-psych-inkblot", name: "Inkblot Pin", kind: "badge", desc: "A round enamel pin with a mirrored lavender inkblot butterfly.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="ps-pi-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6DDFB"/></radialGradient></defs>
          <circle cx="15" cy="15" r="13" fill="url(#ps-pi-g)" stroke="#6A55C2" stroke-width="1.6"/>
          <g fill="#6A55C2"><path d="M14.4 15C12 9 8.5 7 6.6 8.6C5 10 6.5 13 9.5 14.6C7 16 6.5 19.5 8.6 20.6C10.8 21.6 13.4 19 14.4 16.5z"/><path d="M15.6 15C18 9 21.5 7 23.4 8.6C25 10 23.5 13 20.5 14.6C23 16 23.5 19.5 21.4 20.6C19.2 21.6 16.6 19 15.6 16.5z"/></g>
          <g fill="#F7B6D0"><circle cx="9.4" cy="11" r="1.3"/><circle cx="20.6" cy="11" r="1.3"/><circle cx="10" cy="18.4" r="1"/><circle cx="20" cy="18.4" r="1"/></g>
          <rect x="14.2" y="10" width="1.6" height="11" rx=".8" fill="#2B2233"/>
          <ellipse cx="9" cy="6.5" rx="2.6" ry="1.2" fill="#fff" opacity=".8" transform="rotate(-30 9 6.5)"/></svg>`},
      {id: "tp-psych-daydream", name: "Daydream Washi", kind: "tape", desc: "Lavender washi tape with drifting thought bubbles and tiny spirals.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z" fill="#C9B8F6" opacity=".78"/>
          <g fill="#fff"><path d="M12 15a3.5 3.5 0 0 1 3-5a4 4 0 0 1 7 0a3.5 3.5 0 0 1 2 5z"/><circle cx="10" cy="18.5" r="1.4"/><circle cx="7.6" cy="21" r=".9"/>
          <path d="M52 13a3.5 3.5 0 0 1 3-5a4 4 0 0 1 7 0a3.5 3.5 0 0 1 2 5z"/><circle cx="50" cy="16.5" r="1.4"/><circle cx="47.6" cy="19" r=".9"/></g>
          <g fill="none" stroke="#7A63D0" stroke-width="1.2" stroke-linecap="round"><path d="M34 13c0-1 1.4-1 1.4 0c0 1.8-2.8 1.8-2.8-.2c0-2.4 3.8-2.6 4.2 0"/><path d="M73 15c0-1 1.4-1 1.4 0c0 1.8-2.8 1.8-2.8-.2c0-2.4 3.8-2.6 4.2 0"/></g>
          <g fill="#FFD3E6"><circle cx="28" cy="20" r="1.2"/><circle cx="66" cy="7" r="1.2"/><circle cx="42" cy="6" r="1"/></g>
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".45"/></svg>`}
    ],
    card: {id: "tp-psych", name: "Daydream Page", desc: "Dreamy lavender paper with thought bubble clouds drifting past a soft spiral, and an inkblot butterfly resting in the corner."}
  });

  /* ================= BIOLOGY: Cell Garden ================= */
  // a vertical DNA ladder from y0 to y1 around x=cx
  const helix = (cx, y0, y1, amp, turns) => {
    const n = 48, pa = [], pb = [], rungs = [];
    for (let i = 0; i <= n; i++) { const t = i / n, y = y0 + (y1 - y0) * t, a = t * turns * Math.PI * 2; pa.push([cx + amp * Math.sin(a), y]); pb.push([cx - amp * Math.sin(a), y]); }
    for (let i = 3; i < n; i += 4) { const [xa, y] = pa[i], [xb] = pb[i]; if (Math.abs(xa - xb) > 4) rungs.push([Math.min(xa, xb), Math.max(xa, xb), y, (i / 4) % 4 | 0]); }
    const d = p => "M" + p.map(q => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L");
    return {a: d(pa), b: d(pb), rungs};
  };
  const HX = helix(32, 5, 59, 15, 1.5);
  const RUNG = ["#FF8FA8", "#FFD36B", "#7FD0F2", "#9EE08A"];
  TP_DATA.push({
    theme: "biology",
    pack: {name: "Cell Mates", items: {
      biology_cell: `${rg("bi-cl-m", "#E6FFF6", "#8EDDC6", .4, .35)}${rg("bi-cl-n", "#E6D8FF", "#A08AE6", .4, .35)}
        <path d="M32 4C46 4 59 13 59 30C59 47 48 60 31 60C15 60 5 49 5 33C5 16 17 4 32 4z" fill="url(#bi-cl-m)" ${SO}/>
        <path d="M11 22q3-2 5 1t5 1M44 50q3-2 5 1t5 1" fill="none" stroke="#5EC4A8" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="41" y="14" width="12" height="6" rx="3" fill="#FFA07A" stroke="${O}" stroke-width="1.4" transform="rotate(30 47 17)"/>
        <rect x="9" y="40" width="11" height="5.5" rx="2.75" fill="#FFA07A" stroke="${O}" stroke-width="1.4" transform="rotate(-20 14.5 42.75)"/>
        <g fill="#FFC93C"><circle cx="20" cy="14" r="1.8"/><circle cx="50" cy="40" r="1.7"/><circle cx="24" cy="52" r="1.6"/><circle cx="53" cy="28" r="1.3"/></g>
        <circle cx="32" cy="33" r="14" fill="url(#bi-cl-n)" ${SO}/>
        ${EYES(26.5, 37.5, 32, 2.4)}${cheeks(22.5, 41.5, 37, 2.4, 1.6)}${mouth(32, 36.5, 2.1)}
        <ellipse cx="17" cy="12.5" rx="4.4" ry="2.2" fill="#fff" opacity=".6" transform="rotate(-35 17 12.5)"/>`,
      biology_mito: `${lg("bi-mt-g", "#FFC2A6", "#F07A5E", .3, 1)}
        <g transform="rotate(-24 32 34)">
          <rect x="3" y="18" width="58" height="32" rx="16" fill="url(#bi-mt-g)" ${SO}/>
          <path d="M10 34C13 26 15 26 17 34S21 42 24 34S28 26 31 34S35 42 38 34S42 26 45 34S49 42 52 34S55 28 56 32" fill="none" stroke="#FFE3D6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 34C13 26 15 26 17 34S21 42 24 34S28 26 31 34S35 42 38 34S42 26 45 34S49 42 52 34S55 28 56 32" fill="none" stroke="#D85A44" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
          <path d="M14 22Q20 20 26 20.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></g>
        <circle cx="27" cy="42.5" r="8.5" fill="#FFF4EC" stroke="${O}" stroke-width="1.6"/>
        ${EYES(23.5, 30.5, 41.5, 2)}${mouth(27, 45, 1.6, 1.6)}<ellipse cx="20.5" cy="45" rx="1.6" ry="1.1" fill="#FF8FA8"/><ellipse cx="33.5" cy="45" rx="1.6" ry="1.1" fill="#FF8FA8"/>
        <path d="M51 4L45 13H50L46 21L56 10H50.5L54 4z" fill="#FFD84A" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>`,
      biology_dna: `<path d="${HX.b}" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${HX.b}" fill="none" stroke="#9F8FE6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        ${HX.rungs.map(([x0, x1, y, c]) => `<path d="M${(x0 + 2).toFixed(1)} ${y.toFixed(1)}H${(x1 - 2).toFixed(1)}" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M${(x0 + 2).toFixed(1)} ${y.toFixed(1)}H${((x0 + x1) / 2).toFixed(1)}" stroke="${RUNG[c]}" stroke-width="2.2" stroke-linecap="round"/><path d="M${((x0 + x1) / 2).toFixed(1)} ${y.toFixed(1)}H${(x1 - 2).toFixed(1)}" stroke="${RUNG[(c + 2) % 4]}" stroke-width="2.2" stroke-linecap="round"/>`).join("")}
        <path d="${HX.a}" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${HX.a}" fill="none" stroke="#4FC9AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${HX.a}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="3 9" opacity=".7"/>
        ${spark(54, 8, 4, "#FFE07A")}${spark(9, 56, 3.2, "#FF8FA8")}`,
      biology_scope: `${lg("bi-sc-b", "#8FE0C8", "#3E9E86")}${lg("bi-sc-t", "#FFFFFF", "#C9D6E4", 1, 0)}
        ${tube("M42 50V44C42 36 48 32 48 24C48 18 45 15 41 14", 7, "#6FCDB4")}
        <g transform="rotate(-32 26 22)"><rect x="20" y="5" width="12" height="30" rx="4" fill="url(#bi-sc-t)" ${SO}/><rect x="18.5" y="2.5" width="15" height="6" rx="2.4" fill="#4A6496" ${S2}/><rect x="22" y="34" width="8" height="6" rx="1.6" fill="#8C9CB0" ${S2}/><path d="M23.5 11v15" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>
        <rect x="12" y="40" width="34" height="5" rx="2.2" fill="#4A6496" ${S2}/><rect x="20" y="38" width="12" height="2.4" rx="1" fill="#C9F0FF" stroke="${O}" stroke-width="1.1"/>
        <rect x="6" y="49" width="52" height="12" rx="6" fill="url(#bi-sc-b)" ${SO}/>
        ${EYES(26, 38, 54.5, 2)}${mouth(32, 57.2, 1.8, 1.7)}<ellipse cx="21.5" cy="57.5" rx="2" ry="1.3" fill="#FF8FA8"/><ellipse cx="42.5" cy="57.5" rx="2" ry="1.3" fill="#FF8FA8"/>
        ${spark(56, 9, 4, "#FFE07A")}`,
      biology_diatom: `${rg("bi-dt-g", "#FFF2C8", "#E8B04A", .4, .35)}
        <circle cx="32" cy="32" r="27" fill="url(#bi-dt-g)" ${SO}/>
        <circle cx="32" cy="32" r="20" fill="none" stroke="#C98A2A" stroke-width="1.4" opacity=".8"/>
        <g stroke="#C98A2A" stroke-width="1.3" stroke-linecap="round" opacity=".7">${rot(24, a => `<path d="M32 9V12" transform="rotate(${a} 32 32)"/>`)}</g>
        <g fill="#FFF8E0">${rot(12, a => `<circle cx="32" cy="15.5" r="1.4" transform="rotate(${a + 15} 32 32)"/>`)}</g>
        <circle cx="32" cy="33" r="12" fill="#FFF6DA" stroke="#C98A2A" stroke-width="1.4"/>
        ${EYES(27, 37, 32, 2.2)}${cheeks(23.5, 40.5, 36.5, 2.1, 1.4)}${mouth(32, 36, 1.9)}
        <ellipse cx="17.5" cy="15.5" rx="4.4" ry="2" fill="#fff" opacity=".6" transform="rotate(-40 17.5 15.5)"/>`,
      biology_microbe: `${rg("bi-mb-g", "#D4F7B4", "#6CC46A", .4, .35)}
        <g fill="none" stroke="#5DB45E" stroke-width="1.5" stroke-linecap="round">${rot(26, a => { const r = a * Math.PI / 180, R = Math.sqrt(1 / ((Math.sin(r) / 25) ** 2 + (Math.cos(r) / 21) ** 2)), x = 32 + R * Math.sin(r), y = 32 - R * Math.cos(r), ox = Math.sin(r), oy = -Math.cos(r); return `<path d="M${(x + ox * .5).toFixed(1)} ${(y + oy * .5).toFixed(1)}q${(ox * 1.8 - oy * 1.2).toFixed(1)} ${(oy * 1.8 + ox * 1.2).toFixed(1)} ${(ox * 3.2).toFixed(1)} ${(oy * 3.2).toFixed(1)}"/>`; })}</g>
        <ellipse cx="32" cy="32" rx="25" ry="21" fill="url(#bi-mb-g)" ${SO}/>
        <circle cx="46" cy="25" r="4" fill="#A6E08A" stroke="#4EA85A" stroke-width="1.4"/><circle cx="17" cy="40" r="3" fill="#A6E08A" stroke="#4EA85A" stroke-width="1.3"/><circle cx="44" cy="42" r="2.2" fill="#FFE07A"/>
        ${EYES(25.5, 38.5, 32, 2.6)}${cheeks(20.5, 43.5, 37.5, 2.8, 1.8)}${mouth(32, 37, 2.4, 2.1)}
        <ellipse cx="20" cy="20" rx="4.6" ry="2.2" fill="#fff" opacity=".6" transform="rotate(-25 20 20)"/>`,
      biology_petri: `${lg("bi-pt-a", "#FFF3C2", "#F7D97A")}
        <ellipse cx="32" cy="38" rx="28" ry="20" fill="#E6F6FF" ${SO}/>
        <ellipse cx="32" cy="36" rx="23.5" ry="15.5" fill="url(#bi-pt-a)" stroke="#D9B85A" stroke-width="1.4"/>
        <path d="${heartD(32, 35, .95)}" fill="#FF8FA8" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
        <g stroke="${O}" stroke-width="1.2"><circle cx="17" cy="36" r="3.2" fill="#9EE08A"/><circle cx="46" cy="30" r="3.6" fill="#7FD0F2"/><circle cx="45" cy="42" r="2.4" fill="#C9A8FF"/><circle cx="22" cy="28" r="2.2" fill="#FFB347"/></g>
        <g fill="#fff"><circle cx="16" cy="35" r=".9"/><circle cx="45" cy="29" r="1"/></g>
        <path d="M8 31Q14 20 30 18" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
        ${spark(55, 11, 4.2, "#FFE07A")}${spark(10, 10, 3, "#9FE3CC")}`,
      biology_cellebrate: `${rg("bi-cb-g", "#E6FFF6", "#8EDDC6", .4, .35)}
        <path d="M32 5C47 4 60 14 59 31C58 47 47 59 31 59C15 59 5 48 5 32C5 16 17 6 32 5z" fill="url(#bi-cb-g)" ${SO}/>
        ${T("CELL-", 33, 30, 13, "#E0457A", 38)}${T("ebrate!", 32, 44, 12, "#1F8C74", 40)}
        <g><rect x="13" y="10" width="4" height="2" rx="1" fill="#FFC93C" transform="rotate(30 15 11)"/><rect x="46" y="9" width="4" height="2" rx="1" fill="#C9A8FF" transform="rotate(-30 48 10)"/><circle cx="52" cy="50" r="1.6" fill="#FF8FA8"/><circle cx="12" cy="49" r="1.5" fill="#7FD0F2"/><rect x="30" y="50" width="4" height="2" rx="1" fill="#FFC93C" transform="rotate(20 32 51)"/></g>
        ${spark(57, 5.5, 3.4, "#FFE07A")}`
    }},
    pins: [
      {id: "tp-biology-petri", name: "Petri Dish Pin", kind: "badge", desc: "A tiny glass petri dish pin with a heart-shaped colony.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="bi-pp-g" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFF8DA"/><stop offset="1" stop-color="#F2CF6A"/></radialGradient></defs>
          <circle cx="15" cy="15" r="13" fill="#DDF2FF" stroke="#5C84A8" stroke-width="1.2"/>
          <circle cx="15" cy="15" r="10.4" fill="url(#bi-pp-g)" stroke="#D9B85A" stroke-width=".8"/>
          <path d="${heartD(15, 15.4, .52)}" fill="#FF7A95"/>
          <circle cx="9" cy="17" r="1.6" fill="#7CC47A"/><circle cx="20.5" cy="10" r="1.8" fill="#6FB8E6"/><circle cx="21" cy="19.5" r="1.2" fill="#B49BEA"/>
          <path d="M5.6 12A10 10 0 0 1 12 5.3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></svg>`},
      {id: "tp-biology-slide", name: "Slide Clip", kind: "clip", desc: "A glass microscope slide with a tiny green cell, clipped over the edge of the note.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="bi-ps-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2FBFF"/><stop offset="1" stop-color="#B9DCEB"/></linearGradient></defs>
          <rect x="2.5" y="1.5" width="17" height="47" rx="2" fill="url(#bi-ps-g)" fill-opacity=".9" stroke="#5C84A8" stroke-width="1.1"/>
          <rect x="4" y="3.5" width="14" height="9" rx="1" fill="#FFB8C8"/><path d="M6 7h10M6 9.8h7" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
          <circle cx="11" cy="30" r="5.6" fill="#A6E5CF" fill-opacity=".85" stroke="#3E9E86" stroke-width=".9"/><circle cx="11.6" cy="30.4" r="2.2" fill="#9F8FE6"/>
          <path d="M5 18V44" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></svg>`}
    ],
    card: {id: "tp-biology", name: "Under the Lens", desc: "A soft round microscope light field with cells drifting in the corners. Glows like fluorescence on deep navy at night."}
  });
})();

