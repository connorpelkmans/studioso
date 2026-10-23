/* ===== module: 96-tp-n6.js ===== */
/* Theme Collections, Study Fields batch n6 */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const happy = (x, y, w = 2.4) => `<path d="M${x - w} ${y + 1}q${w} ${-w * 1.3} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";

  /* ================= MOVIE PALACE (Film and Media Studies) ================= */
  TP_DATA.push({
    theme: "film",
    pack: {name: "Opening Night", items: {
      film_clapper: `${lg("n6-fl-cb", "#5A5470", "#2E2A3A")}
        <rect x="9" y="24" width="46" height="32" rx="5" fill="url(#n6-fl-cb)" ${SO}/>
        <g transform="rotate(-13 11 22)"><rect x="9" y="12" width="46" height="9" rx="2.5" fill="#F6F2EA" ${SO}/><path d="M16 12L21 21M26 12L31 21M36 12L41 21M46 12L51 21" stroke="#2E2A3A" stroke-width="3.6"/></g>
        <rect x="9" y="21" width="46" height="7" rx="2" fill="#F6F2EA" ${S2}/><path d="M15 21L19 28M25 21L29 28M35 21L39 28M45 21L49 28" stroke="#2E2A3A" stroke-width="3.4"/>
        <circle cx="11.5" cy="22" r="2.4" fill="#C9CED8" ${S15}/>
        ${EYES(25, 39, 39, 2.5)}${blush(20.5, 43.5, 44)}${smile(32, 43, 2.4)}
        <path d="M14 51H50" stroke="#fff" stroke-width="1.4" opacity=".4"/>${spark(58, 10, 4, "#FFD86B")}`,
      film_popcorn: `${lg("n6-fl-pc", "#FF6A70", "#C8323F")}
        <g ${S2}><circle cx="18" cy="21" r="7" fill="#FFF6DC"/><circle cx="28" cy="15" r="8" fill="#FFFBEA"/><circle cx="39" cy="15" r="8" fill="#FFF6DC"/><circle cx="47" cy="22" r="7" fill="#FFFBEA"/><circle cx="33" cy="9" r="6" fill="#FFF8E0"/></g>
        <circle cx="31" cy="10" r="1.5" fill="#F2C24A"/><circle cx="41" cy="16" r="1.5" fill="#F2C24A"/>
        <path d="M11 22H53L48 58Q47.6 61 44.6 61H19.4Q16.4 61 16 58Z" fill="url(#n6-fl-pc)" ${SO}/>
        <path d="M23 22L25 61M32 22V61M41 22L39 61" stroke="#FFF4EE" stroke-width="5"/>
        <path d="M11 22H53L48 58Q47.6 61 44.6 61H19.4Q16.4 61 16 58Z" fill="none" ${SO}/>
        ${EYES(26, 38, 37, 2.4)}${blush(21.5, 42.5, 42)}${smile(32, 41, 2.4)}`,
      film_reel: `${lg("n6-fl-rl", "#B8C0D4", "#6A7288")}
        <circle cx="30" cy="32" r="24" fill="url(#n6-fl-rl)" ${SO}/>
        <g fill="#3A3448" ${S15}><circle cx="30" cy="17" r="6"/><circle cx="43" cy="39" r="6"/><circle cx="17" cy="39" r="6"/></g>
        <circle cx="30" cy="32" r="4" fill="#E8ECF4" ${S15}/>
        <path d="M46 49Q56 54 61 46" fill="none" stroke="${O}" stroke-width="6"/><path d="M46 49Q56 54 61 46" fill="none" stroke="#5A4A38" stroke-width="3.4"/>
        ${happy(24, 29)}${happy(36, 29)}${blush(20, 40, 33)}<path d="M28 34q2 2 4 0" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        ${spark(56, 12, 4.4, "#FFD86B")}`,
      film_ticket: `${lg("n6-fl-tk", "#FFD27A", "#F2A33A")}
        <g transform="rotate(-10 32 32)"><path d="M6 18H58V27A5 5 0 0 0 58 37V46H6V37A5 5 0 0 0 6 27Z" fill="url(#n6-fl-tk)" ${SO}/>
        <path d="M18 19V45" stroke="${O}" stroke-width="1.4" stroke-dasharray="2 2.4"/>
        ${T("ADMIT", 38, 30, 8.4, "#8A3A1A", 26)}${T("ONE", 38, 40, 9.4, "#C8323F", 20)}
        <circle cx="12" cy="32" r="2.4" fill="#C8323F"/></g>${spark(55, 54, 4, "#FF8FA8")}`,
      film_camera: `${lg("n6-fl-cm", "#6A6E82", "#3A3E50")}
        <circle cx="20" cy="15" r="9" fill="#8A8EA0" ${SO}/><circle cx="38" cy="15" r="9" fill="#8A8EA0" ${SO}/><circle cx="20" cy="15" r="3" fill="#3A3E50"/><circle cx="38" cy="15" r="3" fill="#3A3E50"/>
        <rect x="8" y="24" width="40" height="28" rx="6" fill="url(#n6-fl-cm)" ${SO}/>
        <path d="M48 32L60 26V50L48 44Z" fill="#8A8EA0" ${SO}/>
        <circle cx="28" cy="38" r="9" fill="#BFE0F2" ${S2}/><circle cx="25.5" cy="35.5" r="2.6" fill="#fff"/>
        <circle cx="14" cy="30" r="2" fill="#E8453E"/>${spark(57, 12, 4, "#FFD86B")}`,
      film_star: `${rg("n6-fl-st", "#FFF2B0", "#F2A82A", .4, .35)}
        <rect x="4" y="44" width="56" height="14" rx="4" fill="#C8606A" ${SO}/>
        <path d="${star(32, 30, 24, 11, 5)}" fill="url(#n6-fl-st)" ${SO}/>
        ${EYES(26, 38, 30, 2.4)}${blush(22, 42, 35)}${smile(32, 34, 2.4)}
        ${spark(8, 12, 4, "#FFD86B")}${spark(56, 12, 3, "#FF8FA8")}`,
      film_glasses: `<path d="M6 26H58V30L54 44H38L33 34H31L26 44H10L6 30Z" fill="#FFFFFF" ${SO}/>
        <path d="M11 29H27L24 40H13Z" fill="#E8453E" opacity=".9" ${S15}/><path d="M37 29H53L51 40H40Z" fill="#4A9AE8" opacity=".9" ${S15}/>
        <path d="M14 31L18 31" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M40 31L44 31" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${smile(32, 50, 3)}${spark(8, 14, 4, "#FFD86B")}${spark(57, 54, 3.4, "#FF8FA8")}`,
      film_action: `${lg("n6-fl-ac", "#3A3448", "#1E1A28")}
        <rect x="4" y="16" width="56" height="34" rx="8" fill="url(#n6-fl-ac)" ${SO}/>
        ${Array.from({length: 9}, (_, i) => `<circle cx="${9 + i * 5.75}" cy="20" r="1.4" fill="#FFE08A"/><circle cx="${9 + i * 5.75}" cy="46" r="1.4" fill="#FFE08A"/>`).join("")}
        ${T("ACTION!", 32, 37.6, 12.5, "#FFE08A", 44)}${spark(56, 9, 4.4, "#FF8FA8")}${spark(8, 57, 3.4, "#FFE08A")}`
    }},
    pins: [
      {id: "tp-film-reel", name: "Golden Reel Pin", kind: "badge", desc: "A shiny little golden film reel.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n6-pp-rl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF2B0"/><stop offset="1" stop-color="#D8962A"/></radialGradient></defs>
          <circle cx="15" cy="15" r="12.6" fill="url(#n6-pp-rl)" stroke="#7A4E10" stroke-width="1.2"/>
          <g fill="#7A4E10"><circle cx="15" cy="8.4" r="2.8"/><circle cx="20.8" cy="18.4" r="2.8"/><circle cx="9.2" cy="18.4" r="2.8"/></g><circle cx="15" cy="15" r="1.8" fill="#FFF6D0"/>
          <ellipse cx="10" cy="8.6" rx="2.6" ry="1.4" fill="#fff" opacity=".7" transform="rotate(-40 10 8.6)"/></svg>`},
      {id: "tp-film-strip", name: "Film Strip Washi", kind: "tape", desc: "A strip of film tape with sprocket holes and tiny frames.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2E2A3A" opacity=".9"/>
          ${Array.from({length: 13}, (_, i) => `<rect x="${7 + i * 5.8}" y="3.4" width="3" height="2.6" rx=".6" fill="#F6F2EA"/><rect x="${7 + i * 5.8}" y="20" width="3" height="2.6" rx=".6" fill="#F6F2EA"/>`).join("")}
          ${[0, 1, 2, 3].map(i => `<rect x="${9 + i * 18.6}" y="8" width="15" height="10" rx="1.4" fill="${["#FFD86B", "#FF8FA8", "#8FD8F2", "#B8E08A"][i]}" opacity=".9"/>`).join("")}</svg>`}
    ],
    card: {id: "tp-film", name: "Ticket Stub", desc: "A cream ticket with a perforated edge, a clapperboard in the corner and a strip of film along the bottom. Velvet red and gold in dark mode."}
  });

  /* ================= TEST KITCHEN (Culinary Arts and Nutrition) ================= */
  TP_DATA.push({
    theme: "culinary",
    pack: {name: "Mise en Place", items: {
      culinary_whisk: `${lg("n6-cu-wh", "#F2B47A", "#C8783E")}
        <g fill="none" stroke-linecap="round"><path d="M26 30C14 16 20 4 32 4C44 4 50 16 38 30M29 30C24 16 26 6 32 4C38 6 40 16 35 30" stroke="${O}" stroke-width="5"/><path d="M26 30C14 16 20 4 32 4C44 4 50 16 38 30M29 30C24 16 26 6 32 4C38 6 40 16 35 30" stroke="#DDE4EC" stroke-width="2.4"/></g>
        <rect x="22" y="28" width="20" height="32" rx="10" fill="url(#n6-cu-wh)" ${SO}/><rect x="20" y="27" width="24" height="6" rx="3" fill="#C9D2DC" ${S2}/>
        ${EYES(27.5, 36.5, 42, 2.2)}${blush(24.5, 39.5, 47, 2, 1.4)}${smile(32, 46, 2)}${spark(52, 10, 4, "#FFD86B")}<circle cx="49" cy="20" r="2.4" fill="#fff" ${S15}/>`,
      culinary_toque: `${rg("n6-cu-tq", "#FFFFFF", "#DCE2EA", .4, .35)}
        <path d="M14 34C6 32 6 18 16 16C15 8 26 3 31 9C34 2 45 3 46 11C53 6 63 13 56 21C64 24 62 34 54 34Z" fill="url(#n6-cu-tq)" ${SO}/>
        <path d="M14 32H54V54Q54 58 50 58H18Q14 58 14 54Z" fill="#FFFFFF" ${SO}/><path d="M22 34V56M30 34V56M38 34V56M46 34V56" stroke="#DCE2EA" stroke-width="1.6"/>
        ${EYES(26, 42, 44, 2.4)}${blush(21.5, 46.5, 49)}${smile(34, 48, 2.4)}<path d="M18 22Q20 15 26 14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
      culinary_egg: `<path d="M8 34C6 20 18 10 30 14C40 6 58 14 56 28C62 40 52 54 38 52C28 60 10 54 12 44C6 42 6 38 8 34Z" fill="#FFFFFF" ${SO}/>
        ${rg("n6-cu-eg", "#FFE27A", "#F2A22A", .38, .32)}<circle cx="32" cy="33" r="12" fill="url(#n6-cu-eg)" ${S2}/>
        ${happy(27.5, 32)}${happy(36.5, 32)}${blush(24, 40, 37, 2.2, 1.5)}<path d="M30.5 37q1.5 1.6 3 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="27" cy="27" rx="3" ry="1.8" fill="#fff" opacity=".7" transform="rotate(-30 27 27)"/>${spark(54, 10, 4, "#FFD86B")}`,
      culinary_pan: `<path d="M44 34L60 22" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M44 34L60 22" stroke="#C8925A" stroke-width="3.6" stroke-linecap="round"/>
        <ellipse cx="26" cy="38" rx="22" ry="12" fill="#3A3A48" ${SO}/><ellipse cx="26" cy="36" rx="18" ry="8.6" fill="#55555F"/>
        <ellipse cx="25" cy="35" rx="12" ry="5.4" fill="#F4C64A" ${S15}/><ellipse cx="23" cy="34" rx="7" ry="2.6" fill="#FBDD72"/>
        <path d="M20 33l2 1M27 33.4l1.6-1M30 36l1 1" stroke="#4E9A4A" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M18 18Q16 12 20 8M26 18Q24 11 28 6M34 18Q32 12 36 8" fill="none" stroke="#C9D2DC" stroke-width="2.2" stroke-linecap="round"/>`,
      culinary_tomato: `${rg("n6-cu-tm", "#FF9A7A", "#D8382E", .38, .32)}
        <path d="M32 18C46 16 56 26 56 38C56 50 46 58 32 58C18 58 8 50 8 38C8 26 18 16 32 18Z" fill="url(#n6-cu-tm)" ${SO}/>
        <path d="M32 20L24 12L30 16L32 8L34 16L40 12Z" fill="#5DA84E" ${S2}/><path d="M32 14V6" stroke="#4E8A3E" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(25, 39, 38, 2.5)}${blush(20.5, 43.5, 43)}${smile(32, 42, 2.4)}<ellipse cx="18" cy="28" rx="4" ry="2.2" fill="#fff" opacity=".6" transform="rotate(-40 18 28)"/>`,
      culinary_basil: `${lg("n6-cu-bs", "#9AE07A", "#4E9A4A")}
        <path d="M32 58V34" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 58V34" stroke="#4E8A3E" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M32 38C18 40 6 30 8 16C22 14 32 24 32 38Z" fill="url(#n6-cu-bs)" ${SO}/><path d="M32 38C46 40 58 30 56 16C42 14 32 24 32 38Z" fill="url(#n6-cu-bs)" ${SO}/>
        <path d="M30 36Q20 28 12 18M34 36Q44 28 52 18" fill="none" stroke="#3E7A3A" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <path d="M32 30C26 22 28 10 32 6C36 10 38 22 32 30Z" fill="#B0EA8A" ${S2}/>${EYES(18, 25, 26, 1.8)}${smile(21.5, 30, 1.6, 1.5)}${spark(54, 50, 4, "#FFD86B")}`,
      culinary_cupcake: `${lg("n6-cu-cc", "#FFB0C8", "#F07AA0")}${lg("n6-cu-cw", "#F6D2A6", "#D8A06A")}
        <path d="M14 36H50L45 58H19Z" fill="url(#n6-cu-cw)" ${SO}/><path d="M22 38L24 56M32 38V57M42 38L40 56" stroke="#B87A48" stroke-width="1.6"/>
        <path d="M12 38C8 30 14 22 22 24C22 14 34 10 40 18C48 16 56 24 52 32C56 36 52 40 48 38Z" fill="url(#n6-cu-cc)" ${SO}/>
        <circle cx="34" cy="13" r="4.4" fill="#E8453E" ${S2}/><path d="M34 9Q36 5 40 4" fill="none" stroke="#4E8A3E" stroke-width="1.6" stroke-linecap="round"/>
        ${EYES(26, 38, 46, 2.2)}${blush(22, 42, 50, 2.2, 1.5)}${smile(32, 49.5, 2)}<circle cx="20" cy="30" r="1.4" fill="#FFE27A"/><circle cx="44" cy="28" r="1.4" fill="#8FD8F2"/><circle cx="30" cy="24" r="1.4" fill="#fff"/>`,
      culinary_yeschef: `${lg("n6-cu-ys", "#E8704A", "#C8483A")}
        <rect x="4" y="18" width="56" height="30" rx="15" fill="url(#n6-cu-ys)" ${SO}/>
        <rect x="8" y="22" width="48" height="22" rx="11" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="1.6 3" stroke-linecap="round" opacity=".7"/>
        ${T("YES, CHEF!", 32, 37.4, 10.5, "#FFFFFF", 42)}${spark(56, 12, 4.4, "#FFD86B")}<circle cx="9" cy="54" r="2" fill="#5DA84E"/>`
    }},
    pins: [
      {id: "tp-culinary-pan", name: "Copper Pan Pin", kind: "badge", desc: "A gleaming little copper pan.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n6-pp-cp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6A877"/><stop offset="1" stop-color="#A8532C"/></linearGradient></defs>
          <path d="M20 13L28 5" stroke="#6E3A1A" stroke-width="4.4" stroke-linecap="round"/><path d="M20 13L28 5" stroke="#D97B45" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="13" cy="17" r="10.4" fill="url(#n6-pp-cp)" stroke="#6E3A1A" stroke-width="1.2"/><circle cx="13" cy="17" r="7" fill="#C8683A" stroke="#8A4422" stroke-width=".8"/>
          <ellipse cx="9.4" cy="12.6" rx="2.6" ry="1.4" fill="#fff" opacity=".65" transform="rotate(-40 9.4 12.6)"/></svg>`},
      {id: "tp-culinary-gingham", name: "Gingham Washi", kind: "tape", desc: "Red gingham tape, like a little kitchen towel.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="n6-pp-gc"><path d="${tapeEdge}"/></clipPath></defs><path d="${tapeEdge}" fill="#FFF8F2" opacity=".95"/>
          <g clip-path="url(#n6-pp-gc)" fill="#E25A4A" opacity=".45">${Array.from({length: 11}, (_, i) => `<rect x="${4 + i * 8}" y="0" width="4" height="26"/>`).join("")}${Array.from({length: 4}, (_, i) => `<rect x="0" y="${2 + i * 6.4}" width="86" height="3.2"/>`).join("")}</g></svg>`}
    ],
    card: {id: "tp-culinary", name: "Recipe Card", desc: "A lined recipe card with a whisk and herbs in the corner and a gingham edge. Warm slate with copper in dark mode."}
  });

  /* ================= KELP FOREST (Marine Biology and Oceanography) ================= */
  TP_DATA.push({
    theme: "marinebio",
    pack: {name: "Tide Log", items: {
      marinebio_otter: `${lg("n6-mb-ot", "#A87452", "#7A4E32")}
        <path d="M4 44Q32 36 60 44" fill="none" stroke="#8FD0E0" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="30" cy="40" rx="22" ry="11" fill="url(#n6-mb-ot)" ${SO}/><ellipse cx="32" cy="37" rx="14" ry="6" fill="#D8B08A"/>
        <circle cx="50" cy="28" r="11" fill="#9A6A48" ${SO}/><ellipse cx="52" cy="31" rx="7" ry="5.6" fill="#EAD2B8"/>
        <circle cx="44" cy="19" r="3" fill="#9A6A48" ${S15}/><circle cx="56" cy="18.6" r="3" fill="#9A6A48" ${S15}/>
        <ellipse cx="52.6" cy="30" rx="2" ry="1.4" fill="${O}"/>${happy(47, 26, 1.8)}${happy(57, 26, 1.8)}
        <path d="M27 30A6 6 0 0 1 39 30Z" fill="#FFE4D0" ${S15}/><path d="M33 25V30M30 26L31 30M36 26L35 30" stroke="#E8B49A" stroke-width=".9"/>
        <ellipse cx="27" cy="31" rx="3.6" ry="2.6" fill="#7A4E32" ${S15}/><ellipse cx="39" cy="31" rx="3.6" ry="2.6" fill="#7A4E32" ${S15}/>${spark(10, 14, 4, "#FFFFFF")}`,
      marinebio_kelp: `${lg("n6-mb-kp", "#E0C454", "#9A7E2A")}
        <path d="M30 60Q26 40 32 20Q36 10 30 4" fill="none" stroke="${O}" stroke-width="5.4" stroke-linecap="round"/><path d="M30 60Q26 40 32 20Q36 10 30 4" fill="none" stroke="#9A7E2A" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M30 50C18 50 10 42 10 34C20 34 28 40 30 50Z" fill="url(#n6-mb-kp)" ${S2}/><path d="M31 38C44 38 52 30 54 20C42 20 34 28 31 38Z" fill="url(#n6-mb-kp)" ${S2}/><path d="M32 22C24 20 18 14 18 8C26 8 32 14 32 22Z" fill="url(#n6-mb-kp)" ${S2}/>
        <circle cx="30" cy="51" r="3" fill="#F2D46A" ${S15}/><circle cx="31.4" cy="38" r="3" fill="#F2D46A" ${S15}/><circle cx="32" cy="22" r="2.6" fill="#F2D46A" ${S15}/>
        ${EYES(18, 25, 42, 1.7)}${smile(21.5, 45.5, 1.5, 1.4)}<circle cx="52" cy="48" r="3" fill="#fff" ${S15}/><circle cx="56" cy="40" r="2" fill="#fff" ${S15}/>`,
      marinebio_sub: `${lg("n6-mb-sb", "#FFE27A", "#E8A82A")}
        <rect x="24" y="12" width="14" height="10" rx="3" fill="#F2B624" ${S2}/><path d="M34 12V6H40" fill="none" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/><path d="M34 12V6H40" fill="none" stroke="#8A8EA0" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M8 38C8 26 18 20 32 20C48 20 58 28 58 38C58 48 48 54 32 54C18 54 8 50 8 38Z" fill="url(#n6-mb-sb)" ${SO}/>
        <circle cx="38" cy="37" r="11" fill="#C8963A" ${S2}/><circle cx="38" cy="37" r="8.4" fill="#BDEBF4"/>
        ${EYES(34.5, 41.5, 37, 1.9)}${smile(38, 40.5, 1.6, 1.5)}<circle cx="18" cy="35" r="3" fill="#BDEBF4" ${S15}/>
        <path d="M4 36L8 32V44L4 40Z" fill="#B8A06A" ${S15}/><circle cx="12" cy="14" r="2.4" fill="#fff" ${S15}/><circle cx="6" cy="22" r="1.6" fill="#fff" ${S15}/>`,
      marinebio_dolphin: `${lg("n6-mb-dp", "#9CC6EE", "#5A84B4")}
        <path d="M6 44C10 26 28 16 44 20C52 22 58 28 60 32C56 34 52 34 50 34C46 44 34 50 22 50L14 58L14 48C10 48 7 46 6 44Z" fill="url(#n6-mb-dp)" ${SO}/>
        <path d="M30 20C30 12 36 8 42 8C38 12 38 16 38 20Z" fill="#6E9AC8" ${S2}/>
        <path d="M22 46C32 46 42 42 48 34C40 38 30 40 22 40Z" fill="#EEF7FC"/>
        <circle cx="46" cy="27" r="2.2" fill="${O}"/><circle cx="46.8" cy="26.2" r=".8" fill="#fff"/><ellipse cx="47" cy="31.6" rx="2.4" ry="1.4" fill="#FF8FA8" opacity=".8"/>
        <path d="M52 34Q55 36 58 33" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>${spark(12, 14, 4, "#FFFFFF")}<circle cx="20" cy="22" r="2" fill="#fff" ${S15}/>`,
      marinebio_fish: `${lg("n6-mb-fs", "#FFAA5A", "#F06A2A")}
        <path d="M44 32L60 20V44Z" fill="#F06A2A" ${SO}/><path d="M22 18Q30 8 38 18" fill="#F2843A" ${S2}/>
        <ellipse cx="28" cy="32" rx="22" ry="15" fill="url(#n6-mb-fs)" ${SO}/>
        <path d="M30 18Q34 32 30 46M38 20Q41 32 38 44" fill="none" stroke="#FFD2A0" stroke-width="1.6" opacity=".7"/>
        ${EYES(14, 22, 30, 2.4)}${blush(11, 25, 36, 2.2, 1.4)}${smile(18, 36, 2.2)}<ellipse cx="22" cy="23" rx="5" ry="2" fill="#fff" opacity=".5"/>
        <circle cx="10" cy="12" r="2.6" fill="#fff" ${S15}/><circle cx="16" cy="6" r="1.6" fill="#fff" ${S15}/>`,
      marinebio_starfish: `${rg("n6-mb-sf", "#FFB89A", "#F06A4A", .4, .35)}
        <path d="${star(32, 34, 27, 12, 5)}" fill="url(#n6-mb-sf)" ${SO}/>
        ${[[32, 14], [50, 27], [43, 49], [21, 49], [14, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#FFE2D0"/>`).join("")}
        ${EYES(27, 37, 34, 2.3)}${blush(23, 41, 39, 2.2, 1.5)}${smile(32, 38.5, 2.2)}`,
      marinebio_shell: `${lg("n6-mb-sh", "#FFE4D0", "#F7A6BE")}
        <path d="M32 54L6 34C6 18 18 8 32 8C46 8 58 18 58 34Z" fill="url(#n6-mb-sh)" ${SO}/>
        <path d="M32 52L14 20M32 52L24 12M32 52V9M32 52L40 12M32 52L50 20" stroke="#E888A0" stroke-width="1.6"/>
        <path d="M24 54H40V58Q40 60 38 60H26Q24 60 24 58Z" fill="#F7A6BE" ${S2}/><circle cx="52" cy="50" r="4" fill="#FFFFFF" ${S2}/><circle cx="51" cy="49" r="1.2" fill="#E8F4FF"/>
        ${spark(10, 50, 4, "#8FD8F2")}`,
      marinebio_divein: `${lg("n6-mb-dv", "#3AA6A0", "#1A6E6E")}
        <path d="M4 30Q10 24 16 30T28 30T40 30T52 30T64 30V50Q64 54 60 54H8Q4 54 4 50Z" fill="url(#n6-mb-dv)" ${SO}/>
        ${T("DIVE IN!", 33, 45, 12, "#FFFFFF", 42)}<circle cx="50" cy="16" r="3.4" fill="#fff" ${S15}/><circle cx="56" cy="8" r="2.2" fill="#fff" ${S15}/><circle cx="12" cy="14" r="2.6" fill="#fff" ${S15}/>${spark(30, 14, 4, "#F2C230")}`
    }},
    pins: [
      {id: "tp-marinebio-shell", name: "Pearl Shell Pin", kind: "badge", desc: "A pink scallop shell holding a tiny pearl.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n6-pp-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE4D0"/><stop offset="1" stop-color="#F28AAA"/></linearGradient></defs>
          <path d="M15 26L3 16C3 8 8 4 15 4C22 4 27 8 27 16Z" fill="url(#n6-pp-sh)" stroke="#9A3A5A" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M15 25L8 10M15 25L12 6M15 25V5M15 25L18 6M15 25L22 10" stroke="#D86A8A" stroke-width=".9"/><circle cx="15" cy="23" r="3" fill="#FFFFFF" stroke="#9A3A5A" stroke-width=".9"/></svg>`},
      {id: "tp-marinebio-waves", name: "Wave Washi", kind: "tape", desc: "Sea green tape with rolling waves and little bubbles.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#3AA6A0" opacity=".88"/>
          <path d="M5 15Q11 9 17 15T29 15T41 15T53 15T65 15T77 15T84 15" fill="none" stroke="#DDF6F2" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M5 21Q11 17 17 21T29 21T41 21T53 21T65 21T77 21" fill="none" stroke="#8FE0D8" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="14" cy="7" r="1.6" fill="#fff"/><circle cx="40" cy="6" r="1.2" fill="#fff"/><circle cx="66" cy="7.4" r="1.6" fill="#fff"/></svg>`}
    ],
    card: {id: "tp-marinebio", name: "Field Notebook", desc: "Waterproof field-notebook paper with kelp in the corner and waves along the bottom. Deep ocean teal in dark mode."}
  });

})();
/* end of module 96-tp-n6.js */




