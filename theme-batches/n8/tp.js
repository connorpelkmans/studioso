/* Theme Collections, new theme ideas batch n8: waterfall, redwoods */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const shut = (x, y, w = 2.6) => `<path d="M${x - w} ${y}q${w} ${-w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const tube = (d, c, w, ow = w + 3.6) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const leafP = (x, y, L, w, a) => `<path d="M0 0Q${L * .45} ${-w} ${L} 0Q${L * .45} ${w} 0 0z" transform="translate(${x} ${y}) rotate(${a})"`;
  // a fern frond: a stem from (x,y) along angle a (degrees), n leaflet pairs
  const frond = (x, y, L, a, c, n = 6, sw = 1.4) => { const r = a * Math.PI / 180; let s = `<path d="M${x} ${y}l${(Math.cos(r) * L).toFixed(1)} ${(Math.sin(r) * L).toFixed(1)}" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
    for (let i = 1; i <= n; i++) { const t = i / (n + 1), px = x + Math.cos(r) * L * t, py = y + Math.sin(r) * L * t, l = L * 0.32 * (1 - t * 0.6); s += `${leafP(px.toFixed(1), py.toFixed(1), l.toFixed(1), (l * 0.32).toFixed(1), a - 60)} fill="${c}" ${SOw(1)}/>${leafP(px.toFixed(1), py.toFixed(1), l.toFixed(1), (l * 0.32).toFixed(1), a + 60)} fill="${c}" ${SOw(1)}/>`; } return s; };
  const heart = (x, y, s, rot, fill) => `<path d="M0 12C-6 8 -13 3.5 -13 -3C-13 -8 -9.4 -11 -5.6 -11C-3 -11 -1 -9.4 0 -7.2C1 -9.4 3 -11 5.6 -11C9.4 -11 13 -8 13 -3C13 3.5 6 8 0 12Z" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" stroke="${O}" stroke-width="${(2 / s).toFixed(2)}" stroke-linejoin="round"/>`;
  const rainbowArc = (cx, cy, R, w) => ["#FF7A7A", "#FFC85A", "#7EDB6A", "#5AB8F2", "#A68AF0"].map((c, i) => `<path d="M${cx - R + i * w} ${cy}A${R - i * w} ${R - i * w} 0 0 1 ${cx + R - i * w} ${cy}" fill="none" stroke="${c}" stroke-width="${w}"/>`).join("");

  /* ================= FERN FALLS ================= */
  TP_DATA.push({
    theme: "waterfall",
    pack: {name: "Fern Falls Friends", items: {
      waterfall_falls: `${lg("n8-wf-r", "#8A9A94", "#55635F")}${lg("n8-wf-p", "#8ED8C4", "#3A9884")}
        <path d="M6 54V14Q6 8 12 8H52Q58 8 58 14V54Z" fill="url(#n8-wf-r)" ${SO}/>
        <path d="M10 14V50M18 12V50M46 12V50M54 14V50" stroke="#45524E" stroke-width="1.2" opacity=".6"/>
        <path d="M26 8H38V24H26Z" fill="#F6FDFD" ${S15}/><path d="M22 24H42L40 27H24Z" fill="#B8C6BE" ${S15}/>
        <path d="M23 27H41L44 44H20Z" fill="#F6FDFD" ${S15}/><path d="M26 30V42M32 30V43M38 30V42" stroke="#9AD0DC" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="32" cy="54" rx="26" ry="7" fill="url(#n8-wf-p)" ${SO}/><ellipse cx="32" cy="50" rx="12" ry="2.6" fill="#fff"/>
        <path d="M8 22q5-2 8 1M48 20q5-2 9 1" fill="none" stroke="#7CBE5A" stroke-width="3" stroke-linecap="round"/>
        ${frond(10, 58, 20, -70, "#5AAE52")}${frond(56, 58, 18, -110, "#5AAE52")}${spark(54, 6, 3.6, "#FFE68A")}`,
      waterfall_plip: `${rg("n8-wp-b", "#F2FCFF", "#2E86C8", .4, .45)}
        <ellipse cx="32" cy="56" rx="22" ry="5" fill="#A6E4EE" ${S2}/>
        <path d="M32 8C36 17 52 26 52 40C52 51 43 57 32 57C21 57 12 51 12 40C12 26 28 17 32 8Z" fill="url(#n8-wp-b)" ${SO}/>
        <path d="M20 36C20 29 24 24 28 21" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="25" cy="40" r="2.6" fill="${O}"/><circle cx="39" cy="40" r="2.6" fill="${O}"/><circle cx="25.9" cy="39" r=".9" fill="#fff"/><circle cx="39.9" cy="39" r=".9" fill="#fff"/>
        ${blush(20, 44, 45)}${smile(32, 45.5, 2.4, 1.8)}${frond(32, 10, 12, -72, "#7CC860", 4, 1.2)}${spark(54, 14, 3.6, "#9FE0FF")}`,
      waterfall_mossby: `${rg("n8-wm-b", "#E2EAE6", "#77867F", .4, .35)}${rg("n8-wm-m", "#B4E27A", "#5E9A40", .4, .3)}
        <path d="M8 46C7 32 18 24 32 24C47 24 57 32 56 46C55 55 46 58 32 58C18 58 9 55 8 46Z" fill="url(#n8-wm-b)" ${SO}/>
        <path d="M9 40C10 30 20 22 32 22C45 22 54 30 55 40C51 37 47 40 43 37C39 41 34 36 30 40C26 36 21 40 17 37C14 39 11 39 9 40Z" fill="url(#n8-wm-m)" ${S2}/>
        ${tube("M32 22C32 17 33 13 36 11", "#5E9A40", 2)}<path d="M36 11C36 6 42 6 42 9.5C42 11.6 39 12.2 38.4 10.8" fill="none" stroke="#9AD66A" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(25, 39, 46, 2.3)}${blush(20, 44, 50, 2.4, 1.5)}${smile(32, 50, 2.2, 1.7)}${spark(10, 14, 3.4, "#C8F0A0")}`,
      waterfall_misty: `${rg("n8-wy-b", "#FFFFFF", "#BFE0F0", .42, .35)}
        ${rainbowArc(32, 30, 22, 2.8)}
        <path d="M16 46C10 46 8 40 12 37C10 31 16 27 21 29C23 23 31 22 34 26C38 22 46 24 46 30C52 30 56 36 52 40C55 45 50 50 45 48C42 52 36 52 33 49C29 52 22 51 20 47C18 48 17 47 16 46Z" fill="url(#n8-wy-b)" ${SO}/>
        ${EYES(26, 38, 39, 2.3)}${blush(21.5, 42.5, 43, 2.4, 1.5)}${smile(32, 43, 2.2, 1.7)}
        <path d="M24 55c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4zM32 57c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4zM40 55c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4z" fill="#8ED0F0" ${SOw(1)}/>`,
      waterfall_fiddle: `${lg("n8-wd-s", "#B8E88A", "#4E9A3E")}
        ${tube("M30 60C30 48 28 40 32 32", "#6AAE4A", 4)}
        <path d="M32 32C32 18 48 16 48 28C48 36 38 38 36 31C35 27 40 26 41 29" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/>
        <path d="M32 32C32 18 48 16 48 28C48 36 38 38 36 31C35 27 40 26 41 29" fill="none" stroke="url(#n8-wd-s)" stroke-width="5.4" stroke-linecap="round"/>
        ${leafP(29, 50, 12, 4, -150)} fill="#7CC860" ${S15}/>${leafP(31, 44, 11, 4, -30)} fill="#7CC860" ${S15}/>
        <circle cx="39" cy="24" r="1.4" fill="${O}"/><circle cx="45" cy="25" r="1.4" fill="${O}"/><path d="M40.5 28.4q1.6 1.2 3.2 0" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
        ${spark(12, 18, 3.6, "#FFE68A")}${spark(54, 48, 3, "#9FE0FF")}`,
      waterfall_rainbow: `${rg("n8-wr-c", "#FFFFFF", "#D8EEF6", .4, .35)}
        ${rainbowArc(32, 44, 26, 3.6)}
        <path d="M4 48C4 42 10 40 14 42C16 37 24 37 26 42C30 40 34 44 32 48Z" fill="url(#n8-wr-c)" ${S2}/><path d="M32 48C32 42 38 40 42 42C44 37 52 37 54 42C58 40 62 44 60 48Z" fill="url(#n8-wr-c)" ${S2}/>
        <path d="M16 54c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4zM28 56c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4zM40 54c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4zM50 56c-1.4 2-1.4 3.4 0 3.4s1.4-1.4 0-3.4z" fill="#8ED0F0" ${SOw(1)}/>
        ${spark(32, 10, 4, "#FFE68A")}${spark(52, 16, 2.6, "#FFFFFF")}`,
      waterfall_glow: `${lg("n8-wg-b", "#1E3A4A", "#0E1C28")}
        <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#n8-wg-b)" ${SO}/>
        <circle cx="44" cy="18" r="6" fill="#F2F2E2"/>
        <path d="M8 40Q20 34 32 38T56 36V52Q56 56 52 56H12Q8 56 8 52Z" fill="#183040"/>
        <path d="M30 12H36V42H30Z" fill="#BFD6EC" opacity=".9"/><path d="M28 42H38L40 48H26Z" fill="#E2EEF8" opacity=".9"/>
        ${[[14, 24], [18, 30], [12, 34], [22, 22], [48, 30], [52, 26], [46, 38], [16, 44], [50, 46], [24, 48]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" fill="#9FFFEA"/><circle cx="${x}" cy="${y}" r="${i % 3 ? 3 : 4}" fill="#6FFFE0" opacity=".25"/>`).join("")}`,
      waterfall_flow: `${lg("n8-wt-b", "#3EA89A", "#1E7466")}
        ${frond(8, 30, 14, -150, "#86CC62", 4, 1.2)}${frond(56, 30, 14, -30, "#86CC62", 4, 1.2)}
        <rect x="4" y="18" width="56" height="28" rx="14" fill="url(#n8-wt-b)" ${SO}/>
        <path d="M10 41q4-2 8 0t8 0t8 0t8 0t8 0t6 0" fill="none" stroke="#A6EAE0" stroke-width="1.4" stroke-linecap="round"/>
        ${T("GO WITH", 32, 30.5, 8, "#FFFFFF", 34)}${T("THE FLOW", 32, 39, 8, "#E8FFF8", 38)}
        ${spark(54, 10, 3.6, "#FFE68A")}<path d="M10 9c-1.6 2.4-1.6 4 0 4s1.6-1.6 0-4z" fill="#8ED0F0" ${SOw(1)}/>`
    }},
    pins: [
      {id: "tp-waterfall-fiddle", name: "Fiddlehead Pin", kind: "badge", desc: "A curled green fiddlehead fern, just about to unroll.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n8-pp-wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8E88A"/><stop offset="1" stop-color="#4E9A3E"/></linearGradient></defs>
          <circle cx="15" cy="15" r="13" fill="#E6F6EE" stroke="#1E4A44" stroke-width="1.3"/>
          <path d="M13 26C13 20 12 16 14 12C15 6 23 6 23 12C23 16 18 17 17 13.6C16.6 11.6 19 11 19.6 12.6" fill="none" stroke="#1E4A2E" stroke-width="4.4" stroke-linecap="round"/>
          <path d="M13 26C13 20 12 16 14 12C15 6 23 6 23 12C23 16 18 17 17 13.6C16.6 11.6 19 11 19.6 12.6" fill="none" stroke="url(#n8-pp-wf)" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M7 9q1.6-2.4 0-4q-1.6 1.6 0 4z" fill="#8ED0F0" stroke="#2E6A9A" stroke-width=".6"/></svg>`},
      {id: "tp-waterfall-falls", name: "Falls Washi", kind: "tape", desc: "Teal washi tape with tumbling white water, ferns and tiny drops.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2E908A" opacity=".92"/>
          ${[12, 34, 56, 76].map(x => `<path d="M${x} 3v20M${x + 3} 4v18M${x + 6} 3v20" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`).join("")}
          ${[23, 45, 66].map((x, i) => `<path d="M${x} 22l0 -14" stroke="#1E5A44" stroke-width=".8"/>${[0, 1, 2, 3].map(k => `<path d="M${x} ${20 - k * 3.2}l-3 -1.4M${x} ${20 - k * 3.2}l3 -1.4" stroke="#A6E07A" stroke-width="1.6" stroke-linecap="round"/>`).join("")}`).join("")}
          ${[[8, 8], [30, 18], [52, 9], [72, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#CFF4FF"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-waterfall", name: "Fern Spray", desc: "Misty teal-white paper with a little tiered waterfall in the corner and a curling fern below. Moonlit with glow-worm speckles in dark mode."}
  });

  /* ================= REDWOOD GROVE ================= */
  TP_DATA.push({
    theme: "redwoods",
    pack: {name: "Grove Keepers", items: {
      redwoods_tree: `${lg("n8-rt-b", "#B86A44", "#7A3E26", 1, 0)}
        <path d="M40 2L54 2L62 40L60 50Z" fill="#FFEAA8" opacity=".55"/><path d="M8 2L18 2L30 50L24 50Z" fill="#FFEAA8" opacity=".4"/>
        <path d="M24 2H40L42 50Q44 56 50 60H14Q20 56 22 50Z" fill="url(#n8-rt-b)" ${SO}/>
        <path d="M28 6V54M33 4V56M37 6V52" stroke="#5E2C18" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
        ${frond(6, 60, 16, -60, "#4E9C4E", 5, 1.2)}${frond(58, 60, 16, -120, "#4E9C4E", 5, 1.2)}
        ${spark(50, 22, 3.4, "#FFE07A")}${spark(14, 30, 2.6, "#FFE07A")}`,
      redwoods_cono: `${rg("n8-rc-b", "#F0B888", "#7A3E22", .42, .35)}
        <ellipse cx="25" cy="58" rx="5" ry="3" fill="#7A4428" ${S2}/><ellipse cx="39" cy="58" rx="5" ry="3" fill="#7A4428" ${S2}/>
        <path d="M32 12C44 12 50 24 50 36C50 50 42 58 32 58C22 58 14 50 14 36C14 24 20 12 32 12Z" fill="url(#n8-rc-b)" ${SO}/>
        ${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3].map(c => { const x = 19 + c * 8.6 + (r % 2) * 4.3, y = 18 + r * 7.6; return `<path d="M${x - 4} ${y}Q${x} ${y + 5} ${x + 4} ${y}" fill="none" stroke="#6A3018" stroke-width="1.5" opacity=".55"/>`; }).join("")).join("")}
        <ellipse cx="32" cy="41" rx="12" ry="9" fill="#F2C49A" opacity=".85"/>
        ${EYES(26.5, 37.5, 39.5, 2.3)}${blush(22, 42, 44, 2.2, 1.4)}${smile(32, 44, 2.2, 1.7)}
        ${tube("M32 12Q33 7 37 5L43 2", "#7A5A3A", 1.6)}${leafP(37, 5, 7, 2.2, -110)} fill="#6EAA50" ${SOw(1.2)}/>${leafP(40, 3.6, 6, 2, 50)} fill="#5E9A48" ${SOw(1.2)}/>`,
      redwoods_sorrel: `${rg("n8-rs-l", "#C8F098", "#4E9A3E", .45, .35)}
        ${tube("M32 60V40", "#6AA84A", 3)}
        ${heart(18, 46, 0.9, -110, "url(#n8-rs-l)")}${heart(46, 46, 0.9, 110, "url(#n8-rs-l)")}${heart(32, 26, 1.35, 180, "url(#n8-rs-l)")}
        <circle cx="27" cy="25" r="1.8" fill="${O}"/><circle cx="37" cy="25" r="1.8" fill="${O}"/>${smile(32, 29, 1.8, 1.5)}${blush(23, 41, 28.5, 2, 1.3)}
        ${[0, 1, 2, 3, 4].map(i => { const a = i * 72 * Math.PI / 180, x = (50 + Math.sin(a) * 3.6).toFixed(1), y = (12 - Math.cos(a) * 3.6).toFixed(1); return `<circle cx="${x}" cy="${y}" r="3" fill="#FFF0F4" ${SOw(1.2)}/>`; }).join("")}<circle cx="50" cy="12" r="1.8" fill="#FFD45A"/>`,
      redwoods_burl: `${lg("n8-rb-b", "#B86A44", "#7A3E26", 1, 0)}${rg("n8-rb-t", "#F6D6A8", "#D49A64", .5, .5)}
        <path d="M12 34V52Q12 56 8 60H56Q52 56 52 52V34Z" fill="url(#n8-rb-b)" ${SO}/>
        <ellipse cx="32" cy="34" rx="20" ry="6.4" fill="url(#n8-rb-t)" ${SO}/><ellipse cx="32" cy="34" rx="12" ry="3.8" fill="none" stroke="#B87A48" stroke-width="1.2"/><ellipse cx="32" cy="34" rx="5" ry="1.6" fill="none" stroke="#B87A48" stroke-width="1.2"/>
        ${tube("M32 34C32 28 31 24 32 18", "#5DAA62", 2)}<path d="M32 20C28 13 20 13 17 17C21 22 28 23 32 20Z" fill="#8AD08A" ${S15}/><path d="M32 19C35 12 43 10 47 13C45 19 38 22 32 19Z" fill="#9BDA95" ${S15}/>
        ${EYES(25, 39, 45, 2.2)}${blush(20.5, 43.5, 49, 2.2, 1.4)}${smile(32, 49, 2.2, 1.7)}`,
      redwoods_fern: `${lg("n8-rf-l", "#86CC62", "#2E6A3A")}
        ${frond(32, 60, 46, -90, "url(#n8-rf-l)", 9, 1.6)}${frond(30, 60, 40, -122, "url(#n8-rf-l)", 8, 1.5)}${frond(34, 60, 40, -58, "url(#n8-rf-l)", 8, 1.5)}${frond(28, 60, 30, -150, "#4E9C4E", 6, 1.3)}${frond(36, 60, 30, -30, "#4E9C4E", 6, 1.3)}
        ${spark(54, 12, 3.4, "#FFE07A")}`,
      redwoods_beam: `${rg("n8-rm-b", "#FFF8DC", "#FFD27A", .5, .5)}
        <rect x="6" y="6" width="52" height="52" rx="12" fill="#E6EEE2" ${SO}/>
        <path d="M16 6H24L44 58H32Z" fill="#FFE8A0" opacity=".7"/><path d="M30 6H34L52 58H46Z" fill="#FFE8A0" opacity=".5"/>
        <path d="M12 6V58M50 6V58" stroke="#8A4A34" stroke-width="7"/><path d="M12 6V58M50 6V58" stroke="#B05E3E" stroke-width="3"/>
        <circle cx="22" cy="12" r="6" fill="url(#n8-rm-b)" ${S15}/>
        ${[[26, 30], [34, 38], [30, 46], [40, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#FFF6D0"/>`).join("")}`,
      redwoods_log: `${lg("n8-rl-b", "#A8583A", "#6E3220")}${rg("n8-rl-e", "#F6D6A8", "#C89A70", .5, .5)}
        <path d="M14 30H56Q60 30 60 40Q60 50 56 50H14Z" fill="url(#n8-rl-b)" ${SO}/>
        <path d="M14 30H56Q60 30 60 34Q50 31 44 35Q36 31 30 35Q22 31 14 35Z" fill="#7CBE5A" ${S15}/>
        <ellipse cx="14" cy="40" rx="6" ry="10" fill="url(#n8-rl-e)" ${SO}/><ellipse cx="14" cy="40" rx="3" ry="5.4" fill="none" stroke="#A8744E" stroke-width="1.2"/>
        <path d="M30 38q3 4 1 9M44 38q3 4 1 9" fill="none" stroke="#5E2C18" stroke-width="1.2" opacity=".5"/>
        <path d="M44 30C44 24 52 24 52 30Z" fill="#F2B04A" ${S15}/><path d="M47 30V34" stroke="${O}" stroke-width="1.4"/>
        <circle cx="24" cy="54" r="2.2" fill="#FFF0F4" ${SOw(1)}/><circle cx="36" cy="56" r="2" fill="#FFF0F4" ${SOw(1)}/>
        ${frond(6, 58, 14, -70, "#4E9C4E", 4, 1.1)}${spark(54, 14, 3.4, "#FFE07A")}`,
      redwoods_tall: `${lg("n8-rx-b", "#B85E3A", "#7A3E28")}
        <rect x="4" y="16" width="56" height="32" rx="9" fill="url(#n8-rx-b)" ${SO}/>
        <rect x="8" y="20" width="48" height="24" rx="6" fill="none" stroke="#F6C89A" stroke-width="1.2" stroke-dasharray="1.4 3" stroke-linecap="round"/>
        ${T("STAND", 32, 30.6, 9, "#FFF4E0", 30)}${T("TALL", 32, 40.6, 9, "#FFE3A0", 24)}
        ${heart(10, 10, 0.45, 0, "#7CBE5A")}${heart(54, 54, 0.45, 0, "#7CBE5A")}${spark(54, 9, 3.6, "#FFE07A")}`
    }},
    pins: [
      {id: "tp-redwoods-cone", name: "Redwood Cone Pin", kind: "badge", desc: "A tiny scaly redwood cone with a sprig of needles.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n8-pp-rc" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#F0B888"/><stop offset="1" stop-color="#7A3E22"/></radialGradient></defs>
          <path d="M15 6C21 6 24 12 24 18C24 24 20 28 15 28C10 28 6 24 6 18C6 12 9 6 15 6Z" fill="url(#n8-pp-rc)" stroke="#4A1E10" stroke-width="1.3"/>
          ${[0, 1, 2].map(r => [0, 1, 2].map(c => { const x = 10 + c * 5 + (r % 2) * 2.5, y = 11 + r * 5; return `<path d="M${x - 2.4} ${y}Q${x} ${y + 3} ${x + 2.4} ${y}" fill="none" stroke="#5E2810" stroke-width=".9" opacity=".7"/>`; }).join("")).join("")}
          <path d="M15 6Q16 3 19 2L24 1" fill="none" stroke="#5A3A20" stroke-width="1"/><path d="M19 2.4l-1 -2M19 2.4l1 2M22 1.6l-1 -1.6M22 1.6l1 2" stroke="#5E9A48" stroke-width="1.2" stroke-linecap="round"/></svg>`},
      {id: "tp-redwoods-grove", name: "Grove Washi", kind: "tape", desc: "Red-brown washi tape with tall trunks, sorrel hearts and slanting sunbeams.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#8A4A34" opacity=".92"/>
          ${[16, 40, 64].map(x => `<path d="M${x} 1.5L${x + 8} 1.5L${x + 16} 24.5L${x + 10} 24.5Z" fill="#FFE3A0" opacity=".28"/>`).join("")}
          ${[10, 30, 52, 74].map(x => `<path d="M${x} 2V24" stroke="#5A2818" stroke-width="3"/><path d="M${x - 1} 2V24" stroke="#B86A44" stroke-width="1"/>`).join("")}
          ${[[20, 18], [42, 8], [62, 18]].map(([x, y]) => [0, 1, 2].map(k => { const a = k * 2.094 - 1.57; return `<circle cx="${(x + Math.cos(a) * 2.2).toFixed(1)}" cy="${(y + Math.sin(a) * 2.2).toFixed(1)}" r="1.8" fill="#8ACF6A"/>`; }).join("")).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".25"/></svg>`}
    ],
    card: {id: "tp-redwoods", name: "Sunbeam Grove", desc: "Warm foggy cream paper with a tall redwood and slanting sunbeams in the corner and sorrel below. Blue moonlit fog in dark mode."}
  });
})();
