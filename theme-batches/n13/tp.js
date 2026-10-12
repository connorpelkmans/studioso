/* Theme Collections, new theme ideas batch n13: maples */
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
  const P = (cx, cy, a, r) => `${f1(cx + r * Math.cos(a * Math.PI / 180))} ${f1(cy + r * Math.sin(a * Math.PI / 180))}`;
  // a palmate maple leaf (7 lobes) centred at cx,cy with tip length R
  const maple = (cx, cy, R, rot = 0) => { const L = [[-190, .5], [-155, .74], [-125, .9], [-90, 1], [-55, .9], [-25, .74], [10, .5]], n = R * .36; let d = `M${P(cx, cy, -212 + rot, n * .9)}`;
    L.forEach(([a, k], i) => { const l = R * k, nx = (i < L.length - 1 ? (a + L[i + 1][0]) / 2 : 32) + rot; a += rot; d += `Q${P(cx, cy, a - 14, l * .72)} ${P(cx, cy, a, l)}Q${P(cx, cy, a + 14, l * .72)} ${P(cx, cy, nx, n)}`; });
    return d + `Q${P(cx, cy, 90 + rot, n * 1.1)} ${P(cx, cy, 148 + rot, n * .9)}Z`; };

  /* ================= MAPLE RAVINE ================= */
  TP_DATA.push({
    theme: "maples",
    pack: {name: "Momiji Trail Club", items: {
      maples_leaf: `${rg("n13-ml-l", "#FF9A5A", "#C42A22", .5, .55)}<path d="M32 46Q33 54 37 59" fill="none" stroke="#8A3A22" stroke-width="2.6" stroke-linecap="round"/>
        <path d="${maple(32, 34, 26)}" fill="url(#n13-ml-l)" ${SO}/><path d="M32 44V12M32 40L14 26M32 40L50 26M32 42L18 44M32 42L46 44" fill="none" stroke="#FFC48A" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
        ${EYES(27.4, 36.6, 34, 2)}${blush(24, 40, 37.6, 1.8, 1.1)}${smile(32, 38, 1.8, 1.5)}${SHINE(22, 22, 3.4, 1.8, -40)}${spark(54, 54, 3.6, "#F6BE44")}`,
      maples_tanuki: `${lg("n13-mt-h", "#D4AE84", "#9A7250")}<ellipse cx="17" cy="20" rx="7" ry="6.6" fill="#6A4C36" ${S2}/><ellipse cx="47" cy="20" rx="7" ry="6.6" fill="#6A4C36" ${S2}/>
        <path d="M10 37C10 24 20 16 32 16C44 16 54 24 54 37C54 49 44 56 32 56C20 56 10 49 10 37Z" fill="url(#n13-mt-h)" ${SO}/>
        <path d="M14.5 32C18 27.5 25 27.5 28 32C29 37 27 43 22 45C17.5 46 13.6 41 14.5 32Z" fill="#3A2A22"/><path d="M49.5 32C46 27.5 39 27.5 36 32C35 37 37 43 42 45C46.5 46 50.4 41 49.5 32Z" fill="#3A2A22"/>
        <circle cx="22" cy="35.5" r="3.4" fill="#fff" ${SOw(1)}/><circle cx="42" cy="35.5" r="3.4" fill="#fff" ${SOw(1)}/><circle cx="22.4" cy="35.8" r="2" fill="${O}"/><circle cx="42.4" cy="35.8" r="2" fill="${O}"/>
        <ellipse cx="32" cy="45" rx="9" ry="6.6" fill="#F4E6CC"/><ellipse cx="32" cy="42.4" rx="2.6" ry="1.9" fill="${O}"/>${smile(32, 46, 1.6, 1.3)}
        ${rg("n13-mt-l", "#FF8A5A", "#D02A22", .5, .5)}<path d="${maple(38, 12, 9, 15)}" fill="url(#n13-mt-l)" ${S15}/>`,
      maples_fox: `${lg("n13-mf-h", "#F69A58", "#D2602A")}<path d="M15 26C12 18 12 10 15 4C22 8 27 13 29 19Z" fill="#E8743A" ${S2}/><path d="M49 26C52 18 52 10 49 4C42 8 37 13 35 19Z" fill="#E8743A" ${S2}/>
        <path d="M17 21C16 16 16.5 12 17.5 9C21 11.5 23.5 14.5 25 18Z" fill="#3A2420"/><path d="M47 21C48 16 47.5 12 46.5 9C43 11.5 40.5 14.5 39 18Z" fill="#3A2420"/>
        <path d="M12 34C12 22 21 16 32 16C43 16 52 22 52 34C52 37 56 39 59 41C53 43.6 49 47.6 44 50C38 53 26 53 20 50C15 47.6 11 43.6 5 41C8 39 12 37 12 34Z" fill="url(#n13-mf-h)" ${SO}/>
        <path d="M15 40C21 42.6 26 41 32 37C38 41 43 42.6 49 40C47 48.6 40 52 32 52C24 52 17 48.6 15 40Z" fill="#FFF4E6"/>${EYES(25, 39, 32, 2.4)}<ellipse cx="32" cy="40.6" rx="2.6" ry="1.9" fill="${O}"/>${blush(19, 45, 40, 2, 1.2)}${smile(32, 44, 1.6, 1.3)}`,
      maples_lantern: `<circle cx="32" cy="27" r="16" fill="#FFD27A" opacity=".35"/>${lg("n13-mn-s", "#C8C2B4", "#8E887A")}
        <path d="M18 58H46L43 53H21Z" fill="url(#n13-mn-s)" ${S2}/><path d="M28.5 53V38H35.5V53Z" fill="url(#n13-mn-s)" ${S2}/><path d="M21 38H43L39 34H25Z" fill="url(#n13-mn-s)" ${S2}/>
        <path d="M24 34V22H40V34Z" fill="url(#n13-mn-s)" ${S2}/><rect x="28" y="24.6" width="8" height="6.8" rx="1" fill="#FFD27A" ${SOw(1.4)}/>
        <path d="M11 22C17 20 24 15 32 11C40 15 47 20 53 22C50 23.6 44 22.6 40 22H24C20 22.6 14 23.6 11 22Z" fill="url(#n13-mn-s)" ${S2}/><path d="M29.6 11C29.6 7.6 31 5.6 32 4.4C33 5.6 34.4 7.6 34.4 11Z" fill="#A49E90" ${S15}/>
        <path d="M14 21.6C19 19.6 25 16 30 13" fill="none" stroke="#7CA048" stroke-width="2.4" stroke-linecap="round"/><path d="M19 57.6C21 55.6 25 54.6 28 55" fill="none" stroke="#7CA048" stroke-width="2.4" stroke-linecap="round"/>`,
      maples_falls: `${lg("n13-mw-w", "#F6FCFC", "#BFE2E6")}<ellipse cx="32" cy="54" rx="27" ry="7" fill="#4E8C8A" ${S2}/>
        <path d="M24 12H40V50H24Z" fill="url(#n13-mw-w)" ${S2}/><path d="M28 14V46M32 14V48M36 14V46" stroke="#9AC8D0" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M6 54C4 42 10 30 22 30C25 38 25 48 24 56Z" fill="#9C968A" ${S2}/><path d="M58 54C60 42 54 28 42 28C39 38 39 48 40 56Z" fill="#9C968A" ${S2}/>
        <path d="M8 40C11 33 16 30 22 30C22 34 20 36 17 37C14 38 11 39 8 40Z" fill="#6E8A36"/><path d="M56 38C53 31 48 28 42 28C42 32 44 34 47 35C50 36 53 37 56 38Z" fill="#6E8A36"/>
        ${[20, 32, 44].map((x, i) => `<ellipse cx="${x}" cy="${51 + (i % 2)}" rx="4" ry="2" fill="#fff"/>`).join("")}<path d="${maple(14, 10, 6, -20)}" fill="#E8402C" ${SOw(1.2)}/><path d="${maple(50, 14, 5, 25)}" fill="#F08632" ${SOw(1.2)}/>`,
      maples_moon: `${lg("n13-mm-s", "#111A3C", "#2E3460")}<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#n13-mm-s)" ${SO}/>
        <circle cx="38" cy="26" r="11" fill="#FBF4DE"/><circle cx="35" cy="24" r="2" fill="#E4D8B8"/><circle cx="41" cy="29" r="1.5" fill="#E4D8B8"/>${spark(14, 14, 2.2, "#fff")}<circle cx="50" cy="48" r=".9" fill="#fff"/>
        <path d="M5 16C14 18 24 24 30 34" fill="none" stroke="#1A0E14" stroke-width="2.4" stroke-linecap="round"/>
        ${[[12, 18, 5], [20, 24, 5.5], [27, 31, 5], [32, 37, 4.4], [24, 16, 4]].map(([x, y, r], i) => `<path d="${maple(x, y, r, i * 30)}" fill="${i % 2 ? "#7A1E28" : "#A42A30"}"/>`).join("")}
        <path d="M8 60Q20 50 32 54T58 50V52Q58 60 50 60Z" fill="#25314E"/><path d="M16 56H30M36 53H50" stroke="#C6D0EA" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`,
      maples_stone: `<ellipse cx="32" cy="55" rx="25" ry="5" fill="#4E8C8A" opacity=".5"/>${rg("n13-ms-s", "#C8C2B4", "#7A7468", .35, .3)}<path d="M8 50C7 36 18 26 32 26C46 26 57 36 56 50C56 56 8 56 8 50Z" fill="url(#n13-ms-s)" ${SO}/>
        <path d="M12 40C14 31 22 26.6 32 26.6C42 26.6 50 31 52 40C48 37 45 39 42 37C38 35 35 38 31 36C27 34 24 38 20 37C17 36 14 38 12 40Z" fill="#7CA048" ${S2}/>
        ${EYES(25, 39, 45, 2)}${blush(21, 43, 48.6, 1.8, 1.1)}${smile(32, 48.6, 1.7, 1.4)}<path d="${maple(42, 28, 7, 20)}" fill="#E8402C" ${S15}/>`,
      maples_label: `${lg("n13-mx-b", "#FFF8F0", "#F6E0CC")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n13-mx-b)" ${SO}/>
        ${T("FALL FOR IT", 32, 36.4, 9.4, "#B8382A", 46)}<path d="M12 41.5h40" stroke="#E8743A" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.4"/>
        <path d="${maple(9, 17, 7, -15)}" fill="#E8402C" ${S15}/><path d="${maple(55, 46, 6, 20)}" fill="#F6BE44" ${S15}/>`
    }},
    pins: [
      {id: "tp-maples-leaf", name: "Momiji Pin", kind: "badge", desc: "A glossy crimson Japanese maple leaf with seven slender lobes.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n13-pp-ml" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#FF9A5A"/><stop offset="1" stop-color="#C42A22"/></radialGradient></defs>
          <path d="M15 21Q15.6 25 17.6 27.6" fill="none" stroke="#7A2A18" stroke-width="1.4" stroke-linecap="round"/><path d="${maple(15, 15.6, 12.6)}" fill="url(#n13-pp-ml)" stroke="#6E1A14" stroke-width="1.1" stroke-linejoin="round"/><path d="M15 20V5M15 18L7 11.6M15 18L23 11.6" fill="none" stroke="#FFC48A" stroke-width=".8" stroke-linecap="round" opacity=".75"/><ellipse cx="10" cy="9" rx="2" ry="1" fill="#fff" opacity=".5" transform="rotate(-40 10 9)"/></svg>`},
      {id: "tp-maples-washi", name: "Momiji Washi", kind: "tape", desc: "Warm cream washi tape scattered with crimson, orange and gold maple leaves.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#F8EAD6" opacity=".95"/>
          ${[[14, 12, "#C42A26", -15], [28, 15, "#F08632", 20], [42, 11, "#E2502C", -30], [56, 14, "#F6BE44", 10], [70, 12, "#C42A26", 35]].map(([x, y, c, r]) => `<path d="${maple(x, y, 5.6, r)}" fill="${c}"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-maples", name: "Momiji Card", desc: "Warm cream paper with maple leaves drifting in from the corner and a little mossy stone below. Deep night blue with a full moon and red leaves in dark mode."}
  });
})();
