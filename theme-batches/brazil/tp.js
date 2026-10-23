/* Theme Collections, Around the World */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  // a hibiscus: five round petals and a long stamen
  const hibiscus = (cx, cy, r, fill, sw = 1.4) => Array.from({length: 5}, (_, i) => { const a = (-90 + i * 72) * Math.PI / 180, px = f1(cx + Math.cos(a) * r * .55), py = f1(cy + Math.sin(a) * r * .55);
    return `<ellipse cx="${px}" cy="${py}" rx="${f1(r * .56)}" ry="${f1(r * .44)}" transform="rotate(${-90 + i * 72} ${px} ${py})" fill="${fill}" ${SOw(sw)}/>`; }).join("") + `<path d="M${cx} ${cy}L${f1(cx + r * .6)} ${f1(cy - r * .7)}" stroke="#FFD23A" stroke-width="${f1(r * .14)}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${f1(r * .2)}" fill="#C8203A"/>`;
  // the black-and-white waves of the promenade mosaic, x0..x1 between y0 and y1
  const waves = (x0, x1, y0, y1, n, lam, c) => Array.from({length: n}, (_, k) => { const yc = y0 + (y1 - y0) * (k + .5) / n, t = (y1 - y0) / n * .5, top = [], bot = [];
    for (let x = x0; x <= x1; x += 1.5) { const y = yc + t * .9 * Math.sin(2 * Math.PI * x / lam); top.push(`${f1(x)} ${f1(y - t / 2)}`); bot.unshift(`${f1(x)} ${f1(y + t / 2)}`); }
    return `<path d="M${top.join("L")}L${bot.join("L")}Z" fill="${c}"/>`; }).join("");
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";

  TP_DATA.push({
    theme: "brazil",
    pack: {name: "Rio Beach Days", items: {
      brazil_sugarloaf: `${lg("brazil-tp-sk", "#7CC6F0", "#FCE8C4")}
        <rect x="3" y="5" width="58" height="54" rx="12" fill="url(#brazil-tp-sk)" ${SO}/>
        <path d="M30 59C30 36 36 16 46 14C56 13 60 34 61 59Z" fill="#A6A8B2" ${S2}/>
        <path d="M48 15C55 19 59 36 61 59H53C53 40 52 26 48 15Z" fill="#868B9A"/>
        <path d="M3 59V48C8 40 18 38 24 42C30 36 38 40 40 50L40 59Z" fill="#4E9150" ${S2}/>
        <path d="M24 42L45 16" stroke="${O}" stroke-width="1.4"/><rect x="31" y="27" width="7" height="5.4" rx="1.4" fill="#F2EEE6" ${SOw(1.2)}/><path d="M34.6 27V25.4" stroke="${O}" stroke-width="1.2"/>
        <path d="M5 54Q32 50 59 54" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>${spark(12, 14, 3.6, "#FFD23A")}`,
      brazil_toucan: `${lg("brazil-tp-bk", "#FFC23A", "#F2601A", 1, 0)}
        <path d="M14 58C10 46 12 26 24 20C32 16 40 20 42 30C44 42 40 54 34 60Z" fill="#26232E" ${SO}/>
        <path d="M26 36C34 34 40 40 38 50C36 56 30 58 26 54C22 48 22 38 26 36Z" fill="#FFF6D8" ${S2}/>
        <path d="M34 22C44 18 58 22 62 32C60 36 56 36 52 34C46 32 40 32 36 34Z" fill="url(#brazil-tp-bk)" ${S2}/>
        <path d="M55 24C59 26 61 29 62 32C60 36 56 36 53 35Z" fill="#26232E"/>
        <circle cx="30" cy="27" r="5" fill="#5AA8F0" stroke="#FF9A2A" stroke-width="2"/><circle cx="30.6" cy="27" r="2" fill="${O}"/><circle cx="31.4" cy="26.2" r=".7" fill="#fff"/>
        <path d="M8 60H40" stroke="#8A5A3A" stroke-width="4" stroke-linecap="round"/>`,
      brazil_monstera: `${lg("brazil-tp-mo", "#6CC05A", "#2E8A3E")}
        <path d="M32 58C14 52 6 36 10 22C14 10 26 6 32 12C38 6 50 10 54 22C58 36 50 52 32 58Z" fill="url(#brazil-tp-mo)" ${SO}/>
        <path d="M32 58V14M32 26L16 20M32 34L12 32M32 42L16 46M32 26L48 20M32 34L52 32M32 42L48 46" fill="none" stroke="#1E6A30" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 26L22 28L13 30ZM52 26L42 28L51 30ZM14 40L24 38L17 44ZM50 40L40 38L47 44Z" fill="#FFFFFF" ${SOw(1)}/>
        <path d="M32 58L30 63" stroke="#2E8A3E" stroke-width="3" stroke-linecap="round"/>`,
      brazil_coconut: `${rg("brazil-tp-co", "#B8E070", "#4E9A34")}
        <path d="M32 18C48 18 56 30 56 42C56 54 46 61 32 61C18 61 8 54 8 42C8 30 16 18 32 18Z" fill="url(#brazil-tp-co)" ${SO}/>
        <ellipse cx="32" cy="22.6" rx="12" ry="3.6" fill="#FFFBEA" ${S2}/>
        <path d="M34 22L40 6L45 3" fill="none" stroke="${O}" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 22L40 6L45 3" fill="none" stroke="#FF5A8A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="25" cy="40" r="2" fill="${O}"/><circle cx="39" cy="40" r="2" fill="${O}"/>${smile(32, 45, 2.4, 1.8)}
        ${hibiscus(50, 30, 8, "#FF5A6A", 1.2)}`,
      brazil_umbrella: `<path d="M6 54Q32 48 58 54V61H6Z" fill="#F3D498" ${S2}/>
        <path d="M32 58V14" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/><path d="M32 58V14" stroke="#B08A6A" stroke-width="1.6" stroke-linecap="round"/>
        ${[0, 1, 2, 3, 4, 5].map(i => { const a0 = Math.PI + i / 6 * Math.PI, a1 = Math.PI + (i + 1) / 6 * Math.PI, R = 27; return `<path d="M32 12L${f1(32 + Math.cos(a0) * R)} ${f1(26 + Math.sin(a0) * 2)}Q${f1(32 + Math.cos((a0 + a1) / 2) * R)} ${f1(30)} ${f1(32 + Math.cos(a1) * R)} ${f1(26 + Math.sin(a1) * 2)}Z" fill="${["#FFD23A", "#1FA34A", "#2A7AD6", "#FFD23A", "#1FA34A", "#2A7AD6"][i]}" ${SOw(1.6)}/>`; }).join("")}
        <circle cx="32" cy="11" r="2.4" fill="#fff" ${SOw(1.2)}/>${spark(54, 8, 3.6, "#FFD23A")}`,
      brazil_macaw: `${lg("brazil-tp-mw", "#2A6AD0", "#1E4AA0")}
        <path d="M18 60C20 46 26 38 34 36L46 58Z" fill="url(#brazil-tp-mw)" ${S2}/><path d="M24 50C26 42 30 38 36 37L40 46Z" fill="#FFC81E"/>
        <path d="M26 40C22 28 26 12 38 8C48 6 54 14 52 24C50 34 42 40 34 42Z" fill="#E2302A" ${SO}/>
        <ellipse cx="42" cy="18" rx="6.4" ry="5.6" fill="#FFF8F0" ${SOw(1.2)}/><circle cx="42" cy="17.6" r="2" fill="${O}"/>
        <path d="M48 16C56 14 60 20 58 28C56 26 52 25 49 25Z" fill="#F2E8D8" ${S2}/><path d="M49 25C52 25 55 26 57 29C54 30 51 29 49 27Z" fill="#2A2430"/>
        <path d="M30 26Q34 30 38 30" fill="none" stroke="#FF7A6A" stroke-width="1.6" stroke-linecap="round"/>`,
      brazil_waves: `<rect x="4" y="10" width="56" height="44" rx="10" fill="#F8F5EE" ${SO}/>
        <defs><clipPath id="brazil-tp-wc"><rect x="5" y="11" width="54" height="42" rx="9"/></clipPath></defs><g clip-path="url(#brazil-tp-wc)">${waves(4, 60, 11, 53, 4, 18, "#2C2B32")}</g>
        ${spark(56, 8, 4, "#FFD23A")}${spark(8, 56, 3, "#1FA34A")}`,
      brazil_badge: `${lg("brazil-tp-bd", "#1E8A5A", "#11603E")}
        <rect x="3" y="14" width="58" height="36" rx="10" fill="url(#brazil-tp-bd)" ${SO}/>
        <path d="M5 44Q12 40 19 44T33 44T47 44T61 44V46Q61 50 57 50H7Q3 50 3 46Z" fill="#FFD23A" opacity=".85"/>
        ${T("BOA!", 32, 37, 15, "#FFFFFF", 36)}
        ${hibiscus(54, 14, 7, "#FF5A6A", 1.4)}${spark(9, 50, 4, "#FFD23A")}`
    }},
    pins: [
      {id: "tp-brazil-hibiscus", name: "Hibiscus Pin", kind: "badge", desc: "A bright beach hibiscus with a golden stamen.",
        svg: `<svg viewBox="0 0 30 30">${hibiscus(15, 15.4, 12.4, "#FF5A6A", 1)}
          <ellipse cx="11" cy="8.6" rx="2" ry="1.1" fill="#fff" opacity=".6" transform="rotate(-30 11 8.6)"/></svg>`},
      {id: "tp-brazil-calcadao", name: "Promenade Waves Tape", kind: "tape", desc: "Washi tape printed with the black-and-white waves of the Rio promenade.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="tp-brazil-calcadao-c"><path d="${tapeEdge}"/></clipPath></defs><path d="${tapeEdge}" fill="#F8F5EE" opacity=".95"/>
          <g clip-path="url(#tp-brazil-calcadao-c)">${waves(0, 86, 1.5, 24.5, 3, 14, "#2C2B32")}</g></svg>`}
    ],
    card: {id: "tp-brazil", name: "Rio Beach", desc: "Sunny paper with Sugarloaf and its cable car in the corner and the beach, umbrellas and wave mosaic below. Night blue in dark mode."}
  });
})();
