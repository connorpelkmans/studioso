/* Theme Collections, around the world: australia (Sydney Harbour) */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // one shell: back end (bx, by), w long, h tall, tip to the right
  const shell = (bx, by, w, h, fill, line) => `<path d="M${f1(bx)} ${f1(by)}C${f1(bx + w * .02)} ${f1(by - h * .62)} ${f1(bx + w * .42)} ${f1(by - h)} ${f1(bx + w * .9)} ${f1(by - h)}Q${f1(bx + w * .84)} ${f1(by - h * .46)} ${f1(bx + w)} ${f1(by)}Z" fill="${fill}" ${SOw(1.6)}/><path d="M${f1(bx + w * .9)} ${f1(by - h)}Q${f1(bx + w * .66)} ${f1(by - h * .42)} ${f1(bx + w * .55)} ${f1(by)}" fill="none" stroke="${line}" stroke-width="1.1"/>`;
  // the Opera House: four shells and the podium, base centre (x, y), sized by k
  const opera = (x, y, k, fill, line, pod) => `<rect x="${f1(x - 26 * k)}" y="${f1(y)}" width="${f1(52 * k)}" height="${f1(6 * k)}" rx="1" fill="${pod}" ${SOw(1.6)}/>` +
    shell(x - 1 * k, y, 22 * k, 28 * k, fill, line) + shell(x - 12 * k, y, 18 * k, 21 * k, fill, line) + shell(x - 20 * k, y, 14 * k, 15 * k, fill, line) + shell(x - 25 * k, y, 10 * k, 10 * k, fill, line);
  // the bridge arch: the two chords, a few posts, the deck and pylons, between x0 and x1 with the deck at y
  const bridge = (x0, x1, y, h, steel, gran) => { const m = (x0 + x1) / 2, w = x1 - x0, py = u => f1(y - h * (1 - Math.pow(2 * u - 1, 2)));
    let posts = ""; for (let i = 1; i < 10; i++) { const u = i / 10, x = f1(x0 + w * u); posts += `M${x} ${py(u)}V${f1(Math.min(y, +py(u) + h * .22 + 4))}`; }
    return `<path d="M${x0} ${y + 4}Q${m} ${f1(y - h * 2)} ${x1} ${y + 4}" fill="none" stroke="${O}" stroke-width="5.4"/><path d="M${x0} ${y + 4}Q${m} ${f1(y - h * 2)} ${x1} ${y + 4}" fill="none" stroke="${steel}" stroke-width="2.6"/>
      <path d="M${x0 + 3} ${y + 4}Q${m} ${f1(y - h * 1.5)} ${x1 - 3} ${y + 4}" fill="none" stroke="${steel}" stroke-width="1.8"/><path d="${posts}" stroke="${steel}" stroke-width="1"/>
      <rect x="${x0 - 8}" y="${y}" width="${w + 16}" height="3" fill="${steel}" ${SOw(1.2)}/>
      <rect x="${x0 - 5}" y="${f1(y - h * .5)}" width="7" height="${f1(h * .5 + 12)}" fill="${gran}" ${SOw(1.4)}/><rect x="${x1 - 2}" y="${f1(y - h * .5)}" width="7" height="${f1(h * .5 + 12)}" fill="${gran}" ${SOw(1.4)}/>`; };

  TP_DATA.push({
    theme: "australia",
    pack: {name: "Harbour Postcards", items: {
      australia_opera: `${lg("au-sky", "#BFE2F6", "#F8EAD0")}${lg("au-sh", "#FFFFFF", "#E2DED2")}
        <circle cx="32" cy="32" r="27" fill="url(#au-sky)" ${SO}/>
        <path d="M6 42Q32 38 58 42V46Q32 58 6 46Z" fill="#3A82BA"/>
        ${opera(34, 40, 1, "url(#au-sh)", "#B8B0A0", "#D9B48C")}
        <path d="M14 50H24M36 52H48M22 54H30" stroke="#BFE2F6" stroke-width="1.6" stroke-linecap="round"/>
        ${spark(14, 16, 3.6, "#FFE27A")}${spark(50, 12, 2.6, "#FFFFFF")}`,
      australia_bridge: `${lg("au-br", "#D6ECF8", "#86C8F2")}
        <rect x="4" y="10" width="56" height="44" rx="10" fill="url(#au-br)" ${SO}/>
        <rect x="6" y="42" width="52" height="10" rx="2" fill="#2E78B0"/>
        ${bridge(14, 50, 38, 12, "#6A7A8A", "#D9C29E")}
        <path d="M18 48H26M36 47H44" stroke="#CDE8F6" stroke-width="1.6" stroke-linecap="round"/>
        ${spark(54, 14, 3.4, "#FFE27A")}`,
      australia_koala: `${lg("au-ko", "#C4C4CE", "#9494A2")}
        <circle cx="13" cy="20" r="10" fill="#A8A8B4" ${S2}/><circle cx="13" cy="21" r="5.6" fill="#F4F2F2"/><circle cx="51" cy="20" r="10" fill="#A8A8B4" ${S2}/><circle cx="51" cy="21" r="5.6" fill="#F4F2F2"/>
        <ellipse cx="32" cy="34" rx="20" ry="18" fill="url(#au-ko)" ${SO}/>
        <path d="M32 30C36 30 37.6 34 37 38C36.6 41 34.6 43 32 43C29.4 43 27.4 41 27 38C26.4 34 28 30 32 30Z" fill="#33303C" ${SOw(1.4)}/>
        ${EYES(23.5, 40.5, 31, 2.2)}${blush(20, 44, 38, 2.2, 1.4)}${smile(32, 46, 2)}
        <path d="M18 54Q32 60 46 54" fill="none" stroke="#7A5A3A" stroke-width="4" stroke-linecap="round"/><path d="M40 55C44 50 52 50 54 53C50 57 44 57 40 55Z" fill="#8DB89A" ${SOw(1.4)}/>`,
      australia_kangaroo: `${lg("au-kg", "#EDB278", "#C8824A")}
        <path d="M40 46Q54 46 60 54Q56 57 42 52Z" fill="#C8824A" ${S2}/>
        <path d="M26 20C22 12 22 4 25 2C29 6 30 14 30 20Z" fill="#D9955A" ${S2}/><path d="M38 20C42 12 42 4 39 2C35 6 34 14 34 20Z" fill="#D9955A" ${S2}/>
        <path d="M32 30C42 30 46 40 46 48C46 56 40 60 32 60C24 60 18 56 18 48C18 40 22 30 32 30Z" fill="url(#au-kg)" ${SO}/>
        <path d="M24 48Q32 52 40 48Q39 57 32 57Q25 57 24 48Z" fill="#F6DFC0" ${SOw(1.4)}/><circle cx="32" cy="50" r="3.4" fill="#C8824A" ${SOw(1.2)}/>${EYES(29.6, 34.4, 50, 1)}
        <ellipse cx="32" cy="24" rx="12" ry="10" fill="url(#au-kg)" ${SO}/><ellipse cx="32" cy="28" rx="5.6" ry="4" fill="#F6DFC0"/><ellipse cx="32" cy="26" rx="2" ry="1.4" fill="${O}"/>
        ${EYES(27, 37, 21, 1.8)}${spark(54, 20, 3.2, "#FFE27A")}${spark(8, 36, 2.6, "#FFE27A")}`,
      australia_quokka: `${lg("au-qk", "#D2AA84", "#A47C5C")}
        <circle cx="19" cy="18" r="7" fill="#A88262" ${S2}/><circle cx="45" cy="18" r="7" fill="#A88262" ${S2}/>
        <path d="M32 12C46 12 52 22 52 32C52 46 42 54 32 54C22 54 12 46 12 32C12 22 18 12 32 12Z" fill="url(#au-qk)" ${SO}/>
        <ellipse cx="32" cy="40" rx="11" ry="9" fill="#EAD2B4"/><ellipse cx="32" cy="35" rx="3.2" ry="2.4" fill="${O}"/>
        ${EYES(24.5, 39.5, 29, 2.2)}${blush(20, 44, 38, 2.4, 1.5)}<path d="M25 41Q32 49 39 41" fill="#B84A4A" ${SOw(1.6)}/>
        ${spark(54, 50, 3.6, "#FFE27A")}${spark(8, 48, 2.8, "#FFE27A")}${spark(56, 10, 2.4, "#FFFFFF")}`,
      australia_ferry: `${lg("au-fw", "#7EB8DE", "#2E78B0")}
        <path d="M2 48Q16 44 32 48Q48 52 62 48V56H2Z" fill="url(#au-fw)"/>
        <path d="M6 40H58L54 48H10Z" fill="#2C6A44" ${S2}/><rect x="6" y="39" width="52" height="2.4" fill="#F2C641"/>
        <rect x="12" y="28" width="40" height="11" fill="#FBF2D8" ${S2}/><rect x="20" y="20" width="24" height="8" fill="#FBF2D8" ${S2}/><rect x="27" y="14" width="10" height="6" fill="#F2C641" ${SOw(1.6)}/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${15 + i * 6}" y="31" width="4" height="4" rx=".6" fill="#5E7E92"/>`).join("")}${[0, 1, 2].map(i => `<rect x="${23 + i * 6.4}" y="22.4" width="4" height="3.4" rx=".6" fill="#6E8EA2"/>`).join("")}
        <path d="M58 50Q62 52 64 50M0 52Q4 50 8 52" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>${spark(52, 10, 3.2, "#FFE27A")}`,
      australia_waratah: `${lg("au-wr", "#F25A48", "#B8282A")}
        <path d="M32 62V36" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 62V36" stroke="#4C7A48" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M32 54Q20 52 14 44Q24 44 32 50Z M32 48Q44 46 50 38Q40 38 32 44Z" fill="#4C7A48" ${S2}/>
        ${[-60, -35, -12, 12, 35, 60].map(a => `<path d="M32 34L${f1(32 + Math.sin(a * Math.PI / 180) * 20)} ${f1(36 + Math.cos(a * Math.PI / 180) * 6)}L${f1(32 + Math.sin(a * Math.PI / 180) * 10)} ${f1(30 + Math.cos(a * Math.PI / 180) * 4)}Z" fill="#D8362E" ${SOw(1.4)}/>`).join("")}
        <path d="M32 6C42 6 46 16 46 24C46 32 40 36 32 36C24 36 18 32 18 24C18 16 22 6 32 6Z" fill="url(#au-wr)" ${SO}/>
        ${[[26, 14], [32, 12], [38, 14], [23, 20], [29, 19], [35, 19], [41, 20], [24, 27], [30, 26], [36, 26], [40, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#FFB0A0" opacity=".8"/>`).join("")}
        ${spark(54, 12, 3.2, "#FFE27A")}`,
      australia_badge: `${lg("au-bd", "#24588A", "#163C62")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#au-bd)" ${SO}/>
        ${opera(47, 40, 0.5, "#FFFFFF", "#B8B0A0", "#D9B48C")}
        ${T("G'DAY!", 24, 37, 11, "#FFFFFF", 34)}
        ${spark(9, 10, 3.4, "#FFE27A")}${spark(56, 56, 3, "#F25A48")}`
    }},
    pins: [
      {id: "tp-australia-wattle", name: "Wattle Pin", kind: "badge", desc: "A sprig of golden wattle puffs on a little gum leaf.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="au-pin-w" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF0A0"/><stop offset="1" stop-color="#E8B020"/></radialGradient></defs>
          <path d="M6 26Q10 14 22 6Q20 18 6 26Z" fill="#7FAE8E" stroke="#3E5A44" stroke-width="1.1" stroke-linejoin="round"/><path d="M7 25Q13 16 21 7" fill="none" stroke="#4E7A5A" stroke-width=".8"/>
          ${[[11, 11, 4], [18, 16, 3.6], [8, 18, 3.2], [16, 9, 3], [22, 22, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#au-pin-w)" stroke="#9A7010" stroke-width=".9"/>`).join("")}
          <circle cx="10" cy="10" r="1" fill="#fff" opacity=".7"/></svg>`},
      {id: "tp-australia-harbour", name: "Harbour Washi", kind: "tape", desc: "Harbour-blue waves with a tiny white Opera House in the middle.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="au-pin-c"><path d="${tapeEdge}"/></clipPath></defs><path d="${tapeEdge}" fill="#D6ECF8" opacity=".95"/>
          <g clip-path="url(#au-pin-c)" opacity=".9">${Array.from({length: 9}, (_, i) => `<path d="M${i * 10 - 4} 21Q${i * 10 + 1} 17 ${i * 10 + 6} 21T${i * 10 + 16} 21V27H${i * 10 - 4}Z" fill="#3A82BA"/>`).join("")}</g>
          <circle cx="43" cy="12" r="8.6" fill="#FBF2D8"/>${opera(44, 15, 0.3, "#FFFFFF", "#B8B0A0", "#D9B48C").replace(/stroke-width="1.6"/g, 'stroke-width=".7"')}</svg>`}
    ],
    card: {id: "tp-australia", name: "Harbour Light", desc: "Sky-blue paper with the Opera House sails in the corner and harbour waves along the bottom. Night-blue with glowing sails and fireworks in dark mode."}
  });
})();
