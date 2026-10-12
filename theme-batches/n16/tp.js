/* Theme Collections, new theme ideas batch n16: saguaro */
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
})();
