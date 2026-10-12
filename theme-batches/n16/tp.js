/* Theme Collections, new theme ideas batch n16: saguaro, baobab */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const ring = (cx, cy, n, R, fn, rot = 0) => Array.from({length: n}, (_, i) => { const a = -Math.PI / 2 + rot + i * 2 * Math.PI / n; return fn(f1(cx + R * Math.cos(a)), f1(cy + R * Math.sin(a)), a, i); }).join("");
  const bloom = (x, y, r) => `${ring(x, y, 6, r * .62, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * .5)}" fill="#FFFBF2" ${SOw(1.1)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * .42)}" fill="#F6C83A" ${SOw(1.1)}/>`;
  const daisy = (x, y, r, c = "#F6C83A") => `${ring(x, y, 8, r * .6, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * .4)}" fill="${c}" ${SOw(1)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * .36)}" fill="#C8783A" ${SOw(1)}/>`;
  // a saguaro silhouette with two arms, centred at x, standing on y
  const cactus = (x, y, h, fill, sw) => { const w = h * .13, a = h * .55; return `<path d="M${f1(x - w)} ${y}V${f1(y - h + w)}A${f1(w)} ${f1(w)} 0 0 1 ${f1(x + w)} ${f1(y - h + w)}V${y}Z M${f1(x - w)} ${f1(y - a + w * 1.5)}H${f1(x - w * 2.6)}A${f1(w * .9)} ${f1(w * .9)} 0 0 1 ${f1(x - w * 3.5)} ${f1(y - a + w * .6)}V${f1(y - a - w * 1.4)}A${f1(w * .75)} ${f1(w * .75)} 0 0 1 ${f1(x - w * 2)} ${f1(y - a - w * 1.4)}V${f1(y - a)}H${f1(x - w)}Z M${f1(x + w)} ${f1(y - a * .8 + w * 1.5)}H${f1(x + w * 2.4)}A${f1(w * .9)} ${f1(w * .9)} 0 0 0 ${f1(x + w * 3.3)} ${f1(y - a * .8 + w * .6)}V${f1(y - a * .8 - w * 1.8)}A${f1(w * .75)} ${f1(w * .75)} 0 0 0 ${f1(x + w * 1.8)} ${f1(y - a * .8 - w * 1.8)}V${f1(y - a * .8)}H${f1(x + w)}Z" fill="${fill}" ${sw || ""}/>`; };
  // a baobab silhouette: a fat column with a flat crown of stubby branches
  const baobab = (x, y, h, fill, sw) => { const w = h * .13, t = y - h * .74; return `<path d="M${f1(x - w * 1.15)} ${y}C${f1(x - w * 1.05)} ${f1(y - h * .3)} ${f1(x - w * .95)} ${f1(t + h * .1)} ${f1(x - w * .8)} ${f1(t)}L${f1(x - w * 2.6)} ${f1(t - h * .16)}L${f1(x - w * 2.1)} ${f1(t - h * .2)}L${f1(x - w * .7)} ${f1(t - h * .06)}L${f1(x - w * .9)} ${f1(t - h * .24)}L${f1(x - w * .3)} ${f1(t - h * .25)}L${f1(x)} ${f1(t - h * .08)}L${f1(x + w * .3)} ${f1(t - h * .25)}L${f1(x + w * .9)} ${f1(t - h * .24)}L${f1(x + w * .7)} ${f1(t - h * .06)}L${f1(x + w * 2.1)} ${f1(t - h * .2)}L${f1(x + w * 2.6)} ${f1(t - h * .16)}L${f1(x + w * .8)} ${f1(t)}C${f1(x + w * .95)} ${f1(t + h * .1)} ${f1(x + w * 1.05)} ${f1(y - h * .3)} ${f1(x + w * 1.15)} ${y}Z" fill="${fill}" ${sw || ""}/>`; };

  /* ================= SAGUARO SUNSET ================= */
  TP_DATA.push({
    theme: "saguaro",
    pack: {name: "Sonoran Sunset Club", items: {
      saguaro_sago: `${lg("n16-ss-g", "#F2B88A", "#D88A62")}<path d="M10 60C13 52 22 50 32 50C42 50 51 52 54 60Z" fill="url(#n16-ss-g)" ${S2}/>
        ${lg("n16-ss-b", "#5E9A50", "#86BC6A", 1, 0)}<path d="M23 54V24C23 17 27 12 32 12C37 12 41 17 41 24V54Z" fill="url(#n16-ss-b)" ${SO}/>
        <path d="M23.5 44H17C14 44 12 42 12 39V31C12 29 13.6 27.4 15.6 27.4C17.6 27.4 19.2 29 19.2 31V38H23.5Z" fill="#6AA45A" ${S2}/><path d="M40.5 40H47C50 40 52 38 52 35V26C52 24 50.4 22.4 48.4 22.4C46.4 22.4 44.8 24 44.8 26V34H40.5Z" fill="#6AA45A" ${S2}/>
        ${EYES(28, 36, 30, 1.6)}${blush(25.6, 38.4, 34, 1.6, 1)}${smile(32, 34.4, 1.7, 1.5)}${bloom(26, 12, 4.4)}${bloom(38, 12, 4.4)}${bloom(32, 8.6, 5)}${spark(55, 12, 3.4, "#FFD06A")}`,
      saguaro_owl: `${rg("n16-so-b", "#D8BC96", "#94765A", .45, .35)}<path d="M14 40C14 27 22 20 32 20C42 20 50 27 50 40C50 52 42 58 32 58C22 58 14 52 14 40Z" fill="url(#n16-so-b)" ${SO}/>
        <circle cx="25" cy="36" r="8.4" fill="#F6ECD8"/><circle cx="39" cy="36" r="8.4" fill="#F6ECD8"/><circle cx="25" cy="36.6" r="6" fill="#F6C83A" ${S15}/><circle cx="39" cy="36.6" r="6" fill="#F6C83A" ${S15}/>
        <circle cx="25" cy="37" r="3.2" fill="${O}"/><circle cx="39" cy="37" r="3.2" fill="${O}"/><circle cx="26" cy="35.8" r="1.1" fill="#fff"/><circle cx="40" cy="35.8" r="1.1" fill="#fff"/>
        <path d="M17 29Q25 25 30.6 30M47 29Q39 25 33.4 30" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M30 41.4H34L32 45.6Z" fill="#B8B4A0" ${SOw(1.2)}/>
        <path d="M27 51l2 2 2-2M33 51l2 2 2-2" fill="none" stroke="#A8885E" stroke-width="1.3" stroke-linecap="round"/>${spark(54, 14, 3.4, "#FFE6A0")}${spark(10, 20, 2.4, "#FFE6A0")}`,
      saguaro_tortoise: `${rg("n16-st-s", "#D4AE6A", "#86602E", .45, .3)}<path d="M8 50C8 30 18 20 32 20C46 20 56 30 56 50Z" fill="url(#n16-st-s)" ${SO}/>
        <path d="M26 26H38L40 33L32 37L24 33Z" fill="#E2C482" ${SOw(1.2)}/><path d="M14 38L20 36L22 44L16 48Z M50 38L44 36L42 44L48 48Z" fill="#E2C482" ${SOw(1.2)}/>
        <path d="M6 50H58" stroke="${O}" stroke-width="5.6" stroke-linecap="round"/><path d="M7.4 50H56.6" stroke="#C89A58" stroke-width="2.6" stroke-linecap="round"/>
        ${rg("n16-st-h", "#D6C292", "#9A845A", .42, .32)}<path d="M22 44C22 37 26 33 32 33C38 33 42 37 42 44C42 50 38 53 32 53C26 53 22 50 22 44Z" fill="url(#n16-st-h)" ${S2}/>
        ${EYES(28.4, 35.6, 43, 1.5)}${blush(25.6, 38.4, 46.6, 1.4, .9)}${smile(32, 47, 1.5, 1.4)}<path d="M12 58h7M45 58h7" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`,
      saguaro_bloom: `${bloom(32, 32, 24)}${ring(32, 32, 10, 5.4, (x, y) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#E2A420"/>`)}${spark(54, 10, 4, "#FFD06A")}${spark(10, 54, 3, "#FFD06A")}`,
      saguaro_pear: `${lg("n16-sp-p", "#7EA854", "#4E7A3A")}<ellipse cx="30" cy="44" rx="13" ry="17" fill="url(#n16-sp-p)" ${SO}/><ellipse cx="44" cy="22" rx="9.6" ry="12.6" transform="rotate(24 44 22)" fill="url(#n16-sp-p)" ${S2}/><ellipse cx="17" cy="23" rx="8.6" ry="11" transform="rotate(-28 17 23)" fill="url(#n16-sp-p)" ${S2}/>
        <g fill="#FFF3D6">${[[26, 36], [34, 40], [28, 48], [35, 52], [24, 54], [42, 18], [46, 26], [15, 20], [19, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join("")}</g>
        <g fill="#C8304E" ${SOw(1.3)}><ellipse cx="49" cy="10.4" rx="3.2" ry="4.4" transform="rotate(24 49 10.4)"/><ellipse cx="41" cy="9" rx="3" ry="4.2"/><ellipse cx="12" cy="12" rx="3" ry="4.2" transform="rotate(-28 12 12)"/></g>`,
      saguaro_sunset: `${lg("n16-su-s", "#8A4A98", "#FFB25A")}<circle cx="32" cy="32" r="26" fill="url(#n16-su-s)" ${SO}/><circle cx="32" cy="38" r="11" fill="#FFF0C8"/>
        <path d="M6.6 40L14 32L19 36L26 28L33 35L40 30L47 36L52 33L57.4 40A26 26 0 0 1 6.6 40Z" fill="#6E4478"/><path d="M7.6 44H56.4A26 26 0 0 1 7.6 44Z" fill="#D08068"/>
        ${cactus(18, 52, 22, "#3E553A")}${cactus(46, 50, 14, "#3E553A")}<circle cx="32" cy="32" r="26" fill="none" ${SO}/>`,
      saguaro_brittle: `${lg("n16-sb-m", "#B8C2A6", "#8E9A7C")}<path d="M8 56C8 42 18 36 32 36C46 36 56 42 56 56Z" fill="url(#n16-sb-m)" ${SO}/>
        <path d="M18 40Q16 28 14 22M26 38Q26 26 24 16M38 38Q38 26 40 16M46 40Q48 28 50 22M32 37V12" fill="none" stroke="#5E6A4E" stroke-width="1.6" stroke-linecap="round"/>
        ${daisy(14, 20, 8)}${daisy(24, 14, 8)}${daisy(32, 10, 8.6)}${daisy(40, 14, 8)}${daisy(50, 20, 8)}`,
      saguaro_label: `${lg("n16-sx-b", "#5E3C7A", "#C8506A")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n16-sx-b)" ${SO}/>
        ${T("STAY SHARP", 32, 36.6, 9.6, "#FFE0A8", 46)}<path d="M12 41.5h40" stroke="#FFB25A" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="1 3.4"/>
        ${cactus(9, 22, 14, "#4E7A44", SOw(1.4))}${bloom(55, 17, 7)}`
    }},
    pins: [
      {id: "tp-saguaro-bloom", name: "Saguaro Blossom Pin", kind: "badge", desc: "A creamy white saguaro blossom with a golden heart, the flower of the Sonoran desert.",
        svg: `<svg viewBox="0 0 30 30">${ring(15, 15, 6, 6.6, (x, y) => `<circle cx="${x}" cy="${y}" r="5.6" fill="#FFFBF2" stroke="#8A6A4A" stroke-width="1.1"/>`)}<circle cx="15" cy="15" r="5" fill="#F6C83A" stroke="#8A6A4A" stroke-width="1.1"/>${ring(15, 15, 8, 3, (x, y) => `<circle cx="${x}" cy="${y}" r=".8" fill="#C8841E"/>`)}<ellipse cx="9" cy="8.6" rx="2" ry="1.1" fill="#fff" opacity=".7" transform="rotate(-40 9 8.6)"/></svg>`},
      {id: "tp-saguaro-washi", name: "Desert Sunset Washi", kind: "tape", desc: "Sunset-striped washi tape with a row of saguaro silhouettes.",
        svg: `<svg viewBox="0 0 86 26"><defs><linearGradient id="n16-pw-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A4E98"/><stop offset=".55" stop-color="#F87C60"/><stop offset="1" stop-color="#FFC060"/></linearGradient></defs><path d="${tapeEdge}" fill="url(#n16-pw-s)" opacity=".95"/>
          <circle cx="58" cy="17" r="5" fill="#FFF0C8" opacity=".9"/><path d="M5 21L14 17L22 20L32 15L42 19L52 16L62 20L72 16L81 19V24.5H5Z" fill="#6E4478" opacity=".9"/>
          ${cactus(14, 23, 13, "#2E3E2C")}${cactus(36, 23, 10, "#2E3E2C")}${cactus(72, 23, 12, "#2E3E2C")}<path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-saguaro", name: "Desert Bloom", desc: "Warm sunset-peach paper with a blooming saguaro in the corner and brittlebush along the bottom. Starry indigo with a moonrise in dark mode."}
  });

  /* ================= BAOBAB DUSK ================= */
  TP_DATA.push({
    theme: "baobab",
    pack: {name: "Avenue of Giants", items: {
      baobab_hery: `${lg("n16-bh-m", "#D87A56", "#B0563C")}<path d="M10 60C13 52 22 50 32 50C42 50 51 52 54 60Z" fill="url(#n16-bh-m)" ${S2}/>
        ${lg("n16-bh-b", "#9A6A60", "#C29484", 1, 0)}<path d="M21 54C19 46 18 36 21 30C23 25 26 22 28 20H36C38 22 41 25 43 30C46 36 45 46 43 54Z" fill="url(#n16-bh-b)" ${SO}/>
        <g fill="#9A6A60" ${SOw(1.4)}><path d="M28 21L22 12L24.6 11L30 20Z"/><path d="M36 21L42 12L39.4 11L34 20Z"/><path d="M31 20L30 9H34L33 20Z"/></g>
        ${[[22, 10, 4.6], [32, 7, 5], [42, 10, 4.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7A9A48" ${S15}/><circle cx="${x - 1}" cy="${y - 1.4}" r="${r * .45}" fill="#A8C46A"/>`).join("")}
        ${EYES(28, 36, 36, 1.6)}${blush(25.4, 38.6, 40, 1.6, 1)}${smile(32, 40.6, 1.7, 1.5)}`,
      baobab_lemur: `<path d="M44 56C58 56 62 44 60 32C59 24 55 18 50 15" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M44 56C58 56 62 44 60 32C59 24 55 18 50 15" fill="none" stroke="#FAF6F0" stroke-width="5.6" stroke-linecap="round"/><path d="M44 56C58 56 62 44 60 32C59 24 55 18 50 15" fill="none" stroke="#3A3438" stroke-width="5.6" stroke-dasharray="4 4"/>
        ${rg("n16-bl-b", "#C8C2C4", "#8A8488", .45, .35)}<ellipse cx="30" cy="48" rx="13" ry="11" fill="url(#n16-bl-b)" ${SO}/>
        <path d="M17 22L11 12C16 12 20 14 22 18Z M43 22L49 12C44 12 40 14 38 18Z" fill="#9A9498" ${S15}/>
        <path d="M14 30C14 21 21 16 30 16C39 16 46 21 46 30C46 38 39 43 30 43C21 43 14 38 14 30Z" fill="url(#n16-bl-b)" ${SO}/>
        <path d="M19 31C19 25 24 22 30 22C36 22 41 25 41 31C41 36 36 41 30 41C24 41 19 36 19 31Z" fill="#F4F0EA"/><ellipse cx="24.4" cy="30" rx="4.2" ry="3.6" fill="#3A3438"/><ellipse cx="35.6" cy="30" rx="4.2" ry="3.6" fill="#3A3438"/>
        <circle cx="24.4" cy="30" r="2.4" fill="#E8902A"/><circle cx="35.6" cy="30" r="2.4" fill="#E8902A"/><circle cx="25" cy="29.4" r=".8" fill="#fff"/><circle cx="36.2" cy="29.4" r=".8" fill="#fff"/><ellipse cx="30" cy="36" rx="2.4" ry="1.6" fill="${O}"/>`,
      baobab_chameleon: `<path d="M44 46C54 48 58 40 56 35C54 30 48 31 48 35C48 38 51 38 52 36" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M44 46C54 48 58 40 56 35C54 30 48 31 48 35C48 38 51 38 52 36" fill="none" stroke="#3EAA8A" stroke-width="4" stroke-linecap="round"/>
        ${lg("n16-bc-b", "#6AD2AE", "#2A8670")}<path d="M16 46C16 38 24 34 32 34C40 34 46 38 46 46C46 51 40 53 31 53C22 53 16 51 16 46Z" fill="url(#n16-bc-b)" ${SO}/>
        <path d="M26 36C27 40 27 44 26 48M34 35C35 40 35 44 34 49" fill="none" stroke="#F28A6A" stroke-width="2.4" stroke-linecap="round"/><path d="M16 52L14 58M44 51L46 58M24 53V58M37 53V58" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M8 34C6 26 12 20 22 19C31 18 38 22 38 30C38 37 32 41 22 41C14 41 9 38 8 34Z" fill="url(#n16-bc-b)" ${SO}/><path d="M24 19C27 13 34 13 37 18" fill="#3EAA8A" ${S15}/>
        <circle cx="17" cy="28" r="5.4" fill="#48B898" ${S15}/><circle cx="29" cy="28" r="5.4" fill="#48B898" ${S15}/><circle cx="17" cy="28" r="2.4" fill="${O}"/><circle cx="29" cy="28" r="2.4" fill="${O}"/><circle cx="17.8" cy="27.2" r=".8" fill="#fff"/><circle cx="29.8" cy="27.2" r=".8" fill="#fff"/>
        ${smile(23, 35, 2.4, 1.6)}<path d="M9 36C15 38 25 38 34 35" fill="none" stroke="#F6E6A0" stroke-width="1.6" stroke-linecap="round"/>`,
      baobab_tree: `${lg("n16-bt-s", "#A87AAE", "#FFC896")}<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#n16-bt-s)" ${SO}/>
        <path d="M5.4 46H58.6V48Q58.6 58.6 48 58.6H16Q5.4 58.6 5.4 48Z" fill="#8E7A5A"/>${baobab(32, 50, 40, "#6E4450", S15)}<path d="M37 26C38 34 38 42 38 50" stroke="#F2A884" stroke-width="2.2" stroke-linecap="round"/>${spark(51, 14, 2.6, "#fff")}`,
      baobab_avenue: `${lg("n16-ba-s", "#EE94A2", "#FFD8A2")}<rect x="4" y="6" width="56" height="52" rx="14" fill="url(#n16-ba-s)" ${SO}/>
        <path d="M5.4 40H58.6V46Q58.6 56.6 48 56.6H16Q5.4 56.6 5.4 46Z" fill="#8E7A5A"/><path d="M30 40H34L44 56.6H20Z" fill="#B2604A"/><ellipse cx="32" cy="51" rx="5" ry="1.6" fill="#EE94A2"/>
        ${baobab(14, 46, 34, "#6E4450")}${baobab(50, 46, 34, "#6E4450")}${baobab(24, 41, 18, "#7A4A5A")}${baobab(40, 41, 18, "#7A4A5A")}${baobab(29, 40, 9, "#8A5A6A")}${baobab(35, 40, 9, "#8A5A6A")}<rect x="4" y="6" width="56" height="52" rx="14" fill="none" ${SO}/>`,
      baobab_milkyway: `${lg("n16-bm-s", "#02041A", "#2A2458")}<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#n16-bm-s)" ${SO}/>
        <path d="M24 58C30 40 38 22 44 6L52 6C44 24 36 42 34 58Z" fill="#C8C8FF" opacity=".22"/><path d="M28 58C33 42 39 26 46 8" stroke="#FFE6DC" stroke-width="2" opacity=".5" stroke-linecap="round"/>
        ${[[14, 14], [20, 26], [12, 36], [50, 30], [54, 44], [40, 16], [30, 30], [36, 40]].map(([x, y], i) => i % 3 ? `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>` : spark(x, y, 2.2, "#fff")).join("")}
        ${baobab(16, 58, 28, "#0E0C1C")}${baobab(48, 58, 24, "#0E0C1C")}`,
      baobab_seedpod: `<path d="M32 4V14" stroke="#7A5A3A" stroke-width="3" stroke-linecap="round"/>${rg("n16-bs-p", "#C8C49A", "#8A8058", .4, .3)}<path d="M32 12C42 12 48 22 48 34C48 48 41 58 32 58C23 58 16 48 16 34C16 22 22 12 32 12Z" fill="url(#n16-bs-p)" ${SO}/>
        <g fill="#F2EEDC" opacity=".55">${[[24, 24], [28, 32], [24, 42], [36, 22], [40, 30], [38, 44], [32, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join("")}</g>
        ${EYES(27, 37, 36, 1.8)}${blush(23.6, 40.4, 40, 1.8, 1.1)}${smile(32, 41, 1.8, 1.5)}${spark(54, 16, 3.2, "#FFD06A")}`,
      baobab_label: `${lg("n16-bx-b", "#6E4450", "#B2604A")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n16-bx-b)" ${SO}/>
        ${T("ROOTED", 32, 36.6, 10.5, "#FFD8A2", 40)}<path d="M12 41.5h40" stroke="#F2A884" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="1 3.4"/>
        ${baobab(9, 26, 15, "#4A2A2C", SOw(1.2))}${spark(55, 17, 4, "#FFD8A2")}`
    }},
    pins: [
      {id: "tp-baobab-tree", name: "Baobab Pin", kind: "badge", desc: "A little enamel baobab against a pink dusk sky, crown and all.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n16-pb-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A87AAE"/><stop offset="1" stop-color="#FFC896"/></linearGradient></defs><circle cx="15" cy="15" r="13" fill="url(#n16-pb-s)" stroke="#4A2A2C" stroke-width="1.3"/><path d="M3 20H27A13 13 0 0 1 3 20Z" fill="#8E7A5A"/>${baobab(15, 25, 20, "#6E4450")}<ellipse cx="9" cy="8" rx="2.4" ry="1.1" fill="#fff" opacity=".5" transform="rotate(-40 9 8)"/></svg>`},
      {id: "tp-baobab-washi", name: "Dusk Avenue Washi", kind: "tape", desc: "Pink-and-apricot washi tape lined with baobab silhouettes.",
        svg: `<svg viewBox="0 0 86 26"><defs><linearGradient id="n16-pt-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A87AAE"/><stop offset=".6" stop-color="#EE94A2"/><stop offset="1" stop-color="#FFD0A0"/></linearGradient></defs><path d="${tapeEdge}" fill="url(#n16-pt-s)" opacity=".95"/>
          ${[12, 28, 44, 60, 76].map((x, i) => baobab(x, 24.5, i % 2 ? 15 : 19, "#5A3440")).join("")}<path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-baobab", name: "Baobab Avenue", desc: "Soft apricot paper with a baobab pair at dusk in the corner and red earth along the bottom. Deep night blue with the Milky Way in dark mode."}
  });
})();
