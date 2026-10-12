/* Theme Collections, new theme ideas batch n8: redwoods */
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
