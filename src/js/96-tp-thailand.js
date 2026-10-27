/* ===== module: 96-tp-thailand.js ===== */
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
  const tube = (d, c, w, ow = w + 3.6) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const petals = (cx, cy, n, r, rx, ry, fill, extra = "") => Array.from({length: n}, (_, i) => { const a = i * 360 / n, x = f1(cx + r * Math.cos(a * Math.PI / 180)), y = f1(cy + r * Math.sin(a * Math.PI / 180)); return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${f1(a)} ${x} ${y})" fill="${fill}" ${extra}/>`; }).join("");
  const frang = (x, y, s, fill = "#FFFFFF", w = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${petals(0, 0, 5, 4.4, 4.6, 2.6, fill, SOw(w))}<circle r="1.8" fill="#FFC83A"/></g>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";

  TP_DATA.push({
    theme: "thailand",
    pack: {name: "Thai Treasures", items: {
      thailand_elephant: `${lg("thailand-tp-el", "#CCC8DE", "#9C98B6")}
        <path d="M22 22C10 14 2 22 4 34C6 44 16 48 24 42Z" fill="url(#thailand-tp-el)" ${SO}/><path d="M20 26C13 22 8 26 9 33C10 39 16 41 21 38Z" fill="#F4B4C6"/>
        <path d="M42 22C54 14 62 22 60 34C58 44 48 48 40 42Z" fill="url(#thailand-tp-el)" ${SO}/><path d="M44 26C51 22 56 26 55 33C54 39 48 41 43 38Z" fill="#F4B4C6"/>
        <path d="M32 12C46 12 50 24 48 34C46 44 40 48 32 48C24 48 18 44 16 34C14 24 18 12 32 12Z" fill="url(#thailand-tp-el)" ${SO}/>
        ${tube("M30 38Q28 48 33 54Q38 58 42 53Q44 50 41 48", "#B4B0CA", 5)}
        <path d="M26 15Q32 9 38 15L35 17Q32 14 29 17Z" fill="#E2483A" ${SOw(1.6)}/><path d="M30 13L32 7L34 13Z" fill="#F2C24A" ${SOw(1.4)}/>
        ${EYES(26, 38, 29, 2.4)}${blush(21, 43, 35)}
        ${frang(52, 10, .8, "#FFFFFF")}${spark(10, 54, 3.4, "#FFD86B")}`,
      thailand_tuktuk: `${lg("thailand-tp-tk", "#5AA8F0", "#1E66B8")}${lg("thailand-tp-tr", "#3EB06A", "#22844A")}
        <path d="M8 26Q9 16 18 14H46Q55 16 56 26Z" fill="url(#thailand-tp-tr)" ${SO}/><path d="M8 26H56L54 30H10Z" fill="#F6C83A" ${S2}/>
        <path d="M11 54L12 34Q13 30 18 30H46Q51 30 52 34L53 54Q32 58 11 54Z" fill="url(#thailand-tp-tk)" ${SO}/>
        <path d="M16 33H48V42Q32 45 16 42Z" fill="#E2F4FF" ${SOw(1.6)}/>
        <path d="M12 46Q32 50 52 46" fill="none" stroke="#F6C83A" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="32" cy="58" r="5" fill="#2E2838" ${S2}/><circle cx="12" cy="57" r="4" fill="#2E2838" ${S2}/><circle cx="52" cy="57" r="4" fill="#2E2838" ${S2}/>
        <circle cx="16" cy="50" r="2.4" fill="#FFF6C8" ${SOw(1.2)}/><circle cx="48" cy="50" r="2.4" fill="#FFF6C8" ${SOw(1.2)}/>
        <rect x="25" y="9" width="14" height="6" rx="2" fill="#FFE070" ${SOw(1.6)}/>
        ${EYES(26, 38, 38, 2.2)}${blush(21, 43, 41.5, 2, 1.3)}${smile(32, 41, 2)}
        ${spark(59, 8, 3.4, "#FFD86B")}`,
      thailand_mango: `${lg("thailand-tp-mg", "#FFD84A", "#E8901A")}${rg("thailand-tp-rc", "#FFFFFF", "#E8DEC6", .4, .35)}
        <path d="M6 52Q32 46 58 52Q56 60 32 61Q8 60 6 52Z" fill="#5EAA4E" ${SO}/>
        <path d="M12 52C10 42 16 32 26 29C30 28 38 28 42 30C50 34 55 44 52 52Z" fill="url(#thailand-tp-rc)" ${SO}/>
        <path d="M14 46Q20 52 28 50Q36 55 44 50Q50 51 52 46" fill="none" stroke="#E8D8B0" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M14 30Q20 14 38 13Q54 14 54 24Q48 28 34 30Q22 31 14 30Z" fill="url(#thailand-tp-mg)" ${SO}/>
        <path d="M22 28Q25 21 32 18M30 29Q33 22 40 19M38 28Q42 23 48 21" fill="none" stroke="#E08A16" stroke-width="1.3" stroke-linecap="round"/>
        ${EYES(26, 38, 40, 2.2)}${blush(21, 43, 44, 2, 1.3)}${smile(32, 43.4, 2)}
        <circle cx="20" cy="49" r="1.2" fill="#E8B83A"/><circle cx="44" cy="50" r="1.2" fill="#E8B83A"/>${spark(58, 8, 3.4, "#FFD86B")}`,
      thailand_lotus: `${lg("thailand-tp-lt", "#FFE4EE", "#F06A9E")}
        <ellipse cx="32" cy="52" rx="26" ry="6" fill="#4EA05A" ${SO}/>
        <path d="M10 48Q6 36 16 32Q20 40 24 48Z" fill="url(#thailand-tp-lt)" ${S2}/><path d="M54 48Q58 36 48 32Q44 40 40 48Z" fill="url(#thailand-tp-lt)" ${S2}/>
        <path d="M18 50Q12 30 26 22Q30 34 30 50Z" fill="url(#thailand-tp-lt)" ${S2}/><path d="M46 50Q52 30 38 22Q34 34 34 50Z" fill="url(#thailand-tp-lt)" ${S2}/>
        <path d="M32 50Q20 34 32 12Q44 34 32 50Z" fill="url(#thailand-tp-lt)" ${SO}/>
        <path d="M32 16Q28 28 32 42" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        ${EYES(28, 36, 40, 1.8)}${smile(32, 43, 1.6, 1.4)}${spark(10, 14, 3.6, "#FFD86B")}${spark(56, 18, 2.6, "#FFD86B")}`,
      thailand_chedi: `${lg("thailand-tp-ch", "#FFE48A", "#D8961E", 1, 0)}
        <path d="M8 60H56V55H50V50H14V55H8Z" fill="#FFFDF4" ${SO}/>
        <path d="M17 50C17 38 22 32 28 29H36C42 32 47 38 47 50Z" fill="url(#thailand-tp-ch)" ${SO}/>
        <path d="M28 29V25H36V29Z" fill="url(#thailand-tp-ch)" ${S2}/>
        <path d="M29 25L31 6H33L35 25Z" fill="url(#thailand-tp-ch)" ${S2}/>
        <path d="M30 20H34M30.6 15H33.4M31 10.5H33" stroke="#A86A14" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M18 44H46" stroke="#A86A14" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M22 46Q22 38 26 34" fill="none" stroke="#FFF6C8" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(27, 37, 40, 2)}${blush(23, 41, 43.6, 1.8, 1.2)}
        ${spark(32, 3, 4.4, "#FFF2A0")}${spark(53, 22, 3, "#FFD86B")}${spark(11, 26, 2.6, "#FFD86B")}`,
      thailand_longtail: `${lg("thailand-tp-bt", "#A8683E", "#6A4026")}
        <path d="M2 52Q32 58 62 52" fill="none" stroke="#5ACCC4" stroke-width="3" stroke-linecap="round"/>
        <path d="M4 42H44Q52 40 56 22L58 16L61 17Q60 36 50 46Q46 50 38 50H10Q4 50 4 42Z" fill="url(#thailand-tp-bt)" ${SO}/>
        <path d="M5 42.5H46Q53 40 56 26" fill="none" stroke="#2E86C8" stroke-width="2.4"/>
        <path d="M14 42V30M36 42V30" stroke="${O}" stroke-width="1.6"/>
        <path d="M10 26H40V31H10Z" fill="#E8487A" ${SOw(1.6)}/><path d="M16 26V31M22 26V31M28 26V31M34 26V31" stroke="#fff" stroke-width="2.4"/>
        <path d="M60 17Q56 24 58 30M60 17Q62 25 60 31" fill="none" stroke="#FFE070" stroke-width="2" stroke-linecap="round"/><circle cx="60" cy="17" r="2.2" fill="#E8487A" ${SOw(1)}/>
        <path d="M6 40L-2 50" stroke="${O}" stroke-width="2" stroke-linecap="round"/><rect x="3" y="33" width="7" height="6" rx="1.4" fill="#7A8494" ${SOw(1.4)}/>`,
      thailand_krathong: `${rg("thailand-tp-kg", "#FFE6A0", "#FFE6A0", .5, .5)}
        <defs><radialGradient id="thailand-tp-kl"><stop offset="0" stop-color="#FFD06A" stop-opacity=".7"/><stop offset="1" stop-color="#FFD06A" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="18" r="16" fill="url(#thailand-tp-kl)"/>
        <path d="M6 44H58Q58 56 32 56Q6 56 6 44Z" fill="#3E8A3E" ${SO}/>
        ${[10, 18, 26, 34, 42, 50].map((x, i) => `<path d="M${x - 4} 45L${x} ${i % 2 ? 34 : 37}L${x + 4} 45Z" fill="${i % 2 ? "#5EAA4E" : "#4E9A4A"}" ${SOw(1.4)}/>`).join("")}
        ${[[18, 40, "#FF9A2A"], [46, 40, "#FF9A2A"], [26, 37, "#FFFFFF"], [38, 37, "#F27AAE"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${petals(0, 0, 6, 2, 2.2, 1.6, c, SOw(.8))}</g>`).join("")}
        <rect x="29" y="22" width="6" height="16" rx="1.4" fill="#FFF4D8" ${S2}/>
        <path d="M32 9C35 13 35 17 32 19.4C29 17 29 13 32 9Z" fill="#FFB040" ${SOw(1.4)}/>
        <path d="M40 38L43 20M43 38L47 21" stroke="#8A4A2A" stroke-width="1.4" stroke-linecap="round"/><circle cx="43" cy="20" r="1.4" fill="#FF5A3A"/><circle cx="47" cy="21" r="1.4" fill="#FF5A3A"/>
        ${EYES(26, 38, 49, 1.8)}${smile(32, 51.6, 1.6, 1.4)}`,
      thailand_badge: `${lg("thailand-tp-bd", "#16807A", "#0E5A58")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#thailand-tp-bd)" ${SO}/>
        ${T("SAWASDEE", 32, 30, 9, "#FFE08A", 44)}${T("STUDY!", 32, 43, 11, "#FFFFFF", 38)}
        ${frang(8, 14, .9, "#FFFFFF")}${frang(56, 50, .8, "#FFC6D8")}${spark(56, 10, 3.4, "#FFE27A")}`
    }},
    pins: [
      {id: "tp-thailand-chedi", name: "Golden Chedi Pin", kind: "badge", desc: "A tiny golden chedi on a white base, catching the sun.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="thailand-tpp-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE48A"/><stop offset="1" stop-color="#C8861A"/></linearGradient></defs>
          <circle cx="15" cy="15" r="13" fill="#16807A" stroke="#0A4A48" stroke-width="1.1"/>
          <path d="M7 24H23V22H21V20H9V22H7Z" fill="#FFFDF4" stroke="#7A5A1A" stroke-width=".6"/>
          <path d="M10 20C10 15 12 13 14 12H16C18 13 20 15 20 20Z M14 12V10.4H16V12Z M14.4 10.4L14.8 4H15.2L15.6 10.4Z" fill="url(#thailand-tpp-c)" stroke="#7A5A1A" stroke-width=".6" stroke-linejoin="round"/>
          <path d="M5 8L6 6L7 8L6 10Z M23.5 7.5L24.3 6L25 7.5L24.3 9Z" fill="#FFE08A"/></svg>`},
      {id: "tp-thailand-frangipani", name: "Frangipani Washi", kind: "tape", desc: "Turquoise washi tape scattered with white and pink frangipani.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#3EC6BA" opacity=".88"/>
          <path d="M6 20Q24 16 44 19Q62 22 80 18" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
          ${[[14, 12, "#FFFFFF"], [32, 14, "#FFC6D8"], [50, 11, "#FFFFFF"], [68, 13, "#FFC6D8"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${petals(0, 0, 5, 2.8, 3, 1.7, c)}<circle r="1.2" fill="#FFC83A"/></g>`).join("")}
          ${[[23, 8], [41, 18], [59, 7], [77, 19]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="1.5" fill="#3E8E48" transform="rotate(-30 ${x} ${y})"/>`).join("")}</svg>`}
    ],
    card: {id: "tp-thailand", name: "Andaman Bay", desc: "A sunlit Andaman bay: limestone karsts rise from both edges, a golden chedi sits on a green islet and a longtail boat crosses the sea. Moonlit blue in dark mode."}
  });
})();
/* end of module 96-tp-thailand.js */


