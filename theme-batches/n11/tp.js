/* Theme Collections, new theme ideas batch n11: glowbay */
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

  /* ================= GLOWING BAY ================= */
  TP_DATA.push({
    theme: "glowbay",
    pack: {name: "Glow Tide Crew", items: {
      glowbay_coconut: `${lg("n11-gc-s", "#FBEBC8", "#E8CC98")}<path d="M6 60C9 50 20 47 32 47C44 47 55 50 58 60Z" fill="url(#n11-gc-s)" ${SO}/>
        ${rg("n11-gc-h", "#C8925E", "#6E4626", .4, .3)}<circle cx="32" cy="34" r="17" fill="url(#n11-gc-h)" ${SO}/>
        <ellipse cx="32" cy="38" rx="11.5" ry="8.6" fill="#F2DAB2" ${S15}/>
        <path d="M32 18V10" stroke="#4E9A3A" stroke-width="2.6" stroke-linecap="round"/>${leafP(32, 12, 13, 4.4, -150)} fill="#7CC860" ${S2}/>${leafP(32, 11, 13, 4.4, -25)} fill="#8FD86E" ${S2}/>
        ${EYES(27.6, 36.4, 37, 1.8)}${blush(24.4, 39.6, 40.2, 1.7, 1.1)}${smile(32, 40.4, 1.7, 1.5)}${SHINE(23, 27, 3.4, 1.8, -35)}`,
      glowbay_drop: `<circle cx="32" cy="34" r="25" fill="#7AF0FF" opacity=".25"/>${rg("n11-gd-b", "#F2FFFF", "#22AEDC", .42, .55)}
        <path d="M32 6C36 15 50 24 50 37C50 49 42 56 32 56C22 56 14 49 14 37C14 24 28 15 32 6Z" fill="url(#n11-gd-b)" ${SO}/>
        ${EYES(26.6, 37.4, 39, 2.1)}${blush(22.6, 41.4, 42.6, 1.9, 1.2)}${smile(32, 43, 1.9, 1.6)}${SHINE(24, 27, 2.4, 5, 20)}${spark(45, 34, 2.6, "#fff")}${spark(10, 14, 3.4, "#9FF6FF")}${spark(55, 50, 2.6, "#9FF6FF")}`,
      glowbay_seaglass: `${lg("n11-gs-g", "#D8F8EC", "#6CC4A8", .4, 1)}<path d="M10 34C7 22 15 11 28 10C40 9 53 15 55 28C57 42 51 54 36 56C21 58 12 47 10 34Z" fill="url(#n11-gs-g)" ${SO}/>
        <path d="M14 33C13 23 20 15 29 14C38 13 48 18 50 27" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".6"/><path d="M30 15L41 20L35 26Z" fill="#fff" opacity=".4"/>
        ${EYES(26, 38, 35, 2)}${blush(21.6, 42.4, 39, 1.9, 1.2)}${smile(32, 39.4, 1.9, 1.6)}${spark(48, 24, 3, "#fff")}`,
      glowbay_palm: `<ellipse cx="34" cy="56" rx="26" ry="5" fill="#4CC4C4" ${S2}/><path d="M16 56C20 49 28 47 34 47C40 47 48 49 52 56Z" fill="#F6E4C0" ${S2}/>
        <path d="M30 50C30 38 26 28 20 20L24 18C31 26 35 37 35 50Z" fill="#9A7452" ${S2}/><path d="M26 30l4-1.5M24 25l4-1.5M28 36l4-1M29 42l4-.6" stroke="#6A4A2E" stroke-width="1.2" stroke-linecap="round"/>
        ${[[-170, 16], [-140, 18], [-105, 16], [-60, 18], [-25, 17], [10, 14]].map(([a, L]) => `${leafP(22, 19, L, 4.6, a)} fill="${a < -100 ? "#3E8A44" : "#58A84E"}" ${S15}/>`).join("")}
        <circle cx="20" cy="22" r="2.6" fill="#7A5432" ${SOw(1.2)}/><circle cx="24" cy="22.6" r="2.6" fill="#7A5432" ${SOw(1.2)}/>${spark(52, 12, 3.6, "#FFD86B")}`,
      glowbay_wave: `${rg("n11-gw-w", "#B8F8FF", "#1A8ACC", .4, .3)}<path d="M4 54C5 36 18 14 38 13C51 12 59 22 57 31C55 40 44 41 42 33C41 28 45 25 49 27C47 20 37 19 31 26C24 34 24 46 30 54Z" fill="url(#n11-gw-w)" ${SO}/>
        <path d="M44 15C51 14 57 21 56 28" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
        ${[[12, 44], [17, 35], [22, 50], [25, 28], [45, 34]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.2}" fill="#E8FFFF"/>`).join("")}${spark(56, 48, 4, "#7AF0FF")}${spark(9, 18, 3, "#7AF0FF")}`,
      glowbay_moon: `${lg("n11-gm-s", "#0C2250", "#183A68")}<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#n11-gm-s)" ${SO}/>
        <path d="M30 14A9 9 0 1 0 39 25A7 7 0 1 1 30 14Z" fill="#FFF4CC"/>${spark(48, 16, 2.4, "#fff")}${spark(14, 22, 1.8, "#fff")}<circle cx="44" cy="28" r=".9" fill="#fff"/><circle cx="20" cy="12" r=".9" fill="#fff"/>
        <path d="M6 42Q14 38 22 42T38 42T58 42V48Q58 58 48 58H16Q6 58 6 48Z" fill="#0A2442"/>
        <path d="M9 43Q15 39.5 22 43T38 43T56 43" fill="none" stroke="#5CE6FF" stroke-width="2.6" stroke-linecap="round"/><path d="M12 50Q20 47 28 50T44 50T54 50" fill="none" stroke="#3FB8E8" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
      glowbay_sunset: `${lg("n11-gt-s", "#7EC4DA", "#F6BE8E")}<circle cx="32" cy="32" r="26" fill="url(#n11-gt-s)" ${SO}/>
        <circle cx="32" cy="34" r="10" fill="#FFF0C8"/><path d="M8.5 38H55.5A26 26 0 0 1 8.5 38Z" fill="#2DB2BE"/><path d="M8.5 38H55.5" stroke="${O}" stroke-width="2"/>
        <path d="M27 42h10M24 46h16M28 50h8" stroke="#FFF0C8" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><path d="M14 22c4-2 8-2 12 0M40 18c3-1.6 6-1.6 9 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
      glowbay_label: `${lg("n11-gx-b", "#0E2A4C", "#071A33")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n11-gx-b)" ${SO}/>
        ${T("MAKE WAVES", 32, 36.4, 9.4, "#7AF0FF", 46)}<path d="M10 41.5q4-2.4 8 0t8 0t8 0t8 0t8 0" fill="none" stroke="#3FC8FF" stroke-width="1.6" stroke-linecap="round"/>
        ${spark(8, 16, 4, "#9FF6FF")}${spark(56, 47, 3.4, "#9FF6FF")}<circle cx="54" cy="15" r="1.4" fill="#fff"/>`
    }},
    pins: [
      {id: "tp-glowbay-glass", name: "Sea Glass Pin", kind: "badge", desc: "A frosted bit of seafoam sea glass, polished smooth by the waves.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n11-pp-gg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#D8F8EC"/><stop offset="1" stop-color="#5CB498"/></linearGradient></defs>
          <path d="M4 15C3 9 7 4 13 3.6C19 3 26 6 26.6 13C27.4 20 24 26 17 26.6C10 27.2 5 21 4 15Z" fill="url(#n11-pp-gg)" stroke="#2E6A58" stroke-width="1.3"/><path d="M6.6 14C6.4 9.6 9.6 6.4 13.6 6.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><path d="M15 7L21 9.6L17.4 13Z" fill="#fff" opacity=".45"/><circle cx="20" cy="21" r=".9" fill="#fff" opacity=".8"/></svg>`},
      {id: "tp-glowbay-glow", name: "Glow Tide Washi", kind: "tape", desc: "Midnight-blue washi tape with glowing electric blue wave lines and stars.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#0C2250" opacity=".94"/>
          <path d="M6 15Q12 11 18 15T30 15T42 15T54 15T66 15T80 15" fill="none" stroke="#5CE6FF" stroke-width="2" stroke-linecap="round"/><path d="M6 20Q12 17 18 20T30 20T42 20T54 20T66 20T80 20" fill="none" stroke="#2EA8E0" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
          ${[[12, 6], [27, 8], [44, 5], [60, 8], [74, 6]].map(([x, y], i) => i % 2 ? `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>` : spark(x, y, 2, "#E8FFFF")).join("")}<path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".2"/></svg>`}
    ],
    card: {id: "tp-glowbay", name: "Glow Tide", desc: "Warm white-sand paper with a palm and a curling turquoise wave in the corner. Deep night blue with glowing electric waves in dark mode."}
  });
})();
