/* Theme Collection, world theme */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const ring = (cx, cy, n, r, fn, a0 = -Math.PI / 2) => Array.from({length: n}, (_, i) => { const a = a0 + i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), i); }).join("");
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const flower = (x, y, r, c, ow = 1) => ring(x, y, 5, r * .6, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * .52)}" fill="${c}" ${SOw(ow)}/>`) + `<circle cx="${x}" cy="${y}" r="${f1(r * .34)}" fill="#FFD23F"/>`;
  const tflower = (x, y, r, c = "#2C58B2") => ring(x, y, 4, r * .55, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * .42)}" fill="${c}"/>`, Math.PI / 4) + `<circle cx="${x}" cy="${y}" r="${f1(r * .28)}" fill="#F2B43A"/>`;
  // a papel picado flag of width w hung from (x, y)
  const papel = (x, y, w, c) => { const h = w * 1.2, s = w / 16; let hem = ""; for (let z = 1; z <= 6; z++) hem += `L${f1(x + w / 2 - z * w / 6)} ${f1(y + h - (z % 2 ? 2.4 * s : 0))}`;
    return `<path d="M${f1(x - w / 2)} ${y}H${f1(x + w / 2)}V${f1(y + h)}${hem}Z" fill="${c}" ${SOw(1.3)}/>` + ring(x, y + h * .46, 6, w * .14, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(w * .07)}" fill="#fff"/>`) + `<path d="M${f1(x - w * .3)} ${f1(y + h * .12)}l${f1(w * .07)} ${f1(w * .09)}l${f1(-w * .07)} ${f1(w * .09)}l${f1(-w * .07)} ${f1(-w * .09)}Z M${f1(x + w * .3)} ${f1(y + h * .12)}l${f1(w * .07)} ${f1(w * .09)}l${f1(-w * .07)} ${f1(w * .09)}l${f1(-w * .07)} ${f1(-w * .09)}Z" fill="#fff"/>`; };
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const spire = (x, yb, w, h) => `<path d="M${x - w / 2} ${yb}L${x} ${yb - h}L${x + w / 2} ${yb}Z" fill="#F2A08E" ${S15}/>`;

  TP_DATA.push({
    theme: "mexico",
    pack: {name: "Fiesta en la Plaza", items: {
      mexico_cathedral: `${lg("wm-mx-ca", "#F7B4A2", "#E08A78")}
        ${spire(32, 20, 12, 18)}<circle cx="32" cy="1.6" r="1.6" fill="#F2A08E" ${SOw(1)}/>
        <path d="M24 34V20H40V34Z M26 20V14H38V20Z" fill="url(#wm-mx-ca)" ${S2}/>
        ${spire(13, 34, 8, 14)}${spire(51, 34, 8, 14)}
        <path d="M8 60V34H18V60Z M46 60V34H56V60Z M16 60V34H48V60Z" fill="url(#wm-mx-ca)" ${SO}/>
        <path d="M27 60V50Q27 43 32 41Q37 43 37 50V60Z" fill="#5C3044" ${S15}/>
        <path d="M29 30V25Q29 22.4 30.6 22Q32 22.4 32 25V30Z M32 30V25Q32 22.4 33.6 22Q35 22.4 35 25V30Z" fill="#5C3044"/>
        <path d="M12 46V41Q13 38.6 13 38.6Q14 38.6 14 41V46Z M50 46V41Q51 38.6 51 38.6Q52 38.6 52 41V46Z" fill="#5C3044"/>
        ${spark(56, 16, 3.2, "#F2B43A")}${spark(7, 22, 2.6, "#E2468C")}`,
      mexico_papel: `<path d="M2 10Q32 22 62 10" fill="none" stroke="${O}" stroke-width="1.6"/>
        ${papel(12, 13.4, 16, "#E2468C")}${papel(32, 16, 16, "#F4B23A")}${papel(52, 13.4, 16, "#3462B6")}
        ${papel(22, 40, 14, "#8CC24E")}${papel(42, 40, 14, "#2AAEB0")}<path d="M10 39Q32 47 54 39" fill="none" stroke="${O}" stroke-width="1.4"/>`,
      mexico_cactus: `${lg("wm-mx-cc", "#8ED06A", "#3E8A3E", 1, 0)}${lg("wm-mx-pt", "#FFFFFF", "#E2DED6")}
        <path d="M24 46V18C24 6 40 6 40 18V46Z" fill="url(#wm-mx-cc)" ${SO}/>
        <path d="M24 34H16Q12 34 12 30V22Q12 18 16 18Q18 18 18 22V28H24Z M40 30H47V20Q47 16 50 16Q53 16 53 20V30Q53 36 48 36H40Z" fill="#5EAE4E" ${S2}/>
        <path d="M32 10V44" stroke="#3E8A3E" stroke-width="1.4" opacity=".6"/>
        ${flower(26, 9, 5.4, "#F27AB0")}${flower(38, 9, 5.4, "#FFB04A")}${flower(32, 5, 6, "#E2468C")}
        <path d="M17 44H47L44 52L42 60H22L20 52Z" fill="url(#wm-mx-pt)" ${SO}/><rect x="15" y="42" width="34" height="5" rx="2" fill="#F2B43A" ${S15}/>
        ${tflower(26, 54, 5)}${tflower(38, 54, 5)}
        ${EYES(28, 36, 26, 2)}${smile(32, 31, 1.8, 1.6)}${blush(25, 39, 30, 1.8, 1.1)}`,
      mexico_axolotl: `${rg("wm-mx-ax", "#FFE6EE", "#F59AB8", .45, .35)}
        ${[[14, 26, -150], [12, 34, 180], [14, 42, 150]].map(([x, y, a]) => `<path d="M${x} ${y - 2.4}C${x + 7} ${y - 4.4} ${x + 13} ${y - 3} ${x + 16} ${y}C${x + 13} ${y + 3} ${x + 7} ${y + 4.4} ${x} ${y + 2.4}Z" transform="rotate(${a} ${x} ${y})" fill="#F0507E" ${SOw(1.6)}/>`).join("")}
        ${[[50, 26, -30], [52, 34, 0], [50, 42, 30]].map(([x, y, a]) => `<path d="M${x} ${y - 2.4}C${x + 7} ${y - 4.4} ${x + 13} ${y - 3} ${x + 16} ${y}C${x + 13} ${y + 3} ${x + 7} ${y + 4.4} ${x} ${y + 2.4}Z" transform="rotate(${a} ${x} ${y})" fill="#F0507E" ${SOw(1.6)}/>`).join("")}
        <path d="M18 56C18 46 24 42 32 42C40 42 46 46 46 56Z" fill="#FFC2D4" ${S2}/>
        <path d="M32 16C48 16 54 26 54 34C54 44 45 50 32 50C19 50 10 44 10 34C10 26 16 16 32 16Z" fill="url(#wm-mx-ax)" ${SO}/>
        <path d="M17 28Q20 22 26 20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(23, 41, 33, 2.4)}<path d="M26 40Q32 44.4 38 40" fill="none" stroke="${O}" stroke-width="1.9" stroke-linecap="round"/>${blush(18, 46, 39, 2.4, 1.5)}`,
      mexico_concha: `${rg("wm-mx-cb", "#FFE0A0", "#D88A36", .45, .3)}${rg("wm-mx-cs", "#FFF0F4", "#F29AB8", .45, .3)}
        <path d="M6 42C6 34 16 30 32 30C48 30 58 34 58 42C58 54 48 58 32 58C16 58 6 54 6 42Z" fill="url(#wm-mx-cb)" ${SO}/>
        <path d="M5 38C4 20 18 10 32 10C46 10 60 20 59 38C52 42 12 42 5 38Z" fill="url(#wm-mx-cs)" ${SO}/>
        ${[-24, -12, 0, 12, 24].map(d => `<path d="M${32 + d * .2} 40Q${32 + d * .62} 26 ${32 + d * .8} 13" fill="none" stroke="#E07A9E" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`).join("")}
        <path d="M12 32Q32 22 52 32" fill="none" stroke="#E07A9E" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <path d="M13 24Q17 16 25 14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(25, 39, 47, 2.2)}${smile(32, 51, 2, 1.6)}${blush(20, 44, 51, 2, 1.3)}`,
      mexico_balloons: `${[[20, 20, "#E2468C"], [42, 17, "#3462B6"], [31, 29, "#F4B23A"], [12, 36, "#8CC24E"], [50, 34, "#F27A5A"]].map(([x, y, c]) => `<path d="M${x} ${y + 10}L32 60" stroke="${O}" stroke-width="1.1"/>`).join("")}
        ${[[20, 20, "#E2468C"], [42, 17, "#3462B6"], [31, 29, "#F4B23A"], [12, 36, "#8CC24E"], [50, 34, "#F27A5A"]].map(([x, y, c]) => `<path d="M${x} ${y + 9}C${x - 11} ${y + 4} ${x - 9} ${y - 10} ${x} ${y - 10}C${x + 9} ${y - 10} ${x + 11} ${y + 4} ${x} ${y + 9}Z" fill="${c}" ${S2}/><ellipse cx="${x - 3}" cy="${y - 4}" rx="1.6" ry="3" fill="#fff" opacity=".6" transform="rotate(25 ${x - 3} ${y - 4})"/>`).join("")}
        ${EYES(27.6, 34.4, 29, 1.7)}${smile(31, 33, 1.5, 1.4)}`,
      mexico_talavera: `<rect x="6" y="6" width="52" height="52" rx="6" fill="#FFFBF3" ${SO}/>
        ${ring(32, 32, 8, 15, (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#2C58B2"/>`)}<circle cx="32" cy="32" r="10" fill="#FFFBF3"/>${tflower(32, 32, 14, "#2C58B2")}
        ${[[6, 6], [58, 6], [6, 58], [58, 58]].map(([x, y]) => `<path d="M${x} ${y - 9}Q${x + 5} ${y} ${x} ${y + 9}Q${x - 5} ${y} ${x} ${y - 9}Z M${x - 9} ${y}Q${x} ${y + 5} ${x + 9} ${y}Q${x} ${y - 5} ${x - 9} ${y}Z" fill="#F2B43A"/>`).join("")}
        <rect x="6" y="6" width="52" height="52" rx="6" fill="none" ${SO}/>`,
      mexico_badge: `${lg("wm-mx-bd", "#E2468C", "#A82E62")}
        <path d="M32 3L37 8L44 5L46 12L53 13L52 20L58 24L54 30L58 36L52 40L53 47L46 48L44 55L37 52L32 57L27 52L20 55L18 48L11 47L12 40L6 36L10 30L6 24L12 20L11 13L18 12L20 5L27 8Z" fill="url(#wm-mx-bd)" ${SO}/>
        <circle cx="32" cy="30" r="19" fill="none" stroke="#FFD23F" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>
        ${T("¡HOLA!", 32, 30, 11, "#FFFFFF", 30)}${T("AMIGO", 32, 41, 8, "#FFE08A", 26)}
        ${flower(32, 16, 4, "#F4B23A", .8)}`
    }},
    pins: [
      {id: "tp-mexico-talavera", name: "Talavera Tile Pin", kind: "badge", desc: "A glazed white talavera tile with a cobalt flower and a saffron heart.",
        svg: `<svg viewBox="0 0 30 30"><rect x="2" y="2" width="26" height="26" rx="4" fill="#FFFBF3" stroke="#1C3A80" stroke-width="1.2"/>${ring(15, 15, 4, 6, (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#2C58B2"/>`, Math.PI / 4)}<circle cx="15" cy="15" r="2.6" fill="#F2B43A"/>${[[2, 2], [28, 2], [2, 28], [28, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#2C58B2"/>`).join("")}<ellipse cx="9" cy="7.6" rx="2.4" ry="1.1" fill="#fff" opacity=".7" transform="rotate(-30 9 7.6)"/></svg>`},
      {id: "tp-mexico-papel", name: "Papel Picado Washi", kind: "tape", desc: "Bright washi tape with a row of little papel picado flags.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFF3E2" opacity=".95"/><path d="M4 5Q43 11 82 5" fill="none" stroke="#6E5A62" stroke-width=".8"/>
          ${["#E2468C", "#F4B23A", "#3462B6", "#8CC24E", "#F27A5A", "#2AAEB0", "#9A6AE0"].map((c, i) => { const x = 10 + i * 11, y = 5 + Math.sin((i + .5) / 7 * Math.PI) * 3; return `<path d="M${x - 4.4} ${f1(y)}H${x + 4.4}V${f1(y + 12)}L${x + 2.2} ${f1(y + 10.6)}L${x} ${f1(y + 12)}L${x - 2.2} ${f1(y + 10.6)}L${x - 4.4} ${f1(y + 12)}Z" fill="${c}"/><circle cx="${x}" cy="${f1(y + 5.4)}" r="1.6" fill="#FFF3E2"/>`; }).join("")}</svg>`}
    ],
    card: {id: "tp-mexico", name: "Plaza Fiesta", desc: "Warm cream paper under a string of papel picado, with a talavera tile corner and a rainbow row of hillside houses. Starry plum at night."}
  });
})();
