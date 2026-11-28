/* ===== module: 98-comp-acc.js ===== */
/* Companion wardrobe: 90 more things to wear, 30 each for the head, the face and the neck.
   Common: plain, everyday shapes in one colour. Uncommon: a touch of detail or a second colour. Rare: a second colour, a detail or two. Epic: unusual materials and shapes.
   Legendary: gold, gems and light, with twinkles.
   Each one fits the companion the way the Tiny Hat, Round Glasses and Cozy Scarf do:
   - head: drawn around (0,0) at anchors.top in the hat's space (its band sits at y 0 to 4, about 34 wide)
   - face: art(g) from the eyes, g = {lx, rx, y, R, mx, gap}: R is the lens radius, kept apart on narrow faces
   - neck: art(hw) for a body hw wide (half) at anchors.neck, like the scarf
   Read by 98-companion.js (COMP_ACC_MORE(kit)), which has the drawing helpers. */
var COMP_ACC_MORE = K => {
  const {OUT, WEAR, INK} = K, f = n => Math.round(n * 100) / 100;
  const W = def => `style="fill:var(--cp-wear,${def || "#5B7FD6"})"`, WS = def => `style="stroke:var(--cp-wear,${def || "#5B7FD6"})"`;
  // the wear colour as a fill: the same text as WEAR, so a Pro pattern can replace it
  const WF = WEAR;
  const GOLD = "#F5C542", GOLD_D = "#E0A82E";
  // a twinkle (legendary): a four-pointed star that glints
  const tw = (x, y, r, d) => `<path class="cp-tw" style="animation-delay:${d || 0}s" d="M${f(x)} ${f(y - r)}Q${f(x + r * .16)} ${f(y - r * .16)} ${f(x + r)} ${f(y)}Q${f(x + r * .16)} ${f(y + r * .16)} ${f(x)} ${f(y + r)}Q${f(x - r * .16)} ${f(y + r * .16)} ${f(x - r)} ${f(y)}Q${f(x - r * .16)} ${f(y - r * .16)} ${f(x)} ${f(y - r)}Z" fill="#FFF7CC" stroke="#E8A317" stroke-width=".8" stroke-linejoin="round"/>`;
  const star = (x, y, r, fill, sw) => { let p = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; p += (i ? "L" : "M") + f(x + q * Math.cos(a)) + " " + f(y + q * Math.sin(a)); } return `<path d="${p}Z" fill="${fill}"${sw ? ` ${OUT(sw)}` : ""}/>`; };
  // a line drawn twice: an ink outline, then the colour on top (frames, straps, cords)
  const line2 = (d, w, col) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(w + 2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" ${col.indexOf("style=") === 0 ? col : `stroke="${col}"`} stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // the neck's front curve: y at x for a parabola from (-hw, y0) dipping by dip in the middle
  const ny = (hw, y0, dip, x) => f(y0 + dip * (1 - (x / hw) * (x / hw)));
  const along = (hw, y0, dip, n, span) => { const s = span || .9, out = []; for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : -hw * s + (2 * hw * s) * i / (n - 1); out.push([f(x), ny(hw, y0, dip, x)]); } return out; };
  const band = (hw, y0, dip, y1, dip1, fill, sw) => `<path d="M${f(-hw)} ${y0}Q0 ${f(y0 + dip * 2)} ${f(hw)} ${y0}Q${f(hw + 2.6)} ${f((y0 + y1) / 2)} ${f(hw)} ${y1}Q0 ${f(y1 + dip1 * 2)} ${f(-hw)} ${y1}Q${f(-hw - 2.6)} ${f((y0 + y1) / 2)} ${f(-hw)} ${y0}Z" ${fill} ${OUT(sw || 2.2)}/>`;
  const arcP = (hw, y0, dip, sp) => { const a = hw * (sp || 1), ye = ny(hw, y0, dip, a); return `M${f(-a)} ${ye}Q0 ${f(2 * (y0 + dip) - ye)} ${f(a)} ${ye}`; };
  const flower = (x, y, r, fill, mid) => { let p = ""; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; p += `<circle cx="${f(x + r * .52 * Math.cos(a))}" cy="${f(y + r * .52 * Math.sin(a))}" r="${f(r * .5)}" ${fill} ${OUT(1.2)}/>`; } return p + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .34)}" fill="${mid || "#FFD35A"}" ${OUT(1)}/>`; };
  const feather = (len, wd, fill, sw) => `<path d="M0 0Q${f(-wd)} ${f(-len * .5)} 0 ${f(-len)}Q${f(wd)} ${f(-len * .5)} 0 0Z" ${fill}${sw ? ` ${OUT(sw)}` : ""}/>`;
  // a lens shape for each eye, in the eye's own space (x to the outside of the face is +): drawn mirrored on the left
  const pair = (g, fn) => `<g transform="translate(${g.lx} ${g.y}) scale(-1 1)">${fn(g.R)}</g><g transform="translate(${g.rx} ${g.y})">${fn(g.R)}</g>`;
  const bridge = (g, lift, w, col) => line2(`M${f(g.lx + g.R * .92)} ${f(g.y - g.R * .25)}Q${g.mx} ${f(g.y - g.R * .25 - lift)} ${f(g.rx - g.R * .92)} ${f(g.y - g.R * .25)}`, w || 1.8, col || INK);
  const temples = (g, w, col) => line2(`M${f(g.lx - g.R * 1.02)} ${f(g.y - g.R * .3)}l-${f(Math.min(3, g.ext))} -.6M${f(g.rx + g.R * 1.02)} ${f(g.y - g.R * .3)}l${f(Math.min(3, g.ext))} -.6`, w || 1.6, col || INK);
  const shine = (R, k) => `<path d="M${f(-R * .55 * (k || 1))} ${f(-R * .45)}q${f(R * .3)} ${f(-R * .3)} ${f(R * .7)} ${f(-R * .35)}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" stroke-linecap="round"/>`;
  const rr = (x, y, w, h, r) => `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;

  /* ---------------- Head ---------------- */
  const HEAD = [
    // Common
    {id: "ballcap", name: "Baseball Cap", rarity: "common", pat: true, art: () =>
      `<path d="M-15 2C-15.5 -13 -8 -18 0 -18S15.5 -13 15 2Z" ${WF} ${OUT(2.4)}/><path d="M0 -17.5V1M-7.5 -15.5Q-9.5 -8 -9.5 1.5M7.5 -15.5Q9.5 -8 9.5 1.5" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width="1.3" stroke-linecap="round"/><path d="M-10 -11Q-12 -6 -12 -1" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
      <path d="M-15 0Q2 5 15 -.5Q22 0 25.5 3.5Q22 8 11 7.5Q-2 7 -15 4.5Z" ${WF} ${OUT(2.4)}/><path d="M-13 3.6Q2 7.2 14 2.6Q20 2.8 23 4.2Q20 7 11 6.6Q-2 6.2 -13 3.6Z" fill="${INK}" opacity=".14"/><circle cx="0" cy="-18.6" r="2.4" ${WF} ${OUT(1.8)}/>`},
    {id: "buckethat", name: "Bucket Hat", rarity: "common", pat: true, art: () =>
      `<path d="M-11.5 -1L-9.8 -15Q0 -19.5 9.8 -15L11.5 -1Z" ${WF} ${OUT(2.4)}/><path d="M-6.5 -14Q-8 -8 -8 -2" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/><path d="M-11 -5Q0 -2.5 11 -5" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="3"/>
      <path d="M-12 -2.5Q0 .5 12 -2.5L20.5 4.5Q0 11 -20.5 4.5Z" ${WF} ${OUT(2.4)}/><path d="M-16.5 4.4Q0 9.2 16.5 4.4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-dasharray="1.6 2.2" stroke-linecap="round"/>`},
    {id: "partyhat", name: "Party Hat", rarity: "common", icon: [12, .85], art: () =>
      `<path d="M-12.5 3L0 -26L12.5 3Q0 7 -12.5 3Z" ${WF} ${OUT(2.4)}/><path d="M-8.2 -7Q0 -4 8.4 -7M-4.6 -15.5Q0 -14 4.7 -15.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.2" stroke-linecap="round"/><circle cx="-5" cy="-1" r="1.5" fill="#FFD35A"/><circle cx="5.5" cy="-.5" r="1.5" fill="#fff"/><circle cx="0" cy="-10.5" r="1.4" fill="#FFD35A"/><circle cx="1" cy="-19.5" r="1.2" fill="#fff"/>
      <path d="M-4 -27.5l-2.4 -2.6M4 -27.5l2.4 -2.6M0 -29.5v-3" stroke="#FF7A9C" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="-27" r="3.6" fill="#FFD35A" ${OUT(2)}/>`},
    {id: "beret", name: "Beret", rarity: "common", pat: true, art: () =>
      `<path d="M-17 -.5Q-21 -11 -5 -15Q13 -18 19.5 -7.5Q22 -1.5 13.5 .5Q0 2.5 -17 -.5Z" ${WF} ${OUT(2.4)}/><path d="M-11 -11Q-2 -14 8 -13" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-14.5 -1Q0 2.2 13.5 0L13.5 3.6Q0 6 -14.5 2.8Z" ${WF} ${OUT(2)}/><path d="M-14.5 -1Q0 2.2 13.5 0L13.5 3.6Q0 6 -14.5 2.8Z" fill="${INK}" opacity=".18"/><path d="M1.5 -15.6q.4 -3.4 3.2 -4.6" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`},
    {id: "paperhat", name: "Paper Boat Hat", rarity: "common", def: "#F4EFE3", art: () =>
      `<path d="M-16 -1L0 -22L16 -1Z" ${WF} ${OUT(2.2)}/><path d="M-7.5 -7h5.5M-5.5 -11h8M-2.5 -15h4M1.5 -7h6" stroke="#8C87A8" stroke-width="1.2" stroke-linecap="round"/><path d="M0 -22L-3.5 -1" stroke="${INK}" stroke-opacity=".18" stroke-width="1.4"/>
      <path d="M-18 -3H18L17 4.5H-17Z" ${WF} ${OUT(2.2)}/><path d="M-18 -3H18L17 4.5H-17Z" fill="${INK}" opacity=".08"/><path d="M-13 .6h6M-4 .6h9M9 .6h4" stroke="#8C87A8" stroke-width="1.1" stroke-linecap="round"/>`},
    // Rare
    {id: "tophat", name: "Top Hat", rarity: "rare", def: "#3A3450", icon: [12, .85], art: () =>
      `<path d="M-11 -1V-26Q0 -28.5 11 -26V-1Z" ${WF} ${OUT(2.4)}/><ellipse cx="0" cy="-26" rx="11" ry="2.5" ${WF} ${OUT(2)}/><ellipse cx="0" cy="-26" rx="11" ry="2.5" fill="#fff" opacity=".12"/><path d="M-7 -22.5V-12" stroke="#fff" stroke-opacity=".22" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-11 -9.5Q0 -7.5 11 -9.5V-3Q0 -1 -11 -3Z" fill="#E5484D" ${OUT(2)}/><path d="M6 -8.6v5.2" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-18.5 1Q-18.5 -3.2 -11 -2.2Q0 0 11 -2.2Q18.5 -3.2 18.5 1Q18.5 5 0 5Q-18.5 5 -18.5 1Z" ${WF} ${OUT(2.4)}/>`},
    {id: "cowboy", name: "Cowboy Hat", rarity: "rare", def: "#B07A45", art: () =>
      `<path d="M-10 -1Q-11.5 -15 -7 -19.5Q-3.4 -16.2 0 -18Q3.4 -16.2 7 -19.5Q11.5 -15 10 -1Z" ${WF} ${OUT(2.4)}/><path d="M-6.5 -16Q-8.4 -10 -8 -4" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>
      <path d="M-10.6 -6Q0 -4 10.6 -6V-2Q0 0 -10.6 -2Z" fill="#5A3B22" ${OUT(1.6)}/>${star(0, -3.6, 2.4, "#F2C14E", 1)}
      <path d="M-23 -7.5Q-20 1.5 0 1.8Q20 1.5 23 -7.5Q25 4.5 0 6.4Q-25 4.5 -23 -7.5Z" ${WF} ${OUT(2.4)}/><path d="M-21 -2.4Q-16 3.6 0 4Q16 3.6 21 -2.4Q18 5.4 0 5.8Q-18 5.4 -21 -2.4Z" fill="${INK}" opacity=".14"/>`},
    {id: "chefhat", name: "Chef's Hat", rarity: "rare", def: "#FFFFFF", icon: [12, .9], art: () =>
      `<path d="M-10.5 0V-8.5Q-17.5 -10 -15.5 -16.5Q-13 -22.5 -6.5 -20.5Q-3 -27.5 4 -25.8Q10.5 -24.5 10.4 -19.4Q17.5 -18.5 16.2 -12Q15 -7.5 10.5 -8.5V0Z" ${WF} ${OUT(2.4)}/><path d="M-4.5 -9V-1M1 -10V-1M6 -9V-1" stroke="#C9C3D6" stroke-width="1.4" stroke-linecap="round"/><path d="M-11 -15.5Q-9 -19 -5 -18M1 -23Q5 -23.6 7 -21" fill="none" stroke="#E4DEEE" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-11.5 -2.6H11.5V4H-11.5Z" ${WF} ${OUT(2.2)}/><path d="M-11.5 -2.6H11.5V4H-11.5Z" fill="#B9B2C4" opacity=".25"/>`},
    {id: "propeller", name: "Propeller Beanie", rarity: "rare", def: "#5A95FF", icon: [12, .9], art: () =>
      `<path d="M-15 2C-15.5 -12 -8 -17 0 -17S15.5 -12 15 2Z" ${WF}/><path d="M0 -17Q-6 -10 -6.2 2H6.2Q6 -10 0 -17Z" fill="#FFD35A"/><path d="M-15 2C-15.5 -10 -11 -14.6 -7.4 -16Q-11 -8 -11 2Z" fill="#E5484D"/><path d="M15 2C15.5 -10 11 -14.6 7.4 -16Q11 -8 11 2Z" fill="#E5484D"/><path d="M-16 -1.6H16V4H-16Z" fill="none"/>
      <path d="M-15 2C-15.5 -12 -8 -17 0 -17S15.5 -12 15 2Z" fill="none" ${OUT(2.4)}/><path d="M-16 -1.6H16V4H-16Z" ${WF} ${OUT(2)}/><path d="M-16 -1.6H16V4H-16Z" fill="${INK}" opacity=".18"/><path d="M0 -17V-22.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      <g class="cp-spin"><ellipse cx="-6.6" cy="-23.4" rx="6.6" ry="2.1" fill="#E5484D" ${OUT(1.6)}/><ellipse cx="6.6" cy="-23.4" rx="6.6" ry="2.1" fill="#FFD35A" ${OUT(1.6)}/></g><circle cx="0" cy="-23.4" r="1.9" fill="#fff" ${OUT(1.3)}/>`},
    {id: "tricorn", name: "Pirate Hat", rarity: "rare", def: "#3A3450", art: () =>
      `<path d="M-20 -6.5Q-12 2.2 0 1.2Q12 2.2 20 -6.5Q16.5 -14.5 8.5 -12.5Q4.5 -20.5 0 -20.5Q-4.5 -20.5 -8.5 -12.5Q-16.5 -14.5 -20 -6.5Z" ${WF} ${OUT(2.4)}/><path d="M-18 -5.6Q-11 .4 0 -.6Q11 .4 18 -5.6" fill="none" stroke="#F2C14E" stroke-width="2" stroke-linecap="round"/>
      <path d="M-4.2 -5.6L4.2 -1.4M4.2 -5.6L-4.2 -1.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="-9.5" r="3.4" fill="#fff"/><path d="M-1.8 -7.6h3.6v1.6h-3.6Z" fill="#fff"/><circle cx="-1.2" cy="-9.6" r=".9" fill="${INK}"/><circle cx="1.2" cy="-9.6" r=".9" fill="${INK}"/>`},
    // Epic
    {id: "wizard", name: "Wizard Hat", rarity: "exotic", def: "#5B4BC4", icon: [14, .72], art: () =>
      `<path d="M-12 0Q-8 -14 -3 -26Q1 -35 10 -36.5Q4.5 -31 4.4 -24Q7 -12 12 0Z" ${WF} ${OUT(2.4)}/><path d="M-6.5 -10Q-4 -19 -.5 -25" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>
      ${star(-2.5, -12, 2.6, "#FFD35A", 1)}${star(3.5, -20.5, 1.9, "#FFD35A", .9)}<path d="M-1.4 -27.5a3 3 0 1 0 3.2 -3.6a2.3 2.3 0 1 1 -3.2 3.6Z" fill="#FFF3B0" ${OUT(.9)}/>${star(10, -36.5, 2.2, "#FFD35A", 1)}
      <path d="M-22 2.5Q0 -4.5 22 2.5Q0 9 -22 2.5Z" ${WF} ${OUT(2.4)}/><path d="M-12 -.6Q0 2.5 12 -.6L11.3 -4.6Q0 -1.8 -11.3 -4.6Z" fill="#F2C14E" ${OUT(1.6)}/>`},
    {id: "viking", name: "Viking Helmet", rarity: "exotic", def: "#B9C0CC", art: () =>
      `<path d="M-12 -6Q-22.5 -8 -24.5 -23Q-18.5 -15 -10 -13.5Z" fill="#F3E6C8" ${OUT(2.2)}/><path d="M12 -6Q22.5 -8 24.5 -23Q18.5 -15 10 -13.5Z" fill="#F3E6C8" ${OUT(2.2)}/><path d="M-17 -9.6l-1.4 2.6M-20.6 -13.6l-2 2M17 -9.6l1.4 2.6M20.6 -13.6l2 2" stroke="#C9B48E" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M-14.5 2C-15 -12 -8 -17.5 0 -17.5S15 -12 14.5 2Z" ${WF} ${OUT(2.4)}/><path d="M0 -17V0" stroke="${INK}" stroke-opacity=".2" stroke-width="3.2"/><path d="M-9 -12.5Q-11 -7 -11 -2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-15.5 -2.4Q0 .8 15.5 -2.4V4Q0 7.2 -15.5 4Z" fill="#8B6A4F" ${OUT(2.2)}/>${[-10, -5, 0, 5, 10].map(x => `<circle cx="${x}" cy="${f(1.6 + .02 * (100 - x * x) * .3)}" r="1.15" fill="#E4E8EF" ${OUT(.8)}/>`).join("")}`},
    {id: "shroomcap", name: "Toadstool Cap", rarity: "exotic", def: "#E5484D", art: () =>
      `<path d="M-21.5 1Q-22.5 -10.5 -12 -17.5Q0 -24.5 12 -17.5Q22.5 -10.5 21.5 1Q0 -3 -21.5 1Z" ${WF} ${OUT(2.4)}/><path d="M-19.5 1Q0 -2.6 19.5 1Q12 6 0 6Q-12 6 -19.5 1Z" fill="#FFF1DC" ${OUT(2)}/><path d="M-12 2.6l1 2M-6 2.1l.4 2.6M0 1.9V4.6M6 2.1l-.4 2.6M12 2.6l-1 2" stroke="#D9C2A0" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="-11" cy="-9" r="3.2" fill="#FFF8F0" ${OUT(1.3)}/><circle cx="-.5" cy="-16" r="3.4" fill="#FFF8F0" ${OUT(1.3)}/><circle cx="10.5" cy="-10" r="3.6" fill="#FFF8F0" ${OUT(1.3)}/><circle cx="3.5" cy="-6.2" r="1.9" fill="#FFF8F0" ${OUT(1.1)}/><circle cx="-16.4" cy="-3" r="1.7" fill="#FFF8F0" ${OUT(1)}/><circle cx="16.8" cy="-3.2" r="1.5" fill="#FFF8F0" ${OUT(1)}/>`},
    {id: "plume", name: "Musketeer Hat", rarity: "exotic", def: "#8E6BE0", art: () =>
      `<path d="M3 -11Q10 -31 28 -27Q21 -25 19 -18.5Q15 -11.5 6.5 -7.5Z" fill="#FF7A9C" ${OUT(2)}/><path d="M7 -10.5Q13 -22 24 -25.5M11 -18l-2.6 -1.4M14.5 -21.5l-2 -2M17 -16.5l-2.2 -.6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M-11 -1Q-12.5 -13.5 0 -14.5Q12.5 -13.5 11 -1Z" ${WF} ${OUT(2.4)}/><path d="M-22.5 -3.5Q-12 3 0 2Q12 3 22.5 -3.5Q24.5 4.5 0 6.4Q-24.5 4.5 -22.5 -3.5Z" ${WF} ${OUT(2.4)}/><path d="M-21 .4Q-12 4.4 0 4.4Q12 4.4 21 .4Q18 5.4 0 5.8Q-18 5.4 -21 .4Z" fill="${INK}" opacity=".15"/>
      <path d="M-11.2 -5.4Q0 -3.4 11.2 -5.4V-1.8Q0 .2 -11.2 -1.8Z" fill="#F2C14E" ${OUT(1.4)}/><circle cx="0" cy="-3.5" r="2.1" fill="#2FB5C9" ${OUT(1.2)}/>`},
    {id: "flowercrown", name: "Flower Crown", rarity: "exotic", def: "#FF7A9C", art: () => {
      const pts = [[-16, -.5], [-9.5, -5], [0, -6.8], [9.5, -5], [16, -.5]];
      return `<path d="M-18 1.5Q0 -11 18 1.5" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M-18 1.5Q0 -11 18 1.5" fill="none" stroke="#4CB782" stroke-width="3" stroke-linecap="round"/>
        ${[[-13, -4.4, -30], [-4.5, -8, -10], [4.5, -8, 10], [13, -4.4, 30]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.8" transform="rotate(${a} ${x} ${y})" fill="#7ED19B" ${OUT(1.2)}/>`).join("")}
        ${pts.map(([x, y], i) => flower(x, y, i === 2 ? 5.6 : 4.6, WF, i % 2 ? "#FFB347" : "#FFE07A")).join("")}`; }},
    // Legendary
    {id: "phoenix", name: "Phoenix Crest", rarity: "legendary", def: "#FF5A2B", icon: [13, .78], art: () => {
      const fan = [[-42, 19], [-21, 25], [0, 30], [21, 25], [42, 19]];
      return `<g transform="translate(0 -2)">${fan.map(([a, l]) => `<g transform="rotate(${a})">${feather(l, 7, WF, 2)}</g>`).join("")}${fan.map(([a, l]) => `<g transform="rotate(${a})">${feather(l * .62, 3.6, `fill="#FFD35A"`)}</g>`).join("")}${fan.map(([a, l]) => `<g transform="rotate(${a})"><path d="M0 -2V${f(-l * .8)}" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/></g>`).join("")}</g>
        <path d="M-15.5 -2Q0 2 15.5 -2V3.6Q0 7.6 -15.5 3.6Z" fill="${GOLD}" ${OUT(2.2)}/><path d="M-13 -.6Q0 2.8 13 -.6" fill="none" stroke="#FFF3B0" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M0 -3.4L3.2 1.4L0 6.2L-3.2 1.4Z" fill="#E5484D" ${OUT(1.4)}/><path d="M-1 -.4L0 -1.8" stroke="#fff" stroke-width="1" stroke-linecap="round"/><circle cx="-9" cy="1.4" r="1.5" fill="#FF9A3C" ${OUT(1)}/><circle cx="9" cy="1.4" r="1.5" fill="#FF9A3C" ${OUT(1)}/>
        ${tw(-19, -20, 3.2, 0)}${tw(20, -25, 3.6, .8)}${tw(-4, -36, 2.6, 1.6)}`; }},
    {id: "halo", name: "Celestial Halo", rarity: "legendary", def: "#FFD35A", art: () =>
      `<ellipse cx="0" cy="-15" rx="16.5" ry="5.2" fill="none" stroke="#FFE58A" stroke-opacity=".45" stroke-width="9"/><ellipse cx="0" cy="-15" rx="16.5" ry="5.2" fill="none" stroke="${INK}" stroke-width="6.2"/><ellipse cx="0" cy="-15" rx="16.5" ry="5.2" fill="none" ${WS("#FFD35A")} stroke-width="3.8"/>
      <path d="M-11 -18.6Q-4 -20.6 4 -20.2" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.5" stroke-linecap="round"/>${star(-17.5, -22, 2.2, "#FFF3B0", .9)}${star(15, -7.5, 1.8, "#FFF3B0", .8)}
      ${tw(18, -24, 3.4, 0)}${tw(-20, -10, 2.6, 1)}${tw(3, -27, 2.4, 1.7)}`},
    {id: "imperial", name: "Imperial Crown", rarity: "legendary", def: "#C0283C", icon: [12, .85], art: () =>
      `<path d="M-13 -2Q-15.5 -20 0 -22.5Q15.5 -20 13 -2Z" ${WF} ${OUT(2.4)}/><path d="M-8 -16Q-9.6 -10 -9.4 -5" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2.2" stroke-linecap="round"/>
      ${line2("M-13 -2Q-13.5 -20.5 0 -22.5Q13.5 -20.5 13 -2M0 -22.5V-2", 2.8, GOLD)}${[[-11.6, -11], [-8, -17.6], [8, -17.6], [11.6, -11], [0, -12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#FFF8F0" ${OUT(.8)}/>`).join("")}
      <circle cx="0" cy="-25.4" r="3.3" fill="${GOLD}" ${OUT(1.8)}/>${line2("M0 -28.6V-34.2M-2.6 -31.6H2.6", 1.5, GOLD)}
      <path d="M-16.5 -4.6Q0 -1.4 16.5 -4.6V3.4Q0 6.6 -16.5 3.4Z" fill="${GOLD}" ${OUT(2.2)}/><path d="M-14 -2.6Q0 .4 14 -2.6" fill="none" stroke="#FFF3B0" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="-9.5" cy=".6" r="2" fill="#2FB5C9" ${OUT(1.1)}/><path d="M0 -2.6L2.8 1.2L0 5L-2.8 1.2Z" fill="#E5484D" ${OUT(1.2)}/><circle cx="9.5" cy=".6" r="2" fill="#4CB782" ${OUT(1.1)}/>
      ${tw(-18.5, -15, 3.2, 0)}${tw(19, -21, 3.4, .9)}${tw(8, -33, 2.4, 1.7)}`},
    {id: "dragonhorns", name: "Dragon Horns", rarity: "legendary", def: "#7A2B3A", icon: [12, .8], art: () => {
      const horn = s => `<g transform="scale(${s} 1)"><path d="M-13 -2Q-14 -14 -20 -21Q-25 -27 -25 -36Q-18.5 -31 -14.5 -25.5Q-8 -17 -5 -5Z" ${WF} ${OUT(2.2)}/><path d="M-12.6 -9.6l3.2 -.6M-14 -15.6l3.2 -1.2M-17.6 -21.2l3 -1.6M-21 -27.6l2.6 -1.8" stroke="#fff" stroke-opacity=".38" stroke-width="1.4" stroke-linecap="round"/></g>`;
      return `${horn(1)}${horn(-1)}<path d="M-15.5 -2.4Q0 1.6 15.5 -2.4V3.4Q0 7.4 -15.5 3.4Z" fill="${GOLD}" ${OUT(2.2)}/>${[-11, -6, 6, 11].map(x => `<path d="M${x - 1.6} ${f(-1.4 + (x * x) * -.004)}L${x} ${f(-4.8 + (x * x) * -.004)}L${x + 1.6} ${f(-1.4 + (x * x) * -.004)}Z" fill="${GOLD_D}" ${OUT(1)}/>`).join("")}
        <circle cx="0" cy="1.6" r="5.6" fill="#8CFFC8" opacity=".45"/><path d="M-4.4 1.6Q0 -3.4 4.4 1.6Q0 6.6 -4.4 1.6Z" fill="#3FE09A" ${OUT(1.3)}/><path d="M0 -.8Q-.9 1.6 0 4Q.9 1.6 0 -.8Z" fill="${INK}"/>
        ${tw(-14, -34, 3, 0)}${tw(23, -18, 3.4, .9)}${tw(0, -12, 2.4, 1.7)}`; }},
    {id: "unicorn", name: "Unicorn Horn", rarity: "legendary", def: "#FFD8EE", icon: [12, .85], art: () =>
      `<path d="M-4 -2Q-11 -8 -16.5 -3.5" fill="none" stroke="#FF7A9C" stroke-width="3" stroke-linecap="round"/><path d="M-4 -.4Q-11.4 -4.6 -15 1" fill="none" stroke="#FFD35A" stroke-width="3" stroke-linecap="round"/><path d="M4 -2Q11 -8 16.5 -3.5" fill="none" stroke="#5A95FF" stroke-width="3" stroke-linecap="round"/><path d="M4 -.4Q11.4 -4.6 15 1" fill="none" stroke="#4CB782" stroke-width="3" stroke-linecap="round"/>
      <path d="M-5.4 -1.5L0 -33L5.4 -1.5Q0 1 -5.4 -1.5Z" ${WF} ${OUT(2.2)}/><path d="M-4.4 -6.6L4.4 -9.6M-3.5 -12.4L3.5 -15.4M-2.6 -18.2L2.6 -21M-1.6 -24L1.6 -26.4" stroke="#F2B63A" stroke-width="1.8" stroke-linecap="round"/><path d="M-1.8 -8L-.6 -26" stroke="#fff" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round"/>
      ${flower(-7.5, 0, 4.4, WF, "#FFE07A")}${flower(7.5, 0, 4.4, WF, "#FFE07A")}${tw(-11, -22, 3.2, 0)}${tw(11, -29, 3.4, .9)}${tw(13.5, -12, 2.4, 1.7)}`}
  ];

  /* ---------------- Face ---------------- */
  const FACE = [
    // Common
    {id: "squareglasses", name: "Square Glasses", rarity: "common", def: "#2B2233", art: g => {
      const hw = Math.min(g.R * 1.05, g.gap / 2 - .7), hh = g.R * .82, r = g.R * .32;
      const lens = `${rr(-hw, -hh, hw * 2, hh * 2, r)}`;
      return `${bridge(g, 2.4, 1.8, WS("#2B2233"))}${temples(g, 1.6, WS("#2B2233"))}${[g.lx, g.rx].map(x => `<path transform="translate(${x} ${g.y})" d="${lens}" fill="#fff" fill-opacity=".16" stroke="${INK}" stroke-width="4"/><path transform="translate(${x} ${g.y})" d="${lens}" fill="none" ${WS("#2B2233")} stroke-width="2.2"/><path transform="translate(${x} ${g.y})" d="M${f(-hw * .5)} ${f(-hh * .45)}l${f(hw * .55)} 0" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" stroke-linecap="round"/>`).join("")}`; }},
    {id: "sunglasses", name: "Sunglasses", rarity: "common", def: "#3A3450", art: g =>
      `${bridge(g, 3, 1.8)}${temples(g)}${pair(g, R => `<circle r="${f(R * 1.02)}" ${WF} ${OUT(2.2)}/><path d="M${f(R * .05)} ${f(-R * .62)}q${f(R * .45)} ${f(R * .1)} ${f(R * .6)} ${f(R * .5)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/><circle cx="${f(-R * .4)}" cy="${f(R * .4)}" r="${f(R * .14)}" fill="#fff" opacity=".6"/>`)}`},
    {id: "halfmoons", name: "Reading Glasses", rarity: "common", def: "#C9A227", art: g => {
      const y = f(g.y + g.R * .2), lens = R => `M${f(-R)} 0A${f(R)} ${f(R * .86)} 0 0 0 ${f(R)} 0Z`;
      return `${line2(`M${f(g.lx + g.R)} ${y}Q${g.mx} ${f(g.y - g.R * .45)} ${f(g.rx - g.R)} ${y}`, 1.4, WS("#C9A227"))}${[g.lx, g.rx].map(x => `<g transform="translate(${x} ${y})"><path d="${lens(g.R)}" fill="#fff" fill-opacity=".2" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/><path d="${lens(g.R)}" fill="none" ${WS("#C9A227")} stroke-width="1.8" stroke-linejoin="round"/></g>`).join("")}${line2(`M${f(g.lx - g.R)} ${y}l-3 -1.6M${f(g.rx + g.R)} ${y}l3 -1.6`, 1.3, WS("#C9A227"))}`; }},
    {id: "goggles", name: "Swim Goggles", rarity: "common", def: "#2FB5C9", art: g =>
      `${line2(`M${f(g.lx - g.R * 1.1 - Math.min(6, g.ext))} ${f(g.y - 1)}H${f(g.rx + g.R * 1.1 + Math.min(6, g.ext))}`, 2.6, WS("#2FB5C9"))}${pair(g, R => `<ellipse rx="${f(R * 1.08)}" ry="${f(R * .88)}" fill="#BFE9FF" fill-opacity=".5" stroke="${INK}" stroke-width="5"/><ellipse rx="${f(R * 1.08)}" ry="${f(R * .88)}" fill="none" ${WS("#2FB5C9")} stroke-width="2.8"/>${shine(R)}`)}`},
    {id: "tapeglasses", name: "Taped Glasses", rarity: "common", def: "#2B2233", art: g => {
      const hw = Math.min(g.R * 1.02, g.gap / 2 - .8), hh = g.R * .86, lens = rr(-hw, -hh, hw * 2, hh * 2, g.R * .55);
      return `${bridge(g, 1.2, 2.6, WS("#2B2233"))}${temples(g, 2, WS("#2B2233"))}${[g.lx, g.rx].map(x => `<path transform="translate(${x} ${g.y})" d="${lens}" fill="#fff" fill-opacity=".14" stroke="${INK}" stroke-width="5.4"/><path transform="translate(${x} ${g.y})" d="${lens}" fill="none" ${WS("#2B2233")} stroke-width="3.2"/>`).join("")}
        <rect x="${f(g.mx - 2.6)}" y="${f(g.y - g.R * .62)}" width="5.2" height="${f(g.R * .82)}" rx=".8" fill="#FFF8F0" ${OUT(1.1)}/><path d="M${f(g.mx - 1.6)} ${f(g.y - g.R * .4)}h3.2M${f(g.mx - 1.6)} ${f(g.y - g.R * .1)}h3.2" stroke="#C9C3D6" stroke-width=".9"/>`; }},
    // Rare
    {id: "aviators", name: "Aviators", rarity: "rare", def: "#3A9AD9", art: g => {
      const lens = R => `M${f(-R * 1.02)} ${f(-R * .7)}H${f(R * .95)}Q${f(R * 1.12)} ${f(R * .2)} ${f(R * .45)} ${f(R * .92)}Q${f(-R * .3)} ${f(R * 1.22)} ${f(-R * .9)} ${f(R * .4)}Q${f(-R * 1.15)} ${f(-R * .15)} ${f(-R * 1.02)} ${f(-R * .7)}Z`;
      return `${line2(`M${f(g.lx + g.R * .95)} ${f(g.y - g.R * .7)}H${f(g.rx - g.R * .95)}`, 1.2, "#D9A93A")}${temples(g, 1.2, "#D9A93A")}<g transform="translate(${g.lx} ${g.y}) scale(-1 1)"><path d="${lens(g.R)}" ${WF} fill-opacity=".6" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/><path d="${lens(g.R)}" fill="none" stroke="#E8B83A" stroke-width="1.5" stroke-linejoin="round"/>${shine(g.R)}</g><g transform="translate(${g.rx} ${g.y})"><path d="${lens(g.R)}" ${WF} fill-opacity=".6" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/><path d="${lens(g.R)}" fill="none" stroke="#E8B83A" stroke-width="1.5" stroke-linejoin="round"/>${shine(g.R)}</g>`; }},
    {id: "heartshades", name: "Heart Shades", rarity: "rare", def: "#FF4F8B", art: g => {
      const s = g.R * 1.08, h = `M0 ${f(s * .9)}C${f(-s * 1.45)} ${f(s * .05)} ${f(-s * 1.05)} ${f(-s * 1.05)} 0 ${f(-s * .38)}C${f(s * 1.05)} ${f(-s * 1.05)} ${f(s * 1.45)} ${f(s * .05)} 0 ${f(s * .9)}Z`;
      return `${bridge(g, 2.6, 1.8)}${temples(g)}${[g.lx, g.rx].map(x => `<g transform="translate(${x} ${g.y})"><path d="${h}" ${WF} fill-opacity=".9" ${OUT(2.2)}/><path d="M${f(-s * .7)} ${f(-s * .32)}q${f(s * .2)} ${f(-s * .38)} ${f(s * .5)} ${f(-s * .3)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.5" stroke-linecap="round"/></g>`).join("")}`; }},
    {id: "starshades", name: "Star Shades", rarity: "rare", def: "#FFC93C", art: g =>
      `${bridge(g, 2.4, 1.8)}${temples(g)}${[g.lx, g.rx].map(x => `${star(x, g.y + g.R * .1, g.R * 1.3, "", 2.1).replace('fill=""', WF)}<path d="M${f(x - g.R * .45)} ${f(g.y - g.R * .1)}l${f(g.R * .35)} ${f(-g.R * .4)}" stroke="#fff" stroke-opacity=".85" stroke-width="1.5" stroke-linecap="round"/>`).join("")}`},
    {id: "monocle", name: "Monocle", rarity: "rare", def: "#E0B03A", art: g => {
      const R = g.R * 1.05, x = g.rx, y = g.y;
      return `${line2(`M${f(x + R * .72)} ${f(y + R * .72)}Q${f(x + R * 1.7)} ${f(y + R * 2.4)} ${f(x + R * .5)} ${f(y + R * 3.8)}`, 1.2, WS("#E0B03A"))}<circle cx="${x}" cy="${y}" r="${f(R)}" fill="#fff" fill-opacity=".2" stroke="${INK}" stroke-width="4.6"/><circle cx="${x}" cy="${y}" r="${f(R)}" fill="none" ${WS("#E0B03A")} stroke-width="2.6"/><g transform="translate(${x} ${y})">${shine(R)}</g>`; }},
    {id: "cateye", name: "Cat-Eye Glasses", rarity: "rare", def: "#E5484D", art: g => {
      const lens = R => `M${f(-R)} ${f(-R * .32)}Q${f(-R * .1)} ${f(-R * .95)} ${f(R * 1.38)} ${f(-R * 1.08)}Q${f(R * 1.08)} ${f(R * .2)} ${f(R * .6)} ${f(R * .68)}Q${f(-R * .4)} ${f(R * 1.08)} ${f(-R * .95)} ${f(R * .36)}Q${f(-R * 1.15)} ${f(-R * .05)} ${f(-R)} ${f(-R * .32)}Z`;
      return `${bridge(g, 2, 1.8, WS("#E5484D"))}${pair(g, R => `<path d="${lens(R)}" fill="#fff" fill-opacity=".16" stroke="${INK}" stroke-width="4.2" stroke-linejoin="round"/><path d="${lens(R)}" fill="none" ${WS("#E5484D")} stroke-width="2.3" stroke-linejoin="round"/><circle cx="${f(R * 1.08)}" cy="${f(-R * .82)}" r="1.1" fill="#fff"/><circle cx="${f(R * .7)}" cy="${f(-R * .86)}" r=".8" fill="#fff"/>`)}`; }},
    // Epic
    {id: "steampunk", name: "Steampunk Goggles", rarity: "exotic", def: "#F2994A", art: g =>
      `<path d="M${f(g.lx - g.R * 1.2 - Math.min(7, g.ext))} ${f(g.y - g.R * .3)}H${f(g.rx + g.R * 1.2 + Math.min(7, g.ext))}V${f(g.y + g.R * .3)}H${f(g.lx - g.R * 1.2 - Math.min(7, g.ext))}Z" fill="#7A4E2D" ${OUT(1.8)}/>${line2(`M${f(g.lx + g.R)} ${g.y}H${f(g.rx - g.R)}`, 2.4, "#C98A3A")}
      ${pair(g, R => `<circle r="${f(R * 1.2)}" fill="#C98A3A" ${OUT(2)}/><circle r="${f(R * .96)}" fill="#8A5A26" ${OUT(1.2)}/><circle r="${f(R * .78)}" ${WF} fill-opacity=".85" ${OUT(1.2)}/>${[45, 135, 225, 315].map(a => `<circle cx="${f(R * 1.08 * Math.cos(a * Math.PI / 180))}" cy="${f(R * 1.08 * Math.sin(a * Math.PI / 180))}" r=".9" fill="#F3D08A"/>`).join("")}${shine(R * .8)}`)}`},
    {id: "visor", name: "Cyber Visor", rarity: "exotic", def: "#2FB5C9", art: g => {
      const x0 = f(g.lx - g.R - Math.min(3.5, g.ext)), x1 = f(g.rx + g.R + Math.min(3.5, g.ext)), h = g.R * .78, d = rr(x0, g.y - h, x1 - x0, h * 2, h * .9);
      return `<path d="${d}" fill="none" ${WS("#2FB5C9")} stroke-opacity=".35" stroke-width="6"/><path d="${d}" ${WF} fill-opacity=".55" ${OUT(2.4)}/><path d="M${f(x0 + 3)} ${f(g.y - h * .42)}H${f(x1 - 3)}" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/><path d="M${f(x0 + 4)} ${f(g.y + h * .35)}H${f(x0 + 10)}M${f(x1 - 10)} ${f(g.y + h * .35)}H${f(x1 - 4)}" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/><circle cx="${f(x1 - 2.6)}" cy="${f(g.y - h * .6)}" r="1" fill="#E5FFFF"/>`; }},
    {id: "pixelshades", name: "Pixel Shades", rarity: "exotic", def: "#1E1A28", art: g => {
      const u = f(Math.max(1.6, g.R * .34)), n = Math.max(4, Math.round((g.R * 2.3) / u)), y0 = g.y - u * 1.6;
      const x0 = f(g.lx - n * u / 2), x1 = f(g.rx + n * u / 2);
      const lens = cx => { const l = cx - n * u / 2; return `<rect x="${f(l)}" y="${f(y0 + u)}" width="${f(n * u)}" height="${u}"/><rect x="${f(l)}" y="${f(y0 + u * 2)}" width="${f((n - 1) * u)}" height="${u}"/><rect x="${f(l + u)}" y="${f(y0 + u * 3)}" width="${f((n - 2) * u)}" height="${u}"/>`; };
      const hl = cx => { const l = cx - n * u / 2; return `<rect x="${f(l + u)}" y="${f(y0 + u)}" width="${u}" height="${u}"/><rect x="${f(l + u * 2)}" y="${f(y0 + u * 2)}" width="${u}" height="${u}"/>`; };
      return `<g shape-rendering="crispEdges"><g stroke="${INK}" stroke-width="2.2" stroke-linejoin="miter"><rect x="${x0}" y="${f(y0)}" width="${f(x1 - x0)}" height="${u}"/>${lens(g.lx)}${lens(g.rx)}</g><g ${WF}><rect x="${x0}" y="${f(y0)}" width="${f(x1 - x0)}" height="${u}"/>${lens(g.lx)}${lens(g.rx)}</g><g fill="#fff" opacity=".9">${hl(g.lx)}${hl(g.rx)}</g></g>`; }},
    {id: "masquerade", name: "Masquerade Mask", rarity: "exotic", def: "#8E6BE0", art: g => {
      const R = g.R, k = Math.min(1, g.ext / (g.R * 1.1)), X = m => R * (1 + (m - 1) * k), a = R * .92, b = R * .74, L = g.lx, Rx = g.rx, y = g.y, m = g.mx;
      const outer = `M${f(m)} ${f(y + R * .35)}Q${f(L + R * .2)} ${f(y + R * 1.55)} ${f(L - X(1.25))} ${f(y + R * .55)}Q${f(L - X(2.1))} ${f(y - R * .4)} ${f(L - X(1.9))} ${f(y - R * 1.6)}Q${f(L - R * .8)} ${f(y - R * 1.05)} ${f(L)} ${f(y - R * 1.2)}Q${f(m)} ${f(y - R * 1.3)} ${f(Rx)} ${f(y - R * 1.2)}Q${f(Rx + R * .8)} ${f(y - R * 1.05)} ${f(Rx + X(1.9))} ${f(y - R * 1.6)}Q${f(Rx + X(2.1))} ${f(y - R * .4)} ${f(Rx + X(1.25))} ${f(y + R * .55)}Q${f(Rx - R * .2)} ${f(y + R * 1.55)} ${f(m)} ${f(y + R * .35)}Z`;
      const hole = x => `M${f(x - a)} ${f(y)}A${f(a)} ${f(b)} 0 1 0 ${f(x + a)} ${f(y)}A${f(a)} ${f(b)} 0 1 0 ${f(x - a)} ${f(y)}Z`;
      return `<path d="${outer}${hole(L)}${hole(Rx)}" fill-rule="evenodd" ${WF} ${OUT(2.2)}/><path d="${hole(L)}${hole(Rx)}" fill="none" stroke="#F2C14E" stroke-width="1.3"/><path d="M${f(L - X(1.6))} ${f(y - R * .9)}q${f(R * .5)} ${f(R * .1)} ${f(R * .5)} ${f(R * .6)}M${f(Rx + X(1.6))} ${f(y - R * .9)}q${f(-R * .5)} ${f(R * .1)} ${f(-R * .5)} ${f(R * .6)}" fill="none" stroke="#F2C14E" stroke-width="1.2" stroke-linecap="round"/><path d="M${f(m)} ${f(y - R * 1.55)}l1.8 2.2l-1.8 2.2l-1.8 -2.2Z" fill="#FFD35A" ${OUT(1)}/>`; }},
    {id: "prism", name: "Prism Glasses", rarity: "exotic", def: "#B9A6FF", art: g => {
      const hex = R => { let p = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p += (i ? "L" : "M") + f(R * 1.08 * Math.cos(a)) + " " + f(R * .98 * Math.sin(a)); } return p + "Z"; };
      return `<defs><linearGradient id="cpgPrism" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A9C"/><stop offset=".3" stop-color="#FFD35A"/><stop offset=".55" stop-color="#4CD7A0"/><stop offset=".8" stop-color="#5A95FF"/><stop offset="1" stop-color="#B57BFF"/></linearGradient></defs>${bridge(g, 2, 1.8, WS("#B9A6FF"))}${temples(g, 1.6, WS("#B9A6FF"))}${pair(g, R => `<path d="${hex(R)}" fill="url(#cpgPrism)" fill-opacity=".7" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="${hex(R)}" fill="none" ${WS("#B9A6FF")} stroke-width="2" stroke-linejoin="round"/>${shine(R)}`)}`; }},
    // Legendary
    {id: "diamondshades", name: "Diamond Shades", rarity: "legendary", def: "#5A95FF", art: g => {
      const oct = R => `M${f(-R * .5)} ${f(-R * .92)}H${f(R * .5)}L${f(R * 1.1)} ${f(-R * .3)}L${f(R * .55)} ${f(R * .95)}H${f(-R * .55)}L${f(-R * 1.1)} ${f(-R * .3)}Z`;
      const gem = (x, y, s) => `<path d="M${f(x)} ${f(y - s)}L${f(x + s * .8)} ${f(y)}L${f(x)} ${f(y + s)}L${f(x - s * .8)} ${f(y)}Z" fill="#E6F4FF" ${OUT(.9)}/>`;
      return `${bridge(g, 2, 2, GOLD)}${temples(g, 1.8, GOLD)}${pair(g, R => `<path d="${oct(R)}" ${WF} fill-opacity=".7" stroke="${INK}" stroke-width="4.4" stroke-linejoin="round"/><path d="${oct(R)}" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${f(-R * .5)} ${f(-R * .92)}L${f(-R * .2)} ${f(-R * .3)}L${f(R * .2)} ${f(-R * .3)}L${f(R * .5)} ${f(-R * .92)}M${f(-R * 1.1)} ${f(-R * .3)}H${f(R * 1.1)}M${f(-R * .2)} ${f(-R * .3)}L0 ${f(R * .95)}L${f(R * .2)} ${f(-R * .3)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9"/>${gem(R * 1.1, -R * .95, 1.9)}`)}${gem(g.mx, g.y - g.R * .5, 1.8)}
        ${tw(g.lx - g.R * 1.6, g.y - g.R * 1.4, 2.8, 0)}${tw(g.rx + g.R * 1.7, g.y + g.R * .4, 2.4, 1.1)}`; }},
    {id: "galaxygoggles", name: "Galaxy Goggles", rarity: "legendary", def: "#2A1F5C", art: g =>
      `${line2(`M${f(g.lx + g.R)} ${f(g.y - g.R * .2)}Q${g.mx} ${f(g.y - g.R * .7)} ${f(g.rx - g.R)} ${f(g.y - g.R * .2)}`, 2.4, "#E8B83A")}${pair(g, R => `<circle r="${f(R * 1.06)}" ${WF}/><ellipse cx="${f(-R * .3)}" cy="${f(R * .2)}" rx="${f(R * .6)}" ry="${f(R * .32)}" transform="rotate(-25)" fill="#FF7AC8" opacity=".55"/><ellipse cx="${f(R * .3)}" cy="${f(-R * .25)}" rx="${f(R * .5)}" ry="${f(R * .26)}" transform="rotate(-25)" fill="#4FD6FF" opacity=".5"/><circle cx="${f(R * .45)}" cy="${f(R * .42)}" r=".7" fill="#fff"/><circle cx="${f(-R * .5)}" cy="${f(-R * .35)}" r=".6" fill="#fff"/><circle cx="${f(R * .05)}" cy="${f(R * .7)}" r=".5" fill="#fff"/>${star(R * .55, -R * .5, 1.5, "#fff")}<circle r="${f(R * 1.06)}" fill="none" stroke="${INK}" stroke-width="5.4"/><circle r="${f(R * 1.06)}" fill="none" stroke="#E8B83A" stroke-width="3.2"/><circle r="${f(R * 1.06)}" fill="none" stroke="#FFF3B0" stroke-width=".8" stroke-dasharray="1 2.4"/>`)}
      ${tw(g.lx - g.R * 1.7, g.y - g.R * 1.1, 2.8, 0)}${tw(g.rx + g.R * 1.6, g.y - g.R * 1.5, 2.4, .8)}${tw(g.rx + g.R * 1.9, g.y + g.R * .6, 2, 1.6)}`},
    {id: "phoenixmask", name: "Phoenix Mask", rarity: "legendary", def: "#F5B83A", art: g => {
      const R = g.R, k = Math.min(1, g.ext / (g.R * 1.1)), X = m => R * (1 + (m - 1) * k), a = R * .9, b = R * .72, L = g.lx, Rx = g.rx, y = g.y, m = g.mx;
      const hole = x => `M${f(x - a)} ${f(y)}A${f(a)} ${f(b)} 0 1 0 ${f(x + a)} ${f(y)}A${f(a)} ${f(b)} 0 1 0 ${f(x - a)} ${f(y)}Z`;
      const outer = `M${f(m)} ${f(y + R * .4)}Q${f(L + R * .1)} ${f(y + R * 1.5)} ${f(L - X(1.3))} ${f(y + R * .45)}Q${f(L - X(1.7))} ${f(y - R * .5)} ${f(L - X(1.1))} ${f(y - R * 1.15)}Q${f(m)} ${f(y - R * 1.55)} ${f(Rx + X(1.1))} ${f(y - R * 1.15)}Q${f(Rx + X(1.7))} ${f(y - R * .5)} ${f(Rx + X(1.3))} ${f(y + R * .45)}Q${f(Rx - R * .1)} ${f(y + R * 1.5)} ${f(m)} ${f(y + R * .4)}Z`;
      const wing = (x, s) => `<g transform="translate(${f(x)} ${f(y - R * .5)}) scale(${f(s * Math.max(.45, k))} ${f(Math.max(.45, k))})">${[[38, 15], [62, 13], [86, 10]].map(([an, l]) => `<g transform="rotate(${an})">${feather(l * R / 7, 3.6 * R / 7, `fill="#FF5A2B"`, 1.5)}${feather(l * R / 7 * .6, 1.8 * R / 7, `fill="#FFD35A"`)}</g>`).join("")}</g>`;
      return `${wing(Rx + R * .9, 1)}${wing(L - R * .9, -1)}<path d="${outer}${hole(L)}${hole(Rx)}" fill-rule="evenodd" ${WF} ${OUT(2.2)}/><path d="${hole(L)}${hole(Rx)}" fill="none" stroke="#FFF3B0" stroke-width="1.1"/><path d="M${f(m)} ${f(y - R * 1.3)}l2 2.4l-2 2.4l-2 -2.4Z" fill="#E5484D" ${OUT(1.1)}/>
        ${tw(L - X(2.2), y + R * .8, 2.6, 0)}${tw(Rx + X(2.4), y + R * .9, 2.8, 1)}${tw(m, y - R * 2.2, 2.2, 1.7)}`; }},
    {id: "sunburst", name: "Sunburst Shades", rarity: "legendary", def: "#FF7A2F", art: g => {
      const rays = R => { let p = ""; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 10, c = Math.cos(a), s = Math.sin(a), w = .2; p += `M${f(R * 1.08 * Math.cos(a - w))} ${f(R * 1.08 * Math.sin(a - w))}L${f(R * 1.62 * c)} ${f(R * 1.62 * s)}L${f(R * 1.08 * Math.cos(a + w))} ${f(R * 1.08 * Math.sin(a + w))}Z`; } return `<path d="${p}" fill="#FFC93C" ${OUT(1.2)}/>`; };
      return `${bridge(g, 2.6, 2, GOLD)}${pair(g, R => `${rays(R)}<circle r="${f(R * 1.06)}" ${WF} fill-opacity=".85" stroke="${INK}" stroke-width="4.4"/><circle r="${f(R * 1.06)}" fill="none" stroke="${GOLD}" stroke-width="2.4"/>${shine(R)}`)}${tw(g.lx - g.R * 2, g.y - g.R * 1.3, 2.6, 0)}${tw(g.rx + g.R * 2, g.y + g.R * 1.2, 2.4, 1.2)}`; }},
    {id: "aurora", name: "Aurora Visor", rarity: "legendary", def: "#7CF5FF", art: g => {
      const L = f(g.lx - g.R - Math.min(4, g.ext)), Rr = f(g.rx + g.R + Math.min(4, g.ext)), R = g.R, y = g.y, m = g.mx;
      const d = `M${L} ${f(y - R * .8)}Q${m} ${f(y - R * 1.3)} ${Rr} ${f(y - R * .8)}Q${f(Rr + 2.4)} ${f(y)} ${f(Rr - .6)} ${f(y + R * .8)}Q${m} ${f(y + R * 1.2)} ${f(L + .6)} ${f(y + R * .8)}Q${f(L - 2.4)} ${f(y)} ${L} ${f(y - R * .8)}Z`;
      return `<defs><linearGradient id="cpgAurora" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#4CFFB0"/><stop offset=".5" stop-color="#4FD6FF"/><stop offset="1" stop-color="#C77BFF"/></linearGradient></defs><path d="${d}" fill="none" ${WS("#7CF5FF")} stroke-opacity=".4" stroke-width="7"/><path d="${d}" fill="url(#cpgAurora)" fill-opacity=".72" ${OUT(2.4)}/>
        <path d="M${f(L + 3)} ${f(y - R * .35)}Q${m} ${f(y - R * .95)} ${f(Rr - 3)} ${f(y - R * .35)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/><path d="M${f(L + 6)} ${f(y + R * .45)}Q${m} ${f(y + R * .1)} ${f(Rr - 6)} ${f(y + R * .45)}" fill="none" ${WS("#7CF5FF")} stroke-width="1.2" stroke-linecap="round"/>
        ${tw(L - 1, y - R * 1.2, 2.8, 0)}${tw(Rr + 1.5, y + R * .9, 2.6, 1)}${tw(m + R * .6, y - R * 1.6, 2, 1.8)}`; }}
  ];

  /* ---------------- Neck ---------------- */
  const NECK = [
    // Common
    {id: "bandana", name: "Bandana", rarity: "common", def: "#E5484D", pat: true, icon: [-9, .9], art: hw => {
      const a = f(Math.min(hw * .62, 15)), top = ny(hw, 2.6, 3.3, a), h = f(Math.max(14, a * 1.15) + 4);
      return `${band(hw, -4.5, 3.3, 2.6, 3.3, WF, 2.2)}<path d="M${-a} ${top}Q0 ${f(top + 6)} ${a} ${top}L1.8 ${f(h - 1.4)}Q0 ${f(h + .8)} -1.8 ${f(h - 1.4)}Z" ${WF} ${OUT(2.2)}/>${[[-4, 9], [3.5, 8.6], [0, 13.5], [-7.5, 6.6], [7.6, 6.4]].filter(([x, y]) => y < h - 3 && Math.abs(x) < a * (1 - (y - 4) / h)).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#fff" opacity=".85"/>`).join("")}<path d="M${f(-hw + 3)} -1.2Q0 4.4 ${f(hw - 3)} -1.2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-dasharray="1.4 2.2" stroke-linecap="round"/>`; }},
    {id: "lanyard", name: "Student Lanyard", rarity: "common", def: "#5A95FF", icon: [-10, .85], art: hw => {
      const a = f(Math.min(hw * .55, 13));
      return `${line2(`M${-a} ${ny(hw, -3, 3.4, -a)}L-2.6 10M${a} ${ny(hw, -3, 3.4, a)}L2.6 10`, 2.2, WS("#5A95FF"))}<rect x="-2.2" y="8.6" width="4.4" height="3.6" rx="1" fill="#C9D0DA" ${OUT(1.1)}/>
        <rect x="-6.2" y="11.6" width="12.4" height="11.2" rx="2" fill="#fff" ${OUT(1.8)}/><path d="M-6.2 13.6Q-6.2 11.6 -4.2 11.6H4.2Q6.2 11.6 6.2 13.6V14.8H-6.2Z" ${WF}/><circle cx="-2.6" cy="18.6" r="2" fill="#C9D6EA"/><path d="M.8 17.6h3.2M.8 19.8h3.2" stroke="#B9B2C4" stroke-width="1" stroke-linecap="round"/>`; }},
    {id: "beads", name: "Wooden Beads", rarity: "common", def: "#4CB782", art: hw => {
      const n = Math.max(7, Math.round(hw / 3.1)), pts = along(hw, -2, 5, n, .9);
      return `<path d="${arcP(hw, -2, 5, .95)}" fill="none" stroke="${INK}" stroke-width="1.4"/>${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.7" ${i % 2 ? `fill="#C89B6D"` : WF} ${OUT(1.4)}/><circle cx="${f(x - .9)}" cy="${f(y - .9)}" r=".7" fill="#fff" opacity=".7"/>`).join("")}`; }},
    {id: "bellcollar", name: "Bell Collar", rarity: "common", def: "#E5484D", art: hw =>
      `${band(hw, -3.6, 3.2, 2.2, 3.3, WF, 2.2)}<path d="M${f(-hw + 2.5)} -.6Q0 5.2 ${f(hw - 2.5)} -.6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="0" cy="7.4" r="1.5" fill="none" stroke="${INK}" stroke-width="1.3"/><path d="M-4.8 15Q-5.2 8.2 0 7.9Q5.2 8.2 4.8 15Z" fill="#FFD35A" ${OUT(1.8)}/><path d="M-4.6 12.6H4.6" stroke="#E8A317" stroke-width="1.1"/><circle cx="0" cy="15.3" r="1.4" fill="#E8A317" ${OUT(1)}/><path d="M-2.4 10.2q.6 -1.2 1.8 -1.4" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`},
    {id: "necktie", name: "School Tie", rarity: "common", def: "#2F4A8A", pat: true, icon: [-11, .8], art: () =>
      `<path d="M-2.5 7L-4.6 21.5L0 26.4L4.6 21.5L2.5 7Z" ${WF} ${OUT(2)}/><path d="M-3.4 1.2H3.4L2.5 7H-2.5Z" ${WF} ${OUT(2)}/><path d="M-3.6 13l7 -3.4M-4.2 18.4l8.2 -4M-3.4 23.4l6.6 -3.2" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>`},
    // Rare
    {id: "pearls", name: "Pearl Necklace", rarity: "rare", def: "#FFF8F0", art: hw => {
      const n = Math.max(8, Math.round(hw / 2.4));
      const pearl = ([x, y], r) => `<circle cx="${x}" cy="${y}" r="${r}" ${WF} ${OUT(1.1)}/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .3)}" fill="#fff"/>`;
      return `${along(hw, -2.5, 4.5, n, .88).map(p => pearl(p, 1.9)).join("")}${along(hw, 0, 7.6, n + 1, .84).map(p => pearl(p, 2.1)).join("")}<path d="M0 9.6Q-3.4 13.4 0 17Q3.4 13.4 0 9.6Z" fill="#FF7A9C" ${OUT(1.4)}/><path d="M-.9 12.2l.6 -1.2" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`; }},
    {id: "lei", name: "Flower Lei", rarity: "rare", def: "#FF7A9C", art: hw => {
      const n = Math.max(5, Math.round(hw / 5.2)), pts = along(hw, -1.5, 6, n, .86), lv = along(hw, -.5, 6.4, n - 1, .66);
      return `${lv.map(([x, y], i) => `<ellipse cx="${x}" cy="${f(y + 2.2)}" rx="3.2" ry="1.6" transform="rotate(${i % 2 ? 25 : -25} ${x} ${f(y + 2.2)})" fill="#7ED19B" ${OUT(1.1)}/>`).join("")}${pts.map(([x, y], i) => flower(x, y, 4, WF, i % 3 === 1 ? "#FF9A3C" : "#FFD35A")).join("")}`; }},
    {id: "sailor", name: "Sailor Collar", rarity: "rare", def: "#2F4A8A", art: hw => {
      const e = f(hw + 1.5);
      return `<path d="M${-e} -4Q0 3 ${e} -4L${f(e + 1)} 4.6Q${f(hw * .45)} 6.8 0 14.5Q${f(-hw * .45)} 6.8 ${f(-e - 1)} 4.6Z" ${WF} ${OUT(2.2)}/><path d="M${f(e - 1.6)} 2.6Q${f(hw * .45)} 4.4 0 10.6Q${f(-hw * .45)} 4.4 ${f(-e + 1.6)} 2.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M0 13L-5.4 10.4L-5 16.4Z" fill="#E5484D" ${OUT(1.4)}/><path d="M0 13L5.4 10.4L5 16.4Z" fill="#E5484D" ${OUT(1.4)}/><path d="M-1 13.6L-3 20.4M1 13.6L3 20.4" stroke="#E5484D" stroke-width="2.4" stroke-linecap="round"/><circle cx="0" cy="13" r="2" fill="#E5484D" ${OUT(1.3)}/>`; }},
    {id: "headphones", name: "Headphones", rarity: "rare", def: "#E5484D", art: hw => {
      const c = f(Math.max(8, hw * .78));
      return `${line2(`M${-c} 3Q0 ${f(16 + hw * .12)} ${c} 3`, 2.6, WS("#E5484D"))}${[-1, 1].map(s => `<g transform="translate(${f(s * c)} 2)"><ellipse rx="5.2" ry="6.6" ${WF} ${OUT(2)}/><ellipse cx="${f(-s * 1.4)}" rx="3" ry="4.6" fill="#3A3450"/><path d="M${f(s * 2.2)} -4.4q${f(s * 1.4)} 2 ${f(s * 1.2)} 4.4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/></g>`).join("")}`; }},
    {id: "ruff", name: "Ruffled Collar", rarity: "rare", def: "#FFF8F0", art: hw => {
      const n = Math.max(7, Math.round(hw * 2 / 5.2) + 1), pts = along(hw, -1, 4, n, .92);
      return `${pts.map(([x, y]) => `<ellipse cx="${x}" cy="${f(y + .6)}" rx="3.8" ry="5.2" ${WF} ${OUT(1.5)}/><path d="M${x} ${f(y - 2.6)}V${f(y + 3.4)}" stroke="#C9C3D6" stroke-width=".9" stroke-linecap="round"/>`).join("")}`; }},
    // Epic
    {id: "boa", name: "Feather Boa", rarity: "exotic", def: "#FF7AC8", icon: [-8, .9], art: hw => {
      const pts = along(hw, -1.5, 5, Math.max(8, Math.round(hw / 2.6)), 1).concat([[f(hw * .55 + 1), 12], [f(hw * .55 + 2), 17], [f(hw * .55 + 2.4), 22]]);
      return `${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.3" fill="${INK}" stroke="${INK}" stroke-width="3.4"/>`).join("")}${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.3" ${WF}/>`).join("")}${pts.map(([x, y], i) => `<path d="M${f(x - 2)} ${f(y - 1.2)}q1.2 -1.8 3 -1.4M${f(x + .4)} ${f(y + 2)}q1.4 -.6 2 -2" fill="none" stroke="#fff" stroke-opacity="${i % 2 ? .55 : .35}" stroke-width="1.1" stroke-linecap="round"/>`).join("")}`; }},
    {id: "crystal", name: "Crystal Pendant", rarity: "exotic", def: "#8E6BE0", art: hw =>
      `<path d="${arcP(hw, -2, 9, .9)}" fill="none" stroke="#3A3450" stroke-width="1.6"/><circle cx="0" cy="13.6" r="8" ${WF} opacity=".28"/>
      <rect x="-2.1" y="4.6" width="4.2" height="2.6" rx=".8" fill="${GOLD}" ${OUT(1.1)}/><path d="M0 7L4.2 10V16.4L0 21.4L-4.2 16.4V10Z" ${WF} ${OUT(1.6)}/><path d="M0 7V21.4M-4.2 10L0 12.6L4.2 10" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".9"/><path d="M-2.6 11.6V15.8" stroke="#fff" stroke-opacity=".85" stroke-width="1.1" stroke-linecap="round"/>${star(5.6, 6.6, 1.6, "#fff")}`},
    {id: "rocker", name: "Rocker Collar", rarity: "exotic", def: "#2B2233", art: hw => {
      const studs = along(hw, 3.2, 3.3, Math.max(4, Math.round(hw / 4.4)), .78);
      return `${line2(`M${f(-hw * .6)} ${ny(hw, 1.5, 3.3, -hw * .6)}Q0 ${f(18 + hw * .08)} ${f(hw * .6)} ${ny(hw, 1.5, 3.3, hw * .6)}`, 1.8, "#C9D0DA").replace(/stroke="#C9D0DA" stroke-width="1.8"/, `stroke="#C9D0DA" stroke-width="1.8" stroke-dasharray="2.4 1.4"`)}${band(hw, -4, 3.2, 2.4, 3.3, WF, 2)}
        ${studs.map(([x, y]) => `<path d="M${f(x - 1.7)} ${f(y - .6)}L${x} ${f(y + 3.6)}L${f(x + 1.7)} ${f(y - .6)}Z" fill="#E4E8EF" ${OUT(1)}/>`).join("")}${along(hw, -1, 3.3, Math.max(4, Math.round(hw / 4.4)), .7).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#C9D0DA"/>`).join("")}`; }},
    {id: "jester", name: "Jester Collar", rarity: "exotic", def: "#8E6BE0", icon: [-8, .9], art: hw => {
      const n = 7, pts = along(hw, -2, 3.2, n, .86), w = hw * .86 * 2 / (n - 1) * .62;
      return `${pts.map(([x, y], i) => { const tx = f(x * 1.12), ty = f(y + 11 - Math.abs(x / hw) * 2); return `<path d="M${f(x - w)} ${f(y - .5)}L${tx} ${ty}L${f(x + w)} ${f(y - .5)}Z" ${i % 2 ? `fill="#FFD35A"` : WF} ${OUT(1.6)}/><circle cx="${tx}" cy="${f(ty + 1.2)}" r="1.7" fill="${GOLD}" ${OUT(1)}/>`; }).join("")}${band(hw, -4, 3.2, -.6, 3.2, WF, 1.8)}`; }},
    {id: "fairylights", name: "Fairy Lights", rarity: "exotic", def: "#FFD35A", art: hw => {
      const pts = along(hw, -2, 6, Math.max(6, Math.round(hw / 4.2)), .9), cols = [null, null, null, null];
      return `<path d="${arcP(hw, -2, 6, 1)}" fill="none" stroke="#3E7A4A" stroke-width="1.5"/>${pts.map(([x, y], i) => { const c = cols[i % 4], fl = c ? `fill="${c}"` : WF, a = f(-x / hw * 25); return `<g transform="translate(${x} ${f(y + 1)}) rotate(${a})"><circle cy="3" r="4.4" ${fl} opacity=".3"/><rect x="-1.1" y="-.6" width="2.2" height="1.8" rx=".4" fill="#3E7A4A"/><ellipse cy="3.2" rx="1.9" ry="2.6" ${fl} ${OUT(1)}/><circle cx="-.6" cy="2.4" r=".6" fill="#fff"/></g>`; }).join("")}`; }},
    // Legendary
    {id: "pharaoh", name: "Pharaoh's Collar", rarity: "legendary", def: "#2F6FD6", icon: [-8, .9], art: hw => {
      const e = f(hw + 1), drops = along(hw, 8.4, 6, Math.max(7, Math.round(hw / 3)), .78);
      return `<path d="M${-e} -4.5Q0 2 ${e} -4.5L${f(e + 1.4)} 2Q${f(hw * .6)} 14.5 0 14.8Q${f(-hw * .6)} 14.5 ${f(-e - 1.4)} 2Z" fill="${GOLD}" ${OUT(2.2)}/>
        <path d="M${f(-hw)} -1.6Q0 7.4 ${f(hw)} -1.6" fill="none" ${WS("#2F6FD6")} stroke-width="2.8"/><path d="M${f(-hw)} 1.8Q0 13 ${f(hw)} 1.8" fill="none" stroke="#2FC9B5" stroke-width="2.4"/><path d="M${f(-hw)} -3.4Q0 4.6 ${f(hw)} -3.4M${f(-hw)} .1Q0 10.2 ${f(hw)} .1M${f(-hw)} 3.6Q0 15.6 ${f(hw)} 3.6" fill="none" stroke="${GOLD_D}" stroke-width=".8"/>
        ${drops.map(([x, y], i) => `<path d="M${x} ${f(y - 1.6)}Q${f(x - 2)} ${f(y + 1.6)} ${x} ${f(y + 3.4)}Q${f(x + 2)} ${f(y + 1.6)} ${x} ${f(y - 1.6)}Z" ${i % 2 ? `fill="#E5484D"` : WF} ${OUT(.9)}/>`).join("")}
        ${tw(f(-hw - 3), -7, 2.8, 0)}${tw(f(hw + 3), 6, 3, .9)}${tw(0, 19, 2.2, 1.7)}`; }},
    {id: "amulet", name: "Infinity Amulet", rarity: "legendary", def: "#F5C542", icon: [-9, .9], art: hw => {
      let rays = ""; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rays += `M${f(6.4 * Math.cos(a - .22))} ${f(13 + 6.4 * Math.sin(a - .22))}L${f(9.2 * Math.cos(a))} ${f(13 + 9.2 * Math.sin(a))}L${f(6.4 * Math.cos(a + .22))} ${f(13 + 6.4 * Math.sin(a + .22))}Z`; }
      return `${line2(arcP(hw, -2.5, 9.5, .9), 1.6, WS("#F5C542")).replace(`stroke-width="1.6"`, `stroke-width="1.6" stroke-dasharray="1.6 1"`)}<circle cx="0" cy="13" r="11" fill="#FFE58A" opacity=".35"/><path d="${rays}" ${WF} ${OUT(1)}/>
        <circle cx="0" cy="13" r="6.4" ${WF} ${OUT(1.8)}/><circle cx="0" cy="13" r="4.2" fill="#E5484D" ${OUT(1.2)}/><path d="M-2.4 12.8a2.4 2.4 0 0 1 2.4 -2.4" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><circle cx="1.4" cy="14.6" r=".7" fill="#fff" opacity=".7"/>
        ${tw(-10, 6, 2.8, 0)}${tw(10.5, 19, 2.6, 1)}${tw(f(hw * .7), -6, 2.2, 1.7)}`; }},
    {id: "phoenixstole", name: "Phoenix Feather Stole", rarity: "legendary", def: "#FF5A2B", icon: [-7, .85], art: hw => {
      // plumes fanned along the neck from the sides in, each a fire-red feather with a gold heart, then two long tail plumes
      const n = Math.max(6, Math.round(hw / 3.4)), pts = along(hw, -.5, 4.5, n, .9).map((p, i) => [p, i]).sort((a, b) => Math.abs(b[0][0]) - Math.abs(a[0][0]));
      const plume = ([x, y], len, wd) => `<g transform="translate(${x} ${y}) rotate(${f(180 - 62 * x / hw)})">${feather(len, wd, WF, 1.6)}${feather(len * .62, wd * .5, `fill="#FFD35A"`)}<path d="M0 -1V${f(-len * .78)}" stroke="#fff" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/></g>`;
      const tail = (x, l, a) => `<g transform="translate(${f(x)} ${ny(hw, -.5, 4.5, x)}) rotate(${a})">${feather(l, 4.6, WF, 1.6)}${feather(l * .68, 2.2, `fill="#FFD35A"`)}<path d="M0 -1V${f(-l * .82)}" stroke="#fff" stroke-opacity=".55" stroke-width=".9"/><circle cy="${f(-l * .86)}" r="1.5" fill="#FFF3B0"/></g>`;
      return `${tail(hw * .42, 24, 170)}${tail(hw * .42 + 3.4, 19, 152)}${band(hw, -4.5, 3.2, 1.5, 3.2, WF, 2)}${pts.map(([p]) => plume(p, 12, 5.4)).join("")}<path d="M${f(-hw + 2)} -2.2Q0 3.4 ${f(hw - 2)} -2.2" fill="none" stroke="#FFD35A" stroke-width="1.4" stroke-linecap="round"/>${tw(f(-hw - 2), -6, 2.8, 0)}${tw(f(hw * .42 + 11), 22, 2.8, 1)}${tw(f(-hw * .4), 15, 2.2, 1.7)}`; }},
    {id: "ermine", name: "Royal Ermine Collar", rarity: "legendary", def: "#FFF8F0", art: hw => {
      const spots = along(hw, 0, 3.6, Math.max(4, Math.round(hw / 5)), .78);
      return `${line2(`M${f(-hw * .62)} ${ny(hw, 2.6, 3.6, -hw * .62)}Q0 ${f(17 + hw * .05)} ${f(hw * .62)} ${ny(hw, 2.6, 3.6, hw * .62)}`, 2, GOLD).replace(`stroke="${GOLD}" stroke-width="2"`, `stroke="${GOLD}" stroke-width="2" stroke-dasharray="2.6 1.2"`)}${along(hw + 1, 4.4, 3.8, Math.max(7, Math.round(hw / 2.6)), .96).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" ${WF} ${OUT(1.8)}/>`).join("")}${band(hw + 1, -5, 3.3, 4.4, 3.8, WF, 2.2)}${along(hw + 1, 4.4, 3.8, Math.max(7, Math.round(hw / 2.6)), .96).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" ${WF}/>`).join("")}<path d="M${f(-hw + 2)} -1.6Q0 4 ${f(hw - 2)} -1.6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>
        ${spots.map(([x, y]) => `<path d="M${x} ${f(y - 1.8)}Q${f(x + 1.3)} ${f(y + .6)} ${x} ${f(y + 2.6)}Q${f(x - 1.3)} ${f(y + .6)} ${x} ${f(y - 1.8)}Z" fill="${INK}"/><circle cx="${f(x - 1.6)}" cy="${f(y - 1.4)}" r=".55" fill="${INK}"/><circle cx="${f(x + 1.6)}" cy="${f(y - 1.4)}" r=".55" fill="${INK}"/>`).join("")}
        <circle cx="0" cy="${f(13 + hw * .03)}" r="4.6" fill="${GOLD}" ${OUT(1.6)}/>${star(0, 13 + hw * .03, 2.6, "#FFF3B0")}${tw(f(-hw - 2), -6, 2.8, 0)}${tw(f(hw + 2.4), 7, 2.6, .9)}${tw(7.5, f(18 + hw * .03), 2.2, 1.7)}`; }},
    {id: "galaxyscarf", name: "Galaxy Scarf", rarity: "legendary", def: "#3B2A7A", icon: [-6, 1], art: hw => {
      const k = f(hw * .45 - 9.5), e = f(hw + 4), h = f(hw - 2), G = `fill="url(#cpgGalaxy)"`;
      const dots = along(hw, 0, 3.4, Math.max(5, Math.round(hw / 4)), .82);
      return `<defs><linearGradient id="cpgGalaxy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--cp-wear,#3B2A7A)"/><stop offset=".55" style="stop-color:color-mix(in srgb,var(--cp-wear,#3B2A7A) 55%,#7B3FC4)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--cp-wear,#3B2A7A) 35%,#D95FB0)"/></linearGradient></defs>
        <path d="M${-hw} -5Q0 2 ${hw} -5Q${e} 0 ${hw} 5.5Q0 12 ${-hw} 5.5Q${-e} 0 ${-hw} -5Z" ${G} ${OUT(2.4)}/><path d="M${-h} -1.5Q0 5 ${h} -1.5" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.2" stroke-linecap="round"/>
        ${dots.map(([x, y], i) => i % 2 ? star(x, y, 1.5, "#FFF3B0") : `<circle cx="${x}" cy="${y}" r=".8" fill="#fff"/>`).join("")}
        <g${k ? ` transform="translate(${k} 0)"` : ""}><path d="M6 4L9 21L18 19.5L13 3Z" ${G} ${OUT(2.4)}/><circle cx="12" cy="11" r=".8" fill="#fff"/>${star(13.6, 16.2, 1.5, "#FFF3B0")}<path d="M10 21.4l-.4 2.6M13.4 20.8l-.2 2.6M16.6 20.2l.2 2.6" stroke="#FFD35A" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="4" r="4.4" ${G} ${OUT(2.4)}/>${tw(20.5, 24, 2.6, 1)}</g>
        ${tw(f(-hw - 3), -6, 2.8, 0)}${tw(f(hw * .1), 12, 2, 1.7)}`; }}
  ];
  /* ---------------- Batch 2: 10 more each, 4 common, 4 uncommon, 2 exotic ---------------- */
  const heart = (x, y, sz, fill, sw) => `<path d="M${f(x)} ${f(y + sz * .9)}C${f(x - sz * 1.45)} ${f(y + sz * .05)} ${f(x - sz * 1.05)} ${f(y - sz * 1.05)} ${f(x)} ${f(y - sz * .38)}C${f(x + sz * 1.05)} ${f(y - sz * 1.05)} ${f(x + sz * 1.45)} ${f(y + sz * .05)} ${f(x)} ${f(y + sz * .9)}Z" ${fill}${sw ? ` ${OUT(sw)}` : ""}/>`;
  HEAD.push(
    // Common
    {id: "sunvisor", name: "Sun Visor", rarity: "common", def: "#4CB782", pat: true, art: () =>
      `<path d="M-15 -2.5Q0 .5 15 -2.5V3Q0 6 -15 3Z" ${WF} ${OUT(2.2)}/><path d="M-13 .2Q0 3 13 .2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M-15 1.5Q2 6 15 1Q22 1.6 25 4.6Q22 9 11 8.6Q-2 8 -15 5.5Z" ${WF} ${OUT(2.4)}/><path d="M-13 5Q2 8.6 14 4.6Q20 4.8 23 5.8Q20 8 11 7.7Q-2 7.2 -13 5Z" fill="${INK}" opacity=".15"/>`},
    {id: "hairbow", name: "Big Bow", rarity: "common", def: "#FF7A9C", pat: true, art: () =>
      `<path d="M-1 -3Q-8 -15 -16 -11Q-19.5 -5 -14.5 -.5Q-7 1.6 -1 -3Z" ${WF} ${OUT(2.2)}/><path d="M1 -3Q8 -15 16 -11Q19.5 -5 14.5 -.5Q7 1.6 1 -3Z" ${WF} ${OUT(2.2)}/>
      <path d="M-13.5 -8Q-9 -10 -5 -5M13.5 -8Q9 -10 5 -5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/><rect x="-3.6" y="-6.6" width="7.2" height="7.2" rx="2.6" ${WF} ${OUT(2.2)}/><rect x="-1.6" y="-5" width="1.8" height="3" rx=".9" fill="#fff" opacity=".55"/>`},
    {id: "flatcap", name: "Flat Cap", rarity: "common", def: "#8B6A4F", pat: true, art: () =>
      `<path d="M-16 1.5Q-17.5 -9 -6 -12.5Q8 -14.5 16 -7.5Q20 -3.5 18 1Q0 4 -16 1.5Z" ${WF} ${OUT(2.4)}/><path d="M-10 -8.6Q-2 -11.4 6 -11" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/><path d="M-14 -2Q0 -6 16 -3" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="1.3"/>
      <path d="M-9 1Q3 4.8 17 .6Q20.5 2.6 18.6 5Q3 8.6 -9 5Z" ${WF} ${OUT(2.2)}/><path d="M-9 3.4Q3 7 18.4 3.2L18.6 5Q3 8.6 -9 5Z" fill="${INK}" opacity=".15"/><circle cx="2" cy="-13" r="1.8" ${WF} ${OUT(1.4)}/>`},
    {id: "hardhat", name: "Hard Hat", rarity: "common", def: "#FFC93C", art: () =>
      `<path d="M-14 1C-14.5 -12 -7.5 -17.5 0 -17.5S14.5 -12 14 1Z" ${WF} ${OUT(2.4)}/><path d="M-3 -17V0H3V-17" fill="${INK}" opacity=".12"/><path d="M-3 -17.2V0M3 -17.2V0" stroke="${INK}" stroke-width="1.3" stroke-opacity=".4"/><path d="M-9 -12Q-11 -7 -11 -2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-18.5 .6H18.5Q19 5 14.5 5H-14.5Q-19 5 -18.5 .6Z" ${WF} ${OUT(2.2)}/><path d="M-17 3.2H17" stroke="${INK}" stroke-opacity=".15" stroke-width="2"/>`},
    // Uncommon
    {id: "strawhat", name: "Straw Sun Hat", rarity: "uncommon", def: "#E9C46A", art: () =>
      `<path d="M-11 -2Q-12 -15 0 -15.5Q12 -15 11 -2Z" ${WF} ${OUT(2.4)}/><path d="M-8 -11.6h16M-9.5 -8h19" stroke="#C9A24A" stroke-width="1" stroke-linecap="round"/><path d="M-11.2 -6.4Q0 -4.4 11.2 -6.4V-2.6Q0 -.6 -11.2 -2.6Z" fill="#FF7A9C" ${OUT(1.4)}/>
      <path d="M-23.5 1Q-23.5 -4 -11 -3.4Q0 -1.6 11 -3.4Q23.5 -4 23.5 1Q23.5 6.4 0 6.4Q-23.5 6.4 -23.5 1Z" ${WF} ${OUT(2.4)}/><path d="M-19 1.6Q0 4.6 19 1.6M-15 -1.4Q-8 1 -4 1.4M15 -1.4Q8 1 4 1.4" fill="none" stroke="#C9A24A" stroke-width="1" stroke-linecap="round"/>${flower(8.5, -4.6, 3.4, `fill="#FFF8F0"`, "#FFB347")}`},
    {id: "fez", name: "Tasseled Fez", rarity: "uncommon", def: "#C0283C", icon: [11, .95], art: () =>
      `<path d="M-10 2L-8 -15Q0 -17.4 8 -15L10 2Q0 4.6 -10 2Z" ${WF} ${OUT(2.4)}/><ellipse cx="0" cy="-15" rx="8" ry="2" fill="${INK}" opacity=".25"/><path d="M-5.6 -12L-6.8 0" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>
      ${line2("M0 -16.4Q8 -16 9.4 -12.6L9.8 -5.6", 1.2, GOLD)}<path d="M8.4 -6L11.2 -6L12.4 1.6L7.2 1.6Z" fill="${GOLD}" ${OUT(1.1)}/><path d="M8.6 -2v3M10.2 -2v3" stroke="${GOLD_D}" stroke-width=".8"/><circle cx="0" cy="-16.6" r="1.4" fill="${GOLD}" ${OUT(1)}/>`},
    {id: "bunnyears", name: "Bunny Ears", rarity: "uncommon", def: "#FFF8F0", icon: [12, .85], art: () => {
      const ear = sc => `<g transform="scale(${sc} 1) rotate(-8)"><path d="M-9 1Q-15.5 -16 -10 -27Q-4.6 -25 -4 -13Q-3.8 -5 -3.6 1Z" ${WF} ${OUT(2.2)}/><path d="M-8.2 -3.6Q-12.4 -16 -9.4 -23Q-6.6 -20.4 -6.2 -11Q-6 -6 -5.8 -3.6Z" fill="#FFB3C7"/></g>`;
      return `${ear(1)}${ear(-1)}${line2("M-16.5 4Q0 -5 16.5 4", 2.6, "#FF7A9C")}`; }},
    {id: "sailorcap", name: "Sailor Cap", rarity: "uncommon", def: "#FFFFFF", art: () =>
      `<path d="M-12.5 0Q-13.5 -12 0 -13Q13.5 -12 12.5 0Z" ${WF} ${OUT(2.4)}/><path d="M-7 -9.6Q-8.6 -5 -8.6 -1" fill="none" stroke="${INK}" stroke-opacity=".12" stroke-width="2" stroke-linecap="round"/><path d="M0 -13V-1" stroke="${INK}" stroke-opacity=".12" stroke-width="1.2"/>
      <path d="M-15.5 -1.6Q0 1.6 15.5 -1.6V4Q0 7.2 -15.5 4Z" ${WF} ${OUT(2.2)}/><path d="M-15 1.2Q0 4.4 15 1.2" fill="none" stroke="#2F4A8A" stroke-width="1.8" stroke-linecap="round"/>
      <g transform="translate(0 -6)" fill="none" stroke="#2F4A8A" stroke-width="1.2" stroke-linecap="round"><circle cy="-2.4" r="1"/><path d="M0 -1.4V2.6M-1.6 -.2H1.6M-2.4 1Q-2 2.8 0 2.8Q2 2.8 2.4 1"/></g>`},
    // Epic
    {id: "jesterhat", name: "Jester Hat", rarity: "exotic", def: "#8E6BE0", icon: [12, .78], art: () => {
      const bell = (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${GOLD}" ${OUT(1.2)}/><path d="M${x - 1.2} ${y + .6}h2.4" stroke="${GOLD_D}" stroke-width=".9"/>`;
      return `<path d="M-14 -1Q-21 -9 -24.5 -20Q-16 -17 -8 -12Q-6 -6 -6 -1Z" ${WF} ${OUT(2.2)}/><path d="M14 -1Q21 -9 24.5 -20Q16 -17 8 -12Q6 -6 6 -1Z" ${WF} ${OUT(2.2)}/><path d="M-7.5 -1Q-6 -14 0 -26.5Q6 -14 7.5 -1Z" fill="#FFD35A" ${OUT(2.2)}/>
        <path d="M-18 -12Q-13 -9 -10 -5M18 -12Q13 -9 10 -5M-2 -18Q-3 -10 -3 -3" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>${bell(-24.5, -20)}${bell(0, -26.5)}${bell(24.5, -20)}
        <path d="M-15.5 -2.6Q0 .6 15.5 -2.6V3.6Q0 6.8 -15.5 3.6Z" ${WF} ${OUT(2.2)}/>${[-10, -3.4, 3.4, 10].map((x, i) => `<path d="M${x} ${f(-1 + Math.abs(x) * -.04)}l2 2.4l-2 2.4l-2 -2.4Z" fill="${i % 2 ? "#FFD35A" : "#fff"}" ${OUT(.8)}/>`).join("")}`; }},
    {id: "tiara", name: "Crystal Tiara", rarity: "exotic", def: "#9AD8FF", art: () => {
      const yA = x => f(2 - 2.5 * (1 - (x / 15) * (x / 15)));
      const gem = (x, h, w, fill) => `<path d="M${x} ${yA(x)}L${f(x + w)} ${f(yA(x) - h * .45)}L${x} ${f(yA(x) - h)}L${f(x - w)} ${f(yA(x) - h * .45)}Z" ${fill} ${OUT(1.2)}/><path d="M${f(x - w * .45)} ${f(yA(x) - h * .45)}L${x} ${f(yA(x) - h * .9)}" stroke="#fff" stroke-opacity=".8" stroke-width=".9" stroke-linecap="round"/>`;
      return `${[[-11, 6, 2.2], [-5.6, 9.5, 2.6], [5.6, 9.5, 2.6], [11, 6, 2.2]].map(([x, h, w]) => gem(x, h, w, WF)).join("")}${gem(0, 14, 3.4, WF)}<circle cx="0" cy="${f(yA(0) - 6)}" r="1.8" fill="#FF7AC8" ${OUT(.9)}/>
        ${line2("M-16 3Q0 -3 16 3", 2.2, WS("#9AD8FF"))}${[-13, -8, -2.8, 2.8, 8, 13].map(x => `<circle cx="${x}" cy="${f(+yA(x) + .4)}" r=".9" fill="#fff"/>`).join("")}${star(-16, -6, 1.6, "#fff")}${star(15, -10, 1.4, "#fff")}`; }}
  );
  // The Christmas gift (98-companion.js): never sold, only found in the present that pops up from Dec 25
  HEAD.push({id: "santahat", name: "Santa Hat", rarity: "legendary", def: "#D7263D", gift: true, icon: [11, .82], art: () => {
    // fluff: overlapping puffs drawn twice (an ink outline, then white), so they read as one soft roll
    const puffs = pts => `${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="3.6"/>`).join("")}${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFDF8"/>`).join("")}${pts.map(([x, y, r]) => `<circle cx="${f(x - r * .3)}" cy="${f(y - r * .35)}" r="${f(r * .32)}" fill="#fff"/>`).join("")}`;
    // a few big puffs, wide apart, so the cotton rolls in long soft arches
    const band = [[-15, 1, 4], [-10, .4, 4.2], [-5, 0, 4.3], [0, -.1, 4.3], [5, 0, 4.3], [10, .4, 4.2], [15, 1, 4]];
    return `<path d="M-13.5 -1.5Q-15 -17 -2 -23.5Q10 -28.5 19.5 -19.5Q24.5 -14 23.8 -6L16.8 -6.6Q16.6 -12.6 12.2 -13.4Q14.8 -8 13.8 -1.5Z" ${WF} ${OUT(2.4)}/>
      <path d="M-8.4 -12.6Q-6.4 -19.6 1 -21.6" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="2" stroke-linecap="round"/>
      ${puffs(band)}${puffs([[20.2, -4.6, 3.6], [23.2, -2.6, 3.2], [19.4, -1.2, 3], [22.2, .4, 2.6]])}
      ${tw(-18, -16, 2.8, 0)}${tw(6, -31, 2.4, .9)}${tw(27, -14, 2.2, 1.6)}`; }});
  FACE.push(
    // Common
    {id: "ovalglasses", name: "Oval Glasses", rarity: "common", def: "#8B6A4F", art: g =>
      `${bridge(g, 2.2, 1.4, WS("#8B6A4F"))}${temples(g, 1.4, WS("#8B6A4F"))}${pair(g, R => `<ellipse rx="${f(R * 1.04)}" ry="${f(R * .76)}" fill="#fff" fill-opacity=".16" stroke="${INK}" stroke-width="3.4"/><ellipse rx="${f(R * 1.04)}" ry="${f(R * .76)}" fill="none" ${WS("#8B6A4F")} stroke-width="1.6"/>${shine(R * .8)}`)}`},
    {id: "sportshades", name: "Sport Shades", rarity: "common", def: "#3A3450", art: g => {
      const R = g.R, y = g.y, m = g.mx, e = Math.min(2, g.ext), L = f(g.lx - R * 1.05 - e), Rr = f(g.rx + R * 1.05 + e);
      const d = `M${L} ${f(y - R * .6)}Q${m} ${f(y - R * .85)} ${Rr} ${f(y - R * .6)}Q${f(Rr + 1.2)} ${f(y)} ${f(Rr - 1)} ${f(y + R * .55)}Q${g.rx} ${f(y + R * .95)} ${f(m + R * .35)} ${f(y + R * .45)}Q${m} ${f(y + R * .15)} ${f(m - R * .35)} ${f(y + R * .45)}Q${g.lx} ${f(y + R * .95)} ${f(+L + 1)} ${f(y + R * .55)}Q${f(L - 1.2)} ${f(y)} ${L} ${f(y - R * .6)}Z`;
      return `<path d="${d}" ${WF} ${OUT(2.2)}/>${line2(`M${L} ${f(y - R * .6)}Q${m} ${f(y - R * .85)} ${Rr} ${f(y - R * .6)}`, 2, "#E5484D")}<path d="M${f(g.lx - R * .5)} ${f(y - R * .2)}l${f(R * .7)} 0M${f(g.rx - R * .5)} ${f(y - R * .2)}l${f(R * .7)} 0" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>`; }},
    {id: "labgoggles", name: "Lab Goggles", rarity: "common", def: "#7FB8D9", art: g => {
      const R = g.R, e = Math.min(2.5, g.ext), x0 = g.lx - R * 1.05 - e * .4, x1 = g.rx + R * 1.05 + e * .4, d = rr(x0, g.y - R * .85, x1 - x0, R * 1.7, R * .7);
      return `${line2(`M${f(x0 - e)} ${g.y}H${f(x0)}M${f(x1)} ${g.y}H${f(x1 + e)}`, 2, "#3A3450")}<path d="${d}" fill="#DFF4FF" fill-opacity=".4" stroke="${INK}" stroke-width="5"/><path d="${d}" fill="none" ${WS("#7FB8D9")} stroke-width="3"/>${[-.5, 0, .5].map(t => `<circle cx="${f(g.mx + t * (g.gap * .45))}" cy="${f(g.y - R * .85)}" r=".8" fill="${INK}" opacity=".5"/>`).join("")}<path d="M${f(x0 + R * .4)} ${f(g.y - R * .35)}l${f(R * .6)} -${f(R * .2)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>`; }},
    {id: "roundshades", name: "Round Shades", rarity: "common", def: "#3A9A6A", art: g =>
      `${bridge(g, 2.4, 1.2, "#C9A227")}${temples(g, 1.2, "#C9A227")}${pair(g, R => `<circle r="${f(R * .88)}" ${WF} fill-opacity=".85" stroke="${INK}" stroke-width="3"/><circle r="${f(R * .88)}" fill="none" stroke="#E0B03A" stroke-width="1.3"/>${shine(R * .8)}`)}`},
    // Uncommon
    {id: "browline", name: "Browline Glasses", rarity: "uncommon", def: "#3A3450", art: g => {
      const hw = Math.min(g.R * 1.05, g.gap / 2 - .7), hh = g.R * .8, lens = rr(-hw, -hh, hw * 2, hh * 2, g.R * .5);
      return `${bridge(g, 1, 1.2, "#B9C0CC")}${temples(g, 1.8, WS("#3A3450"))}${[g.lx, g.rx].map(x => `<g transform="translate(${x} ${g.y})"><path d="${lens}" fill="#fff" fill-opacity=".16" stroke="${INK}" stroke-width="3"/><path d="${lens}" fill="none" stroke="#C9D0DA" stroke-width="1.2"/>${line2(`M${f(-hw)} ${f(-hh * .1)}Q${f(-hw)} ${f(-hh)} 0 ${f(-hh)}Q${f(hw)} ${f(-hh)} ${f(hw)} ${f(-hh * .1)}`, 3.2, WS("#3A3450"))}</g>`).join("")}`; }},
    {id: "flowerglasses", name: "Flower Glasses", rarity: "uncommon", def: "#FF7A9C", art: g =>
      `${bridge(g, 2, 1.6, "#4CB782")}${pair(g, R => { let p = ""; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p += `<circle cx="${f(R * 1.02 * Math.cos(a))}" cy="${f(R * 1.02 * Math.sin(a))}" r="${f(R * .34)}" ${WF} ${OUT(1.1)}/>`; } return `${p}<circle r="${f(R * .9)}" fill="#FFF8F0" fill-opacity=".35" stroke="${INK}" stroke-width="2"/>${shine(R * .8)}`; })}`},
    {id: "skigoggles", name: "Ski Goggles", rarity: "uncommon", def: "#FF9A3C", art: g => {
      const R = g.R, e = Math.min(5, g.ext), x0 = g.lx - R * 1.15, x1 = g.rx + R * 1.15, d = rr(x0, g.y - R * .95, x1 - x0, R * 1.9, R * .85);
      return `${line2(`M${f(x0 - e)} ${f(g.y - R * .2)}H${f(x1 + e)}`, 2.6, "#5A95FF")}<path d="${d}" fill="#3A3450" ${OUT(2.2)}/><path d="${rr(x0 + 1.6, g.y - R * .95 + 1.6, x1 - x0 - 3.2, R * 1.9 - 3.2, R * .7)}" ${WF} fill-opacity=".9"/><ellipse cx="${f(g.mx + R * .4)}" cy="${f(g.y + R * .2)}" rx="${f(R * 1.2)}" ry="${f(R * .45)}" fill="#C77BFF" opacity=".35"/>
        <path d="M${f(x0 + 3)} ${f(g.y - R * .35)}Q${g.mx} ${f(g.y - R * .8)} ${f(x1 - R)} ${f(g.y - R * .55)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/>`; }},
    {id: "shuttershades", name: "Shutter Shades", rarity: "uncommon", def: "#FF4F8B", art: g => {
      const hw = Math.min(g.R * 1.1, g.gap / 2 - .6), hh = g.R * .78, lens = rr(-hw, -hh, hw * 2, hh * 2, g.R * .4), n = Math.max(3, Math.round(hh * 2 / 2.6));
      let sl = ""; for (let i = 1; i < n; i++) { const y = -hh + i * (hh * 2 / n); sl += `M${f(-hw)} ${f(y)}H${f(hw)}`; }
      return `${bridge(g, 1.6, 2, WS("#FF4F8B"))}${temples(g, 1.8, WS("#FF4F8B"))}${[g.lx, g.rx].map(x => `<g transform="translate(${x} ${g.y})"><path d="${lens}" fill="#fff" fill-opacity=".1" stroke="${INK}" stroke-width="4.4"/><path d="${sl}" ${WS("#FF4F8B")} stroke-width="1.5"/><path d="${lens}" fill="none" ${WS("#FF4F8B")} stroke-width="2.4"/></g>`).join("")}`; }},
    // Epic
    {id: "xray", name: "X-Ray Specs", rarity: "exotic", def: "#E5484D", art: g => {
      const spiral = R => { let p = "", n = 40; for (let i = 0; i <= n; i++) { const t = i / n, a = t * Math.PI * 5, r = R * .82 * t; p += (i ? "L" : "M") + f(r * Math.cos(a)) + " " + f(r * Math.sin(a)); } return p; };
      return `${bridge(g, 2.4, 1.8, WS("#E5484D"))}${temples(g, 1.6, WS("#E5484D"))}${pair(g, R => `<circle r="${f(R)}" fill="#FFF8F0" stroke="${INK}" stroke-width="5"/><path d="${spiral(R)}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><circle r="${f(R)}" fill="none" ${WS("#E5484D")} stroke-width="3"/>`)}`; }},
    {id: "butterflyglasses", name: "Butterfly Glasses", rarity: "exotic", def: "#8E6BE0", art: g =>
      `${pair(g, R => `<ellipse cx="${f(R * .35)}" cy="${f(R * .62)}" rx="${f(R * .55)}" ry="${f(R * .42)}" transform="rotate(28 ${f(R * .35)} ${f(R * .62)})" ${WF} fill-opacity=".85" ${OUT(1.6)}/><ellipse cx="${f(R * .12)}" cy="${f(-R * .2)}" rx="${f(R * 1.08)}" ry="${f(R * .82)}" transform="rotate(-14 ${f(R * .12)} ${f(-R * .2)})" ${WF} fill-opacity=".85" ${OUT(1.8)}/><circle cx="${f(R * .75)}" cy="${f(-R * .55)}" r="${f(R * .18)}" fill="#fff" opacity=".9"/><circle cx="${f(R * .45)}" cy="${f(-R * .82)}" r="${f(R * .1)}" fill="#fff" opacity=".8"/><circle cx="${f(R * .55)}" cy="${f(R * .7)}" r="${f(R * .12)}" fill="#FFD35A"/><ellipse rx="${f(R * .62)}" ry="${f(R * .55)}" fill="#fff" fill-opacity=".25" stroke="#FFD35A" stroke-width="1"/>`)}
      <ellipse cx="${g.mx}" cy="${f(g.y + 1)}" rx="1.3" ry="${f(Math.min(4, g.R * .5))}" fill="${INK}"/>${line2(`M${f(g.mx - .4)} ${f(g.y - 2)}q-1.4 -3 -3.2 -3.6M${f(g.mx + .4)} ${f(g.y - 2)}q1.4 -3 3.2 -3.6`, .7, INK)}`}
  );
  NECK.push(
    // Common
    {id: "bib", name: "Baby Bib", rarity: "common", def: "#FFFFFF", pat: true, icon: [-8, .9], art: hw => {
      const a = f(Math.min(hw * .55, 11)), ya = ny(hw, -1.5, 3.4, a);
      return `${line2(arcP(hw, -2.5, 3.4, .9), .9, "#FF7A9C")}<path d="M${-a} ${ya}Q0 ${f(+ya + 5)} ${a} ${ya}Q${f(+a + 2.4)} ${f(+ya + 10)} 0 ${f(+ya + 14.5)}Q${f(-a - 2.4)} ${f(+ya + 10)} ${-a} ${ya}Z" ${WF} ${OUT(2)}/><path d="M${f(-a + 2)} ${f(+ya + 2.6)}Q${f(-a)} ${f(+ya + 9.4)} 0 ${f(+ya + 12)}Q${f(+a)} ${f(+ya + 9.4)} ${f(+a - 2)} ${f(+ya + 2.6)}" fill="none" stroke="#FF7A9C" stroke-width="1.1" stroke-dasharray="1.4 1.6" stroke-linecap="round"/>${heart(0, +ya + 7.4, 2.2, `fill="#FF7A9C"`)}`; }},
    {id: "whistle", name: "Coach's Whistle", rarity: "common", def: "#E5484D", icon: [-9, .9], art: hw => {
      const a = f(Math.min(hw * .55, 13));
      return `${line2(`M${-a} ${ny(hw, -3, 3.4, -a)}L-1.6 9M${a} ${ny(hw, -3, 3.4, a)}L1.6 9`, 1.6, WS("#E5484D"))}<circle cx="0" cy="9.4" r="1.4" fill="none" stroke="${INK}" stroke-width="1.2"/>
        <path d="M-6 10.6H3Q6.4 10.6 6.4 14Q6.4 17.4 3 17.4Q.2 17.4 -.4 14.6H-6Z" fill="#DDE2EA" ${OUT(1.5)}/><circle cx="2.8" cy="14" r="1.3" fill="${INK}" opacity=".6"/><path d="M-4.6 12h3" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`; }},
    {id: "choker", name: "Ribbon Choker", rarity: "common", def: "#8E6BE0", art: hw =>
      `${band(hw, -2.4, 3.2, 1.4, 3.2, WF, 1.8)}<circle cx="0" cy="${f(1.4 + 3.2 + .8)}" r="1" fill="${GOLD}" ${OUT(.8)}/>${heart(0, 1.4 + 3.2 + 4.4, 2.6, `fill="${GOLD}"`, 1.2)}<path d="M-1.4 7.6q.6 -.8 1.4 -.6" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round"/>`},
    {id: "knitcollar", name: "Turtleneck Collar", rarity: "common", def: "#4CB782", pat: true, art: hw => {
      const ribs = along(hw, -.4, 3.3, Math.max(6, Math.round(hw / 2.4)), .86);
      return `${band(hw, -6, 3.2, 4.8, 3.4, WF, 2.4)}${ribs.map(([x, y]) => `<path d="M${x} ${f(y - 3.6)}V${f(y + 3.8)}" stroke="${INK}" stroke-opacity=".18" stroke-width="1.3" stroke-linecap="round"/>`).join("")}<path d="M${f(-hw + 2)} -3.4Q0 2.6 ${f(hw - 2)} -3.4" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round"/>`; }},
    // Uncommon
    {id: "daisychain", name: "Daisy Chain", rarity: "uncommon", def: "#FFFFFF", art: hw => {
      const pts = along(hw, -1.5, 5.5, Math.max(5, Math.round(hw / 5)), .86);
      return `<path d="${arcP(hw, -1.5, 5.5, .95)}" fill="none" stroke="#4CB782" stroke-width="1.6"/>${pts.map(([x, y], i) => `<ellipse cx="${f(x + 2.6)}" cy="${f(y + 2)}" rx="2" ry="1" transform="rotate(30 ${f(x + 2.6)} ${f(y + 2)})" fill="#7ED19B" ${OUT(.8)}/>${flower(x, y, 3.6, WF, i % 2 ? "#FFB347" : "#FFD35A")}`).join("")}`; }},
    {id: "shells", name: "Seashell Necklace", rarity: "uncommon", def: "#F7B7A3", art: hw => {
      const pts = along(hw, -2, 6.5, Math.max(5, Math.round(hw / 4.4)), .84);
      // a scallop shell hanging from its hinge: the fan opens downward
      const shell = (x, y, s, fill) => `<path d="M${f(x)} ${f(y - s * 1.1)}L${f(x - s)} ${f(y + s * .3)}Q${f(x)} ${f(y + s * 1.5)} ${f(x + s)} ${f(y + s * .3)}Z" ${fill} ${OUT(1.1)}/><path d="M${f(x)} ${f(y - s)}V${f(y + s * .85)}M${f(x)} ${f(y - s)}L${f(x - s * .55)} ${f(y + s * .6)}M${f(x)} ${f(y - s)}L${f(x + s * .55)} ${f(y + s * .6)}" stroke="#fff" stroke-opacity=".75" stroke-width=".8"/><rect x="${f(x - s * .35)}" y="${f(y - s * 1.3)}" width="${f(s * .7)}" height="${f(s * .45)}" rx=".4" ${fill} ${OUT(.8)}/>`;
      return `<path d="${arcP(hw, -2, 6.5, .95)}" fill="none" stroke="#8B6A4F" stroke-width="1.2"/>${pts.map(([x, y], i) => Math.abs(x) < .5 ? "" : i % 2 ? `<circle cx="${x}" cy="${y}" r="1.4" fill="#FFF8F0" ${OUT(.8)}/>` : shell(x, y + 2, 2.4, WF)).join("")}${shell(0, 4.5 + 4.6, 3.8, WF)}`; }},
    {id: "cravat", name: "Frilly Cravat", rarity: "uncommon", def: "#FFF8F0", icon: [-9, .95], art: () =>
      `<path d="M-6.5 7Q0 11 6.5 7L5.6 15Q2.4 18.4 0 16.4Q-2.4 18.4 -5.6 15Z" ${WF} ${OUT(1.8)}/><path d="M-3 9.4Q-2 13 -3.2 15.4M3 9.4Q2 13 3.2 15.4M0 10V16" fill="none" stroke="#C9C3D6" stroke-width=".9" stroke-linecap="round"/>
      <path d="M-5.4 .6Q0 3.6 5.4 .6L7.4 8.4Q3.2 11.6 0 9.8Q-3.2 11.6 -7.4 8.4Z" ${WF} ${OUT(1.8)}/><path d="M-3.2 3.6Q-3.4 6.6 -5 8.4M3.2 3.6Q3.4 6.6 5 8.4" fill="none" stroke="#C9C3D6" stroke-width=".9" stroke-linecap="round"/><circle cx="0" cy="4.4" r="1.8" fill="#FF7AC8" ${OUT(1)}/><circle cx="-.5" cy="3.9" r=".5" fill="#fff"/>`},
    {id: "locket", name: "Heart Locket", rarity: "uncommon", def: "#F5C542", art: hw =>
      `${line2(arcP(hw, -2.5, 8, .9), 1.2, WS("#F5C542")).replace(`stroke-width="1.2"`, `stroke-width="1.2" stroke-dasharray="1.4 .9"`)}<circle cx="0" cy="6.6" r="1.2" fill="none" stroke="${INK}" stroke-width="1.1"/>${heart(0, 10.6, 4, WF, 1.6)}<path d="M-1.6 9.4q-.4 1.6 .6 2.8" fill="none" stroke="${GOLD_D}" stroke-width=".9" stroke-linecap="round"/><path d="M-2.4 8.4q.8 -1.2 2 -1" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`},
    // Epic
    {id: "bubbles", name: "Bubble Necklace", rarity: "exotic", def: "#9AD8FF", art: hw => {
      const pts = along(hw, -2, 6.5, Math.max(6, Math.round(hw / 3.6)), .88), sz = [2.2, 3, 2.4, 3.4];
      return `<path d="${arcP(hw, -2, 6.5, .95)}" fill="none" stroke="#B9C0CC" stroke-width=".9"/>${pts.map(([x, y], i) => { const r = Math.abs(x) < .5 ? 4.4 : sz[i % 4]; return `<circle cx="${x}" cy="${f(y + (Math.abs(x) < .5 ? 2 : 0))}" r="${r}" ${WF} fill-opacity=".3" stroke="${INK}" stroke-width="1"/><path d="M${f(x - r * .6)} ${f(y + r * .3)}a${f(r * .7)} ${f(r * .7)} 0 0 0 ${f(r * 1.1)} ${f(r * .3)}" fill="none" stroke="#FF9AD5" stroke-width=".9"/><path d="M${f(x - r * .45)} ${f(y - r * .45 + (Math.abs(x) < .5 ? 2 : 0))}q${f(r * .3)} ${f(-r * .3)} ${f(r * .7)} ${f(-r * .2)}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`; }).join("")}`; }},
    {id: "frostcollar", name: "Ice Crystal Collar", rarity: "exotic", def: "#9AD8FF", art: hw => {
      const ic = along(hw, 2.2, 3.3, Math.max(6, Math.round(hw / 3)), .86);
      let flake = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; flake += `M0 12L${f(5 * Math.cos(a))} ${f(12 + 5 * Math.sin(a))}`; }
      return `${ic.map(([x, y], i) => { const h = Math.abs(x) < 2 ? 0 : 2.6 + (i % 2) * 2.2; return h ? `<path d="M${f(x - 1.6)} ${f(y - .6)}L${x} ${f(y + h)}L${f(x + 1.6)} ${f(y - .6)}Z" fill="#A8DCF5" ${OUT(1.1)}/>` : ""; }).join("")}${band(hw, -3.6, 3.2, 2.2, 3.3, WF, 2)}<path d="M${f(-hw + 3)} -1Q0 4.6 ${f(hw - 3)} -1" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="3 2" stroke-linecap="round"/>
        <path d="${flake}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="${flake}" stroke="#F2FBFF" stroke-width="1.5" stroke-linecap="round"/><circle cy="12" r="1.5" ${WF} ${OUT(.8)}/>${star(7, 9, 1.4, "#fff")}`; }}
  );
  /* ---------------- Chest: 20 (10 common, 5 rare, 3 exotic, 2 legendary) ----------------
     art() around (0,0); at "pin" sits on the Star Badge's spot to one side, at "mid" in the middle like the Medal */
  const sticker = (r, fill) => { let p = ""; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, q = i % 2 ? r * .9 : r; p += (i ? "L" : "M") + f(q * Math.cos(a)) + " " + f(q * Math.sin(a)); } return `<path d="${p}Z" ${fill} ${OUT(1.5)}/>`; };
  const txt = (t, x, y, sz, fill) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${fill}">${t}</text>`;
  const CHEST = [
    // Common
    {id: "heartpin", name: "Heart Pin", rarity: "common", at: "pin", def: "#FF5C8A", art: () => `${heart(0, 0, 6.6, WF, 1.8)}<path d="M-4.4 -3.4q1.2 -1.8 3 -1.4" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`},
    {id: "smiley", name: "Smiley Button", rarity: "common", at: "pin", def: "#FFD35A", art: () => `<circle r="7" ${WF} ${OUT(1.8)}/><circle cx="-2.4" cy="-1.8" r="1" fill="${INK}"/><circle cx="2.4" cy="-1.8" r="1" fill="${INK}"/><path d="M-3.6 1.4Q0 5 3.6 1.4" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><path d="M-4.6 -3.6a6 6 0 0 1 3 -2" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/>`},
    {id: "pencilpin", name: "Pencil Pin", rarity: "common", at: "pin", def: "#FFC93C", art: () => `<g transform="rotate(-40)"><path d="M-8 -2.6H5V2.6H-8Z" ${WF} ${OUT(1.5)}/><path d="M-8 -.9H5" stroke="#fff" stroke-opacity=".5" stroke-width="1"/><path d="M5 -2.6L10 0L5 2.6Z" fill="#F3D9A8" ${OUT(1.4)}/><path d="M8.6 -.7L10 0L8.6 .7Z" fill="${INK}"/><path d="M-10 -2.6H-8V2.6H-10Z" fill="#C9D0DA" ${OUT(1.2)}/><path d="M-13 -2.6H-10V2.6H-13Q-14 2.6 -14 1.6V-1.6Q-14 -2.6 -13 -2.6Z" fill="#FF9AB3" ${OUT(1.4)}/></g>`},
    {id: "hellotag", name: "Hello Name Tag", rarity: "common", at: "pin", def: "#E5484D", art: () => `<rect x="-9" y="-6.5" width="18" height="13" rx="2.2" fill="#fff" ${OUT(1.6)}/><path d="M-9 -4.3Q-9 -6.5 -6.8 -6.5H6.8Q9 -6.5 9 -4.3V-1.6H-9Z" ${WF}/>${txt("HELLO", 0, -2.6, 3.4, "#fff")}<path d="M-5.6 3.2q1.4 -2 2.6 0t2.6 0t2.6 0t2.6 0" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>`},
    {id: "daisypin", name: "Daisy Pin", rarity: "common", at: "pin", def: "#FFFFFF", art: () => flower(0, 0, 7.4, WF, "#FFC93C")},
    {id: "pocket", name: "Pencil Pocket", rarity: "common", at: "pin", def: "#5A95FF", pat: true, art: () => `<path d="M-4 -4L-5.6 -13L-3 -13.4L-1.6 -4Z" fill="#FFC93C" ${OUT(1.2)}/><path d="M-5.6 -13L-4.4 -16L-3 -13.4Z" fill="#F3D9A8" ${OUT(1)}/><rect x="1.4" y="-12" width="2.6" height="9" rx="1.2" fill="#3A3450" ${OUT(1)}/><path d="M-8 -5H8V3.6Q8 8 3.6 8H-3.6Q-8 8 -8 3.6Z" ${WF} ${OUT(1.6)}/><path d="M-8 -2.4H8" stroke="${INK}" stroke-opacity=".25" stroke-width="1.2"/><path d="M-6.4 -.6H6.4" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-dasharray="1.2 1.2"/>`},
    {id: "aplus", name: "A+ Sticker", rarity: "common", at: "pin", def: "#FF5C8A", art: () => `${sticker(7.6, WF)}<circle r="5.4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".8" stroke-dasharray="1.4 1.2"/>${txt("A+", 0, 2.6, 7, "#fff")}`},
    {id: "applepin", name: "Apple Pin", rarity: "common", at: "pin", def: "#E5484D", art: () => `<path d="M0 -3.4Q-4 -7 -7 -3.4Q-9.2 1 -6 5.6Q-3 8.8 0 7.2Q3 8.8 6 5.6Q9.2 1 7 -3.4Q4 -7 0 -3.4Z" ${WF} ${OUT(1.6)}/><path d="M0 -3.6Q.4 -6.6 1.6 -8" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/><path d="M1.2 -6.4Q4.4 -9.2 6.4 -6.8Q3.8 -4.6 1.2 -6.4Z" fill="#4CB782" ${OUT(1)}/><path d="M-5 -1.6q.4 -2 2.2 -2.4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/>`},
    {id: "pawpatch", name: "Paw Print Patch", rarity: "common", at: "pin", def: "#8B6A4F", art: () => `<circle r="7.8" ${WF} ${OUT(1.6)}/><circle r="6.4" fill="none" stroke="#FFF1DC" stroke-width=".8" stroke-dasharray="1.3 1.1"/><ellipse cx="0" cy="1.8" rx="2.6" ry="2.2" fill="#FFF1DC"/><circle cx="-2.8" cy="-1.6" r="1.1" fill="#FFF1DC"/><circle cx="-1" cy="-3.4" r="1.1" fill="#FFF1DC"/><circle cx="1" cy="-3.4" r="1.1" fill="#FFF1DC"/><circle cx="2.8" cy="-1.6" r="1.1" fill="#FFF1DC"/>`},
    {id: "rainbowpatch", name: "Rainbow Patch", rarity: "common", at: "pin", def: "#FFF8F0", art: () => `<rect x="-9" y="-7" width="18" height="13" rx="4" ${WF} ${OUT(1.6)}/><rect x="-7.6" y="-5.6" width="15.2" height="10.2" rx="3" fill="none" stroke="#8E6BE0" stroke-width=".9" stroke-dasharray="1.3 1.1"/>${[["#E5484D", 5.6], ["#FFC93C", 4.2], ["#4CB782", 2.8], ["#5A95FF", 1.5]].map(([c, r]) => `<path d="M${-r} 2.6A${r} ${r} 0 0 1 ${r} 2.6" fill="none" stroke="${c}" stroke-width="1.4"/>`).join("")}<circle cx="-5.2" cy="3" r="1.4" fill="#fff" ${OUT(.6)}/><circle cx="5.2" cy="3" r="1.4" fill="#fff" ${OUT(.6)}/>`},
    // Rare
    {id: "rosette", name: "Prize Rosette", rarity: "rare", at: "pin", def: "#2563EB", art: () => { let p = ""; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p += `<circle cx="${f(5.4 * Math.cos(a))}" cy="${f(5.4 * Math.sin(a))}" r="2.6" ${WF} ${OUT(1)}/>`; }
      return `<path d="M-2 3L-6.4 14L-3.4 12.6L-1.6 15L.6 4Z" ${WF} ${OUT(1.3)}/><path d="M2 3L6.4 14L3.4 12.6L1.6 15L-.6 4Z" ${WF} ${OUT(1.3)}/>${p}<circle r="4.4" fill="${GOLD}" ${OUT(1.3)}/>${txt("1", 0, 2.2, 6, INK)}`; }},
    {id: "sheriff", name: "Sheriff Star", rarity: "rare", at: "pin", def: "#F5C542", art: () => { let p = "", tips = ""; for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6, q = i % 2 ? 4.4 : 8; p += (i ? "L" : "M") + f(q * Math.cos(a)) + " " + f(q * Math.sin(a)); if (!(i % 2)) tips += `<circle cx="${f(8.6 * Math.cos(a))}" cy="${f(8.6 * Math.sin(a))}" r="1.3" ${WF} ${OUT(.9)}/>`; }
      return `${tips}<path d="${p}Z" ${WF} ${OUT(1.6)}/><circle r="3.2" fill="none" stroke="${GOLD_D}" stroke-width="1"/><circle r="1" fill="${GOLD_D}"/><path d="M-2.6 -4.6L-.8 -6.4" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`; }},
    {id: "pocketwatch", name: "Pocket Watch", rarity: "rare", at: "pin", def: "#F5C542", art: () => `${line2("M-8 -8Q-8 1 -1 1.6", 1, WS("#F5C542")).replace(`stroke-width="1"`, `stroke-width="1" stroke-dasharray="1.2 .8"`)}<circle cx="-8" cy="-8" r="1.3" ${WF} ${OUT(.8)}/><rect x="1.2" y="-4.2" width="2.6" height="2.4" rx=".6" ${WF} ${OUT(1)}/><circle cx="2.5" cy="4.4" r="6.4" ${WF} ${OUT(1.6)}/><circle cx="2.5" cy="4.4" r="4.8" fill="#FFF8F0" ${OUT(.9)}/><path d="M2.5 4.4V1.4M2.5 4.4L4.6 5.6" stroke="${INK}" stroke-width="1" stroke-linecap="round"/><circle cx="2.5" cy="4.4" r=".6" fill="${INK}"/>`},
    {id: "boltpin", name: "Lightning Pin", rarity: "rare", at: "pin", def: "#FFC93C", art: () => `<path d="M2.4 -9.4L-6.4 1.2H-1L-3.4 9.6L6.4 -2H1Z" ${WF} ${OUT(1.8)}/><path d="M1 -6L-3.4 -.6" stroke="#fff" stroke-opacity=".8" stroke-width="1.2" stroke-linecap="round"/>`},
    {id: "cameo", name: "Cameo Brooch", rarity: "rare", at: "mid", def: "#F2B5C4", art: () => `<ellipse rx="7.6" ry="9.4" fill="${GOLD}" ${OUT(1.6)}/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<circle cx="${f(7.6 * Math.cos(a))}" cy="${f(9.4 * Math.sin(a))}" r=".9" fill="#FFF8F0"/>`; }).join("")}<ellipse rx="5.6" ry="7.4" ${WF} ${OUT(1)}/><path d="M1.4 -5Q-2.6 -5 -2.6 -1.4L-4 .4L-2.6 1.2Q-2.8 3 -1.2 3.4L-.8 5.6H3Q2.6 2.6 3.4 .6Q4.2 -4.6 1.4 -5Z" fill="#FFF8F0"/>`},
    // Epic
    {id: "rune", name: "Glowing Rune", rarity: "exotic", at: "mid", def: "#7CF5FF", art: () => `<circle r="10.4" ${WF} opacity=".28"/><circle r="7.6" fill="#2A1F5C" ${OUT(1.6)}/><circle r="6" fill="none" ${WS("#7CF5FF")} stroke-width="1.1"/><path d="M0 -4.6L4 2.4H-4ZM0 4.6L-4 -2.4H4Z" fill="none" ${WS("#7CF5FF")} stroke-width="1" stroke-linejoin="round"/><circle r="1.2" ${WF}/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3 + Math.PI / 6; return `<path d="M${f(6.9 * Math.cos(a))} ${f(6.9 * Math.sin(a))}l${f(.01 + Math.cos(a))} ${f(Math.sin(a))}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`; }).join("")}`},
    {id: "mechcore", name: "Power Core", rarity: "exotic", at: "mid", def: "#4FD6FF", art: () => { let h = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; h += (i ? "L" : "M") + f(8.6 * Math.cos(a)) + " " + f(8.6 * Math.sin(a)); }
      return `<path d="${h}Z" fill="#8E96A6" ${OUT(1.6)}/>${[0, 2, 4].map(i => { const a = i * Math.PI / 3 + Math.PI / 6; return `<circle cx="${f(6.8 * Math.cos(a))}" cy="${f(6.8 * Math.sin(a))}" r=".9" fill="#DDE2EA" ${OUT(.6)}/>`; }).join("")}<circle r="6.6" ${WF} opacity=".35"/><circle r="4.6" ${WF} ${OUT(1.2)}/><circle r="2.8" fill="none" stroke="#fff" stroke-width=".9"/><circle r="1.1" fill="#fff"/>`; }},
    {id: "butterflybrooch", name: "Jeweled Butterfly", rarity: "exotic", at: "pin", def: "#8E6BE0", art: () => `${[[-1, 1], [1, 1]].map(([sx]) => `<g transform="scale(${sx} 1)"><ellipse cx="4.6" cy="-3" rx="4.8" ry="3.8" transform="rotate(-25 4.6 -3)" ${WF} ${OUT(1.3)}/><ellipse cx="3.6" cy="3.4" rx="3.2" ry="2.6" transform="rotate(30 3.6 3.4)" ${WF} ${OUT(1.3)}/><circle cx="5.4" cy="-3.6" r="1.2" fill="#7CF5FF" ${OUT(.6)}/><circle cx="3.6" cy="3.6" r=".9" fill="#FF9AD5"/></g>`).join("")}<ellipse rx="1.3" ry="5" fill="${GOLD}" ${OUT(1)}/>${line2("M-.4 -4.6q-1 -2.4 -2.8 -3M.4 -4.6q1 -2.4 2.8 -3", .6, GOLD)}`},
    // Legendary
    {id: "wingedheart", name: "Winged Heart Crest", rarity: "legendary", at: "mid", def: "#E5484D", art: () => `${[-1, 1].map(sx => `<g transform="scale(${sx} 1)">${[[-58, 9], [-82, 10.5], [-106, 9]].map(([a, l]) => `<g transform="translate(4 -1) rotate(${-a})">${feather(l, 2.6, `fill="#FFF8F0"`, 1.2)}</g>`).join("")}</g>`).join("")}${heart(0, 0, 6.4, `fill="${GOLD}"`, 1.6)}${heart(0, .3, 4.6, WF)}<path d="M-2.8 -2.4q.8 -1.4 2.2 -1.2" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>${tw(-12, -8, 2.6, 0)}${tw(12, 6, 2.4, 1)}`},
    {id: "starorder", name: "Order of the Stars", rarity: "legendary", at: "mid", def: "#DDE2EA", art: () => { let p = ""; for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, q = i % 2 ? 5.6 : (i % 4 ? 8.6 : 10.4); p += (i ? "L" : "M") + f(q * Math.cos(a)) + " " + f(q * Math.sin(a)); }
      return `<path d="M-3 6L-6 15L-3 13.4L-1.4 15.6L.4 7ZM3 6L6 15L3 13.4L1.4 15.6L-.4 7Z" fill="#E5484D" ${OUT(1.2)}/><path d="${p}Z" ${WF} ${OUT(1.5)}/><path d="${p}Z" fill="#fff" opacity=".25"/><circle r="5.4" ${WF} ${OUT(1.3)}/><circle r="3.9" fill="#2563EB" ${OUT(.9)}/>${star(0, 0, 2.6, GOLD)}${tw(-11, -9, 2.8, 0)}${tw(11, -4, 2.4, 1.1)}`; }}
  ];
  CHEST.forEach(a => { a.slot = "chest"; });
  /* ---------------- Holiday gifts for 2027 (98-companion.js GIFTS): never sold, each found in its holiday's present ---------------- */
  const shamrock = (x, y, sz, fill) => `<g transform="translate(${x} ${y})">${[0, 120, 240].map(a => `<g transform="rotate(${a})">${heart(0, -sz * 1.1, sz, fill, .9)}</g>`).join("")}<path d="M0 .6L${f(sz * .6)} ${f(sz * 2)}" stroke="#2F7A44" stroke-width="1.1" stroke-linecap="round"/></g>`;
  HEAD.push(
    // New Year's Day: a black party cone with gold Happy New Year, a 2027 band, a gold fringe and a tinsel burst on top
    {id: "newyearhat", name: "New Year's Hat", rarity: "legendary", def: "#1E1B26", gift: true, icon: [16, .64], art: () => {
      const CONE = "M-14 3L0 -37L14 3Q0 6 -14 3Z";
      // the words in a gold hand-lettered script, slanted up like the party hats, kept inside the cone (clipped to it)
      const script = (t, x, y, sz) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Kalam,Caveat,'Gochi Hand',cursive" font-weight="700" font-size="${sz}" fill="#FFD24A" stroke="#7A5200" stroke-width=".45" paint-order="stroke">${t}</text>`;
      const words = `<g clip-path="url(#cpaNyCone)" transform="rotate(-8 0 -12)">${script("Happy", 0, -15.6, 4.8)}${script("New Year", .4, -9.4, 4.3)}<path d="M-5.6 -7.6Q.4 -6.2 6.4 -7.8" fill="none" stroke="#FFD24A" stroke-width=".6" stroke-linecap="round"/></g>`;
      const TOPPER = "burst";
      const tops = {
        // tinsel burst: gold and silver strands around a gold bead
        burst: () => { let a = "", b = ""; for (let i = 0; i < 18; i++) { const r = i * Math.PI / 9 + .1, l = i % 2 ? 5.6 : 7.4, d = `M0 -38L${f(l * Math.cos(r))} ${f(-38 + l * Math.sin(r))}`; a += `<path d="${d}" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`; b += `<path d="${d}" stroke="${i % 3 ? GOLD : "#E4E8EF"}" stroke-width="1.4" stroke-linecap="round"/>`; } return `${a}${b}<circle cy="-38" r="2.6" fill="${GOLD}" ${OUT(1.2)}/><circle cx="-.8" cy="-38.8" r=".8" fill="#fff"/>`; },
        // a gold star on the tip
        star: () => `${star(0, -41, 6.4, GOLD, 1.8)}<path d="M-1.6 -43.4l1 -2" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`,
        // a fluffy pom-pom of gold and silver puffs
        pom: () => { const pts = [[0, -41, 3.2], [-3, -39, 2.6], [3, -39, 2.6], [-2.2, -43.2, 2.4], [2.2, -43.2, 2.4], [0, -37.6, 2.4]];
          return `${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="2.6"/>`).join("")}${pts.map(([x, y, r], k) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k % 2 ? "#E4E8EF" : GOLD}"/>`).join("")}<circle cx="-1" cy="-42" r=".8" fill="#fff"/>`; },
        // a little disco ball
        disco: () => `<circle cy="-41.6" r="5" fill="#C9D0DA" ${OUT(1.6)}/><path d="M-5 -41.6H5M-4.4 -44H4.4M-4.4 -39.2H4.4M0 -46.6V-36.6M-2.8 -46Q-4 -41.6 -2.8 -37.2M2.8 -46Q4 -41.6 2.8 -37.2" stroke="#8E96A6" stroke-width=".6" fill="none"/><path d="M-3 -44.4h2v1.6h-2Z" fill="#fff"/><path d="M1.2 -40.6h1.8v1.6h-1.8Z" fill="#FFF3B0"/><path d="M0 -46.6V-48" stroke="${INK}" stroke-width="1.2"/>`,
        // curly gold and silver streamers spilling from the tip
        // corkscrew ribbons hanging down one side of the tip
        cascade: () => { const c = (d, col) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>`;
          return `${c("M0 -37.6Q4 -39 5 -36Q5.6 -33.6 3.6 -34Q2 -34.6 4 -32.4Q6 -30.4 7.4 -31.6", GOLD)}${c("M0 -37.6Q-4 -39.4 -5.2 -36.4Q-5.8 -34 -3.8 -34.4Q-2.2 -35 -4.2 -32.6Q-6.2 -30.6 -7.6 -31.8", "#E4E8EF")}${c("M0 -37.6Q1.6 -41.6 -.4 -43.2Q-2.4 -44.4 -2.6 -42.4", GOLD)}<circle cy="-37.6" r="2" fill="${GOLD}" ${OUT(1.1)}/>`; },
        // springy coils standing up from the tip
        springs: () => { const coil = (a, col) => { let d = "M0 -37"; for (let k = 0; k < 4; k++) d += `q${k % 2 ? -2.2 : 2.2} -1.1 0 -2.2`; return `<g transform="rotate(${a} 0 -37)"><path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><circle cy="-46" r="1.2" fill="${col}" ${OUT(.8)}/></g>`; };
          return `${coil(-38, "#E4E8EF")}${coil(38, "#E4E8EF")}${coil(-12, GOLD)}${coil(14, GOLD)}<circle cy="-37" r="2" fill="${GOLD}" ${OUT(1.1)}/>`; },
        // a fountain of thin streamers arcing out and down both sides, each ending in a little curl
        fountain: () => { const st = (s, h, col) => { const d = `M0 -38Q${f(s * 4)} ${f(-44 - h)} ${f(s * 8)} -38.6q${f(s * 1.4)} 2 0 3q${f(-s * 1.2)} .4 ${f(-s * .8)} -1`; return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.1" stroke-linecap="round"/>`; };
          return `${st(-1, 2, GOLD)}${st(1, 2, GOLD)}${st(-.7, 5, "#E4E8EF")}${st(.7, 5, "#E4E8EF")}${st(-.3, 7, GOLD)}${st(.3, 7, "#E4E8EF")}<circle cy="-38" r="2" fill="${GOLD}" ${OUT(1.1)}/>`; },
        // ribbon loops gathered into a rosette, gold and silver
        loops: () => { const lp = (a, col) => `<g transform="rotate(${a} 0 -39)"><path d="M0 -39C-2.6 -42 -2 -46.4 0 -46.4C2 -46.4 2.6 -42 0 -39Z" fill="${col}" ${OUT(1.2)}/></g>`;
          return `${[-80, -40, 0, 40, 80].map((a, k) => lp(a, k % 2 ? "#E4E8EF" : GOLD)).join("")}<circle cy="-39" r="2" fill="${GOLD}" ${OUT(1.1)}/>`; },
        streamers: () => { const c = (d, col) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>`;
          return `${c("M0 -37Q-4 -42 -7 -38Q-9 -35 -6 -34Q-3 -34 -5 -37", GOLD)}${c("M0 -37Q4 -43 7.6 -39.4Q9.6 -36.4 6.6 -35.4Q3.6 -35 5.4 -38", "#E4E8EF")}${c("M0 -37Q-1 -43 2 -45Q5 -46 4.6 -43Q4 -41 2 -42.6", GOLD)}<circle cy="-37.4" r="2" fill="${GOLD}" ${OUT(1.1)}/>`; }
      };
      return `<clipPath id="cpaNyCone"><path d="${CONE}"/></clipPath><path d="${CONE}" ${WF} ${OUT(2.4)}/><g clip-path="url(#cpaNyCone)"><path d="M-2.6 -31Q-6.4 -20 -10.6 -3L-7.4 -3Q-4.6 -19 -1.4 -30.6Z" fill="#fff" opacity=".13"/><path d="M-2.2 -29.6Q-3.6 -26 -4.8 -21.8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/></g>
        ${words}${star(-1.4, -27.4, 1, GOLD)}${star(1.8, -31, .8, "#E4E8EF")}${star(3.4, -23.6, .8, GOLD)}<circle cx="3.6" cy="-19.8" r=".5" fill="#E4E8EF"/>
        <path d="M-12.6 -4.4Q0 -2.2 12.6 -4.4L14 3Q0 6 -14 3Z" fill="${GOLD}" ${OUT(1.6)}/><path d="M-12.4 -3.2Q0 -1 12.4 -3.2" fill="none" stroke="#FFF3B0" stroke-width=".7"/>${txt("2027", 0, 2.6, 5, INK)}
        ${tops[TOPPER]()}${tw(-16, -24, 2.6, 0)}${tw(15, -36, 2.4, .9)}`; }},
    // Valentine's Day: two springy hearts on a headband
    {id: "heartboppers", name: "Heart Boppers", rarity: "legendary", def: "#FF4F8B", gift: true, icon: [12, .85], art: () => {
      const spring = `M-6 -9.6Q-9.4 -11 -7.2 -13Q-5 -14.8 -8.6 -16.2Q-11.4 -17.6 -10.6 -19.8`;
      const side = `${line2(spring, 1.1, "#C9D0DA")}${heart(-10.6, -24.4, 5.2, WF, 1.8)}<path d="M-14 -27.2q1 -1.8 2.8 -1.8" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`;
      return `${side}<g transform="scale(-1 1)">${side}</g>${line2("M-17 3Q-15 -9.4 0 -10.2Q15 -9.4 17 3", 3, WS("#FF4F8B"))}${tw(-18, -30, 2.6, 0)}${tw(18, -21, 2.4, .9)}`; }},
    // St. Patrick's Day: a green hat that flares at the top, with a gold buckle and a shamrock
    {id: "leprechaun", name: "Leprechaun Hat", rarity: "legendary", def: "#2E9E5B", gift: true, icon: [12, .85], art: () =>
      `<path d="M-10 -1L-12.6 -23Q0 -25.6 12.6 -23L10 -1Z" ${WF} ${OUT(2.4)}/><ellipse cx="0" cy="-23" rx="12.6" ry="2.6" ${WF} ${OUT(2)}/><ellipse cx="0" cy="-23" rx="12.6" ry="2.6" fill="#fff" opacity=".14"/>
      <path d="M-7.6 -19.6V-12" stroke="#fff" stroke-opacity=".28" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-11 -10.4Q0 -8.4 11 -10.4L10.6 -4Q0 -2 -10.6 -4Z" fill="${INK}"/><rect x="-3.6" y="-10.6" width="7.2" height="6.8" rx="1.2" fill="none" stroke="${GOLD}" stroke-width="1.9"/><path d="M0 -9.6V-4.8" stroke="${GOLD}" stroke-width="1.3"/>
      ${shamrock(7.6, -13.6, 2.2, `fill="#7ED19B"`)}
      <path d="M-18.5 1Q-18.5 -3.2 -11 -2.2Q0 0 11 -2.2Q18.5 -3.2 18.5 1Q18.5 5 0 5Q-18.5 5 -18.5 1Z" ${WF} ${OUT(2.4)}/><path d="M-16 1.6Q0 4 16 1.6" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="1.4"/>
      ${tw(-18, -20, 2.6, 0)}${tw(17, -29, 2.4, 1)}`},
    // Independence Day: Uncle Sam's tall striped hat, with a band of stars
    {id: "unclesam", name: "Uncle Sam Hat", rarity: "legendary", def: "#FFFFFF", gift: true, icon: [13, .78], art: () => {
      const crown = "M-10 -1L-11.2 -29Q0 -31.4 11.2 -29L10 -1Z";
      const stripes = [-7.6, -2.6, 2.6, 7.6].map(x => `<path d="M${f(x - 1.3)} -1L${f(x * 1.12 - 1.3)} -30L${f(x * 1.12 + 1.3)} -30L${f(x + 1.3)} -1Z" fill="#E5484D"/>`).join("");
      return `<clipPath id="cpaSam"><path d="${crown}"/></clipPath><path d="${crown}" ${WF}/><g clip-path="url(#cpaSam)">${stripes}</g><path d="${crown}" fill="none" ${OUT(2.4)}/>
        <ellipse cx="0" cy="-29" rx="11.2" ry="2.6" ${WF} ${OUT(2)}/><path d="M-7.4 -25V-15" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
        <path d="M-10.8 -11Q0 -9 10.8 -11L10.4 -3.6Q0 -1.6 -10.4 -3.6Z" fill="#2F4A9E" ${OUT(1.6)}/>${[-6.6, -2.2, 2.2, 6.6].map(x => star(x, -6.8 + Math.abs(x) * .05, 1.5, "#fff")).join("")}
        <path d="M-18.5 1Q-18.5 -3.2 -11 -2.2Q0 0 11 -2.2Q18.5 -3.2 18.5 1Q18.5 5 0 5Q-18.5 5 -18.5 1Z" fill="#2F4A9E" ${OUT(2.4)}/><path d="M-16 1.4Q0 3.8 16 1.4" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.3" stroke-linecap="round"/>
        ${tw(-19, -22, 2.8, 0)}${tw(18, -33, 2.4, .9)}${tw(20, -10, 2, 1.6)}`; }},
    // Christmas: reindeer antlers on a headband, with jingle bells
    {id: "antlers", name: "Reindeer Antlers", rarity: "legendary", def: "#C08A5B", gift: true, icon: [13, .78], art: () => {
      const side = `${line2("M-7 -8Q-10.4 -15 -12 -21Q-13.6 -26.6 -11.6 -32", 3.2, WS("#C08A5B"))}${line2("M-11.2 -18.4Q-16 -20 -18.6 -25.6", 2.6, WS("#C08A5B"))}${line2("M-12.6 -25.4Q-9.2 -27.6 -8 -31.6", 2.4, WS("#C08A5B"))}${line2("M-13.6 -26Q-17 -28 -17.6 -32", 2.2, WS("#C08A5B"))}`;
      const bell = x => `<g transform="translate(${x} -6.8)"><path d="M-2.8 2.2Q-3 -2.8 0 -3Q3 -2.8 2.8 2.2Z" fill="${GOLD}" ${OUT(1.3)}/><circle cy="2.4" r=".9" fill="${INK}"/><path d="M-1.4 -1q.6 -.9 1.4 -1" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round"/></g>`;
      return `${side}<g transform="scale(-1 1)">${side}</g>${line2("M-17 3Q-15 -9 0 -9.8Q15 -9 17 3", 3, "#7A4E2D")}${bell(-7.4)}${bell(7.4)}${tw(-21, -14, 2.8, 0)}${tw(21, -30, 2.4, .9)}${tw(0, -20, 2, 1.6)}`; }}
  );
  FACE.push(
  );
  NECK.push(
    // Halloween: a bow tie that's a little bat
    {id: "batbowtie", name: "Bat Bow Tie", rarity: "legendary", def: "#3A2A5C", gift: true, icon: [-4, 1.15], art: () => {
      const wing = `<path d="M-2.6 0Q-8 -8 -16 -6.4Q-15 -2.4 -17 1.6Q-13.6 .4 -12.4 4Q-9.6 1.6 -7.6 5.4Q-5 2 -2.6 3Z" ${WF} ${OUT(2)}/><path d="M-4.4 0Q-9 -4.4 -14 -4.2" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.2" stroke-linecap="round"/>`;
      return `<g transform="translate(0 3)">${wing}<g transform="scale(-1 1)">${wing}</g><path d="M-2.8 -2L-2.2 -6L-.6 -2.8ZM2.8 -2L2.2 -6L.6 -2.8Z" ${WF} ${OUT(1.3)}/><ellipse cx="0" cy="1" rx="3.8" ry="4.4" ${WF} ${OUT(2)}/>
        <circle cx="-1.4" cy=".2" r=".95" fill="#FFD35A"/><circle cx="1.4" cy=".2" r=".95" fill="#FFD35A"/><path d="M-1 2.6l.45 1.2l.45 -1.2M.1 2.6l.45 1.2l.45 -1.2" fill="#fff"/>${tw(-19, -6, 2.4, 0)}${tw(19, 6, 2.2, 1)}</g>`; }},
    // Thanksgiving: a garland of autumn leaves and acorns
    {id: "leafgarland", name: "Harvest Garland", rarity: "legendary", def: "#E8742A", gift: true, art: hw => {
      const pts = along(hw, -1.5, 6, Math.max(6, Math.round(hw / 3.6)), .9);
      const leaf = ([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${f(-x / hw * 35)})"><path d="M0 -1C-3.4 1 -4 5.6 0 9.4C4 5.6 3.4 1 0 -1Z" ${WF} ${OUT(1.3)}/>${i % 3 === 1 ? `<path d="M0 -1C-3.4 1 -4 5.6 0 9.4C4 5.6 3.4 1 0 -1Z" fill="#fff" opacity=".28"/>` : i % 3 === 2 ? `<path d="M0 -1C-3.4 1 -4 5.6 0 9.4C4 5.6 3.4 1 0 -1Z" fill="${INK}" opacity=".18"/>` : ""}<path d="M0 0V8M0 3.4L-1.6 2M0 5.4L1.6 4" stroke="${INK}" stroke-opacity=".35" stroke-width=".8" stroke-linecap="round"/></g>`;
      const acorn = ([x, y]) => `<g transform="translate(${x} ${f(+y + 1.4)})"><ellipse cy="2.2" rx="1.9" ry="2.3" fill="#C9935A" ${OUT(1)}/><path d="M-2.3 1Q0 -1.6 2.3 1Z" fill="#7A4E2D" ${OUT(1)}/></g>`;
      const mids = pts.slice(1).map((p, i) => [f((+p[0] + +pts[i][0]) / 2), f((+p[1] + +pts[i][1]) / 2)]).filter((p, i) => i % 2 === 0);
      return `<path d="${arcP(hw, -1.5, 6, .95)}" fill="none" stroke="#7A4E2D" stroke-width="1.3"/>${pts.map(leaf).join("")}${mids.map(acorn).join("")}${tw(f(-hw - 2), -5, 2.4, 0)}${tw(f(hw + 2), 6, 2.2, 1)}`; }}
  );
  CHEST.push(
    // Easter: a chick peeking out of its egg
    {id: "chickpin", name: "Hatching Chick Pin", rarity: "legendary", at: "pin", def: "#C9B6F2", gift: true, slot: "chest", art: () =>
      `<g transform="scale(1.25)"><circle cx="0" cy="-3.4" r="5" fill="#FFD35A" ${OUT(1.5)}/><circle cx="-1.8" cy="-4" r=".85" fill="${INK}"/><circle cx="1.8" cy="-4" r=".85" fill="${INK}"/><path d="M-1 -2.4L0 -1L1 -2.4Z" fill="#F28C28"/><circle cx="-3" cy="-2.4" r=".8" fill="#FF9AB3"/><circle cx="3" cy="-2.4" r=".8" fill="#FF9AB3"/>
      <path d="M-7 0L-4.6 -2.4L-2.4 0L0 -2.4L2.4 0L4.6 -2.4L7 0Q7.6 9 0 10Q-7.6 9 -7 0Z" ${WF} ${OUT(1.6)}/><circle cx="-3.4" cy="4" r="1" fill="#fff" opacity=".75"/><circle cx="2.6" cy="6.4" r="1.2" fill="#fff" opacity=".75"/><circle cx="3.6" cy="2.4" r=".7" fill="#fff" opacity=".75"/>
      <path d="M-4.4 -7.2L-3 -10L-1.4 -7.8L0 -10.6L1.6 -7.8L3 -10L4.4 -7.2Q0 -5.6 -4.4 -7.2Z" ${WF} ${OUT(1.2)}/>${tw(-8.6, -8, 2.2, 0)}${tw(8.4, 4, 2, 1)}</g>`}
  );
  /* ---------------- Animated ones: something on them moves (98-companion.css, .cpa-*), and holds still with reduced motion ----------------
     A moving part sits in a <g> of its own with no transform attribute (a CSS animation would replace it) */
  const A = (k, inner, st) => `<g class="cpa cpa-${k}"${st ? ` style="${st}"` : ""}>${inner}</g>`;
  const puffs2 = (pts, fill) => `${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="3.6"/>`).join("")}${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${fill}/>`).join("")}`;
  HEAD.push(
    // Rare: two glowing balls on springs that wobble
    {id: "antennae", name: "Bopper Antennae", rarity: "rare", def: "#9BE15D", anim: true, icon: [12, .85], art: () => {
      const side = (k, d) => A("wobble", `${line2("M-6 -9.6Q-9.4 -11 -7.2 -13Q-5 -14.8 -8.6 -16.2Q-11.4 -17.6 -10.6 -19.8", 1.1, "#C9D0DA")}<circle cx="-10.6" cy="-23.6" r="5.4" ${WF} opacity=".3"/><circle cx="-10.6" cy="-23.6" r="3.6" ${WF} ${OUT(1.6)}/><circle cx="-11.8" cy="-24.8" r="1.1" fill="#fff"/>`, `animation-delay:${d}s`);
      return `${side(0, 0)}<g transform="scale(-1 1)">${side(0, -.8)}</g>${line2("M-17 3Q-15 -9.4 0 -10.2Q15 -9.4 17 3", 3, "#3A3450")}`; }},
    // Epic: a little storm cloud overhead, raining, with now and then a flash of lightning
    {id: "stormcloud", name: "Storm Cloud", rarity: "exotic", def: "#9AA3B5", anim: true, icon: [11, .9], art: () => {
      const drops = [[-8, 0], [-2.6, .35], [3, .7], [8.4, .2], [0, .9]].map(([x, d]) => A("drop", `<path d="M${x} -11.4q-1.3 2 0 3q1.3 -1 0 -3Z" fill="#5A95FF"/>`, `animation-delay:${d}s`)).join("");
      return `${drops}${A("bob", `${A("flash", `<path d="M1 -14L-3.4 -6.6H0L-2 0L4 -8.6H.6L2.4 -14Z" fill="#FFD35A" ${OUT(1)}/>`)}${puffs2([[-9, -16, 5], [-2, -21, 6.6], [6, -19.6, 5.6], [11, -15, 4.2], [0, -14, 6]], WF)}<path d="M-13 -13Q0 -9.4 14 -13" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/><circle cx="-4" cy="-23" r="1.8" fill="#fff" opacity=".55"/>`)}`; }},
    // Epic: a gold crown with a flame flickering on each point
    {id: "flamecrown", name: "Flame Crown", rarity: "exotic", def: "#F5C542", anim: true, icon: [12, .85], art: () => {
      const flame = (x, y, s, d) => `<g transform="translate(${x} ${y}) scale(${s})">${A("flicker", `<path d="M0 0C-3.4 -1 -3.6 -5 -1.2 -8.4C-1 -6 .4 -5.4 .6 -7.4C2.8 -5.4 3.6 -1.4 0 0Z" fill="#FF7A2F" ${OUT(1)}/><path d="M0 -.6C-1.6 -1.2 -1.6 -3.2 -.4 -4.8C.2 -3.6 1.6 -3 1.4 -2C1.4 -1.2 .8 -.6 0 -.6Z" fill="#FFE07A"/>`, `animation-delay:${d}s`)}</g>`;
      return `${flame(-16, -10.6, 1, 0)}${flame(0, -13.6, 1.2, -.6)}${flame(16, -10.6, 1, -1.1)}<path d="M-14 3L-16 -10L-8 -4L0 -13L8 -4L16 -10L14 3Z" ${WF} ${OUT(2.4)}/><rect x="-14.5" y="-1" width="29" height="6.6" rx="3" fill="${GOLD_D}" ${OUT(2)}/>${[-7, 0, 7].map((x, i) => `<circle cx="${x}" cy="2.3" r="1.5" fill="${["#E5484D", "#5A95FF", "#4CB782"][i]}"/>`).join("")}<path d="M-9 -2.4L-11.6 -7.4" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>`; }},
    // Legendary: three tiny planets circling the head on a glowing ring
    {id: "orbithalo", name: "Orbit Halo", rarity: "legendary", def: "#9AD8FF", anim: true, icon: [12, .9], art: () => {
      const T = [9, 7, 11.5], P = [["#5A95FF", 2.4, 0], ["#FF9A3C", 2.8, 1], ["#E5484D", 1.8, 0]];
      // an orbit: a sideways swing and an up-and-down swing a quarter-turn apart make a flat circle
      const planet = (k) => { const [c, r, ring] = P[k], h = T[k] / 2, d0 = -T[k] * k / 3;
        return A("orbx", A("orby", `<circle cx="0" cy="-16" r="${r}" fill="${c}" ${OUT(1)}/>${ring ? `<ellipse cx="0" cy="-16" rx="${r * 1.8}" ry="${r * .55}" fill="none" stroke="#FFE07A" stroke-width=".9"/>` : ""}<circle cx="${-r * .35}" cy="${-16 - r * .35}" r="${r * .3}" fill="#fff" opacity=".7"/>`, `--ry:4.6px;animation-duration:${h}s;animation-delay:${d0 - h / 2}s`), `--rx:16.5px;animation-duration:${h}s;animation-delay:${d0}s`); };
      return `${aura(0, -16, 22, 9, "#9AD8FF")}<ellipse cx="0" cy="-16" rx="16.5" ry="4.6" fill="none" ${WS("#9AD8FF")} stroke-opacity=".35" stroke-width="4"/><ellipse cx="0" cy="-16" rx="16.5" ry="4.6" fill="none" ${WS("#9AD8FF")} stroke-width="1.2"/>${[0, 1, 2].map(planet).join("")}${tw(-19, -24, 2.8, 0)}${tw(19, -9, 2.4, .9)}${tw(4, -27, 2, 1.7)}`; }}
  );
  FACE.push(
    // Epic: heart lenses that beat
    {id: "hearteyes", name: "Heart-Eyes Specs", rarity: "exotic", def: "#FF4F8B", anim: true, art: g => {
      const s = g.R * 1.05, h = `M0 ${f(s * .9)}C${f(-s * 1.45)} ${f(s * .05)} ${f(-s * 1.05)} ${f(-s * 1.05)} 0 ${f(-s * .38)}C${f(s * 1.05)} ${f(-s * 1.05)} ${f(s * 1.45)} ${f(s * .05)} 0 ${f(s * .9)}Z`;
      return `${bridge(g, 2.6, 1.8)}${temples(g)}${[[g.lx, 0], [g.rx, -.15]].map(([x, d]) => `<g transform="translate(${x} ${g.y})">${A("beat", `<path d="${h}" ${WF} fill-opacity=".92" ${OUT(2.2)}/><path d="M${f(-s * .7)} ${f(-s * .32)}q${f(s * .2)} ${f(-s * .38)} ${f(s * .5)} ${f(-s * .3)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.5" stroke-linecap="round"/>`, `animation-delay:${d}s`)}</g>`).join("")}`; }},
    // Legendary: a dark visor with a red light sweeping side to side
    {id: "laservisor", name: "Laser Visor", rarity: "legendary", def: "#1E1B26", anim: true, art: g => {
      const x0 = g.lx - g.R - Math.min(3.5, g.ext), x1 = g.rx + g.R + Math.min(3.5, g.ext), h = g.R * .8, d = rr(x0, g.y - h, x1 - x0, h * 2, h * .9), sx = f((x1 - x0) / 2 - h);
      return `${A("aura", `<path d="${d}" fill="none" stroke="#FF2E4D" stroke-width="3" opacity=".55"/>`)}<clipPath id="cpaVisor"><path d="${d}"/></clipPath><path d="${d}" ${WF} ${OUT(2.4)}/><g clip-path="url(#cpaVisor)">${[-.4, 0, .4].map(k => `<path d="M${f(x0)} ${f(g.y + k * h)}H${f(x1)}" stroke="#fff" stroke-opacity=".07" stroke-width=".6"/>`).join("")}
        ${A("scan", `<ellipse cx="${g.mx}" cy="${g.y}" rx="${f(h * 1.6)}" ry="${f(h * .9)}" fill="#FF2E4D" opacity=".28"/><ellipse cx="${g.mx}" cy="${g.y}" rx="${f(h * .8)}" ry="${f(h * .45)}" fill="#FF2E4D" opacity=".75"/><ellipse cx="${g.mx}" cy="${g.y}" rx="${f(h * .35)}" ry="${f(h * .22)}" fill="#FFD2D8"/>`, `--sx:${sx}px`)}</g>
        <path d="M${f(x0 + 3)} ${f(g.y - h * .55)}H${f(x1 - 3)}" stroke="#fff" stroke-opacity=".3" stroke-width="1" stroke-linecap="round"/>${tw(x0 - 1.5, g.y - h * 1.6, 2.6, 0)}${tw(x1 + 1.5, g.y + h * 1.4, 2.2, 1)}`; }}
  );
  NECK.push(
    // Rare: a scarf whose tails flutter in the breeze
    {id: "breezyscarf", name: "Breezy Scarf", rarity: "rare", def: "#FF9A3C", pat: true, anim: true, art: hw => {
      const e = f(hw + 4), k = f(hw * .45 - 9.5);
      return `<path d="M${-hw} -5Q0 2 ${hw} -5Q${e} 0 ${hw} 5.5Q0 12 ${-hw} 5.5Q${-e} 0 ${-hw} -5Z" ${WF} ${OUT(2.4)}/><path d="M${f(-hw + 2)} -1.5Q0 5 ${f(hw - 2)} -1.5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>
        <g transform="translate(${k} 0)">${A("flutter", `<path d="M7 3Q16 2 22 6Q26 9 30 7Q27 12 21 11Q15 10 8 8Z" ${WF} ${OUT(2.2)}/><path d="M6 6Q14 9 18 15Q21 19 25 19Q21 23 16 19Q11 15 5 10Z" ${WF} ${OUT(2.2)}/><path d="M25 8.6l2.6 1.4M27.6 7.6l2.2 .4M22 18.6l1.6 2.4M24.4 18.4l2.6 1" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`)}<circle cx="7" cy="4.6" r="4.2" ${WF} ${OUT(2.2)}/></g>`; }},
    // Epic: fireflies on a string that glow on and off, two drifting nearby
    {id: "fireflies", name: "Firefly Necklace", rarity: "exotic", def: "#D9FF6B", anim: true, art: hw => {
      const pts = along(hw, -2, 6.5, Math.max(6, Math.round(hw / 3.6)), .88);
      const fly = (x, y, d) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#3A5A3E" ${OUT(1)}/>${A("glow", `<circle cx="${x}" cy="${y}" r="6" ${WF} opacity=".5"/><circle cx="${x}" cy="${y}" r="3.4" ${WF} opacity=".8"/><circle cx="${x}" cy="${y}" r="2.2" fill="#FFFDE0"/>`, `animation-delay:${d}s`)}<ellipse cx="${f(+x - 1)}" cy="${f(+y - 1.6)}" rx="1.2" ry=".7" fill="#fff" opacity=".7"/><circle cx="${f(+x + 1)}" cy="${f(+y - 1.2)}" r=".7" fill="${INK}"/>`;
      return `<path d="${arcP(hw, -2, 6.5, .95)}" fill="none" stroke="#3A5A3E" stroke-width="1"/>${pts.map(([x, y], i) => fly(x, +y + 1.6, (-i * .63 % 3.2).toFixed(2))).join("")}${A("bob", fly(f(hw + 4), -8, -.6))}${A("bob", fly(f(-hw - 5), 2, -1.2), "animation-delay:-1.1s")}`; }},
    // Legendary: a scarf in moving northern lights
    {id: "aurorascarf", name: "Aurora Scarf", rarity: "legendary", def: "#4CFFB0", anim: true, art: hw => {
      const k = f(hw * .45 - 9.5), e = f(hw + 4), band = `M${-hw} -5Q0 2 ${hw} -5Q${e} 0 ${hw} 5.5Q0 12 ${-hw} 5.5Q${-e} 0 ${-hw} -5Z`, tail = `M${f(+k + 6)} 4L${f(+k + 9)} 21L${f(+k + 18)} 19.5L${f(+k + 13)} 3Z`;
      return `<defs><linearGradient id="cpaAur" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="6" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cp-wear,#4CFFB0)"/><stop offset=".5" stop-color="#4FD6FF"/><stop offset="1" stop-color="#C77BFF"/></linearGradient><clipPath id="cpaAurC"><path d="${band}"/><path d="${tail}"/></clipPath></defs>
        ${aura(0, 4, f(hw + 6), 12, "#4CFFB0")}<path d="${band}" fill="#2A1F5C"/><path d="${tail}" fill="#2A1F5C"/><g clip-path="url(#cpaAurC)">${A("flow", `<rect x="${f(-hw - 60)}" y="-8" width="${f(hw * 2 + 120)}" height="34" fill="url(#cpaAur)"/>`)}</g>
        <path d="${band}" fill="none" ${OUT(2.4)}/><path d="${tail}" fill="none" ${OUT(2.4)}/><path d="M${f(-hw + 2)} -1.5Q0 5 ${f(hw - 2)} -1.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>
        <circle cx="${f(+k + 9.5)}" cy="4" r="4.4" fill="#2A1F5C" ${OUT(2.4)}/><circle cx="${f(+k + 9.5)}" cy="4" r="2.2" ${WF}/>${tw(f(-hw - 3), -6, 2.8, 0)}${tw(f(+k + 20), 22, 2.6, 1)}${tw(f(hw * .2), 11, 2, 1.7)}`; }}
  );
  CHEST.push(
    // Epic: a heart that beats over a heart-monitor line
    {id: "heartbeat", name: "Heartbeat Pin", rarity: "exotic", at: "pin", slot: "chest", def: "#E5484D", anim: true, art: () =>
      `${A("beat", `${heart(0, -1.2, 6, WF, 1.8)}<path d="M-4 -4.6q1.2 -1.8 3 -1.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`)}
      <path d="M-11 7.6H-4.6L-3 4.4L-1 10.6L1.2 3.4L2.8 7.6H11" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>${A("ecg", `<path d="M-11 7.6H-4.6L-3 4.4L-1 10.6L1.2 3.4L2.8 7.6H11" fill="none" stroke="#4CFFB0" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>`)}`}
  );
  /* ---------------- More animated Legendaries: the ones students ask for ---------------- */
  HEAD.push(
  );
  FACE.push(
    // shades with a rainbow shimmer sweeping across the lenses
    {id: "holoshades", name: "Hologram Shades", rarity: "legendary", def: "#C0C6D4", anim: true, art: g => {
      const lens = R => `M${f(-R * 1.1)} ${f(-R * .7)}H${f(R * 1.05)}Q${f(R * 1.15)} ${f(R * .4)} ${f(R * .4)} ${f(R * .9)}Q${f(-R * .4)} ${f(R * 1.1)} ${f(-R * .95)} ${f(R * .5)}Q${f(-R * 1.2)} ${f(-R * .1)} ${f(-R * 1.1)} ${f(-R * .7)}Z`;
      return `<defs><linearGradient id="cpaHolo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="8" spreadMethod="reflect"><stop offset="0" stop-color="#FF7AC8"/><stop offset=".33" stop-color="#7CF5FF"/><stop offset=".66" stop-color="#B7FF7A"/><stop offset="1" stop-color="#B57BFF"/></linearGradient><clipPath id="cpaHoloC"><path d="${lens(g.R)}"/></clipPath></defs>
        ${bridge(g, 2.4, 1.6, WS("#C0C6D4"))}${temples(g, 1.4, WS("#C0C6D4"))}${pair(g, R => `<path d="${lens(R)}" fill="#3A3450"/><g clip-path="url(#cpaHoloC)">${A("flow", `<rect x="${f(-R * 6)}" y="${f(-R * 2)}" width="${f(R * 12)}" height="${f(R * 4)}" fill="url(#cpaHolo)" opacity=".85"/>`, "animation-duration:6s")}${A("sweep", `<path d="M${f(-R * .5)} ${f(-R * 1.2)}L${f(R * .1)} ${f(-R * 1.2)}L${f(-R * .5)} ${f(R * 1.2)}L${f(-R * 1.1)} ${f(R * 1.2)}Z" fill="#fff" opacity=".85"/>`, `--sw:${f(R * 2.6)}px`)}</g><path d="${lens(R)}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="${lens(R)}" fill="none" ${WS("#C0C6D4")} stroke-width="1.8" stroke-linejoin="round"/>${shine(R)}`)}
        ${tw(g.lx - g.R * 1.6, g.y - g.R * 1.3, 2.6, 0)}${tw(g.rx + g.R * 1.6, g.y + g.R, 2.2, 1)}`; }}
  );
  NECK.push(
  );
  CHEST.push(
  );
  /* ---------------- Animated, round two: motion big enough to see at companion size ---------------- */
  // a soft glow that breathes behind a Legendary
  const aura = (cx, cy, rx, ry, col) => A("aura", `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}" opacity=".35"/>`);
  const flameP = `<path d="M0 0C-3.4 -1 -3.6 -5 -1.2 -8.4C-1 -6 .4 -5.4 .6 -7.4C2.8 -5.4 3.6 -1.4 0 0Z"`;
  HEAD.push(
    // Legendary: a crown with lightning crackling between its points
    {id: "stormking", name: "Storm King Crown", rarity: "legendary", def: "#C9D6EA", anim: true, icon: [12, .85], art: () => {
      const bolt = (d, del) => A("arc", `<path d="${d}" fill="none" stroke="#7CF5FF" stroke-width="5.4" stroke-linejoin="round" opacity=".45"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#3FD0FF" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width=".7" stroke-linejoin="round"/>`, `animation-delay:${del}s`);
      return `${aura(0, -12, 21, 12, "#7CF5FF")}${bolt("M-16 -13L-12 -17L-9.6 -12.6L-5.6 -18L-2.4 -14L0 -18.6", 0)}${bolt("M16 -13L12 -17L9.6 -12.6L5.6 -18L2.4 -14L0 -18.6", -2.5)}${bolt("M-16 -13L-14 -20L-10 -18.6L-7 -24", -1.25)}${bolt("M16 -13L14 -20L10 -18.6L7 -24", -3.75)}
        <path d="M-14 3L-16 -13L-8 -5L0 -17L8 -5L16 -13L14 3Z" ${WF} ${OUT(2.4)}/><path d="M-9 -2.4L-11.6 -9" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/><rect x="-14.5" y="-1" width="29" height="6.6" rx="3" fill="#5B5670" ${OUT(2)}/>
        ${[-16, 0, 16].map((x, i) => `<circle cx="${x}" cy="${i === 1 ? -18 : -13.4}" r="2.4" fill="#7CF5FF" ${OUT(1.2)}/>`).join("")}${[-7, 0, 7].map(x => `<path d="M${x} -.2L${x + 1.6} 2.2L${x} 4.6L${x - 1.6} 2.2Z" fill="#9AF0FF"/>`).join("")}${tw(-20, -22, 2.8, 0)}${tw(20, -26, 2.4, .9)}`; }},
    // Legendary: a black hole above the head, its disc swirling round a glowing core
    {id: "blackhole", name: "Black Hole Halo", rarity: "legendary", def: "#B57BFF", anim: true, icon: [16, .85], art: () => {
      let dots = ""; for (let i = 0; i < 22; i++) { const a = i * Math.PI * 2 / 22, r = 9 + (i % 3) * 2.6; dots += `<ellipse cx="${f(r * Math.cos(a))}" cy="${f(r * Math.sin(a))}" rx="${f(3 - (i % 3) * .6)}" ry="${f(1.3 - (i % 3) * .25)}" transform="rotate(${f(a * 180 / Math.PI + 90)} ${f(r * Math.cos(a))} ${f(r * Math.sin(a))})" fill="${["#fff", "#FF7AC8", "#8E5BFF"][i % 3]}"/>`; }
      return `${aura(0, -21, 22, 9, "#B57BFF")}<g transform="translate(0 -21) scale(1 .34)">${A("vortex", `<circle r="17" fill="none" stroke="#B57BFF" stroke-opacity=".5" stroke-width="5"/>${dots}`)}</g>
        <ellipse cx="0" cy="-21" rx="17.6" ry="6" fill="none" ${WS("#B57BFF")} stroke-width="1.6"/><circle cx="0" cy="-22" r="5.2" fill="#0E0B18" stroke="#FFB3F0" stroke-width="1.4"/>${A("aura", `<circle cx="0" cy="-22" r="7" fill="none" stroke="#FF9AD5" stroke-width="1.2"/>`)}
        <path d="M-17.6 -21Q0 -16 17.6 -21" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>${tw(-21, -30, 2.8, 0)}${tw(20, -14, 2.4, 1)}`; }}
  );
  FACE.push(
    // Rare: spirals turning in the lenses
    {id: "hypno", name: "Hypno Specs", rarity: "rare", def: "#2B2233", anim: true, art: g => {
      const spiral = R => { let p = "", n = 40; for (let i = 0; i <= n; i++) { const t = i / n, a = t * Math.PI * 6, r = R * .86 * t; p += (i ? "L" : "M") + f(r * Math.cos(a)) + " " + f(r * Math.sin(a)); } return p; };
      return `${bridge(g, 2.4, 1.8, WS("#2B2233"))}${temples(g, 1.6, WS("#2B2233"))}${pair(g, R => `<circle r="${f(R)}" fill="#fff" stroke="${INK}" stroke-width="4.6"/>${A("spin", `<circle r="${f(R)}" fill="none"/><path d="${spiral(R)}" fill="none" stroke="#7C3AED" stroke-width="1.5" stroke-linecap="round"/>`, "animation-duration:5s")}<circle r="${f(R)}" fill="none" ${WS("#2B2233")} stroke-width="2.6"/>`)}`; }},
    // Epic: goggles with fire dancing over the lenses
    {id: "flamegoggles", name: "Flame Goggles", rarity: "exotic", def: "#FF7A2F", anim: true, art: g => {
      const fl = (x, s, d) => `<g transform="translate(${f(x)} ${f(-g.R * .72)}) scale(${s})">${A("flicker", `${flameP} fill="#FF5A2B" ${OUT(.9)}/><path d="M0 -.6C-1.6 -1.2 -1.6 -3.2 -.4 -4.8C.2 -3.6 1.6 -3 1.4 -2C1.4 -1.2 .8 -.6 0 -.6Z" fill="#FFE07A"/>`, `animation-delay:${d}s`)}</g>`;
      return `${line2(`M${f(g.lx - g.R * 1.1 - Math.min(5, g.ext))} ${g.y}H${f(g.rx + g.R * 1.1 + Math.min(5, g.ext))}`, 2.4, "#3A3450")}${pair(g, R => `${fl(-R * .5, R / 6.5, 0)}${fl(R * .1, R / 5, -.55)}${fl(R * .65, R / 7, -1)}<circle r="${f(R * 1.08)}" fill="#3A1A10" stroke="${INK}" stroke-width="5"/><circle r="${f(R * .82)}" fill="#FF9A3C" opacity=".55"/><circle r="${f(R * 1.08)}" fill="none" ${WS("#FF7A2F")} stroke-width="2.8"/>${shine(R)}`)}`; }}
  );
  NECK.push(
    // Legendary: a ghostly blue scarf with flames rising off it
    {id: "spiritflame", name: "Spirit Flame Scarf", rarity: "legendary", def: "#4FD6FF", anim: true, art: hw => {
      const e = f(hw + 4), band = `M${-hw} -5Q0 2 ${hw} -5Q${e} 0 ${hw} 5.5Q0 12 ${-hw} 5.5Q${-e} 0 ${-hw} -5Z`;
      const fl = along(hw, -3.6, 3.3, Math.max(6, Math.round(hw / 3.2)), .92).map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(${i % 2 ? 1.3 : 1.75})">${A("rise", `${flameP} fill="#7CF5FF" opacity=".85"/><path d="M0 -.6C-1.6 -1.2 -1.6 -3.2 -.4 -4.8C.2 -3.6 1.6 -3 1.4 -2C1.4 -1.2 .8 -.6 0 -.6Z" fill="#fff"/>`, `animation-delay:${(-i * .41 % 2.6).toFixed(2)}s`)}</g>`).join("");
      const k = f(hw * .45 - 9.5);
      return `${aura(0, 2, f(hw + 6), 11, "#4FD6FF")}${fl}<path d="${band}" ${WF} ${OUT(2.4)}/><path d="${band}" fill="#fff" opacity=".18"/><path d="M${f(-hw + 2)} -1.5Q0 5 ${f(hw - 2)} -1.5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>
        <g transform="translate(${k} 0)">${[[8, 22, 1], [13, 20, -.4]].map(([x, y, d]) => `<g transform="translate(${x} ${y}) scale(1.6)">${A("flicker", `${flameP} ${WF} ${OUT(.9)}/><path d="M0 -.6C-1.6 -1.2 -1.6 -3.2 -.4 -4.8C.2 -3.6 1.6 -3 1.4 -2C1.4 -1.2 .8 -.6 0 -.6Z" fill="#fff"/>`, `animation-delay:${d}s`)}</g>`).join("")}<path d="M6 4L8.6 19L14 18.4L13 3Z" ${WF} ${OUT(2.2)}/><circle cx="9.5" cy="4" r="4.2" ${WF} ${OUT(2.2)}/></g>${tw(f(-hw - 3), -8, 2.8, 0)}${tw(f(hw + 3), 6, 2.4, 1)}`; }}
  );
  CHEST.push(
    // Rare: a pinwheel that spins
    {id: "pinwheel", name: "Pinwheel Pin", rarity: "rare", at: "pin", slot: "chest", def: "#FF5C8A", anim: true, art: () =>
      `<g transform="scale(1.35)">${A("spin", `<circle r="9" fill="none"/>${[0, 90, 180, 270].map((a, i) => `<g transform="rotate(${a})"><path d="M0 0L0 -8.6Q5 -8.6 5.6 -3.4Z" ${i % 2 ? `fill="${["#FFD35A", "#5A95FF"][i >> 1]}"` : WF} ${OUT(1.3)}/></g>`).join("")}`, "animation-duration:3.6s")}<circle r="1.6" fill="#fff" ${OUT(1)}/></g>`},
    // Legendary: a plasma core, its rings spinning opposite ways round a pulsing heart
    {id: "plasmacore", name: "Plasma Core", rarity: "legendary", at: "mid", slot: "chest", def: "#4FD6FF", anim: true, art: () =>
      `${aura(0, 0, 13, 13, "#4FD6FF")}<circle r="9.6" fill="#1E1B26" ${OUT(1.8)}/>${A("spin", `<circle r="8" fill="none" ${WS("#4FD6FF")} stroke-width="2" stroke-dasharray="4 2.3"/>`, "animation-duration:7s")}
      ${A("spinr", `<circle r="5.4" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.2" stroke-dasharray="2 1.6"/>`)}${A("aura", `<circle r="3.6" ${WF}/>`)}<circle r="2" fill="#fff"/>${tw(-12, -9, 2.8, 0)}${tw(12, 8, 2.4, 1)}`},
    // Legendary: a gold star medal with rays of light turning behind it
    {id: "supernova", name: "Supernova Medal", rarity: "legendary", at: "mid", slot: "chest", def: "#F5C542", anim: true, art: () => {
      let rays = ""; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays += `<path d="M0 0L${f(19 * Math.cos(a - .14))} ${f(19 * Math.sin(a - .14))}L${f(19 * Math.cos(a + .14))} ${f(19 * Math.sin(a + .14))}Z" fill="#FFE58A" opacity="${i % 2 ? .55 : .9}"/>`; }
      return `<path d="M-3 4L-6 14L-3 12.4L-1.4 14.6L.4 6ZM3 4L6 14L3 12.4L1.4 14.6L-.4 6Z" fill="#E5484D" ${OUT(1.2)}/><g transform="translate(0 -1)">${A("spin", `<circle r="19" fill="none"/>${rays}`, "animation-duration:16s")}</g>
        <circle cy="-1" r="7.4" ${WF} ${OUT(1.6)}/><circle cy="-1" r="5.6" fill="none" stroke="${GOLD_D}" stroke-width="1"/>${star(0, -1, 4.2, "#FFF3B0", .8)}${tw(-13, -12, 2.8, 0)}${tw(13, 9, 2.6, 1)}${tw(11, -14, 2, 1.7)}`; }}
  );
  HEAD.forEach(a => { a.slot = "head"; }); FACE.forEach(a => { a.slot = "face"; }); NECK.forEach(a => { a.slot = "neck"; });
  return HEAD.concat(FACE, NECK, CHEST);
};
