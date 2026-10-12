/* Theme Collections, new theme ideas batch n7: canyon, saltflats */
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
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const petals = (cx, cy, r, n, pr, c, rot = 0, sw = S15) => Array.from({length: n}, (_, i) => { const a = rot + i * 2 * Math.PI / n, x = f1(cx + r * Math.cos(a)), y = f1(cy + r * Math.sin(a)); return `<ellipse cx="${x}" cy="${y}" rx="${pr}" ry="${f1(pr * .7)}" transform="rotate(${Math.round(a * 180 / Math.PI)} ${x} ${y})" fill="${c}" ${sw}/>`; }).join("");
  const hexP = (cx, cy, r, sy = 1) => Array.from({length: 6}, (_, i) => { const a = i * Math.PI / 3; return (i ? "L" : "M") + f1(cx + r * Math.cos(a)) + " " + f1(cy + r * Math.sin(a) * sy); }).join("") + "z";
  const puffP = (cx, cy, r, n, bump = 1.15) => { const p = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }; const br = r * Math.sin(Math.PI / n) * bump; let d = `M${f1(p(0)[0])} ${f1(p(0)[1])}`; for (let i = 1; i <= n; i++) { const q = p(i); d += `A${f1(br)} ${f1(br)} 0 0 1 ${f1(q[0])} ${f1(q[1])}`; } return d + "Z"; };

  /* ================= SLOT CANYON ================= */
  // a slice of canyon: two striped walls framing a strip of sky (used by two stickers)
  const walls = (id, sky1, sky2, w1, w2, w3) => `${lg(id, sky1, sky2)}<rect x="6" y="6" width="52" height="52" rx="12" fill="url(#${id})" ${SO}/>
    <path d="M7.5 18C7.5 10 10 7.5 18 7.5H27C22 16 30 26 24 36C19 44 26 52 22 56.5H18C10 56.5 7.5 54 7.5 46Z" fill="${w1}"/>
    <path d="M18 7.5H22C18 16 25 26 19 36C15 44 21 52 18 56.5C10 56.5 7.5 54 7.5 46V18C7.5 10 10 7.5 18 7.5Z" fill="${w2}"/>
    <path d="M56.5 18C56.5 10 54 7.5 46 7.5H37C42 16 34 28 40 38C44 46 38 52 42 56.5H46C54 56.5 56.5 54 56.5 46Z" fill="${w1}"/>
    <path d="M46 7.5H42C46 16 39 28 45 38C49 46 43 52 46 56.5C54 56.5 56.5 54 56.5 46V18C56.5 10 54 7.5 46 7.5Z" fill="${w2}"/>
    <path d="M27 7.5C22 16 30 26 24 36C19 44 26 52 22 56.5M37 7.5C42 16 34 28 40 38C44 46 38 52 42 56.5" fill="none" stroke="${w3}" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="6" y="6" width="52" height="52" rx="12" fill="none" ${SO}/>`;
  TP_DATA.push({
    theme: "canyon",
    pack: {name: "Canyon Glow", items: {
      canyon_rusty: `${rg("n7-cr-b", "#FFC890", "#C25A3E", .38, .3)}
        <ellipse cx="22" cy="56" rx="7" ry="3.6" fill="#B8563A" ${S2}/><ellipse cx="42" cy="56" rx="7" ry="3.6" fill="#B8563A" ${S2}/>
        <path d="M8 36C7 22 18 14 32 14C47 14 57 22 56 36C55 50 45 55 32 55C18 55 9 50 8 36Z" fill="url(#n7-cr-b)" ${SO}/>
        <path d="M11 27Q22 22 33 25T53 25" fill="none" stroke="#FFE2B8" stroke-width="3.4" stroke-linecap="round" opacity=".85"/><path d="M10 42Q22 37 33 40T54 40" fill="none" stroke="#A23E3A" stroke-width="3" stroke-linecap="round" opacity=".45"/><path d="M16 49Q28 45 38 48T49 47" fill="none" stroke="#FFE2B8" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
        ${EYES(25, 39, 33, 2.6)}${blush(19.5, 44.5, 37.5)}${smile(32, 38, 2.4, 1.9)}${SHINE(18, 20, 4, 2.2, -30)}
        <path d="M32 14.5V8" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>${petals(32, 6, 3, 5, 2.6, "#FF8A3A", -Math.PI / 2)}<circle cx="32" cy="6" r="1.8" fill="#FFD84A"/>`,
      canyon_pinto: `${rg("n7-cp-b", "#B8EC9A", "#3E8A4E", .38, .3)}
        <path d="M6 58Q8 50 20 50H44Q56 50 58 58Z" fill="#F2C48E" ${SO}/>
        <ellipse cx="11" cy="35" rx="5" ry="8" transform="rotate(-22 11 35)" fill="#6CB45C" ${S2}/><ellipse cx="53" cy="35" rx="5" ry="8" transform="rotate(22 53 35)" fill="#6CB45C" ${S2}/>
        <path d="M14 38C14 24 22 16 32 16C42 16 50 24 50 38C50 49 43 55 32 55C21 55 14 49 14 38Z" fill="url(#n7-cp-b)" ${SO}/>
        <path d="M23 18Q19 36 23 54M41 18Q45 36 41 54M32 16V55" fill="none" stroke="#3E7E44" stroke-width="1.4" opacity=".55"/>
        <g fill="#FFF8E8">${[[21, 26], [20, 44], [43, 26], [44, 44], [27, 51], [37, 51]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9"/>`).join("")}</g>
        ${EYES(26, 38, 35, 2.5)}${blush(21, 43, 39.5)}${smile(32, 40, 2.2, 1.8)}
        ${petals(32, 12, 4.2, 6, 3.4, "#FF7AA8")}<circle cx="32" cy="12" r="2.6" fill="#FFD84A" ${SOw(1.3)}/>`,
      canyon_tumble: `${rg("n7-ct-b", "#FFF0CC", "#C8985A", .4, .32)}
        <path d="${puffP(32, 34, 22, 16, 1.06)}" fill="url(#n7-ct-b)" ${SO}/>
        <g fill="none" stroke="#9A6A3A" stroke-width="1.5" stroke-linecap="round" opacity=".8"><path d="M14 26Q22 15 34 14"/><path d="M44 16Q55 22 54 34"/><path d="M12 42Q16 52 28 55"/><path d="M42 55Q52 50 54 42"/><path d="M18 18Q11 28 12 36"/><path d="M20 15L24 20M48 22L45 26M14 44L19 43"/></g>
        ${EYES(25, 39, 33, 2.5)}${blush(19.5, 44.5, 38)}${smile(32, 38, 2.3, 1.8)}
        <path d="M3 22h7M2 30h5M4 38h6" stroke="#E8B878" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
      canyon_beam: `${walls("n7-cb-s", "#9CCBEA", "#FFE6B8", "#A84A44", "#7A3046", "#FFC27E")}
        <path d="M30 7.5H36L40 50H22Z" fill="#FFF6DC" opacity=".55"/><path d="M31.5 7.5H34.5L35 50H27Z" fill="#FFFFFF" opacity=".55"/>
        <ellipse cx="31" cy="51" rx="10" ry="2.6" fill="#FFF6DC" opacity=".8"/>
        ${spark(29, 22, 1.8, "#fff")}${spark(35, 34, 1.4, "#fff")}${spark(30, 42, 1.2, "#fff")}`,
      canyon_night: `${walls("n7-cn-s", "#0E1436", "#2A2252", "#3A2A5E", "#24193E", "#9AABEC")}
        <path d="M30 6C27 20 36 34 33 56" fill="none" stroke="#B8B0FF" stroke-width="6" opacity=".25" stroke-linecap="round"/>
        ${spark(31, 15, 2.2, "#fff")}${spark(34, 27, 1.6, "#fff")}${spark(29, 37, 1.4, "#FFE9A8")}<circle cx="35" cy="18" r=".8" fill="#fff"/><circle cx="28" cy="25" r=".7" fill="#fff"/><circle cx="33" cy="44" r=".7" fill="#fff"/><circle cx="30" cy="31" r=".6" fill="#fff"/>`,
      canyon_primrose: `<path d="M32 60V40" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 60V40" stroke="#6E9A4A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M32 52C25 46 17 48 15 52C20 56 27 56 32 52Z" fill="#8FC06A" ${S2}/><path d="M32 50C39 44 47 46 49 50C44 54 37 54 32 50Z" fill="#8FC06A" ${S2}/>
        ${petals(32, 26, 10, 4, 10, "#FFF4B0", Math.PI / 4, SO)}<circle cx="32" cy="26" r="6.6" fill="#FFD24A" ${S2}/>
        ${EYES(29, 35, 25.6, 1.6)}${smile(32, 28.4, 1.6, 1.4)}${spark(54, 12, 4, "#FFC85A")}${spark(10, 14, 2.6, "#FFC85A")}`,
      canyon_hourglass: `${lg("n7-ch-g", "#FFFFFF", "#E2ECF4", 1, 0)}
        <rect x="14" y="5" width="36" height="6" rx="2.5" fill="#B8563A" ${SO}/><rect x="14" y="53" width="36" height="6" rx="2.5" fill="#B8563A" ${SO}/>
        <path d="M19 11H45C45 22 36 27 34 32C36 37 45 42 45 53H19C19 42 28 37 30 32C28 27 19 22 19 11Z" fill="url(#n7-ch-g)" ${SO}/>
        <path d="M23 16H41C40 22 34 25 32 29C30 25 24 22 23 16Z" fill="#F2A060"/><path d="M22 52C23 45 28 42 32 41C36 42 41 45 42 52Z" fill="#E88A52"/><path d="M22.6 49Q32 45 41.4 49M24 44.5Q32 41 40 44.5" fill="none" stroke="#FFE2B8" stroke-width="1.4"/>
        <path d="M32 31V41" stroke="#F2A060" stroke-width="1.4" stroke-dasharray="1.6 1.8"/>
        ${EYES(28, 36, 20, 1.5)}${smile(32, 22.4, 1.4, 1.2)}<path d="M23 14V24" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
      canyon_flow: `${lg("n7-cf-b", "#E88A52", "#B8503A")}
        <path d="M4 22Q4 16 10 16H54Q60 16 60 22V42Q60 48 54 48H10Q4 48 4 42Z" fill="url(#n7-cf-b)" ${SO}/>
        <path d="M7 20.5Q20 18 34 20.5T57 20M7 44Q20 41.5 34 44T57 43.5" fill="none" stroke="#FFD2A0" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
        ${T("GO WITH", 32, 31, 8.5, "#FFF6E8", 34)}${T("THE FLOW", 32, 41, 8.5, "#FFF6E8", 38)}
        ${spark(56, 10, 4, "#FFC85A")}${spark(8, 54, 3, "#FFC85A")}`
    }},
    pins: [
      {id: "tp-canyon-primrose", name: "Primrose Pin", kind: "badge", desc: "A pale desert primrose, open in a sunbeam.",
        svg: `<svg viewBox="0 0 30 30">${[45, 135, 225, 315].map(a => { const t = a * Math.PI / 180, x = f1(15 + 6 * Math.cos(t)), y = f1(15 + 6 * Math.sin(t)); return `<circle cx="${x}" cy="${y}" r="6.4" fill="#FFF4B0" stroke="#8A5A2A" stroke-width="1.2"/>`; }).join("")}<circle cx="15" cy="15" r="4" fill="#FFC23A" stroke="#8A5A2A" stroke-width="1.1"/><circle cx="13.8" cy="13.8" r="1.2" fill="#fff"/></svg>`},
      {id: "tp-canyon-strata", name: "Strata Washi", kind: "tape", desc: "Flowing sandstone stripes in rose, rust and gold.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#B8503A" opacity=".95"/>
          <path d="M4 8Q24 3 44 8T82 7M4 14Q24 10 44 14T82 13M4 20Q24 16 44 20T82 19" fill="none" stroke="#FFC890" stroke-width="2.2" opacity=".85"/><path d="M4 11Q24 7 44 11T82 10M4 17Q24 13 44 17T82 16" fill="none" stroke="#7A3046" stroke-width="1.4" opacity=".55"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-canyon", name: "Sandstone Glow", desc: "Warm apricot paper with flowing sandstone stripes and a sunbeam in the corner, and a primrose below. Starry violet slot in dark mode."}
  });

  /* ================= MIRROR FLATS ================= */
  TP_DATA.push({
    theme: "saltflats",
    pack: {name: "Mirror Sky Club", items: {
      salt_salty: `${lg("n7-ss-f", "#FFFFFF", "#E8E0F4")}
        <rect x="19" y="52" width="9" height="7" rx="2.5" fill="#E2D8F0" ${S2}/><rect x="36" y="52" width="9" height="7" rx="2.5" fill="#E2D8F0" ${S2}/>
        <path d="M46 20L54 12V44L46 54Z" fill="#D2C4EA" ${SO}/><path d="M14 20L22 12H54L46 20Z" fill="#FFFFFF" ${SO}/>
        <rect x="14" y="20" width="32" height="34" rx="3" fill="url(#n7-ss-f)" ${SO}/>
        ${EYES(24, 36, 35, 2.6)}${blush(19.5, 40.5, 40)}${smile(30, 40.5, 2.2, 1.8)}<path d="M18 25h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${spark(58, 8, 4, "#F6B8D0")}${spark(8, 12, 3, "#B8A0E8")}`,
      salt_mira: `${lg("n7-sm-b", "#F0FAFF", "#6EAEE6")}
        <ellipse cx="32" cy="58" rx="22" ry="3.4" fill="#C8DEF6" ${S2}/>
        <path d="M32 6C36 14 50 25 50 39C50 50 42 55 32 55C22 55 14 50 14 39C14 25 28 14 32 6Z" fill="url(#n7-sm-b)" ${SO}/>
        <path d="M16 43Q32 50 48 43Q46 52 32 53Q18 52 16 43Z" fill="#F6B8CE" opacity=".6"/>
        ${EYES(26, 38, 35, 2.6)}${blush(21, 43, 40)}${smile(32, 41, 2.2, 1.8)}${SHINE(23, 24, 2.6, 5, 25)}${spark(52, 10, 3.6, "#fff")}<path d="M52 6.4Q52 10 55.6 10Q52 10 52 13.6Q52 10 48.4 10Q52 10 52 6.4Z" fill="none" stroke="${O}" stroke-width="1"/>`,
      salt_blush: `${rg("n7-sb-b", "#FFF4F6", "#F2A2BC", .42, .32)}
        <circle cx="46" cy="18" r="9" fill="#FFD27A" ${S2}/><path d="M46 4v-2M57 9l2-2M60 18h2" stroke="#FFB43A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="${puffP(30, 36, 20, 9, 1.16)}" fill="url(#n7-sb-b)" ${SO}/>
        ${EYES(24, 36, 36, 2.5)}${blush(19, 41, 40.5)}${smile(30, 41, 2.2, 1.8)}<path d="M15 28Q19 22 25 21" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
      salt_mirror: `${lg("n7-sr-s", "#A9BCE4", "#FFE2C2")}${lg("n7-sr-w", "#FFE2C2", "#9AA8D8")}
        <circle cx="32" cy="32" r="26" fill="url(#n7-sr-s)"/><path d="M6 32A26 26 0 0 0 58 32Z" fill="url(#n7-sr-w)"/>
        <circle cx="38" cy="26" r="5.6" fill="#FFF6E2"/><circle cx="38" cy="38" r="5.6" fill="#FFEBD2" opacity=".85"/>
        <path d="M12 30Q16 24 22 27Q26 22 30 27H12Z" fill="#fff" opacity=".9"/><path d="M12 34Q16 40 22 37Q26 42 30 37H12Z" fill="#fff" opacity=".55"/>
        <path d="M8 32H56" stroke="#fff" stroke-width="1.6"/><path d="M14 44h8M36 48h10" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <circle cx="32" cy="32" r="26" fill="none" ${SO}/>`,
      salt_hex: `<path d="${hexP(32, 34, 26)}" fill="#FFFAF4" ${SO}/><path d="${hexP(32, 34, 19)}" fill="#EEE2E6" ${S15}/>
        <path d="M15 34L22.5 21H41.5L49 34" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${EYES(26, 38, 33, 2.6)}${blush(21, 43, 38)}${smile(32, 38, 2.2, 1.8)}${spark(55, 10, 3.6, "#F6B8D0")}${spark(9, 56, 2.6, "#B8A0E8")}`,
      salt_cone: `${lg("n7-sc-w", "#F2C2D0", "#A9BCE4")}
        <path d="M2 40H62V58Q62 62 58 62H6Q2 62 2 58Z" fill="url(#n7-sc-w)" ${S2}/>
        <path d="M8 40C11 29 20 20 32 20C44 20 53 29 56 40Z" fill="#FFF6EE" ${SO}/><path d="M32 20C24 22 18 30 17 40H8C11 29 20 20 32 20Z" fill="#E8D2E2"/>
        <path d="M10 42C13 50 22 56 32 56C42 56 51 50 54 42Z" fill="#F6E4EC" opacity=".55"/>
        ${EYES(27, 39, 31, 2.4)}${blush(22, 44, 35)}${smile(33, 35, 2, 1.6)}${spark(55, 12, 3.6, "#FFD8A8")}`,
      salt_reflect: `${T("REFLECT", 32, 30, 12, "#7650B0", 50)}<g transform="translate(0 64) scale(1 -1)" opacity=".38">${T("REFLECT", 32, 30, 12, "#C0628E", 50)}</g>
        <path d="M6 33.5H58" stroke="#9A78CC" stroke-width="1.6" stroke-linecap="round"/>${spark(57, 14, 3.6, "#F6B8D0")}${spark(7, 50, 2.6, "#B8A0E8")}`,
      salt_meteor: `<rect x="4" y="4" width="56" height="56" rx="14" fill="#141A44" ${SO}/><path d="M5.5 32H58.5" stroke="#8A88C0" stroke-width="1.2"/>
        <path d="M44 10L22 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M44 54L22 40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>
        ${spark(22, 24, 3.6, "#FFFFFF")}${spark(22, 40, 3, "#D8D0FF")}<circle cx="14" cy="12" r="1" fill="#fff"/><circle cx="14" cy="52" r=".9" fill="#fff" opacity=".6"/><circle cx="50" cy="22" r=".8" fill="#fff"/><circle cx="50" cy="42" r=".7" fill="#fff" opacity=".6"/>`
    }},
    pins: [
      {id: "tp-saltflats-hex", name: "Salt Hex Pin", kind: "badge", desc: "A tile of white salt crust with a little sparkle.",
        svg: `<svg viewBox="0 0 30 30"><path d="${hexP(15, 15, 12.5)}" fill="#FFFAF4" stroke="#6A5A8A" stroke-width="1.3"/><path d="${hexP(15, 15, 8.5)}" fill="#EEE2EC" stroke="#B8A8CC" stroke-width="1"/>${spark(19, 11, 2.4, "#F6B8D0")}</svg>`},
      {id: "tp-saltflats-sky", name: "Mirror Sky Washi", kind: "tape", desc: "Pastel sunset washi with clouds above and their reflections below.",
        svg: `<svg viewBox="0 0 86 26"><defs><linearGradient id="n7-pt-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9BCE4"/><stop offset=".5" stop-color="#FFE2C2"/><stop offset="1" stop-color="#A9BCE4"/></linearGradient></defs><path d="${tapeEdge}" fill="url(#n7-pt-s)" opacity=".95"/>
          ${[14, 40, 66].map(x => `<path d="M${x - 7} 12Q${x - 6} 8 ${x - 2} 9Q${x} 5 ${x + 4} 8Q${x + 8} 8 ${x + 8} 12Z" fill="#fff"/><path d="M${x - 7} 14Q${x - 6} 18 ${x - 2} 17Q${x} 21 ${x + 4} 18Q${x + 8} 18 ${x + 8} 14Z" fill="#fff" opacity=".5"/>`).join("")}
          <path d="M4 13H82" stroke="#fff" stroke-width=".8" opacity=".8"/></svg>`}
    ],
    card: {id: "tp-saltflats", name: "Mirror Sky", desc: "Pastel sunset paper that mirrors itself, with a cloud and its reflection in the corner and salt hexagons below. Starry violet in dark mode."}
  });
})();
