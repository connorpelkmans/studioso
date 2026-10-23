/* Theme Collection, Around the World */
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
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  // a sugar maple leaf pointing up
  const LEAF = [[0, -1], [.14, -.6], [.4, -.76], [.32, -.36], [.82, -.5], [.64, -.16], [.94, .02], [.5, .2], [.56, .46], [.12, .3], [.05, .78], [-.05, .78], [-.12, .3], [-.56, .46], [-.5, .2], [-.94, .02], [-.64, -.16], [-.82, -.5], [-.32, -.36], [-.4, -.76], [-.14, -.6]];
  const maple = (x, y, s, fill, sw = 1.6, a = 0) => { const c = Math.cos(a * Math.PI / 180), n = Math.sin(a * Math.PI / 180);
    return `<path d="M${LEAF.map(([u, v]) => `${f1(x + (u * c - v * n) * s)} ${f1(y + (u * n + v * c) * s)}`).join("L")}Z" fill="${fill}" ${sw ? SOw(sw) : ""}/>`; };
  // a spruce: drooping tiers on a short trunk standing at (x, y)
  const spruce = (x, y, h, fill) => { const w = h * .32; return `<path d="M${x} ${f1(y - h)}L${f1(x + w * .45)} ${f1(y - h * .62)}L${f1(x + w * .2)} ${f1(y - h * .6)}L${f1(x + w * .75)} ${f1(y - h * .3)}L${f1(x + w * .3)} ${f1(y - h * .28)}L${f1(x + w)} ${f1(y - h * .06)}L${x} ${f1(y - h * .1)}L${f1(x - w)} ${f1(y - h * .06)}L${f1(x - w * .3)} ${f1(y - h * .28)}L${f1(x - w * .75)} ${f1(y - h * .3)}L${f1(x - w * .2)} ${f1(y - h * .6)}L${f1(x - w * .45)} ${f1(y - h * .62)}Z" fill="${fill}" ${SOw(1.4)}/><path d="M${x} ${f1(y - h * .1)}V${y}" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`; };

  TP_DATA.push({
    theme: "canada",
    pack: {name: "True North", items: {
      canada_maple: `${rg("canada-tp-ml", "#F2603E", "#C2281E", .4, .3)}
        ${maple(32, 31, 27, "url(#canada-tp-ml)", 2.4)}
        <path d="M32 52V60" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M32 52V60" stroke="#8A3A22" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="27" cy="31" r="2.4" fill="${O}"/><circle cx="37" cy="31" r="2.4" fill="${O}"/><circle cx="27.8" cy="30.2" r=".8" fill="#fff"/><circle cx="37.8" cy="30.2" r=".8" fill="#fff"/>
        ${blush(23, 41, 35.4, 2.4, 1.5)}${smile(32, 35.6, 2, 1.6)}
        <path d="M20 14Q24 10 29 10" fill="none" stroke="#FF9A7A" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>${spark(55, 10, 3.6, "#F2B23E")}${spark(9, 54, 2.8, "#F2B23E")}`,
      canada_lake: `${lg("canada-tp-ls", "#9CCDF0", "#EFF3E6")}${lg("canada-tp-lw", "#5ED2D0", "#1FA0B4")}
        <rect x="4" y="6" width="56" height="52" rx="12" fill="url(#canada-tp-ls)" ${SO}/>
        <path d="M5.2 38L14 24L19 30L28 13L37 28L42 21L52 33L58.8 38Z" fill="#8B98A8" ${S2}/>
        <path d="M28 13L37 28L42 21L46 26L40 38H31Z" fill="#6A788A"/>
        <path d="M28 13L31.6 19.4L29.6 18.6L28 21L26.2 18.6L24.6 19.4Z" fill="#fff"/><path d="M42 21L44.6 25L42.6 24.4L41 26L39.8 24.4Z" fill="#fff"/><path d="M14 24L16.4 27.6L14.4 27L13 28.6L11.6 27Z" fill="#fff"/>
        <path d="M5.2 38H58.8V46Q58.8 56.8 48 56.8H16Q5.2 56.8 5.2 46Z" fill="url(#canada-tp-lw)"/>
        ${[9, 14, 19, 44, 50, 55].map((x, i) => spruce(x, 39.4, 9 + (i % 3) * 2.4, "#2B5345")).join("")}
        <path d="M14 46H24M34 50H48M20 53H30" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        <rect x="4" y="6" width="56" height="52" rx="12" fill="none" ${SO}/>`,
      canada_canoe: `${lg("canada-tp-cn", "#F05A44", "#A82A20")}
        <path d="M6 54Q20 50 32 54T58 54" fill="none" stroke="#5ED2D0" stroke-width="3" stroke-linecap="round"/>
        <path d="M36 14L22 50" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M36 14L22 50" stroke="#C8A06A" stroke-width="2" stroke-linecap="round"/>
        <path d="M37 10Q41 12 39 20L35 21Q33 13 37 10Z" fill="#C8A06A" ${S2}/>
        <path d="M4 32Q8 44 18 46H46Q56 44 60 32Q50 38 32 38Q14 38 4 32Z" fill="url(#canada-tp-cn)" ${SO}/>
        <path d="M8 35.6Q18 40 32 40Q46 40 56 35.6" fill="none" stroke="#F2D2A0" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M18 38V45M32 39.6V46M46 38V45" stroke="#F2D2A0" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        ${maple(51, 14, 6, "#D6382A", 1.2, 18)}${spark(12, 16, 3.4, "#F2B23E")}`,
      canada_moose: `${rg("canada-tp-mo", "#8A5A38", "#5A3A26", .45, .35)}
        <path d="M14 22C6 20 4 10 8 6C10 10 13 9 14 6C16 10 18 10 20 7C22 12 22 18 20 22Z" fill="#E6CFA2" ${S2}/>
        <path d="M50 22C58 20 60 10 56 6C54 10 51 9 50 6C48 10 46 10 44 7C42 12 42 18 44 22Z" fill="#E6CFA2" ${S2}/>
        <path d="M17 26Q11 22 9 28Q12 32 18 31Z" fill="#7A5236" ${S2}/><path d="M47 26Q53 22 55 28Q52 32 46 31Z" fill="#7A5236" ${S2}/>
        <path d="M32 18C43 18 48 25 48 34C48 41 46 46 46 50C46 57 40 60 32 60C24 60 18 57 18 50C18 46 16 41 16 34C16 25 21 18 32 18Z" fill="url(#canada-tp-mo)" ${SO}/>
        <ellipse cx="32" cy="50" rx="12" ry="8.6" fill="#B08560" ${S2}/><ellipse cx="27.4" cy="50" rx="1.6" ry="2.4" fill="#3A2418"/><ellipse cx="36.6" cy="50" rx="1.6" ry="2.4" fill="#3A2418"/>
        ${EYES(25.6, 38.4, 34, 2.6)}${blush(21, 43, 40, 2.2, 1.4)}${smile(32, 55, 1.8, 1.5)}${maple(54, 50, 5.4, "#EE8C2A", 1.1, -20)}`,
      canada_beaver: `${rg("canada-tp-bv", "#B07A4E", "#7A4E30", .42, .3)}${lg("canada-tp-bt", "#6A5040", "#3E2C22")}
        <path d="M38 46C50 44 60 48 60 54C60 60 50 61 40 58Z" fill="url(#canada-tp-bt)" ${S2}/><path d="M46 49L46 57M52 49.6L52 57.4M42 52H58" stroke="#8A6A56" stroke-width="1" opacity=".8"/>
        <circle cx="16" cy="14" r="5" fill="#8A5A38" ${S2}/><circle cx="48" cy="14" r="5" fill="#8A5A38" ${S2}/>
        <path d="M32 8C46 8 52 18 52 32C52 48 44 58 32 58C20 58 12 48 12 32C12 18 18 8 32 8Z" fill="url(#canada-tp-bv)" ${SO}/>
        <ellipse cx="32" cy="36" rx="11" ry="8" fill="#D8B48C" ${S2}/><ellipse cx="32" cy="31" rx="4" ry="2.8" fill="#3A2418"/>
        <rect x="28" y="38" width="8" height="7" rx="1.4" fill="#FFFFFF" ${SOw(1.4)}/><path d="M32 38V45" stroke="${O}" stroke-width="1"/>
        ${EYES(23.6, 40.4, 25, 2.6)}${blush(19, 45, 33, 2.2, 1.4)}
        <path d="M30 2L36 6L32 10Z" fill="#D8B48C" ${SOw(1.2)}/>`,
      canada_cabin: `${lg("canada-tp-cl", "#D69A60", "#A86C3C")}
        <path d="M4 58Q32 50 60 58Z" fill="#93A55C" ${S2}/>
        <path d="M44 30V12H51V24Z" fill="#ABB1B7" ${S2}/><path d="M44 18H51M44 24H51" stroke="#7A8088" stroke-width="1.2"/>
        <circle cx="50" cy="7" r="3.4" fill="#E8ECEF" opacity=".9"/><circle cx="55" cy="3.6" r="2.4" fill="#E8ECEF" opacity=".7"/>
        <rect x="10" y="32" width="44" height="24" fill="url(#canada-tp-cl)" ${S2}/>
        ${[37, 42, 47, 52].map(y => `<path d="M11 ${y}H53" stroke="#7A4A28" stroke-width="1.2" opacity=".7"/><circle cx="10" cy="${y - 2.4}" r="2.4" fill="#C88B52" ${SOw(1.1)}/><circle cx="54" cy="${y - 2.4}" r="2.4" fill="#C88B52" ${SOw(1.1)}/>`).join("")}
        <path d="M4 34L16 18H48L60 34Z" fill="#6A4430" ${S2}/><path d="M10 28H54M13 23H51" stroke="#4A2E20" stroke-width="1.2" opacity=".7"/>
        <rect x="15" y="38" width="10" height="9" fill="#FFD27A" ${SOw(1.6)}/><path d="M20 38V47M15 42.5H25" stroke="#7A4A28" stroke-width="1.2"/>
        <rect x="35" y="38" width="9" height="18" rx="1" fill="#8E2418" ${SOw(1.6)}/><circle cx="42" cy="47" r=".9" fill="#F2C24A"/>
        ${maple(57, 50, 4.6, "#D6382A", 1, 20)}`,
      canada_loon: `${lg("canada-tp-lb", "#2E3A3C", "#141A1C")}
        <path d="M6 50Q20 46 32 50T58 50" fill="none" stroke="#5ED2D0" stroke-width="3" stroke-linecap="round"/>
        <path d="M8 40Q8 30 22 30Q30 30 36 34L40 26Q38 16 46 14Q54 14 54 22Q54 28 50 32L52 44Q46 48 24 48Q10 48 8 40Z" fill="url(#canada-tp-lb)" ${SO}/>
        <path d="M54 20L62 22L54 24Z" fill="#3A4648" ${SOw(1.4)}/>
        <path d="M40 30Q46 33 50 31" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M41 34Q46 37 50 35" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
        ${[[14, 38], [19, 36], [24, 37], [29, 38], [16, 42], [21, 41], [26, 42], [31, 41.6], [36, 40]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="1.6" fill="#fff"/>`).join("")}
        <circle cx="48" cy="20" r="2.4" fill="#E0302A"/><circle cx="48.6" cy="19.4" r=".7" fill="#fff"/>${spark(12, 14, 3.4, "#5ED2D0")}`,
      canada_badge: `${lg("canada-tp-bd", "#1E7480", "#134C56")}
        <rect x="3" y="14" width="58" height="36" rx="10" fill="url(#canada-tp-bd)" ${SO}/>
        <path d="M5 44L14 36L20 40L30 30L38 38L44 34L59 44V46Q59 48 57 48H7Q5 48 5 46Z" fill="#5ED2D0" opacity=".35"/>
        ${T("BEAUTY!", 32, 37, 12, "#FFFFFF", 44)}
        ${maple(55, 13, 7.4, "#D6382A", 1.4, 16)}${maple(8, 50, 5, "#F2B23E", 1.1, -24)}`
    }},
    pins: [
      {id: "tp-canada-maple", name: "Maple Leaf Pin", kind: "badge", desc: "A glossy red sugar maple leaf with a little stem.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="canada-pin-m" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#F2603E"/><stop offset="1" stop-color="#B8261C"/></radialGradient></defs>
          ${maple(15, 14.4, 12.6, "url(#canada-pin-m)", 1.1)}
          <path d="M15 24V28" stroke="#7A2A18" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M15 21V8M15 15L20 11M15 15L10 11" fill="none" stroke="#9A2216" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
          <ellipse cx="11" cy="8.4" rx="2.2" ry="1.1" fill="#fff" opacity=".45" transform="rotate(-35 11 8.4)"/></svg>`},
      {id: "tp-canada-plaid", name: "Lumberjack Plaid", kind: "tape", desc: "Red and black buffalo check washi tape, cabin cozy.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="canada-pin-pc"><path d="${tapeEdge}"/></clipPath></defs>
          <g clip-path="url(#canada-pin-pc)" opacity=".94"><rect x="0" y="0" width="86" height="26" fill="#C8302A"/>
          ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${i * 12}" y="0" width="6" height="26" fill="#1E1A1E" opacity=".55"/>`).join("")}
          ${[0, 1, 2].map(j => `<rect x="0" y="${j * 12}" width="86" height="6" fill="#1E1A1E" opacity=".55"/>`).join("")}
          ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${i * 12 + 9} 0V26" stroke="#F2D2A0" stroke-width=".5" opacity=".5"/>`).join("")}</g></svg>`}
    ],
    card: {id: "tp-canada", name: "Lakeside Maple", desc: "Crisp glacier-blue paper with snowy Rocky peaks and a maple branch in the corner and a red canoe on turquoise water below. Northern lights in dark mode."}
  });
})();
