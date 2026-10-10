/* Theme Collections, batch n5: pride, graduation, birthday, geology, languages */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w, st) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${st ? ` stroke="${O}" stroke-width="${st}" paint-order="stroke" stroke-linejoin="round"` : ""}${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const face = (x, y, gap = 6, r = 2.3) => EYES(x - gap, x + gap, y, r) + blush(x - gap - 4.4, x + gap + 4.4, y + 4.4, 2.4, 1.5) + smile(x, y + 3.6, 2.2, 1.8);
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const RB = ["#E8505B", "#F59E42", "#F7D046", "#5DBB63", "#4A90D9", "#8E5CC7"];
  const heartD = (x, y, s) => `M${x} ${f1(y + 9 * s)}C${f1(x - 13 * s)} ${f1(y + 1 * s)} ${f1(x - 11 * s)} ${f1(y - 10 * s)} ${x} ${f1(y - 4.6 * s)}C${f1(x + 11 * s)} ${f1(y - 10 * s)} ${f1(x + 13 * s)} ${f1(y + 1 * s)} ${x} ${f1(y + 9 * s)}z`;

  /* ================= PRIDE PARADE ================= */
  TP_DATA.push({
    theme: "pride",
    pack: {name: "Proud & Bright", items: {
      pride_flag: `${tube("M13 58V8", "#B9A6D8", 3.4)}<circle cx="13" cy="7" r="3.2" fill="#F7D046" ${S2}/>
        <defs><clipPath id="n5-pf-c"><path d="M15 11C26 7 36 15 56 10V40C36 45 26 37 15 41z"/></clipPath></defs>
        <g clip-path="url(#n5-pf-c)">${RB.map((c, i) => `<rect x="14" y="${6 + i * 6.4}" width="44" height="6.8" fill="${c}"/>`).join("")}<path d="M15 11C26 7 36 15 56 10V18C36 23 26 15 15 19z" fill="#fff" opacity=".2"/></g>
        <path d="M15 11C26 7 36 15 56 10V40C36 45 26 37 15 41z" fill="none" ${SO}/>
        ${EYES(29, 41, 26, 2.2)}${blush(25, 45, 30.5, 2.2, 1.4)}${smile(35, 29.6, 2, 1.7)}
        ${spark(54, 52, 4.2, "#F7D046")}${spark(28, 54, 2.8, "#8E5CC7")}`,
      pride_heart: `<defs><clipPath id="n5-ph-c"><path d="${heartD(32, 32, 2.5)}"/></clipPath></defs>
        <g clip-path="url(#n5-ph-c)">${RB.map((c, i) => `<rect x="0" y="${10 + i * 7.6}" width="64" height="8" fill="${c}"/>`).join("")}<ellipse cx="22" cy="20" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-30 22 20)"/></g>
        <path d="${heartD(32, 32, 2.5)}" fill="none" ${SO}/>
        ${face(32, 33, 7, 2.4)}${spark(54, 9, 4.4, "#F7D046")}${spark(9, 53, 3, "#5BCEFA")}`,
      pride_rainbow: `${RB.map((c, i) => `<path d="M${8 + i * 3.6} 46A${24 - i * 3.6} ${24 - i * 3.6} 0 0 1 ${56 - i * 3.6} 46" fill="none" stroke="${c}" stroke-width="4"/>`).join("")}
        <path d="M6 46A26 26 0 0 1 58 46M28 46A4 4 0 0 1 36 46" fill="none" ${S2}/>
        <path d="M2 50C2 44 7 41 11 43C12 38 19 37 21 42C25 41 28 44 27 48C27 52 24 54 21 54H6C3 54 2 52 2 50z" fill="#fff" ${S2}/>
        <path d="M37 50C37 44 42 41 46 43C47 38 54 37 56 42C60 41 63 44 62 48C62 52 59 54 56 54H41C38 54 37 52 37 50z" fill="#fff" ${S2}/>
        ${EYES(11, 18, 48, 1.6)}${EYES(46, 53, 48, 1.6)}<ellipse cx="8" cy="51" rx="1.6" ry="1" fill="#FF8FA8"/><ellipse cx="21" cy="51" rx="1.6" ry="1" fill="#FF8FA8"/><ellipse cx="43" cy="51" rx="1.6" ry="1" fill="#FF8FA8"/><ellipse cx="56" cy="51" rx="1.6" ry="1" fill="#FF8FA8"/>
        ${spark(32, 12, 4, "#F7D046")}`,
      pride_balloons: `${["#E8505B", "#F7D046", "#4A90D9"].map((c, i) => `<path d="M32 60Q${20 + i * 12} 52 ${17 + i * 15} ${36 - (i === 1 ? 8 : 0)}" fill="none" stroke="${O}" stroke-width="1.4"/>`).join("")}
        ${rg("n5-pb-r", "#FF9AA0", "#D83A48")}${rg("n5-pb-y", "#FFF0A0", "#E8B830")}${rg("n5-pb-b", "#9CCBF8", "#3A78C8")}
        <ellipse cx="17" cy="25" rx="11" ry="13" fill="url(#n5-pb-r)" ${S2}/><ellipse cx="47" cy="25" rx="11" ry="13" fill="url(#n5-pb-b)" ${S2}/><ellipse cx="32" cy="17" rx="12" ry="14" fill="url(#n5-pb-y)" ${S2}/>
        <ellipse cx="12" cy="20" rx="2.4" ry="4" fill="#fff" opacity=".55" transform="rotate(25 12 20)"/><ellipse cx="42" cy="20" rx="2.4" ry="4" fill="#fff" opacity=".55" transform="rotate(25 42 20)"/><ellipse cx="27" cy="11" rx="2.6" ry="4.4" fill="#fff" opacity=".6" transform="rotate(25 27 11)"/>
        ${EYES(28, 36, 18, 2)}${blush(24.5, 39.5, 22, 2, 1.3)}${smile(32, 21, 1.8, 1.6)}<path d="M30 60.5h4" ${S2}/>`,
      pride_corgi: `${lg("n5-pc-f", "#FFC488", "#EE9A50")}
        <path d="M14 26L11 6L26 16z" fill="#EE9A50" ${SO}/><path d="M50 26L53 6L38 16z" fill="#EE9A50" ${SO}/><path d="M15.4 20L14 10L21.5 15.6z" fill="#FFC9B0"/><path d="M48.6 20L50 10L42.5 15.6z" fill="#FFC9B0"/>
        <path d="M32 13C46 13 52 23 52 33C52 44 43 50 32 50C21 50 12 44 12 33C12 23 18 13 32 13z" fill="url(#n5-pc-f)" ${SO}/>
        <path d="M32 18C29 22 27 30 22 36C22 44 27 48 32 48C37 48 42 44 42 36C37 30 35 22 32 18z" fill="#FFF6EA"/>
        <ellipse cx="32" cy="38" rx="3.6" ry="2.6" fill="${O}"/>${EYES(24, 40, 30, 2.4)}${blush(19, 45, 36, 2.6, 1.6)}<path d="M28.5 42q3.5 3 7 0" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <defs><clipPath id="n5-pc-b"><path d="M14 48L50 48L32 63z"/></clipPath></defs><g clip-path="url(#n5-pc-b)">${RB.map((c, i) => `<rect x="10" y="${47 + i * 2.8}" width="44" height="3" fill="${c}"/>`).join("")}</g><path d="M14 48L50 48L32 63z" fill="none" ${S2}/>`,
      pride_megaphone: `${lg("n5-pm-b", "#FF9FC8", "#D2488A", 1, 0)}
        <path d="M14 26L42 12V48L14 36z" fill="url(#n5-pm-b)" ${SO}/><rect x="6" y="24" width="10" height="14" rx="3" fill="#8E5CC7" ${SO}/>
        <ellipse cx="42" cy="30" rx="5" ry="18" fill="#FFD6EA" ${SO}/><path d="M18 38L20 50Q21 53 24 52L27 51Q29 50 28 47L26 40" fill="#8E5CC7" ${S2}/>
        ${EYES(25, 33, 28, 1.9)}${blush(22, 36, 32, 1.8, 1.2)}${smile(29, 31.5, 1.7, 1.5)}
        <path d="M51 20L57 14M52 30H60M51 40L57 46" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M51 20L57 14M52 30H60M51 40L57 46" stroke="#F7D046" stroke-width="2" stroke-linecap="round"/>
        <path d="${heartD(54, 56, 0.5)}" fill="#E8505B" ${SOw(1.3)}/>`,
      pride_star: `${["#8E5CC7", "#4A90D9", "#5DBB63"].map((c, i) => tube(`M${8 + i * 2} ${50 - i * 6}Q${18 + i * 3} ${44 - i * 7} ${28} ${36 - i * 3}`, c, 4.4)).join("")}
        ${rg("n5-ps-g", "#FFF6B0", "#F2B530")}<path d="${star(40, 26, 20, 9.5, 5)}" fill="url(#n5-ps-g)" ${SO}/>
        ${EYES(35, 45, 26, 2.2)}${blush(31, 49, 30.5, 2.2, 1.4)}${smile(40, 29.6, 2.1, 1.7)}${spark(57, 52, 3.4, "#E8505B")}${spark(12, 14, 3, "#F59E42")}`,
      pride_beyou: `<rect x="4" y="16" width="56" height="32" rx="16" fill="#2E2050" ${SO}/>
        <rect x="8" y="20" width="48" height="24" rx="12" fill="none" stroke="url(#n5-pbu-g)" stroke-width="2.6"/>${lg("n5-pbu-g", "#E8505B", "#8E5CC7", 1, 0)}
        ${T("BE YOU!", 32, 37.2, 13, "#FFFFFF", 40)}
        <path d="${heartD(56, 12, 0.5)}" fill="#E8505B" ${SOw(1.3)}/>${spark(8, 52, 3.4, "#F7D046")}${spark(52, 56, 2.6, "#5BCEFA")}`
    }},
    pins: [
      {id: "tp-pride-heart", name: "Rainbow Heart Pin", kind: "badge", desc: "A glossy rainbow-striped heart.",
        svg: `<svg viewBox="0 0 30 30"><defs><clipPath id="n5-pp-c"><path d="${heartD(15, 15, 1.2)}"/></clipPath></defs><g clip-path="url(#n5-pp-c)">${RB.map((c, i) => `<rect x="0" y="${4 + i * 3.8}" width="30" height="4" fill="${c}"/>`).join("")}</g>
          <path d="${heartD(15, 15, 1.2)}" fill="none" stroke="#5A2A5A" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="10.6" cy="11" rx="2.6" ry="1.4" fill="#fff" opacity=".7" transform="rotate(-35 10.6 11)"/></svg>`},
      {id: "tp-pride-bunting", name: "Rainbow Bunting Washi", kind: "tape", desc: "Cream washi tape with a string of rainbow pennants.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFF6EC" opacity=".92"/><path d="M5 5Q43 13 81 5" fill="none" stroke="#8A6A8A" stroke-width=".9"/>
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const x = 9 + i * 8.6, y = 5 + 8 * 4 * ((x - 5) / 76) * (1 - (x - 5) / 76) * 0.5; return `<path d="M${f1(x - 3.4)} ${f1(y)}L${f1(x + 3.4)} ${f1(y)}L${f1(x)} ${f1(y + 9)}z" fill="${RB[i % 6]}"/>`; }).join("")}</svg>`}
    ],
    card: {id: "tp-pride", name: "Rainbow Bunting", desc: "Soft cream card with a string of rainbow pennants across the top and a little heart. Deep twilight purple in dark mode."}
  });

  /* ================= GRADUATION DAY ================= */
  const capS = (x, y, s, col = "#2E4A8A") => `<path d="M${x - 9 * s} ${y + 2 * s}V${y + 8 * s}Q${x} ${y + 13 * s} ${x + 9 * s} ${y + 8 * s}V${y + 2 * s}z" fill="${col}" ${S2}/><path d="M${x} ${y - 9 * s}L${x + 19 * s} ${y - 1 * s}L${x} ${y + 7 * s}L${x - 19 * s} ${y - 1 * s}z" fill="${col}" ${SO}/><path d="M${x - 12 * s} ${y - 3.6 * s}L${x} ${y - 8 * s}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>`;
  TP_DATA.push({
    theme: "graduation",
    pack: {name: "Class of Now", items: {
      graduation_cap: `${lg("n5-gc-b", "#4A6AB0", "#1E3366")}
        <path d="M17 30V44Q32 52 47 44V30z" fill="url(#n5-gc-b)" ${SO}/><path d="M32 10L60 22L32 34L4 22z" fill="#2E4A8A" ${SO}/><path d="M12 21L32 12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/>
        ${tube("M32 22L52 27V44", "#F2B83A", 2.4)}<path d="M49 43h6l1.5 10h-9z" fill="#F2B83A" ${S2}/><circle cx="32" cy="22" r="3" fill="#F2B83A" ${S2}/>
        ${face(32, 40, 6, 2.2)}${spark(9, 50, 4, "#F2B83A")}${spark(57, 8, 3, "#7FB8F0")}`,
      graduation_diploma: `${lg("n5-gd-p", "#FFFBEE", "#EBD7A8")}
        <g transform="rotate(-18 32 32)"><rect x="8" y="22" width="48" height="20" rx="3" fill="url(#n5-gd-p)" ${SO}/><ellipse cx="8" cy="32" rx="4" ry="10" fill="#F6E6C0" ${SO}/><ellipse cx="56" cy="32" rx="4" ry="10" fill="#F6E6C0" ${SO}/>
        <rect x="28" y="21" width="8" height="22" fill="#9A2E4A" ${S2}/><path d="M30 42L26 54L31 51L33 55L34 42z" fill="#9A2E4A" ${S2}/></g>
        <circle cx="34" cy="35" r="5.5" fill="#F2B83A" ${S2}/><path d="${star(34, 35, 3, 1.4, 5)}" fill="#FFF0B0"/>
        ${EYES(16, 23, 36, 1.9)}${EYES(43, 50, 26, 1.9)}${smile(19.5, 39.5, 1.6, 1.5)}${smile(46.5, 29.5, 1.6, 1.5)}${spark(55, 50, 3.6, "#F2B83A")}`,
      graduation_owl: `${lg("n5-go-b", "#C8A27E", "#8A6040")}
        <path d="M32 18C46 18 52 30 52 42C52 54 43 60 32 60C21 60 12 54 12 42C12 30 18 18 32 18z" fill="url(#n5-go-b)" ${SO}/>
        <ellipse cx="32" cy="48" rx="11" ry="9" fill="#F6E7D3"/><circle cx="24" cy="36" r="7" fill="#FBF2E4" ${SOw(1.4)}/><circle cx="40" cy="36" r="7" fill="#FBF2E4" ${SOw(1.4)}/>
        ${EYES(24, 40, 36, 3)}<path d="M29.5 41.5L34.5 41.5L32 45z" fill="#F2A33A" ${SOw(1.4)}/>${blush(18, 46, 43, 2.4, 1.5)}
        ${capS(32, 16, 1.05)}${tube("M32 15L46 18V28", "#F2B83A", 1.8)}<path d="M44 27h4l1 6h-6z" fill="#F2B83A" ${SOw(1.4)}/><circle cx="32" cy="15" r="2" fill="#F2B83A"/>`,
      graduation_medal: `<path d="M38 3H49L37 28H27Z" fill="#9A2E4A" ${S2}/><path d="M42.5 3L32 25.5" stroke="#F2B83A" stroke-width="1.8"/><path d="M15 3H26L37 28H27Z" fill="#3A5AA0" ${S2}/><path d="M20.5 3L31 25.5" stroke="#F2B83A" stroke-width="1.8"/>
        ${rg("n5-gm-g", "#FFF2B0", "#E0A02A")}<circle cx="32" cy="40" r="18" fill="url(#n5-gm-g)" ${SO}/><circle cx="32" cy="40" r="13" fill="none" stroke="#C88A1A" stroke-width="1.6"/>
        ${T("#1", 32, 46, 15, "#FFFFFF", 0, 2.6)}<ellipse cx="24" cy="31" rx="3.6" ry="2" fill="#fff" opacity=".6" transform="rotate(-35 24 31)"/>${spark(55, 54, 3.6, "#F2B83A")}${spark(9, 50, 3, "#7FB8F0")}`,
      graduation_books: `${lg("n5-gb-1", "#5A7ACC", "#2E4A8A")}${lg("n5-gb-2", "#C84A6A", "#9A2E4A")}${lg("n5-gb-3", "#5CC4A0", "#2E8A6A")}
        <rect x="8" y="44" width="46" height="12" rx="2.5" fill="url(#n5-gb-1)" ${SO}/><rect x="12" y="44" width="38" height="3" fill="#fff" opacity=".7"/>
        <rect x="12" y="32" width="42" height="12" rx="2.5" fill="url(#n5-gb-2)" ${SO}/><rect x="15" y="40" width="36" height="2.6" fill="#fff" opacity=".7"/>
        <rect x="10" y="20" width="40" height="12" rx="2.5" fill="url(#n5-gb-3)" ${SO}/><rect x="13" y="28" width="34" height="2.4" fill="#fff" opacity=".7"/>
        ${face(31, 49, 6, 1.9)}<path d="M30 20C25 13 30 6 36 10C40 6 46 12 41 18C38 21 33 21 30 20z" fill="#E8505B" ${S2}/><path d="M36 10Q36 6 39 4" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/><path d="M38 6C41 3 45 4 46 6C43 8 40 8 38 6z" fill="#6BBF7A" ${SOw(1.3)}/>`,
      graduation_laurel: `${(() => { let l = ""; for (let i = 0; i < 6; i++) { const a = (100 + i * 26) * Math.PI / 180, x = f1(32 + Math.cos(a) * 21), y = f1(32 + Math.sin(a) * 21), r = f1(a * 57.3 + 90 + 25); l += `<ellipse cx="${x}" cy="${y}" rx="6.4" ry="3" transform="rotate(${r} ${x} ${y})" fill="${i % 2 ? "#8CCB7E" : "#6CB070"}" ${SOw(1.5)}/>`; } return l + `<g transform="translate(64 0) scale(-1 1)">${l}</g>`; })()}
        <path d="M26 56Q32 50 38 56L36 60L32 57L28 60z" fill="#9A2E4A" ${S2}/>
        ${rg("n5-gl-s", "#FFF6B0", "#F2B530")}<path d="${star(32, 32, 13, 6.2, 5)}" fill="url(#n5-gl-s)" ${SO}/>${EYES(28, 36, 32, 1.8)}${smile(32, 35, 1.6, 1.5)}`,
      graduation_ididit: `<path d="M4 22H60L55 32L60 42H4L9 32z" fill="#2E4A8A" ${SO}/><path d="M8 26H56" stroke="#F2B83A" stroke-width="1.4" stroke-dasharray="2 3"/>
        ${T("I DID IT!", 32, 37, 12, "#FFE08A", 42)}${spark(10, 12, 4.4, "#F2B83A")}${spark(54, 54, 4, "#F2B83A")}<circle cx="52" cy="12" r="1.8" fill="#7FB8F0"/><circle cx="14" cy="52" r="1.8" fill="#9A2E4A"/>`,
      graduation_tower: `${lg("n5-gt-s", "#F2DEC0", "#D8B88C")}
        <path d="M22 26Q22 12 32 8Q42 12 42 26z" fill="#7CC0A8" ${SO}/><path d="M32 8V3" stroke="${O}" stroke-width="2"/><path d="M32 3L38 5L32 7z" fill="#F2B83A"/>
        <rect x="18" y="26" width="28" height="34" rx="2" fill="url(#n5-gt-s)" ${SO}/><rect x="16" y="24" width="32" height="5" rx="2" fill="#FFFDF6" ${S2}/>
        <circle cx="32" cy="40" r="10" fill="#FFFFFF" ${SO}/><path d="M32 40V33.5M32 40L36.4 42.4" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        ${EYES(28, 36, 49.5, 1.4)}${smile(32, 52, 1.4, 1.3)}<rect x="28" y="54" width="8" height="6" rx="4" fill="#9A5A3E" ${SOw(1.4)}/>${spark(54, 16, 3.6, "#F2B83A")}${spark(10, 20, 2.8, "#7FB8F0")}`
    }},
    pins: [
      {id: "tp-graduation-cap", name: "Grad Cap Pin", kind: "badge", desc: "A tiny navy mortarboard with a gold tassel.",
        svg: `<svg viewBox="0 0 30 30"><path d="M8 15V21Q15 25 22 21V15z" fill="#1E3366" stroke="#121E40" stroke-width="1"/><path d="M15 5L28 11L15 17L2 11z" fill="#2E4A8A" stroke="#121E40" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M6 10.4L15 6.4" stroke="#fff" stroke-width="1" opacity=".4"/><path d="M15 11L24 13.4V21" fill="none" stroke="#F2B83A" stroke-width="1.3"/><path d="M22.6 20.6h2.8l.6 4.4h-4z" fill="#F2B83A"/><circle cx="15" cy="11" r="1.5" fill="#F2B83A"/></svg>`},
      {id: "tp-graduation-tassel", name: "Gold Tassel Clip", kind: "clip", desc: "A gold tassel that hangs over the corner like a bookmark.",
        svg: `<svg viewBox="0 0 20 46"><rect x="5" y="1" width="10" height="7" rx="2" fill="#2E4A8A" stroke="#121E40" stroke-width=".9"/><path d="M10 8V22" stroke="#C88A1A" stroke-width="2"/><circle cx="10" cy="22" r="3" fill="#F2B83A" stroke="#A8701A" stroke-width=".8"/>
          <path d="M6 24H14L16 44H4z" fill="#F2B83A" stroke="#A8701A" stroke-width=".8" stroke-linejoin="round"/><path d="M7 26L6 43M10 26V43M13 26L14 43" stroke="#C88A1A" stroke-width=".8"/><path d="M6.4 25.4H13.6" stroke="#FFF0B0" stroke-width="1.4"/></svg>`}
    ],
    card: {id: "tp-graduation", name: "Diploma Paper", desc: "Warm parchment with a fine gold border, a ribbon seal in the corner and a little mortarboard. Navy and gold in dark mode."}
  });

  /* ================= BIRTHDAY BASH ================= */
  TP_DATA.push({
    theme: "birthday",
    pack: {name: "Party Time", items: {
      birthday_cake: `${lg("n5-bc-c", "#FFE7C4", "#F2C890")}${lg("n5-bc-f", "#FFD0E2", "#F49AB8")}
        <path d="M8 34L52 20L56 50L12 58z" fill="url(#n5-bc-c)" ${SO}/><path d="M8 34L52 20L53.4 30L9.6 44z" fill="#FFFFFF" opacity=".0"/>
        <path d="M10 42L54 30M11 50L55 38" stroke="#F49AB8" stroke-width="4"/><path d="M8 34L52 20Q54 24 50 26Q47 30 44 28Q40 32 36 30Q32 34 28 33Q24 37 20 35Q16 39 12 38Q8 38 8 34z" fill="url(#n5-bc-f)" ${S2}/>
        <path d="M8 34L52 20L56 50L12 58z" fill="none" ${SO}/>
        <rect x="27" y="10" width="4" height="16" rx="1.5" fill="#7FC8F0" ${SOw(1.4)} transform="rotate(-6 29 18)"/><path d="M28.6 3C26 7 27 10 29 10C31 10 32 7 28.6 3z" fill="#FFB53A" ${SOw(1.3)}/>
        ${face(30, 45, 6, 2.1)}${spark(56, 10, 3.6, "#FFD45A")}<circle cx="16" cy="18" r="1.8" fill="#B58CF2"/>`,
      birthday_balloon: `${rg("n5-bb-g", "#FFB8D4", "#E8508A")}<path d="M32 46Q28 52 34 56Q38 60 33 63" fill="none" stroke="${O}" stroke-width="1.6"/>
        <path d="M32 4C45 4 52 14 52 24C52 36 41 44 32 46C23 44 12 36 12 24C12 14 19 4 32 4z" fill="url(#n5-bb-g)" ${SO}/><path d="M29 45.5h6l-1 3h-4z" fill="#E8508A" ${S2}/>
        <ellipse cx="22" cy="15" rx="3.4" ry="6" fill="#fff" opacity=".55" transform="rotate(30 22 15)"/>${face(32, 25, 6.5, 2.4)}${spark(55, 46, 3.6, "#FFD45A")}${spark(9, 40, 2.8, "#7FD8C0")}`,
      birthday_gift: `${lg("n5-bg-b", "#C6A0FF", "#9F78E8")}
        <rect x="10" y="28" width="44" height="30" rx="3" fill="url(#n5-bg-b)" ${SO}/><rect x="6" y="20" width="52" height="10" rx="3" fill="#B58CF2" ${SO}/>
        <rect x="28" y="20" width="8" height="38" fill="#FFD45A" ${S2}/><path d="M32 20C24 8 12 12 18 20zM32 20C40 8 52 12 46 20z" fill="#FF8FB8" ${S2}/><circle cx="32" cy="19" r="3.4" fill="#FFD45A" ${S2}/>
        ${EYES(19, 45, 42, 2.3)}${blush(15, 49, 47, 2.2, 1.4)}<path d="M18 50q1.8 2 3.6 0M42.6 50q1.8 2 3.6 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>${spark(57, 8, 3.6, "#FFD45A")}`,
      birthday_hat: `<path d="M32 6L50 54Q32 61 14 54z" fill="#7FD8C0" ${SO}/><path d="M24 30L42 24M20 42L46 34M17 52L49 45" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        <circle cx="32" cy="6" r="5" fill="#FF8FB8" ${S2}/><path d="M14 54Q32 61 50 54" fill="none" stroke="#FFD45A" stroke-width="4" stroke-linecap="round"/>
        ${EYES(27, 37, 40, 2)}${blush(23.5, 40.5, 44, 2, 1.3)}${smile(32, 43.4, 1.8, 1.6)}${spark(8, 20, 3.4, "#FFD45A")}${spark(56, 18, 3, "#B58CF2")}`,
      birthday_popper: `${lg("n5-bp-g", "#FFE07A", "#F29A3A", 1, 1)}
        <path d="M10 56L22 22L44 44z" fill="url(#n5-bp-g)" ${SO}/><path d="M15 42L28 30M19 50L36 38" stroke="#FF7FA8" stroke-width="3.4"/><path d="M10 56L22 22L44 44z" fill="none" ${SO}/>
        <ellipse cx="33" cy="33" rx="13" ry="5" transform="rotate(45 33 33)" fill="#FFF6E0" ${S2}/>
        <path d="M38 20Q42 12 38 6M44 24Q52 18 56 22M46 30Q54 32 58 28" fill="none" stroke="${O}" stroke-width="4.2" stroke-linecap="round"/><path d="M38 20Q42 12 38 6" fill="none" stroke="#7FC8F0" stroke-width="2" stroke-linecap="round"/><path d="M44 24Q52 18 56 22" fill="none" stroke="#B58CF2" stroke-width="2" stroke-linecap="round"/><path d="M46 30Q54 32 58 28" fill="none" stroke="#FF7FA8" stroke-width="2" stroke-linecap="round"/>
        <rect x="47" y="8" width="5" height="3" fill="#FFD45A" transform="rotate(30 49 9)"/><rect x="28" y="10" width="4" height="3" fill="#7FD8C0" transform="rotate(-20 30 11)"/><circle cx="54" cy="40" r="2" fill="#FF7FA8"/>
        ${EYES(20, 28, 42, 1.8)}${smile(24, 45.4, 1.6, 1.5)}`,
      birthday_llama: `${["#FF8FB8", "#FFD45A", "#5CCFC0", "#B58CF2"].map((c, i) => `<rect x="12" y="${32 + i * 5}" width="30" height="5.4" fill="${c}"/>`).join("")}
        <rect x="12" y="32" width="30" height="20" rx="3" fill="none" ${SO}/>${[14, 22, 30, 38].map((x, i) => `<rect x="${x}" y="51" width="5" height="9" rx="1.5" fill="${["#5CCFC0", "#FF8FB8", "#B58CF2", "#FFD45A"][i]}" ${S2}/>`).join("")}
        ${["#FFD45A", "#5CCFC0", "#FF8FB8", "#B58CF2"].map((c, i) => `<rect x="34" y="${14 + i * 5}" width="9" height="5.4" fill="${c}"/>`).join("")}<rect x="34" y="14" width="9" height="20" fill="none" ${S2}/>
        <path d="M36 8L37 1L40 6zM44 8L46 1L47 7z" fill="#FFF4E6" ${SOw(1.5)}/><ellipse cx="42" cy="12" rx="9" ry="7" fill="#FFF4E6" ${S2}/><ellipse cx="49" cy="14" rx="5" ry="4" fill="#FFF4E6" ${S2}/>
        ${EYES(40, 46, 11, 1.4)}<ellipse cx="37" cy="14.5" rx="1.6" ry="1" fill="#FF8FA8"/><path d="M48 15.6q1.4 1 2.6 0" fill="none" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M12 38Q6 36 6 30" fill="none" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M12 38Q6 36 6 30" fill="none" stroke="#B58CF2" stroke-width="1.8" stroke-linecap="round"/>${spark(56, 34, 3.4, "#FFD45A")}`,
      birthday_cupcake: `${lg("n5-bk-w", "#9FE0D0", "#5CC0A8")}
        <path d="M14 34H50L45 58H19z" fill="url(#n5-bk-w)" ${SO}/><path d="M22 36L24 56M32 36V56M42 36L40 56" stroke="#fff" stroke-width="1.6" opacity=".6"/>
        <path d="M12 35C8 28 14 22 20 23C20 15 28 12 32 16C36 12 44 15 44 23C50 22 56 28 52 35z" fill="#FFD0E2" ${SO}/>
        <rect x="30" y="4" width="4" height="12" rx="1.5" fill="#B58CF2" ${SOw(1.3)}/><path d="M32 -1C29.6 2 30.4 4.4 32 4.4C33.6 4.4 34.4 2 32 -1z" fill="#FFB53A" ${SOw(1.1)}/>
        <rect x="18" y="26" width="3" height="1.4" fill="#FF5A7A" transform="rotate(30 19.5 26.7)"/><rect x="40" y="26" width="3" height="1.4" fill="#5AB8F0" transform="rotate(-30 41.5 26.7)"/><rect x="27" y="22" width="3" height="1.4" fill="#FFD45A"/>
        ${face(32, 44, 6, 2.1)}`,
      birthday_yay: `<path d="M8 32C8 18 20 10 32 10C44 10 56 18 56 32C56 46 44 54 32 54C26 54 22 53 18 50L8 54L11 45C9 41 8 37 8 32z" fill="#FFD45A" ${SO}/>
        ${T("YAY!", 32, 39, 17, "#FFFFFF", 0, 3)}${spark(56, 8, 4.4, "#FF8FB8")}${spark(6, 12, 3.4, "#B58CF2")}<circle cx="58" cy="56" r="2" fill="#7FD8C0"/>`
    }},
    pins: [
      {id: "tp-birthday-balloon", name: "Party Balloon Pin", kind: "badge", desc: "A shiny pink party balloon on a curly string.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n5-bpp-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFC0DA"/><stop offset="1" stop-color="#E0508A"/></radialGradient></defs><path d="M15 20Q12 24 16 26Q19 28 15 30" fill="none" stroke="#8A3466" stroke-width="1"/>
          <path d="M15 2C21 2 24 7 24 11C24 16 19 19 15 20C11 19 6 16 6 11C6 7 9 2 15 2z" fill="url(#n5-bpp-g)" stroke="#8A3466" stroke-width="1.1"/><path d="M13.6 19.6h2.8l-.5 1.6h-1.8z" fill="#C2407A"/><ellipse cx="11" cy="7.4" rx="1.6" ry="2.8" fill="#fff" opacity=".7" transform="rotate(30 11 7.4)"/></svg>`},
      {id: "tp-birthday-confetti", name: "Confetti Washi", kind: "tape", desc: "Pastel pink washi tape sprinkled with confetti.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#FFD6E6" opacity=".92"/>${[[10, 7, 0], [18, 16, 1], [27, 9, 2], [36, 18, 3], [44, 6, 4], [52, 14, 0], [61, 8, 1], [69, 17, 2], [76, 10, 3], [14, 20, 4], [40, 12, 1], [64, 20, 4]].map(([x, y, k]) => `<rect x="${x}" y="${y}" width="4" height="2.2" rx=".6" fill="${["#FFD45A", "#7FD8C0", "#B58CF2", "#7FC8F0", "#FF7FA8"][k]}" transform="rotate(${(x * 7) % 60 - 30} ${x + 2} ${y + 1})"/>`).join("")}<path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".5"/></svg>`}
    ],
    card: {id: "tp-birthday", name: "Party Confetti", desc: "Sugar-pink card sprinkled with confetti, with a balloon bunch in the corner and a slice of cake. Plum party lights in dark mode."}
  });

  /* ================= CRYSTAL CAVE ================= */
  TP_DATA.push({
    theme: "geology",
    pack: {name: "Rock Collection", items: {
      geology_geode: `${rg("n5-gg-i", "#FFE8FF", "#8A48D8", .5, .5)}
        <path d="M32 6C48 6 58 18 58 32C58 46 48 58 32 58C16 58 6 46 6 32C6 18 16 6 32 6z" fill="#9A8A7A" ${SO}/><circle cx="18" cy="16" r="2.4" fill="#7A6A5E"/><circle cx="50" cy="48" r="2" fill="#7A6A5E"/>
        <path d="M32 11C45 11 53 21 53 32C53 43 45 53 32 53C19 53 11 43 11 32C11 21 19 11 32 11z" fill="#F4F0FA"/><path d="M32 15C42 15 49 23 49 32C49 41 42 49 32 49C22 49 15 41 15 32C15 23 22 15 32 15z" fill="url(#n5-gg-i)"/>
        ${[...Array(12)].map((_, i) => { const a = i / 12 * Math.PI * 2, x0 = 32 + Math.cos(a) * 16, y0 = 32 + Math.sin(a) * 16, x1 = 32 + Math.cos(a) * 9, y1 = 32 + Math.sin(a) * 9; return `<path d="M${f1(x0 + Math.sin(a) * 2.6)} ${f1(y0 - Math.cos(a) * 2.6)}L${f1(x1)} ${f1(y1)}L${f1(x0 - Math.sin(a) * 2.6)} ${f1(y0 + Math.cos(a) * 2.6)}z" fill="${i % 2 ? "#E2B8FF" : "#B07AF0"}"/>`; }).join("")}
        ${face(32, 31, 6, 2.2)}${spark(56, 8, 4, "#E2B8FF")}`,
      geology_crystal: `${lg("n5-gx-a", "#E8D0FF", "#9A62D8", 1, 1)}${lg("n5-gx-b", "#C8FAFF", "#3EB4C0", 1, 1)}
        <path d="M14 58L10 34L16 26L22 34L22 58z" fill="url(#n5-gx-b)" ${SO}/><path d="M42 58L44 30L50 22L56 32L52 58z" fill="url(#n5-gx-b)" ${SO}/>
        <path d="M20 58L22 20L32 4L42 20L44 58z" fill="url(#n5-gx-a)" ${SO}/><path d="M32 4L32 58M22 20L32 26L42 20" fill="none" stroke="${O}" stroke-width="1.4" opacity=".5"/><path d="M26 22L30 10" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        ${face(32, 40, 5.4, 2.1)}${spark(8, 14, 3.6, "#FFD8EE")}${spark(57, 10, 3, "#C8FAFF")}`,
      geology_trilobite: `${lg("n5-gt-b", "#E8C6A0", "#B8865A")}
        <path d="M32 6C46 6 54 16 54 24L50 50Q42 60 32 60Q22 60 14 50L10 24C10 16 18 6 32 6z" fill="url(#n5-gt-b)" ${SO}/>
        <path d="M24 26V54M40 26V54" stroke="${O}" stroke-width="1.6" opacity=".55"/>${[30, 36, 42, 48].map(y => `<path d="M${14 + (y - 30) * 0.1} ${y}Q32 ${y + 3} ${50 - (y - 30) * 0.1} ${y}" fill="none" stroke="${O}" stroke-width="1.4" opacity=".5"/>`).join("")}
        <path d="M14 24Q32 18 50 24" fill="none" ${S2}/>${EYES(24, 40, 15, 2.6)}${blush(18, 46, 20, 2.4, 1.5)}${smile(32, 19, 2, 1.7)}
        <path d="M10 24L4 34M54 24L60 34" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`,
      geology_hammer: `${lg("n5-gh-h", "#D8DEE8", "#8A96AA")}${lg("n5-gh-w", "#E0A870", "#A8703E")}
        <g transform="rotate(-35 32 32)"><rect x="28" y="22" width="8" height="40" rx="3" fill="url(#n5-gh-w)" ${SO}/><path d="M12 12H46L54 18L46 24H12Q8 18 12 12z" fill="url(#n5-gh-h)" ${SO}/><rect x="27" y="10" width="10" height="16" rx="2" fill="#6A7488" ${S2}/>${EYES(16.5, 23.5, 17, 1.6)}${smile(20, 19.8, 1.3, 1.3)}</g><path d="M44 50L50 46L56 52L50 58z" fill="#B58CF2" ${S2}/><path d="M10 52L14 48L18 54z" fill="#5CCFD8" ${S2}/>${spark(54, 30, 3, "#FFD45A")}`,
      geology_volcano: `${lg("n5-gv-m", "#B88A6E", "#7A5040")}
        <path d="M4 58L22 22H42L60 58z" fill="url(#n5-gv-m)" ${SO}/><path d="M22 22Q26 30 30 26Q33 34 36 27Q39 31 42 22z" fill="#FF7A4A" ${S2}/>
        <path d="M24 18C18 14 20 6 27 8C30 2 38 4 38 10C44 8 46 16 40 18z" fill="#E8E2EE" ${S2}/>${face(32, 42, 6.4, 2.3)}<path d="M12 58L18 46M50 58L46 48" stroke="#5A3A30" stroke-width="1.6" opacity=".5"/>`,
      geology_ammonite: `${rg("n5-ga-s", "#FFE8D0", "#D29A6A")}
        <path d="M32 6A26 26 0 1 1 6.6 36" fill="url(#n5-ga-s)" ${SO}/><path d="M6.6 36C6 28 10 20 18 16C26 12 36 14 40 22C44 30 40 38 32 40C26 41 22 36 24 31C25 28 29 27 31 29" fill="none" ${SO}/>
        ${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = -1.2 + i * 0.62, r0 = 13, r1 = 25; return `<path d="M${f1(32 + Math.cos(a) * r0)} ${f1(32 + Math.sin(a) * r0)}L${f1(32 + Math.cos(a) * r1)} ${f1(32 + Math.sin(a) * r1)}" stroke="${O}" stroke-width="1.3" opacity=".45"/>`; }).join("")}
        ${EYES(40, 50, 44, 2.1)}${blush(36, 54, 48.6, 2.1, 1.3)}${smile(45, 47.6, 1.8, 1.6)}`,
      geology_gem: `${lg("n5-gj-a", "#FFC2E2", "#E0508A", 1, 1)}
        <path d="M8 24L18 10H46L56 24L32 56z" fill="url(#n5-gj-a)" ${SO}/><path d="M8 24H56M18 10L24 24L32 56M46 10L40 24L32 56M24 24L32 10L40 24" fill="none" stroke="${O}" stroke-width="1.4" opacity=".55"/>
        <path d="M18 10L24 24H8z" fill="#fff" opacity=".35"/><path d="M14 22L19 14" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        ${EYES(27, 37, 32, 2.1)}${blush(23, 41, 36, 2, 1.3)}${smile(32, 35.4, 1.8, 1.6)}${spark(56, 50, 4, "#E2B8FF")}${spark(9, 46, 3, "#5CCFD8")}`,
      geology_rocks: `${["#B9A0C4", "#9884B2", "#C9AEC4", "#6C5888"].map((c, i) => `<path d="M4 ${20 + i * 8}Q20 ${17 + i * 8} 32 ${21 + i * 8}T60 ${19 + i * 8}V${28 + i * 8}Q44 ${30 + i * 8} 32 ${29 + i * 8}T4 ${28 + i * 8}z" fill="${c}"/>`).join("")}
        <rect x="4" y="18" width="56" height="36" rx="8" fill="none" ${SO}/>${T("ROCKS!", 32, 41, 13, "#FFFFFF", 42, 3)}<path d="M50 18L54 6L58 18z" fill="#B07AF0" ${S2}/><path d="M8 18L11 9L14 18z" fill="#5CCFD8" ${S2}/>`
    }},
    pins: [
      {id: "tp-geology-gem", name: "Amethyst Pin", kind: "badge", desc: "A faceted amethyst that catches the light.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n5-gpp-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8D0FF"/><stop offset="1" stop-color="#7A3EC8"/></linearGradient></defs>
          <path d="M4 11L9 4H21L26 11L15 27z" fill="url(#n5-gpp-g)" stroke="#4A2A86" stroke-width="1.1" stroke-linejoin="round"/><path d="M4 11H26M9 4L12 11L15 27M21 4L18 11L15 27M12 11L15 4L18 11" fill="none" stroke="#4A2A86" stroke-width=".7" opacity=".6"/><path d="M9 4L12 11H4z" fill="#fff" opacity=".45"/></svg>`},
      {id: "tp-geology-strata", name: "Rock Layers Washi", kind: "tape", desc: "Washi tape striped like layered sandstone, with tiny crystals.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="n5-gps-c"><path d="${tapeEdge}"/></clipPath></defs><g clip-path="url(#n5-gps-c)" opacity=".92">${["#E8C6A0", "#C9AEC4", "#B9A0C4", "#D8B890", "#9884B2"].map((c, i) => `<path d="M0 ${i * 5.4}Q20 ${i * 5.4 - 2} 43 ${i * 5.4 + 1}T86 ${i * 5.4}V${i * 5.4 + 6}H0z" fill="${c}"/>`).join("")}</g>
          <path d="M20 14L22 9L24 14z" fill="#B07AF0"/><path d="M50 18L52 12L54 18z" fill="#5CCFD8"/><path d="M68 10L70 5L72 10z" fill="#FF8FC8"/></svg>`}
    ],
    card: {id: "tp-geology", name: "Rock Strata", desc: "Pale lavender stone with layered strata along the bottom and a crystal cluster in the corner. Glowing cave purple in dark mode."}
  });

  /* ================= POSTCARD PLAZA ================= */
  const bub = (txt, c, w = 40) => `<path d="M8 10H56Q60 10 60 14V38Q60 42 56 42H26L14 54L17 42H8Q4 42 4 38V14Q4 10 8 10z" fill="${c}" ${SO}/>${T(txt, 32, 31, 13, "#2B2233", w)}`;
  TP_DATA.push({
    theme: "languages",
    pack: {name: "Hello World", items: {
      languages_hello: `${bub("Hello!", "#FFFFFF")}<path d="M50 50C50 47 53 46 54 48C55 46 58 47 58 50C58 53 54 55 54 56C54 55 50 53 50 50z" fill="#E8505B" ${SOw(1.3)}/>${spark(58, 6, 3.6, "#F2B83A")}`,
      languages_hola: `${bub("Hola!", "#FFE08A", 34)}${spark(8, 56, 3.6, "#E8505B")}<circle cx="58" cy="52" r="2" fill="#3E7A70"/>`,
      languages_ciao: `${bub("Ciao!", "#C8EEDD", 34)}${spark(56, 54, 3.6, "#F2B83A")}<circle cx="6" cy="6" r="2" fill="#E8505B"/>`,
      languages_stamp: `${lg("n5-ls-i", "#9FD4EC", "#5AA8CC")}
        <path d="${(() => { let d = ""; const pts = []; for (let i = 0; i <= 8; i++) pts.push([10 + i * 5.5, 6]); for (let i = 1; i <= 9; i++) pts.push([54, 6 + i * 5.8]); for (let i = 1; i <= 8; i++) pts.push([54 - i * 5.5, 58]); for (let i = 1; i < 9; i++) pts.push([10, 58 - i * 5.8]); pts.forEach((p, i) => { d += (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); if (i < pts.length - 1) { const q = pts[i + 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, nx = q[1] - p[1], ny = p[0] - q[0], l = Math.hypot(nx, ny) || 1; d += `Q${f1(mx - nx / l * 2.2)} ${f1(my - ny / l * 2.2)} ${f1(q[0])} ${f1(q[1])}`; } }); return d + "z"; })()}" fill="#FFFFFF" ${SO}/>
        <rect x="16" y="12" width="32" height="40" rx="2" fill="url(#n5-ls-i)" ${S2}/><path d="M16 40Q24 32 32 38T48 34V52H16z" fill="#7FC07A"/><circle cx="40" cy="20" r="4" fill="#FFE08A"/>
        ${face(32, 26, 5.4, 2)}${T("50", 22, 49, 7, "#FFFFFF")}`,
      languages_postcard: `<g transform="rotate(-8 32 32)"><rect x="4" y="14" width="56" height="36" rx="3" fill="#FFFBF2" ${SO}/><path d="M32 18V46" stroke="#C8B8A8" stroke-width="1.4"/>
        <path d="M36 30H54M36 36H54M36 42H50" stroke="#C8B8A8" stroke-width="1.6" stroke-linecap="round"/><rect x="45" y="17" width="10" height="11" rx="1" fill="#E8505B" ${SOw(1.3)}/><path d="M50 25C47.6 23 47.6 20.4 49.2 20.4C49.8 20.4 50 20.8 50 21.2C50 20.8 50.2 20.4 50.8 20.4C52.4 20.4 52.4 23 50 25z" fill="#fff"/>
        <path d="M8 40C12 36 14 44 18 40S24 36 28 40" fill="none" stroke="#3E7A70" stroke-width="1.8" stroke-linecap="round"/>${EYES(14, 24, 28, 2)}${smile(19, 31, 1.8, 1.6)}</g>${spark(58, 56, 3.4, "#F2B83A")}`,
      languages_globe: `${rg("n5-lg-o", "#A8DCF8", "#3A8AC8")}
        <circle cx="32" cy="30" r="22" fill="url(#n5-lg-o)" ${SO}/><path d="M16 18C22 16 24 22 22 26C20 30 24 34 22 40C16 36 12 26 16 18zM34 10C40 12 46 16 44 22C40 22 38 26 40 30C44 32 48 30 52 34C50 42 44 48 38 50C38 44 34 40 36 34C32 30 28 28 30 22C32 18 30 12 34 10z" fill="#7CC07A" ${SOw(1.6)}/>
        ${face(30, 31, 6.4, 2.2)}<path d="M18 54H46" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M18 54H46" stroke="#D2704E" stroke-width="2" stroke-linecap="round"/><path d="M32 52V56" stroke="${O}" stroke-width="2"/><ellipse cx="22" cy="18" rx="4" ry="2.4" fill="#fff" opacity=".5" transform="rotate(-35 22 18)"/>`,
      languages_parrot: `${lg("n5-lp-b", "#7CE09A", "#2EA05A")}
        <path d="M18 60C14 48 16 34 24 26C30 20 42 20 46 28C50 36 46 44 40 48C36 52 32 58 32 62z" fill="url(#n5-lp-b)" ${SO}/><path d="M24 26C26 14 36 8 44 12C48 16 46 24 46 28C42 22 32 20 24 26z" fill="#E8505B" ${S2}/>
        <path d="M44 30C52 30 56 36 54 42C52 40 48 38 46 40z" fill="#FFD45A" ${S2}/><path d="M46 40Q50 40 50 44" fill="none" stroke="${O}" stroke-width="1.6"/>
        <circle cx="38" cy="30" r="5" fill="#fff" ${SOw(1.6)}/><circle cx="39" cy="30" r="2.6" fill="${O}"/><circle cx="40" cy="29" r=".9" fill="#fff"/><ellipse cx="33" cy="37" rx="2.6" ry="1.6" fill="#FF8FA8" opacity=".8"/>
        <path d="M22 44Q16 50 20 56" fill="none" stroke="#3E7AE0" stroke-width="3" stroke-linecap="round"/><path d="M6 14H18Q20 14 20 16V22Q20 24 18 24H11L8 27L9 24H6Q4 24 4 22V16Q4 14 6 14z" fill="#fff" ${SOw(1.5)}/>${T("hi", 12, 21.6, 7, "#2B2233")}`,
      languages_tram: `${lg("n5-lt-b", "#FF6A5E", "#C83A3A")}
        <path d="M32 10V4M24 4H40" stroke="${O}" stroke-width="2" stroke-linecap="round"/><rect x="8" y="10" width="48" height="40" rx="8" fill="url(#n5-lt-b)" ${SO}/><rect x="8" y="34" width="48" height="16" rx="0" fill="#FFF6E0" ${S2}/><rect x="8" y="10" width="48" height="40" rx="8" fill="none" ${SO}/>
        <rect x="14" y="16" width="36" height="14" rx="3" fill="#BFE6FA" ${S2}/>${EYES(25, 39, 23, 2.2)}${blush(20, 44, 27, 2, 1.3)}${smile(32, 26.6, 1.8, 1.6)}
        <circle cx="16" cy="42" r="3" fill="#FFE08A" ${SOw(1.4)}/><circle cx="48" cy="42" r="3" fill="#FFE08A" ${SOw(1.4)}/><circle cx="20" cy="54" r="4" fill="#3A3450" ${S2}/><circle cx="44" cy="54" r="4" fill="#3A3450" ${S2}/>${T("5", 32, 46, 9, "#C83A3A")}`
    }},
    pins: [
      {id: "tp-languages-stamp", name: "Postage Stamp Pin", kind: "badge", desc: "A tiny perforated stamp with a red heart.",
        svg: `<svg viewBox="0 0 30 30"><path d="M5 3H25V27H5z" fill="#fff" stroke="#8A5A4A" stroke-width="1" stroke-dasharray="1.6 1.2"/><rect x="7.5" y="5.5" width="15" height="19" fill="#7FC4E0"/><path d="M15 21C9 17 9 11 12.4 11C13.8 11 14.6 12 15 13C15.4 12 16.2 11 17.6 11C21 11 21 17 15 21z" fill="#E8505B" stroke="#9A2A2A" stroke-width=".7"/>
          <circle cx="22" cy="8" r="5" fill="none" stroke="#3A4A8A" stroke-width=".8" opacity=".7"/></svg>`},
      {id: "tp-languages-airmail", name: "Airmail Washi", kind: "tape", desc: "Classic airmail stripes in red, white and blue.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="n5-lpa-c"><path d="${tapeEdge}"/></clipPath></defs><path d="${tapeEdge}" fill="#FFFFFF" opacity=".95"/><g clip-path="url(#n5-lpa-c)">${[...Array(14)].map((_, i) => `<path d="M${-6 + i * 7} 26L${2 + i * 7} 0H${6 + i * 7}L${-2 + i * 7} 26z" fill="${i % 2 ? "#3E6AC0" : "#E8505B"}" opacity=".9"/>`).join("")}<rect x="0" y="7" width="86" height="12" fill="#FFFFFF"/></g>
          <text x="43" y="16.4" text-anchor="middle" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="7" fill="#3E6AC0">PAR AVION</text></svg>`}
    ],
    card: {id: "tp-languages", name: "Airmail Letter", desc: "Cream letter paper edged with red and blue airmail stripes, with a stamp and a postmark in the corner. Night-blue envelope in dark mode."}
  });
})();
