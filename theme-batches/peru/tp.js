/* Theme Collections, Around the World: peru (Machu Picchu) */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const f1 = v => +v.toFixed(1);
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const blush = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const smile = (x, y, w = 2.4, sw = 1.9) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  // a fluffy outline: n bumps round a circle
  const fluff = (cx, cy, r, n, b = 1.2) => { let d = ""; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n, x = f1(cx + r * Math.cos(a)), y = f1(cy + r * Math.sin(a)); d += i ? `A${f1(r * Math.sin(Math.PI / n) * b)} ${f1(r * Math.sin(Math.PI / n) * b)} 0 0 1 ${x} ${y}` : `M${x} ${y}`; } return d + "Z"; };
  const tapeEdge = "M3 1.5H83L80 5.5L83 9.5L80 13.5L83 17.5L80 21.5L82 24.5H3L6 20.5L3 16.5L6 12.5L3 8.5L6 4.5z";
  const zig = (x0, x1, y, h, st) => { let d = `M${x0} ${y}`; for (let x = x0, k = 0; x < x1; x += st, k++) d += `L${f1(x + st)} ${k % 2 ? y : y - h}`; return d; };

  TP_DATA.push({
    theme: "peru",
    pack: {name: "Andes Adventure", items: {
      peru_llama: `${lg("pe-ll", "#FFFBF2", "#E6D6B8")}
        <path d="M18 22C11 14 10 4 14 2C19 1 22 11 23 20Z" fill="url(#pe-ll)" ${SO}/><path d="M46 22C53 14 54 4 50 2C45 1 42 11 41 20Z" fill="url(#pe-ll)" ${SO}/>
        <path d="M17 15C15 11 15 7 16.4 6C18 7 19 11 19.4 15Z" fill="#EDB8AA"/><path d="M47 15C49 11 49 7 47.6 6C46 7 45 11 44.6 15Z" fill="#EDB8AA"/>
        <circle cx="14" cy="19" r="3.4" fill="#E23A5E" ${SOw(1.4)}/><circle cx="50" cy="19" r="3.4" fill="#F6B42A" ${SOw(1.4)}/>
        <path d="M14 46C10 46 10 40 13 38C11 32 15 26 20 26C22 20 28 18 32 18C36 18 42 20 44 26C49 26 53 32 51 38C54 40 54 46 50 46Z" fill="url(#pe-ll)" ${SO}/>
        <path d="M14 46H50V58Q32 62 14 58Z" fill="#E23A5E" ${SO}/><path d="M14 51H50" stroke="#F6B42A" stroke-width="3"/><path d="${zig(15, 49, 56.6, 3, 3.4)}" fill="none" stroke="#2E9ED6" stroke-width="1.6"/>
        <ellipse cx="32" cy="41" rx="9" ry="6.4" fill="#FFF8EC" ${SOw(1.6)}/><path d="M29.6 38.6Q32 40.4 34.4 38.6" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
        ${EYES(24, 40, 33, 2.4)}${blush(19.4, 44.6, 38.6, 2.2, 1.4)}${smile(32, 43, 1.8, 1.5)}${SHINE(20, 26, 3, 1.8, -30)}`,
      peru_peak: `${lg("pe-pk", "#BFE2F2", "#F2F6E0")}
        <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#pe-pk)" ${SO}/>
        <path d="M4 50C14 46 18 40 22 32C27 20 31 12 37 12C43 12 46 22 49 32C52 42 56 48 60 50V48Q60 60 50 60H14Q4 60 4 50Z" fill="#3C7A50"/>
        <path d="M30 22Q33 16 36 15M44 34Q46 40 48 43" fill="none" stroke="#5A9C5A" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="42" cy="32" rx="14" ry="3.4" fill="#fff" opacity=".9"/><ellipse cx="34" cy="30" rx="7" ry="3" fill="#fff" opacity=".9"/>
        <path d="M4 52Q32 44 60 52V50Q60 60 50 60H14Q4 60 4 52Z" fill="#94CC5E"/><path d="M4 55Q32 48 60 55" fill="none" stroke="#CFCBBE" stroke-width="2"/>
        <path d="M14 50V45H22V49Z" fill="#CFCBBE" ${SOw(1)}/><path d="M12.6 45.4L15 42H24L22.6 45.4Z" fill="#D4A658" ${SOw(1)}/><path d="M17 49.4L17.4 46.4H18.8L19.2 49.4Z" fill="#6E6858"/>
        <rect x="3" y="3" width="58" height="58" rx="14" fill="none" ${SO}/>
        <circle cx="15" cy="15" r="5" fill="#FFF6C8"/>`,
      peru_condor: `${rg("pe-cd", "#5A5260", "#24212C", .5, .3)}
        <path d="M32 26C24 22 14 22 3 28L7 30L2 33L8 33L5 37L12 35L17 38L24 35L32 40L40 35L47 38L52 35L59 37L56 33L62 33L57 30L61 28C50 22 40 22 32 26Z" fill="url(#pe-cd)" ${SO}/>
        <path d="M10 31Q18 28 26 31M54 31Q46 28 38 31" fill="none" stroke="#F4F0EA" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M28 40L32 50L36 40Z" fill="#3E3640" ${SOw(1.8)}/>
        <circle cx="32" cy="24" r="6" fill="#F8F4EE" ${S2}/><circle cx="32" cy="17" r="5.6" fill="#B48C8E" ${S2}/><path d="M30.4 19.6Q32 23.6 33.6 19.6Z" fill="#3E3640"/>
        ${EYES(29.6, 34.4, 16.4, 1.3)}${spark(54, 12, 3.4, "#FFE27A")}${spark(10, 50, 2.6, "#FFE27A")}`,
      peru_kantu: `${lg("pe-kt", "#FF7AA2", "#C42A5A")}
        ${[[20, 8, 22, -12], [40, 6, 44, 10], [30, 4, 31, 0]].map(([x, y, x2, r]) => `<path d="M${x} ${y}Q${(x + x2) / 2} ${y + 6} ${x2} ${y + 16}" fill="none" stroke="#3F7C45" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
        ${[[12, 14, -30], [48, 12, 30], [24, 10, -60], [38, 9, 50]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.8" transform="rotate(${r} ${x} ${y})" fill="#4E9A54" ${SOw(1.4)}/>`).join("")}
        ${[[22, 22, -8], [44, 20, 10], [32, 18, 0]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x - 2.4} ${y}H${x + 2.4}L${x + 5} ${y + 22}Q${x + 9} ${y + 28} ${x} ${y + 30}Q${x - 9} ${y + 28} ${x - 5} ${y + 22}Z" fill="url(#pe-kt)" ${S2}/><path d="M${x} ${y + 30}V${y + 35}M${x - 2} ${y + 30}L${x - 3} ${y + 34}M${x + 2} ${y + 30}L${x + 3} ${y + 34}" stroke="#F6D24A" stroke-width="1.4" stroke-linecap="round"/></g>`).join("")}
        ${EYES(28.6, 35.4, 34, 1.6)}${smile(32, 37.4, 1.4, 1.3)}${spark(54, 44, 3, "#FFE27A")}`,
      peru_potato: `${rg("pe-pt", "#B87ED0", "#5A2672", .4, .35)}
        <path d="M32 12C44 11 54 17 56 28C58 38 56 50 46 55C38 59 26 59 18 54C9 48 7 38 9 28C11 18 21 13 32 12Z" fill="url(#pe-pt)" ${SO}/>
        <path d="M16 26q2 -1.4 3.6 .6M48 46q2 -1.4 3.6 .6M20 48q2 -1.6 3.6 -.2M47 22q2 -1.4 3.4 .4" fill="none" stroke="#4A1A5E" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M32 12Q30 6 34 2M32 12Q38 6 42 8" fill="none" stroke="#4E9A54" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="41" cy="6" rx="4" ry="2" transform="rotate(-20 41 6)" fill="#6AB86A" ${SOw(1.2)}/>
        ${EYES(25, 39, 33, 2.4)}${blush(20, 44, 38.6, 2.4, 1.5)}${smile(32, 38, 2, 1.6)}${SHINE(18, 22, 3.6, 2, -35)}`,
      peru_chullo: `${lg("pe-ch", "#F05A7A", "#C42A50")}
        <path d="M10 36L8 50Q12 53 16 49L18 36Z" fill="url(#pe-ch)" ${S2}/><path d="M54 36L56 50Q52 53 48 49L46 36Z" fill="url(#pe-ch)" ${S2}/>
        <path d="M12 51V58M52 51V58" stroke="#F6B42A" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="60" r="2.8" fill="#2E9ED6" ${SOw(1.4)}/><circle cx="52" cy="60" r="2.8" fill="#2E9ED6" ${SOw(1.4)}/>
        <path d="M9 38C9 20 19 12 32 12C45 12 55 20 55 38Z" fill="url(#pe-ch)" ${SO}/>
        <rect x="8.4" y="31" width="47.2" height="8" fill="#F6B42A" ${S2}/><path d="${zig(10, 54, 37.6, 4, 4)}" fill="none" stroke="#2E9ED6" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M18 24l3 -3l3 3l-3 3zM29 20l3 -3l3 3l-3 3zM40 24l3 -3l3 3l-3 3z" fill="#fff"/>
        <path d="M32 12V7" stroke="${O}" stroke-width="2.2"/><circle cx="32" cy="5.4" r="4.4" fill="#2E9ED6" ${S2}/>
        <path d="M15 22Q19 16 25 15" fill="none" stroke="#FFB0C2" stroke-width="2" stroke-linecap="round"/>`,
      peru_window: `${lg("pe-wn", "#DCD8CC", "#A8A294")}
        <rect x="4" y="6" width="56" height="54" rx="6" fill="url(#pe-wn)" ${SO}/>
        <path d="M4 20H60M4 34H60M4 48H60M20 6V20M42 6V20M14 20V34M34 20V34M52 20V34M24 34V48M46 34V48M16 48V60M38 48V60" stroke="#8A8476" stroke-width="1.4"/>
        <path d="M20 52L24 18H40L44 52Z" fill="#9FD2EE" ${S2}/>
        <path d="M21.4 52L23.4 36Q28 30 33 38Q37 32 42.4 36L44 52Z" fill="#3C7A50"/><circle cx="35" cy="26" r="4" fill="#FFF0A8"/>
        <path d="M22 18H42V22H22Z" fill="#C9C3B4" ${SOw(1.6)}/>
        ${spark(54, 10, 3, "#FFE27A")}`,
      peru_badge: `${lg("pe-bd", "#3A7A52", "#1F5A36")}
        <rect x="3" y="14" width="58" height="36" rx="16" fill="url(#pe-bd)" ${SO}/>
        <path d="M44 30L50 20L56 30Z" fill="#9AD062" ${SOw(1.4)}/><path d="M50 20L51 15" stroke="${O}" stroke-width="1.4"/><path d="M51 15H56L55 17.4L56 19.6H51" fill="#F6B42A" ${SOw(1)}/>
        ${T("SUMMIT", 25, 30, 9.6, "#F6D24A", 34)}${T("REACHED!", 30, 42.5, 10, "#FFFFFF", 44)}
        ${spark(9, 10, 3.4, "#FFE27A")}${spark(56, 56, 3, "#F05A8A")}`
    }},
    pins: [
      {id: "tp-peru-sun", name: "Sun Gate Pin", kind: "badge", desc: "A golden sun with twelve rays, rising through the Sun Gate.",
        svg: `<svg viewBox="0 0 30 30"><defs><radialGradient id="pe-ps" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFE8A0"/><stop offset="1" stop-color="#D8902A"/></radialGradient></defs>
          <path d="${star(15, 15, 13.6, 9.4, 12)}" fill="#F2B53A" stroke="#7A4A14" stroke-width="1"/>
          <circle cx="15" cy="15" r="8.6" fill="url(#pe-ps)" stroke="#7A4A14" stroke-width="1.1"/><circle cx="15" cy="15" r="5.4" fill="none" stroke="#B8701E" stroke-width=".9"/>
          <ellipse cx="11.6" cy="11" rx="2.2" ry="1.2" fill="#fff" opacity=".55" transform="rotate(-35 11.6 11)"/></svg>`},
      {id: "tp-peru-textile", name: "Andean Weave Washi", kind: "tape", desc: "Washi tape woven in bright Andean stripes and zigzags.",
        svg: `<svg viewBox="0 0 86 26"><defs><clipPath id="pe-pt-c"><path d="${tapeEdge}"/></clipPath></defs><g clip-path="url(#pe-pt-c)" opacity=".92">
          <rect x="0" y="0" width="86" height="26" fill="#E23A5E"/><rect x="0" y="5" width="86" height="4" fill="#F6B42A"/><rect x="0" y="17" width="86" height="4" fill="#F6B42A"/>
          <path d="${zig(0, 86, 15.4, 5, 4.3)}" fill="none" stroke="#2E9ED6" stroke-width="2"/><path d="${zig(0, 86, 3, 2, 3)}" fill="none" stroke="#fff" stroke-width=".9"/><path d="${zig(0, 86, 24, 2, 3)}" fill="none" stroke="#fff" stroke-width=".9"/></g></svg>`}
    ],
    card: {id: "tp-peru", name: "Cloud Terraces", desc: "Fresh mountain paper with Huayna Picchu in the corner and green terraces with a little llama below. Starry Andes blue in dark mode."}
  });
})();
