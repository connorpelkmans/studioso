/* Theme Collections, new theme ideas batch n10: icecave, geysers */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const steam = (x, y, h, c = "#fff", w = 2.4) => `<path d="M${x} ${y}q-3 ${-h * .25} 0 ${-h * .5}t0 ${-h * .5}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity=".95"/>`;
  const flake = (x, y, r, c, w = 1.4) => { let d = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r, mx = x + Math.cos(a) * r * .6, my = y + Math.sin(a) * r * .6; d += `M${x} ${y}L${ex.toFixed(1)} ${ey.toFixed(1)}M${mx.toFixed(1)} ${my.toFixed(1)}L${(mx + Math.cos(a + .7) * r * .3).toFixed(1)} ${(my + Math.sin(a + .7) * r * .3).toFixed(1)}M${mx.toFixed(1)} ${my.toFixed(1)}L${(mx + Math.cos(a - .7) * r * .3).toFixed(1)} ${(my + Math.sin(a - .7) * r * .3).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const icicle = (x, y, L, w, c) => `<path d="M${x - w} ${y}H${x + w}L${x + w * .5} ${y + L * .55}L${x} ${y + L}L${x - w * .45} ${y + L * .5}Z" fill="${c}" ${S15}/><path d="M${x - w * .45} ${y + 2}L${x - w * .15} ${y + L * .45}" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`;
  // rings of a prismatic hot pool, centred at cx,cy
  const pool = (cx, cy, rx, ry, rays) => `${rays ? Array.from({length: 14}, (_, i) => { const a = i / 14 * Math.PI * 2, l = 1.18 + (i % 3) * .1; return `<path d="M${(cx + Math.cos(a - .14) * rx * 1.04).toFixed(1)} ${(cy + Math.sin(a - .14) * ry * 1.04).toFixed(1)}L${(cx + Math.cos(a) * rx * l * 1.12).toFixed(1)} ${(cy + Math.sin(a) * ry * l * 1.12).toFixed(1)}L${(cx + Math.cos(a + .14) * rx * 1.04).toFixed(1)} ${(cy + Math.sin(a + .14) * ry * 1.04).toFixed(1)}Z" fill="#E58A3E"/>`; }).join("") : ""}
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#E58A3E" ${S2}/><ellipse cx="${cx}" cy="${cy}" rx="${rx * .84}" ry="${ry * .84}" fill="#F2C54E"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * .7}" ry="${ry * .7}" fill="#62BC98"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * .6}" ry="${ry * .6}" fill="#3EB0D2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * .38}" ry="${ry * .38}" fill="#1D5EA6"/>`;

  /* ================= BLUE ICE CAVE ================= */
  TP_DATA.push({
    theme: "icecave",
    pack: {name: "Glacier Gang", items: {
      icecave_crystal: `${lg("n10-ic-c", "#F0FDFF", "#58BEE0")}
        <ellipse cx="25" cy="58" rx="6.4" ry="3.6" fill="#7FD0EA" ${S2}/><ellipse cx="39" cy="58" rx="6.4" ry="3.6" fill="#7FD0EA" ${S2}/>
        <path d="M32 8L50 19V45L32 57L14 45V19Z" fill="url(#n10-ic-c)" ${SO}/><path d="M32 8L50 19L32 27L14 19Z" fill="#fff" opacity=".6"/>
        <path d="M32 27L50 19V45L32 57Z" fill="#2E8EBE" opacity=".16"/><path d="M19 25V36" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        ${EYES(26, 38, 36, 2.5)}${blush(21.5, 42.5, 41, 2.2, 1.4)}${smile(32, 41.5, 2.2, 1.8)}
        ${spark(54, 9, 4.6, "#FFF0A0")}${spark(9, 50, 3, "#BFF2FF")}`,
      icecave_drip: `${rg("n10-ic-d", "#F0FDFF", "#2FA8D0", .4, .36)}
        <ellipse cx="32" cy="56" rx="22" ry="5" fill="#BFEFF8" ${S2}/>
        <path d="M32 6C36 16 50 27 50 40C50 51 42 57 32 57C22 57 14 51 14 40C14 27 28 16 32 6Z" fill="url(#n10-ic-d)" ${SO}/>
        <path d="M45 42C45 49 40 53 34 54C40 51 43 47 44 41Z" fill="#fff" opacity=".6"/>${SHINE(23, 30, 4, 2.2, -50)}
        ${EYES(26, 38, 40, 2.6)}${blush(21, 43, 45.4, 2.4, 1.5)}${smile(32, 45.4, 2.2, 1.8)}
        ${spark(55, 14, 3.6, "#BFF2FF")}`,
      icecave_snowball: `${rg("n10-ic-s", "#FFFFFF", "#BCD2EA", .4, .32)}
        <path d="M17 38L5 46M9.4 43.4L6 38M47 38L59 46M54.6 43.4L58 38" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M17 38L5 46M9.4 43.4L6 38M47 38L59 46M54.6 43.4L58 38" stroke="#8A5A36" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="32" cy="38" r="19" fill="url(#n10-ic-s)" ${SO}/>${SHINE(24, 28, 4.6, 2.4, -36)}
        <path d="M32 19V14M32 15L26 10L28 14L23 14ZM32 15L38 10L36 14L41 14Z" fill="#4E8A5A" ${S15}/>
        ${EYES(26, 38, 37, 2.4)}${blush(21, 43, 42.4, 2.4, 1.5)}${smile(32, 42, 2.2, 1.8)}
        <g fill="#A8C2E0"><circle cx="22" cy="48" r="1"/><circle cx="42" cy="50" r="1"/></g>`,
      icecave_icicles: `${lg("n10-ic-i", "#E8FBFF", "#7FCDE8")}
        <path d="M4 10Q18 4 32 9Q46 4 60 10L60 17H4Z" fill="#fff" ${SO}/>
        ${icicle(12, 15, 26, 4.4, "url(#n10-ic-i)")}${icicle(24, 15, 40, 5.4, "url(#n10-ic-i)")}${icicle(37, 15, 30, 4.8, "url(#n10-ic-i)")}${icicle(50, 15, 22, 4.2, "url(#n10-ic-i)")}
        <path d="M24 60C25 56.6 26.4 55 26.4 53.6A2.4 2.4 0 0 0 21.6 53.6C21.6 55 23 56.6 24 60Z" transform="rotate(180 24 56)" fill="#9FE4F4" ${SOw(1.4)}/>
        ${spark(56, 34, 3.6, "#BFF2FF")}${spark(44, 54, 2.6, "#fff")}`,
      icecave_mouth: `${lg("n10-ic-m", "#7DBDEB", "#E4F2FA")}${lg("n10-ic-w", "#8EDCF0", "#2A80BE")}
        <rect x="4" y="6" width="56" height="52" rx="12" fill="url(#n10-ic-w)" ${SO}/>
        <path d="M14 50V34C14 22 22 16 32 16C42 16 50 22 50 34V50Z" fill="#C8F0F8" ${S2}/><path d="M19 50V35C19 26 25 21 32 21C39 21 45 26 45 35V50Z" fill="url(#n10-ic-m)" ${S15}/>
        <path d="M19 46L27 32L31 38L35 30L45 46Z" fill="#8FB0D6"/><path d="M27 32L29.4 36L26 37.5L24.6 36.4Z M35 30L37.6 34.4L33.4 35Z" fill="#fff"/><path d="M19 50V45Q32 42 45 45V50Z" fill="#fff"/>
        <circle cx="39" cy="27" r="2.6" fill="#FFF8DC"/>
        ${icicle(17, 15, 9, 2, "#E8FBFF")}${icicle(47, 15, 8, 2, "#E8FBFF")}
        <path d="M8 52Q32 46 56 52V54Q56 58 52 58H12Q8 58 8 54Z" fill="#E8F8FC" ${S15}/>`,
      icecave_aurora: `${lg("n10-ic-n", "#0E1640", "#2C3E74")}
        <circle cx="32" cy="32" r="27" fill="url(#n10-ic-n)" ${SO}/>
        <path d="M8 28Q18 18 30 26T56 22L56 30Q44 34 30 32T8 36Z" fill="#6FFFC8" opacity=".55"/><path d="M10 34Q22 28 34 34T56 32L55 37Q44 40 34 38T11 40Z" fill="#FF8AD8" opacity=".45"/>
        <path d="M9 44L20 30L26 38L33 27L44 42L50 36L56 44Q50 56 32 59Q14 56 9 44Z" fill="#3A4C88" ${S15}/><path d="M20 30L23 34.4L18.4 35.4Z M33 27L36.4 32L30.8 32.6Z" fill="#B8C8F0"/>
        <circle cx="44" cy="14" r="3.4" fill="#FFF6D8"/><g fill="#fff"><circle cx="17" cy="15" r="1"/><circle cx="26" cy="11" r=".9"/><circle cx="52" cy="22" r=".8"/><circle cx="35" cy="17" r=".8"/></g>`,
      icecave_flake: `${rg("n10-ic-f", "#FFFFFF", "#CDEFFA", .5, .5)}
        <circle cx="32" cy="32" r="22" fill="url(#n10-ic-f)" ${SO}/>${flake(32, 32, 17, "#3E9CC4", 2.4)}
        <circle cx="32" cy="32" r="8" fill="#fff" ${S15}/>${EYES(29, 35, 31.4, 1.5)}<path d="M30.4 34.4q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
        ${spark(56, 10, 4, "#BFF2FF")}${spark(8, 54, 3, "#BFF2FF")}`,
      icecave_cool: `${lg("n10-ic-t", "#BFF0FA", "#4FB4DC")}
        <rect x="5" y="16" width="54" height="30" rx="7" fill="url(#n10-ic-t)" ${SO}/><path d="M9 21H31" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
        ${T("STAY COOL", 32, 36, 10, "#FFFFFF", 44)}
        ${icicle(14, 45, 10, 2.6, "#E8FBFF")}${icicle(30, 45, 13, 3, "#E8FBFF")}${icicle(47, 45, 9, 2.4, "#E8FBFF")}
        ${spark(56, 10, 3.8, "#BFF2FF")}${flake(9, 9, 5, "#7FCDE8", 1.2)}`
    }},
    pins: [
      {id: "tp-icecave-crystal", name: "Glacier Crystal Pin", kind: "badge", desc: "A faceted blue ice crystal with a little sparkle.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n10-pp-ic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0FDFF"/><stop offset="1" stop-color="#4FB4DC"/></linearGradient></defs>
          <path d="M15 2L25 8V22L15 28L5 22V8Z" fill="url(#n10-pp-ic)" stroke="#1E5A84" stroke-width="1.3" stroke-linejoin="round"/><path d="M15 2L25 8L15 12.4L5 8Z" fill="#fff" opacity=".65"/>
          <path d="M15 12.4L25 8V22L15 28Z" fill="#2E8EBE" opacity=".18"/><path d="M8.4 11V18" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`},
      {id: "tp-icecave-frost", name: "Frost Washi", kind: "tape", desc: "Glacier-blue washi tape with snowflakes and little icicles along its edge.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#5AB4DC" opacity=".92"/>
          ${[[14, 13], [34, 12], [54, 13], [72, 12]].map(([x, y]) => flake(x, y, 5, "#FFFFFF", 1)).join("")}
          ${[24, 44, 63].map(x => `<path d="M${x - 2} 1.8H${x + 2}L${x} 9Z" fill="#E8FBFF"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-icecave", name: "Glacier Glow", desc: "Pale glacier-blue paper with a glowing ice arch and hanging icicles. Deep indigo with an aurora in dark mode."}
  });

  /* ================= GEYSER BASIN ================= */
  TP_DATA.push({
    theme: "geysers",
    pack: {name: "Hot Spring Crew", items: {
      geysers_steam: `${rg("n10-gy-s", "#FFFFFF", "#C6CCE2", .42, .34)}
        <path d="M24 52q-3 4 0 7M40 52q3 4 0 7" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M24 52q-3 4 0 7M40 52q3 4 0 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="13" cy="38" r="5" fill="#F2F4FA" ${S2}/><circle cx="51" cy="38" r="5" fill="#F2F4FA" ${S2}/>
        <path d="M18 50C10 50 9 40 15 37C13 29 21 24 27 27C29 20 39 20 41 27C47 24 55 30 51 37C57 40 55 50 46 50Z" fill="url(#n10-gy-s)" ${SO}/>
        ${EYES(26, 38, 38, 2.4)}${blush(21, 43, 43, 2.4, 1.5)}${smile(32, 42.6, 2.2, 1.8)}
        <path d="M32 21q-3-3 0-6t0-6" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M32 21q-3-3 0-6t0-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,
      geysers_pebble: `${rg("n10-gy-p", "#FCFAF4", "#B8AE9E", .42, .3)}
        <ellipse cx="12" cy="45" rx="4" ry="5" fill="#DCD4C6" ${S2}/><ellipse cx="52" cy="45" rx="4" ry="5" fill="#DCD4C6" ${S2}/>
        <path d="M32 22C46 22 54 32 54 42C54 52 45 57 32 57C19 57 10 52 10 42C10 32 18 22 32 22Z" fill="url(#n10-gy-p)" ${SO}/>
        ${pool(32, 30.5, 13, 4.4, false)}
        ${steam(32, 27, 12, "#fff", 2)}${EYES(26, 38, 42.6, 2.3)}${blush(20, 44, 47.4, 2.3, 1.4)}${smile(32, 47.4, 2, 1.7)}`,
      geysers_cone: `${lg("n10-gy-c", "#D4A06A", "#8A5A30")}
        <ellipse cx="26" cy="59" rx="5" ry="3" fill="#7A4E2A" ${S2}/><ellipse cx="38" cy="59" rx="5" ry="3" fill="#7A4E2A" ${S2}/>
        <path d="M32 14C42 14 48 25 48 37C48 50 41 57 32 57C23 57 16 50 16 37C16 25 22 14 32 14Z" fill="url(#n10-gy-c)" ${SO}/>
        <g fill="#E8BE88" stroke="#6A4220" stroke-width="1.2"><path d="M25 22q3 4 6 0q-3-3.6-6 0Z"/><path d="M33 22q3 4 6 0q-3-3.6-6 0Z"/><path d="M19 30q3 4 6 0q-3-3.6-6 0Z"/><path d="M39 30q3 4 6 0q-3-3.6-6 0Z"/><path d="M22 48q3 4 6 0q-3-3.6-6 0Z"/><path d="M36 48q3 4 6 0q-3-3.6-6 0Z"/></g>
        <path d="M31 15L25 3M33 15L39 3" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M31 15L25 3M33 15L39 3" stroke="#5AAA62" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(27, 37, 38, 2.4)}${blush(22, 42, 43, 2.2, 1.4)}${smile(32, 42.4, 2, 1.7)}`,
      geysers_pool: `${pool(32, 33, 20, 13, true)}
        <path d="M22 30q4-3 9-3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>
        ${steam(26, 26, 14)}${steam(37, 25, 16)}${spark(56, 9, 3.6, "#FFE07A")}`,
      geysers_erupt: `${lg("n10-gy-e", "#F7F2E8", "#C8BEAE")}
        <path d="M18 56Q20 46 27 44H37Q44 46 46 56Z" fill="url(#n10-gy-e)" ${SO}/>
        <path d="M27 44C26 32 24 20 22 10C28 6 36 6 42 10C40 20 38 32 37 44Z" fill="#fff" ${S2}/>
        <circle cx="24" cy="9" r="6" fill="#fff" ${S15}/><circle cx="33" cy="6" r="6.6" fill="#fff" ${S15}/><circle cx="42" cy="9" r="6" fill="#fff" ${S15}/>
        <path d="M44 34A16 16 0 0 1 60 20" fill="none" stroke="#FF6A6A" stroke-width="2.2"/><path d="M45 36A15 15 0 0 1 60 23" fill="none" stroke="#FFE05A" stroke-width="2.2"/><path d="M46 38A14 14 0 0 1 60 26" fill="none" stroke="#5AB8F2" stroke-width="2.2"/>
        <path d="M29 50q2-3 3 0M36 52q2 3 4 0" stroke="#D2803A" stroke-width="2" fill="none" stroke-linecap="round"/>
        <g fill="#9FD8F0"><circle cx="16" cy="30" r="1.6"/><circle cx="48" cy="44" r="1.4"/><circle cx="14" cy="42" r="1.2"/></g>`,
      geysers_terrace: `${lg("n10-gy-t", "#FFFDF8", "#E2D6C2")}
        <path d="M24 26Q24 14 36 14H58V58H6V50Q6 44 12 42H14V40Q14 30 24 30Z" fill="url(#n10-gy-t)" ${SO}/>
        <path d="M26 18Q28 15 34 15H57V19Q53 23 49 19Q45 23 41 19Q37 23 33 19Q29 22 26 20Z" fill="#7FD0DC" ${S15}/>
        <path d="M15 33Q17 30 23 30H57V34Q53 38 49 34Q45 38 41 34Q37 38 33 34Q29 38 25 34Q20 37 15 35Z" fill="#7FD0DC" ${S15}/>
        <path d="M7 47Q9 44 14 44H57V48Q53 52 49 48Q45 52 41 48Q37 52 33 48Q29 52 25 48Q21 52 17 48Q12 51 7 49Z" fill="#7FD0DC" ${S15}/>
        <path d="M37 23V28M49 22V29M29 37V42M45 37V43M21 51V56M37 51V57M53 51V56" stroke="#D2803A" stroke-width="2" stroke-linecap="round" opacity=".85"/>
        ${steam(46, 12, 10, "#fff", 2)}${spark(10, 14, 3.4, "#FFD86B")}`,
      geysers_pine: `${lg("n10-gy-l", "#4C7C58", "#2E5A44")}
        <rect x="29.6" y="30" width="4.8" height="28" rx="2" fill="#6E5644" ${S2}/>
        <path d="M32 3L37 12H34.6L40 20H36.6L42 29H22L27.4 20H24L29.4 12H27Z" fill="url(#n10-gy-l)" ${SO}/>
        <path d="M30 22L22 26M34 22L42 26M30 30L24 34M34 30L40 34" stroke="${O}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
        <ellipse cx="32" cy="58" rx="16" ry="3" fill="#E3D9C3" ${S15}/>
        ${EYES(28.4, 35.6, 22, 1.8)}<path d="M30.6 24.4q1.4 1.2 2.8 0" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
        ${spark(52, 14, 3.4, "#FFE07A")}${steam(12, 50, 12, "#C6CCE2", 2)}`,
      geysers_steamsign: `${lg("n10-gy-w", "#C49464", "#8E6238")}
        <path d="M14 40V58M50 40V58" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M14 40V58M50 40V58" stroke="#7E5636" stroke-width="2.8" stroke-linecap="round"/>
        <rect x="4" y="18" width="56" height="26" rx="5" fill="url(#n10-gy-w)" ${SO}/>
        ${T("LET OFF STEAM", 32, 35.4, 8.6, "#FFF6E0", 48)}
        ${steam(14, 14, 10)}${steam(32, 12, 10)}${steam(50, 14, 10)}`
    }},
    pins: [
      {id: "tp-geysers-pool", name: "Prismatic Pool Pin", kind: "badge", desc: "A tiny rainbow hot spring, deep blue in the middle.",
        svg: `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#E58A3E" stroke="#6E2E10" stroke-width="1.3"/><circle cx="15" cy="15" r="10.6" fill="#F2C54E"/><circle cx="15" cy="15" r="8.6" fill="#62BC98"/>
          <circle cx="15" cy="15" r="7.2" fill="#3EB0D2"/><circle cx="15" cy="15" r="4.4" fill="#1D5EA6"/><path d="M10 11.4q2.2-2 4.6-2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".85"/></svg>`},
      {id: "tp-geysers-rainbow", name: "Hot Spring Washi", kind: "tape", desc: "Washi tape striped in hot spring colours, from deep blue to orange, with curls of steam.",
        svg: `<svg viewBox="0 0 86 26"><defs><linearGradient id="n10-pp-gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E58A3E"/><stop offset=".25" stop-color="#F2C54E"/><stop offset=".45" stop-color="#62BC98"/><stop offset=".65" stop-color="#3EB0D2"/><stop offset="1" stop-color="#1D5EA6"/></linearGradient></defs>
          <path d="${tapeEdge}" fill="url(#n10-pp-gw)" opacity=".92"/>
          ${[16, 36, 56, 74].map(x => `<path d="M${x} 21q-3-3 0-6t0-6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-geysers", name: "Prismatic Pool", desc: "Warm sinter paper with a rainbow hot spring steaming in the corner and a little geyser cone. Moonlit and softly glowing in dark mode."}
  });
})();
