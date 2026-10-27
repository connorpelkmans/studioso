/* ===== module: 96-tp-b7.js ===== */
/* Theme Collections, batch 7 */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  // linear gradient (top to bottom by default) and radial gradient, with unique ids
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  // text squeezed to an exact width so it fits on every device
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  // a ruffled (scalloped) circle
  const scal = (cx, cy, r, n, b) => { let d = ""; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1)), c = [cx + (r + b) * Math.cos(am), cy + (r + b) * Math.sin(am)].map(v => v.toFixed(1)); d += (i ? "" : `M${p(a0)}`) + `Q${c} ${p(a1)}`; } return d + "z"; };
  const rot = (n, f) => Array.from({length: n}, (_, i) => f(i * 360 / n, i)).join("");
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + (cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const flame = (x, top, bot, w) => `M${x} ${top}C${x + w * .7} ${top + (bot - top) * .35} ${x + w} ${top + (bot - top) * .55} ${x + w} ${bot - w}a${w} ${w} 0 0 1 ${-2 * w} 0C${x - w} ${top + (bot - top) * .55} ${x - w * .7} ${top + (bot - top) * .35} ${x} ${top}z`;

  /* ================= DIWALI ================= */
  TP_DATA.push({
    theme: "diwali",
    pack: {name: "Diya Delight", items: {
      diwali_diya: `${rg("dw-dy-g", "#FFF3B0", "#FFD86B", .5, .7)}${lg("dw-dy-b", "#F59A4A", "#C4502A")}
        <path d="M5 37Q32 30 59 37Q57 59 32 59Q7 59 5 37z" fill="url(#dw-dy-b)" ${SO}/>
        <path d="M11 44Q32 40 53 44" fill="none" stroke="#F2C24A" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="32" cy="36" rx="27" ry="5" fill="#8E3A1E" ${SO}/>
        <path d="${flame(32, 4, 37, 10)}" fill="#FFB347" ${SO}/>
        <path d="${flame(32, 15, 35, 5.5)}" fill="url(#dw-dy-g)"/>
        ${EYES(25, 39, 49, 2.5)}${BLUSH(19, 45, 53)}${SMILE(32, 52, 3)}`,
      diwali_lantern: `${lg("dw-ln-b", "#E65FA3", "#9E2E68")}${rg("dw-ln-w", "#FFF6C2", "#FFB347", .5, .45)}
        <path d="M32 2v6" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M29 51h6l1.5 9q-4.5 3-9 0z" fill="#F2A33A" ${S2}/>
        <path d="M32 11L53 24V41L32 54L11 41V24z" fill="url(#dw-ln-b)" ${SO}/>
        <path d="M32 19L45 27V38L32 46L19 38V27z" fill="url(#dw-ln-w)" stroke="#F2C24A" stroke-width="2.4" stroke-linejoin="round"/>
        <rect x="25" y="6" width="14" height="7" rx="2.5" fill="#F2C24A" ${S2}/>
        <circle cx="11" cy="41" r="3" fill="#F2C24A" ${S2}/><circle cx="53" cy="41" r="3" fill="#F2C24A" ${S2}/>
        ${EYES(27.5, 36.5, 31, 2.2)}${SMILE(32, 35, 2.4)}<ellipse cx="23.5" cy="35" rx="2.4" ry="1.6" fill="#FF8FA8"/><ellipse cx="40.5" cy="35" rx="2.4" ry="1.6" fill="#FF8FA8"/>`,
      diwali_rangoli: `<g ${S2}>${rot(8, a => `<path d="M32 32C23 22 25 9 32 4C39 9 41 22 32 32z" fill="${a % 90 ? "#E0463C" : "#C2407F"}" transform="rotate(${a} 32 32)"/>`)}</g>
        ${rot(8, a => `<circle cx="32" cy="11.5" r="1.9" fill="#FFF3D6" transform="rotate(${a} 32 32)"/>`)}
        <g stroke="${O}" stroke-width="1.6" stroke-linejoin="round">${rot(8, a => `<path d="M32 32C27 26 28 19 32 15C36 19 37 26 32 32z" fill="${a % 90 ? "#F2C24A" : "#FF9A3A"}" transform="rotate(${a + 22.5} 32 32)"/>`)}</g>
        <circle cx="32" cy="32" r="7.5" fill="#FFD86B" ${S2}/><circle cx="32" cy="32" r="3.4" fill="#2AA39A"/>`,
      diwali_ladoo: `${lg("dw-ld-p", "#FBD66A", "#D69A2A")}${rg("dw-ld-b", "#FFC85A", "#E8801E")}
        <ellipse cx="32" cy="53" rx="28" ry="8" fill="url(#dw-ld-p)" ${SO}/><ellipse cx="32" cy="51.5" rx="20" ry="4" fill="#FFE9A0" opacity=".7"/>
        <circle cx="20" cy="42" r="12" fill="url(#dw-ld-b)" ${SO}/><circle cx="44" cy="42" r="12" fill="url(#dw-ld-b)" ${SO}/>
        <circle cx="32" cy="23" r="14" fill="url(#dw-ld-b)" ${SO}/>
        <g fill="#C8641A" opacity=".55"><circle cx="15" cy="45" r="1.2"/><circle cx="22" cy="48" r="1.2"/><circle cx="41" cy="47" r="1.2"/><circle cx="48" cy="44" r="1.2"/><circle cx="24" cy="16" r="1.1"/><circle cx="41" cy="18" r="1.1"/></g>
        <path d="M29 9.5q3-3.5 6 0q-3 2-6 0z" fill="#7CC47A" ${SOw(1.4)}/>
        ${EYES(26.5, 37.5, 24, 2.4)}${BLUSH(22, 42, 28)}${SMILE(32, 28, 2.6)}`,
      diwali_elephant: `${lg("dw-el-b", "#C9C3DE", "#958DB5")}${lg("dw-el-c", "#D34E91", "#8E2759")}
        <ellipse cx="12" cy="30" rx="10" ry="14" fill="url(#dw-el-b)" ${SO}/><ellipse cx="52" cy="30" rx="10" ry="14" fill="url(#dw-el-b)" ${SO}/>
        <ellipse cx="13" cy="31" rx="5.5" ry="9" fill="#F4B6CC"/><ellipse cx="51" cy="31" rx="5.5" ry="9" fill="#F4B6CC"/>
        <path d="M26 44C26 52 24 56 28 59C32 62 38 60 38 55C36 57 33 57 33 53V44z" fill="url(#dw-el-b)" ${SO}/>
        <circle cx="32" cy="30" r="17" fill="url(#dw-el-b)" ${SO}/>
        <path d="M26 45C26 52 24 56 28 59C32 62 38 60 38 55C36 57 33 57 33 53V42" fill="url(#dw-el-b)"/>
        <path d="M26 44C26 52 24 56 28 59C32 62 38 60 38 55" fill="none" ${SO}/><path d="M28.6 50h4.4M28 54.5h4.2" stroke="#7A7298" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M21 42q-3 5 1 8M43 42q3 5-1 8" fill="none" stroke="${O}" stroke-width="5.6" stroke-linecap="round"/><path d="M21 42q-3 5 1 8M43 42q3 5-1 8" fill="none" stroke="#FFF6E6" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M20 17Q32 11 44 17L32 30z" fill="url(#dw-el-c)" ${S2}/><path d="M22 18.5Q32 14 42 18.5" fill="none" stroke="#F2C24A" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M32 26c2.4 2.4 3 4.2 3 5.4a3 3 0 0 1-6 0c0-1.2.6-3 3-5.4z" fill="#F2C24A" ${SOw(1.4)}/>
        <circle cx="32" cy="8.5" r="3" fill="#F2C24A" ${SOw(1.6)}/>
        ${EYES(25, 39, 34, 2.4)}${BLUSH(21, 43, 39)}`,
      diwali_marigold: `<path d="M18 50C8 50 4 58 4 58C12 60 18 56 18 50z" fill="#4E9A4A" ${S2}/><path d="M46 50C56 50 60 58 60 58C52 60 46 56 46 50z" fill="#4E9A4A" ${S2}/>
        <path d="${scal(32, 30, 22, 14, 5)}" fill="#EE7A1A" ${SO}/>
        <path d="${scal(32, 30, 15, 11, 4)}" fill="#FF9F2A" stroke="#C85A10" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="${scal(32, 30, 9, 8, 3)}" fill="#FFC23A" stroke="#D6781A" stroke-width="1.4" stroke-linejoin="round"/>
        ${EYES(28, 36, 29, 2)}<path d="M30 33q2 1.8 4 0" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>`,
      diwali_lightup: `${lg("dw-sh-b", "#D34E91", "#8E2759")}
        <path d="${flame(32, 4, 27, 8)}" fill="#FFB347" ${SO}/><path d="${flame(32, 13, 26, 4)}" fill="#FFF3B0"/>
        <rect x="3" y="25" width="58" height="32" rx="16" fill="url(#dw-sh-b)" ${SO}/>
        <rect x="7.5" y="29.5" width="49" height="23" rx="11.5" fill="none" stroke="#F2C24A" stroke-width="1.6" stroke-dasharray="1 3.2" stroke-linecap="round"/>
        ${T("LIGHT UP", 32, 46.5, 12.5, "#FFE58A", 44)}`,
      diwali_studylamp: `${lg("dw-sl-d", "#F59A4A", "#C4502A")}
        <rect x="5" y="46" width="54" height="12" rx="3" fill="#2AA39A" ${SO}/><path d="M10 50.5h40" stroke="#E9FFF8" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="9" y="35" width="46" height="12" rx="3" fill="#C2407F" ${SO}/><path d="M14 39.5h36" stroke="#FCE3EF" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M49 38.5l3 2.5-3 2.5-3-2.5z" fill="#F2C24A"/>
        <path d="M14 27Q32 22 50 27Q48 37 32 37Q16 37 14 27z" fill="url(#dw-sl-d)" ${SO}/>
        <ellipse cx="32" cy="26.5" rx="18" ry="3.6" fill="#8E3A1E" ${S2}/>
        <path d="${flame(32, 3, 27, 7.5)}" fill="#FFB347" ${SO}/><path d="${flame(32, 12, 25.5, 4)}" fill="#FFF3B0"/>
        ${EYES(27, 37, 31.5, 1.9)}<path d="M30 33.5q2 1.6 4 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>`
    }},
    pins: [
      {id: "tp-diwali-diya", name: "Diya Charm", kind: "badge", desc: "A tiny golden diya with a flickering flame.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="dw-pd-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#C98A1A"/></linearGradient><radialGradient id="dw-pd-f" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#FFF6C8"/><stop offset="1" stop-color="#FF9A2A"/></radialGradient></defs>
          <path d="M15 2C18 6 20 9 20 12a5 5 0 0 1-10 0C10 9 12 6 15 2z" fill="url(#dw-pd-f)" stroke="#B8561A" stroke-width="1"/>
          <path d="M2 16Q15 13 28 16Q27 27 15 27Q3 27 2 16z" fill="url(#dw-pd-b)" stroke="#8A5A10" stroke-width="1.1" stroke-linejoin="round"/>
          <ellipse cx="15" cy="16" rx="12.5" ry="2.4" fill="#9A5A14" stroke="#8A5A10" stroke-width="1"/>
          <path d="M6 20.5Q15 18.5 24 20.5" fill="none" stroke="#C2407F" stroke-width="1.6" stroke-linecap="round"/>
          <ellipse cx="9" cy="23" rx="2.6" ry="1.2" fill="#fff" opacity=".6"/></svg>`},
      {id: "tp-diwali-rangoli", name: "Rangoli Washi", kind: "tape", desc: "Magenta washi tape with little rangoli flowers.",
        svg: `<svg viewBox="0 0 86 26"><defs><pattern id="dw-pt-p" width="17" height="26" patternUnits="userSpaceOnUse"><g transform="translate(8.5 13)"><circle r="4.6" fill="#FFD86B"/><g fill="#FFF3E0">${rot(6, a => `<ellipse cx="0" cy="-3.6" rx="1.5" ry="2.4" transform="rotate(${a})"/>`)}</g><circle r="1.7" fill="#E0463C"/></g><circle cx="0" cy="3" r="1.1" fill="#FFD86B"/><circle cx="0" cy="23" r="1.1" fill="#FFD86B"/></pattern></defs>
          <path d="M4 1H82L79 4.5L82 8L79 11.5L82 15L79 18.5L82 22L79 25H4L7 21.5L4 18L7 14.5L4 11L7 7.5L4 4z" fill="#C2407F" opacity=".82"/>
          <path d="M4 1H82L79 4.5L82 8L79 11.5L82 15L79 18.5L82 22L79 25H4L7 21.5L4 18L7 14.5L4 11L7 7.5L4 4z" fill="url(#dw-pt-p)" opacity=".95"/>
          <path d="M6 3H80" stroke="#fff" stroke-width="1.2" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-diwali", name: "Rangoli Glow", desc: "Warm cream paper framed in magenta, with rangoli blooms in every corner and a soft diya glow."}
  });

  /* ================= BALLOON FESTIVAL ================= */
  const basket = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="#C98A4E" ${S2}/><path d="M${x + 2} ${y + h / 2}h${w - 4}M${x + w / 3} ${y + 1.5}v${h - 3}M${x + 2 * w / 3} ${y + 1.5}v${h - 3}" stroke="#8E5A2C" stroke-width="1.4" stroke-linecap="round"/>`;
  TP_DATA.push({
    theme: "balloons",
    pack: {name: "Up and Away", items: {
      balloons_balloon: `${lg("bl-bb-c", "#EE8A74", "#D0553F")}
        <path d="M26 51v5M38 51v5" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        ${basket(23, 54, 18, 8)}
        <path d="M32 3C49 3 57 15 57 26C57 38 45 44 40 51H24C19 44 7 38 7 26C7 15 15 3 32 3z" fill="url(#bl-bb-c)" ${SO}/>
        <path d="M32 3C22 11 20 34 25 51H39C44 34 42 11 32 3z" fill="#FFF3E0" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M13 15Q10 28 16 38" fill="none" stroke="#EDB64C" stroke-width="3.2" stroke-linecap="round"/><path d="M51 15Q54 28 48 38" fill="none" stroke="#EDB64C" stroke-width="3.2" stroke-linecap="round"/>
        <rect x="23" y="47" width="18" height="5" rx="2" fill="#EDB64C" ${S2}/>
        ${EYES(27.5, 36.5, 26, 2.4)}<ellipse cx="25" cy="31" rx="2.4" ry="1.6" fill="#FF8FA8"/><ellipse cx="39" cy="31" rx="2.4" ry="1.6" fill="#FF8FA8"/>${SMILE(32, 30.5, 2.6)}`,
      balloons_cloud: `${lg("bl-cl-g", "#FFFFFF", "#DCEBF6")}
        <path d="M13 52C4 52 3 38 12 36C10 25 23 20 29 27C31 14 50 13 52 28C62 28 63 44 55 52z" fill="url(#bl-cl-g)" ${SO}/>
        <path d="M16 46Q34 50 54 46" fill="none" stroke="#BCD4E6" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M24 38q3 2.6 6 0M36 38q3 2.6 6 0" fill="none" stroke="${O}" stroke-width="2.3" stroke-linecap="round"/>
        ${BLUSH(21, 45, 42)}<path d="M31 42q2 2.2 4 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        <path d="M44 10l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#EDB64C"/>`,
      balloons_bird: `${rg("bl-bd-g", "#7FD0CF", "#2F8F90")}
        <path d="M12 38L3 32L5 42L12 44z" fill="#2F7F80" ${S2}/>
        <circle cx="30" cy="36" r="19" fill="url(#bl-bd-g)" ${SO}/>
        <path d="M18 46Q30 54 43 45Q36 40 30 42Q24 44 18 46z" fill="#FFF3E0"/>
        <path d="M49 34L60 37L49 41z" fill="#EDB64C" ${S2}/>
        <path d="M22 35C18 22 26 12 36 14C34 24 30 32 22 35z" fill="#5BB5B5" ${S2}/>
        <path d="M22 49C18 52 14 50 9 53M22 49C18 55 14 55 11 59" fill="none" stroke="#E3735F" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M22 49Q30 54 38 49" fill="none" stroke="#E3735F" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="40" cy="33" r="2.7" fill="${O}"/><circle cx="40.9" cy="32" r=".9" fill="#fff"/>
        <ellipse cx="42" cy="40" rx="3.2" ry="2.1" fill="#FF8FA8" opacity=".75"/>`,
      balloons_sunrise: `${rg("bl-sr-s", "#FFE6A0", "#F6B23E", .5, .5)}${lg("bl-sr-h", "#8FD08A", "#56A85A")}${lg("bl-sr-h2", "#B5E0A6", "#7CC47A")}
        ${rot(9, a => `<path d="M32 36L29 11Q32 8 35 11z" fill="#F6C34E" transform="rotate(${a - 80} 32 36)"/>`)}
        <circle cx="32" cy="36" r="17" fill="url(#bl-sr-s)" ${SO}/>
        ${EYES(26.5, 37.5, 32, 2.3)}${SMILE(32, 35.5, 2.6)}${BLUSH(22, 42, 37)}
        <path d="M4 52C12 38 28 38 38 47C46 40 56 42 60 48V58Q60 60 58 60H6Q4 60 4 58z" fill="url(#bl-sr-h)" ${SO}/>
        <path d="M4 60C14 52 30 50 44 60z" fill="url(#bl-sr-h2)" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M54 5a5 5 0 0 1 5 5c0 3-3 5-4 7h-2c-1-2-4-4-4-7a5 5 0 0 1 5-5z" fill="#E3735F" ${SOw(1.6)}/><rect x="52.3" y="18" width="3.4" height="2.8" rx=".6" fill="#C98A4E" ${SOw(1.2)}/>`,
      balloons_map: `${lg("bl-mp-a", "#FFF6E6", "#F3E2C4")}${lg("bl-mp-b", "#F3E2C4", "#E6CFA6")}
        <path d="M4 12L22 6V52L4 58z" fill="url(#bl-mp-a)" ${SO}/><path d="M22 6L42 12V58L22 52z" fill="url(#bl-mp-b)" ${SO}/><path d="M42 12L60 6V52L42 58z" fill="url(#bl-mp-a)" ${SO}/>
        <path d="M5.3 44C12 38 18 40 20.8 43V51.2L5.3 56.6zM43.2 46C48 40 54 40 58.8 42V51.2L43.2 56.6z" fill="#9ED198"/>
        <path d="M23 30C30 34 34 26 41 30" fill="none" stroke="#6FB6D8" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M12 48C14 36 22 30 30 26S44 22 48 20" fill="none" stroke="#E3735F" stroke-width="2.8" stroke-linecap="round" stroke-dasharray=".5 5"/>
        <path d="M11 52l-3-3M8 52l3-3" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M50 3a7 7 0 0 1 7 7c0 4.2-4 7-5.4 9.8h-3.2C47 17 43 14.2 43 10a7 7 0 0 1 7-7z" fill="#E3735F" ${SOw(1.8)}/><path d="M50 3.3c-2 2.3-2.5 10.5-1.4 16.5h2.8c1.1-6 .6-14.2-1.4-16.5z" fill="#FFF3E0"/><rect x="47.6" y="19.8" width="4.8" height="3.8" rx=".8" fill="#C98A4E" ${SOw(1.3)}/>`,
      balloons_binoculars: `${lg("bl-bn-b", "#5BB5B5", "#2F7F80")}${rg("bl-bn-l", "#9FD2EE", "#1E4A73", .35, .3)}
        <path d="M8 30C4 12 60 12 56 30" fill="none" stroke="#E3735F" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="11" y="16" width="14" height="14" rx="4" fill="#2F7F80" ${S2}/><rect x="39" y="16" width="14" height="14" rx="4" fill="#2F7F80" ${S2}/>
        <rect x="25" y="28" width="14" height="10" rx="3" fill="#EDB64C" ${S2}/>
        <circle cx="18" cy="42" r="15" fill="url(#bl-bn-b)" ${SO}/><circle cx="46" cy="42" r="15" fill="url(#bl-bn-b)" ${SO}/>
        <circle cx="18" cy="42" r="9.5" fill="url(#bl-bn-l)" ${S2}/><circle cx="46" cy="42" r="9.5" fill="url(#bl-bn-l)" ${S2}/>
        <ellipse cx="15" cy="38.5" rx="3.4" ry="2.2" fill="#fff" opacity=".8" transform="rotate(-30 15 38.5)"/><ellipse cx="43" cy="38.5" rx="3.4" ry="2.2" fill="#fff" opacity=".8" transform="rotate(-30 43 38.5)"/>`,
      balloons_heartbeat: `${lg("bl-hb-g", "#F7B0A2", "#E0604C")}
        <path d="M27 43l-1 9M37 43l1 9" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        ${basket(23, 51, 18, 9)}
        <path d="M32 46S5 33 5 17A12 12 0 0 1 32 12A12 12 0 0 1 59 17C59 33 32 46 32 46z" fill="url(#bl-hb-g)" ${SO}/>
        <path d="M9 24H20L24 16L29 32L34 12L38 26L41 22H55" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${SHINE(15, 13, 4, 2.4)}`,
      balloons_flyhigh: `${lg("bl-fh-b", "#6CC4C4", "#2F8F90")}
        <path d="M6 9Q32 19 58 9" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M11 11l4 9 4-7.5z" fill="#E3735F" ${SOw(1.5)}/><path d="M23 13.5l3.8 9 4.2-8.4z" fill="#EDB64C" ${SOw(1.5)}/><path d="M34 14l3.6 8.8 3.8-9.6z" fill="#F29E8E" ${SOw(1.5)}/><path d="M45 12.4l3.2 8.4 3.8-10.6z" fill="#E3735F" ${SOw(1.5)}/>
        <rect x="4" y="24" width="56" height="35" rx="12" fill="url(#bl-fh-b)" ${SO}/>
        ${T("FLY", 32, 39.5, 14, "#FFFFFF", 26)}${T("HIGH", 32, 54.5, 14, "#FFF3C4", 38)}`
    }},
    pins: [
      {id: "tp-balloons-balloon", name: "Balloon Pushpin", kind: "badge", desc: "A glossy little hot-air balloon with coral and gold stripes.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="bl-pb-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7A08C"/><stop offset="1" stop-color="#C8503E"/></linearGradient></defs>
          <path d="M15 1.5C22 1.5 26.5 6.5 26.5 12C26.5 17.5 21 20 18.8 23H11.2C9 20 3.5 17.5 3.5 12C3.5 6.5 8 1.5 15 1.5z" fill="url(#bl-pb-g)" stroke="#8E3A2C" stroke-width="1.1"/>
          <path d="M15 1.6C11 5 10.5 15 12.2 22.9H17.8C19.5 15 19 5 15 1.6z" fill="#F6C75A" stroke="#8E3A2C" stroke-width=".9"/>
          <path d="M12 23v2.4M18 23v2.4" stroke="#6B4A2A" stroke-width="1"/><rect x="10.8" y="25" width="8.4" height="4" rx="1" fill="#C98A4E" stroke="#6B4A2A" stroke-width="1"/>
          <ellipse cx="8.6" cy="8" rx="2.4" ry="1.5" fill="#fff" opacity=".75" transform="rotate(-40 8.6 8)"/></svg>`},
      {id: "tp-balloons-bunting", name: "Bunting Tape", kind: "tape", desc: "Sky blue tape strung with little festival flags.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 2H83L80.5 7L83 12L80.5 17L83 22L81 24.5H3L5.5 20L3 15L5.5 10L3 5z" fill="#9FD2EE" opacity=".72"/>
          <path d="M5 6Q43 11 81 6" fill="none" stroke="#1E4A73" stroke-width=".9" opacity=".7"/>
          ${[[9, "#E3735F"], [21, "#EDB64C"], [33, "#4FA7A8"], [45, "#F29E8E"], [57, "#E3735F"], [69, "#EDB64C"]].map(([x, c], i) => { const y = 6 + 5 * Math.sin((x - 5) / 76 * Math.PI) * .8; return `<path d="M${x} ${y.toFixed(1)}h9l-4.5 ${10}z" fill="${c}" opacity=".95"/>`; }).join("")}
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".45"/></svg>`}
    ],
    card: {id: "tp-balloons", name: "Morning Drift", desc: "A soft sunrise sky with clouds along the top and hot-air balloons rising over rolling green hills."}
  });

  /* ================= KOI POND ================= */
  const koiFish = (id, body, patch, fin) => `${lg(id, body[0], body[1])}
    <path d="M47 31C53 20 60 16 62 19C60 25 58 29 57 32C58 35 60 39 62 45C60 48 53 44 47 33z" fill="${fin}" ${S2}/>
    <path d="M25 18C29 9 38 9 42 19" fill="${fin}" ${S2}/>
    <path d="M6 33C6 21 20 15 34 18C43 20 48 26 50 32C48 38 43 44 34 46C20 49 6 45 6 33z" fill="url(#${id})" ${SO}/>
    ${patch}
    <path d="M28 40C30 46 36 49 38 46C36 43 33 41 28 40z" fill="${fin}" ${SOw(1.6)}/>`;
  TP_DATA.push({
    theme: "koi",
    pack: {name: "Pond Pals", items: {
      koi_koi: `${koiFish("ko-kk-b", ["#FFFFFF", "#F2DCC6"], `<path d="M13 22C18 17 28 16 30 21C31 26 24 28 18 26C15 25 13 24 13 22z" fill="#F08A4B"/><path d="M34 22C40 21 46 25 47 30C43 32 38 30 35 27z" fill="#E0533A"/><path d="M27 39C31 36 38 36 41 40C37 44 30 44 27 39z" fill="#F08A4B"/>`, "#F6A36E")}
        ${EYES(14, 23, 30, 2.3)}<ellipse cx="11" cy="35" rx="2.3" ry="1.6" fill="#FF8FA8"/><ellipse cx="26" cy="35" rx="2.3" ry="1.6" fill="#FF8FA8"/>
        <path d="M16.5 35q2 1.6 4 0" fill="none" stroke="${O}" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M9 38q-3 4-1 8" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>`,
      koi_frog: `${lg("ko-fr-p", "#7CC47A", "#3F8F4E")}${lg("ko-fr-b", "#9BDB7E", "#58A85A")}
        <path d="M32 50L32 62Q56 62 60 54Q60 46 32 46Q4 46 4 54Q8 62 32 62" fill="url(#ko-fr-p)" ${SO}/>
        <path d="M32 54L38 46" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="32" cy="38" rx="20" ry="14" fill="url(#ko-fr-b)" ${SO}/>
        <circle cx="20" cy="26" r="7.5" fill="url(#ko-fr-b)" ${SO}/><circle cx="44" cy="26" r="7.5" fill="url(#ko-fr-b)" ${SO}/>
        <circle cx="20" cy="26" r="4.6" fill="#fff"/><circle cx="44" cy="26" r="4.6" fill="#fff"/>
        <circle cx="21" cy="26.5" r="2.6" fill="${O}"/><circle cx="43" cy="26.5" r="2.6" fill="${O}"/><circle cx="21.8" cy="25.5" r=".9" fill="#fff"/><circle cx="43.8" cy="25.5" r=".9" fill="#fff"/>
        <path d="M24 11H40L38 21H26z" fill="#fff" ${S2}/><path d="M32 13.8c-1.2-1.8-3.8-.8-3 1.2l3 2.8 3-2.8c.8-2-1.8-3-3-1.2z" fill="#FF7A9A"/>
        ${BLUSH(19, 45, 40)}<path d="M25 40q7 6 14 0" fill="none" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="22" cy="51" rx="5" ry="2.8" fill="#9BDB7E" ${S2}/><ellipse cx="42" cy="51" rx="5" ry="2.8" fill="#9BDB7E" ${S2}/>`,
      koi_lotus: `${lg("ko-lt-p", "#FBC6D8", "#E0708F")}${lg("ko-lt-c", "#FFE2EC", "#F4A6C0")}${lg("ko-lt-l", "#7CC47A", "#3F8F4E")}
        <ellipse cx="32" cy="52" rx="28" ry="9" fill="url(#ko-lt-l)" ${SO}/><path d="M32 52L50 46" stroke="#2F6F3A" stroke-width="2" stroke-linecap="round"/>
        <path d="M32 50C18 51 6 44 4 34C15 32 27 38 32 50z" fill="url(#ko-lt-p)" ${S2}/><path d="M32 50C46 51 58 44 60 34C49 32 37 38 32 50z" fill="url(#ko-lt-p)" ${S2}/>
        <path d="M32 50C21 45 14 31 18 15C27 21 32 36 32 50z" fill="url(#ko-lt-c)" ${S2}/><path d="M32 50C43 45 50 31 46 15C37 21 32 36 32 50z" fill="url(#ko-lt-c)" ${S2}/>
        <path d="M32 50C23 40 23 20 32 5C41 20 41 40 32 50z" fill="url(#ko-lt-p)" ${SO}/>
        <path d="M32 14C29 22 29 32 31 40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
      koi_dragonfly: `${lg("ko-df-b", "#4FC2BC", "#1F6F6A")}
        <g fill="#D8F4EF" fill-opacity=".95" ${S2}>
          <ellipse cx="17" cy="24" rx="14" ry="6.5" transform="rotate(-18 17 24)"/><ellipse cx="47" cy="24" rx="14" ry="6.5" transform="rotate(18 47 24)"/>
          <ellipse cx="18" cy="36" rx="12" ry="5.5" transform="rotate(16 18 36)"/><ellipse cx="46" cy="36" rx="12" ry="5.5" transform="rotate(-16 46 36)"/></g>
        <path d="M11 22q6-2 12 0M41 22q6-2 12 0" fill="none" stroke="#9ED8D0" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="28" y="22" width="8" height="39" rx="4" fill="url(#ko-df-b)" ${SO}/>
        <path d="M28.5 36h7M28.5 43h7M28.5 50h7" stroke="#F08A4B" stroke-width="2.2"/>
        <circle cx="32" cy="15" r="10.5" fill="url(#ko-df-b)" ${SO}/>
        ${EYES(28, 36, 14.5, 2.4)}<path d="M30.2 18.6q1.8 1.5 3.6 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="25" cy="18" rx="2" ry="1.3" fill="#FF8FA8"/><ellipse cx="39" cy="18" rx="2" ry="1.3" fill="#FF8FA8"/>`,
      koi_lantern: `${lg("ko-sl-s", "#D6D8CF", "#9A9E92")}${rg("ko-sl-w", "#FFF3C2", "#F6B04A", .5, .5)}
        <rect x="14" y="54" width="36" height="7" rx="3" fill="url(#ko-sl-s)" ${SO}/>
        <rect x="25" y="45" width="14" height="10" fill="url(#ko-sl-s)" ${SO}/>
        <rect x="12" y="40" width="40" height="6.5" rx="2.5" fill="url(#ko-sl-s)" ${SO}/>
        <rect x="17" y="25" width="30" height="16" rx="2" fill="url(#ko-sl-s)" ${SO}/>
        <rect x="23" y="27.5" width="18" height="11" rx="2" fill="url(#ko-sl-w)" ${S2}/>
        <path d="M5 25Q10 22 16 16Q24 9 32 9Q40 9 48 16Q54 22 59 25Q58 28 54 27H10Q6 28 5 25z" fill="url(#ko-sl-s)" ${SO}/>
        <circle cx="32" cy="6" r="4" fill="url(#ko-sl-s)" ${S2}/>
        <path d="M14 57q4-3 8 0q2 2-1 3h-6q-3-1-1-3zM44 22q4-3 7 0z" fill="#7CC47A"/>
        ${EYES(28, 36, 32, 1.9)}<path d="M30.4 35q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>`,
      koi_bridge: `${lg("ko-br-w", "#8CC4BD", "#3E8E88")}${lg("ko-br-r", "#EE6A52", "#C23A2C")}
        <path d="M4 50Q32 44 60 50V56Q60 61 55 61H9Q4 61 4 56z" fill="url(#ko-br-w)" ${SO}/>
        <path d="M10 55q4-2 8 0t8 0M36 56q4-2 8 0t8 0" fill="none" stroke="#DDF2EE" stroke-width="2" stroke-linecap="round"/>
        <path d="M11 26V42M21 18V36M32 15V33M43 18V36M53 26V42" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
        <path d="M11 26V42M21 18V36M32 15V33M43 18V36M53 26V42" stroke="#D9493A" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M5 30Q32 3 59 30" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M5 30Q32 3 59 30" fill="none" stroke="#E65A44" stroke-width="4" stroke-linecap="round"/>
        <path d="M3 48Q32 18 61 48L61 53Q32 27 3 53z" fill="url(#ko-br-r)" ${SO}/>
        <circle cx="5" cy="30" r="2.8" fill="#F6C75A" ${SOw(1.4)}/><circle cx="59" cy="30" r="2.8" fill="#F6C75A" ${SOw(1.4)}/>`,
      koi_pair: `${rg("ko-pr-w", "#8CD0C6", "#1F6F6A", .4, .35)}
        <circle cx="32" cy="32" r="28" fill="url(#ko-pr-w)" ${SO}/>
        <circle cx="32" cy="32" r="20" fill="none" stroke="#C6E6E1" stroke-width="1.4" opacity=".5"/>
        <g transform="rotate(-18 32 32)">
          <path d="M40 20L50 13L49 20L50 27z" fill="#F6A36E" ${SOw(1.8)}/>
          <path d="M13 20C13 14 22 11 31 13C36 14 40 17 42 20C40 23 36 26 31 27C22 29 13 26 13 20z" fill="#F08A4B" ${SOw(1.8)}/>
          <path d="M24 13C27 16 33 16 36 14.5" fill="none" stroke="#FFF3E0" stroke-width="3" stroke-linecap="round"/>
          <circle cx="18.5" cy="19" r="1.9" fill="${O}"/>
          <path d="M24 44L14 51L15 44L14 37z" fill="#F6A36E" ${SOw(1.8)}/>
          <path d="M51 44C51 50 42 53 33 51C28 50 24 47 22 44C24 41 28 38 33 37C42 35 51 38 51 44z" fill="#FFF6EA" ${SOw(1.8)}/>
          <path d="M30 40C33 38 38 38 40 41C37 43 33 43 30 40z" fill="#E0533A"/>
          <circle cx="45.5" cy="43" r="1.9" fill="${O}"/></g>
        <circle cx="50" cy="30" r="2" fill="#fff" opacity=".75"/><circle cx="14" cy="34" r="1.5" fill="#fff" opacity=".75"/>`,
      koi_swimon: `${lg("ko-sw-l", "#8CD08A", "#3F8F4E")}
        <path d="M32 32L36 4A28 28 0 1 1 28 4z" fill="url(#ko-sw-l)" ${SO}/>
        <path d="M32 32L14 14M32 32L50 14M32 32L10 44M32 32L54 44" stroke="#B9E6A8" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
        <rect x="9" y="19" width="46" height="28" rx="9" fill="#FFF6EA" stroke="${O}" stroke-width="2"/>
        ${T("SWIM", 32, 32.5, 12.5, "#1F6F6A", 34)}${T("ON", 32, 44.5, 12.5, "#E0533A", 18)}`
    }},
    pins: [
      {id: "tp-koi-lilypad", name: "Lily Pad Magnet", kind: "badge", desc: "A glossy lily pad magnet with a pink blossom.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="ko-pl-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#A6DE8E"/><stop offset="1" stop-color="#3F8F4E"/></radialGradient><linearGradient id="ko-pl-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD8E6"/><stop offset="1" stop-color="#E0708F"/></linearGradient></defs>
          <path d="M15 15L17.5 2.3A13 13 0 1 1 12.5 2.3z" fill="url(#ko-pl-g)" stroke="#2A5F34" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M15 15L7 8M15 15L23 9M15 15L6 21M15 15L24 22" stroke="#C8EDB4" stroke-width=".8" opacity=".6"/>
          <path d="M15 21C11 21 8 18 8 15C11 15 13 17 15 21zM15 21C19 21 22 18 22 15C19 15 17 17 15 21zM15 21C12 18 12 13 15 9C18 13 18 18 15 21z" fill="url(#ko-pl-f)" stroke="#A8406A" stroke-width=".9" stroke-linejoin="round"/>
          <ellipse cx="9" cy="7.5" rx="2.4" ry="1.4" fill="#fff" opacity=".7" transform="rotate(-35 9 7.5)"/></svg>`},
      {id: "tp-koi-ripple", name: "Ripple Washi", kind: "tape", desc: "Pond green washi tape with ripples and swimming koi.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z" fill="#8CC4BD" opacity=".72"/>
          <g fill="none" stroke="#fff" stroke-width="1.1" opacity=".7"><path d="M8 20q4-3 8 0t8 0M44 7q4-3 8 0t8 0M62 21q4-3 8 0"/></g>
          <g transform="translate(26 13) rotate(-10)"><path d="M-8 0C-8-3-3-4 2-2L7-5L6 0L7 5L2 2C-3 4-8 3-8 0z" fill="#F08A4B"/><circle cx="-5" cy="-.5" r=".8" fill="#2B2233"/></g>
          <g transform="translate(62 12) rotate(170)"><path d="M-8 0C-8-3-3-4 2-2L7-5L6 0L7 5L2 2C-3 4-8 3-8 0z" fill="#FFF6EA"/><path d="M-3-2c2-1 4 0 4 2-2 .6-4 0-4-2z" fill="#E0533A"/></g>
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-koi", name: "Lily Pond", desc: "Pale jade water with soft ripple rings, lily pads and a lotus drifting in from the edges and a koi gliding past."}
  });

  /* ================= RAINY WINDOW ================= */
  TP_DATA.push({
    theme: "rain",
    pack: {name: "Cozy Rainy Day", items: {
      rain_drop: `${lg("rn-dr-g", "#A9CBEE", "#3F80BD")}
        <path d="M32 3C41 17 53 28 53 41A21 21 0 0 1 11 41C11 28 23 17 32 3z" fill="url(#rn-dr-g)" ${SO}/>
        ${SHINE(21, 30, 4, 7, 25)}
        ${EYES(25, 39, 41, 2.7)}${BLUSH(19.5, 44.5, 46)}${SMILE(32, 45.5, 3)}`,
      rain_boots: `${lg("rn-bt-a", "#FFE07A", "#F2B530")}${lg("rn-bt-b", "#FFD65A", "#E09E1E")}
        <ellipse cx="32" cy="58" rx="28" ry="4.5" fill="#A9CBEE" ${S2}/>
        <path d="M31 12H47V40Q47 42 49 43L56 46Q61 48 61 53V57H31z" fill="url(#rn-bt-b)" ${SO}/>
        <rect x="29.5" y="8" width="19" height="7" rx="3" fill="#3F80BD" ${S2}/>
        <path d="M9 14H25V42Q25 44 27 45L34 48Q39 50 39 55V59H9z" fill="url(#rn-bt-a)" ${SO}/>
        <rect x="7.5" y="10" width="19" height="7" rx="3" fill="#3F80BD" ${S2}/>
        <path d="M10 55H38.5" stroke="${O}" stroke-width="2"/><path d="M13 22v14" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
        `,
      rain_mug: `${lg("rn-mg-g", "#F7C98A", "#E0913E")}
        <path d="M22 4q-5 5 0 9t0 9M34 3q-5 5 0 9t0 9" fill="none" stroke="#9FB4C8" stroke-width="3" stroke-linecap="round"/>
        <path d="M46 30h4a8 8 0 0 1 0 16h-4" fill="none" stroke="${O}" stroke-width="8.5" stroke-linecap="round"/><path d="M46 30h4a8 8 0 0 1 0 16h-4" fill="none" stroke="#E0913E" stroke-width="4" stroke-linecap="round"/>
        <path d="M8 24H48V50Q48 59 39 59H17Q8 59 8 50z" fill="url(#rn-mg-g)" ${SO}/>
        <ellipse cx="28" cy="24" rx="20" ry="3.4" fill="#A0643A" ${S2}/>
        <path d="M13 24C13 30 14 34 14 36" fill="none" stroke="${O}" stroke-width="1.5"/><path d="M14 36c-4 0-6 3-5 6l5 5 5-5c1-3-1-6-5-6z" fill="#8FB4DE" ${SOw(1.6)}/>
        ${EYES(26, 38, 40, 2.5)}${BLUSH(21, 43, 45)}${SMILE(32, 44, 2.8)}`,
      rain_raincoat: `${lg("rn-rc-g", "#FFE07A", "#F2B530")}
        <path d="M32 3a4 4 0 0 1 4 4" fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M18 22L8 44Q7 48 11 48H16z" fill="url(#rn-rc-g)" ${SO}/><path d="M46 22L56 44Q57 48 53 48H48z" fill="url(#rn-rc-g)" ${SO}/>
        <path d="M20 18Q32 14 44 18L52 57Q52 60 49 60H15Q12 60 12 57z" fill="url(#rn-rc-g)" ${SO}/>
        <path d="M22 18C20 8 26 5 32 5S44 8 42 18Q32 22 22 18z" fill="url(#rn-rc-g)" ${SO}/>
        <path d="M25 16C25 11 28 9 32 9S39 11 39 16Q32 18 25 16z" fill="#D9951E"/>
        <path d="M32 21V60" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        <g fill="#3F80BD" ${SOw(1.4)}><rect x="27.5" y="27" width="9" height="3.4" rx="1.7"/><rect x="27.5" y="36" width="9" height="3.4" rx="1.7"/><rect x="27.5" y="45" width="9" height="3.4" rx="1.7"/></g>
        <path d="M17 44h9v7h-9zM38 44h9v7h-9z" fill="#F6C84A" stroke="#C48A1A" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M22 26v12" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
      rain_window: `${lg("rn-wn-g", "#B7C8D8", "#7F98B0")}
        <rect x="8" y="5" width="48" height="50" rx="3" fill="url(#rn-wn-g)" ${SO}/>
        <g fill="#E6EEF6" stroke="#5A7896" stroke-width="1"><path d="M18 12c1.6 2.5 3 4 3 5.5a3 3 0 0 1-6 0c0-1.5 1.4-3 3-5.5z"/><path d="M42 18c1.6 2.5 3 4 3 5.5a3 3 0 0 1-6 0c0-1.5 1.4-3 3-5.5z"/><path d="M22 36c1.6 2.5 3 4 3 5.5a3 3 0 0 1-6 0c0-1.5 1.4-3 3-5.5z"/><path d="M46 38c1.6 2.5 3 4 3 5.5a3 3 0 0 1-6 0c0-1.5 1.4-3 3-5.5z"/></g>
        <path d="M18 18v6M42 24v5M22 42v6" stroke="#E6EEF6" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        <path d="M32 5V55M8 30H56" stroke="${O}" stroke-width="6"/><path d="M32 6.5V53.5M9.5 30H54.5" stroke="#F4F1EA" stroke-width="2.6"/>
        <path d="M8 5H22Q18 22 24 34Q14 34 8 26z" fill="#E88B7A" ${S2}/><path d="M56 5H42Q46 22 40 34Q50 34 56 26z" fill="#E88B7A" ${S2}/>
        <rect x="4" y="53" width="56" height="7" rx="3" fill="#F4F1EA" ${SO}/>
        <path d="M44 53q0-6 4-7q4 1 4 7z" fill="#7CC47A" ${SOw(1.6)}/>`,
      rain_duck: `${lg("rn-dk-u", "#6FA6DC", "#2F6BA6")}${rg("rn-dk-b", "#FFF0A0", "#F5C542")}
        <path d="M45 20V45a3.5 3.5 0 0 1-7 0" fill="none" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/><path d="M45 20V45a3.5 3.5 0 0 1-7 0" fill="none" stroke="#C98A4E" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M29 31C26 26 29 23 32 25" fill="none" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="29" cy="46" rx="21" ry="15" fill="url(#rn-dk-b)" ${SO}/>
        <path d="M4 22C4 10 20 3 38 3S62 10 62 20C58 17 54 17 51 20C47 17 42 17 38 20C34 17 29 17 25 20C21 17 16 17 13 20C10 18 6 18 4 22z" fill="url(#rn-dk-u)" ${SO}/>
        <path d="M38 3C33 8 30 14 30 19M38 3C43 8 46 14 46 19" fill="none" stroke="#CFE2F4" stroke-width="1.6" opacity=".7"/>
        <path d="M40 40C47 38 51 44 47 49C45 51 40 51 39 48z" fill="#F2B530" ${S2}/>
        ${EYES(22, 34, 40, 2.5)}${BLUSH(17, 39, 46)}
        <ellipse cx="28" cy="46.5" rx="5.4" ry="3" fill="#F2913A" ${S2}/>`,
      rain_slippers: `${lg("rn-sl-g", "#A9C4E4", "#6F95C4")}
        <g transform="rotate(-10 19 34)"><ellipse cx="19" cy="34" rx="12" ry="26" fill="#D6DDEA" ${SO}/><ellipse cx="19" cy="48" rx="6" ry="8" fill="#C2CCDD"/><path d="M7.4 37C5.5 16 32.5 16 30.6 37Q19 43 7.4 37z" fill="url(#rn-sl-g)" ${SO}/>
          <path d="M8 37Q19 43 30 37" fill="none" stroke="#FFF6E6" stroke-width="4.5" stroke-linecap="round"/>
          ${EYES(15, 23, 27, 2.2)}<path d="M17.4 30.5q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/></g>
        <g transform="rotate(10 45 34)"><ellipse cx="45" cy="34" rx="12" ry="26" fill="#D6DDEA" ${SO}/><ellipse cx="45" cy="48" rx="6" ry="8" fill="#C2CCDD"/><path d="M33.4 37C31.5 16 58.5 16 56.6 37Q45 43 33.4 37z" fill="url(#rn-sl-g)" ${SO}/>
          <path d="M34 37Q45 43 56 37" fill="none" stroke="#FFF6E6" stroke-width="4.5" stroke-linecap="round"/>
          ${EYES(41, 49, 27, 2.2)}<path d="M43.4 30.5q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/></g>
        <ellipse cx="12" cy="31" rx="2.2" ry="1.4" fill="#FF8FA8" transform="rotate(-10 19 34)"/><ellipse cx="26" cy="31" rx="2.2" ry="1.4" fill="#FF8FA8" transform="rotate(-10 19 34)"/>
        <ellipse cx="38" cy="31" rx="2.2" ry="1.4" fill="#FF8FA8" transform="rotate(10 45 34)"/><ellipse cx="52" cy="31" rx="2.2" ry="1.4" fill="#FF8FA8" transform="rotate(10 45 34)"/>
`,
      rain_pitter: `${lg("rn-cz-c", "#7C9AB8", "#4A6886")}
        <path d="M18 50l-2 6M32 50l-2 7M46 50l-2 6" stroke="#5A8FC8" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M13 50C3 50 2 34 12 33C11 21 25 15 32 22C36 11 54 13 54 27C63 28 63 50 53 50z" fill="url(#rn-cz-c)" ${SO}/>
        ${T("PITTER", 32, 36, 10.5, "#FFFFFF", 36)}${T("PATTER", 32, 47, 10.5, "#CFE2F6", 38)}
        <path d="M49 21q2 2.8 5 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,
    }},
    pins: [
      {id: "tp-rain-drop", name: "Raindrop Pin", kind: "badge", desc: "A clear glass raindrop pin that catches the light.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="rn-pd-g" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#CFE2F6"/><stop offset=".55" stop-color="#6FA6DC"/><stop offset="1" stop-color="#2F6BA6"/></linearGradient></defs>
          <path d="M15 1.5C19 8 25 13 25 19A10 10 0 0 1 5 19C5 13 11 8 15 1.5z" fill="url(#rn-pd-g)" stroke="#1F4A75" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M9.5 18.5c0-3 1.8-6 3.6-8.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
          <ellipse cx="19.5" cy="23" rx="3" ry="1.6" fill="#E6F0FA" opacity=".6" transform="rotate(-30 19.5 23)"/></svg>`},
      {id: "tp-rain-umbrella", name: "Umbrella Clip", kind: "clip", desc: "A folded blue umbrella that hooks over the edge of the note.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="rn-pu-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FB4DE"/><stop offset=".5" stop-color="#3F80BD"/><stop offset="1" stop-color="#1F4A75"/></linearGradient><linearGradient id="rn-pu-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F7CF8E"/><stop offset="1" stop-color="#C98A3E"/></linearGradient></defs>
          <path d="M11 13V6a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#7D5226" stroke-width="4.4" stroke-linecap="round"/><path d="M11 13V6a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="url(#rn-pu-h)" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M11 12C15 12 17 18 16 28L12 46H10L6 28C5 18 7 12 11 12z" fill="url(#rn-pu-g)" stroke="#1F3A5A" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M11 13L11.5 44M8 16Q9 30 11 44" fill="none" stroke="#CFE2F4" stroke-width=".8" opacity=".7"/>
          <rect x="8" y="22" width="6" height="3" rx="1.2" fill="#F2B56B" stroke="#7D5226" stroke-width=".8"/>
          <path d="M11 46v3" stroke="#555" stroke-width="1.6" stroke-linecap="round"/>
          <ellipse cx="8.6" cy="17" rx="1" ry="3" fill="#fff" opacity=".6"/></svg>`}
    ],
    card: {id: "tp-rain", name: "Misty Window", desc: "A frosted window pane in a white painted frame, with raindrops beading down the edges and a warm lamp glow."}
  });

  /* ================= ALPINE LAKE ================= */
  TP_DATA.push({
    theme: "alpine",
    pack: {name: "Mountain Trail", items: {
      alpine_peak: `${lg("al-pk-g", "#86ACCC", "#3E6A8E")}
        <path d="M4 59L25 12Q32 2 39 12L60 59z" fill="url(#al-pk-g)" ${SO}/>
        <path d="M41 16L60 59H44z" fill="#2F5A7C" opacity=".35"/>
        <path d="M17 30L25 12Q32 2 39 12L47 30L41 27L36 32L31 26L25 32z" fill="#FFFFFF" ${S2}/>
        ${EYES(26, 38, 43, 2.6)}${BLUSH(20, 44, 48)}${SMILE(32, 47, 2.9)}`,
      alpine_goat: `${lg("al-gt-h", "#FFFFFF", "#DCE4EC")}${lg("al-gt-n", "#8A94A6", "#4A5468")}
        <path d="M24 16C18 6 8 6 6 14C10 10 16 12 20 20z" fill="url(#al-gt-n)" ${SO}/><path d="M40 16C46 6 56 6 58 14C54 10 48 12 44 20z" fill="url(#al-gt-n)" ${SO}/>
        <ellipse cx="11" cy="26" rx="9" ry="4.6" fill="url(#al-gt-h)" ${SO} transform="rotate(18 11 26)"/><ellipse cx="53" cy="26" rx="9" ry="4.6" fill="url(#al-gt-h)" ${SO} transform="rotate(-18 53 26)"/>
        <ellipse cx="11" cy="26" rx="5" ry="2" fill="#F4B6CC" transform="rotate(18 11 26)"/><ellipse cx="53" cy="26" rx="5" ry="2" fill="#F4B6CC" transform="rotate(-18 53 26)"/>
        <path d="M27 50Q32 62 37 50z" fill="url(#al-gt-h)" ${SO}/>
        <path d="M32 12C44 12 48 22 47 32C46 44 40 52 32 52S18 44 17 32C16 22 20 12 32 12z" fill="url(#al-gt-h)" ${SO}/>
        <path d="M24 16Q28 11 32 15Q36 11 40 16Q36 19 32 17Q28 19 24 16z" fill="#fff" ${SOw(1.6)}/>
        <ellipse cx="32" cy="44" rx="8" ry="6" fill="#EEF2F6" stroke="#C3CCD8" stroke-width="1.2"/>
        <ellipse cx="29" cy="42.5" rx="1.3" ry="1" fill="${O}"/><ellipse cx="35" cy="42.5" rx="1.3" ry="1" fill="${O}"/>
        <path d="M30 46.5q2 1.6 4 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>
        ${EYES(25, 39, 31, 2.5)}${BLUSH(21, 43, 37)}`,
      alpine_marmot: `${lg("al-mm-b", "#CFA27A", "#94663E")}
        <circle cx="19" cy="12" r="5" fill="#94663E" ${S2}/><circle cx="45" cy="12" r="5" fill="#94663E" ${S2}/>
        <path d="M32 6C46 6 52 18 52 30C54 42 56 60 32 60C8 60 10 42 12 30C12 18 18 6 32 6z" fill="url(#al-mm-b)" ${SO}/>
        <path d="M18 18C21 10 43 10 46 18C41 14 23 14 18 18z" fill="#7A5230" opacity=".5"/>
        <path d="M32 32C42 32 45 42 45 50C45 57
 40 60 32 60C24 60 19 57 19 50C19 42 22 32 32 32z" fill="#F3DEC4"/>
        <ellipse cx="32" cy="27" rx="10" ry="7" fill="#F3DEC4"/>
        ${EYES(23, 41, 20, 2.5)}<ellipse cx="32" cy="24.5" rx="3" ry="2.2" fill="${O}"/>
        <rect x="29.6" y="27" width="4.8" height="5" rx="1" fill="#fff" stroke="${O}" stroke-width="1.4"/><path d="M32 27v5" stroke="${O}" stroke-width="1"/>
        ${BLUSH(18, 46, 27)}
        <ellipse cx="25" cy="41" rx="5" ry="3.6" fill="#B07E52" ${S2}/><ellipse cx="39" cy="41" rx="5" ry="3.6" fill="#B07E52" ${S2}/>`,
      alpine_edelweiss: `${lg("al-ew-p", "#FFFFFF", "#DDE8E2")}
        <path d="M32 44C30 52 24 58 16 60C18 52 24 46 32 44zM32 44C34 52 40 58 48 60C46 52 40 46 32 44z" fill="#7FAF86" ${S2}/>
        <g ${S2} fill="url(#al-ew-p)">${rot(9, a => `<path d="M32 30C27 22 27 12 32 3C37 12 37 22 32 30z" transform="rotate(${a} 32 30)"/>`)}</g>
        ${rot(9, a => `<path d="M32 26L32 12" stroke="#C8D8CE" stroke-width="1.4" stroke-linecap="round" transform="rotate(${a} 32 30)"/>`)}
        <circle cx="32" cy="30" r="8" fill="#F6D05A" ${S2}/>
        <g fill="#E0A62A"><circle cx="29" cy="28" r="1.6"/><circle cx="35" cy="28" r="1.6"/><circle cx="32" cy="33.5" r="1.6"/><circle cx="29" cy="32" r="1.2"/><circle cx="35" cy="32" r="1.2"/></g>`,
      alpine_canoe: `${lg("al-cn-b", "#EE7A5E", "#C0452E")}${lg("al-cn-w", "#7FC0DA", "#2F86A8")}
        <ellipse cx="32" cy="52" rx="28" ry="8" fill="url(#al-cn-w)" ${SO}/>
        <path d="M12 54q4-2 8 0t8 0M38 55q4-2 8 0t8 0" fill="none" stroke="#DDF0F8" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 40L44 13" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M20 40L44 13" stroke="#C99A62" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="49" cy="8" rx="5" ry="8.5" fill="#E0B47A" ${S2} transform="rotate(42 49 8)"/>
        <path d="M3 30Q32 40 61 30Q58 46 44 50Q32 53 20 50Q6 46 3 30z" fill="url(#al-cn-b)" ${SO}/>
        <path d="M5 32Q32 42 59 32" fill="none" stroke="#FFE3D6" stroke-width="2.2" stroke-linecap="round"/>

        ${EYES(33, 43, 42, 2.3)}${SMILE(38, 45.5, 2.5)}<ellipse cx="29" cy="46" rx="2.4" ry="1.6" fill="#FF8FA8"/><ellipse cx="47" cy="46" rx="2.4" ry="1.6" fill="#FF8FA8"/>`,
      alpine_pack: `${lg("al-bp-b", "#4AA3C4", "#236E96")}
        <rect x="9" y="4" width="46" height="11" rx="5.5" fill="#F2C24A" ${SO}/><path d="M20 5v9M32 5v9M44 5v9" stroke="#C8922A" stroke-width="1.6"/>
        <path d="M13 16Q13 12 20 12H44Q51 12 51 16V54Q51 60 45 60H19Q13 60 13 54z" fill="url(#al-bp-b)" ${SO}/>
        <path d="M13 26Q32 32 51 26V18Q32 22 13 18z" fill="#1C5A7C" ${S2}/>
        <rect x="19" y="38" width="26" height="18" rx="6" fill="#2F86A8" ${S2}/><path d="M22 44H42" stroke="#1C5A7C" stroke-width="2"/>
        <circle cx="32" cy="32.5" r="7" fill="#fff" ${S2}/><path d="M32 30.3c-1.3-2-4.5-.9-3.6 1.4l3.6 3.4 3.6-3.4c.9-2.3-2.3-3.4-3.6-1.4z" fill="#E86A5A"/>
        <rect x="29.5" y="23" width="5" height="6" rx="1.2" fill="#F2C24A" stroke="${O}" stroke-width="1.4"/>`,
      alpine_onward: `${lg("al-ow-w", "#D8A874", "#A8743E")}
        <rect x="27" y="36" width="10" height="26" rx="2" fill="#8A5A36" ${SO}/>
        <path d="M4 14Q4 10 8 10H48L60 24L48 38H8Q4 38 4 34z" fill="url(#al-ow-w)" ${SO}/>
        <path d="M8 17H44M8 31H44" stroke="#8E5A2C" stroke-width="1.2" opacity=".45"/>
        ${T("ONWARD", 28, 29.5, 12, "#3A2414", 38)}
        <path d="M22 60c0-5 4-7 6-7M42 60c0-5-4-7-6-7" fill="none" stroke="#4FAE7E" stroke-width="3" stroke-linecap="round"/>
        <circle cx="12" cy="10" r="4" fill="#fff" ${SOw(1.6)}/><circle cx="18" cy="9" r="3" fill="#fff" ${SOw(1.6)}/>`,
      alpine_mirror: `${lg("al-mr-s", "#BFD9F2", "#E8F2FA")}${lg("al-mr-l", "#3C94B8", "#1C5A7C")}
        <defs><clipPath id="al-mr-c"><circle cx="32" cy="32" r="27"/></clipPath></defs>
        <circle cx="32" cy="32" r="28" fill="url(#al-mr-s)"/>
        <g clip-path="url(#al-mr-c)">
          <rect x="0" y="36" width="64" height="30" fill="url(#al-mr-l)"/>
          <path d="M0 36L18 16L28 26L38 12L64 36z" fill="#5C84A8"/><path d="M14 20.5L18 16L22 20L19 21zM33 18.5L38 12L43 18L39 19L36 17z" fill="#fff"/>
          <path d="M0 36L18 56L28 46L38 60L64 36z" fill="#9CC2F0" opacity=".45"/>
          <path d="M6 36L10 28L14 36zM48 36L52 26L56 36z" fill="#2F7A5A"/><path d="M6 36L10 44L14 36zM48 36L52 46L56 36z" fill="#2F7A5A" opacity=".45"/>
          <path d="M16 44h10M36 50h14M22 54h8" stroke="#E8F2FA" stroke-width="1.8" stroke-linecap="round" opacity=".7"/></g>
        <circle cx="32" cy="32" r="28" fill="none" ${SO}/>
        <circle cx="50" cy="16" r="3.6" fill="#F2C24A"/>`
    }},
    pins: [
      {id: "tp-alpine-compass", name: "Trail Compass", kind: "badge", desc: "A tiny brass trail compass pointing true north.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="al-pc-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".5" stop-color="#D9A83E"/><stop offset="1" stop-color="#8A6418"/></linearGradient><radialGradient id="al-pc-f" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE8F2"/></radialGradient></defs>
          <circle cx="15" cy="3.2" r="2.4" fill="none" stroke="#8A6418" stroke-width="1.4"/>
          <circle cx="15" cy="16" r="12.5" fill="url(#al-pc-r)" stroke="#6E4E12" stroke-width="1.1"/>
          <circle cx="15" cy="16" r="9" fill="url(#al-pc-f)" stroke="#8A6418" stroke-width=".8"/>
          <path d="M15 8.5L17.3 16H12.7z" fill="#D9573F"/><path d="M15 23.5L12.7 16H17.3z" fill="#1C3D54"/><circle cx="15" cy="16" r="1.3" fill="#F2C24A" stroke="#6E4E12" stroke-width=".5"/>
          <ellipse cx="10.5" cy="11" rx="2.4" ry="1.3" fill="#fff" opacity=".8" transform="rotate(-40 10.5 11)"/></svg>`},
      {id: "tp-alpine-peaks", name: "Peak Washi", kind: "tape", desc: "Misty blue washi tape printed with snowcapped peaks and pines.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="al-pt-c"><path d="M3 2H83L86 13L83 24H3L0 13z"/></clipPath></defs>
          <g clip-path="url(#al-pt-c)"><rect width="86" height="26" fill="#CBE0EE" opacity=".78"/>
          <path d="M0 24L10 12L16 18L26 7L36 17L44 10L56 20L66 8L76 16L86 11V26H0z" fill="#5C84A8" opacity=".85"/>
          <path d="M23.3 10L26 7L29 10.2L27 10zM63.4 11L66 8L68.8 11.4L66.6 10.6zM41.6 12.2L44 10L46.2 12z" fill="#fff"/>
          <path d="M8 26L11 19L14 26zM50 26L53 18L56 26zM78 26L81 20L84 26z" fill="#2F7A5A"/></g>
          <path d="M3 2L0 13L3 24M83 2L86 13L83 24" fill="none" stroke="#fff" stroke-width="0"/></svg>`}
    ],
    card: {id: "tp-alpine", name: "Trail Postcard", desc: "A cream postcard with an airmail border, a postmark and snowy peaks mirrored in a lake across the bottom."}
  });
})();


