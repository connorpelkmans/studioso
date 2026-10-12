/* Theme Collections, new theme ideas batch n15: fjord, storm */
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
  const leafP = (x, y, L, w, a) => `<path d="M0 0Q${L * .45} ${-w} ${L} 0Q${L * .45} ${w} 0 0z" transform="translate(${x} ${y}) rotate(${a})"`;
  const bell = (x, y, s, id) => `${rg(id, "#C8D0FF", "#5E6CD0", .4, .3)}<path d="M${x - 1.2 * s} ${y}C${x - 8 * s} ${y + 1 * s} ${x - 11 * s} ${y + 8 * s} ${x - 11 * s} ${y + 15 * s}C${x - 11 * s} ${y + 19 * s} ${x - 12.6 * s} ${y + 21 * s} ${x - 14 * s} ${y + 23 * s}C${x - 10 * s} ${y + 24 * s} ${x - 7 * s} ${y + 22.6 * s} ${x - 5 * s} ${y + 24 * s}C${x - 2 * s} ${y + 22.6 * s} ${x + 2 * s} ${y + 22.6 * s} ${x + 5 * s} ${y + 24 * s}C${x + 7 * s} ${y + 22.6 * s} ${x + 10 * s} ${y + 24 * s} ${x + 14 * s} ${y + 23 * s}C${x + 12.6 * s} ${y + 21 * s} ${x + 11 * s} ${y + 19 * s} ${x + 11 * s} ${y + 15 * s}C${x + 11 * s} ${y + 8 * s} ${x + 8 * s} ${y + 1 * s} ${x + 1.2 * s} ${y}Z" fill="url(#${id})" ${S2}/>`;
  const ear = (x, y, L, a) => { const r = a * Math.PI / 180, dx = Math.sin(r), dy = -Math.cos(r); let d = ""; for (let i = 0; i < 5; i++) { const u = i / 5, sd = i % 2 ? 1 : -1, px = x + dx * L * u, py = y + dy * L * u; d += `<ellipse cx="${(px - dy * sd * L * .07).toFixed(1)}" cy="${(py + dx * sd * L * .07).toFixed(1)}" rx="${(L * .11).toFixed(1)}" ry="${(L * .075).toFixed(1)}" transform="rotate(${(a + sd * 35 - 90).toFixed(0)} ${(px - dy * sd * L * .07).toFixed(1)} ${(py + dx * sd * L * .07).toFixed(1)})" fill="#F0C25A" ${SOw(1.1)}/>`; } return d; };

  /* ================= FJORD ================= */
  TP_DATA.push({
    theme: "fjord",
    pack: {name: "Fjord Explorers", items: {
      fjord_cabin: `${lg("n15-fc-g", "#8CC860", "#4E8A36")}<path d="M4 58C8 46 18 40 32 40C46 40 56 46 60 58Z" fill="url(#n15-fc-g)" ${SO}/>
        <rect x="17" y="28" width="30" height="18" fill="#C8402E" ${S2}/><path d="M12 29L32 15L52 29Z" fill="#6E9E46" ${S2}/><path d="M14 28.4L32 16.6L50 28.4" fill="none" stroke="#9ACE6A" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="21" y="32" width="8" height="7" fill="#F6F3EA" ${SOw(1.4)}/><rect x="35" y="33" width="7" height="13" fill="#3A2A26" ${SOw(1.4)}/><rect x="40" y="13" width="4" height="8" fill="#5A4A44" ${SOw(1.4)}/>
        <path d="M43 10q3-3 1-6M45 9q3-3 2-6" fill="none" stroke="#C8D4DE" stroke-width="1.6" stroke-linecap="round"/>${spark(54, 14, 3.4, "#FFD86B")}`,
      fjord_falls: `${lg("n15-ff-r", "#9AA6B0", "#5E6A76")}<path d="M6 60V14C6 9 10 6 16 6H48C54 6 58 9 58 14V60Z" fill="url(#n15-ff-r)" ${SO}/>
        <path d="M6 14C12 9 18 12 24 9C30 6 36 10 42 8C48 6 54 9 58 14" fill="#7CB858" ${S15}/>
        <path d="M27 9C25 22 29 36 26 52H38C35 36 39 22 37 9Z" fill="#F4FAFC" ${S15}/><path d="M30 14v8M33 24v10M30 36v8" stroke="#BFE2F2" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="32" cy="54" rx="16" ry="4.6" fill="#8ACCE6" ${S15}/><path d="M20 54q4 2 8 0M36 54q4 2 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>${spark(48, 30, 3, "#fff")}`,
      fjord_seal: `${rg("n15-fs-h", "#DCE2E8", "#8A94A0", .38, .28)}<circle cx="32" cy="32" r="22" fill="url(#n15-fs-h)" ${SO}/>
        <ellipse cx="32" cy="40" rx="9.6" ry="6.6" fill="#EEF2F5" ${S15}/><path d="M29 37C29 35.4 35 35.4 35 37C35 38.8 33.2 39.8 32 39.8C30.8 39.8 29 38.8 29 37Z" fill="#3A3038"/>
        <ellipse cx="24" cy="29" rx="4.2" ry="4.8" fill="#1E1A24"/><ellipse cx="40" cy="29" rx="4.2" ry="4.8" fill="#1E1A24"/><circle cx="25.4" cy="27.4" r="1.6" fill="#fff"/><circle cx="41.4" cy="27.4" r="1.6" fill="#fff"/>
        ${smile(32, 42, 1.8, 1.5)}${blush(19, 45, 37, 2.4, 1.5)}<path d="M23 40l-9-2M23 42l-9 1M41 40l9-2M41 42l9 1" stroke="#5A5560" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>${SHINE(22, 18, 4, 2, -35)}`,
      fjord_lemming: `<path d="M8 60C10 52 18 49 26 50C30 46 38 46 42 50C50 49 56 53 58 60Z" fill="#7CB858" ${S2}/>
        <ellipse cx="18" cy="20" rx="6" ry="5.6" fill="#C8944C" ${S2}/><ellipse cx="46" cy="20" rx="6" ry="5.6" fill="#C8944C" ${S2}/><ellipse cx="18.4" cy="20.4" rx="3.2" ry="2.8" fill="#F2B2AE"/><ellipse cx="45.6" cy="20.4" rx="3.2" ry="2.8" fill="#F2B2AE"/>
        ${rg("n15-fl-h", "#ECC07A", "#A8743C", .4, .45)}<path d="M10 38C10 24 20 15 32 15C44 15 54 24 54 38C54 50 44 57 32 57C20 57 10 50 10 38Z" fill="url(#n15-fl-h)" ${SO}/>
        <path d="M12 31C14 21 22 16 32 16C42 16 50 21 52 31C48 27 42 27 38 29C36 27 34 27 32 28C30 27 28 27 26 29C22 27 16 27 12 31Z" fill="#3A2E2A"/>
        <ellipse cx="32" cy="46" rx="9" ry="6.4" fill="#F8E6C2" ${S15}/><path d="M29.6 43C29.6 41.6 34.4 41.6 34.4 43C34.4 44.4 33 45.4 32 45.4C31 45.4 29.6 44.4 29.6 43Z" fill="#E87A8A"/>
        ${EYES(23, 41, 37, 2.6)}${blush(18, 46, 43, 2.2, 1.4)}${smile(32, 48, 1.6, 1.4)}<path d="M23 45l-9-1.4M23 47l-9 1.6M41 45l9-1.4M41 47l9 1.6" stroke="#6A5450" stroke-width="1" stroke-linecap="round" opacity=".7"/>`,
      fjord_bell: `<path d="M38 60C40 46 46 30 44 18C43 12 38 8 32 8" fill="none" stroke="${O}" stroke-width="5.4" stroke-linecap="round"/><path d="M38 60C40 46 46 30 44 18C43 12 38 8 32 8" fill="none" stroke="#7CBC58" stroke-width="2.8" stroke-linecap="round"/>
        ${leafP(39, 52, 14, 3.6, -150)} fill="#7CBC58" ${S15}/>${leafP(41, 46, 13, 3.4, -25)} fill="#7CBC58" ${S15}/>
        ${bell(31, 10, 1.25, "n15-fb-b")}<path d="M17.5 39C19 35.6 24 34.4 31 34.4C38 34.4 43 35.6 44.5 39" fill="#4A56B8"/>
        ${EYES(26, 36, 24, 1.8)}${blush(22.4, 39.6, 28, 1.8, 1.1)}${smile(31, 28.4, 1.6, 1.4)}${SHINE(23, 18, 2, 3.6, 15)}`,
      fjord_peak: `${lg("n15-fp-s", "#93BAD8", "#EEF1E8")}<rect x="4" y="4" width="56" height="30" rx="10" fill="url(#n15-fp-s)" ${SO}/>
        <path d="M6 34L20 14L30 26L40 10L58 34Z" fill="#8AA6C0" ${S2}/><path d="M36 15.6L40 10L45 17L42 16L40 19L38 16Z" fill="#fff"/><path d="M17 18L20 14L24 19L21 18L19 20Z" fill="#fff"/>
        ${lg("n15-fp-w", "#9DBCD2", "#3F6A84")}<rect x="4" y="34" width="56" height="26" rx="10" fill="url(#n15-fp-w)" ${SO}/><path d="M8 34L20 50L30 40L40 56L56 34Z" fill="#6E8AA6" opacity=".55"/>
        <path d="M12 44h10M34 48h14M18 54h8" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>${spark(52, 12, 3, "#fff")}`,
      fjord_leaf: `${lg("n15-fl-l", "#B4E070", "#5E9A3A", 1, 1)}<path d="M32 6C46 14 54 28 50 42C46 54 36 58 32 58C28 58 18 54 14 42C10 28 18 14 32 6Z" fill="url(#n15-fl-l)" ${SO}/>
        <path d="M32 10V56M32 24L22 18M32 24L42 18M32 34L20 28M32 34L44 28M32 44L22 40M32 44L42 40" fill="none" stroke="#4E8A30" stroke-width="1.6" stroke-linecap="round"/>
        ${spark(54, 12, 3.6, "#FFD86B")}${spark(10, 50, 2.6, "#9AD8F0")}`,
      fjord_label: `${lg("n15-fx-b", "#24485A", "#16303E")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n15-fx-b)" ${SO}/>
        ${T("STILL WATERS", 32, 36.4, 8.6, "#F0F6F8", 47)}<path d="M10 41.5h10M24 41.5h16M44 41.5h10" stroke="#8ACCE6" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M8 22L14 17L18 21L22 18" fill="none" stroke="#B8CED6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>${spark(55, 22, 3, "#FFE3A8")}`
    }},
    pins: [
      {id: "tp-fjord-cabin", name: "Cabin Pin", kind: "badge", desc: "A tiny red cabin with a grass roof, perched on a green ledge.",
        svg: `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#9DCBE6" stroke="#24485A" stroke-width="1.3"/><path d="M3.4 20C6 16 10 15 15 15C20 15 24 16 26.6 20A13 13 0 0 1 3.4 20Z" fill="#6E9E46"/><rect x="9" y="11.4" width="12" height="7" fill="#C8402E" stroke="#24485A" stroke-width="1"/><path d="M7 11.8L15 6L23 11.8Z" fill="#7CB050" stroke="#24485A" stroke-width="1" stroke-linejoin="round"/><rect x="11" y="13.4" width="3" height="2.6" fill="#F6F3EA"/><rect x="16.4" y="14" width="2.6" height="4.4" fill="#3A2A26"/></svg>`},
      {id: "tp-fjord-washi", name: "Fjord Washi", kind: "tape", desc: "Deep fjord-blue washi tape with granite peaks, ribbon falls and harebells.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#3E6A84" opacity=".94"/><path d="M6 20L16 8L24 16L34 6L46 20L56 9L66 17L76 7L82 14V24H6Z" fill="#6E8AA6"/><path d="M33 7.4L34 6L35.6 8.6ZM15 9.4L16 8L17.4 10ZM75 8.4L76 7L77.6 9.6Z" fill="#fff"/><path d="M30 10V22M58 11V22" stroke="#F4FAFC" stroke-width="1.6" stroke-linecap="round"/>
          ${[[12, 20], [44, 21], [70, 20]].map(([x, y]) => `<path d="M${x - 2.4} ${y + 2}Q${x - 2.4} ${y - 3} ${x} ${y - 3}Q${x + 2.4} ${y - 3} ${x + 2.4} ${y + 2}Z" fill="#A8B4F4"/>`).join("")}<path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".25"/></svg>`}
    ],
    card: {id: "tp-fjord", name: "Fjord Cabin", desc: "Cool granite-white paper with a red cabin on its ledge, a ribbon waterfall and harebells. Pale summer-twilight blue with a lit window in dark mode."}
  });

  /* ================= STORM PRAIRIE ================= */
  TP_DATA.push({
    theme: "storm",
    pack: {name: "Prairie Storm Chasers", items: {
      storm_cloud: `${lg("n15-sc-b", "#B8C2D4", "#6A7690")}<path d="M10 42C4 42 4 32 11 31C10 22 20 18 25 24C27 14 41 13 43 23C49 20 57 25 54 33C60 34 60 42 54 42Z" fill="url(#n15-sc-b)" ${SO}/>
        <path d="M13 30C14 25 18 22 23 22" fill="none" stroke="#FFE2A0" stroke-width="2.6" stroke-linecap="round"/><path d="M33 42L28 50H32L30 58L38 47H34L36 42Z" fill="#FFD24A" ${SOw(1.6)}/>
        ${EYES(26, 38, 33, 2)}${blush(22, 42, 37, 2, 1.3)}${smile(32, 37, 2, 1.6)}`,
      storm_fawn: `<path d="M22 28C14 22 10 12 11 5C19 8 24 16 26 24ZM42 28C50 22 54 12 53 5C45 8 40 16 38 24Z" fill="#D8995A" ${S2}/><path d="M21 24C17 20 15 15 15 11C19 14 21 18 23 22ZM43 24C47 20 49 15 49 11C45 14 43 18 41 22Z" fill="#F6C8B4"/>
        ${rg("n15-sf-h", "#F4C68C", "#BA7C42", .4, .3)}<path d="M16 36C16 24 23 17 32 17C41 17 48 24 48 36C48 49 41 58 32 58C23 58 16 49 16 36Z" fill="url(#n15-sf-h)" ${SO}/>
        <path d="M18 44C20 51 25 57 32 58C39 57 44 51 46 44C42 48 37 50 32 50C27 50 22 48 18 44Z" fill="#fff"/><path d="M27 20C27 16 29 14 30 14M37 20C37 16 35 14 34 14" fill="none" stroke="#3A2A22" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="32" cy="47" rx="8" ry="6" fill="#F8EEE4" ${S15}/><path d="M28.6 44.6C28.6 43 35.4 43 35.4 44.6C35.4 46.4 33.6 47.6 32 47.6C30.4 47.6 28.6 46.4 28.6 44.6Z" fill="#2A1E1E"/>
        ${EYES(25, 39, 35, 2.4)}${blush(20.6, 43.4, 41, 2.2, 1.4)}${smile(32, 50, 1.6, 1.4)}`,
      storm_owl: `<path d="M8 60C10 52 20 49 32 49C44 49 54 52 56 60Z" fill="#C8A26A" ${S2}/>
        <path d="M27 50V58M37 50V58" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M27 50V58M37 50V58" stroke="#E8D8B8" stroke-width="2.2" stroke-linecap="round"/>
        ${rg("n15-so-h", "#CCA272", "#88643E", .4, .3)}<ellipse cx="32" cy="40" rx="14" ry="12" fill="url(#n15-so-h)" ${S2}/><circle cx="32" cy="24" r="16" fill="url(#n15-so-h)" ${SO}/>
        <path d="M18 22C21 18 27 18 31 21M46 22C43 18 37 18 33 21" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="25.4" cy="26" r="5.4" fill="#F6D04A" ${S15}/><circle cx="38.6" cy="26" r="5.4" fill="#F6D04A" ${S15}/><circle cx="25.4" cy="26" r="2.6" fill="${O}"/><circle cx="38.6" cy="26" r="2.6" fill="${O}"/><circle cx="26.4" cy="25" r=".9" fill="#fff"/><circle cx="39.6" cy="25" r=".9" fill="#fff"/>
        <path d="M30 31H34L32 35Z" fill="#D8C27E" ${SOw(1.1)}/><g fill="#F2E6CE"><circle cx="24" cy="13" r="1.2"/><circle cx="32" cy="11" r="1.2"/><circle cx="40" cy="13" r="1.2"/></g>`,
      storm_wheat: `<path d="M24 60L30 32M32 60V30M40 60L34 32" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M24 60L30 32M32 60V30M40 60L34 32" stroke="#D8A440" stroke-width="2" stroke-linecap="round"/>
        ${ear(29, 34, 22, -14)}${ear(32, 32, 24, 0)}${ear(35, 34, 22, 14)}<path d="M24 48Q32 52 40 48L40 52Q32 56 24 52Z" fill="#4C78DA" ${S15}/>${spark(52, 12, 3.6, "#FFD86B")}`,
      storm_bolt: `${rg("n15-st-g", "#FFF6C8", "#FFC23A", .5, .5)}<path d="M37 4L16 34H29L22 60L48 26H35L41 4Z" fill="url(#n15-st-g)" ${SO}/>
        ${EYES(28, 36, 31, 1.8)}${smile(32, 35.6, 1.6, 1.4)}${blush(24.6, 39.4, 34.6, 1.6, 1)}${spark(52, 46, 3.4, "#FFE08A")}${spark(12, 14, 2.8, "#B8CCFF")}`,
      storm_rainbow: `${["#FF6A5A", "#FFB04A", "#FFE46A", "#7ED67A", "#6A9AF0", "#9A78E0"].map((c, i) => `<path d="M${8 + i * 3.2} 46A${24 - i * 3.2} ${24 - i * 3.2} 0 0 1 ${56 - i * 3.2} 46" fill="none" stroke="${c}" stroke-width="3.4"/>`).join("")}
        <path d="M6.3 46A25.7 25.7 0 0 1 57.7 46M23.3 46A8.7 8.7 0 0 1 40.7 46" fill="none" stroke="${O}" stroke-width="2"/>
        <path d="M2 50C2 44 8 42 12 45C14 40 22 41 22 47C26 47 26 52 22 52H5C2 52 2 50 2 50ZM62 50C62 44 56 42 52 45C50 40 42 41 42 47C38 47 38 52 42 52H59C62 52 62 50 62 50Z" fill="#fff" ${S15}/>`,
      storm_tree: `<path d="M4 58C10 52 20 50 32 50C44 50 54 52 60 58Z" fill="#D8A646" ${S2}/><path d="M30 52V36H34V52Z" fill="#6A4A34" ${S15}/>
        ${[[24, 30, 9], [32, 22, 11], [41, 29, 9], [33, 34, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4E6A3A" ${S2}/>`).join("")}${[[28, 19, 5], [21, 27, 4], [37, 25, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7E9A4E"/>`).join("")}
        <path d="M10 46L14 40M50 44L52 38M44 48L46 43" stroke="#C0903A" stroke-width="1.8" stroke-linecap="round"/>`,
      storm_label: `${lg("n15-sx-b", "#46607E", "#2E3A4E")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n15-sx-b)" ${SO}/>
        ${T("RIDE THE STORM", 32, 36.4, 8.2, "#FFE2A0", 48)}<path d="M10 41.5q4-2.4 8 0t8 0t8 0t8 0t8 0" fill="none" stroke="#E2B24C" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M53 18L49 24H52L50 29L55 22H52Z" fill="#FFD24A"/>${spark(9, 22, 2.6, "#B8CCFF")}`
    }},
    pins: [
      {id: "tp-storm-wheat", name: "Wheat Pin", kind: "badge", desc: "A golden ear of wheat on a storm-blue sky.",
        svg: `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#5A6E8C" stroke="#2E3A4E" stroke-width="1.3"/><path d="M5 21Q15 17 25 21A13 13 0 0 1 5 21Z" fill="#E2B24C"/><path d="M15 26V9" stroke="#C0903A" stroke-width="1.4" stroke-linecap="round"/>${[0, 1, 2, 3].map(i => `<ellipse cx="${13.4}" cy="${18 - i * 3}" rx="2" ry="1.3" fill="#F4D27C" transform="rotate(-35 13.4 ${18 - i * 3})"/><ellipse cx="${16.6}" cy="${16.6 - i * 3}" rx="2" ry="1.3" fill="#E8B84A" transform="rotate(35 16.6 ${16.6 - i * 3})"/>`).join("")}<ellipse cx="15" cy="6.6" rx="1.2" ry="1.8" fill="#F4D27C"/></svg>`},
      {id: "tp-storm-washi", name: "Prairie Washi", kind: "tape", desc: "Golden wheat-field washi tape under a stormy blue sky with a flash of lightning.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#4A5E7A" opacity=".94"/><path d="M4 16Q20 13 43 15T82 15V24H4Z" fill="#E2B24C"/>${[10, 18, 26, 34, 42, 50, 58, 66, 74].map((x, i) => `<path d="M${x} 24V${17 - (i % 2) * 2}" stroke="#C0903A" stroke-width="1"/><ellipse cx="${x}" cy="${16 - (i % 2) * 2}" rx="1.2" ry="2.4" fill="#F4D27C"/>`).join("")}<path d="M60 3L55 10H58L56 15L62 8H59Z" fill="#FFD24A"/><path d="M8 7C10 4 14 4 16 6C18 3 24 4 24 7C26 7 26 10 24 10H9C7 10 7 8 8 7Z" fill="#B8C2D4"/><path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".25"/></svg>`}
    ],
    card: {id: "tp-storm", name: "Storm Wheat", desc: "Warm wheat-gold paper with a sunlit thundercloud and ears of wheat along the edge. Deep prairie blue with silver wheat and a flash of lightning in dark mode."}
  });
})();
