/* Theme Collections, new theme ideas batch n14: lotus, seastacks */
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
  // a pointed petal standing on (x, y), tilted a degrees
  const petal = (x, y, len, w, a, fill, st) => `<path d="M0 0C${f1(w)} ${f1(-len * .28)} ${f1(w * .85)} ${f1(-len * .78)} 0 ${f1(-len)}C${f1(-w * .85)} ${f1(-len * .78)} ${f1(-w)} ${f1(-len * .28)} 0 0z" transform="translate(${x} ${y}) rotate(${a})" fill="${fill}" ${st || S15}/>`;
  const lotus = (x, y, s, id) => `${lg(id, "#F27AA8", "#FCE0EA")}${[-50, -25, 0, 25, 50].map(a => petal(x, y, 15 * s, 5 * s, a, `url(#${id})`)).join("")}${[-70, 70].map(a => petal(x, y + 2 * s, 11 * s, 4.4 * s, a, "#FBD6E4")).join("")}${[-28, 28].map(a => petal(x, y + 2 * s, 11 * s, 5 * s, a, "#FDEAF0")).join("")}`;
  const padD = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy + 1.6}" rx="${rx}" ry="${ry}" fill="#A6C89A" ${S2}/><ellipse cx="${cx}" cy="${cy}" rx="${rx - .8}" ry="${ry - 1.2}" fill="#6AAE62" ${S15}/><path d="${[-.8, -.4, 0, .4, .8].map(k => `M${cx} ${cy}L${f1(cx + k * rx * .8)} ${f1(cy - Math.sqrt(1 - k * k) * ry * .6)}`).join("")}" stroke="#A8DA90" stroke-width="1" stroke-linecap="round"/>`;

  /* ================= LOTUS LAKE ================= */
  TP_DATA.push({
    theme: "lotus",
    pack: {name: "Lotus Pond Pals", items: {
      lotus_bloom: `${lg("n14-lb-a", "#F27AA8", "#FCD8E6")}${lg("n14-lb-b", "#F8A8C8", "#FFF4F8")}
        ${[-52, -26, 0, 26, 52].map(a => petal(32, 40, 26, 8.6, a, "url(#n14-lb-a)", S2)).join("")}${[-78, 78].map(a => petal(32, 43, 20, 8, a, "url(#n14-lb-b)", S2)).join("")}
        <ellipse cx="32" cy="35" rx="11.4" ry="10" fill="#F6EDB0" ${S2}/><ellipse cx="32" cy="27.6" rx="6.6" ry="1.9" fill="#D8CE6A"/>
        ${[-56, 56].map(a => petal(32, 52, 12, 6.4, a, "url(#n14-lb-b)", S2)).join("")}
        ${EYES(28, 36, 34.6, 1.8)}${blush(24.6, 39.4, 38, 1.6, 1)}${smile(32, 38.4, 1.7, 1.5)}${spark(54, 10, 3.8, "#FFD86B")}`,
      lotus_pad: `${lg("n14-lp-a", "#8ACC7C", "#4E9A56")}<ellipse cx="32" cy="40" rx="27" ry="15" fill="#A6C89A" ${SO}/><ellipse cx="32" cy="37" rx="26" ry="13.4" fill="url(#n14-lp-a)" ${S2}/>
        <path d="M32 38L10 34M32 38L18 27M32 38L32 24.6M32 38L46 27M32 38L54 34M32 38L48 47M32 38L16 47" stroke="#A8DA90" stroke-width="1.3" stroke-linecap="round"/>
        ${rg("n14-lp-d", "#FFFFFF", "#9EDCF0", .35, .3)}<path d="M40 22C43 26 46 29 46 33C46 37 43 39.6 40 39.6C37 39.6 34 37 34 33C34 29 37 26 40 22Z" fill="url(#n14-lp-d)" ${S2}/>
        <circle cx="37.8" cy="32.4" r="1.4" fill="${O}"/><circle cx="42.2" cy="32.4" r="1.4" fill="${O}"/>${smile(40, 35.2, 1.3, 1.2)}${SHINE(37.6, 28, 1.2, 2.2, 20)}`,
      lotus_pod: `${lg("n14-lo-s", "#8CCB66", "#4E9A3A", 1, 0)}<path d="M30 60V44h4V60z" fill="url(#n14-lo-s)" ${S2}/>
        ${lg("n14-lo-b", "#B8CC72", "#7A9A44")}<path d="M10 22C10 16 54 16 54 22L38 46C35 49 29 49 26 46Z" fill="url(#n14-lo-b)" ${SO}/>
        <ellipse cx="32" cy="21" rx="22" ry="6.4" fill="#D8DE8C" ${S2}/>${[[22, 20], [28, 22.4], [36, 22.4], [42, 20], [32, 18.6], [25, 18], [39, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#5A5A2E"/>`).join("")}
        ${EYES(27, 37, 31, 1.8)}${blush(23, 41, 34.6, 1.6, 1)}${smile(32, 35, 1.7, 1.5)}`,
      lotus_duck: `<ellipse cx="32" cy="54" rx="26" ry="6" fill="#9ED4EA" ${S2}/>${rg("n14-ld-b", "#D8B47E", "#8A6A40", .4, .3)}
        <path d="M32 34C46 34 52 42 52 49C52 55 44 58 32 58C20 58 12 55 12 49C12 42 18 34 32 34Z" fill="url(#n14-ld-b)" ${SO}/><ellipse cx="32" cy="50" rx="10" ry="6" fill="#F6E4B8"/>
        ${rg("n14-ld-h", "#F2DCA0", "#A88450", .4, .35)}<circle cx="32" cy="24" r="14" fill="url(#n14-ld-h)" ${SO}/>
        <path d="M30 10.6C28 6 30 3.6 32 3.4C31.8 6 33 7.4 34.6 8" fill="#9C7848" ${S15}/>
        <path d="M27.6 30.4C27.6 28.4 36.4 28.4 36.4 30.4C36.4 32.6 34 33.6 32 33.6C30 33.6 27.6 32.6 27.6 30.4Z" fill="#F29A5E" ${S15}/>
        ${EYES(26.6, 37.4, 24, 1.9)}${blush(22.6, 41.4, 28.4, 1.8, 1.1)}<path d="M8 53q4 2 8 0M48 54q4 2 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
      lotus_frog: `${padD(32, 52, 27, 7)}${rg("n14-lf-h", "#BEEA94", "#66A446", .4, .3)}
        <circle cx="21" cy="21" r="8.4" fill="url(#n14-lf-h)" ${SO}/><circle cx="43" cy="21" r="8.4" fill="url(#n14-lf-h)" ${SO}/>
        <path d="M32 21C46 21 54 29 54 37C54 46 44 51 32 51C20 51 10 46 10 37C10 29 18 21 32 21Z" fill="url(#n14-lf-h)" ${SO}/>
        <circle cx="21" cy="21" r="5.4" fill="#FFFDF0"/><circle cx="43" cy="21" r="5.4" fill="#FFFDF0"/>${EYES(21, 43, 21.6, 2.6)}
        ${blush(16, 48, 37, 2.6, 1.6)}<path d="M24 38q8 6 16 0" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>${petal(32, 15, 9, 3.4, -10, "#F7B6CC")}`,
      lotus_bud: `${lg("n14-lu-s", "#8CCB66", "#4E9A3A", 1, 0)}<path d="M30 62V40h4V62z" fill="url(#n14-lu-s)" ${S2}/>
        ${lg("n14-lu-a", "#E8709A", "#FBD2E0")}<path d="M32 4C42 14 46 26 44 34C42 40 38 43 32 43C26 43 22 40 20 34C18 26 22 14 32 4Z" fill="url(#n14-lu-a)" ${SO}/>
        <path d="M32 43C24 40 22 32 25 24" fill="none" stroke="#FCE4EC" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <path d="M32 44C26 44 22 40 21 36C25 38 28 40 32 40C36 40 39 38 43 36C42 40 38 44 32 44Z" fill="#6AAE5A" ${S15}/>
        ${EYES(27.6, 36.4, 29, 1.6)}${blush(25, 39, 32.4, 1.5, 1)}${smile(32, 32.6, 1.5, 1.4)}${spark(10, 14, 3.4, "#FFD86B")}${spark(54, 30, 2.6, "#F49ABC")}`,
      lotus_moon: `${lg("n14-lm-s", "#0F1940", "#2E3C6C")}<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#n14-lm-s)" ${SO}/>
        <circle cx="22" cy="20" r="7" fill="#F4F0DE"/><circle cx="22" cy="20" r="11" fill="#F4F0DE" opacity=".15"/>${spark(46, 14, 2.2, "#fff")}<circle cx="38" cy="22" r=".9" fill="#fff"/><circle cx="52" cy="26" r=".8" fill="#fff"/>
        <path d="M4.5 36H59.5V44Q59.5 59.5 44 59.5H20Q4.5 59.5 4.5 44Z" fill="#0E1834"/><path d="M14 40h16M18 45h8" stroke="#DCE2FF" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
        <ellipse cx="42" cy="47" rx="12" ry="3.4" fill="#2A4C50"/><ellipse cx="42" cy="46" rx="11" ry="2.6" fill="#3A6264"/>
        <path d="M44 46V36" stroke="#2A4A44" stroke-width="1.6"/><path d="M44 28C48 32 49 35 47.6 37.6C46.6 39 41.4 39 40.4 37.6C39 35 40 32 44 28Z" fill="#9C7A92" ${SOw(1.2)}/>`,
      lotus_label: `${lg("n14-lx-b", "#FFFFFF", "#FBE6EE")}<rect x="4" y="17" width="56" height="30" rx="12" fill="url(#n14-lx-b)" ${SO}/>
        ${T("BLOOM ON", 32, 36.6, 10.5, "#C04C7A", 44)}<path d="M12 41.5h40" stroke="#6AAE62" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.4"/>
        ${lotus(9, 22, .62, "n14-lx-l")}${spark(55, 46, 3.6, "#F49ABC")}`
    }},
    pins: [
      {id: "tp-lotus-bloom", name: "Lotus Pin", kind: "badge", desc: "A pink lotus in full bloom, fresh from the dawn lake.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n14-pp-la" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F06C9C"/><stop offset="1" stop-color="#FCE0EA"/></linearGradient></defs>
          ${[-52, -26, 0, 26, 52].map(a => petal(15, 22, 14, 4.8, a, "url(#n14-pp-la)", `stroke="#8A2E54" stroke-width="1"`)).join("")}${[-74, 74].map(a => petal(15, 23.4, 10.4, 4.4, a, "#FBD6E4", `stroke="#8A2E54" stroke-width="1"`)).join("")}
          ${[-30, 30].map(a => petal(15, 24, 9, 4.6, a, "#FFF0F5", `stroke="#8A2E54" stroke-width="1"`)).join("")}<ellipse cx="15" cy="15.6" rx="3.4" ry="1.2" fill="#E8C84A"/><ellipse cx="11" cy="11" rx="1.4" ry="2.6" fill="#fff" opacity=".5" transform="rotate(-20 11 11)"/></svg>`},
      {id: "tp-lotus-washi", name: "Lotus Pond Washi", kind: "tape", desc: "Soft green washi tape with round lotus leaves and little pink blooms.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#86BE84" opacity=".92"/>
          ${[[14, 15, 7], [44, 12, 6], [72, 15, 7]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .5}" fill="#5A9E62"/><path d="M${x} ${y}L${x - r * .7} ${y - r * .25}M${x} ${y}L${x} ${y - r * .45}M${x} ${y}L${x + r * .7} ${y - r * .25}" stroke="#A8DA90" stroke-width=".8"/>`).join("")}
          ${[[29, 12], [58, 13]].map(([x, y]) => `${petal(x, y + 4, 7, 2.6, -30, "#F49ABC", "")}${petal(x, y + 4, 7, 2.6, 30, "#F49ABC", "")}${petal(x, y + 4, 8, 2.8, 0, "#FBD2E0", "")}`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-lotus", name: "Lotus Pond", desc: "Blush-white paper with a pink lotus and a round leaf in the corner and a soft ripple along the bottom. Moonlit blue with a closed bud in dark mode."}
  });

  /* ================= SEA STACKS ================= */
  TP_DATA.push({
    theme: "seastacks",
    pack: {name: "Golden Coast Crew", items: {
      seastacks_stack: `<ellipse cx="32" cy="57" rx="26" ry="5" fill="#9ED4EA" ${S2}/>${lg("n14-ss-r", "#C88A52", "#F4CC86", 1, 0)}
        <path d="M18 58C16 48 16 34 18 24C19.6 16 23 11 32 11C41 11 44.4 16 46 24C48 34 48 48 46 58Z" fill="url(#n14-ss-r)" ${SO}/>
        <path d="M17.4 46Q32 48 46.6 46M17 34Q32 36 47 34" fill="none" stroke="#B87A48" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
        <path d="M21 14C20 9 25 6 28 8C30 4 36 4 37 8C41 6 45 9 43 14C38 16 26 16 21 14Z" fill="#7AA44A" ${S2}/>
        <path d="M13 58C15 55 19 55 22 57C25 55 29 55 32 57C35 55 39 55 42 57C45 55 49 55 51 58Z" fill="#fff" ${S15}/>
        ${EYES(27, 37, 28, 1.9)}${blush(23, 41, 31.6, 1.7, 1.1)}${smile(32, 32, 1.7, 1.5)}`,
      seastacks_penguin: `<ellipse cx="25" cy="58" rx="5" ry="2.4" fill="#F2C7B8" ${S15}/><ellipse cx="39" cy="58" rx="5" ry="2.4" fill="#F2C7B8" ${S15}/>
        ${rg("n14-sp-b", "#B8C6D8", "#6A80A0", .4, .3)}<path d="M32 30C46 30 50 41 50 48C50 55 43 58 32 58C21 58 14 55 14 48C14 41 18 30 32 30Z" fill="url(#n14-sp-b)" ${SO}/>
        <path d="M32 38C39 38 42 43 42 49C42 53 38 56 32 56C26 56 22 53 22 49C22 43 25 38 32 38Z" fill="#F6F6F2"/>
        ${rg("n14-sp-h", "#94A8C4", "#4E6284", .4, .3)}<circle cx="32" cy="24" r="15" fill="url(#n14-sp-h)" ${SO}/>
        <path d="M32 24C28 20 21 21 20.4 27C20 32 25 36 32 35.4C39 36 44 32 43.6 27C43 21 36 20 32 24Z" fill="#F4F6F8"/>
        ${EYES(26.6, 37.4, 27, 1.9)}<path d="M29.6 30Q32 29.2 34.4 30L32 33Z" fill="#2E3446" ${SOw(1.2)}/>${blush(23, 41, 31.4, 1.7, 1.1)}`,
      seastacks_seal: `<path d="M8 60C6 53 14 49 22 50C26 47 40 47 44 50C52 49 59 53 56 60Z" fill="#D8A868" ${S2}/>
        ${rg("n14-se-b", "#B0907A", "#64483A", .4, .3)}<path d="M32 36C43 36 49 44 49 51C49 57 42 59 32 59C22 59 15 57 15 51C15 44 21 36 32 36Z" fill="url(#n14-se-b)" ${SO}/>
        <circle cx="32" cy="25" r="15" fill="url(#n14-se-b)" ${SO}/><ellipse cx="32" cy="31" rx="6.6" ry="4.6" fill="#C8AA8E"/><ellipse cx="32" cy="29" rx="2" ry="1.4" fill="${O}"/>
        <path d="M26 31.6l-4-.8M26 33.6l-4 .6M38 31.6l4-.8M38 33.6l4 .6" stroke="#F4E8DC" stroke-width="1" stroke-linecap="round"/>
        <circle cx="25.4" cy="23.4" r="3" fill="${O}"/><circle cx="38.6" cy="23.4" r="3" fill="${O}"/><circle cx="26.4" cy="22.2" r="1.1" fill="#fff"/><circle cx="39.6" cy="22.2" r="1.1" fill="#fff"/>${blush(21, 43, 28, 1.7, 1.1)}`,
      seastacks_thrift: `${lg("n14-st-s", "#7CB04E", "#4E7E34", 1, 0)}<path d="M30.6 60V30h2.8V60z" fill="url(#n14-st-s)" ${S15}/>
        <path d="M32 58C26 58 20 54 18 48C24 50 28 54 32 58ZM32 58C38 58 44 54 46 48C40 50 36 54 32 58Z" fill="#6A9C42" ${S15}/>
        ${rg("n14-st-h", "#F8B8D6", "#D85A96", .4, .35)}<circle cx="32" cy="22" r="15" fill="url(#n14-st-h)" ${SO}/>
        ${[[24, 14], [32, 11], [40, 14], [21, 22], [43, 22], [26, 30], [38, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#FBD2E4"/>`).join("")}
        ${EYES(27.4, 36.6, 22, 1.8)}${smile(32, 25.6, 1.6, 1.4)}${spark(54, 10, 3.4, "#FFD86B")}`,
      seastacks_wave: `${rg("n14-sw-w", "#9AF0E8", "#1E9AB4", .4, .3)}<path d="M4 54C5 36 18 14 38 13C51 12 59 22 57 31C55 40 44 41 42 33C41 28 45 25 49 27C47 20 37 19 31 26C24 34 24 46 30 54Z" fill="url(#n14-sw-w)" ${SO}/>
        <path d="M30 54C28 46 30 36 36 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${[[14, 44], [18, 35], [24, 50], [24, 28]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.2}" fill="#E8FFFC"/>`).join("")}
        <circle cx="52" cy="14" r="4.6" fill="#fff" ${S15}/><circle cx="58" cy="20" r="3" fill="#fff" ${S15}/><circle cx="46" cy="9" r="2.6" fill="#fff" ${S15}/>`,
      seastacks_sunset: `${lg("n14-su-s", "#8CBEE4", "#F6C68E")}<circle cx="32" cy="32" r="26" fill="url(#n14-su-s)" ${SO}/>
        <circle cx="42" cy="30" r="6" fill="#FFF4D8"/><path d="M6.6 36H57.4A26 26 0 0 1 6.6 36Z" fill="#2AB0B6"/><path d="M6.6 36H57.4" stroke="${O}" stroke-width="1.8"/>
        <path d="M17 36C16.4 30 16.6 24 18 20C19.4 18 22 18 23 20C24 24 24.4 30 24 36Z" fill="#E8B068" ${SOw(1.4)}/><path d="M28 36C27.8 32 28 29 29 27C30 26 31.6 26 32 27.6C32.6 30 32.6 33 32.4 36Z" fill="#E8B068" ${SOw(1.4)}/>
        <path d="M17.6 20.4C18 18 23 18 23.4 20.6Z" fill="#7AA44A"/><path d="M38 41h10M41 45h5" stroke="#FFF4D8" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`,
      seastacks_arch: `<ellipse cx="32" cy="56" rx="28" ry="5" fill="#9ED4EA" ${S2}/>${lg("n14-sa-r", "#C88A52", "#F2C27A", 1, 0)}
        <path d="M8 57C7 46 8 32 10 24C12 16 18 13 32 13C46 13 52 16 54 24C56 32 57 46 56 57H44C44 47 41 38 32 38C23 38 20 47 20 57Z" fill="url(#n14-sa-r)" ${SO}/>
        <path d="M9 44H19.6M44.4 44H55.4M10 30Q32 32 54 30" fill="none" stroke="#B87A48" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
        <path d="M11 17C10 12 16 9 20 11C23 7 32 7 34 11C38 8 46 9 47 13C50 12 54 15 53 19C40 21 22 21 11 17Z" fill="#7AA44A" ${S2}/>
        ${EYES(26.6, 37.4, 26, 1.8)}${blush(22.6, 41.4, 29.4, 1.6, 1)}${smile(32, 29.6, 1.6, 1.4)}`,
      seastacks_label: `${lg("n14-sx-b", "#FFFDF6", "#F6E6C8")}<rect x="4" y="17" width="56" height="30" rx="10" fill="url(#n14-sx-b)" ${SO}/>
        ${T("STAND TALL", 32, 36.4, 9.6, "#C2702E", 46)}<path d="M10 41.5q4-2.4 8 0t8 0t8 0t8 0t8 0" fill="none" stroke="#2AA6B4" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M7 19C6.4 13 7 9 9 8C11 7 12.6 9 13 12C13.4 15 13 18 12.6 19Z" fill="#E8B068" ${SOw(1.4)}/>${spark(56, 46, 3.4, "#F6C83C")}`
    }},
    pins: [
      {id: "tp-seastacks-stack", name: "Sea Stack Pin", kind: "badge", desc: "A golden limestone stack with a green tuft, rising from the surf.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n14-pp-sr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C88A52"/><stop offset="1" stop-color="#F4CC86"/></linearGradient></defs>
          <ellipse cx="15" cy="26" rx="12" ry="3" fill="#5CC8D0" stroke="#1E6A74" stroke-width="1"/><path d="M9 26.4C8.4 20 8.4 12 9.6 8C10.4 5.4 12 4.4 15 4.4C18 4.4 19.6 5.4 20.4 8C21.6 12 21.6 20 21 26.4Z" fill="url(#n14-pp-sr)" stroke="#6E3A12" stroke-width="1.1"/>
          <path d="M8.8 19Q15 20 21.2 19M9 13Q15 14 21 13" fill="none" stroke="#9A6238" stroke-width=".9" opacity=".8"/><path d="M9.6 7C9 4 12 2.6 14 3.6C15.4 1.6 19 2 19.6 4C21 4 21.6 6 20.6 7.4C17 8.4 12 8.4 9.6 7Z" fill="#7AA44A" stroke="#3A5A22" stroke-width="1"/>
          <path d="M6 26.4C7.4 24.6 10 24.6 11.4 26C13 24.6 15.4 24.6 17 26C18.4 24.6 21 24.6 24 26.4" fill="#fff" stroke="#1E6A74" stroke-width=".8"/></svg>`},
      {id: "tp-seastacks-washi", name: "Sea Thrift Washi", kind: "tape", desc: "Turquoise washi tape with white surf curls and pink sea thrift pompoms.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2AA6B4" opacity=".92"/>
          <path d="M6 18Q10 14 14 18T22 18T30 18T38 18T46 18T54 18T62 18T70 18T80 18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
          ${[[16, 9], [36, 8], [56, 9], [74, 8]].map(([x, y]) => `<path d="M${x} ${y + 3}v6" stroke="#4E7E34" stroke-width="1"/><circle cx="${x}" cy="${y}" r="3.4" fill="#F49ABC"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#FBD2E4"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-seastacks", name: "Golden Coast", desc: "Warm sand-white paper with golden sea stacks rising from turquoise surf in the corner and sea thrift along the bottom. Starry night blue in dark mode."}
  });
})();
