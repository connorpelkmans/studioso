/* ===== module: 96-tp-japan.js ===== */
/* Theme Collections, Around the World */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  // a cherry blossom
  const sakura = (cx, cy, s, fill, sw = 1.4, mid = "#E8507A") => Array.from({length: 5}, (_, i) => { const a = -90 + i * 72;
    return `<path d="M0 -${f1(s * .12)}C${f1(s * .4)} -${f1(s * .3)} ${f1(s * .5)} -${f1(s * .82)} ${f1(s * .2)} -${f1(s)}L0 -${f1(s * .84)}L-${f1(s * .2)} -${f1(s)}C-${f1(s * .5)} -${f1(s * .82)} -${f1(s * .4)} -${f1(s * .3)} 0 -${f1(s * .12)}Z" transform="translate(${cx} ${cy}) rotate(${a + 90})" fill="${fill}" ${SOw(sw)}/>`; }).join("") + `<circle cx="${cx}" cy="${cy}" r="${f1(s * .2)}" fill="${mid}"/>`;
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";

  TP_DATA.push({
    theme: "japan",
    pack: {name: "Sakura Journey", items: {
      japan_fuji: `${lg("japan-tp-fj", "#8FAEDA", "#5E7CB4")}
        <path d="M2 56L22 18Q32 13 42 18L62 56Z" fill="url(#japan-tp-fj)" ${SO}/>
        <path d="M22 18Q32 13 42 18L49 31L44.6 34L41 29L37 35L32.6 29L28 35L23.4 29L19.6 34L15 31Z" fill="#FFFFFF" ${S2}/>
        <path d="M2 56Q16 46 30 52Q46 44 62 56Z" fill="#F7B0C5" ${S2}/>
        <circle cx="52" cy="11" r="5.6" fill="#FFD86A" ${S2}/>${spark(9, 12, 3.6, "#F7B0C5")}`,
      japan_pagoda: `${lg("japan-tp-pg", "#5A6680", "#38405A")}
        ${[0, 1, 2].map(i => { const y = 52 - i * 15, w = 18 - i * 3, rw = 30 - i * 4; return `<rect x="${32 - w / 2}" y="${y - 9}" width="${w}" height="9" fill="#E04A30" ${S2}/><rect x="${32 - w * .2}" y="${y - 7}" width="${f1(w * .4)}" height="7" fill="#4A3430"/><path d="M${32 - rw} ${y - 11}Q${32 - rw / 2} ${y - 8} ${32 - w / 2} ${y - 13}L${32 + w / 2} ${y - 13}Q${32 + rw / 2} ${y - 8} ${32 + rw} ${y - 11}L${32 + w * .3} ${y - 17}H${32 - w * .3}Z" fill="url(#japan-tp-pg)" ${S2}/>`; }).join("")}
        <path d="M32 19V5" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M32 19V5" stroke="#E6B23A" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M14 58H50" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>${sakura(52, 50, 7, "#FFC2D4", 1.2)}${sakura(11, 44, 5.4, "#FFD6E2", 1.1)}`,
      japan_sakura: `${sakura(32, 33, 25, "#FFC2D4", 2.2)}
        ${[0, 1, 2, 3, 4].map(i => { const a = (-90 + i * 72) * Math.PI / 180; return `<path d="M32 33L${f1(32 + Math.cos(a) * 9)} ${f1(33 + Math.sin(a) * 9)}" stroke="#E8507A" stroke-width="1.4" stroke-linecap="round"/><circle cx="${f1(32 + Math.cos(a) * 9.6)}" cy="${f1(33 + Math.sin(a) * 9.6)}" r="1.5" fill="#F2B53A"/>`; }).join("")}
        <circle cx="32" cy="33" r="5.6" fill="#FFE3EC" ${S2}/>${smile(32, 33.4, 1.8, 1.5)}<circle cx="29.2" cy="31.4" r="1.1" fill="${O}"/><circle cx="34.8" cy="31.4" r="1.1" fill="${O}"/>
        ${spark(56, 8, 4, "#FFD86B")}${spark(8, 56, 3, "#F28AAE")}`,
      japan_torii: `<path d="M5 13Q32 19 59 13L56 21H8Z" fill="#2B2233" ${S2}/>
        <rect x="8" y="21" width="48" height="4" fill="#E04A30" ${S2}/><rect x="10" y="28" width="44" height="5" rx="1" fill="#E04A30" ${S2}/>
        <rect x="15" y="21" width="7" height="38" fill="#E04A30" ${S2}/><rect x="42" y="21" width="7" height="38" fill="#E04A30" ${S2}/><rect x="29.5" y="21" width="5" height="7" fill="#E04A30" ${S2}/>
        <rect x="13.6" y="55" width="9.8" height="5" rx="1" fill="#2B2233"/><rect x="40.6" y="55" width="9.8" height="5" rx="1" fill="#2B2233"/>
        <path d="M17 26V54" stroke="#FF8A6A" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>${sakura(54, 44, 5, "#FFC2D4", 1)}`,
      japan_koinobori: `<path d="M8 4V62" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M8 4V62" stroke="#C89A5A" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="4" r="3" fill="#E6B23A" ${SOw(1.4)}/>
        ${[["#3A3A4A", 14, 44], ["#E0443A", 31, 38], ["#3A78C8", 47, 32]].map(([c, y, L]) => `<path d="M9 ${y - 6}Q${9 + L * .5} ${y - 9} ${9 + L} ${y - 5}L${9 + L - 5} ${y}L${9 + L} ${y + 5}Q${9 + L * .5} ${y + 9} 9 ${y + 6}Z" fill="${c}" ${S2}/><circle cx="15" cy="${y - 1}" r="3.4" fill="#fff" ${SOw(1.2)}/><circle cx="15" cy="${y - 1}" r="1.5" fill="${O}"/><path d="M${18 + L * .2} ${y - 4}q2 4 0 8M${18 + L * .45} ${y - 4}q2 4 0 8" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"/>`).join("")}`,
      japan_crane: `${lg("japan-tp-or", "#FFE3EC", "#F7A8C0")}
        <path d="M8 40L30 30L36 8L42 32L58 26L46 42L30 44Z" fill="url(#japan-tp-or)" ${SO}/>
        <path d="M30 30L30 44M36 8L34 38M42 32L46 42" fill="none" stroke="#D86A8A" stroke-width="1.2" opacity=".7"/>
        <path d="M8 40L4 32L10 34Z" fill="#F7A8C0" ${S2}/>
        <path d="M14 54Q32 50 50 54" fill="none" stroke="#9ECDE2" stroke-width="2.4" stroke-linecap="round"/>${spark(54, 10, 3.6, "#FFD86B")}`,
      japan_daruma: `${rg("japan-tp-dr", "#F2604A", "#B82A22", .4, .3)}
        <path d="M32 6C48 6 56 20 56 35C56 51 47 60 32 60C17 60 8 51 8 35C8 20 16 6 32 6Z" fill="url(#japan-tp-dr)" ${SO}/>
        <path d="M32 14C42 14 46 21 46 28C46 36 40 40 32 40C24 40 18 36 18 28C18 21 22 14 32 14Z" fill="#FFF6EC" ${S2}/>
        <path d="M21 23Q24 19 29 21M43 23Q40 19 35 21" fill="none" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="26.5" cy="28" r="3.6" fill="${O}"/><circle cx="37.5" cy="28" r="3.6" fill="#fff" stroke="${O}" stroke-width="1.4"/><circle cx="27.4" cy="26.8" r="1" fill="#fff"/>
        ${smile(32, 34, 2, 1.6)}<path d="M18 48Q32 42 46 48" fill="none" stroke="#F2C24A" stroke-width="2.4" stroke-linecap="round"/>${sakura(32, 51, 4.4, "#FFD86A", 1)}`,
      japan_badge: `${lg("japan-tp-bd", "#34477A", "#22305A")}
        <rect x="3" y="14" width="58" height="36" rx="10" fill="url(#japan-tp-bd)" ${SO}/>
        <path d="M5 44Q12 38 19 44T33 44T47 44T61 44V46Q61 50 57 50H7Q3 50 3 46Z" fill="#5A7AB8" opacity=".7"/>
        ${T("SUGOI!", 32, 37, 13, "#FFFFFF", 42)}
        ${sakura(54, 13, 7, "#FFC2D4", 1.4)}${sakura(9, 50, 5, "#FFD6E2", 1.2)}`
    }},
    pins: [
      {id: "tp-japan-sakura", name: "Sakura Pin", kind: "badge", desc: "A soft pink cherry blossom with a golden center.",
        svg: `<svg viewBox="0 0 30 30">${sakura(15, 15.4, 12.4, "#FFC2D4", 1)}
          ${[0, 1, 2, 3, 4].map(i => { const a = (-90 + i * 72) * Math.PI / 180; return `<circle cx="${f1(15 + Math.cos(a) * 4.4)}" cy="${f1(15.4 + Math.sin(a) * 4.4)}" r=".9" fill="#E6A82A"/>`; }).join("")}
          <ellipse cx="11" cy="8.6" rx="2" ry="1.1" fill="#fff" opacity=".7" transform="rotate(-30 11 8.6)"/></svg>`},
      {id: "tp-japan-washi", name: "Seigaiha Washi", kind: "tape", desc: "Indigo washi tape printed with ocean waves and drifting petals.",
        svg: `<svg viewBox="0 0 86 26"><path d="${tapeEdge}" fill="#2E3E66" opacity=".9"/>
          ${[0, 1, 2, 3, 4, 5, 6].map(i => [0, 1].map(j => { const x = 8 + i * 12 + j * 6, y = 10 + j * 8; return `<path d="M${x - 6} ${y}A6 6 0 0 1 ${x + 6} ${y}M${x - 4} ${y}A4 4 0 0 1 ${x + 4} ${y}M${x - 2} ${y}A2 2 0 0 1 ${x + 2} ${y}" fill="none" stroke="#9AB8E8" stroke-width=".8" opacity=".75"/>`; }).join("")).join("")}
          ${[[18, 8], [46, 16], [70, 9]].map(([x, y]) => sakura(x, y, 4, "#FFC2D4", .6)).join("")}</svg>`}
    ],
    card: {id: "tp-japan", name: "Sakura Fuji", desc: "Soft washi paper with Mount Fuji and a cherry branch in the corner and a red bridge over the water below. Night indigo in dark mode."}
  });
})();
/* end of module 96-tp-japan.js */


