/* ===== module: 96-tp-b4.js ===== */
/* Theme Collections, batch 4 */
(() => {
  const D = "#2B2233";
  const LN = (w = 2) => `stroke="${D}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const G = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const RG = (id, a, b, cx = .35, cy = .3) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const MEW = (x, y) => `<path d="M${x - 3.6} ${y}q1.8 2.3 3.6 0q1.8 2.3 3.6 0" fill="none" ${LN(1.9)}/>`;
  const NOSE = (x, y) => `<path d="M${x - 1.7} ${y}h3.4l-1.7 2z" fill="#E8637E" stroke="#E8637E" stroke-width=".8" stroke-linejoin="round"/>`;
  const SHUT = (a, b, y) => `<path d="M${a - 3.2} ${y}q3.2 3 6.4 0M${b - 3.2} ${y}q3.2 3 6.4 0" fill="none" ${LN(2.2)}/>`;
  const T = (t, y, sz, c, len, x = 32) => `<text x="${x}" y="${y}" text-anchor="middle" textLength="${len}" lengthAdjust="spacingAndGlyphs" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}">${t}</text>`;
  const HI = (x, y, rx = 4, ry = 2.4, rot = -30, o = .6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;
  // washi tape body with zigzag torn ends, 86 by 26
  const TAPE = (() => { let r = "", l = ""; for (let i = 0; i <= 8; i++) { const y = 2 + i * 2.75; r += `L${i % 2 ? 85.5 : 82.5} ${y.toFixed(2)}`; l = `L${i % 2 ? .5 : 3.5} ${y.toFixed(2)}` + l; } return `M3.5 2H82.5${r.slice(1).replace(/^[^L]*/, "")}H3.5${l}Z`; })();

  /* Cozy Cats */
  TP_DATA.push({
    theme: "cats",
    pack: {name: "Kitty Corner", items: {
      cats_tabby: `<defs>${G("b4ca-tb", "#F7B872", "#E8904A")}<clipPath id="b4ca-yc"><circle cx="47" cy="47" r="12.5"/></clipPath></defs>
        <path d="M11 55q-9-1-7-13" fill="none" stroke="${D}" stroke-width="8" stroke-linecap="round"/><path d="M11 55q-9-1-7-13" fill="none" stroke="#EE9C55" stroke-width="3.4" stroke-linecap="round"/>
        <ellipse cx="24" cy="47" rx="15" ry="12.5" fill="url(#b4ca-tb)" ${SO}/>
        <path d="M19 49q-1 5 1 9M29 49q1 5-1 9" fill="none" stroke="#C9672F" stroke-width="2" stroke-linecap="round"/>
        <circle cx="47" cy="47" r="12.5" fill="#E07A8A"/>
        <g clip-path="url(#b4ca-yc)" fill="none" stroke="#B94860" stroke-width="2"><path d="M34 42q12-5 26 4M34 50q13-6 26 1M41 34q-3 12 4 26M52 34q-6 12 0 26"/></g>
        <circle cx="47" cy="47" r="12.5" fill="none" ${SO}/>${HI(42, 41, 3.5, 2)}
        <path d="M35 57q-6 5-14 3" fill="none" stroke="#E07A8A" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M11 23L9.5 5.5l14 8.5zM39 23l1.5-17.5-14 8.5z" fill="#F2A65A" ${SO}/><path d="M13 11l.6 6.5M37 11l-.6 6.5" stroke="#F79AAE" stroke-width="3" stroke-linecap="round"/>
        <circle cx="25" cy="26" r="15" fill="url(#b4ca-tb)" ${SO}/>
        <path d="M25 12.5v4.5M20 13.5l1 3.5M30 13.5l-1 3.5" stroke="#C9672F" stroke-width="2.3" stroke-linecap="round"/>
        ${EYES(19.5, 30.5, 26)}${BLUSH(14.5, 35.5, 31.5)}${NOSE(25, 29.5)}${MEW(25, 32.2)}
        <ellipse cx="39.5" cy="37" rx="6" ry="5" fill="#F7B872" ${SO}/><path d="M37.5 34.5v2.5M41 34.2v2.6" stroke="${D}" stroke-width="1.5" stroke-linecap="round"/>`,
      cats_loaf: `<defs>${G("b4ca-lf", "#C3BED3", "#9C95B0")}</defs>
        <rect x="3" y="48" width="58" height="12" rx="6" fill="#8FB8E8" ${SO}/><path d="M9 54h46" stroke="#fff" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>
        <path d="M12 30L12 13l12 9zM52 30l0-17-12 9z" fill="#B3ADC4" ${SO}/><path d="M14.5 18l.5 6M49.5 18l-.5 6" stroke="#F79AAE" stroke-width="3" stroke-linecap="round"/>
        <path d="M7 48c0-17 11-28 25-28s25 11 25 28c0 4-3 6-7 6H14c-4 0-7-2-7-6z" fill="url(#b4ca-lf)" ${SO}/>
        <path d="M32 21v5M26 22l1.3 4M38 22l-1.3 4" stroke="#857E9C" stroke-width="2.3" stroke-linecap="round"/>
        ${SHUT(24, 40, 36)}${BLUSH(19, 45, 42)}${NOSE(32, 39.5)}${MEW(32, 42.3)}
        <ellipse cx="24" cy="53" rx="5.5" ry="3.4" fill="#F4F1FA" ${LN(2)}/><ellipse cx="40" cy="53" rx="5.5" ry="3.4" fill="#F4F1FA" ${LN(2)}/>
        <text x="50" y="16" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="10" fill="#6F8FD0">z</text><text x="56" y="9" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="7.5" fill="#6F8FD0">z</text>`,
      cats_box: `<defs>${G("b4ca-bx", "#E8B77E", "#D19A5E")}${G("b4ca-bk", "#5A5270", "#3E3752")}</defs>
        <path d="M10 34l-6-9h20l6 9z" fill="#C98C52" ${SO}/><path d="M54 34l6-9H40l-6 9z" fill="#C98C52" ${SO}/>
        <path d="M19 22L18 6l11 8zM45 22l1-16-11 8z" fill="url(#b4ca-bk)" ${SO}/><path d="M20.5 11l.4 5M43.5 11l-.4 5" stroke="#F79AAE" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="32" cy="25" r="13.5" fill="url(#b4ca-bk)" ${SO}/>
        <ellipse cx="26.5" cy="25" rx="3.6" ry="4.2" fill="#F5D46A"/><ellipse cx="37.5" cy="25" rx="3.6" ry="4.2" fill="#F5D46A"/><ellipse cx="26.8" cy="25.4" rx="1.5" ry="3" fill="${D}"/><ellipse cx="37.8" cy="25.4" rx="1.5" ry="3" fill="${D}"/><circle cx="27.6" cy="23.6" r=".9" fill="#fff"/><circle cx="38.6" cy="23.6" r=".9" fill="#fff"/>
        ${NOSE(32, 29.5)}${BLUSH(21.5, 42.5, 31)}
        <rect x="8" y="33" width="48" height="26" rx="3" fill="url(#b4ca-bx)" ${SO}/>
        <ellipse cx="25" cy="34" rx="5.5" ry="4" fill="#4A4260" ${LN(2)}/><ellipse cx="39" cy="34" rx="5.5" ry="4" fill="#4A4260" ${LN(2)}/>
        <path d="M32 50.5s-6-3.5-6-7.3a3 3 0 0 1 6-.7 3 3 0 0 1 6 .7c0 3.8-6 7.3-6 7.3z" fill="#E07A8A"/>`,
      cats_nurse: `<defs>${G("b4ca-nh", "#FFFFFF", "#F6ECE3")}<clipPath id="b4ca-nc"><circle cx="32" cy="38" r="21"/></clipPath></defs>
        <path d="M12 31L10 12l16 8zM52 31l2-19-16 8z" fill="#F2A65A" ${SO}/><path d="M52 31l2-19-16 8z" fill="#4A4260" ${SO}/><path d="M14 17l1 7" stroke="#F79AAE" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="38" r="21" fill="url(#b4ca-nh)"/>
        <g clip-path="url(#b4ca-nc)"><path d="M8 20q14 2 16 16-7 6-16 2z" fill="#F2A65A"/><path d="M56 22q-11 3-12 14 6 5 12 3z" fill="#4A4260"/></g>
        <circle cx="32" cy="38" r="21" fill="none" ${SO}/>
        <path d="M19 22l2-13q11-4 22 0l2 13q-13-4-26 0z" fill="#fff" ${SO}/>
        <path d="M32 18.5s-4.6-2.7-4.6-5.6a2.3 2.3 0 0 1 4.6-.5 2.3 2.3 0 0 1 4.6.5c0 2.9-4.6 5.6-4.6 5.6z" fill="#E8637E"/>
        ${EYES(24, 40, 38)}${BLUSH(18.5, 45.5, 44)}${NOSE(32, 42)}${MEW(32, 44.8)}`,
      cats_paw: `<defs>${G("b4ca-pw", "#E39A7C", "#B5563F")}</defs>
        <g fill="url(#b4ca-pw)" ${SO}><ellipse cx="13.5" cy="29" rx="6.5" ry="8.3" transform="rotate(-24 13.5 29)"/><ellipse cx="25" cy="15.5" rx="7" ry="8.8" transform="rotate(-8 25 15.5)"/><ellipse cx="39" cy="15.5" rx="7" ry="8.8" transform="rotate(8 39 15.5)"/><ellipse cx="50.5" cy="29" rx="6.5" ry="8.3" transform="rotate(24 50.5 29)"/>
        <path d="M32 31c9 0 21 9.5 21 18.5 0 6.5-5.5 9.5-10.5 8-4-1.2-6.5-2-10.5-2s-6.5.8-10.5 2c-5 1.5-10.5-1.5-10.5-8 0-9 12-18.5 21-18.5z"/></g>
        <g fill="#FFB8C6" opacity=".9"><ellipse cx="12.5" cy="27.5" rx="2.4" ry="3.4" transform="rotate(-24 12.5 27.5)"/><ellipse cx="24.4" cy="13.8" rx="2.6" ry="3.6"/><ellipse cx="38.4" cy="13.8" rx="2.6" ry="3.6"/><ellipse cx="49.6" cy="27.5" rx="2.4" ry="3.4" transform="rotate(24 49.6 27.5)"/></g>
        <path d="M32 50.5s-6.5-3.8-6.5-8a3.2 3.2 0 0 1 6.5-.8 3.2 3.2 0 0 1 6.5.8c0 4.2-6.5 8-6.5 8z" fill="#FFD9E0"/>`,
      cats_fish: `<defs>${G("b4ca-fs", "#9CC6F2", "#6E9FDB")}</defs>
        <path d="M44 32l15-13q3 13 0 26z" fill="#6E9FDB" ${SO}/>
        <path d="M4 32c5-13 17-19 27-19 9 0 15 7 17 19-2 12-8 19-17 19-10 0-22-6-27-19z" fill="url(#b4ca-fs)" ${SO}/>
        <path d="M28 18q7 14 0 28" fill="none" stroke="#5584C4" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M33 24l4 3M33 31l5 1M33 38l4-2.5M39 21l3 3M39 43l3-3" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${EYES(14, 22, 30, 2.4)}<ellipse cx="11" cy="36" rx="3" ry="2" fill="#FF8FA8" opacity=".75"/>${SMILE(18, 36, 2.3)}
        ${HI(20, 19, 4, 2)}
        <path d="M52 8l1.2 2.8 3 .4-2.2 2 .6 3-2.6-1.5-2.6 1.5.6-3-2.2-2 3-.4z" fill="#F2C24A" ${LN(1.2)}/>`,
      cats_meow: `<defs>${G("b4ca-mw", "#D2735A", "#A94B36")}</defs>
        <path d="M10 22L9 5l14 10zM54 22l1-17-14 10z" fill="#C4624A" ${SO}/><path d="M12 11l.5 5M52 11l-.5 5" stroke="#F79AAE" stroke-width="3" stroke-linecap="round"/>
        <path d="M14 14h36a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10H26l-10 9 1-9h-3a10 10 0 0 1-10-10V24a10 10 0 0 1 10-10z" fill="url(#b4ca-mw)" ${SO}/>
        ${T("MEOW", 38.5, 15, "#FFF6EE", 40)}
        <path d="M49 45.5l1.5 1.5 1.5-1.5M44 45.5l1.5 1.5 1.5-1.5" fill="none" stroke="#FFD9C8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`,
      cats_bowl: `<defs>${G("b4ca-bw", "#F2A0AE", "#D9667B")}</defs>
        <g fill="#C98C52" ${LN(2)}><circle cx="17" cy="33" r="5"/><circle cx="26" cy="29" r="5"/><circle cx="36" cy="28.5" r="5"/><circle cx="46" cy="32" r="5"/><circle cx="31" cy="22.5" r="4.6"/><circle cx="41" cy="24" r="4.2"/><circle cx="22" cy="23.5" r="4.2"/></g>
        <path d="M16 13.5c3-4 9-4 12 0-3 4-9 4-12 0zM28 13.5l4-3v6z" fill="#8FB8E8" ${LN(1.8)}/>
        <path d="M4 34h56l-6 20a5 5 0 0 1-5 4H15a5 5 0 0 1-5-4z" fill="url(#b4ca-bw)" ${SO}/>
        <rect x="3" y="31" width="58" height="7" rx="3.5" fill="#F7B6C2" ${SO}/>
        <g fill="#fff"><ellipse cx="32" cy="49" rx="4.4" ry="3.6"/><circle cx="26.2" cy="44.2" r="1.9"/><circle cx="30" cy="41.8" r="1.9"/><circle cx="34" cy="41.8" r="1.9"/><circle cx="37.8" cy="44.2" r="1.9"/></g>`
    }},
    pins: [
      {id: "tp-cats-kitty", name: "Kitty Magnet", kind: "badge", desc: "A glossy orange tabby face with pink ears.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("b4cp-k", "#FFD19A", "#E88A3E")}</defs><path d="M5 13L4.5 2.5l8 5zM25 13l.5-10.5-8 5z" fill="#EE9A50" stroke="#9A4E24" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.3 5.5l.3 3.8M23.7 5.5l-.3 3.8" stroke="#F79AAE" stroke-width="1.8" stroke-linecap="round"/><circle cx="15" cy="17" r="11" fill="url(#b4cp-k)" stroke="#9A4E24" stroke-width="1.1"/><path d="M15 7.5v3M11.8 8.2l.6 2.4M18.2 8.2l-.6 2.4" stroke="#C9672F" stroke-width="1.4" stroke-linecap="round"/><circle cx="11" cy="17" r="1.6" fill="${D}"/><circle cx="19" cy="17" r="1.6" fill="${D}"/><path d="M14 20h2l-1 1.2z" fill="#E8637E"/><path d="M12.8 22q1.1 1.2 2.2 0q1.1 1.2 2.2 0" fill="none" stroke="${D}" stroke-width="1" stroke-linecap="round"/><ellipse cx="9" cy="20.5" rx="2" ry="1.3" fill="#FF8FA8" opacity=".7"/><ellipse cx="21" cy="20.5" rx="2" ry="1.3" fill="#FF8FA8" opacity=".7"/><ellipse cx="10.5" cy="11" rx="3" ry="1.6" fill="#fff" opacity=".7" transform="rotate(-25 10.5 11)"/></svg>`},
      {id: "tp-cats-paws", name: "Paw Print Washi", kind: "tape", desc: "Creamy peach washi tape with a trail of little paw prints.", svg: `<svg viewBox="0 0 86 26"><path d="${TAPE}" fill="#FBE3D4" fill-opacity=".86" stroke="#D9A088" stroke-width=".8" stroke-opacity=".6"/><g fill="#C4624A" opacity=".8">${[[14, 15], [30, 10], [46, 15], [62, 10], [76, 15]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 2.2}" rx="3" ry="2.5"/><circle cx="${x - 3}" cy="${y - 1.4}" r="1.3"/><circle cx="${x - 1}" cy="${y - 2.9}" r="1.3"/><circle cx="${x + 1.3}" cy="${y - 2.9}" r="1.3"/><circle cx="${x + 3.2}" cy="${y - 1.4}" r="1.3"/>`).join("")}</g><rect x="4" y="3" width="78" height="3" fill="#fff" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-cats", name: "Catnap", desc: "Warm cream paper with a stitched border, a trail of paw prints and a tabby curled up asleep in the corner."}
  });

  /* Music Room */
  TP_DATA.push({
    theme: "music",
    pack: {name: "Recital Day", items: {
      music_piano: `<defs>${G("b4mu-pb", "#9A82F7", "#5E45BE")}</defs>
        <rect x="21" y="3" width="22" height="11" rx="1.5" fill="#fff" ${LN(2)}/><path d="M24 7h16M24 10.5h12" stroke="#B9A9EE" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="12" y="50" width="6" height="10" rx="2" fill="#4B359E" ${SO}/><rect x="46" y="50" width="6" height="10" rx="2" fill="#4B359E" ${SO}/>
        <rect x="8" y="12" width="48" height="41" rx="7" fill="url(#b4mu-pb)" ${SO}/>
        <rect x="4" y="35" width="56" height="13" rx="3" fill="#fff" ${SO}/>
        <g fill="${D}"><rect x="12.5" y="35" width="3.6" height="7.5" rx="1"/><rect x="19.5" y="35" width="3.6" height="7.5" rx="1"/><rect x="30.5" y="35" width="3.6" height="7.5" rx="1"/><rect x="37.5" y="35" width="3.6" height="7.5" rx="1"/><rect x="44.5" y="35" width="3.6" height="7.5" rx="1"/></g>
        ${EYES(25, 39, 23)}${BLUSH(19.5, 44.5, 28)}${SMILE(32, 27.5, 3)}${HI(15, 17, 3.6, 2)}`,
      music_metronome: `<defs>${G("b4mu-mt", "#6FA0F0", "#3D6AD6")}</defs>
        <path d="M24 5h16l10 53H14z" fill="url(#b4mu-mt)" ${SO}/>
        <path d="M27 11h10l6 32H21z" fill="#F4F0FF" ${LN(2)}/>
        <path d="M28 16h3M28 22h4M28 28h3M28 34h4" stroke="#B9A9EE" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M32 44L44 13" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/><path d="M36.5 23.5l6.2 2.4-2 5.2-6.2-2.4z" fill="#F2C24A" ${LN(1.8)}/>
        <rect x="11" y="52" width="42" height="7" rx="3" fill="#5E45BE" ${SO}/>
        <circle cx="32" cy="46" r="2.6" fill="#F2C24A" ${LN(1.6)}/>
        ${EYES(24, 36, 38, 2.2)}<ellipse cx="21.5" cy="42.5" rx="2.4" ry="1.6" fill="#FF8FA8" opacity=".8"/><ellipse cx="41.5" cy="42.5" rx="2.4" ry="1.6" fill="#FF8FA8" opacity=".8"/>
        <path d="M52 8q2 2 0 5M56 5q4 5 0 11" fill="none" stroke="#8C6FF5" stroke-width="2" stroke-linecap="round"/>`,
      music_violin: `<defs>${G("b4mu-vi", "#F0A866", "#C2692E")}</defs><g transform="rotate(32 32 33)">
        <rect x="29.3" y="5" width="5.4" height="22" rx="1.5" fill="#4A3148" ${SO}/>
        <circle cx="32" cy="5" r="3.8" fill="#C2692E" ${SO}/>
        <path d="M32 21c-8 0-12 3-11 9 1 3 4 4 4 7s-6 4-6 12c0 7 6 11.5 13 11.5s13-4.5 13-11.5c0-8-6-9-6-12s3-4 4-7c1-6-3-9-11-9z" fill="url(#b4mu-vi)" ${SO}/>
        <path d="M26 42q-2 3 0 6M38 42q2 3 0 6" fill="none" stroke="${D}" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="29" y="47" width="6" height="2.6" rx="1" fill="#4A3148"/><path d="M29.6 22v26M31.2 22v26M32.8 22v26M34.4 22v26" stroke="#FFF1D6" stroke-width=".7" opacity=".85"/>
        <path d="M28.5 55h7l-1 4h-5z" fill="#4A3148"/>${HI(25, 29, 3, 1.8, -50)}</g>
        <path d="M54 9.5l1 2.3 2.5.3-1.8 1.7.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#F2C24A"/>`,
      music_duet: `<defs>${G("b4mu-n1", "#A994FA", "#7258E0")}${G("b4mu-n2", "#6FA0F0", "#3D6AD6")}</defs>
        <path d="M24.5 12L54 4.5v9L24.5 21z" fill="#5E45BE" ${SO}/>
        <rect x="24.5" y="15" width="4.5" height="33" fill="#5E45BE" ${SO}/><rect x="50" y="8" width="4.5" height="34" fill="#5E45BE" ${SO}/>
        <ellipse cx="17" cy="48" rx="11" ry="8.8" transform="rotate(-18 17 48)" fill="url(#b4mu-n1)" ${SO}/>
        <ellipse cx="43" cy="43" rx="11" ry="8.8" transform="rotate(-18 43 43)" fill="url(#b4mu-n2)" ${SO}/>
        ${EYES(13, 21, 47, 2.1)}${SMILE(17, 51, 2)}<ellipse cx="10" cy="51.5" rx="2.2" ry="1.5" fill="#FF8FA8" opacity=".8"/>
        ${EYES(39, 47, 42, 2.1)}${SMILE(43, 46, 2)}<ellipse cx="50" cy="46" rx="2.2" ry="1.5" fill="#FF8FA8" opacity=".8"/>
        ${HI(12, 42, 3, 1.6)}${HI(38, 37, 3, 1.6)}`,
      music_sheet: `<defs>${G("b4mu-sh", "#FFFFFF", "#EEE8FF")}</defs>
        <path d="M5 18q13-10 27 0t27 0v28q-13 10-27 0t-27 0z" fill="url(#b4mu-sh)" ${SO}/>
        <g fill="none" stroke="#B9A9EE" stroke-width="1.6"><path d="M10 25.5q11-7 22 0t22 0"/><path d="M10 32q11-7 22 0t22 0"/><path d="M10 38.5q11-7 22 0t22 0"/></g>
        <g fill="#5E45BE"><ellipse cx="17" cy="34" rx="3.2" ry="2.5" transform="rotate(-20 17 34)"/><ellipse cx="30" cy="36" rx="3.2" ry="2.5" transform="rotate(-20 30 36)"/><ellipse cx="45" cy="27" rx="3.2" ry="2.5" transform="rotate(-20 45 27)"/></g>
        <path d="M19.8 33V22M32.8 35V24M47.8 26V15.5M32.8 24q4 1 5 5" fill="none" stroke="#5E45BE" stroke-width="2" stroke-linecap="round"/>
`,
      music_drum: `<defs>${G("b4mu-dr", "#9A82F7", "#5E45BE", 1, 0)}</defs>
        <path d="M14 4l20 22M50 4L30 26" stroke="${D}" stroke-width="5.5" stroke-linecap="round"/><path d="M14 4l20 22M50 4L30 26" stroke="#F0C58A" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="14" cy="4.5" r="3" fill="#F0C58A" ${LN(1.8)}/><circle cx="50" cy="4.5" r="3" fill="#F0C58A" ${LN(1.8)}/>
        <path d="M8 30v20c0 5 11 9 24 9s24-4 24-9V30z" fill="url(#b4mu-dr)" ${SO}/>
        <path d="M8 50c0 5 11 9 24 9s24-4 24-9" fill="none" stroke="#F2C24A" stroke-width="3"/>
        <ellipse cx="32" cy="30" rx="24" ry="8" fill="#F7F4FF" ${SO}/>
        ${EYES(25, 39, 45, 2.4)}${BLUSH(19.5, 44.5, 49.5)}${SMILE(32, 49, 2.6)}`,
      music_bravo: `<defs>${G("b4mu-bv", "#8C6FF5", "#5B4FC9")}</defs>
        <path d="M12 30H2l6 7-6 7h14zM52 30h10l-6 7 6 7H48z" fill="#3D2F96" ${SO}/>
        <rect x="8" y="22" width="48" height="22" rx="4" fill="url(#b4mu-bv)" ${SO}/>
        ${T("BRAVO", 38.5, 13.5, "#fff", 40)}
        <path d="M32 3l2.4 5 5.4.7-4 3.7 1 5.4L32 15.2l-4.8 2.6 1-5.4-4-3.7 5.4-.7z" fill="#F2C24A" ${LN(1.8)}/>
        <path d="M14 13l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3zM50 13l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#F7A8C4"/>`,
      music_heartbeat: `<defs>${G("b4mu-hb", "#FF9DBB", "#E9587F")}</defs>
        <path d="M32 58S5 42 5 23.5A13 13 0 0 1 32 17a13 13 0 0 1 27 6.5C59 42 32 58 32 58z" fill="url(#b4mu-hb)" ${SO}/>
        <path d="M9 32h9l3.5-7 5 14 4.5-11 2.5 4h5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="44" cy="36" rx="4.4" ry="3.4" transform="rotate(-20 44 36)" fill="#fff"/><path d="M47.6 35V20q3.5 1 5 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        ${HI(16, 17, 4.5, 2.4)}`
    }},
    pins: [
      {id: "tp-music-clef", name: "Treble Clef Clip", kind: "clip", desc: "A shiny gold treble clef that clips the note like a paperclip.", svg: `<svg viewBox="0 0 22 50"><defs>${G("b4mp-cf", "#FFE7A0", "#D9A21E", 1, 1)}</defs><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path id="b4mp-cfp" d="M10.5 44.5q-2.5 3.5-5.5 2-2.5-1.6-.5-4 2.5-2 4.5.5L12 7q.5-4.5 3.5-3.5 3.5 1.5-.5 9.5L5.5 24q-4 6 0 10.5 4 4 9 1.5 4.5-3 1.5-7.5-3-3.5-7-1-3 2.5-.5 5.5" stroke="#8A6512" stroke-width="4.6"/><path d="M10.5 44.5q-2.5 3.5-5.5 2-2.5-1.6-.5-4 2.5-2 4.5.5L12 7q.5-4.5 3.5-3.5 3.5 1.5-.5 9.5L5.5 24q-4 6 0 10.5 4 4 9 1.5 4.5-3 1.5-7.5-3-3.5-7-1-3 2.5-.5 5.5" stroke="url(#b4mp-cf)" stroke-width="2.6"/></g><circle cx="5.2" cy="44" r="2.2" fill="#F2C24A" stroke="#8A6512" stroke-width="1"/><path d="M13 6.5q.8-2 2-1.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`},
      {id: "tp-music-keys", name: "Piano Key Tape", kind: "tape", desc: "Lavender-edged washi tape printed with a row of piano keys.", svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="b4mp-kc"><path d="${TAPE}"/></clipPath></defs><path d="${TAPE}" fill="#FBFAFF" fill-opacity=".9"/><g clip-path="url(#b4mp-kc)"><rect x="0" y="0" width="86" height="4.5" fill="#8C6FF5" opacity=".75"/><rect x="0" y="21.5" width="86" height="5" fill="#8C6FF5" opacity=".75"/><g stroke="#B9A9EE" stroke-width=".8">${Array.from({length: 13}, (_, i) => `<path d="M${4 + i * 6.5} 4.5V21.5"/>`).join("")}</g><g fill="#2E2650" opacity=".85">${[0, 1, 3, 4, 5, 7, 8, 10, 11].map(i => `<rect x="${8.3 + i * 6.5}" y="4.5" width="3.6" height="10" rx=".8"/>`).join("")}</g></g><path d="${TAPE}" fill="none" stroke="#9E8FD8" stroke-width=".7" stroke-opacity=".6"/></svg>`}
    ],
    card: {id: "tp-music", name: "Recital Program", desc: "Soft lavender manuscript paper with a flowing staff of notes along the bottom and a gold treble clef."}
  });

  /* Reading Nook */
  TP_DATA.push({
    theme: "reading",
    pack: {name: "Bookworm Club", items: {
      reading_stack: `<defs>${G("b4re-s1", "#B85A64", "#8A3640")}${G("b4re-s2", "#6A8FD0", "#3F66AE")}${G("b4re-s3", "#E8BE56", "#C9962A")}</defs>
        <rect x="5" y="44" width="54" height="14" rx="3" fill="url(#b4re-s1)" ${SO}/><rect x="49" y="47" width="7" height="8" rx="1" fill="#FFF6E4"/><path d="M12 44v14M17 44v14" stroke="#F2C24A" stroke-width="2"/>
        <rect x="10" y="30" width="46" height="14" rx="3" fill="url(#b4re-s2)" ${SO}/><rect x="12" y="33" width="6" height="8" rx="1" fill="#FFF6E4"/>
        <rect x="7" y="16" width="44" height="14" rx="3" fill="url(#b4re-s3)" ${SO}/><rect x="42" y="19" width="6" height="8" rx="1" fill="#FFF6E4"/><path d="M13 16v14" stroke="#fff" stroke-width="2" opacity=".6"/>
        <path d="M44 29v19l3-3 3 3V29" fill="#E0463C" ${LN(1.8)}/>
        ${EYES(27, 37, 36.5, 2.1)}${SMILE(32, 39.5, 2.2)}<ellipse cx="23" cy="40" rx="2.2" ry="1.5" fill="#FF8FA8" opacity=".85"/><ellipse cx="41" cy="40" rx="2.2" ry="1.5" fill="#FF8FA8" opacity=".85"/>
        <path d="M29 12s-4.5-2.7-4.5-5.5a2.2 2.2 0 0 1 4.5-.5 2.2 2.2 0 0 1 4.5.5c0 2.8-4.5 5.5-4.5 5.5z" fill="#E86A8A" ${LN(1.6)}/>`,
      reading_worm: `<defs>${G("b4re-wc", "#58A673", "#357A4E")}</defs>
        <path d="M22 50c-2-10 0-22 8-28" fill="none" stroke="${D}" stroke-width="15" stroke-linecap="round"/><path d="M22 50c-2-10 0-22 8-28" fill="none" stroke="#A8D88E" stroke-width="10" stroke-linecap="round"/>
        <path d="M18.5 44.5h7M18.3 37h7.5M20.5 30l6.5 2.5" stroke="#86C06C" stroke-width="2" stroke-linecap="round"/>
        <circle cx="37" cy="19" r="12" fill="#A8D88E" ${SO}/>
        <g fill="#fff" fill-opacity=".45" ${LN(2)}><circle cx="32" cy="19" r="4.4"/><circle cx="43" cy="19" r="4.4"/></g><path d="M36.4 19h2.2" ${LN(2)}/>
        ${EYES(32, 43, 19, 1.9)}<path d="M35 25.5q2.5 2 5 0" fill="none" ${LN(1.8)}/><ellipse cx="29" cy="25" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".8"/>
        <path d="M34 7.5q2-4 5-2" fill="none" ${LN(2)}/>
        <path d="M4 44l28 6 28-6v10l-28 6-28-6z" fill="url(#b4re-wc)" ${SO}/>
        <path d="M6.5 42q12-4 25.5 4v6L6.5 47zM57.5 42q-12-4-25.5 4v6l25.5-5z" fill="#FFF6E4" ${LN(2)}/>`,
      reading_lamp: `<defs>${G("b4re-lg", "#FFE9A0", "rgba(255,233,160,0)")}${G("b4re-ls", "#C75A66", "#8A3640")}</defs>
        <path d="M34 26L18 58h32z" fill="url(#b4re-lg)" opacity=".85"/>
        <path d="M8 58h22" stroke="${D}" stroke-width="7" stroke-linecap="round"/><path d="M8 58h22" stroke="#C9962A" stroke-width="3" stroke-linecap="round"/>
        <path d="M13 56V20q0-12 14-13" fill="none" stroke="${D}" stroke-width="6" stroke-linecap="round"/><path d="M13 56V20q0-12 14-13" fill="none" stroke="#E0B34A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M24 7l30 5c2 6-1 14-6 16L22 18c-2-5-1-9 2-11z" fill="url(#b4re-ls)" ${SO}/>
        <ellipse cx="36" cy="23.5" rx="12.5" ry="3.6" transform="rotate(20 36 23.5)" fill="#FFE9A0" ${LN(2)}/>
        ${SHUT(32, 42, 14)}<ellipse cx="29" cy="17" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85" transform="rotate(15 29 17)"/><ellipse cx="45" cy="19.5" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85" transform="rotate(15 45 19.5)"/>
        <path d="M52 40l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4zM44 50l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z" fill="#F2C24A"/>`,
      reading_chair: `<defs>${G("b4re-ch", "#B85A64", "#86323C")}</defs>
        <rect x="14" y="52" width="5" height="8" rx="1.5" fill="#6B4226" ${SO}/><rect x="45" y="52" width="5" height="8" rx="1.5" fill="#6B4226" ${SO}/>
        <path d="M13 36V17c0-8 7-12 19-12s19 4 19 12v19z" fill="url(#b4re-ch)" ${SO}/>
        <path d="M24 10v22M32 8v24M40 10v22" stroke="#6E2A33" stroke-width="1.6" opacity=".45"/>
        <rect x="12" y="35" width="40" height="11" rx="4" fill="#C8666F" ${SO}/>
        <rect x="4" y="27" width="12" height="27" rx="6" fill="url(#b4re-ch)" ${SO}/><rect x="48" y="27" width="12" height="27" rx="6" fill="url(#b4re-ch)" ${SO}/>
        <rect x="14" y="44" width="36" height="10" rx="3" fill="#86323C" ${SO}/>
        <rect x="22" y="19" width="20" height="17" rx="6" transform="rotate(-8 32 27.5)" fill="#F2C24A" ${LN(2)}/><circle cx="32" cy="27.5" r="1.8" fill="#C9962A"/><path d="M26 23.5l3 2.5M38 23l-3 2.8M26.5 32l3-2.3M38.5 31.5l-3-2.4" stroke="#C9962A" stroke-width="1.4" stroke-linecap="round"/>`,
      reading_tea: `<defs>${G("b4re-tc", "#FFFFFF", "#F4E4E0")}</defs>
        <path d="M22 14q-3-4 0-8M30 13q-3-4 0-8" fill="none" stroke="#C9B5AE" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="30" cy="54" rx="26" ry="6" fill="#E0B34A" ${SO}/>
        <path d="M46 25h3a8 8 0 0 1 0 16h-5" fill="none" stroke="${D}" stroke-width="7.5" stroke-linecap="round"/><path d="M46 25h3a8 8 0 0 1 0 16h-5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <path d="M9 20h40v10c0 13-9 22-20 22S9 43 9 30z" fill="url(#b4re-tc)" ${SO}/>
        <path d="M9.6 27h38.8" stroke="#96404A" stroke-width="3.2"/>
        <g fill="#E86A8A"><circle cx="18" cy="37" r="2.3"/><circle cx="29" cy="41" r="2.3"/><circle cx="40" cy="37" r="2.3"/></g><g fill="#6FA86F"><circle cx="21" cy="36" r="1.2"/><circle cx="32" cy="40" r="1.2"/><circle cx="43" cy="36" r="1.2"/></g>
        <path d="M38 20q3 6 6 11" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M38 20q3 6 6 11" fill="none" stroke="#8A7A70" stroke-width="1" stroke-dasharray="1.6 1"/>
        <rect x="41" y="30" width="9" height="10" rx="1.5" fill="#F2C24A" ${LN(1.8)}/><path d="M45.5 37.5s-2.4-1.4-2.4-2.9a1.2 1.2 0 0 1 2.4-.3 1.2 1.2 0 0 1 2.4.3c0 1.5-2.4 2.9-2.4 2.9z" fill="#96404A"/>
        <ellipse cx="29" cy="20" rx="20" ry="2.4" fill="#9A5A3A" opacity=".8"/>`,
      reading_chapter: `<defs>${G("b4re-cp", "#A34652", "#7A2E38")}</defs>
        <path d="M8 10h48a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="url(#b4re-cp)" ${SO}/>
        <rect x="8.5" y="14.5" width="47" height="35" rx="2.5" fill="none" stroke="#F2C24A" stroke-width="1.6"/>
        ${T("NEW", 29.5, 11, "#F7D77A", 24)}${T("CHAPTER", 43, 10, "#FFF6E4", 42)}
        <path d="M22 34h20" stroke="#F2C24A" stroke-width="1.4" stroke-linecap="round"/><circle cx="32" cy="34" r="1.8" fill="#F2C24A"/>
        <path d="M10 5.5l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3L5.7 8l2.3-.3zM54 52.5l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#F2C24A" ${LN(1.2)}/>`,
      reading_glasses: `<defs>${G("b4re-gl", "#E3F1FF", "#B8D6F2")}</defs>
        <path d="M4 26q-1-10 7-12M60 26q1-10-7-12" fill="none" stroke="${D}" stroke-width="6" stroke-linecap="round"/><path d="M4 26q-1-10 7-12M60 26q1-10-7-12" fill="none" stroke="#C9962A" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="18" cy="34" r="13" fill="url(#b4re-gl)" stroke="${D}" stroke-width="7.5"/><circle cx="46" cy="34" r="13" fill="url(#b4re-gl)" stroke="${D}" stroke-width="7.5"/>
        <circle cx="18" cy="34" r="13" fill="none" stroke="#C9962A" stroke-width="3.2"/><circle cx="46" cy="34" r="13" fill="none" stroke="#C9962A" stroke-width="3.2"/>
        <path d="M28 30q4-4 8 0" fill="none" stroke="${D}" stroke-width="6" stroke-linecap="round"/><path d="M28 30q4-4 8 0" fill="none" stroke="#C9962A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M11 29q3-4 7-4M39 29q3-4 7-4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M12 38.5q6 4 12 0M40 38.5q6 4 12 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
      reading_nurse: `<defs>${G("b4re-nb", "#6FB88A", "#3E8A5A")}</defs>
        <path d="M14 6h36a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H14z" fill="#FFF6E4" ${SO}/>
        <path d="M50 12v42M53 14v38" stroke="#E4D3B6" stroke-width="1.4"/>
        <path d="M10 6h37a3 3 0 0 1 3 3v46a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="url(#b4re-nb)" ${SO}/>
        <path d="M13 6v52" stroke="#2F6B45" stroke-width="2"/>
        <path d="M23 23C16 27 15 37 29 47C43 37 42 27 35 23" fill="none" stroke="#FFF6E4" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M29 47v4" stroke="#FFF6E4" stroke-width="3.2" stroke-linecap="round"/><circle cx="29" cy="53" r="3.4" fill="#F2C24A" ${LN(1.8)}/>
        <circle cx="23" cy="22.5" r="2.6" fill="#FFF6E4"/><circle cx="35" cy="22.5" r="2.6" fill="#FFF6E4"/>
        ${EYES(24, 34, 13.5, 1.9)}${SMILE(29, 15.2, 1.8)}
        ${HI(16, 12, 2.4, 1.4, -60, .45)}`
    }},
    pins: [
      {id: "tp-reading-seal", name: "Wax Seal", kind: "badge", desc: "A glossy burgundy wax seal pressed with a tiny open book.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("b4rp-s", "#D0606C", "#7A2530")}</defs><path d="M15 2.5c2.2 0 3 1.4 4.8 1.6 2 .3 3.6-.4 4.9 1.1 1.2 1.4.4 3.1 1.2 4.9.8 1.7 2.3 2.6 2.1 4.6-.2 2-1.9 2.6-2.4 4.4-.5 1.9.5 3.4-.8 5-1.3 1.5-3.1.9-4.9 1.8-1.8.9-2.5 2.5-4.9 2.5s-3-1.6-4.9-2.4c-1.8-.8-3.6-.2-4.9-1.8-1.3-1.5-.3-3.2-.8-5-.5-1.8-2.2-2.5-2.4-4.5s1.3-2.9 2.1-4.6c.8-1.8 0-3.5 1.2-4.9 1.3-1.5 3-.8 4.9-1.1 1.8-.3 2.6-1.6 4.8-1.6z" fill="url(#b4rp-s)" stroke="#5E1C25" stroke-width="1.1"/><circle cx="15" cy="15.5" r="7.6" fill="none" stroke="#5E1C25" stroke-width="1" opacity=".55"/><circle cx="15" cy="15.5" r="7.6" fill="none" stroke="#F09AA2" stroke-width=".7" opacity=".5" transform="translate(.5 .6)"/><path d="M8.8 13.2q3.1-1.4 6.2.6 3.1-2 6.2-.6v6q-3.1-1.2-6.2.6-3.1-1.8-6.2-.6z" fill="#F4B6BC" stroke="#5E1C25" stroke-width=".9" stroke-linejoin="round"/><path d="M15 13.8v6" stroke="#5E1C25" stroke-width=".9"/><ellipse cx="9.5" cy="7.5" rx="3.2" ry="1.6" fill="#fff" opacity=".6" transform="rotate(-30 9.5 7.5)"/></svg>`},
      {id: "tp-reading-ribbon", name: "Bookmark Ribbon", kind: "tape", desc: "A satin bookmark ribbon in deep burgundy with gold stitching and swallowtail ends.", svg: `<svg viewBox="0 0 86 26"><defs>${G("b4rp-r", "#B84A58", "#86303C")}</defs><path d="M1 4h84l-6 9 6 9H1l6-9z" fill="url(#b4rp-r)" fill-opacity=".92" stroke="#5E1C25" stroke-width=".9" stroke-linejoin="round"/><path d="M8 7.2h70M8 18.8h70" stroke="#F2C24A" stroke-width="1" stroke-dasharray="2.4 1.8" opacity=".95"/><path d="M6 9.5h74" stroke="#fff" stroke-width="1.4" opacity=".25"/><path d="M43 16.6s-3-1.8-3-3.6a1.5 1.5 0 0 1 3-.4 1.5 1.5 0 0 1 3 .4c0 1.8-3 3.6-3 3.6z" fill="#F2C24A"/></svg>`}
    ],
    card: {id: "tp-reading", name: "Book Page", desc: "A warm, well-loved book page with a double-ruled frame, a fleuron and a burgundy ribbon bookmark."}
  });

  /* Knitting Nook */
  const WOOL = (pts, fill) => `<g fill="${D}" stroke="${D}" stroke-width="5">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g><g fill="${fill}">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
  TP_DATA.push({
    theme: "knitting",
    pack: {name: "Cozy Stitches", items: {
      knitting_yarn: `<defs>${G("b4kn-yb", "#9FCC9E", "#5E9467")}<clipPath id="b4kn-yc"><circle cx="30" cy="36" r="22"/></clipPath></defs>
        <path d="M8 6l44 44" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M8 6l44 44" stroke="#E8B77E" stroke-width="3" stroke-linecap="round"/>
        <path d="M58 8L18 52" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M58 8L18 52" stroke="#E8B77E" stroke-width="3" stroke-linecap="round"/>
        <circle cx="30" cy="36" r="22" fill="url(#b4kn-yb)"/>
        <g clip-path="url(#b4kn-yc)" fill="none" stroke="#447A50" stroke-width="2.2" opacity=".75"><path d="M6 26q24-8 48 8M6 50q24-14 48-10M16 14q-8 22 8 46M44 12q10 24-6 48"/></g>
        <circle cx="30" cy="36" r="22" fill="none" ${SO}/>
        <path d="M8 6l6 6" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M58 8l-5.5 6" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/>
        <circle cx="7" cy="5" r="4.2" fill="#E07A8A" ${LN(2)}/><circle cx="58.5" cy="7.5" r="4.2" fill="#8FB8E8" ${LN(2)}/>
        <path d="M8 6l6 6M58 8l-5.5 6" stroke="#E8B77E" stroke-width="3" stroke-linecap="round"/>
        <path d="M50 51q8 2 7 9" fill="none" stroke="#5E9467" stroke-width="2.8" stroke-linecap="round"/>
        ${EYES(24, 36, 38)}${BLUSH(19, 41, 43)}${SMILE(30, 42.5, 2.6)}${HI(19, 25, 4, 2.2)}`,
      knitting_sheep: `${WOOL([[20, 26, 9], [32, 21, 10], [44, 26, 9], [49, 37, 8.5], [43, 47, 9], [30, 49, 9.5], [17, 45, 9], [14, 35, 8.5], [32, 35, 14]], "#FFF8EE")}
        <path d="M22 54v6M42 54v6" stroke="${D}" stroke-width="5" stroke-linecap="round"/>
        <path d="M12 38q-7-1-8 4 5 2 9-1zM52 38q7-1 8 4-5 2-9-1z" fill="#6B5A5E" ${LN(2)}/>
        <ellipse cx="32" cy="38" rx="12" ry="10.5" fill="#6B5A5E" ${SO}/>
        <g fill="#FFF8EE" ${LN(2)}><circle cx="27" cy="27.5" r="4"/><circle cx="32.5" cy="25.5" r="4.4"/><circle cx="38" cy="27.5" r="4"/></g>
        <circle cx="27.5" cy="37" r="2.3" fill="#fff"/><circle cx="36.5" cy="37" r="2.3" fill="#fff"/><circle cx="27.8" cy="37.3" r="1.4" fill="${D}"/><circle cx="36.8" cy="37.3" r="1.4" fill="${D}"/>
        <ellipse cx="24" cy="42.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/><ellipse cx="40" cy="42.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/><path d="M30 43q2 1.6 4 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
      knitting_scarf: `<defs>${G("b4kn-sc", "#F29AA8", "#D9667B")}</defs>
        <path d="M11 13q21 26 42 0" fill="none" stroke="${D}" stroke-width="16" stroke-linecap="round"/><path d="M11 13q21 26 42 0" fill="none" stroke="#E8808F" stroke-width="10.5" stroke-linecap="round"/>
        <path d="M17 17.5l3-2.5M26 23l2-3.4M38 23l-2-3.4M47 17.5l-3-2.5" stroke="#FFF1E8" stroke-width="2.4" stroke-linecap="round"/>
        <g transform="rotate(10 27 40)"><rect x="20" y="28" width="13" height="24" rx="2" fill="url(#b4kn-sc)" ${SO}/><path d="M20.5 36h12M20.5 43h12" stroke="#FFF1E8" stroke-width="3"/><path d="M22 52v5M26.5 52v6M31 52v5" stroke="#D9667B" stroke-width="2.4" stroke-linecap="round"/></g>
        <g transform="rotate(-14 39 38)"><rect x="33" y="28" width="13" height="20" rx="2" fill="url(#b4kn-sc)" ${SO}/><path d="M33.5 35h12M33.5 42h12" stroke="#FFF1E8" stroke-width="3"/><path d="M35 48v5M39.5 48v6M44 48v5" stroke="#D9667B" stroke-width="2.4" stroke-linecap="round"/></g>
        <rect x="24" y="22" width="17" height="11" rx="5" fill="#E8808F" ${SO}/><path d="M28 25.5l1.6 2 1.6-2M33.5 25.5l1.6 2 1.6-2" fill="none" stroke="#FFF1E8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        ${HI(14, 12, 3, 1.6, -40)}`,
      knitting_sweater: `<defs>${G("b4kn-sw", "#A9CBF0", "#6E9FDB")}</defs>
        <path d="M22 7h20l14 9 5 28-9 2-4-17v29H16V29l-4 17-9-2 5-28z" fill="url(#b4kn-sw)" ${SO}/>
        <path d="M22 7q10 9 20 0" fill="#fff" ${LN(2)}/>
        <path d="M17 51h30M8 41l9 1.7M56 41l-9 1.7" stroke="#fff" stroke-width="2.2" stroke-dasharray="2 2.4"/>
        <path d="M32 40s-7.5-4.5-7.5-9.4a3.7 3.7 0 0 1 7.5-.9 3.7 3.7 0 0 1 7.5.9c0 4.9-7.5 9.4-7.5 9.4z" fill="#E07A8A" ${LN(2)}/>
        <path d="M22 17l2 2 2-2M38 17l2 2 2-2M22 24l2 2 2-2M38 24l2 2 2-2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`,
      knitting_teacosy: `<defs>${G("b4kn-tc", "#D9B6F2", "#A77FD6")}</defs>
        <path d="M49 38q10-2 11-12" fill="none" stroke="${D}" stroke-width="7" stroke-linecap="round"/><path d="M49 38q10-2 11-12" fill="none" stroke="#F4F1E8" stroke-width="3" stroke-linecap="round"/>
        <path d="M14 50C4 48 1 36 3 27l6 .5c0 6 2 11 8 14z" fill="#F4F1E8" ${SO}/>
        <rect x="11" y="44" width="42" height="14" rx="6" fill="#F4F1E8" ${SO}/>
        <path d="M9 48c0-19 10-32 23-32s23 13 23 32z" fill="url(#b4kn-tc)" ${SO}/>
        <path d="M9.5 42h45" stroke="#7E58B0" stroke-width="2"/><path d="M14 45.5h36" stroke="#fff" stroke-width="2" stroke-dasharray="2.4 2.4" opacity=".7"/>
        <path d="M20 29q6 3 12 0t12 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
        ${WOOL([[32, 11, 5], [27, 8, 4], [37, 8, 4], [32, 5, 4]], "#E07A8A")}
        ${EYES(26, 38, 36, 2.3)}${BLUSH(21, 43, 40.5)}${SMILE(32, 39.8, 2.2)}`,
      knitting_basket: `<defs>${G("b4kn-bk", "#E3B27A", "#B8814A")}</defs>
        <path d="M9 34q23-40 46 0" fill="none" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M9 34q23-40 46 0" fill="none" stroke="#D29A5E" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="20" cy="26" r="10" fill="#E07A8A" ${SO}/><path d="M12 23q8-3 15 2M14 31q7-5 14-1" fill="none" stroke="#B94860" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="44" cy="26" r="10" fill="#8FB8E8" ${SO}/><path d="M37 21q5 5 3 13M44 17q6 6 4 16" fill="none" stroke="#5584C4" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="32" cy="21" r="9.5" fill="#F2C24A" ${SO}/><path d="M25 19q7-4 14 1M26 25q6-3 12 0" fill="none" stroke="#C9962A" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M5 34h54l-5 22a4 4 0 0 1-4 3H14a4 4 0 0 1-4-3z" fill="url(#b4kn-bk)" ${SO}/>
        <path d="M8 43h48M10 51h44" stroke="#8C5E30" stroke-width="1.8"/>
        <path d="M14 36l2 6M22 36l2 6M30 36l2 6M38 36l2 6M46 36l2 6M16 45l2 5M24 45l2 5M32 45l2 5M40 45l2 5M48 45l1.6 5" stroke="#F2D2A6" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="3" y="31" width="58" height="6" rx="3" fill="#C98C52" ${SO}/>`,
      knitting_purlfect: `<defs>${G("b4kn-tg", "#6FA578", "#4E7F58")}</defs>
        <path d="M14 10h40a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H14L4 42V22z" fill="url(#b4kn-tg)" ${SO}/>
        <circle cx="12" cy="32" r="3" fill="#FFF8EE" ${LN(2)}/>
        <path d="M11 32C4 32 2 22 6 16" fill="none" stroke="#E07A8A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M18 15h37v34H18" fill="none" stroke="#FFF8EE" stroke-width="1.5" stroke-dasharray="2.6 2.2" opacity=".85"/>
        ${T("PURL", 30, 13, "#fff", 28, 36.5)}${T("FECT!", 44.5, 13, "#fff", 30, 36.5)}
        <path d="M54 7.5s-3.4-2-3.4-4.2a1.7 1.7 0 0 1 3.4-.4 1.7 1.7 0 0 1 3.4.4c0 2.2-3.4 4.2-3.4 4.2z" fill="#E07A8A" ${LN(1.4)}/>`,
      knitting_socks: `<defs>${G("b4kn-sk", "#DDBDF5", "#A77FD6")}</defs>
        <path d="M16 12h22v25l10 7c6 4 4 14-4 14H27c-7 0-12-5-12-12z" fill="url(#b4kn-sk)" ${SO}/>
        <path d="M15.5 44c0-5 4-8 9-7 2 5-1 10-6 12" fill="#E07A8A"/><path d="M44 43.5c5 1 7 6 4 10.5-3 1-6-2-7-5z" fill="#E07A8A"/>
        <path d="M16 12h22v25l10 7c6 4 4 14-4 14H27c-7 0-12-5-12-12z" fill="none" ${SO}/>
        <path d="M16.5 30h21" stroke="#fff" stroke-width="3" opacity=".75"/>
        <rect x="13" y="4" width="28" height="11" rx="3" fill="#6FA578" ${SO}/>
        <path d="M18 7v5M22.5 7v5M27 7v5M31.5 7v5M36 7v5" stroke="#447A50" stroke-width="1.8" stroke-linecap="round"/>
        ${EYES(22, 32, 22, 2.2)}${SMILE(27, 25.5, 2)}<ellipse cx="18.5" cy="26" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/><ellipse cx="35.5" cy="26" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/>
        <path d="M54 22s-4-2.4-4-5a2 2 0 0 1 4-.4 2 2 0 0 1 4 .4c0 2.6-4 5-4 5z" fill="#E07A8A" ${LN(1.4)}/>`
    }},
    pins: [
      {id: "tp-knitting-button", name: "Wooden Button", kind: "badge", desc: "A round wooden sewing button stitched on with pink thread.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("b4kp-b", "#F0CB98", "#B8814A")}</defs><circle cx="15" cy="15" r="12.5" fill="url(#b4kp-b)" stroke="#7A5024" stroke-width="1.1"/><circle cx="15" cy="15" r="9" fill="none" stroke="#8C5E30" stroke-width=".9" opacity=".6"/><path d="M9 11q3 1 5 0M16 20q3-1 5 1" stroke="#A06E3A" stroke-width=".7" fill="none" opacity=".55"/><g fill="#5E3A18"><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="12" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></g><path d="M12 12l6 6M18 12l-6 6" stroke="#E86A8A" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="9.5" cy="8.5" rx="3.4" ry="1.7" fill="#fff" opacity=".55" transform="rotate(-35 9.5 8.5)"/></svg>`},
      {id: "tp-knitting-stitch", name: "Knit Stitch Tape", kind: "tape", desc: "Sage green washi tape printed with rows of knit stitches.", svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="b4kp-kc"><path d="${TAPE}"/></clipPath></defs><path d="${TAPE}" fill="#9CC4A0" fill-opacity=".82"/><g clip-path="url(#b4kp-kc)" fill="none" stroke="#F6F8EE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".85">${[5.5, 12, 18.5].map((y, r) => Array.from({length: 14}, (_, i) => `<path d="M${(r % 2 ? 3 : 0) + i * 6.4} ${y}l2.6 3.4 2.6-3.4"/>`).join("")).join("")}</g><path d="${TAPE}" fill="none" stroke="#5E9467" stroke-width=".7" stroke-opacity=".6"/></svg>`}
    ],
    card: {id: "tp-knitting", name: "Knit Swatch", desc: "A cream card framed by a hand-knit sage border of little V stitches."}
  });

  /* Art Studio */
  TP_DATA.push({
    theme: "painting",
    pack: {name: "Paint Party", items: {
      painting_palette: `<defs>${G("b4pa-pl", "#F8E6C6", "#E6C28E")}</defs>
        <path d="M32 6C15 6 4 17 4 31c0 15 12 27 29 27 8 0 11-4 9-8-2-5 1-8 6-8 7 0 12-4 12-12C60 17 48 6 32 6z" fill="url(#b4pa-pl)" ${SO}/>
        <ellipse cx="46" cy="40" rx="4.4" ry="3.6" fill="#fff" ${LN(2)}/>
        <g ${LN(2)}><circle cx="15" cy="23" r="5" fill="#E0463C"/><circle cx="27" cy="15" r="5" fill="#F2C24A"/><circle cx="41" cy="15" r="5" fill="#2E9E5B"/><circle cx="51" cy="25" r="5" fill="#3D7BE0"/><circle cx="14" cy="37" r="5" fill="#A45CD6"/></g>
        ${HI(13.5, 21.5, 1.8, 1.1)}${HI(25.5, 13.5, 1.8, 1.1)}${HI(39.5, 13.5, 1.8, 1.1)}${HI(49.5, 23.5, 1.8, 1.1)}${HI(12.5, 35.5, 1.8, 1.1)}
        ${EYES(26, 36, 33, 2.3)}${SMILE(31, 37, 2.3)}<ellipse cx="22" cy="38" rx="2.4" ry="1.6" fill="#FF8FA8" opacity=".85"/><ellipse cx="40" cy="38" rx="2.4" ry="1.6" fill="#FF8FA8" opacity=".85"/>`,
      painting_brush: `<defs>${G("b4pa-bh", "#5B8FDB", "#2F66B8", 1, 0)}</defs>
        <path d="M14 46c-5 1-9 5-9 11 5 0 9-2 11-6" fill="#E0463C" ${SO}/>
        <g transform="rotate(-45 32 32)">
          <rect x="27" y="-4" width="10" height="32" rx="5" fill="url(#b4pa-bh)" ${SO}/>
          <rect x="26" y="27" width="12" height="11" rx="1.5" fill="#D6DAE4" ${SO}/><path d="M26.5 31h11" stroke="#9AA2B4" stroke-width="1.6"/>
          <path d="M26.5 38h11c1 9-2 17-5.5 22-3.5-5-6.5-13-5.5-22z" fill="#E8C48A" ${SO}/>
          <path d="M27 47h10c-.6 5-2.6 9.5-5 13-2.4-3.5-4.4-8-5-13z" fill="#E0463C"/>
          <path d="M26.5 38h11c1 9-2 17-5.5 22-3.5-5-6.5-13-5.5-22z" fill="none" ${SO}/>
          ${HI(30, 5, 1.4, 5, 0, .5)}
        </g>
        <circle cx="10" cy="44" r="2.2" fill="#E0463C" ${LN(1.4)}/><circle cx="19" cy="57" r="1.8" fill="#E0463C" ${LN(1.4)}/>
        <path d="M46 44l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z" fill="#F2C24A" ${LN(1.2)}/>`,
      painting_tube: `<defs>${G("b4pa-tb", "#FFFFFF", "#DCE0EA")}</defs>
        <path d="M10 18c4-6 14-8 20-3 5 4 4 10 10 11" fill="none" stroke="${D}" stroke-width="10" stroke-linecap="round"/><path d="M10 18c4-6 14-8 20-3 5 4 4 10 10 11" fill="none" stroke="#3D7BE0" stroke-width="5.5" stroke-linecap="round"/>
        <g transform="rotate(-35 40 40)">
          <path d="M22 32h26l8-3v22l-8-3H22z" fill="url(#b4pa-tb)" ${SO}/>
          <path d="M22 35h26v10H22z" fill="#3D7BE0"/>
          <path d="M22 32h26l8-3v22l-8-3H22z" fill="none" ${SO}/>
          <rect x="54" y="27" width="6" height="26" rx="1.5" fill="#D6DAE4" ${SO}/><path d="M56 30v20" stroke="#9AA2B4" stroke-width="1.4"/>
          <rect x="12" y="34" width="10" height="12" rx="2" fill="${D}" ${LN(2)}/><rect x="13.5" y="35.5" width="3" height="9" rx="1" fill="#6B6480"/>
        </g>
        ${EYES(33, 42, 42, 2.1)}${SMILE(38.5, 46.5, 2)}`,
      painting_easel: `<defs>${G("b4pa-sk", "#BFE0FF", "#EAF4FF")}</defs>
        <path d="M32 4L10 60M32 4l22 56M32 20v36" stroke="${D}" stroke-width="6" stroke-linecap="round"/><path d="M32 4L10 60M32 4l22 56M32 20v36" stroke="#D29A5E" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="11" y="9" width="42" height="33" rx="2" fill="url(#b4pa-sk)" ${SO}/>
        <path d="M12.5 33q10-10 20-4t19-2V40.5h-39z" fill="#6CC08A"/><path d="M12.5 36q14-6 39-1v5.5h-39z" fill="#2E9E5B"/>
        <circle cx="42" cy="18" r="5" fill="#F2C24A"/><path d="M18 17q3-2 6 0M22 21q2.4-1.6 4.8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        <rect x="11" y="9" width="42" height="33" rx="2" fill="none" ${SO}/>
        <rect x="7" y="42" width="50" height="5" rx="2" fill="#B8814A" ${SO}/>
        <circle cx="47" cy="40" r="2.4" fill="#E0463C" ${LN(1.4)}/>`,
      painting_jar: `<defs>${G("b4pa-jr", "#E6F2FF", "#B6D4F4")}</defs>
        <path d="M18 30L10 4" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M18 30L10 4" stroke="#F2C24A" stroke-width="3" stroke-linecap="round"/>
        <path d="M32 30V2" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M32 30V2" stroke="#E0463C" stroke-width="3" stroke-linecap="round"/>
        <path d="M46 30l8-24" stroke="${D}" stroke-width="6.5" stroke-linecap="round"/><path d="M46 30l8-24" stroke="#2E9E5B" stroke-width="3" stroke-linecap="round"/>
        <path d="M10 22h44v28c0 5-4 9-9 9H19c-5 0-9-4-9-9z" fill="url(#b4pa-jr)" ${SO}/>
        <path d="M11.3 34q10-3 21 0t20.4 0V50c0 4.4-3.4 7.7-7.7 7.7H19c-4.4 0-7.7-3.3-7.7-7.7z" fill="#8FA8F0" opacity=".75"/>
        <rect x="8" y="18" width="48" height="7" rx="3" fill="#E6F2FF" ${SO}/>
        ${EYES(26, 38, 44, 2.3)}${BLUSH(21, 43, 48.5)}${SMILE(32, 48, 2.2)}
        <path d="M15 29v14" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
      painting_beret: `<defs>${G("b4pa-dp", "#FFB36B", "#F28A3A")}</defs>
        <path d="M32 14C22 26 12 36 12 45a20 20 0 0 0 40 0c0-9-10-19-20-31z" fill="url(#b4pa-dp)" ${SO}/>
        <path d="M13 24c-2-8 8-15 20-15s22 5 20 12c-1 4-10 6-20 6S14 28 13 24z" fill="#E0463C" ${SO}/>
        <path d="M33 9V4" ${LN(3)}/>
        <path d="M17 22q15 5 32-1" fill="none" stroke="#B8302A" stroke-width="2" stroke-linecap="round"/>
        ${EYES(26, 38, 42)}${BLUSH(20, 44, 47)}${SMILE(32, 47, 2.6)}${HI(20, 36, 2.4, 4.2, 20)}
        <path d="M52 52q4 3 2 7" fill="none" stroke="#F28A3A" stroke-width="2.6" stroke-linecap="round"/>`,
      painting_masterpiece: `<defs>${G("b4pa-fr", "#FFE08A", "#D9A21E", 1, 1)}</defs>
        <rect x="3" y="8" width="58" height="48" rx="4" fill="url(#b4pa-fr)" ${SO}/>
        <rect x="9.5" y="14.5" width="45" height="35" rx="1.5" fill="#FFF8EA" ${LN(2)}/>
        <g fill="#C08A10"><circle cx="6.5" cy="11.5" r="1.8"/><circle cx="57.5" cy="11.5" r="1.8"/><circle cx="6.5" cy="52.5" r="1.8"/><circle cx="57.5" cy="52.5" r="1.8"/></g>
        ${T("MASTER", 30.5, 9.5, "#2F66B8", 38)}${T("PIECE", 43.5, 12, "#E0463C", 34)}
        <path d="M32 4.5l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill="#fff" ${LN(1.2)}/>`,
      painting_sketch: `<defs>${G("b4pa-sb", "#FFFFFF", "#F1ECE2")}</defs>
        <rect x="7" y="9" width="46" height="50" rx="3" fill="#2F66B8" ${SO}/>
        <rect x="10" y="10" width="44" height="46" rx="2" fill="url(#b4pa-sb)" ${SO}/>
        <g fill="none" stroke="${D}" stroke-width="2.2" stroke-linecap="round">${[16, 23, 30, 37, 44].map(x => `<path d="M${x} 13V6.5a2.4 2.4 0 0 1 4.8 0V13"/>`).join("")}</g>
        <path d="M31 46s-11-6.5-11-13.3a5.4 5.4 0 0 1 11-1.3 5.4 5.4 0 0 1 11 1.3C42 39.5 31 46 31 46z" fill="#FF9DBB" stroke="#E0463C" stroke-width="2" stroke-linejoin="round"/>
        <path d="M18 24l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3zM45 44l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z" fill="#F2C24A"/>
        <path d="M44 22q3-3 6 0" fill="none" stroke="#3D7BE0" stroke-width="2" stroke-linecap="round"/>
        <g transform="translate(-4 2) rotate(35 54 38)"><rect x="51" y="20" width="6" height="28" rx="1.2" fill="#F2C24A" ${LN(2)}/><path d="M51 48h6l-3 7z" fill="#F5D7A8" ${LN(2)}/><path d="M53.2 52.5h1.6l-.8 2.5z" fill="${D}"/><rect x="51" y="17" width="6" height="4" rx="1.2" fill="#FF8FA8" ${LN(2)}/></g>`
    }},
    pins: [
      {id: "tp-painting-splat", name: "Paint Splat Pin", kind: "badge", desc: "A glossy cobalt blue splat of paint with a few flying drops.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("b4pp-s", "#8FB6FF", "#2F66B8")}</defs><path d="M14 4c4-1 6 2 8 3.5 3 1 6 2 5.5 5.5-.3 2.2-2 2.8-1.5 5 .5 2.5 2.5 3.5 1 5.5-1.6 2-4 .5-6 1.5-2.2 1-2.5 3.5-5.5 3.5-3.4 0-3.6-2.8-6-3.8-2.3-1-5.5.4-6.5-2.2-.9-2.4 1.8-3.2 1.8-5.5S2 14.2 3.2 11.4C4.4 8.6 7.4 9.8 9 8c1.4-1.6 1.6-3.4 5-4z" fill="url(#b4pp-s)" stroke="#1C3F7A" stroke-width="1.1" stroke-linejoin="round"/><circle cx="4" cy="6" r="1.6" fill="#3D7BE0" stroke="#1C3F7A" stroke-width=".8"/><circle cx="26.5" cy="26" r="1.3" fill="#3D7BE0" stroke="#1C3F7A" stroke-width=".8"/><circle cx="12" cy="16" r="1.4" fill="#fff"/><circle cx="18" cy="16" r="1.4" fill="#fff"/><path d="M13.6 19q1.4 1.2 2.8 0" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/><ellipse cx="11" cy="10.5" rx="3" ry="1.5" fill="#fff" opacity=".65" transform="rotate(-30 11 10.5)"/></svg>`},
      {id: "tp-painting-brushclip", name: "Paintbrush Clip", kind: "clip", desc: "A little paintbrush clip with a sunny yellow handle and a red-dipped tip.", svg: `<svg viewBox="0 0 22 50"><defs>${G("b4pp-h", "#FFE08A", "#E8AE2E", 1, 0)}</defs><rect x="7" y="2" width="8" height="26" rx="4" fill="url(#b4pp-h)" stroke="#8A6512" stroke-width="1.1"/><rect x="6.5" y="27" width="9" height="8" rx="1" fill="#DCE0EA" stroke="#5E6478" stroke-width="1.1"/><path d="M7 30.5h8" stroke="#9AA2B4" stroke-width="1"/><path d="M7 35h8c.8 6-1.2 10.5-4 13.5-2.8-3-4.8-7.5-4-13.5z" fill="#E8C48A" stroke="#6B4A22" stroke-width="1.1" stroke-linejoin="round"/><path d="M7.3 41h7.4c-.6 3.2-1.8 5.6-3.7 7.5-1.9-1.9-3.1-4.3-3.7-7.5z" fill="#E0463C"/><path d="M9.3 5v18" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".6"/><circle cx="17.5" cy="46" r="1.4" fill="#E0463C"/></svg>`}
    ],
    card: {id: "tp-painting", name: "Watercolor Wash", desc: "Soft cold-press paper with blooming watercolor washes in the corners and a few painted dots."}
  });

  /* Bake Shop */
  const SPR = (list) => list.map(([x, y, r, c]) => `<rect x="${x - 2.4}" y="${y - 1}" width="4.8" height="2" rx="1" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join("");
  TP_DATA.push({
    theme: "baking",
    pack: {name: "Fresh From the Oven", items: {
      baking_cupcake: `<defs>${G("b4ba-cw", "#E27490", "#BF4D66")}</defs>
        <path d="M11 34h42l-5 23a3 3 0 0 1-3 2.4H19a3 3 0 0 1-3-2.4z" fill="url(#b4ba-cw)" ${SO}/>
        <path d="M21 35l2 24M32 35v24M43 35l-2 24" stroke="#F7A8C4" stroke-width="2" opacity=".8"/>
        <path d="M9 35c-4 0-5-7 0-9-2-6 4-10 9-8 1-6 9-9 14-5 5-4 13-1 14 5 5-2 11 2 9 8 5 2 4 9 0 9z" fill="#FFD2E0" ${SO}/>
        <path d="M16 26q7 3 14 0M34 20q6 3 12 0" fill="none" stroke="#F7A8C4" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M32 12q1-6 5-8" fill="none" ${LN(2)}/><circle cx="31" cy="11" r="5" fill="#E0304C" ${SO}/>${HI(29.5, 9.5, 1.6, 1)}
        ${SPR([[18, 31, 30, "#8EE4B8"], [44, 30, -30, "#6FD3FF"], [25, 22, -20, "#FFD86B"], [40, 25, 60, "#C9A0FF"]])}
        ${EYES(26, 38, 45, 2.3)}${BLUSH(21, 43, 49.5)}${SMILE(32, 49, 2.3)}`,
      baking_eclair: `<defs>${G("b4ba-ec", "#F7CF86", "#D99A48")}</defs>
        <rect x="4" y="24" width="56" height="24" rx="12" fill="url(#b4ba-ec)" ${SO}/>
        <path d="M5 33c0-6 5-9 11-9h32c6 0 11 3 11 9-3 3-5-1-8 2s-5-2-8 1-5-1-8 2-5-2-8 1-5-2-8 1-5-1-7-1-5 0-7-2z" fill="#6B3A2A"/>
        <rect x="4" y="24" width="56" height="24" rx="12" fill="none" ${SO}/>
        <path d="M14 29l6-3M26 30l7-4M40 30l6-3" stroke="#F7D0DE" stroke-width="2" stroke-linecap="round"/>
        ${EYES(27, 37, 41, 2.1)}${SMILE(32, 43.8, 2)}<ellipse cx="22.5" cy="44" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/><ellipse cx="41.5" cy="44" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".85"/>
        ${HI(12, 28, 2.8, 1.5, -30, .45)}
        <path d="M50 12l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3zM12 10l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z" fill="#F7A8C4" ${LN(1.1)}/>`,
      baking_macarons: `${[[42, "#C9A0E8", "#A77FD6"], [30, "#9FD8C4", "#63B79C"], [18, "#F7A8C4", "#E27490"]].map(([y, c, d], i) => `<g transform="translate(${[4, -3, 2][i]} 0)"><ellipse cx="32" cy="${y + 4}" rx="20" ry="6.5" fill="${d}" ${SO}/><rect x="14" y="${y - 1.5}" width="36" height="5" rx="2.5" fill="#FFF6EE" ${LN(2)}/><ellipse cx="32" cy="${y - 3}" rx="20" ry="6.5" fill="${c}" ${SO}/>${HI(25, y - 5, 5, 1.6, -5)}</g>`).join("")}
        ${EYES(26, 36, 16, 1.9)}${SMILE(31, 18.4, 1.8)}<ellipse cx="22" cy="18" rx="2" ry="1.3" fill="#FF6F91" opacity=".75"/><ellipse cx="40" cy="18" rx="2" ry="1.3" fill="#FF6F91" opacity=".75"/>`,
      baking_cake: `<defs>${G("b4ba-ck", "#FFF3E2", "#F2DCC0")}</defs>
        <path d="M5 30L52 16l7 7v34H5z" fill="url(#b4ba-ck)" ${SO}/>
        <path d="M6.2 40l51.6-6.5v7L6.2 47z" fill="#F7A8C4"/><path d="M6.2 29.8l51.6-7v4.5L6.2 35z" fill="#FFFFFF"/>
        <path d="M5 30L52 16l7 7v34H5z" fill="none" ${SO}/>
        <path d="M59 23H5v7" fill="none" stroke="${D}" stroke-width="2" stroke-linejoin="round" opacity="0"/>
        <path d="M5 30c4 5 7-2 10 3 3 4 6-3 9 2s7-3 10 1 7-3 10 1 7-4 9 0 4-4 6-2V23L52 16z" fill="#FFFFFF" ${SO}/>
        <path d="M44 8c-6 0-8 6-5 11 2 3 8 3 10 0 3-5 1-11-5-11z" fill="#E0304C" ${SO}/><path d="M40 8l4 3 4-3-4-3z" fill="#4FA66A" ${LN(1.6)}/>
        <g fill="#FFE08A"><circle cx="42" cy="13" r=".8"/><circle cx="46" cy="14" r=".8"/><circle cx="44" cy="17" r=".8"/></g>
        ${EYES(24, 36, 47, 2.2)}${SMILE(30, 51, 2.2)}<ellipse cx="19" cy="51" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".85"/><ellipse cx="41" cy="51" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".85"/>`,
      baking_pretzel: `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 54C12 50 6 40 8 28 10 16 22 10 30 18 36 24 34 36 24 44M42 54C52 50 58 40 56 28 54 16 42 10 34 18 28 24 30 36 40 44M18 50Q32 30 46 50" stroke="${D}" stroke-width="11.5"/>
        <path d="M22 54C12 50 6 40 8 28 10 16 22 10 30 18 36 24 34 36 24 44M42 54C52 50 58 40 56 28 54 16 42 10 34 18 28 24 30 36 40 44M18 50Q32 30 46 50" stroke="#C97A36" stroke-width="7"/>
        <path d="M11 30Q12 20 20 17M53 30Q52 20 44 17" stroke="#E8A866" stroke-width="2.4" opacity=".9"/></g>
        <g fill="#FFFFFF">${[[14, 40, 20], [20, 16, -30], [44, 16, 30], [50, 40, -20], [9, 30, 70], [55, 30, -70], [32, 38, 0]].map(([x, y, r]) => `<rect x="${x - 1.5}" y="${y - 1}" width="3" height="2" rx=".6" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g>`,
      baking_mixer: `<defs>${G("b4ba-mx", "#FBC0D4", "#E27490")}${G("b4ba-bl", "#F4F6FA", "#B9C0CE")}</defs>
        <rect x="6" y="52" width="50" height="8" rx="3" fill="#E27490" ${SO}/>
        <rect x="41" y="20" width="15" height="34" rx="6" fill="url(#b4ba-mx)" ${SO}/>
        <rect x="23" y="27" width="5" height="12" rx="1.5" fill="#C9CED8" ${LN(2)}/>
        <path d="M8 38h34l-4 12c-1 2.5-3 3.5-5 3.5H17c-2 0-4-1-5-3.5z" fill="url(#b4ba-bl)" ${SO}/>
        <rect x="6" y="35" width="38" height="5" rx="2.5" fill="#E6E9F0" ${SO}/>
        <path d="M17 45q8 3 16 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        <path d="M10 18c0-6 4-10 10-10h28c5 0 8 3 8 8v4c0 4-3 8-8 8H18c-5 0-8-4-8-8z" fill="url(#b4ba-mx)" ${SO}/>
        <circle cx="49" cy="40" r="2.6" fill="#FFF6EE" ${LN(1.6)}/>
        ${EYES(24, 36, 17, 2.3)}${SMILE(30, 20.5, 2.2)}<ellipse cx="19.5" cy="21.5" rx="2.4" ry="1.5" fill="#FF6F91" opacity=".75"/><ellipse cx="40.5" cy="21.5" rx="2.4" ry="1.5" fill="#FF6F91" opacity=".75"/>
        ${HI(16, 12, 3.4, 1.6, -20)}`,
      baking_mitt: `<defs>${G("b4ba-mt", "#F7A8C4", "#E27490")}</defs>
        <path d="M20 8c6-4 16-2 18 6l2 10 6-6c4-3 10 1 8 6L42 44H16V20c0-5 1-9 4-12z" fill="url(#b4ba-mt)" ${SO}/>
        <g fill="#fff" opacity=".85"><circle cx="23" cy="18" r="2"/><circle cx="31" cy="15" r="2"/><circle cx="27" cy="26" r="2"/><circle cx="35" cy="26" r="2"/><circle cx="21" cy="33" r="2"/><circle cx="31" cy="36" r="2"/><circle cx="46" cy="27" r="1.8"/></g>
        <rect x="13" y="43" width="32" height="14" rx="4" fill="#FFF6EE" ${SO}/>
        <path d="M13 50h32" stroke="#E27490" stroke-width="2" stroke-dasharray="3 2.4"/>
        <path d="M43 52q8 0 10 6" fill="none" stroke="#BF4D66" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M48 8s-4-2.4-4-5a2 2 0 0 1 4-.4 2 2 0 0 1 4 .4c0 2.6-4 5-4 5z" fill="#E0304C" transform="translate(4 4)"/>`,
      baking_sweet: `<defs>${G("b4ba-sw", "#E27490", "#BF4D66")}</defs>
        <path d="${Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2, b = (i + .5) / 16 * Math.PI * 2; return `${i ? "L" : "M"}${(32 + 28 * Math.cos(a)).toFixed(1)} ${(32 + 28 * Math.sin(a)).toFixed(1)}Q${(32 + 31.5 * Math.cos(b)).toFixed(1)} ${(32 + 31.5 * Math.sin(b)).toFixed(1)} ${(32 + 28 * Math.cos(b + Math.PI / 16)).toFixed(1)} ${(32 + 28 * Math.sin(b + Math.PI / 16)).toFixed(1)}`; }).join("")}Z" fill="url(#b4ba-sw)" ${SO}/>
        <circle cx="32" cy="32" r="21.5" fill="none" stroke="#FFD2E0" stroke-width="1.6" stroke-dasharray="2.4 2.4"/>
        ${T("SO", 30, 14, "#FFF3F6", 20)}${T("SWEET", 44, 12, "#fff", 36)}
        ${SPR([[21, 18, 30, "#FFD86B"], [43, 17, -30, "#8EE4B8"], [32, 51, 0, "#6FD3FF"]])}`
    }},
    pins: [
      {id: "tp-baking-cherry", name: "Cherry Charm", kind: "badge", desc: "A pair of glossy candied cherries on a leafy stem.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("b4bp-c", "#FF7A8E", "#C21D3A")}</defs><path d="M9.5 18q2-9 8-14.5M20.5 19q-1-9-3-15.5" fill="none" stroke="#5E7A2E" stroke-width="1.6" stroke-linecap="round"/><path d="M17.5 3.8c3-2.4 7.5-1.8 9 .5-3 2.2-6.5 2-9-.5z" fill="#6FB85E" stroke="#3E7A30" stroke-width=".9" stroke-linejoin="round"/><circle cx="9" cy="21" r="6.5" fill="url(#b4bp-c)" stroke="#7A0F22" stroke-width="1.1"/><circle cx="21" cy="21.5" r="6.5" fill="url(#b4bp-c)" stroke="#7A0F22" stroke-width="1.1"/><ellipse cx="7" cy="18.5" rx="2" ry="1.2" fill="#fff" opacity=".75" transform="rotate(-35 7 18.5)"/><ellipse cx="19" cy="19" rx="2" ry="1.2" fill="#fff" opacity=".75" transform="rotate(-35 19 19)"/></svg>`},
      {id: "tp-baking-sprinkle", name: "Sprinkle Tape", kind: "tape", desc: "Strawberry pink washi tape covered in rainbow sprinkles.", svg: `<svg viewBox="0 0 86 26"><path d="${TAPE}" fill="#FAC3D6" fill-opacity=".86" stroke="#E27490" stroke-width=".8" stroke-opacity=".6"/><g>${[[10, 8, 30, "#FFFFFF"], [18, 17, -40, "#6FD3FF"], [26, 9, 70, "#FFD86B"], [33, 18, 15, "#8EE4B8"], [41, 8, -20, "#C9A0FF"], [48, 16, 55, "#FFFFFF"], [56, 9, -60, "#FF6FB5"], [63, 18, 25, "#FFD86B"], [71, 9, 40, "#6FD3FF"], [77, 17, -25, "#8EE4B8"]].map(([x, y, r, c]) => `<rect x="${x - 3}" y="${y - 1.1}" width="6" height="2.2" rx="1.1" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g><rect x="4" y="3" width="78" height="3" fill="#fff" opacity=".3"/></svg>`}
    ],
    card: {id: "tp-baking", name: "Pink Icing", desc: "A shortbread card with a dripping strawberry icing top and a scatter of rainbow sprinkles."}
  });
})();


