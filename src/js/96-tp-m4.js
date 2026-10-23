/* ===== module: 96-tp-m4.js ===== */
/* Theme Collections, Study Fields batch m4 */
(() => {
  const O = "#2B2233";
  const S2 = SOw(2), S15 = SOw(1.6);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const rg = (id, a, b, cx = .35, cy = .3) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const T = (t, x, y, sz, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${t}</text>`;
  const scal = (cx, cy, r, n, b) => { let d = ""; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1)), c = [cx + (r + b) * Math.cos(am), cy + (r + b) * Math.sin(am)].map(v => v.toFixed(1)); d += (i ? "" : `M${p(a0)}`) + `Q${c} ${p(a1)}`; } return d + "z"; };
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + (cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1); } return d + "z"; };
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z" fill="${c}"/>`;
  const mouth = (x, y, w = 2, sw = 1.8) => `<path d="M${x - w} ${y}q${w} ${w * .85} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const cheeks = (a, b, y, rx = 2.6, ry = 1.7) => `<ellipse cx="${a}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/><ellipse cx="${b}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FF8FA8" opacity=".8"/>`;
  const happy = (a, b, y, w = 2.2) => `<path d="M${a - w} ${y}q${w} ${-w * 1.1} ${w * 2} 0M${b - w} ${y}q${w} ${-w * 1.1} ${w * 2} 0" fill="none" stroke="${O}" stroke-width="1.9" stroke-linecap="round"/>`;
  // a tiny eighth note (for floating notes)
  const note8 = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M2.6 0V-9.5Q6.5-7.5 7-4" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="3" ry="2.3" fill="${c}" transform="rotate(-20)"/></g>`;

  /* ================= CONCERT HALL ================= */
  TP_DATA.push({
    theme: "concert",
    pack: {name: "Sweet Symphony", items: {
      concert_notes: `${lg("m4cn-nt-b", "#FF8C9C", "#C93A5A")}${lg("m4cn-nt-s", "#E0546E", "#A82A48", 1, 0)}
        <rect x="24.5" y="16" width="5" height="32" fill="#C93A5A" ${S2}/><rect x="50.5" y="8" width="5" height="34" fill="#C93A5A" ${S2}/>
        <path d="M25 13L55 5V14L25 22z" fill="url(#m4cn-nt-s)"/><path d="M25 13L55 5V14L25 22z" fill="none" ${SO}/>
        <path d="M29 15.5L51 9.6" stroke="#FFC2CC" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        <ellipse cx="18" cy="48" rx="12.5" ry="9.5" transform="rotate(-18 18 48)" fill="url(#m4cn-nt-b)" ${SO}/>
        <ellipse cx="44" cy="42" rx="12.5" ry="9.5" transform="rotate(-18 44 42)" fill="url(#m4cn-nt-b)" ${SO}/>
        <ellipse cx="12" cy="43" rx="3.2" ry="1.7" transform="rotate(-30 12 43)" fill="#fff" opacity=".6"/><ellipse cx="38" cy="37" rx="3.2" ry="1.7" transform="rotate(-30 38 37)" fill="#fff" opacity=".6"/>
        ${EYES(13.5, 22.5, 48.5, 1.9)}${mouth(18, 52.5, 1.8, 1.6)}${cheeks(10, 26, 52, 2.2, 1.4)}
        ${happy(40, 48, 42, 1.8)}${mouth(44, 46, 1.8, 1.6)}${cheeks(36.5, 52, 45.5, 2.2, 1.4)}
        ${spark(8, 12, 4, "#F6C75A")}${spark(14, 26, 2.4, "#F6C75A")}`,
      concert_clef: `<defs><linearGradient id="m4cn-cf-g" gradientUnits="userSpaceOnUse" x1="16" y1="4" x2="44" y2="60"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".55" stop-color="#E9B23E"/><stop offset="1" stop-color="#B9771C"/></linearGradient></defs>
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path id="m4cn-cf-p" d="M33 53L30.5 12C30.5 5 36 2.5 38.5 5.5C42 10 36 17 29 23C20.5 30 16 36.5 18.5 44C21 51 33 53 38.5 47.5C43.5 42.5 40.5 34 33.5 34C27.5 34 25 40 29 43.5M33 53C33.5 59 26 60.5 24.5 56.5" stroke="${O}" stroke-width="9"/>
          <path d="M33 53L30.5 12C30.5 5 36 2.5 38.5 5.5C42 10 36 17 29 23C20.5 30 16 36.5 18.5 44C21 51 33 53 38.5 47.5C43.5 42.5 40.5 34 33.5 34C27.5 34 25 40 29 43.5M33 53C33.5 59 26 60.5 24.5 56.5" stroke="url(#m4cn-cf-g)" stroke-width="4.6"/>
          <path d="M21.5 36.5C23 32 26 29 29 27" stroke="#FFF6D6" stroke-width="1.6" opacity=".85"/></g>
        <circle cx="26" cy="55.5" r="4.4" fill="url(#m4cn-cf-g)" ${S2}/>
        ${spark(49, 12, 5, "#F6C75A")}${spark(52, 28, 3, "#FF8C9C")}${spark(12, 20, 3.4, "#FF8C9C")}${spark(50, 52, 2.6, "#F6C75A")}`,
      concert_trumpet: `${lg("m4cn-tp-g", "#FFE7A0", "#C98A1E")}${lg("m4cn-tp-b", "#FFE38A", "#D9982A", 1, 0)}
        <path d="M14 36Q12 48 22 48H34Q42 48 41 37" fill="none" stroke="${O}" stroke-width="7.5" stroke-linecap="round"/><path d="M14 36Q12 48 22 48H34Q42 48 41 37" fill="none" stroke="#E9B23E" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="18" y="16" width="5" height="16" rx="1.5" fill="url(#m4cn-tp-g)" ${S2}/><rect x="25.5" y="16" width="5" height="16" rx="1.5" fill="url(#m4cn-tp-g)" ${S2}/><rect x="33" y="16" width="5" height="16" rx="1.5" fill="url(#m4cn-tp-g)" ${S2}/>
        <ellipse cx="20.5" cy="14.5" rx="3.6" ry="2" fill="#FFF3D0" ${S15}/><ellipse cx="28" cy="14.5" rx="3.6" ry="2" fill="#FFF3D0" ${S15}/><ellipse cx="35.5" cy="14.5" rx="3.6" ry="2" fill="#FFF3D0" ${S15}/>
        <rect x="9" y="29" width="34" height="7" rx="3.5" fill="url(#m4cn-tp-g)" ${SO}/>
        <path d="M4 30.5H10V34.5H4z" fill="#D9A23A" ${S2}/>
        <path d="M40 28.5C48 28 53 21 59 14Q62.5 32 59 50C53 43 48 36.5 40 36z" fill="url(#m4cn-tp-b)" ${SO}/>
        <ellipse cx="59" cy="32" rx="2.8" ry="18" fill="#B9771C" ${S2}/>
        <path d="M45 27.5C49 25.5 52 22 55 18.5" fill="none" stroke="#FFF6D6" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>
        <path d="M12 31.5H40" stroke="#FFF6D6" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        ${note8(46, 11, 1, "#C93A5A")}${note8(8, 20, .8, "#C93A5A")}${spark(14, 54, 2.6, "#F6C75A")}`,
      concert_drum: `${lg("m4cn-dr-b", "#F6B176", "#B85F2A")}${lg("m4cn-dr-s", "#9A6B44", "#6E4428")}
        <path d="M14 52L9 61M50 52L55 61M32 56V61" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/><path d="M14 52L9 61M50 52L55 61M32 56V61" stroke="#C9A060" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 31Q6 54 32 56Q58 54 59 31z" fill="url(#m4cn-dr-b)" ${SO}/>
        <path d="M7 37Q32 46 57 37" fill="none" stroke="#F6C75A" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="32" cy="31" rx="27" ry="8" fill="#FFF6E6" ${SO}/><ellipse cx="32" cy="31" rx="22" ry="5.4" fill="none" stroke="#E8D6BE" stroke-width="1.4"/>
        <path d="M11 47Q13 51 17 52.5" fill="none" stroke="#FFD9B8" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
        <path d="M16 25L41 8M48 25L23 8" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M16 25L41 8M48 25L23 8" stroke="url(#m4cn-dr-s)" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="42" cy="7.5" r="4.6" fill="#F07A8A" ${S2}/><circle cx="22" cy="7.5" r="4.6" fill="#F07A8A" ${S2}/>
        <circle cx="40.6" cy="6" r="1.3" fill="#fff" opacity=".7"/><circle cx="20.6" cy="6" r="1.3" fill="#fff" opacity=".7"/>
        ${EYES(25, 39, 44, 2.2)}${mouth(32, 47.5, 2.2)}${cheeks(20, 44, 48)}`,
      concert_songbird: `${rg("m4cn-sb-b", "#B7DCFA", "#4F8FD8")}${lg("m4cn-sb-w", "#7FB4EC", "#3A72BE")}
        <path d="M6 50Q30 47 58 52" fill="none" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/><path d="M6 50Q30 47 58 52" fill="none" stroke="#B07A4A" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M58 51q3 2 1 5" fill="none" stroke="#7CC47A" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M14 38L3 30L5 42z" fill="url(#m4cn-sb-w)" ${S2}/>
        <path d="M25 49l-1 4M33 49l1 4" stroke="#E8963A" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="29" cy="35" rx="18" ry="15" fill="url(#m4cn-sb-b)" ${SO}/>
        <path d="M17 41Q29 52 41 41Q38 33 29 34Q20 33 17 41z" fill="#FFF3E0"/>
        <path d="M14 33Q20 30 26 37Q22 44 15 41z" fill="url(#m4cn-sb-w)" ${S2}/>
        <path d="M44 27L54 24.5L45 30.5z" fill="#F6B04A" ${S15}/><path d="M45 32L52.5 34.5L44 35z" fill="#E8963A" ${S15}/>
        <path d="M27 18q2-6 6-5q-2 2-2 5" fill="#4F8FD8" ${S15}/>
        ${happy(32, 39, 28, 1.9)}${cheeks(30.5, 42, 33, 2.4, 1.6)}
        ${note8(50, 13, 1.05, "#C93A5A")}${note8(58, 6.5, .75, "#E9B23E")}${spark(9, 15, 3, "#F6C75A")}`,
      concert_bouquet: `${lg("m4cn-bq-p", "#FFF9EC", "#EAD8BC")}${rg("m4cn-bq-r", "#FF8C9C", "#C2304E")}${rg("m4cn-bq-y", "#FFD0DC", "#F07A9A")}
        <path d="M16 27C9 24 6 17 9 13C14 16 17 21 16 27zM48 27C55 24 58 17 55 13C50 16 47 21 48 27z" fill="#6CB86A" ${S2}/>
        <path d="M24 16C21 10 24 4 28 3C29 8 27 13 24 16z" fill="#6CB86A" ${S2}/>
        <path d="${scal(19, 28, 8.6, 9, 1.6)}" fill="url(#m4cn-bq-r)" ${SO}/><path d="${scal(45, 28, 8.6, 9, 1.6)}" fill="url(#m4cn-bq-r)" ${SO}/>
        <path d="${scal(32, 19, 9.6, 10, 1.8)}" fill="url(#m4cn-bq-y)" ${SO}/>
        <g fill="none" stroke-linecap="round" stroke-width="1.7"><path d="M16.5 28.5a2.6 2.6 0 1 1 2.6 2.6c-2.4 0-4.2-1.8-4.2-4.3c0-3 2.6-4.6 5-4.2" stroke="#9A1E3A"/><path d="M42.5 28.5a2.6 2.6 0 1 1 2.6 2.6c-2.4 0-4.2-1.8-4.2-4.3c0-3 2.6-4.6 5-4.2" stroke="#9A1E3A"/><path d="M29.3 19.5a2.8 2.8 0 1 1 2.8 2.8c-2.6 0-4.6-2-4.6-4.7c0-3.2 2.8-5 5.4-4.6" stroke="#B8406A"/></g>
        <circle cx="14.5" cy="24" r="1.4" fill="#fff" opacity=".6"/><circle cx="27.5" cy="14.5" r="1.5" fill="#fff" opacity=".7"/>
        <path d="M13 33H51L36 61H28z" fill="url(#m4cn-bq-p)" ${SO}/>
        <path d="M20 36L30 58M44 36L34 58" stroke="#E2CBA8" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M32 45C26 39 20 41 22 46C24 50 29 48 32 45C35 48 40 50 42 46C44 41 38 39 32 45z" fill="#E0546E" ${S2}/>
        <path d="M30 46L25 55M34 46L39 55" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M30 46L25 55M34 46L39 55" stroke="#E0546E" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="32" cy="45.5" r="3" fill="#C93A5A" ${S15}/>
        ${spark(57, 40, 3, "#F6C75A")}${spark(7, 42, 2.4, "#F6C75A")}`,
      concert_stage: `${lg("m4cn-st-c", "#E2465C", "#9E1E36", 1, 0)}${lg("m4cn-st-c2", "#9E1E36", "#E2465C", 1, 0)}${lg("m4cn-st-f", "#E0A868", "#A86A34")}
        <defs><linearGradient id="m4cn-st-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8DA" stop-opacity=".95"/><stop offset="1" stop-color="#FFD98A" stop-opacity=".6"/></linearGradient></defs>
        <rect x="4" y="5" width="56" height="54" rx="6" fill="#4A2448" ${SO}/>
        <path d="M32 12L13 50H51z" fill="url(#m4cn-st-l)"/>
        <path d="M6 47H58V53Q58 57 54 57H10Q6 57 6 53z" fill="url(#m4cn-st-f)"/>
        <ellipse cx="32" cy="50" rx="14" ry="3" fill="#FFF3C2" opacity=".55"/>
        
        <path d="M6 10H15Q14 27 19 37Q13 43 13 56H6z" fill="url(#m4cn-st-c)" ${S2}/>
        <path d="M58 10H49Q50 27 45 37Q51 43 51 56H58z" fill="url(#m4cn-st-c2)" ${S2}/>
        <path d="M10 12Q10 30 12 52M54 12Q54 30 52 52" fill="none" stroke="#FF8C9C" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>
        <circle cx="17.5" cy="37" r="2.2" fill="#F6C75A" ${S15}/><circle cx="46.5" cy="37" r="2.2" fill="#F6C75A" ${S15}/>
        <path d="M4 7Q4 5 6 5H58Q60 5 60 7V12Q55 17 50 12Q45 17 40 12Q36 17 32 12Q28 17 24 12Q19 17 14 12Q9 17 4 12z" fill="#C2304E" ${S2}/>
        <path d="M4 8H60" stroke="#F6C75A" stroke-width="2.4"/>
        <path d="M32 22.5L35.3 30.2L43.6 30.9L37.3 36.4L39.2 44.6L32 40.3L24.8 44.6L26.7 36.4L20.4 30.9L28.7 30.2z" fill="#FFD86B" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        ${EYES(29, 35, 34.6, 1.6)}<path d="M30.6 37.8q1.4 1.2 2.8 0" fill="none" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="27" cy="37.4" rx="1.5" ry="1" fill="#FF8FA8"/><ellipse cx="37" cy="37.4" rx="1.5" ry="1" fill="#FF8FA8"/>
        ${spark(24, 21, 2, "#FFF3C2")}${spark(41, 24, 1.6, "#FFF3C2")}`,
      concert_encore: `${lg("m4cn-ec-t", "#E2465C", "#A8223E")}
        <path d="M6 15H58Q60 15 60 17V27A5 5 0 0 0 60 37V47Q60 49 58 49H6Q4 49 4 47V37A5 5 0 0 0 4 27V17Q4 15 6 15z" fill="url(#m4cn-ec-t)" ${SO}/>
        <path d="M10 20H54V44H10z" fill="none" stroke="#F6C75A" stroke-width="1.5" stroke-dasharray="1.5 2.6" stroke-linecap="round"/>
        ${T("ENCORE!", 32, 37.5, 13, "#FFE9A8", 42)}
        <path d="${star(10, 10, 5.5, 2.4, 5)}" fill="#FFD86B" ${S15}/><path d="${star(55, 54, 5, 2.2, 5)}" fill="#FFD86B" ${S15}/>
        ${spark(53, 9, 2.6, "#F6C75A")}${spark(9, 55, 2.4, "#F6C75A")}`
    }},
    pins: [
      {id: "tp-concert-note", name: "Golden Note", kind: "badge", desc: "A shiny gold music note pin with a little sparkle.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="m4cn-pn-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEBA8"/><stop offset=".55" stop-color="#E9B23E"/><stop offset="1" stop-color="#A86A14"/></linearGradient></defs>
          <path d="M16.5 22V3.5C19 6 25 7.5 24.5 14C23.5 11 21 10 18.8 10" fill="url(#m4cn-pn-g)" stroke="#6E4810" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M16.5 3.5V22.5" stroke="#6E4810" stroke-width="3.6" stroke-linecap="round"/><path d="M16.5 3.5V22.5" stroke="url(#m4cn-pn-g)" stroke-width="1.6" stroke-linecap="round"/>
          <ellipse cx="11" cy="22.5" rx="7" ry="5.4" transform="rotate(-20 11 22.5)" fill="url(#m4cn-pn-g)" stroke="#6E4810" stroke-width="1.1"/>
          <ellipse cx="8.6" cy="20.5" rx="2.4" ry="1.2" transform="rotate(-25 8.6 20.5)" fill="#fff" opacity=".75"/>
          <path d="M25 22.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" fill="#FFF3C2"/></svg>`},
      {id: "tp-concert-staff", name: "Sheet Music Washi", kind: "tape", desc: "Cream washi tape printed with a little line of music in rose and gold.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 2H83L80.5 7L83 12L80.5 17L83 22L81 24.5H3L5.5 20L3 15L5.5 10L3 5z" fill="#FBF1DC" opacity=".88"/>
          <g stroke="#8E5A6A" stroke-width=".6" opacity=".55"><path d="M5 7.5H81M5 10.5H81M5 13.5H81M5 16.5H81M5 19.5H81"/></g>
          <g fill="#C93A5A"><ellipse cx="18" cy="16.5" rx="2.2" ry="1.6" transform="rotate(-20 18 16.5)"/><ellipse cx="26" cy="13.5" rx="2.2" ry="1.6" transform="rotate(-20 26 13.5)"/><ellipse cx="50" cy="15" rx="2.2" ry="1.6" transform="rotate(-20 50 15)"/><ellipse cx="68" cy="12" rx="2.2" ry="1.6" transform="rotate(-20 68 12)"/></g>
          <g stroke="#C93A5A" stroke-width=".9" fill="none"><path d="M20 16V8.5L28 6.5V13.5M20 8.5L28 6.5M52 14.5V7Q55 8.5 55.5 11M70 11.5V4.5"/></g>
          <path d="M37 18.5C35 14 41 9 39 5.5" stroke="#D9A23A" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="37.6" cy="19" r="1.1" fill="#D9A23A"/>
          <path d="M77 10l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" fill="#E9B23E"/>
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".5"/></svg>`}
    ],
    card: {id: "tp-concert", name: "Velvet Program", desc: "A cream concert program framed in gold, with red velvet curtain swags up top and music notes along the stage edge."}
  });

  /* ================= TRACK AND FIELD ================= */
  TP_DATA.push({
    theme: "track",
    pack: {name: "Fast Friends", items: {
      track_medal: `${lg("m4tk-md-g", "#FFE9A0", "#D99A26")}${rg("m4tk-md-i", "#FFF6CC", "#F2C24A")}
        <path d="M12 3H24L35 27H24z" fill="#E8604C" ${S2}/><path d="M52 3H40L29 27H40z" fill="#4E9AD8" ${S2}/>
        <path d="M16 3L27 27M48 3L37 27" stroke="#fff" stroke-width="1.8" opacity=".7"/>
        <path d="${scal(32, 41, 18, 18, 2.4)}" fill="url(#m4tk-md-g)" ${SO}/>
        <circle cx="32" cy="41" r="13" fill="url(#m4tk-md-i)" stroke="#C98A1E" stroke-width="1.6"/>
        <ellipse cx="22.5" cy="33" rx="3" ry="1.7" transform="rotate(-40 22.5 33)" fill="#fff" opacity=".7"/>
        ${EYES(27, 37, 40, 2.1)}${mouth(32, 44, 2.2)}${cheeks(23, 41, 44.5)}
        ${spark(8, 34, 3.4, "#F6C75A")}${spark(57, 48, 2.8, "#F6C75A")}${spark(55, 33, 1.8, "#4E9AD8")}`,
      track_sneaker: `${lg("m4tk-sn-u", "#FF9C8A", "#E2574A")}${lg("m4tk-sn-s", "#FFFFFF", "#DCE4EE")}
        <path d="M3 30H11M2 37H9M4 44H10" stroke="#8FC7E8" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M14 45C14 34 17 25 24 21L32 20Q35 27 42 30L51 33.5Q60 36.5 60.5 45z" fill="url(#m4tk-sn-u)" ${SO}/>
        <path d="M27 21Q29 15.5 33 15.5Q35.5 18 34.5 23" fill="#FFE1D8" ${S2}/>
        <path d="M33 22.5L28 25M36.5 25L31 28.5M40 27.5L34.5 31.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M18 38Q30 33 42 39Q50 42 56 41" fill="none" stroke="#FFD86B" stroke-width="3" stroke-linecap="round"/>
        <path d="M13 44H60Q62 44 61.5 47.5Q61 52 55 52H17Q12 52 12 48Q12 44 13 44z" fill="url(#m4tk-sn-s)" ${SO}/>
        <path d="M20 52.5h5M30 52.5h5M40 52.5h5M50 52.5h4" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/><path d="M20 52.5h5M30 52.5h5M40 52.5h5M50 52.5h4" stroke="#8FC7E8" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M17 47.5H57" stroke="#B8C4D4" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 2.5"/>
        <ellipse cx="22" cy="29" rx="3" ry="1.6" transform="rotate(-40 22 29)" fill="#fff" opacity=".6"/>
        ${spark(52, 16, 3.6, "#F6C75A")}${spark(45, 9, 2.2, "#F6C75A")}`,
      track_bunny: `${lg("m4tk-bh-p", "#FFFFFF", "#D8DEE8")}${rg("m4tk-bh-b", "#FFFFFF", "#EADFE6")}
        <path d="M12 44V60M52 44V60" stroke="${O}" stroke-width="5.2" stroke-linecap="round"/><path d="M12 44V60M52 44V60" stroke="#C9D2DE" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M7 60H17M47 60H57" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/>
        <rect x="6" y="39" width="52" height="8" rx="2" fill="url(#m4tk-bh-p)" ${S2}/>
        <path d="M13 39h6l-3 8h-6zM29 39h6l-3 8h-6zM45 39h6l-3 8h-6z" fill="#E8604C"/>
        <rect x="6" y="39" width="52" height="8" rx="2" fill="none" ${S2}/>
        <path d="M14 26Q8 30 6 35M44 23Q51 26 56 23" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M14 26Q8 30 6 35M44 23Q51 26 56 23" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="27" cy="24" rx="15" ry="10" transform="rotate(-12 27 24)" fill="url(#m4tk-bh-b)" ${SO}/>
        <circle cx="12" cy="22" r="4.4" fill="#fff" ${S2}/>
        <path d="M38 11C35 3 38 1 41 3C43 5 43 9 42 12M44 11C45 3 49 2 51 5C52 8 49 11 47 13" fill="#fff" ${S2}/>
        <path d="M39.5 10C38.5 6 39.5 4.5 40.8 5.4M46 11C47 7 48.6 5.6 49.6 6.6" fill="none" stroke="#FFB6C8" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="44" cy="19" r="9" fill="url(#m4tk-bh-b)" ${SO}/>
        ${EYES(41, 48, 18.5, 1.6)}<path d="M43.6 22q.9.9 1.8 0" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="44.5" cy="20.8" rx="1" ry=".7" fill="#FF8FA8"/>
        ${cheeks(38.5, 50.5, 22, 1.8, 1.2)}
        <path d="M20 9H26M18 14H23" stroke="#8FC7E8" stroke-width="2.2" stroke-linecap="round"/>`,
      track_bottle: `${lg("m4tk-bt-b", "#8FD3F4", "#3E8FD0")}${lg("m4tk-bt-c", "#7CD6A0", "#2E9A62")}
        <path d="M28 4H36V10H28z" fill="#2E9A62" ${S2}/>
        <path d="M21 10H43V17H21z" fill="url(#m4tk-bt-c)" ${S2}/>
        <path d="M18 19Q18 16 21 16H43Q46 16 46 19V56Q46 60 42 60H22Q18 60 18 56z" fill="#E6F4FB" ${SO}/>
        <path d="M19.2 30Q25 27.5 32 30T44.8 30V56Q44.8 58.8 42 58.8H22Q19.2 58.8 19.2 56z" fill="url(#m4tk-bt-b)"/>
        <path d="M18 19Q18 16 21 16H43Q46 16 46 19V56Q46 60 42 60H22Q18 60 18 56z" fill="none" ${SO}/>
        <path d="M18 23H46" stroke="${O}" stroke-width="1.8"/>
        <path d="M22.5 34V54" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
        ${EYES(27.5, 37.5, 40, 2.1)}${mouth(32.5, 44, 2.2)}${cheeks(24, 41, 44.5)}
        <path d="M54 22c2.4 3 3.2 4.6 3.2 5.8a3.2 3.2 0 0 1-6.4 0c0-1.2.8-2.8 3.2-5.8z" fill="#8FD3F4" ${S15}/>
        <path d="M9 34c2 2.5 2.6 3.8 2.6 4.8a2.6 2.6 0 0 1-5.2 0c0-1 .6-2.3 2.6-4.8z" fill="#8FD3F4" ${S15}/>
        ${spark(53, 44, 2.6, "#F6C75A")}`,
      track_trophy: `${lg("m4tk-tr-g", "#FFE9A0", "#D2901E")}${lg("m4tk-tr-b", "#8E6AB8", "#5A3F86")}
        <path d="M17 13H8Q6 13 6.5 16Q8 27 20 29M47 13H56Q58 13 57.5 16Q56 27 44 29" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M17 13H8Q6 13 6.5 16Q8 27 20 29M47 13H56Q58 13 57.5 16Q56 27 44 29" fill="none" stroke="#F2C24A" stroke-width="3" stroke-linecap="round"/>
        <path d="M14 8H50V18Q50 35 32 38Q14 35 14 18z" fill="url(#m4tk-tr-g)" ${SO}/>
        <path d="M28 37H36V45H28z" fill="#D99A26" ${S2}/>
        <path d="M20 46H44L46 52H18z" fill="#E9B23E" ${S2}/>
        <rect x="14" y="51" width="36" height="9" rx="2" fill="url(#m4tk-tr-b)" ${SO}/><path d="M24 55.5H40" stroke="#F6C75A" stroke-width="1.8" stroke-linecap="round"/>
        <path d="${star(32, 21, 7.5, 3.4, 5)}" fill="#FFF6CC" stroke="#C98A1E" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M18.5 12V20Q19 27 23 31" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".65"/>
        <rect x="4" y="38" width="3.4" height="3.4" rx=".8" fill="#E8604C" transform="rotate(20 5.7 39.7)"/><rect x="56" y="37" width="3.4" height="3.4" rx=".8" fill="#4E9AD8" transform="rotate(-25 57.7 38.7)"/>
        ${spark(9, 49, 2.6, "#F6C75A")}${spark(56, 48, 2.2, "#7CC47A")}${spark(32, 3.6, 2.4, "#F6C75A")}`,
      track_banana: `${lg("m4tk-bn-b", "#FFF0A0", "#F2C23A")}
        <path d="M14 10Q12 8 13 5L17 4Q18 7 17 10z" fill="#8A6A3A" ${S2}/>
        <path d="M12 11C6 30 14 50 34 56C46 59.5 56 55 58 51C59 48 56 46.5 53 47.5C40 51 26 40 21 24C20 18 21 14 20 11C19 8 13 8 12 11z" fill="url(#m4tk-bn-b)" ${SO}/>
        <path d="M15 22C15 34 22 44 31 49" fill="none" stroke="#FFF9D6" stroke-width="2" stroke-linecap="round" opacity=".9"/>
        <path d="M55.5 47.5Q58.5 49 57 51.5" fill="none" stroke="#8A6A3A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M10.5 20.5Q16 23 23 21L23.5 26.5Q16 29 10.4 26.8z" fill="#4E9AD8" ${S15}/>
        <path d="M11 21L5 15M11 24L4 23" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M11 21L5 15M11 24L4 23" stroke="#4E9AD8" stroke-width="2" stroke-linecap="round"/>
        ${EYES(26, 34, 41, 2)}<path d="M28.5 45q2 1.8 4 .4" fill="none" stroke="${O}" stroke-width="1.7" stroke-linecap="round"/>${cheeks(22.5, 37.5, 45.5, 2.2, 1.4)}
        ${spark(48, 18, 3.6, "#F6C75A")}${spark(56, 30, 2.2, "#E8604C")}`,
      track_cone: `${lg("m4tk-cn-o", "#FFB070", "#EE6A2A", 1, 0)}
        <path d="M5 53H59Q61 53 61 55V58Q61 60 59 60H5Q3 60 3 58V55Q3 53 5 53z" fill="#E2574A" ${SO}/>
        <path d="M28 5H36L50 54H14z" fill="url(#m4tk-cn-o)" ${SO}/>
        <path d="M24.5 18H39.5L42.6 29H21.4z" fill="#FFF6EA"/><path d="M24.5 18H39.5L42.6 29H21.4z" fill="none" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M28 8L20 40" stroke="#FFD5B0" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${EYES(27, 37, 39, 2.1)}${mouth(32, 43, 2.2)}${cheeks(22.5, 41.5, 43.5, 2.4, 1.6)}
        ${spark(54, 14, 3.4, "#F6C75A")}${spark(10, 24, 2.4, "#F6C75A")}`,
      track_finish: `${lg("m4tk-fs-t", "#F07E5E", "#C9503A")}
        <rect x="3" y="11" width="58" height="42" rx="21" fill="url(#m4tk-fs-t)" ${SO}/>
        <rect x="7.5" y="15.5" width="49" height="33" rx="16.5" fill="none" stroke="#fff" stroke-width="1.1" opacity=".75"/>
        <rect x="11" y="19" width="42" height="26" rx="13" fill="#FFF6E6" stroke="${O}" stroke-width="2"/>
        ${T("FINISH", 32, 30.6, 9.6, "#C9503A", 31)}${T("STRONG", 32, 41.2, 9.6, "#2E8A52", 33)}
        <g transform="translate(46 5)"><rect x="0" y="0" width="12" height="8" rx="1.5" fill="#fff" ${S15}/><path d="M0 0h3v2.7H0zM6 0h3v2.7H6zM3 2.7h3v2.6H3zM9 2.7h3v2.6H9zM0 5.3h3V8H0zM6 5.3h3V8H6z" fill="${O}"/></g>
        ${spark(8, 8, 3, "#F6C75A")}${spark(56, 57, 2.4, "#F6C75A")}`
    }},
    pins: [
      {id: "tp-track-medal", name: "Gold Medal Pin", kind: "badge", desc: "A tiny gold medal on a coral and sky blue ribbon.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="m4tk-pm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEBA8"/><stop offset=".55" stop-color="#E9B23E"/><stop offset="1" stop-color="#A86A14"/></linearGradient></defs>
          <path d="M6 1H12L17 12H11z" fill="#E8604C" stroke="#8E3A2C" stroke-width=".9" stroke-linejoin="round"/><path d="M24 1H18L13 12H19z" fill="#4E9AD8" stroke="#24507A" stroke-width=".9" stroke-linejoin="round"/>
          <circle cx="15" cy="19.5" r="9" fill="url(#m4tk-pm-g)" stroke="#6E4810" stroke-width="1.1"/>
          <circle cx="15" cy="19.5" r="6" fill="none" stroke="#FFF3C2" stroke-width=".9" opacity=".8"/>
          <path d="${star(15, 19.8, 4, 1.8, 5)}" fill="#FFF3C2" stroke="#A86A14" stroke-width=".6" stroke-linejoin="round"/>
          <ellipse cx="10.5" cy="15.5" rx="2" ry="1.1" transform="rotate(-40 10.5 15.5)" fill="#fff" opacity=".75"/></svg>`},
      {id: "tp-track-lane", name: "Lane Line Tape", kind: "tape", desc: "Running track tape in warm terracotta with white lane lines and lane numbers.",
        svg: `<svg viewBox="0 0 86 26"><path d="M3 2H83L80.5 7L83 12L80.5 17L83 22L81 24.5H3L5.5 20L3 15L5.5 10L3 5z" fill="#E07A5C" opacity=".86"/>
          <path d="M4 8.5H82M4 17.5H82" stroke="#fff" stroke-width="1.2" opacity=".85"/>
          <g font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="5.6" fill="#fff" text-anchor="middle"><text x="15" y="15">1</text><text x="35" y="15">2</text><text x="55" y="15">3</text></g>
          <g transform="translate(68 3.5)" fill="#fff" opacity=".95"><path d="M0 0h3v3H0zM6 0h3v3H6zM3 3h3v3H3zM9 3h3v3H9zM0 6h3v3H0zM6 6h3v3H6zM3 9h3v3H3zM9 9h3v3H9zM0 12h3v3H0zM6 12h3v3H6zM3 15h3v3H3zM9 15h3v3H9z"/></g>
          <path d="M5 23H81" stroke="#fff" stroke-width="1" opacity=".4"/></svg>`}
    ],
    card: {id: "tp-track", name: "Lane Line", desc: "A warm track lane runs along the edge, with a checkered finish in the corner and a gold medal on the bend."}
  });

  /* ================= INFINITE GRID ================= */
  // fractal tree (deterministic)
  const ftree = () => {
    let br = "", bl = "";
    const go = (x, y, a, len, w, d) => {
      const x2 = x + len * Math.cos(a), y2 = y + len * Math.sin(a);
      br += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke-width="${w.toFixed(1)}"/>`;
      if (d === 0) { bl += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3.1"/>`; return; }
      go(x2, y2, a - .58, len * .74, w * .68, d - 1); go(x2, y2, a + .58, len * .74, w * .68, d - 1);
    };
    go(32, 52, -Math.PI / 2, 13.5, 4.6, 4);
    return {br, bl};
  };
  const FT = ftree();
  TP_DATA.push({
    theme: "math",
    pack: {name: "Shape Squad", items: {
      math_pyramid: `${lg("m4mt-py-a", "#C8F4E0", "#7FD6B4")}${lg("m4mt-py-b", "#6CC4A4", "#3E9A80")}
        <ellipse cx="32" cy="58" rx="22" ry="3.4" fill="#B9A6E8" opacity=".5"/>
        <path d="M32 5L6 47L33 56z" fill="url(#m4mt-py-a)" ${SO}/>
        <path d="M32 5L33 56L58 44z" fill="url(#m4mt-py-b)" ${SO}/>
        <path d="M30 13L15 39" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        ${EYES(20, 29, 39, 2)}${mouth(24.5, 43, 2)}${cheeks(16.5, 32, 43, 2.2, 1.4)}
        ${spark(52, 14, 4, "#F6C75A")}${spark(10, 14, 2.6, "#F4A6C0")}`,
      math_calculator: `${lg("m4mt-cl-b", "#C9B6F2", "#8A6CD0")}${lg("m4mt-cl-s", "#E4F7EC", "#B8E6CC")}
        <rect x="11" y="3" width="42" height="58" rx="8" fill="url(#m4mt-cl-b)" ${SO}/>
        <rect x="16" y="8" width="32" height="18" rx="3.5" fill="url(#m4mt-cl-s)" ${S2}/>
        <circle cx="25.5" cy="16" r="1.9" fill="${O}"/><circle cx="38.5" cy="16" r="1.9" fill="${O}"/><circle cx="26.2" cy="15.3" r=".7" fill="#fff"/><circle cx="39.2" cy="15.3" r=".7" fill="#fff"/>
        ${mouth(32, 18.6, 2, 1.6)}<ellipse cx="22" cy="20" rx="2" ry="1.3" fill="#FF8FA8" opacity=".75"/><ellipse cx="42" cy="20" rx="2" ry="1.3" fill="#FF8FA8" opacity=".75"/>
        <g ${S15}>
          <rect x="16" y="30" width="8" height="6.5" rx="2" fill="#FFF6EA"/><rect x="28" y="30" width="8" height="6.5" rx="2" fill="#FFF6EA"/><rect x="40" y="30" width="8" height="6.5" rx="2" fill="#F4A6C0"/>
          <rect x="16" y="39.5" width="8" height="6.5" rx="2" fill="#FFF6EA"/><rect x="28" y="39.5" width="8" height="6.5" rx="2" fill="#FFF6EA"/><rect x="40" y="39.5" width="8" height="6.5" rx="2" fill="#F4A6C0"/>
          <rect x="16" y="49" width="8" height="6.5" rx="2" fill="#FFF6EA"/><rect x="28" y="49" width="8" height="6.5" rx="2" fill="#FFF6EA"/><rect x="40" y="49" width="8" height="6.5" rx="2" fill="#8FE0C0"/></g>
        <path d="M42.4 33.2h3.2M44 31.6v3.2M42.4 42.7h3.2M42.4 51.4h3.2M42.4 53.4h3.2" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/>
        <ellipse cx="15" cy="9" rx="1.6" ry="3" fill="#fff" opacity=".45"/>`,
      math_protractor: `${lg("m4mt-pr-b", "#FFE2A8", "#F6B66A")}
        <path d="M4 48A28 28 0 0 1 60 48V52Q60 55 57 55H7Q4 55 4 52z" fill="url(#m4mt-pr-b)" ${SO}/>
        <path d="M14 48A18 18 0 0 1 50 48z" fill="#FFF6E6" stroke="${O}" stroke-width="1.6"/>
        <g stroke="#B9771C" stroke-width="1.3" stroke-linecap="round">${Array.from({length: 13}, (_, i) => { const a = Math.PI + i * Math.PI / 12, r1 = i % 3 ? 24 : 21.5; return `<path d="M${(32 + r1 * Math.cos(a)).toFixed(1)} ${(48 + r1 * Math.sin(a)).toFixed(1)}L${(32 + 26.5 * Math.cos(a)).toFixed(1)} ${(48 + 26.5 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}</g>
        <path d="M8 46Q12 30 26 23" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
        ${EYES(27, 37, 39, 2)}${mouth(32, 43.3, 2)}${cheeks(22.5, 41.5, 43.5, 2.2, 1.4)}
        <circle cx="32" cy="50.5" r="1.8" fill="#B9771C"/>
        ${spark(54, 14, 3.6, "#B9A6E8")}${spark(9, 15, 2.6, "#F4A6C0")}`,
      math_infinity: `<defs><linearGradient id="m4mt-if-g" gradientUnits="userSpaceOnUse" x1="6" y1="0" x2="58" y2="0"><stop offset="0" stop-color="#F49AC0"/><stop offset=".5" stop-color="#A88CEB"/><stop offset="1" stop-color="#6ED6C0"/></linearGradient></defs>
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M32 33C25 18 7.5 17 7.5 33C7.5 49 25 48 32 33C39 18 56.5 17 56.5 33C56.5 49 39 48 32 33z" stroke="${O}" stroke-width="11"/>
          <path d="M32 33C25 18 7.5 17 7.5 33C7.5 49 25 48 32 33C39 18 56.5 17 56.5 33C56.5 49 39 48 32 33z" stroke="url(#m4mt-if-g)" stroke-width="6.4"/>
          <path d="M11.5 26Q14.5 21.5 20 22M44 22Q49.5 21.5 52.5 26" stroke="#fff" stroke-width="2" opacity=".75"/></g>
        ${spark(32, 11, 4.4, "#F6C75A")}${spark(14, 52, 2.6, "#F49AC0")}${spark(51, 51, 3, "#6ED6C0")}`,
      math_spiral: `${lg("m4mt-sp-g", "#FFE7A0", "#D99A26", 1, 1)}
        <g ${S15}>
          <rect x="4" y="15" width="34.6" height="34.6" fill="#E6DEFA"/>
          <rect x="38.6" y="15" width="21.4" height="21.4" fill="#D4F2E6"/>
          <rect x="46.8" y="36.4" width="13.2" height="13.2" fill="#FFE3D6"/>
          <rect x="38.6" y="41.4" width="8.2" height="8.2" fill="#FCD6E6"/>
          <rect x="38.6" y="36.4" width="5" height="5" fill="#FFF3C2"/></g>
        <rect x="4" y="15" width="56" height="34.6" rx="1" fill="none" ${SO}/>
        <path d="M4 49.6A34.6 34.6 0 0 1 38.6 15A21.4 21.4 0 0 1 60 36.4A13.2 13.2 0 0 1 46.8 49.6A8.2 8.2 0 0 1 38.6 41.4A5 5 0 0 1 43.6 36.4A3.2 3.2 0 0 1 46.8 39.6" fill="none" stroke="${O}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M4 49.6A34.6 34.6 0 0 1 38.6 15A21.4 21.4 0 0 1 60 36.4A13.2 13.2 0 0 1 46.8 49.6A8.2 8.2 0 0 1 38.6 41.4A5 5 0 0 1 43.6 36.4A3.2 3.2 0 0 1 46.8 39.6" fill="none" stroke="url(#m4mt-sp-g)" stroke-width="2.6" stroke-linecap="round"/>
        ${spark(10, 8, 3.4, "#F6C75A")}${spark(56, 8, 2.4, "#A88CEB")}${spark(20, 56, 2.4, "#6ED6C0")}`,
      math_tree: `${lg("m4mt-tr-h", "#C8EFC0", "#86C98A")}
        <path d="M10 60Q12 50 32 50Q52 50 54 60z" fill="url(#m4mt-tr-h)" ${SO}/>
        <g stroke="${O}" stroke-linecap="round" fill="none">${FT.br.replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${(+w + 2.6).toFixed(1)}"`)}</g>
        <g stroke="#9C86DA" stroke-linecap="round" fill="none">${FT.br}</g>
        <g fill="#F8A8C8" ${SOw(1.4)}>${FT.bl}</g>
        <g fill="#fff" opacity=".7">${FT.bl.replace(/r="3.1"/g, 'r="1"').replace(/cx="([\d.]+)" cy="([\d.]+)"/g, (m, x, y) => `cx="${(+x - 1).toFixed(1)}" cy="${(+y - 1).toFixed(1)}"`)}</g>
        ${spark(56, 30, 2.6, "#F6C75A")}${spark(8, 30, 2.6, "#F6C75A")}`,
      math_sigma: `${lg("m4mt-sg-g", "#FFC0D4", "#E8708F", 1, 1)}
        <path d="M12 6H52V20H45L43 15H28L39 32L28 49H43L45 44H52V58H12V53L26 32L12 11z" fill="url(#m4mt-sg-g)" ${SO}/>
        <path d="M15 9H48" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
        <path d="M17 12L28 28" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>
        ${spark(57, 32, 3.8, "#F6C75A")}${spark(8, 30, 2.6, "#A88CEB")}${spark(56, 4, 2.2, "#6ED6C0")}`,
      math_primetime: `${lg("m4mt-pt-b", "#B9A6F2", "#7E62CC")}
        <rect x="3" y="13" width="58" height="38" rx="10" fill="url(#m4mt-pt-b)" ${SO}/>
        <g stroke="#fff" stroke-width=".8" opacity=".25"><path d="M3 25H61M3 39H61M15 13V51M27 13V51M39 13V51M51 13V51"/></g>
        ${T("PRIME", 32, 30.5, 12, "#FFF6CC", 36)}${T("TIME", 32, 45, 12, "#FFFFFF", 30)}
        <path d="${star(54, 11, 6, 2.6, 5)}" fill="#FFD86B" ${S15}/>
        ${spark(8, 57, 2.6, "#F49AC0")}${spark(9, 8, 2.4, "#6ED6C0")}`
    }},
    pins: [
      {id: "tp-math-spiral", name: "Golden Spiral Pin", kind: "badge", desc: "A round gold pin with a golden ratio spiral curling inside.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="m4mt-ps-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEBA8"/><stop offset=".55" stop-color="#E9B23E"/><stop offset="1" stop-color="#A86A14"/></linearGradient></defs>
          <circle cx="15" cy="15" r="13" fill="url(#m4mt-ps-g)" stroke="#6E4810" stroke-width="1.1"/>
          <circle cx="15" cy="15" r="10.2" fill="#FFF6DC" stroke="#C98A1E" stroke-width=".7"/>
          <path d="M6 19A10 10 0 0 1 16 9A6.2 6.2 0 0 1 22.2 15.2A3.8 3.8 0 0 1 18.4 19A2.4 2.4 0 0 1 16 16.6A1.4 1.4 0 0 1 17.4 15.2" fill="none" stroke="#B9771C" stroke-width="1.4" stroke-linecap="round"/>
          <ellipse cx="9" cy="8" rx="2.4" ry="1.3" transform="rotate(-40 9 8)" fill="#fff" opacity=".7"/></svg>`},
      {id: "tp-math-ruler", name: "Ruler Clip", kind: "clip", desc: "A little lavender ruler that hooks over the edge of the note.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="m4mt-pr-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D6C8F6"/><stop offset="1" stop-color="#8E72D2"/></linearGradient></defs>
          <path d="M11 12V6a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#5A6272" stroke-width="3.6" stroke-linecap="round"/><path d="M11 12V6a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#C9D0DC" stroke-width="1.8" stroke-linecap="round"/>
          <rect x="5" y="10" width="12" height="38" rx="2" fill="url(#m4mt-pr-g)" stroke="#4A3480" stroke-width="1.1"/>
          <g stroke="#3A2A66" stroke-width=".9" stroke-linecap="round"><path d="M5 14H10M5 18H8M5 22H10M5 26H8M5 30H10M5 34H8M5 38H10M5 42H8"/></g>
          <rect x="11.5" y="13" width="2.4" height="32" rx="1.2" fill="#fff" opacity=".45"/>
          <circle cx="11" cy="45" r="1.3" fill="#FFF3C2"/></svg>`}
    ],
    card: {id: "tp-math", name: "Graph Paper", desc: "Soft lavender graph paper with a golden spiral curling in one corner and floating pastel shapes in the other."}
  });

  /* ================= CHEM LAB ================= */
  TP_DATA.push({
    theme: "chem",
    pack: {name: "Good Reactions", items: {
      chem_roundflask: `${lg("m4ch-rf-l", "#C9A2FA", "#8A52E0")}<defs><clipPath id="m4ch-rf-c"><circle cx="32" cy="40" r="19"/></clipPath></defs>
        <rect x="26" y="5" width="12" height="20" rx="1.5" fill="#EAF6FB" ${SO}/>
        <rect x="23.5" y="3" width="17" height="5" rx="2.5" fill="#F6E6C8" ${S2}/>
        <circle cx="32" cy="40" r="20" fill="#EAF6FB" ${SO}/>
        <g clip-path="url(#m4ch-rf-c)"><path d="M10 37Q17 33 24 37T38 37T54 37V62H10z" fill="url(#m4ch-rf-l)"/></g>
        <circle cx="32" cy="40" r="20" fill="none" ${SO}/>
        <path d="M27.5 24Q27.5 22 28 8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        <path d="M17 32Q19 26 24 23.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
        ${EYES(26.5, 37.5, 46, 2.1)}${mouth(32, 50, 2.2)}${cheeks(22, 42, 50.5)}
        <circle cx="45" cy="16" r="3.2" fill="#E9DBFF" ${S15}/><circle cx="51" cy="8" r="2.2" fill="#E9DBFF" ${S15}/><circle cx="46" cy="44" r="1.6" fill="#fff" opacity=".7"/><circle cx="20" cy="41" r="1.2" fill="#fff" opacity=".7"/>
        ${spark(12, 14, 3, "#F6C75A")}`,
      chem_testtubes: `${lg("m4ch-tt-w", "#D9A06A", "#A86A34")}
        <path d="M6 26V58M58 26V58" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M6 26V58M58 26V58" stroke="#C88A50" stroke-width="2.8" stroke-linecap="round"/>
        <g ${S2}>
          <path d="M9 6H20V50A5.5 5.5 0 0 1 9 50z" fill="#EEF8FC"/><path d="M26.5 6H37.5V50A5.5 5.5 0 0 1 26.5 50z" fill="#EEF8FC"/><path d="M44 6H55V50A5.5 5.5 0 0 1 44 50z" fill="#EEF8FC"/></g>
        <path d="M10 24H19V50A4.5 4.5 0 0 1 10 50z" fill="#F67EA8"/><path d="M27.5 18H36.5V50A4.5 4.5 0 0 1 27.5 50z" fill="#4FD6C0"/><path d="M45 28H54V50A4.5 4.5 0 0 1 45 50z" fill="#FFC94A"/>
        <g fill="none" ${S2}><path d="M9 6H20V50A5.5 5.5 0 0 1 9 50z"/><path d="M26.5 6H37.5V50A5.5 5.5 0 0 1 26.5 50z"/><path d="M44 6H55V50A5.5 5.5 0 0 1 44 50z"/></g>
        <path d="M8 4.5H21M25.5 4.5H38.5M43 4.5H56" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M11.6 9V20M29 9V15M46.6 9V25" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
        <rect x="3" y="31" width="58" height="7" rx="2" fill="url(#m4ch-tt-w)" ${S2}/>
        <rect x="3" y="54" width="58" height="7" rx="2" fill="url(#m4ch-tt-w)" ${SO}/>
        ${EYES(12.6, 16.6, 45, 1.3)}${EYES(30.1, 34.1, 45, 1.3)}${EYES(47.6, 51.6, 45, 1.3)}
        <path d="M13.6 48q1 .9 2 0M31.1 48q1 .9 2 0M48.6 48q1 .9 2 0" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="32" cy="22" r="1.4" fill="#fff" opacity=".8"/><circle cx="14" cy="28" r="1.1" fill="#fff" opacity=".8"/>`,
      chem_goggles: `${lg("m4ch-gg-f", "#7FDCC8", "#2E9A88")}${rg("m4ch-gg-l", "#F4FCFF", "#BFE6F4", .4, .35)}
        ${rg("m4ch-gg-h", "#E9DCFF", "#A688E6")}<path d="M6 38C6 18 18 9 32 9C46 9 58 18 58 38C58 53 47 60 32 60C17 60 6 53 6 38z" fill="url(#m4ch-gg-h)" ${SO}/>
        <path d="M6.5 30H57.5" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M6.5 30H57.5" stroke="#F67EA8" stroke-width="3" stroke-linecap="round"/>
        <path d="M9 22Q9 16 15.5 16H48.5Q55 16 55 22V37Q55 45 46.5 45Q39 45 36.2 39.5Q34.2 36.5 32 36.5Q29.8 36.5 27.8 39.5Q25 45 17.5 45Q9 45 9 37z" fill="url(#m4ch-gg-f)" ${SO}/>
        <path d="M12.5 24Q12.5 20.5 17 20.5H26Q29 20.5 29 24V34Q29 41.5 20.5 41.5Q12.5 41.5 12.5 34z" fill="url(#m4ch-gg-l)" ${S2}/>
        <path d="M51.5 24Q51.5 20.5 47 20.5H38Q35 20.5 35 24V34Q35 41.5 43.5 41.5Q51.5 41.5 51.5 34z" fill="url(#m4ch-gg-l)" ${S2}/>
        <circle cx="21" cy="31.5" r="4" fill="${O}"/><circle cx="43" cy="31.5" r="4" fill="${O}"/><circle cx="22.4" cy="30" r="1.5" fill="#fff"/><circle cx="44.4" cy="30" r="1.5" fill="#fff"/>
        <path d="M15 25Q17 22.5 20 22.5M38 25Q40 22.5 43 22.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
        ${mouth(32, 51, 2.6, 2)}${cheeks(17, 47, 49.5, 3, 1.9)}<path d="M20 12q2-4 5-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
                ${spark(56, 8, 3.6, "#F6C75A")}${spark(7, 9, 2.4, "#F67EA8")}`,
      chem_bunsen: `${lg("m4ch-bn-m", "#D8DEE8", "#8A96AA", 1, 0)}<defs><linearGradient id="m4ch-bn-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8E4FF"/><stop offset=".6" stop-color="#5AA8F4"/><stop offset="1" stop-color="#3A78E0"/></linearGradient></defs>
        <path d="M32 3C40 12 46 19 46 26A14 14 0 0 1 18 26C18 19 24 12 32 3z" fill="url(#m4ch-bn-f)" ${SO}/>
        <path d="M32 13C36 18 39 22 39 26.5A7 7 0 0 1 25 26.5C25 22 28 18 32 13z" fill="#E6F7FF" opacity=".85"/>
        ${EYES(28, 36, 28, 1.8)}<path d="M30.4 31.6q1.6 1.4 3.2 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>${cheeks(24.8, 39.2, 31.2, 2, 1.3)}
        <rect x="27" y="40" width="10" height="13" fill="url(#m4ch-bn-m)" ${S2}/>
        <rect x="25" y="38" width="14" height="4" rx="1.2" fill="#B8C2D2" ${S15}/>
        <rect x="25.5" y="46" width="13" height="4" rx="1" fill="#F67EA8" ${S15}/>
        <path d="M10 56Q10 51 18 51H46Q54 51 54 56V58Q54 61 51 61H13Q10 61 10 58z" fill="url(#m4ch-bn-m)" ${SO}/>
        <path d="M37 47H48Q52 47 52 44" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M37 47H48Q52 47 52 44" fill="none" stroke="#FFC94A" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M29 42V51" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
        ${spark(52, 12, 3.4, "#F6C75A")}${spark(11, 20, 2.6, "#5AA8F4")}`,
      chem_cute: `${lg("m4ch-ct-a", "#FFD6B8", "#F29A64")}${lg("m4ch-ct-b", "#D2F2EA", "#7ED4C0")}
        <g transform="rotate(-7 17 34)">
          <rect x="4" y="17" width="26" height="32" rx="4" fill="url(#m4ch-ct-a)" ${SO}/>
          ${T("29", 10.5, 24.6, 5.6, "#8A3E14")}${T("Cu", 17, 39.6, 14, "#5A2A10", 18)}
          <path d="M8 44H26" stroke="#8A3E14" stroke-width="1.4" stroke-linecap="round" opacity=".5"/></g>
        <g transform="rotate(7 47 34)">
          <rect x="34" y="17" width="26" height="32" rx="4" fill="url(#m4ch-ct-b)" ${SO}/>
          ${T("52", 40.5, 24.6, 5.6, "#1E6A5A")}${T("Te", 47, 39.6, 14, "#124A40", 18)}
          <path d="M38 44H56" stroke="#1E6A5A" stroke-width="1.4" stroke-linecap="round" opacity=".5"/></g>
        <path d="M32 13c-1.5-2.8-5.6-1.6-4.6 1.6L32 18.6l4.6-4c1-3.2-3.1-4.4-4.6-1.6z" fill="#F67EA8" ${S15}/>
        ${spark(9, 8, 3, "#F6C75A")}${spark(56, 57, 3, "#F6C75A")}${spark(14, 57, 2, "#F67EA8")}`,
      chem_bubbles: `${rg("m4ch-bb-a", "#FFFFFF", "#F6A8CC", .35, .3)}${rg("m4ch-bb-b", "#FFFFFF", "#9FD8F6", .35, .3)}${rg("m4ch-bb-c", "#FFFFFF", "#A8EAD0", .35, .3)}
        <circle cx="23" cy="38" r="17" fill="url(#m4ch-bb-b)" ${SO}/>
        <circle cx="47" cy="23" r="12" fill="url(#m4ch-bb-a)" ${SO}/>
        <circle cx="48" cy="50" r="9" fill="url(#m4ch-bb-c)" ${SO}/>
        <path d="M13 31Q15 25 21 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M40 18Q42 15 45 14.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        ${EYES(18, 28, 39, 2.1)}${mouth(23, 43, 2.2)}${cheeks(14, 32, 43.5)}
        ${happy(43, 51, 25, 1.6)}<path d="M45.6 28q1.4 1.2 2.8 0" fill="none" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="45.5" cy="51" r="1.3" fill="${O}"/><circle cx="50.5" cy="51" r="1.3" fill="${O}"/><path d="M47 53.6q1 .8 2 0" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="12" cy="10" r="3" fill="#EEF8FC" ${S15}/><circle cx="24" cy="10" r="1.8" fill="#EEF8FC" ${S15}/>
        ${spark(58, 38, 2.6, "#F6C75A")}`,
      chem_benzene: `${lg("m4ch-bz-h", "#E8FBF4", "#B4ECD8")}
        <path d="M32 4L56.2 18V46L32 60L7.8 46V18z" fill="url(#m4ch-bz-h)" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
                <path d="M33.5 9.5L51.5 20M51.5 44L33.5 54.5M12.5 42V22" stroke="#2E9A88" stroke-width="2.4" stroke-linecap="round"/>
                ${EYES(27, 37, 31, 2.1)}${mouth(32, 35.3, 2.2)}${cheeks(22.5, 41.5, 35.5)}
        <g ${S15}><circle cx="32" cy="4" r="3.2" fill="#F67EA8"/><circle cx="56.2" cy="46" r="3.2" fill="#FFC94A"/><circle cx="7.8" cy="46" r="3.2" fill="#9FD8F6"/></g>`,
      chem_positive: `${lg("m4ch-ps-b", "#7FDCC8", "#2E9A88")}${rg("m4ch-ps-p", "#FFB8D0", "#E8507E")}
        <rect x="3" y="19" width="58" height="32" rx="16" fill="url(#m4ch-ps-b)" ${SO}/>
        <rect x="7" y="23" width="50" height="24" rx="12" fill="none" stroke="#E8FBF4" stroke-width="1.2" stroke-dasharray="1.2 2.6" stroke-linecap="round"/>
        ${T("STAY", 34, 33.6, 9, "#FFFFFF", 22)}${T("POSITIVE", 33, 44.2, 9.6, "#FFF3C2", 40)}
        <circle cx="11" cy="15" r="9" fill="url(#m4ch-ps-p)" ${SO}/><path d="M11 11V19M7 15H15" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        ${spark(55, 11, 3.4, "#F6C75A")}${spark(48, 57, 2.4, "#F67EA8")}`
    }},
    pins: [
      {id: "tp-chem-gold", name: "Gold Element Pin", kind: "badge", desc: "A tiny periodic table tile for gold, number 79, in polished gold.",
        svg: `<svg viewBox="0 0 30 30"><defs><linearGradient id="m4ch-pg-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEBA8"/><stop offset=".55" stop-color="#E9B23E"/><stop offset="1" stop-color="#A86A14"/></linearGradient></defs>
          <rect x="3" y="2.5" width="24" height="25" rx="3.5" fill="url(#m4ch-pg-g)" stroke="#6E4810" stroke-width="1.1"/>
          <rect x="5.4" y="4.9" width="19.2" height="20.2" rx="2" fill="none" stroke="#FFF3C2" stroke-width=".7" opacity=".8"/>
          <text x="8.6" y="10" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="4.6" fill="#6E4810" text-anchor="middle">79</text>
          <text x="15" y="21.4" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="10.5" fill="#5A3A08" text-anchor="middle">Au</text>
          <ellipse cx="21.5" cy="7" rx="2.6" ry="1.2" transform="rotate(-35 21.5 7)" fill="#fff" opacity=".7"/></svg>`},
      {id: "tp-chem-tube", name: "Test Tube Clip", kind: "clip", desc: "A glass test tube of bubbly pink potion that hooks over the edge of the note.",
        svg: `<svg viewBox="0 0 22 50"><defs><linearGradient id="m4ch-pt-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB0CC"/><stop offset="1" stop-color="#E8507E"/></linearGradient></defs>
          <path d="M11 13V6a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#5A6272" stroke-width="3.6" stroke-linecap="round"/><path d="M11 13V6a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#C9D0DC" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M6 11H16V42A5 5 0 0 1 6 42z" fill="#EEF8FC" stroke="#3A4A5A" stroke-width="1.1"/>
          <path d="M7 24H15V42A4 4 0 0 1 7 42z" fill="url(#m4ch-pt-l)"/>
          <path d="M6 11H16V42A5 5 0 0 1 6 42z" fill="none" stroke="#3A4A5A" stroke-width="1.1"/>
          <rect x="4.5" y="9.5" width="13" height="3" rx="1.3" fill="#7FDCC8" stroke="#2E6A5E" stroke-width=".9"/>
          <circle cx="12" cy="30" r="1.2" fill="#fff" opacity=".8"/><circle cx="10" cy="36" r=".9" fill="#fff" opacity=".8"/><circle cx="12.5" cy="20" r="1" fill="#F6A8CC"/>
          <path d="M8.2 14V40" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".75"/></svg>`}
    ],
    card: {id: "tp-chem", name: "Lab Notebook", desc: "A mint lab notebook page with a bubbling flask in the corner, a floating molecule and a tiny periodic tile."}
  });
})();

