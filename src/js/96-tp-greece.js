/* ===== module: 96-tp-greece.js ===== */
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
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // a bougainvillea bract cluster
  const bract = (x, y, r, c = "#E0378C", rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})">${[-90, 30, 150].map(a => { const q = a * Math.PI / 180; return `<ellipse cx="${f1(Math.cos(q) * r * .55)}" cy="${f1(Math.sin(q) * r * .55)}" rx="${f1(r * .62)}" ry="${f1(r * .45)}" transform="rotate(${a} ${f1(Math.cos(q) * r * .55)} ${f1(Math.sin(q) * r * .55)})" fill="${c}"/>`; }).join("")}<circle r="${f1(r * .2)}" fill="#FFF2C8"/></g>`;
  const oleaf = (x, y, len, w, ang, fill, extra = "") => `<path d="M0 0Q${f1(len * .45)} ${-w} ${len} 0Q${f1(len * .45)} ${w} 0 0Z" transform="translate(${x} ${y}) rotate(${ang})" fill="${fill}" ${extra}/>`;
  // the Greek key (meander) border, one unit every 10 across
  const meander = (x0, x1, y, c, w = 1.2) => { let d = ""; for (let x = x0; x + 10 <= x1; x += 10) d += `M${x} ${y + 6}V${y}H${x + 8}V${y + 6}H${x + 3}V${y + 3}H${x + 5.5}`; return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="miter"/>`; };

  /* ================= SANTORINI ================= */
  TP_DATA.push({
    theme: "greece",
    pack: {name: "Caldera Keepsakes", items: {
      greece_chapel: `${lg("gr-tp-dm", "#4F8AD8", "#1E4C93")}
        <path d="M14 40H50V60H14Z" fill="#FFFFFF" ${SO}/>
        <path d="M18 40C18 26 24 18 32 18C40 18 46 26 46 40Z" fill="url(#gr-tp-dm)" ${SO}/>
        <path d="M15 40H49" stroke="${O}" stroke-width="2.5"/><path d="M32 18V8M28 11.4H36" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M22 30Q24 24 29 21" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <path d="M27 60V53Q27 49 32 49Q37 49 37 53V60Z" fill="#2F6DB8" ${S2}/>
        ${blush(21.5, 42.5, 49.6, 2.4, 1.5)}<circle cx="24" cy="46" r="2.2" fill="${O}"/><circle cx="40" cy="46" r="2.2" fill="${O}"/><circle cx="24.8" cy="45.2" r=".8" fill="#fff"/><circle cx="40.8" cy="45.2" r=".8" fill="#fff"/>
        ${spark(55, 12, 4, "#FFD86B")}${spark(8, 20, 3, "#8EC9F0")}`,
      greece_windmill: `${lg("gr-tp-wm", "#FFFFFF", "#DCE6F2")}
        <path d="M22 61L24.6 30H39.4L42 61Z" fill="url(#gr-tp-wm)" ${SO}/>
        <path d="M21 31Q32 16 43 31Z" fill="#C8963E" ${SO}/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<g transform="rotate(${i * 60 + 15} 32 26)"><path d="M32 26V4" stroke="${O}" stroke-width="1.6"/>${i % 2 ? "" : `<path d="M32.6 7L40 9L32.6 22Z" fill="#FFFBF0" ${SOw(1.4)}/>`}</g>`).join("")}
        <circle cx="32" cy="26" r="3" fill="#8A6A3A" ${SOw(1.6)}/>
        <path d="M29 61V54Q29 51 32 51Q35 51 35 54V61Z" fill="#2F6DB8" ${SOw(1.6)}/><rect x="30" y="38" width="4" height="5" rx="1" fill="#2F6DB8"/>
        ${spark(52, 50, 3.4, "#FFD86B")}`,
      greece_kiki: `${rg("gr-tp-ct", "#FFFFFF", "#F2E4D4", .4, .35)}
        <path d="M12 28L13 6L28 18Z" fill="#FFFDF8" ${SO}/><path d="M15.6 21.6L16 12L22.4 18Z" fill="#FFB6C6"/>
        <path d="M52 28L51 6L36 18Z" fill="#EFA460" ${SO}/><path d="M48.4 21.6L48 12L41.6 18Z" fill="#FFB6C6"/>
        <path d="M32 14C48 14 57 24 57 37C57 51 46 59 32 59C18 59 7 51 7 37C7 24 16 14 32 14Z" fill="url(#gr-tp-ct)" ${SO}/>
        <path d="M37 15.4C47 16.6 55 24 56.4 33C49 31 42 25 39 20Z" fill="#EFA460"/>
        <path d="M28 17.6l.8 5M32 17v5.6M36 18l-.4 4.4" stroke="#E29A55" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="23" cy="36" r="4.2" fill="#3C6A2C" ${SOw(1.5)}/><circle cx="41" cy="36" r="4.2" fill="#3C6A2C" ${SOw(1.5)}/><circle cx="24.2" cy="34.6" r="1.4" fill="#fff"/><circle cx="42.2" cy="34.6" r="1.4" fill="#fff"/>
        <path d="M30 42.6H34L32 44.8Z" fill="#FF94AC"/><path d="M29 46.6q1.5 1.6 3 0q1.5 1.6 3 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${blush(16.5, 47.5, 44, 2.6, 1.6)}<path d="M14 43l-8 -1.6M14 46l-8 1M50 43l8 -1.6M50 46l8 1" stroke="${O}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`,
      greece_bloom: `${bract(22, 24, 18, "#E0378C", 10)}${bract(42, 22, 15, "#F05AA6", -20)}${bract(32, 42, 17, "#D22A7E", 40)}
        <path d="M12 54Q24 48 30 52M40 58Q48 50 56 52" fill="none" stroke="#5E8A3A" stroke-width="3" stroke-linecap="round"/>
        ${oleaf(10, 54, 12, 4, -20, "#4F9A5A", SOw(1.4))}${oleaf(56, 52, 11, 4, 200, "#4F9A5A", SOw(1.4))}
        <circle cx="26" cy="41" r="1.6" fill="${O}"/><circle cx="38" cy="41" r="1.6" fill="${O}"/>${smile(32, 44.6, 1.8, 1.4)}
        ${spark(54, 10, 3.4, "#FFD86B")}`,
      greece_door: `${lg("gr-tp-dr", "#4A86D2", "#22549E")}
        <rect x="8" y="6" width="48" height="54" rx="4" fill="#FFFFFF" ${SO}/>
        <path d="M18 60V30Q18 18 32 18Q46 18 46 30V60Z" fill="url(#gr-tp-dr)" ${SO}/>
        <path d="M32 19V60M20 40H44" stroke="#1E4C93" stroke-width="1.6"/><circle cx="38" cy="45" r="1.6" fill="#F2C24A"/>
        ${bract(12, 10, 11)}${bract(24, 8, 9, "#F05AA6", 30)}${bract(52, 12, 10, "#D22A7E", -10)}${bract(9, 22, 8, "#E0378C", 60)}
        ${oleaf(16, 14, 9, 3, 60, "#4F9A5A")}${oleaf(46, 14, 9, 3, 140, "#4F9A5A")}
        <path d="M6 60H58" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>`,
      greece_elia: `${rg("gr-tp-ol", "#C6DE8A", "#5E8A34", .4, .32)}
        <path d="M32 20C46 20 53 32 53 44C53 56 44 62 32 62C20 62 11 56 11 44C11 32 18 20 32 20Z" fill="url(#gr-tp-ol)" ${SO}/>
        <path d="M32 21Q31 13 34 6" fill="none" stroke="#7A5A3A" stroke-width="2.6" stroke-linecap="round"/>
        ${oleaf(33, 13, 17, 4.4, -155, "#A9C08E", SOw(1.6))}${oleaf(34, 10, 18, 4.6, -30, "#8FAE72", SOw(1.6))}
        <path d="M18 36Q20 29 25 26" fill="none" stroke="#F2FAD8" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
        ${EYES(25, 39, 42, 2.4)}${blush(20, 44, 47)}${smile(32, 46.4, 2.2)}
        ${spark(56, 24, 3.4, "#E8F2B0")}`,
      greece_glafka: `${rg("gr-tp-ow", "#C8A078", "#7E5838", .42, .32)}
        <path d="M32 6C48 6 56 16 56 30C56 48 46 60 32 60C18 60 8 48 8 30C8 16 16 6 32 6Z" fill="url(#gr-tp-ow)" ${SO}/>
        <path d="M32 34C40 34 44 42 44 50C44 56 38 59 32 59C26 59 20 56 20 50C20 42 24 34 32 34Z" fill="#F4E6CC"/>
        <circle cx="22" cy="24" r="7.4" fill="#EEDCBC"/><circle cx="42" cy="24" r="7.4" fill="#EEDCBC"/>
        <circle cx="22" cy="24" r="5.2" fill="#F6C93A" ${SOw(1.4)}/><circle cx="42" cy="24" r="5.2" fill="#F6C93A" ${SOw(1.4)}/><circle cx="22" cy="24" r="2.6" fill="${O}"/><circle cx="42" cy="24" r="2.6" fill="${O}"/><circle cx="23" cy="23" r=".9" fill="#fff"/><circle cx="43" cy="23" r=".9" fill="#fff"/>
        <path d="M30 29Q32 28 34 29L32 33Z" fill="#D8C49A" ${SOw(1.2)}/>
        <path d="M14 15Q21 11 28 13M50 15Q43 11 36 13" fill="none" stroke="#FFFBF2" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M27 41v3M32 40v3M37 41v3M29 48v3M35 48v3" stroke="#B08A60" stroke-width="1.6" stroke-linecap="round"/>
        ${spark(57, 50, 3.4, "#FFE27A")}`,
      greece_badge: `${lg("gr-tp-bd", "#2F6DB8", "#173F7A")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#gr-tp-bd)" ${SO}/>
        ${meander(9, 56, 41, "#FFFFFF", 1.1)}
        <circle cx="51" cy="20" r="8" fill="#FFD86B" ${S2}/>
        ${T("OPA!", 28, 35, 15, "#FFFFFF", 34)}
        ${spark(8, 9, 3.4, "#FFD86B")}${spark(58, 56, 3, "#8EC9F0")}`
    }},
    pins: [
      {id: "tp-greece-dome", name: "Blue Dome Pin", kind: "badge", desc: "A glossy blue chapel dome on a whitewashed drum.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="gr-tpp-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A94DE"/><stop offset="1" stop-color="#1D4C93"/></linearGradient></defs>
          <circle cx="15" cy="15" r="13" fill="#FFFFFF" stroke="#1E3A66" stroke-width="1.1"/>
          <path d="M6.6 19C6.6 11.4 10.2 7.6 15 7.6C19.8 7.6 23.4 11.4 23.4 19Z" fill="url(#gr-tpp-d)" stroke="#1E3A66" stroke-width="1"/>
          <path d="M5.6 19H24.4V22.6H5.6Z" fill="#F4F7FB" stroke="#1E3A66" stroke-width="1"/><path d="M9 22.6V20.4M13 22.6V20.4M17 22.6V20.4M21 22.6V20.4" stroke="#2F6DB8" stroke-width="1"/>
          <path d="M15 7.6V3.6M13.4 5H16.6" stroke="#1E3A66" stroke-width="1" stroke-linecap="round"/>
          <ellipse cx="11" cy="12" rx="2" ry="1.1" fill="#fff" opacity=".6" transform="rotate(-40 11 12)"/></svg>`},
      {id: "tp-greece-meander", name: "Aegean Key Washi", kind: "tape", desc: "Deep Aegean blue washi with a white Greek key border and a sprig of bougainvillea.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2462B0" opacity=".9"/>
          ${meander(8, 66, 4, "#FFFFFF", 1)}${meander(8, 66, 16, "#FFFFFF", 1)}
          ${bract(74, 9, 7, "#E0378C", 10)}${bract(72, 18, 6, "#F05AA6", 50)}</svg>`}
    ],
    card: {id: "tp-greece", name: "Caldera View", desc: "Crisp white paper with a blue-domed chapel and a windmill in the corner and Aegean waves along the bottom. Deep night blue in dark mode."}
  });
})();
/* end of module 96-tp-greece.js */


