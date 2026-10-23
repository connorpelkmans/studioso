/* ===== module: 96-tp-egypt.js ===== */
/* Theme Collection, Around the World: Egypt */
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
  // a papyrus umbel: rays fanning from the top of a stem at (x, y)
  const umbel = (x, y, r, c) => Array.from({length: 9}, (_, i) => { const a = -Math.PI * (0.05 + 0.9 * i / 8), cx = Math.cos(a), sy = Math.sin(a); return `<path d="M${x} ${y}Q${f1(x + cx * r * .55)} ${f1(y + sy * r * .6)} ${f1(x + cx * r)} ${f1(y + sy * r + r * .3 * cx * cx)}" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`; }).join("");

  TP_DATA.push({
    theme: "egypt",
    pack: {name: "Nile Treasures", items: {
      egypt_pyramid: `${rg("egypt-tp-sun", "#FFF6C8", "#F6B03A")}${lg("egypt-tp-pl", "#FFDA8A", "#F0B460")}${lg("egypt-tp-ps", "#E0A060", "#C4804C")}
        <circle cx="44" cy="17" r="11" fill="url(#egypt-tp-sun)" ${S2}/>
        <path d="M30 10L4 54H30Z" fill="url(#egypt-tp-ps)" ${SO}/><path d="M30 10L58 54H30Z" fill="url(#egypt-tp-pl)" ${SO}/>
        <path d="M30 10L26 16H34Z" fill="#F2C24A" ${SOw(1.4)}/>
        <path d="M21 25H39M17 32H43M13 39H48M9 46H53" stroke="#B8763E" stroke-width="1.2" opacity=".55"/>
        ${EYES(24, 36, 38, 2.4)}${blush(19.5, 40.5, 42.4, 2.2, 1.4)}${smile(30, 42, 2.2)}
        ${spark(58, 34, 3.4, "#FFE27A")}${spark(8, 14, 2.8, "#FFE27A")}`,
      egypt_sphinx: `${lg("egypt-tp-sx", "#F6CE8E", "#D9A064")}${lg("egypt-tp-nm", "#4A7BD0", "#2E5FA8")}
        <path d="M8 56C8 44 16 40 22 38L42 38C50 40 58 46 58 56Z" fill="url(#egypt-tp-sx)" ${SO}/>
        <path d="M18 26C14 34 12 44 14 50L24 46L22 30Z" fill="url(#egypt-tp-nm)" ${S2}/><path d="M46 26C50 34 52 44 50 50L40 46L42 30Z" fill="url(#egypt-tp-nm)" ${S2}/>
        <path d="M14 38L23 36M13 44L23 42M50 38L41 36M51 44L41 42" stroke="#F2C24A" stroke-width="2"/>
        <path d="M32 8C44 8 48 16 48 26C48 38 42 46 32 46C22 46 16 38 16 26C16 16 20 8 32 8Z" fill="url(#egypt-tp-sx)" ${SO}/>
        <path d="M16 22C18 10 26 7 32 7C38 7 46 10 48 22Q32 16 16 22Z" fill="url(#egypt-tp-nm)" ${S2}/><path d="M20 16H44M18 20H46" stroke="#F2C24A" stroke-width="1.8"/>
        ${EYES(26, 38, 31, 2.4)}${blush(22, 42, 36, 2.2, 1.4)}${smile(32, 37, 2.2)}
        <path d="M30 46V52Q32 55 34 52V46" fill="#B8763E" ${SOw(1.4)}/>`,
      egypt_felucca: `${lg("egypt-tp-sl", "#FFFFFF", "#EDE2CC")}
        <path d="M4 52Q18 48 32 52T60 52V60H4Z" fill="#7FB8CC" ${S2}/>
        <path d="M44 46L14 6Q24 26 16 44Q30 42 44 46Z" fill="url(#egypt-tp-sl)" ${SO}/>
        <path d="M46 48L10 2M30 46L32 12" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M8 46H56L50 54H14Z" fill="#6A4630" ${SO}/><path d="M11 48.4H53" stroke="#2F6FA8" stroke-width="2.6"/>
        ${EYES(26, 34, 30, 2)}${smile(30, 34, 1.8, 1.6)}
        <path d="M10 58Q14 56 18 58M40 58Q44 56 48 58" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
      egypt_scarab: `${lg("egypt-tp-sc", "#7FE0D2", "#2A5F9E")}
        <path d="M18 30L6 26M18 40L5 42M18 50L8 56M46 30L58 26M46 40L59 42M46 50L56 56" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M32 14C46 14 52 26 52 38C52 52 44 60 32 60C20 60 12 52 12 38C12 26 18 14 32 14Z" fill="url(#egypt-tp-sc)" ${SO}/>
        <path d="M14 34Q32 40 50 34M32 37V59" fill="none" stroke="#F2C24A" stroke-width="2"/>
        <path d="M22 18L24 10L28 15L32 8L36 15L40 10L42 18Q32 14 22 18Z" fill="#F2C24A" ${SOw(1.6)}/>
        ${EYES(26, 38, 26, 2.3)}${blush(21.5, 42.5, 30.6, 2, 1.3)}${smile(32, 29.6, 2)}
        ${SHINE(20, 44, 3, 5, 20)}${spark(56, 10, 3.4, "#FFE27A")}`,
      egypt_camel: `${lg("egypt-tp-cm", "#F6D6A4", "#D8A46C")}
        <path d="M16 40V58M24 42V58M40 42V58M48 40V58" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M16 40V58M24 42V58M40 42V58M48 40V58" stroke="#E2AE76" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M10 40C10 30 18 26 24 28C26 18 36 18 38 28C44 26 50 30 50 40C50 46 44 48 30 48C16 48 10 46 10 40Z" fill="url(#egypt-tp-cm)" ${SO}/>
        <path d="M22 28Q30 22 40 28L38 36Q30 32 24 36Z" fill="#C8503A" ${S2}/><path d="M24 33H38" stroke="#F2C24A" stroke-width="1.6"/>
        ${tube("M48 36Q54 30 52 20", "#E2AE76", 5)}
        <path d="M52 10C60 10 62 16 60 20C58 24 50 24 48 20C46 16 46 10 52 10Z" fill="url(#egypt-tp-cm)" ${S2}/>
        <circle cx="54" cy="15" r="1.8" fill="${O}"/><path d="M51 12.6l-1 -1.6M53 12l-.4 -1.8M55 12l.2 -1.8" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
        <path d="M8 40Q4 44 6 50" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`,
      egypt_lotus: `${lg("egypt-tp-lt", "#C8DAFF", "#4A7BD0")}
        <ellipse cx="32" cy="52" rx="26" ry="7" fill="#5EA070" ${SO}/><path d="M32 52L50 47" stroke="#3E7E52" stroke-width="1.6"/>
        <path d="M32 48Q18 40 12 24Q24 26 32 46Z" fill="url(#egypt-tp-lt)" ${S2}/><path d="M32 48Q46 40 52 24Q40 26 32 46Z" fill="url(#egypt-tp-lt)" ${S2}/>
        <path d="M32 48Q22 32 32 10Q42 32 32 48Z" fill="url(#egypt-tp-lt)" ${SO}/>
        <path d="M32 46Q26 36 22 30M32 46Q38 36 42 30" fill="none" stroke="#2E5FA8" stroke-width="1.2" opacity=".6"/>
        <circle cx="32" cy="42" r="3" fill="#FFD25A" ${SOw(1.2)}/>
        ${EYES(27.6, 36.4, 32, 1.8)}${smile(32, 35.6, 1.6, 1.4)}${spark(54, 12, 3, "#FFE27A")}`,
      egypt_palm: `${tube("M30 60Q34 44 32 24", "#9A6A42", 5)}
        <path d="M27.6 56H34M28.4 50H34.6M29 44H35M29.4 38H35M29.6 32H34.6" stroke="#6A4630" stroke-width="1.2"/>
        ${[[-150, 22], [-120, 20], [-90, 18], [-60, 20], [-30, 22], [-175, 18], [-5, 18]].map(([a, l]) => { const r = a * Math.PI / 180, ex = f1(32 + Math.cos(r) * l), ey = f1(24 + Math.sin(r) * l * .7 + l * .35); return `<path d="M32 24Q${f1(32 + Math.cos(r) * l * .5)} ${f1(24 + Math.sin(r) * l * .7 - 4)} ${ex} ${ey}Q${f1(32 + Math.cos(r) * l * .55)} ${f1(24 + Math.sin(r) * l * .5 + 2)} 32 26Z" fill="#6A9846" ${SOw(1.6)}/>`; }).join("")}
        <g fill="#B4602A" ${SOw(.8)}><circle cx="27" cy="30" r="2"/><circle cx="30" cy="32" r="2"/><circle cx="26" cy="34" r="2"/><circle cx="37" cy="30" r="2"/><circle cx="35" cy="33" r="2"/></g>`,
      egypt_badge: `${lg("egypt-tp-bd", "#2F5E96", "#1D3D6A")}
        <rect x="3" y="14" width="58" height="36" rx="10" fill="url(#egypt-tp-bd)" ${SO}/>
        <path d="M6 18H58M6 46H58" stroke="#F2C24A" stroke-width="1.6" stroke-dasharray="3 2"/>
        ${T("PYRA-", 30, 30, 10, "#FFE08A", 30)}${T("MAZING!", 32, 42.5, 10.5, "#FFFFFF", 44)}
        <path d="M50 30L56 40H44Z" fill="#F2C24A" ${SOw(1.4)}/>
        ${spark(9, 10, 3.4, "#FFE27A")}${spark(56, 56, 3, "#F6B42A")}`
    }},
    pins: [
      {id: "tp-egypt-scarab", name: "Scarab Pin", kind: "badge", desc: "A blue-green scarab with a golden crown, like a little faience charm.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="egypt-tpp-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FE0D2"/><stop offset="1" stop-color="#2A5F9E"/></linearGradient></defs>
          <path d="M8 13L3 11M8 17L2.6 18M8 21L4 24M22 13L27 11M22 17L27.4 18M22 21L26 24" stroke="#1F3A4A" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M15 5C22 5 24 11 24 16C24 23 20 27 15 27C10 27 6 23 6 16C6 11 8 5 15 5Z" fill="url(#egypt-tpp-s)" stroke="#1F3A4A" stroke-width="1.1"/>
          <path d="M7 14Q15 17 23 14M15 15.6V26.6" fill="none" stroke="#F2C24A" stroke-width="1.1"/>
          <path d="M10 7.6L11 4L13 6.4L15 3L17 6.4L19 4L20 7.6Q15 6 10 7.6Z" fill="#F2C24A" stroke="#1F3A4A" stroke-width=".6"/>
          <ellipse cx="11" cy="19" rx="1.4" ry="2.6" fill="#fff" opacity=".5" transform="rotate(15 11 19)"/></svg>`},
      {id: "tp-egypt-papyrus", name: "Papyrus Washi", kind: "tape", desc: "Golden sand washi tape with papyrus heads and tiny pyramids on the horizon.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#F2D49A" opacity=".92"/>
          <path d="M6 20L13 11L20 20M22 20L27 14L32 20" fill="#D9A064" opacity=".9"/>
          ${[[44, 22, 10], [56, 22, 8], [70, 22, 11]].map(([x, y, h]) => `<path d="M${x} ${y}V${y - h}" stroke="#5E8E46" stroke-width="1.2"/>${umbel(x, y - h, 5, "#5E8E46")}`).join("")}
          <circle cx="36" cy="8" r="3" fill="#FFF0B8" opacity=".95"/></svg>`}
    ],
    card: {id: "tp-egypt", name: "Golden Giza", desc: "Warm papyrus paper with the pyramids and a low sun in the corner and a felucca on the Nile below. Deep lapis night in dark mode."}
  });
})();
/* end of module 96-tp-egypt.js */


