/* ===== module: 96-tp-france.js ===== */
/* Theme Collections, around the world */
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
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // the tower, base centre (x, y), h tall
  const tower = (x, y, h, fill, line) => { const k = h / 56, P = (a, b) => `${f1(x + a * k)} ${f1(y + b * k)}`;
    return `<path d="M${P(-15, 0)}L${P(-9, -14)}L${P(-11, -14)}L${P(-11, -17)}L${P(-6, -17)}L${P(-4, -28)}L${P(-6, -28)}L${P(-6, -30.5)}L${P(-2.6, -30.5)}L${P(-1, -48)}L${P(-0.6, -56)}L${P(0.6, -56)}L${P(1, -48)}L${P(2.6, -30.5)}L${P(6, -30.5)}L${P(6, -28)}L${P(4, -28)}L${P(6, -17)}L${P(11, -17)}L${P(11, -14)}L${P(9, -14)}L${P(15, 0)}L${P(10, 0)}Q${P(7, -9)} ${P(0, -10)}Q${P(-7, -9)} ${P(-10, 0)}Z" fill="${fill}" ${SOw(1.8)}/>
      <path d="M${P(-7.6, -14)}L${P(-3.6, -28)}M${P(7.6, -14)}L${P(3.6, -28)}M${P(-3.4, -17)}L${P(3.4, -17)}M${P(-1.8, -31)}L${P(1.2, -46)}M${P(1.8, -31)}L${P(-1.2, -46)}M${P(-12, -3)}L${P(-8, -12)}M${P(12, -3)}L${P(8, -12)}" fill="none" stroke="${line}" stroke-width="1" stroke-linecap="round"/>`; };

  TP_DATA.push({
    theme: "france",
    pack: {name: "Paris Postcards", items: {
      france_tower: `${lg("fr-tw", "#B8977A", "#7E624E")}
        <circle cx="32" cy="34" r="26" fill="#DCEBF6" ${SO}/>
        <path d="M8 44Q32 38 56 44V48Q32 60 8 48Z" fill="#9CC2D2"/>
        ${tower(32, 50, 44, "url(#fr-tw)", "#F2DCC2")}
        ${spark(14, 18, 4, "#FFE27A")}${spark(52, 14, 3, "#FFFFFF")}${spark(48, 30, 2.4, "#FFE27A")}${spark(16, 34, 2.2, "#FFFFFF")}`,
      france_croissant: `${lg("fr-cr", "#F8D088", "#C07A30")}
        <path d="M6 44Q2 34 10 30Q16 28 20 32L22 42Q16 48 6 44Z" fill="url(#fr-cr)" ${S2}/><path d="M58 44Q62 34 54 30Q48 28 44 32L42 42Q48 48 58 44Z" fill="url(#fr-cr)" ${S2}/>
        <path d="M14 36Q14 24 24 22Q30 22 32 28L30 48Q20 50 16 44Z" fill="url(#fr-cr)" ${S2}/><path d="M50 36Q50 24 40 22Q34 22 32 28L34 48Q44 50 48 44Z" fill="url(#fr-cr)" ${S2}/>
        <path d="M32 14C44 14 48 24 48 34C48 46 42 52 32 52C22 52 16 46 16 34C16 24 20 14 32 14Z" fill="url(#fr-cr)" ${SO}/>
        <path d="M19 26Q32 20 45 26M18 44Q32 50 46 44" fill="none" stroke="#A8641E" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        ${EYES(26.5, 37.5, 34, 2.3)}${blush(22.5, 41.5, 38.6, 2.2, 1.4)}${smile(32, 38.2, 2.2)}
        <path d="M22 19Q26 16 30 16" fill="none" stroke="#FFF0C8" stroke-width="2.2" stroke-linecap="round"/>${spark(56, 12, 3.4, "#FFE27A")}`,
      france_macarons: `${lg("fr-m1", "#FFD8E4", "#E88AA6")}${lg("fr-m2", "#D8F2E2", "#7AC8A0")}${lg("fr-m3", "#E8DEFA", "#A890E0")}
        ${[["fr-m3", 32, 50, "#FFF6E8"], ["fr-m2", 32, 34, "#FFF6E8"], ["fr-m1", 32, 18, "#FFF6E8"]].map(([g, x, y, fl]) => `<path d="M${x - 17} ${y + 5}Q${x - 17} ${y + 11} ${x} ${y + 11}Q${x + 17} ${y + 11} ${x + 17} ${y + 5}Z" fill="url(#${g})" ${S2}/><rect x="${x - 17}" y="${y + 1}" width="34" height="4.6" rx="2" fill="${fl}" ${SOw(1.6)}/><path d="M${x - 17} ${y + 1}Q${x - 17} ${y - 9} ${x} ${y - 9}Q${x + 17} ${y - 9} ${x + 17} ${y + 1}Z" fill="url(#${g})" ${S2}/>`).join("")}
        ${EYES(27, 37, 15, 2)}${blush(23.4, 40.6, 18.6, 2, 1.3)}${smile(32, 18, 1.8, 1.6)}
        <path d="M20 12Q23 8 28 8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>${spark(56, 30, 3, "#FFE27A")}${spark(8, 44, 2.6, "#FFE27A")}`,
      france_baguette: `${lg("fr-bg", "#F6CC80", "#C8822E", 1, 1)}
        <path d="M10 52Q4 46 10 40L44 10Q50 4 56 10Q60 16 54 22L20 52Q14 58 10 52Z" fill="url(#fr-bg)" ${SO}/>
        ${[[18, 40], [26, 32], [34, 24], [42, 16]].map(([x, y]) => `<path d="M${x - 2} ${y + 4}Q${x + 2} ${y - 2} ${x + 6} ${y - 4}" fill="none" stroke="#FFE6B0" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
        <rect x="6" y="40" width="24" height="16" rx="3" transform="rotate(-42 18 48)" fill="#FFF6E8" ${S2}/><path d="M10 50L22 39" stroke="#C8463E" stroke-width="2" stroke-linecap="round"/>
        ${EYES(36, 44, 28, 2.1)}${smile(41.4, 33, 2, 1.6)}${spark(54, 40, 3.4, "#FFE27A")}`,
      france_cafe: `${lg("fr-cf", "#FFFFFF", "#E8E2DA")}
        <ellipse cx="30" cy="54" rx="24" ry="5.6" fill="#F4EEE6" ${S2}/>
        <path d="M12 24H48Q48 50 30 52Q12 50 12 24Z" fill="url(#fr-cf)" ${SO}/>
        ${tube("M47 30Q57 30 55 38Q53 44 46 42", "#FFFFFF", 3)}
        <ellipse cx="30" cy="24" rx="18" ry="4.6" fill="#8A5A3A" ${S2}/><path d="M22 23.4Q30 20 38 23.4" fill="none" stroke="#D8B48A" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M24 16Q20 10 25 6M33 16Q30 10 35 5" fill="none" stroke="#C8BCC8" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 32H48" stroke="#C8463E" stroke-width="2.4"/>
        ${EYES(24.5, 35.5, 39, 2.2)}${blush(20.6, 39.4, 43.4, 2, 1.3)}${smile(30, 43, 2)}`,
      france_poodle: `${lg("fr-pd", "#FFFFFF", "#EEE2EC")}
        <circle cx="16" cy="36" r="9" fill="url(#fr-pd)" ${S2}/><circle cx="48" cy="36" r="9" fill="url(#fr-pd)" ${S2}/>
        <circle cx="32" cy="34" r="17" fill="url(#fr-pd)" ${SO}/>
        ${[[22, 16], [28, 12], [36, 12], [42, 16], [32, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#FFFFFF" ${S2}/>`).join("")}
        <path d="M38 14L46 9V19Z M38 14L30 9V19Z" fill="#F2A8C0" ${SOw(1.6)}/><circle cx="38" cy="14" r="2.2" fill="#E87EA2" ${SOw(1.4)}/>
        <ellipse cx="32" cy="42" rx="8" ry="5.4" fill="#fff" ${SOw(1.6)}/><ellipse cx="32" cy="39.6" rx="2.6" ry="1.8" fill="${O}"/>
        ${EYES(25, 39, 32, 2.3)}${blush(21, 43, 38, 2, 1.3)}<path d="M29.6 44q2.4 2 4.8 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M18 52Q32 58 46 52" fill="none" stroke="${O}" stroke-width="5.6" stroke-linecap="round"/><path d="M18 52Q32 58 46 52" fill="none" stroke="#F2A8C0" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="57" r="3" fill="#F6C85A" ${SOw(1.4)}/>`,
      france_lamp: `${lg("fr-lp", "#4A4450", "#2A2430")}
        <defs><radialGradient id="fr-lg"><stop offset="0" stop-color="#FFE08A" stop-opacity=".8"/><stop offset=".55" stop-color="#FFE08A" stop-opacity=".3"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs>
        <circle cx="32" cy="16" r="15" fill="url(#fr-lg)"/>
        <rect x="29" y="22" width="6" height="34" fill="url(#fr-lp)" ${S2}/><path d="M22 60H42L39 54H25Z" fill="url(#fr-lp)" ${S2}/><rect x="25" y="36" width="14" height="3.6" rx="1.4" fill="#4A4450" ${SOw(1.4)}/>
        <path d="M24 22H40L42 8H22Z" fill="#FFE6A0" ${S2}/><path d="M20 8H44L32 1Z" fill="url(#fr-lp)" ${S2}/><path d="M32 8V22M23 15H41" stroke="#4A4450" stroke-width="1.4"/>
        ${spark(52, 30, 3.4, "#FFE27A")}${spark(10, 34, 2.8, "#FFE27A")}`,
      france_badge: `${lg("fr-bd", "#3A4E7A", "#24345A")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#fr-bd)" ${SO}/>
        ${tower(49, 40, 20, "#F6D892", "#B8903A")}
        ${T("BRAVO!", 25, 37, 11, "#FFFFFF", 36)}
        ${spark(9, 10, 3.4, "#FFE27A")}${spark(56, 56, 3, "#F2A8C0")}`
    }},
    pins: [
      {id: "tp-france-macaron", name: "Macaron Pin", kind: "badge", desc: "A pastel pink macaron with a creamy filling, pinned like a tiny treat.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="fr-pin-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD8E4"/><stop offset="1" stop-color="#E88AA6"/></linearGradient></defs>
          <path d="M4 18Q4 25 15 25Q26 25 26 18Z" fill="url(#fr-pin-m)" stroke="#7A2E44" stroke-width="1.1" stroke-linejoin="round"/>
          <rect x="3.6" y="14" width="22.8" height="4.6" rx="2" fill="#FFF6E8" stroke="#7A2E44" stroke-width="1.1"/>
          <path d="M4 14Q4 5 15 5Q26 5 26 14Z" fill="url(#fr-pin-m)" stroke="#7A2E44" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M5 13.4Q7 12.4 9 13.4Q11 12.4 13 13.4Q15 12.4 17 13.4Q19 12.4 21 13.4Q23 12.4 25 13.4" fill="none" stroke="#D97898" stroke-width=".7"/>
          <ellipse cx="10" cy="8.6" rx="2.6" ry="1.2" fill="#fff" opacity=".6" transform="rotate(-20 10 8.6)"/></svg>`},
      {id: "tp-france-awning", name: "Cafe Awning Washi", kind: "tape", desc: "Red and cream cafe-awning stripes with a tiny gold tower.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="fr-pin-c"><path d="${tapeEdge}"/></clipPath></defs><path d="${tapeEdge}" fill="#FFF6E8" opacity=".95"/>
          <g clip-path="url(#fr-pin-c)" opacity=".9">${Array.from({length: 11}, (_, i) => `<rect x="${i * 8}" y="0" width="4" height="26" fill="#C8463E"/>`).join("")}</g>
          <path d="M3 21.6Q8 25 13 21.6Q18 25 23 21.6Q28 25 33 21.6Q38 25 43 21.6Q48 25 53 21.6Q58 25 63 21.6Q68 25 73 21.6Q78 25 82 21.6" fill="none" stroke="#7A2420" stroke-width=".8" opacity=".5"/>
          <circle cx="43" cy="12" r="8.4" fill="#FFF6E8"/>${tower(43, 19, 13, "#E2B04A", "#8A6420").replace(/stroke-width="1.8"/, 'stroke-width=".8"')}</svg>`}
    ],
    card: {id: "tp-france", name: "Rive Gauche", desc: "Cream paper under a striped cafe awning, with Paris rooftops and the tower along the bottom. Starry night with lit windows and a golden tower in dark mode."}
  });
})();
/* end of module 96-tp-france.js */


