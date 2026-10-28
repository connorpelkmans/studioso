/* ===== module: 96-tp-b5.js ===== */
/* Theme Collections, batch 5 */
(() => {
  const D = "#2B2233";
  const f1 = n => Math.round(n * 10) / 10;
  // star or burst polygon points
  const STAR = (cx, cy, n, ro, ri, rot = -90) => Array.from({length: n * 2}, (_, i) => { const a = (rot + i * 180 / n) * Math.PI / 180, r = i % 2 ? ri : ro; return `${f1(cx + r * Math.cos(a))},${f1(cy + r * Math.sin(a))}`; }).join(" ");
  // a heart of width about 50*k centred on (cx, cy)
  const HP = "M32 55S7 40 7 23a12.5 12.5 0 0 1 25-4 12.5 12.5 0 0 1 25 4c0 17-25 32-25 32z";
  const HEART = (cx, cy, k, fill, extra = "") => `<path d="${HP}" transform="translate(${cx} ${cy}) scale(${k}) translate(-32 -31)" fill="${fill}" vector-effect="non-scaling-stroke" ${extra}/>`;
  const HW = w => `stroke="${D}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const LG = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const RG = (id, a, b, cx = .35, cy = .3) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const SH = (x, y, rx = 4.5, ry = 2.6, rot = -30, o = .6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;
  const EY = (a, b, y, r = 2.8) => EYES(a, b, y, r);
  const BL = (a, b, y, rx = 3.2, ry = 2.1) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".75"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".75"/>`;
  const SM = (x, y, w = 3) => SMILE(x, y, w);
  const TX = (t, x, y, sz, c, ex = "") => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}" ${ex}>${t}</text>`;
  const SPARK = (x, y, r, c) => `<path d="M${x} ${y - r}Q${x + r * .18} ${y - r * .18} ${x + r} ${y}Q${x + r * .18} ${y + r * .18} ${x} ${y + r}Q${x - r * .18} ${y + r * .18} ${x - r} ${y}Q${x - r * .18} ${y - r * .18} ${x} ${y - r}z" fill="${c}"/>`;
  // 5 petal blossom
  const BLOSSOM = (cx, cy, r, fill, sw = 2, ctr = "#FFE08A") => `<g fill="${fill}" ${HW(sw)}>${[0, 72, 144, 216, 288].map(a => { const t = (a - 90) * Math.PI / 180; return `<circle cx="${f1(cx + r * .52 * Math.cos(t))}" cy="${f1(cy + r * .52 * Math.sin(t))}" r="${f1(r * .5)}"/>`; }).join("")}</g><circle cx="${cx}" cy="${cy}" r="${f1(r * .3)}" fill="${ctr}" ${HW(sw * .8)}/>`;
  // tape outlines
  const ZIG = "M4 1H82L85 4.3 81.5 7.5 85 10.8 81.5 14 85 17.3 81.5 20.5 85 23.8 82 25H4L1 21.8 4.5 18.5 1 15.3 4.5 12 1 8.8 4.5 5.5 1 2.3z";
  const PIX = (x, y, s, rows, c) => rows.map((r, j) => [...r].map((ch, i) => ch === "X" ? `<rect x="${f1(x + i * s)}" y="${f1(y + j * s)}" width="${s}" height="${s}" fill="${c}"/>` : "").join("")).join("");
  const PHEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];

  /* Garden Plot */
  TP_DATA.push({
    theme: "gardening",
    pack: {name: "Potting Bench", items: {
      gardening_sprout: `<defs>${LG("gd-sp-g1", "#EE9868", "#C35E36")}</defs>
        <path d="M32 31V19" stroke="#3E8E4A" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M31 23C29 12 19 7 8 9c1 11 10 17 23 14z" fill="#8ACF6E" ${SO}/><path d="M31 21c-4-4-10-7-17-8" stroke="#4E9E4A" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M33 20c2-10 12-15 23-12-1 11-10 16-23 12z" fill="#5BAE55" ${SO}/>
        <path d="M13 35h38l-5 22a4 4 0 0 1-4 3H22a4 4 0 0 1-4-3z" fill="url(#gd-sp-g1)" ${SO}/>
        <rect x="9" y="28" width="46" height="10" rx="3.5" fill="#F2A274" ${SO}/>${SH(16, 31.5, 3.5, 1.6, 0, .5)}
        ${EY(25, 39, 45, 2.7)}${BL(19.5, 44.5, 50)}${SM(32, 49.5, 3)}`,
      gardening_ivy: `<defs>${LG("gd-iv-g1", "#FDF5E2", "#E6D3AE")}</defs>
        <path d="M32 6L15 27M32 6l17 21M32 6v20" stroke="#8A6A4A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="32" cy="6" r="3.2" fill="#E0B05A" ${HW(2)}/>
        <path d="M15 34q-6 10-1 18 3 5-1 9M49 34q6 10 1 17-3 4 1 8M31 42q2 7-1 12" stroke="#3E8E4A" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 26h46c0 12-10 18-23 18S9 38 9 26z" fill="url(#gd-iv-g1)" ${SO}/>
        <path d="M11.5 32h41" stroke="#8FBF86" stroke-width="3.5"/>${EY(26, 38, 37.5, 2)}<path d="M30.5 40.5q1.5 1.4 3 0" stroke="${D}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <g fill="#6CC070" ${HW(1.8)}>
          <path d="M12 41c-5-1-8 3-6 7 4 0 7-3 6-7z"/><path d="M15 50c5-2 9 1 8 5-4 1-8-1-8-5z"/><path d="M12 58c-5 0-7 4-4 6h0c3 0 5-3 4-6z"/>
          <path d="M52 41c5-1 8 3 6 7-4 0-7-3-6-7z"/><path d="M50 50c-5-2-9 1-8 5 4 1 8-1 8-5z"/><path d="M52 58c5 0 7 4 4 6h0c-3 0-5-3-4-6z"/>
          <path d="M30 49c-5-1-8 3-5 6 4 0 6-2 5-6z"/>
        </g>
        <path d="M16 20c-5-4-4-10 2-11 3 4 2 8-2 11zM48 20c5-4 4-10-2-11-3 4-2 8 2 11zM32 24c-5-3-5-9 0-11 5 2 5 8 0 11z" fill="#7CC46A" ${HW(1.8)}/>`,
      gardening_gnome: `<defs>${LG("gd-gn-g1", "#FF7A68", "#C8322E", 1, 1)}${LG("gd-gn-g2", "#6FA2E0", "#3E6FB8")}</defs>
        <path d="M15 60l4-24h26l4 24z" fill="url(#gd-gn-g2)" ${SO}/>
        <path d="M17.5 51h29" stroke="#8A5A2B" stroke-width="4"/><rect x="29" y="48" width="6" height="6" rx="1" fill="#F2C24A" ${HW(1.6)}/>
        <circle cx="32" cy="29" r="11" fill="#FFDCC0" ${SO}/>
        <path d="M16 34q0 20 16 25 16-5 16-25-7 6-16 6t-16-6z" fill="#fff" ${SO}/>
        <path d="M35 2q-5 10-19 19h32q-2-12-13-19z" fill="url(#gd-gn-g1)" ${SO}/>
        <rect x="14" y="18" width="36" height="6" rx="3" fill="#E24B40" ${SO}/>
        ${EY(27, 37, 29, 2.2)}${BL(23.5, 40.5, 33.5, 2.4, 1.6)}<circle cx="32" cy="34" r="3.2" fill="#FFA985" ${HW(1.8)}/>
        ${SH(28, 10, 3, 1.6, -55)}<path d="M26 47q6 3 12 0" stroke="#D8DEE8" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      gardening_snail: `<defs>${LG("gd-sn-g1", "#F6C07A", "#D9804A", 1, 1)}</defs>
        <path d="M49 27q-3-8-6-12M55 27q2-8 5-12" stroke="${D}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="43" cy="14" r="3" fill="${D}"/><circle cx="60" cy="14" r="3" fill="${D}"/>
        <path d="M5 55q0-5 6-5h31q2 0 2-3V33a8 8 0 0 1 16 0v14q0 13-13 13H9q-4 0-4-5z" fill="#C7E8A6" ${SO}/>
        ${EY(48.5, 55.5, 35, 2.1)}<path d="M50 40q2 2 4 0" stroke="${D}" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="46" cy="40" rx="2" ry="1.3" fill="#FF8FA8" opacity=".8"/>
        <circle cx="25" cy="35" r="18" fill="url(#gd-sn-g1)" ${SO}/>
        <path d="M25 35a3.5 3.5 0 1 1 4.5 3.5 8 8 0 1 1-10.5-10 12.5 12.5 0 0 1 17 5.5" stroke="#A85A2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        ${SH(16, 24, 4, 2.2)}
        <path d="M22 17c-1-6 4-10 9-9-1 6-5 9-9 9z" fill="#6CC070" ${HW(1.8)}/>`,
      gardening_ladybug: `<defs>${LG("gd-lb-g1", "#FF7C68", "#D8363A", 1, 1)}</defs>
        <path d="M26 10q-4-6-9-5M38 10q4-6 9-5" stroke="${D}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="17" cy="5" r="2.8" fill="${D}"/><circle cx="47" cy="5" r="2.8" fill="${D}"/>
        <path d="M11 38H6M12 48l-5 3M53 38h5M52 48l5 3" stroke="${D}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="17" r="12" fill="#43334F" ${SO}/>
        <circle cx="32" cy="39" r="21" fill="url(#gd-lb-g1)" ${SO}/>
        <path d="M32 19.5V59" stroke="${D}" stroke-width="2.5"/>
        <g fill="${D}"><circle cx="21" cy="33" r="4.2"/><circle cx="43" cy="33" r="4.2"/><circle cx="23" cy="48" r="3.6"/><circle cx="41" cy="48" r="3.6"/></g>
        <circle cx="27" cy="13" r="3" fill="#fff"/><circle cx="37" cy="13" r="3" fill="#fff"/><circle cx="27.6" cy="13.4" r="1.6" fill="${D}"/><circle cx="37.6" cy="13.4" r="1.6" fill="${D}"/>
        ${SH(19, 25, 4.2, 2.2, -40)}`,
      gardening_can: `<defs>${LG("gd-wc-g1", "#86D0E6", "#3A8DB8")}</defs>
        <path d="M18 25a10 10 0 0 1 20 0" fill="none" stroke="${D}" stroke-width="9" stroke-linecap="round"/><path d="M18 25a10 10 0 0 1 20 0" fill="none" stroke="#5FB0D2" stroke-width="4" stroke-linecap="round"/>
        <path d="M42 34l12-15 5 3.5-13 16z" fill="#5FB0D2" ${SO}/>
        <rect x="51" y="14" width="10" height="7" rx="2" fill="#86D0E6" ${SO} transform="rotate(35 56 17.5)"/>
        <g fill="#8FD3F0" ${HW(1.6)}><path d="M58 27q-2 3 0 4.5 2-1.5 0-4.5z"/><path d="M53 31q-2 3 0 4.5 2-1.5 0-4.5z"/><path d="M61 34q-2 3 0 4.5 2-1.5 0-4.5z"/></g>
        <rect x="7" y="24" width="37" height="34" rx="8" fill="url(#gd-wc-g1)" ${SO}/>
        <path d="M11 42h7l3-7 4 13 4-10 3 4h8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${SH(14, 29, 4, 2, -20)}`,
      gardening_packet: `<defs>${LG("gd-pk-g1", "#D6F0C0", "#A9D88C")}</defs>
        <rect x="11" y="5" width="42" height="55" rx="4" fill="#FFF5DC"/>
        <rect x="16" y="11" width="32" height="24" rx="3" fill="url(#gd-pk-g1)"/>
        <path d="M32 34V24" stroke="#3E8E4A" stroke-width="2.6" stroke-linecap="round"/><path d="M32 30q-5-3-8 0 4 3 8 0z" fill="#5BAE55"/>
        ${BLOSSOM(32, 20, 11, "#F28BB8", 1.6)}
        <path d="M11 39h42v17a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" fill="#357A43"/>
        ${TX("DIG IN", 32, 53.5, 10, "#fff")}
        <rect x="11" y="5" width="42" height="55" rx="4" fill="none" ${SO}/>
        <path d="M13 9h38" stroke="#E6D3AE" stroke-width="1.6" stroke-dasharray="2.5 2.5"/>`,
      gardening_radish: `<defs>${LG("gd-rd-g1", "#FF86B0", "#D23F7A", .6, 1)}</defs>
        <path d="M30 20C24 14 18 5 23 3c6-1 9 8 7 17z" fill="#6CC070" ${SO}/>
        <path d="M34 20c6-7 14-12 18-7 2 5-8 9-18 7z" fill="#5BAE55" ${SO}/>
        <path d="M32 20c-6-5-15-8-18-3-1 5 8 6 18 3z" fill="#4E9E4A" ${SO}/>
        <path d="M32 62v-4" stroke="${D}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M32 17c13 0 21 9 21 20 0 11-10 16-21 22-11-6-21-11-21-22 0-11 8-20 21-20z" fill="url(#gd-rd-g1)" ${SO}/>
        <path d="M24 53q8 5 16 0-4 4-8 6-4-2-8-6z" fill="#FFE6EF"/>
        ${SH(20, 27, 4.5, 2.5)}${EY(25, 39, 36, 2.7)}${BL(19, 45, 42)}${SM(32, 41, 3)}`
    }},
    pins: [
      {id: "tp-gardening-pot", name: "Terracotta Charm", kind: "badge", desc: "A tiny glossy clay pot with a new sprout.", svg: `<svg viewBox="0 0 30 30"><defs>${LG("gd-pn-g1", "#F2A274", "#B8552F")}${LG("gd-pn-g2", "#9EE08A", "#3E8E4A", 1, 1)}</defs>
        <path d="M15 14V9" stroke="#2F6B38" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M15 10.5C13.5 5.5 9 3.5 4.5 4.5 5 9 9 11.5 15 10.5z" fill="url(#gd-pn-g2)" stroke="#2A4D22" stroke-width="1"/>
        <path d="M15 9.5c1.5-5 6-7 10.5-6-.5 4.5-4.5 7-10.5 6z" fill="url(#gd-pn-g2)" stroke="#2A4D22" stroke-width="1"/>
        <path d="M7.5 17h15l-2 10.5a1.8 1.8 0 0 1-1.8 1.3h-7.4a1.8 1.8 0 0 1-1.8-1.3z" fill="url(#gd-pn-g1)" stroke="#6E3219" stroke-width="1.1"/>
        <rect x="5.5" y="13" width="19" height="5" rx="1.8" fill="#F4AA7E" stroke="#6E3219" stroke-width="1.1"/>
        <ellipse cx="9.5" cy="14.8" rx="2.2" ry=".9" fill="#fff" opacity=".75"/><ellipse cx="11" cy="21" rx="1" ry="2.6" fill="#fff" opacity=".4"/></svg>`},
      {id: "tp-gardening-ivy", name: "Ivy Washi", kind: "tape", desc: "Sage washi tape with a trailing ivy vine.", svg: `<svg viewBox="0 0 86 26"><path d="${ZIG}" fill="rgba(186,222,172,.82)"/>
        <path d="M4 3h78M4 23h78" stroke="rgba(53,122,67,.35)" stroke-width="1" stroke-dasharray="2 2"/>
        <path d="M3 14q7-7 14 0t14 0 14 0 14 0 14 0 12 0" stroke="#357A43" stroke-width="1.3" fill="none" opacity=".8"/>
        <g fill="#4E9E4A" opacity=".9">${[10, 24, 38, 52, 66, 80].map((x, i) => i % 2 ? `<path d="M${x} 14q-4 4-1 7 4-2 1-7z"/>` : `<path d="M${x} 11q-4-4-1-7 4 2 1 7z"/>`).join("")}</g>
        <g fill="#F28BB8">${[17, 45, 73].map(x => `<circle cx="${x}" cy="14" r="1.8"/>`).join("")}</g></svg>`}
    ],
    card: {id: "tp-gardening", name: "Ivy Trellis", desc: "Seed packet cream paper with an ivy garland swagged along a lattice trellis at the top and a row of sprouts in the soil below."}
  });

  /* Game Night */
  TP_DATA.push({
    theme: "gaming",
    pack: {name: "Power Up Pals", items: {
      gaming_pad: `<defs>${LG("gm-pd-g1", "#9C86F5", "#5A3FCF")}</defs>
        <path d="M17 17h30c8 0 12 6 13 14l2 14c1 8-8 12-13 5l-6-7H21l-6 7c-5 7-14 3-13-5l2-14c1-8 5-14 13-14z" fill="url(#gm-pd-g1)" ${SO}/>
        <path d="M9 27h4v-4h5v4h4v5h-4v4h-5v-4H9z" fill="#EDE8FF" ${HW(1.6)}/>
        <circle cx="48" cy="23.5" r="3" fill="#FF5C8A" ${HW(1.6)}/><circle cx="54" cy="29.5" r="3" fill="#4AD9FF" ${HW(1.6)}/><circle cx="42" cy="29.5" r="3" fill="#8CFF6A" ${HW(1.6)}/><circle cx="48" cy="35.5" r="3" fill="#FFD23F" ${HW(1.6)}/>
        ${EY(28.5, 35.5, 29, 2.2)}<path d="M30 34q2 2 4 0" stroke="${D}" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${SH(15, 21, 4, 1.8, -10)}`,
      gaming_coin: `<defs>${LG("gm-cn-g1", "#FFE88A", "#F0A500", 1, 1)}</defs>
        <circle cx="34" cy="34" r="25" fill="#C27F00" ${SO}/>
        <circle cx="30" cy="30" r="25" fill="url(#gm-cn-g1)" ${SO}/>
        <circle cx="30" cy="30" r="18.5" fill="none" stroke="#D98F00" stroke-width="2.5"/>
        ${EY(23, 37, 28, 3)}${BL(18, 42, 34)}${SM(30, 33, 3.5)}
        ${SH(17, 16, 5, 2.5)}${SPARK(55, 9, 6, "#FFE88A")}`,
      gaming_slime: `<defs>${LG("gm-sl-g1", "#9AF0FF", "#2FA7C8")}</defs>
        <path d="M6 51C6 34 17 13 32 13s26 21 26 38c0 6-5 8-9 5-3 3-7 3-9 0-3 3-9 3-12 0-3 3-8 3-10 0-4 3-12 2-12-5z" fill="url(#gm-sl-g1)" ${SO}/>
        ${SH(21, 22, 5.5, 3)}<circle cx="15" cy="32" r="1.8" fill="#fff" opacity=".7"/>
        ${EY(23, 41, 36, 3.6)}${BL(17, 47, 43)}<path d="M28 42q4 5 8 0" stroke="${D}" stroke-width="2.4" fill="#FF7FA3" stroke-linecap="round"/>
        <path d="M32 8l2 4 4 .5-3 3 .8 4.2L32 18l-3.8 1.7.8-4.2-3-3 4-.5z" fill="#FFD23F" ${HW(1.6)}/>`,
      gaming_star: `<defs>${LG("gm-st-g1", "#FFEF80", "#FFAE00", 1, 1)}</defs>
        <g stroke-linecap="round" fill="none"><path d="M5 53L21 37M11 59l16-16M4 45l12-12" stroke="${D}" stroke-width="8.5"/><path d="M5 53L21 37" stroke="#FF5C8A" stroke-width="4"/><path d="M11 59l16-16" stroke="#4AD9FF" stroke-width="4"/><path d="M4 45l12-12" stroke="#8CFF6A" stroke-width="4"/></g>
        <polygon points="${STAR(39, 25, 5, 23, 10.5)}" fill="url(#gm-st-g1)" ${SO}/>
        ${EY(34, 44, 26, 2.5)}${SM(39, 30.5, 2.6)}${SH(31, 15, 3.5, 2)}`,
      gaming_potion: `<defs>${LG("gm-po-g1", "#FF8AA6", "#DF2E5D")}</defs>
        <path d="M25 12h14v12a20 20 0 1 1-14 0z" fill="#EEF4FF" ${SO}/>
        <path d="M14.5 41a17.5 17.5 0 0 0 35 0q-8-5-17.5 0t-17.5 0z" fill="url(#gm-po-g1)"/>
        <path d="M25 12h14v12a20 20 0 1 1-14 0z" fill="none" ${SO}/>
        <rect x="23" y="4" width="18" height="10" rx="3" fill="#C98A55" ${SO}/>
        ${EY(26, 38, 47, 2.5)}${SM(32, 51, 2.6)}${BL(21, 43, 51)}
        <ellipse cx="20" cy="33" rx="2.5" ry="5" fill="#fff" opacity=".7" transform="rotate(30 20 33)"/>
        ${HEART(52, 13, .19, "#FF5C8A", HW(1.8))}${HEART(9, 20, .14, "#FF8AA6", HW(1.6))}`,
      gaming_handheld: `<defs>${LG("gm-hh-g1", "#DDD6FF", "#A596F0")}</defs>
        <rect x="12" y="3" width="40" height="58" rx="7" fill="url(#gm-hh-g1)" ${SO}/>
        <rect x="17" y="8" width="30" height="25" rx="3" fill="#3A2F74"/>
        <rect x="20" y="11" width="24" height="19" rx="2" fill="#9CF0C8"/>
        ${EY(27, 37, 19, 2.2)}${SM(32, 23, 2.6)}
        <path d="M17 44h4.5v-4.5h5V44H31v5h-4.5v4.5h-5V49H17z" fill="${D}"/>
        <circle cx="42" cy="48" r="3.3" fill="#FF5C8A" ${HW(1.6)}/><circle cx="47.5" cy="42" r="3.3" fill="#FF5C8A" ${HW(1.6)}/>
        ${SH(16, 7, 2.6, 1.2, 0)}`,
      gaming_lvlup: `<defs>${LG("gm-lv-g1", "#8B74F0", "#4E33C4")}${LG("gm-lv-g2", "#B6FF8C", "#3FC45A")}</defs>
        <path d="M32 3l12 12h-7v6H27v-6h-7z" fill="url(#gm-lv-g2)" ${SO}/>
        <rect x="3" y="22" width="58" height="30" rx="10" fill="url(#gm-lv-g1)" ${SO}/>
        ${TX("LVL UP", 32, 42.5, 14, "#fff")}${SH(11, 27, 3.5, 1.6, 0)}
        ${SPARK(8, 11, 5, "#4AD9FF")}${SPARK(56, 11, 5, "#FF8AB0")}`,
      gaming_d20: `<defs>${LG("gm-dc-g1", "#8CEBF5", "#2E9CC2", 1, 1)}</defs>
        <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="url(#gm-dc-g1)" ${SO}/>
        <polygon points="32,17 48,44 16,44" fill="#C4F6FA" ${HW(2)}/>
        <path d="M32 17L7 17.5M32 17V3M32 17l25 .5M16 44L7 17.5M16 44l-9 2.5M16 44l16 17M48 44l9-26.5M48 44l9 2.5M48 44L32 61" stroke="${D}" stroke-width="2" stroke-linecap="round"/>
        ${TX("20", 32, 39.5, 11, "#3A2F74")}`
    }},
    pins: [
      {id: "tp-gaming-button", name: "Arcade Button", kind: "badge", desc: "A glossy pink arcade button in a dark ring.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("gm-pn-g1", "#FFB3CA", "#E0285C")}${LG("gm-pn-g2", "#4A3A9E", "#1C1340")}</defs>
        <circle cx="15" cy="16" r="13" fill="url(#gm-pn-g2)" stroke="#120C2C" stroke-width="1.1"/>
        <circle cx="15" cy="17" r="9.5" fill="#9E1E45"/>
        <circle cx="15" cy="15" r="9.5" fill="url(#gm-pn-g1)" stroke="#8A1A3C" stroke-width="1"/>
        <ellipse cx="11.5" cy="11" rx="3.8" ry="2" fill="#fff" opacity=".8" transform="rotate(-30 11.5 11)"/>
        <circle cx="4.8" cy="11" r="1.1" fill="#4AD9FF"/><circle cx="25.2" cy="11" r="1.1" fill="#8CFF6A"/></svg>`},
      {id: "tp-gaming-pixel", name: "Pixel Heart Tape", kind: "tape", desc: "Lavender tape with a row of pixel hearts.", svg: `<svg viewBox="0 0 86 26"><path d="M3 0H86L83 26H0z" fill="rgba(200,190,245,.82)"/>
        <path d="M3 3H85M1 23H83" stroke="rgba(98,70,214,.4)" stroke-width="1.2" stroke-dasharray="3 3"/>
        ${[8, 27, 46, 65].map((x, i) => PIX(x, 8, 1.6, PHEART, ["#FF5C8A", "#2FC0E0", "#FF5C8A", "#2FC0E0"][i])).join("")}
        ${[22, 41, 60, 79].map(x => `<rect x="${x}" y="12" width="2" height="2" fill="#6246D6" opacity=".6"/>`).join("")}</svg>`}
    ],
    card: {id: "tp-gaming", name: "Pixel Quest", desc: "A glowing game screen with a pixel frame, scanlines and a heart health bar."}
  });

  /* Photo Walk */
  const APERTURE = (() => { const cx = 32, cy = 32, h = 8, R = 21, v = Array.from({length: 6}, (_, i) => { const a = (i * 60 - 90) * Math.PI / 180; return [cx + h * Math.cos(a), cy + h * Math.sin(a)]; });
    return v.map((p, i) => { const q = v[(i + 5) % 6], dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const bx = p[0] - cx, by = p[1] - cy, b = bx * ux + by * uy, c = bx * bx + by * by - R * R, t = -b + Math.sqrt(b * b - c);
      return `M${f1(p[0])} ${f1(p[1])}L${f1(p[0] + ux * t)} ${f1(p[1] + uy * t)}`; }).join(""); })();
  TP_DATA.push({
    theme: "photography",
    pack: {name: "Snapshot Club", items: {
      photography_camera: `<defs>${LG("ph-cm-g1", "#C88A52", "#9A5418")}${RG("ph-cm-g2", "#A8CCF2", "#34508F", .35, .3)}</defs>
        <path d="M21 19l4-8h14l4 8z" fill="#3E3E46" ${SO}/>
        <rect x="45" y="12" width="9" height="7" rx="2" fill="#F2A44E" ${SO}/>
        <rect x="5" y="18" width="54" height="38" rx="7" fill="#F4EFE6" ${SO}/>
        <rect x="6.3" y="28" width="51.4" height="20" fill="url(#ph-cm-g1)"/>
        <rect x="5" y="18" width="54" height="38" rx="7" fill="none" ${SO}/>
        <rect x="10" y="21.5" width="9" height="5" rx="1.5" fill="#fff" ${HW(1.6)}/>
        <circle cx="32" cy="38" r="14" fill="#3E3E46" ${SO}/>
        <circle cx="32" cy="38" r="9.5" fill="url(#ph-cm-g2)"/>
        ${EY(28.5, 35.5, 37, 1.9)}<path d="M30.3 41.2q1.7 1.6 3.4 0" stroke="${D}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="27.5" cy="33" r="1.5" fill="#fff" opacity=".85"/>
        ${BL(13, 51, 40, 3, 2)}`,
      photography_film: `<defs>${LG("ph-fl-g1", "#F6B866", "#C9681B")}</defs>
        <path d="M28 27h31v21H28z" fill="#6B4A2E" ${SO}/>
        <g fill="#F4EFE6">${[31, 37, 43, 49, 55].map(x => `<rect x="${x}" y="29" width="3" height="2.6" rx=".6"/><rect x="${x}" y="43.4" width="3" height="2.6" rx=".6"/>`).join("")}</g>
        <rect x="33" y="33" width="9" height="8.5" rx="1" fill="#F2A44E" opacity=".85"/><rect x="45" y="33" width="9" height="8.5" rx="1" fill="#F2A44E" opacity=".85"/>
        <rect x="10" y="5" width="16" height="7" rx="2" fill="#3E3E46" ${SO}/>
        <rect x="10" y="52" width="16" height="7" rx="2" fill="#3E3E46" ${SO}/>
        <rect x="5" y="10" width="26" height="45" rx="5" fill="url(#ph-fl-g1)" ${SO}/>
        <rect x="5" y="36" width="26" height="9" fill="#FFF6E8" opacity=".95"/><path d="M5 36h26M5 45h26" stroke="${D}" stroke-width="2"/>
        ${EY(13.5, 22.5, 25, 2.3)}${SM(18, 29.5, 2.4)}${SH(10.5, 16, 2.6, 1.5, -60)}`,
      photography_print: `<defs>${LG("ph-pr-g1", "#9CC8F0", "#FFD9A8")}</defs>
        <g transform="rotate(-7 32 32)">
          <rect x="9" y="5" width="46" height="54" rx="3" fill="#fff" ${SO}/>
          <rect x="14" y="10" width="36" height="33" fill="url(#ph-pr-g1)"/>
          <circle cx="41" cy="19" r="5" fill="#FFB84D"/>
          <path d="M14 43l11-15 7 8 5-5 13 12z" fill="#5E8C6A"/><path d="M25 28l3.5 4.6-3.5 2-3.5-2z" fill="#fff" opacity=".9"/>
          <rect x="14" y="10" width="36" height="33" fill="none" stroke="${D}" stroke-width="1.6"/>
          ${HEART(32, 51, .12, "#F07A9A")}
          <rect x="23" y="1" width="18" height="8" fill="#F2A44E" opacity=".75" transform="rotate(4 32 5)"/>
        </g>`,
      photography_aperture: `<defs>${LG("ph-ap-g1", "#F6BE78", "#C96A1A", 1, 1)}</defs>
        <circle cx="32" cy="32" r="28" fill="#3E3E46" ${SO}/>
        <circle cx="32" cy="32" r="21" fill="url(#ph-ap-g1)" stroke="#2B2233" stroke-width="2"/>
        <path d="${APERTURE}" stroke="${D}" stroke-width="2.2" stroke-linecap="round"/>
        <polygon points="${STAR(32, 32, 3, 8, 8, -90)}" fill="#2A2530" ${HW(2)}/>
        <circle cx="29.5" cy="29.5" r="1.6" fill="#fff" opacity=".7"/>
        ${SH(20, 14, 4.5, 2)}<g fill="#F4EFE6"><circle cx="32" cy="7.5" r="1.4"/><circle cx="56.5" cy="32" r="1.4"/><circle cx="32" cy="56.5" r="1.4"/><circle cx="7.5" cy="32" r="1.4"/></g>`,
      photography_cheese: `<defs>${LG("ph-ch-g1", "#FFE78A", "#FFD04A")}${LG("ph-ch-g2", "#FFCB3D", "#F2A93A")}</defs>
        <path d="M5 38L44 11l15 27z" fill="url(#ph-ch-g1)" ${SO}/>
        <path d="M5 38h54v15a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="url(#ph-ch-g2)" ${SO}/>
        <g fill="#E0A12E"><ellipse cx="40" cy="28" rx="3.5" ry="2.2"/><ellipse cx="28" cy="32" rx="2.4" ry="1.5"/><circle cx="50" cy="48" r="3.3"/><circle cx="11" cy="50" r="2.2"/><circle cx="55" cy="42" r="1.6"/></g>
        ${EY(22, 34, 45, 2.4)}${BL(17, 39, 50, 2.8, 1.8)}<path d="M25 48.5q3 3.5 6 0" stroke="${D}" stroke-width="2.2" fill="#FF7FA3" stroke-linecap="round"/>`,
      photography_snap: `<defs>${LG("ph-sn-g1", "#FFB866", "#E0661A", 1, 1)}</defs>
        <polygon points="${STAR(32, 32, 12, 29, 21, -90)}" fill="url(#ph-sn-g1)" ${SO}/>
        ${TX("SNAP!", 32, 37.5, 13.5, "#fff", `transform="rotate(-8 32 32)"`)}
        ${SH(19, 18, 4, 2)}`,
      photography_album: `<defs>${LG("ph-al-g1", "#C98C55", "#94501A", 1, 1)}${LG("ph-al-g2", "#9CC8F0", "#FFD9A8")}</defs>
        <rect x="8" y="5" width="48" height="54" rx="5" fill="url(#ph-al-g1)"/>
        <path d="M8 10a5 5 0 0 1 5-5h4v54h-4a5 5 0 0 1-5-5z" fill="#6E3A12"/>
        <rect x="8" y="5" width="48" height="54" rx="5" fill="none" ${SO}/>
        <rect x="21" y="9" width="31" height="46" rx="2.5" fill="none" stroke="#F2C08A" stroke-width="1.4" stroke-dasharray="2.5 2" opacity=".8"/>
        <g transform="rotate(-5 36 28)"><rect x="23" y="14" width="26" height="26" rx="1.5" fill="#fff" ${HW(2)}/>
          <rect x="26" y="17" width="20" height="16" fill="url(#ph-al-g2)"/><circle cx="41" cy="21.5" r="2.8" fill="#FFB84D"/><path d="M26 33l6-8 4 5 3-3 7 6z" fill="#5E8C6A"/>
          <path d="M23 20v-6h6zM49 34v6h-6z" fill="${D}"/></g>
        <rect x="25" y="45" width="22" height="8" rx="2" fill="#F4EFE6" ${HW(1.8)}/>${HEART(36, 49, .09, "#E0558A")}
        ${SH(22, 9, 2.4, 1.1, 0, .45)}`,
      photography_bulb: `<defs>${RG("ph-fb-g1", "#FFFFFF", "#FFE7A8", .4, .35)}${LG("ph-fb-g2", "#E4E6EC", "#9EA3AF")}</defs>
        <g stroke="#F2A44E" stroke-width="3.5" stroke-linecap="round"><path d="M32 3v5M10 11l4 4M54 11l-4 4M4 30h5M60 30h-5"/></g>
        <circle cx="32" cy="29" r="18" fill="url(#ph-fb-g1)" ${SO}/>
        <path d="M26 30l3-6 3 6 3-6 3 6" stroke="#E0A12E" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 43h20v5H22z" fill="url(#ph-fb-g2)" ${SO}/>
        <rect x="21" y="48" width="22" height="7" rx="2" fill="url(#ph-fb-g2)" ${SO}/>
        <path d="M27 55h10l-2 5h-6z" fill="#3E3E46" ${SO}/>
        ${EY(26, 38, 35, 2.2)}${BL(21, 43, 39, 2.6, 1.7)}${SH(24, 18, 4.5, 2.4)}`
    }},
    pins: [
      {id: "tp-photography-peg", name: "Darkroom Peg", kind: "clip", desc: "A little wooden peg, like prints hung up to dry.", svg: `<svg viewBox="0 0 22 50"><defs>${LG("ph-pg-g1", "#EFD0A4", "#C08450", 1, 0)}${LG("ph-pg-g2", "#E4E6EC", "#8E94A2", 1, 0)}</defs>
        <path d="M4 3h6.5v44H6.5A2.5 2.5 0 0 1 4 44.5z" fill="url(#ph-pg-g1)" stroke="#6E4524" stroke-width="1.1"/>
        <path d="M11.5 3H18v41.5a2.5 2.5 0 0 1-2.5 2.5h-4z" fill="url(#ph-pg-g1)" stroke="#6E4524" stroke-width="1.1"/>
        <path d="M4 17.5q7 2 14 0" stroke="#6E4524" stroke-width="1" fill="none"/>
        <rect x="2.2" y="20" width="17.6" height="6.5" rx="3.2" fill="url(#ph-pg-g2)" stroke="#4A4E58" stroke-width="1.1"/>
        <path d="M5 23.3h12" stroke="#fff" stroke-width="1" opacity=".7"/>
        <rect x="5.4" y="6" width="1.6" height="10" rx=".8" fill="#fff" opacity=".55"/>
        <circle cx="14.8" cy="37" r="1.6" fill="#F2A44E"/></svg>`},
      {id: "tp-photography-film", name: "Film Strip Tape", kind: "tape", desc: "A smoky strip of film with sprocket holes and amber frames.", svg: `<svg viewBox="0 0 86 26"><path d="M4 0H86L82 26H0z" fill="rgba(46,38,33,.8)"/>
        <g fill="#F4EFE6" opacity=".9">${Array.from({length: 13}, (_, i) => `<rect x="${f1(5 + i * 6.2)}" y="2" width="3" height="2.6" rx=".6"/><rect x="${f1(3 + i * 6.2)}" y="21.4" width="3" height="2.6" rx=".6"/>`).join("")}</g>
        <g fill="rgba(242,164,78,.55)">${[9, 31, 53].map(x => `<rect x="${x}" y="7.5" width="19" height="11" rx="1.2"/>`).join("")}</g>
        <path d="M13 16l4-5 3 3 2-2 4 4z" fill="rgba(255,238,210,.75)"/><circle cx="41" cy="12.5" r="2.4" fill="rgba(255,238,210,.75)"/><path d="M57 17l5-6 5 6z" fill="rgba(255,238,210,.75)"/></svg>`}
    ],
    card: {id: "tp-photography", name: "Contact Sheet", desc: "A warm darkroom print between two strips of film, with an amber grease pencil mark."}
  });

  /* New Year's Eve */
  const NY_C = ["#F5C451", "#F07AA0", "#3CC8C0", "#9B7BF0"];
  TP_DATA.push({
    theme: "newyear",
    pack: {name: "Midnight Sparkle", items: {
      newyear_burst: `<defs>${RG("ny-bu-g1", "#3A4596", "#1A1F48", .5, .35)}<clipPath id="ny-bu-c1"><circle cx="32" cy="32" r="27"/></clipPath></defs>
        <circle cx="32" cy="32" r="27" fill="url(#ny-bu-g1)"/>
        <g clip-path="url(#ny-bu-c1)"><path d="M3 64V48h7v-6h6v10h5V40h8v12h5v-8h7v4h6V38h7v10h6v16z" fill="#0F1230"/>
          <g fill="#F5C451" opacity=".85"><rect x="23" y="44" width="2" height="2"/><rect x="47" y="42" width="2" height="2"/><rect x="47" y="47" width="2" height="2"/><rect x="11" y="46" width="2" height="2"/></g></g>
        <g stroke-linecap="round">${Array.from({length: 12}, (_, i) => { const a = i * 30 * Math.PI / 180, x1 = 32 + 5 * Math.cos(a), y1 = 25 + 5 * Math.sin(a), x2 = 32 + 15 * Math.cos(a), y2 = 25 + 15 * Math.sin(a); return `<path d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}" stroke="${NY_C[i % 4]}" stroke-width="3.2"/><circle cx="${f1(32 + 18.5 * Math.cos(a))}" cy="${f1(25 + 18.5 * Math.sin(a))}" r="1.9" fill="${NY_C[i % 4]}"/>`; }).join("")}</g>
        ${SPARK(32, 25, 5, "#FFF3C4")}${SPARK(12, 15, 2.6, "#fff")}${SPARK(52, 40, 2.2, "#fff")}
        <circle cx="32" cy="32" r="27" fill="none" ${SO}/>`,
      newyear_popper: `<defs>${LG("ny-pp-g1", "#B39CF5", "#6E4FD6", 1, 1)}</defs>
        <path d="M30 32q6-14 2-24M34 34q12-8 22-4M32 33q14-14 16-26" stroke="${D}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M30 32q6-14 2-24" stroke="#F07AA0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 34q12-8 22-4" stroke="#3CC8C0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M32 33q14-14 16-26" stroke="#F5C451" stroke-width="3" fill="none" stroke-linecap="round"/>
        <g ${HW(1.5)}><rect x="18" y="12" width="5" height="5" rx="1" fill="#F5C451" transform="rotate(20 20 14)"/><rect x="50" y="42" width="5" height="5" rx="1" fill="#F07AA0" transform="rotate(-25 52 44)"/><circle cx="42" cy="22" r="2.6" fill="#9B7BF0"/><circle cx="57" cy="20" r="2.4" fill="#3CC8C0"/></g>
        ${SPARK(24, 26, 3.5, "#F5C451")}
        <path d="M5 60L18 28l18 18z" fill="url(#ny-pp-g1)" ${SO}/>
        <path d="M13 40l12 12M9 50l7 7" stroke="#F5C451" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="27" cy="37" rx="12.7" ry="4.2" fill="#F5C451" ${SO} transform="rotate(45 27 37)"/>
        `,
      newyear_clock: `<defs>${LG("ny-ck-g1", "#FFE08A", "#E0A62A", 1, 1)}${LG("ny-ck-g2", "#FF9CC0", "#E0558A")}</defs>
        <circle cx="30" cy="36" r="24" fill="url(#ny-ck-g1)" ${SO}/>
        <circle cx="30" cy="36" r="18.5" fill="#FFFBF0" ${HW(2)}/>
        <g fill="#3D4BB0">${Array.from({length: 12}, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<circle cx="${f1(30 + 15 * Math.cos(a))}" cy="${f1(36 + 15 * Math.sin(a))}" r="${i % 3 ? .9 : 1.5}"/>`; }).join("")}</g>
        <path d="M30 36V23" stroke="#3D4BB0" stroke-width="2" stroke-linecap="round"/><path d="M30 36V27" stroke="${D}" stroke-width="3.2" stroke-linecap="round"/><circle cx="30" cy="36" r="2.2" fill="${D}"/>
        ${EY(23, 37, 40, 2.2)}${SM(30, 45, 2.6)}${BL(19, 41, 45, 2.7, 1.8)}
        <path d="M40 16.5L58 4l-3 22z" fill="url(#ny-ck-g2)" ${SO}/>
        <path d="M49 10l1.5 4M54 16l1 4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="58" cy="4.5" r="3.6" fill="#F5C451" ${HW(2)}/>`,
      newyear_disco: `<defs>${RG("ny-dc-g1", "#FFFFFF", "#8E9BE0", .35, .3)}<clipPath id="ny-dc-c1"><circle cx="32" cy="35" r="23"/></clipPath></defs>
        <path d="M32 3v9" stroke="${D}" stroke-width="2.4" stroke-linecap="round"/><rect x="28" y="9" width="8" height="4" rx="1" fill="#C9CEE8" ${HW(1.8)}/>
        <circle cx="32" cy="35" r="23" fill="url(#ny-dc-g1)"/>
        <g clip-path="url(#ny-dc-c1)">
          <g fill="#fff" opacity=".85"><rect x="18" y="18" width="7" height="6"/><rect x="25" y="24" width="7" height="6"/></g>
          <rect x="39" y="36" width="7" height="6" fill="#F07AA0" opacity=".7"/><rect x="18" y="42" width="7" height="6" fill="#3CC8C0" opacity=".6"/><rect x="32" y="48" width="7" height="6" fill="#F5C451" opacity=".7"/><rect x="46" y="24" width="7" height="6" fill="#9B7BF0" opacity=".5"/>
          <path d="M4 18h56M4 24h56M4 30h56M4 36h56M4 42h56M4 48h56M4 54h56" stroke="#5E6AB8" stroke-width="1.2" opacity=".75"/>
          <path d="M11 12v48M18 12v48M25 12v48M32 12v48M39 12v48M46 12v48M53 12v48" stroke="#5E6AB8" stroke-width="1.2" opacity=".75"/>
        </g>
        <circle cx="32" cy="35" r="23" fill="none" ${SO}/>
        ${SPARK(9, 13, 5, "#F5C451")}${SPARK(56, 14, 4, "#F07AA0")}${SPARK(57, 55, 3.5, "#3CC8C0")}`,
      newyear_goals: `<defs>${LG("ny-gl-g1", "#5A68D0", "#2F3A96")}</defs>
        <rect x="9" y="7" width="46" height="54" rx="6" fill="url(#ny-gl-g1)" ${SO}/>
        <rect x="14" y="14" width="36" height="42" rx="2.5" fill="#fff"/>
        <rect x="23" y="3" width="18" height="9" rx="3" fill="#F5C451" ${SO}/>
        ${TX("GOALS", 32, 24.5, 9.5, "#3D4BB0")}
        <g fill="none" stroke="${D}" stroke-width="1.8"><rect x="18" y="30" width="6" height="6" rx="1.2"/><rect x="18" y="40" width="6" height="6" rx="1.2"/></g>
        <path d="M19 33l2 2 5-6M19 43l2 2 5-6" stroke="#F07AA0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M29 33h16M29 43h12" stroke="#C9CEE8" stroke-width="2.8" stroke-linecap="round"/>
        <polygon points="${STAR(21, 51, 5, 4, 1.8)}" fill="#F5C451"/><path d="M29 51h10" stroke="#C9CEE8" stroke-width="2.8" stroke-linecap="round"/>
        ${SPARK(56, 50, 6, "#F5C451")}`,
      newyear_sparkler: `<defs>${LG("ny-sk-g1", "#FFF1A8", "#FFB82E", 1, 1)}</defs>
        <path d="M8 59l18-21" stroke="${D}" stroke-width="7" stroke-linecap="round"/><path d="M8 59l18-21" stroke="#B8BCD6" stroke-width="3" stroke-linecap="round"/>
        <g stroke-linecap="round" stroke-width="2.6"><path d="M20 12l-4-4" stroke="#F07AA0"/><path d="M60 34l4 1" stroke="#3CC8C0"/><path d="M52 58l2 3" stroke="#9B7BF0"/><path d="M13 30l-5 0" stroke="#F5C451"/></g>
        <path d="M37 4C38.5 18 42 22 58 25c-16 3-19.5 7-21 21-1.5-14-5-18-21-21 16-3 19.5-7 21-21z" fill="url(#ny-sk-g1)" ${SO}/>
        ${EY(33, 41, 24, 2.2)}${SM(37, 29, 2.4)}
        ${SPARK(55, 8, 4.5, "#F07AA0")}${SPARK(16, 44, 3.5, "#3CC8C0")}${SPARK(54, 44, 3, "#F5C451")}`,
      newyear_rocket: `<defs>${LG("ny-rk-g1", "#FF9CC0", "#E0558A", 1, 0)}</defs>
        <g transform="rotate(28 32 34)">
          <path d="M32 46v16" stroke="${D}" stroke-width="6" stroke-linecap="round"/><path d="M32 46v16" stroke="#E0B878" stroke-width="2.6" stroke-linecap="round"/>
          <rect x="22" y="18" width="20" height="29" rx="3" fill="url(#ny-rk-g1)" ${SO}/>
          <path d="M20 19L32 3l12 16z" fill="#3D4BB0" ${SO}/>
          <rect x="22" y="36" width="20" height="5" fill="#F5C451" stroke="${D}" stroke-width="2"/>
          ${EY(27.5, 36.5, 26, 2.1)}${SM(32, 30.5, 2.4)}${SH(25.5, 22, 1.4, 3, 0)}
        </g>
        <g stroke-linecap="round" stroke-width="2.6"><path d="M12 54l-5 3" stroke="#F5C451"/><path d="M16 60l-2 3" stroke="#F07AA0"/><path d="M8 46l-4 0" stroke="#3CC8C0"/></g>${SPARK(9, 38, 3, "#F5C451")}`,
      newyear_hourglass: `<defs>${LG("ny-hg-g1", "#FFE08A", "#F0B030")}${LG("ny-hg-g2", "#5A68D0", "#2F3A96")}</defs>
        <path d="M16 10v44M48 10v44" stroke="${D}" stroke-width="6" stroke-linecap="round"/><path d="M16 10v44M48 10v44" stroke="#6E78C4" stroke-width="2.4"/>
        <path d="M20 10h24c0 13-9 16-9 22s9 9 9 22H20c0-13 9-16 9-22s-9-9-9-22z" fill="#EEF2FF" ${SO}/>
        <path d="M23.5 15h17c-1 6-6 9-8.5 13-2.5-4-7.5-7-8.5-13z" fill="url(#ny-hg-g1)"/>
        <path d="M32 29v20" stroke="#F0B030" stroke-width="1.6" stroke-dasharray="2 2"/>
        <path d="M22 52c1-6 6-8 10-9 4 1 9 3 10 9z" fill="url(#ny-hg-g1)"/>
        <rect x="10" y="4" width="44" height="8" rx="3.5" fill="url(#ny-hg-g2)" ${SO}/>
        <rect x="10" y="52" width="44" height="8" rx="3.5" fill="url(#ny-hg-g2)" ${SO}/>
        ${SH(25, 20, 1.3, 3.5, -20, .8)}${SPARK(58, 30, 4.5, "#F07AA0")}${SPARK(6, 32, 4, "#3CC8C0")}`
    }},
    pins: [
      {id: "tp-newyear-star", name: "Gold Star Pin", kind: "badge", desc: "A shiny gold star with a sparkle.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("ny-pn-g1", "#FFF3B0", "#E0A020", .35, .3)}</defs>
        <polygon points="${STAR(15, 16, 5, 13.5, 6.4)}" fill="url(#ny-pn-g1)" stroke="#8A5A08" stroke-width="1.1" stroke-linejoin="round"/>
        <polygon points="${STAR(15, 16, 5, 6.4, 3)}" fill="#FFE27A" opacity=".8"/>
        <ellipse cx="11.5" cy="11.5" rx="2.6" ry="1.3" fill="#fff" opacity=".85" transform="rotate(-35 11.5 11.5)"/>
        ${SPARK(26, 4, 3, "#fff")}</svg>`},
      {id: "tp-newyear-confetti", name: "Confetti Ribbon", kind: "tape", desc: "Midnight blue tape scattered with bright confetti.", svg: `<svg viewBox="0 0 86 26"><path d="${ZIG}" fill="rgba(45,54,121,.8)"/>
        ${[[9, 7, 0], [18, 17, 1], [27, 9, 2], [36, 18, 3], [45, 6, 0], [54, 15, 1], [63, 8, 2], [72, 17, 3], [79, 9, 0], [14, 12, 3], [50, 20, 2], [68, 13, 0]].map(([x, y, c], i) => i % 3 === 0 ? `<rect x="${x}" y="${y}" width="4" height="2.2" rx=".6" fill="${NY_C[c]}" transform="rotate(${i * 25} ${x + 2} ${y + 1})"/>` : i % 3 === 1 ? `<circle cx="${x}" cy="${y}" r="1.5" fill="${NY_C[c]}"/>` : `<path d="M${x} ${y - 2.2}l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" fill="${NY_C[c]}"/>`).join("")}</svg>`}
    ],
    card: {id: "tp-newyear", name: "Midnight Fireworks", desc: "A midnight blue card with gold foil trim, corner fireworks and a sleeping city skyline."}
  });

  /* Lunar New Year */
  TP_DATA.push({
    theme: "lunarnewyear",
    pack: {name: "Lantern Luck", items: {
      lunarnewyear_lantern: `<defs>${LG("ln-lt-g1", "#FF7560", "#C42E28")}${LG("ln-lt-g2", "#FFE08A", "#E0A62A")}</defs>
        <path d="M32 2v7" stroke="${D}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M28 55h8l1.5 7h-11z" fill="#F5C451" ${HW(2)}/>
        <ellipse cx="32" cy="32" rx="25" ry="20" fill="url(#ln-lt-g1)" ${SO}/>
        <path d="M22 13.5q-8 18.5 0 37M42 13.5q8 18.5 0 37" stroke="#A3231F" stroke-width="2" fill="none" opacity=".55"/>
        <rect x="20" y="8" width="24" height="7" rx="2.5" fill="url(#ln-lt-g2)" ${SO}/>
        <rect x="20" y="49" width="24" height="7" rx="2.5" fill="url(#ln-lt-g2)" ${SO}/>
        ${EY(25, 39, 31, 2.8)}${BL(19, 45, 37)}${SM(32, 36, 3)}${SH(15, 23, 4, 2.2, -50)}`,
      lunarnewyear_plum: `<path d="M5 60C15 50 22 42 30 36S46 22 60 8" stroke="#4A2C28" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M29 37q2-13-5-24" stroke="#4A2C28" stroke-width="3.6" fill="none" stroke-linecap="round"/>
        <path d="M44 25q7 2 11 10" stroke="#4A2C28" stroke-width="3" fill="none" stroke-linecap="round"/>
        <g fill="#FF9FBC" ${HW(1.8)}><circle cx="57" cy="7" r="3.5"/><circle cx="55" cy="36" r="3.2"/><circle cx="8" cy="52" r="3"/></g>
        ${BLOSSOM(40, 26, 20, "#FFB8CC", 2.2)}${BLOSSOM(17, 45, 15, "#FF9FBC", 2)}${BLOSSOM(23, 12, 12, "#FFC9D8", 1.8)}
        <g fill="#C8302C"><circle cx="40" cy="26" r="1.3"/><circle cx="17" cy="45" r="1.1"/></g>`,
      lunarnewyear_envelope: `<defs>${LG("ln-ev-g1", "#EE4E40", "#B4292A")}${LG("ln-ev-g2", "#FFE69A", "#E0A62A", 1, 1)}</defs>
        <rect x="11" y="4" width="42" height="56" rx="5" fill="url(#ln-ev-g1)" ${SO}/>
        <path d="M12.3 9a4 4 0 0 1 4-4h31.4a4 4 0 0 1 4 4v10q-19.7 13-39.4 0z" fill="#CC3530" ${HW(2)}/>
        <rect x="16" y="33" width="32" height="22" rx="3" fill="none" stroke="#F5C451" stroke-width="1.6" stroke-dasharray="3 2"/>
        <circle cx="32" cy="25" r="7.5" fill="url(#ln-ev-g2)" ${SO}/><rect x="29.5" y="22.5" width="5" height="5" rx="1" fill="#C8302C"/>
        ${BLOSSOM(32, 44, 13, "#F5C451", 0, "#FFE9A8")}
        ${SH(16, 11, 3, 1.5, -20)}`,
      lunarnewyear_dumpling: `<defs>${LG("ln-dp-g1", "#FFFFFF", "#F4E4CC")}</defs>
        <path d="M5 45c0-16 12-27 27-27s27 11 27 27c0 8-6 12-13 12H18C11 57 5 53 5 45z" fill="url(#ln-dp-g1)" ${SO}/>
        <path d="M12 30q3 3 2 7M52 30q-3 3-2 7M18 24q3 4 2 8M46 24q-3 4-2 8" stroke="#D9C3A0" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M19 22L21 8q11-4 22 0l2 14q-13-5-26 0z" fill="#fff" ${SO}/>
        <rect x="30.2" y="10" width="3.6" height="9" rx=".8" fill="#E0463C"/><rect x="27.5" y="12.7" width="9" height="3.6" rx=".8" fill="#E0463C"/>
        ${EY(23, 41, 40, 2.8)}${BL(17, 47, 46)}${SM(32, 45, 3)}`,
      lunarnewyear_mandarin: `<defs>${RG("ln-md-g1", "#FFC56B", "#EE7417", .35, .3)}</defs>
        <circle cx="32" cy="37" r="23" fill="url(#ln-md-g1)" ${SO}/>
        <path d="M32 15c-5-9-15-10-22-6 5 7 14 9 22 6z" fill="#3E9E4F" ${SO}/>
        <path d="M32 15c4-8 13-10 20-7-4 7-12 10-20 7z" fill="#5BBE5E" ${SO}/>
        <circle cx="32" cy="15.5" r="2.6" fill="#2F7A3E" ${HW(1.6)}/>
        ${EY(24, 40, 37, 3)}${BL(18, 46, 43)}${SM(32, 42, 3.2)}
        <g fill="#D9640E" opacity=".45"><circle cx="16" cy="48" r="1"/><circle cx="46" cy="52" r="1"/><circle cx="50" cy="30" r="1"/></g>${SH(20, 26, 4.5, 2.5)}`,
      lunarnewyear_crackers: `<defs>${LG("ln-fc-g1", "#FF6A55", "#C42E28", 1, 0)}</defs>
        <g transform="rotate(-16 32 54)">
          <path d="M21 13q0-6 4-8" stroke="${D}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <rect x="14" y="13" width="15" height="40" rx="3" fill="url(#ln-fc-g1)" ${SO}/>
          <path d="M14 20h15M14 46h15" stroke="#F5C451" stroke-width="3.5"/><circle cx="21.5" cy="33" r="3.2" fill="none" stroke="#F5C451" stroke-width="1.8"/>
        </g>
        <g transform="rotate(16 32 54)">
          <path d="M43 13q0-6-4-8" stroke="${D}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <rect x="35" y="13" width="15" height="40" rx="3" fill="url(#ln-fc-g1)" ${SO}/>
          <path d="M35 20h15M35 46h15" stroke="#F5C451" stroke-width="3.5"/><circle cx="42.5" cy="33" r="3.2" fill="none" stroke="#F5C451" stroke-width="1.8"/>
        </g>
        <path d="M32 50l-9-6v12zM32 50l9-6v12z" fill="#F5C451" ${HW(2)}/><circle cx="32" cy="50" r="3.2" fill="#E0A62A" ${HW(2)}/>
        ${SPARK(11, 6, 5, "#F5C451")}${SPARK(53, 6, 5, "#F5C451")}`,
      lunarnewyear_lucky: `<defs>${LG("ln-lk-g1", "#E8473C", "#B02A28")}${LG("ln-lk-g2", "#FFE08A", "#D99A22", 1, 0)}</defs>
        <rect x="8" y="17" width="48" height="30" rx="2" fill="url(#ln-lk-g1)" ${SO}/>
        <rect x="12" y="21" width="40" height="22" fill="none" stroke="#F5C451" stroke-width="1.3" opacity=".8"/>
        ${TX("LUCKY", 32, 36.5, 10.5, "#FFE08A")}
        <rect x="3" y="13" width="8" height="38" rx="4" fill="url(#ln-lk-g2)" ${SO}/>
        <rect x="53" y="13" width="8" height="38" rx="4" fill="url(#ln-lk-g2)" ${SO}/>
        ${BLOSSOM(32, 10, 10, "#FFB8CC", 1.8)}
        <path d="M28 51l-3 9M36 51l3 9" stroke="#E0463C" stroke-width="3" stroke-linecap="round"/>`,
      lunarnewyear_coin: `<defs>${LG("ln-cn-g1", "#FFE69A", "#E0A020", 1, 1)}</defs>
        <path d="M32 2v10" stroke="#D6362F" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M32 46v5M28 51h8l2 11H26z" fill="#E0463C" ${HW(2)}/><path d="M30 54v6M34 54v6" stroke="#A3231F" stroke-width="1.4"/>
        <circle cx="32" cy="29" r="22" fill="url(#ln-cn-g1)" ${SO}/>
        <circle cx="32" cy="29" r="16" fill="none" stroke="#C58A12" stroke-width="2"/>
        <rect x="26" y="23" width="12" height="12" rx="1.5" fill="#fff" ${HW(2)}/>
        <path d="M32 12v11M32 35v11" stroke="#D6362F" stroke-width="3.2"/>
        <g fill="#C58A12"><rect x="30" y="16" width="4" height="4" rx="1"/><rect x="30" y="38" width="4" height="4" rx="1"/><rect x="19" y="27" width="4" height="4" rx="1"/><rect x="41" y="27" width="4" height="4" rx="1"/></g>
        ${SH(20, 17, 4.5, 2.2)}`
    }},
    pins: [
      {id: "tp-lunarnewyear-plum", name: "Plum Blossom Pin", kind: "badge", desc: "A glossy pink plum blossom with a gold heart.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("ln-pn-g1", "#FFE3EC", "#F27CA0", .4, .35)}${RG("ln-pn-g2", "#FFF2B8", "#E0A020", .4, .35)}</defs>
        <g fill="url(#ln-pn-g1)" stroke="#9E2A4A" stroke-width="1.1">${[0, 72, 144, 216, 288].map(a => { const t = (a - 90) * Math.PI / 180; return `<circle cx="${f1(15 + 7 * Math.cos(t))}" cy="${f1(15.5 + 7 * Math.sin(t))}" r="6.4"/>`; }).join("")}</g>
        <circle cx="15" cy="15.5" r="4.2" fill="url(#ln-pn-g2)" stroke="#8A5A08" stroke-width="1"/>
        <g fill="#C8302C">${[0, 72, 144, 216, 288].map(a => { const t = (a - 90) * Math.PI / 180; return `<circle cx="${f1(15 + 2.3 * Math.cos(t))}" cy="${f1(15.5 + 2.3 * Math.sin(t))}" r=".7"/>`; }).join("")}</g>
        <ellipse cx="12.5" cy="6.5" rx="2" ry="1.1" fill="#fff" opacity=".85" transform="rotate(-25 12.5 6.5)"/></svg>`},
      {id: "tp-lunarnewyear-paper", name: "Red Paper Tape", kind: "tape", desc: "Red paper tape printed with little gold coins.", svg: `<svg viewBox="0 0 86 26"><path d="${ZIG}" fill="rgba(206,50,44,.86)"/>
        <path d="M4 3.5h78M4 22.5h78" stroke="#F5C451" stroke-width="1.2" opacity=".9"/>
        <g fill="none" stroke="#F5C451" stroke-width="1.3">${[12, 30, 48, 66].map(x => `<circle cx="${x}" cy="13" r="5"/><rect x="${x - 1.6}" y="11.4" width="3.2" height="3.2"/>`).join("")}</g>
        <g fill="#F5C451">${[21, 39, 57, 75].map(x => `<path d="M${x} 10.5l2.5 2.5-2.5 2.5-2.5-2.5z"/>`).join("")}</g></svg>`}
    ],
    card: {id: "tp-lunarnewyear", name: "Red Paper Gold", desc: "Rich red paper with gold embossed corners and a fine gold border."}
  });

  /* Valentine's Day */
  TP_DATA.push({
    theme: "valentines",
    pack: {name: "Sweetheart Post", items: {
      valentines_balloon: `<defs>${LG("vl-bl-g1", "#FF9CBC", "#E0325E", 1, 1)}</defs>
        <path d="M32 50q-7 5-1 9t0 5" stroke="${D}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M32 47l-3.5 5h7z" fill="#E0325E" ${HW(2)}/>
        <path d="M32 48S6 34 6 18A12 12 0 0 1 32 13a12 12 0 0 1 26 5c0 16-26 30-26 30z" fill="url(#vl-bl-g1)" ${SO}/>
        ${SH(16, 15, 5, 2.8)}${EY(24, 40, 24, 2.7)}${BL(18, 46, 30)}${SM(32, 29, 3)}
        ${HEART(54, 51, .16, "#FFB3CF", HW(1.8))}${HEART(9, 45, .12, "#F28BB8", HW(1.6))}`,
      valentines_letter: `<defs>${LG("vl-lt-g1", "#FFF7F9", "#FFDDE6")}</defs>
        <rect x="5" y="17" width="54" height="38" rx="4" fill="url(#vl-lt-g1)" ${SO}/>
        <path d="M7 53l19-17M57 53L38 36" stroke="#E7A6B8" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M6.5 19.5L32 40l25.5-20.5" fill="#FFE8EE" ${HW(2.2)}/>
        ${HEART(32, 39, .22, "#C23A5E", HW(2))}
        ${HEART(47, 7, .15, "#F28BB8", HW(1.7))}${HEART(56, 13, .1, "#E8466E", HW(1.5))}${HEART(38, 6, .09, "#FFB3CF", HW(1.4))}`,
      valentines_bear: `<defs>${LG("vl-br-g1", "#D9A07A", "#B8784F")}${LG("vl-br-g2", "#FF7D9C", "#D92E58", 1, 1)}</defs>
        <circle cx="16" cy="12" r="7" fill="#C68B63" ${SO}/><circle cx="48" cy="12" r="7" fill="#C68B63" ${SO}/>
        <circle cx="16" cy="12" r="3.3" fill="#F2C2A6"/><circle cx="48" cy="12" r="3.3" fill="#F2C2A6"/>
        <ellipse cx="32" cy="48" rx="17" ry="13" fill="#C68B63" ${SO}/>
        <circle cx="32" cy="24" r="16" fill="url(#vl-br-g1)" ${SO}/>
        <ellipse cx="32" cy="29.5" rx="6.5" ry="4.8" fill="#F7DCC8"/><ellipse cx="32" cy="27.5" rx="2.4" ry="1.7" fill="${D}"/>
        <path d="M30 31q2 1.6 4 0" stroke="${D}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        ${EY(25, 39, 22, 2.4)}${BL(20, 44, 29, 3, 2)}
        ${HEART(32, 48, .36, "url(#vl-br-g2)", SO)}
        <circle cx="17" cy="47" r="5" fill="#C68B63" ${SO}/><circle cx="47" cy="47" r="5" fill="#C68B63" ${SO}/>
        ${SH(27, 45, 2.6, 1.4)}`,
      valentines_candy: `<defs>${LG("vl-cd-g1", "#FFD6E2", "#FFAEC6", 1, 1)}</defs>
        <path d="M32 58S4 42 4 22A13.5 13.5 0 0 1 32 16a13.5 13.5 0 0 1 28 6c0 20-28 36-28 36z" fill="url(#vl-cd-g1)" ${SO}/>
        ${TX("BE", 32, 31, 12, "#B8264E")}${TX("MINE", 32, 44, 12, "#B8264E")}
        ${SH(15, 17, 4.5, 2.4, -40, .8)}`,
      valentines_rose: `<defs>${LG("vl-rs-g1", "#FF6F92", "#C8264E", 1, 1)}</defs>
        <path d="M32 36v25" stroke="#3E8E4A" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M32 52c-6-8-16-8-21-4 6 6 15 7 21 4z" fill="#5BAE55" ${SO}/>
        <path d="M32 45c6-6 14-7 19-3-5 5-12 6-19 3z" fill="#6CC070" ${SO}/>
        <path d="M11 22C11 11 20 5 32 5s21 6 21 17c0 11-9 17-21 17S11 33 11 22z" fill="url(#vl-rs-g1)" ${SO}/>
        <path d="M32 13c-5 0-8 4-6 8 2 4 10 3 10-2 0-3-2.5-4.5-5-3.5M17 22q5 9 15 9t15-9M22 13q-5 3-4 9M42 13q5 3 4 9" stroke="#8E1838" stroke-width="2.1" fill="none" stroke-linecap="round"/>
        ${SH(19, 13, 3.5, 2)}`,
      valentines_berry: `<defs><clipPath id="vl-sb-c1"><path d="M32 61C15 52 8 37 11 26c3-8 12-10 21-8 9-2 18 0 21 8 3 11-4 26-21 35z"/></clipPath>${LG("vl-sb-g1", "#FF6A7E", "#E0304E")}</defs>
        <path d="M32 61C15 52 8 37 11 26c3-8 12-10 21-8 9-2 18 0 21 8 3 11-4 26-21 35z" fill="url(#vl-sb-g1)"/>
        <g clip-path="url(#vl-sb-c1)"><path d="M0 40q5 5 9 1t8 3 8-2 7 5 8-4 8 2 8-3 8 1V64H0z" fill="#6B3A2A"/>
          <g stroke-linecap="round" stroke-width="2"><path d="M20 50l3 1" stroke="#FFB3CF"/><path d="M35 54l2-2" stroke="#fff"/><path d="M42 47l3 1" stroke="#FFD23F"/><path d="M27 57l1 2" stroke="#9BE7FF"/></g></g>
        <path d="M32 61C15 52 8 37 11 26c3-8 12-10 21-8 9-2 18 0 21 8 3 11-4 26-21 35z" fill="none" ${SO}/>
        <g fill="#FFE08A"><ellipse cx="18" cy="27" rx="1" ry="1.5"/><ellipse cx="46" cy="27" rx="1" ry="1.5"/><ellipse cx="15" cy="36" rx="1" ry="1.5"/><ellipse cx="49" cy="36" rx="1" ry="1.5"/></g>
        <path d="M32 20c-4-5-12-7-16-4 3 4 10 5 16 4zM32 20c4-5 12-7 16-4-3 4-10 5-16 4zM32 20c-2-5-2-10 1-14 3 3 2 9-1 14z" fill="#5BAE55" ${HW(2)}/>
        ${EY(25, 39, 30, 2.4)}${BL(20, 44, 35, 2.8, 1.8)}${SM(32, 34, 2.6)}`,
      valentines_steth: `<defs>${LG("vl-st-g1", "#FF9CBC", "#E8466E", 1, 1)}${LG("vl-st-g2", "#EEF1F6", "#A8B0BE", 1, 1)}</defs>
        <path d="M32 58S5 42 5 23a13.5 13.5 0 0 1 27-5 13.5 13.5 0 0 1 27 5c0 19-27 35-27 35z" fill="url(#vl-st-g1)" ${SO}/>
        ${SH(15, 17, 4.5, 2.5)}${EY(24, 40, 26, 2.6)}${BL(18, 46, 32)}${SM(32, 31, 3)}
        <path d="M15 16c-2 16 5 25 17 25s19-9 17-25M41 39.5q7 3 9 9" stroke="${D}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        <path d="M15 16c-2 16 5 25 17 25s19-9 17-25M41 39.5q7 3 9 9" stroke="#7EA6D8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="15" cy="15" r="2.8" fill="#C9D2E0" ${HW(1.8)}/><circle cx="49" cy="15" r="2.8" fill="#C9D2E0" ${HW(1.8)}/>
        <circle cx="51" cy="51" r="6" fill="url(#vl-st-g2)" ${SO}/><circle cx="51" cy="51" r="2.6" fill="#E8466E"/>`,
      valentines_lock: `<defs>${LG("vl-lk-g1", "#FFB3CF", "#F07AA0", 1, 1)}${LG("vl-lk-g2", "#FFE08A", "#E0A62A", 1, 0)}</defs>
        <path d="M20 30V20a12 12 0 0 1 24 0v10" fill="none" stroke="${D}" stroke-width="10" stroke-linecap="round"/>
        <path d="M20 30V20a12 12 0 0 1 24 0v10" fill="none" stroke="url(#vl-lk-g2)" stroke-width="5" stroke-linecap="round"/>
        <rect x="9" y="27" width="46" height="33" rx="9" fill="url(#vl-lk-g1)" ${SO}/>
        ${HEART(32, 44, .3, "#C23A5E", HW(2))}
        <path d="M32 46v5" stroke="#FFD6E2" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="44" r="2.3" fill="#FFD6E2"/>
        ${SH(15, 32, 3.5, 1.8, 0)}<circle cx="16" cy="53" r="1.6" fill="#fff" opacity=".7"/>`
    }},
    pins: [
      {id: "tp-valentines-candy", name: "Candy Heart Pin", kind: "badge", desc: "A glossy candy pink heart.", svg: `<svg viewBox="0 0 30 30"><defs>${RG("vl-pn-g1", "#FFD0E0", "#E8466E", .35, .3)}</defs>
        <path d="M15 27S2.5 19.5 2.5 10.5A6.3 6.3 0 0 1 15 8a6.3 6.3 0 0 1 12.5 2.5C27.5 19.5 15 27 15 27z" fill="url(#vl-pn-g1)" stroke="#8A1E3C" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M15 22.5S7 17.5 7 11.5a3.6 3.6 0 0 1 8-1.5" fill="none" stroke="#fff" stroke-width="1" opacity=".35"/>
        <ellipse cx="8.5" cy="9.5" rx="2.6" ry="1.5" fill="#fff" opacity=".85" transform="rotate(-35 8.5 9.5)"/><circle cx="12" cy="7.2" r=".8" fill="#fff" opacity=".8"/></svg>`},
      {id: "tp-valentines-lace", name: "Lace Ribbon", kind: "tape", desc: "A pink ribbon with lacy scallops and tiny hearts.", svg: `<svg viewBox="0 0 86 26"><g fill="rgba(255,255,255,.85)">${Array.from({length: 14}, (_, i) => `<circle cx="${f1(4 + i * 6)}" cy="4" r="3.2"/><circle cx="${f1(4 + i * 6)}" cy="22" r="3.2"/>`).join("")}</g>
        <path d="M0 3H86L80 13 86 23H0L6 13z" fill="rgba(240,122,160,.82)"/>
        <path d="M3 6H82M3 20H82" stroke="#fff" stroke-width="1" stroke-dasharray="1.6 2" opacity=".85"/>
        <g fill="#fff">${[16, 31, 46, 61].map(x => `<path d="M${x} 16.5s-4-2.4-4-5a2 2 0 0 1 4-.8 2 2 0 0 1 4 .8c0 2.6-4 5-4 5z"/>`).join("")}</g>
        <g fill="#C23A5E">${[23.5, 38.5, 53.5, 68.5].map(x => `<circle cx="${x}" cy="13" r="1.1"/>`).join("")}</g></svg>`}
    ],
    card: {id: "tp-valentines", name: "Love Letter", desc: "Blush letter paper with a lace edge and a red wax seal heart."}
  });
})();


