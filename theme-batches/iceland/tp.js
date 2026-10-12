/* Theme Collection, Around the World: Iceland */
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
  // a lupine spike: stem and stacked pea flowers, purple fading to pink at the tip
  const lupine = (x, y, h, s = 1) => `<path d="M${x} ${y}V${f1(y - h)}" stroke="#4E8A3A" stroke-width="${f1(1.6 * s)}" stroke-linecap="round"/>${Array.from({length: 6}, (_, i) => { const yy = f1(y - h * 0.35 - i * h * 0.11), r = f1((3.4 - i * 0.35) * s), c = i < 3 ? "#7A5AD0" : i < 5 ? "#9C7CE4" : "#D8A8E8"; return `<ellipse cx="${f1(x - r * 0.7)}" cy="${yy}" rx="${r}" ry="${f1(r * 0.8)}" fill="${c}" ${SOw(.9)}/><ellipse cx="${f1(x + r * 0.7)}" cy="${f1(yy - r * 0.3)}" rx="${r}" ry="${f1(r * 0.8)}" fill="${c}" ${SOw(.9)}/>`; }).join("")}`;

  TP_DATA.push({
    theme: "iceland",
    pack: {name: "Land of Falls", items: {
      iceland_puffin: `${rg("iceland-tp-pf", "#4E4A58", "#1E1C26", .4, .3)}
        <path d="M32 6C48 6 56 18 56 32C56 48 46 58 32 58C18 58 8 48 8 32C8 18 16 6 32 6Z" fill="url(#iceland-tp-pf)" ${SO}/>
        <path d="M32 14C44 14 50 22 49 31C48 40 41 44 32 44C23 44 16 40 15 31C14 22 20 14 32 14Z" fill="#F7F5F2"/>
        <path d="M18 24L24 25.6L20 21Z" fill="#8E8A96"/><path d="M46 24L40 25.6L44 21Z" fill="#8E8A96"/>
        <circle cx="24" cy="28" r="2.8" fill="${O}"/><circle cx="40" cy="28" r="2.8" fill="${O}"/><circle cx="25" cy="27" r=".9" fill="#fff"/><circle cx="41" cy="27" r=".9" fill="#fff"/>
        <path d="M24 33Q32 29 40 33L37.6 39H26.4Z" fill="#7C8A9A" ${S2}/><path d="M26.4 39H37.6L35.6 47Q32 50 28.4 47Z" fill="#F2742A" ${S2}/><path d="M27.6 42.6H36.4" stroke="#F8D04A" stroke-width="2" stroke-linecap="round"/>
        ${blush(18.6, 45.4, 35.4, 2.4, 1.5)}
        <path d="M14 46Q18 54 32 56Q46 54 50 46" fill="#FFFFFF" opacity=".25"/>
        <path d="M18 14Q22 10 28 9" fill="none" stroke="#6E6A7A" stroke-width="2.4" stroke-linecap="round"/>`,
      iceland_kirkjufell: `${lg("iceland-tp-ks", "#BFE0F0", "#EAF4F2")}${lg("iceland-tp-km", "#8AAE6A", "#5E8A48")}
        <rect x="4" y="6" width="56" height="52" rx="12" fill="url(#iceland-tp-ks)" ${SO}/>
        <path d="M6 44L18 36L26 22L31 12L34 14L38 24L44 30L52 36L58 44V50H6Z" fill="url(#iceland-tp-km)" ${S2}/>
        <path d="M27 21L31 12L34 14L37 22Q32 24 27 21Z" fill="#7A746C"/><path d="M21 31Q32 28 41 28M17 37Q32 34 48 34" fill="none" stroke="#4E6A3A" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <path d="M30.4 15.6L31.2 20M33 16L33.6 19" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M6 46H58V52Q58 56 54 56H10Q6 56 6 52Z" fill="#4A4C52"/>
        <path d="M24 46H34V56H24Z" fill="#DCF0F6" ${SOw(1.4)}/><path d="M27 47V55M31 47V55" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M6 46H24M34 46H58" stroke="#86BE4A" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="29" cy="56" rx="9" ry="2.4" fill="#FFFFFF"/>
        ${spark(50, 14, 3.4, "#FFFFFF")}`,
      iceland_horse: `${rg("iceland-tp-hh", "#E6A26A", "#B0643A", .42, .3)}${lg("iceland-tp-hm", "#FFF4DA", "#E2C690")}
        <path d="M14 18C10 10 12 4 16 3C20 6 22 12 21 18Z" fill="#C47A44" ${S2}/><path d="M50 18C54 10 52 4 48 3C44 6 42 12 43 18Z" fill="#C47A44" ${S2}/>
        <path d="M32 10C46 10 52 20 51 32C50 42 46 48 44 52C42 58 38 60 32 60C26 60 22 58 20 52C18 48 14 42 13 32C12 20 18 10 32 10Z" fill="url(#iceland-tp-hh)" ${SO}/>
        <ellipse cx="32" cy="50" rx="13" ry="9" fill="#F0CDA8" ${S2}/><ellipse cx="27" cy="50" rx="1.6" ry="2.2" fill="#6A4030"/><ellipse cx="37" cy="50" rx="1.6" ry="2.2" fill="#6A4030"/>
        <path d="M14 18C16 8 28 4 36 8C44 6 52 12 50 20C46 16 44 22 38 19C34 24 28 18 24 23C22 20 18 21 14 18Z" fill="url(#iceland-tp-hm)" ${S2}/>
        ${EYES(24, 40, 34, 2.8)}${blush(18.6, 45.4, 40)}${smile(32, 55, 2)}`,
      iceland_geyser: `${lg("iceland-tp-gc", "#FFFFFF", "#D8EEF6")}
        <ellipse cx="32" cy="56" rx="26" ry="5" fill="#9CCB6A" ${S2}/><ellipse cx="32" cy="55" rx="12" ry="2.6" fill="#7FD6E0" ${SOw(1.6)}/>
        <path d="M28 55C27 40 28 26 30 18H35C37 26 38 40 37 55Z" fill="url(#iceland-tp-gc)" ${S2}/>
        <path d="M32 4C40 4 44 8 44 13C50 13 54 17 52 22C50 27 44 27 40 25C38 29 26 29 24 25C18 27 12 25 12 20C12 15 18 13 22 14C22 8 26 4 32 4Z" fill="url(#iceland-tp-gc)" ${SO}/>
        ${EYES(26, 38, 16, 2.4)}${blush(21.6, 42.4, 20.4, 2.2, 1.4)}${smile(32, 19.6, 2)}
        <circle cx="16" cy="36" r="2" fill="#BFE6F4" ${SOw(1.2)}/><circle cx="48" cy="40" r="2.4" fill="#BFE6F4" ${SOw(1.2)}/><circle cx="44" cy="30" r="1.4" fill="#BFE6F4"/>`,
      iceland_church: `${lg("iceland-tp-cw", "#FFFFFF", "#E6E2DA")}
        <path d="M2 56Q16 44 32 48Q48 44 62 56Z" fill="#86BE4A" ${SO}/>
        <rect x="27" y="30" width="28" height="20" fill="url(#iceland-tp-cw)" ${S2}/><path d="M25 31L29 22H53L57 31Z" fill="#D8402E" ${S2}/>
        <rect x="14" y="26" width="13" height="24" fill="url(#iceland-tp-cw)" ${S2}/><path d="M12.6 26L20.5 8L28.4 26Z" fill="#D8402E" ${S2}/><circle cx="20.5" cy="7" r="1.6" fill="#F2C84A" ${SOw(1)}/>
        <rect x="18" y="40" width="5" height="10" rx="2.5" fill="#5A3A2A" ${SOw(1.4)}/><rect x="18.6" y="30" width="3.8" height="4.6" rx="1.9" fill="#5A7A9A"/>
        ${[33, 41, 49].map(x => `<rect x="${x - 2}" y="35" width="4" height="7" rx="2" fill="#5A7A9A"/>`).join("")}
        ${EYES(36, 46, 45, 1.8)}${smile(41, 47, 1.6, 1.4)}
        ${spark(54, 12, 3, "#F2C84A")}`,
      iceland_lupine: `${lupine(20, 58, 40, 1)}${lupine(32, 60, 52, 1.15)}${lupine(44, 58, 42, 1)}
        ${[[12, 54, -30], [26, 56, 20], [38, 56, -20], [52, 54, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="2.4" transform="rotate(${r} ${x} ${y})" fill="#5E9A3C" ${SOw(1.2)}/>`).join("")}
        ${spark(54, 14, 3.4, "#F2C84A")}${spark(9, 22, 2.6, "#F2C84A")}`,
      iceland_aurora: `${lg("iceland-tp-an", "#0C1A36", "#1F4A5A")}${lg("iceland-tp-aa", "#B89CFF", "#7CE0B0")}
        <rect x="4" y="6" width="56" height="52" rx="12" fill="url(#iceland-tp-an)" ${SO}/>
        <path d="M8 30C16 20 22 26 30 18C38 10 44 20 56 12V22C46 28 40 20 32 28C24 36 18 28 8 38Z" fill="url(#iceland-tp-aa)" opacity=".85"/>
        <path d="M14 26V34M20 24V32M28 20V28M36 16V24M44 16V22M50 14V20" stroke="#D8FFE8" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
        <path d="M6 52L20 42L28 30L32 26L35 30L40 38L50 44L58 52Z" fill="#22384A" ${S2}/><path d="M28 30L32 26L35 30Q32 32 28 30Z" fill="#C8D8E8"/>
        <rect x="14" y="48" width="6" height="5" fill="#3A4A5A"/><rect x="15.6" y="49.4" width="2.8" height="2.4" fill="#FFC870"/>
        <circle cx="12" cy="12" r=".9" fill="#fff"/><circle cx="48" cy="34" r=".8" fill="#fff"/><circle cx="22" cy="14" r=".7" fill="#fff"/>`,
      iceland_badge: `${lg("iceland-tp-bd", "#3E8A72", "#245448")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#iceland-tp-bd)" ${SO}/>
        <path d="M40 46L46 36L50 28L52 26L54 30L58 38V46Z" fill="#86BE4A" opacity=".55"/>
        ${T("TAKK!", 30, 37.5, 13, "#FFFFFF", 38)}
        ${spark(9, 10, 3.4, "#F2C84A")}${spark(56, 56, 3, "#7CE0B0")}`
    }},
    pins: [
      {id: "tp-iceland-puffin", name: "Puffin Pin", kind: "badge", desc: "A round little puffin with its bright striped bill.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="iceland-pin-p" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#4E4A58"/><stop offset="1" stop-color="#1E1C26"/></radialGradient></defs>
          <circle cx="15" cy="15" r="12" fill="url(#iceland-pin-p)" stroke="#14121A" stroke-width="1.1"/>
          <path d="M15 7.6C20.6 7.6 23 11 22.6 15C22.2 19 19 20.6 15 20.6C11 20.6 7.8 19 7.4 15C7 11 9.4 7.6 15 7.6Z" fill="#F7F5F2"/>
          <circle cx="11.6" cy="13.4" r="1.3" fill="#1E1C26"/><circle cx="18.4" cy="13.4" r="1.3" fill="#1E1C26"/>
          <path d="M11.8 15.6Q15 14 18.2 15.6L17 18.4H13Z" fill="#7C8A9A"/><path d="M13 18.4H17L16 22Q15 23 14 22Z" fill="#F2742A"/><path d="M13.4 19.8H16.6" stroke="#F8D04A" stroke-width=".8"/>
          <ellipse cx="10" cy="8.6" rx="2.4" ry="1.2" fill="#fff" opacity=".35" transform="rotate(-35 10 8.6)"/></svg>`},
      {id: "tp-iceland-lupine", name: "Lupine Washi", kind: "tape", desc: "Mossy green washi tape with a row of purple lupines.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#8CC456" opacity=".9"/>
          <path d="M6 20Q24 17 44 20Q62 23 80 19" fill="none" stroke="#5E9A3C" stroke-width="1.4"/>
          ${[12, 24, 38, 52, 66, 76].map((x, i) => `<path d="M${x} 21V9" stroke="#4E8A3A" stroke-width=".9"/>${[0, 1, 2, 3].map(k => `<ellipse cx="${x - 1.3}" cy="${f1(17 - k * 2.4)}" rx="${f1(1.7 - k * 0.2)}" ry="1.2" fill="${k < 2 ? "#7A5AD0" : "#B48CE8"}"/><ellipse cx="${x + 1.3}" cy="${f1(16.2 - k * 2.4)}" rx="${f1(1.7 - k * 0.2)}" ry="1.2" fill="${k < 2 ? "#7A5AD0" : "#B48CE8"}"/>`).join("")}${i % 2 ? `<circle cx="${x + 5}" cy="8" r="1.6" fill="#FFFFFF" opacity=".9"/>` : ""}`).join("")}</svg>`}
    ],
    card: {id: "tp-iceland", name: "Mossy Falls", desc: "Pale glacier-blue paper with Kirkjufell in the corner and a little waterfall over mossy basalt below. Midnight blue with a green aurora in dark mode."}
  });
})();
