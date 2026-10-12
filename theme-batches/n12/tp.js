/* Theme Collections, new theme ideas batch n12: wisteria, bluebells */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FB8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FB8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const leafP = (x, y, L, w, a) => `<path d="M0 0Q${L * .45} ${-w} ${L} 0Q${L * .45} ${w} 0 0z" transform="translate(${x} ${y}) rotate(${a})"`;
  // a hanging wisteria raceme: rows of florets from (x,y) down, length L, width w; pale at the top, deep at the tip
  const raceme = (x, y, L, w, white, sw = 1) => { let d = ""; const rows = Math.max(5, Math.round(L / (w * .3))); for (let i = rows - 1; i >= 0; i--) { const t = i / (rows - 1), cy = y + t * L, r = w * .3 * (1 - .65 * t) + .5, sp = w * .32 * (1 - .8 * t), c = white ? (t < .75 ? "#FFFFFF" : "#C8D8A8") : (t < .38 ? "#D2C2F2" : t < .72 ? "#A486D8" : "#7A56BA"); (t < .78 ? [-1, 1] : [0]).forEach(s => { d += `<ellipse cx="${f1(x + s * sp + (i % 2 ? .6 : -.6))}" cy="${f1(cy)}" rx="${f1(r)}" ry="${f1(r * .8)}" fill="${c}" stroke="${O}" stroke-width="${sw}"/>`; }); } return d; };
  // a nodding bluebell bell hanging from (x,y), scale s
  const bell = (x, y, s, c = "#6A64D6") => `<path d="M${f1(x - 3.4 * s)} ${y}C${f1(x - 4 * s)} ${f1(y + 4 * s)} ${f1(x - 4.4 * s)} ${f1(y + 7 * s)} ${f1(x - 6.4 * s)} ${f1(y + 9 * s)}C${f1(x - 3 * s)} ${f1(y + 10 * s)} ${f1(x - 1.4 * s)} ${f1(y + 9 * s)} ${x} ${f1(y + 10 * s)}C${f1(x + 1.4 * s)} ${f1(y + 9 * s)} ${f1(x + 3 * s)} ${f1(y + 10 * s)} ${f1(x + 6.4 * s)} ${f1(y + 9 * s)}C${f1(x + 4.4 * s)} ${f1(y + 7 * s)} ${f1(x + 4 * s)} ${f1(y + 4 * s)} ${f1(x + 3.4 * s)} ${y}C${f1(x + 2 * s)} ${f1(y - 1.4 * s)} ${f1(x - 2 * s)} ${f1(y - 1.4 * s)} ${f1(x - 3.4 * s)} ${y}z" fill="${c}" ${SOw(1.3)}/>`;
  const stem = (x0, y0, x1, y1, c = "#4E8A44") => `<path d="M${x0} ${y0}Q${x0} ${f1((y0 + y1) / 2 - 6)} ${x1} ${y1}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  const beechLeaf = (x, y, L, a, c) => `<path d="M0 0C${L * .3} ${-L * .3} ${L * .75} ${-L * .26} ${L} 0C${L * .75} ${L * .26} ${L * .3} ${L * .3} 0 0z" transform="translate(${x} ${y}) rotate(${a})" fill="${c}" ${S15}/><path d="M${L * .1} 0H${L * .88}" transform="translate(${x} ${y}) rotate(${a})" stroke="#4E8A34" stroke-width="1" opacity=".7"/>`;

  /* ================= WISTERIA WALK ================= */
  TP_DATA.push({
    theme: "wisteria",
    pack: {name: "Wisteria Garden Club", items: {
      wisteria_raceme: `${lg("n12-wr-b", "#F6F0FF", "#A88ADA")}<path d="M32 9C33 6 36 4 40 4" fill="none" stroke="#6C9A52" stroke-width="2.4" stroke-linecap="round"/>${leafP(32, 9, 12, 3.6, -150)} fill="#8CC060" ${S15}/>${leafP(33, 8, 12, 3.6, -20)} fill="#9CCC6A" ${S15}/>
        <path d="M32 10C47 10 52 22 49 33C46 44 38 52 32 60C26 52 18 44 15 33C12 22 17 10 32 10Z" fill="url(#n12-wr-b)" ${SO}/>
        ${[[17, 30, 3.6, "#D2C2F2"], [18, 38, 3.4, "#BCA4EA"], [22, 45, 3.2, "#A88ADA"], [26, 51, 2.8, "#9472CA"], [29, 56, 2.4, "#7E5CBE"]].map(([x, y, r, c]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * .82)}" fill="${c}" ${S15}/><ellipse cx="${64 - x}" cy="${y}" rx="${r}" ry="${f1(r * .82)}" fill="${c}" ${S15}/>`).join("")}<ellipse cx="32" cy="60" rx="2" ry="1.6" fill="#6A48AE" ${S15}/>
        ${EYES(27, 37, 28, 1.8)}${blush(23.6, 40.4, 32, 1.8, 1.1)}${smile(32, 32.6, 1.8, 1.5)}${SHINE(23, 18, 3, 1.6, -40)}${spark(54, 12, 3.4, "#FFD86B")}`,
      wisteria_bridge: `${lg("n12-wb-w", "#CFE2F2", "#9EBEDC")}<path d="M3 44C3 38 14 36 32 36C50 36 61 38 61 44C61 52 50 56 32 56C14 56 3 52 3 44Z" fill="url(#n12-wb-w)" ${SO}/>
        <path d="M12 46Q32 56 52 46" fill="none" stroke="#7A9ABE" stroke-width="2.2" stroke-linecap="round" opacity=".7"/><path d="M20 50h8M36 52h8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M6 42C14 26 50 26 58 42L54 43C47 32 17 32 10 43Z" fill="#C25A44" ${S2}/><path d="M9 33C17 20 47 20 55 33" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M9 33C17 20 47 20 55 33" fill="none" stroke="#D86A50" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M14 37V27M22 32V22.6M32 30.4V20.6M42 32V22.6M50 37V27" stroke="${O}" stroke-width="1.6"/>${raceme(8, 4, 16, 8, false, .8)}${raceme(56, 4, 14, 7, true, .8)}${raceme(48, 3, 9, 6, false, .8)}`,
      wisteria_meji: `${rg("n12-wm-b", "#DCE892", "#88A43C", .45, .3)}<path d="M6 58C20 54 44 54 58 58" stroke="${O}" stroke-width="5.4" stroke-linecap="round"/><path d="M6 58C20 54 44 54 58 58" stroke="#8A6A52" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="32" cy="44" rx="15" ry="12" fill="url(#n12-wm-b)" ${SO}/><ellipse cx="32" cy="47" rx="9" ry="7.4" fill="#F6F2DE"/>
        <circle cx="32" cy="27" r="13" fill="url(#n12-wm-b)" ${SO}/><path d="M24 34Q32 40 40 34Q38 39 32 40Q26 39 24 34Z" fill="#F2DC5A"/>
        <circle cx="27" cy="26" r="4.2" fill="#fff" ${SOw(1.2)}/><circle cx="37" cy="26" r="4.2" fill="#fff" ${SOw(1.2)}/>${EYES(27, 37, 26, 1.8)}<path d="M30 30.6L32 34L34 30.6Z" fill="#5C5A6A" ${SOw(1)}/>${blush(21.6, 42.4, 31, 1.6, 1)}
        <path d="M30 14C29 10 31 7 34 6C33 9 34 11 36 12.6Z" fill="#A4C050" ${S15}/>${raceme(52, 6, 14, 7, false, .8)}`,
      wisteria_kero: `<path d="M4 52C4 46 16 43 32 43C48 43 60 46 60 52C60 57 48 60 32 60C16 60 4 57 4 52Z" fill="#6AAE5A" ${SO}/><path d="M32 52L56 50M32 52L10 50" stroke="#4E8A3E" stroke-width="1.2"/>
        ${rg("n12-wk-b", "#BEE480", "#5EA03E", .45, .3)}<ellipse cx="32" cy="45" rx="15" ry="9" fill="url(#n12-wk-b)" ${SO}/>
        <circle cx="24" cy="22" r="6.6" fill="url(#n12-wk-b)" ${SO}/><circle cx="40" cy="22" r="6.6" fill="url(#n12-wk-b)" ${SO}/><path d="M14 33C14 25 21 22 32 22C43 22 50 25 50 33C50 40 43 44 32 44C21 44 14 40 14 33Z" fill="url(#n12-wk-b)" ${SO}/>
        <circle cx="24" cy="22" r="4.4" fill="#fff"/><circle cx="40" cy="22" r="4.4" fill="#fff"/>${EYES(24, 40, 22.4, 2.2)}<path d="M25 34q7 5 14 0" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>${blush(19.6, 44.4, 32, 1.8, 1.1)}
        ${raceme(32, 14, 6, 5, false, .7)}${spark(56, 14, 3.6, "#C8B4EC")}`,
      wisteria_tunnel: `${lg("n12-wt-s", "#CFE2F2", "#F6EEF0")}<path d="M4 60V28C4 12 16 4 32 4C48 4 60 12 60 28V60Z" fill="#3E5E3A" ${SO}/><path d="M17 60V36C17 26 23 20 32 20C41 20 47 26 47 36V60Z" fill="url(#n12-wt-s)"/>
        <path d="M17 60L26 40H38L47 60Z" fill="#B8B4A8"/><path d="M17 60L26 40H38L47 60Z" fill="#86AE6A"/>${[[30, 43, 2.6, 1.2], [35, 46, 3, 1.3], [28, 48, 3.4, 1.4], [36, 51, 3.6, 1.5], [26, 54, 4, 1.7], [38, 56, 4.4, 1.8], [31, 58, 4, 1.4]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#C8C4B8" stroke="#8A8A7A" stroke-width=".6"/>`).join("")}<path d="M24 34C28 30 36 30 40 34" fill="none" stroke="#C25A44" stroke-width="2"/>
        ${raceme(10, 8, 22, 8, false, .7)}${raceme(19, 6, 14, 7, true, .7)}${raceme(28, 5, 10, 6, false, .7)}${raceme(37, 5, 11, 6, false, .7)}${raceme(46, 6, 14, 7, true, .7)}${raceme(54, 8, 22, 8, false, .7)}
        <path d="M4 60V28C4 12 16 4 32 4C48 4 60 12 60 28V60" fill="none" stroke="${O}" stroke-width="2.5"/>`,
      wisteria_moon: `${lg("n12-wn-s", "#1C1440", "#45367A")}<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#n12-wn-s)" ${SO}/>
        <circle cx="40" cy="22" r="8" fill="#F4F0FF"/><circle cx="40" cy="22" r="12" fill="#F4F0FF" opacity=".15"/>${spark(18, 30, 2, "#fff")}<circle cx="50" cy="36" r=".9" fill="#fff"/><circle cx="26" cy="40" r=".9" fill="#fff"/>
        <path d="M6 46Q32 42 58 46V48Q58 58 48 58H16Q6 58 6 48Z" fill="#2A2458"/><path d="M34 49h12M36 53h8" stroke="#E8E2FA" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        ${raceme(12, 5, 20, 8, false, .7)}${raceme(22, 5, 12, 6, true, .7)}${raceme(54, 5, 16, 7, false, .7)}`,
      wisteria_floret: `${rg("n12-wf-p", "#FBF8FF", "#B8A0E6", .45, .35)}
        <path d="M18 52C10 50 8 40 14 36C19 33 24 37 26 42C27 47 24 53 18 52Z" fill="#8A66C6" ${S2}/><path d="M46 52C54 50 56 40 50 36C45 33 40 37 38 42C37 47 40 53 46 52Z" fill="#8A66C6" ${S2}/>
        <path d="M24 50C24 44 28 40 32 40C36 40 40 44 40 50C40 56 36 60 32 60C28 60 24 56 24 50Z" fill="#6A48AE" ${S2}/>
        <path d="M32 44C22 48 8 40 9 26C10 12 24 6 32 14C40 6 54 12 55 26C56 40 42 48 32 44Z" fill="url(#n12-wf-p)" ${SO}/>
        <path d="M27 40C28 36 36 36 37 40C35 42 29 42 27 40Z" fill="#F2DC5A"/>
        ${EYES(25, 39, 26, 2)}${blush(20.4, 43.6, 31, 1.8, 1.1)}${smile(32, 30.4, 1.8, 1.5)}${SHINE(18, 18, 3.4, 1.8, -40)}${spark(56, 8, 3.4, "#FFD86B")}${spark(8, 50, 2.6, "#C8B4EC")}`,
      wisteria_label: `${lg("n12-wx-b", "#FFFFFF", "#EEE6F6")}<rect x="4" y="19" width="56" height="28" rx="12" fill="url(#n12-wx-b)" ${SO}/>
        ${T("IN FULL BLOOM", 32, 37.4, 8.6, "#6A48AE", 46)}<path d="M12 41.6h40" stroke="#A486D8" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.4"/>
        ${raceme(10, 6, 14, 7, false, .8)}${raceme(54, 6, 14, 7, true, .8)}`
    }},
    pins: [
      {id: "tp-wisteria-bloom", name: "Wisteria Pin", kind: "badge", desc: "A drooping lavender wisteria raceme with a sprig of fresh leaves.",
        svg: `<svg viewBox="0 0 30 30"><path d="M15 4Q16 2 19 2" fill="none" stroke="#6C9A52" stroke-width="1.6" stroke-linecap="round"/><path d="M15 4C10 1 7 2 6 4C9 6 12 6 15 4Z" fill="#8CC060" stroke="#3E5E2A" stroke-width=".9"/>${raceme(15, 6, 21, 11, false, .8)}</svg>`},
      {id: "tp-wisteria-washi", name: "Wisteria Washi", kind: "tape", desc: "Pale lilac washi tape hung with lavender and white wisteria blossoms.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#E4D8F4" opacity=".95"/><path d="M5 4H81" stroke="#7CAE5A" stroke-width="1.6"/>
          ${[10, 22, 34, 46, 58, 70].map((x, i) => raceme(x + 2, 4, i % 2 ? 12 : 16, 6, i % 3 === 1, .6)).join("")}</svg>`}
    ],
    card: {id: "tp-wisteria", name: "Wisteria Walk", desc: "Soft lilac paper with wisteria hanging from the top corner and a little red bridge below. Deep violet with moonlit blooms in dark mode."}
  });

  /* ================= BLUEBELL WOOD ================= */
  TP_DATA.push({
    theme: "bluebells",
    pack: {name: "Bluebell Wood Ramblers", items: {
      bluebells_bell: `${stem(40, 60, 34, 10)}<path d="M40 60C36 50 32 44 24 42C30 48 34 54 36 60Z" fill="#5EA04A" ${S15}/><path d="M40 60C44 52 50 48 56 48C50 52 46 56 44 60Z" fill="#5EA04A" ${S15}/>
        ${lg("n12-bb-h", "#A0A0F2", "#4E48BE")}<path d="M26 14C24 22 22 32 18 40C15 42 13 43 12 45C16 46 19 44 21 45C24 47 27 45 30 46C33 47 35 45 38 46C41 45 43 46 46 45C44 42 41 41 39 39C36 31 34 22 32 14C30 10 28 10 26 14Z" fill="url(#n12-bb-h)" ${SO}/>
        ${EYES(24.4, 32.6, 28, 1.6)}${blush(21.6, 35.4, 32, 1.4, .9)}${smile(28.5, 32, 1.4, 1.3)}${SHINE(25, 18, 1.4, 3, 12)}${bell(48, 18, 1.1, "#7470D8")}${bell(53, 30, .9, "#8A84E2")}${stem(34, 10, 47, 17)}`,
      bluebells_badger: `<path d="M12 60C10 48 18 40 32 39C46 40 54 48 52 60Z" fill="#B0ACB6" ${SO}/><path d="M25 46C28 43 36 43 39 46C40 52 38 58 32 60C26 58 24 52 25 46Z" fill="#4A4448"/>
        <circle cx="16" cy="14" r="4.4" fill="#3E383C" ${S15}/><circle cx="48" cy="14" r="4.4" fill="#3E383C" ${S15}/>
        <path d="M13 26C13 16 21 11 32 11C43 11 51 16 51 26C51 36 43 41 32 41C21 41 13 36 13 26Z" fill="#F6F4F2"/><path d="M24 12C26 19 28 28 29 35C26 36 24 35 23 33C21 27 21 18 24 12Z" fill="#2E2A2E"/><path d="M40 12C38 19 36 28 35 35C38 36 40 35 41 33C43 27 43 18 40 12Z" fill="#2E2A2E"/>
        <path d="M13 26C13 16 21 11 32 11C43 11 51 16 51 26C51 36 43 41 32 41C21 41 13 36 13 26Z" fill="none" ${SO}/>
        <circle cx="26" cy="26" r="2.6" fill="#5E585E"/><circle cx="38" cy="26" r="2.6" fill="#5E585E"/>${EYES(26, 38, 26, 1.7)}<ellipse cx="32" cy="33" rx="2.6" ry="1.8" fill="${O}"/>${blush(20, 44, 32, 1.6, 1)}${bell(56, 44, .9)}`,
      bluebells_fawn: `<path d="M23 46V60M41 46V60M28 48V61M36 48V61" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M23 46V59M41 46V59M28 48V60M36 48V60" stroke="#B8743E" stroke-width="2.6" stroke-linecap="round"/>
        ${rg("n12-bf-b", "#ECAE72", "#A2602F", .45, .3)}<ellipse cx="32" cy="45" rx="14" ry="8.6" fill="url(#n12-bf-b)" ${SO}/>${[[22, 44], [42, 43], [24, 49], [40, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#FBF2E4"/>`).join("")}
        <path d="M21 20C15 15 9 16 6 20C10 24 16 24 21 22Z" fill="#C8814A" ${S15}/><path d="M43 20C49 15 55 16 58 20C54 24 48 24 43 22Z" fill="#C8814A" ${S15}/>
        <path d="M19 25C19 17 25 13 32 13C39 13 45 17 45 25C45 32 40 37 32 38C24 37 19 32 19 25Z" fill="url(#n12-bf-b)" ${SO}/><ellipse cx="32" cy="32" rx="6" ry="4.6" fill="#F4E6D0"/><ellipse cx="32" cy="30" rx="2.2" ry="1.6" fill="${O}"/>
        ${EYES(27, 37, 24.4, 2)}${blush(23, 41, 29, 1.6, 1)}${SHINE(25, 17, 2.4, 1.2, -35)}${spark(54, 8, 3, "#FFE89A")}`,
      bluebells_leaf: `${beechLeaf(8, 50, 50, -40, "#A8D85A")}<path d="M12 46l6 -2M18 41l7 -1M24 35l7 0M29 30l6 1M34 25l6 2" stroke="#6CA83C" stroke-width="1.1" stroke-linecap="round" transform="rotate(0)"/>
        ${EYES(28, 38, 32, 1.8)}${blush(24, 42, 36, 1.6, 1)}${smile(33, 36.4, 1.6, 1.4)}<path d="M8 50L4 56" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>${spark(54, 50, 3.4, "#FFE89A")}${spark(14, 14, 2.6, "#C8E87A")}`,
      bluebells_beech: `<path d="M6 60C10 52 22 50 32 50C42 50 54 52 58 60Z" fill="#6A72D0" ${SO}/>${[[12, 56], [20, 54], [44, 54], [52, 56], [28, 57], [38, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#A6A8F0"/>`).join("")}
        ${lg("n12-bt-t", "#C8CECC", "#8E9698", 1, 0)}<path d="M27 52C29 44 29.5 32 28 22H36C34.5 32 35 44 37 52C34 53 30 53 27 52Z" fill="url(#n12-bt-t)" ${S2}/><path d="M31 26L22 17M33 25L42 16" stroke="#9EA4A6" stroke-width="3" stroke-linecap="round"/>
        ${[[18, 16, 9, "#86BC4E"], [32, 9, 11, "#9CCC5A"], [46, 15, 9, "#86BC4E"], [25, 22, 8, "#A8D85A"], [40, 22, 8, "#A8D85A"]].map(([x, y, r, c]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.3}" ry="${r * .62}" fill="${c}" ${S15}/>`).join("")}${spark(56, 34, 3, "#FFE89A")}`,
      bluebells_path: `${lg("n12-bp-s", "#EEF5D8", "#CAC6E8")}<circle cx="32" cy="32" r="27" fill="url(#n12-bp-s)" ${SO}/>
        <path d="M5.4 37C14 33 50 33 58.6 37A27 27 0 0 1 5.4 37Z" fill="#7078D2"/><path d="M27 59C29 52 34 46 33 40C32 37 34 35 36 34.6C37 37 36 40 37 44C38 50 40 54 42 57.4C37 59.4 32 59.8 27 59Z" fill="#A4825E"/>
        <path d="M18 36V14M46 36V12M26 35V20" stroke="#B4BAB8" stroke-width="3" stroke-linecap="round"/><path d="M10 16C16 10 24 12 28 16C34 8 46 10 50 16C56 14 58 20 56 22H8C6 20 8 16 10 16Z" fill="#A8D85A"/>
        ${[[12, 46], [18, 50], [48, 47], [52, 43], [22, 42], [44, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#4E4CC0"/>`).join("")}<circle cx="32" cy="32" r="27" fill="none" ${SO}/>`,
      bluebells_bouquet: `<path d="M24 60L29 40H35L40 60Z" fill="#5EA04A" ${S2}/><path d="M26 44Q32 48 38 44L39 50Q32 54 25 50Z" fill="#F6E8C8" ${S2}/>
        ${stem(30, 40, 18, 12)}${stem(32, 40, 30, 6)}${stem(34, 40, 46, 10)}${[[18, 12, .9], [20, 20, .8], [30, 7, 1], [28, 16, .85], [46, 10, .95], [44, 19, .8], [24, 27, .7], [40, 27, .7]].map(([x, y, s], i) => bell(x, y, s, i % 2 ? "#7470D8" : "#5A56C8")).join("")}
        ${beechLeaf(28, 42, 14, -150, "#A8D85A")}${beechLeaf(36, 42, 14, -30, "#A8D85A")}${spark(55, 50, 3, "#FFE89A")}`,
      bluebells_label: `${lg("n12-bx-b", "#FFFFFF", "#E6EAF6")}<rect x="4" y="19" width="56" height="28" rx="12" fill="url(#n12-bx-b)" ${SO}/>
        ${T("RING IN SPRING", 32, 37.4, 8.4, "#4E48BE", 46)}<path d="M12 41.6h40" stroke="#86C04A" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.4"/>
        ${stem(10, 22, 6, 8)}${bell(6, 9, .9)}${stem(54, 22, 58, 8)}${bell(58, 9, .9, "#7470D8")}`
    }},
    pins: [
      {id: "tp-bluebells-bell", name: "Bluebell Pin", kind: "badge", desc: "A nodding sprig of bluebells with curled-back petal tips.",
        svg: `<svg viewBox="0 0 30 30"><path d="M12 28Q12 10 20 4" fill="none" stroke="#4E8A44" stroke-width="1.6" stroke-linecap="round"/>${[[19, 6, .65], [16, 10, .75], [13.6, 15, .8], [12.6, 20.4, .7]].map(([x, y, s], i) => bell(x + 2, y, s, i % 2 ? "#7470D8" : "#5A56C8")).join("")}<path d="M12 28C10 24 7 22 4 22C6 25 9 27 12 28Z" fill="#5EA04A" stroke="#2E5A2A" stroke-width=".9"/></svg>`},
      {id: "tp-bluebells-washi", name: "Beech Leaf Washi", kind: "tape", desc: "Fresh lime washi tape scattered with spring beech leaves and bluebells.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#CDE8A0" opacity=".95"/>
          ${[[10, 18, -30], [34, 20, -20], [58, 18, -35]].map(([x, y, a]) => `<path d="M0 0C3 -3 8 -3 11 0C8 3 3 3 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="#86BC4E"/>`).join("")}
          ${[[24, 6], [48, 7], [72, 6]].map(([x, y]) => bell(x, y, .75)).join("")}<path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-bluebells", name: "Bluebell Wood", desc: "Fresh spring paper with a beech sprig in the corner and nodding bluebells along the bottom. Blue-hour navy with misty bells in dark mode."}
  });
})();
