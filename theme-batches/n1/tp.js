/* Theme Collections, new theme ideas batch n1: onsen, rainforest, tidepool, volcano, savanna */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n, rot = 0) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + rot + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const shut = (x, y, w = 2.6) => `<path d="M${x - w} ${y}q${w} ${-w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const steam = (x, y, h, c = "#fff") => `<path d="M${x} ${y}q-3 ${-h * .25} 0 ${-h * .5}t0 ${-h * .5}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`;
  const leafP = (x, y, L, w, a) => `<path d="M0 0Q${L * .45} ${-w} ${L} 0Q${L * .45} ${w} 0 0z" transform="translate(${x} ${y}) rotate(${a})"`;
  const yuzu = (cx, cy, r, id) => `${rg(id, "#FFF2A0", "#F2A21E", .35, .3)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})" ${SO}/>${leafP(cx + 1, cy - r + 1, r * 1.1, r * .45, -35)} fill="#7CC860" ${S2}/><path d="M${cx} ${cy - r + 1}v-3" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;

  /* ================= HOT SPRING ================= */
  TP_DATA.push({
    theme: "onsen",
    pack: {name: "Bath Time Club", items: {
      onsen_capy: `${lg("n1-oc-b", "#D9A577", "#A8744A")}${lg("n1-oc-w", "#A6E6EE", "#4FB4CC")}
        ${steam(10, 30, 16)}${steam(55, 28, 14)}
        <circle cx="16" cy="22" r="4.4" fill="#A8744A" ${S2}/><circle cx="48" cy="22" r="4.4" fill="#A8744A" ${S2}/>
        <path d="M11 50C9 32 17 20 32 20C47 20 55 32 53 50Z" fill="url(#n1-oc-b)" ${SO}/>
        <rect x="20.5" y="33" width="23" height="15" rx="7.5" fill="#E8BE92" ${S2}/>
        <ellipse cx="28" cy="37.5" rx="1.6" ry="1.1" fill="${O}"/><ellipse cx="36" cy="37.5" rx="1.6" ry="1.1" fill="${O}"/>
        ${shut(19.5, 30, 2.4)}${shut(40, 30, 2.4)}${blush(17, 47, 37, 2.6, 1.6)}${smile(32, 42, 2.2, 1.7)}
        ${yuzu(32, 13, 7, "n1-oc-y")}
        <path d="M4 50Q11 45.5 18 50T32 50T46 50T60 50V56Q60 60 56 60H8Q4 60 4 56z" fill="url(#n1-oc-w)" ${SO}/>
        <path d="M12 54.5h8M38 55h10" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
      onsen_yuzu: `${rg("n1-oy-y", "#FFF4B0", "#F29A1E", .34, .3)}
        <ellipse cx="32" cy="52" rx="24" ry="6" fill="#8FD8E4" ${S2}/><path d="M14 52q4 2 8 0M40 53q4 2 8 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="32" cy="33" r="19" fill="url(#n1-oy-y)" ${SO}/>
        <g fill="#E89A2A" opacity=".55"><circle cx="21" cy="40" r="1"/><circle cx="44" cy="25" r="1"/><circle cx="41" cy="44" r="1"/><circle cx="25" cy="24" r="1"/></g>
        ${leafP(33, 15, 18, 7, -30)} fill="#7CC860" ${S2}/><path d="M32 15v-5" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
        ${SHINE(23, 25, 4.4, 2.6, -35)}
        ${EYES(25, 39, 33, 2.5)}${blush(20.5, 43.5, 38.5)}${smile(32, 38.4, 2.6, 1.9)}
        ${spark(54, 14, 4, "#FFE07A")}${steam(9, 30, 14, "#BFE4F0")}`,
      onsen_monkey: `${rg("n1-om-f", "#E2D6C6", "#A8988A", .4, .3)}${rg("n1-om-s", "#FFFFFF", "#C8D8EE", .35, .3)}
        <circle cx="12" cy="34" r="6" fill="#B8A898" ${S2}/><circle cx="52" cy="34" r="6" fill="#B8A898" ${S2}/>
        <circle cx="32" cy="36" r="21" fill="url(#n1-om-f)" ${SO}/>
        <path d="M32 22C42 20 46 30 44 40C42 48 22 48 20 40C18 30 22 20 32 22Z" fill="#F48C8C" ${S2}/>
        ${shut(25.5, 33, 2.4)}${shut(38.5, 33, 2.4)}
        <ellipse cx="30.5" cy="38" rx=".8" ry="1" fill="${O}"/><ellipse cx="33.5" cy="38" rx=".8" ry="1" fill="${O}"/>
        ${smile(32, 41.5, 2.4, 1.7)}<ellipse cx="23.5" cy="38" rx="2.4" ry="1.5" fill="#FF6F8E" opacity=".7"/><ellipse cx="40.5" cy="38" rx="2.4" ry="1.5" fill="#FF6F8E" opacity=".7"/>
        <circle cx="32" cy="13" r="8" fill="url(#n1-om-s)" ${SO}/><path d="M27 11a5 5 0 0 1 4-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${spark(54, 12, 3.6, "#BFD8F8")}<circle cx="9" cy="14" r="1.6" fill="#BFD8F8"/>`,
      onsen_lantern: `${lg("n1-ol-s", "#D8DCE6", "#9AA2B4")}${rg("n1-ol-g", "#FFF6C8", "#FFC24A", .5, .5)}
        <circle cx="32" cy="30" r="17" fill="#FFD27A" opacity=".35"/>
        <path d="M18 60L22 54H42L46 60Z" fill="url(#n1-ol-s)" ${SO}/><rect x="28" y="40" width="8" height="15" fill="url(#n1-ol-s)" ${SO}/>
        <rect x="20" y="36" width="24" height="6" rx="2" fill="url(#n1-ol-s)" ${SO}/>
        <rect x="22" y="22" width="20" height="15" rx="2.5" fill="url(#n1-ol-s)" ${SO}/>
        <rect x="26" y="24.5" width="12" height="10" rx="2" fill="url(#n1-ol-g)" ${S2}/>
        <path d="M14 23L24 12H40L50 23Z" fill="#8A93A8" ${SO}/><circle cx="32" cy="9.5" r="3.2" fill="#8A93A8" ${S2}/>
        <path d="M13 22Q20 15 26 13H38Q44 15 51 22Q44 19 38 20Q32 17 26 20Q20 19 13 22Z" fill="#fff" ${S15}/>
        ${EYES(29, 35, 29.4, 1.6)}<path d="M30.4 32.2q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>
        ${spark(8, 34, 3.4, "#FFE07A")}${spark(56, 40, 3, "#FFE07A")}`,
      onsen_bucket: `${lg("n1-ob-w", "#F2C892", "#C8925A")}${lg("n1-ob-t", "#FFFFFF", "#DCE8F6")}
        <path d="M12 26H52L48 58H16Z" fill="url(#n1-ob-w)" ${SO}/>
        <path d="M14.5 36H49.5M15.8 47H48.2" stroke="#7A5A3A" stroke-width="3.4"/><path d="M14.5 36H49.5M15.8 47H48.2" stroke="#D8DCE0" stroke-width="1.6"/>
        <path d="M22 27V57M32 27V58M42 27V57" stroke="#B07A46" stroke-width="1.2" opacity=".6"/>
        <path d="M9 24Q32 14 55 24L53 30Q32 21 11 30Z" fill="url(#n1-ob-t)" ${SO}/><path d="M18 21.5L20 27M28 19L29 25M38 19L37.5 25M46 21L44.5 27" stroke="#5A8AD0" stroke-width="2" stroke-linecap="round"/>
        ${EYES(25, 39, 40.5, 2.3)}${blush(20.5, 43.5, 44.5, 2.4, 1.5)}${smile(32, 43.6, 2.2, 1.8)}
        ${steam(24, 12, 9)}${steam(40, 12, 9)}`,
      onsen_milk: `${lg("n1-ok-g", "#FFFFFF", "#E2ECF4", 1, 0)}
        <path d="M24 12H40V18Q46 22 46 30V54Q46 60 40 60H24Q18 60 18 54V30Q18 22 24 18Z" fill="url(#n1-ok-g)" ${SO}/>
        <rect x="22.5" y="6" width="19" height="8" rx="3" fill="#5A8AD0" ${SO}/>
        <rect x="18" y="34" width="28" height="16" fill="#5A8AD0" ${S2}/>${T("MILK", 32, 46, 9.5, "#FFFFFF", 22)}
        <path d="M22 26V31" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
        ${EYES(27.5, 36.5, 28, 2)}${blush(24, 40, 31.5, 2, 1.3)}${smile(32, 30.6, 1.8, 1.6)}
        ${spark(53, 18, 4, "#8FC8F8")}${spark(10, 40, 3, "#FFE07A")}`,
      onsen_mark: `${rg("n1-oq-b", "#FFFFFF", "#FFE6D8", .5, .4)}
        <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#n1-oq-b)" ${SO}/>
        <rect x="10" y="10" width="44" height="44" rx="10" fill="none" stroke="#E0533A" stroke-width="1.6" stroke-dasharray="2 3"/>
        <path d="M16 40Q16 50 32 50Q48 50 48 40" fill="none" stroke="#E0533A" stroke-width="4.6" stroke-linecap="round"/>
        <path d="M22 37q-3-5 0-9t0-9M32 37q-3-5 0-9t0-9M42 37q-3-5 0-9t0-9" fill="none" stroke="#E0533A" stroke-width="4.2" stroke-linecap="round"/>`,
      onsen_soak: `${lg("n1-os-w", "#C8925A", "#9A6838")}
        <path d="M14 40V58M50 40V58" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M14 40V58M50 40V58" stroke="#8A5A32" stroke-width="2.8" stroke-linecap="round"/>
        <rect x="4" y="20" width="56" height="24" rx="5" fill="url(#n1-os-w)" ${SO}/>
        <path d="M5 24Q10 17 18 19Q26 15 34 19Q44 15 52 19Q58 17 59 24Q50 21 44 23Q36 20 30 23Q22 20 14 23Q8 21 5 24Z" fill="#fff" ${S15}/>
        ${T("SOAK IT IN", 32, 37.5, 9.5, "#FFF6E0", 46)}
        ${spark(54, 9, 4, "#BFD8F8")}<circle cx="10" cy="10" r="1.8" fill="#BFD8F8"/>`
    }},
    pins: [
      {id: "tp-onsen-yuzu", name: "Floating Yuzu Pin", kind: "badge", desc: "A sunny little yuzu with a leaf, fresh from the bath.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n1-pp-oy" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF4B0"/><stop offset="1" stop-color="#F29A1E"/></radialGradient></defs>
          <circle cx="15" cy="17" r="11" fill="url(#n1-pp-oy)" stroke="#7A4A14" stroke-width="1.3"/><path d="M15.5 6.5Q21 1.5 26 4Q22 9 15.5 6.5z" fill="#7CC860" stroke="#3E6A2A" stroke-width="1"/>
          <ellipse cx="11" cy="12.5" rx="2.6" ry="1.5" fill="#fff" opacity=".7" transform="rotate(-35 11 12.5)"/><g fill="#E8902A" opacity=".6"><circle cx="19" cy="21" r=".7"/><circle cx="10" cy="20" r=".7"/><circle cx="20" cy="13" r=".7"/></g></svg>`},
      {id: "tp-onsen-steam", name: "Steam Washi", kind: "tape", desc: "Indigo washi tape with soft white steam curls and little snowflakes.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#34508E" opacity=".9"/>
          ${[14, 32, 50, 68].map(x => `<path d="M${x} 20q-3-3 0-6t0-6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`).join("")}
          ${[[23, 8], [41, 18], [59, 8], [77, 17], [8, 9]].map(([x, y]) => `<path d="M${x - 2.4} ${y}H${x + 2.4}M${x} ${y - 2.4}V${y + 2.4}M${x - 1.7} ${y - 1.7}L${x + 1.7} ${y + 1.7}M${x - 1.7} ${y + 1.7}L${x + 1.7} ${y - 1.7}" stroke="#CFE0FF" stroke-width=".8" stroke-linecap="round"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-onsen", name: "Yuzu Steam", desc: "Misty snow-blue paper with a steaming yuzu bath in the corner and a stone lantern below. Warm lantern-lit indigo in dark mode."}
  });

  /* ================= RAINFOREST CANOPY ================= */
  const monstera = (x, y, s, a, c1, c2, id) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${lg(id, c1, c2)}<path d="M0 22C-2 12 -22 9 -22 -6C-22 -18 -9 -23 0 -16C9 -23 22 -18 22 -6C22 9 2 12 0 22Z" fill="url(#${id})" ${SO}/>
    <path d="M0 18V-12" stroke="${O}" stroke-width="1.6"/><path d="M-3 4L-19 -1M-3 -3L-16 -11M3 4L19 -1M3 -3L16 -11" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g>`;
  TP_DATA.push({
    theme: "rainforest",
    pack: {name: "Canopy Crew", items: {
      rainforest_toucan: `${lg("n1-rt-b", "#FFE07A", "#FF8A2A", 1, 0)}
        <path d="M14 58C10 46 12 30 22 24C30 20 38 26 38 38C38 48 32 56 26 60Z" fill="#2E2A36" ${SO}/>
        <path d="M24 32C30 30 34 36 32 46C30 52 24 54 22 50C20 44 20 34 24 32Z" fill="#FFF1C8" ${S2}/>
        <path d="M30 18C40 12 54 14 60 24C54 28 42 28 32 26Z" fill="url(#n1-rt-b)" ${SO}/><path d="M31 22C42 19 52 20 58 23" fill="none" stroke="#E8501E" stroke-width="2" stroke-linecap="round"/><path d="M55 21Q60 23 59.5 25L56 24.5Z" fill="${O}"/>
        <circle cx="24" cy="20" r="10" fill="#2E2A36" ${SO}/><circle cx="26" cy="19" r="4.4" fill="#5EC8F2" ${S15}/><circle cx="26.6" cy="19" r="2" fill="${O}"/><circle cx="27.4" cy="18.2" r=".8" fill="#fff"/>
        <ellipse cx="19" cy="25" rx="2.4" ry="1.4" fill="#FF8FA8" opacity=".8"/>
        <path d="M36 62C36 58 40 56 44 58" fill="none" stroke="#7A5A3A" stroke-width="3" stroke-linecap="round"/>${spark(8, 12, 3.4, "#7CC860")}`,
      rainforest_frog: `${rg("n1-rf-b", "#8FD8FF", "#2F7CE0", .4, .3)}
        ${leafP(4, 52, 56, 9, -6)} fill="#5DB45A" ${SO}/><path d="M6 52L56 46" stroke="#3E8A40" stroke-width="1.4"/>
        <ellipse cx="32" cy="38" rx="17" ry="12" fill="url(#n1-rf-b)" ${SO}/>
        <circle cx="22" cy="25" r="7.5" fill="url(#n1-rf-b)" ${SO}/><circle cx="42" cy="25" r="7.5" fill="url(#n1-rf-b)" ${SO}/>
        <circle cx="22" cy="24.5" r="4.8" fill="#fff"/><circle cx="42" cy="24.5" r="4.8" fill="#fff"/><circle cx="22.6" cy="25" r="2.8" fill="${O}"/><circle cx="42.6" cy="25" r="2.8" fill="${O}"/><circle cx="23.6" cy="24" r="1" fill="#fff"/><circle cx="43.6" cy="24" r="1" fill="#fff"/>
        ${blush(20, 44, 36, 2.8, 1.7)}${smile(32, 37, 3.2, 1.9)}
        <g fill="#FF9A3A" ${S15}><circle cx="15" cy="47" r="3"/><circle cx="21" cy="49" r="2.6"/><circle cx="43" cy="49" r="2.6"/><circle cx="49" cy="47" r="3"/></g>
        ${spark(55, 12, 4, "#7FD0FF")}<circle cx="9" cy="14" r="1.6" fill="#7FD0FF"/>`,
      rainforest_sloth: `${rg("n1-rs-f", "#D8BC9A", "#9A7A5A", .45, .3)}
        ${tube("M2 12Q32 4 62 12", "#8A6440", 5)}
        <path d="M18 12C16 22 18 30 22 34M46 12C48 22 46 30 42 34" fill="none" stroke="${O}" stroke-width="8.6" stroke-linecap="round"/><path d="M18 12C16 22 18 30 22 34M46 12C48 22 46 30 42 34" fill="none" stroke="#A8865E" stroke-width="5" stroke-linecap="round"/>
        <path d="M15 12.5q3 -3 6 0M43 12.5q3 -3 6 0" fill="none" stroke="#5A3A22" stroke-width="2" stroke-linecap="round"/>
        <circle cx="32" cy="40" r="19" fill="url(#n1-rs-f)" ${SO}/>
        <ellipse cx="32" cy="42" rx="14" ry="11" fill="#F6E6CC"/>
        <path d="M18 38Q22 32 28 37Q24 44 18 38ZM46 38Q42 32 36 37Q40 44 46 38Z" fill="#6A4A30"/>
        ${shut(23.5, 39, 2.2)}${shut(36.5, 39, 2.2)}<ellipse cx="32" cy="44.5" rx="2.4" ry="1.6" fill="${O}"/>${smile(32, 48, 2, 1.6)}${blush(21, 43, 46, 2.2, 1.4)}
        ${T("z", 52, 30, 8, "#8A8FD8")}${T("z", 57, 23, 6, "#B5BAE8")}`,
      rainforest_monstera: `${monstera(32, 30, 1.25, -8, "#7FD06A", "#2F8C55", "n1-rm-l")}
        ${EYES(26, 38, 26, 2.3)}${blush(22, 42, 30.5, 2.4, 1.5)}${smile(32, 30, 2.2, 1.8)}
        <path d="M30 56Q31 60 34 62" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round"/>${spark(54, 10, 4, "#FFE07A")}<circle cx="10" cy="54" r="2" fill="#9FE8FF"/>`,
      rainforest_morpho: `${lg("n1-ry-w", "#8FD8FF", "#1E5AE0", 0, 1)}
        <path d="M31 30C24 12 8 8 5 18C3 26 14 32 31 33Z" fill="url(#n1-ry-w)" ${SO}/><path d="M33 30C40 12 56 8 59 18C61 26 50 32 33 33Z" fill="url(#n1-ry-w)" ${SO}/>
        <path d="M31 34C20 36 12 44 16 52C20 58 28 48 31 38Z" fill="url(#n1-ry-w)" ${SO}/><path d="M33 34C44 36 52 44 48 52C44 58 36 48 33 38Z" fill="url(#n1-ry-w)" ${SO}/>
        <g fill="#fff" opacity=".85"><circle cx="11" cy="17" r="1.6"/><circle cx="53" cy="17" r="1.6"/><circle cx="17" cy="50" r="1.3"/><circle cx="47" cy="50" r="1.3"/></g>
        <rect x="29" y="24" width="6" height="26" rx="3" fill="#3A2E3E" ${S2}/><circle cx="32" cy="22" r="5" fill="#3A2E3E" ${S2}/>
        <path d="M30 18Q27 11 24 10M34 18Q37 11 40 10" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="30.4" cy="22" r="1" fill="#fff"/><circle cx="33.6" cy="22" r="1" fill="#fff"/>`,
      rainforest_shroom: `${rg("n1-rh-c", "#C8FFF0", "#3ED6B8", .4, .25)}
        <ellipse cx="32" cy="58" rx="26" ry="4" fill="#3E8A50" ${S2}/>
        <rect x="27" y="34" width="10" height="23" rx="4" fill="#F6E8D0" ${SO}/><rect x="13" y="44" width="6" height="13" rx="3" fill="#F6E8D0" ${S2}/><rect x="45" y="46" width="6" height="11" rx="3" fill="#F6E8D0" ${S2}/>
        <path d="M8 46C8 38 24 38 24 46Z" fill="url(#n1-rh-c)" ${S2}/><path d="M40 48C40 41 56 41 56 48Z" fill="url(#n1-rh-c)" ${S2}/>
        <path d="M12 36C12 18 52 18 52 36Z" fill="url(#n1-rh-c)" ${SO}/>
        <g fill="#fff" opacity=".9"><circle cx="22" cy="28" r="2.4"/><circle cx="34" cy="24" r="1.8"/><circle cx="44" cy="30" r="2"/></g>
        ${EYES(27.5, 36.5, 42, 1.9)}${smile(32, 46, 1.8, 1.6)}${blush(25, 39, 45, 1.8, 1.2)}
        ${spark(10, 14, 3.4, "#9FFFE8")}${spark(56, 16, 4, "#C8FF8A")}`,
      rainforest_macaw: `${lg("n1-ra-r", "#FF7A6A", "#D8282E")}${lg("n1-ra-w", "#7FD0FF", "#2F6FD0")}
        <path d="M30 40C20 44 14 54 12 62H32C36 54 36 46 30 40Z" fill="url(#n1-ra-w)" ${SO}/><path d="M18 56Q24 50 30 48" fill="none" stroke="#FFC93A" stroke-width="3.4" stroke-linecap="round"/>
        <circle cx="32" cy="28" r="17" fill="url(#n1-ra-r)" ${SO}/>
        <path d="M36 18C44 16 48 22 46 28C44 33 38 33 36 30Z" fill="#FFFFFF" ${S2}/>
        <path d="M44 24C54 22 58 30 54 38C52 34 48 32 44 32Z" fill="#3A3236" ${SO}/><path d="M44 31C48 32 51 35 52 38" fill="none" stroke="#7A6A70" stroke-width="1.4"/>
        <circle cx="40" cy="24" r="2.6" fill="${O}"/><circle cx="40.8" cy="23.2" r=".9" fill="#fff"/><path d="M37.5 27.5q2 1.6 4 1" fill="none" stroke="#C8B8C8" stroke-width="1" stroke-linecap="round"/>
        <ellipse cx="30" cy="34" rx="3" ry="1.8" fill="#FFB0C0" opacity=".85"/>${spark(10, 14, 4, "#FFC93A")}`,
      rainforest_wild: `${lg("n1-rw-b", "#4FAA60", "#2B7A4E")}
        ${leafP(6, 30, 20, 7, -150)} fill="#6FBE58" ${S2}/>${leafP(58, 30, 20, 7, -30)} fill="#6FBE58" ${S2}/>
        <rect x="4" y="18" width="56" height="28" rx="9" fill="url(#n1-rw-b)" ${SO}/>
        <rect x="8" y="22" width="48" height="20" rx="6" fill="none" stroke="#C8F0A8" stroke-width="1.3" stroke-dasharray="1.4 3" stroke-linecap="round"/>
        ${T("STAY WILD", 32, 36.6, 10.5, "#FFF6D0", 42)}
        ${spark(54, 9, 4.2, "#FF8A3A")}<circle cx="10" cy="10" r="2" fill="#5EC8F2"/>${spark(12, 55, 3, "#FFC93A")}`
    }},
    pins: [
      {id: "tp-rainforest-leaf", name: "Monstera Pin", kind: "badge", desc: "A glossy split monstera leaf with a single raindrop.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n1-pp-rl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FDA72"/><stop offset="1" stop-color="#2F8C55"/></linearGradient></defs>
          <path d="M15 27C14 21 3 19 3 11C3 5 10 2 15 6C20 2 27 5 27 11C27 19 16 21 15 27Z" fill="url(#n1-pp-rl)" stroke="#1E4A2E" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M15 24V8M15 17L5 14M15 13L7 8M15 17L25 14M15 13L23 8" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M24 20q2 2.6 0 4q-2 -1.4 0 -4z" fill="#9FE8FF" stroke="#2F6A9A" stroke-width=".7"/></svg>`},
      {id: "tp-rainforest-vines", name: "Jungle Vine Washi", kind: "tape", desc: "Deep green washi tape with trailing vines, leaves and tiny blue butterflies.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2B7A4E" opacity=".9"/>
          <path d="M3 12Q15 4 27 12T51 12T75 12T86 10" fill="none" stroke="#A8E07A" stroke-width="1.1"/>
          ${[[9, 9, -40], [21, 13, 40], [33, 9, -40], [45, 13, 40], [57, 9, -40], [69, 13, 40]].map(([x, y, a]) => `<path d="M0 0Q3 -2.4 7 0Q3 2.4 0 0z" fill="#8FDA72" transform="translate(${x} ${y}) rotate(${a})"/>`).join("")}
          ${[[39, 20], [76, 6], [14, 20]].map(([x, y]) => `<path d="M${x} ${y}l-2.6 -2.2q-1 2.4 2.6 2.2l2.6 -2.2q1 2.4 -2.6 2.2z" fill="#7FC8FF"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-rainforest", name: "Canopy Leaf", desc: "Fresh leaf-green paper framed by a monstera and a hanging vine, with a little blue frog. Misty jungle teal in dark mode."}
  });

  /* ================= TIDE POOLS ================= */
  const tent = (cx, cy, n, R, c, w) => Array.from({length: n}, (_, i) => { const a = Math.PI + (i + .5) / n * Math.PI, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * .9; return tube(`M${cx} ${cy}Q${f1((cx + x) / 2 + Math.sin(i) * 3)} ${f1((cy + y) / 2)} ${f1(x)} ${f1(y)}`, c, w, w + 3); }).join("");
  TP_DATA.push({
    theme: "tidepool",
    pack: {name: "Low Tide Friends", items: {
      tidepool_anemone: `${rg("n1-ta-b", "#FFB8D0", "#D8507E", .4, .3)}
        <ellipse cx="32" cy="56" rx="22" ry="5" fill="#7FD3D8" ${S2}/>
        ${tent(32, 34, 9, 22, "#FF8FB8", 4.2)}
        ${Array.from({length: 9}, (_, i) => { const a = Math.PI + (i + .5) / 9 * Math.PI; return `<circle cx="${f1(32 + Math.cos(a) * 22)}" cy="${f1(34 + Math.sin(a) * 19.8)}" r="3" fill="#FFE0EC" ${S15}/>`; }).join("")}
        <path d="M16 36C16 26 48 26 48 36V50Q48 56 42 56H22Q16 56 16 50Z" fill="url(#n1-ta-b)" ${SO}/>
        ${EYES(26, 38, 42, 2.4)}${blush(21.5, 42.5, 47, 2.4, 1.5)}${smile(32, 46.5, 2.4, 1.8)}`,
      tidepool_star: `${rg("n1-ts-b", "#FFC48A", "#E8682A", .4, .35)}
        <path d="${star(32, 34, 27, 12, 5)}" fill="url(#n1-ts-b)" ${SO} />
        <g fill="#FFE2C0">${[[32, 15], [50, 28], [43, 50], [21, 50], [14, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join("")}</g>
        ${EYES(26.5, 37.5, 33, 2.4)}${blush(22.5, 41.5, 38, 2.4, 1.5)}${smile(32, 37.6, 2.4, 1.8)}
        ${spark(55, 10, 4, "#7FE0F0")}<circle cx="9" cy="12" r="1.8" fill="#7FE0F0"/>`,
      tidepool_urchin: `${rg("n1-tu-b", "#D8B0FF", "#7A3EC0", .4, .3)}
        ${Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2; return `<path d="M${f1(32 + Math.cos(a) * 14)} ${f1(36 + Math.sin(a) * 13)}L${f1(32 + Math.cos(a) * 27)} ${f1(36 + Math.sin(a) * 25)}" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M${f1(32 + Math.cos(a) * 14)} ${f1(36 + Math.sin(a) * 13)}L${f1(32 + Math.cos(a) * 27)} ${f1(36 + Math.sin(a) * 25)}" stroke="#B88AF0" stroke-width="1.8" stroke-linecap="round"/>`; }).join("")}
        <circle cx="32" cy="36" r="16" fill="url(#n1-tu-b)" ${SO}/>
        ${shut(26, 36, 2.2)}${shut(38, 36, 2.2)}${blush(22.5, 41.5, 40, 2.6, 1.6)}<path d="M30 42q2 1.2 4 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>`,
      tidepool_puffin: `${rg("n1-tp-b", "#5A5466", "#22202A", .4, .3)}
        <ellipse cx="32" cy="42" rx="20" ry="18" fill="url(#n1-tp-b)" ${SO}/>
        <ellipse cx="32" cy="46" rx="13" ry="12" fill="#FFFFFF"/>
        <circle cx="32" cy="24" r="14" fill="url(#n1-tp-b)" ${SO}/><ellipse cx="32" cy="27" rx="10" ry="8" fill="#F2F0EC"/>
        <path d="M26 28Q32 23 38 28L35.5 37Q32 40 28.5 37Z" fill="#FF7A3A" ${S2}/><path d="M26.6 30.6Q32 27 37.4 30.6" fill="none" stroke="#7A8494" stroke-width="2"/><path d="M28.2 34Q32 31.6 35.8 34" fill="none" stroke="#FFD45A" stroke-width="1.6"/>
        ${EYES(27, 37, 24.5, 2)}<ellipse cx="25" cy="30" rx="2" ry="1.3" fill="#FF8FA8" opacity=".8"/><ellipse cx="39" cy="30" rx="2" ry="1.3" fill="#FF8FA8" opacity=".8"/>
        <path d="M18 60l4-3 4 3M38 60l4-3 4 3" fill="#FF8A3A" ${S2}/>${spark(54, 12, 4, "#7FE0F0")}`,
      tidepool_crab: `${rg("n1-tc-b", "#FFA07A", "#D8482A", .4, .3)}
        ${tube("M18 40L8 34L4 40M18 46L7 46L5 52M46 40L56 34L60 40M46 46L57 46L59 52", "#E8603A", 2.6)}
        ${tube("M20 30L12 20M44 30L52 20", "#E8603A", 3.2)}
        <path d="M6 16C2 10 10 4 14 8L12 13L17 12C18 17 10 20 6 16Z" fill="url(#n1-tc-b)" ${S2}/><path d="M58 16C62 10 54 4 50 8L52 13L47 12C46 17 54 20 58 16Z" fill="url(#n1-tc-b)" ${S2}/>
        <ellipse cx="32" cy="40" rx="17" ry="12" fill="url(#n1-tc-b)" ${SO}/>
        <path d="M27 29V22M37 29V22" stroke="${O}" stroke-width="2"/><circle cx="27" cy="21" r="3.4" fill="#fff" ${S15}/><circle cx="37" cy="21" r="3.4" fill="#fff" ${S15}/><circle cx="27.4" cy="21.4" r="1.6" fill="${O}"/><circle cx="37.4" cy="21.4" r="1.6" fill="${O}"/>
        ${blush(23, 41, 41, 2.6, 1.6)}${smile(32, 40, 2.6, 1.8)}`,
      tidepool_shell: `${lg("n1-th-s", "#FFF4E8", "#F2A898")}
        <path d="M26 50H38L41 57H23Z" fill="#F6C8B8" ${S2}/>
        <path d="M32 52L7 30C8 26 11 22 14 20C16 16 20 13 24 12C27 10 30 10 32 10C34 10 37 10 40 12C44 13 48 16 50 20C53 22 56 26 57 30Z" fill="url(#n1-th-s)" ${SO}/>
        <path d="M32 50L12 27M32 50L19 17M32 50L32 13M32 50L45 17M32 50L52 27" stroke="#E8988A" stroke-width="1.8" stroke-linecap="round"/>
        ${EYES(27, 37, 33, 2.2)}${blush(23, 41, 37.5, 2.2, 1.4)}${smile(32, 37, 2, 1.7)}
        ${spark(55, 10, 4, "#FFE07A")}<circle cx="9" cy="52" r="2" fill="#7FE0F0"/><circle cx="56" cy="50" r="1.6" fill="#7FE0F0"/>`,
      tidepool_sculpin: `${lg("n1-tf-b", "#C8A27A", "#8A6A4A")}
        <path d="M56 32L62 24V40Z" fill="#B08A62" ${S2}/>
        <path d="M58 32C50 24 36 18 20 22C10 24 6 30 6 34C6 40 12 44 20 44C36 46 50 40 58 32Z" fill="url(#n1-tf-b)" ${SO}/>
        <path d="M26 40C20 48 26 56 34 52C32 46 30 42 26 40Z" fill="#E8C89A" ${S2}/><path d="M26 22C22 14 30 8 36 12C34 16 30 20 26 22Z" fill="#E8C89A" ${S2}/>
        <g fill="#6A4E36" opacity=".7"><circle cx="38" cy="30" r="2.4"/><circle cx="46" cy="34" r="1.8"/><circle cx="30" cy="36" r="1.6"/></g>
        <circle cx="16" cy="29" r="4.4" fill="#fff" ${S15}/><circle cx="15.4" cy="29.4" r="2.2" fill="${O}"/><circle cx="16.2" cy="28.4" r=".8" fill="#fff"/>
        <ellipse cx="13" cy="36" rx="2.4" ry="1.4" fill="#FF8FA8" opacity=".8"/><path d="M7 36q2 2 4 1" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="54" cy="12" r="3" fill="#BFF0FA" ${S15}/><circle cx="47" cy="7" r="2" fill="#BFF0FA" ${S15}/>`,
      tidepool_tide: `${lg("n1-tt-b", "#5EC8D8", "#2F8EA8")}
        <rect x="4" y="18" width="56" height="28" rx="14" fill="url(#n1-tt-b)" ${SO}/>
        <path d="M8 40Q14 36 20 40T32 40T44 40T56 40" fill="none" stroke="#C8F4FA" stroke-width="1.6" stroke-linecap="round"/>
        ${T("TIDE'S OUT!", 32, 35, 10, "#FFFFFF", 44)}
        <path d="${star(54, 50, 6, 2.6, 5)}" fill="#F2884A" ${S15}/><circle cx="10" cy="12" r="3" fill="#FF8FB8" ${S15}/>${spark(52, 9, 3.6, "#FFE07A")}`
    }},
    pins: [
      {id: "tp-tidepool-star", name: "Sea Star Pin", kind: "badge", desc: "A bumpy little orange sea star from the pools.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n1-pp-ts" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFC48A"/><stop offset="1" stop-color="#E8682A"/></radialGradient></defs>
          <path d="${star(15, 16, 13, 5.6, 5)}" fill="url(#n1-pp-ts)" stroke="#7A2E14" stroke-width="1.2" stroke-linejoin="round"/>
          <g fill="#FFE2C0">${[[15, 7], [23.4, 13], [20, 23], [10, 23], [6.6, 13]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join("")}<circle cx="15" cy="16" r="1.4"/></g></svg>`},
      {id: "tp-tidepool-pool", name: "Rock Pool Washi", kind: "tape", desc: "Aqua washi tape dotted with anemones, sea stars and bubbles.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#4FB8CC" opacity=".88"/>
          ${[[12, 13, "#FF8FB8"], [42, 14, "#6EE0A8"], [70, 12, "#B58CF2"]].map(([x, y, c]) => Array.from({length: 8}, (_, i) => { const a = i / 8 * Math.PI * 2; return `<circle cx="${f1(x + Math.cos(a) * 4)}" cy="${f1(y + Math.sin(a) * 4)}" r="1.5" fill="${c}"/>`; }).join("") + `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`).join("")}
          <path d="${star(27, 12, 4.6, 2, 5)}" fill="#F2884A"/><path d="${star(57, 14, 4.6, 2, 5)}" fill="#F2B53A"/>
          <circle cx="34" cy="7" r="1.4" fill="none" stroke="#fff" stroke-width=".7"/><circle cx="79" cy="19" r="1.4" fill="none" stroke="#fff" stroke-width=".7"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-tidepool", name: "Rock Pool", desc: "Clear sea-glass paper with an anemone pool in the corner and a sea star and shell below. Moonlit deep blue in dark mode."}
  });

  /* ================= VOLCANO ISLAND ================= */
  const hib = (cx, cy, r, c, id) => `${rg(id, "#FFD0DA", c, .5, .5)}<g>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${f1(cx + Math.cos((a - 90) * Math.PI / 180) * r * .6)}" cy="${f1(cy + Math.sin((a - 90) * Math.PI / 180) * r * .6)}" rx="${f1(r * .55)}" ry="${f1(r * .42)}" transform="rotate(${a} ${f1(cx + Math.cos((a - 90) * Math.PI / 180) * r * .6)} ${f1(cy + Math.sin((a - 90) * Math.PI / 180) * r * .6)})" fill="url(#${id})" ${S2}/>`).join("")}</g><circle cx="${cx}" cy="${cy}" r="${f1(r * .26)}" fill="#FFD45A" ${S15}/>`;
  TP_DATA.push({
    theme: "volcano",
    pack: {name: "Island Hot Spots", items: {
      volcano_peak: `${lg("n1-vp-b", "#C89478", "#8A5A48")}${lg("n1-vp-g", "#8AD07A", "#3E9A55")}
        <circle cx="34" cy="10" r="6" fill="#F2F0EE" ${S2}/><circle cx="42" cy="7" r="4.4" fill="#F2F0EE" ${S2}/><circle cx="27" cy="9" r="3.6" fill="#F2F0EE" ${S2}/>
        <path d="M4 56L22 20H42L60 56Z" fill="url(#n1-vp-b)" ${SO}/>
        <path d="M22 20Q32 26 42 20" fill="#6A3A30" ${S2}/><path d="M28 22Q27 30 30 34M37 22Q38 28 36 31" fill="none" stroke="#FF8A3A" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M6 52C10 44 16 44 20 47C24 42 30 42 34 46C38 42 46 42 50 46C54 44 58 48 59 54L60 56H4Z" fill="url(#n1-vp-g)" ${SO}/>
        ${EYES(25.5, 38.5, 36, 2.4)}${blush(21, 43, 41, 2.6, 1.6)}${smile(32, 40.5, 2.6, 1.9)}
        ${spark(10, 12, 3.6, "#FFC24A")}${spark(55, 22, 3, "#FF8A3A")}`,
      volcano_ember: `${rg("n1-ve-b", "#FFE6A0", "#F25A2A", .4, .3)}
        <path d="M32 6C36 14 50 20 52 36C54 50 44 58 32 58C20 58 10 50 12 36C14 20 28 14 32 6Z" fill="url(#n1-ve-b)" ${SO}/>
        <path d="M20 30C20 22 26 18 30 16" fill="none" stroke="#FFF6D0" stroke-width="3" stroke-linecap="round" opacity=".9"/>
        ${EYES(26, 38, 38, 2.6)}${blush(21, 43, 43, 2.6, 1.6)}${smile(32, 43, 2.6, 1.9)}
        ${spark(56, 10, 4, "#FFC24A")}${spark(8, 20, 3, "#FF8A3A")}<circle cx="55" cy="50" r="2" fill="#FFC24A"/>`,
      volcano_pumice: `${rg("n1-vu-b", "#F4EEE8", "#B8ADA4", .38, .3)}
        <path d="M6 48Q14 44 22 48T38 48T54 48T60 48" fill="none" stroke="#5EC0C6" stroke-width="3" stroke-linecap="round"/>
        <path d="M12 40C10 26 20 18 32 18C46 18 54 26 52 40C50 50 14 50 12 40Z" fill="url(#n1-vu-b)" ${SO}/>
        <g fill="#A89C92">${[[20, 28, 2], [44, 26, 1.6], [42, 40, 2.2], [24, 41, 1.4], [33, 23, 1.2], [48, 34, 1.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
        ${EYES(27, 37, 33, 2.2)}${blush(23, 41, 37.5, 2.2, 1.4)}${smile(32, 37, 2, 1.7)}
        <path d="M8 56Q16 52 24 56T40 56T56 56" fill="none" stroke="#8ED8D2" stroke-width="2.4" stroke-linecap="round"/>${spark(55, 10, 3.6, "#8ED8D2")}`,
      volcano_iguana: `${lg("n1-vi-b", "#7A8A8E", "#3E4A52")}
        <path d="M20 22L24 14L28 21L32 12L36 21L40 14L42 22" fill="#E8A040" ${S2}/>
        <path d="M8 40C8 26 20 20 34 21C48 22 58 30 58 40C58 48 48 52 34 52C20 52 8 50 8 40Z" fill="url(#n1-vi-b)" ${SO}/>
        <g fill="#5E6C72"><circle cx="20" cy="30" r="2"/><circle cx="28" cy="27" r="1.6"/><circle cx="44" cy="28" r="1.8"/><circle cx="50" cy="34" r="1.4"/></g>
        <circle cx="22" cy="36" r="5" fill="#fff" ${S15}/><circle cx="22.6" cy="36.4" r="2.6" fill="${O}"/><circle cx="23.4" cy="35.4" r=".9" fill="#fff"/>
        <ellipse cx="18" cy="44" rx="3" ry="1.8" fill="#FF8FA8" opacity=".8"/><path d="M10 45q4 3 10 1" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="7" cy="20" r="2.4" fill="#DDF4FA" ${S15}/><circle cx="3.6" cy="14" r="1.6" fill="#DDF4FA" ${S15}/><circle cx="9" cy="11" r="1.2" fill="#DDF4FA" ${S15}/>`,
      volcano_hibiscus: `${hib(32, 32, 26, "#F2486A", "n1-vh-p")}
        <path d="M32 32L44 18" stroke="#FFD45A" stroke-width="2.4" stroke-linecap="round"/><circle cx="44" cy="17" r="2.6" fill="#FFD45A" ${S15}/>
        ${EYES(27.5, 36.5, 34.5, 1.8)}${smile(32, 37.6, 1.8, 1.5)}`,
      volcano_coconut: `${rg("n1-vc-b", "#B08058", "#6A4428", .4, .3)}
        <path d="M40 8L30 30" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M40 8L30 30" stroke="#FF7FA8" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M44 22C44 12 60 12 60 22Z" fill="#5EC8F2" ${S2}/><path d="M52 22V34" stroke="${O}" stroke-width="1.6"/>
        <circle cx="30" cy="40" r="20" fill="url(#n1-vc-b)" ${SO}/>
        <ellipse cx="30" cy="24" rx="15" ry="5" fill="#FFF6E6" ${S2}/>
        ${EYES(23.5, 36.5, 40, 2.4)}${blush(19, 41, 45, 2.4, 1.5)}${smile(30, 44.6, 2.4, 1.8)}
        ${hib(12, 20, 7, "#FF8A3A", "n1-vc-f")}`,
      volcano_palm: `${lg("n1-vl-l", "#8AD07A", "#3E9A55")}
        <ellipse cx="32" cy="56" rx="26" ry="5" fill="#5EC0C6" ${S2}/><path d="M14 54C18 46 46 46 50 54Z" fill="#F2DCA8" ${S2}/>
        ${tube("M30 52Q28 36 34 20", "#B08058", 5)}
        ${[[-150, 18], [-120, 16], [-60, 16], [-30, 18], [-95, 12]].map(([a, L]) => `<path d="M0 0Q${L * .5} -6 ${L} 2Q${L * .5} 3 0 0z" transform="translate(34 20) rotate(${a})" fill="url(#n1-vl-l)" ${S2}/>`).join("")}
        <circle cx="31" cy="23" r="3" fill="#7A5432" ${S15}/><circle cx="36.5" cy="23.5" r="3" fill="#7A5432" ${S15}/>
        ${spark(54, 10, 4, "#FFC24A")}<circle cx="10" cy="12" r="5" fill="#FFE07A" ${S15}/>`,
      volcano_hot: `${lg("n1-vt-b", "#FF8A3A", "#E0402A")}
        <path d="M4 22Q10 14 18 20Q24 12 32 20Q40 12 46 20Q54 14 60 22V42Q60 46 56 46H8Q4 46 4 42Z" fill="url(#n1-vt-b)" ${SO}/>
        ${T("HOT STUFF", 32, 38, 10, "#FFF4D0", 44)}
        ${spark(54, 54, 4, "#FFC24A")}${spark(10, 54, 3, "#FF8A3A")}<circle cx="32" cy="56" r="2" fill="#FFC24A"/>`
    }},
    pins: [
      {id: "tp-volcano-hibiscus", name: "Hibiscus Pin", kind: "badge", desc: "A bright island hibiscus with a sunny yellow heart.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n1-pp-vh" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#FFD0DA"/><stop offset="1" stop-color="#F2486A"/></radialGradient></defs>
          ${[0, 72, 144, 216, 288].map(a => { const t = (a - 90) * Math.PI / 180, x = f1(15 + Math.cos(t) * 7), y = f1(15 + Math.sin(t) * 7); return `<ellipse cx="${x}" cy="${y}" rx="6.6" ry="5" transform="rotate(${a} ${x} ${y})" fill="url(#n1-pp-vh)" stroke="#7A1A2E" stroke-width="1"/>`; }).join("")}
          <circle cx="15" cy="15" r="3" fill="#FFD45A" stroke="#7A4A14" stroke-width=".8"/><path d="M15 15L21 8" stroke="#FFD45A" stroke-width="1.2"/></svg>`},
      {id: "tp-volcano-lava", name: "Lava Glow Washi", kind: "tape", desc: "Warm black washi tape with glowing lava ribbons and sparks.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#3A2A30" opacity=".9"/>
          <path d="M3 16Q14 6 24 14T46 12T68 15T86 11" fill="none" stroke="#FF8A3A" stroke-width="2.6" stroke-linecap="round"/><path d="M3 16Q14 6 24 14T46 12T68 15T86 11" fill="none" stroke="#FFE08A" stroke-width="1" stroke-linecap="round"/>
          ${[[14, 20], [36, 6], [56, 20], [76, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#FFC24A"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".2"/></svg>`}
    ],
    card: {id: "tp-volcano", name: "Island Postcard", desc: "Sunny peach postcard paper with a little volcano in the corner and a hibiscus below. Lava-glow plum in dark mode."}
  });

  /* ================= SAVANNA SUNSET ================= */
  TP_DATA.push({
    theme: "savanna",
    pack: {name: "Golden Hour Herd", items: {
      savanna_elephant: `${rg("n1-se-b", "#D6D0DA", "#9A92A2", .4, .3)}
        <g fill="#BFE8F8" ${S15}><circle cx="52" cy="8" r="2.4"/><circle cx="58" cy="14" r="2"/><circle cx="47" cy="5" r="1.6"/></g>
        <ellipse cx="14" cy="34" rx="10" ry="13" fill="#B8B0C0" ${SO}/><ellipse cx="14" cy="34" rx="6" ry="8.6" fill="#F4B4BE"/>
        <path d="M38 38C46 34 50 24 50 16" fill="none" stroke="${O}" stroke-width="10.6" stroke-linecap="round"/><path d="M38 38C46 34 50 24 50 16" fill="none" stroke="#B8B0C0" stroke-width="7" stroke-linecap="round"/>
        <circle cx="30" cy="38" r="17" fill="url(#n1-se-b)" ${SO}/>
        <path d="M20 54V60M40 54V60" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M20 54V60M40 54V60" stroke="#A8A0B0" stroke-width="4.6" stroke-linecap="round"/>
        ${shut(24, 36, 2.2)}${shut(35, 36, 2.2)}${blush(20, 39, 41, 2.6, 1.6)}${smile(29.5, 43, 2.2, 1.7)}`,
      savanna_giraffe: `${lg("n1-sg-b", "#FFD88A", "#E8A84A")}
        <path d="M22 62C22 50 26 40 26 30H38C38 40 42 50 42 62Z" fill="url(#n1-sg-b)" ${SO}/>
        <g fill="#C27A3A"><ellipse cx="30" cy="44" rx="3" ry="2.4"/><ellipse cx="36" cy="52" rx="2.6" ry="2.2"/><ellipse cx="28" cy="56" rx="2.4" ry="2"/><ellipse cx="34" cy="38" rx="2" ry="1.8"/></g>
        <path d="M24 12V6M40 12V6" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="5" r="2.8" fill="#8A5A30" ${S15}/><circle cx="40" cy="5" r="2.8" fill="#8A5A30" ${S15}/>
        <ellipse cx="14" cy="18" rx="6" ry="3" fill="#F2C46A" ${S2} transform="rotate(-20 14 18)"/><ellipse cx="50" cy="18" rx="6" ry="3" fill="#F2C46A" ${S2} transform="rotate(20 50 18)"/>
        <path d="M18 22C18 12 46 12 46 22C46 30 44 36 32 36C20 36 18 30 18 22Z" fill="url(#n1-sg-b)" ${SO}/>
        <ellipse cx="32" cy="30" rx="10" ry="6" fill="#F6DCA8" ${S15}/><ellipse cx="29" cy="30" rx="1" ry="1.3" fill="${O}"/><ellipse cx="35" cy="30" rx="1" ry="1.3" fill="${O}"/>
        ${EYES(25, 39, 21, 2.2)}${blush(21, 43, 25.5, 2.2, 1.4)}`,
      savanna_meerkat: `${lg("n1-sm-b", "#E8CC9E", "#B8905E")}
        <path d="M20 62C16 50 18 34 24 28H40C46 34 48 50 44 62Z" fill="url(#n1-sm-b)" ${SO}/><ellipse cx="32" cy="48" rx="8" ry="11" fill="#F6E6C8"/>
        <path d="M26 38Q22 44 26 46M38 38Q42 44 38 46" fill="none" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M26 38Q22 44 26 46M38 38Q42 44 38 46" fill="none" stroke="#C8A06E" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="20" cy="16" r="3" fill="#6A4A32" ${S15}/><circle cx="44" cy="16" r="3" fill="#6A4A32" ${S15}/>
        <path d="M20 20C20 10 44 10 44 20C44 28 38 34 32 34C26 34 20 28 20 20Z" fill="url(#n1-sm-b)" ${SO}/>
        <ellipse cx="26" cy="21" rx="4" ry="3.4" fill="#5A3A28"/><ellipse cx="38" cy="21" rx="4" ry="3.4" fill="#5A3A28"/>
        <circle cx="26" cy="21" r="2" fill="${O}"/><circle cx="38" cy="21" r="2" fill="${O}"/><circle cx="26.8" cy="20.2" r=".8" fill="#fff"/><circle cx="38.8" cy="20.2" r=".8" fill="#fff"/>
        <ellipse cx="32" cy="27.5" rx="2" ry="1.4" fill="${O}"/>${smile(32, 30, 1.6, 1.4)}`,
      savanna_sunset: `${rg("n1-ss-s", "#FFF4C0", "#FFB04A", .5, .45)}${lg("n1-ss-g", "#F2C46A", "#C8963A")}
        <circle cx="32" cy="32" r="22" fill="url(#n1-ss-s)" ${SO}/>
        <path d="M6 48C14 44 50 44 58 48V54Q58 58 54 58H10Q6 58 6 54Z" fill="url(#n1-ss-g)" ${SO}/>
        <path d="M30 48L29 34L22 28M30 38L36 30M29 34L32 26" fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 28C12 22 22 20 30 20C40 20 50 22 50 28C44 31 18 31 12 28Z" fill="#7E8E3A" ${S2}/>
        ${spark(10, 10, 3.4, "#FFE07A")}`,
      savanna_zebra: `${rg("n1-sz-b", "#FFFFFF", "#DAD6E2", .4, .3)}
        <path d="M18 12L24 22L14 22Z M46 12L40 22L50 22Z" fill="#fff" ${S2}/>
        <path d="M24 10Q32 4 40 10L36 14H28Z" fill="#2E2A36" ${S2}/>
        <path d="M18 24C18 14 46 14 46 24C46 36 42 52 32 56C22 52 18 36 18 24Z" fill="url(#n1-sz-b)" ${SO}/>
        <path d="M22 26Q26 24 28 27M36 27Q38 24 42 26M20 34Q25 32 26 36M38 36Q39 32 44 34M24 18Q28 20 30 18M34 18Q36 20 40 18" fill="none" stroke="#2E2A36" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M24 44C24 40 40 40 40 44C40 52 36 56 32 56C28 56 24 52 24 44Z" fill="#5A5262" ${S2}/><ellipse cx="29" cy="47" rx="1.2" ry="1.6" fill="${O}"/><ellipse cx="35" cy="47" rx="1.2" ry="1.6" fill="${O}"/>
        ${EYES(25.5, 38.5, 31, 2.2)}<ellipse cx="22" cy="38" rx="2" ry="1.3" fill="#FF8FA8" opacity=".8"/><ellipse cx="42" cy="38" rx="2" ry="1.3" fill="#FF8FA8" opacity=".8"/>`,
      savanna_cub: `${rg("n1-sc-b", "#FFE0A0", "#E0A04A", .4, .3)}
        <circle cx="16" cy="18" r="6.4" fill="#E0A04A" ${S2}/><circle cx="48" cy="18" r="6.4" fill="#E0A04A" ${S2}/><circle cx="16" cy="18" r="3" fill="#F6C8A0"/><circle cx="48" cy="18" r="3" fill="#F6C8A0"/>
        <circle cx="32" cy="34" r="21" fill="url(#n1-sc-b)" ${SO}/>
        <path d="M24 12Q28 8 30 13Q32 7 35 12Q38 8 40 13" fill="none" stroke="#C88030" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="32" cy="42" rx="10" ry="7" fill="#FFF0D0"/><path d="M29 38H35L32 41Z" fill="#8A4A3A" ${S15}/>
        <path d="M32 41V43M32 43q-3 2-5 0M32 43q3 2 5 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${EYES(24.5, 39.5, 32, 2.6)}${blush(19, 45, 39, 2.6, 1.6)}`,
      savanna_roller: `${lg("n1-sr-b", "#8FD8FF", "#3E7CE0")}${lg("n1-sr-c", "#E8B0F0", "#B87AD8")}
        <path d="M24 44L18 62L30 50Z" fill="#2F6FD0" ${S2}/><path d="M28 46L28 62L34 50Z" fill="#5EC8F2" ${S2}/>
        <ellipse cx="32" cy="36" rx="16" ry="14" fill="url(#n1-sr-b)" ${SO}/>
        <path d="M22 30C22 40 30 46 38 44C42 40 40 32 32 30Z" fill="url(#n1-sr-c)" ${S2}/>
        <path d="M34 34C42 30 52 34 54 42C48 44 40 42 34 38Z" fill="#2F6FD0" ${S2}/>
        <circle cx="30" cy="20" r="10" fill="#7FD0B0" ${SO}/><path d="M38 20L46 22L38 24Z" fill="#3A3236" ${S15}/>
        <circle cx="32" cy="18.5" r="2.4" fill="${O}"/><circle cx="32.8" cy="17.8" r=".8" fill="#fff"/><ellipse cx="27" cy="23" rx="2" ry="1.3" fill="#FF8FA8" opacity=".8"/>
        <path d="M24 60V54M36 60V54" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>${spark(54, 12, 4, "#FFE07A")}`,
      savanna_wild: `${lg("n1-sw-b", "#F2B04A", "#D27A2A")}
        <rect x="4" y="18" width="56" height="28" rx="6" fill="url(#n1-sw-b)" ${SO}/>
        <path d="M6 46L10 38L13 46M51 46L54 37L58 46" fill="#B8862E" ${S15}/>
        ${T("WILD DAYS", 32, 36.4, 10.5, "#FFF6D8", 44)}
        <circle cx="52" cy="10" r="6" fill="#FFE07A" ${S2}/><path d="M6 12C6 9 12 8 15 8C18 8 22 9 22 12C19 13 9 13 6 12Z" fill="#7E8E3A" ${S15}/><path d="M14 13V18" stroke="${O}" stroke-width="1.6"/>`
    }},
    pins: [
      {id: "tp-savanna-sun", name: "Acacia Sunset Pin", kind: "badge", desc: "A flat-topped acacia against a huge golden sun.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n1-pp-ss" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#FFF4C0"/><stop offset="1" stop-color="#FFA03A"/></radialGradient></defs>
          <circle cx="15" cy="15" r="13" fill="url(#n1-pp-ss)" stroke="#7A3A14" stroke-width="1.2"/>
          <path d="M3 21Q15 18 27 21A13 13 0 0 1 3 21Z" fill="#C8963A"/>
          <path d="M14 21L13.6 15L10 12M14 16L17.6 12.4" fill="none" stroke="#3A2414" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M6 12C6 9.6 10 8.8 14 8.8C18 8.8 23 9.6 23 12C20 13.2 9 13.2 6 12Z" fill="#5A6A2A"/></svg>`},
      {id: "tp-savanna-grass", name: "Savanna Grass Washi", kind: "tape", desc: "Golden washi tape with swaying grass and a little herd walking by.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#E8B85A" opacity=".9"/>
          ${Array.from({length: 18}, (_, i) => { const x = 5 + i * 4.4; return `<path d="M${x} 24Q${x + 1} 18 ${x + 2.4} ${14 + (i % 3) * 2}" fill="none" stroke="#B8862E" stroke-width="1" stroke-linecap="round"/>`; }).join("")}
          ${[[24, 12], [36, 11], [48, 12]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="#6A4A2A"/><path d="M${x - 3} ${y + 1}v3M${x + 2.6} ${y + 1}v3M${x + 3.4} ${y - 1}l2 -2.4" stroke="#6A4A2A" stroke-width="1"/>`).join("")}
          <circle cx="72" cy="9" r="4" fill="#FFF0C0"/><path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-savanna", name: "Golden Hour", desc: "Warm golden paper with an acacia against a huge low sun in the corner and tall grass below. Dusky violet with a rising moon in dark mode."}
  });
})();
