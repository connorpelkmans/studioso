/* Theme Collections, New Theme Ideas batch n3 (Cozy Spots): greenhouse, pottery, campfire, aquarium, treehouse */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const lg3 = (id, a, b, c, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const glowG = (id, c) => `<defs><radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset=".55" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const shut = (x, y, w = 2.6) => `<path d="M${x - w} ${y}q${w} ${-w * .9} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const face = (x, y, gap = 6, r = 2.4) => EYES(x - gap, x + gap, y, r) + blush(x - gap - 4.5, x + gap + 4.5, y + 4.4, 2.4, 1.5) + smile(x, y + 3.2, 2.2, 1.8);
  const tube = (d, c, w, ow = w + 3.6, cap = "round") => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${ow}" stroke-linecap="${cap}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // a monstera leaf, stem at (x,y), pointing ang degrees (-90 = up), len long, with slits
  const monstera = (x, y, len, ang, slits = 2) => { const TH = [0, 0.06, 0.25, 0.5, 0.75, 0.9, 1], RR = [0.6, 0.52, 0.48, 0.44, 0.46, 0.4, 0.3], up = [];
    const rad = t => { for (let k = 1; k < TH.length; k++) if (t <= TH[k]) return RR[k - 1] + (RR[k] - RR[k - 1]) * (t - TH[k - 1]) / (TH[k] - TH[k - 1]); return 0.3; };
    for (let i = 0; i <= 44; i++) { const t = i / 44; let rr = rad(t); for (let s = 0; s < slits; s++) { const c = 0.22 + 0.56 * (s + 0.5) / slits, d = Math.abs(t - c); if (d < 0.026) rr = Math.min(rr, 0.15 + d * 6.5); } up.push([0.42 * len + rr * len * Math.cos(t * Math.PI), rr * len * Math.sin(t * Math.PI) * 1.05]); }
    const all = up.concat(up.slice(1, -1).reverse().map(p => [p[0], -p[1]])), a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return "M" + all.map(p => `${f1(x + p[0] * c - p[1] * s)} ${f1(y + p[0] * s + p[1] * c)}`).join("L") + "Z"; };
  const starPath = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const petals = (cx, cy, n, len, w, rot = 0) => { let d = ""; for (let i = 0; i < n; i++) { const a = (rot + i * 360 / n) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = (x, y) => `${f1(cx + x * c - y * s)} ${f1(cy + x * s + y * c)}`; d += `M${P(0, 0)}Q${P(len * 0.5, w)} ${P(len, 0)}Q${P(len * 0.5, -w)} ${P(0, 0)}Z`; } return d; };

  /* ================= GREENHOUSE ================= */
  TP_DATA.push({
    theme: "greenhouse",
    pack: {name: "Glasshouse Friends", items: {
      greenhouse_monstera: `${lg("n3-gh-mo", "#8EDB8A", "#2E8A52", .3, 1)}
        ${tube("M32 63V52", "#4E9A58", 4)}
        <path d="${monstera(32, 57, 50, -90, 2)}" fill="url(#n3-gh-mo)" ${SO}/>
        <path d="M32 53V11M32 40L22 33M32 40L42 33M32 26L24 20M32 26L40 20" fill="none" stroke="#D6F5C8" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
        ${SHINE(21, 22, 4, 2.2, -50)}
        ${EYES(25.5, 38.5, 34, 2.5)}${blush(21, 43, 38.6)}${smile(32, 37.4, 2.3)}
        ${spark(54, 10, 4.2, "#F2D24A")}<circle cx="9" cy="14" r="1.6" fill="#8ADBA0"/>`,
      greenhouse_cactus: `${lg("n3-gh-cb", "#A8E07A", "#3E9A52", 1, 0)}${lg("n3-gh-cp", "#F2A276", "#C4643E")}
        <rect x="8.5" y="15" width="9" height="18" rx="4.5" fill="url(#n3-gh-cb)" ${SO}/><rect x="13" y="25" width="10" height="7.5" rx="3.5" fill="url(#n3-gh-cb)" ${S2}/>
        <rect x="47" y="20" width="8.5" height="15" rx="4.2" fill="url(#n3-gh-cb)" ${SO}/><rect x="41" y="28" width="10" height="7" rx="3.5" fill="url(#n3-gh-cb)" ${S2}/>
        <rect x="19" y="11" width="26" height="36" rx="13" fill="url(#n3-gh-cb)" ${SO}/>
        <path d="M27 15v28M37 15v28" stroke="#2F7A44" stroke-width="1.3" opacity=".35"/>
        <g stroke="#FFF6D6" stroke-width="1.3" stroke-linecap="round"><path d="M23 20l-2-1M23 31l-2-1M41 22l2-1M41 34l2-1M12 21l-2-1M51 25l2-1"/></g>
        <path d="${petals(32, 9.5, 5, 7, 3.4, -90)}" fill="#FF8FB0" ${SOw(1.4)}/><circle cx="32" cy="9.5" r="2.2" fill="#FFE27A"/>
        <path d="M15 45H49L45 60.5H19z" fill="url(#n3-gh-cp)" ${SO}/><rect x="12.5" y="41" width="39" height="7" rx="3" fill="#F2B08A" ${SO}/>
        ${EYES(26.5, 37.5, 27, 2.3)}${blush(22.5, 41.5, 31.4, 2.3, 1.5)}${smile(32, 30.6, 2.1, 1.8)}`,
      greenhouse_can: `${lg("n3-gh-wc", "#8EDCE6", "#3E98AE", .2, 1)}
        ${tube("M15 27Q15 9 30 9Q42 9 42 25", "#6FC0D0", 4.5)}
        <path d="M40 42L55 22" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M40 42L55 22" stroke="#6FC0D0" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="56.5" cy="19.5" rx="6" ry="3.6" transform="rotate(-50 56.5 19.5)" fill="#8EDCE6" ${S2}/>
        <rect x="10" y="25" width="34" height="32" rx="8" fill="url(#n3-gh-wc)" ${SO}/>
        <path d="M10 35H44" stroke="#2E7A8C" stroke-width="1.6" opacity=".4"/>
        ${SHINE(17, 33, 3, 6, 0)}
        ${EYES(21, 33, 44, 2.4)}${blush(17, 37, 48.5, 2.3, 1.5)}${smile(27, 47.6, 2.2, 1.8)}
        <path d="M59 28q2 4 0 5.5q-2-1.5 0-5.5z" fill="#7CC4E8" ${SOw(1.2)}/><path d="M54 33q2 4 0 5.5q-2-1.5 0-5.5z" fill="#7CC4E8" ${SOw(1.2)}/><path d="M61 37q1.6 3.2 0 4.4q-1.6-1.2 0-4.4z" fill="#7CC4E8" ${SOw(1.1)}/>`,
      greenhouse_bloom: `${glowG("n3-gh-bg", "#F6FFF2")}${lg("n3-gh-bo", "#F6D6C2", "#D9967A")}${rg("n3-gh-bc", "#FFF8D8", "#F2C84A", .4, .35)}
        <circle cx="32" cy="32" r="31" fill="url(#n3-gh-bg)"/>
        <path d="${petals(32, 32, 12, 27, 4.4, 15)}" fill="url(#n3-gh-bo)" ${S2}/>
        <path d="${petals(32, 32, 10, 22, 7.2, 0)}" fill="#FFFFFF" ${S2}/>
        <circle cx="32" cy="32" r="9" fill="url(#n3-gh-bc)" ${S2}/>
        ${EYES(28.6, 35.4, 31, 1.7)}<path d="M30.4 34q1.6 1.6 3.2 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        ${spark(10, 10, 4, "#F2D24A")}${spark(55, 55, 3.4, "#B8E8C8")}<circle cx="55" cy="10" r="1.6" fill="#F2D24A"/>`,
      greenhouse_mister: `${lg("n3-gh-mb", "#CDEFFC", "#78C4E8", .2, 1)}${lg("n3-gh-mw", "#6FB8E0", "#3E8CC4")}
        <circle cx="8" cy="16" r="4.2" fill="#fff" ${SOw(1.3)}/><circle cx="4.5" cy="23" r="3" fill="#fff" ${SOw(1.2)}/><circle cx="11" cy="9" r="2.6" fill="#fff" ${SOw(1.2)}/>
        <rect x="26" y="21" width="12" height="8" rx="2" fill="#F4F6FA" ${S2}/>
        <path d="M20 9H44Q47 9 47 12V19H20z" fill="#FFFFFF" ${SO}/><rect x="13" y="11" width="8" height="5" rx="1.5" fill="#E8EEF6" ${S2}/>
        <path d="M24 19Q22 27 26 31" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M24 19Q22 27 26 31" fill="none" stroke="#F2A0B8" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="19" y="27" width="26" height="33" rx="9" fill="url(#n3-gh-mb)" ${SO}/>
        <path d="M21.5 44H42.5V51Q42.5 57.5 36 57.5H28Q21.5 57.5 21.5 51z" fill="url(#n3-gh-mw)" opacity=".75"/>
        ${SHINE(25, 35, 2.4, 5, 0)}
        ${EYES(28, 38, 39, 2.3)}${blush(24.6, 41.4, 43, 2.2, 1.4)}${smile(33, 42.3, 2, 1.8)}`,
      greenhouse_snail: `${rg("n3-gh-ss", "#FFD2B8", "#E07A8E", .38, .32)}${lg("n3-gh-sb", "#E2F2A0", "#9CCB5A")}
        <path d="M8 53Q6 36 15 33Q23 31 24 40V46H52Q58 46 58 51.5Q58 56 52 56H12Q8.5 56 8 53z" fill="url(#n3-gh-sb)" ${SO}/>
        ${tube("M13 34L9 23", "#B8DA7A", 2.2, 5)}${tube("M19 33L20.5 22", "#B8DA7A", 2.2, 5)}<circle cx="9" cy="22.5" r="2.4" fill="#B8DA7A" ${SOw(1.6)}/><circle cx="20.5" cy="21.5" r="2.4" fill="#B8DA7A" ${SOw(1.6)}/>
        <circle cx="39" cy="31" r="16.5" fill="url(#n3-gh-ss)" ${SO}/>
        <path d="M39 31m-2 0a2 2 0 1 1 4 0a5 5 0 1 1 -10 0a8.5 8.5 0 1 1 17 0a12 12 0 1 1 -24 0" fill="none" stroke="#B84E68" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${SHINE(32, 21, 3.4, 2, -30)}
        ${EYES(12.5, 20, 41.5, 1.9)}${blush(10, 22.5, 45, 1.8, 1.2)}<path d="M14.6 44.6q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        ${spark(56, 12, 3.6, "#F2D24A")}`,
      greenhouse_sprout: `${lg("n3-gh-pl", "#A8E88A", "#3E9A52", 1, 1)}${lg("n3-gh-pp", "#F2A276", "#C4643E")}
        ${tube("M32 44V25", "#5AAE62", 3)}
        <path d="M32 29C27 18 15 16 9 21C14 30 25 33 32 29z" fill="url(#n3-gh-pl)" ${SO}/><path d="M30 28Q20 23 13 22.5" fill="none" stroke="#2F7A44" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
        <path d="M32 26C36 13 49 10 56 15C52 25 40 29 32 26z" fill="url(#n3-gh-pl)" ${SO}/><path d="M34 25Q44 19 52 16" fill="none" stroke="#2F7A44" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
        <path d="M17 45H47L43 61H21z" fill="url(#n3-gh-pp)" ${SO}/><rect x="14.5" y="40" width="35" height="7.5" rx="3.2" fill="#F2B08A" ${SO}/><ellipse cx="32" cy="41" rx="14" ry="2.4" fill="#6E5442"/>
        ${EYES(26.5, 37.5, 51.5, 2.3)}${blush(22.5, 41.5, 55.4, 2.2, 1.4)}${smile(32, 54.5, 2, 1.8)}
        ${spark(10, 40, 3.6, "#F2D24A")}${spark(55, 36, 3, "#8ADBA0")}<path d="M48 4q2.4 4 0 6q-2.4-2 0-6z" fill="#7CC4E8" ${SOw(1.2)}/>`,
      greenhouse_label: `${lg("n3-gh-lw", "#F8E6C8", "#E0BE8C")}
        <rect x="28" y="36" width="8" height="25" rx="2" fill="#D2A06A" ${SO}/><path d="M28 56L32 63L36 56" fill="#D2A06A" ${S2}/>
        <rect x="6" y="11" width="52" height="28" rx="6" fill="url(#n3-gh-lw)" ${SO}/>
        <rect x="9.5" y="14.5" width="45" height="21" rx="4" fill="none" stroke="#C49A64" stroke-width="1.2" stroke-dasharray="2 2.4"/>
        ${T("GROW!", 32, 30.6, 13.5, "#2F7A44", 38)}
        <path d="M53 9C55 3 61 2 63 4C61 9 56 11 53 9z" fill="#7CC67A" ${S2}/><path d="M11 9C9 3 3 2 1 4C3 9 8 11 11 9z" fill="#7CC67A" ${S2}/>
        <path d="M44 50a3 3 0 0 1 5-3a3 3 0 0 1 5 3q-1 3-5 5.6q-4-2.6-5-5.6z" fill="#FF8FA8" ${SOw(1.4)}/>`
    }},
    pins: [
      {id: "tp-greenhouse-leaf", name: "Monstera Pin", kind: "badge", desc: "A glossy little monstera leaf with its famous splits.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n3-ghp-l" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#9CE48E"/><stop offset="1" stop-color="#2E8A52"/></linearGradient></defs>
          <path d="M15 29V24" stroke="#2B2233" stroke-width="3" stroke-linecap="round"/><path d="M15 29V24" stroke="#4E9A58" stroke-width="1.6" stroke-linecap="round"/>
          <path d="${monstera(15, 26, 23, -90, 2)}" fill="url(#n3-ghp-l)" stroke="#2B2233" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M15 24V6" stroke="#D6F5C8" stroke-width="1.1" stroke-linecap="round" opacity=".8"/><ellipse cx="10" cy="10" rx="2.4" ry="1.3" fill="#fff" opacity=".7" transform="rotate(-45 10 10)"/></svg>`},
      {id: "tp-greenhouse-fern", name: "Fern Frond Washi", kind: "tape", desc: "Mint washi tape with fern fronds and little dew drops.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#BFE6CC" opacity=".92"/>
          ${[8, 30, 52, 74].map(x => `<path d="M${x - 6} 21Q${x} 13 ${x + 7} 4" fill="none" stroke="#3E9A62" stroke-width="1.2" stroke-linecap="round"/>` + [0.2, 0.4, 0.6, 0.8].map(u => { const px = x - 6 + 13 * u, py = 21 - 17 * u; return `<path d="M${f1(px)} ${f1(py)}q-4 -1 -6 -4q4 0 6 4zM${f1(px)} ${f1(py)}q2 3 6 3q-2 -4 -6 -3z" fill="#4FA868"/>`; }).join("")).join("")}
          <circle cx="19" cy="9" r="1.4" fill="#fff" opacity=".85"/><circle cx="42" cy="18" r="1.2" fill="#fff" opacity=".85"/><circle cx="64" cy="8" r="1.4" fill="#fff" opacity=".85"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-greenhouse", name: "Glasshouse Pane", desc: "Misty mint paper behind white greenhouse glazing bars, with a monstera leaf and a fern tucked in the corners. Deep teal at night."}
  });

  /* ================= POTTERY STUDIO ================= */
  const speck = (pts, c) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r || 0.9}" fill="${c}"/>`).join("");
  TP_DATA.push({
    theme: "pottery",
    pack: {name: "Wheel Thrown", items: {
      pottery_vase: `<defs><linearGradient id="n3-pt-va" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD0C6"/><stop offset=".45" stop-color="#4A78D8"/><stop offset=".8" stop-color="#9B6AD6"/><stop offset="1" stop-color="#E07AA0"/></linearGradient></defs>
        <path d="M23 6H41V10.5H38.6Q38 17 44 21Q54 28 53 41Q52 54 41 59H23Q12 54 11 41Q10 28 20 21Q26 17 25.4 10.5H23z" fill="url(#n3-pt-va)" ${SO}/>
        <path d="M14 30Q20 34 24 30T34 31T44 29T51 31" fill="none" stroke="#B8F2E8" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        <path d="M20 22Q24 25 26 22" fill="none" stroke="#B8F2E8" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="32" cy="8.2" rx="6.6" ry="1.6" fill="#2A2A5A" opacity=".6"/>
        ${SHINE(19, 36, 2.6, 8, 8)}
        ${EYES(26, 38, 40, 2.5)}${blush(21.5, 42.5, 44.6, 2.4, 1.5)}${smile(32, 43.6, 2.2, 1.8)}
        ${spark(56, 10, 4, "#F2C84A")}${spark(7, 54, 3, "#5FD0C6")}`,
      pottery_lump: `${rg("n3-pt-cl", "#F0D2C0", "#B88A74", .38, .3)}${lg("n3-pt-wh", "#D6DEE6", "#8E98A6")}
        <ellipse cx="32" cy="55" rx="27" ry="7.5" fill="url(#n3-pt-wh)" ${SO}/><ellipse cx="32" cy="53.5" rx="20" ry="4.5" fill="#B8C2CC" opacity=".8"/>
        <path d="M13 52Q10 32 23 24Q32 19 41 24Q54 32 51 52Q32 57 13 52z" fill="url(#n3-pt-cl)" ${SO}/>
        <path d="M16 44Q32 48 48 44M15 36Q32 40 49 36M19 29Q32 32 45 29" fill="none" stroke="#A47662" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
        ${SHINE(21, 31, 3, 5, 20)}
        ${EYES(26, 38, 40.5, 2.4)}${blush(21, 43, 45, 2.4, 1.5)}${smile(32, 44, 2.2, 1.8)}
        <circle cx="7" cy="44" r="1.8" fill="#C8A493" ${SOw(1)}/><circle cx="58" cy="40" r="1.5" fill="#C8A493" ${SOw(1)}/><path d="M5 34q3-2 5 0M56 30q2-2 4 0" fill="none" stroke="#8E98A6" stroke-width="1.4" stroke-linecap="round"/>`,
      pottery_mug: `${lg("n3-pt-mg", "#FFF6EA", "#EAD8C2")}${lg("n3-pt-md", "#6FA6E8", "#3E64C0")}
        ${tube("M44 28Q57 28 57 39Q57 49 44 49", "#F2E4D2", 5)}
        <rect x="10" y="20" width="36" height="39" rx="7" fill="url(#n3-pt-mg)" ${SO}/>
        <path d="M11.3 21.3H44.7V30Q40 34 36 30Q31 35 27 30Q22 34 18 30Q14 33 11.3 30z" fill="url(#n3-pt-md)"/>
        <rect x="10" y="20" width="36" height="39" rx="7" fill="none" ${SO}/>
        ${speck([[16, 40], [22, 50], [38, 44], [40, 54], [30, 52, 0.7], [17, 52, 0.7], [41, 37, 0.7]], "#B89A80")}
        <path d="M20 14q-3-4 0-7M28 15q-3-4 0-8M36 14q-3-4 0-7" fill="none" stroke="#C8B8A8" stroke-width="2.2" stroke-linecap="round"/>
        ${EYES(22, 34, 40, 2.4)}${blush(18, 38, 44.6, 2.3, 1.5)}${smile(28, 43.6, 2.1, 1.8)}`,
      pottery_teapot: `${rg("n3-pt-tp", "#9FE6D8", "#2F9A8E", .38, .32)}
        ${tube("M13 41Q4 38 5 27", "#56BCAE", 5.5)}
        ${tube("M49 33Q60 32 59 42Q58 50 49 49", "#56BCAE", 4.5)}
        <ellipse cx="31" cy="42" rx="20.5" ry="16" fill="url(#n3-pt-tp)" ${SO}/>
        <path d="M14 46Q31 54 48 46" fill="none" stroke="#FFF6E6" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M15 38Q31 45 47 38" fill="none" stroke="#FFF6E6" stroke-width="1.6" stroke-linecap="round" opacity=".6" stroke-dasharray="1.5 3"/>
        <path d="M18 28Q31 18 44 28z" fill="#7AD2C4" ${SO}/><circle cx="31" cy="19.5" r="3.4" fill="#F2C84A" ${S2}/>
        ${SHINE(20, 37, 3.4, 2.2, -25)}
        ${EYES(25, 37, 42, 2.4)}${blush(20.5, 41.5, 46.6, 2.3, 1.5)}${smile(31, 45.6, 2.1, 1.8)}
        <path d="M5 21q-2-3 1-5" fill="none" stroke="#C8D8E0" stroke-width="1.8" stroke-linecap="round"/>`,
      pottery_kiln: `${lg("n3-pt-kb", "#E07A54", "#A8482C")}${rg("n3-pt-kg", "#FFF2B8", "#FF8A3A", .5, .65)}
        <rect x="40" y="2" width="9" height="14" rx="2" fill="#8A5A48" ${S2}/>
        <path d="M8 60V32Q8 9 32 9Q56 9 56 32V60z" fill="url(#n3-pt-kb)" ${SO}/>
        <path d="M9 22H55M8.5 34H18M46 34H55.5M8.5 46H17M47 46H55.5M24 16V22M40 16V22M13 28V34M51 28V34M12.5 40V46M51.5 40V46M13 52V58M51 52V58" fill="none" stroke="#7A2E1A" stroke-width="1.3" opacity=".55"/>
        <path d="M18 60V40Q18 26 32 26Q46 26 46 40V60z" fill="url(#n3-pt-kg)" ${SO}/>
        <path d="M23 58q3-8 0-12q6 4 5 12M35 58q-2-9 3-14q2 8 0 14" fill="#FFB24A" opacity=".85"/>
        <rect x="5" y="57" width="54" height="5" rx="2" fill="#6E6A74" ${S2}/>
        ${EYES(27, 37, 40, 2.3)}${blush(23, 41, 44.4, 2.2, 1.4)}${smile(32, 43.4, 2, 1.8)}
        ${spark(58, 22, 3.4, "#F2C84A")}`,
      pottery_glaze: `${lg("n3-pt-gj", "#6F9CF0", "#2E4EA8", .3, 1)}
        <rect x="12" y="24" width="40" height="34" rx="10" fill="url(#n3-pt-gj)" ${SO}/>
        <path d="M18 42Q26 32 34 40T48 36" fill="none" stroke="#A8D2FF" stroke-width="2.6" stroke-linecap="round" opacity=".8"/><path d="M20 50Q30 44 40 50" fill="none" stroke="#5FD0C6" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <rect x="10" y="15" width="44" height="11" rx="5" fill="#FFF6EA" ${SO}/>
        <path d="M16 25.5V30Q16 33 18.5 33Q21 33 21 30V25.5M37 25.5V34Q37 37 39.5 37Q42 37 42 34V25.5" fill="#4A78D8" ${SOw(1.8)}/>
        ${SHINE(18, 33, 2.4, 4, 0)}
        ${EYES(26, 38, 45, 2.4)}${blush(21.5, 42.5, 49.4, 2.3, 1.5)}${smile(32, 48.4, 2.1, 1.8)}
        ${spark(57, 8, 4, "#9B6AD6")}${spark(7, 9, 3, "#5FD0C6")}`,
      pottery_wheel: `${lg("n3-pt-pn", "#9AB8D0", "#5A7A96")}${lg("n3-pt-bw", "#F2A276", "#C4643E")}
        <path d="M5 40Q5 31 32 31Q59 31 59 40V48Q59 57 32 57Q5 57 5 48z" fill="url(#n3-pt-pn)" ${SO}/>
        <ellipse cx="32" cy="40" rx="24" ry="7" fill="#4A5A6A" ${S2}/>
        <ellipse cx="32" cy="38.5" rx="17" ry="4.6" fill="#D6DEE6" ${S2}/>
        <path d="M18 37Q18 22 32 21Q46 22 46 37Q32 41 18 37z" fill="url(#n3-pt-bw)" ${SO}/><ellipse cx="32" cy="22.5" rx="12" ry="2.6" fill="#8A3E22" ${SOw(1.6)}/>
        ${EYES(27, 37, 30, 2.1)}${blush(23.5, 40.5, 33.6, 2, 1.3)}${smile(32, 32.6, 1.9, 1.7)}
        <path d="M8 22q5-6 12-8M56 22q-5-6-12-8" fill="none" stroke="#8E98A6" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>`,
      pottery_badge: `${lg("n3-pt-bd", "#E07A54", "#B2572E")}
        <path d="M4 26L10 32L4 38H12V26z M60 26L54 32L60 38H52V26z" fill="#8A3E22" ${S2}/>
        <rect x="8" y="22" width="48" height="20" rx="6" fill="url(#n3-pt-bd)" ${SO}/>
        <rect x="11" y="25" width="42" height="14" rx="4" fill="none" stroke="#FFD8B8" stroke-width="1" stroke-dasharray="2 2"/>
        ${T("HANDMADE", 32, 35.6, 9.5, "#FFFFFF", 38)}
        <path d="M27 13a3.2 3.2 0 0 1 5-3.4a3.2 3.2 0 0 1 5 3.4q-1 3.4-5 6q-4-2.6-5-6z" fill="#FF8FA8" ${SOw(1.5)}/>
        ${spark(14, 12, 3.4, "#F2C84A")}${spark(51, 52, 3.4, "#5FD0C6")}<circle cx="47" cy="12" r="1.6" fill="#9B6AD6"/>`
    }},
    pins: [
      {id: "tp-pottery-vase", name: "Glazed Vase Pin", kind: "badge", desc: "A tiny vase dipped in a glaze that runs from teal to violet.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n3-ptp-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD0C6"/><stop offset=".5" stop-color="#4A78D8"/><stop offset="1" stop-color="#B07AD8"/></linearGradient></defs>
          <path d="M11 2.5H19V5H17.8Q17.6 8 20.6 10Q25.6 13.6 25 19.6Q24.4 25.6 19.4 27.6H10.6Q5.6 25.6 5 19.6Q4.4 13.6 9.4 10Q12.4 8 12.2 5H11z" fill="url(#n3-ptp-v)" stroke="#2B2233" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M7 15Q10 17 12 15T17 15.5T23 15" fill="none" stroke="#C8F6EE" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="9.6" cy="19" rx="1.2" ry="3" fill="#fff" opacity=".6"/></svg>`},
      {id: "tp-pottery-tiles", name: "Glaze Test Tape", kind: "tape", desc: "Clay-colored washi with a row of little glaze test tiles.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#E9C6A8" opacity=".92"/>
          ${["#3FA6A0", "#4A68C0", "#E5B24A", "#D8708E", "#9B6AD6", "#A8D2BC", "#E07A4A"].map((c, i) => `<rect x="${8 + i * 10.4}" y="6" width="8" height="13" rx="1.5" fill="#F6EADC" stroke="#B88A6A" stroke-width=".6"/><rect x="${8 + i * 10.4}" y="6" width="8" height="8" rx="1.5" fill="${c}"/>`).join("")}
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-pottery", name: "Clay Slab", desc: "Warm speckled clay paper with a glazed vase in the corner and glaze dripping along the top edge. Kiln-lit at night."}
  });

  /* ================= CAMPFIRE NIGHT ================= */
  const cres = (cx, cy, R, qx, qy, r) => { const dx = qx - cx, dy = qy - cy, d = Math.hypot(dx, dy), a = (R * R - r * r + d * d) / (2 * d), h = Math.sqrt(R * R - a * a), px = cx + a * dx / d, py = cy + a * dy / d;
    return `M${f1(px - h * dy / d)} ${f1(py + h * dx / d)}A${R} ${R} 0 1 1 ${f1(px + h * dy / d)} ${f1(py - h * dx / d)}A${r} ${r} 0 ${a > d ? 1 : 0} 0 ${f1(px - h * dy / d)} ${f1(py + h * dx / d)}z`; };
  TP_DATA.push({
    theme: "campfire",
    pack: {name: "Camp Cozy", items: {
      campfire_fire: `${lg("n3-cf-fo", "#FFD86A", "#F2552E")}${lg("n3-cf-fi", "#FFFBE0", "#FFC24A")}${lg("n3-cf-lg", "#B07A4E", "#7A4A2C")}
        <rect x="6" y="50" width="52" height="9" rx="4.5" transform="rotate(-12 32 54.5)" fill="url(#n3-cf-lg)" ${SO}/><rect x="6" y="50" width="52" height="9" rx="4.5" transform="rotate(12 32 54.5)" fill="url(#n3-cf-lg)" ${SO}/>
        <path d="M32 4C40 14 50 22 50 36C50 47 42 54 32 54C22 54 14 47 14 36C14 28 19 24 21 16C24 22 25 26 28 28C26 20 28 11 32 4z" fill="url(#n3-cf-fo)" ${SO}/>
        <path d="M32 26C37 32 42 36 42 43C42 49 37.5 52 32 52C26.5 52 22 49 22 43C22 37 28 34 32 26z" fill="url(#n3-cf-fi)"/>
        ${EYES(27, 37, 42, 2.4)}${blush(23, 41, 46.4, 2.2, 1.4)}${smile(32, 45.4, 2, 1.8)}
        <circle cx="10" cy="14" r="1.8" fill="#FFB347"/><circle cx="55" cy="9" r="1.5" fill="#FFD86A"/><circle cx="58" cy="24" r="1.2" fill="#FF8A3A"/>`,
      campfire_smore: `${lg("n3-cf-gc", "#E8B87A", "#C08440")}
        <rect x="8" y="38" width="48" height="14" rx="3.5" fill="url(#n3-cf-gc)" ${SO}/>
        <path d="M10 37Q8 30 16 29H48Q56 30 54 37Q56 40 50 40Q45 44 40 40Q32 44 26 40Q19 44 14 40Q8 40 10 37z" fill="#FFF8EE" ${SO}/>
        <path d="M14 31H50V36H14z" fill="#6A3A22" ${S2}/><path d="M22 36q1 4 3 0M40 36q1 5 3 0" fill="#6A3A22" ${SOw(1.2)}/>
        <rect x="8" y="16" width="48" height="14" rx="3.5" fill="url(#n3-cf-gc)" ${SO}/>
        <g fill="#A06A30"><circle cx="16" cy="23" r="1.2"/><circle cx="24" cy="23" r="1.2"/><circle cx="40" cy="23" r="1.2"/><circle cx="48" cy="23" r="1.2"/><circle cx="16" cy="45" r="1.2"/><circle cx="48" cy="45" r="1.2"/></g>
        <path d="M32 17V29" stroke="#A06A30" stroke-width="1.2" opacity=".6"/>
        ${EYES(27, 37, 22.5, 2.2)}${blush(23, 41, 26.2, 2, 1.3)}${smile(32, 25.4, 1.9, 1.7)}
        ${spark(57, 9, 3.6, "#FFD86A")}`,
      campfire_tent: `${lg("n3-cf-tn", "#FFA65A", "#E0602E", 1, 1)}${rg("n3-cf-tg", "#FFF2B0", "#FFA040", .5, .7)}
        <path d="M6 56L28 12H36L58 56z" fill="url(#n3-cf-tn)" ${SO}/>
        <path d="M36 12L58 56H44z" fill="#C04E24" opacity=".45"/>
        <path d="M20 56L32 26L44 56z" fill="url(#n3-cf-tg)" ${SO}/>
        <path d="M32 12V4L40 7L32 10" fill="#5FB8E8" ${S2}/>
        <path d="M2 57H62" stroke="${O}" stroke-width="3" stroke-linecap="round"/>
        ${EYES(28.4, 35.6, 45, 1.9)}${blush(25.5, 38.5, 48.2, 1.8, 1.2)}${smile(32, 47.4, 1.7, 1.6)}
        ${spark(10, 14, 3.6, "#F2C84A")}<circle cx="54" cy="20" r="1.6" fill="#F2C84A"/>`,
      campfire_lantern: `${rg("n3-cf-lt", "#FFF6C8", "#FFB040", .5, .5)}${lg("n3-cf-lc", "#5A9A7A", "#2E6A50")}
        <path d="M22 13Q22 3 32 3Q42 3 42 13" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><path d="M22 13Q22 3 32 3Q42 3 42 13" fill="none" stroke="#8AA89A" stroke-width="2" stroke-linecap="round"/>
        <circle cx="32" cy="36" r="25" fill="#FFD27A" opacity=".25"/>
        <path d="M18 18H46L42 13H22z" fill="url(#n3-cf-lc)" ${SO}/>
        <rect x="19" y="18" width="26" height="30" rx="5" fill="url(#n3-cf-lt)" ${SO}/>
        <path d="M24 18V48M40 18V48" stroke="#2E6A50" stroke-width="2.4"/>
        <rect x="16" y="47" width="32" height="9" rx="3" fill="url(#n3-cf-lc)" ${SO}/>
        ${EYES(28.6, 35.4, 33, 1.9)}${blush(26, 38, 36.5, 1.7, 1.1)}${smile(32, 35.7, 1.6, 1.6)}
        ${spark(9, 28, 3.4, "#FFD27A")}${spark(55, 30, 3, "#FFD27A")}`,
      campfire_mallow: `${lg("n3-cf-ml", "#FFF6E6", "#E8B060")}
        ${tube("M4 60L30 34", "#A8784A", 3.4)}
        <g transform="rotate(-45 38 26)"><rect x="25" y="15" width="26" height="22" rx="7" fill="url(#n3-cf-ml)" ${SO}/><path d="M27 31Q38 35 49 31V30" fill="none" stroke="#C88A40" stroke-width="2" stroke-linecap="round" opacity=".6"/></g>
        ${EYES(34, 43, 25, 2.2)}${blush(31, 46, 29, 2, 1.3)}${smile(38.5, 28, 1.9, 1.7)}
        <path d="M52 50q4-6 0-11q8 4 6 11M44 56q2-4 0-7q5 3 4 7" fill="#FF8A3A" ${SOw(1.4)}/>
        ${spark(56, 10, 3.6, "#FFD86A")}`,
      campfire_pine: `${lg("n3-cf-pn", "#5AB07A", "#2A6A48")}
        <rect x="28" y="50" width="8" height="10" rx="2" fill="#8A5A3A" ${SO}/>
        <path d="M32 4L46 22H40L52 36H44L56 52H8L20 36H12L24 22H18z" fill="url(#n3-cf-pn)" ${SO}/>
        <path d="M22 22L28 18M40 22L36 18M16 36L22 32M48 36L42 32" stroke="#8AD8A0" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        ${EYES(27, 37, 38, 2.3)}${blush(23, 41, 42.5, 2.2, 1.4)}${smile(32, 41.6, 2, 1.8)}
        <path d="${starPath(32, 4, 5, 2.2, 5)}" fill="#FFD86A" ${SOw(1.3)}/>
        ${spark(8, 12, 3, "#C9D4FF")}${spark(57, 14, 3.4, "#C9D4FF")}`,
      campfire_moon: `${rg("n3-cf-mn", "#FFF6CF", "#F2C24A", .3, .4)}
        <path d="${cres(30, 33, 25, 44, 24, 19)}" fill="url(#n3-cf-mn)" ${SO}/>
        ${shut(13, 36, 2.2)}${shut(22, 40, 2.2)}<ellipse cx="11" cy="41.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/><ellipse cx="24" cy="45.5" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/>
        <path d="M15.5 45.5q2 1.8 4 .8" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="${starPath(48, 46, 7, 3.2, 5)}" fill="#FFE27A" ${S15}/>${spark(52, 16, 4, "#FFE27A")}<circle cx="58" cy="30" r="1.6" fill="#FFE27A"/>
        ${T("z", 48, 24, 8, "#8C93D8")}`,
      campfire_badge: `${lg("n3-cf-bd", "#2E3E6A", "#1A2444")}
        <circle cx="32" cy="32" r="27" fill="url(#n3-cf-bd)" ${SO}/><circle cx="32" cy="32" r="22.5" fill="none" stroke="#F5A04E" stroke-width="1.4" stroke-dasharray="2 2.6"/>
        <path d="M23 30L32 15L41 30z" fill="#F08A3E" ${S2}/><path d="M29.5 30L32 23L34.5 30z" fill="#FFE08A"/>
        ${T("HAPPY", 32, 40.5, 8.6, "#FFE7B0", 28)}${T("CAMPER", 32, 49.5, 8.6, "#FFFFFF", 32)}
        <circle cx="16" cy="22" r="1.2" fill="#fff"/><circle cx="48" cy="20" r="1.4" fill="#fff"/>${spark(46, 30, 2.4, "#FFE27A")}`
    }},
    pins: [
      {id: "tp-campfire-flame", name: "Little Flame Pin", kind: "badge", desc: "A warm enamel flame that flickers from gold to ember red.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n3-cfp-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD86A"/><stop offset="1" stop-color="#F2552E"/></linearGradient></defs>
          <path d="M15 1.5C19 6.5 24.5 10.5 24.5 17.5C24.5 23.5 20.5 27.5 15 27.5C9.5 27.5 5.5 23.5 5.5 17.5C5.5 13 8.5 11 9.6 7C11.2 10 11.6 12 13.2 13C12.2 8.6 13 5 15 1.5z" fill="url(#n3-cfp-f)" stroke="#2B2233" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M15 13C17.6 16 20 18 20 21.4C20 24.4 17.8 26 15 26C12.2 26 10 24.4 10 21.4C10 18.4 13 16.6 15 13z" fill="#FFF4C0"/><ellipse cx="10" cy="15" rx="1.2" ry="2.4" fill="#fff" opacity=".6"/></svg>`},
      {id: "tp-campfire-pines", name: "Pine Ridge Washi", kind: "tape", desc: "Night-blue washi with a row of pines and a few stars.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2A3A62" opacity=".9"/>
          ${[6, 15, 24, 35, 44, 55, 64, 75].map((x, i) => { const h = 12 + (i % 3) * 3; return `<path d="M${x} ${22 - h}L${x + 4.5} ${22 - h * 0.45}H${x + 2.5}L${x + 6} 22H${x - 6}L${x - 2.5} ${22 - h * 0.45}H${x - 4.5}z" fill="${i % 2 ? "#3E7A5C" : "#2E6A4E"}"/>`; }).join("")}
          ${spark(20, 6, 1.8, "#FFE27A")}${spark(50, 5, 1.6, "#FFE27A")}<circle cx="70" cy="6" r="1" fill="#fff"/><circle cx="32" cy="5" r=".9" fill="#fff"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".25"/></svg>`}
    ],
    card: {id: "tp-campfire", name: "Camp Journal", desc: "Kraft-paper journal page with a campfire in the corner and a ridge of pines along the bottom. Starry navy at night."}
  });

  /* ================= AQUARIUM TUNNEL ================= */
  const bub = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E8FAFF" fill-opacity=".55" stroke="#2B2233" stroke-width="1.3"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#fff"/>`;
  TP_DATA.push({
    theme: "aquarium",
    pack: {name: "Tank Pals", items: {
      aquarium_whale: `${lg("n3-aq-ws", "#6A8EB8", "#3A5A84")}
        <path d="M6 22L13 31L6 42Q4 32 6 22z" fill="#4A6C96" ${SO}/>
        <path d="M60 30Q60 46 40 49Q22 51 12 40Q10 31 12 26Q22 14 40 15Q60 16 60 30z" fill="url(#n3-aq-ws)" ${SO}/>
        <path d="M58 34Q56 46 38 47.6Q22 48.6 14 39Q30 42 58 34z" fill="#EAF4FA"/>
        <path d="M58 34Q42 40 24 39" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M30 15Q33 6 39 8Q37 12 37 15.5" fill="#4A6C96" ${S2}/><path d="M34 44Q30 54 24 53Q27 49 27 44.6" fill="#4A6C96" ${S2}/>
        <g fill="#FFFFFF"><circle cx="20" cy="26" r="1.6"/><circle cx="27" cy="22" r="1.4"/><circle cx="26" cy="31" r="1.5"/><circle cx="33" cy="25" r="1.3"/><circle cx="34" cy="20" r="1.2"/><circle cx="17" cy="33" r="1.2"/><circle cx="40" cy="22" r="1.1"/></g>
        ${EYES(44, 53, 27, 2.2)}${blush(41, 56, 31.5, 2, 1.3)}
        ${bub(9, 10, 3.4)}${bub(16, 5, 2)}`,
      aquarium_puffer: `${rg("n3-aq-pf", "#FFF0A0", "#F2B33A", .38, .32)}
        <g fill="#F7D46A" ${SOw(1.6)}>${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return `<path d="M${f1(32 + c * 19 - s * 3)} ${f1(34 + s * 19 + c * 3)}L${f1(32 + c * 26)} ${f1(34 + s * 26)}L${f1(32 + c * 19 + s * 3)} ${f1(34 + s * 19 - c * 3)}z"/>`; }).join("")}</g>
        <path d="M51 30L60 24V44L51 38z" fill="#F2A23A" ${S2}/>
        <circle cx="32" cy="34" r="20.5" fill="url(#n3-aq-pf)" ${SO}/>
        <path d="M14 40Q32 52 50 40Q48 52 32 54Q16 52 14 40z" fill="#FFF8DA" opacity=".9"/>
        <g fill="#C88A2A" opacity=".55"><circle cx="24" cy="22" r="1.4"/><circle cx="32" cy="18" r="1.4"/><circle cx="40" cy="22" r="1.4"/><circle cx="28" cy="27" r="1.2"/><circle cx="36" cy="27" r="1.2"/></g>
        ${EYES(25, 39, 33, 2.8)}${blush(20, 44, 38.5, 2.6, 1.6)}<ellipse cx="32" cy="40.5" rx="2.6" ry="3" fill="#E8605A" ${SOw(1.6)}/>
        ${bub(55, 10, 3.4)}${bub(9, 14, 2.6)}`,
      aquarium_jelly: `${glowG("n3-aq-jg", "#FFB0E8")}${lg("n3-aq-jb", "#FFD6F2", "#F27BC0")}
        <circle cx="32" cy="28" r="28" fill="url(#n3-aq-jg)"/>
        ${tube("M20 36Q16 44 21 50Q25 55 21 61", "#F7A6D8", 2.6, 5.2)}${tube("M28 38Q25 46 29 52Q32 57 29 62", "#C9A0FF", 2.6, 5.2)}${tube("M36 38Q39 46 35 52Q32 57 35 62", "#F7A6D8", 2.6, 5.2)}${tube("M44 36Q48 44 43 50Q39 55 43 61", "#C9A0FF", 2.6, 5.2)}
        <path d="M11 34Q11 10 32 10Q53 10 53 34Q47 38.6 42 35Q37 39.6 32 35.6Q27 39.6 22 35Q17 38.6 11 34z" fill="url(#n3-aq-jb)" ${SO}/>
        ${SHINE(21, 19, 4, 2.2, -35)}
        ${EYES(26, 38, 25, 2.3)}${blush(21.5, 42.5, 29.4, 2.2, 1.4)}${smile(32, 28.4, 2, 1.8)}
        ${spark(56, 8, 3.6, "#9FF7FF")}`,
      aquarium_seahorse: `${lg("n3-aq-sh", "#FFC870", "#F2873A", .2, 1)}
        <path d="M30 33Q24 35 22 43Q21 52 28 56Q35 59 37 52Q38 47 33 46Q29 46 30 50" fill="none" stroke="${O}" stroke-width="9.6" stroke-linecap="round"/>
        <path d="M30 33Q24 35 22 43Q21 52 28 56Q35 59 37 52Q38 47 33 46Q29 46 30 50" fill="none" stroke="#F7A24A" stroke-width="5" stroke-linecap="round"/>
        <path d="M38 22Q46 26 44 36Q42 44 30 44Q24 36 28 26z" fill="#FFD27A" ${S2}/>
        <path d="M24 26Q22 12 32 9Q42 7 44 16Q46 25 38 30Q34 36 28 34Q22 32 24 26z" fill="url(#n3-aq-sh)" ${SO}/>
        <path d="M42 13L54 15Q56 18 54 20L43 20z" fill="url(#n3-aq-sh)" ${SO}/>
        <path d="M27 9L24 3L30 6L31 1L34 7" fill="#F2873A" ${S2}/>
        <path d="M22 36L15 32L17 40z" fill="#FFE29A" ${S2}/>
        <g fill="#E07A2A" opacity=".5"><circle cx="30" cy="22" r="1.1"/><circle cx="34" cy="28" r="1.1"/><circle cx="27" cy="29" r="1"/></g>
        ${EYES(36, 36.001, 16, 2.5)}<ellipse cx="38" cy="22" rx="2.4" ry="1.5" fill="#FF8FA8" opacity=".8"/>
        ${bub(10, 18, 3)}${bub(54, 34, 2.6)}`,
      aquarium_manta: `${lg("n3-aq-mt", "#7AA6E0", "#3A64A8", .5, 1)}
        <path d="M32 44Q32 56 40 62" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M32 44Q32 56 40 62" fill="none" stroke="#5A80C0" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M32 14Q40 14 44 22Q52 26 61 36Q48 38 40 44Q36 47 32 47Q28 47 24 44Q16 38 3 36Q12 26 20 22Q24 14 32 14z" fill="url(#n3-aq-mt)" ${SO}/>
        <path d="M25 16Q24 10 28 9Q27 13 28.6 15M39 16Q40 10 36 9Q37 13 35.4 15" fill="#5A80C0" ${S2}/>
        <path d="M24 38Q32 43 40 38" fill="none" stroke="#DDEBFA" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
        ${SHINE(17, 30, 4, 1.8, -20)}
        ${EYES(26.5, 37.5, 26, 2.3)}${blush(22.5, 41.5, 30.4, 2.2, 1.4)}${smile(32, 29.4, 2, 1.8)}
        ${bub(54, 12, 3)}${bub(8, 14, 2.2)}`,
      aquarium_clown: `${lg("n3-aq-cf", "#FFB060", "#F26A2A")}
        <path d="M10 22Q2 32 10 42L16 32z" fill="#F7883A" ${SO}/>
        <path d="M14 32Q14 18 34 17Q54 17 58 32Q54 47 34 47Q14 46 14 32z" fill="url(#n3-aq-cf)" ${SO}/>
        <path d="M24 19Q20 32 24 45L31 46Q27 32 31 18z" fill="#FFFFFF" ${SOw(1.6)}/><path d="M42 18Q38 32 42 46L47 44.6Q44 32 47 19.6z" fill="#FFFFFF" ${SOw(1.6)}/>
        <path d="M30 17Q34 9 42 12Q40 15 40 17.6z" fill="#F7883A" ${S2}/><path d="M30 46.6Q32 54 38 52Q37 49 37 46.6z" fill="#F7883A" ${S2}/>
        ${EYES(50, 50.001, 29, 2.6)}<ellipse cx="51" cy="36" rx="2.2" ry="1.4" fill="#FF8FA8" opacity=".9"/><path d="M53 37q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${bub(8, 10, 3)}${bub(16, 5, 1.8)}${spark(56, 54, 3.4, "#7ADAF0")}`,
      aquarium_star: `${rg("n3-aq-st", "#FFC2B0", "#F2766A", .4, .35)}
        <path d="${starPath(32, 34, 27, 12.5, 5)}" fill="url(#n3-aq-st)" ${SO} stroke-linejoin="round"/>
        <g fill="#FFE2D6">${[0, 72, 144, 216, 288].map(a => { const r = (a - 90) * Math.PI / 180; return [10, 17].map(d => `<circle cx="${f1(32 + Math.cos(r) * d)}" cy="${f1(34 + Math.sin(r) * d)}" r="1.4"/>`).join(""); }).join("")}</g>
        ${EYES(27, 37, 33, 2.3)}${blush(23, 41, 37.6, 2.1, 1.4)}${smile(32, 36.8, 2, 1.8)}
        ${bub(55, 9, 3)}${spark(9, 9, 3.4, "#7ADAF0")}`,
      aquarium_badge: `${lg("n3-aq-bd", "#4FB8E0", "#1E7AAE")}
        <path d="M10 14H54Q60 14 60 20V38Q60 44 54 44H30L20 54V44H10Q4 44 4 38V20Q4 14 10 14z" fill="url(#n3-aq-bd)" ${SO}/>
        <path d="M8 36Q14 32 20 36T32 36T44 36T56 36" fill="none" stroke="#B8ECFF" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        ${T("DIVE IN!", 32, 31, 11.5, "#FFFFFF", 42)}
        ${bub(54, 54, 4)}${bub(46, 58, 2.4)}${bub(58, 7, 2.6)}`
    }},
    pins: [
      {id: "tp-aquarium-bubble", name: "Bubble Fish Pin", kind: "badge", desc: "A glassy bubble with a tiny orange fish swimming inside.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="n3-aqp-b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#F2FCFF"/><stop offset="1" stop-color="#8AD4EE"/></radialGradient></defs>
          <circle cx="15" cy="15" r="13" fill="url(#n3-aqp-b)" stroke="#2B2233" stroke-width="1.3"/>
          <path d="M9 16Q9 11.6 15 11.4Q20 11.4 21.6 16Q20 20.4 15 20.4Q9 20.4 9 16z" fill="#FF8A3A" stroke="#2B2233" stroke-width="1"/><path d="M9.6 16L5.6 12.6V19.4z" fill="#FF8A3A" stroke="#2B2233" stroke-width="1" stroke-linejoin="round"/>
          <path d="M13 11.8Q12 16 13 20.2" stroke="#fff" stroke-width="1.6"/><circle cx="18.6" cy="15" r="1.1" fill="#2B2233"/>
          <ellipse cx="9.6" cy="8.4" rx="3" ry="1.6" fill="#fff" opacity=".8" transform="rotate(-35 9.6 8.4)"/></svg>`},
      {id: "tp-aquarium-waves", name: "Deep Blue Washi", kind: "tape", desc: "Ocean washi tape with rolling waves, bubbles and little fish.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#3E9AD0" opacity=".9"/>
          <path d="M3 17Q9 13 15 17T27 17T39 17T51 17T63 17T75 17T83 17V24H3z" fill="#2E78B0" opacity=".8"/>
          ${[[18, 9, "#FF8A3A"], [46, 11, "#F7D23A"], [70, 8, "#F27BA0"]].map(([x, y, c]) => `<path d="M${x - 4} ${y}Q${x - 4} ${y - 3} ${x + 1} ${y - 3}Q${x + 5} ${y - 3} ${x + 5} ${y}Q${x + 5} ${y + 3} ${x + 1} ${y + 3}Q${x - 4} ${y + 3} ${x - 4} ${y}zM${x - 4} ${y}L${x - 7} ${y - 2.6}V${y + 2.6}z" fill="${c}"/><circle cx="${x + 2.6}" cy="${y - 0.6}" r=".7" fill="#2B2233"/>`).join("")}
          <circle cx="30" cy="7" r="1.6" fill="none" stroke="#fff" stroke-width=".7"/><circle cx="58" cy="6" r="1.2" fill="none" stroke="#fff" stroke-width=".7"/><circle cx="8" cy="8" r="1.1" fill="none" stroke="#fff" stroke-width=".7"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".35"/></svg>`}
    ],
    card: {id: "tp-aquarium", name: "Tank Window", desc: "Sunlit aqua water with rising bubbles, a clownfish in the corner and a reef along the bottom. Glowing deep blue at night."}
  });

  /* ================= TREEHOUSE ================= */
  TP_DATA.push({
    theme: "treehouse",
    pack: {name: "Treehouse Club", items: {
      treehouse_house: `${rg("n3-th-cn", "#9AE07A", "#3E9A4A", .4, .3)}${lg("n3-th-wd", "#F2C08A", "#C8844E")}
        <rect x="28" y="40" width="8" height="22" rx="2" fill="#8A5A3A" ${SO}/>
        <circle cx="16" cy="24" r="13" fill="url(#n3-th-cn)" ${SO}/><circle cx="48" cy="22" r="13" fill="url(#n3-th-cn)" ${SO}/><circle cx="32" cy="15" r="13" fill="url(#n3-th-cn)" ${SO}/>
        <rect x="18" y="38" width="30" height="4" rx="1.5" fill="#A8703E" ${S2}/>
        <rect x="21" y="25" width="22" height="14" rx="1.5" fill="url(#n3-th-wd)" ${SO}/>
        <path d="M17 26L32 15L47 26z" fill="#E0584A" ${SO}/>
        <rect x="25" y="28" width="7" height="6" rx="1" fill="#FFE29A" ${SOw(1.4)}/><rect x="35" y="29" width="5" height="10" rx="2.5" fill="#8A5A3A" ${SOw(1.4)}/>
        ${tube("M23 42V58M28 42V58", "#C8A070", 1.4, 3.4)}<path d="M23 46H28M23 50H28M23 54H28" stroke="#C8A070" stroke-width="1.6"/>
        ${spark(57, 46, 3.6, "#F2C84A")}<circle cx="7" cy="44" r="1.6" fill="#7AC4E8"/>`,
      treehouse_acorn: `${lg("n3-th-ac", "#F2C48A", "#C88A4E")}${lg("n3-th-cp", "#A8784A", "#6E4628")}
        <path d="M14 30H50Q50 48 32 59Q14 48 14 30z" fill="url(#n3-th-ac)" ${SO}/>
        <path d="M9 30Q9 14 32 14Q55 14 55 30Q55 34 50 34H14Q9 34 9 30z" fill="url(#n3-th-cp)" ${SO}/>
        <path d="M14 24L20 18M20 28L28 18M28 28L36 18M36 28L44 18M44 28L50 22" stroke="#8A5A34" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>
        ${tube("M32 14Q32 7 37 5", "#8A5A3A", 2.6)}
        <path d="M38 8C42 2 50 2 53 6C49 11 43 11 38 8z" fill="#8ACB6A" ${S2}/>
        ${SHINE(20, 40, 2.4, 4, 15)}
        ${EYES(26, 38, 42, 2.4)}${blush(21.5, 42.5, 46.6, 2.3, 1.5)}${smile(32, 45.6, 2.1, 1.8)}`,
      treehouse_plane: `${lg("n3-th-pl", "#FFFFFF", "#DCE6F2")}
        <path d="M6 54Q2 40 14 40Q24 40 20 50Q16 58 8 50" fill="none" stroke="#8AA6D8" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.4 3.2"/>
        <path d="M59 10L8 30L28 34z" fill="url(#n3-th-pl)" ${SO}/><path d="M59 10L28 34L32 52z" fill="#E6EEF8" ${SO}/><path d="M28 34L32 52L24 38z" fill="#C8D4E6" ${SO}/>
        <path d="M14 30L50 15" stroke="#B8C8E0" stroke-width="1.2" stroke-dasharray="2 2"/>
        ${EYES(28, 35, 26, 1.9)}${blush(25.5, 37.5, 29.6, 1.8, 1.2)}<path d="M30 29q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M44 48a2.6 2.6 0 0 1 4.4-2.8a2.6 2.6 0 0 1 4.4 2.8q-.8 2.8-4.4 5q-3.6-2.2-4.4-5z" fill="#FF8FA8" ${SOw(1.3)}/>`,
      treehouse_cans: `${lg("n3-th-cn1", "#E8EEF4", "#9AA6B4", 1, 0)}
        <path d="M18 30Q22 6 32 16Q42 6 46 30" fill="none" stroke="#C8A070" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="6" y="30" width="20" height="26" rx="3" fill="url(#n3-th-cn1)" ${SO}/><rect x="6" y="37" width="20" height="10" fill="#4FA0E8" ${S2}/>
        <rect x="38" y="30" width="20" height="26" rx="3" fill="url(#n3-th-cn1)" ${SO}/><rect x="38" y="37" width="20" height="10" fill="#E8504A" ${S2}/>
        ${EYES(12.5, 19.5, 41, 1.8)}<path d="M14.4 44q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        ${EYES(44.5, 51.5, 41, 1.8)}<ellipse cx="48" cy="44.6" rx="1.6" ry="1.8" fill="${O}"/>
        <path d="M27 16a2.4 2.4 0 0 1 5-1a2.4 2.4 0 0 1 5 1q-1 3-5 5.4q-4-2.4-5-5.4z" fill="#FF8FA8" ${SOw(1.3)}/>
        <path d="M30 26q2-2 4 0M28 30q4-3 8 0" fill="none" stroke="#8AA6D8" stroke-width="1.4" stroke-linecap="round"/>`,
      treehouse_tire: `${lg("n3-th-br", "#A8784A", "#7A4E2C")}
        <rect x="2" y="4" width="60" height="9" rx="4.5" fill="url(#n3-th-br)" ${SO}/>
        <path d="M24 12L22 32M40 12L42 32" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M24 12L22 32M40 12L42 32" stroke="#D8B884" stroke-width="2" stroke-linecap="round"/>
        <path d="M32 26A17 15 0 1 1 31.9 26z M32 35A8 7 0 1 0 32.1 35z" fill="#3A3A46" ${SO} fill-rule="evenodd"/>
        <path d="M19 37Q20 31 26 29" fill="none" stroke="#7A7A8A" stroke-width="2.4" stroke-linecap="round"/>
        ${EYES(26, 38, 50, 2)}<path d="M30 53q2 1.8 4 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>${blush(22, 42, 53, 1.8, 1.2)}
        <path d="M54 22C56 17 61 17 62 19C61 23 57 24 54 22z" fill="#8ACB6A" ${S2}/>`,
      treehouse_leaf: `${lg("n3-th-lf", "#B8E07A", "#4E9A3A", .2, 1)}
        ${tube("M32 62V50", "#7A5A2E", 2.6)}
        <path d="M32 52C24 52 20 46 22 42C14 44 10 38 14 34C8 32 8 24 14 22C10 16 16 10 22 14C22 6 30 4 32 8C34 4 42 6 42 14C48 10 54 16 50 22C56 24 56 32 50 34C54 38 50 44 42 42C44 46 40 52 32 52z" fill="url(#n3-th-lf)" ${SO}/>
        <path d="M32 50V12M32 40L22 32M32 40L42 32M32 28L24 20M32 28L40 20" fill="none" stroke="#E2F6C0" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        ${EYES(26.5, 37.5, 33, 2.3)}${blush(22.5, 41.5, 37.5, 2.2, 1.4)}${smile(32, 36.6, 2, 1.8)}
        ${spark(56, 8, 3.4, "#F2C84A")}`,
      treehouse_bird: `${rg("n3-th-bd", "#9ACCF8", "#3E7ACC", .38, .3)}
        <path d="M12 32L3 26L5 36z" fill="#3E7ACC" ${S2}/>
        <ellipse cx="30" cy="36" rx="20" ry="17" fill="url(#n3-th-bd)" ${SO}/>
        <path d="M34 40Q34 52 30 52Q46 52 48 40z" fill="#FFE2CC"/>
        <circle cx="40" cy="24" r="12" fill="url(#n3-th-bd)" ${SO}/>
        <path d="M51 23L59 26L51 29z" fill="#F2A23A" ${S2}/>
        <path d="M18 36Q24 26 32 36Q26 44 18 36z" fill="#2E64B0" ${S2}/>
        <path d="M36 13Q38 7 42 10" fill="none" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M36 13Q38 7 42 10" fill="none" stroke="#3E7ACC" stroke-width="1.6" stroke-linecap="round"/>
        ${EYES(38, 46, 23, 2.1)}${blush(35, 49.5, 28, 1.9, 1.2)}
        <path d="M26 53V58M34 53V58" stroke="#E8A040" stroke-width="2.4" stroke-linecap="round"/>`,
      treehouse_sign: `${lg("n3-th-sg", "#E8B67A", "#B8804A")}
        <rect x="29" y="40" width="6" height="22" rx="2" fill="#8A5A3A" ${SO}/>
        <path d="M6 12H54L60 25L54 38H6z" fill="url(#n3-th-sg)" ${SO}/>
        <path d="M8 20H54M8 30H56" stroke="#9A6A3A" stroke-width="1" opacity=".5"/><circle cx="11" cy="16" r="1.3" fill="#6A4428"/><circle cx="11" cy="34" r="1.3" fill="#6A4428"/>
        ${T("STUDY", 32, 23.6, 8.6, "#3E2A1A", 30)}${T("CLUB", 32, 33.8, 8.6, "#3E2A1A", 24)}
        <path d="M52 8C54 3 60 2 62 5C60 9 55 10 52 8z" fill="#8ACB6A" ${S2}/>${spark(8, 50, 3.4, "#F2C84A")}<circle cx="52" cy="50" r="1.6" fill="#FF8FA8"/>`
    }},
    pins: [
      {id: "tp-treehouse-acorn", name: "Acorn Pin", kind: "badge", desc: "A polished little acorn with a crosshatched cap.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="n3-thp-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6CC92"/><stop offset="1" stop-color="#C08448"/></linearGradient></defs>
          <path d="M7.5 14H22.5Q22.5 23 15 28Q7.5 23 7.5 14z" fill="url(#n3-thp-a)" stroke="#2B2233" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M5 14Q5 6 15 6Q25 6 25 14Q25 16 22.6 16H7.4Q5 16 5 14z" fill="#8A5A34" stroke="#2B2233" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M8 12L11 9M11 14L15 9M15 14L19 9M19 14L22 11" stroke="#6A4022" stroke-width=".8" stroke-linecap="round"/>
          <path d="M15 6Q15 3 17.6 2" fill="none" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="11" cy="19" rx="1.2" ry="2.4" fill="#fff" opacity=".55"/></svg>`},
      {id: "tp-treehouse-lights", name: "Fairy Light Washi", kind: "tape", desc: "Leafy green washi strung with tiny colored fairy lights.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#9CCB74" opacity=".92"/>
          <path d="M4 6Q24 16 43 6Q62 16 82 6" fill="none" stroke="#4A6A34" stroke-width=".9"/>
          ${[[10, 9.6, "#FF7A8A"], [18, 12.2, "#FFD25A"], [26, 12.6, "#7AD8FF"], [34, 10.2, "#C9A0FF"], [52, 10.2, "#FF7A8A"], [60, 12.6, "#FFD25A"], [68, 12.2, "#7AD8FF"], [76, 9.6, "#9AE07A"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y + 3}" r="3.6" fill="${c}" opacity=".35"/><ellipse cx="${x}" cy="${y + 3}" rx="1.7" ry="2.3" fill="${c}"/><rect x="${x - 1}" y="${y}" width="2" height="1.6" fill="#4A6A34"/>`).join("")}
          <path d="M14 20C16 17 20 17 21 19C19 21 16 22 14 20zM44 21C46 18 50 18 51 20C49 22 46 23 44 21zM72 20C74 17 78 17 79 19C77 21 74 22 72 20z" fill="#5A9A3A"/>
          <path d="M5 3H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-treehouse", name: "Clubhouse Plank", desc: "Honey wood planks with fairy lights strung along the top and an oak leaf and acorn in the corner. Starlit at night."}
  });
})();
