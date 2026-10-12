/* Theme Collections, new theme ideas batch n9: bayou, karst */
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
  // a pointed petal or leaf from (cx, cy) along angle a (degrees), length L, half width w
  const petal = (cx, cy, a, L, w) => { const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), P = (u, v) => `${f1(cx + u * c - v * s)} ${f1(cy + u * s + v * c)}`; return `M${P(0, 0)}Q${P(L * 0.42, -w)} ${P(L, 0)}Q${P(L * 0.42, w)} ${P(0, 0)}Z`; };
  const glow = (x, y, r, c, a = .45) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${a}"/>`;
  // a little bald cypress: flared trunk, flat feathery pads and moss
  const cypress = (x, y, h, trunk, leaf, moss) => { const w = h * .09; return `<path d="M${f1(x - w * 1.8)} ${y}Q${f1(x - w * .6)} ${f1(y - h * .15)} ${f1(x - w * .45)} ${f1(y - h * .5)}L${f1(x - w * .3)} ${f1(y - h * .85)}H${f1(x + w * .3)}L${f1(x + w * .45)} ${f1(y - h * .5)}Q${f1(x + w * .6)} ${f1(y - h * .15)} ${f1(x + w * 1.8)} ${y}Z" fill="${trunk}"/>
    ${[[0, .88, .3], [-.22, .66, .24], [.24, .6, .26], [-.12, .44, .2]].map(([dx, dy, r]) => `<ellipse cx="${f1(x + dx * h)}" cy="${f1(y - dy * h)}" rx="${f1(r * h)}" ry="${f1(r * h * .32)}" fill="${leaf}"/>`).join("")}
    ${[[-.28, .62, .18], [.12, .56, .22], [.34, .55, .14], [-.18, .4, .14]].map(([dx, dy, l]) => `<path d="M${f1(x + dx * h - 2)} ${f1(y - dy * h)}q1 ${f1(l * h * .5)} 0 ${f1(l * h)}M${f1(x + dx * h)} ${f1(y - dy * h)}q-1 ${f1(l * h * .6)} 1 ${f1(l * h * 1.2)}M${f1(x + dx * h + 2)} ${f1(y - dy * h)}q1 ${f1(l * h * .4)} 0 ${f1(l * h * .8)}" fill="none" stroke="${moss}" stroke-width="1.4" stroke-linecap="round"/>`).join("")}`; };
  // a karst tower: steep sides and a rounded top
  const tower = (x, y, w, h, c) => `<path d="M${f1(x - w / 2)} ${y}C${f1(x - w / 2)} ${f1(y - h * .5)} ${f1(x - w * .48)} ${f1(y - h * .8)} ${f1(x - w * .2)} ${f1(y - h * .97)}Q${x} ${f1(y - h * 1.04)} ${f1(x + w * .2)} ${f1(y - h * .97)}C${f1(x + w * .48)} ${f1(y - h * .8)} ${f1(x + w / 2)} ${f1(y - h * .5)} ${f1(x + w / 2)} ${y}Z" fill="${c}"/>`;

  /* ================= FIREFLY BAYOU ================= */
  TP_DATA.push({
    theme: "bayou",
    pack: {name: "Bayou Nights", items: {
      bayou_lily: `${lg("n9-bl-p", "#FFFFFF", "#FFB0C8")}${rg("n9-bl-f", "#FFFFFF", "#F8C8D6", .4, .3)}
        <path d="M32 50L40.9 56.1A26 6.5 0 1 0 27.5 56.4Z" fill="#6EAE4E" ${S2}/>
        ${[-90, -50, -130, -14, -166].map(a => `<path d="${petal(32, 36, a, 22, 7.5)}" fill="url(#n9-bl-p)" ${S15}/>`).join("")}
        <circle cx="32" cy="38" r="13" fill="url(#n9-bl-f)" ${S2}/>
        ${[-20, 0, 20].map(a => { const t = (a - 90) * Math.PI / 180; return `<path d="M32 26L${f1(32 + Math.cos(t) * 6)} ${f1(25 + Math.sin(t) * 6)}" stroke="${O}" stroke-width="1.4"/><circle cx="${f1(32 + Math.cos(t) * 6)}" cy="${f1(25 + Math.sin(t) * 6)}" r="1.8" fill="#FFD24A" stroke="${O}" stroke-width="1"/>`; }).join("")}
        ${EYES(27, 37, 38, 2.2)}${blush(23.5, 40.5, 42, 2.2, 1.4)}${smile(32, 42.2, 2, 1.6)}
        ${spark(54, 14, 3.6, "#FFE07A")}${spark(10, 24, 2.6, "#FFE07A")}`,
      bayou_jar: `${lg("n9-bj-g", "#E8F4EE", "#B8D6CC", 1, 0)}
        ${glow(32, 38, 22, "#FFE27A", .28)}
        <rect x="20" y="9" width="24" height="7" rx="2.5" fill="#B8925A" ${S2}/>
        <path d="M22 16H42Q48 22 48 30V50Q48 58 40 58H24Q16 58 16 50V30Q16 22 22 16Z" fill="url(#n9-bj-g)" opacity=".92" ${S2}/>
        ${[[26, 30, 2.4], [38, 26, 2], [34, 40, 2.8], [24, 46, 2], [40, 48, 2.4], [30, 52, 1.6]].map(([x, y, r]) => `${glow(x, y, r * 2.6, "#FFE27A", .5)}<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6B8"/>`).join("")}
        <path d="M21 24V44" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
        ${spark(54, 16, 3.6, "#FFE07A")}${spark(9, 40, 2.6, "#FFE07A")}`,
      bayou_moon: `${rg("n9-bm-s", "#2E5A50", "#0E2226", .5, .3)}
        <circle cx="32" cy="32" r="27" fill="url(#n9-bm-s)" ${S2}/>
        <circle cx="38" cy="20" r="8" fill="#F4F0D8"/><circle cx="36" cy="18" r="1.6" fill="#D8D4B8"/><circle cx="41" cy="23" r="1.2" fill="#D8D4B8"/>
        <path d="M6 36H58V40Q56 52 46 56H18Q8 52 6 40Z" fill="#081618"/>
        <path d="M36 40h6M34 44h10M36 48h6" stroke="#F4F0D8" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        ${cypress(18, 38, 26, "#081618", "#0C2422", "#3E524C")}
        ${[[46, 30], [52, 36], [28, 28], [24, 46], [50, 48]].map(([x, y]) => `${glow(x, y, 3, "#FFE27A", .5)}<circle cx="${x}" cy="${y}" r="1.2" fill="#FFF6B8"/>`).join("")}`,
      bayou_cypress: `${lg("n9-bc-w", "#B8C890", "#5E7A50")}
        <ellipse cx="32" cy="54" rx="27" ry="6" fill="url(#n9-bc-w)" ${S2}/>
        ${cypress(32, 54, 50, "#7A6246", "#5E8A3E", "#B8BC9C")}
        <path d="M21 54l1-6 2 6M43 54l1-5 2 5" fill="#7A6246"/>
        <path d="M14 55q4 2 8 0M44 56q4 2 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`,
      bayou_knee: `${lg("n9-bk-b", "#C8986A", "#8A5E3A", 1, 1)}
        <ellipse cx="32" cy="55" rx="24" ry="5" fill="#7EBCA8" ${S2}/>
        <path d="M15 55C17 46 20 38 21 30C22 18 25 10 33 8C41 6 46 12 47 22C48 32 47 46 50 55Z" fill="url(#n9-bk-b)" ${SO}/>
        <path d="M33 10C38 9 42 12 44 16C40 15 36 15 32 17C30 15 30 12 33 10Z" fill="#A8B08C" ${S15}/>
        <path d="M24 46V40M41 47V42" stroke="#6E4628" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
        ${EYES(28, 38, 28, 2.4)}${blush(24, 42, 32.5, 2.2, 1.4)}${smile(33, 32.6, 2.2, 1.7)}
        <g fill="#9CC64E"><circle cx="12" cy="55" r="1.4"/><circle cx="52" cy="56" r="1.4"/><circle cx="18" cy="58" r="1.2"/></g>`,
      bayou_moss: `${rg("n9-bs-m", "#EEF0DE", "#98A284", .4, .3)}
        <path d="M8 12C22 8 42 9 56 13" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M8 12C22 8 42 9 56 13" fill="none" stroke="#8A6A44" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M24 11V20M40 11V20" stroke="#8E9878" stroke-width="1.6"/>
        ${[[18, 40, 56], [24, 44, 60], [30, 46, 58], [36, 46, 61], [42, 44, 57], [47, 40, 54]].map(([x, y0, y1], i) => `<path d="M${x} ${y0}q${i % 2 ? 2 : -2} ${(y1 - y0) / 2} 0 ${y1 - y0}" fill="none" stroke="${i % 2 ? "#A2AA8A" : "#7E8868"}" stroke-width="1.8" stroke-linecap="round"/>`).join("")}
        <path d="M32 18c6 0 8 3 9 5 5 0 8 4 7 8 3 3 1 8-3 9-1 4-6 5-9 3-3 3-8 3-10 0-4 1-8-2-7-6-4-2-4-7 0-9 0-5 4-7 8-6 1-3 3-4 5-4z" fill="url(#n9-bs-m)" ${S2}/>
        ${EYES(27, 37, 31, 2.2)}${blush(23.5, 40.5, 35, 2.2, 1.4)}${smile(32, 35.4, 2, 1.6)}`,
      bayou_pad: `${lg("n9-bp-p", "#9CD472", "#4E8A3A")}
        <ellipse cx="32" cy="46" rx="28" ry="10" fill="#B8D8C8" opacity=".6"/>
        <path d="M32 42L42.1 49.3A24 8 0 1 0 27.8 49.9Z" fill="url(#n9-bp-p)" ${S2}/>
        <path d="M32 40L14 37M32 40L20 46M32 40L50 37" stroke="#BFE49A" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M30 20C34 26 37 30 37 34A5 5 0 0 1 27 34C27 30 30 26 30 20Z" fill="#CFEFFF" ${S2}/><ellipse cx="29.6" cy="32" rx="1.4" ry="2.4" fill="#fff"/>
        ${spark(48, 18, 3.4, "#FFE07A")}${spark(14, 22, 2.6, "#BFE4F0")}`,
      bayou_glow: `${lg("n9-bg-b", "#24443E", "#0E2226")}
        <rect x="4" y="18" width="56" height="28" rx="14" fill="url(#n9-bg-b)" ${SO}/>
        ${T("STAY GLOWING", 32, 36.5, 9.5, "#FFE9A8", 44)}
        ${[[10, 12], [54, 12], [12, 52], [52, 52], [32, 9]].map(([x, y]) => `${glow(x, y, 4, "#FFE27A", .45)}<circle cx="${x}" cy="${y}" r="1.6" fill="#FFF6B8"/>`).join("")}`
    }},
    pins: [
      {id: "tp-bayou-lily", name: "Water Lily Pin", kind: "badge", desc: "A white water lily blushing pink, open on its pad.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n9-pp-bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFB0C8"/></linearGradient></defs>
          <ellipse cx="15" cy="21" rx="13" ry="5" fill="#6EAE4E" stroke="#2E5A2A" stroke-width="1.1"/>
          ${[-90, -45, -135, -10, -170].map(a => `<path d="${petal(15, 18, a, 12, 4)}" fill="url(#n9-pp-bl)" stroke="#A04A6A" stroke-width=".9"/>`).join("")}
          <circle cx="15" cy="17" r="3" fill="#FFD24A" stroke="#A07020" stroke-width=".8"/></svg>`},
      {id: "tp-bayou-moss", name: "Moss and Fireflies Washi", kind: "tape", desc: "Deep green washi tape with hanging moss and little glowing firefly dots.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#1E3A34" opacity=".92"/>
          ${[10, 24, 38, 52, 66, 78].map((x, i) => `<path d="M${x} 2q${i % 2 ? 1.5 : -1.5} 5 0 ${9 + (i % 3) * 2}M${x + 3} 2q-1 4 0 ${7 + (i % 2) * 3}" fill="none" stroke="#9EA688" stroke-width="1" stroke-linecap="round"/>`).join("")}
          ${[[18, 17], [31, 20], [45, 15], [59, 19], [72, 16], [8, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#FFE27A" opacity=".35"/><circle cx="${x}" cy="${y}" r="1" fill="#FFF6B8"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".25"/></svg>`}
    ],
    card: {id: "tp-bayou", name: "Lily Pad Glow", desc: "Soft swamp-green paper with a water lily on its pad in the corner and a mossy cypress below. Firefly-dotted midnight green in dark mode."}
  });

  /* ================= KARST RIVER ================= */
  TP_DATA.push({
    theme: "karst",
    pack: {name: "River Mist", items: {
      karst_peaks: `${lg("n9-kp-s", "#DCEAE4", "#F4F0E4")}${lg("n9-kp-w", "#BCD8CC", "#7EAE9C")}
        <rect x="4" y="6" width="56" height="52" rx="12" fill="url(#n9-kp-s)" ${SO}/>
        <circle cx="20" cy="18" r="5" fill="#FFFDF2"/>
        ${tower(42, 40, 12, 24, "#B4CEC4")}${tower(24, 40, 12, 20, "#A2C2B6")}${tower(33, 42, 14, 30, "#76A08E")}${tower(50, 42, 12, 20, "#86AE9C")}${tower(14, 42, 10, 16, "#8CB4A2")}
        <path d="M5 40H59V46Q59 57 48 57H16Q5 57 5 46Z" fill="url(#n9-kp-w)"/>
        <path d="M8 36Q20 33 30 36T56 35" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
        <path d="M14 47h10M34 50h12" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        <rect x="4" y="6" width="56" height="52" rx="12" fill="none" ${SO}/>`,
      karst_raft: `${lg("n9-kr-w", "#C8E0D6", "#7EAE9C")}
        <ellipse cx="32" cy="50" rx="28" ry="7" fill="url(#n9-kr-w)" ${S2}/>
        ${[0, 1, 2, 3].map(i => `<rect x="${9 + i}" y="${40 + i * 3.4}" width="${42 - i * 2}" height="3.6" rx="1.8" fill="${i % 2 ? "#C8A464" : "#E2C688"}" ${S15}/>`).join("")}
        <path d="M44 41V12Q44 9 40 9H34" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M44 41V12Q44 9 40 9H34" fill="none" stroke="#9A7440" stroke-width="2" stroke-linecap="round"/>
        ${glow(33, 22, 9, "#FFC27A", .4)}<path d="M33 10V14" stroke="${O}" stroke-width="1.4"/>
        <ellipse cx="33" cy="21" rx="5.6" ry="7" fill="#E8584A" ${S15}/><rect x="30" y="13.2" width="6" height="2" fill="${O}"/><rect x="30" y="27" width="6" height="2" fill="${O}"/>
        <path d="M14 41Q20 31 26 41Z" fill="#E8CF8A" ${S15}/>`,
      karst_lantern: `${rg("n9-kl-l", "#FFB89A", "#D8443A", .4, .35)}
        ${glow(32, 34, 24, "#FFC27A", .3)}
        <path d="M32 4V10" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        <rect x="23" y="9" width="18" height="5" rx="2" fill="#3A2A2A" ${S15}/><rect x="23" y="52" width="18" height="5" rx="2" fill="#3A2A2A" ${S15}/>
        <ellipse cx="32" cy="33" rx="18" ry="20" fill="url(#n9-kl-l)" ${SO}/>
        <path d="M16 26H48M15 40H49" stroke="#A8302A" stroke-width="1.2" opacity=".55"/>
        ${EYES(26.5, 37.5, 31, 2.4)}${blush(22, 42, 36, 2.4, 1.5)}${smile(32, 36, 2.2, 1.8)}
        <path d="M30 57v4M34 57v4" stroke="#E8A030" stroke-width="1.6" stroke-linecap="round"/>`,
      karst_lotus: `<ellipse cx="32" cy="48" rx="26" ry="6" fill="#9CCAB8" opacity=".7"/>
        ${glow(32, 34, 18, "#FFD27A", .35)}
        ${[-90, -55, -125, -22, -158].map(a => `<path d="${petal(32, 44, a, 20, 7)}" fill="#F49AB4" ${S15}/>`).join("")}
        <path d="M32 22C35 26 35 30 32 32C29 30 29 26 32 22Z" fill="#FFD86B" ${S15}/>
        ${[-70, -110, -40, -140].map(a => `<path d="${petal(32, 45, a, 15, 5.5)}" fill="#FFD2DE" ${S15}/>`).join("")}
        <ellipse cx="32" cy="46" rx="18" ry="4" fill="#5EA86A" ${S2}/>
        ${spark(52, 16, 3.4, "#FFE07A")}`,
      karst_shoot: `${lg("n9-ks-b", "#E8D49A", "#B8925A", 1, 1)}
        <ellipse cx="32" cy="56" rx="18" ry="4" fill="#8A6A44" ${S2}/>
        <path d="M17 56C17 42 22 28 28 18L32 10L36 18C42 28 47 42 47 56Z" fill="url(#n9-ks-b)" ${SO}/>
        <path d="M17 56C19 48 24 44 30 43C27 48 26 52 26 56ZM47 56C45 48 40 44 34 43C37 48 38 52 38 56Z" fill="#A27E48" ${S15}/>
        <path d="${petal(32, 11, -120, 11, 3)}" fill="#8CC864" ${S15}/><path d="${petal(32, 11, -60, 12, 3.2)}" fill="#7EB85A" ${S15}/>
        ${EYES(28, 36, 31, 2.1)}${blush(25, 39, 35, 2, 1.3)}${smile(32, 35, 1.8, 1.6)}`,
      karst_bamboo: `<path d="M22 60L26 4M38 60L35 8" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M22 60L26 4M38 60L35 8" fill="none" stroke="#8CB85A" stroke-width="5" stroke-linecap="round"/>
        <path d="M21.5 18.5h6M22.6 34h6M23.6 49h6M33.5 22h5M34 38h5M34.6 52h5" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${[[26, 14, -150], [26, 14, -170], [26, 14, 160], [35.5, 26, -20], [35.5, 26, 10], [35.5, 26, 35], [24, 40, 170], [24, 40, 150]].map(([x, y, a]) => `<path d="${petal(x, y, a, 16, 3.4)}" fill="#6EA846" ${S15}/>`).join("")}`,
      karst_cloud: `${rg("n9-kc-c", "#FFFFFF", "#C6E0DA", .4, .3)}
        <path d="M14 46C6 46 6 34 14 34C14 24 26 20 32 26C36 18 50 20 50 30C58 30 60 44 52 46Z" fill="url(#n9-kc-c)" ${SO}/>
        <path d="${petal(26, 24, -20, 14, 3)}" fill="#7EB85A" ${S15}/>
        ${EYES(27, 39, 37, 2.3)}${blush(23, 43, 41, 2.2, 1.4)}${smile(33, 41, 2, 1.7)}
        <path d="M6 52q8-4 16 0M40 54q8-4 16 0" fill="none" stroke="#A8D2C8" stroke-width="2.4" stroke-linecap="round"/>`,
      karst_flow: `${lg("n9-kf-b", "#3E7E70", "#2E6A5E")}
        <rect x="3" y="18" width="58" height="28" rx="14" fill="url(#n9-kf-b)" ${SO}/>
        <path d="M8 40Q16 37 24 40T40 40T56 40" fill="none" stroke="#9CD2C4" stroke-width="1.6" stroke-linecap="round"/>
        ${T("GO WITH THE FLOW", 32, 34, 8.5, "#FFFFFF", 48)}
        ${tower(12, 18, 7, 10, "#5E9A86")}${tower(52, 18, 8, 13, "#5E9A86")}
        ${spark(32, 10, 3.2, "#FFD09A")}`
    }},
    pins: [
      {id: "tp-karst-lantern", name: "Red Lantern Pin", kind: "badge", desc: "A little red paper lantern, glowing softly.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n9-pp-kl" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFB89A"/><stop offset="1" stop-color="#D8443A"/></radialGradient></defs>
          <circle cx="15" cy="16" r="13" fill="#FFC27A" opacity=".3"/><rect x="10" y="4" width="10" height="3" rx="1" fill="#3A2A2A"/><rect x="10" y="24" width="10" height="3" rx="1" fill="#3A2A2A"/>
          <ellipse cx="15" cy="15.5" rx="9" ry="9.5" fill="url(#n9-pp-kl)" stroke="#7A2018" stroke-width="1.1"/><path d="M6.5 12H23.5M6.5 19H23.5" stroke="#A8302A" stroke-width=".8" opacity=".6"/></svg>`},
      {id: "tp-karst-peaks", name: "Misty Peaks Washi", kind: "tape", desc: "Jade washi tape with a row of misty karst peaks and a drifting raft.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#BCD8CC" opacity=".95"/>
          ${tower(12, 22, 8, 14, "#7EAE9C")}${tower(24, 22, 9, 18, "#5E9A86")}${tower(38, 22, 8, 12, "#8CB8A6")}${tower(54, 22, 10, 17, "#5E9A86")}${tower(70, 22, 8, 14, "#7EAE9C")}
          <path d="M5 14Q20 11 34 14T80 13" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
          <rect x="40" y="20" width="10" height="2" rx="1" fill="#C8A464"/><path d="M48 20V15" stroke="#7A5A30" stroke-width=".8"/><ellipse cx="47" cy="16.5" rx="1.3" ry="1.7" fill="#E8584A"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-karst", name: "River Mist", desc: "Pearl-jade paper with misty karst peaks in the corner and a lantern raft below. Moonlit deep teal with a glowing lantern in dark mode."}
  });
})();
