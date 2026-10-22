/* ===== module: 96-tp-m2.js ===== */
/* Theme Collections, batch m2: compsci, engineering, education, comms */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S16 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const rot = (n, f) => Array.from({length: n}, (_, i) => f(i * 360 / n, i)).join("");
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + (cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const scal = (cx, cy, r, n, b) => { let d = ""; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1)), c = [cx + (r + b) * Math.cos(am), cy + (r + b) * Math.sin(am)].map(v => v.toFixed(1)); d += (i ? "" : `M${p(a0)}`) + `Q${c} ${p(a1)}`; } return d + "z"; };
  // a gear outline: n teeth between radius r (root) and R (tip)
  const gear = (cx, cy, R, r, n, off = 0) => { const st = Math.PI * 2 / n, pts = []; for (let i = 0; i < n; i++) { const a = i * st - Math.PI / 2 + off; [[-.29, r], [-.15, R], [.15, R], [.29, r]].forEach(([f, q]) => pts.push((cx + q * Math.cos(a + f * st)).toFixed(1) + " " + (cy + q * Math.sin(a + f * st)).toFixed(1))); } return "M" + pts.join("L") + "z"; };
  // a thick outlined stroke (dark under, colour over)
  const tube = (d, w, c) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const mouth = (x, y, w = 2, sw = 1.8) => `<path d="M${x - w} ${y}q${w} ${w * .85} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const heart = (x, y, s, c, ex = "") => `<path d="M${x} ${y + s * .9}C${x - s * 1.6} ${y - s * .1} ${x - s * .9} ${y - s * 1.3} ${x} ${y - s * .45}C${x + s * .9} ${y - s * 1.3} ${x + s * 1.6} ${y - s * .1} ${x} ${y + s * .9}z" fill="${c}" ${ex}/>`;

  /* ================= CODE NIGHT (compsci) ================= */
  TP_DATA.push({
    theme: "compsci",
    pack: {name: "Byte Buddies", items: {
      compsci_laptop: `${lg("cmp-lp-l", "#E4E9F4", "#A9B4CC")}${rg("cmp-lp-s", "#3B4F86", "#1B2246", .4, .3)}${lg("cmp-lp-b", "#EEF1F8", "#B3BDD3")}
        <rect x="9" y="7" width="46" height="42" rx="6" fill="url(#cmp-lp-l)" ${SO}/>
        <rect x="13.5" y="11.5" width="37" height="33" rx="3.5" fill="url(#cmp-lp-s)" stroke="${O}" stroke-width="1.6"/>
        <g stroke-linecap="round" stroke-width="2.4"><path d="M18 17h7" stroke="#FF8FB8"/><path d="M28 17h10" stroke="#7CF0C8"/><path d="M41 17h4" stroke="#FFD86B"/><path d="M22 39.5h5" stroke="#9FB6FF"/><path d="M30 39.5h12" stroke="#7CF0C8" opacity=".75"/></g>
        <path d="M21 28q3-3.6 6 0M37 28q3-3.6 6 0" fill="none" stroke="#7CF0C8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M29.5 31q2.5 2.6 5 0" fill="none" stroke="#7CF0C8" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="20" cy="32.5" rx="2.6" ry="1.6" fill="#FF8FB8" opacity=".8"/><ellipse cx="44" cy="32.5" rx="2.6" ry="1.6" fill="#FF8FB8" opacity=".8"/>
        <path d="M44 14.5l3.5 0M47.5 14.5v3.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>
        <path d="M7 49H57L60.5 54.5Q61 58 57.5 58H6.5Q3 58 3.5 54.5z" fill="url(#cmp-lp-b)" ${SO}/>
        <rect x="26" y="52" width="12" height="3" rx="1.5" fill="#97A3BE"/>`,
      compsci_duck: `${rg("cmp-dk-b", "#FFF4A8", "#F5BD24", .4, .3)}${lg("cmp-dk-k", "#FFB15A", "#F07A2A")}
        <path d="M15 41L4 30Q3 28.5 5 28.6L19 33z" fill="url(#cmp-dk-b)" ${SO}/>
        <ellipse cx="32" cy="45" rx="26" ry="14" fill="url(#cmp-dk-b)" ${SO}/>
        <path d="M13 44Q15 37 25 38.5Q30 44 25 49Q17 51 13 44z" fill="#F7C232" ${S16}/><path d="M17 44q3-2 6-1" fill="none" stroke="#FFF3A8" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="38" cy="22" r="15" fill="url(#cmp-dk-b)" ${SO}/>
        <path d="M33 25.5Q38.5 22 44 25.5Q38.5 31.5 33 25.5z" fill="url(#cmp-dk-k)" ${SOw(1.8)}/>
        ${EYES(32, 45, 19.5, 2.5)}${blush(28.5, 48.5, 25.5)}
        <path d="M27 14q-3 1-3.5 4.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
        <path d="M37 7.2q-1-4 2.5-5q-.5 2.6 1.8 3.4" fill="#F5BD24" ${SOw(1.5)}/>
        <path d="M14 55q5-2.4 10 0M40 56q5-2.4 10 0" fill="none" stroke="#6FC8E8" stroke-width="2" stroke-linecap="round"/>
        ${spark(56, 10, 4, "#7CF0C8")}`,
      compsci_bug: `${rg("cmp-bg-s", "#FFA79A", "#E2504E", .35, .3)}${lg("cmp-bg-h", "#6F62A8", "#3F3570")}
        <g stroke="${O}" stroke-width="2.4" stroke-linecap="round"><path d="M14 36L7 32M13 44L6 45M15 52L9 57M50 36L57 32M51 44L58 45M49 52L55 57"/></g>
        <path d="M27 13Q24 7 20 6M37 13Q40 7 44 6" fill="none" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="19.5" cy="5.8" r="2.6" fill="#7CF0C8" ${S16}/><circle cx="44.5" cy="5.8" r="2.6" fill="#7CF0C8" ${S16}/>
        <circle cx="32" cy="41" r="19" fill="url(#cmp-bg-s)" ${SO}/>
        <path d="M32 27V59.5" stroke="${O}" stroke-width="2"/>
        <g fill="#5A2230" opacity=".85"><circle cx="22" cy="40" r="3.4"/><circle cx="25" cy="51" r="2.6"/><circle cx="42" cy="40" r="3.4"/><circle cx="39" cy="51" r="2.6"/></g>
        <ellipse cx="22" cy="31" rx="4" ry="2.2" fill="#fff" opacity=".55" transform="rotate(-30 22 31)"/>
        <circle cx="32" cy="22" r="12" fill="url(#cmp-bg-h)" ${SO}/>
        <circle cx="27.3" cy="21" r="3.7" fill="#fff"/><circle cx="36.7" cy="21" r="3.7" fill="#fff"/>
        <circle cx="27.8" cy="21.6" r="2.1" fill="${O}"/><circle cx="37.2" cy="21.6" r="2.1" fill="${O}"/><circle cx="28.6" cy="20.7" r=".8" fill="#fff"/><circle cx="38" cy="20.7" r=".8" fill="#fff"/>
        <path d="M30 27q2 1.8 4 0" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="23" cy="26.5" rx="2" ry="1.3" fill="#FF8FB8" opacity=".85"/><ellipse cx="41" cy="26.5" rx="2" ry="1.3" fill="#FF8FB8" opacity=".85"/>`,
      compsci_coffee: `${lg("cmp-cf-m", "#9FEBD8", "#3DB396")}
        ${tube("M44 31h3.5a8.5 8.5 0 0 1 0 17H44", 4, "#5CC7AC")}
        <path d="M7 21H45V50Q45 58 37 58H15Q7 58 7 50z" fill="url(#cmp-cf-m)" ${SO}/>
        <ellipse cx="26" cy="21" rx="19" ry="4.2" fill="#7A4A2E" ${S2}/>
        <ellipse cx="22" cy="20.2" rx="7" ry="1.4" fill="#A86B44"/>
        ${EYES(19, 33, 36, 2.5)}${blush(15, 37, 41)}${mouth(26, 40, 2.2)}
        <path d="M11 26v14" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
        ${tube("M20 15q-3.5-3.5 0-6.5t0-6", 2.2, "#fff")}${tube("M32 15q-3.5-3.5 0-6.5t0-6", 2.2, "#fff")}
        <g font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="10" fill="#1E6B5B" text-anchor="middle"><text x="26" y="54">{ }</text></g>`,
      compsci_chip: `${lg("cmp-ch-b", "#3FA89C", "#1D5E5A")}${lg("cmp-ch-d", "#E8FFF7", "#B8EEDD")}
        <g fill="#F2C24A" stroke="${O}" stroke-width="1.5" stroke-linejoin="round">
          ${[21, 28.5, 36, 43.5].map(c => `<rect x="${c - 2}" y="5" width="4" height="9" rx="1.2"/><rect x="${c - 2}" y="50" width="4" height="9" rx="1.2"/><rect x="5" y="${c - 2}" width="9" height="4" rx="1.2"/><rect x="50" y="${c - 2}" width="9" height="4" rx="1.2"/>`).join("")}</g>
        <rect x="11" y="11" width="42" height="42" rx="8" fill="url(#cmp-ch-b)" ${SO}/>
        <circle cx="17" cy="17" r="1.8" fill="#7CF0C8"/>
        <rect x="19" y="19" width="26" height="26" rx="5" fill="url(#cmp-ch-d)" ${S16}/>
        ${EYES(27, 37, 30, 2.3)}${blush(23.5, 40.5, 35, 2.2, 1.4)}${mouth(32, 35, 1.9)}
        <path d="M14 23v-6q0-3 3-3h6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>`,
      compsci_terminal: `${lg("cmp-tm-w", "#2E3768", "#191E3C")}${lg("cmp-tm-t", "#F3F5FB", "#D3DAEA")}
        <rect x="4" y="9" width="56" height="46" rx="8" fill="url(#cmp-tm-w)" ${SO}/>
        <path d="M5.3 20V16.5Q5.3 10.3 11.5 10.3H52.5Q58.7 10.3 58.7 16.5V20z" fill="url(#cmp-tm-t)"/>
        <path d="M4 20H60" stroke="${O}" stroke-width="2"/>
        <circle cx="11.5" cy="15" r="2.3" fill="#FF7A8A"/><circle cx="18.5" cy="15" r="2.3" fill="#FFD25A"/><circle cx="25.5" cy="15" r="2.3" fill="#5ED8A8"/>
        <path d="M13 29l8 6.5-8 6.5" fill="none" stroke="#7CF0C8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="25" y="40" width="12" height="3.4" rx="1.7" fill="#7CF0C8"/>
        <path d="M13 49h9M25 49h14" stroke="#8FA0D8" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
        ${heart(48, 34, 5.5, "#FF8FB8")}
        <ellipse cx="46.2" cy="31.6" rx="1.6" ry="1" fill="#fff" opacity=".6"/>`,
      compsci_mouse: `${rg("cmp-ms-b", "#F4F1FF", "#A99BE6", .4, .3)}
        <circle cx="18" cy="17" r="8" fill="url(#cmp-ms-b)" ${SO}/><circle cx="46" cy="17" r="8" fill="url(#cmp-ms-b)" ${SO}/>
        <circle cx="18" cy="17" r="4.4" fill="#FFB3C8"/><circle cx="46" cy="17" r="4.4" fill="#FFB3C8"/>
        ${tube("M45 53q8 3 11-3t-3-9", 2, "#C9BEF2")}
        <ellipse cx="32" cy="38" rx="17" ry="20" fill="url(#cmp-ms-b)" ${SO}/>
        <path d="M15.4 33Q32 37 48.6 33M32 18.2V35" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="29.5" y="23" width="5" height="8" rx="2.5" fill="#FF8FB8" ${SOw(1.5)}/>
        ${EYES(25, 39, 42, 2.4)}${blush(21, 43, 47, 2.4, 1.5)}${mouth(32, 46.5, 2)}
        <ellipse cx="22" cy="25" rx="3.6" ry="2" fill="#fff" opacity=".7" transform="rotate(-40 22 25)"/>`,
      compsci_hello: `${lg("cmp-hw-b", "#3A4682", "#1C2148")}
        <path d="M15.5 13H48.5A12 12 0 0 1 60.5 25V37A12 12 0 0 1 48.5 49H22L9 57L10.4 47.9A12 12 0 0 1 3.5 37V25A12 12 0 0 1 15.5 13z" fill="url(#cmp-hw-b)" ${SO}/>
        <rect x="7.5" y="17" width="49" height="28" rx="8.5" fill="none" stroke="#7CF0C8" stroke-width="1.3" stroke-dasharray="2 3" stroke-linecap="round" opacity=".55"/>
        ${T("HELLO", 32, 29.6, 11.5, "#7CF0C8", 34)}${T("WORLD!", 32, 42.4, 11.5, "#FFB3D0", 40)}
        ${spark(55, 8, 4, "#FFD86B")}${spark(8, 9, 2.6, "#7CF0C8")}`
    }},
    pins: [
      {id: "tp-compsci-chip", name: "Chip Magnet", kind: "badge", desc: "A tiny teal microchip with gold pins and a glowing LED.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="cmp-pc-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FC2B4"/><stop offset="1" stop-color="#1D5E5A"/></linearGradient><radialGradient id="cmp-pc-l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#EFFFF9"/><stop offset="1" stop-color="#7CF0C8"/></radialGradient></defs>
          <g fill="#F2C24A" stroke="#7A5A10" stroke-width=".7">${[9.5, 15, 20.5].map(c => `<rect x="${c - 1.4}" y="1.5" width="2.8" height="5" rx=".8"/><rect x="${c - 1.4}" y="23.5" width="2.8" height="5" rx=".8"/><rect x="1.5" y="${c - 1.4}" width="5" height="2.8" rx=".8"/><rect x="23.5" y="${c - 1.4}" width="5" height="2.8" rx=".8"/>`).join("")}</g>
          <rect x="5" y="5" width="20" height="20" rx="4" fill="url(#cmp-pc-b)" stroke="#123E3B" stroke-width="1.1"/>
          <rect x="9.5" y="9.5" width="11" height="11" rx="2.5" fill="#164A47" stroke="#7CF0C8" stroke-width=".8" stroke-opacity=".7"/>
          <circle cx="15" cy="15" r="3" fill="url(#cmp-pc-l)"/>
          <path d="M7.5 11V9q0-1.5 1.5-1.5h2" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/></svg>`},
      {id: "tp-compsci-binary", name: "Binary Washi", kind: "tape", desc: "Mint washi tape printed with ones, zeros and little code brackets.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z" fill="#9FE3CF" opacity=".85"/>
          <g font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="8.5" fill="#1E6B5B" opacity=".75"><text x="9" y="11">1</text><text x="15" y="20">0</text><text x="23" y="11">1</text><text x="51" y="20">0</text><text x="58" y="11">1</text><text x="65" y="20">1</text><text x="72" y="11">0</text></g>
          <g font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="11" fill="#FF7FAE"><text x="31" y="17.5">&lt;/&gt;</text></g>
          <path d="M5 3.5H81" stroke="#fff" stroke-width="1.2" opacity=".45"/></svg>`}
    ],
    card: {id: "tp-compsci", name: "Circuit Board", desc: "A clean mint circuit board with glowing traces and a little chip in the corner, lit up in neon after dark."}
  });

  /* ================= GEAR WORKS (engineering) ================= */
  TP_DATA.push({
    theme: "engineering",
    pack: {name: "Gear Gang", items: {
      engineering_gears: `${rg("eng-gr-a", "#FFD98A", "#E08A2A", .4, .3)}${rg("eng-gr-b", "#9FE0D8", "#3A9A92", .4, .3)}${lg("eng-gr-f", "#FFF3D6", "#FFD98A")}
        <path d="${gear(47, 17, 13, 10, 8, .2)}" fill="url(#eng-gr-b)" ${SO}/>
        <circle cx="47" cy="17" r="4.2" fill="#E9FFFB" ${S16}/>
        <path d="${gear(27, 38, 22, 17.5, 11)}" fill="url(#eng-gr-a)" ${SO}/>
        <circle cx="27" cy="38" r="12.5" fill="url(#eng-gr-f)" ${S16}/>
        ${EYES(22.5, 31.5, 37, 2.4)}${blush(19, 35, 42, 2.4, 1.5)}${mouth(27, 41.5, 2)}
        <ellipse cx="16" cy="25" rx="3.4" ry="1.8" fill="#fff" opacity=".6" transform="rotate(-40 16 25)"/>
        ${spark(57, 39, 3.6, "#F2C24A")}${spark(52, 50, 2.4, "#3A9A92")}`,
      engineering_hardhat: `${rg("eng-hh-d", "#FFF09A", "#F2B21A", .4, .25)}${lg("eng-hh-b", "#FFD84A", "#E39A12")}
        <path d="M10 44C10 25 19 14 32 14C45 14 54 25 54 44z" fill="url(#eng-hh-d)" ${SO}/>
        <path d="M26 14.8C24 22 23.5 33 24 44M38 14.8C40 22 40.5 33 40 44" fill="none" stroke="#D99A10" stroke-width="2" stroke-linecap="round"/>
        <path d="M4 48.5Q4 43.5 10 43.5H54Q60 43.5 60 48.5Q60 53 54 53H10Q4 53 4 48.5z" fill="url(#eng-hh-b)" ${SO}/>
        <path d="${gear(32, 31, 6.8, 5, 8)}" fill="#fff" stroke="#D99A10" stroke-width="1.3" stroke-linejoin="round"/>
        <circle cx="32" cy="31" r="2" fill="#F2B21A"/>
        <path d="M16 31Q17 23 23 19" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
        <path d="M10 47h44" stroke="#FFF2B0" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        ${spark(56, 12, 4, "#F2C24A")}${spark(8, 20, 2.6, "#7CC8E8")}`,
      engineering_bolt: `${lg("eng-bt-h", "#E9F0F8", "#9AAEC6")}${lg("eng-bt-s", "#D9E3EF", "#8EA3BC", 1, 0)}
        <rect x="22.5" y="33" width="19" height="27" rx="4" fill="url(#eng-bt-s)" ${SO}/>
        <g stroke="#6F83A0" stroke-width="1.8" stroke-linecap="round"><path d="M23.5 39.5l17-3M23.5 45.5l17-3M23.5 51.5l17-3M23.5 57.5l17-3"/></g>
        <ellipse cx="32" cy="33" rx="17" ry="3.6" fill="#C9D5E4" ${S2}/>
        <path d="M11 9Q11 5 15 5H49Q53 5 53 9V27Q53 31 49 31H15Q11 31 11 27z" fill="url(#eng-bt-h)" ${SO}/>
        <path d="M22 5.5V30.5M42 5.5V30.5" stroke="#8EA3BC" stroke-width="1.6"/>
        ${EYES(27, 37, 17, 2.3)}${blush(24.5, 39.5, 22.5, 2, 1.3)}${mouth(32, 21.5, 1.8)}
        <path d="M14.5 10v14" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>`,
      engineering_blueprint: `${lg("eng-bp-p", "#5A9BE6", "#2D63B5")}${lg("eng-bp-r", "#8DBDF2", "#3E78C8", 1, 0)}${lg("eng-bp-c", "#FFD25A", "#E89A2A")}
        <path d="M12 9H56Q60 9 60 13V49Q60 53 56 53H12z" fill="url(#eng-bp-p)" ${SO}/>
        <g stroke="#CFE4FF" stroke-width=".8" opacity=".35"><path d="M20 10V52M28 10V52M36 10V52M44 10V52M52 10V52M13 17H59M13 25H59M13 33H59M13 41H59M13 49H59"/></g>
        <g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 40H55M22 40L28 27H45L51 40M28 27L32 40L37 27L41 40L45 27M24 40V47M49 40V47"/></g>
        <path d="M17 44q4-2 8 0" fill="none" stroke="#CFE4FF" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="4" y="5" width="10" height="52" rx="5" fill="url(#eng-bp-r)" ${SO}/>
        <ellipse cx="9" cy="8" rx="3.6" ry="1.6" fill="#1F4E94"/><path d="M7 14v34" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>
        <g transform="rotate(-40 50 20)"><rect x="40" y="17" width="20" height="6" rx="1.4" fill="url(#eng-bp-c)" ${S16}/><path d="M60 17L65.5 20L60 23z" fill="#F6DDB4" ${S16}/><path d="M64 19.2L65.5 20L64 20.8z" fill="${O}"/><rect x="37" y="17" width="4" height="6" rx="1.2" fill="#FF8FA8" ${S16}/></g>`,
      engineering_bridge: `${lg("eng-br-w", "#8CD0EE", "#3A8EC4")}${lg("eng-br-d", "#F08A5A", "#C85A30")}
        <path d="M4 47Q32 43 60 47V54Q60 59 55 59H9Q4 59 4 54z" fill="url(#eng-br-w)" ${SO}/>
        <path d="M10 53q4-2 8 0t8 0M38 54q4-2 8 0t8 0" fill="none" stroke="#E2F5FF" stroke-width="2" stroke-linecap="round"/>
        ${tube("M10 38L18 19H46L54 38M18 19L25 38L32 19L39 38L46 19", 3.2, "#E8693A")}
        <rect x="3.5" y="36" width="57" height="7" rx="3" fill="url(#eng-br-d)" ${SO}/>
        <rect x="12" y="43" width="6" height="7" fill="#B6C2D2" ${S16}/><rect x="46" y="43" width="6" height="7" fill="#B6C2D2" ${S16}/>
        <g fill="#F2C24A" stroke="${O}" stroke-width="1.2"><circle cx="18" cy="19" r="2"/><circle cx="32" cy="19" r="2"/><circle cx="46" cy="19" r="2"/></g>
        <path d="M7 39h50" stroke="#FFD2B8" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
        ${spark(56, 9, 4, "#F2C24A")}${spark(9, 13, 2.6, "#7CC8E8")}`,
      engineering_protractor: `${lg("eng-pt-b", "#C7F2E8", "#6FCDB8")}
        <path d="M5 47A27 27 0 0 1 59 47V51Q59 54 56 54H8Q5 54 5 51z" fill="url(#eng-pt-b)" ${SO}/>
        <g stroke="#2E8C79" stroke-width="1.4" stroke-linecap="round">${Array.from({length: 13}, (_, i) => { const a = Math.PI + i * Math.PI / 12, l = i % 3 ? 3 : 5.5; return `<path d="M${(32 + 24.5 * Math.cos(a)).toFixed(1)} ${(47 + 24.5 * Math.sin(a)).toFixed(1)}L${(32 + (24.5 - l) * Math.cos(a)).toFixed(1)} ${(47 + (24.5 - l) * Math.sin(a)).toFixed(1)}"/>`; }).join("")}</g>
        <path d="M5.5 47H58.5" stroke="${O}" stroke-width="1.6"/>
        <circle cx="32" cy="50.5" r="1.8" fill="#2E8C79"/>
        ${EYES(25, 39, 35, 2.4)}${blush(21, 43, 40, 2.4, 1.5)}${mouth(32, 39.5, 2.2)}
        <path d="M13 37Q16 27 25 23" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        ${spark(56, 12, 4, "#F2C24A")}${spark(9, 13, 2.6, "#E8693A")}`,
      engineering_toolbox: `${lg("eng-tb-b", "#FF8A6E", "#D9473A")}${lg("eng-tb-l", "#E8604C", "#B83A30")}
        <rect x="14" y="8" width="4.5" height="16" rx="1.5" fill="#F2C24A" ${S16}/><path d="M16.2 6.5v-3" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        <g transform="rotate(14 47 15)"><rect x="43" y="5" width="7" height="20" rx="1.5" fill="#7CD3C4" ${S16}/><path d="M43.5 9h3M43.5 13h2M43.5 17h3M43.5 21h2" stroke="#2E8C79" stroke-width="1.1" stroke-linecap="round"/></g>
        ${tube("M23 24V17Q23 13 27 13H37Q41 13 41 17V24", 3, "#B6C2D2")}
        <rect x="6" y="24" width="52" height="33" rx="6" fill="url(#eng-tb-b)" ${SO}/>
        <path d="M6.5 33.5H57.5" stroke="${O}" stroke-width="2"/>
        <rect x="27" y="29.5" width="10" height="7" rx="2" fill="#F2C24A" ${S16}/>
        <path d="M10 28h12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>
        ${EYES(24, 40, 44, 2.5)}${blush(19, 45, 49, 2.6, 1.6)}${mouth(32, 48, 2.4)}`,
      engineering_buildit: `${lg("eng-bi-b", "#FFE36A", "#F5B81E")}<defs><clipPath id="eng-bi-c"><rect x="4" y="12" width="56" height="40" rx="9"/></clipPath></defs>
        <rect x="4" y="12" width="56" height="40" rx="9" fill="url(#eng-bi-b)"/>
        <g clip-path="url(#eng-bi-c)" fill="#2F3A5A">${Array.from({length: 11}, (_, i) => `<path d="M${i * 7 - 4} 12h3.6l-5 7h-3.6zM${i * 7 - 4} 45h3.6l-5 7h-3.6z"/>`).join("")}</g>
        <rect x="4" y="12" width="56" height="40" rx="9" fill="none" ${SO}/>
        <path d="M4.5 19H59.5M4.5 45H59.5" stroke="${O}" stroke-width="1.6"/>
        ${T("BUILD IT!", 32, 36.6, 12, "#2F3A5A", 46)}
        ${spark(8, 6.5, 3, "#F2C24A")}${spark(57, 58, 3, "#3A9A92")}`
    }},
    pins: [
      {id: "tp-engineering-gear", name: "Brass Gear Pin", kind: "badge", desc: "A shiny brass gear pin with a teal hub.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="eng-pg-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFE7A6"/><stop offset="1" stop-color="#C98A1A"/></radialGradient></defs>
          <path d="${gear(15, 15, 13.5, 10.5, 10)}" fill="url(#eng-pg-g)" stroke="#7A5210" stroke-width="1.1" stroke-linejoin="round"/>
          <circle cx="15" cy="15" r="6.5" fill="none" stroke="#B07A18" stroke-width="1"/>
          <circle cx="15" cy="15" r="3.6" fill="#3A9A92" stroke="#1F5E58" stroke-width="1"/>
          <ellipse cx="9" cy="8.5" rx="2.6" ry="1.4" fill="#fff" opacity=".7" transform="rotate(-40 9 8.5)"/></svg>`},
      {id: "tp-engineering-wrench", name: "Wrench Clip", kind: "clip", desc: "A little steel wrench that hooks over the edge of the note.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="eng-pw-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EEF3FA"/><stop offset=".55" stop-color="#AFC0D6"/><stop offset="1" stop-color="#6F83A0"/></linearGradient></defs>
          <path d="M8 13H14V44Q14 47.5 11 47.5Q8 47.5 8 44z" fill="url(#eng-pw-g)" stroke="#3E4C66" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M7.5 2.4L7.5 6.5Q7.5 8.5 9.5 8.5H12.5Q14.5 8.5 14.5 6.5L14.5 2.4A8 8 0 1 1 7.5 2.4z" fill="url(#eng-pw-g)" stroke="#3E4C66" stroke-width="1.1" stroke-linejoin="round"/>
          <rect x="8.6" y="13" width="4.8" height="3" fill="#C9D5E4"/>
          <circle cx="11" cy="42.5" r="1.6" fill="#fff" stroke="#3E4C66" stroke-width=".8"/>
          <rect x="9" y="22" width="4" height="12" rx="2" fill="#E8693A" stroke="#8A3A1E" stroke-width=".7"/>
          <path d="M9.5 18v2" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></svg>`}
    ],
    card: {id: "tp-engineering", name: "Drafting Sheet", desc: "Pale blue drafting paper with turning gears and a pencil sketch of a truss bridge; blueprint blue after dark."}
  });

  /* ================= SUNNY CLASSROOM (education) ================= */
  TP_DATA.push({
    theme: "education",
    pack: {name: "Gold Star Club", items: {
      education_books: `${lg("edu-bk-a", "#7FB8F0", "#3E7BC8")}${lg("edu-bk-b", "#FF9CB8", "#E0577E")}${lg("edu-bk-c", "#9FE08A", "#4FA552")}${rg("edu-bk-p", "#FF8A7A", "#D9312E", .35, .3)}
        <rect x="4" y="47" width="56" height="12" rx="3" fill="url(#edu-bk-a)" ${SO}/><path d="M53 49.5v7" stroke="#fff" stroke-width="3" opacity=".8"/>
        <rect x="9" y="36" width="47" height="11.5" rx="3" fill="url(#edu-bk-b)" ${SO}/><path d="M13 38.5v6.5" stroke="#fff" stroke-width="3" opacity=".8"/>
        <rect x="6" y="25" width="48" height="11.5" rx="3" fill="url(#edu-bk-c)" ${SO}/><path d="M47 27.5v6.5" stroke="#fff" stroke-width="3" opacity=".8"/>
        <path d="M20 41.6h26" stroke="#FFE0EA" stroke-width="2" stroke-linecap="round"/>
        ${EYES(15, 27, 30.5, 2)}<path d="M19 33q2 1.6 4 0" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        <g transform="translate(20.5 0.6) scale(.92)"><path d="M15 9Q15 4.5 18 2" fill="none" stroke="#6B3E22" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M15 9C12 6.5 5 6.5 3.5 13C2 20 7 28 11 28C13 28 14 27 15 27C16 27 17 28 19 28C23 28 28 20 26.5 13C25 6.5 18 6.5 15 9z" fill="url(#edu-bk-p)" ${S2}/>
        <path d="M16.5 6Q21 1 25.5 3.5Q21 8 16.5 6z" fill="#7CC47A" ${SOw(1.4)}/></g>
        <ellipse cx="27.5" cy="13.5" rx="1.6" ry="2.8" fill="#fff" opacity=".6" transform="rotate(20 27.5 13.5)"/>`,
      education_star: `${rg("edu-st-g", "#FFF3A8", "#F5B21E", .4, .35)}
        <path d="${star(32, 35, 28, 14, 5)}" fill="url(#edu-st-g)" ${SO}/>
        <path d="${star(32, 35, 20, 10, 5)}" fill="none" stroke="#FFF6C8" stroke-width="1.6" stroke-linejoin="round" opacity=".8"/>
        ${EYES(26, 38, 35, 2.6)}${blush(22, 42, 41, 2.8, 1.8)}${mouth(32, 40, 2.4, 2)}
        <ellipse cx="30" cy="17" rx="1.4" ry="3.4" fill="#fff" opacity=".7" transform="rotate(20 30 17)"/>
        ${spark(56, 8, 4, "#FF8FB8")}${spark(8, 12, 3, "#7CC8E8")}`,
      education_chalkboard: `${lg("edu-cb-f", "#D9A066", "#A86A36")}${lg("edu-cb-g", "#4E8A62", "#2F6346")}
        <path d="M18 48L11 61M46 48L53 61" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M18 48L11 61M46 48L53 61" stroke="#C88A50" stroke-width="3" stroke-linecap="round"/>
        <rect x="4" y="5" width="56" height="42" rx="5" fill="url(#edu-cb-f)" ${SO}/>
        <rect x="9" y="10" width="46" height="32" rx="2.5" fill="url(#edu-cb-g)" stroke="#7A4A22" stroke-width="1.4"/>
        <text x="25" y="27" text-anchor="middle" font-family="Comic Sans MS,Chalkboard SE,Lexend,Arial,sans-serif" font-weight="700" font-size="11" fill="#F4FFF6" textLength="22" lengthAdjust="spacingAndGlyphs">ABC</text>
        <text x="25" y="38.5" text-anchor="middle" font-family="Comic Sans MS,Chalkboard SE,Lexend,Arial,sans-serif" font-weight="700" font-size="8" fill="#FFE58A" textLength="22" lengthAdjust="spacingAndGlyphs">1+1=2</text>
        <path d="${star(45, 21, 5.5, 2.6, 5)}" fill="none" stroke="#FFE58A" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M45 38.5C39 34.5 41 29.5 45 32C49 29.5 51 34.5 45 38.5z" fill="none" stroke="#FFC2D4" stroke-width="1.4" stroke-linejoin="round"/>
        <rect x="16" y="43.2" width="9" height="2.6" rx="1.3" fill="#fff"/><rect x="28" y="43.2" width="6" height="2.6" rx="1.3" fill="#FFB3C8"/>`,
      education_crayons: `${lg("edu-cr-b", "#8FDA7A", "#45A050")}
        <g ${S16}>
          <path d="M14 30V14L18.5 5L23 14V30z" fill="#F0605A"/><path d="M14 14H23" stroke="${O}"/>
          <path d="M27.5 28V11L32 2.5L36.5 11V28z" fill="#4E9BEA"/><path d="M27.5 11H36.5" stroke="${O}"/>
          <path d="M41 30V14L45.5 5L50 14V30z" fill="#FFC93A"/><path d="M41 14H50" stroke="${O}"/></g>
        <path d="M15.5 19h6M29 16h6M42.5 19h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        <path d="M9 27Q16 23 22.5 27Q32 21 41.5 27Q48 23 55 27L53 55Q52.5 59 48.5 59H15.5Q11.5 59 11 55z" fill="url(#edu-cr-b)" ${SO}/>
        <path d="M12.5 33H51.5" stroke="#E9FFE0" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
        ${EYES(24, 40, 43, 2.5)}${blush(19.5, 44.5, 48, 2.6, 1.6)}${mouth(32, 47, 2.4)}`,
      education_globe: `${rg("edu-gl-o", "#A9E2FF", "#3A8EDB", .35, .3)}${lg("edu-gl-s", "#E8B04A", "#B67A1E")}
        <ellipse cx="32" cy="57" rx="15" ry="4" fill="url(#edu-gl-s)" ${SO}/>
        <path d="M32 49V54" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 49V54" stroke="#E8B04A" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="32" cy="27" r="19" fill="url(#edu-gl-o)" ${SO}/>
        <g fill="#7CCB6A" stroke="#3F8A3A" stroke-width="1.1" stroke-linejoin="round">
          <path d="M17 18Q21 11 28 12Q30 16 26 18Q27 23 21 24Q17 23 17 18z"/><path d="M36 10Q44 11 47 17Q43 19 40 17Q36 16 36 10z"/>
          <path d="M38 36Q45 33 47 38Q44 44 39 43Q36 40 38 36z"/><path d="M18 36Q22 35 23 39Q21 42 18 40z"/></g>
        ${EYES(26, 38, 28, 2.4)}${blush(22, 42, 33, 2.4, 1.5)}${mouth(32, 32.4, 2)}
        ${tube("M15 12A23 23 0 0 0 49 44", 2.4, "#E8B04A")}
        <ellipse cx="23" cy="15" rx="3.4" ry="2" fill="#fff" opacity=".6" transform="rotate(-40 23 15)"/>`,
      education_backpack: `${lg("edu-bp-b", "#FFA77A", "#E8673E")}${lg("edu-bp-p", "#FFD08A", "#F5A04A")}
        ${tube("M24 13V9Q24 5 28 5H36Q40 5 40 9V13", 2.6, "#E8673E")}
        <g transform="rotate(18 47 14)" ${S16}><rect x="44" y="9" width="6" height="14" fill="#FFC93A"/><path d="M44 9L47 3L50 9z" fill="#F6DDB4"/><path d="M46.1 4.8L47 3L47.9 4.8z" fill="${O}" stroke="none"/></g>
        <path d="M12 26Q12 12 32 12Q52 12 52 26V53Q52 59 46 59H18Q12 59 12 53z" fill="url(#edu-bp-b)" ${SO}/>
        <path d="M16 23Q17 16 26 15" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
        <rect x="18" y="38" width="28" height="17" rx="6" fill="url(#edu-bp-p)" ${S2}/>
        <path d="M18.5 43.5H45.5" stroke="${O}" stroke-width="1.5"/><rect x="38" y="42" width="3.4" height="5" rx="1.2" fill="#fff" ${SOw(1.1)}/>
        <path d="${star(27, 49.5, 3.6, 1.7, 5)}" fill="#fff"/>
        ${EYES(25, 39, 26, 2.4)}${blush(21, 43, 31, 2.4, 1.5)}${mouth(32, 30.5, 2)}`,
      education_aplus: `${lg("edu-ap-p", "#FFFFFF", "#EEF2F8")}${rg("edu-ap-s", "#FFF3A8", "#F5B21E", .4, .35)}
        <g transform="rotate(-6 32 32)">
          <rect x="10" y="5" width="44" height="54" rx="4" fill="url(#edu-ap-p)" ${SO}/>
          <g stroke="#A9C8EC" stroke-width="1.4" stroke-linecap="round"><path d="M16 44H48M16 50H48M16 15H34"/></g>
          <path d="M16.5 7v50" stroke="#FF9AAE" stroke-width="1.2" opacity=".8"/>
          <ellipse cx="32" cy="29" rx="15" ry="11" fill="none" stroke="#E2504E" stroke-width="2.2" transform="rotate(-8 32 29)"/>
          ${T("A+", 32, 35.5, 17, "#E2504E", 22)}</g>
        <path d="${star(50, 50, 10, 4.8, 5)}" fill="url(#edu-ap-s)" ${S2}/>
        ${spark(8, 9, 3, "#7CC8E8")}`,
      education_greatjob: `${lg("edu-gj-r", "#FF8FA8", "#E0577E")}${rg("edu-gj-g", "#FFF0A0", "#F5B21E", .4, .35)}
        <path d="M18 44L11 60L18 57L22 62L28 48zM46 44L53 60L46 57L42 62L36 48z" fill="url(#edu-gj-r)" ${S2}/>
        <path d="${scal(32, 29, 24, 16, 3.2)}" fill="url(#edu-gj-g)" ${SO}/>
        <circle cx="32" cy="29" r="18.5" fill="#FFFBEA" stroke="#E8A52A" stroke-width="1.6"/>
        <circle cx="32" cy="29" r="15.5" fill="none" stroke="#FFB3C8" stroke-width="1.1" stroke-dasharray="1.6 2.4" stroke-linecap="round"/>
        ${T("GREAT", 32, 28.3, 10.5, "#E0577E", 25)}${T("JOB!", 32, 39.4, 10.5, "#3E7BC8", 21)}
        <path d="${star(32, 15.5, 3, 1.4, 5)}" fill="#F5B21E"/>`
    }},
    pins: [
      {id: "tp-education-apple", name: "Apple Magnet", kind: "badge", desc: "A shiny red apple magnet with a green leaf.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="edu-pa-g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF9A8A"/><stop offset="1" stop-color="#C92A2A"/></radialGradient></defs>
          <path d="M15 9Q15 5 17.5 2.5" fill="none" stroke="#6B3E22" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M15 9C12 6.5 5 6.5 3.5 13C2 20 7 28 11 28C13 28 14 27 15 27C16 27 17 28 19 28C23 28 28 20 26.5 13C25 6.5 18 6.5 15 9z" fill="url(#edu-pa-g)" stroke="#7A1E1E" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M16.5 6Q21 1 25.5 3.5Q21 8 16.5 6z" fill="#7CC47A" stroke="#2F6F3A" stroke-width=".9" stroke-linejoin="round"/>
          <ellipse cx="8.5" cy="13" rx="1.8" ry="3" fill="#fff" opacity=".6" transform="rotate(20 8.5 13)"/></svg>`},
      {id: "tp-education-ruler", name: "Ruler Washi", kind: "tape", desc: "Sunny yellow washi tape marked like a little ruler, with tiny stars.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z" fill="#FFD95A" opacity=".88"/>
          <g stroke="#9A6A10" stroke-width="1" opacity=".75">${Array.from({length: 19}, (_, i) => `<path d="M${8 + i * 4} 1.5v${i % 5 ? 4 : 7.5}"/>`).join("")}</g>
          <g font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="6" fill="#9A6A10" opacity=".8" text-anchor="middle"><text x="8" y="15">0</text><text x="28" y="15">1</text><text x="48" y="15">2</text><text x="68" y="15">3</text></g>
          <path d="${star(18, 18.5, 3.2, 1.5, 5)}${star(58, 18.5, 3.2, 1.5, 5)}" fill="#fff"/><path d="${star(38, 19, 3.2, 1.5, 5)}${star(77, 19, 3.2, 1.5, 5)}" fill="#E8693A" opacity=".8"/>
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".45"/></svg>`}
    ],
    card: {id: "tp-education", name: "Gold Star Notes", desc: "Ruled notebook paper with a red margin, gold stars and an apple for the teacher; a chalkboard after dark."}
  });

  /* ================= ON AIR (comms) ================= */
  TP_DATA.push({
    theme: "comms",
    pack: {name: "Sound Bites", items: {
      comms_mic: `${lg("com-mc-c", "#F4F1FF", "#A99BE6", 1, 0)}${lg("com-mc-s", "#D8D2F2", "#8C7FC8")}
        <ellipse cx="32" cy="58" rx="14" ry="3.6" fill="url(#com-mc-s)" ${SO}/>
        <path d="M32 46V56" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M32 46V56" stroke="#C9BEF2" stroke-width="2.4" stroke-linecap="round"/>
        ${tube("M14 26V31Q14 46 32 46Q50 46 50 31V26", 2.6, "#C9BEF2")}
        <rect x="19" y="4" width="26" height="38" rx="13" fill="url(#com-mc-c)" ${SO}/>
        <g stroke="#7E70C2" stroke-width="1.6" stroke-linecap="round"><path d="M23 12H41M21.5 17H42.5M21.5 22H42.5M23 36H41M21.5 31H42.5"/></g>
        <rect x="18.5" y="24.5" width="27" height="3.6" rx="1.5" fill="#FF7FAE" ${S16}/>
        <path d="M24 9q2-3 5-3.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <g fill="none" stroke="#FF7FAE" stroke-width="2" stroke-linecap="round"><path d="M53 12q3 4 0 8M57 8q5.5 8 0 16"/></g>
        <g fill="none" stroke="#9FB6FF" stroke-width="2" stroke-linecap="round"><path d="M11 12q-3 4 0 8M7 8q-5.5 8 0 16"/></g>`,
      comms_onair: `${lg("com-oa-b", "#5A2A44", "#2E1626")}${rg("com-oa-g", "#FF8A8A", "#D9233A", .5, .4)}
        <path d="M20 13L16 5M44 13L48 5" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="5" r="2" fill="#B6C2D2" ${SOw(1.4)}/><circle cx="48" cy="5" r="2" fill="#B6C2D2" ${SOw(1.4)}/>
        <rect x="4" y="13" width="56" height="34" rx="9" fill="url(#com-oa-b)" ${SO}/>
        <rect x="8.5" y="17.5" width="47" height="25" rx="6" fill="url(#com-oa-g)"/>
        <rect x="8.5" y="17.5" width="47" height="25" rx="6" fill="none" stroke="#FFC2C2" stroke-width="1.2" opacity=".8"/>
        <text x="32" y="35.4" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="13.5" fill="none" stroke="#FFD6D6" stroke-width="3" stroke-linejoin="round" opacity=".45" textLength="38" lengthAdjust="spacingAndGlyphs">ON AIR</text>
        ${T("ON AIR", 32, 35.4, 13.5, "#FFFFFF", 38)}
        <path d="M12 21.5h8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
        <g fill="#FFD86B">${spark(6, 54, 3, "#FFD86B")}${spark(58, 54, 3, "#FF8FB8")}</g>
        <path d="M24 55q4-3 8 0t8 0" fill="none" stroke="#C9BEF2" stroke-width="2" stroke-linecap="round"/>`,
      comms_headphones: `${rg("com-hp-f", "#FFE2EC", "#FF9DBA", .4, .3)}${lg("com-hp-c", "#9C8CE6", "#5E4FB0")}
        ${tube("M11 36V30Q11 9 32 9Q53 9 53 30V36", 4, "#9C8CE6")}
        <circle cx="32" cy="40" r="17" fill="url(#com-hp-f)" ${SO}/>
        ${EYES(26, 38, 39, 2.5)}${blush(22, 42, 45, 2.6, 1.6)}${mouth(32, 44, 2.2)}
        <ellipse cx="25" cy="29" rx="3.2" ry="1.8" fill="#fff" opacity=".6" transform="rotate(-30 25 29)"/>
        <rect x="4" y="30" width="12" height="22" rx="6" fill="url(#com-hp-c)" ${SO}/><rect x="48" y="30" width="12" height="22" rx="6" fill="url(#com-hp-c)" ${SO}/>
        <path d="M7.5 35v9M51.5 35v9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
        <g fill="#FF7FAE" stroke="${O}" stroke-width="1.2"><ellipse cx="54" cy="16" rx="2.6" ry="2"/><path d="M56.2 16V7l3.8 1.4" fill="none"/></g>
        <g fill="#7CC8E8" stroke="${O}" stroke-width="1.2"><ellipse cx="7.5" cy="20" rx="2.4" ry="1.8"/><path d="M9.5 20V12" fill="none"/></g>`,
      comms_chat: `${lg("com-ct-a", "#B9D6FF", "#6E9EEA")}${lg("com-ct-b", "#FFC8DA", "#F07FA6")}
        <path d="M16 6H28A12 12 0 0 1 40 18V22A12 12 0 0 1 28 34H17L7 41L10 32.4A12 12 0 0 1 4 22V18A12 12 0 0 1 16 6z" fill="url(#com-ct-a)" ${SO}/>
        <g fill="#fff"><circle cx="14" cy="20" r="2.6"/><circle cx="22" cy="20" r="2.6"/><circle cx="30" cy="20" r="2.6"/></g>
        <path d="M34.5 27H47.5A12.5 12.5 0 0 1 60 39.5V43.5A12.5 12.5 0 0 1 53.9 54.2L58 61L47 56H34.5A12.5 12.5 0 0 1 22 43.5V39.5A12.5 12.5 0 0 1 34.5 27z" fill="url(#com-ct-b)" ${SO}/>
        ${EYES(35, 47, 40, 2.4)}${blush(31, 51, 45, 2.4, 1.5)}${mouth(41, 44.5, 2)}
        <path d="M27 33q2-2.5 5-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <path d="M9 12q2-2.5 5-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
      comms_tower: `${rg("com-tw-l", "#FFE0E0", "#FF4A5A", .5, .45)}
        <g fill="none" stroke-linecap="round" stroke-width="2.4"><path d="M22 11q-4 6 0 12M16 7q-7 10 0 20" stroke="#9FB6FF"/><path d="M42 11q4 6 0 12M48 7q7 10 0 20" stroke="#FF8FB8"/></g>
        ${tube("M20 58L32 19L44 58M23.5 47H40.5M26.5 37H37.5M29 29H35M23.5 47L37.5 37M40.5 47L26.5 37M26.5 37L35 29", 2.6, "#F5F1FF")}
        <path d="M14 58H50" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M14 58H50" stroke="#9C8CE6" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="32" cy="16" r="6" fill="url(#com-tw-l)" ${SO}/>
        <circle cx="30.4" cy="14.4" r="1.6" fill="#fff" opacity=".85"/>
        ${spark(54, 38, 3.4, "#FFD86B")}${spark(10, 40, 2.6, "#9FB6FF")}`,
      comms_letter: `${lg("com-lt-e", "#FFFDF6", "#F2E6CF")}${lg("com-lt-f", "#FFF6E4", "#EAD9B8")}
        <rect x="5" y="14" width="54" height="38" rx="6" fill="url(#com-lt-e)" ${SO}/>
        <path d="M6 50L25 35M58 50L39 35" fill="none" stroke="#D8C4A0" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6.5 17L30 35Q32 36.5 34 35L57.5 17" fill="url(#com-lt-f)" ${S2}/>
        ${heart(32, 34, 6, "#FF5A7A", S16)}
        <ellipse cx="29" cy="30.5" rx="1.4" ry=".9" fill="#fff" opacity=".7"/>
        ${EYES(21, 43, 44, 2.3)}${blush(17, 47, 48, 2.3, 1.4)}<path d="M30 46q2 1.6 4 0" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>
        ${spark(57, 8, 4, "#FFD86B")}${spark(7, 8, 2.6, "#FF8FB8")}`,
      comms_camera: `${lg("com-cm-b", "#9FE0D8", "#3A9A92")}${lg("com-cm-r", "#C9BEF2", "#7E70C2")}${rg("com-cm-l", "#DDF0FF", "#3A5A8C", .35, .3)}
        <circle cx="16" cy="14" r="9" fill="url(#com-cm-r)" ${SO}/><circle cx="35" cy="12" r="10" fill="url(#com-cm-r)" ${SO}/>
        <g fill="#F5F1FF"><circle cx="16" cy="14" r="2.2"/><circle cx="35" cy="12" r="2.4"/><circle cx="16" cy="9" r="1.4"/><circle cx="20.5" cy="16.5" r="1.4"/><circle cx="11.5" cy="16.5" r="1.4"/><circle cx="35" cy="6.5" r="1.5"/><circle cx="40" cy="14.5" r="1.5"/><circle cx="30" cy="14.5" r="1.5"/></g>
        <path d="M44 33L58 26V50L44 43z" fill="url(#com-cm-r)" ${SO}/>
        <rect x="4" y="22" width="42" height="34" rx="8" fill="url(#com-cm-b)" ${SO}/>
        <circle cx="11" cy="28.5" r="2.6" fill="#FF4A5A" ${SOw(1.2)}/>
        ${EYES(19, 33, 38, 2.5)}${blush(14.5, 37.5, 43.5, 2.6, 1.6)}${mouth(26, 42.5, 2.4)}
        <path d="M17 26h16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
      comms_speakup: `${lg("com-su-b", "#9C8CE6", "#5E4FB0")}
        <path d="M17.5 11H46.5A14 14 0 0 1 60.5 25V35A14 14 0 0 1 46.5 49L52 57L38 49H17.5A14 14 0 0 1 3.5 35V25A14 14 0 0 1 17.5 11z" fill="url(#com-su-b)" ${SO}/>
        <g stroke-linecap="round" stroke-width="2.2"><path d="M9 27v6M12.5 24v12" stroke="#FFB3D0"/><path d="M55 27v6M51.5 24v12" stroke="#7CF0C8"/></g>
        ${T("SPEAK", 32, 28.8, 11.5, "#FFFFFF", 32)}${T("UP!", 32, 42, 12, "#FFD86B", 20)}
        <path d="M10 16q3-2.5 7-2.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>
        ${spark(57, 6.5, 3.2, "#FF8FB8")}`
    }},
    pins: [
      {id: "tp-comms-onair", name: "On Air Light", kind: "badge", desc: "A round glowing red studio light with a tiny white microphone.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="com-po-g" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FF9A9A"/><stop offset="1" stop-color="#C21A30"/></radialGradient><linearGradient id="com-po-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9E4F8"/><stop offset="1" stop-color="#8C7FC8"/></linearGradient></defs>
          <circle cx="15" cy="15" r="13.5" fill="url(#com-po-r)" stroke="#3E3266" stroke-width="1.1"/>
          <circle cx="15" cy="15" r="10" fill="url(#com-po-g)" stroke="#7A1020" stroke-width="1"/>
          <rect x="12.2" y="8" width="5.6" height="9" rx="2.8" fill="#fff"/>
          <path d="M10.5 14.5q0 5 4.5 5t4.5-5M15 19.5v2.5M12.5 22h5" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
          <ellipse cx="10" cy="9.5" rx="2.4" ry="1.3" fill="#fff" opacity=".6" transform="rotate(-35 10 9.5)"/></svg>`},
      {id: "tp-comms-wave", name: "Sound Wave Washi", kind: "tape", desc: "Lilac washi tape with a pink and mint sound wave running along it.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z" fill="#C9BEF2" opacity=".88"/>
          <g stroke-linecap="round" stroke-width="2.2">${[3, 6, 10, 5, 8, 12, 7, 4, 9, 13, 6, 3, 8, 11, 5, 9, 4, 7].map((h, i) => `<path d="M${9 + i * 4} ${13 - h / 2}v${h}" stroke="${i % 2 ? "#FF7FAE" : "#FFFFFF"}"/>`).join("")}</g>
          <path d="M5 3.5H81" stroke="#fff" stroke-width="1.2" opacity=".45"/></svg>`}
    ],
    card: {id: "tp-comms", name: "Studio Wave", desc: "Soft lilac studio foam with a glowing ON AIR sign and a sound wave along the bottom; a warm red glow after dark."}
  });
})();

